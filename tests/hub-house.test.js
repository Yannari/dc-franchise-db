// The Season Hub, for a house.
//
// "Cast still in the game" grouped on `phase === 'pre-merge'` plus a tribe
// list, and a Big Brother cast still carries whatever tribes it was built
// with — so before the first episode an eighteen-person house was drawn as
// Yellow, Red and Blue. prepareHouse() sets isMerged, but that only takes
// effect once an episode has run; the hub is looked at before that.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { buildSeasonHubModel } from '../js/run-ui.js';
import { isBigBrotherSeason } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L']
  .map((name, i) => ({
    name, gender: 'm', sexuality: 'straight', archetype: 'floater',
    tribe: ['Yellow', 'Red', 'Blue'][i % 3],
  }));

function setup(format, phase) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, isBigBrotherSeason });
  seasonConfig.format = format;
  seasonConfig.setting = format === 'big-brother' ? 'bb-house' : 'hosted-camp';
  gs.phase = phase;
  gs.initialized = true;
  gs.tribes = ['Yellow', 'Red', 'Blue'].map(name => ({
    name, members: CAST.filter(c => c.tribe === name).map(c => c.name),
  }));
  gs.activePlayers = CAST.map(c => c.name);
  return buildSeasonHubModel(gs, seasonConfig, players);
}

describe('the Season Hub in a house', () => {
  it('shows one house, not three tribes, before the first episode', () => {
    const model = setup('big-brother', 'pre-merge');
    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].name).toBe('The House');
    expect(model.groups[0].members).toHaveLength(CAST.length);
  });

  it('still shows one house at the finale, named for the finalists', () => {
    const model = setup('big-brother', 'finale');
    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].name).toBe('Finalists');
  });

  it('knows the house venues instead of falling back to a summer camp', () => {
    for (const [venue, label] of [['bb-house', 'The House'], ['bb-compound', 'The Compound'],
                                  ['bb-resort', 'The Resort'], ['bb-manor', 'The Manor']]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, isBigBrotherSeason });
      seasonConfig.format = 'big-brother';
      seasonConfig.setting = venue;
      gs.initialized = true;
      gs.activePlayers = CAST.map(c => c.name);
      expect(buildSeasonHubModel(gs, seasonConfig, players).setting.label).toBe(label);
    }
  });

  it('leaves Total Drama grouped by tribe', () => {
    const model = setup('total-drama', 'pre-merge');
    expect(model.groups).toHaveLength(3);
    expect(model.groups.map(g => g.name).sort()).toEqual(['Blue', 'Red', 'Yellow']);
  });
});
