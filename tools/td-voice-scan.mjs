// Scan every TD dialogue pool for the writing the user has rejected (memory: feedback_td_voice, feedback_flowing_speech,
// feedback_jokes_must_make_sense, feedback_writing_rules_episodes). It flags; a person reads and rewrites.
//   node tools/td-voice-scan.mjs [familyPrefix] [--top N]
// Flags per spoken line:
//   formal     speech without contractions ("I am", "do not", "Let us"): reads translated
//   clipped    a sitcom tag or a fragment of one to three words after a full line ("Noted.", "Accurate.", "Rude.")
//   choppy     three or more sentences averaging under six words: robotic
//   clever     aphorism and narrator tricks: "which is", "the whole point", "technically", "that's the thing",
//              "a ... that ...s" metaphors, "is just ... with ..." definitions
//   therapy    "means a lot", "I hear you", "I appreciate", "that's valid", "thank you. I mean it"
//   vague      a closer that names nothing: "the real thing", "the part", "this one" with no subject
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { POOLS } from '../js/td/script/lines/index.js';

const FORMAL = /\b(I am|I will|I would|I have not|do not|does not|did not|is not|are not|was not|were not|cannot|can not|let us|it is|that is|there is|we are|you are|they are|he is|she is|what is|who is|I had not|would not|could not|should not|will not|have not|has not)\b/;
const CLEVER = /\b(which is (why|exactly|the)|the whole point|technically|that's the thing|that's the whole|in a way|it's a whole|is basically|is just (a|an) \w+ (with|that|who)|metaphor|figuratively|for the record|statistically|historically)\b/i;
const THERAPY = /(means a lot|I hear you|I appreciate (that|it|you)|that's valid|thank you\. I mean it|I feel seen|holding space|boundaries)/i;
const VAGUE = /\b(the real thing|that's the part|the part where|this one\b(?! (person|time|vote))|the thing is)\b/i;
const TAG = /^(noted|accurate|rude|fair|wow|cool|great|correct|noted\. very noted|smooth|bold|valid|sure|good|perfect|true|classic)[.!?]?$/i;
const sentences = t => String(t).split(/(?<=[.!?])\s+/).filter(Boolean);
const choppy = t => { const s = sentences(t); return s.length >= 3 && s.reduce((n, x) => n + x.split(/\s+/).length, 0) / s.length < 6; };

const args = process.argv.slice(2);
const ti = args.indexOf('--top');
const top = ti >= 0 ? +args[ti + 1] || 40 : 40;
const prefix = args.find((a, i) => !a.startsWith('--') && i !== ti + 1) || '';
const rows = [];
for (const [src, pools] of [['story', STORY_POOLS], ['script', POOLS]]) for (const [key, list] of Object.entries(pools || {})) {
  if (prefix && !key.startsWith(prefix) && !key.startsWith('long.' + prefix)) continue;
  for (const e of list || []) {
    const flags = {};
    for (const t of e.turns || []) {
      for (const text of [t.say, t.conf, ...Object.values(t.v || {})].filter(Boolean)) {
        if (FORMAL.test(text)) (flags.formal ||= []).push(text);
        if (CLEVER.test(text)) (flags.clever ||= []).push(text);
        if (THERAPY.test(text)) (flags.therapy ||= []).push(text);
        if (VAGUE.test(text)) (flags.vague ||= []).push(text);
        if (TAG.test(text.trim())) (flags.clipped ||= []).push(text);
        if (choppy(text)) (flags.choppy ||= []).push(text);
      }
    }
    const score = Object.values(flags).reduce((n, l) => n + l.length, 0);
    if (score) rows.push({ src, key, id: e.id, score, flags });
  }
}
const by = {};
for (const r of rows) for (const f of Object.keys(r.flags)) by[f] = (by[f] || 0) + r.flags[f].length;
console.log(`entries flagged: ${rows.length}`, JSON.stringify(by));
for (const r of rows.sort((a, b) => b.score - a.score).slice(0, top)) {
  console.log(`\n${r.score}  ${r.src} ${r.key} ${r.id}`);
  for (const [f, l] of Object.entries(r.flags)) for (const t of l.slice(0, 3)) console.log(`   ${f.padEnd(8)} ${t.slice(0, 120)}`);
}
