// Records, per show.
//
// franchise_database.json holds them as precomputed ALL-SHOWS aggregates, so the
// Franchise page could not be filtered — the per-show figures were never in the
// file. This engine derives them from the documents that carry a format on every
// row, which makes scoping a predicate instead of a second set of files.
//
// Two rules are load-bearing and both have tests below:
//
//   1. A career total under a show filter must be RECOMPUTED, never read off the
//      player's top-level fields — those are cross-format sums by design.
//   2. Trivia stays silent when it does not know. Most of the roster has no age,
//      and "youngest winner" computed over three of nineteen players is a
//      sentence that sounds true and is not.
import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  careersIn, careerBoards, seasonsIn, championsIn, milestonesIn,
  returneesIn, triviaIn, bioOf, compRecords, franchiseRecords,
} from '../js/records.js';

const j = p => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'));
let players, seasonsDb, roster, voices;

beforeAll(() => {
  players = j('players_database.json');
  seasonsDb = j('seasons_database.json');
  roster = j('franchise_roster.json');
  voices = j('voice-profiles.json').profiles;
});

describe('scoping to one show', () => {
  it('counts only the seasons that show has played', () => {
    expect(seasonsIn(seasonsDb, 'big-brother')).toHaveLength(1);
    expect(seasonsIn(seasonsDb, 'total-drama')).toHaveLength(14);
    expect(seasonsIn(seasonsDb, 'all')).toHaveLength(15);
  });

  it('counts only the people who played it', () => {
    expect(careersIn(players, 'big-brother')).toHaveLength(18);
    expect(careersIn(players, 'all').length).toBeGreaterThan(140);
  });

  it('RECOMPUTES career totals rather than reading the cross-format ones', () => {
    // The rule that matters. A player's `totalChallengeWins` folds their Big
    // Brother competition wins in with their Total Drama ones — using it under a
    // filter reports seasons the filter just excluded.
    const both = (players.players || []).find(p => {
      const f = new Set((p.seasonDetails || []).map(d => d.format || 'total-drama'));
      return f.size > 1;
    });
    expect(both, 'nobody has played both shows — this test needs one').toBeTruthy();

    const td = careersIn(players, 'total-drama').find(c => c.id === both.id);
    const bb = careersIn(players, 'big-brother').find(c => c.id === both.id);
    expect(td.seasonsPlayed + bb.seasonsPlayed).toBe(both.seasonDetails.length);
    expect(td.seasonsPlayed).toBeLessThan(both.totalSeasons);
    // and the per-show figure is genuinely smaller than the career one
    expect(bb.challengeWins).toBeLessThanOrEqual(both.totalChallengeWins || 0);
  });

  it('names each show its own champions', () => {
    const bb = championsIn(seasonsDb, 'big-brother');
    expect(bb).toHaveLength(1);
    expect(bb[0].winner).toBeTruthy();
    expect(championsIn(seasonsDb, 'total-drama')).toHaveLength(14);
  });

  it('counts a returnee by the show being looked at', () => {
    // Somebody with one Total Drama season and one Big Brother season is not a
    // returnee of either.
    const bb = returneesIn(careersIn(players, 'big-brother'));
    for (const r of bb) expect(r.seasonsPlayed).toBeGreaterThan(1);
    const all = returneesIn(careersIn(players, 'all'));
    expect(all.length).toBeGreaterThanOrEqual(bb.length);
  });
});

describe('the boards', () => {
  it('rank the way each board says it does', () => {
    const boards = careerBoards(careersIn(players, 'total-drama'));
    expect(boards).toHaveLength(8);
    for (const b of boards) {
      const vals = b.rows.slice(0, 5).map(b.value);
      const sorted = b.key === 'avgPlace'
        ? [...vals].sort((a, x) => a - x)
        : [...vals].sort((a, x) => x - a);
      expect(vals, `${b.label} is not in order`).toEqual(sorted);
    }
  });

  it('keeps the average-placement board to players with a career', () => {
    const board = careerBoards(careersIn(players, 'all')).find(b => b.key === 'avgPlace');
    for (const r of board.rows) expect(r.seasonsPlayed).toBeGreaterThanOrEqual(2);
  });
});

describe('single-season milestones', () => {
  it('finds the best anybody has done in one go', () => {
    const rows = milestonesIn(careersIn(players, 'total-drama'), 'total-drama');
    const chal = rows.find(r => r.category.startsWith('Most Challenge Wins'));
    expect(chal.holder).toBeTruthy();
    expect(chal.stat).toMatch(/\d+ wins/);
  });

  it('asks "fewest votes to win" of WINNERS only', () => {
    // Otherwise it is just whoever went home first, having been voted for once.
    const rows = milestonesIn(careersIn(players, 'all'), 'all');
    const fewest = rows.find(r => r.category === 'Fewest Votes to Win');
    const career = careersIn(players, 'all').find(c => c.id === fewest.playerSlug);
    expect(career.wins).toBeGreaterThan(0);
  });
});

describe('trivia', () => {
  it('states firsts from the chronology', () => {
    const careers = careersIn(players, 'total-drama');
    const { trivia } = triviaIn(careers, seasonsDb, 'total-drama', {});
    const first = trivia.find(t => t.fact === 'First winner');
    expect(first.holder).toBe(championsIn(seasonsDb, 'total-drama')[0].winner);
  });

  it('says nothing about age when nobody has one', () => {
    // THE RULE. Total Drama's cast predates the bio fields entirely, so every
    // age question must be absent rather than answered from three players.
    const careers = careersIn(players, 'total-drama');
    const { trivia } = triviaIn(careers, seasonsDb, 'total-drama', {});
    expect(trivia.some(t => /youngest|oldest/i.test(t.fact))).toBe(false);
  });

  it('answers age questions once the data exists', () => {
    const careers = careersIn(players, 'all');
    // Two players with an age is the minimum for "youngest" to mean anything.
    const bios = {};
    careers.slice(0, 4).forEach((c, i) => { bios[c.id] = { age: 20 + i * 5 }; });
    const { trivia } = triviaIn(careers, seasonsDb, 'all', bios);
    const young = trivia.find(t => t.fact === 'Youngest to play');
    expect(young.holder).toBe(careers[0].name);
    expect(young.detail).toContain('20');
  });

  it('reads a bio from the roster, or from the voice profile it used to live in', () => {
    // The Casting Studio wrote these facts into the voice profile's opening
    // sentence for years before they became columns. Without the fallback every
    // demographic question is empty until somebody re-publishes the roster.
    const jane = bioOf('jane', { roster, voices });
    expect(jane.age).toBe(21);
    expect(jane.ethnicity).toBe('Asian');
    expect(bioOf('nobody-at-all', { roster, voices }).age).toBe(null);
  });
});

describe('records for one named competition', () => {
  // "Who is the youngest player ever to win the Wall" — the question a comp with
  // a name exists to be asked. It needs the season document to say WHICH comp
  // was played, which the export only started recording alongside this.
  const doc = (weeks) => ({ seasonNumber: 2, weeks });

  it('groups wins by the competition, across seasons', () => {
    const recs = compRecords([
      doc([{ week: 1, hohComp: { id: 'the-wall', name: 'The Wall', winner: 'Ann' } },
           { week: 2, hohComp: { id: 'the-wall', name: 'The Wall', winner: 'Bo' } }]),
      doc([{ week: 1, hohComp: { id: 'the-wall', name: 'The Wall', winner: 'Ann' } }]),
    ], {});
    const wall = recs.find(r => r.id === 'the-wall');
    expect(wall.played).toBe(3);
    expect(wall.mostWins).toMatchObject({ name: 'Ann', count: 2 });
    expect(wall.first.winner).toBe('Ann');
  });

  it('answers youngest and oldest ONLY where ages are on file', () => {
    const weeks = [
      { week: 1, hohComp: { id: 'the-wall', name: 'The Wall', winner: 'Ann' } },
      { week: 2, hohComp: { id: 'the-wall', name: 'The Wall', winner: 'Bo' } },
    ];
    const noAges = compRecords([doc(weeks)], {}).find(r => r.id === 'the-wall');
    expect(noAges.youngest, 'invented a youngest from no ages').toBe(null);
    expect(noAges.agesKnown).toBe(0);

    const withAges = compRecords([doc(weeks)], { ann: { age: 32 }, bo: { age: 19 } })
      .find(r => r.id === 'the-wall');
    expect(withAges.youngest.winner).toBe('Bo');
    expect(withAges.oldest.winner).toBe('Ann');
  });

  it('keeps the veto competitions apart from the HOH ones', () => {
    const recs = compRecords([doc([{
      week: 1,
      hohComp: { id: 'the-wall', name: 'The Wall', winner: 'Ann' },
      vetoComp: { id: 'otev', name: 'OTEV', winner: 'Bo' },
    }])], {});
    expect(recs.find(r => r.id === 'the-wall').slot).toBe('Head of Household');
    expect(recs.find(r => r.id === 'otev').slot).toBe('Veto');
  });

  it('says nothing at all about a season that never recorded its comps', () => {
    // Every season published before the export carried comp names — including
    // Big Brother 1. Silence is the honest answer; an empty Wall record would
    // imply nobody has ever won it.
    const bb1 = j('data/seasons/bb-1-data.json');
    expect(bb1.weeks[0].hohComp, 'bb-1 gained comp names — update this test').toBe(undefined);
    expect(compRecords([bb1], {})).toEqual([]);
  });
});

describe('the whole view the page draws', () => {
  it('is internally consistent for each show', () => {
    for (const format of ['all', 'total-drama', 'big-brother']) {
      const v = franchiseRecords({ players, seasonsDb, roster, voices, format });
      expect(v.stats.seasons).toBe(v.seasons.length);
      expect(v.stats.players).toBe(v.careers.length);
      expect(v.stats.appearances)
        .toBe(v.careers.reduce((n, c) => n + c.seasonsPlayed, 0));
      expect(v.champions.length).toBeLessThanOrEqual(v.seasons.length);
      expect(v.boards).toHaveLength(8);
    }
  });

  it('adds up: the two shows account for every appearance', () => {
    const all = franchiseRecords({ players, seasonsDb, format: 'all' });
    const td = franchiseRecords({ players, seasonsDb, format: 'total-drama' });
    const bb = franchiseRecords({ players, seasonsDb, format: 'big-brother' });
    expect(td.stats.appearances + bb.stats.appearances).toBe(all.stats.appearances);
    expect(td.stats.seasons + bb.stats.seasons).toBe(all.stats.seasons);
  });
});
