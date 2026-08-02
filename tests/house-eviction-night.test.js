// Eviction night has to show its working.
//
// The vote is where everything the week built either holds or does not. The
// first pass at this was ballot analysis — reads and results, nobody asking
// anybody for anything. The Voting Plans screen now renders the vote as an
// OPERATION: the alliance meetings, every member's answer, the named
// recruitment approaches (including the yes that was a lie), the ballots no
// room owns, and only then the count. Eviction night replays each ballot's
// four-stage chain — wanted, asked, said, cast. Per the visibility rule in
// the design spec: a result is never presented without its cause.
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
  // Voting Plans carries the operation, the live show carries the ballots.
  // These tests are about the working, so they read both pages together.
  return rpBuildBBVotingPlans(ep) + rpBuildBBEviction(ep);
}

describe('eviction night shows its working', () => {
  it('shows the count and the bar before a vote is read', () => {
    reset();
    const html = render(simulateBBEpisode());
    expect(html).toContain('CURRENT HOUSE READ');
    // The majority line is the point: it states the bar rather than implying it.
    expect(html).toMatch(/\d+ of \d+ decides it/);
  });

  it('renders an alliance plan as a meeting, not a mutation', () => {
    // Play until a week produces at least one plan with recorded stances.
    let ep = null;
    for (let attempt = 0; attempt < 4 && !ep; attempt++) {
      reset();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 8) {
        const candidate = simulateBBEpisode();
        if (!candidate) break;
        if ((candidate.voteOperation?.plans || []).some(p => p.stances.length)) { ep = candidate; break; }
      }
    }
    expect(ep, 'no week ever held an alliance meeting').toBeTruthy();
    const html = render(ep);
    expect(html).toContain('ALLIANCE PLANS');
    // The organiser speaks; the target is named; the members answer.
    expect(html).toContain('gathers the room');
    const plan = ep.voteOperation.plans.find(p => p.stances.length);
    expect(html).toContain(plan.organizer);
    expect(html).toContain(plan.target);
  });

  it('records every member response, not only the moved ballots', () => {
    // The old bloc pass logged CHANGED ballots only. The operation must hold a
    // stance for each owned member — including the ones who were already
    // there and the ones who refused.
    reset();
    const stances = new Set();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 10) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      for (const plan of ep.voteOperation?.plans || []) {
        for (const s of plan.stances) stances.add(s.stance);
        // The count going in is committed votes, never raw membership — and a
        // plan already over the line with outside support never calls itself
        // short.
        expect(plan.committed).toBeLessThanOrEqual(plan.members.length);
        expect(plan.needed).toBe(Math.max(0, plan.majority - plan.committed - plan.outsideSupport.length));
      }
    }
    expect(stances.size, 'plans never recorded a member answer').toBeGreaterThan(0);
    // Unmoved members must be recorded too — dependable/leaning are answers.
    expect([...stances].some(s => s === 'dependable' || s === 'leaning'),
      'only moved ballots were recorded').toBe(true);
  });

  it('shows recruitment by name with an argument and an outcome', () => {
    let ep = null;
    for (let attempt = 0; attempt < 6 && !ep; attempt++) {
      reset();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 10) {
        const candidate = simulateBBEpisode();
        if (!candidate) break;
        if ((candidate.voteOperation?.plans || []).some(p => p.approaches.length)) { ep = candidate; break; }
      }
    }
    if (!ep) return;   // no plan went recruiting in any sampled week
    const html = render(ep);
    expect(html).toContain('VOTES THEY STILL NEED');
    const approach = ep.voteOperation.plans.flatMap(p => p.approaches)[0];
    expect(html).toContain(`${approach.recruiter} works ${approach.voter}`);
    expect(['agrees', 'refuses', 'undecided', 'lies']).toContain(approach.outcome);
  });

  it('a liar tells the house one name and casts another', () => {
    // The one outcome the audience knows and the house does not: stated must
    // carry the lie, the ballot must carry the truth.
    let liar = null;
    for (let attempt = 0; attempt < 8 && !liar; attempt++) {
      reset();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 10) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const act = (ep.acts || []).find(a => a.type === 'eviction');
        const found = (act?.ballots || []).find(b => b.lied && b.stated !== b.evict);
        if (found) { liar = { ep, ballot: found }; break; }
      }
    }
    if (!liar) return;   // nobody lied in any sampled week — rare but legal
    expect(liar.ballot.stated).toBe(liar.ballot.lied);
    const html = render(liar.ep);
    expect(html).toContain('SAYS YES, MEANS NO');
  });

  it('replays each ballot as a chain from preference to cast', () => {
    reset();
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'eviction');
    for (const b of act?.ballots || []) {
      expect(b.preference, `${b.voter} has no starting position`).toBeTruthy();
      expect(b.stated, `${b.voter} has no stated position`).toBeTruthy();
    }
    const html = render(ep);
    expect(html).toContain('bbev-chain');
  });

  it('marks a kept promise differently from a broken one', () => {
    reset();
    const badges = new Set();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 10) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const html = render(ep);
      for (const kind of ['KEEPS A PROMISE', 'BREAKS THEIR WORD', 'VOTES WITH THE BLOC',
        'JOINS THE WINNING SIDE', 'SAID ONE NAME, WRITES ANOTHER']) {
        if (html.includes(kind)) badges.add(kind);
      }
    }
    expect(badges.size, 'every ballot was labelled the same way').toBeGreaterThan(0);
  });

  it('takes the forecast after the coordination it forecasts', () => {
    // The blindside verdict is only honest if `truth` is the final count.
    reset();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 10) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const act = (ep.acts || []).find(a => a.type === 'eviction');
      if (!act) continue;
      for (const plan of ep.votePlans || []) {
        const actual = (act.ballots || []).filter(b => b.evict === plan.target).length;
        expect(plan.truth, `${plan.voter}'s verdict judged against a stale count`).toBe(actual);
      }
    }
  });
});
