// ══════════════════════════════════════════════════════════════════════
// dr/season.js — a whole season, with no UI
// ══════════════════════════════════════════════════════════════════════
//
// Plays start to finish from a seed, which is what makes a season re-airable:
// js/dr-run.js calls this once, queues the rows, and hands one to the screen
// per press. Nothing here touches `gs` or the DOM.
import { initDragState } from './state.js';
import { runAudienceVote } from '../audience.js';
import { renderFinaleBeats, insertCongenialityScene } from './finale.js';
import { runDragWeek } from './week.js';
import { assignStorylines, recordBeat, arcSummary } from './storylines.js';
import { MAXI_TYPES, TENTPOLES, maxiById } from './data/challenges.js';
import { MINI_TYPES } from './data/minis.js';
import { JUDGES } from './data/judges.js';
import { SONGS } from './data/songs.js';
import { RUNWAY_CATEGORIES } from './data/runways.js';
import { rngFor } from './rng.js';
import { panelFor } from './judges.js';
import { performQueen } from './perform.js';
import { judgeViews, panelRanking, hostBend } from './judging.js';
import { lipsyncScore, lipsyncCall } from './lipsync.js';

/** How many queens are left standing when the finale begins. */
export const FINALE_SIZE = { top4: 4, top3: 3, top2: 2, 'perform-then-lipsync': 4 };

// What episode one IS, when it is not simply the first ordinary week.
const PREMIERE_MAXI = {
  'talent-show': 'talent-show',
  design: 'design',
  runway: 'runway-challenge',
  'girl-groups': 'girl-group',
  // A porkchop premiere is a runway-only night that still sends somebody home,
  // which is the whole point of the name.
  porkchop: 'runway-challenge',
};

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Weeks before the finale: one queen leaves each. */
export function episodesFor(castSize, finaleType = 'top4') {
  return Math.max(1, castSize - (FINALE_SIZE[finaleType] || 4));
}

/**
 * The season's running order.
 *
 * Pins from the timeline are kept exactly; the gaps are filled with three
 * rules, in this order of priority:
 *
 *   1. the six tentpoles happen once each, spread through the middle of the
 *      season — never episode one and never the last two, because a Snatch
 *      Game on the premiere has no established queens to be funny about;
 *   2. no two adjacent episodes share a chalStyle, so the season does not run
 *      three design weeks together;
 *   3. a challenge that needs more queens than will still be there is not
 *      booked at all.
 */
export function buildSchedule({ episodes, castSize, pinned = [], rng = Math.random, premiere = 'standard' }) {
  const rotating = JUDGES.filter(j => !j.permanent).map(j => j.id);
  const byEp = Object.fromEntries(
    pinned.filter(p => p && p.episode != null).map(p => [Number(p.episode), p]));

  const used = new Set();
  for (const p of Object.values(byEp)) if (p.maxiId) used.add(p.maxiId);

  // Where the tentpoles land. Anything already pinned is not booked twice.
  const tentpolesLeft = TENTPOLES.filter(t => !used.has(t));
  const slots = [];
  for (let e = 2; e <= episodes - 2; e++) if (!byEp[e]?.maxiId) slots.push(e);
  const tentpoleAt = {};
  for (const t of tentpolesLeft) {
    if (!slots.length) break;
    const i = Math.floor(rng() * slots.length);
    tentpoleAt[slots.splice(i, 1)[0]] = t;
  }

  const out = [];
  let prevStyle = null;
  for (let e = 1; e <= episodes; e++) {
    const pin = byEp[e] || {};
    const alive = castSize - (e - 1);

    let maxiId = pin.maxiId
      || (e === 1 && PREMIERE_MAXI[premiere])
      || tentpoleAt[e]
      || null;

    if (!maxiId) {
      const fits = m => m.minCast <= alive;
      const fresh = MAXI_TYPES.filter(m => !m.tentpole && !used.has(m.id) && fits(m) && m.chalStyle !== prevStyle);
      const repeatable = MAXI_TYPES.filter(m => !m.tentpole && fits(m) && m.chalStyle !== prevStyle);
      const anything = MAXI_TYPES.filter(fits);
      const pool = fresh.length ? fresh : repeatable.length ? repeatable : anything.length ? anything : MAXI_TYPES;
      maxiId = pick(rng, pool).id;
    }

    used.add(maxiId);
    prevStyle = maxiById(maxiId)?.chalStyle ?? null;

    out.push({
      _style: prevStyle,
      episode: e,
      maxiId,
      // `miniId` is deliberately checked with `in`: null is a real choice
      // meaning "no mini this week", and undefined means "roll one".
      miniId: 'miniId' in pin ? pin.miniId : pick(rng, MINI_TYPES).id,
      rotatingId: pin.rotatingId || rotating[(e - 1) % rotating.length],
      guest: pin.guest || null,
      songTitle: pin.songTitle || pick(rng, SONGS).title,
      // A category per week, and never the same one twice in a season: the
      // runway is the one thing a viewer sees every single episode, so a
      // repeat is more noticeable here than anywhere else.
      runwayCategory: pin.runwayCategory || null,
    });
  }

  // ── THE ADJACENCY REPAIR ──────────────────────────────────────────
  //
  // The fill loop above avoids repeating a style, but the TENTPOLES were
  // placed before it ran and it cannot move them: two of the six can land next
  // to each other, or beside a filler that shares their style, and the season
  // runs two comedy weeks back to back. So the sequence is repaired
  // afterwards, swapping a clashing episode with the nearest later one that
  // fits in both directions. Pinned episodes are never moved — an author's
  // choice outranks the pacing rule.
  const pinnedEps = new Set(Object.keys(byEp).map(Number));
  for (let i = 1; i < out.length; i++) {
    if (out[i]._style !== out[i - 1]._style) continue;
    if (pinnedEps.has(out[i].episode)) continue;
    for (let j = i + 1; j < out.length; j++) {
      if (pinnedEps.has(out[j].episode)) continue;
      const fitsHere = out[j]._style !== out[i - 1]._style
        && (i + 1 >= out.length || out[j]._style !== out[i + 1]._style);
      const fitsThere = out[i]._style !== out[j - 1]._style
        && (j + 1 >= out.length || out[i]._style !== out[j + 1]._style);
      if (!fitsHere || !fitsThere) continue;
      const a = out[i];
      const b = out[j];
      // Swap the CHALLENGE only. The judge, the song and the guest belong to
      // the night, not to the challenge, and an author who pinned a guest to
      // episode six meant episode six.
      [a.maxiId, b.maxiId] = [b.maxiId, a.maxiId];
      [a._style, b._style] = [b._style, a._style];
      break;
    }
  }
  for (const e of out) delete e._style;

  const catPool = RUNWAY_CATEGORIES.map(c => c.label)
    .filter(l => !out.some(e => e.runwayCategory === l));
  for (const e of out) {
    if (e.runwayCategory) continue;
    if (!catPool.length) catPool.push(...RUNWAY_CATEGORIES.map(c => c.label));
    e.runwayCategory = catPool.splice(Math.floor(rng() * catPool.length), 1)[0];
  }

  return out;
}

/**
 * Record what the week did to the arcs, then hand the row straight back.
 *
 * `cast` is not optional in practice: the variant tests read her drag stats and
 * her style, and without the real player objects every one of them sees a queen
 * of straight fives.
 */
function beat(state, row, cast) {
  state.storylines = recordBeat(state.storylines || [], {
    episode: row.num, row, state, cast,
  });
  return row;
}

function weekCfg(sch, config, num, extra = {}) {
  return {
    num,
    maxiId: sch.maxiId,
    miniId: sch.miniId,
    rotatingId: sch.rotatingId,
    guest: sch.guest,
    songTitle: sch.songTitle,
    runwayCategory: sch.runwayCategory,
    judgeWeights: config.drJudgeWeights || {},
    immunity: !!config.drImmunity,
    // The arcs need to know how far through the season they are: what the
    // frontrunner wants in week two is not what she wants in week eight.
    totalEpisodes: extra.totalEpisodes || 12,
    // Defaults ON: an unset value means the format's ordinary rule applies.
    allowDoubleShantay: config.drDoubleShantay !== false,
    allowDoubleSashay: !!config.drDoubleSashay,
    tripleOnTie: !!config.drTripleLipsync,
    ...extra,
  };
}

/** One lip sync between two finalists. No bend: the crown is won on the stage. */
/* ── WHAT A SEASON IS WORTH, ON THE LAST NIGHT ──
   Points per episode: a win is worth two of a high, and the bottom costs.
   Divided by the length of the record so a queen who lasted longer is not
   credited for the lasting itself — she is already in the finale, which is
   the reward for that. This measures how well she was DOING, not how long. */
const RECORD_POINTS = { WIN: 2, HIGH: 1, SAFE: 0, LOW: -0.5, BTM: -1, BTM2: -1.25 };

export function recordStrength(record = []) {
  const rated = record.filter(r => r in RECORD_POINTS);
  if (!rated.length) return 0;
  return rated.reduce((n, r) => n + RECORD_POINTS[r], 0) / rated.length;
}

/**
 * The lip sync, and on the last night the season behind it.
 *
 * A WEEKLY lip sync ignores all of this on purpose: the panel has already
 * spoken, these two are the bottom two, and letting a good résumé save
 * somebody there would be the show overruling its own judgement twice.
 *
 * THE FINALE IS DIFFERENT and used to ignore it too, which produced a winner
 * with zero maxi challenge wins in 20 of 40 measured seasons — a queen could
 * run the whole season and lose the crown to somebody who peaked once, for
 * three minutes. Now the crown reads three things: how she lip synced (the
 * biggest term, because it is a lip sync), how her showcase went tonight, and
 * how she had been doing all season. Weighted, never decisive: the edges are
 * clamped well under the ±2.5 noise already inside `lipsyncScore`, so the
 * underdog who turns it out on the night still takes it.
 */
function duel(state, a, b, ctx, song, finale = null) {
  const sa = lipsyncScore({ player: ctx.players[a], song, lipsyncRecord: state.lipsyncRecord[a], rng: ctx.rng });
  const sb = lipsyncScore({ player: ctx.players[b], song, lipsyncRecord: state.lipsyncRecord[b], rng: ctx.rng });

  const edge = {};
  if (finale) {
    const { showcase = {}, field = [] } = finale;
    const recAvg = field.length
      ? field.reduce((n, x) => n + recordStrength(state.record[x] || []), 0) / field.length : 0;
    const showVals = field.map(x => Number(showcase[x]) || 0);
    const showAvg = showVals.length ? showVals.reduce((n, x) => n + x, 0) / showVals.length : 0;
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    for (const n of [a, b]) {
      /* THE RESUME TERM HAS TO OUT-PULL THE ASSASSIN. `lipsyncScore` pays a
         confidence bonus of up to +1.2 for past lip sync wins, and a queen
         only banks those by being in the bottom — so the two terms point in
         opposite directions and at ±1.4 they simply cancelled. Measured over
         400 seasons per format, the best resume was winning a top two 46% of
         the time against a 50% chance line: still anti-correlated after the
         first attempt. The lip sync assassin is a real and wanted archetype,
         so the answer is to out-weigh her rather than delete her. */
      edge[n] = clamp((recordStrength(state.record[n] || []) - recAvg) * 1.35, 2.3)
        + clamp(((Number(showcase[n]) || 0) - showAvg) * 0.24, 1.3);
    }
    sa.score += edge[a] || 0;
    sb.score += edge[b] || 0;
  }

  const winner = sa.score >= sb.score ? a : b;
  const loser = winner === a ? b : a;
  state.lipsyncRecord[winner].push('W');
  state.lipsyncRecord[loser].push('L');
  return {
    a, b, song: song.title, artist: song.artist,
    scores: { [a]: Math.round(sa.score * 100) / 100, [b]: Math.round(sb.score * 100) / 100 },
    beats: { [a]: sa.beats, [b]: sb.beats },
    // Shown, not hidden: a screen that says why she won has to be able to.
    ...(finale ? { edge: { [a]: Math.round((edge[a] || 0) * 100) / 100,
      [b]: Math.round((edge[b] || 0) * 100) / 100 } } : {}),
    winner, loser,
  };
}


/** What the winner of the Smackdown is actually called. */
const TITLE = 'Queen of She Done Already Done Had Herses';

/**
 * The reunion Smackdown, which is not a maxi challenge.
 *
 * Checked on the wiki, and it is a genuinely separate thing from the
 * LaLaPaRuZa that runs as a challenge during the season: this one happens at
 * the reunion, one week before the finale, and it is EXCLUSIVE TO NON-
 * FINALISTS. Every queen the season already sent home comes back and lip syncs
 * in a bracket, and the winner takes a title rather than a place in the final.
 *
 * So it decides nothing about the crown, which is exactly why it is worth
 * having: it is the one night the eliminated queens are the show, and a queen
 * who went home fourth can leave the season with something.
 */
export function runSmackdown(state, cfg, ctx) {
  const { players } = ctx;
  // ITS OWN STREAM, and this is not tidiness. Drawing from the season's rng
  // would consume draws before the finale and change who gets crowned — a
  // measured fact, not a worry: with a shared stream, turning the Smackdown on
  // changed the winner of seed 1 from Q11 to Q10. An optional side event that
  // decides the season is the worst kind of bug, because it looks like a
  // feature working.
  const rng = rngFor((cfg.seed || 1) * 7919 + 424242);
  const field = [...(state.out || [])].filter(n => players[n]);
  if (field.length < 2) return null;

  const wins = Object.fromEntries(field.map(n => [n, 0]));
  const duels = [];
  let alive = [...field].sort(() => rng() - 0.5);
  let round = 1;
  let guard = 0;

  while (alive.length > 1 && guard++ < 20) {
    const next = [];
    for (let i = 0; i + 1 < alive.length; i += 2) {
      const a = alive[i];
      const b = alive[i + 1];
      const song = SONGS[Math.floor(rng() * SONGS.length)];
      const sa = lipsyncScore({ player: players[a], song, lipsyncRecord: state.lipsyncRecord?.[a] || [], rng });
      const sb = lipsyncScore({ player: players[b], song, lipsyncRecord: state.lipsyncRecord?.[b] || [], rng });
      // No host bend here. Nothing is at stake but the title, and a bent
      // result would be the one place an agenda could not possibly be excused.
      const call = lipsyncCall({
        a: { name: a, score: sa.score }, b: { name: b, score: sb.score },
      });
      wins[call.winner]++;
      duels.push({
        round, a, b, song: song.title, artist: song.artist,
        scores: { [a]: sa.score, [b]: sb.score }, winner: call.winner, loser: call.loser,
      });
      next.push(call.winner);
    }
    if (alive.length % 2) next.push(alive[alive.length - 1]);
    alive = next;
    round++;
  }

  const champion = alive[0] || null;
  if (champion) {
    state.smackdownWinner = champion;
    state.popularity[champion] = (state.popularity[champion] || 0) + 6;
  }

  return {
    num: cfg.num,
    format: 'drag-race',
    eliminated: null,
    exits: [],
    dr: {
      ep: cfg.num,
      challenge: { id: 'smackdown', name: 'The Lip Sync Smackdown', format: 'solo', stage: 'main' },
      mini: null, judges: [], guest: null,
      smackdown: { field, duels, winner: champion, title: TITLE },
      storylines: arcSummary(state.storylines || []),
      storylineNeed: {},
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      scenes: [
        { step: 'main-stage', kind: 'smackdown-open', data: { field }, text: '' },
        ...duels.map(d => ({ step: 'lipsync', kind: 'smackdown-duel', data: { duel: d }, text: '' })),
        { step: 'results', kind: 'smackdown-crown', data: { winner: champion, title: TITLE }, text: '' },
      ],
    },
  };
}


/**
 * The finale.
 *
 * Four shapes, all ending in a lip sync because that is what this show does.
 * The host does not bend a finale: everything he could lean on has already
 * happened, and a crown decided by an agenda rather than by the stage is the
 * one result an audience would never forgive.
 */
export function runFinale(state, cfg, ctx) {
  const { rng } = ctx;
  const type = cfg.type || 'top4';
  const finalists = [...state.living].sort(() => rng() - 0.5);
  const song = () => pick(rng, SONGS);
  const rounds = [];
  let placements = [];
  /* WHO NEVER GOT TO SING. On a bracket every finalist lip syncs and the
     losers lost on the stage, so there is no cut and claiming one would put a
     scene on the screen describing a thing the season did not do. Only
     `perform-then-lipsync` narrows the field before the songs. */
  let cutQueens = [];

  /* THE SHOWCASE, WHICH EVERY FINALE HAS AND ONLY ONE FORMAT SCORES BY.
     On the modern night the individual original numbers ARE the maxi
     challenge and they decide the top two; on the S9 bracket the crown came
     out of lip syncs alone and the numbers were a showcase. So it is
     performed and shown on every format, and `perform-then-lipsync` is the
     only one allowed to cut on it. Faithful, and it also means the screen
     never implies a mechanic the season did not run. */
  const showcaseMaxi = maxiById('talent-show');
  const showcase = Object.fromEntries(finalists.map(n => [n,
    performQueen({ player: ctx.players[n], maxi: showcaseMaxi, record: state.record[n], rng })]));
  state.finalePerformance = Object.fromEntries(
    Object.entries(showcase).map(([n, p]) => [n, p.perf]));
  // The season and the night, handed to every duel of this finale. The
  // Smackdown's duels do not get it: that is a title for the eliminated, and
  // a resume is exactly what those queens do not have.
  const fctx = { showcase: state.finalePerformance, field: [...finalists] };

  if (type === 'top4' && finalists.length >= 4) {
    const s1 = duel(state, finalists[0], finalists[1], ctx, song(), fctx);
    const s2 = duel(state, finalists[2], finalists[3], ctx, song(), fctx);
    const f = duel(state, s1.winner, s2.winner, ctx, song(), fctx);
    rounds.push(s1, s2, f);
    placements = [f.winner, f.loser, s1.loser, s2.loser, ...finalists.slice(4)];
  } else if (type === 'top3' && finalists.length >= 3) {
    const s1 = duel(state, finalists[0], finalists[1], ctx, song(), fctx);
    const f = duel(state, s1.winner, finalists[2], ctx, song(), fctx);
    rounds.push(s1, f);
    placements = [f.winner, f.loser, s1.loser, ...finalists.slice(3)];
  } else if (type === 'perform-then-lipsync' && finalists.length >= 2) {
    // A final performance ranks them, the host picks two, and those two lip
    // sync. This is the one finale where the panel speaks at all.
    // The SAME showcase everybody performed, not a second one: running it
    // twice would score a night the audience only watched once.
    const perf = showcase;
    const panel = panelFor({ rotatingId: cfg.rotatingId || 'carson', weights: cfg.judgeWeights || {} });
    const entries = finalists.map(n => ({
      name: n, style: 'pageant', perf: perf[n].perf, runway: 5, risk: perf[n].risk, polish: 5,
    }));
    const ranking = panelRanking(judgeViews(panel, entries, state.memory, rng));
    const order = hostBend(ranking, { star: state.star, storylineNeed: {}, trackPull: {}, split: false })
      .map(x => x.name);
    const f = duel(state, order[0], order[1], ctx, song(), fctx);
    rounds.push(f);
    placements = [f.winner, f.loser, ...order.slice(2)];
    // THE ONLY FORMAT WITH A CUT. These queens never sang: the host narrowed
    // the field on the showcase and sent them to the back before the music.
    cutQueens = order.slice(2);
  } else {
    // top2, and the fallback for any finale that arrives smaller than its
    // shape expects — two queens, one song, one crown.
    const [a, b] = finalists;
    const f = duel(state, a, b, ctx, song(), fctx);
    rounds.push(f);
    placements = [f.winner, f.loser, ...finalists.slice(2)];
  }

  state.winner = placements[0];
  state.runnerUp = placements[1];
  for (const n of state.living) state.record[n].push(n === placements[0] ? 'WINNER' : 'FINALIST');

  const row = {
    num: cfg.num,
    format: 'drag-race',
    eliminated: null,
    exits: [],
    twists: [],
    houseAtStart: [...state.living],
    airedEvents: [],
    dr: {
      ep: cfg.num,
      challenge: { id: 'finale', name: 'The Finale', format: 'solo', stage: 'main' },
      mini: null,
      judges: [],
      guest: null,
      finale: { type, rounds, winner: placements[0], runnerUp: placements[1], placements },
      // The finale carries the arcs too, and it is the one episode where they
      // matter most: this is where the season finds out whether the
      // frontrunner was really the frontrunner. The host does not BEND a
      // finale, so there is no `storylineNeed` here — nothing was asked for.
      storylines: arcSummary(state.storylines || []),
      storylineNeed: {},
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      /* THE WHOLE NIGHT, NOT THREE MARKERS. This used to be exactly three
         scenes carrying `text: ''` — the stage opening, the duels, and the
         placements — which the viewing party then drew under a heading
         called "Sashay Away: the mirror message". `finale-open` and
         `crowning` are still emitted first and last so every existing reader
         (screens.js, the badge list, the transcript) keeps working; the night
         itself is now between them. */
      scenes: [
        { step: 'main-stage', kind: 'finale-open', data: { finalists, type }, text: '' },
        ...renderFinaleBeats({
          finalists,
          // Everybody this season sent home, walking back in.
          returning: [...(state.out || [])],
          showcase: state.finalePerformance || {},
          // WHO STOPPED SHORT OF THE LAST SONG. Read off the placements
          // rather than tracked separately: the last duel's two queens are
          // the top two, and everybody below them was cut before it.
          cut: cutQueens,
          rounds,
          winner: placements[0] || null,
          runnerUp: placements[1] || null,
          placements,
          // Filled in by playDragSeason once the vote runs — the finale
          // cannot know it, because the vote reads a ledger this row closes.
          congeniality: null,
          rng,
        }),
        { step: 'exit', kind: 'crowning', data: { placements }, text: '' },
      ],
    },
  };
  state.episodes.push(row);
  return row;
}

/**
 * Play a season.
 *
 * `config` is the setup screen's: drPremiere, drFinale, drImmunity,
 * drDoubleShantay, drDoubleSashay, drSchedule, drJudgeWeights.
 */
export function playDragSeason({ cast, seed = 1, config = {}, bond = () => 0, addBond = null, popDelta = null }) {
  const rng = rngFor(seed);
  const state = initDragState({ cast, seed, rng });
  const players = Object.fromEntries(cast.map(p => [p.name, p]));

  // The ledger, written into state so a headless season and a played one carry
  // the same numbers. A caller may pass its own to write gs.popularity too.
  const writePop = (n, d) => {
    state.popularity[n] = (state.popularity[n] || 0) + d;
    if (popDelta) popDelta(n, d);
  };
  // Bonds move during a maxi: somebody helps, somebody sabotages, a captain
  // dumps a rival. A headless season with no relationship layer passes nothing
  // and those writes go nowhere, which is correct rather than a gap.
  const ctx = { rng, players, bond, addBond: addBond || (() => {}), popDelta: writePop };

  // Cast the season's arcs from the room as it stands before anybody performs.
  state.storylines = assignStorylines({ cast, state, bond, rng });

  const finaleType = config.drFinale || 'top4';
  const premiere = config.drPremiere || 'standard';
  const rows = [];
  let num = 1;

  // A SPLIT PREMIERE runs the cast in two halves with nobody going home, so
  // the season proper starts at episode three with everybody still in.
  if (premiere === 'split' && cast.length >= 10) {
    const order = [...state.castOrder].sort(() => rng() - 0.5);
    const half = Math.ceil(order.length / 2);
    const wholeCast = [...state.living];
    for (const group of [order.slice(0, half), order.slice(half)]) {
      const sch = buildSchedule({
        episodes: 1, castSize: group.length, pinned: [], rng, premiere: 'talent-show',
      })[0];
      // The week only ever sees this half of the room. Nobody goes home, so
      // the full cast is restored afterwards rather than reconciled — the
      // half-week cannot have removed anybody.
      state.living = group;
      rows.push(beat(state, runDragWeek(state, weekCfg(sch, config, num++, { noElimination: true }), ctx), cast));
      state.living = wholeCast;
    }
  }

  const weeks = episodesFor(cast.length, finaleType);
  // Episode one to the crowning, so an arc can ask "how far through are we".
  const totalEpisodes = weeks + 1;
  const schedule = buildSchedule({
    episodes: weeks,
    castSize: cast.length,
    pinned: (config.drSchedule || []).filter(Boolean),
    rng,
    premiere: premiere === 'split' ? 'standard' : premiere,
  });

  const finaleSize = FINALE_SIZE[finaleType] || 4;
  for (const sch of schedule) {
    if (state.living.length <= finaleSize) break;
    rows.push(beat(state, runDragWeek(state, weekCfg(sch, config, num++, { totalEpisodes }), ctx), cast));
  }

  // The Smackdown, if the season books one: the queens already sent home come
  // back and lip sync for a title, one episode before the crowning.
  if (config.drSmackdown && state.out.length >= 2) {
    const smack = runSmackdown(state, { num: num++, seed }, ctx);
    if (smack) rows.push(beat(state, smack, cast));
  }

  const last = schedule[schedule.length - 1] || {};
  const finale = runFinale(state, {
    num: num++, type: finaleType, rotatingId: last.rotatingId, judgeWeights: config.drJudgeWeights,
  }, ctx);
  rows.push(beat(state, finale, cast));

  /* ── MISS CONGENIALITY ──
     THE SHARED AUDIENCE VOTE, not a second way of printing the chart. This
     show does not get to write its own: `runAudienceVote` is the one place
     the franchise decides what "the country's favourite" means, and it is
     already weighted in SPREADS rather than points so a show whose numbers
     look nothing like Big Brother's resolves properly anyway.
     Eligible is everybody but the winner — you cannot win the crown and the
     sash on the same night — and the ledger it reads is `state.popularity`,
     which every event in the season has been writing to since episode one.
     Passed explicitly: the module-global `gs` is empty in a headless season,
     and voting on an empty board still returns a name. */
  const eligible = state.castOrder.filter(n => n !== state.winner);
  const vote = runAudienceVote({
    eligible, rng, blocks: 600,
    _gs: { popularity: state.popularity, episodeHistory: rows },
  });
  if (vote) {
    state.congeniality = vote.winner;
    state.congenialityTally = vote.tally;
    // The finale row carries it because the crowning screen draws the sash,
    // and a screen that has to reach back into season state to know what it
    // is drawing is a screen that shows nothing on a replayed episode.
    finale.dr.congeniality = vote.winner;
    finale.dr.congenialityTally = vote.tally;
    // AND THE SCENE, not only the field. The award is announced on the night
    // between the last lip sync and the runner-up, so it has to be a scene in
    // the finale's own list — a value on the row with nothing reading it is
    // exactly the shape of every other bug this build has found.
    insertCongenialityScene(finale, vote.winner, rng);
  }

  return {
    rows, state, winner: state.winner, runnerUp: state.runnerUp,
    congeniality: state.congeniality || null,
    finale: finale.dr.finale, smackdownWinner: state.smackdownWinner || null,
  };
}
