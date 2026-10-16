"""cutout.py - props cut out of a plate, and the plate with them painted out.

The user, 2026-10-15: a set painted with six of something (six poles, six platforms) caps a challenge at six,
"can you make it match the number of people, or do I need to do each version myself? Is it better to make the
scenes and then props?" So a set is an EMPTY plate plus one cut-out per player, placed by the viewer.

  python -I tools/ch-art/cutout.py cut <src.webp> <x0> <y0> <x1> <y1> <name> [hue_lo hue_hi sat_min]
      the object in that box (1600x900 plate coordinates), kept where its colour is the object's (OpenCV hue
      hue_lo..hue_hi with saturation >= sat_min, plus its dark outline), everything else transparent, cropped,
      saved to assets/sets/ch/props/<name>.webp
  python -I tools/ch-art/cutout.py key <src.png> <name> [green|black]
      a prop the user made alone on a flat background, keyed out and cropped (art jobs G02-G13)
  python -I tools/ch-art/cutout.py erase <src.webp> <out.webp> x0,y0,x1,y1 [x0,y0,x1,y1 ...]
      the plate with those boxes' objects painted out (the object's colour inside each box, inpainted)
"""
import os, sys
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PROPS = os.path.join(ROOT, 'assets', 'sets', 'ch', 'props')


def read(p):
    img = cv2.imdecode(np.fromfile(p, np.uint8), cv2.IMREAD_COLOR)
    if img.shape[1] != 1600:
        img = cv2.resize(img, (1600, 900), interpolation=cv2.INTER_AREA)
    return img


def object_mask(img, hue_lo, hue_hi, sat_min):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    body = ((h >= hue_lo) & (h <= hue_hi) & (s >= sat_min) & (v >= 35)).astype(np.uint8)
    dark = ((v < 70) & (s < 140)).astype(np.uint8)          # the clean dark outline
    near = cv2.dilate(body, np.ones((7, 7), np.uint8))
    m = (body | (dark & near)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # the biggest piece is the object
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n <= 1:
        return m
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    m = (lab == big).astype(np.uint8)
    # fill holes
    inv = 1 - m
    n2, lab2 = cv2.connectedComponents(inv)
    for i in range(1, n2):
        ys, xs = np.where(lab2 == i)
        if ys.min() > 0 and xs.min() > 0 and ys.max() < m.shape[0] - 1 and xs.max() < m.shape[1] - 1:
            m[lab2 == i] = 1
    return m


def cut(src, x0, y0, x1, y1, name, hue_lo=3, hue_hi=30, sat_min=35):
    img = read(src)[y0:y1, x0:x1]
    m = object_mask(img, hue_lo, hue_hi, sat_min)
    ys, xs = np.where(m > 0)
    a, b, c, d = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    alpha = cv2.GaussianBlur((m * 255).astype(np.uint8), (3, 3), 0)
    rgba[..., 3] = alpha
    out = rgba[a:b, c:d]
    os.makedirs(PROPS, exist_ok=True)
    p = os.path.join(PROPS, name + '.webp')
    cv2.imencode('.webp', out, [cv2.IMWRITE_WEBP_QUALITY, 96])[1].tofile(p)
    print('cut', name, out.shape[1], 'x', out.shape[0], '->', p)


def erase(src, out, boxes, hue_lo=3, hue_hi=30, sat_min=35):
    img = read(src)
    mask = np.zeros(img.shape[:2], np.uint8)
    for (x0, y0, x1, y1) in boxes:
        m = object_mask(img[y0:y1, x0:x1], hue_lo, hue_hi, sat_min)
        mask[y0:y1, x0:x1] |= m
    mask = cv2.dilate(mask * 255, np.ones((9, 9), np.uint8))
    res = cv2.inpaint(img, mask, 7, cv2.INPAINT_TELEA)
    cv2.imencode('.webp', res, [cv2.IMWRITE_WEBP_QUALITY, 96])[1].tofile(out)
    print('erase ->', out)


def key(src, name, bg='green'):
    """A prop the user made on a flat background (prompt: plain bright green; two came on black): the background
    keyed out, the green fringe on the edges pulled back to neutral, cropped to the object."""
    img = cv2.imdecode(np.fromfile(src, np.uint8), cv2.IMREAD_COLOR).astype(np.float32)
    b, g, r = img[..., 0], img[..., 1], img[..., 2]
    if bg == 'green':
        # how much greener than it is red or blue: the background is pure green, the object never is
        excess = g - np.maximum(r, b)
        alpha = np.clip(1 - (excess - 40) / 80, 0, 1)
        # spill: pull any leftover green down to the other two
        g2 = np.minimum(g, np.maximum(r, b) + 12)
        img[..., 1] = np.where(alpha < 1, g2, g)
    else:
        # black: only the black that reaches the picture's edge is background (the object's own dark wood and
        # shadows stay): the near-black region connected to the border, softened at its edge
        v = np.maximum(np.maximum(r, g), b)
        dark = (v < 34).astype(np.uint8)
        n, lab = cv2.connectedComponents(dark)
        h, w = dark.shape
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bgm = np.isin(lab, list(edge)).astype(np.float32)
        bgm = cv2.GaussianBlur(bgm, (5, 5), 0)
        alpha = 1 - bgm
    a8 = (alpha * 255).astype(np.uint8)
    a8 = cv2.morphologyEx(a8, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    ys, xs = np.where(a8 > 20)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = np.dstack([np.clip(img, 0, 255).astype(np.uint8), a8])[y0:y1, x0:x1]
    # a sensible size for the stage
    h, w = out.shape[:2]
    if max(h, w) > 900:
        f = 900 / max(h, w); out = cv2.resize(out, (int(w * f), int(h * f)), interpolation=cv2.INTER_AREA)
    p = os.path.join(PROPS, name + '.webp')
    cv2.imencode('.webp', out, [cv2.IMWRITE_WEBP_QUALITY, 95])[1].tofile(p)
    print('key', name, out.shape[1], 'x', out.shape[0], '->', p)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'cut':
        a = sys.argv[2:]
        extra = [int(x) for x in a[7:10]]
        cut(a[0], int(a[1]), int(a[2]), int(a[3]), int(a[4]), a[5], *extra)
    elif cmd == 'key':
        key(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else 'green')
    elif cmd == 'erase':
        a = sys.argv[2:]
        boxes = [tuple(int(v) for v in b.split(',')) for b in a[2:] if ',' in b]
        hue = [int(x) for x in a[2:] if ',' not in x]
        erase(a[0], a[1], boxes, *hue)
