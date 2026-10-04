// ══════════════════════════════════════════════════════════════════════
// bb/script/ceremony.js — the words people say at the week's ceremonies
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 Phase 4. Every ceremony act is decided by the engine (who
// won, who went up, who came down, who went home); this reads the finished
// act and writes what the houseguests said, the moment the act is recorded,
// so a line reads the house as it stood at the ceremony.
//
// The words draw from their OWN dice (stableRng on the season's salt, the
// week and the part), never the engine's rng: picking a sentence must not
// move a single later draw, or adding a line to a pool would change who wins
// the season.
//
// act.script = {
//   hoh:      lines                the new HOH's reaction (and a DR)
//   veto:     lines                the veto winner's reaction
//   noms:     lines                the HOH's speech after the last key
//   nomDr:    { name: lines }      each nominee in the Diary Room
//   holderDr: lines                the veto holder, before the meeting
//   pleas:    { name: lines }      each nominee asking the holder
//   renom:    lines                the replacement nominee, in the Diary Room
//   goodbye:  lines                the evicted houseguest leaving the house
//   suite:    { open, enter: { name: lines }, hold, short: { name: lines },
//               clock, safe, plus, passed, none }   the Safety Suite (Phase 7)
// }
// A line is { kind: 'say' | 'dr' | 'beat', by, text }. A part the act does not
// have is left out; the viewer falls back to the format's own words.
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { stableRng } from '../knowledge.js';
import { makeScene } from './scene.js';
import { writeScene, transcript } from './write.js';

function allied(a, b) {
  return (gs.namedAlliances || []).some(al => al.active !== false && (al.members || []).includes(a) && (al.members || []).includes(b));
}
const close = (a, b) => getBond(a, b) >= 3 || allied(a, b);
const band = bond => (bond >= 3 ? 'friends' : bond < 0 ? 'cold' : 'neutral');

/** Write one part. Returns its lines, or null if the pools have nothing (never thrown into the engine). */
function part(kind, who, ending, ctx, house, salt) {
  try {
    const scene = makeScene(kind, who, { ending }, house, 'living-room');
    const rng = stableRng(gs.bb?.seasonSalt || 0, ctx.week?.num || 0, kind, salt);
    return writeScene(scene, ctx, rng).lines;
  } catch { return null; }
}

/** The script for a ceremony act, or null. `extra` is what addBeats was handed. */
export function writeCeremony(act, week, house, extra = {}) {
  const hoh = act.hoh || week.hoh || null;
  const nominees = (extra.nominees || week.finalNominees || week.initialNominees || []).filter(Boolean);
  const ctx = { week, act: act.type, hoh, nominees };
  const past = (gs.bb?.weeks || []).filter(w => w !== week);
  const script = {};

  if (act.type === 'hoh' && act.winner && !act.secret) {
    const w = act.winner;
    const last = past.at(-1);
    const ending = (last?.finalNominees || []).includes(w) ? 'saved'
      : past.some(x => x.hoh === w) ? 'again' : 'first';
    script.hoh = part('hoh.win', { a: w }, ending, { ...ctx, hoh: w }, house, w);
  }

  if (act.type === 'nominations' && !act.anonymous && !act.duo?.blocks?.length) {
    const noms = (act.nominees || []).filter(Boolean);
    if (hoh && noms.length >= 2) {
      const target = noms.includes(act.target) ? act.target : null;
      const backdoor = act.backdoorTarget && !noms.includes(act.backdoorTarget);
      const ending = backdoor ? 'backdoor'
        : act.structure === 'expendables' ? 'expendables'
          : target && act.pawn && noms.includes(act.pawn) ? 'pawn'
            : 'target';
      const b = ending === 'pawn' || ending === 'target' ? (target || noms[0]) : noms[0];
      const c = ending === 'pawn' ? act.pawn : noms.find(n => n !== b);
      script.noms = part('noms.speech', { a: hoh, b, c }, ending, { ...ctx, nominees: noms }, house, hoh);
      script.nomDr = {};
      // A nominee the speech already cut to the Diary Room does not get a second one.
      const spoke = new Set((script.noms || []).filter(l => l.kind === 'dr').map(l => l.by));
      for (const n of noms.slice(0, 2).filter(x => !spoke.has(x))) {
        const end = n === act.pawn && !backdoor ? 'pawn' : close(n, hoh) ? 'blindsided' : n === target ? 'target' : 'any';
        const lines = part('noms.dr', { a: n, b: hoh }, end, { ...ctx, nominees: noms }, house, n);
        if (lines) script.nomDr[n] = lines;
      }
    }
  }

  if (act.type === 'veto' && !act.orderOnly) {
    const w = act.winner || act.vetoHolder;
    if (w) {
      const ending = nominees.includes(w) ? 'self' : w === hoh ? 'hoh' : 'any';
      script.veto = part('veto.win', { a: w, b: hoh || w }, ending, ctx, house, w);
    }
  }

  if (act.type === 'veto-ceremony') {
    const holder = act.holder || week.vetoWinner;
    const after = (act.nominees || []).filter(Boolean);
    const up = new Set([act.replacement, ...(act.duoUp || [])].filter(Boolean));
    const before = act.used
      ? [...new Set([act.saved, ...(act.duoDown || []), ...after.filter(n => !up.has(n))].filter(Boolean))]
      : after;
    if (holder) {
      // The decision, in the Diary Room before the meeting.
      const ending = act.used && act.saved === holder ? 'self' : act.used && act.saved ? 'use' : 'keep';
      const about = ending === 'keep' ? before.find(n => n !== holder) : act.saved;
      if (about || ending === 'self') script.holderDr = part('veto.dr', { a: holder, b: about || holder }, ending, ctx, house, holder);
      // The nominees ask, unless the holder is one of them.
      if (!before.includes(holder)) {
        script.pleas = {};
        for (const n of before.slice(0, 2)) {
          const lines = part('veto.plea', { a: n, b: holder }, band(getBond(n, holder)), ctx, house, n);
          if (lines) script.pleas[n] = lines;
        }
      }
      // The replacement, if one name went up and the house knows who named it.
      if (act.used && act.replacement && !(act.duoUp || []).length && !act.anonymous) {
        const namer = act.diamond ? holder : (act.chairAuthority || hoh);
        if (namer && namer !== act.replacement) {
          const end = close(act.replacement, namer) ? 'blindsided' : getBond(act.replacement, namer) < 0 ? 'expected' : 'any';
          script.renom = part('veto.renom', { a: act.replacement, b: namer }, end, ctx, house, act.replacement);
        }
      }
    }
  }

  if (act.type === 'eviction' && act.evicted) {
    const out = act.evicted;
    // Expected: the one the week was built to remove (the target, the backdoor,
    // or the replacement named to go). Blindsided: the pawn, or a friend of the
    // HOH, going home in their place.
    const nomAct = (week.acts || []).find(a => a.type === 'nominations');
    const cer = (week.acts || []).find(a => a.type === 'veto-ceremony');
    const aim = [nomAct?.backdoorTarget, nomAct?.target, cer?.replacement].find(n => n && (act.nominees || []).includes(n));
    const ending = aim === out ? 'expected'
      : (out === nomAct?.pawn || (hoh && close(out, hoh))) ? 'blindsided'
        : aim ? 'expected' : 'any';
    // The last hug goes to the closest friend who did not vote them out.
    const against = new Set((act.ballots || []).filter(b => b && b.evict === out).map(b => b.voter));
    const stay = house.filter(n => n !== out);
    const byBond = stay.slice().sort((x, y) => getBond(out, y) - getBond(out, x));
    const friend = byBond.find(n => !against.has(n)) || byBond[0];
    if (friend) script.goodbye = part('evict.goodbye', { a: out, b: friend }, ending, ctx, house, out);
  }

  // ── the Safety Suite: who swiped, who held, the clock, the Plus One ──
  // The act's beats carry a `part`; each gets its words, and its text becomes
  // the transcript of them, so the feed and the backlog say what was said.
  if (act.type === 'safety-suite') {
    const h = week.hohSecret ? null : act.hoh || null;
    const sctx = { ...ctx, hoh: h };
    const entrants = act.entrants || [];
    const first = entrants[0] || (act.held || [])[0];
    const suite = { enter: {}, short: {} };
    if (first) suite.open = part('suiteact.open', h && h !== first ? { a: first, b: h } : { a: first }, h && h !== first ? 'hoh' : 'plain', sctx, house, `open|${first}`);
    entrants.forEach((n, i) => { const l = part('suiteact.enter', { a: n }, i ? 'next' : 'first', sctx, house, `enter|${n}`); if (l) suite.enter[n] = l; });
    for (const b of act.beats || []) {
      const who = (b.players || [])[0];
      if (b.part === 'hold' && who) suite.hold = part('suiteact.hold', { a: who }, 'scene', sctx, house, `hold|${who}`);
      if (b.part === 'short' && who) {
        const run = (act.runs || []).find(r => r.name === who);
        const slow = run && run.score >= (act.clock || 5);
        suite.short[who] = part(slow ? 'suiteact.slow' : 'suiteact.short', { a: who }, 'scene', sctx, house, `short|${who}`);
      }
      if (b.part === 'clock' && who) suite.clock = part('suiteact.clock', { a: who }, act.solo ? 'solo' : 'many', sctx, house, `clock|${who}`);
      if (b.part === 'none' && who) suite.none = part('suiteact.none', { a: who }, 'scene', sctx, house, `none|${who}`);
    }
    if (act.winner) suite.safe = part('suiteact.safe', { a: act.winner }, 'scene', sctx, house, `safe|${act.winner}`);
    if (act.winner && act.plusOne) suite.plus = part('suiteact.plus', { a: act.winner, b: act.plusOne }, act.punishment || 'slop', sctx, house, `plus|${act.plusOne}`);
    if (act.winner && act.passed) suite.passed = part('suiteact.passed', { a: act.passed, b: act.winner }, 'scene', sctx, house, `passed|${act.passed}`);
    script.suite = suite;
    for (const b of act.beats || []) {
      const who = (b.players || [])[0];
      const lines = b.part === 'enter' ? suite.enter[who] : b.part === 'short' ? suite.short[who] : suite[b.part];
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  for (const k of Object.keys(script)) {
    const v = script[k];
    if (!v || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete script[k];
  }
  return Object.keys(script).length ? script : null;
}
