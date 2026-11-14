# 🛰️ Matriz Técnica de Datos y APIs: NASA & Agencias Socias
### Field Shift: Adapting Farms with NASA Data

Este documento detalla cada conjunto de datos, API y plataforma oficial de la NASA, ESA, USDA y FAO utilizados por **Field Shift**, describiendo su mecanismo de consumo, resolución y rol agronómico específico en la herramienta.

---

## 1. Misiones y APIs de la NASA

### 1.1 NASA POWER API (Prediction Of Worldwide Energy Resources)
* **Tipo:** REST API pública (formato JSON / CSV).
* **Parámetros Clave:** Temperatura a 2m (`T2M`), Precipitación diaria (`PRECTOTCORR`), Radiación solar (`ALLSKY_SFC_SW_DWN`), Humedad relativa (`RH2M`), Grados Día de Desarrollo (`GDD`).
* **Endpoint de consulta:**
  ```text
  https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude=-62.83&latitude=-28.46&start=20240101&end=20241231&format=JSON
  ```
* **Rol en Field Shift:** Provee la serie meteorológica continua e histórica para el balance hídrico diario y el cálculo de ventanas térmicas de siembra sin necesidad de descargar archivos ráster pesados.

### 1.2 AppEEARS API (LP DAAC)
* **Qué es:** *Application for Extracting and Exploring Analysis Ready Samples*.
* **Misiones Accesibles:** ECOSTRESS, SMAP L3/L4, MODIS, VIIRS, HLS.
* **Rol en Field Shift:** Permite enviar un polígono vectorial (el límite de la parcela agrícola en Añatuya) y recibir únicamente la serie temporal extraída y filtrada por calidad (*Analysis-Ready Data*), optimizando el tiempo de procesamiento.

### 1.3 SMAP (Soil Moisture Active Passive)
* **Productos:** L3/L4 Soil Moisture (9 km a 36 km, resolución temporal de 2 a 3 días).
* **Variables:** Humedad en superficie ($0\text{–}5\text{ cm}$) y humedad en zona radicular ($0\text{–}100\text{ cm}$).
* **Rol en Field Shift:** Alimenta el algoritmo de decisión de siembra y el protocolo de riego de precisión, determinando si el perfil edáfico tiene agua disponible para la emergencia radicular del Sorgo o Caupí.

### 1.4 ECOSTRESS (ECOsystem Spaceborne Thermal Radiometer)
* **Ubicación:** Estación Espacial Internacional (ISS).
* **Resolución:** $\sim 70\text{ metros}$, muestreo diurno/nocturno variable.
* **Variables:** Land Surface Temperature (LST), Evaporative Stress Index (ESI), Water Use Efficiency (WUE).
* **Rol en Field Shift:** Detección de anomalías térmicas a nivel de lote individual. Si el dosel vegetal eleva su temperatura respecto a la ambiental, el sistema dispara una alerta temprana de estrés hídrico 72 a 120 horas antes de que el daño sea irreversible.

### 1.5 GPM IMERG (Global Precipitation Measurement)
* **Resolución:** $0.1^\circ$ ($\sim 10\text{ km}$), frecuencia cada 30 minutos.
* **Rol en Field Shift:** Registro de acumulados de lluvias convectivas de verano. Permite validar si un evento de tormenta aportó agua efectiva o si generó riesgo de escorrentía rápida.

### 1.6 Shuttle Radar Topography Mission (SRTM)
* **Resolución:** 30 metros (1 arco-segundo).
* **Variables:** Elevación digital, mapa de pendientes, dirección de flujo hidrológico.
* **Rol en Field Shift:** Cruza la topografía con las lluvias de GPM para identificar sectores propensos a erosión hídrica en laderas o anegamiento en bajos topográficos.

### 1.7 Harmonized Landsat Sentinel-2 (HLS) & MODIS/VIIRS
* **Resolución:** 30 m (Landsat) / 10–20 m (Sentinel-2) / 250 m (MODIS).
* **Variables:** NDVI, EVI, NDWI (Índice de Agua en Vegetación).
* **Rol en Field Shift:** Seguimiento fenológico multianual. Detecta períodos de suelo baldío (NDVI bajo continuo) y valida el incremento de biomasa de las rotaciones regenerativas.

---

## 2. Recursos de Agencias Socias (ESA, FAO, USDA)

### 2.1 Copernicus Sentinel-2 (ESA)
* Bandas espectrales Red-Edge y SWIR ideales para discriminar estrés clorofílico y contenido de humedad foliar a escala de 10 a 20 metros.

### 2.2 FAO GAEZ (Global Agro-Ecological Zones)
* Modelos globales de idoneidad agroclimática y limitaciones de suelo para Sorgo, Leguminosas y Maíz, que respaldan la viabilidad agronómica del consorcio propuesto en biomas semiáridos.

### 2.3 OpenET (NASA / USGS / DRI)
* Marco de referencia para la estimación de Evapotranspiración (ET) a escala de campo (30 m). Sirve como base metodológica para cuantificar el ahorro hídrico del mulching.

### 2.4 USDA Ag Data Commons, CDL & SSURGO
* Provee la estructura de datos para rotaciones validadas y propiedades edáficas que permiten que la arquitectura de Field Shift sea directamente transferible y escalable a regiones agrícolas de Estados Unidos (ej. Great Plains).

---

## 3. Arquitectura del Flujo de Datos

```
[NASA Earthdata / APIs]
  ├── NASA POWER API (Meteorología diaria en tiempo real)
  ├── AppEEARS API (Extracción SMAP + ECOSTRESS por parcela)
  ├── GPM IMERG (Eventos extremos de lluvia)
  └── SRTM 30m (Topografía y riesgo de escorrentía)
            │
            ▼
[FIELD SHIFT PIPELINE]
  ├── Armonización espacial a cuadrícula común (30m)
  ├── Cálculo de Evapotranspiración y Balance Hídrico (FAO-56)
  ├── Evaluación de Ventana de Siembra y Riesgo Térmico
  └── Comparador Multicriterio de Rotaciones
            │
            ▼
[CANAL DE ENTREGA]
  ├── Web Dashboard para Técnicos y Cooperativas
  └── Alertas SMS / Offline para Productores Rurales
```
