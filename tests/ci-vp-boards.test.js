// @vitest-environment jsdom
// ci-vp-boards.test.js — a board for every Circle game (Plan 5, spec 18.3).
// Played on real seasons until every family has aired: each board draws
// every step, and nothing appears before the line that says it.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { stageInner } from '../js/vp-ci/stage.js';
import { GAMES } from '../js/ci/games-data.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const FAMILIES = [...new Set(GAMES.map(g => g.family))];
const byFamily = {};
for (let seed = 1; seed <= 40 && Object.keys(byFamily).length < FAMILIES.length; seed++) {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
  for (const row of rows) for (const screen of circleScreens(row)) {
    if (screen.kind !== 'game') continue;
    const fam = GAMES.find(g => g.id === screen.d?.gameId)?.family;
    (byFamily[fam] ||= []).push({ row, screen });
  }
}
const dom = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };
const at = ({ row, screen }, i, fresh = false) => dom(stageInner(row, screen, i, fresh));
const stepOf = (screen, pred) => screen.steps.findIndex(s => s.bi != null && pred(screen.d.beats[s.bi]));

describe('every game has a board', () => {
  it('every family airs in these seasons, on the game stage, with its beats', () => {
    expect(Object.keys(byFamily).sort()).toEqual(FAMILIES.sort());
    for (const list of Object.values(byFamily)) for (const { screen } of list) {
      expect(screen.stage).toBe('game');
      expect(screen.d.beats.length).toBeGreaterThan(0);
      expect(screen.steps.some(s => s.bi != null)).toBe(true);
    }
  });
  it('every step of every game draws its board, titled with the game', () => {
    for (const list of Object.values(byFamily)) for (const x of list) {
      const name = GAMES.find(g => g.id === x.screen.d.gameId).name.toUpperCase();
      for (let i = -1; i < x.screen.steps.length; i++) {
        const d = at(x, i, true);
        expect(d.querySelector('.civ-gtitle').textContent).toContain(name);
        expect(d.querySelector('.civ-gboard')).not.toBeNull();
      }
    }
  });
});

describe('nothing before its line', () => {
  it('statement: an answer drops into its column when it is given', () => {
    for (const x of byFamily.statement) {
      const i = stepOf(x.screen, b => b.kind === 'answer');
      if (i < 0) continue;
      const b = x.screen.d.beats[x.screen.steps[i].bi];
      const col = el => [...el.querySelectorAll('.civ-gcols .civ-mtile')].map(t => t.dataset.h);
      const before = at(x, i - 1), after = at(x, i);
      expect(col(after)).toContain(b.by);
      expect(col(before).filter(h => h === b.by).length).toBeLessThan(col(after).filter(h => h === b.by).length + (col(before).includes(b.by) ? 1 : 0));
    }
  });
  it('name: the award is given only when the tally is read', () => {
    for (const x of byFamily.name) {
      const i = stepOf(x.screen, b => b.kind === 'tally');
      if (i < 0) continue;
      expect(at(x, i - 1).querySelector('.civ-gaward')).toBeNull();
      expect(at(x, i).querySelector('.civ-gaward')).not.toBeNull();
    }
  });
  it('ask: an anonymous question never shows who asked', () => {
    for (const x of byFamily.ask) {
      x.screen.steps.forEach((s, i) => {
        const b = s.bi != null ? x.screen.d.beats[s.bi] : null;
        if (b?.kind !== 'question' || !b.anon) return;
        const q = at(x, i).querySelector('.civ-gq');
        expect(q.textContent).toMatch(/ANONYMOUS/);
        if (b.by !== b.about) expect(q.textContent).not.toContain(x.row.ci.profiles[b.by].name);
      });
    }
  });
  it('guess: the owner of a fact, and who guessed right, only once it is revealed', () => {
    for (const x of byFamily.guess) {
      const i = stepOf(x.screen, b => b.kind === 'owner');
      if (i < 0) continue;
      const before = at(x, i - 1);
      expect(before.querySelector('.civ-gowner .won')).toBeNull();
      expect(before.querySelector('.civ-grow .right, .civ-grow .wrong')).toBeNull();
      expect(at(x, i).querySelector('.civ-gowner .won')).not.toBeNull();
    }
  });
  it('photo: a post appears on the feed when it is posted', () => {
    for (const x of byFamily.photo) {
      const i = stepOf(x.screen, b => b.kind === 'post');
      expect(at(x, i - 1).querySelectorAll('.civ-gpost')).toHaveLength(0);
      expect(at(x, i).querySelectorAll('.civ-gpost')).toHaveLength(1);
    }
  });
  it('make: an anonymous game keeps its makers secret on the wall', () => {
    for (const x of byFamily.make) {
      const g = GAMES.find(y => y.id === x.screen.d.gameId);
      const end = at(x, x.screen.steps.length - 1);
      const frames = [...end.querySelectorAll('.civ-gframe .meta')].map(m => m.textContent);
      if (g.anonymous && !x.screen.d.beats.some(b => b.kind === 'whodunit.right')) for (const f of frames) expect(f).toMatch(/by \?/);
      if (!g.anonymous) for (const f of frames) expect(f).not.toMatch(/by \?/);
    }
  });
  it('make: the winning frame names its maker as the winner (the caption is who it is about)', () => {
    for (const x of byFamily.make) {
      const w = x.screen.d.beats.find(b => b.phase === 'verdict' && b.kind === 'winner');
      if (!w) continue;
      const g = GAMES.find(y => y.id === x.screen.d.gameId);
      const won = at(x, x.screen.steps.length - 1).querySelector('.civ-gframe.won .meta');
      if (!won) continue;
      expect(won.textContent).toMatch(/WINS/);
      if (!g.anonymous) expect(won.textContent).toContain(x.row.ci.profiles[w.by].name);
    }
  });
  it('team: the teams fill as the captains pick', () => {
    for (const x of byFamily.team) {
      const i = stepOf(x.screen, b => /^pick/.test(b.kind));
      if (i < 0) continue;
      const n = el => el.querySelectorAll('.civ-gteams .civ-mtile').length;
      expect(n(at(x, i))).toBe(n(at(x, i - 1)) + 1);
    }
  });
});

describe('markup', () => {
  it('no element on any Circle screen carries two style attributes (the second is dropped: a photo that never shows)', () => {
    const twice = /<[^>]*\sstyle="[^"]*"[^>]*\sstyle="/;
    for (const list of Object.values(byFamily)) for (const x of list) {
      for (const row of [x.row]) for (const screen of circleScreens(row)) {
        for (let i = -1; i < screen.steps.length; i++) {
          const html = stageInner(row, screen, i, true);
          const m = html.match(twice);
          expect(m?.[0] || null, `${screen.kind} step ${i}`).toBeNull();
        }
      }
    }
  });
});
