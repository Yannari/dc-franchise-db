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
import { PARTNER_COHORTS } from './chal/makeover.js';
import { RETURNEE_BEATS } from './data/returnee-beats.js';
import { runReunion } from './reunion.js';
import { smackdownScenes } from './smackdown.js';
import { runDragWeek } from './week.js';
import { assignStorylines, recordBeat, arcSummary } from './storylines.js';
import { MAXI_TYPES, TENTPOLES, maxiById } from './data/challenges.js';
import { MINI_TYPES } from './data/minis.js';
import { JUDGES } from './data/judges.js';
import { SONGS } from './data/songs.js';
import { RUNWAY_CATEGORIES } from './data/runways.js';
import { rngFor } from './rng.js';
import { assignDragFamilies } from './family.js';
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

  /* ── WHERE THE TENTPOLES LAND ──
     Anything already pinned is not booked twice.

     AND WHEN THEY DO NOT ALL FIT, THE ONE THAT MISSES OUT IS DRAWN. There
     are six tentpoles and only episodes 2..N-2 can hold one, so a season
     shorter than fourteen queens has fewer slots than tentpoles and somebody
     has to be left out. This walked TENTPOLES in array order and broke when
     the slots ran out, so the ARRAY'S OWN ORDER decided who was cut — the
     same challenge, every season, for every seed. Measured over 20 seasons
     per cast size:

       cast 12 (8 eps, 5 slots): the Rusical missed 20 times out of 20
       cast 10 (6 eps, 3 slots): Makeover, Roast and Rusical, 20 out of 20
       cast  8 (4 eps, 1 slot):  only the Snatch Game EVER happened

     So the Rusical was unreachable on a twelve-queen season and four of the
     six were unreachable on an eight — not rare, absent.

     THE FOUR BURNED DRAWS ARE LOAD-BEARING. See js/dr/rng.js: the LCG's
     first draw is a linear function of the seed, so a fresh stream opens on
     almost the same number every time and Math.floor(rng() * 6) is 1 for
     every seed from 1 to 20. The schedule is the first thing a season
     decides, so it reads that unmixed head — and the shuffle put the same
     tentpole last in all forty seasons, which is the bug it was added to
     fix. Four draws in, the stream is mixed. */
  const tentpolesLeft = TENTPOLES.filter(t => !used.has(t));
  rng(); rng(); rng(); rng();
  for (let i = tentpolesLeft.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tentpolesLeft[i], tentpolesLeft[j]] = [tentpolesLeft[j], tentpolesLeft[i]];
  }
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
      /* THE MAKEOVER'S PARTNERS. Seven cohorts are authored — superfans,
         veterans, seniors, athletes, the pit crew, loved ones, and the
         queens already sent home — and NOTHING EVER SET THIS. The module
         reads `cfg.makeoverPool`, no writer existed, so every makeover in
         every season was superfans, six cohorts were dead data, and the
         `reunion` event, which needs a partner who is herself a queen, could
         not fire: measured at nought across twenty-five seasons.
         The eliminated cohort waits until enough queens are out to make a
         pool of it, which is also when the show would use it. */
      makeoverPool: pin.makeoverPool
        || (maxiId === 'makeover'
          ? pick(rng, e >= 5 ? PARTNER_COHORTS
            : PARTNER_COHORTS.filter(c => c !== 'eliminated'))
          : null),
      /* AND THE WEEK'S OWN SHAPE. Every field above is a piece of CONTENT the
         author can pin; this is the one that changes what the week DOES, and
         it has to survive the build or the schedule entry reaches the season
         loop without it and the twist silently does not happen. */
      ...(pin.rateAQueen ? { rateAQueen: true } : {}),
      ...(pin.critiqueTwist ? { critiqueTwist: pin.critiqueTwist } : {}),
      ...(pin.noElimination ? { noElimination: true } : {}),
      ...(pin.doubleElimination ? { doubleElimination: true } : {}),
      ...(pin.bottomThree ? { bottomThree: true } : {}),
      /* A RETURNING QUEEN, and the name she was booked with. The name is
         carried even when it is empty: an absent `returneeName` means the
         show picks, which is a real choice and not a missing one. */
      ...(pin.returnee ? { returnee: true, returneeName: pin.returneeName || null } : {}),
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
/**
 * The scenes for a queen walking back into the competition.
 *
 * Emitted here rather than inside runDragWeek because a return changes only
 * WHO IS IN THE ROOM — the week engine runs identically either way, and
 * teaching it about a twist it does not need to know about is how a week
 * engine ends up with a branch per twist.
 *
 * An unwritten tier emits nothing rather than an empty card, so the schema
 * ships ahead of the prose and the twist still works: she is in the room and
 * on the chart from the moment it is booked, with or without the words.
 */
function returnScenes(returned, { living, rng = Math.random }) {
  const beatById = id => RETURNEE_BEATS.find(b => b.id === id);
  const fill = (line, a, b) => String(line || '')
    .replace(/\{a\}/g, a || '').replace(/\{b\}/g, b || '');
  const scenes = [];
  const name = returned.name;
  // Whoever reaches her first: somebody already in the room, never herself.
  const others = (living || []).filter(n => n !== name);
  const greeter = others.length ? others[Math.floor(rng() * others.length)] : null;

  const push = (id, tierId, players, extra = {}) => {
    const b = beatById(id);
    const t = b?.tiers?.find(x => x.id === tierId) || b?.tiers?.[0];
    if (!t?.lines?.length) return;
    const line = t.lines[Math.floor(rng() * t.lines.length)];
    scenes.push({
      step: 'return',
      kind: `return:${b.id}`,
      data: { beat: b.id, tier: t.id, players, note: t.note, ...extra },
      text: fill(line, players[0], players[1]),
    });
  };

  /* WHICH KIND OF RETURN IT IS, read off how long she has been gone. The
     early boot nobody has seen since the premiere is walking back in against
     a different room from the queen who left last week. */
  const gap = Number(returned.gap) || 0;
  const howLong = gap >= 4 ? 'early' : gap >= 2 ? 'mid' : 'late';

  push('return-door', 'door', []);
  push('return-walk', howLong, [name]);
  push('return-room', 'room', [name, greeter].filter(Boolean));
  push('return-rule', 'rule', [name], { honoured: returned.honoured });
  return scenes;
}

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
    makeoverPool: sch.makeoverPool || null,
    judgeWeights: config.drJudgeWeights || {},
    immunity: !!config.drImmunity,
    // The arcs need to know how far through the season they are: what the
    // frontrunner wants in week two is not what she wants in week eight.
    totalEpisodes: extra.totalEpisodes || 12,
    // Defaults ON: an unset value means the format's ordinary rule applies.
    allowDoubleShantay: config.drDoubleShantay !== false,
    allowDoubleSashay: !!config.drDoubleSashay,
    tripleOnTie: !!config.drTripleLipsync,
    // The floor a paid-back double shantay must never breach: a week may not
    // empty the room below the size the finale needs.
    finaleSize: FINALE_SIZE[config.drFinale || 'top4'] || 4,
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
      /* THE NIGHT, NARRATED. Every one of these carried `text: ''` and there
         was no screen to draw them on either, so an episode with a full
         eight-queen bracket in its data arrived with nothing on it at all.
         Its own step (`smackdown`), because a smackdown is not a main stage:
         no runway, no panel, no critique, nobody going home. */
      /* `expectedOf` IS HOW FAR SHE GOT. `state.out` is pushed in elimination
         order, so a later index means she lasted longer and is the favourite
         going into a duel. Without it the builder fell back to the bracket's
         own seeding order, which is arbitrary — and three of seven duels came
         back reading as upsets, which makes an upset mean nothing. */
      scenes: smackdownScenes({
        field, duels, champion, title: TITLE, rng,
        expectedOf: n => (state.out || []).indexOf(n),
      }),
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

  /* ── TWO WINNERS ──
     All Stars 4 crowned Trinity the Tuck and Monet X Change together: the
     only double crown in the show's history, announced by voiceover, and the
     two were never shown on stage together because the decision was made
     late. So it is a rare exception rather than a format, and it is modelled
     as one — off unless the season asks for it, and then only on a genuine
     dead heat in the last song.

     It reads the RAW duel scores for the same reason the double shantay does:
     whether two finales were level is a fact about the stage, not something
     the host's agenda gets to manufacture. Same CLOSE window the weekly
     double shantay uses, and both have to be excellent.

     `winner` and `placements[0]` KEEP THEIR MEANING. Every reader in the repo
     — the chart, the article, the franchise ledger, the aftermath, the
     rankings — reads one or the other, and a shape change there is a change
     to all of them. The second crown is additive: `winners` is the list, and
     it has one name in it on every ordinary season. */
  const lastRound = rounds[rounds.length - 1] || null;
  const crownGap = lastRound && lastRound.scores
    ? Math.abs((lastRound.scores[lastRound.a] || 0) - (lastRound.scores[lastRound.b] || 0))
    : Infinity;
  const bothGreat = lastRound && lastRound.scores
    && Math.min(lastRound.scores[lastRound.a] || 0, lastRound.scores[lastRound.b] || 0) >= 8.5;
  const doubleCrown = !!cfg.doubleCrown && !!lastRound && bothGreat && crownGap < 0.6
    && placements.length >= 2;

  const winners = doubleCrown ? [placements[0], placements[1]] : [placements[0]];
  state.winner = placements[0];
  state.winners = winners;
  state.doubleCrown = doubleCrown;
  // On a double crown nobody is the runner-up, because nobody came second.
  state.runnerUp = doubleCrown ? null : placements[1];
  for (const n of state.living) {
    state.record[n].push(winners.includes(n) ? 'WINNER' : 'FINALIST');
  }

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
      finale: { type, rounds, winner: placements[0], winners, doubleCrown,
        runnerUp: doubleCrown ? null : placements[1], placements },
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
          winners,
          doubleCrown,
          runnerUp: doubleCrown ? null : (placements[1] || null),
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

  /* ── WHO WAS ALREADY RELATED ──
     Cast before the arcs, because a family is a fact about the room that the
     arcs should be able to see rather than a thread laid over the top of one.
     The bonds are applied through the caller's own `addBond`, so a headless
     season with no relationship layer gets the families and none of the
     points, which is correct — there is nowhere to put them. */
  const fam = assignDragFamilies({ cast, rng });
  state.dragFamilies = fam.families;
  if (addBond) for (const [a, b, d] of fam.bonds) addBond(a, b, d);

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
      // `formatNote: 'split'` and not the generic no-elimination note: the
      // room is half a cast AND nobody goes home, and the half-cast is the
      // part a viewer cannot work out on their own.
      rows.push(beat(state, runDragWeek(state, weekCfg(sch, config, num++, {
        noElimination: true, formatNote: 'split',
      }), ctx), cast));
      state.living = wholeCast;
    }
  }

  /* A NIGHT THAT SENDS NOBODY HOME MAKES THE SEASON LONGER.
     It used to make the season SHORTER by one elimination and then claw that
     back with a double the following week, which raised a fair question —
     who decides when that double lands? — and had an unsatisfying answer:
     nobody, it was always the very next week, measured at a gap of 1 in all
     ten repayments across 300 seasons.
     A season that keeps fourteen queens goes back to fourteen next week and
     runs one episode longer. That is what the show does, it needs no
     scheduling rule, and it makes a non-elimination week a gift rather than
     a loan. `episodesFor` gives the number of eliminations a cast needs, and
     the loop below runs until the room is finale-sized however many weeks
     that takes. */
  const eliminationsNeeded = episodesFor(cast.length, finaleType);
  /* ONE BOTTOM-THREE NIGHT A SEASON, booked rather than rolled per week.
     The show names three and saves one of them on the stage often enough that
     BTM is a real call, and it is the only way that call can happen at all —
     an ordinary week names the two who lip sync. Booked in the middle third,
     where the field is still big enough for a third name to mean something
     and small enough that the room feels it. */
  const pins = (config.drSchedule || []).filter(Boolean);
  const scheduledFree = pins.filter(x => x.noElimination).length;
  // A double elimination takes two queens in one night, so it SHORTENS the run
  // by a week exactly as a free week lengthens it.
  const scheduledDoubles = pins.filter(x => x.doubleElimination && !x.noElimination).length;
  /* A RETURNING QUEEN IS ANOTHER BODY TO GET RID OF, so she lengthens the
     season exactly the way a free week does and for a more obvious reason:
     the room she walks into is one bigger than the maths was built for. */
  const scheduledReturns = pins.filter(x => x.returnee).length;
  const weeks = Math.max(1,
    eliminationsNeeded + scheduledFree + scheduledReturns - scheduledDoubles);
  // Episode one to the crowning, so an arc can ask "how far through are we".
  const totalEpisodes = weeks + 1;
  const schedule = buildSchedule({
    episodes: weeks,
    castSize: cast.length,
    pinned: (config.drSchedule || []).filter(Boolean),
    rng,
    premiere: premiere === 'split' ? 'standard' : premiere,
  });

  /* AND THE BOTTOM-THREE NIGHT, booked onto whichever middle episode the
     author has not already claimed. Rolled once, from the season's own rng,
     so a replay of the same seed books the same week. */
  if (!schedule.some(e => e.bottomThree)) {
    const lo = Math.max(1, Math.floor(schedule.length / 3));
    const hi = Math.max(lo, Math.floor((schedule.length * 2) / 3));
    /* ITS OWN STREAM, so booking this does not move the season's. Drawing
       from `rng` here consumed a number every later decision was expecting to
       get, which silently reshuffled the schedule — it showed up as a
       scheduled double elimination no longer shortening the run, with nothing
       about double eliminations touched. Derived from the seed so a replay
       still books the same week. */
    const pickRng = rngFor(seed * 7919 + 13);
    const want = lo + Math.floor(pickRng() * Math.max(1, hi - lo + 1));
    const slot = schedule.find(e => e.episode === want && !e.noElimination)
      || schedule.slice(lo).find(e => !e.noElimination);
    if (slot) slot.bottomThree = true;
  }

  const finaleSize = FINALE_SIZE[finaleType] || 4;
  /* THE SCHEDULE CAN RUN OUT AND THE SEASON CANNOT. A double shantay is
     decided on the night, so no amount of counting up front predicts it —
     when the booked weeks are used and the room is still too big, the season
     books another. Capped so a bug cannot spin here forever. */
  const spare = () => buildSchedule({
    episodes: 1, castSize: cast.length, pinned: [], rng, premiere: 'standard',
  })[0];
  let guard = 0;
  for (const sch of [...schedule, ...Array.from({ length: 8 }, () => null)]) {
    if (state.living.length <= finaleSize) break;
    if (!sch && ++guard > 8) break;
    const week = sch || spare();
    // A porkchop premiere is a runway with no challenge that still sends
    // somebody home, and the host says so before it starts.
    const porkchopNight = premiere === 'porkchop' && num === 1;
    /* THE LAST-WEEK RESTRICTION IS GONE WITH THE DEBT. It existed because a
       double shantay on the final elimination week could not be repaid, and
       the season walked into a top four with five queens in it. Nothing is
       repaid now: the season simply runs another week, so the host may keep
       both whenever the stage earns it. */
    const lastElimWeek = false;
    /* A SCHEDULED NON-ELIMINATION WEEK. Pinned on `drSchedule` as
       `{ episode, noElimination: true }`. Distinct from a double shantay,
       which is the HOST deciding in the moment that both were too good to
       lose: this is production announcing beforehand that the door stays
       shut, and the host says so on the main stage before the challenge.
       It costs the season an elimination, so it takes on the same debt a
       double shantay does and is repaid by the same later double — otherwise
       the cast maths lands a top four with five queens in it.
       REFUSED ON THE LAST ELIMINATION WEEK for the same reason a double
       shantay is: there would be no week left to repay it in. */
    const scheduledNoElim = !!week.noElimination && !lastElimWeek;

    /* ── A QUEEN COMES BACK ──
       Resolved BEFORE the week runs, because she has to be in the room for
       the whole of it — she takes the mini, the maxi, the runway and the
       call like anybody else, and a return that only appeared in the
       narration would be a queen the chart does not have.
       The author's pick wins when it is available. It can fail to be: a
       season is booked before it is played, so the queen chosen on episode
       six may still be competing when episode six arrives. Falling back to
       a random eliminated queen is better than doing nothing, and the row
       records which of the two happened so the screen can say so. */
    let returned = null;
    if (week.returnee && state.out.length) {
      const wanted = week.returneeName || null;
      const gone = [...state.out];
      const exact = wanted && gone.includes(wanted) ? wanted : null;
      /* WEIGHTED TOWARD WHAT SHE LEFT BEHIND. An early boot with a win on
         her record has more to prove than a queen who went out in the
         bottom every week, and the show would bring the first one back.
         Read off the record the season already wrote. */
      const weightOf = n => {
        const rec = state.record?.[n] || [];
        const wins = rec.filter(r => r === 'WIN').length;
        const highs = rec.filter(r => r === 'HIGH').length;
        const early = Math.max(0, 6 - rec.length);
        return 1 + wins * 3 + highs * 1.5 + early * 0.6;
      };
      const pickWeighted = () => {
        const total = gone.reduce((t, n) => t + weightOf(n), 0);
        let roll = rng() * total;
        return gone.find(n => (roll -= weightOf(n)) <= 0) || gone[gone.length - 1];
      };
      const who = exact || pickWeighted();
      if (who) {
        state.out = state.out.filter(n => n !== who);
        state.living = [...state.living, who];
        const wentOut = (state.record?.[who] || []).length;
        returned = {
          name: who, asked: wanted || null, honoured: !!exact,
          // How long she has been gone, in episodes — the walk-back reads it.
          gap: Math.max(0, num - 1 - wentOut),
        };
        state.returns = [...(state.returns || []), { ...returned, episode: num }];
      }
    }

    const weekRow = beat(state, runDragWeek(state, weekCfg(week, config, num++, {
      totalEpisodes,
      // She competes on her return night and cannot go home on it.
      ...(returned ? { returnedQueen: returned.name } : {}),
      ...(porkchopNight ? { formatNote: 'porkchop' } : {}),
      ...(week.rateAQueen ? { rateAQueen: true } : {}),
      /* THE CRITIQUE TWISTS WERE UNREACHABLE. js/dr/critiques.js exports
         whoShouldGoHome and rateAQueen, week.js dispatches on
         cfg.critiqueTwist, and NOTHING EVER SET IT — the season never passed
         the field, so both were dead code reachable only from a test. */
      ...(week.critiqueTwist ? { critiqueTwist: week.critiqueTwist } : {}),
      ...(scheduledNoElim ? { noElimination: true } : {}),
      // The night the panel names three and saves one of them on the stage.
      // Pointless on a week that sends nobody home, so it is refused there.
      ...(week.bottomThree && !scheduledNoElim ? { bottomThree: true } : {}),
      // A DOUBLE ELIMINATION IS THE AUTHOR'S, pinned on the schedule the same
      // way a free week is. Refused on a week that already sends nobody home,
      // because those two instructions cancel each other out.
      ...(week.doubleElimination && !scheduledNoElim
        ? { doubleElimination: true, formatNote: 'double-elimination' } : {}),
      finaleSize,
    }), ctx), cast);
    /* THE RETURN GOES ON THE FRONT OF THE NIGHT. Written after the week is
       built rather than inside runDragWeek, so the week engine does not have
       to learn about a twist that only changes who is in the room — and the
       scenes land before the cold open, which is where a queen walking back
       through the door actually happens. */
    if (returned) {
      weekRow.dr.returned = returned;
      weekRow.dr.scenes = [
        ...returnScenes(returned, { living: state.living, rng }),
        ...(weekRow.dr.scenes || []),
      ];
    }
    rows.push(weekRow);
    // No debt is taken on: the loop simply keeps going until the room is
    // finale-sized, so a free week is an extra week.
  }

  // The Smackdown, if the season books one: the queens already sent home come
  // back and lip sync for a title, one episode before the crowning.
  if (config.drSmackdown && state.out.length >= 2) {
    const smack = runSmackdown(state, { num: num++, seed }, ctx);
    if (smack) rows.push(beat(state, smack, cast));
  }

  /* THE REUNION, between the last elimination and the crowning — which is
     where the real show's own track record chart puts it, as a column of its
     own ahead of "Finale". It eliminates nobody and it is the only episode
     that reads the WHOLE season rather than the row in front of it.
     OPT-IN, because it changes a season's episode count and every caller that
     has ever counted them. */
  /* ── MISS CONGENIALITY ──
     THE SHARED AUDIENCE VOTE, not a second way of printing the chart. This
     show does not get to write its own: `runAudienceVote` is the one place
     the franchise decides what "the country's favourite" means, and it is
     already weighted in SPREADS rather than points so a show whose numbers
     look nothing like Big Brother's resolves without a per-show constant.
     RUN BEFORE THE REUNION, because that is where season nine announced it —
     with the vote tallied in public — and a reunion topic that could never
     fire is the written-but-unreachable bug in a bigger chair. The finale
     announces it too, which is the modern format; both read one value.
     Eligible is everybody but the winner, who is not known yet — so the
     board is the whole cast and the winner is removed after. */
  const vote = runAudienceVote({
    eligible: [...state.castOrder], rng, blocks: 600,
    _gs: { popularity: state.popularity, episodeHistory: rows },
  });
  if (vote) {
    state.congeniality = vote.winner;
    state.congenialityTally = vote.tally;
  }

  if (config.drReunion) {
    rows.push(beat(state, runReunion(state, { num: num++ }, ctx), cast));
  }

  const last = schedule[schedule.length - 1] || {};
  const finale = runFinale(state, {
    num: num++, type: finaleType, rotatingId: last.rotatingId, judgeWeights: config.drJudgeWeights,
    doubleCrown: !!config.drDoubleCrown,
  }, ctx);
  /* THE WINNER CANNOT TAKE THE SASH TOO. The vote ran before the crowning,
     so it could not exclude a winner nobody knew yet — if the country's
     favourite turns out to be the queen who wins, the sash goes to the runner
     up on the tally instead. */
  if (state.congeniality && state.congeniality === state.winner) {
    const next = (state.congenialityTally || []).find(t => t.name !== state.winner);
    state.congeniality = next ? next.name : null;
  }
  /* THE SEASON'S PAIRS, ON THE ROW. `js/life-hook.js` reads `showmance` off an
     APPEARANCE to decide who walked out of a season together, and a drag
     appearance carried none — so the romance thread existed in the werk room,
     on the screen and in the ratings signal, and stopped dead at the franchise
     boundary. Kept on the finale row rather than threaded through the exporter
     as another argument, the way `congeniality` had to be. */
  finale.dr.romances = (state.romances || []).map(pair => [...pair]);
  if (state.congeniality) {
    finale.dr.congeniality = state.congeniality;
    finale.dr.congenialityTally = state.congenialityTally;
    insertCongenialityScene(finale, state.congeniality, rng);
  }
  rows.push(beat(state, finale, cast));

  return {
    rows, state, winner: state.winner, runnerUp: state.runnerUp,
    congeniality: state.congeniality || null,
    finale: finale.dr.finale, smackdownWinner: state.smackdownWinner || null,
    winners: state.winners || [state.winner], doubleCrown: !!state.doubleCrown,
  };
}
