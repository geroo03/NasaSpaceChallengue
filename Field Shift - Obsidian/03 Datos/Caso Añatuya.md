---
tipo: caso
estado: piloto-propuesto-con-referencia-regional
ubicacion: Añatuya, Santiago del Estero, Argentina
actualizado: 2026-11-14
---
# Caso Añatuya

**Añatuya sigue como piloto propuesto.** El prototipo permite seleccionar puntos; no contiene un productor identificado ni un polígono local confirmado. Su punto predeterminado es `-27.7834, -64.2642`, etiquetado en el código como Santiago del Estero, y no se debe presentar como un lote de Añatuya.

## Qué pudimos reproducir

POWER 2011–2025 en ese punto: 5.479 días útiles, lluvia media anual 737,29 mm y 94,4 días/año con Tmax ≥35 °C. El motor estima ET₀ de 1.779,09 mm/año mediante Hargreaves. Estos valores son regionales y dependen del producto/método; no mediciones del productor.

El preset soja–maíz registra 13 meses sin cultivo programado en 24. Eso proviene del calendario del algoritmo, no de HLS ni de observación de suelo desnudo.

## Datos a conseguir para el lote

| Campo | Estado |
| --- | --- |
| Productor y permiso de uso | Pendiente |
| Punto/polígono y superficie | Pendiente |
| Secano o riego | Secano como supuesto de demo |
| Textura, profundidad y agua útil | Pendiente; el código usa supuestos |
| Manejo y fechas actuales | Pendiente; soja–maíz es un preset |
| Rastrojo/cobertura real | Pendiente |
| Prioridades | Agua/cobertura propuestas; confirmar |
| Restricciones de maquinaria, semillas y mercado | Pendiente |
| Revisión de alternativas | Pendiente con técnico local |

## Alternativas compatibles con el código actual

El catálogo contiene soja, soja de segunda, maíz, sorgo, girasol, algodón, trigo, garbanzo, vicia, centeno, avena y alfalfa. **No contiene caupí.** La propuesta sorgo–caupí de la conversación inicial queda como línea de piloto a estudiar; no describirla como función implementada.

La ejecución base generó tres alternativas: sorgo/soja, algodón/maíz y algodón/trigo/soja de segunda, con coberturas agregadas según reglas. Son candidatos generados por el motor actual; no se asumió su viabilidad agronómica o comercial local.

Antes de convertirlos en recomendaciones: confirmar disponibilidad, fechas, costos, agua y manejo. Si las restricciones locales dejan menos de tres alternativas, mostrar esa limitación y las descartadas.

Usar [[Entrevista de campo]] y [[Protocolo reproducible]] al pasar del ejemplo regional al caso del productor.
