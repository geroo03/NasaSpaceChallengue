# Field Shift Lab — experiencia del productor y recursos disponibles

Decisión de producto del 14 de noviembre de 2026. Este documento define el siguiente frontend y una capa operativa futura; no describe funciones ya implementadas.

## Objetivo

Permitir que un productor explore rotaciones y escenarios sobre una representación visual del campo, usando sus prioridades y los trabajos que puede realizar. Diseñar para distintos niveles de lectura y experiencia digital, respetando su conocimiento agrícola. La escolaridad y el manejo de herramientas digitales no deben inferirse de la ubicación del productor.

## Recorrido simple

Mostrar una pregunta por paso, progreso visible, botones grandes, ejemplos y opción de volver sin perder respuestas. El resumen previo al cálculo permite revisar lo registrado.

| Paso | Pregunta de pantalla | Respuesta inicial |
| --- | --- | --- |
| 1 | ¿Dónde está tu campo? | Localidad o punto en mapa; coordenadas en detalle opcional |
| 2 | ¿Qué sembrás hoy? | Imagen + nombre de cultivo, otro cultivo o campo sin cultivo; calendario editable |
| 3 | ¿Con qué podés trabajar? | Recursos y acceso, con preguntas de seguimiento solo cuando aporten |
| 4 | ¿Qué querés priorizar? | Opciones con texto: cuidar el agua, mantener cobertura u otro objetivo |
| 5 | Revisá tu campo y explorá opciones | Resumen, representación del campo y alternativas |

Para condiciones desconocidas, ofrecer «No lo sé» o «Falta confirmar» cuando tenga sentido. La captura inicial no obliga a introducir términos como ET₀, NDVI, milímetros de riego o profundidad radicular. Un detalle opcional permite registrarlos con explicación y procedencia.

Si el usuario indica otro cultivo fuera del catálogo, mostrar esa limitación y conservar la respuesta. No sustituirlo silenciosamente por un preset.

## Acceso a maquinaria y herramientas

Preguntar por capacidades disponibles: tareas manuales, tractor/equipo de trabajo, siembra, riego, cosecha y manejo de coberturas. Los nombres e imágenes concretos se revisarán con productores/técnicos de la zona. Tener tractor no confirma contar con sembradora, implemento o servicio apropiado.

Para cada recurso relevante, registrar:

| Estado | Texto simple |
| --- | --- |
| `owned` | Lo tengo |
| `shared` | Puedo pedirlo prestado o usarlo en grupo |
| `contracted` | Puedo contratar el trabajo |
| `unavailable` | No tengo acceso |
| `unknown` | Falta confirmar |

Compartir o contratar requiere confirmar disponibilidad en la ventana de trabajo; también pueden importar costo y mano de obra. No asumir que un servicio es accesible por existir en la zona.

La lista es un catálogo inicial de preguntas, no una asignación automática de equipos obligatorios a cada cultivo. Definir necesidades por operación y manejo con un técnico local, incluyendo alternativas manuales o de servicio que sean pertinentes.

## Efecto real sobre las alternativas

Agregar una evaluación de factibilidad operativa separada del puntaje climático. Propuesta de contrato:

- `FarmCapabilities`: recurso/operación, tipo de acceso, disponibilidad por confirmar o declarada y ventana cuando se conozca.
- `OperationRequirement`: operación, momento, capacidad requerida, alternativas posibles y fuente/revisión de esa regla.
- `OperationalAssessment`: estado, motivos y requisitos pendientes por alternativa.

Mensajes posibles: «Compatible con los recursos declarados», «Necesitás conseguir equipo», «Hay una limitación operativa» y «Falta confirmar». Aclarar que compatibilidad operativa no significa validación agronómica.

Una disponibilidad desconocida produce una pregunta o advertencia. Una limitación confirmada no se debe presentar como una opción lista para implementar. Mantener visible la razón y, cuando corresponda, qué servicio o cambio de manejo habría que revisar.

Ejemplo de interacción ilustrativa: si una alternativa incluye una operación para la cual el usuario dijo que no tiene acceso, esa tarjeta indica la limitación. Si puede contratarla, indica la gestión y disponibilidad pendientes. El ejemplo no establece una regla agronómica universal.

## Render interactivo

Usar una representación esquemática 2D o isométrica 2.5D, compatible con la base HTML/CSS/TypeScript y teléfonos modestos. El productor puede recorrer los 24 meses y seleccionar cultivos/períodos para conocer su explicación.

El calendario y la geometría del campo se etiquetan como ilustrativos o modelados según su procedencia. El dibujo no representa una observación de altura, biomasa o crecimiento real. Si solo existe un punto, no inventar un límite de parcela observado.

Mantener una vista plana y controles accesibles fuera del render. Una animación opcional respeta movimiento reducido; la visualización no es condición para leer resultados. El mapa y sus capas pueden necesitar conexión aunque exista una comparación guardada.

Los escenarios seco, habitual y húmedo deben identificar cómo se construyeron. Incorporar El Niño exige revisar la señal regional y su fuente/fecha; no asignar automáticamente una cantidad de lluvia ni daño al lote por una fase ENOS.

## Presentación de resultados

Mostrar una alternativa a la vez, con acceso sencillo al manejo actual y a las demás opciones. Conservar el mismo calendario de comparación. La primera explicación responde:

1. Qué cambiaría en la secuencia.
2. Por qué aparece esa opción.
3. Qué necesita para realizarla.
4. Qué falta verificar.

Las fuentes, unidades, fórmulas y supuestos están disponibles en «Ver detalles». No ocultar una limitación decisiva dentro de ese panel. Mantener las cuatro perspectivas: información declarada, dato de fuente, resultado modelado y dato desconocido.

## Lenguaje y accesibilidad

Usar frases breves, palabras conocidas, una acción principal por pantalla, texto junto a iconos y ejemplos locales revisados. Texto grande y legible, contraste suficiente, navegación por teclado y estados de error que indiquen cómo continuar. No transmitir estado solo mediante color.

Audio bajo demanda puede evaluarse como ampliación; no depender de él ni asumir soporte sin conexión de la síntesis de voz. Evitar reproducción automática. Las fotos/ilustraciones necesitan etiquetas; no asumir que un icono es universal.

Estas decisiones toman como referencia la guía complementaria WAI sobre [pasos claros](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/) y [lenguaje claro](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p01-clear-words/). Son criterios de diseño y no una certificación de accesibilidad.

## Etapas de implementación

**Primero, frontend:** recorrido simple, render esquemático, captura de recursos, resumen, estados y explicaciones conectados al motor. Si aún no existen reglas de equipos revisadas, mostrar «Compatibilidad de equipos pendiente de evaluación»; no aparentar que la selección filtra el ranking.

**Después, factibilidad operativa:** definir/revisar requisitos por operación y conectar los recursos declarados a estados y restricciones reales, conservando separada la evaluación climática. Probar que cambiar el acceso a un recurso cambie el estado pertinente y que desconocido no se interprete como disponible.

La conservación de almacenamiento, el baseline real y la fórmula de heladas mantienen su revisión científica separada. El stack continúa en README/CLAUDE.md; esta decisión no incorpora una librería 3D ni un backend.

## Validación con usuarios

Probar con productores de distintas edades y experiencias digitales, y con un técnico local. Pedirles que indiquen un cultivo, registren un recurso propio/compartido/contratado y expliquen una alternativa sin dirigir sus respuestas.

Registrar dónde necesitan ayuda, errores, tiempo de tarea y comprensión de las advertencias. Revisar si entienden que el escenario no es pronóstico y que conseguir equipo está por confirmar. Ajustar textos e imágenes con esa evidencia; el diseño todavía no fue validado con usuarios.
