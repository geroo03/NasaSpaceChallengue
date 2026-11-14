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
8. **Orden de vuelo**: el lote se dibuja en el mapa y se exporta en KML (importable en DJI Pilot 2) y GeoJSON, con qué revisar en cada mes según la opción elegida. Field Shift no define altura ni solapamiento: eso lo decide el piloto, por ejemplo de Vuelo Verde.
9. **Rotaciones descartadas** con su motivo. No se inventan alternativas.
10. **Estados** de carga, error de red con respaldo en la serie guardada, y aviso cuando hay pocas alternativas o ninguna.

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
npm test           # 53 pruebas (motor, caso, verificación, HLS, coordenadas y orden de vuelo)
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
src/imagery/           Escenas HLS (CMR/GIBS), lectura de GeoTIFF de dron y orden de vuelo KML/GeoJSON
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
