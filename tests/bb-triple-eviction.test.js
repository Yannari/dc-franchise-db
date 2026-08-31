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
import { buildVPScreens } from '../js/vp-screens.js';
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

describe('the shape of the night is the author’s to choose', () => {
  // The double has had a style dropdown since it was built; the triple was
  // hardcoded to two fast-forwards. Both are real formats.
  const playStyle = teStyle => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
      twistSchedule: [{ episode: 2, type: 'bb-triple-eviction', teStyle }],
    });
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
      threatScore, getBond, getPerceivedBond, ordinal });
    simulateBBEpisode();
    const ep = simulateBBEpisode();
    const out = [ep.eliminated, ...(ep.extraEvictions || [])
      .flatMap(r => [r.evicted, r.secondEvicted])].filter(Boolean);
    return { ep, out };
  };

  it('evicts three whichever shape is picked', () => {
    for (const style of ['fast-forward', 'double-vote', 'chain']) {
      const { out } = playStyle(style);
      expect(out, `${style} did not remove three`).toHaveLength(3);
      expect(new Set(out).size, `${style} evicted somebody twice`).toBe(3);
    }
  });

  it("runs Canada's shape as one live cycle that takes two", () => {
    const { ep, out } = playStyle('double-vote');
    // ONE extra cycle, and it removes two people rather than one.
    expect(ep.extraEvictions).toHaveLength(1);
    expect(ep.extraEvictions[0].doubleVote).toBe(true);
    expect(ep.extraEvictions[0].secondEvicted).toBeTruthy();
    expect(out).toHaveLength(3);
    // The banner counts PEOPLE, not cycles — counting cycles announced a
    // double over a night that evicted three.
    const text = generateSummaryText(ep) || '';
    expect(text).toContain('TRIPLE EVICTION');
    expect(text).not.toContain('DOUBLE EVICTION — THE SECOND CYCLE');
    // And all three are named in it, including the second walk-out of the
    // double-vote cycle, which had no field on the record to be written from.
    for (const n of out) expect(text).toContain(n);
  });

  it('can end the night on a chain', () => {
    const { ep } = playStyle('chain');
    const weeks = gs.bb.weeks;
    const last = weeks[weeks.length - 1];
    expect(last.chainOfSafety, 'the last cycle was not a chain').toBeTruthy();
    expect(ep.extraEvictions).toHaveLength(2);
  });

  it('sits three people down whichever shape ran', () => {
    for (const style of ['fast-forward', 'double-vote', 'chain']) {
      const { ep } = playStyle(style);
      expect(ep.evictionInterview, `${style}: no first interview`).toBeTruthy();
      expect(ep.secondEvictionInterview, `${style}: no second interview`).toBeTruthy();
      expect(ep.thirdEvictionInterview, `${style}: no third interview`).toBeTruthy();
    }
  });
});

describe('the night ends when the night ends', () => {
  // A compressed cycle has no house life of its own, so anything displaced
  // from its competitions waited for a stretch that never came and was flushed
  // at the END of the cycle — which put a House Life screen after the second
  // evictee's interview. The night finished on a stretch of house life that
  // had happened hours earlier.
  //
  // Found by driving the real page rather than by a test: the navigator makes
  // it obvious and an assertion about screen COUNTS never would.
  const tailOf = (twists, eps = 2) => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, finaleSize: 3, bbSafetyMode: 'off',
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
      twistSchedule: twists,
    });
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
      threatScore, getBond, getPerceivedBond, ordinal });
    let ep; for (let i = 0; i < eps; i++) ep = simulateBBEpisode();
    const stored = (gs.episodeHistory || []).find(h => h.num === ep.num) || ep;
    return { ep: stored, labels: (buildVPScreens(stored) || []).map(s => s.label) };
  };

  const SHAPES = [
    ['a double', [{ episode: 2, type: 'bb-double-eviction', deStyle: 'fast-forward' }]],
    ['a double run as a chain', [{ episode: 2, type: 'bb-double-eviction', deStyle: 'chain' }]],
    ['a triple', [{ episode: 2, type: 'bb-triple-eviction', teStyle: 'fast-forward' }]],
    ['a triple ending on a chain', [{ episode: 2, type: 'bb-triple-eviction', teStyle: 'chain' }]],
    ['a chain on its own', [{ episode: 2, type: 'bb-chain-of-safety', chainStart: 'hoh' }]],
    ['an ordinary week', []],
  ];

  it('never draws house life after the last evictee has been interviewed', () => {
    for (const [name, twists] of SHAPES) {
      const { labels } = tailOf(twists);
      const lastIv = Math.max(labels.lastIndexOf('Evictee Interview'),
        labels.lastIndexOf('Second Evictee'), labels.lastIndexOf('Third Evictee'));
      expect(lastIv, `${name}: nobody was interviewed at all`).toBeGreaterThan(-1);
      const after = labels.slice(lastIv + 1).filter(l => l === 'House Life');
      expect(after, `${name} ended on house life: ${labels.slice(-4).join(' | ')}`).toEqual([]);
    }
  });

  it('does not lose the beats it moved', () => {
    // Flushing them earlier is only right if they still appear.
    for (const [name, twists] of SHAPES) {
      const { ep, labels } = tailOf(twists);
      const fallout = (ep.acts || []).flatMap(a => (a.socialBeats || []))
        .filter(b => b.chainFallout);
      if (!fallout.length) continue;
      const html = (buildVPScreens(ep) || []).map(s => s.html || '').join(' ');
      for (const b of fallout) {
        expect(html, `${name} dropped "${b.text.slice(0, 40)}"`).toContain(b.text.slice(0, 40));
      }
      expect(labels.length).toBeGreaterThan(5);
    }
  });
});

describe('a later cycle does not claim nobody has power yet', () => {
  // `rpBuildBBHouseLife` reads `act.phase || 'pre-hoh'`, so a stretch built
  // without a phase prints "Before anybody has power". The compressed cycles
  // of a double and a triple have no house acts, so the beats displaced from
  // their competitions were flushed into exactly such a stretch — and it
  // appeared after the Head of Household, the veto, both ceremonies AND the
  // campaign, announcing that nobody had power yet on a night that had
  // already crowned two people.
  const subtitles = twists => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, finaleSize: 3, bbSafetyMode: 'off',
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
      twistSchedule: twists,
    });
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
      threatScore, getBond, getPerceivedBond, ordinal });
    simulateBBEpisode();
    const ep = simulateBBEpisode();
    const stored = (gs.episodeHistory || []).find(h => h.num === ep.num) || ep;
    const screens = buildVPScreens(stored) || [];
    const labels = screens.map(s => s.label);
    return {
      labels,
      house: screens.filter(s => s.label === 'House Life')
        .map(s => (s.html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')),
    };
  };

  for (const [name, twists] of [
    ['a triple', [{ episode: 2, type: 'bb-triple-eviction', teStyle: 'fast-forward' }]],
    ['a double', [{ episode: 2, type: 'bb-double-eviction', deStyle: 'fast-forward' }]],
    ['a triple ending on a chain', [{ episode: 2, type: 'bb-triple-eviction', teStyle: 'chain' }]],
  ]) {
    it(`says it once, at the top of the night, on ${name}`, () => {
      const { house } = subtitles(twists);
      expect(house.length, 'no house life at all').toBeGreaterThan(2);
      const noPower = house.filter(h => /Before anybody has power/i.test(h));
      // Exactly one, and it has to be the first stretch of the night.
      expect(noPower, `"Before anybody has power" appeared ${noPower.length} times`)
        .toHaveLength(1);
      expect(/Before anybody has power/i.test(house[0]),
        'the one that says it is not the first stretch').toBe(true);
    });

    it(`draws no two House Life screens in a row on ${name}`, () => {
      const { labels } = subtitles(twists);
      const doubled = labels.filter((l, i) => i > 0 && l === 'House Life' && labels[i - 1] === 'House Life');
      expect(doubled, `${doubled.length} pairs back to back`).toEqual([]);
    });
  }
});
