// The season-twist panel builds itself from the twist contracts.
//
// Two season twists shipped as two near-identical hand-written blocks — a slab
// of HTML each, three seasonConfig keys, three lines in the save path, three in
// the load path and a bespoke player picker. Adding a third meant a third copy,
// and the copies had already drifted: one picker marked declared twins and the
// other did not, one hint explained the ending and the other did not.
//
// So a twist now describes its own controls in js/bb/twist-contract.js and the
// panel, the save path and the load path all read that. What is asserted here
// is that the description is ENOUGH: every control the schema names exists on
// the page, the settings survive a save and a load, and a twist that needs
// something from the cast says so before the season starts rather than running
// and quietly seating nothing.
import { beforeEach, describe, expect, it } from 'vitest';
import { seasonConfig, setRelationships, relationships } from '../js/core.js';
import { BB_SEASON_TWISTS, BB_TWIST_CONTRACTS, seasonTwistDefaults } from '../js/bb/twist-contract.js';
import { renderSeasonTwists, updateSeasonTwistUI, pickSeasonTwistPlayer,
  seasonTwistWarning } from '../js/run-ui.js';

const CAST = ['Julia', 'Bowie', 'Wayne', 'Raj'].map((name, i) => ({
  name, slug: name.toLowerCase(), archetype: 'floater',
}));

function page() {
  document.body.innerHTML = '<div id="bb-season-twists"></div>';
  globalThis.players = CAST;
  globalThis.seasonConfig = seasonConfig;
  globalThis.relationships = relationships;
  globalThis.BB_SEASON_TWISTS = BB_SEASON_TWISTS;
  globalThis.saveConfig = () => {};
  globalThis.renderSeasonTwists = renderSeasonTwists;
  globalThis.updateSeasonTwistUI = updateSeasonTwistUI;
  for (const [k, v] of Object.entries(seasonTwistDefaults())) seasonConfig[k] = v;
  renderSeasonTwists();
}

const el = id => document.getElementById(id);

beforeEach(() => { setRelationships([]); page(); });

describe('the panel comes from the contracts', () => {
  it('finds both season twists and nothing else', () => {
    expect(BB_SEASON_TWISTS.length).toBeGreaterThan(1);
    for (const c of BB_SEASON_TWISTS) {
      expect(c.layer, `${c.id} is on the season panel without being a season twist`).toBe('season');
      expect(c.season.key).toMatch(/^bb/);
      expect(c.season.label.length).toBeGreaterThan(3);
      expect(c.season.hint.length, `${c.id} has no explanation`).toBeGreaterThan(40);
      expect((c.season.modes || []).length).toBeGreaterThan(1);
    }
    // A scheduled twist has no business here.
    expect(BB_SEASON_TWISTS.some(c => c.id === 'bb-double-eviction')).toBe(false);
  });

  it('puts every control the schema names on the page', () => {
    for (const c of BB_SEASON_TWISTS) {
      const s = c.season;
      expect(el(`cfg-${s.key}`), `${c.id} has no switch`).toBeTruthy();
      expect(el(`sub-${s.key}`), `${c.id} has no sub-options`).toBeTruthy();
      // Off by default, so the sub-options are hidden.
      expect(el(`sub-${s.key}`).style.display).toBe('none');
      for (const opt of s.options || []) {
        const node = opt.type === 'houseguest' ? el(`pick-${opt.key}`) : el(`cfg-${opt.key}`);
        expect(node, `${c.id}: ${opt.key} has no control`).toBeTruthy();
      }
    }
  });

  it('opens the sub-options when the twist is switched on', () => {
    const c = BB_SEASON_TWISTS[0];
    el(`cfg-${c.season.key}`).value = 'random';
    updateSeasonTwistUI(c.id);
    expect(el(`sub-${c.season.key}`).style.display).toBe('block');
    // A "who is it" picker only means anything when the user asked to choose.
    const who = (c.season.options || []).find(o => o.when === 'choose');
    if (who) expect(el(`grp-${who.key}`).style.display).toBe('none');
  });

  it('draws the cast into the picker only when picking by hand', () => {
    const c = BB_SEASON_TWISTS.find(x => (x.season.options || []).some(o => o.type === 'houseguest'));
    const opt = c.season.options.find(o => o.type === 'houseguest');
    el(`cfg-${c.season.key}`).value = 'choose';
    updateSeasonTwistUI(c.id);
    expect(el(`grp-${opt.key}`).style.display).toBe('block');
    for (const p of CAST) expect(el(`pick-${opt.key}`).innerHTML).toContain(p.name);
  });

  it('keeps one holder per twist', () => {
    const c = BB_SEASON_TWISTS.find(x => (x.season.options || []).some(o => o.type === 'houseguest'));
    const opt = c.season.options.find(o => o.type === 'houseguest');
    el(`cfg-${c.season.key}`).value = 'choose';
    updateSeasonTwistUI(c.id);
    pickSeasonTwistPlayer(opt.key, c.id, 'Bowie');
    expect(seasonConfig[opt.key]).toBe('Bowie');
    // A second pick replaces the first rather than adding to it.
    pickSeasonTwistPlayer(opt.key, c.id, 'Raj');
    expect(seasonConfig[opt.key]).toBe('Raj');
    // And clicking the same one again clears it.
    pickSeasonTwistPlayer(opt.key, c.id, 'Raj');
    expect(seasonConfig[opt.key]).toBe('');
  });

  it('marks the people the cast has already declared something about', () => {
    // The Twin Twist's picker wants to show which houseguests already have a
    // declared twin, because that decides whether the second one is a real
    // person or an invented one — and that is a fact the dropdown cannot state.
    const c = BB_TWIST_CONTRACTS['bb-twin-twist'];
    const opt = c.season.options.find(o => o.mark?.kinship);
    expect(opt, 'the twin picker stopped marking declared twins').toBeTruthy();
    setRelationships([{ id: 'r1', a: 'Bowie', b: 'Wayne', type: 'ally', bond: 4, kin: 'twins' }]);
    globalThis.relationships = relationships;
    el(`cfg-${c.season.key}`).value = 'choose';
    updateSeasonTwistUI(c.id);
    // One fragment per houseguest. jsdom hands back the decoded character
    // rather than the entity, so match either.
    const cells = el(`pick-${opt.key}`).innerHTML.split('<div onclick=').filter(Boolean);
    const cell = name => cells.find(c => c.includes(`'${name}'`)) || '';
    const dot = /&#9679;|●/;
    expect(cell('Bowie'), 'a declared twin is not marked').toMatch(dot);
    expect(cell('Julia'), 'somebody with no declared twin got marked').not.toMatch(dot);
    setRelationships([]);
  });
});

describe('the settings survive the trip', () => {
  it('round-trips every key a twist owns', () => {
    // Numbers come off the page; a picked houseguest is written straight to
    // seasonConfig when clicked and has no input to read back.
    for (const c of BB_SEASON_TWISTS) {
      const s = c.season;
      el(`cfg-${s.key}`).value = 'choose';
      for (const opt of s.options || []) {
        if (opt.type === 'number') el(`cfg-${opt.key}`).value = String((opt.default ?? 1) + 1);
        else seasonConfig[opt.key] = 'Wayne';
      }
    }
    const saved = JSON.parse(JSON.stringify(
      Object.fromEntries(Object.keys(seasonTwistDefaults()).map(k => {
        const c = BB_SEASON_TWISTS.find(x => x.season.key === k
          || (x.season.options || []).some(o => o.key === k));
        const opt = (c?.season.options || []).find(o => o.key === k);
        if (!opt) return [k, el(`cfg-${k}`).value];
        return [k, opt.type === 'number' ? Number(el(`cfg-${k}`).value) : seasonConfig[k]];
      }))));

    for (const [k, v] of Object.entries(saved)) seasonConfig[k] = v;
    // A fresh page, then put the saved settings back.
    page();
    for (const [k, v] of Object.entries(saved)) seasonConfig[k] = v;
    for (const c of BB_SEASON_TWISTS) {
      const s = c.season;
      el(`cfg-${s.key}`).value = seasonConfig[s.key];
      for (const opt of (s.options || [])) {
        if (opt.type === 'number') el(`cfg-${opt.key}`).value = seasonConfig[opt.key];
      }
      updateSeasonTwistUI(c.id);
      expect(el(`cfg-${s.key}`).value).toBe(saved[s.key]);
      for (const opt of s.options || []) {
        if (opt.type === 'number') expect(Number(el(`cfg-${opt.key}`).value)).toBe(saved[opt.key]);
        else expect(seasonConfig[opt.key]).toBe(saved[opt.key]);
      }
    }
  });

  it('names a default for every key it owns', () => {
    // The engine reads these whether or not anybody opened the panel.
    const d = seasonTwistDefaults();
    for (const c of BB_SEASON_TWISTS) {
      expect(d[c.season.key]).toBe('off');
      for (const opt of c.season.options || []) expect(d).toHaveProperty(opt.key);
    }
  });
});

describe('a twist that has nothing to work with says so', () => {
  it('stays quiet for a twist with no casting requirement', () => {
    for (const c of BB_SEASON_TWISTS) {
      if (!c.season.requires) expect(seasonTwistWarning(c)).toBeNull();
    }
  });

  it('warns when the cast has not declared what the twist needs', () => {
    // The whole reason the schema exists: a dropdown cannot tell you a twist
    // has nothing to build from, so it runs, seats nothing, and looks broken.
    const fake = { id: 'test', season: { key: 'bbTest', label: 'Test', hint: '', modes: [],
      requires: { kinship: ['exes', 'ex-friends'], count: 2, hint: 'Declare two fallings-out first.' } } };
    setRelationships([]);
    globalThis.relationships = relationships;
    expect(seasonTwistWarning(fake)).toBe('Declare two fallings-out first.');

    setRelationships([
      { id: 'a', a: 'Julia', b: 'Bowie', type: 'nemesis', bond: -6, kin: 'exes' },
      { id: 'b', a: 'Wayne', b: 'Raj', type: 'nemesis', bond: -5, kin: 'ex-friends' },
    ]);
    globalThis.relationships = relationships;
    expect(seasonTwistWarning(fake)).toBeNull();
    setRelationships([]);
  });
});
