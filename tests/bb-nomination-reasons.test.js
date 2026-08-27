// Why the Head of Household says they did it.
//
// A viewer reads this line and nothing else about the decision, so it has to
// agree with the season they have been watching. Two faults made it disagree:
//
//   1. THE PLAN WAS READ BEFORE THE RELATIONSHIP. `grudge` comes off the
//      intentions layer and knows nothing about how two people actually get
//      on, and it was checked first — so a Head of Household nominated the
//      person they were in a showmance with and told them "this is personal
//      and you know what you did", at final four, in a house where everybody
//      left was a friend.
//   2. ONE SENTENCE PER BRANCH. Every reason returned a single fixed string,
//      so the conditions that fire most often were the ones a viewer heard
//      word for word most often.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, addBond, getPerceivedBond } from '../js/bonds.js';
import { _bbNomReason } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const K = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const stat = over => Object.fromEntries(K.map(k => [k, over?.[k] ?? 5]));

function house(names, { over = {} } = {}) {
  seedGame(names.map(n => ({ name: n, archetype: 'floater', gender: 'f',
    sexuality: 'straight', stats: stat(over[n]) })),
  { episode: 8, eliminated: [], namedAlliances: [] });
  gs.activePlayers = [...names];
  gs.bb = { stats: {}, house: { suspicion: {} }, weeks: [] };
  gs.showmances = []; gs.intentions = {}; gs.namedAlliances = [];
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
}
const reason = (a, b) => _bbNomReason(a, b, 'target', { num: 9 });

describe('the relationship is read before the plan', () => {
  it('does not tell a showmance partner "you know what you did"', () => {
    // The exact scene that exposed it: final four, inseparable, a showmance,
    // and the partner on the revenge list.
    house(['Zee', 'Priya', 'Bowie', 'Julia']);
    addBond('Zee', 'Priya', 9);
    gs.showmances = [{ players: ['Zee', 'Priya'], phase: 'showmance' }];
    gs.intentions = { Zee: { revenge: ['Priya'] } };
    const line = reason('Zee', 'Priya');
    expect(line, 'it called a showmance nomination a grudge')
      .not.toMatch(/this is personal|you know what you did/i);
    expect(line).toContain('Priya');
  });

  it('gives a reason the viewer can actually follow', () => {
    // The first fix put the right BRANCH in front of this scene and then wrote
    // atmosphere into it: "I would rather be the one who does this than let
    // somebody else decide it for both of us" — at final four, where the Head
    // of Household IS the somebody else. A sentence shaped like an argument
    // with no argument inside it.
    //
    // There are two real reasons to nominate your own showmance and they are
    // not the same reason. At four it is the single vote: `voters` excludes
    // the Head of Household and both nominees, so exactly one person votes and
    // it is the one left OFF the block. Nobody is choosing who goes home there
    // — they are choosing who decides. (The draft said the nominee's name was
    // unavoidable. Two of three go up: it was avoidable, and saying otherwise
    // was a lie the viewer can check.) Before four it is the pair — the house
    // prices a showmance as one player with two votes, so the only thing left
    // to decide is which week it happens in.
    const scene = (cast, week) => {
      house(cast);
      addBond(cast[0], cast[1], 9);
      gs.showmances = [{ players: [cast[0], cast[1]], phase: 'showmance' }];
      return _bbNomReason(cast[0], cast[1], 'target', { num: week });
    };
    const endgame = scene(['Zee', 'Priya', 'Bowie', 'Julia'], 9);
    expect(endgame, 'the endgame reason is not the one vote')
      .toMatch(/one vote this week|which one did not|one person votes/i);
    // And never the claim that their name could not have been left off.
    expect(endgame).not.toMatch(/always going to have your name|had to start with somebody/i);

    const mid = scene(['Zee', 'Priya', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], 4);
    expect(mid, 'mid-season gave the endgame arithmetic, which is not true yet')
      .toMatch(/one person with two votes|whether I could put you up|both sitting up there/i);

    // And the vague line is gone from both.
    for (const line of [endgame, mid]) {
      expect(line).not.toMatch(/decide it for both of us/i);
    }
  });

  it('does not tell somebody they are close to that it is nothing personal', () => {
    house(['Zee', 'Priya', 'Bowie', 'Julia']);
    addBond('Zee', 'Priya', 9);
    gs.namedAlliances = [{ name: 'The Pair', active: true, members: ['Zee', 'Priya'] }];
    const line = reason('Zee', 'Priya');
    // "There is a group in this house that does not include me" is false when
    // the group is the two of them.
    expect(line).not.toMatch(/does not include me/i);
    expect(line).not.toMatch(/Nothing about you personally/i);
  });

  it('still says it is personal when it actually is', () => {
    // The grudge line is right when the relationship is bad — it just must not
    // be the FIRST thing checked.
    house(['Zee', 'Priya', 'Bowie', 'Julia']);
    addBond('Zee', 'Priya', -6);
    gs.intentions = { Zee: { revenge: ['Priya'] } };
    expect(reason('Zee', 'Priya')).toMatch(/personal|waiting for this|about you and me/i);
  });

  it('gives the honest reason at the end of the game', () => {
    // At four there is no such thing as a fair nomination, and the house says
    // so. Anything that invents a grievance here is writing a different season.
    house(['Zee', 'Priya', 'Bowie', 'Julia']);
    addBond('Zee', 'Priya', 3);
    gs.namedAlliances = [{ name: 'The Four', active: true, members: ['Zee', 'Priya'] }];
    const line = reason('Zee', 'Priya');
    expect(line).toMatch(/nobody left|run out of other people|somebody had to be/i);
  });
});

describe('it does not say the same thing every week', () => {
  it('varies the line between different pairs in the same situation', () => {
    house(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    for (const n of ['B', 'C', 'D', 'E', 'F', 'G', 'H']) addBond('A', n, -6);
    const lines = new Set(['B', 'C', 'D', 'E', 'F', 'G', 'H'].map(n => reason('A', n)
      .replace(/<strong>[^<]*<\/strong>/g, 'X')));
    expect(lines.size, 'every nomination used the identical sentence').toBeGreaterThan(1);
  });

  it('says the same thing on a replay of the same week', () => {
    // Seeded on the pair and the week: a viewer rewatching must not find the
    // ceremony saying something else.
    house(['Zee', 'Priya', 'Bowie', 'Julia']);
    addBond('Zee', 'Priya', 9);
    const first = reason('Zee', 'Priya');
    expect(reason('Zee', 'Priya')).toBe(first);
    expect(reason('Zee', 'Priya')).toBe(first);
  });
});

describe('every line is a whole sentence about the right person', () => {
  it('never leaves a placeholder or the wrong name in it', () => {
    house(['A', 'B', 'C', 'D', 'E', 'F']);
    const cases = [
      () => { addBond('A', 'B', 9); },
      () => { gs.showmances = [{ players: ['A', 'B'], phase: 'showmance' }]; },
      () => { gs.intentions = { A: { revenge: ['B'] } }; addBond('A', 'B', -6); },
      () => { gs.bb.stats = { B: { hohWins: 2, vetoWins: 1 } }; },
      () => { gs.namedAlliances = [{ name: 'X', active: true, members: ['B', 'C'] }]; },
    ];
    for (const setUp of cases) {
      house(['A', 'B', 'C', 'D', 'E', 'F']);
      setUp();
      for (const role of ['target', 'pawn']) {
        const line = _bbNomReason('A', 'B', role, { num: 4 });
        expect(line, 'an empty reason').toBeTruthy();
        expect(line).not.toMatch(/undefined|NaN|\$\{/);
        expect(line, 'the speech never names the nominee').toContain('B');
        expect(line.trim().endsWith('"'), `unclosed quote: ${line.slice(-40)}`).toBe(true);
      }
    }
  });
});
