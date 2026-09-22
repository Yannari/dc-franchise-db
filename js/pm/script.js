// ══════════════════════════════════════════════════════════════════════
// pm/script.js — an event becomes a short scene
// ══════════════════════════════════════════════════════════════════════
//
// A pool entry is a SCRIPT: at most one line of staging, a few turns of real
// dialogue, a closing beat (spec §16.5). The engine has already decided what
// happened; this file only picks words for it. So it draws from its own dice
// stream — a line can never change a result — and it may only test the facts
// in FACT_KEYS, each from the speaker's own point of view (§7): a speaker who
// names what {c} did must be somebody who knows it.
//
// The row stores strings, never a pool reference it has to re-resolve.
import { players } from '../core.js';
import { pronounsOf } from '../pronouns-of.js';
import { SHOWS } from '../shows.js';
import { streamFor } from '../dr/rng.js';
import { stepOf, believedStep, situationship } from './ladder.js';
import { emo, attachmentLabel } from './emotions.js';
import { romance, shown } from './feelings.js';
import { DAY } from './lines/day.js';
import { HUT } from './lines/hut.js';

export const POOLS = { ...DAY };
export { HUT };

export const SPEAKERS = ['a', 'b', 'c', 'dior', 'narrator'];
export const FACT_KEYS = ['rung', 'thinks', 'persona', 'intent', 'attachment', 'mood', 'bombshell',
  'early', 'coupled', 'gap', 'knows', 'faking', 'bPersona', 'bMood', 'bRung', 'stance', 'family',
  'choice', 'cause', 'channel', 'stole', 'bTaken', 'archetype', 'taken', 'loyal', 'late', 'gender', 'bGender', 'myRung', 'phase'];

// Archetype groups a pool may name instead of listing them (CLAUDE.md).
export const VILLAINS = ['villain', 'mastermind', 'schemer'];
export const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

const partnerOf = (state, n) => { const c = state.couples.find(x => x.includes(n)); return c ? (c[0] === n ? c[1] : c[0]) : null; };

/** The one mood a line may lean on — the loudest feeling, or none. Narration only. */
export function moodOf(state, n) {
  const e = emo(state, n);
  const jealous = Math.max(0, ...Object.values(e.jealousy || {}));
  const loud = [['jealous', jealous], ['heartbroken', e.heartbreak], ['stressed', e.stress - 2],
    ['guilty', e.guilt], ['lonely', e.loneliness - 1]].sort((x, y) => y[1] - x[1])[0];
  if (loud[1] >= 4) return loud[0];
  return e.security >= 7 ? 'secure' : null;
}

/**
 * What `viewer` knows about `subject`'s secrets: what they saw, what they were
 * told as the partner, and what was shown to the whole villa. Nothing else.
 */
export function knowsAbout(state, viewer, subject) {
  return state.secrets.some(s => s.who === subject && (s.witnesses.includes(viewer)
    || (s.known && s.partner === viewer) || s.public));
}

const faking = (state, a, b) => b != null && shown(state, a, b) - romance(a, b) >= 3;

/** The only facts a script's `when` may test. */
export function factsFor(state, ev) {
  const [a, b, c] = ev.players;
  const pa = state.profiles[a], pb = b ? state.profiles[b] : null;
  const firstEp = state.ledger?.firstEp?.[a] ?? state.ep;
  const f = {
    rung: b ? stepOf(state, a, b) : null,
    thinks: b ? believedStep(state, a, b) : null,
    persona: pa?.persona || null,
    intent: pa?.intent || null,
    attachment: pa ? attachmentLabel(pa) : null,
    mood: moodOf(state, a),
    bombshell: pa ? pa.role !== 'starter' : false,
    early: state.ep - firstEp <= 1,
    coupled: !!b && partnerOf(state, a) === b,
    gap: !!b && (situationship(state, a, b) || situationship(state, b, a)),
    knows: !!c && knowsAbout(state, a, c),
    faking: faking(state, a, b),
    bPersona: pb?.persona || null,
    bMood: b ? moodOf(state, b) : null,
    bRung: b ? stepOf(state, b, a) : null,
    bTaken: !!b && !!partnerOf(state, b) && partnerOf(state, b) !== a,
    archetype: players.find(p => p.name === a)?.archetype || null,
    taken: !!partnerOf(state, a) && partnerOf(state, a) !== b,
    // Where a stands with a's OWN partner — for scenes where b is somebody else.
    myRung: partnerOf(state, a) ? stepOf(state, a, partnerOf(state, a)) : null,
    // Narration only: a threshold picks words, never an outcome (CLAUDE.md).
    loyal: (pa?.stats?.loyalty ?? 5) >= 7,
    late: state.ep >= 9,                     // "weeks" is only true from here
    // A line says "the girls" or "the lads" only when the roster says so.
    gender: players.find(p => p.name === a)?.gender || null,
    bGender: b ? players.find(p => p.name === b)?.gender || null : null,
  };
  f.phase = ev.phase || null;          // morning, day, event (the challenge), evening, firepit…
  for (const k of ['choice', 'cause', 'channel', 'stole']) if (ev.extra?.[k] != null) f[k] = ev.extra[k];
  return f;
}

function matches(when, facts) {
  if (!when) return true;
  for (const [k, want] of Object.entries(when)) {
    const have = facts[k];
    if (Array.isArray(want) ? !want.includes(have) : want !== have) return false;
  }
  return true;
}

// ── the repetition guard ─────────────────────────────────────────────
// Never the same entry twice for one pair in a season, never twice in one
// episode, and discounted for three episodes after: a pool is walked, not looped.
const pairKey = ps => [...ps].sort().join('+');
function usage(state) { return (state.usedScripts ||= {}); }
function weightFor(state, entry, ps, facts) {
  const u = usage(state)[entry.id];
  let w = 1 + Object.keys(entry.when || {}).length;          // the more it fits, the likelier
  if (!u) return w;
  if (u.pairs.includes(pairKey(ps))) return 0;
  // Twice in one episode is a repeat the viewer sees, whoever says it.
  const last = u.eps[u.eps.length - 1];
  if (last === state.ep) return 0;
  if (state.ep - last <= 3) w *= 0.4;
  return w;
}
function noteUse(state, entry, ps) {
  const u = (usage(state)[entry.id] ||= { eps: [], pairs: [] });
  if (u.eps[u.eps.length - 1] !== state.ep) u.eps.push(state.ep);
  const k = pairKey(ps);
  if (!u.pairs.includes(k)) u.pairs.push(k);
}

/** The words have their own dice: a line can never change what happened. */
function scriptRng(state) {
  if (state._scriptRngEp !== state.ep) {
    state._scriptRng = streamFor(state.seed ?? 1, `script:${state.ep}`);
    state._scriptRngEp = state.ep;
  }
  return state._scriptRng;
}

export function pickScript(state, pool, ps, facts) {
  const fits = pool.filter(e => matches(e.when, facts));
  const cands = fits.length ? fits : pool.filter(e => !e.when);
  if (!cands.length) return null;
  const rng = scriptRng(state);
  let ws = cands.map(e => weightFor(state, e, ps, facts));
  // Every entry already spent on this pair: allow a repeat rather than silence.
  if (!ws.some(w => w > 0)) ws = cands.map(() => 1);
  let r = rng() * ws.reduce((s, w) => s + w, 0);
  for (let i = 0; i < cands.length; i++) { r -= ws[i]; if (r <= 0) return cands[i]; }
  return cands[cands.length - 1];
}

// ── rendering ────────────────────────────────────────────────────────
const hostName = () => SHOWS['perfect-match'].words.host;
export const narratorName = () => SHOWS['perfect-match'].words.narratorName;
const pro = name => pronounsOf(players.find(p => p.name === name)?.gender || 'nb');

export function fill(text, ps) {
  const names = { a: ps[0], b: ps[1], c: ps[2] };
  return text.replace(/\{([abc])(?:\.(sub|obj|pos|posAdj|ref|Sub|Obj|PosAdj))?\}/g, (m, who, form) => {
    const n = names[who];
    if (!n) return m;
    return form ? pro(n)[form] : n;
  });
}

const speakerName = (who, ps) => who === 'dior' ? hostName() : who === 'narrator' ? narratorName()
  : ps[{ a: 0, b: 1, c: 2 }[who]];

// ── replies that depend on who is replying ───────────────────────────
// A turn may be a VARIANT BLOCK instead of [speaker, text]:
//   { by: 'b', vary: [ { when?, turns: [[speaker, text], …], beat? }, … ] }
// The block's `when` is tested from the REPLYING speaker's own point of
// view — `persona` is b's persona, `taken` is b's partner — so the opener
// stays and the answer is the character's. One option has no `when`; it is
// the plain reply, and it has to be good, because it is the one seen most.
const ORDER = { a: 0, b: 1, c: 2 };
function asSpeaker(ps, by) {
  const i = ORDER[by] ?? 0;
  return [ps[i], ...ps.filter((_, j) => j !== i)];
}
function pickVariant(state, block, ps) {
  const opts = block.vary;
  if (!state) return opts.find(o => !o.when) || opts[0];
  const facts = factsFor(state, { players: asSpeaker(ps, block.by), extra: {} });
  const fits = opts.filter(o => o.when && matches(o.when, facts));
  if (!fits.length) return opts.find(o => !o.when) || opts[0];
  const best = Math.max(...fits.map(o => Object.keys(o.when).length));
  const top = fits.filter(o => Object.keys(o.when).length === best);
  return top[Math.floor(scriptRng(state)() * top.length)];
}

export function renderScript(entry, ps, state = null) {
  const lines = [];
  let beat = entry.beat || null;
  const picked = [];
  for (const turn of entry.turns || []) {
    if (Array.isArray(turn)) { lines.push(turn); continue; }
    const v = pickVariant(state, turn, ps);
    picked.push(turn.vary.indexOf(v));
    lines.push(...v.turns);
    if (v.beat) beat = v.beat;
  }
  return {
    id: picked.length ? `${entry.id}:${picked.join('.')}` : entry.id,
    stage: entry.stage ? fill(entry.stage, ps) : null,
    lines: lines.map(([who, text]) => ({ who: speakerName(who, ps), text: fill(text, ps) })),
    beat: beat ? fill(beat, ps) : null,
  };
}

/** A pool that has not been written yet still says who was there and what kind of moment it was. */
const placeholder = kind => ({ id: `${kind}.0`, stage: `{a} — ${kind}.` });

/** The scene for one event. */
export function scriptFor(state, ev) {
  const pool = POOLS[ev.kind];
  const entry = pool?.length ? pickScript(state, pool, ev.players, factsFor(state, ev)) : null;
  const e = entry || placeholder(ev.kind);
  noteUse(state, e, ev.players);
  return renderScript(e, ev.players, state);
}

/** The beach-hut cutaway: one speaker, straight to camera. */
export function hutFor(state, ev, who, stance) {
  const others = ev.players.filter(n => n !== who);
  const ps = [who, ...others];
  const facts = { ...factsFor(state, { ...ev, players: ps }), stance, family: familyOf(ev.kind) };
  const entry = pickScript(state, HUT[stance], [who], facts);
  noteUse(state, entry, [who]);
  return renderScript(entry, ps, state);
}

const FAMILIES = {
  flirting: ['pull', 'kiss', 'challenge-kiss', 'head-turned', 'date', 'steal', 'entrance', 'hideaway'],
  couple: ['chat', 'deep-chat', 'challenge-win', 'reassurance', 'love-said', 'love-hanging', 'close-off',
    'keeping-open', 'open-back-up', 'exclusive-ask', 'official-ask', 'ask-declined', 'declaration'],
  jealousy: ['jealous-confront', 'jealous-sulk', 'jealous-retaliate', 'argument', 'double-standard', 'torch',
    'overthinking', 'ick'],
  friendship: ['friendship', 'comedy', 'advice', 'solidarity', 'movie-night', 'snog-marry-pie', 'heart-rate',
    'notes', 'families'],
  gossip: ['gossip', 'confession', 'loyalty'],
  dumping: ['recouple-pick', 'dump-buildup', 'dump-verdict', 'ballot-reveal', 'dump-reaction',
    'dump-goodbye', 'dump-fallout', 'walk', 'final-result', 'envelope', 'reveal'],
  casa: ['casa-return', 'photos'],
};
export function familyOf(kind) {
  for (const [f, kinds] of Object.entries(FAMILIES)) if (kinds.includes(kind)) return f;
  return null;
}

/** Flatten a scene to plain text — for the text backlog, the audit and any reader that wants one string. */
export function scriptText(s) {
  if (!s) return '';
  return [s.stage, ...s.lines.map(l => `${l.who}: "${l.text}"`), s.beat].filter(Boolean).join('\n');
}
