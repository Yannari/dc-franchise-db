// ══════════════════════════════════════════════════════════════════════
// backfill_formats.mjs — stamp the shipped JSON databases with their show
// ══════════════════════════════════════════════════════════════════════
//
// Run once:  node tools/backfill_formats.mjs
//
// The JSON databases are BUILD OUTPUTS — js/stats-export.js regenerates them at
// the end of a season, and that generator now emits `format`/`seasonId`/`byShow`
// itself. This script exists for the fourteen seasons of history that no
// simulator run can regenerate: their stats were merged in years of exports ago
// and only the files remember them. It is the one sanctioned hand-stamp.
//
// It is idempotent (`||=` throughout) and formatting-preserving: it detects the
// existing line endings and trailing-newline convention and writes them back, so
// re-running produces a byte-identical file and the diff shows only real
// changes rather than 14,000 reformatted lines.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { seasonId, DEFAULT_FORMAT } from '../js/shows.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const edit = (file, fn) => {
  const path = join(ROOT, file);
  const raw = readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  const trailingNewline = /\r?\n$/.test(raw);

  const data = JSON.parse(raw);
  fn(data);

  let out = JSON.stringify(data, null, 2);
  if (crlf) out = out.replace(/\n/g, '\r\n');
  if (trailingNewline) out += crlf ? '\r\n' : '\n';
  writeFileSync(path, out);
  console.log('stamped', file, out === raw ? '(no change)' : '');
};

// ── seasons_database.json ────────────────────────────────────────────
// Tagged FIRST and in the same run as players_database, never on its own. The
// sync endpoint validates a season detail against this list keyed by
// (format, number); a detail whose season record is missing or tagged
// differently fails that lookup and is silently skipped — ok:true, no error,
// only a `skipped` counter moves.
edit('seasons_database.json', d => {
  for (const s of d.seasons || []) {
    s.format ||= DEFAULT_FORMAT;
    s.seasonId ||= seasonId(s.format, s.seasonNumber);
  }
});

// ── players_database.json ────────────────────────────────────────────
edit('players_database.json', d => {
  const drift = [];
  for (const p of d.players || []) {
    for (const det of p.seasonDetails || []) {
      // A `bb` block on a season we are about to call Total Drama would sync as
      // an appearance with rows in BOTH side tables. Refuse rather than stamp.
      if (det.bb && (det.format || DEFAULT_FORMAT) !== 'big-brother') {
        throw new Error(
          `${p.id} season ${det.season} has a Big Brother stat block but would be ` +
          `stamped "${det.format || DEFAULT_FORMAT}" — refusing to write a split-brain appearance.`);
      }
      det.format ||= DEFAULT_FORMAT;
      det.seasonId ||= seasonId(det.format, det.season);
    }

    // Per-show career totals, summed from the season details rather than copied
    // from the top-level career fields. The two ought to agree; where they do
    // not, the details are the record of what actually happened and the
    // top-level number is the one that drifted. Disagreements are reported, not
    // silently reconciled.
    const byShow = {};
    for (const det of p.seasonDetails || []) {
      const bucket = (byShow[det.format] ||= { seasons: 0 });
      bucket.seasons++;
      if (det.format === 'big-brother') {
        const bb = det.bb || {};
        bucket.totalCompWins  = (bucket.totalCompWins  || 0) + (det.challengeWins || 0);
        bucket.hohWins        = (bucket.hohWins        || 0) + (bb.hohWins        || 0);
        bucket.vetoWins       = (bucket.vetoWins       || 0) + (bb.vetoWins       || 0);
        bucket.timesNominated = (bucket.timesNominated || 0) + (bb.timesNominated || 0);
      } else {
        bucket.totalChallengeWins = (bucket.totalChallengeWins || 0) + (det.challengeWins || 0);
        bucket.totalImmunityWins  = (bucket.totalImmunityWins  || 0) + (det.immunityWins  || 0);
        bucket.totalRewardWins    = (bucket.totalRewardWins    || 0) + (det.rewardWins    || 0);
        bucket.totalIdolsFound    = (bucket.totalIdolsFound    || 0) + (det.idolsFound    || 0);
      }
    }
    p.byShow = byShow;

    const td = byShow[DEFAULT_FORMAT];
    if (td) {
      for (const [top, sub] of [
        ['totalChallengeWins', 'totalChallengeWins'], ['totalImmunityWins', 'totalImmunityWins'],
        ['totalRewardWins', 'totalRewardWins'], ['totalIdolsFound', 'totalIdolsFound'],
      ]) {
        if ((p[top] || 0) !== td[sub]) drift.push(`${p.id}: ${top} career=${p[top] || 0} details=${td[sub]}`);
      }
    }
  }
  if (drift.length) {
    console.log(`  ${drift.length} career total(s) disagree with the season details:`);
    for (const line of drift) console.log('   -', line);
  }
});

// ── franchise_database.json ──────────────────────────────────────────
edit('franchise_database.json', d => {
  for (const c of d.champions || []) c.format ||= DEFAULT_FORMAT;
});
