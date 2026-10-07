// ══════════════════════════════════════════════════════════════════════
// td/script/write.js — a decided camp scene becomes a short script
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-06 §5. The engine has decided everything; this only picks
// words, reading the camp without writing it. The pick goes through the shared
// picker (js/script/pick.js) with Total Drama's ledger (gs.tdLineLedger) and
// clock (episode * 10 + phase: two scenes in the same phase are "the same day").
//
// WRITTEN WHEN IT FIRES, so facts read the camp as it stood at the scene.
//
// ZERO DISPLACEMENT. Words never come from the engine's dice. Each scene draws
// from its own stream keyed on what it is (season, episode, phase, family,
// people, and how many such scenes came before it this phase), so converting
// a family can neither move the season nor reshuffle another family's words.
// The event that used to pick a sentence keeps a bare Math.random() draw in
// its place.
//
// A script is a list of lines: { kind: 'say' | 'conf' | 'beat', by, text }.
// `conf` is a confessional: the viewer cuts to the camera and back.
import { gs, players, seasonConfig } from '../../core.js';
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { stableRng } from '../../script/rng.js';
import { POOLS } from './lines/index.js';
import { factsFor } from './facts.js';
import { campContext } from './context.js';
import { makeScene } from './scene.js';
import { getBond } from '../../bonds.js';

// The episode being played. gs.episode still holds the last one until it ends.
export const epOf = ctx => ctx.ep || (gs.episode || 0) + 1;
const PHASE_CLOCK = { pre: 0, challenge: 1, post: 2, tribal: 3 };
export const clockOf = ctx => (epOf(ctx)) * 10 + (PHASE_CLOCK[ctx.phase] ?? 0);
const ledger = () => (gs.tdLineLedger ||= newLedger());

/** The season's word salt: who is in it and what it is called. No dice. */
function salt() {
  if (!gs.tdSalt) {
    const key = [seasonConfig?.name || '', ...(players || []).map(p => p.name).sort()].join('|');
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    gs.tdSalt = (h >>> 0) || 1;
  }
  return gs.tdSalt;
}

/** The scene's own word stream. Same scene in the same season, same words. */
export function sceneRng(scene, ctx = {}) {
  const who = scene.who || {};
  const base = [epOf(ctx), ctx.phase || '', scene.kind, who.a || '', who.b || '', who.c || ''].join('|');
  const seen = (gs._tdSceneSeen ||= {});
  if (seen.ep !== (epOf(ctx))) { for (const k of Object.keys(seen)) delete seen[k]; seen.ep = epOf(ctx); }
  const n = (seen[base] = (seen[base] || 0) + 1);
  return stableRng('td-words', salt(), base, n);
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const numberWord = n => WORDS[n] || String(n);

/**
 * {a}, {b}, {c}; {a.sub}, {a.Obj}, ...; {host}; {count} (players left, as a word).
 * Anything else is a value the scene decided and carries in its data:
 * {target}, {alliance}, {size} ('two' / 'three'), {tribe}...
 */
export function fill(text, who, data = {}) {
  return text.replace(/\{(\w+)(?:\.(\w+))?\}/g, (m, role, part) => {
    if (role === 'count') return numberWord(gs.activePlayers?.length || 0);
    if (role === 'host') return seasonConfig?.host || 'Chris';
    const name = who[role] ?? (typeof data[role] === 'string' ? data[role] : undefined);
    if (!name) return m;
    if (!part) return name;
    const p = pronouns(name) || {};
    return p[part] ?? m;
  });
}

/**
 * The ambient scene context: the camp generator (camp-events.js
 * generateCampEventsForGroup) is not handed the episode or the phase, so its
 * callers wrap it in withSceneCtx and every scene written inside reads them.
 * An explicit ctx passed to scriptEvent always wins.
 */
let ambient = null;
export const ambientCtx = () => ambient || {};
export function withSceneCtx(ctx, fn) {
  const prev = ambient;
  ambient = ctx;
  try { return fn(); } finally { ambient = prev; }
}

/** For tests only: muted, a scene is not written (no pick, no ledger). */
export const writing = { muted: false };

/**
 * Episode one, before the first challenge: nobody has a yesterday here yet.
 * A line about the camp's past is held back then; a pool with nothing else
 * keeps what it has rather than going silent.
 */
const PAST = new RegExp(String.raw`(^|[^a-z])(yesterday|last night|last week|all week|this week|day one|for days|every day|every night|lately|any ?more|used to|again|since the start|last time)([^a-z]|$)`, 'i');
const firstDay = ctx => (epOf(ctx)) <= 1 && ctx.phase === 'pre';
function noPast(keys) {
  const out = {};
  for (const k of [].concat(keys)) {
    const pool = POOLS[k] || [];
    const kept = pool.filter(e => !(e.turns || []).some(t => PAST.test(t.say || t.conf || t.beat || '')));
    out[k] = kept.length ? kept : pool;
  }
  return out;
}

/** Pick and fill. Returns { lines, text, lineId }. */
export function writeScene(scene, ctx = {}) {
  if (writing.muted) return { lines: [{ kind: 'beat', by: null, text: scene.kind }], text: scene.kind, lineId: null };
  const rng = sceneRng(scene, ctx);
  // The reasons a line may give, read now (the scene's own data wins).
  scene.data = { ...campContext(scene.who?.a, scene.who?.b), ...(scene.data || {}) };
  const facts = factsFor(scene, ctx);
  // A family's '.any' pool fits every ending, so it is merged with the ending's own.
  const ending = scene.data?.ending || 'any';
  const own = `${scene.kind}.${ending}`, any = `${scene.kind}.any`;
  const key = ending !== 'any' && POOLS[any] ? (POOLS[own] ? [own, any] : any) : own;
  const who = scene.who || {};
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  const speakers = Object.values(who).filter(Boolean);
  const entry = pickEntry(ledger(), firstDay(ctx) ? noPast(key) : POOLS, key, facts, pairKey, rng, speakers, clockOf(ctx));
  if (!entry) throw new Error(`no lines for ${[].concat(key).join(' + ')}`);
  const lines = entry.turns.map(t => {
    const kind = t.conf ? 'conf' : t.beat ? 'beat' : 'say';
    const by = t.by ? who[t.by] || null : null;
    return { kind, by, text: fill(t.conf || t.beat || t.say, who, scene.data || {}) };
  });
  return { lines, text: transcript(lines), lineId: entry.id };
}

/** The script as one paragraph, for the classic camp cards and the text backlog. */
export function transcript(lines) {
  return lines.map(l => l.kind === 'beat' ? l.text
    : l.kind === 'conf' ? `${l.by}, in the confessional: "${l.text}"`
      : `${l.by}: "${l.text}"`).join(' ');
}

/**
 * Write a scene onto its camp event. The event keeps its type, players and
 * badge (spotlight and tests count those); it gains the scene, the lines, the
 * spot, and a `text` that is now the transcript.
 */
export function scriptEvent(event, scene, ctx = {}) {
  return scriptEventParts(event, [scene], ctx);
}

/**
 * Scenes a module could not write itself. players.js (updateChalRecord) sits
 * below this layer — importing it would make a cycle — so it leaves
 * `pendingScene: { kind, who, data, spot, phase }` on its camp event, and
 * this writes them all. Called at the top of text-backlog generateSummaryText,
 * the one place every episode path passes before its text is frozen.
 */
export function scriptPendingScenes(ep) {
  for (const block of Object.values(ep?.campEvents || {})) {
    const events = Array.isArray(block) ? block : [...(block?.pre || []), ...(block?.post || [])];
    for (const ev of events) {
      const p = ev?.pendingScene;
      if (!p) continue;
      delete ev.pendingScene;
      scriptEvent(ev, makeScene(p.kind, p.who, p.data || {}, [], p.spot || null), { ep: ep.num, phase: p.phase || 'post' });
    }
  }
  scriptLooseEvents(ep);
}

// ── A MOMENT THE ENGINE ONLY NARRATED ────────────────────────────────
// Challenges and twists leave camp events that are one narrator's sentence. The sentence stays,
// as the viewer's insight; the people in it then talk about it (lines/aside.js). Nobody new
// learns anything here: the talk is between the people the sentence names, or the one it names
// and the person closest to them, who was there to see it.
const TONES = [
  ['romance', /kiss|romanc|flirt|firstmove|showmance|crush|spark|date/],
  ['tense', /blame|sabotag|ruthless|whip|confront|theft|rival|frame|culprit|throw|steal|fight|clash|grudge|betray|accus|taunt|feud|argument/],
  ['shame', /weak|shame|fail|disaster|breakdown|comedy|bathroom|punish|gobbler|humiliat|chicken|coward|choke|embarrass|wipeout|flop|fumble/],
  ['scheme', /alliance|plan|strateg|manipulat|scheme|captain|deal|council|leverage|discover|intel|spy/],
  ['warm', /rescue|mvp|help|gratitude|bond|team ?player|hero|save|carr|win|clutch|leader|proud|praise|cheer|comfort|thank/],
];
// what the sentence itself says comes first: a gold badge on "bends over, hands on his knees" is
// still somebody who is spent, not somebody to thank
const TEXT_TONES = [
  ['romance', /\bkiss|holds? hands|reaches for .{0,20}hand/i],
  ['strain', /exhaust|hands on (his|her|their) knees|sweat|limp(s|ing)?\b|injur|hurt|pain|can't breathe|throw(s|ing) up|vomit|sick|shiver|freez|bleed|collapse|taking more out of/i],
  ['rally', /gathers (his|her|their) (tribe|team)|lays it out|listen to me|pep talk|fires (the|everyone) up|stands a little taller|rallies|speech/i],
  ['tense', /ruthless|confront|blame|sabotag|shove|snaps at|glare|furious|accus|argu/i],
  ['shame', /laugh(s|ing)? at|in stitches|humiliat|embarrass|face-?plant|wipes? out|falls? flat/i],
  ['scheme', /strategiz|plan|angle|war council|hushed|leverage|on the list/i],
];
function toneOf(ev) {
  const k = `${ev.type || ''} ${ev.badgeText || ''}`.toLowerCase();
  for (const [tone, re] of TEXT_TONES) if (re.test(String(ev.text || ''))) return tone;
  for (const [tone, re] of TONES) if (re.test(k)) return tone;
  if (/\bkiss/i.test(ev.text || '')) return 'romance';
  const c = String(ev.badgeClass || '');
  return /red|bad/.test(c) ? 'tense' : /green|gold|good/.test(c) ? 'warm' : 'plain';
}
const CHAL_WORD = /challenge|race|round|course|phase|relay|lasso|sled|finish line|the break|halftime|score|points|leg of/i;
export function scriptLooseEvents(ep) {
  for (const [camp, block] of Object.entries(ep?.campEvents || {})) {
    const members = (ep.tribesAtStart || []).find(t => t.name === camp)?.members
      || (ep.gsSnapshot?.tribes || []).find(t => t.name === camp)?.members || ep.gsSnapshot?.activePlayers || gs.activePlayers || [];
    for (const [phase, events] of Array.isArray(block) ? [['pre', block]] : [['pre', block?.pre || []], ['post', block?.post || []]]) {
      for (const ev of events) {
        if (!ev || ev.lines?.length || ev.pendingScene || !String(ev.text || '').trim()) continue;
        const named = [...new Set((ev.players || []).filter(n => typeof n === 'string' && n))];
        if (!named.length) continue;
        const a = named[0];
        const pair = named.find(n => n !== a);
        const b = pair || members.filter(n => n !== a && !named.includes(n))
          .sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
        if (!b) continue;
        const insight = String(ev.text).replace(/\s+/g, ' ').trim();
        const data = { reason: pair ? 'pair' : 'watch', ending: ev.tag === 'challenge' || CHAL_WORD.test(insight) ? 'chal' : 'camp' };
        scriptEvent(ev, makeScene(`aside.${toneOf(ev)}`, { a, b }, data, [], null), { ep: ep.num, phase });
        ev.lines = [{ kind: 'beat', by: null, text: insight }, ...ev.lines];
        ev.text = transcript(ev.lines);
        if (!pair && !ev.players.includes(b)) ev.players = [...ev.players, b];
      }
    }
  }
}

/**
 * A scene written in parts, each from its own pool (the traitor's answer, then the
 * group's verdict): two decided things that would otherwise need a pool for every
 * combination. The parts share the people; the event records the first part's scene
 * and every part's line id.
 */
export function scriptEventParts(event, scenes, ctx = {}) {
  ctx = { ...(ambient || {}), ...ctx };
  const parts = scenes.filter(Boolean).map(sc => ({ sc, w: writeScene(sc, ctx) }));
  const [first] = parts;
  event.scene = { kind: first.sc.kind, who: first.sc.who, data: first.sc.data, seenBy: first.sc.seenBy, spot: first.sc.spot,
    lineId: first.w.lineId, ...(parts.length > 1 ? { parts: parts.map(p => ({ kind: p.sc.kind, who: p.sc.who, data: p.sc.data, lineId: p.w.lineId })) } : {}) };
  event.lines = parts.flatMap(p => p.w.lines);
  event.text = transcript(event.lines);
  return event;
}
