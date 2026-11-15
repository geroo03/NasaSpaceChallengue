import re, math, random
head = open('head.html').read()
body = open('body.html').read()
idx = open('/home/claude/promo/index.html').read()
script = idx[idx.index('<script>') + 8: idx.index('</script>')]
script = script.replace('const CUTS=[4,8,13,17.5,22.5,27.5,32,36.5];', '')
# quicker band wipe for a voice-paced cut
script = script.replace('if(t>c-0.6 && t<c+0.7)', 'if(t>c-0.4 && t<c+0.45)')
script = script.replace('(t-(best-0.46+lag))/(0.42-lag)', '(t-(best-0.30+lag))/(0.27-lag)')
script = script.replace('(t-(best+0.04+lag))/0.46', '(t-(best+0.02+lag))/0.30')
script = script.replace('t<best+0.04+lag ?', 't<best+0.02+lag ?')
body = body.replace('__SCRIPT__', script)
head = head.replace('#s9{background:var(--bosque)}', '#s9{background:var(--bosque)}\n#s8 .logo{width:820px}\nbody.h #s8 .logo{width:900px}')

def title(m):
    out = []; i = 0
    for part in re.split(r'(<em>.*?</em>)', m.group(1)):
        if not part.strip(): continue
        em = part.startswith('<em>'); txt = part[4:-5] if em else part
        ws = []
        for w in txt.split():
            ws.append(f'<span class="w"><span style="--i:{i}">{w}</span></span>'); i += 1
        s = ' '.join(ws); out.append('<em>' + s + '</em>' if em else s)
    return ' '.join(out)
body = re.sub(r'__T:(.*?)__', title, body)
random.seed(7); paths = []
for cx, cy, n in [(420, 520, 11), (1700, 1500, 13), (1600, 300, 7), (300, 1800, 8)]:
    ph = [random.uniform(0, 6.28) for _ in range(3)]
    for k in range(1, n + 1):
        r = k * 58; pts = []
        for j in range(121):
            a = j / 120 * 2 * math.pi
            rr = r * (1 + 0.13 * math.sin(3 * a + ph[0]) + 0.07 * math.sin(5 * a + ph[1] + k * .15) + 0.04 * math.sin(2 * a + ph[2]))
            pts.append(f"{cx + rr * math.cos(a):.1f} {cy + rr * 0.82 * math.sin(a):.1f}")
        paths.append(f'<path d="M{" L".join(pts)}Z" fill="none" stroke="#A3B18A" stroke-width="{2.2 if k % 4 == 0 else 1.2}" opacity="{0.55 if k % 4 == 0 else 0.35}"/>')
body = body.replace('__TOPO__', ''.join(paths))
open('index.html', 'w').write(head + body)
print('ok')
