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
    return im.resize((W, H), Image.LANCZOS)


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
