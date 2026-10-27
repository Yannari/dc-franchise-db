// ══════════════════════════════════════════════════════════════════════
// dr/history.js — what really happened, read out of a stored season
// ══════════════════════════════════════════════════════════════════════
//
// The franchise ledger knows where a queen placed and who she called an ally.
// It does not know who beat her in the song that sent her home, and it cannot
// count a maxi win — it counts `immunityWinner` and `vetoWinner`, which are
// the other shows' fields, so it reports zero wins for every queen who ever
// played a drag season.
//
// The published season document knows both. This module turns one into the
// shape `js/dr/past.js` reads, so an All Stars cast of real returnees carries
// its real record and its real history rather than an inference.
//
// PURE. The fetching lives in js/dr-run.js; this only reads what it is given,
// so it can be tested against a real stored season.

import { SHOWS, DRAG_FORMAT } from '../shows.js';

/** The per-episode rows, whichever shape of document this is. */
function episodesOf(doc) {
  const a = doc?.dr?.episodes;
  if (Array.isArray(a) && a.length) return a;
  return Array.isArray(doc?.episodes) ? doc.episodes : [];
}

/**
 * One stored season, as `castPasts`/`sharedHistory` want it.
 *
 * `winsKnown` is true here — unlike the ledger path — because the document
 * carries the queen's own maxi-win count.
 */
export function seasonFromDoc(doc) {
  if (!doc) return null;
  const format = doc.format || DRAG_FORMAT;
  const num = Number(doc.seasonNumber) || 0;
  const placements = (doc.placements || [])
    .map(p => ({
      name: p.name,
      place: Number(p.placement) || 0,
      wins: Number(p?.dr?.wins) || 0,
    }))
    .filter(p => p.name && p.place > 0)
    .sort((a, b) => a.place - b.place);
  if (!placements.length) return null;

  /* ── WHO ENDED WHOSE SEASON ─────────────────────────────────────────
     Two ways it can happen and both are recorded:
       the song   she lost the lip sync and went home that night
       the choice All Stars, where the winner of the top two's song names her
     The second condition matters. A queen who LOST a song and stayed — the
     chocolate bar, a dunk-tank lever, a double shantay — was not sent home by
     anybody, and saying she was would invent a defeat the season did not
     have. So the loser has to be in that episode's exits. */
  const relations = [];
  const seen = new Set();
  const add = (a, b, season) => {
    if (!a || !b || a === b) return;
    const key = [a, b].sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({ a, b, kind: 'sent-home', season });
  };
  for (const ep of episodesOf(doc)) {
    const ls = ep?.lipsync || {};
    const out = new Set((ep?.exits || []).map(x => x?.name).filter(Boolean));
    if (ls.chosenBy && ls.eliminated && out.has(ls.eliminated)) {
      add(ls.chosenBy, ls.eliminated, num);
    } else if (ls.winner && ls.loser && out.has(ls.loser)) {
      add(ls.winner, ls.loser, num);
    }
  }
  return { season: num, format, placements, relations, winsKnown: true };
}

/* ── WHEN A SEASON AIRED, AMONG BOTH SERIES ──
   Drag Race and its All Stars number separately, so "newest first" cannot
   compare the numbers. A season's place in the family's run is its number on
   the main series; an All Stars season sits just after the flagship it waited
   for (the registry's `spinOff.after`) and one a year from there — the
   franchise calendar's own rule. */
export function airOrder(s) {
  const n = Number(s?.season) || 0;
  const spin = SHOWS[s?.format]?.spinOff;
  return spin ? (Number(spin.after) || 1) + n - 1 + 0.5 : n;
}

/** Every stored season, newest first — a queen who played twice is what she is NOW. */
export function seasonsFromDocs(docs = []) {
  return docs.map(seasonFromDoc).filter(Boolean).sort((a, b) => airOrder(b) - airOrder(a));
}

/** "Season 4" on the main series, "All Stars 1" on the spin-off: what a past is called on screen. */
export function pastSeasonLabel(past) {
  const tab = SHOWS[past?.format]?.spinOff && SHOWS[past.format].familyTab;
  return `${tab || 'Season'} ${Number(past?.season) || 0}`;
}
