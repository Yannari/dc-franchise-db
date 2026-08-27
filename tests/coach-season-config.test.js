// @vitest-environment jsdom
//
// Coaches is a SEASON-LONG system (seasonConfig.coaches: disabled|manual|
// auto), configured the same way as the Mole (seasonConfig.mole), decided
// once at cast time inside the real initGameState — not a TWIST_CATALOG
// entry scheduled on a night. This proves all three modes through the real
// production entry point, with no reimplementation of the gating logic.
import { describe, expect, it } from 'vitest';
import { seededRun, core } from './helpers/season-harness.js';
import { initGameState } from '../js/savestate.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const makeStats = () => Object.fromEntries(STATS.map(k => [k, 5]));

/** A cast shaped exactly like what cast-ui.js writes: `isCoach` sits beside
 * `tribe`, `archetype` etc. on the ordinary player record. Two isReturnee
 * players per tribe so 'auto' mode has a real proxy pool to pick from. */
function castWithCandidates() {
  return [
    // Red tribe: two returnees (auto-mode candidates) + two newbies
    { name: 'Chris', slug: 'chris', gender: 'm', sexuality: 'straight',
      archetype: 'mastermind', stats: makeStats(), tribe: 'Red', isCoach: true, isReturnee: true },
    { name: 'Heather', slug: 'heather', gender: 'f', sexuality: 'straight',
      archetype: 'villain', stats: makeStats(), tribe: 'Red', isReturnee: true },
    { name: 'Owen', slug: 'owen', gender: 'm', sexuality: 'straight',
      archetype: 'challenge-beast', stats: makeStats(), tribe: 'Red' },
    { name: 'Izzy', slug: 'izzy', gender: 'f', sexuality: 'straight',
      archetype: 'wildcard', stats: makeStats(), tribe: 'Red' },
    // Blue tribe: two returnees + two newbies
    { name: 'Dawn', slug: 'dawn', gender: 'f', sexuality: 'straight',
      archetype: 'hero', stats: makeStats(), tribe: 'Blue', isCoach: true, isReturnee: true },
    { name: 'Alejandro', slug: 'alejandro', gender: 'm', sexuality: 'straight',
      archetype: 'schemer', stats: makeStats(), tribe: 'Blue', isReturnee: true },
    { name: 'Gwen', slug: 'gwen', gender: 'f', sexuality: 'straight',
      archetype: 'underdog', stats: makeStats(), tribe: 'Blue' },
    { name: 'Trent', slug: 'trent', gender: 'm', sexuality: 'straight',
      archetype: 'loyal-soldier', stats: makeStats(), tribe: 'Blue' },
  ];
}

function startOnly(config = {}) {
  core.setPlayers(castWithCandidates());
  core.setSeasonConfig({ ...core.seasonConfig, name: 'CoachConfig', teams: 2, mergeAt: 8,
    finaleSize: 3, jurySize: 5, romance: 'disabled', aftermath: 'disabled', ...config });
  const ok = initGameState();
  return { ok, gs: core.gs };
}

// jsdom provides window.alert, but it throws "Not implemented" by default.
function vi_alert() {
  const orig = window.alert;
  window.alert = () => {};
  return { restore: () => { window.alert = orig; } };
}

describe('seasonConfig.coaches gates the whole twist', () => {
  it('disabled: no coaches at all, even with isCoach checked on the cast', () => {
    const { ok, gs } = seededRun(() => startOnly({ coaches: 'disabled' }));
    expect(ok).toBe(true);
    expect(gs.coaches).toEqual([]);
    // Chris and Dawn had `isCoach: true` on their player record — 'disabled'
    // must ignore that flag entirely, not just default to it.
    expect(gs.activePlayers).toContain('Chris');
    expect(gs.activePlayers).toContain('Dawn');
    expect(gs.activePlayers.length).toBe(8);
  });

  it('defaults to disabled when seasonConfig.coaches is unset', () => {
    const { ok, gs } = seededRun(() => startOnly({}));
    expect(ok).toBe(true);
    expect(gs.coaches).toEqual([]);
    expect(gs.activePlayers.length).toBe(8);
  });

  it('manual: produces exactly the checked players as coaches', () => {
    const { ok, gs } = seededRun(() => startOnly({ coaches: 'manual' }));
    expect(ok).toBe(true);
    const coachNames = gs.coaches.map(c => c.name).sort();
    expect(coachNames).toEqual(['Chris', 'Dawn']);
    expect(gs.activePlayers).not.toContain('Chris');
    expect(gs.activePlayers).not.toContain('Dawn');
    expect(gs.activePlayers.sort()).toEqual(['Alejandro', 'Gwen', 'Heather', 'Izzy', 'Owen', 'Trent']);
    // Never in tribe.members either.
    const red = gs.tribes.find(t => t.name === 'Red');
    const blue = gs.tribes.find(t => t.name === 'Blue');
    expect(red.members).not.toContain('Chris');
    expect(blue.members).not.toContain('Dawn');
  });

  it('auto: produces coachesPerTribe coaches per tribe, picked by the isReturnee proxy', () => {
    const { ok, gs } = seededRun(() => startOnly({ coaches: 'auto', coachesPerTribe: 1 }));
    expect(ok).toBe(true);
    expect(gs.coaches.length).toBe(2); // 1 per tribe x 2 tribes

    const redCoaches = gs.coaches.filter(c => c.tribe === 'Red').map(c => c.name);
    const blueCoaches = gs.coaches.filter(c => c.tribe === 'Blue').map(c => c.name);
    expect(redCoaches.length).toBe(1);
    expect(blueCoaches.length).toBe(1);
    // Picked from the returnee pool (Chris/Heather on Red, Dawn/Alejandro on
    // Blue) — never a newbie while a returnee candidate was available.
    expect(['Chris', 'Heather']).toContain(redCoaches[0]);
    expect(['Dawn', 'Alejandro']).toContain(blueCoaches[0]);

    // Never in activePlayers or tribe.members, same architecture as manual.
    for (const c of gs.coaches) {
      expect(gs.activePlayers).not.toContain(c.name);
      const tribe = gs.tribes.find(t => t.name === c.tribe);
      expect(tribe.members).not.toContain(c.name);
    }
    expect(gs.activePlayers.length).toBe(6);
  });

  it('auto: scales to coachesPerTribe = 2', () => {
    const { ok, gs } = seededRun(() => startOnly({ coaches: 'auto', coachesPerTribe: 2 }));
    expect(ok).toBe(true);
    expect(gs.coaches.length).toBe(4); // 2 per tribe x 2 tribes
    expect(gs.coaches.filter(c => c.tribe === 'Red').length).toBe(2);
    expect(gs.coaches.filter(c => c.tribe === 'Blue').length).toBe(2);
    expect(gs.activePlayers.length).toBe(4);
    // Auto mode ignores any leftover isCoach flag — Chris/Dawn are chosen by
    // the returnee proxy the same as any other returnee, not because their
    // checkbox happens to be set from a different mode's cast.
    const redCoaches = gs.coaches.filter(c => c.tribe === 'Red').map(c => c.name).sort();
    expect(redCoaches).toEqual(['Chris', 'Heather']);
  });

  it('still refuses to start a season where a tribe ends up with only coaches', () => {
    core.setPlayers([
      { name: 'Chris', slug: 'chris', gender: 'm', sexuality: 'straight',
        archetype: 'mastermind', stats: makeStats(), tribe: 'Red', isCoach: true },
      { name: 'Owen', slug: 'owen', gender: 'm', sexuality: 'straight',
        archetype: 'challenge-beast', stats: makeStats(), tribe: 'Blue' },
      { name: 'Izzy', slug: 'izzy', gender: 'f', sexuality: 'straight',
        archetype: 'wildcard', stats: makeStats(), tribe: 'Blue' },
    ]);
    core.setSeasonConfig({ ...core.seasonConfig, name: 'CoachConfig', teams: 2, mergeAt: 8,
      finaleSize: 3, jurySize: 5, romance: 'disabled', aftermath: 'disabled', coaches: 'manual' });
    const alertSpy = vi_alert();
    const { ok } = seededRun(() => ({ ok: initGameState() }));
    expect(ok).toBe(false);
    alertSpy.restore();
  });
});
