# 🛰️ FIELD SHIFT — Auditoría Estratégica Integral
### NASA Space Apps Challenge · Estratega Experto & Jurado Principal

> **Proyecto:** Field Shift · Resiliencia Climática del Chaco Semiárido & Añatuya  
> **Misiones NASA:** SMAP · GPM IMERG · ECOSTRESS · MODIS · NASA POWER · SRTM · Landsat · GEDI  
> **Documento:** Plan Competitivo para Máxima Puntuación en Múltiples Categorías  

---

## 1. Diagnóstico Ejecutivo

Field Shift tiene **solidez ganadora**: ataca un problema real, geográficamente específico (Añatuya, Santiago del Estero), con datos NASA de primer nivel y una solución agronómica regenerativa basada en consorcios de cultivos.

> **Principio de Evaluación NASA:**  
> El jurado del Space Apps no premia "quien usó más satélites". Premia **a quien demuestre que sin esos satélites y APIs, la solución sería imposible**.

---

## 2. Eje 1: Relevancia e Integración de Datos (Rúbrica: 5/5)

### 2.1 El Cuarteto de Decisión Causal

Para evitar la "mención superficial de satélites", Field Shift articula una **cadena de dependencia funcional estricta**:

```
SMAP              GPM IMERG         ECOSTRESS         MODIS / Landsat
  ↓                   ↓                 ↓                     ↓
¿CUÁNTA agua        ¿CUÁNDO           ¿QUÉ TAN              ¿CÓMO
hay en suelo?       llovió?           estresado está?       responde la planta?
  ↓                   ↓                 ↓                     ↓
Decisión:           Decisión:         Decisión:             Decisión:
RIEGO EXACTO        SIEMBRA ÓPTIMA    MANEJO TÉRMICO        VALIDACIÓN MULTIANUAL
```

* **SMAP (Soil Moisture Active Passive):** Única fuente continua de humedad en suelo superficial y zona radicular. Permite prescindir de sensores in-situ costosos.
* **GPM IMERG:** Detecta precipitaciones convectivas locales erráticas en el Chaco que escapan al promedio de modelos climáticos regionales.
* **ECOSTRESS:** Mide temperatura de superficie (LST) y evapotranspiración (ET) a 70 m. Detecta estrés hídrico 3 a 5 días antes de que la marchitez sea visible en campo.
* **MODIS / Landsat:** Construye la línea de base histórica (2000–2026) y audita la recuperación del NDVI tras la intervención.

**Argumento blindado ante el jurado:**
> *"GPM nos dice cuánta lluvia cayó, pero solo SMAP revela lo que la raíz puede aprovechar. ECOSTRESS detecta el estrés térmico antes de que la hoja amarillee, y MODIS cierra el ciclo demostrando si la rotación regenerativa aumentó la cobertura vegetal año a año."*

---

## 3. Eje 2: Impacto Agronómico y Validación Científica (Rúbrica: 5/5)

### 3.1 Consorcio Sorgo Rústico + Caupí + Abonos Verdes

* **Sorgo rústico (*Sorghum bicolor*):** Alta tolerancia a sequía, raíces profundas para romper capas densas y gran producción de biomasa para cobertura.
* **Caupí (*Vigna unguiculata*):** Leguminosa rústica que fija nitrógeno simbiótico ($+40\text{ a }80\text{ kg N/ha/año}$), reduciendo costos de fertilizantes químicos y proveyendo proteína para la economía local.
* **Abonos Verdes / Mulching:** Creación de una capa protectora que frena la evaporación superficial frente a temperaturas de suelo que superan los $50^\circ\text{C}$.
* **Analogía Científica:** Este sistema intercalado está extensamente documentado por **ICRISAT en el Sahel africano** (bioma climáticamente análogo al Chaco Semiárido), demostrando mejoras del $+30\text{–}60\%$ en retención de agua en suelo.

### 3.2 Respaldo de Métricas Clave

| Métrica | Mecanismo Físico | Metodología de Cálculo |
|---|---|---|
| **-45% Consumo de Agua** | Riego por demanda real (umbral SMAP $< 0.15\text{ m}^3/\text{m}^3$) + mulching que reduce evaporación en $\sim 30\%$. | Balance FAO-56 Penman-Monteith con ETc ajustada por ECOSTRESS vs. lámina de riego tradicional por inundación. |
| **-51% Riesgo de Pérdida** | Alerta temprana ECOSTRESS (ventana de acción 3–5 días) + diversificación de cultivos. | Simulación retrospectiva de 24 campañas (2000–2024) cruzando anomalías GPM y NDVI-MODIS en años Niño/Niña. |

---

## 4. Eje 3: Creatividad y Ventaja Competitiva

* **De Dashboard Pasivo a Motor Prescriptivo:** La mayoría de proyectos muestran mapas que el agricultor no sabe interpretar. Field Shift transforma píxeles satelitales en recomendaciones agronómicas directas.
* **Entrega Ultra-Liviana:** El backend procesa las capas complejas de NASA; el agricultor recibe alertas claras vía SMS, bot de mensajería o boletín de radio comunitaria rural.
* **Apertura de Pitch (Primeros 30 segundos):**
  > *[Imagen satelital MODIS del Chaco pasando de verde en 2000 a marrón en 2026]*  
  > *"Este mapa cambió de color en 25 años. No fue un filtro fotográfico: fue el Chaco degradándose. En Añatuya, Marcos perdió el 60% de su cosecha no por falta de trabajo, sino porque no tenía forma de saber lo que los satélites de NASA ya sabían. Field Shift cambia eso."*

---

## 5. Eje 4: Blindaje ante Puntos Ciegos del Jurado

1. **Resolución de SMAP (~9 a 36 km) vs. Escala de Parcela:**
   * *Respuesta:* Se aplica downscaling estadístico integrando la temperatura de superficie de Landsat/ECOSTRESS (30–70 m) y modelos de elevación SRTM (30 m), técnica estandarizada en literatura científica (Vergopolan et al.).
2. **¿Por qué no usar únicamente Sentinel-2 óptico?**
   * *Respuesta:* Los sensores ópticos solo ven la superficie del dosel; no pueden penetrar el suelo para medir humedad (SMAP) ni medir temperatura térmica infrarroja de alta resolución para estrés evaporativo (ECOSTRESS).
3. **¿Cómo adopta la tecnología un pequeño productor sin conectividad?**
   * *Respuesta:* El diseño es *farmer-first*: la herramienta está pensada para intermediarios técnicos (cooperativas agrícolas, técnicos de INTA) que distribuyen alertas simplificadas por canales offline y radio local.
