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
import { exitNight, answerStretch, hookFor } from './stretch.js';
import { gs, setGs, players } from '../core.js';
import { streamFor } from '../dr/rng.js';
import { PERFECT_MATCH_FORMAT } from '../shows.js';
import { resolveIslander } from './profile.js';
import { seedAttraction, attr, compatible, attractionOf } from './chemistry.js';
import { createLedger, noteArrival, closeEpisode, ledgerSnapshot, POP_SCALE } from './ledger.js';
import { setRelationshipDimension } from '../relationships.js';
import { becomeFriends, rekindle, splitRecords, setSplit } from './just-friends.js';
import { generateEpisodeEvents, makeEvent, partnerOf, PHASE_BUDGETS } from './events.js';
import { nightDebrief } from './debrief.js';
import { runChallenge } from './challenges.js';
import { romance, friendship, shown, believed, growLove, updateBeliefs, decideMasks,
  relationshipLabel, setMask } from './feelings.js';
import { syncLadder, stepOf } from './ladder.js';
import { emo, attachment, attachmentLabel, walkRisk, feel } from './emotions.js';
import { addBond, getBond, bKey } from '../bonds.js';
import { proneness } from './breakdown.js';
import { runVillaDay } from './villa-day.js';
import { beginThreads, threadBeats, reactions, queueReaction, bedChats, tonightBeats } from './threads.js';
import { seasonSchedule, withPicks, withBookings, resolveRandomGames, buildSchedule, FINAL_COUPLES } from './schedule.js';
import { MOMENTS, nightOneOpening } from './moments.js';
import { returnIslander, secondChance } from './arrivals.js';
import { loadKin, applyCarriedBonds, seedKinAttraction, kinLabel } from './kin.js';

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
// The risk is a three-day episode's: a shorter one (a villa day between
// dumpings is two) carries its share. Rolled per episode unscaled, the six
// villa days took walks from 68 to 114 a hundred seasons.
function maybeWalk(state, rng, entry) {
  const share = entry?.days ? (entry.days[1] - entry.days[0] + 1) / 3 : 1;
  // Nobody walks the night they stood up and chose somebody, or said yes to
  // somebody who did (season 33: Jordan picked Mia, then walked) — nor the
  // night they came back from Casa with someone new (Nadia, back with Sammy,
  // walked out over Jordan an hour later), or a bombshell picked them.
  const coupling = e => e.kind === 'recouple-pick' || e.kind === 'steal'
    || (e.kind === 'casa-return' && e.extra?.choice === 'twist');
  const choseTonight = new Set((state.history || []).filter(e => e.ep === state.ep && coupling(e)).flatMap(e => e.players.slice(0, 2)));
  for (const n of state.villa) {
    if (choseTonight.has(n)) continue;
    const { p, cause } = walkRisk(state, n);
    if (rng() < p * share) return { name: n, cause };
  }
  return null;
}

/** Per-episode relationship snapshot, so an old episode replays its own hearts (§11.5 B). */
function relationshipSnapshot(state) {
  const rel = {}, labels = [];
  for (const a of state.villa) for (const b of state.villa) {
    if (a === b) continue;
    const r = romance(a, b), f = friendship(a, b);
    // Friends who could never fancy each other count from the first real
    // friendship (user: "between boys and girls friendship is important too,
    // bromance, girlmance"): at 3 the panel hid every one of them until week two.
    if (!compatible(state, a, b) && Math.abs(f) < 1) continue;
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
  // There is no unnamed challenge any more: a day's challenge is a named one
  // with its rules (schedule.js fills every villa day), and the time the
  // generic one took is ordinary villa time — its kisses and "winners" had
  // no name, no rules and no start, and read as scenes from nowhere.
  // THE STORIES DECIDE THE DAY (pm/threads.js; user, 2026-10-25: "no
  // storyline … no cause, no consequences"). The episode's threads play their
  // beats, the villa reacts to them, and the random draw is only the texture
  // between: a few scenes a part of the day, light ones, with no pull, kiss
  // or row from nowhere (those belong to a story).
  const trng = streamFor(seed, `threads:${entry.ep}${state.epSalt}`);
  beginThreads(state, trng, entry);
  // A villa day has no fire pit and no ceremony: the night is the villa's —
  // drinks, the terrace, the beds — so its evening runs longer. Casa Amor is
  // the season's biggest drama (user): its nights keep their temptations.
  const casa = !!state.split;
  // (Measured: at +4 a night, Casa's twists fell from a third of the tempted to a fifth.)
  const T = { morning: TEXTURE.morning + (casa ? 3 : 0), day: TEXTURE.day + (casa ? 6 : 0), evening: TEXTURE.evening + (entry.moment === 'villa' ? 3 : 0) + (casa ? 7 : 0) };
  const part = (phase, n) => storyPhase(state, rng, trng, phase, n, entry);
  if (entry.moment === 'first-coupling') return [...part('day', T.day), ...part('evening', T.evening)];
  if (!entry.challenge) return [...part('morning', T.morning), ...part('day', T.day + 2), ...part('evening', T.evening)];
  const out = [...part('morning', T.morning), ...part('day', T.day)];
  const chal = runChallenge(state, streamFor(seed, `chal:${entry.ep}${state.epSalt}`), entry.challenge);
  if (chal.length) state._namedChallengeEp = entry.ep;
  for (const e of chal) queueReaction(state, e);
  out.push(...chal);
  // A challenge that could not play (too few couples) leaves the afternoon
  // to the villa.
  if (!chal.length) out.push(...part('day', 3));
  // What the game left behind opens the evening (pm/challenge-frame.js).
  const after = chal.length ? state._chalEvening || [] : [];
  state._chalEvening = null;
  for (const e of after) queueReaction(state, e);
  state.history.push(...after);
  out.push(...after, ...part('evening', T.evening));
  return out;
}

// The day's texture: a few light scenes a part of the day around the stories.
// Pulls stay (a spark is how a story starts) but rare; gossip and the moan
// about a partner are the stories' own now (threads.js secret and doubt).
const TEXTURE = { morning: 5, day: 8, evening: 6 };
const TEXTURE_KINDS = {
  morning: [['chat', 4], ['kiss', 2], ['friendship', 3], ['comedy', 1.5], ['ick', 0.4]],
  // Rows keep their real causes (events.js argumentReasons): a villa has a few.
  day: [['chat', 2.5], ['deep-chat', 1.5], ['pull', 0.6], ['friendship', 3], ['comedy', 2], ['argument', 0.9], ['ick', 0.6]],
  evening: [['kiss', 3], ['deep-chat', 2], ['pull', 0.4], ['argument', 1], ['friendship', 1], ['chat', 0.5], ['comedy', 1], ['bed-share', 1.2]],
};
/**
 * One part of the day: last part's reactions, then the stories intercut with
 * the texture — a little villa life, a thread's beat, a little more, the next
 * thread — and the reactions those beats left due before it ends.
 */
// Casa Amor's days are temptation (user: "it should still be the biggest source of
// drama in the season"): the pulls, the beds and the missing are the texture.
// Measured: with the villa's ordinary mix, twists fell from a third of the
// tempted to a quarter (about one pull a Casa day instead of five).
const CASA_KINDS = {
  morning: [['chat', 2], ['pull', 2.5], ['friendship', 1.5], ['comedy', 1], ['kiss', 1]],
  day: [['pull', 3.5], ['chat', 2], ['deep-chat', 1.2], ['friendship', 1.5], ['comedy', 1], ['argument', 0.6]],
  evening: [['pull', 2.5], ['bed-share', 2.5], ['kiss', 1.5], ['deep-chat', 1.2], ['argument', 0.6], ['comedy', 0.6]],
};
function storyPhase(state, rng, trng, phase, texture, entry = null) {
  const kinds = { [phase]: (state.split ? CASA_KINDS : TEXTURE_KINDS)[phase] || TEXTURE_KINDS.day };
  const draw = n => {
    const evs = n > 0 ? generateEpisodeEvents(state, rng, { [phase]: n }, { kinds }) : [];
    for (const e of evs) queueReaction(state, e);
    return evs;
  };
  const out = [...reactions(state, trng, phase, 3)];
  const stories = (state._th?.headline || []).length;
  const per = Math.max(1, Math.floor(texture / (stories + 1)));
  let left = texture;
  out.push(...draw(Math.min(left, per))); left -= Math.min(left, per);
  for (let i = 0; i < stories; i++) {
    out.push(...threadBeats(state, trng, phase, 1));
    if (left > 0) { const n = Math.min(left, per); out.push(...draw(n)); left -= n; }
    // Halfway through the day and the evening: tonight, on everybody's mind.
    if (i === 1 && (phase === 'day' || phase === 'evening')) out.push(...tonightBeats(state, trng, phase, entry, phase === 'day' ? 2 : 1));
  }
  if (stories < 2 && (phase === 'day' || phase === 'evening')) out.push(...tonightBeats(state, trng, phase, entry, phase === 'day' ? 2 : 1));
  out.push(...draw(left));
  out.push(...reactions(state, trng, phase, 3));
  return out;
}

/**
 * The engine a season was written by. A season built by an older one keeps
 * playing as it was written; pm-run.js offers to continue it on this one from
 * the last aired episode (restoreFromAired). Bump it when the villa changes
 * enough that an old season should be offered the new one.
 */
export const PM_ENGINE = '2026-10-27b';

/**
 * THE RESUME (user, 2026-10-25: "with our new system I don't wanna start a new
 * season"). The villa as the last aired episode left it, rebuilt from what
 * aired — nothing re-simulated, so the past stays exactly as it was watched:
 * who is in and who has gone (and who voted them out, and who they left
 * behind), the couples and Casa Amor, every pair's feelings as the episode's
 * snapshot recorded them (romance, friendship, what was shown and believed),
 * the ladder, the emotions, the public's approval and fame, and the history the
 * scenes read. What no row keeps — secrets nobody found out, the old engine's
 * half-told stories — starts clean. Returns the episode it resumes after.
 */
function restoreFromAired(state, rows, queues, seed) {
  const seen = [];
  let prevCouples = [];
  for (const r of rows) {
    const pm = r.pm || {};
    for (const n of [...(pm.villa || []), ...(pm.casaRoom || []), ...(r.exits || []).map(x => x?.name)]) {
      if (n && state.profiles[n] && !seen.includes(n)) { seen.push(n); noteArrival(state.ledger, n, r.num); }
    }
    (state.epDay ||= {})[r.num] = r.calendar?.[0] ?? r.days?.[0] ?? null;
    for (const x of r.exits || []) {
      if (!x?.name) continue;
      (state.gone ||= []).push({ name: x.name, ep: r.num });
      const by = (r.votes || []).filter(b => !b.save && (b.target === x.name || b.couple?.includes(x.name))).map(b => b.voter);
      if (by.length) (state.dumpedBy ||= {})[x.name] = by;
      const was = (pm.couplesBefore || []).find(c => c.includes(x.name))?.find(m => m !== x.name);
      if (was) (state.leftBehind ||= {})[x.name] = was;
    }
    const now = (pm.couples || []).map(c => [...c].sort().join('|'));
    for (const k of now) if (!prevCouples.includes(k)) state.coupledSince[k] = r.days?.[0] ?? r.num;
    prevCouples = now;
    for (const e of pm.events || []) {
      if (e.kind === 'love-said' && e.players?.length >= 2) {
        state.loveSaid[`${e.players[0]}→${e.players[1]}`] = r.days?.[0] ?? r.num;
        if (e.extra?.back) state.loveSaid[`${e.players[1]}→${e.players[0]}`] = r.days?.[0] ?? r.num;
      }
      if (e.kind === 'movie-clip' && e.extra?.clip) (state.shownClips ||= []).push(e.extra.clip);
      // Every break-up as it was recorded (breakups.js), until they rekindle;
      // a "better as friends" from before the records is two friends.
      if (e.extra?.splitRec?.by) setSplit(state, { ...e.extra.splitRec });
      else if (e.kind === 'doubt-end' && e.extra?.of === 'friends' && e.players?.length >= 2) {
        // Aired before break-ups had a reaction: read it from what was said
        // (user's season 1, ep 11: Mei, "I'm not going to pretend I'm fine"),
        // and from what is still felt once the feelings are back (below).
        const said = (e.script?.lines || []).map(l => l.text || '').join(' ');
        const rec = becomeFriends(state, e.players[0], e.players[1], r.num);
        rec.mood = /I've got enough friends in here|Don't you dare say friends/.test(said) ? 'bitter' : null;
        rec.legacy = true;
      }
      if ((e.kind === 'reunite' || (e.kind === 'rekindle' && e.extra?.of === 'yes')) && e.players?.length >= 2) rekindle(state, e.players[0], e.players[1]);
    }
    if (r.moment === 'photos') state.photosShown = true;
    // The postcards (pm/postcards.js): what each one was sent, for the stick-or-twist and the photos night.
    for (const e of (r.pm?.events || []).filter(x => x.kind === 'postcard' && x.aired)) {
      state.photosShown = true;
      (state.postcards ||= {})[e.players[0]] = { of: e.extra?.of, sev: { bed: 1.1, kiss: 1, pull: 0.6, game: 0.8, close: 0.3, alone: 0 }[e.extra?.of] ?? 0.5,
        about: e.players[1], with: e.players[3] || null, ep: r.num, misleading: !!e.extra?.misleading };
    }
    if (r.moment === 'recoupling') { state.lastRecouplingEp = r.num; state.casaSingles = []; }
    // Casa's leftovers: the ones who stuck while their partner twisted (casa.js).
    if (r.moment === 'stick-or-twist') state.casaSingles = (r.pm?.events || []).filter(e => e.kind === 'casa-return' && e.extra?.choice === 'stick' && e.extra?.theirs === 'twist').map(e => e.players[0]);
    if (r.moment === 'casa-open') state.splitEp = r.num;
    if (r.moment === 'public-vote') state.lastVoteEp = r.num;
    if ((r.exits || []).length) state.lastExitEp = r.num;
  }
  const last = rows[rows.length - 1], P = last.pm || {};
  state.ep = last.num;
  state.day = last.days?.[1] ?? state.day;
  // Night one couples them, and every recoupling night takes the next turn (moments.js pickerGender).
  state.recouplings = (rows.some(r => r.num === 1) ? 1 : 0) + rows.filter(r => r.moment === 'recoupling').length;
  state.villa = [...(P.villa || [])].filter(n => state.profiles[n]);
  state.couples = (P.couples || []).map(c => [...c]).filter(c => c.every(n => state.villa.includes(n)));
  state.split = Array.isArray(P.casaRoom);
  state.casa = state.split ? [...P.casaRoom] : [];
  state.casaArrivals = state.split ? state.villa.filter(n => state.profiles[n].role === 'casa') : [];
  // Nobody who has already walked in walks in again.
  for (const q of [queues.bombshell, queues.casa]) for (let i = q.length - 1; i >= 0; i--) if (seen.includes(q[i])) q.splice(i, 1);
  state.ladder = { ...(P.ladder || {}) };
  for (const [n, e] of Object.entries(P.emotions || {})) {
    if (!state.profiles[n]) continue;
    Object.assign(emo(state, n), { security: e.security, confidence: e.confidence, loneliness: e.loneliness,
      guilt: e.guilt, heartbreak: e.heartbreak, stress: e.stress });
  }
  const L = state.ledger;
  for (const n of seen) {
    if (P.approval?.[n] != null) L.approval[n] = P.approval[n];
    if (P.fame?.[n] != null) L.fame[n] = P.fame[n];
    if (P.labels?.[n]) L.label[n] = P.labels[n];
    // The country's running total, as closeEpisode would have kept it.
    gs.popularity[n] = Math.round((L.approval[n] || 0) * POP_SCALE * 100) / 100;
  }
  // Chemistry first, as it was seeded, for every pair who ever shared the villa;
  // then the last episode's snapshot over the ones still in it.
  for (const a of seen) for (const b of seen) {
    if (a === b || !compatible(state, a, b)) continue;
    const v = attractionOf(state.profiles[a], state.profiles[b], streamFor(seed, `spark:${a}>${b}`));
    if (v != null) setRelationshipDimension(a, b, 'attraction', v);
  }
  const fr = {};
  for (const [key, [r, f, sh, bel]] of Object.entries(P.relationships || {})) {
    const [a, b] = key.split('→');
    if (!state.profiles[a] || !state.profiles[b]) continue;
    if (compatible(state, a, b)) {
      // romance = max(0.9 att, 0.5 att + 0.6 love) (feelings.js): a couple keeps
      // its seeded chemistry and the rest is love; anyone else is all attraction.
      const seedV = attractionOf(state.profiles[a], state.profiles[b], streamFor(seed, `spark:${a}>${b}`)) ?? 0;
      const coupled = state.couples.some(c => c.includes(a) && c.includes(b));
      let att = r / 0.9, love = 0;
      if (coupled && 0.9 * seedV <= r) { att = seedV; love = Math.max(0, (r - 0.5 * att) / 0.6); }
      setRelationshipDimension(a, b, 'attraction', att);
      setRelationshipDimension(a, b, 'love', love);
      if (Math.abs(sh - r) > 0.05) setMask(state, a, b, sh);
      if (Math.abs(bel - sh) > 0.05) state.believes[`${b}:${a}→${b}`] = bel;
    }
    setRelationshipDimension(a, b, 'affection', f);
    setRelationshipDimension(a, b, 'trust', f);
    fr[key] = f;
  }
  for (const key of Object.keys(fr)) {
    const [a, b] = key.split('→');
    const back = fr[`${b}→${a}`];
    gs.bonds[bKey(a, b)] = Math.round(((fr[key] + (back ?? fr[key])) / 2) * 100) / 100;
  }
  // A break-up from before the records: hurt while the one left still feels it, friends once they don't.
  for (const f of splitRecords(state)) {
    if (!f.legacy) continue;
    const r = romance(f.left, f.by);
    f.torch = Math.round(Math.max(r, romance(f.by, f.left)) / 10 * 100) / 100;
    if (!f.mood) f.mood = r >= 5 ? 'hurt' : 'friends';
    delete f.legacy;
  }
  // Exes back together with the feeling back both ways have rekindled.
  for (const f of splitRecords(state)) {
    if (state.couples.some(c => c.includes(f.by) && c.includes(f.left))
      && romance(f.by, f.left) >= 5.5 && romance(f.left, f.by) >= 5.5) rekindle(state, f.by, f.left);
  }
  // The scenes read what already happened (afterOf, first kisses, clips): the aired history.
  // Copies: the engine marks history as it plays, and the aired rows must never change.
  state.history = JSON.parse(JSON.stringify(rows.flatMap(r => r.pm?.events || [])));
  state.seq = state.history.length + 1;
  gs.activePlayers = [...state.villa];
  return last.num;
}

/**
 * `picks` pins drawn slots ({ 5: 'save-one' }). `rerolls` re-deals one
 * episode ({ 7: 2 } = episode 7's third deal): only that episode's dice move,
 * so every earlier episode replays exactly, and every later one follows from
 * the new night the way it would have from any night.
 */
export function playPerfectMatchSeason({ cast, setup = {}, seed = 1, schedule = null, picks = {}, forcedSlots = null, bookings = {}, rerolls = {},
  splitOrStealOn = false, dialect = 'uk', episodes = null, firstIn = 'f', kinship = null, arrivalCounts = null, finalCouples = FINAL_COUPLES,
  carried = null, resume = null } = {}) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [],
    episodeHistory: [], popularity: {} });
  const state = initState(cast, setup, seed);
  // Who knew whom before the villa (the Relationships tab, pm/kin.js) — and,
  // behind it, what the franchise remembers (pm-run.js _carried).
  loadKin(state, cast, kinship, setup, carried?.kin || []);
  applyCarriedBonds(state, cast, carried?.bonds || []);
  // The season's default voice, for any islander whose cast setup left it blank.
  state.dialect = dialect;
  // Who walks in first on night one (Villa options): the girls unless the author says the boys.
  state.firstIn = firstIn === 'm' ? 'm' : 'f';
  // How many couples reach the final (Villa options): four, as the UK has it, or three.
  state.finalCouples = finalCouples === 3 ? 3 : FINAL_COUPLES;
  gs.pm = state;
  const queues = queuesFor(state, cast);
  // Every bombshell and Casa arrival the author cast gets a night to walk in.
  schedule = schedule || withBookings(withPicks(perfectMatchScheduleFor(seed,
    { bombshells: queues.bombshell.length, casa: queues.casa.length, episodes, counts: arrivalCounts, starters: queues.starter.length, finalCouples: state.finalCouples }), picks, forcedSlots), bookings);
  schedule = resolveRandomGames(schedule, streamFor(seed, 'random-games'));
  let final = null;
  // Continuing a season from what aired (restoreFromAired): those rows are the
  // past, exactly as watched, and the loop plays only what comes after them.
  const resumeAt = resume?.rows?.length ? restoreFromAired(state, resume.rows, queues, seed) : 0;
  if (resumeAt) gs.episodeHistory.push(...JSON.parse(JSON.stringify(resume.rows)));
  // A season that aired on another schedule (Casa Amor was two episodes of three
  // days until 2026-10-26): the days run on from the last one aired, never back.
  if (resumeAt) {
    const last = resume.rows[resume.rows.length - 1];
    const lastDay = last.days?.[1] ?? 0, lastCal = last.calendar?.[1] ?? lastDay;
    const next = schedule.find(e => e.ep > resumeAt && e.days);
    const dShift = next && next.days[0] <= lastDay ? lastDay + 1 - next.days[0] : 0;
    const cShift = next?.calendar && next.calendar[0] <= lastCal ? lastCal + 1 - next.calendar[0] : 0;
    if (dShift || cShift) schedule = schedule.map(e => (e.ep <= resumeAt ? e : { ...e,
      ...(e.days ? { days: e.days.map(d => d + dShift) } : {}), ...(e.calendar ? { calendar: e.calendar.map(d => d + cShift) } : {}) }));
  }

  for (const entry of schedule) {
    if (entry.ep <= resumeAt) continue;
    state.ep = entry.ep;
    if (entry.days) state.day = entry.days[1];
    // The day the show says it is (schedule.js calendar); lines read this one.
    state.calendarDay = entry.calendar?.[1] ?? state.day;
    // The day each episode began on, for the final's film to say when a moment was.
    (state.epDay ||= {})[entry.ep] = entry.calendar?.[0] ?? entry.days?.[0] ?? null;
    // addBond's depth ceiling grows with `gs.episode` (js/bonds.js). Left at 0
    // it would cap every villa bond at +4.5 all season — the §11.5 O trap.
    gs.episode = entry.ep;
    // A re-dealt episode salts its own streams, and only its own.
    state.epSalt = rerolls[entry.ep] ? `:r${rerolls[entry.ep]}` : '';
    const rng = streamFor(seed, `ep:${entry.ep}${state.epSalt}`);
    if (entry.ep === 1) {
      for (const n of queues.starter) {
        state.villa.push(n); noteArrival(state.ledger, n, 1); seedAttraction(state, n, seed); seedKinAttraction(state, n);
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
    // …counting the Casa arrivals who will stay after stick or twist (about a
    // third; buildSchedule plans on the same share going home). Left out, the
    // villa before Casa thought it had nobody to spare and the dumpings piled
    // up after it (user: "even with a 26 cast, five episodes with no dump"):
    // ten Casa arrivals are three or four more islanders to lose.
    const casaStay = queues.casa.length - Math.round(queues.casa.length * 0.65);
    const surplus = state.villa.length + queues.bombshell.length + casaStay - 2 * (state.finalCouples + coupledAhead);
    // The couples-only week takes its own share (a couple a night), so the
    // rest is spread over the nights before it, the final recoupling included.
    const pace = surplus / Math.max(1, nights);
    const votesAhead = ahead.filter(e => e !== entry && !e.coupled && e.moment === 'public-vote').length;
    // The season's first booked vote, and whether the villa can spare a couple
    // for it: a small cast's pace sits under a vote a night, and the pace rule
    // alone skipped its first vote every time (voteNight).
    const firstVote = entry.moment === 'public-vote' && !schedule.slice(0, schedule.indexOf(entry)).some(e => e.moment === 'public-vote');
    // The arrival places still to come, for a pair who would take one of them (moments.js arrivals).
    const slotsAhead = ahead.filter(e => e !== entry).map(e => ({ moment: e.moment, n: e.arrivals?.bombshell || 0 })).filter(x => x.n > 0);
    // THE DRY SPELL: episodes since anybody last went home. The real show
    // dumps every 3-8 days (UK 11: days 2, 9, 14, 18, 23, 27, 29, 31, 32, 37…);
    // measured 2026-10-27, ours ran six and seven episodes with nobody leaving
    // whenever the pace alone kept a night safe. From the third, a night that
    // can spare somebody dumps (moments.js recoupleNight, voteNight).
    const dry = state.ep - (state.lastExitEp ?? 1);
    // The next night somebody can leave on, and whether the couples-only week has begun:
    // the stretch's plan runs up to it (pm/stretch.js).
    state._nextExit = ahead.find(e => exitNight(e))?.ep ?? entry.ep;
    state._afterFinalRecoupling = schedule.some(e => e.finalRecoupling && e.ep < entry.ep);
    const ctx = { rng, entry, seed, queues, popularity: gs.popularity, splitOrStealOn, closed: false, pace, votesAhead, coupledAhead, plainNights: nights, firstVote, surplus, slotsAhead, dry };
    // For a partner walking out with the dumped (moments.js): only while the season can spare them.
    state._surplus = surplus;
    // A row that ends a couple mid-day (events.js haveItOut): only before the
    // couples-only stretch, on a night with no vote, with recouplings left to
    // mend it and islanders to spare — the pace above must still reach the
    // final with its couples.
    state._canSplit = ['villa', 'bombshell', 'recoupling'].includes(entry.moment) && !entry.coupled && !entry.finalRecoupling
      && nights >= 2 && surplus >= 2;
    // A recoupling still to come, or Casa's stick or twist: until the last of
    // them, a couple who call it off as friends can still part (pm/threads.js).
    state._recouplingAhead = ahead.some(e => e.moment === 'recoupling' || e.moment === 'stick-or-twist');
    // Episode one opens on the arrivals and the first coupling, before the day.
    if (entry.moment === 'first-coupling') ctx.opening = nightOneOpening(state, ctx);
    // The final's day is the final dates (pm/journey.js): no ordinary villa
    // day before it — season 41's last morning had a pull, a row over the hot
    // water and an ick, hours before the declarations.
    const day = entry.moment === 'reunion' || entry.moment === 'final' ? [] : [...(ctx.opening?.events || []), ...villaDayEvents(state, rng, entry, seed)];
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
    // The love triangles and the rivalries are the evening's own stories, not
    // an appendix after it ("The love triangle", "Elsewhere in the villa" played
    // as separate sections once everyone had gone to bed).
    for (const e of vday) if (e.phase === 'triangle' || e.phase === 'rivals') e.phase = 'evening';
    for (const e of vday) queueReaction(state, e);
    // A night with no ceremony ends in bed: the couples of the day's stories
    // go over it, and what's still due is said before they sleep.
    if (['villa', 'casa-nights'].includes(entry.moment)) {
      const trng = streamFor(seed, `threads-night:${entry.ep}${state.epSalt}`);
      vday.push(...reactions(state, trng, 'evening', 2), ...bedChats(state, trng, 'evening'));
    }
    day.push(...vday);
    state.history.push(...vday);
    // A returning islander walks back in before the night's moment, so at a
    // recoupling they are a new arrival and choose first (pm/arrivals.js).
    // …or several at once, and the public or the villa keeps one of each (the second chance).
    // On its own dice, so a season without one plays exactly as it did.
    const back = entry.oneOff === 'return' ? returnIslander(state, { ep: entry.ep, seed, rng })
      : entry.oneOff === 'second-chance' ? secondChance(state, { ep: entry.ep, seed, rng: streamFor(seed, `second:${entry.ep}${state.epSalt}`), decider: entry.scDecider || null }) : null;
    // The villa as the night's moment finds it: the debrief reads what changed.
    const pre = { villa: [...state.villa], couples: state.couples.map(c => [...c]) };
    const m = MOMENTS[entry.moment](state, ctx);
    if (back) { m.events = [...back.events, ...m.events]; m.extra = { ...(m.extra || {}), oneOff: entry.oneOff, returned: back.name || back.names?.join(', ') }; }
    // THE DEBRIEF after a big night (pm/debrief.js), on its own dice, so the
    // rest of the season plays exactly as it did without it.
    m.events.push(...nightDebrief(state, streamFor(seed, `debrief:${entry.ep}${state.epSalt}`), entry, pre, m));
    // The stretch's stories, answered by the night (pm/stretch.js): what the fire pit didn't show, said after it.
    m.events.push(...answerStretch(state, streamFor(seed, `answer:${entry.ep}${state.epSalt}`), entry, m));
    state.history.push(...m.events);
    syncLadder(state);
    // Feelings move once a day's worth of events has happened: love grows in
    // couples, masks are chosen, beliefs drift toward what was shown.
    const mrng = streamFor(seed, `mask:${entry.ep}${state.epSalt}`);
    growLove(state, state.couples);
    decideMasks(state, mrng);
    updateBeliefs(state);

    const exits = [...m.exits];
    if (exits.length) state.lastExitEp = state.ep;
    if (!ctx.closed) closeEpisode(state.ledger, state.ep, gs.popularity);
    // Nobody walks on the semi-final night either: it is the night the villa
    // is trimmed to its finalists, and a walkout after it (with the partner
    // following) left 40-islander finals with three couples (17 of 20).
    // …nor in the couples-only week, nor on the two nights that set it up
    // (the last vote and the final recoupling): a walkout then took a night's
    // dumping with it, and a vote night went by with nobody sent home
    // (season 31: Sophie walked the night of the last vote).
    // …nor a villa day after the final recoupling: the couples-only week sends
    // one couple a night, and a walk there cut the final to three.
    const afterFinalRecoupling = schedule.some(e => e.finalRecoupling && e.ep < entry.ep);
    // …nor while Casa Amor has the villa split: the one it is about is in the
    // other villa, and so is half of who they would say goodbye to (season
    // 33: Nadia confided in Callum across the split and he walked her out).
    if (entry.moment !== 'reunion' && entry.moment !== 'final' && !entry.coupled && !entry.finalRecoupling
      && entry.slot !== 'vote-post' && !afterFinalRecoupling && !state.split) {
      let walker = maybeWalk(state, rng, entry);
      // With nobody left to walk in, a walk that leaves the villa unable to
      // form the couples its last nights need is not one the show lets happen
      // (UK finals are four couples; a walk late on is answered with a new
      // arrival, and here there is none). Season 9 of the same-sex test: a
      // girl walked on day 42 with the girls already short, the final
      // recoupling made three couples, and the vote and the semi sent nobody.
      if (walker && !(ctx.queues?.bombshell?.length || ctx.queues?.casa?.length)) {
        const ahead = schedule.slice(schedule.indexOf(entry) + 1);
        const need = state.finalCouples + ahead.filter(e => e.coupled).length;
        const partner = partnerOf(state, walker.name);
        const leaves = [walker.name, ...(partner && !ahead.some(e => e.moment === 'recoupling') ? [partner] : [])];
        const left = state.villa.filter(n => !leaves.includes(n));
        const f = left.filter(n => state.profiles[n].gender === 'f').length;
        if (Math.min(f, left.length - f) < need) walker = null;
      }
      if (walker) {
        const before = state.couples.map(c => [...c]);
        // THE WALK, as the show plays it (user: "we have 1 walked out in ep9
        // and we don't even know someone walked out, how does it work?" — it
        // was one line, and they were gone): the reason said out loud to the
        // closest friend first, then the villa told, the goodbye, and the
        // ones left behind — the ex it was about, and the friend who blames them.
        const w = walker.name;
        const ex = walker.cause === 'heartbreak' ? emo(state, w).heartbreakFrom : null;
        // …who may be the walker's own partner still: hurt by the one they are with.
        const withThem = !!ex && partnerOf(state, w) === ex;
        const exNow = ex && !withThem && state.villa.includes(ex) ? partnerOf(state, ex) : null;
        const friend = state.villa.filter(n => n !== w && n !== ex && n !== exNow)
          .sort((x, y) => getBond(w, y) - getBond(w, x))[0] || null;
        const say = (kind, players, extra) => { const e = makeEvent(state, rng, { phase: 'firepit', kind, players, aired: true, extra }); m.events.push(e); state.history.push(e); return e; };
        if (friend) {
          const of = walker.cause === 'homesick' ? 'homesick' : withThem ? 'with-them' : exNow ? 'moved-on' : 'heartbreak';
          feel(state, friend, 'stress', 0.6);
          say('walk-doubt', [w, friend, ...(ex && state.villa.includes(ex) ? [ex] : []), ...(exNow ? [exNow] : [])],
            { of, pop: { [w]: { approval: 0.8, fame: 1 }, [friend]: { approval: 0.3, fame: 0.5 } } });
        }
        const ev = makeEvent(state, rng, { phase: 'firepit', kind: 'walk', players: [walker.name], aired: true,
          major: [walker.name], extra: { cause: walker.cause, pop: { [walker.name]: { approval: 3, fame: 2 } } } });
        m.events.push(ev); state.history.push(ev);
        if (friend) {
          addBond(w, friend, 0.5);
          say('walk-goodbye', [w, friend], { of: walker.cause, pop: { [friend]: { approval: 0.2, fame: 0.5 } } });
          // The one it was about: the guilt, and the friend's blame for it.
          if (ex && state.villa.includes(ex)) {
            feel(state, ex, 'guilt', 1.5);
            addBond(friend, ex, -0.5);
            say('walk-after', [ex, friend, w], { of: withThem ? 'with-them' : exNow ? 'moved-on' : 'heartbreak', pop: { [ex]: { approval: -0.5, fame: 1 }, [friend]: { approval: 0, fame: 0.5 } } });
          }
        }
        // The debrief was cast before anyone walked: nothing in it for somebody gone.
        const stale = e => e.kind === 'debrief' && e.players.includes(w);
        m.events = m.events.filter(e => !stale(e));
        state.history = state.history.filter(e => !stale(e));
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
    // The last thing before the credits (pm/stretch.js hookFor): a text about
    // tomorrow, or the stretch's main story lying awake. On its own dice.
    const nextEntry = schedule[schedule.indexOf(entry) + 1] || null;
    for (const e of hookFor(state, streamFor(seed, `hook:${entry.ep}${state.epSalt}`), entry, nextEntry)) { m.events.push(e); state.history.push(e); }
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
        oneOff: m.extra?.oneOff || null, ...(entry.ep === 1 ? { firstIn: state.firstIn } : {}), challenge: day.some(e => e.phase === 'challenge') ? entry.challenge : null, immune: m.extra?.immune || null, returned: m.extra?.returned || null, couples: state.couples.map(c => [...c]), villa: [...state.villa], ...(state.split ? { casaRoom: [...state.casa] } : {}),
        // Who knew whom before the villa (the Relationships tab): [a, b, relation, words].
        ...(Object.keys(state.kin || {}).length ? { kin: Object.entries(state.kin).map(([k, v]) => [...k.split('|'), v, kinLabel(v)]) } : {}),
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
