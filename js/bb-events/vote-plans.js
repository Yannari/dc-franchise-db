// ══════════════════════════════════════════════════════════════════════
// bb-events/vote-plans.js — the week's vote as a thing people BUILD
// ══════════════════════════════════════════════════════════════════════
//
// bb/vote-operation.js runs the middle of the week before the nominees ever
// campaign: every alliance that can field two votes holds a meeting, names a
// target, and records what each of its own people said — dependable, leaning,
// pulled, conflicted, refusing, or owned by another room entirely. Plans that
// come up short go recruiting among the unaffiliated, one named approach at a
// time, and each ask lands as an agreement, a refusal, a shrug, or a yes that
// was never true.
//
// All of that was arithmetic nobody could see. The operation produced a
// beautiful record of a vote being assembled and the feed showed a house
// talking about slop. These are the scenes for it.
//
// The rule of the file: an event here reads a specific entry in that record —
// this stance, this approach, this count — and names it. "Somebody is
// scheming" is not an event. "Raj told Brightly the votes were already there,
// Brightly said yes and meant none of it, and Fiore has started to wonder why
// Brightly will not look at her" is.
//
// The back four are the other half: strategies that FAILED. A backdoor dies
// when the target draws into the veto and wins it; a pawn ask goes wrong when
// the pawn is suddenly the one in trouble; a room that missed its count starts
// looking for who to blame before the votes are even read; and the target a
// room could not evict is still in the house on Friday morning, eating cereal
// across the table from the people who tried.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, band, closestTo, spotlightOrder, isNice,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

/**
 * Deterministic line pick. Never Math.random: a seeded season has to replay
 * word for word, and the beat index is already in the key so a second airing
 * of the same event picks different words.
 */
function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.filter(Boolean).join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder([...new Set((pool || []).filter(Boolean))]);

const _list = names => (names.length <= 1 ? (names[0] || '')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

const _op = ctx => ctx?.week?.voteOperation || null;

/**
 * The plans this house can still act on.
 *
 * Filtered hard, because a plan whose organiser has already been evicted is a
 * record of last Tuesday and not a scene. Everything downstream assumes the
 * organiser and at least one member are standing in the room.
 */
function _plans(ctx, house) {
  const op = _op(ctx);
  if (!op || !Array.isArray(op.plans) || !Array.isArray(house)) return [];
  return op.plans.filter(p => p && p.organizer && p.target
    && Array.isArray(p.members) && Array.isArray(p.stances) && Array.isArray(p.approaches)
    && house.includes(p.organizer)
    && p.members.some(m => house.includes(m)));
}

/** Everybody a room believes it has — the count as the organiser would say it. */
function _claimed(plan) {
  const out = new Set(plan.members || []);
  for (const s of plan.stances || []) if (s?.stance !== 'elsewhere' && s?.voter) out.add(s.voter);
  for (const n of plan.outsideSupport || []) out.add(n);
  for (const a of plan.approaches || []) {
    if (a?.voter && (a.outcome === 'agrees' || a.outcome === 'lies')) out.add(a.voter);
  }
  return [...out];
}

/** Anybody in the house this room does not own. */
const _outsiders = (house, plan, ...also) =>
  house.filter(n => n && !(plan.members || []).includes(n)
    && !(plan.approaches || []).some(a => a.voter === n)
    && !(plan.outsideSupport || []).includes(n)
    && !also.includes(n));

/** The member the organiser actually counts with — sharpest, not closest. */
function _lieutenant(plan, house) {
  const pool = (plan.members || []).filter(m => m !== plan.organizer && house.includes(m));
  if (!pool.length) return null;
  return _quiet(pool).sort((a, b) =>
    (pStats(b).strategic + pStats(b).intuition * 0.5)
    - (pStats(a).strategic + pStats(a).intuition * 0.5))[0] || pool[0];
}

const _stance = (plan, name) => (plan.stances || []).find(s => s.voter === name)?.stance || null;

/**
 * The campaign act, where the operation lives.
 *
 * runVoteOperation() resolves immediately BEFORE the campaign acts and long
 * after the post-veto house stretch, so the campaign is the only act with the
 * whole record in hand. Everything that reads a stance or an approach gates
 * here or it gates on nothing.
 */
const _campaign = (ctx, value) => (ctx?.act === 'campaign' ? band(value) : 0);

/** Eviction night draws one to three beats. Only the vote itself belongs. */
const _evictionNight = (ctx, value) => (ctx?.act === 'eviction' ? band(value) : 0);

/** Once per week for the events that are a single moment, not a mood. */
const _spent = (id, ctx) => !!ctx?.week?._votePlanFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._votePlanFired ||= {})[id] = true; };

const _fallback = (text, players, badgeText = 'NOTHING MOVES') =>
  ({ text, players: players.filter(Boolean), badgeText, badgeClass: 'grey' });

// ══════════════════════════════════════════════════════════════════════
// THE ROOMS
// ══════════════════════════════════════════════════════════════════════

/**
 * Somebody watches four people leave a conversation one at a time.
 *
 * This is how every alliance in the format's history has been discovered: not
 * by overhearing the plan, but by counting who is missing. The observer learns
 * nothing about the target and everything about the shape.
 */
const meetingSeen = {
  id: 'plan-meeting-seen',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const plans = _plans(ctx, house);
    const plan = plans.find(p => (p.members || []).filter(m => house.includes(m)).length >= 2
      && _outsiders(house, p).length);
    if (!plan) return 0;
    const observer = _outsiders(house, plan)[0];
    // A sharp outsider notices sooner. Proportional, never a gate.
    return _campaign(ctx, 9 + pStats(observer).intuition * 0.25);
  },
  fire(house, ctx, api) {
    const plans = _plans(ctx, house);
    const plan = plans.find(p => (p.members || []).filter(m => house.includes(m)).length >= 2
      && _outsiders(house, p).length);
    if (!plan) return _fallback(`The house is quiet and everybody is where they are supposed to be.`, house.slice(0, 1), 'NOBODY MOVES');
    const observer = _quiet(_outsiders(house, plan))[0];
    const seen = _quiet((plan.members || []).filter(m => house.includes(m))).slice(0, 2);
    if (!observer || seen.length < 2) {
      return _fallback(`${observer || plan.organizer} counts the room and comes up with nothing worth saying.`, [observer || plan.organizer], 'NO PATTERN');
    }
    const p = pronouns(observer);

    const text = _variant([
      `${seen[0]} goes to the storage room. ${seen[1]} follows about ninety seconds later, which is exactly long enough to look unrelated. ${observer} is on the sofa and counts to ninety twice more before anybody comes back.`,
      `${observer} walks into the bedroom and a conversation stops in the middle of a word. ${_list(seen)} are both suddenly very interested in the laundry. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not ask what it was about, because the answer would be a lie and then ${p.sub} would know they lie.`,
      `Four people have gone into the same room in eleven minutes and ${observer} has not been one of them. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not know what ${_list(seen)} are deciding. ${p.Sub} ${p.sub === 'they' ? 'know' : 'knows'} it is being decided.`,
      `${observer} has started noticing the leaving rather than the talking. ${seen[0]} first, then ${seen[1]}, never together, always within two minutes. Nobody leaves a room that carefully unless the room matters.`,
    ], ctx, observer, plan.alliance, seen[0], seen[1]);

    // Noticing is not knowing. It makes them warier of the two people they
    // actually saw, which is what changes how they vote next week.
    seen.forEach(m => api.suspicion(observer, m, 0.7));
    api.remember(observer, seen[0], 'meets-in-private', 1, { about: `left the room with ${seen[1]}` });
    return { text, players: [observer, ...seen],
      badgeText: 'COUNTED THE ROOM', badgeClass: 'blue' };
  },
};

/**
 * The count, said out loud, name by name.
 *
 * plan.stances is the most specific thing the operation produces and it never
 * reached a screen. An organiser who says "Fiore is solid, Thom says he is
 * with us and I do not believe him, that is four and we need five" is doing
 * the actual job of the position.
 */
const countOnFingers = {
  id: 'plan-count-on-fingers',
  category: 'deals',
  location: 'storage',
  weight(house, ctx) {
    const plan = _plans(ctx, house).find(p => p.stances.length && _lieutenant(p, house));
    if (!plan) return 0;
    const short = plan.expected < plan.majority;
    return _campaign(ctx, 6 + (short ? 3 : 0) + pStats(plan.organizer).strategic * 0.2);
  },
  fire(house, ctx, api) {
    const plan = _plans(ctx, house).find(p => p.stances.length && _lieutenant(p, house));
    if (!plan) return _fallback(`Nobody in this house can be bothered to count tonight.`, house.slice(0, 1), 'NO COUNT');
    const lieutenant = _lieutenant(plan, house);
    const org = plan.organizer;
    const solid = plan.stances.filter(s => s.stance === 'dependable' && house.includes(s.voter)).map(s => s.voter);
    const torn = plan.stances.filter(s => ['leaning', 'pulled', 'conflicted'].includes(s.stance)
      && house.includes(s.voter)).map(s => s.voter);
    const short = plan.expected < plan.majority;
    const gap = Math.max(1, plan.majority - plan.expected);

    const solidLine = solid.length
      ? `${_list(solid.slice(0, 3))} ${solid.length > 1 ? 'do not need asking twice' : 'does not need asking twice'}`
      : `nobody in this room is what ${org} would call solid`;
    const tornLine = torn.length
      ? `${_list(torn.slice(0, 2))} said yes with ${torn.length > 1 ? 'their' : 'a'} whole face doing something else`
      : `the rest said yes and meant it as far as anybody can tell`;

    const text = short ? _variant([
      `${org} does it on ${pronouns(org).posAdj} fingers, out loud, for ${lieutenant}: ${solidLine}, ${tornLine}. It comes to ${plan.expected} against a majority of ${plan.majority}, and ${org} does the count a second time in case the second time is kinder.`,
      `"${solid.length ? _list(solid.slice(0, 3)) : 'Nobody'}, us, and then it stops." ${org} lays the count out for ${lieutenant} and gets to ${plan.expected}. ${lieutenant} says the number back. Neither of them likes hearing it in somebody else's voice.`,
      `${org} tells ${lieutenant} the room is fine and then keeps counting, which is how ${lieutenant} knows the room is not fine. ${gap === 1 ? 'One vote' : `${gap} votes`} short of ${plan.target}, with ${tornLine}.`,
      `The count against ${plan.target} runs out ${gap === 1 ? 'a vote' : `${gap} votes`} early. ${org} does not panic in front of ${lieutenant} — ${org} just starts naming people who have not been asked yet, which is the same thing said slower.`,
    ], ctx, org, lieutenant, plan.target) : _variant([
      `${org} runs it past ${lieutenant} one more time. ${solidLine}, ${tornLine}, and ${plan.target} does not have the numbers to survive any of it. ${lieutenant} still makes ${org} say it twice.`,
      `"Say them out loud." ${lieutenant} does not want the total, ${lieutenant} wants the names, and ${org} gives them: ${solid.length ? _list(solid.slice(0, 3)) : 'the room itself'} first, the rest after. ${plan.expected} of a needed ${plan.majority}.`,
      `${org} has counted this so many times it has stopped meaning anything, so ${lieutenant} takes over and counts it back. ${plan.expected}. Comfortable. Both of them keep looking at the door anyway.`,
      `It is ${plan.expected} to send ${plan.target} home and they need ${plan.majority}. ${org} says that to ${lieutenant} the way people say things they are trying to believe.`,
    ], ctx, org, lieutenant, plan.target);

    api.addBond(org, lieutenant, 0.6);
    api.remember(lieutenant, org, 'counted-it-with-me', 1,
      { about: `${plan.expected} of ${plan.majority} against ${plan.target}` });
    if (short) api.suspicion(org, torn[0] || plan.target, 0.5);
    return { text, players: [org, lieutenant, ...solid.slice(0, 1)].filter(Boolean),
      badgeText: short ? `${gap} SHORT` : 'THE COUNT HOLDS',
      badgeClass: short ? 'red' : 'blue' };
  },
};

/**
 * The pitch travels.
 *
 * Recruitment assumes discretion and never gets it. Whatever the approach's
 * outcome was, the person who was asked now owns a piece of information, and
 * the cheapest thing to do with it is spend it on somebody outside the room.
 */
const recruitReport = {
  id: 'plan-recruit-report',
  category: 'social',
  location: 'kitchen',
  weight(house, ctx) {
    const found = _reportable(ctx, house);
    if (!found) return 0;
    return _campaign(ctx, 5.5 + pStats(found.voter).social * 0.2);
  },
  fire(house, ctx, api) {
    const found = _reportable(ctx, house);
    if (!found) return _fallback(`Nobody has anything worth carrying across the house.`, house.slice(0, 1), 'NOTHING TO TELL');
    const { plan, approach, voter, listener } = found;
    const recruiter = approach.recruiter;
    const p = pronouns(voter);

    const text = _variant([
      `${voter} tells ${listener} about it before the kettle has boiled. "${recruiter} got me alone about ${plan.target}." ${listener} asks what ${p.sub} said. ${voter} says "nothing", which is what everybody says.`,
      `"You should know who is doing the asking." ${voter} repeats ${recruiter}'s pitch to ${listener} almost word for word — the argument, the numbers, the bit at the end where it stopped sounding like a question.`,
      `${voter} does not think of it as betraying anybody. ${recruiter} came to ${p.obj} with ${plan.target}'s name and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} simply telling ${listener} that ${recruiter} came to ${p.obj} with ${plan.target}'s name.`,
      `${listener} learns three things in under a minute: that there is a plan, that it is aimed at ${plan.target}, and that ${recruiter} is the one walking it around the house. Only the third one is news.`,
    ], ctx, voter, listener, recruiter);

    // The recruiter's discretion is the thing that just died.
    api.suspicion(listener, recruiter, 1.2);
    api.remember(listener, recruiter, 'works-the-house', 2,
      { about: `pitched ${voter} on voting out ${plan.target}` });
    api.addBond(voter, listener, 0.5);
    return { text, players: [voter, listener, recruiter],
      badgeText: 'THE PITCH TRAVELS', badgeClass: 'red' };
  },
};

function _reportable(ctx, house) {
  for (const plan of _plans(ctx, house)) {
    for (const approach of plan.approaches) {
      if (!approach?.voter || !approach.recruiter) continue;
      if (!house.includes(approach.voter) || !house.includes(approach.recruiter)) continue;
      const listener = _quiet(_outsiders(house, plan, approach.voter, approach.recruiter))[0];
      if (listener) return { plan, approach, voter: approach.voter, listener };
    }
  }
  return null;
}

/**
 * The yes that did not sound like one.
 *
 * A voter who lied cannot be caught — that is the design of the outcome — but
 * a room can still feel the shape of it, and 'undecided' feels identical from
 * the inside. So the doubt is real and the proof never arrives, which is the
 * most honest thing this game does.
 */
const falseCommitmentDoubt = {
  id: 'plan-false-commitment-doubt',
  category: 'deals',
  location: 'bathroom',
  weight(house, ctx) {
    const found = _softYes(ctx, house);
    if (!found) return 0;
    // A soft yes exists in maybe one week in five, and a campaign act draws
    // one to three beats against the whole library — at a polite weight this
    // never won a slot across ten seasons. When the state exists, the doubt
    // IS the story of the afternoon.
    return _campaign(ctx, 11 + pStats(found.doubter).intuition * 0.3);
  },
  fire(house, ctx, api) {
    const found = _softYes(ctx, house);
    if (!found) return _fallback(`Everybody's word is good until the ballots prove otherwise.`, house.slice(0, 1), 'NO DOUBTS');
    const { plan, voter, doubter, outcome } = found;
    const p = pronouns(doubter);

    const text = outcome === 'lies' ? _variant([
      `${doubter} cannot point at anything. ${voter} said yes, ${voter} has kept saying yes, and something about how quickly the answer came has felt wrong ever since.`,
      `"${voter} agreed too fast." ${doubter} says it to nobody, in the mirror, brushing ${p.posAdj} teeth. It is not evidence. It is the only thing ${p.sub} ${p.sub === 'they' ? 'have' : 'has'}.`,
      `${doubter} has watched ${voter} promise this vote three times now and has started counting how often ${voter} volunteers it unasked. Four. People do not repeat things they have already settled.`,
      `${voter} is a good liar and ${doubter} is a good reader, and in this house that produces nothing at all: ${doubter} is certain and cannot say why, so ${p.sub} ${p.sub === 'they' ? 'say' : 'says'} nothing.`,
    ], ctx, doubter, voter) : _variant([
      `${voter} still has not actually said the word yes about ${plan.target}, and ${doubter} has started noticing the shape of the sentences ${voter} uses instead.`,
      `"Where are you when we vote?" ${voter} answers a slightly different question, warmly, and moves on. ${doubter} lets it go and does not forget it.`,
      `${doubter} does the count in ${p.posAdj} head with ${voter} in it, then does it again with ${voter} out of it. The second number is the one ${p.sub} ${p.sub === 'they' ? 'believe' : 'believes'}.`,
      `Nobody has lied to ${doubter}. ${voter} has simply not committed to anything in four days, which in here is the same information delivered politely.`,
    ], ctx, doubter, voter);

    api.suspicion(doubter, voter, 1.0);
    api.remember(doubter, voter, 'never-said-yes', 1,
      { about: `the vote against ${plan.target}`, proven: false });
    return { text, players: [doubter, voter],
      badgeText: 'NOT SOLD ON IT', badgeClass: 'red' };
  },
};

function _softYes(ctx, house) {
  for (const plan of _plans(ctx, house)) {
    const soft = plan.approaches.filter(a => (a?.outcome === 'lies' || a?.outcome === 'undecided')
      && house.includes(a.voter));
    for (const a of soft) {
      const doubter = _quiet(plan.members.filter(m => house.includes(m) && m !== a.voter))[0];
      if (doubter) return { plan, voter: a.voter, doubter, outcome: a.outcome };
    }
  }
  return null;
}

/**
 * The argument inside the room.
 *
 * A 'refusing' stance is a member who told their own alliance no, and a
 * 'conflicted' one is a member who went along with it and hated the walk. The
 * operation records both and the house never heard either.
 */
const internalDissent = {
  id: 'plan-internal-dissent',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    const found = _dissenter(ctx, house);
    if (!found) return 0;
    const heat = (10 - pStats(found.voter).temperament) * 0.2;
    return _campaign(ctx, 9 + heat + (found.stance === 'refusing' ? 2.5 : 0));
  },
  fire(house, ctx, api) {
    const found = _dissenter(ctx, house);
    if (!found) return _fallback(`The room agrees with itself, which nobody trusts either.`, house.slice(0, 1), 'NO ARGUMENT');
    const { plan, voter, stance } = found;
    const org = plan.organizer;
    const p = pronouns(voter);

    const text = stance === 'refusing' ? _variant([
      `"I am not writing ${plan.target}'s name and I am not going to pretend to think about it." ${voter} says it to ${org} with the door open, which ${org} minds considerably more than the refusal.`,
      `${org} explains the plan to ${voter} twice, in slightly different words, as though the first version had been the problem. ${voter} says no both times and does not offer a third opportunity.`,
      `${voter} gave ${pronouns(voter).posAdj} word to somebody else before this room ever met, and tells ${org} exactly that. ${org} points out that the somebody else will not be here to appreciate it.`,
      `It is not really about ${plan.target}. ${voter} has decided ${org} makes decisions and then holds meetings, and this is the meeting where ${p.sub} ${p.sub === 'they' ? 'say' : 'says'} so.`,
    ], ctx, org, voter, plan.target) : _variant([
      `${voter} is voting with the room and wants ${org} to know it costs something. ${org} thanks ${p.obj}. It is not the tone ${voter} wanted.`,
      `"You are asking me to do it, so I will do it. Do not tell me it is the obvious move." ${voter} and ${org} go around it twice before ${voter} walks out mid-sentence.`,
      `${org} keeps saying ${plan.target} is the bigger threat. ${voter} keeps saying that is not the part ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} arguing about, and neither of them ever gets to the part ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} arguing about.`,
      `${voter} agrees to the vote and then keeps talking, which is how ${org} learns this was a concession and not a decision.`,
    ], ctx, org, voter, plan.target);

    api.addBond(org, voter, stance === 'refusing' ? -0.9 : -0.5);
    api.remember(org, voter, 'argued-in-the-room', stance === 'refusing' ? 2 : 1,
      { about: `the vote against ${plan.target}`, stance });
    api.suspicion(org, voter, stance === 'refusing' ? 0.9 : 0.4);
    return { text, players: [org, voter],
      badgeText: stance === 'refusing' ? 'SAID NO TO THE ROOM' : 'GOING ALONG WITH IT',
      badgeClass: stance === 'refusing' ? 'red' : 'grey' };
  },
};

function _dissenter(ctx, house) {
  for (const plan of _plans(ctx, house)) {
    const s = plan.stances.find(x => (x?.stance === 'refusing' || x?.stance === 'conflicted')
      && house.includes(x.voter) && x.voter !== plan.organizer);
    if (s) return { plan, voter: s.voter, stance: s.stance };
  }
  return null;
}

/**
 * The moment a swing vote works out what it is.
 *
 * Being wanted by two rooms is the strongest position in the format and it
 * arrives without announcement — you notice that everybody is being unusually
 * pleasant, and then you notice why.
 */
const swingCourtedTwice = {
  id: 'plan-swing-courted-twice',
  category: 'social',
  location: 'backyard',
  weight(house, ctx) {
    const found = _swing(ctx, house);
    if (!found) return 0;
    return _campaign(ctx, (found.both ? 8 : 5) + pStats(found.voter).intuition * 0.2);
  },
  fire(house, ctx, api) {
    const found = _swing(ctx, house);
    if (!found) return _fallback(`Nobody is anybody's swing this week.`, house.slice(0, 1), 'NO SWING');
    const { voter, plans, both } = found;
    const a = plans[0];
    const b = plans[1] || null;
    const p = pronouns(voter);

    const text = both && b ? _variant([
      `${voter} does the arithmetic in the hammock and comes out of it changed. ${a.organizer} needs ${p.obj}. ${b.organizer} needs ${p.obj}. Neither of them can afford to be the one who found out ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} lying.`,
      `Two separate people have brought ${voter} coffee ${p.sub} did not ask for. ${voter} works out somewhere around the second cup that ${a.organizer} and ${b.organizer} are counting the same vote and it is ${p.posAdj}.`,
      `"They both need me." ${voter} says it out loud, alone, testing whether it sounds as good as it feels. It does.`,
      `${voter} has spent this season being told what the house is doing. This is the first week the house has needed to be told something by ${p.obj}, and ${p.sub} ${p.sub === 'they' ? 'notice' : 'notices'} the difference immediately.`,
    ], ctx, voter, a.organizer, b.organizer) : _variant([
      `${a.organizer}'s count does not reach without ${voter}, and ${voter} has finally noticed how carefully ${a.organizer} has been talking to ${p.obj} all week.`,
      `${voter} was pitched on ${a.target} and has not answered. Three days later nobody has pushed, which tells ${voter} more about ${p.posAdj} value than any pitch would have.`,
      `The room is one short and everybody in it knows which one. ${voter} works it out about an hour after they do and spends the rest of the evening being extremely relaxed.`,
      `${voter} counts it the way ${a.organizer} must have counted it, gets the same number, and understands that ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} the number.`,
    ], ctx, voter, a.organizer, a.target);

    // Leverage plays well and everybody can see it being enjoyed.
    api.popDelta(voter, 1);
    api.remember(voter, a.organizer, 'needs-my-vote', 2,
      { about: `the count against ${a.target}`, alsoCourtedBy: b?.organizer || null });
    if (b) api.remember(voter, b.organizer, 'needs-my-vote', 2, { about: `the count against ${b.target}` });
    api.suspicion(voter, a.organizer, 0.4);
    return { text, players: [voter, a.organizer, b?.organizer].filter(Boolean),
      badgeText: both ? 'THE NUMBER BOTH SIDES NEED' : 'WORTH SOMETHING THIS WEEK',
      badgeClass: 'gold' };
  },
};

function _swing(ctx, house) {
  const plans = _plans(ctx, house);
  if (!plans.length) return null;
  const claims = new Map();
  for (const plan of plans) {
    for (const name of _claimed(plan)) {
      if (!house.includes(name)) continue;
      if (!claims.has(name)) claims.set(name, []);
      const list = claims.get(name);
      if (!list.includes(plan)) list.push(plan);
    }
  }
  const doubles = [...claims.entries()].filter(([, list]) => list.length >= 2);
  if (doubles.length) {
    const name = _quiet(doubles.map(([n]) => n))[0];
    return { voter: name, plans: claims.get(name).slice(0, 2), both: true };
  }
  // A room that is short is a room with a price, and the person it is short by
  // is standing right there. Same story, one alliance.
  for (const plan of plans) {
    if (!(plan.needed > 0)) continue;
    const open = plan.approaches.find(a => house.includes(a?.voter) && a.outcome !== 'agrees');
    if (open) return { voter: open.voter, plans: [plan], both: false };
  }
  return null;
}

// ULTRA-RARE: needs two alliances fielding plans in the same week AND an
// overlapping vote between them. Common on the real show, uncommon in a house
// that often supports only one organised room — kept because when two blocs do
// exist, the vote they both counted is the week.
const competingCounts = {
  id: 'plan-competing-counts',
  category: 'deals',
  location: 'living-room',
  weight(house, ctx) {
    const found = _doubleCount(ctx, house);
    if (!found) return 0;
    return _campaign(ctx, 7 + (found.a.target !== found.b.target ? 3 : 0));
  },
  fire(house, ctx, api) {
    const found = _doubleCount(ctx, house);
    if (!found) return _fallback(`There is only one room doing arithmetic this week.`, house.slice(0, 1), 'ONE ROOM');
    const { voter, a, b } = found;
    const split = a.target !== b.target;

    const text = split ? _variant([
      `${a.organizer} has ${voter} down for ${a.target}. ${b.organizer} has ${voter} down for ${b.target}. Both counts reach a majority, one of them is fiction, and neither organizer will know which until the vote is read.`,
      `Two rooms, two whiteboards nobody is allowed to write on, one name on both of them. ${voter} has told ${a.organizer} and ${b.organizer} slightly different versions of the same sentence and neither has compared notes.`,
      `${b.organizer} says "we have the votes" in front of ${a.organizer}, who also has the votes, using several of the same people. Neither of them asks the obvious follow-up.`,
      `The problem is not that ${voter} lied to anybody. The problem is that ${a.organizer} and ${b.organizer} both counted ${voter} without asking whether anybody else had, and a house only has so many people in it.`,
    ], ctx, a.organizer, b.organizer, voter) : _variant([
      `${a.organizer} and ${b.organizer} are both taking credit for ${voter}'s vote against ${a.target}. They are both wrong about whose it was and right about where it lands, which will do until it does not.`,
      `${voter} agreed with two separate rooms about the same name on the same afternoon. Both rooms went away believing they had recruited ${voter}. Only one of them had spoken to ${voter} first.`,
      `The counts match. That is the only reason nobody notices that ${a.organizer} and ${b.organizer} have been counting the same houseguest twice.`,
      `${a.organizer} lists the votes for ${a.target} in front of ${b.organizer} and includes ${voter}. ${b.organizer} says nothing, and starts wondering what else the two lists have in common.`,
    ], ctx, a.organizer, b.organizer, a.target);

    // Two organisers who have just found the edge of each other.
    api.suspicion(a.organizer, b.organizer, split ? 1.3 : 0.8);
    api.suspicion(b.organizer, a.organizer, split ? 1.3 : 0.8);
    api.remember(a.organizer, b.organizer, 'counted-my-vote', 2, { about: voter });
    if (split) api.addBond(a.organizer, b.organizer, -0.7);
    return { text, players: [a.organizer, b.organizer, voter],
      badgeText: split ? 'BOTH COUNTS CANNOT BE RIGHT' : 'COUNTED TWICE',
      badgeClass: split ? 'red' : 'blue' };
  },
};

function _doubleCount(ctx, house) {
  const plans = _plans(ctx, house);
  if (plans.length < 2) return null;
  // The operation records this explicitly: a voter claimed by two rooms gets an
  // 'elsewhere' stance in the room that lost them.
  for (const losing of plans) {
    const s = losing.stances.find(x => x?.stance === 'elsewhere' && house.includes(x.voter));
    if (!s) continue;
    const winner = plans.find(p => p !== losing
      && (p.alliance === s.with || (p.members || []).includes(s.voter)));
    if (winner && winner.organizer !== losing.organizer) {
      return { voter: s.voter, a: winner, b: losing };
    }
  }
  for (let i = 0; i < plans.length; i++) {
    for (let j = i + 1; j < plans.length; j++) {
      const A = plans[i]; const B = plans[j];
      if (A.organizer === B.organizer) continue;
      const bClaims = _claimed(B);
      const shared = _claimed(A).find(n => house.includes(n) && bClaims.includes(n)
        && n !== A.organizer && n !== B.organizer);
      if (shared) return { voter: shared, a: A, b: B };
    }
  }
  return null;
}

/**
 * "We are fine."
 *
 * plan.expected counts everybody who said yes, including the ones who did not
 * mean it; plan.locked counts only the votes the room could take to the bank.
 * The gap between those two numbers is every blindside in the format's
 * history, and the organiser is standing on the wrong side of it sounding
 * relaxed.
 */
const organizerOverconfident = {
  id: 'plan-organizer-overconfident',
  category: 'deals',
  location: 'hoh-room',
  weight(house, ctx) {
    const plan = _plans(ctx, house).find(p => p.expected >= p.majority && p.locked < p.majority
      && _lieutenant(p, house));
    if (!plan) return 0;
    const air = plan.expected - plan.locked;
    return _campaign(ctx, 5 + air * 1.4);
  },
  fire(house, ctx, api) {
    const plan = _plans(ctx, house).find(p => p.expected >= p.majority && p.locked < p.majority
      && _lieutenant(p, house));
    if (!plan) return _fallback(`Nobody is relaxed enough about anything to be worth filming.`, house.slice(0, 1), 'NOBODY RELAXES');
    const org = plan.organizer;
    const lieutenant = _lieutenant(plan, house);
    const air = plan.expected - plan.locked;
    const p = pronouns(lieutenant);

    const text = _variant([
      `"It is done. ${plan.target} is gone and we can stop talking about it." ${org} says it lying down. ${lieutenant} is still sitting up, because ${plan.expected} people said yes and only ${plan.locked} of them are people ${p.sub} would bet on.`,
      `${org} has started talking about next week. ${lieutenant} is still on this one — ${air === 1 ? 'one of those votes' : `${air} of those votes`} is somebody who said yes in a corridor, and corridors are where people say yes to get past you.`,
      `"You are counting the maybes as votes." ${lieutenant} says it once, quietly, and ${org} laughs and says the maybes are votes. Neither of them brings it up again, which is the part that will matter.`,
      `${org} is comfortable and ${lieutenant} cannot work out how. The room has ${plan.locked} it can prove and ${plan.expected} it can hope for, and ${org} has been saying the second number all day.`,
    ], ctx, org, lieutenant, plan.target);

    api.remember(lieutenant, org, 'counting-yes-as-locked', 2,
      { about: `${plan.expected} claimed, ${plan.locked} certain, against ${plan.target}` });
    api.addBond(org, lieutenant, 0.3);
    api.suspicion(lieutenant, org, 0.5);
    return { text, players: [org, lieutenant],
      badgeText: `${plan.locked} LOCKED OF ${plan.expected}`, badgeClass: 'red' };
  },
};

/**
 * A refusal does not stay in the room it was made in.
 *
 * The one outcome recruiters never plan for: the person who says no walks
 * straight out and tells somebody the plan exists. It is the cheapest currency
 * in the house and the one thing a room cannot take back.
 */
const quietRefusalSpreads = {
  id: 'plan-quiet-refusal-spreads',
  category: 'social',
  location: 'pantry',
  weight(house, ctx) {
    const found = _refusalCarrier(ctx, house);
    if (!found) return 0;
    return _campaign(ctx, 13 + pStats(found.voter).loyalty * 0.15);
  },
  fire(house, ctx, api) {
    const found = _refusalCarrier(ctx, house);
    if (!found) return _fallback(`Everybody who said no this week said it and left it there.`, house.slice(0, 1), 'KEPT QUIET');
    const { plan, voter, warned } = found;
    const org = plan.organizer;
    const p = pronouns(voter);

    const text = _variant([
      `"I told them no and I am telling you it happened." ${voter} does not name every person in the room to ${warned}, only the one who runs it, which is the name that does the damage.`,
      `${voter} finds ${warned} in the pantry and does not bother with a preamble: there is a plan, it is ${org}'s, and the only reason ${warned} has not been asked is that ${warned} was never going to be.`,
      `${voter} said no when the plan was pitched and has been carrying it around since. ${warned} is the first person who asks a question ${p.sub} ${p.sub === 'they' ? 'want' : 'wants'} to answer honestly.`,
      `"How many people do you think have been asked?" ${voter} lets ${warned} guess, twice, and then says the real number. ${warned} stops making the sandwich.`,
    ], ctx, voter, warned, org);

    // The refusal was private. This is not.
    api.suspicion(warned, org, 1.3);
    api.remember(warned, org, 'runs-a-room-i-am-not-in', 2,
      { about: `the vote against ${plan.target}`, from: voter });
    api.addBond(voter, warned, 0.6);
    return { text, players: [voter, warned, org],
      badgeText: 'THE NO GETS AROUND', badgeClass: 'red' };
  },
};

function _refusalCarrier(ctx, house) {
  for (const plan of _plans(ctx, house)) {
    const refusals = plan.approaches.filter(a => a?.outcome === 'refuses' && house.includes(a.voter));
    for (const a of refusals) {
      const warned = _quiet(_outsiders(house, plan, a.voter, a.recruiter))[0];
      if (warned) return { plan, voter: a.voter, warned };
    }
  }
  return null;
}

/**
 * Pressing the liar.
 *
 * outcome 'lies' is the only thing in this engine the audience knows and the
 * house does not. So the scene cannot be a catch — it has to be a room getting
 * as close as a room can get and stopping one question short.
 */
const lieAlmostCaught = {
  id: 'plan-lie-almost-caught',
  category: 'deals',
  location: 'backyard',
  weight(house, ctx) {
    const found = _liarPress(ctx, house);
    if (!found) return 0;
    return _campaign(ctx, 12 + pStats(found.presser).intuition * 0.25);
  },
  fire(house, ctx, api) {
    const found = _liarPress(ctx, house);
    if (!found) return _fallback(`Nobody is being pressed on anything tonight.`, house.slice(0, 1), 'NO PRESSURE');
    const { plan, liar, presser } = found;
    const p = pronouns(liar);
    const smooth = pStats(liar).social + pStats(liar).strategic;

    const text = smooth >= 12 ? _variant([
      `"Say the name." ${presser} asks for it plainly and ${liar} says ${plan.target}'s name plainly back, and that is the end of it, because there is nothing after that question.`,
      `${presser} runs ${liar} through the coming vote twice, looking for the seam. ${liar} gives the same answer at the same speed both times, which is either honesty or a great deal of practice.`,
      `${liar} does not get defensive, which is what saves ${p.obj}. ${p.Sub} ${p.sub === 'they' ? 'ask' : 'asks'} ${presser} who else is wobbling, and by the end of it ${presser} is the one reassuring ${liar}.`,
      `${presser} has one question left and does not ask it, because ${liar} has just spent four minutes being reasonable and there is no polite version of "I think you are lying to me."`,
    ], ctx, presser, liar, plan.target) : _variant([
      `${liar} confirms it. ${presser} says "good" and keeps standing there a second too long, and ${liar} fills the silence, which is exactly what ${presser} was waiting to see.`,
      `"You are sure." "I am sure." ${liar} says it once more than ${presser} asked for, and ${presser} files that away without knowing what to do with it.`,
      `${presser} asks ${liar} about the vote in the middle of a conversation about something else. ${liar} gives the expected answer after a pause just long enough to notice.`,
      `The commitment holds. ${liar} walks away from ${presser} with ${p.posAdj} hands doing something they were not doing before, and ${presser} notices and has nothing to do with it.`,
    ], ctx, presser, liar, plan.target);

    api.suspicion(presser, liar, 0.8);
    api.remember(presser, liar, 'made-me-ask-twice', 1, { about: `the vote against ${plan.target}` });
    return { text, players: [presser, liar],
      badgeText: 'THE LINE HOLDS', badgeClass: 'grey' };
  },
};

function _liarPress(ctx, house) {
  for (const plan of _plans(ctx, house)) {
    const lies = plan.approaches.filter(a => a?.outcome === 'lies' && house.includes(a.voter));
    for (const a of lies) {
      const pool = plan.members.filter(m => house.includes(m) && m !== a.voter);
      if (!pool.length) continue;
      const presser = _quiet(pool).sort((x, y) => pStats(y).intuition - pStats(x).intuition)[0] || pool[0];
      return { plan, liar: a.voter, presser };
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// WHEN THE PLAN FAILS
// ══════════════════════════════════════════════════════════════════════

/**
 * The backdoor that never opened.
 *
 * The strategy has exactly one failure mode and the format has run it dozens
 * of times: the person the week was secretly built around gets picked to play
 * for the veto. If they win it they cannot be renominated and the whole
 * architecture — the pawn, the reassurances, the nominations that were never
 * about the nominees — collapses on the spot. Drawing in without winning is
 * the near miss, and the room still spends the afternoon sweating.
 */
const backdoorPlayedVeto = {
  id: 'backdoor-target-played-veto',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    const found = _backdoorMiss(ctx, house);
    if (!found) return 0;
    if (_spent('backdoor-target-played-veto', ctx)) return 0;
    const fits = ctx?.phase === 'post-veto' || ctx?.act === 'campaign';
    if (!fits) return 0;
    // Loud, per the rare-state rule: a backdoor target in the veto draw
    // happens a handful of times per SEASON, and at a polite weight it lost
    // every slot draw sixteen seasons running. When it happens, the room
    // spends the afternoon sweating — that is the story of the act.
    return band((found.won ? 14 : 12) * (ctx?.act === 'campaign' ? 0.7 : 1));
  },
  fire(house, ctx, api) {
    const found = _backdoorMiss(ctx, house);
    if (!found) return _fallback(`Whatever this week was built on is still standing.`, house.slice(0, 1), 'PLAN INTACT');
    _spend(this.id, ctx);
    const { target, hoh, won } = found;
    const confidant = closestTo(hoh, house.filter(n => n !== hoh && n !== target)) || null;
    const p = pronouns(hoh);

    const text = won ? _variant([
      `${target} was the entire point of the week and ${target} is now holding the veto. ${hoh} shuts the bedroom door${confidant ? ` with ${confidant} still inside` : ''} and says nothing for long enough that it stops being a pause.`,
      `The plan needed exactly one thing not to happen. ${hoh} watched it happen from six feet away and had to applaud.${confidant ? ` ${confidant} finds ${p.obj} afterwards, sitting on the end of the bed with ${p.posAdj} shoes still on.` : ''}`,
      `"So we cannot touch ${target}." ${hoh} says it as a fact rather than a question, and ${confidant ? `${confidant} does not have a version of the week that survives it either` : 'nobody in the room has an answer'}.`,
      `${hoh} built four days of reassurance around a nomination that was never going to be the nomination. ${target} pulled a chip out of a bag and undid all of it, and now somebody else has to go on the block.`,
    ], ctx, hoh, target) : _variant([
      `${target} drew to play and ${hoh} spent the entire competition doing arithmetic instead of watching. It did not land — but ${target} was one result away from walking out of this week untouchable.`,
      `The bag had six names in it and one of them ended the week. ${hoh} got away with it${confidant ? ` and tells ${confidant} so twice, which is once more than somebody who feels safe would` : ''}.`,
      `${target} played for the veto without ever knowing why the room went quiet when ${pronouns(target).posAdj} name came out. ${hoh} has not stopped thinking about it since.`,
      `It held. ${hoh} knows exactly how narrowly, ${confidant ? `and ${confidant} is the only person ${p.sub} will admit that to` : 'and has nobody to say it to'}.`,
    ], ctx, hoh, target);

    api.remember(hoh, target, won ? 'slipped-the-backdoor' : 'nearly-slipped-the-backdoor', won ? 3 : 1,
      { about: 'drew into the veto the week it was built around them' });
    api.suspicion(hoh, target, won ? 1.4 : 0.6);
    if (confidant) api.addBond(hoh, confidant, 0.5);
    return { text, players: [hoh, target, confidant].filter(Boolean),
      badgeText: won ? 'THE BACKDOOR IS DEAD' : 'ONE RESULT AWAY',
      badgeClass: won ? 'red' : 'grey' };
  },
};

function _backdoorMiss(ctx, house) {
  const target = ctx?.week?.plan?.backdoorTarget;
  const hoh = ctx?.hoh || ctx?.week?.hoh || null;
  if (!target || !hoh || target === hoh) return null;
  if (!house.includes(target) || !house.includes(hoh)) return null;
  const drew = (ctx?.week?.vetoDraw?.players || []).includes(target);
  const won = ctx?.week?.vetoWinner === target || ctx?.vetoWinner === target;
  if (!drew && !won) return null;
  return { target, hoh, won: !!won };
}

/**
 * The pawn who stopped being a pawn.
 *
 * Somebody sat down voluntarily because they were told the week was about the
 * other chair. When no room has a clean majority for the other nominee, that
 * promise is being kept by nobody in particular, and the person who asked has
 * to look at them across a kitchen.
 */
const pawnPanic = {
  id: 'pawn-in-danger-panic',
  category: 'deals',
  location: 'kitchen',
  weight(house, ctx) {
    const found = _pawnTrouble(ctx, house);
    if (!found) return 0;
    if (ctx?.act === 'campaign') return band(9);
    if (ctx?.act === 'eviction') return band(5);
    return 0;
  },
  fire(house, ctx, api) {
    const found = _pawnTrouble(ctx, house);
    if (!found) return _fallback(`Nobody sat down this week expecting to be safe.`, house.slice(0, 1), 'NO PAWN');
    const { pawn, asker, other } = found;
    const p = pronouns(asker);
    const guilt = isNice(asker) || pStats(asker).loyalty >= 6;

    const text = guilt ? _variant([
      `${asker} asked ${pawn} to sit down and told ${pronouns(pawn).obj} it was a formality. Now the campaign is underway, nobody can tell ${asker} with any confidence that the votes are on ${other}, and ${asker} has started avoiding the kitchen.`,
      `"You are fine." ${asker} says it to ${pawn} again, in the same words as before the nomination ceremony, and hears how much less it weighs the third time.`,
      `${asker} counts the room for ${pawn}'s sake rather than ${p.posAdj} own, twice, and gets a different answer each time. Neither answer is one ${p.sub} ${p.sub === 'they' ? 'want' : 'wants'} to say out loud.`,
      `${pawn} is not asking ${asker} for reassurance any more, which ${asker} finds significantly worse than being asked.`,
    ], ctx, asker, pawn, other) : _variant([
      `${asker} needs ${pawn} to stay calm for two more days, and works out somewhere around lunchtime that keeping ${pawn} calm and keeping ${pawn} in the house may not be the same job.`,
      `The count against ${other} is not there. ${asker} knows it, ${pawn} suspects it, and neither of them says it, because saying it makes ${asker} responsible for it.`,
      `"Has anybody actually told you they are voting ${other}?" ${pawn} asks it flatly. ${asker} lists three names and does not stand behind any of them.`,
      `${asker} put ${pawn} in that chair with an argument about numbers. The numbers have moved, and ${asker} keeps making the same argument anyway because the alternative is an apology.`,
    ], ctx, asker, pawn, other);

    // A debt that will be collected next week, one way or the other.
    api.addBond(asker, pawn, 0.7);
    api.remember(asker, pawn, 'owe-them-the-block', 2,
      { about: `asked ${pawn} to sit as a pawn against ${other}` });
    api.suspicion(pawn, asker, 0.6);
    return { text, players: [asker, pawn],
      badgeText: 'THE PAWN IS NOT SAFE', badgeClass: 'red' };
  },
};

function _pawnTrouble(ctx, house) {
  const pawn = ctx?.week?.plan?.pawn || ctx?.week?.pawnAsk?.pawn || null;
  const noms = (ctx?.nominees || ctx?.week?.finalNominees || []).filter(Boolean);
  if (!pawn || !house.includes(pawn) || !noms.includes(pawn)) return null;
  const other = noms.find(n => n !== pawn);
  if (!other) return null;
  const asker = ctx?.hoh || ctx?.week?.hoh || null;
  if (!asker || asker === pawn || !house.includes(asker)) return null;
  // Nobody is holding a clean majority for the other chair: the promise is
  // being kept by hope.
  const plans = _plans(ctx, house);
  const safe = plans.some(p => p.target === other && p.expected >= p.majority);
  if (safe) return null;
  return { pawn, asker, other };
}

/**
 * Blame, assembled before the evidence.
 *
 * week.votePlans records what each voter believes is about to happen against
 * what is actually about to happen, and `wrong` marks the people whose side is
 * about to lose while they still think it is winning. They do not know that
 * yet. What they know is that the room has felt strange all day, and the
 * cheapest way to handle that feeling is to decide in advance whose fault it
 * will have been.
 */
const blameForming = {
  id: 'plan-blame-forming',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    const found = _wrongRoom(ctx, house);
    if (!found) return 0;
    if (_spent('plan-blame-forming', ctx)) return 0;
    return _evictionNight(ctx, 8 + (10 - pStats(found.blamer).temperament) * 0.2);
  },
  fire(house, ctx, api) {
    const found = _wrongRoom(ctx, house);
    if (!found) return _fallback(`Nobody has anything to pre-blame anybody for.`, house.slice(0, 1), 'NO BLAME');
    _spend(this.id, ctx);
    const { blamer, weak, target } = found;
    const p = pronouns(blamer);

    const text = _variant([
      `Nobody has voted yet and ${blamer} has already decided who lost it. "${weak} has been strange for two days." ${p.Sub} ${p.sub === 'they' ? 'say' : 'says'} it to the bedroom in general, so that it is on the record before the record exists.`,
      `${blamer} does not think the vote is going wrong. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} simply started building the sentence ${p.sub} would need if it did, and ${weak}'s name is in it.`,
      `"If this goes sideways it is ${weak}." ${blamer} says it early, quietly, to one person, which is how a thing becomes something everybody always thought.`,
      `${blamer} has counted ${pronouns(blamer).posAdj} side to a majority four separate times today and still feels wrong about it, and being wrong about ${weak} is easier than being wrong about the count.`,
    ], ctx, blamer, weak, target);

    api.suspicion(blamer, weak, 1.4);
    api.remember(blamer, weak, 'blamed-before-the-vote', 2,
      { about: `the count against ${target}`, proven: false });
    api.addBond(blamer, weak, -0.5);
    return { text, players: [blamer, weak],
      badgeText: 'BLAME BEFORE THE VOTE', badgeClass: 'red' };
  },
};

function _wrongRoom(ctx, house) {
  const all = ctx?.week?.votePlans || [];
  const wrong = all.filter(v => v && v.wrong && v.confident && house.includes(v.voter));
  if (!wrong.length) return null;
  const plans = _plans(ctx, house);
  // Every confident-and-wrong voter is a candidate, not just the quietest —
  // taking only the first meant a blamer with nobody plausible to blame killed
  // the event outright, when the person standing next to them was right there.
  for (const blamer of _quiet(wrong.map(v => v.voter))) {
    const record = wrong.find(v => v.voter === blamer);
    const target = record?.target;
    if (!target) continue;
    // Whoever the room already had reason to doubt: a soft stance first, then a
    // soft approach, then simply the least loyal person voting the same way.
    const plan = plans.find(p => p.target === target) || null;
    let weak = null;
    if (plan) {
      const soft = [
        ...plan.stances.filter(s => ['pulled', 'conflicted', 'refusing'].includes(s?.stance)).map(s => s.voter),
        ...plan.approaches.filter(a => ['undecided', 'lies', 'refuses'].includes(a?.outcome)).map(a => a.voter),
      ].filter(n => house.includes(n) && n !== blamer);
      weak = _quiet(soft)[0] || null;
    }
    if (!weak) {
      const same = all
        .filter(v => v.target === target && v.voter !== blamer && house.includes(v.voter))
        .map(v => v.voter);
      weak = _quiet(same).sort((a, b) => pStats(a).loyalty - pStats(b).loyalty)[0] || null;
    }
    // Last resort: the vote is going wrong and somebody has to wear it. The
    // person openly voting the other way is the obvious face for it.
    if (!weak) {
      const opposed = all.filter(v => v.target !== target && v.voter !== blamer
        && house.includes(v.voter)).map(v => v.voter);
      weak = _quiet(opposed)[0] || null;
    }
    if (weak) return { blamer, weak, target };
  }
  return null;
}

/**
 * The vote that was owned and did not arrive.
 *
 * Every ballot carries the chain: `assignment` is the room that claimed it and
 * for whom, `evict` is where it actually ended up. A gap between those two is
 * the flip, and eviction night is the only act where both halves exist. It
 * covers all three ways a room loses a vote it had counted — a claimed ballot
 * that moved, a yes that did not hold, and a lie that ran all the way to the
 * chair.
 */
const flipCollapses = {
  id: 'plan-flip-collapses',
  category: 'deals',
  location: 'diary-room',
  weight(house, ctx) {
    const found = _brokenVote(ctx, house);
    if (!found) return 0;
    return _evictionNight(ctx, found.kind === 'lied' ? 7 : 9);
  },
  fire(house, ctx, api) {
    const found = _brokenVote(ctx, house);
    if (!found) return _fallback(`Every vote that was promised this week was cast.`, house.slice(0, 1), 'COUNT HOLDS');
    const { plan, voter, kind } = found;
    const org = plan.organizer;
    const p = pronouns(voter);

    const text = kind === 'lied' ? _variant([
      `${voter} told ${org}'s room ${plan.target} and wrote something else, and the extraordinary part is that ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} not looked nervous once all day.`,
      `The room has ${voter} down as a yes. ${voter} decided on no as soon as the pitch ended and has spent the rest of the campaign making the yes look comfortable.`,
      `${org} counted ${voter}. ${voter} let ${pronouns(org).obj} count ${p.obj}. Only one of them knows that yet.`,
      `The lie was never in what ${voter} said. It was in how easy ${p.sub} made it for ${org} to stop asking.`,
    ], ctx, org, voter, plan.target) : _variant([
      `${voter} agreed to this before the campaigning started and the ballot does not say ${plan.target}. Somewhere between the room and the chair, somebody made a better case.`,
      `${org} put ${voter} in the count and left ${p.obj} there, which was the mistake. The vote ${org} was owed goes the other way and ${org} finds out with everybody else.`,
      `${voter} does not think of it as breaking anything. The week changed, the count changed, and nobody in that room ever asked ${p.obj} to promise it twice.`,
      `The flip is one vote. ${org} counted it as ${pronouns(org).posAdj}; ${voter} knew it was ${pronouns(voter).posAdj} all along. The difference between those two readings is the whole night.`,
    ], ctx, org, voter, plan.target);

    api.addBond(org, voter, -1.3);
    api.remember(org, voter, 'said-yes-and-did-not', 3,
      { about: `the vote against ${plan.target}`, kind });
    api.suspicion(org, voter, 1.8);
    return { text, players: [org, voter],
      badgeText: kind === 'lied' ? 'THE YES WAS NEVER REAL' : 'THE FLIP FELL APART',
      badgeClass: 'red' };
  },
};

function _brokenVote(ctx, house) {
  const ballots = ctx?.ballots || ctx?.week?.ballots || [];
  const plans = _plans(ctx, house);
  if (!Array.isArray(ballots) || !ballots.length || !plans.length) return null;
  const ballotOf = name => ballots.find(b => b?.voter === name) || null;
  for (const plan of plans) {
    for (const b of ballots) {
      if (!b?.voter || !house.includes(b.voter) || b.voter === plan.organizer) continue;
      if (b.assignment?.by === plan.alliance && b.assignment.target && b.evict
        && b.evict !== b.assignment.target) {
        return { plan, voter: b.voter, kind: 'flipped' };
      }
    }
    for (const a of plan.approaches) {
      if (!a?.voter || !house.includes(a.voter)) continue;
      const b = ballotOf(a.voter);
      if (!b?.evict || b.evict === plan.target) continue;
      if (a.outcome === 'agrees') return { plan, voter: a.voter, kind: 'flipped' };
      if (a.outcome === 'lies') return { plan, voter: a.voter, kind: 'lied' };
    }
  }
  return null;
}

/**
 * Friday morning with the person you could not evict.
 *
 * The room named them, counted for them, came up short, and now has to pass
 * them the milk. The survivor knows — an eviction aimed at you is the loudest
 * thing that can happen in here — and what they do about it depends entirely
 * on temperament: a short fuse comes back at the organiser, a long one files
 * it and waits.
 */
const targetSurvivesRegroup = {
  id: 'target-survives-regroup',
  category: 'deals',
  location: 'kitchen',
  weight(house, ctx) {
    const found = _survivor(ctx, house);
    if (!found) return 0;
    if (_spent('target-survives-regroup', ctx)) return 0;
    const early = ctx?.act === 'house' && (ctx?.phase === 'pre-hoh' || ctx?.phase === 'post-hoh');
    if (!early) return 0;
    return band(10);
  },
  fire(house, ctx, api, rng = Math.random) {
    const found = _survivor(ctx, house);
    if (!found) return _fallback(`Everybody the house went after last week went home.`, house.slice(0, 1), 'ALL CLEAR');
    _spend(this.id, ctx);
    const { survivor, org, plan } = found;
    const p = pronouns(survivor);
    const s = pStats(survivor);
    // Proportional, as everything here is: a short fuse and some nerve turns a
    // survival into a campaign. A patient one turns it into a file.
    const heat = (10 - s.temperament) * 0.09 + s.boldness * 0.03;
    const retaliates = rng() < Math.max(0.15, Math.min(0.85, heat));

    const text = retaliates ? _variant([
      `${survivor} makes toast for two and gives the second slice to ${org}, who did not ask for it. Neither of them mentions that, before the eviction, ${org} was counting the votes to send ${p.obj} home.`,
      `"You had four." ${survivor} says it to ${org} at the counter, pleasantly, with the numbers exactly right, and then asks whether ${org} wants coffee.`,
      `${survivor} survived and has not stopped smiling since, which ${org} finds considerably worse than being shouted at. The smile has a name in it and both of them know whose.`,
      `${org} tried to end ${survivor}'s season and did not, and now has to live in a house where ${survivor} gets to decide what happens next. ${survivor} takes the whole morning to make that point without saying a word of it.`,
    ], ctx, survivor, org) : _variant([
      `${survivor} is polite to ${org} all morning, which is the most alarming thing ${org} has seen this week.`,
      `Nobody has told ${survivor} anything. ${survivor} still knows exactly which room it came out of, and has decided that knowing quietly is worth more than saying it.`,
      `${org} keeps finding reasons to be wherever ${survivor} is not. ${survivor} notices, files it, and goes back to the washing up.`,
      `"No hard feelings." ${survivor} says it to ${org} and means the first word considerably more than the second.`,
    ], ctx, survivor, org);

    api.suspicion(survivor, org, 1.6);
    api.suspicion(org, survivor, 1.2);
    api.remember(survivor, org, 'called-the-vote-on-me', 3,
      { about: `${plan.alliance} counted the votes to evict ${survivor}` });
    api.remember(org, survivor, 'survived-my-count', 2, { about: `week ${plan.week || ''}`.trim() });
    if (retaliates) api.setTarget(survivor, org, `counted the votes to send me home and came up short`);
    return { text, players: [survivor, org],
      badgeText: retaliates ? 'STILL HERE, AND COUNTING' : 'STILL HERE',
      badgeClass: retaliates ? 'red' : 'blue' };
  },
};

function _survivor(ctx, house) {
  const weeks = gs.bb?.weeks || [];
  const last = weeks[weeks.length - 1];
  if (!last || !last.evicted) return null;
  // Only the morning after. A week-old survival is somebody else's story.
  if ((ctx?.week?.num || 0) !== (last.num || 0) + 1) return null;
  for (const plan of last.voteOperation?.plans || []) {
    if (!plan?.target || !plan.organizer) continue;
    if (plan.target === last.evicted) continue;         // the plan worked
    if (!house.includes(plan.target) || !house.includes(plan.organizer)) continue;
    if (plan.target === plan.organizer) continue;
    return { survivor: plan.target, org: plan.organizer, plan: { ...plan, week: last.num } };
  }
  return null;
}

export const VOTE_PLAN_EVENTS = [
  meetingSeen, countOnFingers, recruitReport, falseCommitmentDoubt, internalDissent,
  swingCourtedTwice, competingCounts, organizerOverconfident, quietRefusalSpreads,
  lieAlmostCaught, backdoorPlayedVeto, pawnPanic, blameForming, flipCollapses,
  targetSurvivesRegroup,
];
