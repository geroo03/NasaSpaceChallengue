---
tipo: prompt-de-diseno
estado: listo-para-usar
---
# Prompt para Stitch

Prompt preparado para diseñar el frontend sobre el prototipo existente. El diseño es una propuesta; no implica que los campos y cambios nuevos ya estén implementados.

```text
Diseñá el frontend responsive de “Field Shift Lab”, una herramienta que ayuda a productores y técnicos agrícolas a explorar rotaciones de cultivos durante los próximos dos años.

El caso inicial es Santiago del Estero, Argentina, con un futuro piloto en Añatuya. La herramienta combina datos históricos de NASA POWER, información del suelo, características de cultivos y prioridades del productor.

La experiencia debe responder claramente:
“¿Qué rotación podría evaluar para mi lote y por qué?”

IDIOMA Y TONO
Interfaz principal en español argentino, con selector ES/EN.
Lenguaje simple, cercano y comprensible para productores.
Usar “Comparar alternativas”, “Ver evidencia” y “Qué falta verificar”.
Presentar la herramienta como apoyo a la decisión y al diálogo con el técnico.

DIRECCIÓN VISUAL
Identidad propia de Field Shift.
Estética agrícola contemporánea, clara y profesional.
Fondo marfil, verde bosque como color principal, tonos tierra y ámbar para advertencias.
Tipografía muy legible, buena jerarquía y espacios amplios.
Evitar estética espacial, neón, exceso de tarjetas y decoración.
El elemento visual principal debe ser un campo esquemático 2D/isométrico conectado al calendario de rotaciones. Mantener una vista plana y botones accesibles; evitar efectos pesados. Etiquetar la imagen como representación ilustrativa/modelada y no como observación o predicción exacta de crecimiento.
Los gráficos siempre deben tener etiquetas, unidades y explicación.

DISEÑAR ESTAS VISTAS COMO UN FLUJO CONECTADO:

1. CONFIGURAR EL CASO

Encabezado con Field Shift, navegación simple y selector de idioma.

Título:
“Explorá alternativas para las próximas dos campañas”.

Usar un recorrido guiado con una pregunta por paso, progreso visible, volver sin perder datos y un resumen editable. En escritorio el campo puede acompañar al paso; en celular priorizar la pregunta y su acción principal.

Pasos:
- ¿Dónde está tu campo? Localidad o punto; coordenadas en detalle opcional.
- ¿Qué sembrás hoy? Imagen con nombre, otro cultivo o campo sin cultivo. Calendario actual editable.
- ¿Con qué podés trabajar? Tareas manuales y recursos para siembra, trabajo del suelo, riego, cosecha o manejo de coberturas, con imágenes y nombres que se revisarán localmente.
- ¿Qué querés priorizar? Agua, cobertura u otro objetivo, con texto claro.
- Revisar respuestas y comparar.

Para recursos, permitir: Lo tengo / Puedo compartirlo o pedirlo prestado / Puedo contratar el trabajo / No tengo acceso / Falta confirmar. Preguntar disponibilidad en la fecha de trabajo solo cuando aporte. Tener tractor no implica tener todos los implementos. La propiedad no determina por sí sola qué opciones son realizables.

Suelo, riego y detalles adicionales: información desplegable con explicación y “No lo sé” donde corresponda. Mostrar qué datos se declararon, estimaron o faltan. Evitar exigir vocabulario técnico para avanzar.

Diseñar estados de compatibilidad operativa por alternativa: compatible con recursos declarados, necesita conseguir equipo, limitación operativa o falta confirmar. Si la lógica todavía no existe, el prototipo muestra “Compatibilidad de equipos pendiente de evaluación”. Estos estados deben derivarse de reglas reales al implementarse, nunca de números de ejemplo.

Botón principal: “Ver opciones para mi campo”.

2. COMPARAR ROTACIONES

Mostrar un resumen compacto del caso y un botón “Editar datos”.

Comparar la rotación actual con hasta tres alternativas.
Cada opción debe incluir:
- Nombre de la secuencia.
- Calendario alineado de 24 meses.
- Cultivos y períodos sin cultivo programado.
- Razón principal para explorar esa alternativa.
- Indicadores relevantes de agua y exposición climática.
- Contrapartidas.
- Datos faltantes.
- Botón “Ver explicación”.

Identificar la actual como “Manejo de referencia”.
Usar “Alternativa para explorar” para las candidatas.
Si hay menos alternativas disponibles, explicar el motivo.

En escritorio, permitir comparación simultánea.
En celular, mostrar una alternativa a la vez con acceso sencillo a la referencia y las demás opciones. Dar primero qué cambia, por qué aparece, qué necesita y qué falta verificar.

Los puntajes, si aparecen, deben llamarse “Índice orientativo” y explicar que dependen de reglas y supuestos.

3. DETALLE DE UNA ALTERNATIVA

Organizar el contenido en:
- Por qué aparece.
- Evidencia utilizada.
- Beneficios potenciales.
- Riesgos y contrapartidas.
- Qué verificar en el lote.

Mostrar fuente, período, unidad y escala junto a cada indicador.
Añadir una sección plegable “Supuestos del cálculo”. Las limitaciones decisivas de agua o recursos permanecen visibles fuera del desplegable.

Incluir un panel de sensibilidad con controles:
- Cambio de lluvia.
- Cambio de temperatura.
- Restablecer escenario base.

Etiqueta permanente:
“Escenario exploratorio; no es un pronóstico”.

EVIDENCIA Y ESTADOS

NASA POWER alimenta los indicadores numéricos.
Las capas GIBS de vegetación y humedad aportan contexto visual.
SMAP numérico, ECOSTRESS y HLS deben aparecer solamente como ampliaciones pendientes, sin datos ficticios.

No presentar:
- Ahorros de agua garantizados.
- Rentabilidad calculada sin datos económicos.
- Puntajes como probabilidades de éxito.
- Meses sin cultivo como suelo desnudo observado.
- Una ubicación ilustrativa como lote validado.

Diseñar estados de carga, error de conexión, datos incompletos y ausencia de alternativas.
Mostrar fecha y procedencia cuando se utilicen datos guardados.

ACCESIBILIDAD E IMPLEMENTACIÓN

Frases cortas, palabras familiares, una acción principal por pantalla y textos junto a iconos. Diseñar para distintos niveles de lectura y experiencia digital, validando con productores reales y respetando su conocimiento agrícola.
Contraste suficiente, controles táctiles cómodos y navegación por teclado.
No depender únicamente del color para distinguir cultivos o riesgos.
Diseño compatible con Vite + TypeScript, Leaflet y Chart.js.
Priorizar componentes reutilizables, una navegación breve y una experiencia funcional.
```

Ver [[MVP y demo]] y [[Cambios prioritarios]] al convertir el diseño en código.

La especificación vigente del recorrido y los recursos está en [Experiencia Field Shift Lab](../../docs/EXPERIENCIA_FIELD_SHIFT_LAB.md). El frontend y sus reglas operativas siguen pendientes de implementación.
