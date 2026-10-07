"""tools/td-camp/clean.py — the show's own frame, cleaned, as the plate (no tracing).

    python tools/td-camp/clean.py [all | <name> ...]        (places: tools/td-camp/traced/places.json)

The plate IS the source frame (traced/src), in the show's own style:
  1. sharpened to 4K: a frame under 3000 px wide goes through Real-ESRGAN's anime model
     (realesrgan-ncnn-vulkan, on the GPU; set ESRGAN to its folder, default %TEMP%/esr), which
     redraws the cartoon's lines crisp instead of stretching them; a bigger frame is scaled down;
  2. people cut out (a polygon list or a mask) and the hole filled from a hand-drawn fill layer,
     or from the surroundings where the fill is empty;
  3. free clouds lifted into sprites (assets/sets/td/sprites/tr-<name>-<k>.webp, the viewer drifts
     them) with the sky behind each rebuilt from the sky on either side, ink line and all;
  4. a motion map: where the wind moves leaves, pines and cloth, where water ripples or falls,
     what rocks on the water, where a fire's heat shimmers and which lights twinkle. The viewer's
     shader (js/vp-td-ep/glplate.js) moves the plate's own pixels by it, so nothing is cut out.
Writes tools/td-camp/traced/cuts/<name>-clean.png (3840x2160), -clean-sd.png (1920x1080) and
-motion.png, which the plate builder copies into the plate (camp.py DIRECT), and <name>-live.json
(the clouds, in the 1600x900 reference pixels every plate mark uses).
"""
import sys, os, json, subprocess, tempfile
import numpy as np
import cv2
from PIL import Image

W, H = 3840, 2160
S = W / 1600.0                     # this frame's pixels per reference pixel
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ESRGAN = os.environ.get('ESRGAN', os.path.join(tempfile.gettempdir(), 'esr'))
SPRITES = os.path.join(REPO, 'assets', 'sets', 'td', 'sprites')
CUTS = os.path.join(REPO, 'tools', 'td-camp', 'traced', 'cuts')


def load_bgr(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        img = cv2.cvtColor(np.array(Image.open(path).convert('RGB')), cv2.COLOR_RGB2BGR)
    return img


def sharpen_4k(path):
    img = load_bgr(path)
    if img.shape[1] < 3000:
        src = os.path.join(tempfile.gettempdir(), 'clean-src.png'); out = os.path.join(tempfile.gettempdir(), 'clean-up.png')
        cv2.imwrite(src, img)
        subprocess.run([os.path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), '-i', src, '-o', out, '-n', 'realesrgan-x4plus-anime'],
                       check=True, capture_output=True, cwd=ESRGAN)
        img = load_bgr(out)
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA if img.shape[1] >= W else cv2.INTER_LANCZOS4)


def apply_cut(img, cut, fill):
    if isinstance(cut, str):
        m = cv2.resize(cv2.imread(cut, cv2.IMREAD_GRAYSCALE), (W, H), interpolation=cv2.INTER_NEAREST)
        m = (m > 127).astype(np.uint8) * 255
    else:
        m = np.zeros((H, W), np.uint8)
        for poly in cut:
            cv2.fillPoly(m, [(np.array(poly, np.float32) * S).astype(np.int32)], 255)
    m = cv2.dilate(m, np.ones((21, 21), np.uint8))
    if not fill:
        return cv2.inpaint(img, m, 20, cv2.INPAINT_TELEA)
    f = sharpen_4k(fill)
    drawn = (f.max(axis=2) > 8).astype(np.uint8)
    base = cv2.inpaint(img, (m * (1 - drawn)).astype(np.uint8), 20, cv2.INPAINT_TELEA)
    a = cv2.GaussianBlur(m.astype(np.float32) / 255.0 * drawn, (0, 0), 10)[..., None]
    return (base * (1 - a) + f * a).astype(np.uint8)


def sky_of(img):
    """The open sky: flood-filled from the top edge (a smooth gradient spreads, a drawn edge stops
    it), and the sky's colour on each row (its median there), for repainting."""
    H, W = img.shape[:2]
    sky = np.zeros((H + 2, W + 2), np.uint8)
    soft = cv2.GaussianBlur(img, (7, 7), 0)
    for sx in range(6, W, 32):
        if sky[1, sx + 1] == 0:
            cv2.floodFill(soft.copy(), sky, (sx, 3), 0, (3, 3, 3), (3, 3, 3), 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    sky = sky[1:-1, 1:-1] > 0
    if sky.mean() < 0.02:
        return sky, None
    rowcol = np.zeros((H, 3), np.float32); have = np.zeros(H, bool)
    for y in range(H):
        s = sky[y]
        if s.sum() > 20:
            rowcol[y] = np.median(img[y][s], axis=0); have[y] = True
    if not have.any():
        return sky, None
    ys = np.arange(H)
    for c in range(3):
        rowcol[:, c] = np.interp(ys, ys[have], rowcol[have, c])
    return sky, rowcol


def lift_clouds(img, base, sky, rowcol, name, start):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    cloudish = (lab[..., 0] > 150) & (hsv[..., 1] < 110)
    bright = ((lab[..., 0] > 205) & (hsv[..., 1] < 70)).astype(np.uint8) * 255
    bright[int(H * .55):] = 0
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    n, cc, st, _ = cv2.connectedComponentsWithStats(bright, 8)
    clouds, cut = [], np.zeros((H, W), np.uint8)
    if rowcol is None:
        return clouds
    soft = cv2.GaussianBlur(img, (5, 5), 0).astype(np.int16)
    offsky = np.abs(soft - rowcol[:, None, :].astype(np.int16)).sum(axis=2) > 14
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 900 * S * S or w < 40 * S or h < 14 * S or w > W * .6:
            continue
        core = (cc == i).astype(np.uint8)
        # the cloud is everything not-sky joined to its bright core: the shading and the ink line too
        win = cv2.dilate(core, np.ones((121, 121), np.uint8)) > 0
        blob = (offsky & win).astype(np.uint8) | core
        _, bc = cv2.connectedComponents(blob, connectivity=8)
        cm = np.isin(bc, np.unique(bc[core > 0])).astype(np.uint8) * 255
        cm = cv2.morphologyEx(cm, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
        ring = (cv2.dilate(cm, np.ones((49, 49), np.uint8)) - cv2.dilate(cm, np.ones((17, 17), np.uint8))) > 0
        if ring.any() and sky[ring].mean() < 0.93:
            continue                                  # tucked behind a palm: stays painted
        ys, xs = np.nonzero(cm)
        x0, x1, y0, y1 = max(xs.min() - 8, 0), min(xs.max() + 9, W), max(ys.min() - 8, 0), min(ys.max() + 9, H)
        alpha = cv2.GaussianBlur(cm[y0:y1, x0:x1].astype(np.float32), (0, 0), 2.5)
        sprite = f'tr-{name}-{start + len(clouds)}'
        save_sprite(img[y0:y1, x0:x1], alpha, sprite)
        clouds.append({'x': (x0 + x1) / 2 / S, 'y': (y0 + y1) / 2 / S, 'w': (x1 - x0) / S, 'sprite': sprite})
        cut = np.maximum(cut, cv2.dilate(cm, np.ones((31, 31), np.uint8)))
    if cut.any():
        skyish = sky | (cut > 0)
        repaint_sky(base, img, cut > 0, sky)
    return clouds


def repaint_sky(base, img, cut, skyish):
    """Each row run of the cut blends from the clear sky just left of it to the clear sky just right."""
    for y in np.nonzero(cut.any(axis=1))[0]:
        row = cut[y]; x = 0
        while x < W:
            if not row[x]:
                x += 1; continue
            x0 = x
            while x < W and row[x]:
                x += 1
            xl = x0 - 3
            while xl > 0 and not skyish[y, xl] and x0 - xl < 200: xl -= 1
            xr = x + 2
            while xr < W - 1 and not skyish[y, xr] and xr - x < 200: xr += 1
            cl = img[y, max(xl, 0)].astype(np.float32); cr = img[y, min(xr, W - 1)].astype(np.float32)
            if not skyish[y, max(xl, 0)]: cl = cr
            if not skyish[y, min(xr, W - 1)]: cr = cl
            t = np.linspace(0, 1, x - x0)[:, None]
            base[y, x0:x] = (cl * (1 - t) + cr * t).astype(np.uint8)
    blur = cv2.GaussianBlur(base, (0, 0), 3)
    base[cut] = blur[cut]


def save_sprite(bgr, alpha, sprite):
    rgba = np.dstack([cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), np.clip(alpha, 0, 255).astype(np.uint8)])
    Image.fromarray(rgba).save(os.path.join(SPRITES, sprite + '.webp'), quality=90)


def clean(name, P):
    for f in os.listdir(SPRITES):
        if f.startswith(f'tr-{name}-'):
            os.remove(os.path.join(SPRITES, f))
    T = os.path.join(REPO, 'tools', 'td-camp', 'traced')
    img = sharpen_4k(os.path.join(T, 'src', P['src']))
    if P.get('cut'):
        cut = os.path.join(T, P['cut'])
        cut = cut if cut.endswith('.png') else json.load(open(cut))
        img = apply_cut(img, cut, os.path.join(T, P['fill']) if P.get('fill') else None)
    base = img.copy()
    sky, rowcol = sky_of(img)
    # a night sky's pale shapes are the moon and the stars: they stay where the artist put them
    clouds = [] if P.get('night') else lift_clouds(img, base, sky, rowcol, name, 0)
    os.makedirs(CUTS, exist_ok=True)
    cv2.imwrite(os.path.join(CUTS, f'{name}-clean.png'), base)
    cv2.imwrite(os.path.join(CUTS, f'{name}-clean-sd.png'), cv2.resize(base, (1920, 1080), interpolation=cv2.INTER_AREA))
    mo = motion_map(base, P)
    cv2.imwrite(os.path.join(CUTS, f'{name}-motion.png'), mo)
    # the water's own pixels, as an alpha mask the viewer clips its glints and fish to
    wpath = os.path.join(CUTS, f'{name}-water.png')
    if P.get('pool'):
        a = cv2.threshold(mo[:540, :, 1], 40, 255, cv2.THRESH_BINARY)[1]
        cv2.imwrite(wpath, np.dstack([np.full_like(a, 255)] * 3 + [cv2.GaussianBlur(a, (0, 0), 1)]))
    elif os.path.exists(wpath):
        os.remove(wpath)
    json.dump({'clouds': clouds}, open(os.path.join(T, f'{name}-live.json'), 'w'))
    return clouds


def motion_map(base, P):
    """What moves where, painted as three 960x540 maps stacked in one image the viewer's shader reads
    (js/vp-td-ep/glplate.js). First: R the wind (leaves, pines, cloth: the higher up, the more), G still
    water rippling, B a waterfall running. Second: R a thing rocking on the water, G heat over a fire
    (the painted flame and the air above it), B a light that twinkles. Third: R the open sky."""
    img = cv2.resize(base, (1920, 1080), interpolation=cv2.INTER_AREA)
    h, w = 1080, 1920; k = 1920 / 1600.0
    R = lambda b: (int(b[0] * k), int(b[1] * k), int(b[2] * k), int(b[3] * k))
    sky, _ = sky_of(img)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hue, sat, val = (hsv[..., i].astype(int) for i in range(3))
    wind = np.zeros((h, w), np.float32)
    if not P.get('noleaf'):
        # foliage is leaf-coloured AND busy with edges (fronds, blades): flat ground and far hills
        # in the same colour stay put
        edges = cv2.Canny(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 40, 110).astype(np.float32) / 255
        busy = cv2.GaussianBlur(edges, (0, 0), 11) > 0.03
        leaf = (((hue >= 27) & (hue <= 95) & (sat > 60) & (val > 35) & (val < 205)) & ~sky & busy).astype(np.uint8)
        # a frond's flat middle moves with its edges: close the small gaps, then drop the specks
        leaf = cv2.morphologyEx(leaf, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))       # ink lines on the ground: not leaves
        leaf = cv2.morphologyEx(leaf, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
        leaf = cv2.morphologyEx(leaf, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)).astype(np.float32) * ~sky
        wind = leaf * (0.55 + 0.45 * (1 - np.arange(h)[:, None] / h))
    lab = cv2.cvtColor(cv2.GaussianBlur(img, (5, 5), 0), cv2.COLOR_BGR2LAB).astype(np.int16)
    for b in P.get('sway', []):
        x0, y0, x1, y1 = R(b)
        m = ~sky[y0:y1, x0:x1]
        if len(b) > 6:          # a sample of the plant's colour: only that sways, not the ground around it
            m &= np.abs(lab[y0:y1, x0:x1] - lab[int(b[6] * k), int(b[5] * k)]).sum(axis=2) < 46
        wind[y0:y1, x0:x1] = np.maximum(wind[y0:y1, x0:x1], m * b[4])
    for b in P.get('cloth', []):
        x0, y0, x1, y1 = R(b)
        wind[y0:y1, x0:x1] = np.maximum(wind[y0:y1, x0:x1], b[4])
    for b in P.get('still', []):
        x0, y0, x1, y1 = R(b)
        wind[y0:y1, x0:x1] = 0
    wind = cv2.GaussianBlur(wind, (0, 0), 3) * P.get('wind', 1.0)
    water = np.zeros((h, w), np.float32)
    for b in P.get('pool', []):
        x0, y0, x1, y1 = R(b)
        ref = lab[int(b[6] * k), int(b[5] * k)]
        m = (np.abs(lab[y0:y1, x0:x1] - ref).sum(axis=2) < 34).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        water[y0:y1, x0:x1] = np.maximum(water[y0:y1, x0:x1], m)
    water = cv2.GaussianBlur(water, (0, 0), 1.5)
    fall = np.zeros((h, w), np.float32)
    for b in P.get('fall', []):
        x0, y0, x1, y1 = R(b)
        fall[y0:y1, x0:x1] = 1
    fall = cv2.GaussianBlur(fall, (0, 0), 2)
    bob = np.zeros((h, w), np.uint8)
    for poly in P.get('bob', []):
        cv2.fillPoly(bob, [(np.array(poly, np.float32) * k).astype(np.int32)], 1)
    bob = cv2.GaussianBlur(cv2.dilate(bob, np.ones((15, 15), np.uint8)).astype(np.float32), (0, 0), 5)
    heat = np.zeros((h, w), np.float32)
    for (fx, fy, fh) in P.get('fire', []):
        # the painted flame itself and the air above it
        cv2.ellipse(heat, (int(fx * k), int((fy - fh * 0.9) * k)), (max(int(fh * .5 * k), 6), max(int(fh * 1.1 * k), 10)), 0, 0, 360, 1.0, -1)
    heat = cv2.GaussianBlur(heat, (0, 0), 6)
    lit = np.zeros((h, w), np.float32)
    warm = ((val > 205) & (sat > 50) & (hue >= 8) & (hue <= 40)).astype(np.float32)
    if P.get('night'):
        # small lights only (bulbs, windows): a flame flickers by its heat, the moon never twinkles
        n, cc, st, _ = cv2.connectedComponentsWithStats(warm.astype(np.uint8), 8)
        small = (st[:, 4] <= 2500); small[0] = False
        lit = small[cc].astype(np.float32)
    for b in P.get('glow', []):
        x0, y0, x1, y1 = R(b)
        lit[y0:y1, x0:x1] = np.maximum(lit[y0:y1, x0:x1], (val[y0:y1, x0:x1] > 200).astype(np.float32))
    lit = cv2.GaussianBlur(lit, (0, 0), 1.5)
    # the open sky, where the viewer's clouds and birds show through the plate (they fly behind
    # every tree and roof); a night frame keeps its painted sky whole
    open_sky = np.zeros((h, w), np.float32) if P.get('night') else cv2.GaussianBlur(sky.astype(np.float32), (0, 0), 1)
    z = np.zeros((h, w), np.float32)
    top = np.dstack([fall, water, wind]); bot = np.dstack([lit, heat, bob]); air = np.dstack([z, z, open_sky])   # BGR order
    panels = [cv2.resize(np.clip(x, 0, 1), (960, 540), interpolation=cv2.INTER_AREA) for x in (top, bot, air)]
    return (np.vstack(panels) * 255).astype(np.uint8)


if __name__ == '__main__':
    places = json.load(open(os.path.join(REPO, 'tools', 'td-camp', 'traced', 'places.json'), encoding='utf-8'))
    names = [n for n in places if not n.startswith('_')] if sys.argv[1:] in ([], ['all']) else sys.argv[1:]
    for n in names:
        c = clean(n, places[n])
        print(n, len(c), 'clouds')
