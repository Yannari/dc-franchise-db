// Where a season's feed lives.
//
// Posts are generated ONCE and kept, so engagement can accumulate — a post can
// be ratioed hours after it was written, which is what makes a feed feel alive
// rather than rendered. It also means the feed you saw is the feed that exists.
//
// ── THE ONE RULE THAT MATTERS ──────────────────────────────────────────────
//
// `gs.social` MUST NOT be added to the whitelist in `snapshotGameState()`.
//
// That whitelist is opt-in, so staying out of it is the default rather than
// something to remember — but it is worth writing down why, because the same
// mistake has already been made once in this codebase and cost 10MB. Its own
// comment records it: copying the weeks ledger into the snapshot "put all N
// weeks inside episode N's snapshot, so the history grew quadratically and
// 'load an episode' meant cloning and serializing every week the season had ever
// played, again."
//
// A feed is 60-150 posts per episode. Over a season that is thousands, and every
// episode snapshot would carry every post written before it. The feed is a
// season-long log, exactly like the weeks ledger, and belongs in the same place:
// on the season, not in every episode's copy of it.
//
// Pure except for reading and writing `gs.social` through the accessors below.

/** The shape a fresh store takes. Bumped only if the post shape changes. */
export const SOCIAL_VERSION = 1;

/** An empty store. Kept as a function so callers cannot share one by accident. */
export function emptyStore() {
  return { version: SOCIAL_VERSION, posts: [], builtEpisodes: [] };
}

/** The store on a game state, created on first use. */
export function storeOf(gs) {
  if (!gs) return emptyStore();
  if (!gs.social || typeof gs.social !== 'object') gs.social = emptyStore();
  if (!Array.isArray(gs.social.posts)) gs.social.posts = [];
  if (!Array.isArray(gs.social.builtEpisodes)) gs.social.builtEpisodes = [];
  return gs.social;
}

/**
 * Add an episode's posts.
 *
 * Rebuilding an episode REPLACES its posts rather than appending them. Without
 * that, pressing the button twice doubles a night's feed and the duplicates are
 * invisible — every post is legitimately different text from a different
 * persona, so nothing looks wrong until the counts are read.
 *
 * Returns how many posts the season now holds for that episode.
 */
export function addEpisodePosts(gs, episode, posts) {
  const store = storeOf(gs);
  const ep = Number(episode);
  store.posts = store.posts.filter(p => Number(p.episode) !== ep);
  store.posts.push(...(posts || []));
  store.posts.sort((a, b) => (a.episode - b.episode) || (a.at - b.at) || a.id.localeCompare(b.id));
  if (!store.builtEpisodes.includes(ep)) store.builtEpisodes.push(ep);
  store.builtEpisodes.sort((a, b) => a - b);
  return store.posts.filter(p => Number(p.episode) === ep).length;
}

/** Every post for one episode, in the order it arrived. */
export function postsForEpisode(gs, episode) {
  const ep = Number(episode);
  return storeOf(gs).posts.filter(p => Number(p.episode) === ep);
}

/** Every post mentioning a player, newest episode last. For a career page. */
export function postsAbout(gs, slug) {
  if (!slug) return [];
  const want = String(slug).trim().toLowerCase();
  return storeOf(gs).posts.filter(p => p.subject === want);
}

/** Has this episode's feed already been written? */
export function hasEpisode(gs, episode) {
  return storeOf(gs).builtEpisodes.includes(Number(episode));
}

/**
 * Engagement that arrived after the fact.
 *
 * The reason posts are stored rather than regenerated: a post can be ratioed
 * hours later. Deltas are added, never assigned, so two nudges do not overwrite
 * one another, and neither counter can be driven negative.
 */
export function bumpEngagement(gs, postId, { likes = 0, tomatoes = 0 } = {}) {
  const post = storeOf(gs).posts.find(p => p.id === postId);
  if (!post) return null;
  post.likes = Math.max(0, (post.likes || 0) + likes);
  post.tomatoes = Math.max(0, (post.tomatoes || 0) + tomatoes);
  return post;
}

/**
 * The season's feed, shaped for publishing.
 *
 * Deliberately NOT the whole store: `builtEpisodes` is bookkeeping for the
 * simulator and means nothing to a reader. Text is trimmed of nothing and posts
 * keep their ids, so a published feed can be diffed against the one in memory.
 */
export function toPublishPayload(gs, { season, format } = {}) {
  const store = storeOf(gs);
  return {
    version: store.version || SOCIAL_VERSION,
    season: season ?? store.posts[0]?.season ?? null,
    format: format ?? store.posts[0]?.format ?? null,
    posts: store.posts.map(p => ({ ...p })),
  };
}

/** Throw the season's feed away — a new season starts silent. */
export function clearStore(gs) {
  if (gs) gs.social = emptyStore();
  return emptyStore();
}
