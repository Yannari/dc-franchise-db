// "Sim All doesn't simulate the finale, and the button never says Simulate
// Finale for Big Brother the way it does for Total Drama."
//
// Two separate causes for one symptom.
//
// Sim All stopped the moment the house reached FINALE SIZE — which is the week
// before the finale — so it ran a whole season and then quietly declined to
// play the last night, leaving the winner undecided and saying nothing.
//
// And the button reads gs.phase, which Big Brother never sets to 'finale': the
// house simply shrinks until the week engine has nothing left to run. So the
// one night of the season that plays differently was described as ordinary.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode, runBBFinale, houseIsAtFinale } from '../js/bb-run.js';
import { withSeededRandom } from './helpers/rng.js';
import { readFileSync } from 'node:fs';

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
  // The loop Sim All runs: weeks until the engine has nothing, then the finale.
  withSeededRandom(23, () => {
    for (let i = 0; i < 40; i++) {
      const ep = simulateBBEpisode() || runBBFinale();
      if (!ep) break;
      if (gs.phase === 'complete') break;
    }
  });
}, 900000);

describe('a season played to the end actually ends', () => {
  it('reaches the house size the finale starts from', () => {
    expect(houseIsAtFinale()).toBe(true);
  });

  it('plays the finale rather than stopping the week before it', () => {
    const finale = (gs.episodeHistory || []).filter(e => e?.isFinale);
    expect(finale, 'the season stopped one night short').toHaveLength(1);
  });

  it('crowns somebody', () => {
    expect(gs.phase).toBe('complete');
    const finale = (gs.episodeHistory || []).find(e => e?.isFinale);
    expect(finale?.winner, 'the finale ran and nobody won it').toBeTruthy();
  });
});

describe('the loop stops for the right reason', () => {
  const src = readFileSync('js/run-ui.js', 'utf8');

  it('no longer stops merely because the house got small', () => {
    // Stopping at finale size is stopping the week BEFORE the finale.
    expect(src).not.toMatch(/const bbDone = isBigBrotherSeason\(\) && houseIsAtFinale\(\);/);
    expect(src).toMatch(/const bbDone = isBigBrotherSeason\(\) && houseIsAtFinale\(\) && bbFinalePlayed;/);
  });

  it('still cannot run forever', () => {
    // The guard it replaced existed for a real reason: a house that will not
    // shrink would call simulateNext once per alert, forever.
    expect(src).toMatch(/const bbFinalePlayed = \(gs\.episodeHistory \|\| \[\]\)\.some\(e => e\?\.isFinale\)/);
    // And the finale itself sets the flag the outer condition already stops on.
    const finaleSrc = readFileSync('js/bb-finale.js', 'utf8');
    expect(finaleSrc).toMatch(/gs\.phase = 'complete'/);
  });
});

describe('the button says what the night is', () => {
  const src = readFileSync('js/run-ui.js', 'utf8');

  it('offers Simulate Finale for a house at finale size', () => {
    // Big Brother never sets gs.phase to 'finale', so keying only on that left
    // the label reading "Simulate Episode 12" on finale night.
    expect(src).toMatch(/isBigBrotherSeason\(\) && houseIsAtFinale\(\)\s*\n\s*&& !\(gs\.episodeHistory \|\| \[\]\)\.some\(e => e\?\.isFinale\)/);
  });

  it('stops offering it once the finale has been played', () => {
    // Otherwise a complete season sits there inviting a second finale.
    const branch = src.slice(src.indexOf("} else if (gs.phase === 'finale'"),
      src.indexOf('  } else {', src.indexOf("} else if (gs.phase === 'finale'")));
    expect(branch).toMatch(/some\(e => e\?\.isFinale\)/);
  });
});
