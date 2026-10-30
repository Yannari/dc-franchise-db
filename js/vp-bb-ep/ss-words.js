// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-words.js — a secret, said about the person who holds it
// ══════════════════════════════════════════════════════════════════════
//
// A secret is written in its holder's words ("I carried my neighbours out of a burning building"). Quoted whole in a
// hunter's mouth it read like a form ("I think "I carried my neighbours out of a burning building", I think": the user,
// 2026-10-29, "what does that conversation mean i understood nothing"). Here it becomes a sentence about the holder:
// "Lacey carried her neighbours out of a burning building".

const IRREG_PAST = new Set(['was', 'were', 'had', 'did', 'got', 'gave', 'found', 'became', 'won', 'woke', 'lost', 'spent', 'ran', 'held', 'made', 'sang',
  'saw', 'came', 'went', 'grew', 'fell', 'broke', 'left', 'took', 'told', 'threw', 'swam', 'drove', 'flew', 'bought', 'sold', 'met', 'fought', 'kept', 'slept']);
const ADVERBS = new Set(['only', 'never', 'once', 'still', 'also', 'really', 'just', 'secretly', 'always', 'nearly', 'almost']);
const MODAL = { am: 'is', have: 'has', can: 'can', cannot: 'cannot', will: 'will', was: 'was', do: 'does', go: 'goes', must: 'must', could: 'could', would: 'would', used: 'used' };

/** The holder's verb for the secret's first one ("throw" -> "throws", "carried" stays). */
function conj(v) {
  if (MODAL[v] != null) return MODAL[v];
  if (/ed$/.test(v) || IRREG_PAST.has(v)) return v;
  if (/[^aeiou]y$/.test(v)) return `${v.slice(0, -1)}ies`;
  if (/(s|sh|ch|x|z|o)$/.test(v)) return `${v}es`;
  return `${v}s`;
}

/**
 * `text` said about `name`: "I am a chess grandmaster" -> "Ana is a chess grandmaster". `p` is pronouns(name) when the
 * caller has it ({ sub, obj, posAdj, ref }); without it the holder is "they".
 * @param {string} name @param {string} text @param {any} [p]
 */
export function secretAs(name, text, p = undefined) {
  let t = String(text || '').trim().replace(/[.!]+$/, '');
  if (!t) return `${name} is hiding something`;
  const sub = p?.sub || 'they', obj = p?.obj || 'them', pos = p?.posAdj || 'their', ref = p?.ref || 'themselves';
  const they = sub === 'they';
  let m;
  if ((m = /^We (are|were|have|had|used to) (.*)$/i.exec(t))) t = `${name} and somebody else in here ${m[1].toLowerCase()} ${m[2]}`;
  else if ((m = /^My (.*)$/.exec(t))) t = `${name}'s ${m[1]}`;
  else if ((m = /^Half of my (.*)$/.exec(t))) t = `half of ${name}'s ${m[1]}`;
  else if (/^I /.test(t)) {
    const words = t.slice(2).split(' ');
    let i = 0;
    while (i < words.length - 1 && ADVERBS.has(words[i])) i++;
    words[i] = conj(words[i]);
    t = `${name} ${words.join(' ')}`;
  }
  // the rest of the sentence, in the third person (a second "I" is the holder again)
  t = t.replace(/\bI have\b/g, they ? 'they have' : `${sub} has`).replace(/\bI am\b/g, they ? 'they are' : `${sub} is`)
    .replace(/\bI was\b/g, they ? 'they were' : `${sub} was`).replace(/\bI\b/g, sub)
    .replace(/\bmyself\b/g, ref).replace(/\bmy\b/g, pos).replace(/\bme\b/g, obj).replace(/\bmine\b/g, they ? 'theirs' : (p?.pos || 'theirs'));
  return t;
}
