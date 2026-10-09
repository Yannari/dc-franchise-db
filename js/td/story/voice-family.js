// ══════════════════════════════════════════════════════════════════════
// td/story/voice-family.js — a voice tag's family, so a line can be written five ways, not twenty-two
// ══════════════════════════════════════════════════════════════════════
// voiceOf(name) reads a character's authored voice into ordered tags (voice.js). A line written for
// every tag would be twenty-two lines; most lines need only the five ways people actually differ at a
// table: cutting and controlled (sharp), deadpan or quiet (dry), loud and blunt (loud), open and
// feeling (soft), and silly or dramatic (odd). A variant keyed by an exact tag still wins; a family
// key fits every tag in that family. Narrative text selection only.
import { voiceOf } from './voice.js';

export const FAMILY = {
  cruel: 'sharp', schemer: 'sharp', proud: 'sharp', bossy: 'sharp',
  dry: 'dry', calm: 'dry', quiet: 'dry', nerdy: 'dry',
  loud: 'loud', blunt: 'loud', tough: 'loud', competitive: 'loud', chaotic: 'loud',
  warm: 'soft', earnest: 'soft', emotional: 'soft', anxious: 'soft', flirty: 'soft',
  goofy: 'odd', ditzy: 'odd', food: 'odd', theatrical: 'odd',
};
/** The speaker's voice family, from their strongest tag that has one ('plain' when none does). */
export function familyOf(name) {
  for (const t of voiceOf(name)) if (FAMILY[t]) return FAMILY[t];
  return 'plain';
}
/** The variant a speaker says from { tag | family: line }, their strongest match first; null if none. */
export function pickVoice(v, name) {
  if (!v || !name) return null;
  for (const t of voiceOf(name)) {
    if (v[t]) return v[t];
    if (FAMILY[t] && v[FAMILY[t]]) return v[FAMILY[t]];
  }
  return null;
}
