# The race's repainted plates: from the user's frames to the viewer, in one command.
#
# Some plates were out of use (tools/rr-vp-jobs.json: no ground to stand on, or not reading as the place). Each is a job
# in the user's frames workflow: the frame in Downloads/RidonculousRace-frames/edit/<src>/ with that place's
# prompt.txt; the repaint comes back into done/<src>/ with the SAME file name. This notices it (the done/ file no longer
# matches the original's sha256), makes the plate from it (tools/rr-vp-upscale.py: ESRGAN when small, 16:9, 1920 x 1080
# webp), lists it in js/vp-rr-ep/repainted.js (plates.js then shoots on it instead of its stand-in), and remakes the
# plates' life maps (tools/rr-vp-motion.py).
#
#   python tools/rr-vp-repaints.py           (what came back; prints what it switched on)
#   python tools/rr-vp-repaints.py --jobs    (set up: record the originals' sha256 and copy them into edit/ once)
import hashlib, importlib.util, json, os, shutil, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(os.path.expanduser('~'), 'Downloads', 'RidonculousRace-frames')
JOBS = os.path.join(ROOT, 'tools', 'rr-vp-jobs.json')
OUT_JS = os.path.join(ROOT, 'js', 'vp-rr-ep', 'repainted.js')

spec = importlib.util.spec_from_file_location('up', os.path.join(ROOT, 'tools', 'rr-vp-upscale.py'))
up = importlib.util.module_from_spec(spec); spec.loader.exec_module(up)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def find(folder, stem):
    return up.find(folder, stem)


def main():
    data = json.load(open(JOBS, encoding='utf8'))
    if '--jobs' in sys.argv:
        for j in data['jobs']:
            src = find(os.path.join(FRAMES, 'done', j['src']), j['file'])
            if not j.get('sha256'):
                j['sha256'] = sha(src)
            dst_dir = os.path.join(FRAMES, 'edit', j['src'])
            os.makedirs(dst_dir, exist_ok=True)
            dst = os.path.join(dst_dir, os.path.basename(src))
            if not os.path.exists(dst):
                shutil.copy2(src, dst)
            print('job', j['src'], os.path.basename(src))
        json.dump(data, open(JOBS, 'w', encoding='utf8', newline='\n'), indent=2)
        return
    back = []
    for j in data['jobs']:
        src = find(os.path.join(FRAMES, 'done', j['src']), j['file'])
        if not src or not j.get('sha256') or sha(src) == j['sha256']:
            continue
        im = Image.open(src).convert('RGB')
        if im.width < up.W or im.height < up.H:
            im = Image.open(up.esrgan(src)).convert('RGB')
        dst = os.path.join(ROOT, 'assets', 'sets', 'rr', j['place'], j['file'] + '.webp')
        up.to_plate(im, f"{j['place']}/{j['file']}").save(dst, 'WEBP', quality=84, method=6)
        back.append(j['file'])
        print('repainted:', j['place'], j['file'], '->', os.path.relpath(dst, ROOT))
    js = ('// Made by tools/rr-vp-repaints.py: the plates the user has repainted (tools/rr-vp-jobs.json). plates.js shoots on\n'
          '// each of these instead of the stand-in it used while the job was open.\n'
          'export const REPAINTED = new Set(' + json.dumps(sorted(back)) + ');\n')
    open(OUT_JS, 'w', encoding='utf8', newline='\n').write(js)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'rr-vp-motion.py')], check=True)
    print(f'{len(back)} of {len(data["jobs"])} jobs back' + ('' if back else ' (nothing new in done/)'))


if __name__ == '__main__':
    main()
