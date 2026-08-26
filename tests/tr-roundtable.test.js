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
    CAST.forEach(n => { if (n !== 'Leshawna') setBond(n, 'Leshawna', 8); });
    CAST.forEach(n => { if (n !== 'Noah') setBond(n, 'Noah', -6); });
    broadcast('Leshawna', 'Owen', 2, seededRng(4));
    const trusted = suspicion('Bridgette', 'Owen', 2);
    resetKnowledge();
    broadcast('Noah', 'Owen', 2, seededRng(4));
    const distrusted = suspicion('Bridgette', 'Owen', 2);
    expect(trusted).toBeGreaterThan(distrusted);
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
