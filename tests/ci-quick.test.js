// ci-quick.test.js — Quick Setup on a Circle season (Plan 4 Task 4). Quick is
// the default view: it must be able to start a Circle season, judge the cast
// by the Circle's rules (no tribes, no merge, no jury) and say so in the
// Circle's words — the same rule the run loop refuses by (js/ci-run.js).
import { describe, expect, it } from 'vitest';
import { validateQuickSetup, blueprintFor } from '../js/quick-setup.js';
import { circleCastProblem, circleShapeOf } from '../js/ci-run.js';
import { makePlayers } from './helpers/ci-cast.js';

const circle = (extra = {}) => ({ format: 'the-circle', teams: 2, mergeAt: 12, jurySize: 9, finaleSize: 3, ...extra });

describe('the ready check', () => {
  it('a cast of thirteen with no tribes is ready, and Start is not blocked', () => {
    const rows = validateQuickSetup(circle(), makePlayers(13));
    expect(rows.filter(r => !r.ok)).toEqual([]);
    const said = rows.map(r => r.msg).join(' ');
    expect(said).not.toMatch(/tribe|merge|jury|Final 3/i);
  });

  it('refuses a cast too small for its finalists, in the words the run loop uses', () => {
    const cast = makePlayers(5);
    const rows = validateQuickSetup(circle(), cast);
    const bad = rows.filter(r => !r.ok);
    expect(bad).toHaveLength(1);
    expect(bad[0].msg).toContain(circleCastProblem(cast.map(p => p.name), {}, 5));
  });

  it('four finalists let a smaller cast start', () => {
    const cast = makePlayers(5);
    expect(validateQuickSetup(circle({ ciFinalists: 4 }), cast).filter(r => !r.ok)).toEqual([]);
  });
});

describe('a card booked where the engine cannot run it', () => {
  // The engine drops it without a word (js/ci/timeline.js), so the ready
  // check says so: a warning, never a block.
  const shape = circleShapeOf({ cast: makePlayers(13).map(p => p.name) });
  const noBlock = shape.find(d => !d.block && !d.final && !d.finale).day;
  const noArrival = shape.find(d => d.block && !d.arrivals).day;
  const blocking = shape.find(d => d.block).day;
  const warns = sched => validateQuickSetup(circle({ twistSchedule: sched }), makePlayers(13)).filter(r => r.warn);

  it('a blocking format on a day with no ratings', () => {
    const w = warns([{ type: 'ci-sole-influencer', episode: noBlock }]);
    expect(w).toHaveLength(1);
    expect(w[0].msg).toMatch(new RegExp(`Sole Influencer.*episode ${noBlock}.*no ratings`));
  });

  it('an arrival on a day nobody arrives', () => {
    const w = warns([{ type: 'ci-arrive-invites', episode: noArrival }]);
    expect(w).toHaveLength(1);
    expect(w[0].msg).toMatch(/no newcomer/);
  });

  it('nothing to say when each card is on a day it can run', () => {
    expect(warns([{ type: 'ci-sole-influencer', episode: blocking }])).toEqual([]);
  });

  it('it never blocks the start', () => {
    const rows = validateQuickSetup(circle({ twistSchedule: [{ type: 'ci-sole-influencer', episode: noBlock }] }), makePlayers(13));
    expect(rows.every(r => r.ok)).toBe(true);
  });
});

describe('the blueprint', () => {
  it('draws the Circle: players, days, finalists — the days the season will play', () => {
    const cast = makePlayers(13);
    const labels = blueprintFor(circle(), cast.length).map(s => s.label);
    const days = circleShapeOf({ cast: cast.map(p => p.name) }).length;
    expect(labels).toEqual(['13 players', `${days} days`, 'final 5, rated by the players']);
    expect(blueprintFor(circle({ ciDays: 14, ciFinalists: 4 }), 13).map(s => s.label))
      .toEqual(['13 players', '14 days', 'final 4, rated by the players']);
  });

  it('marks a cast that cannot start, and says why', () => {
    const segs = blueprintFor(circle(), 5);
    expect(segs[0].ok).toBe(false);
    expect(segs[0].why).toMatch(/finalists/);
  });
});

import { renderQuickSetup, qsSetIdentity } from '../js/quick-setup.js';
describe("the Structure card asks the Circle's own questions", () => {
  function page() {
    document.body.innerHTML = `
      <div id="tab-setup" class="tab-content active">
        <div class="setup-panel active-panel" id="setup-panel-basics">LEGACY</div>
        <input id="cfg-name" value="Test Season"><input id="cfg-season-number" value="7">
        <select id="cfg-format"><option value="the-circle" selected>Circle</option></select>
        <select id="cfg-host"><option value="Michelle">Michelle</option></select>
        <input id="cfg-teams" type="range" min="1" max="6" value="2">
        <input id="cfg-merge" type="range" min="4" max="22" value="12">
        <input id="cfg-jury" type="range" min="3" max="15" value="7">
        <input id="cfg-finale" type="range" min="2" max="4" value="3">
        <select id="cfg-finale-format"><option value="traditional">Trad</option></select>
        <input id="cfg-days" value="39">
        <input id="cfg-ci-days" type="number" value="">
        <select id="cfg-ci-finalists"><option value="5">5</option><option value="4">4</option></select>
      </div>`;
    window._qsMode = undefined; window._qsPreset = undefined; window._quickSetupDisabled = false;
    window.seasonConfig = { format: 'the-circle', teams: 2, mergeAt: 12, jurySize: 7, finaleSize: 3, twistSchedule: [] };
    window.players = makePlayers(13);
    window.gs = null;
    window.saveConfig = () => {};
    renderQuickSetup();
  }

  it('no tribes, merge, jury or Final N; days and finalists instead', () => {
    page();
    const card = [...document.querySelectorAll('.qs-card')].find(c => /Structure/.test(c.textContent));
    expect(card.querySelectorAll('.qs-steppers > *')).toHaveLength(0);
    expect(card.textContent).not.toMatch(/tribe|Merge|jury|Finale format/i);
    expect(card.querySelector('#qs-ci-days')).toBeTruthy();
    expect(card.querySelector('#qs-ci-finalists')).toBeTruthy();
    expect(document.getElementById('qs-readycheck').textContent).not.toMatch(/tribe/i);
    expect(document.getElementById('qs-start-btn').disabled).toBe(false);
  });

  it('what is typed there is what the Advanced page holds', () => {
    page();
    document.getElementById('qs-ci-days').value = '14';
    qsSetIdentity('cfg-ci-days', 'qs-ci-days');
    expect(document.getElementById('cfg-ci-days').value).toBe('14');
    document.getElementById('qs-ci-finalists').value = '4';
    qsSetIdentity('cfg-ci-finalists', 'qs-ci-finalists');
    expect(document.getElementById('cfg-ci-finalists').value).toBe('4');
  });
});
