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
import { getBond } from '../bonds.js';
import { getRelationshipDimensions } from '../relationships.js';
import { planSkill, housePlan } from './plans.js';

const TIER_RANK = { working: 0, 'final-three': 1, 'final-two': 2 };

const WORKING_TYPES = new Set(['safety', 'vote', 'veto', 'info']);

/** Two is a double game. Three is the most anybody can keep straight. */
const MAX_ENDGAME_DEALS = 3;

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

export function finalTwoPartner(name) {
  const deal = endgameDealsOf(name).find(d => tierOf(d) === 'final-two');
  return deal ? (deal.players || []).find(n => n !== name) || null : null;
}

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

/** Somebody told somebody else. A deal only costs you once people know. */
export function exposeDeal(deal, toWhom) {
  if (!deal) return false;
  deal.exposedTo ||= [];
  const names = Array.isArray(toWhom) ? toWhom : [toWhom];
  let added = false;
  for (const n of names) if (n && !deal.exposedTo.includes(n)) { deal.exposedTo.push(n); added = true; }
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
