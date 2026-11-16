# Revisión de los cambios de Claude — 15/11/2026

Versión revisada: `da3d966` de `geroo03/NasaSpaceChallengue`. Comparación con el rediseño e integración de `21bded1`, y lectura de las funciones posteriores. La app ahora pertenece al repositorio principal, en `front-nasa/`; dejó de ser el repositorio Git anidado anterior.

Esta revisión agrega este documento. No modifica las funciones, no publica cambios y no constituye validación agronómica.

## Evaluación

El proyecto avanzó: pasó de mostrar alternativas a enlazar lote, suelo, comparación, verificaciones y planificación de trabajos con dron. Esa continuidad es su mejor argumento. SoilGrids añade una entrada que faltaba al modelo, y separar el balance diario del índice evita presentar una calibración que todavía no existe.

La comparación histórica Niño/Niña es útil si conserva siempre su período y tamaño de muestra. La ficha para compartir conecta el producto con el técnico. El procesamiento local de archivos y la ausencia de claves en el cliente son decisiones adecuadas para este prototipo.

La parte más nueva, la prescripción por vigor, requiere correcciones antes de usar sus archivos en una operación real. También hay errores de estado y de funcionamiento sin conexión que las pruebas actuales no detectan.

## Qué incorporó

| Cambio | Qué hace realmente | Límite relevante |
| --- | --- | --- |
| Tres pantallas y lote de ejemplo | Lote → campaña → opciones; ficha imprimible y herramientas técnicas plegables | El ejemplo es ilustrativo; no es un lote de productor validado |
| Relieve y DSM | Estima pendiente del polígono; admite un DSM para reemplazar la estimación | Una pendiente general no identifica todos los bajos ni valida drenajes |
| SoilGrids | Calcula agua útil por capas y la usa en el índice; admite agua útil declarada | Mapa modelado de 250 m consultado en un punto |
| Niño/Niña | Agrupa campañas históricas con NOAA ONI y recalcula comparaciones | Pocas campañas por fase; no pronostica el lote |
| Calor en floración | Cuenta días y rachas cálidas en un mes aproximado por cultivo | No identifica la floración observada ni la sensibilidad de cada híbrido |
| Balance diario | Conserva almacenamiento entre cultivos con dos capas | Modelo complementario sin calibrar; el índice conserva su cálculo anterior |
| Sistemas de riego | Descuenta pérdidas según eficiencia y estima láminas por sistema | Eficiencias orientativas; no evalúa caudal, costos ni programación real |
| Trabajos con dron | Estima recorridos, fotos, insumos, cargas y tiempos | Planificación; no es una misión validada para ejecutar en el equipo |
| Prescripción por vigor | Lee un GeoTIFF, clasifica índices y exporta dosis por celda | Fallas reproducidas de bandas y de geometría, detalladas abajo |
| PWA | Manifiesto, aviso sin señal y almacenamiento de respuestas | El primer uso no deja todos los archivos necesarios disponibles sin conexión |
| Reorganización y entrega | Unifica código, documentación, vault y guion de presentación | Persisten instrucciones y afirmaciones contradictorias |

## Estado (actualizado el 15/11/2026, noche)

Los 10 hallazgos están corregidos en `main`, con pruebas de regresión (171 en total):

| # | Corrección | Commit |
| --- | --- | --- |
| 1 | Las respuestas de clima de una corrida anterior se descartan | `d2b27bc` |
| 2 | La prescripción exporta solo píxeles válidos dentro del lote; el total en pantalla sale de las mismas celdas | `1994999` |
| 3 | RGB/RGBA rechazado para NDVI (PhotometricInterpretation y alfa), con pruebas sobre GeoTIFF reales | `d2b27bc`, `1994999` |
| 4 | El service worker precarga todo el build; abre sin señal tras una sola visita (comprobado en Chromium) | `1994999` |
| 5 | El análisis de suelo se descarta al cambiar de lote o de punto (> 1 km) | `1994999` |
| 6 | SoilGrids exige el perfil completo 0–100 cm; carbono faltante = desconocido | `1994999` |
| 7 | El calendario permite explorar el manejo actual sin cambiar la alternativa comparada | `1994999` |
| 8 | Balance rotulado «simulación en secano», con aviso si se declaró riego | `1994999` |
| 9 | Inicio del balance según el calendario del motor (norte/sur), con prueba de regresión | `1994999` |
| 10 | La ficha y la nota conservan las campañas Niño/Niña junto al escenario manual | `1994999` |

## Hallazgos, por prioridad

### 1. P1 — Una respuesta vieja puede reemplazar el clima del lote nuevo

**Archivo:** `front-nasa/src/App.tsx:138`.

`run()` actualiza `load` cuando termina cualquier consulta, sin comprobar que sigue siendo la más reciente. La navegación permite volver al lote mientras se descarga POWER.

**Reproducción en navegador:** iniciar una consulta para Santiago del Estero, demorar artificialmente esa respuesta, volver a «Tu lote», cargar el ejemplo y consultar otra vez. La respuesta nueva aparece primero; luego la anterior reemplaza sus resultados mientras el encabezado conserva las coordenadas de Añatuya.

Con dos respuestas sintéticas distinguibles, la lluvia de octubre–marzo cambió de 1.643 a 183 mm bajo el mismo rótulo de Añatuya. Esas cifras son marcadores de la prueba, no resultados climáticos reales.

**Corrección propuesta:** identificar cada ejecución y aceptar resultados/errores solo de la última; cancelar solicitudes anteriores cuando corresponda. Aplicar la comprobación también a caché y fallback. Los resultados deben conservar el punto y período de la serie utilizada.

### 2. P1 — La prescripción exporta superficie excluida y no coincide con el total mostrado

**Archivo:** `front-nasa/src/imagery/vigor.ts:110`.

La lectura elimina píxeles fuera del lote, pero `prescriptionGrid()` convierte un bloque entero en una celda cuando encuentra al menos un píxel válido. No recorta el polígono exportado al límite ni a la máscara. Además, el total de producto de la interfaz se calcula por áreas originales de las zonas, mientras la exportación usa la clase mayoritaria de cada bloque.

**Reproducción:** un raster de 2 × 2 con un único píxel válido produjo una celda que abarca también los otros tres. En ese ejemplo, la interfaz contabiliza 0,01 ha válidas y el polígono exportado abarca aproximadamente 0,043 ha, por la geometría sintética utilizada.

**Impacto:** caminos, monte o zonas sin datos pueden recibir una dosis en el archivo. Las cantidades y superficies informadas tampoco tienen por qué coincidir con la prescripción resultante.

**Corrección propuesta:** preservar el límite y las exclusiones al construir la geometría final; calcular superficie, dosis y total desde esa misma geometría. Probar bordes diagonales, lotes cóncavos, huecos sin datos y cambios de dosis dentro de una celda.

### 3. P1 — Un ortomosaico RGB con transparencia se acepta como multiespectral

**Archivo:** `front-nasa/src/imagery/vigor.ts:202`.

El lector supone que cualquier imagen de cuatro bandas tiene rojo en la segunda y NIR en la cuarta. Un GeoTIFF RGBA común también tiene cuatro bandas: la cuarta es transparencia, no infrarrojo. La interfaz no permite confirmar qué banda representa cada variable.

**Reproducción:** un GeoTIFF sintético con RGB = 120/80/50 y alfa = 255 fue aceptado y produjo «NDVI» ≈ 0,522. El control de rango −1…1 no detecta el error porque la fórmula con bandas equivocadas también devuelve valores dentro de ese rango.

**Corrección propuesta:** rechazar RGB/RGBA para cálculo de NDVI; comprobar metadatos de bandas y alfa. Para multiespectral, pedir o verificar una correspondencia explícita rojo/NIR y reflectancia adecuada. Conservar soporte separado para índices ya calculados. Añadir pruebas que lean archivos TIFF reales, además de probar la fórmula.

### 4. P1 — La primera visita no garantiza que la app abra sin conexión

**Archivos:** `front-nasa/public/sw.js:14`, `front-nasa/src/main.tsx:17`.

El service worker se registra después de cargar la página. Durante la instalación precarga HTML y datos de ejemplo, pero no el JavaScript ni el CSS compilados. Esos archivos se guardan solo si se solicitan cuando el worker ya controla la página.

**Reproducción con el build de producción:** contexto nuevo de Chromium → abrir una vez → esperar instalación y control del worker → desconectar la red → recargar. Resultado: cuerpo vacío y `#root` sin hijos; fallaron las solicitudes de `index-aGvfp0sP.js`, los módulos compartidos y el CSS. La caché contenía los JSON y HTML, pero no esos archivos.

**Corrección propuesta:** generar en el build una lista versionada de archivos necesarios y precargarlos, incluidos los módulos requeridos por el flujo prometido. Mostrar «Listo para usar sin conexión» solo al terminar esa preparación. Probar primera visita, instalación, recarga sin señal y actualización entre despliegues. La disponibilidad de los mapas debe describirse por separado.

### 5. P2 — El análisis de suelo declarado pasa silenciosamente a otro lote

**Archivo:** `front-nasa/src/case/model.ts:277`.

`withLot()` invalida relieve y pendiente derivados, pero conserva `soilPawDeclaredMm`. El adaptador del motor siempre prioriza ese valor, aunque hayan cambiado las coordenadas.

**Reproducción:** declarar 250 mm para un campo y cargar otro polígono conserva 250 mm y vuelve a identificarlos como provenientes del análisis de suelo. Comprobado con las funciones reales del modelo.

**Corrección propuesta:** vincular el análisis al lote/punto y pedir reconfirmación o invalidarlo cuando cambia. Distinguir un ajuste del mismo límite de la selección de otro campo. Aplicar la misma regla a cambios por preset o coordenadas.

### 6. P2 — Un perfil incompleto se informa como agua útil hasta un metro

**Archivo:** `front-nasa/src/case/soil.ts:93`.

El parser omite capas con datos faltantes y acepta cualquier resultado con tres capas. Si están disponibles solo 0–5, 5–15 y 15–30 cm, suma únicamente 30 cm y presenta el resultado como reserva 0–100 cm.

**Reproducción:** quitar del JSON de ejemplo las capas de 30–60 y 60–100 cm produce un resumen aceptado con 25,55 mm y tres capas. La interfaz sigue diciendo «Agua útil hasta 1 m» y el motor usa ese número como capacidad del perfil completo.

También convierte carbono orgánico faltante en cero, por lo que puede informar ausencia de materia orgánica cuando falta la medición.

**Corrección propuesta:** exigir cobertura completa para calcular la reserva de un metro o declarar explícitamente profundidad y faltantes, sin sustituir la capacidad completa por una suma parcial. Conservar carbono desconocido como desconocido.

### 7. P2 — El calendario permite pulsar el manejo actual, pero no seleccionarlo

**Archivo:** `front-nasa/src/components/results/ResultsScreen.tsx:473`.

El manejador descarta el identificador de la referencia. La escena, verificaciones y servicios permanecen en la alternativa aunque se pulse una celda del manejo actual; solo cambia el mes.

**Reproducción:** estaba seleccionado `calendar-sorghum_soy-19`; al pulsar `calendar-current-0` quedó seleccionado `calendar-sorghum_soy-0`. Comprobado con Chromium. También afecta la coherencia de selección y foco al navegar con flechas.

**Corrección propuesta:** permitir seleccionar la referencia para exploración y mantener independiente la alternativa con la que se compara. Usar ese estado de manera coherente en escena, calendario y verificaciones.

### 8. P2 — El gráfico de agua ignora el riego declarado sin identificarlo claramente como secano

**Archivos:** `front-nasa/src/case/climateRisk.ts:251`, `front-nasa/src/components/results/ResultsScreen.tsx:224`.

El riego modifica el índice y la tabla de necesidades. Sin embargo, el balance diario solo recibe estrategia, clima, capacidad del suelo y ET₀: no recibe una programación de riego. Para un mismo calendario no puede reflejar el agua aplicada por el usuario. Los textos dicen «agua en tu suelo» y «el día de siembra» sin destacar esa exclusión.

**Comprobación:** inspección de fórmula, argumentos y textos. No se validó una programación de riego de campo.

**Corrección propuesta:** rotularlo «simulación histórica en secano» y explicitar que no incluye riego, hasta implementar una programación temporal defendible. Con una lámina total por cultivo no se conoce cuándo fue aplicada.

### 9. P2 — El balance diario usa julio como inicio también para puntos del hemisferio norte

**Archivo:** `front-nasa/src/case/climateRisk.ts:276`.

El calendario del motor empieza en enero para el norte, pero el balance calcula sus índices con `d.month - 7` para cualquier latitud. Al aplicar calendarios de Iowa u otros puntos del norte, asigna los cultivos a meses desplazados seis meses.

**Comprobación:** inspección del índice del balance frente al contrato `calendarMonthAt()` del motor. La prueba visual principal de esta revisión fue el caso del hemisferio sur.

**Corrección propuesta:** derivar el inicio de la rotación del hemisferio/calendario de la estrategia, añadir una regresión norte/sur o limitar explícitamente esta función al sur mientras se corrige.

### 10. P2 — La ficha pierde la etiqueta Niño/Niña al agregar un escenario manual

**Archivo:** `front-nasa/src/components/results/ResultsScreen.tsx:252`.

`usedSeries` sigue filtrando las campañas de `year.phase` al editar lluvia/temperatura. La ficha, en cambio, elimina `subset` cuando hay `custom`. Por ejemplo, Niño + menos lluvia se presenta sin identificar que el cálculo siguió usando solo las campañas Niño.

**Comprobación:** inspección del filtro y del contrato de la ficha.

**Corrección propuesta:** representar por separado la selección de campañas y la perturbación aplicada, y exportar ambas siempre que estén activas.

## Documentación y presentación

- `CLAUDE.md` anuncia correctamente la app actual al principio, pero mantiene instrucciones operativas de Vanilla TypeScript, Chart.js y pruebas desde `prototipo/field-shift`. Conviene actualizar el cuerpo completo: un asistente podría seguir verificando el proyecto equivocado.
- El inventario de Obsidian conserva el estado original como si fuera vigente y agrega un apéndice con las integraciones nuevas. Separar «histórico del ZIP» de «estado actual» y enlazar una fuente de estado única. Los recuentos 105/114/120 de documentación ya no coinciden con las 126 pruebas ejecutadas aquí.
- La nota de entrevista todavía dice que Field Shift no procesa imágenes y que la aplicación variable queda fuera. El código nuevo sí las procesa. Registrar esa ampliación como decisión pendiente de validar con Vuelo Verde, especialmente formatos y uso efectivo del archivo exportado.
- El video dice «el agua que vas a tener al sembrar», pero muestra una simulación histórica sin calibrar. Mejor: «cuánta agua habría al sembrar en las campañas analizadas». También conviene decir «datos NASA y mapas de suelo» para no atribuir SoilGrids a NASA.
- La entrevista editada aporta permiso para presentar una alianza territorial; eso permite actualizar el relato anterior. Sigue faltando un lote real, comparación con mediciones y acuerdo operativo concreto. No describir la entrevista como validación de exactitud del modelo.
- NOAA ONI fue contrastado con la fuente oficial durante esta revisión: el registro consultado termina en ASO 2026 con +2,46 °C, igual que el snapshot. El archivo de la app es estático: conservar fecha y no prometer actualización automática. Fuente: https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt.
- SoilGrids es un modelo global de 250 m, no un análisis del terreno: https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs.html. La tarjeta lo aclara; sostener la misma precisión en README, pitch y presentación.

## Propuesta de producto

Mantendría esta decisión como centro: **«Qué rotación explorar en mi lote y qué verificar antes de sembrar»**. La secuencia satélite → comparación → verificación → pedido al técnico/piloto tiene un propósito concreto.

La pantalla de resultados de la prueba a 360 px mide aproximadamente 13.581 px de alto. No tiene desborde horizontal de página, pero sí mucho recorrido para el público al que apuntan. Propondría:

1. Arriba: manejo actual, alternativa, dos razones y un riesgo; botón «Ver mi plan».
2. Después: calendario y próxima verificación con fecha, responsable y dato faltante.
3. Bajo «Ver clima y agua»: ENSO, floración, balance y necesidades de riego.
4. Bajo «Herramientas del técnico»: bandas, prescripciones, planes de vuelo y parámetros operativos.

No sumaría otra API antes de resolver las cuatro prioridades P1. Para la demo usaría una comparación reproducible del lote ilustrativo y dejaría la prescripción como función experimental hasta corregirla y revisar una exportación con Vuelo Verde. El próximo avance con mayor valor es un lote real con su análisis y un GeoTIFF conocido, contrastado con el técnico.

## Verificaciones realizadas y límites

- `npm test`: **126/126** pruebas, 18 archivos, aprobadas con Vitest 5.1.0.
- `npm run build`: typecheck y build aprobados. Bundle principal: 479,33 kB, 148,71 kB gzip; herramientas pesadas separadas en módulos.
- Chromium: ejemplo → campaña → opciones; escritorio y 360 px; sin excepciones de JavaScript en ese recorrido. POWER y SoilGrids se sirvieron desde los snapshots para hacer reproducible la comprobación; las capas visuales externas se bloquearon en ese ensayo.
- Reproducciones adicionales: competencia entre consultas con respuestas sintéticas, lectura RGBA como NDVI, expansión de máscara en prescripción, suelo incompleto, traslado de análisis entre lotes y selección del calendario.
- PWA: build local de producción con service worker real, contexto limpio y desconexión de red. Se reprodujo pantalla vacía tras la primera visita.
- GitHub informa **Vercel: success** para `da3d966`. El HTML del dominio público referencia el mismo bundle principal y CSS del build local. Esto confirma el despliegue observado; no reemplaza las pruebas funcionales.
- No se ejecutaron misiones de dron, aplicaciones, una conversión/importación a DJI SmartFarm, calibración agronómica ni pruebas con productores. No se recibieron para esta revisión un mapa NDVI de campo con bandas certificadas ni una receta real.

Los scripts de reproducción y capturas quedaron en `/private/tmp/` durante esta sesión; no son archivos versionados. Este documento conserva los pasos, condiciones y resultados para convertir los hallazgos en pruebas permanentes al corregirlos.
