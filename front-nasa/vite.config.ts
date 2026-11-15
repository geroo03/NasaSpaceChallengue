import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { createHandler } from './api/ecostress.ts';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return { plugins: [react(), tailwindcss(), {
    name: 'local-ecostress-api',
    configureServer(server) {
      const handler = createHandler(env);
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/ecostress') return next();
        void handler(req, res);
      });
    },
  }] };
});
