// The Interrogation and the Deepfake as stepped sets (Phase 7): the Interrogation explains
// itself first, every room the engine showed is questioned in order, the tally counts the
// names the engine recorded, the verdict is the engine's; the Deepfake is never announced by
// Big Brother and only its taker speaks, in the Diary Room; the classic screens are gone.
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

function intWeeks(seeds = [4242, 77, 31337, 9001, 8080]) {
  const out = [];
  for (const seed of seeds) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3, 4, 5, 6].map(e => ({ episode: e, type: 'bb-app-store' }));
    for (let w = 0; w < 8; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'interrogation');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = intWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'interro');

describe('the Interrogation and the Deepfake on the stepped stage', () => {
  it('plays both in real seasons', () => {
    expect(WEEKS.some(w => !w.act.creditsDeposed)).toBe(true);
    expect(WEEKS.some(w => w.act.creditsDeposed)).toBe(true);
  });

  it('explains the Interrogation first, questions every room in order, and gives the engine’s verdict', () => {
    for (const { ep, act } of WEEKS.filter(w => !w.act.creditsDeposed)) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      const rooms = act.beats.filter(b => b.part === 'room');
      expect(S.steps.filter(st => st.intRoom).map(st => st.intRoom)).toEqual(rooms.map(b => b.players[0]));
      expect(S.steps.filter(st => st.intPoint).map(st => st.intPoint))
        .toEqual(rooms.filter(b => b.points && b.kind !== 'silent').map(b => b.points));
      expect(S.steps.filter(st => st.intEnd).map(st => st.intEnd)).toEqual([act.caught ? 'caught' : 'wrong']);
    }
  });

  it('keeps the Deepfake secret: no Big Brother announcement, only the taker in the Diary Room', () => {
    for (const { ep, act } of WEEKS.filter(w => w.act.creditsDeposed)) {
      const S = screenOf(ep);
      expect(S.steps.some(st => st.k === 'bb')).toBe(false);
      for (const st of S.steps.filter(x => x.by)) { expect(st.by).toBe(act.holder); expect(st.k).toBe('dr'); }
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'interro');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic power screens for both', () => {
    expect(REPLACED.test('bb-power-hoh-interrogation')).toBe(true);
    expect(REPLACED.test('bb-power-deepfake-hoh')).toBe(true);
    expect(REPLACED.test('bb-power-halting-hex')).toBe(false);
  });
});

// The user, 2026-10-26: a house-life scene with Nina's photos in the HOH room aired before the Interrogation that
// made Nina HOH ("like i already know nina took over michele hoh"), and "the badge should change too after the
// takeover but michele still has the hoh badge".
describe('a crown that changed hands', () => {
  const HOH_SET = /^st:(m|x)?sh\./;
  const owns = (sc, n) => (sc.lines || []).some(l => l.text.includes(`${n}'s`) || l.text.includes(`${n}’s`));

  it('moves the badge to the taker when the deposed HOH names the wrong person, and in the Deepfake', () => {
    for (const { ep, act } of WEEKS.filter(w => !w.act.caught)) {
      expect(screenOf(ep).steps.some(st => st.hoh === act.holder), `week ${ep.num}`).toBe(true);
    }
  });

  it('opens the new HOH room only after the Interrogation has aired', () => {
    // more seasons than the rest of the file needs: the HOH room has to come up in a takeover week
    const taken = [...WEEKS, ...intWeeks([5, 12, 19, 27, 33, 41, 58, 64])].filter(w => !w.act.caught && !w.act.creditsDeposed);
    expect(taken.length).toBeGreaterThan(0);
    for (const { ep, act } of taken) {
      // the order the viewer plays it in, not the order of the acts
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(x => x.kind === 'interro');
      const mine = new RegExp(`${act.holder}['’]s (photo|letter|bed|room|snacks)|${act.holder} (is|as) (the )?(HOH|Head of Household)`);
      for (const scr of screens.slice(0, si)) for (const st of scr.steps || []) {
        expect(mine.test(String(st.t || '')), `week ${ep.num} ${scr.id}: ${st.t}`).toBe(false);
      }
    }
  });

  it('never shows the house the Deepfake: its HOH room is the one the house believes in', () => {
    for (const { ep, act } of WEEKS.filter(w => w.act.creditsDeposed && !w.act.caught)) {
      for (const sc of ep.acts.flatMap(a => a.scenes || []).filter(x => HOH_SET.test(String(x.lineId)))) {
        expect(owns(sc, act.holder), `week ${ep.num} ${sc.lineId}`).toBe(false);
      }
    }
  });
});
