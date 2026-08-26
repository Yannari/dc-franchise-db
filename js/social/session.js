// The feed, for the season currently open in the simulator.
//
// `live.js` reconciles a feed against a game state it is handed; this is the
// three-line adapter that knows WHICH game state — the one in core.js — and what
// show and season number it belongs to. Split out so the reconciler stays
// testable without a browser, and so the two callers (the run tab after an
// episode, the sync button before publishing) share one entry point rather than
// each deciding what format the season is.
import { gs, seasonConfig, seasonFormat } from '../core.js';
import { ensureFeeds, ensureFeedsWritten } from './live.js';
import { storeOf, toPublishPayload } from './store.js';
import { writerEndpoint } from './writer.js';

/**
 * Which show is loaded, in the vocabulary the rest of the feed uses.
 *
 * Resolved against the registry rather than tested against one slug. The
 * two-way ternary this replaces called every show that was not Big Brother
 * Total Drama, so a third show's whole Birdie/ChatAlumni feed was written in
 * Total Drama's words — the exact bug the show registry exists to stop, one
 * level down from the screens that were fixed for it.
 *
 * Consumers that only know two shows degrade rather than break: adapter.js
 * words() hands an unregistered-to-it format the GENERIC vocabulary, and
 * events.js reads a non-BB episode with the Total Drama reader — which is
 * correct while the only engines that produce episodes are those two.
 */
export function currentFormat() {
  return seasonFormat(seasonConfig);
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
/**
 * Is the audience being WRITTEN this season, or generated?
 *
 * Off unless three things are all true: the season asked for it, a worker URL
 * exists, and the model is reachable. Costing somebody money because a default
 * changed under them is not a thing a simulator should be able to do, so the
 * switch is explicit and the absence of any part of the chain is silent.
 */
export function socialWriterOn() {
  return seasonConfig?.socialWriter === true && !!writerEndpoint(seasonConfig);
}

/**
 * The same refresh, awaited, when the writer is on.
 *
 * Separate from `refreshSocialFeed` because that one is called after every
 * episode from a place that cannot await — and must not start doing so, since a
 * network round trip between "next episode" and the screen updating is a
 * simulator that hangs on somebody else's uptime. The written pass is for the
 * places that can wait: the sync button, and the run tab's own catch-up.
 */
export async function refreshSocialFeedWritten({ rebuild = false } = {}) {
  if (!socialWriterOn()) return refreshSocialFeed({ rebuild });
  try {
    return await ensureFeedsWritten(gs, {
      format: currentFormat(),
      season: currentSeasonNumber(),
      popularity: gs?.popularity || null,
      endpoint: writerEndpoint(seasonConfig),
      rebuild,
    });
  } catch (err) {
    console.warn('social feed: could not write —', err?.message || err);
    // The templates already ran inside `ensureFeedsWritten`; this is only for a
    // failure before that, and a season must still end up with a feed.
    return refreshSocialFeed({ rebuild });
  }
}

/**
 * Throw away one episode's reactions and make them again.
 *
 * The refresh deliberately never rewrites an episode that already has a feed —
 * what the audience said about a night somebody watched is not a thing to
 * re-roll. This is the escape hatch for when you actually want it: one night,
 * named, and every other night untouched.
 *
 * `addEpisodePosts` replaces that episode's rows rather than appending, and
 * publishing sends the whole store, so the episodes either side go up exactly
 * as they already were.
 */
export async function rebuildEpisodeFeed(episode) {
  const ep = Number(episode);
  if (!Number.isFinite(ep) || ep < 1) return { built: [], error: 'not an episode number' };
  const opts = { rebuild: true, only: ep };
  if (!socialWriterOn()) return refreshSocialFeed(opts);
  try {
    return await ensureFeedsWritten(gs, {
      format: currentFormat(),
      season: currentSeasonNumber(),
      popularity: gs?.popularity || null,
      endpoint: writerEndpoint(seasonConfig),
      ...opts,
    });
  } catch (err) {
    console.warn('social feed: could not rebuild —', err?.message || err);
    return refreshSocialFeed(opts);
  }
}

export function refreshSocialFeed({ rebuild = false, only = null } = {}) {
  try {
    return ensureFeeds(gs, {
      format: currentFormat(),
      season: currentSeasonNumber(),
      popularity: gs?.popularity || null,
      rebuild,
      // Forwarded, or a request to redo ONE night quietly redid nothing —
      // `rebuild` without `only` is the whole season, and dropping `only` on
      // the floor turned the narrowest operation into the widest one.
      only,
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
