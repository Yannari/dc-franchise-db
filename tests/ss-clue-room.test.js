// The clue room (js/ss/clue-room.js; the user, 2026-10-30: "a room that always there but sometimes theres event in
// it"): the board holds the clues the whole house saw; sessions pin, trade or keep the private ones; a trade buys a
// promise the nominations read; a pact's secret buzzed alone is a betrayal; the Voice's events come about every
// other week, and an auction never invents or loses money.
import { describe, it, expect } from 'vitest';
import { openKitties, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { showClue, handClue } from '../js/ss/hunt.js';
import { clueRoomOf, pinPublic, clueRoomWeek, settleDeals, pactBetrayed } from '../js/ss/clue-room.js';
import { nominationWish } from '../js/ss/nominations.js';
import { seededRandom } from './helpers/rng.js';

const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal'];
const S = (h, text) => ({ id: `s-${h}`, holders: [h], text, kind: 'personal', secretKind: 'survived',
  clues: ['a seat belt buckle', 'a toy aeroplane', 'the word "altitude"', 'a compass'], tells: ['goes quiet'], difficulty: 0.5, found: false });
function fresh() {
  const state = { secrets: names.map(n => S(n, `${n} survived something`)) };
  openKitties(state, names);
  return state;
}
// two blocs of friends
const friends = (a, b) => (names.indexOf(a) < 4) === (names.indexOf(b) < 4);
const ctx = (week, rng, over = {}) => ({ rng, week, stat: (n, k) => over[n]?.[k] ?? 5, bond: (a, b) => (a === b ? 0 : friends(a, b) ? 3 : -2) });

describe('the board', () => {
  it('holds the clues the whole house saw, and never a private one', () => {
    const state = fresh();
    const rng = seededRandom(3);
    showClue(state, ctx(1, rng), { holder: 'Ana', house: names });
    for (let i = 0; i < 6; i++) handClue(state, ctx(1, rng), { holder: 'Ben', house: names, to: 'Cy' });
    pinPublic(state, 1);
    const board = clueRoomOf(state).board;
    const shown = state.shownClues;
    for (const b of board) expect(shown.some(c => c.clue === b.clue && (c.to === 'house' || c.share === 'all'))).toBe(true);
    for (const c of shown.filter(x => Array.isArray(x.to) && x.share !== 'all')) expect(board.some(b => b.clue === c.clue && b.secretId === c.secretId)).toBe(false);
    expect(board.some(b => b.holders[0] === 'Ana')).toBe(true);
  });
  it("a clue the house saw after the room's session goes up the next week", () => {
    const state = fresh();
    const rng = seededRandom(5);
    pinPublic(state, 2);
    // (a mission's clue, read out on Thursday: after the clue room's session)
    const late = showClue(state, ctx(2, rng), { holder: 'Di', how: 'mission', house: names });
    expect(clueRoomOf(state).board.some(b => b.clue === late.clue)).toBe(false);
    pinPublic(state, 3);
    expect(clueRoomOf(state).board.some(b => b.clue === late.clue && b.week === 2)).toBe(true);
  });
});

describe('a season in the clue room', () => {
  it('has sessions most weeks, an event about every other week, and an auction that keeps the ledger', () => {
    let events = 0, sessions = 0, auctions = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const state = fresh();
      const rng = seededRandom(seed * 7);
      for (let w = 1; w <= 10; w++) {
        const c = ctx(w, rng);
        showClue(state, c, { holder: names[w % names.length], house: names });
        handClue(state, c, { holder: names[(w + 3) % names.length], house: names });
        pinPublic(state, w);
        const r = clueRoomWeek(state, c, { house: names });
        if (r.act?.event) { events++; if (r.act.event.kind === 'auction') auctions++; }
        sessions += r.act?.sessions?.length || 0;
        expect(actualTotal(state)).toBe(expectedTotal(state));
      }
    }
    // ten weeks, from week 2: about four or five events a season
    expect(events / 12).toBeGreaterThan(2.5);
    expect(events / 12).toBeLessThan(6.5);
    expect(sessions / 12).toBeGreaterThan(6);
    expect(auctions).toBeGreaterThan(0);
  });
  it('a clue traded for a promise makes the promised one far less likely to nominate the giver', () => {
    const state = fresh();
    clueRoomOf(state).deals[3] = [{ spare: 'Ana', promised: 'Ed', clue: 'a compass' }];
    const before = [], after = [];
    for (let s = 1; s <= 60; s++) {
      after.push(nominationWish(state, ctx(3, seededRandom(s)), 'Ed', 'Ana').score);
      before.push(nominationWish(state, ctx(4, seededRandom(s)), 'Ed', 'Ana').score);
    }
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(before) - avg(after)).toBeGreaterThan(3);
  });
  it('a promise named anyway is a broken one', () => {
    const state = fresh();
    clueRoomOf(state).deals[2] = [{ spare: 'Ana', promised: 'Ed', clue: 'x' }, { spare: 'Ben', promised: 'Fi', clue: 'y' }];
    const out = settleDeals(state, 2, [{ voter: 'Ed', picks: ['Ana', 'Gus'] }, { voter: 'Fi', picks: ['Hal', 'Gus'] }]);
    expect(out.find(d => d.spare === 'Ana').broken).toBe(true);
    expect(out.find(d => d.spare === 'Ben').broken).toBe(false);
  });
  it('a pact member who buzzes the pact\'s secret alone has betrayed the others, for two weeks', () => {
    const state = fresh();
    clueRoomOf(state).pacts.push({ week: 3, members: ['Ana', 'Ben', 'Cy'], about: ['Gus'] });
    expect(pactBetrayed(state, { by: 'Ana', target: 'Gus' }, 4).sort()).toEqual(['Ben', 'Cy']);
    expect(pactBetrayed(state, { by: 'Ana', target: 'Hal' }, 4)).toEqual([]);
    expect(pactBetrayed(state, { by: 'Ana', target: 'Gus' }, 7)).toEqual([]);
  });
});
