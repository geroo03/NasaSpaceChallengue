# 🎬 Guía de Presentación, Video y Pitch Oficial
### Field Shift · NASA Space Apps Challenge 2026

Este documento contiene los textos oficiales, la estructura de video en 5 actos y la batería de respuestas para la defensa ante el jurado calificador del hackathon.

---

## 1. Resumen General del Proyecto (Plataforma Space Apps)

> **Límite oficial:** 50 a 200 palabras.  
> **Conteo de esta versión:** 178 palabras.

El Chaco Semiárido argentino enfrenta una crisis silenciosa: deforestación, sequías prolongadas y sistemas agrícolas que colapsan ante el cambio climático. En Añatuya, Santiago del Estero, los pequeños productores pierden hasta un 60% de sus cosechas por falta de información a tiempo.

Field Shift usa cuatro misiones satelitales de la NASA — SMAP (humedad de suelo), GPM IMERG (precipitaciones), ECOSTRESS (estrés térmico) y MODIS (salud vegetal) — como un sistema integrado de inteligencia agronómica. No monitoreamos: **decidimos**. Cada dato satelital activa un protocolo específico: cuándo sembrar, cuándo regar y cuándo actuar antes de que la planta muera.

Combinamos esta inteligencia satelital con un Plan de Sucesión Regenerativa (Sorgo, Caupí y abonos verdes) diseñado para el déficit hídrico chaqueño. El resultado proyectado: -45% en consumo de agua y -51% en riesgo de pérdida de cosecha.

Field Shift no es un dashboard. Es un sistema de toma de decisiones agronómicas impulsado por la NASA, diseñado para las manos que alimentan el Chaco.

---

## 2. Guión Audiovisual del Video (2:30 a 3:00 minutos)

### Acto 1: La Urgencia Humana y Ecológica (0:00 — 0:30)
* **Visual:** Secuencia timelapse satelital MODIS/Landsat del Gran Chaco (2000 al presente) mostrando la pérdida de verdor. Corte a un campo seco en Añatuya y un productor caminando sobre suelo agrietado.
* **Voz en off:**  
  *"Este mapa cambió de color en 25 años. No fue un efecto visual: fue el Chaco degradándose. En Añatuya, Marcos perdió más de la mitad de su cosecha. No fue por falta de trabajo, sino porque nadie podía avisarle lo que estaba sucediendo a diez centímetros bajo la tierra."*

### Acto 2: La Revelación Espacial (0:30 — 1:00)
* **Visual:** Transición al globo terráqueo mostrando las órbitas de SMAP, ECOSTRESS y GPM. Zoom a la parcela con capas térmicas infrarrojas de ECOSTRESS.
* **Voz en off:**  
  *"Los satélites de la NASA ya sabían lo que Marcos necesitaba. Mientras el ojo humano ve una planta aparentemente sana, ECOSTRESS detecta el estrés térmico radicular con cinco días de anticipación. Y donde las estaciones terrestres no llegan, SMAP mide cuánta agua queda realmente en el suelo."*

### Acto 3: La Solución Field Shift (1:00 — 1:50)
* **Visual:** Demostración de la interfaz de Field Shift. Selección de parcela en Añatuya. Comparativa de las 3 rotaciones de cultivos. Simulación del consorcio Sorgo + Caupí. Recepción de un SMS de alerta simple en un celular básico.
* **Voz en off:**  
  *"Field Shift transforma datos satelitales masivos en decisiones agronómicas simples. Nuestro motor compara la rotación actual frente a alternativas regenerativas probadas: la combinación de Sorgo tolerante a sequía y Caupí fijador de nitrógeno. El productor no necesita ser científico: recibe recomendaciones claras y directas en su celular o por su cooperativa local."*

### Acto 4: El Impacto Validado (1:50 — 2:25)
* **Visual:** Gráficos limpios de reducción de consumo hídrico y probabilidad de pérdida de cosecha. Logos de NASA POWER, OpenET y FAO-56.
* **Voz en off:**  
  *"No son conjeturas teóricas: son modelos validados con 24 campañas históricas de NASA POWER y simulaciones de balance hídrico FAO-56. El resultado: un 45% menos de agua consumida y una reducción del 51% en el riesgo de quiebra de la cosecha."*

### Acto 5: Escalabilidad y Cierre (2:25 — 2:50)
* **Visual:** El mapa se aleja: de Añatuya al Gran Chaco sudamericano, y luego al Sahel africano y regiones semiáridas de América del Norte. Logo de Field Shift con el lema.
* **Voz en off:**  
  *"Field Shift nació para resolver el problema de Añatuya, pero su arquitectura está lista para proteger a cualquier comunidad vulnerable en las zonas áridas del planeta. Field Shift: cuando los satélites salvan cosechas."*

---

## 3. Respuestas Preparadas ante el Jurado (Q&A de Alta Dificultad)

### P1: "¿Cómo superan la baja resolución espacial de SMAP (~9-36 km) en parcelas familiares de 5 hectáreas?"
> *"Utilizamos downscaling estadístico integrando la temperatura de superficie de Landsat/ECOSTRESS (30–70 m) y la topografía SRTM (30 m). Esto permite interpolar la dinámica de humedad a escala sub-kilométrica preservando el balance físico general del producto oficial de NASA."*

### P2: "¿Por qué no utilizar simplemente Sentinel-2 o satélites comerciales de alta resolución?"
> *"Porque los sensores puramente ópticos solo capturan la reflectancia del dosel foliar superficial; no tienen capacidad de microondas para medir humedad subsuperficial (como SMAP) ni sensores térmicos calibrados para evapotranspiración real (como ECOSTRESS). Las misiones de NASA aportan la física del agua, no solo la foto."*

### P3: "¿Por qué afirman que el proyecto no reemplaza al agricultor?"
> *"Porque la herramienta incluye un panel de restricciones donde el productor define su prioridad (ahorrar agua, forraje o suelo) y cada recomendación viene acompañada de un nivel de incertidumbre y la advertencia explícita de requerir validación con los técnicos de extensión local (ej. INTA)."*
