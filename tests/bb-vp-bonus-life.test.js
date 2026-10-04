// The Bonus Life as stepped sets (Phase 7): played (or gone off at the end of its window), Big
// Brother explains it and the evictee plays alone against the engine's standard on a meter that
// ends on the engine's result; kept in a pocket, it is a Diary Room note the house never hears;
// and never played at all, a whole night of expiring powers stays readable (lines for the first
// three, the engine's own caption for the rest). Classic Bonus Life screen gone.
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

function blWeeks() {
  const out = [];
  for (const seed of [1, 2, 3, 5, 8]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3, 4, 5, 6].map(e => ({ episode: e, type: 'bb-app-store' }));
    for (let w = 0; w < 12 && !houseIsAtFinale(); w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      if ((ep.acts || []).some(a => a.type === 'bonus-life' || a.type === 'power-expired')) out.push(JSON.parse(JSON.stringify(ep)));
    }
  }
  return out;
}
const EPS = blWeeks();
const acts = type => EPS.flatMap(ep => ep.acts.filter(a => a.type === type).map(act => ({ ep, act })));

describe('the Bonus Life on the stepped stage', () => {
  it('plays fired and kept in real seasons', () => {
    expect(acts('bonus-life').some(x => x.act.fired)).toBe(true);
    expect(acts('bonus-life').some(x => !x.act.fired)).toBe(true);
  });

  it('explains it, scores the engine’s run against the engine’s standard, and ends on the engine’s result', () => {
    for (const { ep, act } of acts('bonus-life').filter(x => x.act.fired)) {
      const S = bbWeekSteps(ep).find(s => s.kind === 'bonuslife');
      expect(S.steps.slice(0, 3).map(st => st.rule)).toEqual([1, 2, 3]);
      expect(S.steps.find(st => st.capStage).capStage[2]).toBe(act.competition.score);
      expect(S.steps.find(st => st.capEnd).capEnd).toBe(act.competition.won ? 'won' : 'lost');
    }
  });

  it('keeps a pocketed Bonus Life to the Diary Room', () => {
    for (const { ep } of acts('bonus-life').filter(x => !x.act.fired)) {
      const S = bbWeekSteps(ep).find(s => s.id.startsWith('bb-bonuslife'));
      for (const st of S.steps.filter(x => x.by)) expect(st.k).toBe('dr');
    }
  });

  it('gives lines to the first three expiring powers and the engine’s caption to the rest', () => {
    for (const { act } of acts('power-expired')) {
      act.beats.forEach((b, i) => expect(!!b.lines).toBe(i < 3));
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const ep of EPS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'bonuslife' && S.kind !== 'expired') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic Bonus Life screen', () => {
    expect(REPLACED.test('bb-bonuslife')).toBe(true);
  });
});
