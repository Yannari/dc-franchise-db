// ══════════════════════════════════════════════════════════════════════
// rr/past.js — the shows a racer has been on before, whatever the team is now
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-11-03: "how can i make them reference their show while their relationship is not reality tv". Being
// a veteran was only a relationship ('reality-vets'), so a married couple from Total Drama never said they had been on
// television, and none of the vets' lines named a show. Here it is a fact about each person, read from their records
// (franchise-meta.js careerFor) when the race is built and kept on the team (team.past), so it never changes in the
// race: the show they were last on, whether they ever won or made a final, and what they were to their partner there.
// (pure: the career is passed in, rr-run.js gives franchise-meta.js careerFor, so the engine imports no ledger)
import { showName } from '../shows.js';

/** One person's past shows: { show, best, seasons: [{ format, num, place, won, final }], showmances, rivals, allies }. */
export function pastOf(name, career) {
  let c = null;
  try { c = career(name); } catch { c = null; }
  if (!c?.seasons?.length) return null;
  const seasons = c.seasons.map(s => ({ format: s.format, num: s.seasonNum, place: s.placement || 0, won: !!s.winner, final: !!s.finalist }));
  const last = seasons.at(-1);
  const names = list => [...new Set((list || []).map(x => (typeof x === 'string' ? x : x?.partner || x?.name)).filter(Boolean))];
  return {
    show: showName(last.format),
    best: seasons.some(s => s.won) ? 'won' : seasons.some(s => s.final) ? 'final' : null,
    seasons,
    showmances: names(c.showmances),
    rivals: Object.keys(c.rivals || {}),
    allies: Object.keys(c.allies || {}),
  };
}

/** The two of a team's past, by name: only the ones who have one. */
export function pastOfTeam(a, b, career) {
  const out = {};
  for (const n of [a, b]) { const p = pastOf(n, career); if (p) out[n] = p; }
  return Object.keys(out).length ? out : null;
}

// a season two people were both on, the latest: { format, num, x, y } (each one's row in it)
export function sharedSeason(px, py) {
  if (!px || !py) return null;
  for (const s of [...px.seasons].reverse()) {
    const t = py.seasons.find(o => o.format === s.format && o.num === s.num);
    if (t) return { format: s.format, num: s.num, x: s, y: t };
  }
  return null;
}

/** What x and y were to each other on a show they were both on: 'showmance', 'rivals', 'allies', 'cast', or null. */
export function metOn(px, py, y) {
  if (!sharedSeason(px, py)) return null;
  if (px.showmances.includes(y)) return 'showmance';
  if (px.rivals.includes(y)) return 'rivals';
  if (px.allies.includes(y)) return 'allies';
  return 'cast';
}

/** On a season both were on, did x do better ('ahead'), worse ('behind'), or neither ('even')? */
export function pastEdge(px, py) {
  const s = sharedSeason(px, py);
  if (!s) return null;
  const rank = r => (r.won ? -2 : r.final ? -1 : 0) * 1000 + (r.place || 999);
  const a = rank(s.x), b = rank(s.y);
  return a < b ? 'ahead' : a > b ? 'behind' : 'even';
}
