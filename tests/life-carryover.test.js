// @vitest-environment jsdom
//
// The carryover, in a season that actually runs.
//
// life-cast.test.js checks what the seeds should be; this checks that a played
// season receives them — the bond, the showmance, the partner left at home, and
// the episode-one camp event that tells the audience any of it.
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { runOneSeason, makeCast, seededRun, core } from './helpers/season-harness.js';
import { bKey } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';

/**
 * Start a season and stop.
 *
 * Seeds have to be read here rather than after a played season: a bond of 4
 * carried in is a bond of 5.44 by the finale, because the season moved it —
 * which is the whole point of seeding it, and useless as an assertion.
 */
function startOnly(cast, config = {}) {
  core.setPlayers(cast);
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Carryover', teams: 2, mergeAt: 8,
    finaleSize: 3, jurySize: 5, romance: 'enabled', aftermath: 'disabled', ...config });
  if (!initGameState()) throw new Error('initGameState failed');
  return core.gs;
}

const SEASONS = [{ seasonId: 'td-1', airYear: 2020, airSlot: 'spring' }];
const approved = (player, kind, extra = {}) => ({ player, kind, afterSeason: 'td-1', seq: 1,
  status: 'approved', ...extra });

/** A cast of the harness's own shape, with a couple in it. */
function castWithCouple() {
  const cast = makeCast(12);
  // P1 and P2 are the couple; both on the same tribe so the camp event lands
  // somewhere a reader would see it.
  cast[0].gender = 'f'; cast[1].gender = 'm';
  return cast;
}

function withLog(log, seasons = SEASONS) {
  window.__lifeLog = log;
  window.__lifeSeasons = seasons;
}

beforeEach(() => { withLog([], SEASONS); });
afterEach(() => { delete window.__lifeLog; delete window.__lifeSeasons; });

describe('a couple who arrive together', () => {
  it('start the season bonded and in an established showmance', () => {
    withLog([approved('p1', 'moved-in', { whom: 'p2' })]);
    const gs = seededRun(() => startOnly(castWithCouple()));

    const sh = (gs.showmances || []).find(s => s.origin === 'arrived-together');
    expect(sh).toBeTruthy();
    expect(sh.players.sort()).toEqual(['P1', 'P2']);
    // Measured against the SAME cast with no log rather than an absolute:
    // initGameState already puts small pre-game bonds between tribemates, and
    // the claim here is what the carryover added, not what the bond ends up as.
    const bonded = gs.bonds[bKey('P1', 'P2')];
    withLog([]);
    const bare = seededRun(() => startOnly(castWithCouple())).bonds[bKey('P1', 'P2')] || 0;
    expect(bonded - bare).toBe(4);
    // Not a spark, and not formed tonight: anything reading sparkEp as "when it
    // started" must not be told it started in episode one of this season.
    expect(sh.phase).toBe('established');
    expect(sh.sparkEp).toBe(0);
  });

  it('are introduced in the first episode, so the audience knows why they trust each other', () => {
    withLog([approved('p1', 'moved-in', { whom: 'p2' })]);
    seededRun(() => runOneSeason({ romance: 'enabled' }, 12, castWithCouple()));

    const first = core.gs.episodeHistory[0];
    const events = Object.values(first.campEvents || {})
      .flatMap(c => [...(c.pre || []), ...(c.post || [])]);
    const arrival = events.find(e => e.type === 'life-arrival');
    expect(arrival).toBeTruthy();
    expect(arrival.players.sort()).toEqual(['P1', 'P2']);
    expect(arrival.text).toMatch(/together/i);
  });

  it('says nothing about camp when the show is a house', () => {
    // The recurring bug class: one show's vocabulary printed over the other.
    withLog([approved('p1', 'dating', { whom: 'p2' })]);
    seededRun(() => runOneSeason({ romance: 'enabled' }, 12, castWithCouple()));
    const events = Object.values(core.gs.episodeHistory[0].campEvents || {})
      .flatMap(c => [...(c.pre || []), ...(c.post || [])]);
    const arrival = events.find(e => e.type === 'life-arrival');
    expect(arrival.text).toMatch(/contestants/);
  });
});

describe('a player cast without their partner', () => {
  it('carries the partner at home, and it is said out loud', () => {
    // P2 is not in this cast — a 4-person slice that excludes them.
    withLog([approved('p1', 'wedding', { whom: 'somebody-else' })]);
    seededRun(() => runOneSeason({ romance: 'enabled' }, 12, castWithCouple()));

    const p1 = core.players.find(p => p.name === 'P1');
    expect(p1.partnerAtHome).toEqual({ slug: 'somebody-else', name: 'Somebody Else', stage: 'married' });

    const events = Object.values(core.gs.episodeHistory[0].campEvents || {})
      .flatMap(c => [...(c.pre || []), ...(c.post || [])]);
    const solo = events.find(e => e.type === 'life-partner-at-home');
    expect(solo).toBeTruthy();
    expect(solo.text).toContain('Somebody Else');
  });
});

describe('a franchise with no life', () => {
  it('runs a season with nothing carried in and nothing broken', () => {
    withLog([]);
    const out = seededRun(() => runOneSeason({ romance: 'enabled' }, 12));
    expect(out.phase).toBe('complete');
    expect((core.gs.showmances || []).some(s => s.origin === 'arrived-together')).toBe(false);
    expect(core.players.some(p => p.partnerAtHome)).toBe(false);
  });

  it('runs when the log is missing entirely, rather than refusing to start', () => {
    delete window.__lifeLog;
    delete window.__lifeSeasons;
    const out = seededRun(() => runOneSeason({ romance: 'enabled' }, 12));
    expect(out.phase).toBe('complete');
  });

  it('carries nothing when the season has switched it off', () => {
    withLog([approved('p1', 'wedding', { whom: 'p2' })]);
    const off = seededRun(() => startOnly(castWithCouple(), { lifeCarryover: false }));
    const offBond = off.bonds[bKey('P1', 'P2')] || 0;
    expect((off.showmances || []).some(s => s.origin === 'arrived-together')).toBe(false);
    withLog([]);
    const bare = seededRun(() => startOnly(castWithCouple())).bonds[bKey('P1', 'P2')] || 0;
    expect(offBond).toBe(bare);
  });
});
