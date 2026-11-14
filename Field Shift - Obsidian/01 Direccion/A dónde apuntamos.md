---
tipo: estrategia
estado: propuesta-basada-en-prototipo-revisado
fecha: 2026-11-14
---
# A dónde apuntamos

**A una herramienta para explorar qué rotación de dos años conviene evaluar en un lote de Santiago del Estero, según agua, cobertura y prioridades del productor.** Trabajamos sobre el prototipo recibido; Añatuya es el piloto territorial propuesto, sujeto a conseguir un caso local.

## Qué cambia con esta actualización

Ya existe el cliente POWER, el motor, el mapa y la interfaz ES/EN. Pasaron 24 pruebas y el build. La nueva conversación agrega evaluación y campos de entrega, pero describe también integraciones futuras como si ya estuvieran hechas: hay que ajustar esa presentación a lo que realmente corre.

[[Auditoría del prototipo]] separa implementación, ejecución y validación de campo.

## Decisión de alcance recomendada

| Aspecto | Dirección |
| --- | --- |
| Usuario | Productor y técnico local que comparan opciones |
| Pregunta | ¿Qué rotación explorar y qué condiciones revisar antes de adoptarla? |
| Caso principal | Un punto de Santiago del Estero, identificado como ilustrativo hasta documentar el lote |
| Horizonte | 24 meses |
| Comparación | Actual + hasta tres alternativas del catálogo; mostrar las descartadas y sus motivos |
| Foco | Agua y meses sin cultivo programado; cobertura real por comprobar |
| Base | POWER numérico + reglas transparentes; GIBS como contexto visual |
| Próximo cierre | Suelo, cultivos y restricciones locales; revisión de los indicadores |
| Siguiente integración numérica | SMAP con unidad, profundidad y fecha, después de completar el caso |
| Ampliaciones | ECOSTRESS, HLS, datos económicos e IA cuando haya utilidad y tiempo |

No hace falta sumar datasets para demostrar que NASA es central: POWER ya alimenta los cálculos. La prioridad inmediata es que los números, las etiquetas y la comparación sean defendibles. Ver [[Evaluación y prioridades]].

## Qué conservar

Interfaz bilingüe, calendario, escenarios de sensibilidad, explicaciones estructuradas, separación entre cliente de datos, análisis y motor. El escenario de lluvia/temperatura explora sensibilidad; no predice la campaña futura.

## Qué corregir primero

1. Distinguir meses sin cultivo de suelo desnudo observado.
2. Explicar el método hídrico como aproximación y hacer visibles suelo y parámetros supuestos.
3. Definir correctamente el indicador de helada y los umbrales que filtran opciones.
4. Conservar el calendario real del productor al evaluar la rotación actual.
5. Tratar ingresos y demás puntajes como índices heurísticos, no resultados medidos.

## Qué mostrar al jurado

Un caso completo: punto → manejo actual → prioridad → comparación → evidencia y límites. Usar un cambio de escenario para explicar qué opción cambia y por qué. El caso internacional queda como demostración secundaria pendiente; no convierte al sistema en una solución agronómicamente validada para todo el planeta.

La mezcla correcta de los materiales es: arquitectura de Claude, auditoría científica de GPT y evidencia de ejecución del prototipo. Ninguno de esos elementos reemplaza los datos del productor.

Próximo paso: completar suelo, cultivos y restricciones del caso, aplicar [[Cambios prioritarios]] y ensayar [[MVP y demo]].

La revisión directa de la consigna está en [[Consigna oficial y encaje]]. La meta actual + tres alternativas se conserva como elección de producto. El foco del desarrollo inmediato pasa al caso local y a interpretar correctamente lo que ya calcula el motor.
