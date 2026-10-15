// ══════════════════════════════════════════════════════════════════════
// ch/script/write.js — a decided scene becomes a short script
// ══════════════════════════════════════════════════════════════════════
//
// The engine has decided everything; this only picks words, through the
// shared picker (js/script/pick.js) and its repetition rules: nobody says the
// same sentence twice in a season, nothing is heard twice in a day, a pair
// never gets the same exchange again while anything else fits. The ledger is
// the season's (state.lineLedger); the clock is the day.
//
// A pool entry is { id, when?, turns: [{ by, say | conf | beat }] }:
//   say   said out loud, in the scene
//   conf  a confessional: the camera cuts to the interview chair
//   beat  a stage direction (what they are doing, who walks in)
// Parts are a, b, c, d, and tj (the host). Slots are {target}, {alliance},
// {game}, {gone}, {show_a}, {show_b}; {a.sub}-style pronoun parts as anywhere.
//
// An entry that needs a part or a slot the scene does not have is never
// picked: a line for three people does not air in a scene of two, and
// "{target}" never prints as a brace.
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { stableRng } from '../../script/rng.js';
import { POOLS } from './lines/index.js';
import { rolesOf } from './roles.js';
import { factsFor } from './facts.js';
import { voiceOf } from '../../td/story/voice.js';
import { FAMILY } from '../../td/story/voice-family-map.js';

// ── every line in the speaker's own voice ────────────────────────────
// Total Drama's voice system, unchanged (td/story/voice.js): voiceOf reads a
// character's authored voice, personality, archetype, stats and age into
// ordered tags, strongest first. A turn's `v` holds variants by tag — or by
// family (sharp, dry, loud, soft, odd: voice-family-map.js) — and the
// speaker's strongest tag that has one is what they say. A variant may be a
// list: several ways the same voice says it, picked by the scene's own dice
// (the user, 2026-10-14: "all of them and multiple variants").
// Personality beats age: a hard voice never says an age variant (the Fiore
// rule). A scene somewhere secret keeps a loud voice down.
const AGE = new Set(['kid', 'teen', 'adult', 'grown']);
const HARD = ['cruel', 'schemer', 'proud', 'tough', 'blunt', 'dry', 'bossy'];
const SECRET = new Set(['private', 'confessional']);
// `ledger` + `day`: an alternative heard today, or already said by this speaker this season, is passed
// over while another fits (the picker's own rules, pick.js, applied to the variants).
export function voicedLine(turn, speaker, { hush = false, rng = Math.random, ledger = null, day = 0 } = {}) {
  const base = turn.say || turn.conf;
  const v = turn.v;
  if (!v || !speaker) return { text: base, tag: null };
  const tags = voiceOf(speaker);
  const hard = tags.some(t => HARD.includes(t));
  for (const t of tags) {
    if (hard && AGE.has(t)) continue;
    for (const key of [...new Set([t, FAMILY[t]].filter(Boolean))]) {
      if (hush && key === 'loud') continue;
      const got = [v[key]].flat().filter(Boolean);
      if (!got.length) continue;
      const start = Math.floor(rng() * got.length);
      const order = got.map((_, i) => got[(start + i) % got.length]);
      const vday = ledger ? (ledger.vday ||= {}) : {}, vby = ledger ? (ledger.vby ||= {}) : {};
      // An alternative heard today, or one this speaker has already said this season, is spent: the
      // speaker's next tag speaks (or the line itself). A voiced quirk ("Wait, did I win? I won? I
      // WON!") is funny once; season 777 had one player say it three times in four episodes.
      const fresh = order.find(x => vday[x] !== day && !(vby[x] || []).includes(speaker));
      if (!fresh) continue;
      if (ledger) { vday[fresh] = day; (vby[fresh] ||= []).push(speaker); }
      return { text: fresh, tag: key };
    }
  }
  return { text: base, tag: null };
}

export const HOST = 'TJ';
const TOKEN = /\{(\w+)(?:\.(\w+))?\}/g;

const needCache = new WeakMap();
function needs(entry) {
  if (needCache.has(entry)) return needCache.get(entry);
  const n = new Set();
  for (const t of entry.turns || []) {
    if (t.opt) continue;   // an optional turn is said when its people are there, never required
    if (t.by && t.by !== 'tj') n.add(t.by);
    for (const m of String(t.say || t.conf || t.beat || '').matchAll(TOKEN)) if (m[1] !== 'tj') n.add(m[1]);
  }
  needCache.set(entry, n);
  return n;
}

export function fill(text, roles, slots) {
  return text.replace(TOKEN, (m, role, part) => {
    if (role === 'tj') return HOST;
    const name = roles[role] ?? slots[role];
    if (!name) return m;
    if (!part) return name;
    return pronouns(name)?.[part] ?? m;
  });
}

function poolFor(key, have) {
  const keys = [].concat(key);
  const out = {};
  for (const k of keys) out[k] = (POOLS[k] || []).filter(e => [...needs(e)].every(n => have.has(n)));
  return out;
}

// The pool key for a kind and ending: its own pool merged with the family's
// '.any', so an ending pool never runs dry.
function keyFor(kind, ending) {
  const own = `${kind}.${ending}`, any = `${kind}.any`;
  if (ending !== 'any' && POOLS[own] && POOLS[any]) return [own, any];
  if (POOLS[own]) return own;
  return POOLS[any] ? any : null;
}

/** { lines: [{kind, by, text}], text, lineId } or null when the kind has no pool. */
export function writeScene(state, scene) {
  const r = rolesOf(scene, state);
  if (!r) return null;
  const key = keyFor(scene.kind, r.ending ?? 'any');
  if (!key) return null;
  const have = new Set([...Object.keys(r.roles), ...Object.keys(r.slots)]);
  const pools = poolFor(key, have);
  const facts = factsFor(scene, r, state);
  state.lineLedger ||= newLedger();
  const speakers = Object.values(r.roles);
  const pairKey = [r.roles.a, r.roles.b].filter(Boolean).sort().join('|');
  const rng = stableRng(state.seed, 'line', scene.id);
  const entry = pickEntry(state.lineLedger, pools, key, facts, pairKey, rng, speakers, scene.day);
  if (!entry) return null;
  const hush = SECRET.has(scene.spot);
  const here = t => !t.opt || [t.by, ...[].concat(typeof t.opt === 'string' || Array.isArray(t.opt) ? t.opt : []),
    ...[...String(t.say || t.conf || t.beat || '').matchAll(TOKEN)].map(m => m[1])].every(k => !k || k === 'tj' || have.has(k));
  const lines = entry.turns.map((t, i) => [t, i]).filter(([t]) => here(t) && (!t.when || Object.entries(t.when).every(([k, v]) => facts[k] === v))).map(([t, i]) => {
    const kind = t.conf ? 'conf' : t.beat ? 'beat' : 'say';
    const by = t.by === 'tj' ? HOST : t.by ? r.roles[t.by] : null;
    // TJ is the host, not a cast member: his voice is written into his lines.
    const said = kind === 'beat' || t.by === 'tj' ? { text: t.beat || t.say, tag: null } : voicedLine(t, by, { hush, rng, ledger: state.lineLedger, day: scene.day });
    const line = { kind, by, text: fill(said.text, r.roles, r.slots), voice: said.tag };
    // The turn's place in its entry, for the voice-coverage measurement (not enumerable: never serialised).
    Object.defineProperty(line, 'turn', { value: `${entry.id}:${i}`, enumerable: false });
    return line;
  });
  return { lines, text: transcript(lines), lineId: entry.id };
}

export function transcript(lines) {
  return lines.map(l => (l.kind === 'beat' ? `(${l.text})`
    : l.kind === 'conf' ? `${l.by} [confessional]: ${l.text}` : `${l.by}: ${l.text}`)).join('\n');
}
