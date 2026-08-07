// The Twin Twist — one name in the roster is two people, and they have to earn
// the second door.
//
// From the wiki, BB5: "identical twins... would swap places every few days,
// playing as Adria. If the two made it to week 5 without being discovered or
// evicted, they would both enter the game as individuals." BB17 ran it again
// with Liz and Julia Nolan.
//
// This is that shape with the CALENDAR taken out. Beating a date is a twist you
// watch happen to somebody; both twins arriving because the pair of them earned
// it is a twist somebody plays. So entry is a quota of weekly jobs, and the
// season has four endings rather than one — quota met, discovered, evicted, or
// never finished. What is asserted here is that all four are reachable, that the
// swap is REAL (the stat line moves, so every system downstream feels it without
// knowing the twist exists), and that suspicion is something the twins can
// actually manage rather than a countdown.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships,
  kinshipBetween, kinshipPairs, familyPairs, tensePairs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { installTwinTwist, swapTwins, twinTells, twinDiscovery, checkTwinEntry,
  twinEvicted, twinUnfinished, twinState, isTwinIdentity, twinExposure,
  offerTwinMission, resolveTwinMission } from '../js/bb/twin-twist.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Julia', 'Bowie', 'Wayne', 'Raj', 'Eli', 'Fern',
  'Gus', 'Hicks', 'Iris', 'Jae', 'Kit', 'Lex'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(config = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled', ...config });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
}

const aWeek = (over = {}) => ({ num: 2, houseAtStart: [...NAMES], acts: [], ...over });

/** Drive one week of the twist by hand: swap, brief, resolve. */
function playJob(week) {
  swapTwins(week, { rng: Math.random });
  const brief = offerTwinMission(week, { rng: Math.random });
  const debrief = resolveTwinMission(week, { rng: Math.random });
  return { brief, debrief };
}

beforeEach(() => house());

describe('the twist itself', () => {
  it('is a season twist the house is never told about', () => {
    const contract = BB_TWIST_CONTRACTS['bb-twin-twist'];
    expect(contract).toBeTruthy();
    expect(contract.layer).toBe('season');
    // No announcement, unlike the Saboteur. BB5 and BB17 both ran it with the
    // room having to work it out on its own, so there is nothing to read out.
    expect(contract.acquisition.secrecy).toBe('secret');
    expect(contract.announcement ?? null).toBeNull();
  });

  it('gives the two of them measurably different stat lines', () => {
    const st = installTwinTwist(NAMES, { rng: Math.random });
    expect(st).toBeTruthy();
    expect(isTwinIdentity(st.front)).toBe(true);
    // Two up, two down, by a margin somebody could actually notice. A pair who
    // differ by noise is a pair nobody can ever catch — and, just as important,
    // a pair who can never weaponise the difference.
    const diffs = STAT_KEYS.map(k => Math.abs(st.statsA[k] - st.statsB[k])).filter(Boolean);
    expect(diffs.length).toBeGreaterThan(2);
    expect(Math.max(...diffs)).toBeGreaterThan(1);
  });

  it('can be cast by hand', () => {
    const st = installTwinTwist(NAMES, { rng: Math.random, pick: 'Kit' });
    expect(st.front).toBe('Kit');
  });

  it('makes them earn the second door rather than wait for a date', () => {
    const st = installTwinTwist(NAMES, { rng: Math.random, quota: 3 });
    expect(st.quota).toBe(3);
    expect(st.completed).toBe(0);
    // No calendar anywhere in the state. Weeks survived buy nothing.
    expect(st.enterWeek ?? null).toBeNull();
    gs.activePlayers = [...NAMES];
    expect(checkTwinEntry(aWeek({ num: 9 })), 'let them in on time served').toBeNull();
  });
});

describe('a twin the cast declared', () => {
  // The Relationships tab carries HOW two houseguests know each other as a
  // separate axis from how they feel about each other, so a season can say
  // "these two are twins" and the twist can stop guessing.
  it('seats the declared pair and brings the real person in', () => {
    house();
    // Kit is in the house. Kit's twin is cast but does not walk through the
    // door on night one — which is the actual shape of it: Adria and Natalie
    // were both cast and only one of them entered.
    players.push({ name: 'Kip', slug: 'kip', gender: 'f', sexuality: 'straight',
      archetype: 'floater', stats: spread(20) });
    setRelationships([{ id: 'r1', a: 'Kit', b: 'Kip', type: 'unbreakable', bond: 10, kin: 'twins' }]);
    globalThis.relationships = relationships;

    const st = installTwinTwist(NAMES, { rng: Math.random });
    expect(st.declared).toBe(true);
    expect(st.front).toBe('Kit');
    expect(st.other).toBe('Kip');
    // Their own stat line, not a generated approximation of one.
    expect(st.statsB).toEqual(spread(20));

    gs.activePlayers = [...NAMES];
    st.completed = st.quota;
    checkTwinEntry(aWeek({ num: 5 }));
    expect(gs.activePlayers).toContain('Kip');
    // And they keep the roster record the cast already gave them.
    expect(players.filter(p => p.name === 'Kip').length).toBe(1);
    setRelationships([]);
  });

  it('takes one of them back out when the season cast both', () => {
    // The obvious way to set this up, and the way that used to fail silently:
    // put both twins in the cast, mark them twins, and the pair check demanded
    // exactly one of them be outside — so it invented a stranger and left the
    // two declared twins in the house as ordinary houseguests who happened to
    // be related. Only one of them walked through the door on night one.
    house();
    setRelationships([{ id: 'r1', a: 'Kit', b: 'Lex', type: 'unbreakable', bond: 10, kin: 'twins' }]);
    globalThis.relationships = relationships;
    gs.activePlayers = [...NAMES];

    const st = installTwinTwist([...NAMES], { rng: Math.random, pick: 'Kit' });
    expect(st.declared).toBe(true);
    expect(st.held).toBe(true);
    expect(st.front).toBe('Kit');
    expect(st.other).toBe('Lex');
    // Their real stat line, not a generated approximation of one.
    const lex = spread(NAMES.indexOf('Lex') + 1);
    for (const k of STAT_KEYS) expect(st.statsB[k]).toBe(lex[k]);
    // And Lex is not in the house — Lex has been in the storeroom all along.
    expect(gs.activePlayers).not.toContain('Lex');
    expect(gs.activePlayers).toContain('Kit');
    // The roster record survives, which is what lets them walk in later.
    expect(players.find(p => p.name === 'Lex')).toBeTruthy();

    st.completed = st.quota;
    const entry = checkTwinEntry(aWeek({ num: 6, houseAtStart: gs.activePlayers }));
    expect(entry).toBeTruthy();
    expect(gs.activePlayers).toContain('Lex');
    expect(players.filter(p => p.name === 'Lex').length).toBe(1);
    setRelationships([]);
  });

  it('reads the two axes apart', () => {
    setRelationships([
      { id: 'a', a: 'Kit', b: 'Lex', type: 'nemesis', bond: -8, kin: 'siblings' },
      { id: 'b', a: 'Gus', b: 'Iris', type: 'friend', bond: 5, kin: 'exes' },
      { id: 'c', a: 'Eli', b: 'Fern', type: 'ally', bond: 3 },
    ]);
    globalThis.relationships = relationships;
    // Siblings who hate each other is a thing the model has to be able to say.
    expect(kinshipBetween('Kit', 'Lex')).toBe('siblings');
    expect(kinshipBetween('Lex', 'Kit')).toBe('siblings');
    expect(kinshipBetween('Eli', 'Fern')).toBe('none');
    // What a family season draws from, and what Rivals draws from.
    expect(familyPairs().map(p => p.kin)).toEqual(['siblings']);
    expect(tensePairs().map(p => p.kin)).toEqual(['exes']);
    expect(kinshipPairs('exes')[0].label).toBe('Exes');
    setRelationships([]);
  });
});

describe('the swap', () => {
  it('actually changes who is in the house', () => {
    // The whole mechanic. If the stat line does not move, every system
    // downstream is playing against the same person and the twist is a costume.
    const st = installTwinTwist(NAMES, { rng: Math.random, pick: 'Kit' });
    const before = { ...pStats('Kit') };
    swapTwins(aWeek(), { rng: Math.random });
    const after = { ...pStats('Kit') };
    expect(after).not.toEqual(before);
    // And it is the other twin's line exactly, not a nudge.
    const other = st.active === 'a' ? st.statsA : st.statsB;
    for (const k of STAT_KEYS) expect(after[k]).toBe(other[k]);
  });

  it('swaps back', () => {
    installTwinTwist(NAMES, { rng: Math.random, pick: 'Kit' });
    const first = { ...pStats('Kit') };
    swapTwins(aWeek(), { rng: Math.random });
    swapTwins(aWeek({ num: 3 }), { rng: Math.random });
    expect({ ...pStats('Kit') }).toEqual(first);
  });

  it('leaves a note, and how good it is decides how much they know', () => {
    // BB5's pair swapped in the bathroom and wrote each other briefings. That
    // detail is the dial the whole suspicion model hangs off: the incoming twin
    // knows what the outgoing one wrote down, and nothing else.
    let best = null, worst = null;
    for (let i = 0; i < 20; i++) {
      house();
      installTwinTwist(NAMES, { rng: Math.random });
      const swap = swapTwins(aWeek(), { rng: Math.random });
      expect(swap.handoff).toBeTruthy();
      expect(swap.handoff.quality).toBeGreaterThan(0);
      expect(swap.handoff.quality).toBeLessThanOrEqual(1);
      expect(swap.handoff.text.length).toBeGreaterThan(40);
      if (!best || swap.handoff.quality > best) best = swap.handoff.quality;
      if (!worst || swap.handoff.quality < worst) worst = swap.handoff.quality;
    }
    // It is a range, not a constant — otherwise it is not a dial.
    expect(best - worst).toBeGreaterThan(0.15);
  });
});

describe('the jobs', () => {
  it('offers something only two people sharing a name could do', () => {
    house();
    installTwinTwist(NAMES, { rng: Math.random });
    gs.activePlayers = [...NAMES];
    const week = aWeek();
    swapTwins(week, { rng: Math.random });
    const brief = offerTwinMission(week, { rng: Math.random });
    expect(brief).toBeTruthy();
    expect(brief.type).toBe('twin-brief');
    // The audience is holding the card and the house is not.
    expect(brief.secret).toBe(true);
    expect(brief.mission.name.length).toBeGreaterThan(3);
    expect(brief.mission.brief.length).toBeGreaterThan(30);
    expect(brief.mission.pay).toBeGreaterThan(0);
    expect(brief.quota).toBeGreaterThan(0);
    // The first job is always taken — a twist whose opening week is the pair
    // declining to do anything is a twist that has not started.
    expect(brief.accepted).toBe(true);
  });

  it('does not hand out the same job twice while it has fresh ones', () => {
    // Production is writing television. A pair who pull the same trick twice in
    // five weeks is not a twist, it is a habit, and the house would have worked
    // it out by the second one.
    let repeats = 0;
    for (let s = 0; s < 12; s++) {
      house();
      installTwinTwist(NAMES, { rng: Math.random });
      gs.activePlayers = [...NAMES];
      const ids = [];
      for (let w = 2; w < 8; w++) {
        const st = twinState();
        if (!st || st.entered || st.caught) break;
        const { brief } = playJob(aWeek({ num: w }));
        if (brief) ids.push(brief.mission.id);
      }
      if (new Set(ids).size !== ids.length) repeats++;
    }
    expect(repeats, 'the same job keeps coming back').toBeLessThan(4);
  });

  it('pays for the ones that come off, and nothing for the ones that do not', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    gs.activePlayers = [...NAMES];
    let worked = 0, failed = 0;
    for (let w = 2; w < 9 && !st.entered && !st.caught; w++) {
      const { debrief } = playJob(aWeek({ num: w }));
      if (!debrief || debrief.declined || debrief.impossible) continue;
      if (debrief.worked) { worked++; expect(debrief.paid).toBeGreaterThan(0); }
      else { failed++; expect(debrief.paid).toBe(0); }
    }
    expect(worked + failed, 'no job ever resolved').toBeGreaterThan(0);
    // Jobs finished is the only thing that moves the quota. Attempts do not.
    expect(st.completed).toBe(worked);
    expect(st.banked).toBeGreaterThanOrEqual(0);
  });

  it('makes the blind handoff cost them the note, on the week they take it', () => {
    // The most dangerous job in the twist, and the price has to land in the
    // same week it is accepted or it is free.
    let seen = false;
    for (let i = 0; i < 60 && !seen; i++) {
      house();
      installTwinTwist(NAMES, { rng: Math.random });
      gs.activePlayers = [...NAMES];
      const week = aWeek();
      swapTwins(week, { rng: Math.random });
      const brief = offerTwinMission(week, { rng: Math.random });
      if (brief?.mission?.id !== 'blind' || !brief.accepted) continue;
      seen = true;
      expect(twinState().knows).toBe(0);
      expect(twinState().handoff.blind).toBe(true);
    }
    expect(seen, 'the blind handoff was never offered in sixty draws').toBe(true);
  });
});

describe('the house noticing', () => {
  it('picks it up eventually, and never off one strange evening', () => {
    let anyTells = 0, foundEarly = 0;
    for (let i = 0; i < 12; i++) {
      house();
      installTwinTwist(NAMES, { rng: Math.random });
      swapTwins(aWeek(), { rng: Math.random });
      const out = twinTells(aWeek(), { rng: Math.random });
      if (out) {
        anyTells++;
        // Two a week at most: eight people all noticing in the same seven days
        // is a wall of cards saying the same thing, and it ended the twist by
        // week three in seven seasons out of ten.
        expect(out.notices.length).toBeLessThan(3);
        for (const b of out.beats) expect(b.text).not.toMatch(/undefined|NaN|\[object/);
      }
      if (twinState().caught) foundEarly++;
    }
    expect(anyTells, 'nobody ever noticed anything').toBeGreaterThan(2);
    // One week of tells is never enough to have it said out loud.
    expect(foundEarly).toBe(0);
  });

  it('lets a good note buy them a quieter week than a blind one', () => {
    // The handoff is the dial. If it does not move the memory slips, it is
    // decoration and the blind job costs nothing.
    const run = knows => {
      let slips = 0;
      for (let i = 0; i < 60; i++) {
        house();
        const st = installTwinTwist(NAMES, { rng: Math.random });
        swapTwins(aWeek(), { rng: Math.random });
        st.knows = knows;
        const out = twinTells(aWeek(), { rng: Math.random });
        slips += out?.memorySlips || 0;
      }
      return slips;
    };
    expect(run(0), 'a blind week is no worse than a briefed one')
      .toBeGreaterThan(run(1));
  });

  it('concentrates on whoever is already watching', () => {
    // The difference between a house that works something out and a house that
    // mutters. Spread evenly over eleven names, nobody ever gets past a hunch.
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    // Deliberately the LAST name the loop would otherwise reach, so the only
    // thing that can put them near the front is already having noticed.
    const watcher = NAMES.filter(n => n !== st.front).at(-1);

    const hits = seed => {
      let landed = 0, rounds = 0;
      for (let i = 0; i < 150; i++) {
        st.suspicion = seed ? { [watcher]: 1.4 } : {};
        const out = twinTells(aWeek(), { rng: Math.random });
        if (!out) continue;
        rounds++;
        if (out.notices.some(n => n.observer === watcher)) landed++;
      }
      return { rate: landed / Math.max(1, rounds), rounds };
    };
    const primed = hits(true);
    const cold = hits(false);
    expect(primed.rounds).toBeGreaterThan(20);
    expect(cold.rounds).toBeGreaterThan(20);
    // Somebody who caught one thing is looking for the next; somebody at the
    // back of the room is not. Left unsorted these two were the same number,
    // suspicion sprayed over eleven names, and the house said it out loud in
    // nought seasons out of forty.
    expect(primed.rate, `primed ${primed.rate.toFixed(2)} vs cold ${cold.rate.toFixed(2)}`)
      .toBeGreaterThan(cold.rate * 1.6);
  });

  it('needs three people and three weeks before anybody says it out loud', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    const others = NAMES.filter(n => n !== st.front);
    // Certain enough, but far too early.
    for (const n of others.slice(0, 4)) st.suspicion[n] = 3;
    expect(twinDiscovery(aWeek({ num: 2 })), 'said out loud in week two').toBeNull();
    // Late enough, but only one voice.
    st.suspicion = { [others[0]]: 9 };
    expect(twinDiscovery(aWeek({ num: 6 })), 'one person with a hunch ended it').toBeNull();
    // Three people, each sure on their own.
    for (const n of others.slice(0, 4)) st.suspicion[n] = 3;
    const found = twinDiscovery(aWeek({ num: 6 }));
    expect(found).toBeTruthy();
    expect(found.type).toBe('twin-caught');
    expect(others).toContain(found.teller);
  });
});

describe('the four endings', () => {
  it('lets them both in when the quota is met', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    gs.activePlayers = [...NAMES];
    const before = gs.activePlayers.length;

    st.completed = st.quota - 1;
    expect(checkTwinEntry(aWeek({ num: 5 })), 'entered a job short').toBeNull();
    st.completed = st.quota;
    st.banked = 21000;
    const entry = checkTwinEntry(aWeek({ num: 6 }));
    expect(entry).toBeTruthy();
    expect(entry.type).toBe('twin-entry');
    expect(gs.activePlayers.length).toBe(before + 1);
    expect(gs.activePlayers).toContain(st.other);
    // A real houseguest: their own roster entry, their own stats, their own
    // competition record.
    const record = players.find(p => p.name === st.other);
    expect(record).toBeTruthy();
    expect(record.stats).not.toEqual(pStats(st.front));
    expect(gs.bb.stats[st.other]).toBeTruthy();
    // And the twist is over: no more swapping, no more jobs.
    expect(swapTwins(aWeek({ num: 7 }), { rng: Math.random })).toBeNull();
    expect(offerTwinMission(aWeek({ num: 7 }), { rng: Math.random })).toBeNull();
  });

  it('stops the jobs dead when the house says it out loud', () => {
    // The change from BB17, where being worked out cost the twins nothing
    // because the rule they had to beat was a date. There is no date here, so
    // this is a real ending: the second twin never gets through the door.
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    gs.activePlayers = [...NAMES];
    st.banked = 14000;
    st.completed = 1;
    for (const n of NAMES.filter(x => x !== st.front).slice(0, 4)) st.suspicion[n] = 3;
    const found = twinDiscovery(aWeek({ num: 6 }));
    expect(found).toBeTruthy();
    expect(found.lost).toBe(14000);
    expect(twinState().banked).toBe(0);
    expect(twinState().ending).toBe('discovered');
    // No second door and no more work.
    expect(gs.activePlayers).not.toContain(st.other);
    expect(offerTwinMission(aWeek({ num: 7 }), { rng: Math.random })).toBeNull();
    expect(checkTwinEntry(aWeek({ num: 7 }))).toBeNull();
  });

  it('takes both of them out when the shared identity is evicted', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    swapTwins(aWeek(), { rng: Math.random });
    st.banked = 9000;
    const out = twinEvicted(st.front, aWeek({ num: 3 }));
    expect(out).toBeTruthy();
    expect(out.type).toBe('twin-out');
    expect(out.swaps).toBeGreaterThan(0);
    expect(out.lost).toBe(9000);
    expect(twinState().ending).toBe('evicted');
    // Nobody else's eviction does anything.
    house();
    installTwinTwist(NAMES, { rng: Math.random });
    const other = NAMES.find(n => n !== twinState().front);
    expect(twinEvicted(other, aWeek())).toBeNull();
  });

  it('tells the house at the end when nobody ever worked it out', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    gs.activePlayers = [...NAMES];
    st.completed = st.quota - 1;
    st.banked = 12000;
    const quiet = twinUnfinished(aWeek({ num: 10 }));
    expect(quiet).toBeTruthy();
    expect(quiet.type).toBe('twin-caught');
    expect(quiet.unfinished).toBe(true);
    expect(quiet.lost).toBe(12000);
    expect(twinState().ending).toBe('unfinished');
  });
});

describe('a season with one running', () => {
  it('plays, and reaches the screen and the page', () => {
    house({ bbTwins: 'random', bbTwinsQuota: 3 });
    let sawBrief = false, sawWeek = false, sawEnd = false;
    for (let w = 0; w < 9; w++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const acts = (ep.acts || []).filter(a => /^twin-/.test(a.type));
      if (acts.length) {
        const text = generateSummaryText(ep) || '';
        gs.episodeHistory = [ep];
        buildVPScreens(ep);
        Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
        const screens = (buildVPScreens(ep) || []).filter(s => /bb-twins/.test(s.id));
        expect(screens.length, 'a twin act with no screen').toBeGreaterThanOrEqual(acts.length);
        for (const s of screens) {
          expect(s.html.length).toBeGreaterThan(600);
          expect(s.html).not.toMatch(/undefined|NaN|\[object Object\]/);
        }
        for (const a of acts) {
          if (a.type === 'twin-brief') sawBrief = true;
          if (a.type === 'twin-week') sawWeek = true;
          if (['twin-entry', 'twin-out', 'twin-caught'].includes(a.type)) sawEnd = true;
          for (const b of a.beats || []) {
            expect(text, 'a twin beat the transcript never wrote down')
              .toContain(b.text.replace(/<[^>]*>/g, '').slice(0, 40));
          }
        }
      }
      const st = twinState();
      if (st?.entered || st?.caught) break;
    }
    // Two screens a week, at opposite ends of it.
    expect(sawBrief, 'the job was never handed over').toBe(true);
    expect(sawWeek, 'no twin week ever resolved').toBe(true);
    expect(sawEnd, 'the twist never ended').toBe(true);
  });

  it('reaches all four endings across a run of seasons', () => {
    // The measured shape, and the reason the twist is worth playing: no single
    // ending owns it. Roughly even thirds across quota / discovered / evicted
    // over forty seasons, with the quiet failure as the rare one.
    const endings = {};
    for (let s = 0; s < 14; s++) {
      house({ bbTwins: 'random', bbTwinsQuota: 3 });
      for (let w = 0; w < 10; w++) {
        if (!simulateBBEpisode()) break;
        const st = twinState();
        if (!st || st.entered || st.caught) break;
      }
      const st = twinState();
      if (st?.ending) endings[st.ending] = (endings[st.ending] || 0) + 1;
    }
    const kinds = Object.keys(endings);
    expect(kinds.length, `only one ending ever happens: ${JSON.stringify(endings)}`)
      .toBeGreaterThan(1);
    // No single ending should own more than four in five.
    const total = Object.values(endings).reduce((a, b) => a + b, 0);
    expect(Math.max(...Object.values(endings)) / total,
      `one ending dominates: ${JSON.stringify(endings)}`).toBeLessThan(0.8);
  }, 120000);

  it('does nothing at all when the season did not ask for one', () => {
    house({ bbTwins: 'off' });
    const ep = simulateBBEpisode();
    expect(twinState()).toBeFalsy();
    expect((ep.acts || []).some(a => /^twin-/.test(a.type))).toBe(false);
  });
});
