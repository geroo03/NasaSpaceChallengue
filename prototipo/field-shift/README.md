# Field Shift — Adaptar rotaciones con datos de la NASA

Base de proyecto para el desafío **"Field Shift: Adapting Farms with NASA Data"** (NASA Space Apps Challenge 2026, 14–15 de noviembre).

Es una herramienta de apoyo a la decisión: el productor marca su lote en el mapa, elige su rotación actual, sus restricciones y prioridades, y la app compara **la rotación actual contra 3 alternativas**, explicando por qué se sugiere cada una, qué evidencia NASA la respalda, qué beneficios y costos tiene, qué riesgos hay que revisar con un agrónomo y qué información falta. Es exactamente lo que pide el enunciado.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 24 tests (vitest)
npm run build      # typecheck estricto + build a dist/ (deploy directo en Netlify/Vercel)
```

No hace falta API key ni backend: NASA POWER y NASA GIBS se consumen directo desde el navegador.

---

## 1. Qué pide el desafío (resumen)

- Herramienta (app, modelo, mapa interactivo) que combine **observación terrestre de la NASA** + suelo local + rasgos de cultivos + **prioridades del productor**.
- Comparar **al menos 3 estrategias de rotación, incluida la actual**. Para cada una: por qué se sugiere, qué evidencia la respalda, beneficios, vacíos de información y riesgos que requieren revisión local.
- Puntos que valoran explícitamente: períodos de suelo desnudo, estaciones donde el cultivo actual es vulnerable, sliders de escenario de lluvia/temperatura, explicar términos (ET, anomalías de humedad, NDVI, riesgo de helada), cómo el modelo maneja la incertidumbre, y recordar que **no reemplaza el criterio del productor**.
- Datasets sugeridos: SMAP, ECOSTRESS, GPM/IMERG, Landsat, MODIS/VIIRS, NASA POWER, GRACE/GRACE-FO, SRTM, más USDA (SSURGO, CDL, NASS, AMS), FAO GAEZ, OpenET, Sentinel-2, ERA5.
- El reglamento 2026 exige **describir cómo se usaron herramientas de "SI" (IA)** en la entrega.

## 2. Qué hicieron los ganadores (para copiar lo que funciona)

| Año | Equipo | Premio global | Desafío | Qué construyeron |
|---|---|---|---|---|
| 2024 | **GaamaRamma** (EE.UU.) | Best Use of Data | Leveraging Earth Observation Data for Informed Agricultural Decision-Making | *WaterWise*: el productor mapea sus lotes, carga cultivo y riego, y recibe gráficos personalizados de 7 días con evapotranspiración de **OpenET** |
| 2024 | **NVS-knot** (Kyiv, Ucrania) | Galactic Impact | El mismo desafío | App de **ventana óptima de siembra**: humedad de suelo (**SMAP**) + ET (**OpenET**) + modelado hidrológico → humedad, ventana de siembra, riesgo de helada y "¿se me va a encajar el tractor?". Lo hizo un equipo con una startup AgTech real (Nave Analytics) |
| 2025 | **Zumorroda-X** (El Cairo) | Art & Technology | NASA Farm Navigators | Juego educativo (Phaser) con Landsat antes/después, NDVI y un modelo de ML sobre cultivos y CO₂ |

**Patrones comunes de los que ganaron:**
1. **Un usuario concreto y una decisión concreta** ("¿cuándo siembro?", "¿cuánto riego?"), no un dashboard genérico.
2. **Pocos datasets NASA, bien usados y nombrados** (SMAP, OpenET), con el número que sale del satélite visible en la pantalla.
3. **Demo que funciona** con un punto real del mapa.
4. **Historia de impacto creíble** (NVS-knot venía con productores reales detrás).

Esta base está armada con esos cuatro patrones.

## 3. Qué hace esta base

**Datos (reales, en vivo):**
- **NASA POWER** (comunidad AG), diario, 15 años: T máx/mín, precipitación corregida, humedad de suelo radicular y superficial.
- **NASA GIBS** en el mapa: NDVI MODIS 16 días y humedad de zona radicular **SMAP L4**.

**Análisis (`src/analysis/climate.ts`, funciones puras):**
- ET₀ por **Hargreaves (FAO-56)** con radiación extraterrestre calculada (testeado contra el ejemplo 8 de FAO-56).
- Climatología mensual: lluvia, ET₀, balance hídrico, probabilidad de helada, días ≥35 °C, días de lluvia erosiva (≥40 mm), humedad del suelo.
- Tendencias por década con R², período libre de heladas, **anomalía de humedad del suelo** del último año (z-score).
- Escenario "¿y si…?" (cambio de lluvia % y temperatura °C) por método delta-change.

**Motor de rotaciones (`src/domain/rotations.ts`):**
- Catálogo de 12 cultivos (grano, de servicio, pastura) con Kc FAO-56, tolerancias, fijación de N, raíz, rastrojo, cobertura.
- **Fechas adaptadas al lugar**: para cada cultivo prueba todas las fechas de siembra de su ventana y elige la de menor riesgo sin superponerse con los demás cultivos. La **duración del ciclo sale de grados-día** con la temperatura NASA (el trigo de invierno en Iowa dura 9 meses, en Santiago del Estero 6).
- **Relleno de barbechos** con cultivos de servicio (vicia antes de gramíneas por el N, centeno/avena en climas secos).
- 7 dimensiones puntuadas 0–100: seguridad hídrica, ahorro de agua, riesgo climático, salud de suelo, erosión, corte de plagas, ingresos. Ponderadas por las prioridades del productor.
- **Filtro de viabilidad**: nunca recomienda una rotación con helada ≥50% dentro del ciclo o déficit hídrico ≥75% en secano.
- Cada resultado trae `rationale`, `evidence`, `benefits`, `tradeoffs`, `risks`, `gaps` como mensajes estructurados (la UI los traduce ES/EN).

**Verificado con datos reales de NASA POWER** (2011–2025):
- *Santiago del Estero*: aridez 0,41, ~94 días ≥35 °C/año. El motor ubica soja en diciembre, maíz tardío en enero y trigo en junio (el calendario real de NOA), marca calor en floración para soja/maíz y no para sorgo/algodón, y advierte que los cultivos de servicio compiten por agua en clima semiárido.
- *Iowa*: siembra soja y maíz en mayo, cultivos de servicio en octubre/noviembre, y **descarta el algodón** por heladas.

## 4. Arquitectura

```
src/
  data/power.ts         Cliente NASA POWER: URL, timeout, validación del payload (boundary)
  analysis/climate.ts   Indicadores agroclimáticos (puro, testeable, reutilizable en backend)
  domain/crops.ts       Base de conocimiento de cultivos  ← reemplazable por datos regionales
  domain/rotations.ts   Calendario, optimización de fechas, puntajes, explicaciones (puro)
  i18n.ts               Textos ES/EN; el motor devuelve claves + parámetros, no texto
  main.ts               UI: Leaflet, Chart.js, render
  test/                 24 tests (parser, FAO-56, perfil climático, motor)
```

Decisiones:
- **Motor basado en reglas, no caja negra.** Cada puntaje se puede rastrear a un dato NASA y a un rasgo del cultivo. Los jueces y el productor ven *por qué*. La "SI" se suma encima sin perder eso (ver roadmap).
- **Sin backend** para la demo: menos cosas que se rompan en 48 h. Si sumás algo que necesite claves (Earthdata, LLM), ahí sí agregá una función serverless.
- **TypeScript estricto** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) y validación del JSON externo.

## 5. Limitaciones honestas (decílas en el pitch: suma puntos)

- NASA POWER tiene ~50 km de resolución: describe la zona, no el lote.
- La precipitación y humedad de POWER vienen de MERRA-2; no son SMAP/IMERG directo (ver mejora #1).
- ET₀ por Hargreaves sobreestima en climas húmedos.
- Parámetros de cultivos genéricos; potencial de mercado es un placeholder.
- No usa mapa de suelos todavía (agua útil = supuesto de 120 mm).
- La pendiente la ingresa el usuario (no SRTM aún).

## 6. Cómo mejorarlo para ganar (priorizado para 48 h)

**Alto impacto / bajo costo (hacer primero):**
1. **SMAP real en el análisis, no solo en el mapa.** Leer el valor de SMAP L4 del punto (o usar el NASA AppEEARS/Earthdata API) y compararlo con GWETROOT de POWER. Mostrar "satélite vs. modelo" responde directo a la consideración del desafío sobre satélite vs. suelo.
2. **Pendiente automática con SRTM** (Open Topography / Earthdata) → alimenta el puntaje de erosión.
3. **Capa de explicación con SI (LLM):** pasarle al modelo SOLO el JSON de evidencia y pedir un resumen en lenguaje de productor. Regla: no puede afirmar nada que no esté en la evidencia. Así usás SI sin inventar datos, y lo podés declarar en la entrega.
4. **Ícono de "?" en cada término** (ET₀, NDVI, anomalía, aridez) con una explicación de 2 líneas. Lo piden explícitamente.

**Diferenciadores (si sobra tiempo):**
5. **Suelo real**: SSURGO (EE.UU.) o SoilGrids (global) para textura y agua útil por lote.
6. **NDVI histórico del lote** con Landsat/Sentinel-2 para detectar meses de suelo desnudo reales (en vez de suponerlos por la rotación declarada).
7. **Ensamble de incertidumbre:** correr el motor sobre cada año por separado y mostrar el rango (p10–p90) de cada puntaje, no solo el promedio.
8. **Constructor de rotación propia** (hoy se elige de presets).
9. **Precios** de USDA AMS / bolsas locales para el puntaje de ingresos.
10. **Caché local** de la última consulta (para que la demo funcione aunque falle el WiFi del evento).

## 7. Guion de demo (2–3 minutos)

1. **Problema** (20 s): un productor de Santiago del Estero con soja–maíz deja el lote 13 meses desnudo cada 2 años, en una zona con 94 días de calor extremo al año.
2. **Clic en el mapa** → 15 años de NASA POWER en 2 segundos. Mostrar el balance hídrico y la anomalía de humedad del último año.
3. **Comparación**: rotación actual vs. 3 alternativas. Abrir una y leer *por qué*, la evidencia en mm y días, y los riesgos.
4. **Slider**: −20% lluvia, +2 °C → cómo cambia el ranking.
5. **Iowa en un clic**: la misma herramienta adapta fechas y descarta el algodón por heladas → es global.
6. **Cierre**: no reemplaza al agrónomo; le da una conversación basada en datos.

## 8. Antes de entregar

- Confirmá con tu Local Lead si se puede presentar código preparado antes del evento; si hay dudas, tratá esto como prototipo de referencia y declaralo en la descripción.
- Completá la sección de uso de SI (obligatoria en 2026).
- Citá todos los datasets usados (NASA POWER, GIBS/MODIS, SMAP L4, FAO-56).

## Fuentes

- Desafío: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- Ganadores globales 2024: https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/
- NVS-knot / Nave Analytics: https://siliconprairienews.com/2025/02/nebraska-startup-wins-nasas-galactic-impact-award-in-the-2024-space-apps-challenge
- Ganadores globales 2025: https://www.spaceappschallenge.org/2025/awards/global-winners/
- NASA POWER API: https://power.larc.nasa.gov/docs/services/api/
- FAO-56: https://www.fao.org/4/x0490e/x0490e00.htm
