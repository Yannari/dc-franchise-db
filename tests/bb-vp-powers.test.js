// Powers played and powers never played, as stepped sets (Phase 7). A played power (the Relic,
// the Cloud, the Buy-Off, the Coup d'État) opens on Big Brother naming it and saying what it
// does, then plays the engine's scene: every lobby, every broken promise, the four names, the
// swap. A power never played is a Diary Room note the house never hears. Classic cards go.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ezekiel', 'Priya'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'floater', 'hero'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function seasons(type, eps) {
  const out = [];
  for (const seed of [4242, 77, 31337]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = eps.map(e => ({ episode: e, type }));
    for (let w = 0; w < 12 && !houseIsAtFinale(); w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      if ((ep.acts || []).some(a => a.type === 'power-played' || a.type === 'power-expired')) out.push(JSON.parse(JSON.stringify(ep)));
    }
  }
  return out;
}
const EPS = [...seasons('bb-premiere-mystery', [1]), ...seasons('bb-whacktivity', [2, 3, 4, 5, 6])];
const DRAWN = ['hoh-gatekeeper', 'the-cloud', 'buy-off', 'coup-d-etat'];
const played = () => EPS.flatMap(ep => ep.acts.filter(a => a.type === 'power-played' && DRAWN.includes(a.powerId)).map(act => ({ ep, act })));

describe('powers played and never played, on the stepped stage', () => {
  it('plays the Relic and at least one other power in real seasons', () => {
    const ids = new Set(played().map(x => x.act.powerId));
    expect(ids.has('hoh-gatekeeper')).toBe(true);
    expect(ids.size).toBeGreaterThan(1);
  });

  it('names the power and what it does first, then plays the engine’s scene', () => {
    for (const { ep, act } of played()) {
      const S = bbWeekSteps(ep).find(s => s.kind === 'power' && s.id.includes(act.powerId));
      expect(S.steps[0].t).toContain(act.name);
      expect(S.steps[0].k).toBe('bb');
      if (act.powerId === 'hoh-gatekeeper') {
        expect(S.steps.some(st => st.pwMark === 'relic' && (act.eligible || []).every(n => st.t.includes(n)))).toBe(true);
        expect(act.beats.filter(b => b.part === 'lobby').every(b => b.lines?.length)).toBe(true);
      }
      if (act.powerId === 'buy-off') expect(S.steps.some(st => st.pwMark === 'buyoff' && st.t.includes(act.replacement))).toBe(true);
      if (act.powerId === 'coup-d-etat') expect(S.steps.some(st => st.pwMark === 'coup')).toBe(true);
    }
  });

  it('keeps a power never played to the Diary Room', () => {
    for (const ep of EPS) {
      const act = ep.acts.find(a => a.type === 'power-expired');
      if (!act) continue;
      const S = bbWeekSteps(ep).find(s => s.kind === 'expired');
      expect(S.steps.filter(st => st.expCard).map(st => st.expCard[0])).toEqual(act.beats.map(b => b.players[0]));
      for (const st of S.steps.filter(x => x.by)) expect(st.k).toBe('dr');
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const ep of EPS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'power' && S.kind !== 'expired') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic cards of the powers it draws, and only those', () => {
    for (const id of DRAWN) expect(REPLACED.test(`bb-power-${id}`)).toBe(true);
    expect(REPLACED.test('bb-power-mystery-competitor')).toBe(false);
  });
});
