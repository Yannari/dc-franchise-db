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
import { LADDER } from './lines/ladder.js';
import { FEELINGS } from './lines/feelings.js';
import { MOMENTS as MOMENT_LINES } from './lines/moments.js';
import { CHALLENGE_LINES } from './lines/challenges.js';
import { HUT } from './lines/hut.js';
import { NARRATOR } from './lines/narrator.js';
import { DIALECTS, slotWord, US_SPELLING, US_SPELLERS, ESL_EXPANSIONS } from './lines/dialect.js';

export const POOLS = { ...DAY, ...LADDER, ...FEELINGS, ...MOMENT_LINES, ...CHALLENGE_LINES };
export { HUT, NARRATOR };

export const SPEAKERS = ['a', 'b', 'c', 'dior', 'narrator'];
export const FACT_KEYS = ['rung', 'thinks', 'persona', 'intent', 'attachment', 'mood', 'bombshell',
  'early', 'coupled', 'gap', 'knows', 'faking', 'bPersona', 'bMood', 'bRung', 'stance', 'family',
  'choice', 'cause', 'channel', 'grudge', 'stole', 'bTaken', 'archetype', 'taken', 'loyal', 'late', 'gender', 'bGender', 'myRung', 'phase', 'kind', 'role', 'withB', 'newArrival', 'dialect',
  'comfortedYesterday', 'rowedBefore', 'rowedToday', 'feels', 'of', 'knowsB', 'verdict', 'noticed',
  'reason', 'split', 'guessed', 'stoleFrom', 'full', 'hasQuote', 'rank', 'cast', 'justMet', 'rebuffed', 'heard', 'kissed'];

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
  // The host alone (her opening, her explanations): nobody's facts to read.
  if (!ev.players.length) return { phase: ev.phase || null, of: ev.extra?.of ?? null, cast: 0 };
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
  f.phase = ev.phase || null;
  f.dialect = dialectOf(state, a);
  // What really happened between these two, from the record — the only way a
  // line may mention an earlier moment (user: "fix what? … is this even true?").
  Object.assign(f, b ? historyFacts(state, a, b) : { comfortedYesterday: false, rowedBefore: false });
  // They argued earlier today — this scene is the making up, not a fresh start.
  // (An argument scene itself is excluded: it IS the row.)
  f.rowedToday = !!b && (state._today || []).some(e => e.ep === state.ep && e !== ev && e.kind === 'argument'
    && e.players.includes(a) && e.players.includes(b));
  // Somebody walked in today (a bombshell, Casa's arrivals) — not day one.
  f.newArrival = state.ep > 1 && (state.villa || []).some(n => state.ledger?.firstEp?.[n] === state.ep);          // morning, day, event (the challenge), evening, firepit…
  // How much a feels for b, in words a line can lean on (narration only):
  // "not yet" is somebody who cares; a real no is somebody who doesn't.
  if (b) { const r = romance(a, b); f.feels = r >= 6 ? 'strong' : r >= 3 ? 'some' : 'little'; } else f.feels = null;
  for (const k of ['choice', 'cause', 'channel', 'grudge', 'of', 'noticed', 'reason', 'guessed']) if (ev.extra?.[k] != null) f[k] = ev.extra[k];
  // A steal at the recoupling: {c} is the one who loses {b}.
  f.stoleFrom = !!ev.extra?.stole;
  // Night one's ranking: the pair at the top, or anybody below it.
  f.rank = ev.extra?.rank == null ? null : ev.extra.rank === 1 ? 'top' : 'lower';
  f.split = !!state.split;             // Casa Amor is on
  // One of them walked in THIS episode: night one for everybody, a bombshell's
  // first day. They have known each other for hours.
  const arrivedNow = n => n != null && (state.ledger?.firstEp?.[n] ?? state.ep) === state.ep;
  f.justMet = arrivedNow(a) || (!!b && arrivedNow(b));
  f.rebuffed = !!ev.extra?.rebuffed;   // a pull b turned down (events.js decides)
  f.kissed = !!ev.extra?.kissed;       // a pull (or a Casa bed) that went further
  // Gossip carrying a debrief: the teller heard it said (pm/debrief.js), never saw it.
  f.heard = !!(ev.extra?.secret && state.secrets?.find(s => s.id === ev.extra.secret)?.said);
  f.cast = ev.players.filter(Boolean).length;   // how many are in it, when one is optional
  f.withB = !!b;                       // somebody else is in the scene
  f.hasQuote = !!clipSlots(state, ev).quote;   // the replayed clip has a line to quote
  // Snog Marry Pie with all three answers ({b} snog, {c} marry, {d} pie).
  f.full = ev.kind === 'snog-marry-pie' && !!(ev.extra?.snog && ev.extra?.marry && ev.extra?.pie);
  // Has a SEEN what b did, or only feels it? "I saw you" needs the first.
  f.knowsB = !!b && knowsAbout(state, a, b);
  // A friend's read on somebody's partner, in words (advice scenes).
  if (typeof ev.extra?.verdict === 'number') f.verdict = ev.extra.verdict > 0.2 ? 'good' : ev.extra.verdict < 0 ? 'bad' : 'unsure';   // ~35 / 25 / 40, measured
  return f;
}

const LOW = ['heartbroken', 'stressed', 'lonely', 'jealous'];
const COMFORT = ['friendship', 'advice', 'solidarity', 'chat', 'deep-chat'];
function historyFacts(state, a, b) {
  // The record holds finished episodes (season.js pushes a day when it ends),
  // so "yesterday" is the last episode: one villa day is one episode.
  const out = { comfortedYesterday: false, rowedBefore: false };
  const h = state.history || [];
  for (let i = h.length - 1; i >= 0 && h[i].ep >= state.ep - 1; i--) {
    const e = h[i];
    if (e.ep !== state.ep - 1 || !e.players.includes(a) || !e.players.includes(b)) continue;
    // b was there for a while a was low: a real scene, yesterday.
    if (COMFORT.includes(e.kind) && LOW.includes(e.moods?.[a])) out.comfortedYesterday = true;
  }
  for (const e of h) if (e.kind === 'argument' && e.ep < state.ep && e.players.includes(a) && e.players.includes(b)) { out.rowedBefore = true; break; }
  return out;
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
  (u.pairEp ||= {})[k] = state.ep;
}
// A spent leading pool may lend a line again, only never to the same pair
// twice in one episode (what the viewer would hear as a loop).
function relaxedWeight(state, entry, ps) {
  const u = usage(state)[entry.id];
  return u?.pairEp?.[pairKey(ps)] === state.ep ? 0 : 1;
}

/** The words have their own dice: a line can never change what happened. */
function scriptRng(state) {
  if (state._scriptRngEp !== state.ep) {
    state._scriptRng = streamFor(state.seed ?? 1, `script:${state.ep}${state.epSalt || ''}`);
    state._scriptRngEp = state.ep;
  }
  return state._scriptRng;
}

// Facts that, when true, must lead: a couple who rowed this morning gets a
// making-up scene, never a fresh cosy one that ignores the row.
// `justMet` leads too: two islanders who met today talk like it (pm/lines/day/just-met.js).
// `rebuffed` leads first: a pull b turned down is a no, whatever else is true.
// `heard`: gossip about something SAID in a debrief, not something seen.
const LEADING = ['rebuffed', 'heard', 'kissed', 'rowedToday', 'justMet'];

export function pickScript(state, pool, ps, facts, { allowRepeat = true } = {}) {
  // Candidates at each width, narrowest first: the leading pool, then every
  // entry that fits. A spent leading pool widens before it repeats: a couple
  // who rowed and made up five times in one evening heard the same
  // "I hate fighting with you" five times (season 7, night one) because the
  // making-up pool ran dry and the repeat rule fired inside it.
  const widths = [];
  for (const k of LEADING) {
    if (!facts[k]) continue;
    const led = pool.filter(e => e.when?.[k] && matches(e.when, facts));
    if (led.length) { widths.push(led); break; }
  }
  const fits = pool.filter(e => matches(e.when, facts));
  widths.push(fits.length ? fits : pool.filter(e => !e.when));
  if (!widths[widths.length - 1].length && !widths[0].length) return null;
  const rng = scriptRng(state);
  let cands = null, ws = null;
  for (const [i, w] of widths.entries()) {
    if (!w.length) continue;
    let weights = w.map(e => weightFor(state, e, ps, facts));
    // The leading pool is the scene's truth (a row is followed by making up):
    // spent, it lends a line again before a wider pool forgets the row.
    if (!weights.some(x => x > 0) && i === 0 && widths.length > 1) weights = w.map(e => relaxedWeight(state, e, ps));
    if (weights.some(x => x > 0)) { cands = w; ws = weights; break; }
  }
  // Every entry already spent on this pair: allow a repeat rather than silence.
  if (!cands) {
    if (!allowRepeat) return null;
    cands = widths.find(w => w.length);
    ws = cands.map(() => 1);
  }
  let r = rng() * ws.reduce((s, w) => s + w, 0);
  for (let i = 0; i < cands.length; i++) { r -= ws[i]; if (r <= 0) return cands[i]; }
  return cands[cands.length - 1];
}

// ── rendering ────────────────────────────────────────────────────────
const hostName = () => SHOWS['perfect-match'].words.host;
export const narratorName = () => SHOWS['perfect-match'].words.narratorName;
const pro = name => pronounsOf(players.find(p => p.name === name)?.gender || 'nb');

// {pa} and {pb} are a's and b's own partners — for friends talking about
// their couples. A pool may only use one behind `taken` / `bTaken`, so the
// partner is always there to name (tests/pm-lines.test.js).
export function fill(text, ps, partners = {}) {
  const names = { a: ps[0], b: ps[1], c: ps[2], d: ps[3], pa: partners.pa, pb: partners.pb };
  // {quote}: the first thing said in the clip being replayed (Movie Night, the reunion).
  if (partners.day != null) text = text.replace(/\{day\}/g, String(partners.day));
  // Night one's two sides, from the scene: who stands in the line (`side`)
  // and who walks in to it. The pools never say "the girls" outright, so the
  // season can bring either side in first (Villa options).
  if (partners.where) {
    const W = { terrace: ['up on the terrace', 'Up on the terrace'], 'dressing-room': ['in the dressing room', 'In the dressing room'] }[partners.where] || ['on the daybeds', 'On the daybeds'];
    text = text.replace(/\{where\}/g, W[0]).replace(/\{Where\}/g, W[1]);
  }
  if (partners.side) {
    const [sides, one, walkers, walkerOne] = partners.side === 'm' ? ['boys', 'boy', 'girls', 'girl'] : ['girls', 'girl', 'boys', 'boy'];
    const cap = w => w[0].toUpperCase() + w.slice(1);
    text = text.replace(/\{side\}/g, sides).replace(/\{Side\}/g, cap(sides)).replace(/\{sideOne\}/g, one)
      .replace(/\{walkers\}/g, walkers).replace(/\{Walkers\}/g, cap(walkers)).replace(/\{walkerOne\}/g, walkerOne);
  }
  if (partners.quote != null) text = text.replace(/\{quote\}/g, partners.quote).replace(/\{quoteWho\}/g, partners.quoteWho);
  return text.replace(/\{(pa|pb|a|b|c|d)(?:\.(sub|obj|pos|posAdj|ref|Sub|Obj|PosAdj|gf))?\}/g, (m, who, form) => {
    const n = names[who];
    if (!n) return m;
    // {b.gf}: what you ask {b} to be — from the roster, never guessed.
    if (form === 'gf') return { f: 'girlfriend', m: 'boyfriend' }[players.find(p => p.name === n)?.gender] || 'partner';
    return form ? pro(n)[form] : n;
  });
}

/** Where a speaker is from: their cast setup, else the season's default. */
export function dialectOf(state, name) {
  return state?.profiles?.[name]?.dialect || state?.dialect || 'uk';
}
// The host and the voiceover have their own voices (the registry says whose).
const HOST_DIALECT = () => SHOWS['perfect-match'].words.hostDialect || 'us';
const NARRATOR_DIALECT = () => SHOWS['perfect-match'].words.narratorDialect || 'uk';

/** Fill `{~slot}` for this speaker's dialect, then spelling and second-language shaping. */
const hashOf = s => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
export function speak(text, dialect) {
  const info = DIALECTS[dialect] || DIALECTS.uk;
  let out = text.replace(/\{~([A-Za-z-]+)\}/g, (m, key) => {
    const word = slotWord(key.toLowerCase(), dialect);
    if (word == null) return m;
    return key[0] === key[0].toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (US_SPELLERS.includes(dialect)) out = out.replace(/[A-Za-z]+/g, w => {
    const us = US_SPELLING[w.toLowerCase()];
    return us ? (w[0] === w[0].toUpperCase() ? us[0].toUpperCase() + us.slice(1) : us) : w;
  });
  if (info.esl) {
    // Decided by the line itself, so the same line always comes out the same.
    const h = hashOf(text);
    if (h % 10 < 5) out = out.replace(/\b(I'm|you're|it's|that's|don't|can't|I've|I'd|we're|isn't)\b/gi,
      w => { const x = ESL_EXPANSIONS[w] ?? ESL_EXPANSIONS[w[0].toLowerCase() + w.slice(1)];
        return x ? (w[0] === w[0].toUpperCase() ? x[0].toUpperCase() + x.slice(1) : x) : w; });
    const own = info.own || [];
    if (own.length && Math.floor(h / 10) % 7 === 0 && out.split(' ').length >= 4 && /^[A-Z]/.test(out)) {
      const rest = /^I\b/.test(out) ? out : out[0].toLowerCase() + out.slice(1);
      out = `${own[Math.floor(h / 70) % own.length]} ${rest}`;
    }
  }
  return out;
}

const speakerName = (who, ps) => who === 'dior' ? hostName() : who === 'narrator' ? narratorName()
  : ps[{ a: 0, b: 1, c: 2, d: 3 }[who]];

// ── replies that depend on who is replying ───────────────────────────
// A turn may be a VARIANT BLOCK instead of [speaker, text]:
//   { by: 'b', vary: [ { when?, turns: [[speaker, text], …], beat? }, … ] }
// The block's `when` is tested from the REPLYING speaker's own point of
// view — `persona` is b's persona, `taken` is b's partner — so the opener
// stays and the answer is the character's. One option has no `when`; it is
// the plain reply, and it has to be good, because it is the one seen most.
const ORDER = { a: 0, b: 1, c: 2, d: 3 };
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

export function renderScript(entry, ps, state = null, slots = {}) {
  const partners = { ...(state ? { pa: partnerOf(state, ps[0]), pb: ps[1] ? partnerOf(state, ps[1]) : null } : {}), ...slots };
  const f = text => fill(text, ps, partners);
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
    stage: entry.stage ? f(entry.stage) : null,
    lines: lines.map(([who, text]) => {
      const d = who === 'dior' ? HOST_DIALECT() : who === 'narrator' ? NARRATOR_DIALECT()
        : dialectOf(state, ps[ORDER[who]]);
      return { who: speakerName(who, ps), text: speak(f(text), d) };
    }),
    beat: beat ? f(beat) : null,
  };
}

/** A pool that has not been written yet still says who was there and what kind of moment it was. */
const placeholder = kind => ({ id: `${kind}.0`, stage: `{a} — ${kind}.` });

/** The scene for one event. */
export function scriptFor(state, ev) {
  if (Array.isArray(ev.extra?.parts)) return partsScript(state, ev);
  const pool = POOLS[ev.kind];
  const ps = castOf(ev);
  const entry = pool?.length ? pickScript(state, pool, ps, factsFor(state, { ...ev, players: ps })) : null;
  const e = entry || placeholder(ev.kind);
  noteUse(state, e, ps);
  return renderScript(e, ps, state, clipSlots(state, ev));
}

/**
 * A scene built from several pools, one line each (an islander's
 * introduction): every part is picked from its own pool on the facts plus
 * the part's own value as `of`, and the turns run in order under the first
 * part's staging.
 */
function partsScript(state, ev) {
  const ps = ev.players;
  const facts = factsFor(state, { ...ev, players: ps });
  const picked = [];
  for (const [key, of] of ev.extra.parts) {
    const pool = POOLS[key];
    if (!pool?.length) continue;
    const e = pickScript(state, pool, ps, { ...facts, of });
    if (e) { noteUse(state, e, ps); picked.push(e); }
  }
  if (!picked.length) return renderScript(placeholder(ev.kind), ps, state);
  const merged = { id: picked.map(e => e.id).join('+'), stage: picked[0].stage,
    turns: picked.flatMap(e => e.turns || []), beat: picked[picked.length - 1].beat };
  return renderScript(merged, ps, state);
}

/** Who {a}..{d} are. Snog Marry Pie keeps its answers in place even when one is missing. */
function castOf(ev) {
  if (ev.kind === 'snog-marry-pie') return [ev.players[0], ev.extra?.snog, ev.extra?.marry, ev.extra?.pie];
  return ev.players;
}

/** A replayed clip is quoted, so the villa reacts to what is actually on the screen. */
function clipSlots(state, ev) {
  if (ev.extra?.side) return { side: ev.extra.side };
  // A debrief's room: the boys' terrace or the girls' dressing room.
  if (ev.extra?.where) return { where: ev.extra.where };
  // Look Who's Talking reads out a beach-hut line: the quote travels with the scene.
  if (ev.extra?.quote) return { quote: ev.extra.quote, quoteWho: ev.extra.quoteWho };
  const id = ev.extra?.clip || ev.extra?.revealed;
  if (!id) return {};
  const clip = (state.history || []).find(e => e.id === id);
  const line = clip?.script?.lines?.[0];
  return line ? { quote: line.text, quoteWho: line.who } : {};
}

// ── the voiceover ────────────────────────────────────────────────────
// About six times an episode, after a scene that aired: he knows what the
// public saw and nothing more. Words only — his own dice, no effect on play.
export const NARRATOR_PER_EPISODE = 6;
const NARRATOR_CHANCE = 0.09;    // spread over the whole day, not spent by breakfast (measured)
export function narratorFor(state, ev) {
  if (!ev.aired) return null;
  const pool = NARRATOR[ev.kind];
  if (!pool?.length) return null;
  const said = ((state._narrated ||= {})[state.ep] ||= 0);
  if (said >= NARRATOR_PER_EPISODE) return null;
  if (scriptRng(state)() >= NARRATOR_CHANCE) return null;
  const ps = castOf(ev);
  // A voiceover line is heard at most twice a season, whoever it is about.
  const fresh = pool.filter(e => (usage(state)[e.id]?.eps.length || 0) < 2);
  const entry = pickScript(state, fresh, ps, factsFor(state, { ...ev, players: ps }), { allowRepeat: false });
  if (!entry) return null;
  noteUse(state, entry, ps);
  state._narrated[state.ep] = said + 1;
  return renderScript(entry, ps, state, { day: state.day || state.ep });
}

/** The beach-hut cutaway: one speaker, straight to camera. */
export function hutFor(state, ev, who, stance) {
  const others = ev.players.filter(n => n !== who);
  const ps = [who, ...others];
  // role: 0 started the scene, 1 was on the receiving end, 2 was talked about.
  const facts = { ...factsFor(state, { ...ev, players: ps }), stance, family: familyOf(ev.kind),
    kind: ev.kind, role: ev.players.indexOf(who), withB: others.length > 0 };
  // A cutaway is optional: better none than the same line twice in an episode.
  const entry = pickScript(state, HUT[stance], [who], facts, { allowRepeat: false });
  if (!entry) return null;
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
    'dump-goodbye', 'dump-fallout', 'steal'],
  finale: ['declaration', 'final-result', 'envelope', 'reveal', 'walk'],
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
