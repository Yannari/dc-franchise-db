// ══════════════════════════════════════════════════════════════════════
// tr-missions.test.js — the money, and the three things it must never buy
// ══════════════════════════════════════════════════════════════════════
//
// Spec 7.2: a mission pays a SHARED POT and nothing else. The pot has a
// ceiling and seasons are meant to fall short of it, because the sting of the
// format is a Faithful grinding all season for money two murderers will walk
// off with — and that sting only exists while the pot is a gamble rather than
// a formality with a fixed payout.
//
// The three guards, in the order they matter:
//
//   1. A MONEY MISSION BUYS NOTHING BUT MONEY. Every season below is played
//      TWICE, missions on and missions off, and the banishment/murder/
//      recruitment log must come back bit-identical. This is the honest form
//      of "missions never grant immunity": not a scan for a field called
//      `immunity`, but proof that removing missions entirely does not change
//      one thing about who lived, who died and who the room banished. A
//      shield, a save, a nudge to a ballot, a belief — any of them breaks it.
//   2. THE CEILING IS REAL. Asserted over a population, and asserted at the
//      boundary with a mission that wins more than the headroom left.
//   3. NOTHING ANYWHERE LEARNS AN ALIGNMENT ABOVE `deduced`. Swept over the
//      whole knowledge store of played seasons, not over one file's stack
//      frames.
//
// GUARDS 1 AND 3 WERE BOTH NARROWED FOR TASK 2, DELIBERATELY, AND EACH
// NARROWING CARRIES ITS OWN MUTATION. Task 2 adds the Chess mission, which
// spec 7.2 requires and whose entire purpose is to feed the deduction engine —
// so "a mission changes nothing" and "no mission ever causes a belief" both
// stopped being true, on purpose. What replaced them:
//
//   guard 1  was  "40 seasons are bit-identical with missions on and off"
//            now  the same 40 seasons, THE KNOWLEDGE ARCHETYPE HELD OUT of
//                 both arms (`_setKnowledgeMissionEnabled(false)`). The five
//                 money missions must still buy exactly nothing. Weaker by
//                 precisely one archetype and not one thing more — and paired
//                 with a guard-on-the-guard proving that archetype is what
//                 breaks it, so the hold-out cannot quietly become a hole.
//   guard 3  was  "no learn() call originates inside js/tr/missions.js" plus a
//                 source scan for the import. Both are STILL TRUE — the
//                 emission lives in js/tr/deduction.js — and both are now
//                 MISLEADING, because a green tick would read as "missions
//                 write no beliefs" when missions demonstrably cause them.
//                 They are replaced by the rule that actually binds this
//                 format (Task 1 handoff, verbatim: the rule is "no alignment
//                 belief above `deduced`", NOT "no `learn` call"): every
//                 alignment belief in the store of a played season is
//                 `deduced` or `rumor`, EXCEPT the three sanctioned `public`
//                 writers, and `observed` — the Seer's one write, which does
//                 not exist yet — appears nowhere at all.
//
// FILENAME: deliberately not *-audit.test.js — vitest.config.js excludes that
// pattern from `npm test`. Collection verified by running `npx vitest list`.
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// THE SPY WATCHES THE CALL, NOT THE STORE, AND THAT DISTINCTION IS A MUTATION
// THIS FILE FAILED ONCE. The credibility rule below was first written as a
// sweep over `allFacts()` after a season, and the mutation that should have
// killed it — the Chess channel writing `observed` instead of `deduced` —
// came back GREEN. Measured: over twelve seasons, only 2 of the ~250 beliefs
// the mission channel writes SURVIVE to the end of the season, because
// learn() overwrites a belief whenever newer evidence arrives at an equal or
// higher confidence and the murder channel sits at the same ceiling while the
// reveal sits above it at 1.0. A store sweep is a sweep over the survivors of
// an overwriting process; the credibility rule binds the WRITE.
//
// So both are asserted, and they are different guards: the spy sees every
// write in the game, and the store sweep still earns its place as a check on
// what the room ends a season actually holding.
//
// The spy is GATED, and the gate is not a nicety. Capturing on every learn()
// call across the ~700 seasons this file plays grows an array of several
// hundred thousand entries; only the credibility guards turn capture on. Left
// ungated an earlier version of this file was 150s on its own.
const { learnCalls, capture } = vi.hoisted(() => ({ learnCalls: [], capture: { on: false } }));

vi.mock('../js/knowledge.js', async (importOriginal) => {
  const orig = await importOriginal();
  return {
    ...orig,
    learn: (knower, id, opts = {}) => {
      if (capture.on) {
        learnCalls.push({ id, sourceType: opts.sourceType, source: opts.source,
          confidence: opts.confidence });
      }
      return orig.learn(knower, id, opts);
    },
  };
});

import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { playTraitorsSeason, rngFor } from '../js/tr/headless.js';
import { runMission, POT_CEILING, MISSION_IDS, _setMissionsEnabled,
  _setKnowledgeMissionEnabled } from '../js/tr/missions.js';
import { allFacts } from '../js/knowledge.js';
import { gs as _gs } from '../js/core.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** A roster of the same twenty people with every stat pinned. For the scaling arm. */
function flatRoster(v) {
  return ROSTER.map(p => ({ ...p, stats: Object.fromEntries(
    Object.keys(p.stats || {}).length
      ? Object.keys(p.stats).map(k => [k, v])
      : ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
        'boldness', 'intuition', 'temperament'].map(k => [k, v]),
  ) }));
}

/** A bare world with a living cast, for running one mission in isolation. */
function soloWorld() {
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
}

function seasons(n, opts = {}) {
  setPlayers(ROSTER);
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i + 1, ...opts }));
}

describe('missions fund a pot, and fund nothing else', () => {
  it('a season accumulates pot money across rounds, mission by mission', () => {
    const runs = seasons(12);
    for (const s of runs) {
      expect(s.missions.length, 'a season runs a mission a round').toBeGreaterThanOrEqual(3);
      expect(s.pot).toBeGreaterThan(0);

      // The pot IS the missions. Nothing else may ever pay into it.
      const summed = s.missions.reduce((a, m) => a + m.earned, 0);
      expect(summed).toBe(s.pot);

      // And it accumulates in order: each record's potAfter is the running
      // total at the moment it ran, which is what the VP will read back.
      let running = 0;
      for (const m of s.missions) {
        running += m.earned;
        expect(m.potAfter).toBe(running);
        expect(m.earned).toBeGreaterThanOrEqual(0);
      }

      // Teams come out of the LIVING, are disjoint, and cover the field.
      for (const m of s.missions) {
        expect(m.teams).toHaveLength(2);
        const all = m.teams.flatMap(t => t.members);
        expect(new Set(all).size).toBe(all.length);
        expect(m.teams.every(t => t.members.length > 0)).toBe(true);
        expect(all.every(n => CAST.includes(n))).toBe(true);
      }
    }
  });

  it('the pot never exceeds POT_CEILING, and stays well short of it', () => {
    const runs = seasons(200);
    const fr = runs.map(s => s.pot / POT_CEILING).sort((a, b) => a - b);
    expect(fr[fr.length - 1]).toBeLessThanOrEqual(1);

    // WHAT THIS ARM CAN AND CANNOT DO, because the mutation was run and the
    // answer was not the flattering one. Deleting the cap in runMission does
    // NOT turn this assertion red: measured over ten decorrelated 200-season
    // blocks, no season in 2,000 ever earns enough to reach the ceiling in the
    // first place (best 0.861 of it), so there is nothing here for the cap to
    // truncate. The cap's failability lives in the boundary test below, which
    // starts a mission 100 short of the ceiling. This arm's job is the OTHER
    // half of spec 7.2 — that seasons fall short — and that is what it asserts.
    //
    // The two bands are chosen off the block measurements, not off one run:
    //   mean       0.512, sd 0.0071 across ten blocks -> 0.62 is ~15 sd clear
    //   95th pct   0.679, sd 0.011  across ten blocks -> 0.60 is ~7 sd clear
    // The obvious statistic — the block MAXIMUM — was measured first and
    // rejected: 0.807 mean but sd 0.038 with a low block of 0.731, so a
    // threshold anywhere useful is a coin flip on block noise.
    const mean = fr.reduce((a, b) => a + b, 0) / fr.length;
    expect(mean, 'seasons must fall well short of the ceiling on average')
      .toBeLessThan(0.62);
    expect(fr[Math.floor(0.95 * (fr.length - 1))],
      'but the top of the distribution must get within reach of it')
      .toBeGreaterThan(0.60);
    expect(runs.filter(s => s.pot >= POT_CEILING).length,
      'maxing the pot must be rare — measured 0 in 2,000 seasons').toBeLessThanOrEqual(2);
  });

  it('a mission that wins more than the headroom banks only the headroom', () => {
    setPlayers(flatRoster(9));
    soloWorld();
    gs.tr.pot = POT_CEILING - 100;
    const m = runMission(4, rngFor(7));
    expect(m.gross, 'a full-strength cast must out-earn the headroom for this to test anything')
      .toBeGreaterThan(100);
    expect(m.earned).toBe(100);
    expect(gs.tr.pot).toBe(POT_CEILING);
    expect(m.potAfter).toBe(POT_CEILING);

    // And a mission run on a full pot earns nothing at all.
    const after = runMission(5, rngFor(8));
    expect(after.earned).toBe(0);
    expect(gs.tr.pot).toBe(POT_CEILING);
  });

  it('a season does not run the same mission twice in a row, and uses at least three', () => {
    const runs = seasons(30);
    const seen = new Set();
    for (const s of runs) {
      for (let i = 1; i < s.missions.length; i++) {
        expect(s.missions[i].id, `${s.missions[i].id} repeated back to back`)
          .not.toBe(s.missions[i - 1].id);
      }
      s.missions.forEach(m => seen.add(m.id));
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    expect([...seen].every(id => MISSION_IDS.includes(id))).toBe(true);
  });

  it('earnings scale with how the teams performed', () => {
    // Same seeds, same archetype rotation, same team shuffle — only the stats
    // of the people doing it change. The separation is total rather than
    // statistical (the weakest run of the strong cast beats the strongest run
    // of the weak one by a wide margin), so there is no sampling question to
    // answer here.
    const earn = (v) => {
      setPlayers(flatRoster(v));
      return Array.from({ length: 40 }, (_, i) => {
        soloWorld();
        return runMission(3, rngFor(i + 1)).earned;
      });
    };
    const weak = earn(2), mid = earn(5), strong = earn(9);
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    expect(mean(weak)).toBeLessThan(mean(mid));
    expect(mean(mid)).toBeLessThan(mean(strong));
    expect(Math.max(...weak)).toBeLessThan(Math.min(...strong));
  });
});

describe('a mission grants NOTHING but money', () => {
  it('40 seasons are bit-identical with the five money missions on and off', () => {
    // THE IMMUNITY GUARD, NARROWED BY EXACTLY ONE ARCHETYPE FOR TASK 2.
    //
    // If a money mission could shield anybody from a murder, save anybody at a
    // table, nudge a ballot or write a single belief, the two arms would
    // diverge somewhere in forty seasons. They may not. The Chess mission is
    // held out of BOTH arms rather than the assertion being softened, because
    // softening it is how a guard dies: "mostly identical" has no failure
    // state. Held out, the original claim survives intact for the five
    // archetypes it is still true of, and the sixth is guarded by the
    // credibility rule below and by the next test, which proves it is the one
    // and only thing that breaks this.
    const project = (s) => s.log.map(r => [
      r.ep, r.banished, r.wasTraitor, r.murdered, r.murderTarget, r.blocked,
      r.executed, r.recruited?.target ?? null, r.recruited?.accepted ?? null,
      // The castle stream too: the mission must not displace a single
      // pickEvent() draw either, which is what its own rng exists for.
      (r.castleEvents || []).map(e => e.id).join(','),
    ].join('|')).join('\n') + `\n${s.winner}|${s.survivors.join(',')}`;

    let on, off;
    try {
      _setKnowledgeMissionEnabled(false);
      on = seasons(40).map(project);
      _setMissionsEnabled(false);
      off = seasons(40).map(project);
    } finally {
      _setMissionsEnabled(true);
      _setKnowledgeMissionEnabled(true);
    }
    for (let i = 0; i < on.length; i++) {
      expect(off[i], `season ${i + 1} diverged when the money missions were switched off`)
        .toBe(on[i]);
    }

    // Guard on the guard: the arms must differ in the ONE place they should.
    let potsOn;
    try {
      _setKnowledgeMissionEnabled(false);
      potsOn = seasons(5).map(s => s.pot);
      _setMissionsEnabled(false);
      expect(seasons(5).map(s => s.pot)).toEqual([0, 0, 0, 0, 0]);
    } finally { _setMissionsEnabled(true); _setKnowledgeMissionEnabled(true); }
    expect(potsOn.every(p => p > 0)).toBe(true);
  });

  it('and the Chess mission is precisely what that hold-out is holding out', () => {
    // THE SECOND HALF OF THE NARROWING, and without it the hold-out above is
    // just a hole: a switch that turned off something inert would leave the
    // guard green and say nothing. Same forty seeds, the ONLY difference being
    // whether the knowledge archetype is in the rotation. The season must
    // actually come out differently — a mission that feeds the deduction
    // engine and changes nobody's fate is decoration, and this is the
    // assertion that would catch it going quiet (a mispriced channel, a
    // reader gate that never opens, an emission hook silently unwired).
    const project = (s) => s.log.map(r =>
      [r.ep, r.banished, r.wasTraitor, r.murdered].join('|')).join(String.fromCharCode(10));
    let without;
    try {
      _setKnowledgeMissionEnabled(false);
      without = seasons(120).map(project);
    } finally { _setKnowledgeMissionEnabled(true); }
    const withIt = seasons(120).map(project);
    const diverged = withIt.filter((v, i) => v !== without[i]).length;
    // SEPARATION, STATED, and 120 seasons rather than 40 because of it.
    // Measured 45/120 = 37.5% of seasons change their banishment/murder log. At
    // n=40 the binomial sd on that is 2.8 seasons and any useful floor sits
    // barely 2 sd clear, which is the coin flip this project has stopped
    // shipping; at n=120 the sd is 5.3 seasons and the floor below is
    // 5.7 sd clear. It is placed where a channel that had gone HALF
    // quiet would still fail, not merely one that had gone silent.
    expect(diverged, `only ${diverged}/120 seasons changed when the Chess mission was added`)
      .toBeGreaterThan(15);
  });

  it('no mission record carries an immunity-shaped field', () => {
    const bad = /immun|shield|protect|save[ds]?$|safe/i;
    const walk = (v, trail) => {
      if (!v || typeof v !== 'object') return;
      for (const k of Object.keys(v)) {
        expect(bad.test(k), `${trail}.${k} looks like immunity`).toBe(false);
        walk(v[k], `${trail}.${k}`);
      }
    };
    seasons(8).forEach(s => s.missions.forEach(m => walk(m, m.id)));
  });
});

describe('nothing learns an alignment above `deduced`', () => {
  // THE RULE THAT REPLACED "no learn() call in js/tr/missions.js", and the
  // replacement is STRONGER rather than weaker, which is why the old pair went
  // rather than being kept alongside.
  //
  // The old guards spied stack frames and scanned one file's imports. Both are
  // still literally true after Task 2 -- the Chess mission's emission lives in
  // js/tr/deduction.js, where every other evidence source in this game lives --
  // and both had become MISLEADING, because a green tick on "missions write no
  // beliefs" would read as a claim about the format at the exact moment
  // missions started causing beliefs. A guard whose name no longer describes
  // what it protects is worse than no guard: it is a guard people trust.
  //
  // What actually binds this format is a CLOSED SET, and it is not a property
  // of any one file:
  //
  //   `public`   -- exactly three writers, all of them people looking at each
  //                other rather than inferring: the turret seeding, the
  //                banishment reveal, and a recruit being shown the turret.
  //   `observed` -- exactly one, ever: the Seer, which does not exist yet, so
  //                the correct assertion today is ZERO.
  //   everything else -- `deduced` or `rumor`, capped by learn() at
  //                ALIGNMENT_CRED_CEILING, and therefore a suspicion however
  //                sure of it anybody is.
  //
  // knowsAlignmentOf() discriminates on exactly that closed set. A fourth
  // `public` writer does not make the room slightly more certain; it ends the
  // distinction between knowing and suspecting, which is the format.
  //
  // Swept over the whole store of a played season rather than over call sites,
  // so it holds for a writer nobody has thought of yet.
  const SANCTIONED_PUBLIC = ['the turret', 'the reveal'];

  function alignmentBeliefs() {
    return allFacts()
      .filter(f => f.type === 'alignment')
      .flatMap(f => Object.entries(f.beliefs || {})
        .map(([knower, b]) => ({ knower, subject: f.subject, ...b })));
  }

  it('no alignment is ever LEARNED above deduced, over every write in 12 seasons', () => {
    // The primary guard. Every learn() call in the graph, inspected at the
    // call rather than at whatever survived to the end of the season.
    learnCalls.length = 0;
    capture.on = true;
    try {
      setPlayers(ROSTER);
      for (let i = 1; i <= 12; i++) playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
    } finally { capture.on = false; }

    const alignment = learnCalls.filter(c => /^alignment:/.test(c.id));
    // Guard on the guard: the spy must be catching the layers that ARE allowed
    // to write beliefs, or its silence about credibility means nothing.
    expect(alignment.length, 'the learn spy caught no alignment write at all')
      .toBeGreaterThan(1000);

    const mission = alignment.filter(c => /^(threw a board|finished a board)/.test(c.source));
    // ...and the channel this task added must be inside what it caught, at
    // BOTH of its tiers. Without this the guard can be green about a channel
    // it never observed, which is exactly how the store-sweep version of it
    // survived the `observed` mutation.
    expect(mission.length, 'the spy saw no mission tell — this guard is not covering the '
      + 'channel it was narrowed for').toBeGreaterThan(20);
    expect(new Set(mission.map(c => c.sourceType)),
      'the mission channel only ever wrote one tier — the other is unreachable')
      .toEqual(new Set(['deduced', 'rumor']));

    for (const c of alignment) {
      expect(c.sourceType,
        `an alignment was learned as \`observed\` from "${c.source}" — the Seer is the only `
        + 'one there may ever be, and it does not exist yet').not.toBe('observed');
      if (c.sourceType === 'public') {
        expect(SANCTIONED_PUBLIC,
          `a fourth \`public\` alignment writer: "${c.source}"`).toContain(c.source);
        expect(c.confidence,
          'a `public` alignment write passed a confidence — the three legitimate ones pass '
          + 'none, which is what reserves certainty to them').toBeFalsy();
      } else {
        expect(['deduced', 'rumor'],
          `alignment learned as \`${c.sourceType}\` from "${c.source}"`)
          .toContain(c.sourceType);
        expect(c.confidence ?? 0,
          `"${c.source}" asked for ${c.confidence} — over the deduced ceiling. learn() clamps `
          + 'it, but a caller that thinks it can buy certainty is the bug the clamp hides')
          .toBeLessThanOrEqual(0.62);
      }
    }
  });

  it('and what the room is left holding at the end of a season obeys the same rule', () => {
    setPlayers(ROSTER);
    let seen = 0, missionSourced = 0;
    for (let i = 1; i <= 12; i++) {
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
      const beliefs = alignmentBeliefs();
      // Guard on the guard: a season with nothing in its store proves nothing,
      // and this sweep reads gs AFTER the season, which is exactly the shape
      // of read that has silently measured an empty object before.
      expect(beliefs.length, 'the belief store is empty -- this sweep is reading nothing')
        .toBeGreaterThan(50);
      for (const b of beliefs) {
        seen++;
        if (/^(threw a board|finished a board)/.test(b.source)) missionSourced++;
        expect(b.sourceType,
          `an alignment belief arrived as observed from "${b.source}" -- the Seer is the `
          + 'only one there may ever be').not.toBe('observed');
        if (b.sourceType === 'public') {
          expect(SANCTIONED_PUBLIC,
            `a fourth public alignment writer: "${b.source}"`).toContain(b.source);
        } else {
          expect(['deduced', 'rumor'],
            `alignment learned as ${b.sourceType} from "${b.source}"`)
            .toContain(b.sourceType);
        }
      }
    }
    expect(seen).toBeGreaterThan(1000);
    // And the mission channel must be IN what was swept, or the sweep is green
    // about a channel it never saw. Beliefs get overwritten by louder evidence
    // as a season runs, so this counts survivors, not emissions.
    expect(missionSourced,
      'no surviving belief in twelve seasons came from a mission tell -- the sweep above is '
      + 'not covering the channel this task added').toBeGreaterThan(0);
  });
});

describe('the Chess mission -- knowledge as the currency (spec 7.2, source 4)', () => {
  /** Every knowledge mission across `n` seasons, with its season alongside. */
  function chessRuns(n) {
    setPlayers(ROSTER);
    const out = [];
    for (let i = 1; i <= n; i++) {
      const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
      s.missions.filter(m => m.id === 'blind-chess').forEach(m => out.push({ m, s }));
    }
    return out;
  }

  /** Ground truth at `ep`, rebuilt from the season's own role history. */
  function traitorsAt(season, ep) {
    const cur = new Set();
    for (const r of season.roleHistory) {
      if (r.ep > ep) continue;
      if (r.to === 'traitor') cur.add(r.name); else cur.delete(r.name);
    }
    return cur;
  }

  it('emits evidence, and the players who solved it hold beliefs they did not hold before', () => {
    // THE TASK'S OWN ASSERTION (brief, step 1). Run inside a single season so
    // the store can be read while it still belongs to that season -- `gs` is
    // replaced wholesale by the next one, which is how a previous plan
    // measured season 200 and called it a population.
    setPlayers(ROSTER);
    let checked = 0, withBeliefs = 0;
    for (let seed = 1; seed <= 25; seed++) {
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      const runs = (_gs.tr.missions || []).filter(m => m.id === 'blind-chess');
      for (const m of runs) {
        checked++;
        expect(m.tells, 'a knowledge mission with no tell record').toBeDefined();
        expect(m.readers).toBeDefined();
        expect(typeof m.beliefsFormed,
          'beliefsFormed is undefined on a quiet afternoon and 0 on a quieter one')
          .toBe('number');
        if (m.beliefsFormed > 0) withBeliefs++;
      }
      // WHO HOLDS WHAT, checked against the mission that taught it. Beliefs
      // are found by their source string, which is written by the mission and
      // by nothing else in the game.
      const bySource = new Map();
      for (const f of allFacts()) {
        if (f.type !== 'alignment') continue;
        for (const [knower, b] of Object.entries(f.beliefs || {})) {
          if (/^(threw a board|finished a board)/.test(b.source)) {
            bySource.set(`${knower}|${f.subject}`, b);
          }
        }
      }
      for (const [key, b] of bySource) {
        const [knower, subject] = key.split('|');
        const m = runs.find(x => x.tells.some(t => t.source === b.source));
        expect(m, `a mission-sourced belief with no mission to match: ${b.source}`).toBeTruthy();
        // KNOWLEDGE IS THE CURRENCY: only a player who solved their own board
        // reads the hall. If this ever fires, the mission has stopped being
        // the thing being spent and intuition alone is buying the read.
        expect(m.readers, `${knower} read the hall without solving their own board`)
          .toContain(knower);
        expect(m.tells.map(t => t.player),
          `${knower} learned about ${subject}, who gave nothing away`).toContain(subject);
      }
    }
    expect(checked, 'no knowledge mission ran in 25 seasons').toBeGreaterThan(10);
    // Measured 60% of runs. A channel that emits tells and never lands a
    // belief is decoration, and this is where that shows.
    expect(withBeliefs / checked, 'the Chess mission taught nobody anything')
      .toBeGreaterThan(0.3);
  });

  it('a tell is enriched in Traitors and still wrong about half the time', () => {
    // BOTH HALVES ARE THE DESIGN. A channel that never names an innocent is a
    // ground-truth leak wearing a mission's hat; a channel at chance is the
    // `clashTraced` mistake, which measured 0.87x at emission and was deleted.
    //
    // SEPARATION, STATED. Measured over 600 seasons: 61.2% of 196 tells name a
    // Traitor against a board density of 25.0%, = 2.45x -- the sharpest read in
    // this engine (`pushedThenDied` is 1.21x against a 1.20x control). Over
    // the 120 seasons this test plays the count is around n=100, so the bands
    // are set wide of the sampling error rather than at the measured value: at
    // n=100 and p=0.6 the standard error on the precision is 4.9pp, so 0.42 is
    // ~3.7 se below and 0.80 is ~4.1 se above.
    const runs = chessRuns(120);
    let tellTraitor = 0, tells = 0, densitySum = 0;
    for (const { m, s } of runs) {
      const traitors = traitorsAt(s, m.ep);
      const hall = m.teams.flatMap(t => t.members);
      const density = hall.filter(n => traitors.has(n)).length / hall.length;
      for (const t of m.tells) {
        tells++;
        densitySum += density;
        if (traitors.has(t.player)) tellTraitor++;
      }
    }
    expect(tells, 'not enough tells to measure').toBeGreaterThan(60);
    const precision = tellTraitor / tells;
    const chance = densitySum / tells;
    expect(precision / chance, 'the tell carries no more information than the room does')
      .toBeGreaterThan(1.6);
    expect(precision, 'the tell has become an oracle -- it names Traitors and only Traitors')
      .toBeLessThan(0.80);
    expect(precision, 'the tell has stopped pointing at anybody in particular')
      .toBeGreaterThan(0.42);
  });

  it('a sentence about the board agrees with the board', () => {
    // THE STANDING REQUIREMENT OF THIS PLAN, as a rule over the whole
    // population rather than as a fix to the instance that was noticed. Two
    // contradictions are possible in this record and both were found by
    // dumping seasons and reading them:
    //
    //   * a "nothing to read" line printing over something to read;
    //   * somebody named as having solved their board in the same breath as
    //     being named for throwing it. (Real: "nobody could work out what
    //     Bowie was doing with a board two moves from finished" ... "Bowie
    //     came out of it with a solved board".)
    //
    // Both are unrepresentable at source now -- the quiet line is reachable
    // only from the empty branch, and a held tell removes its player from
    // `readers`. This asserts the state, not the strings, so it holds for a
    // line nobody has written yet.
    const runs = chessRuns(120);
    let quiet = 0, solverLines = 0, singles = 0;
    for (const { m } of runs) {
      const held = m.tells.filter(t => t.kind === 'held').map(t => t.player);
      for (const h of held) {
        expect(m.readers, `${h} threw their board and is listed among the solvers`)
          .not.toContain(h);
      }
      const lines = (m.tellLines || []).join(' ');
      const claimsQuiet = /nobody gave|nothing but the game|out of character|nothing to read into it/
        .test(lines);
      expect(claimsQuiet && m.tells.length > 0,
        `a "nothing to read" line printed over ${m.tells.length} tells`).toBe(false);
      expect(!claimsQuiet && m.tells.length === 0,
        'a mission with nothing to read said nothing about it').toBe(false);
      if (claimsQuiet) quiet++;
      if (m.readers.length === 1 && m.tells.length) singles++;
      // THE SINGULAR BRANCH IS NOT ASSERTED ON, DELIBERATELY. By the last
      // rounds "above the median board" can come out as one player, and "the
      // ones who actually finished their side of it were Brick" is the
      // sentence a first draft always writes — so the call site switches
      // pools on `readers.length === 1`. It is a one-line invariant at one
      // call site, not a population property: measured 2 firings in 600
      // seasons, so an `expect(singles > 0)` over the 120 this test plays
      // would be zero four times in five. Asserting it here would not be a
      // guard, it would be a flake, and the file already has that lesson
      // written on the pot's block maximum. `singles` is counted and printed
      // in the failure message of the count below so a future reader can see
      // whether it is still reachable at all.
      // A solvers line only ever prints when there are solvers to name. The
      // "and nobody else" half of this is asserted on `readers` above and
      // NOT on the string: one of this roster's cast members is called B, so
      // a substring check on a rendered sentence reports a contradiction in
      // every line containing the letter b.
      const named = m.tellLines.filter(l =>
        /got theirs out|finished their side|solved board|ahead of their own/.test(l));
      if (named.length) {
        solverLines++;
        expect(m.readers.length, 'a solvers line printed with nobody to name')
          .toBeGreaterThan(0);
      }
    }
    expect(quiet, 'the quiet branch never ran -- the guard above is unfailable').toBeGreaterThan(5);
    expect(solverLines, `no solvers line ever printed (one-solver firings: ${singles})`)
      .toBeGreaterThan(20);
  });

  it('every prose tier of the Chess mission is reachable', () => {
    // TASK 1'S DEFECT, AS A GUARD RATHER THAN A MEMORY. Forty of its hundred
    // narration lines were unreachable because the tier cuts sat outside the
    // range the quality metric can actually produce -- found by reading dumps,
    // caught by nothing. The Chess mission scores off per-player boards rather
    // than the stat pair, so its quality distribution is its OWN and the
    // shared cuts could easily miss it. Measured over 600 seasons: scraped
    // 38.9%, solid 51.0%, triumph 9.8%, failed 0.3%.
    // READ FROM THE RECORD, NEVER RE-DERIVED HERE. The first draft of this
    // test carried its own copy of the cuts, and the mutation that should
    // have killed it — putting the `triumph` cut back at the unreachable 0.75
    // Task 1 shipped and then measured away — came back GREEN, because the
    // test was checking its own arithmetic against `quality` and never asked
    // which pool the printed sentence came from.
    const runs = chessRuns(200);
    const seen = {};
    for (const { m } of runs) seen[m.tier] = (seen[m.tier] || 0) + 1;
    for (const t of ['triumph', 'solid', 'scraped']) {
      expect(seen[t], `the ${t} tier of blind-chess never fired`).toBeGreaterThan(0);
    }
    // `failed` is a washout on a board mission and is genuinely near-extinct
    // (1 in 388 measured). Asserting it fires in 200 seasons would be a
    // flake; asserting the tier cut is inside the observed range is the same
    // claim without the coin flip.
    const qs = runs.map(r => r.m.quality).sort((a, b) => a - b);
    expect(qs[0], 'no Chess mission ever came close to failing').toBeLessThan(0.25);
    expect(qs[qs.length - 1], 'no Chess mission ever came close to a triumph').toBeGreaterThan(0.55);
    // And the record's own tier agrees with its own quality, so `tier` cannot
    // drift away from the sentence it selected.
    for (const { m } of runs) {
      if (m.tier === 'triumph') expect(m.quality).toBeGreaterThanOrEqual(0.55);
      if (m.tier === 'failed') expect(m.quality).toBeLessThan(0.15);
    }
  });
});
