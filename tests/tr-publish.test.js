// ══════════════════════════════════════════════════════════════════════
// tr-publish.test.js — a castle season reaches the databases
// ══════════════════════════════════════════════════════════════════════
//
// The season document is a third of a publish. Without the two merges the site
// describes a season none of its players know they played: no row in
// seasons_database.json, no appearance on any career, nothing on the board.
// Drag Race shipped its first export exactly that way (tests/dr-publish.test.js).
//
// Real seasons from the engine, not fixtures, for the reason tr-export.test.js
// gives: the co-winner split and the conclave's ballots are facts about the
// engine that a hand-written season would not have had.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { TRAITORS_FORMAT, buildTraitorsSeasonDocument } from '../js/tr/export.js';
import { readFileSync } from 'node:fs';
import { mergeTraitorsSeason, mergeTraitorsSeasonsDatabase, traitorsRecordLines } from '../js/stats-export.js';
import { championsIn } from '../js/records.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** The first season, searching seeds outward, whose document passes `pred`. */
function findDoc(pred, maxSeed = 300) {
  for (let seed = 1; seed <= maxSeed; seed++) {
    setPlayers(ROSTER);
    const doc = buildTraitorsSeasonDocument(
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed }), { seasonNumber: 1 });
    if (pred(doc)) return doc;
  }
  return undefined;
}
const split = findDoc(d => d.winners.length > 1);
const solo = findDoc(d => d.winners.length === 1);
const empty = () => ({ franchise: {}, players: [] });

describe('the document publish is handed', () => {
  it('both endings turned up, or every arm below is vacuous', () => {
    expect(split, 'no season in the search ended in a split').toBeTruthy();
    expect(solo, 'no season in the search had a lone taker').toBeTruthy();
  });

  it('carries what publish demands, and survives the JSON round trip', () => {
    for (const doc of [split, solo]) {
      for (const k of ['seasonNumber', 'format', 'seasonId', 'placements', 'winners', 'twists']) {
        expect(doc[k], `missing ${k}`).toBeDefined();
      }
      expect(doc.seasonId).toBe(`${SHOWS[TRAITORS_FORMAT].prefix}-1`);
      expect(doc.weeks, 'a `weeks` key makes the document a house to half the site').toBeUndefined();
      expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
    }
  });
});

describe('players_database.json', () => {
  it('gives every player an appearance tagged with this show, carrying its tr block', () => {
    const db = mergeTraitorsSeason(empty(), solo);
    expect(db.players.length).toBe(solo.placements.length);
    for (const p of db.players) {
      const det = p.seasonDetails.find(d => d.season === 1);
      expect(det, `${p.name} has no season detail`).toBeTruthy();
      expect(det.format).toBe(TRAITORS_FORMAT);
      expect(det.seasonId).toBe('tr-1');
      expect(det.tr, `${p.name} carries no tr block`).toBeTruthy();
      // The registry's career totals are read off that block.
      expect(p.byShow[TRAITORS_FORMAT].totalMissionsWon).toBe(det.tr.missionsWon);
      expect(p.byShow[TRAITORS_FORMAT].totalTimesMurdered).toBe(det.tr.timesMurdered);
    }
  });

  it('every co-winner gets the win and a prefixed badge', () => {
    const db = mergeTraitorsSeason(empty(), split);
    for (const w of split.winners) {
      const p = db.players.find(x => x.name === w.name);
      expect(p.wins, `${w.name} took a share and was not credited`).toBe(1);
      expect(p.badges).toContain('TR1 Winner');
      expect(p.badges).not.toContain('S1 Winner');
    }
    const losers = db.players.filter(p => !split.winners.some(w => w.name === p.name));
    for (const p of losers) expect(p.wins, p.name).toBe(0);
  });

  it('counts the table\'s ballots against a career and never the conclave\'s', () => {
    const db = mergeTraitorsSeason(empty(), solo);
    const priv = SHOWS[TRAITORS_FORMAT].privateBallotChannels;
    const tableBallots = solo.votingHistory
      .flatMap(r => r.votes).filter(v => v.target && !priv.includes(v.channel)).length;
    const murderBallots = solo.votingHistory
      .flatMap(r => r.votes).filter(v => v.target && priv.includes(v.channel)).length;
    expect(murderBallots, 'no conclave ballots — the check is vacuous').toBeGreaterThan(0);
    const total = db.players.reduce((n, p) => n + p.totalVotesAgainst, 0);
    expect(total).toBe(tableBallots);
    for (const p of db.players) {
      expect(p.totalJuryVotes, `${p.name} has jury votes on a show with no jury`).toBe(0);
    }
  });

  it('challenge wins are missions won', () => {
    const db = mergeTraitorsSeason(empty(), solo);
    for (const p of db.players) {
      const row = solo.placements.find(x => x.name === p.name);
      expect(p.totalChallengeWins, p.name).toBe(row.tr.missionsWon);
    }
    expect(solo.placements.some(x => x.tr.missionsWon > 0), 'nobody won a mission').toBe(true);
  });

  it('re-publishing replaces this season and leaves the other shows alone', () => {
    const name = solo.placements[solo.placements.length - 1].name;   // not a winner
    const mixed = {
      franchise: {},
      players: [{
        id: solo.placements[solo.placements.length - 1].playerSlug, name,
        seasons: [1], wins: 2, totalChallengeWins: 9, totalVotesAgainst: 3,
        badges: ['S1 Winner', 'TR1 Winner'],
        seasonDetails: [
          { season: 1, format: DEFAULT_FORMAT, placement: 1, status: 'Winner', challengeWins: 4, votesReceived: 3 },
          { season: 1, format: TRAITORS_FORMAT, placement: 1, status: 'Winner', challengeWins: 5, votesReceived: 0 },
        ],
      }],
    };
    const db = mergeTraitorsSeason(mixed, solo);
    const p = db.players.find(x => x.name === name);
    const trRows = p.seasonDetails.filter(d => d.format === TRAITORS_FORMAT);
    expect(trRows.length, 'the stale castle row survived').toBe(1);
    expect(trRows[0].status).not.toBe('Winner');
    expect(p.badges, 'the stale castle badge survived a re-publish').not.toContain('TR1 Winner');
    expect(p.badges, 'the camp badge went with it').toContain('S1 Winner');
    expect(p.wins).toBe(1);
    const td = p.seasonDetails.find(d => d.format === DEFAULT_FORMAT);
    expect(td && td.placement).toBe(1);
    expect(p.totalChallengeWins).toBe(4 + trRows[0].challengeWins);
  });

  it('refuses a document from another show', () => {
    expect(() => mergeTraitorsSeason(empty(), { format: 'drag-race', seasonNumber: 1 }))
      .toThrow(/traitors/);
    expect(() => mergeTraitorsSeasonsDatabase({ seasons: [] }, { format: DEFAULT_FORMAT, seasonNumber: 1 }))
      .toThrow(/traitors/);
  });
});

describe('seasons_database.json', () => {
  const row = doc => mergeTraitorsSeasonsDatabase({ franchise: {}, seasons: [] }, doc)
    .seasons.find(x => x.format === TRAITORS_FORMAT);

  it('is this show, with no jury and no tally', () => {
    const r = row(solo);
    expect(r.seasonId).toBe('tr-1');
    expect(r.castSize).toBe(solo.castSize);
    expect(r.jurySize).toBeUndefined();
    expect(r.winner.vote).toBe('');
    expect(r.title, 'the [AI_FILL] placeholder reached the index').not.toMatch(/AI_FILL/);
  });

  it('names the lone taker, and names nobody on a split', () => {
    expect(row(solo).winner.name).toBe(solo.winners[0].name);
    const r = row(split);
    expect(r.winner, 'a split season was given a winner block').toBe(null);
    expect(r.winners.map(w => w.name).sort()).toEqual(split.winners.map(w => w.name).sort());
  });

  it('puts every co-winner on the champions board through the published row', () => {
    const db = mergeTraitorsSeasonsDatabase({ franchise: {}, seasons: [] }, split);
    const champs = championsIn(db, TRAITORS_FORMAT);
    expect(champs.map(c => c.winner).sort()).toEqual(split.winners.map(w => w.name).sort());
    for (const c of champs) expect(c.coWinners).toBe(split.winners.length);
  });

  it('names the top competitor in this show\'s word', () => {
    const r = row(solo);
    expect(r.awards.mostChallengeWins, 'nobody won a mission').toBeTruthy();
    expect(r.awards.mostChallengeWins.detail).toMatch(/mission/);
    expect(r.awards.mostChallengeWins.detail).not.toMatch(/challenge|immunit|comp/i);
    expect(r.awards.fanFavorite, 'an audience award the format does not have').toBe(null);
  });

  it('leaves another show\'s season 1 row untouched', () => {
    const before = { franchise: {}, seasons: [{ seasonNumber: 1, format: 'drag-race', seasonId: 'dr-1', title: 'Runway' }] };
    const db = mergeTraitorsSeasonsDatabase(before, solo);
    expect(db.seasons.find(x => x.format === 'drag-race').title).toBe('Runway');
    expect(db.seasons.filter(x => x.format === TRAITORS_FORMAT).length).toBe(1);
  });
});

describe('the narrative fill', () => {
  it('hands the writer one line per episode and per player, off the document', () => {
    for (const doc of [split, solo]) {
      const text = traitorsRecordLines(doc);
      for (const row of doc.votingHistory) expect(text).toContain(`Episode ${row.episode}:`);
      for (const p of doc.placements) expect(text).toContain(`#${p.placement} ${p.name} —`);
      for (const w of doc.winners) expect(text).toMatch(new RegExp(`Took the pot[^\\n]*${w.name}`));
    }
  });

  it('never tells the writer a role the endgame did not reveal', () => {
    let tagged = 0;
    for (const doc of [split, solo]) {
      for (const line of traitorsRecordLines(doc).split('\n')) {
        if (/at the final table/.test(line)) {
          for (const exit of line.split('; ').filter(s => /at the final table/.test(s))) {
            expect(exit, 'an endgame banishment carried a role').not.toMatch(/\(a (Traitor|Faithful)\)/);
          }
        }
        if (/\(a (Traitor|Faithful)\)/.test(line)) tagged++;
      }
    }
    expect(tagged, 'no Round Table banishment carried its reveal — the check is vacuous').toBeGreaterThan(0);
  });

  it('the season worker writes a castle from its own brief, not Total Drama\'s', () => {
    const worker = readFileSync('worker/worker-season-live.js', 'utf8');
    expect(worker).toMatch(/NARRATIVE_BRIEFS\s*=\s*\{\s*'traitors'\s*:/);
    expect(worker).toMatch(/const brief = NARRATIVE_BRIEFS\[format\]/);
    expect(worker).toMatch(/brief\s*\?\s*brief\.instructions\(/);
    expect(worker).toMatch(/brief \? brief\.placementLine\(p\)/);
  });
});
