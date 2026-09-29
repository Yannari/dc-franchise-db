// ══════════════════════════════════════════════════════════════════════
// ci/season.js — a whole season of The Circle, headless
// ══════════════════════════════════════════════════════════════════════
//
// The Perfect Match / Traitors shape: replaces `gs`, plays every day, writes
// one `gs.episodeHistory` row a day stamped `format`, and returns the Circle
// state. The caller owns `players` (setPlayers) — truths are read from it.
//
// DICE: the pool draw from `pool`, profiles from `profiles`, first sparks from
// `spark`, and every day from `day:N` — one day's draws never move another's
// (ADDING-A-SHOW §11.5 M).
//
// FRANCHISE: this function sets its own gs, so it gets none of the franchise's
// seeded bonds for free (ADDING-A-SHOW §8.3). The caller (js/ci-run.js, Plan 4)
// passes franchise-carry's `carriedFor(...)` as `carried`; the ledger write is
// Plan 6.
import { gs, setGs, players } from '../core.js';
import { streamFor } from '../dr/rng.js';
import { CIRCLE_FORMAT } from '../shows.js';
import { newState, addScene, bump, peopleOf } from './state.js';
import { truthOf, drawPersonas, buildProfiles } from './profiles.js';
import { setBelief } from './beliefs.js';
import { initMind, driftMind } from './mind.js';
import { seedAttraction, planChats, contextFor } from './chat.js';
import { runChat } from './conversation.js';
import { morningFeed, runCircleChat } from './feed.js';
import { runRating } from './ratings.js';
import { standardBlocking, goodbyeVideo, deliverReports } from './blocking.js';
import { arrive } from './arrivals.js';
import { openLedger, noteJoin, airDay, fanFavorite } from './public.js';
import { buildSchedule } from './schedule.js';
import { finalDay, finaleDay } from './finale.js';

export const CARRY = 0.6;

/** Past seasons (spec §4.7): only a player who can SEE who the other is carries the feeling. */
export function applyCarried(state, carried) {
  for (const { a, b, delta } of carried?.sums || []) {
    const ha = state.handleOf[a], hb = state.handleOf[b];
    if (!ha || !hb || ha === hb) continue;
    if (state.profiles[hb].mode !== 'catfish') { bump(ha, hb, 'affection', delta * CARRY); bump(ha, hb, 'trust', delta * CARRY); }
    if (state.profiles[ha].mode !== 'catfish') { bump(hb, ha, 'affection', delta * CARRY); bump(hb, ha, 'trust', delta * CARRY); }
  }
}

/** A catfish wearing an alum's face is recognised by anyone who knows that alum. */
function recognise(state, carried) {
  const known = carried?.sums || [];
  const seen = state.recognised;
  for (const [h, p] of Object.entries(state.profiles)) {
    const face = p.shown?.face || '';
    if (!face.startsWith('alum:') || !state.active.includes(h)) continue;
    const alum = face.slice(5);
    for (const obs of state.active) {
      if (obs === h || seen[`${obs}>${h}`]) continue;
      const knows = peopleOf(state, obs).some(n => known.some(s => (s.a === n && s.b === alum) || (s.b === n && s.a === alum)));
      if (!knows) continue;
      seen[`${obs}>${h}`] = true;
      const sc = addScene(state, 'recognise', [obs], { profile: h, alum }, [obs]);
      setBelief(state, obs, h, 'real', 0.05, sc);
      setBelief(state, obs, h, 'guessOf', alum, sc);
    }
  }
}

export function playCircleSeason({ cast, setup = {}, pool = [], options = {}, seed = 1, carried = null }) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [],
    episodeHistory: [], popularity: {} });
  const state = newState(seed, options);
  const truths = cast.map(name => truthOf(players.find(p => p.name === name) || { name, stats: {} }, setup[name] || {}));
  const draw = drawPersonas(truths, pool, streamFor(seed, 'pool'), state.options.pickBy);
  const handles = buildProfiles(state, truths, draw, pool, streamFor(seed, 'profiles'));
  openLedger(state);
  seedAttraction(state, streamFor(seed, 'spark'));
  applyCarried(state, carried);

  const isNewcomer = h => peopleOf(state, h).every(n => state.people[n].role === 'newcomer');
  const starters = handles.filter(h => !isNewcomer(h));
  const queue = handles.filter(isNewcomer);
  const schedule = buildSchedule({ total: handles.length, starters: starters.length,
    finalists: state.options.finalists, days: state.options.days });

  const rows = [];
  let finalRow = null, result = null;
  for (const d of schedule) {
    state.day = d.day;
    const rng = streamFor(seed, `day:${d.day}`);
    if (d.day === 1) {
      for (const h of starters) { state.active.push(h); state.joinedDay[h] = 1; initMind(state, h); noteJoin(state, h); }
      addScene(state, 'profiles', [...starters], {}, [...starters]);
    } else {
      for (const h of state.active) driftMind(state, h);
      for (const h of state.pendingGoodbyes.splice(0)) goodbyeVideo(state, rng, h);
      deliverReports(state, rng);
      morningFeed(state, rng);
    }
    const arriving = queue.splice(0, d.arrivals);
    if (arriving.length) { arrive(state, rng, arriving); for (const h of arriving) noteJoin(state, h); }
    recognise(state, carried);

    const ctx = contextFor(state, d);
    for (const plan of planChats(state, rng, ctx)) runChat(state, rng, plan, ctx);
    if (!d.finale) runCircleChat(state, rng, { party: d.slot === 'social' && d.day % 2 === 0 });

    let rating = null;
    if (d.block) { rating = runRating(state, rng); standardBlocking(state, rng, rating); }
    if (d.final) { finalRow = finalDay(state, rng); rating = finalRow; }
    if (d.finale) result = finaleDay(state, rng, finalRow);

    airDay(state);
    const row = { episode: d.day, day: d.day, format: CIRCLE_FORMAT, slot: d.slot,
      ci: { active: [...state.active], rating,
        blocked: state.blocked.filter(b => b.day === d.day).map(b => b.handle),
        arrivals: arriving, scenes: state.scenes.filter(s => s.day === d.day).length } };
    rows.push(row);
    gs.episodeHistory.push(row);
  }
  result.fanFavorite = fanFavorite(state);
  return { rows, state, result };
}
