// The Mystery Veto and its second ceremony as stepped sets (Phase 7): the holder's run is
// scored against the engine's par on the meter and ends on the engine's result; the ceremony
// takes down and seats exactly who the engine did; the classic screens are gone. (The Mystery
// Competitor needs franchise alumni to fire, and is covered by bb-secret-power-comp.)
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ezekiel', 'Priya'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'floater', 'hero'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function mvWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-secret-power-comp' }];
    for (let w = 0; w < 8; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'mystery-veto');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act, cer: (ep.acts || []).find(a => a.type === 'second-veto-ceremony') });
    }
  }
  return out;
}
const WEEKS = mvWeeks();
const screenOf = (ep, id) => bbWeekSteps(ep).find(s => s.id.startsWith(id));

describe('the Mystery Veto on the stepped stage', () => {
  it('plays in real seasons, won at least once', () => {
    expect(WEEKS.length).toBeGreaterThan(1);
    expect(WEEKS.some(w => w.act.won)).toBe(true);
  });

  it('scores the holder against the engine’s par and ends on the engine’s result', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep, 'bb-mysteryveto');
      expect(S.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3]);
      expect(S.capsule.target).toBe(act.competition.par);
      expect(S.steps.find(st => st.capEnd).capEnd).toBe(act.won ? 'won' : 'lost');
    }
  });

  it('takes down and seats exactly who the engine did at the second ceremony', () => {
    for (const { ep, cer } of WEEKS.filter(w => w.cer)) {
      const S = screenOf(ep, 'bb-veto2b');
      expect(S.steps.find(st => st.v2Save)?.v2Save).toBe(cer.removed[0]);
      expect(S.steps.find(st => st.v2Rep)?.v2Rep || null).toBe(cer.seated[0] || null);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (!/^bb-(mysteryveto|veto2b)/.test(S.id)) return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic Mystery Veto and Mystery Competitor screens', () => {
    for (const id of ['bb-power-mystery-veto', 'bb-power-mystery-competitor', 'bb-veto2']) expect(REPLACED.test(id)).toBe(true);
  });
});
