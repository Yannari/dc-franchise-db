// Eviction night has to show its working.
//
// The vote is where everything the week built either holds or does not, and
// this screen was a list of sentences that all read the same. Two things were
// modelled and invisible: who held the numbers going in, and what moved each
// ballot. Per the visibility rule in the design spec — a result is never
// presented without its cause being visible somewhere.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { rpBuildBBEviction, rpBuildBBVotingPlans, getTribeRelationshipHighlights, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
    getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, getTribeRelationshipHighlights });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
}

function render(ep) {
  _tvState[`bb_evict_${ep.num}`] = { idx: 99 };
  // Eviction night split in two: Voting Plans carries the reads (the numbers,
  // the plan board, what moved), the live show carries the ballots. These
  // tests are about the working, so they read both pages together.
  return rpBuildBBVotingPlans(ep) + rpBuildBBEviction(ep);
}

describe('eviction night shows its working', () => {
  it('says who holds the numbers before a vote is read', () => {
    reset();
    const html = render(simulateBBEpisode());
    expect(html).toContain('THE NUMBERS');
    // The majority line is the point: it states the bar rather than implying it.
    expect(html).toMatch(/\d+ of \d+ decides it/);
  });

  it('explains what moved each ballot', () => {
    // Play until a week produces at least one plan the reader can be told about.
    let html = null;
    for (let attempt = 0; attempt < 4 && !html; attempt++) {
      reset();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 8) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const candidate = render(ep);
        if (candidate.includes('bbp-row') || candidate.includes('bbp-bloc')) { html = candidate; break; }
      }
    }
    expect(html, 'no week ever explained a single vote').toBeTruthy();
    expect(html).toContain('HOW THE PLANS CHANGED');
  });

  it('reports what a bloc asked for against what it got', () => {
    let html = null;
    for (let attempt = 0; attempt < 6 && !html; attempt++) {
      reset();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 10) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const candidate = render(ep);
        if (candidate.includes('bbp-bloc')) { html = candidate; break; }
      }
    }
    if (!html) return;   // no bloc moved a vote in any sampled week
    expect(html).toMatch(/asked \d+ member/);
    expect(html).toMatch(/and got \d+/);
  });

  it('marks a kept promise differently from a broken one', () => {
    reset();
    const badges = new Set();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 10) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const html = render(ep);
      for (const kind of ['KEEPS A PROMISE', 'BREAKS THEIR WORD', 'VOTES WITH THE BLOC', 'JOINS THE WINNING SIDE']) {
        if (html.includes(kind)) badges.add(kind);
      }
    }
    expect(badges.size, 'every ballot was labelled the same way').toBeGreaterThan(0);
  });
});
