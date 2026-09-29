// ══════════════════════════════════════════════════════════════════════
// ci/games.js — the Circle's games (spec §13): which one, and how it plays
// ══════════════════════════════════════════════════════════════════════
//
// A game is data (games-data.js); one runner per family plays it. Every
// answer is public, and every answer has a consequence — "we want everyone
// in everyone's business, so they'll all know how each other voted" (the
// host, 1×01).
import { GAMES } from './games-data.js';
import { rel } from './state.js';
import { attractionOk } from './chat.js';

/** Mean suspicion in the room, read from beliefs that already exist. */
function roomSuspicion(state) {
  const vals = [];
  for (const obs of state.active) {
    for (const t of state.active) {
      const b = state.beliefs[obs]?.[t];
      if (b && obs !== t) vals.push(1 - b.real);
    }
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.2;
}

function mutualSpark(state) {
  const a = state.active;
  return a.some((x, i) => a.slice(i + 1).some(y => attractionOk(state, x, y) && attractionOk(state, y, x)
    && rel(x, y, 'attraction') > 3 && rel(y, x, 'attraction') > 3));
}

/** Can this game be played by the room as it is today? */
export function playable(state, game) {
  const n = state.active.length;
  if (n < 3) return false;
  if (game.family === 'team') return n >= 6;
  if (game.family === 'flirt') return mutualSpark(state);
  return true;
}

/**
 * Today's game: never one already played; a `learn` game on day one; catfish
 * tests when the room is suspicious; divisive games late; never the same
 * purpose three times running.
 */
export function pickGame(state, rng, { days = 13 } = {}) {
  const played = (state.gamesPlayed ||= []);
  const last = played.slice(-2).map(id => GAMES.find(g => g.id === id)?.purpose);
  const susp = roomSuspicion(state);
  const options = GAMES.filter(g => !played.includes(g.id) && playable(state, g))
    .filter(g => state.day > 1 || g.purpose === 'learn')
    .filter(g => !(last.length === 2 && last[0] === last[1] && g.purpose === last[0]));
  const weighted = options.map(g => {
    let w = 1;
    if (g.purpose === 'learn' && state.day <= 3) w *= 3;
    if (g.purpose === 'catfish') w *= 1 + susp * 3;
    if (g.purpose === 'divide' && state.day > days * 2 / 3) w *= 2;
    if (g.purpose === last.at(-1)) w *= 0.3;
    return [g, w];
  });
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [g, w] of weighted) {
    if ((r -= w) <= 0) { played.push(g.id); return g; }
  }
  const g = weighted.at(-1)?.[0] || null;
  if (g) played.push(g.id);
  return g;
}
