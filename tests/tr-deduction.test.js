// Alignment is the one fact nobody in this game ever observes.
//
// Every other fact type in js/knowledge.js can be witnessed: a vote is cast in
// front of people, an idol is found, an alliance meets. Alignment is different —
// the Traitors know theirs, and NOBODY else can ever do better than infer. That
// asymmetry is the whole format, and it is enforced here by credibility ceiling
// rather than by special-casing every reader.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes, learn, propagate } from '../js/knowledge.js';
import { setRelationshipDimension } from '../js/relationships.js';
import {
  selectTraitors, recordAlignment, alignmentAt, truthAtLearn,
} from '../js/tr/roles.js';
import {
  alignmentFactId, seedTraitorKnowledge, recordRound, ballotEvidence, suspicion,
} from '../js/tr/deduction.js';

const CAST = ['Gwen', 'Duncan', 'Heather', 'Owen', 'Leshawna', 'Noah'];
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

beforeEach(() => {
  // js/core.js exports `gs` as null until a season exists, so a test that
  // reaches for gs.tr before setGs() throws on a null read rather than failing
  // its assertion. setGs replaces the live binding; the imported `gs` updates.
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
});

describe('choosing the traitors', () => {
  it('picks the number asked for, from the living cast, without repeats', () => {
    const picked = selectTraitors(CAST, { traitorCount: 2 }, seededRng(7));
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    picked.forEach(n => expect(CAST).toContain(n));
  });

  it('is deterministic for a given seed, because a season must replay', () => {
    const a = selectTraitors(CAST, { traitorCount: 2 }, seededRng(42));
    const b = selectTraitors(CAST, { traitorCount: 2 }, seededRng(42));
    expect(a).toEqual(b);
  });

  it('does not always pick the same archetypes — a bad traitor is good television', () => {
    const seen = new Set();
    for (let s = 1; s <= 40; s++) {
      selectTraitors(CAST, { traitorCount: 2 }, seededRng(s)).forEach(n => seen.add(n));
    }
    // Over 40 seeds every member of a 6-cast should have been picked at least once.
    expect(seen.size).toBe(CAST.length);
  });
});

describe('alignment as ground truth', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
  });

  it('answers who is what', () => {
    expect(alignmentAt('Gwen', 1)).toBe('traitor');
    expect(alignmentAt('Heather', 1)).toBe('faithful');
  });

  it('keeps eras, so a later flip does not rewrite an earlier truth', () => {
    // Heather is recruited in episode 8. She was genuinely Faithful before it.
    recordAlignment('Heather', true, 8, 'recruitment');
    expect(alignmentAt('Heather', 3)).toBe('faithful');
    expect(alignmentAt('Heather', 8)).toBe('traitor');
    expect(alignmentAt('Heather', 11)).toBe('traitor');
    // And the record says how and when, for the VP and the exit blowup.
    const flip = gs.tr.roleHistory.find(r => r.name === 'Heather' && r.via === 'recruitment');
    expect(flip).toMatchObject({ from: 'faithful', to: 'traitor', ep: 8 });
  });

  it('reports the truth as it stood when a belief was formed', () => {
    recordAlignment('Heather', true, 8, 'recruitment');
    expect(truthAtLearn('Heather', 3)).toBe(false);   // a correct read in ep 3
    expect(truthAtLearn('Heather', 9)).toBe(true);
  });

  it('a second write for the SAME episode wins, without corrupting earlier eras', () => {
    // Two calls land on episode 5 (e.g. a correction, or an ultimatum reversed
    // within the same episode). recordAlignment() re-sorts on every append and
    // Array.prototype.sort is stable, so the later write becomes authoritative
    // for episode 5 onward without touching what was true in episode 3.
    recordAlignment('Owen', true, 5, 'recruitment');
    recordAlignment('Owen', false, 5, 'ultimatum');
    expect(alignmentAt('Owen', 3)).toBe('faithful');   // untouched by either ep-5 write
    expect(alignmentAt('Owen', 5)).toBe('faithful');   // the later write wins
    expect(alignmentAt('Owen', 11)).toBe('faithful');
  });
});

describe('what the traitors know, and what nobody else can', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('lets each traitor know the other with certainty', () => {
    const b = believes('Gwen', alignmentFactId('Duncan'), 1);
    expect(b, 'Gwen does not know her own ally').toBeTruthy();
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
    expect(b.valence).toBe('accurate');
  });

  it('tells the faithful nothing at all at the start', () => {
    for (const target of CAST) {
      expect(believes('Heather', alignmentFactId(target), 1),
        `Heather already has a read on ${target}`).toBeNull();
    }
  });

  it('CEILING: a faithful can never reach certainty about anyone', () => {
    // Even the strongest inference this engine can express stays a guess.
    // `if (b) expect(...)` would be vacuous: learn() returns null on a failed
    // read roll or a missing fact, and the assertion would never run. Assert the
    // belief EXISTS, then assert against the real ceiling — the `deduced` tier's
    // 0.62 — rather than a 0.7 that nothing could ever reach anyway.
    learn('Heather', alignmentFactId('Gwen'),
      { source: 'ballots', sourceType: 'deduced', ep: 4, rng: () => 0.01 });
    const b = believes('Heather', alignmentFactId('Gwen'), 4);
    expect(b, 'the strongest inference the engine can express formed no belief at all').toBeTruthy();
    expect(b.effectiveConfidence).toBeLessThanOrEqual(0.62);

    // And the ceiling must be STRUCTURAL, not arithmetic. An explicit
    // `confidence` bypasses the SOURCE_CRED tier table for every other fact
    // type; for alignment it must be clamped, or one future call site hands a
    // Faithful the certainty the whole format depends on them never having.
    learn('Noah', alignmentFactId('Gwen'),
      { source: 'a hunch', sourceType: 'deduced', confidence: 0.95, ep: 4, rng: () => 0.01 });
    const shouted = believes('Noah', alignmentFactId('Gwen'), 4);
    expect(shouted, 'no belief formed from a maximal claim').toBeTruthy();
    expect(shouted.effectiveConfidence,
      'an explicit confidence sailed past the alignment ceiling').toBeLessThanOrEqual(0.62);
  });

  it('CEILING HOLDS THROUGH GOSSIP: propagate() must never hop an alignment belief', () => {
    // Gwen holds Duncan's alignment at `public` (~1.0) — she was told it in the
    // turret. Heather is a maximally-trusted contact of Gwen's. Without the
    // propagate() guard, the hop formula (effectiveConfidence * 0.85 *
    // trustMultiplier) launders that ~1.0 straight past the 0.62/0.45 ceiling
    // and hands Heather near-certainty about who Duncan is — exactly the
    // asymmetry the format depends on breaking down.
    setRelationshipDimension('Heather', 'Gwen', 'trust', 10);
    propagate(1, {
      // Force Gwen's one gossip roll to land on Heather, deterministically.
      contacts: (knower) => (knower === 'Gwen' ? { allies: ['Heather'], others: [] } : { allies: [], others: [] }),
      // Low draws clear every acceptance/selection gate in propagate() and
      // _assess(), so if the guard is missing the hop goes through at close
      // to its maximum possible confidence.
      rng: () => 0.01,
    });
    const belief = believes('Heather', alignmentFactId('Duncan'), 1);
    expect(belief, 'alignment must never spread through generic gossip').toBeNull();
  });
});

describe('reading the ballots', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    ['Heather', 'Owen', 'Leshawna', 'Noah'].forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  // THE TWO POPULATION TESTS THAT USED TO STAND HERE ARE GONE WITH THE CODE
  // THEY TESTED.
  //
  // They asserted that ballotEvidence() indicts the people who defended a
  // revealed Traitor. It no longer does, deliberately: revealCascade() emits
  // that indictment once, at the moment of the reveal, and ballotEvidence used
  // to re-emit it every round thereafter at a HIGHER confidence — which, via
  // learn()'s overwrite-on-equal-or-greater-confidence rule, kept stripping the
  // protective `valence: 'false'` off innocent people rather than sharpening
  // anything. See the long note in js/tr/deduction.js.
  //
  // The mechanism is NOT untested. It is tested where it now lives, by
  // 'punishes the people who kept them in (population)' in the reveal describe
  // below — the same scenario, the same population shape, the same threshold.
  // What is asserted here instead is the DELETION, so that re-adding the loop
  // goes red rather than silently passing.
  it('does NOT re-indict the defenders of a revealed traitor — the cascade owns that', () => {
    gs.activePlayers = ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah'];
    recordRound({
      ep: 1, banished: 'Duncan', banishedWasTraitor: true, murdered: null,
      ballots: [
        { voter: 'Heather',  voted: 'Duncan', channel: 'banishment' },
        { voter: 'Leshawna', voted: 'Duncan', channel: 'banishment' },
        { voter: 'Noah',     voted: 'Duncan', channel: 'banishment' },
        { voter: 'Owen',     voted: 'Noah',   channel: 'banishment' },
      ],
    });
    // One round only, so the pair rule (which needs three shared voting rounds)
    // cannot fire and anything formed here would have to come from the reveal
    // walk. Across a hundred seeds, not one belief may be formed.
    for (let seed = 1; seed <= 100; seed++) {
      expect(ballotEvidence(2, seededRng(seed)),
        'ballotEvidence is re-walking reveals again — revealCascade already did this'
      ).toEqual([]);
    }
    expect(suspicion('Heather', 'Owen', 2)).toBe(0);
  });

  it('notices a pair who never once vote for each other', () => {
    // Gwen and Duncan are the real Traitors and never touch each other.
    for (let ep = 1; ep <= 4; ep++) {
      recordRound({
        ep, banished: null, banishedWasTraitor: false, murdered: null,
        ballots: [
          { voter: 'Gwen',     voted: 'Noah',     channel: 'banishment' },
          { voter: 'Duncan',   voted: 'Noah',     channel: 'banishment' },
          { voter: 'Heather',  voted: 'Gwen',     channel: 'banishment' },
          { voter: 'Leshawna', voted: 'Duncan',   channel: 'banishment' },
          { voter: 'Noah',     voted: 'Heather',  channel: 'banishment' },
          { voter: 'Owen',     voted: 'Leshawna', channel: 'banishment' },
        ],
      });
    }
    ballotEvidence(5, seededRng(11));
    // Somebody should have noticed. This is a WEAK signal by design — innocent
    // friends also never vote for each other — so assert only that it registered.
    const pairRead = suspicion('Heather', 'Gwen', 5) + suspicion('Heather', 'Duncan', 5);
    expect(pairRead).toBeGreaterThan(0);
  });

  it('never lets a ballot read reach certainty', () => {
    // Six rounds of the SAME silent pair, so the pair signal is re-learned as
    // many times as the engine will ever re-learn anything. learn()'s tier
    // ceiling for a `deduced` alignment is 0.62 and no pile of hints may pass
    // it. (This used to drive the ceiling through the reveal walk; that walk is
    // deleted, so it drives it through the only ballot signal left.)
    for (let ep = 1; ep <= 6; ep++) {
      recordRound({
        ep, banished: null, banishedWasTraitor: false, murdered: null,
        ballots: [
          { voter: 'Gwen',     voted: 'Noah',     channel: 'banishment' },
          { voter: 'Duncan',   voted: 'Noah',     channel: 'banishment' },
          { voter: 'Heather',  voted: 'Gwen',     channel: 'banishment' },
          { voter: 'Leshawna', voted: 'Duncan',   channel: 'banishment' },
          { voter: 'Noah',     voted: 'Heather',  channel: 'banishment' },
          { voter: 'Owen',     voted: 'Leshawna', channel: 'banishment' },
        ],
      });
    }
    ballotEvidence(7, seededRng(5));
    expect(suspicion('Heather', 'Gwen', 7)).toBeLessThan(0.62);
    expect(suspicion('Heather', 'Duncan', 7)).toBeLessThan(0.62);
  });
});

import { suspicionBoard, chooseBanishmentVote } from '../js/tr/deduction.js';
import { setBond } from '../js/bonds.js';

describe('turning belief into a vote', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    ['Heather', 'Owen', 'Leshawna', 'Noah', 'Duncan'].forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('ranks by belief, and never nominates the voter', () => {
    learn('Heather', alignmentFactId('Gwen'),
      { source: 't', sourceType: 'deduced', confidence: 0.6, ep: 2, rng: () => 0.01 });
    const board = suspicionBoard('Heather', 2);
    expect(board[0].name).toBe('Gwen');
    expect(board.map(r => r.name)).not.toContain('Heather');
  });

  it('a strong bond protects somebody the evidence points at', () => {
    learn('Heather', alignmentFactId('Gwen'),
      { source: 't', sourceType: 'deduced', confidence: 0.6, ep: 2, rng: () => 0.01 });
    const cold = suspicion('Heather', 'Gwen', 2);
    setBond('Heather', 'Gwen', 9);
    const warm = suspicion('Heather', 'Gwen', 2);
    expect(warm, 'a close friend is suspected exactly as much as a stranger').toBeLessThan(cold);
  });

  it('a traitor does not name a fellow while the castle is full and the pot empty', () => {
    // This used to read 'never', and 'never' is no longer true — see the pact
    // price in deduction.js and the band of tests on it below. What is true is
    // what this fixture is: six living, nothing in the pot, and a Faithful
    // available to spend instead.
    recordAlignment('Duncan', true, 1, 'selection');
    seedTraitorKnowledge(1);
    const pick = chooseBanishmentVote('Gwen', ['Duncan', 'Heather', 'Owen'], 2, seededRng(9));
    expect(pick).not.toBe('Duncan');
  });

  it('with no evidence at all, the room does not converge', () => {
    // Round one: nobody knows anything. Votes must scatter, or the format is
    // decided before it starts.
    const picks = ['Heather', 'Owen', 'Leshawna', 'Noah', 'Duncan']
      .map((v, i) => chooseBanishmentVote(v, ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah', 'Duncan'], 1, seededRng(i + 1)));
    expect(new Set(picks).size, 'the whole room picked the same name on no information').toBeGreaterThan(1);
  });
});

import { revealCascade } from '../js/tr/deduction.js';

describe('the reveal, and what it does to everybody else', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    ['Heather', 'Owen', 'Leshawna', 'Noah'].forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('makes a banished traitor a certainty for everyone left', () => {
    gs.activePlayers = ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah'];
    revealCascade('Duncan', true, 3, seededRng(2));
    const b = believes('Heather', alignmentFactId('Duncan'), 3);
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
  });

  // The re-scoring half runs every formed belief through learn()'s accept-gate
  // and detect-roll, exactly like ballotEvidence() above — a single seed tests
  // one draw of that coin, not the underlying tendency. Leshawna's read of
  // Heather is structurally always 0 here (Heather voted correctly, so
  // revealCascade never even calls learn() about her); Leshawna's read of Owen
  // only registers if the belief about him clears both gates. So this is a
  // population test, same shape as the two in 'reading the ballots' above.
  it('punishes the people who kept them in (population)', () => {
    const N = 100;
    let hits = 0;
    for (let seed = 1; seed <= N; seed++) {
      resetKnowledge();
      gs.tr = initTraitorsState();
      recordAlignment('Gwen', true, 1, 'selection');
      recordAlignment('Duncan', true, 1, 'selection');
      ['Heather', 'Owen', 'Leshawna', 'Noah'].forEach(n => recordAlignment(n, false, 1, 'selection'));
      seedTraitorKnowledge(1);
      gs.activePlayers = ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah'];
      recordRound({
        ep: 3, banished: 'Duncan', banishedWasTraitor: true, murdered: null,
        ballots: [
          { voter: 'Owen',     voted: 'Noah',   channel: 'banishment' },
          { voter: 'Heather',  voted: 'Duncan', channel: 'banishment' },
          { voter: 'Leshawna', voted: 'Duncan', channel: 'banishment' },
          { voter: 'Noah',     voted: 'Duncan', channel: 'banishment' },
        ],
      });
      revealCascade('Duncan', true, 3, seededRng(seed));
      if (suspicion('Leshawna', 'Owen', 3) > suspicion('Leshawna', 'Heather', 3)) hits++;
    }
    const rate = hits / N;
    console.log(`[population] reveal cascade punishes a defender: ${hits}/${N} (${(rate * 100).toFixed(1)}%)`);
    expect(rate, 'defending a revealed traitor at the moment of reveal should read as suspicious in a solid minority of draws, not never').toBeGreaterThan(0.15);
  });

  it('a banished faithful teaches the room something too — they were wrong', () => {
    gs.activePlayers = ['Gwen', 'Duncan', 'Heather', 'Leshawna', 'Noah'];
    revealCascade('Owen', false, 3, seededRng(2));
    const b = believes('Heather', alignmentFactId('Owen'), 3);
    expect(b.valence).toBe('false');   // correctly disbelieved: he was not one
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE PACT HAS A PRICE
// ══════════════════════════════════════════════════════════════════════
//
// chooseBanishmentVote used to filter fellow Traitors out of the pool
// outright, and the measurement of that is the reason this file has a section:
// ZERO Traitor-on-Traitor votes in 1,996 seasons. The endgame is entirely about
// the night one Traitor decides the pot is worth more than the pact, so an
// absolute bar makes the format's last act unreachable.
//
// ASSERTED AT THE DECISION POINT, AND THAT IS DELIBERATE. Task 4 of this plan
// shipped a population guard that a mutation SURVIVED, because the state it
// forbade arose in 22 seasons out of 400 and the sample barely contained the
// case. A betrayal is rarer than that by construction — making it rare is what
// the price is FOR — so every assertion here is over CALLS to the decision, not
// over seasons that happen to contain one, and each states how many calls it
// saw. The population arm lives in tests/tr-calibration.test.js and carries a
// coverage floor for the same reason.
import { initTraitorsState as _initTr } from '../js/tr/state.js';

const PACT_CAST = ['Amy', 'Beth', 'Cody', 'Dawn', 'Ezekiel', 'Fang', 'Gwen', 'Harold',
  'Izzy', 'Jo', 'Katie', 'Lindsay', 'Mike', 'Noah', 'Owen', 'Pete', 'Quinn', 'Rita',
  'Sam', 'Tyler'];
const PACT_CEILING = 120000;
const TA = 'Amy', TB = 'Beth';

/**
 * A room of `n` living with `potShare` of the pot won, `a` and `b` the Traitors.
 *
 * The Faithfuls are given a read on each other at the alignment ceiling, so the
 * voter has somewhere else to go. A fixture where the fellow Traitor is the
 * only name with a number on it would betray at any price at all and would be
 * measuring the fixture rather than the rule — the same failure Task 4's unit
 * test reported at 60/60.
 */
function pactRoom(n, potShare, a, b, ep) {
  const living = PACT_CAST.slice(0, n);
  setGs({ bonds: {}, activePlayers: [...living] });
  gs.tr = _initTr();
  gs.tr.potCeiling = PACT_CEILING;
  gs.tr.pot = PACT_CEILING * potShare;
  resetKnowledge();
  living.forEach(name => recordAlignment(name, name === a || name === b, 1, 'selection'));
  seedTraitorKnowledge(ep);
  // 0.4 is not arbitrary: _assess() rolls acceptance, then rolls again for
  // whether a sharp reader sees through a claim about someone who is NOT a
  // Traitor. At 0.01 the voter sees through all three, the board goes blank,
  // and the fixture betrays at any price because the fellow is the only name
  // on it. 0.4 accepts and does not detect, which is the room the engine
  // actually produces: a fellow Traitor at ~0.92 and the best Faithful at
  // ~0.56, with a 0.35 noise term over each.
  living.filter(x => x !== a && x !== b).forEach(f =>
    learn(a, alignmentFactId(f),
      { source: 'the record', sourceType: 'deduced', confidence: 0.62, ep, rng: () => 0.4 }));
  return living;
}

/**
 * How often, over `pairs x nights x seeds` decisions, a Traitor names the fellow.
 *
 * It sweeps the PAIR and the NIGHT as well as the rng seed on purpose. The
 * fellow Traitor's noise term is hashed from (voter, fellow, night) rather than
 * drawn — see pactNoise in deduction.js for why the draw count has to be
 * preserved — so a sweep that varied only the rng seed would hold the fellow's
 * score constant and read 0% or 100% on the hash rather than on the price.
 */
function betrayalRate(n, potShare) {
  let betrayals = 0, calls = 0;
  for (let i = 0; i < n; i++) {
    const a = PACT_CAST[i], b = PACT_CAST[(i + 1) % n];
    for (let ep = 2; ep <= 21; ep++) {
      const living = pactRoom(n, potShare, a, b, ep);
      const pool = living.filter(x => x !== a);
      for (let s = 1; s <= 6; s++) {
        calls++;
        if (chooseBanishmentVote(a, pool, ep, seededRng(s)) === b) betrayals++;
      }
    }
  }
  return betrayals / calls;
}

describe('the pact has a price, and the price is not infinity', () => {
  it('IS PAID in a full castle with nothing in the pot: no fellow is ever named', () => {
    // 2,400 decisions, not 2,400 seasons. The rule is decided here every time.
    const rate = betrayalRate(20, 0);
    expect(rate, 'a Traitor is naming the pact on night one — the price is not being charged')
      .toBe(0);
  });

  it('IS AFFORDABLE at the last table with the pot up: the pact does break', () => {
    // THE TEST THE HARD FILTER FAILS. Five living, 70% of the pot won.
    const rate = betrayalRate(5, 0.7);
    expect(rate, 'no Traitor ever turned on a fellow in 600 decisions at the last '
      + 'table with the pot up — the endgame is unreachable')
      .toBeGreaterThan(0);
    // And it is a PRICE, not a new bar in the other direction: a room where
    // the fellow is always named is a bar too, just an inverted one.
    expect(rate, 'the fellow Traitor is named every single time — this is a bar, not a price')
      .toBeLessThan(1);
  });

  it('FALLS WITH THE FIELD and RISES WITH THE POT, proportionally in both', () => {
    // Both terms varied against the same room, so nothing else moves.
    //
    // Measured over 600 decisions per arm: a room of six at 70% of the pot
    // 0.0%, a room of five at 10% of the pot 0.0%, five at 70% 14.8%, five at
    // 90% 80.3%. Binomial sd at n=600 and p=0.15 is 1.5pp, so the 0.10 margins
    // below stand at roughly 7 sd of the sampling noise on the arm that has
    // any. The FIELD arm is deliberately the adjacent room — six against five,
    // not eighteen against five — because a gradient between neighbouring
    // rooms is the claim, and a distant comparison would be passed by a step.
    const late = betrayalRate(5, 0.7);
    const oneBigger = betrayalRate(6, 0.7);
    const emptyPot = betrayalRate(5, 0.1);
    const fullPot = betrayalRate(5, 0.9);

    expect(late, 'the field term is inert — a room of six prices the pact the '
      + 'same as a room of five').toBeGreaterThan(oneBigger + 0.10);
    expect(late, 'the pot term is inert — a Traitor turns as readily on an empty '
      + 'pot as on a full one').toBeGreaterThan(emptyPot + 0.10);
    expect(fullPot, 'the pot term stops mattering once the money is large')
      .toBeGreaterThan(late + 0.15);
  });

  it('never charges the price when there is nobody else left to name', () => {
    // A room that is only Traitors has only Traitors to write down, and the old
    // filter's `safe.length ? safe : pool` fallback said so. Kept, because a
    // reluctance applied uniformly to every candidate is not a reluctance.
    pactRoom(5, 0.7, TA, TB, 2);
    gs.activePlayers = [TA, TB, 'Cody'];
    recordAlignment('Cody', true, 2, 'selection');
    const pick = chooseBanishmentVote(TA, [TB, 'Cody'], 2, seededRng(3));
    expect([TB, 'Cody']).toContain(pick);
  });
});
