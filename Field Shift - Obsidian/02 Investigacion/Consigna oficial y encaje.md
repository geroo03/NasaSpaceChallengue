---
tipo: consigna
estado: fuente-primaria-leida
fecha_consulta: 2026-11-14
---
# Consigna oficial y encaje

Fuente: [Field Shift 2026](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/). Se leyó el contenido completo de Details y Resources directamente de la página oficial, incluida su información cargada dinámicamente. La publicación consultada indica actualización del 13 de noviembre de 2026.

## Lectura de la consigna

El eje combina observaciones NASA, suelo local, cultivos y prioridades del productor para explorar rotaciones. La comparación de al menos tres estrategias, incluida la actual, se presenta como sugerencia. Las consideraciones adicionales son opcionales. El enunciado no exige todos los datasets, un LLM ni una grilla común. Los recursos incluyen alternativas de agencias socias.

## Encaje con nuestro prototipo

Este diagnóstico se basa en el código ya inspeccionado y sus ejecuciones, documentados en [[Auditoría del prototipo]].

| Pieza del producto | Estado del ZIP | Decisión para nuestra demo |
| --- | --- | --- |
| Evidencia NASA | POWER entra al motor; GIBS visualiza capas | Conservar trazabilidad de cada número |
| Información del suelo | Reserva genérica de 120 mm | Llevar suelo local y su procedencia a P0; no sustituir desconocidos silenciosamente |
| Rasgos de cultivos | Catálogo genérico de 12 entradas | Seleccionar y revisar candidatos locales |
| Prioridades | Siete dimensiones ponderadas | Centrar el relato en agua y cobertura; aclarar índices heurísticos |
| Comparación | Actual + hasta tres alternativas | Conservar la meta de cuatro tarjetas como decisión de diseño |
| Incertidumbre | Algunos mensajes de límites; supuestos adicionales | Hacer visibles huecos y condiciones de uso |
| Caso | Punto regional reproducido | Etiquetarlo ilustrativo hasta tener un lote confirmado |

## Qué cambia en el trabajo

Mi recomendación es completar primero los datos y restricciones del caso, junto con las correcciones de agua, helada y calendario actual. Una nueva integración debe resolver una pregunta concreta: SMAP numérico es la siguiente candidata para contexto regional, con unidad/profundidad y sin confundirlo con observación del lote.

Conservar POWER, calendario, prioridades y sensibilidad permite cerrar una comparación coherente sobre la base existente. Agregar ECOSTRESS, HLS, un LLM o un caso internacional sigue condicionado a utilidad, datos disponibles y tiempo.

Las tres alternativas finales deben ser distintas y revisadas para el mismo contexto. Si las restricciones dejan menos, mostrar el motivo y revisar el catálogo sin fabricar opciones.

## Recursos localizados

Se guardaron los destinos enlazados en [enlaces-recursos.json](../99%20Recursos/Revision%20consigna%20oficial/enlaces-recursos.json). El registro incluye fuentes NASA, USDA/USGS/FAO y agencias socias; no se ensayó cada servicio. Elegir su uso según cobertura del caso argentino y documentación del producto concreto.

La descripción general de una misión no reemplaza las especificaciones de la versión utilizada. Ver [[Fuentes verificadas]] y [[Inventario de datos]].

## Qué sigue pendiente

La página del desafío no reemplaza las guías de inscripción, entrega y evaluación. Formato, plazo aplicable al equipo, reglas de código previo y declaración de IA siguen separados en [[Entrega 2026]]. No se confirmó su reglamento con esta lectura.

Procedencia de la consulta: [procedencia.json](../99%20Recursos/Revision%20consigna%20oficial/procedencia.json).
