---
tipo: auditoria-de-software
fecha: 2026-11-14
estado: inspeccion-y-ejecucion-local
---
# Auditoría del prototipo

## Resultado

ZIP extraído en `prototipo/field-shift`. **24/24 pruebas y build aprobados.** Se descargó POWER 2011–2025 del punto predeterminado y se ejecutó el motor base y con sensibilidad. Las fuentes del ZIP se conservaron sin cambios; esta revisión agrega documentación, dependencias locales, build y un script de reproducción externo a la carpeta original.

## Qué hay y qué falta

| Componente | Comprobación |
| --- | --- |
| Cliente POWER | URL, timeout y parser; consulta real descargada por fuera de la UI y procesada con el parser del ZIP |
| Perfil climático | Lluvia, ET₀ Hargreaves, calor, heladas, tendencias y anomalías |
| Motor | 24 meses, catálogo de 12 cultivos, filtros y siete puntajes |
| Interfaz | Código ES/EN, Leaflet, Chart.js, presets, prioridades y sensibilidad; compilado, sin ensayo visual completo |
| GIBS | URLs de MODIS/SMAP presentes; no verificación visual en navegador |
| SMAP numérico/ECOSTRESS/HLS/LLM/backend | No implementados en el ZIP |
| Caché | Una consulta en memoria; no persistente ni carga desde archivo |
| Lote | Selección de punto; sin polígono ni entrevista |

Las pruebas usan principalmente datos sintéticos. El ejemplo de FAO contrasta radiación extraterrestre, no valida integralmente el balance de un lote.

## Ejecución con datos reales

Punto: `-27.7834, -64.2642`. Período: 2011–2025. Fuente: POWER/MERRA2, API v2.10.3, días LST. Se procesaron 5.479 días sin descartes del parser.

| Indicador | Base | Sensibilidad −20 % lluvia / +2 °C |
| --- | --- | --- |
| Lluvia media anual | 737,29 mm | 589,83 mm |
| ET₀ estimada Hargreaves | 1.779,09 mm | 1.864,74 mm |
| Días/año Tmax ≥35 °C | 94,4 | 128,2 |
| Índice P/ET₀ | 0,414 | 0,316 |

El escenario modifica artificialmente la serie base; no es pronóstico. No se reprodujo Iowa en esta revisión ni se validó un lote de Añatuya.

## Hallazgos que afectan la interpretación

1. **Meses sin cultivo = suelo desnudo en UI.** `buildTimeline` marca `bare` si no hay un cultivo del calendario. No incorpora observación del rastrojo. El puntaje de erosión sí supone protección residual en ciertos meses, por lo que ambas etiquetas tampoco representan lo mismo.
2. **La actual se optimiza.** `compareStrategies` modifica fechas del preset actual. Comparar contra ese calendario optimizado no equivale a comparar con el manejo real del productor.
3. **Oferta hídrica heurística.** `assessSlot` usa 75 % de lluvia, 120 mm multiplicados por humedad relativa y riego por cultivo. Reinicia esa reserva en cada cultivo y no propaga el consumo de coberturas al siguiente. No es un balance secuencial de almacenamiento.
4. **Dato ausente sustituido.** Si falta humedad inicial, usa 0,4. La UI debe identificarlo como supuesto.
5. **Helada sobreinterpretada.** El motor toma el máximo mensual, reduce el mes de siembra e ignora el último. El texto lo presenta como porcentaje de años con helada durante el ciclo; ese porcentaje no se calculó directamente de los ciclos anuales.
6. **Umbrales y puntajes.** Filtros 0,5/0,75 y escalas de suelo, erosión, plagas e ingresos son reglas/índices genéricos. No medirlos como probabilidad de fracaso, salud de suelo medida, pérdida o rentabilidad.
7. **Años casi completos.** El perfil acepta ≥360 días como completos. Exigir controles mensuales antes de interpretar extremos o comparar campañas con faltantes.
8. **Cobertura del catálogo.** No hay caupí ni restricciones de maquinaria/mercado implementadas. La entrada económica es un valor genérico por cultivo.

## Reproducir

Desde `prototipo/field-shift`: `npm ci`, `npm test`, `npm run build`. Para repetir el caso guardado: `node node_modules/vite-node/vite-node.mjs ../revisar-caso.ts`.

El script está fuera del directorio extraído. No descarga datos: lee el JSON guardado en la bóveda. El resultado depende de las mismas reglas del prototipo, con sus límites.

Registros: [pruebas](../99%20Recursos/Revision%20prototipo/pruebas.txt), [compilación](../99%20Recursos/Revision%20prototipo/compilacion.txt), [metadatos](../99%20Recursos/Revision%20prototipo/metadata.json), [resultado](../99%20Recursos/Revision%20prototipo/resultado-motor.json).

Siguiente acción: [[Cambios prioritarios]].
