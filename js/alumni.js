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
 * Everybody eligible to walk back through the door, this show's own first.
 *
 * `seasonDetails[].format` is on every appearance in the record, and the pool
 * ignored it — so once a franchise had run one Big Brother season its own
 * alumni were drawn from the same hat as a hundred and fifty Total Drama
 * players and were essentially never called. A returning houseguest is a
 * houseguest; somebody from the other show is a crossover, and the two are not
 * the same event.
 *
 * So: NATIVE FIRST. The other show is a fallback for a franchise that has not
 * run one of these yet, which is exactly the situation a first season is in,
 * and the flag travels with them so the narration can say "visiting" instead of
 * calling somebody a veteran of a show they have never played.
 *
 * @param format the show being played, e.g. 'big-brother'
 * @param exclude names currently in the house — they cannot be their own cameo
 * @param minNative how many of this show's own alumni make a pool worth having
 * @returns [{name, seasonName, native, shows, winner, finalist, chalWins}]
 */
export function alumniPool({ exclude = [], format = null, minNative = 6 } = {}) {
  const db = alumniDatabase();
  if (!db) return [];
  const barred = new Set(exclude);
  const all = [];
  for (const p of db) {
    if (!p?.name || barred.has(p.name)) continue;
    const details = Array.isArray(p.seasonDetails) ? p.seasonDetails : [];
    const seasons = Array.isArray(p.seasons) ? p.seasons
      : details.map(d => Number(d.season)).filter(Boolean);
    // No season, no cameo. This is the whole point of the file.
    if (!seasons.length && !Number(p.totalSeasons)) continue;
    const shows = [...new Set(details.map(d => d.format).filter(Boolean))];
    const mine = format ? details.filter(d => d.format === format) : details;
    const native = !format || mine.length > 0;
    // Their record ON THIS SHOW when they have one, because a Total Drama
    // challenge record is not a Big Brother competition record.
    const scoped = mine.length ? mine : details;
    const best = scoped.length
      ? Math.min(...scoped.map(d => Number(d.placement) || 99))
      : Number(p.bestPlacement);
    const lastSeason = scoped.length
      ? Math.max(...scoped.map(d => Number(d.season) || 0))
      : (seasons.length ? Math.max(...seasons) : null);
    all.push({
      name: p.name,
      native,
      shows,
      seasonName: lastSeason ? `${_showName(native && format ? format : shows[0])} ${lastSeason}` : null,
      winner: best === 1,
      finalist: Number.isFinite(best) && best <= 3,
      chalWins: scoped.reduce((n, d) => n + (Number(d.challengeWins) || 0), 0),
      seasons,
    });
  }
  if (!format) return all;
  const native = all.filter(a => a.native);
  // Enough of this show's own people to draw from: nobody else is needed.
  if (native.length >= minNative) return native;
  // Otherwise its own first, topped up from the other show — and every one of
  // those is flagged, so nothing pretends they are a returning houseguest.
  return [...native, ...all.filter(a => !a.native)];
}

const _SHOW_NAMES = { 'big-brother': 'Big Brother', 'total-drama': 'Total Drama' };
function _showName(format) {
  return _SHOW_NAMES[format] || 'Season';
}
