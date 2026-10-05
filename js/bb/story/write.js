// ══════════════════════════════════════════════════════════════════════
// bb/story/write.js — one storyline step becomes one whole scene
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.3 and §5. A scene is written WHOLE: one pool entry is the entire
// conversation, eight to twenty-odd lines that answer each other, in the
// rhythm of its kind (docs/bb-dialogue-style.md). Nothing is assembled from
// separately written parts, except one thing: when the step answers something
// the viewer never saw, the scene opens with whoever in it saw that thing,
// saying it plainly in the Diary Room (a recap), or a one-line caption if
// nobody in the scene saw it.
//
// Pools: js/bb/story/lines/*.js, keyed 'story.<type>.<step>.<outcome>' (falling
// back to '.any'), recaps 'recap.<type>.<step>' with entries spoken by 'a' or
// 'b' of the EARLIER step. An entry may carry `presumes: [...]`:
//   hoh   an HOH has been crowned this week
//   noms  nominations have happened this week
//   vote  an eviction vote has happened this season
// The writer skips an entry whose presumptions are false.
//
// The words draw from their own dice (stableRng), never the engine's.

import { gs } from '../../core.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { fill, writing } from '../script/write.js';
import { factsFor } from '../script/facts.js';
import { stableRng } from '../knowledge.js';
import { causeOf } from './storylines.js';
import { STORY_POOLS } from './lines/index.js';

const ledger = () => ((gs.bb ||= {}).storyLedger ||= newLedger());
const ROOM = { kitchen: 'Kitchen', 'living-room': 'Living Room', bedroom: 'Bedroom', 'hoh-room': 'HOH Room',
  backyard: 'Backyard', 'diary-room': 'Diary Room', pantry: 'Storage Room', bathroom: 'Bathroom', washroom: 'Bathroom',
  'storage-room': 'Storage Room', 'have-not-room': 'Have-Not Room', dining: 'Kitchen' };

const keysFor = (type, step, outcome) => [`story.${type}.${step}.${outcome}`, `story.${type}.${step}.any`].filter(k => STORY_POOLS[k]?.length);
export const hasPool = (type, step, outcome) => keysFor(type, step, outcome).length > 0;

// The mood a scene sets for the music (BED_BY_MOOD in js/vp-bb-ep/sound.js).
function moodOf(type, step) {
  if (type === 'feud') return step === 'apology' ? 'house' : 'drama';
  if (type === 'alliance') return ['crack', 'exposed', 'betrayal'].includes(step) ? 'scheming' : 'deals';
  if (type === 'showmance') return ['fight', 'breakup', 'jealous'].includes(step) ? 'drama' : step === 'hiding' ? 'secret' : 'house';
  if (type === 'target') return step === 'block' ? 'ceremony' : 'scheming';
  if (type === 'scheme') return step === 'caught' ? 'drama' : 'secret';
  if (type === 'life') return step === 'breakdown' ? 'drama' : 'house';
  return 'house';
}

// When the earlier step happened, said the way people say it.
function whenOf(prior, step) {
  if (!prior) return 'earlier';
  if (prior.week < step.week) return 'last week';
  const d = step.stretch - prior.stretch;
  return d <= 0 ? 'earlier' : d === 1 ? 'yesterday' : 'the other day';
}

function presumed(entry, ctx) {
  for (const p of entry.presumes || []) {
    if (p === 'hoh' && !ctx.hoh) return false;
    if (p === 'noms' && !(ctx.nominees || []).length) return false;
    if (p === 'vote' && !(gs.bb?.weeks || []).some(w => w !== ctx.week && w.evicted)) return false;
  }
  return true;
}

function pick(keys, who, data, ctx, room, salt) {
  const pools = {};
  // an entry that names something the scene does not have ({alliance} on an unnamed pact,
  // {c} with no third person) is not a candidate: it would print the raw slot
  const can = e => (e.turns || []).every(t => (!t.by || !!who[t.by]) && [...String(t.say || t.dr || t.beat || '').matchAll(/\{(\w+)(?:\.\w+)?\}/g)]
    .every(([, r]) => r === 'hoh' ? !!ctx.hoh : r === 'count' || !!who[r] || typeof data[r] === 'string'));
  for (const k of keys) pools[k] = (STORY_POOLS[k] || []).filter(e => presumed(e, ctx) && can(e));
  if (!keys.some(k => pools[k].length)) return null;
  const facts = factsFor({ who, data, room }, { week: ctx.week, act: 'house', hoh: ctx.hoh, nominees: ctx.nominees });
  const rng = stableRng(gs.bb?.seasonSalt || 0, ctx.week?.num || 0, 'story', salt);
  const speakers = Object.values(who).filter(Boolean);
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  const clock = (ctx.week?.num || 0) * 10 + (ctx.stretch || 0);
  const key = keys.length > 1 ? keys : keys[0];
  return pickEntry(ledger(), pools, key, facts, pairKey, rng, speakers, clock);
}

const render = (entry, who, ctx, data) => entry.turns.map(t => {
  const kind = t.dr ? 'dr' : t.beat ? 'beat' : 'say';
  const by = t.by ? who[t.by] || null : null;
  const text = fill(t.dr || t.beat || t.say, who, { hoh: ctx.hoh }, data);
  // a line may open on a slot ("{when}, {a} made a joke...") — a sentence starts with a capital
  return { kind, by, text: text.replace(/^(["'(…\.\s]*)([a-z])/, (m, p, ch) => p + ch.toUpperCase()) };
});

/** The scene for one step of a storyline, or null when nothing fits. */
export function writeStoryScene(line, step, ctx) {
  const prior = causeOf(line, step) || null;
  let who = { a: step.roles.a, b: step.roles.b, c: step.roles.c };
  // The roles follow the cause. In a feud, the one who starts the argument is the one who
  // was wronged, and the one who apologises is the one who did it: the event that fired
  // may have them the other way round, which aired a joker yelling about their own joke.
  if (line.type === 'feud' && prior?.step === 'friction') {
    const offender = prior.roles.a;
    if (step.step === 'argument' && who.a === offender) who = { a: who.b, b: who.a, c: who.c };
    if (step.step === 'apology' && who.b === offender) who = { a: who.b, b: who.a, c: who.c };
  }
  const data = { ...step.data, when: whenOf(prior, step) };
  for (const k of Object.keys(data)) if (data[k] != null && typeof data[k] !== 'string') delete data[k];
  let room = step.room || 'living-room';
  const keys = keysFor(line.type, step.step, step.outcome);
  if (!keys.length) return null;
  const cast = [who.a, who.b, who.c].filter(Boolean);
  const base = { id: `${line.id}#${line.steps.indexOf(step)}`, line: line.id, type: line.type, step: step.step,
    outcome: step.outcome, room, roomName: ROOM[room] || 'Living Room', cast, mood: moodOf(line.type, step.step), at: step.at };
  if (writing.muted) return { ...base, lines: [] };
  const entry = pick(keys, who, data, ctx, room, `${line.id}|${line.steps.indexOf(step)}`);
  if (!entry) return null;
  // A scene that is set somewhere ("the sink's right there") happens there.
  if (entry.room) { room = entry.room; base.room = room; base.roomName = ROOM[room] || base.roomName; }
  const lines = render(entry, who, ctx, data);
  // The cause, said plainly, when the viewer never saw it.
  let recap = [];
  if (prior && !prior.aired) {
    const pw = { a: prior.roles.a, b: prior.roles.b, c: prior.roles.c };
    const saw = n => n && (prior.seenBy || []).includes(n) && cast.includes(n);
    const by = saw(pw.b) ? 'b' : saw(pw.a) ? 'a' : null;
    const who2 = by || 'caption';
    const rk = [`recap.${line.type}.${prior.step}.${prior.outcome}.${who2}`, `recap.${line.type}.${prior.step}.${who2}`].filter(k => STORY_POOLS[k]?.length).slice(0, 1);
    const re = rk.length ? pick(rk, pw, { ...prior.data, when: data.when }, ctx, room, `${line.id}|recap|${line.steps.indexOf(step)}`) : null;
    if (re) recap = render(re, pw, ctx, { ...Object.fromEntries(Object.entries(prior.data || {}).filter(([, v]) => typeof v === 'string')), when: data.when });
  }
  // On stage: the people the scene actually uses — who speaks, or who a stage direction names.
  // (The event's third person is often only somebody the scene never needed.)
  const used = cast.filter(n => lines.some(l => l.by === n || (l.kind === 'beat' && l.text.includes(n))));
  return { ...base, cast: used.length ? used : cast, recap: recap.length > 0, lineId: entry.id, lines: [...recap, ...lines] };
}
