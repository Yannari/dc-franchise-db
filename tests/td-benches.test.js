// @vitest-environment jsdom
// A challenge finale's benches on the stepped stage (vp-td-ep/finale.js tdBenchesScreen): everybody voted off walks
// over to the finalist they want to win, one at a time, under a sign with that finalist's face.
import { describe, it, expect } from 'vitest';
import { tdBenchesScreen } from '../js/vp-td-ep/finale.js';
import { stageHtml } from '../js/vp-td-ep/stage.js';

const left = ['Aubrey', 'Courtney', 'Julia', 'Leshawna', 'Gabby', 'Bowie', 'Gwen', 'Lindsay', 'Ann', 'Bea', 'Cal', 'Dee', 'Eli', 'Fay'];
const right = ['Millie', 'Bruno'];
const ep = (A, venue = 'hosted-camp') => ({
  num: 13, isFinale: true, benchAssignments: A,
  benchReasons: Object.fromEntries(Object.entries(A).flatMap(([f, ns]) => ns.map(n => [n, { finalist: f, reason: `I want ${f} to win.`, bond: 1 }]))),
  gsSnapshot: { bonds: { 'Bowie||Owen': 4, 'Duncan||Trent': 5 } }, _venue: venue,
});
const run = (A, venue) => tdBenchesScreen(ep(A, venue), { host: 'Chris', setting: venue });

describe('the benches', () => {
  it('puts both faces on the signs, and nobody on the bleachers before they walk over', () => {
    const scr = run({ Duncan: left, Owen: right }, 'hosted-camp');
    expect(scr?.id).toBe('benches');
    const start = stageHtml(scr, 1);
    expect(start.html).toContain('tdx-sign face');
    expect(start.html).toContain('duncan');
    expect(start.toks.map(t => t.n).sort()).toEqual(['Chris', 'Duncan', 'Owen']);
    // each walks on at their own step, once, and stays
    const sc = scr.steps[0];
    for (const n of [...left, ...right]) {
      const at = sc.arrives[n];
      expect(scr.steps[at]?.act?.who).toEqual([n]);
      expect(stageHtml(scr, at - 1).toks.some(t => t.n === n)).toBe(false);
      expect(stageHtml(scr, at).toks.some(t => t.n === n)).toBe(true);
    }
  });

  it('seats each side on its own bleachers, and the rest stand in front of them', () => {
    const scr = run({ Duncan: left, Owen: right }, 'hosted-camp');
    const P = scr.steps[0].places;
    for (const n of right) expect(P[n].u).toBeGreaterThan(.5);
    for (const n of left) expect(P[n].u).toBeLessThan(.5);
    expect(left.filter(n => P[n].sit).length).toBe(12);
    expect(left.filter(n => P[n].crowd).length).toBe(2);
  });

  it('says the count, and never the same way of walking over twice while there are others left', () => {
    const scr = run({ Duncan: left, Owen: right }, 'hosted-camp');
    const text = scr.steps.map(s => s.text || '').join('\n');
    expect(text).toContain('Duncan: fourteen. Owen: two.');
    const beats = scr.steps.filter(s => s.k === 'beat').map(s => s.text.replace(/\b[A-Z][a-z]+\b/g, 'X'));
    expect(new Set(beats.slice(0, 4)).size).toBe(4);
  });

  it('plays on each venue\'s own bleachers, and on the camp\'s where a venue has none', () => {
    for (const v of ['survival-island', 'carnival', 'film-lot', 'world-tour', 'hosted-camp']) {
      const sc = run({ Duncan: left, Owen: right }, v).steps[0];
      expect(sc.plate).toBe(`${v}/benches-day`);
      expect(sc.signs.map(s => s.face)).toEqual(['Duncan', 'Owen']);
      expect(left.filter(n => sc.places[n].sit).length).toBeGreaterThanOrEqual(10);
    }
    expect(run({ Duncan: left, Owen: right }, 'redemption').steps[0].plate).toBe('hosted-camp/benches-day');
  });

  // (the user, 2026-10-19: "the benches finale section in the stepped viewer don't have the assistant choice section")
  it('plays the assistant pick: each finalist takes one off their bench, who comes down to stand with them', () => {
    const e = ep({ Duncan: left, Owen: right }, 'hosted-camp');
    e.assistants = { Duncan: { name: 'Gwen', heartPick: 'Gwen', brainPick: 'Bowie', decision: 'heart', bond: 4 }, Owen: { name: 'Bruno', heartPick: 'Millie', brainPick: 'Bruno', decision: 'agonized', bond: 1 } };
    const scr = tdBenchesScreen(e, { host: 'Chris', setting: 'hosted-camp' });
    const text = scr.steps.map(s => s.text || s.name || '').join('\n');
    expect(text).toContain('Pick an Assistant');
    expect(text).toContain('Gwen climbs down from the bleachers and stands next to Duncan.');
    expect(text).toContain('Bruno climbs down from the bleachers and stands next to Owen.');
    expect(text).toContain('Owen looks from Millie to Bruno');
    expect(text).toContain('Duncan and Gwen and Owen and Bruno');
    // standing beside them on the last shot, off the bleachers
    const last = scr.steps.filter(s => s.k === 'scene').pop().places;
    expect(last.Gwen.sit).toBeFalsy();
    expect(Math.abs(last.Gwen.u - last.Duncan.u)).toBeLessThan(.1);
    // a finalist with nobody on the bench goes alone
    e.assistants = { Duncan: { name: 'Gwen', heartPick: 'Gwen', brainPick: 'Gwen', decision: 'unanimous', bond: 4 }, Owen: null };
    expect(tdBenchesScreen(e, { host: 'Chris', setting: 'hosted-camp' }).steps.map(s => s.text || '').join('\n')).toContain("Owen, nobody's sitting behind you.");
  });

  it('keeps a three-way final on its classic page', () => {
    expect(run({ Duncan: ['Gwen'], Owen: ['Bruno'], Heather: ['Lindsay'] }, 'hosted-camp')).toBeNull();
  });
});
