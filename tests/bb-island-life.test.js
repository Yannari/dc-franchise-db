// Things that happen AT a place on the island (the user's #8, 2026-10-16; bb-events/island-life.js): they fire one
// or two a week, they air, each plays on its own spot's plate on the stepped stage, each moves something, and the
// words for every ending they can ask for are there.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { plateBuilt } from '../js/vp-bb-ep/plates.js';
import { ISLAND_LIFE_EVENTS } from '../js/bb-events/island-life.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'social-butterfly', 'challenge-beast'][i % 7] }));

function season(seed, weeks = 8) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'none', twistSchedule: [] });
  const eps = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed + w * 7, () => simulateBBEpisode());
    if (!ep) break;
    eps.push(JSON.parse(JSON.stringify(ep)));
  }
  return eps;
}
const PLAYED = [season(5), season(77)].flat();
const SPOT = { 'island-bonfire': 'beach-bonfire', 'island-pier': 'pier-east', 'island-volcano': 'beach-volcano', 'island-swing': 'pond-east', 'island-gym': 'gym-racks', 'island-bar': 'beach-hutbar' };
const beatsOf = ep => (ep.acts || []).flatMap(a => a.socialBeats || []).filter(b => /^island-/.test(String(b.eventId || '')));

describe('the island, as places things happen', () => {
  it('fires one or two a week, never the same one twice in a week, and airs them', () => {
    let fired = 0, aired = 0;
    for (const ep of PLAYED) {
      const b = beatsOf(ep);
      expect(b.length, `week ${ep.num}`).toBeLessThanOrEqual(2);
      expect(new Set(b.map(x => x.eventId)).size).toBe(b.length);
      fired += b.length; aired += b.filter(x => x.aired).length;
    }
    expect(fired / PLAYED.length).toBeGreaterThanOrEqual(1);
    expect(aired / fired).toBeGreaterThanOrEqual(0.9);
    const kinds = new Set(PLAYED.flatMap(beatsOf).map(b => b.eventId));
    expect(kinds.size, [...kinds].join(',')).toBeGreaterThanOrEqual(5);
  });

  it('moves something every time', () => {
    for (const b of PLAYED.flatMap(beatsOf)) expect((b.effects || []).length, b.eventId).toBeGreaterThan(0);
  });

  it('plays each one on its own spot, with no holes in a line and no place said twice', () => {
    let seen = 0;
    for (const ep of PLAYED) {
      for (const S of bbWeekSteps(ep)) for (const st of S.steps || []) {
        const sc = st.scene;
        if (!sc || !/^island-/.test(String(sc.step || ''))) continue;
        seen++;
        expect(plateBuilt(SPOT[sc.step])).toBe(true);
        expect(sc.plate, sc.step).toBe(SPOT[sc.step]);
        expect(String(st.t)).not.toMatch(/\{|\}|undefined/);
        // the spot's own line opens the scene: no "Volcano Beach. The volcano beach."
        expect(String(st.t)).not.toMatch(/^(The Bonfire|The Pier|Volcano Beach|East Pond|The Gym|The Beach Bar)\. .*\b(bonfire|fire pit|pier|volcano|east pond|rope swing|gym|beach bar|tiki|hut bar)\b/i);
      }
    }
    expect(seen).toBeGreaterThanOrEqual(8);
  });

  it('has the words for every ending, six of each', () => {
    for (const k of ['island.bonfire.warm', 'island.bonfire.pointed', 'island.pier.seen', 'island.pier.unseen', 'island.volcano.did', 'island.volcano.balked',
      'island.swing.splash', 'island.swing.together', 'island.gym.rivals', 'island.gym.spotters', 'island.bar.slip', 'island.bar.toast']) {
      expect(POOLS[k]?.length, k).toBeGreaterThanOrEqual(6);
    }
    expect(new Set(ISLAND_LIFE_EVENTS.map(e => e.id)).size).toBe(ISLAND_LIFE_EVENTS.length);
  });
});
