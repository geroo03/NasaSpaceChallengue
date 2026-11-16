# Instrucciones para trabajar en AgroField

AgroField (antes Field Shift) es el proyecto del equipo para NASA Space Apps 2026, desafío *Adapting Farms with NASA Data*. Compara rotaciones de cultivos a dos años para el secano de Santiago del Estero con datos de la NASA y el lote real del productor. Añatuya es un piloto propuesto con Vuelo Verde, no un lote validado.

- **App:** https://field-shift-lab.vercel.app (Vercel, proyecto `field-shift-lab`, Root Directory `front-nasa`, despliegue automático desde `main`).
- **Repositorio:** `geroo03/NasaSpaceChallengue`. El repo viejo `geroo03/nasa` solo avisa que el proyecto se mudó.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `front-nasa/` | **La app actual.** Convenciones y detalle en `front-nasa/README.md` |
| `docs/` | Entrega (`docs/entrega/`), revisiones (`docs/revisiones/`), backend (`docs/BACKEND.md`), ECOSTRESS (`docs/INTEGRACION_ECOSTRESS.md`) |
| `marca/` | Logo, íconos y videos de AgroField. `marca/_front-src.tgz` está excluido de Git: contiene un `.env.local` con credenciales |
| `material/` | Material de terceros. El informe técnico de Vuelo Verde es solo local: **no publicarlo** |
| `prototipo/` | Primer maquetado (TypeScript sin framework). Solo referencia histórica |
| `Field Shift - Obsidian/` | Vault del equipo (investigación, decisiones, presentación) |

## Stack de `front-nasa/`

React 19, TypeScript estricto (`noUnusedLocals`/`noUnusedParameters`), Vite, Tailwind CSS 4, Leaflet + Leaflet-Geoman (necesita `L` global: `src/lib/leaflet.ts`), Turf, proj4, geotiff.js, shpjs, dxf-parser, zod, `@supabase/supabase-js` y Vitest. Node 20 o más; instalar con `npm ci`.

Documentación en español; identificadores en inglés; textos de la UI en ES/EN (`src/i18n/ui.ts` y `src/i18n/uiLot.ts`). La app abre en inglés y recuerda la elección ES/EN. Fondo `#f0ede4`, títulos en Raleway, header y footer en verde `#283618`.

## Mapa del código

| Ruta | Responsabilidad |
| --- | --- |
| `src/engine/` | Motor puro: NASA POWER, perfil climático, cultivos, rotaciones (sin React) |
| `src/case/` | Caso del productor → motor (`toFarmContext` reporta cada supuesto), suelo, El Niño, calor, balance de agua, riego, drones, pronóstico, Vuelo Verde |
| `src/imagery/` | Relieve SRTM, HLS, DSM/ortomosaicos y vigor (NDVI) de dron, CRS/POSGAR, planos, KML |
| `src/components/` | `flow/` pantallas 1–2, `lot/` lote y drones, `results/` pantalla 3 y ficha |
| `src/profile/` | Ingreso, perfil, dron propio, historial |
| `src/backend/` | Cliente Supabase (link al mail), llamadas a `/api/v1`, registro del historial |
| `src/ecostress/`, `server/ecostress*.ts`, `api/ecostress.ts` | ECOSTRESS (función opcional con token Earthdata) |
| `server/v1/`, `api/v1.ts`, `supabase/migrations/` | Backend: router puro, validación zod, repositorio Supabase y en memoria, esquema SQL |
| `public/sw.js` | Service worker: precarga el build (lista inyectada en `vite.config.ts`) y abre sin señal |

Mantener los cálculos puros en `engine/`, `case/` e `imagery/`; las solicitudes HTTP en sus módulos de datos; la UI sin lógica científica.

## Backend

Supabase (Postgres + Auth con link al mail + RLS) detrás de una función de Vercel, adaptado de AgroCordS. Guía de activación: `docs/BACKEND.md`.

- Sin `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (servidor) y `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (navegador), la app funciona en **modo local**: perfil en el dispositivo, sin cuentas. `GET /api/v1/estado` lo informa.
- El usuario sale **solo** del token verificado, nunca del cuerpo. Cada consulta filtra por `user_id`; RLS queda como respaldo.
- La service role key, `EARTHDATA_TOKEN` y cualquier credencial van solo en el servidor (sin `VITE_`), nunca en el repo, el chat ni el navegador.

## Criterios científicos y de producto

1. Identificar fuente, período, unidad, escala y método. Diferenciar observado, modelado, supuesto y desconocido. Mantener los desconocidos como tales (por ejemplo, carbono orgánico faltante no es cero).
2. ET₀ por Hargreaves; no llamarlo Penman–Monteith. Distinguir ET₀, ET real (ECOSTRESS, mm/día, sin conversión), demanda del cultivo y agua aplicada.
3. **Oferta de agua del índice:** 75 % de la lluvia + agua útil del suelo × humedad POWER al sembrar + riego efectivo (lámina × eficiencia del sistema: goteo 0,9, aspersión 0,75, superficie 0,6). Agua útil: análisis del productor (válido solo en su lote, se descarta a más de 1 km), si no SoilGrids con el perfil completo 0–100 cm, si no 120 mm supuestos.
4. **Balance diario:** dos capas sobre el registro real, **en secano** (no incluye riego), con inicio de rotación según el hemisferio. No está calibrado con mediciones.
5. Los puntajes son índices orientativos, no probabilidades ni rentabilidad. Las sensibilidades de lluvia y temperatura son perturbaciones, no pronósticos.
6. El Niño / La Niña: fase de cada campaña con el ONI de NOAA. Pocas campañas por fase: es referencia, no pronóstico.
7. Pronóstico de 7 días (Open-Meteo): es un pronóstico, no una medición; la decisión es del productor y su agrónomo.
8. Drones: la prescripción NDVI exporta solo píxeles válidos dentro del lote y el total en pantalla sale del mismo archivo. Una foto RGB no es multiespectral. Producto y dosis siempre con receta agronómica.
9. No introducir ahorros porcentuales, pérdidas evitadas, testimonios ni validaciones sin evidencia reproducible. Los números de los videos son de ejemplo y lo dicen.
10. No usar logos ni marcas de la NASA junto a la marca AgroField (regla de Space Apps).

## Validación

Desde `front-nasa/`:

```sh
npm test         # 171 pruebas: motor, caso, suelo, clima, drones, planos, ECOSTRESS, backend
npm run build    # typecheck + build + lista de precarga del service worker
```

Agregar pruebas de regresión cuando cambien fórmulas, selección o manejo de datos. Para la UI, verificar en 360 px y 1366 px, ES/EN, carga, error y sin señal. Si algo no pudo verificarse, decirlo.

## Entrega del trabajo

Informar cambios, archivos principales, comprobaciones y limitaciones. Actualizar README y documentación cuando cambie una integración. Conservar los cambios de otras herramientas (Codex trabaja en el mismo árbol): commitearlos por separado, sin `reset` ni `clean`. Publicar o cambiar cosas remotas solo dentro de lo autorizado por el usuario.
