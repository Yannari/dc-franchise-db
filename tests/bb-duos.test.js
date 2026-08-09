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
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import {
  installDuos, duoState, duosActive, duoOf, partnerOf, duoNominees,
  grantGoldenKey, expireKeys, keyHolders, hasKey, duosSittingOut, announceDuos,
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

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.popularity = {};
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  gs.activePlayers = [...NAMES];
}

const aWeek = (o = {}) => ({ num: 1, houseAtStart: [...(gs.activePlayers || [])], acts: [], ...o });

beforeEach(house);

describe('pairing the house', () => {
  it('puts everybody in a duo', () => {
    const st = installDuos(NAMES, { rng: Math.random });
    expect(st.pairs).toHaveLength(6);
    expect(st.pairs.flat().sort()).toEqual([...NAMES].sort());
    expect(st.solo).toBeFalsy();
    expect(duosActive()).toBe(true);
  });

  it('leaves one person alone when the house is odd, and says so', () => {
    // They can never earn a key — there is no partner to lose. That is the
    // trade a solo player made on the show, and it should be visible rather
    // than quietly different.
    const odd = NAMES.slice(0, 11);
    const st = installDuos(odd, { rng: Math.random });
    expect(st.pairs).toHaveLength(5);
    expect(st.solo).toBeTruthy();
    expect(odd).toContain(st.solo);

    const open = announceDuos(aWeek());
    expect(open.type).toBe('duos-open');
    expect(open.beats.some(b => /on their own/.test(b.text))).toBe(true);
  });

  it('will not run in a house too small to pair', () => {
    expect(installDuos(['A', 'B', 'C'], {})).toBe(null);
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

  it('gives nothing to the solo player, who has no partner to lose', () => {
    const odd = NAMES.slice(0, 11);
    installDuos(odd, { rng: Math.random });
    const solo = duoState().solo;
    gs.activePlayers = odd.filter(n => n !== solo);
    expect(grantGoldenKey({ week: aWeek(), evicted: solo, house: gs.activePlayers })).toBe(null);
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
