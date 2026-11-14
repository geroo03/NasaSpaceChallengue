---
tipo: revision
estado: documental-y-metodologico
---
# Correcciones técnicas

Estas observaciones ajustan la propuesta recibida. Las fuentes consultadas están en [[Fuentes verificadas]].

## SMAP y POWER

SMAP L4 incorpora un modelo y observaciones asimiladas. El panel debería decir **«Comparación entre productos de humedad»**, indicando origen, profundidad, escala y unidades. No llamarlo «satélite vs. modelo» como si L4 fuera una medición directa del lote.

`GWETROOT` y una humedad volumétrica en m³/m³ no se restan directamente. Primero revisar definiciones. Una comparación puede mostrar series normalizadas por separado y sus referencias, pero eso no las convierte en mediciones equivalentes.

Comparar dos productos no valida por sí solo ninguno: pueden compartir insumos o errores. Para validación independiente hacen falta registros de campo u otra referencia apropiada.

## Escalas y localización

Remuestrear SMAP a una grilla de 30 m no genera observaciones nuevas a 30 m. Mantener visible el soporte original de cada dato.

Las coordenadas `-27.7834, -64.2642` del ejemplo de Claude no fueron confirmadas como un lote de Añatuya. Tampoco se confirmó que el bbox HLS del ejemplo cubra el caso. No reutilizarlos con esa etiqueta sin verificar ubicación y polígono.

Una parcela dibujada sobre un mapa no cambia la resolución del producto que se consulta.

## ET y balance hídrico

Para convertir un flujo de calor latente medio diario a lámina equivalente:

`ET_mm_dia ≈ flujo_W_m2 × 86400 / 2450000 ≈ flujo_W_m2 × 0,0353`

Es una aproximación física usando calor latente de 2,45 MJ/kg. Aplicarla solo después de confirmar que la capa representa ese promedio diario y revisar escala, offset, calidad y faltantes. El nombre `ETdaily` no basta para elegir la unidad.

ET₀, ET del cultivo y ET real son cantidades distintas. Para un balance de suelo se necesitan almacenamiento inicial, capacidad de agua útil, profundidad radicular, lluvia efectiva y pérdidas. Sin esos parámetros, mostrar indicadores climáticos y supuestos, no una dosis de riego validada.

## Historia, escenario y pronóstico

Una campaña histórica permite explorar una secuencia bajo condiciones pasadas. No demuestra cómo habría rendido un cultivo sin un modelo calibrado. Las frecuencias históricas de helada requieren una ventana y denominador definidos; no son por sí solas un pronóstico de la próxima campaña.

MAGyP departamental aporta contexto agregado. No calibra automáticamente el rendimiento de un lote ni identifica el efecto causal de una rotación.

Open-Meteo/ERA5 y POWER pueden ofrecer contraste entre productos; llamar a eso «validación» exige justificar una referencia independiente.

## IA y reglas

Un LLM puede redactar una explicación, pero la instrucción «no inventes» no garantiza fidelidad. Mantener una plantilla determinista como base y comprobar cada cifra y afirmación contra el JSON. La IA no debe modificar el ranking ni los indicadores calculados.

Las descripciones de ganadores sirven como antecedentes por revisar. Su premio no demuestra que nuestra adaptación vaya a funcionar ni que el producto propuesto sea superior.

## Hallazgos adicionales al inspeccionar el ZIP

La revisión confirmó el método Hargreaves, 120 mm de reserva supuesta, 75 % de lluvia efectiva, reemplazo de humedad faltante por 0,4 y un cálculo de oferta por cultivo que no conserva almacenamiento entre cultivos. La regla del 75 % está comentada como aproximación USDA-SCS en el código; no asumir que ese factor fijo reproduce el método SCS completo ni que está calibrado localmente.

El indicador `frostRisk` es un máximo mensual ponderado; la UI lo describe como frecuencia de años con helada durante el ciclo. Esa descripción debe corregirse o recalcularse directamente con las campañas anuales.

El código optimiza también la rotación actual. Para evaluar el manejo real hay que conservar fechas observadas y distinguirlas del escenario optimizado.

`bareMonths` cuenta huecos del calendario, no suelo desnudo observado. Además, el modelo de erosión contempla rastrojo en algunos huecos. Explicar ambas cosas sin equiparar ausencia de cultivo con ausencia de cobertura.

El texto nuevo menciona ET₀ FAO-56 sin especificar método y capacidades completas con SMAP/ECOSTRESS/HLS/IA. El ZIP solo implementa Hargreaves y POWER numérico, con GIBS visual. Ver [[Auditoría del prototipo]] y [[Entrega 2026]].
