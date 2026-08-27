// ══════════════════════════════════════════════════════════════════════
// tr-endgame.test.js — banish, or end the game (spec §8)
// ══════════════════════════════════════════════════════════════════════
//
// EVERY GUARD IN THIS FILE ASSERTS AT THE DECISION POINT AND STATES ITS
// COVERAGE, and that is a direct consequence of Task 4 of this plan: a guard
// there SURVIVED its mutation because the forbidden state occurred in 22
// seasons out of 400 and a season-level assertion could not see the rule
// break. An endgame is rare by construction too — one phase per season, a
// handful of asks inside it — so "the endgame resolved correctly" over a
// population of seasons is exactly the trap. What is asserted here instead is
// every ask, every table and every resolution, one at a time, with a floor
// underneath each population proving the sample contained the case at all.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, learn, whoKnows } from '../js/knowledge.js';
import { alignmentFactId, recordAlignment, alignmentAt } from '../js/tr/roles.js';
import { seedTraitorKnowledge, _setPactPotBlind } from '../js/tr/deduction.js';
import { endgameChoice, resolvePot, _setEndgameWatch } from '../js/tr/endgame.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const SEASONS = 200;

/** N seeded seasons, and the belief store of each one read while it still exists. */
function seasons(n = SEASONS, each = null) {
  setPlayers(ROSTER);
  const out = [];
  for (let i = 1; i <= n; i++) {
    const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
    // resetKnowledge() runs at the START of the next season, so anything that
    // wants to read what the castle believed has to read it here, before the
    // next call wipes it. A probe that runs after the loop is reading season n.
    if (each) each(s);
    out.push(s);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// 1. THE LOOP
// ══════════════════════════════════════════════════════════════════════

describe('one vote to banish forces another Round Table', () => {
  it('every ask with a banish in it sits a table; only a unanimous ask ends it', () => {
    // ASSERTED PER ASK, NOT PER SEASON. `endgame.ballots[i]` is the secret
    // choice put to the room before table `i`, and `endgame.rounds[i]` is the
    // table it did or did not force. The rule is a statement about that pair
    // and it is checked on every one of them.
    let withBanish = 0, unanimous = 0, asks = 0, splitAsks = 0;
    for (const s of seasons()) {
      const { ballots, rounds } = s.endgame;
      for (let i = 0; i < ballots.length; i++) {
        asks++;
        const banishers = ballots[i].choices.filter(c => c.choice === 'banish');
        if (banishers.length) {
          withBanish++;
          if (banishers.length < ballots[i].choices.length) splitAsks++;
          expect(rounds[i], `ep ${ballots[i].ep}: ${banishers.length} of `
            + `${ballots[i].choices.length} voted to banish and no table sat`).toBeTruthy();
          expect(rounds[i].ep, 'the table that sat was not the one this ask forced')
            .toBe(ballots[i].ep);
          expect(rounds[i].banished, 'a table sat and banished nobody').toBeTruthy();
        } else {
          unanimous++;
          // A unanimous ask is the end of the phase by definition: no table
          // after it, and no further ask.
          expect(rounds.length, 'the room was unanimous and a table sat anyway').toBe(i);
          expect(i, 'the room was unanimous and was asked again').toBe(ballots.length - 1);
        }
      }
    }
    console.log(`[coverage] ${asks} asks over ${SEASONS} seasons: ${withBanish} forced a table `
      + `(${splitAsks} of them SPLIT — at least one player wanted to end it), ${unanimous} were unanimous`);
    // COVERAGE. Without these the test passes on a run that never reached
    // either branch, which is precisely how Task 4's guard stayed green with
    // its rule deleted.
    expect(withBanish, 'no ask ever forced a table — the loop arm is vacuous').toBeGreaterThan(100);
    expect(unanimous, 'no room was ever unanimous — the exit arm is vacuous').toBeGreaterThan(100);
    // AND THE INTERESTING CASE SPECIFICALLY. "One vote to banish forces
    // another Round Table" is only a rule where the vote was not unanimous;
    // a run in which every banish-ask was UNANIMOUSLY for banishing would
    // satisfy the arm above while never testing the word "one".
    expect(splitAsks, 'every banish-ask was unanimous — "one vote is enough" '
      + 'was never actually exercised').toBeGreaterThan(50);
  });

  it('the phase always terminates, and never on nobody', () => {
    // The all-tied Round Table that banished `undefined` is a bug this engine
    // has already had once (see the drawPool comment in tr/roundtable.js). The
    // endgame adds tables of two and three people, which is exactly where an
    // every-name-tied ballot is likeliest, so the property is re-asserted over
    // the tables this phase produces rather than assumed to be inherited.
    let tables = 0, tiny = 0;
    for (const s of seasons()) {
      const { rounds, survivors } = s.endgame;
      for (const r of rounds) {
        tables++;
        if (r.ballots.length <= 3) tiny++;
        expect(r.banished, 'an endgame table selected nobody').toBeTruthy();
        expect(typeof r.banished).toBe('string');
        expect(survivors).not.toContain(r.banished);
      }
      expect(survivors.length, 'the endgame ran the castle empty').toBeGreaterThan(0);
    }
    console.log(`[coverage] ${tables} endgame tables, ${tiny} of them with three ballots or fewer`);
    expect(tables, 'no endgame table sat at all').toBeGreaterThan(150);
    expect(tiny, 'no table small enough to deadlock ever sat').toBeGreaterThan(20);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. NO REVEALS
// ══════════════════════════════════════════════════════════════════════

describe('nobody is revealed in the endgame', () => {
  it('an endgame banishment writes no public alignment belief; a mandated one does', () => {
    // WHAT THE PROBE LOOKS FOR, AND WHY IT IS NOT A STORE SWEEP. Task 2 of
    // this plan learned that sweeping a belief store measures the SURVIVORS of
    // an overwriting process rather than the writes. This one is safe from
    // that for a specific reason: a `public` alignment belief about a departed
    // player is the last thing anybody ever learns about them — nothing in the
    // castle writes about somebody who has left — so a reveal, if it fired,
    // could not be overwritten before the season ends.
    //
    // THE DISCRIMINATOR IS THE SOURCE STRING, AND `learnedEp` IS NOT USABLE
    // FOR IT. `public` alone proves nothing: a Traitor already carries turret
    // beliefs about the pact. `learnedEp` looks like the fix and is a trap —
    // js/knowledge.js's learn() bumps `learnedEp` on EVERY call while leaving
    // `source`/`sourceType` alone unless the new claim is more confident, so a
    // rumour at an endgame table re-dates an episode-1 turret belief to the
    // finale and it reads exactly like a fresh reveal. Measured: seed 6 flagged
    // Caleb's episode-1 turret belief about Bridgette as an ep-11 leak.
    // `'the reveal'` is written by revealCascade and by nothing else, so the
    // probe reads the write it is actually about.
    //
    // AND THE SECOND HALF IS THE CONTROL. A probe that finds no reveal in the
    // endgame is worth nothing until it has found one somewhere, so the same
    // probe is run over the MANDATED banishments in the same seasons, where a
    // reveal is supposed to fire on every single one.
    let egChecked = 0, egLeaks = [], mandatedChecked = 0, mandatedSeen = 0;
    seasons(SEASONS, (s) => {
      const startEp = s.endgame.ballots[0]?.ep ?? Infinity;
      const revealed = (name) =>
        whoKnows(alignmentFactId(name)).filter(b => b.sourceType === 'public' && b.source === 'the reveal');
      for (const r of s.endgame.rounds) {
        egChecked++;
        const leaked = revealed(r.banished);
        if (leaked.length) egLeaks.push(`${r.banished} @ep${r.ep}: ${leaked.length} knowers`);
      }
      for (const r of s.rounds) {
        if (!r.banished || r.ep >= startEp) continue;
        mandatedChecked++;
        if (revealed(r.banished).length) mandatedSeen++;
      }
    });
    console.log(`[coverage] ${egChecked} endgame banishments checked, ${egLeaks.length} leaked; `
      + `control: ${mandatedSeen}/${mandatedChecked} mandated banishments DID reveal`);
    expect(egChecked, 'no endgame banishment happened — the probe saw nothing').toBeGreaterThan(150);
    // THE CONTROL FIRST: if this is not near-total the probe cannot see a
    // reveal and the line below is unfalsifiable.
    expect(mandatedChecked, 'no mandated banishment to control against').toBeGreaterThan(1000);
    expect(mandatedSeen / mandatedChecked,
      'the probe cannot even see the reveals that DO fire — it proves nothing about the endgame')
      .toBeGreaterThan(0.99);
    expect(egLeaks.slice(0, 5),
      'somebody was revealed at an endgame table — the survivors are no longer on nerve alone')
      .toEqual([]);
  });

  it('nor does anybody name a certain name on the way out of a finale table', () => {
    // THE SECOND REVEAL, and the belief-store probe above cannot see it.
    //
    // `revealCascade` is switched off in the endgame; `exitSpeech` was not.
    // exit.js builds a Traitor's speech out of GROUND TRUTH — it picks the
    // target from the living Traitors and stamps `conviction: 1` — and the
    // record ships to callers on `endgame.rounds[].exitSpeech`. That is a
    // certain, correct alignment leaving a phase spec §8 says has no reveals
    // in it. Measured before the fix: 189 of 1,680 endgame rounds over 1,200
    // seasons, 11.3%; seed 3 "Brightly names Brody on the way out", both
    // Traitors. It writes no belief, so nothing in the store betrays it and
    // the probe above is green over the top of it.
    //
    // THE RULE IS ASSERTED ON EVERY TABLE, not on a season, and it is blind
    // to alignment: a Faithful's speech leaks nothing, but suppressing only
    // the Traitors' would make the silence itself the tell.
    //
    // THREE ARMS, because the assertion is a NEGATIVE and a negative over a
    // dead channel is free. (1) coverage — the endgame really did banish
    // Traitors, which is the state that carried the leak. (2) the control —
    // mandated tables still carry speeches, so `exitSpeech` is not simply
    // switched off everywhere with this test green by vacuity. (3) the
    // control's own coverage — mandated tables still produce CERTAIN speeches,
    // so the exact leaking shape is demonstrably reachable in this build and
    // its absence from the endgame is suppression rather than extinction.
    let egTables = 0, egTraitorsBanished = 0;
    const egSpoke = [];
    let mandTables = 0, mandSpeeches = 0, mandBurns = 0, mandCertain = 0;
    seasons(SEASONS, (s) => {
      const startEp = s.endgame.ballots[0]?.ep ?? Infinity;
      for (const r of s.endgame.rounds) {
        egTables++;
        if (r.banishedWasTraitor) egTraitorsBanished++;
        if (r.exitSpeech) egSpoke.push(`${r.banished} @ep${r.ep}: ${r.exitSpeech.text}`);
      }
      for (const r of s.rounds) {
        if (!r.banished || r.ep >= startEp) continue;
        mandTables++;
        if (!r.exitSpeech) continue;
        mandSpeeches++;
        if (r.exitSpeech.burns) mandBurns++;
        if (r.exitSpeech.burns && r.exitSpeech.conviction === 1) mandCertain++;
      }
    });
    console.log(`[coverage] ${egTables} endgame tables (${egTraitorsBanished} banished a Traitor), `
      + `${egSpoke.length} carried a speech; control: ${mandSpeeches}/${mandTables} mandated tables `
      + `spoke, ${mandBurns} burned, ${mandCertain} of those at conviction 1`);

    expect(egTables, 'no endgame table sat — the probe saw nothing').toBeGreaterThan(150);
    expect(egTraitorsBanished, 'no endgame table ever banished a Traitor, so the leaking state '
      + 'never arose and this assertion is vacuous').toBeGreaterThan(30);
    // THE CONTROL, BEFORE THE ASSERTION. If exit speeches stopped being
    // generated at all, the endgame arm would be green for the wrong reason.
    expect(mandSpeeches / mandTables, 'mandated banishments have stopped carrying an exit speech — '
      + 'the endgame arm below is green by vacuity, not by suppression').toBeGreaterThan(0.99);
    expect(mandCertain, 'not one certain (conviction 1) exit speech anywhere in the season — the '
      + 'exact shape this test forbids is unreachable, so forbidding it proves nothing')
      .toBeGreaterThan(20);

    expect(egSpoke.slice(0, 5),
      'somebody spoke on the way out of a finale table — spec §8 leaves the survivors on nerve '
      + 'alone, and a banished Traitor names a fellow from ground truth at conviction 1')
      .toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. THE CHOICE READS BELIEFS, NOT GROUND TRUTH
// ══════════════════════════════════════════════════════════════════════

const NERVE_STATS = { physical: 5, endurance: 5, mental: 7, social: 7, strategic: 7,
  loyalty: 7, boldness: 10, intuition: 7, temperament: 3 };
const TRIO = ['Ea', 'Eb', 'Ec'].map(n => ({ name: n, slug: n.toLowerCase(), gender: 'nb',
  archetype: 'floater', stats: { ...NERVE_STATS } }));
const TRIO_CAST = TRIO.map(p => p.name);

/** Ea is a Traitor and has been shown the turret. Eb and Ec believe nothing. */
function trioWorld() {
  setPlayers(TRIO);
  setGs({ bonds: {}, activePlayers: [...TRIO_CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  recordAlignment('Ea', true, 1, 'selection');
  recordAlignment('Eb', false, 1, 'selection');
  recordAlignment('Ec', false, 1, 'selection');
  seedTraitorKnowledge(1);
}

describe('a Faithful ends the game when they BELIEVE the room is clean', () => {
  it('ends it with a Traitor sitting opposite, on no evidence at all', () => {
    // THE WHOLE POINT OF THE PHASE. Ea is genuinely a Traitor and is in the
    // room; Eb has formed no belief about anybody. Eb must end the game — and
    // be wrong. Reading `alignmentAt` in that branch would make every Faithful
    // an oracle and delete the format's central error, so this is the assertion
    // that forbids it.
    trioWorld();
    const c = endgameChoice('Eb', TRIO_CAST, 2);
    expect(c.role).toBe('faithful');
    expect(c.top, 'Eb held a read they were never given').toBe(0);
    expect(c.choice, 'a Faithful with no evidence still wanted a banishment — '
      + 'the choice is reading something other than belief').toBe('end');
    expect(alignmentAt('Ea', 2), 'the fixture is wrong: nobody in the room is a Traitor')
      .toBe('traitor');
  });

  it('and asks for another table the moment it holds one', () => {
    // The control arm for the test above: a branch that always said `end`
    // would pass it while being just as broken.
    trioWorld();
    learn('Eb', alignmentFactId('Ea'), { source: 'the ballots', sourceType: 'deduced',
      confidence: 0.62, ep: 2, rng: () => 0 });
    const c = endgameChoice('Eb', TRIO_CAST, 2);
    expect(c.top, 'the planted belief did not reach the board').toBeGreaterThan(0.5);
    expect(c.choice, 'a Faithful holding a strong read walked away from it').toBe('banish');
  });

  it('a Traitor with no fellow left ends it — the money is already theirs', () => {
    trioWorld();
    const c = endgameChoice('Ea', TRIO_CAST, 2);
    expect(c.role).toBe('traitor');
    expect(c.fellows, 'Ea was shown a fellow that does not exist').toEqual([]);
    expect(c.choice, 'a lone Traitor pushed for another table with nothing to gain')
      .toBe('end');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. THE MONEY
// ══════════════════════════════════════════════════════════════════════

describe('the pot goes where spec §8 says it goes', () => {
  it('any Traitor standing takes all of it; only a clean castle splits it', () => {
    // ASSERTED ON THE RESOLUTION ITSELF, once per season, against the
    // alignments of the people actually left in the room — and the takers are
    // READ off the record rather than recomputed, so a rule that moves cannot
    // take its own test with it.
    let traitorEnds = 0, cleanEnds = 0, multiTraitorEnds = 0, robbed = 0;
    // READ INSIDE THE SEASON, NOT AFTER IT. `alignmentAt` answers about
    // whatever castle `gs` currently holds, and `gs` is replaced wholesale by
    // the next season — a loop over collected records would score all 200
    // seasons against season 200's alignment ledger and be quietly meaningless.
    seasons(SEASONS, (s) => {
      const e = s.endgame;
      const ep = e.endEp;
      const standingTraitors = e.survivors.filter(n => alignmentAt(n, ep) === 'traitor');
      if (standingTraitors.length) {
        traitorEnds++;
        if (standingTraitors.length > 1) multiTraitorEnds++;
        expect(e.winner, 'a Traitor was standing and the Faithfuls won').toBe('traitors');
        expect([...e.takers].sort(), 'somebody other than the standing Traitors was paid')
          .toEqual([...standingTraitors].sort());
        const faithfulSurvivors = e.survivors.filter(n => !standingTraitors.includes(n));
        if (faithfulSurvivors.length) {
          robbed++;
          for (const n of faithfulSurvivors) {
            expect(e.takers, `${n} reached the end beside a Traitor and was paid anyway`)
              .not.toContain(n);
          }
        }
      } else {
        cleanEnds++;
        expect(e.winner, 'the castle was clean and the Traitors won').toBe('faithfuls');
        expect([...e.takers].sort(), 'a clean castle did not split it among the survivors')
          .toEqual([...e.survivors].sort());
      }
      expect(s.winner, 'the season record disagrees with its own endgame').toBe(e.winner);
    });
    console.log(`[coverage] ${traitorEnds} seasons ended on a Traitor `
      + `(${multiTraitorEnds} on more than one, ${robbed} with a Faithful robbed beside them), `
      + `${cleanEnds} on a clean castle`);
    expect(traitorEnds, 'no Traitor ever survived — the take-all arm is vacuous').toBeGreaterThan(40);
    expect(cleanEnds, 'no castle was ever clean — the split arm is vacuous').toBeGreaterThan(40);
    expect(robbed, 'no Faithful ever reached the end beside a Traitor — the '
      + 'one state the whole format is built around never occurred').toBeGreaterThan(20);
  });

  it('and the sentence that announces it agrees with the ledger', () => {
    // THE STANDING REQUIREMENT THIS PLAN ADDED AFTER TASK 1. Three prose
    // defects of this exact shape have shipped in this project, every one of
    // them found by reading and none by an assertion: a printed count that
    // disagreed with the ledger it summed. The endgame is dense with such
    // sentences — who is left, what the pot is, who takes it — so the line is
    // checked against the numbers it claims.
    let checked = 0, withFigures = 0;
    for (const s of seasons(60)) {
      const e = s.endgame;
      checked++;
      // Every taker is named, and nobody who was not paid is.
      for (const n of e.takers) {
        expect(e.line, `the payout line does not name ${n}, who was paid`).toContain(n);
      }
      for (const n of e.losers) {
        expect(e.takers).not.toContain(n);
      }
      // Any figure printed is a figure the pot can actually pay. Not every
      // variant names one — several say "all of it" — so the coverage floor
      // below is what stops this half going vacuous rather than a demand that
      // each line carry a number.
      const printed = [...e.line.matchAll(/[\d,]{4,}/g)].map(m => Number(m[0].replace(/,/g, '')));
      if (printed.length) withFigures++;
      for (const p of printed) {
        expect([e.pot, e.share], `${p} is neither the pot (${e.pot}) nor a share `
          + `(${e.share}) in: ${e.line}`).toContain(p);
      }
      expect(e.share * e.takers.length, 'the shares do not add up to the pot')
        .toBeLessThanOrEqual(e.pot);
      expect((e.share + 1) * e.takers.length, 'the shares leave a whole extra share unpaid')
        .toBeGreaterThan(e.pot);
      // A line that mentions somebody getting nothing must have somebody to
      // mean, and a line that does not must have nobody.
      if (e.lineKey.endsWith('-robbed')) expect(e.losers.length).toBeGreaterThan(0);
      else expect(e.losers.length).toBe(0);
    }
    expect(checked).toBe(60);
    console.log(`[coverage] ${withFigures} of ${checked} payout lines printed a figure`);
    expect(withFigures, 'no payout line printed a number at all — the arithmetic '
      + 'half of this guard checked nothing').toBeGreaterThan(20);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. THE ENDGAME IS THE POT'S SECOND READER
// ══════════════════════════════════════════════════════════════════════

describe('the money is what a Traitor is weighing', () => {
  it('the pot hold-out really holds something out of the endgame', () => {
    // tests/tr-missions.test.js proves a mission grants nothing but money by
    // playing forty seasons with the money on and off and demanding they come
    // back identical — and it does that with BOTH arms blind to the pot,
    // because the pot is read at the ballot. This file is the pot's second
    // reader, so the same hold-out has to be shown to hold something out HERE
    // too: "mostly identical" has no failure state, and a hold-out nobody has
    // measured is a hole rather than a narrowing.
    const grab = (blind) => {
      const seen = [];
      const un = blind ? _setPactPotBlind(true) : null;
      const stop = _setEndgameWatch(d => {
        if (d.role === 'traitor') seen.push(`${d.name}|${d.ep}|${d.appetite.toFixed(4)}`);
      });
      try { seasons(60); } finally { stop(); if (un) un(); }
      return seen;
    };
    const open = grab(false), blind = grab(true);
    expect(open.length, 'no Traitor ever reached the endgame — nothing to compare')
      .toBeGreaterThan(50);
    const appetite = (rows) => rows.reduce((a, r) => a + Number(r.split('|')[2]), 0) / rows.length;
    console.log(`[hold-out] mean Traitor appetite: pot visible ${appetite(open).toFixed(4)}, `
      + `pot blind ${appetite(blind).toFixed(4)} (${open.length} vs ${blind.length} decisions)`);
    expect(appetite(blind), 'blinding the pot changed nothing about what a Traitor '
      + 'wants at the last table — the endgame is not reading the money')
      .toBeLessThan(appetite(open) - 0.05);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 6. A BETRAYAL IS NO LONGER SILENT
// ══════════════════════════════════════════════════════════════════════

describe('a Traitor naming a Traitor produces a sentence', () => {
  it('every such ballot is recorded and narrated, and nothing else is', () => {
    // Plan 6 Task 6 shipped the mechanism and measured that it produced NO
    // narration anywhere: the format's biggest moment printed nothing. The
    // record lives on the round, so the guard reads the ballots the round
    // itself carries rather than recomputing who was in the pact.
    let ballots = 0, recorded = 0, skipped = 0, lines = new Set();
    // TWO THINGS MAKE THIS READABLE FROM OUTSIDE, AND THE SECOND IS A TRAP.
    //
    // Inside the season, because `alignmentAt` answers about the live `gs` and
    // the next season replaces it wholesale.
    //
    // And SKIPPING the tables where somebody flipped that same episode. A
    // recruitment is recorded with `sinceEp` equal to the episode it happened
    // in, but it happens at NIGHT — after the table. So `alignmentAt(x, ep)`
    // read afterwards says "Traitor" about somebody who was a Faithful when
    // they cast that evening's ballot, and a completeness check built on it
    // demands a betrayal the engine correctly did not record. Measured: it
    // fired on ep 7 of the first run of this guard. The engine's own record is
    // era-correct because it was taken at the table; the reconstruction is
    // what is wrong, so the reconstruction stands aside on those rounds and
    // says how many it stood aside on.
    seasons(120, (s) => {
      const flipped = new Set((s.roleHistory || [])
        .filter(h => h.via !== 'selection').map(h => h.ep));
      for (const r of [...s.rounds, ...s.endgame.rounds]) {
        recorded += (r.betrayals || []).length;
        for (const b of (r.betrayals || [])) {
          expect(b.line, 'a betrayal was recorded with no sentence attached').toBeTruthy();
          expect(b.line).toContain(b.voter);
          expect((r.ballots || []).some(x => x.voter === b.voter && x.voted === b.target),
            'a betrayal was narrated over a ballot nobody cast').toBe(true);
          lines.add(b.line.split(b.voter).join('{v}').split(b.target).join('{t}'));
        }
        if (flipped.has(r.ep)) { skipped++; continue; }
        const real = (r.ballots || []).filter(b => b.voted && b.channel === 'banishment'
          && alignmentAt(b.voter, r.ep) === 'traitor' && alignmentAt(b.voted, r.ep) === 'traitor');
        ballots += real.length;
        expect((r.betrayals || []).length, `ep ${r.ep}: ${real.length} Traitors named a `
          + `fellow and ${(r.betrayals || []).length} were recorded`).toBe(real.length);
      }
    });
    console.log(`[coverage] ${ballots} Traitor-on-Traitor ballots over 120 seasons `
      + `(${skipped} tables skipped for a same-episode flip), ${recorded} narrated, `
      + `${lines.size} distinct sentence shapes`);
    expect(ballots, 'not one Traitor turned on a fellow — the guard saw nothing')
      .toBeGreaterThan(60);
    // Four variants minimum is this project's rule for any pool that can fire
    // more than once in a season, and this one fires several times a finale.
    expect(lines.size, 'a betrayal reads the same way every time').toBeGreaterThanOrEqual(4);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 7. RESOLUTION IS A PURE READ OF THE ROOM
// ══════════════════════════════════════════════════════════════════════

describe('resolvePot, directly', () => {
  it('pays the Traitor and nobody beside them', () => {
    trioWorld();
    const r = resolvePot(2);
    expect(r.winner).toBe('traitors');
    expect(r.takers).toEqual(['Ea']);
    expect(r.losers.sort()).toEqual(['Eb', 'Ec']);
  });

  it('splits it when the last cloak is gone', () => {
    trioWorld();
    gs.tr.pot = 90000;
    gs.activePlayers = ['Eb', 'Ec'];
    const r = resolvePot(2);
    expect(r.winner).toBe('faithfuls');
    expect(r.takers.sort()).toEqual(['Eb', 'Ec']);
    expect(r.share).toBe(45000);
    expect(r.losers).toEqual([]);
  });
});
