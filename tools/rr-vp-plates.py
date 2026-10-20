# The Ridonculous Race viewer's art: the plates and cut-outs js/vp-rr-ep/plates.js names,
# copied from the user's edits into assets/sets/rr/<place>/ as webp (1920 wide plates,
# cut-outs up to 1280 wide, quality 92: 2026-10-20, 640 wide at 80 was soft), plus the race-wide pieces from mockup/rr-leg/.
#
#   node tools/rr-vp-plates.mjs > need.json      (what plates.js asks for)
#   python tools/rr-vp-plates.py need.json       (copies what is missing; --force redoes all)
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(os.path.expanduser('~'), 'Downloads', 'RidonculousRace-frames', 'done')
OUT = os.path.join(ROOT, 'assets', 'sets', 'rr')
MOCK = os.path.join(ROOT, 'mockup', 'rr-leg')
force = '--force' in sys.argv


def find(folder, stem):
    for ext in ('.png', '.jpg', '.webp'):
        f = os.path.join(folder, stem + ext)
        if os.path.exists(f):
            return f
    return None


def save(src, dst, width, quality, alpha=False):
    if os.path.exists(dst) and not force:
        return False
    im = Image.open(src)
    im = im.convert('RGBA' if alpha or im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if alpha and im.mode == 'RGBA' and im.split()[-1].getbbox():
        im = im.crop(im.split()[-1].getbbox())     # a cut-out is drawn at its width: no empty margin around it
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=6)
    return True


need = json.load(open(sys.argv[1], encoding='utf8'))
made, missing = 0, []
for pid, p in need['places'].items():
    folder = os.path.join(FRAMES, p['src'])
    for stem, slug in p['files']:
        src = find(folder, stem)
        if not src:
            missing.append(f'{pid}/{stem}')
            continue
        made += save(src, os.path.join(OUT, pid, slug + '.webp'), 1920, 92)
    for key, stem in p['props']:
        src = find(os.path.join(folder, 'cutout'), stem)
        if not src:
            missing.append(f'{pid}/cutout/{stem}')
            continue
        made += save(src, os.path.join(OUT, pid, 'c-' + key + '.webp'), 1280, 92, alpha=True)
for stem in need['race']:
    src = find(MOCK, stem) or find(os.path.join(MOCK, 'p'), stem)
    if not src:
        missing.append(f'race/{stem}')
        continue
    big = stem in ('gate', 'cabin', 'galley', 'sky', 'runway', 'worldmap', 'confess')
    made += save(src, os.path.join(OUT, 'race', stem + '.webp'), 1920 if big else 900, 74 if big else 82,
                 alpha=not big)
print('made', made, 'missing', missing)
