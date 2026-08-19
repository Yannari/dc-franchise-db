// Running the life resolver as part of finishing a season.
//
// ── WHY THIS EXISTS AS A MODULE ──
//
// The resolver was reachable from exactly one place: opening life.html swept
// the newest unresolved off-season and proposed events for it. That works, but
// it makes the inbox the thing that advances the franchise — the author has to
// remember to visit a page for the world to move on. Finishing a season should
// be what fills the inbox.
//
// The comment in life.html gave two reasons the sweep did not live in the
// export. One is gone: the Worker had no endpoint for the log, so a hook on the
// live site would resolve an off-season and then drop it on the floor; it has
// one now. The other still stands and is honoured below — THE EXPORT IS THE
// MOST IMPORTANT FLOW IN THE PROJECT, and no fault in a life resolver may ever
// fail a publish. Everything here is called inside a try/catch, reports what it
// did in words, and returns a reason instead of throwing.
//
// Both callers share this module rather than each holding their own copy: the
// context building (careers, the social graph, who played what) is the part
// that decides WHO an event happens to, and two copies of that drifting apart
// would show up as two different lives for the same character depending on
// which page resolved them.
//
// Nothing here approves anything. Every event it produces is `proposed`, which
// changes nothing a reader sees — only approved rows reach a wiki page or
// Dramagram — so an automatic hook can never quietly rewrite canon.

import { resolveOffSeason, socialGraph } from './life-resolver.js';
import { airKey, byAirDate } from './franchise-calendar.js';
import { careersIn } from './records.js';

const WORKER = 'https://dc-studio.yannari19.workers.dev';
const TOKEN_KEY = 'studio_api_token';
const LIFE_PATH = '/api/life-events';

/** The stored studio token, optionally asking for it once. */
export function studioToken(ask = true) {
  let t = '';
  try { t = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* storage blocked */ }
  if (t || !ask) return t;
  t = (prompt('Studio token (stored in this browser only):') || '').trim();
  if (t) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* blocked */ } }
  return t;
}

/**
 * The log as it stands.
 *
 * The endpoint first and the static file last, because the file on disk is only
 * as fresh as the last save that reached this machine — the Worker's copy is
 * the one the live site has been writing to.
 */
export async function loadLifeLog() {
  try {
    const r = await fetch(LIFE_PATH);
    const j = await r.json();
    if (j.ok && Array.isArray(j.events)) return j.events;
  } catch { /* no endpoint here */ }
  try {
    const r = await fetch(WORKER + LIFE_PATH);
    const j = await r.json();
    if (j.ok && Array.isArray(j.events)) return j.events;
  } catch { /* offline */ }
  try {
    const j = await fetch('life_events.json').then(r => r.json());
    return j.events || [];
  } catch { return []; }
}

/**
 * Write the whole log, wherever it can be written.
 *
 * serve.py when it is running, and the Studio Worker otherwise — the two
 * endpoints take the same body and rewrite the same file, deliberately, so a
 * local checkout and the live site cannot end up with different rules about
 * what is canon.
 *
 * Returns null when neither is reachable, and the caller says so rather than
 * pretending: a silent failure here looks exactly like a successful save.
 */
export async function saveLifeLog(all, { ask = true } = {}) {
  // Local first: if serve.py is running this is the checkout being worked on,
  // and writing the file directly is what the author expects.
  try {
    const r = await fetch(LIFE_PATH, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: all }),
    });
    const j = await r.json();
    if (j.ok) return { ...j, where: 'this checkout' };
  } catch { /* not running locally — try the Worker */ }

  const t = studioToken(ask);
  if (!t) return null;
  const r = await fetch(WORKER + LIFE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ events: all }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return { ...j, where: 'the site' };
}

/**
 * Everything the resolver needs about the franchise, built once.
 *
 * The graph is who knows whom across every season anybody played, and it is
 * what decides WHO a two-person event is about — so a feud lands on a rival and
 * moving in lands on a friend. `castBySeason` is read from the record rather
 * than asked for, because the resolver's central rule is that being cast is the
 * test: it has to know which relationships had a season pointed at them.
 */
export function lifeContext(pdb = {}, sdb = {}) {
  const seasons = sdb.seasons || [];
  const players = pdb.players || [];
  const careers = careersIn(pdb, 'all');
  const castBySeason = new Map();
  for (const p of players) {
    for (const d of p.seasonDetails || []) {
      if (!d.seasonId) continue;
      if (!castBySeason.has(d.seasonId)) castBySeason.set(d.seasonId, []);
      castBySeason.get(d.seasonId).push(p.id);
    }
  }
  const pairsFor = seasonId => {
    const out = [];
    const seen = new Set();
    for (const c of careers) {
      for (const d of c.details || []) {
        if (d.seasonId !== seasonId || !d.showmance) continue;
        const other = careers.find(x => x.name === d.showmance);
        if (!other) continue;
        const key = [c.id, other.id].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push([c.id, other.id]);
      }
    }
    return out;
  };
  return {
    seasons,
    careers,
    castBySeason,
    pairsFor,
    names: Object.fromEntries(players.map(p => [p.id, p.name])),
    graph: socialGraph(careers),
    seasonRank: new Map(seasons.map(s => [s.seasonId, airKey(s)])),
  };
}

/** Resolve one gap against a prepared context. Proposes; never approves, never saves. */
export function resolveGapWith(ctx, season, log) {
  return resolveOffSeason({
    season,
    careers: ctx.careers,
    events: log,
    seasonRank: ctx.seasonRank,
    graph: ctx.graph,
    cast: ctx.castBySeason.get(season.seasonId) || [],
    pairs: ctx.pairsFor(season.seasonId),
  });
}

/**
 * The export hook: resolve the off-season the exported season just created.
 *
 * ONE GAP, THE ONE THAT JUST OPENED. Resolving everything outstanding is
 * correct arithmetic and a terrible inbox — on a franchise with fifteen
 * unresolved gaps it proposed 1,659 events at once, which is a backlog rather
 * than something anybody reviews. Older gaps stay on life.html's button, one at
 * a time.
 *
 * Every early return is a reason in words, not a silent no-op, because the two
 * ways this legitimately does nothing — the season is not published yet, and
 * the gap already has events — look identical from the outside and mean
 * completely different things.
 */
export async function resolveAfterSeason({ seasonId = null, seasonNumber = null, format = null } = {}) {
  const [sdb, pdb, log] = await Promise.all([
    fetch('seasons_database.json').then(r => r.json()).catch(() => ({ seasons: [] })),
    fetch('players_database.json').then(r => r.json()).catch(() => ({ players: [] })),
    loadLifeLog(),
  ]);

  const seasons = sdb.seasons || [];
  const season = seasons.find(s => (seasonId && s.seasonId === seasonId)
    || (seasonNumber != null && s.seasonNumber === seasonNumber
        && (format == null || (s.format || null) === format)));

  // NOT PUBLISHED YET is the ordinary case when publishing is off: the export
  // downloaded its files and the copy the site reads has not moved. Nothing is
  // wrong and nothing is lost — life.html's sweep picks the gap up whenever the
  // season does land.
  if (!season) return { ok: false, reason: 'the season is not in the published record yet' };
  if (airKey(season) == null) return { ok: false, reason: 'the season has no air date, so it has no "after"' };

  const already = log.filter(e => e.afterSeason === season.seasonId).length;
  if (already) {
    return { ok: false, season, reason: 'already resolved — ' + already + ' event' + (already === 1 ? '' : 's') + ' after it' };
  }

  const ctx = lifeContext(pdb, sdb);
  const fresh = resolveGapWith(ctx, season, log);
  if (!fresh.length) return { ok: true, season, added: 0, reason: 'a quiet off-season — nothing happened to anybody' };

  const saved = await saveLifeLog(log.concat(fresh), { ask: false });
  return {
    ok: true, season, added: fresh.length, saved,
    // Unsaved is worth saying: the events exist, they are just not anywhere the
    // inbox will find them, and opening life.html will propose the gap again.
    reason: saved ? ('saved to ' + saved.where) : 'not saved — no way to write the log from here',
  };
}

/** Seasons that have aired and have no off-season, oldest first. */
export function unresolvedGaps(seasons = [], log = []) {
  const done = new Set(log.map(e => e.afterSeason));
  return seasons.filter(s => airKey(s) != null && !done.has(s.seasonId)).sort(byAirDate);
}
