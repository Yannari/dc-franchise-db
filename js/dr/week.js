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
import { arrivalScenes } from './arrivals.js';
import { dragOf } from './queen.js';
import { maxiById } from './data/challenges.js';
import { miniById } from './data/minis.js';
import { SONGS, songById } from './data/songs.js';
import { runwayById } from './data/runways.js';
import { panelFor } from './judges.js';
import { runwayScore, blendScore, noise, polishFor, PANEL_FORM } from './perform.js';
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from './judging.js';
import { rateBoard, ballotSelfishness } from './rate.js';
import { storylineNeed as storylineNeedFor, arcSummary, popSnapshot } from './storylines.js';
import { runWerkRoom, applyWerkScene } from './werk.js';
import { runMini, applyMiniEvents } from './mini.js';
import { critiqueLines, runReactions, whoShouldGoHome, rateAQueen } from './critiques.js';
import { renderStageBeats, runUntucked, applyUntuckedScene, renderChallengeBeats,
  renderMaxiEventScenes } from './stage.js';
import { lipsyncScore, lipsyncCall } from './lipsync.js';
import { runMaxi, applyEvents } from './maxi.js';
import { showWords } from '../shows.js';
import { familyForChallenge } from './data/maxi-performance.js';
import { chooseResultOrder } from './data/results-order.js';

/** The running order. A scene's `step` is always one of these. */
export const SCENE_STEPS = [
  // The premiere only, and first: the door opens before anything else does.
  'arrivals',
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

  /* 0. THE PREMIERE OPENS ON THE DOOR, not on an empty station.
     Every other episode's cold open is about who left last night; the first
     has nobody to be about. So the premiere gets the arrivals scene instead
     — each queen through the door, her line, the room's answer, who she is
     — and the host at the end of it. See js/dr/arrivals.js. */
  const isPremiere = !state.episodes.length;
  const arrivals = isPremiere ? arrivalScenes({
    cast: [...living], players: ctx.players || {}, rng, star: state.star || {},
  }) : [];
  for (const sc of arrivals) scenes.push(sc);

  // 1–2. The room after the last exit, and the morning after that.
  const last = state.episodes[state.episodes.length - 1] || null;
  const gone = last ? last.exits.map(x => x.name) : [];
  /* NO COLD OPEN ON THE PREMIERE. The cold open is the morning AFTER an
     elimination — its whole pool is the empty station, the lipstick message
     on the mirror, the room going back over last night — and on episode one
     nobody has left, nobody has slept, and the queens are still walking
     through the door. The entrances are the opening. */
  if (!isPremiere) say('cold-open', 'cold-open', { gone });
  say('werk-morning', 'werk-morning', { living: [...living] });

  // ── THE ROOM ──────────────────────────────────────────────────────
  //
  // Drawn once for the whole week rather than per slot, so a scene cannot
  // repeat itself across the morning and the afternoon, and filed into the
  // slots it belongs to. The maxi challenge writes its own prep scenes; these
  // are the ones that are about the room rather than about the work.
  // Declared before the room is drawn because the mini writes into it too.
  const werkEvents = [];
  /** Apply an {bond, pop, state} event. The one place these three land. */
  const applyEventLike = e => {
    for (const [a, b, d] of e.bond || []) ctx.addBond(a, b, d);
    for (const [n, d] of Object.entries(e.pop || {})) ctx.popDelta(n, d);
    for (const [k, v] of Object.entries(e.state || {})) (state.flags ||= {})[k] = v;
  };
  /* THE PREMIERE'S FIRST IMPRESSIONS ARE REAL. They are applied here rather
     than inside arrivalScenes, so every bond in this episode lands through
     the same function — one place, one rule, and nothing about arrivals is
     special except when it happens. */
  for (const sc of arrivals) if (sc.bond || sc.pop) applyEventLike(sc);

  const werkScenes = runWerkRoom({
    // The cold-open slot goes with its marker: its events are written for a
    // room that lost somebody last night, and the premiere's room has not.
    slots: isPremiere
      ? ['werk-morning', 'prep', 'werk-elim-day']
      : ['cold-open', 'werk-morning', 'prep', 'werk-elim-day'],
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
  const elimDayScenes = [];
  for (const sc of werkScenes) {
    const applied = applyWerkScene(sc, ctx);
    /* THE PAIRING, REMEMBERED. Without this `romanceOpen` and `alreadyPaired`
       read an empty list forever: the cap would never bind, one queen could
       run three of these at once, and a show that is explicitly NOT about
       this would drift into being about it. */
    if (applied?.state === 'romance' && sc.players?.length === 2) {
      const pair = [...sc.players].sort();
      state.romances ||= [];
      if (!state.romances.some(r => r[0] === pair[0] && r[1] === pair[1])) {
        state.romances.push(pair);
      }
    }
    /* HELD BACK UNTIL ITS OWN MARKER. Every werk room slot is generated here
       in one pass, but the `werk-elim-day` marker is not said until much later
       in the night — so the elimination-day scenes were pushed BEFORE the
       section that owns them and fell into whichever section was open at the
       time. The viewing party then drew an "Elimination Day" screen holding
       nothing but the marker: claimed, and empty, on eight episodes out of
       nine. Caught by rendering every screen of a hundred seasons and
       measuring how much text came out, not by any assertion. */
    const scene = {
      step: sc.slot, kind: `werk:${sc.id}`,
      data: { players: sc.players, note: sc.note, eligible: sc.eligible },
      text: sc.text || '',
    };
    if (sc.slot === 'werk-elim-day') elimDayScenes.push(scene);
    else scenes.push(scene);
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
  /* HELD, NOT PUSHED HERE. The mini's own cards — the announce, one attempt
     per queen, the win — are produced by `renderChallengeBeats` further down,
     so pushing the events at this point puts "she read her to the floor"
     above the card announcing the mini it happened in. */
  let miniEventScenes = [];
  if (cfg.miniId) {
    const m = miniById(cfg.miniId);
    if (m) {
      // The mini is its own thing now rather than a stat roll inlined here:
      // a reading challenge is one queen doing a bit about another, and
      // resolving that privately threw away the only part worth filming.
      const res = runMini({
        living, mini: m, players: ctx.players, rng, bond: ctx.bond, star: state.star,
      });
      miniScores = res.scores;
      miniWinner = res.winner;
      mini = {
        id: m.id, name: m.name, winner: miniWinner, buys: m.buys,
        interaction: res.interaction, detail: res.detail,
        // Who reads when. The turn is the format for a targeting mini.
        turnOrder: res.turnOrder || null,
      };
      applyMiniEvents(res.events, ctx);
      for (const e of res.events) {
        werkEvents.push({
          type: `mini:${e.type}`, players: e.players,
          bond: e.bond || [], pop: e.pop || {}, state: e.state || {}, data: e.data || {},
        });
      }
      say('mini', 'mini', { mini });
      /* AND THE MINI'S OWN EVENTS, NARRATED. Five of them — read-landed,
         read-missed, pulled-the-punch, did-her-proud, did-her-dirty — have
         had authored prose in js/dr/data/maxi-events.js under `from: 'mini'`
         since that file was written, and every one of them moves a bond and a
         popularity score. `renderMaxiEventScenes` is the thing that turns
         them into words and it was only ever handed the MAXI's events, so a
         queen could read another queen to the floor, lose half a bond point
         over it and gain two popularity, and the episode said nothing.
         Written, consequential, and drawn by nobody. */
      miniEventScenes = renderMaxiEventScenes(res.events, { step: 'mini', rng });
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
  // ...and now the scenes that belong under it.
  for (const sc of elimDayScenes) scenes.push(sc);
  const panel = panelFor({ rotatingId: cfg.rotatingId, guest: cfg.guest, weights: cfg.judgeWeights });
  /* THE PANEL AS SEATS, for the beat that introduces them one at a time. A
     guest's credit is authored on the pinned guest and is the ONLY claim the
     introduction is allowed to make about her past — there is no deriving
     "the winner of the ninth season" from a roster row, and a host who
     invents one is worse than a host who does not mention it. */
  const guestCredit = (cfg.guest && cfg.guest.credit) || '';
  const panelSeats = panel.map(j => ({
    id: j.id, name: j.name || j.id, guest: !!j.guest,
    credit: j.guest ? guestCredit : '',
    // Her taste, because the deliberation argues from the dimension two
    // judges are furthest apart on and cannot find that without the numbers.
    taste: j.taste,
  }));
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
  // Which shape of category call the host makes: three looks, one she sewed,
  // or one she brought. Read from the walks rather than from the challenge,
  // because a module may replace the runway without changing the challenge.
  const runwayKind = walks.length > 1 ? 'ball' : (walks[0] && walks[0].sewn ? 'sewn' : 'call');
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
    polish: polishFor(P(n), rng),
    // One draw per queen per episode, seen the same way by every seat.
    // See the note in judgeViews — this is the only shared, non-averaging
    // uncertainty the panel has.
    form: noise(rng, PANEL_FORM),
  }));
  const views = judgeViews(panel, entries, state.memory, rng);
  /* ── RATE-A-QUEEN ──
     The twist where the ROOM ranks the room and the panel sits it out. The
     queens rank each other best to worst and the ballots are added with a
     Borda count — see js/dr/rate.js, which is where the counting and the
     reasons a ballot lies both live.
     It substitutes for the panel's board rather than adjusting it, which is
     the whole point of the twist: on this night the judges do not decide.
     `ballots` is kept so the screen can show who ranked whom, because a
     ranking nobody can see is just a different set of numbers. */
  const rated = cfg.rateAQueen
    ? rateBoard({
      living,
      truth: Object.fromEntries(living.map(n => [n, performances[n].perf])),
      players, bond, rng,
    })
    : null;
  const ranking = rated ? rated.ranking : panelRanking(views);
  const split = isSplitPanel(ranking);

  // How the season's shape pulls on tonight — the two non-craft terms in the
  // host's bend, both bounded.
  const trackPull = {};
  for (const n of living) {
    const rec = state.record[n];
    const safeRun = rec.slice(-5).filter(r => r === 'SAFE').length;
    // BOTH BOTTOM CALLS. This counted 'BTM' alone, and since the call was
    // split that is only the queens saved before the song — the ones who
    // actually lip synced were invisible to the host's lean.
    const btms = rec.filter(r => r === 'BTM' || r === 'BTM2').length;
    /* AND THE QUEEN WHO KEEPS WINNING GETS NO BENEFIT OF THE DOUBT.
       This term lifted a queen on a safe run and pushed down one with
       bottoms, and said nothing about a repeat winner — so a queen with high
       craft topped the challenge, topped the runway, and then took the host's
       star lean on top of all of it, with nothing pulling the other way.
       Measured across a hundred seasons the top queen was taking 53% of a
       season's maxi challenges; the real show's most dominant winners take
       three or four of twelve.
       The host lifts the queen who needs a moment. Somebody who won last week
       does not need one. */
    const recentWins = rec.slice(-3).filter(r => r === 'WIN').length;
    trackPull[n] = Math.min(1, safeRun * 0.2)
      - Math.min(1, btms * 0.34)
      - Math.min(1, recentWins * 0.5);
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

  /* AND THE HOST DOES NOT BEND A NIGHT HE DID NOT JUDGE. Every other week he
     can overrule the board for the story; on a Rate-a-Queen the room's answer
     IS the answer, and a bend here would quietly hand the call back to the
     person the twist took it from. The bent shape is still built, because
     callWeek reads finalRank, but it is the queens' order unchanged. */
  const bend = rated
    ? ranking.map((r, i) => ({ ...r, finalRank: i + 1, panelRank: r.panelRank }))
    : hostBend(ranking, { star: state.star, storylineNeed, trackPull, split });

  // Early-season immunity, when the season is playing that rule.
  const immune = cfg.immunity && state.lastWinner && cfg.num <= 5 ? [state.lastWinner] : [];
  /* AND THE QUEEN WHO JUST WALKED BACK IN. She competes on her return night
     — she takes the challenge, the runway and a place on the chart like
     anybody else — but she cannot be sent home on it.
     Not a kindness: a twist that brings somebody back and eliminates her
     three hours later has spent itself for nothing, and it measurably does.
     The first season played with this booked returned a queen on episode
     six who went into the bottom two the same night and lost. The show
     would not do that and neither will this. */
  if (cfg.returnedQueen && !immune.includes(cfg.returnedQueen)) {
    immune.push(cfg.returnedQueen);
  }
  /* A BOTTOM THREE IS A REAL NIGHT AND HAS TO BE BOOKABLE. The ordinary week
     names the two who lip sync; the show also runs weeks where it names three
     and saves one of them on the stage, which is what `atRisk`/BTM is and the
     only thing that makes that call reachable at all. Left to the schedule
     rather than rolled here, so a season can be replayed. */
  const call = callWeek(bend, {
    castSize: living.length, immune,
    bottomNamed: cfg.bottomNamed || (cfg.bottomThree ? 3 : 2),
  });

  /* ── DOUBLE WIN ─────────────────────────────────────────────────────
     The show has awarded a shared maxi win a handful of times across its
     history — always on a genuine dead heat where the panel cannot split
     two queens who both delivered. It reads the PANEL ranking (meanRank),
     not the bent order, because whether two performances were level is a
     fact about the stage. The host can promote a queen one place; he
     cannot manufacture a tie that was not there.

     Conditions: the top two have identical meanRank (a genuine dead heat),
     AND neither has immunity this week, AND the host decides to call it
     (50% on any tie — most ties the host quietly breaks one way).
     Measured over 100 seasons: ~0.23 per season, roughly once every four,
     which matches the real show's handful across 20+ seasons. */
  if (call.win.length === 1 && call.high.length >= 1) {
    const sorted = [...ranking].sort((a, b) => a.meanRank - b.meanRank);
    if (sorted.length >= 2) {
      const gap = sorted[1].meanRank - sorted[0].meanRank;
      const second = sorted[1].name;
      if (gap < 0.01 && !immune.includes(second) && !immune.includes(sorted[0].name)
        && rng() < 0.50) {
        call.win = [sorted[0].name, second];
        call.high = call.high.filter(n => n !== second);
        call.doubleWin = true;
      }
    }
  }

  /* ── RATE-A-QUEEN WITH NOTHING AT STAKE PUTS THE TOP TWO ON THE SONG ──
     The twist as the show ran it: the room ranks, the two HIGHEST placements
     lip sync, and the winner of that takes the week. Nobody goes home — the
     premiere it was built for was a non-elimination night — so the song is
     for the win rather than for a life.
     That is only true when the week is booked with no elimination. A
     Rate-a-Queen on an ordinary week keeps the ordinary shape: the room's
     ranking still decides the call, and the bottom two still sing to stay.
     WHO SINGS AND WHO IS IN THE BOTTOM ARE TWO DIFFERENT QUESTIONS, and
     collapsing them put the same queen in two call groups at once: she was
     the WIN and she was also in `call.bottom`, so the results screen drew her
     twice with contradictory stamps — BTM2 above her own WIN. On a night the
     top two sing, NOBODY is in the bottom. `call.singers` is who sings. */
  /* ── LIP SYNC FOR YOUR LEGACY ──
     The All Stars inversion, and the deepest rule change the show has: the
     top two sing, and the WINNER eliminates. It is the same staging as a
     Rate-a-Queen no-elimination night — the two best perform, the song is for
     a prize rather than for a life — except the prize is the power to send
     somebody home.
     `legacy` therefore shares topTwoSing; what it does not share is the empty
     exit list. */
  const legacy = !!(cfg.legacy && bend.length >= 4);
  const topTwoSing = legacy || !!(cfg.rateAQueen && cfg.noElimination && bend.length >= 2);
  if (topTwoSing) {
    const top2 = bend.slice(0, 2).map(r => r.name);
    call.singers = top2;
    call.bottom = [];
    call.atRisk = [];
    // Nobody is safe-with-a-note on a night the room ranked for a prize, and
    // the win is not awarded until the song is over.
    call.win = [];
    call.high = bend.slice(2, 4).map(r => r.name).filter(n => !top2.includes(n));
    call.low = [];
    call.safe = bend.slice(2).map(r => r.name).filter(n => !call.high.includes(n));
  }

  /* ── HOW THE HOST RUNS THE CALL TONIGHT ──
     The order is a decision and it is made from what happened, not rolled
     flat and not fixed. A first win wants to be the last thing said; a queen
     who has been winning all season standing in the bottom two wants to be
     the FIRST thing said, because the room has to feel that before it is
     told anything good; a blowout does not pretend the win is in doubt.
     Weighted, so a season does not run the same shape twelve times. */
  const recordOf = n => state.record?.[n] || [];
  const winner = (call.win || [])[0];
  const callOrder = chooseResultOrder({
    winnerFirstWin: !!winner && !recordOf(winner).includes('WIN'),
    // How far clear of second she finished, as a fraction of the board.
    winnerGap: (() => {
      const rows = [...bend].sort((a, b) => a.finalRank - b.finalRank);
      if (rows.length < 3) return 0;
      const spread = (rows[rows.length - 1].bend ?? 0) - (rows[0].bend ?? 0);
      const lead = (rows[0].bend ?? 0) - (rows[1].bend ?? 0);
      return spread > 0 ? Math.max(0, Math.min(1, lead / spread)) : 0;
    })(),
    // The best record among the two who are about to lip sync.
    dangerStreak: Math.max(0, ...(call.bottom || []).map(n => {
      const r = recordOf(n);
      return (r.filter(x => x === 'WIN').length * 0.5
        + r.filter(x => x === 'HIGH').length * 0.25);
    }), 0),
    rng,
  });

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
  /* THE QUEEN THIS PULLS IN IS THE ONE ALREADY NAMED IN THE BOTTOM.
     This read `call.low`, which used to mean "in the announced bottom and not
     lip syncing". It does not any more — that group is `atRisk`, and `low` is
     now genuinely safe queens with a bad critique. Dragging a LOW queen into a
     lip sync would be pulling in somebody the panel never put in danger. */
  const pool = call.atRisk.length ? call.atRisk : call.low;
  /* A DOUBLE ELIMINATION IS A WIDER BOTTOM, NOT A DOUBLE SASHAY.
     A double sashay is the host looking at TWO queens who lip synced head to
     head and keeping neither — a verdict on that one performance. A double
     elimination is a different night: the panel calls three or four queens to
     the bottom, they lip sync together, and the two weakest go. This used to
     take the ordinary bottom two and send both, which is the sashay wearing
     the other one's name.
     Three from a small room, four when there are enough queens left to fill
     it — the bottom is as wide as the night can afford. */
  let widened = 0;
  if (cfg.doubleElimination && living.length >= 6) {
    const want = living.length >= 9 ? 4 : 3;
    while (call.bottom.length < want) {
      const from = call.atRisk.length ? call.atRisk : call.low;
      if (!from.length) break;
      const pulled = from[from.length - 1];
      call.atRisk = call.atRisk.filter(n => n !== pulled);
      call.low = call.low.filter(n => n !== pulled);
      call.bottom = [pulled, ...call.bottom];
      widened++;
    }
  }
  if (cfg.tripleOnTie && pool.length && call.bottom.length === 2 && living.length > 4) {
    const viewOf = n => (ranking.find(r => r.name === n) || {}).meanRank ?? 0;
    const lowest = pool[pool.length - 1];
    const highestBottom = call.bottom[0];
    if (Math.abs(viewOf(lowest) - viewOf(highestBottom)) < 1.25) {
      call.atRisk = call.atRisk.filter(n => n !== lowest);
      call.low = call.low.filter(n => n !== lowest);
      call.bottom = [lowest, ...call.bottom];
      tripled = true;
    }
  }

  // ── WHAT THE PANEL ACTUALLY SAID, AND WHAT IT COST ────────────────
  //
  // Tone comes from each judge's OWN view rather than from the call, so a
  // split panel produces genuinely opposed critiques of one performance
  // instead of four people agreeing in different words.
  /* ── NO CRITIQUES ON A RATE-A-QUEEN NIGHT ──
     That is the twist rather than a side effect of it: the panel has handed
     the call to the room, so there is nothing for four judges to say between
     the runway and the results. The queens are still standing on the stage
     waiting to be told something, and what they are told is that nobody is
     going to tell them anything.
     The scene still fires — the screen is built from it and the reactions
     read it — with an empty critique list and a flag saying why. */
  /* AN EMPTY LIST, NOT AN EMPTY OBJECT. `critiqueLines` returns an array and
     the stage renderer calls `.filter` on it, so `{}` threw — inside a
     try/catch that turns a narration failure into a silent `stage:error`
     scene, which is the right call for a played season and meant this cost
     the viewer THREE SCREENS with nothing anywhere saying why: no results, no
     lip sync, no exit on any Rate-a-Queen night. */
  const critiques = cfg.rateAQueen ? [] : critiqueLines({ panel, views, call, entries, rng });

  say('critiques', 'critiques', {
    call, split, tripled, critiques, twist: cfg.critiqueTwist || null,
    ...(cfg.rateAQueen ? { rateAQueen: true } : {}),
  });

  // How each critiqued queen took it. `expected` is HER read of the room —
  // never the panel's ranking, which she has not heard yet.
  const finalRank = Object.fromEntries(bend.map(b => [b.name, b.finalRank]));
  const reactions = {};
  for (const n of [...new Set([...call.win, ...call.high, ...call.low, ...call.atRisk, ...call.bottom])]) {
    const s = P(n).stats || {};
    const intuition = Number.isFinite(Number(s.intuition)) ? Number(s.intuition) : 5;
    const expected = Math.max(1, Math.round(living.length / 2 - (intuition - 5) * 0.4));
    reactions[n] = reactionFor({
      expected, received: finalRank[n], temperament: s.temperament, boldness: s.boldness, rng,
    });
    state.lastReaction[n] = reactions[n];
  }

  // A reaction used to be a label that changed nothing — the cosmetic-event
  // bug this project refuses everywhere else, sitting on the main stage.
  const reacted = runReactions({ reactions, state, rng });
  for (const e of reacted.events) {
    applyEventLike(e);
    werkEvents.push(e);
  }

  // The two twists, when the episode books one.
  let twist = null;
  if (cfg.critiqueTwist === 'who-should-go') {
    twist = whoShouldGoHome({ living, players: ctx.players, bond: ctx.bond, state, rng });
  } else if (cfg.critiqueTwist === 'rate-a-queen') {
    twist = rateAQueen({ living, players: ctx.players, bond: ctx.bond, state, rng });
  }
  if (twist) {
    for (const e of twist.events) {
      applyEventLike(e);
      werkEvents.push(e);
    }
    for (const sc of twist.scenes) scenes.push(sc);
  }

  say('untucked', 'untucked', { safe: call.safe });
  say('results', 'results', { call });

  // 15. The lip sync.
  const song = (cfg.songTitle && songById(cfg.songTitle)) || pick(rng, SONGS);
  let lipsync = null;
  const exits = [];
  /* WHO SINGS. The bottom two on an ordinary night, and on a night the top
     two sing it is them — set above, where `call.bottom` is left empty
     because nobody is in the bottom on a night nobody can lose. */
  const singers = call.singers || call.bottom;

  if (singers.length > 2) {
    // A triple. Everybody performs, the lowest goes home, and the call is
    // reported as a shantay for the two who survived it — the doubles are a
    // head-to-head judgement and do not apply to three.
    const scored = singers.map(n => ({
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
    /* HOW MANY LEAVE. One on an ordinary three-way; two when the night was
       booked as a double elimination, which is what makes the bottom wide in
       the first place. Never so many that the room cannot still reach the
       finale. */
    const wantOut = cfg.doubleElimination
      ? Math.min(2, Math.max(0, living.length - (cfg.finaleSize || 4))) : 1;
    const order = scored.slice().sort((x, y) =>
      (x.r.score - y.r.score) || (standing(x.n) - standing(y.n)));
    const out = order.slice(0, wantOut).map(x => x.n);
    const goingHome = out[0] || null;
    lipsync = {
      song: song.title, artist: song.artist,
      // THE TAGS THE SONG ALREADY HAS. `lipsyncScore` reads tempo and hook
      // to decide who wins and the narration read neither, so a ballad and
      // an uptempo were described in identical words.
      tempo: song.tempo, mood: song.mood, hook: song.hook, queens: singers.map(n => n),
      scores: Object.fromEntries(scored.map(x => [x.n, x.r.score])),
      beats: Object.fromEntries(scored.map(x => [x.n, x.r.beats])),
      stunts: Object.fromEntries(scored.map(x => [x.n, x.r.stunt])),
      call: out.length > 1 ? 'double-elimination' : 'triple',
      winner: scored[0].n, loser: goingHome, losers: [...out],
      gap: Math.round((scored[0].r.score - scored[scored.length - 1].r.score) * 100) / 100,
      triple: true,
      ...(out.length > 1 ? { doubleElimination: true } : {}),
    };
    for (const x of scored) state.lipsyncRecord[x.n].push(out.includes(x.n) ? 'L' : 'W');
    exits.push(...out);
    say('lipsync', 'lipsync', { lipsync });
  } else if (singers.length === 2) {
    const [a, b] = singers;
    const sa = lipsyncScore({
      player: P(a), song, lipsyncRecord: state.lipsyncRecord[a], lastReaction: reactions[a], rng,
    });
    const sb = lipsyncScore({
      player: P(b), song, lipsyncRecord: state.lipsyncRecord[b], lastReaction: reactions[b], rng,
    });
    // The host's lean, at half weight, as the spec requires — PLUS
    // track-record protection. The bend used for challenge placement
    // penalises recent wins (anti-domination), but in a lip sync the
    // opposite is true: a front-runner who didn't completely bomb is
    // almost always saved. Each challenge win is worth 1.5 points of
    // protection, capped at 3.5 — enough to rescue a mediocre night,
    // not enough to overrule a genuine collapse. Measured: a queen
    // with 2+ wins survives ~75% of her lip syncs.
    const bendOf = n => {
      const hostLean = (bend.find(x => x.name === n)?.bend || 0) * 0.5;
      const rec = state.record[n] || [];
      const wins = rec.filter(r => r === 'WIN').length;
      const trackProtection = Math.min(3.5, wins * 1.5);
      return hostLean + trackProtection;
    };
    // A NO-ELIMINATION WEEK still runs the lip sync — a split premiere ends
    // with two queens performing for their lives and both staying, which is
    // the night's climax — but nobody goes home, so the call is resolved
    // without a loser rather than skipped.
    /* A LEGACY NIGHT RESOLVES WITHOUT A LOSER TOO. The song decides who holds
       the power, not who goes home — so it takes the no-loser branch, and the
       elimination happens below when the winner spends it. Gated on
       `noElimination` alone, a legacy lip sync fell through to an ordinary
       shantay and sent the RUNNER-UP home as well as the queen the winner
       chose: two exits on a single elimination night. */
    const lc = (cfg.noElimination || legacy)
      /* ITS OWN CALL, NOT 'shantay'. The stage picks its prose by this value,
         and `shantay` is the tier that says one queen stays and one goes — so
         a night where nobody goes home was narrated as "the half where
         somebody stays and the half where somebody goes" over an empty exit
         list. A night with no elimination is a different call and says so. */
      ? {
        call: legacy ? 'legacy' : (topTwoSing ? 'for-the-win' : 'no-elimination'),
        winner: sa.score >= sb.score ? a : b, loser: null, losers: [],
        gap: sa.score - sb.score,
      }
      : lipsyncCall({
        a: { name: a, score: sa.score }, b: { name: b, score: sb.score },
        bendA: bendOf(a), bendB: bendOf(b),
        allowDoubleShantay: cfg.allowDoubleShantay,
        allowDoubleSashay: cfg.allowDoubleSashay,
      });

    lipsync = {
      song: song.title, artist: song.artist,
      // THE TAGS THE SONG ALREADY HAS. `lipsyncScore` reads tempo and hook
      // to decide who wins and the narration read neither, so a ballad and
      // an uptempo were described in identical words.
      tempo: song.tempo, mood: song.mood, hook: song.hook, queens: [a, b],
      scores: { [a]: sa.score, [b]: sb.score },
      beats: { [a]: sa.beats, [b]: sb.beats },
      stunts: { [a]: sa.stunt, [b]: sb.stunt },
      call: lc.call, winner: lc.winner, loser: lc.loser, gap: lc.gap,
      ...(topTwoSing ? { forTheWin: true } : {}),
    };

    /* AND ON A TOP-TWO NIGHT THE SONG AWARDS THE WEEK. The record is written
       further down from `call.win`, so the winner has to be moved into it
       before that happens — otherwise the night the room ranked for a prize
       goes on the chart as a week nobody won. */
    if (topTwoSing && lc.winner) {
      call.win = [lc.winner];
      call.high = [a, b].filter(n => n !== lc.winner);
      state.lastWinner = lc.winner;
    }

    /* AND ON A LEGACY NIGHT SHE SPENDS IT. The queen who won the song chooses
       who goes home, out of the bottom of the room — not out of the whole
       cast, because the two who just sang are the top two and the show does
       not let her send a rival home for beating her.
       WHO SHE PICKS IS THE SAME QUESTION AS A BALLOT. A queen with the
       appetite for it takes out the biggest threat she can reach; one without
       it takes the queen the room already ranked last, which is the polite
       answer and also the honest one. Reusing ballotSelfishness rather than a
       second rule, so a hero eliminates like a hero here too. */
    if (legacy) {
      const pool = bend.slice(2).map(r => r.name).filter(n => n !== a && n !== b);
      if (pool.length) {
        const appetite = ballotSelfishness(P(lc.winner));
        const chosen = appetite >= 0.4 ? pool[0] : pool[pool.length - 1];
        exits.push(chosen);
        lipsync.eliminated = chosen;
        lipsync.chosenBy = lc.winner;
        lipsync.legacy = true;
        say('lipsync', 'legacy-choice', { winner: lc.winner, eliminated: chosen, pool });
      }
    }

    if (lc.call === 'double-shantay') {
      state.lipsyncRecord[a].push('W');
      state.lipsyncRecord[b].push('W');
      /* NOTHING IS OWED. A night that sends nobody home makes the season one
         episode LONGER — fourteen queens go back to fourteen and the run loop
         keeps booking weeks until the room is finale-sized.
         This used to take on a debt repaid by a double elimination the
         following week, which invited a fair question with a poor answer:
         nobody decided when that double landed, it was simply always the next
         week. A double elimination is a thing an author schedules, not a
         correction the engine applies behind them. */
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
      /* NO DOUBLE ELIMINATION HERE. A head-to-head that sends both queens
         home is a double SASHAY — the host keeping neither of two. A double
         elimination widens the bottom to three or four and takes the two
         weakest out of that, which is the branch above. */
    }
    say('lipsync', 'lipsync', { lipsync });
  }

  // The record, and who is left.
  for (const n of living) {
    /* THE SAME NINE LABELS THE EXPORTER WRITES. This stored `BTM` for the
       queens who lip synced — the old single-bottom name — while
       js/dr/export.js had already moved to BTM2 for exactly them. The two
       shapes of a season then disagreed: the season page's chart showed
       BTM2 and the viewing party's showed BTM, off the same night. Nothing
       failed, because both paths were internally consistent; it was visible
       only by rendering the live chart and noticing BTM2 appeared nowhere. */
    const r = exits.includes(n) ? 'ELIM'
      : call.win.includes(n) ? 'WIN'
        : call.high.includes(n) ? 'HIGH'
          : call.bottom.includes(n) ? 'BTM2'
            : call.atRisk.includes(n) ? 'BTM'
              : call.low.includes(n) ? 'LOW' : 'SAFE';
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
      exits: exits.slice(), split, rng, critiques,
      /* THE PORKCHOP GATE. `state.out` already carries tonight's exits by the
         time beats render, so the season's first elimination is exactly the
         night when everybody who has ever gone home went home tonight. This
         also holds for a double sashay opening the season. */
      firstOfSeason: exits.length > 0 && (state.out || []).length === exits.length,
      /* WHICH UNUSUAL NIGHT THIS IS, or null for an ordinary one. Read from
         the week's own config rather than guessed from the shape of the
         results — "six queens are here" is a symptom, not the announcement. */
      formatNote: cfg.formatNote
        || (cfg.noElimination ? 'no-elimination' : null),
      // NAMES, not ids. A critique that reads "jamal leans back in the chair"
      // is the placeholder being filled with a database key, which is what it
      // did until somebody read the output.
      judges: panel.map(j => j.name || j.id),
      /* THE CATEGORY, THE PANEL AS PEOPLE, AND THE ROSTER. The opening needs
         all three and had none of them: it could not name what anybody was
         walking in, it could not introduce a judge by anything except a name
         drawn at random, and a queen narrating her own runway could not
         reach her own drag style. `judges` above stays as it is — a flat
         list of names is still the right thing for the beats that just want
         somebody on the panel to have said it. */
      category,
      runwayKind,
      panelSeats,
      players,
      // The panel's own disagreement and the host's overrule, so the
      // deliberation can be the argument instead of a note that one happened.
      views, ranking, bend,
      /* WHAT THE SONG IS FOR. The same two queens on the same stage means
         something completely different on a night nobody can lose, and the
         call never said which. */
      stakes: legacy ? 'legacy' : (topTwoSing ? 'win' : 'life'),
      rateAQueen: !!cfg.rateAQueen,
      callOrder,
      challengeFamily: familyForChallenge(maxi.id).family,
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
      // The mini engine's own record of who each queen went after, which the
      // narration needs to name her — it reached the row and stopped there.
      miniDetail: mini?.detail || {},
      assignment: M.assignment || {}, performances: perfWithPlayers, rng,
    })) scenes.push(sc);

    /* ...AND NOW THE MINI'S OWN EVENTS, UNDER THE CARDS THEY BELONG TO —
       which means SPLICED IN AFTER THE LAST MINI SCENE rather than appended.
       `sceneSections` files a scene by where it sits in the array, not by its
       step, so pushing these at the end of the challenge beats put "she went
       for her and the room gave her nothing" inside the maxi's section: a
       read, filed under a Ball, reading as though it were about the gown. */
    if (miniEventScenes.length) {
      let at = -1;
      for (let i = scenes.length - 1; i >= 0; i--) {
        if (scenes[i].step === 'mini') { at = i; break; }
      }
      if (at >= 0) scenes.splice(at + 1, 0, ...miniEventScenes);
      else for (const sc of miniEventScenes) scenes.push(sc);
    }

    // The challenge's own events, narrated. The modules produce these and
    // narrate none of them, so without this they reach the row as bare types.
    for (const sc of renderMaxiEventScenes(maxiEvents, {
      step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main', rng,
      // So the host's walkthrough note can be about this week's actual work.
      family: familyForChallenge(maxi.id).family,
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
      // `credit` was read by the main stage screen and written by nothing, so
      // a guest judge's card always rendered without one.
      guest: cfg.guest
        ? { name: cfg.guest.name, slug: cfg.guest.slug || slugOf(cfg.guest.name), credit: guestCredit }
        : null,
      assignment,
      performances,
      runway,
      panel: { views, ranking, split },
      callOrder,
      critiques,
      critiqueTwist: twist ? { kind: cfg.critiqueTwist, votes: twist.votes || null, tally: twist.tally || null, mean: twist.mean || null } : null,
      bend,
      /* THE BALLOTS, so a screen can show who ranked whom. Null on every
         ordinary week, which is how a reader tells the two apart. */
      rateAQueen: rated
        ? { ballots: rated.ballots, board: rated.ranking, reasons: rated.reasons }
        : null,
      call,
      reactions,
      lipsync,
      events: [...maxiEvents, ...werkEvents],
      werk: werkScenes.map(s2 => ({ id: s2.id, slot: s2.slot, players: s2.players, eligible: s2.eligible })),
      /* ── THE ROOM'S RELATIONSHIPS, WHICH NEVER LEFT THE CALLER ──
         Bonds move in every werk room and every Untucked and lived only in
         the caller's own closure, so no screen could draw them: a season
         built entirely out of who likes whom showed the viewer a per-scene
         delta chip and nothing else. A snapshot per episode is what makes a
         standing relationship visible at all, and it is a snapshot rather
         than a live read for the same reason everything else on the row is —
         replaying episode four must show episode four.
         Only pairs that are ACTUALLY something: a room of twelve is
         sixty-six pairs and most of them are zero. */
      bonds: (() => {
        const out = [];
        for (let i = 0; i < living.length; i++) {
          for (let j = i + 1; j < living.length; j++) {
            const v = Math.round((ctx.bond(living[i], living[j]) || 0) * 10) / 10;
            if (Math.abs(v) >= 2) out.push([living[i], living[j], v]);
          }
        }
        return out.sort((x, y) => Math.abs(y[2]) - Math.abs(x[2]));
      })(),
      families: state.dragFamilies || [],
      /* WHAT THE AUDIENCE MAKES OF THEM, per episode.
         Every scene in this show writes the ledger -- a queen who defends
         somebody gains, a queen who throws a friend under the bus loses --
         and it lived only on `state`, which is one object for the whole
         season. So there was no way to draw episode 4's fan standing, and no
         screen drew it at all: the most-written number in the show was
         invisible. Snapshotted for the same reason the arcs below are, and
         rounded because a ledger printed to fourteen decimal places is not
         more true, only longer. */
      popularity: popSnapshot(state),
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
