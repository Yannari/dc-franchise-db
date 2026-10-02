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
import { endgameDealsOf, dealBetween, tierOf, sincerityOf, isEndgameDeal, juryPactsOf } from '../bb/deals.js';
import { juryOpensAt } from '../bb/jury.js';
import {
  pStats, bond, perceived, hidden, band, bondFactor, closestTo, furthestFrom,
  trusts, dislikes, sharesAlliance, alliancesOf, grudge, remembers, wasPromised,
  suspicionOf, targetOf, targetsOf, isHunting, huntedBy, threat, biggestThreat, willScheme, deFactoAllies,
  isNice, isVillainous, archetype, trustOf, obligationOf, respectOf, dangerOf,
  resentmentOf, beatsInvolving, spotlightOrder, actFacts,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────


const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/**
 * Which room a private talk happens in: picked by hash, so it never draws a
 * die. `people` are the ones talking; the HOH room needs the HOH among them
 * (the house's own rule, house-events _roomAllows — a scene's room skips it).
 */
function _room(rooms, ctx, ...people) {
  const ok = rooms.filter(r => r !== 'hoh-room' || (ctx?.hoh && people.includes(ctx.hoh)));
  const pool = ok.length ? ok : ['backyard'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}
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

const _holdsFinalTwo = name => endgameDealsOf(name).some(d => tierOf(d) === 'final-two');

function _pactPair(house, ctx) {
  const pool = _leastSeen(house);
  for (const a of pool) {
    // A pair that already HAS something at the end can never land here.
    // The memory check alone was the guard, and memories get evicted from a
    // full head — so a final four watched two people solemnly invent the
    // final two they had been in since week three. The deal ledger doesn't
    // forget; ask it first, in both directions.
    // A FIRST final two only, for both of them. Somebody who already holds
    // one and shakes on another is the SECOND DEAL event — a double-cross the
    // house can catch — not this. Without the check a single houseguest was
    // collecting three final twos in a week, every one of them sincere.
    if (_holdsFinalTwo(a)) continue;
    const b = _others(house, a).find(n =>
      bond(a, n) >= 3 && trustOf(a, n) >= 0
      && !remembers(a, n, 'final-two') && !remembers(n, a, 'final-two')
      && !dealBetween(a, n) && !_holdsFinalTwo(n));
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
  oncePerWeek: true,
  weight(house, ctx) {
    const pair = _pactPair(house, ctx);
    if (!pair) return 0;
    // A final two is worth making once the field is small enough to imagine.
    const late = house.length <= 10 ? 1.5 : house.length <= 13 ? 1 : 0.5;
    return _w(bondFactor(bond(pair.a, pair.b)) * late * 13, ctx);
  },
  fire(house, ctx, api) {
    const { a, b } = _pactPair(house, ctx);
    api.addBond(a, b, 1.6);
    // A final two is the strongest deal in the game; record it as one so the
    // alliance lifecycle can see it.
    api.sideDeal?.(a, b, 'f2', { reason: 'final two' });
    api.remember(a, b, 'final-two', 3, { week: ctx.week?.num || 0 });
    api.remember(b, a, 'final-two', 3, { week: ctx.week?.num || 0 });
    api.setTarget(a, biggestThreat(_others(house, a, b)) || furthestFrom(a, house), `in the way of the final two with ${b}`);
    const scene = makeScene('talk.final-two', { a, b }, { ending: 'made' }, [], _room(['bedroom', 'backyard', 'hoh-room'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'FINAL TWO', badgeClass: 'gold' };
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
    const other = _nominees(ctx).find(n => n !== pitcher);
    // Persuasion against judgement — proportional, and the relationship counts.
    const force = pStats(pitcher).social / 10 + bondFactor(bond(pitcher, mark)) * 0.6;
    const guard = pStats(mark).intuition / 10 + (trustOf(mark, other) > 2 ? 0.4 : 0);
    const lands = force > guard;

    if (lands) {
      api.addBond(pitcher, mark, 1.1);
      api.remember(mark, pitcher, 'promise', 2, { promise: 'my vote, this week' });
    } else {
      api.addBond(pitcher, mark, -0.4);
      api.suspicion(mark, pitcher, 0.6);
    }
    const scene = makeScene('talk.campaign', { a: pitcher, b: mark, c: other || null }, { ending: lands ? 'lands' : 'refused' }, [],
      _room(['backyard', 'bedroom', 'kitchen'], ctx, pitcher, mark));
    // The other nominee is talked ABOUT, not in the room.
    scene.seenBy = [pitcher, mark];
    return {
      scene, players: [pitcher, mark],
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
    api.addBond(victim, liar, -1.8);
    api.remember(victim, liar, 'broken-promise', 3, {});
    api.setTarget(victim, liar, 'gave me their word and did not keep it');
    // Watching a promise break teaches everyone something about the promiser.
    _others(house, victim, liar).forEach(w => {
      if (pStats(w).intuition >= 5) api.suspicion(w, liar, 0.9);
    });
    api.popDelta(liar, -1);
    // Called out in front of people: the house is in the room for it.
    const scene = makeScene('deals.broken', { a: victim, b: liar }, { ending: 'confronted' }, _others(house, victim, liar),
      _room(['kitchen', 'living-room', 'backyard'], ctx, victim, liar));
    return { scene, players: [victim, liar], badgeText: 'PROMISE BROKEN', badgeClass: 'red' };
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
    const honest = !fake && !willScheme(hoh);
    // ── THE FAKE DEAL, TOLD AS ONE ──
    //
    // The audience is in on it — that is the whole pleasure of the scene — and
    // whether the MARK is depends on the same arithmetic as every other read
    // in this house: what they think of the HOH, against their own intuition.
    // High bond and low intuition shakes the hand smiling; the reverse takes
    // the deal knowing exactly what it is worth.
    if (fake) {
      const fooled = perceived(other, hoh) + (pStats(hoh).social - 5) * 0.2
        - pStats(other).intuition * 0.25 > -0.5;
      api.sideDeal?.(hoh, other, 'safety', { genuine: false, reason: 'one week of safety' });
      // The debt: when the nomination lands, this memory is what the fallout
      // reads — a PROVABLE broken promise, not a vibe.
      api.remember(other, hoh, 'promise', 3, { promise: 'one week of safety', fake: true });
      if (!fooled) api.suspicion(other, hoh, 1.4);
      else api.addBond(other, hoh, 0.6);
      api.popDelta?.(hoh, -0.5);
      const scene = makeScene('talk.safety', { a: hoh, b: other }, { ending: fooled ? 'lie' : 'seen' }, [], 'hoh-room');
      return { scene, players: [hoh, other],
        badgeText: fooled ? 'A LIE, SHAKEN ON' : 'BOTH KNOW BETTER',
        badgeClass: 'red' };
    }
    api.addBond(hoh, other, 0.9);
    // A safety deal is a real deal, but a one-week one — genuine only when the
    // person offering it means it.
    api.sideDeal?.(hoh, other, 'safety', { genuine: honest, reason: 'one week of safety' });
    api.remember(other, hoh, 'promise', honest ? 2 : 3, { promise: 'one week of safety' });
    api.remember(hoh, other, 'promise', 2, { promise: 'one week of safety' });
    if (!honest) api.suspicion(other, hoh, 0.5);
    const scene = makeScene('talk.safety', { a: hoh, b: other }, { ending: 'deal' }, [], 'hoh-room');
    return { scene, players: [hoh, other], badgeText: 'SAFETY DEAL', badgeClass: 'green' };
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
    const loyal = pStats(mark).loyalty >= 6 || isNice(mark);
    if (loyal) {
      api.addBond(mark, outsider, -0.5);
      api.suspicion(mark, outsider, 1.2);
      api.remember(mark, outsider, 'recruitment-attempt', 2, {});
    } else {
      api.addBond(mark, outsider, 1.3);
      api.remember(mark, outsider, 'offer', 2, { offer: 'a better seat' });
      api.suspicion(mark, closestTo(mark, house) || outsider, 0.8);
    }
    const scene = makeScene('deals.defection', { a: outsider, b: mark }, { ending: loyal ? 'refused' : 'tempted' }, [],
      _room(['backyard', 'bedroom', 'pantry'], ctx, outsider, mark));
    return {
      scene, players: [mark, outsider],
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
    const short = pStats(a).strategic < 7;

    api.addBond(a, b, 0.7);
    api.remember(a, b, 'confidence', 1, { about: 'the vote count' });
    // A miscount is how blindsides happen, and the less strategic miscount more.
    if (short) api.suspicion(a, furthestFrom(a, _voters(house, ctx)) || b, 0.8);
    const scene = makeScene('talk.debrief', { a, b }, { ending: short ? 'shaky' : 'sure' }, [], _room(['bedroom', 'backyard', 'pantry'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'COUNTING VOTES', badgeClass: 'blue' };
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
    api.addBond(a, b, 0.9);
    api.sideDeal?.(a, b, 'make-jury', { reason: 'get to jury together' });
    api.remember(a, b, 'promise', 2, { week: ctx.week?.num || 0, about: 'jury together' });
    api.remember(b, a, 'promise', 2, { week: ctx.week?.num || 0, about: 'jury together' });
    const scene = makeScene('deals.jury-pact', { a, b }, { ending: 'made' }, [], _room(['backyard', 'bedroom', 'kitchen'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'TO THE JURY, TOGETHER', badgeClass: 'green' };
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
    const clumsy = pStats(player).social <= 4;
    api.addBond(player, mark, clumsy ? -0.7 : 0.8);
    api.remember(mark, player, clumsy ? 'insult' : 'respect', 2, { about: 'jury management' });
    api.popDelta(player, clumsy ? -1 : 1);
    const scene = makeScene('deals.jury-manage', { a: player, b: mark }, { ending: clumsy ? 'botched' : 'smooth' }, [],
      _room(['backyard', 'bedroom', 'kitchen'], ctx, player, mark));
    return {
      scene, players: [player, mark],
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
    // The collision does not resolve yet — it becomes pressure, and a target.
    api.suspicion(x, player, 0.8);
    api.suspicion(y, player, 0.8);
    api.remember(player, x, 'overcommitted', 2, {});
    api.remember(player, y, 'overcommitted', 2, {});
    const scene = makeScene('deals.competing', { a: player, b: x, c: y || null }, { ending: 'collide' }, [],
      _room(['kitchen', 'backyard', 'bedroom'], ctx, player, x));
    return { scene, players: [player, x, y].filter(Boolean), badgeText: 'TWO FINAL TWOS', badgeClass: 'red' };
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
    const keeps = pStats(voter).loyalty >= 6 || trustOf(voter, promised) >= 3;
    if (keeps) {
      api.addBond(voter, promised, 1.2);
      api.remember(promised, voter, 'loyalty', 3, { kept: true });
      api.popDelta(voter, 1);
    } else {
      api.addBond(voter, promised, -1.5);
      api.remember(promised, voter, 'betrayal', 2, { about: 'a promised vote' });
      api.addBond(voter, other, 0.6);
    }
    const scene = makeScene('deals.vote-flip', { a: voter, b: promised }, { ending: keeps ? 'kept' : 'flipped' }, [],
      _room(['bedroom', 'backyard', 'kitchen'], ctx, voter, promised));
    return {
      scene, players: [voter, promised],
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
    api.addBond(a, b, 1.1); api.addBond(a, c, 1.1); api.addBond(b, c, 1);
    api.endgameDeal?.(a, b, 'final-three', { third: c, about: 'the last three chairs' });
    [a, b, c].forEach(x => [a, b, c].forEach(y => { if (x !== y) api.remember(x, y, 'final-three', 2); }));
    const scene = makeScene('deals.final-three', { a, b, c }, { ending: 'made' }, [], _room(['bedroom', 'backyard', 'hoh-room'], ctx, a, b, c));
    return { scene, players: [a, b, c], badgeText: 'FINAL THREE', badgeClass: 'gold' };
  },
};

/** Somebody with a final two already, shaking on a second one. */
function _hedger(house) {
  for (const a of _leastSeen(house)) {
    // Promising the same seat to two people is a scheme, and the franchise
    // rule for who may scheme applies: a hero does not run two final twos.
    // Ungated, this was the commonest deal in the game — more second deals
    // than first ones across eight measured seasons.
    if (!willScheme(a)) continue;
    const held = endgameDealsOf(a).filter(d => tierOf(d) === 'final-two');
    // Exactly one: the second deal is the story. A third is not a hedge, it
    // is a houseguest promising the end to everybody they talk to.
    if (held.length !== 1) continue;
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
  oncePerWeek: true,
  weight(house, ctx) {
    const h = _hedger(house);
    if (!h) return 0;
    const s = pStats(h.a);
    const nerve = (s.strategic * 0.6 + s.boldness * 0.4) / 10;
    return _w(nerve * (house.length <= 8 ? 1.5 : 1) * 5, ctx);
  },
  fire(house, ctx, api) {
    const { a, mark, existing } = _hedger(house);
    api.addBond(a, mark, 1.3);
    api.endgameDeal?.(a, mark, 'final-two', { about: 'the second one' });
    api.remember(mark, a, 'final-two', 3);
    // The first deal's partner is talked about, not in the room.
    const scene = makeScene('deals.hedged', { a, b: mark, c: existing }, { ending: 'hedged' }, [], _room(['bedroom', 'backyard'], ctx, a, mark));
    scene.seenBy = [a, mark];
    return { scene, players: [a, mark], badgeText: 'SECOND DEAL', badgeClass: 'purple' };
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
    const tier = tierOf(deal) === 'final-two' ? 'final two' : 'final three';
    const told = _others(house, finder, ...members).slice(0, 3);
    api.exposeDeal?.(deal, [finder, ...told]);
    members.forEach(m => {
      api.remember(finder, m, 'endgame-deal-discovered', 2, { tier: tierOf(deal) });
      api.setTarget(finder, m, `found out about the ${tier}`);
      api.addBond(finder, m, -0.7);
    });
    // Worked out alone; the pair are not in the room. `reason` is the deal's tier.
    const scene = makeScene('deals.exposed', { a: finder, b: x, c: y || null }, { ending: 'found', reason: tierOf(deal) }, [],
      _room(['backyard', 'bedroom', 'kitchen'], ctx, finder));
    scene.seenBy = [finder];
    return { scene, players: [finder, ...members], badgeText: 'DEAL EXPOSED', badgeClass: 'red' };
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
    // ── one of them is planning the cut ──
    //
    // The late-game version of this scene: the words get said again, warmly,
    // by somebody whose actual plan is the other chair. The audience is told;
    // the partner gets a provable promise to wave when the cut comes; and
    // whether the partner buys it runs on the same bond-vs-intuition read as
    // every other lie in this house.
    const cutter = targetOf(a) === b ? a : targetOf(b) === a ? b : null;
    if (cutter && house.length <= 6) {
      const kept = cutter === a ? b : a;
      const fooled = perceived(kept, cutter) + (pStats(cutter).social - 5) * 0.2
        - pStats(kept).intuition * 0.25 > -0.5;
      api.remember(kept, cutter, 'promise', 3, { promise: 'final two, restated', fake: true });
      if (!fooled) api.suspicion(kept, cutter, 1.3);
      else api.addBond(kept, cutter, 0.5);
      api.popDelta?.(cutter, -0.4);
      const scene = makeScene('talk.reaffirm', { a: cutter, b: kept }, { ending: fooled ? 'cut' : 'seen' }, [], _room(['bedroom', 'backyard', 'kitchen'], ctx, cutter, kept));
      return { scene, players: [cutter, kept],
        badgeText: fooled ? 'A GOODBYE, DRESSED AS A PROMISE' : 'SAID TOO OFTEN',
        badgeClass: 'red' };
    }
    api.addBond(a, b, solid ? 0.8 : 0.2);
    if (!solid) api.remember(a, b, 'doubted-the-deal', 1);
    const scene = makeScene('talk.reaffirm', { a, b }, { ending: solid ? 'solid' : 'doubt' }, [], _room(['bedroom', 'backyard', 'kitchen'], ctx, a, b));
    return {
      scene, players: [a, b],
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
