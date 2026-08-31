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
  seasonWinners, isSeasonWinner,
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
    const expected = (players.players || []).filter(p =>
      (p.seasonDetails || []).some(d => d.format === 'big-brother')).length;
    expect(careersIn(players, 'big-brother')).toHaveLength(expected);
    expect(careersIn(players, 'all').length).toBeGreaterThan(140);
  });

  it('RECOMPUTES career totals rather than reading the cross-format ones', () => {
    // The rule that matters. A player's `totalChallengeWins` folds their Big
    // Brother competition wins in with their Total Drama ones — using it under a
    // filter reports seasons the filter just excluded.
    const source = players.players[0];
    const detail = source.seasonDetails[0];
    const both = {
      ...source,
      id: 'cross-format-fixture',
      totalSeasons: 2,
      seasonDetails: [
        { ...detail, season: 1, format: 'total-drama', challengeWins: 2 },
        { ...detail, season: 1, format: 'big-brother', challengeWins: 1 },
      ],
    };
    const fixture = { ...players, players: [both] };

    const td = careersIn(fixture, 'total-drama').find(c => c.id === both.id);
    const bb = careersIn(fixture, 'big-brother').find(c => c.id === both.id);
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
    expect(compRecords([doc([{ week: 1 }])], {})).toEqual([]);
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

// ══════════════════════════════════════════════════════════════════════
// Co-winners
// ══════════════════════════════════════════════════════════════════════
//
// `winner{}` on a season document is SINGULAR, and every reader in the repo
// was written against that. It stopped being true twice: Total Drama season 8
// ended with two champions, and The Traitors ends with the pot split between
// however many are left standing — the engine's own figures put a lone taker
// at 158 of 400 seasons, so a split is the NORMAL ending, not the exception.
//
// The rule these tests hold is one sentence: a reader may report every winner
// the record names, or report that it does not know, and may never choose one.
// `winners[0]` is choosing one with an extra step in front of it.
describe('everybody who won a season', () => {
  it('reads the plural field, the singular one, or the standings', () => {
    // Three sources, because three shapes exist in the wild: a Traitors
    // document declares `winners[]`, every document written before that field
    // existed has `winner{}`, and a season index row has one of those and no
    // placements at all. Whichever the caller is holding, it gets the full set.
    expect(seasonWinners({ winners: [{ name: 'A' }, { name: 'B' }] }).map(w => w.name))
      .toEqual(['A', 'B']);
    expect(seasonWinners({ winner: { name: 'A', playerSlug: 'a' } }).map(w => w.name))
      .toEqual(['A']);
    expect(seasonWinners({ placements: [
      { name: 'A', placement: 1 }, { name: 'B', placement: 1 }, { name: 'C', placement: 3 },
    ] }).map(w => w.name)).toEqual(['A', 'B']);
    // A bare name is how the archive's older records say it.
    expect(seasonWinners({ winner: 'A' }).map(w => w.name)).toEqual(['A']);
    // And a season nobody has finished says nothing rather than guessing.
    expect(seasonWinners({ placements: [{ name: 'A', placement: 2 }] })).toEqual([]);
    expect(seasonWinners(null)).toEqual([]);
    expect(isSeasonWinner({ winners: [{ name: 'B' }] }, 'B')).toBe(true);
    expect(isSeasonWinner({ winners: [{ name: 'B' }] }, 'A')).toBe(false);
  });

  it('names BOTH of season 8, off the season document as it is published', () => {
    // Not a hypothetical and not the new show: this file has been on disk since
    // season 8 aired, with Alejandro and Cameron both on placement 1 and only
    // Alejandro in `winner{}`. Every page that asked the document who won has
    // been answering Cameron's own season with somebody else's name.
    const doc = j('data/seasons/season8-data.json');
    const firsts = doc.placements.filter(p => p.placement === 1).map(p => p.name);
    expect(firsts, 'season 8 is the co-winner fixture; it must stay one')
      .toEqual(['Alejandro', 'Cameron']);
    expect(seasonWinners(doc).map(w => w.name)).toEqual(firsts);
    // The tally and the runner-up belong to the player the block names, and to
    // nobody else. Cameron did not beat Sanders 4-4; Alejandro did.
    const [ale, cam] = seasonWinners(doc);
    expect(ale.vote).toBe(doc.winner.vote);
    expect(ale.runnerUp).toBe(doc.winner.runnerUp);
    expect(cam.vote).toBe('');
    expect(cam.runnerUp).toBe(null);
  });

  it('gives the champions board one row per WINNER, not per season', () => {
    // The board mapped `s.winner`, of which there is one, so a co-winner was
    // dropped on the floor between the record and the page.
    const db = { seasons: [
      { seasonNumber: 1, title: 'Solo', winner: { name: 'A', playerSlug: 'a', vote: '4-3' } },
      { seasonNumber: 2, title: 'Split', winner: null,
        winners: [{ name: 'B', playerSlug: 'b' }, { name: 'C', playerSlug: 'c' },
          { name: 'D', playerSlug: 'd' }, { name: 'E', playerSlug: 'e' }] },
    ] };
    const champs = championsIn(db, 'all');
    expect(champs.map(c => c.winner)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(champs.filter(c => c.season === 2).map(c => c.coWinners)).toEqual([4, 4, 4, 4]);
    expect(champs.find(c => c.winner === 'A').coWinners).toBe(1);
    // ...and it says so for a real one too.
    const eight = championsIn(seasonsDb, 'total-drama').filter(c => c.season === 8);
    expect(eight.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The two pages that read the winner out of a document directly
// ══════════════════════════════════════════════════════════════════════
//
// `season_ref.html` and `voting-analytics.html` are page scripts: they cannot
// be imported, and the render path wants a fetch and a DOM. So each one's
// winner-resolution statement is EXTRACTED from the source by its anchor and
// RUN here against a split season. That is not a text match — the assertions
// below are about what the code returns — but the anchor doubles as one: if
// somebody puts `s.winner.name` back, the statement stops existing and this
// fails on the extraction rather than passing quietly.
//
// The bug being held off is a crash, not a wrong word. `season_ref.html` read
// `s.winner.name` straight into the hero headline, so a season that ended in a
// split (`winner: null`, four names in `winners[]`) died on a TypeError before
// the page drew anything at all.
describe('the pages that read a winner off the document', () => {
  const SPLIT = {
    castSize: 20, episodeCount: 9, winner: null,
    winners: [{ name: 'B', playerSlug: 'b' }, { name: 'C', playerSlug: 'c' },
      { name: 'D', playerSlug: 'd' }, { name: 'E', playerSlug: 'e' }],
    placements: [
      { name: 'B', playerSlug: 'b', placement: 1 }, { name: 'C', playerSlug: 'c', placement: 1 },
      { name: 'D', playerSlug: 'd', placement: 1 }, { name: 'E', playerSlug: 'e', placement: 1 },
      { name: 'F', playerSlug: 'f', placement: 5 },
    ],
  };
  /** The statement starting at `anchor`, up to and including its terminator. */
  const stmt = (src, anchor, end) => {
    const i = src.indexOf(anchor);
    expect(i, `${anchor} — the page no longer resolves the winner this way`)
      .toBeGreaterThan(-1);
    const j = src.indexOf(end, i);
    expect(j).toBeGreaterThan(i);
    return src.slice(i, j + end.length);
  };

  it('season_ref draws a hero for a season nobody singular won', () => {
    const src = readFileSync(join(process.cwd(), 'season_ref.html'), 'utf8');
    const code = stmt(src, 'const _won=', '.filter(w=>w&&w.name);');
    // Run it with no `window.seasonWinners`, which is the file:// case AND the
    // harsher one: the page's own fallback has to hold the rule by itself.
    const won = new Function('s', 'window', `${code} return _won;`)(SPLIT, {});
    expect(won.map(w => w.name)).toEqual(['B', 'C', 'D', 'E']);
    // ...and it survives a season with neither field rather than throwing.
    expect(new Function('s', 'window', `${code} return _won;`)({}, {})).toEqual([]);
    /* ── AND THE FALLBACK HOLDS THE RULE, NOT AN INVERSION OF IT ──────
       The fixture above sets `winner: null`, so it never once exercised the
       branch where a document has BOTH a singular winner and two placements
       at 1 — which is season 8, live, today. On that shape the fallback read
       the singular block first and drew Alejandro alone: right with the
       module loaded, wrong without it, and this test could not tell. Most
       complete first: winners[] -> placements at 1 -> winner{}. */
    const run = doc => new Function('s', 'window', `${code} return _won;`)(doc, {});
    const SEASON_8 = {
      winner: { name: 'Alejandro', playerSlug: 'alejandro' },
      placements: [
        { name: 'Alejandro', playerSlug: 'alejandro', placement: 1 },
        { name: 'Cameron', playerSlug: 'cameron', placement: 1 },
        { name: 'Sanders', playerSlug: 'sanders', placement: 3 },
      ],
    };
    expect(run(SEASON_8).map(w => w.name),
      'the page fallback names one of season 8 two champions')
      .toEqual(['Alejandro', 'Cameron']);
    // `winners[]` outranks both, the way js/records.js orders them.
    expect(run({ ...SEASON_8, winners: [{ name: 'Zed' }] }).map(w => w.name))
      .toEqual(['Zed']);
    // And a document with only the singular block still resolves it.
    expect(run({ winner: { name: 'Solo' } }).map(w => w.name)).toEqual(['Solo']);
    // ...including the bare-string form some older records carry.
    expect(run({ winner: 'Older' }).map(w => w.name)).toEqual(['Older']);

    /* ── AND NOTHING ON THE PAGE DEREFERENCES THE SINGULAR BLOCK ──────
       This was one negative match on one byte sequence — `accent">🏆
       ${s.winner.name}` — so reintroducing the identical crash forty-five
       lines further down, in the winner card, was invisible. The bug is a
       DEREFERENCE of a field that is null on a split season, wherever it is
       written, so the whole file is swept for one. `s.winner?.x` and
       `s.winner&&s.winner.x` are guarded and allowed. */
    // Comments stripped: the note explaining this very bug quotes the shape,
    // and a source-text sweep that counts comments checks the wrong thing.
    // CRLF first -- `.` does not match a carriage return, so the line-comment
    // strip matches nothing at all on a CRLF file.
    const codeOnly = src.replace(/\r\n?/g, '\n')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .split('\n').map(l => l.replace(/(^|\s)\/\/.*$/, '')).join('\n');
    const unguarded = codeOnly.split('\n').filter((line) => {
      const at = line.search(/s\.winner\.[a-zA-Z]/);
      if (at < 0) return false;
      // GUARDED ON THE SAME LINE, which is the only place a guard reaches a
      // template expression. An earlier `const w = s.winner` on some other
      // line is not a guard, and allowing it let the identical crash back in
      // forty-five lines further down.
      return !/s\.winner\s*(&&|\?)|typeof\s+s\.winner/.test(line.slice(0, at + 8));
    }).map(l => l.trim().slice(0, 90));
    expect(unguarded,
      'an unguarded `s.winner.x` — null on a split season, which is a TypeError '
      + 'before the page draws anything')
      .toEqual([]);
    // The hero and the winner card read the resolved list.
    expect(src).toContain('${_won.map(w=>w.name).join(" &amp; ")}');
    expect(src).toContain('${_won.map(x=>{');
  });

  it('voting-analytics captions every winner, not placements[0]', () => {
    const src = readFileSync(join(process.cwd(), 'voting-analytics.html'), 'utf8');
    const code = stmt(src, 'const winners = placements.filter', ".join(' & ');");
    const run = (placements, data) =>
      new Function('placements', 'data', `${code} return [winners, winner];`)(placements, data);
    const [ws, caption] = run(SPLIT.placements, SPLIT);
    expect(ws).toEqual(['B', 'C', 'D', 'E']);
    expect(caption).toBe('B & C & D & E');
    // A season with one winner still reads as one.
    const [one, solo] = run([{ name: 'A', placement: 1 }, { name: 'Z', placement: 2 }], {});
    expect(one).toEqual(['A']);
    expect(solo).toBe('A');
    // And with no standings at all it falls back to the block, never to the
    // first row of a list it did not sort for this purpose.
    expect(run([], { winner: { name: 'A' } })[1]).toBe('A');
    expect(src).not.toContain("placements[0]?.name");
  });
});
