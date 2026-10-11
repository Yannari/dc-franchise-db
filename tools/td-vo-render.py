"""tools/td-vo-render.py — voice the test script with Qwen3-TTS, locally, on the GPU.

The user's voice-acting test (2026-10-11): tools/td-vo-script.mjs writes assets/audio/td/vo-test/script.json
(each line's text and the one "Voice Description" the VoiceDesign model takes: the character, then how to
deliver this line). This renders every line to <id>.wav beside it, where the viewer plays it (sound.js speak).

Runs in its own environment outside the repo and OneDrive (Python 3.12, CUDA PyTorch, qwen-tts):
    C:/Users/yanna/qwen-tts/.venv/Scripts/python.exe tools/td-vo-render.py [--model 1.7B|0.6B] [--force]
The first run downloads the model (several GB) to the Hugging Face cache.
"""
import argparse
import json
import pathlib
import time

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ap = argparse.ArgumentParser()
ap.add_argument('--model', default='1.7B', help='1.7B (VoiceDesign is only published at 1.7B) or a local path')
ap.add_argument('--dir', default='assets/audio/td/vo-test')
ap.add_argument('--force', action='store_true', help='render lines that already have a clip')
# lines voiced together: measured on the RTX 5070 Laptop (8 GB), one at a time 11.9 s a line, 6 at once 3.1 s,
# 12 at once 2.5 s (6.2 GB), 18 at once 6.1 s (7.6 GB: past the card, it spills and slows)
ap.add_argument('--batch', type=int, default=12)
# the drift experiments (the user, 2026-10-11: Design acts best but its voices drift between lines)
# THE CHOSEN SETTINGS (the user, 2026-10-11, after hearing five versions: "precise + less random do a good job
# enough and it's quick"): each character's precise voice from voices/profiles.json, at temperature 0.6
ap.add_argument('--profiles', default='voices/profiles.json', help="precise voices per character (relative to --dir), used in place of the script's short one")
ap.add_argument('--seed', type=int, help='every line of a character starts from the same random state (one line at a time: a batch gives each line its own draws)')
ap.add_argument('--temperature', type=float, default=0.6, help='sampling temperature (the model default is 0.9): lower is less random')
ap.add_argument('--sub', default='', help='write the clips into this subfolder')
a = ap.parse_args()

out = pathlib.Path(a.dir)
script = json.loads((out / 'script.json').read_text(encoding='utf-8'))
model_id = a.model if '/' in a.model or '\\' in a.model else f'Qwen/Qwen3-TTS-12Hz-{a.model}-VoiceDesign'

t0 = time.time()
# sdpa, not flash_attention_2: FlashAttention does not build on Windows; sdpa costs some memory, not quality
model = Qwen3TTSModel.from_pretrained(model_id, device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
print(f'loaded {model_id} in {time.time() - t0:.1f}s, {torch.cuda.memory_allocated() / 2**30:.2f} GB on the GPU', flush=True)

dest = out / a.sub
dest.mkdir(exist_ok=True)
ppath = out / a.profiles if a.profiles and not pathlib.Path(a.profiles).is_absolute() and (out / a.profiles).exists() else pathlib.Path(a.profiles or '')
profiles = {k: v for k, v in json.loads(ppath.read_text(encoding='utf-8')).items() if not k.startswith('_')} if a.profiles and ppath.is_file() else {}
def desc(l):
    return f"{profiles[l['by']]} {l['direction']}" if l['by'] in profiles else l['voiceDescription']
gen = {'temperature': a.temperature, 'subtalker_temperature': a.temperature} if a.temperature else {}
if a.seed is not None:
    a.batch = 1
todo = [l for l in script['lines'] if a.force or not (dest / l['file']).exists()]
# a batch runs as long as its longest line: lines of a like length together, so short ones don't wait
todo.sort(key=lambda l: len(l['text']))
done, t1 = 0, time.time()
for i in range(0, len(todo), a.batch):
    chunk = todo[i:i + a.batch]
    torch.cuda.reset_peak_memory_stats()
    t = time.time()
    if a.seed is not None:
        torch.manual_seed(a.seed + sum(map(ord, chunk[0]['by'])))   # the same start for every line of one character
    wavs, sr = model.generate_voice_design(text=[l['text'] for l in chunk], language=['English'] * len(chunk), instruct=[desc(l) for l in chunk], **gen)
    for line, w in zip(chunk, wavs):
        sf.write(dest / line['file'], w, sr)
    done += len(chunk)
    print(f"{done}/{len(todo)}  {len(chunk)} lines, {sum(len(w) for w in wavs) / sr:5.1f}s of speech in {time.time() - t:5.1f}s  peak {torch.cuda.max_memory_allocated() / 2**30:.2f} GB", flush=True)
print(f'{done} clips in {time.time() - t1:.0f}s ({(time.time() - t1) / max(done, 1):.1f}s a line), model load {t1 - t0:.0f}s')
