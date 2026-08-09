// The competition that is secretly three competitions.
//
// BB27's Secret Power Competition, and the reason it is not another
// Whacktivity: a Whacktivity is a separate room you walk into, and this one IS
// the week's Head of Household. The wiki's sentence is the whole design —
// "everyone else was able to go for a power OR the HOH". Going for a power
// means not going for the crown, decided blind, in a yard where everybody can
// see which way you are facing.
//
// So the cost is real and it is paid in the only currency a week has. A
// Whacktivity entrant risks nothing; somebody here trades the most powerful
// seat in the house for a secret, and finds out on the same afternoon whether
// they were right.
//
// The outgoing Head of Household cannot win the crown back — the standing rule
// — so they play for a power or for nothing, which is the one week their
// exclusion is worth something to them.
//
// THREE SLOTS, AUTHORED. Same shelf as every other distributor
// (BB_POWER_DEFINITIONS), same three-door shape as the Whacktivity, so a new
// power becomes available here the day it is written and this file does not
// change. What is behind each door is the schedule's decision, not this
// module's.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { BB_POWER_DEFINITIONS, grantPower } from './powers.js';

/** How many doors the competition can hide. The show ran three. */
export const SECRET_POWER_DOORS = 3;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const beat = (text, players, badgeText, badgeClass) =>
  ({ text, players: [...(players || [])], badgeText, badgeClass });

/**
 * How badly one houseguest wants a power rather than the crown.
 *
 * Proportional, never a threshold. The people who chase a secret are the ones
 * who do not fancy their odds in the open — low competition stats, high
 * strategic, and anybody who can feel the week turning against them.
 */
function pull(name, { nominatedRecently = false } = {}) {
  const s = pStats(name) || {};
  const athletic = ((s.physical || 0) + (s.endurance || 0)) / 2;
  const scheming = ((s.strategic || 0) + (s.intuition || 0)) / 2;
  // Somebody who wins competitions has less reason to gamble the one in front
  // of them; somebody who does not has every reason.
  let want = 5 + (scheming - athletic) * 0.55;
  want += (10 - (s.loyalty || 5)) * 0.12;
  // Being in trouble lately is the strongest pull there is.
  if (nominatedRecently) want += 2.4;
  return clamp(want, 0, 12);
}

/** Which door appeals, given what the power actually does for this person. */
function doorFor(name, doors, rng) {
  const s = pStats(name) || {};
  const scored = doors.map(id => {
    const def = BB_POWER_DEFINITIONS[id];
    let score = 4 + (rng() - 0.5) * 3;
    if (!def) return { id, score: -1 };
    // A power that rewrites somebody else's week appeals to the bold; one that
    // saves your own appeals to whoever expects to need saving.
    if (def.rules?.usurpHoh) score += ((s.boldness || 5) - 5) * 0.5;
    if (def.rules?.vetoProxy || def.rules?.soloVetoComp) score += ((10 - (s.physical || 5)) * 0.3);
    if (def.rules?.unnominatable) score += ((10 - (s.social || 5)) * 0.3);
    return { id, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.id || doors[0];
}

/**
 * Run the week's Head of Household as a secret power competition.
 *
 * `hohResult` is the competition that already ran — this does not replace the
 * competition, it replaces what some of the people in it were playing FOR. The
 * crown still goes to the best score among those who went for the crown, which
 * is why somebody chasing a power can hand the week to a player who would
 * otherwise have lost it.
 *
 * Returns null rather than half-running: no doors stocked, or nobody eligible,
 * and the week keeps the ordinary Head of Household it already has.
 */
export function runSecretPowerComp({
  week, house = [], outgoingHoh = null, results = [], offered = [], rng = Math.random,
} = {}) {
  const doors = [...new Set((offered || []).filter(id => BB_POWER_DEFINITIONS[id]))]
    .slice(0, SECRET_POWER_DOORS);
  const field = (house || []).filter(Boolean);
  if (!doors.length || field.length < 4) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const recent = new Set((gs.bb?.weeks || []).slice(-2).flatMap(w => w?.nominees || []));

  // ── who is playing for what ──
  //
  // The outgoing HOH is barred from the crown by the standing rule, so for them
  // this is a power competition or nothing. Everybody else chooses.
  const chasing = new Map();
  for (const name of field) {
    const barred = name === outgoingHoh;
    const want = pull(name, { nominatedRecently: recent.has(name) });
    const goes = barred || rng() * 12 < want;
    if (goes) chasing.set(name, doorFor(name, doors, rng));
  }
  // A competition nobody gambles on is not this twist. Somebody always walks.
  if (!chasing.size) {
    const gambler = [...field]
      .filter(n => n !== outgoingHoh)
      .sort((a, b) => pull(b) - pull(a))[0];
    if (gambler) chasing.set(gambler, doorFor(gambler, doors, rng));
  }

  const beats = [beat(
    'The yard is not what it looks like. Three of the things out here are not the Head of '
      + 'Household at all, and every houseguest has already decided in private which one they '
      + 'are actually playing for.',
    field.slice(0, 6), 'SOMETHING ELSE IS ON THE LINE', 'gold')];
  if (outgoingHoh) {
    beats.push(beat(
      `${outgoingHoh} cannot win this back and everybody knows it, which for one week makes the `
        + 'outgoing Head of Household the only person out here with nothing to lose.',
      [outgoingHoh], 'NOTHING TO LOSE', 'blue'));
  }

  // ── the crown ──
  //
  // Read off the competition that ran: the best finisher who was actually
  // playing for it. Somebody chasing a door has removed themselves from the
  // race whatever their score says.
  const order = (results || []).map(r => r?.name).filter(Boolean);
  const forCrown = order.filter(n => !chasing.has(n) && n !== outgoingHoh);
  const winner = forCrown[0] || null;

  // ── the doors ──
  //
  // One power per door, to whoever went furthest for it. Nobody at a door
  // means the power stays in the box and the house never learns it was there.
  const rooms = [];
  const granted = [];
  for (const id of doors) {
    const entrants = order.filter(n => chasing.get(n) === id);
    const room = { power: id, name: BB_POWER_DEFINITIONS[id]?.name || id, entrants, winner: null };
    if (entrants.length) {
      room.winner = entrants[0];
      const instance = grantPower(id, room.winner, {
        week: weekNum, visibility: 'secret', source: 'bb-secret-power-comp',
      });
      if (instance) granted.push({ name: room.winner, power: id });
      beats.push(beat(
        `${room.winner} was never running for Head of Household. ${room.winner} was running for `
          + `something the rest of them have not been told exists, and it is now in ${room.winner}'s `
          + 'possession with an expiry date on it.',
        [room.winner], 'A PRIVATE WIN', 'gold'));
    } else {
      beats.push(beat(
        `Nobody went for one of them. It goes back in the box, and the house will finish this `
          + 'season without ever knowing what it was.',
        [], 'UNCLAIMED', 'grey'));
    }
    rooms.push(room);
  }

  // The cost, said out loud, because it is the point of the twist.
  const gambled = [...chasing.keys()].filter(n => n !== outgoingHoh);
  const lost = gambled.filter(n => order.indexOf(n) === 0);
  if (lost.length) {
    beats.push(beat(
      `${lost[0]} had the best afternoon out there by some distance and is not the Head of `
        + 'Household, because that is not what they were playing for. Nobody in this house will '
        + 'understand why for weeks.',
      [lost[0]], 'THE PRICE', 'red'));
  } else if (gambled.length && winner) {
    beats.push(beat(
      `${winner} takes the Head of Household. ${winner} also had ${gambled.length} `
        + `${gambled.length === 1 ? 'person' : 'people'} out there not competing for it, and will `
        + 'never be told which.',
      [winner], 'HANDED A WEEK', 'blue'));
  }

  return {
    type: 'secret-power-comp', week: weekNum,
    doors, rooms, winner, granted,
    chased: [...chasing.entries()].map(([name, power]) => ({ name, power })),
    beats,
  };
}
