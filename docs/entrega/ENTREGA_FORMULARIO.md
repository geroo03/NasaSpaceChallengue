# AgroField: textos para el formulario de entrega (Space Apps 2026)

Borrador del 15/11/2026, armado según «Componentes del Proyecto» y «Criterios de Evaluación».

- **Demo:** https://field-shift-lab.vercel.app (pública; abre en inglés, con botón ES/EN). Entrar con «Try without an account» y luego el lote de ejemplo.
- **Repositorio:** https://github.com/geroo03/NasaSpaceChallengue (la app está en `front-nasa/`)

Antes de pegar, revisar con el equipo:
- nombres;
- la declaración de IA;
- que el enlace de demo elegido (slides o video) sea público.

---

## 1. Project summary (English, 50–200 words)

> AgroField helps farmers in Santiago del Estero, Argentina, decide **before sowing** which two-year crop rotation to try. The farmer draws or uploads the field boundary (cadastre, survey plan or KML). AgroField then reads NASA POWER daily climate (2011–2025), NASA SRTM relief and SoilGrids soil water for that field. It compares the current rotation with up to three alternatives, weighted by the farmer's priorities.
>
> Every number states its source: NASA data, modelled, assumed or declared. The app warns about heat at flowering, shows how much water the soil holds at each sowing, and reports what happened in this field in past El Niño and La Niña seasons. NOAA currently observes a very strong El Niño. These are past frequencies, never forecasts.
>
> Each option comes with dates for checking the field and a drone survey request for Vuelo Verde, a network of 100+ agricultural drone pilots who agreed to be our territorial partner. Satellites give the history, AgroField plans and drones confirm. The result is a printable sheet for the farmer's adviser.

(173 palabras)

### Resumen en español (referencia)

AgroField ayuda a productores de Santiago del Estero a decidir **antes de sembrar** qué rotación probar en las próximas dos campañas. El productor dibuja o carga el lote (catastro, mensura o KML). AgroField lee para ese lote:
- el clima diario de NASA POWER (2011–2025);
- el relieve de NASA SRTM;
- el agua útil del suelo de SoilGrids.

Con eso compara el manejo actual con hasta tres alternativas, según las prioridades del productor. Cada número dice de dónde sale.

La app avisa sobre:
- calor en la floración;
- agua en el suelo al sembrar;
- qué pasó en el lote en campañas Niño y Niña. NOAA observa hoy un Niño muy fuerte.

Son frecuencias del pasado, no pronósticos. Cada opción trae fechas para revisar el lote y un pedido de relevamiento con dron a Vuelo Verde, alianza territorial con más de 100 pilotos. El cierre es una ficha para el técnico.

---

## 2. Project details

**What it does.** Three screens:
1. **Your field:** draw the field on high-resolution imagery or import it. Formats: KML/KMZ, zipped shapefile, GeoJSON, or DXF survey plans in POSGAR 2007, with automatic axis and strip correction. The field gives:
   - its area and centre, which becomes the NASA POWER point;
   - relief and general slope (NASA SRTM);
   - available soil water to 1 m (SoilGrids: field capacity − wilting point).

   A drone DSM or a lab soil test replaces those estimates when available.
2. **Your season:** the current rotation, irrigation (the only resource that changes the calculation today) and priorities.
3. **Your options:** the current rotation next to the best-scored alternative, with reasons and risks. It also shows:
   - test years: El Niño or La Niña campaigns only, drier, or hotter;
   - heat at flowering per crop;
   - a daily soil-water balance and the water available at sowing;
   - a 24-month calendar;
   - what to check in the field and when, with a drone survey request;
   - a printable sheet.

**How it works.** It is a transparent rule engine, with no black box:
- Hargreaves ET₀ from NASA POWER, crop Kc and effective rain feed water supply and deficit per crop.
- Frost and heat risks come from daily records.
- Seven indices (water security, water use, climate risk, soil, erosion, pests, market) are weighted by the farmer's priorities. They are guidance indices, not probabilities.
- A complementary two-layer daily water balance runs over the real 2011–2025 sequence. A weed-free fallow only loses its surface layer.
- Each campaign's ENSO phase comes from NOAA's ONI, using NOAA's 5-season rule.

Every assumption is listed in the results and in the sheet.

**Also in the app.** A 7-day forecast at the field with alerts (hold irrigation if rain is coming, heat ≥ 35 °C, frost, wind ≥ 20 km/h = no spraying). Drone work on the rotation's calendar (mapping, NDVI variable-rate prescription, seeding, spraying). An optional sign-in asks whether the farmer owns a drone: jobs their drone can do are planned with its specs; the rest are sent to Vuelo Verde by WhatsApp or email.

**Benefits.** Decisions before the costly part of the season, made with the farmer's own field rather than a regional average. The tool does not invent missing data. It hands a clear next step to the adviser and to a drone pilot.

**What we hope to achieve.** A pilot near Añatuya with Vuelo Verde and a real field, comparing the plan with what the drone measures.

**Tools.** TypeScript, React 19, Vite, Tailwind CSS, Leaflet and Leaflet-Geoman, Turf, proj4, geotiff.js, shpjs, dxf-parser, fflate, Vitest (150 automated tests) and Vercel. Everything runs in the browser except one optional serverless function (ECOSTRESS extraction); no API keys reach the browser. Files uploaded by the farmer are processed locally.

---

## 3. NASA data used

| Dataset | Use | Link |
| --- | --- | --- |
| NASA POWER (daily: T2M_MAX, T2M_MIN, PRECTOTCORR, GWETROOT, GWETTOP) | Climate profile, ET₀, frost, heat, water, ENSO phase statistics, water balance | https://power.larc.nasa.gov/ |
| NASA SRTM (~30 m, via AWS Terrain Tiles) | Field relief and general slope (enters the engine) | https://www.earthdata.nasa.gov/data/instruments/srtm |
| NASA HLS (Harmonized Landsat Sentinel-2, 30 m) via GIBS | Recent field imagery with date and cloud cover | https://www.earthdata.nasa.gov/data/projects/hls |
| NASA CMR (granule search) | Find recent HLS scenes and cloud cover | https://cmr.earthdata.nasa.gov/search/ |
| NASA ECOSTRESS ECO_L3T_JET.002 (70 m) | Actual daily evapotranspiration at the field point, next to modelled ET₀ | https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002 |
| NASA GIBS (MODIS NDVI, SMAP L4 root-zone moisture) | Regional context layers (imagery only) | https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api |

## 4. Other data and resources

| Resource | Use | Link |
| --- | --- | --- |
| Open-Meteo forecast API (free, no key) | 7-day forecast at the field: rain, heat, frost, wind; days fit for spraying or flying | https://open-meteo.com/ |
| ISRIC SoilGrids 2.0 (CC-BY 4.0) | Soil texture, organic carbon, available water 0–100 cm | https://soilgrids.org · API https://rest.isric.org |
| NOAA CPC Oceanic Niño Index (ONI) | El Niño / La Niña phase and current observed state | https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt |
| AWS Terrain Tiles (Mapzen, from SRTM) | Delivery of SRTM elevations in the browser | https://registry.opendata.aws/terrain-tiles/ |
| Esri World Imagery, OpenStreetMap | Base maps for drawing the field | https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9 · https://www.openstreetmap.org/copyright |
| FAO-56 (Allen et al., 1998) | Hargreaves ET₀, crop coefficients, soil evaporation concept | https://www.fao.org/4/x0490e/x0490e00.htm |
| Vuelo Verde: interview (14/11/2026) and technical report | Field validation, survey services, deliverables (DSM, contours, POSGAR faja 4) | team material, cited with permission |
| AgroCordS (reference for field drawing and validation rules) | Inspiration for the field editor | team material |
| Open-source libraries | See the «Tools» section | package.json in the repository |

## 5. Uso de IA (para el desplegable; los jueces no lo ven, pero sí ven marcas en el proyecto)

**Borrador a confirmar por el equipo:**
- **Claude (Anthropic) vía Claude Code:** escritura y revisión de código, tests, textos de la app y documentación, siempre revisados por el equipo.
- **ChatGPT y Claude:** ideación y revisión de la propuesta en etapas tempranas (ver `05 Material recibido` en el vault).
- **NotebookLM:** transcripción automática de los audios de la entrevista con Vuelo Verde.

No se usaron logos, banderas ni identificadores de misiones de la NASA. Sugerencia: agregar en el README y en la última diapositiva «Desarrollado con asistencia de IA (Claude Code); datos y decisiones revisados por el equipo».

---

## 6. Demo: 7 diapositivas (si se elige ese formato)

**Deck armado (15/11):** https://claude.ai/artifact/VJFey2JDWo8RF8AK9f4syH. Es privado: el formulario pide un enlace público sin login. Para subirlo:
1. Abrir el deck y exportarlo a PDF (menú Compartir › Exportar).
2. Subir el PDF a Google Drive y compartirlo con «Cualquier persona con el enlace».
3. Probar el enlace en una ventana de incógnito.

Opcional: copiar el PDF a `front-nasa/public/field-shift-pitch.pdf`. Queda en https://field-shift-lab.vercel.app/field-shift-pitch.pdf.

Contenido del deck (el borrador de abajo quedó como referencia):

1. **La pregunta:** «Poder tomar decisiones antes de sembrar» (Juan Pablo Suárez Ríos, Vuelo Verde). En secano, en Santiago del Estero, todo depende de la lluvia.
2. **Tu lote:** captura del lote de ejemplo con suelo (94 mm) y relieve (SRTM). Mensaje: el lote del productor, no un promedio regional.
3. **Tus opciones:** hoy contra la alternativa, con índice, meses sin cultivo, por qué y qué tener en cuenta.
4. **El Niño ahora:** aviso de NOAA (ONI +2,46) y la tabla del lote: Niño 721 mm, neutras 597 mm, Niña 500 mm entre octubre y marzo. Con campañas Niño, el índice pasa de 63 a 67.
5. **Calor y agua:** soja en febrero con ~14 días ≥ 35 °C; agua al sembrar (soja 22 mm contra maíz tardío 45 mm, gracias al barbecho); el gráfico mes a mes.
6. **Satélite → plan → dron:** fechas de verificación, pedido a Vuelo Verde con POSGAR faja 4 y KML, y la ficha para el técnico.
7. **Datos y honestidad:** NASA POWER, SRTM, HLS, GIBS y CMR, más SoilGrids y NOAA. Qué es dato, qué es modelo y qué falta: un lote real y la calibración. Próximo paso: el piloto en Añatuya.

## 7. Video de 30 s (si se elige ese formato; subtítulos en inglés obligatorios)

Guion con tomas y subtítulos `.srt` listos en [docs/video/](video/GUION_VIDEO_30S.md).

| Tiempo | Imagen | Locución (ES) | Subtítulo (EN) |
| --- | --- | --- | --- |
| 0–4 s | Campo seco, título | «En Santiago del Estero, la campaña se decide antes de sembrar.» | In Santiago del Estero, the season is decided before sowing. |
| 4–10 s | Clic en lote de ejemplo; aparecen suelo y relieve | «Cargás tu lote y AgroField lee el clima, el relieve y el suelo con datos de la NASA.» | Load your field: AgroField reads its climate, relief and soil with NASA data. |
| 10–17 s | Hoy contra alternativa; botón «Campañas Niño» | «Compara tu rotación con alternativas, y te muestra qué pasó acá en años Niño y Niña.» | It compares your rotation with alternatives and shows what happened here in El Niño and La Niña years. |
| 17–24 s | Calor en floración y agua al sembrar | «Te avisa del calor en la floración y del agua que vas a tener al sembrar.» | It warns about heat at flowering and the water you will have at sowing. |
| 24–30 s | Pedido de dron y ficha | «Y te dice qué revisar y cuándo: el satélite da la historia, el dron de Vuelo Verde confirma.» | And tells you what to check and when: satellites give the history, Vuelo Verde's drones confirm. |

No incluir menores de 18 años en imagen ni voz.
