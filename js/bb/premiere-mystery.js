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
import { gs, seasonConfig, kinshipPairs } from '../core.js';
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
  const metPairs = new Set();
  const heat = Object.fromEntries(team.map(n => [n, 0]));   // how close each searcher is
  const rooms = [...ROOMS];
  for (let i = rooms.length - 1; i > 0; i--) {
    const j = Math.floor(draw() * (i + 1));
    [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  }
  const hidingIn = rooms[Math.floor(draw() * Math.min(4, rooms.length))];

  // ── IT IS A COMPETITION, WHICH MEANS IT HAS A LENGTH ─────────────────
  //
  // The wiki is specific: each group "would compete in a competition where the
  // winner would receive a game-changing prize". It was a race with a
  // structure, not a lucky rummage — and simulated as one it produced a
  // sixteen-card search beside a one-card search, because a first-round find
  // ended that group's night before it started.
  //
  // So both groups play the same three rounds. Every round everybody searches,
  // everybody gets closer or does not, and the recovery happens at the END, by
  // whoever is closest when the rooms run out. Same shape on both sides of the
  // house, every time.
  const ROUNDS = 3;
  for (let round = 0; round < ROUNDS; round++) {
    const picks = [];
    for (const who of team) {
      const bias = stat(who, 'intuition') / 10;
      const pool = rooms.slice(0, Math.max(3, Math.round(rooms.length * (1 - bias * 0.45))));
      const room = heat[who] > 0 && draw() < 0.6
        ? hidingIn
        : pool[Math.floor(draw() * pool.length)];
      picks.push({ who, room });
    }

    const byRoom = {};
    for (const p of picks) (byRoom[p.room.id] ||= []).push(p.who);

    for (const p of picks) {
      const skill = stat(p.who, p.room.lean) / 10;
      const right = p.room.id === hidingIn.id;
      if (right) {
        // Closer, not finished. How much closer is what the room asks of you.
        heat[p.who] += 1 + (draw() < skill ? 1 : 0);
        // Plain facts; a warm search is spoken (lines/pmact.js). Each used to
        // pick its wording with one draw, and the draw stays.
        draw();
        rounds.push({ round: round + 1, who: p.who, room: p.room.name, outcome: 'warm',
          text: `${p.who} searches ${p.room.name} and gets closer.` });
      } else {
        draw();
        rounds.push({ round: round + 1, who: p.who, room: p.room.name, outcome: 'cold',
          text: `${p.who} searches ${p.room.name} and finds nothing.` });
      }
    }

    for (const [roomId, who] of Object.entries(byRoom)) {
      if (who.length < 2) continue;
      const room = rooms.find(x => x.id === roomId);
      const [a, b] = who;
      // Two people who keep choosing the same room keep meeting in it, which
      // is true and unreadable: the identical card three rounds running looks
      // like a bug even though the search underneath is right. The first
      // meeting is the story; after that they have already met.
      const met = `${[a, b].sort().join('|')}`;
      if (metPairs.has(met)) continue;
      metPairs.add(met);
      if (draw() < 0.55) {
        api.bond(a, b, 1.6);
        events.push({ kind: 'together', players: [a, b], round: round + 1,
          text: `${a} and ${b} meet in ${room.name} and stop searching to talk.`, room: room.name,
          badge: 'FIRST NIGHT' });
      } else {
        api.bond(a, b, -1.2);
        events.push({ kind: 'collide', players: [a, b], round: round + 1,
          text: `${a} and ${b} search ${room.name} at the same time, in silence.`, room: room.name,
          badge: 'IN EACH OTHER’S WAY' });
      }
    }
    if (team.length > 3 && draw() < 0.45) {
      const warm = team.filter(n => heat[n] > 0);
      const quiet = warm.sort((x, y) => stat(y, 'strategic') - stat(x, 'strategic'))[0];
      const mark = quiet ? team.find(n => n !== quiet) : null;
      // Same rule as the meetings above: one event per pair per hunt. Two
      // people already have a card about each other; a second one about the
      // same two reads as the page repeating itself.
      const key = quiet && mark ? [quiet, mark].sort().join('|') : null;
      if (quiet && mark && !metPairs.has(key)) {
        metPairs.add(key);
        api.bond(quiet, mark, -0.6);
        events.push({ kind: 'withheld', players: [quiet, mark], round: round + 1,
          text: `${quiet} keeps a lead on ${hidingIn.name} from ${mark}.`, room: hidingIn.name,
          badge: 'KEEPS IT' });
      }
    }
  }

  // The recovery, at the end, by whoever got closest. A tie goes to the one the
  // last room actually suited.
  const found = team.slice().sort((a, b) => (heat[b] - heat[a])
    || (stat(b, hidingIn.lean) - stat(a, hidingIn.lean))
    || (stat(b, 'intuition') - stat(a, 'intuition')))[0];
  rounds.push({ round: ROUNDS + 1, who: found, room: hidingIn.name, outcome: 'found',
    text: `${found} finds ${targetName} in ${hidingIn.name}.` });
  api.pop(found, 2);

  return { found, rounds, events, hidingIn: hidingIn.name, target, targetName,
    standings: team.slice().sort((a, b) => heat[b] - heat[a]).map(n => ({ name: n, heat: heat[n] })) };
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

  // ── HOW THE TWO GROUPS FORM ──────────────────────────────────────────
  //
  // The wiki says the house "split into two groups of eight" and does not say
  // how, so this is our rule rather than the show's, and the screen says so
  // out loud rather than presenting a coin toss as history.
  //
  // The rule: they are given a minute to split themselves, and on night one
  // that is not strategy — nobody has anything to be strategic ABOUT. It is
  // who was standing where when the lights went out. The one thing that is not
  // random is that people the cast has DECLARED a relationship for stay
  // together: a pair who walked in knowing each other are not going to split
  // up sixty seconds later, and that is a fact the season already holds.
  const shuffled = [...cast];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const half = Math.ceil(shuffled.length / 2);
  const relicTeam = shuffled.slice(0, half);
  const hostTeam = shuffled.slice(half);
  // Declared pairs follow each other across.
  const kept = [];
  try {
    for (const pair of kinshipPairs()) {
      const { a, b } = pair;
      if (!cast.includes(a) || !cast.includes(b)) continue;
      const aIn = relicTeam.includes(a);
      const bIn = relicTeam.includes(b);
      if (aIn === bIn) continue;
      // Move the second one to the first one's group, and send somebody back
      // the other way so the halves stay halves.
      //
      // THE SWAP HAS TO COME FROM THE GROUP B IS JOINING. It was picked out of
      // the group B was LEAVING and then spliced out of the other one — where
      // indexOf returns -1, so splice(-1, 1) quietly removed that group's last
      // member instead, and the same person was pushed into a team they were
      // still in. The result was houseguests appearing twice in one search and
      // a card reading "Damien and Damien end up in the storeroom together".
      const from = bIn ? relicTeam : hostTeam;   // where b is now
      const to = bIn ? hostTeam : relicTeam;     // where a is, and b is going
      const swapBack = to.find(n => n !== a && !kept.includes(n));
      if (!swapBack) continue;
      from.splice(from.indexOf(b), 1);
      to.splice(to.indexOf(swapBack), 1);
      to.push(b);
      from.push(swapBack);
      kept.push(a, b);
    }
  } catch { /* no declared relationships, no adjustment */ }
  // Belt: whatever the pairing did, every houseguest searches once and appears
  // on exactly one side. A duplicate here is four wasted cards and a
  // conversation somebody has with themselves.
  const seen = new Set();
  for (const team of [relicTeam, hostTeam]) {
    for (let i = team.length - 1; i >= 0; i--) {
      if (seen.has(team[i])) team.splice(i, 1); else seen.add(team[i]);
    }
  }
  for (const n of cast) if (!seen.has(n)) hostTeam.push(n);

  // ── two hunts, actually searched ──
  //
  // This was a sort() over a stat with noise on it, which produced a winner and
  // nothing else — no rooms, no near misses, nobody standing next to anybody.
  // The first night of a season is where every relationship in it starts, and
  // it was being spent on a die roll.
  const api = {
    bond: (a, b, d) => { try { addBond(a, b, d); } catch { /* strangers */ } },
    pop: (n, d) => {
      if (seasonConfig?.popularityEnabled === false) return;
      gs.popularity ||= {};
      gs.popularity[n] = Math.round(((gs.popularity[n] || 0) + d) * 100) / 100;
    },
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

  return {
    relicWinner, hostWinner, relicTeam, hostTeam,
    act: {
      type: 'premiere-mystery',
      relicWinner, hostWinner,
      relicTeam: [...relicTeam], hostTeam: [...hostTeam],
      // Said on the screen, because a rule the audience cannot see is a rule
      // the audience assumes is rigged.
      splitRule: 'They were given a minute to split themselves in half. On night one that is '
        + 'not strategy — nobody has anything to be strategic about yet — so it is who was '
        + 'standing where when the lights went out.'
        + (kept.length ? ` The one thing that was not chance: ${
          [...new Set(kept)].join(', ')} already knew somebody in here, and stayed with them.` : ''),
      splitKept: [...new Set(kept)],
      hunts: [
        { target: 'the relic', team: [...relicTeam], found: relicWinner,
          hidingIn: relicHunt.hidingIn, rounds: relicHunt.rounds, events: relicHunt.events },
        { target: 'the host', team: [...hostTeam], found: hostWinner,
          hidingIn: hostHunt.hidingIn, rounds: hostHunt.rounds, events: hostHunt.events },
      ],
      money: 10000,
      relicGranted: !!relicGranted,
      buyOffGranted: !!buyOffGranted,
      // Plain facts with a `part`; the words are lines/pmact.js.
      beats: [{
        text: `${relicWinner} finds the relic and ${hostWinner} finds the host, winning $10,000.`, part: 'night',
        players: [relicWinner, hostWinner],
        badgeText: 'PREMIERE NIGHT', badgeClass: 'gold',
        eventId: 'premiere-mystery', category: 'twist', location: 'living-room',
      }, {
        text: `${hostWinner} is told in private that the money is the Buy-Off: once, it takes ${hostWinner} off the block.`, part: 'secret',
        players: [hostWinner],
        badgeText: 'AND THE OTHER HALF', badgeClass: 'purple',
        eventId: 'premiere-buy-off-secret', category: 'twist', location: 'diary-room',
      }],
    },
  };
}
