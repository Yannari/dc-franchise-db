// ══════════════════════════════════════════════════════════════════════
// ratings-backfill.js — putting a tier on the seasons you already played
// ══════════════════════════════════════════════════════════════════════
//
// The ratings are a reader, so any season can be rated at any time — but only
// from the thing they read, which is the episode records. A published season
// document does not have them (it is a summary: votes, placements, prose) and
// `seasons_database.json` is thinner still. Neither can produce a rating, and
// deriving a worse one from what they DO have would put two different numbers
// on the same season depending on which page you opened.
//
// The episode records live in one place: the season saves in IndexedDB. So the
// backfill walks those, rates each one, and posts the results to the dev
// server, which merges them into the index the seasons page actually renders.
//
// ── WHY IT IS A BUTTON AND NOT A BUILD STEP ──
//
// The saves are in a browser, not the repo. Nothing on a CI runner or in a
// static build can see them. A one-click walk is the only shape this can take,
// and it is idempotent — run it again after playing a season and the new one
// joins the others.
import { ratingsForSeason, tierFor, seasonScore } from './ratings.js';
import { _idbGet } from './savestate.js';
import { DEFAULT_FORMAT, formatPrefix } from './shows.js';

/**
 * The rating for one saved season, or a reason it has none.
 *
 * Pure — takes a save object, returns a result — so the walk over IndexedDB
 * stays a thin wrapper and the part with the judgement in it is testable
 * without a browser.
 */
export function rateSave(save) {
  const name = save?.name || save?.config?.name || 'Untitled';
  const hist = save?.gs?.episodeHistory || [];
  if (!hist.length) return { name, ok: false, why: 'no episodes recorded' };

  const format = save.gs?.format || save.config?.format || DEFAULT_FORMAT;
  const num = Number(save.gs?.seasonNumber ?? save.config?.seasonNumber ?? 0);
  if (!num) return { name, ok: false, why: 'no season number on the save' };

  const r = ratingsForSeason(hist, { format });
  if (!r) return { name, ok: false, why: 'nothing readable in the history' };

  // A season still being played gets a rating too — it is just the verdict so
  // far, and the page can say so. Refusing would mean the season you are in
  // the middle of is the one season with no tier.
  const complete = save.gs?.phase === 'complete' || !!save.gs?.finaleResult?.winner;
  return {
    name, ok: true, complete,
    seasonId: `${formatPrefix(format)}-${num}`,
    seasonNumber: num,
    format,
    episodes: hist.length,
    ratings: {
      v: r.v,
      score: r.score,
      tier: r.tier,
      demos: Object.fromEntries(Object.entries(r.demos)
        .map(([k, v]) => [k, Math.round(v * 10) / 10])),
      curve: r.weeks.map(w => w.overall),
      // Stamped so a page can distinguish "this is where it stood at episode
      // nine" from a finished season's verdict.
      throughEpisode: hist.length,
      complete,
    },
  };
}

/** Every season save in this browser, newest index order. */
async function loadSaves() {
  const index = (await _idbGet('season_index')) || [];
  const out = [];
  for (const entry of index) {
    if (!entry?.name) continue;
    try {
      const save = await _idbGet(`season_${entry.name}`);
      if (save) out.push(save);
    } catch { /* one unreadable save is not the end of the walk */ }
  }
  return out;
}

/**
 * Rate every saved season and merge the results into `seasons_database.json`.
 *
 * Returns a summary rather than throwing on a partial failure: a save with no
 * season number is a fact about that save, not a reason to abandon the other
 * fourteen.
 */
export async function backfillSeasonRatings({ post = true } = {}) {
  const saves = await loadSaves();
  if (!saves.length) return { ok: false, error: 'No season saves in this browser.' };

  const results = saves.map(rateSave);
  const rated = results.filter(r => r.ok);
  const skipped = results.filter(r => !r.ok);
  if (!rated.length) return { ok: false, error: 'No save had a readable season in it.', skipped };

  // LAST SAVE WINS on a duplicate season number — several saves of the same
  // season at different episodes is the normal way this list looks, and the
  // furthest-played one is the one worth rating.
  const bySeason = {};
  for (const r of rated) {
    const held = bySeason[r.seasonId];
    if (!held || r.episodes >= held.episodes) bySeason[r.seasonId] = r;
  }
  const payload = Object.fromEntries(
    Object.entries(bySeason).map(([id, r]) => [id, r.ratings]));

  const summary = {
    ok: true,
    rated: Object.entries(bySeason).map(([id, r]) => ({
      seasonId: id, name: r.name, score: r.ratings.score,
      tier: r.ratings.tier.label, episodes: r.episodes, complete: r.complete,
    })).sort((a, b) => b.score - a.score),
    skipped: skipped.map(r => ({ name: r.name, why: r.why })),
  };
  if (!post) return summary;

  try {
    const res = await fetch('/api/season-ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratings: payload }),
    });
    const body = await res.json().catch(() => ({}));
    summary.wrote = body.wrote || null;
    summary.unmatched = body.unmatched || [];
    if (!body.ok) summary.postError = body.error || `HTTP ${res.status}`;
  } catch (e) {
    summary.postError = String(e?.message || e);
  }

  // ── THE FALLBACK THAT KEEPS THE WORK ──
  //
  // Only serve.py answers POST. A page opened from any other static server —
  // and there are several ways to serve this folder — gets a 405 and the
  // ratings evaporate, which is what happened the first time this ran for
  // real. So when the write fails the merge happens HERE instead, against the
  // index fetched from wherever the page is being served, and the finished
  // file is downloaded ready to drop into the repo.
  if (summary.postError) {
    summary.payload = payload;
    try {
      const doc = await (await fetch('seasons_database.json', { cache: 'no-store' })).json();
      const rows = Array.isArray(doc?.seasons) ? doc.seasons : [];
      const hit = [];
      for (const [id, r] of Object.entries(payload)) {
        // A bare integer is Total Drama, permanently, so a legacy row with no
        // seasonId still matches td-N.
        const row = rows.find(x => (x.seasonId || `td-${x.seasonNumber}`) === id);
        if (row) { row.ratings = r; hit.push(id); }
      }
      summary.merged = hit;
      summary.unmatched = Object.keys(payload).filter(id => !hit.includes(id));
      if (hit.length) {
        _download('seasons_database.json', JSON.stringify(doc, null, 2) + String.fromCharCode(10));
        summary.downloaded = true;
      }
    } catch (e) {
      summary.mergeError = String(e?.message || e);
    }
  }
  return summary;
}

/** Hand a finished file to the browser. */
function _download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The button's version: run it, then say plainly what happened. */
export async function rateSavedSeasons() {
  let s;
  try { s = await backfillSeasonRatings(); } catch (e) {
    alert(`Could not rate the saved seasons: ${e?.message || e}`);
    return null;
  }
  if (!s.ok) { alert(s.error); return s; }

  const lines = s.rated.map(r => `  ${String(r.score).padStart(5)}  ${r.tier.padEnd(9)}`
    + ` ${r.seasonId}  ${r.name}${r.complete ? '' : ` (through ep ${r.episodes})`}`);
  const notes = [];
  if (s.skipped.length) {
    notes.push('', 'Not rated:', ...s.skipped.map(x => `  ${x.name} — ${x.why}`));
  }
  if (s.unmatched?.length) {
    notes.push('', `No row in seasons_database.json for: ${s.unmatched.join(', ')}`);
  }
  if (s.downloaded) {
    notes.push('',
      `Only serve.py accepts the write, and this page is not on it (${s.postError}).`,
      'So seasons_database.json has been DOWNLOADED with the tiers merged in.',
      'Drop it into the project folder, replacing the existing one, and reload',
      'the seasons page.');
  } else if (s.postError) {
    notes.push('', `The index was NOT written: ${s.postError}`,
      s.mergeError ? `and the download failed too: ${s.mergeError}` : '',
      'Serve the project with `python serve.py` and run this again.');
  } else {
    notes.push('', 'seasons_database.json updated — reload the seasons page.');
  }
  alert([`Rated ${s.rated.length} saved season${s.rated.length === 1 ? '' : 's'}:`,
    ...lines, ...notes].join('\n'));
  return s;
}

/** Exported for the badge: what a page should show for a season row. */
export function tierBadgeFor(seasonRow) {
  const score = Number(seasonRow?.ratings?.score);
  if (!Number.isFinite(score)) return null;
  return seasonRow.ratings.tier || tierFor(score);
}

export { seasonScore };
