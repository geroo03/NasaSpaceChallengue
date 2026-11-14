# Presentación y pitch — borrador del equipo

Actualizado el 14 de noviembre de 2026. Textos ajustados al prototipo recibido y revisado. No son textos oficiales de NASA ni acreditan validación de campo.

## Mensaje central

Field Shift ayuda a explorar rotaciones de cultivos a dos años con clima histórico de NASA POWER y prioridades del productor. Permite seleccionar un punto, elegir un manejo de referencia y comparar alternativas con calendarios, indicadores, riesgos y datos faltantes. El caso inicial es Santiago del Estero, Argentina; se propone un piloto con productores y técnicos de Añatuya para revisar parámetros y resultados.

La versión actual calcula indicadores con POWER y utiliza GIBS para contexto visual. Las integraciones adicionales deben mencionarse como futuras hasta estar verificadas.

## Resumen en inglés para adaptar al formulario

Field Shift is a prototype for exploring two-year crop rotations using historical NASA POWER climate data and farmer priorities. Users select a location, choose a current rotation preset and enter irrigation, slope and preference settings. A transparent rule engine compares the baseline with up to three alternatives, showing calendars, climate and water indicators, potential trade-offs, risks and information gaps. Rainfall and temperature controls explore sensitivity rather than forecast future weather. NASA GIBS adds contextual vegetation and soil-moisture map layers. The initial case is a reference point in Santiago del Estero, Argentina. Soil, crop and market parameters remain generic and require local review. The next step is a pilot with farmers and agricultural advisers to review the assumptions and comparisons.

Verificar extensión e idioma exigidos en la guía aplicable antes de enviarlo. Si cambia el software, reescribir el resumen según sus funciones finales.

## Estructura de presentación propuesta

Siete diapositivas como borrador de trabajo; el formato oficial aplicable sigue por confirmar.

1. **Pregunta:** qué rotación explorar durante los próximos dos años y por qué.
2. **Caso:** ubicación regional, carácter ilustrativo, manejo de referencia y prioridades.
3. **Flujo:** configurar → comparar → abrir evidencia y límites.
4. **Fuente:** POWER numérico, período y método; GIBS como contexto visual.
5. **Comparación:** calendario común, hasta tres candidatas y contrapartidas.
6. **Sensibilidad:** cambio de lluvia/temperatura y efecto sobre las opciones; no es pronóstico.
7. **Próximo paso:** revisión agronómica, datos del lote y piloto propuesto.

Usar capturas de la versión realmente ejecutada. Si hay gráficos de ejemplo o un personaje ilustrativo, etiquetarlos. La serie regional revisada puede citarse con su punto y período; no atribuirla a un productor ni a Añatuya sin confirmar ubicación.

Un video de 2–3 minutos puede servir para ensayo interno. La actualización recibida menciona una alternativa de 30 segundos; confirmar en la guía el formato y duración antes de producir la entrega.

## Respuestas al jurado

**¿Qué datos NASA entran al cálculo?** POWER aporta temperatura, precipitación y humedad relativa del suelo. Las capas GIBS de MODIS y SMAP son visuales. No hay SMAP numérico, ECOSTRESS ni HLS integrados en el motor recibido.

**¿Cuánta agua ahorra?** No está medido. El algoritmo compara indicadores bajo supuestos; el piloto definirá métricas según secano o riego.

**¿Cómo resuelven la escala de parcela?** Todavía no hay downscaling validado. La interfaz debe mostrar el soporte regional de cada producto y los datos de campo que faltan.

**¿Qué se comprobó?** En la revisión registrada pasaron 24 pruebas y el build. Se reprodujo el motor con una serie real POWER 2011–2025 y un escenario de sensibilidad. No equivale a 24 campañas agrícolas ni validación de impacto.

**¿Usa inteligencia artificial dentro de la app?** La versión recibida usa reglas y explicaciones estructuradas. No tiene llamadas LLM. Declarar por separado el uso real de asistentes para investigar, documentar o generar/revisar código.

**¿Por qué el productor debe revisarlo con un técnico?** Los parámetros son genéricos, faltan datos locales y hay simplificaciones en agua, helada, suelo y mercado.

## Revisión antes de enviar

- Verificar requisitos, plazo y formato de la sede/guía aplicable.
- Alinear demo, README, datos usados y descripción del proyecto.
- Declarar asistencia de IA y procedencia del código con precisión.
- Confirmar acceso a los links sin sesión y requisitos de subtítulos/marcas.
- Incluir solo resultados trazables y testimonios autorizados.

Se retiran del pitch los porcentajes sin respaldo, la anticipación fija, los SMS/downscaling no implementados y las promesas de alcance global validado. El [README](../README.md) documenta el stack y las funciones presentes.
