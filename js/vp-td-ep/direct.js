// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/direct.js — how a voiced line is SAID: the text Inworld TTS-2 reads, and a director of last resort
// ══════════════════════════════════════════════════════════════════════
// The voice director (dc-analytics, mode 'voice-direction', on Cloudflare's free model since the user said "remove
// openai", 2026-10-14) writes a short delivery for every line: the feeling ("annoyed, snappy"), and now and then a
// sound (a sigh before "Fine."), a turn half way through the line, or the one word to hit. voiceText puts those into the line the way TTS-2 reads them: tags
// in square brackets, a capitalised word for stress (Inworld's TTS-2 prompting guide).
//
// localDirection is for when the director cannot answer. The user, 2026-10-14: "the ai voice directing could be a
// little better sometimes the emotion isnt really there". Both model accounts had run out of credit, every request
// failed, and voicing.js went on without a word: each line read with no direction at all, which is the flat read. A
// line now always has a delivery, from what the script itself says: the stage direction before it, its punctuation
// and capitals, its words, the speaker's voice. It only names a feeling the line plainly has (a direction that
// fights the words makes TTS-2 worse); otherwise it gives the speaker's own manner.

const NV = new Set(['laugh', 'sigh', 'breathe', 'clear throat', 'cough']);

/** The line's sentences, punctuation kept ("Okay, I tried." / "Remember that I tried."). */
export function sentences(text) {
  const t = String(text);
  const S = t.match(/[.!?…]*[^.!?…]+(?:[.!?…]+["”’']?)+\s*|[.!?…]*[^.!?…]+$|[.!?…]+\s*$/g) || [t];
  return S.join('') === t ? S : [t];   // never a word lost to the split
}

/** What TTS-2 reads after the delivery: the line with its sound, its turn and its stressed word, as tags. */
export function voiceText(text, dir = {}) {
  let t = String(text || '').trim();
  if (!t) return t;
  // the stressed word, once, when nothing in the line is shouted already (TTS-2: "if everything is emphasised,
  // nothing is")
  const w = String(dir.stress || '').trim();
  if (w && /^[A-Za-z'’-]{2,}$/.test(w) && !/\b[A-Z]{2,}\b/.test(t.replace(/\b(?:I|OK|TV|DJ)\b/g, ''))) {
    t = t.replace(new RegExp(`\\b${w.replace(/[-’']/g, m => `\\${m}`)}\\b`, 'i'), m => m.toUpperCase());
  }
  const S = sentences(t);
  // a turn half way: the new delivery in brackets where the feeling changes ("Okay, I tried. [bitter, low] Remember...")
  const at = Number(dir.shift?.at), d2 = String(dir.shift?.d || '').replace(/[[\]]/g, '').trim().slice(0, 60);
  if (d2 && at >= 2 && at <= S.length) S[at - 1] = `[${d2}] ${S[at - 1]}`;
  // a sound where a person makes it: before the line, after the first sentence, or at the end
  const nv = String(dir.nv || '').toLowerCase().trim();
  if (NV.has(nv)) {
    if (dir.nvAt === 'end') S[S.length - 1] = `${S[S.length - 1].trimEnd()} [${nv}]`;
    else if (dir.nvAt === 'mid' && S.length >= 2) S[1] = `[${nv}] ${S[1]}`;
    else S[0] = `[${nv}] ${S[0]}`;
  }
  return S.join('').replace(/\s+/g, ' ').trim();
}

// what the words, the stage direction and the flags say about the feeling
const FEEL = {
  angry: { line: /\b(hate|sick of|done with|how dare|liar|lied|backstab\w*|traitor|shut up|unbelievable|you knew|are you kidding|get lost|seriously|i'm done)\b/i,
    beat: /\b(storms?|slams?|snaps?|glares?|yells?|shouts?|fum\w+|furious|kicks?|throws?|shoves?|jabs?|seething|red in the face)\b/i },
  hurt: { line: /\b(miss(?:ed)?|hurt|lonely|crying|cried|wrecked|alone|not fine|let me down|thought we were|i trusted)\b/i,
    beat: /\b(cr(?:y|ies)|tears?|sobs?|empty|wrecked|stares? at nothing|alone|quiet for a while|eyes? (?:red|wet))\b/i },
  scared: { line: /\b(scared|afraid|terrified|nervous|worried|panic\w*|freaking out|next one|i'm dead|we're dead)\b/i,
    beat: /\b(fidgets?|pac(?:es|ing)|shak\w+|trembl\w+|bites? (?:a|her|his|their) (?:lip|nails?)|sweat\w*|pale)\b/i },
  happy: { line: /\b(awesome|amazing|we did it|woo+|yes+!|best day|so happy|love (?:it|this)|let's go)\b/i,
    beat: /\b(grins?|beams?|cheers?|bounces?|high-fives?|laughs?|giggles?|hugs?|whoops?)\b/i },
  smug: { line: /\b(obviously|i told you|told you so|too easy|pathetic|amateurs?|you're welcome|right where i want|nobody knows but me)\b/i,
    beat: /\b(smirks?|smug\w*|gloats?|leans back|savou?rs?)\b/i },
  shocked: { line: /^(?:wait|what|me)[.?!]|^(?:no way|are you serious|you're kidding)\b|\bwait\. me\?|\bwhat\?!?$/i,
    beat: /\b(freezes?|stares?|jaw drops?|stunned|blindsided|gasps?)\b/i },
  secret: { line: /\b(don't tell|between us|keep (?:it|this) quiet|nobody can know|can i tell you something)\b/i,
    beat: /\b(leans? in|out of earshot|out of sight|whispers?|lowers? (?:her|his|their) voice|checks? nobody)\b/i },
};
// Short on purpose: every character of a direction is paid for on Inworld, and the user found the long, heavy ones
// ("sad and sad slow") worse, 2026-10-14. A cartoon is quick: nothing here is slow.
const SAY = {
  angry: t => t.includes('dry') || t.includes('calm') ? 'cold anger, clipped' : t.includes('loud') ? 'furious, loud' : 'angry, sharp',
  hurt: () => 'hurt',
  scared: () => 'nervous, quick',
  happy: t => t.includes('dry') ? 'pleased, dry' : 'excited, bright',
  smug: () => 'smug',
  shocked: () => 'stunned',
  secret: () => 'hushed, quick',
};
// the speaker's own manner, for a line with no clear feeling in it
const MANNER = [
  ['dry', 'dry, deadpan'], ['cruel', 'cool, cutting'], ['schemer', 'smooth, sly'],
  ['loud', 'big, energetic'], ['anxious', 'a bit nervous'], ['bossy', 'bossy, brisk'],
  ['tough', 'blunt, tough'], ['nerdy', 'quick, eager'], ['warm', 'friendly, upbeat'],
  ['calm', 'calm, even'],
];

/**
 * A delivery from the script alone: { d, nv?, nvAt? }. `line` is { by, text, k, loud, shock, beat }, `tags` the
 * speaker's voice tags (td/story/voice.js voiceOf), `host` true for the host.
 */
export function localDirection(line, tags = [], host = false) {
  // a stage direction speaks for the person it names ("Geoff is sitting on Noah's empty seat" is not Sierra's mood)
  const t = String(line.text || ''), conf = line.k === 'conf';
  const beat = line.by && String(line.beat || '').includes(line.by) ? String(line.beat) : '';
  if (host) return { d: /\?|stay tuned|right here|find out/i.test(t) ? 'dramatic TV host' : 'smug TV host' };
  const score = {};
  for (const [k, re] of Object.entries(FEEL)) score[k] = (re.line.test(t) ? 1 : 0) + (beat && re.beat.test(beat) ? 1.5 : 0);
  if (line.shock) score.shocked += 1.5;
  // hurt needs more than one sad word: "I miss Noah" over breakfast is not a crying line
  if (score.hurt < 1.5) score.hurt = 0;
  const shout = line.loud || /\b[A-Z]{3,}\b/.test(t.replace(/\bTV\b/g, '')) || (t.match(/!/g) || []).length >= 2;
  const best = Object.entries(score).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0]?.[0];
  let d = best ? SAY[best](tags) : (MANNER.find(([tag]) => tags.includes(tag) && !(conf && tag === 'warm'))?.[1] || (conf ? 'honest' : 'lively'));
  if (!best && /\?\s*$/.test(t) && !conf) d = `${d.split(',')[0]}, curious`;
  if (shout && best !== 'hurt' && best !== 'secret' && !/loud/.test(d)) d = `${d.split(',')[0]}, loud`;
  if (conf) d = `${d}, to camera`;
  const out = { d };
  if (/\b(ha(?:ha)+|lol)\b/i.test(t) || (beat && /\blaughs?\b/i.test(beat))) Object.assign(out, { nv: 'laugh', nvAt: 'start' });
  else if (/^(?:\.\.\.|…)?(?:ugh|fine|whatever)\b/i.test(t) || (best === 'hurt' && /\.\.\.|…/.test(t))) Object.assign(out, { nv: 'sigh', nvAt: 'start' });
  return out;
}
