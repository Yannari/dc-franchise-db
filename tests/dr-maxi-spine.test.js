// ══════════════════════════════════════════════════════════════════════
// dr-maxi-spine.test.js — one challenge, whichever type it is
// ══════════════════════════════════════════════════════════════════════
//
// The contract every challenge module fills in. The assertion that matters
// most is the last one: an event that changes nothing THROWS, because a
// cosmetic event is not a small problem — it is a scene the viewer is shown
// that the season does not remember.
import { describe, expect, it, vi } from 'vitest';
import { runMaxi, applyEvents, moduleFor, CHAL_MODULES } from '../js/dr/maxi.js';
import * as generic from '../js/dr/chal/_generic.js';
import { canScheme, canHelp, evt } from '../js/dr/rules.js';
import { maxiById, MAXI_TYPES } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
  ...over,
});
const CAST = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'].map(n => mk(n));

function ctxFor(maxiId, seed = 1, over = {}) {
  const bonds = {};
  const players = over.players || Object.fromEntries(CAST.map(p => [p.name, p]));
  return {
    living: Object.keys(players),
    players,
    maxi: maxiById(maxiId),
    rng: rngFor(seed),
    state: {
      record: Object.fromEntries(Object.keys(players).map(n => [n, []])),
      star: {}, flags: {}, out: [],
      lipsyncRecord: Object.fromEntries(Object.keys(players).map(n => [n, []])),
    },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => { const k = [a, b].sort().join('|'); bonds[k] = (bonds[k] || 0) + d; },
    popDelta: vi.fn(),
    miniWinner: Object.keys(players)[0],
    cfg: {},
    _bonds: bonds,
    ...over,
  };
}

describe('the spine', () => {
  it('runs the three hooks and returns one entry per living queen', () => {
    const out = runMaxi(ctxFor('acting'));
    expect(Object.keys(out.performances).sort()).toEqual(CAST.map(p => p.name).sort());
    expect(Object.keys(out.prep).length).toBe(6);
    expect(out.assignment.order.length).toBe(6);
    for (const p of Object.values(out.performances)) expect(Number.isFinite(p.perf)).toBe(true);
  });

  it('falls back to the generic module for a type with no file', () => {
    expect(moduleFor('photoshoot')).toBe(generic);
    expect(moduleFor('nonsense')).toBe(generic);
    expect(Number.isFinite(runMaxi(ctxFor('photoshoot')).performances.Ada.perf)).toBe(true);
  });

  it('every registered id is a real maxi type and exports at least one hook', () => {
    for (const [id, mod] of Object.entries(CHAL_MODULES)) {
      expect(maxiById(id), `${id} is registered but is not a challenge`).toBeTruthy();
      expect(!!(mod.assign || mod.prepare || mod.perform), `${id} exports no hook`).toBe(true);
    }
  });

  it('plays every type in the catalogue without throwing', () => {
    for (const m of MAXI_TYPES) {
      const ctx = ctxFor(m.id, 3);
      expect(() => runMaxi(ctx), m.id).not.toThrow();
    }
  });

  it('the mini winner leads the order when the type drafts', () => {
    expect(runMaxi(ctxFor('snatch-game')).assignment.order[0]).toBe('Ada');
  });

  it('a role type drafts every queen, and records the pick under her name', () => {
    const out = runMaxi(ctxFor('acting'));
    for (const n of Object.keys(out.performances)) {
      expect(out.assignment.roles[n], `${n} has no role`).toBeTruthy();
      expect(out.assignment.picks[n].name).toBe(n);
      expect(typeof out.assignment.picks[n].ducked).toBe('boolean');
    }
    // Two teams, so two leads: one ladder across the room would hand one team
    // both big parts and leave the other with none.
    const leads = Object.values(out.assignment.roles).filter(r => r === 'lead');
    expect(leads.length).toBe(2);
  });

  it('a captains type splits the room without losing or cloning anybody', () => {
    const out = runMaxi(ctxFor('choreography'));
    expect(out.assignment.teams.length).toBe(2);
    expect(out.assignment.teams.flat().sort()).toEqual(CAST.map(p => p.name).sort());
  });

  it('is seeded: the same seed gives the same result', () => {
    expect(JSON.stringify(runMaxi(ctxFor('acting', 4)).performances))
      .toBe(JSON.stringify(runMaxi(ctxFor('acting', 4)).performances));
    expect(JSON.stringify(runMaxi(ctxFor('acting', 4)).performances))
      .not.toBe(JSON.stringify(runMaxi(ctxFor('acting', 5)).performances));
  });

  it('every scene it emits names a step the week knows', () => {
    const STEPS = new Set(['cold-open', 'werk-morning', 'mini', 'maxi-announce', 'choice', 'prep',
      'maxi-pre', 'werk-elim-day', 'main-stage', 'runway', 'maxi-main', 'critiques',
      'untucked', 'results', 'lipsync', 'exit']);
    for (const m of MAXI_TYPES) {
      for (const sc of runMaxi(ctxFor(m.id, 2)).scenes) {
        expect(STEPS.has(sc.step), `${m.id} emitted step "${sc.step}"`).toBe(true);
        expect(sc.kind, `${m.id} emitted a scene with no kind`).toBeTruthy();
      }
    }
  });
});

describe('applyEvents', () => {
  it('writes bonds, popularity and state, and reports what it wrote', () => {
    const ctx = ctxFor('acting');
    const summary = applyEvents([
      evt('help', { players: ['Ada', 'Bee'], bond: [['Ada', 'Bee', 1.5]], pop: { Ada: 2 } }),
      evt('sabotage', { players: ['Cleo', 'Dot'], bond: [['Cleo', 'Dot', -2]], pop: { Cleo: -3 }, state: { blamed: 'Cleo' } }),
    ], ctx);
    expect(ctx._bonds['Ada|Bee']).toBe(1.5);
    expect(ctx._bonds['Cleo|Dot']).toBe(-2);
    expect(ctx.popDelta).toHaveBeenCalledWith('Ada', 2);
    expect(ctx.popDelta).toHaveBeenCalledWith('Cleo', -3);
    expect(ctx.state.flags.blamed).toBe('Cleo');
    expect(summary).toEqual({ bonds: 2, pop: 2, state: 1 });
  });

  it('REFUSES an event that changes nothing', () => {
    expect(() => applyEvents([evt('nothing', { players: ['Ada'] })], ctxFor('acting')))
      .toThrow(/consequence/i);
  });

  it('and every event any type fires survives it', () => {
    for (const m of MAXI_TYPES) {
      for (let s = 0; s < 8; s++) {
        const ctx = ctxFor(m.id, s);
        const out = runMaxi(ctx);
        expect(() => applyEvents(out.events, ctx), `${m.id} seed ${s}`).not.toThrow();
        for (const e of out.events) {
          expect(Array.isArray(e.players) && e.players.length, `${m.id}: "${e.type}" names nobody`).toBeTruthy();
        }
      }
    }
  });
});

describe('the archetype law', () => {
  it('canScheme follows it exactly', () => {
    expect(canScheme(mk('V', { archetype: 'villain' }))).toBe(true);
    expect(canScheme(mk('M', { archetype: 'mastermind' }))).toBe(true);
    expect(canScheme(mk('H', { archetype: 'hero' }))).toBe(false);
    expect(canScheme(mk('G', { archetype: 'goat' }))).toBe(false);
    // Neutral: both calculating AND disloyal, or not at all.
    expect(canScheme(mk('N', { archetype: 'floater', stats: { strategic: 7, loyalty: 3 } }))).toBe(true);
    expect(canScheme(mk('N2', { archetype: 'floater', stats: { strategic: 7, loyalty: 8 } }))).toBe(false);
    expect(canScheme(mk('N3', { archetype: 'hothead', stats: { strategic: 3, loyalty: 2 } }))).toBe(false);
    expect(canHelp(mk('H', { archetype: 'hero' }))).toBe(true);
  });

  it('and no nice archetype ever sabotages, at any type or seed', () => {
    const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
    const BAD = new Set(['sabotage', 'stole-a-bit', 'dump', 'spotlight-hog']);
    // A room that hates each other, so a sabotage is available to anybody
    // willing — the only thing stopping them should be who they are.
    const players = Object.fromEntries(
      ['Ada', 'Bee', 'Cleo', 'Dot'].map((n, i) => [n, mk(n, {
        archetype: ['hero', 'loyal-soldier', 'goat', 'underdog'][i],
        drag: { acting: 9, comedy: 9, dance: 9, design: 9, runway: 9, lipsync: 9, singing: 9 },
      })]));
    for (const m of MAXI_TYPES) {
      // Spread seeds: consecutive ones all start this LCG in the same narrow
      // band, which would quietly test one branch six times over. See rng.js.
      for (let i = 0; i < 6; i++) {
        const s = i * 7919 + 13;
        const bonds = {};
        for (const a of Object.keys(players)) for (const b of Object.keys(players)) {
          if (a !== b) bonds[[a, b].sort().join('|')] = -9;
        }
        const ctx = ctxFor(m.id, s, { players, bond: (a, b) => bonds[[a, b].sort().join('|')] || 0 });
        for (const e of runMaxi(ctx).events) {
          if (!BAD.has(e.type)) continue;
          const actor = players[e.players[0]];
          expect(NICE.has(actor.archetype), `${m.id}: a ${actor.archetype} fired ${e.type}`).toBe(false);
        }
      }
    }
  });
});
