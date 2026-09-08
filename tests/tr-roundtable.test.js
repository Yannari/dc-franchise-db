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


// ══════════════════════════════════════════════════════════════════════
// SPEECHES CONSUME PROVENANCE (Task 9)
// ══════════════════════════════════════════════════════════════════════
//
// A speech is an accusation with its evidence attached. The contract: every
// claim a speaker makes cites a source, and the speaker must actually KNOW
// that source. This is the observer-safety seam of the Round Table — the one
// place a Faithful could be handed Traitor-only knowledge — so it is proven in
// the DATA, not by reading a rendered screen.
//
// This isolated harness seeds only the turret, so a Faithful walks in with an
// empty board and most speakers have nothing to cite — which is the correct
// silence, not a bug (a full season accumulates mission/murder/ballot reads
// and speeches become common; tests/tr-vp.test.js exercises that volume). To
// give the sweep real speeches to check, `_plantReads` lays down deduced
// suspicions the way an evidence source would.
import { speechesFrom, knows } from '../js/tr/roundtable.js';
import { believes, learn } from '../js/knowledge.js';
import { alignmentFactId } from '../js/tr/deduction.js';
import { recordAlignment as _recA } from '../js/tr/roles.js';

function _rebuild() {
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  _recA('Gwen', true, 1, 'selection');
  _recA('Duncan', true, 1, 'selection');
  CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
    .forEach(n => _recA(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}

// A deduced read from everyone onto a rotating set of targets — the shape a
// mission/ballot/murder evidence source leaves behind. Deduced, never public.
function _plantReads(ep = 2) {
  CAST.forEach((observer, i) => {
    const target = CAST[(i + 2) % CAST.length];
    if (observer === target) return;
    learn(observer, alignmentFactId(target), {
      source: `read ${target} across the hall`, sourceType: 'deduced',
      confidence: 0.5, ep, rng: () => 0 });
  });
}

describe('every Round Table speech cites a source its speaker knows', () => {
  it('holds across a seed sweep, and speeches actually occur', () => {
    let sawSpeech = 0, checkedSources = 0;
    for (let seed = 1; seed <= 60; seed++) {
      _rebuild();
      _plantReads(2);
      runRoundTable(2, seededRng(seed));
      const round = gs.tr.rounds[gs.tr.rounds.length - 1];
      for (const s of round.speeches || []) {
        // A SPEECH IS NOW EVERY ACCUSATION, cited or not — the uncited ones
        // used to be dropped on the floor and reached the screen as a name
        // with nothing under it (27% of them). What this file guards is
        // unchanged and is the thing that matters: whatever IS cited must be
        // something the speaker actually holds. The uncited ones are held to
        // their own contract instead — a named `reasonKind` and no sources,
        // so nothing can arrive uncited AND unexplained.
        if (!s.sources.length) {
          expect(['hearsay', 'public', 'gone-cold', 'feeling'],
            `seed ${seed}: ${s.speaker} spoke with no source and no reason kind`)
            .toContain(s.reasonKind);
          if (s.reasonKind === 'hearsay') {
            expect(typeof s.hearsayFrom,
              `seed ${seed}: hearsay with nobody to attribute it to`).toBe('string');
          }
          continue;
        }
        expect(s.reasonKind, `seed ${seed}: a cited speech is not marked cited`)
          .toBe('cited');
        for (const source of s.sources) {
          expect(knows(s.speaker, source, 2),
            `seed ${seed}: ${s.speaker} cited a source they do not know`).toBe(true);
          checkedSources++;
        }
        sawSpeech++;
      }
    }
    expect(sawSpeech, 'no table across 60 seeds produced a cited speech').toBeGreaterThan(20);
    expect(checkedSources, 'no source was ever checked').toBeGreaterThan(20);
  });

  // THE MUTANT, PROVEN DIRECTLY. Force a speaker to hold a `public`-tier
  // (turret) belief about the person they are about to accuse — the exact
  // shape a leak of Traitor-only knowledge would take — and speechesFrom must
  // refuse to make it a source. Deleting `if (b.sourceType === 'public')
  // return [];` in _sourcesFor turns this green speech red: the public belief
  // becomes a cited source. Verified by hand: with the filter removed this
  // returns a speech whose source.kind === 'public'.
  it('a public-tier belief about the target never becomes a speech', () => {
    _rebuild();
    // Gwen and Duncan are both Traitors, so Gwen's turret belief about Duncan
    // is ACCURATE and high-confidence — the false-valence and zero-confidence
    // guards do NOT catch it, isolating the `public`-tier filter as the only
    // thing standing between turret knowledge and a table accusation. (The
    // debate never routes a Traitor to name a fellow; this proves that even if
    // it did, the turret fact could not be cited.) Deleting `if (b.sourceType
    // === 'public') return [];` in _sourcesFor makes this return one speech
    // whose source.kind === 'public'.
    const s = believes('Gwen', alignmentFactId('Duncan'), 2);
    expect(s && s.sourceType, 'the turret belief is not public — precondition failed')
      .toBe('public');
    expect(s.valence, 'the turret belief is not accurate — precondition failed')
      .toBe('accurate');
    const speeches = speechesFrom([{ accuser: 'Gwen', target: 'Duncan' }], 2);
    // STRONGER THAN THE DROP IT REPLACES. This used to assert the accusation
    // vanished, which passes just as well if `speechesFrom` returns nothing
    // for any reason at all. Now the speech comes back and has to be
    // classified `public` with an EMPTY source list, so the assertion is
    // pinned to the one thing that matters — a turret fact is not citable —
    // and cannot be satisfied by the function simply failing.
    expect(speeches.length, 'the accusation vanished instead of being classified').toBe(1);
    expect(speeches[0].reasonKind, 'a public-tier belief was not classified public')
      .toBe('public');
    expect(speeches[0].sources.length, 'a public-tier belief became a cited source')
      .toBe(0);
  });

  // And across a real sweep no cited source is ever public-tier, so the guard
  // is not merely reachable in the constructed case above.
  it('no cited source across a sweep is public-tier', () => {
    let checked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      _rebuild();
      _plantReads(2);
      runRoundTable(2, seededRng(seed));
      const round = gs.tr.rounds[gs.tr.rounds.length - 1];
      for (const s of round.speeches || []) {
        for (const source of s.sources) {
          // The captured kind is the tier at the moment the claim was made —
          // never re-read `believes` here: a target who is then banished has
          // their belief overwritten to `public` by the reveal cascade, which
          // is correct and has nothing to do with what was said at the table.
          expect(source.kind, `seed ${seed}: public-tier source cited`).not.toBe('public');
          checked++;
        }
      }
    }
    expect(checked, 'no source checked for a public leak').toBeGreaterThan(20);
  });

  // A speech records who it MOVED. A mind-change is a listener the claim
  // pushed to the top of their board — caused by a belief the debate formed,
  // never by the writer needing a flip.
  it('every recorded mind-change is a swayed listener now topped by that name', () => {
    let sawMove = 0;
    for (let seed = 1; seed <= 80; seed++) {
      _rebuild();
      _plantReads(2);
      runRoundTable(2, seededRng(seed));
      const round = gs.tr.rounds[gs.tr.rounds.length - 1];
      for (const s of round.speeches || []) {
        for (const mover of s.mindChanges || []) {
          expect(s.swayed, `seed ${seed}: a mind-change was not among the swayed`)
            .toContain(mover);
          // `s.sources[0].factId` before — which is the same fact as the
          // target's alignment and is now absent on an uncited speech. The
          // target is on every speech, so this reads the identical belief
          // and works for all five reason kinds.
          const b = believes(mover, alignmentFactId(s.target), 2);
          expect(b, `seed ${seed}: ${mover} moved with no belief`).toBeTruthy();
          sawMove++;
        }
      }
    }
    expect(sawMove, 'no speech moved anybody in 80 seeds').toBeGreaterThan(0);
  });

  it('speechesFrom invents nothing: every speech is a real accusation pairing', () => {
    _rebuild();
    _plantReads(2);
    runRoundTable(2, seededRng(7));
    const round = gs.tr.rounds[gs.tr.rounds.length - 1];
    const accusers = new Set((round.accusations || []).map(a => a.accuser + '>' + a.target));
    for (const s of round.speeches || []) {
      expect(accusers.has(s.speaker + '>' + s.target),
        'a speech named a pairing nobody accused').toBe(true);
    }
  });
});
