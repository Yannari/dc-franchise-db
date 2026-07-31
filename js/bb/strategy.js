// Big Brother strategy primitives. This module deliberately knows nothing about
// Total Drama's tribes, merge, immunity, or tribal council.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { bbAllianceStrength, bbHeat, bbThreat, getBBTarget } from './shared-strategy.js';
import { housePlan } from './plans.js';
import { dealBetween, sincerityOf, tierOf } from './deals.js';

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
  return heat.total + threatAdjustment + revenge * 0.75
    + nominationPlanPull(hoh, candidate) + noise(rng, 1.6);
}

/**
 * What the Head of Household's own plan does to a name.
 *
 * Nominations used to be computed from heat and threat alone, which meant the
 * plan a houseguest had been building for six weeks had no bearing on the one
 * week they could act on it. A shield is the sharpest case: the whole reason to
 * keep a bigger player in the house is that they absorb the shots, and an HOH
 * who nominates their own shield has not understood their own strategy.
 *
 * Proportional to how well this person plans — a reactive player barely
 * consults a plan, an architect is not doing anything else.
 */
export function nominationPlanPull(hoh, candidate) {
  const plan = housePlan(hoh);
  if (!plan) return 0;
  const weight = clamp(pStats(hoh).strategic / 10, 0.35, 1);
  let pull = 0;
  const rank = plan.targets?.indexOf(candidate) ?? -1;
  if (rank === 0) pull += 3.4;
  else if (rank > 0) pull += 1.5;
  if (plan.revenge?.includes(candidate)) pull += 1.8;
  // The people you are not putting up.
  //
  // The shield discount has to be large, and it is the one number here that
  // cannot be timid. A shield is BY DEFINITION the biggest threat in the room,
  // so it already carries the maximum heat and threat this function is adding
  // up — a modest discount just loses to the very thing that made them a shield
  // in the first place, and Heads of Household went on nominating the person
  // they were hiding behind.
  if (plan.shield === candidate) pull -= 7;
  if (plan.goat === candidate) pull -= 2.2;
  if (plan.preferredCore?.includes(candidate)) pull -= 2.4;
  if (plan.backupAllies?.includes(candidate)) pull -= 1.1;
  // A promise about the end is the strongest reason there is not to do this.
  const deal = dealBetween(hoh, candidate);
  if (deal) pull -= (tierOf(deal) === 'final-two' ? 4.5 : 3) * sincerityOf(deal, hoh);
  return pull * weight;
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
  // A pawn is somebody you are reasonably confident survives the week and does
  // not hold it against you. Somebody you have already read as beatable at the
  // end is the obvious chair, and somebody you shook hands with is not.
  const plan = housePlan(hoh);
  const pawnFit = name => {
    let fit = getPerceivedBond(hoh, name) - bbThreat(name) * 0.35;
    if (plan?.goat === name) fit += 1.6;
    if (plan?.shield === name) fit -= 3;
    if (dealBetween(hoh, name)) fit -= 2.5;
    if (plan?.preferredCore?.includes(name)) fit -= 1.2;
    return fit;
  };
  const pawnPool = ranked.slice(1).sort((a, b) => pawnFit(b.name) - pawnFit(a.name));
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
        + stats.loyalty * 0.18 - bbThreat(name) * 0.18
        // The one you promised the end to comes down first. A final two that
        // does not survive contact with a veto was never a final two.
        + (() => {
          const deal = dealBetween(holder, name);
          if (!deal) return 0;
          return (tierOf(deal) === 'final-two' ? 4.2 : 2.6) * sincerityOf(deal, holder);
        })()
        + (housePlan(holder)?.shield === name ? 1.6 : 0)
        - (housePlan(holder)?.targets?.[0] === name ? 2.4 : 0)
        + noise(rng, 1.2),
    };
  }).sort((a, b) => b.score - a.score);
  const best = options[0];
  return best.score > 2.2
    ? { use: true, save: best.name, reason: 'relationship' }
    : { use: false, save: null, reason: 'leave-nominations' };
}

export function initialVotePreference(voter, nominees, rng = Math.random) {
  // getBBTarget already reads the plan, so a target on the block is punished
  // here for free. What was missing was the other direction: the person you
  // promised the end to is somebody you actively keep, not merely somebody you
  // are not gunning for.
  const score = nominee => {
    const deal = dealBetween(voter, nominee);
    const keep = deal ? (tierOf(deal) === 'final-two' ? 3.6 : 2.2) * sincerityOf(deal, voter) : 0;
    const plan = housePlan(voter);
    return getPerceivedBond(voter, nominee) * 0.9 - bbThreat(nominee) * 0.3
      + bbAllianceStrength(voter, nominee) * 1.4
      - (getBBTarget(voter) === nominee ? 3 : 0)
      + keep
      + (plan?.shield === nominee ? 1.4 : 0)
      + (plan?.goat === nominee ? 1.1 : 0)
      - (gs.bb?.house?.suspicion?.[`${voter}→${nominee}`] || 0) * 0.25
      + noise(rng, 1);
  };
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

/**
 * How firmly a vote is actually committed.
 *
 * Total Drama models a vote as a COMMITMENT — a preference, a plan that may
 * override it, and a strength describing how hard it would be to move. A house
 * had only preference and persuasion, which meant a vote somebody had promised
 * in writing weighed exactly the same as one they had never mentioned. Deals
 * were already being written by the campaign and scheme events and the vote
 * simply never read them.
 *
 * Strength is 0..1 and comes from four things the game already knows: how
 * clear the voter's own preference was, whether they shook on it, whether the
 * person they are keeping is an ally, and how loyal they are by nature.
 */
export function houseVoteCommitment(ballot, nominees) {
  const voter = ballot.voter;
  const keeping = nominees.find(n => n !== ballot.evict) || null;
  const s = pStats(voter);

  // A wide margin means they were never really torn.
  const clarity = Math.min(1, Math.abs(Number(ballot.margin) || 0) / 4);

  const promised = (gs.sideDeals || []).some(deal => deal.active !== false
    && deal.type === 'vote' && deal.players?.includes(voter)
    && (deal.players.includes(keeping) || deal.players.includes(ballot.evict)));

  const allied = keeping ? bbAllianceStrength(voter, keeping) > 0 : false;

  // A promise about the end outranks a promise about the week, and outranks
  // the alliance too. This is the vote where somebody's real game becomes
  // visible: an alliance can whip six people and still lose the one who is
  // quietly taking somebody else to the final two.
  const endgame = keeping ? dealBetween(voter, keeping) : null;
  const againstDeal = dealBetween(voter, ballot.evict);
  const endgameHold = endgame
    ? (tierOf(endgame) === 'final-two' ? 0.42 : 0.26) * sincerityOf(endgame, voter) : 0;
  // Being asked to evict the person you promised the end to is the hardest a
  // vote gets. They are not immovable — but moving them costs something.
  const cutting = againstDeal ? sincerityOf(againstDeal, voter) : 0;

  const strength = clarity * 0.45
    + (promised ? 0.3 : 0)
    + (allied ? 0.22 : 0)
    + endgameHold
    + (s.loyalty / 10) * 0.25;
  return {
    voter, keeping, strength: Math.max(0, Math.min(1, strength)), promised, allied,
    endgameDeal: endgame ? { with: keeping, tier: tierOf(endgame) } : null,
    cuttingPartner: cutting > 0.45 ? ballot.evict : null,
  };
}

/**
 * An alliance votes together, or discovers that it does not.
 *
 * Alliances form properly in a house now and then every member decided the
 * vote alone and happened to agree. A bloc picks the nominee who is NOT one of
 * theirs and brings along the members who were not firmly committed elsewhere;
 * anybody who was stays where they are, which is how a bloc finds out it has a
 * problem.
 *
 * Returns the moves it made so the week can narrate them.
 */
export function applyAllianceVoteBloc({ ballots = [], nominees = [], commitments = new Map() } = {}) {
  const moves = [];
  const alliances = (gs.namedAlliances || []).filter(a => a.active !== false && Array.isArray(a.members));
  for (const alliance of alliances) {
    const inside = alliance.members.filter(m => ballots.some(b => b.voter === m));
    if (inside.length < 2) continue;
    // The bloc protects its own: it targets a nominee who is not a member.
    const outsider = nominees.find(n => !alliance.members.includes(n));
    if (!outsider) continue;
    for (const voter of inside) {
      const ballot = ballots.find(b => b.voter === voter);
      if (!ballot || ballot.evict === outsider) continue;
      const c = commitments.get(voter);
      // A firm commitment elsewhere beats the bloc — that is a real crack.
      if (c && c.strength >= 0.6) continue;
      ballot.evict = outsider;
      ballot.changed = true;
      ballot.blocMove = alliance.name || 'an alliance';
      moves.push({ voter, target: outsider, alliance: alliance.name || 'an alliance' });
    }
  }
  return moves;
}

/**
 * The bandwagon.
 *
 * The thing a house does that nothing here modelled: once the vote is clearly
 * going one way, the people who are not committed stop being on the wrong side
 * of it. Total Drama's fringe consolidation cannot be reused directly — it
 * needs four or more distinct targets and a house vote has exactly two — so
 * this is the same idea in the shape the format actually has.
 *
 * Only the weakly committed move, only toward a lead that already exists, and
 * never far enough to make every vote unanimous.
 */
export function applyHouseBandwagon({ ballots = [], nominees = [], commitments = new Map(), rng = Math.random } = {}) {
  if (nominees.length !== 2 || ballots.length < 4) return [];
  const count = name => ballots.filter(b => b.evict === name).length;
  const [a, b] = nominees;
  const lead = count(a) - count(b);
  if (Math.abs(lead) < 2) return [];          // no lead worth joining
  const leader = lead > 0 ? a : b;
  const trailing = ballots.filter(ballot => ballot.evict !== leader);
  // Somebody always stays with the sinking side; a unanimous house is boring
  // and, more importantly, hides who was actually loyal.
  const movable = Math.max(0, Math.floor(trailing.length * 0.6));
  const moves = [];
  for (const ballot of trailing.sort((x, y) =>
    (commitments.get(x.voter)?.strength || 0) - (commitments.get(y.voter)?.strength || 0))) {
    if (moves.length >= movable) break;
    const strength = commitments.get(ballot.voter)?.strength ?? 0.5;
    // The bigger the lead and the looser the commitment, the more likely.
    const chance = Math.min(0.8, (Math.abs(lead) / ballots.length) * 1.6 * (1 - strength));
    if (rng() >= chance) continue;
    ballot.evict = leader;
    ballot.changed = true;
    ballot.bandwagon = true;
    moves.push({ voter: ballot.voter, target: leader });
  }
  return moves;
}
