// An episode's worth of feed.
//
// Events in, posts out — timestamped across the episode so project 3 can replay
// them in order and the messages genuinely keep arriving, rather than appearing
// as one block the moment you open the page.
//
// This is where the audience finally becomes visible. `gs.popularity` has been
// written every episode since the simulator existed and read by nothing a viewer
// can see; the `crowd` function passed through to the sampler is what turns it
// into likes on a defence and tomatoes on a dunk.
//
// Pure: no DOM, no network, no gs. The caller supplies popularity and an rng, so
// a season's feed is reproducible from a seed.
import { samplePosts } from './sampler.js';
import { EPISODE_MS } from './events.js';

/**
 * How loud each kind of moment is, as a multiplier on how many posts it draws.
 *
 * A blindside is the loudest thing that happens on these shows and an ordinary
 * nomination is not; a feed that reacted equally to both would read as machinery.
 */
const VOLUME = {
  blindside: 3.0,
  finale: 3.0,
  eviction: 1.8,
  'ganging-up': 1.6,
  betrayal: 1.6,
  'showmance-broken': 1.4,
  'showmance-formed': 1.3,
  domination: 1.3,
  'veto-used': 1.1,
  twist: 1.1,
  'comp-win': 1.0,
  nomination: 1.0,
  argument: 1.0,
  'romantic-spark': 0.9,
  'alliance-formed': 0.8,
  kindness: 0.8,
  'episode-aired': 1.2,
};

/** Roughly how many posts an average event draws on each stream. */
const BASE = { timeline: 7, chat: 2 };

/**
 * How the crowd feels about a player, from real audience data.
 *
 * `popularity` is the simulator's per-player score — unbounded, and on a scale
 * that drifts between seasons — so it is normalised WITHIN the episode rather
 * than against a fixed range. Being the most-liked player in a hated cast should
 * still read as popular; an absolute threshold would call the whole cast
 * unpopular and flatten every reaction in the feed.
 */
export function crowdFromPopularity(popularity) {
  const entries = Object.entries(popularity || {})
    .filter(([, v]) => Number.isFinite(Number(v)));
  if (entries.length < 2) return () => 0;      // nothing to compare against

  const vals = entries.map(([, v]) => Number(v));
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  if (hi === lo) return () => 0;               // no spread means no signal

  const map = new Map(entries.map(([k, v]) =>
    // -1..1 across the episode's own range
    [String(k).trim().toLowerCase(), ((Number(v) - lo) / (hi - lo)) * 2 - 1]));

  return slug => (slug && map.has(slug)) ? map.get(slug) : 0;
}

/** Deterministic per-episode rng, so a rebuild reproduces the same feed. */
function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * Which earlier post this one is answering, if any.
 *
 * Replies are what make a ratio legible — a pile-on is visible because forty
 * people are answering the same post, not because forty posts exist. Only
 * timeline posts reply, and only to a post about the same person, because a
 * reply to an unrelated post is noise wearing a thread's clothes.
 *
 * `replyTo` holds a post id and nothing stops it pointing at a reply, so the
 * DATA supports full threads. Project 3 renders one level to begin with.
 */
function pickParent(post, earlier, rng) {
  if (post.stream !== 'timeline') return null;
  const candidates = earlier.filter(p =>
    p.stream === 'timeline' && p.subject && p.subject === post.subject && !p.replyTo);
  if (!candidates.length) return null;
  // Loud posts attract answers; a quiet one is rarely worth replying to.
  const hottest = candidates.slice(-12).sort((a, b) =>
    (b.likes + b.tomatoes) - (a.likes + a.tomatoes));
  const pool = hottest.slice(0, 4);
  return pool.length && rng() < 0.42 ? pool[Math.floor(rng() * pool.length)].id : null;
}

/**
 * Build one episode's feed.
 *
 * `events` come from extractEvents. `popularity` is `gs.popularity` — pass it and
 * engagement becomes real; omit it and the sampler falls back to its documented
 * persona-cast stand-in, which flattens for anybody the cast has no opinion about.
 */
export function buildEpisodeFeed(events, {
  popularity = null, seed = 1, scale = 1,
} = {}) {
  if (!events || !events.length) return [];

  const rng = seeded(seed);
  const crowd = popularity ? crowdFromPopularity(popularity) : undefined;
  const { season, episode } = events[0];

  const posts = [];
  let ordinal = 0;

  for (const ev of events) {
    const volume = VOLUME[ev.kind] ?? 1;
    for (const stream of ['timeline', 'chat']) {
      const count = Math.max(1, Math.round(BASE[stream] * volume * scale));
      let made;
      try {
        made = samplePosts(ev, { count, stream, rng, ...(crowd ? { crowd } : {}) });
      } catch (err) {
        // A topic with no phrasing pool for this room is an authoring gap, not a
        // reason to lose the episode. The sampler throws so it is visible; the
        // feed logs it and keeps going, because one silent topic must not cost a
        // viewer the whole night's reactions.
        console.warn(`social feed: ${ev.kind}/${stream} produced nothing —`, err.message);
        continue;
      }

      for (const p of made) {
        // Spread posts through the minutes AROUND the moment, so a feed replays
        // as a wave rather than a spike: reactions land over a few minutes, the
        // way people actually type.
        const drift = Math.round((rng() - 0.15) * 3.5 * 60 * 1000);
        const at = Math.max(0, Math.min(EPISODE_MS, ev.at + drift));

        const post = {
          id: `p-${season}-${episode}-${String(ordinal++).padStart(4, '0')}`,
          season, episode, format: ev.format,
          stream: p.stream,
          handle: p.handle,
          name: p.name,
          topic: p.topic,
          kind: ev.kind,
          subject: ev.subject || null,
          text: p.text,
          at,
          replyTo: null,
          likes: p.likes,
          tomatoes: p.tomatoes,
        };
        post.replyTo = pickParent(post, posts, rng);
        // A reply arrives after what it answers, always.
        if (post.replyTo) {
          const parent = posts.find(x => x.id === post.replyTo);
          if (parent && post.at <= parent.at) post.at = parent.at + 1000 + Math.round(rng() * 60000);
        }
        posts.push(post);
      }
    }
  }

  return posts.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}
