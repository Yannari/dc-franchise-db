// ══════════════════════════════════════════════════════════════════════
// episode-store.js — where the episode screenplays live
// ══════════════════════════════════════════════════════════════════════
//
// The generated episodes are written to IndexedDB, which is per ORIGIN and not
// per page — so any page on the site can read them. What stopped the simulator
// from doing it was that the database name, the store name and the key rule
// were written inline in current-season.html, so nothing else could address
// them. A season could only be turned into wiki prose from the one page that
// happened to hold those four constants.
//
// They live here now. current-season.html keeps its own copy of the KEY RULE
// for the sync call sites it has always had, and tests/wiki-fill-run.test.js
// pins the two together so they cannot drift.

import { SHOWS, formatPrefix, DEFAULT_FORMAT } from './shows.js';

export const EPISODE_DB = 'dc_current_season';
export const EPISODE_STORE = 'data';
const DB_VERSION = 1;

let _db = null;

/** The store, opened once per page. */
export function openStore() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(EPISODE_DB, DB_VERSION);
    req.onupgradeneeded = () => { req.result.createObjectStore(EPISODE_STORE); };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

/**
 * The key one episode transcript is stored under.
 *
 * THE SITE'S PERMANENT RULE: a bare integer is Total Drama, and every other
 * show gets its own prefix. Total Drama keeps the key it has always had, so
 * fourteen seasons of episodes need no migration, and Big Brother 5 stops
 * overwriting Total Drama 5.
 */
export function episodeKey(season, episode, format = DEFAULT_FORMAT) {
  const n = Number(season) || 1;
  const e = Number(episode) || 1;
  if (!format || format === DEFAULT_FORMAT) return `td_episode_s${n}_e${e}`;
  const pre = SHOWS[format] ? formatPrefix(format) : format;
  return `${pre}_episode_s${n}_e${e}`;
}

/** One episode's text, or '' when it was never written. */
export async function getEpisode(season, episode, format) {
  const db = await openStore();
  const key = episodeKey(season, episode, format);
  return new Promise(resolve => {
    const req = db.transaction(EPISODE_STORE, 'readonly').objectStore(EPISODE_STORE).get(key);
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : '');
    req.onerror = () => resolve('');
  });
}

/**
 * Every episode this season has a transcript for.
 *
 * Gaps are normal and are not an error: an episode nobody generated is simply
 * not in the list, and both fills are built to say so rather than to invent
 * the missing round.
 */
export async function listEpisodes(season, format, { max = 40 } = {}) {
  const out = [];
  for (let i = 1; i <= max; i++) {
    const text = await getEpisode(season, i, format);
    if (text && String(text).trim()) out.push({ episode: i, transcript: String(text) });
  }
  return out;
}
