// ══════════════════════════════════════════════════════════════════════
// pm/just-friends.js — the villa's break-ups, as records (who, why, how taken)
// ══════════════════════════════════════════════════════════════════════
//
// Every way a couple ends writes one record here (pm/breakups.js
// recordSplit): who ended it (`by`), who was left (`left`), why (`cause`:
// cooling · clash · triangle · played · cheated · moved-on), how fair it was
// (`fair`, 0..1: the public's verdict), how it was taken (`mood`), and who
// still has the feelings (`holder`). The user, 2026-10-26: "stay as friends is
// often the decision of one person, it doesn't mean it was consensual and the
// person on the receiving end took it well".
//   friends   both have let it go (or one never felt much): mates now
//   hurt      the one left still feels it: they try to be friends, and it stings
//   bitter    it isn't over: cold, sniping, and it can blow up
// Until they rekindle (exes.js reunite, a recoupling with the feeling back,
// threads.js "Back on?"), the two are a couple in name at most: no couple's
// scenes, neither one TAKEN by the other (heartOf). What the one still holding
// a torch feels when the other moves on is pm/breakups.js exReact.
// A leaf: everything imports it, it imports nothing.

const key = (a, b) => [a, b].sort().join('|');

/** The break-up between a and b, while it stands; null if none (or rekindled). */
export function splitOf(state, a, b) {
  if (!a || !b) return null;
  return state.splits?.[key(a, b)] || null;
}
/** Broken up, and not back together. */
export const broken = (state, a, b) => !!splitOf(state, a, b);
/** Broken up, and both of them over it: friends. */
export const justFriends = (state, a, b) => splitOf(state, a, b)?.mood === 'friends';

export function setSplit(state, rec) {
  (state.splits ||= {})[key(rec.by, rec.left)] = rec;
  return rec;
}

/** A "better as friends" that both took well (a season restored from rows that predate the records). */
export function becomeFriends(state, ender, hurt, ep = state.ep) {
  return setSplit(state, { by: ender, left: hurt, cause: 'cooling', ep, fair: 0.55, mood: 'friends', holder: hurt, about: null });
}

export function rekindle(state, a, b) {
  const rec = state.splits?.[key(a, b)];
  if (!rec) return;
  // They remember it: a couple back together is not on its first go (user,
  // 2026-10-26: "do they act like it's their first time each time?").
  (state.backTogether ||= {})[key(a, b)] = { ep: state.ep, day: state.day ?? null, splitEp: rec.ep, cause: rec.cause };
  delete state.splits[key(a, b)];
}
/** Broke up and got back together (and are, still). */
export const backTogether = (state, a, b) => (a && b && state.backTogether?.[key(a, b)]) || null;

/** Every break-up that stands. */
export const splitRecords = state => Object.values(state.splits || {});
/** The ones still on speaking terms: friends, and the hurt who are trying. */
export const friendsRecords = state => splitRecords(state).filter(r => r.mood !== 'bitter');

/** The other one in a record. */
export const exOf = (rec, n) => (rec.by === n ? rec.left : rec.by);

/** How raw it still is: 1 the day it happened, fading by the episode. */
export const rawness = (state, rec) => 1 / (1 + 0.6 * Math.max(0, (state.ep ?? rec.ep) - rec.ep));

/**
 * Who has {n}'s heart in the villa's eyes: the partner, unless the two have
 * broken up. Read wherever being TAKEN matters (cheating, Casa, a steal);
 * partnerOf stays the couple for recouplings and dumpings.
 */
export function heartOf(state, n) {
  const c = state.couples?.find(x => x.includes(n));
  const p = c ? (c[0] === n ? c[1] : c[0]) : null;
  return p && !broken(state, n, p) ? p : null;
}
