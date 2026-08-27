// The first four families of the castle event pool (trust, suspicion, grief,
// cover) — the representative slice the rest of the ~150-event pool is meant
// to copy the shape of. See js/tr/castle/*.js for the design rationale on
// each family; this file exists to prove three things the brief calls out
// specifically:
//
//   1. Every event has a real consequence (bond, thread/residue, or state) —
//      never a purely cosmetic firing.
//   2. At least one event PER FAMILY branches 3+ ways on a genuine stat/role
//      check, not on a coin flip wearing four labels.
//   3. `cover-story-check` grants permission by ROLE (any living Traitor,
//      archetype irrelevant) and only ever uses archetype to penalise
//      COMPETENCE — a hero forced into the Traitor seat still runs the
//      event, and is mechanically worse at it than a schemer would be.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { getBond, setBond } from '../js/bonds.js';
import { recordAlignment } from '../js/tr/roles.js';
import { openThread, findOpenThread, advanceThread, residueFor } from '../js/tr/threads.js';
import { EVENTS, eligible, pickEvent, validateRegistry } from '../js/tr/events.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { learn } from '../js/knowledge.js';
import { alignmentFactId } from '../js/tr/deduction.js';
import { PROBE_CAST, PROBE_EP, forkRng, probeWorld } from './helpers/tr-probe-world.js';
import roster from '../franchise_roster.json';

// Side-effect imports: this is what registers the ~25 events under test.
// Unlike tr-events.test.js (which builds throwaway events per test and tears
// the registry down with _resetRegistry), these are the REAL pool — imported
// once, never reset, exactly as they will be when a season actually loads
// the castle layer.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';

const BASE_CAST = roster.players.slice(0, 6).map(p => p.name);

function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
/** Returns exactly the scripted sequence, cycling — for forcing a specific branch. */
function scriptedRng(values) {
  let i = 0;
  return () => { const v = values[i % values.length]; i++; return v; };
}

/** A synthetic player with fully controlled stats/archetype, for forcing branches. */
function makePlayer(name, archetype, stats) {
  return { name, slug: name.toLowerCase(), gender: 'nb', archetype,
    stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
      loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...stats } };
}

function setup(cast = BASE_CAST, playersOverride = null) {
  setPlayers(playersOverride || roster.players.slice(0, 6));
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
}

beforeEach(() => setup());

describe('the pool loads cleanly', () => {
  // Task 6 scaled the four original families past their initial 6-10 slice
  // and added three more (romance, callback, testing). The floor matters
  // more than the ceiling here — the dead-event/repetition audit
  // (tests/tr-castle-audit.test.js) is what actually governs pool health;
  // this is just a sanity floor so a family cannot silently regress to zero.
  it('registers at least 10 events in every one of the seven families', () => {
    const byFamily = {};
    for (const ev of EVENTS) (byFamily[ev.family] ||= []).push(ev.id);
    for (const fam of ['trust', 'suspicion', 'grief', 'cover', 'romance', 'callback', 'testing']) {
      expect(byFamily[fam]?.length ?? 0, `family "${fam}"`).toBeGreaterThanOrEqual(10);
    }
  });

  it('the whole pool is at least 80 events, honestly — not padded to a round number', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(80);
  });

  it('every event that claims eligibility actually fires (BB Hacker lesson)', () => {
    // Build the friendliest plausible world for each event: two well-bonded
    // actors, one of whom (CAST[0]) is a Traitor, a murder logged last round,
    // and pre-seeded open threads for every family so advancesThread /
    // findOpenThread-gated events get a real shot at weight > 0.
    const cast = BASE_CAST;
    const ep = 5;
    recordAlignment(cast[0], true, 1, 'selection');
    cast.slice(1).forEach(n => recordAlignment(n, false, 1, 'selection'));
    setBond(cast[0], cast[1], 5);
    setBond(cast[2], cast[3], -3);
    gs.tr.rounds.push({ ep: ep - 1, murdered: cast[4], murderTarget: cast[4] });
    openThread('trust', [cast[0], cast[1]], ep - 2, 'seed');
    openThread('suspicion', [cast[2], cast[3]], ep - 2, 'seed');
    openThread('cover', [cast[0]], ep - 2, 'seed');

    const makeCtx = () => ({
      ep, window: 'evening', act: 'middle', living: [...cast],
      actors: [cast[0], cast[1]],
    });
    const broken = validateRegistry(makeCtx, seededRng(7));
    expect(broken).toEqual([]);
  });

  it('every registered event declares a known window and a unique id', () => {
    const ids = new Set();
    for (const ev of EVENTS) {
      expect(['dawn', 'morning', 'journey-out', 'journey-back', 'evening', 'after-table', 'night'])
        .toContain(ev.window);
      expect(ids.has(ev.id)).toBe(false);
      ids.add(ev.id);
    }
  });
});

/**
 * A snapshot of everything a castle event is allowed to change. JSON-cloned
 * because `gs.bonds`/`gs.tr.threads`/`gs.tr.residue` are all plain
 * objects/arrays in this slice of state (no Sets), so a structural
 * string-diff is a cheap, exhaustive way to ask "did ANYTHING in here move,"
 * without needing to know in advance which key a given event would touch.
 */
function snapshotWorld() {
  return {
    bonds: JSON.stringify(gs.bonds || {}),
    threads: JSON.stringify(gs.tr?.threads || []),
    residue: JSON.stringify(gs.tr?.residue || {}),
  };
}
function worldMoved(before, after) {
  return before.bonds !== after.bonds || before.threads !== after.threads || before.residue !== after.residue;
}

describe('every event has a real consequence', () => {
  it('actually moves the observed world (bonds, threads, or residue) — not just its return shape', () => {
    // Round-1 fix: the previous version of this test inspected the SHAPE of
    // fire()'s return value (`result.branch`, `result.pair`, ...) rather than
    // whether anything in `gs` actually changed. Every event returns at
    // least a branch/pair/actor field as scene bookkeeping for the caller —
    // so that check passed even for an event that changed nothing, which is
    // exactly the failure mode the brief's "no purely cosmetic event" rule
    // exists to catch. This version snapshots the mutable world BEFORE the
    // call and asserts it is DIFFERENT after — see the mutation check below,
    // which proves this version actually goes red where the old one did not.
    const cast = BASE_CAST;
    const ep = 5;
    recordAlignment(cast[0], true, 1, 'selection');
    cast.slice(1).forEach(n => recordAlignment(n, false, 1, 'selection'));
    setBond(cast[0], cast[1], 5);
    gs.tr.rounds.push({ ep: ep - 1, murdered: cast[4], murderTarget: cast[4] });
    openThread('trust', [cast[0], cast[1]], ep - 2, 'seed');
    openThread('suspicion', [cast[0], cast[1]], ep - 2, 'seed');
    openThread('cover', [cast[0]], ep - 2, 'seed');

    const ctx = { ep, window: 'evening', act: 'middle', living: [...cast], actors: [cast[0], cast[1]] };
    const rng = seededRng(3);
    let fired = 0;
    for (const ev of EVENTS) {
      if (ev.weight(ctx) <= 0) continue;
      const before = snapshotWorld();
      const result = ev.fire(ctx, rng);
      expect(result, `${ev.id} fired but returned nothing`).toBeTruthy();
      const after = snapshotWorld();
      expect(worldMoved(before, after),
        `${ev.id} fired and changed nothing observable in gs.bonds/gs.tr.threads/gs.tr.residue`)
        .toBe(true);
      fired++;
    }
    // A guard on the guard: if the ctx above stopped making anything
    // eligible, the loop would trivially "pass" having tested zero events.
    expect(fired).toBeGreaterThanOrEqual(10);
  });

  it('MUTATION CHECK: a stubbed no-op event (same return shape, zero world writes) fails the check above', () => {
    // Round 1's proof-of-concept was "strip every addBond/threadId out of
    // all six grief events and watch all 21 tests stay green." Reproduced
    // here as a standing regression guard: a stand-in event with the exact
    // return shape a real grief event produces (branch/pair/victim/threadId)
    // but that genuinely writes nothing to `gs`. If a future edit reverts
    // the test above to a return-shape check, THIS assertion — which the
    // return-shape check would pass — is what should go red instead.
    const cast = BASE_CAST;
    const stub = {
      fire: () => ({ branch: 'empty-chair', pair: [cast[0], cast[1]], victim: cast[4], threadId: null }),
    };
    const before = snapshotWorld();
    const result = stub.fire();
    const after = snapshotWorld();
    expect(result).toBeTruthy();                    // the old bar: cleared trivially
    expect(worldMoved(before, after)).toBe(false);   // the new bar: correctly refuses to call this a consequence
  });
});

// ══════════════════════════════════════════════════════════════════════
// GROUND TRUTH DOES NOT REACH A BOND (whole-plan review, finding 3)
// ══════════════════════════════════════════════════════════════════════
//
// Three events used to condition a BOND DELTA on `alignmentAt()` — who
// somebody actually IS — and bonds are not inert: they feed bondResistance()
// -> suspicion() in the deduction layer, which is the ledger's own account of
// the castle's only influence path. So a truth-keyed bond was an oracle wired
// into the room's reasoning, arriving by the one route Task 4's whole
// apparatus does not watch: gateChannel() guards `learn()`, and none of these
// ever touched `learn()`. Measured before the fix: 6,536 Faithful-penalising
// firings and 202 Traitor-warming firings per 5,000 seasons.
//
// The rule these two probes enforce, stated once:
//
//   A castle event's weight may read a player's alignment as PERMISSION for
//   that player to act (self-knowledge — a Traitor knows they are a Traitor)
//   or as PACT KNOWLEDGE the actor has actually been given (the turret, via
//   knowsAlignmentOf). It may never read the OTHER person's hidden alignment.
//
// PROBE A — role symmetry. Two worlds, one Traitor among the two actors in
// each, differing only in WHICH. Every event's weight must be identical: an
// event may notice that somebody in the scene is a Traitor, it must not care
// which of them it is. This is the probe that fails on
// `alignmentAt(b) === 'faithful'` and equally on the review's named mutation
// of it, `=== 'traitor'`.
//
// PROBE B — an unmet pact is not a pact. `a` is a Traitor in both worlds and
// the turret has NOT been seeded, so `a` knows nothing about anybody. Flipping
// `b`'s alignment must not move the weight. This is the probe that fails on
// `isTraitor(a) && isTraitor(b)` and on romance-liability-exposed's old
// mixed-by-truth precondition.
//
// Weight only, deliberately: fire() legitimately reads the ACTOR's own role
// (grief's opportunistic branch, cover's competence roll), and those are
// self-knowledge. Weight is where the gate lives and where all three defects
// lived.
describe('ground truth does not decide who a castle event happens to', () => {
  // The world, the cast and the scripted-roll helper now live in
  // tests/helpers/tr-probe-world.js — tr-castle-belief-gate.test.js needs the
  // same world to execute every event's fire() in, and two copies of it would
  // drift.
  const [A, B] = PROBE_CAST;
  const EP = PROBE_EP;

  /** Every registered event's weight, keyed by id, for the scene [A, B]. */
  function weightsFor(world) {
    probeWorld(world);
    const out = {};
    for (const ev of EVENTS) {
      const ctx = { ep: EP, window: ev.window, act: 'middle', living: [...PROBE_CAST], actors: [A, B] };
      out[ev.id] = ev.weight(ctx);
    }
    return out;
  }

  function compare(w1, w2) {
    return EVENTS.map(e => e.id).filter(id => w1[id] !== w2[id])
      .map(id => `${id}: ${w1[id]} vs ${w2[id]}`);
  }

  it('PROBE A: an event may notice a Traitor is in the scene, never WHICH of the two it is', () => {
    const aFaithfulBTraitor = weightsFor({ aTraitor: false, bTraitor: true, turret: true });
    const aTraitorBFaithful = weightsFor({ aTraitor: true, bTraitor: false, turret: true });
    // Guard on the guard: a probe world where nothing is eligible would pass
    // this and every mutant with it.
    const live = Object.values(aTraitorBFaithful).filter(w => w > 0).length;
    expect(live, 'the probe world made almost nothing eligible — the comparison below is vacuous')
      .toBeGreaterThanOrEqual(30);
    const diffs = compare(aFaithfulBTraitor, aTraitorBFaithful);
    expect(diffs, `these events read WHICH actor is the Traitor:
${diffs.join('\n')}`).toEqual([]);
  });

  it('PROBE B: a Traitor who has never been shown the turret cannot act on a partner\'s alignment', () => {
    const partnerFaithful = weightsFor({ aTraitor: true, bTraitor: false, turret: false });
    const partnerTraitor = weightsFor({ aTraitor: true, bTraitor: true, turret: false });
    const live = Object.values(partnerFaithful).filter(w => w > 0).length;
    expect(live, 'the probe world made almost nothing eligible — the comparison below is vacuous')
      .toBeGreaterThanOrEqual(30);
    const diffs = compare(partnerFaithful, partnerTraitor);
    expect(diffs, `these events read the partner's hidden alignment:
${diffs.join('\n')}`).toEqual([]);
  });

  it('PROBE B goes the other way once the turret HAS been shown — the pact is knowledge, not truth', () => {
    // The other half of the claim: knowsAlignmentOf is not dead weight. The
    // same two Traitors, with the turret seeded, DO reach their pact events.
    const unmet = weightsFor({ aTraitor: true, bTraitor: true, turret: false });
    const met = weightsFor({ aTraitor: true, bTraitor: true, turret: true });
    const moved = compare(unmet, met);
    expect(moved.length, 'seeding the turret changed nothing — knowsAlignmentOf is inert here')
      .toBeGreaterThan(0);
  });

  // ── PROBE C: the same question, asked of fire() (fix round 2, R2) ────────
  //
  // PROBE A and PROBE B above only ever call weight(). The finding they came
  // from said "ground truth leaks into BOND DELTAS", and a bond delta is
  // written in fire(), which reads alignment just as freely. The defeat that
  // motivated this arm stayed green through both probes above:
  //
  //     // js/tr/castle/suspicion.js — susp-misread-tell fire()
  //     addBond(a, b, alignmentAt(b, ctx.ep) === 'faithful' ? -0.5 : -4);
  //
  // WHY THIS IS PROBE B'S FLIP AND NOT PROBE A'S. The exemption the finding
  // asks for is "the ACTING player's own role" — grief-morning-reaction's
  // opportunistic branch and cover's competence roll legitimately read it,
  // because a Traitor knows they are a Traitor. Probe A's flip SWAPS which of
  // the two actors is the Traitor, so it changes the acting player's own role
  // (grief takes `ctx.actors[0]` as its reactor) and would flag that
  // legitimate read. Probe B's flip holds actors[0] a Traitor in BOTH arms and
  // moves only the OTHER actor, so the exemption falls out of the world's
  // construction rather than out of a hand-maintained list of event ids —
  // which is the shape this file's other sweeps are written in, and the reason
  // round 1's probes caught defects the review had missed.
  //
  // Everything an event may legitimately vary on is held equal across the two
  // arms: identical stat lines, identical archetypes, identical bonds,
  // identical threads, identical ledger, and the SAME scripted roll sequence.
  // The only difference in the world is whether Pb is secretly a Traitor.
  const PROBE_C_ROLLS = [0.05, 0.35, 0.65, 0.95];

  /**
   * Execute every registered event's fire() in `world`, at a fixed roll, and
   * reduce the outcome to the two things the finding is about: which branch
   * was taken and what it did to a bond. Player NAMES are deliberately not
   * compared — probe C never swaps the actors, so a name difference could only
   * come from an event choosing a third party, which is a different question.
   */
  const PROBE_PAIRS = PROBE_CAST.flatMap((x, i) => PROBE_CAST.slice(i + 1).map(y => [x, y]));
  /** Every bond in the probe cast, so a delta can be measured rather than trusted. */
  function bondSnapshot() {
    return PROBE_PAIRS.map(([x, y]) => getBond(x, y));
  }

  function outcomesFor(world, roll) {
    const out = {};
    for (const ev of EVENTS) {
      probeWorld(world);
      const before = bondSnapshot();
      const ctx = { ep: EP, window: ev.window, act: 'middle', living: [...PROBE_CAST], actors: [A, B] };
      let branch;
      try {
        const r = ev.fire(ctx, forkRng(roll));
        branch = r == null ? 'null' : String(r.branch ?? '-');
      } catch (e) {
        out[ev.id] = `threw:${e.message}`;
        continue;
      }
      // MEASURED, not reported. The defeat this arm exists for wrote
      // `addBond(a, b, alignmentAt(b) === 'faithful' ? -0.5 : -4)` while its
      // return value still said `bondDelta: -0.5` — trusting the event's own
      // account of what it did is how a laundered write stays invisible.
      const after = bondSnapshot();
      const moved = PROBE_PAIRS
        .map(([x, y], i) => [x, y, after[i] - before[i]])
        .filter(([, , d]) => d !== 0)
        .map(([x, y, d]) => `${x}~${y}:${d}`)
        .sort();
      out[ev.id] = `${branch}|${moved.join(',')}`;
    }
    return out;
  }

  it('PROBE C: fire() — branch and bond delta do not move when the OTHER actor\'s hidden alignment does', () => {
    const diffs = [];
    let live = 0;
    for (const roll of PROBE_C_ROLLS) {
      const partnerFaithful = outcomesFor({ aTraitor: true, bTraitor: false, turret: false }, roll);
      const partnerTraitor = outcomesFor({ aTraitor: true, bTraitor: true, turret: false }, roll);
      live += Object.values(partnerFaithful).filter(v => !v.startsWith('null|') && !v.startsWith('threw')).length;
      for (const ev of EVENTS) {
        if (partnerFaithful[ev.id] !== partnerTraitor[ev.id]) {
          diffs.push(`${ev.id} @roll ${roll}: ${partnerFaithful[ev.id]} vs ${partnerTraitor[ev.id]}`);
        }
      }
    }
    // Guard on the guard: if fire() returned null (or threw) for everything,
    // every outcome would be the same string in both arms and this passes on
    // an empty sample.
    expect(live, 'almost no event actually produced an outcome — the comparison below is vacuous')
      .toBeGreaterThanOrEqual(EVENTS.length * PROBE_C_ROLLS.length * 0.5);
    expect(diffs, `these events' fire() read the other actor's hidden alignment:
${diffs.join('\n')}`)
      .toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════
// HOW A FORK IS TESTED HERE, AND WHY IT CHANGED (whole-plan review, finding 2)
// ═════════════════════════════════════════════════════════════════════
//
// Every fork test in this file used to vary the stats AND walk the roll
// monotonically down the cumulative distribution in branch-declaration order
// (0.01, 0.30, 0.50, 0.999). The roll alone chose the branch; the stats were
// decorative. Proven by running it: replacing every `const *Score = …` in
// trust.js, suspicion.js, testing.js and callback.js with `0.5` — deleting the
// entire stat/role/bond-derived scoring in four families, making each fork a
// literal coin flip wearing four labels — left 32 of 33 tests green.
//
// So the roll is now FIXED across all the variants of a fork, and the STATS
// are the only thing that moves. A branch is asserted by giving it a stat line
// whose score band contains that one roll; nothing else can produce the
// outcome. Flatten the scores and every band becomes identical, so the fixed
// roll lands in the SAME branch for every variant and all but one go red.
//
// The roll per fork is not 0.5 everywhere because it cannot be: `caughtTest`
// in testing-decoy-secret tops out at 48% of its own fork's total score even
// with intuition at 10 and everything else at 0, so no stat line makes it the
// branch containing the midpoint. The roll for each fork is the one value at
// which ALL of its branches are reachable by some legal stat line — stated on
// each block, with the arithmetic, so a future rebalance knows what moved.

describe('trust: the vote-commitment test forks on a real check, four ways', () => {
  const CAST2 = ['Asker', 'Asked'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }
  // ONE ROLL, FOUR STAT LINES. keep = loy*.06 + max(0,bond)*.04; break =
  // strat*.05 + (10-loy)*.05; deflect = (10-bold)*.07 + .15; turn = bold*.05 +
  // int*.05. At 0.5 each line below puts its own branch over half the fork's
  // total, so the midpoint lands inside it.
  const ROLL = 0.5;

  function askedWith(stats, bond) {
    setup(CAST2, [makePlayer('Asker', 'floater'), makePlayer('Asked', 'floater', stats)]);
    setBond('Asker', 'Asked', bond);
    return EVENTS.find(e => e.id === 'trust-vote-commitment-test');
  }

  it('KEEPS: loyalty 10 on a bond of 10 — keep 1.00 of a 1.65 total', () => {
    const ev = askedWith({ loyalty: 10, strategic: 0, boldness: 10, intuition: 0 }, 10);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('kept');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('BREAKS: the same roll, loyalty 0 and strategic 10 — break 1.00 of 1.69', () => {
    const ev = askedWith({ loyalty: 0, strategic: 10, boldness: 10, intuition: 0 }, 1);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('broken');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('DEFLECTS: the same roll, boldness 0 — deflect 0.85 of 1.39', () => {
    const ev = askedWith({ loyalty: 0, strategic: 0, boldness: 0, intuition: 0 }, 1);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('deflected');
  });

  it('TURNS IT BACK: the same roll, boldness 10 and intuition 10 — turn 1.00 of 1.69', () => {
    const ev = askedWith({ loyalty: 0, strategic: 0, boldness: 10, intuition: 10 }, 1);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('turned');
    expect(result.bondDelta).toBeLessThan(0);
  });
});

describe('suspicion: the private accusation forks on the ACCUSED\'s reaction', () => {
  const CAST2 = ['Accuser', 'Accused'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }
  // ONE ROLL, FOUR STAT LINES. deny = temp*.06 + soc*.04; denyWeak =
  // (10-temp)*.06 + .15; turn = bold*.05 + int*.05; confess = loy*.05 +
  // (10-temp)*.05.
  const ROLL = 0.5;

  function accusedWith(stats) {
    setup(CAST2, [makePlayer('Accuser', 'floater'), makePlayer('Accused', 'floater', stats)]);
    return EVENTS.find(e => e.id === 'susp-private-accusation');
  }

  it('DENIES convincingly and closes the thread: temperament 10, social 10 — deny 1.00 of 1.15', () => {
    const ev = accusedWith({ temperament: 10, social: 10, loyalty: 0, boldness: 0, intuition: 0 });
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('denies');
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });

  it('DENIES WEAKLY and the thread heats: the same roll, temperament 0 — denyWeak 0.75 of 1.25', () => {
    const ev = accusedWith({ temperament: 0, social: 0, loyalty: 0, boldness: 0, intuition: 0 });
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const before = gs.tr.threads.find(x => x.id === t.id).heat;
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('denyWeak');
    expect(gs.tr.threads.find(x => x.id === t.id).heat).toBeGreaterThan(before);
  });

  it('TURNS it back: the same roll, boldness 10 and intuition 10 — turn 1.00 of 1.75', () => {
    const ev = accusedWith({ temperament: 10, social: 0, loyalty: 0, boldness: 10, intuition: 10 });
    openThread('suspicion', CAST2, 3, 'seed');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('turned');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('CONFESSES to something unrelated: the same roll, loyalty 10 and temperament 0 — confess 1.00 of 1.75', () => {
    const ev = accusedWith({ temperament: 0, social: 0, loyalty: 10, boldness: 0, intuition: 0 });
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('confess');
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });
});

describe('grief: the morning reaction forks on archetype/role, not a coin', () => {
  const CAST2 = ['Reactor', 'Partner'];
  function ctxFor(ep) { return { ep, window: 'dawn', act: 'middle', living: CAST2, actors: CAST2 }; }
  function withMurder(ep) { gs.tr.rounds.push({ ep: ep - 1, murdered: 'Victim' }); }
  // ONE ROLL, FIVE STAT/ROLE LINES. mourn = soc*.05 + loy*.05 + .3 if a warm
  // archetype; suspicious = strat*.05 + int*.05 + .3 if a reader archetype;
  // stoic = (10-soc)*.06 + .15; opportunistic = 0 unless the reactor is a
  // living Traitor, and then strat*.05 + bold*.05 + .2.
  const ROLL = 0.5;

  function reactorWith(archetype, stats, isTraitor = false) {
    setup(CAST2, [makePlayer('Reactor', archetype, stats), makePlayer('Partner', 'floater')]);
    withMurder(4);
    recordAlignment('Reactor', isTraitor, 1, 'selection');
    return EVENTS.find(e => e.id === 'grief-morning-reaction');
  }

  it('MOURNS OPENLY: a hero with social 10 and loyalty 10 — mourn 1.30 of 1.45', () => {
    const ev = reactorWith('hero', { social: 10, loyalty: 10, strategic: 0, intuition: 0, boldness: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('mourn');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('turns SUSPICIOUS: the same roll, a perceptive-player with strategic 10 and intuition 10 — suspicious 1.30 of 2.05', () => {
    const ev = reactorWith('perceptive-player', { social: 0, loyalty: 0, strategic: 10, intuition: 10, boldness: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('suspicious');
  });

  it('withdraws STOICALLY and still leaves residue: the same roll, everything at 0 — stoic 0.75 of 0.75', () => {
    const ev = reactorWith('floater', { social: 0, loyalty: 0, strategic: 0, intuition: 0, boldness: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('stoic');
    expect(result.bondDelta).toBe(0);
    expect(result.threadId, 'stoic must still write residue, not nothing').toBeTruthy();
  });

  // THE ROLE GATE, as a matched pair: identical stats, identical roll, one
  // bit of difference. opportunisticScore is the only term in the fork that
  // is multiplied by role rather than by a stat, so this is the one thing in
  // the family that no stat line can reproduce.
  const GATE_STATS = { social: 10, loyalty: 0, strategic: 0, intuition: 0, boldness: 10 };

  it('a living Traitor reaches the OPPORTUNISTIC branch — opportunistic 0.70 of 1.35', () => {
    const ev = reactorWith('wildcard', GATE_STATS, true);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('opportunistic');
    expect(result.isTraitor).toBe(true);
  });

  it('a Faithful with the SAME stats and the SAME roll cannot reach it — the term is 0', () => {
    const ev = reactorWith('wildcard', GATE_STATS, false);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).not.toBe('opportunistic');
    expect(result.branch).toBe('mourn');
  });
});

describe('cover: role overrides archetype', () => {
  const CAST2 = ['Turncoat', 'Partner'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('weight() grants any living Traitor eligibility regardless of archetype', () => {
    setup(CAST2, [
      makePlayer('Turncoat', 'hero'),
      makePlayer('Partner', 'floater'),
    ]);
    recordAlignment('Turncoat', true, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'cover-story-check');
    expect(ev.weight(ctxFor(4))).toBeGreaterThan(0);
  });

  it('a Faithful hero gets ZERO weight — permission is role, not a hero exception', () => {
    setup(CAST2, [
      makePlayer('Turncoat', 'hero'),
      makePlayer('Partner', 'floater'),
    ]);
    recordAlignment('Turncoat', false, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'cover-story-check');
    expect(ev.weight(ctxFor(4))).toBe(0);
  });

  it('a hero-Traitor and a villain-Traitor with IDENTICAL stats get different odds — archetype penalises competence only', () => {
    const stats = { strategic: 8, boldness: 8, temperament: 8 };
    setup(CAST2, [makePlayer('Turncoat', 'hero', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'cover-story-check');
    const heroResult = ev.fire(ctxFor(4), scriptedRng([0.01]));

    setup(CAST2, [makePlayer('Turncoat', 'villain', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    const villainResult = ev.fire(ctxFor(4), scriptedRng([0.01]));

    expect(heroResult.competence).toBeLessThan(villainResult.competence);
  });

  it('the same low roll that is CONVINCING for a villain is worse for a hero (both eligible, different outcome)', () => {
    const stats = { strategic: 6, boldness: 6, temperament: 6 };
    setup(CAST2, [makePlayer('Turncoat', 'villain', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    let ev = EVENTS.find(e => e.id === 'cover-story-check');
    const villainRoll = ev.fire(ctxFor(4), scriptedRng([0.30]));
    expect(villainRoll.branch).toBe('convincing');

    setup(CAST2, [makePlayer('Turncoat', 'hero', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    ev = EVENTS.find(e => e.id === 'cover-story-check');
    const heroRoll = ev.fire(ctxFor(4), scriptedRng([0.30]));
    // Same roll, lower competence -> smaller convincing band -> the roll now
    // spills into a worse branch. This is the mechanical trace of "visibly
    // bad at it": nothing about ELIGIBILITY changed, only the outcome did.
    expect(heroRoll.branch).not.toBe('convincing');
  });
});

// ═════════════════════════════════════════════════════════════════════
// COVER'S TWO FORKS, PER-BRANCH (fix round 2, R5)
// ═════════════════════════════════════════════════════════════════════
//
// cover.js's seven `*Score` constants were in no mutation list at all. Zeroing
// them one at a time — the mutation that actually isolates a branch, rather
// than flattening every branch to 0.5 and letting `floor(roll*N)` pick
// positionally — left FIVE of the seven alive: `suspiciousScore` and
// `slipScore` in cover-story-check, and all three of cover-alibi-crumbles.
// The two tests above cover convincing and awkward and nothing else.
//
// cover-story-check's fork needs TWO rolls and not one, which is worth stating
// because every other fork in this file gets away with one. Its bands are
// convincing = c*0.5, awkward = 0.3 flat, suspicious = (1-c)*0.35,
// slip = (1-c)*0.25, over a competence c clamped to [0.05, 0.95]. At c = 0.95
// convincing runs to 59% of the total; at c = 0.05 slip does not start until
// 73.5%. No single roll is inside both, so there is no value at which all four
// branches are reachable by SOME stat line. Splitting the fork at its own
// midpoint is the honest fix; pretending one roll covers it is not.
describe('cover: the story-check fork, on the two branches nothing was testing', () => {
  const CAST2 = ['Turncoat', 'Partner'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  // competence = strat*.04 + bold*.03 + temp*.03, minus .25 for a nice
  // archetype, clamped to [0.05, 0.95]. Villain throughout, so the clamp and
  // the archetype penalty are not what is moving here — only the stats are.
  function turncoatWith(stats) {
    setup(CAST2, [makePlayer('Turncoat', 'villain', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    return EVENTS.find(e => e.id === 'cover-story-check');
  }

  // ONE ROLL, TWO STAT LINES, for the bottom half of the fork.
  const BAD_HALF_ROLL = 0.80;

  it('half-competent, the check reads SUSPICIOUS: c 0.50, roll 0.80 lands in [0.647, 0.853]', () => {
    const ev = turncoatWith({ strategic: 5, boldness: 5, temperament: 5 });
    const result = ev.fire(ctxFor(4), scriptedRng([BAD_HALF_ROLL]));
    expect(result.competence).toBeCloseTo(0.5, 5);
    expect(result.branch).toBe('suspicious');
    // The partner half-clocked it: suspicious is the first branch that costs
    // a bond, which is what separates it from awkward above it.
    expect(result.bondDelta).toBe(-1);
  });

  it('flatly incompetent, the SAME roll becomes a SLIP: c 0.05, roll 0.80 lands in [0.735, 1]', () => {
    const ev = turncoatWith({ strategic: 0, boldness: 0, temperament: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([BAD_HALF_ROLL]));
    expect(result.competence).toBeCloseTo(0.05, 5);
    expect(result.branch).toBe('slip');
    // Twice the cost of being half-clocked: the partner had to watch it fall
    // apart. Asserted so zeroing slipScore cannot be rescued by the branch
    // name alone.
    expect(result.bondDelta).toBe(-2);
  });
});

describe('cover-alibi-crumbles forks three ways on the SAME roll', () => {
  const CAST2 = ['Turncoat', 'Partner'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }

  // holds = strat*.04 + temp*.04 + .1; wobbles = .35 flat;
  // collapses = (10-temp)*.05 + (10-strat)*.02. Unlike cover-story-check this
  // fork DOES have a roll at which all three are reachable, because the flat
  // middle band never shrinks: 0.5.
  const ROLL = 0.5;

  function crumbleWith(stats) {
    setup(CAST2, [makePlayer('Turncoat', 'villain', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    return EVENTS.find(e => e.id === 'cover-alibi-crumbles');
  }

  it('HOLDS: strategic 10 and temperament 10 — holds 0.90 of 1.25, so 0.5 is inside it', () => {
    const ev = crumbleWith({ strategic: 10, temperament: 10 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('holds');
    expect(result.bondDelta).toBe(0.5);
  });

  it('WOBBLES: the same roll at strategic 5 and temperament 5 — wobbles 0.35 of 1.20, at [0.417, 0.708]', () => {
    const ev = crumbleWith({ strategic: 5, temperament: 5 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('wobbles');
    expect(result.bondDelta).toBe(-0.5);
  });

  it('COLLAPSES: the same roll at strategic 0 and temperament 0 — collapses 0.70 of 1.15, from 0.391', () => {
    const ev = crumbleWith({ strategic: 0, temperament: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('collapses');
    expect(result.bondDelta).toBe(-2);
  });
});

// ═════════════════════════════════════════════════════════════════════
// THE THREE FORKS NOTHING WAS TESTING AT ALL (fix round 2, R5)
// ═════════════════════════════════════════════════════════════════════
//
// R5 asked for cover.js, which had never been in a mutation list. Running the
// same per-branch zeroing across every `*Score` in the pool — the honest way
// to ask the question, rather than checking only the constants somebody had
// already thought about — found three more forks with NO test on any branch:
// susp-group-pressure-crack, testing-loyalty-oath and trust-secret-swap. Nine
// live mutants between them. Same defect as cover's, found the same way, so
// fixed here rather than written down for a later round.
//
// Each block states its own roll and the arithmetic that makes every branch
// reachable at it, in the shape the header above established.
describe('susp-group-pressure-crack forks on the PRESSURED player, three ways', () => {
  const CAST2 = ['Presser', 'Pressed'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: [...CAST2, 'C', 'D', 'E'], actors: CAST2 }; }

  // Reads pStats(actors[1]) — the one under pressure, not the one applying it.
  // holds = temp*.05 + bold*.03 + .1; cracks = (10-temp)*.06 + .1;
  // redirects = strat*.04 + soc*.03. All three contain 0.7:
  //   temp/bold 10, strat/soc 0  -> holds .9 of 1.0        -> 0.7 is holds
  //   everything 0               -> holds .1 of 0.8        -> 0.7 is cracks
  //   everything 10              -> cracks ends at .588    -> 0.7 is redirects
  const ROLL = 0.7;

  function pressedWith(stats) {
    setup(CAST2, [makePlayer('Presser', 'floater'), makePlayer('Pressed', 'floater', stats)]);
    return EVENTS.find(e => e.id === 'susp-group-pressure-crack');
  }

  it('HOLDS: temperament 10 and boldness 10, nothing to redirect with', () => {
    const ev = pressedWith({ temperament: 10, boldness: 10, strategic: 0, social: 0 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('holds');
    expect(result.bondDelta).toBe(0.5);
  });

  it('CRACKS: the same roll with everything at 0', () => {
    const ev = pressedWith({ temperament: 0, boldness: 0, strategic: 0, social: 0 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('cracks');
    expect(result.bondDelta).toBe(-2);
  });

  it('REDIRECTS: the same roll, calm AND capable — strategic 10 and social 10 on top of the holds line', () => {
    const ev = pressedWith({ temperament: 10, boldness: 10, strategic: 10, social: 10 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('redirects');
    expect(result.bondDelta).toBe(-1);
  });
});

describe('testing-loyalty-oath forks on the player being ASKED, three ways', () => {
  const CAST2 = ['Asker', 'Asked'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: [...CAST2, 'C'], actors: CAST2 }; }

  // sincere = loy*.05 + bold*.03 + .1; reluctant = .35 flat;
  // refuses = (10-loy)*.05 + (10-bold)*.015. 0.55 is inside all three:
  //   loy/bold 10 -> sincere .9 of 1.25, ends at .720
  //   loy/bold 5  -> sincere ends .426, reluctant ends .723
  //   loy/bold 0  -> reluctant ends .409, refuses runs to 1
  const ROLL = 0.55;

  function askedWith(stats) {
    setup(CAST2, [makePlayer('Asker', 'floater'), makePlayer('Asked', 'floater', stats)]);
    setBond('Asker', 'Asked', 4);
    return EVENTS.find(e => e.id === 'testing-loyalty-oath');
  }

  it('SINCERE: loyalty 10 and boldness 10 — the oath is taken without hesitating', () => {
    const ev = askedWith({ loyalty: 10, boldness: 10 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('sincere');
    expect(result.bondDelta).toBe(2);
  });

  it('RELUCTANT: the same roll at loyalty 5 and boldness 5 — said, but visibly effortful', () => {
    const ev = askedWith({ loyalty: 5, boldness: 5 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('reluctant');
    // Reluctant costs nothing and gains nothing on purpose — the beat is the
    // hesitation, not a change in how the two feel. Asserted so a mutant that
    // collapses reluctant into sincere cannot pass on the branch name alone.
    expect(result.bondDelta).toBe(0);
  });

  it('REFUSES: the same roll at loyalty 0 and boldness 0 — a public refusal', () => {
    const ev = askedWith({ loyalty: 0, boldness: 0 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('refuses');
    expect(result.bondDelta).toBe(-2);
  });
});

describe('trust-secret-swap forks on the CONFIDANT, three ways', () => {
  const CAST2 = ['Teller', 'Told'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  // keep = loy*.06 + temp*.04; accident = (10-soc)*.05 + .15;
  // deliberate = strat*.05 + (10-loy)*.05. 0.6 is inside all three:
  //   loy/temp/soc 10, strat 0 -> keep 1.00 of 1.15, ends at .870
  //   loy/temp 5, soc/strat 0  -> keep ends .357, accident ends .821
  //   loy/temp 0, soc/strat 10 -> accident ends .130, deliberate runs to 1
  const ROLL = 0.6;

  function toldWith(stats) {
    setup(CAST2, [makePlayer('Teller', 'floater'), makePlayer('Told', 'floater', stats)]);
    setBond('Teller', 'Told', 4);
    return EVENTS.find(e => e.id === 'trust-secret-swap');
  }

  it('KEPT: loyalty 10, temperament 10, social 10, strategic 0', () => {
    const ev = toldWith({ loyalty: 10, temperament: 10, social: 10, strategic: 0 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('kept');
    expect(result.bondDelta).toBe(1);
  });

  it('LEAKED BY ACCIDENT: the same roll, middling loyalty with social 0 — it got out, nobody sold it', () => {
    const ev = toldWith({ loyalty: 5, temperament: 5, social: 0, strategic: 0 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('leakedAccident');
    expect(result.bondDelta).toBe(-1);
  });

  it('LEAKED DELIBERATELY: the same roll, loyalty 0 and strategic 10 — it was spent, and it costs triple', () => {
    const ev = toldWith({ loyalty: 0, temperament: 0, social: 10, strategic: 10 });
    const result = ev.fire(ctxFor(5), scriptedRng([ROLL]));
    expect(result.branch).toBe('leakedDeliberate');
    expect(result.bondDelta).toBe(-3);
  });
});

describe('romance: the liability-exposed flagship forks on the DOUBTING partner\'s own read', () => {
  const CAST2 = ['Doubter', 'Partner'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }
  function seedShowmance(ep) { return openThread('romance-showmance', CAST2, ep, 'seed'); }
  /** Give `who` a real, deduced read on `about` — the event's precondition. */
  function seedDoubt(who, about, ep) {
    learn(who, alignmentFactId(about), { sourceType: 'deduced', confidence: 0.6, ep, rng: () => 0 });
  }
  // Same discipline as the other forks: the roll is FIXED, the stats move.
  // oblivious = (10-int)*.06 + loy*.02; suspicious = int*.05 + (10-bold)*.03;
  // confronts = bold*.05 + int*.03; exposes = bold*.04 + (10-loy)*.04.
  const ROLL = 0.5;
  // `exposes` cannot hold the midpoint at any legal stat line — killing
  // oblivious needs intuition 10, which feeds suspicious and confronts faster
  // than it feeds exposes, so exposes tops out at 0.80 of a 1.90 total (42%).
  // It gets a MATCHED PAIR at a higher fixed roll instead: same roll, two stat
  // lines, two different branches.
  const ROLL_HIGH = 0.85;

  function doubterWith(stats) {
    setup(CAST2, [makePlayer('Doubter', 'floater', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Doubter', false, 1, 'selection');
    recordAlignment('Partner', true, 1, 'selection');
    seedShowmance(3);
    seedDoubt('Doubter', 'Partner', 4);
    return EVENTS.find(e => e.id === 'romance-liability-exposed');
  }

  it('needs a DOUBT inside the couple — a showmance nobody has started reading has nothing to expose', () => {
    setup(CAST2, [makePlayer('Doubter', 'floater'), makePlayer('Partner', 'floater')]);
    // Deliberately MIXED by ground truth, and deliberately without a read:
    // the old precondition was exactly this world and it fired here. It does
    // not any more — the gate is what the partner believes, not what the
    // other one is. See the ground-truth probes above.
    recordAlignment('Doubter', false, 1, 'selection');
    recordAlignment('Partner', true, 1, 'selection');
    seedShowmance(3);
    const ev = EVENTS.find(e => e.id === 'romance-liability-exposed');
    expect(ev.weight(ctxFor(4))).toBe(0);
    seedDoubt('Doubter', 'Partner', 4);
    expect(ev.weight(ctxFor(4))).toBeGreaterThan(0);
  });

  it('stays OBLIVIOUS and the bond warms: intuition 0, loyalty 10 — oblivious 0.80 of 1.10', () => {
    const ev = doubterWith({ intuition: 0, loyalty: 10, boldness: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('oblivious');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('goes SUSPICIOUS-BUT-SILENT: the same roll, intuition 10 and boldness 0 — suspicious 0.80 of 1.50', () => {
    const ev = doubterWith({ intuition: 10, loyalty: 0, boldness: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('suspicious');
    expect(result.bondDelta).toBe(0);
  });

  it('CONFRONTS privately: the same roll, intuition 10 and boldness 10 — confronts 0.80 of 2.10', () => {
    const ev = doubterWith({ intuition: 10, loyalty: 0, boldness: 10 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('confronts');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('EXPOSES it publicly, closing the showmance: boldness 10, loyalty 0 — exposes 0.80 of 1.90', () => {
    const ev = doubterWith({ intuition: 0, loyalty: 0, boldness: 10 });
    const showmance = findOpenThread('romance-showmance', CAST2);
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL_HIGH]));
    expect(result.branch).toBe('exposes');
    expect(gs.tr.threads.find(t => t.id === showmance.id).state).toBe('closed');
    // A `cover` thread opens on the suspected partner — their old protection
    // is gone, whatever they actually are.
    expect(gs.tr.threads.some(t => t.kind === 'cover' && t.parties.includes('Partner'))).toBe(true);
  });

  it('the SAME high roll on a timid, loyal doubter does NOT expose — the stats are what moved it', () => {
    const ev = doubterWith({ intuition: 0, loyalty: 10, boldness: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL_HIGH]));
    expect(result.branch).not.toBe('exposes');
    expect(result.branch).toBe('suspicious');
  });
});

describe('callback: the history-confrontation flagship forks on the actor + the polarity of shared history', () => {
  const CAST2 = ['Veteran', 'OldAlly'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }
  // ONE ROLL, FOUR LINES. reconcile = loy*.05 + (.3 positive | .1 otherwise);
  // grudge = (10-loy)*.04 + (.4 negative | .05); strategic = strat*.04 +
  // bold*.03; buries = temp*.04 + (10-bold)*.02 + .1. 0.6 rather than 0.5
  // because `buries` cannot hold the midpoint: reconcile and grudge together
  // floor at 0.35 whatever the stats, so buries tops out at 47% of the total.
  const ROLL = 0.6;

  function seedLedger(relation) {
    setFranchiseLedger({
      v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
        '1': { seasonName: 'S1', format: 'total-drama', players: {
          Veteran: { allies: relation === 'allies' ? ['OldAlly'] : [], rivals: relation === 'rivals' ? ['OldAlly'] : [],
            betrayed: [], betrayedBy: relation === 'betrayed-by-them' ? ['OldAlly'] : [], showmances: [] },
          OldAlly: { allies: relation === 'allies' ? ['Veteran'] : [], rivals: relation === 'rivals' ? ['Veteran'] : [],
            betrayed: relation === 'betrayed-by-them' ? ['Veteran'] : [], betrayedBy: [], showmances: [] },
        } },
      } } },
    });
  }

  function veteranWith(stats, relation) {
    setup(CAST2, [makePlayer('Veteran', 'floater', stats), makePlayer('OldAlly', 'floater')]);
    seedLedger(relation);
    return EVENTS.find(e => e.id === 'callback-history-confrontation');
  }

  it('no shared history at all means zero weight', () => {
    setup(CAST2, [makePlayer('Veteran', 'floater'), makePlayer('OldAlly', 'floater')]);
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    const ev = EVENTS.find(e => e.id === 'callback-history-confrontation');
    expect(ev.weight(ctxFor(4))).toBe(0);
  });

  it('RECONCILES: loyalty 10 over a positive history — reconcile 0.80 of 1.15', () => {
    const ev = veteranWith({ loyalty: 10, strategic: 0, boldness: 0, temperament: 0 }, 'allies');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('reconciles');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('renews the GRUDGE: the same roll, loyalty 0 over a betrayal — grudge 0.80 of 1.20', () => {
    const ev = veteranWith({ loyalty: 0, strategic: 0, boldness: 0, temperament: 0 }, 'betrayed-by-them');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('grudge');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('plays it STRATEGICALLY: the same roll and the same positive history as the reconciler, strategic 10 and boldness 10 — strategic 0.70 of 1.55', () => {
    const ev = veteranWith({ loyalty: 0, strategic: 10, boldness: 10, temperament: 0 }, 'allies');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('strategic');
  });

  it('BURIES it, closing any existing callback thread: the same roll, temperament 10 and boldness 0 — buries 0.70 of 1.65', () => {
    const ev = veteranWith({ loyalty: 5, strategic: 0, boldness: 0, temperament: 10 }, 'rivals');
    const preexisting = openThread('callback', CAST2, 3, 'seed');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('buries');
    expect(gs.tr.threads.find(t => t.id === preexisting.id).state).toBe('closed');
  });
});

describe('testing: the decoy-secret flagship forks on the TARGET\'s stats, four ways', () => {
  const CAST2 = ['Tester', 'Target'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }
  // ONE ROLL, FOUR STAT LINES. kept = loy*.05 + temp*.03 + .1; innocent =
  // soc*.05 + .15; malicious = strat*.05 + (10-loy)*.04; caught = int*.06.
  // 0.7 rather than 0.5 because `caughtTest` cannot hold the midpoint: at
  // intuition 10 with every other stat at 0 it is 0.60 of a 1.25 total, i.e.
  // 48%, and lowering the others raises kept instead. 0.7 is inside all four
  // branches' best bands (kept < .857, innocent .37-.90, malicious > .22,
  // caught > .52).
  const ROLL = 0.7;

  function targetWith(stats) {
    setup(CAST2, [makePlayer('Tester', 'floater'), makePlayer('Target', 'floater', stats)]);
    return EVENTS.find(e => e.id === 'testing-decoy-secret');
  }

  it('KEEPS IT QUIET and the thread closes clean: loyalty 10, temperament 10 — kept 0.90 of 1.05', () => {
    const ev = targetWith({ loyalty: 10, temperament: 10, social: 0, strategic: 0, intuition: 0 });
    const t = openThread('testing', CAST2, 3, 'seed');
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('keptQuiet');
    expect(result.bondDelta).toBeGreaterThan(0);
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });

  it('REPEATS IT INNOCENTLY: the same roll, social 10 with loyalty still high — innocent 0.65 of 1.22', () => {
    const ev = targetWith({ loyalty: 7, temperament: 0, social: 10, strategic: 0, intuition: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('innocent');
  });

  it('REPEATS IT MALICIOUSLY: the same roll, loyalty 0 and strategic 10 — malicious 0.90 of 1.15', () => {
    const ev = targetWith({ loyalty: 0, temperament: 0, social: 0, strategic: 10, intuition: 0 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('malicious');
    expect(result.bondDelta).toBeLessThan(-1);
  });

  it('CATCHES THE TEST: the same roll and the same loyalty 0, intuition 10 instead of strategic 10 — caught 0.60 of 1.25', () => {
    const ev = targetWith({ loyalty: 0, temperament: 0, social: 0, strategic: 0, intuition: 10 });
    const result = ev.fire(ctxFor(4), scriptedRng([ROLL]));
    expect(result.branch).toBe('caughtTest');
  });
});


// ══════════════════════════════════════════════════════════════════════
// CITING RESIDUE (Plan 5 Task 2) — the pool-level half
// ══════════════════════════════════════════════════════════════════════
//
// Spec §5.4.4: "Residue is what lets episode 7's accusation name episode 2."
// Until this task `residue` was write-only — every event fed it and NOTHING
// read it back — so no line the castle ever produced referred to an earlier
// moment. tr-threads.test.js guards the read side in isolation; this guards
// that the real pool actually uses it, which is the half that would otherwise
// rot into a helper nobody calls.
//
// WRITTEN AS A RULE OVER THE POOL, not a list of the events Task 2 happened to
// touch: any event declaring `citesResidue` must, when its actors walk in
// carrying a story that already has earlier beats, WRITE a note naming one of
// those beats by day. Add a citing event and forget the citation and this goes
// red without anyone editing the test.
//
// THE MUTATION: `residueFor` returning `[]` unconditionally. Every citation is
// built from residue, so the whole describe block goes red.
describe('events cite residue: episode 7 names episode 2', () => {
  /**
   * probeWorld seeds a two-beat thread of every kind on both the pair and each
   * actor alone (eps 3 and 4, PROBE_EP is 5). One more beat makes them three,
   * which is the spec's worked example — a payoff naming all three moments.
   */
  function worldWithHistory() {
    probeWorld({ aTraitor: true, bTraitor: false, turret: true });
    for (const t of gs.tr.threads) advanceThread(t.id, PROBE_EP - 1, `the ${t.kind} moment`);
    // Three preconditions probeWorld does not supply, added HERE rather than
    // there because probeWorld is shared with the belief gate and the
    // ground-truth probes, and moving their world moves their measurements:
    //   - a SECOND death (grief-toast-to-them wants the castle to have lost
    //     more than one person before it holds a ritual about it);
    //   - a betrayal on the ledger, since probeWorld's A/B are allies and
    //     `allies` wins the relation priority (callback-warns-newbies);
    //   - a THIRD player with a season in common with B, so there is a
    //     conversation for A to be left out of (callback-no-history-envy).
    const [A, B, C] = PROBE_CAST;
    gs.tr.rounds.push({ ep: PROBE_EP - 2, murdered: PROBE_CAST[4], murderTarget: PROBE_CAST[4] });
    setFranchiseLedger({
      v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
        '1': { seasonName: 'S1', format: 'total-drama', players: {
          [A]: { allies: [B], rivals: [B], betrayed: [], betrayedBy: [B], showmances: [{ partner: B, ended: 'breakup' }], finalist: true },
          [B]: { allies: [A], rivals: [A], betrayed: [A], betrayedBy: [], showmances: [{ partner: A, ended: 'breakup' }], finalist: true },
        } },
        '2': { seasonName: 'S2', format: 'total-drama', players: {
          [A]: { allies: [], rivals: [B], betrayed: [], betrayedBy: [B], showmances: [], finalist: false },
          [B]: { allies: [C], rivals: [A], betrayed: [A], betrayedBy: [], showmances: [], finalist: true },
          [C]: { allies: [B], rivals: [], betrayed: [], betrayedBy: [], showmances: [], finalist: false },
        } },
      } } },
    });
  }

  const citing = () => EVENTS.filter(e => e.citesResidue);

  it('every event declaring citesResidue names an earlier day in the note it writes', () => {
    const [A, B] = PROBE_CAST;
    const ctx = () => ({ ep: PROBE_EP, window: 'evening', act: 'middle',
      living: [...PROBE_CAST], actors: [A, B] });

    // TWO WORLDS, because one cannot hold every precondition at once. The hot
    // world has every thread just fed; `susp-cold-case-revival` needs the
    // opposite — a thread cooled to somewhere in (0, 1) heat, which is the
    // "she never let it go" state and is unreachable four days after the last
    // beat. Same history, read four rounds later.
    const silent = [], ineligible = [];
    for (const ev of citing()) {
      let c = null;
      for (const ep of [PROBE_EP, PROBE_EP + 4]) {
        worldWithHistory();
        if (ep !== PROBE_EP) gs.tr.rounds.push({ ep: ep - 1, murdered: PROBE_CAST[3], murderTarget: PROBE_CAST[3] });
        const candidate = { ...ctx(), ep };
        if (ev.weight(candidate) > 0) { c = candidate; break; }
      }
      if (!c) { ineligible.push(ev.id); continue; }
      const before = new Set(residueFor(A).concat(residueFor(B)).map(r => `${r.threadId}:${r.ep}:${r.note}`));
      ev.fire(c, forkRng(0.5));
      const written = residueFor(A).concat(residueFor(B))
        .filter(r => !before.has(`${r.threadId}:${r.ep}:${r.note}`));
      // Named by DAY, and the day named must be one that really happened
      // earlier on that thread — a citation that invented a number would read
      // exactly as well and be a lie.
      const cited = written.some(r => /(^|[^0-9a-z])day [1-4]([^0-9]|$)/.test(r.note || ''));
      if (!cited) silent.push(`${ev.id} -> ${JSON.stringify(written.map(w => w.note))}`);
    }

    expect(ineligible, 'these citing events could not be made eligible in the probe world, '
      + 'so this sweep never exercised them — a citation nothing can reach is dead content')
      .toEqual([]);
    expect(silent, 'these events declare citesResidue and wrote no note naming an earlier day')
      .toEqual([]);
  });

  it('the pool actually contains citing events, in more than one family', () => {
    // Non-vacuity, and the floor that makes the sweep above mean something: it
    // passes trivially over an empty set. 8 is under the shipped count with
    // room for ordinary drift; the family spread is what stops one file
    // carrying the whole mechanism.
    const ids = citing().map(e => e.id);
    const families = new Set(citing().map(e => e.family));
    console.log(`=== CITING EVENTS (${ids.length}) === ${ids.join(', ')}`);
    expect(ids.length, 'almost nothing in the pool cites residue').toBeGreaterThanOrEqual(8);
    expect(families.size, 'residue citation is confined to one family').toBeGreaterThanOrEqual(4);
  });

  it('a citing event on a FRESH pair says nothing about days that never happened', () => {
    // The degradation case, and the one that actually happens: 73.9% of
    // threads die at beat one. An event that only reads well on a long thread
    // is content nobody sees, and one that emits "It went back to day
    // undefined" on a fresh pair is worse than no citation at all.
    probeWorld({ aTraitor: true, bTraitor: false, turret: true });
    const [, , C, D] = PROBE_CAST;   // a pair with no thread of any kind
    const ctx = { ep: PROBE_EP, window: 'evening', act: 'middle',
      living: [...PROBE_CAST], actors: [C, D] };
    let fired = 0;
    for (const ev of citing()) {
      if (ev.weight(ctx) <= 0) continue;
      ev.fire(ctx, forkRng(0.5));
      fired++;
    }
    const notes = residueFor(C).concat(residueFor(D)).map(r => r.note || '');
    expect(fired, 'no citing event was eligible on a fresh pair — this check is vacuous')
      .toBeGreaterThan(0);
    expect(notes.filter(n => /day /.test(n)), 'a fresh pair was handed a citation of a day '
      + 'that never happened to them').toEqual([]);
    expect(notes.filter(n => /undefined|NaN/.test(n))).toEqual([]);
  });
});
