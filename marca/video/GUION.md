# AgroField — video promocional (41 s)

Formatos: `agrofield-promo-vertical-1080x1920.mp4` (reels/historias) y `agrofield-promo-horizontal-1920x1080.mp4`. 30 fps, H.264 + AAC.
Público: productores y asesores agrícolas de Argentina. Llamado a la acción: la web (field-shift-lab.vercel.app).
Sin voz. Música original sintetizada para este video (no usa muestras ni material de terceros).
Los números que aparecen en el celular son **datos de ejemplo** (el celular lo dice) y las pantallas están recreadas a partir de la app real.

| # | Tiempo | Duración | Texto en pantalla | Qué se ve | Voz en off sugerida |
|---|---|---|---|---|---|
| 1 | 0:00–0:04 | 4,0 s | Logo AgroField · «Rotaciones con datos satelitales» | Se arma el logo animado: las tres franjas, la órbita, el satélite y el haz | «AgroField.» |
| 2 | 0:04–0:08 | 4,0 s | ¿Qué sembrar en los próximos dos años? / Decidilo con el clima, el suelo y el relieve de tu propio lote. | Lote isométrico de tres franjas | «¿Qué sembrar en los próximos dos años? Decidilo con datos de tu propio lote.» |
| 3 | 0:08–0:13 | 5,0 s | 1 · TU LOTE — Marcá tu lote o cargá el plano / KML, Shapefile o DXF de mensura. | En el celular se dibuja el límite sobre la imagen, aparecen los vértices y «Superficie 52,3 ha» | «Marcá tu lote sobre la imagen o cargá el plano de mensura.» |
| 4 | 0:13–0:17,5 | 4,5 s | 1 · TU LOTE — Relieve y suelo, al instante | Tarjetas «Datos del terreno» y «Suelo del lote», agua útil que sube a 96 mm, carga de DSM de dron | «Al instante tenés superficie, pendiente y el agua útil del suelo.» |
| 5 | 0:17,5–0:22,5 | 5,0 s | 2 · TU CAMPAÑA — Contanos tu campaña en 3 preguntas | Toques en: Soja → Maíz, «No tengo acceso» (riego), «Cuidar el agua» y «Suelo cubierto» | «Contanos qué sembrás, si podés regar y qué querés priorizar.» |
| 6 | 0:22,5–0:27,5 | 5,0 s | 3 · TUS OPCIONES — Compará tu rotación con alternativas | «Lo que hacés hoy» 61/100 contra «Alternativa 1» 68/100 (+7); meses sin cultivo 13 → 2 | «Compará lo que hacés hoy con alternativas puntuadas según tus prioridades.» |
| 7 | 0:27,5–0:32 | 4,5 s | 3 · TUS OPCIONES — 15 años de clima de tu lote | Calor en floración, riego necesario por sistema y agua en el suelo al sembrar | «Con quince años de clima de tu lote: calor, agua y riego.» |
| 8 | 0:32–0:36,5 | 4,5 s | 3 · TUS OPCIONES — Tu plan a 24 meses, listo para compartir | El calendario de 24 meses se completa, aparece «Antes de sembrar, verificá» y el botón «Ficha para compartir» | «Tu plan a veinticuatro meses, listo para compartir.» |
| 9 | 0:36,5–0:41 | 4,5 s | AgroField · Probalo gratis en la web · field-shift-lab.vercel.app · Con datos abiertos de la NASA | Cierre sobre verde bosque | «Probalo gratis en la web.» |

Transición entre escenas: tres franjas diagonales (salvia, ocre y oliva, las del logo) cruzan la pantalla; el corte ocurre con la pantalla cubierta.

## Para sumar la voz después
Cada escena dura entre 4 y 5 s y el texto sugerido entra en ese tiempo a ritmo normal. Mezclá la voz y bajá la música unos 10 dB:
`ffmpeg -i video.mp4 -i voz.wav -filter_complex "[0:a]volume=0.32[m];[m][1:a]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac salida.mp4`

## Editar
`fuente/page.html` tiene todas las escenas (textos, tiempos y pantallas). `python3 build.py` arma `index.html`, `python3 render.py v|h` renderiza cada escena y `bash assemble.sh v|h <nombre>` une las escenas y agrega la música.
