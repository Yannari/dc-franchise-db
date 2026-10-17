// ══════════════════════════════════════════════════════════════════════
// ch-export.test.js — a Challenge season as the document the site reads
// ══════════════════════════════════════════════════════════════════════
// docs/ADDING-A-SHOW.md §5 (the document every show carries), §8 (the format stamp on every appearance),
// §8.4 (placements the canon loader compares with the ledger record, place for place; every champion a winner)
// and the life layer's fields (showmance, showmanceEnded, showmanceStrength, alliances, rivalries).
// The user, 2026-10-16: "make sure the challenge exporter really exports everything necessary, like the MD says".
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chLedgerRecord } from '../js/ch/ledger-record.js';
import { buildChallengeSeasonDocument } from '../js/ch/export.js';
import { seasonExporterFor, exportChallengeSeason, mergeChallengeSeason, mergeChallengeSeasonsDatabase } from '../js/stats-export.js';
import { roundLedger } from '../js/wiki-fill.js';
import { CHALLENGE_FORMAT, roundShape, SHOWS } from '../js/shows.js';
import { setFranchiseLedger, applyPublishedSeason, activeSeasons } from '../js/franchise-meta.js';
import { challengeCast } from './helpers/ch-cast.js';
import { episodeText } from '../js/ch/transcript.js';
import { episodeKey } from '../js/episode-store.js';

const played = {};
function season(seed, options = {}) {
  const k = `${seed}|${JSON.stringify(options)}`;
  if (played[k]) return played[k];
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed, options });
  airSeason(r.state);
  const record = chLedgerRecord(r.state, r, { seasonName: 'Blue Lagoon' });
  const rows = challengeRows(r);
  return (played[k] = { r, rows, names, record, doc: buildChallengeSeasonDocument(rows, record, { seasonNumber: 2, options }) });
}

describe('The Challenge exporter', () => {
  beforeAll(() => { season(3); season(4, { gendered: false }); season(21, { finalPass: 'skull', redemption: true }); });

  it('is registered, so the export never falls through to Total Drama', () => {
    expect(seasonExporterFor(CHALLENGE_FORMAT)).toBe(exportChallengeSeason);
    expect(roundShape(CHALLENGE_FORMAT)).toBe('ballots');
  });

  it('carries the identity every show carries (§5)', () => {
    const { doc } = season(3);
    expect(doc.format).toBe(CHALLENGE_FORMAT);
    expect(doc.seasonNumber).toBe(2);
    expect(doc.seasonId).toBe('ch-2');
    expect(doc.title).toBe('Blue Lagoon');
    expect(Array.isArray(doc.twists)).toBe(true);
    expect(doc.exitVerbs[0]).toBe(SHOWS[CHALLENGE_FORMAT].words.exit);
  });

  it('places the whole cast once, from the ledger record, so the canon loader keeps the record', () => {
    for (const k of Object.keys(played)) {
      const { doc, names, record } = played[k];
      expect(doc.placements.map(p => p.name).sort(), k).toEqual([...names].sort());
      for (const p of doc.placements) {
        expect(p.placement, `${k} ${p.name}`).toBe(record.players[p.name].placement);
        expect(p.playerSlug).toMatch(/^[a-z0-9-]+$/);
        expect(['Winner', 'Finalist', 'Eliminated', 'Quit', 'Medical', 'Disqualified', 'Purged']).toContain(p.status);
      }
      // a standard ranking: everybody at place p has exactly p-1 people ahead (two champions at 1, then 3rd)
      for (const p of doc.placements) expect(doc.placements.filter(q => q.placement < p.placement).length, `${k} ${p.name} at ${p.placement}`).toBe(p.placement - 1);
      // the canon loader leaves a matching record alone: allies, showmances and betrayals survive a publish
      setFranchiseLedger({ v: 2, active: 'x', franchises: { x: { name: 'x', seasons: { 'ch-2': { ...record, format: CHALLENGE_FORMAT } } } } });
      applyPublishedSeason(doc, CHALLENGE_FORMAT, 2);
      const kept = activeSeasons()['ch-2'];
      for (const n of names) expect(kept.players[n].allies, `${k} ${n}`).toEqual(record.players[n].allies);
    }
  });

  it('every champion is a winner at placement 1, and winners[] carries them all', () => {
    for (const k of Object.keys(played)) {
      const { doc, r } = played[k];
      const champs = doc.placements.filter(p => p.status === 'Winner');
      expect(champs.map(p => p.name).sort(), k).toEqual([...r.champions].sort());
      expect(champs.every(p => p.placement === 1)).toBe(true);
      expect(doc.winners.map(w => w.name).sort()).toEqual([...r.champions].sort());
      if (r.champions.length === 1) expect(doc.winner.name).toBe(r.champions[0]);
      else expect(doc.winner).toBe(null);
    }
  });

  it('one votingHistory row an episode: ballots out loud, the Arena loser as eliminated, every other door on exits[]', () => {
    for (const k of Object.keys(played)) {
      const { doc, rows } = played[k];
      const regular = rows.filter(r => !r.ch?.final);
      expect(doc.votingHistory.length, k).toBe(regular.length);
      expect(doc.episodeCount).toBe(rows.length);
      for (const [i, h] of doc.votingHistory.entries()) {
        const row = regular[i];
        expect(h.exits.map(x => x.name)).toEqual(row.exits.map(x => x.name));
        if (h.eliminated) expect(['arena', 'instant']).toContain(h.exits.find(x => x.name === h.eliminated).channel);
        for (const v of h.votes) { expect(v.channel).toBe('house'); expect(v.voter && v.target).toBeTruthy(); }
        expect(h.votes.length).toBe((row.ch.votes || []).reduce((t, v) => t + (v.ballots || []).length, 0));
        for (const x of h.exits) expect(x.verb).toBeTruthy();
      }
      // the wiki's round reader understands it without a third shape
      const ledger = roundLedger(doc);
      expect(Array.isArray(ledger) ? ledger.length : Object.keys(ledger || {}).length).toBeGreaterThan(0);
      expect(doc.final.champions.length).toBeGreaterThan(0);
    }
  });

  it('every appearance carries the show numbers, the relationships and the showmance the life layer reads', () => {
    let showmances = 0;
    for (const k of Object.keys(played)) {
      const { doc, record } = played[k];
      for (const p of doc.placements) {
        const r = record.players[p.name];
        expect(p.ch.dailyWins, `${k} ${p.name}`).toBe(r.ch.dailyWins);
        expect(p.ch.arenaWins).toBe(r.ch.arenaWins);
        expect(p.ch.timesVotedIn).toBe(r.ch.timesVotedIn);
        expect(p.alliances).toEqual(r.allies);
        expect(p.rivalries).toEqual(r.rivals);
        if (r.showmances.length) {
          showmances++;
          expect(r.showmances.map(s => s.partner)).toContain(p.showmance);
          expect(['intact', 'broken']).toContain(p.showmanceEnded);
          expect(p.showmanceStrength).toBeGreaterThanOrEqual(0);
          expect(p.showmanceStrength).toBeLessThanOrEqual(1);
        } else expect(p.showmance).toBeUndefined();
      }
    }
    expect(showmances).toBeGreaterThan(0);
  });

  it('merges into players_database with the format stamped on every appearance, and seasons_database', () => {
    const { doc } = season(3);
    const db = mergeChallengeSeason({ players: [] }, doc);
    for (const p of doc.placements) {
      const pl = db.players.find(x => x.id === p.playerSlug);
      const det = pl.seasonDetails.find(d => d.season === 2);
      expect(det.format, p.name).toBe(CHALLENGE_FORMAT);
      expect(det.placement).toBe(p.placement);
      expect(det.challengeWins).toBe(p.ch.dailyWins);
      expect(det.ch.arenaWins).toBe(p.ch.arenaWins);
      if (p.showmance) expect(det.showmance).toBe(p.showmance);
      if (p.status === 'Winner') expect(pl.wins).toBe(1);
    }
    // a second merge of the same season replaces it, never doubles it
    const again = mergeChallengeSeason(db, doc);
    expect(again.players.find(x => x.id === doc.placements[0].playerSlug).seasonDetails.filter(d => d.season === 2 && d.format === CHALLENGE_FORMAT).length).toBe(1);
    const sdb = mergeChallengeSeasonsDatabase({ seasons: [] }, doc);
    const row = sdb.seasons.find(s => s.format === CHALLENGE_FORMAT && s.seasonNumber === 2);
    expect(row.status).toBe('Complete');
    expect(row.seasonId).toBe('ch-2');
    expect(row.winners.map(w => w.name).sort()).toEqual(doc.winners.map(w => w.name).sort());
  });

  it('every episode has its screenplay for the wiki fills, under the show key', () => {
    const { rows } = season(3);
    for (const r of rows) expect(episodeText(r).length, `episode ${r.num}`).toBeGreaterThan(500);
    expect(episodeKey(2, 1, CHALLENGE_FORMAT)).toBe('ch_episode_s2_e1');
  });

  it('names the twists that played and the season switches', () => {
    const { doc } = season(21, { finalPass: 'skull', redemption: true });
    const types = doc.twists.map(t => t.type);
    expect(types).toContain('ch-red-skull');
    expect(types).toContain('ch-redemption');
    expect(doc.settings.redemption).toBe(true);
  });

  it('a Pairs season: every placement names its partner, pairs share a place, and the money choices are kept', () => {
    const { doc, rows } = season(6, { pairs: { pairing: 'rivals' } });
    expect(doc.settings.pairs).toEqual({ pairing: 'rivals', shape: 'mixed' });
    expect(doc.twists.map(t => t.type)).toContain('ch-pairs');
    expect(doc.twists.map(t => t.type)).not.toContain('ch-partners');
    for (const p of doc.placements) {
      expect(p.partner, p.name).toBeTruthy();
      const q = doc.placements.find(x => x.name === p.partner);
      if (p.status === 'Eliminated' && q?.status === 'Eliminated') expect(q.placement).toBe(p.placement);
    }
    expect(doc.pairs.length).toBe(12);
    expect(doc.pairs[0].placement).toBe(1);
    expect(doc.moneyChoices.length).toBeGreaterThan(0);
    expect(doc.final.choices.length).toBe(doc.moneyChoices.length);
    const chooser = doc.placements.find(p => p.name === doc.moneyChoices[0].chooser);
    expect(chooser.moneyChoice).toMatchObject({ chose: true });
    // a pair ballot keeps both names, and an Arena both pairs
    const h = doc.votingHistory.find(x => x.votes.length);
    expect(h.votes[0].targetPair).toContain(h.votes[0].target);
    expect(doc.votingHistory.find(x => x.arena.length).arena[0].winners.length).toBe(2);
    expect(rows.length).toBe(doc.episodeCount);
  });
});
