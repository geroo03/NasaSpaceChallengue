# Prompt de inicio para Claude

Leer [CLAUDE.md](../CLAUDE.md) y [README.md](../README.md) antes de trabajar. Este prompt encarga una adaptación del frontend sobre el código existente; las integraciones futuras y las correcciones del motor se mantienen identificadas como tales.

Copiar lo siguiente en Claude junto con acceso al repositorio:

```text
Trabajá en geroo03/NasaSpaceChallengue. Primero leé README.md, CLAUDE.md y la documentación vigente de docs/. Revisá los cambios locales y conservá el trabajo del equipo.

Objetivo: adaptar el frontend de Field Shift para que un productor o técnico pueda configurar un caso, comparar rotaciones durante 24 meses y entender la evidencia y los límites de cada opción.

STACK
Continuá con TypeScript estricto, Vite, HTML semántico y CSS. Usá Leaflet, Chart.js y Vitest existentes. UI en español argentino e inglés, documentación en español e identificadores en inglés. Conservá las versiones y el lockfile salvo necesidad justificada.

BASE REAL
El código está en prototipo/field-shift. POWER alimenta el motor y GIBS agrega contexto visual. El punto predeterminado es ilustrativo; Añatuya es un piloto por confirmar. Hay registros de 24 pruebas y un build correctos, además de una ejecución POWER 2011–2025. Volvé a comprobar el estado cuando hagas cambios.

PRIMERA TAREA
Implementá el recorrido configurar → comparar → detalle usando el motor y los datos existentes. Concentrá los cambios en index.html, src/styles.css, src/main.ts y src/i18n.ts; podés extraer módulos de UI si mejora claridad.

Tomá como referencia el prompt para Stitch en Field Shift - Obsidian/04 Presentacion/Prompt para Stitch.md. Si no hay exportación visual, avanzá con esa guía: marfil, verde bosque, tonos tierra, buena tipografía, calendario de 24 meses protagonista y diseño usable en celular.

Conservá los controles funcionales de ubicación por punto, preset actual, riego, pendiente, prioridades y sensibilidad. Mostrá la referencia y hasta tres alternativas; si hay menos, explicá el resultado. Cada opción debe tener calendario, razón, evidencia, beneficios potenciales, contrapartidas, riesgos y vacíos.

Mostrá fuentes, períodos, unidades y escala. Usá “Meses sin cultivo programado”, “Índice orientativo”, “Supuesto” y “Dato faltante”. Explicá que los escenarios no son pronósticos. Agregá estados de carga, error y datos incompletos.

Para suelo, maquinaria y mercado, distinguí los campos informativos de los que el motor realmente consume. Conservá desconocidos y hacé visibles los supuestos; no simules que un campo nuevo ya cambia los cálculos.

ALCANCE DE ESTA ENTREGA
Mantené las fórmulas del motor. Podés corregir las etiquetas para que describan con precisión la aproximación existente. El baseline optimizado, el indicador de helada y la conservación de agua se resuelven después en tareas científicas con regresiones.

SMAP numérico, ECOSTRESS, HLS, caupí/intercultivos, SMS, downscaling, backend y LLM están pendientes. No generes datos ni funciones aparentes para presentarlos como integrados. Los porcentajes de ahorro y pérdidas retirados de los documentos no son objetivos numéricos del frontend.

VALIDACIÓN Y ENTREGA
Ejecutá npm test y npm run build desde prototipo/field-shift. Revisá en navegador 360 px y 1366 px, teclado, ES/EN y que los controles sigan conectados. Informá lo que no pudiste verificar. Si cambia comportamiento, agregá pruebas relevantes.

Entregá el frontend funcional, los cambios de documentación necesarios y un resumen de archivos, comprobaciones y pendientes. Presentá solo lo que realmente quedó implementado.
```

## Después de esa entrega

Completar el caso local y revisar las fórmulas en tareas separadas. Para incorporar la siguiente fuente numérica, consultar [la matriz](MATRIZ_DATOS_Y_APIS_NASA.md) y documentar su uso efectivo antes de actualizar el pitch.
