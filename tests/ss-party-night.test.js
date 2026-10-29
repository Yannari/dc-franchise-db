// Party night as a whole evening (the user, 2026-10-29: "party night is lame too no animation no one dancing no drama no
// fight no bonding no talking just 8 ticks when we should get at least 50").
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));

describe('party night', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined });
  withSeededRandom(11, () => { let n = 0; while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); });
  const eps = gs.episodeHistory.filter(e => e?.format === 'big-brother');
  const acts = eps.flatMap(e => (e.acts || []).filter(a => a?.type === 'ss-party'));
  const screens = eps.flatMap(e => bbWeekSteps(e, { host: 'Josh' })).filter(s => /^bb-ss-party-/.test(s.id));
  it('is a whole evening, on the dance floor, with everybody in it', () => {
    expect(screens.length).toBeGreaterThan(0);
    for (const s of screens) {
      expect(s.steps.length, s.id).toBeGreaterThanOrEqual(50);
      expect(s.party).toBe(true);
      expect(s.steps.some(st => st.scene?.party && st.scene.cast.length >= Math.min(5, s.cast.length)), s.id).toBe(true);
    }
  });
  it('dances, toasts, talks and gossips, and every new moment moves somebody', () => {
    for (const a of acts) {
      const kinds = new Set(a.moments.map(m => m.kind));
      for (const k of ['dance', 'danceoff', 'toast', 'game']) expect(kinds.has(k), `${a.name} ${k}`).toBe(true);
      // (nobody in two dance pairs, nor two heart-to-hearts)
      for (const kind of ['dance', 'talk']) { const who = a.moments.filter(m => m.kind === kind).flatMap(m => m.who); expect(new Set(who).size, `${a.name} ${kind}`).toBe(who.length); }
      expect(a.effects.bond.length).toBeGreaterThan(5);
    }
  });
});

// the user, 2026-10-29: "check if the romance is developed enough for secret story cause its a real important part of
// the real show": the couple talks to the host at the prime, and a couple split by the verdict says goodbye
describe('romance on screen', () => {
  const eps = gs.episodeHistory.filter(e => e?.format === 'big-brother');
  const steps = eps.flatMap(e => bbWeekSteps(e, { host: 'Josh' })).flatMap(s => s.steps);
  it('puts the house\'s couple in front of the host at the prime', () => {
    const couples = eps.flatMap(e => (e.acts || []).filter(a => a?.type === 'ss-prime').flatMap(a => a.couples || []));
    if (couples.length) expect(steps.some(st => st.toast?.[0] === 'LOVE IN THE HOUSE')).toBe(true);
  });
  it('says goodbye when the verdict splits a couple', () => {
    for (const e of eps) {
      const prime = (e.acts || []).find(a => a?.type === 'ss-prime');
      const out = (e.acts || []).find(a => a?.ssPublic)?.evicted;
      const split = out && (prime?.couples || []).some(c => c.a === out || c.b === out);
      if (!split) continue;
      const verdict = bbWeekSteps(e, { host: 'Josh' }).find(s => /^bb-ss-prime-verdict/.test(s.id));
      expect(verdict.steps.some(st => st.toast?.[0] === 'THE GOODBYE'), `week ${e.num}`).toBe(true);
    }
  });
});

// the user, 2026-10-29: "the re-entry order isnt based on the percentage to increase suspense (put 2 bff/2 showmance/
// family etc) so they have their moment intense and not spoil"
describe('the verdict', () => {
  const eps = gs.episodeHistory.filter(e => e?.format === 'big-brother');
  it('sends the saved back in an order the votes cannot be read from, and leaves the closest tie for last', () => {
    let unsorted = 0, checked = 0;
    for (const e of eps) {
      const act = (e.acts || []).find(a => a?.ssPublic && (a.ssPublic.mode || 'save') === 'save' && !a.ssPublic.power);
      if (!act || (act.nominees || []).length < 3) continue;
      const v = bbWeekSteps(e, { host: 'Josh' }).find(s => /^bb-ss-prime-verdict/.test(s.id));
      const order = v.steps.filter(st => st.safe).map(st => st.safe);
      const pc = act.ssPublic.percents || {};
      checked++;
      if (order.some((n, i) => i && (pc[order[i - 1]] || 0) < (pc[n] || 0))) unsorted++;
      const mate = ((e.acts || []).find(a => a?.type === 'ss-prime')?.couples || []).map(c => (c.a === act.evicted ? c.b : c.b === act.evicted ? c.a : null)).find(Boolean);
      if (mate && order.includes(mate)) expect(order.at(-1), `week ${e.num}`).toBe(mate);
    }
    expect(checked).toBeGreaterThan(2);
    expect(unsorted).toBeGreaterThan(0);
  });
});
