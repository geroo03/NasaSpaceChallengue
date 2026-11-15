"""Original cinematic score, synthesized from scratch (no samples or third-party material)."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 48000
DUR = 28.0
n = int(SR * DUR)
t = np.arange(n) / SR
L = np.zeros(n); R = np.zeros(n)
CUTS = [4, 8, 12, 16.5, 20.5]
HIT = 24.0

def midi(m): return 440 * 2 ** ((m - 69) / 12)

def place(sig, start, gl=1.0, gr=None):
    gr = gl if gr is None else gr
    i = int(start * SR)
    if i >= n or i + len(sig) <= 0: return
    s = sig[: n - i]
    L[i:i + len(s)] += s * gl; R[i:i + len(s)] += s * gr

def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)

# drone: D1/A1/D2 with slow swell, filter opening toward the hit
swell = np.clip(t / HIT, 0, 1) ** 1.6
drone = sum(np.sin(2 * np.pi * midi(m) * t + k) for k, m in enumerate([26, 33, 38])) / 3
saw = sum(np.sin(2 * np.pi * midi(50) * h * t) / h for h in range(1, 9)) * 0.25
dr = (drone * 0.55 + (lp(saw, 500) * (1 - swell) + lp(saw, 2500) * swell) * swell) * (0.35 + 0.65 * swell)
dr *= np.where(t < HIT, 1, np.exp(-(t - HIT) / 0.9))
place(dr * 0.5, 0, 0.9, 1.0)

# pad chords (Dm - Bb - F - C), airy
rng = np.random.default_rng(5)
chords = [[62, 65, 69], [58, 62, 65], [60, 65, 69], [60, 64, 67]]
seg = HIT / 6
for c in range(6):
    k = np.arange(int((seg + 1.2) * SR)) / SR
    s = sum(np.sin(2 * np.pi * midi(m) * k * (1 + d)) for m in chords[c % 4] for d in (-0.0012, 0.0012)) / 6
    env = np.minimum(1, k / 1.0) * np.minimum(1, (seg + 1.2 - k) / 1.0)
    place(lp(s * env, 2500) * 0.16 * (0.6 + 0.4 * c / 5), c * seg, 0.8, 1.0)

# ticking pulse from 4 s, accelerating into the hit
beat = 60 / 96
x = 4.0
while x < HIT - 0.05:
    k = np.arange(int(0.08 * SR)) / SR
    click = hp(rng.standard_normal(len(k)), 3500) * np.exp(-k * 60)
    place(click * 0.05, x, 0.7, 1.0)
    body = np.sin(2 * np.pi * (70 + 40 * np.exp(-k * 40)) * k) * np.exp(-k * 25)
    place(body * 0.18, x)
    x += beat if x < 16.5 else beat / 2

# whoosh risers into each cut and impacts on each cut
for c in CUTS + [HIT]:
    dur = 1.2
    k = np.arange(int(dur * SR)) / SR
    nz = rng.standard_normal(len(k))
    rise = lp(nz, 1500) * (k / dur) ** 3
    place(rise * (0.10 if c != HIT else 0.2), c - dur, 1.0, 0.8)
    kk = np.arange(int(2.5 * SR)) / SR
    boom = np.sin(2 * np.pi * (38 + 70 * np.exp(-kk * 9)) * kk) * np.exp(-kk * (2.2 if c == HIT else 4.5))
    place(boom * (0.55 if c == HIT else 0.32), c)

# final hit: wide chord + shimmer
k = np.arange(int(4.0 * SR)) / SR
ch = sum(np.sin(2 * np.pi * midi(m) * k) for m in [50, 57, 62, 66, 69, 74]) / 6 * np.exp(-k / 1.6)
shim = sum(np.sin(2 * np.pi * midi(m) * k * 1.0005) for m in [81, 86, 90]) / 3 * np.exp(-k / 1.2) * np.minimum(1, k / .3)
place(ch * 0.35 + shim * 0.08, HIT, 0.95, 1.0)

mix = np.stack([L, R], 1)
d = int(0.28 * SR)  # cross-feed echo for width
mix[d:, 0] += mix[:-d, 1] * 0.25; mix[d:, 1] += mix[:-d, 0] * 0.25
mix *= (np.minimum(1, t / 0.5) * np.clip((DUR - t) / 1.2, 0, 1))[:, None]
mix /= np.max(np.abs(mix)) / 0.79
wavfile.write('musica.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
