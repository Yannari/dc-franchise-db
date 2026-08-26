// ══════════════════════════════════════════════════════════════════════
// late-arrival.js — somebody walks in after the season has started
// ══════════════════════════════════════════════════════════════════════
//
// Every camp in this engine begins with everybody already standing on the
// dock. `generateDockArrivals` fires once, at episode zero, and after that the
// cast can only ever shrink — which rules out the oldest device in the genre:
// the player who was not there on day one.
//
// ── WHY IT IS A HOLD-OUT AND NOT AN INSERT ──
//
// The arrival is cast normally, in the cast builder, as one of the season's
// players. Then this holds them BACK: at episode zero they are lifted out of
// the roster and their tribe, and put in again on the episode the author
// scheduled. Building it the other way round — inventing a player mid-season
// and appending them — would mean a person with no entry in `players`, no
// stats, no avatar and no relationship rows, which is a different and much
// worse problem than the one the twist is solving.
//
// ── WHAT THEY ARRIVE WITH ──
//
// Nothing. No advantage, no grace episode. Bonds with all twenty-four of them
// sit at zero because nothing has happened yet; every alliance in that camp was
// formed while they were not in the room; and they have no challenge record, so
// nobody has any reason to think they are useful. That IS the twist — the
// engine models the disadvantage honestly rather than staging it — and the
// only thing standing between them and an immediate vote is what they do in
// the days after they walk in.
//
// The Fans vs Favorites shape it was built for puts them on the OTHER tribe:
// a Favorite dropped into the Fans' camp is the most experienced person there
// and the least wanted, at the same time, and everybody in that camp knows
// exactly which one they are.
import { gs, players, seasonConfig } from './core.js';
import { pronouns } from './players.js';

/** The scheduled arrival, if this season has one. */
export function lateArrivalEntry(config = seasonConfig) {
  return (config?.twistSchedule || []).find(t => t && t.type === 'late-arrival') || null;
}

/**
 * Who is arriving late.
 *
 * Named on the scheduled entry. With no name — an author who added the twist
 * and never picked anybody — the last player in the cast is used, because a
 * twist that silently does nothing is worse than one that makes a choice.
 */
export function lateArrivalName(config = seasonConfig) {
  const entry = lateArrivalEntry(config);
  if (!entry) return null;
  if (entry.arrival && players.some(p => p.name === entry.arrival)) return entry.arrival;
  return players.length ? players[players.length - 1].name : null;
}

/**
 * Which camp they walk into.
 *
 *   'smallest'  whichever tribe has fewest players — the default, because it
 *               is the one answer that stays sensible however the season has
 *               gone by the time they arrive. TIED TRIBES BREAK TOWARD THE
 *               CAMP THEY WERE NOT CAST ON, which is not a detail: on an even
 *               split it produces the Trojan horse on its own, and on an
 *               uneven one it evens the numbers instead.
 *   'other'     always the tribe they were not cast on.
 *   'own'       the tribe they were cast on.
 *   <name>      that tribe, if it still exists.
 */
function tribeFor(name, entry) {
  const tribes = (gs.tribes || []).filter(t => t && Array.isArray(t.members));
  if (!tribes.length) return null;
  const home = tribes.find(t => (t.members || []).includes(name))
    || tribes.find(t => t.name === (gs._lateArrival?.castOn));
  const away = tribes.find(t => t !== home) || home;
  const want = entry?.arrivalTribe || 'smallest';

  if (want === 'own') return home || tribes[0];
  if (want === 'other') return away || tribes[0];
  const named = tribes.find(t => t.name === want);
  if (named) return named;

  // 'smallest', and anything unrecognised.
  const fewest = Math.min(...tribes.map(t => t.members.length));
  const tied = tribes.filter(t => t.members.length === fewest);
  if (tied.length === 1) return tied[0];
  return tied.find(t => t !== home) || tied[0];
}

/**
 * Lift them out before the season starts.
 *
 * Called once, at episode zero, before anything has read the roster. Their
 * tribe membership is remembered so `'own'` still means something later.
 */
export function holdOutLateArrival() {
  const entry = lateArrivalEntry();
  if (!entry || gs._lateArrival) return null;
  const name = lateArrivalName();
  if (!name) return null;
  const tribes = gs.tribes || [];
  const home = tribes.find(t => (t.members || []).includes(name));
  gs._lateArrival = {
    name,
    episode: Math.max(2, Number(entry.episode) || 3),
    castOn: home ? home.name : null,
    seated: false,
  };
  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== name);
  if (home) home.members = home.members.filter(n => n !== name);
  return gs._lateArrival;
}

/** Whether this episode is the one they walk into. */
export function lateArrivalDue(epNum) {
  const held = gs._lateArrival;
  return !!held && !held.seated && Number(epNum) >= held.episode;
}

/**
 * `where` is already a phrase, not a name: a tribe is "Fans camp" and a
 * tribeless season is "the game". Passing the raw name and appending the word
 * "camp" produced "walks into the game camp", which is not a place.
 */
const WALK_IN = [
  (n, w) => `${n} walks into ${w} carrying a bag, and every conversation in earshot stops at the same time.`,
  (n, w) => `Nobody in ${w} is expecting anybody. ${n} comes up the path anyway.`,
  (n, w, p) => `${n} arrives late, alone, into ${w} — which has already had ${p.posAdj} share of arguments without ${p.obj}.`,
];

const THE_PROBLEM = [
  (n, w) => `Everybody in ${w} has spent days working out who they trust. ${n} was not in any of those conversations, and it shows before anybody says a word.`,
  (n) => `${n} has no bonds here, no alliance, and nothing yet to be useful for. There is no version of this where that is not the first thing everybody notices.`,
  (n, w) => `${n} is now the easiest vote in ${w}, and knows it, and has about two days to change it.`,
];

const THEY_KNOW = [
  (n) => `Nobody has to be told who ${n} is. That is the problem and the only thing worth having, both at once.`,
  (n, t) => `Half of ${t} could recite ${n}'s season back to ${pronouns(n).obj}. That is not the same as wanting ${pronouns(n).obj} here.`,
  (n) => `They know exactly what ${n} is capable of, which is the worst possible way to be introduced to a camp that has to vote somebody out.`,
];

/**
 * Seat them, and say so.
 *
 * Returns the camp event the caller drops into the episode, or null if the
 * arrival cannot happen (a tribe that no longer exists, a merge already run).
 */
export function seatLateArrival(ep, { rng = Math.random } = {}) {
  const held = gs._lateArrival;
  if (!held || held.seated) return null;
  const entry = lateArrivalEntry();
  const tribe = gs.isMerged ? null : tribeFor(held.name, entry);

  // ── SEAT THEM WHATEVER HAPPENS ──
  //
  // This used to return early when there was no camp to walk into — a merged
  // season, or a season with no tribes at all — and the consequence was that
  // the held-out player never entered AT ALL. They sat outside the roster for
  // the rest of the season and the twist quietly deleted somebody from the
  // cast, which is the worst thing this file could possibly do.
  //
  // After a merge there is no tribe to join and none is needed: everybody is
  // already playing as individuals, so they simply walk into the game.
  // ── WHO WAS ALREADY IN THE ROOM, CAPTURED HERE ──
  //
  // Recorded at the moment of seating, before they are added, because this is
  // the only place the answer is unambiguous. The screen was deriving it
  // afterwards from whatever the stored episode happened to carry — the tribe
  // snapshot, then the roster, then the tribal council list — and each of
  // those is empty on some kind of episode, which is how it ended up printing
  // "0 PEOPLE WHO HAVE ALREADY DECIDED WHO THEY TRUST" over an empty row.
  const alreadyHere = tribe
    ? (tribe.members || []).filter(n => n !== held.name)
    : (gs.activePlayers || []).filter(n => n !== held.name);
  gs.activePlayers = [...new Set([...(gs.activePlayers || []), held.name])];
  if (tribe) tribe.members = [...new Set([...(tribe.members || []), held.name])];
  held.seated = true;
  held.seatedOn = tribe ? tribe.name : (gs.mergeName || 'the game');
  held.seatedEp = ep?.num || held.episode;

  const pick = list => list[Math.floor(rng() * list.length)];
  const p = pronouns(held.name);
  const campName = held.seatedOn;
  // A tribe is a camp; a tribeless season is just the game. Built here so no
  // line has to guess which it is.
  const where = tribe ? `${campName} camp` : (gs.mergeName ? `${gs.mergeName}` : 'the game');
  const away = !!tribe && held.castOn && held.castOn !== tribe.name;

  return {
    type: 'lateArrival',
    text: `${pick(WALK_IN)(held.name, where, p)} ${pick(THE_PROBLEM)(held.name, where, p)}`
      + (away ? ` ${pick(THEY_KNOW)(held.name, campName, p)}` : ''),
    players: [held.name],
    badgeText: away ? 'ONE OF THEM IS NOT' : 'A LATE ARRIVAL',
    badgeClass: 'gold',
    arrival: held.name,
    tribe: campName,
    alreadyHere,
    fromOtherSide: !!away,
  };
}

/** What the season records about it, for the wiki and the record book. */
export function lateArrivalSummary() {
  const held = gs._lateArrival;
  if (!held || !held.seated) return null;
  return { name: held.name, episode: held.seatedEp, tribe: held.seatedOn,
    fromOtherSide: held.castOn && held.castOn !== held.seatedOn };
}
