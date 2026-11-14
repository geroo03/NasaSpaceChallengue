# Field Shift — estado, evidencia y prioridades

Documento de trabajo del equipo, actualizado el 14 de noviembre de 2026. Describe el prototipo y propuestas para su siguiente entrega. No es una evaluación oficial del jurado ni asigna puntuaciones.

## Dirección

Una herramienta para explorar rotaciones durante 24 meses, con un caso inicial en Santiago del Estero y un futuro piloto en Añatuya. La decisión principal es qué secuencias conviene evaluar según agua, suelo y prioridades locales.

El [desafío oficial](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) combina observaciones NASA con contexto agrícola y criterio del productor. Su propuesta de comparar estrategias es orientativa. El equipo elige actual + hasta tres alternativas como diseño del producto.

## Estado y evidencia

| Elemento | Estado |
| --- | --- |
| POWER numérico | Implementado en cliente y motor; snapshot 2011–2025 procesado |
| GIBS | Código de capas visuales MODIS/SMAP presente |
| Comparación | Calendario de 24 meses, prioridades y explicaciones estructuradas |
| Software | 24 pruebas existentes y build aprobados en la revisión registrada |
| Interfaz | Código bilingüe compilado; ensayo visual completo pendiente |
| Suelo y cultivos | Supuestos y parámetros genéricos; falta revisión local |
| SMAP numérico, ECOSTRESS, HLS, AppEEARS | Propuestos, no integrados en el ZIP |
| SMS, downscaling y LLM | Propuestos, no implementados |
| Ensayo de campo, ahorro de agua y pérdidas evitadas | Sin evidencia local reproducible |

Los registros están en [evidencia del prototipo](../Field%20Shift%20-%20Obsidian/99%20Recursos/Revision%20prototipo). El caso usa el punto `-27.7834, -64.2642`, no un lote confirmado de Añatuya. Una ejecución regional y pruebas de software no validan recomendaciones agrícolas.

## Brechas que resolver

1. **Caso:** documentar productor o carácter ilustrativo, coordenadas, manejo, suelo y restricciones.
2. **Calendario:** conservar el manejo observado; el motor actual optimiza también la referencia.
3. **Agua:** presentar la oferta/demanda como aproximación. Falta conservación de almacenamiento entre cultivos.
4. **Helada:** alinear descripción y fórmula. El máximo mensual ponderado actual no equivale a porcentaje de campañas con helada durante todo el ciclo.
5. **Cobertura:** los huecos del calendario no demuestran suelo desnudo ni ausencia de rastrojo.
6. **Puntajes:** índices heurísticos, con parámetros y pesos visibles; no mediciones de suelo, ganancias o probabilidades de éxito.
7. **Uso:** verificar móvil, escritorio, errores, datos guardados y dependencia de red de los mapas.

## Próximo cierre

Adaptar frontend manteniendo TypeScript/Vite y los módulos existentes. Hacer visibles fuentes, supuestos, vacíos y contrapartidas. Completar el contexto local y revisar las fórmulas en tareas específicas. Después, considerar SMAP numérico como contexto regional; ampliar otras fuentes solo con una utilidad concreta.

La colaboración con técnicos de INTA, cooperativas y productores es una propuesta para revisar el caso y el piloto, no una alianza ya confirmada.

## Afirmaciones retiradas

No presentar −45 % de agua, −51 % de pérdidas, anticipación fija de 3–5 días, riego exacto por SMAP, downscaling implementado ni validación con 24 campañas. Los textos previos no aportaron archivos, ensayos y cálculos suficientes para sostenerlas.

También se retira el testimonio de «Marcos perdió el 60 %» mientras no exista un registro verificable y permiso de uso. Un cambio de NDVI no demuestra por sí solo degradación ni su causa.

## Evidencia que permitiría avanzar

| Objetivo | Evidencia necesaria |
| --- | --- |
| Mejorar comparación | Calendario local, suelo y parámetros con fuente; revisión agronómica |
| Medir agua aplicada | m³/ha, manejo, rendimiento y comparación pertinente, donde haya riego |
| Evaluar secano | Lluvia, humedad por profundidad, cobertura y rendimiento |
| Medir alertas | Episodios, anticipación, falsas alarmas, acción y resultado |
| Atribuir beneficios a una rotación | Comparación de manejos con condiciones y limitaciones documentadas |

Para implementar: [CLAUDE.md](../CLAUDE.md). Para presentar: [guía del equipo](GUIA_PRESENTACION_Y_VIDEO.md).
