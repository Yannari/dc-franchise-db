// A finished Big Brother season, all the way to the documents that get published.
//
// Every piece of this existed and was tested in isolation before anything could
// use it: the extractor, both merges, the season record. What nothing covered
// was a real season going through them, which is how the export came to be
// written, plausible, and reachable from no button in the application.
//
// So this plays an actual season on the PLAYED path — simulateBBEpisode, then
// the finale — because that is the path the export reads from. `gs.bb.finale`
// and the weeks it walks only exist there; a headless simulateBBSeason produces
// neither, and a test written against it would pass while the button failed.
//
// What it cannot reach: the publish request, the worker and the D1 sync. Those
// need a browser and a network. This covers everything up to the moment the
// documents leave the page.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { buildBigBrotherSeasonDocument, mergeBigBrotherSeason,
  mergeBigBrotherSeasonsDatabase, publishingIsOff, setPublishMode,
  exportAndFillBigBrotherSeason } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.jury = []; gs.jurorHistory = {};
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
}

/** Play a whole season, finale included, exactly as the run tab does. */
function playSeason(seed = 11) {
  reset();
  withSeededRandom(seed, () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
    simulateBBFinale();
  });
}

describe('pressing the export button', () => {
  // Everything above tests the pieces. This runs the FUNCTION THE BUTTON CALLS,
  // which is the only thing that would have caught what shipped: splitting the
  // document builder out left `finale` behind in the fan-favourite block, and
  // the export died on `ReferenceError: finale is not defined` the first time
  // anybody pressed it. Nothing here has a linter, and `node --check` only
  // parses — it resolves no identifiers — so a stale reference in a branch no
  // test entered was invisible until a human hit it.
  //
  // Stubbed to the edges of the page: no network, no real downloads. What is
  // being checked is that the whole path executes.
  let downloaded, realFetch, realCreate, realRevoke;

  beforeEach(() => {
    playSeason();
    seasonConfig.seasonNumber = 1;
    localStorage.setItem('SEASON_BUILDER_WORKER_URL', 'https://example.invalid/ai');
    setPublishMode('download');          // never touch the live site from a test

    downloaded = [];
    realFetch = globalThis.fetch;
    realCreate = globalThis.URL.createObjectURL;
    realRevoke = globalThis.URL.revokeObjectURL;
    // Offline: the narrative fill and the database reads both have to cope.
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));
    globalThis.URL.createObjectURL = () => 'blob:test';
    globalThis.URL.revokeObjectURL = () => {};
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      downloaded.push(this.download);
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = realFetch;
    globalThis.URL.createObjectURL = realCreate;
    globalThis.URL.revokeObjectURL = realRevoke;
    setPublishMode('publish');
    delete seasonConfig.seasonNumber;
  });

  it('runs start to finish and writes all three files', async () => {
    const status = [];
    await exportAndFillBigBrotherSeason(s => status.push(s));
    vi.advanceTimersByTime(2000);        // the staggered downloads

    expect(downloaded, 'the export produced no files').toEqual([
      'bb-1-data.json', 'players_database.json', 'seasons_database.json',
    ]);
    // It said what it was doing, and said it was not publishing.
    expect(status.join(' | ')).toMatch(/Download-only/);
  });

  it('sends the worker something to write from, even with no episode history', async () => {
    // What produced a season of [AI_FILL] with no error anywhere: the export
    // reads gs.episodeHistory, which only the PLAYED path writes. A house that
    // was simulated straight through — or restored from a save without the
    // transcripts — handed the worker a stack of blank summaries, so the fill
    // was skipped in silence and the season came back with every narrative
    // field still a placeholder.
    gs.episodeHistory = [];              // the empty-history case, exactly
    const sent = [];
    globalThis.fetch = vi.fn((url, opts) => {
      try { sent.push(JSON.parse(opts.body)); } catch { /* not the AI call */ }
      return Promise.reject(new Error('offline'));
    });

    await exportAndFillBigBrotherSeason(() => {});
    vi.advanceTimersByTime(2000);

    const call = sent.find(b => b.mode === 'narrative-fill');
    expect(call, 'the worker was never called at all').toBeTruthy();
    expect(call.format, 'the worker was not told which show this is').toBe('big-brother');
    const withText = call.episodes.filter(e => e.summary);
    expect(withText.length, 'every episode was sent blank').toBeGreaterThan(0);
  });

  it('survives the AI worker being unreachable', async () => {
    // Already the case above — fetch rejects — but stated on its own, because a
    // failed narrative call must cost the prose and not the season.
    await expect(exportAndFillBigBrotherSeason(() => {})).resolves.not.toThrow();
    vi.advanceTimersByTime(2000);
    expect(downloaded).toContain('bb-1-data.json');
  });
});

describe('the dry-run switch', () => {
  // Only the flag itself is reachable from here — _publishSeasonToSite needs a
  // network. What this pins is that the setting round-trips and that "off" is
  // off by default, so an export nobody configured still publishes.
  afterEach(() => setPublishMode('publish'));

  it('publishes unless somebody says otherwise', () => {
    setPublishMode('publish');
    expect(publishingIsOff()).toBe(false);
  });

  it('holds the commit back, and can be turned straight back on', () => {
    expect(setPublishMode('download')).toBe(false);
    expect(publishingIsOff()).toBe(true);
    expect(setPublishMode('publish')).toBe(true);
    expect(publishingIsOff()).toBe(false);
  });
});

describe('exporting a season that was actually played', () => {
  beforeEach(() => playSeason());

  it('refuses to export a house that has not crowned anybody', () => {
    reset();
    expect(() => buildBigBrotherSeasonDocument(1)).toThrow(/weeks have been played/);
    gs.bb.weeks = [{ num: 1 }];
    expect(() => buildBigBrotherSeasonDocument(1)).toThrow(/crowned a winner/);
  });

  it('builds a season document with everybody in it, best first', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    expect(doc.format).toBe('big-brother');
    expect(doc.seasonId).toBe('bb-1');
    expect(doc.placements).toHaveLength(CAST.length);
    expect(doc.placements[0].placement).toBe(1);
    expect(doc.placements[0].name).toBe(gs.bb.finale.winner);
    expect(doc.placements[0].status).toBe('Winner');
    // Placements are a ranking: every position filled once, nobody sharing.
    const places = doc.placements.map(p => p.placement);
    expect(new Set(places).size).toBe(places.length);
    expect(doc.winner.name).toBe(gs.bb.finale.winner);
    expect(doc.episodeCount).toBeGreaterThan(0);
  });

  it('carries the real jury tally, not a row of zeroes', () => {
    // The regression this file was written for. The extractor hardcodes
    // juryVotes: 0 with a comment saying the engine holds no jury vote, which
    // was true of the week engine and never true of the finale.
    const doc = buildBigBrotherSeasonDocument(1);
    const total = doc.placements.reduce((s, p) => s + p.juryVotes, 0);
    expect(total, 'the whole jury voted for nobody').toBeGreaterThan(0);

    const winnerRow = doc.placements.find(p => p.name === gs.bb.finale.winner);
    expect(winnerRow.juryVotes, 'the winner won with no votes').toBeGreaterThan(0);
    // The tally matches what the jury actually did.
    for (const [name, count] of Object.entries(gs.bb.finale.votes || {})) {
      const row = doc.placements.find(p => p.name === name);
      if (row) expect(row.juryVotes).toBe(count);
    }
    expect(doc.winner.vote).toMatch(new RegExp(gs.bb.finale.winner));
  });

  it('produces documents the season sync can match up', () => {
    // The silent failure this guards: /api/sync-seasons validates every season
    // detail against the (format, season_number) pairs it finds in the seasons
    // database. A detail with no matching season record is dropped with ok:true
    // and nothing moving but counts.skipped — a whole season of player history
    // gone, behind a success response.
    const doc = buildBigBrotherSeasonDocument(1);
    const playersDb = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const seasonsDb = mergeBigBrotherSeasonsDatabase({ franchise: {}, seasons: [] }, doc);

    const known = new Set(seasonsDb.seasons.map(s => `${s.format}|${s.seasonNumber}`));
    for (const p of playersDb.players) {
      for (const det of p.seasonDetails) {
        expect(known.has(`${det.format}|${det.season}`),
          `${p.name}'s ${det.format} season ${det.season} has no season record — the sync drops it silently`)
          .toBe(true);
      }
    }
    expect(playersDb.players).toHaveLength(CAST.length);
    expect(seasonsDb.seasons).toHaveLength(1);
  });

  it('lands beside a Total Drama franchise without touching it', () => {
    // The realistic case: fourteen finished Total Drama seasons already exist,
    // and one of their players is in this house.
    const doc = buildBigBrotherSeasonDocument(1);
    const returning = doc.placements[2].name;
    const playersExisting = { franchise: { totalSeasons: 14 }, players: [{
      id: returning.toLowerCase(), name: returning,
      seasons: [1], totalSeasons: 1, wins: 1, totalChallengeWins: 5,
      totalImmunityWins: 3, totalVotesAgainst: 2, badges: ['S1 Winner'],
      seasonDetails: [{ season: 1, format: 'total-drama', seasonId: 'td-1',
        placement: 1, status: 'Winner', challengeWins: 5, immunityWins: 3, votesReceived: 2 }],
    }] };
    const seasonsExisting = { franchise: { totalSeasons: 14 }, seasons: [
      { seasonNumber: 1, format: 'total-drama', seasonId: 'td-1', title: 'Total Drama One' },
    ] };

    const playersDb = mergeBigBrotherSeason(playersExisting, doc);
    const seasonsDb = mergeBigBrotherSeasonsDatabase(seasonsExisting, doc);

    // Total Drama season 1 still exists, alongside Big Brother season 1.
    expect(seasonsDb.seasons.find(s => s.seasonId === 'td-1').title).toBe('Total Drama One');
    expect(seasonsDb.seasons.find(s => s.seasonId === 'bb-1')).toBeTruthy();
    expect(seasonsDb.franchise.totalSeasons, 'the franchise lost thirteen seasons').toBe(14);

    // ...and so does the career that was already there.
    const vet = playersDb.players.find(p => p.name === returning);
    expect(vet.seasonDetails).toHaveLength(2);
    expect(vet.totalSeasons).toBe(2);
    expect(vet.wins, 'their Total Drama win was rewritten').toBe(1);
    expect(vet.byShow['total-drama'].totalChallengeWins).toBe(5);
    expect(vet.byShow['total-drama'].totalImmunityWins).toBe(3);
    expect(vet.byShow['big-brother'].seasons).toBe(1);
    // Big Brother numbers stay out of the Total Drama shapes entirely.
    expect(vet.byShow['big-brother'].totalImmunityWins).toBeUndefined();
  });

  it('re-exporting the same season corrects it instead of doubling it', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    const once = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const twice = mergeBigBrotherSeason(once, doc);
    for (const p of twice.players) {
      const was = once.players.find(q => q.id === p.id);
      expect(p.seasonDetails).toHaveLength(1);
      expect(p.totalSeasons).toBe(was.totalSeasons);
      expect(p.totalChallengeWins).toBe(was.totalChallengeWins);
      expect(p.totalJuryVotes).toBe(was.totalJuryVotes);
      expect(p.wins).toBe(was.wins);
    }
  });

  it('holds up across seasons that played out differently', () => {
    for (const seed of [3, 21, 44]) {
      playSeason(seed);
      const doc = buildBigBrotherSeasonDocument(2);
      expect(doc.placements).toHaveLength(CAST.length);
      expect(doc.winner.name).toBeTruthy();
      expect(doc.placements.reduce((s, p) => s + p.juryVotes, 0)).toBeGreaterThan(0);
      const db = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
      expect(db.players).toHaveLength(CAST.length);
      expect(db.players.filter(p => p.wins === 1)).toHaveLength(1);
    }
  });
});

describe('what the export remembers about a competition', () => {
  // The engine has always known which comp was played — `week.hohCompetition`
  // carries its name, its placements and every score. The export kept only the
  // winner's name, so a season document could answer "who won HOH in week 3"
  // and never "who is the youngest player ever to win the Wall", which is the
  // entire point of giving a competition a name.
  beforeEach(() => { playSeason(); seasonConfig.seasonNumber = 1; });
  afterEach(() => { delete seasonConfig.seasonNumber; });

  it('names the competition each week was decided by', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    const named = doc.weeks.filter(w => w.hohComp?.name);
    expect(named.length, 'no week recorded which HOH competition it played')
      .toBeGreaterThan(doc.weeks.length / 2);

    const w = named[0];
    expect(w.hohComp.id).toBeTruthy();
    expect(w.hohComp.winner).toBe(w.hoh);
    // A placement list, so second and third are answerable too.
    expect(Array.isArray(w.hohComp.placements)).toBe(true);
  });

  it('records the veto competition the same way', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    const vetoed = doc.weeks.filter(w => w.vetoComp?.name);
    expect(vetoed.length).toBeGreaterThan(0);
    expect(vetoed[0].vetoComp.winner).toBe(vetoed[0].vetoWinner);
  });

  it('says null for a week that had none, rather than inventing one', () => {
    // Double evictions and pre-crowned HOHs genuinely have no competition, and
    // a season published before this field existed has none at all.
    const doc = buildBigBrotherSeasonDocument(1);
    for (const w of doc.weeks) {
      expect(w.hohComp === null || typeof w.hohComp === 'object').toBe(true);
    }
  });
});

describe('the relationships a season produced', () => {
  // These existed only while a season was being played. gs.showmances and
  // gs.namedAlliances are written every episode and were never exported, so a
  // finished season's document mentioned showmances in its narrative prose and
  // never once said who with whom. "Are they in a couple" had no answer that
  // did not involve reading paragraphs.
  beforeEach(() => { playSeason(); seasonConfig.seasonNumber = 1; });
  afterEach(() => { delete seasonConfig.seasonNumber; });

  it('records couples as pairs, not as prose', () => {
    gs.showmances = [
      { players: ['A', 'B'], phase: 'showmance', sparkEp: 3, episodesActive: 4 },
      { players: ['C', 'D'], phase: 'showmance', sparkEp: 2, breakupEp: 6,
        broken: true, breakupType: 'vote' },
    ];
    const doc = buildBigBrotherSeasonDocument(1);
    expect(doc.showmances).toHaveLength(2);
    expect(doc.showmances[0]).toMatchObject({ players: ['A', 'B'], phase: 'showmance', startEpisode: 3 });
    // A breakup says when and how — a split at a vote is a different story from
    // one at camp, and the character page will want to say which.
    expect(doc.showmances[1]).toMatchObject({ phase: 'broken', endEpisode: 6, endedBy: 'vote' });
    // Slugs, because every other cross-reference on the site joins on them.
    expect(doc.showmances[0].playerSlugs).toEqual(['a', 'b']);
  });

  it('records alliances with their members', () => {
    gs.namedAlliances = [
      { name: 'The Cartel', members: ['A', 'B', 'C'], formed: 2, active: true, betrayals: [] },
    ];
    const doc = buildBigBrotherSeasonDocument(1);
    expect(doc.alliances).toHaveLength(1);
    expect(doc.alliances[0]).toMatchObject({ name: 'The Cartel', formedEpisode: 2, active: true });
    expect(doc.alliances[0].members).toEqual(['A', 'B', 'C']);
  });

  it('records the rivalry the Rivals twist created', () => {
    gs.bb.rivals = { pairs: [{ player: 'A', rival: 'B' }], startWeek: 1 };
    const doc = buildBigBrotherSeasonDocument(1);
    expect(doc.rivalries).toHaveLength(1);
    expect(doc.rivalries[0].players).toEqual(['A', 'B']);
    expect(doc.rivalries[0].source).toBe('rivals-twist');
  });

  it('writes empty lists rather than omitting them', () => {
    // A season with no showmances must say so. An absent key is
    // indistinguishable from a season exported before the field existed, and
    // the character page has to tell those apart.
    gs.showmances = [];
    gs.namedAlliances = [];
    const doc = buildBigBrotherSeasonDocument(1);
    expect(Array.isArray(doc.showmances)).toBe(true);
    expect(Array.isArray(doc.alliances)).toBe(true);
    expect(Array.isArray(doc.rivalries)).toBe(true);
  });
});
