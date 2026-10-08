// @vitest-environment jsdom
// A double elimination on the stepped stage (js/vp-td-ep/steps.js tdDoubleTribalScreen): announced
// (one vote, the top two go) and the surprise second vote. Two people leave, neither is handed a
// marshmallow first, the second vote's tally starts fresh, and every step paints.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdDoubleTribalScreen } from '../js/vp-td-ep/steps.js';
import { stageHtml } from '../js/vp-td-ep/stage.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const cast = () => NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
const nights = [];
beforeAll(() => {
  const runs = [['hosted-camp', [{ id: 'a', episode: 10, type: 'double-elim' }], 99], ['carnival', [{ id: 'd', episode: 3, type: 'double-boot' }, { id: 'e', episode: 9, type: 'double-boot' }], 7]];
  for (const [setting, twistSchedule, seed] of runs) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting, twistSchedule }, 16, cast()), seed);
    for (const ep of core.gs.episodeHistory) { const scr = tdDoubleTribalScreen(ep, { host: 'Chris', setting }); if (scr) nights.push({ ep: JSON.parse(JSON.stringify(ep)), scr }); }
  }
}, 600000);

describe('double elimination on the stage', () => {
  it('both kinds play', () => {
    expect(nights.some(n => n.ep.announcedDoubleElim)).toBe(true);
    expect(nights.some(n => !n.ep.announcedDoubleElim)).toBe(true);
  });
  it('two people leave, the right two, and neither is handed a marshmallow first', () => {
    for (const { ep, scr } of nights) {
      const outs = scr.steps.filter(s => s.k === 'out').map(s => s.who);
      expect(outs, `ep${ep.num}`).toEqual([ep.firstEliminated, ep.eliminated]);
      const safe = scr.steps.filter(s => s.k === 'safe').map(s => s.who);
      expect(safe.includes(ep.firstEliminated) || (ep.announcedDoubleElim && safe.includes(ep.eliminated)), `ep${ep.num}`).toBe(false);
    }
  });
  it('every step paints, and the tally is the vote being read', () => {
    for (const { ep, scr } of nights) scr.steps.forEach((s, i) => {
      const { L, html } = stageHtml(scr, i, true);
      expect(html.length).toBeGreaterThan(50);
      const rounds = new Set(L.side.filter(x => x.tab === 'tally').map(x => x.round || 0));
      expect(rounds.size, `ep${ep.num} step ${i}`).toBeLessThanOrEqual(2);
    });
  });
});
