// The wiring between a season being played and the feed that reacts to it.
//
// The three modules under this one are pure — events in, posts out, no gs, no
// DOM, no network. This is the adapter that reads the season actually loaded in
// the simulator and keeps its feed current. It is the ONLY file in js/social
// that knows what a game state looks like.
//
// It works by RECONCILIATION rather than by hooking every place an episode is
// written. There are four `episodeHistory.push` sites in episode.js alone, plus
// the Big Brother week ledger and the replay path that rewinds the season and
// re-runs it — a hook on each is five chances to forget one, and a forgotten
// hook shows up as an episode the audience mysteriously had no opinion about.
// Instead: look at what the season contains, compare it to what the feed covers,
// and fix the difference. That is idempotent, so calling it twice is free, and
// it backfills a season that was played before this feature existed.
import { extractEvents } from './events.js';
import { buildEpisodeFeed } from './feed.js';
import { addEpisodePosts, hasEpisode, keepOnlyEpisodes, storeOf } from './store.js';

/**
 * Every episode of the loaded season, in the shape extractEvents reads.
 *
 * The two shows keep their episodes in different places and number them with
 * different fields: Total Drama writes `gs.episodeHistory[].num`, Big Brother
 * writes `gs.bb.weeks[].num` (the published season document renames that to
 * `week`, which is why both are accepted).
 */
export function episodeRecords(gs, format) {
  const list = format === 'big-brother'
    ? (gs?.bb?.weeks || [])
    : (gs?.episodeHistory || []);
  return list
    .map((record, i) => ({ record, episode: Number(record?.num ?? record?.week ?? i + 1) }))
    .filter(r => r.record && Number.isFinite(r.episode));
}

/**
 * The seed an episode's feed is built from.
 *
 * Derived from the season and episode rather than random, so rebuilding an
 * episode reproduces the same feed. A viewer who reloads must not find that the
 * audience said different things about a night they already watched.
 */
export function feedSeed(season, episode) {
  return (Number(season) || 0) * 1000 + (Number(episode) || 0) + 1;
}

/**
 * Bring the feed in line with the season.
 *
 * Builds a feed for every episode that lacks one, drops feeds for episodes the
 * season no longer has, and leaves everything else alone. `rebuild` forces every
 * episode to be rewritten — used by the replay path, where an episode kept its
 * number but is now a different night.
 *
 * Returns what changed, so a caller can say so rather than guess.
 */
export function ensureFeeds(gs, {
  format = 'total-drama', season = 0, popularity = null, rebuild = false, only = null,
} = {}) {
  if (!gs) return { built: [], dropped: [], posts: 0 };

  const records = episodeRecords(gs, format);
  // An episode that no longer exists takes its feed with it. Without this, a
  // replayed season keeps the reactions to the night it replaced.
  const dropped = keepOnlyEpisodes(gs, records.map(r => r.episode));

  const built = [];
  for (const { record, episode } of records) {
    if (only != null && Number(only) !== episode) continue;
    if (!rebuild && hasEpisode(gs, episode)) continue;

    const events = extractEvents(record, { format, season, episode });
    if (!events.length) continue;

    const posts = buildEpisodeFeed(events, {
      popularity: popularity || gs.popularity || null,
      seed: feedSeed(season, episode),
    });
    if (!posts.length) continue;

    addEpisodePosts(gs, episode, posts);
    built.push(episode);
  }

  return { built, dropped, posts: storeOf(gs).posts.length };
}
