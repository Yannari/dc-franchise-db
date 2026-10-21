// When a season has to be played, so it does not slip a year.
//
// A season can't premiere before "now", the latest finale
// (js/franchise-calendar.js nextWindowFor). That makes the ORDER seasons are
// exported in matter: Total Drama 15 ran 26 weeks into September 2027, and the
// Circle, Big Brother and Perfect Match seasons due that spring and summer had
// not been played, so every one of them would have moved a year (the user,
// 2026-10-20: "prevent me when a season gotta be played/premiered so that
// mistake dont happen again, even if im in the middle of another show").
//
// Three things here:
//
//   1. A season's window is FIXED WHEN IT STARTS. The first save with an aired
//      episode writes it on `gs.airWindow` (and in localStorage, so the
//      calendar and the other seasons can see it), and the export uses it.
//      Exporting something else in the meantime no longer moves it.
//   2. `dueSeasons` lists every other show's next season that premieres while
//      the season being played is on air. Exporting the one being played
//      first would push those a year, unless they have started. The Run tab
//      shows them (renderAirWatch) and the export asks before it does it.
//   3. `liveSeason` is the season in the simulator right now, for the
//      calendar's "playing now" bar.
//
// Imports nothing that touches the DOM at load, so timeline.html can use it
// without the simulator.
import { SHOWS, DEFAULT_FORMAT } from './shows.js';
import {
  airKey, airLabel, airDateLabel, episodeAirDates, nextWindowFor, premiereDate, projectedRun,
} from './franchise-calendar.js';

/** How many people are in the cast the simulator holds (its saved cast list), or null. */
export function storedCastSize() {
  try {
    const cast = JSON.parse(localStorage.getItem('simulator_cast') || 'null');
    return Array.isArray(cast) && cast.length ? cast.length : null;
  } catch { return null; }
}

const LOCKS_KEY = 'dc_air_locks';
const QUEUES = ['_trQueue', '_drQueue', '_pmQueue', '_ciQueue', '_chQueue', '_rrQueue'];

const formatOf = cfg => (SHOWS[cfg?.format] ? cfg.format : DEFAULT_FORMAT);
const withFormat = rows => rows.map(s => ({ ...s, format: s.format || DEFAULT_FORMAT }));
const lockKey = (format, number) => `${format}#${number}`;
const shortOf = (format, number) => `${SHOWS[format]?.short || '?'} ${number}`;
const DAY = 86400000;

// ── THE SEASONS ON THE CALENDAR ──────────────────────────────────────

let _seasons = null;
let _loading = null;

/** seasons_database.json's rows, fetched once (localStorage copy offline). */
export function loadSeasonsDb() {
  if (_loading) return _loading;
  _loading = (async () => {
    let rows = null;
    try {
      const doc = await fetch('seasons_database.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null));
      if (Array.isArray(doc?.seasons)) rows = doc.seasons;
    } catch { /* offline */ }
    if (!rows) {
      try { rows = JSON.parse(localStorage.getItem('seasons_database') || 'null')?.seasons || []; } catch { rows = []; }
    }
    _seasons = withFormat(rows);
    return _seasons;
  })();
  return _loading;
}

/** The rows already loaded, or null. */
export function seasonsDbNow() { return _seasons; }

// ── LOCKS: A STARTED SEASON KEEPS ITS WINDOW ─────────────────────────

/** Every started-but-not-exported season's window, keyed "format#number". */
export function readLocks() {
  try { return JSON.parse(localStorage.getItem(LOCKS_KEY) || '{}') || {}; } catch { return {}; }
}

function writeLock(format, number, w) {
  try {
    const all = readLocks();
    all[lockKey(format, number)] = { airYear: w.airYear, airSlot: w.airSlot };
    localStorage.setItem(LOCKS_KEY, JSON.stringify(all));
  } catch { /* storage blocked: gs.airWindow still holds it */ }
}

/** A season's own exported row, or null. */
function rowOf(seasons, format, number) {
  return seasons.find(s => s.format === format && Number(s.seasonNumber) === Number(number)) || null;
}

/**
 * The season the simulator is SET UP for but has not started: its show and
 * number off the saved config, and how many people are in its cast. Null when
 * a season is already being played (liveSeason has it) or nothing is cast.
 */
export function setupSeason(gs, cfg, seasons, { castSize = storedCastSize() } = {}) {
  if ((gs?.episodeHistory || []).some(Boolean) || !castSize || !seasons) return null;
  const format = formatOf(cfg);
  const number = Number(cfg?.seasonNumber) || nextNumber(seasons, format);
  if (rowOf(seasons, format, number)) return null;
  return { format, number, castSize };
}

/** The show's next season number on the calendar. */
export function nextNumber(seasons, format) {
  const mine = seasons.filter(s => s.format === format && !s.allStars);
  return mine.length ? Math.max(...mine.map(s => Number(s.seasonNumber) || 0), mine.length) + 1 : 1;
}

/**
 * Where a season airs: its exported row, else the window it locked when it
 * started, else a booking, else the rule.
 */
export function windowOf(seasons, format, number, locks = readLocks()) {
  const row = rowOf(seasons, format, number);
  if (row && airKey(row) != null) return { airYear: row.airYear, airSlot: row.airSlot };
  return locks[lockKey(format, number)] || nextWindowFor(seasons, format, { number });
}

/**
 * Fix the running season's window the first time it is saved with an episode
 * aired. Called from saveGameState; does nothing until the calendar has loaded
 * (the next save stamps it) and never overwrites.
 */
export function stampAirWindow(gs, cfg) {
  if (!gs || gs.airWindow || !(gs.episodeHistory || []).length) return;
  if (!_seasons) { loadSeasonsDb(); return; }
  const format = formatOf(cfg);
  const number = Number(cfg?.seasonNumber || gs.seasonNumber) || nextNumber(_seasons, format);
  const chosen = String(cfg?.airWindow || 'auto');
  let w = null;
  if (chosen !== 'auto' && chosen.includes('|')) {
    const [y, slot] = chosen.split('|');
    if (Number(y) && slot) w = { airYear: Number(y), airSlot: slot };
  }
  w = w || windowOf(_seasons, format, number);
  if (!w) return;
  gs.airWindow = { airYear: w.airYear, airSlot: w.airSlot };
  if (!rowOf(_seasons, format, number)) writeLock(format, number, w);
}

// ── THE SEASON BEING PLAYED ──────────────────────────────────────────

/**
 * The season in the simulator, or null when there is none or it is already
 * exported. `total` is known for the shows that play a whole season on the
 * first press (their rows queue); a Total Drama or Big Brother season is
 * measured against its last season's length until it ends.
 */
export function liveSeason(gs, cfg, seasons, { castSize = storedCastSize() } = {}) {
  const rows = (gs?.episodeHistory || []).filter(Boolean);
  if (!rows.length || !seasons) return null;
  const format = formatOf(cfg);
  const number = Number(cfg?.seasonNumber || gs.seasonNumber) || nextNumber(seasons, format);
  if (rowOf(seasons, format, number)) return null;
  const queued = QUEUES.reduce((n, k) => n + (Array.isArray(gs[k]) ? gs[k].length : 0), 0);
  const aired = rows.length;
  const done = gs.phase === 'complete' || (queued === 0 && QUEUES.some(k => Array.isArray(gs[k])));
  // A queued season knows its length exactly. One being played without a queue
  // is estimated from its cast, not from whatever the last season happened to run.
  const guess = projectedRun(format, seasons, castSize);
  const total = done || queued ? aired + queued : Math.max(aired, guess.count);
  const window = gs.airWindow || windowOf(seasons, format, number);
  if (!window) return null;
  const dates = episodeAirDates(window, total, format);
  return {
    format, number, show: SHOWS[format], short: shortOf(format, number),
    aired, total, done, window, locked: !!gs.airWindow,
    basis: done || queued ? 'played' : guess.basis, cast: castSize || null,
    premiere: dates[0], current: dates[Math.min(aired, total) - 1], finale: dates[dates.length - 1],
  };
}

/**
 * Every other show's next season that premieres before the one being played
 * ends, and has not started. Exporting the live season first would carry
 * "now" past their premieres and move them a year. Booked and started
 * seasons keep their window and are left out.
 *
 * Each: { format, number, short, window, premiere, overdue, moves }. `overdue`
 * when the live season has already aired past the premiere; `moves` is where
 * it would land after the live season's export.
 */
export function dueSeasons(seasons, live, locks = readLocks()) {
  if (!seasons || !live) return [];
  const after = [...seasons, {
    format: live.format, seasonNumber: live.number, episodeCount: live.total, ...live.window,
  }];
  const out = [];
  for (const format of Object.keys(SHOWS)) {
    if (format === live.format) continue;
    const number = nextNumber(seasons, format);
    if (locks[lockKey(format, number)]) continue;
    const window = nextWindowFor(seasons, format, { number });
    if (!window) continue;
    const premiere = premiereDate(window, format);
    if (!premiere || premiere > live.finale) continue;
    // A booked season (`booked` on the show's registry entry) keeps its window anyway.
    const moves = nextWindowFor(after, format, { number });
    if (!moves || airKey(moves) === airKey(window)) continue;
    out.push({
      format, number, short: shortOf(format, number), window, premiere, moves,
      overdue: premiere <= live.current,
    });
  }
  return out.sort((a, b) => a.premiere - b.premiere);
}

/** The export's question, or '' when nothing would move. */
export function exportWarning(seasons, live) {
  const due = dueSeasons(seasons, live);
  if (!due.length) return '';
  return `Exporting ${live.short} moves the franchise to ${airDateLabel(live.finale)}. `
    + `${due.length === 1 ? 'This season premieres' : 'These seasons premiere'} before that and `
    + `${due.length === 1 ? "hasn't" : "haven't"} started, so ${due.length === 1 ? 'it' : 'they'} would move a year:\n\n`
    + due.map(d => `• ${d.short}: ${airLabel(d.window)} → ${airLabel(d.moves)}`).join('\n')
    + `\n\nTo keep ${due.length === 1 ? 'it' : 'them'}: Save season, play the first episode of each `
    + `(that fixes its date), then come back and export.\n\nExport anyway?`;
}

// ── THE RUN TAB ──────────────────────────────────────────────────────

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** The banner over the Run tab: what is due while this season airs. */
export function airWatchHtml(live, due) {
  if (!live || !due.length) return '';
  const weeks = d => Math.max(0, Math.round((d.premiere - live.current) / (7 * DAY)));
  const items = due.map(d => `<li><b>${esc(d.short)}</b> ${d.overdue
    ? `premiered ${esc(airDateLabel(d.premiere))}: ${esc(live.short)} has already aired past it (episode ${live.aired}, ${esc(airDateLabel(live.current))}).`
    : `premieres ${esc(airDateLabel(d.premiere))}, ${weeks(d) === 0 ? 'this week' : `in ${weeks(d)} week${weeks(d) === 1 ? '' : 's'}`} of ${esc(live.short)}.`}
    If ${esc(live.short)} is exported before it starts, it moves to ${esc(airLabel(d.moves))}.</li>`).join('');
  const hot = due.some(d => d.overdue);
  return `<div class="air-watch${hot ? ' hot' : ''}">
    <div class="aw-hd">📅 ${hot ? 'Due now on the franchise calendar' : 'Coming up while this season airs'}</div>
    <ul>${items}</ul>
    <div class="aw-how">Start ${due.length === 1 ? 'it' : 'them'} before you export ${esc(live.short)}: Save season, play ${due.length === 1 ? 'its' : 'each one\'s'} first episode (that fixes the date), then load this season back.</div>
  </div>`;
}

const AW_CSS = `.air-watch{margin:0 0 10px;padding:10px 14px;border-radius:10px;border:1px solid rgba(250,204,21,.45);background:rgba(250,204,21,.08);color:#fde68a;font-size:13px;line-height:1.45}
.air-watch.hot{border-color:rgba(248,113,113,.6);background:rgba(248,113,113,.1);color:#fecaca}
.air-watch .aw-hd{font-weight:800;letter-spacing:.02em;margin-bottom:4px}
.air-watch ul{margin:4px 0 6px 18px;padding:0}
.air-watch .aw-how{opacity:.8;font-size:12px}`;

/** Draw the banner into #air-watch. Safe to call on every render. */
export async function renderAirWatch(gs, cfg) {
  const host = typeof document !== 'undefined' && document.getElementById('air-watch');
  if (!host) return;
  if (!document.getElementById('air-watch-css')) {
    const st = document.createElement('style');
    st.id = 'air-watch-css';
    st.textContent = AW_CSS;
    document.head.appendChild(st);
  }
  const seasons = await loadSeasonsDb();
  stampAirWindow(gs, cfg);
  const live = liveSeason(gs, cfg, seasons);
  host.innerHTML = airWatchHtml(live, dueSeasons(seasons, live));
}

// ── THE CALENDAR'S VIEW OF THE SIMULATOR ─────────────────────────────

/**
 * The simulator's saved season, read straight from its IndexedDB and its
 * setup from localStorage, for pages that do not load the simulator. Null
 * when there is none. Never creates the database.
 */
export function readSavedGame() {
  return new Promise(resolve => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open('dc_franchise_db');
      req.onupgradeneeded = () => { req.transaction.abort(); };
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('gameState')) { db.close(); return resolve(null); }
        const get = db.transaction('gameState', 'readonly').objectStore('gameState').get('gs');
        get.onsuccess = () => {
          let cfg = null;
          try { cfg = JSON.parse(localStorage.getItem('simulator_config') || 'null'); } catch { /* none */ }
          db.close();
          resolve(get.result ? { gs: get.result, cfg } : null);
        };
        get.onerror = () => { db.close(); resolve(null); };
      };
    } catch { resolve(null); }
  });
}
