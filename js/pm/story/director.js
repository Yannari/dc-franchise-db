// ══════════════════════════════════════════════════════════════════════
// pm/story/director.js — what a scene is written as, and what it follows
// ══════════════════════════════════════════════════════════════════════
//
// The engine decides what happens; the director decides how much of it the
// episode SHOWS, and what each scene is about (docs/superpowers/specs/
// 2026-10-22-pm-dialogue-rebuild-design.md §4.2). Three things, all read from
// what already happened, none of them drawing a die the engine uses:
//
//   tier      featured (a whole conversation, 15-30 turns), short (4-8), or a
//             note (one line of "meanwhile"). The user: "we need more long and
//             interesting conversation … for everyday too", and an episode of
//             ninety aired events can't all be twenty turns long.
//   after     the earlier scene this one follows from: "How was your chat with
//             Valentina?" needs a chat with Valentina the viewer saw and both
//             of them know about (the user: "everything is out of nowhere, no
//             directing line").
//   register  how each speaker sounds in this scene, from their voice tags
//             (#flirty, #blunt…): one per speaker per scene, so a line picks a
//             whole option written for that register, never a clipped copy.
import { voiceWeights } from '../../td/story/voice.js';

// ── the registers ─────────────────────────────────────────────────────
// Twenty-two voice tags, six ways of talking a conversation can be written
// in. A tag nobody listed here (an age register) weighs nothing.
export const REGISTERS = {
  soft: ['warm', 'earnest', 'emotional', 'calm'],
  sharp: ['blunt', 'tough', 'bossy', 'cruel', 'competitive', 'proud'],
  big: ['loud', 'theatrical', 'chaotic', 'goofy', 'ditzy', 'food'],
  dry: ['dry', 'nerdy', 'quiet', 'schemer'],
  flirty: ['flirty'],
  nervy: ['anxious'],
};
const REG_OF = {};
for (const [r, tags] of Object.entries(REGISTERS)) for (const t of tags) REG_OF[t] = r;

const hashOf = s => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
function dial(...parts) {
  let h = hashOf(parts.join('|'));
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** How `name` sounds in this scene: a register, weighted by their tags, landed on a hash. */
export function registerOf(state, ev, name) {
  if (!name) return null;
  let weights;
  try { weights = voiceWeights(name); } catch { return null; }
  const by = {};
  for (const [t, w] of weights || []) if (w > 0 && REG_OF[t]) by[REG_OF[t]] = (by[REG_OF[t]] || 0) + w;
  const list = Object.entries(by);
  if (!list.length) return null;
  let r = dial(state?.seed ?? '', ev?.id ?? '', name) * list.reduce((s, [, w]) => s + w, 0);
  for (const [reg, w] of list) { r -= w; if (r < 0) return reg; }
  return list[list.length - 1][0];
}

// ── what a scene follows from ─────────────────────────────────────────
// The scenes a later one can name, by what they were. Only a scene the viewer
// saw (it aired) and everyone in the new one knows about.
export const AFTER_OF = {
  pull: 'pull', loyalty: 'knocked-back', kiss: 'kiss', 'challenge-kiss': 'game-kiss', 'game-kiss': 'game-kiss',
  argument: 'row', 'jealous-confront': 'row', 'told-confront': 'row', 'stirrer-confront': 'row', blowup: 'row', 'rival-row': 'row', 'feud-confront': 'row',
  gossip: 'told', confession: 'told', entrance: 'arrival', 'group-entrance': 'arrival', 'return-entrance': 'arrival',
  date: 'date', 'recouple-pick': 'recoupling', steal: 'recoupling', hideaway: 'hideaway', ick: 'ick',
  'casa-return': 'casa', photos: 'casa', 'movie-clip': 'movie', 'bed-share': 'bed', 'head-turned': 'head-turned',
  'close-off': 'closed', 'exclusive-ask': 'closed', 'official-ask': 'official', 'love-said': 'love',
  'dump-verdict': 'dumping', 'dump-verdict-couple': 'dumping', 'dump-verdict-singles': 'dumping', 'ballot-reveal': 'vote',
};
// A scene that is about the two of them (a row, a kiss) between the pair;
// the rest name somebody else ({x}) one of them was with.
const BETWEEN = new Set(['row', 'kiss', 'closed', 'official', 'love', 'recoupling', 'hideaway', 'ick']);
// …and a challenge kiss is either: the two of them, or one of them and somebody else.
const EITHER = new Set(['game-kiss']);
// Scenes whose third player is talked about, never there.
const ABOUT_THIRD = new Set(['told-confront', 'jealous-confront', 'stirrer-confront']);

/** Does `n` know scene `e` happened? In it, or it was no secret, or they saw it or were told. */
export function knowsOf(state, n, e) {
  if (e.players.includes(n)) return true;
  const sec = (state.secrets || []).filter(s => s.eventId === e.id);
  if (!sec.length) return true;
  return sec.some(s => s.public || s.witnesses?.includes(n) || (s.known && s.partner === n));
}

/**
 * The earlier scene this one follows from, or null: the latest one today, then
 * the last episode. `fams` is what the kind's lines can talk about (a talk
 * file's `after`); a scene its lines never mention is not what it follows.
 */
export function afterOf(state, ev, fams = null) {
  const [a, b] = ev.players;
  if (!a) return null;
  const pool = [...(state.history || []).filter(e => e.ep === state.ep - 1),
    ...(state._today || []).filter(e => e.ep === state.ep)];
  const here = ev.players.filter(Boolean);
  for (let i = pool.length - 1; i >= 0; i--) {
    const e = pool[i];
    if (e === ev || !e.aired || e.tier === 'note') continue;
    const fam = AFTER_OF[e.kind];
    if (!fam || (fams && !fams.includes(fam))) continue;
    // A confrontation's third is who it was ABOUT, not in the room: a later
    // scene with them did not have that row.
    const inIt = ABOUT_THIRD.has(e.kind) ? e.players.slice(0, 2) : e.players;
    const mine = inIt.includes(a), theirs = !!b && inIt.includes(b);
    if (!mine && !theirs) continue;
    const between = !!b && mine && theirs;
    if (!EITHER.has(fam) && BETWEEN.has(fam) !== between) continue;
    // Somebody else is in it ({x}): the one of them it was with.
    const x = between ? null : e.players.find(n => !here.includes(n)) || null;
    if (!between && !x) continue;
    if (!here.every(n => knowsOf(state, n, e))) continue;
    return { id: e.id, kind: e.kind, fam, x, by: between ? 'both' : mine ? 'a' : 'b',
      when: e.ep === state.ep ? 'today' : 'yesterday' };
  }
  return null;
}

// ── how much of it is shown ───────────────────────────────────────────
// Only the villa's everyday conversations are tiered: a ceremony, a game or
// an arc is written whole, always. How much a scene is worth showing, in
// round numbers; the threshold and the episode's caps do the rest.
const WORTH = {
  argument: 3.6, gossip: 4, pull: 2.2, loyalty: 2.4, kiss: 1.2, chat: 1.3, 'deep-chat': 2.6, friendship: 1.1,
  comedy: 1.4, ick: 2.2, vent: 2.6, 'bed-share': 3.4, 'casa-miss': 2.4, 'challenge-kiss': 1.4, 'challenge-win': 1,
  'kin-heart': 1.8, 'kin-vet': 2.6, 'kin-protect': 3.2, 'ex-awkward': 2.6, 'ex-jealous': 2.8,
  advice: 2, comfort: 2.6, reassurance: 3, solidarity: 2, overthinking: 1.5, debrief: 3,
  // the storylines and the villa's reactions (pm/threads.js): what an episode is about
  'graft-eyes': 2.8, watching: 3, 'where-head': 4, 'graft-shut': 3.2, 'graft-turn': 4.2, 'feels-off': 2.8,
  'secret-burden': 3.2, 'group-chat': 3, 'bed-chat': 2.6, 'doubt-end': 4, 'pick-chat': 3, 'vote-worry': 2.8, 'stick-twist': 3.4,
};
export const FEATURED_AT = 2.5, SHORT_AT = 1.6;
// An episode's most: about twenty featured conversations and thirty short ones
// (the user picked the tiers: ~600-900 clicks an episode).
export const FEATURED_CAP = 24, SHORT_CAP = 34;
// The storylines' own scenes (pm/threads.js), whole however busy the day.
const STORY_KINDS = new Set(['graft-eyes', 'watching', 'where-head', 'graft-turn', 'graft-shut', 'feels-off', 'secret-burden', 'group-chat', 'bed-chat', 'doubt-end', 'pick-chat', 'vote-worry', 'stick-twist']);

/** featured · short · note for a tiered kind, or null for a kind always written whole. */
export function tierOf(state, ev, tiered) {
  if (!tiered) return null;
  const n = (state._tierEp === state.ep ? state._tierN : null) || { featured: 0, short: 0, pairs: {} };
  if (state._tierEp !== state.ep) { state._tierEp = state.ep; state._tierN = n; }
  const [a, b] = ev.players;
  const x = ev.extra || {};
  let w = WORTH[ev.kind] ?? 1.5;
  // A pull with a couple in it is the villa's drama; one that went further more so.
  if (ev.kind === 'pull') w += (x.kissed ? 1.4 : 0) + (x.promised ? 1 : 0) + ((x.heat === 'steamy') ? 0.6 : 0);
  if (ev.kind === 'kiss' && x.firstKiss) w += 1.8;
  if (ev.kind === 'friendship' && x.friction) w += 1.5;
  if (ev.kind === 'ick' && x.close === 'said') w += 0.8;
  if (ev.kind === 'argument' && x.close === 'walk-off') w += 0.5;
  // It follows something: the thread is what an edit cuts to.
  if (ev.after) w += 1;
  // A beat of one of the episode's stories is what the episode is about.
  if (ev.extra?.thread) w += 1.2;
  // A bombshell's first day is the episode.
  if (ev.players.some(p => (state.ledger?.firstEp?.[p] ?? -1) === state.ep && state.ep > 1)) w += 0.8;
  // Somebody in it is hiding something.
  if (ev.players.some(p => (state.secrets || []).some(s => !s.known && (s.who === p || s.partner === p)))) w += 0.5;
  // The same two again today: the second time is shorter.
  const key = [a, b].filter(Boolean).sort().join('+');
  w -= 0.9 * (n.pairs[key] || 0);
  // Unaired: the viewer only reads it (and Movie Night may play it back), so
  // it is never a whole conversation, and never less than short if it hides something.
  const secret = (state.secrets || []).some(s => s.eventId === ev.id);
  let tier = w >= FEATURED_AT && n.featured < FEATURED_CAP ? 'featured' : w >= SHORT_AT && n.short < SHORT_CAP ? 'short' : 'note';
  // The episode's stories and the villa's reactions to them are always whole
  // conversations: a couple in a story is on screen several times a day by
  // design, and the same-pair rule above shrank their bedtime talk to one line
  // (season read 2026-10-25: thirteen story scenes a season aired as notes).
  if (ev.extra?.thread || STORY_KINDS.has(ev.kind)) tier = 'featured';
  // Raw footage the public never saw is a note, read in the transcript; only
  // a scene that hides something is written out (Movie Night may play it).
  if (!ev.aired) tier = secret || ev.kind === 'pull' ? 'short' : 'note';
  if (tier === 'featured') n.featured++;
  if (tier === 'short') n.short++;
  n.pairs[key] = (n.pairs[key] || 0) + 1;
  return tier;
}
