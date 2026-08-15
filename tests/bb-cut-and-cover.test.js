// Cut and Cover is a race with a debt in it, run in front of everybody.
//
// Two claims hold this competition up, and neither is visible from a ranked
// board. The first is the debt: a forced piece looks exactly like progress
// until the board jams, so the houseguest who looked fastest at the halfway
// point is often the one taking a third of their board apart at the end. That
// sentence was in the rules for as long as the competition existed and was
// never once simulated — it was a caption over a single scored roll.
//
// The second is the sightline. Every board is public, which is the only reason
// this is not The Run with a jigsaw on it, and it gives the yard three things
// to do with what they can see: copy it, block it, or warn a friend. All three
// have to actually fire, and the archetype rule has to hold on the two that
// are gated by it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { addBond, getBond } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const ID = 'bb-mental-puzzle';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks'];
const ARCH = ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'loyal-soldier',
  'hothead', 'wildcard', 'social-butterfly', 'perceptive-player'];
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const CAST = NAMES.map((name, i) => ({ name, archetype: ARCH[i],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = (bonded = true) => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
  if (bonded) NAMES.forEach((a, i) => NAMES.slice(i + 1).forEach(b => addBond(a, b, 4)));
};

const play = (seed, opts = {}) => runBBCompetition({
  type: opts.type || 'hoh', participants: NAMES.slice(0, opts.size || 8), house: NAMES,
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: { num: 4, houseAtStart: NAMES },
  nominees: opts.nominees || [NAMES[1], NAMES[5]], hoh: NAMES[0],
  haveNots: opts.haveNots || [],
});

describe('Cut and Cover', () => {
  beforeEach(() => boot());

  it('builds the boards pass by pass, one card per thing that happened', () => {
    for (const seed of [21, 808, 5150]) {
      boot();
      const r = play(seed);
      expect(r.detail.passes).toBeGreaterThan(3);
      expect(r.detail.steps.length).toBe(r.beats.length);
      expect(r.placements).toHaveLength(8);
      // Somebody finishes the image and buzzes, rather than the horn deciding it.
      expect(['buzzed', 'on-the-count']).toContain(r.detail.finished);
    }
  });

  it('a forced piece is a debt that comes due', () => {
    let boardsTornDown = 0;
    const pairs = [];
    for (let s = 0; s < 60; s++) {
      boot();
      const r = play(s * 17 + 3);
      const bd = r.breakdown || r.debug?.scoreBreakdown || {};
      for (const [, row] of Object.entries(bd)) {
        if (row.teardowns > 0) boardsTornDown++;
        pairs.push({ forced: row.forced || 0, lost: row.piecesLost || 0 });
      }
      // A teardown takes pieces off a board that were already on it.
      for (const st of r.detail.steps) {
        if (st.kind !== 'teardown') continue;
        expect(st.lost, 'a teardown that removed nothing').toBeGreaterThan(0);
      }
    }
    expect(boardsTornDown, 'nobody ever jammed a board').toBeGreaterThan(20);
    // Forcing pieces is what costs pieces. If these were unrelated the debt
    // would be decoration.
    const forcedALot = pairs.filter(p => p.forced >= 6);
    const forcedFew = pairs.filter(p => p.forced <= 2);
    const avg = xs => (xs.length ? xs.reduce((n, x) => n + x.lost, 0) / xs.length : 0);
    expect(forcedALot.length).toBeGreaterThan(10);
    expect(avg(forcedALot), 'forcing pieces costs no more than not forcing them')
      .toBeGreaterThan(avg(forcedFew));
  });

  it('the board never shows the debt before it bites', () => {
    // The competition is built on a forced piece being indistinguishable from
    // a sound one. The screen must not colour them in.
    boot();
    const r = play(77, { size: 10 });
    const act = { type: 'hoh', winner: r.winner, participants: r.participants,
      results: r.placements.map(n => ({ name: n, score: r.scores[n] })), competition: r };
    const ep = { num: 4, acts: [act] };
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBComp(ep, 'hoh');
    // Stop partway, while there is definitely undischarged debt on the boards.
    const half = Math.floor(r.detail.steps.length / 2);
    Object.keys(_tvState).filter(k => k.startsWith('bb_sig_')).forEach(k => { _tvState[k].idx = half; });
    const html = rpBuildBBComp(ep, 'hoh') || '';
    expect(html, 'fell back to the generic board').not.toContain('bbc-what');

    const upto = r.detail.steps.slice(0, half + 1);
    const bad = upto[upto.length - 1].bad || {};
    const owed = Object.entries(bad).filter(([, v]) => v > 0);
    expect(owed.length, 'no debt on the boards at the halfway point').toBeGreaterThan(0);
    // The tile count drawn per board is the placed count, debt included —
    // nothing anywhere separates them.
    const placed = upto[upto.length - 1].placed || {};
    for (const [name, v] of Object.entries(placed)) {
      if (!r.participants.includes(name)) continue;
      expect(html, `${name}'s board does not read ${v}`).toContain(`${v}/30`);
    }
  });

  it('all three things you can do with a sightline actually happen', () => {
    const seen = { copy: 0, block: 0, warn: 0, blocked: 0, panic: 0 };
    for (let s = 0; s < 80; s++) {
      boot();
      const r = play(s * 13 + 5);
      for (const st of r.detail.steps) if (st.kind in seen) seen[st.kind]++;
    }
    for (const kind of ['copy', 'block', 'warn', 'panic']) {
      expect(seen[kind], `nobody ever did: ${kind}`).toBeGreaterThan(3);
    }
  });

  it('copying is a real transfer, and warning an ally is worth something to both', () => {
    for (let s = 0; s < 120; s++) {
      boot();
      const r = play(s * 31 + 7);
      const warn = r.detail.steps.find(st => st.kind === 'warn');
      if (!warn) continue;
      // The warner gave up a placement; the friend keeps their board.
      expect(warn.saved, 'a warning that saved nothing').toBeGreaterThan(0);
      expect(getBond(warn.who, warn.to), 'warning an ally bought nothing').toBeGreaterThan(4);
      const mem = gs.bb.competitionMemories?.[warn.to] || [];
      expect(mem.some(m => m.type === 'puzzle-warned-by')).toBe(true);
      return;
    }
    throw new Error('nobody warned an ally in 120 rounds');
  });

  it('only nice archetypes warn, and nice archetypes never block', () => {
    const niceNames = new Set(NAMES.filter((n, i) => NICE.has(ARCH[i])));
    for (let s = 0; s < 100; s++) {
      boot();
      const r = play(s * 41 + 11);
      for (const st of r.detail.steps) {
        if (st.kind === 'warn') {
          expect(niceNames.has(st.who), `${st.who} is not a nice archetype and warned somebody`).toBe(true);
        }
        if (st.kind === 'block') {
          expect(niceNames.has(st.who), `${st.who} is a nice archetype and covered their board`).toBe(false);
        }
      }
    }
  });

  it('an Invisible HOH night airs the boards and not the counts', () => {
    boot();
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
    // Nobody is eliminated here, so the count IS the result: every board must
    // read the same and no tally may be printed.
    expect(before, 'a sealed board printed a piece count').not.toMatch(/\d+\/30/);
    const fills = [...before.matchAll(/class="cv-tiles">([\s\S]*?)<\/div>/g)]
      .map(m => (m[1].match(/class="on"/g) || []).length);
    expect(new Set(fills).size, 'the sealed boards ranked the field by fill').toBeLessThanOrEqual(1);
  });

  it('survives a short field', () => {
    for (const size of [3, 4]) {
      boot();
      const r = play(size * 91, { size, nominees: [NAMES[1]] });
      expect(r.placements).toHaveLength(size);
      expect(r.detail.steps.length).toBe(r.beats.length);
    }
  });
});
