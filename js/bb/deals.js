// ══════════════════════════════════════════════════════════════════════
// deals.js — final two and final three, which is the spine of this game.
//
// The house could already shake on things: a week of safety, a vote, which way
// the veto goes. All of them expire on Thursday. What it could not do was the
// one deal Big Brother is actually about — I will take you to the end — and so
// nobody ever had anything to keep or to break.
//
// Two ideas do most of the work here.
//
// A deal has a TIER. Working deals are this week's business. Final three and
// final two are a different kind of promise, and the game treats them that way:
// they outrank an alliance at the vote, they survive the alliance collapsing,
// and breaking one is remembered by everybody who finds out.
//
// A deal has SINCERITY, separately for each side, and neither side can see the
// other's. Somebody can shake your hand fully meaning it while you are already
// counting how many of these you have. Players are allowed more than one final
// two — that is not a bug to be prevented, it is the most interesting thing
// that happens in this house — but only one of them can be kept.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { getRelationshipDimensions } from '../relationships.js';
import { planSkill, housePlan } from './plans.js';
import { recordBBDeal, learnBBDeal } from './knowledge.js';
import { juryOpensAt } from './jury.js';

const TIER_RANK = { working: 0, 'final-three': 1, 'final-two': 2 };

const WORKING_TYPES = new Set(['safety', 'vote', 'veto', 'info']);

/** Two is a double game. Three is the most anybody can keep straight. */
export const MAX_ENDGAME_DEALS = 3;

const clamp01 = n => Math.max(0, Math.min(1, n));
const statsOf = name => players.find(p => p.name === name)?.stats || {};
const trustOf = (a, b) => (getRelationshipDimensions(a, b).trust || 0) * 0.6 + getBond(a, b) * 0.4;
const houseNow = () => (gs.activePlayers || players.map(p => p.name)).filter(Boolean);

function deals() { gs.sideDeals ||= []; return gs.sideDeals; }

/**
 * Which tier a deal belongs to.
 *
 * Older saves and the weekly events write a bare `type`, so the tier is derived
 * when it has not been stated rather than assumed to be there.
 */
export function tierOf(deal) {
  if (!deal) return 'working';
  if (deal.tier && TIER_RANK[deal.tier] !== undefined) return deal.tier;
  if (deal.type === 'f2' || deal.type === 'final-two') return 'final-two';
  if (deal.type === 'f3' || deal.type === 'final-three') return 'final-three';
  return 'working';
}

export const isEndgameDeal = deal => TIER_RANK[tierOf(deal)] > 0;

/**
 * How much somebody means it when they shake on the end.
 *
 * Loyalty is the floor and planning skill is the discount: a player who cannot
 * see past Thursday makes one deal and means it, while somebody running a game
 * knows what a promise is worth. Trust in the other person raises it, and
 * already holding an endgame deal lowers it hard — the second one you make is
 * by definition the one you are less sure about.
 */
function sincerityFor(name, partner, tier = 'final-two') {
  const s = statsOf(name);
  const loyalty = (s.loyalty ?? 5) / 10;
  const skill = planSkill(name) / 10;
  const held = endgameDealsOf(name).length;
  const base = loyalty * 0.62 + clamp01((trustOf(name, partner) + 4) / 12) * 0.38;
  const discount = skill * 0.3 + held * 0.22;
  // A final three is a looser promise than a final two, and people mean it more
  // easily because it costs them less.
  const tierEase = tier === 'final-three' ? 0.1 : 0;
  return clamp01(base - discount + tierEase);
}

/**
 * Shake on the end.
 *
 * Returns the deal, or the existing one if these two already have this. Each
 * side gets its own private sincerity, so the liar and the believer are stored
 * in the same object without either being able to read the other.
 */
export function makeEndgameDeal(a, b, tier = 'final-two', { week = null, about = '', third = null } = {}) {
  if (!a || !b || a === b || !TIER_RANK[tier]) return null;
  const round = Number(week?.num || (gs.episode || 0) + 1);
  const members = third ? [a, b, third] : [a, b];

  const existing = deals().find(d => d.active !== false && !d.broken
    && tierOf(d) === tier && members.every(n => (d.players || []).includes(n))
    && (d.players || []).length === members.length);
  if (existing) return existing;

  // How many of these one person can be holding at once.
  //
  // Without a cap the house saturates: a measured week nine had twenty-eight
  // live final twos between ten people, which is nearly six each and makes the
  // strongest promise in the game worth nothing. Hedging is the point of the
  // tier — but somebody juggling six of them is not playing a double game, they
  // are just saying yes to everybody, and nobody in this house believes that
  // person by week three anyway.
  if (members.some(n => endgameDealsOf(n).length >= MAX_ENDGAME_DEALS)) return null;

  const deal = {
    players: members, type: tier, tier, active: true, genuine: true,
    madeEp: round, format: 'big-brother',
    about: about || (tier === 'final-two' ? 'the two of us at the end' : 'the three of us to the end'),
    sincerity: Object.fromEntries(members.map(n => [n,
      sincerityFor(n, members.find(m => m !== n), tier)])),
    broken: false, brokenBy: null, brokenEp: null, exposedTo: [],
  };
  deals().push(deal);

  // Into the knowledge model, so the house can find out about it later.
  //
  // A trio is recorded as its three pairs rather than one three-way fact: what
  // travels across a kitchen is "those two are working together", and a player
  // who hears one leg of a final three has not been handed the other two.
  // Only the people in the room observe it; everybody else has to be told.
  try {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        recordBBDeal(members[i], members[j], tier, round);
        // Everybody who was standing there knows every leg of it, including the
        // one between the other two — recordBBDeal only tells the pair itself,
        // which would leave the third person in a final three unaware of the
        // half of it they watched being agreed.
        for (const witness of members) {
          learnBBDeal(witness, members[i], members[j], { week: round });
        }
      }
    }
  } catch { /* the promise still stands even if nobody can gossip about it */ }

  // The plan should know about it immediately — a deal you have to wait a week
  // to act on is not a deal.
  for (const member of members) {
    const plan = housePlan(member);
    if (!plan) continue;
    const partners = members.filter(n => n !== member);
    plan.finalThree = [member, ...new Set([...partners, ...plan.finalThree.filter(n => n !== member)])].slice(0, 3);
    plan.origins.finalThree ||= {};
    partners.forEach(n => { plan.origins.finalThree[n] = `shook on ${tier === 'final-two' ? 'a final two' : 'a final three'} in week ${round}`; });
    // And the same handshake takes them OFF the other side of the plan. A
    // houseguest could end up holding somebody as final-two partner and top
    // target at once — the deal wrote one field and never read the others —
    // and the two pulls then fought over every nomination. You do not shake
    // on the end with somebody you are still planning to gun for; if the
    // deal is a lie, sincerity carries that, not a stale hit list.
    if (Array.isArray(plan.targets)) plan.targets = plan.targets.filter(n => !partners.includes(n));
    if (Array.isArray(plan.revenge)) plan.revenge = plan.revenge.filter(n => !partners.includes(n));
    // The live intention target is a separate store from the plan, and it is
    // the one bbHeat actually reads (+4 for "this is my target").
    const intent = gs.intentions?.[member];
    if (Array.isArray(intent?.targets)) intent.targets = intent.targets.filter(n => !partners.includes(n));
  }
  return deal;
}

/**
 * "Let's get to jury together."
 *
 * The most common promise in the house and the one it could not make. It is
 * NOT an endgame deal and is deliberately kept at the working tier: it does not
 * outrank an alliance, it does not count against the three-endgame-deal cap,
 * and at a vote it is worth the same small nudge any other working deal is
 * (0.5 against a final two's 6.5). Two people can hold this and still be in
 * separate final twos, which is exactly how the house works.
 *
 * What makes it worth having is that it ENDS somewhere specific. Every other
 * working deal expires on Thursday and an endgame deal runs to the last night;
 * this one runs to a milestone, and the milestone arriving is the whole point.
 * It is a promise about surviving, not about winning, so it dissolves the
 * moment surviving stops being the question.
 */
export function makeJuryPact(a, b, { week = null } = {}) {
  if (!a || !b || a === b) return null;
  const round = Number(week?.num || (gs.episode || 0) + 1);
  const existing = deals().find(d => d.active !== false && !d.broken
    && d.type === 'make-jury' && (d.players || []).includes(a) && (d.players || []).includes(b));
  if (existing) return existing;

  const deal = {
    players: [a, b], type: 'make-jury', tier: 'working', active: true, genuine: true,
    madeEp: round, format: 'big-brother',
    about: 'getting to the jury together',
    sincerity: Object.fromEntries([a, b].map(n => [n, sincerityFor(n, n === a ? b : a, 'final-three')])),
    broken: false, brokenBy: null, brokenEp: null, exposedTo: [],
  };
  deals().push(deal);
  return deal;
}

/** The live "get to jury together" pacts this person is in. */
export function juryPactsOf(name) {
  const live = houseNow();
  return deals().filter(d => d.active !== false && !d.broken && d.type === 'make-jury'
    && (d.players || []).includes(name)
    && (d.players || []).every(n => live.includes(n)));
}

/** Every live endgame deal this person is in, strongest promise first. */
export function endgameDealsOf(name) {
  const live = houseNow();
  return deals()
    .filter(d => d.active !== false && !d.broken && isEndgameDeal(d)
      && (d.players || []).includes(name)
      && (d.players || []).every(n => live.includes(n)))
    .sort((a, b) => (TIER_RANK[tierOf(b)] - TIER_RANK[tierOf(a)])
      || ((b.sincerity?.[name] || 0) - (a.sincerity?.[name] || 0)));
}

// `finalTwoPartner` used to sit here and had no callers anywhere in the
// simulator. Everything that wants this asks `dealBetween` or walks
// `endgameDealsOf`, both of which say which tier they got and how much the
// asker means it — a bare partner name loses exactly the part that matters.

/** Do these two have something at the end, and how strong is it from a's side? */
export function dealBetween(a, b) {
  return endgameDealsOf(a).find(d => (d.players || []).includes(b)) || null;
}

export function sincerityOf(deal, name) {
  if (!deal) return 0;
  const stated = deal.sincerity?.[name];
  return Number.isFinite(stated) ? stated : 0.5;
}

/**
 * Will they keep it, in this moment, against this cost?
 *
 * `pressure` is how much keeping the deal costs them right now — 0 is free,
 * 1 is their game. Sincerity has to beat the pressure, and somebody who has
 * hedged with a second deal has already half-decided.
 */
export function honoursDeal(name, deal, pressure = 0) {
  if (!deal) return false;
  const mine = sincerityOf(deal, name);
  const hedged = endgameDealsOf(name).length > 1 ? 0.15 : 0;
  const loyalty = (statsOf(name).loyalty ?? 5) / 10;
  return mine - hedged + loyalty * 0.2 > pressure;
}

/**
 * Break it, on the record.
 *
 * Everybody still in the house who was in the deal finds out immediately —
 * being cut is not something you have to be told. The rest of the house learns
 * it only if somebody tells them, which is what `exposeDeal` is for.
 */
export function breakDeal(deal, breaker, { week = null, reason = '' } = {}) {
  if (!deal || deal.broken) return null;
  const round = Number(week?.num || (gs.episode || 0) + 1);
  deal.broken = true;
  deal.active = false;
  deal.brokenBy = breaker;
  deal.brokenEp = round;
  deal.brokenReason = reason;

  const victims = (deal.players || []).filter(n => n !== breaker);
  for (const victim of victims) {
    const plan = housePlan(victim);
    if (plan) {
      plan.finalThree = (plan.finalThree || []).filter(n => n !== breaker);
      if (!plan.targets.includes(breaker)) {
        plan.targets = [breaker, ...plan.targets].slice(0, 3);
        plan.origins.targets ||= {};
        plan.origins.targets[breaker] = 'went back on the end';
      }
    }
    const breakerPlan = housePlan(breaker);
    if (breakerPlan) breakerPlan.finalThree = (breakerPlan.finalThree || []).filter(n => n !== victim);
  }
  return { deal, breaker, victims, round, reason };
}

/**
 * Somebody told somebody else. A deal only costs you once people know.
 *
 * `exposedTo` used to be the whole of this: a private list on the deal that two
 * places read and nothing acted on, so being exposed cost a pair precisely
 * nothing. The list stays, because a few consumers want the plain roll of who
 * has been told — but the telling now also enters the knowledge model, which is
 * what makes it travel. The person told can pass it on next week without
 * anybody scripting it, and a Head of Household who believes it can split the
 * pair up on the block.
 */
// `rng` stays null by default so learnBBDeal derives a stable one — an
// unseeded draw inside a seeded season breaks replay. Tests pass one to make
// the belief roll a certainty rather than a coin flip.
export function exposeDeal(deal, toWhom, { from = null, week = null, rng = null } = {}) {
  if (!deal) return false;
  deal.exposedTo ||= [];
  const names = Array.isArray(toWhom) ? toWhom : [toWhom];
  const round = Number(week?.num || week || (gs.episode || 0) + 1);
  const members = deal.players || [];
  let added = false;
  for (const n of names) {
    if (!n || deal.exposedTo.includes(n)) continue;
    deal.exposedTo.push(n);
    added = true;
    // The roll still takes anybody, including the people who were in it —
    // the finale exposes a broken deal to the whole jury and the person who
    // got cut is sitting on it. What they do NOT get is a fresh discovery:
    // they were in the room, they already hold the fact, and running them
    // through the belief check would overwrite first-hand knowledge with
    // hearsay.
    if (members.includes(n)) continue;
    try {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          learnBBDeal(n, members[i], members[j], { from, week: round, rng });
        }
      }
    } catch { /* they were still told; it just does not spread from here */ }
  }
  return added;
}

/**
 * Deals with somebody who has left, or that no longer make sense, quietly lapse.
 */
export function settleDeals({ house = houseNow(), week = null } = {}) {
  const round = Number(week?.num || (gs.episode || 0) + 1);
  const lapsed = [];
  for (const deal of deals()) {
    if (deal.active === false || deal.broken) continue;
    const gone = (deal.players || []).filter(n => !house.includes(n));

    // ── "Let's get to jury together" resolves at the milestone, not on a week ──
    //
    // Handled before the general departure rule, because a jury pact ending is
    // not the same event as a deal lapsing: it either came true or it did not,
    // and both of those are worth something. Kept, the two of them owe each
    // other nothing more and think better of each other for it — and one of
    // them is about to be voting. Failed, it lapses quietly; the person who
    // went home early has the eviction itself to be angry about and does not
    // need a second grievance stapled to it.
    if (deal.type === 'make-jury') {
      const opens = juryOpensAt();
      const kept = !gone.length && opens > 0 && house.length <= opens;
      if (!kept && !gone.length) continue;          // still climbing toward it
      deal.active = false;
      deal.lapsedEp = round;
      deal.juryPactKept = kept;
      deal.lapsedBecause = kept
        ? 'they both made it to the jury'
        : `${gone.join(' and ')} did not make it`;
      if (kept) addBond(deal.players[0], deal.players[1], 1.2);
      lapsed.push(deal);
      continue;
    }

    if (gone.length) {
      deal.active = false;
      deal.lapsedEp = round;
      deal.lapsedBecause = `${gone.join(' and ')} left the house`;
      lapsed.push(deal);
      continue;
    }
    // A week's business is done by the end of the week.
    if (WORKING_TYPES.has(deal.type) && round > Number(deal.madeEp || 0)) {
      deal.active = false;
      deal.lapsedEp = round;
      deal.lapsedBecause = 'the week it covered is over';
      lapsed.push(deal);
    }
  }
  return lapsed;
}

/** For the screen: every endgame promise in the house, as plain facts. */
export function endgameDealSummary(house = houseNow()) {
  return deals()
    .filter(d => isEndgameDeal(d) && !d.broken && d.active !== false
      && (d.players || []).every(n => house.includes(n)))
    .map(d => ({
      players: [...(d.players || [])],
      tier: tierOf(d),
      madeEp: d.madeEp,
      // Whether the two of them mean it to the same degree is the whole story,
      // so the screen gets the gap rather than either number on its own.
      lopsided: Math.abs((d.sincerity?.[d.players?.[0]] ?? 0.5) - (d.sincerity?.[d.players?.[1]] ?? 0.5)) > 0.3,
      sincerity: { ...(d.sincerity || {}) },
    }));
}
