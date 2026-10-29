// The buzz as the show plays it, and the secret told on purpose (the user, 2026-10-29).
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { ssPartOf } from '../js/vp-bb-ep/ss-episode.js';
import { weeklyRuleBreaks, dOfficeFor } from '../js/ss/voice.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
function play(seed) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined });
  withSeededRandom(seed, () => { let n = 0; while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); });
}

describe('the buzz', () => {
  play(7);
  const weeks = gs.episodeHistory.filter(e => e?.format === 'big-brother').map(e => bbWeekSteps(e, { host: 'Josh' }));
  const all = weeks.flat();
  const steps = all.flatMap(s => s.steps);
  it('is pressed in the confessional, and the house goes red', () => {
    const press = all.filter(s => /^bb-ss-buzz-.*-w\d+$/.test(s.id));
    expect(press.length).toBeGreaterThan(2);
    for (const s of press) {
      expect(s.set).toBe('dr');
      expect(s.steps.some(st => st.alarm && st.prop === 'buzzer')).toBe(true);
      expect(s.steps.some(st => st.alarm && st.scene?.room === 'Living Room')).toBe(true);
    }
  });
  it('confronts later, at length, and sends the one buzzed out before asking to confirm', () => {
    for (const w of weeks) for (const s of w) {
      if (!/-room$/.test(s.id) || !s.buzzOf) continue;
      const press = w.findIndex(x => x.id === s.buzzOf || (x.merged || []).includes(s.buzzOf));
      expect(w.indexOf(s)).toBeGreaterThan(press);
      expect(s.steps.length).toBeGreaterThanOrEqual(18);
      const out = s.steps.findIndex(st => /You may leave the confessional/.test(String(st.t || '')));
      const ask = s.steps.findIndex(st => /Do you confirm your buzz, or do you withdraw it/.test(String(st.t || '')));
      expect(out).toBeGreaterThan(0);
      expect(ask).toBeGreaterThan(out);
    }
  });
  it('reveals with the whole house, at length, and the secret explained when it is found', () => {
    const revs = all.filter(s => /-reveal$|^bb-ss-prime-reveal-/.test(s.id));
    expect(revs.length).toBeGreaterThan(0);
    for (const s of revs) {
      expect(s.steps.length).toBeGreaterThanOrEqual(15);
      expect(s.steps.find(st => st.scene?.set === 'ceremony')?.scene.cast.length).toBeGreaterThan(2);
      if (/^bb-ss-prime-reveal-/.test(s.id)) expect(ssPartOf(s)).toBe('prime');
      if (s.steps.some(st => st.card?.state === 'found')) expect(s.steps.some(st => /^My secret is/.test(String(st.t || '')))).toBe(true);
    }
    expect(steps.filter(st => st.bed === 'ss-anthem')).toEqual([]);
  });
});

describe('a secret told on purpose', () => {
  it('empties the kitty and nominates them d\'office every week after', () => {
    const state = { kitty: { Ana: 20000, Ben: 5000 }, secrets: [{ id: 'a', holders: ['Ana'], text: 'I am a pilot', found: false }, { id: 'b', holders: ['Ben'], text: 'I sing', found: false }] };
    const ctx = { week: 3, rng: () => 0, stat: () => 5, bond: (x, y) => ([x, y].sort().join() === 'Ana,Ben' ? 6 : 0) };
    const acts = weeklyRuleBreaks(state, ctx, { house: ['Ana', 'Ben'] });
    const told = acts.find(a => a.kind === 'told');
    expect(told).toMatchObject({ who: 'Ana', to: 'Ben', commandment: 8 });
    expect(state.kitty.Ana).toBe(0);
    for (const wk of [4, 6, 9]) expect(dOfficeFor(state, wk)).toContain('Ana');
    expect(dOfficeFor(state, 3)).not.toContain('Ana');
  });
});
