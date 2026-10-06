// Move-in day (week one): the engine's first act, the first screen of the season after the
// titles, before any scene, alliance or competition; every houseguest walks in, in order, with
// a hello in their own archetype's voice; first impressions are about somebody already inside;
// the classic Move-In card is retired so the house does not move in twice.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function play(weeks) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
  return Array.from({ length: weeks }, (_, w) => JSON.parse(JSON.stringify(withSeededRandom(4242 + w, () => simulateBBEpisode()))));
}
const [W1, W2] = play(2);

describe('move-in day', () => {
  it('is the first act of week one and of no other week', () => {
    expect(W1.acts[0].type).toBe('move-in');
    expect(W2.acts.some(a => a.type === 'move-in')).toBe(false);
  });

  it('is the first screen of the week, before any scene or competition', () => {
    const screens = bbWeekSteps(W1);
    expect(screens[0].kind).toBe('movein');
  });

  it('walks everybody in, in order, each with their own hello', () => {
    const act = W1.acts[0];
    const S = bbWeekSteps(W1)[0];
    // a group walks in together (move-in night, 2026-10-06): every arrival, in order, once
    expect(S.steps.filter(st => st.miIn).flatMap(st => [].concat(st.miIn))).toEqual(act.arrivals);
    for (const b of act.beats) {
      expect(b.lines?.length).toBeGreaterThan(0);
      expect(b.lines[0].by).toBe(b.players[0]);
    }
  });

  it('gives first impressions only of somebody already inside, and not always the same person', () => {
    const act = W1.acts[0];
    const met = act.beats.filter(b => b.met);
    for (const b of met) expect(act.arrivals.indexOf(b.met)).toBeLessThan(b.order);
    expect(new Set(met.map(b => b.met)).size).toBeGreaterThan(1);
  });

  it('speaks with no holes, paints every step, and retires the classic card', () => {
    const screens = bbWeekSteps(W1);
    for (const st of screens[0].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
    for (let i = -1; i < screens[0].steps.length; i++) expect(stageHtml(screens, 0, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
    expect(REPLACED.test('bb-cold')).toBe(true);
  });
});
