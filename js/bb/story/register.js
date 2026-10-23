// ══════════════════════════════════════════════════════════════════════
// bb/story/register.js — every line in the speaker's own register, all the time
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "why only the ending? I want them all to act like their own character at
// all times." Every roster character has an AUTHORED voice ("Blunt, action-first, says little,
// does a lot"; "Smooth, charming… silky, flattering speech that hides a knife"; "Silent inventor
// genius. Never speaks"). This reads it into a register, and uses the register three ways:
//
//   1. pickTone: a scene comes in tones (heated, tender, awkward, playful, cold); the one that
//      fits the person leading it is preferred, so a blunt fighter gets the heated row and an
//      anxious player the awkward one.
//   2. voiceLine: the stock replies every script leans on ("No." "Okay." "I know." "Why?") are
//      said the way THIS person says them, and a catchphrase the voice quotes turns up now and
//      then (Trent's "Look, guys," Geoff's "dude").
//   3. somebody written as never speaking gestures instead of talking; somebody who answers in
//      sound effects answers in sound effects.
//
// Not a rewrite pass over prose: whole short replies are swapped from a written table, and a
// scene is chosen, never edited. Words only, by hash: nothing in the game moves.

import { players } from '../../core.js';
import { pStats, pronouns } from '../../players.js';
import { readVoiceText } from '../../td/story/voice-words.js';

// Whole words only (2026-10-22: "means every word" read as mean, "goes quiet and embarrassed" as
// terse, "pushy" as shy, "even-tempered" as a temper, "some kind of" as sweet). Stems keep their endings.
const KEYS = {
  silent: /never speaks|doesn't speak|does not speak|mute\b|communicates through gestures/,
  sfx: /sound effects|beatbox/,
  terse: /\b(?:says little|few words|barely talks|(?:man|woman) of few|quiet|monosyllab\w*|short sentences|clipped|stoic|deadpan)\b/,
  sarcastic: /\b(?:sarcas\w*|deadpan|dry|snark\w*|cynic\w*|wry|eye-roll\w*)\b/,
  sweet: /\b(?:sweet(?:ly|ness)?|gentle|gently|kind(?:ly|ness)?(?! of\b)|earnest(?:ly)?|wholesome|warm(?:ly|th)?|caring|soft-spoken)\b/,
  theatrical: /\b(?:theatric\w*|dramatic\w*|diva|flamboyan\w*|over-the-top|melodram\w*|vain)\b/,
  anxious: /\b(?:nervous\w*|anxious\w*|insecur\w*|shy|shyly|timid\w*|awkward\w*|paranoi\w*|worried|worrier|neurotic\w*)\b/,
  smooth: /\b(?:smooth\w*|charming\w*|silky|flatter\w*|suave|charismatic|polished)\b/,
  tough: /\b(?:blunt\w*|tough|brash|no-nonsense|gruff\w*|aggressive\w*|hot-headed|short fuse|temper|(?:short|hot|quick|bad)-tempered)\b/,
  bubbly: /\b(?:bubbly|gush\w*|excitab\w*|energetic|enthusias\w*|peppy|over-shar\w*|chatter\w*|hyper(?:active)?)\b/,
  // (cruel and cruelly, not "cruelty": "slow to notice cruelty aimed at her" is somebody kind)
  mean: /\b(?:cruel(?:ly)?|(?<!\bi )mean(?:er|est|ness)?(?! (?:it|well|to)\b)|dismissive|bossy|condescend\w*|put-downs?|snide|entitled|belittl\w*)\b/,
};
export const BB_REGISTERS = ['terse', 'sarcastic', 'theatrical', 'anxious', 'mean', 'smooth', 'tough', 'bubbly', 'sweet'];
const ARCH_REG = { hothead: 'tough', 'chaos-agent': 'theatrical', villain: 'mean', schemer: 'smooth', mastermind: 'smooth',
  'social-butterfly': 'bubbly', showmancer: 'sweet', hero: 'sweet', 'loyal-soldier': 'terse', underdog: 'anxious', goat: 'anxious',
  floater: 'sarcastic', wildcard: 'theatrical', 'challenge-beast': 'tough', 'perceptive-player': 'terse' };

// The user, 2026-10-22: "fix bb so it read the hashtags properly like the other shows ... read perfect match,
// its a better example". The voice tags every show writes (#warm #dry, td/story/voice-words.js), each in the
// register Big Brother talks in. A few depend on the tags beside them, as the Circle's do (ci/register.js):
//   loud    with a hard tag it is a fighter (tough), with a soft one it is excitement (bubbly), else a show
//   calm    composed and kind (sweet) beside a soft tag, composed and in control (smooth) beside a playing one,
//           else few words (terse)
//   proud   cruel beside cruel, tough beside a hard one (a proud cop is not "Naturally."), else polished (smooth)
// nerdy names what somebody talks ABOUT, not how, and weighs nothing here.
const TAG_REG = {
  quiet: 'terse', dry: 'sarcastic', warm: 'sweet', earnest: 'sweet', blunt: 'tough', tough: 'tough', competitive: 'tough',
  theatrical: 'theatrical', chaotic: 'theatrical', emotional: 'theatrical', anxious: 'anxious', cruel: 'mean', bossy: 'mean',
  schemer: 'smooth', flirty: 'smooth', goofy: 'bubbly', ditzy: 'bubbly', food: 'bubbly',
};
const HARD_TAGS = ['blunt', 'tough', 'cruel', 'bossy', 'competitive'], SOFT_TAGS = ['warm', 'earnest', 'goofy', 'food', 'ditzy', 'emotional'];
function tagReg(t, has) {
  if (BB_REGISTERS.includes(t) && !TAG_REG[t]) return t; // a Big Brother register named outright: #bubbly, #smooth
  if (t === 'loud') return HARD_TAGS.some(has) ? 'tough' : SOFT_TAGS.some(has) ? 'bubbly' : 'theatrical';
  if (t === 'calm') return ['warm', 'earnest'].some(has) ? 'sweet' : ['schemer', 'proud', 'flirty'].some(has) ? 'smooth' : 'terse';
  if (t === 'proud') return has('cruel') ? 'mean' : ['tough', 'blunt', 'competitive'].some(has) ? 'tough' : 'smooth';
  return TAG_REG[t] || null;
}
// How much of a speaker's talk each register gets: Perfect Match's weights (td/story/voice.js PLACE_WEIGHTS),
// by the place a tag was written: the first 4, then 2.5, 1.5, and 1 each after. "#proud:3" sets one outright.
const PLACE = [4, 2.5, 1.5], LATER = 1;
// "not cruelly", "never warm", "dislikes cruelty disguised as humor", "uncomfortable with mean play"
const NOT_BEFORE = /\b(not|never|rarely|fake|faux|pretends? to be|acts|no|without|dislikes?|hates?|uncomfortable with)\W*$/;

/** [[register, weight], …] the authored voice says, strongest first; empty when it says none. */
export function voiceMix(voice) {
  const raw = String(voice || '');
  const t = raw.toLowerCase();
  const read = readVoiceText(raw);
  const tdTags = new Set([...read.hash, ...read.words]);
  const has = x => tdTags.has(x);
  const off = new Set(read.off.map(x => tagReg(x, has) || (BB_REGISTERS.includes(x) ? x : null)).filter(Boolean));
  const list = [];
  // 1. the author's hashtags, in the order written (a Big Brother register's own name counts too)
  // (written run together as often as not: "herself.#blunt#cruel#schemer")
  for (const m of t.matchAll(/#(-?)([a-z]+)(?::(\d+(?:\.\d+)?))?/g)) {
    const r = m[1] ? null : tagReg(m[2], has);
    if (r && !off.has(r)) list.push({ r, set: m[3] != null ? Number(m[3]) : null });
  }
  // 2. then the words, in the order they come (hashtags taken out so a #warm is not counted twice)
  const words = t.replace(/#-?[a-z]+(?::[\d.]+)?/g, ' ');
  const found = [];
  for (const r of BB_REGISTERS) {
    const g = new RegExp(KEYS[r].source, 'g');
    for (let m; (m = g.exec(words));) {
      if (NOT_BEFORE.test(words.slice(Math.max(0, m.index - 24), m.index)) || /\bonly when\b/.test(words.slice(m.index, m.index + m[0].length + 22))) continue;
      found.push([m.index, r]); break;
    }
  }
  for (const [, r] of found.sort((a, b) => a[0] - b[0])) if (!off.has(r)) list.push({ r, set: null });
  const by = new Map();
  list.forEach(({ r, set }, i) => {
    const w = set ?? (i < PLACE.length ? PLACE[i] : LATER);
    by.set(r, set != null ? set : (by.get(r) || 0) + w);
  });
  return [...by.entries()].filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]);
}

const dial = (...parts) => {
  let h = 7;
  for (const c of parts.join('|')) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const _cache = new Map();
/**
 * { reg, mix, silent, sfx, catch: [phrases] } from the authored voice, else the archetype.
 * `scene` (any stable key for one scene) lands the register on the voice's mix, as Perfect Match does
 * (pm/story/director.js): one register per speaker per scene, the second hashtag heard about a quarter
 * of the time instead of never. Without a scene, the strongest.
 */
export function registerOf(name, scene = null) {
  const p0 = (players || []).find(x => x.name === name);
  // the authored voice lives on the franchise roster (window.FRANCHISE_ROSTER in the app); a cast
  // entry that carries its own wins
  let book = null; try { book = globalThis.FRANCHISE_ROSTER; } catch { book = null; }
  const rec = Array.isArray(book) ? book.find(r => r && r.name === name) : null;
  const p = { ...(rec || {}), ...(p0 || {}), voice: p0?.voice || rec?.voice || '' };
  const key = `${name}|${p.voice}|${p.archetype || ''}`;
  let out = _cache.get(key);
  if (!out) {
    const v = String(p?.voice || '').toLowerCase();
    out = { reg: null, mix: voiceMix(p.voice), silent: KEYS.silent.test(v), sfx: KEYS.sfx.test(v), catch: [] };
    if (!out.mix.length) out.mix = [[ARCH_REG[p?.archetype] || ((pStats(name)?.temperament || 5) <= 3 ? 'tough' : 'sweet'), 1]];
    out.reg = out.mix[0][0];
    // a quoted catchphrase in the description ('calls everyone "dude"'; "Look, guys,")
    for (const m of String(p?.voice || '').matchAll(/["“]([^"”]{2,28})["”]/g)) {
      const c = m[1].trim().replace(/[,.]$/, '');
      // only what can open a line: a word or two of address or exclamation, not a sentence
      if (c && !/\./.test(c) && c.split(/\s+/).length <= 3) out.catch.push(c);
    }
    _cache.set(key, out);
  }
  if (scene == null || out.mix.length < 2) return out;
  let r = dial(scene, name) * out.mix.reduce((s, [, w]) => s + w, 0);
  for (const [reg, w] of out.mix) { r -= w; if (r < 0) return reg === out.reg ? out : { ...out, reg }; }
  return out;
}

// ── 0. a line in the speaker's own register ──
// The user, 2026-10-15, on a comp joke nobody would say: "well I don't know what happened... what do you want
// me to say (if she's on the mean side) or I really don't know what's going on with me (if she's on the anxious
// side)". A turn can carry `v: { mean, anxious, ... }` keyed by the registers above, or by a family of them
// (hard, soft, loud); the speaker's own register first, then its family, then the line as written.
export const REG_FAMILY = { mean: 'hard', tough: 'hard', sarcastic: 'hard', terse: 'hard', anxious: 'soft', sweet: 'soft', bubbly: 'soft', theatrical: 'loud' };
export const VARIANT_KEYS = ['terse', 'sarcastic', 'theatrical', 'anxious', 'mean', 'smooth', 'tough', 'bubbly', 'sweet', 'hard', 'soft', 'loud'];
export function variantOf(t, by, scene = null) {
  if (!t?.v || !by) return null;
  const r = registerOf(by, scene).reg;
  return t.v[r] ?? t.v[REG_FAMILY[r]] ?? null;
}

// ── 1. the scene that fits the person leading it ──
const TONE = {
  heated: /!.*!|shout|yell|slams|furious|snaps|screams|throws/i,
  tender: /\bhug|sorry|thank|love\b|softly|holds|tears|means a lot/i,
  awkward: /—.*—|\.\.\..*\.\.\.|\bum\b|\buh\b|I mean, |awkward/i,
  playful: /laugh|joke|grin|tease|giggl|cracks up|wink/i,
  cold: /silence|doesn't look|stares|walks away|shrugs|without looking|flat(ly)?\b/i,
};
const FITS = { tough: ['heated', 'cold'], theatrical: ['heated', 'playful'], bubbly: ['playful', 'tender'], sweet: ['tender', 'playful'],
  anxious: ['awkward', 'tender'], sarcastic: ['cold', 'playful'], terse: ['cold'], smooth: ['cold', 'playful'], mean: ['cold', 'heated'] };
export function toneOf(entry) {
  const t = JSON.stringify(entry?.turns || '');
  return Object.keys(TONE).filter(k => TONE[k].test(t));
}
/** The candidates that fit the person in role `a` (and `b` as a tie-break), or all of them. */
export function pickTone(cands, who, scene = null) {
  if (!cands || cands.length < 2 || !who?.a) return cands;
  const ra = registerOf(who.a, scene).reg, rb = who.b ? registerOf(who.b, scene).reg : null;
  const want = FITS[ra] || [];
  const score = e => { const t = toneOf(e); return t.filter(x => want.includes(x)).length * 2 + t.filter(x => (FITS[rb] || []).includes(x)).length; };
  const best = Math.max(...cands.map(score));
  if (best <= 0) return cands;
  const top = cands.filter(e => score(e) === best);
  return top.length ? top : cands;
}

// ── 2. the stock replies, in this person's register ──
// Each class holds only replies its substitutes MEAN the same as (the read of 2026-10-14: "And?",
// a nudge to go on, came out as "I'm sorry, WHAT?"; "Oh no." came out as "Huh." and left the next
// line, "Oh yes.", answering nothing). "Deal", "Exactly", "Don't", "Maybe", "What?" and "Really?"
// are their own replies and stay as written.
const FN = {
  yes: /^(yes|yeah|sure)[.!]?$/i,
  // ("Fine." is also how somebody slept: "Sleep well?" "Fine." came out as "Right.")
  ack: /^(okay|ok|alright|all right|okay, okay)[.!]?$/i,
  no: /^(no|nope|no way)[.!]?$/i,
  why: /^why\?$/i,
  know: /^(i know)[.!]?$/i,
  dunno: /^(i don't know|no idea|who knows)[.!]?$/i,
  sorry: /^(i'm sorry|sorry)[.!]?$/i,
  thanks: /^(thank you|thanks)[.!]?$/i,
  wow: /^wow[.!]?$/i,
  go: /^(go on|go on, then|go|i'm listening)[.!]?$/i,
};
const SAY = {
  ack: { terse: ['Fine.', 'Right.'], sarcastic: ['Great.', 'Cool. Cool cool cool.'], sweet: ['Okay. Okay.', 'That\'s fair.'], theatrical: ['Fine. FINE.', 'Okay! Okay.'],
    anxious: ['Okay... okay.', 'Right. Okay.'], smooth: ['Understood.', 'Fair enough.'], tough: ['Fine.', 'Right.'], bubbly: ['Okay!', 'Okay, okay!'], mean: ['Whatever.', 'Fine.'] },
  yes: { terse: ['Yep.', 'Fine.', 'Done.'], sarcastic: ['Sure. Why not.', 'Oh, absolutely.', 'Fine. Whatever.'], sweet: ['Of course!', 'Yes, of course.', 'Okay. Yes.'],
    theatrical: ['Yes. Obviously. A thousand times yes.', 'Fine! Fine.', 'Okay, YES.'], anxious: ['Okay. I think. Yes.', 'Um, yeah. Okay.', 'Yes? Yes.'],
    smooth: ['Of course.', 'Naturally.', 'I was hoping you\'d say that.'], tough: ['Yeah.', 'Fine.', 'Good.'], bubbly: ['Yes! Yes, yes.', 'Oh my god, yes.', 'Love that. Yes.'],
    mean: ['Fine.', 'If I have to.', 'Obviously.'] },
  no: { terse: ['No.', 'Nope.'], sarcastic: ['Hard pass.', 'Yeah, no.', 'Not a chance.'], sweet: ['Oh, no, I can\'t.', 'No, I\'m sorry.'],
    theatrical: ['Absolutely not.', 'No. Never. Not in a million years.'], anxious: ['I— no. Sorry. No.', 'Um, no? No.'],
    smooth: ['I don\'t think so.', 'Let\'s not.'], tough: ['No.', 'Not happening.'], bubbly: ['Nooo. No way.', 'No! Stop.'], mean: ['No. Obviously.', 'Don\'t be ridiculous.'] },
  why: { terse: ['Why.', 'Why?'], sarcastic: ['Oh? Why\'s that?', 'And why would that be?'], sweet: ['How come?', 'Why, though?'],
    theatrical: ['Why?! Why?', 'Why on earth?'], anxious: ['Wait, why?', 'Why? Is something wrong?'], smooth: ['Interesting. Why?', 'Why\'s that?'],
    tough: ['Why?', 'Why?'], bubbly: ['Why? Tell me!', 'Wait, why?'], mean: ['Why\'s that?', 'Why?'] },
  know: { terse: ['I know.'], sarcastic: ['Believe me, I know.'], sweet: ['I know. I know.'], theatrical: ['I know. Believe me, I know.'],
    anxious: ['I know, I know.'], smooth: ['I\'m aware.'], tough: ['I know.'], bubbly: ['I know, I know.'], mean: ['I know.'] },
  dunno: { terse: ['No idea.'], sarcastic: ['Your guess is as good as mine.', 'Not a clue.'], sweet: ['I honestly don\'t know.'], theatrical: ['Who even knows any more?'],
    anxious: ['I don\'t know. I really don\'t.'], smooth: ['Hard to say.'], tough: ['Don\'t know.'], bubbly: ['No idea! None.'], mean: ['How would I know?'] },
  sorry: { terse: ['Sorry.'], sarcastic: ['Sorry. Genuinely.'], sweet: ['I\'m so sorry.', 'I\'m really sorry.'], theatrical: ['I am SO sorry.'],
    anxious: ['Sorry. Sorry, sorry.'], smooth: ['My apologies.'], tough: ['Sorry.'], bubbly: ['Oh my god, I\'m so sorry.'], mean: ['Fine. Sorry.'] },
  thanks: { terse: ['Thanks.'], sarcastic: ['Wow. Thanks.'], sweet: ['Thank you. Really.'], theatrical: ['Thank you, thank you.'], anxious: ['Oh. Thank you.'],
    smooth: ['I appreciate that.'], tough: ['Thanks.'], bubbly: ['Thank you so much!'], mean: ['Took you long enough.'] },
  wow: { terse: ['Wow.'], sarcastic: ['Wow. Great.'], sweet: ['Oh, wow.'], theatrical: ['WOW.'], anxious: ['Oh. Wow.'], smooth: ['Well, well.'],
    tough: ['Wow.'], bubbly: ['Oh my god. Wow.'], mean: ['Wow.'] },
  // a plain "yes"/"no" to a question of fact ("Is it about me?" "No."): the request flavours above are
  // a refusal or an agreement ("Oh, no, I can't."), which answers a question nobody asked
  noFact: { terse: ['No.', 'Nope.'], sarcastic: ['No. Why would it be?', 'Nope.'], sweet: ['No, no.', 'No, honestly.'],
    theatrical: ['No! God, no.', 'Absolutely not.'], anxious: ['No? No.', 'Um, no.'], smooth: ['No.', 'Not at all.'], tough: ['No.', 'Nope.'],
    bubbly: ['No! Nope.', 'Nooo.'], mean: ['No. Obviously.', 'No.'] },
  yesFact: { terse: ['Yep.', 'Yeah.'], sarcastic: ['Oh, yes.', 'Yep. Really.'], sweet: ['Yes.', 'Yeah, I think so.'], theatrical: ['Yes! Yes.', 'Oh, yes.'],
    anxious: ['Um. Yes.', 'Yeah. Yes.'], smooth: ['Yes.', 'Yes, actually.'], tough: ['Yeah.', 'Yep.'], bubbly: ['Yes! Totally.', 'Yes!'], mean: ['Yes. Obviously.', 'Yes.'] },
  go: { terse: ['Go.'], sarcastic: ['Go on. I\'m riveted.'], sweet: ['Go on, I\'m listening.'], theatrical: ['Tell me. Tell me everything.'], anxious: ['Okay. Go on.'],
    smooth: ['I\'m all ears.'], tough: ['Out with it.'], bubbly: ['Go, go, go!'], mean: ['Make it quick.'] },
};
const ASKS = /\b(can|could|will|would|won't) (you|we)\b|\bdo you want\b|\bwant to\b|\bshall (we|I)\b|\blet's\b|\bplease\b|\b(can|could|may) I\b|\bpromise\b|\bdeal\?|\bare you in\b|\bwith me\?|\bhelp me\b|\binterested\b|\bin or out\b|^(make|get|pass|grab|bring|give|come|tell|show|let|put|hand|save|keep)\b/i;
const SFX = ['*a long descending whistle*', '*a record scratch*', '*a soft drumroll on the table*', '*a tiny trumpet fanfare*', '*a cartoon gulp*'];
const GEST = ['shakes his head', 'nods once', 'holds up a hand', 'shrugs', 'raises an eyebrow', 'points at the door', 'gives a thumbs up'];
const h = s => { let x = 2166136261; for (const ch of String(s)) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; return x; };

/**
 * One spoken line in its speaker's register. Returns the line (possibly the same one), or a beat
 * for somebody who does not speak. `salt` keeps the choice stable for a scene; `scene` keys which of
 * the speaker's registers it is (registerOf), the salt unless the caller shares one across a scene.
 */
export function voiceLine(line, salt, before = null, after = null, scene = salt) {
  if (!line || !line.by || (line.kind !== 'say' && line.kind !== 'dr')) return line;
  const r = registerOf(line.by, scene);
  const text = String(line.text).trim();
  const k = h(`${salt}|${line.by}|${text}`);
  let fn = Object.keys(FN).find(f => FN[f].test(text));
  // a reply the next line quotes back stays as said: "Okay." "Just okay?" is not "Whatever." "Just okay?"
  const word = text.replace(/[.!?]+$/, '').toLowerCase();
  if (fn && word && new RegExp(`(^|[^a-z'])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z']|$)`).test(String(after?.text || '').toLowerCase())) fn = null;
  // answering a question that asks for nothing (no "can you", "will you", "do you want"): a fact
  const asked = String(before?.text || '').trim();
  if ((fn === 'no' || fn === 'yes') && /\?!*$/.test(asked) && !ASKS.test(asked)) fn = fn === 'no' ? 'noFact' : 'yesFact';
  // somebody who never speaks: the gesture for a simple answer, and anything with content in it
  // written on the notepad they carry, so what they mean still reaches the room
  if (r.silent) {
    let pa = 'their'; try { pa = pronouns(line.by).posAdj || 'their'; } catch { /* their */ }
    const G = { yes: 'nods', ack: 'nods once', no: `shakes ${pa} head`, why: 'raises an eyebrow', know: 'nods slowly', dunno: 'shrugs',
      sorry: `puts a hand on ${pa} heart`, thanks: 'gives a thumbs up', wow: `blinks, very slowly`, go: 'gestures: go on' };
    if (fn && line.kind === 'say') return { kind: 'beat', by: null, text: `${line.by} ${G[fn]}.`, voiced: true };
    return line.kind === 'dr'
      ? { ...line, text: `(holds up a notepad) ${text}` }
      : { kind: 'beat', by: null, text: `${line.by} ${['writes on a notepad and holds it up', 'scribbles something and turns the notepad around', 'holds up the notepad', 'taps the notepad, already written'][k % 4]}: "${text}"`, voiced: true };
  }
  if (line.kind !== 'say') return line;
  // somebody who answers in sound effects does it for the simple answers, and talks otherwise
  if (r.sfx && fn) return { ...line, text: SFX[k % SFX.length] };
  if (fn && SAY[fn]?.[r.reg]) {
    const opts = SAY[fn][r.reg];
    return { ...line, text: opts[k % opts.length] };
  }
  // a catchphrase from the authored voice, now and then, at the front of a longer line
  if (r.catch.length && text.length > 30 && k % 7 === 0) {
    const c = r.catch[k % r.catch.length];
    // the next word keeps its capital unless it is an ordinary one ('Look, guys, we need'; never 'i' or a name)
    const first = text.split(/\s+/)[0];
    const lower = /^(the|we|you|it|this|that|there|what|so|okay|listen|honestly|look|can|do|is|are|if|when|just|nobody|everybody|everyone)$/i.test(first.replace(/[^A-Za-z]/g, ''));
    if (!text.toLowerCase().includes(c.toLowerCase())) return { ...line, text: `${c.replace(/^./, ch => ch.toUpperCase())}${/[!?]$/.test(c) ? '' : ','} ${lower ? text.charAt(0).toLowerCase() + text.slice(1) : text}` };
  }
  return line;
}
