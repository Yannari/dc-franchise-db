// ══════════════════════════════════════════════════════════════════════
// dr-challenge-voice.test.js — a Snatch Game does not read like a Rusical
// ══════════════════════════════════════════════════════════════════════
//
// The whole point of maxi-events.js and maxi-performance.js. Both files were
// fully written and read by NOBODY: the renderer used a generic five-tier
// performance beat that did not know which challenge it was narrating, so
// fifty-nine written line sets were invisible and every challenge produced the
// same prose.
//
// These assertions are about difference, because sameness is what was broken.
import { describe, expect, it } from 'vitest';
import { initDragState } from '../js/dr/state.js';
import { runDragWeek } from '../js/dr/week.js';
import { rngFor } from '../js/dr/rng.js';
import { MAXI_EVENTS } from '../js/dr/data/maxi-events.js';
import { familyForChallenge } from '../js/dr/data/maxi-performance.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n = 12, seed = 1) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: i % 2 ? 'villain' : 'hero', age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const ctxFor = (c, seed = 3) => ({
  rng: rngFor(seed), players: Object.fromEntries(c.map(p => [p.name, p])),
  bond: () => 0, addBond: () => {}, popDelta: () => {},
});
const cfg = (over = {}) => ({
  num: 4, maxiId: 'acting', miniId: 'reading', rotatingId: 'ross', guest: null,
  songTitle: 'Toxic', judgeWeights: {}, immunity: false, totalEpisodes: 10,
  allowDoubleShantay: false, allowDoubleSashay: false, ...over,
});

function play(maxiId, seed = 5) {
  const c = cast();
  const st = initDragState({ cast: c, seed, rng: rngFor(seed) });
  return runDragWeek(st, cfg({ maxiId }), ctxFor(c, seed));
}

const perfText = row => (row.dr.scenes || [])
  .filter(s => String(s.kind).startsWith('perform:'))
  .map(s => s.text).filter(Boolean);

describe('the performance beat speaks the challenge', () => {
  it('routes every challenge to a family, never to the generic tier by accident', () => {
    for (const id of ['snatch-game', 'rusical', 'ball', 'makeover', 'roast', 'stand-up',
      'girl-group', 'rumix', 'music-video', 'acting', 'commercial', 'improv',
      'design', 'talent-show', 'lipsync-challenge']) {
      const f = familyForChallenge(id);
      expect(f, id).toBeTruthy();
      expect(f.family, `${id} fell through to generic`).not.toBe('generic');
    }
    // And a type with no module of its own does land on the fallback.
    expect(familyForChallenge('photoshoot').family).toBe('generic');
  });

  it('tags the beat with the family that narrated it', () => {
    const row = play('snatch-game');
    const kinds = (row.dr.scenes || []).map(s => s.kind).filter(k => k.startsWith('perform:'));
    expect(kinds.length, 'no performance beats at all').toBeGreaterThan(0);
    for (const k of kinds) expect(k).toBe('perform:snatch-game');
  });

  it('A SNATCH GAME DOES NOT READ LIKE A RUSICAL', () => {
    // The assertion the two files exist for.
    const snatch = perfText(play('snatch-game'));
    const rusical = perfText(play('rusical'));
    expect(snatch.length, 'the snatch game narrated nothing').toBeGreaterThan(3);
    expect(rusical.length, 'the rusical narrated nothing').toBeGreaterThan(3);
    const shared = snatch.filter(t => rusical.includes(t));
    expect(shared, `these lines appeared in both: ${shared[0] || ''}`).toEqual([]);
  });

  it('and neither reads like a makeover, a roast or a ball', () => {
    const seen = {};
    for (const id of ['snatch-game', 'rusical', 'makeover', 'roast', 'ball', 'improv']) {
      seen[id] = new Set(perfText(play(id)));
    }
    const ids = Object.keys(seen);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const overlap = [...seen[ids[i]]].filter(t => seen[ids[j]].has(t));
        expect(overlap, `${ids[i]} and ${ids[j]} share a line`).toEqual([]);
      }
    }
  });
});

describe('the challenge events are narrated', () => {
  it('a written event reaches the row with its prose, not as a bare type', () => {
    // Play enough weeks that some named event fires and check it carried text.
    let found = null;
    for (let s = 0; s < 25 && !found; s++) {
      for (const id of ['snatch-game', 'girl-group', 'ball', 'roast']) {
        const row = play(id, s);
        const scene = (row.dr.scenes || []).find(x => String(x.kind).startsWith('maxi:') && x.text);
        if (scene) { found = scene; break; }
      }
    }
    expect(found, 'no challenge event ever reached the row with prose').toBeTruthy();
    expect(found.data.event).toBeTruthy();
    expect(found.data.from, 'the scene does not say which challenge it came from').toBeTruthy();
    expect(found.text.length).toBeGreaterThan(50);
  });

  it('every narrated event id is one the pool actually knows', () => {
    const known = new Set(MAXI_EVENTS.map(e => e.id));
    for (let s = 0; s < 10; s++) {
      for (const id of ['snatch-game', 'girl-group', 'ball', 'roast', 'makeover', 'acting']) {
        for (const sc of play(id, s).dr.scenes || []) {
          if (!String(sc.kind).startsWith('maxi:')) continue;
          expect(known, `${sc.kind} is narrated but not in the pool`).toContain(sc.data.event);
        }
      }
    }
  });
});
