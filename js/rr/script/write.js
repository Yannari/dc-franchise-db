// ══════════════════════════════════════════════════════════════════════
// rr/script/write.js — a decided scene becomes a short script
// ══════════════════════════════════════════════════════════════════════
//
// The engine has decided everything; this only picks words (manual §19.2 step 5), through the
// shared picker (js/script/pick.js) and its repetition rules: nobody says the same exchange
// twice in a season, nothing is heard twice in a leg, a pair never gets the same exchange again
// while anything else fits. The ledger is the season's (state.lineLedger); the clock is the leg.
//
// A pool entry is { id, when?, turns: [{ by, say | conf | beat, v?, id?, opt?, when?, keep? }] }:
//   say   said out loud, in the scene        conf  the interview chair        beat  a stage direction
//   by    a…f (rr/script/roles.js), don, local
//   v     variants by voice tag or family (sharp, dry, loud, soft, odd), and `rel:<family>` for how a
//         relationship says it (family, romantic, exes, friends, rivals)
//   id    an identity hook: the speaker's team says its own line there (identity.js)
// Voices as The Challenge's (ch/script/write.js): the archetype's voice speaks first, the Fiore
// rule (a hard voice never says an age variant), two loud or odd lines a speaker a scene.
import { players } from '../../core.js';
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { stableRng } from '../../script/rng.js';
import { voiceOf } from '../../td/story/voice.js';
import { FAMILY } from '../../td/story/voice-family-map.js';
import { POOLS } from './lines/index.js';
import { rolesOf, DON } from './roles.js';
import { SCENES, relFamOf } from '../scenes.js';
import { factsFor } from './facts.js';
import { identityLine } from './identity.js';

// The moments the director makes itself, from the leg's record (not engine scenes): kind -> endings.
export const DIRECTOR_KINDS = {
  'task-start': ['any'],
  'task-try': ['first-try', 'after-fails', 'struggling', 'switched', 'quit'],
  'task-done': ['any'],
  // the system's own moments (tasks.js, travel.js, twists.js): one ending each
  'attempt-fail': ['any'], 'quit-task': ['any'], 'helped-botch': ['any'], 'allin-alone': ['any'],
  'travel-mishap': ['any'], 'found-flight': ['any'], 'same-flight': ['any'], 'express-used': ['any'],
  'yield-found': ['any'], 'yield-decide': ['any'],
  // a big cast (director.js BIG_CAST): Don checks in a team with no story this leg in a line, and the clean
  // runs of teams like it at a task are shown together ({teams} names them)
  'mat-montage': ['any'], 'task-montage': ['any'],
};

const AGE = new Set(['kid', 'teen', 'adult', 'grown']);
const HARD = ['cruel', 'schemer', 'proud', 'tough', 'blunt', 'dry', 'bossy'];
const LEAD = { villain: ['cruel', 'schemer'], mastermind: ['schemer', 'calm'], schemer: ['schemer'], hothead: ['loud', 'blunt'],
  'challenge-beast': ['competitive'], hero: ['earnest', 'warm'], 'loyal-soldier': ['earnest'], 'social-butterfly': ['warm'],
  showmancer: ['flirty', 'warm'], underdog: ['earnest'], goat: ['ditzy'], 'chaos-agent': ['chaotic'], wildcard: ['chaotic'] };
const CAPPED = ['loud', 'odd'];

function byArchetype(tags, name) {
  const lead = (LEAD[players.find(p => p.name === name)?.archetype] || []).filter(t => tags.includes(t));
  return lead.length ? [...lead, ...tags.filter(t => !lead.includes(t))] : tags;
}

// The speaker's version of a turn: the relationship's line first (how siblings say it is not how exes
// do), then the speaker's strongest voice that has a variant, then the line as written. A variant heard
// this leg, or already said by this speaker this season, is passed over.
export function voicedLine(turn, speaker, { relFam = null, rng = Math.random, ledger = null, clock = 0, skip = null } = {}) {
  const base = turn.say || turn.conf;
  const v = turn.v;
  if (!v || !speaker) return { text: base, tag: null };
  const vday = ledger ? (ledger.vday ||= {}) : {}, vby = ledger ? (ledger.vby ||= {}) : {};
  const fresh = list => {
    const got = [list].flat().filter(Boolean);
    if (!got.length) return null;
    const start = Math.floor(rng() * got.length);
    const order = got.map((_, i) => got[(start + i) % got.length]);
    return order.find(x => vday[x] !== clock && !(vby[x] || []).includes(speaker)) || null;
  };
  const spend = x => { if (ledger) { vday[x] = clock; (vby[x] ||= []).push(speaker); } };
  if (relFam && v[`rel:${relFam}`]) {
    const x = fresh(v[`rel:${relFam}`]);
    if (x) { spend(x); return { text: x, tag: `rel:${relFam}` }; }
  }
  const tags = byArchetype(voiceOf(speaker), speaker);
  const hard = tags.some(t => HARD.includes(t));
  for (const t of tags) {
    if (hard && AGE.has(t)) continue;
    for (const key of [...new Set([t, FAMILY[t]].filter(Boolean))]) {
      if (skip && (skip.has(key) || skip.has(FAMILY[key]))) continue;
      const x = fresh(v[key]);
      if (!x) continue;
      spend(x);
      return { text: x, tag: key };
    }
  }
  return { text: base, tag: null };
}

const TOKEN = /\{(\w+)(?:\.(\w+))?\}/g;
export function fill(text, roles, slots) {
  return String(text).replace(TOKEN, (m, role, part, at, whole) => {
    const name = role === 'don' ? DON : roles[role] ?? slots[role];
    if (name == null) return m;
    const out = part ? pronouns(name)?.[part] ?? m : String(name);
    return /(^|[.!?]\s+)$/.test(whole.slice(0, at)) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  });
}

const needCache = new WeakMap();
function needs(entry) {
  if (needCache.has(entry)) return needCache.get(entry);
  const n = new Set();
  for (const t of entry.turns || []) {
    if (t.opt) continue;
    if (t.by) n.add(t.by);
    for (const m of String(t.say || t.conf || t.beat || '').matchAll(TOKEN)) n.add(m[1]);
  }
  needCache.set(entry, n);
  return n;
}

// Facts that decide how a scene sounds, weighed four times an ordinary one: what caused it, the storyline it moves,
// and where it is: a place's own lines and a challenge's own lines win over the general ones when they fit.
export const STRONG = ['cause', 'threadStep', 'place', 'taskId'];
// ...and a place's or a challenge's own line, when one fits, always wins (it airs once a visit; the ledger stops repeats)
export const PREFER = ['place', 'taskId'];
// the challenges that have their own lines (the director airs the challenge itself for them)
export const TASK_LINES = new Set(Object.values(POOLS).flatMap(l => l.map(e => e.when?.taskId)).filter(Boolean));

// Endings the kind's general lines can't speak for (a check-in that never mentions the penalty): their own pool only.
export const OWN_ONLY = new Set(['don-place.penalty-reveal']);

function keyFor(kind, ending) {
  const own = `${kind}.${ending}`, any = `${kind}.any`;
  if (OWN_ONLY.has(own) && POOLS[own]) return own;
  if (ending !== 'any' && POOLS[own] && POOLS[any]) return [own, any];
  if (POOLS[own]) return own;
  return POOLS[any] ? any : null;
}

const ORDINAL = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth'];
const speakerName = (by, roles, slots) => (by === 'don' ? DON : by === 'local'
  ? (slots.local ? slots.local.charAt(0).toUpperCase() + slots.local.slice(1) : 'A local') : roles[by]);

/** { lines: [{ kind, by, text, voice }], lineId } or null when the kind has no pool (or no entry fits). */
export function writeScene(state, scene, { roles: given = null } = {}) {
  const r = given || rolesOf(scene, state);
  if (!r) return null;
  const key = keyFor(scene.kind, r.ending ?? 'any');
  if (!key) return null;
  if (scene.data?.place != null && ORDINAL[scene.data.place]) r.slots.placing = ORDINAL[scene.data.place];
  const have = new Set([...Object.keys(r.roles), ...Object.keys(r.slots)]);
  const pools = {};
  for (const k of [].concat(key)) pools[k] = (POOLS[k] || []).filter(e => [...needs(e)].every(n => have.has(n)));
  const facts = factsFor(scene, r, state);
  state.lineLedger ||= newLedger();
  const clock = scene.leg ?? state.leg;
  const speakers = Object.entries(r.roles).filter(([k]) => k !== 'don' && k !== 'local').map(([, n]) => n);
  const pairKey = [r.roles.a, r.roles.b].filter(Boolean).sort().join('|');
  const rng = stableRng(state.seed, 'rr-line', scene.id);
  const entry = pickEntry(state.lineLedger, pools, key, facts, pairKey, rng, speakers, clock, { strong: STRONG, prefer: PREFER });
  if (!entry) return null;
  const relFam = scene.data?.snap?.relFam || null;
  const capped = {};
  const sceneCount = f => Object.values(capped).reduce((n, c) => n + (c[f] || 0), 0);
  const skipFor = by => new Set(CAPPED.filter(f => (capped[by]?.[f] || 0) >= 2 || sceneCount(f) >= 3));
  const here = t => !t.opt || [t.by, ...[...String(t.say || t.conf || t.beat || '').matchAll(TOKEN)].map(m => m[1])]
    .every(k => !k || have.has(k));
  const fits = t => !t.when || Object.entries(t.when).every(([k, v]) => (Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v));
  const lines = [];
  entry.turns.forEach((t, i) => {
    if (!here(t) || !fits(t)) return;
    const kind = t.conf ? 'conf' : t.beat ? 'beat' : 'say';
    const by = t.by ? speakerName(t.by, r.roles, r.slots) : null;
    let said;
    if (kind === 'beat' || t.by === 'don' || t.by === 'local') said = { text: t.beat || t.say || t.conf, tag: null };
    else if (t.id && (said = identityLine(state, by, t.id, rng))) said = { text: said, tag: `id:${t.id}` };
    // a speaker's relationship lines are their own team's (c and d are the other team; in a romance the crush, b, and
    // b's partner d are; in a room, each speaker's own)
    else said = voicedLine(t, by, { relFam: SCENES[scene.kind]?.cast === 'group' || scene.kind === 'same-flight' ? relFamOfPerson(state, by)
      : (SCENES[scene.kind]?.family === 4 ? ['b', 'd'] : ['c', 'd']).includes(t.by) ? scene.data?.snap?.relFamB || null : relFam, rng,
      ledger: state.lineLedger, clock, skip: skipFor(by) });
    const fam = said.tag && (CAPPED.includes(said.tag) ? said.tag : FAMILY[said.tag]);
    if (CAPPED.includes(fam)) ((capped[by] ||= {})[fam] = (capped[by][fam] || 0) + 1);
    // an identity line names the speaker's own partner
    const slots = said.tag?.startsWith('id:') ? { ...r.slots, partner: partnerOf(state, by) } : r.slots;
    const line = { kind, by, text: fill(said.text, r.roles, slots), voice: said.tag };
    Object.defineProperty(line, 'turn', { value: `${entry.id}:${i}`, enumerable: false });
    lines.push(line);
  });
  // the team's identity, heard at a natural moment (when the entry didn't already call one)
  if (!lines.some(l => String(l.voice || '').startsWith('id:'))) {
    const hook = AUTO_HOOK[scene.kind]?.(facts);
    // whoever didn't just speak says it (a, unless a had the last word; then a's partner)
    let end = lines.length;
    if (!scene.kind.startsWith('int-')) while (end > 0 && lines[end - 1].kind === 'conf') end--;
    const lastBy = lines.slice(0, end).reverse().find(l => l.kind !== 'beat')?.by;
    const partner = r.roles.b && partnerOf(state, r.roles.a) === r.roles.b ? r.roles.b : null;
    const who = lastBy === r.roles.a && partner ? partner : r.roles.a;
    if (hook && who && stableRng(state.seed, 'rr-idhook', scene.id)() < AUTO_SHARE) {
      const said = identityLine(state, who, hook, stableRng(state.seed, 'rr-idline', scene.id));
      // said in the scene: before the closing interview, if the scene ends on one
      let at = lines.length;
      if (!scene.kind.startsWith('int-')) while (at > 0 && lines[at - 1].kind === 'conf') at--;
      if (said && at > 0) lines.splice(at, 0, { kind: scene.kind.startsWith('int-') ? 'conf' : 'say', by: who,
        text: fill(said, r.roles, { ...r.slots, partner: partnerOf(state, who) }), voice: `id:${hook}`, auto: true });
    }
  }
  return { lines, lineId: entry.id };
}

// Where a team's identity speaks on its own (identity.js hooks), and how often: at a task it's good or bad at,
// when a task keeps failing or is given up, on arriving somewhere new, first or last on the mat, going home,
// at a rival in trash talk, at a friend in good small talk.
const AUTO_SHARE = 0.5;
const AUTO_HOOK = {
  // after-fails is the try that finally worked: no struggle line over it
  'task-try': f => (f.ending === 'quit' ? 'quit' : f.ending === 'struggling' ? 'struggle' : f.ending === 'after-fails' ? null
    : f.idGood ? 'good' : f.idBad ? 'bad' : null),
  'task-start': f => (f.idGood ? 'good' : f.idBad ? 'bad' : null),
  'task-done': f => (f.ahead ? 'win' : null),
  'celebrate': f => (f.ending === 'gloat-at-others' ? null : 'win'),
  'arrival-awe': () => 'arrive',
  'don-place': f => (f.matPlace === 'first' ? 'mat-first' : f.matPlace === 'last' ? 'mat-last' : null),
  'int-exit': () => 'elim',
  'trash-talk': () => 'about-friction',
  'gloat': () => 'about-friction',
  'small-talk': f => (f.ending === 'click' ? 'about-friend' : null),
};

function relFamOfPerson(state, n) {
  const t = Object.values(state.teams).find(x => x.a === n || x.b === n);
  return t ? relFamOf(t.rel) : null;
}

function partnerOf(state, n) {
  const t = Object.values(state.teams).find(x => x.a === n || x.b === n);
  return t ? (t.a === n ? t.b : t.a) : null;
}

export function transcript(lines) {
  return lines.map(l => (l.kind === 'beat' ? `(${l.text})` : l.kind === 'conf' ? `${l.by} [interview]: ${l.text}` : `${l.by}: ${l.text}`)).join('\n');
}
