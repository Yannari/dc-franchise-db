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

  it('keeps a three-way final on its classic page', () => {
    expect(run({ Duncan: ['Gwen'], Owen: ['Bruno'], Heather: ['Lindsay'] }, 'hosted-camp')).toBeNull();
  });
});
