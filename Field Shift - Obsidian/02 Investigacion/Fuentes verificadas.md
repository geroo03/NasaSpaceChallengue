---
tipo: fuentes
fecha_consulta: 2026-11-14
estado: verificacion-documental-parcial
---
# Fuentes verificadas

La primera organización de la bóveda fue documental. En la actualización del 14 de noviembre se inspeccionó el ZIP, se ejecutaron pruebas/build y se descargó POWER del punto predeterminado para reproducir el motor. No hay una serie de un lote confirmado ni validación de campo. Las afirmaciones de CORS y de otras APIs «probadas hoy» siguen perteneciendo al texto recibido.

## Desafío

La página oficial completa del enlace aportado fue recuperada por HTTPS, incluyendo Details y Resources cargados dinámicamente. La revisión y su efecto en nuestro alcance están en [[Consigna oficial y encaje]]. Enlace vigente: [Field Shift 2026](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/).

Se guardaron fecha, publicación, checksum y enlaces en `99 Recursos/Revision consigna oficial`. Las guías específicas de entrega/evaluación continúan por verificar en [[Entrega 2026]]. Esta lectura reemplaza la limitación anterior, cuando solo se había obtenido el resumen indexado.

## NASA POWER

La documentación describe la consulta diaria por punto. La documentación hidrológica distingue `GWETROOT`/`GWETTOP` como humedad relativa y `RZMC`/`SFMC` como contenido volumétrico. Revisar comunidad, disponibilidad y unidades de cada variable antes de comparar productos.

[Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · [Metodología y variables hidrológicas](https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/).

## SMAP

SPL3SMP_E v6 ofrece estimaciones diarias de humedad superficial en una grilla de 9 km, desde marzo de 2015. SPL4SMGP v8 proporciona humedad superficial y radicular en una grilla de 9 km cada tres horas mediante modelado y asimilación de observaciones.

[SMAP L3 v6](https://nsidc.org/data/spl3smp_e/versions/6) · [Guía L3 v6](https://nsidc.org/sites/default/files/documents/user-guide/spl3smp_e-v006-userguide.pdf) · [SMAP L4 v8](https://nsidc.org/data/spl4smgp/versions/8).

La página L4 consultada informa un problema de geolocalización entre el 14 de mayo y el 28 de julio de 2026 y reprocesamiento en curso. Si se elige ese intervalo, revisar los archivos corregidos y registrar qué versión se descargó.

## GPM IMERG

La documentación V07 describe campos de media hora a 0,1°. Early llega aproximadamente cuatro horas después; Final tiene una demora de meses y es apropiado para análisis retrospectivo. La página general advierte distinguir intensidad de lluvia y acumulado.

[IMERG](https://gpm.nasa.gov/data/imerg) · [Documentación V07](https://gpm.nasa.gov/resources/documents/imerg-v07-technical-documentation) · [Directorio de productos](https://gpm.nasa.gov/data/directory).

El directorio actual menciona extensión a 1998; documentos de 2025 describen inicio en junio de 2000. Registrar cobertura del producto y archivos efectivamente usados, sin copiar un rango genérico a todos los derivados.

## ECOSTRESS y MODIS

La página oficial de ECOSTRESS describe Collection 2 y el retiro de Collection 1. El manual v2 de productos en grilla lista `ETdaily` en W/m²: no tratarlo directamente como mm/día.

[ECOSTRESS Data](https://ecostress.jpl.nasa.gov/data) · [Manual v2](https://lpdaac.usgs.gov/documents/1655/ECO_L1C-4_Grid_Tile_User_Guide_V2.pdf).

MOD13Q1 v6.1 ofrece NDVI/EVI en compuestos de 16 días a 250 m. Usarlo como contexto y considerar píxeles mezclados en parcelas pequeñas.

[Ficha MOD13Q1 v6.1](https://doi.org/10.5067/MODIS/MOD13Q1.061).

## Referencias recibidas aún pendientes

AppEEARS: capas, productos disponibles y autenticación vigentes. GIBS: capacidades, fecha efectiva de capa y leyenda. HLS: cobertura y escenas del lote. SoilGrids: disponibilidad y propiedades. MAGyP: archivo por departamento. INTA: estación, acceso y continuidad de registros. Ganadores anteriores: fuentes primarias y alcance de sus soluciones.

## Revisión del prototipo y método de ET₀

La fuente primaria para el método es el [capítulo 3 de FAO-56](https://www.fao.org/4/x0490e/x0490e07.htm), que incluye métodos para estimar con datos climáticos limitados. El código implementa Hargreaves; no contiene el cálculo completo FAO Penman–Monteith. La prueba de radiación extraterrestre no acredita por sí sola toda la ET₀ ni el modelo de agua.

La descarga real de POWER informa API v2.10.3 y tiempo LST. Procedencia, solicitud y checksum: [power-descarga.json](../99%20Recursos/Revision%20prototipo/power-descarga.json). Resultado del código: [[Auditoría del prototipo]].

## Guías de entrega/evaluación: nuevo material recibido

[[Claude - actualizacion 2026-11-14]] agrega cinco criterios, escala 1–5 y formato 7 diapositivas o 30 segundos. Los PDFs mencionados no fueron adjuntados. Se buscaron las guías oficiales, pero no se recuperó su texto completo; por eso [[Entrega 2026]] conserva esos requisitos como recibidos y por confirmar.

No trasladar reglas de otra sede o edición como confirmación del equipo. La cantidad de datasets no sustituye la trazabilidad y el uso efectivo en la decisión.
