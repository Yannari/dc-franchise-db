"""tools/td-vo-clone.py — the voice test, design once then clone: one fixed voice per character.

Designing every line from the description re-imagines the character each time: the user heard Owen and Gwen
drift from line to line (2026-10-11). Qwen's own fix is to design a voice ONCE and clone it for every line:
  1. VoiceDesign (1.7B) speaks a reference line for each character, three takes; the user picks one in
     voices.json ("pick"), take 1 until they do. Kept, so a voice never changes unless asked (--redesign).
  2. Base (1.7B, the cloning model) speaks every line of script.json in the picked voice, into clone/<id>.wav.
The clone model takes no reading direction: it gets its tone from the words alone. That is the trade.

    C:/Users/yanna/qwen-tts/.venv/Scripts/python.exe tools/td-vo-clone.py [--redesign Owen] [--batch 12]
"""
import argparse
import gc
import json
import pathlib
import time

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='assets/audio/td/vo-test')
ap.add_argument('--redesign', nargs='*', default=[], help='characters whose reference takes are made again')
# measured on the 8 GB card: batch 6 is 5.5 s a line, 12 passes 8 GB on the long lines (8.7 GB) for no gain
ap.add_argument('--batch', type=int, default=6)
# the clone normally re-reads the whole reference take (its audio and words) beside every line; --light keeps
# only the speaker's fingerprint (x-vector): shorter input, faster, possibly less like the reference
ap.add_argument('--light', action='store_true')
a = ap.parse_args()

out = pathlib.Path(a.dir)
script = json.loads((out / 'script.json').read_text(encoding='utf-8'))
vdir, cdir = out / 'voices', out / ('clone-light' if a.light else 'clone')
vdir.mkdir(exist_ok=True); cdir.mkdir(exist_ok=True)
vpath = vdir / 'voices.json'
voices = json.loads(vpath.read_text(encoding='utf-8')) if vpath.exists() else {}
TAKES = 3
# what each character says in their reference take: in character and at their usual pitch, long enough
# (about eight seconds) for the clone to learn the voice from. Heard only here, never in an episode.
REF = {
    'Heather': "Okay, listen, because I'm only saying this once. I'm here to win, and honestly, most of you are just standing in my way.",
    'Owen': "Oh man, this is gonna be the best summer ever! Did somebody say there's a buffet? Because I am so ready for a buffet.",
    'Gwen': "Great. A summer camp. Exactly what I wanted. Wake me up when it's over, or when somebody actually says something interesting.",
}

# ── 1. the reference voices ──
need = [n for n in script['characters'] if n not in voices or n in a.redesign]
t0 = time.time()
if need:
    design = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
    for name in need:
        desc, text = script['characters'][name], REF.get(name, "Hi. This is what I sound like when I'm just talking normally, nothing special.")
        wavs, sr = design.generate_voice_design(text=[text] * TAKES, language=['English'] * TAKES, instruct=[f'{desc} Speak naturally, in your usual voice.'] * TAKES)
        for k, w in enumerate(wavs, 1):
            sf.write(vdir / f'{name}-{k}.wav', w, sr)
        voices[name] = {'pick': voices.get(name, {}).get('pick', 1), 'text': text, 'takes': [f'{name}-{k}.wav' for k in range(1, TAKES + 1)]}
        print(f'{name}: {TAKES} reference takes', flush=True)
    vpath.write_text(json.dumps(voices, indent=2), encoding='utf-8')
    # out of the GPU before the clone model loads: both at once pass the 8 GB card and spill (14.6 s a line)
    del design; gc.collect(); torch.cuda.empty_cache()
print(f'references ready in {time.time() - t0:.0f}s', flush=True)

# ── 2. every line, cloned in the picked voice ──
clone = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
prompt = {}
for name, v in voices.items():
    ref = vdir / v['takes'][v['pick'] - 1]
    prompt[name] = clone.create_voice_clone_prompt(ref_audio=str(ref), ref_text=None if a.light else v['text'], x_vector_only_mode=a.light)[0]
todo = sorted([l for l in script['lines'] if l['by'] in prompt], key=lambda l: len(l['text']))
t1, done = time.time(), 0
for i in range(0, len(todo), a.batch):
    chunk = todo[i:i + a.batch]
    t = time.time(); torch.cuda.reset_peak_memory_stats()
    wavs, sr = clone.generate_voice_clone(text=[l['text'] for l in chunk], language=['English'] * len(chunk), voice_clone_prompt=[prompt[l['by']] for l in chunk])
    for l, w in zip(chunk, wavs):
        sf.write(cdir / l['file'], w, sr)
    done += len(chunk)
    print(f"{done}/{len(todo)}  {len(chunk)} lines, {sum(len(w) for w in wavs) / sr:5.1f}s of speech in {time.time() - t:5.1f}s  peak {torch.cuda.max_memory_allocated() / 2**30:.2f} GB", flush=True)
print(f'{done} cloned lines in {time.time() - t1:.0f}s ({(time.time() - t1) / max(done, 1):.1f}s a line)')
