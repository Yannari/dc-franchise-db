// ══════════════════════════════════════════════════════════════════════
// tests/tr-banish-or-murder.test.js — the deal at the dinner
// ══════════════════════════════════════════════════════════════════════
//
// The twist is off by default and picks its own night when it is on, so every
// arm here PINS the night (`banishOrMurderSchedule`) rather than sweeping for
// one. What is not pinned is any outcome: the vote is played, and the
// distribution arms below read what a hundred played nights actually did.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildRoundTable } from '../js/vp-tr/round-table.js';
import { alignmentAt } from '../js/tr/roles.js';
import { STAKE_SHARE, VOTED_FOR_THE_MURDER, refusalEvidence }
  from '../js/tr/banish-or-murder.js';
import { resetKnowledge, recordFact } from '../js/knowledge.js';
import { alignmentFactId } from '../js/tr/roles.js';
import { exitVerbs } from '../js/shows.js';
import roster from '../franchise_roster.json';

const EXIT_VERB = (v => v.charAt(0).toUpperCase() + v.slice(1))(exitVerbs('traitors')[0]);

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

function play(seed, eps = [8]) {
  setPlayers(ROSTER);
  setGs({});
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed, banishOrMurderSchedule: eps });
  return (gs.tr?.rounds || []).find(r => r.banishOrMurder) || null;
}

/**
 * Every dinner across `n` seeds, with the episode record beside each round.
 *
 * ALIGNMENT IS CAPTURED HERE, WHILE THE SEASON IT BELONGS TO IS STILL THE LIVE
 * ONE. `alignmentAt` reads `gs`, and `gs` is the season that ran LAST — so an
 * arm that collected sixty rounds and then asked who was a Traitor was asking
 * season sixty about season one's people. It measured the refusals at 17%
 * Traitor against a room of 30%, a tell pointing backwards, and the engine was
 * right the whole time: played live, the same sixty seasons refuse 34% of the
 * pact's votes and 4% of everybody else's.
 */
function sweep(n, eps = [8]) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    const round = play(seed, eps);
    if (!round) continue;
    const ep = (gs.episodeHistory || []).find(e => e.num === round.ep) || null;
    const traitor = {};
    for (const b of round.banishOrMurder.ballots) {
      traitor[b.voter] = alignmentAt(b.voter, round.ep) === 'traitor';
    }
    out.push({ seed, round, ep, traitor });
  }
  return out;
}

describe('the deal at the dinner', () => {
  it('is off unless the author asks for it', () => {
    setPlayers(ROSTER);
    setGs({});
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 4 });
    expect((gs.tr?.rounds || []).some(r => r.banishOrMurder)).toBe(false);
  });

  it('runs once a season and only on the night it was pinned to', () => {
    const runs = sweep(12);
    expect(runs.length).toBeGreaterThan(8);
    for (const { round } of runs) {
      // A PIN PICKS THE NIGHT; the size window still decides whether there is
      // a room worth asking (see `banishOrMurderTonight`).
      expect(round.ep).toBe(8);
      expect((gs.tr?.rounds || []).filter(r => r.banishOrMurder).length).toBeLessThanOrEqual(1);
    }
  });

  it('asks every living player, out loud, and records a reason for each', () => {
    for (const { round } of sweep(8)) {
      const d = round.banishOrMurder;
      const voters = d.ballots.map(b => b.voter);
      expect(new Set(voters).size).toBe(voters.length);
      for (const b of d.ballots) {
        expect(['banish', 'murder']).toContain(b.vote);
        expect(String(b.why).length).toBeGreaterThan(8);
      }
      expect(d.unanimous).toBe(d.refusers.length === 0);
    }
  });

  // ── THE RULE, AND IT IS THE WHOLE TWIST ──────────────────────────────
  it('holds no banishment at all when one voice refuses', () => {
    const refused = sweep(30).filter(r => !r.round.banishOrMurder.unanimous);
    expect(refused.length, 'no refused night in 30 seeds').toBeGreaterThan(3);
    for (const { round } of refused) {
      expect(round.banished).toBe(null);
      expect(round.ballots.length).toBe(0);
      expect(round.stake).toBeUndefined();
    }
  });

  it('banishes with money on it when nobody refuses, and the money follows the alignment', () => {
    const taken = sweep(30).filter(r => r.round.banishOrMurder.unanimous);
    expect(taken.length, 'no taken night in 30 seeds').toBeGreaterThan(3);
    for (const { round } of taken) {
      expect(round.banished).toBeTruthy();
      expect(round.stake).toBeTruthy();
      const { delta, potBefore, potAfter, wasTraitor } = round.stake;
      expect(wasTraitor).toBe(round.banishedWasTraitor);
      // Same amount either way, and it may never take the pot under zero.
      expect(Math.abs(delta)).toBeLessThanOrEqual(round.banishOrMurder.stake);
      expect(wasTraitor ? delta > 0 : delta <= 0).toBe(true);
      expect(potAfter).toBe(Math.max(0, potBefore + delta));
      expect(potAfter).toBeGreaterThanOrEqual(0);
    }
  });

  it('is exclusive: a bought night has no murder, a refused night has one', () => {
    let boughtWithMurder = 0, refusedWithout = 0, refused = 0, bought = 0;
    for (const { round, ep } of sweep(30)) {
      if (!ep) continue;
      const murdered = (ep.exits || []).some(x => x.channel === 'murder');
      if (round.banishOrMurder.unanimous) {
        bought++;
        if (murdered) boughtWithMurder++;
      } else {
        refused++;
        if (!murdered) refusedWithout++;
      }
    }
    expect(bought).toBeGreaterThan(3);
    expect(refused).toBeGreaterThan(3);
    expect(boughtWithMurder, 'the room paid for the night off and the pact worked anyway').toBe(0);
    // A refused night hands the night back to the pact. It can still end in no
    // body — a Shield, or a pact with nobody left to kill — so this is a
    // MAJORITY and not an absolute.
    expect(refusedWithout / refused).toBeLessThan(0.4);
  });

  // ── WHAT IT COSTS THE PERSON WHO DOES IT ─────────────────────────────
  //
  // The channel is priced level with the strongest the murder catalogue has,
  // and this is the arm that says it deserves to be: a refuser is a Traitor
  // far more often than the room is, and still not always — a Faithful who
  // will not gamble the pot raises the same hand.
  it('refusing is the loudest tell in the format, and still not proof', () => {
    let refTr = 0, refAll = 0, roomTr = 0, roomAll = 0;
    for (const { round, traitor: who } of sweep(60)) {
      for (const b of round.banishOrMurder.ballots) {
        const traitor = who[b.voter];
        roomAll++;
        if (traitor) roomTr++;
        if (b.vote === 'murder') { refAll++; if (traitor) refTr++; }
      }
    }
    expect(refAll, 'nobody refused in 60 seeds').toBeGreaterThan(10);
    const refusalRate = refTr / refAll;
    const roomRate = roomTr / roomAll;
    expect(refusalRate, 'a refusal says no more than the room does')
      .toBeGreaterThan(roomRate * 1.6);
    expect(refusalRate, 'a refusal is proof, which it must never be').toBeLessThan(0.92);
  });

  // A UNIT ARM, AND ON PURPOSE. `learn` keeps the source that CREATED a
  // belief, so by the end of a played season the room's belief about a refuser
  // usually carries whatever it first heard about them weeks earlier. Reading
  // the channel back off a finished season would therefore test the order of
  // the season and not the channel. This calls it on a world of its own.
  it('writes the room a belief about everybody who refused', () => {
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 8), bonds: {} });
    gs.tr = { rounds: [], alignment: {} };
    resetKnowledge();
    // The alignment facts have to exist before anybody can hold a belief about
    // one — `learn` refuses an id the store has never heard of.
    for (const n of CAST.slice(0, 8)) {
      recordFact({ type: 'alignment', subject: n, truth: n === CAST[2], ep: 1 });
    }
    const deal = { ep: 5, refusers: [CAST[2]], unanimous: false, ballots: [], stake: 0 };
    const formed = refusalEvidence(deal, 5, () => 0);
    expect(formed.length, 'nobody in the room learned anything').toBeGreaterThan(0);
    const fact = (gs.knowledge || {})[alignmentFactId(CAST[2])];
    const held = Object.values(fact?.beliefs || {})
      .filter(b => String(b.source || '').includes('voted to let the murder happen'));
    expect(held.length).toBeGreaterThan(0);
    // The subject never learns it about themselves.
    expect(fact.beliefs[CAST[2]]).toBeFalsy();
    // The channel's own price, under the alignment ceiling every belief in the
    // game is clamped to — see `learn` in js/knowledge.js.
    for (const b of held) expect(b.confidence).toBeLessThanOrEqual(VOTED_FOR_THE_MURDER + 1e-9);
  });

  // ── THE SCREEN ───────────────────────────────────────────────────────
  it('draws the offer, every hand, and what it cost', () => {
    const runs = sweep(30);
    const taken = runs.find(r => r.round.banishOrMurder.unanimous);
    const refused = runs.find(r => !r.round.banishOrMurder.unanimous);
    expect(taken && refused, 'need one of each to check the screen').toBeTruthy();

    play(refused.seed);
    const refusedHtml = rpBuildRoundTable(
      (gs.episodeHistory || []).find(e => e.num === refused.round.ep), 'audience');
    expect(refusedHtml).toContain('Banish, Or Let Them Work');
    expect(refusedHtml).toContain('Not Every Hand');
    // The card takes the show's own word from the registry, so the test does too.
    expect(refusedHtml).toContain('Nobody Is ' + EXIT_VERB);
    // AND NOT A WORD OF THE CHALK. A refused night holds no ballot, so a
    // screen that still drew the slates would be drawing a vote nobody cast.
    expect(refusedHtml).not.toContain('The Count');

    play(taken.seed);
    const takenHtml = rpBuildRoundTable(
      (gs.episodeHistory || []).find(e => e.num === taken.round.ep), 'audience');
    expect(takenHtml).toContain('Every Hand');
    expect(takenHtml).toMatch(/The Room (Is Paid|Pays)/);
    expect(takenHtml).toContain('The Count');
  });

  it('never prints an alignment beside a hand', () => {
    // The vote is public; who they are is not. The deal's own cards may name
    // everybody in the room and must not say what any of them is.
    for (const { seed, round } of sweep(10)) {
      play(seed);
      const html = rpBuildRoundTable(
        (gs.episodeHistory || []).find(e => e.num === round.ep), 'audience');
      const deal = html.slice(html.indexOf('Banish, Or Let Them Work'),
        html.indexOf('Banish, Or Let Them Work') + 4000);
      for (const b of round.banishOrMurder.ballots) {
        if (alignmentAt(b.voter, round.ep) !== 'traitor') continue;
        const near = new RegExp(b.voter + '[^<]{0,80}(Traitor|traitor)');
        expect(near.test(deal), `${b.voter} is named as a Traitor on the deal card`).toBe(false);
      }
    }
  });

  it('prices the stake off the ceiling, so a short season and a long one feel the same', () => {
    const { round } = sweep(4)[0];
    expect(round.banishOrMurder.stake)
      .toBe(Math.round(((gs.tr.potCeiling || 0) * STAKE_SHARE) / 500) * 500);
    expect(round.banishOrMurder.stake).toBeGreaterThan(0);
  });
});
