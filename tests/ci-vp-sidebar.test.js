// @vitest-environment jsdom
// ci-vp-sidebar.test.js — the live sidebar (spec 18.3): the room as the day
// began, played forward by what has aired. Never ahead of the screen.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { sidebarHtml } from '../js/vp-ci/sidebar.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const cast = rosterCast(13, 4); setPlayers(cast);
const names = cast.map(p => p.name);
const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });
const dom = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };
// Day 1 starts empty (everybody arrives during it): a later blocking day.
const blockDay = rows.find(r => r.day > 1 && circleScreens(r).some(s => s.kind === 'blocking'));
const screens = circleScreens(blockDay);
const side = (si, idx) => dom(sidebarHtml(blockDay, screens, si, idx));

describe('the room as the day began', () => {
  it('rows carry the start of the day: who is in, who holds power, suspicions, bonds', () => {
    const st = blockDay.ci.start;
    expect(st.active.length).toBeGreaterThan(4);
    for (const k of ['influencers', 'suspects', 'bonds', 'rivals']) expect(Array.isArray(st[k])).toBe(true);
    const later = rows.at(-3).ci.start;
    expect(later.suspects.length + later.bonds.length + later.rivals.length).toBeGreaterThan(0);
    // grudges are rarer than bonds: across a few seasons, somebody holds one
    const seasons = [rows, ...[5, 6].map(seed => { const c = rosterCast(13, seed); setPlayers(c); const n = c.map(p => p.name);
      return playCircleSeason({ cast: n, setup: circleSetup(n), pool: DEFAULT_POOL, seed }).rows; })];
    expect(seasons.some(rs => rs.some(r => r.ci.start.rivals.length))).toBe(true);
    expect(rows[0].ci.start.active).toHaveLength(0);   // Day 1: the sidebar fills as they walk in
  });
  it('lists every player in the room, real person beside the profile', () => {
    const d = side(0, -1);
    expect(d.querySelectorAll('.civ-sp')).toHaveLength(blockDay.ci.start.active.length);
    const cat = Object.entries(blockDay.ci.profiles).find(([h, p]) => p.mode === 'catfish' && blockDay.ci.start.active.includes(h));
    if (cat) expect(d.querySelector(`.civ-sp[data-h="${cat[0]}"]`).textContent).toMatch(new RegExp(cat[1].people[0]));
  });
});

describe('played forward, never ahead', () => {
  it('BLOCKED appears on the sidebar only once the name is sent', () => {
    const si = screens.findIndex(s => s.kind === 'blocking');
    const s = screens[si];
    const named = s.steps.findIndex(x => /^(block\.announce\.|vote\.result|block\.inperson\.tell)/.test(x.key || ''));
    const t = s.d.target;
    expect(side(si, named - 1).querySelector(`.civ-sp[data-h="${t}"]`).classList.contains('out')).toBe(false);
    expect(side(si, named).querySelector(`.civ-sp[data-h="${t}"]`).classList.contains('out')).toBe(true);
    expect(side(si + 1, -1).querySelector(`.civ-sp[data-h="${t}"]`).classList.contains('out')).toBe(true);   // a later screen remembers
  });
  it('new Influencers are crowned on the sidebar when the results name them', () => {
    const si = screens.findIndex(s => s.kind === 'ratings');
    const s = screens[si];
    const at = s.steps.findIndex(x => /^result\.(influencers|sole|super|secret)$/.test(x.key || ''));
    if (at < 0) return;
    const newbie = s.d.influencers.find(h => !blockDay.ci.start.influencers.includes(h));
    if (!newbie) return;
    expect(side(si, at - 1).querySelector(`.civ-sp[data-h="${newbie}"] .civ-crown`)).toBeNull();
    expect(side(si, at).querySelector(`.civ-sp[data-h="${newbie}"] .civ-crown`)).not.toBeNull();
  });
});
