// ══════════════════════════════════════════════════════════════════════
// vp-tr/tidy.js — a name said twice in one sentence becomes a pronoun
// ══════════════════════════════════════════════════════════════════════
//
// THE DEFECT. Every castle pool writes its people as `{a}`/`{b}`/`{topic}`
// and never as a pronoun, because a pool does not know who it will be filled
// with. So a sentence that needs the same person twice prints the name twice,
// and a reader hears a machine:
//
//   "Nobody can put Gerry where Gerry says Gerry was either."
//   "Damien keeps coming back to Damien's own ballot."
//   "Emma has decided to stop testing and is not sure Emma will manage it."
//
// Found by dumping a season and reading it. The fix is here rather than in
// two thousand pool lines, and it is deliberately narrow: it only rewrites a
// REPEAT of a name, only in the three positions English makes unambiguous,
// and never when somebody else of the same pronoun appears in between (then
// "he" could mean either of them and the name is the clearer word).
//
//   1. possessive       "Dawn's head"          -> "her head"
//   2. after a preposition "had Devin in"      -> left alone unless the word
//                          before is a preposition: "beside Ella" -> "beside her"
//   3. a subject        "where Gerry says"     -> "where he says", only when
//                          the word after is a verb from the list below
//
// Anything it is not sure of it leaves exactly as written.

import { pronouns } from '../players.js';
import { players } from '../core.js';

const PREPOSITIONS = new Set(['to', 'with', 'at', 'for', 'about', 'on', 'of', 'from',
  'behind', 'beside', 'past', 'against', 'toward', 'towards', 'by', 'into', 'onto',
  'over', 'under', 'without', 'around', 'near', 'after', 'like']);
const VERBS = new Set(['is', 'was', 'has', 'had', 'did', 'does', 'can', 'could', 'will',
  'would', 'should', 'might', 'must', 'says', 'said', 'knows', 'knew', 'thinks',
  'thought', 'went', 'got', 'gets', 'comes', 'came', 'wants', 'wanted', 'needs',
  'needed', 'feels', 'felt', 'meant', 'means', 'appears', 'appeared', 'seems',
  'seemed', 'looks', 'looked', 'keeps', 'kept', 'tries', 'tried', 'failed', 'fails',
  'passed', 'saw', 'sees', 'heard', 'hears', 'told', 'tells', 'asked', 'asks',
  'answered', 'answers', 'stood', 'stands', 'sat', 'sits', 'left', 'leaves',
  'decided', 'decides', 'believes', 'believed', 'trusts', 'trusted', 'suspects',
  'suspected', 'realised', 'realises', 'noticed', 'notices', 'remembers',
  'remembered', 'goes', 'wrote', 'writes', 'voted', 'votes', 'really', 'never',
  'still', 'already', 'just', 'also']);
const ADVERBS = new Set(['really', 'never', 'still', 'already', 'just', 'also']);
// A plural subject pronoun takes a different verb ("they was"), so a player
// whose pronoun is they keeps their name in subject position.
const PLURAL_UNSAFE = new Set(['is', 'was', 'has', 'does', 'says', 'knows', 'thinks',
  'gets', 'comes', 'wants', 'needs', 'feels', 'means', 'appears', 'seems', 'looks',
  'keeps', 'tries', 'fails', 'sees', 'hears', 'tells', 'asks', 'answers', 'stands',
  'sits', 'leaves', 'decides', 'believes', 'trusts', 'suspects', 'realises',
  'notices', 'remembers', 'goes', 'writes', 'votes']);

function _esc(s) { return String(s).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

let _castKey = null;
let _castRe = null;
function _castPattern() {
  const names = (players || []).map(p => p && p.name).filter(Boolean);
  const key = names.join('|');
  if (key !== _castKey) {
    _castKey = key;
    const sorted = [...names].sort((a, b) => b.length - a.length);
    // Possessive forms ride on the name: straight or curly apostrophe.
    _castRe = sorted.length
      ? new RegExp('\\b(' + sorted.map(_esc).join('|') + ')(?:(\'s|’s|&rsquo;s)\\b)?(?![\\w-])', 'g')
      : null;
  }
  return _castRe;
}

function _prevWord(text, at) {
  const m = /([A-Za-z’']+)[^A-Za-z’']*$/.exec(text.slice(0, at));
  return m ? m[1].toLowerCase() : '';
}
function _nextWord(text, from) {
  const m = /^[^A-Za-z’']*([A-Za-z’']+)/.exec(text.slice(from));
  return m ? m[1].toLowerCase() : '';
}

// ── THE SUBJECT'S OWN "THEIR" ─────────────────────────────────────────
//
// "Emma changed their mind." "Duncan was still arguing with themselves." The
// pools wrote singular they wherever a line needed the subject's possessive,
// because a pool cannot know who fills it. When the sentence's first person
// is the one doing it, and nothing plural or nobody else stands between them
// and the word, the word is theirs and it gets their pronoun.
const PLURAL_BLOCK = /\b(and|others?|people|everyone|everybody|both|all|they|them|room|rest|pair|two|three|Traitors|Faithfuls|group|table|castle|who|each)\b/i;
function _ownTheir(sent, hits) {
  if (!hits.length) return sent;
  const h = hits[0];
  const p = pronouns(h.name) || {};
  if (!p.sub || p.sub === 'they') return sent;
  const stop = hits.length > 1 ? hits[1].at : sent.length;
  const span = sent.slice(h.end, stop);
  const m = /\b(their|themselves|themself)\b/.exec(span);
  if (!m) return sent;
  const between = span.slice(0, m.index);
  if (PLURAL_BLOCK.test(between) || between.split(/\s+/).length > 9) return sent;
  const word = m[1] === 'their' ? p.posAdj : p.ref;
  const at = h.end + m.index;
  return sent.slice(0, at) + word + sent.slice(at + m[1].length);
}

/** One sentence, repeats replaced where the position is unambiguous. */
function _tidySentence(sent, re) {
  const hits = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(sent))) hits.push({ name: m[1], poss: !!m[2], at: m.index, end: re.lastIndex });
  if (hits.length && hits[0].at <= 2) {
    const fixed = _ownTheir(sent, hits);
    if (fixed !== sent) return _tidySentence(fixed, re);
  }
  if (hits.length < 2) return sent;
  const seen = new Set();
  const out = [];
  let cursor = 0;
  const pr = n => pronouns(n) || {};
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    let rep = null;
    if (seen.has(h.name)) {
      // Anybody else with the same pronoun between the last mention and this
      // one makes the pronoun ambiguous: keep the name.
      let lastIdx = -1;
      for (let j = i - 1; j >= 0; j--) if (hits[j].name === h.name) { lastIdx = j; break; }
      const p = pr(h.name);
      const clash = hits.slice(lastIdx + 1, i).some(o => o.name !== h.name && pr(o.name).sub === p.sub);
      if (!clash && p.sub) {
        const next = _nextWord(sent, h.end);
        const prev = _prevWord(sent, h.at);
        const trueVerb = VERBS.has(next) && !ADVERBS.has(next);
        if (h.poss) rep = p.posAdj;
        // "after Gerry said" is a clause, not an object: a real verb after
        // the name wins over the preposition before it.
        else if (PREPOSITIONS.has(prev) && !trueVerb) rep = p.obj;
        else if (VERBS.has(next) && !(p.sub === 'they' && PLURAL_UNSAFE.has(next))) rep = p.sub;
      }
    }
    seen.add(h.name);
    out.push(sent.slice(cursor, h.at));
    out.push(rep != null ? rep : sent.slice(h.at, h.end));
    cursor = h.end;
  }
  out.push(sent.slice(cursor));
  return out.join('');
}

/**
 * Tidy a line of rendered prose. Safe on HTML-free text and on text with
 * entities in it; it never touches anything that is not a cast name.
 */
export function tidyNames(text) {
  const s = String(text == null ? '' : text);
  const re = _castPattern();
  if (!re || !s) return s;
  // Sentence by sentence: a pronoun reaches back only inside its own sentence.
  return s.split(/(?<=[.!?]["”’]?)(\s+)/).map(part =>
    /^\s+$/.test(part) ? part : _tidySentence(part, re)).join('');
}
