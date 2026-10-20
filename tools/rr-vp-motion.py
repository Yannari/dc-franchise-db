# What may move on each Ridonculous Race plate, for js/vp-rr-ep/life.js.
#
# The user (2026-10-19): "the bg screen seem to be moving but not like normal lively bg its like its vibrating for no
# reason". The plates used to borrow Total Drama's shader and its motion maps were read off the paint with loose
# colour rules: every teal sign, every painted map on a museum wall, every green wall counted as water or leaves, and
# a fine ripple and a desert heat shimmer ran over them. Now a plate moves only where it really has water, leaves or
# lava, found strictly and checked by eye (the overrides below), and life.js moves it slowly.
#
# Per plate, beside it: <plate>-life.webp (640 x 360; R: leaves, G: water, B: lava), and the list of plates that have
# one in js/vp-rr-ep/life-have.js (a plate without one is simply the painted plate, under the camera's slow drift).
#
#   python tools/rr-vp-motion.py              (remakes every map and the list)
#   python tools/rr-vp-motion.py --sheet DIR  (and contact sheets of the masks over the plates, to look at)
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = os.path.join(ROOT, 'assets', 'sets', 'rr')
W, H = 640, 360

# checked by eye on the sheets (2026-10-19): what the colour rules get wrong
NO_WIND = {
    'home-city/task-9434876', 'home-city/task-9434855', 'home-city/task-9434868', 'treasure-isles/task-9449549',
    'treasure-isles/task-9449621', 'great-wall-hills/task-9440310', 'great-wall-hills/task-9440339',
    'great-wall-hills/task-9440338', 'rock-north/task-9441040', 'rock-north/task-9441025', 'rock-north/chill-9441059',
    'rock-north/chill-9441025', 'rock-north/task-9440800', 'red-sand-desert/task-9435869', 'torch-statue-harbour/task-22412320',
    'torch-statue-harbour/task-22412499', 'torch-statue-harbour/task-22412644', 'tomb-sands/task-22409957',
    'tomb-sands/task-22409944', 'tomb-sands/task-22409901', 'iron-tower-city/task-9436279', 'iron-tower-city/task-9436302',
    'iron-tower-city/task-9436198', 'skyline-finale/task-9450185', 'skyline-finale/task-9450269', 'skyline-finale/task-9450082',
    'red-outback/task-22419762', 'red-outback/task-22419761', 'red-outback/task-22419889',
    # green that is not leaves: a teal river, a park's lawn and hills
    'tomb-sands/task-22410534', 'tomb-sands/task-22410673', 'skyline-finale/chill-9450523', 'skyline-finale/task-9450434',
    'skyline-finale/chill-9450538', 'treasure-isles/task-9449576', 'treasure-isles/present-9449351',
}
NO_WATER = {
    'treasure-isles/task-9449549', 'treasure-isles/task-9449621', 'home-city/task-9434876', 'home-city/task-9434868',
    'home-city/task-9434810', 'great-wall-hills/arrive-9440243', 'great-wall-hills/task-9440310', 'rock-north/task-9441025',
    'rock-north/chill-9441025', 'torch-statue-harbour/task-22412320', 'red-sand-desert/task-9435484', 'savanna-falls/arrive-9441427',
    'treasure-isles/arrive-9449512', 'iron-tower-city/present-9436193', 'iron-tower-city/chill-9436288',
    'rock-north/present-9440796', 'rock-north/present-9440799', 'rock-north/task-9440922', 'rock-north/task-9440800',
}
# batch 1 of the 46 places (2026-10-19), checked by eye: grassy hills that are not leaves, blue mountains and ice that
# are not water
NO_WIND |= {'geyser-island/arrive-9436846', 'geyser-island/chill-9436909'}
NO_WATER |= {'geyser-island/task-9437322', 'geyser-island/task-9437332', 'geyser-island/task-9437548'}
# water the rule above cannot see (a deep sea that meets the sky, a waterfall, the steam of a geyser): within each box
# (fractions of the frame), the pixels of that hue
FORCE_WATER = {
    'coast-palace/task-9436629': [(0, .48, 1, 1, 190, 236)], 'coast-palace/task-9436826': [(0, .6, 1, 1, 190, 236)],
    'coast-palace/arrive-9436638': [(0, .55, 1, 1, 190, 236)], 'coast-palace/present-9436927': [(0, .1, .5, 1, 190, 236)],
    'coast-palace/travel-9436860': [(0, .5, 1, 1, 190, 236)], 'coast-palace/chill-9436953': [(0, .78, 1, 1, 190, 236)],
    'coast-palace/arrive-9436621': [(0, .38, .52, .6, 190, 236)],
    'carnival-rainforest/task-9437835': [(.44, .36, .58, 1, 160, 200)],
    'geyser-island/task-9437137': [(.04, 0, .68, .72, 160, 200)],
}
# batch 2: hills and a tennis court that are not leaves; a glass dome, a blue tree and blue mountains that are not water
NO_WIND |= {'lei-island/arrive-9439038', 'lei-island/chill-9439397', 'lei-island/task-9439223', 'glass-tower-gulf/task-9439713',
            'swamp-prison/task-9442380', 'outback-farm/present-9442909'}
NO_WATER |= {'glass-tower-gulf/travel-9439785', 'swamp-prison/present-9442102', 'outback-farm/travel-9443065',
             'glass-tower-gulf/task-9439718', 'swamp-prison/chill-9442555'}
NO_WIND |= {'lei-island/chill-9439226'}
FORCE_WATER.update({
    'lei-island/task-9439101': [(0, .35, 1, 1, 160, 200)], 'glass-tower-gulf/task-9439713': [(0, 0, 1, 1, 165, 200)],
    'swamp-prison/task-9442410': [(0, .22, 1, 1, 160, 200)],
    'swamp-prison/chill-9442555': [(0, .76, 1, 1, 160, 215)],
})
# from batch 3 on, the colour rule for leaves is off: in these plates green is mostly hills and lawns. A plate's leaves
# move only when it is listed here (checked by eye)
STRICT_WIND = {'fjord-peaks', 'prairie-ranch', 'ice-floe', 'dragon-isle', 'neon-desert', 'pyramid-coast', 'stilt-river', 'frozen-mine',
               'tea-hills', 'pampas-ranch', 'game-show-city', 'ice-river', 'snow-peaks', 'jungle-ruins', 'glass-pyramid-city', 'fishing-cove',
               'cliff-pool-isle', 'twin-tower-bridge', 'marble-temple-hill', 'secret-base-desert', 'fjord-sea', 'great-falls',
               'bamboo-wall-hills', 'grass-savanna', 'stone-head-island', 'badlands'}
YES_WIND = {'dragon-isle/task-9445496'}
NO_WATER |= {'prairie-ranch/present-9444391', 'ice-floe/arrive-9444551'}
# (a 7th number: the darkest the water is, so the ice's pale blue stays still)
FORCE_WATER.update({'ice-floe/task-9444731': [(0, .5, 1, .9, 205, 245, .45)], 'ice-floe/task-9444616': [(0, .5, 1, .95, 205, 245, .45)],
                    'ice-floe/present-9445072': [(0, .5, 1, .9, 205, 245, .45)]})
# batch 4: ice and windows that are not water; the stilt river, the cove under the cliff
NO_WATER |= {'frozen-mine/arrive-9447691', 'frozen-mine/task-9447678', 'frozen-mine/task-9447861', 'frozen-mine/present-9447601'}
FORCE_WATER.update({'stilt-river/present-9447233': [(0, .74, 1, 1, 150, 200)], 'stilt-river/task-9447243': [(0, .4, 1, .75, 150, 200)],
                    'pyramid-coast/task-9446588': [(0, 0, 1, .72, 160, 200)], 'neon-desert/task-9446121': [(.4, .75, 1, .95, 170, 200)]})
# batch 5: blue mountains are not water; the river and the floes are
NO_WATER |= {'tea-hills/present-9448248', 'tea-hills/present-9448586'}
FORCE_WATER.update({'ice-river/task-22411646': [(0, 0, 1, 1, 185, 215, .75)], 'ice-river/task-22412146': [(0, 0, 1, 1, 185, 215, .75)]})
# batch 6: the sea at the cove, the jungle river
FORCE_WATER.update({'fishing-cove/task-22415657': [(0, .3, 1, 1, 180, 215)], 'fishing-cove/task-22415659': [(0, .38, 1, 1, 180, 215)],
                    'fishing-cove/task-22415709': [(0, .3, 1, 1, 180, 215)], 'fishing-cove/chill-22416099': [(.55, .55, 1, 1, 195, 225)],
                    'jungle-ruins/task-22414389': [(0, 0, 1, 1, 150, 190)], 'jungle-ruins/task-22414359': [(0, .3, .7, 1, 160, 195)]})
# batch 7: the lagoon, the falls, the pool, the sea behind the bobsled track
FORCE_WATER.update({'cliff-pool-isle/task-22416440': [(0, .2, 1, 1, 170, 200)], 'cliff-pool-isle/present-22416327': [(.2, .4, 1, 1, 170, 200)],
                    'cliff-pool-isle/present-22416412': [(.2, .4, 1, 1, 170, 200)], 'cliff-pool-isle/chill-22416513': [(.15, .2, .85, .85, 170, 205)],
                    'cliff-pool-isle/task-22416594': [(0, 0, 1, 1, 170, 200)], 'cliff-pool-isle/arrive-22416267': [(0, .4, .7, .7, 170, 200)]})
NO_WIND |= {'cliff-pool-isle/chill-22416513', 'cliff-pool-isle/task-22416652', 'marble-temple-hill/chill-22418530'}
NO_WATER |= {'secret-base-desert/present-22418960'}
# batch 8: the swan-boat water and the falls behind the tightrope
FORCE_WATER.update({'great-falls/task-22421517': [(0, .4, 1, 1, 165, 200)], 'great-falls/task-22421939': [(0, 0, 1, 1, 165, 200)]})
LAVA_PLACES = {'fire-mountain-isle'}
SKIP = {'confess', 'worldmap', 'gate', 'cabin', 'galley', 'logo', 'sky', 'runway', 'don', 'plane'}


def hsv(im):
    a = np.asarray(im.convert('HSV'), dtype=np.float32) / 255.0
    return a[..., 0] * 360, a[..., 1], a[..., 2]


def big(mask, frac):
    """Only the connected regions larger than `frac` of the frame (a sea, a canopy; not a sign or a map on a wall)."""
    lab, n = ndimage.label(mask)
    if not n:
        return mask & False
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes > frac * mask.size
    return keep[lab]


def soft(mask, r=4):
    img = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(img, dtype=np.float32) / 255.0


def life(path, key, place):
    im = Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)
    h, s, v = hsv(im)
    y = np.linspace(0, 1, H)[:, None] * np.ones((1, W))
    wind = np.zeros((H, W), bool)
    if key not in NO_WIND and (place not in STRICT_WIND or key in YES_WIND):
        leaves = (h > 70) & (h < 160) & (s > .3) & (v > .2) & (y < .78)
        wind = big(leaves, .006)
    water = np.zeros((H, W), bool)
    if key not in NO_WATER:
        # water lies under a horizon: a blue region that reaches up into the top of the frame is sky (or a wall)
        wet = (h > 168) & (h < 212) & (s > .42) & (v > .3)
        lab, n = ndimage.label(wet)
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            if sl[0].start < .36 * H:
                wet[lab == i] = False
        water = big(wet, .02)
    for x0, y0, x1, y1, h0, h1, *vmax in FORCE_WATER.get(key, []):
        box = np.zeros((H, W), bool)
        box[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = True
        water |= box & (h > h0) & (h < h1) & (s > .25) & (v > (.1 if vmax else .25)) & (v < (vmax[0] if vmax else 2))
    lava = np.zeros((H, W), bool)
    if place in LAVA_PLACES:
        lava = big((h < 36) & (s > .7) & (v > .78), .004)
    out = np.dstack([soft(wind) * (0.35 + 0.65 * (1 - y)), soft(water, 3), soft(lava, 3)])
    has = {'wind': bool(wind.mean() > .004), 'water': bool(water.mean() > .01), 'lava': bool(lava.mean() > .003)}
    return out, has


def main():
    have = {}
    rows = []
    for d in sorted(os.listdir(SETS)):
        folder = os.path.join(SETS, d)
        if not os.path.isdir(folder) or d == 'race':
            continue
        for f in sorted(os.listdir(folder)):
            if not f.endswith('.webp') or f.startswith('c-') or f.endswith('-motion.webp') or f.endswith('-life.webp'):
                continue
            stem = f[:-5]
            key = f'{d}/{stem}'
            if stem in SKIP:
                continue
            out, has = life(os.path.join(folder, f), key, d)
            dst = os.path.join(folder, stem + '-life.webp')
            if any(has.values()):
                Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)).save(dst, 'WEBP', quality=80)
                have[f'assets/sets/rr/{key}.webp'] = [k for k, x in has.items() if x]
            elif os.path.exists(dst):
                os.remove(dst)
            rows.append((key, has, out))
    js = ('// Made by tools/rr-vp-motion.py: the plates with something that moves (leaves, water, lava) and so a\n'
          '// <plate>-life.webp map beside them. Every other plate is the painted plate under the camera\'s slow drift.\n'
          'export const LIFE = ' + json.dumps(have, indent=1) + ';\n')
    open(os.path.join(ROOT, 'js', 'vp-rr-ep', 'life-have.js'), 'w', encoding='utf8', newline='\n').write(js)
    print(f'{len(have)} of {len(rows)} plates move')
    if '--sheet' in sys.argv:
        sheet_dir = sys.argv[sys.argv.index('--sheet') + 1]
        os.makedirs(sheet_dir, exist_ok=True)
        tiles = []
        for key, has, out in rows:
            im = Image.open(os.path.join(SETS, key + '.webp')).convert('RGB').resize((W // 2 * 2 // 2 * 1, H // 2 * 2 // 2 * 1))
            base = np.asarray(Image.open(os.path.join(SETS, key + '.webp')).convert('RGB').resize((W, H)), dtype=np.float32)
            tint = base.copy()
            tint = tint * (1 - .6 * out[..., :1]) + np.array([40, 255, 40]) * .6 * out[..., :1]
            tint = tint * (1 - .6 * out[..., 1:2]) + np.array([40, 120, 255]) * .6 * out[..., 1:2]
            tint = tint * (1 - .6 * out[..., 2:3]) + np.array([255, 30, 30]) * .6 * out[..., 2:3]
            tiles.append((key, Image.fromarray(np.clip(tint, 0, 255).astype(np.uint8))))
            del im
        cols, per = 4, 24
        for p in range(0, len(tiles), per):
            chunk = tiles[p:p + per]
            sheet = Image.new('RGB', (cols * W // 2, ((len(chunk) + cols - 1) // cols) * (H // 2 + 16)), (20, 20, 30))
            from PIL import ImageDraw
            dr = ImageDraw.Draw(sheet)
            for i, (key, t) in enumerate(chunk):
                x0, y0 = (i % cols) * W // 2, (i // cols) * (H // 2 + 16)
                sheet.paste(t.resize((W // 2, H // 2)), (x0, y0))
                dr.text((x0 + 4, y0 + H // 2 + 2), key, fill=(255, 230, 120))
            sheet.save(os.path.join(sheet_dir, f'life-{p // per}.jpg'), quality=80)


if __name__ == '__main__':
    main()
