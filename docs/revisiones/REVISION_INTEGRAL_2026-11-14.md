# Revisión integral de Field Shift — 14/11/2026

Revisión del código, documentación, evidencia guardada, entrevista con Vuelo Verde y estado local de Git. Incluye la nueva aplicación `front-nasa/`, además del prototipo anterior. Este informe no modifica la implementación ni publica los cambios locales.

## Resultado

La nueva interfaz convierte la propuesta de Field Shift Lab en una demo utilizable: recorrido guiado, comparación de referencia y tres alternativas, campo isométrico conectado al calendario, sensibilidad y herramientas para imágenes y delimitación. El avance de interfaz es mayor que el avance del modelo agronómico. La próxima prioridad es asegurar que ubicación, restricciones y evidencia correspondan al mismo caso.

El proyecto puede presentarse como un **explorador de rotaciones y un plan de verificaciones de campo**, con supuestos visibles. Todavía no sustenta recomendaciones agronómicas validadas, pronósticos de El Niño, rentabilidad real ni detección automática de estrés dentro del lote.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| `front-nasa`: `npm test` | 62 pruebas aprobadas, 10 archivos |
| `front-nasa`: `npm run build` | TypeScript y compilación aprobados |
| Prototipo anterior: `npm test` | 24 pruebas aprobadas |
| Prototipo anterior: `npm run build` | Aprobado |
| Navegador Chromium, ancho de 390 px | Recorrido con serie guardada completado; referencia y tres alternativas; sin desbordamiento horizontal en la vista comprobada |
| Persistencia de coordenadas | Fallo reproducido al vaciar latitud y recargar |
| Riego y adjuntos | Fallos reproducidos en navegador y funciones puras |
| Transformación POSGAR | Error reproducido con un punto de referencia de Añatuya |
| Integridad del JSON climático | SHA-256 coincide con el declarado: `c5c4cab935fbfe2b74bf634ef560cb2a7bcdd7d830d1e6f85dd1a5e4db0f5725` |

En las comprobaciones de navegador se bloquearon las solicitudes externas y se utilizó el JSON local para aislar el comportamiento de la app. No se certificó la disponibilidad en vivo de CMR/GIBS, el aspecto de sus teselas, la compatibilidad con un controlador DJI real ni el comportamiento con ortomosaicos grandes. Las pruebas aprobadas no cubren todos los recorridos de interfaz descritos abajo.

## Errores reproducidos y prioridad

### P1 — Planos y ortomosaicos POSGAR se ubican incorrectamente

En `front-nasa/src/imagery/crs.ts:16`, el falso este usa `faja * 500000`. La definición de las zonas argentinas requiere `faja * 1000000 + 500000`. Para la faja 4 son 4.500.000 m, mientras el código utiliza 2.000.000 m. La diferencia entre GRS80 y WGS84 no explica este desplazamiento.

Ejemplo: el punto de Añatuya `lon=-62.8347, lat=-28.4606`, proyectado correctamente a EPSG:5346, produce aproximadamente `E=4516189.57, N=6852467.70`. La transformación actual lo devuelve como `lon=-38.2963, lat=-26.2058`. Pasa el control de rango y termina en el Atlántico. Afecta tanto a DXF como a GeoTIFF que utilizan este helper.

Corregir las definiciones y agregar referencias de coordenadas conocidas para las siete fajas. La prueba actual del meridiano central no detecta este error. Fuente primaria: [base de conversiones del proyecto PROJ, zonas Argentina 1–7](https://github.com/OSGeo/PROJ/blob/master/data/sql/conversion.sql).

### P1 — Una coordenada vacía deja la app inutilizable al recargar

`StepLocation.tsx:46` convierte una entrada vacía en `NaN`. `saveCase()` serializa ese valor como `null`; `loadCase()` no valida los tipos recuperados. Al recargar, `StepLocation.tsx:33` intenta ejecutar `null.toFixed(4)` y el cuerpo de la página queda vacío.

Reproducción: abrir «Coordenadas y período», borrar la latitud y recargar. Validar el estado persistido al cargar, representar entradas vacías explícitamente y evitar formatear coordenadas no válidas. Conviene disponer de una recuperación del caso sin tener que borrar manualmente el almacenamiento del navegador.

### P2 — El riego puede convertirse en evidencia sin estar confirmado

Dos comportamientos se combinan:

- `StepResources.tsx:81`: al desmarcar «No lo sé», se cargan 100 mm automáticamente. El productor no ingresó ese número.
- `case/model.ts:123`: el cálculo utiliza el riego compartido o contratado sin consultar si su disponibilidad está pendiente. Pendiente y confirmado producen exactamente el mismo contexto del motor.

Con el JSON guardado, 0 mm devuelve las alternativas sorgo–soja, algodón–maíz y referencia con coberturas. Con 100 mm cambia la tercera alternativa a algodón–trigo–soja y se elevan los puntajes. No es un detalle del formulario.

Pedir una cantidad explícita. Mantener el agua pendiente como incertidumbre o escenario separado; no incorporarla silenciosamente como disponibilidad segura. Revisar también el aviso general que dice que los recursos no modifican el ranking: el riego sí lo modifica.

### P2 — Se puede analizar un punto y adjuntar un lote distante sin advertencia

`App.tsx` conserva coordenadas y polígono como estados independientes. `onLot` solo actualiza el polígono y su procedencia; cambiar ubicación en `StepLocation.tsx` tampoco invalida el límite anterior.

Reproducción: cargar la demo de Santiago y después importar un GeoJSON de Añatuya. El caso conserva el punto climático `[-27.7834, -64.2642]` y el límite alrededor de `[-28.46, -62.83]`. Las rotaciones siguen calculadas para el punto original, aunque el mapa y la exportación muestran otro campo.

Al importar o dibujar, ofrecer confirmar un punto de análisis dentro del lote y recalcular. Si se mantiene un punto externo como referencia regional, identificarlo y advertir la distancia. Al cambiar de campo, gestionar expresamente el límite persistido.

### P2 — El supuesto mes de máxima presión no tiene diferenciación mensual

`engine/domain/rotations.ts:401` asigna a todos los meses de un cultivo la misma presión agregada de su ciclo. `case/verification.ts:41` ordena esos valores para escoger el supuesto máximo: los empates hacen que se seleccione el primer mes.

Con la serie guardada, el maíz de la referencia ocupa los índices 18–23 y todos tienen presión `0.3177648435562128`; se recomienda el índice 18 como «mes de mayor presión». No se calculó un pico mensual que justifique esa elección.

Hasta tener un indicador mensual y criterios fenológicos revisados, mostrar una ventana de seguimiento del cultivo. No exportar el primer mes como si fuera el máximo demostrado.

### P2 — Adjuntar un segundo documento rompe el enlace al primero

`LotDocsPanel.tsx:32` revoca todas las URLs del estado anterior cada vez que cambia `docs`. Al agregar un segundo PDF, el primero permanece listado pero su enlace ya no funciona.

Reproducido en Chromium: la primera URL devuelve 200 tras adjuntar el primer documento y `Failed to fetch` tras agregar el segundo. Revocar al retirar cada documento o al desmontar el componente, conservando las URLs todavía utilizadas.

### P2 — Los pasos del recorrido carecen de nombre accesible en móvil

En `wizard/Wizard.tsx:53`, el único texto de cada botón de progreso usa `hidden sm:block`. A 390 px, el árbol de accesibilidad contiene cinco botones sin nombre. La etiqueta del contenedor no identifica cada control.

Agregar nombres accesibles permanentes a los botones y conservar una superficie táctil adecuada. El recorrido normal tiene botones grandes, foco al cambiar de pregunta y textos legibles; conviene mantener esas decisiones.

## Brechas de producto y del modelo

Estas limitaciones ya están reconocidas en varios textos de la app. Su visibilidad es positiva, pero todavía condicionan la propuesta:

- **Maquinaria:** se registra acceso propio, compartido o contratado; no hay requisitos por operación ni compatibilidad por cultivo. Es una parte central de lo solicitado por el equipo y necesita implementación o una acción concreta de verificación.
- **Suelo:** se pregunta textura, pero no modifica la reserva de agua. La reserva sigue siendo 120 mm multiplicados por humedad relativa y vuelve a iniciarse para cada cultivo; no hay transferencia de agua entre cultivos sucesivos.
- **Referencia:** `compareStrategiesDetailed()` optimiza sus fechas. No compara contra las fechas reales de manejo del productor. «Otro cultivo» tampoco crea una referencia específica: usa una sustitución declarada.
- **Datos del lote:** la imagen HLS y el ortomosaico son visuales. No se calcula NDVI del polígono, clasificación de cobertura, zonas de estrés ni suelo desnudo observado.
- **Temporalidad:** el control de lluvia y temperatura modifica el historial. No incorpora un pronóstico estacional ni un modelo ENSO. Mantener la distinción al hablar de El Niño.
- **Dinero:** el índice de ingresos usa parámetros genéricos, sin costos ni precios locales; no equivale a margen económico.
- **Vuelo Verde:** la entrevista respalda necesidades y disposición a colaborar. El alcance está por definir; no convierte el punto ilustrativo en un lote validado ni acredita precisión del algoritmo. La propia nota de entrevista lo aclara.

## APIs y procesamiento: qué está conectado realmente

| Fuente o herramienta | Función actual | Influye en el ranking |
| --- | --- | --- |
| NASA POWER | Temperaturas, lluvia y humedad relativa del suelo; base de indicadores históricos y escenarios | Sí |
| NASA CMR | Busca metadatos de escenas HLS, fechas y nubosidad | No |
| NASA GIBS | Teselas visuales HLS, MODIS NDVI y SMAP | No |
| OpenStreetMap / Esri World Imagery | Cartografía y contexto visual | No |
| GeoTIFF + proj4 | Lectura local y vista previa del ortomosaico | No; no es una API remota |
| KML/KMZ/GeoJSON/SHP/DXF | Importación local de límites; PDF e imágenes como referencia | No; no consulta un catastro provincial |
| AppEEARS / ECOSTRESS / SMAP numérico / SoilGrids | Documentados como próximos pasos | No están integrados en el flujo numérico revisado |
| LLM | Sin llamadas en esta aplicación | No |

El límite importado representa lo aportado por el usuario; no acredita titularidad ni validación catastral. La salida de vuelo contiene un polígono y sugerencias de revisión, sin altura, solapamiento ni una misión operativa comprobada.

## Repositorio, documentación y entrega

La rama local y la rama remota consultada apuntan a `453ae6a`. `front-nasa/` aparece sin seguimiento en Git; tampoco están versionadas todavía las notas nuevas de entrevista. Los cambios del usuario en Obsidian permanecen pendientes. Ejecutar la app local no significa que GitHub o un despliegue ya incluyan este trabajo.

El README raíz y `CLAUDE.md` siguen describiendo el prototipo de TypeScript y DOM como implementación principal. El README de `front-nasa/` describe React 19 y la interfaz nueva. Además hay copias de documentación y del vault dentro del frontend. Esto deja instrucciones contradictorias para quien continúe con Claude.

Recomendación: establecer `front-nasa/` como entrada de la demo actual, documentar la migración y conservar `prototipo/field-shift/` como referencia histórica. Mantener una sola documentación canónica y evitar dos motores que evolucionen por separado. Configurar la raíz de despliegue correspondiente y comprobar el enlace público después de publicar. No se realizó ningún commit ni push durante esta revisión.

La compilación advierte sobre un paquete inicial de unos 526 kB sin comprimir, unos 161 kB comprimidos, y una importación dinámica que no divide `lotImport` porque también se importa estáticamente. No bloquea el build; vale medir carga en un teléfono y conexión reales antes de sumar más dependencias. El JSON guardado permite calcular sin pedir POWER, pero no existe un service worker que asegure abrir toda la app desde cero sin conexión.

## Dirección y orden de trabajo recomendado

**Pregunta de producto:** «Con mi campo, el agua y los recursos a los que puedo acceder, ¿qué rotación conviene explorar y qué necesito comprobar antes de decidir?»

1. Corregir POSGAR, recuperación de coordenadas, riego, correspondencia entre lote y punto, adjuntos y calendario de verificaciones.
2. Unificar README, instrucciones para Claude y despliegue con la app actual. Publicar luego el código y documentación revisados.
3. Conseguir un lote autorizado con ubicación, rotación y fechas reales; agregar suelo y acceso operativo confirmado. Añatuya continúa como piloto propuesto.
4. Implementar requisitos de operaciones sencillos y comprensibles: qué se necesita, qué tiene el productor y qué debe contratar o confirmar.
5. Revisar con un agrónomo el balance entre cultivos y las fechas de referencia. Mantener las explicaciones y la evidencia numérica trazable.
6. Probar el flujo con un productor y un piloto de Vuelo Verde: si entienden la comparación y pueden convertirla en una verificación útil.

El render ya aporta comprensión. El siguiente diferencial debería ser la conexión comprobable entre planificación y verificación, con pocos datos bien utilizados y una acción clara para el productor.
