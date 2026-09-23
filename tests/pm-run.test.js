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
  perfectMatchCastProblem, lastPerfectMatchRefusal, perfectMatchCanRerun, rerunPerfectMatchEpisode,
  perfectMatchPendingChange } from '../js/pm-run.js';
import { makeIslanders } from './helpers/pm-cast.js';

function freshSeason(n = 22, extra = {}) {
  Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, twistSchedule: [], pmRoleCounts: {}, ...extra });
  setPlayers(makeIslanders(n, 5));
  // A fixed seed: the run's own is partly random, so every test run would
  // otherwise play a different season.
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], pm: { seed: 3004 } });
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
    expect(Object.keys(gs.pm).sort()).toEqual(['built', 'castOrder', 'picks', 'rerolls', 'seed', 'setup', 'winners']);
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
  it('counts that do not add up to the cast', () => {
    freshSeason(22, { pmRoleCounts: { starters: 10, bombshells: 6, casa: 8 } });
    expect(simulatePerfectMatchEpisode()).toBe(null);
    expect(lastPerfectMatchRefusal()).toMatch(/add up to 24, but the cast has 22/);
    seasonConfig.pmRoleCounts = {};
  });
  it('starters that cannot all pair up on night one', () => {
    const cast = makeIslanders(22, 5);
    const setup = Object.fromEntries(cast.map((p, i) => [p.name, { role: i < 11 ? 'starter' : 'bombshell' }]));
    setPlayers(cast);
    expect(perfectMatchCastProblem(cast.map(p => p.name), setup)).toMatch(/won't all couple/);
  });
});

// ── NOTHING IS DECIDED UNTIL IT AIRS ──────────────────────────────────
// The user: "the decision is not decided and can be changed". A re-run is a
// different night; a pick changed mid-season reaches every unaired episode;
// a change that would rewrite an aired one says which episode to re-run.
const fp = r => JSON.stringify([r.pm.couples, r.exits.map(x => x.name), r.pm.events.map(e => e.kind + e.players.join())]);

describe('an episode can be re-run, and only it changes', () => {
  it('re-running episode 7 keeps 1-6 exactly and deals a different 7', () => {
    freshSeason();
    for (let i = 0; i < 9; i++) simulatePerfectMatchEpisode();
    const before = gs.episodeHistory.map(fp);
    expect(perfectMatchCanRerun()).toBe(true);
    expect(rerunPerfectMatchEpisode(7)).toBe(true);
    expect(gs.episodeHistory.length).toBe(6);
    expect(gs.episodeHistory.map(fp)).toEqual(before.slice(0, 6));
    const seven = simulatePerfectMatchEpisode();
    expect(seven.num).toBe(7);
    expect(fp(seven)).not.toBe(before[6]);
  });
  it('re-running the same episode twice deals it a third way', () => {
    freshSeason();
    for (let i = 0; i < 4; i++) simulatePerfectMatchEpisode();
    const first = fp(gs.episodeHistory[3]);
    rerunPerfectMatchEpisode(4); const second = fp(simulatePerfectMatchEpisode());
    rerunPerfectMatchEpisode(4); const third = fp(simulatePerfectMatchEpisode());
    expect(new Set([first, second, third]).size).toBe(3);
  });
});

describe('a pick is live until its episode airs', () => {
  it('a booking only pins a vote night that format can play', async () => {
    const { perfectMatchPicks } = await import('../js/pm-run.js');
    freshSeason();
    seasonConfig.twistSchedule = [{ id: 'a', episode: 5, type: 'pm-save-one' }, { id: 'b', episode: 3, type: 'pm-public-vote' },
      { id: 'c', episode: 12, type: 'pm-save-one' }, { id: 'd', episode: 14, type: 'pm-ex-islanders' }];
    // ep 3 is a bombshell night; save-one is not a second-vote format.
    expect(perfectMatchPicks()).toEqual({ vote1: 'save-one', semi: 'ex-islanders' });
    seasonConfig.twistSchedule = [];
  });
  it('a pick for an unaired episode reaches it, and the aired ones do not move', () => {
    freshSeason();
    for (let i = 0; i < 3; i++) simulatePerfectMatchEpisode();
    const aired = gs.episodeHistory.map(fp);
    // Booked on the Season Timeline: episode 5 is the first vote at 22. (Not
    // the second: whether a late vote plays at all depends on how many
    // couples are left, which is the season's business, not the booking's.)
    const drawn = gs._pmQueue.find(r => r.num === 5).pm.dumpFormat;
    const want = drawn === 'save-one' ? 'public' : 'save-one';
    seasonConfig.twistSchedule = [{ id: 't1', episode: 5, type: want === 'public' ? 'pm-public-vote' : 'pm-save-one' }];
    simulatePerfectMatchEpisode();
    expect(gs.episodeHistory.slice(0, 3).map(fp)).toEqual(aired);
    expect(gs._pmQueue.find(r => r.num === 5).pm.dumpFormat).toBe(want);
    expect(perfectMatchPendingChange()).toBe(null);
  });
  it('a pick for an aired episode waits for its re-run, and says so', () => {
    freshSeason();
    for (let i = 0; i < 6; i++) simulatePerfectMatchEpisode();
    const drawn = gs.episodeHistory[4].pm.dumpFormat;
    const want = drawn === 'save-one' ? 'public' : 'save-one';
    seasonConfig.twistSchedule = [{ id: 't1', episode: 5, type: want === 'public' ? 'pm-public-vote' : 'pm-save-one' }];
    const aired = gs.episodeHistory.map(fp);
    simulatePerfectMatchEpisode();
    expect(gs.episodeHistory.slice(0, 6).map(fp)).toEqual(aired);
    expect(perfectMatchPendingChange()).toMatch(/episode 5/);
    expect(rerunPerfectMatchEpisode(5)).toBe(true);
    expect(simulatePerfectMatchEpisode().pm.dumpFormat).toBe(want);
  });
});

describe('an aired episode can be watched and read', () => {
  it('opens on the designed villa screens, and the backlog has every scene', async () => {
    const { episodeText } = await import('../js/pm/transcript.js');
    const { perfectMatchVpScreens } = await import('../js/vp-pm/screens.js');
    window.matchMedia ||= () => ({ matches: false, addEventListener() {}, addListener() {} });  // vp-ui reads it on import
    const { _vpPhaseForScreen } = await import('../js/vp-ui.js');
    freshSeason();
    playAll();
    for (const row of gs.episodeHistory) {
      const prev = gs.episodeHistory.find(r => r.num === row.num - 1) || null;
      const screens = perfectMatchVpScreens(row, prev);
      expect(screens.length, `ep ${row.num}`).toBeGreaterThan(0);
      // Casa Amor's own scenes are tagged `day` after the day has aired: two
      // screens called "The day" read as the same part twice.
      const labels = screens.map(s => s.label);
      expect(new Set(labels).size, `ep ${row.num}: ${labels.join(', ')}`).toBe(labels.length);
      // And the rail groups them in the villa's words, never Total Drama's
      // "Camp" — the fallthrough every unknown screen id lands in.
      // (The breaks — "Coming up", "Next time" — are stops of their own.)
      for (const s of screens) expect(['pm-villa', 'pm-night', 'pm-reunion', 'pm-break', 'pm-next'], s.id).toContain(_vpPhaseForScreen(s.id).id);
      // Every scene has its card, and every spoken line is on one. The
      // breaks' teaser cards and the winners' opening card are not scenes.
      const html = screens.map(s => s.html).join('');
      const cardsOf = s => s.html.match(/class="pmv-card[ "]/g)?.length || 0;
      const extra = screens.filter(s => /^villa-(comingup|nexttime)-/.test(s.id)).reduce((n, s) => n + cardsOf(s), 0)
        + (row.moment === 'final' && row.pm.shares?.length ? 1 : 0);
      expect(html.match(/class="pmv-card[ "]/g)?.length, `ep ${row.num}`).toBe(row.pm.events.length + extra);
      const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      for (const e of row.pm.events) for (const l of e.script.lines) expect(html, `ep ${row.num}`).toContain(esc(l.text));
      // The backlog carries every spoken line the screens do.
      const text = episodeText(row);
      for (const e of row.pm.events) for (const l of e.script.lines) expect(text, `ep ${row.num}`).toContain(l.text);
    }
  });
});

describe('the Season Timeline\'s "N left" is the season that plays', () => {
  it('before the first press, every episode\'s count is what that episode then has in the villa', async () => {
    const { perfectMatchVillaCounts } = await import('../js/pm-run.js');
    freshSeason();
    const before = perfectMatchVillaCounts();
    const aired = playAll();
    for (const r of aired) expect(before.get(r.num), `ep ${r.num}`).toBe(r.pm.villa.length + r.exits.length);
  });
});
