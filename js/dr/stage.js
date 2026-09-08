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
import { MAXI_EVENTS } from './data/maxi-events.js';
import { familyForChallenge } from './data/maxi-performance.js';
import { dragOf } from './queen.js';
import {
  themeFamilyFor, fitTierFor, themeLinesFor, voiceLinesFor,
  swaggerGroupFor, swaggerLinesFor,
} from './data/runway-voices.js';
import { canScheme } from './rules.js';

/** Where the cuts fall, as a fraction of the queens who walked. */
const RUNWAY_TIERS = [
  [0.15, 'stunning'], [0.40, 'strong'], [0.75, 'fine'], [0.92, 'weak'], [1.01, 'disaster'],
];
const LIPSYNC_TIERS = [[0.25, 'legendary'], [0.60, 'strong'], [0.85, 'trying'], [1.01, 'lost']];
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

const fill = (line, { a, b, j, s, c, k } = {}) => (line || '')
  .replace(/\{a\}/g, a || '')
  .replace(/\{b\}/g, b || '')
  .replace(/\{j\}/g, j || '')
  .replace(/\{s\}/g, s || '')
  .replace(/\{c\}/g, c || '')
  .replace(/\{k\}/g, k || '');

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
  const runwayScores = Object.fromEntries(
    walking.filter(n => runway[n]).map(n => [n, runway[n].score]));

  const emit = (beat, tierId, who, extra = {}, said = {}) => {
    if (!beat) return;
    const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
    if (!t) return;
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
    const tierId = seat.guest ? (seat.credit ? 'guest-credited' : 'guest') : seat.id;
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
    const fitId = fitTierFor(r.fit);
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
        scenes.push({
          step: 'critiques',
          kind: 'stage:critique',
          data: {
            beat: 'critique', tier: c.tone, players: [n], note: t.note,
            judge: c.judgeName, reasons: c.reasons, gap: c.gap,
          },
          text: fill(pick(t.lines, rng, usedLines, `critique/${c.tone}`),
            { a: n, j: c.judgeName, s: songTitle }),
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
  emit(beatById('deliberation'), split ? 'split' : 'agreed', []);

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
  for (const n of call.win || []) emit(beatById('result-win'), 'win', [n]);
  for (const n of call.high || []) emit(beatById('result-high'), 'high', [n]);
  for (const n of call.low || []) emit(beatById('result-low'), 'low', [n]);
  for (const n of call.atRisk || []) emit(beatById('result-btm'), 'btm', [n]);
  for (const n of call.bottom || []) emit(beatById('result-bottom'), 'bottom', [n]);

  // ── the lip sync, beat by beat ──
  if (lipsync) {
    emit(beatById('lipsync-intro'), 'intro', [],
      { song: lipsync.song, artist: lipsync.artist });
    const lsBeat = beatById('lipsync-beat');
    const stuntBeat = beatById('lipsync-stunt');
    for (const n of lipsync.queens || []) {
      emit(lsBeat, tierAt(fractionalRank(n, lipsync.scores || {}), LIPSYNC_TIERS), [n],
        { score: lipsync.scores?.[n] });
      const stunt = lipsync.stunts?.[n];
      if (stunt === 'landed' || stunt === 'failed') emit(stuntBeat, stunt, [n]);
    }
    emit(beatById('lipsync-call'), lipsync.call || 'shantay', []);
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
  namedOnStage = [], rng = Math.random, ctx = {}, perPhase = 3,
}) {
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
    for (let i = 0; i < perPhase; i++) {
      const candidates = [];
      for (const ev of UNTUCKED_EVENTS) {
        if (ev.phase !== phase) continue;
        const a = subject(living);
        const others = living.filter(n => n !== a);
        const b = ev.cast === 'pair' ? (others.length ? subject(others) : null) : null;
        if (ev.cast === 'pair' && !b) continue;

        const facts = {
          a: players[a] || null,
          b: b ? players[b] || null : null,
          nameA: a,
          nameB: b,
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

      const who = chosen.facts.nameB
        ? [chosen.facts.nameA, chosen.facts.nameB] : [chosen.facts.nameA];
      scenes.push({
        step: 'untucked',
        kind: `untucked:${chosen.ev.id}`,
        data: {
          event: chosen.ev.id, phase, players: who,
          note: chosen.ev.note, eligible: candidates.length,
        },
        text: fill(pick(chosen.ev.lines, rng, usedLines, chosen.ev.id), { a: who[0], b: who[1] }),
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
  assignment = {}, performances = {}, rng = Math.random,
}) {
  const scenes = [];
  const usedLines = new Set();
  const beatById = id => CHALLENGE_BEATS.find(b => b.id === id);

  const emit = (beat, tierId, who, extra = {}, step = null) => {
    if (!beat) return;
    const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
    if (!t) return;
    scenes.push({
      step: step || beat.step,
      kind: `chal:${beat.id}`,
      data: { beat: beat.id, tier: t.id, players: who, note: t.note, ...extra },
      text: fill(pick(t.lines, rng, usedLines, `${beat.id}/${t.id}`),
        { a: who[0], c: maxi.name }),
    });
  };

  // ── the host arrives and sets the week ──
  emit(beatById('host-arrives'), 'arrival', []);
  emit(beatById('the-brief'), 'brief', [], { challenge: maxi.name });

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
  for (const n of byAptitude.slice(0, REACTING)) {
    emit(beatById('announce-reaction'),
      tierAt(fractionalRank(n, aptitude), APTITUDE_TIERS), [n]);
  }
  for (const n of byAptitude.slice(-1)) {
    if (byAptitude.length > REACTING) emit(beatById('announce-reaction'), 'dreading', [n]);
  }

  // ── the mini ──
  if (mini) {
    emit(beatById('mini-announce'), 'announce', [], { mini: mini.name, buys: mini.buys });
    for (const n of living) {
      if (miniScores[n] === undefined) continue;
      emit(beatById('mini-attempt'), tierAt(fractionalRank(n, miniScores), MINI_TIERS), [n]);
    }
    if (miniWinner) emit(beatById('mini-win'), 'win', [miniWinner], { buys: mini.buys });
  }

  // ── how the room was divided ──
  const kind = (assignment.teams || []).length > 1 ? 'captains'
    : Object.keys(assignment.picks || {}).length ? 'draft' : 'solo';
  emit(beatById('the-division'), kind, []);
  for (const n of living) {
    const p = assignment.picks?.[n];
    if (!p) continue;
    const tierId = String(p.choice || '').startsWith('leftover-') ? 'left-over'
      : p.penalty > 0 ? 'settled'
        : (assignment.order || []).indexOf(n) === (assignment.order || []).length - 1 ? 'picked-last'
          : 'got-it';
    emit(beatById('pick-reaction'), tierId, [n], { choice: p.choice });
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
    scenes.push({
      step,
      kind: `perform:${family.family}`,
      data: {
        family: family.family, tier: tierId, players: [n],
        note: tier.note, perf: performances[n].perf,
      },
      text: fill(pick(tier.lines, rng, usedLines, `${family.family}/${tierId}`), { a: n }),
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
export function renderMaxiEventScenes(events, { step = 'maxi-main', rng = Math.random } = {}) {
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
    const at = spec.from === 'prep' ? 'prep' : step;
    scenes.push({
      step: at,
      kind: `maxi:${ev.type}`,
      data: { event: ev.type, players: who, note: spec.note, from: spec.from },
      text: fill(pick(spec.lines, rng, used, ev.type), { a: who[0], b: who[1] }),
    });
  }
  return scenes;
}

export { dragOf };
