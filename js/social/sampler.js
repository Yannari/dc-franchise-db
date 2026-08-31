// js/social/sampler.js
// The library, out loud.
//
// personas.js says who is watching, topics.js says what they talk about and
// platforms.js says how the two rooms differ. None of that is legible until
// somebody reads fifty posts, so this file turns an event into posts you can
// actually judge.
//
// TWO RULES SHAPE EVERYTHING BELOW.
//
// 1. The two rooms are not one feed with two labels. The TIMELINE is a stadium:
//    lowercase, fragments, no full stops, people shouting past each other. The
//    GROUP CHAT is a hosted room where the hosts PLAYED this game: full
//    sentences, insider vocabulary, warmer on the surface and usually shadier
//    underneath. That difference lives in the phrasings, not in a length knob —
//    a long timeline post would still sound like a timeline post.
//
// 2. Engagement is derived, never rolled. `gs.popularity` has been written every
//    episode since the simulator shipped and shown to nobody. Likes and tomatoes
//    come from how the crowd feels about the person a post is aimed at, so
//    defending somebody the audience has turned on gets you ratioed and dunking
//    on a villain collects likes. That is the entire reason this feature exists.
//
// PLAYERS ARE REFERENCED BY SLUG (`anne-maria`) and rendered capitalised for
// display. Never read voice-profiles.json here — it keys on display name, this
// module works in slugs, and joining them is project 2's problem.
//
// ADDING A FAN, A TOPIC OR A PHRASING NEVER TOUCHES THIS FILE. The words live in
// phrasings.js, the fans in personas.js, the taxonomy in topics.js, the rooms in
// platforms.js. This file is the composer and nothing else.
// tests/social-hostility.test.js walks phrasings.js, so a contribution that
// crosses the line fails immediately.
//
// READING THE OUTPUT: node js/social/read-sample.mjs
// Prints a slice of both rooms for a sample event. Optional arguments:
//   node js/social/read-sample.mjs [count] [seed]
// e.g. "node js/social/read-sample.mjs 30 12". No build step, no test runner —
// the premise of this library is that a person can sit and read the output.

import { rotate, frontIndex } from './freshness.js';
import { PERSONAS, feelingsToward } from './personas.js';
import { topicsFor } from './topics.js';
import { platformOf } from './platforms.js';
import {
  PHRASINGS, DECORATIONS, SHAPE_STANCE, TOPIC_AIM, ARCHETYPE_PULL,
} from './phrasings.js';


/**
 * A blindside is also an eviction, and any of it is also an episode that aired.
 * Without this, a blindside could only ever produce blindside topics, and a
 * feed that discusses exactly one thing is not a feed.
 */
const IMPLIED_KINDS = {
  blindside: ['eviction'],
  finale: ['eviction'],
  'ganging-up': ['argument'],
  'showmance-broken': ['argument'],
  betrayal: ['eviction'],
};

/** Roughly how long this fan's posts run, per room. */
const LENGTH_TARGET = {
  timeline: { short: 70, medium: 120, long: 190 },
  chat: { short: 150, medium: 250, long: 380 },
};

// ─── helpers ───────────────────────────────────────────────────────────────

const _pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];
const _pos = n => Math.max(0, Math.min(1, n));

/** `anne-maria` -> `Anne Maria`. Slugs in, display names out. */
export function displayName(slug) {
  return String(slug || '').split('-').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * The name a post uses for the event's subject.
 *
 * THE READER `subjects[]` EXISTS FOR. A season with co-winners has no single
 * subject, and `js/social/archive.js` deliberately refuses to invent one --
 * `won[0]` is the alphabetically first name, which is not a fact about
 * anything -- so it leaves `subject` unset and carries the whole set on
 * `subjects`. Shipping that field with nothing reading it cost the live
 * Total Drama season 8 every finale post that named a champion: 54 of 54 had
 * a subject before, 0 of 54 after, and 25 posts that named Alejandro named
 * nobody. This is the writer that can say "and".
 */
export function subjectLabel(event) {
  if (event?.subject) return displayName(event.subject);
  const many = (event?.subjects || []).filter(Boolean).map(displayName);
  if (!many.length) return '';
  if (many.length === 1) return many[0];
  return `${many.slice(0, -1).join(', ')} and ${many[many.length - 1]}`;
}

/** The event kinds a topic may match for this event. */
function kindsFor(event) {
  const set = new Set([event.kind, ...(IMPLIED_KINDS[event.kind] || []), 'episode-aired']);
  return [...set].filter(Boolean);
}

/** The only slot names a phrasing may use. Anything else is an authoring typo. */
// `receipt` is the one fact that makes this event THIS event rather than one
// of its kind — the deal they shook on, the vote that saved them, the week one
// of them already did exactly this. Supplied by js/social/receipts.js, and
// absent on events that have no history behind them, which is why `poolFor`
// filters templates by the slots an event can actually fill.
export const SLOT_NAMES = ['subject', 'actor', 'season', 'episode', 'receipt'];

/**
 * Fill {subject} {actor} {season} {episode}.
 *
 * THROWS on a slot name it does not recognise, and that is the whole point.
 * Quietly substituting '' for `{subjcet}` closes the seam invisibly: the
 * sentence stays grammatical ("not one person is defending right now"), the
 * "no leaked slot" test still passes, and a typo in a thousand-line phrasing
 * library ships as a subtly truncated post nobody can trace. A typo must fail
 * at the first sample, loudly.
 */
function fillSlots(template, event) {
  const slots = {
    subject: subjectLabel(event),
    actor: displayName(event.actor),
    season: String(event.season ?? ''),
    episode: String(event.episode ?? ''),
    // Set by js/social/receipts.js, already trimmed of its full stop so it
    // drops into the middle of a sentence somebody typed on a phone.
    receipt: String(event.receipt || event.headline?.text || '').replace(/\.$/, ''),
  };
  return template
    .replace(/\{(\w+)\}/g, (_, key) => {
      if (!Object.prototype.hasOwnProperty.call(slots, key)) {
        throw new Error(
          `sampler: unknown slot {${key}} in phrasing "${template}" — valid slots are ${SLOT_NAMES.join(', ')}`);
      }
      if (!slots[key]) {
        throw new Error(
          `sampler: slot {${key}} has no value on this event, and phrasing "${template}" needs one`);
      }
      return slots[key];
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Uppercase a run of words. Frequency scales with `rate`; never a threshold. */
function shout(text, rate, rng) {
  if (rate <= 0 || rng() >= rate) return text;
  const words = text.split(' ');
  if (words.length < 4) return text.toUpperCase();
  const runLen = 1 + Math.floor(rng() * 3);
  const start = Math.floor(rng() * (words.length - runLen));
  for (let i = start; i < start + runLen; i++) words[i] = words[i].toUpperCase();
  return words.join(' ');
}

function punctuate(text, style, rng) {
  let t = text.trim();
  if (style === 'none') return t.replace(/\.+$/, '');
  if (style === 'heavy') return t.replace(/[.!?]+$/, '') + _pick(rng, ['!!', '!!!', '?!', '...', '!?']);
  return /[.!?…]$/.test(t) ? t : t + '.';
}

function fit(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim();
}

/**
 * How the room as a whole feels about this player. Feelings, not a roll.
 *
 * THIS IS A STAND-IN, and a documented one. It averages the persona cast's
 * affection, because this module is pure and cannot reach `gs.popularity`. The
 * cast holds feelings about a handful of slugs, so for everybody else the crowd
 * reads 0 — tomatoes flatten to zero and likes go flat. `tests/social-sampler`
 * pins that with a `bridgette` fixture precisely so the limitation cannot hide.
 *
 * Callers with real audience data pass their own `crowd` function instead; the
 * feed builder does exactly that. When it does, the bridgette test is EXPECTED
 * to fail — that is the signal that real popularity arrived, not a regression.
 */
function defaultCrowd(slug) {
  if (!slug) return 0;
  const vals = PERSONAS
    .map(p => (p.feelings || {})[slug])
    .filter(Boolean)
    .map(f => Number(f.affection) || 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

/** The slug a topic is aimed at, or null when it is aimed at production. */
function targetOf(topic, event) {
  const aim = TOPIC_AIM[topic.id] || { target: 'subject' };
  if (aim.target === 'none') return null;
  if (aim.target === 'actor') return event.actor || event.subject || null;
  return event.subject || event.actor || null;
}

/**
 * How likely this fan is to reach for this topic.
 *
 * Weight starts at the topic's own, then bends around how the persona feels
 * about the person the topic is aimed at: affection pushes you toward
 * supportive topics and away from hostile ones. The two-axis topics need the
 * axes to actually disagree — that is the only reason they exist.
 */
function topicWeight(persona, topic, event, platform) {
  const slug = targetOf(topic, event);
  const f = slug ? feelingsToward(persona, slug) : { affection: 0, gameRespect: 0 };
  const aim = TOPIC_AIM[topic.id] || { stance: 0 };
  let w = topic.weight;

  w *= Math.max(0.05, 1 + aim.stance * f.affection * 1.5);
  w *= (ARCHETYPE_PULL[persona.archetype] || {})[topic.id] ?? 1;

  if (topic.id === 'love-them-hate-their-game') {
    w *= 0.4 + 4 * _pos(f.affection) * _pos(-f.gameRespect);
  }
  if (topic.id === 'hate-them-rate-their-game') {
    w *= 0.4 + 4 * _pos(-f.affection) * _pos(f.gameRespect);
  }
  // The hostility dial throttles aggression on the way into the hosted room.
  if (aim.stance < 0) w *= 0.35 + 0.65 * platform.hostility;

  return Math.max(0.02, w);
}

function weightedPick(rng, items, weightOf) {
  const ws = items.map(weightOf);
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

/**
 * Templates this topic/shape has for this room.
 *
 * Anything naming a slot this event cannot fill is dropped here rather than
 * blanked later — an event with no `actor` simply does not reach the phrasings
 * that need one. `fillSlots` then throws on anything that slips through, which
 * can now only be a typo.
 */
function poolFor(topicId, shape, stream, event) {
  const byShape = PHRASINGS[topicId] || {};
  const byStream = byShape[shape] || {};
  const pool = byStream[stream] || byStream.timeline || [];
  // `subject` is asked of `subjectLabel`, not of the field, so a co-winner
  // finale keeps the phrasings that name somebody instead of losing them all.
  const has = k => (k === 'subject' ? !!subjectLabel(event) : !(event[k] == null || event[k] === ''));
  const missing = SLOT_NAMES.filter(k => !has(k));
  if (!missing.length) return pool;
  return pool.filter(t => !missing.some(k => t.includes(`{${k}}`)));
}

/** Every shape this topic can actually speak in this room. */
function shapesFor(topic, stream, event) {
  return (topic.shapes || []).filter(s => poolFor(topic.id, s, stream, event).length > 0);
}

// ─── the composer ──────────────────────────────────────────────────────────

/**
 * One post.
 *
 * @param {object}   o.persona   from PERSONAS
 * @param {object}   o.topic     from TOPICS
 * @param {object}   o.platform  from PLATFORMS
 * @param {object}   o.event     { kind, subject, actor, season, episode, format }
 * @param {function} o.rng       injected so a failure is reproducible
 * @returns {{handle:string,name:string,stream:string,topic:string,text:string,likes:number,tomatoes:number}}
 */
export function composePost({ persona, topic, platform, event, rng = Math.random,
  crowd = defaultCrowd, used = null }) {
  const stream = platform.id;
  const shapes = shapesFor(topic, stream, event);
  // THROWS rather than falling back, for the same reason fillSlots does. The old
  // fallback reached for the topic's first declared shape whether or not it had
  // words in this room, and a shape with no pool renders an EMPTY post: a handle,
  // a like count and no text, shipped silently. A topic that cannot speak here is
  // an authoring gap and has to say so at the first sample.
  if (!shapes.length) {
    throw new Error(
      `sampler: topic "${topic.id}" has no shape with a ${stream} phrasing pool for this event `
      + `(declared shapes: ${(topic.shapes || []).join(', ') || 'none'}) — add phrasings in phrasings.js`);
  }
  // The SHAPE is deliberately not rotated. It was, on the theory that rotating
  // the sentence structure would spread the season's constructions — and
  // measured, it cost both numbers: 88% distinct fell to 87% and 78% distinct
  // shapes to 76%. Biasing which shape gets used narrows how many pools the
  // episode reaches at all, and there are only two or three shapes per topic,
  // so there is nothing to sweep through. Uniform reaches more.
  const ep = event?.episode || 0;
  const shape = _pick(rng, shapes);
  const all = poolFor(topic.id, shape, stream, event);

  // ── not the same sentence nine times ──
  //
  // A crowd is sampled by drawing a persona and a topic per post and composing
  // each one independently, so nothing stopped nine people reaching into the
  // same pool and pulling the same line. With a five-template pool that is not
  // a risk, it is the expected outcome — and it reads as one account posting
  // repeatedly rather than a room reacting. Templates already spent on THIS
  // event are set aside until the pool runs dry.
  //
  // ── and not the same sentence next week ──
  //
  // That memory is per-EVENT, so every episode walked into the pool at the same
  // end. The pool is rotated by episode number instead — see freshness.js. A
  // busy crowd takes far more than three lines from one pool in a night, so the
  // sweep steps six at a time or consecutive episodes overlap; the salt keeps
  // each pool moving independently rather than the whole library in formation.
  const order = rotate(all, ep, `${topic.id}:${shape}:${stream}`, 6);
  const fresh = used ? order.filter(t => !used.has(t)) : order;
  const pool = fresh.length ? fresh : order;

  // Length is a preference, not a filter: draw twice and usually keep whichever
  // sits closer to how long this fan writes. Proportional, and it keeps the
  // whole pool reachable.
  const target = (LENGTH_TARGET[stream] || LENGTH_TARGET.timeline)[persona.voice.length] || 120;
  let template = pool.length ? pool[frontIndex(rng, pool.length)] : '';
  if (pool.length > 1) {
    const other = pool[frontIndex(rng, pool.length)];
    if (rng() < 0.7 && Math.abs(other.length - target) < Math.abs(template.length - target)) {
      template = other;
    }
  }
  if (used && template) used.add(template);

  let text = fillSlots(template, event);

  // Tics. The chat shouts less and decorates less — it is a room, not a stand.
  const roomVoice = stream === 'chat' ? 0.35 : 1;
  const openers = DECORATIONS.openers[stream] || DECORATIONS.openers.timeline;
  const tails = DECORATIONS.tails[stream] || DECORATIONS.tails.timeline;
  // ── some posts are not sentences ──
  //
  // A `bare` topic is one where the whole effect is that nothing was composed:
  // gluing "hold on." to the front of GET HIM ANASTASIA turns a scream back
  // into a remark, which is exactly the register the scream exists to escape.
  // It still SHOUTS — that is the opposite of decoration — and it still gets an
  // emoji, because people do that.
  const bare = !!topic.bare;
  if (!bare && rng() < 0.3 * roomVoice + (stream === 'chat' ? 0.12 : 0)) {
    text = _pick(rng, openers) + text;
  }
  if (!bare && rng() < (stream === 'chat' ? 0.3 : 0.25)) {
    text = punctuate(text, 'normal', rng) + _pick(rng, tails);
  }

  // `shout` capitalises a RUN of one to three words, which is right for a
  // sentence somebody got worked up in the middle of and wrong for a scream:
  // it produced "i AM on the FLOOR". Nobody half-shouts four words. A bare post
  // is all of it or none of it.
  if (bare) {
    if (rng() < 0.45) text = text.toUpperCase();
  } else {
    text = shout(text, (persona.voice.caps || 0) * roomVoice, rng);
  }
  // The hosted room sands the tics off. Somebody who types "!!!" on the timeline
  // mostly does not in a chat they are hosting — proportionally, not always.
  let punct = persona.voice.punctuation || 'normal';
  if (stream === 'chat' && punct !== 'normal' && rng() > roomVoice) punct = 'normal';
  // Nobody punctuates a scream properly. Leaving it alone is the point.
  if (!bare) text = punctuate(text, punct, rng);

  const stance = (SHAPE_STANCE[shape] ?? 0);
  if (rng() < (persona.voice.emoji || 0) * roomVoice) {
    // The hosted room does not clown-emoji people it played the game with, so
    // the hostile bag is a timeline instrument only.
    const bag = stream === 'chat' ? DECORATIONS.emoji.neutral
      : stance > 0.25 ? DECORATIONS.emoji.supportive
        : stance < -0.25 ? DECORATIONS.emoji.hostile
          : DECORATIONS.emoji.neutral;
    text = `${text} ${_pick(rng, bag)}`;
  }

  text = fit(text, platform.maxLength);

  // ── engagement, derived from feelings ──
  // agreement > 0: the post agrees with how the room feels, and collects likes.
  // agreement < 0: it does not, and the tomatoes come out.
  const effStance = stance < 0 ? stance * platform.hostility : stance;
  const crowdFeeling = crowd(targetOf(topic, event));
  const agreement = Math.max(-1, Math.min(1, effStance * crowdFeeling));
  const spread = 1 + (text.length % 41) / 40;

  const likes = Math.round(90 * (1 + topic.weight) * (1 + 1.6 * _pos(agreement))
    * (1 + (persona.volatility || 0) * 0.4) * spread);
  const tomatoes = platform.ratios
    ? Math.round(240 * (1 + topic.weight) * _pos(-agreement) * spread)
    : 0;

  return {
    handle: persona.handle,
    name: persona.name,
    stream,
    topic: topic.id,
    text,
    likes,
    tomatoes,
    // Whether this post is FOR or AGAINST the person it names. Exported because
    // engagement alone cannot be read as sentiment about the subject: a ratio
    // punishes the take, not the target, so a beloved player collects tomatoes
    // from the people attacking them. Anything summarising the room's feeling
    // has to weigh each post by which side it took.
    stance,
  };
}

/**
 * A crowd reacting to one event.
 *
 * @param {object} event  { kind, subject, actor, season, episode, format }
 * @param {object} o      { count, stream, rng }
 * @returns {object[]} posts
 */
export function samplePosts(event, { count = 20, stream = 'timeline', rng = Math.random,
  crowd = defaultCrowd } = {}) {
  const platform = platformOf(stream);
  const kinds = kindsFor(event);

  const candidates = [];
  const seen = new Set();
  for (const kind of kinds) {
    for (const t of topicsFor(kind, platform.id)) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      if (shapesFor(t, platform.id, event).length) candidates.push(t);
    }
  }
  if (!candidates.length) return [];

  const voices = PERSONAS.filter(p => (p.platforms || []).includes(platform.id));
  if (!voices.length) return [];

  const posts = [];
  // Shared across the whole crowd reacting to ONE event, so the room does not
  // say the same sentence nine times in a row.
  const used = new Set();

  // WHO SPEAKS IS DRAWN BEFORE ANYBODY SPEAKS.
  //
  // These used to be interleaved: draw a persona, compose their post, draw the
  // next. But composePost consults the crowd and takes a DIFFERENT NUMBER of
  // rolls depending on how it feels about the subject, so it left the stream in
  // a different place and every persona after the first moved. The same night
  // with its subject beloved and then despised put the whole room in different
  // mouths -- which is the one thing the crowd must not decide, because a post
  // is loud since somebody with reach made it, not the other way round.
  //
  // Selection first, composition second: the cast comes from the seed alone,
  // and what they say still comes from the crowd.
  const picks = [];
  for (let i = 0; i < count; i++) {
    const persona = voices[Math.floor(rng() * voices.length) % voices.length];
    picks.push({ persona, topic: weightedPick(rng, candidates, t => topicWeight(persona, t, event, platform)) });
  }
  for (const { persona, topic } of picks) {
    posts.push(composePost({ persona, topic, platform, event, rng, crowd, used }));
  }
  return posts;
}

/** Posts as something a person can sit and read. The whole point of the file. */
export function renderSample(posts) {
  return (posts || []).map(p => {
    const meter = p.tomatoes > 0
      ? `  ♥ ${p.likes}   \u{1F345} ${p.tomatoes}`
      : `  ♥ ${p.likes}`;
    return `${p.handle} (${p.name}) · ${p.topic}\n  ${p.text}\n${meter}`;
  }).join('\n\n');
}
