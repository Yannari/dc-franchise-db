// ══════════════════════════════════════════════════════════════════════
// bb/hoh-room.js — the night the Head of Household room opens
// ══════════════════════════════════════════════════════════════════════
//
// Three engine events happen in the new Head of Household's room on the night it opens: the room opens on the
// house (power-hoh-room-reveal), the HOH keeps a few people back when everybody else leaves (phase-hoh-room), and the
// letter from home is shared with one person (texture-hoh-letter). Every one of them moves bonds, and House Life
// aired about one in fifteen (measured 2026-10-16: phase-hoh-room fired in 27 weeks of 33 and aired in 2).
//
// They play inside the HOH Room screen instead, straight after the competition (vp-bb-ep/steps.js hohRoomScreen),
// and House Life does not air them again (bb/story/director.js). Both sides ask this file which beats those are,
// so the screen never shows a beat House Life also showed, and never drops one House Life left for it.

// in the order the night runs: the door opens, people leave or stay, the letter
const ORDER = ['power-hoh-room-reveal', 'phase-hoh-room', 'texture-hoh-letter'];

/** Whether this HOH competition gets the room's reveal: a Head of Household the house can see, with a room of their own. */
export function hasHohRoom(act) {
  return !!(act && act.type === 'hoh' && act.winner && !act.preCrowned && !act.secret && !act.coHoh && !act.side);
}

/**
 * The beats that play in the room's reveal for the HOH competition at acts[i]: the first of each event in the
 * competition's own act and the house life straight after it. Empty when there is no reveal.
 */
export function hohRoomBeats(acts, i) {
  const act = acts?.[i];
  if (!hasHohRoom(act)) return [];
  const from = [act, acts[i + 1]?.type === 'house' ? acts[i + 1] : null].filter(Boolean);
  const all = from.flatMap(a => a.socialBeats || []);
  return ORDER.map(id => all.find(b => b && b.eventId === id && (b.players || []).includes(act.winner))).filter(Boolean);
}
