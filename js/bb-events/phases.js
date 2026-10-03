// ══════════════════════════════════════════════════════════════════════
// bb-events/phases.js — events that only make sense at one point in a week
// ══════════════════════════════════════════════════════════════════════
//
// A house does not behave the same way all week. What it does depends entirely
// on what it knows, and the week hands it four facts in order:
//
//   pre-hoh    nobody is safe and nobody is a target — the only stretch where
//              everyone is genuinely equal, and the only one where people talk
//              without calculating who is listening
//   post-hoh   somebody has power. Everything is now a reaction to that: the
//              scramble, the "we're good, right?", the sudden warmth toward a
//              person nobody sat with last week
//   post-noms  two people are on the block and the rest are not. The house
//              splits into the safe and the not-safe, and both know it
//   post-veto  somebody holds the veto and has not said what they will do.
//              That gap is the most lobbied hour of the week
//
// Everything here is gated on `ctx.phase`, so these cannot fire at the wrong
// moment — a "don't put me up" pitch is nonsense before anybody has power.

import { gs } from '../core.js';
import {
  pStats, bond, perceived, band, bondFactor, closestTo, furthestFrom, trusts,
  dislikes, sharesAlliance, deFactoAllies, grudge, remembers, suspicionOf,
  targetOf, threat, biggestThreat, willScheme, isNice, isVillainous, archetype,
  trustOf, resentmentOf, beatsInvolving, spotlightOrder, actFacts,
} from './_read.js';
import { memoriesAbout } from '../strategy-memory.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...x) => house.filter(n => n && !x.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _leastSeen = pool => spotlightOrder(pool);
const _noms = ctx => (ctx?.nominees || []).filter(Boolean);

/** Last week's Head of Household, who cannot compete today. */
const outgoingHoh = () => gs.bb?.outgoingHoh || null;
const _safe = (house, ctx) => house.filter(n => n !== ctx?.hoh && !_noms(ctx).includes(n));


/**
 * Only in this phase, and weighted to lead it.
 *
 * The multiplier is the point. These compete against the whole general library
 * inside a house act, and at parity they landed on 5% of beats — so the
 * phase-specific writing, the entire reason this file exists, barely appeared.
 * A house segment should be led by the thing that could only happen then.
 */
/** Which room a scene happens in: by hash, never a die; the HOH room needs the HOH. */
function _room(rooms, ctx, ...people) {
  const ok = rooms.filter(r => r !== 'hoh-room' || (ctx?.hoh && people.includes(ctx.hoh)));
  const pool = ok.length ? ok : ['backyard'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

const at = (phase, ctx, value) => (ctx?.phase === phase ? band(value * 2.6, 34) : 0);

// ── pre-hoh: the only hours nobody has power ──────────────────────────

const openField = {
  id: 'phase-open-field',
  category: 'phases',
  weight(house, ctx) { return at('pre-hoh', ctx, 9); },
  fire(house, ctx, api) {
    const pool = _leastSeen(house);
    const [a, b] = [pool[0], pool[1]];
    api.addBond(a, b, 0.6);
    api.popDelta(a, 1);
    const scene = makeScene('phase.open', { a, b }, { ending: 'scene' }, [], _room(['kitchen', 'backyard'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'LEVEL GROUND', badgeClass: 'blue' };
  },
};

const prePositioning = {
  id: 'phase-pre-positioning',
  category: 'phases',
  weight(house, ctx) {
    const schemers = house.filter(willScheme);
    return schemers.length ? at('pre-hoh', ctx, schemers.length * 2.2) : 0;
  },
  fire(house, ctx, api) {
    const a = _leastSeen(house.filter(willScheme))[0];
    const b = closestTo(a, _others(house, a));
    const mark = biggestThreat(_others(house, a, b)) || _others(house, a, b)[0];
    api.addBond(a, b, 0.7);
    api.remember(b, a, 'promise', 1, { promise: `${mark} goes up`, madeBefore: 'the competition' });
    api.setTarget(a, mark, 'set before anybody had power');
    const scene = makeScene('phase.prepos', { a, b, c: mark || null }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, a, b));
    scene.seenBy = [a, b];
    return { scene, players: [a, b], badgeText: 'GROUNDWORK', badgeClass: 'blue' };
  },
};

// ── post-hoh: somebody has power ──────────────────────────────────────

const scramble = {
  id: 'phase-scramble',
  category: 'phases',
  weight(house, ctx) { return ctx?.hoh ? at('post-hoh', ctx, 13) : 0; },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const scrambler = _leastSeen(_others(house, hoh))
      .sort((a, b) => bond(a, hoh) - bond(b, hoh))[0];
    const desperate = bond(scrambler, hoh) < 0;
    api.addBond(scrambler, hoh, desperate ? 0.4 : 1.1);
    api.remember(hoh, scrambler, desperate ? 'grovel' : 'loyalty', 1, { when: 'the day of the win' });
    if (desperate) api.suspicion(hoh, scrambler, 0.6);
    const scene = makeScene('phase.scramble', { a: scrambler, b: hoh }, { ending: desperate ? 'desperate' : 'respect' }, [], 'hoh-room');
    return {
      scene, players: [scrambler, hoh],
      badgeText: desperate ? 'SCRAMBLING' : 'PAYING RESPECTS',
      badgeClass: desperate ? 'red' : 'green',
    };
  },
};

const powerChangesPeople = {
  id: 'phase-power-changes-people',
  category: 'phases',
  weight(house, ctx) {
    if (!ctx?.hoh) return 0;
    // The less composed the new HOH, the more the power shows.
    return at('post-hoh', ctx, (10 - pStats(ctx.hoh).temperament) * 1.1);
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const watcher = _leastSeen(_others(house, hoh)).find(n => pStats(n).intuition >= 5) || _others(house, hoh)[0];
    api.popDelta(hoh, -1);
    api.suspicion(watcher, hoh, 1.1);
    api.remember(watcher, hoh, 'observation', 1, { about: 'how they hold power' });
    const scene = makeScene('phase.power', { a: hoh, b: watcher }, { ending: 'scene' }, [], _room(['kitchen', 'living-room'], ctx, hoh, watcher));
    return { scene, players: [hoh, watcher], badgeText: 'POWER SHOWS', badgeClass: 'grey' };
  },
};

// ── post-noms: the block exists ───────────────────────────────────────

const blockIsolation = {
  id: 'phase-block-isolation',
  category: 'phases',
  weight(house, ctx) { return _noms(ctx).length ? at('post-noms', ctx, 12) : 0; },
  fire(house, ctx, api) {
    const nominee = _leastSeen(_noms(ctx))[0];
    const avoider = _safe(house, ctx).sort((a, b) => bond(b, nominee) - bond(a, nominee))[0];
    api.addBond(nominee, avoider, -1.2);
    api.remember(nominee, avoider, 'abandonment', 2, { when: 'on the block' });
    api.popDelta(nominee, 2);
    const scene = makeScene('phase.isolation', { a: nominee, b: avoider }, { ending: 'scene' }, [], _room(['kitchen', 'living-room', 'bedroom'], ctx, nominee));
    return { scene, players: [nominee, avoider], badgeText: 'ON THE OUTSIDE', badgeClass: 'grey' };
  },
};

const safeRelief = {
  id: 'phase-safe-relief',
  category: 'phases',
  // Two safe houseguests, not one. This is an event about a PAIR being quietly
  // relieved together, and the weight used to ask only whether anybody was
  // nominated — so on a double eviction, where the house is small and most of
  // it is on the block, `_safe` came back with a single name and the second
  // one narrated as "M and undefined are not on the block".
  weight(house, ctx) {
    return _noms(ctx).length && _safe(house, ctx).length >= 2 ? at('post-noms', ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const safe = _leastSeen(_safe(house, ctx)).slice(0, 2);
    const [a, b] = safe;
    if (!a || !b) return null;
    const nominee = _noms(ctx)[0];
    if (a && b) api.addBond(a, b, 0.7);
    if (a) api.remember(a, nominee, 'guilt', 1, {});
    const scene = makeScene('phase.relief', { a, b }, { ending: 'scene', target: nominee || null }, [], _room(['kitchen', 'backyard', 'bedroom'], ctx, a, b));
    return { scene, players: safe.filter(Boolean), badgeText: 'NOT US', badgeClass: 'green' };
  },
};

// ── post-veto: the most lobbied hour of the week ──────────────────────

const lobbyingTheVeto = {
  id: 'phase-lobby-veto',
  category: 'phases',
  weight(house, ctx) { return ctx?.vetoWinner ? at('post-veto', ctx, 14) : 0; },
  fire(house, ctx, api) {
    const holder = ctx.vetoWinner;
    const nominee = _noms(ctx).filter(n => n !== holder)
      .sort((a, b) => bond(b, holder) - bond(a, holder))[0] || _noms(ctx)[0];
    const hopeful = bond(nominee, holder) >= 2;
    api.addBond(nominee, holder, hopeful ? 0.5 : -0.4);
    api.remember(holder, nominee, 'plea', hopeful ? 2 : 1, { about: 'the veto' });
    if (!hopeful) api.suspicion(holder, nominee, 0.5);
    const scene = makeScene('phase.lobby', { a: nominee, b: holder }, { ending: hopeful ? 'hopeful' : 'pleading' }, [], _room(['bedroom', 'backyard', 'kitchen'], ctx, nominee, holder));
    return {
      scene, players: [nominee, holder],
      badgeText: hopeful ? 'THE ASK' : 'PLEADING',
      badgeClass: hopeful ? 'gold' : 'grey',
    };
  },
};

const vetoHolderWeighs = {
  id: 'phase-veto-holder-weighs',
  category: 'phases',
  weight(house, ctx) {
    // Not the nominees — their decision is made for them — and not the Head of
    // Household either. This event is about being caught between the person in
    // power and the person on the block; an HOH who wins their own veto is not
    // caught between anything, and the card read as them making an enemy of
    // themselves.
    if (!ctx?.vetoWinner || _noms(ctx).includes(ctx.vetoWinner)) return 0;
    if (ctx.vetoWinner === ctx.hoh) return 0;
    // ── AND NOT WHEN NOBODY KNOWS WHOSE WEEK IT IS ──
    //
    // The card is built on there being a named person in power to cross: three
    // of its four lines say the Head of Household's name, and it banks
    // suspicion and a pressure memory against them. On an anonymous week the
    // Head of Household is either unknown or — under the Coin — publicly
    // dethroned, holding neither the block nor anything to threaten with.
    // Found by reading a backlog: a veto holder was weighing "using it makes an
    // enemy of Eva" about an HOH the whole house had watched lose the block.
    // The Coin and the invisible HOH both have their own event families for
    // a week whose author cannot be named.
    if (ctx?.week?.hohSecret || ctx?.week?.coinAuthority) return 0;
    return at('post-veto', ctx, 10);
  },
  fire(house, ctx, api) {
    const holder = ctx.vetoWinner;
    const hoh = ctx.hoh;
    api.suspicion(holder, hoh, 0.7);
    api.remember(holder, hoh, 'pressure', 1, { about: 'the veto decision' });
    api.popDelta(holder, 1);
    const scene = makeScene('phase.weighs', { a: holder, b: hoh }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, holder));
    return { scene, players: [holder, hoh].filter(Boolean), badgeText: 'THE DECISION', badgeClass: 'gold' };
  },
};


// ── pre-hoh, continued ────────────────────────────────────────────────

const lastNightEqual = {
  id: 'phase-last-night-equal',
  category: 'phases',
  weight(house, ctx) { return at('pre-hoh', ctx, 7); },
  fire(house, ctx, api) {
    const group = _leastSeen(house).slice(0, 3);
    const [a, b, c] = group;
    for (const x of group) for (const y of group) if (x !== y) api.addBond(x, y, 0.35);
    api.popDelta(a, 1);
    const scene = makeScene('phase.last-equal', { a, b, c: c || null }, { ending: 'scene' }, [], _room(['kitchen', 'living-room'], ctx, a, b, c));
    return { scene, players: group.filter(Boolean), badgeText: 'BEFORE IT STARTS', badgeClass: 'blue' };
  },
};

const outgoingHohExposed = {
  id: 'phase-outgoing-exposed',
  category: 'phases',
  weight(house, ctx) {
    // Read the outgoing HOH from state, not from the acts: during pre-hoh the
    // HOH act does not exist yet, which is exactly the phase this event is for.
    const out = outgoingHoh();
    return out && house.includes(out) ? at('pre-hoh', ctx, 12) : 0;
  },
  fire(house, ctx, api) {
    const out = outgoingHoh();
    const angry = _others(house, out).sort((a, b) => grudge(b, out) - grudge(a, out))[0];
    api.popDelta(out, -1);
    if (angry) {
      api.suspicion(angry, out, 1.3);
      api.setTarget(angry, out, 'they finally came down off the wall');
    }
    const scene = makeScene('phase.outgoing', { a: out, b: angry || null }, { ending: 'scene' }, [], _room(['kitchen', 'bedroom', 'backyard'], ctx, out));
    return { scene, players: [out, angry].filter(Boolean), badgeText: 'NO LONGER SAFE', badgeClass: 'red' };
  },
};

// ── post-hoh, continued ───────────────────────────────────────────────

const hohRoomReveal = {
  id: 'phase-hoh-room',
  location: 'hoh-room',
  category: 'phases',
  weight(house, ctx) { return ctx?.hoh ? at('post-hoh', ctx, 10) : 0; },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const invited = _leastSeen(_others(house, hoh)).sort((a, b) => bond(hoh, b) - bond(hoh, a)).slice(0, 2);
    const excluded = furthestFrom(hoh, _others(house, hoh, ...invited));
    invited.forEach(n => { api.addBond(hoh, n, 0.8); api.remember(n, hoh, 'favour', 1, { about: 'the HOH room' }); });
    if (excluded) {
      api.addBond(hoh, excluded, -0.5);
      api.suspicion(excluded, hoh, 0.9);
    }
    api.popDelta(hoh, 2);
    const scene = makeScene('phase.hoh-room', { a: hoh, b: invited[0] || null, c: excluded || null }, { ending: 'scene' }, [], 'hoh-room');
    return { scene, players: [hoh, ...invited, excluded]
      .filter((n, i, all) => n && all.indexOf(n) === i),
      badgeText: 'THE HOH ROOM', badgeClass: 'gold' };
  },
};

const targetsAlign = {
  id: 'phase-targets-align',
  category: 'phases',
  // The name being offered cannot be the person it is offered TO. Somebody
  // whose target happens to be the Head of Household was still eligible to
  // pitch, which produced "if you're looking at Bowie, so am I — the most
  // useful sentence anybody says to Bowie today", and a card with Bowie's
  // face on it twice. Walking into the HOH room to suggest nominating the
  // Head of Household is a different event, and not this one.
  weight(house, ctx) {
    if (!ctx?.hoh) return 0;
    const pitchers = house.filter(n => n !== ctx.hoh && targetOf(n) && targetOf(n) !== ctx.hoh);
    return pitchers.length ? at('post-hoh', ctx, pitchers.length * 3) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const pitcher = _leastSeen(house.filter(n => n !== hoh && targetOf(n) && targetOf(n) !== hoh))[0];
    if (!pitcher) return null;
    const mark = targetOf(pitcher);
    // ── a grudge is only as old as its receipts ──
    //
    // "has wanted ${mark} gone since week one" fired off nothing but the
    // CURRENT target — a name that can be three days old — so a reader who
    // remembered the actual week one caught the show inventing its own
    // history. The duration claim now requires an early memory against the
    // mark; a fresh target gets a fresh-target sentence instead.
    const receipts = memoriesAbout(pitcher, mark) || [];
    const firstEp = receipts.length ? Math.min(...receipts.map(m => m.ep || 99)) : null;
    const longHeld = grudge(pitcher, mark) && firstEp != null && firstEp <= 2
      && (ctx?.week?.num || 1) > 2;
    api.addBond(pitcher, hoh, 0.9);
    api.suspicion(hoh, mark, 1.6);
    api.remember(hoh, pitcher, 'intel', 2, { about: mark });
    const scene = makeScene('phase.targets', { a: pitcher, b: hoh, c: mark }, { ending: longHeld ? 'long' : 'new' }, [], 'hoh-room');
    scene.seenBy = [pitcher, hoh];
    return { scene, players: [pitcher, hoh, mark].filter(Boolean), badgeText: 'A NAME OFFERED', badgeClass: 'blue' };
  },
};

// ── post-noms, continued ──────────────────────────────────────────────

const nomineeReckons = {
  id: 'phase-nominee-reckons',
  category: 'phases',
  weight(house, ctx) { return _noms(ctx).length ? at('post-noms', ctx, 11) : 0; },
  fire(house, ctx, api) {
    const nominee = _leastSeen(_noms(ctx))[0];
    const needed = _safe(house, ctx).sort((a, b) => bond(nominee, b) - bond(nominee, a)).slice(0, 3);
    needed.filter(Boolean).forEach(n => api.remember(nominee, n, 'needs', 1, { about: 'the vote' }));
    api.popDelta(nominee, 1);
    const scene = makeScene('phase.reckons', { a: nominee, b: needed[0] || null }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, nominee));
    scene.seenBy = [nominee];
    return { scene, players: [nominee, ...needed.filter(Boolean).slice(0, 2)], badgeText: 'COUNTING', badgeClass: 'blue' };
  },
};

const houseTakesSides = {
  id: 'phase-house-takes-sides',
  category: 'phases',
  weight(house, ctx) { return _noms(ctx).length === 2 ? at('post-noms', ctx, 9) : 0; },
  fire(house, ctx, api) {
    const [a, b] = _noms(ctx);
    const safe = _safe(house, ctx);
    const forA = safe.filter(n => bond(n, a) > bond(n, b));
    const forB = safe.filter(n => bond(n, b) > bond(n, a));
    forA.forEach(n => api.addBond(n, a, 0.3));
    forB.forEach(n => api.addBond(n, b, 0.3));
    const scene = makeScene('phase.sides', { a, b }, { ending: 'scene' }, [], _room(['living-room', 'kitchen'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'THE HOUSE SPLITS', badgeClass: 'grey' };
  },
};

// ── post-veto, continued ──────────────────────────────────────────────

const hohPressuresVeto = {
  id: 'phase-hoh-pressures-veto',
  category: 'phases',
  weight(house, ctx) {
    if (!ctx?.vetoWinner || !ctx?.hoh || ctx.vetoWinner === ctx.hoh) return 0;
    return at('post-veto', ctx, 12);
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh, holder = ctx.vetoWinner;
    const heavy = pStats(hoh).temperament <= 5 || isVillainous(hoh);
    api.addBond(hoh, holder, heavy ? -0.7 : 0.9);
    api.remember(holder, hoh, heavy ? 'pressure' : 'respect', 2, { about: 'the veto' });
    if (heavy) api.suspicion(holder, hoh, 1.4);
    const scene = makeScene('phase.leaned', { a: hoh, b: holder }, { ending: heavy ? 'heavy' : 'straight' }, [], 'hoh-room');
    return {
      scene, players: [hoh, holder],
      badgeText: heavy ? 'LEANED ON' : 'ASKED STRAIGHT',
      badgeClass: heavy ? 'red' : 'green',
    };
  },
};

const replacementFear = {
  id: 'phase-replacement-fear',
  category: 'phases',
  weight(house, ctx) {
    if (!ctx?.vetoWinner) return 0;
    const exposed = _safe(house, ctx);
    return exposed.length ? at('post-veto', ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const exposed = _leastSeen(_safe(house, ctx))
      .sort((a, b) => bond(a, ctx.hoh) - bond(b, ctx.hoh))[0];
    api.suspicion(exposed, ctx.hoh, 1.1);
    api.remember(exposed, ctx.hoh, 'fear', 1, { about: 'the empty chair' });
    api.popDelta(exposed, 1);
    const scene = makeScene('phase.chair', { a: exposed, b: ctx.hoh || null }, { ending: 'scene' }, [], _room(['kitchen', 'bedroom'], ctx, exposed));
    return { scene, players: [exposed, ctx.hoh].filter(Boolean), badgeText: 'THE EMPTY CHAIR', badgeClass: 'grey' };
  },
};

export const PHASE_EVENTS = [
  openField,
  prePositioning,
  scramble,
  powerChangesPeople,
  blockIsolation,
  safeRelief,
  lobbyingTheVeto,
  vetoHolderWeighs,
  lastNightEqual,
  outgoingHohExposed,
  hohRoomReveal,
  targetsAlign,
  nomineeReckons,
  houseTakesSides,
  hohPressuresVeto,
  replacementFear,
];

export default PHASE_EVENTS;
