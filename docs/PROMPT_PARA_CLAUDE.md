# Prompt de inicio para Claude

Leer [CLAUDE.md](../CLAUDE.md) y [README.md](../README.md) antes de trabajar. Este prompt encarga una adaptación del frontend sobre el código existente; las integraciones futuras y las correcciones del motor se mantienen identificadas como tales.

Copiar lo siguiente en Claude junto con acceso al repositorio:

```text
Trabajá en geroo03/NasaSpaceChallengue. Primero leé README.md, CLAUDE.md y la documentación vigente de docs/. Revisá los cambios locales y conservá el trabajo del equipo.

Objetivo: adaptar el frontend a Field Shift Lab, con un recorrido simple, una representación visual interactiva del campo y comparación de rotaciones durante 24 meses. Leé docs/EXPERIENCIA_FIELD_SHIFT_LAB.md como especificación del flujo y los recursos disponibles.

STACK
Continuá con TypeScript estricto, Vite, HTML semántico y CSS. Usá Leaflet, Chart.js y Vitest existentes. UI en español argentino e inglés, documentación en español e identificadores en inglés. Conservá las versiones y el lockfile salvo necesidad justificada.

BASE REAL
El código está en prototipo/field-shift. POWER alimenta el motor y GIBS agrega contexto visual. El punto predeterminado es ilustrativo; Añatuya es un piloto por confirmar. Hay registros de 24 pruebas y un build correctos, además de una ejecución POWER 2011–2025. Volvé a comprobar el estado cuando hagas cambios.

PRIMERA TAREA
Implementá pasos cortos: ubicación → cultivo actual → acceso a herramientas/equipos → prioridad → comparación y detalle. Usá una pregunta por paso, textos breves, imágenes con nombre, volver sin perder datos y resumen editable. Diseñá para distintos niveles de lectura y manejo del celular; no infieras escolaridad o capacidad de una región. Usá el motor y los datos existentes. Concentrá los cambios en index.html, src/styles.css, src/main.ts y src/i18n.ts; podés extraer módulos de UI si mejora claridad.

Tomá como referencia el prompt para Stitch en Field Shift - Obsidian/04 Presentacion/Prompt para Stitch.md. Si no hay exportación visual, avanzá con esa guía: marfil, verde bosque, tonos tierra, buena tipografía, calendario de 24 meses protagonista y diseño usable en celular.

Conservá los controles funcionales de ubicación por punto, preset actual, riego, pendiente, prioridades y sensibilidad. Mostrá la referencia y hasta tres alternativas; si hay menos, explicá el resultado. Cada opción debe tener calendario, razón, evidencia, beneficios potenciales, contrapartidas, riesgos y vacíos.

Mostrá fuentes, períodos, unidades y escala. Usá “Meses sin cultivo programado”, “Índice orientativo”, “Supuesto” y “Dato faltante”. Explicá que los escenarios no son pronósticos. Agregá estados de carga, error y datos incompletos.

Registrá recursos como propios, compartidos, contratados, sin acceso o por confirmar. Preguntá por disponibilidad cuando importe; no tener maquinaria propia no significa no poder contratar el trabajo. Conservá desconocidos. Para suelo, herramientas y mercado, distinguí los campos que el motor consume de los que todavía no evalúa. Hasta contar con requisitos operativos revisados, mostrá la compatibilidad como pendiente; no simules que el formulario ya filtra los resultados.

Agregá una representación 2D/isométrica esquemática del campo con controles del calendario. Identificá origen ilustrativo/modelado, evitá animaciones pesadas y mantené vista plana y controles accesibles. Las etapas dibujadas no son mediciones ni predicciones de crecimiento. Los controles técnicos pueden estar desplegables; los límites decisivos permanecen visibles.

ALCANCE DE ESTA ENTREGA
Mantené las fórmulas del motor. Podés corregir las etiquetas para que describan con precisión la aproximación existente. El baseline optimizado, el indicador de helada y la conservación de agua se resuelven después en tareas científicas con regresiones.

SMAP numérico, ECOSTRESS, HLS, caupí/intercultivos, SMS, downscaling, backend y LLM están pendientes. No generes datos ni funciones aparentes para presentarlos como integrados. Los porcentajes de ahorro y pérdidas retirados de los documentos no son objetivos numéricos del frontend.

VALIDACIÓN Y ENTREGA
Ejecutá npm test y npm run build desde prototipo/field-shift. Revisá en navegador 360 px y 1366 px, teclado, ES/EN y que los controles sigan conectados. Informá lo que no pudiste verificar. Si cambia comportamiento, agregá pruebas relevantes.

Entregá el frontend funcional, los cambios de documentación necesarios y un resumen de archivos, comprobaciones y pendientes. Presentá solo lo que realmente quedó implementado.
```

## Después de esa entrega

Completar el caso local y revisar las fórmulas en tareas separadas. Definir con un técnico requisitos por operación y conectar una evaluación real de factibilidad a los recursos declarados, separada del puntaje climático. Una falta confirmada debe señalarse y una disponibilidad desconocida no se trata como asegurada. Para incorporar la siguiente fuente numérica, consultar [la matriz](MATRIZ_DATOS_Y_APIS_NASA.md) y documentar su uso efectivo antes de actualizar el pitch.
