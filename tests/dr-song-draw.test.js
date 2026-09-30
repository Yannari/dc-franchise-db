// ══════════════════════════════════════════════════════════════════════
// dr-song-draw.test.js — every kind of lip sync is equally likely
// ══════════════════════════════════════════════════════════════════════
//
// The user's rule: adding songs must not change the odds of the KIND of
// lip sync. Drawn uniformly from the bank, 109 fierce songs to 54 sad ones
// made a fierce lip sync twice as likely as a sad one. drawSong picks the
// mood, then the tempo, then the song.
import { describe, expect, it } from 'vitest';
import { SONGS, drawSong, LIPSYNC_MOODS, LIPSYNC_TEMPOS, MIN_CELL } from '../js/dr/data/songs.js';
import { rngFor } from '../js/dr/rng.js';

const N = 50000;
const rng = rngFor(20260930);
const draws = Array.from({ length: N }, () => drawSong(rng));
const share = (key, v) => draws.filter(s => s[key] === v).length / N;

describe('the draw', () => {
  it('gives every mood one lip sync in five', () => {
    for (const m of LIPSYNC_MOODS) expect(Math.abs(share('mood', m) - 0.2), m).toBeLessThan(0.01);
  });

  it('gives every tempo its equal share within each mood that has it', () => {
    for (const m of LIPSYNC_MOODS) {
      const inMood = draws.filter(s => s.mood === m);
      const tempos = LIPSYNC_TEMPOS.filter(t => SONGS.filter(s => s.mood === m && s.tempo === t).length >= MIN_CELL);
      for (const t of tempos) {
        const got = inMood.filter(s => s.tempo === t).length / inMood.length;
        expect(Math.abs(got - 1 / tempos.length), `${m} ${t}`).toBeLessThan(0.02);
      }
    }
  });

  it('keeps ballads a real share, not a rarity (was 8% of the bank)', () => {
    expect(share('tempo', 'ballad')).toBeGreaterThan(0.15);
  });

  it('reaches every song in a drawable corner', () => {
    const drawable = SONGS.filter(s => SONGS.filter(x => x.mood === s.mood && x.tempo === s.tempo).length >= MIN_CELL);
    const seen = new Set(draws.map(s => s.title));
    expect(drawable.filter(s => !seen.has(s.title)).map(s => s.title)).toEqual([]);
    expect(drawable.length / SONGS.length).toBeGreaterThan(0.95);   // a thin corner strands almost nothing
  });

});
