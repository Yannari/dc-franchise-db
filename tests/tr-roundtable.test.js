// The Round Table is a group vote, which this engine has always been able to
// run. What is new is WHY a ballot gets written: not an alliance's target, but
// a belief about who somebody IS — formed in public, in front of everybody, and
// weighted by whether the room trusts the person making the accusation.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes } from '../js/knowledge.js';
import { recordAlignment } from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge, suspicion } from '../js/tr/deduction.js';
import { broadcast, runRoundTable } from '../js/tr/roundtable.js';
import { setBond } from '../js/bonds.js';

const CAST = ['Gwen', 'Duncan', 'Heather', 'Owen', 'Leshawna', 'Noah', 'Bridgette'];
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

beforeEach(() => {
  setGs({ bonds: {}, activePlayers: [...CAST] });   // gs is null until set — see Task 1
  gs.tr = initTraitorsState();
  resetKnowledge();
  recordAlignment('Gwen', true, 1, 'selection');
  recordAlignment('Duncan', true, 1, 'selection');
  CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
    .forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
});

describe('an accusation is heard by the whole room', () => {
  it('reaches everybody present, not a random contact', () => {
    // broadcast() OFFERS the claim to every listener in the room — unlike
    // propagate()'s gossip, which never talks to more than `maxPerFact`
    // (default 3) contacts no matter how big the room is. Whether any one
    // listener actually accepts it is a per-person read-skill roll, so a
    // single fixed seed can land on a quiet night. This searches seeds for a
    // Round Table where the room actually lights up, the same shape as the
    // tie search below: fail loudly if broad reach never happens, rather than
    // asserting on a draw we did not verify.
    let heard = null;
    for (let seed = 1; seed <= 80 && !heard; seed++) {
      setGs({ bonds: {}, activePlayers: [...CAST] });
      gs.tr = initTraitorsState();
      resetKnowledge();
      recordAlignment('Gwen', true, 1, 'selection');
      recordAlignment('Duncan', true, 1, 'selection');
      CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
        .forEach(n => recordAlignment(n, false, 1, 'selection'));
      seedTraitorKnowledge(1);
      broadcast('Heather', 'Owen', 2, seededRng(seed));
      const h = CAST.filter(n => n !== 'Heather' && n !== 'Owen')
        .filter(n => believes(n, alignmentFactId('Owen'), 2));
      if (h.length > 2) heard = h;
    }
    expect(heard, 'an accusation at the table never reached more than a couple listeners in 80 seeded tries').toBeTruthy();
  });

  it('lands harder when the room trusts the accuser', () => {
    // A POPULATION read, with the world rebuilt properly between the two halves.
    //
    // What this replaces called resetKnowledge() between the measurements, which
    // does not merely clear beliefs — it destroys the `alignment:Owen` FACT
    // itself. learn() then bails on `if (!fact) return null`, so the second
    // broadcast was a complete no-op and `distrusted` was structurally 0. It
    // asserted only `trusted > 0`, on one seed, and would have passed identically
    // if the trust term had no effect whatsoever — the exact mechanism it is
    // named for.
    //
    // It is also the same accuser both times. Swapping Leshawna for Noah changes
    // `pitch` along with the bond, so the two reads differed by the speaker's
    // social stat as much as by the room's trust. One person, two rooms.
    const build = (bond) => {
      setGs({ bonds: {}, activePlayers: [...CAST] });
      gs.tr = initTraitorsState();
      resetKnowledge();
      recordAlignment('Gwen', true, 1, 'selection');
      recordAlignment('Duncan', true, 1, 'selection');
      CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
        .forEach(n => recordAlignment(n, false, 1, 'selection'));
      seedTraitorKnowledge(1);
      CAST.forEach(n => { if (n !== 'Leshawna') setBond(n, 'Leshawna', bond); });
    };
    // Two probabilistic reads cannot be compared on one draw: whether any single
    // listener accepts a rumour is a read-skill roll inside learn(). Compare the
    // distributions.
    const LISTENERS = CAST.filter(n => n !== 'Leshawna' && n !== 'Owen');
    let trustedSum = 0, distrustedSum = 0, trustedBelievers = 0, distrustedBelievers = 0;
    const SEEDS = 80;
    for (let seed = 1; seed <= SEEDS; seed++) {
      build(8);
      broadcast('Leshawna', 'Owen', 2, seededRng(seed));
      LISTENERS.forEach(n => {
        const s2 = suspicion(n, 'Owen', 2);
        trustedSum += s2; if (s2 > 0) trustedBelievers++;
      });
      build(-6);
      broadcast('Leshawna', 'Owen', 2, seededRng(seed));
      LISTENERS.forEach(n => {
        const s2 = suspicion(n, 'Owen', 2);
        distrustedSum += s2; if (s2 > 0) distrustedBelievers++;
      });
    }
    const n = SEEDS * LISTENERS.length;
    // Non-vacuity: a comparison of two zeroes is what the old test was doing.
    expect(trustedBelievers, 'nobody at all believed the trusted accuser').toBeGreaterThan(0);
    expect(distrustedBelievers, 'the distrusted broadcast formed no beliefs — the world was not rebuilt').toBeGreaterThan(0);
    // A warm room both believes it more often AND believes it harder.
    expect(trustedBelievers).toBeGreaterThan(distrustedBelievers);
    expect(trustedSum / n).toBeGreaterThan(distrustedSum / n);
  });
});

describe('the banishment', () => {
  it('banishes exactly one person and reports what they were', () => {
    const r = runRoundTable(2, seededRng(6));
    expect(CAST).toContain(r.banished);
    expect(typeof r.wasTraitor).toBe('boolean');
    expect(r.wasTraitor).toBe(['Gwen', 'Duncan'].includes(r.banished));
  });

  it('collects a ballot from every living player, nobody voting for themselves', () => {
    const r = runRoundTable(2, seededRng(6));
    expect(r.ballots).toHaveLength(CAST.length);
    r.ballots.forEach(b => {
      expect(b.channel).toBe('banishment');
      expect(b.voter).not.toBe(b.voted);
      expect(CAST).toContain(b.voted);
    });
  });

  it('breaks a tie among the tied players only, and they do not vote', () => {
    // This test MUST actually see a tie. An `if (r.revotes.length)` guard would
    // let it pass by never entering the branch — the exact failure mode this
    // project has documented twice, where a guard reports coverage it does not
    // have. So: search seeds until a revote genuinely happens, and fail loudly
    // if none does in 60 tries, because that would mean ties never occur at all.
    // Each attempt gets a genuinely fresh world (not just a cleared round
    // list) — leftover Round Table beliefs from a prior seed's debate would
    // otherwise carry into the next attempt and skew who gets named, which
    // would make this search neither a clean seed sweep nor reproducible.
    let found = null;
    for (let seed = 1; seed <= 60 && !found; seed++) {
      setGs({ bonds: {}, activePlayers: [...CAST] });
      gs.tr = initTraitorsState();
      resetKnowledge();
      recordAlignment('Gwen', true, 1, 'selection');
      recordAlignment('Duncan', true, 1, 'selection');
      CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
        .forEach(n => recordAlignment(n, false, 1, 'selection'));
      seedTraitorKnowledge(1);
      const r = runRoundTable(2, seededRng(seed));
      if (r.revotes.length) found = r;
    }
    expect(found, 'no tie occurred in 60 seeded round tables — ties are unreachable').toBeTruthy();
    const rv = found.revotes[0];
    expect(rv.ballots.length).toBeGreaterThan(0);
    rv.ballots.forEach(b => {
      expect(rv.tied).toContain(b.voted);        // only the tied are eligible
      expect(rv.tied).not.toContain(b.voter);    // and they do not vote
    });
    expect(found.banished).toBeTruthy();          // a tie must still resolve
  });

  it('BANISHES A REAL PERSON even when the whole room ties', () => {
    // The degenerate table: every living player draws one vote, so `tiedPlayers`
    // is the whole room, the revote has NO eligible voters, and resolveVotes({})
    // comes back with an EMPTY tiedPlayers. A `|| living` fallback does not save
    // this — `[]` is truthy, so `[][NaN]` is `undefined` — and the round then
    // banishes nobody, drops out of the evidence stream forever, and teaches the
    // whole castle a `public`-certainty alignment about a person who does not
    // exist. Measured at ~0.2% of rounds in a 20-cast; trivially reproducible in
    // a small one, which is where the endgame lives.
    const SMALL = ['Gwen', 'Duncan', 'Heather'];
    let sawTie = false;
    for (let seed = 1; seed <= 40; seed++) {
      setGs({ bonds: {}, activePlayers: [...SMALL] });
      gs.tr = initTraitorsState();
      resetKnowledge();
      recordAlignment('Gwen', true, 1, 'selection');
      recordAlignment('Duncan', false, 1, 'selection');
      recordAlignment('Heather', false, 1, 'selection');
      seedTraitorKnowledge(1);
      const r = runRoundTable(2, seededRng(seed));
      if (r.revotes.length) sawTie = true;
      expect(SMALL, `seed ${seed} banished a non-player`).toContain(r.banished);
      expect(gs.tr.rounds.every(x => x.banished),
        `seed ${seed} stored a round with no banishment`).toBe(true);
      expect(gs.knowledge['alignment:undefined'],
        `seed ${seed} taught the castle about a player who does not exist`).toBeUndefined();
    }
    expect(sawTie, 'no tie occurred at all — this test proved nothing').toBe(true);
  });

  it('is deterministic for a seed — a season has to replay', () => {
    // Determinism means the same WORLD plus the same seed replays identically —
    // not that a second run started with the first run's leftover Round Table
    // beliefs still in play must land on the same name. Clearing only
    // gs.tr.rounds leaves those beliefs behind (broadcast() writes into
    // gs.knowledge, which recordRound never touches), so the two runs are not
    // actually starting from the same place. Reset the whole world here, the
    // same way beforeEach does.
    const a = runRoundTable(2, seededRng(21));
    setGs({ bonds: {}, activePlayers: [...CAST] });
    gs.tr = initTraitorsState();
    resetKnowledge();
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
    const b = runRoundTable(2, seededRng(21));
    expect(a.banished).toBe(b.banished);
  });
});
