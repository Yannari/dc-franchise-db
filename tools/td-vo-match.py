"""tools/td-vo-match.py — the voice test's third way: design every line, keep the take that sounds like them.

The user's verdict on the first two (2026-10-11): Design acts best but its voices drift from line to line;
Clone holds the voice but is monotone (and too high for Heather), Clone light holds it but is boring. So keep
Design's acting and fix the drift by choice, not by cloning:
  1. VoiceDesign voices every line --takes times (each take a fresh performance, with the line's direction).
  2. The Base model's speaker encoder turns every take into a voice fingerprint (x-vector).
  3. Each character's ANCHOR is the mean of their fingerprints, the voice they usually come out as; it is
     saved in voices/anchors.json and reused, so a later episode is held to the same voice.
  4. Each line keeps the take nearest its character's anchor: design-matched/<id>.wav.
It prints how alike each character's lines are before (take 1 of each) and after (the kept takes).

    C:/Users/yanna/qwen-tts/.venv/Scripts/python.exe tools/td-vo-match.py [--takes 4] [--batch 12]
"""
import argparse
import gc
import json
import pathlib
import shutil
import time

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='assets/audio/td/vo-test')
ap.add_argument('--takes', type=int, default=4)
ap.add_argument('--batch', type=int, default=12)
a = ap.parse_args()

out = pathlib.Path(a.dir)
script = json.loads((out / 'script.json').read_text(encoding='utf-8'))
tdir, mdir, vdir = out / 'design-takes', out / 'design-matched', out / 'voices'
for d in (tdir, mdir, vdir):
    d.mkdir(exist_ok=True)
take = lambda l, k: tdir / f"{l['file'][:-4]}-{k}.wav"

# ── 1. the takes ──
t0 = time.time()
jobs = sorted([(l, k) for l in script['lines'] for k in range(1, a.takes + 1) if not take(l, k).exists()], key=lambda j: len(j[0]['text']))
if jobs:
    design = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
    for i in range(0, len(jobs), a.batch):
        chunk = jobs[i:i + a.batch]
        wavs, sr = design.generate_voice_design(text=[l['text'] for l, _ in chunk], language=['English'] * len(chunk), instruct=[l['voiceDescription'] for l, _ in chunk])
        for (l, k), w in zip(chunk, wavs):
            sf.write(take(l, k), w, sr)
        print(f'takes {min(i + a.batch, len(jobs))}/{len(jobs)}', flush=True)
    del design; gc.collect(); torch.cuda.empty_cache()
print(f'{len(jobs)} takes voiced in {time.time() - t0:.0f}s', flush=True)

# ── 2. the fingerprints ──
enc = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
def prints(paths):
    items = enc.create_voice_clone_prompt(ref_audio=[str(p) for p in paths], x_vector_only_mode=[True] * len(paths))
    v = np.stack([it.ref_spk_embedding.float().cpu().numpy() for it in items])
    return v / np.linalg.norm(v, axis=1, keepdims=True)
fp = {}
for l in script['lines']:
    fp[l['id']] = prints([take(l, k) for k in range(1, a.takes + 1)])

# ── 3. the anchors: kept from before when there is one, else the character's mean voice ──
apath = vdir / 'anchors.json'
anchors = json.loads(apath.read_text(encoding='utf-8')) if apath.exists() else {}
for name in script['characters']:
    if name in anchors:
        continue
    allv = np.concatenate([fp[l['id']] for l in script['lines'] if l['by'] == name])
    m = allv.mean(axis=0); anchors[name] = (m / np.linalg.norm(m)).round(6).tolist()
apath.write_text(json.dumps(anchors), encoding='utf-8')

# ── 4. keep the nearest take, and say how much it helped ──
def spread(vs):
    """mean likeness of every pair of lines (1 = the same voice every time)"""
    vs = np.stack(vs); s = vs @ vs.T; n = len(vs)
    return (s.sum() - n) / (n * (n - 1)) if n > 1 else 1.0
for name in script['characters']:
    anc = np.array(anchors[name]); first, kept = [], []
    for l in [l for l in script['lines'] if l['by'] == name]:
        sims = fp[l['id']] @ anc; best = int(sims.argmax())
        shutil.copyfile(take(l, best + 1), mdir / l['file'])
        first.append(fp[l['id']][0]); kept.append(fp[l['id']][best])
    print(f"{name:8} likeness between lines: take 1 of each {spread(first):.3f}  ->  kept takes {spread(kept):.3f}   (to the anchor {np.mean([v @ anc for v in first]):.3f} -> {np.mean([v @ anc for v in kept]):.3f})")
print(f'done in {time.time() - t0:.0f}s')
