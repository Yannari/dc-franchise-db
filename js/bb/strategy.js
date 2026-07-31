// Big Brother strategy primitives. This module deliberately knows nothing about
// Total Drama's tribes, merge, immunity, or tribal council.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { bbAllianceStrength, bbHeat, bbThreat, getBBTarget } from './shared-strategy.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const noise = (rng, amount = 1) => (rng() - 0.5) * amount;

function archetype(name) {
  return players.find(player => player.name === name)?.archetype || 'floater';
}

export { bbThreat } from './shared-strategy.js';

export function nominationScore(hoh, candidate, rng = Math.random) {
  const stats = pStats(hoh);
  const revenge = Math.max(0, -(getBond(hoh, candidate) || 0));
  const heat = bbHeat(hoh, candidate);
  const threatAdjustment = heat.components.threat * (stats.strategic * 0.045 - 0.35);
  return heat.total + threatAdjustment + revenge * 0.75 + noise(rng, 1.6);
}

export function chooseNominationPlan(hoh, house, rng = Math.random) {
  const eligible = house.filter(name => name !== hoh);
  if (eligible.length < 2) throw new Error('A Big Brother nomination requires at least two eligible houseguests.');
  const ranked = eligible
    .map(name => ({ name, score: nominationScore(hoh, name, rng) }))
    .sort((a, b) => b.score - a.score);
  const hohStats = pStats(hoh);
  const primary = ranked[0];
  const backdoorChance = clamp((hohStats.strategic * 0.07 + hohStats.boldness * 0.04)
    * clamp((primary.score - ranked[Math.min(2, ranked.length - 1)].score + 3) / 6, 0.25, 1), 0.08, 0.72);
  const useBackdoor = eligible.length >= 5 && rng() < backdoorChance;
  const pawnPool = ranked.slice(1).sort((a, b) => {
    const aPawn = getPerceivedBond(hoh, a.name) - bbThreat(a.name) * 0.35;
    const bPawn = getPerceivedBond(hoh, b.name) - bbThreat(b.name) * 0.35;
    return bPawn - aPawn;
  });
  const pawn = pawnPool[0]?.name || ranked[1].name;
  const initialTarget = useBackdoor ? (ranked.find(entry => entry.name !== primary.name && entry.name !== pawn)?.name || ranked[1].name) : primary.name;
  return {
    nominees: [initialTarget, pawn],
    target: primary.name,
    pawn,
    backdoorTarget: useBackdoor ? primary.name : null,
    rankings: ranked,
  };
}

export function chooseReplacement(hoh, house, protectedNames, plan, rng = Math.random) {
  const eligible = house.filter(name => !protectedNames.includes(name));
  if (!eligible.length) return null;
  if (plan.backdoorTarget && eligible.includes(plan.backdoorTarget)) return plan.backdoorTarget;
  return eligible.sort((a, b) => nominationScore(hoh, b, rng) - nominationScore(hoh, a, rng))[0];
}

export function shouldUseVeto(holder, nominees, plan, rng = Math.random) {
  if (nominees.includes(holder)) return { use: true, save: holder, reason: 'self' };
  const options = nominees.map(name => {
    const stats = pStats(holder);
    return {
      name,
      score: getPerceivedBond(holder, name) * 0.9 + bbAllianceStrength(holder, name) * 2
        + stats.loyalty * 0.18 - bbThreat(name) * 0.18 + noise(rng, 1.2),
    };
  }).sort((a, b) => b.score - a.score);
  const best = options[0];
  return best.score > 2.2
    ? { use: true, save: best.name, reason: 'relationship' }
    : { use: false, save: null, reason: 'leave-nominations' };
}

export function initialVotePreference(voter, nominees, rng = Math.random) {
  const score = nominee => getPerceivedBond(voter, nominee) * 0.9 - bbThreat(nominee) * 0.3
    + bbAllianceStrength(voter, nominee) * 1.4
    - (getBBTarget(voter) === nominee ? 3 : 0)
    - (gs.bb?.house?.suspicion?.[`${voter}→${nominee}`] || 0) * 0.25
    + noise(rng, 1);
  const scores = nominees.map(name => ({ name, keepScore: score(name) })).sort((a, b) => a.keepScore - b.keepScore);
  return { evict: scores[0].name, margin: scores[1].keepScore - scores[0].keepScore };
}

export function campaignAttempt(nominee, voter, opponent, rng = Math.random) {
  const stats = pStats(nominee);
  const voterStats = pStats(voter);
  const relationship = getPerceivedBond(voter, nominee) - getPerceivedBond(voter, opponent);
  const persuasion = stats.social * 0.42 + stats.strategic * 0.28 + stats.intuition * 0.12
    + relationship * 0.38 + noise(rng, 4);
  const resistance = voterStats.loyalty * 0.22 + voterStats.intuition * 0.24 + voterStats.strategic * 0.18;
  const success = persuasion > resistance;
  return { nominee, voter, success, strength: clamp((persuasion - resistance) / 3, -2, 2), archetype: archetype(nominee) };
}

export function shouldThrowHoh(name, house) {
  const stats = pStats(name);
  const enemies = house.filter(other => other !== name && getPerceivedBond(name, other) <= -3).length;
  const safety = house.filter(other => other !== name && (getPerceivedBond(name, other) >= 3 || bbAllianceStrength(name, other))).length;
  const liability = safety - enemies + (10 - stats.boldness) * 0.35 + (10 - stats.strategic) * 0.12;
  return { throwChance: clamp(liability / 16, 0, 0.62), enemies, safety };
}

/**
 * How badly somebody needs to win this one.
 *
 * The simulator modelled every reason to LOSE a competition — throwing it to
 * stay small, being on slop, simply being worse at it — and no reason at all
 * to want it. A nominee facing eviction on Thursday played exactly as hard as
 * somebody with nothing at stake, which made the veto a coin toss dressed as a
 * competition.
 *
 * Danger is read from the game rather than from a flag: sitting on the block
 * is the obvious one, but so is having no allies left and having enemies who
 * outnumber the people who would keep you. Nerve converts that danger into
 * performance — a bold houseguest rises to it, a fragile one is just as
 * frightened and does not play any better for it.
 *
 * Deliberately smaller than the gap between a strong and a weak player at the
 * relevant stat: it decides close competitions, it does not overturn the field.
 */
export function gunningFor(name, context = {}, rng = Math.random) {
  const nominees = context.nominees || [];
  const house = context.house || [];
  const stats = pStats(name);
  const onTheBlock = nominees.includes(name);

  // The veto is the only thing that can save a nominee, so it is worth most.
  const stake = onTheBlock ? (context.type === 'veto' || context.type === 'arena' ? 1 : 0.55) : 0;

  // Nobody left to hide behind: exposure counts even when off the block.
  const { enemies = 0, safety = 0 } = typeof shouldThrowHoh === 'function' && house.length
    ? shouldThrowHoh(name, house) : {};
  const exposed = Math.max(0, enemies - safety) / Math.max(4, house.length);

  const danger = Math.min(1, stake + exposed * 0.8);
  if (danger <= 0) return { bonus: 0, reason: null };

  // Nerve is what turns fear into a performance.
  const nerve = 0.45 + (stats.boldness / 10) * 0.75 + (stats.temperament / 10) * 0.3;
  // Calibrated by playing 275 weeks: with no motivation a nominee won the
  // veto 33.5% of the time, which is exactly the random share of a six-player
  // field containing two nominees — proof it was doing nothing at all. At this
  // scale it is 46.5%: needing it matters, and the house can still take it.
  const bonus = danger * nerve * (0.45 + rng() * 0.45);
  return {
    bonus,
    reason: onTheBlock ? (stake === 1 ? 'playing for their life' : 'on the block') : 'no cover left',
  };
}
