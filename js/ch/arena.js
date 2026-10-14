// ══════════════════════════════════════════════════════════════════════
// ch/arena.js — the elimination games and the duel
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.3. The game is drawn AFTER the call-out (as on the real show: the
// players learn it at the Arena), so a smart call-out can still meet the wrong
// game. A duel is played as beats (rounds, or the stages of a race), each from
// the two players' stat blend for this game, their energy and confidence under
// full pressure (mind.js performanceMod), a little respect momentum, and luck,
// through a logistic win chance. The beats are what the viewer animates.
//
// The names are the show's own (inspired by the real Arena's kinds of game,
// never its names). Each `desc` follows CLAUDE.md's challenge rule: the set-up,
// the mechanic, what goes wrong, and the win condition, said outright.
import { S, noise, logistic } from './state.js';
import { performanceMod, nudge } from './mind.js';

export const ARENA_GAMES = [
  { id: 'pole-grapple', name: 'Pole Grapple', kind: 'physical', format: 'first-to-2',
    blend: { physical: 0.5, endurance: 0.2, boldness: 0.2, temperament: 0.1 },
    desc: 'The two players stand in a sand circle gripping the same steel pole, both hands on it, nobody touching the ground with anything but their feet. On TJ\'s horn they twist, pull and drive with their legs to rip the pole out of the other\'s hands. Losing your grip or stepping out of the circle hands your opponent the round, and a pole that falls free is restarted. The first to win two rounds wins the elimination.' },
  { id: 'hallway-hustle', name: 'Hallway Hustle', kind: 'physical', format: 'first-to-2',
    blend: { physical: 0.55, boldness: 0.3, endurance: 0.15 },
    desc: 'A narrow padded hallway with a bell at each end, and the two players start at opposite ends facing each other. On the horn they run straight at each other and try to get past, by force, to ring the bell behind their opponent. Getting driven back to your own end, or going down and staying down, loses the round. The first to ring the bell twice wins the elimination.' },
  { id: 'knot-bomb', name: 'Knot Bomb', kind: 'mixed', format: 'race',
    blend: { mental: 0.3, endurance: 0.3, physical: 0.2, temperament: 0.2 },
    desc: 'Each player has a long rope tied in dozens of knots around a wooden frame, and a key buried at the far end of the rope. They have to untie every knot, pull the rope free, and carry the key back to their podium to unlock a smoke bomb. Pulling the wrong end tightens a knot instead of loosening it, and a dropped key goes back to the frame. The first to set off their smoke bomb wins the elimination.' },
  { id: 'puzzle-pit', name: 'Puzzle Pit', kind: 'puzzle', format: 'race',
    blend: { mental: 0.5, temperament: 0.3, intuition: 0.2 },
    desc: 'The players dig through a sand pit for twelve puzzle pieces, carry them up a ramp, and fit them into a board that shows the Blue Lagoon. Every piece has to be found and placed, and the board only locks when it is right. A wrong piece forces them back down to dig again, and the sand fills the holes they have already dug. The first to lock their board and hit the buzzer wins the elimination.' },
  { id: 'hang-time', name: 'Hang Time', kind: 'endurance', format: 'last-standing',
    blend: { endurance: 0.55, temperament: 0.25, physical: 0.2 },
    desc: 'Both players hang from a bar above a mud pit, with nothing under their feet. Every few minutes TJ lowers the bar a notch closer to the mud and the platform they started from is taken away. Letting go, or touching the mud with any part of the body, ends the game for that player at once. The last one still hanging wins the elimination.' },
  { id: 'ram-wall', name: 'Ram Wall', kind: 'physical', format: 'race',
    blend: { physical: 0.45, endurance: 0.35, boldness: 0.2 },
    desc: 'Each player faces a wall of stacked wooden crates, and three of the crates hold a battery. They smash through the crates with their shoulders and hands, dig the batteries out of the wreck, and run each one back to light a panel. A battery dropped in the debris has to be found again, and the wall gets harder the lower they go. The first to light all three lamps on their panel wins the elimination.' },
  { id: 'tug-pit', name: 'Tug Pit', kind: 'physical', format: 'first-to-2',
    blend: { physical: 0.5, endurance: 0.3, temperament: 0.2 },
    desc: 'The two players are tied to opposite ends of a rope over a shallow pit of water, each with a flag on a post behind them. On the horn they pull, trying to drag the other to the edge of the pit and reach back for their own flag. Slipping into the pit, or letting the rope run through your hands, loses the round. The first to grab their flag twice wins the elimination.' },
  { id: 'ball-brawl', name: 'Ball Brawl', kind: 'physical', format: 'first-to-3',
    blend: { physical: 0.45, boldness: 0.25, endurance: 0.2, intuition: 0.1 },
    desc: 'A ring of sand with one heavy ball in the middle and a hoop at each side. The players wrestle the ball away from each other and carry or throw it into their own hoop. Going out of the ring with the ball turns it over, and tackling below the knees is a penalty point. The first to score three wins the elimination.' },
  { id: 'memory-swim', name: 'Memory Swim', kind: 'mixed', format: 'race',
    blend: { mental: 0.35, endurance: 0.35, physical: 0.15, intuition: 0.15 },
    desc: 'A buoy in the lagoon shows a sequence of eight colours, and each player has a raft of coloured tiles back on the beach. They swim out, memorise the sequence, swim back and lay the tiles in order. A wrong sequence means swimming out to look again, and the waves make every trip slower than the last. The first with the right sequence on their raft wins the elimination.' },
  { id: 'barrel-ramp', name: 'Barrel Ramp', kind: 'endurance', format: 'race',
    blend: { physical: 0.4, endurance: 0.4, temperament: 0.2 },
    desc: 'Ten water barrels sit at the bottom of a steep sand ramp for each player, and a platform waits at the top. They roll the barrels up one at a time and stand them on the platform. A barrel that gets away rolls back to the bottom, and so does anything it knocks over on the way down. The first to stand all ten barrels on their platform wins the elimination.' },
  { id: 'spin-stack', name: 'Spin Stack', kind: 'puzzle', format: 'race',
    blend: { mental: 0.3, temperament: 0.4, intuition: 0.3 },
    desc: 'Each player spins ten times on a bat, runs to a table and stacks wooden blocks into a tower to match a picture. Every five blocks they have to go back to the bat and spin again. A tower that falls has to be rebuilt from the bottom, and the dizzier they get, the more it shakes. The first to finish the tower and ring the bell wins the elimination.' },
];

export function drawGame(state, rng) {
  const recent = state.episodes.slice(-4).flatMap(e => (e.arena || []).map(a => a.game));
  const fresh = ARENA_GAMES.filter(g => !recent.includes(g.id));
  const pool = fresh.length ? fresh : ARENA_GAMES;
  return pool[Math.floor(rng() * pool.length)];
}

export function blendScore(name, blend) {
  let s = 0, w = 0;
  for (const [k, v] of Object.entries(blend)) { s += S(name, k) * v; w += v; }
  return w ? s / w : 5;
}

// One beat between a and b: who takes it, and by how much.
function beat(state, rng, game, a, b, carry = 0) {
  const sa = blendScore(a, game.blend) * performanceMod(state, a, 1) + (state.rec[a]?.respect || 0) * 0.04;
  const sb = blendScore(b, game.blend) * performanceMod(state, b, 1) + (state.rec[b]?.respect || 0) * 0.04;
  const edge = (sa - sb) * 0.55 + carry + noise(rng) * 0.55;
  const pA = logistic(edge);
  const aWins = rng() < pA;
  return { winner: aWins ? a : b, margin: Math.abs(pA - 0.5) * 2 };
}

// The duel. Returns { game, a, b, winner, loser, beats, upset }.
export function playDuel(state, rng, a, b, game = null) {
  game ||= drawGame(state, rng);
  const beats = [];
  let winner;
  if (game.format.startsWith('first-to')) {
    const need = Number(game.format.split('-')[2]);
    const score = { [a]: 0, [b]: 0 };
    let carry = 0;
    while (score[a] < need && score[b] < need) {
      const r = beat(state, rng, game, a, b, carry);
      score[r.winner]++;
      // Momentum: the round's winner carries a little into the next.
      carry = (r.winner === a ? 1 : -1) * 0.15;
      beats.push({ kind: 'round', n: beats.length + 1, winner: r.winner, score: { ...score }, margin: +r.margin.toFixed(2) });
    }
    winner = score[a] >= need ? a : b;
  } else {
    // A race or a last-standing game: three stages, the lead can change.
    let lead = 0;
    for (let i = 1; i <= 3; i++) {
      const r = beat(state, rng, game, a, b);
      lead += (r.winner === a ? 1 : -1) * (0.5 + r.margin);
      beats.push({ kind: game.format === 'race' ? 'stage' : 'hold', n: i, ahead: lead >= 0 ? a : b, margin: +r.margin.toFixed(2) });
    }
    winner = lead >= 0 ? a : b;
    beats.push({ kind: 'finish', winner });
  }
  const loser = winner === a ? b : a;
  // A comeback: the loser led at the halfway point.
  const mid = beats[Math.floor((beats.length - 1) / 2)];
  const comeback = (mid?.winner || mid?.ahead) === loser;
  const upset = arenaGuess(state, loser) - arenaGuess(state, winner) > 1.5;
  for (const n of [a, b]) nudge(state, n, 'energy', -2.6);
  return { game: game.id, gameName: game.name, kind: game.kind, a, b, winner, loser, beats, upset, comeback };
}

// The engine's own guess at who is better in an average game (for "upset").
function arenaGuess(state, n) {
  return S(n, 'physical') * 0.34 + S(n, 'endurance') * 0.22 + S(n, 'mental') * 0.2 + S(n, 'boldness') * 0.12 + S(n, 'temperament') * 0.12;
}

// An injury in a physical game or daily: per player, small, larger when tired.
export function injuryRoll(state, rng, name, physicality) {
  const tired = (10 - (state.mind[name]?.energy ?? 7)) / 10;
  const p = 0.012 * physicality * (1 + tired);
  return rng() < p;
}

