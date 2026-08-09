// You Go, They Go.
//
// One week, four nominees, two evictions — and the thing worth testing is the
// second one. The house votes an ordinary vote, one name each, and somebody
// who was never named leaves with the person who was. A partner on ZERO votes
// still walks, and that is the whole twist rather than an edge case of it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond, addBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale, BB_TWIST_IDS } from '../js/bb-run.js';
import {
  openDuoWeek, duoWeekActive, duoWeekPairs, duoWeekPairOf, duoWeekPartner,
  duoWeekSafe, duoWeekNominees, duoWeekAfterVeto, duoWeekSecondEvictee,
  duoWeekEviction, duoWeekEvents, DUO_WEEK_MIN_HOUSE,
} from '../js/bb/duo-week.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));
const NAMES = CAST.map(c => c.name);

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.popularity = {};
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [] });
  gs.activePlayers = [...NAMES];
}

const aWeek = (o = {}) => ({ num: 2, houseAtStart: [...(gs.activePlayers || [])], acts: [], ...o });

beforeEach(house);

describe('pairing the house for the week', () => {
  it('pairs everybody except the Head of Household', () => {
    const week = aWeek();
    const act = openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    expect(act.type).toBe('duo-week-open');
    const paired = duoWeekPairs(week).flat();
    expect(paired, 'the HOH was put in a pair').not.toContain('A');
    expect(act.solo, 'eleven does not pair evenly, so somebody is the odd one out').toBeTruthy();
    // Everybody who is not the HOH is either in a pair or the solo. Nobody
    // falls out of the pairing entirely and quietly stops being nominatable.
    expect([...paired, act.solo].sort()).toEqual(NAMES.filter(n => n !== 'A').sort());
  });

  it('leaves the odd one out unnominatable, and says so', () => {
    // Being alone in this house is the worst thing there is for eleven weeks
    // and the safest thing there is for one of them.
    const week = aWeek();
    const act = openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    expect(duoWeekSafe(week)).toEqual([act.solo]);
    expect(act.beats.some(b => /cannot be put on that block/.test(b.text))).toBe(true);
  });

  it('pairs evenly when the house is odd, because the HOH comes out of it', () => {
    const odd = NAMES.slice(0, 11);
    const week = aWeek();
    const act = openDuoWeek(week, { house: odd, hoh: 'A', rng: Math.random });
    expect(act.solo).toBe(null);
    expect(duoWeekPairs(week)).toHaveLength(5);
  });

  it('will not run in a house too small to seat four nominees and a vote', () => {
    const week = aWeek();
    expect(openDuoWeek(week, { house: NAMES.slice(0, DUO_WEEK_MIN_HOUSE - 1), hoh: 'A' })).toBe(null);
    expect(duoWeekActive(week)).toBe(false);
  });

  it('knows who is chained to whom', () => {
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const [a, b] = duoWeekPairs(week)[0];
    expect(duoWeekPairOf(week, a)).toEqual(duoWeekPairOf(week, b));
    expect(duoWeekPartner(week, a, NAMES)).toBe(b);
    expect(duoWeekPartner(week, b, NAMES)).toBe(a);
  });
});

describe('two duos on the block', () => {
  it('names four, in two pairs', () => {
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const noms = duoWeekNominees(week, { plan: { target: 'G', nominees: ['G'] }, house: NAMES, untouchable: ['A'], hoh: 'A' });
    expect(noms).toHaveLength(4);
    expect(new Set(noms).size, 'somebody was nominated twice').toBe(4);
    expect(noms).toContain('G');
    // And each of the four is on the block WITH the person they are chained to.
    for (const n of noms) expect(noms).toContain(duoWeekPartner(week, n, NAMES));
  });

  it('drags the target’s partner up whether the plan wanted them or not', () => {
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const partner = duoWeekPartner(week, 'G', NAMES);
    const noms = duoWeekNominees(week, { plan: { target: 'G', nominees: ['G'] }, house: NAMES, untouchable: ['A'], hoh: 'A' });
    expect(noms, 'the partner was left off the block').toContain(partner);
  });

  it('never nominates the solo player', () => {
    const week = aWeek();
    const act = openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const noms = duoWeekNominees(week, { plan: { target: act.solo, nominees: [act.solo] }, house: NAMES, untouchable: ['A'], hoh: 'A' });
    expect(noms, 'the solo player has nobody to sit beside').not.toContain(act.solo);
  });
});

describe('the veto', () => {
  it('takes a whole pair down and puts a whole pair up', () => {
    // You cannot half-save a duo: a lone nominee this week would be playing a
    // different game from the three beside them.
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const noms = duoWeekNominees(week, { plan: { target: 'G', nominees: ['G'] }, house: NAMES, untouchable: ['A'], hoh: 'A' });
    const saved = noms[0];
    const partner = duoWeekPartner(week, saved, NAMES);

    const swap = duoWeekAfterVeto(week, { nominees: noms, saved, house: NAMES, protectedNames: ['A'] });
    expect(swap.down.sort()).toEqual([saved, partner].sort());
    expect(swap.nominees, 'still four on that block').toHaveLength(4);
    expect(swap.nominees).not.toContain(saved);
    expect(swap.nominees, 'the partner stayed up alone').not.toContain(partner);
    // And the replacement is itself a pair.
    expect(swap.up).toHaveLength(2);
    expect(duoWeekPartner(week, swap.up[0], NAMES)).toBe(swap.up[1]);
  });

  it('returns null rather than half-emptying the block when no pair is left', () => {
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const noms = duoWeekNominees(week, { plan: { target: 'G', nominees: ['G'] }, house: NAMES, untouchable: ['A'], hoh: 'A' });
    const everybodyElse = NAMES.filter(n => !noms.includes(n));
    expect(duoWeekAfterVeto(week, { nominees: noms, saved: noms[0], house: NAMES,
      protectedNames: everybodyElse })).toBe(null);
  });
});

describe('the second name', () => {
  it('takes the partner of whoever lost the vote', () => {
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const partner = duoWeekPartner(week, 'G', NAMES);
    expect(duoWeekSecondEvictee(week, 'G', NAMES)).toBe(partner);
  });

  it('takes them on zero votes, and says out loud that it did', () => {
    // THE WHOLE TWIST. Not one houseguest wrote this name down and the name
    // leaves anyway — so the screen has to state it rather than let a reader
    // assume the vote was close.
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const partner = duoWeekPartner(week, 'G', NAMES);
    const act = duoWeekEviction(week, { evicted: 'G', taken: partner, votes: { G: 6, [partner]: 0 } });

    expect(act.type).toBe('duo-week-eviction');
    expect(act.gotNothing).toBe(true);
    expect(act.beats.some(b => /Not one houseguest/.test(b.text))).toBe(true);
  });

  it('makes the audience love whoever it happened to', () => {
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const partner = duoWeekPartner(week, 'G', NAMES);
    const before = gs.popularity[partner] || 0;
    duoWeekEviction(week, { evicted: 'G', taken: partner, votes: { G: 6, [partner]: 0 } });
    expect(gs.popularity[partner]).toBeGreaterThan(before);
  });

  it('does nothing at all when the week is not a duo week', () => {
    expect(duoWeekSecondEvictee(aWeek(), 'G', NAMES)).toBe(null);
  });
});

describe('strategy for two', () => {
  it('always produces something, and all of it moves the game', () => {
    // A duo week that generated only nominations would be a rule rather than a
    // story. Every event here has to change a bond or a popularity number.
    const week = aWeek();
    openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
    const noms = duoWeekNominees(week, { plan: { target: 'G', nominees: ['G'] }, house: NAMES, untouchable: ['A'], hoh: 'A' });

    const before = duoWeekPairs(week).map(([a, b]) => getBond(a, b));
    const act = duoWeekEvents(week, { house: NAMES, nominees: noms, rng: Math.random });

    expect(act, 'a duo week produced no events at all').toBeTruthy();
    expect(act.events.length).toBeGreaterThan(0);
    for (const e of act.events) {
      expect(e.text.length).toBeGreaterThan(40);
      expect(e.players.length).toBeGreaterThan(0);
      expect(e.badgeText, 'an event with no badge').toBeTruthy();
    }
    const after = duoWeekPairs(week).map(([a, b]) => getBond(a, b));
    expect(after.some((v, i) => v !== before[i]), 'not one bond moved').toBe(true);
  });

  it('never lets a nice archetype sell out the person they are chained to', () => {
    // The archetype rules, applied literally: a hero on that block campaigns
    // for both of them. Only villains and cold neutrals try the other thing.
    for (const seed of [1, 4, 9, 23, 57]) {
      house();
      const week = aWeek();
      openDuoWeek(week, { house: NAMES, hoh: 'A', rng: Math.random });
      const noms = duoWeekNominees(week, { plan: { target: 'E', nominees: ['E'] }, house: NAMES, untouchable: ['A'], hoh: 'A' });
      const act = withSeededRandom(seed, () => duoWeekEvents(week, { house: NAMES, nominees: noms, rng: Math.random }));
      for (const e of (act?.events || [])) {
        if (e.kind !== 'sell-out') continue;
        const seller = e.players[0];
        expect(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'],
          `${seller} sold out their partner`).not.toContain(
          players.find(p => p.name === seller)?.archetype);
      }
    }
  });
});

describe('a season with the week scheduled', () => {
  it('is a twist the format will actually let through', () => {
    // An allowlist drops anything it has not heard of, silently, before the
    // week engine ever sees it — which is how twists ship doing nothing.
    expect(BB_TWIST_IDS.has('bb-duo-week')).toBe(true);
  });

  it('plays, seats four, and sends two out of the door on one vote', () => {
    let weeksSeen = 0;
    let fourUp = 0;
    let doubles = 0;
    let zeroVoteExits = 0;

    for (const seed of [3, 11, 29]) {
      house();
      seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-duo-week' }];
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      for (const w of gs.bb.weeks || []) {
        if (!w.duoWeek) continue;
        weeksSeen++;
        if ((w.finalNominees || []).length === 4) fourUp++;
        if (w.duoWeekTaken) {
          doubles++;
          expect(w.secondEvicted, 'the partner was not actually removed').toBe(w.duoWeekTaken.taken);
          expect(gs.eliminated).toContain(w.duoWeekTaken.taken);
          if ((w.votes || {})[w.duoWeekTaken.taken] === 0) zeroVoteExits++;
        }
      }
    }
    expect(weeksSeen, 'the twist never ran').toBeGreaterThan(0);
    expect(fourUp, 'no week ever seated four nominees').toBeGreaterThan(0);
    expect(doubles, 'nobody was ever taken out by their partner').toBeGreaterThan(0);
    expect(zeroVoteExits, 'nobody ever left on zero votes').toBeGreaterThan(0);
  });
});
