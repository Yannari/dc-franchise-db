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
import { addEpisodePosts, hasEpisode, keepOnlyEpisodes, storeOf, postsForEpisode } from './store.js';
import { rewriteEpisode } from './writer.js';

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
  const out = list
    .map((record, i) => ({ record, episode: Number(record?.num ?? record?.week ?? i + 1) }))
    .filter(r => r.record && Number.isFinite(r.episode));

  // ── and the night the season actually ends on ──
  //
  // A Big Brother finale is not a week. `simulateBBFinale` pushes it straight
  // to `gs.episodeHistory` and never writes it to `gs.bb.weeks`, so reading
  // only the week ledger meant the one episode everybody watches for — the
  // jury vote, the winner, the half-million — was the single episode the
  // audience had no reaction to at all.
  if (format === 'big-brother') {
    const seen = new Set(out.map(r => r.episode));
    for (const [i, record] of (gs?.episodeHistory || []).entries()) {
      if (!record?.isFinale && !record?.finale) continue;
      const episode = Number(record.num ?? i + 1);
      if (!Number.isFinite(episode) || seen.has(episode)) continue;
      seen.add(episode);
      out.push({ record, episode });
    }
    out.sort((a, b) => a.episode - b.episode);
  }
  return out;
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

/**
 * The same reconciliation, with the writer switched on.
 *
 * Async, and a SIBLING of `ensureFeeds` rather than a replacement, because the
 * synchronous path is the floor: everything that already calls it keeps working
 * with no key, no network and no await. This one builds exactly the same feed
 * and then asks the worker to improve the words on the moments that matter.
 *
 * Nothing is re-asked. `ensureFeeds` already skips an episode that has a feed,
 * so a refresh does not re-roll what the audience said about a night somebody
 * has already watched — which is also the reason this is safe to call on every
 * refresh rather than behind a button.
 */
export async function ensureFeedsWritten(gs, opts = {}) {
  const { format = 'total-drama', season = 0, endpoint = null, cast = null,
    fetchImpl = null, maxEvents = 6 } = opts;
  // Build first, always. If anything below fails the season already has a feed.
  const result = ensureFeeds(gs, opts);
  // A missing endpoint returned no `reason`, so the UI fell through to its
  // catch-all — "the writer returned nothing usable" — for the one case that is
  // not about the writer at all. It is the difference between "the model gave
  // me nothing" and "there is nowhere to ask", and only one of those is
  // something you can act on.
  if (!endpoint) return { ...result, written: 0, reason: 'no-endpoint' };
  if (!result.built.length) return { ...result, written: 0, reason: 'nothing-to-write' };

  // Read off the state rather than imported from core.js: everything under
  // this file is meant to be pure, this one is meant to know only what a game
  // state looks like, and core.js reaches for localStorage at module load.
  const roster = cast || [...new Set([
    ...(gs.activePlayers || []), ...(gs.eliminated || []),
    ...(gs.episodeHistory?.[0]?.houseAtStart || []),
  ])].filter(Boolean);
  let written = 0;
  const rejected = [];
  const reasons = [];

  for (const episode of result.built) {
    const rec = episodeRecords(gs, format).find(r => r.episode === episode);
    if (!rec) continue;
    const events = extractEvents(rec.record, { format, season, episode });
    const posts = postsForEpisode(gs, episode);
    if (!posts.length) continue;
    try {
      const out = await rewriteEpisode(posts, events, {
        cast: roster, endpoint, fetchImpl, maxEvents,
      });
      written += out.written;
      rejected.push(...out.rejected);
      if (out.reason) reasons.push(out.reason);
      // Written in place on the stored objects, so nothing needs re-adding.
    } catch (err) {
      // One episode failing to be improved is not one episode lost.
      console.warn(`social feed: could not write episode ${episode} —`, err?.message || err);
    }
  }
  // The first failing reason wins: they are all the same story per episode, and
  // a list of four identical strings tells nobody anything.
  const reason = written ? null : (reasons.find(Boolean) || null);
  return { ...result, written, rejected, reason };
}
