---
tipo: auditoria
estado: pendiente-de-validacion-local
---
# Matriz de evidencia

| Afirmación recibida | Estado actual | Qué hacer |
| --- | --- | --- |
| −45 % de consumo de agua | Sin datos locales adjuntos | Retirar del pitch; definir agua aplicada, ET o humedad antes de medir |
| −51 % de pérdidas | Sin comparación reproducible | Retirar; distinguir detección, acción y pérdida evitada |
| +30–60 % de retención por sorgo–caupí | Referencia exacta pendiente | Tratar como hipótesis de ensayo |
| Cambios de NDVI o temperatura atribuibles a rotación | Sin comparación controlada | Revisar clima, cultivo, etapa y escala |
| 40–80 kg N/ha/año | Sin ensayo aplicable identificado | Distinguir fijación y disponibilidad para el siguiente cultivo |
| Retorno de 1,5 temporadas | Sin presupuesto | Conseguir costos, precios, rendimiento y sensibilidad |
| 150–300 familias beneficiarias | Sin padrón o censo trazable | Presentar población objetivo sin cuantificar alcance |
| Marcos perdió el 60 % | Testimonio no adjunto | Identificar como personaje ilustrativo o aportar registro |
| APIs probadas con CORS y tiempos de respuesta | POWER descargado desde terminal; CORS/tiempos en navegador no reproducidos | Ensayar desde la app; no atribuir al curl una prueba de CORS |
| Existe `field-shift.zip` funcional | ZIP recibido; 24 pruebas y build aprobados | Ver [[Auditoría del prototipo]]; falta ensayo completo en navegador/celular |
| SMAP/ECOSTRESS disponibles para el lote | Capacidad de producto; extracción ausente | Confirmar cobertura, calidad y fechas |
| Umbrales helada ≥50 % y déficit ≥75 % | Implementados como filtros; sin validación agronómica adjunta | Revisar fórmula, significado y calibración antes de defenderlos como límites universales |
| Caso transferible a Iowa por grados-día | No demostrado | Validar por cultivo, variedad, fotoperíodo, suelo y sistema de manejo |

## Medición según sistema productivo

**Con riego:** agua aplicada en m³/ha, rendimiento en kg/ha, manejo y condiciones comparables.

**Secano:** precipitación, humedad por profundidad, cobertura y rendimiento. Una lluvia menor o una ET menor no equivalen automáticamente a ahorro de riego.

**Alertas:** anticipación, falsas alertas y episodios detectados. Para afirmar pérdida evitada, registrar acción tomada y comparar resultados.

Volver a [[Protocolo reproducible]] antes de incorporar una cifra al [[Pitch y guion]].

## Actualización con ejecución del prototipo

| Afirmación | Estado al 14 de noviembre de 2026 | Límite |
| --- | --- | --- |
| 24 tests y build correcto | Reproducido localmente | No valida resultados agronómicos |
| ~94 días/año con Tmax ≥35 °C | Reproducido: 94,4 en POWER 2011–2025 del punto predeterminado | No transferir a Añatuya ni a un lote sin revisar ubicación |
| 13 meses de suelo desnudo | El código cuenta 13 meses sin cultivo programado en el preset soja–maíz | No mide rastrojo ni observación satelital de suelo desnudo |
| ET₀ FAO-56 | Se implementa Hargreaves con referencia a FAO-56 | No es Penman–Monteith |
| SMAP/ECOSTRESS/HLS/LLM ya integrados | No presentes como integraciones numéricas/LLM en el ZIP | Corregir el borrador de entrega recibido |
| Comparación con tres alternativas | Reproducida para el punto base y sensibilidad | Los filtros pueden devolver menos en otros casos |

Archivo de ejecución: [resultado-motor.json](../99%20Recursos/Revision%20prototipo/resultado-motor.json). Ver [[Correcciones técnicas]] y [[Cambios prioritarios]].
