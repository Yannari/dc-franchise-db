// Being cast when somebody is already waiting at home.
//
// Three separate things met here and only one of them existed:
//
//   1. A reduction in how likely somebody is to start something, based on how
//      serious the relationship they already have is. That existed.
//   2. Loyalty. It did not. A houseguest with a loyalty of nine and one with a
//      loyalty of one were equally likely to stray, and the only thing telling
//      them apart was the seriousness of the relationship they were straying
//      from — which is backwards. What you have at home sets the price; who
//      you are decides whether you pay it.
//   3. A word for it afterwards. There was none. The simulator has always
//      marked these showmances `overlapping` and nothing has ever read the
//      flag, so the most public infidelity the format can produce resolved as
//      "quietly stopped seeing each other".
//
// The timing is the part worth stating: life events resolve BETWEEN seasons,
// so nothing in the log can react while it is happening. The house reacts in
// the season, and the log records the consequence in the off-season after it.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { _homeFactor } from '../js/romance.js';
import { resolveOffSeason, RATES } from '../js/life-resolver.js';
import { KINDS } from '../js/life-events.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const withLoyalty = (name, loyalty) => ({
  name, archetype: 'floater', gender: 'f', sexuality: 'straight',
  stats: Object.fromEntries(STAT_KEYS.map(k => [k, k === 'loyalty' ? loyalty : 5])),
});

/** A house where each name carries the loyalty in it, and a partner at home. */
function houseOf(spec) {
  seedGame(spec.map(([n, l]) => withLoyalty(n, l)),
    { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns });
}

describe('who is likely to stray', () => {
  it('is decided by loyalty as well as by what they have at home', () => {
    houseOf([['Loyal', 9], ['Faithless', 1]]);
    for (const stage of ['married', 'engaged', 'living-together', 'dating']) {
      for (const n of ['Loyal', 'Faithless']) {
        players.find(p => p.name === n).partnerAtHome = { name: 'X', slug: 'x', stage };
      }
      const loyal = _homeFactor('Loyal');
      const faithless = _homeFactor('Faithless');
      expect(loyal, `${stage}: loyalty did not slow them down`).toBeLessThan(faithless);
      // And by a real margin, not a rounding difference.
      expect(faithless / loyal, `${stage}: the gap is not worth having`).toBeGreaterThan(2);
    }
  });

  it('applies at every stage, not only to marriage', () => {
    // Being disloyal to somebody you have been seeing a month is the ordinary
    // version of this, and the one that happens most.
    houseOf([['Loyal', 9], ['Faithless', 1]]);
    for (const n of ['Loyal', 'Faithless']) {
      players.find(p => p.name === n).partnerAtHome = { name: 'X', slug: 'x', stage: 'dating' };
    }
    expect(_homeFactor('Faithless')).toBeGreaterThan(0.85);   // barely slowed
    expect(_homeFactor('Loyal')).toBeLessThan(0.3);           // effectively held
  });

  it('leaves an average person exactly where they were', () => {
    // Loyalty 5 reproduces the old stage-only numbers, so this is a spread
    // around the previous behaviour rather than a blanket change to it.
    houseOf([['Average', 5]]);
    const p = players.find(x => x.name === 'Average');
    for (const [stage, was] of [['married', 0.25], ['engaged', 0.35],
      ['living-together', 0.45], ['dating', 0.6]]) {
      p.partnerAtHome = { name: 'X', slug: 'x', stage };
      expect(_homeFactor('Average')).toBeCloseTo(was, 5);
    }
  });

  it('never blocks it outright, and never quite stops caring', () => {
    // A hard gate would mean every relationship in the franchise survives
    // three months apart, which is the opposite of what being cast is for.
    houseOf([['Saint', 10], ['Scoundrel', 0]]);
    players.find(p => p.name === 'Saint').partnerAtHome = { name: 'X', slug: 'x', stage: 'married' };
    players.find(p => p.name === 'Scoundrel').partnerAtHome = { name: 'Y', slug: 'y', stage: 'dating' };
    expect(_homeFactor('Saint')).toBeGreaterThan(0);
    expect(_homeFactor('Scoundrel')).toBeLessThanOrEqual(1);
    // Nobody unattached is affected at all.
    houseOf([['Free', 5]]);
    expect(_homeFactor('Free')).toBe(1);
  });
});

describe('what the log says about it afterwards', () => {
  const season = { seasonId: 'bb-2', format: 'big-brother', number: 2 };
  const careers = [{ id: 'ida', name: 'Ida' }, { id: 'bo', name: 'Bo' }, { id: 'cy', name: 'Cy' }];
  const people = {
    ida: { gender: 'f', sexuality: 'straight' },
    bo: { gender: 'm', sexuality: 'straight' },
    cy: { gender: 'm', sexuality: 'straight' },
  };
  const seasonRank = () => new Map([['bb-1', 1], ['bb-2', 2]]);
  const dating = [{ id: 'e1', player: 'ida', whom: 'bo', kind: 'dating', status: 'approved', seasonId: 'bb-1', seq: 1 }];
  const runs = (pairs, n = 40) => Array.from({ length: n }, (_, i) =>
    resolveOffSeason({ season, careers, events: dating, cast: ['ida', 'cy'], pairs, people,
      seedSalt: 's' + i, seasonRank: seasonRank() }));

  it('has a word for it at all', () => {
    expect(KINDS.find(k => k.key === 'cheated'), 'the log cannot say this happened').toBeTruthy();
  });

  it('says so when they walked in attached and started something else', () => {
    const out = runs([['ida', 'cy']]).flat();
    const cheated = out.filter(e => e.kind === 'cheated');
    expect(cheated.length, 'nobody was ever recorded as unfaithful').toBeGreaterThan(30);
    // Named against the person at home, not against the showmance.
    for (const e of cheated) expect(e.whom).toBe('bo');
  });

  it('does not accuse somebody whose showmance IS their partner', () => {
    // Two people who went in together are not cheating on each other.
    const together = Array.from({ length: 30 }, (_, i) =>
      resolveOffSeason({ season, careers,
        events: [{ id: 'e1', player: 'ida', whom: 'cy', kind: 'dating', status: 'approved', seasonId: 'bb-1', seq: 1 }],
        cast: ['ida', 'cy'], pairs: [['ida', 'cy']], people, seedSalt: 't' + i,
        seasonRank: seasonRank() })).flat();
    expect(together.filter(e => e.kind === 'cheated')).toHaveLength(0);
  });

  it('never lets an affair resolve as a shrug', () => {
    // The row above says what happened; the break-up must not contradict it by
    // calling itself "quietly stopped seeing each other".
    const out = runs([['ida', 'cy']]).flat();
    expect(out.filter(e => e.kind === 'quietly-ended')).toHaveLength(0);
    expect(out.filter(e => e.kind === 'broke-up').length).toBeGreaterThan(10);
  });

  it('lets some of them survive it', () => {
    // People forgive this, and a relationship that survived it is a better
    // story than one that was never tested.
    const out = runs([['ida', 'cy']]);
    const ended = out.filter(r => r.some(e => e.kind === 'broke-up')).length;
    expect(ended).toBeGreaterThan(0);
    expect(ended, 'every single affair ended the relationship').toBeLessThan(out.length);
  });
});

describe('reaching a wedding at all', () => {
  it('does not make anybody climb six rungs to get there', () => {
    // The ladder was single -> dating -> public -> moved-in -> engaged ->
    // married, one rung per off-season, so a wedding took about twenty-three
    // of them. The franchise had produced none, which was the expected result
    // rather than bad luck.
    expect(RATES.advance['living-together']).toBeGreaterThan(0.15);
    expect(RATES.advance.engaged).toBeGreaterThan(0.4);
    // Divorce is deliberately untouched: marriages mostly last.
    expect(RATES.end.married).toBeLessThanOrEqual(0.02);
  });

  it('actually produces weddings for a couple who left a season together', () => {
    // The measurement, rather than the intention. A couple with momentum,
    // played out over a dozen off-seasons.
    const NEXT = { dating: 'public', public: 'living-together', 'living-together': 'engaged', engaged: 'married' };
    const SKIP = { dating: 'living-together', public: 'engaged', 'living-together': 'engaged' };
    let married = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      let stage = 'dating';
      for (let gap = 0; gap < 12; gap++) {
        const strain = gap < 1 ? RATES.test.castAlone : RATES.test.neitherCast;
        if (Math.random() < (RATES.end[stage] || 0) * strain) break;
        if (Math.random() < (RATES.advance[stage] || 0)) {
          stage = (SKIP[stage] && Math.random() < 0.22) ? SKIP[stage] : NEXT[stage];
          if (stage === 'married') { married++; break; }
        }
      }
    }
    const pct = (married / N) * 100;
    // Uncommon, and no longer vanishing. Before this change the same model
    // gave under 5%.
    // Uncommon, and no longer vanishing: the same model gave 4.8% before.
    // The upper bound is life-resolver.test.js's own ceiling for the calmest
    // possible run — "it reads like a soap" — and this is the harder case.
    expect(pct, `only ${pct.toFixed(1)}% of couples ever married`).toBeGreaterThan(6);
    expect(pct, `${pct.toFixed(1)}% is not a reality show, it is a dating app`).toBeLessThan(20);
  });
});

describe('a break-up the audience watched', () => {
  // Asked directly: when a romance breaks up in the game, do they break up in
  // the life events too?
  //
  // Half of it was already right. `pairsFor` in life-hook.js excludes a
  // showmance that ended broken, so a couple who split on screen are never
  // PROPOSED as a new couple afterwards — "they did not walk out of the finale
  // together" — and the social graph keeps a negative charge between them so a
  // public falling-out stays reachable.
  //
  // The other half was not. A couple who were ALREADY together walking in, and
  // broke up in front of the audience, fell through both paths: excluded from
  // `pairs`, so nothing marked the season as having ended anything, and then
  // rolled at the ordinary odds — which mostly kept them together. The log
  // could say a couple was fine after the episodes showed them ending.
  const season = { seasonId: 'bb-4', format: 'big-brother', number: 4 };
  const careers = [{ id: 'ida', name: 'Ida' }, { id: 'bo', name: 'Bo' }];
  const people = { ida: { gender: 'f', sexuality: 'straight' }, bo: { gender: 'm', sexuality: 'straight' } };
  const seasonRank = () => new Map([['bb-3', 1], ['bb-4', 2]]);
  const together = [{ id: 'e1', player: 'ida', whom: 'bo', kind: 'dating',
    status: 'approved', seasonId: 'bb-3', seq: 1 }];

  const run = (extra, n = 25) => Array.from({ length: n }, (_, i) =>
    resolveOffSeason({ season, careers, events: together, cast: ['ida', 'bo'],
      people, seedSalt: 'b' + i, seasonRank: seasonRank(), ...extra })).flat();

  it('ends the relationship in the log every time', () => {
    const out = run({ brokenPairs: [['ida', 'bo']] });
    const ended = out.filter(e => ['broke-up', 'separated', 'quietly-ended'].includes(e.kind));
    expect(ended.length, 'the season ended it on screen and the log kept them together')
      .toBe(25);
  });

  it('does not call it a quiet fade', () => {
    // It happened in front of a camera crew. "Quietly stopped seeing each
    // other" contradicts the episodes.
    const out = run({ brokenPairs: [['ida', 'bo']] });
    expect(out.filter(e => e.kind === 'quietly-ended')).toHaveLength(0);
    expect(out.filter(e => e.kind === 'broke-up').length).toBeGreaterThan(0);
  });

  it('leaves a couple who did NOT break up on screen alone', () => {
    // The control: same couple, same season, nothing broken. Most of them
    // survive, which is the whole point of only forcing the ones that ended.
    const out = run({ pairs: [['ida', 'bo']] });
    const ended = out.filter(e => ['broke-up', 'separated', 'quietly-ended'].includes(e.kind));
    expect(ended.length).toBeLessThan(25);
  });
});
