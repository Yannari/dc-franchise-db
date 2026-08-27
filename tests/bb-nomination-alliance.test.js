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
import { memberLoyalty } from '../js/bb/blocs.js';
import { rememberStrategy, strategicMemoryScore } from '../js/strategy-memory.js';
import { readFileSync } from 'node:fs';
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

describe('a competing home is a comparison, not a headcount', () => {
  // Reported from the alliance panel: too many members reading 0.0, which the
  // docstring defines as somebody already gone in everything but the
  // announcement. Measured over eight seasons before the change — the reading
  // was a pure count penalty:
  //
  //   other blocs  0 -> mean 7.23, none at zero
  //                2 -> mean 3.07, 17% at zero
  //                3 -> mean 0.61, 75% at zero
  //                4 -> mean 0.00, 100% at zero
  //
  // `elsewhere` summed the ABSOLUTE power of every other bloc and took 0.16 of
  // it off a score capped at 1.0 — but power is `share x cohesion x size`, so
  // a six in a house of twelve is ~1.8 and it climbs as the house shrinks.
  // Being in more rooms zeroed you even when this was the strongest room you
  // were in. The reason string always claimed the right idea — "has a second
  // home that is doing better than this one" — and the code never compared
  // anything.
  const bloc = (id, members, power) => ({ id, name: id, members, power, kind: 'group' });

  function withBlocs(list, bonds = []) {
    const names = [...new Set(list.flatMap(b => b.members))];
    seedGame(names.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      sexuality: 'straight', stats: stat() })), { episode: 6, eliminated: [], namedAlliances: [] });
    gs.activePlayers = [...names];
    gs.bb = { stats: {}, house: { suspicion: {} }, weeks: [] };
    gs.namedAlliances = list.map(b => ({ name: b.name, active: true, members: b.members }));
    for (const [a, b, v] of bonds) addBond(a, b, v);
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  }

  it('does not punish somebody for being in the strongest room they are in', () => {
    // Same person, same bonds. The only difference is that the side deal is
    // weaker than the home bloc, which is not a reason to call them gone.
    const home = bloc('Home', ['A', 'B', 'C', 'D'], 2.0);
    withBlocs([home, bloc('Side', ['A', 'E'], 0.4)], [['A', 'B', 5], ['A', 'C', 5], ['A', 'D', 5]]);
    expect(memberLoyalty('A', home).loyalty, 'a weak side deal emptied the main alliance')
      .toBeGreaterThan(4);
  });

  it('still marks somebody whose other home is genuinely bigger', () => {
    const weak = bloc('Weak', ['A', 'B'], 0.3);
    withBlocs([weak, bloc('Strong', ['A', 'C', 'D', 'E', 'F'], 3.0)], [['A', 'B', 5]]);
    const held = memberLoyalty('A', weak).loyalty;
    withBlocs([weak], [['A', 'B', 5]]);
    expect(held).toBeLessThan(memberLoyalty('A', weak).loyalty);
  });

  it('never reads a well-connected houseguest as already gone', () => {
    // Four rooms, warm in all of them. Before the change this was 0.0.
    const home = bloc('Home', ['A', 'B', 'C'], 1.5);
    withBlocs([home, bloc('Two', ['A', 'D'], 1.2), bloc('Three', ['A', 'E'], 1.1),
      bloc('Four', ['A', 'F'], 1.0)], [['A', 'B', 6], ['A', 'C', 6]]);
    expect(memberLoyalty('A', home).loyalty).toBeGreaterThan(1);
  });

  it('does not empty a showmance just because one of them has an alliance', () => {
    // The same fault reached the showmance rows: a two-person couple can never
    // out-power a six, so anybody in both took the maximum penalty. Measured
    // after the change, couples read a mean of 7.24 and none at 0.0.
    const couple = { id: 'C1', name: 'C1', members: ['A', 'B'], power: 0.3, kind: 'couple' };
    withBlocs([couple, bloc('Pact', ['A', 'C', 'D', 'E', 'F', 'G'], 2.6)], [['A', 'B', 8]]);
    expect(memberLoyalty('A', couple).loyalty, 'the showmance read as abandoned')
      .toBeGreaterThan(3);
  });
});

describe('nominating your own alliance is felt by the room', () => {
  // It used to cost exactly one relationship — the person in the chair — while
  // the rest of the group felt nothing at all. Bonds, deliberately, and
  // nothing binary: memberLoyalty reads them for its inward term and
  // dissolution reads them for bonds-collapsed, so it CAN break the alliance
  // and is nowhere near guaranteed to. Measured over twelve seasons: 31 ally
  // nominations (asked pawns cost nothing and are excluded), and the groups it
  // happened to dissolved less often than the ones it did not.
  //
  // This plays weeks rather than asserting on a fixture, because the thing
  // worth guarding is the wiring: the block runs inside the nomination step
  // and a rename upstream would silently stop it firing.
  it('writes it to the alliance ledger without deciding anything', async () => {
    const { simulateBBEpisode } = await import('../js/bb-run.js');
    const { threatScore } = await import('../js/players.js');
    const { ordinal } = await import('../js/finale.js');
    const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const spread = n => Object.fromEntries(KEYS.map((k, i) => [k, 1 + ((n * 13 + i * 5) % 10)]));
    const ARCH = ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat',
      'social-butterfly', 'loyal-soldier', 'wildcard', 'underdog', 'perceptive-player',
      'challenge-beast'];
    seedGame(Array.from({ length: 14 }, (_, i) => ({ name: 'P' + i,
      archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
      sexuality: 'straight', stats: spread(i + 1) })),
    { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
      finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
      romance: 'enabled', twistSchedule: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
      getBond, getPerceivedBond, ordinal });

    const seen = [];
    for (let w = 0; w < 12; w++) {
      if (!simulateBBEpisode()) break;
      for (const a of gs.namedAlliances || []) {
        for (const h of a.history || []) {
          if (h.type === 'nominated-own') seen.push({ ...h, alliance: a.name, members: a.members });
        }
      }
      if (seen.length) break;
    }
    expect(seen.length, 'a whole season of nominations and the ledger says nothing').toBeGreaterThan(0);
    const entry = seen[0];
    expect(entry.player).toBeTruthy();
    expect(entry.victim).toBeTruthy();
    expect(entry.player).not.toBe(entry.victim);
    expect(typeof entry.target).toBe('boolean');
    // And it must NOT be on the betrayal list: that one drives expulsion, and
    // two entries would eject the Head of Household from their own alliance
    // automatically — which is the binary outcome this deliberately avoids.
    const group = (gs.namedAlliances || []).find(a => a.name === entry.alliance);
    expect((group.betrayals || []).some(b => b.reason === 'nominated-own')).toBe(false);
  });
});

describe('the alliance panel does not name the evictee', () => {
  // Reported from a live watch: one face in the alliance rows had no number
  // under it, and it was the person about to be evicted — so the panel gave
  // the result away on screens that play days before the vote.
  //
  // The cause was a roster, not a renderer. `_buildBlocs` filters members to
  // gs.activePlayers and the board is snapshotted AFTER the eviction is
  // applied, so anybody who had just left was missing from every bloc, while
  // the alliance row itself still listed them. `_bbfHold` draws a bare avatar
  // for a member with no board row — which is exactly the tell.
  it('keeps a hold reading for somebody evicted that week', async () => {
    const { simulateBBEpisode } = await import('../js/bb-run.js');
    const { threatScore } = await import('../js/players.js');
    const { ordinal } = await import('../js/finale.js');
    const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const spread = n => Object.fromEntries(KEYS.map((k, i) => [k, 1 + ((n * 13 + i * 5) % 10)]));
    const ARCH = ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat',
      'social-butterfly', 'loyal-soldier', 'wildcard', 'underdog', 'perceptive-player',
      'challenge-beast'];
    seedGame(Array.from({ length: 14 }, (_, i) => ({ name: 'P' + i,
      archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
      sexuality: 'straight', stats: spread(i + 1) })),
    { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
      finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
      romance: 'enabled', twistSchedule: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
      getBond, getPerceivedBond, ordinal });

    let checked = 0;
    for (let w = 0; w < 10; w++) {
      if (!simulateBBEpisode()) break;
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      if (!week?.evicted) continue;
      for (const a of gs.namedAlliances || []) {
        if (!(a.members || []).includes(week.evicted)) continue;
        const board = (week.allianceBoard || []).find(b => b.name === a.name);
        if (!board) continue;
        checked++;
        expect((board.members || []).some(m => m.name === week.evicted),
          `${week.evicted} was evicted in week ${week.num} and vanished from the `
          + `"${a.name}" board — the missing number is the spoiler`).toBe(true);
      }
    }
    expect(checked, 'no evicted alliance member was ever checked').toBeGreaterThan(0);
  });
});

describe('the number can see the one thing this group can do to you', () => {
  // Reported from a live watch: "after Ripper nominated Priya when they were
  // in the same alliance and had other options, neither of their loyalty
  // dropped in the next house life."
  //
  // It was not dropping, and the cause is arithmetic. `inward` averages the
  // member's bonds with everybody else in the room, and being put on the block
  // by your own Head of Household lands on exactly ONE of those bonds. In a
  // seven-strong alliance a -1.4 hit moves the mean of six by -0.23, which the
  // score multiplies by 0.045 and turns into a tenth of a point. Measured over
  // 14 seasons the person who was put up moved by a mean of -0.06 across that
  // week, and went UP as often as down. The same watch showed both halves of
  // it: the three-strong Double Edge moved 4.7 down 3.7, and the five-strong
  // Shield Wall, containing the same two people, did not move at all.
  //
  // So it is read as an event now, from the ledger the ceremony writes.
  const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
    'loyalty', 'boldness', 'intuition', 'temperament'];
  const flat = () => Object.fromEntries(KEYS.map(k => [k, 5]));

  function group(size, { week = 4 } = {}) {
    const names = Array.from({ length: size + 2 }, (_, i) => 'M' + i);
    seedGame(names.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      sexuality: 'straight', stats: flat() })), { episode: week, eliminated: [], namedAlliances: [] });
    gs.activePlayers = [...names];
    gs.bb = { stats: {}, house: { suspicion: {} }, weeks: [{ num: week }] };
    gs.namedAlliances = [{ name: 'The Group', active: true, members: names.slice(0, size) }];
    for (let i = 1; i < size; i++) addBond('M0', 'M' + i, 6);
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    return { id: 'a:The Group', name: 'The Group', label: 'The Group',
      members: names.slice(0, size), power: 1.4, kind: 'alliance' };
  }
  const ledger = (victim, { target = true, week = 4 } = {}) => {
    const a = gs.namedAlliances[0];
    (a.history ||= []).push({ week, type: 'nominated-own', player: 'M1', victim, target });
  };

  it('drops the reading of somebody their own alliance put on the block', () => {
    for (const size of [3, 5, 7]) {
      const bloc = group(size);
      const before = memberLoyalty('M0', bloc).loyalty;
      ledger('M0');
      const after = memberLoyalty('M0', bloc).loyalty;
      expect(before - after, `a ${size}-member alliance swallowed the betrayal`)
        .toBeGreaterThan(0.8);
    }
  });

  it('does not swallow it in a big alliance the way the average did', () => {
    // The whole point: the size of the group must not decide whether the
    // betrayal is visible.
    const small = group(3); ledger('M0');
    const dropSmall = 10 - memberLoyalty('M0', small).loyalty;
    const big = group(7); ledger('M0');
    const dropBig = 10 - memberLoyalty('M0', big).loyalty;
    expect(Math.abs(dropSmall - dropBig)).toBeLessThan(2.5);
  });

  it('counts the week in progress, which has not been filed yet', () => {
    // A week is only appended to gs.bb.weeks once it is over, so an entry
    // written during the week in progress reads as one week in the FUTURE.
    // Guarding that out meant the drop never appeared on any screen inside the
    // week it happened — which is exactly where somebody looks for it.
    const bloc = group(4, { week: 4 });
    const before = memberLoyalty('M0', bloc).loyalty;
    ledger('M0', { week: 5 });   // this week; gs.bb.weeks still says 4
    expect(memberLoyalty('M0', bloc).loyalty).toBeLessThan(before);
  });

  it('fades, and is gone after two weeks', () => {
    const bloc = group(4, { week: 9 });
    ledger('M0', { week: 9 });
    const fresh = memberLoyalty('M0', bloc).loyalty;
    gs.namedAlliances[0].history = [];
    ledger('M0', { week: 6 });
    expect(memberLoyalty('M0', bloc).loyalty).toBeGreaterThan(fresh);
  });

  it('costs less for a pawn than for the target', () => {
    const bloc = group(4);
    ledger('M0', { target: false });
    const pawn = memberLoyalty('M0', bloc).loyalty;
    gs.namedAlliances[0].history = [];
    ledger('M0', { target: true });
    expect(memberLoyalty('M0', bloc).loyalty).toBeLessThan(pawn);
  });

  it('says why, instead of dropping a number with no explanation', () => {
    const bloc = group(4);
    ledger('M0');
    expect(memberLoyalty('M0', bloc).reason).toMatch(/put on the block/i);
  });
});

describe('whether the group agreed decides whose number moves', () => {
  // Two different weeks were being priced identically. If the rest of the
  // alliance also wanted this person gone, the Head of Household carried out
  // the group's decision: the one in the chair was sold out by everybody, and
  // the person who said it out loud was doing the job. If nobody else was
  // pointed at them, the same act is somebody spending the alliance's week on
  // the alliance's own member without asking — and then it is the NOMINATOR
  // standing outside the group.
  //
  // Measured over 176 weeks after the change:
  //   the group agreed -> the one put up -1.50, the one who did it -0.35
  //   went rogue       -> the one put up -0.88, the one who did it -2.06
  const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
    'loyalty', 'boldness', 'intuition', 'temperament'];
  const flat = () => Object.fromEntries(KEYS.map(k => [k, 5]));

  function group(size = 4, { week = 4 } = {}) {
    const names = Array.from({ length: size + 2 }, (_, i) => 'M' + i);
    seedGame(names.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      sexuality: 'straight', stats: flat() })), { episode: week, eliminated: [], namedAlliances: [] });
    gs.activePlayers = [...names];
    gs.bb = { stats: {}, house: { suspicion: {} }, weeks: [{ num: week }] };
    gs.namedAlliances = [{ name: 'The Group', active: true, members: names.slice(0, size) }];
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    return { id: 'a:The Group', name: 'The Group', label: 'The Group',
      members: names.slice(0, size), power: 1.4, kind: 'alliance' };
  }
  const ledger = (victim, consented, { week = 4, player = 'M1' } = {}) => {
    const a = gs.namedAlliances[0];
    (a.history ||= []).push({ week, type: 'nominated-own', player, victim, target: true, consented });
  };

  it('takes it out of the one who was put up when the group agreed', () => {
    const bloc = group(); const clean = memberLoyalty('M0', bloc).loyalty;
    ledger('M0', true);
    expect(clean - memberLoyalty('M0', bloc).loyalty).toBeGreaterThan(1.5);
  });

  it('takes it out of the one who did it when nobody else agreed', () => {
    const bloc = group(); const clean = memberLoyalty('M1', bloc).loyalty;
    ledger('M0', false);
    expect(clean - memberLoyalty('M1', bloc).loyalty,
      'going rogue with the alliance week cost the nominator nothing')
      .toBeGreaterThan(1.5);
  });

  it('costs the nominator nothing when they were doing the group\'s work', () => {
    const bloc = group(); const clean = memberLoyalty('M1', bloc).loyalty;
    ledger('M0', true);
    expect(clean - memberLoyalty('M1', bloc).loyalty).toBeLessThan(0.5);
  });

  it('hurts the nominee less when the group did not sanction it', () => {
    // They still got put up, but four people did not agree to it, so the group
    // is still theirs in a way it is not when everybody wanted the chair filled.
    const bloc = group(); ledger('M0', true);
    const sold = memberLoyalty('M0', bloc).loyalty;
    group(); ledger('M0', false);
    expect(memberLoyalty('M0', bloc).loyalty).toBeGreaterThan(sold);
  });
});

describe('and the version where nobody says anything', () => {
  // Walking out of an alliance tells everybody in it what you are going to do
  // next, and the whole value of being finished with somebody is that they do
  // not know it. So a break has two shapes, and the quiet one is the better
  // play: the name stays on the list and the person behind it starts counting.
  // Both directions get it — somebody the group put up can stay sworn to them
  // to take the shot when it is worth most, and a group can decline to throw
  // out the member who went rogue for exactly the same reason.
  //
  // Measured over 176 weeks: 5 quit, 4 thrown out, 5 stayed in for it.
  const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
    'loyalty', 'boldness', 'intuition', 'temperament'];
  const flat = () => Object.fromEntries(KEYS.map(k => [k, 5]));

  it('reads as gone while still being drawn inside the group', () => {
    // memberLoyalty's own docstring says 0 is somebody already gone in
    // everything but the announcement. That is exactly this, and the number
    // under the face is the only place a viewer can see it — the membership
    // list cannot show it, which is the point of doing it this way.
    const names = ['M0', 'M1', 'M2', 'M3', 'M4'];
    seedGame(names.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      sexuality: 'straight', stats: flat() })), { episode: 5, eliminated: [], namedAlliances: [] });
    gs.activePlayers = [...names];
    gs.bb = { stats: {}, house: { suspicion: {} }, weeks: [{ num: 5 }] };
    gs.namedAlliances = [{ name: 'The Group', active: true, members: ['M0', 'M1', 'M2', 'M3'] }];
    for (const n of ['M1', 'M2', 'M3']) addBond('M0', n, 7);
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    const bloc = { id: 'a:The Group', name: 'The Group', label: 'The Group',
      members: ['M0', 'M1', 'M2', 'M3'], power: 1.4, kind: 'alliance' };

    const held = memberLoyalty('M0', bloc).loyalty;
    expect(held, 'a member with warm bonds should read high').toBeGreaterThan(6);
    gs.namedAlliances[0].hidden = [{ player: 'M0', since: 5, aim: 'M1' }];
    const quiet = memberLoyalty('M0', bloc);
    expect(quiet.loyalty, 'somebody who has already decided still read as held')
      .toBeLessThan(held - 3);
    expect(quiet.reason).toMatch(/on paper|already decided/i);
    // And the list is untouched: that is the whole mechanic.
    expect(gs.namedAlliances[0].members).toContain('M0');
  });

  it('is a choice of character, and the ones who never scheme never take it', () => {
    const week = readFileSync('js/bb/week.js', 'utf8');
    expect(week, 'the quiet break is not gated on archetype')
      .toMatch(/'hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'/);
    // The house has to actually intend something by it, or it is just a flag.
    expect(week).toMatch(/setBBTarget\(leaverName/);
  });

  it('tells the audience what the house cannot see', () => {
    const vp = readFileSync('js/vp-screens.js', 'utf8');
    expect(vp).toMatch(/SAYS NOTHING/);
    expect(vp, 'the open break and the quiet one look the same on screen')
      .toMatch(/bbns-quiet/);
  });
});

describe('and the screen says who is no longer in what', () => {
  it('gives the exit its own card rather than hiding it inside a nominee card', () => {
    // Reported from a real week: Priya nominated a member of The Shield Wall,
    // vanished from it between one screen and the next, and the ceremony said
    // nothing at all. The card was keyed on the NOMINEE's name — which draws
    // for somebody who quit after the group put them up, and draws nothing for
    // the far more common case, where the person removed is the Head of
    // Household being thrown out for spending the alliance's week on one of
    // its own. The Head of Household has no card on that screen.
    const vp = readFileSync('js/vp-screens.js', 'utf8');
    expect(vp, 'the exit is still only drawn inside a nominee card')
      .toMatch(/steps\.push\(\{ kind: 'exit'/);
    expect(vp).toMatch(/step\.kind === 'exit'/);
    expect(vp).toMatch(/THROWN OUT BY THEM/);
  });

  it('says when an alliance ends instead of just not drawing it', () => {
    // The other half of the same report: The Safety Net was in the panel
    // before the veto ceremony and simply gone after it. `reconcileAlliances`
    // computes a dissolutionReason on the line above and nothing ever read it.
    const shared = readFileSync('js/bb/shared-strategy.js', 'utf8');
    expect(shared, 'a dissolution still tells nobody').toMatch(/allianceDissolved/);
    const run = readFileSync('js/bb-run.js', 'utf8');
    expect(run, 'it never reaches the episode').toMatch(/allianceDissolved/);
    const vp = readFileSync('js/vp-screens.js', 'utf8');
    expect(vp, 'it never reaches a screen').toMatch(/is finished —/);
  });
});

describe('whether they took it to the group first', () => {
  // Asked whether expulsion was too harsh, or whether Heads of Household just
  // do not take precautions. It was the second, and it was not their fault:
  // consent was being read PASSIVELY — whether the rest of the group already
  // happened to want the nominee gone — because the house had no way to ask.
  // There is a pawn conversation and nothing at all for "I need to put one of
  // ours up". 47 of 74 ally-nominations came back rogue, and an alliance being
  // blindsided by its own Head of Household should not be the default
  // behaviour of the format.
  //
  // Three answers now. Measured over 176 weeks:
  //   signed off   46%, somebody leaves over it  8%
  //   never asked  40%,                         19%
  //   overruled    13%,                         43%
  it('produces all three answers, with the group agreeing most often', async () => {
    const { simulateBBEpisode } = await import('../js/bb-run.js');
    const { threatScore } = await import('../js/players.js');
    const { ordinal } = await import('../js/finale.js');
    const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const spread = n => Object.fromEntries(KEYS.map((k, i) => [k, 1 + ((n * 13 + i * 5) % 10)]));
    const ARCH = ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat',
      'social-butterfly', 'loyal-soldier', 'wildcard', 'underdog', 'perceptive-player',
      'challenge-beast'];
    const seen = {};
    for (let s = 0; s < 8; s++) {
      seedGame(Array.from({ length: 14 }, (_, i) => ({ name: 'P' + i,
        archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
        sexuality: 'straight', stats: spread(i + 1) })),
      { episode: 0, eliminated: [], namedAlliances: [] });
      gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
      gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
      gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
      Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
        finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
        romance: 'enabled', twistSchedule: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
        getBond, getPerceivedBond, ordinal });
      for (let w = 0; w < 11; w++) {
        if (!simulateBBEpisode()) break;
        const week = gs.bb.weeks[gs.bb.weeks.length - 1];
        for (const t of week?.allianceConsults || []) {
          seen[t.stance] = (seen[t.stance] || 0) + 1;
          expect(t.of).toBeGreaterThan(0);
          expect(t.agrees).toBeLessThanOrEqual(t.of);
        }
      }
    }
    const total = Object.values(seen).reduce((a, b) => a + b, 0);
    expect(total, 'nobody ever nominated their own alliance in eight seasons').toBeGreaterThan(4);
    expect(seen.sanctioned, 'the group never once signed off on it').toBeGreaterThan(0);
    // Being blindsided by your own alliance must not be the common case.
    expect((seen['never-asked'] || 0) / total,
      'most Heads of Household still put one of their own up without a word')
      .toBeLessThan(0.55);
  });

  it('a pawn is a formality and a target is a fight', () => {
    // Without this distinction a third of ally-nominations came back as the
    // group being told no and overruled, because members of a tight alliance
    // have warm bonds with each other and were objecting to a pawn exactly the
    // way they objected to a target.
    const week = readFileSync('js/bb/week.js', 'utf8');
    expect(week).toMatch(/acceptsAt = \(isTarget \? 1\.5 : 5\.5\)/);
    // And somebody who can sell it, sells it.
    expect(week).toMatch(/persuasion/);
  });

  it('prices carelessness below defiance', () => {
    // These were both 0.05, which said that never asking costs a group exactly
    // what asking and being told yes costs it.
    const week = readFileSync('js/bb/week.js', 'utf8');
    const m = week.match(/stance === 'overruled' \? ([\d.]+) : stance === 'never-asked' \? ([\d.]+) : ([\d.]+)/);
    expect(m, 'the departure odds no longer read the stance').toBeTruthy();
    const [, overruled, never, signed] = m.map(Number);
    expect(overruled).toBeGreaterThan(never);
    expect(never).toBeGreaterThan(signed);
  });

  it('puts the conversation on the screen before the keys turn', () => {
    const vp = readFileSync('js/vp-screens.js', 'utf8');
    expect(vp).toMatch(/kind: 'consult'/);
    expect(vp).toMatch(/THE GROUP SIGNED OFF/);
    expect(vp).toMatch(/TOLD NO, DID IT ANYWAY/);
    expect(vp).toMatch(/NEVER ASKED THEM/);
  });
});
