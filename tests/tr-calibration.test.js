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
const SEASONS = 60;

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

  it('BEATS CHANCE: banishments hit traitors more often than random would', () => {
    // Random banishment with 3 traitors in 20 hits one ~15% of the time. This is
    // the whole thesis of the plan: if it is not clearly above chance, the
    // deduction engine does not work and nothing downstream can save it.
    let hits = 0, total = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (r.banished) { total++; if (r.wasTraitor) hits++; }
    }));
    expect(total, 'nothing was banished — this metric would be vacuous').toBeGreaterThan(100);
    const rate = hits / total;
    console.log(`traitor-hit rate: ${(rate * 100).toFixed(1)}% over ${total} banishments`);
    expect(rate, 'the room is banishing at random — the deduction layer is not working').toBeGreaterThan(0.22);
  });

  it('DOES NOT SOLVE IT: the faithfuls must lose a fair share of seasons', () => {
    const faithfulWins = seasons.filter(s => s.winner === 'faithfuls').length / seasons.length;
    console.log(`faithful win rate: ${(faithfulWins * 100).toFixed(1)}%`);
    // The real format is Traitor-favoured. A castle that always finds them is
    // as broken as one that never does, and far less fun.
    expect(faithfulWins).toBeGreaterThan(0.10);
    expect(faithfulWins, 'the faithfuls are solving it every time').toBeLessThan(0.75);
  });

  it('SHARPENS: late banishments are better than early ones', () => {
    // The reveal cascade should make information density rise. Early rounds are
    // noise; late rounds should not be.
    const half = (pick) => {
      let hits = 0, total = 0;
      seasons.forEach(s => {
        const bans = s.log.filter(r => r.banished);
        pick(bans).forEach(r => { total++; if (r.wasTraitor) hits++; });
      });
      return { rate: total ? hits / total : 0, total };
    };
    const early = half(b => b.slice(0, Math.floor(b.length / 2)));
    const late  = half(b => b.slice(Math.floor(b.length / 2)));
    expect(early.total, 'no early banishments to measure').toBeGreaterThan(40);
    expect(late.total, 'no late banishments to measure').toBeGreaterThan(40);
    console.log(`early ${(early.rate * 100).toFixed(1)}% (n=${early.total})  late ${(late.rate * 100).toFixed(1)}% (n=${late.total})`);
    expect(late.rate, 'the room learns nothing as the season goes on').toBeGreaterThan(early.rate);
  });

  it('IS NOT UNANIMOUS: a round table disagrees with itself', () => {
    // A room that votes 20-0 every night is not deducing, it is following a
    // scalar. Real tables split.
    let splitRounds = 0, totalRounds = 0;
    seasons.forEach(s => (s.rounds || []).forEach(r => {
      const t = {};
      (r.ballots || []).forEach(b => { t[b.voted] = (t[b.voted] || 0) + 1; });
      const counts = Object.values(t);
      if (!counts.length) return;
      totalRounds++;
      if (counts.length > 1) splitRounds++;
    }));
    expect(totalRounds, 'no round tables to measure').toBeGreaterThan(100);
    const splitRate = splitRounds / totalRounds;
    console.log(`rounds with a split vote: ${(splitRate * 100).toFixed(1)}%`);
    expect(splitRate).toBeGreaterThan(0.6);
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
