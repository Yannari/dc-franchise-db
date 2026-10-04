// The Secret Power Competition as a stepped set (Phase 7): Big Brother explains the doors
// first, every door the engine stocked is opened in its order, a won door shows the engine's
// winner and an unclaimed one stays empty, power winners only ever speak in the Diary Room,
// and the classic screen is gone.
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

function spWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-secret-power-comp' }];
    for (let w = 0; w < 2; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'secret-power-comp');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = spWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'spower');

describe('the Secret Power Competition on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(2);
  });

  it('comes after the Head of Household it was hiding in', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const hoh = screens.findIndex(s => s.kind === 'hoh');
      const sp = screens.findIndex(s => s.kind === 'spower');
      if (hoh >= 0) expect(sp).toBeGreaterThan(hoh);
    }
  });

  it('explains the doors first, then opens every door with the engine’s result', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      const opened = S.steps.filter(st => st.spOpen).map(st => st.spOpen);
      expect(opened.map(o => o[0])).toEqual(act.doors.map((_, i) => i));
      expect(opened.map(o => o[1])).toEqual(act.rooms.map(r => r.winner));
    }
  });

  it('lets a power winner speak only in the Diary Room', () => {
    for (const { act } of WEEKS) {
      for (const b of act.beats.filter(x => x.part === 'won')) {
        for (const l of b.lines || []) if (l.by === b.players[0]) expect(l.kind).toBe('dr');
      }
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'spower');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Secret Powers screen', () => {
    expect(REPLACED.test('bb-secret-power')).toBe(true);
  });
});
