// House mechanics that are not the vote: popularity, slop, and the weeks
// where somebody leaves without anybody deciding.
//
// These were hidden from the Big Brother setup screen because a house had no
// version of them. That was true of the code and should not have been true of
// the format — a house has an audience, a have-not room, and people who walk.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, setBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale, houseIsAtFinale } from '../js/bb-run.js';
import { buildBBWeekScreens } from '../js/vp-screens.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { configScopeFor } from '../js/quick-setup.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L']
  .map((name, i) => ({
    name, gender: 'm', sexuality: 'straight',
    archetype: ['mastermind','hothead','floater','villain','hero','goat'][i % 6],
  }));

function reset(over = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  Object.assign(seasonConfig, {
    format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'twist', bbHaveNotCount: 'auto',
    bbDepartures: 'off', popularityEnabled: true, ...over,
  });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.jury = []; gs.popularity = {};
}

const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);

describe('popularity in a house', () => {
  it('is tracked when the season has it on', () => {
    reset({ popularityEnabled: true });
    for (let i = 0; i < 3; i++) simulateBBEpisode();
    const moved = Object.values(gs.popularity || {}).filter(v => v !== 0);
    expect(moved.length, 'nothing moved the audience at all').toBeGreaterThan(0);
  });

  it('is not tracked when the season has it off', () => {
    reset({ popularityEnabled: false });
    for (let i = 0; i < 3; i++) simulateBBEpisode();
    // The switch used to change nothing: the house wrote popularity regardless.
    const moved = Object.values(gs.popularity || {}).filter(v => v !== 0);
    expect(moved).toHaveLength(0);
  });

  it('is offered to both shows on the setup screen', () => {
    expect(configScopeFor('big-brother').accordions).toContain('popularity');
    expect(configScopeFor('total-drama').accordions).toContain('popularity');
  });
});

describe('have-not count', () => {
  it.each([2, 3, 4])('puts exactly %i on slop when asked', (n) => {
    reset({ bbHaveNots: 'every-week', bbHaveNotCount: String(n) });
    const ep = simulateBBEpisode();
    expect(ep.haveNots).toHaveLength(n);
    expect(ep.haveNots).not.toContain(ep.hoh);
  });

  it('scales with the house on auto', () => {
    reset({ bbHaveNots: 'every-week', bbHaveNotCount: 'auto' });
    const ep = simulateBBEpisode();
    expect(ep.haveNots.length).toBeGreaterThanOrEqual(2);
    expect(ep.haveNots.length).toBeLessThanOrEqual(4);
  });
});

describe('walkouts and expulsions', () => {
  it('never happen when the season has them off', () => {
    reset({ bbDepartures: 'off' });
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 20) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      expect(actOf(ep, 'departure')).toBeUndefined();
      expect(ep.departure).toBeNull();
    }
  });

  it('take the week´s eviction with them when they do happen', () => {
    // Turned up high and seeded with a real rivalry so it fires inside a test.
    reset({ bbDepartures: 'often' });
    setBond('B', 'D', -10);
    setBond('D', 'B', -10);
    let found = null, guard = 0;
    while (!found && guard++ < 60) {
      reset({ bbDepartures: 'often' });
      setBond('B', 'D', -10);
      let inner = 0;
      while (!houseIsAtFinale() && inner++ < 12) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        if (ep.departure) { found = ep; break; }
      }
    }
    expect(found, 'no departure in 60 seasons at the highest rate').toBeTruthy();

    // The person who left is the person who went, and nobody voted.
    expect(found.eliminated).toBe(found.departure.name);
    expect(found.votingLog).toHaveLength(0);
    expect(Object.keys(found.votes)).toHaveLength(0);
    expect(actOf(found, 'eviction')).toBeUndefined();
    expect(['walkout', 'expulsion']).toContain(found.departure.kind);
    // An expulsion names the person it was with; a walkout does not need to.
    if (found.departure.kind === 'expulsion') expect(found.departure.other).toBeTruthy();
    // And they are actually out of the game.
    expect(gs.eliminated).toContain(found.departure.name);
    expect(gs.activePlayers).not.toContain(found.departure.name);

    // It gets a screen and a transcript section rather than a silent gap.
    const ids = buildBBWeekScreens(found).map(s => s.id);
    expect(ids).toContain('bb-departure');
    const text = generateBBSummaryText(found);
    expect(text).toMatch(/WALKOUT|EXPULSION/);
    expect(text).toContain('no eviction this week');
  });

  it('still reaches a finale with departures on', () => {
    reset({ bbDepartures: 'often' });
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 30) if (!simulateBBEpisode()) break;
    const fin = runBBFinale();
    expect(fin?.winner).toBeTruthy();
    expect(new Set([...gs.eliminated, ...gs.activePlayers]).size).toBe(CAST.length);
  });
});
