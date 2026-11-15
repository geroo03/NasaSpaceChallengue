# Field Shift — aplicación web

> **Prototipo anterior (primer maquetado).** No es la app actual. La app de Field Shift está en [`front-nasa/`](../../front-nasa/) de este repositorio y publicada en https://field-shift-lab.vercel.app.

Prototipo Vite/TypeScript para explorar rotaciones a dos años. La documentación principal y el stack de trabajo están en el [README de la raíz](../../README.md). Las instrucciones para Claude están en [CLAUDE.md](../../CLAUDE.md).

## Ejecutar desde esta carpeta

```sh
npm ci
npm run dev
```

Usar Node.js 24 y npm. Abrir la URL indicada por Vite para cargar los módulos TypeScript.

```sh
npm test
npm run build
npm run preview
```

`build` incluye el typecheck y genera `dist/`. `preview` sirve esa salida después de compilar.

## Código

| Ruta | Función |
| --- | --- |
| `index.html` | Estructura y anclas del DOM |
| `src/main.ts` | Interfaz, estado y eventos |
| `src/styles.css` | Estilos responsive |
| `src/i18n.ts` | Textos ES/EN |
| `src/data/power.ts` | Cliente/parser POWER |
| `src/analysis/climate.ts` | Indicadores y escenarios |
| `src/domain/crops.ts` | Catálogo genérico |
| `src/domain/rotations.ts` | Calendarios, reglas y puntajes |
| `src/test/` | Pruebas y fixtures sintéticos |

La interfaz utiliza HTML/CSS y DOM desde TypeScript, Leaflet y Chart.js. El motor se mantiene separado de la red y del render.

## Estado

En la revisión del 14 de noviembre de 2026 pasaron 24 pruebas y el build. Se reprodujo el motor con POWER 2011–2025 para el punto predeterminado y dos escenarios. La documentación conserva los registros de esa ejecución, sin atribuirles validación agronómica o de usabilidad completa.

POWER es la fuente numérica. GIBS agrega capas visuales. El punto seleccionado no equivale a un polígono de lote ni a una medición de campo. La oferta hídrica es una aproximación con supuestos y la ET₀ se calcula mediante Hargreaves.

La UI y el motor conservan pendientes de revisión descritos en [la auditoría](../../docs/AUDITORIA_ESTRATEGICA_NASA.md): fechas de referencia optimizadas, indicador de helada, meses sin cultivo y puntajes genéricos. Las correcciones documentadas todavía no fueron aplicadas a las fuentes originales.

SMAP numérico, ECOSTRESS, HLS, AppEEARS, downscaling, SMS, LLM e intercultivo sorgo–caupí no están implementados. El trabajo siguiente está definido en [el prompt para Claude](../../docs/PROMPT_PARA_CLAUDE.md).
