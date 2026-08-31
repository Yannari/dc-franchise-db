// The other several hundred people watching.
//
// THE PROBLEM THIS FIXES. personas.js holds twenty fans, and a busy night draws
// a hundred and thirty posts — so every account was posting six or seven times
// an episode. That does not read as a public timeline; it reads as a group chat
// with twenty members, and it is the first thing anybody notices.
//
// Real fandom feeds have two tiers, and only two:
//
//   RECURRING   a handful of accounts everybody recognises. Persistent handles,
//               history, opinions you learn, and a FOLLOWING — which is why
//               their posts sit at the top of a feed rather than being lost.
//   LONG TAIL   hundreds of people who post once about the thing that annoyed
//               them and are never seen again. Small reach, no history, and the
//               overwhelming majority of the volume.
//
// So this module does not write posts. The sampler already does that, in a
// persona's voice. This takes the finished posts and decides WHO SAID THEM —
// keeping the loudest for the recurring cast and handing the rest to accounts
// invented for that night alone. A one-off inherits the voice of the persona
// whose words it is speaking, so the quirks stay consistent with the writing.
//
// FOLLOWERS ARE THE POINT, not decoration. They rank the feed, they are the
// difference between a recognisable fan and a stranger, and they are the
// currency the character pages will need later: a player can be a five-star
// celebrity and still have somebody to catch up to.
//
// Pure and seeded: the same night produces the same crowd, so a reader who
// scrolls away and comes back finds the same people.

import { showWords, DEFAULT_FORMAT } from '../shows.js';

/**
 * The pieces a handle is built from.
 *
 * Deliberately fandom-shaped rather than name-shaped: real accounts are jokes,
 * references and complaints, not first names. Roughly 40 x 26 x 12 combinations
 * before numeric suffixes, which is more than a season ever needs and means a
 * repeat inside one episode is vanishingly rare.
 */
const HEAD = [
  'the', 'just', 'only', 'still', 'not', 'literally', 'actually', 'certified',
  'professional', 'reformed', 'retired', 'former', 'chronic', 'casual', 'daily',
  'nightly', 'weekly', 'perpetually', 'mildly', 'deeply', 'quietly', 'loudly',
  'unwell', 'normal', 'average', 'humble', 'local', 'online', 'offline', 'anti',
  'pro', 'ex', 'big', 'small', 'real', 'fake', 'soft', 'hard', 'late', 'early',
];

/* ── THE MIDDLE OF A HANDLE IS THE ONE PART THAT NAMES A SHOW ──────────
   This list was fixed, and it was two shows' jargon in one array. So a
   Traitors night signed 470 of its 1,426 posts `@campfireapologist`,
   `@bigjury`, `@antitribal32` -- 33% -- and of 698 distinct handles, not one
   contained a word from the show being watched. The generic half stays
   shared, because "rewatch" and "liveblog" are true of any of them; the show's
   own nouns come off the registry, so a fourth show's fans sound like its
   fans the day it declares them. */
const BODY_GENERAL = [
  'confessional', 'edit', 'preseason', 'rewatch', 'liveblog', 'recap',
  'bracket', 'boot', 'alliance', 'showmance', 'blindside', 'finale', 'reunion',
];

/** The handle vocabulary for one show: the shared half plus its own nouns. */
function bodyFor(format) {
  const own = showWords(format).fanWords;
  return Array.isArray(own) && own.length ? [...BODY_GENERAL, ...own] : BODY_GENERAL;
}

const TAIL = [
  'truther', 'apologist', 'defender', 'hater', 'enjoyer', 'watcher', 'poster',
  'analyst', 'stan', 'skeptic', 'anon', 'hours',
];

const DISPLAY_HEAD = [
  'sam', 'ash', 'noor', 'dee', 'ren', 'kit', 'max', 'juno', 'wren', 'theo',
  'mira', 'bex', 'cass', 'nico', 'iris', 'lex', 'joss', 'rue', 'sol', 'vee',
  'tam', 'quinn', 'poe', 'ines', 'omar', 'yaz', 'zuri', 'hal', 'ivo', 'mo',
];

const DISPLAY_TAIL = [
  '', '', '', '', 'watches tv', 'is unwell', 'is right', 'was wrong',
  'has thoughts', 'is tired', 'is normal about this', 'wants everyone to know',
  'is not over it', 'is here for the drama', 'is taking notes',
];

/** A stable number from a string, so the same handle always has the same reach. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * How many people follow a recurring fan.
 *
 * Derived rather than authored: `since` is the season they started watching, so
 * somebody who has been posting for ten seasons has had ten seasons to build an
 * audience. Volatility helps too — the loudest accounts grow fastest, which is
 * true and is also why the feed's biggest voices are rarely its fairest ones.
 *
 * The scale is deliberately wide. A tail of 8k against a peak near 400k is what
 * makes "big account" mean something when both are on screen together.
 */
export function followersOfPersona(persona, { currentSeason = 14 } = {}) {
  if (!persona) return 0;
  const seasons = Math.max(1, currentSeason - (Number(persona.since) || currentSeason) + 1);
  const tenure = Math.min(1, seasons / 12);
  const loud = Number(persona.volatility) || 0.5;
  const luck = hash(persona.handle || persona.name || 'x');

  // Log-ish spread: most recurring fans are mid-sized, a couple are enormous.
  const base = 8_000 + tenure * 90_000 + loud * 60_000;
  const spike = luck > 0.82 ? 3.4 : luck > 0.6 ? 1.6 : 1;
  return Math.round((base * spike) / 100) * 100;
}

/** How many follow somebody who posts once. Small, and occasionally not. */
function followersOfOneOff(handle) {
  const luck = hash(handle);
  // A long tail is mostly tiny accounts with the odd mid-sized one — the person
  // whose one good post got shared. A flat range would make every stranger feel
  // identical.
  if (luck > 0.97) return Math.round((4_000 + luck * 9_000) / 100) * 100;
  if (luck > 0.8) return Math.round(400 + luck * 1_600);
  return Math.round(12 + luck * 380);
}

/**
 * An account invented for one night.
 *
 * `archetype` is inherited from whichever persona's words it is speaking, so a
 * stan's post is not suddenly attributed to somebody who reads as an analyst.
 */
export function oneOffAccount(rng, archetype = 'lurker', format = DEFAULT_FORMAT) {
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const BODY = bodyFor(format);
  const shape = rng();
  let handle;
  if (shape < 0.45) handle = `@${pick(HEAD)}${pick(BODY)}`;
  else if (shape < 0.8) handle = `@${pick(BODY)}${pick(TAIL)}`;
  else handle = `@${pick(HEAD)}${pick(BODY)}${Math.floor(rng() * 90) + 10}`;

  const tail = pick(DISPLAY_TAIL);
  const name = tail ? `${pick(DISPLAY_HEAD)} ${tail}` : pick(DISPLAY_HEAD);

  return {
    handle, name, archetype,
    followers: followersOfOneOff(handle),
    recurring: false,
  };
}

/**
 * How much a post's reach multiplies its engagement.
 *
 * Not linear. A hundred times the followers is not a hundred times the likes —
 * the feed would become one account and a lot of silence. Compressed hard, so a
 * big account is clearly bigger without erasing everyone else, and so the thing
 * that actually drives engagement stays what the crowd thinks of the PLAYER.
 */
export function reachFactor(followers) {
  return 0.55 + Math.min(1.6, Math.log10(1 + Math.max(0, followers)) / 3.2);
}

/**
 * Hand a night's posts to the people who said them.
 *
 * WHICH WAY THE CAUSALITY RUNS. The first version of this gave the recurring
 * cast whichever posts had drawn the most reaction, which sounds right and is
 * backwards: a post is loud BECAUSE somebody with reach made it, not the other
 * way round. It also made the assignment depend on `gs.popularity`, so the same
 * night with a hated subject and a loved one handed its big accounts to
 * different posts — and the feature's whole promise, that hating a player
 * produces more tomatoes than loving them, flipped by a few percent. A test
 * caught it.
 *
 * So the author is chosen FIRST, from the seed alone and independent of how the
 * crowd feels, and reach then multiplies whatever the post drew. Popularity
 * still decides the ratio; reach only decides how many people were there to
 * take a side.
 *
 * Replies skew hard toward strangers: hundreds of people answer a big account,
 * and almost nobody answers a stranger.
 *
 * Only the public timeline has a crowd. ChatAlumni is a hosted room with a
 * guest list, and handing its microphone to a passer-by would break the one
 * rule that room has.
 */
export function assignCrowd(posts, {
  rng, personas = [], currentSeason = 14, recurringShare = 0.3,
} = {}) {
  if (!posts?.length || typeof rng !== 'function') return posts || [];

  const reach = new Map(personas.map(p =>
    [p.handle, followersOfPersona(p, { currentSeason })]));

  for (const post of posts) {
    if (post.stream !== 'timeline') {
      post.followers = reach.get(post.handle) || 0;
      post.recurring = true;
      continue;
    }

    // Decided by the seed, never by the engagement — see the note above.
    const share = post.replyTo ? recurringShare * 0.35 : recurringShare;
    const staysRecurring = rng() < share;

    if (staysRecurring) {
      post.followers = reach.get(post.handle) || 0;
      post.recurring = true;
    } else {
      const persona = personas.find(p => p.handle === post.handle);
      // The show this post is about decides which nouns its author is made
      // of. A post carries its own format; the season's is the fallback.
      const account = oneOffAccount(rng, persona?.archetype || 'lurker',
        post.format || DEFAULT_FORMAT);
      post.handle = account.handle;
      post.name = account.name;
      post.followers = account.followers;
      post.recurring = false;
    }

    // Reach scales what a post drew, on top of how the crowd feels about its
    // subject. The subject still dominates — see reachFactor.
    const f = reachFactor(post.followers);
    post.likes = Math.round(post.likes * f);
    post.tomatoes = Math.round(post.tomatoes * f);
  }

  return posts;
}

/** "12.4k" — a follower count the way an account displays one. */
export function formatFollowers(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}k`;
  if (v >= 1_000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}
