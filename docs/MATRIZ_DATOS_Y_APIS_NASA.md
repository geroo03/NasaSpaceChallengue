# Matriz de datos y APIs — estado de integración

Actualizado el 15 de noviembre de 2026. La tabla siguiente conserva el relevamiento original del prototipo. La app actual está en `front-nasa/`; el estado nuevo de ECOSTRESS se detalla abajo y en [INTEGRACION_ECOSTRESS.md](INTEGRACION_ECOSTRESS.md). La presencia de una misión en el catálogo no implica una integración realizada.

## ECOSTRESS en la app actual

- **Producto:** ECO_L3T_JET.002; ETdaily en mm/día y máscaras cloud/water. La unidad sigue el método y la validación científica de Collection 2; hay una etiqueta inconsistente de W/m² en AppEEARS, documentada en la guía técnica.
- **Implementado:** búsqueda pública CMR, lectura numérica de CSV de AppEEARS por punto, exclusión de nubes/agua/rellenos, persistencia por ubicación y ficha imprimible. Servidor para leer COG con un token Earthdata o tramitar tareas asíncronas de AppEEARS, sin exponer credenciales.
- **Verificado:** el token Earthdata habilitó descargas protegidas y extracción de cinco pasadas del ejemplo de Añatuya; dos valores válidos y tres faltantes. Hay un snapshot reproducible para la demo. Vercel necesita su propia configuración de variables para habilitar consultas nuevas.
- **Uso:** evidencia complementaria de ET derivada de satélite. No alimenta el ranking ni sustituye ET₀ con observaciones irregulares. No es una media del polígono ni una alerta de sequía.
- **Sin cuenta:** se puede buscar pasadas e importar el CSV ya descargado. No se presentan valores numéricos simulados como observaciones NASA.

## Datos presentes

| Fuente | Consumo actual | Uso y límite |
| --- | --- | --- |
| NASA POWER | `src/data/power.ts`, JSON diario por punto | Alimenta indicadores; contexto regional, no medición del lote |
| GIBS MODIS NDVI | Teselas en `src/main.ts` | Contexto visual; no serie numérica usada en el ranking |
| GIBS SMAP L4 | Teselas en `src/main.ts` | Contexto visual; no humedad numérica incorporada al motor |
| Catálogo de cultivos | `src/domain/crops.ts` | Parámetros de referencia; revisión por zona/variedad pendiente |
| Suelo, pendiente y mercado | Supuestos o inputs genéricos | Falta procedencia local y validación |

### POWER

El cliente consulta `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `GWETROOT` y `GWETTOP`. Los grados-día se calculan en el motor con temperatura; no son un parámetro solicitado por ese cliente.

Ejemplo del snapshot revisado, correspondiente al punto predeterminado del prototipo:

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,GWETROOT,GWETTOP&community=AG&latitude=-27.7834&longitude=-64.2642&start=20110101&end=20251231&format=JSON
```

La respuesta guardada indica fuentes MERRA2/POWER, API v2.10.3 y tiempo LST. `GWETROOT`/`GWETTOP` son humedad relativa, unidad `1`. El parser distingue rellenos; la presentación debe mostrar cobertura y supuestos.

[Documentación POWER](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).

## Integraciones propuestas

| Fuente | Objetivo posible | Condición antes de usarla |
| --- | --- | --- |
| SMAP numérico | Contexto regional de humedad | Producto/versión, extracción, unidades, profundidad, calidad y período |
| AppEEARS | Extraer productos compatibles | Verificar catálogo vigente, autenticación, tarea asíncrona y resultado |
| GPM IMERG | Episodios y distribución histórica de lluvia | Distinguir tasa/acumulado y Early/Final; documentar cobertura |
| ECOSTRESS | Implementación actual descrita arriba | Extracción directa real verificada y guardada; no modifica el ranking |
| HLS | Contexto de vegetación y fenología | Escenas/bandas y máscara de calidad; indicadores reproducibles |
| SRTM | Contexto de terreno | Modelo, escala y método para derivar pendiente |
| Suelo local/SoilGrids | Propiedades y restricciones | Identificar medición o estimación y su incertidumbre |
| MAGyP | Contexto departamental de producción/rendimiento | CSV y período; no atribuir valores agregados al lote |
| GAEZ, GEDI, OpenET, USDA/ESA | Ampliaciones según caso | Justificar variable y cobertura geográfica del producto concreto |

## Precisiones de producto

- [SMAP L4 SPL4SMGP v8](https://nsidc.org/data/spl4smgp/versions/8) combina modelado y asimilación, en grilla de 9 km y pasos de tres horas. L3 y L4 tienen métodos y variables distintos; no tratarlos como una medición idéntica de raíces.
- [HLS](https://hls.gsfc.nasa.gov/) armoniza productos L30/S30 a 30 m. Esa es la resolución de HLS, distinta de las bandas originales de Sentinel-2.
- [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) aporta información superficial y productos derivados; no demuestra por sí solo una alerta con anticipación fija ni temperatura radicular.
- NDVI bajo indica poca vegetación verde; no determina por sí solo ausencia de rastrojo o una causa de degradación.
- Un remuestreo a 30 m no crea observaciones independientes a esa escala. El proyecto todavía no implementa un downscaling validado.
- ET₀, ET real y agua aplicada son magnitudes diferentes. El método presente de ET₀ es Hargreaves; el balance por cultivo es aproximado. [Definiciones FAO](https://www.fao.org/4/x0490e/x0490e04.htm).

## Flujo implementado

```text
POWER JSON → parser → perfil climático → motor de reglas → interfaz ES/EN
GIBS → capas visuales del mapa
```

Una extracción futura puede producir un JSON preparado con metadatos, que la capa de datos lea antes de evaluar su uso en el motor. El backend se agregará si la integración necesita credenciales o tareas protegidas. Las claves y tokens se mantienen fuera del cliente y del repositorio.

## Contrato mínimo de un dato nuevo

Fuente, producto, versión, variable, unidad, profundidad, soporte espacial, intervalo/estándar temporal, fecha de descarga, calidad, faltantes, transformación y archivo original. Etiquetar estado: `implementado`, `extraído`, `propuesto` o `no disponible`, y distinguir `observado`, `modelado` o `supuesto`.

El catálogo enlazado por la consigna está registrado en [recursos oficiales](../Field%20Shift%20-%20Obsidian/99%20Recursos/Revision%20consigna%20oficial/enlaces-recursos.json). La disponibilidad se comprueba por servicio, no por inclusión en esa lista.
