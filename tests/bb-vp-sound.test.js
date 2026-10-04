// The Big Brother viewer's sound (js/vp-bb-ep/sound.js): every bed and sting points at a
// file that is really in assets/audio/bb, every screen of a real season opens on a bed in
// the catalogue, every cue a step asks for exists, and the music actually varies: house
// scenes are not all the same mood, and the live eviction turns to the wait when the votes
// are in.
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { BB_BEDS, BB_STINGS, bedFor, soundFor } from '../js/vp-bb-ep/sound.js';
import { BED_CATALOG, CUE_CATALOG } from '../js/audio.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function weeks() {
  const out = [];
  for (const seed of [4242, 77]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-wildcard' }, { episode: 3, type: 'bb-coin-of-destiny' }];
    for (let w = 0; w < 3; w++) out.push(JSON.parse(JSON.stringify(withSeededRandom(seed + w, () => simulateBBEpisode()))));
  }
  return out;
}
const SCREENS = weeks().flatMap(ep => bbWeekSteps(ep));

describe('the Big Brother viewer’s sound', () => {
  it('points every bed and sting at a file that exists', () => {
    for (const bed of Object.values(BB_BEDS)) for (const f of bed.files) expect(fs.existsSync(`assets/audio/bb/${f}`), f).toBe(true);
    for (const s of Object.values(BB_STINGS)) for (const f of s.files) expect(fs.existsSync(f), f).toBe(true);
  });

  it('opens every screen of a real season on a bed in the catalogue', () => {
    for (const S of SCREENS) expect(BED_CATALOG[bedFor(S)], `${S.id} -> ${bedFor(S)}`).toBeTruthy();
  });

  it('asks only for cues that exist, and turns the eviction to the wait when the votes are in', () => {
    let waited = 0;
    for (const S of SCREENS) {
      S.steps.forEach((_, i) => {
        const { cue, bed } = soundFor(S, i);
        if (cue) expect(CUE_CATALOG[cue], cue).toBeTruthy();
        if (bed) expect(BB_BEDS[bed], bed).toBeTruthy();
        if (S.kind === 'evict' && bed === 'bb-live-wait') waited++;
      });
    }
    expect(waited).toBeGreaterThan(0);
  });

  it('does not play every house scene to the same music', () => {
    const moods = new Set(SCREENS.filter(S => S.kind === 'scene').map(S => S.mood));
    expect(moods.size).toBeGreaterThan(1);
  });
});
