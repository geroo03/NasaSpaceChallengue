---
tipo: inventario
estado: prototipo-y-consulta-power-disponibles
actualizado: 2026-11-14
---
# Inventario de datos

La primera parte registra el estado histórico del ZIP. Los agregados posteriores describen la app actual en `front-nasa/`.

| Material | Estado comprobado |
| --- | --- |
| Conversaciones GPT, Claude original y actualización | Preservadas en `05 Material recibido` |
| `field-shift.zip` | Recibido; SHA-256 en metadatos |
| `prototipo/field-shift` | Código extraído; fuentes originales intactas |
| Pruebas | 24/24 aprobadas; 3 archivos |
| Build | TypeScript y Vite aprobados; salida local en `dist` |
| POWER 2011–2025 | JSON real del punto predeterminado guardado; 5.479 registros útiles |
| Resultado del motor | Base y sensibilidad calculados y guardados |
| Datos de lote/entrevista/mediciones de suelo | No aportados |
| SMAP/ECOSTRESS numéricos, HLS y MAGyP | Sin archivos locales ni integración comprobada |

## Cómo entra cada fuente al producto

| Fuente | Uso presente | Próximo paso |
| --- | --- | --- |
| NASA POWER | Temperatura, precipitación, humedad relativa del suelo; alimenta análisis/motor | Registrar procedencia y calidad en UI; conservar consulta |
| GIBS | Teselas visuales MODIS NDVI y SMAP | Verificar fecha efectiva, leyenda y disponibilidad en navegador |
| Catálogo de cultivos | 12 entradas y parámetros genéricos | Revisar por zona y variedad; no hay caupí en el código |
| Suelo | Capacidad fija 120 mm y conversión heurística desde humedad relativa | P0: dato local con fuente o estado desconocido y supuesto visible |
| Pendiente | Entrada plana/suave/fuerte | Confirmar con usuario; no hay SRTM automático |
| Mercado | Índice genérico por cultivo | No presentar rentabilidad calculada |
| SMAP numérico | Pendiente | Segunda fuente numérica a priorizar |
| ECOSTRESS/HLS/SoilGrids/MAGyP | Ampliaciones | Integrar solo con caso de uso y trazabilidad |

## Archivos de evidencia

En `99 Recursos/Revision prototipo`: `metadata.json`, `pruebas.txt`, `compilacion.txt`, `power-descarga.json`, `power-punto-prototipo-2011-2025.json` y `resultado-motor.json`.

La respuesta NASA indica POWER API v2.10.3, fuentes MERRA2/POWER y tiempo **LST**, no UTC. `GWETROOT` y `GWETTOP` tienen unidad `1`; no equivalen a humedad volumétrica.

La descarga revisada cubre el punto predeterminado del programa. No corresponde a una observación de campo ni a un lote confirmado de Añatuya. El código permite nuevas consultas, pero no se ensayó toda la app en navegador.

## Arquitectura inspeccionada

Vite/TypeScript + Leaflet + Chart.js. Cliente POWER → perfil climático → motor de reglas → interfaz ES/EN. No hay backend, AppEEARS, HLS, ECOSTRESS numérico ni llamadas LLM en el ZIP.

La caché de la app guarda una serie en memoria; se pierde al recargar. Guardar un JSON en esta bóveda todavía no habilita su carga en la app.

## Catálogo de recursos del desafío

[[Consigna oficial y encaje]] reúne la nueva lectura de la página y enlaza el inventario de destinos oficiales. La lista de recursos no modifica por sí sola el estado implementado: cada nueva integración requiere su extracción y documentación.


## Agregado el 15/11/2026

| Fuente | Uso en la app | Tipo |
| --- | --- | --- |
| NASA SRTM (~30 m, AWS Terrain Tiles) | Altura, desnivel y pendiente general del lote; la pendiente entra al motor | Dato NASA |
| ISRIC SoilGrids 2.0 (250 m) | Agua útil 0–100 cm (CC − PMP), textura y carbono orgánico en el punto de análisis; reemplaza los 120 mm genéricos | Mapa modelado (no NASA) |
| NASA POWER para el lote de ejemplo (2011–2025) | Serie guardada sin modificar, `public/data/power-anatuya-2011-2025.json` | Dato NASA |
| SoilGrids para el lote de ejemplo | Respuesta guardada sin modificar, `public/data/soilgrids-anatuya-example.json` | Mapa modelado |
| NOAA CPC ONI (2009–ASO 2026) | Fase El Niño / La Niña de cada campaña y estado observado actual; `src/data/oni.ts` | Dato observado (NOAA, no NASA) |
| ECOSTRESS ECO_L3T_JET.002 | Catálogo CMR + lectura de ETdaily (mm/día) por punto desde CSV de AppEEARS; filtros cloud/water, almacenamiento y ficha. Descarga directa con Earthdata verificada: cinco pasadas, dos observaciones válidas y tres faltantes; snapshot real disponible para la demo | Derivado satelital NASA; evidencia complementaria, no entra al ranking |
