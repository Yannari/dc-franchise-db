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
import { gs, players } from '../../core.js';
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { POOLS } from './lines/index.js';
import { factsFor } from './facts.js';
import { tidySpoken, tidyNames } from '../../vp-tr/tidy.js';
import { variantOf } from '../story/register.js';

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
    // a scene that carries its own count (the vote as the host read it: 'Seven to two') says that;
    // otherwise {count} is how many are in the house (the audit, 2026-10-06: 'Ten.' for a 7-2 vote)
    if (role === 'count') return typeof data.count === 'string' ? data.count : (WORDS[gs.activePlayers?.length || 0] || String(gs.activePlayers?.length || 0));
    const name = role === 'hoh' ? ctx.hoh : (who[role] ?? (typeof data[role] === 'string' ? data[role] : undefined));
    if (!name) return m;
    if (!part) return name;
    const p = pronouns(name) || {};
    return p[part] ?? m;
  });
}

/**
 * A name said twice in one sentence becomes a pronoun, and a "they" takes its verb (the user,
 * 2026-10-14: "the writing is not good"; read: "does Hicks act like Hicks's already won",
 * "Nichelle knows exactly what Nichelle did"). The pools write people as slots and cannot know who
 * fills them, so the repeat is fixed once the names are in: spoken lines and confessionals by
 * tidySpoken, beats by tidyNames, the same pass Total Drama's story lines and The Traitors use.
 */
// "Hicks's one of those": a name ending in s, contracted ("{a}'s gone", "{a}'s one of those"), reads as a
// possessive. Said out in full instead: "Hicks is one of those", "Hicks has been".
const S_IS = /\b([A-Z][a-z]*s)'s (been|got|one|going|gone|not|a|an|the|just|so|really|always|never|still|already|right|wrong|in|at|on|too|very|my|our|your|doing|counting|scared|safe|fine|leaving|staying|coming|lying|talking|playing|trying)\b/g;
const sIs = t => t.replace(S_IS, (m, n, w) => `${n} ${w === 'been' || w === 'got' ? 'has' : 'is'} ${w}`);
// ...and what tidyNames leaves in a stage direction ("Bowie has made up a game: Bowie reads out...", "Owen
// goes back to what Owen was doing", read 2026-10-14): the second time in a sentence is a pronoun, unless
// somebody else in the sentence would take the same one, or it is a "they" that would need its verb changed
const escRe = n => String(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const VERBISH = /^(?!(this|his|its|us|always|plus|yes|towards|afterwards|across|less|perhaps|sometimes|besides|anyways)$)(is|was|has|had|does|did|can|could|will|would|should|might|must|isn't|wasn't|hasn't|doesn't|didn't|can't|won't|[a-z]+ed|[a-z]{2,}[^s']s)$/;
const SUBJ_AFTER = /^(how|who|what|when|where|why|because|if|while|until|unless|whether|that)$/;
function beatRepeats(text) {
  const cast = [...new Set((players || []).map(p => p?.name).filter(Boolean))];
  return String(text).split(/(?<=[.!?])\s+/).map(sent => {
    for (const n of cast) {
      const re = new RegExp(`\\b${escRe(n)}\\b('s)?`, 'g');
      if ((sent.match(re) || []).length < 2) continue;
      const p = pronouns(n) || {};
      if (!p.sub) continue;
      if (cast.some(o => o !== n && new RegExp(`\\b${escRe(o)}\\b`).test(sent) && (pronouns(o) || {}).sub === p.sub)) continue;
      let seen = false;
      sent = sent.replace(re, (m, poss, at, whole) => {
        if (!seen) { seen = true; return m; }
        if (poss) return p.posAdj || m;
        const next = (whole.slice(at + m.length).match(/^\s+([a-z']+)/) || [])[1] || '';
        // after "how" or "who" the name starts a clause, so it is the subject whatever follows (read
        // 2026-10-15: "asks Beth how her always seems to know", "the talk about who her put up")
        const prev = ((whole.slice(0, at).match(/([A-Za-z']+)\s+$/) || [])[1] || '').toLowerCase();
        if (SUBJ_AFTER.test(prev) || VERBISH.test(next)) return p.sub === 'they' ? m : p.sub;
        return p.obj || m;
      });
    }
    return sent;
  }).join(' ');
}
export const said = (kind, text) => sIs(kind === 'beat' ? beatRepeats(tidyNames(text)) : tidySpoken(text));

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

// ── a line spent only if it airs ──
// The engine writes an event's scene the moment it fires, and the picker notes the line as used then; the director
// airs a subset of the week's events (bb/story/director.js), and the rest never reach a screen. Their lines stayed
// spent: whole pools ran dry on scenes nobody saw while the ones that aired came round again (read 2026-10-15: pk2.s4
// to s6 never aired, s1 to s3 aired twice). A tracked write keeps what it noted; the director confirms the ones it
// airs, and at the end of the week the rest are given back. Noted at the pick, not at the airing, so two events in one
// stretch still never take the same line.
const PENDING = new Map();
let tokenSeq = 0;
export function lineAired(token) { if (token) PENDING.delete(token); }
export function refundUnaired() {
  const u = gs.bb?.lineLedger;
  if (u) for (const { id, speakers, pairKey } of PENDING.values()) {
    if (u.uses?.[id] > 0) { u.uses[id]--; if (!u.uses[id]) delete u.uses[id]; }
    for (const sp of speakers) { const by = u.by?.[id]; const i = by ? by.lastIndexOf(sp) : -1; if (i >= 0) by.splice(i, 1); }
    const pr = u.pairs?.[id]; const j = pr ? pr.lastIndexOf(pairKey) : -1; if (j >= 0) pr.splice(j, 1);
  }
  PENDING.clear();
}

/** Pick and fill. Returns { lines, text } — `text` is the transcript the old screens and the backlog print. */
export function writeScene(scene, ctx = {}, rng = Math.random, { track = false } = {}) {
  if (writing.muted) return { lines: [{ kind: 'beat', by: null, text: scene.kind }], text: scene.kind, lineId: null };
  const facts = factsFor(scene, ctx);
  // A family's '.any' pool fits every ending, so it is merged with the ending's own.
  const ending = scene.data?.ending || scene.data?.result || 'any';
  const own = `${scene.kind}.${ending}`, any = `${scene.kind}.any`;
  // a scene that knows what it is about takes the pool written for that, when there is one
  // (lines/blowup.js: a blow-up over the washing-up says so in its first line)
  const about = scene.data?.reason && POOLS[`${scene.kind}.about-${scene.data.reason}`] ? `${scene.kind}.about-${scene.data.reason}` : null;
  const key = about || (ending !== 'any' && POOLS[any] ? (POOLS[own] ? [own, any] : any) : own);
  const who = scene.who || {};
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  const speakers = Object.values(who).filter(Boolean);
  const entry = pickEntry(ledger(), firstNight(ctx) ? noPast(key) : POOLS, key, facts, pairKey, rng, speakers, clockOf(ctx), { fresh: true });
  if (!entry) throw new Error(`no lines for ${key}`);
  let lineToken = null;
  if (track) { lineToken = `ln${++tokenSeq}`; PENDING.set(lineToken, { id: entry.id, speakers, pairKey }); }
  const lines = entry.turns.map(t => {
    const kind = t.dr ? 'dr' : t.beat ? 'beat' : 'say';
    const by = t.by ? who[t.by] || (t.by === 'hoh' ? ctx.hoh : null) : null;
    return { kind, by, text: said(kind, fill(variantOf(t, by, `${entry.id}|${pairKey}|${ctx.week?.num || 0}`) ?? (t.dr || t.beat || t.say), who, ctx, scene.data || {})) };
  });
  return { lines, text: transcript(lines), lineId: entry.id, lineToken };
}

/** The script as one paragraph, for screens that print text. */
export function transcript(lines) {
  return lines.map(l => l.kind === 'beat' ? l.text
    : l.kind === 'dr' ? `${l.by}, in the Diary Room: "${l.text}"`
      : `${l.by}: "${l.text}"`).join(' ');
}
