// ══════════════════════════════════════════════════════════════════════
// ci/photos.js — the season's photos: slots, fallbacks, prompts, packs
// ══════════════════════════════════════════════════════════════════════
//
// Plan 4b (spec §19.3, mockup v3 approved 2026-09-30). The author's own
// images for everything a screen can show:
//
//   SLOTS ARE PER PERSON, NEVER PER EPISODE. A slot list by episode ("Damien's
//   goodbye video", "Kayla's prize photo") would tell the author who is
//   blocked and who wins before they watch. Every persona and every player
//   has the same slots; a screen shows the one it needs.
//
//   EVERY EMPTY SLOT FALLS BACK, so a season never waits on art: an earned
//   photo falls back to the profile photo; a player's profile and "real me"
//   to their portrait; a persona with nothing shows its initial (face null).
//   A posted photo (naughty, throwback…) has no fallback: the game shows the
//   post without an image rather than reusing a face that is not that post.
//
// Where they live: a persona's profile photo is `persona.face`, the rest
// `persona.photos[kind]` (both in seasonConfig.ciPool); a player's are
// `seasonConfig.ciPhotos[name][kind]`. Every value is `photo:<id>` from
// ci/photo-store.js, or `portrait:<name>` for a fallback to the portrait.
import { promptFor, jobOf, PHOTO } from './persona-data.js';

export const KINDS = ['profile', 'earned', 'means', 'naughty', 'nice', 'throwback', 'childhood', 'real'];
export const KIND_LABEL = { profile: 'Profile photo', earned: 'Earned photo', means: 'Means something', naughty: 'Naughty',
  nice: 'Nice', throwback: 'Throwback', childhood: 'Childhood', real: 'Real me' };
// When each one is on screen — the Photos panel says it under the slot.
export const KIND_WHEN = {
  profile: 'The first thing the room sees, on every chat and every rating.',
  earned: 'A second profile photo, if they win a photo prize in a game. Empty: the profile photo again.',
  means: 'This Is Me: a photo that means something, and the story behind it.',
  naughty: 'Two Faced and Naughty and Nice: the naughty one.',
  nice: 'Two Faced and Naughty and Nice: the nice one.',
  throwback: 'Throwback Thirsty: their steamiest old photo.',
  childhood: 'The childhood-photo game: guess who is in the picture.',
  real: 'Who they really are: the goodbye video and the finale meet. Empty: their portrait.',
};

/** The slots a person has. A player behind a persona (once dealt) keeps only
 *  who they really are: the room never sees their own profile photos. */
export function slotsFor(who, dealt = null) {
  if (who.persona) return KINDS.filter(k => k !== 'real');
  return dealt?.[who.player]?.mode === 'catfish' ? ['real'] : [...KINDS];
}

/** What a screen shows for a slot: `{ face, own }` — own is false when it
 *  fell back. face null: nothing to show (the screens draw the initial). */
export function photoFor(who, kind, cfg = {}) {
  if (who.persona) {
    const p = who.persona;
    const own = kind === 'profile' ? p.face : p.photos?.[kind];
    if (own) return { face: own, own: true };
    return { face: kind === 'earned' ? p.face || null : null, own: false };
  }
  const mine = cfg.ciPhotos?.[who.player] || {};
  if (mine[kind]) return { face: mine[kind], own: true };
  const portrait = `portrait:${who.player}`;
  if (kind === 'earned') return { face: mine.profile || portrait, own: false };
  if (kind === 'profile' || kind === 'real') return { face: portrait, own: false };
  return { face: null, own: false };
}

// ── Prompts ────────────────────────────────────────────────────────────
// What each photo is, in words an image model takes. A persona's are built
// from its picks, so every photo of it is the same person.
const KIND_WORDS = {
  profile: null,   // the persona's own picks say it
  earned: 'the same face as their profile photo, a different angle and a different place, laughing, phone selfie',
  means: 'a photo that means a lot to them, with someone they love, a real moment, not posed',
  naughty: 'a cheeky, playful photo, a knowing look over sunglasses, a little flirty',
  nice: 'a sweet photo, hugging family at a birthday dinner, warm light',
  throwback: 'an old photo from a few years ago, at a party, slightly blurry, flash on',
  childhood: 'as a young child, around six years old, an old family snapshot, faded colors',
  real: 'looking straight at the camera, plain background, soft light, no filter',
};
const hairWords = persona => PHOTO.hair.find(h => h.id === persona.photo?.hair)?.words;

export function promptForSlot(who, kind) {
  if (who.persona) {
    const p = who.persona;
    if (kind === 'profile') return promptFor(p);
    const job = jobOf(p)?.name?.toLowerCase() || p.job;
    return [`${p.handle}, ${p.age}`, job, hairWords(p), KIND_WORDS[kind]].filter(Boolean).join(', ');
  }
  const head = `${who.player}${who.age ? `, ${who.age}` : ''}`;
  const words = kind === 'profile' ? 'a friendly phone selfie at home, natural light' : KIND_WORDS[kind];
  return `${head}, the same person as their portrait, ${words}`;
}

// ── A batch drop ───────────────────────────────────────────────────────
// `sienna-naughty.png`, `Beth_Childhood.JPG`, `07-david-profile.png`: the
// name, then the slot. Any separator, any case; a leading number is ignored.
const ALIASES = {
  profile: ['profile', 'main', 'pfp', 'first'],
  earned: ['earned', 'second', 'prize', 'new'],
  means: ['means', 'meaning', 'means-something', 'this-is-me', 'story'],
  naughty: ['naughty'],
  nice: ['nice'],
  throwback: ['throwback', 'throwback-thirsty', 'old'],
  childhood: ['childhood', 'child', 'baby', 'kid'],
  real: ['real', 'me', 'real-me', 'goodbye', 'finale', 'irl'],
};
const KIND_OF = Object.fromEntries(Object.entries(ALIASES).flatMap(([k, words]) => words.map(w => [w, k])));
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Where a dropped file goes: `{ persona: id, kind }`, `{ player, kind }`, or
 *  null (the tray). A player is matched first; a persona has no "real me". */
export function parseDrop(filename, { personas = [], players = [] } = {}) {
  const tokens = slug(String(filename).replace(/\.[a-z0-9]+$/i, '')).split('-').filter(Boolean);
  while (tokens.length && /^\d+$/.test(tokens[0])) tokens.shift();
  for (let n = Math.min(3, tokens.length - 1); n >= 1; n--) {
    const kind = KIND_OF[tokens.slice(-n).join('-')];
    if (!kind) continue;
    const name = tokens.slice(0, -n).join('-');
    const player = players.find(p => slug(p) === name);
    if (player) return { player, kind };
    const persona = personas.find(p => slug(p.handle) === name);
    if (persona && kind !== 'real') return { persona: persona.id, kind };
  }
  return null;
}

// ── A season pack ──────────────────────────────────────────────────────
// Everything another person needs to see the same faces: the pool (with its
// photos), the players' photos, and the images themselves as data URLs.
const idsIn = cfg => {
  const faces = [];
  for (const p of cfg.ciPool || []) faces.push(p.face, ...Object.values(p.photos || {}));
  for (const set of Object.values(cfg.ciPhotos || {})) faces.push(...Object.values(set || {}));
  return [...new Set(faces.filter(f => String(f || '').startsWith('photo:')).map(f => f.slice(6)))];
};

export async function packPhotos(cfg, getImage) {
  const images = {};
  for (const id of idsIn(cfg)) { const url = await getImage(id); if (url) images[id] = url; }
  return { format: 'the-circle-photos', version: 1, ciPool: Array.isArray(cfg.ciPool) ? cfg.ciPool : null,
    ciPhotos: cfg.ciPhotos || {}, images };
}

export async function unpackPhotos(pack) {
  if (!pack || pack.format !== 'the-circle-photos') throw new Error('That file is not a Circle photo pack.');
  return { ciPool: Array.isArray(pack.ciPool) ? pack.ciPool : null, ciPhotos: pack.ciPhotos || {}, images: pack.images || {} };
}
