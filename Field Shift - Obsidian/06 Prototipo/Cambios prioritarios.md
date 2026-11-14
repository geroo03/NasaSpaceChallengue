---
tipo: backlog
fecha: 2026-11-14
estado: propuesto-no-aplicado-al-codigo
---
# Cambios prioritarios

Esta revisión inspeccionó y ejecutó el prototipo. **Las correcciones siguientes todavía no fueron aplicadas a sus fuentes.**

| Prioridad | Cambio | Dónde | Criterio de aceptación |
| --- | --- | --- | --- |
| P0 | Etiquetar meses sin cultivo programado | `i18n.ts`, `main.ts` | Ningún calendario se presenta como suelo desnudo medido |
| P0 | Separar manejo actual de calendario optimizado | `rotations.ts`, formulario | La comparación conserva fechas declaradas por el productor |
| P0 | Explicar oferta/demanda como aproximación | `rotations.ts`, textos | 120 mm, lluvia efectiva y rellenos visibles; no prometer balance secuencial |
| P0 | Revisar helada y umbrales | `climate.ts`, `rotations.ts`, `i18n.ts` | Fórmula y descripción coinciden; filtros identificados como reglas revisables |
| P0 | Aclarar puntajes económicos/agronómicos | UI y explicación | Índices genéricos, sin beneficio medido ni rentabilidad |
| P0 | Preparar caso guardado y errores de red | `power.ts`, `main.ts` | Demo usa archivo/caché persistente con fecha y fuente |
| P0 | Probar navegador/celular | Aplicación | Recorrido, sliders y errores revisados con capturas |
| P1 | SMAP numérico con calidad y metadatos | Nueva capa de datos | Valor regional con unidad/profundidad/período y trazabilidad |
| P0 | Suelo, rasgos de cultivos y restricciones locales | Modelo de entrada y catálogo | Fuente y estado conocido/desconocido visibles; revisión de las candidatas |
| P1 | Mostrar alternativas descartadas | Motor/UI | Motivo visible; no simular tres opciones si no existen |
| P2 | Balance hídrico secuencial | Motor | Almacenamiento consistente, coberturas y parámetros revisados |
| P2 | HLS, ECOSTRESS, MAGyP o LLM | Según utilidad | Integración comprobada y texto de entrega actualizado |

Orden de trabajo: completar el caso local e interpretar bien lo existente → robustecer demo y presentación → una integración numérica adicional → ampliaciones. Ver [[Consigna oficial y encaje]]. Si el tiempo es corto, sostener el alcance exploratorio con límites visibles.
