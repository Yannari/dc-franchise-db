# ══════════════════════════════════════════════════════════════════════
# tools/td-camp/nightify.py — a painted frame at night, the art kept
# ══════════════════════════════════════════════════════════════════════
# Most places only have the show's daytime frame. Rather than model them in 3D (the user rejected
# the 3D sets: the shows are painted), this repaints the frame itself for the night:
#   1. the land is darkened and cooled the way the shows paint night (a blue-violet cast, the
#      shadows deepest, the colour kept but quieter);
#   2. the open sky (clean.py's sky_of, grown from the top edge) becomes a night sky: a deep
#      gradient, stars, a moon;
#   3. what gives light keeps its light: the fires and torches marked in places.json glow warm
#      over the dark, and anything painted warm and bright (a lamp, a lit window, a flame) stays lit.
# The result is a new source frame, <place>-night.webp, that runs through clean.py and camp.py like
# any frame the user hands over (places.json gets a '<place>-night' entry copying the day's motion).
#
#   python tools/td-camp/nightify.py sol-fishing hc-campfire ...      (writes traced/src/*-night.webp;
#   an existing night frame is never overwritten without --force)
import os, sys, json
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from clean import sky_of

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'traced', 'src')
PLACES = os.path.join(HERE, 'traced', 'places.json')


def load(path):
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f'cannot read {path}')
    return img


def night_sky(h, w, horizon, rng, moon=None):
    """A night sky in BGR float: deep blue-black at the top, a lighter indigo toward the horizon,
    stars (fewer near the horizon), and a soft moon."""
    t = np.clip(np.arange(h, dtype=np.float32) / max(horizon, 1), 0, 1)[:, None]
    top, low = np.array([52, 20, 10], np.float32), np.array([120, 62, 42], np.float32)
    sky = (top * (1 - t[..., None]) + low * t[..., None]) * np.ones((1, w, 1), np.float32)
    n = int(w * h / 2600)
    ys = (rng.random(n) ** 1.6 * max(horizon, 1)).astype(int).clip(0, h - 1)
    xs = rng.integers(0, w, n)
    br = rng.random(n)
    for x, y, b in zip(xs, ys, br):
        r = 1 if b < .85 else 2
        cv2.circle(sky, (int(x), int(y)), r, (230 * (.55 + .45 * b), 232 * (.55 + .45 * b), 240 * (.55 + .45 * b)), -1, cv2.LINE_AA)
    # the moon, high in the open sky's larger side
    mx, my, mr = moon or (int(w * (.2 if rng.random() < .5 else .78)), int(max(horizon, 40) * .32), int(w * .028))
    glow = np.zeros((h, w), np.float32)
    cv2.circle(glow, (mx, my), mr * 4, 1, -1)
    glow = cv2.GaussianBlur(glow, (0, 0), mr * 1.6) * .35
    sky += glow[..., None] * np.array([180, 170, 150], np.float32)
    cv2.circle(sky, (mx, my), mr, (205, 232, 246), -1, cv2.LINE_AA)
    cv2.circle(sky, (mx + mr // 3, my - mr // 4), int(mr * .28), (180, 205, 222), -1, cv2.LINE_AA)
    return sky / 255.0


def nightify(name, P, seed=7):
    src = os.path.join(SRC, P['src'])
    img = load(src)
    h, w = img.shape[:2]
    k = w / 1600.0
    f = img.astype(np.float32) / 255.0
    # 1. the land at night: luminance kept in proportion, a cool cast, the darks pushed down
    lum = (f[..., 2] * .30 + f[..., 1] * .59 + f[..., 0] * .11)[..., None]
    sat = .55
    tone = lum + (f - lum) * sat
    land = tone * np.array([0.70, 0.50, 0.42], np.float32)        # BGR: blue kept most, red least
    land = np.power(np.clip(land, 0, 1), 1.18) + np.array([0.035, 0.018, 0.012], np.float32)
    # 2. the sky
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    moon = None
    if P.get('nosky'):
        sky = np.zeros((h, w), np.float32); horizon = 0
    else:
        m, _ = sky_of(img)
        # a sky the row-growing misses (a strip behind a cliff): marked by hand, [[x0,y0,x1,y1]] where
        # the sky's own colour is taken as sky
        for (x0, y0, x1, y1) in P.get('nightsky', []):
            box = (slice(int(y0 * k), int(y1 * k)), slice(int(x0 * k), int(x1 * k)))
            ref = np.median(img[box].reshape(-1, 3), axis=0)
            near = np.abs(img[box].astype(np.int16) - ref).sum(axis=2) < 60
            m[box] |= near
        rows = np.where(m.mean(axis=1) > .02)[0]
        horizon = int(rows.max()) if len(rows) else int(h * .4)
        # the painted sun becomes the moon, where it was: the brightest round blob above the horizon
        bright = ((hsv[..., 2] > 235) & (hsv[..., 1] < 90)).astype(np.uint8)
        bright[horizon:] = 0
        n, lbl, st, cen = cv2.connectedComponentsWithStats(bright)
        best = None
        for i in range(1, n):
            x, y, bw, bh, area = st[i]
            if area < w * h * .0003 or area > w * h * .03 or not (.6 < bw / max(bh, 1) < 1.6) or area < .55 * bw * bh:
                continue
            # a sun is out in the open sky: most of the ring round it is sky (not a lamp, a sign, a sail)
            ring = np.zeros((h, w), np.uint8)
            cv2.circle(ring, (int(x + bw / 2), int(y + bh / 2)), int(max(bw, bh) * 1.1), 1, max(2, int(max(bw, bh) * .25)))
            if m[ring.astype(bool)].mean() < .55:
                continue
            if best is None or area > best[4]: best = st[i]
        if best is not None:
            x, y, bw, bh, area = best
            mr = min(int(max(bw, bh) * .62), int(w * .034))
            moon = (int(x + bw / 2), int(y + bh / 2), max(mr, int(w * .02)))
            disc = np.zeros((h, w), np.uint8); cv2.circle(disc, moon[:2], int(moon[2] * 2.6), 1, -1)
            m |= disc.astype(bool)
        # a sun the detection cannot see (a swirl, a huge disc): [x, y, r] in places.json, painted over
        if P.get('sun'):
            sx, sy, sr = P['sun']
            if P.get('flip'): sx = 1600 - sx
            disc = np.zeros((h, w), np.uint8); cv2.circle(disc, (int(sx * k), int(sy * k)), int(sr * k), 1, -1)
            disc[horizon:] = 0                    # the sky only: never a hole cut in the ground
            m |= disc.astype(bool)
            moon = (int(sx * k), int(sy * k), int(w * .03))
        sky = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)
    rng = np.random.default_rng(seed + sum(map(ord, name)))
    out = land * (1 - sky[..., None]) + (night_sky(h, w, horizon, rng, moon) * sky[..., None] if horizon else 0)
    # 3. light: painted lights stay lit (small warm, bright spots: a flame, a lamp, a lit window, never
    # a whole beach of sand), and every marked fire throws a warm pool over the dark
    lo_v = 150 if P.get('warmlit') else 225
    warm0 = (((hsv[..., 0] < 30) | (hsv[..., 0] > 170)) & (hsv[..., 2] > lo_v) & (hsv[..., 1] > 110)).astype(np.uint8)
    n, lbl, st, _ = cv2.connectedComponentsWithStats(warm0)
    small = np.zeros(n, bool); small[1:] = st[1:, 4] < w * h * .0015
    # a place that is lit by something big and warm (a volcano's lava) keeps all of it lit: 'warmlit'
    warm = warm0.astype(bool) if P.get('warmlit') else small[lbl]
    lit = cv2.GaussianBlur(warm.astype(np.float32), (0, 0), 1.5)
    out = out * (1 - lit[..., None]) + f * lit[..., None]
    glow = np.zeros((h, w), np.float32)
    for (x, foot, fh) in P.get('fire', []):
        if P.get('flip'): x = 1600 - x          # the marks are on the flipped frame, the source is not
        # a pool of light that fades from the flame (an inverse-square falloff, not a disc)
        cx, cy, r = int(x * k), int((foot - fh * .5) * k), max(int(fh * k * 2.6), 6)
        yy, xx = np.ogrid[:h, :w]
        d2 = ((xx - cx) ** 2 + ((yy - cy) * 1.25) ** 2) / float(r * r)
        glow = np.maximum(glow, (1.0 / (1.0 + 2.5 * d2)).astype(np.float32) * (d2 < 9))
    for (x0, y0, x1, y1) in P.get('glow', []):
        box = np.zeros((h, w), np.float32); box[int(y0 * k):int(y1 * k), int(x0 * k):int(x1 * k)] = 1
        glow = np.maximum(glow, box * warm.astype(np.float32))
    if glow.any():
        glow = cv2.GaussianBlur(glow, (0, 0), max(4, w / 300)) * .85
        out += glow[..., None] * np.array([0.10, 0.42, 0.95], np.float32) * (0.35 + lum)
    out = np.clip(out, 0, 1)
    dst = os.path.join(SRC, f'{name}-night.webp')
    cv2.imencode('.webp', (out * 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 94])[1].tofile(dst)
    return dst


if __name__ == '__main__':
    places = json.load(open(PLACES, encoding='utf-8'))
    force = '--force' in sys.argv
    for n in [a for a in sys.argv[1:] if not a.startswith('--')]:
        # never over a frame that is already there (a painted night frame the user handed over):
        # regenerating our own takes --force
        if os.path.exists(os.path.join(SRC, f'{n}-night.webp')) and not force:
            print(f'{n}: a night frame exists, kept (--force to repaint)'); continue
        print(nightify(n, places[n]))
