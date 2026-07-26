import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gs } from '../js/core.js';
import { getBond, setBond } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';
import {
  _generateFalseMajority, _generateThrowAccusation, generateSocialManipulationEvents,
} from '../js/social-manipulation.js';
import { simulateVotes } from '../js/voting.js';
import { getShowmance, getShowmancePartner } from '../js/romance.js';

const _rp = arr => arr[0];

function seed(defs) {
  seedGame(defs || ['S', 'V', 'D', 'X', 'Y', 'Z'], { episode: 4 });
  gs.episodeHistory = [];
  gs._falseMajorityPlot = null;
  gs._schemeHeat = {};
  gs.challengeThrowHeat = {};
  gs.isMerged = false;
  gs.popularity = {};
  gs.namedAlliances = [];
}
beforeEach(() => seed());
afterEach(() => vi.restoreAllMocks());

const GROUP = ['S', 'V', 'D', 'X', 'Y', 'Z'];

describe('False Majority', () => {
  it('a trusted schemer plants the plot on a credulous victim', () => {
    seed([
      { name: 'S', stats: { social: 9, strategic: 9 } },
      { name: 'V', stats: { intuition: 1, mental: 1 } },
      'D', 'X', 'Y', 'Z',
    ]);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setBond('S', 'V', 4);
    const events = _generateFalseMajority('S', 'V', 'D', GROUP, { num: 5 }, _rp);
    expect(events[0].type).toBe('falseMajority');
    expect(events[0].players[0]).toBe('S'); // actor-first for the edit layer
    expect(gs._falseMajorityPlot).toMatchObject({ schemer: 'S', victim: 'V', decoy: 'D' });
  });

  it('a sharp victim refuses the con — schemer takes heat and bond damage', () => {
    seed([
      { name: 'S', stats: { social: 2, strategic: 2 } },
      { name: 'V', stats: { intuition: 10, mental: 10 } },
      'D', 'X', 'Y', 'Z',
    ]);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const events = _generateFalseMajority('S', 'V', 'D', GROUP, { num: 5 }, _rp);
    expect(events[0].type).toBe('falseMajorityResisted');
    expect(gs._falseMajorityPlot).toBeNull();
    expect(gs._schemeHeat.S).toBeTruthy();
    expect(getBond('V', 'S')).toBeLessThan(0);
  });

  it('the believed plot steers the victim ballot toward the decoy at tribal', () => {
    const priorBond = globalThis.getBond, priorSh = globalThis.getShowmance, priorShP = globalThis.getShowmancePartner;
    globalThis.getBond = getBond; globalThis.getShowmance = getShowmance; globalThis.getShowmancePartner = getShowmancePartner;
    try {
      let steered = 0;
      const trials = 25;
      for (let t = 0; t < trials; t++) {
        seedGame(GROUP.map(name => ({ name })), {
          episode: 5, phase: 'post-merge', isMerged: true, mergeName: 'Merged', episodeHistory: [],
          tribes: [{ name: 'Merged', members: [...GROUP] }], lostVotes: [], strategicMemories: {},
          playerStates: Object.fromEntries(GROUP.map(name => [name, { emotional: 'comfortable', bigMoves: 0 }])),
          chalRecord: Object.fromEntries(GROUP.map(name => [name, { wins: 0, podiums: 0, bombs: 0 }])),
        });
        gs._falseMajorityPlot = { schemer: 'S', victim: 'V', decoy: 'D', ep: 5 };
        // The victim votes with an alliance whose plan is X — the con overrides the plan.
        const alliances = [{ type: 'alliance', label: 'Core', members: ['V', 'Y', 'Z'], target: 'X' }];
        gs.namedAlliances = [{ name: 'Core', members: ['V', 'Y', 'Z'], active: true, formed: 3 }];
        const result = simulateVotes(GROUP, [], alliances, [], false);
        const ballot = (result.log || []).find(v => v.voter === 'V');
        if (ballot?.voted === 'D') steered++;
      }
      // Steering is strong but not absolute (bond resistance still applies).
      expect(steered).toBeGreaterThan(trials * 0.5);
    } finally {
      globalThis.getBond = priorBond; globalThis.getShowmance = priorSh; globalThis.getShowmancePartner = priorShP;
    }
  });

  it('fallout: a high-intuition victim traces the wasted ballot to the schemer', () => {
    seed([
      'S',
      { name: 'V', stats: { intuition: 10 } },
      'D', 'X', 'Y', 'Z',
    ]);
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    gs._falseMajorityPlot = { schemer: 'S', victim: 'V', decoy: 'D', ep: 4 };
    gs.episodeHistory = [{ num: 4, eliminated: 'X', votingLog: [{ voter: 'V', voted: 'D' }] }];
    const results = [];
    // Fallout runs at the top of the generator for the next episode.
    const events = generateSocialManipulationEvents(GROUP, { num: 5 }, 0);
    const fallout = events.find(e => e.type === 'falseMajorityExposed');
    expect(fallout).toBeTruthy();
    expect(gs._falseMajorityPlot).toBeNull();
    expect(getBond('V', 'S')).toBeLessThanOrEqual(-2);
    expect(gs._schemeHeat.S).toBeTruthy();
  });
});

describe('Challenge-Throw Accusation', () => {
  function seedLoss(scores) {
    gs.episodeHistory = [{
      num: 4, eliminated: 'X',
      tribesAtStart: [{ name: 'Red', members: ['S', 'V', 'D', 'X'] }, { name: 'Blue', members: ['Y', 'Z'] }],
      chalMemberScores: scores,
    }];
  }

  it('accuses the lowest scorer of THIS challenge when they clearly underperformed', () => {
    seedLoss({ S: 7, V: 2, D: 8, X: 6 });
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // sells
    const events = _generateThrowAccusation('S', ['S', 'V', 'D'], { num: 5 }, _rp);
    expect(events[0].type).toBe('throwAccusation');
    expect(events[0].players).toEqual(['S', 'V']);
    expect(gs.challengeThrowHeat.V).toBeGreaterThan(0);
  });

  it('nobody clearly underperformed -> NO accusation, even against a bad career record', () => {
    gs.chalRecord = { V: { bombs: 5, wins: 0 } };  // terrible record...
    seedLoss({ S: 6, V: 6, D: 7, X: 6 });          // ...but V showed up THIS challenge
    const events = _generateThrowAccusation('S', ['S', 'V', 'D'], { num: 5 }, _rp);
    expect(events).toEqual([]);
  });

  it('a failed sell backfires onto the schemer', () => {
    seedLoss({ S: 7, V: 4, D: 8, X: 6 });
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // tribe doesn't buy it
    const events = _generateThrowAccusation('S', ['S', 'V', 'D'], { num: 5 }, _rp);
    expect(events[0].type).toBe('throwAccusationBackfire');
    expect(gs._schemeHeat.S).toBeTruthy();
  });

  it('never fires post-merge', () => {
    gs.isMerged = true;
    seedLoss({ S: 7, V: 1, D: 8, X: 6 });
    expect(_generateThrowAccusation('S', ['S', 'V', 'D'], { num: 5 }, _rp)).toEqual([]);
  });
});

describe('Proportional neutral scheming eligibility', () => {
  it('a perfectly loyal neutral NEVER schemes; a disloyal strategic neutral sometimes does', () => {
    let loyalSchemes = 0, snakeSchemes = 0;
    for (let t = 0; t < 60; t++) {
      seed([
        { name: 'S', archetype: 'wildcard', stats: { strategic: 10, loyalty: 1 } },
        { name: 'V', archetype: 'wildcard', stats: { strategic: 8, loyalty: 10 } },
        'D', 'X', 'Y', 'Z',
      ]);
      setBond('S', 'D', -3); setBond('V', 'D', -3); // whisper targets available
      const events = generateSocialManipulationEvents(GROUP, { num: 5 }, 1.0);
      const SCHEME_TYPES = new Set(['forgeNote', 'spreadLies', 'kissTrap', 'whisperCampaign',
        'falseMajority', 'falseMajorityResisted', 'throwAccusation', 'throwAccusationBackfire']);
      if (events.some(e => e.players?.[0] === 'S' && SCHEME_TYPES.has(e.type) && !e.propagated)) snakeSchemes++;
      if (events.some(e => e.players?.[0] === 'V' && SCHEME_TYPES.has(e.type) && !e.propagated)) loyalSchemes++;
    }
    expect(loyalSchemes).toBe(0);          // loyalty 10 -> (10-10)/10 = 0 chance, always
    expect(snakeSchemes).toBeGreaterThan(10); // strategic 10 / loyalty 1 -> 90% pool entry
  });
});
