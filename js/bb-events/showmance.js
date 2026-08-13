// ══════════════════════════════════════════════════════════════════════
// bb-events/showmance.js — the couple's own week
// ══════════════════════════════════════════════════════════════════════
//
// A hundred and twenty-three events in this library and, before this file, two
// of them mentioned a showmance: one line in the social file and the kiss trap.
// So a couple could form, be noticed, be targeted as a bloc and be separated by
// an eviction without ever once having a scene of their own. Measured, a safe
// houseguest in a showmance carried 0.95x the beats of a safe houseguest in
// nothing — being in the most televised relationship in the format made you
// very slightly LESS visible, because there was nothing to be visible in.
//
// Weighting could not fix that. Casting order only chooses between people an
// event is already willing to use, and no event was willing. This is the fix:
// content.
//
// The arc the format actually runs, which is the arc these follow:
//
//   they think nobody knows      — everybody knows
//   the blind spot               — one of them stops hearing anything bad
//   somebody else wants in       — or resents being third
//   the game asks for the heart   — vote against their person, or do not
//   the fight                    — in a house with no doors and no privacy
//   one of them is on the block   — and the other has to choose publicly
//
// Everything here is gated on a live showmance and everything has a cost. A
// couple is two votes, a blind spot and a target, and the events say so.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, closestTo, furthestFrom, beatsInvolving, spotlightOrder,
  suspicionOf, targetOf, threat, archetype, romanceOn,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _quiet = pool => spotlightOrder(pool);

/** Live couples, both halves still in the house. */
function _couples(house) {
  if (!romanceOn()) return [];
  return (gs.showmances || [])
    .filter(sh => sh.phase !== 'broken-up'
      && (sh.players || []).length === 2
      && sh.players.every(n => house.includes(n)))
    .map(sh => ({ a: sh.players[0], b: sh.players[1], sh }));
}

/** The couple with the least screen time, so one pair does not carry the season. */
function _couple(house) {
  const all = _couples(house);
  if (!all.length) return null;
  return all.sort((x, y) =>
    (beatsInvolving(x.a) + beatsInvolving(x.b)) - (beatsInvolving(y.a) + beatsInvolving(y.b)))[0];
}

/** Never during a ceremony — those acts belong to the ceremony. */
const _fit = (ctx, value) => {
  if (['nominations', 'veto-ceremony'].includes(ctx?.act)) return 0;
  return band(value * (ctx?.act === 'eviction' ? 0.3 : ctx?.act === 'campaign' ? 0.7 : 1));
};

const _once = (id, ctx) => !!ctx?.week?._showmanceFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._showmanceFired ||= {})[id] = true; };

const _noms = ctx => ((ctx?.nominees && ctx.nominees.length ? ctx.nominees
  : (ctx?.week?.finalNominees || [])) || []).filter(Boolean);

// ── they think nobody knows ───────────────────────────────────────────

const hidingIt = {
  id: 'showmance-hiding-it',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || house.length < 5 || _once('showmance-hiding-it', ctx)
      || ctx?.week?._showmanceConcealment) return 0;
    // Only early. After a fortnight nobody is pretending.
    const age = (ctx?.week?.num || 0) - (pair.sh.sparkEp || 0);
    return age <= 2 ? _fit(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    if (ctx?.week) ctx.week._showmanceConcealment = this.id;
    const watcher = _quiet(_others(house, a, b))[0];
    const p = pronouns(a);
    const text = _variant([
      `${a} and ${b} agree to keep the relationship quiet, then arrive at breakfast separately without looking at each other once. ${watcher} notices the effort immediately.`,
      `“Nobody knows,” ${a} tells ${b}. Across the bedroom, ${watcher} pretends to search for a shirt and hears the entire conversation.`,
      `${a} and ${b} avoid sitting together whenever other people are around. ${watcher} notices they still leave every room together.`,
      `${a} and ${b} wait until the bedroom empties before whispering. ${watcher} returns for a forgotten water bottle and finds them sharing the same pillow.`,
      `${b} moves away when ${watcher} enters the room. ${a} overcorrects by starting a loud conversation about laundry, convincing nobody.`,
      `${a} tells ${watcher} that ${b} is “just a friend.” ${watcher} nods, then watches ${a} save the seat beside ${pronouns(a).obj} for ${b}.`,
    ], ctx, a, b);

    api.addBond(a, b, 0.7);
    api.suspicion(watcher, a, 0.5);
    api.suspicion(watcher, b, 0.5);
    api.remember(watcher, a, 'they-are-a-pair', 1, { about: b });
    return { text, players: [a, b, watcher], badgeText: 'NOBODY KNOWS', badgeClass: 'gold' };
  },
};

// ── the blind spot ────────────────────────────────────────────────────

const blindSpot = {
  id: 'showmance-blind-spot',
  category: 'deals',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-blind-spot', ctx)) return 0;
    // Somebody has to be trying to tell them something.
    const teller = _others(house, pair.a, pair.b)
      .find(n => suspicionOf(n, pair.a) >= 1.5 || suspicionOf(n, pair.b) >= 1.5);
    return teller ? _fit(ctx, 9) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const teller = _quiet(_others(house, a, b))
      .find(n => suspicionOf(n, a) >= 1.5 || suspicionOf(n, b) >= 1.5) || _others(house, a, b)[0];
    // Which half is deaf about the other. Loyalty and low strategic makes it
    // worse; this is the mechanism that costs people the game.
    const deaf = pStats(a).loyalty >= pStats(b).loyalty ? a : b;
    const other = deaf === a ? b : a;
    const p = pronouns(deaf);

    const text = _variant([
      `${teller} tells ${deaf} what ${other} has been saying in other rooms. ${deaf} asks for details, rejects each one and ends the conversation by defending ${other}.`,
      `“I'm not asking you to break up with ${other}. I'm asking you to count.” ${deaf} hears the first part and treats everything after it as an attack.`,
      `${teller} gives ${deaf} information that was meant to stay away from ${other}. The next time ${teller} enters the kitchen, ${other} is waiting with the exact wording.`,
      `${teller} names a promise ${other} made to somebody else. ${deaf} explains it away before ${teller} finishes describing what happened.`,
      `${teller} asks ${deaf} to imagine making this decision without ${other}. ${deaf} says there is no reason to imagine that and gets up.`,
      `${deaf} listens while ${teller} lays out the problem with ${other}'s game. Then ${p.sub} ${p.sub === 'they' ? 'take' : 'takes'} the warning straight back to ${other} and identifies the source.`,
    ], ctx, deaf, teller);

    // The cost is information: they stop being told things, which is how a
    // showmance actually ends somebody's game.
    api.addBond(teller, deaf, -0.8);
    api.remember(teller, deaf, 'cannot-be-told-anything', 2, { about: other });
    api.addBond(deaf, other, 0.5);
    // And the other half now knows who is talking about them.
    api.suspicion(other, teller, 1.2);
    return { text, players: [deaf, teller, other], badgeText: 'WILL NOT HEAR IT', badgeClass: 'orange' };
  },
};

// ── somebody else wants in, or resents being out ──────────────────────

const thirdWheel = {
  id: 'showmance-third-wheel',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || house.length < 6 || _once('showmance-third-wheel', ctx)) return 0;
    // Somebody who was close to one of them before the couple existed.
    const left = _others(house, pair.a, pair.b)
      .find(n => bond(n, pair.a) >= 3 || bond(n, pair.b) >= 3);
    return left ? _fit(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const left = _quiet(_others(house, a, b))
      .find(n => bond(n, a) >= 3 || bond(n, b) >= 3) || _others(house, a, b)[0];
    const closer = bond(left, a) >= bond(left, b) ? a : b;
    const p = pronouns(left);

    const text = _variant([
      `${left} used to end every night talking with ${closer}. Now ${closer} is always beside somebody else, and ${left} has stopped saving a seat.`,
      `“I'm happy for you,” ${left} tells ${closer}. The words are sincere; the silence afterward is not.`,
      `${left} waits for a private moment with ${closer}. When another evening passes without one, ${p.sub} ${p.sub === 'they' ? 'join' : 'joins'} a different group in the backyard.`,
      `${closer} promises ${left} they will catch up later, then follows the showmance upstairs. ${left} watches the door close and does not ask again.`,
      `${left} tries to tell ${closer} something important while the couple is together. ${closer} keeps checking the other person's reaction, so ${left} cuts the story short.`,
      `${left} jokes about becoming the third wheel. ${closer} laughs and says that is not true, then leaves ${left} alone to go find the other half of the couple.`,
    ], ctx, left, closer);

    api.addBond(left, closer, -1);
    api.remember(left, closer, 'chose-them-over-me', 2, {});
    // The demoted friend goes looking for a new home, which is how a couple
    // costs itself a vote without anybody arguing.
    const newFriend = _quiet(_others(house, a, b, left))[0];
    if (newFriend) api.addBond(left, newFriend, 0.9);
    return { text, players: [left, closer, newFriend].filter(Boolean),
      badgeText: 'DEMOTED', badgeClass: 'blue' };
  },
};

// ── the game asks for the heart ───────────────────────────────────────

const gameOverHeart = {
  id: 'showmance-game-vs-heart',
  category: 'deals',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-game-vs-heart', ctx)) return 0;
    // Only when one of them is actually in danger.
    const noms = _noms(ctx);
    const exposed = noms.includes(pair.a) || noms.includes(pair.b);
    return exposed ? _fit(ctx, 11) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const noms = _noms(ctx);
    const atRisk = noms.includes(a) ? a : b;
    const safe = atRisk === a ? b : a;
    const p = pronouns(safe);
    // Does the safe one burn their standing to campaign, or protect their game?
    const loyal = pStats(safe).loyalty >= 6 || bond(safe, atRisk) >= 6;

    const text = loyal ? _variant([
      `${safe} campaigns openly for ${atRisk}, even after an ally warns that the effort is making the pair look inseparable. ${safe} answers, “We are.”`,
      `“If ${atRisk} goes, you lose my vote too.” ${safe} says it in front of enough people that the threat reaches every room.`,
      `${safe} could distance ${p.ref} from ${atRisk}. Instead, ${p.sub} visits every undecided voter and makes the relationship part of the pitch.`,
      `${safe} asks people to judge ${atRisk} as a player rather than half of a couple. Nobody misses that ${safe} is staking ${p.posAdj} own game on the distinction.`,
      `${safe} is advised to campaign quietly. ${p.Sub} responds by pulling the next voter into the living room and asking, in front of witnesses, what it will take to keep ${atRisk}.`,
    ], ctx, safe, atRisk) : _variant([
      `${safe} tells ${atRisk} the votes are moving, then spends the day protecting relationships that might survive the eviction.`,
      `${safe} campaigns while ${atRisk} is in the room and changes the subject after ${atRisk} leaves. One voter notices both versions.`,
      `“I'm doing everything I can,” ${safe} says. Later, an ally offers one more person to approach and ${safe} says pushing harder would expose ${p.obj}.`,
      `${atRisk} asks who ${safe} has spoken to. ${safe} gives two names and avoids explaining that neither conversation included a real request.`,
      `${safe} decides that visibly saving ${atRisk} would make ${p.obj} the next target. The decision may be strategic, but ${atRisk} still spends the evening campaigning alone.`,
    ], ctx, safe, atRisk);

    if (loyal) {
      api.addBond(safe, atRisk, 1.6);
      api.remember(atRisk, safe, 'stood-up-for-me', 3, {});
      // Being publicly attached to a nominee is a target on your own back.
      _others(house, a, b).forEach(n => api.suspicion(n, safe, 0.7));
      api.popDelta(safe, 2);
    } else {
      api.addBond(safe, atRisk, -0.6);
      api.remember(atRisk, safe, 'let-me-sit-there', 2, {});
      api.popDelta(safe, -2);
    }
    return { text, players: [safe, atRisk],
      badgeText: loyal ? 'BURNS IT ALL FOR THEM' : 'PROTECTS THEIR OWN GAME',
      badgeClass: loyal ? 'gold' : 'grey' };
  },
};

// ── the fight ─────────────────────────────────────────────────────────

const theirFight = {
  id: 'showmance-fight',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-fight', ctx)) return 0;
    // Strain: a short fuse on either side, or a couple who have been at it a
    // while, or one of them under pressure.
    const heat = (10 - Math.min(pStats(pair.a).temperament, pStats(pair.b).temperament)) / 10;
    const age = Math.min(4, (ctx?.week?.num || 0) - (pair.sh.sparkEp || 0));
    return _fit(ctx, 3 + heat * 6 + age * 0.6);
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const audience = _quiet(_others(house, a, b)).slice(0, 2);
    const p = pronouns(a);

    const text = _variant([
      `${a} and ${b} try to argue quietly in the bedroom. The whispering becomes shouting, and people begin leaving with armfuls of clothes they did not need.`,
      `It starts with a conversation ${b} had with somebody else. ${a} brings up an older promise, ${b} brings up the vote, and ${audience[0] || 'the person in the next bed'} gives up pretending to sleep.`,
      `“You're playing me.” ${a} says it in anger. ${b} asks whether this is about the relationship or the game, and ${a} cannot separate the answer.`,
      `${a} and ${b} keep their voices low, forcing everyone in the bedroom to hear every word. ${audience[0] || 'Somebody'} quietly carries a pillow to another room.`,
      `${b} asks why ${a} questioned the relationship in front of other people. ${a} says ${b} made it public first, and neither can agree on what “it” means.`,
      `${a} walks away before saying something worse. ${b} follows, so the argument travels from the bedroom to the kitchen with an audience collecting behind it.`,
    ], ctx, a, b);

    api.addBond(a, b, -1.4);
    audience.forEach(n => {
      api.suspicion(n, a, 0.4);
      api.remember(n, a, 'saw-them-fight', 1, { about: b });
    });
    // A couple in trouble is a couple you can work on.
    const opportunist = audience.find(n => threat(n) > 0) || audience[0];
    if (opportunist) api.addBond(opportunist, b, 0.5);
    return { text, players: [a, b, ...audience].filter(Boolean),
      badgeText: 'THE HOUSE HEARS IT', badgeClass: 'red' };
  },
};

// ── two votes that arrive together ────────────────────────────────────

const votingTogether = {
  id: 'showmance-two-votes',
  category: 'deals',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-two-votes', ctx)) return 0;
    // The week's business, when there is business.
    return ['campaign', 'eviction', 'veto'].includes(ctx?.act) || ctx?.phase === 'post-veto'
      ? _fit(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const p = pronouns(a);
    const observer = _quiet(_others(house, a, b))[0];

    const text = _variant([
      `${a} and ${b} settle on the same vote before either nominee finishes campaigning. Every later pitch receives the same polite answer.`,
      `${observer} makes the case to ${a}, then tries ${b} and hears the same objection in nearly the same words.`,
      `“I'll vote however you're voting,” ${b} tells ${a}. ${a} accepts the extra vote without asking what ${b} wanted.`,
      `${observer} pitches ${a}. Before answering, ${a} looks across the room at ${b}, and ${observer} realizes the conversation has three people in it.`,
      `${a} and ${b} compare what each nominee offered and choose together. When ${observer} asks for separate answers, neither sees the point.`,
      `${observer} asks ${b} where the vote stands. ${b} says, “You should talk to ${a},” turning two houseguests into one stop on the campaign trail.`,
    ], ctx, a, b, observer);

    api.addBond(a, b, 0.6);
    // The point of a couple, to everybody else: it is not two people.
    if (observer) {
      api.suspicion(observer, a, 0.8);
      api.suspicion(observer, b, 0.8);
      api.remember(observer, a, 'votes-as-one', 2, { about: b });
    }
    return { text, players: [a, b, observer].filter(Boolean),
      badgeText: 'ONE VOTE, TWICE', badgeClass: 'orange' };
  },
};

export const SHOWMANCE_EVENTS = [
  hidingIt, blindSpot, thirdWheel, gameOverHeart, theirFight, votingTogether,
];
