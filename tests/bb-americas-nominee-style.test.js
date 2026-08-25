// America's Nominee has two shapes and only one of them was reachable.
//
// week.js has read `options.americasNomineeStyle` since the twist was written
// and NOTHING ever set it — not bb-run, not the Format Designer. So the twist
// always ran `direct`, and the entire MVP half of it was dead: written,
// registered, weighted, and impossible to reach. Its event family went with
// it, which is why the coverage guard kept reporting americas-mvp-quiet as
// never firing. That was never a weighting problem.
//
// The two shapes are genuinely different twists:
//
//   direct  the audience names the third nominee, so there is nobody in the
//           building to catch and every accusation lands on an innocent
//   mvp     a real houseguest was voted Most Valuable Player and named them in
//           secret, so there IS a culprit sitting in that room being no more
//           suspicious than anybody else
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house(anStyle) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [
    { id: 't1', episode: 2, type: 'bb-americas-nominee', ...(anStyle ? { anStyle } : {}) }];
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.namedAlliances = []; gs.jury = [];
  gs.episode = 0;
}
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; });

/** Play a few weeks and collect the act plus every americas-* event fired. */
function run(anStyle, seeds = [3, 9, 15, 27, 41, 58]) {
  const fired = {}; const acts = [];
  for (const seed of seeds) {
    house(anStyle);
    withSeededRandom(seed, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 5) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const a = (ep.acts || []).find(x => x.type === 'americas-nominee');
        if (a) acts.push(a);
        for (const act of ep.acts || []) {
          for (const b of act.socialBeats || []) {
            const id = String(b.eventId || '');
            if (id.startsWith('americas-')) fired[id] = (fired[id] || 0) + 1;
          }
        }
      }
    });
  }
  return { fired, acts };
}

describe('both shapes are reachable from the schedule', () => {
  it('runs direct by default, with nobody to catch', () => {
    const { acts } = run(undefined);
    expect(acts.length, 'the twist never ran').toBeGreaterThan(0);
    for (const a of acts) {
      expect(a.style).toBe('direct');
      expect(a.mvp, 'a direct week produced a culprit').toBeFalsy();
    }
  });

  it('runs the MVP shape when the schedule asks for it', () => {
    const { acts } = run('mvp');
    expect(acts.length).toBeGreaterThan(0);
    for (const a of acts) {
      expect(a.style, 'the schedule asked for mvp and got direct').toBe('mvp');
      expect(a.mvp, 'an MVP week named nobody').toBeTruthy();
      // The culprit is a real houseguest, and never the person they seated.
      expect(a.mvp).not.toBe(a.nominee);
    }
  });
});

describe('the MVP event family comes back to life', () => {
  it('fires americas-mvp-quiet, which no direct week can', () => {
    // The whole reason to wire the option: the house watching the ACTUAL
    // culprit overplay their innocence only exists in this shape.
    const mvp = run('mvp');
    const direct = run(undefined);
    expect(mvp.fired['americas-mvp-quiet'],
      'the MVP shape still cannot reach its own events').toBeGreaterThan(0);
    expect(direct.fired['americas-mvp-quiet'],
      'a direct week produced a culprit-watching event with no culprit')
      .toBeUndefined();
    // TWO FULL SWEEPS IN ONE TEST. Every other test here plays `run()` once;
    // this one plays it twice to compare the shapes, which is sixty simulated
    // episodes. It fits inside the 90s default alone and does not when a
    // hundred and forty-nine files are competing for the machine, so it timed
    // out in the full run and passed on its own -- flakiness that is really
    // just arithmetic.
  }, 240000);

  it('keeps the paranoia in both, because the house hunts either way', () => {
    // americas-hunt is the one that matters most and it must not be a
    // casualty of the new switch: a house cannot accept an anonymous chair
    // without a culprit, whether or not one exists.
    for (const style of [undefined, 'mvp']) {
      const { fired } = run(style);
      expect(fired['americas-hunt'], `no paranoia in the ${style || 'direct'} shape`)
        .toBeGreaterThan(0);
    }
  });
});
