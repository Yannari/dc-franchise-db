// Hold the Line is a line under load, and the load goes both ways.
//
// This competition exists as a distinct thing in the library for exactly one
// reason: it is the only one where a houseguest can get back something they
// have already lost. Every other endurance comp here is a drain. If the haul
// ever stops working — or stops mattering, or quietly becomes a rounding error
// against the late notches — this is just The Wall with a rope, and nothing
// else in the suite would notice, because a competition that never reclaims an
// inch still returns a perfectly valid ranked board.
//
// It happened once already, which is why the proportional haul is written the
// way it is: with a flat one, the deficit a haul was meant to rescue grew
// faster than the haul could pay it back, and across three hundred nights the
// mechanic never once decided anything.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { addBond, getBond } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const ID = 'bb-endurance-wall';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks'];
// A mixed archetype spread: the false call needs somebody allowed to tell one.
const ARCH = ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'loyal-soldier',
  'hothead', 'wildcard', 'social-butterfly', 'perceptive-player'];
const CAST = NAMES.map((name, i) => ({ name, archetype: ARCH[i],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = (bonded = false) => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
  // The call is only heard by people who would listen to that person.
  if (bonded) NAMES.forEach((a, i) => NAMES.slice(i + 1).forEach(b => addBond(a, b, 4)));
};

const play = (seed, opts = {}) => runBBCompetition({
  type: opts.type || 'hoh', participants: NAMES.slice(0, opts.size || 8), house: NAMES,
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: { num: 4, houseAtStart: NAMES },
  nominees: opts.nominees || [NAMES[1], NAMES[5]], hoh: NAMES[0],
  haveNots: opts.haveNots || [],
});

describe('Hold the Line', () => {
  beforeEach(() => boot(true));

  it('runs the winch up notch by notch, one card per thing that happened', () => {
    for (const seed of [13, 501, 9090]) {
      boot(true);
      const r = play(seed);
      expect(r.detail.rounds, `seed ${seed}: resolved in one notch`).toBeGreaterThan(3);
      expect(r.detail.steps.length).toBe(r.beats.length);
      const pulls = r.detail.steps.filter(s => s.kind === 'notch').map(s => s.pull);
      expect(pulls.length).toBeGreaterThan(2);
      // The load never runs backwards while there is still a field out there.
      const upToLastTwo = pulls.slice(0, Math.max(1, pulls.length - 3));
      expect(upToLastTwo, `seed ${seed}: the winch eased off mid-field`)
        .toEqual([...upToLastTwo].sort((a, b) => a - b));
      expect(r.placements).toHaveLength(8);
    }
  });

  it('ground moves BOTH ways — the reason this competition exists', () => {
    let nightsWithAReclaim = 0;
    for (let s = 0; s < 40; s++) {
      boot(true);
      const r = play(s * 19 + 3);
      const seen = {};
      let reclaimed = false;
      for (const st of r.detail.steps) {
        for (const [name, g] of Object.entries(st.ground || {})) {
          if (seen[name] != null && g < seen[name] - 2) reclaimed = true;
          seen[name] = g;
        }
      }
      if (reclaimed) nightsWithAReclaim++;
    }
    expect(nightsWithAReclaim, 'nobody ever took back an inch in forty nights')
      .toBeGreaterThan(30);
  });

  it('a haul is worth more the deeper the trouble, and costs the winner nothing it should not', () => {
    const pairs = [];
    for (let s = 0; s < 60; s++) {
      boot(true);
      const r = play(s * 23 + 11);
      let prev = {};
      for (const st of r.detail.steps) {
        if (st.kind === 'haul') pairs.push({ from: prev[st.who] ?? 0, back: st.back });
        if (st.ground) prev = { ...prev, ...st.ground };
      }
    }
    expect(pairs.length, 'no haul happened in sixty nights').toBeGreaterThan(40);
    // Proportional, not flat: the deep hauls have to be the big ones, or the
    // mechanic cannot rescue anybody it is meant to rescue.
    const deep = pairs.filter(p => p.from >= 30);
    const shallow = pairs.filter(p => p.from > 0 && p.from < 20);
    expect(deep.length, 'nobody ever hauled from deep trouble').toBeGreaterThan(5);
    if (shallow.length) {
      const avg = xs => xs.reduce((n, x) => n + x.back, 0) / xs.length;
      expect(avg(deep), 'a deep haul returns no more than a shallow one — the haul is flat again')
        .toBeGreaterThan(avg(shallow));
    }
  });

  it('a slack that never came costs the people who believed it, and the liar', () => {
    for (let s = 0; s < 150; s++) {
      boot(true);
      const r = play(s * 37 + 5);
      const lie = r.detail.steps.find(st => st.kind === 'call' && st.honest === false);
      const burned = r.detail.steps.find(st => st.kind === 'burned');
      if (!lie || !burned) continue;
      // The victim lost ground and the relationship, and the house has it on
      // record against the liar. Popularity is deliberately NOT asserted here:
      // the same night pays out for hauling, for lasting, and for winning, so
      // the liar can finish a net point up having still been seen doing it —
      // which is a fact about popularity being a weak currency, not about the
      // lie going unpunished. Bonds are what nominations are chosen on.
      expect(getBond(burned.by, burned.who),
        'being lied to on the line cost the pair nothing').toBeLessThan(4);
      const victim = gs.bb.competitionMemories?.[burned.who] || [];
      expect(victim.some(m => m.type === 'line-false-call-victim')).toBe(true);
      const liar = gs.bb.competitionMemories?.[lie.who] || [];
      expect(liar.some(m => m.type === 'line-called-a-false-slack'),
        'the house has no record of who called it').toBe(true);
      return;
    }
    throw new Error('no false call landed in 150 nights');
  });

  it('nice archetypes never call a slack that is not coming', () => {
    // The library's standing rule: villain archetypes always can, nice ones
    // never do, neutrals need the brains and the disloyalty both.
    const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
    const niceNames = new Set(NAMES.filter((n, i) => NICE.has(ARCH[i])));
    for (let s = 0; s < 120; s++) {
      boot(true);
      const r = play(s * 43 + 2);
      for (const st of r.detail.steps) {
        if (st.kind === 'call' && st.honest === false) {
          expect(niceNames.has(st.who), `${st.who} is a nice archetype and told a lie`).toBe(false);
        }
      }
    }
  });

  it('the machine stops climbing once it is down to two', () => {
    for (let s = 0; s < 60; s++) {
      boot(true);
      const r = play(s * 29 + 4);
      const notches = r.detail.steps.filter(st => st.kind === 'notch');
      const lastTwo = notches.filter(st => st.notch === 'THE LAST TWO');
      if (!lastTwo.length) continue;
      // Held, not raised: every last-two notch carries the same load.
      expect(new Set(lastTwo.map(st => st.pull)).size,
        'the winch kept climbing through the final duel').toBe(1);
      return;
    }
    throw new Error('never reached a last-two duel in sixty nights');
  });

  it('a houseguest still holding is never drawn on the red line', () => {
    boot(true);
    const r = play(991, { size: 10 });
    const act = { type: 'hoh', winner: r.winner, participants: r.participants,
      results: r.placements.map(n => ({ name: n, score: r.scores[n] })), competition: r };
    const ep = { num: 4, acts: [act] };
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBComp(ep, 'hoh');
    Object.keys(_tvState).filter(k => k.startsWith('bb_sig_')).forEach(k => { _tvState[k].idx = 999; });
    const html = rpBuildBBComp(ep, 'hoh') || '';
    expect(html, 'fell back to the generic board').not.toContain('bbc-what');

    // The winch drags everybody past their own mark by the end, so the winner
    // can finish over the limit and still be the last one holding. A marker
    // parked on the red line reads as eliminated whatever the card says.
    const live = [...html.matchAll(/hl-lane\s+([^"]*)"[\s\S]*?hl-mk" style="left:([\d.]+)%/g)]
      .filter(m => !/is-out/.test(m[1]))
      .map(m => Number(m[2]));
    expect(live.length, 'no live lane on the finished board').toBeGreaterThan(0);
    live.forEach(x => expect(x, 'a houseguest still in it is drawn on the red line').toBeLessThan(95));
  });

  it('an Invisible HOH night airs the competition and not the standings', () => {
    boot(true);
    const r = play(4242, { size: 10 });
    const act = { type: 'hoh', secret: true, winner: r.winner, participants: r.participants,
      results: r.placements.map(n => ({ name: n, score: r.scores[n] })), competition: r };
    const ep = { num: 4, acts: [act] };
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBComp(ep, 'hoh');
    Object.keys(_tvState).filter(k => k.startsWith('bb_sig_')).forEach(k => { _tvState[k].idx = 999; });
    const html = rpBuildBBComp(ep, 'hoh') || '';
    expect(html).toContain('ONLY YOU KNOW');
    const before = html.slice(0, html.indexOf('ONLY YOU KNOW'));
    const out = (before.match(/hl-lane is-out/g) || []).length;
    expect(r.participants.length - out, 'the feed cut late enough to name the winner')
      .toBeGreaterThanOrEqual(3);
    // A marker's x-position IS its standing. Live lanes all park in one spot.
    const live = [...before.matchAll(/hl-lane\s+([^"]*)"[\s\S]*?hl-mk" style="left:([\d.]+)%/g)]
      .filter(m => !/is-out/.test(m[1])).map(m => m[2]);
    expect(new Set(live).size, 'a sealed track ranked the field by marker position')
      .toBeLessThanOrEqual(1);
  });

  it('survives a short field', () => {
    for (const size of [3, 4]) {
      boot(true);
      const r = play(size * 77, { size, nominees: [NAMES[1]] });
      expect(r.placements).toHaveLength(size);
      expect(r.winner).toBeTruthy();
      expect(r.detail.steps.length).toBe(r.beats.length);
    }
  });
});
