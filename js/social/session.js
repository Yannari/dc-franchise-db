// The feed, for the season currently open in the simulator.
//
// `live.js` reconciles a feed against a game state it is handed; this is the
// three-line adapter that knows WHICH game state — the one in core.js — and what
// show and season number it belongs to. Split out so the reconciler stays
// testable without a browser, and so the two callers (the run tab after an
// episode, the sync button before publishing) share one entry point rather than
// each deciding what format the season is.
import { gs, seasonConfig } from '../core.js';
import { ensureFeeds } from './live.js';
import { storeOf, toPublishPayload } from './store.js';

/** Which show is loaded, in the vocabulary the rest of the feed uses. */
export function currentFormat() {
  return seasonConfig?.format === 'big-brother' ? 'big-brother' : 'total-drama';
}

/**
 * Which season is loaded.
 *
 * Deliberately NOT `_getSeasonNumber()` from stats-export: that one prompts when
 * the number is missing, and a background feed refresh must never put a dialog
 * in front of somebody who just pressed "next episode". An unnumbered season
 * gets 0 and a feed that still works.
 */
export function currentSeasonNumber() {
  return Number(seasonConfig?.seasonNumber) || 0;
}

/**
 * Bring the loaded season's feed up to date.
 *
 * Safe to call after every episode and before every sync: it writes only the
 * episodes that have no feed yet. Never throws — a feed that fails to build must
 * not take the episode you just played down with it, so the failure is reported
 * and the season carries on.
 */
export function refreshSocialFeed({ rebuild = false } = {}) {
  try {
    return ensureFeeds(gs, {
      format: currentFormat(),
      season: currentSeasonNumber(),
      popularity: gs?.popularity || null,
      rebuild,
    });
  } catch (err) {
    console.warn('social feed: could not update —', err?.message || err);
    return { built: [], dropped: [], posts: 0, error: String(err?.message || err) };
  }
}

/** The loaded season's feed, shaped for the site. Null when there is none. */
export function socialPublishPayload() {
  try {
    if (!storeOf(gs).posts.length) return null;
    return toPublishPayload(gs, {
      season: currentSeasonNumber(),
      format: currentFormat(),
    });
  } catch {
    return null;
  }
}
