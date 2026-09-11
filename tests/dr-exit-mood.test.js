// ══════════════════════════════════════════════════════════════════════
// dr-exit-mood.test.js — how she is taking it
// ══════════════════════════════════════════════════════════════════════
//
// Every queen left this show gracious. Not a writing choice — a missing axis:
// the four beats of an elimination are `tierBy: 'always'` except
// `sashay-words`, which keys on her runway persona. Five personalities and
// one emotion.
//
// The engine already knew better. `reactions[n]` is computed every week and
// read in exactly one place, the critique reaction. Measured on a played
// season: a queen whose reaction at the call was `crash-out` left saying
// "That maths is mine and nobody can take it," composed and walking tall.
import { describe, expect, it } from 'vitest';
import { exitMoodFor, EXIT_MOODS } from '../js/dr/exit-mood.js';
import { STAGE_BEATS } from '../js/dr/data/stage-beats.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const q = (over = {}) => ({ stats: { temperament: 5, loyalty: 5, boldness: 5, ...over } });

describe('which mood she leaves in', () => {
  it('answers with a mood the beat actually has a tier for', () => {
    const beat = STAGE_BEATS.find(b => b.id === 'sashay-mood');
    expect(beat, 'the beat is gone').toBeTruthy();
    expect(beat.tiers.map(t => t.id).sort()).toEqual([...EXIT_MOODS].sort());
  });

  it('is bitter when she went off in front of everybody', () => {
    expect(exitMoodFor({ reaction: 'blow-up', record: ['BTM2'], player: q() })).toBe('bitter');
    /* This carried a loyalty gate as well and it fired five times in forty
       seasons — a tier in name only. A blow-up is already the rare event. */
    expect(exitMoodFor({ reaction: 'blow-up', record: ['BTM2'], player: q({ loyalty: 10 }) }))
      .toBe('bitter');
  });

  it('is gutted when she does not hold it together', () => {
    for (const r of ['crash-out', 'tears']) {
      expect(exitMoodFor({ reaction: r, record: ['BTM2'], player: q() })).toBe('gutted');
    }
    // And for the queen whose temperament makes it likely regardless.
    expect(exitMoodFor({ reaction: 'sadness', record: ['BTM2'], player: q({ temperament: 2 }) }))
      .toBe('gutted');
  });

  it('only feels robbed if she has something to have been robbed of', () => {
    const close = { reaction: 'sadness', gap: 0.4, record: [] };
    // A record behind it: she placed, then lost a song by nothing.
    expect(exitMoodFor({ ...close, record: ['WIN', 'BTM2'], player: q() })).toBe('robbed');
    expect(exitMoodFor({ ...close, record: ['HIGH', 'BTM2'], player: q() })).toBe('robbed');
    /* And not otherwise. A queen who never placed and lost a close one has
       no case, and writing her one is the narration flattering her. */
    expect(exitMoodFor({ ...close, record: ['SAFE', 'BTM2'], player: q() })).not.toBe('robbed');
    // Nor when the song was not close at all.
    expect(exitMoodFor({ reaction: 'sadness', gap: 6, record: ['WIN', 'BTM2'], player: q() }))
      .not.toBe('robbed');
  });

  it('is blindsided the first time she is ever down here', () => {
    expect(exitMoodFor({ reaction: 'sadness', record: ['SAFE', 'SAFE', 'BTM2'], player: q() }))
      .toBe('blindsided');
    // Not once she has been in the bottom before.
    expect(exitMoodFor({ reaction: 'sadness', record: ['BTM2', 'SAFE', 'BTM2'], player: q() }))
      .not.toBe('blindsided');
  });

  it('is relieved only when the temperament means it', () => {
    const base = { reaction: 'idgaf', record: ['BTM', 'SAFE', 'BTM2'] };
    expect(exitMoodFor({ ...base, player: q({ temperament: 9 }) })).toBe('relieved');
    /* Otherwise `idgaf` is a performance and she is really something else. */
    expect(exitMoodFor({ ...base, player: q({ temperament: 4 }) })).not.toBe('relieved');
  });

  it('is resigned when she has been down here twice before', () => {
    expect(exitMoodFor({ reaction: 'sadness', record: ['BTM2', 'BTM', 'BTM2'], player: q() }))
      .toBe('resigned');
  });

  it('falls to composed rather than guessing', () => {
    expect(exitMoodFor({ reaction: 'sadness', record: ['BTM2', 'SAFE', 'BTM2'], player: q() }))
      .toBe('composed');
    expect(exitMoodFor({})).toBe('blindsided');   // nothing known: never been down
  });

  it('reads the record BEFORE tonight, not including it', () => {
    /* `record` arrives with tonight's ELIM already pushed. Counting it would
       make every queen look like she had been in the bottom. */
    expect(exitMoodFor({ reaction: 'sadness', record: ['SAFE', 'ELIM'], player: q() }))
      .toBe('blindsided');
  });
});

// ══════════════════════════════════════════════════════════════════════
// AND IT REACHES THE DOOR
// ══════════════════════════════════════════════════════════════════════
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat',
      'wildcard', 'underdog', 'hothead', 'challenge-beast',
      'perceptive-player', 'social-butterfly'][i % 12],
    age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
const play = seed => playDragSeason({
  cast: cast(12, seed * 7919 + 13), seed: seed * 31 + 5, config: {},
  bond: () => 0, addBond: () => {}, popDelta: () => {},
});

describe('the mood beat on a played season', () => {
  const beat = () => STAGE_BEATS.find(b => b.id === 'sashay-mood');
  const fill = () => beat().tiers.forEach(t => {
    t.lines = [1, 2, 3, 4].map(n => `<${t.id} v${n}> {a} at the door.`);
  });
  const clear = () => beat().tiers.forEach(t => { t.lines = []; });

  it('emits nothing while the pools are empty, which is today', () => {
    const found = play(3).rows.flatMap(r => r.dr.scenes)
      .filter(sc => sc.kind === 'stage:sashay-mood');
    expect(found, 'an unwritten pool reached the screen').toEqual([]);
  });

  it('reaches every exit once the pools are written, and before she speaks', () => {
    fill();
    try {
      let exits = 0; let moods = 0;
      for (let s = 1; s <= 6; s++) {
        for (const row of play(s).rows) {
          if (!row.exits.length) continue;
          const kinds = row.dr.scenes.map(x => x.kind);
          const mood = kinds.indexOf('stage:sashay-mood');
          const words = kinds.indexOf('stage:sashay-words');
          if (mood >= 0) {
            moods++;
            /* The room reads her face before she opens her mouth, so a
               firecracker can be visibly devastated and still go out loud. */
            expect(mood, 'she spoke before the room saw her take it')
              .toBeLessThan(words);
          }
          exits++;
        }
      }
      expect(moods, 'no exit got a mood').toBeGreaterThan(0);
      expect(moods / exits, 'most exits should carry one').toBeGreaterThan(0.8);
    } finally { clear(); }
  });

  it('reaches all seven moods across enough seasons', () => {
    fill();
    try {
      const seen = new Set();
      for (let s = 1; s <= 40; s++) {
        for (const row of play(s).rows) {
          for (const sc of row.dr.scenes) {
            if (sc.kind === 'stage:sashay-mood') seen.add(sc.data.tier);
          }
        }
      }
      /* Measured before this was asserted: `bitter` fired 5 times in 40
         seasons behind a second gate, and 18 without it. A tier nobody can
         see is a pool nobody should be asked to write. */
      for (const m of EXIT_MOODS) {
        expect(seen, `${m} never fires on any season`).toContain(m);
      }
    } finally { clear(); }
  });
});
