// The public (js/ss/public.js): a fan base, not a number. Votes save.
import { describe, expect, it } from 'vitest';
import { notice, support, voteShares, publicRead, readHouseBeats, weekPasses, fileOf, standing, fanGroups, carriedBy } from '../js/ss/public.js';
import { openKitties } from '../js/ss/kitty.js';
import { runBuzzes } from '../js/ss/hunt.js';
import { seededRandom } from './helpers/rng.js';

const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const fresh = () => ({});

describe('the public', () => {
  it('a villain the country watches outlasts a housemate nobody noticed', () => {
    const s = fresh();
    for (let i = 0; i < 6; i++) { notice(s, 'Vee', 'fun', 0.4, 'a fight in the house'); notice(s, 'Vee', 'heat', 0.3, 'a fight in the house'); }
    fileOf(s, 'Plant');
    let veeSaved = 0;
    for (let k = 1; k <= 200; k++) { const p = voteShares(s, ['Vee', 'Plant'], rngFor(k)); if (p.Vee > p.Plant) veeSaved++; }
    expect(veeSaved).toBeGreaterThan(170);
    expect(publicRead(s, 'Vee').key).toBe('villain');
    expect(publicRead(s, 'Plant').key).toBe('unseen');
  });
  it('a warm housemate beats the villain', () => {
    const s = fresh();
    for (let i = 0; i < 6; i++) { notice(s, 'Vee', 'fun', 0.4); notice(s, 'Vee', 'heat', 0.3); notice(s, 'Sun', 'warmth', 0.45); notice(s, 'Sun', 'fun', 0.1); }
    expect(support(s, 'Sun')).toBeGreaterThan(support(s, 'Vee'));
  });
  it('pity counts, and wears thin on its own', () => {
    const s = fresh();
    fileOf(s, 'A'); fileOf(s, 'B'); fileOf(s, 'C');
    notice(s, 'B', 'pity', 1, 'a hard day');
    notice(s, 'C', 'pity', 8, 'a hard day');
    expect(support(s, 'B')).toBeGreaterThan(support(s, 'A'));
    // eight times the pity is not eight times the fans
    expect(support(s, 'C') / support(s, 'B')).toBeLessThan(3.5);
  });
  it('too much heat with nothing warm underneath turns the country', () => {
    const s = fresh();
    for (let i = 0; i < 4; i++) notice(s, 'X', 'fun', 0.5);
    const fan = support(s, 'X');
    notice(s, 'X', 'heat', 6, 'cruel to a favourite');
    expect(support(s, 'X')).toBeLessThan(fan);
  });
  it('the house life on screen is seen, and read', () => {
    const s = fresh();
    readHouseBeats(s, [{ players: ['A', 'B'], text: 'A and B have a screaming fight in the kitchen.' }, { players: ['C'], text: 'C cries alone in the garden.' }], 3);
    expect(fileOf(s, 'A').fun).toBeGreaterThan(0);
    expect(fileOf(s, 'C').pity).toBeGreaterThan(0);
    expect(fileOf(s, 'A').seen).toBeGreaterThan(fileOf(s, 'B').seen);
  });
  it('a quiet week fades the headlines but not the story', () => {
    const s = fresh();
    notice(s, 'A', 'fun', 2); notice(s, 'A', 'arc', 2);
    weekPasses(s, ['A']);
    expect(fileOf(s, 'A').fun).toBeLessThan(fileOf(s, 'A').arc);
  });
  it('shares add up to a hundred and nobody gets nothing', () => {
    const s = fresh(); fileOf(s, 'A'); notice(s, 'B', 'warmth', 5);
    const p = voteShares(s, ['A', 'B'], rngFor(3));
    expect(Math.round(p.A + p.B)).toBe(100);
    expect(p.A).toBeGreaterThan(0);
    expect(standing(s, 'B', ['A', 'B'])).toBeGreaterThan(standing(s, 'A', ['A', 'B']));
  });
  it('un vrai joueur: the gamers back a player the hearts do not', () => {
    const s = fresh();
    for (let i = 0; i < 5; i++) { notice(s, 'Pro', 'game', 0.5, 'found a secret'); notice(s, 'Pro', 'heat', 0.2); }
    fileOf(s, 'Plant');
    expect(publicRead(s, 'Pro').key).toBe('player');
    expect(carriedBy(s, 'Pro')).toBe('gamers');
    expect(fanGroups(s, 'Pro').hearts).toBe(0);
    expect(support(s, 'Pro')).toBeGreaterThan(support(s, 'Plant'));
  });
  it('the calculateur is not the joueur: heat drives the hearts away, barely the gamers', () => {
    const s = fresh();
    notice(s, 'C', 'game', 2); notice(s, 'C', 'warmth', 2); notice(s, 'C', 'heat', 3);
    const g = fanGroups(s, 'C');
    expect(g.gamers).toBeGreaterThan(g.hearts);
  });
});

describe('how they play the hunt', () => {
  const H = ['Ana', 'Ben', 'Cy', 'Di'];
  const presses = style => {
    let n = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const st = { secrets: H.map(x => ({ id: x, holders: [x], text: `s ${x}`, found: false })), theories: { Ana: { Ben: { text: 's Ben', right: true, conf: 0.72, ev: [] } } } };
      openKitties(st, H);
      const ctx = { rng: rngFor(seed), week: 4, stat: () => 5, bond: () => 0, play: x => (x === 'Ana' ? style : {}) };
      n += runBuzzes(st, ctx, { house: H, weeksLeft: 6 }).length;
    }
    return n;
  };
  it('the hunter presses, the one lying low does not', () => {
    expect(presses({ bar: -0.07, press: 0.12 })).toBeGreaterThan(presses({ bar: 0.1, press: -0.2 }) + 20);
  });
});
