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
import { dragOf } from './queen.js';
import { canScheme } from './rules.js';

/** Where the cuts fall, as a fraction of the queens who walked. */
const RUNWAY_TIERS = [
  [0.15, 'stunning'], [0.40, 'strong'], [0.75, 'fine'], [0.92, 'weak'], [1.01, 'disaster'],
];
const LIPSYNC_TIERS = [[0.25, 'legendary'], [0.60, 'strong'], [0.85, 'trying'], [1.01, 'lost']];

const pick = (lines, rng) => (lines && lines.length
  ? lines[Math.floor(rng() * lines.length)] : null);

const fill = (line, { a, b, j }) => (line || '')
  .replace(/\{a\}/g, a || '')
  .replace(/\{b\}/g, b || '')
  .replace(/\{j\}/g, j || '');

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
export function renderStageBeats({
  walking = [], onStage = [], runway = {}, call = {}, reactions = {},
  lipsync = null, exits = [], split = false, judges = [], rng = Math.random,
}) {
  const scenes = [];
  const beatById = id => STAGE_BEATS.find(b => b.id === id);
  const runwayScores = Object.fromEntries(
    walking.filter(n => runway[n]).map(n => [n, runway[n].score]));

  const emit = (beat, tierId, who, extra = {}) => {
    const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
    if (!t) return;
    const j = beat.speaker === 'judge' && judges.length
      ? judges[Math.floor(rng() * judges.length)] : null;
    scenes.push({
      step: beat.step,
      kind: `stage:${beat.id}`,
      data: { beat: beat.id, tier: t.id, players: who, note: t.note, judge: j, ...extra },
      text: fill(pick(t.lines, rng), { a: who[0], b: who[1], j }),
    });
  };

  const callOf = n => (call.win || []).includes(n) ? 'WIN'
    : (call.high || []).includes(n) ? 'HIGH'
      : (call.bottom || []).includes(n) ? 'BTM'
        : (call.low || []).includes(n) ? 'LOW' : 'SAFE';

  // ── the stage opens ──
  emit(beatById('entrance'), 'open', []);

  // ── one walk per queen ──
  const walkBeat = beatById('walk');
  const fitBeat = beatById('walk-fit');
  for (const n of walking) {
    if (!runway[n]) continue;
    emit(walkBeat, tierAt(fractionalRank(n, runwayScores), RUNWAY_TIERS), [n],
      { score: runway[n].score });
    // Only when the fit is notable either way. A look that neither answered
    // nor ignored the category has nothing to say about the category.
    if (runway[n].fit === true) emit(fitBeat, 'on-theme', [n]);
    else if (runway[n].fit === false) emit(fitBeat, 'off-theme', [n]);
  }

  // ── a judge beat and a reaction, per queen still on stage ──
  const critBeat = beatById('critique');
  const reactBeat = beatById('critique-reaction');
  for (const n of onStage) {
    emit(critBeat, callOf(n), [n]);
    if (reactions[n]) emit(reactBeat, reactions[n], [n]);
  }
  emit(beatById('deliberation'), split ? 'split' : 'agreed', []);

  // ── the results ──
  for (const n of call.win || []) emit(beatById('result-win'), 'win', [n]);
  if ((call.safe || []).length) emit(beatById('result-safe'), 'safe', []);
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
  const used = state._drUntuckedUsed instanceof Set
    ? state._drUntuckedUsed
    : (state._drUntuckedUsed = new Set(state._drUntuckedUsedList || []));

  const bottom = new Set(call.bottom || []);
  const callOf = n => (call.win || []).includes(n) ? 'WIN'
    : (call.high || []).includes(n) ? 'HIGH'
      : bottom.has(n) ? 'BTM'
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
        text: fill(pick(chosen.ev.lines, rng), { a: who[0], b: who[1] }),
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

export { dragOf };
