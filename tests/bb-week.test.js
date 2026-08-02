import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { simulateBBSeason, simulateBBWeek } from '../js/bb/week.js';
import { chooseNominationPlan } from '../js/bb/strategy.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'], ['D', 'schemer'],
  ['E', 'hero'], ['F', 'floater'], ['G', 'villain'], ['H', 'loyal-soldier'],
].map(([name, archetype]) => ({ name, archetype }));

function seededRng(seed = 7) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

describe('Big Brother headless week engine', () => {
  beforeEach(() => seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] }));

  it('runs the complete act sequence, excludes the outgoing HOH, and evicts one nominee', () => {
    gs.bb = { outgoingHoh: 'A', weeks: [], stats: {} };
    const week = simulateBBWeek({ rng: seededRng(12) });
    // The week now emits its own house segments between the ceremonies, each
    // carrying the phase the house is actually in.
    expect(week.acts.map(act => act.type)).toEqual([
      'house', 'hoh', 'house', 'nominations', 'house', 'veto', 'house',
      'veto-ceremony', ...week.acts.filter(a => a.type === 'campaign').map(() => 'campaign'), 'eviction',
    ]);
    expect(week.acts.every(act => !('day' in act))).toBe(true);
    expect(week.acts.find(a => a.type === 'hoh').results.map(result => result.name)).not.toContain('A');
    expect(week.finalNominees).toContain(week.evicted);
    expect(gs.activePlayers).toHaveLength(7);
    expect(gs.eliminated).toContain(week.evicted);
  });

  it('exposes every structural interception point needed by future twists', () => {
    const called = [];
    const hooks = Object.fromEntries([
      'hohResult', 'nominationResult', 'vetoParticipants', 'vetoOutcome',
      'vetoDecision', 'replacementChoice', 'voteEligibility', 'evictionResult',
    ].map(name => [name, value => { called.push(name); return value; }]));
    simulateBBWeek({ rng: () => 0.01, hooks });
    expect(called).toEqual(expect.arrayContaining([
      'hohResult', 'nominationResult', 'vetoParticipants', 'vetoOutcome',
      'vetoDecision', 'voteEligibility', 'evictionResult',
    ]));
  });

  it('records the vote position before campaigning and after each campaign act', () => {
    const week = simulateBBWeek({ rng: seededRng(3) });
    expect(Object.values(week.preCampaignVotes).reduce((a, b) => a + b, 0)).toBe(5);
    const campaigns = week.acts.filter(act => act.type === 'campaign');
    expect(campaigns).toHaveLength(2);
    expect(campaigns.every(day => day.events.length > 0)).toBe(true);
    expect(campaigns.every(act => act.votesAfterAct)).toBe(true);
  });

  it('uses bonds in directed nomination strategy', () => {
    setBond('A', 'B', 9);
    setBond('A', 'G', -9);
    const plan = chooseNominationPlan('A', gs.activePlayers, () => 0.99);
    expect(plan.nominees).toContain('G');
    expect(plan.target).toBe('G');
    expect(plan.rankings.find(entry => entry.name === 'G').score)
      .toBeGreaterThan(plan.rankings.find(entry => entry.name === 'B').score);
    // B beside G is either the pawn play or an explicitly named pawnless
    // structure — never an unexamined default.
    if (plan.nominees.includes('B') && plan.structure === 'target-pawn') expect(plan.pawn).toBe('B');
  });

  it('can run a full season to a final three without invoking Total Drama rules', () => {
    const result = simulateBBSeason({ rng: seededRng(44), finaleSize: 3 });
    expect(result.weeks).toHaveLength(5);
    expect(result.finalists).toHaveLength(3);
    expect(gs.bb.weeks).toHaveLength(5);
    expect(gs.eliminated).toHaveLength(5);
  });
});

// Who goes on slop.
//
// This used to be the Head of Household's private pick, scored on their
// PERCEIVED bond toward each houseguest plus noise — so the most public
// punishment of the week landed on whoever the person in power happened to
// dislike, nobody could have avoided it, and no screen said why.
//
// The show decided it by competition for its first fifteen seasons and only
// handed the choice to the HOH from the sixteenth. Competition is the better
// rule for the same reason it was the original one: it is earned rather than
// decreed, and it explains itself.
describe('have-nots come off the scoreboard', () => {
  beforeEach(() => seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] }));

  it('puts the bottom of the HOH competition on slop', () => {
    const week = simulateBBWeek({ rng: seededRng(31), twists: ['bb-have-nots'] });
    const act = (week.acts || []).find(a => a.type === 'have-nots');
    if (!act) return;
    const comp = (week.acts || []).find(a => a.type === 'hoh')?.competition;
    const placements = (comp?.placements || []);
    expect(placements.length).toBeGreaterThan(3);
    const bottom = placements.slice(-act.names.length);
    for (const name of act.names) {
      expect(bottom, `${name} is on slop without being at the bottom`).toContain(name);
    }
  });

  it('never puts the Head of Household on slop', () => {
    // The HOH is automatically a Have. They won it, so they cannot be last —
    // but the rule is guarded rather than assumed.
    for (const seed of [7, 19, 44]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      const week = simulateBBWeek({ rng: seededRng(seed), twists: ['bb-have-nots'] });
      const act = (week.acts || []).find(a => a.type === 'have-nots');
      if (!act) continue;
      expect(act.names, 'the Head of Household is eating slop').not.toContain(week.hoh);
    }
  });

  it('quotes the placing against the real field', () => {
    // Counting only the people eligible for slop made the scoreboard lie:
    // somebody who came last of twelve was told they finished last of eleven.
    const week = simulateBBWeek({ rng: seededRng(52), twists: ['bb-have-nots'] });
    const act = (week.acts || []).find(a => a.type === 'have-nots');
    if (!act?.reasons?.length) return;
    const comp = (week.acts || []).find(a => a.type === 'hoh')?.competition;
    const field = (comp?.placements || []).length;
    for (const r of act.reasons) {
      expect(r.field, 'the placing is quoted against the wrong field').toBe(field);
      expect(r.place, `${r.name} placed outside the field`).toBeLessThanOrEqual(field);
      expect(r.why, 'a have-not with no reason given').toBeTruthy();
    }
  });

  it('exempts anybody who was not allowed to play', () => {
    // The outgoing Head of Household sits the competition out by rule, and
    // cannot come last in one they were not in.
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    const first = simulateBBWeek({ rng: seededRng(11), twists: ['bb-have-nots'] });
    const second = simulateBBWeek({ rng: seededRng(12), twists: ['bb-have-nots'] });
    const act = (second.acts || []).find(a => a.type === 'have-nots');
    if (!act || !first.hoh) return;
    expect(act.names, 'the outgoing HOH was punished for a competition they were barred from')
      .not.toContain(first.hoh);
  });
});

// The veto, as a decision rather than a dice roll.
//
// It used to return 'relationship' or 'leave-nominations' — a category, not a
// reason — and the ceremony reported an outcome with no thinking behind it. The
// Head of Household holding their own veto was not modelled at all, which
// produced cards about somebody making an enemy of themselves.
describe('the veto weighs both sides', () => {
  beforeEach(() => seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] }));

  it('always says why, whichever way it goes', () => {
    for (const seed of [5, 17, 29]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      const week = simulateBBWeek({ rng: seededRng(seed) });
      const cer = (week.acts || []).find(a => a.type === 'veto-ceremony');
      if (!cer) continue;
      expect(cer.reason, 'a veto decision with no reason').toBeTruthy();
      expect(cer.why, `${cer.reason} decided with nothing said about it`).toBeTruthy();
      expect(cer.why.length, 'the reasoning is a stub').toBeGreaterThan(40);
      if (cer.used && cer.replacement) {
        expect(cer.replacementWhy, 'a replacement was named with no reasoning').toBeTruthy();
      }
    }
  });

  it('will not let a Head of Household undo their own week for nothing', () => {
    // Using your own veto means taking down somebody you nominated days ago.
    // That is the backdoor, or a promise made since — never a change of heart.
    for (const seed of [3, 8, 14, 22, 31, 44]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      const week = simulateBBWeek({ rng: seededRng(seed) });
      const cer = (week.acts || []).find(a => a.type === 'veto-ceremony');
      if (!cer || cer.holder !== week.hoh) continue;
      if (cer.used) {
        expect(['backdoor', 'own-deal'],
          `the Head of Household used their own veto for "${cer.reason}"`).toContain(cer.reason);
      } else {
        expect(cer.reason).toBe('own-nominations');
      }
    }
  });

  it('reads the block being all but decided', () => {
    // The point that makes the late game different: with the HOH and the veto
    // winner immune, a small house can leave one legal replacement. Using the
    // veto then is bookkeeping rather than betrayal, and the reasoning should
    // say so instead of pretending to a choice nobody had.
    const small = CAST.slice(0, 5);
    seedGame(small, { episode: 0, eliminated: [], namedAlliances: [] });
    const week = simulateBBWeek({ rng: seededRng(12) });
    const cer = (week.acts || []).find(a => a.type === 'veto-ceremony');
    if (!cer) return;
    const pool = (week.houseAtStart || small.map(p => p.name))
      .filter(n => n !== week.hoh && n !== cer.holder && !(week.initialNominees || []).includes(n));
    if (pool.length > 1) return;
    expect(`${cer.why} ${cer.replacementWhy || ''}`,
      'a forced block was described as though it were a decision')
      .toMatch(/only one|one name left|one legal|counted to|barely a decision|without changing the week/i);
  });
});

// ── the pawn ask ──────────────────────────────────────────────────────
//
// The chair used to be filled unilaterally while a scheduler event ran a
// parallel ask against somebody the plan often never nominated — agreements
// the week ignored, refusals it never punished. The ask is the engine's now:
// the seated pawn IS the asked pawn, a yes writes a real safety deal, and a
// house of refusers still produces a pawn — forced, and furious about it.
import { negotiatePawn } from '../js/bb/week.js';
import { addBond as addBondDirect } from '../js/bonds.js';

describe('the pawn ask', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  });

  it('asks exactly when the structure seats a pawn, and seats who it settled on', () => {
    // A pawn used to be mandatory by construction — every Head of Household
    // ran the same play and a test REQUIRED it. Five structures compete now;
    // the ask happens on pawn weeks and only on pawn weeks.
    const { weeks } = simulateBBSeason({ rng: seededRng(41), finaleSize: 3 });
    for (const w of weeks) {
      if (w.plan.pawn) {
        expect(w.pawnAsk, `week ${w.num} seated a pawn without asking`).toBeTruthy();
        expect(w.pawnAsk.asked.length).toBeGreaterThan(0);
        expect(w.plan.pawn).toBe(w.pawnAsk.pawn);
        expect(w.initialNominees, 'the asked pawn is not on the block').toContain(w.pawnAsk.pawn);
      } else {
        expect(w.pawnAsk, `week ${w.num} asked for a pawn the structure never seats`).toBeFalsy();
        expect(w.plan.structure, 'a pawnless week must name its structure').toBeTruthy();
        expect(w.plan.structure).not.toBe('target-pawn');
      }
    }
  });

  it('a willing yes writes a real safety deal; a full refusal forces the seat', () => {
    const house = [...gs.activePlayers];
    const hoh = house[0];
    // Warm, loyal candidate in a full house: a willing yes.
    const friend = house[1];
    addBondDirect(hoh, friend, 6);
    const plan1 = { target: house[2], pawn: friend, pawnRanking: [friend], nominees: [house[2], friend] };
    const yes = negotiatePawn(hoh, house, plan1, () => 0.9);
    expect(yes.forced).toBe(false);
    expect(yes.pawn).toBe(friend);
    // dealBetween() is the endgame lookup; a pawn promise is a working safety
    // deal, so it is asserted on the store it actually lives in.
    const promise = (gs.sideDeals || []).find(d => d.active !== false && d.type === 'safety'
      && d.players?.includes(hoh) && d.players?.includes(friend));
    expect(promise, 'the yes never became a promise').toBeTruthy();

    // Cold candidates in a tiny house: everybody refuses, somebody sits anyway.
    const small = house.slice(0, 6);
    const strangers = [small[3], small[4]];
    strangers.forEach(n => addBondDirect(hoh, n, -4));
    const plan2 = { target: small[2], pawn: strangers[0], pawnRanking: [...strangers], nominees: [small[2], strangers[0]] };
    const no = negotiatePawn(hoh, small, plan2, () => 0.1);
    expect(no.forced, 'nobody refused in a six-person house of enemies').toBe(true);
    expect(no.asked.every(a => !a.accepted)).toBe(true);
    expect(strangers).toContain(no.pawn);
  });
});
