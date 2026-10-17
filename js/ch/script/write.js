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
import { players } from '../../core.js';
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { stableRng } from '../../script/rng.js';
import { POOLS } from './lines/index.js';
import { rolesOf } from './roles.js';
import { OPENERS, NO_OPENER } from './openers.js';
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
// The archetype's own voice speaks first (the user, 2026-10-16: "their archetype and voice could play more ... yul is
// not sweet is cruel and mean"; "even nice archetype sometimes u dont feel it"). The authored words still come
// next, so a villain written as anxious is a cruel villain first and an anxious one when the line has no cruel take.
const LEAD = { villain: ['cruel', 'schemer'], mastermind: ['schemer', 'calm'], schemer: ['schemer'], hothead: ['loud', 'blunt'],
  'challenge-beast': ['competitive'], hero: ['earnest', 'warm'], 'loyal-soldier': ['earnest'], 'social-butterfly': ['warm'],
  showmancer: ['flirty', 'warm'], underdog: ['earnest'], goat: ['ditzy'], 'chaos-agent': ['chaotic'], wildcard: ['chaotic'] };
function byArchetype(tags, name) {
  const lead = (LEAD[players.find(p => p.name === name)?.archetype] || []).filter(t => tags.includes(t));
  return lead.length ? [...lead, ...tags.filter(t => !lead.includes(t))] : tags;
}
export function voicedLine(turn, speaker, { hush = false, rng = Math.random, ledger = null, day = 0, skip = null } = {}) {
  const base = turn.say || turn.conf;
  const v = turn.v;
  if (!v || !speaker) return { text: base, tag: null };
  const tags = byArchetype(voiceOf(speaker), speaker);
  const hard = tags.some(t => HARD.includes(t));
  for (const t of tags) {
    if (hard && AGE.has(t)) continue;
    for (const key of [...new Set([t, FAMILY[t]].filter(Boolean))]) {
      if (hush && key === 'loud') continue;
      if (skip && (skip.has(key) || skip.has(FAMILY[key]))) continue;
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
  return text.replace(TOKEN, (m, role, part, at, whole) => {
    if (role === 'tj') return HOST;
    const name = roles[role] ?? slots[role];
    if (!name) return m;
    const out = part ? pronouns(name)?.[part] ?? m : String(name);
    // a word in a slot ("three", "they") that starts a sentence starts with a capital
    return /(^|[.!?]\s+)$/.test(whole.slice(0, at)) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
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
// A Pairs season reads a kind's pair pools ('<kind>~pairs.<ending>') INSTEAD of its solo ones when it has them: a
// meeting about "Brody" is a meeting about Brody and his partner, and no solo line about one person going in may air.
function keyFor(kind, ending, pairs = false) {
  if (pairs && (POOLS[`${kind}~pairs.${ending}`] || POOLS[`${kind}~pairs.any`])) return keyFor(`${kind}~pairs`, ending);
  const own = `${kind}.${ending}`, any = `${kind}.any`;
  if (ending !== 'any' && POOLS[own] && POOLS[any]) return [own, any];
  if (POOLS[own]) return own;
  return POOLS[any] ? any : null;
}

/** { lines: [{kind, by, text}], text, lineId } or null when the kind has no pool. */
export function writeScene(state, scene) {
  const r = rolesOf(scene, state);
  if (!r) return null;
  const key = keyFor(scene.kind, r.ending ?? 'any', !!state.options?.pairs);
  if (!key) return null;
  const have = new Set([...Object.keys(r.roles), ...Object.keys(r.slots)]);
  const pools = poolFor(key, have);
  // a scene at the club is at night, at the club: not an entry staged at breakfast, by the pool, in the gym or the
  // kitchen (a party spark opened on "Joel is making breakfast", and the morning sort moved the club to the morning)
  if (scene.spot === 'party') for (const k of Object.keys(pools)) {
    const ok = pools[k].filter(e => !e.turns.some(t => DAYTIME.test(String(t.beat || t.say || t.conf || ''))));
    if (ok.length) pools[k] = ok;
  }
  const facts = factsFor(scene, r, state);
  state.lineLedger ||= newLedger();
  const speakers = Object.values(r.roles);
  const pairKey = [r.roles.a, r.roles.b].filter(Boolean).sort().join('|');
  const rng = stableRng(state.seed, 'line', scene.id);
  // a line written for the scene's mood (an Arena return) or a fight's cause is how that scene sounds: it wins clearly
  const entry = pickEntry(state.lineLedger, pools, key, facts, pairKey, rng, speakers, scene.day, { strong: ['mood', 'cause', 'crowd', 'attachedA', 'attachedB'] });
  if (!entry) return null;
  const hush = SECRET.has(scene.spot);
  // a voice flavors a scene; it does not take over every line of it. Two shouted lines and two jokes a speaker per
  // scene, then their next voice speaks, or the line as written (read 2026-10-16: a loud speaker shouted all seven
  // lines of a spark, "WHERE?!", "Is it GONE?", "SMOOTH!", and an odd one quipped on every turn of an alliance)
  const CAPPED = ['loud', 'odd'], capped = {};
  // ...and three of each in the whole scene, whoever says them (two quirky speakers made four jokes in a row)
  const sceneCount = f => Object.values(capped).reduce((n, c) => n + (c[f] || 0), 0);
  const skipFor = by => new Set(CAPPED.filter(f => (capped[by]?.[f] || 0) >= 2 || sceneCount(f) >= 3));
  const here = t => !t.opt || [t.by, ...[].concat(typeof t.opt === 'string' || Array.isArray(t.opt) ? t.opt : []),
    ...[...String(t.say || t.conf || t.beat || '').matchAll(TOKEN)].map(m => m[1])].every(k => !k || k === 'tj' || have.has(k));
  const lines = entry.turns.map((t, i) => [t, i]).filter(([t]) => here(t) && (!t.when || Object.entries(t.when).every(([k, v]) => facts[k] === v))).map(([t, i]) => {
    const kind = t.conf ? 'conf' : t.beat ? 'beat' : 'say';
    const by = t.by === 'tj' ? HOST : t.by ? r.roles[t.by] : null;
    // TJ is the host, not a cast member: his voice is written into his lines.
    const said = kind === 'beat' || t.by === 'tj' ? { text: t.beat || t.say, tag: null } : voicedOnce(state, t, by, { hush, rng, ledger: state.lineLedger, day: scene.day, skip: skipFor(by) });
    const fam = said.tag && (CAPPED.includes(said.tag) ? said.tag : FAMILY[said.tag]);
    if (CAPPED.includes(fam)) ((capped[by] ||= {})[fam] = (capped[by][fam] || 0) + 1);
    // a scene picked because of how its speaker talks (when: register for a, registerB for b) is already in that
    // speaker's voice, written that way, even where no variant was swapped in
    const reg = !said.tag && kind !== 'beat' && t.by !== 'tj' && ((t.by === 'a' && entry.when?.register) || (t.by === 'b' && entry.when?.registerB));
    const line = { kind, by, text: fill(said.text, r.roles, r.slots), voice: said.tag || (reg ? `register:${reg}` : null) };
    // The turn's place in its entry, for the voice-coverage measurement (not enumerable: never serialised).
    Object.defineProperty(line, 'turn', { value: `${entry.id}:${i}`, enumerable: false });
    return line;
  });
  // a conversation that would start on somebody already talking gets its setting first (openers.js)
  // ...and a moment of somebody alone, all confessional, gets the moment that set it off
  const solo = lines.length && lines.every(l => l.kind === 'conf');
  if ((lines[0]?.kind === 'say' && lines[0].by !== HOST || solo) && !NO_OPENER.has(scene.kind)) {
    const used = ((state.openerUsed ||= {})[scene.day] ||= {});
    const pool = (OPENERS[`${scene.kind}.${r.ending}`] || OPENERS[scene.kind] || []).filter(t => !used[t] && [...t.matchAll(TOKEN)].every(m => have.has(m[1])));
    if (pool.length) {
      const t = pool[Math.floor(stableRng(state.seed, 'opener', scene.id)() * pool.length)];
      used[t] = 1;
      lines.unshift({ kind: 'beat', by: null, text: fill(t, r.roles, r.slots), voice: null });
    }
  }
  // what the speaker really thinks, after the scene (vote.js houseDebate: a reason pitched that is not their own)
  if (scene.data?.afterConf?.text && Object.values(r.roles).includes(scene.data.afterConf.by)) {
    lines.push({ kind: 'conf', by: scene.data.afterConf.by, text: scene.data.afterConf.text, voice: null });
  }
  // what it is about, said before anybody speaks (cause.js: a fight never starts in a feud nobody saw)
  if (scene.data?.causeLine) {
    const at = lines.findIndex(l => l.kind !== 'beat');
    lines.splice(at < 0 ? lines.length : at, 0, { kind: 'beat', by: null, text: scene.data.causeLine, voice: null });
  }
  return { lines, text: transcript(lines), lineId: entry.id, at: entry.at || placeOfWords(scene.spot, lines, scene.kind) };
}

// Where the words put a scene (the user, 2026-10-15: "they said things like door shut when they're
// outside", "make sure events match location"). A scene whose spot is not fixed (a private talk, the villa,
// the common room) is staged where its own lines say it is: a door or a bunk is the bedroom, the couch the
// common room, the sand the beach. A scene with a fixed place (the kitchen, the gym, the hot tub, the
// Arena, the daily, the party) keeps it. The first place the lines name wins.
const FLEXIBLE = new Set(['private', 'villa', 'public', null, undefined]);
const DAYTIME = /\b(breakfast|this morning|in the morning|afternoon|sunbathe|sunbathing|lounger|loungers|the pool|poolside|gym|kitchen|fridge|stove|the sun goes down|sunset)\b/i;
const PLACE_WORDS = [
  ['bedroom', /\b(bunk|bunks|bedroom|mattress|pillow|pillows|blanket|alarm|(shut|shuts|close|closes|closed|slams?|pushes) the door|doors? shut|door clicks)\b/i],
  ['kitchen', /\b(kitchen|fridge|stove|counter|cupboard|sink|dishes|eggs|breakfast table|cooking)\b/i],
  ['public', /\b(couch|sofa|the TV|common room)\b/i],
  ['pool', /\b(pool|poolside|lounger|loungers|pool deck)\b/i],
  ['hot-tub', /\b(hot tub|the tub)\b/i],
  ['beach', /\b(beach|sand|ocean|waves|shore|the water's edge)\b/i],
  ['gym', /\b(gym|weights|bench press|treadmill)\b/i],
  ['lookout', /\b(lookout)\b/i],
];
// The villa reveal is a tour: it names every room and stays at the villa. A confessional is the chair,
// unless a stage direction puts the person somewhere ("lies awake on a lounger by the pool").
const TOURS = new Set(['villa-reveal', 'arrival']);
// TJ gathering the house stays where he gathered it, whatever somebody says about breakfast or the pool in it (the
// user, 2026-10-17: "the rankings, why are they not in the common room?": a reaction naming the pool moved them)
const ANNOUNCE = new Set(['tj-double', 'tj-house-meeting', 'tj-at-breakfast', 'power-rankings', 'quit', 'medical', 'disqualified',
  'purge', 'pass-earned', 'pass-cut', 'redemption-closed', 'late-arrival']);
function placeOfWords(spot, lines, kind) {
  if (TOURS.has(kind) || ANNOUNCE.has(kind)) return null;
  if (spot === 'confessional') lines = lines.filter(l => l.kind === 'beat');
  else if (!FLEXIBLE.has(spot)) return null;
  for (const l of lines) {
    for (const [place, re] of PLACE_WORDS) if (re.test(l.text)) return place;
  }
  return null;
}

// A voice's version of a line, never one already said that day by somebody else (two loud winners of the
// same daily both shouted "WHO'S NEXT?! WHO'S NEXT?!"): draw again, then fall back to the line as written.
// voicedLine already passes over a variant heard today and marks the one it gives (the same ledger.vday). This
// used to check the variant against that mark again, AFTER voicedLine had set it, so every variant looked heard
// and the plain line won: 8 voiced lines in 10,000 over three seasons (2026-10-16, the user: "yul is not sweet
// is cruel and mean").
function voicedOnce(state, t, by, opts) {
  const used = (state.lineLedger.vday ||= {});
  const r = voicedLine(t, by, opts);
  if (r?.tag) return r;
  const base = t.say || t.conf;
  if (base && base.length > 4) used[base] = opts.day;   // a template is short before its name fills in
  return { text: base, tag: null };
}

export function transcript(lines) {
  return lines.map(l => (l.kind === 'beat' ? `(${l.text})`
    : l.kind === 'conf' ? `${l.by} [confessional]: ${l.text}` : `${l.by}: ${l.text}`)).join('\n');
}
