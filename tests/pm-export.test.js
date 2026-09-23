// ══════════════════════════════════════════════════════════════════════
// pm-export.test.js — Plan 6: a villa season as the document the site reads
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { buildPerfectMatchSeasonDocument, pmCareerStats } from '../js/pm/export.js';
import { seasonExporterFor, exportPerfectMatchSeason, mergePerfectMatchSeason, mergePerfectMatchSeasonsDatabase } from '../js/stats-export.js';
import { roundLedger } from '../js/wiki-fill.js';
import { PERFECT_MATCH_FORMAT, roundShape } from '../js/shows.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const played = {};
function season(seed) {
  if (played[seed]) return played[seed];
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  return (played[seed] = { rows, names, doc: buildPerfectMatchSeasonDocument(rows, { seasonNumber: 3 }) });
}

describe('the season document', () => {
  it('is registered, and is this show\'s', () => {
    expect(seasonExporterFor(PERFECT_MATCH_FORMAT)).toBe(exportPerfectMatchSeason);
    const { doc } = season(1);
    expect(doc.format).toBe(PERFECT_MATCH_FORMAT);
    expect(doc.seasonId).toBe('pm-3');
    expect(roundShape(PERFECT_MATCH_FORMAT)).toBe('ballots');
  });
  it('places everybody once: the winning couple both first, the finalists sharing, the rest by when they left', () => {
    for (const seed of [1, 2, 3]) {
      const { doc, names, rows } = season(seed);
      expect(doc.placements.map(p => p.name).sort(), `seed ${seed}`).toEqual([...names].sort());
      const winners = doc.placements.filter(p => p.placement === 1);
      expect(winners.map(p => p.name).sort()).toEqual([...doc.winningCouple].sort());
      expect(winners.every(p => p.status === 'Winner')).toBe(true);
      expect(doc.winners.map(w => w.name).sort()).toEqual([...doc.winningCouple].sort());
      expect(doc.winner).toBe(null);
      // The finalist couples share a place each; nobody outside them does better.
      const finalists = new Set(doc.finalVote.flatMap(f => f.couple));
      const worstFinal = Math.max(...doc.placements.filter(p => finalists.has(p.name)).map(p => p.placement));
      for (const p of doc.placements.filter(x => !finalists.has(x.name))) {
        expect(p.placement, `${p.name}`).toBeGreaterThan(worstFinal);
        expect(['Dumped', 'Walked']).toContain(p.status);
        // Their exit is on the round it happened in.
        expect(doc.votingHistory.find(h => h.episode === p.exitEpisode).exits.map(x => x.name)).toContain(p.name);
      }
      expect(doc.episodeCount).toBe(rows.length);
    }
  });
  it('one round per episode, every exit in the registry\'s words, and ballots on channels', () => {
    const { doc, rows } = season(2);
    expect(doc.votingHistory.length).toBe(rows.length);
    const exits = rows.flatMap(r => r.exits.map(x => x.name));
    expect(doc.votingHistory.flatMap(h => h.exits.map(x => x.name))).toEqual(exits);
    for (const h of doc.votingHistory) {
      for (const x of h.exits) expect(doc.exitVerbs).toContain(x.verb);
      if (h.eliminated) expect(h.exits.find(x => x.name === h.eliminated).verb).toBe(doc.exitVerbs[0]);
      for (const v of h.votes) expect(['villa', 'exes', 'recoupling', 'casa']).toContain(v.channel);
    }
    // The article's ledger reads it without a branch of its own.
    expect(roundLedger(doc).length).toBe(rows.length);
  });
  it('the twists that played, in the catalogue\'s names', () => {
    const { doc, rows } = season(1);
    const dumps = rows.filter(r => r.pm.dumpFormat).length;
    expect(doc.twists.filter(t => /^pm-/.test(t.type)).length).toBeGreaterThanOrEqual(dumps);
  });
  it('career stats count what happened', () => {
    const { rows, doc } = season(3);
    for (const p of doc.placements) {
      const s = pmCareerStats(rows, p.name);
      expect(p.pm.couplings).toBe(s.couplings);
      expect(p.pm.couplings).toBeGreaterThanOrEqual(0);
    }
    // Somebody was stolen from over a season, somewhere in three.
    const stolen = [1, 2, 3].flatMap(seed => season(seed).doc.placements).reduce((n, p) => n + p.pm.timesStolen, 0);
    expect(stolen).toBeGreaterThan(0);
  });
  it('is small enough to publish', () => {
    expect(JSON.stringify(season(1).doc).length).toBeLessThan(400 * 1024);
  });
});

describe('the databases', () => {
  it('every islander gets the appearance, both winners the win, and the show\'s totals', () => {
    const { doc } = season(1);
    const db = mergePerfectMatchSeason({ players: [] }, doc);
    expect(db.players.length).toBe(doc.placements.length);
    const w = db.players.filter(p => p.wins === 1).map(p => p.name).sort();
    expect(w).toEqual([...doc.winningCouple].sort());
    const one = db.players.find(p => p.name === doc.placements[0].name);
    expect(one.seasonDetails[0].format).toBe(PERFECT_MATCH_FORMAT);
    expect(one.byShow[PERFECT_MATCH_FORMAT].totalCouplings).toBe(doc.placements[0].pm.couplings);
    // Re-publishing the same season replaces it, never doubles it.
    const again = mergePerfectMatchSeason(db, doc);
    expect(again.players.find(p => p.name === one.name).seasonDetails.length).toBe(1);
  });
  it('the season row carries the couple, never one of them as "the" winner', () => {
    const { doc } = season(1);
    const db = mergePerfectMatchSeasonsDatabase({ seasons: [] }, doc);
    const row = db.seasons[0];
    expect(row.format).toBe(PERFECT_MATCH_FORMAT);
    expect(row.winner).toBe(null);
    expect(row.winners.map(w => w.name).sort()).toEqual([...doc.winningCouple].sort());
  });
});
