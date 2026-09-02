// ══════════════════════════════════════════════════════════════════════
// tr-mission-contract.test.js — the shape every bespoke mission owes
// ══════════════════════════════════════════════════════════════════════
//
// Task 8, step 1. This file is the CONTRACT arm: it does not care what a
// mission is about, only that whatever it is about, it produces a record the
// rest of the show can read. The four missions' own behaviour — that the
// causeway is a causeway, that the settlement is a real dilemma, that a
// Traitor's nudge is a nudge — is tests/tr-missions-bespoke.test.js.
//
// EVERY BAND IN THIS FILE HAS BEEN MUTATED AGAINST THE THING IT PROTECTS, and
// each mutation is written down beside its assertion. That is not ceremony on
// this branch: four guards have shipped here unable to fail, most recently one
// that could not catch the writing contract's own headline example. An
// assertion whose mutation was never run is a comment.
//
// FILENAME: deliberately not *-audit.test.js — vitest.config.js excludes that
// pattern from `npm test`.
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { rngFor } from '../js/tr/headless.js';
import {
  TRAITORS_MISSIONS, BESPOKE_MISSION_IDS, bespokeMission, pickBespokeMission,
  _setBespokeMissionsEnabled, bespokeMissionsEnabled,
} from '../js/tr/missions/index.js';
import {
  createMissionCtx, validateMissionRecord, missionQuality, payPot, placementsFrom,
  briefingText, hostSay, hostDo, REQUIRED_RULE_POINTS, POT_CEILING, MISSION_BEHAVIOURS,
  noisy, noisyPair,
} from '../js/tr/missions/contract.js';
import roster from '../franchise_roster.json';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROSTER = roster.players.slice(0, 18);
const CAST = ROSTER.map(p => p.name);

/** A bare world with a living cast, for running one mission in isolation. */
function world(cast = CAST) {
  setPlayers(ROSTER);
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
}

/** The context a picker would build, with nobody conflicted unless asked. */
function ctxFor(cast = CAST, ep = 3, traitors = []) {
  return createMissionCtx({ ep, living: [...cast],
    alignmentOf: (n) => (traitors.includes(n) ? 'traitor' : 'faithful') });
}

beforeEach(() => { _setBespokeMissionsEnabled(true); });

// ══════════════════════════════════════════════════════════════════════

describe('the catalogue', () => {
  it('holds four missions with distinct ids, names and team names', () => {
    expect(TRAITORS_MISSIONS).toHaveLength(4);
    expect(new Set(BESPOKE_MISSION_IDS).size).toBe(4);
    expect(new Set(TRAITORS_MISSIONS.map(m => m.name)).size).toBe(4);
    const teamNames = TRAITORS_MISSIONS.flatMap(m => m.teams);
    expect(new Set(teamNames).size, 'two missions share a team name, which makes a '
      + 'season log ambiguous about which afternoon a team belonged to').toBe(teamNames.length);
    for (const id of BESPOKE_MISSION_IDS) expect(bespokeMission(id).id).toBe(id);
    expect(bespokeMission('nothing-of-the-sort')).toBeNull();
  });

  it('is gated off by default, because a mission with no VP screen may not reach a season', () => {
    // THE MOCKUP APPROVAL CONTRACT, as a mechanism rather than a promise.
    // Stage 1 ships simulations and mockups; the switch flips in stage 2 with
    // the builders.
    //
    // THE DEFAULT IS ASSERTED AGAINST THE DECLARATION, and it has to be. The
    // first version of this arm called `_setBespokeMissionsEnabled(false)` and
    // then checked the flag was false, which is a test of the setter — the
    // MUTATION (flip the initialiser to `true`) came back GREEN, because this
    // file's `beforeEach` turns the catalogue on and every arm sets what it
    // needs. Once any test has run there is no runtime observation of the
    // initial value left, so the declaration is the only thing to check.
    //
    // MUTATION RE-RUN after the fix: `let _bespokeEnabled = true;` -> red.
    const decl = readFileSync(
      path.join(HERE, '..', 'js', 'tr', 'missions', 'index.js'), 'utf8');
    expect(decl, 'the bespoke catalogue is no longer gated off by default, so a mission '
      + 'with no VP screen can reach a played season')
      .toMatch(/let[ ]+_bespokeEnabled[ ]*=[ ]*false[ ]*;/);

    _setBespokeMissionsEnabled(false);
    expect(bespokeMissionsEnabled()).toBe(false);
    expect(pickBespokeMission(ctxFor(), rngFor(1))).toBeNull();
    _setBespokeMissionsEnabled(true);
    expect(pickBespokeMission(ctxFor(), rngFor(1))).not.toBeNull();
  });

  it('never offers the mission that ran last', () => {
    // MUTATION RUN: drop the `m.id !== lastId` filter in `pickBespokeMission`
    // -> 200 draws produce the held-out id ~50 times and this fails.
    for (const last of BESPOKE_MISSION_IDS) {
      for (let i = 0; i < 60; i++) {
        const m = pickBespokeMission(ctxFor(), rngFor(i + 1), last);
        expect(m, 'nothing was offered at all').not.toBeNull();
        expect(m.id, `${last} was offered again immediately`).not.toBe(last);
      }
    }
  });

  it('offers nothing when nothing is eligible, rather than throwing', () => {
    const tiny = ctxFor(CAST.slice(0, 3));
    expect(pickBespokeMission(tiny, rngFor(4))).toBeNull();
    // And an eligibility that throws is treated as "no", not as a crash.
    const angry = { id: 'x', eligibility() { throw new Error('nope'); } };
    expect(() => angry.eligibility({})).toThrow();
  });
});

describe('every mission honours the record contract', () => {
  // THE TASK'S OWN LOOP, verbatim in shape, run over every mission and over a
  // spread of seeds rather than one — a single seed is one path through four
  // branching simulations and proves almost nothing about the other paths.
  for (const mission of TRAITORS_MISSIONS) {
    it(`${mission.id}: desc, phases, per-player scores, pot line and briefing`, () => {
      expect(mission.desc.length).toBeGreaterThanOrEqual(200);

      for (let seed = 1; seed <= 25; seed++) {
        world();
        const ctx = ctxFor(CAST, 3, [CAST[0], CAST[5]]);
        const rec = mission.simulate(ctx, rngFor(seed));

        expect(rec.phases.length).toBeGreaterThanOrEqual(3);
        expect(Object.keys(rec.playerScores).sort()).toEqual([...ctx.living].sort());
        expect(rec.potAfter).toBe(rec.potBefore + rec.potEarned);
        expect(rec.briefing).toMatch(/wins|earn|shield|time|finish/i);
      }
    });

    it(`${mission.id}: the desc says what happens, what goes wrong and how it ends`, () => {
      // AGENTS.md's four-part rule, checked as reachability of the CONCEPTS
      // rather than of a word list — a desc can say "the bay closes" without
      // the word "penalty". Each of the four gets its own regex and its own
      // failure message so a red test names the missing part.
      const d = mission.desc;
      expect(d.length, 'shorter than the project minimum').toBeGreaterThanOrEqual(200);
      expect(d.split(/[.!?]/).filter(s => s.trim().length > 20).length,
        'a desc is at least two real sentences').toBeGreaterThanOrEqual(2);
      expect(d, 'the set-up never says what is physically there')
        .toMatch(/room|table|wing|chapel|causeway|observatory|orrery|book|box|vault|walkway/i);
      expect(d, 'the mechanic never says what the players do')
        .toMatch(/each team|players?|one at a time|by hand|carr(y|ies)|crawls?|sets?|argues?/i);
      expect(d, 'nothing is ever said to go wrong')
        .toMatch(/wrong|struck|gone for good|illegible|spoils?|closes?|shut|nothing|stops?/i);
      expect(d, 'the win condition is never stated outright')
        .toMatch(/into the (shared )?pot|earns? nothing|counts?|pays?/i);
    });

    it(`${mission.id}: the briefing is a ceremony, not a note`, () => {
      world();
      const ctx = ctxFor();
      const rec = mission.simulate(ctx, rngFor(11));
      const c = rec.ceremony;

      expect(c.staging.length, 'no physical space').toBeGreaterThan(60);
      expect(c.hostBeats.length, 'a ceremony is more than a paragraph').toBeGreaterThanOrEqual(8);
      expect(c.hostBeats.filter(b => b.kind === 'staging').length,
        'the host never moves through the space').toBeGreaterThanOrEqual(3);
      expect(c.hostBeats.filter(b => b.kind === 'say').length).toBeGreaterThanOrEqual(5);

      // Every required rule point maps to a SPOKEN beat, and the beat it maps
      // to comes before the action. MUTATION RUN: point `reward` at a staging
      // beat in any mission's `_ceremony` -> `validateMissionRecord` throws
      // inside `simulate` and this test dies at the call, which is the
      // stricter failure and the intended one.
      for (const want of REQUIRED_RULE_POINTS) {
        const p = c.rulePoints.find(x => x.id === want);
        expect(p, `no rule point \`${want}\``).toBeTruthy();
        expect(c.hostBeats[p.explainedByBeat].kind).toBe('say');
      }

      // The briefing string IS the spoken beats, so there is one speech.
      expect(rec.briefing).toBe(briefingText(c.hostBeats));
      expect(c.reminder.length, 'no short form for a repeat appearance')
        .toBeGreaterThan(40);
      expect(c.reminder.length, 'the reminder is not shorter than the ceremony')
        .toBeLessThan(rec.briefing.length);
    });

    it(`${mission.id}: the host is never named and never gendered`, () => {
      // Global constraint: host explanations use the CONFIGURED host, never a
      // literal name, and host prose in this show is gender-neutral. Both are
      // properties of the authored speech, so they are checked on the speech.
      world();
      const rec = mission.simulate(ctxFor(), rngFor(12));
      const speech = rec.ceremony.staging + '\n'
        + rec.ceremony.hostBeats.map(b => `${b.text || ''} ${b.action || ''}`).join('\n');
      for (const name of ['Valeria', 'Sandoval', 'Alistair', 'Crane', 'Claudia', 'Winterbourne']) {
        expect(speech, `the briefing hardcodes the host name ${name}`).not.toContain(name);
      }
      // "he"/"she" about the host. The agent in The Long Account is a
      // character rather than the host, so the sweep is on sentences that
      // mention the host at all.
      for (const line of speech.split('\n')) {
        if (!/\bhost\b/i.test(line)) continue;
        expect(line, 'the host is gendered').not.toMatch(/\b(he|she|him|her|his|hers)\b/i);
      }
    });

    it(`${mission.id}: phases name real stats and describe a real place`, () => {
      const VALID = ['physical', 'endurance', 'mental', 'social', 'strategic',
        'loyalty', 'boldness', 'intuition', 'temperament'];
      world();
      const rec = mission.simulate(ctxFor(), rngFor(13));
      const used = new Set();
      for (const ph of rec.phases) {
        expect(ph.setting.length, `${ph.id} has no setting`).toBeGreaterThan(40);
        for (const s of ph.stats) {
          expect(VALID, `${ph.id} names an invented stat \`${s}\``).toContain(s);
          used.add(s);
        }
        expect(ph.teams.map(t => t.name).sort()).toEqual([...mission.teams].sort());
        for (const t of ph.teams) {
          expect(t.score, `${ph.id}/${t.name} scored outside 0..1`).toBeGreaterThanOrEqual(0);
          expect(t.score).toBeLessThanOrEqual(1);
        }
      }
      // SPREAD THE STATS. AGENTS.md's own rule for a multi-phase comp: don't
      // use the same stat in every phase, so different archetypes shine.
      // MUTATION RUN: score all three phases of the causeway on
      // endurance/physical -> `used.size` is 2 and this fails.
      expect(used.size, `${mission.id} leans on too few stats across its phases`)
        .toBeGreaterThanOrEqual(4);
      const perPhase = rec.phases.map(p => p.stats.join('+'));
      expect(new Set(perPhase).size, 'two phases use the same stat pair')
        .toBe(perPhase.length);

      // AND THE DECLARATION MUST BE THE TRUTH. `ph.stats` is metadata, and
      // metadata drifts: the MUTATION for this arm was to change the ledge
      // phase's `noisyPair(rng, name, 'boldness', 'temperament')` to
      // endurance/physical while leaving `stats: ['boldness','temperament']`
      // alone, and it came back GREEN — the guard was reading the label rather
      // than the roll. Every declared stat must now appear as an argument to a
      // `noisy` call in that mission's own source, which closes it.
      //
      // MUTATION RE-RUN after the fix: the same edit -> red on
      // drowned-causeway, because `boldness` is no longer rolled anywhere.
      const body = readFileSync(
        path.join(HERE, '..', 'js', 'tr', 'missions', `${mission.id}.js`), 'utf8');
      const rolled = new Set(
        [...body.matchAll(/noisy(?:Pair)?[(]rng, *\w+, *'(\w+)'(?:, *'(\w+)')?/g)]
          .flatMap(m => [m[1], m[2]]).filter(Boolean));
      for (const key of used) {
        expect(rolled.has(key),
          `${mission.id} declares \`${key}\` on a phase but never rolls it`).toBe(true);
      }
    });

    it(`${mission.id}: no phase dominates the afternoon`, () => {
      // Scoring balance (AGENTS.md, and the twist-challenge design rules):
      // all phases should score in similar ranges, or one phase is the
      // mission and the other two are epilogues. Measured across 120 runs.
      const spread = {};
      for (let seed = 1; seed <= 120; seed++) {
        world();
        const rec = mission.simulate(ctxFor(), rngFor(seed + 400));
        for (const ph of rec.phases) {
          (spread[ph.id] ||= []).push(...ph.teams.map(t => t.score));
        }
      }
      const means = Object.entries(spread).map(([id, xs]) =>
        [id, xs.reduce((a, b) => a + b, 0) / xs.length]);
      const lo = Math.min(...means.map(m => m[1]));
      const hi = Math.max(...means.map(m => m[1]));
      expect(hi - lo, `phase means are ${means.map(m => `${m[0]}=${m[1].toFixed(2)}`).join(' ')}`
        + ' — one phase is carrying the mission').toBeLessThan(0.30);
      expect(lo, 'a phase scores near zero every time, so it decides nothing')
        .toBeGreaterThan(0.05);
    });

    it(`${mission.id}: every player is scored, ranked, and nobody is invented`, () => {
      for (const size of [4, 6, 9, 14, 18]) {
        const cast = CAST.slice(0, size);
        world(cast);
        const ctx = ctxFor(cast);
        const rec = mission.simulate(ctx, rngFor(size + 20));
        expect(Object.keys(rec.playerScores).sort()).toEqual([...cast].sort());
        expect([...rec.placements].sort()).toEqual([...cast].sort());
        // The ranking is the scores, best first. MUTATION RUN: sort ascending
        // in `placementsFrom` -> fails immediately.
        for (let i = 1; i < rec.placements.length; i++) {
          expect(rec.playerScores[rec.placements[i - 1]])
            .toBeGreaterThanOrEqual(rec.playerScores[rec.placements[i]]);
        }
        const all = rec.teams.flatMap(t => t.members);
        expect(new Set(all).size, 'somebody is on both teams').toBe(all.length);
        expect([...all].sort()).toEqual([...cast].sort());
        for (const s of rec.scenes) {
          for (const n of s.participants) expect(cast).toContain(n);
        }
      }
    });

    it(`${mission.id}: the pot line adds up and respects the ceiling`, () => {
      world();
      let running = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const rec = mission.simulate(ctxFor(), rngFor(seed + 60));
        expect(rec.potBefore).toBe(running);
        expect(rec.potAfter).toBe(rec.potBefore + rec.potEarned);
        expect(rec.earned).toBe(rec.potEarned);
        expect(rec.potEarned).toBeGreaterThanOrEqual(0);
        expect(rec.potAfter).toBeLessThanOrEqual(POT_CEILING);
        expect(gs.tr.pot).toBe(rec.potAfter);
        running = rec.potAfter;
      }
      expect(running, 'thirty afternoons and the pot never filled — the ceiling arm below '
        + 'is testing nothing').toBe(POT_CEILING);

      // THE BOUNDARY, where the cap can actually be seen to bite. Starting 100
      // short, a mission that grosses more banks exactly 100.
      world();
      gs.tr.pot = POT_CEILING - 100;
      const m = mission.simulate(ctxFor(), rngFor(77));
      expect(m.gross, 'this cast could not out-earn 100 credits, so the cap was never '
        + 'exercised').toBeGreaterThan(100);
      expect(m.potEarned).toBe(100);
      expect(gs.tr.pot).toBe(POT_CEILING);
    });

    it(`${mission.id}: every scene has people in it, prose, and a consequence`, () => {
      world();
      let scenes = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const rec = mission.simulate(ctxFor(), rngFor(seed + 120));
        expect(rec.scenes.length, 'an afternoon recorded no scenes at all')
          .toBeGreaterThan(0);
        scenes += rec.scenes.length;
        for (const s of rec.scenes) {
          expect(s.participants.length).toBeGreaterThan(0);
          expect(s.text.length).toBeGreaterThan(40);
          expect(s.effects.length, `${s.id} declares no effect`).toBeGreaterThan(0);
          for (const e of s.effects) {
            expect(typeof e.source, `${s.id}: an effect with no citable source`).toBe('string');
            expect(e.source.length).toBeGreaterThan(10);
          }
          if (s.behaviour) expect(MISSION_BEHAVIOURS).toContain(s.behaviour);
        }
      }
      expect(scenes / 40, 'a mission that produces one scene an afternoon has no episode in it')
        .toBeGreaterThan(2);
    });

    it(`${mission.id}: no alignment reaches the record`, () => {
      // The engine may know; the castle may not. Swept at every depth, and the
      // validator throws on a leak, so this is the visible half of a guard that
      // already refuses to ship one. MUTATION RUN: add
      // `rec.audit = { traitor: ctx.living[0] }` to any `simulate` ->
      // `validateMissionRecord` throws and the call below fails.
      world();
      const traitors = [CAST[2], CAST[7]];
      const rec = mission.simulate(ctxFor(CAST, 3, traitors), rngFor(31));
      const json = JSON.stringify(rec);
      expect(json).not.toMatch(/"(alignment|role|isTraitor|traitor|faithful|cloak)"\s*:/);
      // And the two conflicted players are not distinguishable by a field.
      expect(() => validateMissionRecord(rec, ctxFor(CAST, 3, traitors))).not.toThrow();
    });
  }
});

describe('the validator refuses a record that does not honour the contract', () => {
  // A GUARD ON THE GUARD. Every one of these is a real mutation of a real
  // record: take a good one, break exactly one thing, and require the throw.
  // Without this the validator could be a function that returns its argument
  // and every arm above would still be green.
  const goodRecord = () => {
    world();
    return { ctx: ctxFor(), rec: TRAITORS_MISSIONS[0].simulate(ctxFor(), rngFor(5)) };
  };

  it('accepts the real thing', () => {
    const { ctx, rec } = goodRecord();
    expect(() => validateMissionRecord(rec, ctx)).not.toThrow();
  });

  const breakages = [
    ['a missing contract field', r => { delete r.playerScores; }, /missing field/],
    ['two phases', r => { r.phases = r.phases.slice(0, 2); }, /at least three scored phases/],
    ['a player left unscored', (r, c) => { delete r.playerScores[c.living[0]]; },
      /exactly the living field/],
    ['a player who is not in the castle', r => { r.playerScores['Nobody At All'] = 1; },
      /exactly the living field/],
    ['a pot line that does not add up', r => { r.potAfter += 1; }, /pot does not add up/],
    ['money taken out of the pot', r => { r.potEarned = -5; r.potAfter = r.potBefore - 5; },
      /may not take money out/],
    ['`earned` disagreeing with `potEarned`', r => { r.earned = r.potEarned + 1; },
      /the same money/],
    ['a briefing that is a note', r => { r.briefing = 'The host explains the mission.'; },
      /that is a note, not a ceremony/],
    ['a briefing that is not the ceremony\'s own words',
      r => { r.briefing = r.briefing + ' Also, everybody wins something.'; },
      /two copies of one speech/],
    ['an unexplained rule point',
      r => { r.ceremony.rulePoints = r.ceremony.rulePoints.filter(p => p.id !== 'reward'); },
      /never explains `reward`/],
    ['a rule point pointing at a staging direction', r => {
      const i = r.ceremony.hostBeats.findIndex(b => b.kind === 'staging');
      r.ceremony.rulePoints.find(p => p.id === 'task').explainedByBeat = i;
    }, /which is not a spoken line/],
    ['a scene with nobody in it', r => { r.scenes[0].participants = []; },
      /names no participants/],
    ['a scene convening somebody who is not in the castle',
      r => { r.scenes[0].participants = ['Nobody At All']; }, /who is not in the castle/],
    ['a scene with no consequence', r => { r.scenes[0].effects = []; },
      /declares no effect/],
    ['placements that miss somebody', r => { r.placements = r.placements.slice(1); },
      /must rank every living player/],
    ['an alignment on the record', r => { r.audit = { traitor: 'somebody' }; },
      /alignment leaked/],
    ['an alignment buried three levels down',
      r => { r.phases[0].debug = { rows: [{ alignment: 'traitor' }] }; }, /alignment leaked/],
  ];

  for (const [what, mutate, pattern] of breakages) {
    it(`refuses ${what}`, () => {
      const { ctx, rec } = goodRecord();
      mutate(rec, ctx);
      expect(() => validateMissionRecord(rec, ctx)).toThrow(pattern);
    });
  }
});

describe('the shared pot arithmetic is the archetypes\' arithmetic', () => {
  it('missionQuality is symmetric, monotone, and weights the better team 60/40', () => {
    expect(missionQuality(0.8, 0.2)).toBeCloseTo(missionQuality(0.2, 0.8), 12);
    expect(missionQuality(0.9, 0.9)).toBeGreaterThan(missionQuality(0.5, 0.5));
    // 0.6 on the better half. A 60/40 blend of (0.8, 0.4) is 0.64; the same
    // pair evenly weighted is 0.60.
    //
    // WITH A REAL MARGIN, because the first version of this line asserted only
    // `blend > even` and the MUTATION (BEST_WEIGHT = 0.5) came back GREEN: at
    // 0.5 the two blends evaluate to 0.6000000000000001 and 0.6, so the strict
    // inequality survived on a floating-point artefact. The true gap at 0.6 is
    // 0.061. MUTATION RE-RUN after the fix: red.
    const blend = missionQuality(0.8, 0.4);
    const even = missionQuality(0.6, 0.6);
    expect(blend - even, 'the better team is no longer weighted above the worse')
      .toBeGreaterThan(0.03);
    expect(missionQuality(0.3, 0.3), 'the difficulty subtraction has stopped biting')
      .toBe(0);
  });

  it('payPot pays nothing below the pass mark and never overdraws the ceiling', () => {
    world();
    expect(payPot(0.10).potEarned).toBe(0);
    expect(payPot(0.14).potEarned).toBe(0);
    expect(payPot(0.16).potEarned).toBeGreaterThan(0);
    world();
    gs.tr.pot = POT_CEILING - 7;
    expect(payPot(1).potEarned).toBe(7);
    expect(payPot(1).potEarned).toBe(0);
  });

  it('both noise helpers actually put a day on the stat line', () => {
    // AGENTS.md's `noise(2.5)` minimum, guarded on the HELPERS rather than only
    // through the missions that use them. The mutation that forced this arm was
    // deleting the noise term from `noisy` — the single-stat form — which the
    // upset arms in tests/tr-missions-bespoke.test.js did NOT catch, because
    // `noisy` is used by exactly one phase of one mission and two thirds of
    // that mission still moves. A helper needs its own guard.
    //
    // MUTATION RE-RUN after the fix: `return statOf(name, key);` -> red.
    setPlayers(ROSTER);
    const who = CAST[0];
    for (const [label, draw] of [
      ['noisy', (rng) => noisy(rng, who, 'mental')],
      ['noisyPair', (rng) => noisyPair(rng, who, 'mental', 'social')],
    ]) {
      const xs = Array.from({ length: 600 }, (_, i) => draw(rngFor(i + 1)));
      const lo = Math.min(...xs), hi = Math.max(...xs);
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      expect(hi - lo, `${label} produces no spread at all`).toBeGreaterThan(3.5);
      expect(hi - lo, `${label} swings wider than the +/-2.5 it advertises`).toBeLessThan(5.2);
      const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
      expect(sd, `${label} has a spread but it is all in the tails`).toBeGreaterThan(0.7);
      // Enough draws must land far enough out to overturn a two-point stat gap.
      const far = xs.filter(x => Math.abs(x - mean) > 1).length / xs.length;
      expect(far, `${label} almost never moves a result`).toBeGreaterThan(0.15);
    }
  });

  it('placementsFrom breaks ties by name so a replay ranks identically', () => {
    const flat = { Zoe: 5, Adam: 5, Mia: 9 };
    expect(placementsFrom(flat)).toEqual(['Mia', 'Adam', 'Zoe']);
  });

  it('briefingText takes the spoken lines and ignores the staging', () => {
    const beats = [hostDo('walks in'), hostSay('one'), hostDo('pauses'), hostSay('two')];
    expect(briefingText(beats)).toBe('one\n\ntwo');
  });
});
