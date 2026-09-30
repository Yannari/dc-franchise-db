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
import { standardBlocking, goodbyeVideo, deliverReports, applyBlock } from './blocking.js';
import { FORMATS, prepareNight, runBlocking } from './formats.js';
import { bookSeason } from './timeline.js';
import { arrive, chooseNewcomer } from './arrivals.js';
import { powersMorning, jokerMeets, runDisrupter } from './powers.js';
import { runEvent, endSwap } from './twists.js';
import { addAI } from './ai.js';
import { openLedger, noteJoin, airDay, fanFavorite, publicPick } from './public.js';
import { buildSchedule } from './schedule.js';
import { finalDay, finaleDay } from './finale.js';
import { chooseAired } from './airing.js';
import { writeDay } from './script.js';
import { pickGame, runGame } from './games.js';
import { runParty } from './party.js';
import { apartmentLife, videoFromHome } from './life.js';

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
  // What the draw dealt each player, as it stood before anything aired: the
  // cast cards show it (js/ci-cast-ui.js). Twists change profiles later.
  state.dealt = Object.fromEntries(truths.map(t => {
    const p = state.profiles[state.handleOf[t.name]];
    return [t.name, { mode: p.mode, personaId: p.personaId ?? null, reason: p.reason ?? null,
      edits: [...(p.edits || [])], shown: { ...p.shown }, with: p.players.filter(n => n !== t.name) }];
  }));
  state.dealtUnused = [...state.unused];
  // The AI player (US 6), a season option: one more starter from Day 1.
  if (state.options.ai) handles.push(addAI(state));
  openLedger(state);
  seedAttraction(state, streamFor(seed, 'spark'));
  applyCarried(state, carried);

  const isNewcomer = h => peopleOf(state, h).every(n => state.people[n].role === 'newcomer');
  const starters = handles.filter(h => !isNewcomer(h));
  const queue = handles.filter(isNewcomer);
  const schedule = buildSchedule({ total: handles.length, starters: starters.length,
    finalists: state.options.finalists, days: state.options.days });
  // What each ratings night is: booked by slot, or drawn (Plan 3b).
  const booked = bookSeason(schedule, streamFor(seed, 'timeline'),
    { total: handles.length, finalists: state.options.finalists, bookings: state.options.bookings || {} });
  schedule.splice(0, schedule.length, ...booked);
  state.schedule = schedule;

  const rows = [];
  let finalRow = null, result = null;
  for (const d of schedule) {
    state.day = d.day;
    // A re-run turns this day's dice once more (options.rerolls[day]); every
    // other day keeps its own, so earlier episodes come back identical.
    const turn = (state.options.rerolls || {})[d.day];
    const ds = name => streamFor(seed, turn ? `${name}#${turn}` : name);
    const rng = ds(`day:${d.day}`);
    if (d.day === 1) {
      for (const h of starters) { state.active.push(h); state.joinedDay[h] = 1; initMind(state, h); noteJoin(state, h); }
      addScene(state, 'profiles', [...starters], {}, [...starters]);
    } else {
      for (const h of state.active) driftMind(state, h);
      for (const h of state.pendingGoodbyes.splice(0)) goodbyeVideo(state, rng, h);
      deliverReports(state, rng);
      powersMorning(state, ds(`powers:${d.day}`));
      endSwap(state);
      if (d.twist) {
        const nextBlock = schedule.find(x => x.day > d.day && x.block)?.day ?? d.day + 1;
        const finalDayN = schedule.find(x => x.final)?.day ?? schedule.length;
        const out = runEvent(state, ds(`twist:${d.day}`), d.twist,
          { until: d.twist === 'swap' ? nextBlock : finalDayN });
        // A clone vote ends with whoever the room called fake leaving.
        if (d.twist === 'clone' && out?.fake) {
          applyBlock(state, out.fake, 'clone', [], out.scene);
          state.pendingGoodbyes.push(out.fake);
        }
      }
      // Finale day is the studio: the phones are off after the final ratings.
      if (!d.finale) morningFeed(state, rng);
    }
    // Chosen by the Influencers: they pick which of two waiting profiles comes
    // in now; the other waits for the next arrival (US 4 Ep 1, US 6 Ep 1).
    let entry = d.entry || 'snoop', entryCtx = {};
    if (entry === 'chosen') {
      const by = state.ratings.filter(r => !r.final && !r.hidden).at(-1)?.influencers?.filter(i => state.active.includes(i)) || [];
      if (d.arrivals === 1 && queue.length >= 2 && by.length) {
        const offered = queue.slice(0, 2);
        const pick = chooseNewcomer(state, ds(`chosen:${d.day}`), offered, by);
        if (pick !== queue[0]) queue.splice(0, 2, pick, queue[0]);
        entryCtx = { offered, by };
      } else entry = 'snoop';
    }
    const arriving = queue.splice(0, d.arrivals);
    if (arriving.length) {
      arrive(state, ds(`arrive:${d.day}`), arriving, entry, entryCtx);
      for (const h of arriving) noteJoin(state, h);
      jokerMeets(state, ds(`joker:${d.day}`), arriving);
    }
    recognise(state, carried);

    // Alone in the apartment, then the chats, the game, and the evening:
    // a party (a party day, or a prize) or Circle Chat; then videos from home.
    if (!d.finale) apartmentLife(state, ds(`life:${d.day}`));
    const ctx = contextFor(state, d);
    if (!d.finale) for (const plan of planChats(state, rng, ctx)) runChat(state, rng, plan, ctx);
    if (d.disrupter) runDisrupter(state, ds(`disrupter:${d.day}`));
    if (d.game) {
      const g = pickGame(state, ds(`game:${d.day}`), { days: schedule.length });
      if (g) runGame(state, ds(`game:${d.day}:play`), g);
    }
    if (!d.finale) {
      if (d.party || state.partyNext) { state.partyNext = false; runParty(state, ds(`party:${d.day}`)); }
      else runCircleChat(state, rng);
    }
    const videos = new Set(state.homeVideoFor || []);
    state.homeVideoFor = [];
    if (d.homeVideos) for (const h of state.active) if (!(state.homeVideosSeen || []).includes(h)) videos.add(h);
    if (videos.size) videoFromHome(state, ds(`home:${d.day}`), [...videos]);

    let rating = null;
    if (d.block) {
      const night = prepareNight(state, { ...(d.night || { format: 'standard' }) }, ds(`night:${d.day}`));
      state.publicChoice = night.format === 'public-super' ? publicPick(state) : null;
      const f = FORMATS[night.format] || FORMATS.standard;
      rating = runRating(state, rng, { seats: f.seats ?? 2, pick: f.pick, hidden: !!f.hidden, human: !!f.human });
      runBlocking(state, rng, rating, night);
    }
    if (d.final) { finalRow = finalDay(state, rng); rating = finalRow; }
    if (d.finale) result = finaleDay(state, rng, finalRow);

    // The edit, then the words: what aired is decided first, and the writing
    // layer has its own dice (Plan 2), so neither can move a result.
    chooseAired(state, d.day);
    if (state.options.script !== false) writeDay(state, d.day);
    airDay(state);
    // `num` and the people still in are what the site's run tab reads; the
    // name map lets an episode be shown later without the engine's state.
    const row = { num: d.day, episode: d.day, day: d.day, format: CIRCLE_FORMAT, slot: d.slot,
      ci: { active: [...state.active], rating,
        // The night's blocking format, and whether the author booked it (or
        // booked one that could not run, and it fell back).
        night: d.night ? { format: d.night.format, booked: !!d.night.booked, fellBack: d.night.fellBack || null } : null,
        people: state.active.flatMap(h => peopleOf(state, h)),
        profiles: Object.fromEntries(Object.entries(state.profiles).map(([h, p]) =>
          [h, { name: p.shown?.name, people: [...p.players], mode: p.mode }])),
        blocked: state.blocked.filter(b => b.day === d.day).map(b => b.handle),
        arrivals: arriving, scenes: state.scenes.filter(s => s.day === d.day).length,
        aired: state.scenes.filter(s => s.day === d.day && s.aired)
          .map(s => ({ id: s.id, kind: s.kind, who: s.who, script: s.script || null,
            ...(s.kind === 'game' ? { game: s.data.gameId } : {}) })) } };
    rows.push(row);
    gs.episodeHistory.push(row);
  }
  result.fanFavorite = fanFavorite(state);
  return { rows, state, result };
}
