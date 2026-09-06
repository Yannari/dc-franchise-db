// ══════════════════════════════════════════════════════════════════════
// dr-assign.test.js — the draft, and what it costs
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { pickOrder, draftRoles, captainSplit, contestFor, ROLE_SPOTLIGHT } from '../js/dr/assign.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
  ...over,
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
// Spread, not consecutive: this LCG's first draw is linear in the seed, so
// rngFor(0..199) only ever produces 0.236-0.313 on the first call. Looping
// consecutive seeds here would sample one corner of the distribution and make
// a coin-flip decision look like a certainty. See the note in js/dr/rng.js.
const seeded = i => rngFor(i * 7919 + 13);
const players = Object.fromEntries(NAMES.map(n => [n, mk(n)]));

describe('pickOrder', () => {
  it('a pick-order mini puts its winner first', () => {
    const o = pickOrder({ living: NAMES, miniWinner: 'Dot', mini: { buys: 'pick-order' }, rng: rngFor(1) });
    expect(o[0]).toBe('Dot');
    expect(new Set(o).size).toBe(6);
  });

  it('a mini that buys something else does not reorder', () => {
    const a = pickOrder({ living: NAMES, miniWinner: 'Dot', mini: { buys: 'captain' }, rng: rngFor(1) });
    const b = pickOrder({ living: NAMES, miniWinner: null, mini: null, rng: rngFor(1) });
    expect(a).toEqual(b);
  });
});

describe('draftRoles', () => {
  const ladder = ['lead', 'featured', 'featured', 'standard', 'standard', 'ensemble'];

  it('gives every queen a role, and the first pick usually takes the biggest', () => {
    let leadFirst = 0;
    for (let i = 0; i < 200; i++) {
      const { roles } = draftRoles({ order: NAMES, roleNames: ladder, rng: seeded(i), players });
      expect(Object.keys(roles).length).toBe(6);
      if (roles.Ada === 'lead') leadFirst++;
    }
    // Usually, and only usually: ducking the lead is a real decision, so the
    // rate has to sit strictly inside the interval rather than at either end.
    expect(leadFirst / 200).toBeGreaterThan(0.4);
    expect(leadFirst / 200).toBeLessThan(0.9);
  });

  it('a bold queen takes the lead far more often than a timid one', () => {
    const rate = boldness => {
      const p = { ...players, Ada: mk('Ada', { stats: { ...players.Ada.stats, boldness } }) };
      let n = 0;
      for (let i = 0; i < 200; i++) {
        if (draftRoles({ order: NAMES, roleNames: ladder, rng: seeded(i), players: p }).roles.Ada === 'lead') n++;
      }
      return n / 200;
    };
    expect(rate(10)).toBeGreaterThan(rate(1) + 0.2);
  });

  it('records who ducked, because the panel brings it up later', () => {
    const timid = Object.fromEntries(NAMES.map(n => [n, mk(n, { stats: { ...players[n].stats, boldness: 1 } })]));
    let ducks = 0;
    for (let i = 0; i < 40; i++) {
      const { picks } = draftRoles({ order: NAMES, roleNames: ladder, rng: seeded(i), players: timid });
      ducks += picks.filter(p => p.ducked).length;
    }
    expect(ducks).toBeGreaterThan(0);
  });

  it('never hands out the same role twice, and copes with too few roles', () => {
    const { roles, picks } = draftRoles({ order: NAMES, roleNames: ['lead', 'featured'], rng: rngFor(3), players });
    expect(Object.keys(roles).length).toBe(6);
    expect(picks.filter(p => p.role === 'lead').length).toBe(1);
    expect(ROLE_SPOTLIGHT[picks[0].role]).toBeGreaterThan(0);
  });
});

describe('captainSplit', () => {
  const bonds = { 'Ada|Bee': 6, 'Cleo|Fay': -7 };
  const bond = (a, b) => bonds[[a, b].sort().join('|')] || 0;

  it('splits everybody, and captains take their friends', () => {
    const { teams } = captainSplit({ order: NAMES, captains: ['Ada', 'Cleo'], players, bond, rng: rngFor(2) });
    expect(teams.length).toBe(2);
    expect(teams.flat().sort()).toEqual([...NAMES].sort());
    expect(new Set(teams.flat()).size).toBe(6);
    expect(teams.find(t => t.includes('Ada'))).toContain('Bee');
  });

  it('a scheming captain dumps her rival, once, and pays for it', () => {
    const schemer = { ...players, Cleo: mk('Cleo', { archetype: 'villain' }) };
    const { teams, events } = captainSplit({
      order: NAMES, captains: ['Ada', 'Cleo'], players: schemer, bond, rng: rngFor(5),
    });
    const dump = events.filter(e => e.type === 'dump');
    expect(dump.length).toBe(1);
    expect(dump[0].pop.Cleo).toBeLessThan(0);
    expect(dump[0].bond.length).toBeGreaterThan(0);
    expect(teams.find(t => t.includes('Cleo'))).not.toContain('Fay');
  });

  it('a nice captain never dumps, however much she dislikes somebody', () => {
    const { events } = captainSplit({
      order: NAMES, captains: ['Ada', 'Cleo'], players, bond, rng: rngFor(5),
    });
    expect(events.find(e => e.type === 'dump')).toBeUndefined();
  });
});

describe('contestFor', () => {
  it('the earlier pick keeps it; the later pays and both feel it', () => {
    const { picks, events } = contestFor({
      order: ['Ada', 'Bee', 'Cleo'],
      choices: { Ada: ['Dolly', 'Cher'], Bee: ['Dolly', 'Tina'], Cleo: ['Tina', 'Cher'] },
      players, rng: rngFor(1),
    });
    expect(picks.Ada.choice).toBe('Dolly');
    expect(picks.Ada.penalty).toBe(0);
    expect(picks.Bee.choice).toBe('Tina');
    expect(picks.Bee.penalty).toBeCloseTo(0.8);
    expect(picks.Bee.lostTo).toBe('Ada');
    expect(picks.Cleo.choice).toBe('Cher');

    const c = events.find(e => e.type === 'contest');
    expect(c.players).toEqual(['Ada', 'Bee']);
    expect(c.bond[0][2]).toBeLessThan(0);
  });

  it('nobody who got a first choice pays anything', () => {
    const { picks, events } = contestFor({
      order: ['Ada', 'Bee'], choices: { Ada: ['X'], Bee: ['Y'] }, players, rng: rngFor(1),
    });
    expect(picks.Ada.penalty).toBe(0);
    expect(picks.Bee.penalty).toBe(0);
    expect(events).toEqual([]);
  });

  it('a queen with nothing left takes a leftover and pays double', () => {
    const { picks } = contestFor({
      order: ['Ada', 'Bee'], choices: { Ada: ['Solo'], Bee: ['Solo'] }, players, rng: rngFor(1),
    });
    expect(picks.Bee.choice).toBeTruthy();
    expect(picks.Bee.penalty).toBeCloseTo(1.6);
  });

  it('never gives two queens the same thing', () => {
    for (let s = 0; s < 30; s++) {
      const choices = Object.fromEntries(NAMES.map(n => [n, ['A', 'B', 'C']]));
      const { picks } = contestFor({ order: NAMES, choices, players, rng: rngFor(s) });
      const chosen = Object.values(picks).map(p => p.choice);
      expect(new Set(chosen).size, `seed ${s} double-booked`).toBe(chosen.length);
    }
  });
});
