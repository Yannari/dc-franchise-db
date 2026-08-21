// ══════════════════════════════════════════════════════════════════════
// bb-events/deals.js — promises, vote counts and the breaking of both
// ══════════════════════════════════════════════════════════════════════
//
// Where Big Brother is actually played. The ceremonies are the visible week and
// the social events are the texture; this is the file where somebody decides
// who is going home and then finds out whether the house agrees.
//
// Almost everything here writes a promise, reads one, or breaks one. That is
// the point: a deal only means something if it is on the record long enough to
// be honoured or betrayed later, so these lean hard on shared memory and
// intentions rather than on the moment.
//
// Conventions match the rest of the library: casting shared between weight()
// and fire() so they cannot disagree, proportional weights, act-aware, state
// changed only through `api`, text chosen deterministically.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { endgameDealsOf, dealBetween, tierOf, sincerityOf, isEndgameDeal, juryPactsOf } from '../bb/deals.js';
import { juryOpensAt } from '../bb/jury.js';
import {
  pStats, bond, perceived, hidden, band, bondFactor, closestTo, furthestFrom,
  trusts, dislikes, sharesAlliance, alliancesOf, grudge, remembers, wasPromised,
  suspicionOf, targetOf, targetsOf, isHunting, huntedBy, threat, biggestThreat, willScheme, deFactoAllies,
  isNice, isVillainous, archetype, trustOf, obligationOf, respectOf, dangerOf,
  resentmentOf, beatsInvolving, spotlightOrder, actFacts,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _leastSeen = pool => spotlightOrder(pool);
const _nominees = ctx => (ctx?.nominees || []).filter(Boolean);

/** Deal-making happens in the gaps, and hardest while the vote is live. */
function _actFit(ctx) {
  switch (ctx?.act) {
    case 'campaign': return 1.25;         // the whole act is deal-making
    case 'eviction': return 0.3;       // deals are done; somebody is leaving
    case 'nominations':
    case 'veto-ceremony': return 0.3;     // the ceremony owns its own act
    default: return 1;
  }
}
const _w = (value, ctx) => band(value * _actFit(ctx));

/** Voters who are not nominated and not the HOH — the people worth working. */
const _voters = (house, ctx) =>
  house.filter(n => n !== ctx?.hoh && !_nominees(ctx).includes(n));

// ── casting ───────────────────────────────────────────────────────────

function _pactPair(house, ctx) {
  const pool = _leastSeen(house);
  for (const a of pool) {
    const b = _others(house, a).find(n =>
      bond(a, n) >= 3 && !remembers(a, n, 'final-two') && trustOf(a, n) >= 0);
    if (b) return { a, b };
  }
  return null;
}

function _pitchPair(house, ctx) {
  const noms = _nominees(ctx);
  const voters = _voters(house, ctx);
  if (!noms.length || !voters.length) return null;
  const pitcher = _leastSeen(noms)[0];
  // Work the voter who is closest to persuadable: some warmth, not certainty.
  const mark = voters.sort((x, y) =>
    Math.abs(bond(pitcher, x) - 1) - Math.abs(bond(pitcher, y) - 1))[0];
  return mark ? { pitcher, mark } : null;
}

function _brokenPromise(house, ctx) {
  for (const victim of _leastSeen(house)) {
    const liar = _others(house, victim).find(n =>
      wasPromised(victim, n, ctx?.week?.num || 0) && (dislikes(victim, n) || isHunting(n, victim)));
    if (liar) return { victim, liar };
  }
  return null;
}

function _safetyPair(house, ctx) {
  if (!ctx?.hoh) return null;
  // ── THE PLAN IS PART OF THE PICK ──
  //
  // This chose the biggest non-nominated threat, blind — which is exactly who
  // the HOH is most likely to be PLANNING to nominate, so Joel shook hands on
  // "your name stays out of the box" and put Jules in the box the same week,
  // with nothing in the story owning the contradiction.
  //
  // Now the plan decides the shape. An HOH who would not scheme does not make
  // promises their own plan already breaks — they offer the deal to the
  // biggest threat they are NOT coming for. A schemer offered the same pair
  // makes the deal anyway, as a LIE the audience is told about, and the
  // nomination lands on it later with a debt attached.
  const planned = targetsOf(ctx.hoh);
  const pool = _others(house, ctx.hoh).filter(n => !_nominees(ctx).includes(n))
    .sort((a, b) => threat(b) - threat(a));
  const marked = pool.find(n => planned.includes(n));
  if (marked && willScheme(ctx.hoh)) return { hoh: ctx.hoh, other: marked, fake: true };
  const clean = pool.find(n => !planned.includes(n));
  return clean ? { hoh: ctx.hoh, other: clean, fake: false } : null;
}

/**
 * Two people close enough to say it out loud, who have not already said it.
 *
 * Checks the live pacts rather than generic promise memory: `remembers(a, b,
 * 'promise')` is true of any promise these two ever made, so keying on it would
 * silently exclude everybody who had ever agreed anything.
 */
function _juryPactPair(house, ctx) {
  for (const a of _leastSeen(house)) {
    const held = juryPactsOf(a).flatMap(d => d.players || []);
    const b = _others(house, a).find(n =>
      bond(a, n) >= 3 && !held.includes(n) && trustOf(a, n) >= 0);
    if (b) return { a, b };
  }
  return null;
}

function _defector(house, ctx) {
  for (const mark of _leastSeen(house)) {
    // A formal alliance if one exists, otherwise the people this houseguest is
    // aligned with in practice — Big Brother creates no named alliances yet.
    const allies = deFactoAllies(mark, house);
    if (allies.length < 2) continue;
    const outsider = _others(house, mark, ...allies).find(n =>
      willScheme(n) && bond(n, mark) > -2);
    if (outsider) return { mark, outsider, alliance: alliancesOf(mark)[0] || null, allies };
  }
  return null;
}

/**
 * Somebody working a vote they do not have yet.
 *
 * The other half of this pair is a FUTURE juror, not a seated one, and that is
 * not a compromise — jurors are sequestered, so nobody inside the house can
 * talk to one. Anything happening in here is necessarily prospective: you are
 * being careful with somebody precisely because they are going to leave before
 * you do. That is `plan.juryPlan`'s territory, kept deliberately separate from
 * the seated panel in bb/jury.js.
 *
 * The window was a hard-coded nine that ignored jurySize, so a season with a
 * jury of three started managing votes with nine people left and six evictions
 * still to go before any of them counted. It derives from the setting now — and
 * a season configured with NO jury never fires this at all, because there is no
 * vote at the end to be securing.
 */
function _juryPair(house, ctx) {
  const opens = juryOpensAt();
  if (!opens || house.length > opens) return null;
  const player = _leastSeen(house).find(n => pStats(n).strategic >= 5);
  if (!player) return null;
  const mark = _others(house, player).sort((a, b) => bond(player, a) - bond(player, b))[0];
  return mark ? { player, mark } : null;
}

// ── the events ────────────────────────────────────────────────────────

const finalTwo = {
  id: 'deals-final-two',
  category: 'deals',
  weight(house, ctx) {
    const pair = _pactPair(house, ctx);
    if (!pair) return 0;
    // A final two is worth making once the field is small enough to imagine.
    const late = house.length <= 10 ? 1.5 : house.length <= 13 ? 1 : 0.5;
    return _w(bondFactor(bond(pair.a, pair.b)) * late * 13, ctx);
  },
  fire(house, ctx, api) {
    const { a, b } = _pactPair(house, ctx);
    const p = pronouns(a);
    const text = _variant([
      `${a} says the words out loud — "final two, whatever happens" — and ${b} says them back. Neither of them writes anything down and both of them will remember the exact wording.`,
      `${a} asks ${b} whether what they have is really a final two. ${b} says it has been since the first time they discussed the end. They shake on it anyway.`,
      `“If it's us at the end, I'm not going to feel bad about beating you,” ${a} says. ${b} laughs. “You won't beat me.” They agree to get there together.`,
      `${a} has been circling this all week and finally asks. ${b} agrees so quickly that ${p.sub} wonders, briefly, how many other people have been asked the same thing.`,
    ], ctx, a, b);

    api.addBond(a, b, 1.6);
    // A final two is the strongest deal in the game; record it as one so the
    // alliance lifecycle can see it.
    api.sideDeal?.(a, b, 'f2', { reason: 'final two' });
    api.remember(a, b, 'final-two', 3, { week: ctx.week?.num || 0 });
    api.remember(b, a, 'final-two', 3, { week: ctx.week?.num || 0 });
    api.setTarget(a, biggestThreat(_others(house, a, b)) || furthestFrom(a, house), 'the deal needs a road');
    return { text, players: [a, b], badgeText: 'FINAL TWO', badgeClass: 'gold' };
  },
};

const votePitch = {
  id: 'deals-vote-pitch',
  category: 'deals',
  weight(house, ctx) {
    if (ctx?.act === 'eviction') return 0;
    const pair = _pitchPair(house, ctx);
    if (!pair) return 0;
    const s = pStats(pair.pitcher);
    return _w((s.social / 10) * (0.5 + s.strategic / 20) * 14, ctx);
  },
  fire(house, ctx, api) {
    const { pitcher, mark } = _pitchPair(house, ctx);
    const p = pronouns(pitcher);
    const other = _nominees(ctx).find(n => n !== pitcher);
    // Persuasion against judgement — proportional, and the relationship counts.
    const force = pStats(pitcher).social / 10 + bondFactor(bond(pitcher, mark)) * 0.6;
    const guard = pStats(mark).intuition / 10 + (trustOf(mark, other) > 2 ? 0.4 : 0);
    const lands = force > guard;

    const text = lands ? _variant([
      `${pitcher} tells ${mark} exactly who becomes the next target if ${pitcher} leaves. ${mark} asks for the names again and starts counting votes.`,
      `“You don't owe me anything. I'm asking anyway,” ${pitcher} says. ${mark} promises to think about it and stays to hear the rest of the pitch.`,
      `${pitcher} finds the one thing ${mark} is actually worried about and talks about that instead of about the vote. By the end ${mark} is the one making the argument.`,
      `It takes ${pitcher} four minutes and one very well-chosen name${other ? ` — ${other}'s` : ''} — and ${mark} stops nodding politely and starts nodding.`,
    ], ctx, pitcher, mark) : _variant([
      `${pitcher} makes the pitch and ${mark} listens to all of it with the patience people reserve for something they decided about days ago.`,
      `“I hear you,” ${mark} says. When ${pitcher} asks where their vote is going, ${mark} repeats the same answer.`,
      `${pitcher} pushes slightly too hard at the end, and watches ${mark}'s face close.`,
      `The pitch is good. ${mark} is simply not available to be pitched to, and both of them know it before ${pitcher} finishes.`,
    ], ctx, pitcher, mark);

    if (lands) {
      api.addBond(pitcher, mark, 1.1);
      api.remember(mark, pitcher, 'promise', 2, { promise: 'my vote, this week' });
    } else {
      api.addBond(pitcher, mark, -0.4);
      api.suspicion(mark, pitcher, 0.6);
    }
    return {
      text, players: [pitcher, mark],
      badgeText: lands ? 'PITCH LANDS' : 'PITCH REFUSED',
      badgeClass: lands ? 'green' : 'grey',
    };
  },
};

const brokenPromise = {
  id: 'deals-broken-promise',
  category: 'deals',
  weight(house, ctx) {
    const pair = _brokenPromise(house, ctx);
    if (!pair) return 0;
    return _w(band(6 + grudge(pair.victim, pair.liar) * 2), ctx);
  },
  fire(house, ctx, api) {
    const { victim, liar } = _brokenPromise(house, ctx);
    const p = pronouns(victim);
    const text = _variant([
      `${victim} confronts ${liar}: “You gave me your word.” ${liar} immediately starts explaining why the promise had to be broken.`,
      `The promise has been sitting between them since the day it was made. Today ${victim} puts it down, publicly, in front of two other people.`,
      `"I'm not angry," ${victim} tells ${liar}, and is plainly furious. Nobody in the room corrects ${p.obj}.`,
      `${liar} tries to explain what the promise had actually meant. ${victim} listens to the whole explanation and comes out of it certain of exactly one thing.`,
    ], ctx, victim, liar);

    api.addBond(victim, liar, -1.8);
    api.remember(victim, liar, 'broken-promise', 3, {});
    api.setTarget(victim, liar, 'gave me their word and did not keep it');
    // Watching a promise break teaches everyone something about the promiser.
    _others(house, victim, liar).forEach(w => {
      if (pStats(w).intuition >= 5) api.suspicion(w, liar, 0.9);
    });
    api.popDelta(liar, -1);
    return { text, players: [victim, liar], badgeText: 'PROMISE BROKEN', badgeClass: 'red' };
  },
};

const safetyDeal = {
  id: 'deals-safety',
  category: 'deals',
  location: 'hoh-room',
  weight(house, ctx) {
    // Cheapest gate first. This event can only happen before nominations, and
    // the pair scan behind it walks the house doing bond and threat lookups —
    // so asking the expensive question first meant paying for it on every beat
    // of the week to answer an event that was already ruled out. Measured at
    // 5.5ms per beat, about a sixth of the entire scheduler's cost.
    const beforeNominations = ctx?.phase === 'post-hoh' || ctx?.act === 'hoh';
    if (!beforeNominations) return 0;
    const pair = _safetyPair(house, ctx);
    if (!pair) return 0;
    // You buy safety from the person most able to take it from you.
    return _w(band(4 + threat(pair.other) * 0.5), ctx);
  },
  fire(house, ctx, api) {
    const { hoh, other, fake } = _safetyPair(house, ctx);
    const p = pronouns(other);
    const honest = !fake && !willScheme(hoh);
    // ── THE FAKE DEAL, TOLD AS ONE ──
    //
    // The audience is in on it — that is the whole pleasure of the scene — and
    // whether the MARK is depends on the same arithmetic as every other read
    // in this house: what they think of the HOH, against their own intuition.
    // High bond and low intuition shakes the hand smiling; the reverse takes
    // the deal knowing exactly what it is worth.
    if (fake) {
      const ph = pronouns(hoh);
      const fooled = perceived(other, hoh) + (pStats(hoh).social - 5) * 0.2
        - pStats(other).intuition * 0.25 > -0.5;
      const text = fooled ? _variant([
        `${hoh} tells ${other}, “You keep my name out of next week, and I keep yours out of the box.” They shake on it. ${hoh} already has ${other}'s name at the top of ${ph.posAdj} list, and nothing in ${ph.posAdj} face says so.`,
        `${other} leaves the HOH room with a deal and a good feeling. ${hoh} watches the door close and goes back to planning ${other}'s nomination.`,
        `The handshake is warm, the terms are clear, and exactly one of them intends to keep any of it.`,
      ], ctx, hoh, other) : _variant([
        `${hoh} offers safety. ${other} takes the deal, thanks ${ph.obj} — and starts packing a mental bag on the way downstairs. A promise from ${hoh} this week is a weather report, not a contract.`,
        `${other} shakes the hand, holds the eye contact a beat too long, and both of them understand the deal for what it is: a receipt to wave later.`,
        `“Sure,” ${other} says, “deal.” ${p.Sub} has counted the room. ${p.Sub} knows whose name is actually in ${hoh}'s head. Saying no would only move the date up.`,
      ], ctx, hoh, other);
      api.sideDeal?.(hoh, other, 'safety', { genuine: false, reason: 'one week of safety' });
      // The debt: when the nomination lands, this memory is what the fallout
      // reads — a PROVABLE broken promise, not a vibe.
      api.remember(other, hoh, 'promise', 3, { promise: 'one week of safety', fake: true });
      if (!fooled) api.suspicion(other, hoh, 1.4);
      else api.addBond(other, hoh, 0.6);
      api.popDelta?.(hoh, -0.5);
      return { text, players: [hoh, other],
        badgeText: fooled ? 'A LIE, SHAKEN ON' : 'BOTH KNOW BETTER',
        badgeClass: 'red' };
    }
    const text = _variant([
      `In the HOH room, ${other} offers one quiet week: no nomination now, no retaliation if ${other} wins next. ${hoh} repeats the terms before shaking on it.`,
      `${other} asks ${hoh} directly whether ${other} is going up. ${hoh} says no—if ${other} leaves ${hoh} alone next week. ${other} agrees before the offer can change.`,
      `${hoh} tells ${other}, “You keep my name out of next week, and I keep yours out of the box.” ${other} asks whether that includes a replacement nomination. It does. They shake on it.`,
      `${other} enters the HOH room expecting to plead. Instead, ${hoh} offers safety in exchange for one week without a shot coming back. ${other} accepts, then asks to hear the promise once more.`,
    ], ctx, hoh, other);

    api.addBond(hoh, other, 0.9);
    // A safety deal is a real deal, but a one-week one — genuine only when the
    // person offering it means it.
    api.sideDeal?.(hoh, other, 'safety', { genuine: honest, reason: 'one week of safety' });
    api.remember(other, hoh, 'promise', honest ? 2 : 3, { promise: 'one week of safety' });
    api.remember(hoh, other, 'promise', 2, { promise: 'one week of safety' });
    if (!honest) api.suspicion(other, hoh, 0.5);
    return { text, players: [hoh, other], badgeText: 'SAFETY DEAL', badgeClass: 'green' };
  },
};

const defectionOffer = {
  id: 'deals-defection',
  category: 'deals',
  weight(house, ctx) {
    const cast = _defector(house, ctx);
    if (!cast) return 0;
    // Recruiting from another alliance is worth more when yours is losing.
    const desperate = deFactoAllies(cast.outsider, house).length ? 1 : 1.5;
    return _w(band(7 * desperate), ctx);
  },
  fire(house, ctx, api) {
    const { mark, outsider, alliance, allies } = _defector(house, ctx);
    const p = pronouns(mark);
    const loyal = pStats(mark).loyalty >= 6 || isNice(mark);
    const text = loyal ? _variant([
      `${outsider} makes the offer and ${mark} turns it down without needing to think, then spends the rest of the night thinking about it.`,
      `"You're fourth in that group and you know it." ${mark} does not argue with the number. ${p.Sub} turns the offer down anyway, and ${outsider} leaves knowing loyalty—not ignorance—is keeping ${p.obj} there.`,
      `${mark} listens to the whole pitch out of politeness and reports most of it to ${alliance?.name || 'the others'} within the hour. Most of it.`,
      `${outsider} offers ${mark} a better seat in a group ${p.sub} trusts less. ${mark} says, “Fourth with people I know is still better than second with you.”`,
    ], ctx, mark, outsider) : _variant([
      `${outsider} lays out where ${mark} actually stands in that alliance, with numbers, and ${mark} does not enjoy how accurate it is.`,
      `"They'll take you to fourth and no further." It is true. ${mark} has known it for a while and has been waiting for somebody to say it out loud.`,
      `${mark} does not agree to anything. ${p.Sub} also does not say no, and ${outsider} leaves knowing which of those matters.`,
      `The offer is better than the position ${mark} has, and the only thing holding ${p.obj} in place was a habit ${p.sub} has just noticed.`,
    ], ctx, mark, outsider);

    if (loyal) {
      api.addBond(mark, outsider, -0.5);
      api.suspicion(mark, outsider, 1.2);
      api.remember(mark, outsider, 'recruitment-attempt', 2, {});
    } else {
      api.addBond(mark, outsider, 1.3);
      api.remember(mark, outsider, 'offer', 2, { offer: 'a better seat' });
      api.suspicion(mark, closestTo(mark, house) || outsider, 0.8);
    }
    return {
      text, players: [mark, outsider],
      badgeText: loyal ? 'OFFER REFUSED' : 'TEMPTED',
      badgeClass: loyal ? 'blue' : 'red',
    };
  },
};

const numbersCheck = {
  id: 'deals-numbers-check',
  category: 'deals',
  weight(house, ctx) {
    if (!_nominees(ctx).length) return 0;
    const counters = house.filter(n => pStats(n).strategic >= 5 && !_nominees(ctx).includes(n));
    return counters.length ? _w(band(counters.length * 1.6), ctx) : 0;
  },
  fire(house, ctx, api) {
    const counters = _leastSeen(house.filter(n => pStats(n).strategic >= 5 && !_nominees(ctx).includes(n)));
    const a = counters[0];
    const b = closestTo(a, _others(house, a)) || counters[1] || _others(house, a)[0];
    const p = pronouns(a);
    const short = pStats(a).strategic < 7;
    const text = _variant([
      `${a} and ${b} count the vote twice on their fingers and get the same answer both times, which neither of them entirely believes.`,
      `"Say the names." ${b} says the names. ${a} makes ${pronouns(b).obj} say them again, slower, because one of them sounded wrong the first time.`,
      `They have the votes. They have had the votes since Tuesday. ${a} keeps counting anyway, because counting is the only thing there is to do.`,
      `${a} works out that the whole week comes down to one person, tells ${b} who it is, and watches ${pronouns(b).posAdj} face do something complicated.`,
    ], ctx, a, b);

    api.addBond(a, b, 0.7);
    api.remember(a, b, 'confidence', 1, { about: 'the vote count' });
    // A miscount is how blindsides happen, and the less strategic miscount more.
    if (short) api.suspicion(a, furthestFrom(a, _voters(house, ctx)) || b, 0.8);
    return { text, players: [a, b], badgeText: 'COUNTING VOTES', badgeClass: 'blue' };
  },
};

/**
 * "Let's get to jury together" — the pact everybody in this house makes.
 *
 * Fires only BEFORE the window opens, because the promise is about surviving to
 * a date and stops meaning anything once the date has passed. It is a working
 * deal by design: it does not outrank an alliance, does not touch the endgame
 * cap, and two people can hold it while sitting in separate final twos. What it
 * buys them is a few weeks of not writing each other's names down, and a bond
 * if they both make it.
 */
const juryPact = {
  id: 'deals-jury-pact',
  category: 'deals',
  weight(house, ctx) {
    const opens = juryOpensAt();
    // Only worth saying while it is still in doubt, and only once the end is
    // close enough to picture — a week-one promise about jury is small talk.
    // Exactly one week wide: the eve of jury, when the milestone is close
    // enough to name and still in doubt. That is when people actually say this
    // to each other, and it is also the only width that behaves — given a
    // three- or four-week window this displaced other events outright, and the
    // volume guard caught pawn-in-danger-panic going from rare to never. A late
    // game has a lot of twist beats competing for very few slots, so a new
    // event here has to earn its place rather than take somebody else's.
    if (!opens || house.length < opens + 1 || house.length > opens + 3) return 0;
    const pair = _juryPactPair(house, ctx);
    if (!pair) return 0;
    return _w(bondFactor(bond(pair.a, pair.b)) * 3.5, ctx);
  },
  fire(house, ctx, api) {
    const { a, b } = _juryPactPair(house, ctx);
    const left = house.length - juryOpensAt();
    const text = _variant([
      `"${left} more. That is all we have to do." ${a} does not say get to the end, or win — just get to the part where losing still means something. ${b} shakes on it.`,
      `${a} and ${b} work out how many evictions are left before the jury, decide it is survivable, and promise each other they will both be there for it.`,
      `Neither of them mentions the final two, because neither of them means it. What they mean is that they would both like to be voting rather than watching, and they can do that together.`,
      `"I am not asking you to take me to the end." ${a} says it plainly. "I am asking you not to be the reason I miss jury." ${b} agrees, and finds ${pronouns(b).obj}self meaning it.`,
    ], ctx, a, b);

    api.addBond(a, b, 0.9);
    api.sideDeal?.(a, b, 'make-jury', { reason: 'get to jury together' });
    api.remember(a, b, 'promise', 2, { week: ctx.week?.num || 0, about: 'jury together' });
    api.remember(b, a, 'promise', 2, { week: ctx.week?.num || 0, about: 'jury together' });
    return { text, players: [a, b], badgeText: 'TO THE JURY, TOGETHER', badgeClass: 'green' };
  },
};

const juryManagement = {
  id: 'deals-jury-management',
  category: 'deals',
  weight(house, ctx) {
    const pair = _juryPair(house, ctx);
    if (!pair) return 0;
    return _w(band(pStats(pair.player).strategic * 1.1), ctx);
  },
  fire(house, ctx, api) {
    const { player, mark } = _juryPair(house, ctx);
    const p = pronouns(player);
    const m = pronouns(mark);
    const clumsy = pStats(player).social <= 4;
    // Written for somebody still in the house. The old pool apologised for a
    // cut that has not happened — "why the vote against you was not personal",
    // "somebody who has nothing but hard feelings" — to a houseguest who is
    // still playing and might yet outlast the person apologising. What this
    // conversation actually is: laying groundwork with a vote you expect to
    // need, while pretending it is about anything else.
    const text = clumsy ? _variant([
      `${player} tells ${mark} there would be no hard feelings if it ever came to it, which informs ${mark} that ${p.sub} has already thought about it coming to it.`,
      `The groundwork arrives about three weeks early and lands as exactly what it is. ${mark} files it.`,
      `${player} explains ${p.posAdj} game to ${mark} at some length. ${m.Sub} comes away with a much clearer sense of who to vote against at the end.`,
      `"If you go before me, I hope you'd still respect the play." ${mark} notes the word ${player} chose was "if".`,
    ], ctx, player, mark) : _variant([
      `${player} does not apologise for anything, because nothing has happened yet. ${p.Sub} simply makes sure ${mark} knows what ${p.posAdj} game has been, in the version ${p.sub} wants repeated in a jury house.`,
      `"Whatever happens to either of us, I want you to think I played it straight." ${mark} recognises the sentence as an investment and takes it anyway.`,
      `${player} starts building the case for the last night weeks before anybody else remembers there is one.`,
      `It is not a conversation about tonight. ${mark} works out halfway through that it is a conversation about a vote ${m.sub} does not have yet, and answers accordingly.`,
    ], ctx, player, mark);

    api.addBond(player, mark, clumsy ? -0.7 : 0.8);
    api.remember(mark, player, clumsy ? 'insult' : 'respect', 2, { about: 'jury management' });
    api.popDelta(player, clumsy ? -1 : 1);
    return {
      text, players: [player, mark],
      badgeText: clumsy ? 'BOTCHED IT' : 'PLAYING THE END',
      badgeClass: clumsy ? 'red' : 'gold',
    };
  },
};

const competingDeals = {
  id: 'deals-competing',
  category: 'deals',
  weight(house, ctx) {
    if (ctx?.week?._competingDealsAired) return 0;
    // Somebody in two final twos at once is a collision waiting to happen.
    const doubled = house.find(n => _others(house, n).filter(m => remembers(n, m, 'final-two')).length >= 2);
    return doubled ? _w(12, ctx) : 0;
  },
  fire(house, ctx, api) {
    if (ctx?.week) ctx.week._competingDealsAired = true;
    const player = house.find(n => _others(house, n).filter(m => remembers(n, m, 'final-two')).length >= 2);
    const partners = _others(house, player).filter(m => remembers(player, m, 'final-two')).slice(0, 2);
    const [x, y] = partners;
    const p = pronouns(player);
    const text = _variant([
      `${player} has promised the end of the game to two different people and both of them mentioned it today, four hours apart, in almost identical words.`,
      `${x} tells ${player} they are still final two. Later, ${y} says the same thing. ${player} realizes both deals are about to be compared.`,
      `${player} gives ${x} one boot order and ${y} a different one. Halfway through the second conversation, `
        + `${p.sub} forgets which version puts ${x} in fourth.`,
      `${player} realises, mid-conversation with ${x}, that ${p.sub} cannot remember which version of the plan ${p.sub} told ${y}.`,
    ], ctx, player, x, y);

    // The collision does not resolve yet — it becomes pressure, and a target.
    api.suspicion(x, player, 0.8);
    api.suspicion(y, player, 0.8);
    api.remember(player, x, 'overcommitted', 2, {});
    api.remember(player, y, 'overcommitted', 2, {});
    return { text, players: [player, x, y].filter(Boolean), badgeText: 'TWO FINAL TWOS', badgeClass: 'red' };
  },
};

const voteFlip = {
  id: 'deals-vote-flip',
  category: 'deals',
  weight(house, ctx) {
    if (ctx.act !== 'campaign') return 0;
    const noms = _nominees(ctx);
    const flippers = _voters(house, ctx).filter(n =>
      noms.some(nom => wasPromised(nom, n) || remembers(n, nom, 'promise')));
    return flippers.length ? _w(band(flippers.length * 3), ctx) : 0;
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const voter = _leastSeen(_voters(house, ctx).filter(n =>
      noms.some(nom => remembers(n, nom, 'promise'))))[0] || _voters(house, ctx)[0];
    const promised = noms.find(n => remembers(voter, n, 'promise')) || noms[0];
    const other = noms.find(n => n !== promised) || noms[1];
    const p = pronouns(voter);
    const keeps = pStats(voter).loyalty >= 6 || trustOf(voter, promised) >= 3;

    const text = keeps ? _variant([
      `${voter} told ${promised} ${p.sub} would vote to keep ${pronouns(promised).obj}, and ${p.sub} is going to, even though the room has moved.`,
      `Everyone else has quietly changed their mind. ${voter} has not, and does not intend to explain ${p.ref} about it.`,
      `"I said what I said." It costs ${voter} something to keep it and ${p.sub} keeps it anyway.`,
      `${voter} has one vote and one promise and considers those the same object.`,
    ], ctx, voter, promised) : _variant([
      `${voter} promised ${promised} a vote and is not going to give it. ${p.Sub} works out a way to not be alone with ${pronouns(promised).obj} for the rest of the day.`,
      `The house moved and ${voter} moved with it, which ${p.sub} would call being realistic and ${promised} will call something else.`,
      `${voter} decides, somewhere between the kitchen and the bedroom, that the promise was made under different conditions.`,
      `It is not a betrayal in ${voter}'s head. ${p.Sub} has a whole explanation ready that ${p.sub} will never be asked for.`,
    ], ctx, voter, promised);

    if (keeps) {
      api.addBond(voter, promised, 1.2);
      api.remember(promised, voter, 'loyalty', 3, { kept: true });
      api.popDelta(voter, 1);
    } else {
      api.addBond(voter, promised, -1.5);
      api.remember(promised, voter, 'betrayal', 2, { about: 'a promised vote' });
      api.addBond(voter, other, 0.6);
    }
    return {
      text, players: [voter, promised],
      badgeText: keeps ? 'KEPT THEIR WORD' : 'QUIET FLIP',
      badgeClass: keeps ? 'green' : 'red',
    };
  },
};

// ── the endgame tier ──────────────────────────────────────────────────
//
// A final two is the strongest promise in this game, and until the deal module
// existed the house could only make weekly ones — a vote, a week of safety, a
// veto. These four are what the tier makes possible: a wider pact, the second
// deal that guarantees somebody gets cut, the moment it comes out, and the
// check-in that keeps one alive.

/** Three people already close enough to say it out loud. */
function _pactTrio(house) {
  if (house.length < 6) return null;
  for (const a of _leastSeen(house)) {
    const friends = _others(house, a)
      .filter(n => bond(a, n) >= 2.5 && trustOf(a, n) >= 0)
      .sort((x, y) => bond(a, y) - bond(a, x));
    for (let i = 0; i < friends.length; i++) {
      for (let j = i + 1; j < friends.length; j++) {
        if (bond(friends[i], friends[j]) >= 1.5) return { a, b: friends[i], c: friends[j] };
      }
    }
  }
  return null;
}

const finalThreePact = {
  id: 'deals-final-three-pact',
  category: 'deals',
  weight(house, ctx) {
    const trio = _pactTrio(house);
    if (!trio) return 0;
    if (endgameDealsOf(trio.a).some(d => tierOf(d) === 'final-three')) return 0;
    const late = house.length <= 9 ? 1.4 : house.length <= 12 ? 1 : 0.45;
    return _w(bondFactor(bond(trio.a, trio.b)) * late * 10, ctx);
  },
  fire(house, ctx, api) {
    const { a, b, c } = _pactTrio(house);
    const text = _variant([
      `${a}, ${b} and ${c} end up alone together and finally discuss a final-three deal. Each promises to protect the other two until only three chairs remain; nobody asks what happens when one of them must finish third.`,
      `"Three," ${a} says, holding up fingers. "Us three, all the way." ${b} and ${c} agree immediately. All three are already quietly working out which of the other two they would rather beat.`,
      `${b} floats it carefully and ${a} finishes the sentence. ${c} is in before either of them asks. It is the easiest deal any of them have made and the one most likely to end badly.`,
      `The three of them shake on a final three. It costs nothing today, which is exactly why all three of them mean it.`,
    ], ctx, a, b, c);
    api.addBond(a, b, 1.1); api.addBond(a, c, 1.1); api.addBond(b, c, 1);
    api.endgameDeal?.(a, b, 'final-three', { third: c, about: 'the last three chairs' });
    [a, b, c].forEach(x => [a, b, c].forEach(y => { if (x !== y) api.remember(x, y, 'final-three', 2); }));
    return { text, players: [a, b, c], badgeText: 'FINAL THREE', badgeClass: 'gold' };
  },
};

/** Somebody with a final two already, shaking on a second one. */
function _hedger(house) {
  for (const a of _leastSeen(house)) {
    const held = endgameDealsOf(a).filter(d => tierOf(d) === 'final-two');
    if (!held.length) continue;
    const existing = held[0].players.find(n => n !== a);
    const mark = _others(house, a, existing).find(n =>
      bond(a, n) >= 1.5 && !dealBetween(a, n) && trustOf(n, a) >= 0);
    if (mark) return { a, mark, existing };
  }
  return null;
}

const hedgedDeal = {
  id: 'deals-hedged',
  category: 'deals',
  weight(house, ctx) {
    const h = _hedger(house);
    if (!h) return 0;
    const s = pStats(h.a);
    const nerve = (s.strategic * 0.6 + s.boldness * 0.4) / 10;
    return _w(nerve * (house.length <= 8 ? 1.5 : 1) * 11, ctx);
  },
  fire(house, ctx, api) {
    const { a, mark, existing } = _hedger(house);
    const p = pronouns(a);
    const does = p.sub === 'they' ? 'do' : 'does';
    const holds = p.sub === 'they' ? 'hold' : 'holds';
    const tells = p.sub === 'they' ? 'tell' : 'tells';
    const text = _variant([
      `${mark} asks ${a} the question directly — final two, the pair of us — and ${a} says yes without hesitating. ${p.Sub} already said yes to ${existing} weeks ago. One of those conversations was a lie and ${p.sub} ${does} not yet know which.`,
      `${a} shakes on a final two with ${mark}. It is the second one ${p.sub} ${holds}. ${p.Sub} ${tells} ${p.ref} it is insurance rather than a lie, which is what everybody who does this tells themselves.`,
      `"Me and you at the end," ${mark} says. ${a} agrees, but avoids naming who leaves before them. `
        + `That missing name is where the first final two with ${existing} is hiding.`,
      `${a} makes a second final two with ${mark} and walks out doing the arithmetic. Two deals, one seat. Somebody finds out eventually.`,
    ], ctx, a, mark, existing);
    api.addBond(a, mark, 1.3);
    api.endgameDeal?.(a, mark, 'final-two', { about: 'the second one' });
    api.remember(mark, a, 'final-two', 3);
    return { text, players: [a, mark], badgeText: 'SECOND DEAL', badgeClass: 'purple' };
  },
};

/** A promise somebody was not supposed to know about. */
function _exposure(house) {
  for (const finder of _leastSeen(house)) {
    const s = pStats(finder);
    if (s.intuition < 5 && s.social < 6) continue;
    for (const deal of gs.sideDeals || []) {
      if (!isEndgameDeal(deal) || deal.broken || deal.active === false) continue;
      const members = deal.players || [];
      if (members.includes(finder) || !members.every(n => house.includes(n))) continue;
      if ((deal.exposedTo || []).includes(finder)) continue;
      return { finder, deal, members };
    }
  }
  return null;
}

const dealExposed = {
  id: 'deals-exposed',
  category: 'deals',
  weight(house, ctx) {
    const e = _exposure(house);
    if (!e) return 0;
    const s = pStats(e.finder);
    return _w(((s.intuition * 0.6 + s.social * 0.4) / 10) * 12, ctx);
  },
  fire(house, ctx, api) {
    const { finder, deal, members } = _exposure(house);
    const [x, y] = members;
    const p = pronouns(finder);
    const does = p.sub === 'they' ? 'do' : 'does';
    const starts = p.sub === 'they' ? 'start' : 'starts';
    const tier = tierOf(deal) === 'final-two' ? 'final two' : 'final three';
    const text = _variant([
      `${finder} has watched ${x} and ${y} come out of the same room one after another all week, and finally says it out loud to somebody: they have a ${tier}. Saying it makes it true in a way that thinking it did not.`,
      `It is ${y} who gives it away — a sentence half-finished, a look across the kitchen — and ${finder} puts it together on the spot. ${p.Sub} ${does} not confront either of them. ${p.Sub} ${starts} telling other people.`,
      `${finder} asks ${x} a question with an obvious answer and watches ${pronouns(x).obj} pick a different one. Confirmation enough: ${x} and ${y} are going to the end together and everybody else here is furniture.`,
      `The ${tier} between ${x} and ${y} stops being a secret the moment ${finder} decides it is worth more shared than kept.`,
    ], ctx, finder, x, y);
    const told = _others(house, finder, ...members).slice(0, 3);
    api.exposeDeal?.(deal, [finder, ...told]);
    members.forEach(m => {
      api.remember(finder, m, 'endgame-deal-discovered', 2, { tier: tierOf(deal) });
      api.setTarget(finder, m, `found out about the ${tier}`);
      api.addBond(finder, m, -0.7);
    });
    return { text, players: [finder, ...members], badgeText: 'DEAL EXPOSED', badgeClass: 'red' };
  },
};

/** Two people with something at the end, checking it is still there. */
function _partners(house) {
  for (const a of _leastSeen(house)) {
    const deal = endgameDealsOf(a)[0];
    if (!deal) continue;
    const b = (deal.players || []).find(n => n !== a && house.includes(n));
    if (b) return { a, b, deal };
  }
  return null;
}

const reaffirmDeal = {
  id: 'deals-reaffirm',
  category: 'deals',
  weight(house, ctx) {
    const pair = _partners(house);
    if (!pair) return 0;
    // The shakier the promise, the more it needs saying again.
    return _w((0.5 + (1 - sincerityOf(pair.deal, pair.a))) * 8, ctx);
  },
  fire(house, ctx, api) {
    const { a, b, deal } = _partners(house);
    const solid = sincerityOf(deal, a) > 0.55 && sincerityOf(deal, b) > 0.55;
    const p = pronouns(a);
    const files = p.sub === 'they' ? 'file' : 'files';
    const text = solid ? _variant([
      `${a} finds ${b} alone and says it again, plainly: still us, still the end. ${b} does not need to hear it and is glad to anyway.`,
      `Neither of them says much. ${a} bumps ${b}'s shoulder on the way past and ${b} nods once. Weeks in, that is the entire conversation and it is enough.`,
      `"We good?" "We're good." ${a} and ${b} have had this exchange a dozen times and it has not stopped being true yet.`,
      `${a} and ${b} compare their preferred boot orders. They disagree over one name, argue the timing for `
        + `five minutes, and leave with a plan both can actually repeat.`,
    ], ctx, a, b) : _variant([
      `${a} asks ${b} whether they are still good, and listens to how long the pause is. It is not long. It is not nothing, either.`,
      `"Still us, right?" ${b} says all the right words. ${a} walks away not entirely convinced and unable to say which word did it.`,
      `${a} tests ${b} with a name — floats losing somebody ${b} would never agree to lose — and watches ${pronouns(b).obj} agree far too easily. ${p.Sub} ${files} that away.`,
      `They reaffirm the deal. Both of them mean it slightly less than they did last week and neither says so.`,
    ], ctx, a, b);
    api.addBond(a, b, solid ? 0.8 : 0.2);
    if (!solid) api.remember(a, b, 'doubted-the-deal', 1);
    return {
      text, players: [a, b],
      badgeText: solid ? 'STILL SOLID' : 'DOUBT CREEPING IN',
      badgeClass: solid ? 'green' : 'orange',
    };
  },
};

export const DEALS_EVENTS = [
  finalTwo,
  finalThreePact,
  hedgedDeal,
  dealExposed,
  reaffirmDeal,
  votePitch,
  brokenPromise,
  safetyDeal,
  defectionOffer,
  numbersCheck,
  juryPact,
  juryManagement,
  competingDeals,
  voteFlip,
];

export default DEALS_EVENTS;
