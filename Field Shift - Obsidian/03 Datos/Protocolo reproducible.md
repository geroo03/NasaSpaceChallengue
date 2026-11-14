---
tipo: metodo
estado: propuesto
---
# Protocolo reproducible

Objetivo: que otra persona pueda reconstruir un indicador y entender qué aporta a la comparación. Se aplicó una reproducción inicial al punto predeterminado del prototipo; no a un lote confirmado de productor.

1. **Fijar el caso:** coordenadas/polígono, período y criterio para elegir la campaña. Si se elige una campaña seca, definir «seca» frente a una distribución histórica y no por el aspecto de un mapa.
2. **Elegir producto:** identificador, versión, variable, resolución, unidades, origen y licencia/cita. Distinguir producto diario y de media hora, L3 y L4, Early y Final.
3. **Guardar el original:** URL o solicitud, fecha de descarga, respuesta y metadatos. Registrar identificadores de gránulos o tarea cuando existan. No guardar credenciales.
4. **Aplicar calidad:** máscara, valores de relleno, escala/offset y cobertura temporal. Registrar datos ausentes; no convertirlos en ceros.
5. **Extraer:** describir píxel, promedio de área y tratamiento de bordes. Mantener la escala original en la explicación.
6. **Calcular:** guardar fórmula, unidades, parámetros y versión del script. Para una tasa en mm/h, acumular `tasa × duración_en_horas`; para un acumulado en mm, evitar multiplicarlo otra vez por tiempo. Señalar intervalos faltantes.
7. **Comparar estrategias:** misma serie y supuestos comunes, parámetros específicos citados y prioridades explícitas. Guardar indicadores previos al puntaje.
8. **Revisar:** contrastar con registros locales si existen y anotar discrepancias; no declarar validación independiente sin justificarla.
9. **Publicar evidencia:** tabla de resultados, limitaciones y archivos suficientes para repetir el cálculo.

## Paquete mínimo de una ejecución

| Archivo propuesto | Contenido |
| --- | --- |
| `metadata.json` | Caso, fuente, versión, consulta, fechas y unidades |
| `raw/` | Archivos originales sin modificar |
| `processed/` | Series depuradas y controles de calidad |
| `evidence.json` | Indicadores y referencia a cada origen |
| `method.md` | Pasos, fórmulas y supuestos |
| `results.csv` | Indicadores por estrategia y estado de datos faltantes |

Estos nombres siguen siendo una estructura propuesta para el pipeline. La revisión actual guarda consulta, metadatos, JSON original y resultados en `99 Recursos/Revision prototipo`. Crear una [[Ficha de fuente]] por nueva extracción.

## Reproducción realizada

Punto `-27.7834, -64.2642`, 2011–2025, datos diarios POWER. Se guardó respuesta original con cabecera, solicitud y checksum; se procesó con el parser y motor del ZIP, usando sus prioridades predeterminadas, secano y pendiente suave. También se ejecutó una sensibilidad −20 % de lluvia / +2 °C.

Se validó la descarga numérica y ejecución del motor. No se verificaron CORS ni mapas en navegador; no hubo contraste con estaciones ni suelo de campo. La respuesta tiene estándar temporal LST: respetarlo al combinar con otras series.

El script de reproducción está en `prototipo/revisar-caso.ts`, por fuera de las fuentes originales extraídas. [[Auditoría del prototipo]] contiene el comando y los resultados.
