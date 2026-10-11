"""tools/td-vo-cast.py — cast each character's voice: a few takes of their casting line, for the user to pick.

The user's verdict on voicing every line from the description (2026-10-11): "the voices are changing too much,
I can't use that". Only a clone holds a voice, and a clone copies the energy of its reference, so the
reference has to be them at their most themselves. This voices each character's casting line
(voices/casting.json) from their precise voice (voices/profiles.json) --takes times, at the model's usual
randomness so the takes differ, into voices/cast/<Name>-<k>.wav. The user picks one on casting.html; that
take is their voice from then on, in every line, season and show (tools/td-vo-clone.py clones from it).

    C:/Users/yanna/qwen-tts/.venv/Scripts/python.exe tools/td-vo-cast.py [--takes 3] [--only Owen Gwen] [--force]
"""
import argparse
import json
import pathlib
import time

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='assets/audio/td/vo-test/voices')
ap.add_argument('--takes', type=int, default=3)
ap.add_argument('--only', nargs='*', default=[])
ap.add_argument('--force', action='store_true', help='make the takes again even where they exist')
ap.add_argument('--budget', type=int, default=450, help='characters of text in one batch (td-vo-render.py: past the 8 GB card it crawls)')
a = ap.parse_args()

vdir = pathlib.Path(a.dir)
cdir = vdir / 'cast'
cdir.mkdir(exist_ok=True)
read = lambda f: {k: v for k, v in json.loads((vdir / f).read_text(encoding='utf-8')).items() if not k.startswith('_')}
profiles, lines = read('profiles.json'), read('casting.json')
names = [n for n in lines if n in profiles and (not a.only or n in a.only)]
take = lambda n, k: cdir / f'{n}-{k}.wav'
jobs = [(n, k) for n in names for k in range(1, a.takes + 1) if a.force or not take(n, k).exists()]

model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
t0 = time.time()
batches, cur = [], []
for j in jobs:
    if cur and sum(len(lines[n]) for n, _ in cur) + len(lines[j[0]]) > a.budget:
        batches.append(cur); cur = []
    cur.append(j)
if cur:
    batches.append(cur)
for chunk in batches:
    wavs, sr = model.generate_voice_design(
        text=[lines[n] for n, _ in chunk], language=['English'] * len(chunk),
        instruct=[f'{profiles[n]} Say it fully in character, with their natural energy and attitude.' for n, _ in chunk])
    for (n, k), w in zip(chunk, wavs):
        sf.write(take(n, k), w, sr)
    print(f"{len(chunk)} takes ({', '.join(sorted({n for n, _ in chunk}))}) in {time.time() - t0:.0f}s", flush=True)

# the casting record: what each take says, and the pick (kept when the takes already existed)
vpath = vdir / 'voices.json'
voices = json.loads(vpath.read_text(encoding='utf-8')) if vpath.exists() else {}
cast = voices.setdefault('_cast', {})
for n in names:
    old = cast.get(n, {})
    remade = a.force or not old.get('made')
    # `made` dates the takes: casting.html drops a pick remembered for takes that have since been remade
    cast[n] = {'text': lines[n], 'takes': [f'cast/{n}-{k}.wav' for k in range(1, a.takes + 1)],
               'pick': None if remade else old.get('pick'), 'made': int(time.time()) if remade else old['made']}
vpath.write_text(json.dumps(voices, indent=2), encoding='utf-8')
print(f'{len(jobs)} takes for {len(names)} characters in {time.time() - t0:.0f}s')
