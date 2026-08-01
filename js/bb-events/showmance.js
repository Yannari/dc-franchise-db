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
    if (!pair || house.length < 5 || _once('showmance-hiding-it', ctx)) return 0;
    // Only early. After a fortnight nobody is pretending.
    const age = (ctx?.week?.num || 0) - (pair.sh.sparkEp || 0);
    return age <= 2 ? _fit(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const watcher = _quiet(_others(house, a, b))[0];
    const p = pronouns(a);
    const text = _variant([
      `${a} and ${b} have agreed to keep it quiet. They arrive at breakfast four minutes apart, which is the least subtle thing either of them has ever done.`,
      `"Nobody knows." ${a} says it with total confidence to ${b}, who agrees. ${watcher} has known since the second night and has already told two people.`,
      `They are careful in every room with a camera in it, which is every room. ${watcher} watches ${a} not look at ${b} for a full minute and understands exactly what that is.`,
      `${a} and ${b} think the whispering is the discreet part. The discreet part would have been not going to the same place to whisper.`,
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
      `${teller} tries to tell ${deaf} what ${other} has been saying in other rooms. ${deaf} listens politely and does not believe a word of it, and ${teller} learns not to bother again.`,
      `"I'm not asking you to break up with ${other}. I'm asking you to count." ${deaf} hears an attack on ${other} and stops listening at the word count.`,
      `${teller} has real information and the wrong person to give it to. ${deaf} repeats it to ${other} within the hour, which is exactly what ${teller} was afraid of.`,
      `Everything ${teller} says about ${other} is true. None of it survives contact with ${deaf}, who has decided in advance which side of this ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} on.`,
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
      `${left} used to have somebody to talk to at night. ${closer} is not available at night any more, and ${left} has started noticing exactly how unavailable.`,
      `"I'm happy for you." ${left} means it and also does not, and both of those are visible from across the room.`,
      `${left} waits for a moment alone with ${closer} that does not come. By the third day ${p.sub} ${p.sub === 'they' ? 'stop' : 'stops'} waiting and starts talking to other people instead — which is the part that will matter.`,
      `Nobody has done anything to ${left}. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} simply been demoted without a conversation, and there is nothing to raise without sounding like this.`,
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
      `${safe} spends the week campaigning for ${atRisk} openly, to everybody, without pretending it is strategy. It is the most honest thing anybody does all week and it costs ${p.obj} two friendships.`,
      `"If ${atRisk} goes, I'm useless to all of you anyway." ${safe} says the quiet part in a room of six people, and every one of them writes it down.`,
      `${safe} could quietly keep ${p.posAdj} own game clean this week. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not, and by Thursday everybody knows exactly where ${p.sub} ${p.sub === 'they' ? 'stand' : 'stands'}.`,
    ], ctx, safe, atRisk) : _variant([
      `${safe} tells ${atRisk} everything will be fine and does not work a single vote toward making it so. It is the right move and ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} exactly what it is.`,
      `${safe} campaigns for ${atRisk} where ${atRisk} can hear it and stops the moment ${p.sub} ${p.sub === 'they' ? 'leave' : 'leaves'} the room.`,
      `"I'm doing everything I can." ${safe} is not doing everything ${p.sub} can. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} decided that a week of being sad is cheaper than a week of being obvious.`,
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
      `${a} and ${b} have an argument in a house with no doors. It lasts eleven minutes and is witnessed, in whole or in part, by everybody.`,
      `It starts about a conversation ${b} had with somebody else and stops being about that within a minute. ${audience[0] || 'The house'} finds a reason to be in another room and does not entirely succeed.`,
      `"You're playing me." ${a} does not believe it and says it anyway, because it is three in the morning and being right is not the point.`,
      `They keep their voices down, which somehow makes it worse to be in the next bed for. ${audience[0] || 'Somebody'} hears most of it and repeats a version of it by lunchtime.`,
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
      `${a} and ${b} decide how they are voting in about forty seconds, in bed, before anybody has pitched either of them. Everything the house says to them for the next three days is decoration.`,
      `Somebody works ${a} for an hour and gets nowhere, then works ${b} for an hour and gets the same nowhere in the same words.`,
      `"We'll do whatever you're doing." ${b} says it to ${a} without appearing to think about it, and ${a} does not appear to notice that ${p.sub} has just been handed a vote for nothing.`,
      `${observer} pitches ${a}, watches ${a} glance at ${b}, and understands that this was never a conversation with one person.`,
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
