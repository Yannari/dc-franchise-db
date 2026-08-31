// The channel two coaches on the same tribe need beyond poaching each
// other's protégés. Neither can vote, so nothing here is enforced by a
// ballot — it is enforced by bonds, by session targeting, and by the one
// targeting hook a coach already has (`_coachTargetDanger` in alliances.js).
//
// Three channels, per docs/superpowers/specs/2026-08-26-coaches-twist-design.md
// "Coach Against Coach":
//   - non-aggression — neither courts the other's strong protégés
//   - trade          — swap standing over two contestants, one each way
//   - the-fall       — one coach agrees to be the next target, the other
//                      commits to protecting their protégés for it
//
// Whether a coach offers, accepts or breaks one of these is read off
// coach-agenda.js's `agendaMix`, never off a bare archetype check: a Control
// coach deals to consolidate (trade), a Support coach deals honestly
// (non-aggression), a Survive coach deals from fear (the-fall), and a
// Disrupt coach is the one who walks away from an agreement already struck —
// disruption for its own sake, not a rational break.
import { gs, players, seasonConfig } from './core.js';
import { pStats } from './players.js';
import { addBond, getBond } from './bonds.js';
import { coachesOf } from './coaches.js';
import { agendaMix } from './coach-agenda.js';
import { showWords } from './shows.js';

const clamp01 = n => Math.max(0, Math.min(1, n));
const archOf = name => players.find(p => p.name === name)?.archetype;
const pick = (arr, roll) => arr[Math.min(arr.length - 1, Math.floor(roll() * arr.length))];

/** Mirrors coach-episode.js's own vulnerabilityOf — kept local so this file
 * never has to reach into another module's private helper. Same formula. */
function vulnerabilityOf(coachName, tribe) {
  const bonds = (tribe?.members || []).map(m => getBond(coachName, m));
  if (!bonds.length) return 0.5;
  const avg = bonds.reduce((a, b) => a + b, 0) / bonds.length;
  return Math.max(0, Math.min(1, (5 - avg) / 15));
}

function mixFor(coachName, tribe) {
  return agendaMix({
    stats: pStats(coachName), archetype: archOf(coachName),
    vulnerability: vulnerabilityOf(coachName, tribe),
  });
}

/** How much one coach's CURRENT agenda pulls toward each of the three channels. */
function affinities(mix) {
  return {
    'non-aggression': mix.support * 0.7 + mix.win * 0.3,
    trade: mix.control * 0.8 + mix.win * 0.2,
    'the-fall': mix.survive,
  };
}

function bestType(aff) {
  return Object.entries(aff).sort((a, b) => b[1] - a[1])[0];
}

function store() { if (!gs.coachDeals) gs.coachDeals = []; return gs.coachDeals; }

/** The live deal between these two coaches on this tribe, if any. */
export function activeCoachDeal(a, b, tribeName) {
  return store().find(d => d.active && !d.broken && d.tribe === tribeName
    && (d.players || []).includes(a) && (d.players || []).includes(b));
}

/** Fraction of the rest of the tribe both coaches already have a foothold with. */
function overlapOf(a, b, tribe) {
  const rest = (tribe?.members || []).filter(m => m !== a && m !== b);
  if (!rest.length) return 0;
  const shared = rest.filter(m => getBond(a, m) > 0 && getBond(b, m) > 0).length;
  return shared / rest.length;
}

/** This coach's strongest protégé on the tribe — the one a rival would poach. */
function topProtege(coachName, tribe, exclude = []) {
  return (tribe?.members || [])
    .filter(m => !exclude.includes(m))
    .map(m => ({ name: m, bond: getBond(coachName, m) }))
    .filter(m => m.bond >= 3)
    .sort((x, y) => y.bond - x.bond)[0]?.name || null;
}

function about(type) {
  return type === 'non-aggression' ? 'staying out of each other\'s protégés'
    : type === 'trade' ? 'trading influence over a contestant'
    : 'which of them takes the next vote';
}

// ── SEALED: non-aggression ──
function nonAggressionEvent(a, b, roll) {
  const pool = [
    `${a} and ${b} agree to stay out of each other's corner — whatever else this tribe becomes, it won't be a bidding war over the same protégés.`,
    `${a} and ${b} quietly settle it between themselves: ${a}'s players stay ${a}'s, ${b}'s stay ${b}'s.`,
    `${a} and ${b} shake on leaving each other's protégés alone, an arrangement neither of them needed a witness for.`,
    `${a} and ${b} agree not to court the same contestants — a truce neither one particularly wanted to need.`,
  ];
  return { type: 'coachNonAggression', players: [a, b], badgeText: 'COACHES’ TRUCE', badgeClass: 'blue', text: pick(pool, roll) };
}

// ── SEALED: trade — a real swap of standing over two contestants ──
function tradeEvent(ep, tribe, a, b, roll) {
  const events = [];
  const x = topProtege(a, tribe, [b]);
  const y = topProtege(b, tribe, [a, x].filter(Boolean));
  if (!x && !y) {
    // Nothing to swap yet — the deal still stands, just without a beat this ep.
    return events;
  }
  if (x) { addBond(a, x, -1.0); addBond(b, x, 1.0); }
  if (y) { addBond(b, y, -1.0); addBond(a, y, 1.0); }
  const named = x && y ? `${a} hands over ${x}, ${b} hands over ${y}` : x ? `${a} hands ${b} ${x}` : `${b} hands ${a} ${y}`;
  const pool = [
    `${a} and ${b} trade influence outright: ${named}, and neither pretends it was a gift.`,
    `${a} and ${b} strike a straight swap of standing — ${named} — and both walk away thinking they got the better half.`,
    `${a} and ${b} settle who is coaching whom the hard way: ${named}, negotiated like a contract.`,
    `${a} and ${b} redraw the lines between their protégés — ${named} — and the tribe has no idea the trade even happened.`,
  ];
  events.push({ type: 'coachTrade', players: [a, b, x, y].filter(Boolean), badgeText: 'INFLUENCE TRADED', badgeClass: 'purple', text: pick(pool, roll) });
  return events;
}

// ── SEALED: the-fall — a self-sacrifice with a protection clause ──
function theFallEvent(ep, tribe, faller, survivor, roll) {
  const W = showWords(seasonConfig.format);
  const round = Number(ep?.num || (gs.episode || 0) + 1);
  gs._coachFallHeat ||= {};
  // Matches the `(gs.episode || 0) + 1` convention every other coach/volunteer
  // heat is checked against in alliances.js — this episode's own vote, since
  // the deal block runs before that vote is resolved.
  gs._coachFallHeat[faller] = round;

  const protected_ = (tribe?.members || []).filter(m => getBond(faller, m) >= 3);
  for (const m of protected_) addBond(survivor, m, 1.0);

  const deal = activeCoachDeal(faller, survivor, tribe?.name ?? tribe?.tribeName);
  if (deal) deal.protectedProteges = protected_;

  const pool = [
    `${faller} tells ${survivor} plainly: take the tribe, keep it away from ${faller}'s players when ${faller} is gone. ${survivor} agrees.`,
    `${faller} offers to go quietly at the next ${W.round.toLowerCase()} if ${survivor} gives their word that ${faller}'s protégés stay protected.`,
    `${faller} reads the room, decides the fight isn't worth it, and makes ${survivor} promise to look after ${faller}'s players instead.`,
    `${faller} strikes the hardest bargain a coach can make — ${faller}'s own exit — in exchange for ${survivor} shielding everyone ${faller} trained.`,
  ];
  return [{ type: 'coachTheFall', players: [faller, survivor], badgeText: 'THE FALL', badgeClass: 'gold', text: pick(pool, roll) }];
}

// ── REJECTED ──
function rejectDeal(proposer, responder, type, roll) {
  addBond(proposer, responder, -0.2);
  const pool = [
    `${proposer} floats ${about(type)} to ${responder}, who isn't interested — not this time.`,
    `${proposer} tries to work something out with ${responder} over ${about(type)}. ${responder} passes.`,
    `${responder} hears ${proposer} out on ${about(type)} and turns it down flat.`,
    `${proposer} makes the overture; ${responder} isn't ready to trust it, and says so.`,
  ];
  return [{ type: 'coachDealRejected', players: [proposer, responder], badgeText: 'DEAL DECLINED', badgeClass: 'grey', text: pick(pool, roll) }];
}

// ── BROKEN ──
function breakDeal(ep, tribe, deal, breaker, roll) {
  const victim = (deal.players || []).find(n => n !== breaker);
  const round = Number(ep?.num || (gs.episode || 0) + 1);
  deal.active = false;
  deal.broken = true;
  deal.brokenBy = breaker;
  deal.brokenEp = round;
  addBond(breaker, victim, -1.8);

  const events = [];
  if (deal.type === 'non-aggression') {
    const target = topProtege(victim, tribe, [breaker]);
    if (target) {
      addBond(breaker, target, 0.8);
      addBond(victim, target, -0.8);
    }
  } else if (deal.type === 'the-fall' && Array.isArray(deal.protectedProteges) && breaker !== deal.faller) {
    // The survivor is the one who could renege — undo the protection they banked.
    for (const m of deal.protectedProteges) addBond(breaker, m, -1.0);
  } else if (deal.type === 'the-fall' && breaker === (deal.faller ?? deal.players?.[0])) {
    if (gs._coachFallHeat?.[breaker]) delete gs._coachFallHeat[breaker];
  }

  const pool = [
    `${breaker} walks back on ${about(deal.type)} with ${victim} — no warning, no apology.`,
    `${breaker} decides the deal over ${about(deal.type)} was never going to last and breaks it first.`,
    `${victim} finds out ${breaker} never meant to hold up their end of ${about(deal.type)}.`,
    `${breaker} tears up the arrangement over ${about(deal.type)} the moment it stops suiting ${breaker}.`,
  ];
  events.push({ type: 'coachDealBroken', players: [breaker, victim], badgeText: 'DEAL BROKEN', badgeClass: 'red', text: pick(pool, roll) });
  return events;
}

function maybeBreak(ep, tribe, deal, roll) {
  const [a, b] = deal.players;
  const mixA = mixFor(a, tribe), mixB = mixFor(b, tribe);
  const breaker = mixA.disrupt >= mixB.disrupt ? a : b;
  const chance = clamp01(Math.max(mixA.disrupt, mixB.disrupt) * 0.4);
  if (roll() >= chance) return [];
  return breakDeal(ep, tribe, deal, breaker, roll);
}

function maybePropose(ep, tribe, a, b, roll) {
  const tribeName = tribe?.name ?? tribe?.tribeName;
  const mixA = mixFor(a, tribe), mixB = mixFor(b, tribe);
  const [typeA, scoreA] = bestType(affinities(mixA));
  const [typeB, scoreB] = bestType(affinities(mixB));
  const aLeads = scoreA >= scoreB;
  const proposer = aLeads ? a : b;
  const responder = aLeads ? b : a;
  const dealType = aLeads ? typeA : typeB;
  const proposerMix = aLeads ? mixA : mixB;
  const responderMix = aLeads ? mixB : mixA;
  const proposerScore = aLeads ? scoreA : scoreB;

  if (dealType === 'the-fall' && vulnerabilityOf(proposer, tribe) < 0.45) return [];

  const disruptDamp = 1 - Math.min(0.85, proposerMix.disrupt);
  const proposeChance = Math.min(0.9, proposerScore * disruptDamp * 0.6);
  if (roll() >= proposeChance) return [];

  const overlap = overlapOf(a, b, tribe);
  const responderAff = affinities(responderMix)[dealType];
  const acceptChance = clamp01(responderAff * 0.65 + overlap * 0.35);
  if (roll() >= acceptChance) return rejectDeal(proposer, responder, dealType, roll);

  const round = Number(ep?.num || (gs.episode || 0) + 1);
  const deal = {
    players: [proposer, responder], tribe: tribeName, type: dealType,
    active: true, broken: false, madeEp: round, proposer,
    faller: dealType === 'the-fall' ? proposer : null,
    about: about(dealType),
  };
  store().push(deal);
  addBond(proposer, responder, 0.6);
  addBond(responder, proposer, 0.6);

  if (dealType === 'non-aggression') return [nonAggressionEvent(proposer, responder, roll)];
  if (dealType === 'trade') return tradeEvent(ep, tribe, proposer, responder, roll);
  return theFallEvent(ep, tribe, proposer, responder, roll);
}

/**
 * Run once per tribe per episode, alongside `runCoachingBlock`/`coachFallout`.
 * A no-op on any tribe with fewer than two coaches — there is no rival pool
 * to compete for otherwise.
 */
export function runCoachDealBlock(ep, tribe, roll = Math.random) {
  const tribeName = tribe?.name ?? tribe?.tribeName;
  const coaches = coachesOf(tribeName);
  const events = [];
  if (coaches.length < 2) return events;

  for (let i = 0; i < coaches.length; i++) {
    for (let j = i + 1; j < coaches.length; j++) {
      const a = coaches[i].name, b = coaches[j].name;
      const existing = activeCoachDeal(a, b, tribeName);
      events.push(...(existing ? maybeBreak(ep, tribe, existing, roll) : maybePropose(ep, tribe, a, b, roll)));
    }
  }

  if (events.length) {
    if (!ep.coachDealEvents) ep.coachDealEvents = [];
    ep.coachDealEvents.push(...events);
  }
  return events;
}

/** Whether an active non-aggression pact currently bars this coach from
 * courting the given candidate — used by runCoachingBlock to keep the
 * targeting-weight pickup honest rather than cosmetic. */
export function nonAggressionBars(coachName, candidateName, tribe) {
  const tribeName = tribe?.name ?? tribe?.tribeName;
  const coaches = coachesOf(tribeName).map(c => c.name).filter(n => n !== coachName);
  return coaches.some(other => {
    const deal = activeCoachDeal(coachName, other, tribeName);
    return deal && deal.type === 'non-aggression' && getBond(other, candidateName) >= 3;
  });
}
