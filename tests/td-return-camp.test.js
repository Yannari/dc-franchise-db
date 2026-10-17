// @vitest-environment jsdom
// The one who comes back is seen walking back into camp, and the camp reacts (the user, 2026-10-17: "the RI return at the
// camp should have dialogue, reactions, drama ... in the stepped viewer"); with one person left out there, there is no
// challenge, they just return ("when there's only 1 for the last duel no need to do it, just let them return").
import { describe, it, expect } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdReturnScreen } from '../js/vp-td-ep/returns.js';

const play = (cfg, seed) => { seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp', ri: true, twistSchedule: [], ...cfg }, 16), seed); window.gs = core.gs; globalThis.gs = core.gs; };
const returnEp = () => core.gs.episodeHistory.find(e => e.riReentry?.winner);

describe('coming back from the island', () => {
  it('walks back into camp, and the camp talks about it', () => {
    let checked = 0;
    for (const [fmt, seed] of [['redemption', 31], ['rescue', 32], ['redemption', 33]]) {
      play({ riFormat: fmt, riReentryAt: 9 }, seed);
      const ep = returnEp();
      if (!ep) continue;
      const scr = tdReturnScreen(ep, { host: 'Chris' });
      expect(scr, `${fmt} seed ${seed}: no return screen`).toBeTruthy();
      const at = scr.steps.findIndex(s => s.k === 'scene' && s.place !== 'The Return');
      expect(at, `${fmt} seed ${seed}: never goes back to camp`).toBeGreaterThan(0);
      const camp = scr.steps.slice(at);
      const back = ep.riReentry.winners?.length ? ep.riReentry.winners : [ep.riReentry.winner];
      expect(camp.some(s => s.k === 'beat' && back.some(w => s.text.includes(`${w} walks back into camp`)))).toBe(true);
      // somebody at camp speaks, and the returnee tells the camera
      expect(camp.filter(s => (s.k === 'say' || s.k === 'conf') && !back.includes(s.by)).length + camp.filter(s => s.k === 'conf' && back.includes(s.by)).length).toBeGreaterThan(1);
      for (const s of camp) expect(/[{}]|undefined|null/.test(s.text || ''), s.text).toBe(false);
      checked++;
    }
    expect(checked).toBeGreaterThan(1);
  }, 600000);

  it('lets the last one out there walk back in without a challenge', () => {
    let walked = 0;
    for (const seed of [41, 42, 43, 44]) {
      // a return set late enough that only one is left on Redemption by then
      play({ riFormat: 'redemption', riReentryAt: 6 }, seed);
      const ep = returnEp();
      if (!ep?.riReentry?.walkIn) continue;
      walked++;
      expect(ep.riReentry.losers).toEqual([]);
      const scr = tdReturnScreen(ep, { host: 'Chris' });
      expect(scr.steps.some(s => s.k === 'title' && /return challenge|Round|Stage/i.test(`${s.kicker} ${s.name}`))).toBe(false);
      expect(scr.steps.some(s => s.host && /nobody left to beat/.test(s.text))).toBe(true);
    }
    expect(walked).toBeGreaterThan(0);
  }, 600000);
});
