---
tipo: presentacion
estado: borrador-basado-en-funciones-inspeccionadas
actualizado: 2026-11-14
---
# Pitch y guion

## Mensaje central

Field Shift es un prototipo para explorar rotaciones de cultivos a dos años usando clima histórico de NASA POWER y las prioridades del productor. Permite seleccionar un punto, elegir un manejo actual y comparar hasta tres alternativas con calendarios, indicadores, riesgos y datos faltantes. El caso inicial es Santiago del Estero, Argentina. Buscamos revisar sus parámetros y comparaciones con productores y técnicos de Añatuya antes de atribuirle resultados de campo.

## Qué demostramos

El motor ejecutó una serie real de 2011–2025 y un escenario de sensibilidad. Las 24 pruebas existentes y el build pasan. Eso acredita funcionamiento de software en los casos revisados; no prueba ahorro de agua ni mayor rendimiento.

## Guion recomendado: siete diapositivas

Formato propuesto por la actualización recibida, pendiente de comprobar en la guía aplicable. La diapositiva de título está incluida en las siete.

1. **Pregunta:** qué rotación explorar durante los próximos dos años y por qué.
2. **Caso:** punto ilustrativo de Santiago del Estero, preset soja–maíz y 94,4 días/año con Tmax ≥35 °C en POWER 2011–2025. Los 13 meses son sin cultivo programado, no suelo desnudo medido.
3. **Aporte:** comparar secuencias y prioridades con evidencia; antecedentes citados sin atribuirse superioridad no demostrada.
4. **Flujo:** punto → manejo → restricciones/prioridades → comparación. Usar capturas reales de navegador cuando estén disponibles.
5. **Evidencia:** POWER numérico, método Hargreaves, calendario y supuestos. GIBS como contexto visual; mencionar SMAP numérico solo cuando esté integrado.
6. **Sensibilidad:** −20 % de lluvia / +2 °C. Mostrar qué cambia; no llamarlo pronóstico. Iowa queda opcional y fuera del relato principal.
7. **Alcance y límites:** próximo piloto, datos faltantes, link de demo si existe y revisión agronómica necesaria.

El antiguo guion de 2–3 minutos es un ensayo interno. La actualización menciona una alternativa de video de 30 segundos: no trasladar tiempos de un formato al otro sin verificar la guía.

## Respuestas breves

**¿Cuánta agua ahorra?** No está medido; el algoritmo compara indicadores bajo supuestos.

**¿Mide mi lote?** POWER es contexto regional. El mapa selecciona un punto. Los datos de campo y la delimitación del lote siguen pendientes.

**¿Qué hace SMAP hoy?** Una capa GIBS lo visualiza. No aporta todavía valores numéricos al cálculo del ZIP.

**¿Usa IA dentro de la app?** No hay llamadas LLM en el código recibido. Declarar por separado la asistencia real usada para investigación, documentación y código.

**¿Funciona globalmente?** Puede consultar puntos, pero catálogo y reglas requieren revisión regional. Una consulta geográfica no equivale a validación global.

Ver [[Entrega 2026]] antes de copiar textos al formulario.

## Validación con el sector (14/11/2026)

Juan Pablo Suárez Ríos, dueño de Vuelo Verde (más de 100 pilotos de drones agrícolas), autorizó la cita y el nombre de la empresa. Ver [[Entrevista Vuelo Verde]].

- «No existe un problema básico dirigido hacia la agricultura, sino poder tomar decisiones antes de sembrar.» Va en la diapositiva 1 (pregunta).
- «Tomar decisiones en el campo basado a la información es la clave para ahorrar dinero.» Ir con cuidado: no implica que Field Shift ya ahorre dinero medido.
- «Lo que tenemos como déficit en el país es la mano de obra calificada.» / «No solo creo, estoy seguro.» Van en la diapositiva 7, como aliado operativo.

Mensaje: el satélite y el clima dan el historial; Field Shift planifica la rotación y dice qué y cuándo verificar; el dron de Vuelo Verde confirma en el lote. Presentarlo como colaboración acordada de alcance por definir, no como sociedad formal ni como validación de resultados.
