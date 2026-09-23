// ══════════════════════════════════════════════════════════════════════
// pm/exes.js — after a break-up: the apology, and the second chance
// ══════════════════════════════════════════════════════════════════════
//
// User: "even after a break-up there's a possibility of getting back together
// — how sorry y is, how in love x is, other stats, even random things — and
// these actions can tank or save their popularity". The real show does it
// (UK 10: Jess and Sammy, back together after Casa Amor).
//
// A break-up is recorded where it happens (Movie Night, the photos, a Casa
// twist): `ender` ended it, `wrong` did the thing. While both are in the villa
// and single, the one who did it may come and say sorry — how sorry is their
// guilt, their loyalty and what they still feel — and the one who ended it
// decides: how in love they still are, how much they trust, how bad it was,
// how sincere that sounded, and a little luck. Twice refused, it is over.
//
//   apology           [a, b]  a (who did it) says sorry to b. `of`: sincere · half
//   reunite           [a, b]  b takes a back
//   apology-rejected  [a, b]  b says no
//
// The public is watching both of them: taking back somebody it can't stand
// costs you (the villa's "mug"), a sincere apology earns a little back, and a
// half-hearted one costs the one who gave it.
import { addBond } from '../bonds.js';
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf } from './events.js';
import { romance } from './feelings.js';
import { emo, feel, breakHeart } from './emotions.js';

const MAX_REFUSALS = 2;

/** Note a break-up where it happens. */
export function noteBreakup(state, { ender, wrong, severity = 1, cause }) {
  (state.breakups ||= []).push({ ender, wrong, severity, cause, ep: state.ep, refused: 0, closed: false });
}

/** The day's second chances: at most one apology an episode per broken couple. */
export function secondChances(state, rng, entry = null) {
  const out = [];
  // Not after the final's vote is counted, nor at the reunion: an approval
  // swing there lands on a row with no moment to explain it (audit JUMP).
  if (entry && (entry.moment === 'final' || entry.moment === 'reunion')) return out;
  const here = n => state.villa.includes(n);
  for (const br of state.breakups || []) {
    if (br.closed || br.ep === state.ep) continue;
    const { ender: b, wrong: a } = br;
    if (!here(a) || !here(b)) { br.closed = true; continue; }
    // The one who did it may have moved on (a Casa twist) and still come back
    // for them (UK 10's Sammy did); the one hurt only listens if they are not
    // happier with somebody new.
    const pb = partnerOf(state, b), pa = partnerOf(state, a);
    if (pb === a) { br.closed = true; continue; }
    if (pb && romance(b, pb) >= romance(b, a)) continue;
    if (pa && romance(a, pa) >= romance(a, b)) continue;
    const S = state.profiles[a]?.stats || {};
    // How sorry: guilt, loyalty and what they still feel — in proportion.
    const sorry = Math.max(0, Math.min(1, (emo(state, a).guilt / 10 + (S.loyalty ?? 5) / 10 + romance(a, b) / 10) / 3));
    if (rng() > 0.2 + 0.5 * sorry) continue;             // not today
    const sincere = rng() < sorry;
    out.push(makeEvent(state, rng, { phase: 'evening', kind: 'apology', players: [a, b], aired: true,
      extra: { of: sincere ? 'sincere' : 'half', pop: { [a]: { approval: sincere ? 1.2 : -0.8, fame: 1.5 } } } }));
    // The decision: love against trust and the size of it, plus luck.
    const love = romance(b, a) / 10;
    const trust = (getRelationshipDimension(b, a, 'trust') ?? 0) / 10;
    const temper = (state.profiles[b]?.stats?.temperament ?? 5) / 10;
    const pBack = Math.max(0.02, Math.min(0.85,
      // (Measured: with 0.08 base and 0.22 per unit of severity, 20 apologies
      // in 20 seasons, none taken — the betrayal had already pulled love and
      // trust down, and the severity counted it twice.)
      0.15 + 0.6 * love + 0.15 * trust + (sincere ? 0.2 : -0.1) - 0.12 * br.severity + 0.1 * temper + (rng() - 0.5) * 0.2));
    if (rng() < pBack) {
      // Whoever they were with is left single — and heartbroken.
      const left = [pa, pb].filter(Boolean);
      state.couples = state.couples.filter(c => !c.includes(a) && !c.includes(b));
      for (const n of left) { const was = n === pa ? a : b; breakHeart(state, n, was, 4 * romance(n, was) / 10); }
      state.couples.push([b, a]);
      br.closed = true;
      addBond(a, b, 1.0); addRelationshipDimension(b, a, 'trust', 0.8);
      feel(state, a, 'security', 1); feel(state, b, 'security', 0.5);
      // The public on it: taking back somebody it can't stand costs you.
      const disliked = (state.ledger?.approval?.[a] ?? 0) < -15;
      out.push(makeEvent(state, rng, { phase: 'evening', kind: 'reunite', players: [a, b], aired: true, major: [a, b, ...left],
        extra: { of: disliked ? 'mugged' : 'warm', pop: { [b]: { approval: disliked ? -1.5 : 1, fame: 2.5 }, [a]: { approval: sincere ? 1 : 0, fame: 2.5 } } } }));
    } else {
      br.refused++;
      if (br.refused >= MAX_REFUSALS) br.closed = true;
      feel(state, a, 'stress', 0.6); addBond(b, a, -0.2);
      out.push(makeEvent(state, rng, { phase: 'evening', kind: 'apology-rejected', players: [a, b], aired: true,
        extra: { of: br.closed ? 'final' : 'not-yet', pop: { [b]: { approval: 0.6, fame: 1 }, [a]: { approval: -0.3, fame: 1 } } } }));
    }
  }
  return out;
}
