# A bed is cut where the music repeats, and the file carries music before and after its loop, so the loop goes
# round without a jump in the music or the encoder's silence (2026-10-21: "the music loop doesnt work well").
#   python -m pytest tools/test_rr_vp_audio_loop.py -q
import importlib.util, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('au', os.path.join(ROOT, 'tools', 'rr-vp-audio.py'))
au = importlib.util.module_from_spec(spec); spec.loader.exec_module(au)
SR = au.SR


def song(bar=2.0, intro=6.0, total=80.0, seed=1):
    # an intro of a different sound, then a 4-bar phrase on repeat: four chords a bar apart and a kick on every beat
    rng = np.random.default_rng(seed)
    t = np.arange(int(total * SR)) / SR
    chords = [(220, 277, 330), (196, 247, 294), (175, 220, 262), (165, 208, 247)]
    phrase = 4 * bar
    x = np.zeros_like(t)
    for i, ch in enumerate(chords):
        on = ((t - intro) % phrase >= i * bar) & ((t - intro) % phrase < (i + 1) * bar)
        x += on * sum(np.sin(2 * np.pi * f * t) for f in ch) / 3
    beat = bar / 4
    x += 0.6 * np.exp(-((t - intro) % beat) * 30) * np.sin(2 * np.pi * 60 * t)
    x[t < intro] = 0.3 * rng.standard_normal(int((t < intro).sum()))
    return x.astype(np.float32), phrase, intro


def test_the_loop_is_a_whole_number_of_phrases_after_the_intro():
    x, phrase, intro = song()
    a, n = au.find_loop(x, 30)
    assert a / SR >= intro
    reps = (n / SR) / phrase
    assert abs(reps - round(reps)) * phrase < 0.005, (n / SR, phrase)
    assert 20 <= n / SR <= 45


def test_the_file_goes_round_the_same_wherever_the_decoder_starts_it():
    x, phrase, intro = song()
    a, n = au.find_loop(x, 30)
    y, (s, e) = au.make_bed(x, a, n)
    i, j = round(s * SR), round(e * SR)
    assert j - i == n
    # whatever the decoder adds at the front (up to the run before the loop), the loop sounds the same at both ends
    assert np.allclose(y[i:i + int(0.5 * SR)], y[j:j + int(0.5 * SR)], atol=1e-6)
    assert np.allclose(y[i - int(0.5 * SR):i], y[j - int(0.5 * SR):j], atol=0.02)
