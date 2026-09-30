// ci/register.js — how a player types (Plan 3a+ Task 14, layer 1).
//
// Every player has a register, so two players with nothing authored still
// answer the same moment differently:
//   warm    "sending love, how are you really"
//   hype    "LET'S GOOO"
//   dry     "sure. great. love that for us"
//   formal  full sentences, no slang
//   flirty  "hey you"
//   blunt   "I don't trust you. Next."
// Derived from archetype, stats and age; an authored chatVoice.register wins.
// This picks words, not outcomes: nothing in the engine reads it.
import { peopleOf } from './state.js';

export const REGISTERS = ['warm', 'hype', 'dry', 'formal', 'flirty', 'blunt'];

const LEAN = {
  warm: ['social-butterfly', 'hero', 'loyal-soldier', 'underdog', 'goat'],
  hype: ['challenge-beast', 'chaos-agent', 'wildcard'],
  dry: ['perceptive-player', 'floater', 'mastermind'],
  formal: ['mastermind', 'loyal-soldier'],
  flirty: ['showmancer'],
  blunt: ['hothead', 'villain', 'schemer'],
};

/** One person's register. */
export function registerOfPerson(p) {
  if (REGISTERS.includes(p?.chatVoice?.register)) return p.chatVoice.register;
  const s = k => p?.stats?.[k] ?? 5;
  const age = p?.age ?? 28;
  const arch = r => (LEAN[r].includes(p?.archetype) ? 1 : 0);
  const score = {
    warm: s('social') * 0.4 + s('loyalty') * 0.4 + s('temperament') * 0.2 + arch('warm') * 1.5,
    hype: s('boldness') * 0.7 + s('social') * 0.3 - s('temperament') * 0.2 + (age < 28 ? 1 : 0) + arch('hype') * 2.5,
    dry: s('intuition') * 0.5 + (10 - s('social')) * 0.4 + (10 - s('boldness')) * 0.2 + arch('dry') * 2.5,
    formal: s('mental') * 0.5 + s('temperament') * 0.3 + (10 - s('boldness')) * 0.2 + (age >= 35 ? 2 : age >= 30 ? 0.8 : 0) + arch('formal') * 2,
    flirty: s('social') * 0.45 + s('boldness') * 0.45 + (age < 30 ? 0.8 : 0) + arch('flirty') * 5,
    blunt: s('boldness') * 0.4 + (10 - s('temperament')) * 0.6 + arch('blunt') * 2.5,
  };
  return REGISTERS.reduce((best, r) => (score[r] > score[best] ? r : best), REGISTERS[0]);
}

/** A profile's register: the one typing (a shared profile has two voices). */
export function registerOf(state, handle, who = null) {
  const names = who && state.people[who] ? [who] : peopleOf(state, handle);
  if (!names.length) return 'warm';
  return registerOfPerson(state.people[names[0]]);
}

// Nicknames (an authored chatVoice.nicknames: true for the house patterns, or
// the author's own, with {name}). One per person, kept for the season.
const NICKS = { f: ['{name}-girl', 'Miss {name}', 'Lil {name}', '{name}-bear'], m: ['{name}-o', 'Big {name}', 'Lil {name}', '{name}-man'],
  nb: ['{name}-bear', 'Lil {name}', '{name}-o'] };
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function nicknameFor(state, person, handle) {
  const cv = state.people[person]?.chatVoice;
  const shown = state.profiles[handle]?.shown;
  if (!cv?.nicknames || !shown?.name) return null;
  const mine = ((state.nicknames ||= {})[person] ||= {});
  if (!mine[handle]) {
    const patterns = Array.isArray(cv.nicknames) ? cv.nicknames : NICKS[shown.gender] || NICKS.nb;
    mine[handle] = patterns[hash(person + handle) % patterns.length].replace('{name}', shown.name);
  }
  return mine[handle];
}
