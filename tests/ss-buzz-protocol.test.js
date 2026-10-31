// The buzz as the show plays it, and the secret told on purpose (the user, 2026-10-29).
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { ssPartOf } from '../js/vp-bb-ep/ss-episode.js';
import { weeklyRuleBreaks, dOfficeFor } from '../js/ss/voice.js';
import { resolveBuzz } from '../js/ss/hunt.js';
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
    // (the press spread through the days: never its confrontation and its reveal back to back)
    for (const w of weeks) for (const r of w.filter(s => s.buzzOf && /-reveal$/.test(s.id))) {
      const room = w.findIndex(s => s.id === `${r.buzzOf}-room`);
      expect(w.indexOf(r) - room).toBeGreaterThan(1);
    }
    expect(steps.filter(st => st.bed === 'ss-anthem')).toEqual([]);
  });
});

describe('the prime\'s tapes', () => {
  // (the user, 2026-10-31: "we need a tape before every moment in the prime", with flashback dialogue)
  const weeks = gs.episodeHistory.filter(e => e?.format === 'big-brother').map(e => bbWeekSteps(e, { host: 'Josh' }));
  it('come before every dilemma, mission result and buzz answer, never before the house that night', () => {
    let tapes = 0;
    for (const w of weeks) for (const [i, s] of w.entries()) {
      if (/^bb-ss-prime-tape-/.test(s.id)) {
        tapes++;
        expect(ssPartOf(w[i + 1])).toBe('prime');
        expect(w[i + 1].ssAfterPrime).toBeFalsy();
        expect(s.steps.some(st => st.magneto)).toBe(true);
      }
    }
    expect(tapes).toBeGreaterThan(5);
  });
  it('play back only lines that aired in the days', () => {
    for (const w of weeks) {
      const said = new Set(w.filter(s => ssPartOf(s) === 'daily').flatMap(s => s.steps || []).map(st => st.t));
      for (const st of w.filter(s => /^bb-ss-prime-tape-/.test(s.id)).flatMap(s => s.steps).filter(st => st.flashback)) expect(said.has(st.t)).toBe(true);
    }
  });
});

describe('a shared secret', () => {
  // (the user, 2026-10-31: "with who shared secret demand the other person too")
  const buzz = withName => {
    const state = { kitty: { Ana: 20000, Ben: 20000, Cy: 20000, Di: 20000 }, secrets: [{ id: 's', holders: ['Ana', 'Ben'], text: 'We are a fake couple', found: false }],
      theories: { Cy: { Ana: { text: 'We are a fake couple', right: true, conf: 0.95, ev: [], with: [withName] } } } };
    const ctx = { week: 3, rng: () => 0.5, stat: () => 5, bond: () => 0 };
    return { state, rec: resolveBuzz(state, ctx, 'Cy', 'Ana', { house: ['Ana', 'Ben', 'Cy', 'Di'] }) };
  };
  it('is found only with the partner named', () => {
    const { state, rec } = buzz('Ben');
    expect(rec.outcome).toBe('right');
    expect(rec.with).toEqual(['Ben']);
    expect(state.secrets[0].found).toBe(true);
  });
  it('with the right secret and the wrong partner, is a wrong buzz and stays hidden', () => {
    const { state, rec } = buzz('Di');
    expect(rec).toMatchObject({ outcome: 'wrong', textRight: true, withRight: false, with: ['Di'] });
    expect(state.secrets[0].found).toBe(false);
    expect(state.kitty.Cy).toBe(15000);
    expect(state.theories.Cy.Ana.notWith).toContain('Di');
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
