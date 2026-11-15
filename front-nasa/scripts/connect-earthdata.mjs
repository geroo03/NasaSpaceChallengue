import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, rename, chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// Local setup only. Credentials go directly to NASA; only the short-lived AppEEARS token is saved.
const envFile = fileURLToPath(new URL('../.env.local', import.meta.url));
const nonce = randomBytes(24).toString('hex');
const api = 'https://appeears.earthdatacloud.nasa.gov/api';
let complete = false;
let connecting = false;
async function updateEnv(token) {
  let previous = '';
  try { previous = await readFile(envFile, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const secretExists = /^\s*APPEEARS_JOB_SECRET\s*=\s*\S+/m.test(previous);
  const retained = previous.split(/\r?\n/).filter((line) => !token || !/^\s*(?:APPEEARS_TOKEN|EARTHDATA_USERNAME|EARTHDATA_PASSWORD)\s*=/.test(line));
  if (!secretExists) retained.push(`APPEEARS_JOB_SECRET=${randomBytes(32).toString('hex')}`);
  if (token) retained.push(`APPEEARS_TOKEN=${JSON.stringify(token)}`);
  const temporary = `${envFile}.new-${randomBytes(6).toString('hex')}`;
  await writeFile(temporary, retained.join('\n').replace(/^\n+|\n+$/g, '') + '\n', { mode: 0o600 });
  await rename(temporary, envFile); await chmod(envFile, 0o600);
}

const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar NASA · Field Shift</title>
<style>body{font:17px/1.5 system-ui;background:#f0ede4;color:#283618;margin:0;padding:24px}main{max-width:620px;margin:30px auto;background:#fff;padding:28px;border-radius:20px}h1{font-size:28px}label{display:block;font-weight:700;margin-top:16px}input{box-sizing:border-box;width:100%;padding:12px;margin-top:5px;border:1px solid #a3b18a;border-radius:8px;font-size:17px}button,.link{display:inline-block;padding:12px 16px;border-radius:10px;margin-top:18px;background:#283618;color:#fff;font-size:17px;border:0;cursor:pointer}.link{background:#efe3c2;color:#283618}small{display:block;margin-top:18px}#result{white-space:pre-line}button:disabled{opacity:.6}</style>
<main><h1>Conectar NASA Earthdata</h1><p>Para usar datos reales de ECOSTRESS en la demo.</p>
<ol><li>Creá la cuenta gratuita de NASA y activala desde el enlace que llega a tu correo.</li><li>Entrá una vez a AppEEARS con esa cuenta y completá la autorización que te solicite NASA.</li><li>Volvé a esta ventana y conectá la cuenta.</li></ol>
<a class="link" href="https://urs.earthdata.nasa.gov/users/new" target="_blank" rel="noreferrer">1. Crear cuenta NASA ↗</a> <a class="link" href="https://appeears.earthdatacloud.nasa.gov/" target="_blank" rel="noreferrer">2. Entrar a AppEEARS ↗</a>
<form id="form"><label>Usuario de Earthdata<input name="username" autocomplete="username" required maxlength="100"></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required maxlength="500"></label><button id="submit">3. Conectar la demo</button></form>
<p id="result" role="status" aria-live="polite"></p><small>Esta pantalla funciona únicamente en tu equipo. La contraseña se usa para ingresar a NASA; no se guarda. Se guarda un token temporal de AppEEARS en .env.local, excluido de Git. No hace falta pegar credenciales en el chat.</small></main>
<script nonce="${nonce}">document.querySelector('#form').addEventListener('submit',async(e)=>{e.preventDefault();const button=document.querySelector('#submit');const result=document.querySelector('#result');button.disabled=true;result.textContent='Conectando con NASA…';const body=new URLSearchParams(new FormData(e.target));body.set('nonce','${nonce}');try{const r=await fetch('/connect',{method:'POST',body});const data=await r.json();if(!r.ok)throw new Error(data.error);e.target.reset();result.textContent='Cuenta conectada. El token temporal quedó guardado en tu equipo. Volvé al chat para completar la prueba de ECOSTRESS.';}catch(err){result.textContent=err.message;}finally{button.disabled=false;}});</script></html>`;

await updateEnv();
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`);
  const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html); }
  if (req.method === 'GET' && req.url === '/status') return json(200, { configured: complete });
  if (req.method !== 'POST' || req.url !== '/connect') return json(404, { error: 'No disponible.' });
  if (req.headers.origin !== `http://${req.headers.host}`) return json(403, { error: 'Abrí esta pantalla desde su dirección local.' });
  if (connecting) return json(429, { error: 'Hay una conexión en curso. Esperá unos segundos.' });
  try {
    let raw = '';
    for await (const chunk of req) { raw += String(chunk); if (raw.length > 8000) throw new Error('Solicitud demasiado grande.'); }
    const form = new URLSearchParams(raw); const supplied = Buffer.from(form.get('nonce') ?? ''); const expected = Buffer.from(nonce);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return json(403, { error: 'Recargá esta pantalla local.' });
    const username = form.get('username')?.trim(); const password = form.get('password');
    if (!username || !password || /[:\r\n]/.test(username)) return json(400, { error: 'Revisá el usuario y la contraseña.' });
    connecting = true;
    const response = await fetch(`${api}/login`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` }, signal: AbortSignal.timeout(25000) });
    if (!response.ok) return json(400, { error: 'NASA no aceptó el ingreso. Confirmá el enlace de activación del correo, el usuario y la contraseña. Entrá a AppEEARS para completar cualquier autorización pendiente.' });
    const auth = await response.json();
    if (typeof auth.token !== 'string' || !/^[A-Za-z0-9._~+\/-]+={0,2}$/.test(auth.token)) throw new Error('NASA no devolvió un token de AppEEARS válido.');
    const check = await fetch(`${api}/task?limit=1`, { headers: { Authorization: `Bearer ${auth.token}` }, signal: AbortSignal.timeout(25000) });
    if (!check.ok) return json(400, { error: 'La cuenta ingresó, pero falta habilitar AppEEARS. Abrí AppEEARS, iniciá sesión y completá la autorización; después reintentá.' });
    await updateEnv(auth.token); complete = true;
    console.log('Earthdata conectado: token temporal guardado; contraseña no almacenada.');
    return json(200, { ok: true });
  } catch { return json(502, { error: 'No pudimos completar la conexión con NASA. Revisá tu conexión e intentá otra vez.' }); }
  finally { connecting = false; }
});
server.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`Configuración local de Earthdata: ${url}`);
  if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore' }).unref();
});
setTimeout(() => server.close(), 30 * 60_000).unref();
