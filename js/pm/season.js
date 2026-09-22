// ══════════════════════════════════════════════════════════════════════
// pm/season.js — a whole Perfect Match season, headless
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors shape: replaces `gs`, plays every episode, writes one
// `gs.episodeHistory` row each (stamped `format`), villa state on `gs.pm`.
// The caller owns `players` (setPlayers) — profiles are resolved from it.
//
// DICE: every episode draws from its own `streamFor(seed, 'ep:N')`, every
// profile from `profile:<name>`, every spark from `spark:a>b`. One episode's
// draws never move another's (ADDING-A-SHOW §11.5 M).
import { gs, setGs, players } from '../core.js';
import { streamFor } from '../dr/rng.js';
import { PERFECT_MATCH_FORMAT } from '../shows.js';
import { resolveIslander } from './profile.js';
import { seedAttraction, attr, compatible } from './chemistry.js';
import { createLedger, noteArrival, closeEpisode, ledgerSnapshot } from './ledger.js';
import { generateEpisodeEvents, makeEvent, partnerOf } from './events.js';
import { romance, friendship, shown, believed, growLove, updateBeliefs, decideMasks,
  relationshipLabel } from './feelings.js';
import { syncLadder, stepOf } from './ladder.js';
import { emo, attachmentLabel, walkRisk } from './emotions.js';
import { runVillaDay } from './villa-day.js';
import { SEASON_TEMPLATE } from './schedule.js';
import { MOMENTS } from './moments.js';

function initState(cast, setup, seed) {
  const state = { ep: 0, day: 0, villa: [], casa: [], split: false, couples: [], profiles: {},
    ledger: createLedger(), secrets: [], seq: 0, recouplings: 0, history: [], casaArrivals: [],
    shows: {}, believes: {}, ladder: {}, ladderBelief: {}, coupledSince: {}, loveSaid: {}, emo: {}, seed };
  for (const name of cast) {
    const player = players.find(p => p.name === name) || { name };
    state.profiles[name] = resolveIslander(player, setup[name] || {}, streamFor(seed, `profile:${name}`));
  }
  return state;
}

function queuesFor(state, cast) {
  const byRole = role => cast.filter(n => state.profiles[n].role === role);
  return { starter: byRole('starter'), bombshell: byRole('bombshell'), casa: byRole('casa') };
}

/** A walk: heartbreak with the ex still here, or loneliness and stress (spec §6.8). */
function maybeWalk(state, rng) {
  for (const n of state.villa) {
    const { p, cause } = walkRisk(state, n);
    if (rng() < p) return { name: n, cause };
  }
  return null;
}

/** Per-episode relationship snapshot, so an old episode replays its own hearts (§11.5 B). */
function relationshipSnapshot(state) {
  const rel = {}, labels = [];
  for (const a of state.villa) for (const b of state.villa) {
    if (a === b) continue;
    const r = romance(a, b), f = friendship(a, b);
    if (!compatible(state, a, b) && Math.abs(f) < 3) continue;
    rel[`${a}→${b}`] = [r, Math.round(f * 100) / 100, shown(state, a, b), believed(state, b, a)];
    const l = relationshipLabel(state, a, b);
    if (l) labels.push([a, b, l[0], l[1]]);
  }
  return { rel, labels };
}

export function playPerfectMatchSeason({ cast, setup = {}, seed = 1, schedule = SEASON_TEMPLATE,
  splitOrStealOn = false, dialect = 'uk' } = {}) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [],
    episodeHistory: [], popularity: {} });
  const state = initState(cast, setup, seed);
  // The season's default voice, for any islander whose cast setup left it blank.
  state.dialect = dialect;
  gs.pm = state;
  const queues = queuesFor(state, cast);
  let final = null;

  for (const entry of schedule) {
    state.ep = entry.ep;
    if (entry.days) state.day = entry.days[1];
    // addBond's depth ceiling grows with `gs.episode` (js/bonds.js). Left at 0
    // it would cap every villa bond at +4.5 all season — the §11.5 O trap.
    gs.episode = entry.ep;
    const rng = streamFor(seed, `ep:${entry.ep}`);
    if (entry.ep === 1) {
      for (const n of queues.starter) {
        state.villa.push(n); noteArrival(state.ledger, n, 1); seedAttraction(state, n, seed);
      }
    }
    const ctx = { rng, entry, seed, queues, popularity: gs.popularity, splitOrStealOn, closed: false };
    const day = entry.moment === 'reunion' ? [] : generateEpisodeEvents(state, rng);
    state.history.push(...day);
    const m = MOMENTS[entry.moment](state, ctx);
    state.history.push(...m.events);
    syncLadder(state);
    // Feelings move once a day's worth of events has happened: love grows in
    // couples, masks are chosen, beliefs drift toward what was shown.
    const mrng = streamFor(seed, `mask:${entry.ep}`);
    growLove(state, state.couples);
    decideMasks(state, mrng);
    updateBeliefs(state);
    const vday = entry.moment === 'reunion' ? [] : runVillaDay(state, streamFor(seed, `day:${entry.ep}`), entry);
    day.push(...vday);
    state.history.push(...vday);

    const exits = [...m.exits];
    if (!ctx.closed) closeEpisode(state.ledger, state.ep, gs.popularity);
    if (entry.moment !== 'reunion' && entry.moment !== 'final') {
      const walker = maybeWalk(state, rng);
      if (walker) {
        const before = state.couples.map(c => [...c]);
        const ev = makeEvent(state, rng, { phase: 'firepit', kind: 'walk', players: [walker.name], aired: true,
          major: [walker.name], extra: { cause: walker.cause, pop: { [walker.name]: { approval: 3, fame: 2 } } } });
        m.events.push(ev); state.history.push(ev);
        state.villa = state.villa.filter(n => n !== walker.name);
        state.couples = state.couples.filter(c => !c.includes(walker.name));
        exits.push({ name: walker.name, verb: 'walked', channel: 'walk', cause: walker.cause });
        // With no recoupling left, the one left behind can never be coupled
        // again, and the final is couples only: they leave with their partner.
        const left = before.find(c => c.includes(walker.name))?.find(n => n !== walker.name) || null;
        const recoupleAhead = schedule.slice(schedule.indexOf(entry) + 1).some(e => e.moment === 'recoupling');
        if (left && !recoupleAhead && state.villa.includes(left)) {
          const ev2 = makeEvent(state, rng, { phase: 'firepit', kind: 'walk', players: [left, walker.name], aired: true,
            major: [left], extra: { cause: 'solidarity', pop: { [left]: { approval: 2, fame: 1.5 } } } });
          m.events.push(ev2); state.history.push(ev2);
          state.villa = state.villa.filter(n => n !== left);
          exits.push({ name: left, verb: 'walked', channel: 'walk', cause: 'solidarity' });
        }
      }
    }
    if (m.extra?.final) final = m.extra.final;
    const snap = ledgerSnapshot(state.ledger);
    const { rel, labels } = relationshipSnapshot(state);
    gs.activePlayers = [...state.villa];
    gs.episodeHistory.push({
      num: entry.ep, format: PERFECT_MATCH_FORMAT, days: entry.days, moment: entry.moment,
      eliminated: exits.find(x => x.verb === 'dumped')?.name || null,
      exits, votes: m.ballots,
      pm: { events: [...day, ...m.events], couples: state.couples.map(c => [...c]), villa: [...state.villa],
        shares: m.extra?.shares || null, bottom: m.extra?.bottom || null,
        majors: [...new Set([...day, ...m.events].flatMap(e => e.aired ? e.major : []))],
        labels: snap.label, approval: snap.approval, fame: snap.fame,
        envelope: m.extra?.envelope || null, revealed: m.extra?.revealed || null,
        relationships: rel, relLabels: labels,
        ladder: { ...state.ladder },
        emotions: Object.fromEntries(state.villa.map(n => {
          const e = emo(state, n);
          return [n, { security: e.security, confidence: e.confidence, loneliness: e.loneliness,
            guilt: e.guilt, heartbreak: e.heartbreak, stress: e.stress,
            jealousy: Math.max(0, ...Object.values(e.jealousy), 0) }];
        })),
        ...(entry.ep === 1
          ? { attachment: Object.fromEntries(state.villa.map(n => [n, attachmentLabel(state.profiles[n])])) }
          : {}),
        bonds: Object.fromEntries(state.couples.map(([a, b]) => [`${a}|${b}`, romance(a, b)])) },
    });
  }
  const winners = final ? [...final[0].couple] : [];
  return { rows: gs.episodeHistory, winners, final, state };
}
