# Marca AgroField

El isotipo es un lote en perspectiva con tres franjas de cultivo (la rotación de dos años) y un satélite que baja el dato al lote. Usa la paleta y la tipografía de la app (`front-nasa/src/index.css`): el texto es Raleway ExtraBold convertido a trazos, así que se ve igual sin la fuente instalada.

## Archivos

| Archivo | Uso |
| --- | --- |
| `svg/agrofield-logo.svg` | Logo principal, sobre fondos claros |
| `svg/agrofield-logo-tagline.svg` | Con el lema "Rotaciones con datos satelitales" |
| `svg/agrofield-logo-negativo.svg` | Sobre fondo verde bosque (incluye el fondo) |
| `svg/agrofield-logo-vertical.svg` | Apilado, para portadas y espacios angostos |
| `svg/agrofield-isotipo.svg` | Solo el dibujo, sin texto |
| `svg/agrofield-icono-app.svg` | Ícono de app (fondo bosque, esquinas redondeadas) |
| `svg/agrofield-favicon.svg` | Versión simplificada para 16–32 px (sin los puntos del rayo) |
| `svg/agrofield-logo-animado.svg` / `-negativo.svg` | Animación para la web (CSS dentro del SVG, se reproduce una vez) |
| `png/` | Exportaciones con fondo transparente: logo 1200/2400 px, isotipo 1024, ícono 1024/512/192, `apple-touch-icon-180.png`, favicon 32 y 16 |
| `animado/agrofield-animado-claro.mp4` | Video 1920×1080, 5 s, fondo crema |
| `animado/agrofield-animado-oscuro.mp4` | Igual, fondo verde bosque |
| `animado/agrofield-animado-transparente.webm` | Fondo transparente (VP9 con alfa), para montar sobre el video en un editor |
| `animado/agrofield-animado.gif` | 960 px, para slides o chats |

## Colores

| Nombre | Hex | Dónde |
| --- | --- | --- |
| Bosque | `#283618` | "Agro", fondo del ícono |
| Terracota | `#BC6C25` | "Field", órbita, satélite |
| Salvia | `#A3B18A` | Franja 1 |
| Ocre | `#DDA15E` | Franja 2, "Field" en negativo |
| Oliva | `#606C38` | Franja 3, paneles del satélite, lema |
| Crema | `#FEFAE0` | Fondo claro, texto en negativo |

## La animación (≈ 3,4 s)

Entran las tres franjas una por una, se traza la órbita, aparece el satélite, el rayo baja al lote con un pulso y entra el nombre. Con "reducir movimiento" activado en el sistema, el SVG animado muestra el logo quieto.

## Reglas

- No usar logos, insignias ni elementos de marca de la NASA junto a esta marca (regla de Space Apps).
- Dejar alrededor un margen libre de al menos la altura de la "A".
- En tamaños menores a 48 px, usar el favicon simplificado.
