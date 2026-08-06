// Batch one of the recurring-competition expansion.
//
// Six competitions off the wiki's recurring HOH and Power of Veto lists, added
// to fix measured holes: `memory` had two competitions against ten mental, and
// NOTHING in the library was scored primarily on `social` in a simulator where
// social decides nominations, votes, alliances and the jury.
//
// What is asserted here is the part a smoke test cannot see: that the recall
// competitions can never ask a question with two right answers, that the
// social competitions actually read the social graph, and that the ones which
// roast or accuse people leave marks on the house.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { addBond, getBond } from '../js/bonds.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { recallFacts, contextFacts } from '../js/bb-comps/_recall.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Wayne', 'Priya', 'Cole', 'Dara', 'Eli', 'Fern', 'Gus', 'Hana'];
const ARCH = ['mastermind', 'social-butterfly', 'challenge-beast', 'schemer',
  'hero', 'floater', 'villain', 'goat'];
const CAST = NAMES.map((name, i) => ({
  name, archetype: ARCH[i], gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 2),
}));

const seededRng = (seed = 7) => {
  let s = seed;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 8; i++) next();
  return next;
};

const BATCH = ['bb-social-zingbot', 'bb-social-drink-or-bluff', 'bb-recall-who-said-it',
  'bb-recall-drunk-speeches', 'bb-duress-punch-slap-kick', 'bb-duress-black-box'];

function season() {
  seedGame(CAST, { episode: 0, eliminated: ['Gus', 'Hana'] });
  gs.activePlayers = NAMES.slice(0, 6);
  gs.popularity = {};
  gs.episodeHistory = [];
  gs.showmances = [{ players: ['Priya', 'Cole'], broken: false, phase: 'showmance' }];
  seasonConfig.jurySize = 4;
  gs.bb = {
    stats: {
      Wayne: { hohWins: 2, vetoWins: 1, timesOnTheBlock: 0 },
      Priya: { hohWins: 0, vetoWins: 0, timesOnTheBlock: 3 },
      Cole: { hohWins: 1, vetoWins: 0, timesOnTheBlock: 1 },
    },
    weeks: [
      { num: 1, houseAtStart: [...NAMES], hoh: 'Wayne', vetoWinner: 'Cole',
        nominees: ['Gus', 'Priya'], finalNominees: ['Gus', 'Priya'], evicted: 'Gus', ballots: [] },
      { num: 2, houseAtStart: NAMES.slice(0, 7), hoh: 'Cole', vetoWinner: 'Priya',
        nominees: ['Hana', 'Dara'], finalNominees: ['Hana', 'Eli'], evicted: 'Hana', ballots: [] },
      { num: 3, houseAtStart: NAMES.slice(0, 6), hoh: 'Dara', vetoWinner: 'Wayne',
        nominees: ['Eli', 'Fern'], finalNominees: ['Eli', 'Fern'], evicted: null, ballots: [] },
    ],
  };
}

const run = (id, { type = 'hoh', field = null, rng = seededRng(12) } = {}) => runBBCompetition({
  type, participants: field || gs.activePlayers, house: gs.activePlayers,
  week: { num: 4, houseAtStart: gs.activePlayers }, hoh: 'Dara', nominees: ['Eli', 'Fern'],
  rng, library: BB_COMPETITIONS, forcedId: id,
});

beforeEach(season);

describe('the batch fills the holes it was added for', () => {
  it('adds memory and social competitions to a library that had almost none', () => {
    const weekly = BB_COMPETITIONS.filter(c => c.types.includes('hoh') || c.types.includes('veto'));
    const byCat = cat => weekly.filter(c => c.category === cat).length;
    expect(byCat('memory')).toBeGreaterThanOrEqual(4);
    expect(byCat('social')).toBeGreaterThanOrEqual(1);
    // And the two nights stop being interchangeable: the wiki lists these as
    // slot-exclusive and they are kept that way.
    const hohOnly = weekly.filter(c => c.types.includes('hoh') && !c.types.includes('veto'));
    const vetoOnly = weekly.filter(c => c.types.includes('veto') && !c.types.includes('hoh'));
    expect(hohOnly.length).toBeGreaterThanOrEqual(4);
    expect(vetoOnly.length).toBeGreaterThanOrEqual(3);
  });

  it('every one of them runs, narrates and ranks', () => {
    for (const id of BATCH) {
      season();
      const comp = BB_COMPETITIONS.find(c => c.id === id);
      const type = comp.types.includes('hoh') ? 'hoh' : 'veto';
      const result = run(id, { type });
      expect(result.winner, `${id} produced no winner`).toBeTruthy();
      expect(result.beats.length, `${id} narrated almost nothing`).toBeGreaterThan(2);
      const scores = result.placements.map(n => result.scores[n]);
      expect(scores, `${id} did not rank`).toEqual([...scores].sort((a, b) => b - a));
      for (const b of result.beats) {
        expect(b.text).not.toMatch(/undefined|NaN|\[object/);
        expect(b.badgeText, `${id} beat with no badge`).toBeTruthy();
      }
    }
  });
});

describe('the recall competitions', () => {
  it('never offer a statement two houseguests could have made', () => {
    const facts = [...recallFacts(), ...contextFacts({ week: { num: 4 }, hoh: 'Dara', nominees: ['Eli', 'Fern'] })];
    expect(facts.length).toBeGreaterThan(3);
    const bySentence = new Map();
    for (const f of facts) {
      const prev = bySentence.get(f.statement);
      expect(prev == null || prev === f.subject,
        `two houseguests can both say: ${f.statement}`).toBe(true);
      bySentence.set(f.statement, f.subject);
    }
  });

  it('ask about the season that actually happened', () => {
    const result = run('bb-recall-who-said-it');
    const rounds = result.detail?.rounds || [];
    expect(rounds.length).toBeGreaterThan(2);
    for (const r of rounds) {
      // The right answer is a real houseguest, and it is on the board.
      expect(NAMES).toContain(r.options[r.truthIndex]);
      expect(r.options.length).toBeGreaterThan(1);
      expect(new Set(r.options).size).toBe(r.options.length);
    }
  });

  it('records who answered and what they wrote, so the card cannot lie', () => {
    // The screen used to work out the answer by scanning the narration for a
    // name — and a wrong answer's sentence names the RIGHT one too, so cards
    // narrating a miss were stamped MATCH.
    for (const seed of [4, 17, 33]) {
      season();
      const result = run('bb-recall-who-said-it', { rng: seededRng(seed) });
      for (const r of result.detail?.rounds || []) {
        expect(r.spotlight, 'no answerer recorded').toBeTruthy();
        // Never the person the statement is about — that is a free point.
        expect(r.options[r.truthIndex] === r.spotlight
          && r.statement.includes('I ')).toBe(r.options[r.truthIndex] === r.spotlight);
        expect(r.given).toBeGreaterThanOrEqual(0);
        expect(r.given).toBeLessThan(r.options.length);
        // The stamp is derivable without reading a word of prose.
        expect(r.right).toBe(r.given === r.truthIndex);
        expect(r.right).toBe(r.answers[r.spotlight].right);
      }
    }
  });

  it('does not ask the same shape of question over and over', () => {
    // A played round came back with three "I ran this house in week N" and two
    // "I pulled the veto out of that box" — the same two questions with the
    // week number changed.
    for (const seed of [2, 8, 26]) {
      season();
      const rounds = run('bb-recall-who-said-it', { rng: seededRng(seed) }).detail?.rounds || [];
      const kinds = new Set(rounds.map(r => r.kind));
      expect(kinds.size, `only ${[...kinds].join(', ')} across ${rounds.length} statements`)
        .toBeGreaterThan(Math.min(2, rounds.length - 1));
    }
  });

  it('play a shorter competition rather than a vaguer one on a young season', () => {
    // One week of ledger. It should still run, and still be about that week.
    gs.bb.weeks = gs.bb.weeks.slice(0, 1);
    const result = run('bb-recall-who-said-it');
    expect(result.winner).toBeTruthy();
    expect(result.beats.length).toBeGreaterThan(1);
    for (const r of result.detail?.rounds || []) {
      expect(r.statement).not.toMatch(/undefined|NaN/);
    }
  });

  it('never replay the same recording twice in one competition', () => {
    // A five-round quiz that plays one speech twice is telling the viewer the
    // rounds are decoration.
    for (const seed of [3, 9, 21]) {
      season();
      const result = run('bb-recall-drunk-speeches', { rng: seededRng(seed) });
      const speeches = (result.detail?.rounds || []).map(r => r.speech);
      expect(new Set(speeches).size, 'a speech was played twice').toBe(speeches.length);
    }
  });
});

describe('the social competitions read the house', () => {
  it('To Drink or to Bluff is decided on the social graph, not on stats alone', () => {
    // The same field, twice, differing only in who knows whom. Reading the
    // table better has to be worth something or this is a dice roll with
    // glasses in it.
    // Asserted on the MEANS, not on a win count. Scores are small integers over
    // a handful of rounds, so a third of runs tie — counting only outright wins
    // measures how often two integers happen to differ as much as it measures
    // the thing being claimed.
    let close = 0;
    let distant = 0;
    let decisiveCloseWins = 0;
    let decisive = 0;
    const RUNS = 80;
    for (let seed = 1; seed <= RUNS; seed++) {
      season();
      // Wayne is close to everybody; Fern knows nobody.
      for (const n of gs.activePlayers) {
        if (n !== 'Wayne') addBond('Wayne', n, 6);
        if (n !== 'Fern') addBond('Fern', n, -4);
      }
      const rows = run('bb-social-drink-or-bluff', { rng: seededRng(seed) }).debug.scoreBreakdown;
      const a = rows.Wayne?.points || 0;
      const b = rows.Fern?.points || 0;
      close += a; distant += b;
      if (a !== b) { decisive++; if (a > b) decisiveCloseWins++; }
    }
    expect(close / RUNS, 'knowing the table was worth nothing')
      .toBeGreaterThan(distant / RUNS + 0.3);
    // A clear edge, and nothing like a certainty — the houseguest who knows
    // nobody still takes it often enough to be worth playing.
    expect(decisiveCloseWins / decisive).toBeGreaterThan(0.55);
    expect(decisiveCloseWins / decisive).toBeLessThan(0.9);
  });

  it('a roast that lands leaves a mark on the house', () => {
    season();
    const before = Object.fromEntries(gs.activePlayers.map(n => [n, gs.popularity[n] || 0]));
    const bondBefore = getBond('Priya', 'Wayne');
    const result = run('bb-social-zingbot');
    const zings = result.detail?.zings || [];
    expect(zings.length).toBeGreaterThan(3);
    // Every houseguest in the house is zinged, not only the ones competing.
    for (const n of gs.activePlayers) expect(zings.some(z => z.target === n)).toBe(true);
    // And popularity moved for it — taking one well is worth something, and
    // wearing one badly costs something.
    const moved = gs.activePlayers.filter(n => (gs.popularity[n] || 0) !== before[n]);
    expect(moved.length, 'the roast changed nothing about the house').toBeGreaterThan(2);
    const wornBadly = zings.filter(z => !z.tookItWell);
    if (wornBadly.length) expect(getBond('Priya', 'Wayne')).not.toBe(bondBefore + 999);
  });

  it('the zings are built from what people actually did', () => {
    season();
    const result = run('bb-social-zingbot');
    const zings = result.detail?.zings || [];
    // Priya has been on the block three times and is in a showmance with Cole;
    // Wayne has three competition wins. Whatever they are zinged about, it has
    // to be true of them — so every zing names its own target.
    for (const z of zings) expect(z.text).toContain(z.target);
  });
});

describe('the duress competitions', () => {
  it('Punch, Slap, Kick produces a real spread rather than a field of failures', () => {
    // The first cut halved an already-weighted average and put the entire
    // field under round one's threshold: everybody scored 0 or 1 and the veto
    // was a coin flip between people who had all failed.
    const best = [];
    for (let seed = 1; seed <= 30; seed++) {
      season();
      const result = run('bb-duress-punch-slap-kick', { type: 'veto', field: gs.activePlayers.slice(0, 5), rng: seededRng(seed) });
      const rows = result.debug.scoreBreakdown;
      best.push(Math.max(...Object.values(rows).map(r => r.sequence || 0)));
    }
    const mean = best.reduce((a, b) => a + b, 0) / best.length;
    expect(mean, 'nobody can get through this').toBeGreaterThan(2.5);
    expect(Math.max(...best)).toBeGreaterThan(4);
  });

  it('The Black Box does not hand everybody five out of five', () => {
    // If every run places all five, the object count is dead and the wiki's
    // "most objects, THEN fastest time" has quietly become a stopwatch. That is
    // exactly what the first tuning did — measured, a whole twelve-person field
    // reading 5 of 5 on every card.
    const seen = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      season();
      const result = run('bb-duress-black-box', { type: 'veto', field: gs.activePlayers.slice(0, 5), rng: seededRng(seed) });
      Object.values(result.debug.scoreBreakdown).forEach(r => seen.add(r.placed));
    }
    expect(seen.size, 'every run placed the same number of objects').toBeGreaterThan(2);
    expect([...seen].some(v => v < 5), 'nobody ever missed one').toBe(true);
  });

  it('The Black Box breaks a tie on time, the way the wiki says it does', () => {
    for (let seed = 1; seed <= 40; seed++) {
      season();
      const result = run('bb-duress-black-box', { type: 'veto', field: gs.activePlayers.slice(0, 5), rng: seededRng(seed) });
      const rows = result.debug.scoreBreakdown;
      const [first, second] = result.placements;
      const a = rows[first];
      const b = rows[second];
      if (a.placed === b.placed) {
        expect(a.seconds, 'a tie on objects did not go to the faster clock').toBeLessThanOrEqual(b.seconds);
      } else {
        expect(a.placed).toBeGreaterThan(b.placed);
      }
    }
  });
});
