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

const CAST = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay'];
const FLAT = Object.fromEntries(['physical', 'endurance', 'mental', 'social',
  'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'].map(s => [s, 5]));

/** A whole season of competitions under one mix, and what it asked of the cast. */
function seasonSpend(mix, { weeks = 14, seed = 7 } = {}) {
  setGs({ bb: { competitionHistory: [], recentCompetitionCategories: [] }, popularity: {} });
  seasonConfig.bbCompMix = mix;
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let week = 1; week <= weeks; week++) {
    for (const type of ['hoh', 'veto']) {
      runBBCompetition({ type, participants: CAST, house: CAST, week: { num: week }, rng, library: [] });
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

const ranked = spend => Object.entries(spend).sort((a, b) => b[1] - a[1]).map(([s]) => s);
/** How lopsided a season was: the top stat over the mean. 1 is perfectly even. */
const tilt = spend => {
  const v = Object.values(spend);
  return Math.max(...v) / (v.reduce((a, b) => a + b, 0) / v.length);
};

beforeEach(() => {
  setPlayers(CAST.map(name => ({ name, archetype: 'floater', stats: { ...FLAT } })));
});

describe('the season asks for what it was told to', () => {
  it('puts the leaned stat on top', () => {
    expect(ranked(seasonSpend('mental'))[0]).toBe('mental');
    // Physical and endurance are one lean, because a physical season is one of
    // bodies rather than one of sprints specifically.
    expect(ranked(seasonSpend('physical')).slice(0, 2)).toContain('physical');
    expect(ranked(seasonSpend('endurance'))[0]).toBe('endurance');
  });

  it('leans without excluding', () => {
    // A season with one kind of night in it is a worse season, not a more
    // physical one. Everything the library can serve still appears.
    const spend = seasonSpend('physical');
    expect(spend.mental, 'a physical season ran no mental competition at all')
      .toBeGreaterThan(0);
  });

  it('spreads wider when balanced than when leaning', () => {
    // The point of the setting, in one comparison.
    expect(tilt(seasonSpend('balanced')))
      .toBeLessThan(tilt(seasonSpend('mental')));
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

  it('is on the setup panel and saved with the season', () => {
    const fs = require('node:fs');
    expect(fs.readFileSync('simulator.html', 'utf8')).toMatch(/id="cfg-bb-comp-mix"/);
    const ui = fs.readFileSync('js/cast-ui.js', 'utf8');
    expect(ui, 'the control is not read into the config').toMatch(/bbCompMix:\s+g\('cfg-bb-comp-mix'\)/);
    expect(ui, 'the control is not restored when a season loads')
      .toMatch(/set\('cfg-bb-comp-mix'/);
  });
});

describe('the history carries what the balanced rule reads', () => {
  it('records each competition\'s stats, not just its category', () => {
    // `balanced` reads what a season has already asked of the cast, and the
    // history is the only record of it. Without this the rule has nothing to
    // measure and quietly degrades to uniform selection.
    seasonSpend('balanced', { weeks: 2 });
    for (const entry of gs.bb.competitionHistory) {
      expect(entry.stats, `${entry.id} recorded no stats`).toBeTruthy();
      expect(Object.keys(entry.stats).length).toBeGreaterThan(0);
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
