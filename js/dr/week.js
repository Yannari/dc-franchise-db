// ══════════════════════════════════════════════════════════════════════
// dr/week.js — one episode, in the order it airs
// ══════════════════════════════════════════════════════════════════════
//
// The spine. It runs the sixteen steps, assembles the three decision steps
// into a verdict, and writes the one row the rest of the site reads.
//
// TWO THINGS ABOUT THAT ROW MATTER MORE THAN THE REST.
//
// `eliminated` is null on every episode, always. Every existing reader of that
// field across this codebase means "who the room voted out", and this show
// holds no vote of any kind — the panel ranks and the host decides. Departures
// ride on `exits[]` with the registry's verb, and readers go through
// roundExits(). Filling `eliminated` to be helpful would put a drag queen in
// the voting grid.
//
// And the row is the ONLY record. Every screen reads it and nothing recomputes
// from live state, so re-airing episode four shows episode four rather than
// the season as it stands now.
//
// Plan 2 replaces the assignment and preparation seams here with per-challenge
// modules; Plan 3 replaces the scene TEXT with real prose pools. Until then the
// scenes carry their data and an empty string, which is deliberate: a
// placeholder sentence written here would be a sentence nobody ever came back
// to replace.
import { dragOf } from './queen.js';
import { maxiById } from './data/challenges.js';
import { miniById } from './data/minis.js';
import { SONGS, songById } from './data/songs.js';
import { runwayById } from './data/runways.js';
import { panelFor } from './judges.js';
import { runwayScore, blendScore, noise } from './perform.js';
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from './judging.js';
import { storylineNeed as storylineNeedFor, arcSummary } from './storylines.js';
import { runWerkRoom, applyWerkScene } from './werk.js';
import { renderStageBeats, runUntucked, applyUntuckedScene, renderChallengeBeats } from './stage.js';
import { lipsyncScore, lipsyncCall } from './lipsync.js';
import { runMaxi, applyEvents } from './maxi.js';
import { showWords } from '../shows.js';

/** The running order. A scene's `step` is always one of these. */
export const SCENE_STEPS = [
  'cold-open', 'werk-morning', 'mini', 'maxi-announce', 'choice', 'prep',
  'maxi-pre', 'werk-elim-day', 'main-stage', 'runway', 'maxi-main',
  'critiques', 'untucked', 'results', 'lipsync', 'exit',
];

const slugOf = n => String(n || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/**
 * How she takes it.
 *
 * `expected` is her own read of where she stood, `received` is where she
 * actually landed — both ranks, so a positive gap means it went worse than she
 * thought. Low temperament amplifies the gap; boldness decides whether a bad
 * surprise comes out at the panel or collapses inward.
 */
export function reactionFor({ expected, received, temperament = 5, boldness = 5, rng = Math.random }) {
  const gap = received - expected;
  const t = (Number.isFinite(Number(temperament)) ? Number(temperament) : 5) / 10;
  const b = (Number.isFinite(Number(boldness)) ? Number(boldness) : 5) / 10;

  const heat = gap * (1 - t) + noise(rng, 1.5);
  if (heat > 4) return b > 0.5 ? 'blow-up' : 'crash-out';
  if (heat > 2) return rng() < 0.5 ? 'tears' : 'sadness';
  if (heat < -3) return 'joy';
  if (heat < -1) return 'relief';
  return rng() < 0.4 ? 'idgaf' : (gap > 0 ? 'sadness' : 'relief');
}

export function runDragWeek(state, cfg, ctx) {
  const { rng, players, bond = () => 0, popDelta = () => {} } = ctx;
  const maxi = maxiById(cfg.maxiId);
  if (!maxi) throw new Error(`drag-race: unknown maxi challenge "${cfg.maxiId}"`);

  const words = showWords('drag-race');
  const living = [...state.living];
  const P = n => players[n];
  const scenes = [];
  const say = (step, kind, data = {}) => scenes.push({ step, kind, data, text: '' });

  // 1–2. The room after the last exit, and the morning after that.
  const last = state.episodes[state.episodes.length - 1] || null;
  const gone = last ? last.exits.map(x => x.name) : [];
  say('cold-open', 'cold-open', { gone });
  say('werk-morning', 'werk-morning', { living: [...living] });

  // ── THE ROOM ──────────────────────────────────────────────────────
  //
  // Drawn once for the whole week rather than per slot, so a scene cannot
  // repeat itself across the morning and the afternoon, and filed into the
  // slots it belongs to. The maxi challenge writes its own prep scenes; these
  // are the ones that are about the room rather than about the work.
  const werkScenes = runWerkRoom({
    slots: ['cold-open', 'werk-morning', 'prep', 'werk-elim-day'],
    living, players: ctx.players, state, storylines: state.storylines || [],
    rng,
    ctx: {
      bond: ctx.bond,
      phase: state._drPhase ?? 0,
      episode: cfg.num,
      someoneLeft: gone.length > 0,
      gone,
    },
  });
  const werkEvents = [];
  for (const sc of werkScenes) {
    applyWerkScene(sc, ctx);
    scenes.push({
      step: sc.slot, kind: `werk:${sc.id}`,
      data: { players: sc.players, note: sc.note, eligible: sc.eligible },
      text: sc.text || '',
    });
    werkEvents.push({
      type: `werk:${sc.id}`, players: sc.players,
      bond: sc.effects.bond && sc.players[1]
        ? [[sc.players[0], sc.players[1], sc.effects.bond]] : [],
      pop: Object.fromEntries(Object.entries(sc.effects.pop || {})
        .map(([k, v]) => [k === 'a' ? sc.players[0] : sc.players[1], v])
        .filter(([n]) => n)),
      state: sc.effects.state ? { [sc.effects.state]: sc.players[0] } : {},
      data: {},
    });
  }

  // 3. The mini, and what winning it buys.
  let mini = null;
  let miniWinner = null;
  let miniScores = {};
  if (cfg.miniId) {
    const m = miniById(cfg.miniId);
    if (m) {
      const scored = living
        .map(n => ({ n, s: blendScore(dragOf(P(n)), m.blend) + noise(rng, 3) }))
        .sort((a, b) => b.s - a.s);
      // Kept, not discarded: every queen's attempt is a beat, and the beat is
      // tiered on how she actually did. Only the winner used to survive this.
      miniScores = Object.fromEntries(scored.map(x => [x.n, Math.round(x.s * 100) / 100]));
      miniWinner = scored[0].n;
      mini = { id: m.id, name: m.name, winner: miniWinner, buys: m.buys };
      say('mini', 'mini', { mini });
    }
  }

  // 4–7 / 11. The announcement, the draft, the werk room and the challenge —
  // all of it the challenge module's, through the spine. The scenes it returns
  // carry their own steps, so a type that performs on the main stage lands in
  // `maxi-main` and one that films beforehand lands in `maxi-pre`, without
  // this file knowing which is which.
  say('maxi-announce', 'maxi-announce', { challenge: maxi.name, desc: maxi.desc });

  const maxiCtx = {
    living, players, maxi, rng, state, cfg, miniWinner, mini,
    bond,
    addBond: ctx.addBond || (() => {}),
    popDelta,
  };
  const M = runMaxi(maxiCtx);
  applyEvents(M.events, maxiCtx);
  const assignment = M.assignment;
  const prep = M.prep;
  const performances = M.performances;
  const maxiEvents = M.events;
  for (const sc of M.scenes) scenes.push({ ...sc, text: '' });

  // 8–10. Elimination day, the panel, the runway.
  say('werk-elim-day', 'werk-elim-day', { living: [...living] });
  const panel = panelFor({ rotatingId: cfg.rotatingId, guest: cfg.guest, weights: cfg.judgeWeights });
  say('main-stage', 'main-stage', { judges: panel.map(j => j.id) });

  const category = cfg.runwayCategory || `${maxi.name} eleganza`;
  // The styles this category flatters, from the category itself. A prompt
  // nobody declared styles for is neutral, and a design or Ball week's runway
  // is the look she BUILT, which is judged on the building rather than on
  // whether the theme suited her.
  const categoryStyles = cfg.categoryStyles || runwayById(category)?.styles || [];
  // A module may replace the runway entirely: a Ball is three walks, a
  // makeover walks a pair. Anything that does not gets the one themed walk.
  const walks = M.runwayOverride?.walks
    || [{ category, sewn: maxi.runway === 'design' || maxi.runway === 'ball', categoryStyles }];
  const runway = { category, categoryStyles, walks: walks.map(w => w.category) };
  for (const n of living) {
    const scored = walks.map(w => runwayScore({
      player: P(n), category: w.category, sewn: !!w.sewn,
      categoryStyles: w.sewn ? [] : (w.categoryStyles || []), rng,
    }));
    runway[n] = {
      score: Math.round(scored.reduce((t, x) => t + x.score, 0) / scored.length * 100) / 100,
      fit: scored[0].fit,
      walks: scored.map(x => x.score),
    };
  }
  say('runway', 'runway', { category });

  // 12. The panel sees, and the host decides.
  const entries = living.map(n => ({
    name: n,
    style: dragOf(P(n)).style,
    perf: performances[n].perf,
    runway: runway[n].score,
    risk: performances[n].risk,
    polish: Number.isFinite(Number(P(n).stats?.mental)) ? Number(P(n).stats.mental) : 5,
  }));
  const views = judgeViews(panel, entries, state.memory, rng);
  const ranking = panelRanking(views);
  const split = isSplitPanel(ranking);

  // How the season's shape pulls on tonight — the two non-craft terms in the
  // host's bend, both bounded.
  const trackPull = {};
  for (const n of living) {
    const rec = state.record[n];
    const safeRun = rec.slice(-5).filter(r => r === 'SAFE').length;
    const btms = rec.filter(r => r === 'BTM').length;
    trackPull[n] = Math.min(1, safeRun * 0.2) - Math.min(1, btms * 0.34);
  }
  // What the season's arcs want tonight. A room with no tracker (an older
  // save, a week run in isolation by a test) gets zeroes and behaves exactly
  // as it did before the tracker existed.
  const storylineNeed = storylineNeedFor(state.storylines || [], {
    living, episode: cfg.num, totalEpisodes: cfg.totalEpisodes || 12, state,
  });
  // Stashed for the arc tracker's variant reader, which runs after the week
  // and otherwise has no idea how far through the season it is.
  state._drPhase = (cfg.totalEpisodes || 12) > 1
    ? (cfg.num - 1) / ((cfg.totalEpisodes || 12) - 1) : 0;

  const bend = hostBend(ranking, { star: state.star, storylineNeed, trackPull, split });

  // Early-season immunity, when the season is playing that rule.
  const immune = cfg.immunity && state.lastWinner && cfg.num <= 5 ? [state.lastWinner] : [];
  const call = callWeek(bend, { castSize: living.length, immune });

  // ── THE TRIPLE LIP SYNC ────────────────────────────────────────────
  //
  // When the season allows it and the bottom will not resolve into two — the
  // queen just above the bottom is level with the queen in it — she joins them
  // rather than being called safe on a coin flip. Three lip sync, the lowest
  // goes home, and the other two are saved.
  //
  // "Level" is measured on the panel's own view rather than on a rank, because
  // ranks are always one apart and would make this fire every week or never.
  let tripled = false;
  if (cfg.tripleOnTie && call.low.length && call.bottom.length === 2 && living.length > 4) {
    const viewOf = n => (ranking.find(r => r.name === n) || {}).meanRank ?? 0;
    const lowest = call.low[call.low.length - 1];
    const highestBottom = call.bottom[0];
    if (Math.abs(viewOf(lowest) - viewOf(highestBottom)) < 1.25) {
      call.low = call.low.filter(n => n !== lowest);
      call.bottom = [lowest, ...call.bottom];
      tripled = true;
    }
  }

  say('critiques', 'critiques', { call, split, tripled });

  // How each critiqued queen took it. `expected` is HER read of the room —
  // never the panel's ranking, which she has not heard yet.
  const finalRank = Object.fromEntries(bend.map(b => [b.name, b.finalRank]));
  const reactions = {};
  for (const n of [...new Set([...call.win, ...call.high, ...call.low, ...call.bottom])]) {
    const s = P(n).stats || {};
    const intuition = Number.isFinite(Number(s.intuition)) ? Number(s.intuition) : 5;
    const expected = Math.max(1, Math.round(living.length / 2 - (intuition - 5) * 0.4));
    reactions[n] = reactionFor({
      expected, received: finalRank[n], temperament: s.temperament, boldness: s.boldness, rng,
    });
    state.lastReaction[n] = reactions[n];
  }

  say('untucked', 'untucked', { safe: call.safe });
  say('results', 'results', { call });

  // 15. The lip sync.
  const song = (cfg.songTitle && songById(cfg.songTitle)) || pick(rng, SONGS);
  let lipsync = null;
  const exits = [];
  if (call.bottom.length > 2) {
    // A triple. Everybody performs, the lowest goes home, and the call is
    // reported as a shantay for the two who survived it — the doubles are a
    // head-to-head judgement and do not apply to three.
    const scored = call.bottom.map(n => ({
      n,
      r: lipsyncScore({
        player: P(n), song, lipsyncRecord: state.lipsyncRecord[n], lastReaction: reactions[n], rng,
      }),
    })).sort((x, y) => y.r.score - x.r.score);

    // TIES HAPPEN, and they were being broken by array order — which meant the
    // queen who went home depended on where the panel had listed her, a thing
    // nobody decided. Scores are rounded to two places, so an exact tie in a
    // three-way is not rare enough to leave to chance.
    //
    // The show's own logic breaks it: when two performances are level, the one
    // with less to show for the season goes. Wins and highs count for her,
    // lows and bottoms against, and a queen who has never been in trouble
    // survives a queen who has.
    const standing = n => {
      const rec = state.record[n] || [];
      return rec.filter(r => r === 'WIN').length * 2
        + rec.filter(r => r === 'HIGH').length
        - rec.filter(r => r === 'BTM').length;
    };
    const worst = scored[scored.length - 1].r.score;
    const tied = scored.filter(x => x.r.score === worst);
    const goingHome = tied.length === 1
      ? tied[0].n
      : tied.slice().sort((x, y) => standing(x.n) - standing(y.n))[0].n;
    lipsync = {
      song: song.title, artist: song.artist, queens: call.bottom.map(n => n),
      scores: Object.fromEntries(scored.map(x => [x.n, x.r.score])),
      beats: Object.fromEntries(scored.map(x => [x.n, x.r.beats])),
      stunts: Object.fromEntries(scored.map(x => [x.n, x.r.stunt])),
      call: 'triple', winner: scored[0].n, loser: goingHome,
      gap: Math.round((scored[0].r.score - scored[scored.length - 1].r.score) * 100) / 100,
      triple: true,
    };
    for (const x of scored) state.lipsyncRecord[x.n].push(x.n === goingHome ? 'L' : 'W');
    exits.push(goingHome);
    say('lipsync', 'lipsync', { lipsync });
  } else if (call.bottom.length === 2) {
    const [a, b] = call.bottom;
    const sa = lipsyncScore({
      player: P(a), song, lipsyncRecord: state.lipsyncRecord[a], lastReaction: reactions[a], rng,
    });
    const sb = lipsyncScore({
      player: P(b), song, lipsyncRecord: state.lipsyncRecord[b], lastReaction: reactions[b], rng,
    });
    // The host's lean, at half weight, as the spec requires.
    const bendOf = n => (bend.find(x => x.name === n)?.bend || 0) * 0.5;
    // A NO-ELIMINATION WEEK still runs the lip sync — a split premiere ends
    // with two queens performing for their lives and both staying, which is
    // the night's climax — but nobody goes home, so the call is resolved
    // without a loser rather than skipped.
    const lc = cfg.noElimination
      ? { call: 'shantay', winner: sa.score >= sb.score ? a : b, loser: null, losers: [], gap: sa.score - sb.score }
      : lipsyncCall({
        a: { name: a, score: sa.score }, b: { name: b, score: sb.score },
        bendA: bendOf(a), bendB: bendOf(b),
        allowDoubleShantay: cfg.allowDoubleShantay,
        allowDoubleSashay: cfg.allowDoubleSashay,
      });

    lipsync = {
      song: song.title, artist: song.artist, queens: [a, b],
      scores: { [a]: sa.score, [b]: sb.score },
      beats: { [a]: sa.beats, [b]: sb.beats },
      stunts: { [a]: sa.stunt, [b]: sb.stunt },
      call: lc.call, winner: lc.winner, loser: lc.loser, gap: lc.gap,
    };

    if (lc.call === 'double-shantay') {
      state.lipsyncRecord[a].push('W');
      state.lipsyncRecord[b].push('W');
    } else if (lc.call === 'double-sashay') {
      state.lipsyncRecord[a].push('L');
      state.lipsyncRecord[b].push('L');
      exits.push(a, b);
    } else {
      state.lipsyncRecord[lc.winner].push('W');
      if (lc.loser) {
        state.lipsyncRecord[lc.loser].push('L');
        exits.push(lc.loser);
      }
    }
    say('lipsync', 'lipsync', { lipsync });
  }

  // The record, and who is left.
  for (const n of living) {
    const r = exits.includes(n) ? 'ELIM'
      : call.win.includes(n) ? 'WIN'
        : call.high.includes(n) ? 'HIGH'
          : call.low.includes(n) ? 'LOW'
            : call.bottom.includes(n) ? 'BTM' : 'SAFE';
    state.record[n].push(r);
  }
  state.living = living.filter(n => !exits.includes(n));
  state.out.push(...exits);
  state.lastWinner = call.win[0] || null;
  state.memory = judgeMemoryAfter(state.memory, panel, call);

  const exitRows = exits.map(n => ({
    name: n, slug: P(n).slug || slugOf(n), verb: words.exit, channel: 'lipsync',
  }));
  if (exitRows.length) say('exit', 'exit', { exits: exitRows });

  // ── THE RUNNING ORDER IS THE WEEK'S, NOT THE MODULE'S ─────────────
  //
  // A challenge module hands back all of its scenes at once, so a type that
  // performs on the main stage would otherwise be filed before the runway
  // simply because `runMaxi` returned first. Each scene declares which STEP it
  // belongs to and the week sorts by that, which is also what lets a module
  // emit a werk-room beat and a main-stage beat in the same breath.
  //
  // A stable sort, so two scenes in the same step keep the order the module
  // wrote them in — inside a step, sequence is the module's business.
  // ── THE STAGE, BEAT BY BEAT ───────────────────────────────────────
  //
  // Rendered here, immediately BEFORE the scene sort, and that placement is
  // load-bearing: the sort is what puts a beat in its right step, so anything
  // pushed after it is appended out of order. The first version of this ran
  // after the sort and produced a running order that went runway, critiques,
  // exit, runway again.
  //
  // It runs late in the night rather than at each step because
  // every one of these beats depends on something computed at a different
  // point in the night: the walks need the runway, the critiques need the
  // call, the lip sync beats need the scores. Rendering them where they are
  // *shown* rather than where they are *known* would mean threading half the
  // night's results backwards through the function.
  try {
    const onStage = [...(call.win || []), ...(call.high || []),
      ...(call.low || []), ...(call.bottom || [])];
    const stageScenes = renderStageBeats({
      walking: living, onStage, runway, call, reactions, lipsync,
      exits: exits.slice(), split, judges: panel.map(j => j.id), rng,
    });
    for (const sc of stageScenes) scenes.push(sc);

    // Untucked happens DURING the deliberation, so it is drawn from the call
    // and from who named whom on the stage — not from anything that comes
    // after the verdict, which the queens in that room do not have yet.
    // The four phases that used to be one marker line each. `player` is passed
    // through on the performance so the aptitude read has real craft to look
    // at rather than a name.
    const perfWithPlayers = Object.fromEntries(Object.entries(performances)
      .map(([n, v]) => [n, { ...v, player: P(n) }]));
    for (const sc of renderChallengeBeats({
      living, maxi, mini, miniWinner, miniScores,
      assignment: M.assignment || {}, performances: perfWithPlayers, rng,
    })) scenes.push(sc);

    const untuckedScenes = runUntucked({
      living, players: ctx.players, state, storylines: state.storylines || [],
      call, namedOnStage: [], rng, ctx: { bond: ctx.bond, episode: cfg.num },
    });
    for (const sc of untuckedScenes) {
      applyUntuckedScene(sc, ctx);
      scenes.push(sc);
      werkEvents.push({
        type: `untucked:${sc.data.event}`, players: sc.data.players,
        bond: sc.effects.bond && sc.data.players[1]
          ? [[sc.data.players[0], sc.data.players[1], sc.effects.bond]] : [],
        pop: Object.fromEntries(Object.entries(sc.effects.pop || {})
          .map(([k, v]) => [k === 'a' ? sc.data.players[0] : sc.data.players[1], v])
          .filter(([n]) => n)),
        state: sc.effects.state ? { [sc.effects.state]: sc.data.players[0] } : {},
        data: {},
      });
    }
  } catch (err) {
    // A stage that cannot be narrated must not stop a season being played.
    // The result is already decided by this point; these beats only describe it.
    scenes.push({
      step: 'main-stage', kind: 'stage:error', data: { error: String(err && err.message) }, text: '',
    });
  }

  const stepIndex = st => {
    const i = SCENE_STEPS.indexOf(st);
    return i === -1 ? SCENE_STEPS.length : i;
  };
  scenes.sort((a, b) => stepIndex(a.step) - stepIndex(b.step));

  const row = {
    num: cfg.num,
    format: 'drag-race',
    // THE VOTE FIELD, ALWAYS NULL. See the header.
    eliminated: null,
    exits: exitRows,
    twists: [],
    houseAtStart: living,
    airedEvents: [],
    dr: {
      ep: cfg.num,
      challenge: { id: maxi.id, name: maxi.name, format: maxi.format, stage: maxi.stage },
      mini,
      judges: panel.map(j => j.id),
      guest: cfg.guest ? { name: cfg.guest.name, slug: cfg.guest.slug || slugOf(cfg.guest.name) } : null,
      assignment,
      performances,
      runway,
      panel: { views, ranking, split },
      bend,
      call,
      reactions,
      lipsync,
      events: [...maxiEvents, ...werkEvents],
      werk: werkScenes.map(s2 => ({ id: s2.id, slot: s2.slot, players: s2.players, eligible: s2.eligible })),
      // A SNAPSHOT, not the live list: replaying episode 4 must show episode
      // 4's arcs, not the ones the season ended with.
      storylines: arcSummary(state.storylines || []),
      storylineNeed,
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      scenes,
    },
  };
  state.episodes.push(row);
  void popDelta;   // Plan 2 writes the ledger from challenge events.
  return row;
}
