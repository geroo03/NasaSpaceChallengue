# Field Shift

Prototipo y documentación de trabajo para **Field Shift: Adapting Farms with NASA Data**, NASA Space Apps Challenge 2026.

Explora rotaciones de cultivos durante dos años según clima histórico de NASA POWER y prioridades del productor. El caso de referencia está en Santiago del Estero, Argentina; Añatuya es el piloto propuesto, todavía sin lote de productor confirmado.

## Contenido

| Ruta | Contenido |
| --- | --- |
| [`prototipo/field-shift`](prototipo/field-shift) | Aplicación Vite/TypeScript, Leaflet y Chart.js |
| [`prototipo/revisar-caso.ts`](prototipo/revisar-caso.ts) | Reproducción del motor con la serie guardada de POWER |
| [`Field Shift - Obsidian`](Field%20Shift%20-%20Obsidian) | Bóveda con investigación, decisiones, auditoría, tareas y presentación |
| [`field-shift.zip`](field-shift.zip) | Prototipo original recibido |

## Ejecutar el prototipo

Requiere una versión de Node.js compatible con las dependencias del proyecto y npm.

```sh
cd prototipo/field-shift
npm ci
npm run dev
```

Abrir la dirección que muestre Vite en la terminal.

```sh
npm test
npm run build
```

El build se genera en `prototipo/field-shift/dist`. No se incluyen dependencias instaladas ni archivos compilados en el repositorio.

## Estado comprobado

En la revisión del **14 de noviembre de 2026**:

- Pasaron 24 pruebas existentes, distribuidas en tres archivos, y el build de producción.
- Se descargaron y procesaron 5.479 días de POWER, 2011–2025, del punto predeterminado `-27.7834, -64.2642`.
- Se ejecutó el motor con el escenario base y una sensibilidad de −20 % de lluvia / +2 °C.
- POWER alimenta los indicadores numéricos; GIBS aporta capas visuales de MODIS y SMAP.
- El motor compara la rotación actual con hasta tres alternativas que pasan sus filtros.

Los registros están en [`Field Shift - Obsidian/99 Recursos/Revision prototipo`](Field%20Shift%20-%20Obsidian/99%20Recursos/Revision%20prototipo).

Para repetir el cálculo con los datos guardados, desde `prototipo/field-shift`:

```sh
node node_modules/vite-node/vite-node.mjs ../revisar-caso.ts
```

Este script actualiza `resultado-motor.json`; no descarga una nueva serie.

## Alcance y próximos pasos

Es una herramienta exploratoria. Los parámetros de cultivos, el suelo, el agua disponible y los índices de mercado incluyen supuestos genéricos. Las pruebas de software no equivalen a validación agronómica, de usabilidad o de impacto.

SMAP numérico, ECOSTRESS, HLS y un LLM dentro de la aplicación están pendientes de integración. La selección del mapa es un punto; no hay delimitación del lote implementada. La consulta regional no debe presentarse como una medición de campo.

La prioridad es completar el caso local y revisar los indicadores de agua, heladas y períodos sin cultivo programado. El backlog está en [Cambios prioritarios](Field%20Shift%20-%20Obsidian/06%20Prototipo/Cambios%20prioritarios.md). Las correcciones documentadas todavía no están aplicadas al motor recibido.

## Usar Obsidian

Abrir la carpeta `Field Shift - Obsidian` como bóveda y comenzar en [`00 Inicio.md`](Field%20Shift%20-%20Obsidian/00%20Inicio.md). Los enlaces `[[...]]` se navegan desde Obsidian.

El prompt de diseño está en [Prompt para Stitch](Field%20Shift%20-%20Obsidian/04%20Presentacion/Prompt%20para%20Stitch.md).

## Fuentes y procedencia

- [Desafío oficial Field Shift 2026](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/).
- [NASA POWER](https://power.larc.nasa.gov/).
- [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/).
- [FAO-56](https://www.fao.org/4/x0490e/x0490e00.htm).

La bóveda conserva los textos recibidos, la revisión de sus afirmaciones, los metadatos de descarga y las limitaciones. Las notas de presentación son borradores y deben ajustarse a la versión efectivamente demostrada y a la guía de entrega aplicable.
