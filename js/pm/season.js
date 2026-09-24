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
import { generateEpisodeEvents, makeEvent, partnerOf, PHASE_BUDGETS } from './events.js';
import { nightDebrief } from './debrief.js';
import { runChallenge } from './challenges.js';
import { romance, friendship, shown, believed, growLove, updateBeliefs, decideMasks,
  relationshipLabel } from './feelings.js';
import { syncLadder, stepOf } from './ladder.js';
import { emo, attachment, attachmentLabel, walkRisk } from './emotions.js';
import { proneness } from './breakdown.js';
import { runVillaDay } from './villa-day.js';
import { seasonSchedule, withPicks, withBookings, resolveRandomGames, buildSchedule, FINAL_COUPLES } from './schedule.js';
import { MOMENTS, nightOneOpening } from './moments.js';
import { returnIslander } from './arrivals.js';

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

/**
 * The episodes a season plays: built from its cast (how many bombshells and
 * Casa arrivals) and the author's length, then its formats drawn from its own
 * stream — same seed, same cast, same season (pm/schedule.js).
 */
export const perfectMatchScheduleFor = (seed, shape = {}) =>
  seasonSchedule(streamFor(seed, 'schedule'), buildSchedule(shape));

/**
 * The day before the night. With a named challenge (pm/challenges.js) it is
 * the afternoon: the morning and the day play first, then the challenge from
 * its own stream, then a shorter round of the usual event-phase moments and
 * the evening — so what the challenge brought out is already in the air by
 * dinner, and the night's moment is decided on it.
 */
function villaDayEvents(state, rng, entry, seed) {
  // Night one has no morning before it: they arrive in the afternoon.
  if (entry.moment === 'first-coupling') {
    const { day, event, evening } = PHASE_BUDGETS;
    return generateEpisodeEvents(state, rng, { day, event, evening });
  }
  if (!entry.challenge) return generateEpisodeEvents(state, rng);
  const { morning, day, evening } = PHASE_BUDGETS;
  const out = generateEpisodeEvents(state, rng, { morning, day });
  const chal = runChallenge(state, streamFor(seed, `chal:${entry.ep}${state.epSalt}`), entry.challenge);
  if (chal.length) state._namedChallengeEp = entry.ep;
  out.push(...chal);
  out.push(...generateEpisodeEvents(state, rng, { event: chal.length ? 6 : PHASE_BUDGETS.event, evening }));
  return out;
}

/**
 * `picks` pins drawn slots ({ 5: 'save-one' }). `rerolls` re-deals one
 * episode ({ 7: 2 } = episode 7's third deal): only that episode's dice move,
 * so every earlier episode replays exactly, and every later one follows from
 * the new night the way it would have from any night.
 */
export function playPerfectMatchSeason({ cast, setup = {}, seed = 1, schedule = null, picks = {}, bookings = {}, rerolls = {},
  splitOrStealOn = false, dialect = 'uk', episodes = null, firstIn = 'f' } = {}) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [],
    episodeHistory: [], popularity: {} });
  const state = initState(cast, setup, seed);
  // The season's default voice, for any islander whose cast setup left it blank.
  state.dialect = dialect;
  // Who walks in first on night one (Villa options): the girls unless the author says the boys.
  state.firstIn = firstIn === 'm' ? 'm' : 'f';
  gs.pm = state;
  const queues = queuesFor(state, cast);
  // Every bombshell and Casa arrival the author cast gets a night to walk in.
  schedule = schedule || withBookings(withPicks(perfectMatchScheduleFor(seed,
    { bombshells: queues.bombshell.length, casa: queues.casa.length, episodes }), picks), bookings);
  schedule = resolveRandomGames(schedule, streamFor(seed, 'random-games'));
  let final = null;

  for (const entry of schedule) {
    state.ep = entry.ep;
    if (entry.days) state.day = entry.days[1];
    // The day the show says it is (schedule.js calendar); lines read this one.
    state.calendarDay = entry.calendar?.[1] ?? state.day;
    // addBond's depth ceiling grows with `gs.episode` (js/bonds.js). Left at 0
    // it would cap every villa bond at +4.5 all season — the §11.5 O trap.
    gs.episode = entry.ep;
    // A re-dealt episode salts its own streams, and only its own.
    state.epSalt = rerolls[entry.ep] ? `:r${rerolls[entry.ep]}` : '';
    const rng = streamFor(seed, `ep:${entry.ep}${state.epSalt}`);
    if (entry.ep === 1) {
      for (const n of queues.starter) {
        state.villa.push(n); noteArrival(state.ledger, n, 1); seedAttraction(state, n, seed);
      }
    }
    // THE PACE. How many islanders the villa still has to lose to reach four
    // couples at the final, over the dumping nights left (the semi-final
    // takes a share too). Measured: with fixed caps, a 12-islander cast
    // reached the final with two couples, a 22-islander season stretched to
    // 22 episodes with one, and one squeezed into 12 sent eight home at the
    // semi-final. At the calibration cast the pace sits at 1-2 a night, which
    // leaves every cap where it was tuned.
    const ahead = schedule.slice(schedule.indexOf(entry));
    // The couples-only week after the final recoupling sends one couple home a
    // night, so the villa has to reach it with a couple for each of those nights.
    const coupledAhead = ahead.filter(e => e !== entry && e.coupled).length;
    const nights = ahead.filter(e => !e.coupled && (e.moment === 'recoupling' || e.moment === 'public-vote')).length;
    const surplus = state.villa.length + queues.bombshell.length - 2 * (FINAL_COUPLES + coupledAhead);
    // The couples-only week takes its own share (a couple a night), so the
    // rest is spread over the nights before it, the final recoupling included.
    const pace = surplus / Math.max(1, nights);
    const votesAhead = ahead.filter(e => e !== entry && !e.coupled && e.moment === 'public-vote').length;
    // The season's first booked vote, and whether the villa can spare a couple
    // for it: a small cast's pace sits under a vote a night, and the pace rule
    // alone skipped its first vote every time (voteNight).
    const firstVote = entry.moment === 'public-vote' && !schedule.slice(0, schedule.indexOf(entry)).some(e => e.moment === 'public-vote');
    const ctx = { rng, entry, seed, queues, popularity: gs.popularity, splitOrStealOn, closed: false, pace, votesAhead, coupledAhead, plainNights: nights, firstVote, surplus };
    // Episode one opens on the arrivals and the first coupling, before the day.
    if (entry.moment === 'first-coupling') ctx.opening = nightOneOpening(state, ctx);
    const day = entry.moment === 'reunion' ? [] : [...(ctx.opening?.events || []), ...villaDayEvents(state, rng, entry, seed)];
    state.history.push(...day);
    // The rest of the villa's day — the ladder, feelings, the rituals, the
    // triangles, the fights, the breakdowns — BEFORE the night's moment, as
    // the show runs: the day, then the fire pit, then the debrief. It used to
    // run after the moment and be shown before it (a season-31 read: a close-off
    // with a partner from a recoupling that had not happened yet on screen, a
    // breakdown over photos that came later). What a fire pit causes plays out
    // the next day, and the debrief carries the night itself.
    // Nothing on the final's day either: that night is the declarations.
    const vday = entry.moment === 'reunion' || entry.moment === 'final' ? [] : runVillaDay(state, streamFor(seed, `day:${entry.ep}${state.epSalt}`), entry);
    day.push(...vday);
    state.history.push(...vday);
    // A returning islander walks back in before the night's moment, so at a
    // recoupling they are a new arrival and choose first (pm/arrivals.js).
    const back = entry.oneOff === 'return' ? returnIslander(state, { ep: entry.ep, seed, rng }) : null;
    // The villa as the night's moment finds it: the debrief reads what changed.
    const pre = { villa: [...state.villa], couples: state.couples.map(c => [...c]) };
    const m = MOMENTS[entry.moment](state, ctx);
    if (back) { m.events = [...back.events, ...m.events]; m.extra = { ...(m.extra || {}), oneOff: 'return', returned: back.name }; }
    // THE DEBRIEF after a big night (pm/debrief.js), on its own dice, so the
    // rest of the season plays exactly as it did without it.
    m.events.push(...nightDebrief(state, streamFor(seed, `debrief:${entry.ep}${state.epSalt}`), entry, pre, m));
    state.history.push(...m.events);
    syncLadder(state);
    // Feelings move once a day's worth of events has happened: love grows in
    // couples, masks are chosen, beliefs drift toward what was shown.
    const mrng = streamFor(seed, `mask:${entry.ep}${state.epSalt}`);
    growLove(state, state.couples);
    decideMasks(state, mrng);
    updateBeliefs(state);

    const exits = [...m.exits];
    if (!ctx.closed) closeEpisode(state.ledger, state.ep, gs.popularity);
    // Nobody walks on the semi-final night either: it is the night the villa
    // is trimmed to its finalists, and a walkout after it (with the partner
    // following) left 40-islander finals with three couples (17 of 20).
    // …nor in the couples-only week, nor on the two nights that set it up
    // (the last vote and the final recoupling): a walkout then took a night's
    // dumping with it, and a vote night went by with nobody sent home
    // (season 31: Sophie walked the night of the last vote).
    if (entry.moment !== 'reunion' && entry.moment !== 'final' && !entry.coupled && !entry.finalRecoupling
      && entry.slot !== 'vote-post') {
      const walker = maybeWalk(state, rng);
      if (walker) {
        const before = state.couples.map(c => [...c]);
        const ev = makeEvent(state, rng, { phase: 'firepit', kind: 'walk', players: [walker.name], aired: true,
          major: [walker.name], extra: { cause: walker.cause, pop: { [walker.name]: { approval: 3, fame: 2 } } } });
        m.events.push(ev); state.history.push(ev);
        (state.gone ||= []).push({ name: walker.name, ep: state.ep });
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
          (state.gone ||= []).push({ name: left, ep: state.ep });
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
      num: entry.ep, format: PERFECT_MATCH_FORMAT, days: entry.days, calendar: entry.calendar || entry.days, moment: entry.moment,
      eliminated: exits.find(x => x.verb === 'dumped')?.name || null,
      exits, votes: m.ballots,
      pm: { events: [...day, ...m.events], momentFrom: day.length, dumpFormat: m.extra && 'dumpFormat' in m.extra ? m.extra.dumpFormat : (entry.dumpFormat || null),
        arrivalRule: m.extra?.arrivalRule || null, firstFormat: m.extra?.firstFormat || null,
        oneOff: m.extra?.oneOff || null, ...(entry.ep === 1 ? { firstIn: state.firstIn } : {}), challenge: day.some(e => e.phase === 'challenge') ? entry.challenge : null, immune: m.extra?.immune || null, returned: m.extra?.returned || null, couples: state.couples.map(c => [...c]), villa: [...state.villa],
        // The couples as the night's moment found them (the day plays first now).
        couplesBefore: pre.couples.map(c => [...c]),
        // The night the singles all go, and the couples-only week after it.
        ...(entry.finalRecoupling ? { finalRecoupling: true } : {}), ...(entry.coupled ? { coupled: true } : {}),
        ...(m.extra?.double ? { double: true } : {}),
        shares: m.extra?.shares || null, bottom: m.extra?.bottom || null,
        // A tied save-one night keeps what settled it (the public's shares), so
        // a screen can say why the one with as many saves went home.
        ...(m.extra?.tie ? { tie: m.extra.tie, saved: m.extra.saved, tieShares: m.extra.islanderShares } : {}),
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
        // Who they are underneath, for the Debug screen (user: "can I see the
        // attachment somewhere, like in debug?"): attachment from the stats,
        // persona, and how prone the model makes them to a breakdown.
        attach: Object.fromEntries(state.villa.map(n => {
          const a = attachment(state.profiles[n]);
          return [n, { anxiety: Math.round(a.anxiety * 100) / 100, avoidance: Math.round(a.avoidance * 100) / 100,
            label: attachmentLabel(state.profiles[n]), persona: state.profiles[n].persona, prone: Math.round(proneness(state, n) * 100) / 100 }];
        })),
        ...(entry.ep === 1
          ? { attachment: Object.fromEntries(state.villa.map(n => [n, attachmentLabel(state.profiles[n])])) }
          : {}),
        bonds: Object.fromEntries(state.couples.map(([a, b]) => [`${a}|${b}`, romance(a, b)])) },
    });
  }
  const winners = final?.[0] ? [...final[0].couple] : [];
  return { rows: gs.episodeHistory, winners, final, state };
}
