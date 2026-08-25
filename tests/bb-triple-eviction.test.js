// The triple eviction — three people out of the house in one night.
//
// Grounded on how the show actually staged it: BB22 ran TWO fast-forward
// cycles after an ordinary week, rather than one Head of Household nominating
// three people and the house voting to SAVE one. That second shape is Big
// Brother Canada's and this house does not play it, so the engine reaches the
// triple by running the compressed cycle one more time.
//
// Which makes the whole risk here reachability, not arithmetic. This repo's
// recurring bug is a mechanic that is written and then never rendered — the
// third cycle simulating fine while the transcript announces two and the
// viewing party draws two. So these assertions follow the night all the way
// out to the transcript and the screens.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { resolveWeekTwistState, BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 14 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));

/** Play week one plain, then week two as the triple, and hand back that night. */
function playTriple() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
  Object.assign(seasonConfig, {
    format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
    bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
    twistSchedule: [{ episode: 2, type: 'bb-triple-eviction' }],
  });
  gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
    threatScore, getBond, getPerceivedBond, ordinal });
  simulateBBEpisode();          // week 1, plain
  return simulateBBEpisode();   // week 2, the triple
}

describe('the contract', () => {
  it('states the cycle count in one place, and the double is the same rule', () => {
    // The engine reads `extraCycles` off the contract rather than checking the
    // twist id, so these two numbers ARE the feature. A twist missing from
    // this registry is silently dropped by resolveWeekTwistState.
    expect(BB_TWIST_CONTRACTS['bb-triple-eviction']).toBeTruthy();
    expect(resolveWeekTwistState(['bb-triple-eviction']).rules.extraCycles).toBe(2);
    expect(resolveWeekTwistState(['bb-double-eviction']).rules.extraCycles).toBe(1);
    expect(resolveWeekTwistState([]).rules.extraCycles).toBe(0);
  });

  it('tells the house what is about to happen to it', () => {
    const { announcements } = resolveWeekTwistState(['bb-triple-eviction']);
    const a = announcements.find(x => x.twist === 'bb-triple-eviction');
    expect(a, 'the house was never told').toBeTruthy();
    expect(a.rule.length).toBeGreaterThan(80);
  });
});

describe('the night itself', () => {
  it('removes three houseguests, all different', () => {
    const ep = playTriple();
    expect(ep.extraEvictions).toHaveLength(2);
    const out = [ep.eliminated, ...ep.extraEvictions.map(r => r.evicted)];
    expect(out.every(Boolean), 'a cycle evicted nobody').toBe(true);
    expect(new Set(out).size, 'the same person was evicted twice').toBe(3);
    for (const n of out) expect(gs.activePlayers).not.toContain(n);
    expect(gs.activePlayers).toHaveLength(14 - 1 - 3);
  });

  it('keeps the double eviction reading as a double', () => {
    // A dozen readers across three files already know `doubleEviction` and
    // `alsoEliminated`. The triple adds a list; it does not rename the field.
    const ep = playTriple();
    expect(ep.doubleEviction).toBe(ep.extraEvictions[0]);
    expect(ep.alsoEliminated).toBe(ep.extraEvictions[0].evicted);
    expect(ep.doubleEvictionStyle).toBe('triple');
  });

  it('gives every cycle its own Head of Household, block and vote', () => {
    const ep = playTriple();
    const cycles = [
      { hoh: ep.hoh, noms: ep.finalNominees, evicted: ep.eliminated },
      ...ep.extraEvictions.map(r => ({ hoh: r.hoh, noms: r.nominees, evicted: r.evicted })),
    ];
    for (const [i, c] of cycles.entries()) {
      expect(c.hoh, `cycle ${i + 1} crowned nobody`).toBeTruthy();
      expect(c.noms.length, `cycle ${i + 1} nominated nobody`).toBeGreaterThanOrEqual(2);
      expect(c.noms, `cycle ${i + 1} evicted somebody off the block`).toContain(c.evicted);
      // Nobody already gone comes back to run the next one.
      expect(c.hoh).not.toBe(cycles[i - 1]?.evicted);
    }
    // Three cycles of acts, each stamped with the segment it belongs to.
    expect(new Set((ep.acts || []).map(a => a.segment || 1))).toEqual(new Set([1, 2, 3]));
  });

  it('does not carry the first cycle war room into a later one', () => {
    // The seam the double already got wrong once: `ep.voteOperation` belongs to
    // the first half of the night, and rendering it over the third cycle shows
    // a house organizing against nominees who are already out the door.
    const ep = playTriple();
    for (const r of ep.extraEvictions) {
      expect(r.segment).toBeTruthy();
      // Each cycle's record carries its OWN plan, not a shared reference.
      expect(r.votePlans).not.toBe(ep.votePlans);
      expect(r.voteCommitments).not.toBe(ep.voteCommitments);
      expect(r.houseAtStart).toContain(r.evicted);
    }
    expect(ep.extraEvictions[0].houseAtStart.length)
      .toBeGreaterThan(ep.extraEvictions[1].houseAtStart.length);
  });

  it('sits all three evictees down', () => {
    const ep = playTriple();
    expect(ep.evictionInterview, 'first evictee never interviewed').toBeTruthy();
    expect(ep.secondEvictionInterview, 'second evictee never interviewed').toBeTruthy();
    expect(ep.thirdEvictionInterview, 'third evictee never interviewed').toBeTruthy();
  });

  it('stops early rather than emptying the house', () => {
    // A triple booked too late must run what it can and stop. The guard is
    // re-checked every cycle, because the house shrinks between them.
    seedGame(CAST.slice(0, 6), { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
      twistSchedule: [{ episode: 1, type: 'bb-triple-eviction' }],
    });
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    const ep = simulateBBEpisode();
    expect(gs.activePlayers.length).toBeGreaterThanOrEqual(3);
    expect((ep.extraEvictions || []).length).toBeLessThanOrEqual(2);
  });
});

describe('reaching the audience', () => {
  it('announces every cycle in the transcript, not just the second', () => {
    const ep = playTriple();
    // The real writer, called the way the app calls it. `ep.summaryText` is
    // written through `window.generateSummaryText`, which nothing hooks up
    // under vitest — so asserting on it tested a stub that says nothing.
    const text = generateSummaryText(ep) || '';
    expect(text.length, 'no transcript at all').toBeGreaterThan(500);
    expect(text).toContain('CYCLE 2 OF 3');
    expect(text, 'the third cycle arrived unannounced').toContain('CYCLE 3 OF 3');
    expect(text).toContain('THE THIRD EVICTEE INTERVIEW');
    // And every evictee is named in it.
    for (const n of [ep.eliminated, ...ep.extraEvictions.map(r => r.evicted)]) {
      expect(text, `${n} left the house and the transcript never said so`).toContain(n);
    }
  });

  it('lets each cycle run its own nomination ceremony', () => {
    // FOUND BY READING A REAL TRANSCRIPT, not by a failing assertion.
    //
    // The ceremony host was read as `ep.hoh || act.hoh`, so every cycle after
    // the first was hosted by the FIRST cycle's Head of Household — who by
    // then is often a nominee, which had the transcript printing them turning
    // a key on their own photograph. A double eviction had this the whole
    // time; the triple just said it twice.
    const ep = playTriple();
    const text = generateSummaryText(ep) || '';
    const hosts = [...text.matchAll(/^ {2}(.+?): "This is the nomination ceremony/gm)]
      .map(m => m[1]);
    const crowned = [ep.hoh, ...ep.extraEvictions.map(r => r.hoh)];
    expect(hosts, 'a cycle held no nomination ceremony').toHaveLength(3);
    expect(hosts).toEqual(crowned);
    // And nobody turns a key on their own photograph.
    const selfNom = /^ +([A-Z][\w' -]*) turns the \w+ key\. ([A-Z][\w' -]*)'s photograph/gm;
    let keys = 0;
    for (const m of text.matchAll(selfNom)) {
      keys++;
      expect(m[2], `${m[1]} turned a key on their own photograph`).not.toBe(m[1]);
    }
    expect(keys, 'no keys were turned at all \u2014 the pattern stopped matching')
      .toBeGreaterThanOrEqual(6);
  });

  it('draws a full set of screens for the third cycle too', async () => {
    const ep = playTriple();
    const { buildBBWeekScreens } = await import('../js/vp-screens.js');
    const screens = buildBBWeekScreens(ep);
    const ids = screens.map(s => s.id);
    // The break card per cycle...
    expect(ids).toContain('bb-double');
    expect(ids, 'the third cycle got no screens').toContain('bb-double-3');
    // ...and the cycle's own suffixed screens behind each of them.
    expect(ids.some(id => /-2$/.test(id)), 'second cycle drew nothing').toBe(true);
    expect(ids.some(id => /-3$/.test(id)), 'third cycle drew nothing').toBe(true);
    // Every screen holds real markup rather than an empty shell.
    for (const s of screens) expect(s.html.length, `${s.id} was blank`).toBeGreaterThan(50);
  });
});
