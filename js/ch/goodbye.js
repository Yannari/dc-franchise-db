// ══════════════════════════════════════════════════════════════════════
// ch/goodbye.js — the goodbye at the Arena
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "can we have better goodbye its so quick (is it like that in the real show?)". It is
// not: on the show the one who lost gets their moment before the gate. TJ asks for last words, the friends in
// the stand come down for a hug, and sometimes the one leaving takes a parting shot at whoever put them there,
// which the house hears and the friends take with them. Then the exit interview plays as they walk out.
//
// Consequences: the friends feel it; a parting shot points the friends at its target and puts the target on
// edge; a gracious exit (no shot, no bad blood with the winner) is liked by the fans.
import { gs } from '../core.js';
import { getBond } from '../bonds.js';
import { S, addScene } from './state.js';
import { nudge } from './mind.js';
import { remember, resentOf } from './rel.js';

const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };

/**
 * Before the loser leaves the Arena. `culprits` are the people who put them there: the voters when they were
 * voted in, the caller when they were called out. Called while the loser is still in state.active.
 */
export function arenaGoodbye(state, rng, { loser, winner, culprits = [], how = 'voted', leaving = [], winners = [] }) {
  // (a Pairs season: the partner going home too is not a friend in the stand, and neither is the other winner; read
  // 2026-10-19, Ivy came down from the stand to hug Ezekiel, and then Ezekiel ran down to Ivy, both on their way out)
  const out = new Set([loser, winner, ...leaving, ...winners]);
  const friends = state.active.filter(n => !out.has(n) && getBond(loser, n) >= 2.5)
    .sort((x, y) => getBond(loser, y) - getBond(loser, x)).slice(0, 2);
  // the parting shot: the culprit they hold the most against, if the nerve and the grudge are there
  const pool = culprits.filter(c => c !== loser && state.active.includes(c));
  const held = c => resentOf(loser, c) + Math.max(0, -getBond(loser, c)) * 0.5;
  const target = [...pool].sort((x, y) => held(y) - held(x))[0] || null;
  const p = target ? Math.min(0.8, Math.max(0, (S(loser, 'boldness') * 0.4 + held(target) * 0.6 + (10 - S(loser, 'temperament')) * 0.2 - 3) / 6)) : 0;
  const shot = target && rng() < p ? target : null;
  for (const f of friends) {
    nudge(state, f, 'morale', -0.5 - getBond(loser, f) * 0.05);
    if (shot && shot !== f) remember(f, shot, 'eliminated-ally', 0.5, { ally: loser, said: true });
  }
  if (shot) { nudge(state, shot, 'paranoia', 0.5); pop(shot, -0.3); pop(loser, 0.2); }
  else if (getBond(loser, winner) >= 0) pop(loser, 0.5);
  addScene(state, 'arena-goodbye', [loser, ...friends], { loser, winner, friends, shot, how, gracious: !shot && getBond(loser, winner) >= 0 },
    state.active, 'arena');
  return { friends, shot };
}
