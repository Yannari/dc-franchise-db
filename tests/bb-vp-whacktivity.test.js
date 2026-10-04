// The Whacktivity as a stepped set (Phase 7): Big Brother explains the doors first, every
// door shows the engine's entrants, the open door is the engine's, the open door's players are
// heard only after it opens, the winner is the engine's and speaks only in the Diary Room, and
// the classic screen is gone.
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

function whWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3].map(e => ({ episode: e, type: 'bb-whacktivity' }));
    for (let w = 0; w < 3; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'whacktivity');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = whWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'whack');

describe('the Whacktivity on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(4);
  });

  it('explains the doors first, shows every door’s pickers, and opens the engine’s door', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.steps.filter(st => st.whPick != null).map(st => st.whPick)).toEqual(act.rooms.map((_, i) => i));
      expect(S.whack.rooms.map(r => r.entrants)).toEqual(act.rooms.map(r => r.entrants.slice(0, 5)));
      const open = act.rooms.findIndex(r => r.powerId === act.openId);
      expect(S.steps.filter(st => st.whOpen != null).map(st => st.whOpen)).toEqual(open >= 0 ? [open] : []);
    }
  });

  it('does not let the open door’s players speak before it opens', () => {
    for (const { ep } of WEEKS) {
      const S = screenOf(ep);
      const opened = S.steps.findIndex(st => st.whOpen != null);
      if (opened < 0) continue;
      expect(S.steps.slice(0, opened).some(st => st.by)).toBe(false);
    }
  });

  it('crowns the engine’s winner, who speaks only in the Diary Room', () => {
    for (const { ep, act } of WEEKS) {
      const winner = act.rooms.find(r => r.opened)?.winner || null;
      const S = screenOf(ep);
      expect(S.steps.find(st => st.whWin)?.whWin || null).toBe(winner);
      const won = act.beats.find(b => b.part === 'won');
      for (const l of won?.lines || []) if (l.by === winner) expect(l.kind).toBe('dr');
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'whack');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Whacktivity screen', () => {
    expect(REPLACED.test('bb-whacktivity')).toBe(true);
  });
});
