// ══════════════════════════════════════════════════════════════════════
// life-hook-cast-present.test.js — an off-season the cast was not in
// ══════════════════════════════════════════════════════════════════════
//
// "Drag race girls are not in life events."
//
// They were not, and the log said the gap had been dealt with: 161 events
// after `dr-1`, and not one of them about a queen. Every one was about a Total
// Drama or Big Brother player.
//
// `resolveAfterSeason` runs from the export hook, seconds after the export has
// rewritten `players_database.json`, and it FETCHES that file over HTTP. The
// site has not rebuilt yet and the browser has a copy, so what comes back is
// the PREVIOUS franchise — on the first season of a new show, one with none of
// that show's cast in it.
//
// The resolver then did exactly what it was asked: it rolled an off-season for
// everybody it could see, which was everybody except the people whose season
// it was. Running the same resolver against the landed database proposes
// eleven events about queens, which is the measurement that proves it.
//
// And it was permanent. The `already resolved` guard counts events rather than
// asking whether they are the right ones, so the one run that could not see
// the cast closed the gap for good.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { lifeContext, resolveGapWith } from '../js/life-hook.js';

const J = p => JSON.parse(readFileSync(p, 'utf8'));
const src = readFileSync('js/life-hook.js', 'utf8');

describe('the export hook reads what it just published', () => {
  it('asks for all three files with no-store', () => {
    /* Not a style point. This runs inside the same click that published them,
       and a cached answer is a different franchise. */
    const block = src.slice(src.indexOf('export async function resolveAfterSeason'),
      src.indexOf('/** Seasons that have aired'));
    for (const f of ['seasons_database.json', 'players_database.json', 'franchise_roster.json']) {
      const at = block.indexOf(`fetch('${f}'`);
      expect(at, `${f} is no longer fetched here`).toBeGreaterThan(-1);
      expect(block.slice(at, at + 120),
        `${f} is fetched without no-store — it can come back pre-export`)
        .toMatch(/cache:\s*'no-store'|nocache/);
    }
  });

  it('refuses a season whose cast the database does not list', () => {
    const block = src.slice(src.indexOf('export async function resolveAfterSeason'));
    expect(block, 'the cast guard is gone — a stale fetch can close a gap again')
      .toMatch(/castBySeason\.get\(season\.seasonId\)[\s\S]{0,200}ok:\s*false/);
  });

  it('refuses BEFORE it resolves, not after', () => {
    // A guard that runs after `resolveGapWith` has already rolled the gap is
    // not a guard; the events exist by then.
    const block = src.slice(src.indexOf('export async function resolveAfterSeason'));
    const guard = block.indexOf('castBySeason.get(season.seasonId)');
    const roll = block.indexOf('resolveGapWith(ctx, season, log)');
    expect(guard).toBeGreaterThan(-1);
    expect(roll).toBeGreaterThan(-1);
    expect(guard, 'the cast is checked after the off-season has been rolled')
      .toBeLessThan(roll);
  });
});

/* ── AND THE MEASUREMENT, AGAINST THE REAL FRANCHISE ──
   The published databases are in the repo, so the case that proves it is the
   one that found it: with the cast present, the resolver has something to say
   about them. `it.runIf` rather than a hard requirement — this file must not
   go red on a checkout whose drag season has not been exported. */
const pdb = J('players_database.json');
const sdb = J('seasons_database.json');
const roster = J('franchise_roster.json');
const players = Array.isArray(pdb.players) ? pdb.players : Object.values(pdb.players || {});
const drSeason = (sdb.seasons || []).find(s => s.format === 'drag-race');
const queens = new Set(players.filter(p => (p.byShow || {})['drag-race']).map(p => p.id));

describe('the drag season the report came from', () => {
  it.runIf(drSeason && queens.size)('has its cast in the player database', () => {
    const ctx = lifeContext(pdb, sdb, roster);
    const cast = ctx.castBySeason.get(drSeason.seasonId) || [];
    expect(cast.length, 'the export did not put the queens in the database')
      .toBe(queens.size);
  });

  it.runIf(drSeason && queens.size)('proposes an off-season that includes them', () => {
    const ctx = lifeContext(pdb, sdb, roster);
    const log = (J('life_events.json').events || [])
      .filter(e => e.afterSeason !== drSeason.seasonId);
    const fresh = resolveGapWith(ctx, drSeason, log);
    expect(fresh.length, 'the gap proposes nothing at all').toBeGreaterThan(0);
    const mine = fresh.filter(e => queens.has(e.player));
    expect(mine.length,
      'the off-season after the drag season is about everybody except the queens')
      .toBeGreaterThan(0);
  });
});
