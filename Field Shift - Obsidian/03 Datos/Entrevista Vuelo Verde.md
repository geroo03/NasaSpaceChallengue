---
tipo: entrevista
fecha: 2026-11-14
estado: transcripcion-automatica-revisada-parcialmente
entrevistado: Juan Pablo Suárez Ríos (dueño de Vuelo Verde)
permiso_cita: si (confirmado por el equipo)
responsable: Sebastián Peralta
---
# Entrevista Vuelo Verde — drones e IA en el agro

**Fuente:** dos audios del 14/11/2026 (12:21 y 12:25) transcritos automáticamente por NotebookLM, del cuaderno «Drones e Inteligencia Artificial en la Agricultura». El resumen y la transcripción completa tal como los pasó el equipo están en [[Vuelo Verde - entrevista 2026-11-14]]. La transcripción confunde nombres: «Fel Chips» y «fields ship» son Field Shift, «Abuelo Verde» es Vuelo Verde y «pis cookies» es una plataforma de fotogrametría que falta identificar.

**Entrevistado:** Juan Pablo Suárez Ríos, dueño de Vuelo Verde, una red de más de 100 pilotos de drones agrícolas. Trabaja con drones en el agro desde hace unos 5 años. El equipo confirmó que autoriza que se lo cite y que se nombre a Vuelo Verde.

## Qué es relato y qué no

| Tipo | Contenido |
| --- | --- |
| Relato del entrevistado | Trayectoria, prácticas de la zona (siembra directa, dejar rastrojo, riego por acequia o secano), opiniones sobre el valor de los datos y el déficit de mano de obra calificada |
| Acuerdo declarado | Acepta colaborar «como si fuese una sociedad». Ofrece estudiantes de informática y pilotos con experiencia en procesar imágenes |
| Condición | Que Field Shift aporte un valor agregado y no repita el procesamiento de imágenes de dron que ya hacen DJI y otras plataformas. Estima el aporte actual posible en «un 10 %» |
| No aportado | Lote, coordenadas, superficie, cultivos, fechas, suelo ni rendimientos de un productor concreto. Tampoco la ubicación de las zonas de riego y secano que menciona |

**Consecuencia:** la entrevista **no convierte el caso ilustrativo en un lote real**. Valida el problema y suma un aliado operativo. El caso de Santiago del Estero sigue siendo ilustrativo y Añatuya sigue como piloto por confirmar.

## Versión editada (recibida el 14/11, 20:58)

El equipo pasó una versión ordenada por preguntas, con Lucas como entrevistador: [[Vuelo Verde - entrevista editada 2026-11-14]]. Está **reescrita a partir del audio, no es literal**. El cuerpo de las respuestas coincide con la transcripción automática y agrega o aclara:

- **Permiso para incluir a Vuelo Verde formalmente como alianza territorial** en el proyecto: «Sí, totalmente, no hay ningún problema. Cuenten con eso al 100 %».
- **Equipo a disposición:** pilotos con experiencia y estudiantes próximos a recibirse en informática.
- **Plataformas:** procesan con DJI Terra y con QGIS. Probablemente sea lo que la transcripción automática escribió «pis cookies»; conviene confirmarlo con él. El informe técnico de Vuelo Verde también se hizo en QGIS.
- **Condición:** «Lo que hay que trabajar es la vinculación: cómo la aplicación de ustedes le da un valor agregado y marca una diferencia respecto a lo que ya existe».
- **Decidir antes de sembrar:** cuenta un caso reciente en que lluvia con granizo después de la siembra compactó la semilla. Con información previa se elige sembrar antes o después de una lluvia según el agua del suelo.
- **Dos realidades en la zona:** riego por acequia y secano. En secano: siembra directa y suelo lo más cubierto posible con rastrojo, porque bloquea la luz, frena malezas y retiene humedad y nutrientes.
- **No solo para grandes productores:** antes el monitoreo se concentraba en las cabeceras de lotes grandes; hoy sirve para cualquier productor.
- **Aplicación variable:** aplicar solo donde hace falta, para ahorrar y contaminar menos.

### Cuidado al usarla

- **«Citas destacadas»:** combinan frases de respuestas distintas. Por ejemplo, «La posibilidad de vincularnos es total, al 100 %» no está en el cuerpo de la entrevista. En el video y en las slides usar solo frases del cuerpo o del audio.
- **«Conclusiones técnicas para el jurado»:** son del equipo, no del entrevistado, y exageran:
  - Field Shift no usa ECOSTRESS ni detecta anomalías con SMAP o Landsat.
  - El entrevistado no mencionó sorgo ni caupí.
  - El dron no hace «prescripción agronómica» dentro de Field Shift.

  No usar esa sección tal cual.
- **Identidad:** la versión editada lo llama «Referente / Director». Mantenemos el nombre autorizado, Juan Pablo Suárez Ríos.

## Lo que respalda del producto

- **Decidir antes de sembrar** es para él el problema central: «No existe un problema básico dirigido hacia la agricultura, sino poder tomar decisiones antes de sembrar». Field Shift compara rotaciones y fechas a dos años.
- **Una herramienta simple** («fácil, versátil y de entenderla») respalda el recorrido guiado y el lenguaje claro.
- **Cobertura y rastrojo:** relata que en siembra directa se deja el rastrojo del maíz, sobre todo en secano. Por lo tanto **un mes sin cultivo programado no es suelo desnudo**. Esto confirma la corrección de etiqueta que ya hicimos y descarta usar «suelo desnudo» como métrica.
- **Satélite para el historial, dron para el detalle:** según él, el satélite da píxeles de 20–50 m y el dron de ~1 cm. Coincide con lo que la app muestra como contexto regional (POWER ~50 km, GIBS) y con lo que falta verificar en el lote.

## Qué se integró en el front (14/11/2026)

- **Plan de verificación en el lote** para cada opción, derivado del calendario modelado. Indica en qué meses conviene revisar humedad antes de sembrar, estrés en el mes de mayor déficit estimado, rastrojo en los meses sin cultivo programado y el secado de los cultivos de servicio. Field Shift no procesa imágenes de dron: indica qué mirar y cuándo.
- **Vuelo Verde como aliado operativo propuesto**, con el alcance de la colaboración marcado como por definir.
- **La nota de meses sin cultivo** ahora aclara que en siembra directa suele quedar rastrojo y que un vuelo puede confirmarlo.
- **El riego** se rotula «por ejemplo, por acequia».

## Ideas que quedan fuera de esta entrega

| Idea | Por qué no ahora |
| --- | --- |
| Aviso de ventana de siembra con pronóstico de lluvia | Necesita un pronóstico; POWER es histórico. Hay que elegir fuente, validar y definir la regla con técnicos |
| Botón «pedir vuelo» sobre zonas con estrés | No hay mapa de estrés por zona dentro del lote (solo un punto y contexto regional) ni un canal de contacto acordado |
| Aplicación variable | Requiere imágenes del lote y prescripción; es tarea de plataformas existentes |

## Pendiente con el entrevistado

- [x] Nombre, cargo y permiso de cita y de nombre de la empresa.
- [~] Plataforma de procesamiento: la versión editada dice DJI Terra y QGIS. Confirmar que «pis cookies» era eso.
- [x] Permiso para incluir a Vuelo Verde como alianza territorial en Space Apps (versión editada: «Cuenten con eso al 100 %»).
- [ ] Forma de la vinculación: carta de interés, piloto conjunto, canal de pedidos (WhatsApp o mail para el botón de la app).
- [ ] Si conoce productores de Añatuya o de Santiago del Estero dispuestos a aportar un lote para el piloto.

## Uso en el pitch

Citas literales del audio, con permiso:

- «Tomar decisiones en el campo basado a la información es la clave para ahorrar dinero.»
- «No existe un problema básico dirigido hacia la agricultura, sino poder tomar decisiones antes de sembrar.»
- «Lo que tenemos como déficit en el país es la mano de obra calificada.»
- Sobre trabajar juntos: «No solo creo, estoy seguro.»
- Sobre el permiso (versión editada): «Sí, totalmente, no hay ningún problema. Cuenten con eso al 100 %.»
- Sobre decidir antes (versión editada): «Poder tomar decisiones antes de sembrar, antes de iniciar el proceso que es muy costoso, es fundamental.»

Si se cita su estimación del 10 %, hay que presentarla como lo que es: su cálculo del aporte posible hoy, no una métrica del proyecto. Presentar a Vuelo Verde como **alianza territorial con permiso del entrevistado**. No presentarla como sociedad formal ni como contrato: falta definir la forma de vinculación.

Ver [[Caso Añatuya]], [[Pitch y guion]] y [[Entrega 2026]].
