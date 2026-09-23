// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// pm-cast-roll.test.js — the dice on an islander's card (Villa view)
// ══════════════════════════════════════════════════════════════════════
//
// A roll writes what resolveIslander would have rolled for a blank field, in
// its counts, from its lists; "Roll all" leaves eyes-on alone; the × clears a
// field back to the season's own roll.
import { beforeEach, describe, expect, it } from 'vitest';
import { setPlayers, seasonConfig } from '../js/core.js';
import { renderPerfectMatchCastSetup } from '../js/pm-cast-ui.js';
import { LOOK_TAGS, VIBES, ICKS, INTERESTS } from '../js/pm/profile.js';
import { makeIslanders } from './helpers/pm-cast.js';

const host = () => document.getElementById('pm-cast-setup');
const click = sel => host().querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true }));
let name;

beforeEach(() => {
  document.body.innerHTML = '<div id="pm-cast-setup"></div>';
  const cast = makeIslanders(12, 1);
  setPlayers(cast);
  seasonConfig.pmSetup = {};
  name = cast[0].name;
  renderPerfectMatchCastSetup();
});

describe('the dice', () => {
  it('every rollable section has a die, and eyes-on does not', () => {
    const card = host().querySelector('.pm-isl');
    const rolls = [...card.querySelectorAll('.pm-roll[data-roll]')].map(b => b.dataset.roll);
    expect(rolls.sort()).toEqual(['*', 'icks', 'interests', 'looks', 'type.looks', 'type.vibes']);
  });

  it('one section rolls in its own counts, from its own list, and shows as picked', () => {
    click(`.pm-roll[data-name="${name}"][data-roll="icks"]`);
    const s = seasonConfig.pmSetup[name];
    expect(s.icks.length).toBeGreaterThanOrEqual(1);
    expect(s.icks.length).toBeLessThanOrEqual(2);
    expect(s.icks.every(x => ICKS.includes(x))).toBe(true);
    expect(s.interests).toBeUndefined();
    const on = [...host().querySelectorAll(`input[data-name="${name}"][data-field="icks"]:checked`)].map(i => i.dataset.val);
    expect(on.sort()).toEqual([...s.icks].sort());
  });

  it('"Roll all" fills type, looks, icks and interests, never eyes-on', () => {
    for (let t = 0; t < 20; t++) {
      click(`.pm-roll[data-name="${name}"][data-roll="*"]`);
      const s = seasonConfig.pmSetup[name];
      const inRange = (arr, list, lo, hi) => arr.length >= lo && arr.length <= hi && arr.every(x => list.includes(x)) && new Set(arr).size === arr.length;
      expect(inRange(s.type.looks, LOOK_TAGS, 1, 3)).toBe(true);
      expect(inRange(s.type.vibes, VIBES, 1, 2)).toBe(true);
      expect(inRange(s.looks, LOOK_TAGS, 2, 3)).toBe(true);
      expect(inRange(s.icks, ICKS, 1, 2)).toBe(true);
      expect(inRange(s.interests, INTERESTS, 2, 4)).toBe(true);
      expect(s.eyesOn).toBeUndefined();
    }
  });

  it('the × clears one field back to the season, and the type object with it', () => {
    click(`.pm-roll[data-name="${name}"][data-roll="type.vibes"]`);
    expect(seasonConfig.pmSetup[name].type.vibes.length).toBeGreaterThan(0);
    click(`.pm-clear[data-name="${name}"][data-clear="type.vibes"]`);
    expect(seasonConfig.pmSetup[name].type).toBeUndefined();
  });

  it('only the islander clicked is touched', () => {
    click(`.pm-roll[data-name="${name}"][data-roll="*"]`);
    expect(Object.keys(seasonConfig.pmSetup).filter(n => Object.keys(seasonConfig.pmSetup[n]).length)).toEqual([name]);
  });
});
