import re, math, random
p = open('page.html').read()
p = p.replace("""      // the cut happens under full cover
      if(t>=best-0.02+0 && t<best+0.04+lag) x=mid;
""", "")
p = p.replace("""  const bw=W*0.62;""", """  const H=innerHeight, sh=Math.tan(14*Math.PI/180)*0.8*H, tot=W+2*sh, bw=tot/3+60;""")
p = p.replace("""      const inP=Math.min(1,Math.max(0,(t-(best-0.46+lag))/0.40));
      const outP=Math.min(1,Math.max(0,(t-(best+0.04+lag))/0.46));
      const start=-bw*1.4, mid=i*bw*0.62-bw*0.15, end=W+bw*0.6;""", """      const inP=Math.min(1,Math.max(0,(t-(best-0.46+lag))/(0.42-lag)));
      const outP=Math.min(1,Math.max(0,(t-(best+0.04+lag))/0.46));
      const start=-sh-bw-40, mid=-sh+i*(tot/3)-30, end=W+sh+40;""")
p = p.replace("let x=-bw*1.6;", "let x=-sh-bw-40;")
p = p.replace('@keyframes pop-in{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}',
              '@keyframes pop-in{from{opacity:0;scale:.4}to{opacity:1;scale:1}}')
p = p.replace('background:var(--bosque);transform:scale(0);', 'background:var(--bosque);')
p = p.replace('<section class="scene" id="s1" data-s="0" data-e="4">',
              '<section class="scene" id="s1" data-s="0" data-e="4" style="--s:0s">')


def title(m):
    out = []
    i = 0
    for part in re.split(r'(<em>.*?</em>)', m.group(1)):
        if not part.strip():
            continue
        em = part.startswith('<em>')
        txt = part[4:-5] if em else part
        ws = []
        for w in txt.split():
            ws.append(f'<span class="w"><span style="--i:{i}">{w}</span></span>')
            i += 1
        s = ' '.join(ws)
        out.append('<em>' + s + '</em>' if em else s)
    return ' '.join(out)


p = re.sub(r'__T:(.*?)__', title, p)
p = p.replace('__MONTHS__', ''.join(f'<span>{m}</span>' for m in 'J A S O N D E F M A M J'.split() * 2))
logo = open('agrofield-logo-animado.svg').read().replace('width="567" height="240"', 'width="100%"', 1)
p = p.replace('__LOGO_ANIM__', logo)
random.seed(7)
paths = []
for cx, cy, n in [(420, 520, 11), (1700, 1500, 13), (1600, 300, 7), (300, 1800, 8)]:
    ph = [random.uniform(0, 6.28) for _ in range(3)]
    for k in range(1, n + 1):
        r = k * 58
        pts = []
        for j in range(121):
            a = j / 120 * 2 * math.pi
            rr = r * (1 + 0.13 * math.sin(3 * a + ph[0]) + 0.07 * math.sin(5 * a + ph[1] + k * .15) + 0.04 * math.sin(2 * a + ph[2]))
            pts.append(f"{cx + rr * math.cos(a):.1f} {cy + rr * 0.82 * math.sin(a):.1f}")
        paths.append(f'<path d="M{" L".join(pts)}Z" fill="none" stroke="#A3B18A" stroke-width="{2.2 if k % 4 == 0 else 1.2}" opacity="{0.55 if k % 4 == 0 else 0.35}"/>')
p = p.replace('__TOPO__', ''.join(paths))
open('index.html', 'w').write(p)
