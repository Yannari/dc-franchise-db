// ══════════════════════════════════════════════════════════════════════
// alumni.js — who has actually played a season
// ══════════════════════════════════════════════════════════════════════
//
// A LEAF, deliberately, because the week engine needs it and cannot afford to
// import the UI to get it.
//
// The Mystery Competitor opens a door on "somebody who has played this game
// before", and the pool it drew from was the ROSTER — which is a cast list, not
// a career record. Everybody in the franchise is on it, including hosts who have
// never competed and characters who have not debuted yet, so the door opened on
// Chef Hatchet and then on somebody scheduled for a season that has not aired.
//
// players_database.json is the actual record: 152 people, every one of them with
// seasons behind them, and neither the hosts nor the undebuted appear in it at
// all. It is the answer to "has this person played", and nothing else in this
// codebase is.
//
// Loaded once by main.js and cached here. When it is not available the pool is
// EMPTY and the twist does not fire — which is the correct answer to "who has
// played a season" in a franchise with no record of anybody having played one.
// Falling back to the roster is what produced the bug.

let _db = null;

/** Hand in players_database.json (array, or `{players: [...]}`). */
export function setAlumniDatabase(data) {
  const arr = Array.isArray(data) ? data : data?.players;
  _db = Array.isArray(arr) ? arr : null;
  return !!_db;
}

export function alumniDatabase() {
  if (_db) return _db;
  // Whoever fetched it first, in whatever order the page loaded.
  const g = globalThis.PLAYERS_DB;
  const arr = Array.isArray(g) ? g : g?.players;
  if (Array.isArray(arr)) _db = arr;
  return _db;
}

/**
 * Everybody eligible to walk back through the door.
 *
 * @param exclude names currently in the house — they cannot be their own cameo
 * @returns [{name, seasonName, winner, finalist, chalWins, seasons}]
 */
export function alumniPool({ exclude = [] } = {}) {
  const db = alumniDatabase();
  if (!db) return [];
  const out = [];
  const barred = new Set(exclude);
  for (const p of db) {
    if (!p?.name || barred.has(p.name)) continue;
    const seasons = Array.isArray(p.seasons) ? p.seasons
      : (p.seasonDetails || []).map(d => Number(d.season)).filter(Boolean);
    // No season, no cameo. This is the whole point of the file.
    if (!seasons.length && !Number(p.totalSeasons)) continue;
    const best = Number(p.bestPlacement);
    out.push({
      name: p.name,
      // "out of Season 4" reads better than a bare number and is all the screen
      // needs; the ledger's own season names are not reachable from here.
      seasonName: seasons.length ? `Season ${Math.max(...seasons)}` : null,
      winner: Number(p.wins) > 0 || best === 1,
      finalist: Number.isFinite(best) && best <= 3,
      chalWins: Number(p.totalChallengeWins) || 0,
      seasons,
    });
  }
  return out;
}
