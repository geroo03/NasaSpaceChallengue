# Field Shift Lab

Explorador de rotaciones de cultivos a 24 meses con clima histórico de **NASA POWER**, prioridades del productor y recursos declarados. NASA Space Apps 2026 · desafío *Field Shift: Adapting Farms with NASA Data*.

El caso inicial es un **punto ilustrativo de Santiago del Estero**. Añatuya es un piloto propuesto: el lote, el manejo y el suelo están por confirmar.

## Qué hace

1. **Recorrido guiado** (una pregunta por paso, con volver y resumen editable): ubicación → cultivo actual → herramientas y equipos → prioridades → resumen.
2. **Comparación**: el manejo de referencia y hasta tres alternativas en un calendario común de 24 meses. Cada opción responde qué cambia, por qué aparece, qué necesita y qué falta verificar.
3. **Campo isométrico** recorrible mes a mes, conectado al calendario. Está etiquetado como representación ilustrativa y tiene una vista plana accesible.
4. **Sensibilidad** de lluvia y temperatura. Es un escenario exploratorio, no un pronóstico.
5. **Clima NASA POWER**: lluvia, ET₀ (Hargreaves), lluvia/ET₀, días ≥ 35 °C y heladas. Cada valor lleva fuente, período, unidad y procedencia.
6. **Imagen del lote**: mapa con NASA HLS a 30 m (Sentinel-2 y Landsat armonizados). Las escenas salen del catálogo CMR con su porcentaje de nubes y se elige sola la más reciente y limpia. MODIS NDVI y SMAP L4 quedan como capas regionales. Las imágenes no entran al cálculo.
7. **Drones**: carga de ortomosaicos GeoTIFF exportados por DJI Terra u otras plataformas, en WGS84, UTM o POSGAR 2007. Se procesan en el navegador sin subir el archivo y se superponen al mapa.
8. **Delimitar el lote**: se dibuja y se editan los vértices con Leaflet-Geoman, igual que en AgroCordS, sobre la imagen NASA HLS o sobre la base Esri de alta resolución. Valida con Turf: no puede cruzarse a sí mismo y tiene que medir entre 0,5 y 5.000 ha.
9. **Documentación del relevamiento** (portado del módulo `lote/` basado en AgroCordS): importa el límite desde KML/KMZ, Shapefile .zip (reproyectado según su .prj), GeoJSON o DXF del plano de mensura (POSGAR 2007 fajas 1–7, UTM 19–21S o WGS84). Si el archivo trae varias parcelas, el usuario elige cuál es su lote. Los PDF o fotos del plano se adjuntan como guía. Santiago del Estero no publica catastro en línea, por eso la carga es por archivo.
   - DXF: detecta planos escritos con X = norte e Y = este, y corrige la faja POSGAR si no coincide con las coordenadas, avisando en ambos casos.
   - Shapefile sin `.prj`: se rechaza en vez de suponer coordenadas. Las líneas cerradas de catastro cuentan como polígono y las parcelas de varias partes quedan bloqueadas. Tope de 30 MB por archivo.
   - Un lote importado y después editado a mano queda registrado como tal.
   - Con lote cargado, el punto del análisis es su centro: si el clima se calculó lejos, la app ofrece recalcular ahí. «Ampliar mapa» lo abre a pantalla completa (Esc cierra).
10. **Orden de vuelo**: el lote se dibuja en el mapa y se exporta en KML (importable en DJI Pilot 2) y GeoJSON, con qué revisar en cada mes según la opción elegida. Field Shift no define altura ni solapamiento: eso lo decide el piloto, por ejemplo de Vuelo Verde.
11. **Rotaciones descartadas** con su motivo. No se inventan alternativas.
12. **Estados** de carga, error de red con respaldo en la serie guardada, y aviso cuando hay pocas alternativas o ninguna.

### Propuesta de interfaz para evaluar

Los resultados se organizan en **Comparar**, **Mi lote** y **Clima**, con navegación por teclado y sin perder los adjuntos al cambiar de vista. Las opciones muestran el nombre de la rotación, su índice orientativo y los meses sin cultivo programado. El bloque **Antes de decidir** permite ir directamente a revisar el lote, los recursos y el suelo. Las herramientas cartográficas se cargan al abrir **Mi lote**.

En móvil, el calendario se desplaza dentro de su panel y conserva botones de al menos 44 px por mes, con etiquetas de mes/año y navegación mediante flechas.

Se corrigieron la recuperación de coordenadas vacías, los enlaces de múltiples adjuntos y la entrada de riego desconocido. El riego compartido o contratado pendiente de confirmación se registra, pero aporta 0 mm al cálculo hasta confirmar disponibilidad. Las sugerencias de seguimiento muestran una ventana del ciclo, sin inventar un mes de máximo estrés. Ver [revisión y propuesta](docs/REVISION_FRONT_Y_PROPUESTA_2026-11-14.md).

### Lo que todavía no hace

- **Compatibilidad con equipos**: el acceso a herramientas (propio, compartido, contratado, sin acceso, falta confirmar) se registra, pero no filtra ni ordena las alternativas. La app lo muestra como "Compatibilidad de equipos pendiente de evaluación".
- **Datos de suelo**: el tipo de suelo se registra, pero el cálculo sigue usando una reserva supuesta de 120 mm.
- **Fechas del productor**: el motor optimiza también las fechas de la referencia. Las fechas reales del productor todavía no se conservan.
- **Integraciones pendientes**: SMAP numérico, ECOSTRESS, HLS, caupí e intercultivos.

## Stack

React 19 + TypeScript estricto, Vite, Tailwind CSS 4, Leaflet, geotiff.js + proj4 (cargados solo al usar imágenes de dron) y Vitest. No usa backend, API keys ni LLM.

## Ejecutar

```sh
npm install
npm run dev        # servidor local
npm test           # motor, caso, verificación, HLS, coordenadas, orden de vuelo e importación de catastro/planos
npm run build      # typecheck + build estático en dist/
npm run preview
```

## Estructura

```text
src/engine/            Motor del prototipo Field Shift (puro, sin React)
  data/power.ts          Cliente y parser de NASA POWER
  analysis/climate.ts    Perfil climático, Hargreaves y escenarios
  domain/crops.ts        Catálogo de 12 cultivos (parámetros genéricos)
  domain/rotations.ts    Calendario, evaluación, ranking y descartadas
  test/                  Pruebas del motor
src/case/              Respuestas del productor → contexto del motor (con supuestos) y plan de verificación
src/imagery/           Escenas HLS (CMR/GIBS), GeoTIFF de dron, importación de límites (KML/KMZ/SHP/GeoJSON/DXF) y orden de vuelo
src/i18n/              Textos ES/EN (motor + interfaz)
src/components/        Recorrido, resultados y "Cómo funciona"
public/data/           Serie NASA POWER 2011–2025 guardada (punto -27.7834, -64.2642)
```

La serie guardada se descargó el 14/11/2026 (POWER API v2.10.3, MERRA-2, SHA-256 `c5c4cab9…5725`). Sirve como respaldo sin conexión solo para ese punto.

## Supuestos visibles en la app

- ET₀ por Hargreaves (solo temperatura), no Penman–Monteith.
- Oferta de agua aproximada: 75 % de la lluvia + 120 mm × humedad relativa POWER + riego. Usa 0,4 si falta el dato, y la reserva se reinicia en cada cultivo.
- Riesgo de helada: máximo mensual ponderado. No es la frecuencia de campañas con helada.
- Los índices (0–100) son orientativos: no son probabilidades ni rentabilidad.
- "Meses sin cultivo programado" sale del calendario. No equivale a suelo desnudo observado.

## Lote primero, relieve y pedido de dron

- **Paso 1 = el lote.** Se dibuja sobre Esri World Imagery (Geoman) o se carga el plano: KML/KMZ, SHP zip, GeoJSON o DXF en POSGAR. El centro del lote pasa a ser el punto de NASA POWER. "Solo un punto" queda como alternativa.
- **Datos del terreno.** Con el lote cargado, la app calcula:
  - superficie y centro;
  - altura media y desnivel (percentil 5 a 95);
  - pendiente general, con un plano ajustado por mínimos cuadrados, y hacia dónde escurre el agua.

  El relieve sale de **NASA SRTM** (~30 m, AWS Terrain Tiles, sin clave). Si el productor no declaró la pendiente, se usa esta, marcada como dato NASA. SRTM tiene un error de varios metros: no sirve para curvas de nivel.
- **DSM del dron.** Un GeoTIFF de una banda en metros (WGS 84, UTM o POSGAR 2007) reemplaza la estimación de SRTM y queda como "Medido con dron". Se procesa en el navegador.
- **Pedir relevamiento con dron.** Usa los servicios del informe técnico de Vuelo Verde:
  - altimetría con DSM/RTK y curvas cada 5–7 cm;
  - ortomosaico RGB;
  - multiespectral, a confirmar con el prestador.

  Genera el texto del pedido, con el centro en WGS 84 y en POSGAR faja 4, y el KML del límite. El botón de WhatsApp aparece solo si se configura `VITE_VUELO_VERDE_WHATSAPP` en Vercel. Ningún contacto queda escrito en el código.
