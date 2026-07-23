// @vitest-environment jsdom
// Task 9 — franchise-meta integration + balance verification. Runs COMPLETE
// seasons headlessly through the shared harness (which mirrors main.js's
// window-exposure), records a ledger from a finished finale, then verifies a
// second season built from returnees receives meta effects and still completes.
import { describe, it, expect } from 'vitest';
import { makeCast, runOneSeason, core } from './helpers/season-harness.js';
import { setFranchiseLedger, activeSeasons, buildFranchiseMeta } from '../js/franchise-meta.js';

describe('franchise meta end-to-end', () => {
  it('season 1 records a ledger; season 2 with returnees gets meta effects; sim completes', () => {
    setFranchiseLedger({ seasons: {} });

    // Season 1 — fresh cast, seasonNumber set so the finale hook records.
    runOneSeason({ seasonNumber: 21, franchiseMeta: true }, 14);
    expect(activeSeasons()['21']).toBeTruthy();
    const s1players = Object.keys(activeSeasons()['21'].players);
    expect(s1players.length).toBe(14);
    const s1winner = Object.entries(activeSeasons()['21'].players).find(([, r]) => r.winner);
    expect(s1winner).toBeTruthy();

    // Season 2 — half the cast returns, tagged as returnees with names present
    // in the ledger so buildFranchiseMeta can attach profiles.
    const cast2 = makeCast(14);
    const returningNames = s1players.slice(0, 7);
    for (let i = 0; i < 7; i++) { cast2[i].name = returningNames[i]; cast2[i].isReturnee = true; }

    const meta = buildFranchiseMeta(cast2, { franchiseMeta: true });
    expect(meta).toBeTruthy();
    expect(Object.keys(meta.profiles).length).toBeGreaterThan(0);

    // Run season 2 with the returnee cast — must not crash with meta active.
    runOneSeason({ seasonNumber: 22, franchiseMeta: true }, 14, cast2);
    expect(core.gs.franchiseMeta).toBeTruthy();
    expect(Object.keys(core.gs.franchiseMeta.profiles).length).toBeGreaterThan(0);
    expect(core.gs.phase).toBe('complete');
    expect(activeSeasons()['22']).toBeTruthy();
  }, 120000);

  it('meta effects shift, never dominate: returnees are not auto-booted or auto-winners over 6 seasons', () => {
    // Balance smoke: pre-seed a decorated returnee, run several seasons, check
    // they neither always go first nor always win. Each iteration re-seeds the
    // ledger to the SAME single-season history so a real (non-zero) dummy
    // seasonNumber can be used — recording fires but next iteration's reseed
    // wipes it, giving identical inputs every run with zero cross-iteration
    // pollution and no "Season number not set" console noise.
    const seedLedger = () => setFranchiseLedger({ seasons: { '30': { seasonName: 'S30', players: {
      'MetaVet': { placement: 1, winner: true, finalist: true, episodesLasted: 16, blindsided: false,
        blindsidedBy: [], blindsidesAuthored: 3, idolsFound: 2, idolsPlayed: 2, idoledOut: false,
        betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 5, schemesCaught: 0 }
    } } } });
    let firstBoots = 0, wins = 0;
    const N = 6;
    for (let s = 0; s < N; s++) {
      seedLedger();
      const cast = makeCast(12);
      cast[0].name = 'MetaVet'; cast[0].isReturnee = true;
      runOneSeason({ seasonNumber: 900 + s, franchiseMeta: true }, 12, cast);
      const firstBoot = core.gs.episodeHistory.map(ep => ep.eliminated).find(Boolean);
      if (firstBoot === 'MetaVet') firstBoots++;
      if (core.gs.finaleResult?.winner === 'MetaVet') wins++;
    }
    expect(firstBoots).toBeLessThan(N); // elevated threat, but not a scripted first boot
    expect(wins).toBeLessThan(N);
  }, 600000);
});
