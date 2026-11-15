import sys, asyncio
from playwright.async_api import async_playwright

FMT = {'v': (1080, 1920), 'h': (1920, 1080)}

async def main(fmt, times, prefix):
    w, h = FMT[fmt]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.goto(f'file:///home/claude/promo/index.html?f={fmt}')
        await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(300)
        for t in times:
            await pg.evaluate(f'seek({t})')
            await pg.screenshot(path=f'{prefix}_{fmt}_{t:05.2f}.jpg', type='jpeg', quality=85)
        await b.close()

fmt = sys.argv[1]
times = [float(x) for x in sys.argv[3:]]
asyncio.run(main(fmt, times, sys.argv[2]))
