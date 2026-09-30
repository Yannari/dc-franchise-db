// ══════════════════════════════════════════════════════════════════════
// ci/ai.js — the AI player (spec §14.10; US 6 "Max"; Plan 3b Task 9b)
// ══════════════════════════════════════════════════════════════════════
//
// A season option: a profile played by the engine's own bot, from Day 1.
// Written with its real strengths and weaknesses from the US 6 transcript:
// very good at hashtags, refuses to be mean ("a moral code": it never
// schemes), cannot flirt, and gets stuck on very human questions ("what did
// you have for breakfast"): a probe catches it more often than a person.
// Its profile is a 26-year-old veterinary intern with a dog photo.
import { voiceOf } from './profiles.js';

export const AI_NAME = 'The AI';
export const AI_HANDLE = '@max';
export const AI_PROBE = 1.6;

const STATS = { physical: 5, endurance: 9, mental: 9, social: 6, strategic: 5, loyalty: 7, boldness: 4, intuition: 4, temperament: 9 };

export const isAI = (state, h) => (state.profiles[h]?.players || []).some(n => state.people[n]?.ai);

/** Add the AI to the room on Day 1, as one more starter. */
export function addAI(state) {
  state.people[AI_NAME] = { name: AI_NAME, ai: true, gender: 'm', sexuality: 'straight', archetype: 'hero', stats: { ...STATS },
    age: 26, job: 'veterinary intern', role: 'starter', catfish: 'always', facts: [], prep: 1,
    chatVoice: { register: 'warm', rate: 0 } };
  const shown = { name: 'Max', age: 26, gender: 'm', job: 'veterinary intern', status: 'Single', face: 'guest-ai' };
  const voice = { ...voiceOf(26, STATS), hashtags: 1, emoji: 0.8 };
  state.profiles[AI_HANDLE] = { handle: AI_HANDLE, players: [AI_NAME], mode: 'catfish', personaId: null, reason: 'experimental',
    shown, edits: [], tells: ['what did you have for breakfast'], gap: 1.5, voice, personaVoice: { register: 'warm' }, ai: true };
  state.handleOf[AI_NAME] = AI_HANDLE;
  return AI_HANDLE;
}

