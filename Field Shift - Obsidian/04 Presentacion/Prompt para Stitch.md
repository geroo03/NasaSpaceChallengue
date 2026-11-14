---
tipo: prompt-de-diseno
estado: listo-para-usar
---
# Prompt para Stitch

Prompt preparado para diseñar el frontend sobre el prototipo existente. El diseño es una propuesta; no implica que los campos y cambios nuevos ya estén implementados.

```text
Diseñá el frontend responsive de “Field Shift”, una herramienta que ayuda a productores y técnicos agrícolas a explorar rotaciones de cultivos durante los próximos dos años.

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
El elemento visual principal debe ser el calendario de rotaciones.
Los gráficos siempre deben tener etiquetas, unidades y explicación.

DISEÑAR ESTAS VISTAS COMO UN FLUJO CONECTADO:

1. CONFIGURAR EL CASO

Encabezado con Field Shift, navegación simple y selector de idioma.

Título:
“Explorá alternativas para las próximas dos campañas”.

En escritorio: formulario a la izquierda y mapa a la derecha.
En celular: formulario primero y mapa plegable.

Formulario:
- Seleccionar ubicación mediante un punto en el mapa o coordenadas.
- Identificar el caso como ilustrativo o correspondiente a un productor.
- Elegir rotación actual: soja–maíz, soja continua u otra.
- Registrar fechas del manejo actual.
- Sistema productivo: secano o riego.
- Agua de riego disponible, cuando corresponda.
- Textura del suelo y profundidad útil, con opción “No lo sé”.
- Pendiente.
- Restricciones de maquinaria, semillas y mercado.
- Prioridad principal: disponibilidad de agua o cobertura del suelo.
- Prioridades adicionales en un panel desplegable.

Botón principal:
“Comparar rotaciones”.

Mostrar qué datos ingresó el usuario, cuáles vienen de una fuente y cuáles faltan.

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
En celular, usar tarjetas verticales y un selector para comparar dos opciones.

Los puntajes, si aparecen, deben llamarse “Índice orientativo” y explicar que dependen de reglas y supuestos.

3. DETALLE DE UNA ALTERNATIVA

Organizar el contenido en:
- Por qué aparece.
- Evidencia utilizada.
- Beneficios potenciales.
- Riesgos y contrapartidas.
- Qué verificar en el lote.

Mostrar fuente, período, unidad y escala junto a cada indicador.
Añadir una sección plegable “Supuestos del cálculo”.

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

Contraste suficiente, controles táctiles cómodos y navegación por teclado.
No depender únicamente del color para distinguir cultivos o riesgos.
Diseño compatible con Vite + TypeScript, Leaflet y Chart.js.
Priorizar componentes reutilizables, una navegación breve y una experiencia funcional.
```

Ver [[MVP y demo]] y [[Cambios prioritarios]] al convertir el diseño en código.
