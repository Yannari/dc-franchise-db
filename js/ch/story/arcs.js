// ══════════════════════════════════════════════════════════════════════
// ch/story/arcs.js — stories that run across episodes, and the running gags
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's and Big Brother's arcs and runners (td/story/arcs.js,
// bb/story/arcs.js) on The Challenge's record. Words only: every arc is read
// from what already happened and offered to the director as a scene; nothing
// here moves the game.
//
//   payback     somebody who voted you in, in an earlier episode, is the one
//               you call out now. The scene before the call-out says so.
//   the beast   a second Arena win: the house starts to talk about it. A third:
//               nobody wants to be the one who sends them in. When a beast
//               finally loses, the house reacts to the giant falling.
//   underdog    picked last, or last in a daily, or choked — and then won: a
//               daily, or an elimination nobody gave them.
//   runners     two a season, for the house's most comic voices: a bit set up
//               early, called back, paid off when the house is small
//               (TJ never gets their name right; the protein shakes; the
//               motivational speeches nobody asked for; the snack stash).
//
// Each arc offers { kind, who, data, day, after } — `after` is the id of the
// scene it airs next to (before a call-out, after an Arena) — and remembers
// what it has told, so nothing is told twice.
import { voiceOf } from '../../td/story/voice.js';
import { getBond } from '../../bonds.js';

const arcBook = state => ((state.story ||= { lines: [], filed: {} }).arcs ||= { told: {}, runners: null });
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const closest = (state, n, pool, not = []) => pool.filter(m => m !== n && !not.includes(m))
  .sort((x, y) => getBond(n, y) - getBond(n, x) || (x < y ? -1 : 1))[0] || null;

// Who voted for whom, before this episode.
function votedBefore(state, ep, voter, target) {
  return state.episodes.some(e => e.ep < ep && e.votes.some(v => v.votedIn === target && v.ballots.some(b => b.voter === voter && b.target === target)));
}
const arenaWinsBefore = (state, name, ep) => state.episodes.filter(e => e.ep < ep).flatMap(e => e.arena).filter(a => a.winner === name).length;
const arenaWinsThrough = (state, name, ep) => state.episodes.filter(e => e.ep <= ep).flatMap(e => e.arena).filter(a => a.winner === name).length;

export function arcsFor(state, epRec) {
  const b = arcBook(state);
  const out = [];
  const scenes = state.scenes.filter(s => s.ep === epRec.ep);
  const present = new Set(state.cast.filter(n => !state.gone.some(g => g.name === n && g.ep < epRec.ep)));
  // ── payback ──
  for (const sc of scenes.filter(s => s.kind === 'callout')) {
    const [caller, opp] = sc.who;
    const k = `payback:${caller}>${opp}`;
    if (b.told[k] || !votedBefore(state, epRec.ep, opp, caller)) continue;
    b.told[k] = epRec.ep;
    out.push({ kind: 'arc-payback', who: [caller, opp], data: {}, day: sc.day, before: sc.id });
  }
  // ── the beast ──
  for (const a of epRec.arena) {
    const arena = scenes.find(s => s.kind === 'arena' && s.data.winner === a.winner && s.data.loser === a.loser);
    if (!arena) continue;
    const wins = arenaWinsThrough(state, a.winner, epRec.ep);
    const pool = [...present].filter(n => n !== a.winner && n !== a.loser);
    // the season's beasts are the first two to win twice; later ones are just strong
    const beasts = Object.keys(b.told).filter(k => k.startsWith('beast2:')).length;
    if (wins === 2 && beasts < 2 && !b.told[`beast2:${a.winner}`]) {
      b.told[`beast2:${a.winner}`] = epRec.ep;
      const x = pool.sort((p, q) => hash(`${epRec.ep}|${p}`) - hash(`${epRec.ep}|${q}`))[0];
      const y = x && closest(state, x, pool, [a.winner]);
      if (x && y) out.push({ kind: 'arc-beast', who: [x, y], data: { target: a.winner, wins }, day: arena.day, after: arena.id });
    }
    if (wins === 3 && !b.told[`beast3:${a.winner}`]) {
      b.told[`beast3:${a.winner}`] = epRec.ep;
      const x = pool.filter(n => state.division[n] === state.division[a.winner]).sort((p, q) => hash(`${epRec.ep}|3|${p}`) - hash(`${epRec.ep}|3|${q}`))[0];
      if (x) out.push({ kind: 'arc-beast-feared', who: [x], data: { target: a.winner, wins }, day: arena.day, after: arena.id });
    }
    // the giant falls
    const before = arenaWinsBefore(state, a.loser, epRec.ep);
    if (before >= 2 && !b.told[`falls:${a.loser}`]) {
      b.told[`falls:${a.loser}`] = epRec.ep;
      const x = pool.filter(n => n !== a.winner).sort((p, q) => hash(`${epRec.ep}|f|${p}`) - hash(`${epRec.ep}|f|${q}`))[0];
      if (x) out.push({ kind: 'arc-giant-falls', who: [x, a.winner], data: { gone: a.loser, wins: before }, day: arena.day, after: arena.id });
    }
  }
  // ── the underdog ──
  // A real low point: picked last, a choke on camera, or last in two dailies.
  const lowPoints = name => state.scenes.some(s => s.ep < epRec.ep && ((s.kind === 'picked-last' && s.who[0] === name)
    || (s.kind === 'daily-choke' && s.who[0] === name)))
    || state.scenes.filter(s => s.ep < epRec.ep && s.kind === 'daily' && s.data.last?.includes(name)).length >= 2;
  // ...and a first real win: an upset in the Arena, or their first daily.
  const firstDaily = n => !state.episodes.some(e => e.ep < epRec.ep && e.daily?.mode === 'solo' && e.daily.winners.includes(n));
  const upsets = epRec.arena.filter(a => a.upset).map(a => a.winner);
  const dailyWins = epRec.daily?.mode === 'solo' ? (epRec.daily.winners || []).filter(firstDaily) : [];
  let underdogs = 0;
  for (const n of [...new Set([...upsets, ...dailyWins])]) {
    const k = `underdog:${n}`;
    if (underdogs >= 1 || b.told[k] || !lowPoints(n)) continue;
    underdogs++;
    b.told[k] = epRec.ep;
    const sc = upsets.includes(n) ? scenes.find(s => s.kind === 'arena' && s.data.winner === n) : scenes.find(s => s.kind === 'daily');
    if (sc) out.push({ kind: 'arc-underdog', who: [n], data: { how: upsets.includes(n) ? 'arena' : 'daily' }, day: sc.day, after: sc.id });
  }
  // ── runners ──
  // One running gag an episode, the two taking turns: the one aired longest ago goes first.
  const rs = runnersOf(state);
  const order = Object.entries(rs).sort((x, y) => x[1].last - y[1].last || (x[0] < y[0] ? -1 : 1));
  for (const [name, r] of order) {
    if (!present.has(name) || r.stage >= 3 || epRec.ep - r.last < 2) continue;
    if (out.some(x => x.kind.startsWith('run-'))) break;
    const small = present.size <= (state.options.finalists || 8) + 4;
    const stage = r.stage === 0 ? 'setup' : small && r.calls >= 1 ? 'payoff' : r.calls < 2 ? 'call' : null;
    if (!stage) continue;
    const partner = closest(state, name, [...present]);
    if (!partner) continue;
    const at = scenes.find(s => ['party', 'kitchen-disaster', 'gym-flex', 'daily'].includes(s.kind)) || scenes[0];
    if (!at) continue;
    r.last = epRec.ep;
    if (stage === 'setup') r.stage = 1; else if (stage === 'call') { r.calls++; r.stage = 2; } else r.stage = 3;
    out.push({ kind: `run-${r.bit}`, stage, who: [name, partner], data: { stage }, day: at.day, after: at.id });
  }
  return out;
}

// ── the season's two running gags ────────────────────────────────────
// The house's two most comic voices each get a bit, by what their voice is.
const BIT_BY_VOICE = { goofy: 'name', ditzy: 'name', food: 'snacks', competitive: 'protein', loud: 'speech',
  theatrical: 'speech', chaotic: 'snacks', flirty: 'mirror', proud: 'mirror' };
const COMIC = { goofy: 3, ditzy: 2.6, food: 2.4, chaotic: 2.2, theatrical: 2, loud: 1.6, flirty: 1.4, competitive: 1.2, proud: 1.1 };

export function runnersOf(state) {
  const b = arcBook(state);
  if (b.runners) return b.runners;
  const scored = state.cast.map(n => {
    const tags = voiceOf(n);
    const top = tags.find(t => COMIC[t]) || null;
    return { n, top, s: top ? COMIC[top] - tags.indexOf(top) * 0.2 : 0 };
  }).filter(x => x.top).sort((x, y) => y.s - x.s || hash(`${state.seed}|${x.n}`) - hash(`${state.seed}|${y.n}`));
  const out = {}, used = new Set();
  for (const { n, top } of scored) {
    if (Object.keys(out).length >= 2) break;
    const bit = [BIT_BY_VOICE[top], 'name', 'snacks', 'protein', 'speech', 'mirror'].find(x => x && !used.has(x));
    used.add(bit);
    out[n] = { bit, stage: 0, calls: 0, last: -9 };
  }
  b.runners = out;
  return out;
}
