// The Voice's evening games and the black buzzer (js/ss/evening.js): every statement is
// built from the truth, a truth said once is not said again, a crush cannot cross, and the
// money moves through the ledger.
import { describe, expect, it } from 'vitest';
import { oopsNight, miniSecretsNight, blackBuzzer } from '../js/ss/evening.js';
import { openKitties, expectedTotal, actualTotal } from '../js/ss/kitty.js';

const HOUSE = ['Ana', 'Ben', 'Cleo', 'Dan', 'Eve', 'Finn'];
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function world(bonds = {}) {
  const state = { secrets: HOUSE.map((n, i) => ({ id: `s${i}`, holders: [n], text: `secret ${i}`, found: false })), theories: {}, buzzes: [] };
  openKitties(state, HOUSE, 10000, 0);
  const ctx = { rng: seeded(7), week: 3, stat: () => 7, looks: () => 0, pop: () => 0, play: () => ({}), archetype: () => 'floater',
    bond: (a, b) => bonds[`${a}|${b}`] ?? bonds[`${b}|${a}`] ?? 0, compat: () => true, gender: () => 'f' };
  return { state, ctx };
}

describe('the "Oops" night', () => {
  it('reads only statements that fit somebody, and each truth airs once a season', () => {
    const { state, ctx } = world({ 'Ana|Ben': -4, 'Cleo|Dan': 6, 'Dan|Cleo': 6 });
    state.buzzes.push({ by: 'Eve', target: 'Finn', right: false, guess: 'x' });
    const first = oopsNight(state, ctx, { house: HOUSE });
    expect(first).toBeTruthy();
    const raised = first.statements.flatMap(s => s.raised.map(r => `${s.id}|${r.who}`));
    expect(raised.length).toBeGreaterThan(0);
    for (let w = 4; w < 9; w++) {
      const again = oopsNight(state, { ...ctx, week: w }, { house: HOUSE });
      for (const s of again?.statements || []) for (const r of s.raised) expect(raised).not.toContain(`${s.id}|${r.who}`);
    }
  });
  it('a crush is said back only when the one named likes nobody more', () => {
    // Ana likes Ben most; Ben likes Cleo most: Ana's crush on Ben is not returned
    const { state, ctx } = world({ 'Ana|Ben': 6, 'Ben|Cleo': 8 });
    ctx.stat = (n, k) => (k === 'boldness' ? 10 : 5);
    for (let i = 0; i < 5; i++) {
      const night = oopsNight(state, { ...ctx, rng: seeded(11 + i) }, { house: HOUSE });
      const crush = (night?.statements || []).find(s => s.id === 'crush');
      for (const x of crush?.scene || []) if (x.who === 'Ana') expect(x.back).toBe(false);
    }
  });
  it('every raised sign has a consequence', () => {
    const { state, ctx } = world({ 'Ana|Ben': -5, 'Cleo|Dan': 6 });
    ctx.stat = (n, k) => (k === 'boldness' ? 10 : 5);
    const night = oopsNight(state, ctx, { house: HOUSE });
    const n = night.statements.reduce((k, s) => k + s.raised.length, 0);
    expect(night.effects.pub.length + night.effects.bond.length).toBeGreaterThanOrEqual(n);
  });
});

describe('mini-secrets', () => {
  it('pays and charges through the ledger, and never tells an anecdote twice', () => {
    const { state, ctx } = world({ 'Ana|Ben': 8 });
    const a = miniSecretsNight(state, ctx, { house: HOUSE });
    const b = miniSecretsNight(state, { ...ctx, week: 4 }, { house: HOUSE });
    expect(actualTotal(state)).toBe(expectedTotal(state));
    const subjects = [...a.rounds, ...(b?.rounds || [])].map(r => r.subject);
    expect(new Set(subjects).size).toBe(subjects.length);
    for (const r of a.rounds) expect(r.right ? r.guess : r.subject).toBe(r.subject);
  });
});

describe('the black buzzer', () => {
  it('makes the finder immune this week and nominates somebody else', () => {
    const { state, ctx } = world({ 'Ana|Ben': -6 });
    const bz = blackBuzzer(state, ctx, { house: HOUSE });
    expect(bz.named).not.toBe(bz.finder);
    expect(state.nextImmune[3]).toContain(bz.finder);
    expect(state.rules.dOffice[3]).toContain(bz.named);
  });
});
