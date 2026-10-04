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
//   chain:    [run, run?]  each { start, links: { 'a>b': lines }, passed: { 'a>b': lines },
//               last, leftover }, plus chainFinal, chainNoms, chainAgain   the Chain of Safety
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

/**
 * A writer for an act that draws many lines from the same few pools (a chain's
 * ten picks, a week of searching): an entry already used in this act is drawn
 * again with a different salt, up to four times.
 */
function freshWriter(ctx, house) {
  const used = new Set();
  return (kind, who, data, salt) => {
    let got = null;
    for (let k = 0; k < 4; k++) {
      try {
        const scene = makeScene(kind, who, data, house, 'living-room');
        const rng = stableRng(gs.bb?.seasonSalt || 0, ctx.week?.num || 0, kind, `${salt}|${k}`);
        got = writeScene(scene, ctx, rng);
      } catch { return null; }
      if (!used.has(got.lineId)) break;
    }
    if (got?.lineId) used.add(got.lineId);
    return got ? got.lines : null;
  };
}

/** `part` with data the lines fill in ({group}). */
function partData(kind, who, data, ctx, house, salt) {
  try {
    const scene = makeScene(kind, who, data, house, 'living-room');
    const rng = stableRng(gs.bb?.seasonSalt || 0, ctx.week?.num || 0, kind, salt);
    return writeScene(scene, ctx, rng).lines;
  } catch { return null; }
}
const listOf = names => names.length <= 1 ? (names[0] || '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

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
    // the swipe screen speaks for the first three; the rest "swipe too" in one line
    entrants.slice(0, 3).forEach((n, i) => { const l = part('suiteact.enter', { a: n }, i ? 'next' : 'first', sctx, house, `enter|${n}`); if (l) suite.enter[n] = l; });
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

  // ── the Chain of Safety: every link, everybody passed over, the leftovers ──
  if (act.type === 'chain-of-safety') {
    const quebec = act.style === 'quebec';
    const runs = [{ start: null, links: {}, passed: {} }, { start: null, links: {}, passed: {} }];
    const key = (a, b) => `${a}>${b}`;
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const r = runs[b.run === 1 ? 1 : 0];
      const [a, x] = b.players || [];
      const salt = `chain|${b.run || 0}|${b.part}|${(b.players || []).join('|')}`;
      let lines = null;
      if (b.part === 'start') lines = r.start = part('chain.start', { a }, b.how || 'comp', ctx, house, salt);
      if (b.part === 'link') lines = r.links[key(a, x)] = fresh('chain.link', { a, b: x }, { ending: b.kind || 'mid' }, salt);
      if (b.part === 'passed') lines = r.passed[key(a, x)] = fresh('chain.passed', { a: x, b: a }, { ending: 'scene' }, salt);
      if (b.part === 'last') {
        const left = (b.players || []).slice(1);
        lines = r.last = quebec ? part('chain.last', { a, b: left[0] }, 'quebec', ctx, house, salt)
          : partData('chain.last', { a }, { ending: 'canada', group: listOf(left) }, ctx, house, salt);
      }
      if (b.part === 'leftover') {
        const left = b.players || [];
        lines = r.leftover = quebec ? part('chain.leftover', { a: left[0] }, 'quebec', ctx, house, salt)
          : partData('chain.leftover', { a: left[0] }, { ending: 'canada', group: listOf(left.slice(1)) }, ctx, house, salt);
      }
      if (b.part === 'final') lines = script.chainFinal = part('chain.final', { a }, 'scene', ctx, house, salt);
      if (b.part === 'noms' && a && x) lines = script.chainNoms = part('chain.noms', { a, b: x }, 'scene', ctx, house, salt);
      if (b.part === 'again') lines = script.chainAgain = part('chain.again', { a }, 'scene', ctx, house, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
    script.chain = quebec && act.secondChain ? runs : [runs[0]];
  }

  // ── the Hidden Power: the announcement, the searching, the find ──
  // Where somebody looked is said the way a houseguest says it ("the pantry").
  if (act.type === 'hidden-power') {
    const SPOT = { pantry: 'the pantry', 'have-not': 'the have-not room', diary: 'the Diary Room', 'hoh-bath': 'the HOH bathroom',
      storage: 'the storage room', yard: 'the backyard', laundry: 'the laundry room', memory: 'the memory wall' };
    const fresh = freshWriter(ctx, house);
    const others = house.filter(n => n && n !== hoh);
    for (const b of act.beats || []) {
      const [a, x] = b.players || [];
      const salt = `hunt|${b.part}|${(b.players || []).join('|')}`;
      let lines = null;
      if (b.part === 'announce' && others.length) {
        const voice = others[(Number(week?.num) || 0) % others.length];
        lines = fresh('hunt.announce', { a: voice }, { ending: 'scene' }, salt);
        if (lines) b.players = [voice];
      }
      if (b.part === 'search' && a) lines = fresh('hunt.search', { a }, { ending: 'scene', place: SPOT[b.place] || 'there' }, salt);
      if (b.part === 'seen' && a && x) lines = fresh('hunt.seen', { a, b: x }, { ending: 'scene' }, salt);
      if (b.part === 'spread' && a) lines = fresh('hunt.spread', { a }, { ending: 'scene' }, salt);
      if (b.part === 'found' && a) lines = fresh('hunt.found', { a }, { ending: 'scene', place: SPOT[b.place] || 'there', power: act.power || 'it' }, salt);
      if (b.part === 'near' && a) lines = fresh('hunt.near', { a }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Prizes and Punishments: every box opened, every swap ──
  if (act.type === 'prize-exchange') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const [a, x] = b.players || [];
      const salt = `px|${b.part}|${(b.players || []).join('|')}|${b.boxNo || ''}`;
      let lines = null;
      if (b.part === 'open' && a) lines = fresh('pxact.open', { a }, { ending: b.kind === 'punishment' ? 'punish' : b.kind, item: b.item }, salt);
      if (b.part === 'swap' && a && x) lines = fresh('pxact.swap', { a, b: x }, { ending: b.kind === 'veto' ? 'veto' : 'prize', item: b.item, gave: b.gave }, salt);
      if (b.part === 'robbed' && a && x) lines = fresh('pxact.robbed', { a, b: x }, { ending: 'scene' }, salt);
      if (b.part === 'soldout' && a) lines = fresh('pxact.soldout', { a }, { ending: 'scene', item: b.item }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Duo Week: the pairs, the week chained together, the partner who goes too ──
  if (['duo-week-open', 'duo-week-events', 'duo-week-eviction'].includes(act.type)) {
    const fresh = freshWriter(ctx, house);
    const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `duo|${act.type}|${b.part}|${b.kind || ''}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'pair' && p.length === 2) lines = fresh('duoact.pair', { a: p[0], b: p[1] }, { ending: b.mood || 'unsure' }, salt);
      if (b.part === 'hoh' && p[0]) lines = fresh('duoact.hoh', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'solo' && p[0]) lines = fresh('duoact.solo', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'event') {
        const k = b.kind;
        if (k === 'drag' && p.length >= 3) lines = fresh('duoact.event', { a: p[0], b: p[1] }, { ending: 'drag', target: p[2] }, salt);
        else if (k === 'pact' && p.length >= 4) lines = fresh('duoact.event', { a: p[0], b: p[2] }, { ending: 'pact' }, salt);
        else if (k === 'solo' && p[0]) lines = fresh('duoact.event', { a: p[0] }, { ending: 'solo' }, salt);
        else if (p.length >= 2) lines = fresh('duoact.event', { a: p[0], b: p[1] }, { ending: k === 'package' && b.free ? 'team' : k }, salt);
      }
      if (b.part === 'taken' && p.length === 2) lines = fresh('duoact.taken', { a: p[0], b: p[1] },
        { ending: b.gotNothing ? 'zero' : 'some', votes: WORDS[b.votes] || String(b.votes) }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Camp Comeback: evicted and kept, and the night the door opens ──
  if (act.type === 'camp-comeback' || act.type === 'camp-return') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `camp|${act.type}|${b.part}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'arrive' && p[0]) lines = fresh('campact.arrive', { a: p[0] },
        { ending: b.nth === 1 ? 'first' : b.nth >= (act.size || 4) ? 'last' : 'more' }, salt);
      // one voter speaks for the rest (a different one each week): they voted,
      // and they still have to see them. Not for the last camper, who plays
      // for the door the same night and never has a morning in camp.
      if (b.part === 'voters' && p.length >= 2 && !act.full) {
        const v = p[1 + ((act.week || 0) % (p.length - 1))];
        lines = fresh('campact.voters', { a: v, b: p[0] }, { ending: 'scene' }, salt);
      }
      if (b.part === 'open' && p.length) lines = fresh('campact.open', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'out' && p[0]) lines = fresh('campact.out', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'back' && p[0]) {
        lines = fresh('campact.back', { a: p[0] }, { ending: b.weeks ? 'long' : 'tonight' }, salt);
        if (p[1]) {
          const more = fresh('campact.enemy', { a: p[1], b: p[0] }, { ending: 'scene' }, `${salt}|enemy`);
          if (Array.isArray(lines) && Array.isArray(more)) lines = [...lines, ...more];
        }
      }
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Wildcard: three names from a hat, a puzzle, and an offer with a price ──
  if (act.type === 'wildcard') {
    const fresh = freshWriter(ctx, house);
    const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `wild|${b.part}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'drawn' && p[0]) lines = fresh('wildact.drawn', { a: p[0] }, { ending: b.first ? 'first' : 'next' }, salt);
      if (b.part === 'missed' && p[0]) lines = fresh('wildact.missed', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'played' && p[0]) lines = fresh('wildact.played', { a: p[0] }, { ending: b.place === 1 ? 'best' : 'rest' }, salt);
      if (b.part === 'took' && p[0]) lines = fresh('wildact.took', { a: p[0] }, { ending: b.houseWide ? 'house' : 'solo' }, salt);
      if (b.part === 'bill' && p.length === 2) lines = fresh('wildact.bill', { a: p[0], b: p[1] }, { ending: 'scene', count: WORDS[b.count] || String(b.count) }, salt);
      if (b.part === 'refused' && p[0]) lines = fresh('wildact.refused', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'blocked' && p[0]) lines = fresh('wildact.blocked', { a: p[0] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  for (const k of Object.keys(script)) {
    const v = script[k];
    if (!v || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete script[k];
  }
  return Object.keys(script).length ? script : null;
}
