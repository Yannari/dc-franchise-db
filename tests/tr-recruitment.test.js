// Recruitment is the only thing in this engine that changes what a player is
// trying to win. Everything else moves beliefs; this moves the truth.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes, isAccurate } from '../js/knowledge.js';
import { recordAlignment, alignmentAt, truthAtLearn, canRecruit, offerRecruitment, chooseRecruit }
  from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge, recordRound } from '../js/tr/deduction.js';
import { exitSpeech } from '../js/tr/exit.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 10).map(p => p.name);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function world(traitors = CAST.slice(0, 2)) {
  setPlayers(roster.players.slice(0, 10));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  CAST.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}
beforeEach(() => world());

describe('when the traitors may recruit at all', () => {
  it('not until one of them has been banished', () => {
    expect(canRecruit(3)).toBe(false);
  });
  it('the night after a traitor is banished', () => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
    expect(canRecruit(4)).toBe(true);
  });
});

describe('the flip', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('changes what the recruit is trying to win, from that episode on', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });   // forced accept
    expect(r.accepted).toBe(true);
    expect(alignmentAt(CAST[5], 4)).toBe('traitor');
    expect(alignmentAt(CAST[5], 2), 'the flip rewrote who they were BEFORE it').toBe('faithful');
  });

  it('does not retroactively make an earlier correct read wrong', () => {
    expect(truthAtLearn(CAST[5], 2)).toBe(false);
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    expect(truthAtLearn(CAST[5], 2), 'a correct episode-2 read was rewritten as a mistake').toBe(false);
    expect(truthAtLearn(CAST[5], 5)).toBe(true);
  });

  it('lets an accepted recruit see the turret, and nobody else', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    const b = believes(CAST[5], alignmentFactId(r.recruiter), 4);
    expect(b, 'the recruit does not know who they just joined').toBeTruthy();
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
    // And nobody else learns anything at all — the turret write names only the
    // two people standing in it. (Not "if a belief exists, it's weak" — that
    // guard can never fail, because no belief is ever formed for an outsider.
    // The honest assertion is that none exists.)
    const outsider = CAST.find(n => n !== CAST[5] && n !== r.recruiter && gs.activePlayers.includes(n));
    const ob = believes(outsider, alignmentFactId(r.recruiter), 4);
    expect(ob, 'recruitment leaked to a bystander who was never in the room').toBeNull();
  });

  it('records how and when, because a two-night traitor owes nobody anything', () => {
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    const flip = gs.tr.roleHistory.find(r => r.name === CAST[5] && r.via === 'recruitment');
    expect(flip).toMatchObject({ from: 'faithful', to: 'traitor', ep: 4 });
  });
});

describe('the ultimatum gate', () => {
  // Same fixture, one variable changed: how many Traitors are alive when the
  // SAME refusal happens. Fatal is earned only by "they have seen your face,"
  // which is only true with exactly one Traitor left to identify.
  it('with two Traitors alive, a requested ultimatum degrades to a survivable note', () => {
    const traitors = CAST.slice(0, 3);
    world(traitors);
    // Banish a non-Traitor so all 3 Traitors are still alive going in, then
    // drop to 2 by having the room take out one Traitor — canRecruit only
    // needs "some banished round happened with a Traitor lost eventually",
    // but the gate itself cares about livingTraitors(ep), so set that up
    // directly: 2 Traitors alive at the moment of the offer.
    recordRound({ ep: 3, banished: traitors[2], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== traitors[2]);
    expect(livingTraitorsCount(traitors)).toBe(2);
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'ultimatum' });   // forced refuse
    expect(r.accepted).toBe(false);
    expect(r.mode, 'an ultimatum with two Traitors alive should never be reported as delivered').toBe('note');
    expect(gs.activePlayers, 'two Traitors alive is not "seen the face" — this must be survivable').toContain(CAST[5]);
  });

  it('with exactly one Traitor alive, the same refusal is fatal', () => {
    const traitors = CAST.slice(0, 2);
    world(traitors);
    recordRound({ ep: 3, banished: traitors[1], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== traitors[1]);
    expect(livingTraitorsCount(traitors.slice(0, 1))).toBe(1);
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'ultimatum' });   // forced refuse
    expect(r.accepted).toBe(false);
    expect(r.mode).toBe('ultimatum');
    expect(gs.activePlayers, 'one Traitor left means they have seen the face').not.toContain(CAST[5]);
  });
});

function livingTraitorsCount(remainingTraitorNames) {
  return remainingTraitorNames.filter(n => gs.activePlayers.includes(n)).length;
}

describe('the era back door', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  // recordFact() mutates a live fact's `.truth` in place on every write
  // (js/knowledge.js), so `fact.truth` after a flip is the CURRENT truth, not
  // the truth as of the episode a belief was formed. isAccurate() must never
  // read that live value for an alignment fact, or a recruitment in episode 8
  // retroactively brands a correct episode-3 read as a mistake — the exact
  // failure the era model exists to prevent. Accuracy on alignment must go
  // through truthAtLearn(name, learnedEp) instead.
  it('refuses to score alignment facts at all, before or after a flip', () => {
    expect(isAccurate(CAST[6], alignmentFactId(CAST[5]), 3)).toBeNull();
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });   // forced accept, flips CAST[5]
    expect(isAccurate(CAST[6], alignmentFactId(CAST[5]), 3),
      'a live-mutated fact.truth was used to retroactively mark a pre-flip read wrong').toBeNull();
  });
});

describe('refusing', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('by note: survivable, and they never learn who asked', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'note' });   // forced refuse
    expect(r.accepted).toBe(false);
    expect(gs.activePlayers).toContain(CAST[5]);
    const b = believes(CAST[5], alignmentFactId(r.recruiter), 4);
    expect(b, 'an anonymous note told them who sent it').toBeNull();
  });

  it('by ultimatum: fatal, because they have seen the face', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'ultimatum' });
    expect(r.accepted).toBe(false);
    expect(gs.activePlayers, 'they refused an ultimatum and lived').not.toContain(CAST[5]);
  });

  it('a high-loyalty faithful refuses more often than a bold strategist', () => {
    // Population: acceptance is proportional, not a threshold.
    const rate = (name) => {
      let yes = 0;
      for (let s = 1; s <= 80; s++) {
        world();
        recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
        gs.activePlayers = CAST.filter(n => n !== CAST[0]);
        if (offerRecruitment(name, 4, seededRng(s), { mode: 'note' }).accepted) yes++;
      }
      return yes / 80;
    };
    // Must exclude the Traitors themselves — offering recruitment to somebody
    // who is already a Traitor is meaningless and would silently make this
    // test measure nothing.
    const TRAITOR_NAMES = CAST.slice(0, 2);
    const byLoyalty = [...roster.players.slice(0, 10)]
      .filter(p => !TRAITOR_NAMES.includes(p.name) && p.name !== CAST[0])
      .sort((a, b) => (b.stats.loyalty || 5) - (a.stats.loyalty || 5));
    const loyal = byLoyalty[0].name, disloyal = byLoyalty[byLoyalty.length - 1].name;
    const rLoyal = rate(loyal), rDisloyal = rate(disloyal);
    console.log(`[population] ${loyal} (loyal) accepts ${(rLoyal * 100).toFixed(0)}%, ` +
                `${disloyal} accepts ${(rDisloyal * 100).toFixed(0)}%`);
    expect(rLoyal, 'loyalty made no difference to whether they turned').toBeLessThan(rDisloyal);
  });
});

describe('the way somebody leaves', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('burn probability drops with tenure, holding ally-presence fixed', () => {
    // A 3-Traitor world so a banishment still leaves an ally alive in EVERY
    // arm. The original version of this test compared a freshly-recruited
    // CAST[5] (who has a living ally, CAST[1]) against CAST[1] as the sole
    // survivor of a 2-Traitor world (no living ally at all) — that measured
    // "has an ally" vs "has none", not tenure, and passed unchanged even with
    // the tenure discount and the rare-state amplification both deleted from
    // exit.js. Forcing CAST[1]'s tenure directly, with CAST[2] alive as its
    // ally in both arms, isolates tenure as the only variable.
    const burnRate = (tenureEp) => {
      let burns = 0;
      for (let s = 1; s <= 80; s++) {
        world(CAST.slice(0, 3));
        recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
        gs.activePlayers = CAST.filter(n => n !== CAST[0]);
        gs.tr.roleHistory.push({ name: CAST[1], from: 'traitor', to: 'traitor', ep: tenureEp, via: 'test-tenure' });
        if (exitSpeech(CAST[1], 5, seededRng(s)).burns) burns++;
      }
      return burns / 80;
    };
    const fresh = burnRate(4);    // ep5 - ep4 = tenure 1
    const founder = burnRate(1);  // ep5 - ep1 = tenure 4 (same tenure as the original founder arm)
    console.log(`[population] tenure-1 burns ${(fresh * 100).toFixed(0)}%, ` +
                `tenure-4 burns ${(founder * 100).toFixed(0)}%`);
    expect(fresh, 'tenure made no difference to whether an ally-having Traitor burns').toBeGreaterThan(founder);
  });

  it('a burn names somebody real, in the text, and never the speaker', () => {
    // WHY THIS TEST HAS A COUNTER AND AN ASSERTION ABOUT THE TEXT.
    //
    // What stood here was two assertions inside `if (sp.burns)` and nothing
    // else, and it could not fail three separate ways. Stub exitSpeech so
    // `burns` is never true and the loop body never runs: green. Both inner
    // assertions were also true BY CONSTRUCTION — `target` is only ever drawn
    // from `gs.activePlayers`, and both branches of exitSpeech already filter
    // `n !== name`, so neither could go red on any implementation that
    // compiles. Three assertions, no coverage.
    //
    // So: a floor on how often a burn actually happens (a fresh recruit at
    // tenure 1 carries the +0.35 rare-state amplification and burns most
    // nights — measured 30/40 here), and an assertion with CONTENT: the name
    // must appear in the sentence the show would print, and a non-burn must
    // carry no name at all, which is the contract exitSpeech documents.
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    let burns = 0, quiet = 0;
    for (let s = 1; s <= 40; s++) {
      const sp = exitSpeech(CAST[5], 5, seededRng(s));
      if (sp.burns) {
        burns++;
        expect(gs.activePlayers).toContain(sp.target);
        expect(sp.target).not.toBe(CAST[5]);
        // The name has to reach the page, not just the object.
        expect(sp.text, 'a burn produced text that does not name the person burned')
          .toContain(sp.target);
        expect(sp.text).toContain(CAST[5]);
      } else {
        quiet++;
        expect(sp.target, 'a speech that says nothing useful still carried a name').toBe(null);
      }
    }
    console.log(`[population] fresh recruit burns ${burns}/40, silent ${quiet}/40`);
    expect(burns, 'nobody ever burned anybody -- every assertion above was skipped')
      .toBeGreaterThan(10);
  });

  it('a low-loyalty faithful burns far more often than a high-loyalty one, and can be wrong about who', () => {
    // Same population-comparison shape as the recruitment-acceptance test
    // above: exclude the actual Traitors, sort the rest by loyalty, and
    // measure the two extremes across fresh worlds.
    const TRAITOR_NAMES = CAST.slice(0, 2);
    const byLoyalty = [...roster.players.slice(0, 10)]
      .filter(p => !TRAITOR_NAMES.includes(p.name) && p.name !== CAST[0])
      .sort((a, b) => (b.stats.loyalty || 5) - (a.stats.loyalty || 5));
    const loyal = byLoyalty[0].name, disloyal = byLoyalty[byLoyalty.length - 1].name;

    const measure = (name) => {
      let burns = 0, wrong = 0;
      for (let s = 1; s <= 80; s++) {
        world();
        recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
        gs.activePlayers = CAST.filter(n => n !== CAST[0]);
        const sp = exitSpeech(name, 5, seededRng(s));
        if (sp.burns) {
          burns++;
          // No Faithful in this fixture ever forms real evidence (nothing
          // calls ballotEvidence/murderEvidence), so every burn here is the
          // no-evidence fallback guess. CAST[1] is the only living Traitor,
          // so a target that isn't CAST[1] is a wrong accusation — the
          // "wrong about who" this test's title names.
          if (sp.target !== CAST[1]) wrong++;
        }
      }
      return { rate: burns / 80, wrong };
    };
    const rLoyal = measure(loyal), rDisloyal = measure(disloyal);
    console.log(`[population] ${loyal} (loyal) burns ${(rLoyal.rate * 100).toFixed(0)}%, ` +
                `${disloyal} (disloyal) burns ${(rDisloyal.rate * 100).toFixed(0)}%`);
    expect(rDisloyal.rate, 'a low-loyalty faithful is no angrier on the way out than a high-loyalty one')
      .toBeGreaterThan(rLoyal.rate);
    expect(rDisloyal.rate, 'measured population rate should clear a real floor, not just edge out the other arm')
      .toBeGreaterThan(0.10);
    expect(rLoyal.rate, 'a high-loyalty faithful should almost never burn anyone').toBeLessThan(0.10);
    expect(rDisloyal.wrong, 'an evidence-free faithful should sometimes name the wrong person')
      .toBeGreaterThan(0);
  });
});
