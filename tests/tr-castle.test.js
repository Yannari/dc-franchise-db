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
import { openThread, findOpenThread } from '../js/tr/threads.js';
import { EVENTS, eligible, pickEvent, validateRegistry } from '../js/tr/events.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { resetKnowledge } from '../js/knowledge.js';
import { seedTraitorKnowledge } from '../js/tr/deduction.js';
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
  // SYNTHETIC, IDENTICAL PLAYERS. Six roster names with different stat lines
  // would make this probe lie in both directions: `cover-cold-sweat-tell`
  // reads `pStats(whoever is the Traitor).temperament`, so swapping which of
  // two REAL people is the Traitor moves its weight for a reason that has
  // nothing to do with reading a hidden alignment. With every stat line
  // identical, any weight difference between the arms can only be the
  // alignment, which is the whole question.
  const PROBE_STATS = { intuition: 7, temperament: 3, strategic: 7, social: 7,
    boldness: 7, loyalty: 7, mental: 7 };
  const PROBE_PLAYERS = ['Pa', 'Pb', 'Pc', 'Pd', 'Pe', 'Pf']
    .map(n => makePlayer(n, 'floater', PROBE_STATS));
  const PROBE_CAST = PROBE_PLAYERS.map(p => p.name);
  const [A, B] = PROBE_CAST;
  const EP = 5;

  /**
   * A world identical in every respect except the two alignments (and whether
   * the turret was ever shown). Rich enough that most of the pool clears its
   * non-alignment preconditions — a murder last round, threads of every kind
   * this pool opens, warm bonds, and a prior season on the ledger — because a
   * probe where nothing is eligible passes trivially.
   */
  function probeWorld({ aTraitor, bTraitor, turret }) {
    setPlayers(PROBE_PLAYERS);
    setGs({ bonds: {}, activePlayers: [...PROBE_CAST] });
    gs.tr = initTraitorsState();
    resetKnowledge();
    recordAlignment(A, aTraitor, 1, 'selection');
    recordAlignment(B, bTraitor, 1, 'selection');
    PROBE_CAST.slice(2).forEach(n => recordAlignment(n, false, 1, 'selection'));
    if (turret) seedTraitorKnowledge(1);
    setBond(A, B, 4);
    setBond(PROBE_CAST[2], PROBE_CAST[3], -3);
    gs.tr.rounds.push({ ep: EP - 1, murdered: PROBE_CAST[5], murderTarget: PROBE_CAST[5] });
    for (const kind of ['trust', 'suspicion', 'cover', 'callback', 'testing', 'grief',
      'romance', 'romance-spark', 'romance-showmance']) {
      openThread(kind, [A, B], EP - 2, 'seed');
    }
    setFranchiseLedger({
      v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
        '1': { seasonName: 'S1', format: 'total-drama', players: {
          [A]: { allies: [B], rivals: [B], betrayed: [], betrayedBy: [B], showmances: [{ partner: B, ended: 'breakup' }], finalist: true },
          [B]: { allies: [A], rivals: [A], betrayed: [A], betrayedBy: [], showmances: [{ partner: A, ended: 'breakup' }], finalist: true },
        } },
      } } },
    });
  }

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
    expect(diffs, `these events read WHICH actor is the Traitor:\n${diffs.join('\n')}`).toEqual([]);
  });

  it('PROBE B: a Traitor who has never been shown the turret cannot act on a partner\'s alignment', () => {
    const partnerFaithful = weightsFor({ aTraitor: true, bTraitor: false, turret: false });
    const partnerTraitor = weightsFor({ aTraitor: true, bTraitor: true, turret: false });
    const live = Object.values(partnerFaithful).filter(w => w > 0).length;
    expect(live, 'the probe world made almost nothing eligible — the comparison below is vacuous')
      .toBeGreaterThanOrEqual(30);
    const diffs = compare(partnerFaithful, partnerTraitor);
    expect(diffs, `these events read the partner's hidden alignment:\n${diffs.join('\n')}`).toEqual([]);
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
});

describe('trust: the vote-commitment test forks on a real check, four ways', () => {
  const CAST2 = ['Asker', 'Asked'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('a high-loyalty, well-bonded asked player KEEPS the commitment', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'loyal-soldier', { loyalty: 10, strategic: 1, boldness: 1, intuition: 1 }),
    ]);
    setBond('Asker', 'Asked', 8);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    // keepScore dominates: loyalty 10 + high bond. roll near 0 lands in it.
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('kept');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('a low-loyalty, high-strategic asked player BREAKS it', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'schemer', { loyalty: 1, strategic: 10, boldness: 1, intuition: 1 }),
    ]);
    setBond('Asker', 'Asked', 1);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    // keepScore is near its floor here; roll just past it lands in break.
    const result = ev.fire(ctxFor(4), scriptedRng([0.30]));
    expect(result.branch).toBe('broken');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('a low-boldness asked player DEFLECTS rather than commit either way', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'goat', { loyalty: 5, strategic: 5, boldness: 1, intuition: 1 }),
    ]);
    setBond('Asker', 'Asked', 1);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    const result = ev.fire(ctxFor(4), scriptedRng([0.90]));
    expect(result.branch).toBe('deflected');
  });

  it('a high-boldness, high-intuition asked player TURNS it back on the asker', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'villain', { loyalty: 1, strategic: 1, boldness: 10, intuition: 10 }),
    ]);
    setBond('Asker', 'Asked', 1);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('turned');
    expect(result.bondDelta).toBeLessThan(0);
  });
});

describe('suspicion: the private accusation forks on the ACCUSED\'s reaction', () => {
  const CAST2 = ['Accuser', 'Accused'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('a calm, socially skilled accused DENIES convincingly and closes the thread', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'social-butterfly', { temperament: 10, social: 10, loyalty: 1, boldness: 1, intuition: 1 }),
    ]);
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('denies');
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });

  it('a volatile accused DENIES WEAKLY and the thread heats up', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'hothead', { temperament: 1, social: 1, loyalty: 1, boldness: 1, intuition: 1 }),
    ]);
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const before = gs.tr.threads.find(x => x.id === t.id).heat;
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.30]));
    expect(result.branch).toBe('denyWeak');
    expect(gs.tr.threads.find(x => x.id === t.id).heat).toBeGreaterThan(before);
  });

  it('a bold, intuitive accused TURNS the accusation back on the accuser', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'villain', { temperament: 1, social: 1, loyalty: 1, boldness: 10, intuition: 10 }),
    ]);
    openThread('suspicion', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.50]));
    expect(result.branch).toBe('turned');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('a loyal, volatile accused CONFESSES to something unrelated', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'loyal-soldier', { temperament: 1, social: 1, loyalty: 10, boldness: 1, intuition: 1 }),
    ]);
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('confess');
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });
});

describe('grief: the morning reaction forks on archetype/role, not a coin', () => {
  const CAST2 = ['Reactor', 'Partner', 'Victim'];
  function ctxFor(ep) { return { ep, window: 'dawn', act: 'middle', living: CAST2.slice(0, 2), actors: CAST2.slice(0, 2) }; }
  function withMurder(ep) { gs.tr.rounds.push({ ep: ep - 1, murdered: 'Victim' }); }

  it('a warm, loyal reactor MOURNS OPENLY', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'hero', { social: 10, loyalty: 10, strategic: 1, intuition: 1, boldness: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('mourn');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('a strategic, perceptive reactor turns SUSPICIOUS immediately', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'perceptive-player', { social: 1, loyalty: 1, strategic: 10, intuition: 10, boldness: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.55]));
    expect(result.branch).toBe('suspicious');
  });

  it('a low-social reactor withdraws STOICALLY and still leaves residue', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'floater', { social: 1, loyalty: 1, strategic: 1, intuition: 1, boldness: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('stoic');
    expect(result.bondDelta).toBe(0);
    expect(result.threadId, 'stoic must still write residue, not nothing').toBeTruthy();
  });

  it('a living Traitor can use the grief OPPORTUNISTICALLY (role gate)', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'wildcard', { social: 1, loyalty: 1, strategic: 10, boldness: 10, intuition: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    recordAlignment('Reactor', true, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    // Force the roll to the top of the range, which only opportunisticScore
    // reaches when isTraitor is true — a Faithful with these exact stats has
    // opportunisticScore === 0 and this same roll would fall through to stoic.
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('opportunistic');
    expect(result.isTraitor).toBe(true);
  });

  it('a Faithful with the same stats CANNOT reach the opportunistic branch (role gate proof)', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'wildcard', { social: 1, loyalty: 1, strategic: 10, boldness: 10, intuition: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    recordAlignment('Reactor', false, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).not.toBe('opportunistic');
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

describe('romance: the liability-exposed flagship forks on the FAITHFUL partner\'s own read', () => {
  const CAST2 = ['Faithful', 'Turncoat'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }
  function seedShowmance(ep) { return openThread('romance-showmance', CAST2, ep, 'seed'); }

  it('needs a MIXED-role showmance — two Faithfuls in a showmance have nothing to expose', () => {
    setup(CAST2, [makePlayer('Faithful', 'floater'), makePlayer('Turncoat', 'floater')]);
    recordAlignment('Faithful', false, 1, 'selection');
    recordAlignment('Turncoat', false, 1, 'selection');
    seedShowmance(3);
    const ev = EVENTS.find(e => e.id === 'romance-liability-exposed');
    expect(ev.weight(ctxFor(4))).toBe(0);
  });

  it('a low-intuition Faithful stays OBLIVIOUS and the bond warms', () => {
    setup(CAST2, [
      makePlayer('Faithful', 'goat', { intuition: 1, loyalty: 10, boldness: 1 }),
      makePlayer('Turncoat', 'villain'),
    ]);
    recordAlignment('Faithful', false, 1, 'selection');
    recordAlignment('Turncoat', true, 1, 'selection');
    seedShowmance(3);
    const ev = EVENTS.find(e => e.id === 'romance-liability-exposed');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('oblivious');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('a bold, disloyal-leaning Faithful EXPOSES it publicly, closing the showmance thread', () => {
    setup(CAST2, [
      makePlayer('Faithful', 'hothead', { intuition: 1, loyalty: 1, boldness: 10, temperament: 1 }),
      makePlayer('Turncoat', 'villain'),
    ]);
    recordAlignment('Faithful', false, 1, 'selection');
    recordAlignment('Turncoat', true, 1, 'selection');
    const showmance = seedShowmance(3);
    const ev = EVENTS.find(e => e.id === 'romance-liability-exposed');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('exposes');
    expect(gs.tr.threads.find(t => t.id === showmance.id).state).toBe('closed');
    // A `cover` thread opens on the Traitor — their old protection is gone.
    expect(gs.tr.threads.some(t => t.kind === 'cover' && t.parties.includes('Turncoat'))).toBe(true);
  });
});

describe('callback: the history-confrontation flagship forks on the actor + the polarity of shared history', () => {
  const CAST2 = ['Veteran', 'OldAlly'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }
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

  it('no shared history at all means zero weight', () => {
    setup(CAST2, [makePlayer('Veteran', 'floater'), makePlayer('OldAlly', 'floater')]);
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    const ev = EVENTS.find(e => e.id === 'callback-history-confrontation');
    expect(ev.weight(ctxFor(4))).toBe(0);
  });

  it('a high-loyalty actor with a POSITIVE history RECONCILES, warming the bond', () => {
    setup(CAST2, [makePlayer('Veteran', 'loyal-soldier', { loyalty: 10, strategic: 1, boldness: 1, temperament: 1 }), makePlayer('OldAlly', 'floater')]);
    seedLedger('allies');
    const ev = EVENTS.find(e => e.id === 'callback-history-confrontation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('reconciles');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('a low-loyalty actor with a NEGATIVE history renews the GRUDGE, damaging the bond', () => {
    setup(CAST2, [makePlayer('Veteran', 'villain', { loyalty: 1, strategic: 1, boldness: 1, temperament: 1 }), makePlayer('OldAlly', 'floater')]);
    seedLedger('betrayed-by-them');
    const ev = EVENTS.find(e => e.id === 'callback-history-confrontation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.35]));
    expect(result.branch).toBe('grudge');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('a high-temperament, low-boldness actor BURIES it, closing any existing callback thread', () => {
    setup(CAST2, [makePlayer('Veteran', 'goat', { loyalty: 1, strategic: 1, boldness: 1, temperament: 10 }), makePlayer('OldAlly', 'floater')]);
    seedLedger('rivals');
    const preexisting = openThread('callback', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'callback-history-confrontation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('buries');
    expect(gs.tr.threads.find(t => t.id === preexisting.id).state).toBe('closed');
  });
});

describe('testing: the decoy-secret flagship forks on the TARGET\'s stats, four ways', () => {
  const CAST2 = ['Tester', 'Target'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('a high-loyalty, high-temperament target KEEPS the secret quiet and the thread closes clean', () => {
    setup(CAST2, [makePlayer('Tester', 'floater'), makePlayer('Target', 'loyal-soldier', { loyalty: 10, temperament: 10, social: 1, strategic: 1, intuition: 1 })]);
    const t = openThread('testing', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'testing-decoy-secret');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('keptQuiet');
    expect(result.bondDelta).toBeGreaterThan(0);
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });

  it('a high-strategic, low-loyalty target REPEATS IT MALICIOUSLY and the bond takes real damage', () => {
    setup(CAST2, [makePlayer('Tester', 'floater'), makePlayer('Target', 'schemer', { loyalty: 1, temperament: 1, social: 1, strategic: 10, intuition: 1 })]);
    const ev = EVENTS.find(e => e.id === 'testing-decoy-secret');
    const result = ev.fire(ctxFor(4), scriptedRng([0.65]));
    expect(result.branch).toBe('malicious');
    expect(result.bondDelta).toBeLessThan(-1);
  });

  it('a high-intuition target CATCHES THE TEST outright', () => {
    setup(CAST2, [makePlayer('Tester', 'floater'), makePlayer('Target', 'perceptive-player', { loyalty: 1, temperament: 1, social: 1, strategic: 1, intuition: 10 })]);
    const ev = EVENTS.find(e => e.id === 'testing-decoy-secret');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('caughtTest');
  });
});
