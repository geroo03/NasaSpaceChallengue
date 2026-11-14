---
tipo: entrega
estado: borrador-ajustado-al-prototipo
fecha: 2026-11-14
---
# Entrega 2026

La actualización recibida aporta campos y reglas atribuidos a los PDFs «Criterios de Evaluación 2026» y «Componentes del Proyecto». No están adjuntos. La búsqueda de las guías oficiales no permitió recuperar su texto completo: verificar en la guía aplicable al equipo antes de enviar.

La consigna del desafío ya fue leída íntegramente y está revisada en [[Consigna oficial y encaje]]. Eso actualiza el alcance del producto; los PDFs y requisitos administrativos siguientes siguen pendientes de comprobación.

## Requisitos recibidos por confirmar

- Resumen de 50–200 palabras.
- Siete diapositivas, título incluido, o video de 30 segundos; no el guion anterior de 2–3 minutos.
- Link público sin login; subtítulos en inglés si corresponde.
- Declaración de IA y procedencia del código.
- Condiciones sobre marcas/logos y material de menores.
- Cierre el 15 de noviembre a las 23:59 en la zona horaria aplicable al equipo.

Son indicaciones del documento recibido, no certificación independiente del reglamento.

## Nombre y resumen en inglés

**Field Shift — NASA-powered crop rotation explorer**

Field Shift is a prototype that helps farmers explore two-year crop rotations using historical NASA POWER climate data and farmer priorities. Users select a location, choose a current rotation preset, and enter irrigation, slope and preference settings. A transparent rule engine compares the baseline with up to three alternatives, showing calendars, climate and water indicators, potential trade-offs, risks and information gaps. Rainfall and temperature controls explore sensitivity rather than predict future weather. NASA GIBS provides contextual vegetation and soil-moisture map layers. The initial demonstration uses a reference point in Santiago del Estero, Argentina. Soil, crop and market parameters remain generic and require local review. Numeric SMAP, ECOSTRESS and HLS integrations are planned extensions. The next step is a locally reviewed pilot with farmers and agricultural advisers.

## Detalles del proyecto

- **What it does:** explores rotation alternatives and priority-based trade-offs over a common 24-month calendar.
- **How it works:** NASA POWER daily temperature, precipitation and relative soil wetness feed monthly climate indicators, Hargreaves reference ET estimates, simplified crop-water assessments and a rule-based comparison. GIBS layers add map context. Scores are heuristic indices, not measured savings, yields or probabilities of success.
- **Benefits:** provides an explainable starting point for a conversation between farmer and adviser. Benefits remain hypotheses for the pilot.
- **Validation so far:** 24 existing unit tests passed, the production build passed, and the engine was replayed against a saved 2011–2025 POWER series at the prototype reference point. Field validation and full browser usability checks remain pending.
- **Tools present:** TypeScript, Vite, Leaflet, Chart.js and Vitest. No serverless backend or in-app LLM is present in the received ZIP.
- **Next steps:** review crop/soil assumptions and risk indicators locally; add a numeric SMAP evidence layer; test usability and collect field feedback.

## Uso de IA: ajustar a lo realmente hecho

Propuesta de texto, a revisar por el equipo:

> AI assistants supported research, documentation and software review. The team reviewed the generated material and tested the received prototype. The current application uses deterministic rules and structured explanations; it does not contain an in-app language-model integration.

Indicar herramientas y usos que efectivamente realizó el equipo. Esta actualización de documentación y revisión se hizo con Codex. El ZIP y su material atribuyen asistencia previa a Claude; confirmar el detalle con sus autores antes de declararlo. No marcar campos ni atribuir personas/autoría sin revisión del equipo.

## Datos y otros recursos

**Presentes:** NASA POWER como fuente numérica; NASA GIBS como visualización MODIS/SMAP. Citar período, punto, variables, producto y escala. FAO-56 como referencia metodológica de Hargreaves y parámetros de referencia; no llamarlo Penman–Monteith implementado.

**Pendientes de integración:** SMAP vía AppEEARS, ECOSTRESS, HLS, MAGyP, SoilGrids y LLM. No listarlos como datos ya utilizados por el motor.

**Bibliotecas/base de mapa:** Leaflet, Chart.js, Vite, Vitest y OpenStreetMap, con atribución correspondiente.

## Antes de enviar

- [ ] Leer guías/PDFs aplicables y confirmar sede, formato y cierre.
- [ ] Ajustar cada campo a la versión final que se muestra.
- [ ] Revisar uso de IA, datos y procedencia del código.
- [ ] Usar capturas reales; distinguir caso ilustrativo y piloto futuro.
- [ ] Verificar links públicos y acceso sin sesión.
- [ ] Guardar comprobante del envío.

La revisión local no publicó el sitio, repositorio ni formulario.
