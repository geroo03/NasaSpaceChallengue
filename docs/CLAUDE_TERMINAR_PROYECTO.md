> **Histórico (15/11/2026, noche).** Este plan de cierre ya se ejecutó: los hallazgos están corregidos (ver `docs/revisiones/REVISION_CAMBIOS_CLAUDE_2026-11-15.md`), la app se llama AgroField y el backend está en `docs/BACKEND.md`. Las instrucciones vigentes están en `CLAUDE.md`.

# Para Claude: terminar Field Shift y preparar la demo

Actualizado: **15/11/2026**, zona del equipo Argentina/Córdoba.

## Encargo del usuario

Continuar el trabajo existente, resolver lo pendiente y cerrar una demo simple y verificable. El usuario pidió dejar en este archivo el estado, los enlaces y las tareas para que Claude pueda terminar. No reiniciar el proyecto ni rehacer la integración ECOSTRESS que ya funciona.

La decisión principal del producto es: **«Qué rotación explorar en mi lote y qué verificar antes de sembrar»**. El caso principal es Santiago del Estero, con el lote ilustrativo de Añatuya. El público necesita una interfaz sencilla. El recorrido que interesa mostrar es lote → comparación → evidencia → próxima verificación → coordinación con técnico/piloto de Vuelo Verde.

## 1. Dónde continuar y qué conservar

- Repositorio: [geroo03/NasaSpaceChallengue](https://github.com/geroo03/NasaSpaceChallengue).
- App vigente: **`front-nasa/`**, React 19 + TypeScript estricto + Vite + Tailwind 4 + Leaflet. Backend opcional en `front-nasa/api/` y `front-nasa/server/`.
- `prototipo/` es histórico. No ejecutar allí los checks de la app actual ni continuar ese frontend.
- Al escribir este archivo, HEAD es `da3d966`, rama `main`. **La integración ECOSTRESS y documentación de Codex están en cambios locales, incluidos archivos sin seguimiento; todavía no fueron commiteados ni publicados.** Revisar `git status` y `git diff` al comenzar: el usuario u otro asistente pueden haber seguido trabajando.
- `front-nasa/` forma parte del repositorio principal; ya no es el repositorio Git anidado anterior.
- Conservar los cambios locales de ambas herramientas. No usar reset, clean o sobrescrituras para volver a HEAD.
- Mantener Raleway Bold en los títulos correspondientes y fondo principal **`#f0ede4`**, pedidos por el usuario.
- Mantener ES/EN, teclado, accesibilidad y ancho de 360 px.

Leer junto con este archivo:

1. [README de la app](../front-nasa/README.md).
2. [Integración ECOSTRESS y evidencia real](INTEGRACION_ECOSTRESS.md).
3. [Revisión de los cambios de Claude: 10 hallazgos](revisiones/REVISION_CAMBIOS_CLAUDE_2026-11-15.md).
4. [Criterios e innovación del vault](../Field%20Shift%20-%20Obsidian/04%20Presentacion/Criterios%20e%20innovaci%C3%B3n.md).
5. [Textos de entrega](entrega/ENTREGA_FORMULARIO.md).

El resto de `CLAUDE.md`, varias auditorías y la matriz de APIs conservan información histórica del ZIP. Para decidir qué está integrado ahora, contrastar esta nota con el código actual.

## 2. Estado real de las fuentes

| Fuente | Implementado | Pendiente o límite |
| --- | --- | --- |
| NASA POWER | Series diarias, clima histórico, Hargreaves, comparación y escenarios | Escala regional; no pronostica. El motor usa reglas orientativas |
| SoilGrids | Textura, carbono y agua útil por capas; reserva entra al motor | Corregir aceptación de perfiles incompletos y traslado del análisis entre lotes |
| Relieve / Terrain Tiles | Pendiente general y relieve; reemplazo con DSM de dron | No identifica por sí solo todos los bajos; comprobar fuente por tesela |
| NOAA ONI | Snapshot y clasificación de campañas Niño/Niña | No es una API en vivo ni pronóstico; conservar fecha y tamaño de muestra |
| NASA HLS / GIBS / CMR | Escenas e imágenes visuales | Falta NDVI numérico satelital con bandas y máscaras |
| SMAP L4 | Capa visual de contexto | **Falta extracción numérica** de humedad y sus controles |
| ECOSTRESS | **Extracción numérica real por Earthdata, calidad, CSV, snapshot, almacenamiento y ficha** | Publicar integración; configurar entorno remoto para nuevas extracciones |
| GPM IMERG | Referenciado como ampliación | Falta integración numérica de lluvia |
| Pronóstico meteorológico | No integrado | Añadir una fuente como Open-Meteo para próximos días |
| Dron: DSM, ortomosaico, vigor y planificación | Archivos locales y herramientas implementadas | Corregir bandas y exportación antes de usar prescripciones |
| Recursos del productor | Acceso propio/compartido/contratado/no disponible/desconocido | Solo riego modifica el cálculo; faltan reglas revisadas por operación |
| Rendimientos, precios y costos locales | Sin calibración local comprobada | MAGyP/CSV y datos del caso; no hace falta una API para todo |

## 3. ECOSTRESS: ya está hecho, conservarlo

Producto: **ECO_L3T_JET.002**, resolución nominal 70 m. Variables ETdaily, cloud y water. Punto del ejemplo: **lat −28.38175, lon −62.73655**.

### Comprobación real realizada

- El usuario autorizó utilizar sus credenciales y proporcionó un **token de usuario Earthdata**. Se guardó exclusivamente como `EARTHDATA_TOKEN` en **`front-nasa/.env.local`**, con permisos privados `0600` y excluido de Git.
- **No volver a pedirle crear cuenta ni permiso para usar ese acceso:** ya se hizo. Comprobar si sigue válido sin imprimir su contenido.
- AppEEARS rechazó ese token con 403. La descarga directa de archivos protegidos LP DAAC funcionó con 206. Son vías de autenticación diferentes.
- El backend directo consulta CMR y lee píxeles nativos de los COG con rangos HTTP. Verifica CRS, límites del raster y correspondencia entre las tres grillas.
- Cinco pasadas del ejemplo: **dos valores válidos y tres NaN descartados**. Último válido: **25/09/2026, 3.33834171295166 mm/día**. Otro válido: **02/09/2026, 1.4364924430847168 mm/día**.
- El snapshot real está en `front-nasa/public/data/ecostress-anatuya-example-2026-09.json`; contiene CSV derivado, gránulos, georreferenciación, procedencia y SHA-256. No contiene credenciales.
- La interfaz ofrece **«Usar extracción NASA guardada»** solo en el punto del ejemplo. También permite una extracción nueva cuando el servidor está configurado.
- Se verificaron en Chromium snapshot, descarga nueva autenticada, filtros, ficha, EN y móvil de 360 px. No hubo excepciones de JavaScript en ese recorrido.
- Última validación: **144 tests aprobados, typecheck y build aprobados**. El token no apareció en el build público.

### Archivos para continuar

| Ruta dentro de `front-nasa/` | Función |
| --- | --- |
| `src/ecostress/data.ts` | Contrato, CSV, calidad, CMR y snapshot |
| `src/ecostress/storage.ts` | Guardado y revalidación por punto |
| `src/ecostress/client.ts` | Cliente del endpoint propio |
| `server/ecostress-direct.ts` | Acceso COG con Earthdata y extracción del píxel |
| `server/ecostress.ts` | Selección de vía y tareas firmadas AppEEARS |
| `api/ecostress.ts` | Endpoint Node para Vercel y desarrollo local |
| `src/components/results/EcostressPanel.tsx` | Panel de datos y acciones |
| `src/components/results/FieldSheet.tsx` | Evidencia en ficha imprimible |
| `src/i18n/ecostress.ts` | Textos ES/EN |
| `scripts/connect-earthdata.mjs` | Configuración local opcional de AppEEARS |

**Unidad corregida:** ETdaily se conserva en **mm/día**, según el método y la validación científica de Collection 2. La etiqueta W/m² de AppEEARS y una tabla de la guía son inconsistentes con el texto del algoritmo. No reintroducir esa etiqueta en la interfaz ni aplicar el factor 0,0353. La explicación y fuentes están en [INTEGRACION_ECOSTRESS.md](INTEGRACION_ECOSTRESS.md).

No tratar la ET real como ET₀ de referencia, dosis de riego o humedad radicular. El dato es evidencia complementaria: **todavía no modifica el ranking**. Las observaciones de septiembre tampoco representan el estado actual de noviembre.

## 4. Primero: corregir los errores que afectan la demo

La [revisión detallada](revisiones/REVISION_CAMBIOS_CLAUDE_2026-11-15.md) contiene reproducciones, archivos y resultados. Estos hallazgos corresponden a la versión auditada: revisar si otro cambio posterior ya los resolvió antes de tocar código.

| Prioridad | Pendiente | Qué tiene que pasar para darlo por resuelto |
| --- | --- | --- |
| P1 | Una respuesta POWER vieja reemplaza datos del lote nuevo (`App.tsx`) | Identificar/cancelar consultas; solo la ejecución vigente puede actualizar resultados o errores. Probar dos respuestas en orden invertido y verificar punto/período |
| P1 | Prescripción incluye áreas excluidas (`imagery/vigor.ts`) | Recortar geometría al lote y máscara; total y superficie deben salir de la exportación final. Probar bordes diagonales, concavidades y huecos sin datos |
| P1 | RGBA se acepta como multiespectral | Detectar/rechazar alfa como NIR; verificar o pedir correspondencia rojo/NIR. Leer un TIFF RGBA real en la regresión |
| P1 | Primera visita seguida de desconexión deja pantalla vacía | Precargar los archivos compilados necesarios, versionar caché y comprobar primera visita → preparación → desconexión → recarga. Incluir los módulos de la demo |
| P2 | Agua útil declarada se traslada a otro campo | Vincular el análisis al lote o reconfirmarlo al cambiar. Probar plano nuevo, preset y coordenadas |
| P2 | Tres capas de suelo se presentan como un metro completo | Exigir profundidad completa o mostrar faltantes sin usar la suma parcial como capacidad de 1 m. Carbono ausente no equivale a cero |
| P2 | Calendario no selecciona manejo actual | Separar selección de exploración y alternativa comparada; escena/verificaciones/foco deben respetar la celda elegida |
| P2 | Balance diario ignora riego sin destacarlo | Rotular simulación en secano hasta disponer de una programación temporal de riego. No inventar fechas a partir de mm totales |
| P2 | Balance empieza en julio también en el norte | Respetar inicio por hemisferio o limitar explícitamente la función al sur. Añadir regresión norte/sur |
| P2 | Ficha pierde etiqueta ENSO con escenario manual | Exportar por separado subconjunto de campañas y perturbación aplicada; conservar ambos en Niño + cambio de lluvia/temperatura |

No hace falta resolver una calibración agronómica completa para corregir estados, etiquetas, geometrías o errores de datos.

## 5. APIs pendientes y enlaces directos verificados

Las consultas siguientes respondieron correctamente el 15/11/2026. Las URLs NASA devuelven **metadatos y enlaces a archivos**, no una serie numérica lista para graficar. Open-Meteo sí devuelve directamente el pronóstico JSON. El orden de las coordenadas NASA es **lon,lat**; en el formulario es lat,lon.

### A. SMAP numérico — primera integración adicional recomendada

- [Consulta CMR: SPL4SMGP, versión 008, punto Añatuya](https://cmr.earthdata.nasa.gov/search/granules.json?short_name=SPL4SMGP&version=008&point=-62.73655,-28.38175&page_size=1&sort_key=-start_date).
- [Producto, documentación, calidad y acceso NSIDC](https://nsidc.org/data/spl4smgp/versions/8).
- Colección encontrada: `C3480440870-NSIDC_CPRD`, versión CMR **`008`**. La consulta con `version=8` no devolvió archivos; usar el identificador correcto.

Trabajo pendiente:

- [ ] Verificar acceso al producto con Earthdata. El token funcionó en LP DAAC; no asumir que todos los servicios aceptan el mismo mecanismo.
- [ ] Extraer humedad superficial y de raíces con variables, unidades, profundidades, flags y rellenos del esquema vigente.
- [ ] El producto original es **HDF5**, no el COG de ECOSTRESS. Elegir extracción compatible, subsetting o precálculo reproducible; no pasar HDF5 a geotiff.js. AppEEARS requiere su propio acceso.
- [ ] Mostrar fuente, fecha, escala **9 km** y carácter modelado con asimilación. Guardar una muestra real para la demo.
- [ ] No restar directamente SMAP volumétrico y POWER GWETROOT: sus unidades/definiciones son distintas. Mostrar cada variable con su interpretación antes de cualquier comparación.
- [ ] El aviso actual de NSIDC menciona problemas de geolocalización del **14/05 al 28/07/2026** y reprocesamiento. Elegir una muestra fuera de ese intervalo o documentar la condición y estado del archivo.
- [ ] Probar punto, período, no datos, calidad, unidades y procedencia. No dar por integrada la fuente al añadir solo una capa visual.

### B. Pronóstico Open-Meteo — segunda prioridad

- [JSON de 7 días para Añatuya: temperatura, lluvia y viento](https://api.open-meteo.com/v1/forecast?latitude=-28.38175&longitude=-62.73655&hourly=temperature_2m,precipitation,wind_speed_10m&forecast_days=7&timezone=America%2FArgentina%2FCordoba).
- [Documentación oficial](https://open-meteo.com/en/docs).

Trabajo pendiente:

- [ ] Añadir pronóstico corto para apoyar planificación de verificación y trabajos con dron.
- [ ] Usar coordenadas del campo, zona horaria, unidades devueltas y fecha de consulta. La URL verificada devolvió 168 horas.
- [ ] Identificarlo como pronóstico modelado y mostrar su vigencia. No mezclarlo con POWER histórico ni presentarlo como predicción de las próximas dos campañas.
- [ ] Si se proponen ventanas de trabajo, usar criterios declarados y revisables con el piloto; no afirmar automáticamente que un vuelo está autorizado o es seguro.
- [ ] Tratar fallo de red, dato vencido y cambios rápidos de lote. Mantenerlo plegable para no recargar la pantalla.

### C. HLS numérico / NDVI — después de cerrar lo anterior

- [CMR: escenas HLSS30 v2.0 sobre Añatuya](https://cmr.earthdata.nasa.gov/search/granules.json?short_name=HLSS30&version=2.0&point=-62.73655,-28.38175&page_size=1&sort_key=-start_date).
- [Portal NASA HLS](https://hls.gsfc.nasa.gov/).
- La app ya tiene búsqueda e imagen en `src/imagery/hls.ts`. Reutilizar ese recorrido y mantener separado el nuevo dato numérico.

Trabajo pendiente:

- [ ] Descargar bandas necesarias y máscara de calidad del producto correcto. Verificar diferencias de bandas entre HLS L30 y S30; no copiar ciegamente el orden de un TIFF RGB o de un dron.
- [ ] Calcular NDVI solo con píxeles válidos, nubes/sombras/rellenos controlados, fecha y cobertura utilizable del polígono.
- [ ] Mostrar serie de vegetación observada y sus huecos. No etiquetar NDVI bajo como ausencia de rastrojo ni confundirlo con meses sin cultivo programado.
- [ ] Si el servidor facilita descargas, limitar host/producto/ruta; no convertir el endpoint actual en un proxy de URLs arbitrarias.

### D. GPM IMERG — ampliación posterior

- [CMR: GPM_3IMERGDF versión 07 para Añatuya](https://cmr.earthdata.nasa.gov/search/granules.json?short_name=GPM_3IMERGDF&version=07&point=-62.73655,-28.38175&page_size=1&sort_key=-start_date).
- [Información y acceso oficial IMERG](https://gpm.nasa.gov/data/imerg).

Trabajo pendiente:

- [ ] Extraer precipitación con unidades y acumulación temporal verificadas. Distinguir tasa de lluvia y acumulado.
- [ ] Identificar variante Final/Early/Late, fecha y latencia. No llamar pronóstico a una estimación de lluvia observada.
- [ ] Usarlo como contexto regional para acumulados y contraste con POWER; documentar escala y límites antes de derivar riesgo de inundación o erosión.

No sumar las cuatro integraciones a la vez. Terminar y verificar una antes de pasar a la siguiente. Para cerrar la presentación, la cantidad de APIs no sustituye una decisión clara ni datos correctos.

## 6. Lo que falta y no se resuelve con otra API

- [ ] Conseguir un lote real con Vuelo Verde: límite autorizado, manejo actual, fechas reales, suelo y restricciones.
- [ ] Revisar parámetros y alternativas con un técnico local. Preservar fechas declaradas como baseline observado: el motor hoy optimiza también el calendario de referencia.
- [ ] Calibrar rendimiento/costos con datos locales. MAGyP puede entrar como CSV; el índice actual de mercado no es rentabilidad calculada.
- [ ] Definir compatibilidad por operación con maquinaria propia, compartida o contratada y disponibilidad confirmada. No inferir capacidad completa por tener tractor o acceso a dron.
- [ ] Simplificar resultados: arriba actual vs. alternativa, dos razones, un riesgo y próxima verificación. Plegar clima detallado, parámetros y prescripciones bajo herramientas del técnico.
- [ ] Validar con Vuelo Verde un GeoTIFF conocido y el formato de exportación que realmente reciben sus equipos. Generar GeoJSON no demuestra que DJI lo pueda ejecutar.
- [ ] Actualizar textos del formulario, README y vault según lo realmente implementado. La entrevista autoriza presentar una alianza territorial; no valida exactitud agronómica del motor.
- [ ] Evitar en video «el agua que vas a tener» cuando se muestra una simulación histórica. Explicar período y carácter exploratorio.

## 7. Publicación y material de entrega

- [ ] Revisar los cambios locales completos y agrupar un commit coherente, conservando trabajo ajeno y sin incluir `.env.local` ni el informe técnico privado de un cliente de Vuelo Verde.
- [ ] Seguir la autorización de publicación de la sesión en la que se continúe. Si ya se autorizó subir los cambios, avanzar sin volver a pedir el mismo permiso.
- [ ] Vercel debe construir desde **`front-nasa`**, ejecutar `npm run build` y servir `dist/`; la función vive en `api/ecostress.ts` dentro de esa raíz.
- [ ] Para nuevas extracciones en producción, configurar `EARTHDATA_TOKEN` como variable de servidor. El archivo local no sube esas variables. El snapshot del ejemplo permite mostrar ECOSTRESS sin una nueva autenticación.
- [ ] Comprobar el commit remoto, estado exitoso de Vercel y comportamiento del dominio real. No afirmar que los cambios están publicados por haber compilado localmente.
- [ ] Revisar [ENTREGA_FORMULARIO.md](entrega/ENTREGA_FORMULARIO.md) y [guion de video](entrega/video/GUION_VIDEO_30S.md). El material guardado plantea video de 30 s con subtítulos EN o slides según la guía; confirmar la modalidad y enlaces de la entrega efectiva.
- [ ] Verificar demo y material público sin login, declaración de uso de IA y límites de los datos. No incluir logos ni afirmaciones de validación/ahorros sin respaldo.

## 8. Validación para dar por terminado el trabajo

Desde `front-nasa/`:

```sh
npm test
npm run build
```

El build incluye typecheck. **144 tests** es el último recuento, no una meta fija: agregar regresiones relevantes para las correcciones y registrar el nuevo total. No probar solamente el prototipo histórico.

Comprobar en navegador:

- [ ] Ejemplo → campaña → opciones → evidencia → ficha, ES/EN, escritorio y 360 px.
- [ ] Selección de referencia y alternativas, calendario, teclado y controles de escenarios.
- [ ] Lote nuevo durante una consulta lenta: encabezado, serie y resultado siempre corresponden al mismo caso.
- [ ] ECOSTRESS guardado: dos válidos, tres faltantes, fecha 25/09/2026 y valor mostrado 3,34 mm/día; ficha con procedencia.
- [ ] Extracción nueva con credencial válida y tratamiento de token vencido, falta de datos o red caída, sin exponer secretos.
- [ ] Prescripción: geometría y cantidades exportadas consistentes; RGBA rechazado como fuente NIR.
- [ ] Primera preparación y recarga sin señal, sin prometer mapas o módulos que no estén disponibles.
- [ ] Cada API nueva muestra dato numérico real con fuente, fecha, unidad, escala y calidad; conserva los faltantes.

Al entregar, informar **qué quedó funcionando, cómo se comprobó, qué quedó pendiente y si está local, commiteado o desplegado**, con commit/enlaces verificables. Distinguir pruebas con fixtures de solicitudes reales. No cerrar el trabajo solo con un plan o una lista de capacidades posibles.

## Mensaje breve para iniciar la sesión de Claude

> Leé `docs/CLAUDE_TERMINAR_PROYECTO.md` y continuá desde el estado local actual. Conservá la integración ECOSTRESS y su snapshot real. Primero resolvé los P1 de la revisión; después avanzá con SMAP numérico y el pronóstico según el orden del documento. Mantené la interfaz simple, verificá el trabajo en navegador y reportá exactamente qué quedó local o publicado. Las credenciales ya autorizadas están fuera de Git: no las imprimas ni las vuelvas a pedir si siguen disponibles.
