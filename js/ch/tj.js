// ══════════════════════════════════════════════════════════════════════
// ch/tj.js — TJ Maxx, and the night before the Arena
// ══════════════════════════════════════════════════════════════════════
//
// TJ is the host, not a player, but on this show the host is a force: he has
// an opinion of everybody (state.tj: respect for fighters, contempt for
// quitters), and when he has to come into the villa because somebody threw a
// punch, the house is quieter for a while. Everything here changes something.
//
// The night before an elimination is the show's other staple: the two going
// in, the friend who sits up with one of them, the confrontation by the pool,
// and the one nobody comes to see.
import { getBond, addBond } from '../bonds.js';
import { S, addScene } from './state.js';
import { nudge } from './mind.js';
import { trustOf, grudgeOf, remember, intimidated } from './rel.js';
import { allianceOf } from './alliances.js';

// ── the night before ─────────────────────────────────────────────────
// The day of the Arena, before it. The one going in talks the pick through with the friend they trust most
// (never saying it: the call-out is said at the Arena), and the people who could be picked wait together.
// A volunteer named their target at the vote, so there is nothing to guess.
export function pickDay(state, rng, match) {
  const { a, b, pool = [] } = match;
  if (match.volunteer || !state.active.includes(a)) return;
  const open = pool.filter(n => state.active.includes(n));
  // the two names the friend hears: the real one and the one a would most like gone after it, in either order
  const other = open.filter(n => n !== b).sort((x, y) => getBond(a, x) - getBond(a, y))[0];
  if (other) {
    const options = rng() < 0.5 ? [b, other] : [other, b];
    const friend = state.active.filter(x => x !== a && !open.includes(x)).sort((x, y) => trustOf(y, a) - trustOf(x, a))[0];
    if (friend) {
      addBond(friend, a, 0.4);
      addScene(state, 'pick-talk', [a, friend], { options }, [a, friend], 'private');
    }
  }
  // the ones who might be picked, the ones who are closest to each other, waiting it out
  const worried = [...open].sort((x, y) => getBond(a, x) - getBond(a, y)).slice(0, 4);
  if (worried.length >= 2) {
    const [p, ...rest] = worried;
    const with_ = rest.sort((x, y) => getBond(p, y) - getBond(p, x)).slice(0, 2);
    const who = [p, ...with_];
    for (const x of who) for (const y of who) if (x < y) addBond(x, y, 0.3);
    addScene(state, 'pick-guess', who, { by: a }, who, 'private');
  }
}

export function arenaEve(state, rng, match) {
  // a was voted in (or volunteered); b is who a means to call out at the Arena tomorrow. Nobody but a
  // knows that yet (the call-out is said at the Arena), so only a gets the night before. A volunteer
  // named a target at the vote, so that target already knows.
  const { a, b } = match;
  const out = { pep: [], alone: [], confront: null };
  for (const who of match.volunteer ? [a, b] : [a]) {
    // The friend who sits up with them.
    const friend = state.active.filter(x => x !== a && x !== b)
      .sort((x, y) => trustOf(y, who) - trustOf(x, who))[0];
    if (friend && trustOf(friend, who) > 1.5) {
      addBond(friend, who, 0.7);
      remember(who, friend, 'was-there', 1);
      nudge(state, who, 'confidence', 0.6);
      nudge(state, who, 'morale', 0.4);
      out.pep.push({ who, friend });
      addScene(state, 'arena-eve-pep', [friend, who], {}, [friend, who], 'beach');
    } else {
      // Nobody came.
      nudge(state, who, 'morale', -0.6);
      out.alone.push(who);
      addScene(state, 'arena-eve-alone', [who], {}, [who], 'confessional');
    }
  }
  // The one who has the bad feeling it is them goes to ask (b can tell from how a looks at them).
  const heat = grudgeOf(b, a) + S(b, 'boldness') * 0.2 - S(b, 'temperament') * 0.1;
  if (rng() < Math.min(0.75, Math.max(0.05, heat * 0.12))) {
    const won = S(b, 'boldness') + rng() * 4 > S(a, 'temperament') + rng() * 4;
    intimidated(won ? b : a, won ? a : b, 0.6);
    nudge(state, won ? a : b, 'confidence', -0.4);
    addBond(a, b, -0.6);
    out.confront = { from: b, at: a, rattled: won ? a : b };
    addScene(state, 'arena-eve-confront', [b, a], { rattled: won ? a : b }, state.active, 'pool');
  }
  return out;
}

// Calling out an ally's friend costs inside the alliance: when the house hears it, at the Arena.
export function calloutCost(state, a, b) {
  const al = allianceOf(state, a);
  if (al) for (const m of al.members) {
    if (m === a || m === b || !state.active.includes(m)) continue;
    if (getBond(m, b) >= 4) { addBond(m, a, -0.8); remember(m, a, 'went-after-my-friend', 1.2); }
  }
}

// ── TJ comes into the villa ──────────────────────────────────────────
// After a disqualification TJ gathers the house and lays down the law: the
// next nights out are quieter (party.js reads state.tjWarning), and the house
// takes a side on the one who went.
export function tjLaysDownTheLaw(state, gone, victim) {
  state.tjWarning = state.ep;
  for (const n of state.active) {
    nudge(state, n, 'paranoia', 0.3);
    if (getBond(n, gone) >= 3 && victim && state.active.includes(victim)) addBond(n, victim, -0.5);
  }
  addScene(state, 'tj-house-meeting', [gone, victim].filter(Boolean), { gone, victim }, state.active, 'villa');
}

// ── TJ at the Arena ──────────────────────────────────────────────────
// His read of a duel: a comeback or an upset earns his respect, a walkover
// earns the winner a nod and the loser nothing. Recorded on the scene for the
// dialogue layer; his opinion moves on the record.
export function tjVerdict(state, duel) {
  const { winner, loser } = duel;
  const verdict = duel.comeback ? 'comeback' : duel.upset ? 'upset' : 'walkover';
  state.tj[winner] = (state.tj[winner] || 0) + (verdict === 'walkover' ? 0.3 : 1);
  if (verdict !== 'walkover') state.tj[loser] = (state.tj[loser] || 0) + 0.3;   // went down fighting
  return verdict;
}
