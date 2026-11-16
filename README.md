# AgroField

> ## 👉 La app está en [`front-nasa/`](front-nasa/)
>
> - **Usarla:** https://field-shift-lab.vercel.app
> - **Correrla en tu compu:**
>
>   ```sh
>   git clone https://github.com/geroo03/NasaSpaceChallengue
>   cd NasaSpaceChallengue/front-nasa
>   npm ci
>   npm run dev
>   ```
>
> La carpeta `prototipo/` es el **primer maquetado**, superado por la app, y se conserva solo como referencia.

AgroField ayuda a decidir **antes de sembrar** qué rotación probar en las próximas dos campañas en el secano de Santiago del Estero. Usa datos de la NASA y el lote real del productor. Es el proyecto del equipo para NASA Space Apps 2026, desafío [*Adapting Farms with NASA Data*](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/). Vuelo Verde, una red de más de 100 pilotos de drones agrícolas, es la alianza territorial.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `front-nasa/` | **App actual** (React + TypeScript + Vite), publicada en Vercel desde esta carpeta. Su [README](front-nasa/README.md) explica funciones, datos, supuestos y estructura. |
| `Field Shift - Obsidian/` | **Vault del equipo:** dirección, investigación, datos, presentación, material recibido y recursos. Abrir la carpeta como vault en Obsidian; empezar por `00 Inicio.md`. |
| `docs/` | Documentos del proyecto: auditoría, matriz de datos NASA, estrategias, experiencia y prompt para Claude. |
| `docs/entrega/` | **Entrega a Space Apps:** textos del formulario, guion del video de 30 s y subtítulos `.srt`. |
| `docs/revisiones/` | Revisiones del código y del front (14/11/2026). |
| `material/vuelo-verde/` | Entrevista con Vuelo Verde. Su informe técnico queda **solo local**: es de un cliente suyo y no se publica. |
| `material/prototipos/` | ZIP originales del prototipo recibidos por el equipo. |
| `material/imagenes/` | Imágenes de referencia (captura del lote). |
| `prototipo/` | Primer maquetado (TypeScript sin framework) y script para reproducir su caso. Solo como referencia y evidencia. |

## Por dónde empezar

- **Ver el proyecto funcionando:** https://field-shift-lab.vercel.app, con «Probar con el lote de ejemplo».
- **Preparar la entrega:** [docs/entrega/ENTREGA_FORMULARIO.md](docs/entrega/ENTREGA_FORMULARIO.md) y [el guion del video](docs/entrega/video/GUION_VIDEO_30S.md).
- **Cerrar el envío y entregar al jurado local:** [checklist y mensaje de WhatsApp](docs/entrega/CIERRE_Y_MENSAJE_JURADO.md), [informe en español](docs/entrega/INFORME_JURADO_ES.pdf) y [guion del pitch de hasta 2 minutos](docs/entrega/video/PITCH_JURADO_LOCAL_2MIN_ES.md).
- **Entender las decisiones:** el vault, desde [00 Inicio](Field%20Shift%20-%20Obsidian/00%20Inicio.md), y [Criterios e innovación](Field%20Shift%20-%20Obsidian/04%20Presentacion/Criterios%20e%20innovaci%C3%B3n.md).
- **Trabajar con Claude:** [CLAUDE.md](CLAUDE.md).

## Documentos

| Documento | Para qué sirve |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Reglas para trabajar sobre el proyecto: honestidad de datos, supuestos y validación |
| [Entrega](docs/entrega/ENTREGA_FORMULARIO.md) | Resumen en inglés, detalles, datos NASA, recursos, uso de IA, slides y video |
| [Auditoría](docs/AUDITORIA_ESTRATEGICA_NASA.md) | Estado y prioridades comprobables |
| [Matriz de datos](docs/MATRIZ_DATOS_Y_APIS_NASA.md) | Integraciones presentes y propuestas |
| [Estrategias](docs/ESTRATEGIAS_ROTACION_CULTIVOS.md) | Candidatos de rotación y condiciones para evaluarlos |
| [Experiencia AgroField](docs/EXPERIENCIA_FIELD_SHIFT_LAB.md) | Propuesta de experiencia que guió la app |
| [Guía de presentación](docs/GUIA_PRESENTACION_Y_VIDEO.md) | Pitch y video |
| [Revisiones](docs/revisiones/) | Revisión integral y del front, 14/11/2026 |
| [Prompt para Claude](docs/PROMPT_PARA_CLAUDE.md) | Encargo original de adaptación del frontend (historial) |

## Vocabulario

- Documentación del equipo en español; identificadores del código en inglés; interfaz en español argentino e inglés.
- Usar «Alternativa para explorar», «Índice orientativo», «Dato faltante» y «Meses sin cultivo programado».
- Un escenario o una campaña Niño/Niña se presentan como exploración del historial, nunca como pronóstico.
- Mensajes al productor: breves, comprensibles y con una acción o dato por verificar.

## Afirmaciones corregidas

Los textos del proyecto reemplazan las promesas iniciales de −45 % de agua, −51 % de pérdidas, anticipación fija y validación global: no tienen respaldo reproducible. El código y los registros indican lo implementado y ejecutado. Los materiales de `05 Material recibido`, los ZIP y los respaldos son historial, no especificación vigente.

## Prototipo anterior (referencia)

Primer maquetado en TypeScript sin framework. El motor de rotaciones de la app actual nació de él.

```sh
cd prototipo/field-shift
npm ci
npm run dev      # abre el maquetado 1, no la app actual
npm test         # 24 pruebas del motor original
```

Para reproducir el caso guardado de la revisión del 14/11/2026 (POWER 2011–2025, 5.479 días, punto -27.7834, -64.2642), desde `prototipo/field-shift`:

```sh
node node_modules/vite-node/vite-node.mjs ../revisar-caso.ts
```

El script usa el JSON guardado y actualiza `resultado-motor.json`, en la [evidencia de revisión](Field%20Shift%20-%20Obsidian/99%20Recursos/Revision%20prototipo). Para comparar versiones, guardar las nuevas ejecuciones aparte.
