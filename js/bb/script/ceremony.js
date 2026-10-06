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
import { gs, players, kinshipBetween, REL_KINSHIP } from '../../core.js';
import { getBond } from '../../bonds.js';
import { stableRng } from '../knowledge.js';
import { evictionSeatsAJuror } from '../jury.js';
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
      // every nominee past the two the speech is about gets a reason of their own
      script.nomThird = {};
      const named = new Set([b, c].filter(Boolean));
      for (const n of noms.filter(x => !named.has(x))) {
        const st = gs.bb?.stats?.[n] || {};
        const wins = (st.hohWins || 0) + (st.vetoWins || 0) + (st.blockBusterWins || 0);
        const end = week.safetyMode ? 'blockbuster' : close(n, hoh) ? 'close' : wins >= 2 ? 'threat' : getBond(hoh, n) <= -2 ? 'wary' : 'any';
        const lines = part('noms.third', { a: hoh, b: n }, end, { ...ctx, nominees: noms }, house, `third|${n}`);
        if (lines) script.nomThird[n] = lines;
      }
      for (const n of noms.filter(x => !spoke.has(x))) {
        // in a backdoor nobody on the block is the target: a friend sitting there was asked to (the
        // audit, 2026-10-06: a pawn nodded at the HOH, then told the Diary Room she was blindsided)
        const end = (n === act.pawn && !backdoor) || (backdoor && close(n, hoh)) ? 'pawn' : close(n, hoh) ? 'blindsided' : n === target ? 'target' : 'any';
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
    // Each voter's Diary Room vote, said the way that voter would say it: what is true of
    // them (they told the house otherwise, they are close to the one going, they cannot stand
    // them, they are protecting the one staying, they nearly went the other way), then the
    // formula. The user, 2026-10-06: "the vote is not really personalised".
    const fresh = freshWriter(ctx, house);
    const juryNight = evictionSeatsAJuror((week.houseAtStart || house || []).length);
    script.votes = {};
    for (const b of act.ballots || []) {
      if (!b || !b.voter || !b.evict) continue;
      const kept = (act.nominees || []).find(n => n !== b.evict) || null;
      const told = b.stated && b.stated !== b.evict;
      // a flip is telling the house one name and writing another; wanting somebody else and
      // voting with your people anyway is a different vote, and says so
      const withBloc = b.preference && b.preference !== b.evict && !told;
      const kind = told ? 'flip' : withBloc ? 'bloc'
        : getBond(b.voter, b.evict) >= 3 ? 'friend'
          : getBond(b.voter, b.evict) <= -2 ? 'enemy'
            : kept && getBond(b.voter, kept) >= 3.5 ? 'loyal'
              : Math.abs(Number(b.margin) || 0) < 0.6 ? 'hard' : 'plain';
      // c is always the nominee who stays (a three-way vote names the strongest of the others)
      const who = { a: b.voter, b: b.evict, c: kept || b.evict };
      // on a night that seats a juror, about half the voters say so
      const jh = [...b.voter].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, week.num || 0);
      const lines = (juryNight && jh % 2 ? fresh('evict.vote', who, { ending: `${kind}jury` }, `vote|${b.voter}|j`) : null)
        || fresh('evict.vote', who, { ending: kind }, `vote|${b.voter}`) || fresh('evict.vote', who, { ending: 'plain' }, `vote|${b.voter}|p`);
      if (lines?.length) script.votes[b.voter] = lines;
    }
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

  // ── The Secret Power Competition: the doors in the yard ──
  if (act.type === 'secret-power-comp') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `sp|${b.part}|${b.door || ''}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'open' && p[0]) lines = fresh('spact.open', { a: p[(act.week || 0) % p.length] }, { ending: 'scene' }, salt);
      if (b.part === 'barred' && p[0]) lines = fresh('spact.barred', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'won' && p[0]) lines = fresh('spact.won', { a: p[0] }, { ending: b.rivals ? 'beat' : 'alone' }, salt);
      if (b.part === 'price' && p[0]) lines = fresh('spact.price', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'handed' && p[0]) lines = fresh('spact.handed', { a: p[0] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Time Capsule: America's favourite, alone in a room ──
  if (act.type === 'time-capsule') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `cap|${b.part}|${b.index || ''}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'entry' && p[0]) lines = fresh('capact.entry', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'stage' && p[0]) lines = fresh('capact.stage', { a: p[0] }, { ending: b.grade || 'near' }, salt);
      if (b.part === 'won' && p[0]) lines = fresh('capact.won', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'lost' && p[0]) lines = fresh('capact.lost', { a: p[0] }, { ending: b.costume ? 'costume' : 'slop' }, salt);
      if (b.part === 'tether' && p.length === 2) lines = fresh('capact.tether', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Interrogation (and the Deepfake): a stolen Head of Household ──
  if (act.type === 'interrogation') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `int|${b.part}|${b.kind || ''}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'dethroned' && p[0]) lines = fresh('intact.dethroned', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'room' && p.length === 2) {
        const named = ['tells', 'covers', 'reads', 'guesses'].includes(b.kind) && b.points;
        const ending = b.kind === 'denies' ? (b.points ? 'denies' : 'deniesplain') : named ? b.kind : 'silent';
        lines = fresh('intact.room', { a: p[0], b: p[1] }, { ending, who: b.points || '' }, salt);
      }
      if (b.part === 'name' && p[0]) lines = fresh('intact.name', { a: p[0] }, { ending: b.accused ? 'named' : 'none', who: b.accused || '' }, salt);
      if (b.part === 'caught' && p.length === 2) lines = fresh('intact.caught', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (b.part === 'wrong') lines = b.accused && p.length === 2
        ? fresh('intact.wrong', { a: p[0], b: p[1] }, { ending: 'named' }, salt)
        : fresh('intact.wrong', { a: p[0] }, { ending: 'none' }, salt);
      if (b.part === 'deepfake' && p.length === 2) lines = fresh('intact.deepfake', { a: p[1], b: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'ally' && p.length === 2) lines = fresh('intact.ally', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Whacktivity: three doors, one opens ──
  if (act.type === 'whacktivity') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `wh|${b.part}|${b.powerId || ''}|${p.join('|')}`;
      const who = p[(act.week || 0) % Math.max(1, p.length)];
      let lines = null;
      if (b.part === 'picked' && p[0]) lines = fresh('whact.picked', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'crowded' && who) lines = fresh('whact.crowded', { a: who }, { ending: 'scene' }, salt);
      if (b.part === 'alone' && p[0]) lines = fresh('whact.alone', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'shut' && who) lines = fresh('whact.shut', { a: who }, { ending: 'scene' }, salt);
      if (b.part === 'won' && p[0]) lines = fresh('whact.won', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'missed' && p[0]) lines = fresh('whact.missed', { a: p[0] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Move-in day: each houseguest walks in, in their own voice ──
  if (act.type === 'move-in') {
    const fresh = freshWriter(ctx, house);
    const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat', 'floater'];
    const archOf = n => { try { return (players || []).find(p => p.name === n)?.archetype; } catch { return null; } };
    const arrived = [];
    for (const b of act.beats || []) {
      const a = (b.players || [])[0];
      if (!a) continue;
      const arch = archOf(a) || 'floater';
      let lines = fresh('moveinact.arrive', { a }, { ending: arch }, `mi|${a}`)
        || fresh('moveinact.arrive', { a }, { ending: 'floater' }, `mi|${a}|f`);
      // Somebody already inside they knew before the show (the cast's kinship: a couple, a
      // sibling, an old friend, an ex). That is the first thing the viewer needs to know about
      // them, or a kiss on the first night is two strangers kissing.
      const known = arrived.find(o => (REL_KINSHIP[kinshipBetween(a, o)]?.group || '') !== '');
      if (known) {
        const kin = kinshipBetween(a, known);
        const more = fresh('moveinact.known', { a, b: known }, { ending: kin }, `mi|known|${a}`)
          || fresh('moveinact.known', { a, b: known }, { ending: REL_KINSHIP[kin].group.toLowerCase() }, `mi|known|${a}|g`);
        if (Array.isArray(lines) && Array.isArray(more)) lines = [...lines, ...more];
        b.knew = known; b.kin = kin;
      } else if (arrived.length && b.order % 3 === 2) {
        // every third arrival has a first impression of somebody already inside
        // somebody who walked in just before them: the people you meet first are the ones near the door
        const other = arrived[Math.max(0, arrived.length - 1 - (b.order % 2))];
        const tone = NICE.includes(arch) ? 'warm' : 'wary';
        const more = fresh('moveinact.meet', { a, b: other }, { ending: tone }, `mi|meet|${a}`);
        if (Array.isArray(lines) && Array.isArray(more)) lines = [...lines, ...more];
        b.met = other;
      }
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
      arrived.push(a);
    }
    // Move-in night as the live show runs it: groups of about four meet the host on the stage,
    // each says a few words, and the group goes through the front door together. The words
    // for the stage and the walk-in ride on the act (the viewer and the transcript read them).
    const VOICE = { mastermind: 'player', schemer: 'player', villain: 'player', 'perceptive-player': 'player',
      hothead: 'fighter', 'challenge-beast': 'fighter', wildcard: 'fighter', 'chaos-agent': 'fighter',
      hero: 'heart', 'loyal-soldier': 'heart', 'social-butterfly': 'heart', showmancer: 'heart',
      floater: 'quiet', underdog: 'quiet', goat: 'quiet' };
    const names = (act.beats || []).map(b => (b.players || [])[0]).filter(Boolean);
    const k = Math.max(1, Math.round(names.length / 4));
    const groups = [];
    for (let g = 0, at = 0; g < k; g++) { const size = Math.floor(names.length / k) + (g < names.length % k ? 1 : 0); groups.push(names.slice(at, at + size)); at += size; }
    act.groups = groups;
    for (const b of act.beats || []) {
      const a = (b.players || [])[0];
      if (!a) continue;
      const st = fresh('moveinact.stage', { a }, { ending: VOICE[archOf(a)] || 'quiet' }, `stage|${a}`);
      if (Array.isArray(st) && st.length) b.stageLines = st;
    }
    const inside = [];
    act.groupLines = groups.map((g, gi) => {
      let out = null;
      if (g.length >= 3) {
        const greeter = inside.length ? inside[(gi * 3) % inside.length] : null;
        out = greeter ? fresh('moveinact.group', { a: g[0], b: g[1], c: greeter }, { ending: 'next' }, `group|${gi}`)
          : fresh('moveinact.group', { a: g[0], b: g[1], c: g[2] }, { ending: 'first' }, `group|${gi}`);
      }
      inside.push(...g);
      return Array.isArray(out) ? out : null;
    });
  }

  // ── The Rewind, and the White Locust's call-out chain ──
  if (act.type === 'rewind') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      let lines = null;
      if (b.part === 'stop' && p[0]) lines = fresh('rwact.stop', { a: p[0] }, { ending: 'scene' }, 'rw|stop');
      if (b.part === 'erased' && p.length >= 2) lines = fresh('rwact.erased', { a: p[0], b: p[1] }, { ending: 'scene' }, 'rw|erased');
      if (b.part === 'everybody' && p[0]) lines = fresh('rwact.everybody', { a: p[0] }, { ending: 'scene' }, 'rw|everybody');
      if (b.part === 'public' && p.length >= 2) lines = fresh('rwact.public', { a: p[0], b: p[1] }, { ending: 'scene' }, 'rw|public');
      if (b.part === 'rest' && p[0]) lines = fresh('rwact.rest', { a: p[0] }, { ending: 'scene' }, 'rw|rest');
      if (b.part === 'theirs' && p.length >= 2) lines = fresh('rwact.theirs', { a: p[0], b: p[1] }, { ending: 'scene' }, 'rw|theirs');
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }
  if (act.type === 'white-locust') {
    const fresh = freshWriter(ctx, house);
    for (const r of act.rounds || []) {
      if (r.caller) r.callLines = fresh('rwact.call', { a: r.caller, b: r.target }, { ending: r.betrayal ? 'ally' : 'plain' }, `wl|call|${r.target}`) || undefined;
      if (!r.sweep) r.endLines = fresh(r.made ? 'rwact.made' : 'rwact.failed', { a: r.target }, { ending: 'scene' }, `wl|end|${r.target}`) || undefined;
    }
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const lines = b.part === 'out' && p[0] ? fresh('rwact.out', { a: p[0] }, { ending: 'scene' }, 'wl|out') : null;
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── No Eviction, and Dead Last ──
  if (act.type === 'no-eviction' || act.type === 'dead-last') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      let lines = null;
      if (b.part === 'none' && p[0]) lines = fresh('quietact.none', { a: p[(act.week || 0) % p.length] || p[0] }, { ending: 'scene' }, 'q|none');
      if (b.part === 'idle' && p[0]) lines = fresh('quietact.idle', { a: p[0] }, { ending: 'scene' }, 'q|idle');
      if (b.part === 'last' && p[0]) lines = fresh('quietact.last', { a: p[0] }, { ending: b.threw ? 'threw' : 'plain' }, 'q|last');
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Halting Hex: an eviction cancelled after the vote ──
  if (act.type === 'halting-hex') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      let lines = null;
      if (b.part === 'stop') lines = act.selfSave ? fresh('hexact.stop', { a: act.holder }, { ending: 'self' }, 'hex|stop')
        : fresh('hexact.stop', { a: act.holder, b: act.spared }, { ending: 'other' }, 'hex|stop');
      if (b.part === 'after' && p[0]) lines = fresh('hexact.after', { a: p[0] }, { ending: 'scene' }, 'hex|after');
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Premiere night: two hunts for the host and the relic ──
  if (act.type === 'premiere-mystery') {
    const fresh = freshWriter(ctx, house);
    for (const h of act.hunts || []) {
      // A searcher's first warm lead is worth hearing; their third is not, and
      // a hunt of seven people would otherwise talk over itself.
      const voiced = new Set();
      for (const r of h.rounds || []) {
        if (r.outcome === 'warm' && (voiced.has(r.who) || voiced.size >= 3)) continue;
        if (r.outcome === 'warm') voiced.add(r.who);
        if (r.outcome === 'warm') r.lines = fresh('pmact.warm', { a: r.who }, { ending: 'scene', room: r.room }, `pm|warm|${r.round}|${r.who}`) || undefined;
        if (r.outcome === 'found') r.lines = fresh('pmact.found', { a: r.who }, { ending: h.target === 'the relic' ? 'relic' : 'host' }, `pm|found|${r.who}`) || undefined;
      }
      for (const e of h.events || []) {
        const [a, b] = e.players || [];
        if (a && b) e.lines = fresh(`pmact.${e.kind}`, { a, b }, { ending: 'scene', room: e.room || '' }, `pm|${e.kind}|${a}|${b}`) || undefined;
      }
    }
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      let lines = null;
      if (b.part === 'night' && p.length >= 2) lines = fresh('pmact.night', { a: p[0], b: p[1] }, { ending: 'scene' }, `pm|night`);
      if (b.part === 'secret' && p[0]) lines = fresh('pmact.secret', { a: p[0] }, { ending: 'scene' }, `pm|secret`);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Mystery Competitor, the Mystery Veto, and its second ceremony ──
  if (['mystery-competitor', 'mystery-guest-result', 'mystery-veto', 'second-veto-ceremony'].includes(act.type)) {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `mv|${act.type}|${b.part}|${p.join('|')}`;
      let lines = null;
      // the holder speaks first in the announce beat's players; the guest elsewhere
      if (b.part === 'announce' && p[0]) lines = fresh('mvact.announce', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'door' && p[0]) lines = fresh('mvact.door', { a: p[0] }, { ending: b.visiting ? 'visiting' : 'native' }, salt);
      if (['bumped', 'handoff', 'guestwon', 'guestlost'].includes(b.part) && p.length >= 2) lines = fresh(`mvact.${b.part}`, { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (['diary', 'stranger', 'goodbye', 'second', 'alone', 'pair', 'empty'].includes(b.part) && p[0]) lines = fresh(`mvact.${b.part}`, { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'solowon' || b.part === 'sololost') lines = fresh('mvact.solo', { a: p[0] }, { ending: b.part === 'solowon' ? 'won' : 'lost' }, salt);
      if (b.part === 'called' && p[0]) lines = fresh('mvact.called', { a: p[(act.week || 0) % p.length] }, { ending: 'scene' }, salt);
      if (b.part === 'used' && p[0]) lines = p.length >= 2 ? fresh('mvact.used', { a: p[0], b: p[1] }, { ending: 'other' }, salt) : fresh('mvact.used', { a: p[0] }, { ending: 'self' }, salt);
      if (b.part === 'chair' && p.length >= 2) lines = fresh('mvact.chair', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Team America: a secret team, a mission a week ──
  if (act.type === 'team-america') {
    const fresh = freshWriter(ctx, house);
    // Who plays which seat in each effect, by the order the engine cast it.
    const SEATS = {
      rumour: p => ({ a: p[2] || p[0], b: p[0], c: p[1] }), saboteur: p => ({ a: p[0], b: p[1] }),
      block: p => ({ a: p[0], b: p[1], c: p[2] || p[1] }), argument: p => ({ a: p[0], b: p[1] }),
      costume: p => ({ a: p[0], b: p[1] }), meeting: p => ({ a: p[0], b: p[1], c: p[2] || p[1] }),
      expose: p => ({ a: p[0], b: p[1], c: p[2] || p[1] }), deal: p => ({ a: p[0], b: p[1] }),
    };
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `ta|${b.part}|${b.kind || ''}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'opening' && p.length >= 3) lines = fresh('teamact.opening', { a: p[0], b: p[1], c: p[2] }, { ending: 'scene' }, salt);
      if (b.part === 'mission' && p[0]) lines = fresh('teamact.mission', { a: p[(act.week || 0) % p.length] }, { ending: 'scene' }, salt);
      if (b.part === 'done' && p[0]) lines = fresh('teamact.done', { a: p[0], b: p[1] || p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'failed' && p[0]) lines = fresh('teamact.failed', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'noticed' && p[0]) lines = fresh('teamact.noticed', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'effect' && SEATS[b.kind] && p.length >= 2) lines = fresh('teamact.effect', SEATS[b.kind](p), { ending: b.kind }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── Battle Back (and the door a Bonus Life opens) ──
  if (act.type === 'battle-back' || act.type === 'bonus-life') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `bk|${b.part}|${b.label || ''}|${p.join('|')}`;
      let lines = null;
      if (['open', 'heat', 'out'].includes(b.part) && p[0]) lines = fresh(`bkact.${b.part}`, { a: p[0] }, { ending: 'scene' }, salt);
      if (['duel', 'champion', 'held'].includes(b.part) && p.length >= 2) lines = fresh(`bkact.${b.part}`, { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (b.part === 'back' && p[0]) lines = fresh('bkact.back', { a: p[0] }, { ending: b.against ? 'voted' : 'clean' }, salt);
      if (['auto', 'self', 'reentry', 'won', 'lost'].includes(b.part) && p[0]) lines = fresh(`blact.${b.part}`, { a: p[0] }, { ending: 'scene' }, salt);
      if ((b.part === 'hoard' || b.part === 'ally') && p.length >= 2) lines = fresh(`blact.${b.part}`, { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Nightmare Power: a ceremony undone at three in the morning ──
  if (act.type === 'nightmare-power') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `nm|${b.part}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'woken' && p[0]) lines = fresh('nmact.woken', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'voided' && p.length === 2) lines = fresh('nmact.voided', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if ((b.part === 'redone' || b.part === 'blamed') && p.length === 3) lines = fresh(`nmact.${b.part}`, { a: p[0], b: p[1], c: p[2] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Den of Temptation, and the curse it leaves ──
  if (act.type === 'temptation' || act.type === 'temptation-curse') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `tp|${b.part}|${p.join('|')}`;
      let lines = null;
      if (['offer', 'accepted', 'declined', 'cursed', 'missed'].includes(b.part) && p[0]) lines = fresh(`tempact.${b.part}`, { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'suspect' && p.length === 2) lines = fresh('tempact.suspect', { a: p[0], b: p[1] }, { ending: b.correct ? 'right' : 'wrong' }, salt);
      if (b.part === 'reads' && p.length === 3) lines = fresh('tempact.reads', { a: p[0], b: p[1], c: p[2] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The second veto: a meeting that ends twice ──
  if (act.type === 'second-veto') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `v2|${b.part}|${p.join('|')}`;
      const anon = act.anonymous;
      let lines = null;
      if (b.part === 'still' && p[0]) lines = fresh('secact.still', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'kept' && p[0]) lines = fresh('secact.kept', { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'stand' && p[0]) lines = fresh('secact.stand', { a: p[0] }, { ending: anon ? 'anon' : 'public' }, salt);
      if (b.part === 'used' && p.length >= 2) lines = fresh('secact.used', { a: p[0], b: p[1] }, { ending: anon ? 'anon' : b.hidden ? 'found' : 'public' }, salt);
      if (b.part === 'used' && p.length === 1) lines = fresh('secact.used', { a: p[0] }, { ending: anon ? 'selfanon' : 'self' }, salt);
      if (b.part === 'chair' && p.length >= 2) lines = fresh('secact.chair', { a: p[0], b: p[1] }, { ending: b.byHoh ? 'hoh' : 'holder' }, salt);
      if (b.part === 'cost' && p.length >= 2) lines = fresh('secact.cost', { a: p[0], b: p[1] }, { ending: anon ? 'anon' : 'public' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── The Coin of Destiny: pay in, play, call it in private ──
  if (act.type === 'coin-of-destiny') {
    const fresh = freshWriter(ctx, house);
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `coin|${b.part}|${p.join('|')}`;
      let lines = null;
      if (['buyin', 'declined', 'short', 'empty', 'holds', 'wrong'].includes(b.part) && p[0]) lines = fresh(`coinact.${b.part}`, { a: p[0] }, { ending: 'scene' }, salt);
      if (b.part === 'rewritten' && p.length >= 3) lines = fresh('coinact.rewritten', { a: p[0], b: p[2] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── A power, played in front of the house ──
  if (act.type === 'power-played') {
    const fresh = freshWriter(ctx, house);
    const OFFERS = ['target', 'vote', 'safety', 'plea', 'loyalty'];
    for (const b of act.beats || []) {
      const p = (b.players || []).filter(Boolean);
      const salt = `pw|${act.powerId}|${b.part}|${p.join('|')}`;
      let lines = null;
      if (b.part === 'lobby' && p.length >= 2) lines = fresh('pwact.lobby', { a: p[0], b: p[1] }, { ending: b.won ? (OFFERS.includes(b.offer) ? b.offer : 'loyalty') : 'no' }, salt);
      if (b.part === 'broken' && p.length >= 2) lines = fresh('pwact.broken', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (b.part === 'relic' && p[0]) lines = fresh('pwact.relic', { a: p[0] }, { ending: b.self ? 'self' : 'notself' }, salt);
      if (b.part === 'cloud' && p.length >= 2) lines = fresh('pwact.cloud', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (b.part === 'buyoff' && p.length >= 2) lines = fresh('pwact.buyoff', { a: p[0], b: p[1] }, { ending: 'scene', who: b.who || '' }, salt);
      if (b.part === 'coup' && p.length >= 2) lines = fresh('pwact.coup', { a: p[0], b: p[1] }, { ending: 'scene' }, salt);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  // ── A power that was never played (a note to the viewer) ──
  if (act.type === 'power-expired') {
    const fresh = freshWriter(ctx, house);
    // Words for the first three; a night that bins eight powers is a list, not eight speeches.
    for (const b of (act.beats || []).slice(0, 3)) {
      const a = (b.players || [])[0];
      if (!a || !b.part) continue;
      const lines = fresh('expact.gone', { a }, { ending: b.part === 'evicted' ? 'evicted' : 'expired' }, `exp|${a}|${b.power || ''}`);
      if (Array.isArray(lines) && lines.length) { b.lines = lines; b.text = transcript(lines); }
    }
  }

  for (const k of Object.keys(script)) {
    const v = script[k];
    if (!v || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete script[k];
  }
  // Where the people at this ceremony stood with each other AT the ceremony, for the viewer's
  // side panel (vp-bb-ep/steps.js). Read live when the screen is drawn, a replayed week 1
  // showed week 5's bonds. Only the pairs the panel names, rounded.
  {
    const pairs = [];
    const add = (x, y) => { if (x && y && x !== y) pairs.push([x, y]); };
    if (act.type === 'nominations') for (const n of act.nominees || []) add(act.hoh || hoh, n);
    if (act.type === 'veto') { const w = act.vetoHolder || act.winner; for (const n of act.blockAtDraw || nominees) add(w, n); }
    if (act.type === 'veto-ceremony') { const h = act.holder; for (const n of nominees) add(h, n); if (act.saved) add(h, act.saved); add(h, hoh); }
    // on the act, not the script: a script is lines and only lines
    if (pairs.length) act.bondsAt = Object.fromEntries(pairs.map(([x, y]) => [`${x}|${y}`, Math.round(getBond(x, y))]));
  }
  return Object.keys(script).length ? script : null;
}
