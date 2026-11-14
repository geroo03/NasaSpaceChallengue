# Estrategias de rotación — candidatos y condiciones de comparación

Documento del equipo, actualizado el 14 de noviembre de 2026. Son opciones para explorar, no recomendaciones agronómicas validadas.

El [enunciado oficial](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) sugiere comparar estrategias, incluida la actual. Para nuestra demo se eligió **rotación de referencia + hasta tres alternativas**, sobre el mismo horizonte de 24 meses.

## Caso y referencia

El código usa el punto `-27.7834, -64.2642` y presets de manejo. No hay entrevista, polígono ni calendario de un productor de Añatuya confirmado. Por lo tanto, la referencia debe identificarse como ilustrativa hasta conseguir esos datos.

La rotación actual debe conservar las fechas del productor cuando se registren. El motor todavía optimiza también esa referencia; corregir o explicitar la diferencia antes de atribuirle una mejora frente al manejo observado.

## Opciones presentes en la ejecución guardada

Con POWER 2011–2025, secano, pendiente suave y prioridades predeterminadas, el escenario base devolvió:

| Rol | Identificador del motor | Secuencia principal | Revisión pendiente |
| --- | --- | --- | --- |
| Referencia | `soy_maize_fallow` | Soja / maíz | Confirmar que represente el manejo del caso |
| Alternativa 1 | `sorghum_soy` | Sorgo / soja, con coberturas según reglas | Agua, destino productivo y terminación de coberturas |
| Alternativa 2 | `cotton_maize` | Algodón / maíz, con coberturas según reglas | Maquinaria, mercado, parámetros y calendario local |
| Alternativa 3 | `cotton_wheat_soy2` | Algodón / trigo / soja de segunda, con coberturas según reglas | Ajuste de secuencia, fechas y disponibilidad de agua |

Los calendarios y puntajes exactos están en [resultado-motor.json](../Field%20Shift%20-%20Obsidian/99%20Recursos/Revision%20prototipo/resultado-motor.json). Son salidas del algoritmo con supuestos genéricos. Otro contexto o prioridades pueden cambiar el ranking y la cantidad de alternativas.

## Qué debe incluir cada comparación

- Calendario, variedad/parámetros y manejo en el mismo horizonte.
- Razón por la que aparece y reglas que la limitan.
- Evidencia con valor, fuente, período, unidad y escala.
- Beneficios potenciales y contrapartidas, sin ahorro garantizado.
- Restricciones de agua, suelo, maquinaria, semillas y mercado.
- Datos faltantes y revisión local necesaria.

Los períodos sin cultivo programado no equivalen a suelo desnudo observado. Rastrojo y cobertura requieren información adicional.

## Líneas agronómicas para un piloto posterior

| Idea | Estado | Qué falta |
| --- | --- | --- |
| Sustitución de un cultivo por sorgo | Hay sorgo en el catálogo; pertinencia local pendiente | Parámetros por variedad, objetivo y restricciones |
| Incorporación de una leguminosa | Hay soja, garbanzo y vicia; caupí ausente | Elegir especie y función con revisión local |
| Cultivos de servicio y rastrojo | El motor agrega ciertas coberturas por reglas | Consumo de agua, fecha de terminación y manejo real |
| Intercultivo sorgo–caupí | Propuesta experimental, no implementada | Modelo de simultaneidad, densidades, competencia, parámetros y ensayo |

Rotación es sucesión en el tiempo; intercultivo implica simultaneidad. Una misma propuesta puede combinar ambos, pero hay que representarlo explícitamente. El modelo actual asigna un cultivo por mes y no soporta ese consorcio simultáneo.

## Afirmaciones que requieren evidencia específica

No se asignan porcentajes de ahorro de agua, reducción de pérdidas, fijación de nitrógeno o retención hídrica al caso. Tampoco se garantizan ciclos por un total genérico de grados-día ni se usan umbrales universales de humedad para emergencia.

Para sostener esos efectos hacen falta referencias identificables y aplicables, parámetros locales y, cuando se afirme impacto del proyecto, mediciones o modelos calibrados pertinentes. Una referencia al Sahel o a una misión satelital no constituye validación de un lote chaqueño.

La cobertura puede consumir agua antes del cultivo siguiente: registrar esa contrapartida y evitar un beneficio automático. El cálculo hídrico actual no propaga ese consumo entre cultivos; ver [auditoría](AUDITORIA_ESTRATEGICA_NASA.md).
