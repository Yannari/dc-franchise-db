// "If I put them up and they are still here on Friday, they will be running
// next week and I will not."
//
// The most ordinary thought in this format, and the house had no version of it.
// `fear` in bbHeat is the personality read — a bold houseguest takes the shot,
// a timid one flinches — and it is about the person. This is the ARITHMETIC,
// and a bold houseguest can do it too.
//
// Three things have to be true at once for a nomination to come back on
// somebody: they survive it, they get power, and the person who took the shot
// cannot defend themselves. The third is what makes it Big Brother rather than
// a general fear of consequences — the outgoing Head of Household is barred
// from the next competition, so the one person who took the shot is the one
// person who cannot answer for it.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, addBond, getPerceivedBond } from '../js/bonds.js';
import { bbHeat } from '../js/bb/shared-strategy.js';
import { seedGame } from './helpers/setup.js';

const K = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const stat = over => Object.fromEntries(K.map(k => [k, over?.[k] ?? 5]));

/**
 * A house with a season still left in it.
 *
 * Padded to ten, because the term fades to nothing near the end on purpose:
 * "they will be running things and I will not" needs a week for that to happen
 * in, and at the final three there is no next Head of Household to lose to.
 * A four-hander would measure the fade rather than the mechanic.
 */
function house(spec) {
  const padded = [...spec];
  while (padded.length < 10) padded.push([`Extra${padded.length}`, {}]);
  seedGame(padded.map(([name, over]) => ({
    name, archetype: 'floater', gender: 'f', sexuality: 'straight', stats: stat(over),
  })), { episode: 2, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, hoh: null, weeks: [], stats: {}, house: { suspicion: {} } };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
}
const blow = (a, b) => bbHeat(a, b).components.blowback;

describe('what it costs to take a shot and miss', () => {
  it('is a real term on the nomination read', () => {
    house([['Boss', {}], ['Threat', {}]]);
    expect(bbHeat('Boss', 'Threat').components).toHaveProperty('blowback');
  });

  it('counts for more against somebody who keeps surviving', () => {
    house([['Boss', {}], ['Winner', {}], ['Nobody', {}]]);
    gs.bb.stats = { Winner: { vetoWins: 3, hohWins: 2 }, Nobody: {} };
    // Negative because it argues AGAINST nominating; bigger means more feared.
    expect(blow('Boss', 'Winner')).toBeLessThan(blow('Boss', 'Nobody'));
  });

  it('counts for more against somebody the house would keep', () => {
    // Both have to be capable of WINNING something first. Somebody who cannot
    // take power is not a retaliation risk however popular they are, and the
    // three terms multiply — so support is only the variable once the other
    // two are non-zero, which is the correct shape and not a bug.
    house([['Boss', {}], ['Loved', { physical: 9 }], ['Alone', { physical: 9 }],
      ['A', {}], ['B', {}], ['C', {}]]);
    gs.bb.stats = { Loved: { hohWins: 1 }, Alone: { hohWins: 1 } };
    for (const n of ['A', 'B', 'C']) addBond('Loved', n, 8);
    expect(blow('Boss', 'Loved')).toBeLessThan(blow('Boss', 'Alone'));
  });

  it('says nothing about somebody who cannot win anything, however liked', () => {
    // The three conditions multiply on purpose: surviving angry is only
    // dangerous if they can then take the power.
    house([['Boss', {}], ['Popular', { physical: 2, mental: 2, endurance: 2 }],
      ['A', {}], ['B', {}], ['C', {}]]);
    for (const n of ['A', 'B', 'C']) addBond('Popular', n, 8);
    gs.bb.stats = { Popular: {} };
    expect(Math.abs(blow('Boss', 'Popular'))).toBe(0);
  });

  it('is loudest for the one person who cannot play next week', () => {
    // The outgoing Head of Household is barred from the next competition. That
    // is the whole reason the house talks about this.
    house([['Boss', {}], ['Threat', {}], ['Bystander', {}]]);
    gs.bb.stats = { Threat: { vetoWins: 2, hohWins: 1 } };
    gs.bb.hoh = 'Boss';
    const asHoh = blow('Boss', 'Threat');
    const asAnybody = blow('Bystander', 'Threat');
    expect(asHoh, 'the person holding the power feared it no more than anybody else')
      .toBeLessThan(asAnybody);
  });

  it('is discounted by nerve and raised by seeing it coming', () => {
    house([['Bold', { boldness: 10, intuition: 5, temperament: 5 }],
      ['Careful', { boldness: 1, intuition: 9, temperament: 9 }],
      ['Threat', {}]]);
    gs.bb.stats = { Threat: { vetoWins: 3, hohWins: 2 } };
    expect(Math.abs(blow('Bold', 'Threat')),
      'a bold houseguest was as worried as a careful one')
      .toBeLessThan(Math.abs(blow('Careful', 'Threat')));
  });

  it('is a consideration and never a veto', () => {
    // The failure mode is a house that simply never nominates its best player.
    // Blowback must stay smaller than the threat that draws the nomination in
    // the first place, so it can tip a close call and nothing else.
    house([['Boss', {}], ['Threat', { strategic: 10, social: 10, physical: 9 }]]);
    gs.bb.stats = { Threat: { vetoWins: 4, hohWins: 3, blockBusterWins: 2 } };
    gs.bb.hoh = 'Boss';
    const c = bbHeat('Boss', 'Threat').components;
    expect(Math.abs(c.blowback), 'blowback outweighs everything else on the read')
      .toBeLessThan(Math.abs(c.threat) + Math.abs(c.suspicion) + Math.abs(c.memory) + 6);
    expect(c.blowback).toBeLessThan(0);
  });

  it('says nothing about somebody with nothing to come back with', () => {
    house([['Boss', {}], ['Quiet', { physical: 2, mental: 2, endurance: 2 }]]);
    gs.bb.stats = { Quiet: {} };
    gs.bb.hoh = 'Boss';
    expect(Math.abs(blow('Boss', 'Quiet'))).toBeLessThan(2);
  });

  it('never fires on yourself', () => {
    house([['Boss', {}], ['Other', {}]]);
    expect(Math.abs(blow('Boss', 'Boss'))).toBe(0);
  });
});

describe('and whether there is a next week to be afraid of', () => {
  it('says nothing at the final three', () => {
    // The last competition decides it and the rest is a jury vote, so there is
    // no next Head of Household to lose to. Weighing this at the final cut is
    // weighing a consequence that cannot arrive — and it quietly changed who
    // somebody chose to sit beside, which is how it was caught.
    seedGame([['Boss'], ['Threat'], ['Third']].map(([name]) => ({
      name, archetype: 'floater', gender: 'f', sexuality: 'straight', stats: stat({}),
    })), { episode: 9, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, hoh: 'Boss', weeks: [], stats: { Threat: { vetoWins: 4, hohWins: 3 } }, house: { suspicion: {} } };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    expect(Math.abs(bbHeat('Boss', 'Threat').components.blowback)).toBe(0);
  });

  it('matters less at seven than at fourteen', () => {
    const at = size => {
      const spec = Array.from({ length: size }, (_, i) => [i === 1 ? 'Threat' : `P${i}`, {}]);
      spec[0][0] = 'Boss';
      seedGame(spec.map(([name]) => ({
        name, archetype: 'floater', gender: 'f', sexuality: 'straight', stats: stat({ physical: 9 }),
      })), { episode: 3, eliminated: [], namedAlliances: [] });
      gs.bb = { outgoingHoh: null, hoh: 'Boss', weeks: [],
        stats: { Threat: { vetoWins: 3, hohWins: 2 } }, house: { suspicion: {} } };
      gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
      Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
      return Math.abs(bbHeat('Boss', 'Threat').components.blowback);
    };
    expect(at(14), 'a full house feared it no more than a nearly empty one')
      .toBeGreaterThan(at(7));
  });
});
