// ══════════════════════════════════════════════════════════════════════
// dr-consequences.test.js — every event, on every type, changes something
// ══════════════════════════════════════════════════════════════════════
//
// THE RULE THIS ENFORCES is the project's oldest and most-broken one: an event
// that changes nothing is decoration. A scene the viewer is shown that the
// season does not remember.
//
// Every maxi type is played here on a real cast with real bonds, so a module
// added later cannot quietly ship a cosmetic beat. When this goes red it names
// the module and the event: fix the module, never the sweep.
import { describe, expect, it } from 'vitest';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'loyal-soldier'];

function cast(n, seed) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 20 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function ctxFor(maxi, seed) {
  const c = cast(Math.max(maxi.minCast, 8), seed);
  const bonds = {};
  for (let i = 0; i < c.length; i++) {
    for (let j = i + 1; j < c.length; j++) {
      // A room with real friendships AND real enemies, so every event that
      // needs one or the other has something to fire on.
      bonds[[c[i].name, c[j].name].sort().join('|')] =
        Math.round((rngFor(seed * 7919 + i * 31 + j)() - 0.5) * 16);
    }
  }
  return {
    living: c.map(p => p.name),
    players: Object.fromEntries(c.map(p => [p.name, p])),
    maxi, rng: rngFor(seed * 7919 + 13),
    state: {
      record: Object.fromEntries(c.map(p => [p.name, []])), flags: {},
      out: ['Gone', 'Past'],
      lipsyncRecord: Object.fromEntries(c.map(p => [p.name, []])),
    },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => {
      const k = [a, b].sort().join('|');
      bonds[k] = (bonds[k] || 0) + d;
    },
    popDelta: () => {}, miniWinner: c[0].name, mini: null, cfg: {},
  };
}

describe('every event, on every maxi type, changes something', () => {
  for (const maxi of MAXI_TYPES) {
    it(`${maxi.id}`, () => {
      const seen = new Set();
      for (let s = 0; s < 25; s++) {
        const ctx = ctxFor(maxi, s);
        const out = runMaxi(ctx);

        expect(Object.keys(out.performances).length, maxi.id).toBe(ctx.living.length);
        for (const n of ctx.living) {
          expect(Number.isFinite(out.performances[n].perf), `${maxi.id}/${n}`).toBe(true);
        }
        for (const e of out.events) {
          seen.add(e.type);
          const changes = e.bond.length + Object.keys(e.pop).length + Object.keys(e.state).length;
          expect(changes, `${maxi.id}: event "${e.type}" is cosmetic`).toBeGreaterThan(0);
          expect(Array.isArray(e.players) && e.players.length,
            `${maxi.id}: "${e.type}" names nobody`).toBeTruthy();
        }
        expect(() => applyEvents(out.events, ctx), `${maxi.id} seed ${s}`).not.toThrow();
      }
      // A type whose twenty-five runs fired nothing at all has no social layer,
      // which is a different bug from a cosmetic event and just as real.
      expect(seen.size, `${maxi.id} fired no events in 25 runs`).toBeGreaterThan(0);
    });
  }
});

describe('the archetype law holds across every type', () => {
  it('no nice archetype ever sabotages, steals, dumps or hogs', () => {
    const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
    const BAD = new Set(['sabotage', 'stole-a-bit', 'dump', 'spotlight-hog']);
    for (const maxi of MAXI_TYPES) {
      for (let s = 0; s < 12; s++) {
        const ctx = ctxFor(maxi, s + 500);
        for (const e of runMaxi(ctx).events) {
          if (!BAD.has(e.type)) continue;
          const actor = ctx.players[e.players[0]];
          expect(NICE.has(actor.archetype),
            `${maxi.id}: a ${actor.archetype} fired ${e.type}`).toBe(false);
        }
      }
    }
  });
});

describe('every scene names a step the week knows', () => {
  const STEPS = new Set(['cold-open', 'werk-morning', 'mini', 'maxi-announce', 'choice', 'prep',
    'maxi-pre', 'werk-elim-day', 'main-stage', 'runway', 'maxi-main', 'critiques',
    'untucked', 'results', 'lipsync', 'exit']);
  it('across all types and twelve seeds each', () => {
    for (const maxi of MAXI_TYPES) {
      for (let s = 0; s < 12; s++) {
        for (const sc of runMaxi(ctxFor(maxi, s + 900)).scenes) {
          expect(STEPS.has(sc.step), `${maxi.id} emitted step "${sc.step}"`).toBe(true);
          expect(sc.kind, `${maxi.id} emitted a scene with no kind`).toBeTruthy();
        }
      }
    }
  });
});
