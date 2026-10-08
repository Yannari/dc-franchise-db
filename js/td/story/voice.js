// ══════════════════════════════════════════════════════════════════════
// td/story/voice.js — how a camper talks: every line in their own voice
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "respect character voices, I want to hear them in every conversation"
// — "personality, archetype, stats, age, etc." Every roster character has an AUTHORED voice
// ("Lovable, food-obsessed goofball…", "Sarcastic, lazy bookworm. Deadpan and witty…") and many
// a personality; on top of that the archetype, the nine stats and the authored age.
//
// voiceOf(name) reads all of it into an ordered list of tags, the strongest first (the authored
// words lead: they are how the writer of the character described them). A pool line can carry
// variants keyed by tag (`v: { dry: "...", loud: "..." }`); the speaker's first tag that has a
// variant is the one they say (write.js). An entry can also ask for a tag (`when: { voice }`).
// Narrative text selection only: nothing here touches the game.
import { players } from '../../core.js';
import { pStats } from '../../players.js';
import { ageOf } from '../script/facts.js';

import { WORDS, readVoiceText } from './voice-words.js';
// tag ← archetype (when the authored words have not already said it)
const ARCH = {
  villain: ['cruel', 'schemer'], mastermind: ['schemer', 'calm'], schemer: ['schemer'], hothead: ['loud', 'blunt'],
  'challenge-beast': ['competitive'], 'social-butterfly': ['warm'], 'loyal-soldier': ['earnest'], wildcard: ['chaotic'],
  'chaos-agent': ['chaotic', 'loud'], floater: ['calm'], underdog: ['earnest', 'anxious'], hero: ['earnest', 'warm'],
  goat: ['ditzy'], 'perceptive-player': ['dry', 'calm'], showmancer: ['flirty', 'warm'],
};

const cache = new Map();
/** The ordered voice tags of a camper. Cached per season cast. */
export function voiceOf(name) {
  if (!name) return [];
  const p = players.find(x => x.name === name);
  const key = `${name}|${p?.voice || ''}|${p?.archetype || ''}|${(p?.voiceTags || []).join(',')}`;
  if (cache.has(key)) return cache.get(key);
  // the author's hashtags (#loud) and hand-set tags first, then the words of the authored voice
  const read = readVoiceText(`${p?.voice || ''} ${p?.personality || ''}`);
  const own = (Array.isArray(p?.voiceTags) ? p.voiceTags : []).filter(t => VOICE_TAGS.includes(t));
  const tags = [...own, ...read.hash.filter(t => !own.includes(t))];
  for (const t of read.words) if (!tags.includes(t)) tags.push(t);
  for (const t of ARCH[p?.archetype] || []) if (!tags.includes(t)) tags.push(t);
  // the stats as behaviour: what the number says about how they talk
  let s = {}; try { s = pStats(name) || {}; } catch { s = {}; }
  if ((s.temperament ?? 5) <= 3 && !tags.includes('loud')) tags.push('loud');
  if ((s.temperament ?? 5) >= 8 && !tags.includes('calm')) tags.push('calm');
  if ((s.boldness ?? 5) >= 8 && !tags.includes('blunt')) tags.push('blunt');
  if ((s.boldness ?? 5) <= 3 && !tags.includes('anxious')) tags.push('anxious');
  if ((s.social ?? 5) >= 8 && !tags.includes('warm')) tags.push('warm');
  if ((s.mental ?? 5) >= 8 && !tags.includes('nerdy')) tags.push('nerdy');
  if ((s.strategic ?? 5) >= 8 && !tags.includes('schemer')) tags.push('schemer');
  // the authored age: a teenager and a forty-year-old do not talk alike
  const age = ageOf(name);
  if (age != null) tags.push(age < 20 ? 'teen' : age >= 35 ? 'grown' : 'adult');
  cache.set(key, tags);
  return tags;
}

/** Every tag a line may key a variant on (the tests check pools against it). */
export const VOICE_TAGS = [...WORDS.map(([t]) => t), 'teen', 'adult', 'grown'];

/** The variant of a turn this speaker says: their strongest tag that has one, else the line itself. */
export function voiced(turn, speaker) {
  const v = turn.v;
  if (!v || !speaker) return turn.say || turn.conf;
  for (const t of voiceOf(speaker)) if (v[t]) return v[t];
  return turn.say || turn.conf;
}
