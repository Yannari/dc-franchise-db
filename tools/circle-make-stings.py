# The five Circle stings the user did not supply (blocked, reveal, door, play,
# whoosh), rendered here for js/vp-ci/sound.js: layered
# synthesis with a small room reverb, stereo, levelled to -14 dB like the rest.
import numpy as np, lameenc, os
SR = 44100
rng = np.random.default_rng(7)
dst = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio', 'circle', 'sfx')   # run from anywhere: python tools/circle-make-stings.py (needs numpy, lameenc)
t_ = lambda d: np.arange(int(SR * d)) / SR

def env(n, a, d, curve=6.0):
    """attack a s, then exponential decay over the rest (curve = how fast)."""
    t = np.arange(n) / SR
    e = np.exp(-curve * np.clip(t - a, 0, None) / max(d, 1e-3))
    if a > 0: e = np.where(t < a, t / a, e)
    return e
def sweep(f0, f1, d, kind='exp'):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d) if kind == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR), f
def noise(d): return rng.standard_normal(int(SR * d))
def onepole(x, fc, hp=False):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); p = 0.0
    for i, v in enumerate(x): p = (1 - a) * v + a * p; y[i] = p
    return x - y if hp else y
def bandsweep(x, f_lo, f_hi):
    """a moving band: lowpass at a varying cutoff minus a lowpass lower down (per-sample state)."""
    n = len(x); fc = np.geomspace(f_lo, f_hi, n) if np.isscalar(f_lo) else f_lo
    y1 = np.zeros(n); y2 = np.zeros(n); p1 = p2 = 0.0
    for i in range(n):
        a1 = np.exp(-2 * np.pi * fc[i] * 1.6 / SR); a2 = np.exp(-2 * np.pi * fc[i] / 1.6 / SR)
        p1 = (1 - a1) * x[i] + a1 * p1; p2 = (1 - a2) * x[i] + a2 * p2
        y1[i] = p1; y2[i] = p2
    return y1 - y2
def reverb(x, secs=0.9, mix=0.22, bright=3000):
    ir = noise(secs) * np.exp(-6.9 * t_(secs) / secs)
    ir = onepole(ir, bright); ir /= np.abs(ir).sum() ** 0.5 * 8
    wet = np.convolve(x, ir)[: len(x) + int(SR * secs)]
    out = np.zeros(len(wet)); out[: len(x)] += x * (1 - mix)
    return out + wet * mix * 6
def place(buf, x, at):
    i = int(at * SR); buf[i:i + len(x)] += x[: len(buf) - i]
def stereo(m, pan=None, width=0.0):
    if pan is None: pan = np.zeros(len(m))
    l = m * np.sqrt(0.5 * (1 - pan)); r = m * np.sqrt(0.5 * (1 + pan))
    if width:
        d = int(SR * 0.012); r = r.copy(); r[d:] = (r[d:] * (1 - width) + r[:-d] * width) / np.sqrt((1 - width) ** 2 + width ** 2)
    return np.stack([l, r], axis=1)

def blocked():
    L = 2.6; buf = np.zeros(int(SR * L))
    # a short rising suck-in before the hit
    d = 0.32; sw = bandsweep(noise(d), 200, 2200) * np.linspace(0, 1, int(SR * d)) ** 2
    place(buf, sw * 0.5, 0.0)
    h = 0.32
    # the sub boom: 70 Hz falling to 28 Hz, long decay
    s, _ = sweep(70, 28, 2.0); place(buf, np.tanh(2.8 * s) / np.tanh(2.8) * env(len(s), 0.004, 2.0, 5) * 1.0, h)   # saturated: harmonics a laptop speaker can play
    # the body: a detuned low square-ish thump
    b, _ = sweep(210, 75, 0.45); place(buf, np.tanh(3 * b) * env(len(b), 0.002, 0.45, 4) * 1.1, h)
    # the impact: a noise crack, low-passed
    place(buf, onepole(onepole(noise(0.4), 700), 700) * env(int(SR * 0.4), 0.001, 0.4, 7) * 2.2, h)
    # the glitch: three bitcrushed stutters of a 440 Hz square after the hit
    for k, at in enumerate([0.12, 0.2, 0.31]):
        g = np.sign(np.sin(2 * np.pi * (440 + 220 * k) * t_(0.05)))
        g = np.round(g * 3) / 3 * env(len(g), 0.0, 0.05, 3)
        place(buf, g * 0.18, h + at)
    buf = reverb(buf, 1.4, 0.22, 900)
    return stereo(buf, width=0.35)

def reveal():
    L = 0.9; buf = np.zeros(int(SR * L))
    s, _ = sweep(150, 62, 0.6); place(buf, s * env(len(s), 0.002, 0.6, 6), 0)
    place(buf, onepole(noise(0.12), 1400) * env(int(SR * 0.12), 0.0005, 0.12, 8) * 0.45, 0)
    # a high "tick" on top so it cuts through the music
    s2, _ = sweep(2400, 1600, 0.05); place(buf, s2 * env(len(s2), 0.0005, 0.05, 6) * 0.15, 0)
    return stereo(reverb(buf, 0.8, 0.18, 1200), width=0.25)

def door():
    L = 2.5; buf = np.zeros(int(SR * L))
    def knock():
        n = int(SR * 0.16)
        body = sum(np.sin(2 * np.pi * f * t_(0.16)) * a for f, a in [(185, 1.0), (330, 0.45), (610, 0.2)])
        click = onepole(noise(0.16), 2500) * env(n, 0.0005, 0.02, 6)
        return (body * env(n, 0.001, 0.16, 7) * 0.8 + click * 0.9)
    for at in [0.0, 0.2, 0.55]: place(buf, knock(), at)
    # the latch, then the door swinging: a slow low noise swell and a creak
    place(buf, onepole(noise(0.03), 4000, hp=True) * env(int(SR * 0.03), 0.0, 0.03, 5) * 0.8, 1.05)
    d = 1.0; sw = onepole(noise(d), 400) * np.sin(np.pi * t_(d) / d) * 0.12; place(buf, sw, 1.1)
    c, _ = sweep(420, 300, 0.7, 'lin'); cr = np.sign(np.sin(2 * np.pi * np.cumsum(np.full(len(c), 38.0)) / SR)) * c
    place(buf, onepole(cr, 1200) * np.sin(np.pi * t_(0.7) / 0.7) * 0.05, 1.2)
    return stereo(reverb(buf, 0.9, 0.25, 1400), width=0.2)

def play():
    L = 0.75; buf = np.zeros(int(SR * L))
    for at, f in [(0.0, 880), (0.07, 1320)]:
        s = np.sin(2 * np.pi * f * t_(0.12)) + 0.3 * np.sin(2 * np.pi * 2 * f * t_(0.12))
        place(buf, s * env(len(s), 0.002, 0.12, 6) * 0.5, at)
    # the tape spinning up: a hum rising in pitch and fading in
    s, _ = sweep(60, 220, 0.4); place(buf, np.tanh(2 * s) * np.linspace(0, 1, len(s)) * env(len(s), 0, 0.4, 2) * 0.35, 0.18)
    return stereo(reverb(buf, 0.5, 0.15), width=0.2)

def whoosh():
    d = 0.8; n = int(SR * d)
    fc = np.concatenate([np.geomspace(300, 2800, n // 2), np.geomspace(2800, 600, n - n // 2)])
    x = bandsweep(noise(d), fc, None) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    # a shimmer on top: a quick rising sine glint
    g, _ = sweep(1200, 2600, 0.25); x[int(n * 0.35): int(n * 0.35) + len(g)] += g * env(len(g), 0.05, 0.25, 4) * 0.08
    y = reverb(x, 0.6, 0.18)
    pan = np.clip(np.linspace(-0.8, 0.8 * len(y) / n, len(y)), -0.8, 0.8)   # left to right, then stays right
    return stereo(y, pan=pan)

def level(x, target=-14.0, ceil=-1.0):
    m = x.mean(axis=1); w = 2205; k = len(m) // w
    db = 20 * np.log10(np.sqrt((m[:k*w].reshape(k, w) ** 2).mean(axis=1) + 1e-12)); body = db[db > -45]
    lvl = 10 * np.log10((10 ** (body / 10)).mean()); peak = 20 * np.log10(np.abs(x).max())
    # a soft limiter: up to 9 dB of the hit's peak is rounded off, so a
    # transient sting (a knock, a boom) reaches the level of the others
    g = min(target - lvl, ceil - peak + 9)
    c = 10 ** (ceil / 20); x = x * 10 ** (g / 20)
    x = np.where(np.abs(x) > c * 0.7, np.sign(x) * (c * 0.7 + c * 0.3 * np.tanh((np.abs(x) - c * 0.7) / (c * 0.3))), x)
    m = x.mean(axis=1); db = 20 * np.log10(np.sqrt((m[:k*w].reshape(k, w) ** 2).mean(axis=1) + 1e-12)); body = db[db > -45]
    lvl, g = 10 * np.log10((10 ** (body / 10)).mean()), 0
    fo = int(SR * 0.05); x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return x, lvl + g
def encode(x, path):
    e = lameenc.Encoder(); e.set_bit_rate(160); e.set_in_sample_rate(SR); e.set_channels(2); e.set_quality(2)
    open(path, 'wb').write(e.encode((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()) + e.flush())
for name, fn in [('blocked', blocked), ('reveal', reveal), ('door', door), ('play', play), ('whoosh', whoosh)]:
    x, lvl = level(fn())
    encode(x, os.path.join(dst, f'{name}.mp3'))
    print(f'{name:8s} {len(x)/SR:4.2f}s level {lvl:6.1f} dB peak {20*np.log10(np.abs(x).max()):5.1f}')
