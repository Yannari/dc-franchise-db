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
//   goofy   "wait what were we talking about, I'm eating cereal"
//   shy     "um. sorry if this is weird"
// The roster's AUTHORED voice decides first (the same words Total Drama reads, td/story/voice-words.js: every
// one of its tags has a register here, VOICE_REGISTER); then an authored chatVoice.register; then archetype,
// stats and age for a player nobody wrote a voice for (the user, 2026-10-19: "make sure each finds its fit
// everywhere"). Goofy and shy come only from an authored voice: a voice the stats can't describe.
// This picks words, not outcomes: nothing in the engine reads it (the cover's register gap aside, cover.js).
import { peopleOf } from './state.js';
import { readVoiceText } from '../td/story/voice-words.js';

/** The six a stats-only player, or a persona's job, can have. */
export const REGISTERS = ['warm', 'hype', 'dry', 'formal', 'flirty', 'blunt'];
/** ...and the two only an authored voice reaches: every register a line can be written for. */
export const ALL_REGISTERS = [...REGISTERS, 'goofy', 'shy'];

// Every voice tag (td/story/voice-words.js WORDS) and where it types. Their families (td/story/voice-family-map.js)
// mostly agree: soft is warm or flirty, dry is dry or formal, loud is hype, sharp is blunt or formal, odd is goofy;
// the two quiet ones of the soft and dry families (anxious, quiet) are shy.
export const VOICE_REGISTER = {
  warm: 'warm', earnest: 'warm', emotional: 'warm',
  flirty: 'flirty',
  dry: 'dry',
  calm: 'formal', nerdy: 'formal', schemer: 'formal',
  loud: 'hype', competitive: 'hype',
  blunt: 'blunt', cruel: 'blunt', tough: 'blunt', bossy: 'blunt', proud: 'blunt',
  goofy: 'goofy', ditzy: 'goofy', food: 'goofy', theatrical: 'goofy', chaotic: 'goofy',
  quiet: 'shy', anxious: 'shy',
};

const PLAYS = new Set(['schemer']);
/** The register an authored voice says, or null: the author's hashtags and hand-set tags first, then its words. */
export function voiceRegister(p) {
  const read = readVoiceText(p?.voiceText || [p?.voice, p?.personality].filter(Boolean).join(' '));
  const tags = [...(Array.isArray(p?.voiceTags) ? p.voiceTags : []), ...read.hash, ...read.words].filter(t => !(read.off || []).includes(t));
  // (schemer says how somebody plays, not how they type: it decides only when the voice says nothing else. Heather is
  // "manipulative" first and "cruel" next, and types cruel)
  const typed = tags.filter(t => VOICE_REGISTER[t] && !PLAYS.has(t));
  const t = typed[0] || tags.find(x => VOICE_REGISTER[x]);
  return t ? VOICE_REGISTER[t] : null;
}

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
  if (ALL_REGISTERS.includes(p?.chatVoice?.register)) return p.chatVoice.register;
  const authored = voiceRegister(p);
  if (authored) return authored;
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
