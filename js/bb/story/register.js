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

const KEYS = {
  silent: /never speaks|doesn't speak|does not speak|mute\b|communicates through gestures/,
  sfx: /sound effects|beatbox/,
  terse: /says little|few words|barely talks|man of few|quiet|monosyllab|short sentences|clipped|stoic|deadpan/,
  sarcastic: /sarcas|deadpan|dry\b|snark|cynic|wry|eye-roll/,
  sweet: /sweet|gentle|kind|earnest|wholesome|warm|caring|soft-spoken/,
  theatrical: /theatric|dramatic|diva|flamboyant|over-the-top|melodram|vain/,
  anxious: /nervous|anxious|insecure|shy|timid|awkward|paranoi|worried|neurotic/,
  smooth: /smooth|charming|silky|flatter|suave|charismatic|polished/,
  tough: /blunt|tough|brash|no-nonsense|gruff|aggressive|hot-headed|short fuse|temper/,
  bubbly: /bubbly|gush|excitab|energetic|enthusias|peppy|over-shar|chatter|hyper/,
  mean: /cruel|mean|dismissive|bossy|condescend|put-down|snide|entitled|belittl/,
};
const ARCH_REG = { hothead: 'tough', 'chaos-agent': 'theatrical', villain: 'mean', schemer: 'smooth', mastermind: 'smooth',
  'social-butterfly': 'bubbly', showmancer: 'sweet', hero: 'sweet', 'loyal-soldier': 'terse', underdog: 'anxious', goat: 'anxious',
  floater: 'sarcastic', wildcard: 'theatrical', 'challenge-beast': 'tough', 'perceptive-player': 'terse' };

const _cache = new Map();
/** { reg, silent, sfx, catch: [phrases] } from the authored voice, else the archetype. */
export function registerOf(name) {
  const p0 = (players || []).find(x => x.name === name);
  // the authored voice lives on the franchise roster (window.FRANCHISE_ROSTER in the app); a cast
  // entry that carries its own wins
  let book = null; try { book = globalThis.FRANCHISE_ROSTER; } catch { book = null; }
  const rec = Array.isArray(book) ? book.find(r => r && r.name === name) : null;
  const p = { ...(rec || {}), ...(p0 || {}), voice: p0?.voice || rec?.voice || '' };
  const key = `${name}|${p.voice}|${p.archetype || ''}`;
  if (_cache.has(key)) return _cache.get(key);
  const v = String(p?.voice || '').toLowerCase();
  const out = { reg: null, silent: KEYS.silent.test(v), sfx: KEYS.sfx.test(v), catch: [] };
  // the first register the description names, in the order that matters most for speech
  for (const r of ['terse', 'sarcastic', 'theatrical', 'anxious', 'mean', 'smooth', 'tough', 'bubbly', 'sweet']) if (KEYS[r].test(v)) { out.reg = r; break; }
  if (!out.reg) out.reg = ARCH_REG[p?.archetype] || ((pStats(name)?.temperament || 5) <= 3 ? 'tough' : 'sweet');
  // a quoted catchphrase in the description ('calls everyone "dude"'; "Look, guys,")
  for (const m of String(p?.voice || '').matchAll(/["“]([^"”]{2,28})["”]/g)) {
    const c = m[1].trim().replace(/[,.]$/, '');
    // only what can open a line: a word or two of address or exclamation, not a sentence
    if (c && !/\./.test(c) && c.split(/\s+/).length <= 3) out.catch.push(c);
  }
  _cache.set(key, out);
  return out;
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
export function pickTone(cands, who) {
  if (!cands || cands.length < 2 || !who?.a) return cands;
  const ra = registerOf(who.a).reg, rb = who.b ? registerOf(who.b).reg : null;
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
 * for somebody who does not speak. `salt` keeps the choice stable for a scene.
 */
export function voiceLine(line, salt, before = null, after = null) {
  if (!line || !line.by || (line.kind !== 'say' && line.kind !== 'dr')) return line;
  const r = registerOf(line.by);
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
