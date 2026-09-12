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
import { mentorFor } from './data/judges.js';
import { runwayScore, blendScore, noise, polishFor, PANEL_FORM } from './perform.js';
/* The panel's mean weight on the challenge score, across the seven seats in
   js/dr/data/judges.js. Dividing by it makes a form draw land on the panel at
   exactly the strength it had when the panel added it directly. */
const PANEL_CHALLENGE_WEIGHT = 0.4;
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from './judging.js';
import { rateBoard, ballotSelfishness } from './rate.js';
import { confessionalsFor } from './confessional.js';
import { streamFor } from './rng.js';
import { UNTUCKED_EVENTS } from './data/untucked-events.js';
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
  /* THE NUMBER COMES BEFORE THE WALK. `maxi-main` sat after `runway` here,
     so a rusical read as: the panel sits, the queens walk the category, and
     THEN they perform the show. The screens were already right — they follow
     the SECTIONS registry in js/vp-dr/screens.js, which has had the Maxi
     ahead of the Runway since the two sections were split — but this array
     is the order `row.dr.scenes` is sorted into, and js/dr/writer.js hands
     those scenes to the episode writer verbatim, in this order. The brief
     described the runway before the performance it was reacting to. */
  'maxi-pre', 'werk-elim-day', 'main-stage', 'maxi-main', 'runway',
  'critiques', 'untucked', 'results', 'lipsync', 'exit',
];

/* HOW MUCH TELEVISION EACH ARCHETYPE IS, which is a different question from
   how good she is or how much the room likes her. The villain is the most
   watchable person on any cast -- that is what the villain is FOR -- and the
   floater is the one an edit struggles to find a shot of. Mirrors the same
   ordering `talksToCamera` uses in js/dr/confessional.js: shade, drama and
   comedy are what a cutaway exists for. */
const DRAMA_TV = {
  villain: 1.2, schemer: 1.05, hothead: 1, 'chaos-agent': 1, mastermind: 0.85,
  showmancer: 0.75, 'social-butterfly': 0.75, wildcard: 0.75, underdog: 0.7,
  hero: 0.6, 'perceptive-player': 0.55, 'challenge-beast': 0.5,
  'loyal-soldier': 0.45, floater: 0.3, goat: 0.3,
};
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


/* An untucked scene stores its event id rather than its consequences, and
   `heatOf` needs the consequences to know which way the scene went. One
   lookup, kept beside the only caller. */
function untuckedEffects(sc) {
  const id = sc?.data?.event;
  if (!id) return {};
  const ev = UNTUCKED_EVENTS.find(e => e.id === id);
  return ev?.effects || {};
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
  /* ── THE COLD OPEN IS THE SAME NIGHT, NOT THE NEXT MORNING ──
     The queens walk back into the werk room MINUTES after the elimination,
     still in drag, and the station of whoever just left is still warm. That
     is the moment this slot is: the empty chair, the lipstick on the mirror,
     the room going over what just happened on that stage.
     It is not the morning. `werk-morning` is the morning — it is on screen
     under the subtitle "morning", one card later — and the two were written
     to the same premise, so a season played the same time of day twice and
     the cold open's own pool said "morning", "coffee" and "by lunch" over a
     room that had not been to bed. The four events that were genuinely
     about a working day rather than about a departure now live in
     `werk-morning` where they belong.
     NO COLD OPEN ON THE PREMIERE either way: on episode one nobody has
     left, there is no empty station and no message on the mirror. The
     entrances are the opening. */
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
  /* AND FROM BEING IN THE ROOM AT ALL. A queen the werk room keeps cutting to
     is on television more than one it does not, whatever the scene was about.
     Small per scene, because it is the accumulation that reads as a presence
     and any single cutaway is nothing. */
  const _tvScene = players_ => {
    for (const n of players_ || []) if (n) ctx.tvDelta?.(n, 0.4);
  };
  /** Apply an {bond, pop, state} event. The one place these three land. */
  const applyEventLike = e => {
    for (const [a, b, d] of e.bond || []) ctx.addBond(a, b, d);
    for (const [n, d] of Object.entries(e.pop || {})) ctx.popDelta(n, d);
    for (const [n, d] of Object.entries(e.tv || {})) ctx.tvDelta?.(n, d);
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
    blend: maxi.blend,
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
      data: {
        players: sc.players, note: sc.note, eligible: sc.eligible,
        /* THE FLAG THE CARD READS. Only a confessional carries it, so the
           renderer asks the scene rather than guessing from its name. `about`
           is who she is talking about and is NOT in `players`: she is alone
           in the shot and a second name there grows a second portrait. */
        ...(sc.confessional
          ? { confessional: true, about: sc.about || null, tier: sc.tier || null,
            reactsTo: sc.reactsTo || null }
          : {}),
      },
      text: sc.text || '',
    };
    if (sc.slot === 'werk-elim-day') elimDayScenes.push(scene);
    else scenes.push(scene);
    /* Being cut to is being on television, whatever the scene was about —
       EXCEPT a confessional. WHETHER one happens depends on whether anybody
       has written that tier yet, so paying `tv` for one would let the prose
       pool decide who the host leans on, and therefore who wins. A
       confessional still moves her POPULARITY, which is a record of how the
       audience feels and decides nothing on the stage. */
    if (!sc.confessional) _tvScene(sc.players);
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
        // What each queen's record is, so a read can be ABOUT something.
        record: state.record,
      });
      miniScores = res.scores;
      miniWinner = res.winner;
      mini = {
        id: m.id, name: m.name, winner: miniWinner, buys: m.buys,
        interaction: res.interaction, detail: res.detail,
        // Who reads when. The turn is the format for a targeting mini.
        turnOrder: res.turnOrder || null,
        /* THE ROUNDS OF A VOTE MINI ARE THE MINI. A `vote` mini has no
           per-queen performance to narrate — what happens is the host asking
           the room a question and the answer being read out — so the rounds
           carry the whole segment and the screen has nothing without them. */
        rounds: res.spill || null,
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
      miniEventScenes = renderMaxiEventScenes(res.events,
        { step: 'mini', rng, maxiName: mini?.name || maxi.name });
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
  /* ── THE NIGHT SHE HAD, FOLDED INTO WHAT SHE DID ────────────────────
     One draw per queen per episode: she was off tonight, or she was on. It
     exists because without it a weak queen could not win a maxi challenge AT
     ALL — measured at one queen in a thirteen-queen cast going 120 seasons
     without a single win. An upset has to be reachable.

     IT USED TO BE HANDED TO THE PANEL, as a term inside `judgeViews`, and it
     was in the wrong place twice over.

     It was the only input to that sum added RAW while every other one is
     scaled by the seat's taste weight first, so a +/-2.5 wobble competed
     against 0.4 x a challenge score. Measured across forty seasons it moved
     a queen MORE than the challenge did — 1.44 against the challenge's 1.00
     and the runway's 0.76 — which made a dice roll the largest single
     determinant of who won the week. That is why a queen could be shown a
     9.34 and be called LOW while a 7.14 won: the number beside her did not
     explain her placement because it largely did not cause it.

     And "she was off tonight" is a fact about HER PERFORMANCE, not an
     opinion four judges independently add to a performance that went fine.
     Folded in here it reaches everything at once — the panel, the chart, the
     card on the challenge screen, Rate-a-Queen's `truth` — so all of them
     read the same night and the number on screen is the number that decided
     it.

     ── THE SIZE IS DELIBERATELY UNCHANGED ──

     Divided by the panel's challenge weight on the way in, because `perf` is
     multiplied by that weight on the way out. The pull a form draw has on
     the result is therefore EXACTLY what it was: this moves where the
     randomness is visible, not how much there is.

     That matters because the randomness was doing a second job nobody had
     written down — suppressing how often the best queen wins. Cutting it
     (either by scaling it down here, or by weighting it in `judgeViews`)
     read as a tidier engine and pushed domination from 43% to 47%, away from
     the real show's 31% and into the number this project already tracks as
     too high. Keeping it whole and only moving it measured better on both:
     the score now explains 87% of placements against 71.6%, and domination
     came DOWN to 41%. */
  for (const n of Object.keys(performances)) {
    const off = noise(rng, PANEL_FORM / PANEL_CHALLENGE_WEIGHT);
    performances[n].perf = Math.round((performances[n].perf + off) * 100) / 100;
    performances[n].parts = { ...(performances[n].parts || {}), form: off };
  }
  const maxiEvents = M.events;
  for (const sc of M.scenes) scenes.push(sc.text ? sc : { ...sc, text: '' });

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
    /* AND WHO SHE IS, so the introduction can be about a person rather than a
       chair. `guestTaste` already reads her archetype for ARCH_BIAS; the beat
       that introduces her could not see it, so every guest arrived in the same
       four sentences whether she was a villain or a hero. */
    archetype: j.guest ? ((cfg.guest && cfg.guest.archetype) || null) : null,
    // Her taste, because the deliberation argues from the dimension two
    // judges are furthest apart on and cannot find that without the numbers.
    taste: j.taste,
  }));
  if (!M.tournamentExit) say('main-stage', 'main-stage', { judges: panel.map(j => j.id) });

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
  /* ── AND ON A DESIGN NIGHT THERE IS NO SECOND WALK ────────────────
     A Ball, a Design challenge and a Runway challenge all deliver a LOOK: the
     thing she presents on the main stage is the thing the challenge set her to
     make. Rolling `runwayScore` on top of the challenge scored that one look
     twice -- the design blend already carries `runway` craft -- and the second
     roll could disagree with the first, so a queen could win the challenge and
     be marked down on the walk that WAS the challenge.
     The challenge result is the walk here. The runway object keeps its shape
     because the panel and the chart read `runway[n].score`; what goes away is
     the independent dice, the host's separate category call, and the Runway
     section on the screen (`dr-runway` opens on the marker below). */
  /* NOT GUARDED ON `M.runwayOverride`, and the first version was: js/dr/chal/
     ball.js and js/dr/chal/design.js both set one, to describe the very walk
     being folded in here, so the guard switched the feature off for precisely
     the three challenges it was written for. The flag is authored per
     challenge; that is the whole decision. */
  const runwayIsChallenge = !!maxi.runwayIsChallenge;
  for (const n of living) {
    if (runwayIsChallenge) {
      const perf = performances[n] ? performances[n].perf : 0;
      runway[n] = { score: perf, fit: null, walks: [perf], isChallenge: true };
      continue;
    }
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
  if (!M.tournamentExit && !runwayIsChallenge) say('runway', 'runway', { category });

  // 12. The panel sees, and the host decides.
  const entries = living.map(n => ({
    name: n,
    style: dragOf(P(n)).style,
    perf: performances[n].perf,
    runway: runway[n].score,
    // Tells the panel that `runway` above is the challenge score, not a second
    // opinion of the night — see judgeViews.
    runwayIsChallenge,
    risk: performances[n].risk,
    polish: polishFor(P(n), rng),
    /* What the director told them about the day, on the challenges that have
       one. Undefined everywhere else, and `judgeViews` reads it as zero. */
    impression: performances[n].impression || 0,
    // Which seat formed it, so `judgeViews` can weigh her own eyes above
    // hearsay. Null on every challenge with nobody running the room.
    impressionFrom: mentorFor(maxi.id)?.id || null,
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

  /* ── THE NIGHT THE SHOW LOOKS RIGGED ──────────────────────────────
     `trackPull` below pushes a repeat winner DOWN: the host lifts the queen
     who needs a moment, and somebody who won last week does not need one.
     That brake is what holds the top queen's share of maxi wins near where it
     is, and it is right almost always.
     Almost. There is a specific night the real show gets accused of rigging,
     and it is not the host saving a favourite from the bottom -- it is the
     favourite taking a win the room can see somebody else earned. All of
     these have to be true at once, which is what makes it rare rather than a
     thumb permanently on the scale:
       - she is the season's invested favourite, by the room's own standard
       - she has a record to protect: two wins or more
       - the panel had her HIGH, not bottom. This is a lift, never a rescue
       - the queen the panel actually put first is nobody the show is
         invested in -- below-average star, no arc running. That is what
         makes it read as robbery rather than a close call
       - the audience has had time to form a view: past the halfway mark
       - and it has not happened yet this season
     When it fires the brake comes off and turns positive, still inside the
     host's existing two-place allowance. No new power: the same lean he
     always had, pointed the other way for one night.
     THE COST IS THE POINT. The robbed queen is adopted by the audience and
     the favourite is not forgiven for it -- see the popularity below. Star
     power drifts with the audience now (js/dr/state.js), so a Rigga Morris
     erodes the very standing that triggered it. That is the brake on the
     brake coming off, and without live star this mechanic would simply fire
     for the same queen every week. */
  const riggaTarget = (() => {
    if (state._riggaDone) return null;                    // once a season
    const total = cfg.totalEpisodes || 12;
    if (!(cfg.num > total / 2)) return null;              // past halfway
    if (!ranking.length) return null;
    const stars = living.map(n => (state.star || {})[n] || 0);
    const mean = stars.reduce((a, b) => a + b, 0) / (stars.length || 1);
    const fave = [...living].sort((a, b) =>
      ((state.star || {})[b] || 0) - ((state.star || {})[a] || 0))[0];
    if (!fave) return null;
    if (((state.star || {})[fave] || 0) <= mean) return null;
    if ((state.record[fave] || []).filter(r => r === 'WIN').length < 2) return null;
    const her = ranking.findIndex(r => r.name === fave);
    // Second or third on the board: close enough that two places reaches the
    // top, far enough that the room can see it.
    if (her < 1 || her > 2) return null;
    const first = ranking[0] && ranking[0].name;
    if (!first || first === fave) return null;
    if (((state.star || {})[first] || 0) >= mean) return null;
    /* NO ARC CHECK HERE, AND THERE WAS ONE. It required the panel's winner to
       have no storyline running, which sounds like "nobody the show is
       invested in" and is not: arcs are re-asked every week and nearly every
       queen has one, so the gate cut the candidate weeks from 48 to 1 across
       150 seasons and the mechanic fired 0% of the time over 500. Written,
       run, and shown to nobody -- §11.5 A, built fresh.
       Below-average star already says what that gate was reaching for. */
    return { fave, over: first };
  })();

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
      // The brake, off and reversed, for one queen on one night.
      + (riggaTarget && riggaTarget.fave === n
        ? Math.min(1, recentWins * 0.5)
        : -Math.min(1, recentWins * 0.5));
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

  /* ── AND IT ONLY HAPPENED IF THE BEND ACTUALLY TOOK THE WIN ───────
     The conditions above make a Rigga Morris POSSIBLE; the host still has to
     move her, and inside two places he often does not. Recorded from the
     result rather than from the intent, so the season never claims a robbery
     that did not occur -- and so the once-a-season cap is spent on a night
     the viewer can actually see. */
  let rigga = null;
  if (riggaTarget && !rated) {
    const won = bend.find(r => r.finalRank === 1);
    const robbedRow = bend.find(r => r.name === riggaTarget.over);
    if (won && won.name === riggaTarget.fave && robbedRow && robbedRow.panelRank === 1) {
      rigga = { queen: riggaTarget.fave, over: riggaTarget.over, episode: cfg.num };
      state._riggaDone = true;
      /* THE AUDIENCE IS NOT NEUTRAL ABOUT IT. The robbed queen is adopted --
         being visibly denied is the single best thing that can happen to a
         queen's standing with a room -- and the favourite is not forgiven.
         Popularity feeds star (js/dr/state.js), so this is also the feedback
         that stops the mechanic pointing at the same queen forever. */
      ctx.popDelta(riggaTarget.over, 5);
      ctx.popDelta(riggaTarget.fave, -3);
      /* AND IT IS SAID OUT LOUD. A bend nobody can see is just a number
         moving; the accusation IS the event. In-universe words only -- the
         fandom's name for this night is built on a real person's, which this
         universe does not do (see the note on `robbed` in js/dr/arcs.js). */
      say('main-stage', 'host-overrule', {
        players: [riggaTarget.fave, riggaTarget.over],
        winner: riggaTarget.fave, passed: riggaTarget.over,
      });
      scenes[scenes.length - 1].text = `The panel had ${riggaTarget.over} first. `
        + `The host gives it to ${riggaTarget.fave}. Nobody in the room says anything, `
        + `and that is what everyone notices.`;
    }
  }

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
    teamJudged: M.teamJudged,
    teams: assignment.teams,
    bestTeam: M.bestTeam,
    /* HOW BIG THE STAGE IS TONIGHT. The week's own stream, so the size of the
       top and the number marked LOW are drawn from the real show's spread
       rather than fixed at its mean -- and drawn reproducibly, because this
       stream is a function of the seed and the episode number. */
    rng,
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
  /* ── AND THE ROOM'S BOTTOM TWO ARE STILL CALLED ──
     The room ranked everybody, and a call that reads out one end of that
     ranking and silently drops the other is not the twist's result, it is
     half of it. The two the room put last are named, made to stand there,
     and then told they are not singing — which is `atRisk`/BTM, the call
     this show already has a word and a written pool for: "named in the
     bottom, and saved BEFORE the song".
     They are named on a Rate-a-Queen no-elimination night and NOT on a
     legacy night, where the winner of the song is about to choose somebody
     out of that same bottom and naming them first would announce the pool
     she picks from before she has picked. */
  const legacy = !!(cfg.legacy && bend.length >= 4);
  const topTwoSing = legacy || !!(cfg.rateAQueen && cfg.noElimination && bend.length >= 2);
  /* The call as the host made it, frozen before the song can change it.
     Null on every ordinary night, where the call never moves and the one
     object is the whole truth. See the note where it is filled. */
  let callAtCall = null;
  if (topTwoSing) {
    const top2 = bend.slice(0, 2).map(r => r.name);
    call.singers = top2;
    call.bottom = [];
    /* THE TOP TWO ARE THE CALL, AND NEITHER OF THEM HAS WON ANYTHING YET.
       They used to be in no group at all — `win` and `high` were emptied and
       the two of them appeared nowhere on the call — so the screen drew a
       night whose top two were invisible until the song produced one. They
       are HIGH here, both of them, which is true at this moment and stays
       true for the one who loses the song. */
    call.win = [];
    call.high = top2;
    call.low = [];
    const named = legacy ? [] : bend.slice(-2).map(r => r.name).filter(n => !top2.includes(n));
    call.atRisk = named;
    call.safe = bend.slice(2).map(r => r.name).filter(n => !named.includes(n));
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
      /* ── AND SAFE, WHEN THERE IS NOWHERE ELSE LEFT ──
         This pulled from `atRisk` or `low` and gave up when both were empty,
         which meant a booked double elimination could quietly take ONE queen:
         the bottom never widened past two, the head-to-head resolved as an
         ordinary shantay, and the season ran a week longer than the author
         asked for. Rare — it needs a night the panel had no low call on at
         all — and silent, because nothing reports a twist that half happened.
         An author who books a double elimination is owed two. The last of
         `safe` is the queen the room ranked worst among those not already
         named, which is who the panel would have reached for next. */
      const from = call.atRisk.length ? call.atRisk
        : call.low.length ? call.low
          : call.safe;
      if (!from.length) break;
      const pulled = from[from.length - 1];
      call.atRisk = call.atRisk.filter(n => n !== pulled);
      call.low = call.low.filter(n => n !== pulled);
      call.safe = (call.safe || []).filter(n => n !== pulled);
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

  if (!M.tournamentExit) {
    say('critiques', 'critiques', {
      call, split, tripled, critiques, twist: cfg.critiqueTwist || null,
      ...(cfg.rateAQueen ? { rateAQueen: true } : {}),
    });
  }

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

  if (!M.tournamentExit) {
    say('untucked', 'untucked', { safe: call.safe });
    say('results', 'results', { call });
  }

  // 15. The lip sync.
  const song = (cfg.songTitle && songById(cfg.songTitle)) || pick(rng, SONGS);
  let lipsync = null;
  const exits = [];

  // ── TOURNAMENT EXIT (LaLaPaRuZa) ───────────────────────────────────
  //
  // The tournament bracket already decided who goes home — the two queens
  // in sudden death were the BTM2 and the host's lean (track record)
  // already influenced each duel outcome. No separate lip sync is needed.
  if (M.tournamentExit) {
    const te = M.tournamentExit;
    if (te.eliminated && !cfg.noElimination) {
      exits.push(te.eliminated);
      state.lipsyncRecord[te.eliminated]?.push('L');
    }
    if (te.lastSurvivor) state.lipsyncRecord[te.lastSurvivor]?.push('W');
    // Build a synthetic lipsync record for the final duel so the exit
    // scene and the stage beats have something to render.
    const finalDuel = te.duels.find(d => d.round === 3 && d.loser === te.eliminated);
    if (finalDuel) {
      lipsync = {
        song: finalDuel.song, artist: finalDuel.artist || '',
        tempo: null, mood: null, hook: null,
        queens: [finalDuel.a, finalDuel.b],
        scores: finalDuel.adjusted,
        beats: {}, stunts: {},
        call: 'tournament', winner: finalDuel.winner, loser: finalDuel.loser,
        gap: Math.abs((finalDuel.adjusted[finalDuel.a] || 0) - (finalDuel.adjusted[finalDuel.b] || 0)),
        tournament: true,
      };
    }
  }

  /* WHO SINGS. The bottom two on an ordinary night, and on a night the top
     two sing it is them — set above, where `call.bottom` is left empty
     because nobody is in the bottom on a night nobody can lose. */
  const singers = call.singers || call.bottom;

  if (M.tournamentExit) {
    // Tournament already handled exits above — skip the standard lip sync.
  } else if (singers.length > 2) {
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
      call: out.length > 1 ? 'double-out' : 'triple',
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
    // track-record protection scaled by PPE. A queen with 1 WIN and
    // 2 BTM2s is not a front-runner; a queen with 2 WINs and all
    // SAFEs is. PPE captures that: WIN 5, HIGH 4, SAFE 3, LOW 2,
    // BTM/BTM2 1. Above 3.0 PPE the host leans to keep her; below
    // that the record offers no shelter. Measured: PPE 3.5+ queens
    // survive ~78% of their lip syncs.
    const _ppeW = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
    const bendOf = n => {
      const hostLean = (bend.find(x => x.name === n)?.bend || 0) * 0.5;
      const rec = state.record[n] || [];
      if (!rec.length) return hostLean;
      const ppe = rec.reduce((s, r) => s + (_ppeW[r] ?? 0), 0) / rec.length;
      const trackProtection = Math.max(0, (ppe - 3.0) * 6.0);
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
       goes on the chart as a week nobody won.

       ── AND THIS IS WHERE IT USED TO SPOIL ITSELF ──
       `call` is one object and the call screen holds it by reference, so
       this line reached BACKWARDS: the Call screen — drawn before the song,
       and the whole point of which is that nobody knows yet — printed
       "WIN" over the queen who was about to win the lip sync three screens
       later. The host announced the winner and then the winner was decided.
       It also deleted two queens: `call.safe` had already been computed
       against the old `high`, so overwriting `high` here left the queens the
       room ranked third and fourth in no group at all and they vanished off
       the call entirely.
       `callAtCall` is the call AS THE HOST MADE IT — the moment, frozen —
       and it is what the Call screen draws. `call` goes on being the night's
       final truth, which is what the chart and the record want. Two states
       because there genuinely are two: at the call the top two are both
       HIGH, and only the song separates them. */
    if (topTwoSing && lc.winner) {
      callAtCall = {
        ...call,
        win: [...call.win], high: [...call.high], low: [...call.low],
        atRisk: [...call.atRisk], bottom: [...call.bottom], safe: [...call.safe],
      };
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
    const r = M.tournamentExit
      ? (performances[n]?.detail?.place || 'SAFE')
      : exits.includes(n) ? 'ELIM'
        : call.win.includes(n) ? 'WIN'
          : call.high.includes(n) ? 'HIGH'
            : call.bottom.includes(n) ? 'BTM2'
              /* ── A QUEEN NAMED IN THE BOTTOM AND SAVED IS `LOW` ──
       This produced `BTM`, a seventh result, on the reasoning that being
       named in the bottom and being one of the two who lip sync are
       different facts. They are -- but the chart the fandom keeps has one
       word for the first of them and that word is LOW.

       Checked against the season 16 wikitext rather than argued: `{{LOW}}`
       is used eleven times, `{{BTM|tomato|2}}` ten times (that is BTM2), and
       a bare `{{BTM}}` exactly ONCE in the whole season. The legend block
       has no entry for BTM at all -- its lightpink line reads "The
       contestant was in the bottom, but was not up for elimination", which
       is the sentence this engine was using to define BTM.

       So the set is WIN / HIGH / SAFE / LOW / BTM2 / ELIM. The call still
       NAMES three on a bottom-three night and still saves one on the stage,
       because that is what happens; it is the chart that has one word for
       it. */
              : call.atRisk.includes(n) ? 'LOW'
                : call.low.includes(n) ? 'LOW' : 'SAFE';
    state.record[n].push(r);
    /* ── AND WHAT THE NIGHT WAS WORTH AS TELEVISION ──────────────────
       Screen presence, not affection. The story of an episode is the top and
       the bottom of it: a queen in the lip sync is the most watched person in
       the room whether or not anybody is rooting for her, and a queen who was
       safe was barely in the episode. That is the shape of the edit, and it is
       why "safe all season" is the one result nobody remembers.
       Credited from the RESULT so it exists on every season, including one
       whose confessional pools are still empty -- see js/dr/state.js. */
    ctx.tvDelta?.(n, ({
      WIN: 3, BTM2: 3, ELIM: 3, BTM: 2, HIGH: 1.5, LOW: 1.5, SAFE: 0.25,
    })[r] ?? 0.25);
    /* ── AND WHAT SHE IS, WHICH IS WHY SHE WAS CAST ──────────────────
       A villain is good television on a week she does nothing, and a
       producer knows it walking in. Credited from the archetype rather than
       from her confessionals, because WHETHER a confessional happens depends
       on whether anybody has written that tier yet -- routing watchability
       through prose would let the size of the pool decide who the host leans
       on. What she is does not change when somebody types.
       Small, every week, so it accumulates into a presence rather than
       deciding a night. */
    ctx.tvDelta?.(n, DRAMA_TV[P(n)?.archetype] ?? 0.5);
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
  if (!M.tournamentExit) try {
    const onStage = [...(call.win || []), ...(call.high || []),
      ...(call.low || []), ...(call.bottom || [])];
    const stageScenes = renderStageBeats({
      walking: living, onStage, runway, reactions, lipsync,
      /* THE CALL THE HOST MADE, WHICH ON A TOP-TWO NIGHT IS NOT THE ONE
         `call` NOW HOLDS. These beats are the host speaking at the call,
         before the song — so they get the frozen moment for the same
         reason the screen does, and for the same bug: `result-win` was
         being spoken over the queen who had not won yet. */
      call: callAtCall || call,
      // For the exit mood: whether she had ever been in the bottom before
      // tonight, and whether she had ever placed. See js/dr/exit-mood.js.
      record: state.record,
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
      // No separate walk beats on a night whose challenge IS the walk.
      runwayIsChallenge,
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
      miniRounds: mini?.rounds || null,
      assignment: M.assignment || {}, performances: perfWithPlayers, rng,
      // The module's own scenes, so a beat can read back what the challenge
      // recorded rather than recomputing it. See the note on the parameter.
      moduleScenes: M.scenes || [],
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
      maxiName: maxi.name,
      step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main', rng,
      // So the host's walkthrough note can be about this week's actual work.
      family: familyForChallenge(maxi.id).family,
    })) scenes.push(sc);

    /* ── WHAT HAPPENED ON THAT STAGE FOLLOWS THEM BACKSTAGE ──
       `namedOnStage` was passed as `[]`. Hardcoded, since the day the fact was
       written -- so `f.namedOnStage`, the fact its own comment calls "the most
       reliable fight the segment has", has never once been true.

       It is the who-should-go twist that fills it: every queen answers, out
       loud, in front of the queen she names. `namedBy` carries the answers
       themselves, so Untucked can be about WHO said it rather than only that
       somebody did -- a friend naming you and a rival naming you are not the
       same night, and three queens naming the same woman is a different one
       again. */
    const wsgVotes = (twist && cfg.critiqueTwist === 'who-should-go' && twist.votes)
      ? twist.votes : null;
    const namedBy = {};
    if (wsgVotes) {
      for (const [voter, target] of Object.entries(wsgVotes)) {
        if (!target || voter === target) continue;
        (namedBy[target] ||= []).push(voter);
      }
    }
    const untuckedScenes = runUntucked({
      living, players: ctx.players, state, storylines: state.storylines || [],
      call, namedOnStage: Object.keys(namedBy), namedBy,
      selfNamed: wsgVotes
        ? Object.entries(wsgVotes).filter(([v, t]) => v === t).map(([v]) => v) : [],
      rng, ctx: { bond: ctx.bond, episode: cfg.num },
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
  } else if (exits.length) try {
    /* ── A TOURNAMENT NIGHT STILL SAYS GOODBYE ────────────────────────
       The branch above is skipped whole on a bracket night, which is right
       for the critiques and the lip sync -- a Lalaparuza has neither -- and
       wrong for the ritual at the bottom of it. The queen the bracket sent
       home left with no farewell, no mirror message and no closing line, so
       the Sashay Away screen drew her portrait and her stamp over nothing.
       Its subtitle says "the mirror message" and there was never one to show.

       Measured on the audit's twelve seasons: two elimination nights out of
       roughly two hundred, both of them tournaments, which is why reading a
       season found it and no test did.

       The lip sync beats stay behind deliberately, `sashay-words` among them
       -- those are a queen answering the host after a song, and on this night
       there was no song. What she gets here is the ritual every exit gets. */
    for (const sc of renderStageBeats({
      exitOnly: true, exits: exits.slice(), players, rng,
      firstOfSeason: exits.length > 0 && (state.out || []).length === exits.length,
    })) scenes.push(sc);
  } catch (err) {
    scenes.push({
      step: 'exit', kind: 'stage:error', data: { error: String(err && err.message) }, text: '',
    });
  }

  const stepIndex = st => {
    const i = SCENE_STEPS.indexOf(st);
    return i === -1 ? SCENE_STEPS.length : i;
  };
  scenes.sort((a, b) => stepIndex(a.step) - stepIndex(b.step));

  /* ── AND THE REST OF THE NIGHT GETS A CAMERA TOO ────────────────────
     The werk room grew confessionals first and for a while had all of them:
     measured over thirty seasons, four of the episode's twenty-four steps
     carried three hundred and the other twenty carried none. The lounge, the
     runway, the song and the draft are where this show's confessionals
     actually live, and they had nothing.
     Here rather than at each producer, and AFTER the sort, for two reasons:
     one rule in one place for five surfaces, and a confessional has to land
     immediately beneath the scene it answers — anything appended before the
     sort is filed by step and loses its neighbour.
     `maxi-main` is deliberately absent. The performance itself is the thing
     being watched; cutting away from it to somebody's opinion of it is the
     one place a confessional would interrupt rather than punctuate. */
  const confessSpoken = new Set();
  for (const step of ['untucked', 'choice', 'maxi-pre', 'runway', 'lipsync']) {
    const list = scenes.filter(sc => sc.step === step);
    if (list.length < 2) continue;
    const rows = confessionalsFor({
      // `data.players`, because by this point a scene is the episode's shape
      // rather than the werk room's. `heatOf` and the surfaces both read
      // `effects`/`data`, so the adapter is this one map and nothing else.
      scenes: list.map(sc => ({
        id: sc.kind, slot: step, players: sc.data?.players || [],
        effects: sc.effects || untuckedEffects(sc), data: sc.data,
      })),
      room: living, players, spoken: confessSpoken, slot: step, step,
      // So a confessional never mentions a garment on an acting week.
      blend: maxi.blend || null,
      bond: ctx.bond, max: step === 'untucked' ? 2 : 1, chance: 0.3,
      rng: streamFor((cfg.num || 0) + 1, `confessional|${step}`),
    });
    for (const r of rows.slice().reverse()) {
      const c = r.scene;
      for (const [, delta] of Object.entries(c.effects?.pop || {})) {
        ctx.popDelta(c.players[0], delta);
      }
      const at = scenes.indexOf(list[r.index]);
      if (at < 0) continue;
      scenes.splice(at + 1, 0, {
        step, kind: `confess:${c.id}`,
        data: {
          players: c.players, note: c.note, confessional: true,
          about: c.about || null, tier: c.tier, reactsTo: c.reactsTo,
        },
        text: c.text || '',
      });
    }
  }

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
      /* WHO SHE IS TRAVELS WITH HER. This carried name, slug and credit, so
         the ENGINE knew her archetype — `guestTaste` reads it for ARCH_BIAS —
         and every reader downstream of the row did not: the screens, the
         export and any guard could see a guest judge and not what kind of
         person she was. `stats` deliberately stays off: it is the biggest
         field on a roster row, the taste derived from it is already on
         `panelSeats`, and a season document is not the place to copy a
         character sheet per episode. */
      guest: cfg.guest
        ? {
          name: cfg.guest.name,
          slug: cfg.guest.slug || slugOf(cfg.guest.name),
          credit: guestCredit,
          archetype: cfg.guest.archetype || null,
          fameStars: cfg.guest.fameStars ?? null,
        }
        : null,
      assignment,
      performances,
      runway,
      panel: { views, ranking, split },
      // Null on every ordinary night, which is how a reader tells them apart.
      rigga,
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
      /* WHAT THE HOST SAID, BEFORE THE SONG ANSWERED IT. Only a top-two
         night has one; every other week the call is made once and never
         moves, so `call` is the answer and this is null. */
      ...(callAtCall ? { callAtCall } : {}),
      reactions,
      lipsync,
      ...(M.tournamentExit ? { tournament: M.tournamentExit } : {}),
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
      /* ── AND THE ROOM AS IT WAS AT THE TOP OF THE NIGHT ──
         `living` above is the roster at the END of the week, which is the
         right thing for a chart and the wrong thing for a screen: every VP
         reader that printed a count printed it with tonight's eliminated
         queen already gone. `row.houseAtStart` has always carried this, but
         the VP layer is handed `ep.dr` and never the row, so it could not
         reach it — see `_hud` in js/vp-dr/style.js. */
      roomAtStart: [...living],
      scenes,
    },
  };
  state.episodes.push(row);
  void popDelta;   // Plan 2 writes the ledger from challenge events.
  return row;
}
