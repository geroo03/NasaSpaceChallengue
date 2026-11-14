---
tipo: handoff
estado: documentacion-preparada
fecha: 2026-11-14
---
# Preparación para Claude

El repositorio tiene una entrada de trabajo unificada para continuar el prototipo. La actualización adapta los cuatro documentos de `docs/` a lo implementado y conserva las versiones anteriores en el historial de Git.

## Lenguaje y arquitectura

TypeScript estricto, Vite, HTML semántico y CSS. Leaflet para mapas, Chart.js para gráficos y Vitest para pruebas. Node.js 24 + npm. Documentación en español, identificadores del código en inglés e interfaz ES/EN.

Se conserva el motor existente; la primera tarea es la adaptación del frontend. Los datos y contratos del dominio siguen separados del render y la red.

## Entradas de trabajo

Estos enlaces apuntan a archivos de la raíz del proyecto, por fuera de la bóveda:

- [README principal](../../README.md): stack, comandos, arquitectura, estado y prioridades.
- [CLAUDE.md](../../CLAUDE.md): instrucciones para el agente.
- [Prompt de inicio](../../docs/PROMPT_PARA_CLAUDE.md): encargo copiable de frontend.
- [Auditoría corregida](../../docs/AUDITORIA_ESTRATEGICA_NASA.md).
- [Matriz corregida](../../docs/MATRIZ_DATOS_Y_APIS_NASA.md).
- [Estrategias corregidas](../../docs/ESTRATEGIAS_ROTACION_CULTIVOS.md).
- [Presentación corregida](../../docs/GUIA_PRESENTACION_Y_VIDEO.md).

Si se abre la bóveda aislada sin el resto del repositorio, esos enlaces externos dejan de estar disponibles.

## Primera entrega esperada

Configurar caso → comparar → detalle. Interfaz responsive, bilingüe, conectada al motor y con fuentes, supuestos, vacíos y contrapartidas. Usar [[Prompt para Stitch]] como referencia visual.

Las fórmulas no se modifican en esa primera tarea. La revisión de agua, helada y calendario real continúa en [[Cambios prioritarios]]. Los porcentajes sin respaldo y las integraciones pendientes no son requisitos numéricos ni funcionalidades presentes.

Esta preparación modifica documentación; no implementa el frontend ni cambia el motor.
