// ══════════════════════════════════════════════════════════════════════
// tr-rankings.test.js — the board, the feed's vocabulary, and the fame
// ══════════════════════════════════════════════════════════════════════
//
// Three things a finished season is supposed to produce once it is published,
// none of which the engine writes for itself: a row on a ranking board, an
// audience talking about it in the right words, and a fame reading.
//
// THE BOARD RANKS ONE SHOW. Big Brother's first seventeen players were applied
// into `rankings_database.json`, which says `metadata.format: "total-drama"`
// about itself, and landed at ranks 13, 26 and 28 among contestants while every
// correct reader refused to draw them. The scores are not comparable and are
// not meant to be — this show's rubric prices a Shield against a murder ballot,
// which is not a sentence about either other show.
//
// EVERY FIGURE IS READ, NEVER RECOMPUTED. The seasons here are real ones from
// `playTraitorsSeason`; placements, ballots and channels come off the export as
// the engine wrote them. The one arm that computes anything of its own — the
// independence measurement — computes a RIVAL column so the two can be
// contrasted, and asserts against literal thresholds rather than against
// anything the code under test produced.
import { describe, expect, it, vi } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { SHOWS, DEFAULT_FORMAT, exitVerbs, showWords, formatPrefix } from '../js/shows.js';
import { BOARD_FILES, boardFile, boardFormat, loadRankingBoards, findRankEntry }
  from '../js/ranking-boards.js';
import { RU_SHOW, _ruRubric, computeScore, placementPct, buildSeasonReasoning }
  from '../js/rankings-update.js';
import { words, eventLabel, pollQuestions } from '../js/social/adapter.js';
import { GENERIC_TAKES, LENS_TAKES, TAKES } from '../js/social/chat.js';
import { TRAIT_TAKES } from '../js/social/voices.js';
import { archiveEpisode, episodesOf } from '../js/social/archive.js';
import { computeFame, fameTerm, normaliseStatus, PLACEMENT_BASE } from '../js/fame.js';
import { followerHistory } from '../js/dramagram.js';
import {
  TRAITORS_FORMAT, buildTraitorsSeasonDocument, traitorsPlacements,
  traitorsSeasonDetails, traitorsVotingHistory,
} from '../js/tr/export.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Eight real seasons, played once and shared. */
const SEASONS = SEEDS.map(seed => {
  setPlayers(ROSTER);
  return playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
});
const DOCS = SEASONS.map(s => buildTraitorsSeasonDocument(s, { seasonNumber: 1 }));
const FORMATS = Object.keys(SHOWS);

// ══ the board file ════════════════════════════════════════════════════

describe('a board ranks one show', () => {
  it("gives The Traitors its own file and never the default show's", () => {
    expect(boardFile(TRAITORS_FORMAT)).toBe('rankings_tr.json');
    // The named failure. `rankings_database.json` declares itself Total
    // Drama's; anything else applied into it is interleaved through somebody
    // else's ranks on somebody else's rubric.
    expect(boardFile(TRAITORS_FORMAT)).not.toBe(BOARD_FILES[DEFAULT_FORMAT]);
  });

  it('never points two shows at the same file', () => {
    const files = Object.values(BOARD_FILES);
    expect(new Set(files).size, `two shows share a board: ${files.join(', ')}`)
      .toBe(files.length);
  });

  it("names every non-default board with that show's own prefix", () => {
    // The bare-integer rule applied to a filename: an unprefixed name is Total
    // Drama permanently, so a second show whose board forgets its prefix does
    // not fail — it lands on top of the first show's.
    for (const [format, file] of Object.entries(BOARD_FILES)) {
      if (format === DEFAULT_FORMAT) continue;
      expect(file, `${format}'s board is not namespaced`)
        .toBe(`rankings_${formatPrefix(format)}.json`);
    }
  });

  it('every board file belongs to a registered show', () => {
    for (const format of Object.keys(BOARD_FILES)) {
      expect(SHOWS[format], `${format} has a board and is not in the registry`).toBeTruthy();
    }
  });
});

describe('loading the boards', () => {
  const board = format => ({
    metadata: { format },
    rankings: [{ playerId: 'someone', name: 'Someone', tier: 'A' }],
  });

  it('skips a show that has no board yet without failing', async () => {
    // A SHOW WITH NO FINISHED SEASON HAS NO BOARD AND THAT IS NOT AN ERROR.
    // The alternative is that adding a show breaks every page that draws
    // rankings until somebody finishes a season of it.
    const fetched = [];
    vi.stubGlobal('fetch', async url => {
      fetched.push(url);
      if (url.endsWith('rankings_tr.json')) return { ok: false, status: 404 };
      return { ok: true, json: async () => board(url.includes('_bb') ? 'big-brother' : DEFAULT_FORMAT) };
    });
    const boards = await loadRankingBoards();
    vi.unstubAllGlobals();
    expect(fetched, 'the Traitors board was never even asked for')
      .toContain('rankings_tr.json');
    expect(boards.map(b => boardFormat(b))).toEqual([DEFAULT_FORMAT, 'big-brother']);
  });

  it('reads the Traitors board as the Traitors board once it exists', async () => {
    vi.stubGlobal('fetch', async url => (url.endsWith('rankings_tr.json')
      ? { ok: true, json: async () => board(TRAITORS_FORMAT) }
      : { ok: false, status: 404 }));
    const boards = await loadRankingBoards();
    vi.unstubAllGlobals();
    expect(boards).toHaveLength(1);
    expect(boardFormat(boards[0])).toBe(TRAITORS_FORMAT);
    // And a reader scoped to another show must not find a castle player on it.
    expect(findRankEntry(boards, { id: 'someone', format: DEFAULT_FORMAT })).toBeNull();
    expect(findRankEntry(boards, { id: 'someone', format: TRAITORS_FORMAT })).toBeTruthy();
  });
});

// ══ the rubric ════════════════════════════════════════════════════════

describe('the rubric the board scores this show on', () => {
  it("is the show's own and not the default show's", () => {
    const tr = _ruRubric(TRAITORS_FORMAT);
    expect(tr, "The Traitors falls through to Total Drama's rubric")
      .not.toBe(RU_SHOW[DEFAULT_FORMAT]);
    expect(tr.comp1.label).toBe('Shield');
    expect(tr.comp2.label).toBe('Missions');
    expect(tr.comp3.label).toBe('Reads');
    // The social column counts something, on this show, rather than running the
    // votes-against curve a castle's ballots do not mean.
    expect(tr.social.kind).toBe('survived');
    expect(tr.social.label).toBe('Wanted');
  });

  /* ── AND THE SENTENCE THE PUBLIC BOARD PRINTS ABOUT IT ────────────────
     `kind` is a two-valued flag and there are three shows. The blurb was
     written off it, so the castle -- sharing `survived` with the house -- was
     described as having "survived the block 3 times" on 9 of 20 blurbs: the
     opposite of what a murder ballot naming you means, about a show with no
     block. The rubric's own tooltip beside it already had the right words.
     Each rubric states its own sentence now. */
  it('says what its own column means, in its own words', () => {
    const said = (format, n) => {
      const rub = _ruRubric(format);
      const say = rub.social.prose;
      expect(say, `${format}'s social column has no sentence of its own`).toBeTruthy();
      return n === 0 ? say.zero : n === 1 ? say.one : say.many(n);
    };
    for (const n of [0, 1, 3]) {
      const tr = String(said(TRAITORS_FORMAT, n) || '');
      expect(tr.toLowerCase(),
        `the castle's blurb says "the block" about a show that has none: "${tr}"`)
        .not.toContain('block');
      if (n) {
        expect(tr.toLowerCase(),
          'the blurb does not say what the number counts').toMatch(/traitor|name/);
      }
    }
    // ...and the house keeps the sentence that is true of the house.
    expect(String(said('big-brother', 3))).toContain('survived the block');
    expect(String(said(DEFAULT_FORMAT, 3))).toContain('votes against');
  });

  it('fills every column off a real published season', () => {
    // THE FAILURE THIS EXISTS FOR: a reader that does not know the show reads
    // field names the show does not write, every column loads zero, and the
    // board comes out ranked on placement alone looking exactly like a working
    // board. It happened to Big Brother for a whole season.
    const filled = { comp1: 0, comp2: 0, comp3: 0, social: 0, advFound: 0 };
    let rows = 0;
    for (const doc of DOCS) {
      for (const p of doc.placements) {
        const cols = RU_SHOW[TRAITORS_FORMAT].read(p, { placement: p.placement });
        rows++;
        for (const key of Object.keys(filled)) if (cols[key] > 0) filled[key]++;
      }
    }
    expect(rows).toBeGreaterThan(150);
    for (const [key, n] of Object.entries(filled)) {
      expect(n, `the ${key} column is empty on every player of eight seasons`)
        .toBeGreaterThan(0);
    }
    // Not merely non-empty: the two the format produces every season have to
    // reach a real share of the cast, or the column is a curiosity.
    expect(filled.comp2 / rows, 'almost nobody won a mission').toBeGreaterThan(0.5);
    expect(filled.social / rows, 'almost nobody was ever named at the turret')
      .toBeGreaterThan(0.2);
  });

  it('lets what somebody did move them past somebody who finished above them', () => {
    // The law the whole formula is tuned against — one competition win is worth
    // about one placement position — asked of THIS show's numbers.
    const cast = 20;
    const row = (place, over = {}) => ({
      allPcts: [placementPct(place, cast)], wins: place === 1 ? 1 : 0, nonWinFinals: 0,
      numSeasons: 1, format: TRAITORS_FORMAT,
      immWins: 0, rewWins: 0, comp3Wins: 0,
      advFound: 0, advPlayed: 0, advWasted: 0, advHeld: 0,
      strategicScore: 0, alliances: 0, socialCol: 0,
      fanFav: false, quit: false, override: 0, castSize: cast, isFinalist: place <= 3, ...over,
    });
    const perPlace = computeScore(row(8)) - computeScore(row(9));
    expect(perPlace).toBeGreaterThan(0);
    // A Shield is priced at one placement position, like a veto.
    expect(RU_SHOW[TRAITORS_FORMAT].comp1.weight).toBeGreaterThan(perPlace * 0.75);
    expect(RU_SHOW[TRAITORS_FORMAT].comp1.weight).toBeLessThan(perPlace * 1.35);
    // Two Shields, three missions and four namings beat finishing three places
    // higher having done nothing at all.
    const decorated = computeScore(row(11, { immWins: 2, rewWins: 3, socialCol: 4 }));
    expect(decorated, 'a season of play cannot move you off your finish')
      .toBeGreaterThan(computeScore(row(8)));
  });
});

describe('what the board leans on is not how long somebody lasted', () => {
  // MEASURED, not asserted from the design. `gs.popularity` is banned from
  // ranking because it accrues every round; the same objection applies to every
  // COUNT this show produces, and the numbers here are why the rubric scores
  // what it scores.
  const corr = (xs, ys) => {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxy / Math.sqrt(sxx * syy);
  };

  // THE TWO SIDES OF THE FINAL TABLE, filled by the arm below and read by the
  // one after it — one 120-season run, two questions asked of it.
  const endPlace = [], endWanted = [], endRaw = [];
  const lowPlace = [], lowWanted = [], lowRaw = [];

  it('the Wanted column is independent of placement and the obvious one is not', () => {
    const place = [], wanted = [], ballots = [];
    for (let seed = 101; seed <= 220; seed++) {
      setPlayers(ROSTER);
      const season = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      const history = traitorsVotingHistory(season);
      for (const p of traitorsPlacements(season, history)) {
        place.push(p.placement);
        // THROUGH THE RUBRIC, not off the export. Reading `p.tr.wanted`
        // directly measured a number the board is not obliged to use: swapping
        // the social column to `reads` — an accrual count at -0.635 — left this
        // test GREEN, which made it a fact about the export rather than a guard
        // on the choice. It now measures whatever the board actually scores.
        wanted.push(RU_SHOW[TRAITORS_FORMAT].read(p, { placement: p.placement }).social);
        // THE RIVAL COLUMN, computed here rather than read from the code under
        // test: ballots cast at the table, which is "rounds survived" wearing a
        // number and is the currency the spec reached for first.
        ballots.push(history.reduce((n, row) =>
          n + row.votes.filter(v => v.voter === p.name && v.channel === 'banishment').length, 0));
        // A placement with no `exit` is somebody who was still at the table.
        const bucket = p.exit === null;
        (bucket ? endPlace : lowPlace).push(p.placement);
        (bucket ? endWanted : lowWanted).push(
          RU_SHOW[TRAITORS_FORMAT].read(p, { placement: p.placement }).social);
        (bucket ? endRaw : lowRaw).push(p.tr?.wanted ?? 0);
      }
    }
    expect(place.length, '120 seasons of twenty').toBeGreaterThan(2000);
    const rWanted = corr(wanted, place);
    const rBallots = corr(ballots, place);
    // Measured at +0.014 over 4,000 player-seasons; the band is wide enough to
    // survive sampling and far too narrow to admit an accrual curve. The
    // rejected candidates for this column all sat outside it: correct
    // banishments driven -0.635, missions won -0.629, accusations survived
    // -0.440, banishment accuracy -0.499.
    expect(Math.abs(rWanted), `Wanted tracks placement at ${rWanted.toFixed(3)}`)
      .toBeLessThan(0.15);
    // Measured at -0.924. The separation between the two is the point: they are
    // not both "things that happened to you during a season".
    expect(rBallots, `ballots cast tracks placement at ${rBallots.toFixed(3)}`)
      .toBeLessThan(-0.8);
  });

  /* ── AND THE POOLED FIGURE ABOVE IS NOT ENOUGH ON ITS OWN ────────────
     +0.014 pooled is the AVERAGE OF TWO OPPOSITE SLOPES: -0.171 below the
     final table and +0.189 at it, both holding across four independent blocks
     of fifty seasons. The column was chosen on the pooled number, so among
     the 23% of player-seasons the board most needs to separate it was paying
     worse-placed finalists MORE. This is the same trap Task 5 of this plan
     wrote down and Task 6 then walked into, one task later.

     The rubric zeroes the column at the final table. This arm reads it
     THROUGH THE RUBRIC, so it is a guard on the decision and not on the
     export -- exactly the correction the social-column test already carries
     one arm up. */
  it('does not pay a column that reverses sign at the final table', () => {
    expect(endPlace.length, 'no finalists in the sample at all').toBeGreaterThan(400);
    expect(lowPlace.length, 'nobody left before the final table').toBeGreaterThan(1500);
    // Roughly a quarter of a cast reaches it. If that stops being true the
    // split is describing a different population and wants re-measuring.
    const share = endPlace.length / (endPlace.length + lowPlace.length);
    expect(share, `${(share * 100).toFixed(1)}% of player-seasons reach the final table`)
      .toBeGreaterThan(0.1);

    // THE RAW COLUMN REVERSES. Measured +0.189 at the table against -0.171
    // below it; if this stops being true the split is unnecessary and should
    // be removed rather than left standing on a dead reason.
    const rEndRaw = corr(endRaw, endPlace);
    const rLowRaw = corr(lowRaw, lowPlace);
    expect(rEndRaw, `raw Wanted at the final table: ${rEndRaw.toFixed(3)}`)
      .toBeGreaterThan(0.08);
    expect(rLowRaw, `raw Wanted below the final table: ${rLowRaw.toFixed(3)}`)
      .toBeLessThan(-0.08);

    // AND THE BOARD PAYS NOTHING FOR IT THERE. Not "less" — nothing, because
    // there is no honest amount to pay for a signal that points the wrong way.
    expect(endWanted.filter(x => x > 0),
      'the board still pays the Wanted column at the final table, where more '
      + 'namings means a WORSE finish').toEqual([]);
    // ...and still pays it below, or the split has quietly deleted the column.
    expect(lowWanted.filter(x => x > 0).length,
      'the Wanted column pays nobody anywhere — it has been deleted, not split')
      .toBeGreaterThan(200);
  });
});

// ══ the dead regex ════════════════════════════════════════════════════

describe("a returning player's reasoning does not stack up", () => {
  // THE PATTERN WAS BUILT IN A TEMPLATE LITERAL, so the escape was eaten and
  // the regex reached RegExp as `S1s+(?:Winner|Pd+)[^]*$`: this `.replace()`
  // had NEVER STRIPPED ANYTHING on the live path. Four test guards in this
  // repo carried the identical mistake.
  const row = { format: DEFAULT_FORMAT, immWins: 0, rewWins: 0, comp3Wins: 0 };

  it('drops the auto-line it already wrote for this same season', () => {
    const before = 'S1 Winner. Dominated the merge.';
    const out = buildSeasonReasoning('Someone', 1, 1, row, true, false, before);
    expect(out, 'the previous auto-line for S1 is still in there')
      .not.toContain('Dominated the merge');
    expect(out.match(/S1 Winner/g) || [], 'S1 Winner is written twice').toHaveLength(1);
  });

  it('drops a placement line as well as a winner line', () => {
    const out = buildSeasonReasoning('Someone', 1, 7, row, false, false, 'S1 P12. Went early.');
    expect(out).not.toContain('Went early');
    expect(out).toContain('S1 P7.');
  });

  it('keeps everything written about a DIFFERENT season', () => {
    const kept = 'S4 Winner. A landslide.';
    const out = buildSeasonReasoning('Someone', 1, 3, row, false, false, kept);
    expect(out, "another season's line was eaten").toContain(kept);
    expect(out).toContain('S1 P3.');
  });

  it('does not fire on a partial match of the label', () => {
    // `S1` must not strip `S14`'s line — the first thing a live regex breaks on.
    const out = buildSeasonReasoning('Someone', 1, 5, row, false, false, 'S14 Winner. Ran it.');
    expect(out).toContain('S14 Winner. Ran it.');
  });

  // ── AND IT MUST NOT EAT EVERY LATER SEASON ────────────────────────────
  //
  // The repaired pattern ended `[^]*$`. Regenerating an EARLY season deleted
  // its line AND EVERYTHING AFTER IT, so a veteran regenerated at S1 came back
  // with one sentence. Nothing above catches this: every one of those fixtures
  // has the target season LAST. This one puts it first, which is the case the
  // live board hits every time somebody re-runs an old season.
  it('keeps every LATER season when an early one is regenerated', () => {
    const before = 'S1 P12. Went early. S4 Winner. A landslide. TR1 P3. Read the room.';
    const out = buildSeasonReasoning('Someone', 1, 7, row, false, false, before);
    expect(out, "S4's line was eaten by the strip").toContain('S4 Winner. A landslide.');
    expect(out, "the Traitors season's line was eaten by the strip")
      .toContain('TR1 P3. Read the room.');
    expect(out, 'the S1 line it was replacing survived').not.toContain('Went early');
    expect(out).toContain('S1 P7.');
    // And no hole left where the middle used to be.
    expect(out, 'a double space was left where the old line was').not.toMatch(/ {2}/);
  });

  /* ── AND THE BLURB IS ABOUT THE ROW'S SHOW, NOT THE PAGE'S ───────────
     `_ruStatParts` asked `_ruRubric()` with no argument, which falls back to
     reading a DOM select — so regenerating a Traitors row while the page was
     left on Big Brother described a castle in the house's column names. The
     season LABEL beside it already read `row.format`, so the same sentence
     was half right. */
  it("takes its column names from the row's show, not the page's", () => {
    const tr = { format: TRAITORS_FORMAT, immWins: 2, rewWins: 1, comp3Wins: 0, socialCol: 0 };
    const line = buildSeasonReasoning('Someone', 1, 4, tr, false, true, '');
    expect(line, "a castle row described in another show's columns")
      .not.toMatch(/immunity win|HOH win|veto win/i);
    expect(line).toMatch(/Shield win/i);
    expect(line).toMatch(/^TR1 P4\./);
    // The house keeps its own, from the same call.
    const bb = { format: 'big-brother', immWins: 2, rewWins: 1, comp3Wins: 0, socialCol: 0 };
    expect(buildSeasonReasoning('Someone', 1, 4, bb, false, true, '')).toMatch(/HOH win/);
  });

  it('anchors on the registry, so a third show ends a line too', () => {
    // `TR1` is a season label only because `js/shows.js` says its short is TR.
    // A hand-written `(?:S|BB)` list would run straight through it.
    const before = 'S2 P4. Early exit. TR1 Winner. Ran the castle.';
    const out = buildSeasonReasoning('Someone', 2, 9, row, false, false, before);
    expect(out).toContain('TR1 Winner. Ran the castle.');
    expect(out).not.toContain('Early exit');
  });

  it('has no U+0008 in the pattern it builds', () => {
    // The character-code check, because an eaten escape looks correct and is
    // not. Read off the function's own source rather than trusted.
    const src = buildSeasonReasoning.toString();
    expect([...src].some(c => c.charCodeAt(0) === 8),
      'the pattern contains a literal backspace').toBe(false);
    expect(src, 'the escapes were eaten again').toMatch(/\\\\s\+/);
  });
});

// ══ the social feed ═══════════════════════════════════════════════════

/** Only words that CANNOT be true of another show. */
const EXCLUSIVE = {
  'big-brother': ['head of household', 'hoh', 'power of veto', 'veto', 'evicted', 'eviction',
    'houseguest', 'have-not', 'block buster', 'nominated', 'nomination', 'on the block'],
  'total-drama': ['tribe', 'tribal council', 'campfire', 'idol', 'immunity challenge',
    'contestant', 'voted out', 'camper'],
  traitors: ['banished', 'banishment', 'murdered', 'the round table', 'conclave', 'faithful'],
};
const forbiddenFor = format => Object.entries(EXCLUSIVE)
  .filter(([f]) => f !== format).flatMap(([, list]) => list);
const leaks = (text, format) => forbiddenFor(format).filter(w =>
  new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`)
    .test(String(text).toLowerCase()));

describe("the audience talks about this show in this show's words", () => {
  it('the registry and the feed agree on what a departure is called', () => {
    // The feed's `eliminated` is the BANISHMENT and only the banishment, because
    // every take reaching for it is reacting to a decision the room made.
    expect(words(TRAITORS_FORMAT).eliminated).toBe(showWords(TRAITORS_FORMAT).exit);
    expect(exitVerbs(TRAITORS_FORMAT)).toEqual(['banished', 'murdered']);
  });

  it("no show's poll questions ask about another show's game", () => {
    // These were `format === 'big-brother' ? A : B`, so a third show asked its
    // audience who wins the next challenge and who makes the merge.
    for (const format of FORMATS) {
      const text = pollQuestions(format).map(q => q.text).join(' | ');
      expect(text.length).toBeGreaterThan(20);
      expect(leaks(text, format), `${format} polls: ${text}`).toEqual([]);
    }
  });

  it("no show's event labels are another show's furniture", () => {
    const KINDS = ['episode-aired', 'comp-win', 'nomination', 'eviction', 'finale', 'blindside'];
    for (const format of FORMATS) {
      for (const kind of KINDS) {
        const label = eventLabel(kind, format);
        expect(label, `${format}/${kind} rendered nothing`).toBeTruthy();
        expect(label).not.toMatch(/undefined/);
        expect(leaks(label, format), `${format}/${kind}: ${label}`).toEqual([]);
      }
    }
    // And the three that used to be a ternary say this show's thing.
    expect(eventLabel('comp-win', TRAITORS_FORMAT)).toBe('Mission win');
    expect(eventLabel('eviction', TRAITORS_FORMAT)).toBe('Banishment');
    expect(eventLabel('nomination', TRAITORS_FORMAT)).toBe('Accusation');
    // Unchanged for the shows that already had them.
    expect(eventLabel('eviction', 'big-brother')).toBe('Eviction');
    expect(eventLabel('eviction', DEFAULT_FORMAT)).toBe('Elimination');
    expect(eventLabel('nomination', DEFAULT_FORMAT)).toBe('Votes against');
  });

  it("renders every alumni take in this show's vocabulary with no holes", () => {
    const w = words(TRAITORS_FORMAT);
    const lines = [];
    const push = (label, pool) => {
      for (const fn of pool || []) lines.push([label, fn({ s: 'Ted', w, k: 'moment' })]);
    };
    for (const [name, byKind] of Object.entries(TRAIT_TAKES)) {
      for (const [kind, pool] of Object.entries(byKind)) push(`trait:${name}/${kind}`, pool);
    }
    for (const [name, byKind] of Object.entries(LENS_TAKES)) {
      for (const [kind, pool] of Object.entries(byKind)) push(`lens:${name}/${kind}`, pool);
    }
    for (const [kind, pool] of Object.entries(TAKES)) push(`general/${kind}`, pool);
    push('generic', GENERIC_TAKES);
    expect(lines.length, 'no takes rendered — this passes by drawing nothing')
      .toBeGreaterThan(200);
    const holes = lines.filter(([, t]) => /undefined/.test(t)).map(([where]) => where);
    expect(holes, 'a take reached for a word this show does not define').toEqual([]);
    const wrong = lines.filter(([, t]) => leaks(t, TRAITORS_FORMAT).length)
      .map(([where, t]) => `${where}: ${t.slice(0, 80)}`);
    expect(wrong, `${wrong.length} takes speak another show`).toEqual([]);
  });

  /* ── AND THE BALLOT A TAKE NAMES HAS TO BE THE RIGHT BALLOT ──────────
     A finale take was rewritten off `w.vote` — the WEEKLY ballot — so a Big
     Brother finale read "Not one bitter eviction vote at the end of that"
     about a night decided by the jury. Right show, wrong ballot, and less
     accurate than the jury sentence it replaced. `w.finalVote` is the ballot
     that decides the season and is null on a show that has none, where the
     sentence has to be about the room instead of about a vote nobody cast.

     Rendered for EVERY registered format, because the arm above only ever
     rendered the castle and this defect was on the house. */
  it('never names a ballot a finale did not have', () => {
    for (const format of FORMATS) {
      const w = words(format);
      const lines = [];
      for (const byKind of Object.values(TRAIT_TAKES)) {
        for (const fn of byKind.finale || []) lines.push(fn({ s: 'Ted', w, k: 'moment' }));
      }
      for (const byKind of Object.values(LENS_TAKES)) {
        for (const fn of byKind.finale || []) lines.push(fn({ s: 'Ted', w, k: 'moment' }));
      }
      for (const fn of TAKES.finale || []) lines.push(fn({ s: 'Ted', w, k: 'moment' }));
      expect(lines.length, `${format} rendered no finale takes at all`).toBeGreaterThan(5);
      for (const t of lines) {
        expect(t, `${format}: a finale take rendered an absent word`)
          .not.toMatch(/undefined|null/);
        /* The WEEKLY ballot has no business in a finale sentence. Only
           checked where a show NAMES its weekly ballot distinctively --
           "eviction vote", "banishment vote". Where the word is the bare
           "vote" it is a substring of "voted" and of the finale's own
           sentences, and a check on it would be a check on English. */
        if (w.vote !== w.finalVote && /\s/.test(String(w.vote))) {
          expect(t, `${format}: a finale take names the weekly "${w.vote}"`)
            .not.toContain(w.vote);
        }
        // ...and a show with no final ballot names none.
        if (!w.finalVote) {
          expect(t, `${format} has no final ballot and a take named one`)
            .not.toMatch(/jury vote|final vote|final tally/i);
        }
      }
    }
  });

  it('builds a feed for every night of a published season', () => {
    const doc = DOCS[0];
    const eps = episodesOf(doc, TRAITORS_FORMAT);
    expect(eps.length, 'a published Traitors season produced no episodes').toBeGreaterThan(5);
    expect(eps.map(e => e.episode)).toEqual(eps.map((_, i) => i + 1));
    let empty = 0;
    for (const e of eps) {
      const { events, posts } = archiveEpisode(doc, TRAITORS_FORMAT, 1, e.episode);
      if (!posts.length) empty++;
      expect(events.length, `episode ${e.episode} produced no events`).toBeGreaterThan(0);
    }
    expect(empty, 'some nights of the season have no audience at all').toBe(0);
  });
});

// ══ fame and followers ════════════════════════════════════════════════

describe('a published season produces a fame reading and a following', () => {
  const DOC = DOCS[0];
  const DETAILS = traitorsSeasonDetails(SEASONS[0], 1);
  const SEASON_ROW = { ...DOC, seasonId: DOC.seasonId, format: TRAITORS_FORMAT,
    seasonNumber: 1, airYear: 2026, airSlot: 'fall' };

  const fameFor = details => computeFame({
    players: { players: details.map(d => ({ id: d.playerSlug, name: d.name, seasonDetails: [d] })) },
    seasons: { seasons: [{ seasonId: DOC.seasonId, format: TRAITORS_FORMAT, seasonNumber: 1, awards: {} }] },
    rankings: [], franchise: {},
  });

  it('scores every exit verb this show has instead of nothing', () => {
    // `normaliseStatus` knew Winner, Runner-up, Finalist, Jury and Pre-jury. A
    // castle records a departure as Banished or Murdered — its own words, which
    // is the point — so SEVENTEEN OF TWENTY scored zero and the show had no
    // fame in it. Asked of the registry, so this covers both verbs and any
    // fourth show's.
    for (const format of FORMATS) {
      for (const verb of exitVerbs(format)) {
        const status = verb.charAt(0).toUpperCase() + verb.slice(1);
        const bucket = normaliseStatus(status);
        expect(bucket, `"${status}" is worth no fame at all on ${format}`).toBeTruthy();
        expect(PLACEMENT_BASE[bucket], `${bucket} has no base`).toBeGreaterThan(0);
      }
    }
  });

  it('gives everybody who played a reading, and the winner the biggest', () => {
    const fame = fameFor(DETAILS);
    const statuses = new Set(DETAILS.map(d => d.status));
    // BOTH DOORS OUT, or this passes over a season that only ever banished —
    // the empty-section failure mode wearing a different hat.
    expect(statuses, 'this season has no murder in it — the fixture is wrong')
      .toContain('Murdered');
    expect(statuses).toContain('Banished');
    const zero = DETAILS.filter(d => fame.get(d.playerSlug).score <= 0);
    expect(zero.map(d => `${d.name} (${d.status})`),
      'players who scored nothing for a whole season').toEqual([]);
    const winner = DETAILS.find(d => d.placement === 1);
    const banished = DETAILS.find(d => d.status === 'Banished');
    expect(fame.get(winner.playerSlug).score)
      .toBeGreaterThan(fame.get(banished.playerSlug).score);
    expect(fameTerm(fame.get(winner.playerSlug).stars)).toBeTruthy();
  });

  it('turns the placement into a following', () => {
    const careers = DETAILS.map(d => ({ id: d.playerSlug, details: [{ ...d, seasonId: DOC.seasonId }] }));
    const followers = slug => followerHistory(slug, { careers, seasons: [SEASON_ROW], events: [] });
    const winner = DETAILS.find(d => d.placement === 1);
    const early = DETAILS[DETAILS.length - 1];
    const w = followers(winner.playerSlug);
    const e = followers(early.playerSlug);
    expect(w.debuted, 'the winner never debuted').toBe(true);
    expect(w.total, 'winning a season is worth no followers').toBeGreaterThan(100000);
    expect(e.total, 'being on television is worth nothing').toBeGreaterThan(0);
    expect(w.total).toBeGreaterThan(e.total);
    expect(w.steps.map(s => s.why)).toContain('won');
  });
});
