// @vitest-environment jsdom
// The ambassadors argue with reasons, reach a conclusion, and the camp hears it, fights about it and says goodbye (the
// user, 2026-10-17: "the ambassadors should have a better debate with actual reasonings and a conclusion, when they
// announce the eliminated with reactions, maybe drama, and goodbye").
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdAmbassadorsScreen } from '../js/vp-td-ep/twists-more.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const NAMES = ['Gwen', 'Leshawna', 'Heather', 'Duncan', 'Courtney', 'Owen', 'Lindsay', 'Trent', 'Julia', 'Millie', 'Aubrey', 'Lake', 'Gabby', 'Bowie', 'Yul', 'Bruno'];

describe('the ambassadors', () => {
  it('give reasons, settle it, and the camp says goodbye', () => {
    const seen = { agreed: 0, rocks: 0 };
    for (const seed of [1, 2, 3, 5]) {
      seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp', twistSchedule: [{ episode: 4, type: 'ambassadors', id: 'a1' }] }, 16,
        NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }))), seed);
      window.gs = core.gs; globalThis.gs = core.gs;
      const ep = core.gs.episodeHistory.find(e => e.ambassadorData?.ambassadorMeeting);
      expect(ep, `seed ${seed}: no meeting`).toBeTruthy();
      const m = ep.ambassadorData.ambassadorMeeting;
      const steps = tdAmbassadorsScreen(ep, { host: 'Chris' }).steps;
      const said = steps.filter(s => s.k === 'say' || s.k === 'conf').map(s => s.text);
      // a reason, asked for and given
      expect(said.some(t => /^Why \w+\?$/.test(t)), `seed ${seed}: nobody asks why`).toBe(true);
      // nobody says the same sentence twice in one meeting
      expect(said.filter((t, i) => said.indexOf(t) !== i)).toEqual([]);
      for (const s of steps) expect(/[{}]|undefined|null/.test(s.text || ''), s.text).toBe(false);
      const camp = steps.slice(steps.findIndex(s => s.k === 'scene' && /Late afternoon/.test(s.time || '')));
      expect(camp.length, `seed ${seed}: the news never reaches camp`).toBeGreaterThan(2);
      expect(camp.some(s => s.k === 'out' && s.who === m.eliminated)).toBe(true);
      if (m.agreed) {
        seen.agreed++;
        // the goodbye: the one leaving says it to the team
        expect(camp.some(s => s.k === 'say' && s.by === m.eliminated)).toBe(true);
      } else {
        seen.rocks++;
        expect(camp.some(s => s.host && /black rock/.test(s.text))).toBe(true);
      }
    }
    expect(seen.agreed).toBeGreaterThan(0);
    expect(seen.rocks).toBeGreaterThan(0);
  }, 900000);
});
