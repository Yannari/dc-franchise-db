// @vitest-environment jsdom
//
// Followups item 1: nothing in production called `addCoach`, so a cast
// containing coaches produced an empty `gs.coaches` and the Coaches twist did
// nothing at all. This proves the real production path — cast-ui.js writing
// `isCoach` onto a player record, then `initGameState()` in js/savestate.js —
// actually produces coaches in `gs.coaches` and keeps them out of
// `gs.activePlayers`, without reimplementing any of that logic here.
import { describe, expect, it } from 'vitest';
import { seededRun, core } from './helpers/season-harness.js';
import { initGameState } from '../js/savestate.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const makeStats = () => Object.fromEntries(STATS.map(k => [k, 5]));

/** A cast shaped exactly like what cast-ui.js writes: `isCoach` sits beside
 * `tribe`, `archetype` etc. on the ordinary player record. */
function castWithCoaches() {
  return [
    { name: 'Chris', slug: 'chris', gender: 'm', sexuality: 'straight',
      archetype: 'mastermind', stats: makeStats(), tribe: 'Red', isCoach: true },
    { name: 'Dawn', slug: 'dawn', gender: 'f', sexuality: 'straight',
      archetype: 'hero', stats: makeStats(), tribe: 'Blue', isCoach: true },
    { name: 'Owen', slug: 'owen', gender: 'm', sexuality: 'straight',
      archetype: 'challenge-beast', stats: makeStats(), tribe: 'Red' },
    { name: 'Izzy', slug: 'izzy', gender: 'f', sexuality: 'straight',
      archetype: 'wildcard', stats: makeStats(), tribe: 'Red' },
    { name: 'Gwen', slug: 'gwen', gender: 'f', sexuality: 'straight',
      archetype: 'underdog', stats: makeStats(), tribe: 'Blue' },
    { name: 'Trent', slug: 'trent', gender: 'm', sexuality: 'straight',
      archetype: 'loyal-soldier', stats: makeStats(), tribe: 'Blue' },
  ];
}

function startOnly(cast, config = {}) {
  core.setPlayers(cast);
  core.setSeasonConfig({ ...core.seasonConfig, name: 'CoachEntry', teams: 2, mergeAt: 8,
    finaleSize: 3, jurySize: 5, romance: 'disabled', aftermath: 'disabled', ...config });
  const ok = initGameState();
  return { ok, gs: core.gs };
}

describe('the cast builder is a working entry point for coaches', () => {
  it('produces gs.coaches for isCoach players and keeps them off the roster', () => {
    const { ok, gs } = seededRun(() => startOnly(castWithCoaches()));
    expect(ok).toBe(true);

    const coachNames = (gs.coaches || []).map(c => c.name).sort();
    expect(coachNames).toEqual(['Chris', 'Dawn']);

    // The whole architecture in one assertion: 135 modules read activePlayers
    // to decide who competes, votes, holds immunity and takes a placement.
    expect(gs.activePlayers).not.toContain('Chris');
    expect(gs.activePlayers).not.toContain('Dawn');
    expect(gs.activePlayers.sort()).toEqual(['Gwen', 'Izzy', 'Owen', 'Trent']);

    // Non-coaches are contestants: on the roster, not in gs.coaches.
    const activeCoachNames = gs.coaches.map(c => c.name);
    for (const name of ['Owen', 'Izzy', 'Gwen', 'Trent']) {
      expect(activeCoachNames).not.toContain(name);
    }

    // addCoach's tribe assignment used the player's own `.tribe` field.
    const chris = gs.coaches.find(c => c.name === 'Chris');
    const dawn = gs.coaches.find(c => c.name === 'Dawn');
    expect(chris.tribe).toBe('Red');
    expect(dawn.tribe).toBe('Blue');

    // A coach is a cast member, not a tribe member: 135 modules use
    // tribe.members as "who competes" and a coach never should.
    const redTribe = gs.tribes.find(t => t.name === 'Red');
    const blueTribe = gs.tribes.find(t => t.name === 'Blue');
    expect(redTribe.members).not.toContain('Chris');
    expect(blueTribe.members).not.toContain('Dawn');
    expect(redTribe.members.sort()).toEqual(['Izzy', 'Owen']);
    expect(blueTribe.members.sort()).toEqual(['Gwen', 'Trent']);
  });

  it('refuses to start a season where a tribe has only coaches', () => {
    const cast = [
      { name: 'Chris', slug: 'chris', gender: 'm', sexuality: 'straight',
        archetype: 'mastermind', stats: makeStats(), tribe: 'Red', isCoach: true },
      { name: 'Owen', slug: 'owen', gender: 'm', sexuality: 'straight',
        archetype: 'challenge-beast', stats: makeStats(), tribe: 'Blue' },
      { name: 'Izzy', slug: 'izzy', gender: 'f', sexuality: 'straight',
        archetype: 'wildcard', stats: makeStats(), tribe: 'Blue' },
    ];
    const alertSpy = vi_alert();
    const { ok } = seededRun(() => startOnly(cast));
    expect(ok).toBe(false);
    alertSpy.restore();
  });
});

// jsdom provides window.alert, but it throws "Not implemented" by default —
// stub it so the guard rail's alert() doesn't fail the test for the wrong reason.
function vi_alert() {
  const orig = window.alert;
  window.alert = () => {};
  return { restore: () => { window.alert = orig; } };
}
