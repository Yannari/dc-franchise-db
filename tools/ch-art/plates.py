"""tools/ch-art/plates.py — The Challenge's plates: the user's painted sets, cleaned, lit for night, marked.

    python tools/ch-art/plates.py import             copy each place's `from` (the user's result in
                                                     Downloads/Challenge-art/to-edit) to src/<name>.webp
    python tools/ch-art/plates.py night [name ...]   write src/<name>-night.webp for each place with
                                                     "night": "auto" (never over one that exists
                                                     without --force: a night the user painted wins)
    python tools/ch-art/plates.py build [name ...]   clean + motion map + marks into assets/sets/ch
    python tools/ch-art/plates.py grid  [name ...]   src/<name>.webp with the 1600x900 reference grid,
                                                     to read mark coordinates from (scratch, not kept)

Places live in tools/ch-art/places.json. It is Total Drama's pipeline (tools/td-camp/clean.py:
Real-ESRGAN to 4K, clouds lifted to sprites, the motion map the viewer's shader reads; nightify.py:
the painted frame repainted for night) pointed at this show's folders, with the marks written by
hand instead of projected from a Blender scene: the sets are 2D paintings, so the marks are read off
the painting. Coordinates are the 1600x900 reference pixels every TD plate mark uses.

Writes, per place and hour (<spot> and <hour> from places.json):
  assets/sets/ch/<spot>-<hour>.webp (1920x1080), -hd.webp (3840x2160), -motion.webp, -water.webp
  assets/sets/ch/<spot>-<hour>.json (marks), assets/sets/ch/sprites/ch-<name>-<k>.webp (clouds)
  js/vp-ch-ep/marks.js (every plate's marks, one module, so the viewer paints without a fetch)
"""
import os, sys, json, glob

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, 'tools', 'td-camp'))
import numpy as np
import cv2
import clean as C
import nightify as N

SRC = os.path.join(HERE, 'src')
CUTS = os.path.join(HERE, 'cuts')                    # gitignored: regenerable
OUT = os.path.join(REPO, 'assets', 'sets', 'ch')
SPRITES = os.path.join(OUT, 'sprites')
JOBS = os.environ.get('CH_ART', os.path.join(os.path.expanduser('~'), 'Downloads', 'Challenge-art', 'to-edit'))
PLACES = os.path.join(HERE, 'places.json')


def places():
    return {k: v for k, v in json.load(open(PLACES, encoding='utf-8')).items() if not k.startswith('_')}


def read(path):
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f'cannot read {path}')
    return img


def write(path, img, q=94):
    ext = os.path.splitext(path)[1]
    args = [cv2.IMWRITE_WEBP_QUALITY, q] if ext == '.webp' else []
    cv2.imencode(ext, img, args)[1].tofile(path)


def unletterbox(img):
    """Cut the black bars an image tool leaves round a picture (top, bottom or sides). A bar is flat
    black (the Arena's: mean 0.1, spread 0.3); a painted black silhouette at the edge (the airstrip's
    palm) is near-black but not flat (mean 2, spread 3.7), and stays."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    h, w = g.shape
    dark_row = ((g < 8).mean(axis=1) > .99) & (g.std(axis=1) < 1.5)
    dark_col = ((g < 8).mean(axis=0) > .99) & (g.std(axis=0) < 1.5)
    y0 = 0
    while y0 < h // 4 and dark_row[y0]: y0 += 1
    y1 = h
    while y1 > 3 * h // 4 and dark_row[y1 - 1]: y1 -= 1
    x0 = 0
    while x0 < w // 4 and dark_col[x0]: x0 += 1
    x1 = w
    while x1 > 3 * w // 4 and dark_col[x1 - 1]: x1 -= 1
    # a pixel or two of the bar's soft edge
    pad = 2 if (y0, y1, x0, x1) != (0, h, 0, w) else 0
    return img[y0 + pad if y0 else 0:y1 - pad if y1 < h else h, x0 + pad if x0 else 0:x1 - pad if x1 < w else w]


def do_import(P):
    os.makedirs(SRC, exist_ok=True)
    for name, p in P.items():
        for hour, rel in (('', p.get('from')), ('-night', p.get('from_night'))):
            if not rel:
                continue
            img = C.crop_169(unletterbox(read(os.path.join(JOBS, rel))), p.get('anchor', .5))
            write(os.path.join(SRC, f'{name}{hour}.webp'), img, 96)
            print('import', name + hour, img.shape[1], 'x', img.shape[0])


def do_night(P, names, force):
    N.SRC = SRC
    for n in names:
        p = P[n]
        if p.get('night') != 'auto':
            continue
        if os.path.exists(os.path.join(SRC, f'{n}-night.webp')) and not force:
            print(f'{n}: a night frame exists, kept (--force to repaint)'); continue
        print('night', N.nightify(n, dict(p, src=f'{n}.webp')))


def ref_marks(p, night):
    """places.json marks (reference px) as frame fractions, in the TD marks shape."""
    k = 1 / 1600.0, 1 / 900.0
    out = []
    for m in p.get('marks', []):
        if m.get('hour') and m['hour'] != ('night' if night else 'day'):
            continue
        d = {kk: v for kk, v in m.items() if kk not in ('x', 'y', 'h', 'hour')}
        d['u'] = round(m['x'] * k[0], 4); d['v'] = round(m['y'] * k[1], 4)
        if 'h' in m:
            d['s'] = round(m['h'] * k[1], 4)        # the frame height one metre takes there
        out.append(d)
    for (x, foot, fh) in p.get('fire', []):
        out.append({'kind': 'fire', 'painted': 1, 'u': round(x / 1600, 4), 'v': round(foot / 900, 4), 'fh': round(fh / 900, 4)})
    for b in p.get('pool', []):
        out.append({'kind': 'pool', 'u0': b[0] / 1600, 'v0': b[1] / 900, 'u1': b[2] / 1600, 'v1': b[3] / 900, 'fish': bool(b[4]),
                    'u': round((b[0] + b[2]) / 3200, 4), 'v': round((b[1] + b[3]) / 1800, 4)})
    for b in p.get('fall', []):
        out.append({'kind': 'fall', 'u0': b[0] / 1600, 'v0': b[1] / 900, 'u1': b[2] / 1600, 'v1': b[3] / 900,
                    'u': round((b[0] + b[2]) / 3200, 4), 'v': round((b[1] + b[3]) / 1800, 4)})
    for c in p.get('critters', []):
        out.append({'kind': 'critter', 'what': c[0], 'u0': c[1] / 1600, 'v0': c[2] / 900, 'u1': c[3] / 1600, 'v1': c[4] / 900,
                    'u': round((c[1] + c[3]) / 3200, 4), 'v': round((c[2] + c[4]) / 1800, 4)})
    return out


def build_one(name, p, hour):
    """One hour of one place: src/<name>[-night].webp -> assets/sets/ch/<spot>-<hour>.*"""
    night = hour == 'night'
    src = os.path.join(SRC, f'{name}-night.webp' if night and p.get('night') else f'{name}.webp')
    P = dict(p, night=night)
    img = C.sharpen_4k(src)
    base = img.copy()
    sky, rowcol = C.sky_of(img) if not P.get('nosky') else (np.zeros(img.shape[:2], bool), None)
    C.SPRITES = SPRITES
    os.makedirs(SPRITES, exist_ok=True)
    tag = f'{name}-{hour}'
    for f in glob.glob(os.path.join(SPRITES, f'tr-{tag}-*.webp')) + glob.glob(os.path.join(SPRITES, f'ch-{tag}-*.webp')):
        os.remove(f)
    C.P_RING[0] = P.get('cloudring', 0.93)
    clouds = [] if night or P.get('noclouds') else C.lift_clouds(img, base, sky, rowcol, tag, 0)
    for c in clouds:                        # clean.py names them tr-*, the TD sprite prefix
        new = 'ch-' + c['sprite'][3:]
        os.replace(os.path.join(SPRITES, c['sprite'] + '.webp'), os.path.join(SPRITES, new + '.webp'))
        c['sprite'] = new
    os.makedirs(CUTS, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    stem = os.path.join(OUT, f"{p['spot']}-{hour}")
    write(stem + '-hd.webp', base, 92)
    write(stem + '.webp', cv2.resize(base, (1920, 1080), interpolation=cv2.INTER_AREA), 92)
    mo = C.motion_map(base, P)
    if night and p.get('from') and p.get('night') in ('auto', 'painted') and 'day' in hours(p):
        # the night frame is the day's painting (repainted, or painted again on the same layout): its
        # water and leaves are where the day's are, and in the dark the water's colour runs into the
        # rim and the jungle (the hot tub's mask took the whole deck). The wind / water / fall panel
        # comes from the day; the lights and flames stay the night's own.
        day = C.motion_map(C.sharpen_4k(os.path.join(SRC, f'{name}.webp')), dict(p, night=False))
        mo = np.vstack([day[:540], mo[540:]])
    write(stem + '-motion.webp', mo, 90)
    if P.get('pool'):
        a = cv2.threshold(mo[:540, :, 1], 40, 255, cv2.THRESH_BINARY)[1]
        write(stem + '-water.webp', np.dstack([np.full_like(a, 255)] * 3 + [cv2.GaussianBlur(a, (0, 0), 1)]), 90)
    elif os.path.exists(stem + '-water.webp'):
        os.remove(stem + '-water.webp')
    marks = []
    if P.get('pool') or P.get('fall') or not night:
        marks.append({'kind': 'motion', 'water': 1 if P.get('pool') or P.get('fall') else 0, 'u': .5, 'v': .5})
    for c in clouds:
        marks.append({'kind': 'cloud', 'size': 1.0, 'sprite': c['sprite'], 'w': round(c['w'] / 1600, 4),
                      'u': round(c['x'] / 1600, 4), 'v': round(c['y'] / 900, 4)})
    marks += ref_marks(p, night)
    json.dump({'horizon': p.get('horizon', .5), 'marks': marks}, open(stem + '.json', 'w', encoding='utf-8'))
    print('build', tag, '->', os.path.relpath(stem, REPO), len(clouds), 'clouds', len(marks), 'marks')


def hours(p):
    return [h for h in ('day', 'night') if h in p.get('hours', ['day', 'night'])]


def write_bundle():
    data = {}
    for f in sorted(glob.glob(os.path.join(OUT, '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        data[os.path.splitext(os.path.basename(f))[0]] = {'h': d['horizon'], 'm': d['marks']}
    out = os.path.join(REPO, 'js', 'vp-ch-ep', 'marks.js')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('// GENERATED by tools/ch-art/plates.py (write_bundle) — do not edit by hand.\n')
        fh.write("// Every Challenge plate's marks, keyed <spot>-<hour>: where people stand, the podiums, the\n")
        fh.write('// house, the host, the fires, the water, as fractions of the frame (u from the left, v from\n')
        fh.write('// the top; s = the frame height one metre takes at that depth). Same shape as TD_MARKS.\n')
        fh.write('export const CH_MARKS = ' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('MARKS', os.path.relpath(out, REPO), len(data))


def do_grid(P, names, out_dir):
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype('arial.ttf', 16)
    os.makedirs(out_dir, exist_ok=True)
    for n in names:
        for hour in ('', '-night'):
            path = os.path.join(SRC, f'{n}{hour}.webp')
            if not os.path.exists(path):
                continue
            im = Image.open(path).convert('RGB').resize((1600, 900)); d = ImageDraw.Draw(im)
            for x in range(0, 1600, 50):
                d.line([(x, 0), (x, 900)], fill=(255, 0, 0) if x % 500 == 0 else (255, 255, 0) if x % 100 == 0 else (120, 120, 120), width=1)
                if x % 100 == 0: d.text((x + 2, 2), str(x), fill='white', font=f, stroke_width=2, stroke_fill='black')
            for y in range(0, 900, 50):
                d.line([(0, y), (1600, y)], fill=(255, 0, 0) if y % 500 == 0 else (255, 255, 0) if y % 100 == 0 else (120, 120, 120), width=1)
                if y % 100 == 0: d.text((2, y + 2), str(y), fill='white', font=f, stroke_width=2, stroke_fill='black')
            for m in P[n].get('marks', []):
                r = 7
                d.ellipse([m['x'] - r, m['y'] - r, m['x'] + r, m['y'] + r], outline=(0, 255, 255), width=3)
                if 'h' in m:                       # a person's height there (1.75 m)
                    d.line([(m['x'], m['y']), (m['x'], m['y'] - m['h'] * 1.75)], fill=(0, 255, 255), width=3)
                d.text((m['x'] + 9, m['y'] - 8), m['kind'], fill='cyan', font=f, stroke_width=2, stroke_fill='black')
            im.save(os.path.join(out_dir, f'{n}{hour}.png'))
    print('grid ->', out_dir)


if __name__ == '__main__':
    P = places()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'build'
    names = [a for a in sys.argv[2:] if not a.startswith('--')] or list(P)
    if cmd == 'import':
        do_import({n: P[n] for n in names})
    elif cmd == 'night':
        do_night(P, names, '--force' in sys.argv)
    elif cmd == 'grid':
        do_grid(P, names, os.environ.get('CH_GRID', os.path.join(CUTS, 'grid')))
    elif cmd == 'build':
        for n in names:
            for h in hours(P[n]):
                build_one(n, P[n], h)
        write_bundle()
    else:
        raise SystemExit(__doc__)
