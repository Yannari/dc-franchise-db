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

// ══════════════════════════════════════════════════════════════════════
// The ceremony, which is where the twist is either real or decorative
// ══════════════════════════════════════════════════════════════════════
//
// Both of these are regressions from a played season. `duoNominees` was handed
// a target and returned their partner with no idea who was protected, so the
// moment either half was untouchable the pair collapsed to ONE name and the
// week topped the block up with a stranger — producing a ceremony that read out
// a Head of Household nominating their own duo, and "paired" nominations that
// were one person plus somebody unrelated.
import { duoBlock, duoSafeWith } from '../js/bb/duos.js';

describe('nominating a duo', () => {
  it('never puts up the pair the Head of Household is in', () => {
    installDuos(NAMES, { rng: Math.random });
    const hoh = 'A';
    const partner = partnerOf(hoh, NAMES);
    // Even when the plan wants them: the HOH cannot go up, so their duo cannot.
    const block = duoBlock({ plan: { target: partner, nominees: [partner] },
      house: NAMES, protectedNames: [hoh], hoh });
    expect(block, 'the Head of Household nominated their own duo').not.toContain(hoh);
    expect(block, 'the crown did not protect the partner').not.toContain(partner);
  });

  it('says who the crown protects besides the person wearing it', () => {
    installDuos(NAMES, { rng: Math.random });
    expect(duoSafeWith('A', NAMES)).toEqual([partnerOf('A', NAMES)]);
  });

  it('always returns a WHOLE pair, never half of one', () => {
    // The exact failure: half a duo on the block beside a stranger.
    installDuos(NAMES, { rng: Math.random });
    for (const hoh of NAMES) {
      const block = duoBlock({ plan: {}, house: NAMES, protectedNames: [hoh], hoh });
      if (!block) continue;
      expect(block).toHaveLength(2);
      expect(partnerOf(block[0], NAMES), `${block[0]} went up without their partner`).toBe(block[1]);
    }
  });

  it('picks a different duo rather than half-nominating a protected one', () => {
    installDuos(NAMES, { rng: Math.random });
    const hoh = 'A';
    const [c, d] = duoState().pairs.find(p => !p.includes(hoh) && !p.includes(partnerOf(hoh, NAMES)));
    // d is safe this week — so the whole c/d duo is off the table, and the
    // block has to be some OTHER pair rather than c on their own.
    const block = duoBlock({ plan: { target: c, nominees: [c] }, house: NAMES,
      protectedNames: [hoh, d], hoh });
    expect(block).toHaveLength(2);
    expect(block, 'nominated half of a protected duo').not.toContain(c);
    expect(block).not.toContain(d);
  });

  it('gives up cleanly when no whole duo can go up', () => {
    // Everybody left is an orphan, so the ceremony has to fall back to an
    // ordinary two-name block instead of inventing a pair.
    installDuos(NAMES, { goldenKey: false, rng: Math.random });
    const survivors = duoState().pairs.map(p => p[0]);   // one of each duo
    expect(duoBlock({ plan: {}, house: survivors, protectedNames: [], hoh: survivors[0] })).toBe(null);
  });
});

describe('a played season nominates in pairs', () => {
  it('puts two people who came in together on that block, every week', () => {
    // The report that started this: "the nominations are not done as a duo,
    // they just nominate 1 person."
    let checked = 0;
    let paired = 0;
    for (const seed of [5, 17, 41]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 10 });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      for (const w of gs.bb.weeks || []) {
        // The CEREMONY, not the final block: the veto saves one name and the
        // Head of Household replaces one name, exactly as BB13 played it, so a
        // post-veto block is legitimately half a duo beside a replacement.
        const cer = (w.acts || []).find(a => a.type === 'nominations');
        const noms = cer?.nominees || [];
        // Two OR four: a Duos season seats two pairs while it can field them
        // and falls back to one as the pairs get eaten into.
        if (!noms.length || !w.hoh) continue;
        checked++;
        expect(noms, 'the Head of Household nominated themselves').not.toContain(w.hoh);
        if (w.duoNomination) {
          paired++;
          expect(noms.slice().sort()).toEqual(w.duoNomination.slice().sort());
          // Every name on that wall went up beside the person they came in
          // with — whether the block is one pair or two.
          const blocks = w.duoBlocks || [w.duoNomination];
          expect(blocks.flat().slice().sort()).toEqual(w.duoNomination.slice().sort());
          for (const [x, y] of blocks) {
            expect((gs.bb.duos?.pairs || []).some(p => p.includes(x) && p.includes(y)),
              `${x} and ${y} went up as a duo and are not one`).toBe(true);
          }
        }
      }
    }
    expect(checked, 'no ordinary nomination week was ever played').toBeGreaterThan(3);
    // AND IT HAS TO ACTUALLY HAPPEN. Every assertion above is inside an
    // `if (w.duoNomination)`, so a season that never once nominated a pair —
    // which is precisely the bug being fixed — would sail through all of them.
    expect(paired, 'not one nomination was ever made as a duo').toBeGreaterThan(3);
    expect(paired / checked, 'paired nominations were the exception, not the rule')
      .toBeGreaterThan(0.5);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The veto, which was quietly cancelling the twist once a week
// ══════════════════════════════════════════════════════════════════════
//
// The BB13 wiki: the veto competition allowed "both members of a nominated duo
// to potentially save themselves from eviction, FORCING THE HOH TO NOMINATE A
// REPLACEMENT DUO." What shipped saved one nominee and seated a single
// stranger, so the block stopped being a pair halfway through every week
// somebody won the veto — the twist's one rule, cancelled by its own ceremony.
import { duoReplacementBlock } from '../js/bb/duos.js';

describe('the veto in a Duos season', () => {
  it('takes both of them down and puts a whole duo up', () => {
    installDuos(NAMES, { rng: Math.random });
    const hoh = 'A';
    const block = duoBlock({ plan: {}, house: NAMES, protectedNames: [hoh], hoh });

    const swap = duoReplacementBlock({ nominees: block, saved: block[0], house: NAMES,
      protectedNames: [hoh], hoh });

    expect(swap, 'the veto left half a duo on the block').toBeTruthy();
    expect(swap.down.sort()).toEqual([...block].sort());
    expect(swap.nominees, 'the replacement block is not a pair').toHaveLength(2);
    // Both saved, not one.
    for (const name of block) expect(swap.nominees).not.toContain(name);
    // And what went up is a real duo.
    expect(partnerOf(swap.up[0], NAMES)).toBe(swap.up[1]);
  });

  it('never seats the Head of Household or their partner as the replacement', () => {
    installDuos(NAMES, { rng: Math.random });
    const hoh = 'A';
    const partner = partnerOf(hoh, NAMES);
    const block = duoBlock({ plan: {}, house: NAMES, protectedNames: [hoh], hoh });
    const swap = duoReplacementBlock({ nominees: block, saved: block[1], house: NAMES,
      protectedNames: [hoh], hoh });
    expect(swap.nominees).not.toContain(hoh);
    expect(swap.nominees).not.toContain(partner);
  });

  it('leaves a mixed block alone rather than making it stranger', () => {
    // Once the pairs have been eaten into, the block is already outside the
    // rule. Dropping a duo into it would not restore the rule, it would just
    // seat three people.
    installDuos(NAMES, { rng: Math.random });
    const [a] = duoState().pairs[0];
    const [c] = duoState().pairs[1];
    expect(duoReplacementBlock({ nominees: [a, c], saved: a, house: NAMES, hoh: 'E' })).toBe(null);
  });

  it('stands down when there is no other duo to seat', () => {
    installDuos(NAMES, { rng: Math.random });
    const hoh = 'A';
    const block = duoBlock({ plan: {}, house: NAMES, protectedNames: [hoh], hoh });
    const everyoneElse = NAMES.filter(n => !block.includes(n));
    expect(duoReplacementBlock({ nominees: block, saved: block[0], house: NAMES,
      protectedNames: everyoneElse, hoh })).toBe(null);
  });
});

describe('a played season keeps the block a pair all week', () => {
  it('replaces a vetoed duo with another duo, not with a stranger', () => {
    let swaps = 0;
    for (const seed of [5, 17, 41]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 10 });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      for (const w of gs.bb.weeks || []) {
        if (!w.duoVetoSwap) continue;
        swaps++;
        const final = w.finalNominees || [];
        // Two duos or one, the block is still whole pairs after the ceremony.
        expect(final.length % 2, 'the block came out of the veto an odd size').toBe(0);
        for (const n of w.duoVetoSwap.down) {
          expect(final, `${n} was saved and is still on the block`).not.toContain(n);
        }
        for (const n of w.duoVetoSwap.up) {
          expect(final, `${n} was named as a replacement and is not on the block`).toContain(n);
        }
      }
    }
    expect(swaps, 'no veto ever swapped a duo across three seasons').toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// A Golden Key is safety from EVICTION, not from one ceremony
// ══════════════════════════════════════════════════════════════════════
//
// The wiki: a key "guaranteed this houseguest a spot in the top ten and
// immunity from all challenges and eviction." Reported from a real season: a
// houseguest was handed a key when their partner was evicted and went out the
// following week. The nomination ceremony honoured the key because it reads
// `untouchable` — the VETO REPLACEMENT builds its own protected list and did
// not carry it, so the key holder was seated in the empty chair and voted out.
//
// This walks whole seasons and checks the property across every path onto the
// block, rather than testing the one function that was already correct.
describe('a Golden Key holds all the way to the door', () => {
  it('is never nominated, replaced onto the block, or evicted while holding', () => {
    let keyWeeks = 0;
    for (const seed of [5, 17, 41, 63]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 6 });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });

      // Replay the season's own record: who held a key when each week ran.
      const grants = new Map();   // name -> week they got it
      for (const w of gs.bb.weeks || []) {
        if (w.goldenKey?.holder) grants.set(w.goldenKey.holder, w.num);
      }
      const expiredAt = (gs.bb.weeks || []).find(w => w.keysExpired)?.num ?? Infinity;

      for (const w of gs.bb.weeks || []) {
        const holding = [...grants.entries()]
          .filter(([, got]) => got < w.num && w.num <= expiredAt)
          .map(([name]) => name);
        if (!holding.length) continue;
        keyWeeks++;

        const cer = (w.acts || []).find(a => a.type === 'nominations')?.nominees || [];
        for (const name of holding) {
          expect(cer, `${name} was nominated in week ${w.num} holding a key`).not.toContain(name);
          expect(w.finalNominees || [], `${name} was put on the block by the veto ceremony in week ${w.num}`)
            .not.toContain(name);
          expect(w.evicted, `${name} was evicted in week ${w.num} holding a key`).not.toBe(name);
          expect(w.secondEvicted, `${name} was the second eviction in week ${w.num} holding a key`)
            .not.toBe(name);
        }
      }
    }
    expect(keyWeeks, 'no week was ever played with a key in the house').toBeGreaterThan(3);
  });

  it('and does not compete for anything while it holds', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    gs.activePlayers = NAMES.filter(n => n !== b);
    grantGoldenKey({ week: aWeek({ num: 2 }), evicted: b, house: gs.activePlayers });
    expect(duosSittingOut()).toContain(a);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Two duos, and a vote that chooses between relationships
// ══════════════════════════════════════════════════════════════════════
//
// BB13 seated ONE duo, which makes the pairing matter for exactly one decision
// — the Head of Household's. By eviction night both halves are up, one of them
// is leaving, and the vote is an ordinary vote between two people who happen to
// know each other. The pairing has nothing left to do.
//
// Two duos on that wall turns the vote into a choice between two
// RELATIONSHIPS: the room decides whose side loses somebody, then which half.
import { duoDoubleBlock, duoVoteResult, twoDuoBlock } from '../js/bb/duos.js';

describe('two duos on the block', () => {
  it('seats four, in two whole pairs', () => {
    installDuos(NAMES, { rng: Math.random });
    const dbl = duoDoubleBlock({ plan: {}, house: NAMES, protectedNames: ['A'], hoh: 'A' });
    expect(dbl.nominees).toHaveLength(4);
    expect(new Set(dbl.nominees).size, 'somebody was seated twice').toBe(4);
    for (const [x, y] of dbl.pairs) expect(partnerOf(x, NAMES)).toBe(y);
    expect(dbl.nominees).not.toContain('A');
    expect(dbl.nominees, 'the crown did not cover the partner').not.toContain(partnerOf('A', NAMES));
  });

  it('falls back to one duo when a second clean pair does not exist', () => {
    installDuos(NAMES, { rng: Math.random });
    const [a, b] = duoState().pairs[0];
    const small = [...duoState().pairs[1], a, b, 'E'];
    // Only two duos alive, and the Head of Household is in one of them.
    expect(duoDoubleBlock({ plan: {}, house: small, protectedNames: [a], hoh: a })).toBe(null);
  });
});

describe('the vote, totalled by duo', () => {
  const blocks = [['C', 'D'], ['G', 'H']];

  it('sends home the loudest half of the duo the room wrote down most', () => {
    installDuos(NAMES, { rng: Math.random });
    duoState().nominatedPairs = blocks;
    const res = duoVoteResult({ nominees: ['C', 'D', 'G', 'H'],
      votes: { C: 1, D: 4, G: 2, H: 2 }, pairs: blocks });
    expect(res.losing.sort()).toEqual(['C', 'D']);   // 5 against 4
    expect(res.evicted).toBe('D');
    expect(res.survivor).toBe('C');
  });

  it('can evict on fewer votes than somebody in the other chairs', () => {
    // THE WHOLE REASON TO SEAT TWO. G has three votes and stays; C has two and
    // goes, because C's partner dragged their side of the wall down.
    installDuos(NAMES, { rng: Math.random });
    const res = duoVoteResult({ nominees: ['C', 'D', 'G', 'H'],
      votes: { C: 2, D: 3, G: 4, H: 0 }, pairs: blocks });
    expect(res.losing.sort()).toEqual(['C', 'D']);   // 5 against 4
    // D goes home on THREE. G had four and is still in the house.
    expect(res.evicted).toBe('D');
    expect(res.evicted, 'the loudest name in the room went home').not.toBe('G');
  });

  it('hands a split inside the losing duo back to be broken', () => {
    installDuos(NAMES, { rng: Math.random });
    const res = duoVoteResult({ nominees: ['C', 'D', 'G', 'H'],
      votes: { C: 3, D: 3, G: 1, H: 0 }, pairs: blocks });
    expect(res.losing.sort()).toEqual(['C', 'D']);
    expect(res.tied).toBe(true);
    expect(res.evicted).toBe(null);
  });

  it('breaks a dead heat between the two sides with the loudest single vote', () => {
    installDuos(NAMES, { rng: Math.random });
    const res = duoVoteResult({ nominees: ['C', 'D', 'G', 'H'],
      votes: { C: 1, D: 2, G: 3, H: 0 }, pairs: blocks });
    expect(res.perPair[0].total).toBe(res.perPair[1].total);
    expect(res.losing.sort(), 'the side carrying the loudest vote survived a tie').toEqual(['G', 'H']);
    expect(res.evicted).toBe('G');
  });
});

describe('a played season with two duos up', () => {
  it('seats four and lets the duo tally decide the night', () => {
    let fours = 0;
    let duoDecided = 0;
    for (const seed of [5, 17, 41]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 10, bbDuosBlock: 'two' });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      // Asserted after the season, because the duos are not seated until the
      // first night and `twoDuoBlock` reads the installed state, not the config.
      expect(twoDuoBlock(), 'the season is not running two-duo blocks').toBe(true);
      for (const w of gs.bb.weeks || []) {
        const noms = (w.acts || []).find(a => a.type === 'nominations')?.nominees || [];
        if (noms.length === 4) fours++;
        if (!w.duoVote) continue;
        duoDecided++;
        expect(w.duoVote.perPair).toHaveLength(2);
        expect(w.duoVote.losing).toContain(w.evicted);
        // The survivor of the losing duo is still in the house.
        expect(w.duoVote.survivor).not.toBe(w.evicted);
      }
    }
    expect(fours, 'no week ever seated four nominees').toBeGreaterThan(2);
    expect(duoDecided, 'the duo tally never decided an eviction').toBeGreaterThan(2);
  });

  it('still plays BB13 when the setting says one duo', () => {
    house();
    Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 10, bbDuosBlock: 'one' });
    expect(twoDuoBlock()).toBe(false);
    withSeededRandom(5, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
    });
    for (const w of gs.bb.weeks || []) {
      const noms = (w.acts || []).find(a => a.type === 'nominations')?.nominees || [];
      expect(noms.length, 'a one-duo season seated four').toBeLessThan(3);
      expect(w.duoVote, 'a one-duo season counted votes by duo').toBeFalsy();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// What a nomination costs the person who made it
// ══════════════════════════════════════════════════════════════════════
//
// It used to cost nothing. The only fallout was for a BROKEN PROMISE — put
// somebody up after shaking on their safety and it cost a deal, a bond and a
// target; put up somebody you had never promised anything and the relationship
// layer did not move at all. The most public act in the format was free.
//
// It is priced in TRUST now: a nomination is a betrayal only to the extent
// there was something to betray.
describe('the price of a nomination', () => {
  function playUntilNomFallout(seed, cfg = {}) {
    house();
    Object.assign(seasonConfig, { bbDuos: 'on', bbDuosKeyAt: 10, ...cfg });
    withSeededRandom(seed, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
    });
    return (gs.bb.weeks || []).flatMap(w => w.nomFallout || []);
  }

  it('charges for it at all', () => {
    const all = [1, 5, 17].flatMap(s => playUntilNomFallout(s));
    expect(all.length, 'no nomination ever cost anybody anything').toBeGreaterThan(5);
    for (const f of all) expect(f.hit).toBeLessThan(0);
  });

  it('costs more the more trust there was to break', () => {
    // THE RULE: putting up somebody you have never spoken to is nearly free.
    // Putting up the person who has voted with you for six weeks costs you
    // that person.
    const all = [1, 5, 17, 41].flatMap(s => playUntilNomFallout(s));
    const trusted = all.filter(f => f.treason >= 0.4);
    const strangers = all.filter(f => f.treason <= 0.05);
    if (!trusted.length || !strangers.length) return;   // seeds did not produce both
    const mean = list => list.reduce((s, f) => s + Math.abs(f.hit), 0) / list.length;
    expect(mean(trusted), 'betraying an ally cost no more than nominating a stranger')
      .toBeGreaterThan(mean(strangers) * 1.5);
  });

  it('never charges the pawn, whose conversation is priced elsewhere', () => {
    // Being asked to sit down is its own economy: agreeing earns bond, refusing
    // costs it, being seated after saying no costs more. A second charge on top
    // would price the same conversation twice.
    for (const seed of [1, 5, 17, 41]) {
      house();
      Object.assign(seasonConfig, { bbDuos: 'off' });
      withSeededRandom(seed, () => {
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
      });
      for (const w of gs.bb.weeks || []) {
        const pawn = w.pawnAsk?.pawn || w.plan?.pawn;
        if (!pawn) continue;
        expect((w.nomFallout || []).map(f => f.nominee),
          `${pawn} was charged for sitting in the pawn chair`).not.toContain(pawn);
      }
    }
  });

  it('makes the dragged half resent their partner, not just the crown', () => {
    // The consequence that only exists in this season: you are on that block
    // because of who you walked in with, and somebody wears it.
    const all = [1, 5, 17, 41].flatMap(s => playUntilNomFallout(s));
    const dragged = all.filter(f => f.kind === 'dragged');
    expect(dragged.length, 'nobody was ever dragged up by a partner').toBeGreaterThan(0);
    for (const f of dragged) {
      expect(f.strain, 'being dragged onto the block cost the pair nothing').toBeLessThan(0);
      expect(f.partner).toBeTruthy();
      // And the crown pays less for the half it did not choose than for the
      // half it did.
      expect(Math.abs(f.hit)).toBeLessThan(2.2);
    }
  });
});
