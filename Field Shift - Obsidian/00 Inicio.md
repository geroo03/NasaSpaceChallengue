---
tipo: inicio
actualizado: 2026-11-14
tags: [field-shift, space-apps]
---
# Field Shift — espacio de trabajo

**Apuntamos a cerrar una demo de planificación de rotaciones para Santiago del Estero sobre el prototipo existente.** Compara el manejo actual con hasta tres alternativas a dos años, explica sus datos y supuestos y muestra cómo cambian los resultados con las prioridades del productor.

Añatuya sigue siendo el territorio propuesto para el piloto. El punto predeterminado del código es un ejemplo de Santiago del Estero, todavía no un lote confirmado de Añatuya.

## Estado actualizado

- ZIP recibido y extraído en `prototipo/field-shift`, junto a esta bóveda en la carpeta del proyecto.
- **24 pruebas aprobadas y compilación de producción correcta.**
- Consulta real de POWER 2011–2025 guardada: 5.479 días, sin días descartados por el parser. Motor reproducido con escenario base y −20 % de lluvia / +2 °C.
- POWER alimenta el motor. GIBS aporta capas visuales. SMAP numérico, ECOSTRESS, HLS y LLM siguen pendientes de integración.
- Falta validar el manejo del lote, parámetros agronómicos, interpretación de indicadores y uso en navegador/celular.
- Consigna completa recuperada: [[Consigna oficial y encaje]]. Completar el caso y el suelo local pasa a P0, antes de ampliar integraciones.

## Empezá por acá

1. [[A dónde apuntamos]] — producto, usuario y prioridades.
2. [[Auditoría del prototipo]] — qué se comprobó y qué limita los resultados.
3. [[Cambios prioritarios]] — qué corregir antes de ampliar.
4. [[Plan de trabajo]] — tareas desde el estado real.
5. [[Entrega 2026]] — campos y formato de presentación.
6. [[Consigna oficial y encaje]] — lectura directa del enunciado y ajuste de prioridades.
7. [[Preparación para Claude]] — stack, README y prompt para continuar el frontend.
8. [[Field Shift Lab y recursos]] — recorrido simple, render y acceso a herramientas/equipos.

## Mapa

| Tema | Notas |
| --- | --- |
| Producto | [[MVP y demo]] · [[Decisiones]] · [[Caso Añatuya]] · [[Preparación para Claude]] |
| Evidencia | [[Inventario de datos]] · [[Protocolo reproducible]] · [[Matriz de evidencia]] |
| Ciencia | [[Consigna oficial y encaje]] · [[Correcciones técnicas]] · [[Fuentes verificadas]] |
| Presentación | [[Pitch y guion]] · [[Evaluación y prioridades]] · [[Entrega 2026]] · [[Prompt para Stitch]] |
| Material recibido | [[GPT - original]] · [[Claude - original]] · [[Claude - actualizacion 2026-11-14]] |
| Plantillas | [[Ficha de fuente]] · [[Entrevista de campo]] |

## Cómo leer los estados

**Recibido:** afirmación del material aportado. **Inspeccionado:** encontrado en el código. **Ejecutado:** comprobado con un comando y registro. **Validado en campo:** contrastado con referencia local apropiada; no hay resultados en esta última categoría.

Las pruebas de software y una ejecución con clima real no validan recomendaciones agronómicas ni impacto económico.

## Usar esta bóveda

Abrí `Field Shift - Obsidian` como carpeta de bóveda en Obsidian. No requiere extensiones. Guardá adjuntos en `99 Recursos/Adjuntos`. Los registros de revisión están en `99 Recursos/Revision prototipo`.
