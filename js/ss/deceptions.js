// ══════════════════════════════════════════════════════════════════════
// ss/deceptions.js — who is really talking? The false Voice, Monsieur Robot
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 5 (docs/superpowers/specs/2026-10-28-secret-story-family5-design.md).
//   THE FALSE VOICE (S12): the Voice "retires" and a new voice takes the house for a week, and asks each housemate,
//   alone, for something about their life nobody in there knows. The trusting answer, and give the house a lead on
//   their own secret; the sharp ones smell it and refuse. At the prime the real Voice was never gone: the doubters
//   are paid.
//   MONSIEUR ROBOT (S4): a robot moves in for a week with an eliminated housemate inside. The house guesses who; the
//   robot hears everything. At the prime it is unmasked: the right guesses are paid, and the robot repeats one thing
//   it heard said behind somebody's back.
// Pure: the week's events and the prime's segments, with effects for the adapter (js/bb/secret-story.js).

import { mint } from './kitty.js';
import { secretOf, showClue } from './hunt.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const DECEPTIONS = ['false-voice', 'robot'];

/** This week's deception, if any: once each a season. `state.forceDeception[wk]` = kind | 'none' for tests. */
export function deceptionDue(state, ctx, { house = [], gone = [] } = {}) {
  const wk = ctx.week ?? 0;
  const rng = ctx.rng || Math.random;
  const done = state.deceptions || [];
  const forced = state.forceDeception?.[wk];
  if (forced) return forced === 'none' ? null : forced;
  if (done.some(d => d.week === wk) || house.length < 7) return null;
  const can = DECEPTIONS.filter(k => !done.some(d => d.kind === k) && (k !== 'robot' || gone.length) && wk >= 3 && wk <= 8);
  if (!can.length || rng() > 0.09) return null;
  return can[Math.floor(rng() * can.length) % can.length];
}

/** The false Voice's week: one question each, alone in the confessional. */
export function falseVoiceWeek(state, ctx, { house = [] } = {}) {
  const wk = ctx.week ?? 0;
  const rng = ctx.rng || Math.random;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const asked = [];
  for (const n of house) {
    // the sharper and warier refuse; the trusting answer (and the answer is a lead on their own secret)
    const doubt = clamp(0.1 + S(n, 'intuition') * 0.06 + S(n, 'strategic') * 0.02 - S(n, 'loyalty') * 0.015, 0.05, 0.9);
    const complied = rng() >= doubt;
    let clue = null;
    if (complied && secretOf(state, n) && !secretOf(state, n).found) clue = showClue(state, ctx, { holder: n, how: 'false-voice', house })?.clue || null;
    asked.push({ who: n, complied, clue });
  }
  const doubters = asked.filter(a => !a.complied).map(a => a.who);
  const fooled = asked.filter(a => a.complied).map(a => a.who);
  state.falseVoice = { week: wk, doubters, fooled, revealed: false };
  (state.deceptions ||= []).push({ kind: 'false-voice', week: wk });
  return { kind: 'false-voice', asked, doubters, fooled };
}

/** At the prime: the real Voice never left. The doubters are paid $1,000 each. */
export function revealFalseVoice(state, ctx, { house = [] } = {}) {
  const fv = state.falseVoice;
  const wk = ctx.week ?? 0;
  if (!fv || fv.revealed || fv.week !== wk) return null;
  fv.revealed = true;
  const doubters = fv.doubters.filter(n => house.includes(n));
  for (const n of doubters) mint(state, n, 1000, 'saw through the false Voice', wk);
  const pub = [...doubters.map(n => [n, 'game', 0.2, 'saw through the false Voice']), ...fv.fooled.filter(n => house.includes(n)).slice(0, 3).map(n => [n, 'fun', 0.12, 'fell for the false Voice'])];
  return { kind: 'false-voice', doubters, fooled: fv.fooled.filter(n => house.includes(n)), paid: 1000, pub, effects: { bond: [], pop: [] } };
}

/** Monsieur Robot's week: an eliminated housemate inside; the house guesses; the robot listens. */
export function robotWeek(state, ctx, { house = [], gone = [] } = {}) {
  const wk = ctx.week ?? 0;
  const rng = ctx.rng || Math.random;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  // the most recent to leave, usually: the house still remembers how they walk
  const robot = gone[gone.length - 1 - Math.floor(rng() * Math.min(2, gone.length))] || gone[gone.length - 1];
  if (!robot) return null;
  const guesses = {};
  for (const n of house) {
    const right = rng() < clamp(0.12 + S(n, 'intuition') * 0.05 + Math.max(0, B(n, robot)) * 0.03, 0.05, 0.85);
    guesses[n] = right ? robot : gone.filter(g => g !== robot)[Math.floor(rng() * Math.max(1, gone.length - 1))] || null;
  }
  // what the robot hears: the pair that likes each other least, one talking about the other
  let heard = null;
  for (const a of house) for (const b of house) if (a !== b && (!heard || B(a, b) < B(heard.a, heard.b))) heard = { a, b };
  state.robot = { week: wk, robot, guesses, heard, revealed: false };
  (state.deceptions ||= []).push({ kind: 'robot', week: wk });
  return { kind: 'robot', robot, guesses, heard };
}

/** At the prime: the robot is unmasked. Right guesses paid $1,000; what it heard, repeated. */
export function unmaskRobot(state, ctx, { house = [] } = {}) {
  const r = state.robot;
  const wk = ctx.week ?? 0;
  if (!r || r.revealed || r.week !== wk) return null;
  r.revealed = true;
  const right = Object.entries(r.guesses).filter(([n, g]) => g === r.robot && house.includes(n)).map(([n]) => n);
  const wrong = Object.entries(r.guesses).filter(([n, g]) => g !== r.robot && house.includes(n)).map(([n]) => n);
  for (const n of right) mint(state, n, 1000, `guessed who was inside the robot (${r.robot})`, wk);
  const h = r.heard && house.includes(r.heard.a) && house.includes(r.heard.b) ? r.heard : null;
  const bond = h ? [[h.b, h.a, -1.2]] : [];
  const pub = [[r.robot, 'seen', 0.4, 'came back inside the robot'], [r.robot, 'fun', 0.3, 'came back inside the robot'], ...(h ? [[h.a, 'heat', 0.25, `was caught talking about ${h.b} by the robot`]] : [])];
  return { kind: 'robot', robot: r.robot, right, wrong, heard: h, paid: 1000, pub, effects: { bond, pop: [] } };
}
