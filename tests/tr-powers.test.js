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
import { awardShield, liveShield, shieldSeenBy, shieldEvidence, expireShields,
  awardDagger, heldDagger, daggerSeenBy, daggerWeights, settleDaggers, daggerAfternoon,
  _setDaggerSteeringEnabled, DAGGER_VOTES } from '../js/tr/powers.js';
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

/** Every Dagger awarded across a set of seasons, flattened. */
const allDaggers = (ss) => ss.flatMap(s => s.daggers);

/** The ballots as the room heard them: one voter, one name, counted once. */
function rawTally(ballots) {
  const t = {};
  for (const b of ballots) if (b.voted) t[b.voted] = (t[b.voted] || 0) + 1;
  return t;
}

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
    // THE HUNT, WHICHEVER RELIC WAS DOWN THERE. A Reliquary afternoon records
    // itself under `shield` or under `dagger` and never both — which relic the
    // vault held is decided by how small the castle has got, not by the search
    // — and the cost the searcher's hour charged the pot is the same fact on
    // either. Read through one accessor rather than assuming the early-season
    // key, or this guard would quietly stop looking at the late afternoons,
    // which are the ones that changed.
    const hunt = m => m.shield || m.dagger;
    const reliquary = ss.flatMap(s => s.missions.filter(m => m.id === 'the-reliquary'));
    for (const m of reliquary) {
      expect(!!m.shield !== !!m.dagger,
        `a Reliquary recorded ${m.shield && m.dagger ? 'both relics' : 'neither relic'}`).toBe(true);
    }
    const others = ss.flatMap(s => s.missions.filter(m => m.id !== 'the-reliquary'));
    expect(reliquary.length).toBeGreaterThan(60);
    const misses = reliquary.filter(m => !hunt(m).found);
    expect(misses.length, 'the search never once failed: it is not a gamble').toBeGreaterThan(5);

    // THE COST, READ OFF THE RECORD RATHER THAN RE-DERIVED. `runMission` scores
    // the same afternoon a second time with the searcher's hour put back in and
    // writes the difference down; a test that recomputed it here would be a
    // test of its own arithmetic and would stay green if the searcher stopped
    // costing anything (Task 2's duplicate-source defect, the third of its kind
    // in this project).
    const paid = reliquary.filter(m => hunt(m).cost > 0).length;
    const mean = reliquary.reduce((a, m) => a + hunt(m).cost, 0) / reliquary.length;
    console.log(`[population] the hunt cost the pot a mean ${Math.round(mean)} credits over `
      + `${reliquary.length} afternoons; ${paid} of them cost something`);
    // Not "every one": an afternoon under the pass mark both ways pays zero
    // either way and genuinely cost nothing. The floor sits well below the
    // measured share and well above a mechanic that had stopped charging.
    expect(paid / reliquary.length, 'the searcher walked off and the carry did not notice')
      .toBeGreaterThan(0.8);
    expect(mean, 'the hunt is free').toBeGreaterThan(300);
    // And the misses pay too — you buy the hour, not the Shield.
    const missCost = misses.reduce((a, m) => a + hunt(m).cost, 0) / misses.length;
    expect(missCost, 'only successful hunts cost anything').toBeGreaterThan(300);
    // Every reliquary afternoon has a searcher, found or not.
    expect(reliquary.every(m => hunt(m).searcher)).toBe(true);
    // And the searcher is never also credited with a side objective they were
    // not there for — a record saying both is a record contradicting itself.
    for (const m of reliquary) {
      expect(m.sideObjectives.map(o => o.player),
        `${hunt(m).searcher} was down the niches and on the top step at once`)
        .not.toContain(hunt(m).searcher);
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

// ══════════════════════════════════════════════════════════════════════
// THE DAGGER — spec 7.3
// ══════════════════════════════════════════════════════════════════════
//
// "Doubles your vote at the next banishment. Historically decides seasons by
// breaking 3-3 endgame deadlocks." Both halves are guarded, and the second one
// is the harder: a power spent the afternoon it is found could never break a
// deadlock in a room of six, so "does it reach the endgame" is a population
// question rather than a unit one and is asked as one below.
//
// THE GUARD THAT MATTERS MOST is `reads as ONE name aloud`. Ballots at the
// Round Table are read out; they are the only `public`-credibility facts the
// deduction model has, and both `ballotEvidence` and `shieldEvidence` read the
// array directly. A doubled vote implemented as a second ballot would put a
// name into that record that nobody said, and every belief formed off it
// afterwards would be reasoning about a sentence the room never heard. So the
// pair of tests below is deliberately a pair: one says the COUNT changed, the
// other says the RECORD did not.

const CAST6 = roster.players.slice(0, 6).map(p => p.name);

/**
 * Plant a Dagger in somebody's pocket and make tonight the night.
 *
 * `awardDagger` is the real acquisition path, rolls included — nothing here
 * reimplements it. What is overridden afterwards is `drawAt`, the room size
 * its holder was waiting for, because these tests are about what the TALLY
 * does with a drawn Dagger and not about when a given cast member's nerve
 * gives out. Overriding it is the difference between a test of the mechanic
 * and a test of one roster entry's boldness.
 */
function plantDagger(holder, cast) {
  const d = awardDagger(holder, [{ name: 'Bells', members: [...cast] }], 1, () => 0.99);
  d.drawAt = cast.length;      // tonight, whatever room this is
  return d;
}

/**
 * Search seeded tables in a room of six for one with a given vote SHAPE.
 *
 * Searched rather than hard-coded to a seed: a shape is what the test is about
 * ("three-all", "everybody on one vote"), and a seed that happens to produce
 * one today is a constant that will silently stop meaning anything the first
 * time a draw moves. Measured over 600 seeds: 7 tables come in exactly 3-3 and
 * 17 come in all-tied, so both searches terminate with room to spare.
 */
function tableWithShape(shape) {
  for (let seed = 1; seed <= 600; seed++) {
    world(CAST6, CAST6.slice(0, 2));
    const bare = runRoundTable(4, seededRng(seed));
    if (!bare) continue;
    if (Object.values(bare.tally).sort((a, b) => b - a).join('-') !== shape) continue;
    return { seed, bare };
  }
  return null;
}

describe('the Dagger: a vote counted twice, and a name said once', () => {
  it('breaks a three-all deadlock that would otherwise have gone to a revote', () => {
    const found = tableWithShape('3-3');
    expect(found, 'no three-all table exists in 600 seeds: this test has nothing to test').toBeTruthy();
    const { seed, bare } = found;
    const tied = Object.keys(bare.tally);
    expect(bare.revotes.length, 'a three-all table resolved without a revote')
      .toBeGreaterThan(0);

    // Somebody who is not one of the two names being argued over. In a room of
    // six deadlocked three-all, every ballot backs one of the two, so this
    // player is on one side of it and the Dagger tips their side.
    const backer = bare.ballots.find(b => !tied.includes(b.voter));
    expect(backer, 'every voter was one of the tied: no Dagger could be held').toBeTruthy();

    world(CAST6, CAST6.slice(0, 2));
    plantDagger(backer.voter, CAST6);
    const armed = runRoundTable(4, seededRng(seed));

    expect(armed.revotes.length,
      'the Dagger doubled a vote and the table still deadlocked').toBe(0);
    expect(armed.banished, 'the deadlock broke the wrong way').toBe(backer.voted);
    // And it broke by exactly the amount the power is worth — read off the
    // exported constant, never a literal 2, so the record and the rule cannot
    // drift apart.
    expect(armed.tally[backer.voted]).toBe(bare.tally[backer.voted] + DAGGER_VOTES - 1);
    expect(armed.dagger).toEqual({ holder: backer.voter, votes: DAGGER_VOTES,
      line: expect.any(String) });
  });

  it('reads as ONE name aloud: the public record is identical either way', () => {
    // THE HALF THAT PROTECTS THE DEDUCTION MODEL. The count above changed; the
    // ballots must not have. A doubled vote written as a second ballot would
    // fabricate the one kind of fact this game treats as certain.
    const { seed, bare } = tableWithShape('3-3');
    const tied = Object.keys(bare.tally);
    const backer = bare.ballots.find(b => !tied.includes(b.voter));

    world(CAST6, CAST6.slice(0, 2));
    plantDagger(backer.voter, CAST6);
    const armed = runRoundTable(4, seededRng(seed));

    expect(armed.ballots.map(b => `${b.voter}>${b.voted}`))
      .toEqual(bare.ballots.map(b => `${b.voter}>${b.voted}`));
    expect(armed.ballots.length, 'the room grew a voter').toBe(CAST6.length);
    expect(armed.ballots.filter(b => b.voter === backer.voter).length,
      `${backer.voter} was heard to say a name twice`).toBe(1);
    // The room heard three-all. The tally says four-three. Both are true, and
    // they are true of different things.
    expect(rawTally(armed.ballots)).toEqual(rawTally(bare.ballots));
    expect(rawTally(armed.ballots)[backer.voted], 'the read-aloud record was doubled').toBe(3);
    expect(armed.tally[backer.voted], 'the count was not doubled').toBe(4);
    // Nothing on a ballot carries a weight, either: the ballot is a sentence
    // somebody said, and a weight on it would be the same fabrication wearing
    // a different field name.
    for (const b of armed.ballots) {
      expect(Object.keys(b).sort()).toEqual(['channel', 'voted', 'voter']);
    }
  });

  it('the all-tied table still resolves — with a Dagger and without one', () => {
    // THE PATH THAT ONCE BANISHED `undefined`. When every living player draws
    // exactly one vote, `resolveVotes` hands back an EMPTY `tiedPlayers`, the
    // revote has no eligible voters, and the last-resort draw has to fall back
    // on emptiness rather than on presence. Weighting the tally is a change to
    // the numbers that path is reached with, so it is re-asserted here at both
    // ends: a Dagger in the room means it is no longer reached at all, and
    // without one it must still resolve.
    const found = tableWithShape('1-1-1-1-1-1');
    expect(found, 'no all-tied table exists in 600 seeds').toBeTruthy();
    const { seed, bare } = found;
    expect(bare.banished, 'the all-tied table banished nobody').toBeTruthy();
    expect(CAST6).toContain(bare.banished);

    const holder = bare.ballots[0].voter;
    const backed = bare.ballots[0].voted;
    world(CAST6, CAST6.slice(0, 2));
    plantDagger(holder, CAST6);
    const armed = runRoundTable(4, seededRng(seed));
    expect(armed.banished, 'the Dagger left the table with nobody to banish').toBeTruthy();
    expect(armed.banished, 'one vote counted twice and the room still deadlocked').toBe(backed);
    expect(armed.revotes.length).toBe(0);
  });

  it('writes no belief and no bond — the tally is the whole of its effect', () => {
    // The same restraint a mission keeps, for the same measured reason: a bond
    // write feeds bondResistance() into suspicion(), so a power that nudged
    // bonds would be moving the deduction bands from a mechanic that has
    // nothing to do with deduction.
    world(CAST6, CAST6.slice(0, 2));
    const before = JSON.stringify(gs.bonds);
    learnCalls.length = 0;
    capture.on = true;
    try {
      plantDagger(CAST6[5], CAST6);
      expect(daggerWeights(4, CAST6)).toEqual({ [CAST6[5]]: DAGGER_VOTES });
      settleDaggers(4);
    } finally { capture.on = false; }
    expect(learnCalls.length, 'the Dagger taught somebody something').toBe(0);
    expect(JSON.stringify(gs.bonds), 'the Dagger moved a bond').toBe(before);
  });

  it('is drawn once and then it is gone, and only one is ever held', () => {
    world(CAST6, CAST6.slice(0, 2));
    const d = plantDagger(CAST6[5], CAST6);
    expect(heldDagger()).toBe(d);
    expect(daggerWeights(4, CAST6)).toEqual({ [CAST6[5]]: DAGGER_VOTES });
    expect(d.outcome).toBe('played');
    expect(d.playedEp).toBe(4);
    expect(heldDagger(), 'a drawn Dagger was still in the pocket').toBe(null);
    expect(daggerWeights(5, CAST6), 'the same Dagger was drawn twice').toBe(null);

    // ONE IN A POCKET AT A TIME, ASSERTED WHERE IT IS DECIDED. The population
    // arm further down watches for a second Dagger arriving while the first is
    // still held, and it is not enough on its own: only 22 seasons in 400
    // award more than one at all, and the overlap the rule forbids is rarer
    // still, so removing the check left that arm GREEN. (Found by running the
    // mutation, which is the whole reason for running them — a guard that
    // cannot fail is not a guard, and "necessary, not sufficient" is exactly
    // this shape.) The rule is decided in `daggerAfternoon`, so it is asserted
    // there, where it fires every time.
    world(CAST6, CAST6.slice(0, 2));
    const pocketed = plantDagger(CAST6[5], CAST6);
    expect(daggerAfternoon(CAST6),
      'a second vault opened while a Dagger was still in a pocket').toBe(false);
    daggerWeights(4, CAST6);
    expect(pocketed.outcome).toBe('played');
    expect(daggerAfternoon(CAST6),
      'the vault stayed shut after the Dagger was spent').toBe(true);
    // And the room still has to be small: the two clauses are independent.
    expect(daggerAfternoon(CAST20), 'a Dagger was down there in a castle of twenty')
      .toBe(false);

    // Held, and its owner leaves the castle carrying it. That is not 'held'
    // any more and it must not be recorded as though it were — the whole
    // measurement of whether this power reaches the endgame turns on the
    // difference between a live finalist's pocket and a dead man's.
    world(CAST6, CAST6.slice(0, 2));
    const e = plantDagger(CAST6[5], CAST6);
    gs.activePlayers = CAST6.filter(n => n !== CAST6[5]);
    settleDaggers(6);
    expect(e.outcome).toBe('lost');
    expect(e.lostEp).toBe(6);
    expect(daggerWeights(6, gs.activePlayers), 'a Dagger was drawn from beyond the grave')
      .toBe(null);
  });

  it('a Traitor who saw it won goes after the holder; one who did not cannot', () => {
    // THE MIRROR OF THE SHIELD'S PENALTY, and a paired within-seed test for
    // exactly the reason recorded there: counting how often a fixed player is
    // named measures the roster, not the mechanic. Each seed asks whether THIS
    // Traitor moves ONTO a name they would not otherwise have chosen, with the
    // control being the same Dagger, the same board, and this Traitor simply
    // not on the witness list.
    const cast = CAST10.slice(0, 6);
    const traitor = cast[0];
    let movedOnto = 0, movedBlind = 0, movedAblated = 0, asked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      world(cast, [traitor]);
      const bare = formPreference(traitor, 2, seededRng(seed)).target;
      const mark = cast.find(n => n !== traitor && n !== bare);
      if (!mark) continue;
      asked++;

      world(cast, [traitor]);
      plantDagger(mark, cast);
      heldDagger().witnesses.push(traitor);
      if (formPreference(traitor, 2, seededRng(seed)).target === mark) movedOnto++;

      world(cast, [traitor]);
      plantDagger(mark, cast);
      if (formPreference(traitor, 2, seededRng(seed)).target === mark) movedBlind++;

      // THE ABLATION ARM, AND THE ARM THAT PROVES IT ABLATES SOMETHING.
      // `_setDaggerSteeringEnabled(false)` exists so a calibration arm can
      // separate "a Dagger existed" from "the pact went after it"; a switch
      // that turned off something inert would leave every band green and say
      // nothing. Same witness list as the arm above, switch off, no movement.
      world(cast, [traitor]);
      plantDagger(mark, cast);
      heldDagger().witnesses.push(traitor);
      _setDaggerSteeringEnabled(false);
      try {
        if (formPreference(traitor, 2, seededRng(seed)).target === mark) movedAblated++;
      } finally { _setDaggerSteeringEnabled(true); }
    }
    console.log(`[population] the conclave switched onto the Dagger it had watched being won on `
      + `${movedOnto}/${asked} nights, and onto one it had not seen ${movedBlind}/${asked}`);
    // The blind arm is EXACTLY zero and not merely small: with no witness there
    // is no term, so the score is bit-identical and the pick cannot move.
    expect(movedBlind, 'a Dagger steered a Traitor who never saw it won').toBe(0);
    // 60/60 HERE, AND THAT IS THE FIXTURE RATHER THAN THE WEIGHT. This world
    // is six strangers with no bonds and no season behind them, so every
    // Traitor's board is scatter with a narrow spread and a bonus of 2.5 clears
    // all of it. It does NOT clear a real board: measured over 400 played
    // seasons the pact murders 41.6% of the Dagger holders it watched win one
    // against 14.0% of the ones it did not — a real effect, and nothing like
    // an override. The floor is left well below 60 so that this stays a test
    // of the term being APPLIED rather than a pin on a number produced by a
    // fixture with no information in it.
    expect(movedOnto, 'the conclave never once went after a Dagger it had seen won')
      .toBeGreaterThan(8);
    expect(movedAblated, 'the steering ablation left the steering on').toBe(0);
    expect(movedOnto, 'the ablation arm holds nothing out: the switch is a no-op')
      .toBeGreaterThan(movedAblated);
  });
});

describe('and it is still there at the end: the Dagger reaches the endgame', () => {
  // THE DESIGN TEST OF THE WHOLE POWER, and the reason it is a population
  // question. Spec 7.3 says the Dagger decides seasons by breaking 3-3
  // endgame deadlocks; a Dagger handed over in a room of eighteen and spent
  // that evening satisfies the first sentence of that bullet and makes the
  // second one impossible. Two mechanisms carry it: the vault has a Dagger in
  // it only once the castle is small, and nothing expires one afterwards.
  const SEASONS = 400;

  it('is won late, kept, and drawn in a room small enough for it to decide something', () => {
    const ss = seasons(SEASONS);
    const daggers = allDaggers(ss);
    expect(daggers.length, 'no Dagger was won at all in 400 seasons').toBeGreaterThan(100);

    const played = daggers.filter(d => d.outcome === 'played');
    const rooms = [];
    for (const s of ss) {
      for (const d of s.daggers) {
        if (d.outcome !== 'played') continue;
        // BOTH LISTS, because a kept Dagger's whole purpose is to reach the
        // last table and `playTraitorsSeason` hands the endgame's tables back
        // separately from the mandated season's (js/tr/headless.js explains
        // why). Searching `s.rounds` alone made this assertion go red on the
        // very state spec 7.3 wants: a Dagger drawn in the finale.
        const round = [...s.rounds, ...(s.endgame?.rounds || [])]
          .find(r => r.ep === d.playedEp);
        expect(round, `a Dagger was drawn at ep ${d.playedEp}, where no table sat`).toBeTruthy();
        expect(round.dagger?.holder, 'a Dagger was drawn and the round did not record it')
          .toBe(d.holder);
        rooms.push(round.ballots.length);
      }
    }
    const small = rooms.filter(n => n <= 6).length;
    console.log(`[population] ${SEASONS} seasons: ${daggers.length} Daggers, ${played.length} drawn; `
      + `room size at the draw min ${Math.min(...rooms)} max ${Math.max(...rooms)}, `
      + `${small} of ${rooms.length} drawn in a room of six or fewer`);
    // NOT ONE is drawn in a big room. This is a rule and not a band: `drawAt`
    // is capped at nine when it is rolled, so a draw in a room of ten would
    // mean the table had stopped reading the number the holder decided on.
    expect(Math.max(...rooms), 'a Dagger was drawn in a room too big for it to matter')
      .toBeLessThanOrEqual(9);
    // And a real share of them are drawn in the endgame room the spec names.
    // Measured 44/106 over 400 seasons; the floor is a quarter.
    expect(small / rooms.length, 'no Dagger ever reached a room of six').toBeGreaterThan(0.25);
  });

  it('the commonest ending is that it was never used, which is the point', () => {
    const ss = seasons(SEASONS);
    const daggers = allDaggers(ss);
    const by = {};
    for (const d of daggers) by[d.outcome] = (by[d.outcome] || 0) + 1;
    console.log('[population] Dagger outcomes over 400 seasons:', JSON.stringify(by));

    // Every record is closed, and 'held' at the end of a season means exactly
    // one thing: unspent, and its owner is still standing. A record that used
    // the same word for a dead man's pocket would make this unanswerable.
    for (const s of ss) {
      for (const d of s.daggers) {
        expect(['held', 'played', 'lost'], `unknown outcome ${d.outcome}`).toContain(d.outcome);
        if (d.outcome === 'held') {
          expect(s.survivors,
            `${d.holder} ended the season 'holding' a Dagger and is not in the castle`)
            .toContain(d.holder);
        }
        if (d.outcome === 'lost') {
          expect(s.survivors,
            `${d.holder} 'lost' a Dagger and is standing there holding it`).not.toContain(d.holder);
        }
      }
    }
    // BOTH ENDINGS REACHABLE. A Dagger that always reached the last table
    // would be an entitlement rather than a gamble, and one that never did
    // would be the mid-game trinket this design exists to avoid. Measured over
    // 400 seasons: 106 drawn, 71 lost with their holder, 24 still in a
    // survivor's hand when the season ran out of rounds — the last of which is
    // the state the endgame (Task 7) inherits and the only one from which a
    // 3-3 deadlock can be broken.
    expect(by.held || 0, 'no Dagger ever survived to the end of a season unspent')
      .toBeGreaterThan(5);
    expect(by.lost || 0, 'a Dagger was never once buried with its holder').toBeGreaterThan(20);
    expect(by.played || 0, 'no Dagger was ever drawn').toBeGreaterThan(40);
  });

  it('one relic per afternoon, and a Dagger only once the castle is small', () => {
    // 200 AND NOT 120 BECAUSE OF THE COVERAGE FLOOR BELOW. Only 22 seasons in
    // 400 award more than one Dagger, so at 120 the "a second one arrived
    // while the first was still held" arm expects 6.6 seasons with two and
    // would come back with none often enough to matter.
    const ss = seasons(200);
    let reliquaries = 0, shieldAfternoons = 0, daggerAfternoons = 0;
    for (const s of ss) {
      for (const m of s.missions.filter(x => x.id === 'the-reliquary')) {
        reliquaries++;
        expect(!!m.shield !== !!m.dagger,
          'a Reliquary recorded both relics, or neither').toBe(true);
        if (m.shield) shieldAfternoons++; else daggerAfternoons++;
        const room = m.teams[0].members.length + m.teams[1].members.length;
        if (m.dagger) {
          expect(room, `a Dagger was down there in a castle of ${room}`).toBeLessThanOrEqual(12);
        }
      }
      // AT MOST ONE IN A POCKET AT A TIME. A Dagger does not expire, so
      // without the check in `daggerAfternoon` a late season with two
      // Reliquaries would award a second one that could never be drawn —
      // written, witnessed and unreachable, which is the shape Task 3
      // measured and rejected.
      const order = s.daggers.map(d => d.ep);
      expect(order, 'daggers are out of order on the ledger')
        .toEqual([...order].sort((a, b) => a - b));
      for (let i = 1; i < s.daggers.length; i++) {
        expect(s.daggers[i - 1].outcome,
          'a second Dagger was awarded while the first was still in a pocket')
          .not.toBe('held');
      }
      // And every Dagger traces to the afternoon that produced it, the same
      // way every Shield does.
      for (const d of s.daggers) {
        const m = s.missions.find(x => x.ep === d.ep && x.dagger);
        expect(m, `a Dagger at ep ${d.ep} came from no mission at all`).toBeTruthy();
        expect(m.id).toBe('the-reliquary');
        expect(m.dagger.found).toBe(true);
        expect(m.dagger.searcher).toBe(d.holder);
      }
    }
    const multi = ss.filter(s => s.daggers.length > 1).length;
    console.log(`[population] ${reliquaries} Reliquary afternoons: ${shieldAfternoons} with a `
      + `Shield in the vault, ${daggerAfternoons} with a Dagger; ${multi} seasons awarded more `
      + 'than one');
    expect(multi, 'no season ever awarded a second Dagger: the one-at-a-time arm is vacuous')
      .toBeGreaterThan(0);
    expect(shieldAfternoons, 'the vault never held a Shield').toBeGreaterThan(20);
    expect(daggerAfternoons, 'the vault never held a Dagger').toBeGreaterThan(20);
  });

  it('the sentence about who saw it agrees with the Dagger\'s own witness list', () => {
    // THE STANDING REQUIREMENT OF THIS PLAN, restated for the second power.
    // The pool is SHARED with the Shield, which is right — from the top of the
    // stair nobody can tell what came out of the casket — and it is the reason
    // one line had to change: it used to end "exactly what she is carrying
    // TONIGHT", which is true of a Shield and false of a Dagger, and it
    // printed over a woman who was still carrying hers when she was banished
    // the following evening. Found by dumping dagger seasons and reading them.
    const daggers = allDaggers(seasons(200));
    const tiers = {};
    for (const d of daggers) {
      tiers[d.visibility] = (tiers[d.visibility] || 0) + 1;
      expect(d.witnesses, 'a Dagger witnessed itself').not.toContain(d.holder);
      if (d.visibility === 'unseen') {
        expect(d.witnesses.length, `"${d.seenLine}" printed over ${d.witnesses.length} witnesses`)
          .toBe(0);
      } else {
        expect(d.witnesses.length, `tier ${d.visibility} printed over an empty witness list`)
          .toBeGreaterThan(0);
      }
      // No line may claim the thing is a one-night prize: it is not.
      expect(d.seenLine, `"${d.seenLine}" gives a Dagger an expiry date`)
        .not.toMatch(/tonight|by morning|until dawn/i);
      // And every rendered line is rendered — an unsubstituted placeholder is
      // how the capitalised pronoun forms were found missing in the first place.
      expect(d.seenLine).not.toMatch(/\{[A-Za-z]+\}/);
      expect(d.drawLine).not.toMatch(/\{[A-Za-z]+\}/);
    }
    console.log('[population] Dagger visibility tiers:', JSON.stringify(tiers));
    expect(tiers.few || 0).toBeGreaterThan(0);
    expect(tiers.some || 0).toBeGreaterThan(0);
    expect(tiers.unseen || 0, 'no Dagger was ever won unobserved').toBeGreaterThan(0);
  });
});
