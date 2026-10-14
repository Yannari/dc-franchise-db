"""tools/bb-resort/build.py — Big Brother's house: the Reality Resort plates, alive, by day and by night.

    python tools/bb-resort/build.py [all | <id> ...] [--theme <t>] [--marks] [--night-only]

The user cleaned the people out of Reality Resort's frames (tools/bb-resort/src/<id>.webp, and
src/<theme>/<id>.webp for a theme's redecorated copy). The plate IS that frame, as in Total Drama
(tools/td-camp/clean.py, whose ESRGAN sharpening and motion map this imports): nothing is traced.

Per plate, into assets/sets/bb/resort/<theme>/:
  <id>-day.webp, -day-hd.webp      1920 and 3840 wide (a frame under 3000 px goes through ESRGAN)
  <id>-night.webp, -night-hd.webp  the same room at night (below), or the user's own night frame
  <id>-day-motion.webp, -night-motion.webp   what moves where, for js/vp-td-ep/glplate.js
  <id>-water.webp                  the pool or the sea, where there is water
and js/vp-bb-ep/resort.js: every plate's marks and seats, and the manifest the stage reads.

Night, baked (a lamp has to come ON, which a shader grade cannot do):
  outdoors  the land darkened and cooled the way Total Drama paints night, the open sky a night sky
            with stars and a moon (nightify.py's night_sky), the pool lit from under the water
  indoors   darkened and WARMED (a lit house at night), the windows night outside, every marked
            lamp throwing a warm pool of light, the TV screens left glowing
In both, small warm bright things (a bulb, a lit sign) keep their light.

Marks are in Total Drama's reference pixels (1600x900), the same vocabulary as traced/places.json
(sway, cloth, pool, fall, glow, still, wind) plus lights [x,y,r], windows/screens [x0,y0,x1,y1].
Seats (`anchors`) are in the stage's own units, as js/vp-bb-ep/anchors.js: at [x% centre,
y% from the bottom, depth], w = tile width in % of the stage. place: [name, camera] of an island
spot, so a talk there is captioned with the place ("The Pier"), not the room it stands in for ("Backyard").
"""
import os, sys, json, glob, time
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, 'tools', 'td-camp'))
from clean import sharpen_4k, motion_map, sky_of          # noqa: E402
from nightify import night_sky                             # noqa: E402

SRC = os.path.join(HERE, 'src')
OUT = os.path.join(REPO, 'assets', 'sets', 'bb', 'resort')
MARKS = os.path.join(HERE, 'marks')                        # overlay checks (gitignored)
PLATES = os.path.join(HERE, 'plates.json')
JS = os.path.join(REPO, 'js', 'vp-bb-ep', 'resort.js')
THEMES = ['default', 'temptation', 'machine', 'mystery', 'high-rollers', 'summer-camp', 'summer-school']
K = 3840 / 1600.0                                          # 4K pixels per reference pixel


def save(path, img, q=90):
    cv2.imencode('.webp', img, [cv2.IMWRITE_WEBP_QUALITY, q])[1].tofile(path)


def load(path):
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f'cannot read {path}')
    return img


def box(b, k=K):
    return slice(int(b[1] * k), int(b[3] * k)), slice(int(b[0] * k), int(b[2] * k))


def own_colour(reg, tol=70):
    """The pixels of a marked box that are its main colour (the glass of a window, the face of a screen),
    softened at the edge: a box is a rectangle, the glass in it is not, and the wall round it stays wall."""
    ref = np.median(reg.reshape(-1, 3), axis=0)
    m = (np.abs(reg.astype(np.int16) - ref).sum(axis=2) < tol).astype(np.float32)
    return cv2.GaussianBlur(m, (0, 0), 1.2)[..., None]


def glow_of(h, w, lights, k=K):
    """A soft pool of light round each lamp: an inverse-square falloff, not a disc."""
    g = np.zeros((h, w), np.float32)
    yy, xx = np.ogrid[:h, :w]
    for (x, y, r) in lights:
        cx, cy, rr = x * k, y * k, max(r * k, 4)
        d2 = ((xx - cx) ** 2 + ((yy - cy) * 1.15) ** 2) / (rr * rr)
        g = np.maximum(g, (1.0 / (1.0 + 2.2 * d2)) * (d2 < 10))
    return g


def water_of(img, P):
    """The pool (or sea) pixels: the colour sampled at each pool mark, inside its box."""
    h, w = img.shape[:2]
    m = np.zeros((h, w), np.float32)
    lab = cv2.cvtColor(cv2.GaussianBlur(img, (5, 5), 0), cv2.COLOR_BGR2LAB).astype(np.int16)
    for b in P.get('pool', []):
        ys, xs = box(b)
        ref = lab[int(b[6] * K), int(b[5] * K)]
        m[ys, xs] = np.maximum(m[ys, xs], (np.abs(lab[ys, xs] - ref).sum(axis=2) < 34).astype(np.float32))
    return cv2.GaussianBlur(m, (0, 0), 2)


def kept_lit(img):
    """Small warm bright things keep their light at night: bulbs, lamp shades, a lit sign."""
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # saturated as well as bright: a pale cream wall is not a bulb (it lit in blotches when this was 60)
    warm = (((hsv[..., 0] < 32) | (hsv[..., 0] > 170)) & (hsv[..., 2] > 225) & (hsv[..., 1] > 110)).astype(np.uint8)
    n, lbl, st, _ = cv2.connectedComponentsWithStats(warm)
    small = np.zeros(n, bool); small[1:] = st[1:, 4] < w * h * .0012
    return cv2.GaussianBlur(small[lbl].astype(np.float32), (0, 0), 1.5)


def night_indoor(img, P):
    h, w = img.shape[:2]
    f = img.astype(np.float32) / 255.0
    lum = (f[..., 2] * .30 + f[..., 1] * .59 + f[..., 0] * .11)[..., None]
    tone = lum + (f - lum) * .78
    out = np.power(np.clip(tone * np.array([.48, .51, .60], np.float32), 0, 1), 1.12)   # BGR: warm kept
    # the windows: night outside, the glass a deep blue with a little of its own streaks left
    for b in P.get('windows', []):
        ys, xs = box(b)
        reg = img[ys, xs]
        glass = own_colour(reg)
        gy = np.linspace(0, 1, reg.shape[0], dtype=np.float32)[:, None, None]
        nightglass = np.array([.30, .14, .07], np.float32) * (1 - gy) + np.array([.42, .24, .14], np.float32) * gy
        streak = (f[ys, xs] - np.median(f[ys, xs].reshape(-1, 3), axis=0)).clip(0, 1) * .5
        out[ys, xs] = out[ys, xs] * (1 - glass) + (nightglass + streak) * glass
    # the lamps: a warm pool on the wall and floor, the room's own colours coming back inside it
    if P.get('lights'):
        g = cv2.GaussianBlur(glow_of(h, w, P['lights']), (0, 0), w / 400)[..., None]
        out = out * (1 - g * .55) + f * g * .55 + g * np.array([.04, .16, .32], np.float32) * (.4 + lum)
    lit = kept_lit(img)[..., None]
    out = out * (1 - lit) + f * lit
    # the screens stay on
    for b in P.get('screens', []):
        ys, xs = box(b)
        m = own_colour(img[ys, xs], 60)
        out[ys, xs] = out[ys, xs] * (1 - m) + f[ys, xs] * .92 * m
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)


def night_outdoor(img, P, seed):
    h, w = img.shape[:2]
    f = img.astype(np.float32) / 255.0
    lum = (f[..., 2] * .30 + f[..., 1] * .59 + f[..., 0] * .11)[..., None]
    tone = lum + (f - lum) * .55
    land = np.power(np.clip(tone * np.array([.70, .50, .42], np.float32), 0, 1), 1.18) + np.array([.035, .018, .012], np.float32)
    sky, _ = sky_of(img) if not P.get('nosky') else (np.zeros((h, w), bool), None)
    rows = np.where(sky.mean(axis=1) > .02)[0]
    horizon = int(rows.max()) if len(rows) else 0
    s = cv2.GaussianBlur(sky.astype(np.float32), (0, 0), 1.2)[..., None]
    rng = np.random.default_rng(seed)
    out = land * (1 - s) + (night_sky(h, w, horizon, rng) * s if horizon else 0)
    # the pool lit from under the water
    wm = water_of(img, P)[..., None] if not P.get('sea') else 0
    if P.get('pool') and not P.get('sea'):
        out = out * (1 - wm) + np.clip(f * np.array([1.05, 1.0, .5], np.float32) * .88 + np.array([.08, .06, 0], np.float32), 0, 1) * wm
    if P.get('lights'):
        g = cv2.GaussianBlur(glow_of(h, w, P['lights']), (0, 0), w / 400)[..., None]
        out = out * (1 - g * .5) + f * g * .5 + g * np.array([.05, .2, .42], np.float32) * (.35 + lum)
    lit = kept_lit(img)[..., None]
    out = out * (1 - lit) + f * lit
    for b in P.get('windows', []):            # lit windows from inside, warm
        ys, xs = box(b)
        m = own_colour(img[ys, xs])
        # a room lit behind the glass: warm amber, the glass's own streaks still showing through
        lit_in = np.clip(np.array([.30, .66, .96], np.float32) * (.72 + .45 * lum[ys, xs]), 0, 1)
        out[ys, xs] = out[ys, xs] * (1 - m) + lit_in * m
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)


def write_motion(path, img, P, night):
    mo = motion_map(img, {**P, 'night': night, 'wind': 0 if P.get('indoor') else P.get('wind', .8)})
    save(path, mo, 92)
    return mo


def build(pid, P, theme):
    src = os.path.join(SRC, pid + '.webp') if theme == 'default' else os.path.join(SRC, theme, pid + '.webp')
    if not os.path.exists(src):
        return None
    d = os.path.join(OUT, theme); os.makedirs(d, exist_ok=True)
    day = None if P.get('nightonly') else sharpen_4k(src, P.get('anchor', 0.5), P.get('box'))
    info = {}
    if day is not None:
        save(os.path.join(d, f'{pid}-day-hd.webp'), day, 86)
        save(os.path.join(d, f'{pid}-day.webp'), cv2.resize(day, (1920, 1080), interpolation=cv2.INTER_AREA), 90)
        write_motion(os.path.join(d, f'{pid}-day-motion.webp'), day, P, False)
        info['day'] = 1
        if P.get('pool'):
            a = (water_of(day, P) * 255).astype(np.uint8)
            a = cv2.resize(a, (1920, 1080), interpolation=cv2.INTER_AREA)
            save(os.path.join(d, f'{pid}-water.webp'), np.dstack([np.full_like(a, 255)] * 3 + [a]), 90)
            info['water'] = 1
    nsrc = P.get('nightsrc')
    if nsrc:
        night = sharpen_4k(os.path.join(SRC, nsrc + '.webp'), P.get('anchor', 0.5))
    elif P.get('nightonly'):
        night = sharpen_4k(src, P.get('anchor', 0.5), P.get('box'))
    elif day is not None:
        night = night_indoor(day, P) if P.get('indoor') else night_outdoor(day, P, sum(map(ord, pid)))
    else:
        night = None
    if night is not None and not P.get('nonight'):
        save(os.path.join(d, f'{pid}-night-hd.webp'), night, 86)
        save(os.path.join(d, f'{pid}-night.webp'), cv2.resize(night, (1920, 1080), interpolation=cv2.INTER_AREA), 90)
        write_motion(os.path.join(d, f'{pid}-night-motion.webp'), night, P, True)
        info['night'] = 1
    return info


def overlay(pid, P, theme='default'):
    """The plate with every mark drawn on it, to be read by eye before it ships."""
    p = os.path.join(OUT, theme, f'{pid}-day.webp')
    if not os.path.exists(p):
        p = os.path.join(OUT, theme, f'{pid}-night.webp')
    img = load(p); h, w = img.shape[:2]; k = w / 1600.0
    for x in range(0, 1600, 100):
        cv2.line(img, (int(x * k), 0), (int(x * k), h), (255, 255, 255), 1)
        cv2.putText(img, str(x), (int(x * k) + 2, 14), cv2.FONT_HERSHEY_SIMPLEX, .4, (255, 255, 255), 1)
    for y in range(0, 900, 100):
        cv2.line(img, (0, int(y * k)), (w, int(y * k)), (255, 255, 255), 1)
        cv2.putText(img, str(y), (2, int(y * k) - 2), cv2.FONT_HERSHEY_SIMPLEX, .4, (255, 255, 255), 1)
    def rect(b, c):
        cv2.rectangle(img, (int(b[0] * k), int(b[1] * k)), (int(b[2] * k), int(b[3] * k)), c, 2)
    for b in P.get('windows', []): rect(b, (255, 160, 0))
    for b in P.get('screens', []): rect(b, (255, 0, 255))
    for b in P.get('block', []): rect(b, (0, 0, 255))
    for b in P.get('pool', []): rect(b, (255, 255, 0)); cv2.circle(img, (int(b[5] * k), int(b[6] * k)), 5, (255, 255, 0), -1)
    for b in P.get('sway', []) + P.get('cloth', []): rect(b, (0, 200, 0))
    for (x, y, r) in P.get('lights', []): cv2.circle(img, (int(x * k), int(y * k)), int(r * k), (0, 220, 255), 2)
    if P.get('floor'):
        y0, y1 = P['floor']; cv2.rectangle(img, (0, int(y0 * k)), (w - 1, int(y1 * k)), (0, 255, 120), 1)
    for name, a in (P.get('anchors') or {}).get('seats', {}).items():
        x, y = a['at'][0] / 100 * w, h - a['at'][1] / 100 * h
        tw = a['w'] / 100 * w; th = tw * 1.25
        cv2.rectangle(img, (int(x - tw / 2), int(y - th)), (int(x + tw / 2), int(y)), (60, 60, 255), 2)
        cv2.putText(img, name, (int(x - tw / 2) + 3, int(y) - 5), cv2.FONT_HERSHEY_SIMPLEX, .5, (60, 60, 255), 2)
    for name in ('head', 'box', 'slot'):
        a = (P.get('anchors') or {}).get(name)
        if a:
            x, y = a['at'][0] / 100 * w, h - a['at'][1] / 100 * h
            cv2.circle(img, (int(x), int(y)), 8, (0, 0, 0), -1); cv2.putText(img, name, (int(x) + 10, int(y)), cv2.FONT_HERSHEY_SIMPLEX, .6, (0, 0, 0), 2)
    for key in ('screen',):
        r = (P.get('anchors') or {}).get(key)
        if r: cv2.rectangle(img, (int(r['x'] / 100 * w), int(h - (r['y'] + r['h']) / 100 * h)), (int((r['x'] + r['w']) / 100 * w), int(h - r['y'] / 100 * h)), (255, 0, 255), 2)
    for r in (P.get('anchors') or {}).get('panels', []):
        cv2.rectangle(img, (int(r['x'] / 100 * w), int(h - (r['y'] + r['h']) / 100 * h)), (int((r['x'] + r['w']) / 100 * w), int(h - r['y'] / 100 * h)), (255, 0, 160), 2)
    os.makedirs(MARKS, exist_ok=True)
    cv2.imwrite(os.path.join(MARKS, f'{pid}.png'), img)


def write_js(plates):
    """The stage's view of the house: which plates exist (per theme, by hour), their marks and seats."""
    have = {}
    for t in THEMES:
        for f in glob.glob(os.path.join(OUT, t, '*-day.webp')) + glob.glob(os.path.join(OUT, t, '*-night.webp')):
            pid, tod = os.path.basename(f)[:-5].rsplit('-', 1)
            have.setdefault(t, {}).setdefault(pid, []).append(tod)
    # the depth maps (tools/bb-resort/depth.py): which plates can move in depth
    depth = {t: sorted(os.path.basename(f)[:-len('-depth.webp')] for f in glob.glob(os.path.join(OUT, t, '*-depth.webp'))) for t in THEMES}
    depth = {t: v for t, v in depth.items() if v}
    pct = lambda b: [round(b[0] / 16, 2), round(100 - b[3] / 9, 2), round((b[2] - b[0]) / 16, 2), round((b[3] - b[1]) / 9, 2)]
    out = {}
    for pid, P in plates.items():
        if pid.startswith('_'):
            continue
        out[pid] = {k: P[k] for k in ('room', 'sets', 'use', 'indoor', 'anchors', 'words', 'cut', 'place') if k in P}
        if P.get('pool'): out[pid]['water'] = 1
        if P.get('screens'): out[pid]['screens'] = [pct(b) for b in P['screens']]       # [x%, bottom%, w%, h%]
        if P.get('floor'): out[pid]['floor'] = [round(100 - P['floor'][1] / 9, 2), round(100 - P['floor'][0] / 9, 2)]
    body = json.dumps({'v': int(time.time()), 'have': have, 'depth': depth, 'plates': out}, separators=(',', ':'))
    with open(JS, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('// GENERATED by tools/bb-resort/build.py from tools/bb-resort/plates.json. Do not edit by hand.\n')
        fh.write('// The Reality Resort plates: which exist (per theme, day/night), what room and moments each plays,\n')
        fh.write('// and the seats the ceremonies use (anchors, in the same units as anchors.js).\n')
        fh.write(f'export const RESORT = {body};\n')


if __name__ == '__main__':
    plates = json.load(open(PLATES, encoding='utf-8'))
    args = sys.argv[1:]
    theme = args[args.index('--theme') + 1] if '--theme' in args else 'default'
    ids = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--theme')]
    if ids in ([], ['all']):
        ids = [p for p in plates if not p.startswith('_')]
    marks_only = '--marks' in args
    js_only = '--js' in args
    for pid in ids:
        P = plates[pid]
        if not js_only and not marks_only:
            t0 = time.time()
            info = build(pid, P, theme)
            print(pid, theme, info, f'{time.time() - t0:.1f}s', flush=True)
        if marks_only or (not js_only and (P.get('anchors') or P.get('lights') or P.get('pool'))):
            overlay(pid, P, theme)
    write_js(plates)
