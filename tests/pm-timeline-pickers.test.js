// @vitest-environment jsdom
// The Season Timeline tells you what each night can be, and lets you change
// it (user: "do both as twists … and fix the fact that nothing tells me
// this"): a Dumping picker on every vote night, Arrivals on every bombshell
// night, Returns on every recoupling — each "as drawn" until you pick. And
// the second chance plays: several dumped come back, one of each side stays.
import { describe, expect, it } from 'vitest';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

describe('the Season Timeline pickers', () => {
  it('every vote, bombshell and recoupling tile says how it plays, and booking one changes it', async () => {
    const { gs, setGs, setPlayers, seasonConfig, players, relationships, TWIST_CATALOG, seasonFormat, selectedEpisodes } = await import('../js/core.js');
    const { pStats, pronouns, ordinal, romanticCompat } = await import('../js/players.js');
    const { getBond, getPerceivedBond, bKey, bondLabel } = await import('../js/bonds.js');
    const { perfectMatchEpisodes, perfectMatchBookings } = await import('../js/pm-run.js');
    const { renderTimeline, pmSetTwist } = await import('../js/run-ui.js');
    Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, pmRoleCounts: {}, pmArrivalCounts: {}, twistSchedule: [] });
    setPlayers(makeIslanders(22, 5));
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], pm: { seed: 3004 } });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, TWIST_CATALOG, seasonFormat, selectedEpisodes,
      pStats, pronouns, ordinal, romanticCompat, getBond, getPerceivedBond, bKey, bondLabel });
    document.body.innerHTML = '<div id="fd-timeline"></div>';
    renderTimeline();
    const html = document.getElementById('fd-timeline').innerHTML;
    const eps = perfectMatchEpisodes();
    const votes = eps.filter(e => e.slot).length, bombs = eps.filter(e => e.moment === 'bombshell').length;
    expect((html.match(/pmSetTwist\(\d+,'dump'/g) || []).length).toBe(votes);
    expect((html.match(/pmSetTwist\(\d+,'arrive'/g) || []).length).toBe(bombs);
    expect(html).toMatch(/pmSetTwist\(\d+,'return'/);
    // It says what the season drew.
    expect(html).toMatch(/As drawn: [A-Z]/);
    // The first vote never offers a format that sends a couple home.
    const v1 = eps.find(e => e.slot === 'vote1').ep;
    const tile = html.split(`pmSetTwist(${v1},'dump'`)[1].split('</select>')[0];
    expect(tile).toContain('Save One');
    expect(tile).not.toContain('The Favourites Decide');
    expect(tile).not.toContain('Straight Public Vote');
    // Book Save One on it: it is on the schedule, and the tile shows it chosen.
    pmSetTwist(v1, 'dump', 'pm-save-one');
    expect(seasonConfig.twistSchedule.filter(b => Number(b.episode) === v1).map(b => b.type)).toEqual(['pm-save-one']);
    // …and a second pick replaces it, never stacks.
    pmSetTwist(v1, 'dump', 'pm-cross-gender');
    expect(seasonConfig.twistSchedule.filter(b => Number(b.episode) === v1).map(b => b.type)).toEqual(['pm-cross-gender']);
    pmSetTwist(v1, 'dump', '');
    expect(seasonConfig.twistSchedule.filter(b => Number(b.episode) === v1)).toEqual([]);
    // A second chance booked on a recoupling becomes that night's one-off.
    const rc = eps.find(e => e.moment === 'recoupling' && e.ep > 8 && !e.finalRecoupling).ep;
    pmSetTwist(rc, 'return', 'pm-second-chance-villa');
    expect(perfectMatchBookings()[rc]).toMatchObject({ oneOff: 'second-chance', scDecider: 'villa' });
  });
});

describe('the second chance', () => {
  it('several dumped islanders come back, one of each side stays, the rest go home again', async () => {
    const { setPlayers } = await import('../js/core.js');
    const { playPerfectMatchSeason } = await import('../js/pm/season.js');
    let played = 0;
    for (const [seed, decider] of [[1, 'public'], [2, 'villa'], [3, 'villa'], [4, 'public']]) {
      const cast = makeIslanders(22, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed, bookings: { 13: { oneOff: 'second-chance', scDecider: decider } } });
      const r = rows.find(x => x.num === 13);
      const arrive = r.pm.events.find(e => e.kind === 'sc-arrive');
      if (!arrive) continue;
      played++;
      const stay = r.pm.events.filter(e => e.kind === 'sc-stay').map(e => e.players[0]);
      const leave = r.pm.events.filter(e => e.kind === 'sc-leave').map(e => e.players[0]);
      expect(stay.length).toBeGreaterThanOrEqual(1);
      expect(stay.length).toBeLessThanOrEqual(2);
      expect([...stay, ...leave].sort()).toEqual([...arrive.players].sort());
      expect(r.pm.events.find(e => e.kind === 'sc-rules').extra.of).toBe(decider);
      // Those kept are in the villa after the night; the rest are not.
      const after = rows.find(x => x.num === 14);
      if (after) for (const n of leave) expect(after.pm.villa || []).not.toContain(n);
    }
    expect(played).toBeGreaterThan(0);
  });
});
