// ══════════════════════════════════════════════════════════════════════
// bb/script/write.js — a decided scene becomes a short script
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 §4.2-4.4. The engine has decided everything; this only
// picks words, from the scene's own dice, reading the house without writing
// it. The pick goes through the shared picker (js/script/pick.js) with Big
// Brother's ledger (gs.bb.lineLedger) and clock (the act of the week: two
// scenes in the same act are "the same day").
//
// WRITTEN WHEN IT FIRES. The Circle writes a day at its end because a
// profile can change hands mid-day; a Big Brother scene is written the moment
// its event fires, which reads the house exactly as it stood at the scene.
//
// A script is a list of lines: { kind: 'say' | 'dr' | 'beat', by, text }.
// `dr` is a Diary Room confessional: the viewer cuts to the chair and back.
import { gs } from '../../core.js';
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { POOLS } from './lines/index.js';
import { factsFor } from './facts.js';

const ACT_ORDER = ['hoh', 'nominations', 'veto', 'veto-ceremony', 'campaign', 'eviction'];
export const clockOf = ctx => (ctx.week?.num || 0) * 10 + Math.max(0, ACT_ORDER.indexOf(ctx.act));
const ledger = () => ((gs.bb ||= {}).lineLedger ||= newLedger());

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/**
 * {a}, {b}, {c}, {hoh}; {a.sub}, {a.Obj}, ...; {count} — the people in the house, as a word.
 * Anything else is a name the scene decided and carries in its data: {alliance},
 * {alliance2}, {target} (a person talked about, never a speaker).
 */
export function fill(text, who, ctx = {}, data = {}) {
  return text.replace(/\{(\w+)(?:\.(\w+))?\}/g, (m, role, part) => {
    if (role === 'count') return WORDS[gs.activePlayers?.length || 0] || String(gs.activePlayers?.length || 0);
    const name = role === 'hoh' ? ctx.hoh : (who[role] ?? (typeof data[role] === 'string' ? data[role] : undefined));
    if (!name) return m;
    if (!part) return name;
    const p = pronouns(name) || {};
    return p[part] ?? m;
  });
}

/**
 * For tests only: muted, a scene is not written at all (no pick, no ledger).
 * A season played muted must match one played with words, event for event —
 * the proof that picking a line never moves the engine.
 */
export const writing = { muted: false };

/**
 * Move-in night (week one, before the first Head of Household). Nobody has a yesterday in
 * this house yet: "wait till you hear what {b} said yesterday" aired on the first night.
 * A line that talks about the house's past is held back then; if a pool has nothing else,
 * it keeps what it has rather than going silent.
 */
const PAST = new RegExp(String.raw`(^|[^a-z])(yesterday|last night|last week|all week|this week|day one|for days|every day|every night|these days|lately|any ?more|used to|again|three nights|two nights|since the start)([^a-z]|$)`, "i");
const firstNight = ctx => (ctx.week?.num || 0) === 1 && ctx.phase === 'pre-hoh';
function noPast(key) {
  const out = {};
  for (const k of [].concat(key)) {
    const pool = POOLS[k] || [];
    const kept = pool.filter(e => !(e.turns || []).some(t => PAST.test(t.say || t.dr || t.beat || '')));
    out[k] = kept.length ? kept : pool;
  }
  return out;
}

/** Pick and fill. Returns { lines, text } — `text` is the transcript the old screens and the backlog print. */
export function writeScene(scene, ctx = {}, rng = Math.random) {
  if (writing.muted) return { lines: [{ kind: 'beat', by: null, text: scene.kind }], text: scene.kind, lineId: null };
  const facts = factsFor(scene, ctx);
  // A family's '.any' pool fits every ending, so it is merged with the ending's own.
  const ending = scene.data?.ending || scene.data?.result || 'any';
  const own = `${scene.kind}.${ending}`, any = `${scene.kind}.any`;
  const key = ending !== 'any' && POOLS[any] ? (POOLS[own] ? [own, any] : any) : own;
  const who = scene.who || {};
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  const speakers = Object.values(who).filter(Boolean);
  const entry = pickEntry(ledger(), firstNight(ctx) ? noPast(key) : POOLS, key, facts, pairKey, rng, speakers, clockOf(ctx));
  if (!entry) throw new Error(`no lines for ${key}`);
  const lines = entry.turns.map(t => {
    const kind = t.dr ? 'dr' : t.beat ? 'beat' : 'say';
    const by = t.by ? who[t.by] || (t.by === 'hoh' ? ctx.hoh : null) : null;
    return { kind, by, text: fill(t.dr || t.beat || t.say, who, ctx, scene.data || {}) };
  });
  return { lines, text: transcript(lines), lineId: entry.id };
}

/** The script as one paragraph, for screens that print text. */
export function transcript(lines) {
  return lines.map(l => l.kind === 'beat' ? l.text
    : l.kind === 'dr' ? `${l.by}, in the Diary Room: "${l.text}"`
      : `${l.by}: "${l.text}"`).join(' ');
}
