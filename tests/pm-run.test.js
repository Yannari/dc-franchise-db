// ══════════════════════════════════════════════════════════════════════
// pm-run.test.js — the villa is REACHABLE from the run tab
// ══════════════════════════════════════════════════════════════════════
//
// The show's signature risk is the one ADDING-A-SHOW.md opens with: a whole
// engine written, tested and unreachable. Every guard here is on the path the
// run tab takes — the flag, the queue, the rebuild, and what gets saved.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, formatIsRunnable } from '../js/core.js';
import { isPerfectMatchSeason, simulatePerfectMatchEpisode, perfectMatchEpisodesLeft,
  perfectMatchCastProblem, lastPerfectMatchRefusal, perfectMatchCanRerun } from '../js/pm-run.js';
import { makeIslanders } from './helpers/pm-cast.js';

function freshSeason(n = 22, extra = {}) {
  Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, ...extra });
  setPlayers(makeIslanders(n, 5));
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [] });
}

function playAll() {
  const aired = [];
  for (let i = 0; i < 30; i++) {
    const row = simulatePerfectMatchEpisode();
    if (!row) break;
    aired.push(row);
  }
  return aired;
}

describe('the villa can be started', () => {
  it('importing pm-run IS the wiring: the flag is set and the show reads as runnable', () => {
    expect(window._pmRunnable).toBe(true);
    expect(formatIsRunnable({ format: 'perfect-match' })).toBe(true);
    freshSeason();
    expect(isPerfectMatchSeason()).toBe(true);
  });
});

describe('a season plays through the run path', () => {
  it('sixteen episodes, one a press, stamped, and it ends complete with winners', () => {
    freshSeason();
    const aired = playAll();
    expect(aired.length).toBe(16);
    expect(aired.every(r => r.format === 'perfect-match')).toBe(true);
    expect(gs.episodeHistory.length).toBe(16);
    expect(gs.phase).toBe('complete');
    expect(gs.pmWinners?.length).toBe(2);
    expect(perfectMatchEpisodesLeft()).toBe(0);
    expect(simulatePerfectMatchEpisode()).toBe(null);
  });

  it('a queue lost to a reload rebuilds the SAME season without restacking what aired', () => {
    freshSeason();
    for (let i = 0; i < 5; i++) simulatePerfectMatchEpisode();
    const first5 = gs.episodeHistory.map(r => r.pm.couples.map(c => c.join('+')).join(' '));
    const next = gs._pmQueue[0].num;
    delete gs._pmQueue;                               // the reload
    const row = simulatePerfectMatchEpisode();
    expect(row.num).toBe(next);
    expect(gs.episodeHistory.length).toBe(6);
    expect(gs.episodeHistory.slice(0, 5).map(r => r.pm.couples.map(c => c.join('+')).join(' '))).toEqual(first5);
  });

  it("never saves the engine's working state — only what the screens read", () => {
    freshSeason();
    playAll();
    expect(Object.keys(gs.pm).sort()).toEqual(['castOrder', 'seed', 'setup', 'winners']);
    const size = JSON.stringify({ ...gs, _pmQueue: undefined }).length;
    // A played season is its rows: about 1MB, measured. The engine's `state`
    // would double it, and a page that saves on every episode notices 3.
    expect(size).toBeLessThan(3 * 1024 * 1024);
  });

  it('the public ledger and the relationships come back to the run tab', () => {
    freshSeason();
    playAll();
    expect(Object.keys(gs.popularity).length).toBeGreaterThan(10);
    expect(Object.keys(gs.relationshipDimensions || {}).length).toBeGreaterThan(10);
  });
});

describe('a cast that cannot start a villa is refused, with the reason', () => {
  it('too few starters', () => {
    freshSeason(4);
    expect(simulatePerfectMatchEpisode()).toBe(null);
    expect(lastPerfectMatchRefusal()).toMatch(/at least six starters/);
  });
  it('starters that cannot all pair up on night one', () => {
    const cast = makeIslanders(22, 5);
    const setup = Object.fromEntries(cast.map((p, i) => [p.name, { role: i < 11 ? 'starter' : 'bombshell' }]));
    setPlayers(cast);
    expect(perfectMatchCastProblem(cast.map(p => p.name), setup)).toMatch(/won't all couple/);
  });
  it('re-running is refused rather than faked', () => {
    expect(perfectMatchCanRerun()).toBe(false);
  });
});

describe('an aired episode can be watched and read', () => {
  it('opens on the villa screens, one per part of the day, and the backlog has every scene', async () => {
    const { perfectMatchScreens, episodeText } = await import('../js/pm/transcript.js');
    freshSeason();
    playAll();
    for (const row of gs.episodeHistory) {
      const screens = perfectMatchScreens(row);
      expect(screens.length, `ep ${row.num}`).toBeGreaterThan(0);
      const html = screens.map(s => s.html).join('');
      expect(html.match(/class="pm-scene/g)?.length, `ep ${row.num}`).toBe(row.pm.events.length);
      // The backlog carries every spoken line the screens do.
      const text = episodeText(row);
      for (const e of row.pm.events) for (const l of e.script.lines) expect(text, `ep ${row.num}`).toContain(l.text);
    }
  });
});
