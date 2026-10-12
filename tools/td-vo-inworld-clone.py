"""tools/td-vo-inworld-clone.py — clone each character's picked casting take as an Inworld voice.

The user chose Inworld (2026-10-11: "I like it") after hearing the 18 test lines in the three voices they cloned
by hand in the playground. This clones the rest of the cast from the takes they picked on casting.html
(voices/voices.json `_cast`): each take cut at the sentence end nearest 12 s (Inworld wants 5 to 15 s, the takes
run 12 to 17), sent with its words. A voice already in the account under the character's name is kept, never
replaced. The voice ids go to voices/inworld.json, which tools/td-vo-inworld.mjs reads.

Request format from Inworld's npm package (@inworld/tts 1.1.1, voice.js: POST /voices/v1/voices:clone).
The key: %USERPROFILE%\\.inworld-key (or .inworld-key.txt, or INWORLD_API_KEY); never in the repo.

    C:/Users/yanna/qwen-tts/.venv/Scripts/python.exe tools/td-vo-inworld-clone.py [--only Duncan] [--seconds 12]
"""
import argparse
import base64
import io
import json
import os
import pathlib
import re
import urllib.request

import librosa
import soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument('--only', nargs='*', default=[])
ap.add_argument('--seconds', type=float, default=12.0)
a = ap.parse_args()

home = pathlib.Path.home()
kf = next((home / f for f in ('.inworld-key', '.inworld-key.txt') if (home / f).exists()), None)
KEY = (os.environ.get('INWORLD_API_KEY') or (kf.read_text(encoding='utf-8') if kf else '')).strip()
if not KEY:
    raise SystemExit('No key: put it in %USERPROFILE%\\.inworld-key')
API = 'https://api.inworld.ai'

import time
def call(path, body=None, tries=6):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': f'Basic {KEY}', 'Content-Type': 'application/json'},
                                 method='POST' if body is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        msg = e.read()[:300]
        # cloning is rate-limited (2 a minute on the user's plan): wait it out and go again
        if e.code == 429 and tries > 1:
            wait = int((re.search(rb'in (\d+) seconds', msg) or [b'', b'31'])[1]) + 2
            print(f'  rate limit: waiting {wait}s', flush=True); time.sleep(wait)
            return call(path, body, tries - 1)
        raise SystemExit(f'{path}: {e.code} {msg!r}')

V = pathlib.Path('assets/audio/td/vo-test/voices')
cast = json.loads((V / 'voices.json').read_text(encoding='utf-8'))['_cast']
ipath = V / 'inworld.json'
mine = json.loads(ipath.read_text(encoding='utf-8')) if ipath.exists() else {}

# what is already in the account (the three the user cloned by hand among them), by name and by id
listed = call('/voices/v1/voices').get('voices', [])
# only the account's OWN voices (workspace__name): Inworld has stock voices too, and one is called Duncan
own = sorted({(v.get('voiceId') or '').split('__')[0] for v in listed if '__' in (v.get('voiceId') or '')})
def find(name):
    for v in listed:
        vid = v.get('voiceId') or ''
        if '__' in vid and ((v.get('displayName') or '').strip().lower() == name.lower() or vid.lower().endswith('__' + name.lower())):
            return vid
    return None

def cut(path, text, want):
    """The take cut at the sentence end nearest `want` s, inside a pause, and the words up to it (td-vo-clone.py)."""
    y, sr = sf.read(path)
    mono = y.mean(axis=1) if y.ndim > 1 else y
    dur = len(mono) / sr
    sents = re.findall(r"[^.!?]+[.!?]+[\"')]*", text) or [text]
    if dur <= 15 or len(sents) < 2:
        return y, sr, text, dur
    voiced = librosa.effects.split(mono, top_db=32, frame_length=1024, hop_length=256)
    gaps = [(voiced[i][1] / sr, voiced[i + 1][0] / sr) for i in range(len(voiced) - 1) if (voiced[i + 1][0] - voiced[i][1]) / sr >= 0.12]
    total, best = sum(len(s) for s in sents), None
    for k in range(1, len(sents)):
        est = dur * sum(len(s) for s in sents[:k]) / total
        near = [g for g in gaps if abs((g[0] + g[1]) / 2 - est) < 0.9]
        if not near:
            continue
        g = min(near, key=lambda g: abs((g[0] + g[1]) / 2 - est)); c = (g[0] + g[1]) / 2
        if 5 <= c <= 15 and (best is None or abs(c - want) < abs(best[0] - want)):
            best = (c, k)
    if not best:
        return y[: int(15 * sr)], sr, None, 15.0   # no clean sentence end in range: 15 s, sent without words
    c, k = best
    return y[: int(c * sr)], sr, ''.join(sents[:k]).strip(), c

for name, c in cast.items():
    if a.only and name not in a.only:
        continue
    have = find(name)
    if have:
        mine[name] = have
        print(f'{name:10} kept: {have}')
        continue
    if not c.get('pick'):
        print(f'{name:10} no pick on casting.html: skipped')
        continue
    y, sr, words, secs = cut(V / c['takes'][c['pick'] - 1], c['text'], a.seconds)
    buf = io.BytesIO(); sf.write(buf, y, sr, format='WAV'); audio = base64.b64encode(buf.getvalue()).decode()
    sample = {'audioData': audio, **({'transcription': words} if words else {})}
    out = call('/voices/v1/voices:clone', {'displayName': name, 'langCode': 'EN_US', 'voiceSamples': [sample],
                                           'description': f'Total Drama simulator: {name}', 'audioProcessingConfig': {'removeBackgroundNoise': False}})
    v = out.get('voice', out)
    vid = v.get('voiceId') or v.get('name')
    if not vid:
        raise SystemExit(f'{name}: no voice id in the answer: {json.dumps(out)[:300]}')
    mine[name] = vid
    ipath.write_text(json.dumps(mine, indent=2), encoding='utf-8')
    print(f'{name:10} cloned from take {c["pick"]} ({secs:.1f}s{"" if words else ", no words"}): {vid}')
ipath.write_text(json.dumps(mine, indent=2), encoding='utf-8')
print(f'{len(mine)} voices in voices/inworld.json')
