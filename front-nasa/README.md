# AgroField

**Decidir antes de sembrar, con datos de la NASA y el lote de cada productor.** App web que compara rotaciones de cultivos a 24 meses para el secano de Santiago del Estero (Argentina). Proyecto para NASA Space Apps 2026, desafío *Adapting Farms with NASA Data*.

- **App:** https://field-shift-lab.vercel.app. Se instala en el teléfono o la tablet y funciona sin señal con lo ya consultado.
- **Proyecto:** esta carpeta es parte de [NasaSpaceChallengue](https://github.com/geroo03/NasaSpaceChallengue), junto con el vault, los documentos, la entrega y el material (carpetas hermanas).

## Cómo se usa: 3 pantallas

1. **Tu lote** (`#/lote`): se dibuja el lote sobre imagen satelital o se carga el plano (KML/KMZ, Shapefile .zip, GeoJSON, o DXF de mensura en POSGAR 2007 / UTM). La app calcula superficie, centro (punto del clima), relieve (NASA SRTM) y suelo (SoilGrids). Un DSM de dron o un análisis de suelo reemplazan esas estimaciones. «Probar con el lote de ejemplo» carga 46 ha cerca de Añatuya.
2. **Tu campaña** (`#/campana`): cultivo actual, riego (el único recurso que hoy entra al cálculo) y prioridades.
3. **Tus opciones** (`#/opciones`):
   - el manejo actual contra la alternativa mejor puntuada, con por qué aparece y qué tener en cuenta;
   - años de prueba: campañas Niño o Niña, más seco, más caluroso;
   - calor en la floración y agua en el suelo al sembrar, campaña por campaña;
   - calendario de 24 meses y el campo mes a mes;
   - qué verificar y cuándo, con el pedido de relevamiento con dron;
   - **trabajos con dron**: mapeo, siembra de cultivos de servicio y pulverización, planificados sobre el calendario;
   - una **ficha imprimible / PDF** para el técnico o el piloto.

   Lo técnico (índices, clima, descartadas, fuentes) queda plegado en «¿De dónde sale esto?».

## Datos

| Fuente | Uso |
| --- | --- |
| NASA POWER (diario: Tmax, Tmin, lluvia, humedad de suelo) | Perfil climático, ET₀, heladas, calor, agua y El Niño por campaña |
| NASA SRTM (~30 m, AWS Terrain Tiles) | Relieve y pendiente del lote; la pendiente entra al cálculo |
| NASA HLS vía GIBS y CMR · MODIS NDVI · SMAP L4 | Imagen del lote y capas regionales (no entran al cálculo) |
| NASA ECOSTRESS ECO_L3T_JET.002 | Catálogo de pasadas y valores ETdaily por punto; filtros cloud/water; evidencia complementaria y ficha |
| ISRIC SoilGrids 2.0 | Agua útil 0–100 cm, textura y carbono orgánico del lote |
| NOAA CPC ONI | Fase de El Niño / La Niña de cada campaña y estado actual observado |

POWER, suelo, relieve y catálogos se consultan desde el navegador sin claves. **ECOSTRESS agrega una función de servidor opcional**, `/api/ecostress`, que permite extraer píxeles de COG con un token Earthdata o tramitar tareas de AppEEARS. Sin configurarla, funcionan el catálogo, el CSV local y la extracción real guardada del ejemplo. Los archivos del productor (planos, DSM, ortomosaicos y CSV) se procesan en su equipo, sin subirlos. En `public/data/` hay respuestas guardadas sin modificar para el ejemplo:
- NASA POWER 2011–2025 del punto de Santiago del Estero y del lote de ejemplo;
- SoilGrids del lote de ejemplo.

### ECOSTRESS

Para conectar una cuenta desde una pantalla local, ejecutar `npm run connect:earthdata`. Abre una pantalla local con enlaces al registro oficial y a AppEEARS; una vez activada la cuenta, valida el ingreso contra NASA y guarda únicamente un token temporal en `.env.local` (permisos privados, excluido de Git). No almacena la contraseña. El alta y la activación por correo se completan en NASA. Después reiniciar `npm run dev`.

En **Tus opciones → El agua que evapora tu campo: ECOSTRESS**, abrir «Consultar o cargar ECOSTRESS». Se puede buscar pasadas NASA sin cuenta y cargar un CSV de Point Sample de AppEEARS con `ETdaily`, `cloud` y `water` del producto **ECO_L3T_JET.002**. Las observaciones válidas quedan guardadas por punto y aparecen en la ficha imprimible. El catálogo no garantiza que un píxel esté libre de nubes.

Para la extracción directa, configurar en Vercel (Root Directory: `front-nasa`) **`EARTHDATA_TOKEN`**. Alternativamente, para AppEEARS usar **`EARTHDATA_USERNAME` y `EARTHDATA_PASSWORD`**, o un **`APPEEARS_TOKEN`** válido. Agregar `APPEEARS_JOB_SECRET` como secreto largo. Son variables de servidor, **sin prefijo `VITE_`**. Después se necesita un nuevo despliegue. En local, copiar `.env.example` a `.env.local` y reiniciar `npm run dev`; Vite sirve el mismo endpoint local. Los tokens de AppEEARS vencen; con usuario/contraseña se renuevan al iniciar nuevas conexiones.

**Unidades:** ETdaily se conserva en **mm/día**, según el algoritmo y la validación científica de Collection 2. El catálogo de AppEEARS y una tabla de la guía lo etiquetan W/m² de forma inconsistente con el método; ver la explicación y fuentes de la guía técnica. No se aplica una conversión energética ni se sustituye ET₀ de Hargreaves. Solo se admite versión 002.

Ver [guía técnica y verificación](../docs/INTEGRACION_ECOSTRESS.md). La descarga directa autenticada ya fue verificada en el ejemplo: 5 pasadas, 2 valores válidos y 3 faltantes. El botón «Usar extracción NASA guardada» carga esos valores reales con sus fechas, sin necesitar credenciales ni una nueva descarga para la presentación.

## Supuestos (visibles en la app)

- ET₀ por Hargreaves (solo temperatura), no Penman–Monteith.
- **Oferta de agua del índice:** 75 % de la lluvia + agua útil del suelo × humedad POWER al sembrar + riego. El agua útil sale, en este orden, del análisis del productor, de SoilGrids o de 120 mm supuestos. La reserva se reinicia en cada cultivo.
- **Balance diario complementario:** dos capas sobre el registro real. Un barbecho sin malezas pierde solo la capa superficial. No está calibrado con mediciones.
- Índices de 0 a 100 orientativos: no son probabilidades ni rentabilidad.
- «Meses sin cultivo programado» sale del calendario: no es suelo desnudo observado.
- **El Niño:** hay pocas campañas por fase (5, 4 y 5). Es una referencia, no un pronóstico.
- **Trabajos con dron:**
  - el mapeo usa la cámara RGB del DJI Mavic 3M (resolución = altura / 36,5 cm);
  - la pulverización usa los parámetros del informe de Vuelo Verde;
  - los valores sin fuente están marcados como ejemplo;
  - producto y dosis van siempre con receta agronómica.

## Ejecutar

```sh
git clone https://github.com/geroo03/NasaSpaceChallengue && cd NasaSpaceChallengue/front-nasa
npm ci
npm run dev        # servidor local
npm test           # motor, caso, suelo, clima, drones, planos y ECOSTRESS
npm run build      # typecheck + build estático en dist/
```

Node 20 o más. Opcional: `VITE_VUELO_VERDE_WHATSAPP` en Vercel activa el botón de WhatsApp del pedido de dron. Ningún contacto queda escrito en el código.

## Estructura

```text
src/
  engine/       Motor puro (sin React): NASA POWER, perfil climático, cultivos y rotaciones
  case/         Caso del productor → motor (con supuestos), suelo, El Niño, calor, agua, drones, verificación
  imagery/      Relieve SRTM, HLS, DSM y ortomosaicos de dron, CRS/POSGAR, importación de planos, KML
  components/
    flow/       Pantallas 1 y 2, navegación, estado sin señal
    lot/        Editor del lote, terreno, suelo, pedido y trabajos con dron
    results/    Pantalla 3, gráficos, ficha imprimible, mapa e imágenes del lote
  i18n/         Textos ES/EN
  data/         ONI de NOAA (guardado)
  ecostress/    Contrato, calidad y lectura de CSV; catálogo NASA y almacenamiento por punto
  lib/          Leaflet como global (lo necesita Leaflet-Geoman)
api/ecostress.ts Función Vercel (también disponible en npm run dev)
server/         Earthdata: píxel COG; AppEEARS: autenticación, tareas y descarga
public/
  data/         Respuestas guardadas de NASA POWER y SoilGrids
  sw.js         Service worker (app instalable y uso sin señal)
```

React 19 + TypeScript estricto, Vite, Tailwind CSS 4, Leaflet + Leaflet-Geoman, Turf, proj4, geotiff.js, shpjs, dxf-parser y Vitest. Despliegue automático en Vercel desde `main`.
