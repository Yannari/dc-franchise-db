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

// tag ← words in the authored voice / personality (order inside a text decides strength)
const WORDS = [
  ['dry', /\b(dry|deadpan|sarcas\w*|wry|one-liners?|droll|flat)\b/],
  ['loud', /\b(loud|booming|shout\w*|yell\w*|brash|boisterous|rowdy)\b/],
  ['warm', /\b(warm\w*|affectionate|kind|sweet|gentle|caring|nurtur\w*|big-hearted|wholesome)\b/],
  ['blunt', /\b(blunt|straight-talking|direct|no filter|brutally honest|outspoken|tells it like)\b/],
  ['theatrical', /\b(theatrical|dramatic|diva|flamboyant|melodramatic|performer|performative|showy)\b/],
  ['anxious', /\b(anxious|nervous|neurotic|worri\w*|paranoid|insecure|awkward|jittery|timid)\b/],
  ['calm', /\b(calm|chill|easygoing|easy-going|laid-back|unbothered|relaxed|mellow|zen)\b/],
  ['competitive', /\b(competitive|ambitious|driven|type-a|intense|cutthroat)\b/],
  ['schemer', /\b(manipulat\w*|calculating|scheming|cunning|devious|two-faced|strategic)\b/],
  ['cruel', /\b(cruel|condescending|mean|vicious|snide|put-downs?|insult\w*|nasty|bully)\b/],
  ['chaotic', /\b(chaotic|unhinged|manic|wild|non-sequitur|unpredictable|feral|hyper)\b/],
  ['food', /\b(food|eats?|eating|snacks?|hungry|appetite)\b/],
  ['ditzy', /\b(ditzy|oblivious|airhead\w*|clueless|forgets|dim|naive|innocent)\b/],
  ['nerdy', /\b(nerd\w*|geek\w*|bookworm|science|trivia|vocabulary|know-it-all|brainy|intellectual)\b/],
  ['earnest', /\b(earnest|sincere|genuine|honest|wholehearted)\b/],
  ['flirty', /\b(flirt\w*|charming|smooth|romantic|seductive|lothario|ladies'? man)\b/],
  ['tough', /\b(tough|delinquent|punk|rebel\w*|street|hard-edged|thug)\b/],
  ['bossy', /\b(bossy|controlling|uptight|rule-follow\w*|perfectionist|leader|in charge)\b/],
  ['emotional', /\b(emotional|cries|crying|sensitive|tearful|weepy)\b/],
  ['goofy', /\b(goof\w*|clown\w*|silly|jokes?|joker|funny|class clown|prankster)\b/],
  ['proud', /\b(arrogant|vain|egotistical|self-absorbed|cocky|smug|full of (him|her)self|status)\b/],
];
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
  const text = `${p?.voice || ''} ${p?.personality || ''}`.toLowerCase();
  const found = [];
  for (const [tag, re] of WORDS) {
    const g = new RegExp(re.source, 'g');
    for (let m; (m = g.exec(text));) {
      // "sweet only when she wants something", "fake-nice", "never warm": the word is what they are NOT
      const before = text.slice(Math.max(0, m.index - 24), m.index);
      const after = text.slice(m.index, m.index + m[0].length + 22);
      if (/\b(not|never|rarely|fake|faux|pretends? to be|acts)\W*$/.test(before) || /\bonly when\b/.test(after)) continue;
      found.push([m.index, tag]); break;
    }
  }
  // tags set by hand on the character win (an optional authored override, p.voiceTags), then the
  // words of the authored voice in the order they are written
  const own = (Array.isArray(p?.voiceTags) ? p.voiceTags : []).filter(t => VOICE_TAGS.includes(t));
  const tags = [...own, ...found.sort((a, b) => a[0] - b[0]).map(([, t]) => t).filter(t => !own.includes(t))];
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
