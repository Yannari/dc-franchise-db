// Big Brother strategy primitives. This module deliberately knows nothing about
// Total Drama's tribes, merge, immunity, or tribal council.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const noise = (rng, amount = 1) => (rng() - 0.5) * amount;

function archetype(name) {
  return players.find(player => player.name === name)?.archetype || 'floater';
}

function allianceStrength(a, b) {
  return (gs.namedAlliances || []).reduce((best, alliance) => {
    if (alliance.active !== false && alliance.members?.includes(a) && alliance.members.includes(b)) {
      return Math.max(best, 1 + alliance.members.filter(name => gs.activePlayers.includes(name)).length * 0.15);
    }
    return best;
  }, 0);
}

export function bbThreat(name) {
  const stats = pStats(name);
  const others = (gs.activePlayers || []).filter(other => other !== name);
  const socialPosition = others.length
    ? others.reduce((sum, other) => sum + getBond(name, other), 0) / others.length
    : 0;
  const record = gs.bb?.stats?.[name] || {};
  const compRecord = (record.hohWins || 0) * 0.8 + (record.vetoWins || 0) * 0.55;
  return stats.strategic * 0.27 + stats.social * 0.18 + stats.physical * 0.12
    + stats.endurance * 0.12 + stats.mental * 0.13 + stats.intuition * 0.1
    + socialPosition * 0.22 + compRecord;
}

export function nominationScore(hoh, candidate, rng = Math.random) {
  const stats = pStats(hoh);
  const relationship = getPerceivedBond(hoh, candidate);
  const aligned = allianceStrength(hoh, candidate);
  const candidateThreat = bbThreat(candidate);
  const revenge = Math.max(0, -(getBond(hoh, candidate) || 0));
  const houseState = gs.bb?.house;
  const eventTarget = houseState?.targets?.[hoh]?.target === candidate ? 4 : 0;
  const suspicion = houseState?.suspicion?.[`${hoh}→${candidate}`] || 0;
  return candidateThreat * (0.65 + stats.strategic * 0.045)
    + revenge * 0.75 - relationship * 0.85 - aligned * 2.2
    + eventTarget + suspicion * 0.45 + noise(rng, 1.6);
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
      score: getPerceivedBond(holder, name) * 0.9 + allianceStrength(holder, name) * 2
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
    + allianceStrength(voter, nominee) * 1.4
    - (gs.bb?.house?.targets?.[voter]?.target === nominee ? 3 : 0)
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
  const safety = house.filter(other => other !== name && (getPerceivedBond(name, other) >= 3 || allianceStrength(name, other))).length;
  const liability = safety - enemies + (10 - stats.boldness) * 0.35 + (10 - stats.strategic) * 0.12;
  return { throwChance: clamp(liability / 16, 0, 0.62), enemies, safety };
}
