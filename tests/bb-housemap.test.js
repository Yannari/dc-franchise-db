// The house map (vp-bb-ep/housemap.js; spec docs/superpowers/specs/2026-10-13-bb-house-map-design.md).
// House Life is the house you watch: a conversation is a run of the segment's own steps, drawn in
// the room its scene is staged in, and the clock waits for the conversations the week turns on.
// These hold it to that, on real played weeks:
//   - every step belongs to exactly one conversation, in order (nothing dropped, nothing twice);
//   - every conversation has a room on the blueprint and a time of day that never runs backwards;
//   - the clock opens in order, and Next in story order visits every conversation once;
//   - nobody idle stands in a room where a private conversation is happening.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { conversationsOf, ZONES, WINDOWS, openWindow, nextConv, whereAt, isKeyScene, windowOf, hourOf } from '../js/vp-bb-ep/housemap.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

function segments(seed, weeks) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const ep = JSON.parse(JSON.stringify(withSeededRandom(seed * 100 + w, () => simulateBBEpisode())));
    out.push(...bbWeekSteps(ep, { houseLife: 'segments' }).filter(s => s.kind === 'houselife'));
  }
  return out;
}
const SEGS = segments(717, 3);

describe('the house map', () => {
  it('has House Life segments to draw', () => {
    expect(SEGS.length).toBeGreaterThan(2);
    expect(SEGS.some(S => conversationsOf(S).length > 3)).toBe(true);
  });

  it('cuts every step of a segment into exactly one conversation, in order', () => {
    for (const S of SEGS) {
      const convs = conversationsOf(S);
      expect(convs[0].from).toBe(0);
      for (let i = 1; i < convs.length; i++) expect(convs[i].from).toBe(convs[i - 1].to + 1);
      expect(convs.at(-1).to).toBe(S.steps.length - 1);
    }
  });

  it('puts every conversation in a room on the blueprint, at a time of day that never runs backwards', () => {
    for (const S of SEGS) {
      const convs = conversationsOf(S);
      for (const c of convs) {
        expect(ZONES[c.zone], `${c.scene.plate || c.scene.set}`).toBeTruthy();
        expect(c.window >= 0 && c.window < WINDOWS.length).toBe(true);
        expect(c.cast.length, c.title).toBeGreaterThan(0);
      }
      for (let i = 1; i < convs.length; i++) expect(convs[i].window).toBeGreaterThanOrEqual(convs[i - 1].window);
    }
  });

  it('opens the clock in order, and Next in story order watches every conversation once', () => {
    for (const S of SEGS) {
      const convs = conversationsOf(S);
      const watched = new Set();
      let last = 0;
      for (let n = 0; n < convs.length; n++) {
        const w = openWindow(convs, watched);
        expect(w).toBeGreaterThanOrEqual(last);
        last = w;
        const c = nextConv(convs, watched);
        expect(c, `stuck after ${watched.size} of ${convs.length}`).toBeTruthy();
        expect(watched.has(c.k)).toBe(false);
        expect(c.window).toBeLessThanOrEqual(w);
        watched.add(c.k);
      }
      expect(nextConv(convs, watched)).toBe(null);
    }
  });

  it('keeps idle houseguests out of the rooms where conversations are happening', () => {
    for (const S of SEGS) {
      const convs = conversationsOf(S);
      for (let w = 0; w < WINDOWS.length; w++) {
        const at = whereAt(convs, w, S.house);
        const inConv = new Set(convs.filter(c => c.window === w).flatMap(c => c.cast));
        const busyRooms = new Set(convs.filter(c => c.window === w && c.zone !== 'dr').map(c => c.zone));
        for (const [z, people] of Object.entries(at)) {
          for (const n of people) if (!inConv.has(n)) expect(busyRooms.has(z), `${n} idle in ${z} during a conversation`).toBe(false);
        }
        // and nobody is in two rooms at once
        const all = Object.values(at).flat();
        expect(new Set(all).size).toBe(all.length);
      }
    }
  });

  it('reads the clock, and knows what the week turns on', () => {
    expect(windowOf('9:40 AM')).toBe(0);
    expect(windowOf('2:15 PM')).toBe(1);
    expect(windowOf('7:30 PM')).toBe(2);
    expect(windowOf('11:10 PM')).toBe(3);
    expect(windowOf('1:30 AM')).toBe(3);
    expect(hourOf('12:30 AM')).toBeGreaterThan(24);
    expect(isKeyScene({ type: 'alliance' })).toBe(true);
    expect(isKeyScene({ type: 'campaign' })).toBe(true);
    expect(isKeyScene({ type: 'life' })).toBe(false);
    expect(isKeyScene({ type: 'talk', step: 'style.social' })).toBe(false);
    expect(isKeyScene({ type: 'talk', step: 'hohweek.plan' })).toBe(true);
  });
});
