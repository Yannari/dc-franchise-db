// ══════════════════════════════════════════════════════════════════════
// social/writer.js — asking a model, and not depending on the answer
// ══════════════════════════════════════════════════════════════════════
//
// Steps three and four of the hybrid: the simulator has already decided WHO
// posts, what they know, and which facts they may mention; this hands that to a
// writer and refuses whatever comes back that does not fit.
//
// Three properties it will not give up, in order:
//
//   IT NEVER BLOCKS A SEASON. The templates are not a degraded mode, they are
//   the floor. No key, no network, a timeout, a refusal, a batch that fails
//   validation — every one of those produces the same feed the simulator
//   produced yesterday. A feature that can make a season un-playable when a
//   third party is down is not a feature.
//
//   IT NEVER REWRITES HISTORY. Approved posts are stored with the episode, and
//   `ensureFeeds` already skips an episode that has one. Refreshing a season is
//   not a re-roll of what the audience said about a night somebody watched.
//
//   IT NEVER SPENDS TWICE. One request per event, not per post — a crowd is a
//   batch, and asking for fifteen reactions in fifteen calls is fifteen times
//   the money for a worse result, because the model cannot see what it already
//   said.
import { PERSONAS } from './personas.js';
import { platformOf } from './platforms.js';
import { samplePosts } from './sampler.js';
import { acceptPosts } from './validator.js';

/** Where the worker lives. Absent means templates, silently and by design. */
export function writerEndpoint(config = {}) {
  return config.socialWriterUrl
    || (typeof globalThis !== 'undefined' && globalThis.SOCIAL_WRITER_URL)
    || null;
}

/**
 * Everything a writer is allowed to know, and nothing else.
 *
 * The packet is the contract. If a fact is not in here the post cannot contain
 * it — not because the model is asked nicely, but because `validatePost`
 * rejects names and weeks that are not in this object.
 */
export function buildPacket(event, {
  cast = [], stream = 'timeline', count = 8, register = 'post', persona = null,
} = {}) {
  const platform = platformOf(stream);
  return {
    event: {
      kind: event.kind,
      subject: event.subject || null,
      actor: event.actor || null,
      season: event.season ?? null,
      episode: event.episode ?? null,
    },
    // The closed set. Ids are what a post cites; text is what it may say.
    receipts: (event.receipts || []).map(r => ({ id: r.id, text: r.text, week: r.week ?? null })),
    cast: [...cast],
    stream,
    register,
    count,
    maxLength: platform?.maxLength || 280,
    requireCite: !!(event.receipts || []).length,
    // Who is talking, so the model writes one account rather than an average.
    voice: persona ? {
      handle: persona.handle,
      archetype: persona.archetype,
      length: persona.voice?.length || 'medium',
      caps: persona.voice?.caps || 0,
      loyalties: persona.loyalties || [],
      grudges: persona.grudges || [],
    } : null,
  };
}

/**
 * Ask the worker for one crowd.
 *
 * Returns `null` — not an error — for every reason a caller cannot do anything
 * about: no endpoint, no network, a bad status, a shape that is not what was
 * asked for. The caller's job is to fall back, and it needs one branch for
 * that rather than a taxonomy of failures.
 */
export async function requestPosts(packet, { endpoint, timeoutMs = 12000, fetchImpl = null } = {}) {
  const url = endpoint;
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!url || !doFetch) return null;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
      signal: controller?.signal,
    });
    if (!res?.ok) return null;
    const data = await res.json();
    const posts = Array.isArray(data) ? data : data?.posts;
    if (!Array.isArray(posts)) return null;
    return posts
      .map(p => (typeof p === 'string' ? { text: p, cites: [] } : p))
      .filter(p => p && typeof p.text === 'string');
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * A crowd reacting to one event, written by whichever source can.
 *
 * The template sampler runs FIRST and unconditionally, because its output is
 * the floor and the shape every consumer already expects — handle, likes,
 * tomatoes, stance, topic. What the model contributes is better TEXT on those
 * posts, one for one, and only where a post survives validation. So a batch
 * that half-fails degrades post by post rather than all at once.
 */
export async function writeCrowd(event, {
  count = 8, stream = 'timeline', rng = Math.random, cast = [], crowd,
  endpoint = null, approved = [], fetchImpl = null, register = 'post',
} = {}) {
  const base = samplePosts(event, { count, stream, rng, ...(crowd ? { crowd } : {}) });
  if (!base.length || !endpoint) return { posts: base, source: 'template', rejected: [] };

  const persona = PERSONAS.find(p => p.handle === base[0].handle) || null;
  const packet = buildPacket(event, { cast, stream, count, register, persona });
  const written = await requestPosts(packet, { endpoint, fetchImpl });
  if (!written?.length) return { posts: base, source: 'template', rejected: [] };

  const { kept, rejected } = acceptPosts(written, packet, { approved });
  if (!kept.length) return { posts: base, source: 'template', rejected };

  // One for one onto the sampled crowd, so everything downstream — engagement,
  // stance, who is holding the account — is the simulator's answer and only
  // the words came from elsewhere.
  const posts = base.map((p, i) => (kept[i]
    ? { ...p, text: kept[i].text, written: true, cites: kept[i].cites || [] }
    : p));
  return {
    posts,
    source: kept.length === base.length ? 'written' : 'mixed',
    rejected,
  };
}
