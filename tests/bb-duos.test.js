// Dynamic Duos, and the Golden Key.
//
// Big Brother 13, and the wiki states both halves: houseguests are "paired up
// in duos and nominated as duos", and "when one member of the duo was evicted,
// the other member received a 'Golden Key' and was safe from nomination and
// eviction until the final 10. Holders of a Golden Key did not compete in
// competitions, though they did get to cast votes to evict and have a spot to
// win the whole game."
//
// The two things worth testing are the two shapes this engine has never had: a
// nomination that names a PAIR, and a houseguest who is safe but inactive —
// holding a ballot, carrying no risk, and with no way to gain power.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, setRelationships } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { addBond, getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import {
  installDuos, duoState, duosActive, duoOf, partnerOf, duoNominees,
  grantGoldenKey, expireKeys, keyHolders, hasKey, duosSittingOut, announceDuos,
  duoKinLabel, declaredDuos,
} from '../js/bb/duos.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));
const NAMES = CAST.map(c => c.name);

// A DUOS CAST IS BUILT IN PAIRS. The twist reads the kinship axis and nothing
// else, so a season declares who came in with whom before it can run at all —
// and the kinds are mixed here because the announcement says them out loud.
const DUO_RELS = [
  { a: 'A', b: 'B', kin: 'siblings' },
  { a: 'C', b: 'D', kin: 'exes' },
  { a: 'E', b: 'F', kin: 'married' },
  { a: 'G', b: 'H', kin: 'old-friends' },
  { a: 'I', b: 'J', kin: 'colleagues' },
  { a: 'K', b: 'L', kin: 'cousins' },
].map((r, i) => ({ ...r, id: `duo-rel-${i}`, type: 'ally', bond: 3 }));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.popularity = {};
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  setRelationships(DUO_RELS.map(r => ({ ...r })));
  gs.activePlayers = [...NAMES];
}

const aWeek = (o = {}) => ({ num: 1, houseAtStart: [...(gs.activePlayers || [])], acts: [], ...o });

beforeEach(house);

describe('pairing the house', () => {
  it('puts everybody in a duo', () => {
    const st = installDuos(NAMES, { rng: Math.random });
    expect(st.pairs).toHaveLength(6);
    expect(st.pairs.flat().sort()).toEqual([...NAMES].sort());
    expect(st.singles).toEqual([]);
    expect(duosActive()).toBe(true);
  });

  it('leaves whoever came in alone alone, and says so', () => {
    // Not an odd-number technicality: a cast is built with as many duos as it
    // is built with, and the rest walked in on their own. They can never earn
    // a key, and they can be nominated by themselves.
    const odd = NAMES.slice(0, 11);          // L has no partner in the house
    const st = installDuos(odd, { rng: Math.random });
    expect(st.pairs).toHaveLength(5);
    expect(st.singles).toEqual(['K']);

    const open = announceDuos(aWeek());
    expect(open.type).toBe('duos-open');
    expect(open.singles).toEqual(['K']);
    expect(open.beats.some(b => /walked in alone/.test(b.text))).toBe(true);
  });

  it('will not run in a house too small to pair', () => {
    expect(installDuos(['A', 'B', 'C'], {})).toBe(null);
  });

  it('will not run at all on a cast nobody built for it', () => {
    // THE PREMISE. A duo is a declared relation, and inventing them out of the
    // bond table produced pairs that meant nothing and could not be announced.
    // A season with no relationships has to be told, not quietly given a
    // twist that never nominates a pair.
    setRelationships([]);
    expect(installDuos(NAMES, { rng: Math.random })).toBe(null);
    expect(duoState()).toBeFalsy();
  });

  it('will not run on one declared pair either', () => {
    // With one duo a single nomination ends the twist and every other week is
    // an ordinary week wearing its name.
    setRelationships([{ a: 'A', b: 'B', kin: 'siblings', id: 'r', type: 'ally', bond: 3 }]);
    expect(installDuos(NAMES, { rng: Math.random })).toBe(null);
  });

  it('pairs the people the cast said came in together, and remembers how', () => {
    const st = installDuos(NAMES, { rng: Math.random });
    const key = p => [...p].sort().join('|');
    expect(st.pairs.map(key).sort()).toEqual(DUO_RELS.map(r => key([r.a, r.b])).sort());
    expect(duoKinLabel('C', 'D')).toBe('Exes');
    expect(duoKinLabel('E', 'F')).toBe('Married');
  });

  it('knows who came in with whom', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    expect(duoOf(a)).toEqual(duoOf(b));
    expect(partnerOf(a)).toBe(b);
    expect(partnerOf(b)).toBe(a);
  });
});

describe('nominated as a pair', () => {
  it('names both halves of a duo, whichever one the HOH wanted', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    expect(duoNominees(a, NAMES)).toEqual([a, b]);
    expect(duoNominees(b, NAMES)).toEqual([b, a]);
  });

  it('falls back to an ordinary nomination once a pair is broken', () => {
    // The show did the same: the pair stops being the unit as they come apart.
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    const left = NAMES.filter(n => n !== b);
    expect(duoNominees(a, left), 'named a partner who is gone').toBe(null);
  });

  it('never names somebody holding a key', () => {
    installDuos(NAMES, { rng: Math.random });
    const [c, d] = duoState().pairs[1];
    gs.activePlayers = NAMES.filter(n => n !== d);
    grantGoldenKey({ week: aWeek({ num: 2 }), evicted: d, house: gs.activePlayers });
    expect(hasKey(c)).toBe(true);
    expect(duoNominees(c, gs.activePlayers), 'nominated a key holder').toBe(null);
  });
});

describe('the Golden Key', () => {
  it('goes to the survivor when a partner is evicted', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);

    const act = grantGoldenKey({ week: aWeek({ num: 2 }), evicted: b, house: gs.activePlayers });
    expect(act.type).toBe('duos-key');
    expect(act.holder).toBe(a);
    expect(act.partner).toBe(b);
    expect(hasKey(a)).toBe(true);
  });

  it('takes them out of competitions and leaves them their vote', () => {
    // THE SHAPE THAT IS NEW. Safe, unable to do anything about it, and still
    // holding a ballot — a bloc of these decides evictions from outside the
    // game entirely.
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    grantGoldenKey({ week: aWeek({ num: 2 }), evicted: b, house: gs.activePlayers });

    expect(duosSittingOut()).toContain(a);
    // Still a houseguest: in the roster, countable, votable, able to win.
    expect(gs.activePlayers).toContain(a);
  });

  it('is handed out once, not once per eviction', () => {
    installDuos(NAMES, { rng: Math.random });
    const [, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    expect(grantGoldenKey({ week: aWeek(), evicted: b, house: gs.activePlayers })).toBeTruthy();
    expect(grantGoldenKey({ week: aWeek(), evicted: b, house: gs.activePlayers })).toBe(null);
  });

  it('gives nothing to somebody who came in alone', () => {
    const odd = NAMES.slice(0, 11);
    installDuos(odd, { rng: Math.random });
    const [alone] = duoState().singles;
    gs.activePlayers = odd.filter(n => n !== alone);
    expect(grantGoldenKey({ week: aWeek(), evicted: alone, house: gs.activePlayers })).toBe(null);
  });
});

describe('the keys running out', () => {
  it('holds until the house reaches the size the twist named', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    grantGoldenKey({ week: aWeek(), evicted: b, house: gs.activePlayers });

    expect(expireKeys({ week: aWeek(), house: gs.activePlayers }), 'expired early').toBe(null);
    expect(hasKey(a)).toBe(true);
  });

  it('puts everybody back in the game at once', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    grantGoldenKey({ week: aWeek(), evicted: b, house: gs.activePlayers });

    const small = gs.activePlayers.slice(0, 10);
    const act = expireKeys({ week: aWeek({ num: 8 }), house: small });
    expect(act.type).toBe('duos-keys-expire');
    expect(act.holders).toContain(a);
    expect(hasKey(a), 'still safe after the keys expired').toBe(false);
    expect(duosSittingOut(), 'still sitting out after the keys expired').toEqual([]);
  });
});

describe('a season with duos running', () => {
  it('plays through, pairs the nominations and hands out keys', () => {
    let pairedNoms = 0;
    let keys = 0;
    for (const seed of [5, 17]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 10 });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      const weeks = gs.bb.weeks || [];
      pairedNoms += weeks.filter(w => w.duoNomination).length;
      keys += weeks.filter(w => w.goldenKey).length;
    }
    expect(pairedNoms, 'no week ever nominated a pair').toBeGreaterThan(0);
    expect(keys, 'nobody was ever handed a key').toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The other season: no keys, orphans, and being chained to one
// ══════════════════════════════════════════════════════════════════════

import {
  goldenKeysOn, orphans, repairOrphans, duosWeekLife, duoPartnerFor,
} from '../js/bb/duos.js';
import { bbThreatProfile } from '../js/bb/shared-strategy.js';
import { duoNominationPull } from '../js/bb/strategy.js';

const blankStats = () => Object.fromEntries(NAMES.map(n =>
  [n, { hohWins: 0, vetoWins: 0, timesNominated: 0, timesOnTheBlock: 0 }]));

describe('the Golden Key is optional', () => {
  it('is on by default, which is the shape the show ran', () => {
    installDuos(NAMES, { rng: Math.random });
    expect(goldenKeysOn()).toBe(true);
  });

  it('hands out nothing at all when it is switched off', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    expect(goldenKeysOn()).toBe(false);
    const [, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    expect(grantGoldenKey({ week: aWeek(), evicted: b, house: gs.activePlayers })).toBe(null);
    expect(keyHolders()).toEqual([]);
    expect(duosSittingOut(), 'somebody sat out a competition for a key that does not exist').toEqual([]);
  });

  it('says which season it is when it reads the rules out', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const open = announceDuos(aWeek({ num: 1 }));
    expect(open.goldenKey).toBe(false);
    expect(open.rules.join(' ')).toMatch(/no Golden Keys/i);
    expect(open.rules.join(' '), 'never told the house what happens instead').toMatch(/chain/i);
  });
});

describe('being orphaned', () => {
  it('is what losing your partner gets you with no key', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    expect(orphans(gs.activePlayers)).toEqual([a]);
  });

  it('makes you the cheapest nomination in the house', () => {
    // THE POINT OF THE MODE. An orphan goes up alone and costs the Head of
    // Household nobody, which is what makes everybody want a partner —
    // including the person who voted theirs out.
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    expect(duoNominees(a, gs.activePlayers), 'an orphan still dragged somebody up').toBe(null);
  });
});

describe('re-pairing the loose ends', () => {
  it('chains two orphans together', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const [a, b] = duoState().pairs[0];
    const [c, d] = duoState().pairs[1];
    gs.activePlayers = NAMES.filter(n => n !== b && n !== d);

    const act = repairOrphans({ week: aWeek({ num: 3 }), house: gs.activePlayers });
    expect(act.type).toBe('duos-repair');
    expect(act.pairs).toHaveLength(1);
    expect(act.pairs[0].sort()).toEqual([a, c].sort());
    // And the game reads the NEW pair, not the dead one.
    expect(partnerOf(a, gs.activePlayers)).toBe(c);
    expect(duoNominees(a, gs.activePlayers).sort()).toEqual([a, c].sort());
  });

  it('leaves an odd orphan waiting, and says what that costs them', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const gone = [duoState().pairs[0][1], duoState().pairs[1][1], duoState().pairs[2][1]];
    gs.activePlayers = NAMES.filter(n => !gone.includes(n));

    const act = repairOrphans({ week: aWeek({ num: 3 }), house: gs.activePlayers });
    expect(act.pairs).toHaveLength(1);
    expect(act.waiting, 'three orphans should leave one waiting').toBeTruthy();
    expect(act.beats.some(b => /alone/i.test(b.text))).toBe(true);
  });

  it('does nothing in a Golden Key season', () => {
    installDuos(NAMES, { rng: Math.random });
    const [, b] = duoState().pairs[0];
    const [, d] = duoState().pairs[1];
    gs.activePlayers = NAMES.filter(n => n !== b && n !== d);
    grantGoldenKey({ week: aWeek(), evicted: b, house: gs.activePlayers });
    grantGoldenKey({ week: aWeek(), evicted: d, house: gs.activePlayers });
    expect(repairOrphans({ week: aWeek(), house: gs.activePlayers })).toBe(null);
  });

  it('needs two — one loose end is not a pair', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const [, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    expect(repairOrphans({ week: aWeek(), house: gs.activePlayers })).toBe(null);
  });
});

describe('the season the twist actually produces', () => {
  it('says something about the pairs in the weeks between the ceremonies', () => {
    // A season twist nobody sees between the announcement and the eviction is
    // a twist that reads as doing nothing, which is how the Twin Twist shipped.
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const [a, b] = duoState().pairs[0];
    addBond(a, b, -9);                       // two people who are finished
    gs.bb.stats = blankStats();

    const act = duosWeekLife(aWeek({ num: 4 }), { house: NAMES, rng: Math.random });
    expect(act, 'a duos season produced no weekly life at all').toBeTruthy();
    expect(act.events.length).toBeGreaterThan(0);
    for (const e of act.events) {
      expect(e.text.length).toBeGreaterThan(40);
      expect(e.players.length).toBeGreaterThan(0);
      expect(e.badgeText).toBeTruthy();
    }
  });

  it('stays quiet on the night the pairs are read out', () => {
    installDuos(NAMES, { rng: Math.random });
    expect(duosWeekLife(aWeek({ num: 1 }), { house: NAMES })).toBe(null);
  });
});

describe('the house reads a duo as one player', () => {
  it('adds the partner visible record to somebody threat', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.bb.stats = blankStats();

    const alone = bbThreatProfile(a).duo;
    gs.bb.stats[b].hohWins = 3;
    gs.bb.stats[b].vetoWins = 2;
    const attached = bbThreatProfile(a).duo;

    expect(attached, 'a partner who won five comps changed nothing').toBeGreaterThan(alone);
    // And somebody with nobody beside them borrows nothing at all.
    gs.bb.duos = null;
    expect(bbThreatProfile(a).duo).toBe(0);
  });

  it('makes an HOH think twice about nominating their own ally partner', () => {
    // The gap this closes: the engine used to drag a partner onto the block
    // and never once ask the Head of Household whether they wanted that.
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs.find(p => !p.includes('A'));
    gs.bb.stats = blankStats();

    addBond('A', b, 9);                       // the HOH closest person
    const withAlly = duoNominationPull('A', a);
    addBond('A', b, -18);                     // now they cannot stand them
    const withEnemy = duoNominationPull('A', a);

    expect(withAlly, 'nominating an ally partner cost nothing').toBeLessThan(0);
    expect(withEnemy, 'two birds was worth no more than one').toBeGreaterThan(withAlly);
  });

  it('sees nobody attached to an orphan', () => {
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    expect(duoPartnerFor(a)).toBe(null);
  });
});

describe('a pairs-only season, played', () => {
  it('runs, orphans people and chains them back together', () => {
    let repairs = 0;
    let keys = 0;
    for (const seed of [5, 17, 41]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'pairs' });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      const weeks = gs.bb.weeks || [];
      repairs += weeks.filter(w => w.duosRepaired).length;
      keys += weeks.filter(w => w.goldenKey).length;
    }
    expect(keys, 'a key was handed out in a season that has none').toBe(0);
    expect(repairs, 'nobody was ever re-paired').toBeGreaterThan(0);
  });
});
