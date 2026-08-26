// ══════════════════════════════════════════════════════════════════════
// tr/headless.js — a whole season, with no UI and no screens
// ══════════════════════════════════════════════════════════════════════
//
// The point of this file is measurement. A social deduction engine can pass
// every unit test it has and still produce a room that never works anything
// out, because "did the belief update" and "did the room find the Traitors" are
// different questions and only the second one matters.
import { gs, setGs } from '../core.js';
import { initTraitorsState } from './state.js';
import { resetKnowledge } from '../knowledge.js';
import { setBond } from '../bonds.js';
import { selectTraitors, recordAlignment, livingTraitors, livingFaithfuls } from './roles.js';
import { seedTraitorKnowledge, ballotEvidence } from './deduction.js';
import { runRoundTable } from './roundtable.js';

function rngFor(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * A cast that has already met each other.
 *
 * MEASUREMENT FIXTURE, NOT A SOCIAL MODEL. It exists because the harness used
 * to open with `bonds: {}` and nothing ever wrote to it, so getBond() returned
 * 0 for every pair in every season — which made bondResistance() exactly 1.0
 * and broadcast()'s trust term the constant 0.55 in every number this plan has
 * ever reported. Two of the three social mechanisms the design rests on ("a
 * well-liked Traitor survives a table the evidence should have lost them", and
 * "the same true name lands or dies depending on whose mouth it comes from")
 * were inert in all of them. A calibration run on an engine with two of its
 * three levers pinned at neutral is not a calibration of that engine.
 *
 * So: a plain spread of warm and cold relationships, drawn from a stream of its
 * own so it cannot shift the game's own draws, and deterministic in the season
 * seed like everything else here. Roughly a fifth of pairs like each other and
 * an eighth do not, which puts most people in three or four warm relationships
 * and two or three hostile ones in a cast of twenty. It is not trying to be a
 * pre-season; it is trying to stop the two levers being measured at zero.
 */
function _seedStartingBonds(cast, seed) {
  const rng = rngFor((seed * 2654435761) >>> 0 || 7);
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const roll = rng();
      if (roll < 0.18) setBond(cast[i], cast[j], 2 + Math.floor(rng() * 7));        // +2..+8
      else if (roll < 0.30) setBond(cast[i], cast[j], -2 - Math.floor(rng() * 6));  // -2..-7
      else rng();   // burn a draw either way, so the stream does not depend on the branch
    }
  }
}

/**
 * PLACEHOLDER. Plan 3 deletes this.
 *
 * A real murder is the Traitors arguing in the turret about who the table
 * cannot remove for them. This is a coin flip. It is here so the cast shrinks
 * at roughly the rate the format shrinks it — a season of pure banishment runs
 * seventeen rounds and measures a game nobody plays — and it deliberately
 * generates NO evidence, so nothing calibrated here depends on it.
 */
function _placeholderMurder(ep, rng) {
  const targets = livingFaithfuls(ep);
  if (!targets.length) return null;
  const victim = targets[Math.floor(rng() * targets.length)];
  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== victim);
  return victim;
}

/** Play one season. Returns the record and enough log to measure it. */
export function playTraitorsSeason({ cast, traitorCount = 3, seed = 1, maxRounds = 40 } = {}) {
  const rng = rngFor(seed);
  // gs is null until a season exists (js/core.js), so the harness creates one.
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  _seedStartingBonds(cast, seed);

  const traitors = selectTraitors(cast, { traitorCount }, rng);
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);

  const log = [];
  let ep = 1;
  // The format's own rule: no banishment on the first night, so the Traitors
  // get one round to become a faction before the hunt starts.
  const firstMurder = _placeholderMurder(ep, rng);
  log.push({ ep, banished: null, wasTraitor: null, murdered: firstMurder });

  while (ep++ < maxRounds) {
    const alive = gs.activePlayers || [];
    const tr = livingTraitors(ep).length;
    const fa = livingFaithfuls(ep).length;
    if (!tr || alive.length <= 3 || fa <= tr) break;

    ballotEvidence(ep, rng);
    const r = runRoundTable(ep, rng);
    if (!r) break;   // an empty castle: nothing left to banish
    const murdered = livingTraitors(ep).length ? _placeholderMurder(ep, rng) : null;
    // aliveAtVote/traitorsAtVote are the population as it stood when the ballots
    // were cast, and they are DATA, not behaviour — nothing in the engine reads
    // them. They exist because the null hypothesis for a banishment is not a
    // constant: the murder only ever removes Faithfuls, so Traitor density
    // climbs monotonically all season and a late banishment is a likelier
    // Traitor hit for reasons that have nothing to do with deduction. Without
    // these two numbers there is no way to tell a room that learned something
    // from a room that simply ran out of Faithfuls.
    log.push({ ep, banished: r.banished, wasTraitor: r.wasTraitor, murdered,
      alive: alive.length, aliveAtVote: alive.length, traitorsAtVote: tr });
  }

  const survivingTraitors = livingTraitors(ep);
  return {
    traitors,
    log,
    rounds: gs.tr.rounds,
    survivors: [...(gs.activePlayers || [])],
    winner: survivingTraitors.length ? 'traitors' : 'faithfuls',
  };
}
