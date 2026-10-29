// Love in the House of Secrets (js/ss/love.js, js/vp-bb-ep/ss-love.js): the user, 2026-10-29, "build the love room too
// and more romance storylines", "and more dialogue nominations in the sas when one of them goes strategy to put the
// couple in the sas".
import { describe, expect, it } from 'vitest';
import { loveWeek } from '../js/ss/love.js';
import { nominationWish } from '../js/ss/nominations.js';
import { ssLoveScreen } from '../js/vp-bb-ep/ss-love.js';

const BONDS = { 'Ana|Ben': 7, 'Cy|Di': 4, 'Ana|Cy': -2, 'Ben|Cy': -2, 'Ana|Di': -2, 'Ben|Di': -2 };
const bond = (a, b) => BONDS[[a, b].sort().join('|')] ?? 0;
const ctx = (r = 0.1, week = 4) => ({ rng: () => r, week, bond, stat: (n, k) => (k === 'strategic' && (n === 'Cy' || n === 'Di') ? 8 : 5), archetype: () => 'floater', compat: () => true });
const house = ['Ana', 'Ben', 'Cy', 'Di', 'Ed'];
const couples = [{ a: 'Ana', b: 'Ben', phase: 'honeymoon', weeks: 3 }];

describe('the Love Room', () => {
  it('is given to a couple once, and brings them closer', () => {
    const state = { secrets: [] };
    const first = loveWeek(state, ctx(0.1, 4), { house, couples });
    const room = first.find(x => x.kind === 'loveroom');
    expect(room).toMatchObject({ a: 'Ana', b: 'Ben' });
    expect(room.effects.bond).toContainEqual(['Ana', 'Ben', 1.5]);
    const again = loveWeek(state, ctx(0.1, 5), { house, couples });
    expect(again.some(x => x.kind === 'loveroom')).toBe(false);
  });
  it('plays in the Love Room, a night and a morning after', () => {
    const scr = ssLoveScreen({ kind: 'loveroom', a: 'Ana', b: 'Ben', wary: ['Cy'] }, { week: 4, house }, { ssv: (t, o = {}) => ({ k: 'voice', t, ...o }) });
    expect(scr.steps.length).toBeGreaterThanOrEqual(15);
    expect(scr.steps.some(st => st.scene?.room === 'The Love Room' && st.scene.plate === 'hoh-suite')).toBe(true);
  });
});

describe('the plot to split a couple', () => {
  it('two who would split them agree to, and nominate them for it', () => {
    const state = { secrets: [], love: { rooms: [{ a: 'Ana', b: 'Ben', week: 2 }], log: [] } };
    let plot = null;
    for (let i = 0; i < 20 && !plot; i++) plot = loveWeek(state, ctx(0.97, 6 + i), { house, couples }).find(x => x.kind === 'plot');
    expect(plot).toBeTruthy();
    expect([plot.c, plot.d].sort()).toEqual(['Cy', 'Di']);
    const wk = state.love.log.find(x => x.kind === 'plot').week;
    const w = nominationWish(state, { ...ctx(0.5, wk), pop: () => 0 }, 'Cy', 'Ana');
    expect(w.reason).toBe('the-couple');
  });
});
