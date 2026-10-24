// How a person actually types a post. The phrasing pools are written as clean
// sentences; this is the last step between a sentence and a post.
//
// The feed read as generated (user, 2026-10-24: "the conversations are not
// great and don't sound human"), and reading a night of it found why:
//
//   - nobody wrote a contraction: "I am", "do not", "that is the post"
//   - capitals landed on a random run of words: "stop giving the same four
//     PEOPLE THE WHOLE episode" -- a person shouts the word they mean
//   - a bare setting word followed the line into every show: "nobody in that
//     house" over a Total Drama camp, "on that beach" over Big Brother
//
// Each fix is a pure function of the text, so a test can pin the exact
// sentence. The tics (openers, sign-offs) are rationed in the sampler, where
// the whole night is visible.

/** Contractions, applied where English allows them. */
const CONTRACT = [
  [/\b([Cc])annot\b/g, (m, c) => `${c}an’t`],
  [/\b(do|does|did|is|are|was|were|has|have|had|could|would|should|must) not\b/gi, (m, a) => `${a}n’t`],
  [/\b([Ww])ill not\b/g, (m, w) => `${w}on’t`],
  [/\bI am\b(?=\s+\w)/g, 'I’m'],
  [/\bi am\b(?=\s+\w)/g, 'i’m'],
  [/\b(I|you|we|they) have got\b/gi, (m, a) => `${a}’ve got`],
  [/\b(I|you|we|they) will\b(?=\s+\w)/gi, (m, a) => `${a}’ll`],
  [/\b(you|we|they) are\b(?=\s+\w)/gi, (m, a) => `${a}’re`],
  [/\b(that|it|what|who|he|she) is\b(?=\s+\w)/gi, (m, a) => `${a}’s`],
  // "there is" only where it OPENS a clause: "the worst person out there is
  // also the best player" is a place, not an existential, and "out there's
  // also" reads as a typo.
  [/(^|[.!?,;:]\s+|\b(?:and|but|so|because|if|when|now)\s+)(there|here) is\b(?=\s+\w)/gi, (m, pre, a) => `${pre}${a}’s`],
  [/\blet us\b/gi, (m) => (m[0] === 'L' ? 'Let’s' : 'let’s')],
];

/**
 * "I am not sure that is true" -> "I'm not sure that's true". A verb that ends
 * a clause keeps its full form ("that is who it is.", "I know what I am") --
 * English does not contract there, which is what the lookaheads hold.
 */
export function contract(text) {
  let t = String(text);
  for (const [re, to] of CONTRACT) t = t.replace(re, to);
  return t;
}

// Words nobody shouts. Emphasis lands on what the sentence is about.
const QUIET = new Set(('a an the and or but so to of in on at for with from by as is are was were be been am do does did '
  + 'not no it its it’s this that these those there here they them their he she his her him we our you your i me my '
  + 'what who when how why which than then just very really still even also only about into over out up off one all '
  + 'has have had will would could should can can’t don’t isn’t wasn’t didn’t i’m that’s').split(' '));

const LEAN = new Set(('same every whole never nobody everyone everybody always actually literally genuinely exactly again '
  + 'entire worst best most least stupid obsessed done over deserved deserves robbed criminal insane unreal clean boring '
  + 'nothing everything anything need needs love hate cannot can’t won’t refuse twice once').split(' '));

/**
 * One word in capitals, the one the sentence leans on -- "they are so STUPID
 * about each other". Never a function word, never a name (a capitalised word is
 * a name or a sentence start, and shouting either reads as a glitch), never
 * across a word boundary.
 */
export function emphasize(text, rng) {
  const words = String(text).split(' ');
  const options = words.map((w, i) => ({ w, i })).filter(({ w }) => {
    const bare = w.replace(/[^\p{L}’']/gu, '');
    return bare.length >= 4 && bare === bare.toLowerCase() && !QUIET.has(bare.toLowerCase());
  });
  if (!options.length) return text;
  // Only the words people actually lean on. A sentence without one is typed
  // flat: "four seasons of this ACCOUNT" is a stress nobody puts there.
  const from = options.filter(({ w }) => LEAN.has(w.replace(/[^\p{L}’']/gu, '').toLowerCase()));
  if (!from.length) return text;
  const { i } = from[Math.floor(rng() * from.length) % from.length];
  words[i] = words[i].toUpperCase();
  return words.join(' ');
}

/**
 * The shared lines say "house" and "beach" because they were written for one
 * show. Every show has its own word for where the cast lives (adapter.js
 * `words(format).home`: camp, house, villa, castle, werk room).
 */
export function placeWords(text, home) {
  if (!home) return text;
  let t = String(text);
  if (home !== 'house') {
    t = t.replace(/\bjury house\b/gi, 'jury')
      .replace(/\b(that|the|this|a) house\b/gi, (m, d) => `${d} ${home}`)
      .replace(/\bthe whole house\b/gi, `the whole ${home}`);
  }
  return t.replace(/\b(on|in) that beach\b/gi, `in that ${home}`);
}
