// What being in somebody's alliance is actually worth.
//
// Reported as a feeling — "sometimes I feel like the alliances are useless" —
// and measured before anything was changed. Twenty seasons, 14 houseguests:
// being sworn to the Head of Household moved the odds of going up from 27.9%
// to 18.1%. Real, but not what an alliance means.
//
// Two separate faults sat behind that, and only one of them was the decision:
//
//   1. THE PRICE OF AN ALLIANCE WAS THE SAME FOR EVERYBODY. `bbHeat` carried a
//      flat alliance term, so a loyalty-9 soldier and a loyalty-1 schemer
//      valued the same alliance identically. Loyal people follow their
//      alliance; that is most of what the stat is for.
//   2. IT WAS ADDITIVE. The same trap the shield discount in this file
//      documents: whatever the reasons to nominate somebody add up to, a
//      constant cannot keep up with the pile — and the pile is biggest for
//      exactly the players an alliance most wants to protect.
//
// What was NOT wrong: of 23 ceremonies that targeted an ally with three or
// more outsiders free, 22 had a real grievance behind them. The house always
// had a reason. The ceremony never said it, which is the other half of this
// and lives in bb-nomination-reasons.test.js.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, addBond, getPerceivedBond } from '../js/bonds.js';
import { nominationScore, nominationGrievance } from '../js/bb/strategy.js';
import { rememberStrategy, strategicMemoryScore } from '../js/strategy-memory.js';
import { seedGame } from './helpers/setup.js';

const K = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const stat = over => Object.fromEntries(K.map(k => [k, over?.[k] ?? 5]));

/** A house of six, an alliance of three, and a named loyalty for the HOH. */
function house(loyalty, { allied = true } = {}) {
  const names = ['Hoh', 'Ally', 'Outsider', 'D', 'E', 'F'];
  seedGame(names.map(n => ({ name: n, archetype: 'floater', gender: 'f',
    sexuality: 'straight', stats: stat(n === 'Hoh' ? { loyalty } : null) })),
  { episode: 6, eliminated: [], namedAlliances: [] });
  gs.activePlayers = [...names];
  gs.bb = { stats: {}, house: { suspicion: {} }, weeks: [] };
  gs.showmances = []; gs.intentions = {}; gs.strategicMemories = {};
  gs.namedAlliances = allied
    ? [{ name: 'The Pact', active: true, members: ['Hoh', 'Ally', 'D'] }] : [];
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
}
// Same seed for every call, so the only thing moving is the thing under test.
const score = name => nominationScore('Hoh', name, () => 0.5);

describe('loyalty decides what an alliance is worth', () => {
  it('makes a loyal head of household protect their own people', () => {
    house(10);
    const loyal = score('Ally');
    house(0);
    const faithless = score('Ally');
    expect(loyal, 'loyalty bought the ally nothing').toBeLessThan(faithless);
  });

  it('leaves an average houseguest close to where they were', () => {
    // A spread around the old behaviour, not a blanket buff — the measured
    // overall protection ratio stayed at 1.56x while the two ends pulled
    // apart (1.27x disloyal, 1.63x loyal).
    house(5);
    const middling = score('Ally');
    house(0);
    const faithless = score('Ally');
    house(10);
    const loyal = score('Ally');
    expect(middling).toBeLessThan(faithless);
    expect(middling).toBeGreaterThan(loyal);
  });

  it('never protects somebody outside the alliance', () => {
    house(10);
    const before = score('Outsider');
    house(0);
    expect(score('Outsider')).toBeCloseTo(before, 5);
  });
});

describe('but loyalty is not owed to somebody who broke it', () => {
  it('stops shielding an ally the head of household remembers being crossed by', () => {
    // The whole point. Without this the discount becomes a shield and
    // alliances turn unbreakable, which is the opposite failure.
    house(10);
    const protectedScore = score('Ally');
    house(10);
    rememberStrategy('Hoh', 'Ally', 'alliance-betrayal', 4, 3);
    expect(score('Ally'), 'a remembered betrayal still bought them the discount')
      .toBeGreaterThan(protectedScore);
  });

  it('stops shielding an ally the head of household suspects', () => {
    house(10);
    const protectedScore = score('Ally');
    house(10);
    gs.bb.house.suspicion['Hoh→Ally'] = 6;
    expect(score('Ally')).toBeGreaterThan(protectedScore);
  });
});

describe('the reason gets recorded at the ceremony', () => {
  it('says nothing at all about somebody who is not in the alliance', () => {
    // An ordinary nomination is not a betrayal and must never be narrated as
    // one.
    house(5);
    expect(nominationGrievance('Hoh', 'Outsider')).toBeNull();
  });

  it('names which betrayal, not just that there was one', () => {
    house(5);
    rememberStrategy('Hoh', 'Ally', 'voted-for-me', 4, 3);
    const g = nominationGrievance('Hoh', 'Ally');
    expect(g.kind).toBe('betrayal');
    expect(g.memory?.type, 'the house holds the receipt and did not read it')
      .toBe('voted-for-me');
    expect(g.alliance).toBe('The Pact');
  });

  it('calls a suspicion a suspicion', () => {
    // The betrayal line has the head of household state that a promise was
    // broken. A faint memory does not support that claim; this one says out
    // loud that there is no proof.
    house(5);
    gs.bb.house.suspicion['Hoh→Ally'] = 6;
    expect(nominationGrievance('Hoh', 'Ally').kind).toBe('suspicion');
  });

  it('admits when there is no grievance at all', () => {
    house(5);
    addBond('Hoh', 'Ally', 4);
    expect(nominationGrievance('Hoh', 'Ally').kind).toBe('no-grievance');
  });
});

describe('a kindness is not a receipt', () => {
  // The PRO_SOCIAL list in strategy-memory.js exists because being saved by
  // somebody was once making people MORE likely to nominate them. It fixed the
  // sixteen types anybody thought of at the time; everything else in the
  // codebase still defaults to hostile, and the event library kept growing. A
  // sweep of what actually reaches a nomination found these being counted as
  // grievances — including 'alliance', the memory of forming the alliance.
  const KIND = ['alliance', 'saved-me', 'stood-up-for-me', 'was-there', 'trust',
    'told-me-to-my-face', 'intel', 'let-me-play', 'handed-me-the-house',
    'resolve', 'told-me-something-true', 'was-there-at-three-in-the-morning'];

  it('does not make somebody more likely to nominate the person who was good to them', () => {
    for (const type of KIND) {
      house(5);
      const clean = score('Ally');
      house(5);
      rememberStrategy('Hoh', 'Ally', type, 4, 3);
      expect(score('Ally'), `"${type}" counted as a reason to nominate them`)
        .toBeLessThanOrEqual(clean);
    }
  });

  it('scores them the other way, like every other kindness', () => {
    for (const type of KIND) {
      house(5);
      gs.strategicMemories = {};
      rememberStrategy('Hoh', 'Ally', type, 6, 3);
      expect(strategicMemoryScore('Hoh', 'Ally', 7), `"${type}" is still a receipt`)
        .toBeLessThan(0);
    }
  });

  it('still counts the hostile half of the same pair', () => {
    // 'resolve' is the branch where somebody decided NOT to cut you;
    // 'planning-the-cut' is the branch where they did. Only one of them is a
    // kindness, and moving the wrong one would make the house unable to react
    // to being cut.
    house(5);
    gs.strategicMemories = {};
    rememberStrategy('Hoh', 'Ally', 'planning-the-cut', 6, 3);
    expect(strategicMemoryScore('Hoh', 'Ally', 7)).toBeGreaterThan(0);
  });

  it('never narrates a kindness as a betrayal', () => {
    house(5);
    rememberStrategy('Hoh', 'Ally', 'saved-me', 4, 3);
    const g = nominationGrievance('Hoh', 'Ally');
    expect(g.kind, 'the person who saved them was called a traitor for it')
      .not.toBe('betrayal');
  });
});
