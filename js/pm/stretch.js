// ══════════════════════════════════════════════════════════════════════
// pm/stretch.js — the episodes up to the next fire pit, and what they're about
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-30: the season is "boring, not imaginative, super
// repetitive, a chore to finish". Read beside a hand-written rewrite of the
// same episodes, the difference was shape: the engine followed ~44 stories a
// season, two new ones an episode, and let them stop without an answer
// (Sophie pulled Jordan in episodes 10, 18 and 23; nothing changed). A real
// stretch of the show is ONE story and one or two smaller ones, and the fire
// pit answers them (docs/superpowers/specs/2026-10-30-pm-stretch-payoff-design.md).
//
// A STRETCH runs from the episode after one exit night to the next. Its plan:
//   a   the main story (a thread id) — the one the fire pit answers last
//   b,c the smaller ones
// chosen from the live threads (pm/threads.js) by what they put at stake. The
// rest of the villa's threads still move (their state is the engine's) but
// play in the background: a beat an episode at most.
//
// The plan decides what the SCREEN follows. It never decides a result: who
// picks whom is recoupling.js desire(), unchanged.
import { romance } from './feelings.js';
import { partnerOf, makeEvent } from './events.js';
import { getBond, addBond } from '../bonds.js';
import { feel } from './emotions.js';

/** The nights somebody can leave on: a stretch ends on one. */
export const EXIT_MOMENTS = new Set(['recoupling', 'public-vote', 'stick-or-twist', 'semi-final', 'final']);
export const exitNight = entry => !!entry && EXIT_MOMENTS.has(entry.moment);

const ROLES = ['a', 'b', 'c'];
const STAKES = { graft: 0.6, doubt: 0.6, secret: 0.6, rekindle: 0.3, spark: 0.1, progress: 0 };

const castOf = t => ({ graft: [t.c, t.t, t.p], doubt: [t.a, t.p], secret: [t.w, t.x, t.p], progress: [t.a, t.b], spark: [t.a, t.b], rekindle: [t.a, t.b] }[t.type] || []).filter(Boolean);
const live = state => (state.threads || []).filter(t => !t.over);
const byId = (state, id) => (state.threads || []).find(t => t.id === id) || null;

/**
 * What a story puts at stake, proportional in every term: its heat, a couple
 * it threatens, how long the villa has lived with it unanswered, and how
 * close its people are to being left standing (a cold couple).
 */
export function storyScore(state, t) {
  const cast = castOf(t);
  const cold = Math.max(0, ...cast.map(n => {
    const p = partnerOf(state, n);
    return p ? 1 - Math.min(romance(n, p), romance(p, n)) / 10 : 0;
  }));
  const running = Math.min(4, Math.max(0, state.ep - t.ep));
  // A story the last stretch followed and its fire pit couldn't answer (a vote
  // night has no picks) carries: the next stretch picks it up first.
  const carried = state.planned?.[t.id] ? 1 : 0;
  return (t.heat || 0) + (STAKES[t.type] ?? 0) + 0.2 * running + 0.4 * cold + 0.1 * Math.min(3, cast.length) + carried;
}

/** The plan's live thread ids, A first. */
export function planIds(state) {
  const s = state.stretch;
  if (!s || s.off) return [];
  return ROLES.map(r => s[r]).filter(id => id && byId(state, id) && !byId(state, id).over);
}

/** 'a' | 'b' | 'c' for a thread in the plan, else null. */
export function roleOf(state, id) {
  const s = state.stretch;
  if (!s || s.off) return null;
  return ROLES.find(r => s[r] === id) || null;
}

// Two stories about exactly the same people are one story.
const sameCast = (x, y) => { const a = castOf(x), b = castOf(y); return a.length === b.length && a.every(n => b.includes(n)); };

function choose(state, keep = {}) {
  const pool = live(state).filter(t => state.villa.includes(castOf(t)[0]))
    .map(t => [t, storyScore(state, t)]).sort((x, y) => y[1] - x[1]).map(([t]) => t);
  const picked = [];
  for (const r of ROLES) {
    const kept = keep[r] && byId(state, keep[r]);
    if (kept && !kept.over && !picked.some(p => sameCast(p, kept))) { picked.push(kept); continue; }
    // The main story is one with a couple at stake when the villa has one.
    const fits = r === 'a' ? pool.filter(t => (STAKES[t.type] ?? 0) >= 0.3) : pool;
    const t = (fits.length ? fits : pool).find(x => !picked.includes(x) && !picked.some(p => sameCast(p, x)));
    if (t) picked.push(t); else picked.push(null);
  }
  return Object.fromEntries(ROLES.map((r, i) => [r, picked[i]?.id || null]));
}

/**
 * At the start of an episode's day (threads.js beginThreads, after the
 * openers): a new plan when the last stretch's fire pit has been, the main
 * story replaced when it is over, and B and C refreshed by what is live.
 * `nextExit`: the episode of the next exit night (season.js).
 */
export function planStretch(state, entry, nextExit) {
  const moment = entry?.moment;
  // Nothing set up yet on night one; Casa Amor is its own story (its
  // temptations are the texture); after the final recoupling, the
  // couples-only week is the couples.
  const off = moment === 'first-coupling' || moment === 'final' || moment === 'reunion' || !!state.split || !!state._afterFinalRecoupling;
  const old = state.stretch;
  if (off) {
    state.stretch = { from: state.ep, ceremony: nextExit ?? state.ep, off: true, a: null, b: null, c: null, answers: old?.answers || {} };
    return state.stretch;
  }
  const fresh = !old || old.off || state.ep > old.ceremony;
  const keep = fresh ? {} : { a: old.a, b: old.b, c: old.c };
  const picked = choose(state, keep);
  state.stretch = {
    from: fresh ? state.ep : old.from, ceremony: nextExit ?? state.ep, off: false, ...picked,
    answers: fresh ? {} : old.answers || {},
    // Every thread this stretch has had in its plan (one replaced mid-stretch still gets its answer).
    seen: [...new Set([...(fresh ? [] : old.seen || []), ...ROLES.map(r => picked[r]).filter(Boolean)])],
  };
  for (const id of state.stretch.seen) (state.planned ||= {})[id] = state.planned[id] || state.ep;
  return state.stretch;
}

// ── the fire pit answers it ───────────────────────────────────────────
// A thread any stretch has followed can't fade (threads.js settle reads this):
// the villa lives with it until a night that answers it.
export function held(state, t) {
  // A story the screen has followed waits for a fire pit to answer it (answerStretch),
  // through Casa Amor and across a vote night that couldn't.
  return !!state.planned?.[t.id];
}

/** How near the fire pit is, 0 at the start of the stretch to 1 on the night. */
export function closeness(state) {
  const s = state.stretch;
  if (!s || s.off) return 0;
  return Math.max(0, Math.min(1, 1 - (s.ceremony - state.ep) / (s.ceremony - s.from + 1)));
}

const friendOf = (state, n, not) => state.villa
  .filter(o => o !== n && !not.includes(o) && state.profiles[o]?.gender === state.profiles[n]?.gender)
  .sort((x, y) => getBond(n, y) - getBond(n, x))[0] || null;

/**
 * The answer to each of the plan's stories still open on the night of its
 * fire pit — said by what the night did, never decided here — and a scene for
 * every answer the fire pit itself didn't show (a vote night has no picks;
 * a graft whose target simply stayed put has no moment of its own).
 * Returns the debrief scenes. Secrets nobody told carry into the next stretch,
 * with the one keeping it saying why.
 */
export function answerStretch(state, rng, entry, m) {
  const s = state.stretch;
  if (!s || s.off || state.ep !== s.ceremony) return [];
  // A night with no picks can't answer who ends up with whom: while a
  // recoupling is still to come, a chase, a doubt or a spark carries to it.
  const picksTonight = entry?.moment === 'recoupling' || !state._recouplingAhead;
  const night = (m?.events || []).filter(e => e.kind === 'recouple-pick' || e.kind === 'recouple-refused');
  const shown = (...ns) => night.some(e => ns.every(n => e.players.slice(0, 2).includes(n)));
  const out = [];
  // Every answer moves something (CLAUDE.md): the couple it tested, the friend
  // who heard it, the one who kept quiet.
  const EFFECT = {
    'graft-won': ([a, b]) => addBond(a, b, 0.5),
    'graft-stayed': ([a, b, c]) => { addBond(a, b, 0.6); addBond(a, c, -0.3); feel(state, b, 'security', 0.5); },
    'graft-apart': ([a, f]) => { addBond(a, f, 0.3); feel(state, a, 'confidence', -0.3); },
    'doubt-recommit': ([a, b]) => { addBond(a, b, 0.5); feel(state, b, 'security', 0.4); },
    'doubt-ended': ([a, f, x]) => { addBond(a, f, 0.4); addBond(f, x, -0.3); },
    kept: ([w]) => feel(state, w, 'guilt', 0.6),
  };
  const scene = (kind, players, of, role, more = {}) => {
    EFFECT[of]?.(players);
    const e = makeEvent(state, rng, { phase: 'debrief', kind, players, aired: true,
      extra: { pop: { [players[0]]: { approval: 0.1, fame: 0.5 } }, of, stretch: role, ...more } });
    out.push(e);
  };
  // This stretch's stories, and any an earlier stretch carried here.
  const ids = [...new Set([...(s.seen || []), ...Object.keys(state.planned || {})])];
  for (const id of ids) {
    const t = (state.threads || []).find(x => x.id === id);
    if (!t || t.over) continue;
    const role = roleOf(state, id) || 'c';
    const here = n => state.villa.includes(n);
    if (!picksTonight && t.type !== 'secret' && t.type !== 'progress') { s.answers[id] = 'carried'; continue; }
    if (t.type === 'graft') {
      const why = partnerOf(state, t.t) === t.c ? 'won' : partnerOf(state, t.t) === t.p ? 'stayed' : 'apart';
      closeIt(state, t, why);
      if (why === 'won' && here(t.c) && !shown(t.c, t.t)) scene('stretch-answer', [t.c, t.t], 'graft-won', role);
      if (why === 'stayed' && here(t.t) && here(t.p) && !shown(t.t, t.p)) scene('stretch-answer', [t.t, t.p, t.c], 'graft-stayed', role);
      if (why === 'apart' && here(t.c)) { const f = friendOf(state, t.c, [t.t, t.p]); if (f) scene('stretch-answer', [t.c, f, t.t], 'graft-apart', role); }
    } else if (t.type === 'doubt') {
      const why = partnerOf(state, t.a) === t.p ? 'recommit' : 'ended';
      closeIt(state, t, why);
      if (here(t.a) && here(t.p) && why === 'recommit' && !shown(t.a, t.p)) scene('stretch-answer', [t.a, t.p], 'doubt-recommit', role);
      if (here(t.p) && why === 'ended') { const f = friendOf(state, t.p, [t.a]); if (f) scene('stretch-answer', [t.p, f, t.a], 'doubt-ended', role); }
    } else if (t.type === 'secret') {
      // Nobody told: it carries, and the one keeping it says why on camera.
      // What it was, and who with, so the keeping says it (talk/stretch.js SECRET_KEPT).
      const sec = (state.secrets || []).find(z => z.id === t.sec);
      if (here(t.w) && here(t.p)) scene('secret-kept', [t.w, t.p, t.x], 'kept', role, { sec: sec?.kind || null, with: sec?.with && state.villa.includes(sec.with) ? sec.with : null });
    } else {
      const [a, b] = [t.a, t.b];
      const why = partnerOf(state, a) === b ? 'together' : 'apart';
      closeIt(state, t, why);
    }
    s.answers[id] = t.over ? t.why : 'carried';
  }
  return out;
}
function closeIt(state, t, why) { t.over = true; t.why = why; t.endEp = state.ep; }
