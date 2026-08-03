// Pinning a competition to a week.
//
// The engine has always accepted `forcedCompetitions` and nothing ever set it,
// which is this project's recurring bug class — written but unreachable. These
// guard the whole path: the slot lists the designer offers, the config the
// picker writes, and the week the engine actually plays as a result.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, bbCompetitionsForSlot, bbForcedCompsForWeek } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L']
  .map((name, i) => ({ name, gender: i % 2 ? 'f' : 'm', sexuality: 'straight',
    archetype: ['mastermind','hero','floater','villain'][i % 4] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    twistSchedule: [], bbCompSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
}

describe('the competition picker', () => {
  beforeEach(reset);

  it('offers each slot only what can legally serve it', () => {
    const hoh = bbCompetitionsForSlot('hoh').map(c => c.id);
    const veto = bbCompetitionsForSlot('veto').map(c => c.id);

    // Veto-only signature comps must never be offered for an HOH night, and
    // the reverse — this filter is what makes an illegal week unauthorable.
    expect(veto).toContain('bb-sig-otev');
    expect(hoh).not.toContain('bb-sig-otev');
    expect(veto).toContain('bb-sig-hide-and-go-veto');
    expect(hoh).not.toContain('bb-sig-hide-and-go-veto');
    expect(hoh).toContain('bb-sig-the-wall');
    expect(veto).not.toContain('bb-sig-the-wall');

    // Both lists carry written comps and the generic fallbacks, flagged apart.
    for (const list of [bbCompetitionsForSlot('hoh'), bbCompetitionsForSlot('veto')]) {
      expect(list.some(c => !c.generic), 'no written comps offered').toBe(true);
      expect(list.some(c => c.generic), 'no generic comps offered').toBe(true);
      for (const c of list) expect(c.name, `${c.id} has no label`).toBeTruthy();
    }
  });

  it('reads a pinned week off the config and leaves an unpinned one alone', () => {
    expect(bbForcedCompsForWeek(1)).toBeUndefined();
    seasonConfig.bbCompSchedule = [{ episode: 2, hoh: 'bb-sig-the-wall' }];
    expect(bbForcedCompsForWeek(1)).toBeUndefined();
    expect(bbForcedCompsForWeek(2)).toEqual({ hoh: 'bb-sig-the-wall' });
    seasonConfig.bbCompSchedule = [{ episode: 2, hoh: 'bb-sig-the-wall', veto: 'bb-sig-otev' }];
    expect(bbForcedCompsForWeek(2)).toEqual({ hoh: 'bb-sig-the-wall', veto: 'bb-sig-otev' });
  });

  it('plays exactly the competitions pinned to the week', () => {
    seasonConfig.bbCompSchedule = [
      { episode: 1, hoh: 'bb-sig-the-wall', veto: 'bb-sig-otev' },
      { episode: 2, veto: 'bb-sig-bb-comics' },
    ];

    const ep1 = simulateBBEpisode();
    const hoh1 = ep1.acts.find(a => a.type === 'hoh')?.competition;
    const veto1 = ep1.acts.find(a => a.type === 'veto')?.competition;
    expect(hoh1?.debug?.competitionId).toBe('bb-sig-the-wall');
    expect(veto1?.debug?.competitionId).toBe('bb-sig-otev');

    // A half-pinned week honours the pin and still rolls the other slot.
    const ep2 = simulateBBEpisode();
    const veto2 = ep2.acts.find(a => a.type === 'veto')?.competition;
    const hoh2 = ep2.acts.find(a => a.type === 'hoh')?.competition;
    expect(veto2?.debug?.competitionId).toBe('bb-sig-bb-comics');
    expect(hoh2?.debug?.competitionId, 'unpinned slot was not chosen').toBeTruthy();

    // Week 3 is pinned to nothing and must still play.
    const ep3 = simulateBBEpisode();
    expect(ep3.acts.find(a => a.type === 'hoh')?.competition?.debug?.competitionId).toBeTruthy();
  });

  it('refuses a competition pinned to a slot it cannot serve, loudly', () => {
    // Silently falling back would turn an authoring mistake into a random
    // week the user thinks they booked.
    seasonConfig.bbCompSchedule = [{ episode: 1, hoh: 'bb-sig-otev' }];
    expect(() => simulateBBEpisode()).toThrow(/bb-sig-otev/);
  });
});
