# ECOSTRESS en Field Shift

Actualizado el 15/11/2026. La extracción numérica directa con Earthdata ya fue verificada contra NASA en el punto del ejemplo de Añatuya. Las credenciales permanecen en la configuración local privada; no se incluyen en Git ni en los datos públicos.

## Qué funciona

- Catálogo CMR público por punto, producto ECO_L3T_JET.002, período y fecha de adquisición.
- Extracción de hasta cinco pasadas recientes desde COG originales con EARTHDATA_TOKEN, en el servidor. Se lee un píxel de ETdaily y sus máscaras cloud/water con rangos HTTP, sin descargar el mosaico completo.
- Alternativa AppEEARS: tarea Point Sample con sus propias credenciales. El token de usuario Earthdata no es un token de AppEEARS: este respondió 403, mientras la descarga protegida directa respondió 206.
- CSV local, calidad, persistencia por punto y ficha imprimible ES/EN.
- Snapshot real para presentar sin una nueva descarga: `front-nasa/public/data/ecostress-anatuya-example-2026-09.json`.

El ejemplo es ilustrativo, no un productor validado. La muestra es un píxel de 70 m, no un promedio de las 46 ha ni una medición de humedad de las raíces.

## Extracción real reproducible

Punto solicitado: −28,38175, −62,73655. Búsqueda: 17/08–15/11/2026. Descarga: 15/11/2026.

| Adquisición UTC | ETdaily nativo | cloud | water | Calidad |
| --- | --- | --- | --- | --- |
| 29/09/2026 11:46:26 | NaN | 0 | 0 | Faltante |
| 25/09/2026 13:18:12 | 3,33834171295166 mm/día | 0 | 0 | Válido |
| 09/09/2026 19:32:37 | NaN | 0 | 0 | Faltante |
| 02/09/2026 13:40:52 | NaN | 0 | 0 | Faltante |
| 02/09/2026 13:40:00 | 1,4364924430847168 mm/día | 0 | 0 | Válido |

Se descartan tres valores faltantes aunque las máscaras sean cero. El snapshot incluye CSV derivado, nombres completos de los cinco gránulos, fecha de extracción, producto, método y SHA-256 del CSV; no contiene tokens. Las pruebas verifican ese hash y reproducen las dos observaciones aceptadas.

Georreferenciación: WGS84 / UTM 20S, EPSG:32720; raster 1568 × 1568; origen 499980, 6900040; resolución 70, −70 m; píxel columna 369, fila 565. Centro: −28,381973562148826, −62,736205057970174. El COG codifica un CRS definido por usuario (32767) y una cita explícita WGS84/UTM: ese código no se interpreta como zona UTM. Se rechazan ventanas fuera del raster para evitar confundir el relleno automático cero de la librería con una observación.

## Unidad: corrección documentada

**ETdaily es la ET diaria integrada entre amanecer y atardecer, en mm/día.** Se conserva el valor nativo sin aplicar 0,0353 ni otra conversión energética. Un mm equivale a un litro por metro cuadrado; no representa una dosis de riego.

Existe una inconsistencia: el esquema de AppEEARS devuelve W/m² y una tabla de la guía C2 repite esa etiqueta. Sin embargo, el texto del algoritmo de esa guía (§5.4) explica que ETdaily está en milímetros por día. La validación original de Collection 2 confirma mm/día para ECO_L3T_JET.002 ETdaily y distingue los flujos instantáneos en W/m². La implementación sigue el método y esa validación científica. La primera versión local siguió la etiqueta de AppEEARS; se corrigió al contrastar las observaciones y las fuentes.

- [Guía NASA/JPL Collection 2](https://lpdaac.usgs.gov/documents/1655/ECO_L1C-4_Grid_Tile_User_Guide_V2.pdf), §5.4.
- [Validación original de Collection 2, 2025](https://doi.org/10.1029/2024WR039404).
- [Esquema de AppEEARS con la etiqueta inconsistente](https://appeears.earthdatacloud.nasa.gov/api/product/ECO_L3T_JET.002).

ET real y ET₀ de Hargreaves son variables distintas. Se usa como evidencia histórica complementaria: no calibra el ranking ni reemplaza el balance diario. Dos observaciones de septiembre no describen el estado actual de noviembre. La versión 003 queda fuera hasta adaptar y verificar su contrato.

## Configuración

Variables exclusivamente de servidor, sin prefijo VITE_:

1. **EARTHDATA_TOKEN:** token de usuario Earthdata para extracción directa de COG. Es la vía verificada en vivo.
2. **APPEEARS_TOKEN**, o **EARTHDATA_USERNAME + EARTHDATA_PASSWORD:** vía asíncrona de AppEEARS, verificada con pruebas simuladas; no se ejecutó una tarea autenticada real de AppEEARS.

APPEEARS_JOB_SECRET firma referencias a tareas con identificador, punto, período y vencimiento de 48 horas. Las consultas se limitan a un punto, latitudes ±52°, desde julio de 2018 hasta hoy y hasta 180 días entre fechas. La extracción directa tiene un plazo de 50 segundos y procesa como máximo dos escenas en paralelo. Vercel reserva hasta 60 segundos por ejecución.

En Vercel, configurar la vía elegida en Settings → Environment Variables y desplegar desde Root Directory `front-nasa`. El .env.local de este equipo no configura Vercel. El token no debe enviarse al navegador, imprimirse ni commitearse.

En local, completar .env.local y ejecutar npm run dev. Vite sirve el endpoint. npm run preview solo sirve archivos estáticos: permite mostrar el snapshot, pero no ejecutar la función Node.

npm run connect:earthdata abre una pantalla local con registro oficial y AppEEARS, para obtener un token de AppEEARS con usuario/contraseña. Guarda únicamente ese token en .env.local con permisos 0600. No hace falta ese comando cuando ya está configurado un token Earthdata para la vía directa.

## Mostrar la demo

1. Cargar el lote de ejemplo y abrir Tus opciones → ECOSTRESS.
2. Pulsar **Usar extracción NASA guardada**: muestra dos valores válidos y tres faltantes, con sus fechas y procedencia. Solo se ofrece en el punto del ejemplo.
3. Para nuevos valores, abrir Consultar o cargar ECOSTRESS → Extraer valores del punto, con el servidor configurado.
4. La ficha imprimible incluye la observación válida más reciente, producto, procedencia y límites.

Para CSV externo, crear Point Sample en AppEEARS con las coordenadas mostradas, producto ECO_L3T_JET.002 y ETdaily/cloud/water. Se rechazan otro punto, otra versión, más de 2 MB y máscaras ausentes. El JSON descargable reproduce el cuerpo de la API; no implica un importador JSON en la web de AppEEARS.

## Código y pruebas

- src/ecostress/: contratos, CSV, catálogo, snapshot, cliente y persistencia por ubicación.
- server/ecostress-direct.ts: COG, CRS, píxel, máscaras y CSV trazable; solo assets HTTPS del producto en LP DAAC.
- server/ecostress.ts: selección de vía y tareas firmadas de AppEEARS.
- api/ecostress.ts: GET de configuración; POST de punto/período devuelve datos directos o tarea pendiente; GET con referencia firmada consulta la tarea.
- EcostressPanel.tsx y FieldSheet.tsx: interfaz y ficha.

144 tests de la app: calidad, coordenadas, observaciones reales y hash, CRS real, ventanas fuera de cobertura, hosts ajenos, máscaras desalineadas y flujo de AppEEARS. Typecheck y build aprobados. En Chromium se comprobaron el snapshot y una extracción nueva autenticada desde el botón de la app, 2 valores válidos/3 faltantes, ficha imprimible, inglés y ancho de 360 px, sin excepciones de JavaScript. POWER y SoilGrids se fijaron con sus snapshots para este recorrido; la extracción ECOSTRESS fue real. Se verificó además que el token no aparece en los archivos compilados públicos.

Fuentes adicionales: [producto NASA](https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002), [API AppEEARS](https://appeears.earthdatacloud.nasa.gov/api/), [tokens Earthdata](https://urs.earthdata.nasa.gov/documentation/for_users/user_token).
