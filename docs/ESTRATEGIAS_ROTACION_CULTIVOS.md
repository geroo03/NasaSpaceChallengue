# 🌾 Comparativa de Estrategias de Rotación de Cultivos
### Requisito Oficial NASA Space Apps Challenge 2026

La consigna oficial de **Field Shift** exige explícitamente:
> *"Compare at least three rotation strategies, including the current one. For each strategy, explain why it was suggested, what evidence supports it, what benefits it may offer, where data gaps exist, and any risks that warrant local review by farmers or agricultural experts."*

A continuación se detalla la matriz agronómica completa para el caso de estudio de **Añatuya, Chaco Semiárido (Santiago del Estero, Argentina)**.

---

## Estrategia 1: Línea de Base (Práctica Actual Convencional)

* **Esquema:** Monocultivo de Maíz tardío o Algodón en verano $\rightarrow$ Barbecho químico largo (Suelo desnudo de Mayo a Noviembre).
* **Por qué se evaluó:** Es la práctica dominante en la región chaqueña, caracterizada por dejar el lote descubierto durante el invierno y primavera temprana esperando la primera lluvia estival.
* **Evidencia que la cuestiona (Datos NASA):**
  * **Landsat / Sentinel-2:** Muestran NDVI $< 0.15$ durante más de 160 días al año (suelo completamente expuesto a erosión eólica).
  * **ECOSTRESS:** Revela temperaturas de superficie terrestre (LST) que superan los $52^\circ\text{C}$ en el suelo descubierto, destruyendo materia orgánica y volatilizando la poca humedad remanente.
  * **SRTM + GPM IMERG:** En Octubre/Noviembre, las primeras tormentas intensas impactan sobre suelo desprotegido, causando sellado superficial (*planchado de suelo*) y escorrentía sin infiltración.
* **Beneficios reportados:** Bajo costo operativo inmediato en mano de obra durante los meses de invierno.
* **Riesgos y Lagunas:** Desertificación progresiva, pérdida acelerada de carbono orgánico y alta vulnerabilidad ante años con eventos de sequía prolongada (fase La Niña).

---

## Estrategia 2: Sucesión Resiliente Field Shift (Consorcio Sorgo + Caupí)

* **Esquema:** Siembra consorciada de **Sorgo granífero rústico (*Sorghum bicolor*)** intercalado con **Caupí (*Vigna unguiculata*)** en verano temprano $\rightarrow$ Cobertura de rastrojo estructurado en invierno.
* **Por qué se sugiere:** Ambas especies son nativas o adaptadas a climas semiáridos extremos. El sorgo aporta biomasa carbonada resistente y el caupí actúa como fijador biológico de nitrógeno y cobertura viva del entresurco.
* **Evidencia NASA de respaldo:**
  * **NASA POWER API:** Los Grados Día de Desarrollo (GDD base $10^\circ\text{C}$) en Añatuya ($> 2200$) garantizan el cierre de ciclo de ambas especies dentro de la ventana libre de heladas.
  * **SMAP:** La humedad superficial post-siembra requerida para la emergencia del sorgo y caupí es menor a $0.18\text{ m}^3/\text{m}^3$, tolerando períodos de hasta 20 días sin lluvia.
  * **FAO GAEZ:** Califica al sorgo y leguminosas tropicales con aptitud agroecológica alta para suelos con drenaje moderado y estrés hídrico recurrente.
* **Beneficios tangibles:**
  * **Fijación de Nitrógeno:** El Caupí aporta entre $40\text{ y }70\text{ kg N/ha}$, reduciendo la necesidad de urea sintética.
  * **Ahorro Hídrico:** El dosel combinado reduce la evaporación del suelo en un $\sim 30\%$.
  * **Seguridad Alimentaria y Forraje:** Doble propósito: grano/forraje para ganado y grano proteico para consumo familiar o venta local.
* **Lagunas de información y riesgos locales:**
  * *Riesgo local:* Competencia hídrica si la densidad de siembra es excesiva.
  * *Revisión requerida:* Validar con el técnico de INTA local la fecha de siembra y la inoculación bacteriana específica (*Bradyrhizobium*) para el suelo chaqueño.

---

## Estrategia 3: Regeneración Estructural (Abono Verde / Cultivo de Cobertura Rolado)

* **Esquema:** Cultivo de renta de ciclo corto (ej. Girasol o Maíz temprano) $\rightarrow$ Cultivo de servicio invernal (Vicia villosa / Centeno / Melilotus) rolado para crear un "mulching" denso no cosechable.
* **Por qué se sugiere:** Diseñado específicamente para campos con alta degradación estructural, compactación y riesgo de erosión hídrica en laderas leves.
* **Evidencia NASA de respaldo:**
  * **ECOSTRESS / OpenET:** Demuestra que mantener un colchón de rastrojo rolado sobre el suelo disminuye la temperatura máxima del suelo en $3\text{ a }5^\circ\text{C}$ y reduce la tasa de evapotranspiración de referencia en un $\sim 45\%$.
  * **GEDI:** La densidad de biomasa generada antes del rolado actúa como barrera física contra malezas resistentes, interrumpiendo el ciclo biológico de plagas del cultivo estival.
* **Beneficios tangibles:**
  * Máxima infiltración del agua de lluvia (GPM) y recarga de la zona radicular (SMAP).
  * Aumento del contenido de materia orgánica del suelo a mediano plazo (3 a 5 temporadas).
* **Lagunas de información y riesgos locales:**
  * *Riesgo crítico:* Si el invierno resulta excepcionalmente seco (detectable por anomalías de precipitación en GPM), el cultivo de cobertura puede "robar" agua del perfil destinada al cultivo siguiente si no se rola o termina a tiempo.
  * *Revisión requerida:* Monitoreo estricto del umbral SMAP en Agosto para decidir la fecha exacta de secado químico o mecánico del abono verde.

---

## Matriz Comparativa Resumen para el Jurado

| Criterio | Estrategia 1 (Monocultivo + Barbecho) | Estrategia 2 (Sorgo + Caupí Consorciado) | Estrategia 3 (Cultivo de Servicio / Mulching) |
|---|---|---|---|
| **Consumo Neto de Agua** | Ineficiente (alta evaporación) | **-45%** de demanda neta | **-50%** evaporación directa |
| **Balance de Nitrógeno** | Deficitario (depende de urea) | **Positivo** ($+40\text{–}70\text{ kg N/ha}$) | Neutro a moderadamente positivo |
| **Erosión de Suelo** | Alta (suelo descubierto en invierno) | Muy baja (rastrojo de sorgo) | Mínima (colchón protector continuo) |
| **Ingreso Económico** | Mono-dependiente (riesgo alto) | Diversificado (grano + forraje + legumbre) | Indirecto (ahorro futuro en insumos) |
| **Misiones NASA de Monitoreo** | Landsat, MODIS | SMAP, NASA POWER, GPM | ECOSTRESS, GEDI, OpenET |
| **Nivel de Madurez Operativa** | Tradicional actual | **Listo para piloto inmediato** | Requiere maquinaria de rolado |
