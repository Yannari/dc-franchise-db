# The Challenge's sound (js/vp-ch-ep/sound.js), made from the user's downloads
# (Downloads/Challenge-art/music/<slot>/, 2026-10-15; SUGGESTED-USE.txt there says
# what each file is for). Every output is trimmed of the silence in front,
# layered where one moment is several sounds at once (ELIMINATED is a stamp, a
# dark drum, a guitar slide and paper tearing), looped where it is ambience
# (the tail crossfaded into the head, so the loop has no click), levelled the
# house way (manual §6.6: beds -17 dB, stingers -14 dB, measured as the RMS of
# the part that is sounding, peaks held under -1 dBFS) and encoded 128 kbps.
#
# A track that could not be raised to its level without clipping prints its
# shortfall as `lift`; vp-ch-ep/sound.js gives it back on playback (the Big
# Brother way, vp-bb-ep/sound.js).
#
#   python tools/ch-make-audio.py [path/to/Challenge-art/music]
#
# Needs numpy and imageio-ffmpeg (its ffmpeg binary decodes, filters and encodes).
import json, os, subprocess, sys
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'Challenge-art', 'music')
DST = os.path.join(ROOT, 'assets', 'audio', 'ch')
REPO = os.path.join(ROOT, 'assets', 'audio')   # 'repo:td/amb/campfire.ogg' is a file the site already has


def decode(rel, af=None):
    path = os.path.join(REPO, rel[5:]) if rel.startswith('repo:') else os.path.join(SRC, rel)
    cmd = [FF, '-v', 'error', '-i', path]
    if af: cmd += ['-af', af]
    cmd += ['-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).reshape(-1, 2).copy()


def frames_db(x, hop=0.05):
    n = int(SR * hop)
    m = x.mean(1)[: len(x) // n * n].reshape(-1, n)
    return 20 * np.log10(np.sqrt((m ** 2).mean(1)) + 1e-9), n


def trim_front(x, floor=-45):
    """Drop the silence in front: a sting starts at 0 s (docs/bb-music.md)."""
    e, n = frames_db(x)
    on = np.where(e > floor)[0]
    return x[max(0, on[0] * n - n // 2):] if len(on) else x


def trim_tail(x, floor=-55):
    e, n = frames_db(x)
    on = np.where(e > floor)[0]
    return x[: min(len(x), (on[-1] + 2) * n)] if len(on) else x


def fade(x, fin=0.0, fout=0.0):
    x = x.copy()
    a, b = int(SR * fin), int(SR * fout)
    if a: x[:a] *= np.linspace(0, 1, a)[:, None]
    if b: x[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    return x


def tile(x, n):
    """Repeat a short loop to n samples, crossfading each seam."""
    if len(x) >= n: return x[:n]
    xf = min(int(SR * 0.8), len(x) // 4)
    out = x.copy()
    while len(out) < n:
        ramp = np.linspace(0, 1, xf)[:, None]
        seam = out[-xf:] * (1 - ramp) + x[:xf] * ramp
        out = np.concatenate([out[:-xf], seam, x[xf:]])
    return out[:n]


def loopable(x, xf=3.0):
    """Fold the tail into the head, so a looped buffer has no seam."""
    k = int(SR * xf)
    if len(x) < 3 * k: return x
    ramp = np.linspace(0, 1, k)[:, None]
    head = x[:k] * ramp + x[-k:] * (1 - ramp)
    return np.concatenate([head, x[k:-k]])


def stab(x, dur=1.6):
    """The first hard guitar attack of a track: the frame with the biggest jump in level
    (10 ms frames) after the intro, where the next half second stays loud."""
    n = int(SR * 0.01)
    m = x.mean(1)[: len(x) // n * n].reshape(-1, n)
    e = 20 * np.log10(np.sqrt((m ** 2).mean(1)) + 1e-9)
    best, at = -1e9, 0
    for i in range(300, min(len(e) - 60, 6000)):          # 3 s .. 60 s in
        rise = e[i] - e[i - 8:i].mean()
        if rise > best and e[i:i + 50].mean() > e.max() - 8: best, at = rise, i
    s = max(0, at * n - int(SR * 0.02))
    return fade(x[s:s + int(SR * dur)], 0.003, 0.7), at * n / SR


def level(x, target, ceiling=-1.0):
    e, n = frames_db(x)
    act = e[e > -45]
    rms = 10 * np.log10(np.mean(10 ** (act / 10))) if len(act) else -60
    want = target - rms
    peak = 20 * np.log10(np.abs(x).max() + 1e-9)
    got = min(want, ceiling - peak)
    lift = round(float(min(3.0, max(0.0, want - got))), 1)   # more would push the mix into clipping
    return x * 10 ** (got / 20), lift


def encode(x, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pcm = np.clip(x, -1, 1).astype(np.float32).tobytes()
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '128k', path], input=pcm, check=True)


# ── what is made ───────────────────────────────────────────────────────
# A layer: (file, {start, dur, gain, delay, af, tile, front}). `front` False keeps the silence in front.
def L(f, **o): return (f, o)

CAMPFIRE = 'repo:td/amb/campfire.ogg'
CRICKETS = 'jungle/crickets-singing-in-a-jungle-at-night.wav'
WAVES = 'waves-wind/sea-waves-on-a-rocky-shore.wav'
WIND = 'waves-wind/wind-in-the-forest-loop.wav'

# Beds: music under a moment (kind 'bed', capped at `cap` seconds), or ambience ('amb': looped).
BEDS = {
    'open':         ('bed', [L('show-open/rock-the-game_ahjay-stelino.mp3')]),
    'open-2':       ('bed', [L('show-open/sports-highlights_ahjay-stelino.mp3')]),
    'fun':          ('bed', [L('house-day/hip-hop-02_lily-j.mp3')]),
    'scheming':     ('bed', [L('house-night/complicated_arulo.mp3')]),
    'drama':        ('bed', [L('called-out/nu-metal-no-solo_litesaturation.mp3')]),
    'romance':      ('bed', [L('romance/jb-rnb-music_arulo.mp3')]),
    'romance-2':    ('bed', [L('romance/true-love_ahjay-stelino.mp3')]),
    'daily':        ('bed', [L('daily/powerful-energetic-nu-metal-adrenaline_brightestavenue.mp3')]),
    'deliberation': ('bed', [L('deliberation/cinematic-mystery-heartbeat-transition.wav')]),
    'tribunal':     ('bed', [L('tribunal/epical-drums-01_grigoriy-nuzhny.mp3')]),
    'arena-walk':   ('bed', [L('arena-walk/tribal-ritual-drums.wav'), L(CAMPFIRE, gain=-10, tile=True)]),
    'arena-walk-2': ('bed', [L('arena-walk/tribal-drumming-ambience.wav'), L(CAMPFIRE, gain=-10, tile=True)]),
    'arena':        ('bed', [L('arena/extreme-sports-metal-game-on_keyframe-audio.mp3')]),
    'party':        ('bed', [L('party/tech-house-vibes_alejandro-magana.mp3')]),
    'final':        ('bed', [L('the-final/workout-epic-rock-trailer-inflamed_qubesounds.mp3')]),
    'overnight':    ('bed', [L('overnight/echoes_andrew-ev.mp3', dur=120), L(CAMPFIRE, gain=-9, tile=True), L(WIND, gain=-12, tile=True)]),
    'overnight-2':  ('bed', [L('overnight/silent-descent_eugenio-mininni.mp3', dur=120), L(CAMPFIRE, gain=-9, tile=True), L(WIND, gain=-12, tile=True)]),
    'champions':    ('bed', [L('champions/epic-rock-anthem_ikoliks.mp3')]),
    # ambience: what a place sounds like when nothing is playing (manual §18: silence is the default)
    'amb-day':      ('amb', [L(WAVES, dur=64)]),
    'amb-night':    ('amb', [L(WAVES, dur=64, gain=-8), L(CRICKETS, tile=True)]),
    'amb-jungle':   ('amb', [L('jungle/twilight-jungle.wav', tile=True, dur=40)]),
    'amb-arena':    ('amb', [L(CAMPFIRE, tile=True, dur=48), L(CRICKETS, gain=-10, tile=True)]),
    # the party heard through the villa walls: the club track, low-passed, under the night
    'party-walls':  ('amb', [L('party/tech-house-vibes_alejandro-magana.mp3', start=20, dur=64, af='lowpass=f=180,lowpass=f=180', gain=-4),
                             L(CRICKETS, gain=-8, tile=True)]),
}

STINGS = {
    'gong':         [L('gong/big-gong-sound-effect_soundreality.mp3', dur=5)],
    'horn':         [L('air-horn/air-horn_waitwhatimsignedin.mp3')],
    'horn-2':       [L('air-horn/dj-airhorn.mp3')],
    'arena-horn':   [L('arena-horn/warfare-horn.wav')],
    'impact':       [L('daily-win/cool-impact-movie-trailer.wav', dur=4.5)],
    'daily-win':    [L('daily-win/cool-impact-movie-trailer.wav', dur=4.5), L('crowd/young-crowd-cheers-and-boo.wav', delay=0.25, gain=-7, dur=4)],
    'arena-win':    [L('arena-win/achievement-win-drums.wav'), L('crowd/stadium-joy-shouting-crowd.wav', delay=0.3, gain=-6, dur=4.5)],
    'eliminated':   [L('stamp/traditional-stamp.mp3'), L('eliminated/deep-dark-horror-drum.wav', delay=0.04),
                     L('eliminated/electric-guitar-distorted-slide.wav', delay=0.12, gain=-5), L('stamp/paper-tear.mp3', delay=0.45, gain=-3)],
    'called-out':   [L('spray-hiss/deodorant-bomb_bigsoundbank.mp3'), L('STAB:called-out/nu-metal-no-solo_litesaturation.mp3', delay=0.3, gain=-2)],
    'voted-in':     [L('spray-hiss/aerosol-spray_universfield.mp3'), L('the-vote/deep-cinematic-subtle-drum-impact.wav', delay=0.15)],
    'spray':        [L('spray-hiss/deodorant-bomb_bigsoundbank.mp3')],
    'betrayed':     [L('spray-hiss/deodorant-bomb_bigsoundbank.mp3'), L('drama-sting/cinematic-mystery-trailer-drum-hit.mp3', delay=0.2)],
    'vote':         [L('the-vote/deep-cinematic-subtle-drum-impact.wav')],
    'card':         [L('drama-sting/movie-trailer-whoosh-hit.wav')],
    'recap':        [L('recap/cinematic-transition-swoosh-heartbeat-trailer.wav')],
    'fight':        [L('fight/hard-horror-hit-drum.wav')],
    'tj':           [L('tj/drum-joke-accent.wav')],
    'tj-2':         [L('tj/clown-horn-at-circus.wav')],
    'whistle':      [L('red-card/police-whistle.wav')],
    'tape':         [L('caution-tape/duct-tape-rip_kai-audio.mp3', dur=2.2), L('punch/boxing-punch.wav', delay=2.0, gain=-6)],
    'mud':          [L('mud/heavy-fall-into-mud.wav')],
    'mud-2':        [L('mud/falling-into-mud-surface.wav')],
    'sag':          [L('rope/rope-creak.mp3', dur=2.8)],
    'creak':        [L('car-jump/ship-hull-creak.wav', dur=3)],
    'dig':          [L('coffin/sand-swish.wav')],
    'gate':         [L('gate/scary-wooden-door-opening.wav'), L('gate/gate-latch-click.wav', delay=3.1)],
    'bell':         [L('bell/boxing-bell-1_lazychillzone.mp3', dur=2.6)],
    'buzzer':       [L('buzzer/short-buzzer.wav')],
    'correct':      [L('buzzer/correct-answer-tone.wav')],
    'wrong':        [L('buzzer/electric-low-buzzer_wrong.wav')],
    'clock':        [L('timer/ticking-timer.wav', dur=3.5)],
    'engine':       [L('truck/truck-start-engine.wav', dur=6)],
    'motor':        [L('motor/spinning-electric-machine.wav', dur=5)],
    'smoke-bomb':   [L('smoke-bomb/smoke-bomb.wav')],
    'ice':          [L('ice/large-pour-of-water-with-ice-cubes.wav', dur=4.5)],
    'ice-2':        [L('ice/dropping-ice.wav')],
    'crash':        [L('crate-smash/wood-crate-destroy-2.mp3')],
    'smash':        [L('crate-smash/wood-smash-3_floraphonic.mp3')],
    'knife':        [L('rope/knife-slice_rope-cut.mp3')],
    'knock':        [L('coffin/knocking-on-thick-wooden-door.wav')],
    'shovel':       [L('coffin/hard-shovel-stab.wav'), L('coffin/sand-swish.wav', delay=0.2, gain=-3)],
    'hiss':         [L('bugs/snake-hiss.mp3')],
    'squish':       [L('bugs/juicy-insect-squish.wav')],
    'gag':          [L('gross-food/gagging-sounds.mp3', dur=2.6)],
    'eat':          [L('gross-food/eating-and-biting-crunchy-food.wav', dur=2.5)],
    'barrel':       [L('barrel/rolling-metal-barrel.mp3')],
    'car':          [L('car-jump/car-door-slam.wav')],
    'confetti':     [L('confetti/confetti-burst.mp3'), L('crowd/stadium-joy-shouting-crowd.wav', gain=-5, dur=6)],
    'crowd':        [L('crowd/stadium-joy-shouting-crowd.wav', dur=5)],
    'smoke-alarm':  [L('alarm/fire-alarm-beep_smoke-alarm.mp3', dur=3.5)],
    'alarm-clock':  [L('alarm/alarm-clock-beep.wav', dur=3.5)],
    'plane':        [L('plane/jet-plane-arrival-at-airport.wav', dur=8)],
    'punch':        [L('punch/strong-punches-to-the-body.wav')],
    'fall':         [L('body-fall/body-impact-falling-into-sand.wav')],
    'bubbles':      [L('underwater/deep-water-bubbles.wav', dur=3)],
    'glass':        [L('glass-clink/couple-of-glasses-clink.wav')],
}


def render(layers, amb=False, cap=None):
    parts, notes = [], []
    for f, o in layers:
        if f.startswith('STAB:'):
            x, at = stab(decode(f[5:]))
            notes.append(f'guitar stab cut at {at:.2f}s')
        else:
            x = decode(f, o.get('af'))
            if o.get('front', True) and 'start' not in o and not o.get('tile'): x = trim_front(x)
            if 'start' in o: x = x[int(SR * o['start']):]
            if 'dur' in o and not o.get('tile'): x = fade(x[: int(SR * o['dur'])], 0, min(0.4, o['dur'] / 4))
        x = x * 10 ** (o.get('gain', 0) / 20)
        parts.append((x, int(SR * o.get('delay', 0)), o))
    base = [p for p in parts if not p[2].get('tile')]
    n = max((len(x) + d for x, d, _ in base), default=0)
    if not base: n = int(SR * max(p[2].get('dur', 40) for p in parts))
    if cap: n = min(n, int(SR * cap))
    out = np.zeros((n, 2), np.float32)
    for x, d, o in parts:
        if o.get('tile'): x = tile(x, n - d)
        seg = x[: n - d]
        out[d: d + len(seg)] += seg
    return out, notes


def main():
    report = {}
    for name, (kind, layers) in BEDS.items():
        x, notes = render(layers, amb=kind == 'amb', cap=None if kind == 'amb' else 150)
        if kind == 'amb': x = loopable(x)
        else: x = fade(trim_tail(x), 0.02, 2.5)
        x, lift = level(x, -17)
        encode(x, os.path.join(DST, f'{name}.mp3'))
        report[f'{name}.mp3'] = {'secs': round(len(x) / SR, 1), 'lift': lift, **({'notes': notes} if notes else {})}
    for name, layers in STINGS.items():
        x, notes = render(layers)
        x = fade(trim_tail(x, -50), 0.002, 0.12)
        x, lift = level(x, -14)
        encode(x, os.path.join(DST, 'sfx', f'{name}.mp3'))
        report[f'sfx/{name}.mp3'] = {'secs': round(len(x) / SR, 1), 'lift': lift, **({'notes': notes} if notes else {})}
    for k, v in report.items(): print(f'{k:28s} {v}')
    lifts = {k: v['lift'] for k, v in report.items() if v['lift']}
    print('\nlift (dB given back on playback):', json.dumps(lifts))


if __name__ == '__main__':
    main()
