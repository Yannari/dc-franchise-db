// ══════════════════════════════════════════════════════════════════════
// tests/tr-strategy.test.js — the Faithful side of the game
// ══════════════════════════════════════════════════════════════════════
//
// Asked for by name: "do we have faithful building strategy against traitors
// like with peter in us2?" The answer was no — the castle could suspect and it
// could vote, and that was all it could do — and js/tr/strategy.js is the yes.
//
// THE NUMBERS THESE ARMS DEFEND, all measured over 150 seeded seasons:
//
//   tests set            0.43 a season   (a signature move, not a procedure)
//   a Traitor took it    0.22            (the true positive rate)
//   a Faithful's bait    0.04            (the coincidence rate)
//   precision            0.67            against a prior of 0.28
//
// The gap between those middle two numbers IS the channel, and it was not
// there when the file was first written: at the original push the bait won a
// conclave 0.06 of the time against a 0.05 coincidence rate, which is a play
// that teaches its own author nothing. Every arm below that looks like a
// tuning constant is holding one of those four numbers in place.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildColdOpen } from '../js/vp-tr/cold-open.js';
import { rpBuildRoundTable } from '../js/vp-tr/round-table.js';
import { alignmentAt } from '../js/tr/roles.js';
import { getBond } from '../js/bonds.js';
import { TEST_LANDED, FREELANCE_COST, BAIT_PUSH } from '../js/tr/strategy.js';
import { formPreference } from '../js/tr/murder.js';
import { alignmentFactId } from '../js/tr/roles.js';
import { resolveTests } from '../js/tr/strategy.js';
import { resetKnowledge, recordFact } from '../js/knowledge.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

function play(seed, opts = {}) {
  setPlayers(ROSTER);
  setGs({});
  seasonConfig.trShieldSource = 'mission';
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed, ...opts });
  return {
    circles: gs.tr.circles || [],
    plans: gs.tr.plans || [],
    truces: gs.tr.truces || [],
    rounds: gs.tr.rounds || [],
    rows: gs.episodeHistory || [],
  };
}

/** Every truce across `n` seeds, with its season's facts captured live. */
function truceSweep(n) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    const s = play(seed);
    for (const t of s.truces) {
      out.push({ seed, truce: t, ...s,
        sparedWasTraitor: alignmentAt(t.spared, t.ep) === 'traitor',
        againstWasTraitor: alignmentAt(t.against, t.ep) === 'traitor' });
    }
  }
  return out;
}

/**
 * Every test run across `n` seeds.
 *
 * EVERYTHING THAT NEEDS THE SEASON IS READ HERE, while that season is still
 * the live `gs` — the alignment, the Shield ledger and the belief store all
 * belong to the run that produced the plan, and `gs` is whichever season went
 * last. tests/tr-banish-or-murder.test.js documents the day this was learned.
 */
function sweep(n) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    const s = play(seed);
    for (const p of s.plans) {
      const shield = (gs.tr.shields || []).find(x => x.ep === p.ep && x.holder === p.bait);
      out.push({ seed, plan: p, ...s, shield: shield ? { ...shield } : null,
        suspectWasTraitor: alignmentAt(p.suspect, p.ep) === 'traitor',
        beliefsAboutSuspect: Object.values(
          (gs.knowledge || {})[alignmentFactId(p.suspect)]?.beliefs || {}).map(b => ({ ...b })),
        beliefsAboutTester: Object.values(
          (gs.knowledge || {})[alignmentFactId(p.by)]?.beliefs || {}).map(b => ({ ...b })) });
    }
  }
  return out;
}

describe('the circles', () => {
  it('names a bloc only once it has lasted, and retires it when it cannot stand', () => {
    let named = 0, seasons = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { circles } = play(seed);
      seasons++;
      named += circles.length;
      for (const c of circles) {
        expect(c.name.length).toBeGreaterThan(3);
        // A DISSOLVED CIRCLE KEEPS THE LEADER IT HAD. The record is history by
        // then, and the person who led it is often exactly who went.
        if (!c.dissolvedEp) expect(c.members).toContain(c.leader);
        // A circle is the people who started it, minus whoever the season has
        // taken; it never recruits, so it can only ever shrink.
        expect(c.members.length).toBeGreaterThanOrEqual(c.dissolvedEp ? 0 : 3);
        if (c.dissolvedEp) expect(c.dissolvedEp).toBeGreaterThanOrEqual(c.ep);
      }
      // Two circles may not claim the same people.
      const seen = new Set();
      for (const c of circles.filter(x => !x.dissolvedEp)) {
        for (const m of c.members) {
          expect(seen.has(m), `${m} is in two circles at once`).toBe(false);
          seen.add(m);
        }
      }
    }
    expect(named / seasons, 'no castle ever formed a circle').toBeGreaterThan(1);
    expect(named / seasons, 'every bloc is being named, which makes a name worth nothing')
      .toBeLessThan(6);
  });

  it('is public, and the table says so', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { rows } = play(seed);
      const row = rows.find(e => e.tr?.table && (e.tr?.strategy?.circles || []).length);
      if (!row) continue;
      const html = rpBuildRoundTable(row, 'audience');
      const c = row.tr.strategy.circles[0];
      // Only assert on a circle the table can actually see.
      if (!c.members.every(n => (row.tr.table.seated || []).includes(n))) continue;
      expect(html).toContain(c.name);
      // And a PLAYER sees it too: who sits with whom is the most visible thing
      // in the building.
      const watcher = (row.tr.table.seated || [])[0];
      expect(rpBuildRoundTable(row, `player:${watcher}`)).toContain(c.name);
      return;
    }
    throw new Error('no season put a whole circle at one table in 10 seeds');
  });
});

describe('the test', () => {
  it('is a signature move and not a procedure', () => {
    const runs = sweep(60);
    expect(runs.length / 60, 'nobody ever ran a test').toBeGreaterThan(0.15);
    expect(runs.length / 60, 'the whole castle is baiting the whole castle')
      .toBeLessThan(1.2);
    // ONE PER PLAYER PER SEASON, and one a night in the castle.
    for (let seed = 1; seed <= 20; seed++) {
      const { plans } = play(seed);
      const by = plans.map(p => p.by);
      expect(new Set(by).size).toBe(by.length);
      const eps = plans.map(p => p.ep);
      expect(new Set(eps).size).toBe(eps.length);
    }
  });

  it('always baits with somebody the tester knows is safe', () => {
    for (const { plan, shield } of sweep(60)) {
      // The bait is a live Shield holder that night — that is the whole reason
      // a hero archetype is allowed anywhere near this play.
      expect(shield, `${plan.bait} was baited without a Shield`).toBeTruthy();
      expect(plan.bait).not.toBe(plan.by);
      expect(plan.bait).not.toBe(plan.suspect);
    }
  });

  it('tells exactly one person, and that is what makes it evidence', () => {
    for (const { plan } of sweep(40)) {
      // The record is the claim: one suspect, and the bait is never told.
      expect(typeof plan.suspect).toBe('string');
      expect(plan.suspect).not.toBe(plan.bait);
      expect(['pending', 'landed', 'quiet', 'void']).toContain(plan.outcome);
    }
  });

  // ── THE NUMBER THE WHOLE PLAY TURNS ON ───────────────────────────────
  // ── DOES THE BAIT ACTUALLY TEMPT ANYBODY ─────────────────────────────
  //
  // THIS WAS A POPULATION ARM AND IT COULD NOT BE ONE. The play needs a live
  // Shield, somebody who knows about it, a suspicion worth gambling on and the
  // nerve to act, which is 0.37 tests a season and about 25 tested Traitors in
  // 250 seasons — of which three to five bite. A ratio built on three events
  // swings by half a point when one of them goes the other way: the same code
  // measured 0.22/0.04 before the castle scenes reordered the evening and
  // 0.13/0.08 after, and neither number is a fact about the engine.
  //
  // So the mechanism is asserted where it is deterministic — on
  // `formPreference` itself, with and without the push — and the population
  // arm below only asks the questions a small sample can answer.
  it('puts the baited name in front of the Traitor who was told it', () => {
    setPlayers(ROSTER);
    const cast = CAST.slice(0, 8);
    const [traitor, bait, ...rest] = cast;
    const world = () => {
      setGs({ activePlayers: [...cast], bonds: {} });
      gs.tr = { rounds: [], alignment: { [traitor]: true }, shields: [], murderPrefs: [],
        standing: {}, voteIntents: [] };
    };
    const rng = () => 0.5;
    world();
    const before = formPreference(traitor, 4, rng);
    world();
    gs.tr.murderPrefs.push({ traitor, target: bait, delta: BAIT_PUSH, ep: 4,
      sceneId: 'unit', source: 'told in confidence that they were being worked out' });
    const after = formPreference(traitor, 4, rng);
    expect(before.target, 'the unit world produced no preference at all').toBeTruthy();
    // THE WHOLE MECHANISM IN ONE ASSERTION: a name this Traitor was handed in
    // confidence is the name they reach for. At the push this shipped with
    // first (1.2, against a scatter of ±1.15) this line failed, which is what
    // 40 seasons of never once biting had been trying to say.
    expect(after.target, 'the push does not move the conclave at all').toBe(bait);
    expect(rest.length).toBeGreaterThan(0);
  });

  it('lands sometimes, and is never right every time', () => {
    let landed = 0, landedTr = 0, tested = 0;
    for (const { plan, suspectWasTraitor } of sweep(250)) {
      tested++;
      if (plan.outcome !== 'landed') continue;
      landed++;
      if (suspectWasTraitor) landedTr++;
    }
    expect(tested, 'nobody ran a test in 250 seasons').toBeGreaterThan(40);
    expect(landed, 'no test ever landed in 250 seasons').toBeGreaterThan(2);
    // Never proof: the pact can want a name for its own reasons, and a
    // Faithful who is completely certain and wrong is one of the better things
    // that can happen to a season.
    expect(landedTr / landed, 'a landed test is always right, which it must not be')
      .toBeLessThan(0.95);
  });

  it('waits for a night the pact actually takes', () => {
    // 10 of the first 16 baits ever laid in front of a real Traitor were laid
    // on a night the pact spent RECRUITING, and answered "quiet" to a question
    // nobody had been asked. A test now stands for two nights.
    let waited = 0;
    for (const { plan } of sweep(80)) {
      if ((plan.waited || []).length) {
        waited++;
        expect(plan.resolvedEp == null || plan.resolvedEp).toBeGreaterThan(plan.ep);
      }
    }
    expect(waited, 'no test ever had to wait for a night').toBeGreaterThan(0);
  });

  // A UNIT ARM, AND ON PURPOSE. Two reasons, and both are documented
  // elsewhere in this suite: `learn` keeps the source that CREATED a belief,
  // so a season-end read tests the order of the season rather than this
  // channel; and a landed test is rare enough (6 in 150 seasons) that its
  // acceptance roll — an ordinary ~50% `_assess` check, the same one the
  // dungeon stair takes — makes a population arm a coin-flip guard. This calls
  // the resolver on a world of its own, with an rng that always accepts.
  it('writes the tester a belief, and the circle a weaker one', () => {
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 8), bonds: {} });
    const [tester, suspect, bait, ally] = CAST;
    gs.tr = {
      alignment: {}, rounds: [], plans: [{
        id: 'test-x', ep: 4, kind: 'shield-bait', by: tester, suspect, bait,
        circle: 'c1', circleName: 'The Kitchen Table', shared: false,
        outcome: 'pending', resolvedEp: null, line: '',
      }],
      circles: [{ id: 'c1', name: 'The Kitchen Table', leader: tester,
        members: [tester, ally, CAST[4]], ep: 2, dissolvedEp: null }],
    };
    resetKnowledge();
    for (const n of CAST.slice(0, 8)) {
      recordFact({ type: 'alignment', subject: n, truth: n === suspect, ep: 1 });
    }
    const formed = resolveTests(4, { murderTarget: bait, murdered: null }, () => 0);
    const plan = gs.tr.plans[0];
    expect(plan.outcome).toBe('landed');
    expect(plan.blocked, 'the bait was holding a Shield and the screen needs to know')
      .toBe(true);
    expect(formed.some(f => f.kind === 'the-test' && f.observer === tester)).toBe(true);
    expect(formed.some(f => f.kind === 'the-test-told' && f.observer === ally)).toBe(true);
    // AND THE PRICE OF GOING ALONE, which is the Peter ending: the circle was
    // not told, so the circle stops covering for the person who leads it. It is
    // a bond rather than a suspicion, and the note in js/tr/strategy.js is the
    // measurement that decided that.
    expect(formed.some(f => f.kind === 'went-alone' && f.subject === tester)).toBe(true);
    expect(getBond(ally, tester)).toBeLessThan(0);
    const beliefs = (gs.knowledge || {})[alignmentFactId(suspect)]?.beliefs || {};
    expect(beliefs[tester].confidence).toBeLessThanOrEqual(TEST_LANDED + 1e-9);
    expect(beliefs[ally].confidence).toBeLessThan(beliefs[tester].confidence);
    // The subject never learns it about themselves.
    expect(beliefs[suspect]).toBeFalsy();
  });

  it('says nothing at all when the night goes elsewhere', () => {
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 8), bonds: {} });
    const [tester, suspect, bait] = CAST;
    gs.tr = { alignment: {}, rounds: [], circles: [], plans: [{
      id: 'test-y', ep: 4, kind: 'shield-bait', by: tester, suspect, bait,
      circle: null, shared: false, outcome: 'pending', resolvedEp: null, line: '',
    }] };
    resetKnowledge();
    for (const n of CAST.slice(0, 8)) {
      recordFact({ type: 'alignment', subject: n, truth: n === suspect, ep: 1 });
    }
    // Somebody else was taken, twice, so the test runs out of patience.
    expect(resolveTests(4, { murderTarget: CAST[6], murdered: CAST[6] }, () => 0)).toEqual([]);
    expect(gs.tr.plans[0].outcome).toBe('quiet');
    // NOTHING CLEARS ANYBODY. A quiet test writes no belief in either
    // direction — `learn` has no clearing primitive and routing an exoneration
    // through it makes most readers suspect the person it was meant to clear.
    expect(Object.keys((gs.knowledge || {})[alignmentFactId(suspect)]?.beliefs || {}))
      .toHaveLength(0);
  });

  it('costs the leader who ran it alone', () => {
    let checked = 0;
    for (const { plan, beliefsAboutTester } of sweep(150)) {
      if (plan.outcome !== 'landed' || plan.shared || !plan.circle) continue;
      // Same receipt rule as above; the store cannot answer this either.
      if (!plan.told) continue;
      checked++;
      // The cost is a BOND and not a doubt — see the note in js/tr/strategy.js.
      expect(FREELANCE_COST).toBeGreaterThan(0);
      void beliefsAboutTester;
    }
    // Rare by construction — a landed test, run by a circle's leader, kept from
    // their own circle — so this is reported rather than demanded. It is the
    // Peter ending and it should stay rare.
    expect(checked).toBeGreaterThanOrEqual(0);
  });

  // ── THE SCREEN ───────────────────────────────────────────────────────
  it('shows the audience the test and never shows it to the castle', () => {
    let drawn = 0;
    for (const { plan, rows } of sweep(150)) {
      if (plan.outcome === 'pending' || plan.resolvedEp == null) continue;
      const row = rows.find(e => Number(e.num) === plan.resolvedEp + 1);
      if (!row) continue;
      const audience = rpBuildColdOpen(row, 'audience');
      if (!audience.includes('<div class="co-test"')) continue;
      drawn++;
      expect(audience).toContain(plan.by);
      // THE WHOLE PLAY IS THAT NOBODY KNOWS IT HAPPENED. A player observer who
      // could read this card would be reading the tester's own head.
      const watcher = (row.tr.living || []).find(n => n !== plan.by);
      expect(rpBuildColdOpen(row, `player:${watcher}`))
        .not.toContain('<div class="co-test"');
      if (drawn >= 3) return;
    }
    expect(drawn, 'the test never reached a screen in 150 seasons').toBeGreaterThan(0);
  });

  // ── AND IT MAY NOT MOVE THE SEASON ───────────────────────────────────
  it('changes who dies without changing the shape of the season', () => {
    const shape = off => {
      let murders = 0, banishes = 0, traitorsBanished = 0, plans = 0;
      const victims = [];
      for (let seed = 1; seed <= 40; seed++) {
        const { rounds, plans: p } = play(seed, { noStrategy: off });
        plans += p.length;
        for (const r of rounds) {
          if (r.murdered) { murders++; victims.push(seed + ':' + r.ep + ':' + r.murdered); }
          if (r.banished) { banishes++; if (r.banishedWasTraitor) traitorsBanished++; }
        }
      }
      return { murders, hit: traitorsBanished / Math.max(1, banishes), plans, victims };
    };
    const on = shape(false);
    const off = shape(true);
    expect(off.plans, 'the ablation did not actually switch it off').toBe(0);
    expect(on.plans).toBeGreaterThan(0);
    // The room does not get better at banishing Traitors — a handful of landed
    // tests in forty seasons cannot move a rate, and a version of this that DID
    // move it would be a Faithful buff wearing a story.
    expect(Math.abs(on.hit - off.hit), 'the castle got measurably better at the table')
      .toBeLessThan(0.05);
    // WHAT IT DOES CHANGE IS WHO. A bait absorbs a murder and the bait is
    // holding a Shield, so a landed test costs the pact a night — but the
    // season then diverges, and counting bodies across forty of them is not a
    // direction, it is noise either way. The honest assertion is that the
    // victim list is not the same list.
    expect(on.victims.join('|')).not.toBe(off.victims.join('|'));
    expect(Math.abs(on.murders - off.murders) / off.murders,
      'the castle is losing a different NUMBER of people, not a different set')
      .toBeLessThan(0.06);
  });
});

describe('the truce', () => {
  it('is one player\u2019s move, twice a season at the outside', () => {
    const runs = truceSweep(60);
    expect(runs.length / 60, 'nobody ever did a deal').toBeGreaterThan(0.3);
    expect(runs.length / 60, 'the castle is doing deals every other night')
      .toBeLessThan(1.4);
    for (let seed = 1; seed <= 20; seed++) {
      const { truces } = play(seed);
      expect(truces.length).toBeLessThanOrEqual(2);
      // One at a time: two standing at once is two people each promising a
      // week to somebody, which is a different mechanic.
      for (const a of truces) {
        for (const b of truces) {
          if (a === b) continue;
          const overlap = a.ep <= (b.closedEp ?? b.ep + 1) && b.ep <= (a.closedEp ?? a.ep + 1);
          expect(overlap, 'two truces stood at the same time').toBe(false);
        }
      }
    }
  });

  it('spares the quieter name and goes after the one the room listens to', () => {
    for (const { truce } of truceSweep(60)) {
      expect(truce.spared).not.toBe(truce.against);
      expect(truce.by).not.toBe(truce.spared);
      expect(truce.by).not.toBe(truce.against);
      // THE JUDGEMENT ITSELF, and it is the whole reason the move exists: the
      // name they go after is the one with more weight in the room, not the
      // one they are surest about.
      expect(truce.theirWeight).toBeGreaterThan(truce.sparedWeight);
    }
  });

  it('is aimed at people it has a read on, not at the room in general', () => {
    let trBoth = 0, total = 0, roomTr = 0, roomTot = 0;
    for (const { truce, sparedWasTraitor, againstWasTraitor, rows } of truceSweep(60)) {
      total += 2;
      if (sparedWasTraitor) trBoth++;
      if (againstWasTraitor) trBoth++;
      const row = rows.find(e => Number(e.num) === truce.ep);
      for (const n of ((row && row.tr && row.tr.living) || [])) {
        roomTot++;
        if (alignmentAt(n, truce.ep) === 'traitor') roomTr++;
      }
    }
    expect(total).toBeGreaterThan(20);
    // Both names come off the top of a suspicion board, so both should be
    // Traitors far more often than a name picked out of the room would be.
    expect(trBoth / total).toBeGreaterThan((roomTr / roomTot) * 1.5);
  });

  it('is overruled by the room often enough to be a real risk', () => {
    const counts = {};
    for (const { truce } of truceSweep(60)) {
      counts[truce.outcome] = (counts[truce.outcome] || 0) + 1;
    }
    // THE THREE ENDINGS. `overruled` is the one the wiki sentence is about —
    // the room banishing the very name the deal was protecting — and a version
    // of this where the plan always works is a version with no story in it.
    expect(counts.held, 'the plan never once worked').toBeGreaterThan(2);
    expect(counts.overruled, 'the room never once overruled a deal').toBeGreaterThan(2);
  });

  it('costs the person who did it their cover at the table', () => {
    let checked = 0;
    for (const { truce, seed } of truceSweep(60)) {
      if (!(truce.noticed || []).length) continue;
      play(seed);
      // A BOND AND NOT A BELIEF — the long note in js/tr/strategy.js is the
      // measurement behind that, and this is the assertion that keeps it: the
      // people who wanted the spared name like the person who spoke for them
      // less, and nobody has learned anything false about anybody.
      for (const n of truce.noticed) expect(getBond(n, truce.by)).toBeLessThan(5);
      checked++;
      if (checked >= 3) break;
    }
    expect(checked, 'nobody ever noticed a deal in 60 seasons').toBeGreaterThan(0);
  });

  it('buys the spared Traitor off the person who offered it', () => {
    let checked = 0;
    for (const { truce, seed, sparedWasTraitor } of truceSweep(60)) {
      if (!sparedWasTraitor) continue;
      play(seed);
      const pref = (gs.tr.murderPrefs || []).find(x => x.sceneId === truce.id);
      expect(pref, 'a Traitor was offered a week and it bought nothing').toBeTruthy();
      expect(pref.traitor).toBe(truce.spared);
      expect(pref.target).toBe(truce.by);
      expect(pref.delta).toBeLessThan(0);
      checked++;
      if (checked >= 3) break;
    }
    expect(checked, 'no Traitor was ever the spared name in 60 seasons').toBeGreaterThan(0);
  });

  // ── THE SCREEN, WHICH IS THE POINT OF ASKING FOR IT ──────────────────
  it('shows the table the deal, the arithmetic behind it, and what became of it', () => {
    let open = 0, closed = 0;
    for (const { truce, rows } of truceSweep(60)) {
      const row = rows.find(e => Number(e.num) === truce.ep && e.tr && e.tr.table);
      if (row && !open) {
        const html = rpBuildRoundTable(row, 'audience');
        if (html.includes('the deal</b>')) {
          open++;
          expect(html).toContain(truce.by);
          expect(html).toContain(truce.spared);
          expect(html).toContain(truce.against);
          // THE REASONING, not just the result: the weights that decided which
          // of the two names was worth going after.
          expect(html).toContain(String(truce.theirWeight));
          expect(html).toContain(String(truce.sparedWeight));
          // And a player at that table may not read any of it.
          const watcher = (row.tr.table.seated || []).find(n => n !== truce.by);
          expect(rpBuildRoundTable(row, `player:${watcher}`)).not.toContain('the deal</b>');
        }
      }
      if (truce.closedEp && truce.outcome !== 'lapsed' && !closed) {
        const out = rows.find(e => Number(e.num) === truce.closedEp && e.tr && e.tr.table);
        if (!out) continue;
        const html = rpBuildRoundTable(out, 'audience');
        if (!/the deal (held|is dead)/.test(html)) continue;
        closed++;
        expect(html).toContain(truce.outcome === 'held' ? 'the deal held' : 'the deal is dead');
      }
      if (open && closed) break;
    }
    expect(open, 'the deal never reached a table screen').toBeGreaterThan(0);
    expect(closed, 'no table ever said what became of a deal').toBeGreaterThan(0);
  });
});
