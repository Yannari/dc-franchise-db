// ══════════════════════════════════════════════════════════════════════
// pm/profile.js — who an islander is, for one season
// ══════════════════════════════════════════════════════════════════════
//
// NO NEW STATS (spec §5.1). Everything the villa needs is read off the nine
// shared stats; a per-show player field costs nine links (ADDING-A-SHOW §8.1).
// The cast-setup fields below live on the SEASON's cast, and every one of them
// rolls when the author leaves it blank.
//
// Each islander rolls off their OWN stream (`profile:<name>`), so authoring
// one islander's intent never re-rolls anybody else.

// Where an islander is from, for how they talk (pm/lines/dialect.js). Authored
// in cast setup or left blank — blank takes the season's default, never a
// roll: a voice nobody chose is a character the author never met.
export const DIALECTS = ['uk', 'us', 'au', 'ie'];

export const INTENTS = ['love', 'settle-down', 'first-love', 'fresh-start', 'fun', 'stir',
  'fame', 'win', 'money'];
// Real islanders mostly say love; the weights are the roll, not a rule.
const INTENT_WEIGHTS = { love: 4, 'settle-down': 1.5, 'first-love': 1, 'fresh-start': 1.2,
  fun: 2, stir: 0.8, fame: 1.2, win: 0.6, money: 0.4 };
export const LOOK_TAGS = ['tall', 'short', 'muscular', 'slim', 'dad-bod', 'blonde', 'brunette',
  'dark-hair', 'redhead', 'tattoos', 'great-smile', 'pretty-boy', 'pretty-girl', 'rugged',
  'accent', 'glam', 'natural'];
export const VIBES = ['funny', 'confident', 'emotionally-mature', 'fiery', 'ambitious',
  'family-oriented', 'protective', 'bubbly', 'chill', 'competitive', 'mysterious'];
export const ICKS = ['nonchalant', 'cocky', 'loud', 'people-pleaser', 'attention-seeker',
  'chaser', 'no-manners'];
export const INTERESTS = ['fitness', 'football', 'other-sport', 'dance', 'music', 'fashion',
  'beauty', 'travel', 'languages', 'family', 'animals', 'outdoors', 'partying', 'career',
  'education', 'performing', 'social-media', 'wellness', 'food', 'gaming', 'faith', 'pop-culture'];
export const ROLES = ['starter', 'bombshell', 'casa'];

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];
const n = v => Math.max(0, Math.min(10, Number(v ?? 5))) / 10;

export function statsOf(player) {
  const s = player?.stats || {};
  return Object.fromEntries(STAT_KEYS.map(k => [k, Number.isFinite(Number(s[k])) ? Number(s[k]) : 5]));
}

/** How strongly a set of stats reads as this vibe, 0..1. */
export function vibeScore(vibe, s) {
  switch (vibe) {
    case 'funny': return (n(s.social) + n(s.boldness)) / 2;
    case 'confident': return n(s.boldness);
    case 'emotionally-mature': return (n(s.temperament) + n(s.intuition)) / 2;
    case 'fiery': return (n(s.boldness) + (1 - n(s.temperament))) / 2;
    case 'ambitious': return (n(s.strategic) + n(s.mental)) / 2;
    case 'family-oriented': return n(s.loyalty);
    case 'protective': return (n(s.physical) + n(s.loyalty)) / 2;
    case 'bubbly': return n(s.social);
    case 'chill': return (n(s.temperament) + (1 - n(s.boldness))) / 2;
    case 'competitive': return (n(s.physical) + n(s.boldness)) / 2;
    case 'mysterious': return (n(s.intuition) + (1 - n(s.social))) / 2;
    default: return 0;
  }
}

/** How strongly a set of stats reads as this ick, 0..1. */
export function ickScore(ick, s) {
  switch (ick) {
    case 'nonchalant': return ((1 - n(s.boldness)) + (1 - n(s.social))) / 2;
    case 'cocky': return (n(s.boldness) + (1 - n(s.temperament))) / 2;
    case 'loud': return (n(s.boldness) + n(s.social)) / 2;
    case 'people-pleaser': return (n(s.loyalty) + (1 - n(s.boldness))) / 2;
    case 'attention-seeker': return (n(s.boldness) + (1 - n(s.intuition))) / 2;
    case 'chaser': return (n(s.boldness) + (1 - n(s.strategic))) / 2;
    case 'no-manners': return ((1 - n(s.temperament)) + (1 - n(s.social))) / 2;
    default: return 0;
  }
}

// A NARRATION LABEL, so thresholds are allowed here (CLAUDE.md: thresholds only
// for text). Table order is the precedence — first match wins (spec §5.2).
const hi = v => v >= 7, lo = v => v <= 4;
export const PERSONAS = [
  ['fuckboy', s => hi(s.social) && hi(s.boldness) && lo(s.loyalty)],
  ['hopeless-romantic', s => hi(s.loyalty) && lo(s.strategic)],
  ['checklist', s => hi(s.loyalty) && hi(s.strategic) && lo(s.temperament)],
  ['bombshell', (s, o) => !!o.late && hi(s.social) && hi(s.boldness)],
  ['game-player', s => hi(s.strategic) && lo(s.loyalty)],
  ['messy', s => lo(s.temperament) && hi(s.boldness)],
  ['girls-girl', s => hi(s.loyalty) && hi(s.social)],
  ['villa-clown', s => hi(s.social) && hi(s.boldness) && hi(s.temperament)],
  ['wallflower', s => lo(s.social) && lo(s.boldness)],
];

export function derivePersona(stats, opts = {}) {
  const s = statsOf({ stats });
  for (const [id, test] of PERSONAS) if (test(s, opts)) return id;
  return 'steady';
}

/** The secondary tag any persona can carry: easy to fool. */
export function isMug(stats) { return statsOf({ stats }).intuition <= 3; }

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function pickSome(rng, arr, k) {
  const pool = [...arr], out = [];
  while (out.length < k && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
function pickWeighted(rng, weights) {
  const entries = Object.entries(weights);
  let r = rng() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
}
const onList = (xs, list) => (Array.isArray(xs) ? xs.filter(x => list.includes(x)) : []);

/**
 * One islander's profile for this season. The rolls are ALWAYS drawn, in a
 * fixed order, whether or not the author set the field — so authoring a field
 * never shifts the rolls behind it.
 */
export function resolveIslander(player, setup = {}, rng) {
  const stats = statsOf(player);
  const role = ROLES.includes(setup.role) ? setup.role : 'starter';
  const late = role !== 'starter';
  const rolled = {
    intent: pickWeighted(rng, late ? { ...INTENT_WEIGHTS, stir: INTENT_WEIGHTS.stir * 2 } : INTENT_WEIGHTS),
    looksWanted: pickSome(rng, LOOK_TAGS, Math.floor(rng() * 4)),
    vibes: pickSome(rng, VIBES, 1 + Math.floor(rng() * 2)),
    looks: pickSome(rng, LOOK_TAGS, 2),
    icks: pickSome(rng, ICKS, 1 + Math.floor(rng() * 2)),
    interests: pickSome(rng, INTERESTS, 2 + Math.floor(rng() * 3)),
    bonus: rng() < 0.3 ? pick(rng, INTERESTS) : null,
  };
  const authoredInterests = onList(setup.interests, INTERESTS);
  const authoredLooks = onList(setup.type?.looks, LOOK_TAGS);
  const authoredVibes = onList(setup.type?.vibes, VIBES);
  const authoredOwnLooks = onList(setup.looks, LOOK_TAGS);
  const authoredIcks = onList(setup.icks, ICKS);
  return {
    name: player.name,
    gender: player.gender || 'm',
    sexuality: player.sexuality || 'straight',
    archetype: player.archetype || 'floater',
    stats,
    role,
    arrivalEp: Number.isFinite(Number(setup.arrivalEp)) ? Number(setup.arrivalEp) : null,
    intent: INTENTS.includes(setup.intent) ? setup.intent : rolled.intent,
    type: {
      looks: authoredLooks.length ? authoredLooks.slice(0, 3) : rolled.looksWanted,
      vibes: authoredVibes.length ? authoredVibes.slice(0, 2) : rolled.vibes,
    },
    looks: authoredOwnLooks.length ? authoredOwnLooks : rolled.looks,
    icks: authoredIcks.length ? authoredIcks.slice(0, 2) : rolled.icks,
    interests: authoredInterests.length >= 2 ? authoredInterests.slice(0, 4) : rolled.interests,
    bonusInterest: INTERESTS.includes(setup.bonusInterest) ? setup.bonusInterest : rolled.bonus,
    eyesOn: Array.isArray(setup.eyesOn) && setup.eyesOn.length ? [...setup.eyesOn] : null,
    ex: typeof setup.ex === 'string' && setup.ex ? setup.ex : null,
    persona: typeof setup.persona === 'string' && setup.persona
      ? setup.persona : derivePersona(stats, { late }),
    mug: isMug(stats),
    dialect: DIALECTS.includes(setup.dialect) ? setup.dialect : null,
  };
}
