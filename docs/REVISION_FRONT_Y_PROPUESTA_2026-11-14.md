# Revisión del front y propuesta para evaluar — 14/11/2026

Base de revisión: commit `899ee05`, posterior a los cambios de tipografía y fondo. La propuesta conserva Raleway, el fondo `#f0ede4` y los cálculos agronómicos del motor. Se ajustó la traducción de declaraciones del productor al motor para que el riego pendiente no se contabilice como confirmado.

## Qué mejoró en la actualización recibida

- POSGAR 2007 utiliza el falso este correcto. Un DXF con las coordenadas de Añatuya se ubica en su zona, incluso con X=norte e Y=este.
- La importación distingue formatos, reproyección, parcelas múltiples, falta de `.prj` y límites de tamaño.
- El mapa permite dibujar un polígono, editar vértices, borrar el límite y ampliar con Escape para cerrar.
- Un límite distante del punto climático genera un aviso y permite recalcular en el centro del lote.
- La procedencia del límite identifica archivo, parcela y edición manual.

Son avances concretos. No equivalen a una consulta de catastro oficial ni a acreditación del límite legal del terreno.

## Propuesta implementada

### Tres vistas por tarea

**Comparar:** elegir una rotación, recorrer el campo y su calendario, leer razones y ver qué falta verificar. Las tarjetas muestran nombres completos, índice orientativo y meses sin cultivo programado. Los riesgos principales aparecen en el resumen y la lista completa sigue disponible en «Ver detalles».

**Mi lote:** mapa, dibujo, archivos, imágenes, ortomosaico y exportación de la orden de revisión. El módulo cartográfico se carga al abrir esta vista. Una vez abierto se mantiene montado al cambiar de pestaña para conservar adjuntos, ortomosaico y edición. Un observador de tamaño evita que Leaflet quede desajustado al volver.

**Clima:** serie histórica, escenarios, supuestos y fuentes. El botón «Ver cómo cambian las opciones» vuelve a la comparación. El aviso de escenario permanece visible en todas las vistas. Las pestañas admiten flechas, Inicio y Fin.

El aviso de que el límite y el punto de análisis no coinciden se mantiene también fuera del mapa. No se oculta al cambiar de tarea.

En celular, el calendario tiene desplazamiento horizontal interno y botones de al menos 44 px para cada mes. Se mantienen visibles mes y año; las flechas del teclado cambian mes y rotación. El calendario ya no comprime 24 zonas de toque dentro de 360 px ni oculta sus controles a los lectores de pantalla.

### Antes de decidir

Tres acciones conectan el resultado con información que realmente falta:

1. Ubicar o revisar el lote.
2. Confirmar acceso y fechas de los recursos declarados.
3. Revisar el suelo y conocer qué utiliza el modelo.

Los botones llevan al mapa o a la pregunta correspondiente. El número de recursos pendientes cuenta las respuestas desconocidas y los accesos compartidos/contratados sin confirmación. No es un porcentaje de confianza ni una certificación de factibilidad.

## Correcciones funcionales

| Problema | Comportamiento nuevo |
| --- | --- |
| Borrar una coordenada y recargar dejaba la página en blanco | Se conserva el último caso con coordenadas válidas; los valores nulos persistidos por versiones anteriores se recuperan sin perder las otras respuestas |
| «No lo sé» podía introducir automáticamente 100 mm | La cantidad sigue vacía y se puede ingresar explícitamente; pulsar «No lo sé» vuelve a desconocido |
| Riego contratado/compartido pendiente sumaba agua | El cálculo usa 0 mm y muestra el supuesto hasta confirmar disponibilidad |
| Agregar un segundo PDF revocaba el enlace al primero | Las URLs se conservan mientras se usan y se revocan al quitar el documento o desmontar el módulo |
| Controles de progreso sin nombre en móvil | Nombres accesibles permanentes y superficie de al menos 44 px de alto |
| Se afirmaba un mes de máximo estrés a partir de un indicador igual durante todo el ciclo | Se muestra una ventana de seguimiento y el déficit del ciclo; el rango se conserva en KML/GeoJSON |
| Cambiar a otra ubicación conservaba el límite anterior | Elegir un preset de ubicación limpia el límite y su procedencia |

## Comprobaciones

Las pruebas del motor, caso e importadores y el build de producción se ejecutaron localmente. Se añadieron regresiones para riego pendiente, recuperación de coordenadas y ventana de seguimiento. La ejecución final registró **83 pruebas aprobadas en 11 archivos**, incluyendo las pruebas nuevas del módulo de relieve que se estaba agregando. Esto no valida por sí solo su integración completa con la interfaz y datos reales.

En Chromium se comprobaron los siguientes comportamientos:

- Recorrido hasta resultados con el JSON NASA guardado; referencia y tres alternativas.
- Selección de otra rotación y cambio de mes del render.
- Recalcular ante cambios de lluvia y temperatura, y restablecer el escenario.
- Navegación entre vistas con ratón y teclado; etiquetas en español e inglés.
- Vista a 360 px sin desbordamiento horizontal en las tres tareas.
- Calendario con zonas de toque de al menos 44 × 44 px y selección mediante flechas, Inicio y Fin.
- Vaciar coordenada y recargar, sin errores de aplicación.
- Ingresar agua explícita y conservar desconocido al pulsar «No lo sé».
- Dos PDF abiertos correctamente, conservación al cambiar de vista y eliminación de adjuntos.
- Importación GeoJSON, aviso de distancia y recálculo en el centro del lote.
- Exportaciones KML y GeoJSON: geometría y ventanas de revisión conservadas.
- Importación de un DXF POSGAR con ejes norte/este invertidos y comprobación de coordenadas.
- Dibujo de un límite con el ratón, aparición de controles de edición y borrado.
- Mapa ampliado y cierre mediante Escape.
- Carga de un GeoTIFF de prueba y conservación del overlay al cambiar de vista.
- Error de red con respaldo del mismo punto; no se ofrece la serie de Santiago para otra localidad.
- Falta de alternativas usando un clima sintético adverso; no se inventan opciones.

Para que estas comprobaciones de interfaz fueran reproducibles, se usaron la serie guardada, archivos de prueba y respuestas simuladas para red/escenarios extremos. Por separado, se hicieron consultas reales: **POWER** devolvió las cinco variables pedidas; **CMR** devolvió una escena HLS; **GIBS** devolvió una tesela PNG HLS de 93.303 bytes. Esto verifica esas solicitudes, no todos los productos o puntos posibles ni la precisión agronómica.

No se verificaron un controlador DJI físico, archivos de dron de gran tamaño, todas las variantes de archivos catastrales ni la usabilidad con un productor real.

## Qué propondría después

1. **Un lote y un manejo reales:** comparar contra fechas declaradas del productor y revisar suelo y agua con un técnico. Esta evidencia vale más que agregar capas sin una decisión asociada.
2. **Recursos por operación:** mostrar qué requiere cada opción para siembra, cosecha y manejo de coberturas, y qué debe confirmar o contratar. Registrar maquinaria todavía no acredita esa compatibilidad.
3. **Ficha para compartir:** un resumen de la opción elegida con límites, calendario, evidencia y preguntas para el agrónomo o Vuelo Verde. El KML actual ya aporta la ubicación, pero falta una ficha comprensible para quien recibe el caso.

Durante esta revisión aparecieron archivos nuevos de terreno/relieve en desarrollo. Deben evaluarse como una integración separada: fuente y resolución, tratamiento de valores sin datos, correspondencia con el lote y efecto real sobre el cálculo. No se presentan aquí como una función de relieve validada.

La propuesta se deja en el entorno local para evaluación; este trabajo no incluye publicación en Vercel.
