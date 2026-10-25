// ══════════════════════════════════════════════════════════════════════
// pm/threads.js — what the villa is living with, carried across episodes
// ══════════════════════════════════════════════════════════════════════
//
// The user, reading a played episode: "they're merging multiple random things
// with no setup, no real impact and no cause, no consequences, there's no
// storyline". A real episode (docs/superpowers/specs/2026-10-25-pm-episode-
// overhaul.md §1) is three or four storylines intercut, every scene caused by
// the one before, and the villa reacting to each.
//
// A THREAD is a question the villa is living with. It opens from the state
// (a bombshell fancies somebody's partner; a partner going off the other; a
// kiss somebody saw; a couple getting serious), plays a beat or two an
// episode, at the parts of the day those beats belong to, and closes when it
// is answered — saying how.
//
//   graft     c is after t, who is with p.
//     eyes      [c, f, t, p]  c tells a friend: "I'm going to pull t"
//     pull      [c, t]        the pull (events.js pullBetween: or t turns it down on the spot)
//     watching  [p, f, t, c]  p sees them go off together, with a friend beside them
//     where-head [p, t, c]    p and t talk: "what was that about?"
//     graft-shut [t, c]       t tells c to back off
//     graft-turn [t, p, c]    t tells p they want to get to know c
//   doubt     a is going off p.
//     vent      [a, f]        a confides in a friend (events.js vent: the friend now knows)
//     feels-off [p, f, a]     p asks a friend if a has said anything
//     where-head [p, a]       "where's your head at?"
//   secret    x did something p doesn't know about, and w saw it.
//     secret-burden [w, f, x, p]  w carries it: "do I tell her?"
//     gossip    [w, p, x]     the telling (events.js gossip), then having it out (haveItOut)
//   progress  a and b are getting serious.
//     kiss / deep-chat [a, b] a moment of theirs
//     group-chat [a, …]       the villa teases them
//
// THE VILLA REACTS (§3.2): after a beat that matters the one it happened to
// tells their friends (`group-chat`), and the friends take a side; and on a
// villa night the couples in the day's stories go over it in bed (`bed-chat`).
//
// The thread decides who and why; the kind decides what it does. Every beat
// has a consequence (CLAUDE.md), and only people in the same room are cast.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates, apart, today, pullBetween, haveItOut, callOutStirrer, tooSoonForWarm } from './events.js';
import { attr, nudgeAttraction, compatible } from './chemistry.js';
import { romance, friendship, schemeEligible, revealTruth } from './feelings.js';
import { stepOf, setStep, tellStep, closedness } from './ladder.js';
import { feel, jealousyHit, emo, attachment, breakHeart } from './emotions.js';
import { judgement } from './circle.js';
import { nextPicker } from './recoupling.js';
import { noteBreakup } from './exes.js';

const MAX = { graft: 3, doubt: 2, secret: 2, progress: 2, spark: 2 };
// How many threads an episode is about: the real episodes read had three or
// four big ones and a smaller one or two (measured 2026-10-25: at four the
// episode ran 260 clicks against the old 450, and the user wants substance).
export const HEADLINES = 5;
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const PLAYERS = new Set(['villain', 'mastermind', 'schemer']);
// What the public make of a story's moves (x SCENE_GAIN, like every pop).
// Measured 2026-10-25: with the stories carrying the drama and these near
// zero, the villain label fell from 80% of seasons by episode 12 to 12%.
const COST = { plot: -0.6, plotFresh: -0.25, lie: -1.6, dodge: -0.8, turn: -1.8, dump: -0.9 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const pop = (...rows) => Object.fromEntries(rows.filter(r => r && r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
const inVilla = (state, ...ns) => ns.every(n => n && state.villa.includes(n));
const together = (state, ...ns) => inVilla(state, ...ns) && ns.every(n => !apart(state, ns[0], n));
const gender = (state, n) => state.profiles[n]?.gender;
const wants = (state, a, b) => Math.max(romance(a, b), attr(state, a, b) ?? 0);
const fresh = (state, n) => state.ep > 1 && (state.ledger?.firstEp?.[n] ?? -1) >= state.ep - 1;

function weighted(rng, opts) {
  const live = opts.filter(o => o[1] > 0);
  let r = rng() * live.reduce((t, o) => t + o[1], 0);
  for (const o of live) if ((r -= o[1]) <= 0) return o[0];
  return live.length ? live[live.length - 1][0] : null;
}

/** The friends somebody talks to: their own side first, closest first, none of `not`. */
export function friendsOf(state, n, not = [], k = 3) {
  const no = new Set([n, ...not, partnerOf(state, n)].filter(Boolean));
  const room = roomMates(state, n).filter(o => !no.has(o));
  const mine = room.filter(o => gender(state, o) === gender(state, n));
  const pool = mine.length >= 2 ? mine : room;
  return pool.sort((x, y) => getBond(n, y) - getBond(n, x)).slice(0, k);
}

// The other storyline systems have their own people (pm/rivalry.js, triangle.js):
// a thread does not start on top of them.
function busyElsewhere(state) {
  return new Set([
    ...(state.triangles || []).filter(t => !t.over).flatMap(t => [t.h, t.x, t.y]),
    ...(state.rivalries || []).filter(t => !t.over).flatMap(t => [t.h, t.x, t.y]),
    ...(state.crushes || []).filter(t => !t.over).flatMap(t => [t.a, t.b]),
  ]);
}
const live = state => (state.threads ||= []).filter(t => !t.over);
const inThread = (state, n, type = null) => live(state).some(t => (!type || t.type === type) && castOf(t).includes(n));
/** In one of the villa's stories right now. */
export const inStory = (state, n) => live(state).some(t => castOf(t).includes(n));
export const castOf = t => ({ graft: [t.c, t.t, t.p], doubt: [t.a, t.p], secret: [t.w, t.x, t.p], progress: [t.a, t.b], spark: [t.a, t.b] }[t.type] || []).filter(Boolean);

// ── opening and closing ───────────────────────────────────────────────
function close(t, why, state) { t.over = true; t.why = why; t.endEp = state.ep; }

function settle(state) {
  for (const t of live(state)) {
    if (!castOf(t).every(n => state.villa.includes(n))) { close(t, 'gone', state); continue; }
    if (t.type === 'graft') {
      // The recoupling answered it: t is with c now, or c has moved on.
      if (partnerOf(state, t.t) === t.c) { close(t, 'won', state); continue; }
      if (partnerOf(state, t.t) !== t.p) { close(t, 'apart', state); continue; }
      if ((attr(state, t.c, t.t) ?? 0) < 4.5 || t.shut) { close(t, t.shut ? 'shut' : 'moved-on', state); continue; }
      if (state.ep - t.ep >= 4) close(t, 'faded', state);
    } else if (t.type === 'doubt') {
      if (partnerOf(state, t.a) !== t.p) { close(t, 'apart', state); continue; }
      if (romance(t.a, t.p) >= 6 && t.beat >= 3) { close(t, 'mended', state); continue; }
      // Still cold after the talk, and the one {a} has been looking at looks
      // back: the doubt becomes somebody going after {a} (a graft, with all
      // its beats — the pull, the partner watching, the second talk).
      if (t.talked && t.x && together(state, t.a, t.x) && romance(t.a, t.p) < 5 && (attr(state, t.x, t.a) ?? 0) >= 3.5
        && !inThread(state, t.x, 'graft') && !inThread(state, t.a, 'graft') && !partnerOf(state, t.x)) {
        close(t, 'drifted', state);
        state.threads.push(make(state, 'graft', { c: t.x, t: t.a, p: t.p, from: t.id }, 0.9));
        continue;
      }
      if (state.ep - t.ep >= 4) close(t, 'faded', state);
    } else if (t.type === 'secret') {
      const sec = state.secrets.find(s => s.id === t.sec);
      if (!sec || sec.known || partnerOf(state, t.p) !== t.x) close(t, sec?.known ? 'out' : 'apart', state);
    } else if (t.type === 'spark') {
      // Coupled up at last, or one of them with somebody else, or it fizzled.
      if (partnerOf(state, t.a) === t.b) { close(t, 'coupled', state); continue; }
      if (partnerOf(state, t.a) || partnerOf(state, t.b)) { close(t, 'apart', state); continue; }
      if (Math.min(attr(state, t.a, t.b) ?? 0, attr(state, t.b, t.a) ?? 0) < 3 || state.ep - t.ep >= 4) close(t, 'fizzled', state);
    } else if (t.type === 'progress') {
      if (partnerOf(state, t.a) !== t.b) { close(t, 'apart', state); continue; }
      if (stepOf(state, t.a, t.b) === 'official' && stepOf(state, t.b, t.a) === 'official') close(t, 'official', state);
      else if (state.ep - t.ep >= 5) close(t, 'settled', state);
    }
  }
}

// How hard the openers look: 0 normally, 1 on a day the villa has too few
// stories going (beginThreads). A villa day with one story live aired 70 lines.
const slack = state => state._threadSlack || 0;

const make = (state, type, fields, heat) => ({ id: `th${state.ep}-${state.threadSeq = (state.threadSeq || 0) + 1}`, type, ep: state.ep, last: null, beat: 0, over: false, heat, ...fields });

function openGrafts(state, rng) {
  if (live(state).filter(t => t.type === 'graft').length >= MAX.graft) return;
  const busy = busyElsewhere(state);
  const cands = [];
  for (const [x, y] of state.couples) {
    for (const [t, p] of [[x, y], [y, x]]) {
      // Casa Amor is the season's biggest drama (user): with the partner in
      // the other villa, a new arrival goes for whoever they like — and the
      // only one who can't watch it happen is the partner.
      const casa = !!state.split && inVilla(state, t, p) && apart(state, t, p);
      if ((!together(state, t, p) && !casa) || busy.has(t) || inThread(state, t, 'graft')) continue;
      for (const c of roomMates(state, t)) {
        if (c === p || busy.has(c) || inThread(state, c, 'graft') || !compatible(state, c, t)) continue;
        const want = attr(state, c, t) ?? 0;
        // Attraction runs 0-10 with a median of about 3 (events.js pull heat):
        // a new arrival goes for their best option, the rest only when it's strong.
        const fresh = (state.ledger?.firstEp?.[c] ?? -1) >= state.ep - 1 && state.ep > 1;
        if (want < (fresh || casa ? 3 : 4.3) - 0.8 * slack(state)) continue;
        // A coupled chaser only goes looking when their own couple is weaker
        // than this, and never closed off (events.js closedHold, the same rule).
        // A schemer's own couple holds them back less (memory: the Villain label
        // barely tracked archetype; the fix is behaviour, schemers mug off more).
        const cp = partnerOf(state, c);
        const player = PLAYERS.has(state.profiles[c]?.archetype);
        if (cp && (romance(c, cp) >= want - (player ? 3 : 0.5) || ['closed-off', 'exclusive', 'official'].includes(stepOf(state, c, cp)))) continue;
        // …and not twice on the same three once it ended.
        if ((state.threadDone || {})[`graft:${c}>${t}`] != null && state.ep - state.threadDone[`graft:${c}>${t}`] < 4) continue;
        const heat = (want / 10) * (0.5 + st(state, c, 'boldness')) * (fresh ? 1.6 : 1) * (0.6 + (attr(state, t, c) ?? 0) / 15)
          * (player ? 1.6 : NICE.has(state.profiles[c]?.archetype) ? 0.6 : 1);
        cands.push({ c, t, p, heat });
      }
    }
  }
  // As many as there is room for, the hottest first, each on its own chance;
  // never two on the same chaser or the same target.
  const taken = new Set();
  for (const x of cands.sort((a, b) => b.heat - a.heat)) {
    if (live(state).filter(t => t.type === 'graft').length >= MAX.graft) break;
    if (taken.has(x.c) || taken.has(x.t) || rng() >= Math.min(0.9, 0.35 + x.heat)) continue;
    taken.add(x.c); taken.add(x.t);
    state.threads.push(make(state, 'graft', { c: x.c, t: x.t, p: x.p }, x.heat));
  }
}

// Why a is going off p, from what really happened: the ick, a crush on
// somebody else, or simply feeling less than p does.
function doubtWhy(state, a, p) {
  const ick = (state.history || []).some(e => e.kind === 'ick' && e.players[0] === a && e.players[1] === p && e.ep >= state.ep - 2);
  if (ick) return { why: 'ick' };
  const eyes = roomMates(state, a).filter(o => o !== p && (attr(state, a, o) ?? 0) > (attr(state, a, p) ?? 0) + 1.5)
    .sort((x, y) => (attr(state, a, y) ?? 0) - (attr(state, a, x) ?? 0))[0];
  if (eyes) return { why: 'eyes', x: eyes };
  if (romance(p, a) - romance(a, p) >= 2) return { why: 'behind' };
  return { why: 'cooling' };
}
function openDoubts(state, rng) {
  if (live(state).filter(t => t.type === 'doubt').length >= MAX.doubt || state.ep < 2) return;
  const busy = busyElsewhere(state);
  const cands = [];
  for (const [x, y] of state.couples) {
    for (const [a, p] of [[x, y], [y, x]]) {
      if (!together(state, a, p) || busy.has(a) || inThread(state, a) || inThread(state, p, 'doubt')) continue;
      // Coupled a day at least: night one has no "going off" anybody.
      if ((state.coupledSince?.[[a, p].sort().join('|')] ?? state.day) >= (state.day ?? 0)) continue;
      const r = romance(a, p);
      const w = doubtWhy(state, a, p);
      const cold = (5.5 - r) / 5.5 + (w.why === 'ick' ? 0.5 : w.why === 'eyes' ? 0.4 : 0);
      if (cold <= 0.15 - 0.12 * slack(state)) continue;
      if ((state.threadDone || {})[`doubt:${a}>${p}`] != null && state.ep - state.threadDone[`doubt:${a}>${p}`] < 4) continue;
      cands.push({ a, p, ...w, heat: cold * (0.6 + romance(p, a) / 10) });
    }
  }
  openSome(state, rng, 'doubt', cands, c => [c.a, c.p], c => Math.min(0.85, 0.4 + c.heat * 0.6),
    c => ({ a: c.a, p: c.p, why: c.why, x: c.x || null }));
}

/**
 * Open as many of `cands` as there is room for, hottest first, each on its
 * own chance, never two stories of one type on the same person. (One a type
 * an episode left villa days with two stories live, both finished.)
 */
function openSome(state, rng, type, cands, people, chance, fields) {
  const taken = new Set(live(state).filter(t => t.type === type).flatMap(castOf));
  for (const c of cands.sort((m, n) => n.heat - m.heat)) {
    if (live(state).filter(t => t.type === type).length >= MAX[type]) break;
    const ps = people(c);
    if (ps.some(n => taken.has(n)) || rng() >= chance(c)) continue;
    for (const n of ps) taken.add(n);
    state.threads.push(make(state, type, fields(c), c.heat));
  }
}

function openSecrets(state, rng) {
  if (live(state).filter(t => t.type === 'secret').length >= MAX.secret) return;
  const cands = [];
  for (const sec of state.secrets.filter(s => !s.known && s.with && !s.casa)) {
    if (!inVilla(state, sec.who, sec.partner) || partnerOf(state, sec.partner) !== sec.who) continue;
    if (live(state).some(t => t.type === 'secret' && t.sec === sec.id)) continue;
    const w = sec.witnesses.filter(n => inVilla(state, n) && together(state, n, sec.partner))
      .sort((m, n) => (getBond(n, sec.partner) - getBond(n, sec.who)) - (getBond(m, sec.partner) - getBond(m, sec.who)))[0];
    if (!w) continue;
    const heat = Math.min(1.5, sec.severity) * (0.6 + Math.max(0, getBond(w, sec.partner)) / 10);
    cands.push({ sec: sec.id, w, x: sec.who, p: sec.partner, heat });
  }
  openSome(state, rng, 'secret', cands, c => [c.x, c.p], c => Math.min(0.8, 0.3 + c.heat * 0.5), c => ({ sec: c.sec, w: c.w, x: c.x, p: c.p }));
}

function openProgress(state, rng) {
  if (live(state).filter(t => t.type === 'progress').length >= MAX.progress) return;
  const cands = [];
  for (const [a, b] of state.couples) {
    if (!together(state, a, b) || inThread(state, a) || inThread(state, b)) continue;
    if (stepOf(state, a, b) === 'official' && stepOf(state, b, a) === 'official') continue;
    const r = Math.min(romance(a, b), romance(b, a));
    if (r < 4 - slack(state)) continue;
    if ((state.threadDone || {})[`progress:${[a, b].sort().join('+')}`] != null) continue;
    cands.push({ a, b, heat: 0.4 + (r - 4) / 6 });
  }
  openSome(state, rng, 'progress', cands, c => [c.a, c.b], () => 0.6, c => ({ a: c.a, b: c.b }));
}

// Two singles who fancy each other: the villa's "will they couple up?"
function openSparks(state, rng) {
  if (live(state).filter(t => t.type === 'spark').length >= MAX.spark) return;
  const busy = busyElsewhere(state);
  const singles = state.villa.filter(n => !partnerOf(state, n) && !busy.has(n) && !inThread(state, n));
  const cands = [];
  for (const a of singles) for (const b of singles) {
    if (a >= b || !together(state, a, b) || !compatible(state, a, b)) continue;
    const m = Math.min(attr(state, a, b) ?? 0, attr(state, b, a) ?? 0);
    if (m < 3 - 0.5 * slack(state)) continue;
    if ((state.threadDone || {})[`spark:${a}+${b}`] != null) continue;
    cands.push({ a, b, heat: 0.35 + m / 12 });
  }
  openSome(state, rng, 'spark', cands, c => [c.a, c.b], () => 0.7, c => ({ a: c.a, b: c.b }));
}

/**
 * The start of an episode: close what was answered, open what the villa is
 * now living with, and pick what this episode is about.
 */
export function beginThreads(state, rng, entry) {
  state.threads ||= [];
  // What last night left unsaid is the morning's talk: the reactions still
  // queued from the evening (an ask, a row after dinner) open the day.
  const carry = state._th?.ep === state.ep - 1 ? (state._th.queue || []).map(q => ({ ...q, from: 'night' })) : [];
  settle(state);
  for (const t of state.threads.filter(x => x.over && x.endEp === state.ep)) {
    const key = t.type === 'graft' ? `graft:${t.c}>${t.t}` : t.type === 'doubt' ? `doubt:${t.a}>${t.p}`
      : t.type === 'progress' ? `progress:${[t.a, t.b].sort().join('+')}` : t.type === 'spark' ? `spark:${[t.a, t.b].sort().join('+')}` : `secret:${t.sec}`;
    (state.threadDone ||= {})[key] = state.ep;
  }
  // The final has no villa day, and the reunion none at all.
  if (['final', 'reunion'].includes(entry?.moment)) { state._th = { ep: state.ep, headline: [], used: {}, queue: [] }; return; }
  const alive = q => inVilla(state, q.center) && (!q.x || inVilla(state, q.x));
  openGrafts(state, rng); openSecrets(state, rng); openDoubts(state, rng); openProgress(state, rng); openSparks(state, rng);
  // Too few stories with somewhere to go: look again, less fussily.
  const going = () => live(state).filter(t => !(t.type === 'doubt' && t.ended)).length;
  if (going() < 3) {
    state._threadSlack = 1;
    openGrafts(state, rng); openDoubts(state, rng); openProgress(state, rng); openSparks(state, rng);
    state._threadSlack = 0;
  }
  // A second graft on a bombshell night: the new arrival is the episode.
  if (entry?.moment === 'bombshell') openGrafts(state, rng);
  const ranked = live(state).map(t => [t, t.heat + (t.last === state.ep - 1 ? 0.5 : 0) + (t.type === 'progress' ? 0.2 : 0)])
    .sort((x, y) => y[1] - x[1]).map(([t]) => t);
  const headline = ranked.slice(0, HEADLINES);
  // At least one happy one, when there is one (the real episodes always had one).
  const happy = ranked.find(t => t.type === 'progress' || t.type === 'spark');
  if (happy && !headline.includes(happy)) headline[headline.length - 1] = happy;
  state._th = { ep: state.ep, headline: headline.map(t => t.id), used: {}, queue: carry.filter(alive), top: headline[0]?.id || null };
  // A probe's window into the choice (tests only; never set in a season the user plays).
  if (globalThis.__PM_THREAD_LOG) globalThis.__PM_THREAD_LOG.push({ ep: state.ep, moment: entry?.moment,
    live: live(state).map(t => `${t.type}:${castOf(t).join('/')} b${t.beat}${headline.includes(t) ? '*' : ''} ${['told', 'seen', 'talked', 'vented', 'noticed', 'carried', 'chatted', 'shutDue', 'moment'].filter(k => t[k] != null && t[k] !== false).join(',')}`) });
}

// ── the beats ─────────────────────────────────────────────────────────
const scene = (state, rng, phase, kind, players, extra = {}, { aired = true, major = [] } = {}) =>
  makeEvent(state, rng, { phase, kind, players, aired, major, extra: { pop: {}, ...extra } });

function graftBeat(state, rng, t, phase) {
  const { c, t: tt, p } = t;
  if (!together(state, c, tt)) return [];
  const out = [];
  const tag = beat => ({ thread: { id: t.id, type: 'graft', beat, since: t.ep, who: castOf(t).slice(0, 2) } });
  // 1. c tells a friend what they're planning.
  if (!t.told && (phase === 'morning' || phase === 'day')) {
    const f = friendsOf(state, c, [tt, p], 1)[0];
    if (f) {
      t.told = true;
      addBond(c, f, 0.3);
      // A friend closer to p than to c may carry it to p (a later scene's cause).
      if (getBond(f, p) > getBond(f, c) + 1) t.warner = f;
      const push = st(state, f, 'boldness') > 0.5 && getBond(f, p) < 2;
      // Whether t has given c anything back yet: how a's hopes are pitched.
      const theirs = (attr(state, tt, c) ?? 0) >= 3.5 ? 'yes' : 'no';
      out.push(scene(state, rng, phase, 'graft-eyes', [c, f, tt, p], { ...tag('eyes'), of: push ? 'go-for-it' : 'careful', theirs, pop: pop([c, fresh(state, c) ? COST.plotFresh : COST.plot, 1.2]) }));
      return out;
    }
  }
  // 2. The pull. Once a part of the day, and never in the morning.
  if (phase === 'day' || phase === 'evening') {
    if (today(state).some(e => (e.kind === 'pull' || e.kind === 'loyalty') && e.players.includes(c) && e.players.includes(tt))) return out;
    const got = pullBetween(state, rng, c, tt);
    const ev = makeEvent(state, rng, { phase, kind: got.kind, players: got.players, aired: true, extra: { ...tag('pull') } });
    out.push(ev);
    t.pulls = (t.pulls || 0) + 1;
    if (got.kind === 'loyalty' || ev.extra.rebuffed) {
      t.rebuffs = (t.rebuffs || 0) + 1;
      // Saying no out loud settles it a little, for the one who said it.
      if (got.kind === 'loyalty') nudgeAttraction(state, tt, c, -0.4);
      // Turned down twice, or by somebody closed off: c is told to back off.
      if (t.rebuffs >= 2 || ['closed-off', 'exclusive', 'official'].includes(stepOf(state, tt, p))) t.shutDue = true;
    }
    // 3. p sees them go off together (a pull is a walk across the villa, in
    // front of everyone), or a friend tells p about it.
    if (got.kind === 'pull' && together(state, p, tt) && !apart(state, p, tt)) {
      const sees = rng() < 0.7;
      const f = t.warner && together(state, t.warner, p) ? t.warner : friendsOf(state, p, [tt, c], 1)[0];
      if ((sees || t.warner) && f) {
        const raw = ev.extra.kissed ? 2.4 : ev.extra.heat === 'steamy' ? 2 : 1.4;
        jealousyHit(state, p, tt, c, raw, { confirmed: sees });
        feel(state, p, 'stress', 0.6);
        addBond(p, f, 0.3);
        t.seen = true;
        out.push(scene(state, rng, phase, 'watching', [p, f, tt, c],
          { ...tag('watching'), of: sees ? 'sees' : 'told', heat: ev.extra.heat || null, pop: pop([p, 0.4, 1.2], [f, 0.1, 0.5]) }));
      }
    }
    return out;
  }
  return out;
}

/**
 * "What was that about?" — p and t, after the pull. t's answer is t's own:
 * what t feels for each of them, and how honest t is built to be. A lie is
 * only for those who may scheme (CLAUDE.md); the rest say less than the truth.
 */
function whereHead(state, rng, phase, p, tt, c, threadTag) {
  if (!together(state, p, tt) || today(state).some(e => e.kind === 'where-head' && e.players.includes(p) && e.players.includes(tt))) return null;
  const toC = c ? (attr(state, tt, c) ?? 0) : 0, toP = romance(tt, p);
  const hid = state.secrets.filter(s => !s.known && s.who === tt && s.partner === p && (!c || s.with === c));
  const kissedC = hid.some(s => s.kind === 'kiss' || s.kind === 'promise');
  const honest = 0.2 + 0.6 * st(state, tt, 'loyalty') + 0.2 * (NICE.has(state.profiles[tt]?.archetype) ? 1 : 0);
  const of = weighted(rng, [
    ['reassure', toP >= toC ? 1.2 + (toP - toC) / 5 : 0.2],
    ['honest', toC > toP ? honest * (0.6 + (toC - toP) / 5) : 0.1 * honest],
    ['deflect', 0.3 + 0.3 * (1 - honest)],
    ['lie', kissedC && schemeEligible(state.profiles[tt]) ? 0.6 + 0.4 * (1 - st(state, tt, 'loyalty')) : 0],
  ]);
  const love = romance(p, tt) / 10;
  if (of === 'reassure') {
    feel(state, p, 'security', 1.5 * (toP / 10 + 0.3)); addBond(p, tt, 0.4);
    const e = emo(state, p); if (c) e.jealousy[c] = (e.jealousy[c] || 0) * 0.5;
    if (kissedC) feel(state, tt, 'guilt', 1.2);
  } else if (of === 'honest') {
    // Said out loud: t is keeping it open for c, and p knows where they stand.
    breakHeart(state, p, tt, 2.5 * love);
    addRelationshipDimension(p, tt, 'trust', 0.5);
    if (['closed-off', 'exclusive', 'official'].includes(stepOf(state, tt, p))) { setStep(state, tt, p, 'open'); tellStep(state, p, tt); }
    for (const s of hid) { s.known = true; }
    if (hid.length) revealTruth(state, p, tt);
  } else if (of === 'deflect') {
    feel(state, p, 'security', -0.8); feel(state, p, 'stress', 0.5);
    addRelationshipDimension(p, tt, 'trust', -0.4);
  } else {
    // The lie: p believes it for now, and it costs twice when it comes out.
    feel(state, p, 'security', 0.6); feel(state, tt, 'guilt', 0.8);
    for (const s of hid) { s.severity = Math.min(2, s.severity * 1.5); s.lied = true; }
  }
  return scene(state, rng, phase, 'where-head', c ? [p, tt, c] : [p, tt], { ...threadTag, of, kissed: kissedC,
    pop: pop([p, 0.3, 1.2], [tt, of === 'honest' ? 0.4 : of === 'lie' ? COST.lie : of === 'deflect' ? COST.dodge : 0.4, 1.4]) },
    { major: of === 'honest' ? [p, tt] : [] });
}

function graftEvening(state, rng, t, phase) {
  const { c, t: tt, p } = t;
  const out = [];
  const tag = beat => ({ thread: { id: t.id, type: 'graft', beat, since: t.ep, who: castOf(t).slice(0, 2) } });
  // t tells c to back off: turned down twice, or closed off.
  if (t.shutDue && !t.shut && together(state, tt, c)) {
    t.shut = true;
    nudgeAttraction(state, c, tt, -2); feel(state, c, 'confidence', -0.6); addBond(tt, p, 0.4);
    if (together(state, p, tt)) feel(state, p, 'security', 0.8);
    // How c takes it is c's own: the calm take it on the chin, the rest don't.
    const graceful = rng() < 0.25 + 0.6 * st(state, c, 'temperament');
    if (!graceful) addBond(c, tt, -0.4);
    out.push(scene(state, rng, phase, 'graft-shut', [tt, c], { ...tag('shut'), of: graceful ? 'graceful' : 'sore', pop: pop([tt, 1, 1.5], [c, graceful ? 0.3 : -0.3, 1]) }));
    return out;
  }
  // p and t talk, once p knows something happened.
  if (t.seen && !t.talked) {
    const ev = whereHead(state, rng, phase, p, tt, c, tag('where-head'));
    if (ev) { t.talked = state.ep; out.push(ev); }
    return out;
  }
  // A later episode: t has gone further for c than for p, and says so.
  const saidNoToday = today(state).some(e => (e.kind === 'loyalty' || (e.kind === 'pull' && e.extra?.rebuffed) || e.kind === 'graft-shut'
    || (e.kind === 'where-head' && e.extra?.of === 'reassure')) && e.players.includes(tt));
  if (t.talked != null && t.talked < state.ep && !t.turned && !saidNoToday && (attr(state, tt, c) ?? 0) > romance(tt, p) + 1
    && rng() < 0.4 + 0.4 * st(state, tt, 'boldness') && together(state, tt, p)) {
    t.turned = true;
    breakHeart(state, p, tt, 3 * romance(p, tt) / 10);
    addRelationshipDimension(p, tt, 'resentment', 0.8);
    if (stepOf(state, tt, p) !== 'coupled') { setStep(state, tt, p, 'cracking-on'); tellStep(state, p, tt); }
    nudgeAttraction(state, c, tt, 0.4);
    // …and p takes it as p is built: the hot-headed angry, the calm quietly.
    const react = weighted(rng, [['angry', (1 - st(state, p, 'temperament')) * (0.4 + st(state, p, 'boldness'))], ['hurt', 0.6 + attachment(state.profiles[p]).anxiety], ['calm', st(state, p, 'temperament') * 0.8]]);
    out.push(scene(state, rng, phase, 'graft-turn', [tt, p, c], { ...tag('turn'), of: react, pop: pop([tt, COST.turn, 2.2], [p, 1.2, 1.5]) }, { major: [tt, p] }));
  }
  return out;
}

function doubtBeat(state, rng, t, phase) {
  const { a, p } = t;
  if (!together(state, a, p)) return [];
  const tag = beat => ({ thread: { id: t.id, type: 'doubt', beat, since: t.ep, who: castOf(t).slice(0, 2) }, why: t.why, ...(t.x ? { about: t.x } : {}) });
  // 1. a confides in a friend (events.js vent: said out loud, so it can travel).
  if (!t.vented && (phase === 'morning' || phase === 'day')) {
    const f = friendsOf(state, a, [p, t.x], 1)[0];
    if (!f) return [];
    t.vented = f;
    t.ventEp = state.ep;
    t.beat = Math.max(t.beat, 1);
    return [makeEvent(state, rng, { phase, kind: 'vent', players: [a, f], aired: true, extra: tag('confide') })];
  }
  // 4. The day after the talk, it ends one way or the other: {a} recommits,
  // or tells {p} they're better as friends. (A doubt that played all its
  // beats in one episode then sat finished for four, holding a headline slot,
  // and left whole villa days with no story at all: season read 2026-10-25.)
  if (t.talked && t.talkEp < state.ep && !t.ended && (phase === 'day' || phase === 'evening')) {
    t.ended = true;
    const r = romance(a, p);
    const recommit = r >= 5 || (t.talkOf === 'reassure' && r >= 4);
    // Ending it takes some nerve, or not caring much any more.
    const ends = !recommit && rng() < 0.35 + 0.4 * st(state, a, 'boldness') + 0.3 * (1 - r / 5);
    if (!recommit && !ends) { close(t, 'limbo', state); return []; }
    if (recommit) {
      addBond(a, p, 0.5); nudgeAttraction(state, a, p, 0.6); feel(state, p, 'security', 1.5); feel(state, a, 'guilt', -0.5);
      close(t, 'mended', state);
    } else {
      breakHeart(state, p, a, 3 * romance(p, a) / 10);
      nudgeAttraction(state, p, a, -1);
      addRelationshipDimension(p, a, 'resentment', 0.5);
      if (stepOf(state, a, p) !== 'coupled') { setStep(state, a, p, 'coupled'); tellStep(state, p, a); }
      // Done is done (events.js doneWith): no warm scenes between them, and
      // neither turns a pull down "for" the other any more (season read
      // 2026-10-25: Callum, dumped at lunch, told Ellie "I'm going back to Amber").
      (state.toldDone ||= {})[`${a}|${p}`] = state.ep;
      // …and on a day the season can take it (season.js _canSplit, the same
      // rule as having it out over a telling), they're single from now.
      if (state._canSplit && state._splitEp !== state.ep) {
        state.couples = state.couples.filter(k => !(k.includes(a) && k.includes(p)));
        state._splitEp = state.ep;
        // In exes.js terms the hurt one decides on a second chance (`ender`)
        // and the one who ended it is the one who would come back and say sorry.
        noteBreakup(state, { ender: p, wrong: a, severity: 0.5, cause: 'doubt' });
      }
      close(t, 'ended', state);
    }
    return [scene(state, rng, phase, 'doubt-end', [a, p], { ...tag('end'), of: recommit ? 'recommit' : 'friends',
      pop: pop([a, recommit ? 0.8 : COST.dump, 1.5], [p, recommit ? 0.5 : 1.2, 1.5]) }, { major: recommit ? [] : [a, p] })];
  }
  // 2. The next day, p feels it, and asks a friend. The friend may be the one a told.
  if (t.vented && !t.noticed && t.ventEp < state.ep && (phase === 'day' || phase === 'evening')) {
    const f = friendsOf(state, p, [a], 1)[0];
    if (!f) return [];
    t.noticed = true;
    t.beat = Math.max(t.beat, 2);
    const knows = f === t.vented || state.secrets.some(s => !s.known && s.kind === 'said' && s.who === a && s.witnesses.includes(f));
    // Knowing, the friend tells — the bold and the loyal to p — or covers.
    const tells = knows && rng() < 0.3 + 0.4 * st(state, f, 'boldness') + 0.2 * Math.max(0, getBond(f, p) - getBond(f, a)) / 5;
    feel(state, p, 'stress', 0.5);
    if (tells) {
      for (const s of state.secrets.filter(z => !z.known && z.kind === 'said' && z.who === a && z.partner === p)) s.known = true;
      jealousyHit(state, p, a, t.x || a, 1.5, { confirmed: true });
      addBond(p, f, 0.5); addBond(a, f, -0.4);
    }
    return [scene(state, rng, phase, 'feels-off', [p, f, a], { ...tag('notice'), of: tells ? 'told' : knows ? 'covers' : 'unsure', pop: pop([p, 0.3, 1], [f, tells ? 0.2 : 0, 0.6]) })];
  }
  // 3. "Where's your head at?"
  if (t.noticed && !t.talked && phase === 'evening') {
    const ev = whereHead(state, rng, phase, p, a, t.x, tag('talk'));
    if (ev) { t.talked = true; t.talkEp = state.ep; t.talkOf = ev.extra.of; t.beat = 3; return [ev]; }
  }
  return [];
}

function secretBeat(state, rng, t, phase) {
  const sec = state.secrets.find(s => s.id === t.sec);
  if (!sec || sec.known || !together(state, t.w, t.p)) return [];
  const tag = beat => ({ thread: { id: t.id, type: 'secret', beat, since: t.ep, who: castOf(t).slice(0, 2) }, secret: t.sec });
  // 1. The one who saw it carries it, and asks a friend what to do.
  if (!t.carried && (phase === 'morning' || phase === 'day')) {
    const f = friendsOf(state, t.w, [t.x, t.p], 1)[0];
    if (!f) return [];
    t.carried = true;
    t.carriedEp = state.ep;
    const tellIt = rng() < 0.35 + 0.4 * st(state, f, 'boldness') + 0.25 * Math.max(0, getBond(f, t.p)) / 5;
    t.advised = tellIt ? 'tell' : 'leave';
    if (!sec.witnesses.includes(f)) sec.witnesses.push(f);
    addBond(t.w, f, 0.3);
    return [scene(state, rng, phase, 'secret-burden', [t.w, f, t.x, t.p], { ...tag('burden'), of: t.advised, sec: sec.kind, pop: pop([t.w, 0.1, 0.8]) })];
  }
  // 2. The telling: told to tell, or bold enough without being told — and
  // told to wait, they wait the day at least (season read 2026-10-25: "wait a
  // day", then the telling two hours later).
  if (t.carried && (phase === 'day' || phase === 'evening') && (t.advised === 'tell' || state.ep > t.carriedEp)) {
    const goes = t.advised === 'tell' ? 0.75 : 0.25 + 0.4 * st(state, t.w, 'boldness');
    if (rng() >= goes) { if (t.carried && state.ep > t.ep) t.waited = (t.waited || 0) + 1; return []; }
    const tell = makeEvent(state, rng, { phase, kind: 'gossip', players: [t.w, t.p, t.x], aired: true, extra: { ...tag('tell') } });
    const out = [tell];
    const after = haveItOut(state, tell);
    if (after) { after.extra.thread = { id: t.id, type: 'secret', beat: 'confront', since: t.ep, who: castOf(t).slice(0, 2) }; out.push(after); }
    const back = callOutStirrer(state, tell, after);
    if (back) out.push(back);
    return out;
  }
  return [];
}

function progressBeat(state, rng, t, phase) {
  const { a, b } = t;
  if (!together(state, a, b)) return [];
  const tag = beat => ({ thread: { id: t.id, type: 'progress', beat, since: t.ep, who: castOf(t).slice(0, 2) } });
  // The villa teases them, the morning after a moment of theirs.
  if (t.moment != null && t.moment < state.ep && !t.teased && (phase === 'morning' || phase === 'day')) {
    const center = rng() < 0.5 ? a : b, other = center === a ? b : a;
    const fs = friendsOf(state, center, [other], 3);
    if (fs.length) {
      t.teased = true;
      for (const f of fs) addBond(center, f, 0.2);
      feel(state, center, 'security', 0.6);
      return [scene(state, rng, phase, 'group-chat', [center, ...fs], { ...tag('tease'), subj: 'progress', x: other, pop: pop([center, 0.3, 0.8]) })];
    }
  }
  // A moment of theirs: a deep chat in the day, a kiss in the evening —
  // never in the hours after a row (the same rule as every warm scene).
  if ((phase === 'day' || phase === 'evening') && t.moment !== state.ep && !tooSoonForWarm(state, a, b)) {
    t.moment = state.ep;
    const kind = phase === 'evening' ? 'kiss' : 'deep-chat';
    return [makeEvent(state, rng, { phase, kind, players: [a, b], aired: true, extra: { ...tag('moment') } })];
  }
  return [];
}

/**
 * Two singles: a chat that runs long, the friends wanting every detail, a
 * first kiss when both want it. The recoupling decides the rest.
 */
function sparkBeat(state, rng, t, phase) {
  const { a, b } = t;
  if (!together(state, a, b) || partnerOf(state, a) || partnerOf(state, b)) return [];
  const tag = beat => ({ thread: { id: t.id, type: 'spark', beat, since: t.ep, who: castOf(t).slice(0, 2) } });
  // The friends, after a chat: what's going on with you two?
  if (t.chatted != null && t.chatted < state.ep && !t.teased && (phase === 'morning' || phase === 'day')) {
    const center = rng() < 0.5 ? a : b, other = center === a ? b : a;
    const fs = friendsOf(state, center, [other], 3);
    if (fs.length) {
      t.teased = true;
      for (const f of fs) addBond(center, f, 0.2);
      return [scene(state, rng, phase, 'group-chat', [center, ...fs], { ...tag('tease'), subj: 'spark', x: other, pop: pop([center, 0.3, 0.8]) })];
    }
  }
  // The chat: once a day, in the day or the evening.
  if (t.chatted !== state.ep && (phase === 'day' || phase === 'evening')
    && !today(state).some(e => e.kind === 'pull' && e.players.includes(a) && e.players.includes(b))) {
    t.chatted = state.ep;
    const first = rng() < 0.5 + (st(state, a, 'boldness') - st(state, b, 'boldness')) / 2 ? [a, b] : [b, a];
    return [makeEvent(state, rng, { phase, kind: 'pull', players: first, aired: true, extra: tag('chat') })];
  }
  // The first kiss, in the evening, when both of them want it.
  if (!t.kissed && phase === 'evening' && t.chatted != null && !tooSoonForWarm(state, a, b) && Math.min(attr(state, a, b) ?? 0, attr(state, b, a) ?? 0) >= 4.2) {
    t.kissed = true;
    return [makeEvent(state, rng, { phase, kind: 'kiss', players: [a, b], aired: true, extra: tag('kiss') })];
  }
  return [];
}

/**
 * The thread beats of one part of the day: the episode's headline threads,
 * each moving on at most once a part of the day, and no more than its share
 * of the episode (the top story four, the others three).
 */
export function threadBeats(state, rng, phase, max = Infinity) {
  const th = state._th;
  if (!th || th.ep !== state.ep) return [];
  const out = [];
  // Called a thread or two at a time, so the stories intercut with the rest
  // of the day: each thread is tried once a part of the day.
  const tried = ((th.tried ||= {})[phase] ||= []);
  let moved = 0;
  for (const id of th.headline) {
    if (moved >= max) break;
    if (tried.includes(id)) continue;
    tried.push(id);
    const t = (state.threads || []).find(x => x.id === id);
    if (!t || t.over) continue;
    const cap = id === th.top ? 4 : 3;
    if ((th.used[id] || 0) >= cap) continue;
    let evs = [];
    if (t.type === 'graft') evs = phase === 'evening' ? [...graftEvening(state, rng, t, phase)] : [];
    if (t.type === 'graft' && !evs.length) evs = graftBeat(state, rng, t, phase);
    else if (t.type === 'doubt') evs = doubtBeat(state, rng, t, phase);
    else if (t.type === 'secret') evs = secretBeat(state, rng, t, phase);
    else if (t.type === 'progress') evs = progressBeat(state, rng, t, phase);
    else if (t.type === 'spark') evs = sparkBeat(state, rng, t, phase);
    if (!evs.length) continue;
    th.used[id] = (th.used[id] || 0) + 1;
    t.last = state.ep;
    t.beat++;
    moved++;
    out.push(...evs);
    for (const e of evs) queueReaction(state, e);
  }
  return out;
}

// ── the day before the night ──────────────────────────────────────────
// On a ceremony day the villa talks about tonight (both real episodes read:
// "If he gets to know her and still chooses you, he's yours"): who they'll
// pick and who'll pick them, whether the public know them, stick or twist.
// Saying it out loud moves things: a friend's word sways a pick a little,
// and a couple who fear the vote pull together.
export function tonightBeats(state, rng, phase, entry, max = 2) {
  const th = state._th;
  if (!th || th.ep !== state.ep || !entry) return [];
  const done = (th.tonight ||= []);
  const out = [];
  const m = entry.moment;
  const free = n => !done.includes(n) && inVilla(state, n);
  if (m === 'recoupling') {
    // Whose choice it is tonight: a pick-chat is a chooser's or a waiter's
    // (season read 2026-10-25: told "whatever you decide" on a night she didn't).
    const picks = nextPicker(state);
    // The ones it's a real question for: singles, and anybody in a story about their couple.
    const cands = state.villa.filter(free).map(a => {
      const p = partnerOf(state, a);
      const story = live(state).find(t => (t.type === 'graft' && t.t === a) || (t.type === 'doubt' && t.a === a));
      const x = !p ? roomMates(state, a).filter(o => compatible(state, a, o)).sort((u, v) => (attr(state, a, v) ?? 0) - (attr(state, a, u) ?? 0))[0]
        : story ? (story.type === 'graft' ? story.c : story.x) : null;
      const of = !p ? 'nobody' : story ? (x ? 'torn' : 'unsure') : null;
      return of ? { a, p, x, of, w: !p ? 1.2 : 1 } : null;
    }).filter(Boolean).sort((u, v) => v.w - u.w || (u.a < v.a ? -1 : 1));
    for (const c of cands) {
      if (out.length >= max) break;
      // Never the partner of the one they want (Imani told Molly she wanted Ryan, Molly's partner).
      const f = friendsOf(state, c.a, [c.p, c.x, c.x ? partnerOf(state, c.x) : null].filter(Boolean), 1)[0];
      if (!f || (c.x && !together(state, c.a, c.x)) || (c.p && apart(state, c.a, c.p))) continue;
      done.push(c.a);
      // The friend's word: back the couple, or go for the one they keep looking at.
      const backs = c.p ? (getBond(f, c.p) + 1 >= (c.x ? getBond(f, c.x) : -9) ? c.p : c.x) : c.x;
      if (backs) nudgeAttraction(state, c.a, backs, 0.3);
      feel(state, c.a, 'stress', c.of === 'nobody' ? 0.5 : 0.3);
      out.push(scene(state, rng, phase, 'pick-chat', [c.a, f, ...(c.x ? [c.x] : [])],
        { of: c.of, side: backs === c.p ? 'partner' : 'other', final: !!entry.finalRecoupling, choosing: state.profiles[c.a]?.gender === picks,
          pop: pop([c.a, 0.2, 0.8]) }));
    }
  } else if (m === 'public-vote' || m === 'semi-final') {
    // The couples who feel least sure of themselves feel it: the newest, the
    // least into each other. (Never the public's numbers: the villa can't see
    // them — tests/pm-ledger-readers.)
    const since = c => state.coupledSince?.[[...c].sort().join('|')] ?? 0;
    // …not one that's been told, rowed or ended today (season read 2026-10-25:
    // Callum, told about Amber that afternoon, on the daybed with her at night
    // saying "I'm not ready to leave you").
    const couples = state.couples.filter(([a, b]) => together(state, a, b) && free(a) && free(b) && !tooSoonForWarm(state, a, b))
      .map(c => [c, (romance(c[0], c[1]) + romance(c[1], c[0])) / 2 + Math.min(4, ((state.day ?? 0) - since(c)) / 3)])
      .sort((u, v) => u[1] - v[1]);
    for (const [[a, b]] of couples.slice(0, max)) {
      done.push(a, b);
      addBond(a, b, 0.4); feel(state, a, 'stress', 0.4); feel(state, b, 'stress', 0.4);
      const calm = rng() < (st(state, a, 'temperament') + st(state, b, 'temperament')) / 2;
      out.push(scene(state, rng, phase, 'vote-worry', [a, b], { of: calm ? 'calm' : 'scared', pop: pop([a, 0.3, 0.8], [b, 0.3, 0.8]) }));
    }
  } else if (m === 'stick-or-twist' && state.split) {
    // Casa: the originals with somebody new on their mind.
    const arrivals = new Set(state.casaArrivals || []);
    const cands = state.villa.filter(n => free(n) && !arrivals.has(n) && partnerOf(state, n)).map(o => {
      const x = roomMates(state, o).filter(c => arrivals.has(c) && compatible(state, o, c)).sort((u, v) => (attr(state, o, v) ?? 0) - (attr(state, o, u) ?? 0))[0];
      return x ? { o, x, w: (attr(state, o, x) ?? 0) - romance(o, partnerOf(state, o)) / 2 } : null;
    }).filter(c => c && c.w > 0).sort((u, v) => v.w - u.w);
    for (const c of cands.slice(0, max)) {
      const f = friendsOf(state, c.o, [c.x], 1)[0];
      if (!f) continue;
      done.push(c.o);
      const p = partnerOf(state, c.o);
      // The friend hears how {a} talks about the new one, not only whose side
      // they're on: every original knows the partner better than an arrival,
      // and "stick" every time held Casa's twists to a quarter of the tempted.
      const lean = (getBond(f, p) - getBond(f, c.x)) / 5 - ((attr(state, c.o, c.x) ?? 0) - romance(c.o, p)) / 4;
      const stick = rng() < clamp(0.5 + 0.25 * lean, 0.15, 0.85);
      nudgeAttraction(state, c.o, stick ? p : c.x, 0.25);
      out.push(scene(state, rng, phase, 'stick-twist', [c.o, f, c.x], { of: (attr(state, c.o, c.x) ?? 0) > romance(c.o, p) ? 'tempted' : 'torn',
        side: stick ? 'stick' : 'twist', pop: pop([c.o, 0.2, 1]) }));
    }
  }
  return out;
}

// ── the villa reacts ──────────────────────────────────────────────────
// What a beat leaves the one it happened to telling their friends, and who it
// was about. `due`: now (later this part of the day) or next (the next part).
const REACT = {
  pull: e => {
    const [c, t] = e.players;
    if (!partnerOf(e._s, t) || partnerOf(e._s, t) === c || e.extra.rebuffed) return null;
    return { center: t, subj: 'pulled', x: c, due: 'next' };
  },
  watching: () => null,
  // An honest answer or a dodge, told by the one who asked; {about} is who it was about.
  'where-head': e => (e.extra.of === 'honest' ? { center: e.players[0], subj: 'honest', x: e.players[1], about: e.players[2] || null, kissed: !!e.extra.kissed, story: e.extra.thread?.type, why: e.extra.why, due: 'next' }
    : e.extra.of === 'deflect' ? { center: e.players[0], subj: 'dodged', x: e.players[1], story: e.extra.thread?.type, due: 'next' } : null),
  'graft-turn': e => ({ center: e.players[1], subj: 'turned', x: e.players[0], about: e.players[2], due: 'next' }),
  'doubt-end': e => (e.extra.of === 'friends' ? { center: e.players[1], subj: 'ended', x: e.players[0], due: 'next' } : null),
  'graft-shut': e => ({ center: e.players[1], subj: 'shut-down', x: e.players[0], due: 'next' }),
  gossip: e => { const s = (e._s.secrets || []).find(z => z.id === e.extra.secret); return { center: e.players[1], subj: 'found-out', x: e.players[2], about: s?.with || null, sec: s?.kind || null, due: 'next' }; },
  'told-confront': e => ({ center: e.players[0], subj: 'row', x: e.players[1], due: 'next' }),
  'jealous-confront': e => ({ center: e.players[0], subj: 'row', x: e.players[1], due: 'next' }),
  'ask-declined': e => ({ center: e.players[0], subj: 'knocked-back', x: e.players[1], due: 'next' }),
  'love-hanging': e => ({ center: e.players[0], subj: 'knocked-back', x: e.players[1], due: 'next' }),
  'exclusive-ask': e => (e.extra.yes ? { center: e.players[1], subj: 'celebrate', of: 'exclusive', x: e.players[0], due: 'next' } : null),
  'official-ask': e => (e.extra.yes ? { center: e.players[1], subj: 'celebrate', of: 'official', x: e.players[0], due: 'next' } : null),
  // Told by the one who heard it: {x} said it first.
  'love-said': e => ({ center: e.players[1], subj: 'celebrate', of: 'love', x: e.players[0], due: 'next' }),
};
export function queueReaction(state, e) {
  const th = state._th;
  if (!th || th.ep !== state.ep || !e.aired || !REACT[e.kind]) return;
  const r = REACT[e.kind]({ ...e, _s: state });
  if (!r) return;
  // One group chat per person a day, and per thing that happened.
  if (th.queue.some(q => q.center === r.center) || (th.reacted || []).includes(r.center)) return;
  // `src` is the scene it reacts to; `about` stays the third person's name.
  th.queue.push({ ...r, src: e.id, from: e.phase });
}

const NEXT = { night: 'morning', morning: 'day', day: 'evening', challenge: 'evening', event: 'evening', evening: 'night' };
/** The reactions that are due in this part of the day, as group chats. */
// How many group chats about the same kind of news an episode airs.
const CHAT_CAP = { pulled: 2, 'shut-down': 2, 'knocked-back': 2 };
export function reactions(state, rng, phase, max = 3) {
  const th = state._th;
  if (!th || th.ep !== state.ep) return [];
  const out = [];
  for (const q of [...th.queue]) {
    if (out.length >= max) break;
    const due = q.due === 'now' ? q.from : NEXT[q.from] || 'evening';
    if (due !== phase && !(phase === 'evening' && due === 'night')) continue;
    th.queue = th.queue.filter(x => x !== q);
    const { center, x, subj, about } = q;
    (th.reacted ||= []).push(center);
    if (!inVilla(state, center)) continue;
    const fs = friendsOf(state, center, [x, about], 3).filter(f => f !== x && f !== about);
    if (!fs.length) continue;
    const wronged = ['found-out', 'row', 'knocked-back', 'turned', 'honest', 'dodged', 'ended'].includes(subj);
    for (const f of fs) {
      addBond(center, f, 0.3);
      // The friends take a side: against whoever hurt their friend, in
      // proportion to how close they are — and how they already read x.
      if (wronged && x && inVilla(state, x)) addBond(f, x, -0.3 * (0.5 + Math.max(0, getBond(f, center)) / 10) * judgement(state, f, x));
      if (subj === 'celebrate' && x && inVilla(state, x)) addBond(f, x, 0.15);
    }
    // Pulled while coupled, and telling the girls (or the boys): what happened
    // on that daybed is no secret from them any more.
    if (subj === 'pulled') {
      for (const s of state.secrets.filter(z => !z.known && z.who === center && z.with === x)) for (const f of fs) if (!s.witnesses.includes(f)) s.witnesses.push(f);
    }
    if (wronged) feel(state, center, 'stress', -0.3);
    // The same telling, over and over, is one the edit cuts (season read
    // 2026-10-25, Casa: four "how did you feel? not what you said" chats in
    // one episode). Past the cap it still happens — the friends know, and take
    // sides — off camera.
    const n = ((th.subjN ||= {})[subj] = (th.subjN[subj] || 0) + 1);
    const aired = n <= (CHAT_CAP[subj] ?? 3);
    out.push(scene(state, rng, phase, 'group-chat', [center, ...fs], { subj, x: x || null, about: about || null, ...(q.of ? { of: q.of } : {}),
      ...(q.sec ? { sec: q.sec } : {}), ...(q.kissed ? { kissed: true } : {}), ...(q.why ? { why: q.why } : {}), ...(q.story ? { thread: { type: q.story, beat: 'react' } } : {}),
      pop: pop([center, wronged ? 0.4 : 0.2, 1], [fs[0], 0.1, 0.5]) }, { aired }));
  }
  return out;
}

/**
 * Lights out, on a night with no ceremony: the couples in today's stories go
 * over it in bed. A row today keeps them apart under the covers, warm or not.
 */
export function bedChats(state, rng, phase = 'evening') {
  const th = state._th;
  if (!th || th.ep !== state.ep) return [];
  const pairs = [];
  for (const id of th.headline) {
    const t = (state.threads || []).find(x => x.id === id);
    if (!t || !th.used[id]) continue;
    const pair = t.type === 'graft' ? [t.p, t.t] : t.type === 'doubt' ? [t.p, t.a] : t.type === 'progress' ? [t.a, t.b] : null;
    if (pair && together(state, ...pair) && partnerOf(state, pair[0]) === pair[1] && !pairs.some(p => p.includes(pair[0]) || p.includes(pair[1]))) pairs.push([...pair, t]);
  }
  return pairs.slice(0, 2).map(([a, b, t]) => {
    const rowed = today(state).some(e => ['where-head', 'told-confront', 'jealous-confront', 'argument', 'graft-turn'].includes(e.kind)
      && e.players.slice(0, 2).includes(a) && e.players.slice(0, 2).includes(b));
    const warm = !rowed && romance(a, b) >= 4 && romance(b, a) >= 4;
    if (warm) { addBond(a, b, 0.3); feel(state, a, 'security', 0.5); feel(state, b, 'security', 0.5); }
    else { feel(state, a, 'stress', 0.3); }
    return scene(state, rng, phase, 'bed-chat', [a, b], { thread: { id: t.id, type: t.type, beat: 'bed', since: t.ep, who: castOf(t).slice(0, 2) }, subj: t.type, of: warm ? 'warm' : rowed ? 'after-row' : 'distant',
      pop: pop([a, 0.2, 0.6], [b, 0.2, 0.6]) });
  });
}

/** What the episode's threads were, for the screens and the cold open. */
export function threadSummary(state) {
  const th = state._th;
  if (!th || th.ep !== state.ep) return [];
  return th.headline.map(id => (state.threads || []).find(t => t.id === id)).filter(Boolean)
    .map(t => ({ id: t.id, type: t.type, cast: castOf(t), over: t.over, why: t.why || null, used: th.used[t.id] || 0 }));
}
