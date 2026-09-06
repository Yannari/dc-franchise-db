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
import { panelFor } from './judges.js';
import { performQueen, runwayScore, blendScore, noise } from './perform.js';
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from './judging.js';
import { lipsyncScore, lipsyncCall } from './lipsync.js';
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

/**
 * Who gets what. Plan 2 replaces this with a module per challenge type; this
 * version is deliberately plain so the spine can be tested on its own.
 */
function assignRoles(maxi, living, rng, miniWinner) {
  const order = [...living].sort(() => rng() - 0.5);
  if (miniWinner && order.includes(miniWinner)) {
    order.splice(order.indexOf(miniWinner), 1);
    order.unshift(miniWinner);
  }

  const teams = [];
  if (maxi.format === 'teams') {
    const half = Math.ceil(order.length / 2);
    teams.push(order.slice(0, half), order.slice(half));
  } else if (maxi.format === 'cast') {
    teams.push([...order]);
  } else if (maxi.format === 'pairs') {
    for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
  }

  const roles = {};
  order.forEach((n, i) => {
    roles[n] = !maxi.roles ? 'standard'
      : i === 0 ? 'lead'
        : i < 3 ? 'featured'
          : i < Math.max(3, order.length - 2) ? 'standard' : 'ensemble';
  });
  return { roles, teams, order };
}

/** Craft-only preparation. Plan 2 adds help, sabotage and the walkthrough. */
function prepareFor(player, maxi) {
  const d = dragOf(player);
  const s = player.stats || {};
  const num = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5);
  return (blendScore(d, maxi.blend) - 5) * 0.1
    + (num('mental') - 5) * 0.03
    + (num('strategic') - 5) * 0.02;
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
  say('cold-open', 'cold-open', { gone: last ? last.exits.map(x => x.name) : [] });
  say('werk-morning', 'werk-morning', { living: [...living] });

  // 3. The mini, and what winning it buys.
  let mini = null;
  let miniWinner = null;
  if (cfg.miniId) {
    const m = miniById(cfg.miniId);
    if (m) {
      const scored = living
        .map(n => ({ n, s: blendScore(dragOf(P(n)), m.blend) + noise(rng, 3) }))
        .sort((a, b) => b.s - a.s);
      miniWinner = scored[0].n;
      mini = { id: m.id, name: m.name, winner: miniWinner, buys: m.buys };
      say('mini', 'mini', { mini });
    }
  }

  // 4–5. The announcement and the draft.
  say('maxi-announce', 'maxi-announce', { challenge: maxi.name, desc: maxi.desc });
  const assignment = assignRoles(maxi, living, rng, miniWinner);
  say('choice', 'choice', { order: assignment.order, teams: assignment.teams, roles: assignment.roles });

  // 6. Preparation.
  const prep = Object.fromEntries(living.map(n => [n, prepareFor(P(n), maxi)]));
  say('prep', 'prep', {});

  // 7 / 11. The challenge itself, wherever it belongs.
  const performances = {};
  const runMaxi = () => {
    for (const n of living) {
      const team = assignment.teams.find(t => t.includes(n)) || null;
      const chemistry = team && team.length > 1
        ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.1
        : 0;
      const r = performQueen({
        player: P(n), maxi, role: assignment.roles[n], prep: prep[n],
        chemistry, record: state.record[n], rng,
      });
      performances[n] = {
        ...r,
        role: assignment.roles[n],
        team: team ? assignment.teams.indexOf(team) : null,
        detail: {},
      };
    }
  };
  if (maxi.stage === 'pre') {
    runMaxi();
    say('maxi-pre', 'maxi-performance', { challenge: maxi.name });
  }

  // 8–10. Elimination day, the panel, the runway.
  say('werk-elim-day', 'werk-elim-day', { living: [...living] });
  const panel = panelFor({ rotatingId: cfg.rotatingId, guest: cfg.guest, weights: cfg.judgeWeights });
  say('main-stage', 'main-stage', { judges: panel.map(j => j.id) });

  const category = cfg.runwayCategory || `${maxi.name} eleganza`;
  const runway = { category };
  for (const n of living) {
    const sewn = maxi.runway === 'design' || maxi.runway === 'ball';
    const r = runwayScore({
      player: P(n), category, sewn,
      categoryStyles: cfg.categoryStyles || [], rng,
    });
    runway[n] = { score: r.score, fit: r.fit };
  }
  say('runway', 'runway', { category });

  if (maxi.stage === 'main') {
    runMaxi();
    say('maxi-main', 'maxi-performance', { challenge: maxi.name });
  }

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

  // How the season's shape pulls on tonight. `trackPull` is the only one wired
  // now; Plan 3 fills `storylineNeed` from the arc tracker.
  const trackPull = {};
  for (const n of living) {
    const rec = state.record[n];
    const safeRun = rec.slice(-5).filter(r => r === 'SAFE').length;
    const btms = rec.filter(r => r === 'BTM').length;
    trackPull[n] = Math.min(1, safeRun * 0.2) - Math.min(1, btms * 0.34);
  }
  const storylineNeed = Object.fromEntries(living.map(n => [n, 0]));

  const bend = hostBend(ranking, { star: state.star, storylineNeed, trackPull, split });

  // Early-season immunity, when the season is playing that rule.
  const immune = cfg.immunity && state.lastWinner && cfg.num <= 5 ? [state.lastWinner] : [];
  const call = callWeek(bend, { castSize: living.length, immune });
  say('critiques', 'critiques', { call, split });

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
  if (call.bottom.length >= 2) {
    const [a, b] = call.bottom;
    const sa = lipsyncScore({
      player: P(a), song, lipsyncRecord: state.lipsyncRecord[a], lastReaction: reactions[a], rng,
    });
    const sb = lipsyncScore({
      player: P(b), song, lipsyncRecord: state.lipsyncRecord[b], lastReaction: reactions[b], rng,
    });
    // The host's lean, at half weight, as the spec requires.
    const bendOf = n => (bend.find(x => x.name === n)?.bend || 0) * 0.5;
    const lc = lipsyncCall({
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
      state.lipsyncRecord[lc.loser].push('L');
      exits.push(lc.loser);
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
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      scenes,
    },
  };
  state.episodes.push(row);
  void popDelta;   // Plan 2 writes the ledger from challenge events.
  return row;
}
