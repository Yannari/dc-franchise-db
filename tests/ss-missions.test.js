// The Voice's missions (part 2 design §7).
import { describe, it, expect } from 'vitest';
import { handOutMissions, playMissions, settleMissions, MISSIONS, missionById, missionsOf } from '../js/ss/missions.js';
import { openKitties, actualTotal, expectedTotal } from '../js/ss/kitty.js';
import { seededRandom } from './helpers/rng.js';

const S = (holders, text) => ({ id: `s-${holders.join('-')}`, holders, text, kind: 'personal', secretKind: 'past', clues: ['a key', 'an old photo', 'the word "before"'], tells: ['x'], difficulty: 0.5, found: false });
const NAMES = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
function fresh() { const state = { secrets: NAMES.map(n => S([n], `secret of ${n}`)) }; openKitties(state, NAMES); return state; }
const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const ctx = (r, arch = () => 'floater', stat = () => 5) => ({ rng: r, week: 3, stat, bond: () => 0, archetype: arch });

describe('missions', () => {
  it('nobody gets two at once, and a pair is never two holders of one secret', () => {
    const r = rngFor(1);
    for (let i = 0; i < 100; i++) {
      const state = fresh();
      handOutMissions(state, ctx(r), { house: NAMES, count: 3 });
      const held = missionsOf(state).flatMap(m => m.holders);
      expect(new Set(held).size).toBe(held.length);
    }
  });
  it('a nice archetype is never handed a sabotage', () => {
    const r = rngFor(2);
    for (let i = 0; i < 300; i++) {
      const state = fresh();
      handOutMissions(state, ctx(r, () => 'hero'), { house: NAMES, count: 2 });
      expect(missionsOf(state).some(m => missionById(m.missionId).sabotage)).toBe(false);
    }
  });
  it('a fake couple played by smooth talkers fools the house more often than one played badly', () => {
    let smooth = 0, clumsy = 0;
    const r1 = rngFor(3), r2 = rngFor(4);
    for (let i = 0; i < 200; i++) {
      for (const [stat, r, inc] of [[() => 9, r1, () => smooth++], [() => 1, r2, () => clumsy++]]) {
        const state = fresh();
        state.missions = [{ id: 'm', missionId: 'fake-couple', week: 3, holders: ['Ana', 'Ben'], text: 'x', reward: 5000, status: 'active', deadlineWeek: 3 }];
        const c = ctx(r, () => 'floater', (n, k) => (['Ana', 'Ben'].includes(n) ? stat() : 5));
        playMissions(state, c, { house: NAMES });
        if (settleMissions(state, c, { house: NAMES })[0].won) inc();
      }
    }
    expect(smooth).toBeGreaterThan(clumsy + 60);
  });
  it('pays a winner from the Voice and is honest about it in the ledger', () => {
    const state = fresh();
    state.missions = [{ id: 'm', missionId: 'get-nominated', week: 3, holders: ['Ana'], target: 'Cy', text: 'x', reward: 4000, status: 'active', deadlineWeek: 3 }];
    const [res] = settleMissions(state, ctx(rngFor(5)), { house: NAMES, nominees: ['Cy', 'Ed'] });
    expect(res.won).toBe(true);
    expect(state.kitty.Ana).toBe(14000);
    expect(actualTotal(state)).toBe(expectedTotal(state));
  });
});

describe('the catalog', () => {
  it('is ranked, varied, and every entry is playable and has its lines', () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(MISSIONS.map(m => m.id)).size).toBe(MISSIONS.length);
    for (const t of [1, 2, 3]) expect(MISSIONS.filter(m => m.tier === t).length).toBeGreaterThan(3);
    for (const m of MISSIONS) {
      expect(['belief', 'bond', 'event', 'bait', 'endurance']).toContain(m.judged);
      expect(m.text('A', 'B', 'T').length).toBeGreaterThan(20);
      expect(m.say.give && m.say.won && m.say.lost).toBeTruthy();
      if (m.judged === 'belief' || m.judged === 'bait') expect(m.belief).toBeTruthy();
    }
  });
  it('never hands the same mission twice in a season, and at most one big one', () => {
    const r = rngFor(31);
    const state = fresh();
    for (let w = 1; w <= 12; w++) handOutMissions(state, { rng: r, week: w, stat: () => 5, bond: () => 0, archetype: () => 'villain' }, { house: NAMES, count: 2 })
      .forEach(() => {}), missionsOf(state).forEach(m => { if (m.deadlineWeek <= w) m.status = 'won'; });
    const ids = missionsOf(state).map(m => m.missionId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(missionsOf(state).filter(m => m.tier === 1).length).toBeLessThanOrEqual(1);
    expect(ids.length).toBeGreaterThan(10);
  });
  it('a baited mission is won only when somebody buzzes the lie', () => {
    const state = fresh();
    state.missions = [{ id: 'm', missionId: 'bait-a-buzz', week: 3, holders: ['Ana'], text: 'x', reward: 5000, status: 'active', deadlineWeek: 3 }];
    state.buzzes = [{ week: 3, by: 'Ben', target: 'Ana', guess: 'I was wrongly accused of something', outcome: 'wrong' }];
    expect(settleMissions(state, ctx(rngFor(2)), { house: NAMES })[0].won).toBe(true);
  });
});
