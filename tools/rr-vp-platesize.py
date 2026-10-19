# Every Ridonculous Race plate's size: the viewer needs 1920x1080 at least (the user, 2026-10-19:
# "make sure the bg are fullhd at least").
#
#   python tools/rr-vp-platesize.py          (lists every plate, marks the small ones, exit 1 if any)
#   python tools/rr-vp-platesize.py --json   (the same as JSON, for the tests)
import os, sys, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = os.path.join(ROOT, 'assets', 'sets', 'rr')
SKIP_PREFIX = ('c-',)
SKIP = {'don.webp', 'plane.webp', 'logo.webp'}


def plates():
    for d in sorted(os.listdir(SETS)):
        folder = os.path.join(SETS, d)
        if not os.path.isdir(folder):
            continue
        for f in sorted(os.listdir(folder)):
            if not f.endswith('.webp') or f.startswith(SKIP_PREFIX) or f.endswith('-motion.webp') or f.endswith('-life.webp') or f in SKIP:
                continue
            p = os.path.join(folder, f)
            with Image.open(p) as im:
                yield d, f, im.size, os.path.getsize(p)


rows = list(plates())
small = [r for r in rows if r[2][0] < 1920 or r[2][1] < 1080]
if '--json' in sys.argv:
    print(json.dumps([{'dir': d, 'file': f, 'w': s[0], 'h': s[1], 'bytes': b} for d, f, s, b in rows]))
else:
    for d, f, s, b in rows:
        print(('SMALL ' if (s[0] < 1920 or s[1] < 1080) else '      ') + f'{d}/{f}  {s[0]}x{s[1]}  {b // 1024}KB')
    print(f'{len(rows)} plates, {len(small)} under 1920x1080')
sys.exit(1 if small else 0)
