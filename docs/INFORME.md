# AgroField — Informe del proyecto

**NASA Space Apps Challenge 2026 · Desafío «Adapting Farms with NASA Data» · Sede Santiago del Estero (El Óvalo)**

- **App web:** https://field-shift-lab.vercel.app (español e inglés, botón ES/EN; funciona en el celular y sin señal)
- **Código:** https://github.com/geroo03/NasaSpaceChallengue

## 1. El problema

En el secano de Santiago del Estero la campaña depende de la lluvia. El productor decide qué sembrar antes de saber cómo será el año, con información regional que no refleja su propio lote. Un error en esa decisión se paga en agua, insumos y suelo.

## 2. Qué es AgroField

Una aplicación web gratuita que ayuda a decidir **qué rotación de cultivos probar en las próximas dos campañas, antes de sembrar**, con datos abiertos de la NASA aplicados al lote real del productor.

Se usa en tres pasos:

1. **Tu lote.** Se dibuja el lote sobre la imagen satelital o se carga el plano (KML, Shapefile, GeoJSON o el DXF de mensura en POSGAR 2007). La app calcula superficie, relieve y pendiente (NASA SRTM) y el agua útil del suelo hasta 1 m (SoilGrids).
2. **Tu campaña.** Qué se siembra hoy, si se puede regar (goteo, aspersión o acequia, con su eficiencia) y qué le importa más al productor.
3. **Tus opciones.** La rotación actual al lado de la mejor alternativa, con puntaje, motivos, riesgos y un calendario de 24 meses.

## 3. Cómo funciona

Un motor de reglas transparente, sin «caja negra»:

- **Clima:** 15 años de datos diarios de NASA POWER (2011–2025) en el punto exacto del lote. Con ellos se calculan la evapotranspiración de referencia (Hargreaves), la oferta y el déficit de agua por cultivo, las heladas y el calor en la floración.
- **Agua en el suelo:** un balance diario en dos capas sobre la serie real, que muestra cuánta agua hay al sembrar cada cultivo.
- **El Niño y La Niña:** cada campaña pasada se clasifica con el índice ONI de NOAA, para mostrar qué pasó en ese lote en cada fase. Hoy es clave: NOAA observa un Niño muy fuerte.
- **ECOSTRESS:** evapotranspiración real medida por satélite (70 m) como evidencia complementaria.
- **Pronóstico de 7 días:** lluvia, calor, helada y viento, con consejos concretos (cuándo postergar el riego, qué días se puede pulverizar).

Cada número indica de dónde sale y si es dato observado, modelado o supuesto. Los puntajes son índices orientativos, no probabilidades.

## 4. Del satélite al campo: drones con Vuelo Verde

La app planifica el trabajo con dron sobre el calendario de la rotación: mapeo, prescripción por zonas de vigor (NDVI), siembra de cultivos de servicio y pulverización. Si el productor tiene dron propio, el plan usa los datos de su equipo; si no, el pedido sale armado a **Vuelo Verde**, empresa santiagueña de drones agrícolas y aliada territorial del proyecto, por WhatsApp o correo.

> El satélite da la historia, AgroField planifica y el dron confirma.

## 5. Cuentas, historial y demo

- Ingreso con un link al mail (sin contraseña). Cada usuario guarda sus lotes, su dron, sus análisis y sus pedidos, y los ve desde cualquier dispositivo.
- Sin cuenta se puede recorrer una **demo con un lote real de ejemplo** de 52 ha cerca de Añatuya.
- Tutorial en cada pantalla, con videos cortos en español e inglés.

## 6. Datos utilizados

| Fuente | Uso |
| --- | --- |
| NASA POWER | Clima diario 2011–2025 del lote |
| NASA SRTM | Relieve y pendiente |
| NASA HLS (Landsat y Sentinel-2), GIBS y CMR | Imagen satelital reciente del lote |
| NASA ECOSTRESS ECO_L3T_JET.002 | Evapotranspiración real |
| ISRIC SoilGrids 2.0 | Agua útil y textura del suelo |
| NOAA CPC ONI | Fase de El Niño / La Niña por campaña |
| Open-Meteo | Pronóstico de 7 días |

## 7. Tecnología

TypeScript, React, Vite, Tailwind CSS, Leaflet, Turf, proj4 y geotiff.js en el navegador; funciones en Vercel y base de datos Supabase (ingreso por mail y seguridad por usuario). Más de 180 pruebas automáticas. Instalable en el celular y utilizable sin conexión.

## 8. Qué tuvimos en cuenta

- **Conectividad rural:** la app abre sin señal con lo ya consultado.
- **Productores que no son especialistas en datos:** tres pasos, lenguaje simple y una ficha imprimible para el ingeniero agrónomo.
- **Honestidad:** no se inventan datos faltantes, se distingue lo medido de lo supuesto y El Niño se presenta como lo que pasó antes, no como pronóstico.
- **Trabajo con el territorio:** entrevista y alianza con Vuelo Verde.

## 9. Próximos pasos

Un piloto con un lote real cerca de Añatuya junto a Vuelo Verde, comparando el plan de AgroField con lo que mide el dron, y sumar la lluvia satelital GPM IMERG y la humedad del suelo SMAP.

---

*Desarrollado con asistencia de herramientas de IA (Claude, Codex); los datos, el criterio agronómico y las decisiones fueron revisados por el equipo.*
