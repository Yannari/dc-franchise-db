// Scheduler and state API for Big Brother house events.
// Event prose/library lives in js/bb-events/ and is supplied to this module.
import { gs, seasonConfig, players } from '../core.js';
import {
  addBBRelationship, addBBShowmanceSpark, rememberBBStrategy, setBBTarget,
} from './shared-strategy.js';

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

export function createHouseEventApi(ctx = {}) {
  const state = ensureState();
  return Object.freeze({
    addBond(a, b, delta) {
      if (!a || !b || a === b || !Number.isFinite(Number(delta))) return false;
      return addBBRelationship(a, b, Number(delta));
    },
    popDelta(name, delta) {
      if (!name || !Number.isFinite(Number(delta))) return false;
      // The house was tracking popularity whether or not the season had it
      // switched on, so turning it off changed nothing.
      if (seasonConfig.popularityEnabled === false) return false;
      gs.popularity[name] = (gs.popularity[name] || 0) + Number(delta);
      return true;
    },
    suspicion(observer, subject, delta) {
      if (!observer || !subject || observer === subject) return false;
      const key = `${observer}→${subject}`;
      state.suspicion[key] = clamp((state.suspicion[key] || 0) + Number(delta || 0), 0, 10);
      return true;
    },
    setTarget(actor, target, reason = 'house event') {
      if (!actor || !target || actor === target) return false;
      const changed = setBBTarget(actor, target, reason, ctx);
      if (changed) state.targets[actor] = { target, reason, week: ctx.week?.num || 0, act: ctx.act };
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
      const existing = gs.sideDeals.find(deal => deal.active !== false
        && deal.players?.includes(a) && deal.players.includes(b) && deal.type === type);
      if (existing) return true;
      gs.sideDeals.push({
        players: [a, b], type, active: true, genuine: detail.genuine !== false,
        madeEp: ctx.week?.num || 0, format: 'big-brother', ...detail,
      });
      return true;
    },
    remember(observer, subject, type, strength = 1, detail = {}) {
      if (!observer || !subject || !type) return false;
      const memory = rememberBBStrategy(observer, subject, type, strength, detail, ctx);
      if (!memory) return false;
      state.memories[observer] ||= [];
      state.memories[observer].push({ subject, type, strength:Number(strength) || 1, week:ctx.week?.num || 0, act:ctx.act, detail });
      return true;
    },
    showmance(a, b, detail = {}) {
      return addBBShowmanceSpark(a, b, detail, ctx);
    },
  });
}

function weightedPick(eligible, rng) {
  const total = eligible.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const entry of eligible) {
    roll -= entry.weight;
    if (roll <= 0) return entry.event;
  }
  return eligible.at(-1)?.event || null;
}

function validateBeat(event, beat) {
  if (!beat || typeof beat.text !== 'string' || !beat.text.trim()) throw new Error(`Big Brother event ${event.id} returned no text.`);
  if (!Array.isArray(beat.players)) throw new Error(`Big Brother event ${event.id} must return players[].`);
  if (!beat.badgeText || !beat.badgeClass) throw new Error(`Big Brother event ${event.id} must return badgeText and badgeClass.`);
  return { ...beat, eventId: event.id, category: event.category };
}

export function scheduleHouseBeats(events, house, ctx, options = {}) {
  if (!Array.isArray(events) || !events.length) return [];
  const rng = options.rng || Math.random;
  const min = Math.max(0, options.min ?? 1);
  const max = Math.max(min, options.max ?? 3);
  const desired = Math.min(max, min + Math.floor(rng() * (max - min + 1)));
  const fired = [];
  // Uses per event, not a used/unused flag.
  //
  // Excluding an event outright once it had fired capped an act at however
  // many events happened to be eligible for that phase, so asking for more
  // beats than that silently returned fewer and the house looked empty. A
  // second airing is allowed but heavily penalised, and a third never happens
  // — and because the beat index feeds each event's text variant, the second
  // airing picks different words and different people.
  const uses = new Map();
  const api = createHouseEventApi(ctx);

  for (let beat = 0; beat < desired; beat++) {
    const beatCtx = { ...ctx, beat };
    const usable = events.filter(event => event?.id && typeof event.weight === 'function' && typeof event.fire === 'function')
      .map(event => ({ event, uses: uses.get(event.id) || 0, weight: Math.max(0, Number(event.weight(house, beatCtx)) || 0) }))
      .filter(entry => entry.weight > 0);
    // Fresh events are not merely preferred, they are exhausted first. Only
    // once nothing new is eligible does an event get a second airing, so a
    // longer act never costs variety it could have had.
    const fresh = usable.filter(entry => entry.uses === 0);
    const eligible = fresh.length ? fresh : usable.filter(entry => entry.uses < 2);
    const event = weightedPick(eligible, rng);
    if (!event) break;
    uses.set(event.id, (uses.get(event.id) || 0) + 1);
    // Events are handed the seeded rng as a fourth argument. Without it they had
    // to derive any text variety from a hash of the context, because reaching
    // for Math.random would stop a seeded season reproducing. Passing the rng
    // keeps reproducibility and lets an event simply roll.
    const result = validateBeat(event, event.fire(house, beatCtx, api, rng));
    fired.push(result);
    ensureState().eventHistory.push({ week: ctx.week?.num || 0, act: ctx.act, eventId: event.id, players: [...result.players] });
  }
  return fired;
}

export function houseEventState() {
  return ensureState();
}

export function playerArchetype(name) {
  return players.find(player => player.name === name)?.archetype || 'floater';
}
