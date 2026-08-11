// "Jules pulls Ireland down / The block changes shape" — printed on a week
// whose own veto meeting reads "not to use the Power of Veto. The medallion
// goes back in its box, and the block does not move."
//
// The ceremony records what the veto did, precisely so nothing downstream has
// to guess it from the two nominee lists. That record stopped at the week
// object: weekToEpisode copied the nominee lists and not the flags, so
// `ep.vetoUsed` came back undefined and every reader fell through to the diff
// it was written to replace.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { rpBuildBBOverview } from '../js/vp-screens.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

beforeAll(() => {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
    gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
  initGameState();
  globalThis.gs = gs;
  withSeededRandom(23, () => { for (let i = 0; i < 4; i++) simulateBBEpisode(); });
}, 900000);

/** A week where the block moved and the veto had nothing to do with it. */
const coupWeek = () => ({
  ...gs.episodeHistory[gs.episodeHistory.length - 1],
  num: 99,
  hoh: 'Bowie', vetoWinner: 'Jules',
  initialNominees: ['Harriett', 'Ireland'],
  finalNominees: ['Chase', 'Millie'],
  vetoUsed: false, vetoSaved: null, vetoSavedAll: [],
  coup: { holder: 'Zee', removed: ['Harriett', 'Ireland'] },
  eliminated: 'Chase',
});

describe('the week carries what its own veto did', () => {
  it('puts the flags on every episode record, not just the week', () => {
    for (const ep of gs.episodeHistory) {
      expect(ep, `week ${ep.num} lost the veto record on the way to the episode`)
        .toHaveProperty('vetoUsed');
    }
  });

  it('agrees with the week it came from', () => {
    for (const ep of gs.episodeHistory) {
      const week = gs.bb.weeks.find(w => w.num === ep.num);
      if (!week || week.vetoUsed === undefined) continue;
      expect(ep.vetoUsed).toBe(week.vetoUsed);
      if (week.vetoUsed) expect(ep.vetoSaved).toBe(week.vetoSaved);
    }
  });

  it('leaves the flags absent on a week that never recorded them', async () => {
    // Absence has to keep meaning "ask the block". Writing a null would tell
    // every reader an old week definitely did not use its veto, hiding a save
    // that really happened.
    const { weekToEpisode } = await import('../js/bb-run.js');
    const legacy = weekToEpisode({ num: 1, acts: [], initialNominees: ['A', 'B'],
      finalNominees: ['A', 'C'], votes: {}, ballots: [] });
    expect(Object.prototype.hasOwnProperty.call(legacy, 'vetoUsed')).toBe(false);
  });
});

describe('the Gazette does not report a save nobody made', () => {
  it('stays silent about the veto when the medallion went back in the box', () => {
    const html = rpBuildBBOverview(coupWeek(), 'closing') || '';
    expect(html, 'the Gazette credited the veto with the Coup\'s work')
      .not.toMatch(/pulls .* down/);
    expect(html).not.toMatch(/VETO USED/);
  });

  it('says the veto went unused instead', () => {
    const html = rpBuildBBOverview(coupWeek(), 'closing') || '';
    expect(html).toMatch(/leaves the block alone|goes unused/);
  });

  it('still reports a veto that was genuinely used', () => {
    const ep = { ...coupWeek(), coup: null,
      initialNominees: ['Harriett', 'Ireland'], finalNominees: ['Harriett', 'Chase'],
      vetoUsed: true, vetoSaved: 'Ireland', vetoSavedAll: ['Ireland'],
      vetoReplacement: 'Chase' };
    const html = rpBuildBBOverview(ep, 'closing') || '';
    expect(html).toMatch(/pulls Ireland down|saves/);
  });
});
