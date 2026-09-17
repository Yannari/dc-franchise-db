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
  return { season: num, placements, relations, winsKnown: true };
}

/** Every stored season, newest first — a queen who played twice is what she is NOW. */
export function seasonsFromDocs(docs = []) {
  return docs.map(seasonFromDoc).filter(Boolean).sort((a, b) => b.season - a.season);
}
