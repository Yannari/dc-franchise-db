# Every Ridonculous Race plate at Full HD at least (the user, 2026-10-19: "make sure the bg are fullhd at least").
#
# A plate is remade from the user's edited frame (Downloads/RidonculousRace-frames/done/<nn-place>/<stem>.png):
#   * a frame under 1920 x 1080 goes through Real-ESRGAN's anime model x4 first (realesrgan-ncnn-vulkan on the GPU,
#     the one tools/td-camp/clean.py uses: set ESRGAN to its folder, default %TEMP%/esr), then down to 1920 x 1080;
#   * a frame that is not 16:9 is cropped to it around its centre (never stretched);
#   * CROP below takes a stray edge off a frame (a person cut by the frame's edge) before that.
# Saved as webp at quality 84 (painted plates stay well under 150 KB).
#
#   node tools/rr-vp-plate-roles.mjs > roles.json
#   python tools/rr-vp-upscale.py roles.json            (the plates under 1920 x 1080, and those in CROP)
#   python tools/rr-vp-upscale.py roles.json --all      (every plate in use)
import json, os, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(os.path.expanduser('~'), 'Downloads', 'RidonculousRace-frames', 'done')
ESRGAN = os.environ.get('ESRGAN', os.path.join(tempfile.gettempdir(), 'esr'))
W, H = 1920, 1080
# fraction of the frame to take off each side (left, top, right, bottom) before the 16:9 crop
CROP = {
    'red-outback/task-22419889': (0.035, 0.0, 0.0, 0.0),     # somebody's legs at the left edge
    'lei-island/task-9439428': (0.0, 0.0, 0.1, 0.0),          # somebody's legs at the right edge
    'great-falls/task-22421939': (0.0, 0.5, 0.0, 0.0),        # the tightrope sits under the dialogue bar: bring it up
}


def src_dir(place_src):
    return os.path.join(FRAMES, place_src)


def find(folder, stem):
    for ext in ('.png', '.jpg', '.webp'):
        f = os.path.join(folder, stem + ext)
        if os.path.exists(f):
            return f
    return None


def esrgan(src):
    out = os.path.join(tempfile.gettempdir(), 'rr-esr-' + os.path.basename(src).rsplit('.', 1)[0] + '.png')
    png = src
    if not src.lower().endswith('.png'):
        png = out.replace('.png', '-in.png')
        Image.open(src).convert('RGB').save(png)
    subprocess.run([os.path.join(ESRGAN, 'realesrgan-ncnn-vulkan.exe'), '-i', png, '-o', out, '-n', 'realesrgan-x4plus-anime'],
                   check=True, capture_output=True, cwd=ESRGAN)
    return out


# touch-ups on the finished 1920 x 1080 plate (pixel boxes on it), checked by eye:
#   ('rowfill', box)                      a stray figure on flat ground painted out: each row of the box takes the
#                                         colour just left of it (the ground's bands run across the frame)
#   ('plain', box, sample)                a flag's stripes made one plain colour (the colour at `sample`): no real
#                                         country's flag on screen
FIX = {
    'geyser-island/task-9437322': [('rowfill', (1540, 822, 1579, 916))],   # a Don Box figurine on the helipad: the viewer draws its own
    'haunted-castle/task-9438652': [('plain', (800, 280, 1172, 502), (1100, 380))],   # a tricolour on the gym's tent
}


def touch_up(im, key):
    for op in FIX.get(key, []):
        if op[0] == 'rowfill':
            x0, y0, x1, y1 = op[1]
            px = im.load()
            for y in range(y0, y1):
                c = px[x0 - 3, y]
                for x in range(x0, x1):
                    px[x, y] = c
        elif op[0] == 'plain':
            x0, y0, x1, y1 = op[1]
            c = im.getpixel(op[2])
            px = im.load()
            for y in range(y0, y1):
                for x in range(x0, x1):
                    r, g, b = px[x, y]
                    # the stripes, not the black hem or the dividers between them
                    if max(r, g, b) > 45:
                        px[x, y] = c
    return im


def to_plate(im, key):
    l, t, r, b = CROP.get(key, (0, 0, 0, 0))
    w, h = im.size
    im = im.crop((round(w * l), round(h * t), round(w * (1 - r)), round(h * (1 - b))))
    w, h = im.size
    # centre crop to 16:9
    if w / h > 16 / 9:
        nw = round(h * 16 / 9); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
    else:
        nh = round(w * 9 / 16); y = (h - nh) // 2; im = im.crop((0, y, w, y + nh))
    return touch_up(im.resize((W, H), Image.LANCZOS), key)


def main():
    rows = json.load(open(sys.argv[1], encoding='utf8'))
    from importlib import util
    srcs = json.loads(subprocess.run(['node', '-e', "import('./js/vp-rr-ep/plates.js').then(m=>console.log(JSON.stringify(Object.fromEntries(Object.entries(m.PLACE_PLATES).map(([k,v])=>[k,v.src])))))"],
                                     cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    every = '--all' in sys.argv
    done = []
    for r in rows:
        if r['place'] == 'race':
            continue
        dst = os.path.join(ROOT, r['url'])
        key = f"{r['place']}/{r['slug']}"
        cur = Image.open(dst).size if os.path.exists(dst) else (0, 0)
        if not every and cur[0] >= W and cur[1] >= H and key not in CROP:
            continue
        src = find(src_dir(srcs[r['place']]), r['f'])
        if not src:
            print('no source for', key); continue
        im = Image.open(src).convert('RGB')
        if im.width < W or im.height < H:
            im = Image.open(esrgan(src)).convert('RGB')
        to_plate(im, key).save(dst, 'WEBP', quality=84, method=6)
        done.append((key, os.path.getsize(dst) // 1024))
    for k, kb in done:
        print(f'{k}  {kb} KB')
    print(len(done), 'plates remade')


if __name__ == '__main__':
    main()
