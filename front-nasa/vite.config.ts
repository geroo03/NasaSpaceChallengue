import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHandler } from './api/ecostress.ts';
import { createBackendHandler } from './server/v1/http.ts';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return { plugins: [react(), tailwindcss(), precacheServiceWorker(), {
    name: 'local-ecostress-api',
    configureServer(server) {
      const handler = createHandler(env);
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/ecostress') return next();
        void handler(req, res);
      });
      const backend = createBackendHandler(env);
      server.middlewares.use((req, res, next) => {
        const p = req.url?.split('?')[0] ?? '';
        if (p !== '/api/v1' && !p.startsWith('/api/v1/')) return next();
        void backend(req, res);
      });
    },
  }] };
});

/**
 * Injects the list of built JS/CSS files and a per-build cache version into dist/sw.js,
 * so the first visit already stores everything the app needs to open offline.
 */
function precacheServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'precache-service-worker',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    writeBundle(_opts, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css)$/.test(f))
        .map((f) => `/${f}`)
        .sort();
      const version = `fs-${createHash('sha256').update(files.join('|')).digest('hex').slice(0, 12)}`;
      const path = join(outDir, 'sw.js');
      const src = readFileSync(path, 'utf8');
      if (!src.includes("const VERSION = 'fs-dev';") || !src.includes('const BUILD_FILES = [];')) throw new Error('sw.js placeholders not found');
      writeFileSync(path, src.replace("const VERSION = 'fs-dev';", `const VERSION = '${version}';`).replace('const BUILD_FILES = [];', `const BUILD_FILES = ${JSON.stringify(files)};`));
    },
  };
}
