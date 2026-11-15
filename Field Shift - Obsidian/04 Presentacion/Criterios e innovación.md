---
tipo: estrategia-de-entrega
fecha: 2026-11-14
fuente: Criterios_de_Evaluacion_2026.pdf y Componentes del Proyecto (ES), leídos completos
---
# Criterios e innovación

Los jueces puntúan del 1 al 5 cinco criterios: Impacto, Creatividad, Validez, Relevancia y Presentación. La entrega lleva:

- un resumen de 50 a 200 palabras;
- **un solo** enlace de demo: hasta 7 diapositivas (la de título cuenta) **o** un video de 30 s con subtítulos en inglés;
- los detalles del proyecto;
- los datos NASA con enlaces;
- otros recursos;
- la declaración de uso de IA.

La demo no puede pedir login y no puede usar logos ni marcas de la NASA.

## Dónde estamos por criterio

| Criterio | Evidencia en la app (15/11) | Riesgo |
| --- | --- | --- |
| Relevancia (datos NASA centrales) | NASA POWER alimenta todo el cálculo. NASA SRTM da la pendiente del lote, que entra al motor. HLS (Sentinel-2/Landsat) muestra el lote. Todo está trazado | Contar fuentes no suma: hay que mostrar que **cambian la decisión** |
| Validez (ciencia y uso) | Reglas explícitas, supuestos visibles y 105 tests. **Suelo real por lote** (SoilGrids) en lugar de 120 mm genéricos. Funciona sin conexión | Sigue siendo una heurística, sin calibrar contra rendimientos |
| Creatividad | El circuito **satélite → plan → dron → campo** | No decir que «nunca se hizo» |
| Impacto | Decidir antes de sembrar, validado por Vuelo Verde (más de 100 pilotos, alianza autorizada) | Sin lote ni productor real todavía |
| Presentación | 3 pantallas, lote de ejemplo en 1 clic y ficha imprimible | Falta el video o las slides: **lo más urgente** |

## Qué innovamos (para contarlo)

1. **De la historia climática al qué y cuándo verificar.** Field Shift no solo compara rotaciones: de cada una saca fechas concretas para revisar el lote y arma el pedido de vuelo con esas fechas. El satélite y el clima dan el historial, Field Shift planifica y el dron de Vuelo Verde confirma.
2. **El lote primero, con los datos que el productor ya tiene.** Lee el plano de mensura (DXF en POSGAR 2007, con corrección de ejes y faja), el catastro (SHP/KML) o un dibujo. El centro del lote pasa a ser el punto de NASA POWER, la pendiente sale de NASA SRTM y el suelo de SoilGrids.
3. **Cada número dice de dónde viene.** Etiquetas «Dato NASA», «Medido con dron», «Modelado», «Supuesto» y «Declarado». Un análisis de suelo del productor o un DSM del dron reemplazan al mapa y la app lo dice.
4. **Pensado para el secano.** «Meses sin cultivo programado» no se presenta como suelo desnudo, por el rastrojo de la siembra directa que contó Vuelo Verde. Y el riego compartido sin confirmar no suma agua.

## Por qué el suelo era lo más importante

La consigna combina **observaciones NASA + suelo local + cultivos + prioridades**. El suelo era el único de los cuatro que el motor no usaba: suponía 120 mm de agua útil en todos lados. Ahora:

- **Fuente:** ISRIC SoilGrids 2.0. Se consultan la capacidad de campo (33 kPa), el punto de marchitez (1500 kPa), la textura y el carbono orgánico hasta 1 m, en el punto de análisis.
- **Cálculo:** agua útil = Σ (CC − PMP) × espesor de cada capa.
- **Lote de ejemplo:** franco (37 % arena, 20 % arcilla), MO ≈ 2,5 %, **94 mm** en lugar de 120 mm. La respuesta se guardó para que funcione sin conexión.
- **Prioridad:** si el productor carga un análisis de suelo, ese valor reemplaza al mapa.
- **Efecto en el resultado:** chico (unos ±1 punto de índice en el ejemplo), porque el modelo usa la reserva solo al sembrar. Hay que decirlo así, sin exagerarlo.

**Siguiente profundidad, si hubiera tiempo:** un balance de agua mes a mes que conserve la reserva entre cultivos. Ahí el suelo pesaría de verdad. Es un cambio de modelo grande: no entra antes del cierre.

Ver [[Pitch y guion]], [[Entrega 2026]], [[Entrevista Vuelo Verde]] e [[Inventario de datos]].

## Agregado el 15/11 (madrugada): calor, agua y El Niño

- **El Niño ahora:** NOAA observa un Niño muy fuerte (ONI +2,46 en ago–oct 2026). En el lote de ejemplo, las campañas Niño 2011–2025 tuvieron 721 mm entre octubre y marzo, las neutras 597 mm y las Niña 500 mm. Días ≥ 35 °C: 74, 84 y 93. Índice del manejo actual: 67 con campañas Niño y 58 con campañas Niña. Hay pocas campañas por fase: es una referencia, no una probabilidad.
- **Calor en floración:** la soja que florece en febrero tiene ~14 días ≥ 35 °C (riesgo alto); el maíz tardío que florece en marzo, 7,5 (medio).
- **Agua al sembrar (balance diario de dos capas):**
  - soja de diciembre: mediana 22 de 94 mm, y en 10 de 14 campañas menos de un tercio;
  - maíz tardío de enero después del barbecho: 45 mm;
  - con vicia invernal antes del maíz: 23 mm. Es el costo de agua del cultivo de servicio en secano.
- **Textos para el formulario:** `docs/ENTREGA_FORMULARIO.md` en el repo.
