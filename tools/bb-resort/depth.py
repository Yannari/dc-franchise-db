"""tools/bb-resort/depth.py — a depth map for every Reality Resort plate (near = white, far = black).

    python tools/bb-resort/depth.py [all | <id> ...] [--theme <t>] [--force] [--onnx <model.onnx>]

The stage moves a painted plate in depth without cutting it up (vp-td-ep/glplate.js, `data-depth`):
the near furniture slides more than the far wall when the camera drifts, so a flat painting reads as a
room. The depth is Depth Anything V2 Base run on the plate's 4K day frame. Two ways to run it:
  --onnx <model.onnx>   onnxruntime on the CPU (pip install onnxruntime; the model is
                        onnx-community/depth-anything-v2-base, onnx/model.onnx). No torch needed.
  otherwise             Hugging Face transformers on torch (CUDA if there is one).
Both run the model at 924x518 (the transformers processor's own size for a 16:9 frame), so the maps match.
A map that exists is skipped; a REPLACED plate needs --force.
Writes assets/sets/bb/resort/<theme>/<id>-depth.webp, 960x540, smoothed so a hard edge never tears.
"""
import os, sys, glob
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'assets', 'sets', 'bb', 'resort')
MODEL = os.environ.get('DEPTH_MODEL', 'depth-anything/Depth-Anything-V2-Base-hf')
MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)


def torch_runner():
    import torch
    from transformers import pipeline
    pipe = pipeline('depth-estimation', model=MODEL, device=0 if torch.cuda.is_available() else -1)

    def run(img):
        small = img.resize((1260, 708), Image.LANCZOS)     # 8 GB card shared with the desktop: 1536 ran out
        with torch.inference_mode():
            d = pipe(small)['depth']
        torch.cuda.empty_cache()
        return d
    return run


def onnx_runner(path):
    import onnxruntime as ort
    sess = ort.InferenceSession(path, providers=['CPUExecutionProvider'])
    name = sess.get_inputs()[0].name

    def run(img):
        x = (np.asarray(img.resize((924, 518), Image.BICUBIC), np.float32) / 255.0 - MEAN) / STD
        d = sess.run(None, {name: x.transpose(2, 0, 1)[None]})[0][0]
        return Image.fromarray((d * 255 / max(float(d.max()), 1e-6)).astype(np.uint8))   # as the pipeline formats it
    return run


def depth_of(run, path):
    img = Image.open(path).convert('RGB')
    d = np.array(run(img).resize((960, 540), Image.BILINEAR), dtype=np.float32)
    lo, hi = np.percentile(d, 2), np.percentile(d, 98)
    d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
    # smoothed, so a hard edge in the painting never tears when the plate moves
    return Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.5))


if __name__ == '__main__':
    args = sys.argv[1:]
    opt = lambda k: args[args.index(k) + 1] if k in args else None
    theme = opt('--theme') or 'default'
    ids = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--theme', '--onnx'))]
    d = os.path.join(OUT, theme)
    frames = sorted(glob.glob(os.path.join(d, '*-day-hd.webp')))
    if ids and ids != ['all']:
        frames = [f for f in frames if os.path.basename(f)[:-len('-day-hd.webp')] in ids]
    frames = [f for f in frames if not os.path.basename(f).startswith(('map-', 'cam-'))]
    run = onnx_runner(opt('--onnx')) if opt('--onnx') else torch_runner()
    for f in frames:
        pid = os.path.basename(f)[:-len('-day-hd.webp')]
        if os.path.exists(os.path.join(d, f'{pid}-depth.webp')) and '--force' not in args:
            continue
        depth_of(run, f).save(os.path.join(d, f'{pid}-depth.webp'), quality=88)
        print(pid, flush=True)
