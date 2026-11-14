# Claude — material recibido

Pegado por el usuario el 14 de noviembre de 2026. El encabezado del documento indica 13 de noviembre de 2026. Se conserva como fuente de la conversación: las afirmaciones de pruebas, disponibilidad, reglamento y prototipo son del texto recibido y no implican verificación en este espacio de trabajo. La estructura se presenta como texto para conservar el contenido de las tablas pegadas.

Enlace de origen: [Artefacto de Claude](https://claude.ai/artifact/4SyKZCKpTHthEpJEXYnWQ3#bc5c2455-b27e). El enlace no se pudo abrir durante esta sesión; el contenido siguiente proviene del pegado del usuario.

---

Field Shift — Datos, APIs y propuesta
ahi 13 nov 2026 · @sebastian peralta
El desafío
Hay que construir una herramienta de apoyo a la decisión que combine datos de observación terrestre de la NASA con suelo local, rasgos de cultivos y prioridades del productor, y que compare al menos 3 estrategias de rotación, incluida la actual. La hackathon es el 14–15 de noviembre de 2026; la entrega cierra el domingo 15 a las 23:59 hora local. Dificultad: intermedia/avanzada. Temas: Earth Science, Software, Arts & Multimedia.
Lo que la entrega tiene que mostrar, por cada estrategia:
• Por qué se sugiere.
• Qué evidencia la respalda.
• Qué beneficios ofrece.
• Dónde faltan datos.
• Qué riesgos tiene que revisar un productor o agrónomo local.
Lo que suma puntos (consideraciones opcionales del enunciado):
• Marcar los meses en que el lote queda desnudo y las estaciones en que el cultivo actual es más vulnerable.
• Explicar términos: evapotranspiración, anomalía de humedad del suelo, NDVI, riesgo de helada, balance hídrico.
• Aclarar en qué se diferencia una medición satelital de una de campo, y cómo combinarlas.
• Armonizar datasets de distinta resolución a una grilla común (SMAP, ECOSTRESS, GPM, Landsat/MODIS, GEDI, suelos).
• Comparar enfoques de IA o estadísticos y explicar cómo el modelo maneja la incertidumbre.
• Mapas interactivos, líneas de tiempo, superposición de capas y sliders de escenario de lluvia/temperatura.
• Que el productor cargue sus restricciones: agua disponible, maquinaria, mercado.
• Recordar que la herramienta apoya y no reemplaza el criterio local.
Reglas que afectan la entrega: el reglamento 2026 llama a la IA "Super Intelligence (SI)". Se permite usarla, pero la entrega tiene que describir cómo se usó. Equipos de hasta 6 personas. La guía de entrega y la de evaluación se publican el 13 de noviembre en la web oficial. Desafío · FAQ
Qué hicieron los ganadores
Los dos ganadores globales de 2024 en agricultura resolvieron una sola decisión concreta del productor con 2–3 datasets NASA bien usados. Ese es el patrón a copiar.
Año
Equipo
Premio global
Desafío
Qué construyeron
Datos
2025
Zumorroda-X (El Cairo)
Art & Technology
NASA Farm Navigators
Juego educativo 2D (Phaser): un productor recorre países y resuelve minijuegos sobre calor, inundación, salinización y sequía
Landsat antes/después, NDVI por API, US Drought Monitor, modelo ML de cultivos vs. CO₂
2024
GaamaRamma (Universal Event, EE.UU.)
Best Use of Data
Leveraging Earth Observation Data for Informed Agricultural Decision-Making
WaterWise: el productor mapea sus lotes, carga cultivo y riego, y recibe gráficos personalizados de 7 días
OpenET
2024
NVS-knot (Kyiv)
Galactic Impact
El mismo que GaamaRamma
App de ventana de siembra: humedad de suelo, ventana óptima, riesgo de helada y transitabilidad del lote ("¿se me encaja el tractor?")
SMAP, OpenET, clima y modelado hidrológico
Fuentes: NASA, ganadores 2024 · Universe Magazine (WaterWise) · Silicon Prairie News (NVS-knot) · Ganadores 2025
Patrones comunes:
1.  Un usuario y una decisión ("¿cuándo siembro?", "¿cuánto riego?"), no un dashboard genérico.
2.  Pocos datasets NASA, nombrados y con su número visible en la pantalla.
3.  Una demo que funciona sobre un punto real del mapa.
4.  Impacto creíble: NVS-knot venía con una startup AgTech (Nave Analytics) que ya tenía clientes de riego.
La página de proyecto de los equipos 2024 ya no carga en la web de Space Apps; los detalles salen de las notas de prensa enlazadas.
APIs y datos que podemos usar
Con cinco APIs gratis y sin clave ya se cubre clima, agua, suelo, relieve e imágenes; las que piden cuenta (AppEEARS para SMAP/ECOSTRESS por punto) van por un backend mínimo. Columna "Navegador": probado hoy desde un navegador con fetch (OK = responde y permite CORS; "Backend" = bloqueado por CORS o necesita credenciales que no pueden ir al cliente).
Núcleo NASA (usar sí o sí)
API / dataset
Qué da
Acceso
Navegador
Para qué lo usamos
NASA POWER (comunidad AG)
Diario, mensual o climatología por punto desde 1981: T máx/mín, lluvia corregida, humedad de suelo radicular y superficial, radiación, viento, humedad
Libre, sin clave
OK (15 años diarios ≈ 520 KB en ≈ 2 s)
Base climática: balance hídrico, heladas, días de calor, tendencias, anomalías
NASA GIBS (WMTS)
Teselas de mapa ya renderizadas: NDVI MODIS 16 días, humedad radicular SMAP L4, lluvia IMERG, temperatura de superficie
Libre, sin clave; la fecha se ajusta sola a la composición más cercana
OK (capas MODIS_Terra_L3_NDVI_16Day y SMAP_L4_Analyzed_Root_Zone_Soil_Moisture probadas)
Capas visuales en el mapa; no devuelve valores numéricos
NASA CMR
Buscador de metadatos de colecciones y archivos (SMAP, ECOSTRESS, GPM, HLS, GEDI…)
Libre para buscar
OK
Encontrar los archivos exactos y sus URLs de descarga
AppEEARS
Extracción por punto o polígono de series de MODIS, VIIRS, SMAP, ECOSTRESS, Landsat, con control de calidad, en CSV
Cuenta gratuita Earthdata Login → token Bearer
Backend (bloqueado por CORS desde el navegador)
Valores reales de SMAP y ECOSTRESS para el lote: la diferencia entre "modelo" y "satélite"
Earthdata Login
Cuenta única para descargar datos NASA y usar AppEEARS
Gratis, se crea en minutos
—
Crearla HOY, antes del evento
Sobre AppEEARS: hace falta una cuenta Earthdata Login para usar el sitio y la API; el login con usuario y contraseña devuelve un token Bearer que se usa en las llamadas protegidas (docs API). Las solicitudes son asíncronas: se envían, se espera y se descargan, así que conviene precalcular los puntos de la demo.
Más datasets NASA (verificados hoy en el catálogo CMR)
Para que todo lo satelital sea NASA, la vegetación del lote sale de HLS y no de Sentinel-2 directo. Sentinel-2 es de la ESA (Copernicus); el desafío lo permite como agencia socia, pero HLS es el producto de la NASA que armoniza Landsat y Sentinel-2 a 30 m. La búsqueda STAC de HLS respondió desde el navegador con 3 escenas sobre Santiago del Estero entre octubre y noviembre de 2026; bajar los archivos pide Earthdata Login.
Dataset NASA
Nombre en CMR
Resolución / período
Uso
HLS Landsat + Sentinel-2
HLSL30, HLSS30 v2.0 (LP DAAC)
30 m; desde 2013 / 2015, vigente
NDVI del lote y meses reales de suelo desnudo
SMAP L4 humedad de suelo
SPL4SMGP v8 (NSIDC)
9 km, cada 3 h; desde 2015, vigente
Humedad superficial y radicular; comparación con POWER
ECOSTRESS evapotranspiración
ECO_L3T_JET v2 (LP DAAC)
70 m; desde 2018, vigente
Estrés hídrico y demanda de agua del cultivo a nivel lote
GPM IMERG Final
GPM_3IMERGDF v07 (GES DISC)
0,1° diario; 1998 – sep. 2025
Lluvia y eventos extremos (erosión)
GRACE / GRACE-FO
GRACEDADM_CLSM025GL_7D v3 (GES DISC)
0,25° semanal; desde 2003, vigente
Tendencia de agua subterránea de la zona
SRTM
SRTMGL1 v3 (LP DAAC)
30 m; misión de 2000
Pendiente y riesgo de erosión
Complementos gratis y sin clave
API
Qué da
Navegador
Uso
Open-Meteo Archive (reanálisis ERA5)
Diario/horario desde 1940: lluvia, ET₀ FAO ya calculada, humedad de suelo por capa
OK
Validar POWER y reemplazar nuestra ET₀ de Hargreaves por la FAO Penman-Monteith (es ERA5, que está en los recursos del desafío)
Open-Meteo Elevation
Altura por punto (DEM Copernicus 90 m)
OK
Pendiente aproximada pidiendo 4–5 puntos alrededor del lote
SoilGrids (ISRIC)
Arcilla, arena, carbono orgánico, pH, densidad, por profundidad, global a 250 m
OK
Textura y materia orgánica del lote → agua útil del suelo (hoy es un supuesto fijo)
Earth Search STAC (Element84)
Escenas Sentinel-2 L2A en COG públicos en AWS
OK
NDVI real del lote a 10 m: detectar meses de suelo desnudo reales
Microsoft Planetary Computer STAC
Landsat C2 L2, Sentinel-2, HLS, ESA WorldCover, etc.
OK (búsqueda; las descargas se firman con su endpoint de tokens)
Alternativa a Earth Search; historial Landsat desde los 80
Copernicus Data Space STAC
Catálogo oficial ESA de Sentinel
OK (catálogo); descargas piden cuenta
Respaldo para Sentinel-2
Con clave o solo EE.UU.
API
Restricción
Comentario
OpenTopography (SRTM 30 m)
Pide API key gratis (respondió 401 sin clave)
La pendiente "oficial NASA" del enunciado; pedir la key hoy
OpenET
API key; cubre solo EE.UU.
La usó GaamaRamma; sirve solo si la demo muestra un lote de EE.UU.
USDA NASS QuickStats
API key; solo EE.UU.; bloqueada por CORS
Rindes históricos por condado
CropScape (CDL), SSURGO, PRISM, NAIP, NWIS, CoCoRaHS
Solo EE.UU.
Mencionar como fuentes equivalentes para la versión EE.UU.
FAO GAEZ
Portal, no API REST simple; bloqueado por CORS
Descargar a mano las capas de aptitud de 3–4 cultivos y servirlas como archivo
Argentina (para el caso local)
Fuente
Qué da
Uso
MAGyP – Estimaciones agrícolas (datos.gob.ar)
Serie por cultivo, campaña, provincia y departamento: superficie sembrada y cosechada, producción y rendimiento; CSV
Qué se siembra de verdad en cada departamento de Santiago del Estero y cuánto rinde; calibrar el puntaje de ingresos
Portal de Estimaciones MAGyP
Mismos datos filtrables por cultivo, variable, fecha, provincia y departamento
Descarga rápida para la demo
La serie de MAGyP trae superficie sembrada, cosechada, producción y rendimiento por cultivo, campaña, provincia y departamento (datos.gob.ar), y el portal permite filtrar por cultivo, variable, fecha, provincia y departamento (ficha CY-Bench).
Capa de IA (la "SI" que hay que declarar)
• Un LLM (Claude, Gemini u otro) que redacte la explicación para el productor recibiendo SOLO el JSON de evidencia calculado. Regla: no puede afirmar nada que no esté en ese JSON. Va por backend, nunca con la API key en el cliente.
• Opcional: un modelo estadístico simple (regresión o random forest) que relacione humedad de suelo + calor con el rinde del departamento usando MAGyP. Responde al punto del enunciado sobre "comparar enfoques de SI".
Cómo pedir cada dato NASA
POWER, GIBS y la búsqueda de HLS se piden con una URL, sin clave; SMAP y ECOSTRESS se piden a AppEEARS con el token de Earthdata Login, desde el backend. Las coordenadas de ejemplo son de Santiago del Estero.
1. NASA POWER — clima diario de 15 años (probado: ≈ 520 KB en ≈ 2 s)
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,GWETROOT,GWETTOP&community=AG&latitude=-27.7834&longitude=-64.2642&start=20110101&end=20251231&format=JSON
Valor faltante = -999. La respuesta trae la elevación del punto en geometry.coordinates[2].
2. NASA GIBS — capas para el mapa (teselas PNG; la fecha se ajusta sola)
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_NDVI_16Day/default/{fecha}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/{fecha}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png
3. HLS — escenas del lote (Landsat + Sentinel-2, 30 m)
https://cmr.earthdata.nasa.gov/stac/LPCLOUD/search?collections=HLSS30_2.0&bbox=-64.3,-27.8,-64.2,-27.7&datetime=2026-10-01T00:00:00Z/2026-11-12T00:00:00Z
La búsqueda es libre (devolvió 3 escenas); bajar las bandas para calcular NDVI pide el token de Earthdata, así que va por backend. Para Landsat usar HLSL30_2.0.
4. AppEEARS — SMAP y ECOSTRESS para un punto (asíncrono: se envía, se espera y se descarga un CSV)
1.  POST https://appeears.earthdatacloud.nasa.gov/api/login con usuario y contraseña de Earthdata → devuelve un token Bearer.
2.  POST .../api/task con el token y un pedido tipo point: fechas, coordenadas del lote y las capas.
3.  Consultar el estado de la tarea y descargar el CSV del resultado.
Capas verificadas en la API de productos:
Producto
Capa
Unidad
Uso
SPL4SMGP.008 (SMAP L4)
Geophysical_Data_sm_rootzone
m³/m³, 0–100 cm
Agua en la zona de raíces
SPL4SMGP.008
Geophysical_Data_sm_surface
m³/m³, 0–5 cm
Humedad superficial (siembra, piso)
SPL4SMGP.008
Geophysical_Data_sm_rootzone_pctl
percentil
Anomalía: qué tan seco está vs. lo normal
ECO_L3T_JET.002 (ECOSTRESS)
ETdaily
W/m²
Evapotranspiración del día; × 0,0353 = mm/día
ECO_L3T_JET.002
cloud, water
máscara
Descartar píxeles con nube o agua
Fuente de las capas: AppEEARS SPL4SMGP.008 · AppEEARS ECO_L3T_JET.002. La forma exacta del JSON del pedido conviene copiarla de la documentación de la API antes de programarlo.
Propuesta
La base es la idea ganadora de NVS-knot (ganador global 2024, Galactic Impact), mejorada: ellos respondían "¿cuándo siembro?" con SMAP, OpenET y riesgo de helada; nosotros respondemos "¿qué rotación le conviene a mi lote en los próximos 2 años, y por qué?", con datos de la NASA y un caso real de Santiago del Estero. De GaamaRamma (ganador 2024, Best Use of Data) tomamos el flujo: el productor marca su lote y carga su cultivo y riego. El código de ninguno de los dos es público (NVS-knot pasó a ser producto de Nave Analytics), así que se toma la idea, no el código.
Ganador
Qué tomamos
Qué mejoramos
NVS-knot
Ventana de siembra con humedad de suelo SMAP, evapotranspiración y riesgo de helada
De una fecha de siembra a una rotación completa de 2 años; fecha de siembra optimizada por cultivo; funciona fuera de EE.UU. (OpenET solo cubre EE.UU.; usamos ECOSTRESS, global)
GaamaRamma
Lote marcado en el mapa + cultivo + riego del productor
Prioridades del productor (agua, suelo, erosión, plagas, ingresos) que reordenan las recomendaciones
Ambos
Pocos datasets NASA, visibles en pantalla
Cada recomendación trae por qué, evidencia, beneficios, riesgos y vacíos de datos, que es lo que pide el desafío 2026
Flujo del productor (5 pasos):
1.  Marca el lote en el mapa.
2.  Elige su rotación actual (por ejemplo soja → maíz con invierno vacío).
3.  Carga restricciones: riego disponible en mm, pendiente, maquinaria.
4.  Ordena sus prioridades: agua, suelo, erosión, plagas, ingresos.
5.  Recibe la rotación actual vs. 3 alternativas, cada una con por qué, evidencia en mm y días, beneficios, riesgos y vacíos de datos, más un slider de escenario (−20% lluvia, +2 °C).
Qué nos diferencia de los ganadores anteriores:
• Ellos resolvían riego o fecha de siembra; nosotros comparamos rotaciones completas, que es lo que pide este año.
• Fechas de siembra y largo del ciclo adaptados al clima del lote con grados-día: la misma herramienta sirve en Santiago del Estero y en Iowa.
• Descarta solo lo inviable (helada ≥50% dentro del ciclo, déficit hídrico ≥75% en secano) y lo explica.
• "Satélite vs. modelo": humedad de suelo de SMAP (AppEEARS) contra la de POWER, lado a lado.
• Explicación en lenguaje de productor generada por IA a partir de la evidencia calculada, sin inventar datos.
Stack sugerido (todo nuevo, armado sobre la idea ganadora):
Capa
Elección
Motivo
Front
Vite + TypeScript, Leaflet, Chart.js
Sin servidor para lo central; deploy en Netlify o Vercel en minutos
Datos en vivo
POWER, GIBS, CMR-STAC de HLS desde el navegador; SoilGrids y Open-Meteo solo como complemento
Todas probadas con CORS abierto y sin clave
Backend mínimo
1–2 funciones serverless (Vercel/Netlify)
Esconder el token de AppEEARS y la key del LLM
Precalculado
JSON estático con SMAP/ECOSTRESS de los 2–3 lotes de la demo
AppEEARS es asíncrono; la demo no puede depender de que responda en vivo
Motor
Reglas transparentes + puntaje por prioridades
Cada número se rastrea a un dato NASA; es lo que pide el enunciado
Ya existe un prototipo con el motor, POWER, GIBS y la UI (el field-shift.zip de la conversación). Lo pueden usar como base o descartarlo si el repo de ustedes sirve más.
Cómo encajan las piezas:
Todo lo abierto se pide directo desde el navegador; solo AppEEARS y el LLM pasan por funciones serverless para no exponer credenciales. Los resultados de AppEEARS de los lotes de la demo se guardan como JSON estático.
Plan para las 48 h
La regla es tener una demo funcionando el sábado a la noche y usar el domingo solo para sumar diferenciadores y armar la entrega. Roles sugeridos: Datos (APIs y precalculado), Motor (reglas y puntajes), Front (mapa y comparación), Historia (caso local, video, texto de entrega).
Hoy, viernes 13 (antes de que arranque)
[ ] Crear cuentas: Earthdata Login (todos), API key de OpenTopography.
[ ] Elegir 2 lotes reales de Santiago del Estero y 1 de EE.UU. para la demo.
[ ] Bajar de MAGyP la serie de soja, maíz, sorgo, trigo y algodón de los departamentos elegidos.
[ ] Confirmar con el Local Lead si se puede traer código hecho antes.
Sábado 14, mañana: base
[ ] Datos: POWER + SoilGrids + Open-Meteo andando por punto.
[ ] Datos: pedir en AppEEARS SMAP L4 y ECOSTRESS para los 3 lotes (tarda; dejarlo corriendo).
[ ] Front: mapa, formulario y llamada a POWER.
[ ] Motor: catálogo de cultivos y puntajes.
Sábado 14, tarde: demo mínima
[ ] Comparación actual vs. 3 alternativas con explicación.
[ ] Balance hídrico, heladas y calor en gráficos.
[ ] Deploy en Netlify/Vercel. Corte: si a las 22 h no hay demo, no se suma nada nuevo.
Domingo 15, mañana: diferenciadores (en este orden)
[ ] SMAP vs. POWER lado a lado (JSON precalculado).
[ ] Pendiente con SRTM/Open-Meteo y textura con SoilGrids en los puntajes.
[ ] Explicación con IA a partir del JSON de evidencia.
[ ] Glosario: "?" en ET₀, NDVI, anomalía y aridez.
Domingo 15, tarde: entrega (cierra 23:59)
[ ] Video de demo de 2–3 min con el caso de Santiago del Estero.
[ ] Texto de entrega: problema, solución, datos NASA usados, uso de IA, limitaciones.
[ ] Repo público con README y link a la demo.
[ ] Enviar antes de las 22 h para tener margen.
Riesgos y fuentes
Riesgo
Qué pasa
Mitigación
AppEEARS lento o caído
Sin SMAP/ECOSTRESS reales en la demo
Pedirlo el sábado temprano y guardar el JSON; POWER queda como respaldo
Wi-Fi del evento
La demo en vivo no carga datos
Caché local de la última consulta + video grabado
Resolución de POWER (~50 km)
Describe la zona, no el lote
Decirlo en la app y en el pitch; sumar Sentinel-2 y SoilGrids para el detalle de lote
Parámetros de cultivo genéricos
Recomendaciones poco locales
Marcar como "a validar con agrónomo"; calibrar con rindes MAGyP
Alcance
Querer usar los 20 datasets
Máximo 5–6 fuentes, cada una con un uso visible
Reglas de entrega
Penalización por código previo o por no declarar IA
Consultar al Local Lead; declarar el uso de IA
Fuentes
• Desafío Field Shift 2026 y su pestaña de recursos
• FAQ de participantes 2026
• NASA – ganadores globales 2024
• Universe Magazine – WaterWise
• Silicon Prairie News – NVS-knot / Nave Analytics
• Space Apps – ganadores 2025 y proyecto Zumorroda-X
• AppEEARS API · NASA POWER API
• MAGyP – Estimaciones agrícolas
Endpoints probados hoy con fetch desde un navegador: POWER (diario, mensual, climatología), GIBS, CMR, SoilGrids, Open-Meteo (archivo y elevación), Earth Search, Planetary Computer y Copernicus STAC respondieron; AppEEARS, NASS y GAEZ quedaron bloqueados por CORS; OpenTopography pidió API key.
