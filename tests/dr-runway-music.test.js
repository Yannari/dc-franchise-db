// ══════════════════════════════════════════════════════════════════════
// dr-runway-music.test.js — the runway theme, looped on the beat
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { beatLoop } from '../js/vp-dr/beat-loop.js';
import { runwaySongFor, pickPreview } from '../js/vp-dr/music.js';
import { RUNWAY_SONGS } from '../js/dr/data/runway-songs.js';

/* A club record in miniature: a kick on every beat, a hat on the off-beat,
   thirty seconds with a fade at each end, like a store clip. */
function clip(bpm, secs = 30, sr = 22050, phase = 0.23) {
  const x = new Float32Array(secs * sr);
  const beat = 60 / bpm;
  for (let t = phase; t < secs; t += beat) {
    const k = Math.round(t * sr);
    for (let i = 0; i < sr * 0.12 && k + i < x.length; i++) x[k + i] += Math.sin(2 * Math.PI * 55 * i / sr) * Math.exp(-i / (sr * 0.04));
    const h = Math.round((t + beat / 2) * sr);
    for (let i = 0; i < sr * 0.02 && h + i < x.length; i++) x[h + i] += (Math.random() * 2 - 1) * 0.15 * Math.exp(-i / (sr * 0.005));
  }
  for (let i = 0; i < sr; i++) { x[i] *= i / sr; x[x.length - 1 - i] *= i / sr; }
  return { x, sr };
}

describe('the beat finder', () => {
  for (const bpm of [118, 124, 128, 132]) {
    it(`finds ${bpm} BPM and loops whole bars of it`, () => {
      const { x, sr } = clip(bpm);
      const L = beatLoop(x, sr);
      expect(L).toBeTruthy();
      expect(Math.abs(L.bpm - bpm)).toBeLessThan(0.6);
      const bar = 4 * 60 / bpm;
      const bars = (L.loopTo - L.loopFrom) / bar;
      expect(Math.abs(bars - Math.round(bars)), `${bars} bars`).toBeLessThan(0.02);   // a seam within ~40 ms of the grid
      expect(L.loopFrom).toBeGreaterThanOrEqual(1);     // past the fade-in
      expect(L.loopTo).toBeLessThanOrEqual(29);         // before the fade-out
      // both ends on a kick
      const beat = 60 / bpm;
      for (const t of [L.loopFrom, L.loopTo]) {
        const off = ((t - 0.23) / beat) % 1;
        expect(Math.min(off, 1 - off) * beat, `${t}s is off the beat`).toBeLessThan(0.02);
      }
    });
  }

  it('declines a clip too short to hold four bars', () => {
    const { x, sr } = clip(124, 8);
    expect(beatLoop(x, sr)).toBe(null);
  });
});

describe('the runway theme', () => {
  it('is one song per season, the same on a replay', () => {
    expect(runwaySongFor(4000)).toBe(runwaySongFor(4000));
    const heard = new Set(Array.from({ length: 200 }, (_, i) => runwaySongFor(i * 1000 + 7).title));
    expect(heard.size).toBeGreaterThan(RUNWAY_SONGS.length * 0.8);   // the whole playlist gets walked to
  });

  it('matches every title against its own store listing', () => {
    // The titles are spelled as the store spells them, so each is its own best match.
    for (const s of RUNWAY_SONGS) {
      const self = { trackName: s.title, artistName: s.artist, previewUrl: 'x' };
      const cover = { trackName: s.title, artistName: 'Drag Karaoke Stars', previewUrl: 'y' };
      expect(pickPreview([cover, self], s.title, s.artist)?.previewUrl, s.title).toBe('x');
    }
  });
});
