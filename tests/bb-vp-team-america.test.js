// Team America as a stepped set (Phase 7): Big Brother explains the team to the team in the
// first week only, every mission card is the engine's mission with the engine's result, what a
// completed mission did plays as a scene among the people it happened to, and the team only
// talks about the team in the Diary Room. The classic screen is gone.
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

function taWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3, 4, 5, 6].map(e => ({ episode: e, type: 'bb-team-america' }));
    for (let w = 0; w < 7; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'team-america');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = taWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'team');

describe('Team America on the stepped stage', () => {
  it('plays missions both completed and failed', () => {
    expect(WEEKS.some(w => w.act.mission.done)).toBe(true);
    expect(WEEKS.some(w => !w.act.mission.done)).toBe(true);
  });

  it('explains the team only in its first week, and shows the engine’s mission and result', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      const rules = S.steps.filter(st => st.rule != null).map(st => st.rule);
      expect(rules).toEqual(act.missionNumber === 1 ? [1, 2, 3, 4] : []);
      expect(S.steps.find(st => st.taMission).t).toContain(act.mission.ask);
      expect(S.steps.find(st => st.taDone).taDone).toBe(act.mission.done ? 'done' : 'failed');
    }
  });

  it('plays a completed mission’s effect, and keeps the team to the Diary Room about the team', () => {
    for (const { act } of WEEKS) {
      if (act.mission.done && act.mission.effect) expect(act.beats.find(b => b.part === 'effect')?.lines?.length).toBeGreaterThan(0);
      for (const b of act.beats.filter(x => ['opening', 'mission', 'done', 'failed'].includes(x.part))) {
        for (const l of b.lines || []) expect(l.kind).toBe('dr');
      }
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'team');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Team America screen', () => {
    expect(REPLACED.test('bb-teamamerica')).toBe(true);
  });
});
