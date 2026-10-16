// ══════════════════════════════════════════════════════════════════════
// ch/mind.js — what is going on inside each player
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.5. Emotions are state, not flavour: five meters move every day and
// every decision reads them proportionally. All 0-10.
//
//   energy      dailies, the Arena, nights out drain it; rest brings it back.
//               It scales performance: a beast on a third straight
//               elimination comes in tired, which is how upsets happen.
//   confidence  wins raise it, losses and being voted in lower it. Under
//               pressure low temperament + low confidence chokes, boldness
//               gives clutch (performanceMod).
//   paranoia    votes against you, whispers, allies talking without you.
//   morale      the general mood; a loss or a breakup drops it.
//   homesick    grows over a long season, faster for low endurance and
//               temperament; a call home eases it. Drives the quit risk.
//
// Plus each player's need for the season, read once from who they are, as in
// Total Drama's td/story/psyche.js (belong, prove, control, protect, temper,
// redemption, home): the story layer gives it a scene, and it tilts choices
// (a `prove` player calls out the strongest; a `home` player quits sooner).
import { S, archetypeOf, clamp, injuryOf } from './state.js';
import { getBond } from '../bonds.js';

const NEED_OF_ARCH = {
  'challenge-beast': 'prove', underdog: 'prove', hero: 'protect', 'loyal-soldier': 'protect',
  mastermind: 'control', schemer: 'control', villain: 'control', hothead: 'temper',
  'chaos-agent': 'temper', 'social-butterfly': 'belong', floater: 'belong', goat: 'belong',
  showmancer: 'belong', wildcard: 'prove', 'perceptive-player': 'control',
};

// Each player's fear, read once from who they are (the user, 2026-10-15: "fear factor type" dailies). Which
// thing they fear is drawn from the seed; how much it grips them is their boldness and temperament. A fear
// daily tests it: a big fear freezes them, and beating it in front of everybody is a moment.
export const FEARS = ['heights', 'deep water', 'tight spaces', 'the dark', 'creepy crawlies', 'gross food'];
function fearFor(state, name) {
  let h = 2166136261;
  for (const c of `${state.seed}|fear|${name}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return { of: FEARS[(h >>> 0) % FEARS.length],
    size: clamp(0.15 + (10 - S(name, 'boldness')) * 0.06 + (10 - S(name, 'temperament')) * 0.025, 0.1, 0.95) };
}
export const fearOfThing = (state, name, thing) => (state.fears?.[name]?.of === thing ? state.fears[name].size : 0);

export function initMind(state, name) {
  (state.fears ||= {})[name] = fearFor(state, name);
  state.mind[name] = {
    energy: 8 + S(name, 'endurance') * 0.2,
    confidence: 4 + S(name, 'boldness') * 0.3 + S(name, 'physical') * 0.15 + (state.rookie[name] ? -0.8 : 0.4),
    paranoia: 1 + (10 - S(name, 'temperament')) * 0.15 + S(name, 'intuition') * 0.1,
    morale: 6 + S(name, 'temperament') * 0.15,
    homesick: 0.5 + (10 - S(name, 'endurance')) * 0.08,
  };
  for (const k of Object.keys(state.mind[name])) state.mind[name][k] = clamp(state.mind[name][k], 0, 10);
  // A returnee who lost last time wants redemption; otherwise the archetype's need.
  const lostLast = state.rep[name]?.lastPlacementShare != null && state.rep[name].lastPlacementShare > 0.5;
  state.psyche[name] = lostLast && !state.rookie[name] ? 'redemption' : (NEED_OF_ARCH[archetypeOf(name)] || 'prove');
}

export function nudge(state, name, key, d) {
  const m = state.mind[name];
  if (!m) return;
  m[key] = clamp(m[key] + d, 0, 10);
}

// One night's sleep and one day's wear. `rested` is false on a party night or
// the overnight stage.
export function driftDay(state, name, { rested = true } = {}) {
  const m = state.mind[name];
  if (!m) return;
  nudge(state, name, 'energy', rested ? 1.2 + S(name, 'endurance') * 0.12 : -0.8);
  // Homesickness: a long season, a lonely house.
  const close = state.active.filter(o => o !== name && getBond(name, o) >= 4).length;
  const lonely = close === 0 ? 0.12 : 0;
  nudge(state, name, 'homesick', 0.05 + (10 - S(name, 'endurance')) * 0.012 + (10 - S(name, 'temperament')) * 0.008 + lonely
    - (state.psyche[name] === 'prove' ? 0.03 : 0));
  // Moods drift back toward the middle.
  nudge(state, name, 'confidence', (5.5 - m.confidence) * 0.05);
  nudge(state, name, 'paranoia', (2 - m.paranoia) * 0.08);
  nudge(state, name, 'morale', (6 - m.morale) * 0.06 - m.homesick * 0.015);
}

// A performance multiplier, around 1: energy, confidence, and how they hold up
// under pressure (`pressure` 0..1, the Arena is 1).
export function performanceMod(state, name, pressure = 0.5) {
  const m = state.mind[name];
  if (!m) return 1;
  const energy = 0.82 + m.energy * 0.022;                  // 0.82 .. 1.04
  const conf = 0.94 + m.confidence * 0.012;                // 0.94 .. 1.06
  // Low confidence and low temperament choke; boldness steadies.
  const nerve = (S(name, 'temperament') * 0.5 + S(name, 'boldness') * 0.3 + m.confidence * 0.2) / 10; // 0..1
  const press = 1 - pressure * (0.5 - nerve) * 0.16;       // +/- 8% at full pressure
  // playing hurt (stakes.js): 6% a knock, 12% a sprain, 18% a tear, until it heals
  const inj = injuryOf(state, name);
  return energy * conf * press * (inj ? 1 - inj.sev * 0.06 : 1);
}
