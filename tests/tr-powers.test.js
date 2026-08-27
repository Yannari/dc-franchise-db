// ══════════════════════════════════════════════════════════════════════
// tr-powers.test.js — the Shield, and the four things it must never be
// ══════════════════════════════════════════════════════════════════════
//
// Spec 7.3. A Shield blocks the NEXT MURDER ONLY, never protects at the Round
// Table, is not transferable, and expires unused. The block mechanic itself
// (`grantShield`/`isShielded`/`resolveMurder`) was built in an earlier plan and
// is guarded in tests/tr-murder.test.js; what is new here is the ACQUISITION
// PATH — a Shield is won in a mission — and the VISIBILITY MODEL, which is the
// half of the design that makes it a liability rather than a free night.
//
// The guards, in the order they matter:
//
//   1. THE LIFECYCLE. Won in a mission, blocks that night's murder, does NOT
//      protect at that night's Round Table (which sits BEFORE the murder in the
//      round, so a shielded player really can be banished holding it), and is
//      gone the following night whether it was used or not.
//   2. SEMI-VISIBLY. Some of the room saw it won and some did not, and the
//      split is recorded rather than implied. A Shield everybody sees is an
//      announcement; a Shield nobody sees is a private coin flip. Both ends are
//      reachable and neither is the common case.
//   3. ONLY THE WITNESSES READ IT. Every belief this channel writes goes to a
//      player on the recorded witness list, and the two readings — "the
//      Traitors chose them and failed" and "the Traitors never chose them" —
//      split on whether the murder was blocked. Asserted over the WRITES, not
//      over the store: `learn()` overwrites, so a season-end sweep measures the
//      survivors of an overwriting process (Task 2's first defect shape). The
//      Shield's own state is worse still — `shieldedThisRound` is CLEARED EVERY
//      ROUND, so a sweep of it at season end proves precisely nothing.
//   4. THE ARMOURY IS NOT REBUILT. Nothing takes a Shield from a room on
//      demand, nothing transfers one, and nothing carries one over. The
//      degenerate silence-pact strategy that got the Armoury removed from the
//      real format needs a Shield you can take at will; this one has to be won
//      in front of people.
//
// A note on sample sizes: a Shield blocks a murder about 4% of the times it is
// won and about once every fifteen seasons, because the conclave's winner has
// to be BOTH blind to the Shield and pointed at the holder. Every band on that
// event states its own separation below; nothing here asserts on a single
// firing.
import { describe, expect, it, beforeEach, vi } from 'vitest';

const { learnCalls, capture } = vi.hoisted(() => ({ learnCalls: [], capture: { on: false } }));

// THE SPY WATCHES THE CALL, NOT THE STORE. Same instrument tr-missions.test.js
// uses and for the same reason recorded there: the rule binds the write, and
// only a fraction of writes survive a season. It is gated so the seasons this
// file plays for other reasons do not grow a hundred-thousand-entry array.
vi.mock('../js/knowledge.js', async (importOriginal) => {
  const orig = await importOriginal();
  return {
    ...orig,
    learn: (knower, id, opts = {}) => {
      if (capture.on) {
        learnCalls.push({ knower, id, source: opts.source, sourceType: opts.sourceType,
          confidence: opts.confidence, ep: opts.ep });
      }
      return orig.learn(knower, id, opts);
    },
  };
});

import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, ALIGNMENT_CRED_CEILING } from '../js/knowledge.js';
import { recordAlignment } from '../js/tr/roles.js';
import { seedTraitorKnowledge } from '../js/tr/deduction.js';
import { grantShield, isShielded, resolveMurder, formPreference } from '../js/tr/murder.js';
import { runRoundTable } from '../js/tr/roundtable.js';
import { awardShield, liveShield, shieldSeenBy, shieldEvidence, expireShields } from '../js/tr/powers.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { POT_CEILING } from '../js/tr/missions.js';
import roster from '../franchise_roster.json';

const ROSTER20 = roster.players.slice(0, 20);
const CAST20 = ROSTER20.map(p => p.name);

function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * A world with a named Traitor set, small enough that the conclave's target is
 * forced. With exactly one living Faithful, `formPreference` has one candidate
 * and every Traitor names them — so "the murder was blocked" is a statement
 * about the Shield and not about who the conclave happened to pick.
 */
function world(cast, traitors) {
  setPlayers(roster.players.slice(0, cast.length));
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
  resetKnowledge();
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}

const CAST10 = roster.players.slice(0, 10).map(p => p.name);

function seasons(n, first = 1) {
  setPlayers(ROSTER20);
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST20, traitorCount: 3, seed: first + i }));
}

/** Every Shield awarded across a set of seasons, flattened. */
const allShields = (ss) => ss.flatMap(s => s.shields);

beforeEach(() => { learnCalls.length = 0; capture.on = false; });

describe('the Shield: won in a mission, and gone by the next one', () => {
  // THE LIFECYCLE, ON A FORCED BOARD. Three Traitors and one Faithful, so the
  // conclave has exactly one name available and the only variable left is the
  // Shield.
  const T = CAST10.slice(0, 3);
  const F = CAST10[3];

  it('blocks that night\'s murder, and is spent doing it', () => {
    world([...T, F], T);
    grantShield(F, 2);
    const m = resolveMurder(2, seededRng(9));
    expect(m.target, 'the conclave had one candidate and should have named them').toBe(F);
    expect(m.blocked).toBe(true);
    expect(m.victim).toBe(null);
    expect(gs.activePlayers).toContain(F);
    expect(gs.tr.blockedMurders.map(b => b.target)).toEqual([F]);
    // Spent even though it worked — resolveMurder deletes it on the block.
    expect(isShielded(F)).toBe(false);
  });

  it('does NOT protect at the Round Table: the same person is banished either way', () => {
    // THE BANISHMENT ARM, AND WHY IT IS A COMPARISON RATHER THAN A COUNT.
    // The Round Table runs BEFORE the murder in a round, so a Shield won in the
    // afternoon is live while the room votes. Nothing in roundtable.js reads
    // it, and this is the assertion that keeps it that way: play the identical
    // seeded table twice, once with a live Shield on the eventual banishee and
    // once without, and demand the same name and the same ballots. Granting a
    // Shield takes no rng draw, so the two runs are comparable line for line.
    world(CAST10, CAST10.slice(0, 3));
    const bare = runRoundTable(2, seededRng(31));
    expect(bare.banished, 'the table banished nobody: this comparison is vacuous').toBeTruthy();

    world(CAST10, CAST10.slice(0, 3));
    grantShield(bare.banished, 2);
    const shielded = runRoundTable(2, seededRng(31));
    expect(shielded.banished,
      `${bare.banished} survived a banishment while holding a Shield`).toBe(bare.banished);
    expect(shielded.ballots.map(b => `${b.voter}>${b.voted}`))
      .toEqual(bare.ballots.map(b => `${b.voter}>${b.voted}`));
    expect(gs.activePlayers).not.toContain(bare.banished);
  });

  it('is gone the following night, used or unused', () => {
    // UNUSED: nobody threw anything at it, and it still expires.
    world([...T, F], T);
    awardShield(F, [{ name: 'Bells', members: [...T, F] }], 2, seededRng(3));
    expect(isShielded(F)).toBe(true);
    expect(liveShield(2).outcome).toBe('pending');
    // Nothing happened to it tonight — the conclave went elsewhere. (With one
    // Faithful it cannot, so the expiry is driven directly: this is the arm
    // about the CLOCK, not about the conclave.)
    expireShields(2);
    expect(isShielded(F), 'a Shield survived the night it was won').toBe(false);
    expect(liveShield(2)).toBe(null);
    expect(gs.tr.shields[0].outcome).toBe('expired');

    // And the next night's murder lands.
    const m = resolveMurder(3, seededRng(9));
    expect(m.blocked).toBe(false);
    expect(m.victim).toBe(F);

    // USED: blocked, then expired, and the ledger says which.
    world([...T, F], T);
    awardShield(F, [{ name: 'Bells', members: [...T, F] }], 2, seededRng(3));
    resolveMurder(2, seededRng(9));
    expireShields(2);
    expect(gs.tr.shields[0].outcome).toBe('blocked');
    expect(resolveMurder(3, seededRng(9)).victim).toBe(F);
  });

  it('is never transferable and never stacks: one live Shield, cleared wholesale', () => {
    world(CAST10, CAST10.slice(0, 3));
    const teams = [{ name: 'Bells', members: CAST10.slice(0, 5) },
      { name: 'Bones', members: CAST10.slice(5) }];
    awardShield(CAST10[4], teams, 2, seededRng(5));
    // Nothing in the module moves one from A to B: the only writer is
    // awardShield, and it takes the finder. Belt and braces — a hand-planted
    // second Shield is cleared by the same wholesale clear, so a future power
    // that grants two cannot leave one behind by arithmetic.
    grantShield(CAST10[6], 2);
    expireShields(2);
    expect([...gs.tr.shieldedThisRound]).toEqual([]);
  });
});

describe('semi-visibly: some of the room saw it, and some did not', () => {
  it('the witness list is a genuine split, at both ends', () => {
    const shields = allShields(seasons(120));
    expect(shields.length, 'no Shields were won at all').toBeGreaterThan(120);

    let unseen = 0, seenBySomeone = 0;
    for (const s of shields) {
      expect(s.witnesses, 'a Shield witnessed itself').not.toContain(s.holder);
      expect(new Set(s.witnesses).size, 'a witness was recorded twice').toBe(s.witnesses.length);
      if (!s.witnesses.length) unseen++; else seenBySomeone++;
    }
    // BOTH ENDS REACHABLE, and neither dominant. A model where everybody always
    // sees is an announcement and a model where nobody ever does is a private
    // coin flip; the mechanic is the middle. Measured over 120 seasons: ~3% of
    // Shields are seen by nobody at all and the rest by a minority of the room.
    expect(unseen, 'every single Shield was seen by somebody: the model is an announcement')
      .toBeGreaterThan(0);
    expect(seenBySomeone, 'no Shield was ever seen by anybody: the model is a private coin')
      .toBeGreaterThan(shields.length * 0.5);
    // And the room is genuinely split rather than nearly-all or nearly-none.
    // Measured mean share ~0.30 over 120 seasons (n>200 Shields, so the sem on
    // this mean is under a point) — the floor and ceiling below sit many sd out.
    // Against the room AS IT WAS, read off the ledger. Written first as
    // `s.roomSize ?? 12`, which is a fabricated denominator wearing a real
    // one's clothes: the field did not exist, so every Shield in every season
    // was divided by twelve and the printed share was a number about nothing.
    // The room size is recorded at the moment the tier is decided and read
    // back here.
    const share = shields.reduce((a, s) => a + s.witnesses.length / Math.max(1, s.roomSize), 0)
      / shields.length;
    const everybody = shields.filter(s => s.witnesses.length >= s.roomSize).length;
    console.log(`[population] ${shields.length} Shields, mean witness share ${(share * 100).toFixed(1)}%, `
      + `${unseen} seen by nobody, ${everybody} seen by the entire room`);
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.70);
  });

  it('the sentence about who saw it agrees with the witness list', () => {
    // THE STANDING REQUIREMENT OF THIS PLAN, honoured at source and checked
    // here against the RECORDED tier rather than a second copy of the cuts —
    // Task 2's duplicate-source defect, which was the third of its kind in this
    // project. `visibility` is written by the same call that writes
    // `witnesses`, and the line is drawn from the pool that tier names, so
    // "not one person saw it" cannot print over a witness list.
    // 200 seasons and not 80 BECAUSE OF THE RAREST POOL. `most` needs over half
    // a room to notice a find, which happens about 2.7% of the time — 9 firings
    // in 200 seasons, so a floor of 1 sits three sd below the measurement,
    // where over 80 it would be an expected 3.6 and would come back zero one
    // run in forty. A reachability floor that flakes is worse than none: it
    // teaches the next person to delete it.
    const shields = allShields(seasons(200));
    const tiers = {};
    for (const s of shields) {
      tiers[s.visibility] = (tiers[s.visibility] || 0) + 1;
      if (s.visibility === 'unseen') {
        expect(s.witnesses.length,
          `"${s.seenLine}" printed over ${s.witnesses.length} witnesses`).toBe(0);
        expect(s.seenLine).toMatch(/nobody|Nobody|alone|unobserved|corner of the afternoon/);
      } else {
        expect(s.witnesses.length, `tier ${s.visibility} printed over an empty witness list`)
          .toBeGreaterThan(0);
      }
    }
    console.log('[population] visibility tiers:', tiers);
    // Reachability of the pools, which is Task 1's own defect (forty
    // unreachable narration lines) asserted rather than assumed. `most` is the
    // rarest by construction — it needs over half a room to notice — so it is
    // reported and floored at 1 over 80 seasons rather than banded.
    expect(tiers.unseen || 0, 'the "nobody saw it" pool is unreachable').toBeGreaterThan(0);
    expect(tiers.few || 0).toBeGreaterThan(0);
    expect(tiers.some || 0).toBeGreaterThan(0);
    expect(tiers.most || 0, 'the "most of the castle saw it" pool is unreachable')
      .toBeGreaterThan(0);
  });

  it('a Traitor who saw it steers off it, and one who did not cannot', () => {
    // THE VALUE OF WITNESSING, FROM THE OTHER SIDE. `shieldSeenBy` is per
    // TRAITOR, not per pact — a pact-wide check makes one witness protect the
    // whole conclave, and measured that way a Shield blocked ONE murder in two
    // hundred seasons: the format's strongest read, written and unreachable.
    world(CAST10, CAST10.slice(0, 3));
    const holder = CAST10[9];
    const teams = [{ name: 'Bells', members: [CAST10[0], holder] },
      { name: 'Bones', members: CAST10.slice(1, 9) }];
    // Hand-built witness list rather than a rolled one: this is a test of what
    // the conclave does with the list, not of how the list is drawn.
    awardShield(holder, teams, 2, () => 0.99);       // nobody rolls under 0.99
    expect(liveShield(2).witnesses).toEqual([]);
    expect(shieldSeenBy(CAST10[0], 2), 'a Traitor who saw nothing was warned').toBe(null);
    liveShield(2).witnesses.push(CAST10[0]);
    expect(shieldSeenBy(CAST10[0], 2)).toBe(holder);
    expect(shieldSeenBy(CAST10[1], 2), 'the witness\'s knowledge leaked to the whole pact')
      .toBe(null);
  });

  it('and the steering is real: seeing it changes who the conclave names', () => {
    // THE PENALTY IN formPreference, GUARDED, AS A PAIRED WITHIN-SEED TEST.
    //
    // The first draft shielded a fixed player and counted how often the
    // conclave named them: 3% of the time, because a three-person board with
    // fixed stats has a preferred target and it was not the one being
    // protected. That is a test of the roster, not of the steering. So each
    // seed asks the question the mechanic actually answers — take the name this
    // Traitor WOULD have chosen, put a Shield on it, and see whether they move.
    const cast = CAST10.slice(0, 6);
    const traitor = cast[0];
    const teams = [{ name: 'Bells', members: cast }];
    let movedWhenSeen = 0, movedWhenBlind = 0;
    for (let seed = 1; seed <= 60; seed++) {
      world(cast, [traitor]);
      const bare = formPreference(traitor, 2, seededRng(seed)).target;

      world(cast, [traitor]);
      awardShield(bare, teams, 2, () => 0.99);          // nobody rolls under 0.99
      liveShield(2).witnesses.push(traitor);
      if (formPreference(traitor, 2, seededRng(seed)).target !== bare) movedWhenSeen++;

      // THE CONTROL, and it is the half that makes this a measurement of
      // SEEING rather than of a Shield existing: identical board, identical
      // Shield, this Traitor simply not on the witness list.
      world(cast, [traitor]);
      awardShield(bare, teams, 2, () => 0.99);
      if (formPreference(traitor, 2, seededRng(seed)).target !== bare) movedWhenBlind++;
    }
    console.log(`[population] the conclave moved off its own first choice on `
      + `${movedWhenSeen}/60 nights it had seen the Shield won and ${movedWhenBlind}/60 it had not`);
    expect(movedWhenSeen, 'a Traitor who watched the Shield being won still named the holder')
      .toBe(60);
    expect(movedWhenBlind, 'the Shield steered a Traitor who never saw it').toBe(0);
  });
});

describe('only the people who saw it can read the night that followed', () => {
  /**
   * Play seasons with the spy on, ONE AT A TIME, and keep each season's Shield
   * writes with that season.
   *
   * The per-season slicing is not tidiness. Every season runs the same twenty
   * people, so a write from season 40 carries the same names and the same
   * episode numbers as a write from season 1 — pooling them and matching on
   * "holder name and ep" reports a leak on every seed. (Written the pooled way
   * first; it failed on the first pair of seasons it saw, which is the cheap
   * version of that mistake.)
   */
  function shieldWrites(n, first = 1) {
    setPlayers(ROSTER20);
    const out = [];
    for (let i = 0; i < n; i++) {
      learnCalls.length = 0;
      capture.on = true;
      let s;
      try { s = playTraitorsSeason({ cast: CAST20, traitorCount: 3, seed: first + i }); }
      finally { capture.on = false; }
      out.push({ season: s,
        writes: learnCalls.filter(c => /could not touch|came for/.test(c.source || '')) });
    }
    return { seasons: out.map(o => o.season), writes: out.flatMap(o => o.writes), per: out };
  }

  it('every read goes to a witness, and never to anybody else', () => {
    // THE ASYMMETRY, ASSERTED AS A RULE OVER THE WRITES. The store is the wrong
    // place to ask: `learn()` overwrites, and `shieldedThisRound` is cleared
    // every round, so a season-end sweep of either is a sweep over survivors.
    const { per, writes } = shieldWrites(40);
    // ~190 offers over 40 seasons. The floor is a coverage guard, not a band:
    // it exists so this cannot pass green while observing nothing.
    expect(writes.length, 'the Shield channel wrote nothing at all').toBeGreaterThan(100);

    // Rebuild each season's ep -> witness set from ITS OWN ledger and check
    // every write in that season against it. The ledger is read, never
    // re-derived.
    let checked = 0;
    for (const { season, writes: ws } of per) {
      for (const sh of season.shields) {
        const seen = new Set(sh.witnesses);
        for (const w of ws.filter(c => c.ep === sh.ep)) {
          expect(seen.has(w.knower),
            `${w.knower} formed a read off a Shield they never saw (ep ${sh.ep}, holder ${sh.holder})`)
            .toBe(true);
          checked++;
        }
      }
    }
    expect(checked, 'no write was actually matched to a Shield: the check is vacuous')
      .toBeGreaterThan(100);
  });

  it('the two readings split on the block, and both are reachable', () => {
    // "The Traitors chose them and failed" vs "the Traitors never chose them".
    // 200 seasons because the blocked branch fires about once in fifteen: at
    // that rate the expected count here is ~13 and the floor of 1 sits over
    // three sd below it, which is the separation this project requires of a
    // sampled assertion.
    const { seasons: ss, writes, per } = shieldWrites(200);
    let blockedShields = 0, expiredShields = 0;
    for (const s of ss) {
      for (const sh of s.shields) {
        if (sh.outcome === 'blocked') blockedShields++;
        if (sh.outcome === 'expired') expiredShields++;
        expect(sh.outcome, 'a Shield was left open at the end of a season')
          .not.toBe('pending');
      }
    }
    const untested = writes.filter(w => /could not touch/.test(w.source));
    const nearly = writes.filter(w => /came for/.test(w.source));
    console.log(`[population] 200 seasons: ${blockedShields} Shields blocked a murder, `
      + `${expiredShields} expired unused (${(expiredShields / (blockedShields + expiredShields) * 100).toFixed(1)}%); `
      + `${untested.length} "they went nowhere near you" reads, ${nearly.length} "they came for you" reads`);
    // AND NOTHING IS READ INTO A NIGHT NOBODY WAS CHOSEN ON. The Traitors get
    // one action a night, so a night spent making a recruitment offer has no
    // target in it at all — and "they went nowhere near you" over one of those
    // is false in the most direct way a sentence can be. Found by dumping
    // seasons and reading them, and closed at source by passing the night into
    // shieldEvidence rather than reconstructing it.
    let quietNights = 0;
    for (const { season, writes: ws } of per) {
      for (const w of ws.filter(x => /could not touch/.test(x.source))) {
        const night = season.log.find(r => r.ep === w.ep);
        expect(night?.murderTarget,
          `a Shield read fired on ep ${w.ep}, a night the conclave chose nobody`).toBeTruthy();
      }
      quietNights += season.log.filter(r => !r.murderTarget && r.recruited).length;
    }
    expect(quietNights, 'no recruitment night occurred at all: the gate is unexercised')
      .toBeGreaterThan(20);

    expect(blockedShields, 'no Shield ever blocked a murder in 200 seasons').toBeGreaterThan(0);
    expect(untested.length, 'the liability read never fired').toBeGreaterThan(100);
    expect(nearly.length, 'the blocked-night read is unreachable').toBeGreaterThan(0);
  });

  it('never learns an alignment above `deduced`, and never at `observed`', () => {
    // The closed set, restated for this channel. tr-missions.test.js asserts it
    // over every write in the game; this is the same rule stated where the new
    // writer lives, with a coverage floor so it cannot pass by observing
    // nothing.
    const { writes } = shieldWrites(40);
    expect(writes.length).toBeGreaterThan(100);
    for (const w of writes) {
      expect(['deduced', 'rumor'], `Shield read written at ${w.sourceType}`).toContain(w.sourceType);
      expect(w.confidence).toBeLessThanOrEqual(ALIGNMENT_CRED_CEILING);
    }
    expect(new Set(writes.map(w => w.sourceType)).size,
      'only one of the two tiers ever fired: the guard has not seen the other')
      .toBe(2);
  });
});

describe('the Armoury is not rebuilt', () => {
  it('a Shield can only be won in a mission, and only by the person who found it', () => {
    // The degenerate strategy the real format removed needs a Shield anybody
    // can take on demand. Here the ONLY writer of gs.tr.shields is awardShield,
    // and the only caller of awardShield is the Reliquary's own afternoon — so
    // every Shield in a season traces to a mission record naming the same
    // person as its searcher.
    const ss = seasons(30);
    let traced = 0;
    for (const s of ss) {
      for (const sh of s.shields) {
        const m = s.missions.find(x => x.ep === sh.ep && x.shield);
        expect(m, `a Shield at ep ${sh.ep} came from no mission at all`).toBeTruthy();
        expect(m.shield.found).toBe(true);
        expect(m.shield.searcher).toBe(sh.holder);
        expect(m.id).toBe('the-reliquary');
        traced++;
      }
    }
    expect(traced).toBeGreaterThan(20);
  });

  it('the searcher pays for it in pot money, and pays whether or not they find it', () => {
    // The trade the Armoury lacked. A team carrying a body short is a team a
    // body short: the searcher contributes nothing to their team's score, so
    // the castle funds every Shield hunt out of the shared pot — including the
    // ones that come back with nothing.
    const ss = seasons(60);
    const reliquary = ss.flatMap(s => s.missions.filter(m => m.id === 'the-reliquary'));
    const others = ss.flatMap(s => s.missions.filter(m => m.id !== 'the-reliquary'));
    expect(reliquary.length).toBeGreaterThan(60);
    const misses = reliquary.filter(m => !m.shield.found);
    expect(misses.length, 'the search never once failed: it is not a gamble').toBeGreaterThan(5);

    // THE COST, READ OFF THE RECORD RATHER THAN RE-DERIVED. `runMission` scores
    // the same afternoon a second time with the searcher's hour put back in and
    // writes the difference down; a test that recomputed it here would be a
    // test of its own arithmetic and would stay green if the searcher stopped
    // costing anything (Task 2's duplicate-source defect, the third of its kind
    // in this project).
    const paid = reliquary.filter(m => m.shield.cost > 0).length;
    const mean = reliquary.reduce((a, m) => a + m.shield.cost, 0) / reliquary.length;
    console.log(`[population] the hunt cost the pot a mean ${Math.round(mean)} credits over `
      + `${reliquary.length} afternoons; ${paid} of them cost something`);
    // Not "every one": an afternoon under the pass mark both ways pays zero
    // either way and genuinely cost nothing. The floor sits well below the
    // measured share and well above a mechanic that had stopped charging.
    expect(paid / reliquary.length, 'the searcher walked off and the carry did not notice')
      .toBeGreaterThan(0.8);
    expect(mean, 'the hunt is free').toBeGreaterThan(300);
    // And the misses pay too — you buy the hour, not the Shield.
    const missCost = misses.reduce((a, m) => a + m.shield.cost, 0) / misses.length;
    expect(missCost, 'only successful hunts cost anything').toBeGreaterThan(300);
    // Every reliquary afternoon has a searcher, found or not.
    expect(reliquary.every(m => m.shield.searcher)).toBe(true);
    // And the searcher is never also credited with a side objective they were
    // not there for — a record saying both is a record contradicting itself.
    for (const m of reliquary) {
      expect(m.sideObjectives.map(o => o.player),
        `${m.shield.searcher} was down the niches and on the top step at once`)
        .not.toContain(m.shield.searcher);
    }
    // WHAT IT COSTS, measured against the counterfactual rather than against
    // the other archetypes — a cross-archetype comparison is confounded by the
    // stat pairs, which is why the number below is the same mission with the
    // searcher's contribution added back: 0.389 as played against 0.458 if
    // nobody had walked off, so a Shield hunt costs the castle 14.9% of the
    // afternoon, found or not.
    const meanQ = a => a.reduce((x, m) => x + m.quality, 0) / a.length;
    console.log(`[population] reliquary mean quality ${meanQ(reliquary).toFixed(3)}; `
      + `${meanQ(others).toFixed(3)} across the archetypes where nobody walks off `
      + '(different stat pairs — not the isolation of the cost)');
  });
});
