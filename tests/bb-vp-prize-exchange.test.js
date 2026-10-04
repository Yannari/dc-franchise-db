// Prizes and Punishments as a stepped set (Phase 7): the race says it only set the pick
// order, Big Brother explains the boxes, every box opens and every swap moves what the
// engine moved, the table ends with the veto in the holder's hands, and the classic board
// is gone.
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

function pxWeeks() {
  const weeks = [];
  for (const seed of [4242, 77, 31337]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [1, 2].map(e => ({ episode: e, type: 'bb-prizes-and-punishments' }));
    for (let w = 0; w < 2; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'prize-exchange');
      if (act) weeks.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return weeks;
}
const WEEKS = pxWeeks();

describe('Prizes and Punishments on the stepped stage', () => {
  it('plays in real seasons, with a swap at least once', () => {
    expect(WEEKS.length).toBeGreaterThan(2);
    expect(WEEKS.some(w => w.act.steals.length)).toBe(true);
  });

  it('explains the boxes first', () => {
    for (const { ep } of WEEKS) {
      const S = bbWeekSteps(ep).find(s => s.kind === 'px');
      expect(S.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3, 4]);
    }
  });

  it('opens every box and makes every swap the engine made, and the veto ends with its holder', () => {
    for (const { ep, act } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'px');
      const S = screens[si];
      expect(S.steps.filter(st => st.open).map(st => st.open[0])).toEqual(act.beats.filter(b => b.part === 'open').map(b => b.players[0]));
      expect(S.steps.filter(st => st.swap).map(st => [st.swap[0], st.swap[1]])).toEqual(act.steals.map(x => [x.thief, x.victim]));
      const end = stageHtml(screens, si, S.steps.length - 1, false, { season: 'default', host: 'Valeria' }).ledger;
      for (const h of act.held) expect(end.boxes[h.boxNo]?.holder).toBe(h.name);
      expect(end.veto).toBe(act.vetoHolder);
    }
  });

  it('does not crown the race winner with the veto', () => {
    for (const { ep, act } of WEEKS) {
      const race = bbWeekSteps(ep).find(s => s.kind === 'veto');
      if (!race) continue;
      expect(race.steps.some(st => st.veto)).toBe(false);
      expect(race.steps.some(st => /picks last/.test(st.t))).toBe(true);
      void act;
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'px');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic exchange board', () => {
    expect(REPLACED.test('bb-prizeexchange')).toBe(true);
  });
});
