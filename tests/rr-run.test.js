// rr-run.test.js — The Ridonculous Race is REACHABLE from the run tab: the flag, the teams read off the cast cards,
// one leg per press, a reload, what the hub reads, and what the franchise keeps.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, formatIsRunnable } from '../js/core.js';
import { SHOWS } from '../js/shows.js';
import { isRaceSeason, raceTeams, raceCastProblem, simulateRaceEpisode, raceEpisodesLeft, lastRaceRefusal,
  raceSeasonShape, raceEpisodeMap, raceVoteShape } from '../js/rr-run.js';
import { setFranchiseLedger, activeSeasons } from '../js/franchise-meta.js';
import { raceCast } from './helpers/rr-cast.js';

// a cast built the way the Casting Room builds it: two cards that name each other, the team's fields on its cards
function cards(nTeams = 8, seed = 5) {
  const { cast, teams } = raceCast(nTeams, seed);
  const byName = Object.fromEntries(cast.map(p => [p.name, { ...p }]));
  for (const t of teams) {
    byName[t.a].rrPartner = t.b; byName[t.b].rrPartner = t.a;
    byName[t.a].rrRel = t.rel;
    if (t.identity) byName[t.b].rrIdentity = t.identity;
  }
  return { list: Object.values(byName), teams };
}
function freshSeason(nTeams = 8, { seasonNumber = 1, ledger = true } = {}) {
  Object.assign(seasonConfig, { format: 'ridonculous-race', seasonNumber, twistSchedule: [], name: null, rrTeams: null });
  const { list, teams } = cards(nTeams);
  setPlayers(list);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], rr: { seed: 404 }, seasonNumber });
  if (ledger) setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
  return teams;
}
function playAll() {
  const aired = [];
  for (let i = 0; i < 40; i++) { const row = simulateRaceEpisode(); if (!row) break; aired.push(row); }
  return aired;
}

describe('The Ridonculous Race is registered and can be started', () => {
  it('has its registry entry: prefix rr, Don hosting, the calendar, its words', () => {
    const s = SHOWS['ridonculous-race'];
    expect(s.prefix).toBe('rr');
    expect(s.words.round).toBe('Leg');
    expect(s.words.host).toBe('Don');
    expect(s.airSlots?.length).toBeGreaterThan(0);
    expect(typeof s.airNight).toBe('number');
  });

  it('importing rr-run IS the wiring: the flag is set and the show reads as runnable', () => {
    expect(window._rrRunnable).toBe(true);
    expect(formatIsRunnable({ format: 'ridonculous-race' })).toBe(true);
    freshSeason();
    expect(isRaceSeason()).toBe(true);
  });
});

describe('the teams come off the cast cards', () => {
  it('two cards that name each other are a team, with the relationship and identity either card carries', () => {
    const teams = freshSeason();
    const got = raceTeams();
    expect(got.length).toBe(teams.length);
    for (const t of teams) {
      const g = got.find(x => [x.a, x.b].sort().join() === [t.a, t.b].sort().join());
      expect(g, `${t.a} & ${t.b}`).toBeTruthy();
      expect(g.rel).toBe(t.rel);
      expect(g.identity).toBe(t.identity);
    }
    expect(raceCastProblem()).toBe(null);
  });

  it('refuses a cast with somebody unpaired, or too few teams, and says why', () => {
    freshSeason(8);
    const { list } = cards(8);
    delete list[0].rrPartner;
    setPlayers(list);
    expect(raceCastProblem()).toMatch(/partner/);
    expect(simulateRaceEpisode()).toBe(null);
    expect(lastRaceRefusal()).toMatch(/partner/);
    freshSeason(4);
    expect(raceCastProblem()).toMatch(/six teams/);
  });
});

describe('a season plays one leg per press', () => {
  it('airs every leg and the final, then stops, and names the winners', () => {
    freshSeason(8);
    const shape = raceSeasonShape();
    const aired = playAll();
    expect(aired.length).toBe(shape.length);
    expect(aired.map(r => r.num)).toEqual(aired.map((_, i) => i + 1));
    expect(aired.at(-1).rr.final).toBeTruthy();
    expect(aired.at(-1).winner).toBeTruthy();
    expect(raceEpisodesLeft()).toBe(0);
    expect(gs.phase).toBe('complete');
    // every leg carries what aired, and its words
    for (const r of aired) expect(r.rr.aired.segments.some(s => s.lines?.length), `leg ${r.num}`).toBe(true);
    // what is saved is rows, never the engine's state
    expect(gs.rr.state).toBeUndefined();
    expect(JSON.stringify(gs).length).toBeLessThan(8_000_000);
    expect(raceEpisodeMap().map(t => t.ep)).toEqual(shape.map(d => d.n));
  });

  it('an elimination leg names who left, both of them, and the hub says it in race words', () => {
    freshSeason(8);
    const aired = playAll();
    const elim = aired.find(r => r.rr.kind === 'elim' && r.exits.length);
    expect(elim.exits.length).toBe(2);
    expect(raceVoteShape(elim)).toMatch(/first|won/i);
    expect(raceVoteShape(elim)).not.toMatch(/vote|tribal|immunity/i);
  });

  it('a queue lost to a reload rebuilds the SAME season and keeps what aired', () => {
    freshSeason(8);
    const first = [simulateRaceEpisode(), simulateRaceEpisode()];
    delete gs._rrQueue;
    const next = simulateRaceEpisode();
    expect(next.num).toBe(3);
    freshSeason(8);
    const whole = playAll();
    expect(JSON.stringify(whole[2].rr.order)).toBe(JSON.stringify(next.rr.order));
    expect(first.map(r => r.num)).toEqual([1, 2]);
  });
});

describe('the franchise keeps it', () => {
  it('the last leg writes the season to the ledger', () => {
    freshSeason(8, { seasonNumber: 3 });
    playAll();
    const keys = Object.keys(activeSeasons() || {});
    expect(keys.some(k => /^rr-3$/.test(k)), keys.join(',')).toBe(true);
  });
});
