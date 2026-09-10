// ══════════════════════════════════════════════════════════════════════
// dr/stage.js — turning a result into the beats that show it
// ══════════════════════════════════════════════════════════════════════
//
// The data files say what CAN be shown; this decides what IS. Two jobs, and
// they are different shapes on purpose:
//
//   renderStageBeats  the main stage. Nothing is drawn — every queen walks,
//                     everybody on stage is critiqued, somebody wins. What
//                     varies is which TIER of line each beat uses, and the
//                     tier comes from what actually happened.
//   runUntucked       backstage. A pool, drawn like the werk room, because
//                     most of what could happen backstage does not.
//
// TIERS ARE RANKED, NOT THRESHOLDED, wherever the underlying number is a
// score. A runway score is a float with noise in it and its scale shifts as
// the cast shrinks; a fixed cut at "8.5 is stunning" would call half a strong
// night stunning and none of a weak one. Ranking against the queens who walked
// that night is both stabler and truer — a look is stunning relative to the
// room it walked into.
import { STAGE_BEATS } from './data/stage-beats.js';
import { UNTUCKED_EVENTS, UNTUCKED_PHASES } from './data/untucked-events.js';
import { CHALLENGE_BEATS } from './data/challenge-beats.js';
import { mentorForBeat } from './data/judges.js';
import { MAXI_EVENTS } from './data/maxi-events.js';
import { performanceFor, familyForChallenge } from './data/maxi-performance.js';
import { briefLinesFor, reactionLinesFor } from './data/brief-voices.js';
import { miniLinesFor, miniNamesOther } from './data/mini-voices.js';
import { tempoLinesFor, hookLinesFor } from './data/lipsync-voices.js';
import {
  pickKindFor, pickLinesFor, walkthroughLinesFor,
  helpLinesFor, sabotageLinesFor, shunnedLinesFor,
} from './data/maxi-voices.js';
import { characterById } from './data/snatch-characters.js';
import {
  reasonLinesFor, biasLinesFor, deliveryLinesFor,
} from './data/critique-voices.js';
import { resultOrder } from './data/results-order.js';
import {
  divergentTastes, advocacyLinesFor, hostCallLinesFor,
} from './data/deliberation-voices.js';
import { dragOf } from './queen.js';
import {
  themeFamilyFor, fitTierFor, themeLinesFor, voiceLinesFor,
  swaggerGroupFor, swaggerLinesFor,
} from './data/runway-voices.js';
import { canScheme } from './rules.js';
import { familyFacts } from './family.js';

/** Where the cuts fall, as a fraction of the queens who walked. */
const RUNWAY_TIERS = [
  [0.15, 'stunning'], [0.40, 'strong'], [0.75, 'fine'], [0.92, 'weak'], [1.01, 'disaster'],
];
/* ── HOW WELL SHE DID, NOT WHERE SHE CAME ──
   These used to be read with `fractionalRank`, and a head-to-head has exactly
   two queens: the ranks are 0 and 1, every time, so the winner was ALWAYS
   'legendary' and the loser was ALWAYS 'lost' whatever the scores said. A gap
   of 0.05 was narrated identically to a gap of six. Read off a played season,
   two queens 0.4 apart:

     "Caleb paces it perfectly... the arc of the song itself."
     "The song goes somewhere and Axel does not go with it."

   And the two middle pools could never fire on an ordinary night at all —
   'strong' and 'trying' were reachable only in a three-way.

   Absolute now, cut against the real distribution of `lipsyncScore` (p10 2.7,
   median 4.9, p90 7.2 on a flat-craft cast): most nights are two queens doing
   fine, one night in twelve is somebody genuinely detonating, and a queen who
   is beaten by a better performance is no longer described as having fallen
   apart. THE HOOK STAYS RELATIVE — see its own note below: a key change has
   one owner and there is no middle at it. */
const LIPSYNC_TIERS = [[7.5, 'legendary'], [5.5, 'strong'], [3.5, 'trying'], [-99, 'lost']];
const tierByScore = (v, table) =>
  (table.find(([cut]) => (Number(v) || 0) >= cut) || table[table.length - 1])[1];
const PERF_TIERS = [
  [0.12, 'extraordinary'], [0.38, 'strong'], [0.72, 'competent'],
  [0.90, 'struggling'], [1.01, 'collapse'],
];
const MINI_TIERS = [[0.30, 'nailed'], [0.70, 'decent'], [1.01, 'flat']];
const APTITUDE_TIERS = [[0.30, 'delighted'], [0.70, 'braced'], [1.01, 'dreading']];
/** How many queens get an out-loud reaction to the brief. Not the whole room. */
const REACTING = 3;

/**
 * A line, avoiding one already used tonight.
 *
 * WITHOUT REPLACEMENT, and reading a dumped season is what forced it. A mini
 * challenge is one beat per queen — thirteen of them — drawn from a tier of
 * four variants, so picking independently per queen guaranteed collisions.
 * The dump had "The mini hits and {a} hits harder" printed twice, verbatim,
 * for two queens in the same episode.
 *
 * `used` is per render pass, so a line is free again next episode. When a tier
 * genuinely runs out — four variants across five queens at the same tier — it
 * falls back to any line rather than printing nothing, because a repeat is
 * better than a blank.
 */
const pick = (lines, rng, used = null, key = '') => {
  if (!lines || !lines.length) return null;
  if (!used) return lines[Math.floor(rng() * lines.length)];
  const fresh = lines.filter(l => !used.has(key + '\u0000' + l));
  const pool = fresh.length ? fresh : lines;
  const chosen = pool[Math.floor(rng() * pool.length)];
  used.add(key + '\u0000' + chosen);
  return chosen;
};

/* ── EVERY PLACEHOLDER THIS FILE KNOWS ──
   Destructured, so a key the caller passes and this list does not name is
   silently dropped and its `{x}` ships to the screen verbatim. That happened
   the day `{m}` was added: the mentor's name was handed in correctly, the
   portrait resolved correctly, and every line would have printed "and {m}".
   tests/dr-placeholders.test.js is the guard — it renders real seasons and
   fails on any `{x}` that survives into a scene. */
const fill = (line, { a, b, j, s, c, k, d, e, p, o, y, m } = {}) => (line || '')
  .replace(/\{m\}/g, m || '')
  .replace(/\{a\}/g, a || '')
  .replace(/\{b\}/g, b || '')
  .replace(/\{j\}/g, j || '')
  .replace(/\{s\}/g, s || '')
  .replace(/\{c\}/g, c || '')
  .replace(/\{k\}/g, k || '')
  .replace(/\{d\}/g, d || '')
  .replace(/\{e\}/g, e || '')
  .replace(/\{p\}/g, p || '')
  .replace(/\{o\}/g, o || '')
  .replace(/\{y\}/g, y || '');

/**
 * What she picked, as words.
 *
 * The same resolution the challenge screen does: Snatch Game's pool has
 * authored names, everything else is a slug. A leftover carries a
 * `leftover-` prefix that is bookkeeping rather than a thing, so it is
 * stripped — "she is left with Leftover 3" is the engine talking.
 */
function choiceLabel(id) {
  const raw = String(id || '');
  if (!raw) return 'what was left';
  // A LEFTOVER IS NOT A NAME. The draft resolver marks unclaimed roles
  // `leftover-3`, which is bookkeeping: stripping the prefix prints "she is
  // left with 3" and keeping it prints "Leftover 3". Both are the engine
  // talking, so it resolves to a phrase — the tier is already called
  // `left-over` and the line around it knows it is describing scraps.
  if (/^leftover-/.test(raw)) return 'what nobody else wanted';
  return characterById(raw)?.name
    || raw.replace(/-/g, ' ').replace(/\b[a-z]/g, ch => ch.toUpperCase());
}

/** Rank in [0,1], 0 being best. */
function fractionalRank(name, scores) {
  const order = Object.entries(scores).sort((x, y) => y[1] - x[1]).map(e => e[0]);
  const i = order.indexOf(name);
  return order.length > 1 ? i / (order.length - 1) : 0;
}

const tierAt = (frac, table) => (table.find(([cut]) => frac <= cut) || table[table.length - 1])[1];

/**
 * Every beat of the main stage, in one pass.
 *
 * Returns scenes carrying their own `step`, so the week can push them and let
 * its own ordering put them where they belong.
 */
/** How many judges actually speak to each queen. Not all of them, every time. */
const JUDGES_PER_QUEEN = 2;

export function renderStageBeats({
  walking = [], onStage = [], runway = {}, call = {}, reactions = {},
  lipsync = null, exits = [], split = false, judges = [], critiques = [],
  firstOfSeason = false, formatNote = null,
  /* WHAT THE OPENING AND THE RUNWAY NEED, none of which used to arrive here.
     `category` is tonight's prompt, and without it the host could not say
     what anybody was walking in; `panelSeats` is the panel as objects rather
     than the flat list of names in `judges`, because introducing a judge
     needs to know WHICH judge and whether she is a guest; `players` is the
     roster records, because a queen narrating her own walk needs her drag
     style and her archetype and the runway result carries neither. */
  category = '', runwayKind = 'call', panelSeats = [], players = {},
  /* WHAT THE SONG IS FOR, and whether the panel is even speaking tonight.
     The same two queens on the same stage means something completely
     different on a night nobody can lose. */
  stakes = 'life', rateAQueen = false,
  /* THE DELIBERATION'S OWN MATERIAL, all of it already computed and none of
     it previously offered to a renderer. `views` is each judge's private
     ranking, `ranking` carries the per-queen spread between them, and `bend`
     is where the host overruled the board. The whole report on the three of
     them was one narrator line a night. */
  views = {}, ranking = [], bend = [],
  // Which shape the host runs the call in tonight. See results-order.js.
  callOrder = 'standard',
  // The challenge family, so a critique about what she DID can be about what
  // she did tonight rather than about challenges in general.
  challengeFamily = 'generic',
  rng = Math.random,
}) {
  // The song is named in the lip sync speech, so it has to reach `fill`. A
  // placeholder the renderer does not substitute prints as literal braces on
  // the screen, which is the whole reason this is threaded rather than left in
  // the scene's `data` where only a later reader would see it.
  const songTitle = lipsync?.song || '';
  const scenes = [];
  const usedLines = new Set();
  const beatById = id => STAGE_BEATS.find(b => b.id === id);
  /* HOW MANY LINES A SPECIFIC TIER ACTUALLY HAS, which is the question
     "is this pool written yet?" — asked by every beat that supersedes an
     older one, so a half-filled file never leaves the screen with neither
     version of a verdict on it. `tiers[0].lines.length` is the wrong
     question for a multi-tier beat: it answers for one tier and is read as
     though it answered for the beat. */
  const tierLines = (id, tierId) =>
    (beatById(id)?.tiers.find(t => t.id === tierId)?.lines || []).length;
  const runwayScores = Object.fromEntries(
    walking.filter(n => runway[n]).map(n => [n, runway[n].score]));

  const emit = (beat, tierId, who, extra = {}, said = {}) => {
    if (!beat) return;
    const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
    if (!t) return;
    /* AN UNWRITTEN TIER EMITS NOTHING. Every beat file's header promises
       this — "an unwritten tier emits no scene rather than an empty card" —
       and it was not true: a tier with no lines still pushed a scene whose
       text was the empty string, which draws a card with a portrait, a
       border and no words in it. Measured on a new beat whose pool was
       deliberately empty: eight of eight nights emitted a blank plate.
       This is what makes filling a pool a beat at a time actually safe. */
    if (!t.lines || !t.lines.length) return;
    /* A NAMED JUDGE BEATS A DRAWN ONE. Every judge beat before this drew a
       seat at random, which is right for "one of them says the deliberation
       is split" and wrong for the beat that introduces a specific judge by
       name. `said.j` is that judge; the random draw is the fallback. */
    const j = said.j || (beat.speaker === 'judge' && judges.length
      ? judges[Math.floor(rng() * judges.length)] : null);
    scenes.push({
      step: beat.step,
      kind: `stage:${beat.id}`,
      data: { beat: beat.id, tier: t.id, players: who, note: t.note, judge: j, ...extra },
      text: fill(pick(t.lines, rng, usedLines, `${beat.id}/${t.id}`),
        { a: who[0], b: who[1], j, s: songTitle, c: category, k: said.k || '' }),
    });
  };

  const callOf = n => (call.win || []).includes(n) ? 'WIN'
    : (call.high || []).includes(n) ? 'HIGH'
      : (call.bottom || []).includes(n) ? 'BTM2'
        : (call.atRisk || []).includes(n) ? 'BTM'
          : (call.low || []).includes(n) ? 'LOW' : 'SAFE';

  // ── the stage opens ──
  emit(beatById('entrance'), 'open', []);

  /* ── AND THE PANEL IS INTRODUCED, ONE SEAT AT A TIME ──
     The panel used to arrive as a row of portraits with a caption under each
     one. Four people whose authored tastes are about to disagree in public,
     and not one of them was spoken to before they started judging.

     RUPAUL IS SKIPPED because he is the one doing the introducing, and a
     guest is tiered on whether a credit came with her rather than on who she
     is — a franchise alumnus has no authored judging voice to write to, only
     a name and, if the season pinned one, a line about what she won. */
  const introBeat = beatById('panel-intro');
  for (const seat of panelSeats) {
    if (!seat || seat.id === 'rupaul') continue;
    /* ── A GUEST IS INTRODUCED AS A PERSON ──
       This was `credit ? 'guest-credited' : 'guest'`, so every guest arrived
       in the same four sentences — a villain, a hero and a goat all "waves
       from the guest seat". Her archetype is on the seat now, grouped the way
       the runway voices and the sashay words already group it, so the host
       introduces somebody the audience has opinions about.
       FALLING BACK RATHER THAN SKIPPING: an unwritten archetype pool must not
       silently drop the introduction, which is what `continue` did to any tier
       that did not exist. Credited first because the credit is the thing worth
       saying if nothing else is written yet. */
    let tierId = seat.id;
    if (seat.guest) {
      const group = seat.archetype ? swaggerGroupFor(seat.archetype) : null;
      const wanted = [
        group && `guest-${group}`,
        seat.credit ? 'guest-credited' : null,
        'guest',
      ].filter(Boolean);
      tierId = wanted.find(id => introBeat.tiers.some(x => x.id === id && x.lines.length))
        || wanted[wanted.length - 1];
    }
    if (!introBeat.tiers.some(t => t.id === tierId)) continue;
    emit(introBeat, tierId, [], { judgeId: seat.id, guest: !!seat.guest },
      { j: seat.name || seat.id, k: seat.credit || '' });
  }

  /* ── AND ONLY NOW, WHAT THEY ARE WALKING IN ──
     The category reached this function for the first time with this beat.
     Before it, one hardcoded line in the pool said "eleganza" and every other
     opening declined to name the prompt at all, so the viewer met the
     category on the runway screen — after it had already been walked in. */
  emit(beatById('category-call'), runwayKind, [], { category });
  /* AND THE FORMAT, WHEN IT IS NOT THE ORDINARY ONE. A split premiere put
     half the cast on screen and never said why the other half were missing;
     a no-elimination night ran a full lip sync and sent nobody home. The
     engine knew both and no line in the episode carried either, so the viewer
     was left to infer a format from an absence. */
  if (formatNote) emit(beatById('format-note'), formatNote, []);

  /* ── ONE WALK PER QUEEN, IN HER OWN VOICE ──
     The narrator used to do all of these and had one register for thirteen
     women: a fashion queen who lives on proportion, a camp queen who built
     the joke on purpose and a pageant queen who has done this since she was
     nineteen all got the same sentence with a different name in it, and the
     only thing that varied was how good the look was. The show does not do
     that — it runs HER voiceover over her own walk.

     THREE CLAUSES FROM THREE POOLS, joined here (js/dr/data/runway-voices.js
     has the full argument for why they are separate):

       theme    what she brought for THIS category, and whether the prompt is
                her wheelhouse or a fight — the fit `runwayScore` measured.
       voice    how it read on the walk, in her craft's own language.
       swagger  what a woman like her thinks about that result.

     ALL OR NOTHING ON THE REGISTER, and that is the only subtle rule here.
     The voice pool ships empty and is filled one style at a time, so for most
     of this file's life some styles speak and some do not. A queen whose
     style has no voice lines yet keeps the third-person narrator walk exactly
     as before — she does NOT get a first-person theme line glued to a
     third-person narration, which reads like two people describing the same
     dress. Filling a style's five voice tiers is what switches that style
     over, and it switches over completely. */
  const walkBeat = beatById('walk');
  const fitBeat = beatById('walk-fit');
  for (const n of walking) {
    if (!runway[n]) continue;
    const r = runway[n];
    const tierId = tierAt(fractionalRank(n, runwayScores), RUNWAY_TIERS);
    const p = players[n] || null;
    const style = dragOf(p).style;
    const group = swaggerGroupFor(p && p.archetype);
    const family = themeFamilyFor(r.category || category);
    const fitId = fitTierFor(style, r.category || category);
    const craft = voiceLinesFor(style, tierId);

    if (craft) {
      const themed = themeLinesFor(family, fitId);
      const nerve = swaggerLinesFor(group, tierId);
      const say = (lines, key) => (lines
        ? fill(pick(lines, rng, usedLines, key), { a: n, c: r.category || category })
        : '');
      const text = [
        say(themed, `theme/${family}/${fitId}`),
        say(craft, `voice/${style}/${tierId}`),
        say(nerve, `swagger/${group}/${tierId}`),
      ].filter(Boolean).join(' ');
      scenes.push({
        step: walkBeat.step,
        kind: 'stage:walk',
        data: {
          beat: 'walk', tier: tierId, players: [n], note: walkBeat.tiers
            .find(t => t.id === tierId)?.note || '',
          score: r.score, voiced: true, style, swagger: group, family, fit: fitId,
        },
        text,
      });
    } else {
      emit(walkBeat, tierId, [n], { score: r.score, voiced: false, style, fit: fitId });
    }

    /* WHETHER THE LOOK ANSWERED THE CATEGORY, WHICH HAS NEVER ONCE BEEN SAID.
       `fit` arrives from `runwayScore` as 1, 0.5 or 0 and this compared it
       against `true` and `false`, so neither branch could ever be taken and
       both tiers of a written beat were dead prose. The middle value is still
       skipped on purpose: a prompt that names no styles asks everybody the
       same question, so there is nothing to say about the category. */
    if (fitId === 'home') emit(fitBeat, 'on-theme', [n]);
    else if (fitId === 'against') emit(fitBeat, 'off-theme', [n]);
  }

  // ── the critiques, FROM THE PANEL'S OWN VIEWS ──
  //
  // Driven by `critiqueLines` rather than by the call, which is the whole
  // point of that function existing: the tone is this judge's opinion against
  // her own median, so two judges can say opposite things about one
  // performance and the split is visible on the screen.
  //
  // Not every judge speaks to every queen — that would be a wall of text and
  // is not what the stage does — so each queen gets the two judges with the
  // strongest opinions about her, which is also who the edit would use.
  const critBeat = beatById('critique');
  const reactBeat = beatById('critique-reaction');
  /* ── EVERYTHING FROM HERE TO THE RESULTS IS THE PANEL TALKING ──
     The judges' critiques, the queens' reactions to them, the deliberation
     and the host's overrule. On a Rate-a-Queen night none of it happens: the
     panel has handed the call to the room, so it says nothing between the
     runway and the results, and the host announces that instead.
     The guard has to open HERE rather than at the deliberation. Opened lower
     down it left the critiques themselves firing, so the twist that is
     supposed to silence the panel produced ten lines of panel. */
  if (!rateAQueen) {
  for (const n of onStage) {
    // THE STRONGEST OPINION, PLUS ONE OTHER AT RANDOM. Taking the top two by
    // conviction seemed obvious and was wrong: it selects the extremes by
    // construction, so a "mixed" critique — the small-gap one — could almost
    // never be chosen. Measured over 300 critiqued queens it produced 213
    // praise, 317 pan and only 70 mixed. The edit does lead with the judge
    // who has the most to say; the second voice is just another judge.
    const all = critiques.filter(c => c.queen === n);
    const ranked = [...all].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    const hers = ranked.slice(0, 1);
    const rest = ranked.slice(1);
    if (rest.length && JUDGES_PER_QUEEN > 1) hers.push(rest[Math.floor(rng() * rest.length)]);
    if (hers.length) {
      for (const c of hers) {
        const t = critBeat.tiers.find(x => x.id === c.tone) || critBeat.tiers[1];
        /* ── THE REASON, IN THE VOICE OF WHOEVER IS GIVING IT ──
           The generic tier is three paragraphs keyed on tone alone, so the
           same words covered a collapsed challenge and a hemline and named
           neither. `c.reason` is measured — the term that actually moved
           this judge on this queen, which way it moved her, where the queen
           really placed on it tonight, and the judge's own words for what
           she is looking for. Written, it says something only this judge
           would say about only this performance. */
        const r = c.reason || {};
        // WHICH NIGHT IT WAS. Without this the `challenge` dimension had one
        // pool for the whole season and Michelle could not say she does not
        // see the family resemblance, because no critique knew it was a
        // makeover.
        const said = reasonLinesFor(r.dimension, r.direction, challengeFamily);
        /* ONE EXTRA CLAUSE AT MOST, and the delivery outranks the bias.
           A reason plus a bias plus a note on how she said it is three
           clauses about one queen, and the transcript already had a card run
           past two thousand characters. Which she gets: how hard this judge
           speaks is a fact about the person talking and fires only at the
           ends of the panel, so when it is there it is the more interesting
           of the two; her taste for this kind of drag fills the slot the rest
           of the time. */
        const delivery = said ? deliveryLinesFor(r.warmth, r.direction) : null;
        const bias = said && !delivery ? biasLinesFor(r.styleLean) : null;
        const text = said
          ? [
            fill(pick(said, rng, usedLines, `reason/${r.dimension}/${r.direction}`),
              { a: n, j: c.judgeName, p: r.peeve, o: r.softSpot, y: r.style }),
            delivery ? fill(pick(delivery, rng, usedLines,
              `delivery/${r.warmth <= 0.25 ? 'blunt' : 'kind'}/${r.direction}`),
            { a: n, j: c.judgeName, p: r.peeve, o: r.softSpot }) : '',
            bias ? fill(pick(bias, rng, usedLines, `bias/${r.styleLean > 0 ? 'for' : 'against'}`),
              { a: n, j: c.judgeName, y: r.style }) : '',
          ].filter(Boolean).join(' ')
          : fill(pick(t.lines, rng, usedLines, `critique/${c.tone}`),
            { a: n, j: c.judgeName, s: songTitle });
        scenes.push({
          step: 'critiques',
          kind: 'stage:critique',
          data: {
            beat: 'critique', tier: c.tone, players: [n], note: t.note,
            judge: c.judgeName, reasons: c.reasons, gap: c.gap,
            reason: c.reason || null, voiced: !!said, family: challengeFamily,
          },
          text,
        });
      }
    } else {
      // No panel view to read — a week run in isolation by a test. Fall back
      // to the call so the stage is never silent.
      emit(critBeat, callOf(n) === 'WIN' || callOf(n) === 'HIGH' ? 'praise'
        : callOf(n) === 'BTM2' || callOf(n) === 'BTM' ? 'pan' : 'mixed', [n]);
    }
    if (reactions[n]) emit(reactBeat, reactions[n], [n]);
  }
  /* ── THE DELIBERATION, WITH THE NAMES ON THE TABLE ──
     The queens are in the back and the panel says what it actually thinks.
     This was one line: "one judge argues for the look, another argues for the
     performance" — which names no judge, no queen and no look, and is a
     description of an argument rather than the argument.
     WHO ARGUES IS NOT ASSIGNED, IT IS MEASURED. For each queen the panel is
     furthest apart on, the judge who ranked her highest speaks for her and
     the judge who ranked her lowest speaks against, and each argues from her
     own dominant taste — so Law defends a garment and Ross defends a
     performance because that is what those two are actually watching. The
     pairing falls out of the numbers rather than being written. */
  const seatOf = id => panelSeats.find(x => x.id === id) || null;
  const nameOf = id => (seatOf(id)?.name) || id;
  const rankOf = (id, n) => (views[id] || []).find(r => r.name === n)?.rank ?? null;

  // The queens worth arguing about: most disagreed-on first, and only where
  // there is a real disagreement. A panel that agrees has no scene here, which
  // is correct — `deliberation/agreed` above has already said so.
  const contested = [...ranking]
    .filter(r => (r.spread || 0) >= 2 && onStage.includes(r.name))
    .sort((x, y) => (y.spread || 0) - (x.spread || 0))
    .slice(0, 3);

  /* THE OPENING LINE HAS TO AGREE WITH WHAT FOLLOWS IT. This read
     `isSplitPanel(ranking)`, which is a different question — it asks whether
     the panel disagrees at the ENDS of the board, where it changes who goes
     home. A night could be "agreed" by that measure and still have a queen
     the panel is three ranks apart on, and the scene then printed "there is
     nothing to argue about" immediately before two judges argued about her.
     So the opening is chosen by whether this scene actually has an argument
     in it. `split` still drives the host's bend, which is what it is for. */
  /* ON A RATE-A-QUEEN NIGHT THERE IS NOTHING TO DELIBERATE. The panel has
     handed the call to the room, so the judges do not argue, do not critique
     and do not appear here at all — the host announces the shape of the night
     instead and the queens go and rank each other. Returning early is the
     point: everything below this is the panel talking. */
  emit(beatById('deliberation'), contested.length ? 'split' : 'agreed', []);
  for (const row of contested) {
    const ids = Object.keys(views).filter(id => rankOf(id, row.name) !== null);
    if (ids.length < 2) continue;
    const sorted = [...ids].sort((x, y) => rankOf(x, row.name) - rankOf(y, row.name));
    const forId = sorted[0];
    const againstId = sorted[sorted.length - 1];
    // What they are actually fighting over, rather than what each of them
    // happens to weight most — see divergentTastes for why those differ.
    const { forTaste, againstTaste } = divergentTastes(seatOf(forId), seatOf(againstId));

    for (const [id, stance, otherId, tasteId] of [
      [forId, 'champion', againstId, forTaste],
      [againstId, 'dismiss', forId, againstTaste],
    ]) {
      const lines = advocacyLinesFor(tasteId, stance);
      if (!lines) continue;
      scenes.push({
        step: 'critiques',
        kind: 'stage:deliberation-argument',
        data: {
          beat: 'deliberation-argument', tier: stance, players: [row.name],
          note: 'One judge argues for or against a queen, from what she watches.',
          judge: nameOf(id), taste: tasteId, spread: row.spread,
        },
        text: fill(pick(lines, rng, usedLines, `advocacy/${tasteId}/${stance}`),
          { a: row.name, j: nameOf(id), e: nameOf(otherId) }),
      });
    }
  }

  /* AND THE HOST'S CALL, which has been recorded on every row since the
     judging engine was written and shown only as a badge on the results
     screen — never spoken, and never in the room where it is made. */
  const moved = bend.filter(b => b.panelRank !== b.finalRank && onStage.includes(b.name));
  const biggest = moved.sort((x, y) =>
    Math.abs(y.panelRank - y.finalRank) - Math.abs(x.panelRank - x.finalRank))[0];
  const outcome = !biggest ? 'stood-by'
    : (biggest.finalRank < biggest.panelRank ? 'lifted' : 'dropped');
  const hostLines = hostCallLinesFor(outcome);
  if (hostLines) {
    scenes.push({
      step: 'critiques',
      kind: 'stage:deliberation-host',
      data: {
        beat: 'deliberation-host', tier: outcome,
        players: biggest ? [biggest.name] : [],
        note: 'What the host does with the board the panel handed her.',
        panelRank: biggest?.panelRank ?? null, finalRank: biggest?.finalRank ?? null,
      },
      text: fill(pick(hostLines, rng, usedLines, `host/${outcome}`),
        { a: biggest?.name || '' }),
    });
  }

  } // ── end of the panel's night ──

  /* AND ON A RATE-A-QUEEN NIGHT, THE ONE THING THE HOST DOES SAY. It replaces
     the whole section above rather than joining it. */
  if (rateAQueen) emit(beatById('rate-announce'), 'announce', []);

  /* ── THE RESULTS, IN THE ORDER THE HOST CALLS THEM ──
     SAFE FIRST. The host dismisses the safe queens before he turns to the
     tops and the bottoms — they leave the stage and the night narrows to
     the people it is about. This ran win, safe, bottom, which is neither
     the order it happens in nor a dramatic order; it announced the winner
     to a stage still full of queens who had not been told anything.

     And HIGH, LOW and BTM now speak. All three were placed by the panel and
     none of them had a beat in the pool, so nine rows of a thirteen-queen
     call rendered a portrait and a stamp and no words. */
  if ((call.safe || []).length) emit(beatById('result-safe'), 'safe', []);

  /* ── AND THEN IN THE ORDER SHE CHOSE TO CALL IT ──
     This ran win, high, low, btm, bottom — the order the groups happen to be
     written down in — so the winner was announced first every single week, to
     a stage still full of queens who had not been told anything, and the
     night ended on two names everybody had already guessed from the
     critiques. The peak came first and the dread came last and neither of
     them landed.
     `callOrder` is chosen in week.js from what actually happened tonight, and
     the hold is the pause before the block the night has been built to end
     on. See js/dr/data/results-order.js for the shapes and why each exists. */

  const shape = resultOrder(callOrder);
  const BY_GROUP = {
    WIN: ['result-win', 'win', call.win || []],
    HIGH: ['result-high', 'high', call.high || []],
    LOW: ['result-low', 'low', call.low || []],
    BTM: ['result-btm', 'btm', call.atRisk || []],
    BTM2: ['result-bottom', 'bottom', call.bottom || []],
  };
  // The hold goes before the last block that actually has anybody in it, so a
  // night with no BTM does not pause in front of an empty call.
  const filled = shape.groups.filter(g => (BY_GROUP[g] || [])[2]?.length);
  const holdAt = filled.includes(shape.holdBefore)
    ? shape.holdBefore : filled[filled.length - 1];

  for (const g of shape.groups) {
    const [beatId, tierId, who] = BY_GROUP[g] || [];
    if (!who || !who.length) continue;
    if (g === holdAt && filled.length > 1) {
      emit(beatById('results-hold'), 'hold', [], { before: g, order: shape.id });
    }
    for (const n of who) emit(beatById(beatId), tierId === 'win' && who.length > 1 ? 'double-win' : tierId, [n], { order: shape.id, ...(tierId === 'win' && who.length > 1 ? { doubleWin: true } : {}) });
  }

  /* AND WHAT THE SONG IS FOR, said last, after the names. Two queens standing
     on a stage about to lip sync is the same picture whether they are
     fighting to survive or fighting to win, and the call never said which. */
  if (lipsync && (lipsync.queens || []).length >= 2) {
    const [ls1, ls2] = lipsync.queens;
    emit(beatById('call-stakes'), stakes, [ls1, ls2], { stakes });
  }

  // ── the lip sync, beat by beat ──
  if (lipsync) {
    /* THE SPEECH IS TIERED ON WHAT THE SONG IS FOR. It used to be one pool
       hardcoded to 'intro', and every line in it promised an elimination —
       so a for-the-win night opened with "one stays, one goes" over a night
       nobody could lose. `stakes` is already computed for `call-stakes`
       above; this is the same question asked one beat later. */
    emit(beatById('lipsync-intro'), stakes, [],
      { song: lipsync.song, artist: lipsync.artist, stakes });
    /* ── THE SONG DECIDES WHAT THE PERFORMANCE WAS ──
       `lipsync-beat` had four tiers keyed on how well she did and nothing
       about the record she was doing it to, so a queen fighting for her life
       to a six-minute ballad and one doing it to a hyperpop banger got the
       same paragraph. js/dr/data/songs.js tags every title with a `tempo` and
       a `hook` and its own header says the narration should build a beat out
       of the hook — `lipsyncScore` reads both to decide who WINS, and the
       words describing the win read neither.
       Tempo is the axis rather than mood because tempo changes the JOB: a
       ballad is stillness and a face, an uptempo is cardio. Mood changes the
       colour of a performance; the old prose was wrong about the job, putting
       dance breaks over songs that have none. */
    const lsBeat = beatById('lipsync-beat');
    const stuntBeat = beatById('lipsync-stunt');
    for (const n of lipsync.queens || []) {
      const tierId = tierByScore((lipsync.scores || {})[n], LIPSYNC_TIERS);
      const tempoLines = tempoLinesFor(lipsync.tempo, tierId);
      if (tempoLines) {
        const t = lsBeat.tiers.find(x => x.id === tierId) || lsBeat.tiers[0];
        scenes.push({
          step: lsBeat.step,
          kind: 'stage:lipsync-beat',
          data: {
            beat: 'lipsync-beat', tier: tierId, players: [n], note: t.note,
            score: lipsync.scores?.[n], tempo: lipsync.tempo, voiced: true,
          },
          text: fill(pick(tempoLines, rng, usedLines, `tempo/${lipsync.tempo}/${tierId}`),
            { a: n, s: songTitle }),
        });
      } else {
        emit(lsBeat, tierId, [n], { score: lipsync.scores?.[n], voiced: false });
      }

      /* THE ONE MOMENT THE SONG IS DECIDED AT, which every song names and
         nothing has ever narrated. Whoever is top of this lip sync took it
         and everybody else did not — there is no middle at a key change. */
      if (lipsync.hook) {
        /* THE HOOK HAS ONE OWNER. `tierId` is absolute now, so two queens
           can both be 'strong' — and both "taking" the same key change is a
           thing that cannot happen. Whoever actually topped the song took it. */
        const took = fractionalRank(n, lipsync.scores || {}) === 0;
        const hookLines = hookLinesFor(lipsync.hook, took ? 'nailed' : 'missed');
        if (hookLines) {
          /* NO BEAT IN stage-beats.js FOR THIS ONE, deliberately. Its prose
             lives entirely in lipsync-voices.js keyed by the song's hook, so
             a stub beat there would be a second place to look for lines that
             are not in it — and `unwrittenStageTiers` would report a gap that
             another file is responsible for. It carries its own note. */
          scenes.push({
            step: 'lipsync',
            kind: 'stage:lipsync-hook',
            data: {
              beat: 'lipsync-hook', tier: took ? 'nailed' : 'missed', players: [n],
              note: 'The moment in the song where the lip sync is decided.',
              hook: lipsync.hook, voiced: true,
            },
            text: fill(pick(hookLines, rng, usedLines, `hook/${lipsync.hook}/${took}`),
              { a: n, s: songTitle }),
          });
        }
      }
      const stunt = lipsync.stunts?.[n];
      if (stunt === 'landed' || stunt === 'failed') emit(stuntBeat, stunt, [n]);
    }
    /* ── THE HOLD, AND THEN THE TWO NAMES ──
       `lipsync-call` is one paragraph that names neither queen — "one queen
       lives to fight another week, the other is going home" — which is a
       description of the verdict rather than the verdict, on the most watched
       thirty seconds the show has. The host runs it as a sequence: she holds
       the room, she says one name and lets that queen go, and then she turns
       to the other one.
       THE OLD BEAT IS THE FALLBACK, not a duplicate. It fires only while the
       named ones are unwritten, so the screen never loses its verdict and
       never prints both versions of it. */
    const gone = new Set(lipsync.losers || (lipsync.loser ? [lipsync.loser] : []));
    const stayed = (lipsync.queens || []).filter(n => !gone.has(n));
    /* ONLY THE ORDINARY CALL IS REPLACED. `lipsync-call` has tiers for the
       nights that are not "one stays and one goes" — a double shantay, a
       double elimination, a triple, a scheduled no-elimination — and each of
       those is a specific thing the host says that the named beats do not
       cover. Skipping the whole beat took those out of the show along with
       the ordinary one, and a no-elimination night went by without the host
       ever saying nobody was going home. */
    const ordinary = (lipsync.call || 'shantay') === 'shantay'
      || lipsync.call === 'double-out';
    const named = ordinary && (beatById('lipsync-shantay').tiers[0].lines.length
      || beatById('lipsync-sashay').tiers[0].lines.length);

    /* ── AND THE NIGHT THE SONG IS A PRIZE HAS ITS OWN NAMED SEQUENCE ──
       `for-the-win` and `legacy` put the two BEST queens on the song and
       neither of them can be eliminated by it. Both fell through `ordinary`
       to `lipsync-call`, which had no tier for either, which meant
       `tiers[0]` — the shantay tier — over a night nobody could lose. The
       winner's name was never said on her own screen.
       Same shape as the shantay sequence and for the same reason: the hold,
       the name, and then the other one. What differs is the vocabulary,
       which is why these are their own beats and not another tier of
       `lipsync-shantay` — nobody is saved here, so nothing may say stay. */
    const prize = lipsync.call === 'for-the-win' || lipsync.call === 'legacy';
    const prizeStakes = lipsync.call === 'legacy' ? 'legacy' : 'win';
    const prizeWritten = prize && !!(tierLines('lipsync-win-name', prizeStakes)
      || tierLines('lipsync-win-reaction', 'scrapper'));
    const runnerUp = (lipsync.queens || []).find(n => n !== lipsync.winner) || null;

    if (prizeWritten) {
      emit(beatById('lipsync-suspense'), 'held', []);
      // She says the winner first, because on this night the winner is the
      // announcement — the other queen is not waiting to find out whether
      // she is safe, she is waiting to find out that she lost.
      if (lipsync.winner) {
        emit(beatById('lipsync-win-name'), prizeStakes, [lipsync.winner], { stakes: prizeStakes });
        emit(beatById('lipsync-win-reaction'),
          swaggerGroupFor(players[lipsync.winner] && players[lipsync.winner].archetype),
          [lipsync.winner], { stakes: prizeStakes });
      }
      if (runnerUp) {
        emit(beatById('lipsync-win-runnerup'), prizeStakes, [runnerUp], { stakes: prizeStakes });
      }
    } else if (named) {
      emit(beatById('lipsync-suspense'), 'held', []);
      // The stay is said first, because that is the order she says it in and
      // the order is the whole cruelty of it: one queen is released and the
      // other is left standing there knowing.
      for (const n of stayed) emit(beatById('lipsync-shantay'), 'shantay', [n]);
      for (const n of gone) emit(beatById('lipsync-sashay'), 'sashay', [n]);
    } else {
      emit(beatById('lipsync-call'), lipsync.call || 'shantay', []);
    }

    /* ── AND ON A LEGACY NIGHT SHE SPENDS IT, OUT LOUD ──
       week.js resolves the choice and emitted it through `say()`, which
       writes `text: ''`, and nothing in js/ rendered that kind — so the
       queen she sent home left the season without the screen ever saying
       who sent her. `eliminated` is set on the lipsync object before this
       function runs, which is the only reason it can be named here. */
    if (lipsync.call === 'legacy' && lipsync.winner && lipsync.eliminated) {
      emit(beatById('lipsync-legacy-choice'), 'choice',
        [lipsync.winner, lipsync.eliminated],
        { winner: lipsync.winner, eliminated: lipsync.eliminated });
    }
    /* AND THEN SHE SPEAKS. The last card on the lip sync screen is the only
       one in her own voice — the host has said her name and she answers it.
       Tiered by swagger group so the queen who has been narrating her own
       runway walks all season leaves sounding like herself.
       `named` is deliberately not required: a queen goes home on an unnamed
       call too, and she gets her last words either way. */
    for (const n of gone) {
      emit(beatById('sashay-words'),
        swaggerGroupFor(players[n] && players[n].archetype), [n]);
    }
  }

  // ── the exit, which is a ritual and always happens ──
  for (const x of exits) {
    // The porkchop belongs to the first queen out of a SEASON, not the first
    // of a night — one per season, which is the whole joke.
    if (firstOfSeason) emit(beatById('porkchop'), 'porkchop', [x]);
    emit(beatById('farewell'), 'goodbye', [x]);
    emit(beatById('mirror-message'), 'message', [x]);
  }
  if (exits.length) emit(beatById('closing'), 'close', []);

  return scenes;
}

/**
 * Backstage, while the judges argue.
 *
 * A pool draw, and the facts it filters on are the critiques — which is what
 * Untucked is actually about. `namedOnStage` is the big one: a queen who threw
 * somebody under the bus during the critiques is the most reliable fight the
 * segment has.
 */
export function runUntucked({
  living = [], players = {}, state = {}, storylines = [], call = {},
  namedOnStage = [], rng = Math.random, ctx = {}, perPhase = null,
}) {
  /* HOW MANY SCENES A PHASE GETS, and three was three regardless of whether
     there were twelve queens on the couch or four. Untucked is the one room
     where the whole cast is in shot at once, and nine scenes across a
     thirteen-queen night means most of them sat there silently.
     Scaled to the room, with a floor so a final four still has a segment. */
  const per = perPhase ?? Math.max(3, Math.round(living.length * 0.55));
  const scenes = [];
  const seen = {};
  const usedLines = new Set();
  const used = state._drUntuckedUsed instanceof Set
    ? state._drUntuckedUsed
    : (state._drUntuckedUsed = new Set(state._drUntuckedUsedList || []));

  const bottom = new Set(call.bottom || []);
  const callOf = n => (call.win || []).includes(n) ? 'WIN'
    : (call.high || []).includes(n) ? 'HIGH'
      : bottom.has(n) ? 'BTM2'
        : (call.atRisk || []).includes(n) ? 'BTM'
          : (call.low || []).includes(n) ? 'LOW' : 'SAFE';
  const named = new Set(namedOnStage);
  const arcsOf = n => storylines.filter(s => s.alive && s.players.includes(n)).map(s => s.arc);
  const bondOf = (a, b) => { try { return ctx.bond ? ctx.bond(a, b) : 0; } catch { return 0; } };

  // Same coverage principle as the werk room: pull toward whoever has not
  // spoken yet, so a segment is not three scenes about one queen.
  const subject = pool => {
    const w = pool.map(n => ({ n, w: ((seen[n] || 0) === 0 ? 5 : 1 / (1 + seen[n])) }));
    const total = w.reduce((t, x) => t + x.w, 0);
    let roll = rng() * total;
    return (w.find(x => (roll -= x.w) <= 0) || w[0]).n;
  };

  for (const phase of UNTUCKED_PHASES) {
    for (let i = 0; i < per; i++) {
      const candidates = [];
      for (const ev of UNTUCKED_EVENTS) {
        if (ev.phase !== phase) continue;
        const a = subject(living);
        const others = living.filter(n => n !== a);
        const pairing = ev.cast === 'pair' || ev.cast === 'group';
        const b = pairing ? (others.length ? subject(others) : null) : null;
        if (pairing && !b) continue;

        /* ── AND THE REST OF THE COUCH ──
           Untucked is the one room where the entire cast is in shot at the
           same time, and the pool only knew how to do one queen or two — so
           the segment whose whole premise is everybody sitting together
           watching each other read as a series of two-handers.
           `{c}` and `{d}` are the queens who are simply there: the one who
           says nothing while two others go at it, the one who laughs at the
           wrong moment, the third voice in a conversation that was going to
           stay civil until she joined it. */
        const rest = [];
        if (ev.cast === 'group') {
          const pool = others.filter(n => n !== b);
          const want = Math.min(pool.length, 1 + Math.floor(rng() * 2));
          for (let g = 0; g < want; g++) {
            const left = pool.filter(n => !rest.includes(n));
            if (!left.length) break;
            rest.push(subject(left));
          }
          if (!rest.length) continue;
        }

        const facts = {
          a: players[a] || null,
          b: b ? players[b] || null : null,
          nameA: a,
          nameB: b,
          // The same pre-alliance the werk room reads. Untucked is where it
          // costs something: two of them in the bottom two, in a room with
          // nowhere to go.
          ...familyFacts(state.dragFamilies, a, b),
          nameC: rest[0] || null,
          nameD: rest[1] || null,
          groupSize: 1 + (b ? 1 : 0) + rest.length,
          bond: b ? bondOf(a, b) : 0,
          canScheme: canScheme(players[a]),
          lastCall: callOf(a),
          callA: callOf(a),
          callB: b ? callOf(b) : null,
          inBottom: bottom.has(a),
          bInBottom: b ? bottom.has(b) : false,
          bothInBottom: bottom.has(a) && !!b && bottom.has(b),
          namedOnStage: named.has(a) || (!!b && named.has(b)),
          tension: b ? bondOf(a, b) <= -2 : false,
          winsA: (state.record?.[a] || []).filter(r => r === 'WIN').length,
          phase: state._drPhase ?? 0,
          episode: ctx.episode ?? 1,
          arcsA: arcsOf(a),
          arcsB: b ? arcsOf(b) : [],
        };
        let ok = false;
        try { ok = !!ev.when(facts); } catch { ok = false; }
        if (!ok) continue;

        const inPlay = new Set([...facts.arcsA, ...facts.arcsB]);
        const weight = (ev.weight || 1)
          * ((ev.arcs || []).some(x => inPlay.has(x)) ? 2.5 : 1)
          * (used.has(ev.id) ? 0.08 : 1);
        candidates.push({ ev, facts, weight });
      }
      if (!candidates.length) break;

      const total = candidates.reduce((t, c) => t + c.weight, 0);
      let roll = rng() * total;
      const chosen = candidates.find(c => (roll -= c.weight) <= 0) || candidates[0];
      if (scenes.some(s => s.data.event === chosen.ev.id)) continue;

      const who = [chosen.facts.nameA, chosen.facts.nameB,
        chosen.facts.nameC, chosen.facts.nameD].filter(Boolean);
      scenes.push({
        step: 'untucked',
        kind: `untucked:${chosen.ev.id}`,
        data: {
          event: chosen.ev.id, phase, players: who,
          note: chosen.ev.note, eligible: candidates.length,
        },
        text: fill(pick(chosen.ev.lines, rng, usedLines, chosen.ev.id),
          /* {c} AND {d} ARE THE COUCH HERE, not the category and the pick.
             This shares the module's `fill`, where those two names mean
             something else on the stage beats — safe because no Untucked
             line has a category or a draft choice to name, and the guard
             rejects any placeholder outside a/b/c/d in this pool. */
          { a: who[0], b: who[1], c: chosen.facts.nameC, d: chosen.facts.nameD }),
        effects: chosen.ev.effects,
      });
      used.add(chosen.ev.id);
      for (const n of who) seen[n] = (seen[n] || 0) + 1;
    }
  }

  state._drUntuckedUsedList = [...used];
  return scenes;
}

/** Write what an Untucked scene did. Throws on one that changes nothing. */
export function applyUntuckedScene(scene, ctx) {
  const e = scene?.effects || {};
  const changes = (e.bond ? 1 : 0) + Object.keys(e.pop || {}).length + (e.state ? 1 : 0);
  if (!changes) {
    throw new Error(
      `drag-race: untucked scene "${scene?.data?.event}" has no consequence`);
  }
  const [a, b] = scene.data.players;
  if (e.bond && b) ctx.addBond(a, b, e.bond);
  for (const [who, delta] of Object.entries(e.pop || {})) {
    const name = who === 'a' ? a : b;
    if (name) ctx.popDelta(name, delta);
  }
  return changes;
}

/**
 * The four phases that were bare markers: the announcement, the mini, the
 * division of the room, and the performance itself.
 *
 * Same principle as the main stage — nothing is drawn, every beat fires and
 * the tier comes from what happened. Kept in this file rather than duplicated
 * because the tier machinery is identical; kept out of stage-beats.js because
 * that data file was being written into at the time.
 */
export function renderChallengeBeats({
  living = [], maxi = {}, mini = null, miniWinner = null, miniScores = {},
  // WHO SHE WENT AFTER. `{ [queen]: { target } }` on a `targets` mini and
  // `{ partner }` on a `pairs` one, straight off the mini engine's own record.
  // It has always existed and this renderer never asked for it.
  miniDetail = {},
  assignment = {}, performances = {}, rng = Math.random,
  /* ── WHAT THE CHALLENGE MODULE ALREADY EMITTED ──
     This function builds its OWN `scenes` array and never saw the module's,
     so two beats written to read back off `writing-booth` and `studio-day`
     searched an array those scenes are not in and could never fire. Written
     and unreachable, in code written the same afternoon as the section of
     docs/ADDING-A-SHOW.md about it.
     Passed in rather than recomputed, so what is drawn is what happened. */
  moduleScenes = [],
}) {
  const scenes = [];
  const usedLines = new Set();
  const beatById = id => CHALLENGE_BEATS.find(b => b.id === id);
  /* The beats that are ABOUT the person running the room. Every beat here can
     quote her through `{m}`; only these three draw her face, or the screen
     grows a portrait of Michelle beside a queen picking a verse slot. */
  const MENTORED = new Set(['booth-session', 'studio-day', 'rehearsal', 'studio-taping']);
  /* Who is running THIS room. A Rumix has two of them on one afternoon —
     Michelle in the booth, Jamal on the number — so it is resolved per beat
     rather than per challenge. */
  const mentorOf = beatId => mentorForBeat(beatId, maxi.id);

  const emit = (beat, tierId, who, extra = {}, step = null) => {
    if (!beat) return;
    const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
    if (!t) return;
    if (!t.lines || !t.lines.length) return;  // see the note on the emit above
    scenes.push({
      step: step || beat.step,
      kind: `chal:${beat.id}`,
      data: {
        beat: beat.id, tier: t.id, players: who, note: t.note,
        /* Only where she is actually in the scene. Every beat in this renderer
           can quote her, but the card only draws her on the ones that are
           ABOUT her — the booth and the shoot — or the screen grows a portrait
           of Michelle beside a queen picking a slot. */
        ...(MENTORED.has(beat.id) && mentorOf(beat.id)
          ? { mentor: { id: mentorOf(beat.id).id, name: mentorOf(beat.id).name } } : {}),
        ...extra,
      },
      text: fill(pick(t.lines, rng, usedLines, `${beat.id}/${t.id}`),
        /* `{m}` IS WHOEVER RAN THE ROOM. The booth and the shoot were written
           around "the director" and "the vocal producer" — an unnamed stranger
           handing out notes that move a result. Michelle runs both and Jamal
           takes a choreography room; see MENTORS in js/dr/data/judges.js.
           `{b}` is here for the same reason it is everywhere else: a beat about
           two queens could not name the second one from this emitter. */
        { a: who[0], b: who[1], c: maxi.name, m: mentorOf(beat.id)?.name || '' }),
    });
  };

  /* ── THE HOST ARRIVES AND SETS THE WEEK, IN THIS CHALLENGE'S OWN WORDS ──
     Everything below the arrival used to be challenge-blind. The brief named
     the challenge and said nothing about it, and the reactions did not even
     do that: read a Talent Show episode and three queens react to a solo act
     on a bare stage by "casting", "choreographing" and "picking fabric",
     because those sentences were written for a girl group and print under
     every family there is.
     Same fix as the performance one screen later — the family pool says the
     same tier in the challenge's own language — and it falls back the same
     way, so a family nobody has written yet keeps the generic beat. */
  const briefFam = familyForChallenge(maxi.id).family;
  emit(beatById('host-arrives'), 'arrival', []);

  const briefBeat = beatById('the-brief');
  const brief = briefLinesFor(briefFam);
  if (brief) {
    scenes.push({
      step: briefBeat.step,
      kind: 'chal:the-brief',
      data: {
        beat: 'the-brief', tier: 'brief', players: [], challenge: maxi.name,
        note: briefBeat.tiers[0].note, family: briefFam, voiced: true,
      },
      text: fill(pick(brief, rng, usedLines, `brief/${briefFam}`), { c: maxi.name }),
    });
  } else {
    emit(briefBeat, 'brief', [], { challenge: maxi.name, family: briefFam, voiced: false });
  }

  // Who is pleased about it. Ranked on how well the challenge's own blend
  // suits her craft, so "this is her week" means the same thing the scoring
  // means by it rather than a separate opinion.
  const aptitude = {};
  for (const n of living) {
    const d = dragOf(performances[n]?.player || null);
    aptitude[n] = Object.entries(maxi.blend || {})
      .reduce((t, [k, w]) => t + (d[k] || 5) * w, 0);
  }
  const byAptitude = Object.keys(aptitude).length
    ? Object.entries(aptitude).sort((a, b) => b[1] - a[1]).map(e => e[0])
    : [...living];
  const reactBeat = beatById('announce-reaction');
  const react = (n, tierId) => {
    const lines = reactionLinesFor(briefFam, tierId);
    if (!lines) { emit(reactBeat, tierId, [n], { family: briefFam, voiced: false }); return; }
    const t = reactBeat.tiers.find(x => x.id === tierId) || reactBeat.tiers[0];
    scenes.push({
      step: reactBeat.step,
      kind: 'chal:announce-reaction',
      data: {
        beat: 'announce-reaction', tier: tierId, players: [n],
        note: t.note, family: briefFam, voiced: true,
      },
      text: fill(pick(lines, rng, usedLines, `react/${briefFam}/${tierId}`),
        { a: n, c: maxi.name }),
    });
  };
  for (const n of byAptitude.slice(0, REACTING)) {
    react(n, tierAt(fractionalRank(n, aptitude), APTITUDE_TIERS));
  }
  for (const n of byAptitude.slice(-1)) {
    if (byAptitude.length > REACTING) react(n, 'dreading');
  }

  /* ── THE MINI, IN THE MINI'S OWN WORDS ──
     `mini-attempt` had three tiers keyed on how well she did and no idea what
     she was doing, so a Werk Room Dance-Off — eight counts, no warning, and
     nobody says a word — was narrated in the language of a reading challenge:
     "funny enough", "gets a laugh", "the timing of somebody who has done this
     in a bar". Those lines print under all seven minis because the beat could
     not tell them apart.
     AND IT NAMES WHO SHE WENT AFTER. Three of the seven are `targets`: she
     does a bit ABOUT another queen, to her face, and the mini engine has
     recorded which queen since the day it was written. The screen learned to
     draw that; the prose still could not say it. `pairs` is the same shape
     with a partner instead of a victim. */
  if (mini) {
    const mEmit = (beatId, tierId, who, extra = {}) => {
      const beat = beatById(beatId);
      const lines = miniLinesFor(mini.id, tierId);
      if (!lines) { emit(beat, tierId, who, { ...extra, mini: mini.id, voiced: false }); return; }
      const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
      scenes.push({
        step: beat.step,
        // `chal:`, matching every other beat this renderer emits. The stage
        // renderer uses `stage:`; a mini is a challenge beat and the VP reads
        // the prefix to tell the two nights apart.
        kind: `chal:${beatId}`,
        data: {
          beat: beatId, tier: tierId, players: who, note: t.note,
          mini: mini.id, voiced: true, ...extra,
        },
        text: fill(pick(lines, rng, usedLines, `mini/${mini.id}/${tierId}`),
          { a: who[0], b: who[1], c: mini.name }),
      });
    };
    // The second name only where the mini has one. A solo mini has no target
    // and its pool may not use {b} — the guard rejects it, so it is
    // unreachable rather than merely absent.
    const otherFor = n => (miniNamesOther(mini.id)
      ? (miniDetail[n]?.target || miniDetail[n]?.partner || null) : null);

    mEmit('mini-announce', 'announce', [], { name: mini.name, buys: mini.buys });
    /* EVERY QUEEN WHO COMPETED GETS HER CARD. A cap was tried here and it
       was the wrong answer to the right complaint: the mini did outrun the
       maxi, but the fix for that is the maxi being bigger, not the room
       being cut. A queen who competed and got no card is a queen the
       episode forgot.
       Screen time is unequal by EARNING it — the tier a queen lands in
       decides how much the card says about her, which is what the tiers
       were for. */
    /* ── ONE QUEEN AT A TIME, IN THE ORDER SHE IS CALLED ──
       A targeting mini is taken in turns and the turn IS the format: the host
       names her, she stands up, she says her one thing to somebody's face.
       This rendered as thirteen simultaneous attempts in `living` order, so
       the running order — first up, and the last one everybody has been
       waiting for — reached the screen as nothing at all. */
    const order = miniNamesOther(mini.id) && Array.isArray(mini.turnOrder)
      ? mini.turnOrder.filter(n => living.includes(n)) : living;

    for (const n of order) {
      if (miniScores[n] === undefined) continue;
      const other = otherFor(n);
      const d = miniDetail[n] || {};
      if (d.position) {
        mEmit('mini-turn', d.position, [n], { turn: d.turn, position: d.position });
      }
      // She stood up and had nothing, which is its own result and was
      // unreachable while the floor of the pool was "a read that missed".
      const tierId = d.passed
        ? 'passed' : tierAt(fractionalRank(n, miniScores), MINI_TIERS);
      mEmit('mini-attempt', tierId, other ? [n, other] : [n],
        { target: other, passed: !!d.passed, position: d.position || null });
    }
    if (miniWinner) {
      const other = otherFor(miniWinner);
      mEmit('mini-win', 'win', other ? [miniWinner, other] : [miniWinner], { buys: mini.buys });
    }
  }

  // ── how the room was divided ──
  /* A DRAFT IS A CONTEST, NOT A LIST. This read "there are picks" as "there
     was a draft", so a challenge where every queen simply chooses her own act
     — nothing exclusive, nothing taken from anybody — was announced with a
     pick order and narrated as a scramble. An assignment that says
     `contested: false` gets the solo tier, which is what it always was:
     no teams, no partners, no draft, everybody on her own. */
  /* FOUR ANSWERS, NOT THREE. `contested: false` used to mean "solo" — every
     queen on her own — and that is one of two very different things it can
     mean. A challenge where the HOST hands out parts is not solo: there is a
     call sheet, there are leads and ensemble, and she had no say in which she
     got. `roles` beyond a flat 'standard' is what tells them apart. */
  /* ── THE MODULE SAYS HOW IT SPLIT THE ROOM, WHEN IT KNOWS ──
     Inferring it from `teams.length > 1` meant CAPTAINS, always, for any
     challenge that groups anybody — so the acting challenge, which cuts the
     room into two casts and then drafts named parts inside each, opened with
     "Two captains. The host names them and the room splits — the people doing
     the choosing and the people being chosen." There are no captains on that
     night and nobody chooses a teammate. The commercial, which pairs the room
     off, got the same sentence.
     `assignment.division` is the module's own answer and it wins. The
     inference stays for the modules that have not been given one. */
  const roleSet = new Set(Object.values(assignment.roles || {}));
  const castNotChosen = assignment.contested === false && roleSet.size > 1;
  const kind = assignment.division
    || ((assignment.teams || []).length > 1 ? 'captains'
      : castNotChosen ? 'cast'
        : (assignment.contested !== false && Object.keys(assignment.picks || {}).length)
          ? 'draft' : 'solo');
  /* ── AND WHERE IT IS SAID ──
     Normally on the draft screen, which is what the choice step is. But three
     challenges hand out NOTHING — the ball, the photoshoot, the runway
     challenge — so on those nights the draft screen was a heading, a click and
     one sentence saying there is nothing to draft. Reported as "remove the
     draft screen when unnecessary".
     Dropping the scene would be worse than the screen: it is a real line about
     a real fact, and tests/dr-vp-sweep.test.js is right to refuse a scene that
     is written and then filed nowhere. So it moves UP to the brief, which is
     where "you are all on your own this week" belongs anyway — the host says
     it as part of announcing the challenge. */
  const handsOutNothing = !Object.keys(assignment.picks || {}).length
    && (assignment.teams || []).length < 2;
  emit(beatById('the-division'), kind, [], {},
    handsOutNothing ? 'maxi-announce' : null);
  /* ── AND WHAT SHE ACTUALLY GOT ──
     Eleven of these fired on one Snatch Game and between them they said "the
     pick", "it", "this one" and "what is available" — on a night where the
     thing being picked is a person she has to BE for six questions. The
     choice has been on `assignment.picks[n].choice` since the draft resolver
     was written and the card even title-cases it; the prose could not say it.
     `{d}` is that choice, resolved the same way the card resolves it. */
  const pickBeat = beatById('pick-reaction');
  const kindId = pickKindFor(maxi.id);
  /* ── A QUEEN WHO CHOSE NOTHING GETS NO PICK CARD ──
     `picks` is keyed by queen whatever produced it, so a hand-out that merely
     RECORDS what she was given landed in this loop and was narrated as a
     draft: "she grabs the role everybody knew had the material", over a part
     the host assigned to her. The call sheet is its own beat — what she was
     cast as, which she found out at the same moment everybody else did. */
  const castBeat = beatById('call-sheet');
  for (const n of living) {
    const p = assignment.picks?.[n];
    if (!p) continue;
    /* ── TWO WAYS NOT TO CHOOSE, AND THEY ARE DIFFERENT NIGHTS ──
       `chosen: false` meant "the host cast her" for as long as only the music
       video set it. Then the makeover started handing its room out — the mini
       winner pairs everybody — and every queen on a makeover began drawing the
       music video's CALL SHEET: "the host reads Bowie's part, standard" over a
       night about a wig, and "the role exists in the video" over a challenge
       with no video in it.
       `assignedBy` is what tells them apart: paired by another QUEEN gets the
       pairing beat, cast by the HOST gets a call sheet. */
    if (p.chosen === false && !p.assignedBy) {
      emit(castBeat, assignment.roles?.[n] || 'standard', [n],
        { role: assignment.roles?.[n] || 'standard' });
      continue;
    }
    if (p.assignedBy) {
      /* WHAT WAS MEANT BY IT, decided in js/dr/chal/makeover.js and carried on
         the pick. The renderer does not re-derive it: the module already knows
         whether it dumped on her, looked after her or reached the next name,
         and a second opinion here would be a screen disagreeing with the
         engine about what just happened. */
      emit(beatById('paired-off'), p.pairing || 'next-name', [n, p.assignedBy], {
        partner: p.choice, by: p.assignedBy,
      });
      continue;
    }
    /* HOW FAR SHE FELL, NOT WHAT IT COST HER. This read `p.penalty > 0`, and
       most drafts set `penaltyScale: 0` on purpose — a roast slot or a pile
       of materials is not something she prepared for, so missing her first
       choice charges her nothing. Which meant `penalty` was zero for the
       whole cast and every queen who lost her pick was narrated as having got
       exactly what she wanted. The board beside the cards read `lostTo` and
       said the opposite on the same screen: ten queens marked "lost hers to
       Julia", ten cards saying she got what she asked for.
       `depth` is the honest field — 0 is her first choice, higher is further
       down her own list — and it is recorded on every draft regardless of
       what the miss costs. */
    const order = assignment.order || [];
    const depth = Number.isFinite(p.depth) ? p.depth : (p.penalty > 0 ? 1 : 0);
    const tierId = String(p.choice || '').startsWith('leftover-') ? 'left-over'
      : order.indexOf(n) === order.length - 1 && order.length > 1 ? 'picked-last'
        : depth > 0 || p.lostTo ? 'settled'
          : 'got-it';
    const lines = kindId ? pickLinesFor(kindId, tierId) : null;
    if (!lines) { emit(pickBeat, tierId, [n], { choice: p.choice, voiced: false }); continue; }
    const t = pickBeat.tiers.find(x => x.id === tierId) || pickBeat.tiers[0];
    scenes.push({
      step: pickBeat.step,
      kind: 'chal:pick-reaction',
      data: {
        beat: 'pick-reaction', tier: tierId, players: [n], note: t.note,
        choice: p.choice, pickKind: kindId, voiced: true,
        lostTo: p.lostTo || null,
      },
      text: fill(pick(lines, rng, usedLines, `pick/${kindId}/${tierId}`),
        { a: n, c: maxi.name, d: choiceLabel(p.choice) }),
    });
  }

  /* ── THE DAY ON SET, ONE CARD PER QUEEN ──
     The module emits a single `studio-day` scene carrying every queen's note
     and no text, which is a data payload rather than a screen — so the whole
     director mechanic was invisible and the challenge read no differently
     from the one it was split out of. Read back off that scene rather than
     recomputed, so what is drawn is what actually happened. */
  /* ── AN HOUR IN THE BOOTH, ONE CARD PER QUEEN ──
     Read back off the scene the Rumix module already emits, with the tier it
     already decided, for the same reason the shoot day below is. */
  const boothScene = moduleScenes.find(s => s.kind === 'writing-booth');
  if (boothScene) {
    const boothBeat = beatById('booth-session');
    for (const ses of boothScene.data?.sessions || []) {
      emit(boothBeat, ses.tier, [ses.name], {
        /* Two words for the rail, so the sidebar says how her session went
           rather than that she has been in the room. See `railFor`. */
        railTag: { 'got-it-on-tape': 'nailed it', 'clean-session': 'clean',
          'many-takes': 'long session', 'could-not-get-it': 'lost it' }[ses.tier],
        lift: ses.lift, booth: ses.booth, written: ses.written,
        // The screen opens on these cards, so the night's track travels with
        // them rather than with the marker scene back in the werk room.
        track: boothScene.data?.track || null,
      });
    }
  }

  /* ── THE AFTERNOON ON THE NUMBER, ONE CARD PER QUEEN ──
     Between the booth and the shoot in the running order, which is the order
     it happens in on both challenges: she records, she learns it, she
     performs it — or she learns it, then they shoot it. */
  const rehScene = moduleScenes.find(s => s.kind === 'choreo-call');
  if (rehScene) {
    const rehBeat = beatById('rehearsal');
    for (const note of rehScene.data?.notes || []) {
      /* A NOTE WITH NO TIER IS NOT THIS BEAT'S NOTE. `emit` falls back to the
         first tier when it cannot find the id, which is right for a caller
         that means "the only tier" and catastrophic for one that has read the
         wrong scene: it printed the top tier for every queen in the room.
         Belt as well as the braces of the rename above. */
      if (!note.tier) continue;
      emit(rehBeat, note.tier, [note.name], {
        railTag: { 'first-pass': 'first pass', 'got-there': 'got there',
          'behind-the-count': 'behind', 'still-counting': 'still counting' }[note.tier],
        delta: note.delta,
      });
    }
  }

  /* ── THE SAME AFTERNOON, ON A SCRIPTED SET ──
     Two kinds and no more. It matched `rehearsal` for a while, which
     js/dr/chal/talent-show.js and js/dr/chal/design.js ALSO emit with a
     completely different note shape — the guard below caught it, but a finder
     that has to be saved by a guard is the wrong finder. Improv emits
     `no-rehearsal` and gets nothing, correctly: it is the one challenge in
     this family with no preparation at all. */
  const dirScene = moduleScenes.find(s =>
    s.kind === 'studio-taping' || s.kind === 'commercial-pitch');
  if (dirScene) {
    const dirBeat = beatById('studio-taping');
    for (const note of dirScene.data?.notes || []) {
      if (!note.tier) continue;
      emit(dirBeat, note.tier, [note.name], {
        railTag: { 'made-the-scene': 'made the scene', 'takes-direction': 'easy',
          'many-resets': 'resets', 'argued-with-him': 'argued' }[note.tier],
        took: note.took, good: note.good, argued: note.argued,
      });
    }
  }

  const studio = moduleScenes.find(s => s.kind === 'studio-day');
  if (studio) {
    const dayBeat = beatById('studio-day');
    for (const note of studio.data?.notes || []) {
      const tierId = note.argued ? 'argued'
        : note.impression >= 0.45 ? 'made-the-day'
          : note.impression <= -0.3 ? 'slow' : 'easy';
      emit(dayBeat, tierId, [note.name], {
        railTag: { 'made-the-day': 'made the day', easy: 'easy day',
          slow: 'slow', argued: 'argued' }[tierId],
        role: note.role, took: note.took, argued: note.argued,
        concept: studio.data?.concept || null,
      });
    }
  }

  // ── the performance, IN THIS CHALLENGE'S OWN VOICE ──
  //
  // The generic `performance` beat in challenge-beats.js is deliberately
  // bypassed here. It has five tiers that do not know which night it is, and
  // it is the reason a Snatch Game and a Rusical read identically. The family
  // pool says the same tier in the challenge's own language: a collapse on a
  // Snatch Game is being stuck in a chair unable to drop the character; on a
  // Rusical it is being off-key in front of a live band.
  const step = maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main';
  const family = familyForChallenge(maxi.id);
  const perfScores = Object.fromEntries(
    living.filter(n => performances[n]).map(n => [n, performances[n].perf]));

  for (const n of living) {
    if (!performances[n]) continue;
    const tierId = tierAt(fractionalRank(n, perfScores), PERF_TIERS);
    const tier = family.tiers.find(t => t.id === tierId) || family.tiers[2];
    /* ── A FAMILY CAN SHIP AHEAD OF ITS PROSE, AND MUST NOT SHIP SILENT ──
       `pick` on an empty pool returns nothing and `fill` turns that into an
       empty string, so a family whose tiers are not written yet would push a
       performance scene per queen with no words in it — one blank card each,
       every episode, on every challenge that family serves. That is worse
       than the wrong flavour, and it is invisible to any guard that counts
       scenes rather than reading them.
       So an unwritten tier borrows the generic wording for the SAME tier.
       It reads as a performance rather than as this challenge's performance,
       which is the honest state of a family with no lines yet, and it goes
       away the moment somebody writes them. */
    const words = tier.lines?.length
      ? tier
      : (performanceFor('generic').tiers.find(t => t.id === tierId) || tier);
    scenes.push({
      step,
      kind: `perform:${family.family}`,
      data: {
        family: family.family, tier: tierId, players: [n],
        note: tier.note, perf: performances[n].perf,
      },
      text: fill(pick(words.lines, rng, usedLines, `${family.family}/${tierId}`), { a: n }),
    });
    if (performances[n].moment) emit(beatById('performance-moment'), 'moment', [n], {}, step);
  }

  return scenes;
}

/**
 * Prose for the events the challenge modules fire.
 *
 * The modules decide everything and narrate nothing — they emit `{type,
 * players, bond, pop}` and no text. Without this the specific beats that make
 * a challenge memorable ("she died on the panel", "she took the front and the
 * team paid for it") reach the row as bare event types and are shown to nobody.
 *
 * An event with no prose written yet renders with no text rather than being
 * dropped, so the beat still exists and the gap is visible.
 */
export function renderMaxiEventScenes(events, {
  step = 'maxi-main', rng = Math.random,
  // Which challenge these events belong to, so the walkthrough can speak in
  // its language. Defaults to the fallback family rather than throwing, so a
  // caller that has not been updated still renders.
  family = 'generic',
} = {}) {
  const scenes = [];
  const used = new Set();
  for (const ev of events || []) {
    const spec = MAXI_EVENTS.find(x => x.id === ev.type);
    if (!spec) continue;
    const who = ev.players || [];
    /* WHERE THE EVENT HAPPENS, which the event has always known and this
       renderer always ignored. Every entry in maxi-events.js carries a
       `from` — and four of them say `prep`, meaning the werk room while the
       queens are still building: the host's walkthrough is the obvious one.
       Stamped with the maxi's step, RuPaul stopping at a station to look at
       a half-built garment was drawn on the card for the performance she
       gives afterwards, which is not only the wrong screen but the wrong
       moment in the night — the note is given so that the runway can answer
       it, and the runway had already happened.
       Only `prep` is rerouted: every other `from` names the challenge the
       event belongs to, which is the screen it is already on. */
    /* WHERE THE EVENT HAPPENS. `prep` is the werk room mid-build, and
       `assign` is the DRAFT — two queens wanting the same thing is the most
       dramatic moment the hand-out has, and it was being stamped with the
       maxi's step and drawn on the performance screen, half an episode after
       the argument. The draft screen is where the fight is. */
    /* ── A MAP, BECAUSE A TERNARY ONLY KNEW TWO ──
       This handled `prep` and `assign` and sent everything else to the maxi's
       own step, which is right for the twenty families named after a
       challenge and wrong for the two that are not:

         `mini`      five events — a read landing, a read missing, a punch
                     pulled — all of which happen during the MINI and were
                     being stamped as maxi scenes;
         `rehearsal` the choreography room, which happens during prep.

       Read on a real makeover episode, the maxi cards opened with "she swings
       for MK and misses… going for somebody and landing is art", which is a
       READING CHALLENGE, over a card scoring a wig. Reported as "no
       correlation at all", and correct — the words and the numbers on those
       cards were about different halves of the night. */
    const AT = { prep: 'prep', rehearsal: 'prep', assign: 'choice', mini: 'mini' };
    const at = AT[spec.from] || step;
    /* THE WALKTHROUGH IS THE WORST-REPEATING BEAT IN THE SHOW, and it is
       arithmetic: four variants, fired once per queen, ten times on a
       thirteen-queen night. The draw exhausts and falls back to any line, so
       one paragraph printed VERBATIM SIX TIMES in a single prep room — and
       it was the wrong paragraph anyway, describing "what she is building"
       over a Snatch Game, where nothing is built.
       So it takes the family's own note pool when one is written, keyed the
       same way the performance is. Everything else in this renderer is a
       one-or-two-fire event and keeps the shared pool. */
    const familyLines = ev.type === 'walkthrough' ? walkthroughLinesFor(family)
      : ev.type === 'help' ? helpLinesFor(family)
        : ev.type === 'sabotage' ? sabotageLinesFor(family)
          : ev.type === 'shunned' ? shunnedLinesFor(family)
            : null;
    /* ── AN EVENT WITH NO PROSE EMITS NO SCENE ──
       `pick` on an empty pool returns nothing and `fill` makes that an empty
       string, so an event whose lines are not written yet pushed a card with
       no words in it — visible on screen as a blank row and invisible to any
       guard that counts scenes instead of reading them. Measured on the first
       episode of the rebuilt Rumix: three blank narration scenes, one per
       unwritten event that happened to fire.
       Skipping is right rather than falling back to another event's words:
       the MECHANICAL effect has already been applied by `applyEvents`, so
       what is lost is the sentence about it and not the thing itself, and a
       different event's sentence would be a lie about what happened.
       This is the same rule the beat emitters above already keep — see the
       `if (!t.lines || !t.lines.length) return;` in both of them. */
    const pool = familyLines || spec.lines;
    if (!pool || !pool.length) continue;
    scenes.push({
      step: at,
      kind: `maxi:${ev.type}`,
      data: {
        event: ev.type, players: who, note: spec.note, from: spec.from,
        ...(familyLines ? { family, voiced: true } : {}),
      },
      text: familyLines
        ? fill(pick(familyLines, rng, used, `${ev.type}/${family}`), { a: who[0], b: who[1] })
        : fill(pick(spec.lines, rng, used, ev.type), { a: who[0], b: who[1] }),
    });
  }
  return scenes;
}

export { dragOf };
