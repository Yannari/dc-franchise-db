// Big Brother strategy primitives. This module deliberately knows nothing about
// Total Drama's tribes, merge, immunity, or tribal council.
import { gs, players, seasonConfig } from '../core.js';
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

/**
 * Whether the veto gets used, and — the part that was missing — why.
 *
 * The decision came back as 'relationship' or 'leave-nominations', which is a
 * category rather than a reason, so nothing could tell the house WHY somebody
 * did or did not pull a nominee down. Every branch now carries a sentence.
 *
 * The Head of Household holding their own veto is its own case and was not
 * modelled at all. Using it means taking down a person you nominated four days
 * ago and putting up somebody else, which is not a change of heart — it is the
 * backdoor, and it is the only reason to do it. An HOH with no backdoor plan
 * who pulls their own nominee has simply undone their own week.
 */
export function shouldUseVeto(holder, nominees, plan, rng = Math.random, context = {}) {
  if (nominees.includes(holder)) {
    return { use: true, save: holder, reason: 'self',
      why: `${holder} is on the block and holding the only thing that takes them off it.` };
  }

  const hoh = context.hoh || null;
  const stats = pStats(holder);
  const scoreOf = name =>
    getPerceivedBond(holder, name) * 0.9 + bbAllianceStrength(holder, name) * 2
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
      // Does this person actually need saving?
      //
      // A pawn is up to sit beside somebody, and the house knows it. Spending
      // the veto on a houseguest who was never going home wastes the only move
      // you get and crosses the Head of Household for nothing — which is why in
      // the house a pawn usually stays on the block and usually survives. The
      // target is the opposite: leave them up and they are gone on Thursday.
      - (name === plan?.pawn && name !== plan?.target ? 2.8 : 0)
      + (name === plan?.target ? 1.3 : 0)
      + noise(rng, 1.2);

  // Blood on your hands.
  //
  // Using a veto you did not need costs something: you have crossed the Head of
  // Household in public and put somebody else on the block who will know it was
  // you. Without that cost the veto came off the wall 87% of the time, which
  // makes the ceremony a formality — in the house, leaving nominations exactly
  // as they are is an ordinary and often correct week.
  //
  // Nerve decides how much the cost weighs. A bold, strategic houseguest will
  // take the heat; a cautious one finds a reason not to be involved.
  const nerve = (stats.boldness * 0.6 + stats.strategic * 0.4) / 10;
  const blood = (1 - nerve) * 3.1 + (hoh && getPerceivedBond(holder, hoh) >= 3 ? 0.9 : 0);

  const options = nominees.map(name => ({ name, score: scoreOf(name) - blood }))
    .sort((a, b) => b.score - a.score);
  const best = options[0];

  // ── the Head of Household holding their own veto ──
  if (holder === hoh) {
    const backdoor = plan?.backdoorTarget;
    if (backdoor && !nominees.includes(backdoor)) {
      // This was the plan all along: two names up who were never the point.
      const pull = options.sort((a, b) => b.score - a.score)[0].name;
      return { use: true, save: pull, reason: 'backdoor', replacement: backdoor,
        why: `${holder} nominated ${nominees.join(' and ')} to get here. `
          + `Taking ${pull} down puts ${backdoor} up with no time to work the house — `
          + `which was the point of the week.` };
    }
    // A nominee they have since promised the end to is worth undoing a
    // nomination for. Nothing else is.
    const promised = nominees.find(n => {
      const deal = dealBetween(holder, n);
      return deal && sincerityOf(deal, holder) > 0.6;
    });
    if (promised) {
      return { use: true, save: promised, reason: 'own-deal',
        why: `${holder} put ${promised} up and has since shaken on the end with them. `
          + `Leaving them there costs more than the embarrassment of taking them down.` };
    }
    return { use: false, save: null, reason: 'own-nominations',
      why: `${holder} made these nominations four days ago and nothing has changed since. `
        + `Using their own veto would only mean explaining why they were wrong the first time.` };
  }

  // ── anybody else ──
  // The bar for using a veto you did not need.
  //
  // It was 2.2 against scores that routinely run to 5-8, so almost anything
  // cleared it and the veto came off the wall in 77% of the weeks where the
  // holder was not on the block. Leaving nominations alone is an ordinary week
  // in this house, and it should read as a decision rather than as a failure to
  // act. Calibrated by playing seasons, not chosen.
  if (best.score > 5.2) {
    const deal = dealBetween(holder, best.name);
    const why = deal
      ? `${holder} and ${best.name} have a ${tierOf(deal) === 'final-two' ? 'final two' : 'deal about the end'}. `
        + `A promise that does not survive a veto was never a promise.`
      : bbAllianceStrength(holder, best.name) > 0
        ? `${best.name} is one of ${holder}'s people, and ${holder} is not spending a week explaining why they left them up.`
        : `${holder} would rather have ${best.name} in this house than not, and this is the only week that is ${holder}'s to decide.`;
    return { use: true, save: best.name, reason: 'relationship', why };
  }

  const closest = best.name;
  return { use: false, save: null, reason: 'leave-nominations',
    why: `Taking ${closest} down makes an enemy of ${hoh || 'the Head of Household'} and puts somebody `
      + `else on the block who will know exactly who did it. ${holder} decides the block is not their problem.` };
}

export function initialVotePreference(voter, nominees, rng = Math.random) {
  // getBBTarget already reads the plan, so a target on the block is punished
  // here for free. What was missing was the other direction: the person you
  // promised the end to is somebody you actively keep, not merely somebody you
  // are not gunning for.
  // A campaign that landed is a reason to keep somebody.
  //
  // The campaign events already wrote a genuine 'vote' promise when a nominee
  // got through to somebody, and the vote read it only as COMMITMENT — how
  // firmly they held whatever they already wanted. Nothing pointed the ballot
  // at the person who had just talked them round, so a card badged "A VOTE
  // MOVES" could be followed by that vote not moving.
  const promisedTo = nominee => (gs.sideDeals || []).some(d => d.active !== false
    && d.type === 'vote' && d.genuine !== false
    && (d.players || []).includes(voter) && d.players.includes(nominee));

  const score = nominee => {
    const deal = dealBetween(voter, nominee);
    const keep = deal ? (tierOf(deal) === 'final-two' ? 3.6 : 2.2) * sincerityOf(deal, voter) : 0;
    const plan = housePlan(voter);
    return getPerceivedBond(voter, nominee) * 0.9 - bbThreat(nominee) * 0.3
      + bbAllianceStrength(voter, nominee) * 1.4
      - (getBBTarget(voter) === nominee ? 3 : 0)
      + keep
      + (promisedTo(nominee) ? 2.6 : 0)
      + (plan?.shield === nominee ? 1.4 : 0)
      + (plan?.goat === nominee ? 1.1 : 0)
      - (gs.bb?.house?.suspicion?.[`${voter}→${nominee}`] || 0) * 0.25
      + noise(rng, 1);
  };
  const scores = nominees.map(name => ({ name, keepScore: score(name) })).sort((a, b) => a.keepScore - b.keepScore);
  return { evict: scores[0].name, margin: scores[1].keepScore - scores[0].keepScore };
}

/**
 * What the house thinks is going to happen, before it happens.
 *
 * Total Drama models a vote as a set of commitments AND as a set of BELIEFS:
 * every voter carries their own count of who is with them, that count is built
 * from what they perceive rather than what is true, and the gap between the two
 * is where a blindside comes from. A house had the commitments and none of the
 * beliefs, so nobody could walk into a vote wrong.
 *
 * Each voter is asked two things: who are you voting out, and how many people
 * do you think are voting with you. The second is answered off PERCEIVED bonds
 * and alliances — their read of the room — so a houseguest who is badly wrong
 * about who likes them is badly wrong about the count, which is exactly how it
 * goes in the house.
 */
export function buildHouseVotePlans({ ballots = [], nominees = [], hoh = null } = {}) {
  if (!ballots.length || nominees.length < 2) return [];
  const voters = ballots.map(b => b.voter);
  const majority = Math.floor(voters.length / 2) + 1;
  const intent = new Map(ballots.map(b => [b.voter, b.evict]));

  // What ONE voter believes another will do. Not the truth — their read.
  const believesAbout = (voter, other) => {
    if (voter === other) return intent.get(voter);
    // Somebody you are working with, you assume is with you.
    if (bbAllianceStrength(voter, other) > 0) return intent.get(voter);
    if (getPerceivedBond(voter, other) >= 3) return intent.get(voter);
    // Otherwise you guess from how you think they feel about the two of them.
    const [a, b] = nominees;
    const readA = getPerceivedBond(other, a);
    const readB = getPerceivedBond(other, b);
    if (Math.abs(readA - readB) < 0.8) return null;    // too close to call
    return readA < readB ? a : b;
  };

  const actual = {};
  nominees.forEach(n => { actual[n] = ballots.filter(b => b.evict === n).length; });

  return ballots.map(ballot => {
    const target = ballot.evict;
    let believed = 0, unsure = 0;
    for (const other of voters) {
      const read = believesAbout(ballot.voter, other);
      if (read === target) believed++;
      else if (read == null) unsure++;
    }
    const truth = actual[target] || 0;
    return {
      voter: ballot.voter,
      target,
      keeping: nominees.find(n => n !== target) || null,
      believed,
      unsure,
      truth,
      majority,
      // Do they think their side wins?
      confident: believed >= majority,
      // And are they right? This is the number the whole night turns on.
      error: believed - truth,
      wrong: (believed >= majority) !== (truth >= majority),
    };
  });
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

export function shouldThrowHoh(name, house, context = {}) {
  const stats = pStats(name);
  const enemies = house.filter(other => other !== name && getPerceivedBond(name, other) <= -3).length;
  const safety = house.filter(other => other !== name && (getPerceivedBond(name, other) >= 3 || bbAllianceStrength(name, other))).length;
  const liability = safety - enemies + (10 - stats.boldness) * 0.35 + (10 - stats.strategic) * 0.12;

  // Throwing this one is no longer free.
  //
  // Slop comes off the bottom of the Head of Household competition now, and a
  // thrown competition lands you there almost by definition — the throw penalty
  // is several times the size of the random roll. So the cost of staying small
  // for a week is a week of playing the veto hungry, which is worth about two
  // and a half places in a field of twelve and cuts a houseguest's chance of
  // winning anything by roughly seven times.
  //
  // Scaled by how much they need a competition: somebody with enemies stacking
  // up cannot afford to be weak in the veto as well, while somebody safe can
  // still take the week off. Throwing remains a real strategy, it just costs
  // something now.
  // Calibrated, not guessed. Liability lands between about 0.5 and 3.4 across a
  // cast, so a deterrent of 3.2 — which is what this was first written as —
  // drove every houseguest to a flat zero and deleted throwing from the game
  // outright. About one point halves it instead, which is what a real cost
  // looks like: measured, 9.1% of houseguests would throw with no slop on the
  // line and 4.4% will with it.
  const slopLive = seasonConfig.bbHaveNots !== 'off' && (context.type || 'hoh') === 'hoh';
  const slopRisk = slopLive ? 0.9 + enemies * 0.3 : 0;

  return {
    throwChance: clamp((liability - slopRisk) / 16, 0, 0.62),
    enemies, safety, liability, slopRisk,
  };
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
/**
 * Throwing the veto.
 *
 * Only the Head of Household competition could be thrown, which left out the
 * more interesting half of it. The wiki is explicit that the veto gets thrown
 * on purpose — to let it land with somebody who will use it the way the plan
 * needs, and to keep the person throwing it out of the decision entirely.
 *
 * Two reasons somebody drops this one, and they pull in different directions:
 *
 *   BLOOD. Winning the veto when you are not on the block hands you a choice
 *   with no good answer — use it and you cross the Head of Household, leave it
 *   and you cross whoever stays up. A houseguest who would rather not be asked
 *   throws it, and that is a real strategy rather than cowardice.
 *
 *   THE PLAN. Somebody working with the Head of Household on a backdoor wants
 *   the veto used, and wants it used by somebody whose hands are already dirty.
 *   If they are not that person, they get out of the way.
 *
 * Nobody on the block ever throws it. It is the only thing that saves them.
 */
export function shouldThrowVeto(name, context = {}) {
  const nominees = context.nominees || [];
  if (nominees.includes(name)) return { throwChance: 0, reason: 'on the block' };

  const hoh = context.hoh || null;
  const s = pStats(name);
  const plan = housePlan(name);

  // Nerve is what stops you ducking it. Boldness and strategic confidence both
  // make somebody willing to hold a decision nobody wants.
  const nerve = (s.boldness * 0.6 + s.strategic * 0.4) / 10;
  let blood = (1 - nerve) * 0.5;

  // Being close to the Head of Household makes the decision worse, not better:
  // you are the one who would have to say no to them.
  if (hoh && getPerceivedBond(name, hoh) >= 3) blood += 0.12;
  // Being close to somebody on the block makes it worse from the other side.
  if (nominees.some(n => getPerceivedBond(name, n) >= 3)) blood += 0.12;
  // Somebody with a target of their own wants the week to stay pointed at it.
  if (plan?.targets?.length && !nominees.includes(plan.targets[0])) blood += 0.06;

  const reason = blood > 0.34
    ? 'would rather not be the one holding the decision'
    : 'wants it';
  return { throwChance: clamp(blood, 0, 0.5), reason, nerve };
}

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
