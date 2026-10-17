// ch-teams-run.test.js — a Teams season is REACHABLE from the run tab: the setup's options reach the engine, a season
// plays one episode per press to the final, the rows carry the teams, and the export and ledger say who was on which.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig } from '../js/core.js';
import { simulateChallengeEpisode, challengeCastProblem, challengeOptions, challengeVoteShape } from '../js/ch-run.js';
import { chPlacements, chTwistsPlayed } from '../js/ch/export.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { challengeCast } from './helpers/ch-cast.js';

function freshTeams(n = 20, extra = {}) {
  Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6, chGenderBlind: false,
    twistSchedule: [], name: null, chMode: 'teams', chTeaming: 'draft', chTeamCount: '2', chTeamEnd: 'breakup', ...extra });
  setPlayers(challengeCast(n, 4).cast);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 717 }, seasonNumber: 1 });
  setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
}
const playAll = () => { const out = []; for (let i = 0; i < 40; i++) { const r = simulateChallengeEpisode(); if (!r) break; out.push(r); } return out; };

describe('a Teams season from the run tab', () => {
  it('the setup reaches the engine as options.teams, with no partner weeks', () => {
    freshTeams(20, { chTeaming: 'vets', chTeamEnd: 'team-final' });
    expect(challengeOptions()).toMatchObject({ teams: { teaming: 'vets', count: 2, end: 'team-final' } });
    Object.assign(seasonConfig, { chMode: 'solo' });
    expect(challengeOptions().teams).toBe(null);
  });

  it('plays one press at a time; the rows name the teams, the voting team and the break-up', () => {
    freshTeams(20);
    expect(challengeCastProblem()).toBe(null);
    const rows = playAll();
    expect(rows.length).toBeGreaterThan(3);
    const weeks = rows.slice(0, -1);
    expect(weeks[0].ch.teams.start.length).toBe(2);
    expect(weeks.some(r => r.ch.teamsBroken)).toBe(true);
    const teamVoted = weeks.filter(r => r.ch.votes.some(v => v.team));
    expect(teamVoted.length).toBeGreaterThan(2);
    for (const r of teamVoted) if (r.ch.arena?.length) expect(challengeVoteShape(r)).toMatch(/ voted · .* beat /);
    expect(gs.phase).toBe('complete');
    // the export: every player's team, and the season's twist line
    const places = chPlacements(rows, gs.ch?.record || null);
    expect(places.filter(p => p.team).length).toBe(20);
    expect(chTwistsPlayed(rows, challengeOptions()).some(t => t.type === 'ch-teams')).toBe(true);
  });

  it('a team final crowns a whole team, and the hub line names it', () => {
    freshTeams(20, { chTeamEnd: 'team-final' });
    const rows = playAll();
    const final = rows.at(-1).ch.final;
    expect(final.teamPodium.length).toBeGreaterThanOrEqual(1);
    expect([...final.champions].sort()).toEqual([...final.teamPodium[0].members].sort());
    expect(challengeVoteShape(rows.at(-1))).toMatch(new RegExp(`^Champions: ${final.teamPodium[0].name} \\(`));
  });
});
