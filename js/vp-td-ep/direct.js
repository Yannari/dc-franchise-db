// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/direct.js — a delivery for the few lines that clearly need one (a TRIAL, 2026-10-14)
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-14, after the AI director was removed ("it slowed the voices too much"): "we can try it lets test
// it if i dont like it we removing it". So: no model. A direction only when the scene itself says how the line comes
// out (a shout, tears in the stage direction, a laugh, a whisper, a shock), worded the way Inworld's own guide does it:
// the feeling, then a brake ("keep the pace natural"), never "slow", "soft" or "sad" on its own. Most lines get none
// (about 2-5% of an episode's lines, measured on a dumped carnival season).
// The worker (worker-studio.js voiceRoute) also renders the plain take of every directed line and keeps the plain one
// when the directed take runs more than 20% longer. To remove the trial: delete this file and its uses in voicing.js
// (the import, `direction: directionFor(l)` and the estimate).

const BRAKE = 'keep the pace natural';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The bracketed delivery for one line of tdEpisodeLines ({ by, text, beat, loud, shock, k }), or '' for none. */
export function directionFor(l) {
  const text = String(l?.text || ''), beat = String(l?.beat || ''), by = String(l?.by || '');
  // the stage direction just before the line, when it is about the speaker (named, or "they both", "everybody"): a
  // beat about somebody else laughing is not this line's delivery
  // (by the sentence: "Marissa and Logan walk past, laughing. Anastasia waits until they're gone." is not Anastasia laughing)
  const who = by ? new RegExp(`\\b${esc(by)}\\b|\\b(they both|both of them|everybody|everyone)\\b`, 'i') : null;
  const own = who ? beat.split(/(?<=[.!?])\s+/).filter(x => who.test(x)).join(' ') : '';
  const mine = !!own;
  if (mine && /\b(tears?|crying|cries|sobs?|sobbing|eyes fill|voice (cracks|breaks|wobbles)|chokes up)\b/i.test(own)) return `Holding back tears, but ${BRAKE}`;
  if (mine && /\b(laugh(s|ing)?|giggl(es|ing)|cracks up)\b/i.test(own)) return `Laughing as you speak, ${BRAKE}`;
  if (mine && /\b(whispers?|whispering|lowers (his|her|their) voice|under (his|her|their) breath|leans in close)\b/i.test(own)) return `Whispering, ${BRAKE}`;
  // a shout: the line is marked loud, or written loud (a word in capitals and an exclamation). Capitals are mostly a
  // loud voice's emphasis ("It's called GETTING TO KNOW EACH OTHER!"), so anger needs its own sign, in the words or
  // in the stage direction
  const shouted = l?.loud || (/\b[A-Z]{3,}\b/.test(text.replace(/\b(OK|TV|DJ|FBI|USA)\b/g, '')) && /!/.test(text));
  if (shouted) {
    if (/\b(yes|yay|woo+|we won|we did it|let'?s go|celebrat\w*)\b/i.test(text)) return `Shouting with excitement, ${BRAKE}`;
    const angry = /\b(mad|angry|furious|how dare|shut up|back off|liar|lied|problem|kidding me|unbelievable|stop it|leave (me|him|her|them) alone|hate)\b/i.test(text)
      || (mine && /\b(snaps?|yells? at|slams?|storms?|shoves?|glares?|explodes?|loses it)\b/i.test(own));
    return angry ? `Shouting angrily, ${BRAKE}` : `Loud and animated, ${BRAKE}`;
  }
  if (l?.shock) return `Stunned, ${BRAKE}`;
  return '';
}
