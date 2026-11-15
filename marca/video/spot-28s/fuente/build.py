"""Build index_<lang>.html from page.html: texts, stars, isometric fields, lot outline, chart, logo."""
import re, math, random, sys

T = {
 'en': dict(CAP1='Santiago del Estero · Argentina', T1='Every field has a <em>story</em>.',
            T2='Satellites have been <em>recording it</em> for years.', S2='Climate, terrain and soil, from open data.',
            CAP3='Step 1', T3='Draw your <em>field</em>.', S3='Area, slope and soil water, instantly.', K1='Area', K2='Slope', K3='Soil water',
            CAP4='Your options', T4='Compare your rotation with <em>alternatives</em>.', S4='Scored on what matters to you.',
            DEMO='Sample data', P_T='Your options', P_TODAY='WHAT YOU DO TODAY', P_A='Soybean → Corn', P_ALT='ALTERNATIVE 1 · TOP SCORE',
            P_B='Sorghum → Soybean + cover crops', P_C1='Sg · Sorghum', P_C2='Ry · Rye', P_C3='Sb · Soybean', P_MONTHS='Months without a crop:',
            CAP5='NASA POWER · 2011–2025', T5='15 years of climate, <em>for your field</em>.', S5='Heat at flowering · Water at sowing · Irrigation needs',
            CAP6='Satellite + drone', T6='Then a drone confirms the <em>detail</em>.', S6='Field checks with Vuelo Verde agricultural drone pilots.',
            CLAIM='Crop rotations powered by NASA open data', MONTHS='J A S O N D J F M A M J'),
 'es': dict(CAP1='Santiago del Estero · Argentina', T1='Cada lote tiene una <em>historia</em>.',
            T2='Los satélites la <em>registran</em> hace años.', S2='Clima, relieve y suelo, con datos abiertos.',
            CAP3='Paso 1', T3='Marcá tu <em>lote</em>.', S3='Superficie, pendiente y agua útil, al instante.', K1='Superficie', K2='Pendiente', K3='Agua útil',
            CAP4='Tus opciones', T4='Compará tu rotación con <em>alternativas</em>.', S4='Puntuadas según tus prioridades.',
            DEMO='Datos de ejemplo', P_T='Tus opciones', P_TODAY='LO QUE HACÉS HOY', P_A='Soja → Maíz', P_ALT='ALTERNATIVA 1 · MEJOR PUNTUADA',
            P_B='Sorgo → Soja + cultivos de servicio', P_C1='Sg · Sorgo', P_C2='Ce · Centeno', P_C3='Sj · Soja', P_MONTHS='Meses sin cultivo:',
            CAP5='NASA POWER · 2011–2025', T5='15 años de clima <em>de tu lote</em>.', S5='Calor en floración · Agua al sembrar · Riego necesario',
            CAP6='Satélite + dron', T6='Y un dron confirma el <em>detalle</em>.', S6='Verificación en campo con los pilotos de drones de Vuelo Verde.',
            CLAIM='Rotaciones con datos abiertos de la NASA', MONTHS='J A S O N D E F M A M J'),
}
NUM = {'en': ('52.3 ha', '0.3 %', '96 mm'), 'es': ('52,3 ha', '0,3 %', '96 mm')}

def words(s):
    out, i = [], 0
    for part in re.split(r'(<em>.*?</em>)', s):
        if not part.strip():
            continue
        em = part.startswith('<em>')
        txt = part[4:-5] if em else part
        ws = []
        for w in txt.split():
            ws.append(f'<span class="w" style="--i:{i}">{w}</span>')
            i += 1
        out.append(('<em>' + ' '.join(ws) + '</em>') if em else ' '.join(ws))
    s = ''
    for o in out:
        s += o if (not s or re.match(r'^<span class="w" style="--i:\d+">[.,!?]', o)) else ' ' + o
    return s

def build(lang):
    p = open('page.html').read()
    tx = T[lang]
    for k, v in tx.items():
        if k == 'MONTHS':
            continue
        p = p.replace(f'__{k}__', words(v) if k[0] == 'T' and k[1:].isdigit() else v)
    p = p.replace('52.3 ha', NUM[lang][0]).replace('0.3 %', NUM[lang][1])
    p = p.replace('__MONTHS__', ''.join(f'<span>{m}</span>' for m in tx['MONTHS'].split() * 2))
    p = p.replace('.big{', '.line .big{max-width:1560px;margin:0 auto}\n.big{', 1)
    p = p.replace('<html lang="en">', f'<html lang="{lang}">')

    random.seed(3)
    stars = ''.join(f'<circle cx="{random.uniform(0,1920):.0f}" cy="{random.uniform(0,760):.0f}" r="{random.choice([.8,1,1.2,1.6,2.2]):.1f}" opacity="{random.uniform(.25,.95):.2f}"/>' for _ in range(260))
    p = p.replace('__STARS__', stars)

    # isometric patchwork
    W, H, X0, Y0 = 300, 172, 1300, -560
    cols = ['#606C38', '#A3B18A', '#DDA15E', '#7a7448', '#8f7f55', '#5c6a3c', '#6f7744', '#9b8a5a']
    target = (1530, 760)
    cells, best = [], None
    for i in range(-2, 16):
        for j in range(-2, 16):
            cx, cy = X0 + (i - j) * W / 2, Y0 + (i + j) * H / 2
            if not (-300 < cx < 2900 and -200 < cy < 1700):
                continue
            d = (cx - target[0]) ** 2 + (cy - target[1]) ** 2
            cells.append((i, j, cx, cy))
            if best is None or d < best[0]:
                best = (d, i, j, cx, cy)
    out = []
    gap = 0.9
    for i, j, cx, cy in cells:
        hw, hh = W / 2 * gap, H / 2 * gap
        col = '#DDA15E' if (i, j) == best[1:3] else random.choice(cols)
        out.append(f'<path d="M{cx-hw:.0f} {cy:.0f} L{cx:.0f} {cy-hh:.0f} L{cx+hw:.0f} {cy:.0f} L{cx:.0f} {cy+hh:.0f}Z" fill="{col}"/>')
        k = random.choice([0, 1])
        for r in range(1, 8):
            f = r / 8
            if k:
                x1, y1 = cx - hw + hw * f, cy - hh * f
                x2, y2 = cx + hw * f, cy + hh - hh * f
            else:
                x1, y1 = cx - hw + hw * f, cy + hh * f
                x2, y2 = cx + hw * f, cy - hh + hh * f
            out.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="rgba(255,255,255,.09)" stroke-width="3"/>')
    p = p.replace('__FIELDS__', ''.join(out))
    _, _, _, cx, cy = best
    hw, hh = W / 2 * 0.97, H / 2 * 0.97
    p = p.replace('__LOT__', f'M{cx-hw:.0f} {cy:.0f} L{cx:.0f} {cy-hh:.0f} L{cx+hw:.0f} {cy:.0f} L{cx:.0f} {cy+hh:.0f}Z')
    p = p.replace('transform-origin:1530px 760px', f'transform-origin:{cx:.0f}px {cy:.0f}px')
    p = p.replace('transform-origin:LOTXpx LOTYpx', f'transform-origin:{cx:.0f}px {cy:.0f}px')
    # drone flight lines over the lot (lawnmower pattern), drawn one after another
    passes = []
    for q in range(1, 10):
        f = q / 10
        x1, y1 = cx - hw + hw * f, cy - hh * f
        x2, y2 = cx + hw * f, cy + hh - hh * f
        passes.append(f'<path class="pass" pathLength="1" style="--d:{0.5 + q * 0.22:.2f}s" d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}"/>')
    p = p.replace('__PASSES__', ''.join(passes))

    # stylised 15-year climate trace (motif, no values shown)
    random.seed(11)
    n = 15 * 24
    ta, wa = [], []
    for k in range(n + 1):
        x = 60 + k / n * 1800
        s = math.sin(k / 24 * 2 * math.pi - 1.2)
        ta.append(f'{x:.1f} {300 - s * 120 - random.uniform(-26, 26):.1f}')
        wa.append(f'{x:.1f} {360 + s * 70 + math.sin(k / 7) * 18 + random.uniform(-14, 14):.1f}')
    ch = ''.join(f'<line class="grid" x1="{60 + y / 15 * 1800:.0f}" y1="60" x2="{60 + y / 15 * 1800:.0f}" y2="500"/>' for y in range(16))
    ch += ''.join(f'<text class="yr" x="{60 + (y + .5) / 15 * 1800:.0f}" y="540" text-anchor="middle">{2011 + y}</text>' for y in range(15))
    ch += f'<path class="wline" pathLength="1" d="M{" L".join(wa)}"/><path class="tline" pathLength="1" d="M{" L".join(ta)}"/>'
    p = p.replace('__CHART__', ch)

    logo = open('agrofield-logo-animado-negativo.svg').read()
    logo = re.sub(r'width="\d+" height="\d+"', 'width="100%"', logo, count=1)
    p = p.replace('__LOGO__', logo)
    assert '__' not in re.sub(r'<style>.*?</style>', '', p, flags=re.S).split('<script>')[0], re.findall(r'__\w+__', p)
    open(f'index_{lang}.html', 'w').write(p)

for l in sys.argv[1:] or ['en', 'es']:
    build(l)
print('ok')
