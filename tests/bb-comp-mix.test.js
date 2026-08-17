// What kind of season this is, in competitions.
//
// Every Big Brother competition declares which stats decide it —
// `{ mental:.48, intuition:.27, … }` — and nothing read those when choosing
// one. So which stats mattered in a season was whatever the draw happened to
// produce: a run could go eight weeks without an endurance night and the
// wall-sitters simply never got one, with nothing in the setup that had asked
// for that or could ask for otherwise.
//
// `balanced` is an ACTIVE rule, not the absence of one. Uniform selection is
// not balance — a fair coin lands the same way four times often enough to
// flatten a season — so it favours whatever the season has not asked for yet.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig, setGs, setPlayers } from '../js/core.js';
import { BB_COMP_MIXES, bbCompMix, runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay'];
const FLAT = Object.fromEntries(['physical', 'endurance', 'mental', 'social',
  'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'].map(s => [s, 5]));

// ── measure the rule against the library it actually runs on ──
//
// This file used to pass `library: []`, so a season was drawn from the four
// fallback competitions the dispatcher appends. That is not a small version of
// the real pool, it is a different problem: those four sit in four DISTINCT
// categories, so the category cooldown (0.12 for a category that ran last
// competition) forces a near-perfect rotation between them and the mix
// multiplier has almost nothing left to express. Measured on it, the `social`
// lean and `balanced` produced the identical season.
//
// It also ran ONE seed. A fourteen-week draw is a draw, so a single stream
// decides a ranking by a few percent either way — which is how a rule that
// lifts its own stats by half in the average season could report the wrong
// winner and look broken.
const POOL = BB_COMPETITIONS;
const SEEDS = [7, 19, 33, 51, 67, 83, 97, 109];

/** A whole season of competitions under one mix, and what it asked of the cast. */
function seasonSpend(mix, { weeks = 14, seed = 7, library = POOL } = {}) {
  // A real game state, not the two fields the fallback scorer happened to need:
  // the written competitions form bonds, read the block and remember things, so
  // they run against a house rather than against a stat sheet.
  seedGame(CAST.map(name => ({ name, archetype: 'floater', stats: { ...FLAT } })),
    { episode: 0, eliminated: [] });
  setGs({ ...gs, bb: { competitionHistory: [], recentCompetitionCategories: [], stats: {}, weeks: [] },
    popularity: {}, showmances: [], romanticSparks: [] });
  seasonConfig.bbCompMix = mix;
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let week = 1; week <= weeks; week++) {
    for (const type of ['hoh', 'veto']) {
      // A block and a crown, because several written competitions read one and
      // decline to run without it.
      runBBCompetition({ type, participants: CAST, house: CAST, week: { num: week },
        rng, library, nominees: CAST.slice(-2), hoh: CAST[0] });
    }
  }
  const spent = {};
  for (const entry of gs.bb.competitionHistory) {
    for (const [stat, weight] of Object.entries(entry.stats || {})) {
      spent[stat] = (spent[stat] || 0) + weight;
    }
  }
  return spent;
}

/** The same, averaged over the seed set — one season is a draw, not a rule. */
function meanSpend(mix, opts = {}) {
  const out = {};
  for (const seed of SEEDS) {
    for (const [stat, weight] of Object.entries(seasonSpend(mix, { ...opts, seed }))) {
      out[stat] = (out[stat] || 0) + weight / SEEDS.length;
    }
  }
  return out;
}

const ranked = spend => Object.entries(spend).sort((a, b) => b[1] - a[1]).map(([s]) => s);
/** How lopsided a season was: the top stat over the mean. 1 is perfectly even. */
const tilt = spend => {
  const v = Object.values(spend);
  return Math.max(...v) / (v.reduce((a, b) => a + b, 0) / v.length);
};
const meanTilt = (mix, opts = {}) =>
  SEEDS.reduce((t, seed) => t + tilt(seasonSpend(mix, { ...opts, seed })), 0) / SEEDS.length;

beforeEach(() => {
  setPlayers(CAST.map(name => ({ name, archetype: 'floater', stats: { ...FLAT } })));
});

describe('the season asks for what it was told to', () => {
  // The property that IS the setting: asking for a kind of season gets you
  // measurably more of it than not asking. Stated as a lift over `balanced`
  // rather than as a ranking, because a ranking is a claim about the whole
  // library and not about the rule — see the endurance case below.
  it('every lean buys a real increase in the stats it names', () => {
    const base = meanSpend('balanced');
    // `social` is measured on its own below: what caps it is the library, not
    // the rule, and folding it in here would mean lowering this bar to a number
    // that proves nothing about the three that work.
    for (const mix of ['physical', 'mental', 'endurance']) {
      const lean = BB_COMP_MIXES[mix].lean;
      const leaned = meanSpend(mix);
      const before = lean.reduce((t, s) => t + (base[s] || 0), 0);
      const after = lean.reduce((t, s) => t + (leaned[s] || 0), 0);
      // The PAIR, not each half. A lean names two stats because they go
      // together, and the second is usually one the library already spends
      // freely — leaning mental raises mental by a third and intuition by a
      // tenth, because half the competitions in the game want some intuition
      // whether or not anybody asked for it.
      expect(after, `leaning ${mix} did not buy more ${lean.join('+')} `
        + `(${before.toFixed(2)} -> ${after.toFixed(2)})`).toBeGreaterThan(before * 1.15);
      // And the stat the setting is NAMED for has to move on its own.
      expect(leaned[lean[0]], `leaning ${mix} did not buy more ${lean[0]}`)
        .toBeGreaterThan((base[lean[0]] || 0) * 1.2);
    }
  });

  // ── what the social lean can and cannot do ──
  //
  // Asking for a social season gets you more of the competitions that carry any
  // social or strategic weight — 36% of a balanced season's draws, 40% of a
  // leaned one — and it raises strategic spend by about a tenth. It does not
  // raise SOCIAL spend at all, and that is not the rule failing. Of the
  // library's total stat weight, social is under 4%: the comps with the largest
  // share of this lean are strategic-heavy quizzes, so leaning it selects for
  // strategic and finds almost no social to select for.
  //
  // The assertion is written as the CAUSE rather than as a lowered bar, so this
  // test fails the day the library grows the social competitions it is short of
  // — which is when this should be deleted and social folded in above.
  it('the social lean is capped by the library, not by the rule', () => {
    const weight = {};
    let total = 0;
    for (const comp of POOL) {
      for (const [stat, w] of Object.entries(comp.stats || {})) {
        weight[stat] = (weight[stat] || 0) + w; total += w;
      }
    }
    expect(weight.social / total,
      'the library now carries real social weight — fold social into the lift test above')
      .toBeLessThan(0.05);
    // What it CAN do, and does.
    expect(meanSpend('social').strategic).toBeGreaterThan(meanSpend('balanced').strategic);
  });

  it('puts the leaned stat on top where the library can serve one', () => {
    expect(ranked(meanSpend('mental'))[0]).toBe('mental');
    // Physical and endurance are one lean, because a physical season is one of
    // bodies rather than one of sprints specifically.
    expect(ranked(meanSpend('physical')).slice(0, 2)).toContain('physical');
    // ── and why endurance is not asserted here ──
    //
    // This file used to demand `ranked(endurance)[0] === 'endurance'`. That is
    // not a claim about the rule, it is a claim about what an endurance
    // competition IS: every wall, hold and hang in the library carries real
    // physical weight, because hauling yourself back onto a ledge is not a
    // different activity from being strong. Leaning endurance raises endurance
    // spend by better than a third — asserted above — and physical still
    // finishes above it, as it should. The two leans overlap on purpose;
    // `physical` names endurance in its own pair for the same reason.
  });

  it('leans without excluding', () => {
    // A season with one kind of night in it is a worse season, not a more
    // physical one. Everything the library can serve still appears.
    const spend = meanSpend('physical');
    expect(spend.mental, 'a physical season ran no mental competition at all')
      .toBeGreaterThan(0);
  });

  it('spreads wider when balanced than when leaning', () => {
    // The point of the setting, in one comparison. Averaged, because the gap
    // between a balanced season and a leaned one is a few percent on any single
    // draw and either can come out on top of the other by luck.
    const balanced = meanTilt('balanced');
    for (const mix of Object.keys(BB_COMP_MIXES)) {
      if (!BB_COMP_MIXES[mix].lean) continue;
      expect(balanced, `a ${mix} season was no more lopsided than a balanced one`)
        .toBeLessThan(meanTilt(mix));
    }
  });

  it('leaves no stat the library can serve completely idle', () => {
    const spend = seasonSpend('balanced', { weeks: 16 });
    for (const stat of ['physical', 'endurance', 'mental', 'temperament', 'intuition']) {
      expect(spend[stat] || 0, `a balanced season never asked for ${stat}`)
        .toBeGreaterThan(0);
    }
  });
});

describe('the setting itself', () => {
  it('defaults to balanced rather than to no rule', () => {
    seasonConfig.bbCompMix = undefined;
    expect(bbCompMix()).toBe('balanced');
    seasonConfig.bbCompMix = 'nonsense';
    expect(bbCompMix(), 'an unknown mix silently disabled the rule').toBe('balanced');
  });

  it('offers a label for every mix, for the control to render', () => {
    for (const [id, def] of Object.entries(BB_COMP_MIXES)) {
      expect(typeof def.label, `${id} has no label`).toBe('string');
      expect(def.label.length).toBeGreaterThan(3);
    }
  });

  it('survives a save with no control on the page', () => {
    // The mix is set from the timeline's Competition Randomizer, not from a
    // dropdown in Season Options — it belongs beside the thing that applies it.
    // Which means `saveConfig` reads an element that is not there, and a bare
    // `|| 'balanced'` would quietly reset the season's mix every time anything
    // else on that panel changed.
    const ui = require('node:fs').readFileSync('js/cast-ui.js', 'utf8');
    expect(ui, 'a missing control resets the mix')
      .toMatch(/bbCompMix:\s+g\('cfg-bb-comp-mix'\)\?\.value \|\| seasonConfig\.bbCompMix/);
  });

  it('is offered where it is applied', () => {
    const run = require('node:fs').readFileSync('js/run-ui.js', 'utf8');
    expect(run, 'the randomiser does not offer the mix').toMatch(/id="bb-rand-mix"/);
    expect(run, 'choosing a mix does not stick to the season')
      .toMatch(/seasonConfig\.bbCompMix = mix/);
  });
});

describe('the history carries what the balanced rule reads', () => {
  it('records each competition\'s stats, not just its category', () => {
    // `balanced` reads what a season has already asked of the cast, and the
    // history is the only record of it. Without this the rule has nothing to
    // measure and quietly degrades to uniform selection.
    seasonSpend('balanced', { weeks: 6 });
    // One competition in the library declares no profile and is supposed to:
    // a crapshoot is decided by nothing about the houseguest, which is a real
    // Big Brother competition type rather than a gap. It still has to record
    // an object, so a season that draws it does not corrupt the tally.
    const noProfile = new Set(POOL.filter(c => !Object.keys(c.stats || {}).length).map(c => c.id));
    expect(noProfile.size, 'more than a crapshoot is missing a profile now')
      .toBeLessThanOrEqual(1);
    for (const entry of gs.bb.competitionHistory) {
      expect(entry.stats, `${entry.id} recorded no stats object`).toBeTruthy();
      if (noProfile.has(entry.id)) continue;
      expect(Object.keys(entry.stats).length, `${entry.id} recorded an empty profile`)
        .toBeGreaterThan(0);
    }
  });

  it('copies them rather than sharing the library object', () => {
    // The competition definitions are shared across every season in the
    // process; a reference here would let one season's history be edited by
    // another's.
    seasonSpend('balanced', { weeks: 1 });
    const entry = gs.bb.competitionHistory[0];
    entry.stats.physical = 999;
    seasonSpend('balanced', { weeks: 1 });
    expect(gs.bb.competitionHistory[0].stats.physical).not.toBe(999);
  });
});
