// How many bombshells walk in on each night, set on the Season Timeline
// (pm/schedule.js buildSchedule `counts`): the season re-flows around it.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { buildSchedule, MAX_PER_NIGHT } from '../js/pm/schedule.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const bombNights = s => s.filter(e => e.moment === 'bombshell');
const arriving = s => s.reduce((t, e) => t + (e.arrivals?.bombshell || 0), 0);

describe('choosing how many bombshells walk in', () => {
  const plain = buildSchedule({ bombshells: 6, casa: 6 });

  it('more on one night: the last bombshell nights drop out, and every bombshell still arrives', () => {
    // Six bombshells: three on the first night brings the later arrivals forward.
    const six = buildSchedule({ bombshells: 6, casa: 6, counts: { 1: 3 } });
    expect(bombNights(six)[0].arrivals.bombshell).toBe(3);
    expect(arriving(six)).toBe(6);
    // Ten: four on the first night leaves the last bombshell night with nobody, and it goes.
    const ten = buildSchedule({ bombshells: 10, casa: 6 });
    const s = buildSchedule({ bombshells: 10, casa: 6, counts: { 1: 4 } });
    expect(bombNights(s)[0].arrivals.bombshell).toBe(4);
    expect(arriving(s)).toBe(10);
    expect(bombNights(s).length).toBeLessThan(bombNights(ten).length);
    expect(s.length).toBeLessThan(ten.length);
  });

  it('fewer on one night: the rest get new bombshell nights, and the season grows', () => {
    const s = buildSchedule({ bombshells: 6, casa: 6, counts: { 2: 1 } });
    expect(bombNights(s)[1].arrivals.bombshell).toBe(1);
    expect(arriving(s)).toBe(6);
    expect(s.length).toBeGreaterThan(plain.length);
    // A bombshell night is always followed by a week that can send someone home.
    expect(s.every((e, i) => e.moment !== 'bombshell' || s[i + 1]?.moment !== 'bombshell')).toBe(true);
  });

  it('a count is kept to the night it was set on, and to the most one night can take', () => {
    const s = buildSchedule({ bombshells: 10, casa: 6, counts: { 3: 9 } });
    expect(bombNights(s)[2].arrivals.bombshell).toBe(MAX_PER_NIGHT);
    expect(arriving(s)).toBe(10);
    // The nights before it are untouched.
    const before = bombNights(buildSchedule({ bombshells: 10, casa: 6 })).slice(0, 2).map(e => [e.ep, e.arrivals.bombshell]);
    expect(bombNights(s).slice(0, 2).map(e => [e.ep, e.arrivals.bombshell])).toEqual(before);
  });

  it('no counts is the schedule it always was', () => {
    expect(buildSchedule({ bombshells: 6, casa: 6, counts: {} })).toEqual(plain);
    expect(buildSchedule({ bombshells: 6, casa: 6, counts: null })).toEqual(plain);
  });

  it('a season played with a triple bombshell night brings all three in that night, and everyone once', () => {
    const cast = makeIslanders(22, 3);
    setPlayers(cast);
    const names = cast.map(p => p.name);
    const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 3, arrivalCounts: { 1: 3 } });
    const night = rows.filter(r => r.moment === 'bombshell')[0];
    const entered = night.pm.events.filter(e => /entrance/.test(e.kind)).flatMap(e => e.players);
    expect(new Set(entered).size).toBe(3);
    const all = rows.flatMap(r => r.pm.events).filter(e => e.kind === 'entrance' || e.kind === 'kin-entrance').flatMap(e => e.players)
      .filter(n => roleSetup(names)[n].role === 'bombshell');
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all).size).toBe(6);
  });
});

describe('on the Season Timeline', () => {
  it('the tile picker re-flows the season, the badge follows, and every booking stays on its night', async () => {
    const { gs, setGs, setPlayers: setP, seasonConfig, players, relationships, TWIST_CATALOG, seasonFormat, selectedEpisodes } = await import('../js/core.js');
    const { pStats, pronouns, ordinal, romanticCompat } = await import('../js/players.js');
    const { getBond, getPerceivedBond, bKey, bondLabel } = await import('../js/bonds.js');
    const { perfectMatchEpisodes } = await import('../js/pm-run.js');
    const { pmSetArrivals, renderTimeline } = await import('../js/run-ui.js');
    Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, pmRoleCounts: {}, pmArrivalCounts: {} });
    // Six bombshells, and every arrival place already taken: one fewer tonight has to go somewhere new.
    setP(makeIslanders(22, 5));
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], pm: { seed: 3004 } });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, TWIST_CATALOG, seasonFormat, selectedEpisodes,
      pStats, pronouns, ordinal, romanticCompat, getBond, getPerceivedBond, bKey, bondLabel });
    document.body.innerHTML = '<div id="fd-timeline"></div>';
    const before = perfectMatchEpisodes();
    const lastVote = before.find(e => e.slot === 'vote-post').ep;
    const firstBomb = before.find(e => e.moment === 'bombshell').ep;
    seasonConfig.twistSchedule = [{ id: 't1', episode: lastVote, type: 'pm-top-couple-picks' },
      { id: 't2', episode: firstBomb, type: 'pm-stand-up' }];
    // One on the second bombshell night instead of two: the season grows.
    const second = before.filter(e => e.moment === 'bombshell')[1].ep;
    pmSetArrivals(second, '1');
    const after = perfectMatchEpisodes();
    expect(after.length).toBeGreaterThan(before.length);
    expect(after.find(e => e.ep === second).arrivals.bombshell).toBe(1);
    // The last vote moved, and its booking went with it; the night before the change did not move.
    const newLast = after.find(e => e.slot === 'vote-post').ep;
    expect(newLast).toBeGreaterThan(lastVote);
    expect(seasonConfig.twistSchedule.find(b => b.id === 't1').episode).toBe(newLast);
    expect(seasonConfig.twistSchedule.find(b => b.id === 't2').episode).toBe(firstBomb);
    // The tile says so.
    renderTimeline();
    expect(document.getElementById('fd-timeline').innerHTML).toContain('pmSetArrivals(');
    // …and its badge counts the one who walked in, from the season that will play.
    const { perfectMatchNights } = await import('../js/pm-run.js');
    expect(perfectMatchNights().get(second).arrived).toBe(1);
    // Back to the season's own.
    pmSetArrivals(second, '');
    expect(perfectMatchEpisodes().length).toBe(before.length);
    expect(seasonConfig.twistSchedule.find(b => b.id === 't1').episode).toBe(lastVote);
    seasonConfig.twistSchedule = [];
    seasonConfig.pmArrivalCounts = {};
  });
});
