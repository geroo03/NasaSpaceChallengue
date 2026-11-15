# Backend de AgroField

Adaptado de AgroCordS: Supabase (Postgres + Auth con link al mail + RLS). En AgroCordS el backend es un servidor Express; acá es una función de Vercel (`front-nasa/api/v1.ts`), así vive en el mismo link que la app.

Mientras no se configure, la app funciona como antes: perfil guardado solo en el dispositivo. `GET /api/v1/estado` responde `{"configured": false}`.

## Qué guarda

| Tabla | Qué es |
| --- | --- |
| `perfiles` | Nombre, establecimiento e idioma de cada usuario |
| `drones` | Drones propios (modelo, cámara, pulverización, siembra). Un solo dron activo por usuario |
| `lotes` | Límite del lote (GeoJSON), superficie, origen del archivo, pendiente y agua útil |
| `analisis` | Cada vez que el usuario ve "Tus opciones": qué cargó y qué le mostró la app (snapshot inmutable) |
| `pedidos_dron` | Planes con dron propio y pedidos a Vuelo Verde: trabajo, canal, texto enviado y estado |
| `actividad` | Historial de todo lo anterior. Solo lo escribe el backend |

Esquema: [front-nasa/supabase/migrations/20261115180000_agrofield_inicial.sql](../front-nasa/supabase/migrations/20261115180000_agrofield_inicial.sql).

## API (`/api/v1`, requiere sesión)

`Authorization: Bearer <token de la sesión de Supabase>`. El usuario sale solo del token verificado, nunca del cuerpo.

| Ruta | Métodos |
| --- | --- |
| `/perfil` | GET, PUT |
| `/drones`, `/drones/:id` | GET, POST · PATCH, DELETE |
| `/lotes`, `/lotes/:id` | GET, POST · GET, PATCH, DELETE |
| `/analisis` (`?lote=:id`) | GET, POST |
| `/pedidos`, `/pedidos/:id` | GET, POST · PATCH `{estado}` |
| `/actividad` | GET |

Código: `front-nasa/server/v1/` (router puro, validación con zod, repositorio Supabase y repositorio en memoria para tests). Tests: `server/v1/router.test.ts`.

## Activarlo (unos 15 minutos)

1. **Crear el proyecto** en Supabase (organización "hackatoh", región São Paulo, plan gratis).
2. **Crear las tablas:** pegar el archivo de migración entero en *SQL Editor* → *Run*.
3. **Ingreso por mail:** en *Authentication → URL Configuration*, poner *Site URL* = `https://field-shift-lab.vercel.app` y sumar en *Redirect URLs* `http://localhost:5173/` para desarrollo. El link al mail ya viene activado.
4. **Variables en Vercel** (*Settings → Environment Variables*, Production y Preview), desde *Project Settings → API* de Supabase:
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (solo servidor: **nunca** con prefijo `VITE_`).
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (navegador; la anon key es pública por diseño, RLS protege los datos).
5. **Redeploy** en Vercel. Comprobar: `https://field-shift-lab.vercel.app/api/v1/estado` → `{"configured": true}`.

Correos: el plan gratis de Supabase manda pocos mails por hora. Para una semana con mucha gente, configurar un SMTP propio en *Authentication → SMTP Settings* (por ejemplo Resend o Brevo, gratis).
