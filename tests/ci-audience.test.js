// @vitest-environment jsdom
// ci-audience.test.js — the audience at home votes (formats.js audience-block /
// audience-immunity). Checked on what the engine did in a booked season, and
// on the screen: nothing of the result is drawn before the host says it.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { sharesOf } from '../js/ci/formats.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { stageInner } from '../js/vp-ci/stage.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

function booked(id, seed = 5) {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const out = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed,
    options: { bookings: { rating4: id } } });
  const vote = out.state.scenes.find(s => s.kind === 'audience');
  return { ...out, vote };
}
const dom = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };
function voteScreen(rows) {
  for (const row of rows) for (const screen of circleScreens(row)) if (screen.kind === 'audience') return { row, screen };
  return null;
}

describe('shares of the vote', () => {
  it('always sum to 100, and the better liked gets more', () => {
    for (const v of [[0, 0], [30, -10], [-50, 80, 5, 0], [100, 100, 100]]) {
      const s = sharesOf(v);
      expect(s.reduce((a, b) => a + b, 0)).toBe(100);
    }
    const [a, b] = sharesOf([40, -20]);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(0);
  });
});

describe('the Hangout on an America Block night', () => {
  // User, 2026-10-04: "Tyler was supposed to be the one blocked". The
  // Influencers' first pick went up with a runner-up and the audience saved
  // it, but the Hangout read like any night ("That's the name", THEY'VE
  // DECIDED): the night has to say the two names go to America.
  it('nominates two for the audience, and says so', () => {
    const { rows } = booked('ci-audience-block');
    let checked = 0;
    for (const row of rows) for (const screen of circleScreens(row)) {
      if (screen.kind !== 'hangout' || screen.d?.format !== 'audience-block') continue;
      checked++;
      const keys = screen.steps.map(x => x.key);
      expect(keys.some(k => /^hangout\.(solo\.)?sealed\.audience$/.test(k))).toBe(true);
      const end = dom(stageInner(row, screen, screen.steps.length - 1));
      expect(end.textContent).toMatch(/TWO NAMES (GO TO|FOR) AMERICA/);
      expect(end.textContent).not.toMatch(/THEY'VE DECIDED/);
    }
    expect(checked).toBe(1);
  });
});

describe('the audience saves one of two', () => {
  const { vote, state, rows } = booked('ci-audience-block');
  it('the Influencers put up their pick and their runner-up; the smaller share is blocked', () => {
    expect(vote).toBeTruthy();
    const d = vote.data;
    expect(d.mode).toBe('block');
    expect(d.candidates).toHaveLength(2);
    const hang = state.scenes.filter(s => s.kind === 'hangout' && s.day === vote.day).at(-1);
    expect([...d.candidates].sort()).toEqual([hang.data.target, hang.data.runnerUp.handle].sort());
    const out = d.candidates.indexOf(d.target);
    expect(d.shares[out]).toBeLessThanOrEqual(d.shares[1 - out]);
    expect(d.saved).toBe(d.candidates[1 - out]);
    const blocking = state.scenes.find(s => s.kind === 'blocking' && s.day === vote.day);
    // Ride or Die (US 6): a partner may still take the block in their place.
    if (blocking.data.channel === 'sacrifice') return;
    expect(blocking.data.target).toBe(d.target);
    expect(blocking.data.channel).toBe('audience');
    expect(state.active).not.toContain(d.target);
  });
  it('the screen keeps the shares hidden until the host reads them', () => {
    const x = voteScreen(rows);
    expect(x.screen.stage).toBe('vote');
    const res = x.screen.steps.findIndex(s => /^audience\.result\./.test(s.key || ''));
    expect(res).toBeGreaterThan(0);
    const before = dom(stageInner(x.row, x.screen, res - 1, true));
    expect(before.querySelector('.cv-c.out, .cv-c.saved')).toBeNull();
    expect(before.textContent).not.toMatch(/BLOCKED|SAVED/);
    const after = dom(stageInner(x.row, x.screen, res, true));
    expect(after.querySelector('.cv-c.out .cv-tag').textContent).toBe('BLOCKED');
    expect(after.querySelector('.cv-c.saved')).not.toBeNull();
    expect(after.querySelector('.cv-closed')).not.toBeNull();
  });
});

describe('the audience makes one immune', () => {
  const { vote, state, rows } = booked('ci-audience-immunity');
  it('never an Influencer, and the winner is not blocked that night', () => {
    expect(vote).toBeTruthy();
    const d = vote.data;
    expect(d.mode).toBe('immunity');
    const hang = state.scenes.find(s => s.kind === 'hangout' && s.day === vote.day);
    for (const h of d.candidates) expect(hang.who).not.toContain(h);
    expect(d.winner).toBe(d.candidates[0]);
    expect(Math.max(...d.shares)).toBe(d.shares[0]);
    expect(hang.data.atRisk).not.toContain(d.winner);
    const blocking = state.scenes.find(s => s.kind === 'blocking' && s.day === vote.day);
    expect(blocking.data.target).not.toBe(d.winner);
  });
  it('the screen crowns the winner only on the result', () => {
    const x = voteScreen(rows);
    const res = x.screen.steps.findIndex(s => /^audience\.result\./.test(s.key || ''));
    expect(dom(stageInner(x.row, x.screen, res - 1, true)).querySelector('.cv-c.safe')).toBeNull();
    const after = dom(stageInner(x.row, x.screen, res, true));
    expect(after.querySelector('.cv-c.safe .cv-nm').textContent).toContain(x.row.ci.profiles[vote.data.winner].name.toUpperCase());
  });
});
