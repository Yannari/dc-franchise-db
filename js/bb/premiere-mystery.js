// ══════════════════════════════════════════════════════════════════════
// PREMIERE NIGHT — the Mastermind takes the host and the relic
// ══════════════════════════════════════════════════════════════════════
//
// BB27's opening, and the reason A Summer of Mystery has an author rather than
// a decor scheme. From the wiki: the Mastermind "kicked off the season by
// kidnapping Julie and stealing the HoH Relic. This forced the houseguests to
// split into two groups of eight to try to recover each of them. Each group
// would compete in a competition where the winner would receive a
// game-changing prize."
//
// Two hunts, two winners, two prizes, and they are deliberately not equal:
//
//   THE RELIC   is loud. Whoever finds it names the four houseguests allowed
//               to play for the first crown, out loud, on night one.
//   THE HOST    is quiet, and disguised as the loud one. The finder wins ten
//               thousand dollars in front of everybody and is told in private
//               that it buys them off the block once.
//
// So the house spends its first fortnight watching the wrong prize. That is the
// whole joke of the night and it costs nothing to simulate: the powers are on
// the shelf, and this only decides who gets them.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond } from '../bonds.js';
import { grantPower } from './powers.js';
import { stableRng } from './knowledge.js';

// The rooms of a hotel nobody has been in for an hour. Each carries a
// different kind of hiding place, which is why who searches where matters.
const ROOMS = [
  { id: 'storeroom', name: 'the storeroom', lean: 'mental',
    detail: 'shelves of tinned nothing, stacked by somebody with a system' },
  { id: 'pantry', name: 'the pantry', lean: 'intuition',
    detail: 'a cold room that smells faintly of a smell nobody can name' },
  { id: 'sauna', name: 'the sauna', lean: 'boldness',
    detail: 'unbearable within ninety seconds, which is the point of it' },
  { id: 'lobby', name: 'the lobby desk', lean: 'social',
    detail: 'pigeonholes for rooms this hotel does not have' },
  { id: 'laundry', name: 'the laundry chute', lean: 'physical',
    detail: 'a drop nobody wants to put their arm into twice' },
  { id: 'library', name: 'the reading room', lean: 'mental',
    detail: 'three hundred books and one of them is hollow' },
  { id: 'ballroom', name: 'the ballroom', lean: 'endurance',
    detail: 'a floor that carries sound to every other room in the building' },
  { id: 'cellar', name: 'the cellar stair', lean: 'boldness',
    detail: 'the lights are on a timer somebody else controls' },
];

const stat = (name, key) => {
  try { return Number(pStats(name)?.[key]) || 5; } catch { return 5; }
};
const cap = t => `${t[0].toUpperCase()}${t.slice(1)}`;
const pick = (draw, list) => list[Math.floor(draw() * list.length)];

/**
 * One group's hunt, as a sequence of rooms rather than a die roll.
 *
 * Each round every searcher picks a room and turns something up or does not,
 * and the interesting output is not the winner — it is the record of who was
 * standing next to whom in a cellar at midnight on the first night, which is
 * where a season's first bonds actually come from.
 */
function runHunt({ team, target, targetName, draw, api }) {
  const rounds = [];
  const events = [];
  const heat = Object.fromEntries(team.map(n => [n, 0]));   // how warm each searcher is
  let found = null;
  const rooms = [...ROOMS];
  for (let i = rooms.length - 1; i > 0; i--) {
    const j = Math.floor(draw() * (i + 1));
    [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  }
  // The thing is in exactly one of them, and the house does not know which.
  const hidingIn = rooms[Math.floor(draw() * Math.min(4, rooms.length))];

  for (let round = 0; round < 3 && !found; round++) {
    const picks = [];
    for (const who of team) {
      // Where somebody looks is a read: intuition narrows it, and being warm
      // already pulls you back to the room you were in.
      const bias = stat(who, 'intuition') / 10;
      const pool = rooms.slice(0, Math.max(3, Math.round(rooms.length * (1 - bias * 0.45))));
      const room = heat[who] > 0 && draw() < 0.55
        ? hidingIn
        : pool[Math.floor(draw() * pool.length)];
      picks.push({ who, room });
    }

    // Two people in one room is the first social fact of the season.
    const byRoom = {};
    for (const p of picks) (byRoom[p.room.id] ||= []).push(p.who);

    for (const p of picks) {
      const skill = stat(p.who, p.room.lean) / 10;
      const right = p.room.id === hidingIn.id;
      const roll = draw();
      if (right && roll < 0.34 + skill * 0.4 && !found) {
        found = p.who;
        rounds.push({ round: round + 1, who: p.who, room: p.room.name, outcome: 'found',
          text: `${p.who} goes back into ${p.room.name} for the second time and comes out holding it.` });
        break;
      }
      if (right) {
        heat[p.who] += 1;
        rounds.push({ round: round + 1, who: p.who, room: p.room.name, outcome: 'warm',
          text: pick(draw, [
            `${p.who} is in ${p.room.name} — ${p.room.detail} — and comes out with nothing, and a face that tells four people where to go next.`,
            `${p.who} spends far too long in ${p.room.name} and leaves without saying why, which is itself an answer.`,
            `Something in ${p.room.name} is not sitting right and ${p.who} cannot say what. ${p.who} goes back to the lobby and keeps looking at the door.`,
            `${p.who} has been in ${p.room.name} twice now. The second time, ${p.who} shuts the door behind ${'them'}.`,
          ]) });
      } else {
        // Four searchers can pick the same room in a round, and the sentence
        // was identical every time — the same line three deep reads as a bug
        // even when the simulation underneath is fine.
        rounds.push({ round: round + 1, who: p.who, room: p.room.name, outcome: 'cold',
          text: pick(draw, [
            `${p.who} takes ${p.room.name} apart. ${cap(p.room.detail)}. Nothing.`,
            `Nothing in ${p.room.name}, and ${p.who} has now checked it properly enough to say so out loud.`,
            `${p.who} tries ${p.room.name} — ${p.room.detail} — and gives it up after five minutes.`,
            `${p.who} works ${p.room.name} over and finds a light switch, a draught and no relic.`,
            `${p.who} is not the first person through ${p.room.name} tonight and can tell.`,
          ]) });
      }
    }

    // ── what happened while they were looking ──
    for (const [roomId, who] of Object.entries(byRoom)) {
      if (who.length < 2 || found) continue;
      const room = rooms.find(x => x.id === roomId);
      const [a, b] = who;
      // Two strangers in a small room, an hour into knowing each other.
      const together = draw() < 0.55;
      if (together) {
        api.bond(a, b, 1.6);
        events.push({ kind: 'together', players: [a, b],
          text: `${a} and ${b} end up in ${room.name} together and stop searching to talk. `
            + `It is the first conversation either of them has had in this house that was not a name and a handshake.`,
          badge: 'FIRST NIGHT' });
      } else {
        api.bond(a, b, -1.2);
        events.push({ kind: 'collide', players: [a, b],
          text: `${a} and ${b} arrive at ${room.name} within seconds of each other and neither `
            + `leaves. They search around one another in silence, and both of them remember it.`,
          badge: 'IN EACH OTHER’S WAY' });
      }
    }
    // Somebody sits on what they know rather than sharing it.
    if (!found && team.length > 3 && draw() < 0.5) {
      const warm = team.filter(n => heat[n] > 0);
      const quiet = warm.sort((x, y) => stat(y, 'strategic') - stat(x, 'strategic'))[0];
      if (quiet) {
        const mark = team.find(n => n !== quiet);
        api.bond(quiet, mark, -0.6);
        events.push({ kind: 'withheld', players: [quiet, mark].filter(Boolean),
          text: `${quiet} has narrowed it down and says so to nobody. When ${mark} asks whether `
            + `${quiet} has checked ${hidingIn.name}, the answer is a shrug — on night one, before `
            + `anybody has done anything to anybody.`,
          badge: 'KEEPS IT' });
      }
    }
  }

  // Three rounds and nothing: whoever got warmest gets it, because the search
  // has to end and the building is not that big.
  if (!found) {
    found = team.slice().sort((a, b) => (heat[b] - heat[a])
      || (stat(b, 'intuition') - stat(a, 'intuition')))[0];
    rounds.push({ round: 4, who: found, room: hidingIn.name, outcome: 'found',
      text: `Nobody has turned up anything for an hour. ${found} goes back to ${hidingIn.name} on `
        + `a hunch that is mostly stubbornness, and this time puts a hand behind the panel.` });
  }

  return { found, rounds, events, hidingIn: hidingIn.name, target, targetName };
}


/**
 * Split the house and run both hunts.
 *
 * Returns the act, or null when the house is too small to split in two — below
 * eight this is four people looking for two things, which is not a mystery.
 */
export function runPremiereMystery(week, house, { rng = Math.random } = {}) {
  const cast = (house || []).filter(Boolean);
  if (cast.length < 8) return null;

  const r = stableRng('premiere-mystery', gs?.bb?.seasonSalt || 0, week.num);

  // Two groups, split down the middle by the draw rather than by anybody's
  // choice — night one, nobody has an alliance to be split away from yet.
  const shuffled = [...cast];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const half = Math.ceil(shuffled.length / 2);
  const relicTeam = shuffled.slice(0, half);
  const hostTeam = shuffled.slice(half);

  // ── two hunts, actually searched ──
  //
  // This was a sort() over a stat with noise on it, which produced a winner and
  // nothing else — no rooms, no near misses, nobody standing next to anybody.
  // The first night of a season is where every relationship in it starts, and
  // it was being spent on a die roll.
  const api = {
    bond: (a, b, d) => { try { addBond(a, b, d); } catch { /* strangers */ } },
  };
  const relicHunt = runHunt({ team: relicTeam, target: 'relic', targetName: 'the relic',
    draw: r, api });
  const hostHunt = runHunt({ team: hostTeam, target: 'host', targetName: 'the host',
    draw: r, api });
  const relicWinner = relicHunt.found;
  const hostWinner = hostHunt.found;

  // ── the prizes ──
  //
  // Granted through the ordinary power shelf, so everything downstream — the
  // ledger, the expiry sweep, the week engine's own hooks — treats them as the
  // powers they are rather than as premiere-night furniture.
  //
  // Visibility is the point of the pair. The relic is public because the house
  // watches the four names being read out; the buy-off is secret because the
  // house only ever saw a cheque.
  let relicGranted = null;
  let buyOffGranted = null;
  try {
    relicGranted = grantPower('hoh-gatekeeper', relicWinner,
      { week: week.num, visibility: 'public', source: 'premiere-relic' });
  } catch { relicGranted = null; }
  try {
    buyOffGranted = grantPower('buy-off', hostWinner,
      { week: week.num, visibility: 'secret', source: 'premiere-buy-off' });
  } catch { buyOffGranted = null; }

  // The money is public even though the power is not, so the house forms an
  // opinion about the wrong thing — which is exactly what it did on the show.
  if (seasonConfig?.popularityEnabled !== false) {
    gs.popularity ||= {};
    gs.popularity[hostWinner] = Math.round(((gs.popularity[hostWinner] || 0) + 3) * 100) / 100;
    gs.popularity[relicWinner] = Math.round(((gs.popularity[relicWinner] || 0) + 2) * 100) / 100;
  }
  // Winning ten thousand dollars in front of fifteen people you have known for
  // four hours does not make you popular with all of them.
  for (const n of cast) {
    if (n === hostWinner) continue;
    try { addBond(n, hostWinner, -0.4); } catch { /* night one, barely anybody */ }
  }

  const p = pronouns ? (() => { try { return pronouns(relicWinner); } catch { return null; } })() : null;

  return {
    relicWinner, hostWinner, relicTeam, hostTeam,
    act: {
      type: 'premiere-mystery',
      relicWinner, hostWinner,
      relicTeam: [...relicTeam], hostTeam: [...hostTeam],
      hunts: [
        { target: 'the relic', team: [...relicTeam], found: relicWinner,
          hidingIn: relicHunt.hidingIn, rounds: relicHunt.rounds, events: relicHunt.events },
        { target: 'the host', team: [...hostTeam], found: hostWinner,
          hidingIn: hostHunt.hidingIn, rounds: hostHunt.rounds, events: hostHunt.events },
      ],
      money: 10000,
      relicGranted: !!relicGranted,
      buyOffGranted: !!buyOffGranted,
      beats: [{
        text: `Nobody has unpacked. The host is gone, the Head of Household relic is gone with `
          + `${p ? p.obj : 'them'}, and the house is told it has been split in two and sent looking. `
          + `<strong>${relicWinner}</strong> comes back with the relic and the right to say who `
          + `plays for the first crown. <strong>${hostWinner}</strong> comes back with the host and `
          + `ten thousand dollars, and everybody watches ${hostWinner} be handed it.`,
        players: [relicWinner, hostWinner],
        badgeText: 'PREMIERE NIGHT', badgeClass: 'gold',
        eventId: 'premiere-mystery', category: 'twist', location: 'living-room',
      }, {
        text: `What the room does not hear is the second half of what ${hostWinner} is told: the `
          + `money is not a prize, it is a key. Spent once, before the jury, it takes `
          + `${hostWinner} off the block and leaves whoever is Head of Household naming somebody `
          + `else on the spot with no say in it.`,
        players: [hostWinner],
        badgeText: 'AND THE OTHER HALF', badgeClass: 'purple',
        eventId: 'premiere-buy-off-secret', category: 'twist', location: 'diary-room',
      }],
    },
  };
}
