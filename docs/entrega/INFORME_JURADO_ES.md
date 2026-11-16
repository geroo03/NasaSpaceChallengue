# AgroField

## Decidir antes de sembrar

**Informe del proyecto · Jurado local · NASA Space Apps 2026**  
**Versión:** 15 de noviembre de 2026 · Idioma: español

AgroField es una aplicación web para explorar rotaciones de cultivos a 24 meses en el secano de Santiago del Estero, Argentina. Combina clima histórico de NASA POWER, relieve de NASA SRTM y estimaciones de suelo con la información del productor. Compara el manejo actual con alternativas y explica sus riesgos, supuestos y verificaciones pendientes.

La propuesta conecta tres pasos: **el satélite aporta antecedentes, AgroField organiza alternativas y el relevamiento con dron permite contrastarlas en el terreno**. La decisión final corresponde al productor y a su asesor agronómico.

| Recurso | Acceso |
| --- | --- |
| Aplicación con selector ES/EN | https://field-shift-lab.vercel.app |
| Código y documentación | https://github.com/geroo03/NasaSpaceChallengue |
| Aplicación actual dentro del repositorio | `front-nasa/` |
| Desafío al que responde el equipo | *Adapting Farms with NASA Data* |

**Estado de la entrega técnica.** Prototipo funcional con motor explicable, datos guardados para el ejemplo, ficha imprimible y herramientas de planificación de trabajos con dron. La revisión local del 15/11/2026 ejecutó satisfactoriamente 188 pruebas automatizadas y la compilación de producción. Esto acredita los casos de software comprobados; la validación agronómica en campo es el siguiente paso.

**Caso demostrativo.** Un polígono de aproximadamente 52 hectáreas cerca de Añatuya, trazado sobre imagen satelital. El punto de análisis es −28,38175; −62,73655. No es un establecimiento con resultados de campo validados: se desconocen propietario, manejo real y mediciones locales del suelo.

<!-- page -->

## 1. Problema, usuarios y propuesta

El proyecto parte de una pregunta concreta: **¿qué rotación conviene explorar antes de comprometer los costos de las próximas dos campañas?** La entrevista del equipo con Vuelo Verde, realizada el 14 de noviembre de 2026, señaló la importancia de disponer de información comprensible antes de sembrar y de conectar el análisis con quienes relevan el lote.

AgroField está pensado para productores de secano y asesores de Santiago del Estero, con pilotos de drones como posible apoyo operativo. El primer alcance territorial se concentra en esa región; consultar coordenadas de otros lugares no acredita que las reglas estén validadas allí.

### Qué aporta

- Un punto de partida ligado al lote dibujado o importado y a las prioridades del productor.
- Comparación del manejo de referencia con hasta tres alternativas de rotación.
- Calendario común de 24 meses, indicadores de agua, calor y heladas, y razones para revisar cada alternativa.
- Procedencia de los datos y supuestos visibles, incluidos los faltantes.
- Una ficha imprimible y pedidos de relevamiento que facilitan conversar con el técnico y el piloto.

### Recorrido de uso

**1 · Tu lote.** Se dibuja el límite o se importa KML/KMZ, GeoJSON, Shapefile comprimido o un DXF de mensura compatible. La app calcula superficie y punto de análisis, y consulta relieve y suelo. Puede incorporar un modelo de superficie de dron o agua útil declarada a partir de un análisis local.

**2 · Tu campaña.** El productor indica el manejo actual, acceso y sistema de riego, y prioridades. El riego es el recurso operativo que hoy modifica el cálculo; registrar otros recursos no significa que todos condicionen la selección.

**3 · Tus opciones.** La app presenta la comparación, el calendario, alertas históricas de calor, agua al sembrar, escenarios de sensibilidad y verificaciones sugeridas. También incluye un pronóstico separado a siete días y planificación de trabajos con dron.

### Cómo recorrer la demostración

Abrir la aplicación, elegir ES y entrar a la demostración sin cuenta o como invitado. Cargar el lote de ejemplo, completar la campaña y avanzar a las opciones. Según la configuración del backend, usar lotes propios puede requerir una cuenta; el ejemplo permite mostrar el proyecto sin ese trámite.

<!-- page -->

## 2. Datos y trazabilidad

La aplicación diferencia fuentes que alimentan el motor, capas de contexto y evidencia complementaria. El contorno del lote ubica el análisis; una consulta en su punto representativo conserva la escala del producto original y no equivale a medir cada metro del campo.

| Fuente | Uso implementado | Alcance y precaución |
| --- | --- | --- |
| NASA POWER | Temperaturas máxima y mínima, precipitación y humedad relativa del suelo; perfil climático, ET₀, calor, heladas y agua. | El ejemplo conserva datos diarios de 2011–2025. Son antecedentes de escala regional; no sensores del lote. |
| NASA SRTM, vía AWS Terrain Tiles | Estimación de relieve y pendiente; la clase de pendiente puede entrar al motor. | Resolución aproximada de 30 m. Un DSM de dron puede reemplazar la estimación. |
| NASA HLS, GIBS y CMR | Consulta y visualización de imágenes y escenas. | Contexto visual. Sus valores no alimentan el puntaje de rotaciones. |
| MODIS NDVI y SMAP L4, vía GIBS | Capas regionales de vegetación y humedad. | Visualización; no constituyen mediciones numéricas incorporadas al motor. |
| ECOSTRESS ECO_L3T_JET.002 | Catálogo, CSV y extracción opcional de ETdaily por punto, con controles de nube y agua. | Evidencia complementaria en mm/día. No sustituye ET₀ ni cambia el puntaje de rotaciones. |
| ISRIC SoilGrids 2.0 | Textura, carbono orgánico y agua útil estimada hasta 1 m. | Mapa modelado de 250 m. Requiere perfil completo; un análisis local tiene prioridad. |
| NOAA CPC ONI | Agrupación de campañas históricas por El Niño, La Niña o fase neutra. | Pocas campañas por grupo. Las diferencias históricas no predicen la próxima campaña. |
| Open-Meteo | Pronóstico a siete días: lluvia, temperaturas y viento. | Producto de pronóstico separado del análisis histórico NASA. |

**Ejemplo reproducible.** El repositorio conserva respuestas de POWER y SoilGrids para el punto demostrativo y un archivo ECOSTRESS con cinco pasadas consultadas: dos valores válidos de ETdaily y tres faltantes. Los faltantes se conservan como tales. Los archivos están en `front-nasa/public/data/` y pueden inspeccionarse sin credenciales.

**Procedencia en pantalla.** Los resultados identifican la fuente, el período y el uso de una respuesta guardada cuando corresponde. La consulta de datos nuevos necesita conectividad; las copias incluidas o previamente almacenadas permiten sostener parte de la demostración sin señal.

<!-- page -->

## 3. Método y límites del cálculo

El motor aplica reglas deterministas sobre un catálogo de cultivos y secuencias. Construye calendarios, evalúa restricciones y combina siete dimensiones: seguridad hídrica, uso del agua, riesgo climático, suelo, erosión, plagas y mercado. Las prioridades del productor modifican sus pesos.

### Agua y clima

- **ET₀:** se estima con Hargreaves a partir de temperaturas. La demanda simplificada utiliza coeficientes de cultivo. No se presenta como Penman–Monteith implementado.
- **Oferta hídrica del índice:** 75 % de la lluvia + agua útil × humedad relativa POWER al sembrar + riego efectivo. El 75 % es un supuesto fijo del modelo, no infiltración medida.
- **Agua útil:** se prioriza el análisis del productor; luego SoilGrids con perfil completo de 0–100 cm; si faltan ambos, se declaran 120 mm supuestos. La humedad relativa POWER se usa como aproximación al estado de la reserva.
- **Riego efectivo:** lámina declarada × eficiencia supuesta: 0,90 para goteo, 0,75 para aspersión y 0,60 para superficie. Estas eficiencias requieren revisión local.
- **Reserva:** el índice simplificado reinicia la reserva en cada cultivo. Un balance diario complementario de dos capas sigue el registro histórico en secano y no incorpora riego. Son cálculos distintos.
- **Calor, heladas y ENSO:** se exploran registros históricos y fases de campañas. Los controles de lluvia y temperatura son perturbaciones para estudiar sensibilidad.

### Cómo interpretar el resultado

Un puntaje de 0 a 100 es un **índice orientativo**, no una probabilidad de éxito, un rendimiento esperado ni rentabilidad calculada. Las dimensiones de suelo, plagas y mercado incluyen reglas genéricas y requieren revisión agronómica y económica local.

Los «meses sin cultivo programado» describen el calendario. No miden suelo desnudo: puede existir rastrojo o cobertura no registrada. Tampoco se deben interpretar los índices como porcentajes de agua ahorrada o pérdidas evitadas.

### Datos de mayor detalle

La herramienta admite DSM de dron, ortomosaicos y datos de vigor compatibles. Una imagen RGB no se interpreta como multiespectral. La exportación de prescripciones NDVI exige datos apropiados y revisión técnica; producto y dosis requieren receta agronómica. ECOSTRESS aporta evidencia sobre evapotranspiración real estimada que debe distinguirse de ET₀ y del agua aplicada.

<!-- page -->

## 4. Implementación y comprobaciones

La app actual usa React, TypeScript, Vite, Tailwind CSS y Leaflet. El motor de rotaciones y los módulos de análisis se mantienen separados de la interfaz. La aplicación ofrece español e inglés, ficha imprimible y soporte de instalación y almacenamiento local mediante service worker.

**Modo local y servicios opcionales.** Sin backend configurado, el perfil y los datos de uso quedan en el dispositivo. Existe un backend opcional con Supabase para autenticación e historial. La extracción autenticada de ECOSTRESS utiliza una función de servidor; las credenciales se mantienen fuera del navegador y del repositorio. Los planos y rásteres cargados para análisis se procesan localmente.

### Evidencia técnica del 15/11/2026

| Comprobación | Resultado observado | Qué permite afirmar |
| --- | --- | --- |
| `npm test`, desde `front-nasa/` | 29 archivos de pruebas; 188 pruebas aprobadas. | Los casos automatizados existentes pasaron en la versión local revisada. |
| `npm run build` | Comprobación TypeScript y compilación de producción satisfactorias. | El proyecto genera sus archivos de distribución. |
| Revisión del selector de idioma | Controles ES/EN en cabecera y pantalla de ingreso; idioma inicial inglés. | El código incluye ambos idiomas y guarda la selección. |
| Inspección del ejemplo guardado | POWER 2011–2025, SoilGrids y archivo ECOSTRESS presentes. | Hay insumos locales que permiten inspeccionar y reproducir el caso. |

Estas comprobaciones no sustituyen ensayos de campo, evaluación de usabilidad ni una verificación de todos los servicios externos. El build emitió una advertencia de tamaño de algunos archivos JavaScript; no impidió la compilación.

### Validación territorial y próximo piloto

En la entrevista del 14/11/2026, Vuelo Verde autorizó ser presentado como alianza territorial y manifestó disposición para explorar la vinculación. La entrevista respalda la necesidad de decidir antes de sembrar y la posibilidad de conectar análisis con relevamiento. No constituye una validación del motor, una sociedad formal ni una garantía de disponibilidad operativa.

El piloto propuesto cerca de Añatuya requiere acordar un lote y autorización del productor, reunir análisis de suelo y manejo real, revisar parámetros con un agrónomo y contrastar las estimaciones con observaciones de campo. Se propone registrar errores de estimación del agua, diferencias en fechas y riesgos, comprensión de las explicaciones y utilidad de la ficha para el asesor.

El impacto que se busca es mejorar la calidad y trazabilidad de las decisiones previas a la siembra. El ahorro de agua, la reducción de pérdidas y los cambios de rendimiento quedan como hipótesis a medir.

<!-- page -->

## 5. Fuentes, recursos y asistencia de IA

Las referencias siguientes identifican los datos y métodos del proyecto. La implementación, sus supuestos y las respuestas guardadas pueden revisarse en el repositorio.

### Fuentes de datos y método

- **NASA POWER:** https://power.larc.nasa.gov/
- **NASA SRTM:** https://www.earthdata.nasa.gov/data/instruments/srtm
- **NASA HLS:** https://www.earthdata.nasa.gov/data/projects/hls
- **NASA CMR:** https://cmr.earthdata.nasa.gov/search/
- **NASA GIBS:** https://nasa-gibs.github.io/gibs-api-docs/
- **ECOSTRESS, producto ECO_L3T_JET.002:** https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002
- **ISRIC SoilGrids:** https://soilgrids.org/
- **NOAA CPC, índice ONI:** https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt
- **Open-Meteo:** https://open-meteo.com/
- **AWS Terrain Tiles:** https://registry.opendata.aws/terrain-tiles/
- **FAO-56, referencia metodológica:** https://www.fao.org/4/x0490e/x0490e00.htm

### Evidencia del proyecto

El repositorio incluye los módulos `src/engine/`, `src/case/`, `src/imagery/` y `src/ecostress/`, además de las pruebas y los archivos de ejemplo. `front-nasa/README.md` describe el funcionamiento; `docs/INTEGRACION_ECOSTRESS.md` y `docs/BACKEND.md` documentan servicios opcionales. El prototipo de `prototipo/` se conserva como antecedente; la aplicación vigente está en `front-nasa/`.

Las bases cartográficas y bibliotecas mantienen sus respectivas atribuciones. La entrevista con Vuelo Verde es material del equipo. Este informe no reproduce el informe técnico privado de un cliente de esa empresa ni contiene credenciales.

### Asistencia de IA

El proyecto registra asistencia de Claude/Claude Code y ChatGPT/Codex para ideación, programación, revisión y documentación. Este informe y el guion para el jurado local se prepararon con Codex a partir del repositorio y de las comprobaciones indicadas. Los materiales audiovisuales existentes también documentan voz sintética de ElevenLabs en la demo breve en inglés.

El motor que compara rotaciones usa reglas y datos estructurados; no consulta un modelo de lenguaje para producir sus puntajes. El equipo debe revisar los textos y declarar en el formulario de NASA las herramientas que efectivamente utilizó, incluidas otras no documentadas aquí.

**Aplicación:** https://field-shift-lab.vercel.app  
**Repositorio:** https://github.com/geroo03/NasaSpaceChallengue
