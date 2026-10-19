// A finished race season, in the shape the site reads (js/rr/export.js). Until 2026-10-19 the race had no exporter,
// and publishing a race season fell back to Total Drama's; nothing of a race reached players_database, and so
// nothing reached the life layer.
import { describe, it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { raceRows } from '../js/rr-run.js';
import { rrLedgerRecord } from '../js/rr/ledger-record.js';
import { buildRaceSeasonDocument } from '../js/rr/export.js';
import { mergeRaceSeason, mergeRaceSeasonsDatabase, seasonExporterFor, exportRaceSeason } from '../js/stats-export.js';
import { RACE_FORMAT } from '../js/shows.js';
import { raceCast } from './helpers/rr-cast.js';

function season(seed, couples = false) {
  const { cast, teams } = raceCast(8, seed);
  if (couples) for (const t of teams) { t.rel = 'dating'; t.identity = null; t.name = `${t.a} & ${t.b}`; }
  setPlayers(cast);
  const res = playRaceSeason({ teams, seed, ...(couples ? { carried: { sums: teams.map(t => ({ a: t.a, b: t.b, delta: 6 })) } } : {}) });
  const rows = raceRows(res, airSeason(res));
  const record = rrLedgerRecord(res.state, res);
  return { res, rows, record, doc: buildRaceSeasonDocument(rows, record, { seasonNumber: 1 }) };
}

describe('rr export', () => {
  it('is registered: a race season is published as a race', () => {
    expect(seasonExporterFor(RACE_FORMAT)).toBe(exportRaceSeason);
  });

  it('builds the season document from the legs and the record: places from the record, a winning team, no votes', () => {
    const { res, record, doc } = season(3);
    expect(doc.format).toBe(RACE_FORMAT);
    expect(doc.seasonId).toBe('rr-1');
    expect(doc.castSize).toBe(Object.keys(record.players).length);
    for (const p of doc.placements) expect(p.placement, p.name).toBe(record.players[p.name].placement);
    const w = res.state.teams[res.winner];
    expect(doc.winners.map(x => x.name).sort()).toEqual([w.a, w.b].sort());
    expect(doc.winner).toBe(null);
    expect(doc.teams.length).toBe(Object.keys(res.state.teams).length);
    for (const h of doc.votingHistory) expect(h.votes).toEqual([]);
    expect(doc.votingHistory.some(h => h.exits.length === 2)).toBe(true);
    // the registry's careerStats paths
    for (const p of doc.placements) { expect(typeof p.rr.legWins).toBe('number'); expect(typeof p.rr.lasts).toBe('number'); }
  });

  it("a couple team's stage reaches players_database, and a winning team both win", () => {
    let found = false;
    for (let seed = 1; seed <= 12 && !found; seed++) {
      const { res, doc } = season(seed, true);
      const yes = res.state.scenes.find(s => s.kind === 'proposal' && s.data.ending === 'yes');
      if (!yes) continue;
      const t = res.state.teams[yes.data.team];
      const db = mergeRaceSeason({ players: [] }, doc);
      const det = db.players.find(p => p.name === t.a).seasonDetails[0];
      expect(det).toMatchObject({ showmance: t.b, showmanceEnded: 'intact', showmanceStage: 'engaged', partner: t.b });
      for (const w of doc.winners) expect(db.players.find(p => p.name === w.name).wins).toBe(1);
      const sdb = mergeRaceSeasonsDatabase({ seasons: [] }, doc);
      expect(sdb.seasons[0]).toMatchObject({ format: RACE_FORMAT, seasonId: 'rr-1', winner: null });
      expect(sdb.seasons[0].winners.length).toBe(2);
      found = true;
    }
    expect(found).toBe(true);
  });
});
