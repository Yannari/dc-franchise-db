// DOES THE ROOM ACTUALLY WORK ANYTHING OUT?
//
// Spec section 13, step 6: "If a Round Table does not produce a believable
// banishment here, nothing else matters — stop and fix it before building
// anything else." This file is that check, and it is the reason this plan
// exists before any screen, any mission and any conclave.
//
// A green unit suite proves beliefs update. It does not prove a castle deduces.
// These are population measurements over many seeded seasons, and a failure here
// is a DESIGN failure, not a flaky test — do not widen a band to make it pass.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

// franchise_roster.json is { players: [...] }, NOT a bare array. Reaching for
// roster.slice() throws; this is the shape the file actually has.
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
// Sixty seasons is not enough seasons.
//
// Measured across 40 disjoint 60-season blocks, the lift band failed 1 in 40
// (min 1.37), the faithful-win band 3 in 40 and SHARPENS 2 in 40 — about 15% of
// blocks would go red on an engine nobody had touched. The suite is not flaky
// (the seeds are fixed 1..60), but the headroom it reports is optimistic and the
// particular block it reports flatters the result. Two hundred seasons costs a
// few seconds and turns a population estimate into one.
const SEASONS = 200;

function run(n = SEASONS, traitorCount = 3) {
  setPlayers(ROSTER);
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST, traitorCount, seed: i + 1 }));
}

describe('the castle, measured over many seasons', () => {
  const seasons = run();

  it('finishes every season without hanging or crashing', () => {
    expect(seasons.length).toBe(SEASONS);
    seasons.forEach(s => {
      expect(s.log.length).toBeGreaterThan(2);
      expect(['traitors', 'faithfuls']).toContain(s.winner);
    });
  });

  it('BEATS CHANCE: banishments beat the SHIFTING null, not the premiere one', () => {
    // The null here is not a constant, and getting that wrong is the easiest way
    // to award this engine credit it has not earned. Three Traitors in twenty is
    // 15.8% on night one only. The murder removes a FAITHFUL every round and
    // nothing but a banishment ever removes a Traitor, so Traitor density climbs
    // monotonically all season — by the eighth banishment a coin flip hits a
    // Traitor 27% of the time. Averaged over the real population trajectory the
    // aggregate null is 19.1%, not 15%.
    //
    // So this asserts two things: the fixed floor the plan specified, AND a real
    // multiple of the null actually observed in these seasons. A uniform-random
    // voter scores 0.92x its own null; this engine scores 1.8x.
    let hits = 0, total = 0, nullSum = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (!r.banished) return;
      total++;
      nullSum += r.traitorsAtVote / r.aliveAtVote;   // chance, at the moment of THIS vote
      if (r.wasTraitor) hits++;
    }));
    expect(total, 'nothing was banished — this metric would be vacuous').toBeGreaterThan(100);
    const rate = hits / total, nul = nullSum / total;
    console.log(`traitor-hit rate: ${(rate * 100).toFixed(1)}% over ${total} banishments `
      + `(null ${(nul * 100).toFixed(1)}%, lift ${(rate / nul).toFixed(2)}x)`);
    expect(rate, 'the room is banishing at random — the deduction layer is not working').toBeGreaterThan(0.22);
    expect(rate / nul, 'the hit rate is just Traitor density, not deduction').toBeGreaterThan(1.4);
  });

  it('DOES NOT SOLVE IT: the faithfuls must lose a fair share of seasons', () => {
    const faithfulWins = seasons.filter(s => s.winner === 'faithfuls').length / seasons.length;
    console.log(`faithful win rate: ${(faithfulWins * 100).toFixed(1)}%`);
    // The real format is Traitor-favoured. A castle that always finds them is
    // as broken as one that never does, and far less fun.
    expect(faithfulWins).toBeGreaterThan(0.10);
    expect(faithfulWins, 'the faithfuls are solving it every time').toBeLessThan(0.75);
  });

  it('SHARPENS: the LIFT OVER CHANCE grows as the season goes on', () => {
    // Raw hit rate cannot tell learning from arithmetic. A uniform-random voter
    // ALSO shows late > early — 16.6% to 22.7% when measured — purely because
    // Traitor density drifts upward as Faithfuls are murdered. A band on the raw
    // rate is therefore passed by an engine with no deduction in it at all, which
    // makes it worse than no band.
    //
    // So both halves are measured against the chance rate that applied at each
    // individual banishment, and what must grow is the LIFT. Under the random
    // control this goes red exactly as it should: -0.6pp early, -2.8pp late.
    const lift = (pick) => {
      let hits = 0, total = 0, nul = 0;
      seasons.forEach(s => {
        const bans = s.log.filter(r => r.banished);
        pick(bans).forEach(r => {
          total++; nul += r.traitorsAtVote / r.aliveAtVote; if (r.wasTraitor) hits++;
        });
      });
      return { lift: hits / total - nul / total, rate: hits / total, nul: nul / total, total };
    };
    const early = lift(b => b.slice(0, Math.floor(b.length / 2)));
    const late  = lift(b => b.slice(Math.floor(b.length / 2)));
    expect(early.total, 'no early banishments to measure').toBeGreaterThan(40);
    expect(late.total, 'no late banishments to measure').toBeGreaterThan(40);
    console.log(`early ${(early.rate * 100).toFixed(1)}% vs null ${(early.nul * 100).toFixed(1)}% = lift ${(early.lift * 100).toFixed(1)}pp (n=${early.total})`);
    console.log(`late  ${(late.rate * 100).toFixed(1)}% vs null ${(late.nul * 100).toFixed(1)}% = lift ${(late.lift * 100).toFixed(1)}pp (n=${late.total})`);
    expect(late.lift, 'the room learns nothing as the season goes on').toBeGreaterThan(early.lift + 0.05);
    expect(late.lift, 'late banishments are no better than chance').toBeGreaterThan(0.10);
  });

  it('IS CONTESTED: the room votes as neither a bloc nor a coin', () => {
    // The band this replaces asked whether two distinct names got a vote. With
    // ~13 ballots, a noise term on every score and Traitors structurally barred
    // from naming the pact, at least one vote always diverges — so it read
    // 100.0%, and it would read 100.0% on an engine with no deduction in it.
    // A metric that cannot go red is not a metric.
    //
    // Plurality share — the winner's votes over the ballots cast — has a failure
    // mode in BOTH directions. A room following a single shared scalar converges
    // on 1.0; a room with no shared read at all cannot concentrate votes.
    // Measured here: 31.3-32.6% across five disjoint 60-season blocks.
    let shares = [], marginSum = 0, closeRounds = 0, roundCount = 0;
    seasons.forEach(s => (s.rounds || []).forEach(r => {
      const t = {};
      (r.ballots || []).forEach(b => { t[b.voted] = (t[b.voted] || 0) + 1; });
      const counts = Object.values(t).sort((a, b) => b - a);
      const cast = (r.ballots || []).length;
      if (!counts.length || !cast) return;
      roundCount++;
      shares.push(counts[0] / cast);
      marginSum += counts[0] - (counts[1] || 0);
      if (counts[0] - (counts[1] || 0) <= 1) closeRounds++;
    }));
    expect(roundCount, 'no round tables to measure').toBeGreaterThan(100);
    const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
    console.log(`mean plurality share: ${(mean * 100).toFixed(1)}% over ${roundCount} round tables `
      + `(mean winning margin ${(marginSum / roundCount).toFixed(2)} votes, `
      + `${(closeRounds / roundCount * 100).toFixed(1)}% decided by <=1)`);
    expect(mean, 'nobody agrees with anybody — there is no shared read in the room').toBeGreaterThan(0.20);
    expect(mean, 'the room is voting as one bloc, not deducing').toBeLessThan(0.55);
  });

  it('replays identically from a seed', () => {
    const a = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 99 });
    const b = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 99 });
    expect(a.log.map(r => r.banished)).toEqual(b.log.map(r => r.banished));
    expect(a.winner).toBe(b.winner);
  });

  it('starts genuinely fresh: no beliefs leak between seasons', () => {
    // A half-reset world — new rounds and a new roster but the OLD knowledge
    // store — inflates the detection rate and gives a false pass on the gate.
    // If anything leaked, an intervening season would perturb the replay.
    const first = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 4242 });
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 777 });
    playTraitorsSeason({ cast: CAST, traitorCount: 2, seed: 31337 });
    const again = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 4242 });
    expect(again.traitors).toEqual(first.traitors);
    expect(again.log.map(r => `${r.banished}/${r.murdered}`))
      .toEqual(first.log.map(r => `${r.banished}/${r.murdered}`));
  });
});
