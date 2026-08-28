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
  seerEvidence, seerClaimEvidence, SEER_CRED,
} from '../js/tr/deduction.js';
import { ALIGNMENT_CRED_CEILING } from '../js/knowledge.js';

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
import { _setPactWatch, _setPactPotBlind } from '../js/tr/deduction.js';

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

  it('and what the watch reports about the money is what the decision actually saw', () => {
    // (Whole-plan review, F7.) The `_pactWatch` payload carried a SECOND
    // private copy of `potShare` — `gs.tr.potCeiling ? (gs.tr.pot||0)/ceiling
    // : 0`, written inline in the file whose own comment on `potShare()` says
    // there must not be two copies, and the reason that comment exists is that
    // Task 2 lost a whole guard to a rule that lived in two places and drifted.
    //
    // The copy bypassed `_pactPotBlind`, which is the ONE control arm that
    // turns the pot off. So under the hold-out the decision was blind to the
    // money and the instrument measuring it was not — an ablation reporting
    // the value it had just ablated. Nothing read the field yet, which is why
    // it went unnoticed; this is the reader, and it asserts that the
    // measurement and the decision agree rather than re-deriving either.
    //
    // TWO ARMS, because a watch that reported a constant 0 would satisfy the
    // blinded arm on its own.
    const seen = { open: [], blind: [] };
    for (const blind of [false, true]) {
      const restore = _setPactPotBlind(blind);
      const stop = _setPactWatch(d => seen[blind ? 'blind' : 'open'].push(d.potShare));
      try {
        for (let ep = 2; ep <= 8; ep++) {
          const living = pactRoom(5, 0.7, TA, TB, ep);
          chooseBanishmentVote(TA, living.filter(x => x !== TA), ep, seededRng(ep));
        }
      } finally { stop(); restore(); }
    }
    expect(seen.open.length, 'the watch never fired — nothing was measured').toBeGreaterThan(5);
    expect(seen.blind.length).toBe(seen.open.length);
    // The pot is on the table and the watch says so.
    for (const v of seen.open) {
      expect(v, 'the watch reports no money in a room holding 70% of the ceiling')
        .toBeCloseTo(0.7, 6);
    }
    // And with the pot held out, the watch reports what the decision saw: none.
    for (const v of seen.blind) {
      expect(v, 'the pot was blinded for the DECISION and the watch still reported it — '
        + 'the measurement is reading a second copy of the rule').toBe(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE SEER — the one `observed` alignment belief, at the write itself
// ══════════════════════════════════════════════════════════════════════
//
// Spec §7.3, and §4.1's ceiling is what binds it. tests/tr-missions.test.js
// asserts the closed set over every write in a played season; this file
// asserts the SHAPE of the single sanctioned exception, at the function that
// makes it, where there is no sampling to hide behind.
//
// The three things the mechanic is, restated as assertions:
//
//   1. IT IS TRUE. The subject must confirm their alignment truthfully, so the
//      belief's valence tracks ground truth as of the read's own episode —
//      `accurate` over a Traitor, `false` over a Faithful — and never a roll.
//   2. ONLY THE SEER SEES IT. One belief, one knower. Nobody else in the store
//      moves at all.
//   3. WHAT EITHER OF THEM SAYS AFTERWARDS IS A RUMOUR. That is the clause
//      that protects the ceiling: the most credible thing anybody will ever
//      hold becomes, the moment it is spoken, one person's word.
describe('the Seer: the game\'s one `observed` alignment belief', () => {
  const SEER = 'Gwen', SUBJECT = 'Duncan', ROOM = ['Heather', 'Owen', 'Leshawna'];

  function board(traitors) {
    setGs({ bonds: {}, activePlayers: [...CAST] });
    gs.tr = initTraitorsState();
    resetKnowledge();
    CAST.forEach(n => recordAlignment(n, traitors.includes(n), 1, 'selection'));
    seedTraitorKnowledge(1);
  }

  /** Everything anybody in the store believes about anybody's alignment. */
  function snapshot() {
    const out = {};
    for (const subj of CAST) {
      for (const knower of CAST) {
        const b = believes(knower, alignmentFactId(subj), 9);
        if (b) out[`${knower}->${subj}`] = `${b.sourceType}|${b.confidence}|${b.valence}`;
      }
    }
    return out;
  }

  it('writes the truth about a Traitor, at `observed`, to the Seer and to nobody else', () => {
    board([SUBJECT, 'Heather']);
    // `snapshot()` IS A DIFF, NOT A RECOMPUTATION. A review flagged it as the
    // "test recomputes the value under test" shape and it is the opposite one:
    // it does not predict what the Seer will write, it records the whole belief
    // store before and after and asserts that EXACTLY ONE entry moved. The
    // value under test — the belief itself — is read off `seerEvidence`'s
    // return, and the snapshot's job is the negative half of the claim, which
    // no reconstruction of the Seer's own rule could make.
    const before = snapshot();
    const b = seerEvidence(SEER, SUBJECT, 9);

    expect(b, 'the read wrote nothing at all').toBeTruthy();
    expect(b.sourceType).toBe(SEER_CRED);
    expect(SEER_CRED).toBe('observed');
    // AT THE CEILING, NOT ABOVE IT. `observed` buys the direct branch of
    // learn() -- unconditional acceptance, valence from ground truth -- and
    // deliberately not a louder number: `blind-chess` is priced at exactly this
    // figure and there is no headroom above it for anything.
    expect(b.confidence).toBe(ALIGNMENT_CRED_CEILING);
    expect(b.valence, 'a Traitor read did not come back as a true belief').toBe('accurate');

    const after = snapshot();
    const moved = Object.keys(after).filter(k => after[k] !== before[k]);
    expect(moved, 'the private meeting was not private: somebody other than the Seer moved')
      .toEqual([`${SEER}->${SUBJECT}`]);
  });

  it('and the truth about a Faithful, which is the only clearing this engine can do', () => {
    // Task 3 recorded that the model cannot CLEAR anybody: `_assess` reads any
    // alignment traffic about a person as evidence against them, so writing an
    // exoneration leaves ~7 readers in 10 suspecting the person it exonerates.
    // The direct branch is the single exception and this is it, which is why
    // the exception may never be widened.
    board(['Heather']);
    // The Seer walks in already sure of them, at the loudest an inference goes.
    // The scripted rolls ARE the finding: _assess draws accept, then the
    // confidence jitter, then the lie-detection roll -- and a detection roll
    // that FAILS is what turns a true fact about an innocent into a suspicion
    // of them. Roughly seven readers in ten land here, which is why an
    // exoneration cannot be routed through this door.
    const script = [0.01, 0.5, 0.99];
    let i = 0;
    learn(SEER, alignmentFactId(SUBJECT), { sourceType: 'deduced', ep: 9, rng: () => script[i++] });
    const prior = believes(SEER, alignmentFactId(SUBJECT), 9);
    expect(prior?.valence, 'the fixture did not plant a suspicion to be cleared').toBe('accurate');
    expect(suspicion(SEER, SUBJECT, 9), 'the planted suspicion did not reach the board')
      .toBeGreaterThan(0);

    const b = seerEvidence(SEER, SUBJECT, 9);
    expect(b.sourceType).toBe('observed');
    expect(b.valence, 'a clean read did not overturn the suspicion sitting on top of it')
      .toBe('false');
    expect(suspicion(SEER, SUBJECT, 9),
      'the Seer still suspects somebody they watched confirm they were Faithful').toBe(0);
  });

  it('a claim about the meeting is a `rumor`, from either of them, true or false', () => {
    // THE CLAUSE THAT PROTECTS THE CEILING. Both parties may lie afterwards, so
    // neither can be believed, so nothing certain leaves that room. A claim
    // written at the tier it was FORMED at would hand the castle the Seer's
    // certainty on a sentence, which is the laundering §4.1 exists to stop.
    board([SUBJECT]);
    seerEvidence(SEER, SUBJECT, 9);

    // Truthful: the Seer names the Traitor they really saw.
    const heard = seerClaimEvidence(SEER, SUBJECT, CAST, 9, 'named');
    for (const l of heard) {
      const b = believes(l, alignmentFactId(SUBJECT), 9);
      expect(b.sourceType,
        `${l} heard a claim about the meeting and recorded it as ${b.sourceType}`).toBe('rumor');
      expect(b.confidence).toBeLessThanOrEqual(ALIGNMENT_CRED_CEILING);
    }
    expect(heard.length, 'nobody heard the claim at all: this guard observed nothing')
      .toBeGreaterThan(0);
    // The two people in the room are not an audience for a claim about it.
    expect(heard).not.toContain(SEER);
    expect(heard).not.toContain(SUBJECT);
    // And the Seer's OWN belief is untouched by having said it out loud.
    expect(believes(SEER, alignmentFactId(SUBJECT), 9).sourceType).toBe('observed');

    // A lie: the subject accuses the Seer, who is a Faithful. Same tier.
    const back = seerClaimEvidence(SUBJECT, SEER, CAST, 9, 'counter');
    for (const l of back) {
      expect(believes(l, alignmentFactId(SEER), 9).sourceType,
        'a lie about the meeting arrived louder than a rumour').toBe('rumor');
    }
    expect(back.length, 'the counter-accusation reached nobody').toBeGreaterThan(0);
  });

  it('costs the caller no rng draw, so a season with a Seer draws what one without drew', () => {
    // Task 6's technique, which is what keeps the endgame's tables comparable.
    // The read takes learn()'s direct branch (no roll at all) and the claims
    // run on a stream hashed from the claim, so neither touches the season's.
    // THIS USED TO COUNT A CALLBACK NOTHING COULD CALL (whole-plan review, F8).
    // It passed `counting` as a FOURTH argument to `seerEvidence(seer, subject,
    // ep)` and a SIXTH to `seerClaimEvidence(claimant, accused, listeners, ep,
    // tag)` — parameter positions that do not exist. JavaScript discards them
    // silently, so `draws` was structurally zero and `.toBe(0)` could not fail
    // for any implementation whatever, including one that called Math.random on
    // every line. It read as the strongest possible statement of the rule and
    // asserted nothing at all.
    //
    // WHAT ACTUALLY BINDS, in two arms that can each fail:
    //
    //   1. NEITHER FUNCTION DECLARES AN RNG PARAMETER. That is what makes the
    //      property structural rather than incidental: a caller cannot hand the
    //      season's stream in even by mistake. Checked by reading the parameter
    //      LIST and not by `Function.length`, which was the first draft and
    //      which the mutation walked straight through — `.length` counts only
    //      the parameters before the first default, so `(seer, subject, ep, rng
    //      = Math.random)` still reports 3 and the arm stayed green on exactly
    //      the change it exists to catch. The realistic way an rng gets into a
    //      function in this codebase is with a default; that is the case that
    //      has to fail.
    //   2. NEITHER TOUCHES `Math.random` while it runs, which is where a draw
    //      would have to come from once there is no parameter to take one on.
    //      This is the arm the old test was reaching for.
    //
    // The season-level consequence — a mandated season bit-identical with the
    // Seer and without it — is guarded separately in tr-powers.test.js over
    // nine projections. This is the local statement of why that holds.
    board([SUBJECT]);
    const params = (fn) => String(fn).slice(String(fn).indexOf('(') + 1,
      String(fn).indexOf(')')).split(',').map(s => s.trim().split('=')[0].trim()).filter(Boolean);
    for (const fn of [seerEvidence, seerClaimEvidence]) {
      const rngish = params(fn).filter(p => /rng|random/i.test(p));
      expect(rngish, `${fn.name} declares ${rngish.join(', ')} — the Seer can now be handed the `
        + "season's own stream, and a season with one stops drawing what a season without one drew")
        .toEqual([]);
    }

    const realRandom = Math.random;
    let draws = 0;
    Math.random = () => { draws++; return realRandom(); };
    try {
      seerEvidence(SEER, SUBJECT, 9);
      seerClaimEvidence(SEER, SUBJECT, CAST, 9, 'named');
    } finally { Math.random = realRandom; }
    expect(draws, 'the Seer reached for Math.random — a season with one no longer draws what a '
      + 'season without one drew').toBe(0);
  });

  it('reads the era, not the season-end alignment — a later flip does not unmake it', () => {
    // ALIGNMENT HAS ERAS and this trap has now caught three tasks. A read is
    // true AS OF the episode it happened; a subject recruited afterwards does
    // not make it retroactively false, and nothing may recompute alignment at
    // season end to check it.
    board([]);
    const b = seerEvidence(SEER, SUBJECT, 4);
    expect(b.valence, 'the read of a Faithful was not recorded as one').toBe('false');
    expect(truthAtLearn(SUBJECT, 4), 'the fixture did not start them Faithful').toBe(false);

    recordAlignment(SUBJECT, true, 8, 'recruitment');
    expect(alignmentAt(SUBJECT, 9), 'the recruitment did not take').toBe('traitor');
    // The belief is unchanged, and it was CORRECT when it was formed.
    const still = believes(SEER, alignmentFactId(SUBJECT), 9);
    expect(still.valence).toBe('false');
    expect(truthAtLearn(SUBJECT, 4),
      'the era model lost the episode-4 truth the read was made against').toBe(false);
  });
});
