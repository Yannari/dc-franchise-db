# Motion maps for the Ridonculous Race plates, so js/vp-td-ep/glplate.js can bring them alive.
#
# Total Drama's plates have hand-made motion maps; these are read off the paint itself:
#   wind  (R of the top third)    foliage: greens, strongest high in the frame (leaves, palms, fronds)
#   water (G of the top third)    saturated teal/blue below the horizon (sea, lagoon, river, the pool)
#   heat  (G of the middle third) lava and fire: hot saturated orange (it licks and shimmers)
#   lights(B of the middle third) small bright warm spots on a dark plate (lamps, windows at night)
#   sky   (R of the bottom third) left 0: the plate keeps its own painted sky (nothing under it)
# One map per plate, beside it: <plate>-motion.webp, 640 x 1080 (three 640 x 360 maps stacked).
#
#   python tools/rr-vp-motion.py            (makes what is missing; --force remakes all)
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = os.path.join(ROOT, 'assets', 'sets', 'rr')
force = '--force' in sys.argv
W, H = 640, 360
# plates whose blue is sky or a painted wall, never water
NO_WATER = {'confess', 'worldmap', 'gate', 'cabin', 'galley', 'logo'}


def hsv(im):
    a = np.asarray(im.convert('HSV'), dtype=np.float32) / 255.0
    return a[..., 0] * 360, a[..., 1], a[..., 2]


def soft(mask, r=3):
    img = Image.fromarray(np.clip(mask * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(img, dtype=np.float32) / 255.0


def motion(path):
    stem = os.path.basename(path)[:-5]
    im = Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)
    h, s, v = hsv(im)
    y = np.linspace(0, 1, H)[:, None] * np.ones((1, W))
    wind = ((h > 70) & (h < 165) & (s > .28) & (v > .18)).astype(np.float32) * (0.35 + 0.65 * (1 - y))
    water = np.zeros_like(wind)
    if stem not in NO_WATER:
        # below the horizon only (above it the same blue is the sky)
        water = ((h > 165) & (h < 215) & (s > .32) & (v > .3)).astype(np.float32) * np.clip((y - .38) / .12, 0, 1)
    heat = ((h < 38) & (s > .62) & (v > .72)).astype(np.float32)
    dark = v.mean() < .38
    lights = ((h > 30) & (h < 65) & (s > .45) & (v > .85)).astype(np.float32) if dark else np.zeros_like(wind)
    top = np.dstack([soft(wind) * .9, soft(water, 2) * .85, np.zeros_like(wind)])
    mid = np.dstack([np.zeros_like(wind), soft(heat, 2) * .9, soft(lights, 1.5)])
    bot = np.zeros_like(top)
    out = np.vstack([top, mid, bot])
    Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)).save(os.path.join(os.path.dirname(path), stem + '-motion.webp'), 'WEBP', quality=70)
    return True


made = 0
for d in sorted(os.listdir(SETS)):
    folder = os.path.join(SETS, d)
    for f in sorted(os.listdir(folder)):
        if not f.endswith('.webp') or f.startswith('c-') or f.endswith('-motion.webp') or f in ('don.webp', 'plane.webp', 'logo.webp'):
            continue
        out = os.path.join(folder, f[:-5] + '-motion.webp')
        if os.path.exists(out) and not force:
            continue
        made += motion(os.path.join(folder, f))
print('made', made)
