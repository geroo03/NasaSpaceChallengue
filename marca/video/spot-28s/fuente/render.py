"""Render each scene to its own mp4 by seeking the page frame by frame (30 fps)."""
import sys, os, asyncio, subprocess
from playwright.async_api import async_playwright

FPS = 30
FMT = {'en': (1920, 1080), 'es': (1920, 1080)}
BOUNDS = [0, 4, 8, 12, 16.5, 20.5, 24, 28]


async def main(fmt):
    w, h = FMT[fmt]
    out = f'/home/claude/cine/out_{fmt}'
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.goto(f'file:///home/claude/cine/index_{fmt}.html')
        await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(400)
        for i in range(len(BOUNDS) - 1):
            final = f'{out}/s{i + 1:02d}.mp4'
            if os.path.exists(final):
                continue
            tmp = f'{out}/s{i + 1:02d}.tmp.mp4'
            n0, n1 = round(BOUNDS[i] * FPS), round(BOUNDS[i + 1] * FPS)
            ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS),
                                   '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
                                   '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp], stdin=subprocess.PIPE)
            for n in range(n0, n1):
                await pg.evaluate(f'seek({n / FPS})')
                ff.stdin.write(await pg.screenshot(type='jpeg', quality=92))
            ff.stdin.close()
            if ff.wait() == 0:
                os.replace(tmp, final)
                print(fmt, 'scene', i + 1, 'ok', flush=True)
            else:
                print(fmt, 'scene', i + 1, 'FAILED', flush=True)
        await b.close()

asyncio.run(main(sys.argv[1]))
