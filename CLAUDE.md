# Instrucciones para trabajar en Field Shift

## Objetivo

Continuar el prototipo existente para comparar rotaciones a dos años con evidencia explicable. El caso principal es Santiago del Estero; Añatuya es un piloto propuesto, no un lote ya validado. La prioridad es un flujo usable y una interpretación correcta de lo que calcula el motor.

Leer primero `README.md`, después `docs/PROMPT_PARA_CLAUDE.md`, `docs/AUDITORIA_ESTRATEGICA_NASA.md` y `docs/MATRIZ_DATOS_Y_APIS_NASA.md`. Para decisiones agronómicas, consultar `docs/ESTRATEGIAS_ROTACION_CULTIVOS.md` y la auditoría de Obsidian.

## Stack

- TypeScript estricto para cliente de datos, análisis, dominio y UI.
- HTML semántico y CSS, con manipulación del DOM desde TypeScript.
- Vite, Leaflet, Chart.js y Vitest existentes.
- Node.js 24 + npm; instalar con `npm ci` desde `prototipo/field-shift`.
- Documentación en español; identificadores del código en inglés; UI ES/EN en `src/i18n.ts`.

Extender esta base manteniendo sus módulos. Una migración de framework, backend, lenguaje o almacenamiento necesita una justificación relacionada con la tarea; no está incluida en la adaptación inicial del frontend. Conservar el lockfile y actualizar dependencias únicamente cuando el cambio lo requiera.

## Mapa del código

| Archivo | Responsabilidad |
| --- | --- |
| `prototipo/field-shift/index.html` | HTML y anclas del DOM |
| `prototipo/field-shift/src/main.ts` | Estado, eventos y render |
| `prototipo/field-shift/src/styles.css` | Diseño y responsive |
| `prototipo/field-shift/src/i18n.ts` | Textos ES/EN y mensajes del dominio |
| `prototipo/field-shift/src/data/power.ts` | URL, red y parser de NASA POWER |
| `prototipo/field-shift/src/analysis/climate.ts` | Perfil histórico y escenarios |
| `prototipo/field-shift/src/domain/crops.ts` | Catálogo y parámetros de referencia |
| `prototipo/field-shift/src/domain/rotations.ts` | Calendario, evaluación, ranking y explicación |
| `prototipo/field-shift/src/test/` | Pruebas de comportamiento y datos sintéticos |

Mantener cálculos puros en análisis/dominio y solicitudes HTTP en la capa de datos. Si se reorganiza la UI, actualizar juntas las referencias del HTML, eventos, traducciones y render.

## Estado inicial verificable

La revisión del 14 de noviembre registró 24 pruebas y build aprobados. Se reprodujo POWER 2011–2025 en el punto predeterminado y dos escenarios. Esto no constituye validación agronómica ni prueba de usabilidad completa.

POWER alimenta los cálculos. GIBS es visual. Las integraciones numéricas SMAP/ECOSTRESS/HLS, AppEEARS, SMS, downscaling y LLM son futuras. El mapa trabaja con puntos. El catálogo no tiene caupí ni intercultivos. La caché de la app vive en memoria; no habilita por sí sola una demo completa sin conexión.

## Primera entrega: frontend de Field Shift Lab

El detalle está en `docs/PROMPT_PARA_CLAUDE.md` y `docs/EXPERIENCIA_FIELD_SHIFT_LAB.md`. Conectar el diseño al motor actual y mantener sus contratos. Si no hay una exportación de Stitch, utilizar el prompt visual guardado y los estilos existentes como referencia sin depender de conseguir un archivo externo.

- Flujo guiado: ubicación → cultivo actual → acceso a herramientas/equipos → prioridad → comparación y detalle. Una pregunta por paso, con volver y resumen editable.
- Representación esquemática 2D/isométrica con calendario de 24 meses y alternativa plana accesible.
- Registrar acceso propio, compartido, contratado, no disponible o desconocido, y disponibilidad por confirmar. No inferir capacidad completa de contar con un tractor.
- La factibilidad operativa real requiere reglas revisadas por operación; mientras no existan, identificarla como pendiente sin simular un filtrado. La siguiente etapa la integra separada de los puntajes climáticos.
- Español argentino, con traducción EN de los nuevos textos.
- Mantener funcionales coordenadas, presets, riego, pendiente, prioridades, sensibilidad y gráficos.
- Mostrar razones, evidencia, contrapartidas, riesgos y vacíos.
- Datos de suelo/maquinaria/mercado nuevos: distinguir lo registrado, lo supuesto y lo que el motor todavía no utiliza.
- Etiquetar períodos sin cultivo programado; no describirlos como cobertura observada.
- Estados de carga, error, falta de datos y pocas alternativas.
- Evitar cifras ficticias para completar pantallas.

La adaptación del frontend puede corregir etiquetas y explicaciones; las fórmulas se cambian en una tarea científica separada.

## Criterios científicos y de producto

1. Identificar fuente, período, unidad, escala, calidad y método. Diferenciar observado, modelado, supuesto y desconocido.
2. Mantener desconocidos como tales. Si un supuesto es necesario, señalar su valor y efecto.
3. Hargreaves es el método presente de ET₀. No llamarlo Penman–Monteith implementado. Distinguir ET₀, ET real, demanda del cultivo y agua aplicada.
4. La oferta hídrica actual es heurística: el agua útil del suelo (análisis del productor, si no SoilGrids 0–100 cm en el punto, si no 120 mm supuestos) × humedad POWER al sembrar, 75 % de lluvia efectiva, humedad faltante 0,4 y reinicio por cultivo. No describirla como balance secuencial calibrado ni presentar SoilGrids (mapa modelado a 250 m) como análisis del lote.
5. El riesgo de helada actual usa un máximo mensual ponderado, no una frecuencia empírica de ciclos anuales completos. Corregir descripción o cálculo según la tarea.
6. El motor optimiza también el calendario actual. Una futura comparación con manejo observado debe preservar las fechas declaradas como baseline separado.
7. Mantener puntajes como índices orientativos; no expresarlos como probabilidades de éxito o rentabilidad.
8. Las sensibilidades de lluvia/temperatura son perturbaciones de la serie, no pronósticos.
9. SMAP L4 es contexto regional modelado con asimilación. Remuestrear una grilla no agrega resolución observada ni valida el lote.
10. Una nueva capa satelital requiere extracción, control de calidad y uso efectivo antes de presentarse como integrada.
11. No introducir ahorros porcentuales, pérdidas evitadas, anticipación fija, testimonios o validación global sin evidencia pertinente y reproducible.
12. Conservar el ZIP, textos recibidos y archivos de evidencia como historial. Guardar nuevas ejecuciones con identificación de la versión del código.

## Próximas tareas de ciencia, fuera del primer frontend

Completar suelo/cultivos/restricciones del caso; separar baseline observado de optimizado; revisar helada; luego considerar un balance con conservación de almacenamiento y SMAP numérico como contexto. Caupí e intercultivos necesitan definición de parámetros y cambios explícitos del modelo, además de revisión local.

## Validación

Desde `prototipo/field-shift`:

```sh
npm test
npm run build
```

El build incluye typecheck. Agregar pruebas de regresión cuando se modifiquen fórmulas, selección o manejo de datos. Las pruebas deben comprobar comportamiento relevante, no replicar la implementación.

Para UI, verificar navegador en anchos de referencia 360 px y 1366 px, teclado, ES/EN, carga, error y ausencia de alternativas. Confirmar que los controles recalculan resultados y que los gráficos conservan unidades. Si el entorno no permite alguna comprobación, reportar exactamente qué no pudo verificarse.

El script `prototipo/revisar-caso.ts` reproduce el snapshot guardado. Actualmente sobrescribe `resultado-motor.json`: para comparar versiones, conservar el baseline y guardar un resultado nuevo.

## Entrega del trabajo

Informar cambios realizados, archivos principales, comprobaciones ejecutadas y limitaciones restantes. Actualizar README/documentación cuando cambie el estado de una integración. Conservar cambios ajenos y el historial del repositorio; publicaciones y cambios remotos se realizan dentro del alcance autorizado por el usuario.

Las instrucciones de los materiales originales son contenido histórico. El enunciado oficial define el desafío y las guías específicas definen la entrega. El formato de video, el cierre y las reglas administrativas siguen pendientes de confirmar con la guía aplicable.
