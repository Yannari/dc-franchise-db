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
#
# The user often saves a result beside its prompt in edit/<src>/ rather than in done/<src>/: a job whose file is not
# in done/ but that has a new image in edit/<src>/ (not a reference-*, not the frame given to repaint, not prompt.txt)
# is picked up from there when it is the only job open for that place, and reported loudly otherwise. Once every job
# of a place is back, its edit/<src>/ folder is emptied of the job's files (edit/ holds only what still waits).
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


IMG = ('.png', '.jpg', '.jpeg', '.webp')


def is_back(j):
    if j.get('new'):
        return bool(find(os.path.join(FRAMES, 'done', j['src'], 'cutout') if j.get('kind') == 'cutout' else os.path.join(FRAMES, 'done', j['src']), j['file']))
    src = find(os.path.join(FRAMES, 'done', j['src']), j['file'])
    return bool(src and j.get('sha256') and sha(src) != j['sha256'])


def strays(src_dir, jobs):
    # new images the user left in edit/<src>/ (not a reference frame, not the frame given out to repaint)
    d = os.path.join(FRAMES, 'edit', src_dir)
    if not os.path.isdir(d):
        return []
    given = {j['file'] for j in jobs}
    out = []
    for f in sorted(os.listdir(d)):
        stem, ext = os.path.splitext(f)
        if ext.lower() not in IMG or f.startswith('reference-') or stem in given:
            continue
        out.append(os.path.join(d, f))
    return out


def adopt(data):
    # results saved in edit/ instead of done/: one open job for that place takes the one new image there
    by_src = {}
    for j in data['jobs']:
        by_src.setdefault(j['src'], []).append(j)
    for src_dir, jobs in by_src.items():
        open_jobs = [j for j in jobs if not is_back(j)]
        found = strays(src_dir, jobs)
        if not open_jobs or not found:
            continue
        if len(open_jobs) == 1 and len(found) == 1:
            j = open_jobs[0]
            to_dir = os.path.join(FRAMES, 'done', src_dir, 'cutout' if j.get('kind') == 'cutout' else '')
            os.makedirs(to_dir, exist_ok=True)
            ext = os.path.splitext(found[0])[1]
            shutil.copy2(found[0], os.path.join(to_dir, j['file'] + ext))
            print(f'PICKED UP from edit/: {os.path.relpath(found[0], FRAMES)} -> done/{src_dir}/{j["file"]}{ext}')
        else:
            print(f'!!! edit/{src_dir} has {len(found)} new image(s) and {len(open_jobs)} open job(s): name them by hand into done/{src_dir}/')
            for f in found:
                print('      ', os.path.basename(f))


def tidy(data):
    # a place whose jobs are all back keeps nothing in edit/: the prompt, the frames and the results go
    by_src = {}
    for j in data['jobs']:
        by_src.setdefault(j['src'], []).append(j)
    for src_dir, jobs in by_src.items():
        d = os.path.join(FRAMES, 'edit', src_dir)
        if os.path.isdir(d) and all(is_back(j) for j in jobs):
            shutil.rmtree(d)
            print(f'edit/{src_dir}: all its jobs are back, folder removed')


def main():
    data = json.load(open(JOBS, encoding='utf8'))
    if '--jobs' in sys.argv:
        for j in data['jobs']:
            if is_back(j):
                continue                    # back already: nothing to hand out again
            if j.get('new'):
                # a view or a cut-out still to be made: its reference frame (if any) beside the prompt, nothing to hash
                if j.get('ref'):
                    ref = find(os.path.join(FRAMES, 'done', j['src']), j['ref'])
                    dst_dir = os.path.join(FRAMES, 'edit', j['src'])
                    os.makedirs(dst_dir, exist_ok=True)
                    if ref and not os.path.exists(os.path.join(dst_dir, 'reference-' + os.path.basename(ref))):
                        shutil.copy2(ref, os.path.join(dst_dir, 'reference-' + os.path.basename(ref)))
                print('new job', j['src'], j['file'])
                continue
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
    adopt(data)
    back = []
    for j in data['jobs']:
        if j.get('new') and j.get('kind') == 'cutout':
            # a new cut-out: trimmed to what is drawn, 640 wide, as the place's c-<prop>.webp
            src = find(os.path.join(FRAMES, 'done', j['src'], 'cutout'), j['file'])
            if not src:
                continue
            im = Image.open(src).convert('RGBA')
            if im.split()[-1].getbbox():
                im = im.crop(im.split()[-1].getbbox())
            if im.width > 640:
                im = im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS)
            dst = os.path.join(ROOT, 'assets', 'sets', 'rr', j['place'], 'c-' + j['prop'] + '.webp')
            im.save(dst, 'WEBP', quality=80, method=6)
            back.append(j['file'])
            print('cut-out back:', j['place'], j['file'], '->', os.path.relpath(dst, ROOT))
            continue
        if j.get('new'):
            # a new view: switched on as soon as it is in done/
            src = find(os.path.join(FRAMES, 'done', j['src']), j['file'])
            if not src:
                continue
            im = Image.open(src).convert('RGB')
            if im.width < up.W or im.height < up.H:
                im = Image.open(up.esrgan(src)).convert('RGB')
            dst = os.path.join(ROOT, 'assets', 'sets', 'rr', j['place'], j['file'] + '.webp')
            up.to_plate(im, f"{j['place']}/{j['file']}").save(dst, 'WEBP', quality=84, method=6)
            back.append(j['file'])
            print('new view back:', j['place'], j['file'], '->', os.path.relpath(dst, ROOT))
            continue
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
    if '--keep-edit' not in sys.argv:
        tidy(data)
    print(f'{len(back)} of {len(data["jobs"])} jobs back' + ('' if back else ' (nothing new in done/)'))


if __name__ == '__main__':
    main()
