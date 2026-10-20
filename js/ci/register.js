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
//   chill   laid-back, slangy, nothing is a big deal (the surfer and party bros)
//   calm    composed and unhurried, full sentences, no slang (a mentor, a peacemaker)
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
export const ALL_REGISTERS = [...REGISTERS, 'goofy', 'shy', 'chill', 'calm', 'catty', 'diva', 'stoic'];
/** The registers a voice can name outright with a hashtag, in the Circle only ("#diva", "#calm"): the ones Total
 *  Drama's voice words have no tag for. (#calm is one of theirs, and reads as calm unless the words are laid-back.) */
export const CIRCLE_VOICE_TAGS = ['chill', 'catty', 'diva', 'stoic', 'hype', 'formal', 'shy'];

// Every voice tag (td/story/voice-words.js WORDS) and where it types on its own. Read against the roster (2026-10-19),
// a tag on its own still misplaces some voices, so the tags around it decide too (inContext below):
//   calm      calm (composed, unhurried), unless it is the laid-back kind, with the words to prove it (surfer, party
//             or rocker bro, slacker, stoner): chill; or a brainy one: formal. The user, 2026-10-20: "all calm people
//             don't say dude every sentence"
//   quiet     confident-quiet is stoic (B, Chase, Hicks), but quiet AND nervous or soft is shy (Maggy, Drew)
//   proud     the vain and condescending are catty, but a tough one (Duncan) is blunt
//   theatrical  a diva, unless the voice is a silly one (food, goofy, ditzy): goofy
//   food      goofy, unless it is a warm voice that feeds people (a doting grandmother): warm
export const VOICE_REGISTER = {
  warm: 'warm', earnest: 'warm', emotional: 'warm',
  flirty: 'flirty',
  dry: 'dry',
  nerdy: 'formal', schemer: 'formal',
  calm: 'chill',
  loud: 'hype', competitive: 'hype',
  blunt: 'blunt', tough: 'blunt', bossy: 'blunt',
  cruel: 'catty', proud: 'catty',
  theatrical: 'diva',
  goofy: 'goofy', ditzy: 'goofy', food: 'goofy', chaotic: 'goofy',
  anxious: 'shy',
  quiet: 'stoic',
};
const LAID_BACK = /\b(bro|dude|surfer|stoner|slacker|rocker|party|laid[- ]back|goes with the flow|vibes?)\b/i;
function inContext(t, has, text = '') {
  if (t === 'calm') return has('nerdy') ? 'formal' : LAID_BACK.test(text) ? 'chill' : 'calm';
  if (t === 'quiet') return has('anxious') || has('warm') || has('emotional') ? 'shy' : 'stoic';
  if (t === 'proud') return has('tough') ? 'blunt' : 'catty';
  if (t === 'theatrical') return has('goofy') || has('food') || has('ditzy') ? 'goofy' : 'diva';
  if (t === 'food') return has('warm') && !has('goofy') ? 'warm' : 'goofy';
  return VOICE_REGISTER[t];
}

const PLAYS = new Set(['schemer']);
/** The register an authored voice says, or null: the author's hashtags and hand-set tags first, then its words. */
export function voiceRegister(p) {
  const raw = p?.voiceText || [p?.voice, p?.personality].filter(Boolean).join(' ');
  // A Circle voice named outright ("#calm", "#diva") is the register, whatever else the words say.
  const own = String(raw).toLowerCase().match(new RegExp(`#(${CIRCLE_VOICE_TAGS.join('|')})\\b`));
  if (own) return own[1];
  const read = readVoiceText(raw);
  const tags = [...(Array.isArray(p?.voiceTags) ? p.voiceTags : []), ...read.hash, ...read.words].filter(t => !(read.off || []).includes(t));
  // (schemer says how somebody plays, not how they type: it decides only when the voice says nothing else. Heather is
  // "manipulative" first and "cruel" next, and types cruel)
  const typed = tags.filter(t => VOICE_REGISTER[t] && !PLAYS.has(t));
  const t = typed[0] || tags.find(x => VOICE_REGISTER[x]);
  return t ? inContext(t, x => tags.includes(x), raw) : null;
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
