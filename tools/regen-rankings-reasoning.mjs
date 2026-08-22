#!/usr/bin/env node
// Rewrite the "why they're ranked here" blurbs for one season's players.
//
// WHY THIS EXISTS. The rankings tool used to POST to api.anthropic.com from
// the page — no key, no CORS — so every call failed and every blurb came out
// of the structured fallback instead: "BB1 P16. Narrative override +1.2: fix.
// 1 alliance." Seventeen of those shipped to the live board before the call
// was moved to the worker. Re-running Apply would fix them, but it would also
// re-score a season that is already scored correctly, so this touches ONE
// field and leaves every number alone.
//
// It is not single-use. Any season whose blurbs need rewriting — a new one, or
// one written before the prompt knew what show it was describing — is the same
// job with different arguments.
//
// Usage:
//   node tools/regen-rankings-reasoning.mjs --season data/seasons/bb-1-data.json
//   node tools/regen-rankings-reasoning.mjs --season ... --write
//
//   --season <path>   season document, for what actually happened to each player
//   --db <path>       rankings database        (default rankings_database.json)
//   --names a,b       only these players       (default: every fallback-shaped blurb)
//   --all             every player in the season, not only the broken blurbs
//   --write           persist. WITHOUT THIS NOTHING IS SAVED — the default is a
//                     dry run that prints old and new side by side, because the
//                     blurbs are prose on a public board and a bad batch is not
//                     something you want to find out about after it is written.
//   --worker <url>    override the endpoint

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, dflt = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return dflt;
  const v = argv[i + 1];
  return !v || v.startsWith('--') ? dflt : v;
};
const flag = name => argv.includes(`--${name}`);

const SEASON_PATH = arg('season');
const DB_PATH     = arg('db', 'rankings_database.json');
const WORKER      = arg('worker', 'https://dc-analytics.yannari19.workers.dev');
const WRITE       = flag('write');
const ONLY_NAMES  = (arg('names') || '').split(',').map(s => s.trim()).filter(Boolean);

if (!SEASON_PATH) {
  console.error('Need --season <path to a season document>.');
  process.exit(1);
}

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const season = readJson(SEASON_PATH);
const db     = readJson(DB_PATH);

// The show is the season document's to state. Guessing it is how a houseguest
// ends up described as having survived Tribal.
const SHOW_NAMES = { 'total-drama': 'Total Drama', 'big-brother': 'Big Brother' };
const format   = season.format || (String(season.seasonId || '').startsWith('bb-') ? 'big-brother' : 'total-drama');
const showName = SHOW_NAMES[format] || 'Total Drama';
const seasonLabel = format === 'total-drama' ? `S${season.seasonNumber}` : `BB${season.seasonNumber}`;

// A blurb the broken path wrote: "BB1 P16. Narrative override +1.2: fix. ..."
const FALLBACK_SHAPE = /^(?:S|BB)\d+\s+(?:Winner|P\d+)\./;

// The stat line inside one, which is the only per-season stat record that
// survives — the rankings database keeps CAREER totals, and a career total is
// not what this season's blurb is about. The override sentence is dropped: a
// scoring adjustment reading "fix" is not a fact about how somebody played.
function statLineFromFallback(text) {
  return String(text || '')
    .replace(FALLBACK_SHAPE, '')
    .replace(/\s*Narrative override [^:]*:[^.]*\.\s*/, ' ')
    .replace(/\.\s*$/, '')
    .trim();
}

// Matched by NAME, never by placement. This season document numbers its
// placements 1-12 then 14-18 across a cast of 17, so the two files disagree
// about what number people finished in; the rankings database is contiguous
// and is the board's own record, so its placement is the one that is printed.
const byName = new Map();
for (const p of season.placements || []) byName.set(String(p.name).toLowerCase(), p);

const targets = [];
for (const entry of db.rankings || []) {
  const doc = byName.get(String(entry.name).toLowerCase());
  if (!doc) continue;
  if (ONLY_NAMES.length && !ONLY_NAMES.some(n => n.toLowerCase() === entry.name.toLowerCase())) continue;
  if (!flag('all') && !FALLBACK_SHAPE.test(entry.reasoning || '')) continue;
  targets.push({ entry, doc });
}

if (!targets.length) {
  console.log('Nothing to do — no matching blurbs.');
  process.exit(0);
}

console.log(`${showName} ${seasonLabel}: ${targets.length} blurb${targets.length !== 1 ? 's' : ''} to rewrite`
  + `${WRITE ? '' : '  (DRY RUN — pass --write to save)'}\n`);

function factsFor(doc, entry) {
  const placements = entry.placements || [];
  return [
    `Finished: ${doc.status || `place ${placements[placements.length - 1]}`}`,
    Number.isFinite(doc.juryVotes) && doc.juryVotes > 0 ? `Jury votes to win: ${doc.juryVotes}` : '',
    Number.isFinite(doc.votesReceived) ? `Votes received against them across the season: ${doc.votesReceived}` : '',
    doc.notes && `Why they finished there: ${doc.notes}`,
    doc.story && `Their season: ${doc.story}`,
  ].filter(Boolean).join('\n');
}

async function rewrite({ entry, doc }) {
  const placements = entry.placements || [];
  const placement  = placements[placements.length - 1];
  const isWinner   = placement === 1;
  const body = {
    mode: 'rankings-reasoning',
    name: entry.name,
    showName, seasonLabel,
    placeLabel: isWinner ? 'Winner' : `P${placement}`,
    statLine: statLineFromFallback(entry.reasoning),
    seasonFacts: factsFor(doc, entry),
    isNew: (entry.seasonsPlayed || 1) === 1,
    isWinner,
    totalSeasons: entry.seasonsPlayed || 1,
    totalWins: entry.wins || 0,
    // Only a career already on the board is worth weaving in, and every player
    // here is on their first season. Sending the broken blurb as the "existing
    // career summary" would ask the model to build on the thing being replaced.
    existingReasoning: '',
  };

  let lastErr = 'unknown';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json().catch(() => ({}));
      if (typeof data?.reasoning === 'string' && data.reasoning.trim()) return data.reasoning.trim();
      lastErr = data?.error ? `${data.error} ${data.detail || ''}`.trim() : `HTTP ${resp.status}`;
    } catch (e) {
      lastErr = e.message;
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
  }
  throw new Error(lastErr);
}

// Four at a time. The whole cast at once is one burst of parallel model calls
// against a rate limit, and a 429 here costs a blurb, not just a second.
const LANES = 4;
const results = [];
let failed = 0;
for (let i = 0; i < targets.length; i += LANES) {
  await Promise.all(targets.slice(i, i + LANES).map(async t => {
    try {
      results.push({ name: t.entry.name, before: t.entry.reasoning, after: await rewrite(t), entry: t.entry });
    } catch (e) {
      failed++;
      console.error(`  FAILED ${t.entry.name}: ${e.message}`);
    }
  }));
}

results.sort((a, b) => targets.findIndex(t => t.entry === a.entry) - targets.findIndex(t => t.entry === b.entry));
for (const r of results) {
  console.log(`-- ${r.name}`);
  console.log(`   was: ${r.before}`);
  console.log(`   now: ${r.after}\n`);
}

if (!WRITE) {
  console.log(`Dry run. ${results.length} rewritten, ${failed} failed. Nothing saved — pass --write.`);
  process.exit(failed ? 1 : 0);
}

// A partial batch is still worth keeping, but it must never be silent: the
// blurbs that failed stay exactly as they were, and the count says so.
for (const r of results) r.entry.reasoning = r.after;
// Two-space indent, terminating newline — the shape the publish route already
// writes, so this does not turn into a whole-file diff.
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8');
console.log(`Wrote ${results.length} blurb${results.length !== 1 ? 's' : ''} to ${path.basename(DB_PATH)}`
  + `${failed ? `, ${failed} left unchanged (failed)` : ''}.`);
