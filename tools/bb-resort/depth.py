"""tools/bb-resort/depth.py — a depth map for every Reality Resort plate (near = white, far = black).

    <torch python> tools/bb-resort/depth.py [all | <id> ...] [--theme <t>]

The stage moves a painted plate in depth without cutting it up (vp-td-ep/glplate.js, `data-depth`):
the near furniture slides more than the far wall when the camera drifts, so a flat painting reads as a
room. The depth is Depth Anything V2 (Hugging Face transformers) run on the plate's 4K day frame; it
needs torch, which the repo does not (the local venv: C:\\Users\\yanna\\qwen-tts\\.venv, CUDA).
Writes assets/sets/bb/resort/<theme>/<id>-depth.webp, 960x540, smoothed so a hard edge never tears.
"""
import os, sys, glob
import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import pipeline

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'assets', 'sets', 'bb', 'resort')
MODEL = os.environ.get('DEPTH_MODEL', 'depth-anything/Depth-Anything-V2-Base-hf')


def depth_of(pipe, path):
    img = Image.open(path).convert('RGB')
    small = img.resize((1260, 708), Image.LANCZOS)     # 8 GB card shared with the desktop: 1536 ran out
    d = np.array(pipe(small)['depth'].resize((960, 540), Image.BILINEAR), dtype=np.float32)
    lo, hi = np.percentile(d, 2), np.percentile(d, 98)
    d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
    # smoothed, so a hard edge in the painting never tears when the plate moves
    return Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.5))


if __name__ == '__main__':
    args = sys.argv[1:]
    theme = args[args.index('--theme') + 1] if '--theme' in args else 'default'
    ids = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--theme')]
    d = os.path.join(OUT, theme)
    frames = sorted(glob.glob(os.path.join(d, '*-day-hd.webp')))
    if ids and ids != ['all']:
        frames = [f for f in frames if os.path.basename(f)[:-len('-day-hd.webp')] in ids]
    frames = [f for f in frames if not os.path.basename(f).startswith(('map-', 'cam-'))]
    pipe = pipeline('depth-estimation', model=MODEL, device=0 if torch.cuda.is_available() else -1)
    for f in frames:
        pid = os.path.basename(f)[:-len('-day-hd.webp')]
        if os.path.exists(os.path.join(d, f'{pid}-depth.webp')) and '--force' not in args:
            continue
        with torch.inference_mode():
            dm = depth_of(pipe, f)
        torch.cuda.empty_cache()
        dm.save(os.path.join(d, f'{pid}-depth.webp'), quality=88)
        print(pid, flush=True)
