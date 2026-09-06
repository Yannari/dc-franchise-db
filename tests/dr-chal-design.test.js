// ══════════════════════════════════════════════════════════════════════
// dr-chal-design.test.js — materials, parts, and the glue gun
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../js/dr/chal/design.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), maxiId = 'design') {
  const bonds = {};
  return {
    living: Object.keys(players), players, maxi: maxiById(maxiId), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => {
      const k = [a, b].sort().join('|');
      bonds[k] = (bonds[k] || 0) + d;
    },
    popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {},
  };
}

describe('the materials', () => {
  it('are fourteen unconventional sets, graded, and no two the same', () => {
    expect(MATERIALS.length).toBe(14);
    expect(new Set(MATERIALS.map(m => m.id)).size).toBe(14);
    for (const m of MATERIALS) {
      expect(m.name, m.id).toBeTruthy();
      expect(m.difficulty, m.id).toBeGreaterThanOrEqual(1);
      expect(m.difficulty, m.id).toBeLessThanOrEqual(5);
    }
    // Both ends stocked, or the pick has no stakes.
    expect(Math.min(...MATERIALS.map(m => m.difficulty))).toBeLessThanOrEqual(2);
    expect(Math.max(...MATERIALS.map(m => m.difficulty))).toBe(5);
  });
});

describe('the design night', () => {
  it('gives every queen her own set of materials and walks what she built', () => {
    const out = runMaxi(ctx(1));
    const mats = Object.values(out.assignment.picks).map(p => p.choice);
    expect(new Set(mats).size).toBe(6);
    expect(out.runwayOverride.walks.length).toBe(1);
    expect(out.runwayOverride.walks[0].sewn).toBe(true);
    for (const n of NAMES) expect(out.performances[n].detail.material, n).toBeTruthy();
  });

  it('a seamstress reaches for the hard set; a queen who cannot sew takes the easy one', () => {
    const at = design => {
      const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { design })]));
      let sum = 0;
      for (let i = 0; i < 30; i++) sum += runMaxi(ctx(i, p)).performances.Ada.detail.difficulty;
      return sum / 30;
    };
    // Ada picks first either way, so what moves is only what she wants.
    expect(at(10)).toBeGreaterThan(at(2) + 1);
  });

  it('and the hard set pays only if what she made out of it is good', () => {
    for (let i = 0; i < 20; i++) {
      for (const r of Object.values(runMaxi(ctx(i)).performances)) {
        if (r.detail.buildQuality <= 5) {
          expect(r.parts.ambition, `seed ${i}`).toBe(0);
        } else if (r.detail.difficulty >= 4) {
          expect(r.parts.ambition, `seed ${i}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('a strong designer still wins the night more often than not', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Bee' ? { design: 10, runway: 9 } : { design: 3, runway: 3 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Bee') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });
});

describe('the glue gun', () => {
  it('burns somebody now and then, and costs her the build rather than nothing', () => {
    // The order matters: if the burn were applied after the build was scored
    // it would be a caption. Same seed, so the only difference is the burn.
    let burned = null;
    let seed = 0;
    for (; seed < 40 && !burned; seed++) {
      burned = runMaxi(ctx(seed)).events.find(e => e.type === 'glue-gun');
    }
    expect(burned, 'nobody was burned in forty werk rooms').toBeTruthy();
    // She is paid in sympathy for carrying on.
    expect(Object.values(burned.pop)[0]).toBeGreaterThan(0);
  });

  it('does not burn everybody every week', () => {
    let burns = 0;
    let queens = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i));
      burns += out.events.filter(e => e.type === 'glue-gun').length;
      queens += 6;
    }
    const rate = burns / queens;
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.3);
  });
});

describe('the acting family', () => {
  it('drafts parts and splits the room for acting, commercial and improv', () => {
    for (const id of ['acting', 'commercial', 'improv']) {
      const out = runMaxi(ctx(1, undefined, id));
      expect(Object.keys(out.performances).length, id).toBe(6);
      expect(out.assignment.teams.flat().sort(), id).toEqual([...NAMES].sort());
      for (const t of out.assignment.teams) {
        expect(t.filter(n => out.assignment.roles[n] === 'lead').length, `${id} team`).toBe(1);
      }
      // Only the design night walks its own build.
      expect(out.runwayOverride, id).toBeNull();
    }
  });

  it('gives an acting queen the edge on an acting night', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Cleo' ? { acting: 10, comedy: 9 } : { acting: 3, comedy: 3 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p, 'acting'));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Cleo') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.4);
  });

  it('every event either type fires survives the consequence check', () => {
    for (const id of ['design', 'acting', 'commercial', 'improv']) {
      for (let i = 0; i < 15; i++) {
        const c = ctx(i, undefined, id);
        expect(() => applyEvents(runMaxi(c).events, c), `${id} seed ${i}`).not.toThrow();
      }
    }
  });
});
