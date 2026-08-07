// The JSON databases are what most of the site reads — six pages read
// players_database alone. A format that exists only in D1 is a format the site
// cannot see.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSeasonRef, seasonId, DEFAULT_FORMAT } from '../js/shows.js';

// process.cwd(), not import.meta.url — a relative URL resolved against
// import.meta.url lands on the drive root under Windows (see
// tests/bb-comp-declared-profile.js for the same workaround).
const load = f => JSON.parse(readFileSync(join(process.cwd(), f), 'utf8'));

describe('seasons_database', () => {
  it('says which show every season belongs to', () => {
    const { seasons } = load('seasons_database.json');
    expect(seasons.length).toBeGreaterThan(0);
    for (const s of seasons) {
      expect(s.format, `season ${s.seasonNumber} has no format`).toBeTruthy();
      expect(parseSeasonRef(s.seasonId)).toEqual({ format: s.format, number: s.seasonNumber });
    }
  });
});

describe('players_database', () => {
  it('tags every season detail with its show', () => {
    const { players } = load('players_database.json');
    for (const p of players) {
      for (const det of p.seasonDetails || []) {
        expect(det.format, `${p.id} season ${det.season} has no format`).toBeTruthy();
        // The numeric season stays put beside the new fields, so a reader that
        // has not been updated yet still finds the number it expects.
        expect(typeof det.season, `${p.id} lost its numeric season`).toBe('number');
        expect(det.seasonId).toBe(seasonId(det.format, det.season));
      }
    }
  });

  it('splits career totals per show and keeps the universal ones on top', () => {
    const { players } = load('players_database.json');
    const withSeasons = players.filter(p => (p.seasonDetails || []).length);
    expect(withSeasons.length).toBeGreaterThan(0);
    for (const p of withSeasons) {
      expect(p.byShow, `${p.id} has no byShow`).toBeTruthy();
      // Universal facts stay top-level.
      expect(typeof p.totalSeasons).toBe('number');
      expect(typeof p.wins).toBe('number');
      // Per-show totals live under their show.
      const td = p.byShow['total-drama'];
      if (td) expect(typeof td.totalChallengeWins).toBe('number');
    }
  });

  it('agrees with itself: byShow totals are the sum of that show’s details', () => {
    const { players } = load('players_database.json');
    for (const p of players) {
      const dets = (p.seasonDetails || []).filter(d => d.format === DEFAULT_FORMAT);
      if (!dets.length) continue;
      const sum = k => dets.reduce((s, d) => s + (d[k] || 0), 0);
      const td = p.byShow?.[DEFAULT_FORMAT];
      expect(td, `${p.id} has Total Drama seasons but no total-drama bucket`).toBeTruthy();
      expect(td.seasons, `${p.id} byShow season count`).toBe(dets.length);
      expect(td.totalChallengeWins, `${p.id} challenge wins`).toBe(sum('challengeWins'));
      expect(td.totalImmunityWins, `${p.id} immunity wins`).toBe(sum('immunityWins'));
      expect(td.totalRewardWins, `${p.id} reward wins`).toBe(sum('rewardWins'));
      expect(td.totalIdolsFound, `${p.id} idols found`).toBe(sum('idolsFound'));
    }
  });
});

// ── The two failure modes that do not announce themselves ────────────

describe('cross-file integrity', () => {
  // The sync endpoint reads a `det.bb` block as "this is Big Brother" whenever
  // no tag disagrees. A detail carrying BOTH format:'total-drama' and a bb block
  // therefore writes one appearance tagged Total Drama with rows in both
  // td_appearances and bb_appearances — a split-brain row with two homes and no
  // owner. It never errors; it just quietly double-counts a career forever.
  it('never pairs a Total Drama tag with a Big Brother stat block', () => {
    const { players } = load('players_database.json');
    const offenders = [];
    for (const p of players) {
      for (const det of p.seasonDetails || []) {
        if (det.bb && det.format !== 'big-brother') {
          offenders.push(`${p.id} season ${det.season} (format=${det.format})`);
        }
      }
    }
    expect(offenders, 'split-brain season details').toEqual([]);
  });

  // The sync validates a season detail against the seasons list keyed by
  // (format, number). A detail whose season record is missing or tagged with a
  // different show fails that lookup and is SILENTLY SKIPPED: ok:true, no
  // error, only a `skipped` counter moves. So the two files must always be
  // tagged together — this is the guard that makes "one without the other"
  // impossible to ship unnoticed.
  it('every season detail resolves to a season record with the same (format, number)', () => {
    const { seasons } = load('seasons_database.json');
    const { players } = load('players_database.json');
    const known = new Set(seasons.map(s => `${s.format}#${s.seasonNumber}`));
    const orphans = new Set();
    for (const p of players) {
      for (const det of p.seasonDetails || []) {
        const key = `${det.format}#${det.season}`;
        if (!known.has(key)) orphans.add(`${key} (first seen on ${p.id})`);
      }
    }
    expect([...orphans], 'season details with no matching season record').toEqual([]);
  });

  it('tags every franchise champion with its show', () => {
    const { champions } = load('franchise_database.json');
    const { seasons } = load('seasons_database.json');
    const known = new Set(seasons.map(s => `${s.format}#${s.seasonNumber}`));
    for (const c of champions || []) {
      expect(c.format, `champion of season ${c.season} has no format`).toBeTruthy();
      expect(known.has(`${c.format}#${c.season}`), `champion ${c.format}#${c.season} has no season record`).toBe(true);
    }
  });
});
