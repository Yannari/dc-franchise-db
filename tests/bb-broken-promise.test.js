// Going back on your word, as something that can actually happen.
//
// Measured before this existed: 40 of 546 ballots were held by a voter with an
// active `vote` deal, and exactly ONE of them ever moved — 2.5%, against 10.1%
// for everybody else. The cause was circular rather than mis-tuned.
// `houseVoteCommitment` added 0.3 to `strength` for being promised, and every
// path that can move a ballot is gated on firmness: the bandwagon rolls on
// `1 - strength`, a final plea resists on `strength * 5.5`, and the alliance
// room refused outright on `strength >= 0.6`. A promised voter sits at 0.93
// median. The flag that created the possibility of a broken promise was the
// same flag that prevented it.
//
// The fix is not a bigger number. A promise SHOULD firm a vote against
// ordinary drift — a bandwagon, a room that wants a body, a speech aimed at
// nobody. What it must not do is armour somebody against the person on the
// other side of the promise arriving to renegotiate it. So `promiseHold` is
// published separately, and the ask that names the promise takes it back off
// and charges loyalty and what the voter owes the promisee instead.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { houseVoteCommitment } from '../js/bb/strategy.js';
import { promiseAsk } from '../js/bb/vote-operation.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ryan', 'Will', 'Eva', 'Arlo'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'challenge-beast', 'perceptive-player', 'chaos-agent', 'schemer'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'twist', bbSafetyMode: 'off', theme: '' });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

beforeEach(house);

describe('the commitment knows who was promised', () => {
  const NOMS = ['Millie', 'Caleb'];
  const ballotFor = (voter, evict) => ({ voter, evict, margin: 2 });

  it('names the counterparty, not just the fact of a deal', () => {
    gs.sideDeals = [{ players: ['Bowie', 'Millie'], type: 'vote', active: true, genuine: true }];
    const c = houseVoteCommitment(ballotFor('Bowie', 'Caleb'), NOMS);
    expect(c.promised).toBe(true);
    // Bowie is voting out Caleb, so the promise is to keep Millie.
    expect(c.promisedTo, 'the deal was found but the other side was not').toBe('Millie');
  });

  it('publishes the part of firmness the promise is responsible for', () => {
    gs.sideDeals = [];
    const without = houseVoteCommitment(ballotFor('Bowie', 'Caleb'), NOMS);
    gs.sideDeals = [{ players: ['Bowie', 'Millie'], type: 'vote', active: true, genuine: true }];
    const withDeal = houseVoteCommitment(ballotFor('Bowie', 'Caleb'), NOMS);
    expect(without.promiseHold).toBe(0);
    expect(withDeal.promiseHold).toBeGreaterThan(0);
    // It is still IN strength — a promise firms a vote against ordinary drift.
    expect(withDeal.strength).toBeGreaterThan(without.strength);
    expect(withDeal.strength - without.strength).toBeCloseTo(withDeal.promiseHold, 5);
  });

  it('ignores a deal that lapsed or was already broken', () => {
    gs.sideDeals = [{ players: ['Bowie', 'Millie'], type: 'vote', active: false }];
    expect(houseVoteCommitment(ballotFor('Bowie', 'Caleb'), NOMS).promised).toBe(false);
    gs.sideDeals = [{ players: ['Bowie', 'Millie'], type: 'vote', active: true, broken: true }];
    expect(houseVoteCommitment(ballotFor('Bowie', 'Caleb'), NOMS).promised).toBe(false);
  });
});

describe('the ask that names the promise', () => {
  const NOMS = ['Millie', 'Caleb'];
  const commit = voter => {
    gs.sideDeals = [{ players: [voter, 'Millie'], type: 'vote', active: true, genuine: true }];
    return houseVoteCommitment({ voter, evict: 'Caleb', margin: 2 }, NOMS);
  };

  it('only exists when the target IS the person promised', () => {
    const c = commit('Bowie');
    expect(promiseAsk(c, 'Caleb'), 'an ordinary ask was treated as a promise ask').toBe(null);
    expect(promiseAsk(c, 'Millie')).toBeTruthy();
    expect(promiseAsk(c, 'Millie').promisee).toBe('Millie');
  });

  it('is null for somebody who never promised anything', () => {
    gs.sideDeals = [];
    const c = houseVoteCommitment({ voter: 'Bowie', evict: 'Caleb', margin: 2 }, NOMS);
    expect(promiseAsk(c, 'Millie')).toBe(null);
  });

  it('costs less than the voter\'s raw firmness — the promise stops being a shield', () => {
    const c = commit('Bowie');
    const ask = promiseAsk(c, 'Millie');
    // What the ordinary recruiting path would have charged.
    const s = pStats('Bowie');
    const ordinary = c.strength * 6 + s.loyalty * 0.15 + s.intuition * 0.1;
    expect(ask.resist, 'the promise still armours the person renegotiating it')
      .toBeLessThan(ordinary);
  });

  it('charges loyalty and the debt to the promisee instead', () => {
    // Two voters, same situation, opposite characters.
    const loyal = commit('Brightly');      // loyal-soldier
    const disloyal = commit('Zee');        // villain
    const a = promiseAsk(loyal, 'Millie');
    const b = promiseAsk(disloyal, 'Millie');
    expect(a.resist, 'loyalty buys nothing when a promise is renegotiated')
      .toBeGreaterThan(b.resist);

    // And being close to the person you promised makes it harder.
    const before = promiseAsk(commit('Bowie'), 'Millie').resist;
    for (let i = 0; i < 8; i++) addBond('Bowie', 'Millie', 1);
    const after = promiseAsk(commit('Bowie'), 'Millie').resist;
    expect(after, 'what you owe the promisee counts for nothing').toBeGreaterThan(before);
  });
});

// ── the calibration ──
//
// Bounded at BOTH ends, like the jury-bubble reads. Too high and a promise
// means nothing; zero and this whole file is describing something that cannot
// happen, which is the state it was written to correct.
describe('a promise is firm, and breakable', () => {
  it('is kept more often than an ordinary vote is held, and still gets broken', () => {
    let ballots = 0, promised = 0, promisedMoved = 0, otherMoved = 0;
    let broken = 0, named = 0, asks = 0, weeks = 0;
    const brokeLoyalty = [], keptLoyalty = [];

    for (const seed of [313, 414, 515, 616, 717, 818, 919, 1020, 1121, 1222, 1323, 1424]) {
      house();
      withSeededRandom(seed, () => {
        for (let i = 0; i < 30; i++) {
          if (!simulateBBEpisode()) break;
          if (gs.bb?.over) break;
        }
      });
      for (const w of gs.bb?.weeks || []) {
        const bs = w.ballots || [];
        const cs = w.voteCommitments || [];
        if (!bs.length || !cs.length) continue;
        weeks++;
        const byVoter = new Map(cs.map(c => [c.voter, c]));
        for (const b of bs) {
          ballots++;
          const c = byVoter.get(b.voter);
          const moved = b.stated !== b.evict;
          if (c?.promised) {
            promised++;
            if (moved) promisedMoved++;
            (moved ? brokeLoyalty : keptLoyalty).push(pStats(b.voter).loyalty);
          } else if (moved) otherMoved++;
        }
        for (const p of w.voteOperation?.plans || []) {
          asks += (p.approaches || []).filter(a => a.outcome === 'breaks-promise').length;
          asks += (p.stances || []).filter(s => s.stance === 'breaks-promise'
            || s.stance === 'keeps-promise').length;
        }
        broken += (w.voteBroken || []).length;
        named += (w.voteBroken || []).filter(v => v.promisee).length;
      }
    }

    const promisedRate = promised ? promisedMoved / promised : 0;
    const otherRate = otherMoved / Math.max(1, ballots - promised);
    const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    /* eslint-disable no-console */
    console.log(`\n${ballots} ballots across ${weeks} vote weeks`);
    console.log(`promised ballots ${promised}, of which ${promisedMoved} moved `
      + `(${(promisedRate * 100).toFixed(1)}%) — was 2.5%`);
    console.log(`everyone else moved at ${(otherRate * 100).toFixed(1)}%`);
    console.log(`the ask was made ${asks} times; ${broken} promises broken, ${named} with a named victim`);
    console.log(`avg loyalty — broke it ${avg(brokeLoyalty).toFixed(1)}, kept it ${avg(keptLoyalty).toFixed(1)}`);
    /* eslint-enable no-console */

    expect(promised, 'no promised ballots in twelve seasons — the deal type is gone')
      .toBeGreaterThan(20);
    expect(asks, 'the ask that names the promise never happens').toBeGreaterThan(0);
    // Breakable.
    expect(promisedMoved, 'a promise is still unbreakable in practice').toBeGreaterThan(0);
    // But still worth something: a promise must hold a vote BETTER than none.
    expect(promisedRate, 'a promise no longer firms a vote at all')
      .toBeLessThan(otherRate);
    // And the victim is knowable, which is what the aftermath scene needs.
    expect(named, 'a broken promise with no named victim').toBe(broken);
  }, 600000);
});
