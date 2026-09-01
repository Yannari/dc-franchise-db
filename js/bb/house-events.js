// Scheduler and state API for Big Brother house events.
// Event prose/library lives in js/bb-events/ and is supplied to this module.
import { gs, seasonConfig, players } from '../core.js';
import {
  addBBRelationship, addBBShowmanceSpark, rememberBBStrategy, setBBTarget,
} from './shared-strategy.js';
import { makeEndgameDeal, makeJuryPact, breakDeal, exposeDeal, tierOf } from './deals.js';
import { isDrinksNight, nightModifier } from '../bb-events/drinks-night.js';
import { scheduleWeightedEvents } from '../event-scheduler.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function ensureState() {
  gs.bb ||= {};
  gs.bb.house ||= { suspicion: {}, targets: {}, memories: {}, eventHistory: [] };
  gs.bb.house.suspicion ||= {};
  // Compatibility/render receipts only. Shared intentions and strategic
  // memories remain authoritative for decisions.
  gs.bb.house.targets ||= {};
  gs.bb.house.memories ||= {};
  gs.bb.house.eventHistory ||= [];
  gs.popularity ||= {};
  gs.showmances ||= [];
  gs.romanticSparks ||= [];
  return gs.bb.house;
}

/**
 * What a beat actually did.
 *
 * Every event changes the world through this api and nowhere else, which makes
 * it the one place that can honestly answer "and what did that do?". The
 * answers are collected per beat and travel with it to the screen, so a card
 * becomes a receipt rather than a paragraph — the feed used to read as a series
 * of things that happened to nobody in particular.
 *
 * Deliberately an array on the api rather than a return value: events call
 * these methods a dozen times each, and threading a ledger through every one
 * would mean rewriting ninety events to record something they should not have
 * to think about.
 */
export function createHouseEventApi(ctx = {}) {
  const state = ensureState();
  const ledger = [];
  const note = (kind, text, extra = {}) => { ledger.push({ kind, text, ...extra }); };
  return Object.freeze({
    _ledger: ledger,
    _drainLedger() { const out = ledger.slice(); ledger.length = 0; return out; },
    addBond(a, b, delta) {
      if (!a || !b || a === b || !Number.isFinite(Number(delta))) return false;
      // No note here on purpose — relationship movement is measured around the
      // whole beat instead. See _bondsMoved below for why.
      return addBBRelationship(a, b, Number(delta));
    },
    popDelta(name, delta) {
      if (!name || !Number.isFinite(Number(delta))) return false;
      // The house was tracking popularity whether or not the season had it
      // switched on, so turning it off changed nothing.
      if (seasonConfig.popularityEnabled === false) return false;
      gs.popularity[name] = (gs.popularity[name] || 0) + Number(delta);
      note('pop', `${name} ${Number(delta) > 0 ? 'plays well' : 'plays badly'} on camera`,
        { players: [name], delta: Number(delta) });
      return true;
    },
    suspicion(observer, subject, delta) {
      if (!observer || !subject || observer === subject) return false;
      const key = `${observer}→${subject}`;
      state.suspicion[key] = clamp((state.suspicion[key] || 0) + Number(delta || 0), 0, 10);
      if (Math.abs(Number(delta) || 0) >= 0.3) {
        note('suspicion', `${observer} → ${subject} ${Number(delta) > 0 ? 'warier' : 'easier'}`,
          { players: [observer, subject], delta: Number(delta) });
      }
      return true;
    },
    setTarget(actor, target, reason = 'house event') {
      if (!actor || !target || actor === target) return false;
      const changed = setBBTarget(actor, target, reason, ctx);
      if (changed) {
        state.targets[actor] = { target, reason, week: ctx.week?.num || 0, act: ctx.act };
        note('target', `${actor} is coming for ${target}`, { players: [actor, target] });
      }
      return changed;
    },
    /**
     * Record a real deal between two houseguests.
     *
     * gs.sideDeals is canonical shared state and the alliance lifecycle treats a
     * genuine deal as the strongest evidence there is — but nothing in Big
     * Brother was writing one, so the entire duo route to an alliance was
     * unreachable and thirty seasons produced three alliances in total. The
     * events that make deals now say so here.
     */
    sideDeal(a, b, type = 'f2', detail = {}) {
      if (!a || !b || a === b) return false;
      gs.sideDeals ||= [];

      // An endgame promise is a different object from a week's business, so it
      // goes through the deal module: it gets a tier the rest of the game can
      // rank, and a private sincerity for each side. The two of them shaking on
      // the same words does not mean they meant it equally, and that gap is the
      // whole reason final twos are interesting.
      const tier = tierOf({ type, tier: detail.tier });
      if (tier !== 'working') {
        const deal = makeEndgameDeal(a, b, tier, {
          week: ctx.week, about: detail.about || detail.reason || '', third: detail.third || null,
        });
        if (deal) {
          Object.assign(deal, { ...detail, tier, type });
          note('deal', `${a} & ${b} shook on ${tier === 'final-two' ? 'a final two' : 'a final three'}`,
            { players: [a, b], tier });
        }
        return !!deal;
      }

      // "Get to jury together" is a working deal that outlives the week — it
      // runs to a milestone instead of to Thursday — so it has its own
      // constructor and must not fall through to the generic push, or it would
      // be dropped by the end-of-week sweep the moment it was made.
      if (type === 'make-jury') {
        const pact = makeJuryPact(a, b, { week: ctx.week });
        if (pact) {
          Object.assign(pact, detail, { type: 'make-jury', tier: 'working' });
          note('deal', `${a} & ${b} promised to get to jury together`,
            { players: [a, b], tier: 'working' });
        }
        return !!pact;
      }

      const existing = gs.sideDeals.find(deal => deal.active !== false
        && deal.players?.includes(a) && deal.players.includes(b) && deal.type === type);
      if (existing) return true;
      gs.sideDeals.push({
        players: [a, b], type, tier: 'working', active: true, genuine: detail.genuine !== false,
        madeEp: ctx.week?.num || 0, format: 'big-brother', ...detail,
      });
      note('deal', `${a} & ${b} shook on ${detail.about || `a ${type}`}`,
        { players: [a, b], tier: 'working' });
      return true;
    },
    /** Shake on the end explicitly — final two, or final three with a third. */
    endgameDeal(a, b, tier = 'final-two', detail = {}) {
      const deal = makeEndgameDeal(a, b, tier, { week: ctx.week, ...detail });
      if (deal) {
        note('deal', `${(deal.players || []).join(' & ')} shook on `
          + `${tier === 'final-two' ? 'a final two' : 'a final three'}`,
          { players: deal.players, tier });
      }
      return !!deal;
    },
    /** Go back on one, on the record. */
    breakDeal(deal, breaker, reason = '') {
      const broken = breakDeal(deal, breaker, { week: ctx.week, reason });
      if (broken) {
        note('break', `${breaker} went back on ${broken.victims.join(' & ')}`,
          { players: [breaker, ...broken.victims] });
      }
      return broken;
    },
    /** Tell somebody about a promise they were not part of. */
    exposeDeal(deal, toWhom) {
      const added = exposeDeal(deal, toWhom);
      if (added) {
        note('expose', `${(deal.players || []).join(' & ')} — deal is out`,
          { players: deal.players || [] });
      }
      return added;
    },
    remember(observer, subject, type, strength = 1, detail = {}) {
      if (!observer || !subject || !type) return false;
      const memory = rememberBBStrategy(observer, subject, type, strength, detail, ctx);
      if (!memory) return false;
      state.memories[observer] ||= [];
      state.memories[observer].push({ subject, type, strength:Number(strength) || 1, week:ctx.week?.num || 0, act:ctx.act, detail });
      if ((Number(strength) || 1) >= 2) {
        note('memory', `${observer} remembers this`, { players: [observer, subject] });
      }
      return true;
    },
    showmance(a, b, detail = {}) {
      const ok = addBBShowmanceSpark(a, b, detail, ctx);
      if (ok) note('romance', `something is happening between ${a} and ${b}`, { players: [a, b] });
      return ok;
    },
  });
}

/**
 * Which relationships this beat actually moved.
 *
 * Measured by diffing the bonds around the event rather than trusted to the
 * event to declare, and that distinction is the whole point. A self-reported
 * ledger only ever records what goes through this api — and the beats a viewer
 * most wants a receipt for do not. The scheme layer calls Total Drama's
 * social-manipulation module directly and the alliance layer writes through the
 * lifecycle, so a forged note, a whisper campaign and an alliance recruitment
 * all came back with no effects at all: the most consequential events in the
 * house were the ones the feed said nothing about.
 *
 * Capped at the six largest movements. Everything here is written into episode
 * history, and a chatty beat can touch thirty pairs.
 */
function _worldBefore() {
  return {
    bonds: { ...(gs.bonds || {}) },
    // Who believes what about whom. The whisper campaign moves this and
    // nothing else, which is exactly why it is the subtlest scheme in the game.
    perceived: Object.fromEntries(Object.entries(gs.perceivedBonds || {})
      .map(([k, v]) => [k, Number(v?.perceived ?? v) || 0])),
    // Membership, not the alliance list — people are recruited into alliances
    // that already exist.
    alliances: Object.fromEntries((gs.namedAlliances || [])
      .map(a => [a.name, [...(a.members || [])]])),
  };
}

function _worldMoved(before) {
  const moved = [];

  // No single event moves a pair more than the whole-stretch cap. The house
  // caps bond movement at ±2.5 per stretch, but the clamp ran at the act
  // boundary — AFTER the effect chip was written — so a bridged Total Drama
  // generator could apply +3.8 in one beat (the comfort event books its boost
  // in both directions of a symmetric bond, doubling it), the chip printed
  // +3.8, and the boundary quietly took 1.3 of it back. Clamping HERE, where
  // the diff is measured, keeps the chip and the world telling one story.
  const EVENT_BOND_CAP = 2.5;
  for (const [key, now] of Object.entries(gs.bonds || {})) {
    let delta = (Number(now) || 0) - (Number(before.bonds[key]) || 0);
    if (!Number.isFinite(delta)) continue;
    if (Math.abs(delta) > EVENT_BOND_CAP) {
      delta = Math.sign(delta) * EVENT_BOND_CAP;
      gs.bonds[key] = (Number(before.bonds[key]) || 0) + delta;
    }
    if (Math.abs(delta) < 0.25) continue;
    const [a, b] = key.split('||');
    if (!a || !b) continue;
    moved.push({ kind: 'bond', text: `${a} & ${b} ${delta > 0 ? '+' : ''}${delta.toFixed(1)}`,
      players: [a, b], delta });
  }
  moved.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  const out = moved.slice(0, 5);

  // Somebody joined something. An alliance recruitment came back with no
  // effects at all, which made one of the loudest moves in the house render as
  // ambient chatter.
  for (const alliance of gs.namedAlliances || []) {
    const was = before.alliances[alliance.name];
    const now = alliance.members || [];
    if (!was) {
      if (now.length) out.push({ kind: 'deal', text: `${alliance.name} exists now`, players: [...now] });
      continue;
    }
    const joined = now.filter(n => !was.includes(n));
    const left = was.filter(n => !now.includes(n));
    if (joined.length) out.push({ kind: 'deal', text: `${joined.join(' & ')} → ${alliance.name}`, players: joined });
    if (left.length) out.push({ kind: 'break', text: `${left.join(' & ')} out of ${alliance.name}`, players: left });
  }

  // What people now BELIEVE, which the house acts on rather than the truth.
  const reads = [];
  for (const [key, now] of Object.entries(gs.perceivedBonds || {})) {
    const value = Number(now?.perceived ?? now) || 0;
    const delta = value - (before.perceived[key] || 0);
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.4) continue;
    const [observer, subject] = key.split('\u2192');
    if (!observer || !subject) continue;
    reads.push({ kind: 'suspicion', delta,
      text: `${observer} now reads ${subject} as ${delta > 0 ? 'closer' : 'colder'}`,
      players: [observer, subject] });
  }
  reads.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  out.push(...reads.slice(0, 2));

  return out;
}


/**
 * Append to the history AND keep the derived tallies in step.
 *
 * beatsInvolving() reads a running count rather than scanning, so the count has
 * to move when the history does. It is also rebuilt on a length mismatch, which
 * makes this an optimisation rather than a correctness requirement — but going
 * around it silently costs the whole season a rebuild per call.
 */
function recordBeat(entry) {
  const state = ensureState();
  state.eventHistory.push(entry);
  if (state._beatCounts && state._beatCountsAt === state.eventHistory.length - 1) {
    for (const name of entry.players || []) {
      state._beatCounts[name] = (state._beatCounts[name] || 0) + 1;
    }
    state._beatCountsAt = state.eventHistory.length;
  }
}

/**
 * Where in the house a beat happens.
 *
 * The rooms were decoration — the visual player stamped a random camera label
 * on every card — which meant a strategy conversation could be filed in the
 * washroom and an HOH pitch in the backyard. A location is a fact about an
 * event now: it is where that kind of thing happens, and the feed is read by
 * room because that is how the feeds are actually watched.
 *
 * Events may declare one. Anything that does not gets the room its category
 * belongs in, chosen deterministically so it stays put between renders.
 */
export const BB_ROOMS = ['hoh-room', 'living-room', 'kitchen', 'backyard',
                         'bedroom', 'pantry', 'washroom', 'diary-room'];

const _CATEGORY_ROOMS = {
  ceremonies: ['living-room'],
  phases: ['living-room', 'kitchen', 'backyard'],
  deals: ['hoh-room', 'pantry', 'bedroom', 'backyard'],
  social: ['kitchen', 'bedroom', 'backyard', 'living-room'],
  'house-life': ['kitchen', 'bedroom', 'washroom', 'pantry', 'backyard'],
};

/**
 * Rooms the prose names out loud.
 *
 * Only eighteen of the ninety-six events declare where they happen, so the rest
 * were filed by hashing their id — which meant a beat that opens "Julia gets
 * Caleb alone by the back of the kitchen" could be filed under the HOH room
 * camera. Measured across two seasons, 11.3% of beats sat under a camera their
 * own text contradicted.
 *
 * The writing is the authority. Ordered most specific first, because "the
 * storage room off the kitchen" is the pantry, not the kitchen.
 */
const _ROOM_WORDS = [
  ['diary-room', /\bdiary room\b/i],
  ['hoh-room', /\bHOH(?:'s)? room\b|\bHead of Household(?:'s)? room\b|\bupstairs\b/i],
  ['pantry', /\bpantry\b|\bstorage room\b/i],
  ['washroom', /\bwashroom\b|\bbathroom\b|\bshower\b/i],
  ['backyard', /\bbackyard\b|\bhammock\b|\bby the pool\b|\bpatio\b/i],
  ['kitchen', /\bkitchen\b|\bcounter\b|\bfridge\b/i],
  ['bedroom', /\bbedroom\b|\bbunk\b|\bin bed\b/i],
  ['living-room', /\bliving room\b|\bcouch\b|\blounge\b/i],
];

/**
 * Who is allowed to be in a room at all.
 *
 * The HOH room is the one private space in the house: it locks, and nobody goes
 * up there without the Head of Household. Two houseguests shaking on a final
 * two in a room neither of them has access to is not a small slip — it is the
 * one piece of geography the format actually enforces, and 4.2% of beats broke
 * it.
 */
function _roomAllows(room, beat, ctx) {
  if (room !== 'hoh-room') return true;
  const hoh = ctx?.hoh || ctx?.week?.hoh;
  return !!hoh && (beat.players || []).includes(hoh);
}

function _roomFor(event, beat, ctx) {
  // A location the BEAT set knows which text was chosen, so it is definitive.
  if (beat.location && BB_ROOMS.includes(beat.location)) return beat.location;

  // The writing outranks the event's declared room. An event declares one room
  // for all of its text variants, and those variants disagree with each other —
  // spread-lies is filed in the pantry and half its lines happen in a bedroom.
  // The sentence on the card is what the viewer reads, so it wins.
  for (const [room, re] of _ROOM_WORDS) if (re.test(beat.text || '')) return room;

  if (event.location && BB_ROOMS.includes(event.location)) return event.location;

  const allowed = (_CATEGORY_ROOMS[event.category] || BB_ROOMS).filter(r => _roomAllows(r, beat, ctx));
  const pool = allowed.length ? allowed : BB_ROOMS.filter(r => _roomAllows(r, beat, ctx));
  const key = `${event.id}|${ctx?.beat || 0}|${(beat.players || []).join(',')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length] || 'living-room';
}

function validateBeat(event, beat, ctx) {
  if (!beat || typeof beat.text !== 'string' || !beat.text.trim()) throw new Error(`Big Brother event ${event.id} returned no text.`);
  if (!Array.isArray(beat.players)) throw new Error(`Big Brother event ${event.id} must return players[].`);
  if (!beat.badgeText || !beat.badgeClass) throw new Error(`Big Brother event ${event.id} must return badgeText and badgeClass.`);
  return { ...beat, eventId: event.id, category: event.category, location: _roomFor(event, beat, ctx) };
}

/** How much tonight bends an event's own weight. 1 on an ordinary night. */
function _nightFactor(ctx, event) {
  try {
    if (!isDrinksNight(ctx)) return 1;
    // The night's own beats are not modified by the night.
    if (String(event.id || '').startsWith('drinks-')) return 1;
    return nightModifier(event.category || '', event.id || '');
  } catch { return 1; }
}

/**
 * Where a beat's context comes from, given only which beat index it is.
 *
 * A Battle of the Block week seats TWO Heads of Household, and roughly a
 * hundred events read `ctx.hoh` as "the person with the power". Handing them
 * one name meant half the power in the house could not be written about at
 * all: the co-HOH was never the subject of a reign event, never called the
 * house meeting, never had anybody sucking up to them. Rather than teach
 * every event to count, the beats alternate between the two — so across an
 * act both of them are seen holding it.
 *
 * Pulled out to its own function because the kernel scores an event against
 * this exact per-beat context and then, once selection has finished,
 * `scheduleHouseBeats` needs the SAME context back to actually fire the
 * winner — a beat's context must not silently differ between why an event
 * was picked and what it saw when it ran.
 */
function _beatCtxFor(ctx, beat) {
  const beatCtx = { ...ctx, beat };
  if ((ctx.hohs || []).length === 2) beatCtx.hoh = ctx.hohs[beat % 2];
  return beatCtx;
}

export function scheduleHouseBeats(events, house, ctx, options = {}) {
  if (!Array.isArray(events) || !events.length) return [];
  // The kernel (js/event-scheduler.js) never falls back to Math.random —
  // that default lives here, preserved from before the extraction, so this
  // function's own public behaviour is unchanged for a caller that omits
  // `options.rng`.
  const rng = options.rng || Math.random;
  const api = createHouseEventApi(ctx);

  // The kernel scores and fires ONE beat at a time, in order, so a later
  // beat's weight() call sees whatever the previous beat's fire() just
  // changed — several events (e.g. js/bb-events/social.js's alliance-pair
  // events) depend on that: they read live alliance/bond state in both
  // weight() and fire(), and an earlier beat firing can dissolve exactly the
  // pair a later beat's weight() saw as eligible. Scoring every beat up front
  // against a frozen snapshot and firing them all afterwards crashes on
  // exactly that case — see the note in js/event-scheduler.js.
  //
  // Big Brother's own per-beat context (the beat index, HOH alternation) and
  // its drinks-night weight modifier are folded in through `scoreEvent`
  // rather than taught to the kernel, because both need Big Brother
  // vocabulary (`ctx.hohs`, `isDrinksNight`) the kernel must not know about.
  // `fireEvent` adapts the kernel's generic `(context, meta, rng)` call into
  // Big Brother's real `fire(house, beatCtx, api, rng)` shape and does
  // everything a firing beat has always done: drain the ledger, diff the
  // world, validate the returned beat, and record it.
  const results = scheduleWeightedEvents(events, ctx, {
    rng, min: options.min, max: options.max, maxUses: 2,
    scoreEvent: (event, _context, meta) => {
      const beatCtx = _beatCtxFor(ctx, meta.index);
      // ── THE NIGHT CHANGES THE ODDS, NOT THE CATALOGUE ──
      //
      // A drinks night written as one more card would add a pleasant evening
      // and change nothing. What alcohol actually does to a house is make the
      // events that were already sitting under the threshold fire: the row
      // that had been coming all week, the thing somebody had decided not to
      // say. So it multiplies what is already here — arguments and confessions
      // up, careful vote-counting down — and adds only the few beats that need
      // the drink to make sense.
      return Math.max(0, Number(event.weight(house, beatCtx)) || 0) * _nightFactor(beatCtx, event);
    },
    fireEvent: (event, _context, meta, rngArg) => {
      const beatCtx = _beatCtxFor(ctx, meta.index);
      // Events are handed the seeded rng as a fourth argument. Without it they had
      // to derive any text variety from a hash of the context, because reaching
      // for Math.random would stop a seeded season reproducing. Passing the rng
      // keeps reproducibility and lets an event simply roll.
      // Drained per beat, so each card carries only what ITS event changed
      // rather than everything that has happened in the act so far.
      api._drainLedger();
      const worldBefore = _worldBefore();
      const result = validateBeat(event, event.fire(house, beatCtx, api, rngArg), beatCtx);
      result.effects = [...api._drainLedger(), ..._worldMoved(worldBefore)];
      recordBeat({ week: ctx.week?.num || 0, act: ctx.act, eventId: event.id, players: [...result.players] });
      return result;
    },
  });
  return results.map(pick => pick.result);
}

export function houseEventState() {
  return ensureState();
}

export function playerArchetype(name) {
  return players.find(player => player.name === name)?.archetype || 'floater';
}
