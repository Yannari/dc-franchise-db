// ══════════════════════════════════════════════════════════════════════
// td/story/voice-words.js — reading a written voice into voice tags (no imports)
// ══════════════════════════════════════════════════════════════════════
//
// Shared by the simulator (td/story/voice.js voiceOf) and the casting studio (js/studio.js shows
// what the simulator will read while the voice is being written). Two ways a voice says a tag:
//   - in its words ("Sarcastic, lazy bookworm" -> dry), unless the words say what they are NOT
//     ("never warm", "fake-nice", "sweet only when she wants something");
//   - outright, with a hashtag anywhere in the text ("#loud #dry"): the author's word, first.
// tag ← words in the authored voice / personality (order inside a text decides strength)
export const WORDS = [
  ['quiet', /\b(quiet|silent|mute|reserved|taciturn|stoic|soft-spoken|few words|says little|rarely speaks|barely speaks|man of few|woman of few|monosyllab\w*)\b/],
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

export const WORD_TAGS = [...new Set(WORDS.map(([t]) => t))];

/** { hash: tags written as #tag, words: tags read from the words, in the order written }. */
export function readVoiceText(text = '') {
  const t = String(text || '').toLowerCase();
  const hash = [...t.matchAll(/#([a-z]+)/g)].map(m => m[1]).filter(x => WORD_TAGS.includes(x)).filter((x, i, a) => a.indexOf(x) === i);
  const found = [];
  for (const [tag, re] of WORDS) {
    const g = new RegExp(re.source, 'g');
    for (let m; (m = g.exec(t));) {
      const before = t.slice(Math.max(0, m.index - 24), m.index);
      const after = t.slice(m.index, m.index + m[0].length + 22);
      if (/\b(not|never|rarely|fake|faux|pretends? to be|acts)\W*$/.test(before) || /\bonly when\b/.test(after)) continue;
      found.push([m.index, tag]); break;
    }
  }
  const words = found.sort((a, b) => a[0] - b[0]).map(([, x]) => x).filter((x, i, a) => a.indexOf(x) === i && !hash.includes(x));
  return { hash, words };
}
