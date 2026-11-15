"""Original background track synthesized from scratch (no samples, no third-party material)."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 48000
DUR = 41.0
BPM = 92
beat = 60 / BPM
n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros((n, 2))

def midi(m):
    return 440 * 2 ** ((m - 69) / 12)

def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= n:
        return
    sig = sig[: n - i] * gain
    mix[i:i + len(sig), 0] += sig * np.sqrt(0.5 * (1 - pan))
    mix[i:i + len(sig), 1] += sig * np.sqrt(0.5 * (1 + pan))

def env(length, a, r):
    k = np.arange(int(length * SR)) / SR
    e = np.minimum(1, k / a) * np.exp(-k / r)
    return e

def pluck(m, length=1.2):
    k = np.arange(int(length * SR)) / SR
    f = midi(m)
    s = np.sin(2 * np.pi * f * k) + 0.35 * np.sin(2 * np.pi * 2 * f * k) * np.exp(-k * 9) + 0.12 * np.sin(2 * np.pi * 3 * f * k) * np.exp(-k * 14)
    return s * env(length, 0.004, 0.32)

def pad(notes, length):
    k = np.arange(int(length * SR)) / SR
    s = np.zeros_like(k)
    for m in notes:
        f = midi(m)
        for d in (-0.08, 0.0, 0.08):  # light detune for warmth
            s += np.sin(2 * np.pi * f * (1 + d / 100) * k + d * 3)
    a = np.minimum(1, k / 0.9) * np.minimum(1, (length - k) / 0.9)
    return s * a / (len(notes) * 3)

# D major: D – Bm – G – A (one chord per bar)
prog = [(50, [62, 66, 69, 73]), (47, [59, 62, 66, 69]), (43, [59, 62, 67, 71]), (45, [57, 61, 64, 69])]
arps = [[74, 69, 66, 69, 73, 69, 66, 62], [71, 66, 62, 66, 69, 66, 62, 59],
        [71, 67, 62, 67, 74, 67, 62, 59], [73, 69, 64, 69, 76, 69, 64, 61]]
bar = 4 * beat
nbars = int(np.ceil(DUR / bar))
for b in range(nbars):
    root, chord = prog[b % 4]
    t0 = b * bar
    add(pad(chord, bar + 0.6), t0, 0, 0.30)
    add(pad([root, root + 12], bar + 0.4), t0, 0, 0.22)
    if b >= 1:  # arpeggio enters after the first bar
        for j, m in enumerate(arps[b % 4]):
            add(pluck(m), t0 + j * beat / 2, pan=(-0.35 if j % 2 else 0.35), gain=0.16 if j % 4 else 0.21)
    if 2 <= b < nbars - 1:  # soft pulse
        for j in range(4):
            k = np.arange(int(0.25 * SR)) / SR
            kick = np.sin(2 * np.pi * (52 + 60 * np.exp(-k * 30)) * k) * np.exp(-k * 14)
            add(kick, t0 + j * beat, 0, 0.18 if j % 2 == 0 else 0.10)
            noise = np.random.default_rng(b * 4 + j).standard_normal(int(0.06 * SR)) * np.exp(-np.arange(int(0.06 * SR)) / SR * 70)
            hb, ha = butter(2, 6000 / (SR / 2), 'high')
            add(lfilter(hb, ha, noise), t0 + j * beat + beat / 2, 0.2, 0.035)

# simple stereo echo for space
d = int(beat * 0.75 * SR)
mix[d:, 0] += mix[:-d, 1] * 0.22
mix[d:, 1] += mix[:-d, 0] * 0.22
lb, la = butter(2, 9000 / (SR / 2))
mix = lfilter(lb, la, mix, axis=0)
fade_in = np.minimum(1, t / 1.0)
fade_out = np.clip((DUR - t) / 2.8, 0, 1)
mix *= (fade_in * fade_out)[:, None]
mix /= np.max(np.abs(mix)) / 0.5  # peak about -6 dBFS: background level
wavfile.write('/home/claude/promo/musica.wav', SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape[0] / SR)
