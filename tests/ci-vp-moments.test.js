// @vitest-environment jsdom
// ci-vp-moments.test.js — the big moments on their own sets (Plan 5, spec 18.3).
// Played on a real season: nothing is drawn before its line.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { stageInner } from '../js/vp-ci/stage.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const cast = rosterCast(13, 4); setPlayers(cast);
const names = cast.map(p => p.name);
const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });
const all = rows.flatMap(row => circleScreens(row).map(screen => ({ row, screen })));
const of = kind => all.filter(x => x.screen.kind === kind);
const dom = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };
const at = ({ row, screen }, i, fresh = false) => dom(stageInner(row, screen, i, fresh));
const firstIdx = (screen, re) => screen.steps.findIndex(x => re.test(x.key || ''));

describe('each big moment has its own set', () => {
  it('the kinds map to their stages', () => {
    const want = { ratings: 'rate', 'final-ratings': 'rate', hangout: 'hangout', blocking: 'blocked', visit: 'room', meet: 'room', goodbye: 'video', reveal: 'studio' };
    for (const [k, stage] of Object.entries(want)) {
      expect(of(k).length, k).toBeGreaterThan(0);
      for (const x of of(k)) expect(x.screen.stage).toBe(stage);
    }
  });
  it('every step of every screen draws, start to end', () => {
    for (const x of all) for (let i = -1; i < x.screen.steps.length; i++) expect(() => stageInner(x.row, x.screen, i, true)).not.toThrow();
  });
});

describe('the Ratings', () => {
  it('a voter fills their slots one line at a time, and the list goes SENT', () => {
    for (const x of of('ratings')) {
      const rateAt = firstIdx(x.screen, /^rate\./);
      const d = at(x, rateAt, true);
      expect(d.querySelectorAll('.civ-slot.open')).toHaveLength(1);
      expect(d.querySelector('.civ-slot.now')).not.toBeNull();
      const voter = x.screen.steps[rateAt].who;
      const doneAt = x.screen.steps.findIndex(s => s.key === 'ratings.done');
      if (doneAt >= 0) expect(at(x, doneAt).querySelector('.civ-stamp')).not.toBeNull();
      expect(voter).toBeTruthy();
    }
  });
  it('the board opens from the bottom and crowns the Influencers only when they are read', () => {
    for (const x of of('ratings')) {
      const resAt = firstIdx(x.screen, /^result\./);
      // A secret night shows only who the Influencers are (result.secret / .super), no board to read.
      if (resAt < 0 || /^result\.(secret|super)$/.test(x.screen.steps[resAt].key)) continue;
      expect(at(x, resAt - 1).querySelectorAll('.civ-board .civ-slot.open')).toHaveLength(0);
      const first = at(x, resAt).querySelector('.civ-slot.open b').textContent;
      const places = x.screen.d.results.map(r => r.place);
      expect(Number(first)).toBe(Math.max(...places.filter(p => p > 2)) || Math.max(...places));
      expect(at(x, resAt).querySelector('.civ-slot.crown')).toBeNull();
      const end = at(x, x.screen.steps.length - 1);
      expect(end.querySelectorAll('.civ-slot.crown').length).toBe(x.screen.d.influencers.length);
    }
  });
});

describe('the blocking', () => {
  it('nobody is blocked on screen until the name is sent; then the tile goes dark with BLOCKED', () => {
    for (const x of of('blocking')) {
      // The slam lands on the message that names them (an aside said aloud
      // before it is still the waiting).
      const NAMED = /^(block\.announce\.|vote\.result|block\.inperson\.tell)/;
      const sent = x.screen.steps.findIndex(s => NAMED.test(s.key || '') && s.part === 'send');
      const named = sent >= 0 ? sent : firstIdx(x.screen, NAMED);
      expect(named, x.screen.steps.map(s => s.key).join(',')).toBeGreaterThanOrEqual(0);
      if (named > 0) expect(at(x, named - 1).querySelector('.civ-mtile.out')).toBeNull();
      const d = at(x, named, true);
      expect(d.querySelector('.civ-slam').textContent).toMatch(/BLOCKED/);
      expect(d.querySelector('.civ-mtile.out').dataset.h).toBe(x.screen.d.target);
      expect(at(x, x.screen.steps.length - 1).querySelector('.civ-slam')).toBeNull();   // the slam is the moment, not the rest of the scene
    }
  });
});

describe('the Hangout', () => {
  it('the names at risk sit between the Influencers; each is kept or cut as they talk', () => {
    for (const x of of('hangout')) {
      const d0 = at(x, -1);
      expect(d0.querySelectorAll('.civ-atrisk .civ-mtile')).toHaveLength(x.screen.d.atRisk.length);
      const cutAt = firstIdx(x.screen, /view\.\w+\.cut$/);
      if (cutAt < 0) continue;
      expect(at(x, cutAt - 1).querySelector('.civ-mtile.cut')).toBeNull();
      // Two names go on the table, the one they block and the runner-up:
      // the debate does not give the answer away.
      const onTable = [x.screen.d.target, x.screen.d.runnerUp].filter(Boolean);
      expect(onTable).toContain(at(x, cutAt).querySelector('.civ-mtile.cut').dataset.h);
      const end = at(x, x.screen.steps.length - 1);
      expect([...end.querySelectorAll('.civ-mtile.cut')].map(e => e.dataset.h).sort()).toEqual([...onTable].sort());
      // ...and the screen never shows the decision: that airs in the blocking.
      expect(end.querySelector('.civ-mtile.doomed')).toBeNull();
      expect(x.screen.steps.some(s => /^hangout\.(agree|trade|yield|trio\.|solo\.decide)/.test(s.key || ''))).toBe(false);
    }
  });
});

describe('the visit and the meet', () => {
  it('two real people share a frame only after the door opens', () => {
    for (const x of of('visit')) {
      const door = firstIdx(x.screen, /^visit\.(door|sit)/);
      if (door > 0) expect(at(x, door - 1).querySelector('.cva-two')).toBeNull();
      const d = at(x, door);
      expect(d.querySelectorAll('.cva-two .cva-person')).toHaveLength(2);
    }
  });
  it('the walk is the hallway; each one waits in their own apartment; the last one waiting gets the knock', () => {
    for (const x of of('visit').filter(v => v.screen.steps.some(s => /^visit\.wait/.test(s.key || '')))) {
      const walk = firstIdx(x.screen, /^visit\.(choose|walk)/);
      if (walk >= 0) expect(at(x, walk).querySelector('.cvh-svg')).not.toBeNull();
      const waits = x.screen.steps.map((s, i) => (/^visit\.wait/.test(s.key || '') ? i : -1)).filter(i => i >= 0);
      for (const i of waits) expect(at(x, i).querySelector('.cva-svg'), x.screen.steps[i].key).not.toBeNull();
      // whose door it is stays secret until the knock: the visited player waits last
      const lastSpeaker = [...waits].reverse().map(i => x.screen.steps[i].who).find(Boolean);
      expect(lastSpeaker).toBe(x.screen.who[1]);
      expect(at(x, waits.at(-1)).querySelector('.cva-door.knock')).not.toBeNull();
      expect(at(x, waits[0]).querySelector('.cva-door.knock')).toBeNull();
    }
  });
  it('at the finale everyone who has arrived is in the room', () => {
    for (const x of of('meet')) {
      expect(at(x, x.screen.steps.length - 1).querySelectorAll('.civ-person').length).toBe(x.screen.who.length);
    }
  });
});

describe('the goodbye video', () => {
  it('the video waits for play; then the real face plays', () => {
    for (const x of of('goodbye')) {
      const v = x.screen.steps.findIndex(s => s.part === 'video');
      expect(at(x, v - 1).querySelector('.civ-vid')).toBeNull();
      expect(at(x, v - 1).querySelector('.civ-play')).not.toBeNull();
      expect(at(x, v).querySelector('.civ-vid.play')).not.toBeNull();
    }
  });
});

describe('the finale studio', () => {
  it('the board is read from last place, and the winner is crowned last', () => {
    for (const x of of('reveal')) {
      const d0 = at(x, 0);
      expect(d0.querySelectorAll('.civ-board .civ-slot.open')).toHaveLength(1);
      const last = Math.max(...x.screen.d.placements.map(p => p.place));
      expect(Number(d0.querySelector('.civ-slot.open b').textContent)).toBe(last);
      const win = firstIdx(x.screen, /^reveal\.winner$/);
      expect(at(x, win - 1).querySelector('.civ-slot.crown')).toBeNull();
      expect(at(x, win).querySelector('.civ-slot.crown b').textContent).toBe('1');
    }
  });
});

describe('the Newsfeed board', () => {
  it('draws every post with its likes, hidden until the first line, then ranked with the top crowned', async () => {
    const { likeCounts } = await import('../js/ci/season.js');
    expect(likeCounts({ a: ['b', 'c'], b: ['c'], c: [] })).toEqual({ a: 0, b: 1, c: 2 });
    const x = all.find(x => x.screen.kind === 'likes');
    expect(x.screen.stage).toBe('feed');
    const before = stageInner(x.row, x.screen, -1, false);
    expect(before).toMatch(/<b>\?<\/b>/);
    const after = stageInner(x.row, x.screen, 0, true);
    expect(after).toMatch(/MOST LIKES/);
    expect(after).not.toMatch(/<b>\?<\/b>/);
    expect((after.match(/civ-fpost/g) || []).length).toBe(Object.keys(x.screen.d.counts).length);
  });
});
