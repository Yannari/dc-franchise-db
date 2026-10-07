"""tools/td-camp/live.py — lift the moving things out of a frame before it is traced.

    python tools/td-camp/live.py <image> <name> [sky_bottom_px=420]

Clouds: the show's clouds are pale, low-saturation blobs in the sky. Each one is cut out of the
frame with its own soft-edged alpha (assets/sets/td/sprites/tr-<name>-<k>.webp), the sky behind it is
filled in from the surrounding sky (inpainting), and the cleaned frame is written next to the
traced files (tools/td-camp/traced/cuts/<name>-base.png) for trace.py to trace. The cloud list, in
the frame's pixels, goes to tools/td-camp/traced/<name>-live.json for the plate builder to turn into
'cloud' marks the viewer drifts.
"""
import sys, os, json
import numpy as np
import cv2
from PIL import Image

W, H = 1600, 900
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def lift_clouds(src, name, sky_bottom=420, min_area=900):
    img = cv2.cvtColor(np.array(Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS)), cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    # the open sky: flood-filled from the top edge (a smooth gradient spreads, hard edges stop it)
    sky = np.zeros((H + 2, W + 2), np.uint8)
    soft = cv2.GaussianBlur(img, (5, 5), 0)
    for sx in range(5, W, 40):
        if sky[1, sx + 1] == 0:
            cv2.floodFill(soft.copy(), sky, (sx, 2), 0, (3, 3, 3), (3, 3, 3), 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    sky = sky[1:-1, 1:-1] > 0
    cloudish = (lab[..., 0] > 150) & (hsv[..., 1] < 110)
    # a cloud: bright and nearly colourless (or the pale blue / lilac of the show's cloud shading)
    bright = (lab[..., 0] > 205) & (hsv[..., 1] < 70)
    m = np.zeros((H, W), np.uint8)
    m[:sky_bottom] = bright[:sky_bottom].astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, cc, stats, cent = cv2.connectedComponentsWithStats(m, 8)
    sprites_dir = os.path.join(REPO, 'assets', 'sets', 'td', 'sprites')
    clouds, cut = [], np.zeros((H, W), np.uint8)
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a < min_area or w < 40 or h < 14 or w > W * 0.6:
            continue
        # the cloud and its shaded underside (a darker pale tone hugging it from below)
        cm = (cc == i).astype(np.uint8) * 255
        grown = cv2.dilate(cm, np.ones((15, 15), np.uint8))
        shade = (lab[..., 0] > 150) & (hsv[..., 1] < 110) & (grown > 0)
        cm = np.maximum(cm, shade.astype(np.uint8) * 255)
        cm = cv2.morphologyEx(cm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        # only a cloud with open sky all round it can drift; one tucked behind a palm stays painted
        ring = cv2.dilate(cm, np.ones((21, 21), np.uint8)) - cv2.dilate(cm, np.ones((7, 7), np.uint8))
        rs = ring > 0
        okring = (sky | cloudish)[rs]
        if okring.size and okring.mean() < 0.97:
            continue
        ys, xs = np.nonzero(cm)
        x0, x1, y0, y1 = max(xs.min() - 4, 0), min(xs.max() + 5, W), max(ys.min() - 4, 0), min(ys.max() + 5, H)
        alpha = cv2.GaussianBlur(cm[y0:y1, x0:x1].astype(np.float32), (0, 0), 1.2)
        rgba = np.dstack([cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2RGB), np.clip(alpha, 0, 255).astype(np.uint8)])
        sprite = f'tr-{name}-{len(clouds)}'
        Image.fromarray(rgba).save(os.path.join(sprites_dir, sprite + '.webp'), quality=92)
        clouds.append({'x': float(x0 + x1) / 2, 'y': float(y0 + y1) / 2, 'w': float(x1 - x0), 'sprite': sprite})
        cut = np.maximum(cut, cv2.dilate(cm, np.ones((15, 15), np.uint8)))
    # the sky behind a cloud is the sky's own gradient: each row of the cut takes the median colour
    # of that row's clear sky (pixels near the row's sky hue that are not cloud), so nothing from the
    # trees below bleeds in
    base = img.copy()
    if cut.any():
        # never touch anything that is not sky or cloud (a treetop the cloud brushed stays as drawn)
        skyish = sky | cloudish
        cut = (cut > 0) & skyish
        cut = cut.astype(np.uint8) * 255
        # each run of cut pixels in a row blends from the sky just left of it to the sky just right of it
        for y in range(H):
            row = cut[y] > 0
            if not row.any():
                continue
            x = 0
            while x < W:
                if not row[x]:
                    x += 1; continue
                x0 = x
                while x < W and row[x]:
                    x += 1
                # the nearest clear sky on each side (a palm frond at the edge is skipped over)
                xl = x0 - 3
                while xl > 0 and not skyish[y, xl] and x0 - xl < 80: xl -= 1
                xr = x + 2
                while xr < W - 1 and not skyish[y, xr] and xr - x < 80: xr += 1
                okl = xl >= 0 and skyish[y, max(xl, 0)]
                okr = xr < W and skyish[y, min(xr, W - 1)]
                cl = img[y, max(xl, 0)].astype(np.float32); cr = img[y, min(xr, W - 1)].astype(np.float32)
                if not okl: cl = cr
                if not okr: cr = cl
                t = np.linspace(0, 1, x - x0)[:, None]
                base[y, x0:x] = (cl * (1 - t) + cr * t).astype(np.uint8)
        base = np.where(cut[..., None] > 0, cv2.GaussianBlur(base, (0, 0), 2), base).astype(np.uint8)
    os.makedirs(os.path.join(REPO, 'tools', 'td-camp', 'traced', 'cuts'), exist_ok=True)
    cv2.imwrite(os.path.join(REPO, 'tools', 'td-camp', 'traced', 'cuts', f'{name}-base.png'), base)
    # flames: saturated yellow-orange blobs (a torch, a campfire); bulbs: small pale glowing dots
    fires, bulbs = [], []
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    fl = ((hue >= 12) & (hue <= 34) & (sat > 140) & (val > 215)).astype(np.uint8) * 255
    fl = cv2.morphologyEx(fl, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n2, cc2, st2, ce2 = cv2.connectedComponentsWithStats(fl, 8)
    for i in range(1, n2):
        x, y, w, h, a = st2[i]
        if a < 120 or h < 14 or w > 260 or h < w * 0.6:
            continue
        fires.append({'x': float(x + w / 2), 'y': float(y + h), 'h': float(h)})
    bl = ((val > 235) & (sat < 120) & (hue >= 15) & (hue <= 40)).astype(np.uint8) * 255
    n3, cc3, st3, ce3 = cv2.connectedComponentsWithStats(bl, 8)
    for i in range(1, n3):
        x, y, w, h, a = st3[i]
        if 12 <= a <= 500 and 0.6 < w / max(h, 1) < 1.7:
            bulbs.append({'x': float(ce3[i][0]), 'y': float(ce3[i][1])})
    json.dump({'clouds': clouds, 'fires': fires, 'bulbs': bulbs}, open(os.path.join(REPO, 'tools', 'td-camp', 'traced', f'{name}-live.json'), 'w'))
    return clouds


if __name__ == '__main__':
    src, name = sys.argv[1], sys.argv[2]
    sky_bottom = int(sys.argv[3]) if len(sys.argv) > 3 else 420
    lift_clouds(src, name, sky_bottom)
    d = json.load(open(os.path.join(REPO, 'tools', 'td-camp', 'traced', f'{name}-live.json')))
    print(name, len(d['clouds']), 'clouds', len(d['fires']), 'fires', len(d['bulbs']), 'bulbs')
