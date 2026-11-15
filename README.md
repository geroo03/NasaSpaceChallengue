# Field Shift / Field Shift Lab

> **Estado al 15/11/2026.** La app actual es **`front-nasa/`**: React + TypeScript + Vite. Tiene su propio repositorio, [geroo03/nasa](https://github.com/geroo03/nasa), y está publicada en https://field-shift-lab.vercel.app. Este repositorio guarda el proyecto: vault, documentos, entrega, material recibido y el prototipo anterior. Las secciones de más abajo describen el **prototipo anterior** (`prototipo/`) y quedan como referencia.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `front-nasa/` | **App actual.** Repositorio aparte ([geroo03/nasa](https://github.com/geroo03/nasa)) y fuera de este por `.gitignore`. Código, pruebas y README técnico. |
| `Field Shift - Obsidian/` | **Vault del equipo:** dirección, investigación, datos, presentación, material recibido y recursos. Abrir la carpeta como vault en Obsidian. |
| `docs/` | Documentos del proyecto: auditoría, matriz de datos NASA, estrategias, experiencia y prompt para Claude. |
| `docs/entrega/` | **Entrega a Space Apps:** textos del formulario, guion del video de 30 s y subtítulos `.srt`. |
| `docs/revisiones/` | Revisiones del código y del front (14/11/2026). |
| `material/vuelo-verde/` | Entrevista con Vuelo Verde. Su informe técnico queda **solo local**: es de un cliente suyo y no se publica. |
| `material/prototipos/` | ZIP originales del prototipo recibidos por el equipo. |
| `material/imagenes/` | Imágenes de referencia (captura del lote). |
| `prototipo/` | Prototipo anterior (TypeScript sin framework) y script de revisión del caso. Se conserva como referencia y evidencia. |

---


Herramienta exploratoria para comparar rotaciones de cultivos durante **24 meses**, según datos históricos de NASA POWER y las prioridades del productor. Se desarrolla para [Field Shift: Adapting Farms with NASA Data, NASA Space Apps 2026](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/).

**Dirección:** cerrar una demo explicable para Santiago del Estero, Argentina. Añatuya es el piloto territorial propuesto; el punto predeterminado todavía no representa un lote de productor confirmado.

## Lenguaje y stack de trabajo

Continuamos con la tecnología del prototipo existente.

| Parte | Elección | Uso |
| --- | --- | --- |
| Lenguaje principal | **TypeScript** con modo estricto | Datos, indicadores, reglas e interacción |
| Estructura de la interfaz | **HTML semántico + DOM desde TypeScript** | Formularios, resultados y navegación |
| Estilos | **CSS** | Diseño responsive y estados visuales |
| Desarrollo y build | **Vite** | Servidor local y salida estática |
| Mapa | **Leaflet** | Selección de punto y capas cartográficas |
| Gráficos | **Chart.js** | Indicadores y comparación |
| Pruebas | **Vitest** | Parser, análisis climático y motor |
| Runtime de desarrollo | **Node.js 24 + npm** | Comandos; revisión original ejecutada con Node 24.21.0 |
| Datos de evidencia | **JSON** | Respuestas, metadatos y resultados reproducibles |
| Documentación | **Markdown + Obsidian** | Decisiones, fuentes y entrega |

La aplicación actual funciona sin framework de componentes ni backend. La prioridad es extender esta base. React, Next.js, Python, una base de datos o nuevas librerías requerirían una necesidad concreta y una decisión documentada; no forman parte del stack acordado para esta etapa. Los rangos de versiones están en [package.json](prototipo/field-shift/package.json), y `package-lock.json` fija la instalación reproducible.

## Evolución acordada: Field Shift Lab

La próxima experiencia combina un recorrido de preguntas simples, representación esquemática del campo y comparación de rotaciones. Registra acceso a herramientas/equipos propios, compartidos o contratados y distingue disponibilidad pendiente. La propuesta y sus etapas están en [Experiencia Field Shift Lab](docs/EXPERIENCIA_FIELD_SHIFT_LAB.md). El render y la capa operativa todavía no están implementados.

## Idioma y vocabulario

- Documentación del equipo: español.
- Identificadores y tipos del código: inglés, siguiendo la base existente.
- Interfaz: español argentino e inglés mediante `src/i18n.ts`.
- Mensajes al productor: breves, comprensibles y con una acción o dato por verificar.
- Usar «Alternativa para explorar», «Índice orientativo», «Dato faltante» y «Meses sin cultivo programado».
- Un escenario de sensibilidad se presenta como exploración, no como pronóstico.

## Empezar con Claude

1. Leer [CLAUDE.md](CLAUDE.md): instrucciones de trabajo, límites y validación.
2. Leer [Experiencia Field Shift Lab](docs/EXPERIENCIA_FIELD_SHIFT_LAB.md) y copiar [el prompt de inicio](docs/PROMPT_PARA_CLAUDE.md).
3. Consultar [la auditoría](docs/AUDITORIA_ESTRATEGICA_NASA.md) y [la matriz de datos](docs/MATRIZ_DATOS_Y_APIS_NASA.md).
4. Usar [el prompt para Stitch](Field%20Shift%20-%20Obsidian/04%20Presentacion/Prompt%20para%20Stitch.md) como referencia visual.

El diseño de Stitch es una propuesta de frontend. Debe conectarse a los datos y contratos existentes; sus campos nuevos no implican que el motor ya los utilice.

## Ejecutar

Desde la raíz del repositorio:

```sh
cd prototipo/field-shift
npm ci
npm run dev
```

Abrir la URL que indique Vite. `index.html` requiere el servidor de Vite para cargar los módulos TypeScript.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

`build` ya ejecuta el typecheck. La salida estática se genera en `prototipo/field-shift/dist`. `preview` sirve ese build; debe ejecutarse después de compilar. Dependencias y salida compilada están excluidas de Git.

## Arquitectura actual

```text
prototipo/field-shift/
  index.html               Estructura HTML y puntos de montaje
  src/main.ts              Estado, Leaflet, gráficos y render del DOM
  src/styles.css           Presentación responsive
  src/i18n.ts              Traducciones ES/EN
  src/data/power.ts        Cliente HTTP y validación del JSON de POWER
  src/analysis/climate.ts  Indicadores históricos y escenarios
  src/domain/crops.ts      Catálogo y parámetros genéricos de cultivos
  src/domain/rotations.ts  Calendarios, evaluación y puntajes
  src/test/                Pruebas existentes y fixtures sintéticos
prototipo/revisar-caso.ts   Ejecución del motor con la serie guardada
```

Flujo numérico: **POWER → parser → perfil climático → motor de rotaciones → interfaz**. GIBS aporta contexto visual por una ruta separada. Mantener el cliente de red, los cálculos y el render separados.

## Estado comprobado

Revisión del **14 de noviembre de 2026**:

| Elemento | Estado |
| --- | --- |
| Pruebas y build | 24 pruebas existentes aprobadas; compilación correcta |
| Evidencia numérica | POWER 2011–2025, 5.479 días procesados, punto `-27.7834, -64.2642` |
| Comparación | Ejecución base y sensibilidad −20 % lluvia / +2 °C |
| Datos que alimentan el motor | POWER: temperatura, precipitación y humedad relativa del suelo |
| Mapas | Código de capas GIBS MODIS/SMAP presente; sin ensayo visual completo registrado |
| Interfaz | ES/EN, punto, presets, prioridades, gráficos y calendario; revisión en navegador/celular pendiente |
| Validación agronómica | Pendiente |

Pruebas de software y ejecución con clima real acreditan esos casos revisados; no demuestran ahorro de agua, aumento de rendimiento ni pérdidas evitadas.

Los archivos están en [evidencia de revisión](Field%20Shift%20-%20Obsidian/99%20Recursos/Revision%20prototipo). Para repetir el cálculo guardado, desde `prototipo/field-shift`:

```sh
node node_modules/vite-node/vite-node.mjs ../revisar-caso.ts
```

Este comando usa el JSON guardado y actualiza `resultado-motor.json`; no descarga una serie nueva. Preservar los registros originales o guardar nuevas ejecuciones aparte si cambia el motor.

## Alcance de la próxima demo

- Un caso regional claramente identificado como ilustrativo hasta confirmar el lote.
- Rotación de referencia y hasta tres alternativas distintas en un calendario común.
- Razones, evidencia, beneficios potenciales, contrapartidas, riesgos y datos faltantes por opción.
- Fuente, fecha, unidad y escala junto a los indicadores.
- Suelo, rasgos de cultivos y restricciones con procedencia y estado conocido/desconocido.
- Comparación de escenarios con supuestos visibles.

La cantidad de alternativas es una elección del producto; el enunciado la plantea como sugerencia. Si los filtros dejan menos opciones, explicar el resultado y revisar el catálogo sin fabricar alternativas.

## Orden de trabajo

| Prioridad | Trabajo | Cierre esperado |
| --- | --- | --- |
| P0 | Adaptar frontend, terminología y estados | Flujo claro en móvil/escritorio conectado al motor |
| P0 | Completar caso, suelo y restricciones | Datos reales, estimados y desconocidos distinguibles |
| P0 | Revisar baseline, agua y heladas | Descripción y fórmula coherentes; fechas actuales preservadas |
| P0 | Preparar caso guardado y manejo de fallos | Demo repetible con fecha/procedencia; dependencias de red visibles |
| P1 | Añadir SMAP numérico | Contexto regional con calidad, unidad, profundidad y versión |
| P2 | ECOSTRESS, HLS, economía local o LLM | Solo según utilidad y evidencia disponible |

La próxima tarea de frontend puede mejorar las explicaciones de los indicadores actuales sin alterar sus fórmulas. Los cambios científicos van en una tarea separada con pruebas de regresión apropiadas.

## Supuestos y funciones pendientes

El motor actual usa Hargreaves para ET₀, coeficientes genéricos de cultivos y una oferta hídrica aproximada. Hay una reserva supuesta de 120 mm, lluvia efectiva del 75 % y un valor de relleno de humedad de 0,4. El cálculo no conserva el almacenamiento entre cultivos. El indicador de helada y sus etiquetas requieren revisión, y el calendario de referencia también se optimiza automáticamente.

Los puntajes son heurísticos. `bareMonths` representa huecos del calendario; no mide suelo desnudo ni ausencia de rastrojo. Suelo, erosión e ingresos no son mediciones de campo ni rentabilidad calculada.

SMAP numérico, ECOSTRESS, HLS, AppEEARS, downscaling, SMS, un backend y un LLM no están implementados en el ZIP recibido. El mapa selecciona un punto, no un polígono. El catálogo no incluye caupí ni modela un intercultivo sorgo–caupí.

## Documentación y precedencia

| Documento | Para qué sirve |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Trabajar sobre el proyecto |
| [Prompt para Claude](docs/PROMPT_PARA_CLAUDE.md) | Iniciar la adaptación del frontend |
| [Experiencia Field Shift Lab](docs/EXPERIENCIA_FIELD_SHIFT_LAB.md) | Flujo simple, render y acceso a maquinaria |
| [Auditoría](docs/AUDITORIA_ESTRATEGICA_NASA.md) | Estado y prioridades comprobables |
| [Matriz de datos](docs/MATRIZ_DATOS_Y_APIS_NASA.md) | Integraciones presentes y propuestas |
| [Estrategias](docs/ESTRATEGIAS_ROTACION_CULTIVOS.md) | Candidatos y condiciones para evaluarlos |
| [Presentación](docs/GUIA_PRESENTACION_Y_VIDEO.md) | Pitch ajustado a las funciones actuales |
| [Bóveda de Obsidian](Field%20Shift%20-%20Obsidian/00%20Inicio.md) | Investigación, evidencias e historial |

El código y los registros indican lo implementado y ejecutado; la fuente primaria define cada producto científico y el desafío. Los materiales originales en `05 Material recibido`, el ZIP y los respaldos son historial, no una especificación vigente. Las versiones anteriores de los documentos de `docs/` permanecen en el historial de Git.

Los textos corregidos reemplazan las promesas anteriores de −45 % de agua, −51 % de pérdidas, anticipación fija y validación global. Esas afirmaciones no tienen respaldo local reproducible en el proyecto.
