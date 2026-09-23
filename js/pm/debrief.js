// ══════════════════════════════════════════════════════════════════════
// pm/debrief.js — the boys' chat and the girls' chat, after a big night
// ══════════════════════════════════════════════════════════════════════
//
// User: "do we have debrief every episode or only when something happens?"
// → after every night something happened: a recoupling, a dumping, a
// bombshell, Casa Amor. Not on a quiet day. The talk is about what just
// happened, read off the villa before and after the night's moment:
//
//   robbed        [a, b, c]  a's partner was stolen by c
//   stole         [a, b, c]  a did the stealing, from c; b judges it
//   twisted-on    [a, b, c]  a stuck at Casa; c, the partner, came back with someone
//   twisted       [a, b, c]  a came back with someone new; c is who a left
//   miss          [a, b, c]  c has just gone home; a was c's partner or friend
//   blame         [a, b, c]  c voted a's partner or friend out
//   next          [a, b]     a thinks they are next
//   eyeing        [a, b, c]  a's partner could not stop looking at bombshell c
//   bomb-fancy    [a, b, c]  a fancies bombshell c
//   bomb-threat   [a, b, c]  bombshell c has come in for a's partner
//   picked        [a, b]     a got who they wanted
//   meh           [a, b]     a is not feeling the one they are coupled with
//
// b is a's closest friend on the same side, and never the same listener
// twice in one night. Every scene moves something (bonds, jealousy, stress),
// and a feeling said out loud about a partner is a SECRET with a witness
// (`said`): the gossip system can carry it back — "I heard what you said on
// the terrace" (lines/day/gossip heard entries).
import { addBond, getBond } from '../bonds.js';
import { makeEvent, partnerOf } from './events.js';
import { attr, nudgeAttraction } from './chemistry.js';
import { feel, jealousOf } from './emotions.js';

const SKIP = new Set(['first-coupling', 'final', 'reunion']);
const MAX_PER_SIDE = 3;

const pairsOf = cs => new Set(cs.map(c => [...c].sort().join('+')));

/**
 * The night's debrief scenes. `pre` is the villa just before the moment
 * ({ villa, couples }); `m` is what the moment returned (events, ballots).
 */
export function nightDebrief(state, rng, entry, pre, m) {
  if (SKIP.has(entry.moment) || state.split) return [];
  const g = n => state.profiles[n]?.gender;
  const here = n => state.villa.includes(n);
  const events = m.events || [];
  const cands = [];
  const add = (prio, of, a, c = null) => { if (a && here(a)) cands.push({ prio, of, a, c }); };
  const partnerBefore = n => pre.couples.find(p => p.includes(n))?.find(x => x !== n) || null;

  // Steals: a recoupling pick, or a bombshell's.
  for (const e of events) {
    if (e.kind === 'recouple-pick' && e.extra?.stole) { add(1, 'robbed', e.players[2], e.players[0]); add(2, 'stole', e.players[0], e.players[2]); }
    if (e.kind === 'steal') { add(1, 'robbed', e.players[2], e.players[0]); add(2, 'stole', e.players[0], e.players[2]); }
    // Casa Amor: who came back with somebody, and who was left.
    if (e.kind === 'casa-return' && e.extra?.choice === 'twist') {
      const left = partnerBefore(e.players[0]);
      if (left) add(1, 'twisted-on', left, e.players[0]);
      add(3, 'twisted', e.players[0], left);
    }
  }
  // Who went home, missed by their partner or best friend — and blamed on a voter.
  const gone = pre.villa.filter(n => !here(n));
  for (const d of gone) {
    const mourner = (here(partnerBefore(d)) && partnerBefore(d))
      || state.villa.filter(n => g(n) === g(d)).sort((x, y) => getBond(d, y) - getBond(d, x))[0];
    add(2, 'miss', mourner, d);
    const voter = (m.ballots || []).find(b => !b.save && (b.target === d || b.couple?.includes(d)) && here(b.voter))?.voter;
    if (voter && mourner && voter !== mourner) add(3, 'blame', mourner, voter);
  }
  if (gone.length) {
    const nervy = state.villa.filter(n => !partnerOf(state, n) || (state.ledger?.approval?.[n] ?? 0) < -10);
    add(5, 'next', nervy[Math.floor(rng() * nervy.length)]);
  }
  // A bombshell walked in tonight.
  const arrived = state.villa.filter(n => !pre.villa.includes(n));
  for (const x of arrived) {
    const stare = events.find(e => e.kind === 'bombshell-react' && e.extra?.of === 'stunned' && e.players[1] === x);
    const watcher = stare?.players[2];
    if (watcher && here(watcher)) add(1, 'eyeing', watcher, x);
    const targets = state.profiles[x]?.eyesOnResolved || [];
    const worried = targets.map(t => partnerOf(state, t)).find(p => p && p !== x && p !== watcher);
    if (worried) add(2, 'bomb-threat', worried, x);
    const fan = state.villa.filter(n => n !== x && n !== watcher && partnerOf(state, n) !== x && attr(state, n, x) != null)
      .sort((p, q) => attr(state, q, x) - attr(state, p, x))[0];
    if (fan && (attr(state, fan, x) ?? 0) >= 5) add(3, 'bomb-fancy', fan, x);
  }
  // A recoupling with no steal is still a night: who got what they wanted.
  if (entry.moment === 'recoupling' || entry.moment === 'semi-final' || events.some(e => e.kind === 'recouple-pick')) {
    const changed = state.couples.filter(c => !pairsOf(pre.couples).has([...c].sort().join('+')));
    for (const [p, q] of changed) for (const a of [p, q]) {
      const pa = partnerOf(state, a);
      add(4, (attr(state, a, pa) ?? 0) >= 5 ? 'picked' : 'meh', a);
    }
  }
  if (!cands.length) return [];

  // One scene per speaker, the most dramatic first, a few per side.
  cands.sort((x, y) => x.prio - y.prio || rng() - 0.5);
  const spoke = new Set(), heard = new Set(), perSide = {};
  const out = [];
  for (const c of cands) {
    if (spoke.has(c.a) || (perSide[g(c.a)] || 0) >= MAX_PER_SIDE) continue;
    const friends = state.villa.filter(n => n !== c.a && n !== c.c && g(n) === g(c.a) && partnerOf(state, c.a) !== n)
      .sort((x, y) => getBond(c.a, y) - getBond(c.a, x));
    const b = friends.find(n => !heard.has(n)) || friends[0];
    if (!b) continue;
    spoke.add(c.a); heard.add(b); perSide[g(c.a)] = (perSide[g(c.a)] || 0) + 1;
    out.push({ ...c, b });
  }
  // The side that has most to say goes first; the boys' terrace and the girls'
  // dressing room each keep their scenes together.
  out.sort((x, y) => (g(x.a) === g(y.a) ? x.prio - y.prio : g(x.a) === 'm' ? -1 : 1));
  return out.map(({ of, a, b, c }) => scene(state, rng, of, a, b, c));
}

function scene(state, rng, of, a, b, c) {
  const pa = partnerOf(state, a);
  const where = state.profiles[a]?.gender === 'm' ? 'terrace' : 'dressing-room';
  const pop = { [a]: { approval: 0.2, fame: 1 }, [b]: { approval: 0.1, fame: 0.5 } };
  const major = [];
  addBond(a, b, 0.4);                 // somebody listened
  // …and being heard helps: a debrief is support before it is anything else.
  // (Stress alone, measured: walkouts 29 → 34 per 100 seasons, four-couple
  // finals 99% → 95%.) The night's own blow still lands on top of it.
  feel(state, a, 'stress', -0.6);
  if (['robbed', 'twisted-on', 'miss'].includes(of)) feel(state, a, 'heartbreak', -0.5);
  switch (of) {
    case 'robbed': addBond(a, c, -1.0); addBond(b, c, -0.5); feel(state, a, 'stress', 0.6); break;
    case 'stole': {
      // b's verdict on the thief is b's own loyalties, in proportion.
      const side = getBond(b, c) - getBond(b, a);
      addBond(b, a, side > 0 ? -0.5 : 0.2);
      break;
    }
    case 'twisted-on': addBond(b, c, -0.6); feel(state, a, 'stress', 0.8); break;
    case 'twisted': addBond(b, a, (getBond(b, c) > getBond(b, a) ? -0.5 : 0.1)); break;
    case 'miss': feel(state, a, 'stress', 0.4); break;
    case 'blame': addBond(a, c, -0.9); addBond(b, c, -0.3); major.push(a); break;
    case 'next': feel(state, a, 'stress', 0.7); break;
    case 'eyeing': if (pa) jealousOf(state, a, c, 1.0); break;
    case 'bomb-threat': feel(state, a, 'stress', 0.6); if (pa) jealousOf(state, a, c, 0.8); break;
    case 'bomb-fancy': nudgeAttraction(state, a, c, 0.3); break;
    case 'meh': feel(state, a, 'stress', 0.3); break;
    default: break;
  }
  // Said out loud about a partner, in front of a witness: it can travel.
  if (pa && (of === 'meh' || of === 'bomb-fancy')) {
    state.secrets.push({ id: `sec${state.secrets.length + 1}`, who: a, partner: pa, with: of === 'bomb-fancy' ? c : null,
      severity: 0.6, ep: state.ep, witnesses: [b], known: false, said: true, casa: false });
  }
  const players = c && ['robbed', 'stole', 'twisted-on', 'twisted', 'miss', 'blame', 'eyeing', 'bomb-fancy', 'bomb-threat'].includes(of) ? [a, b, c] : [a, b];
  return makeEvent(state, rng, { phase: 'debrief', kind: 'debrief', players, aired: true, major,
    extra: { of, where, pop } });
}
