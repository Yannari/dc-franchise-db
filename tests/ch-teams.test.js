// The Challenge's Teams season (spec docs/superpowers/specs/2026-10-17-ch-teams-season-design.md): the rules that
// hold in every Teams season, whatever way the teams were made.
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';

function play(seed, teaming, extra = {}) {
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  return { names, teaming, ...playChallengeSeason({ cast: names, background, seed, options: { teams: { teaming, count: 2, end: 'breakup', ...extra } } }) };
}
// who was on which team as an episode began (Intel's snapshot)
const teamsAt = e => e.intel?.start?.teams || e.teams || e.intel?.end?.teams || null;
const teamOf = (e, n) => (teamsAt(e) || []).find(t => t.members.includes(n))?.name || null;

describe('a Teams season', () => {
  let seasons;
  beforeAll(() => {
    seasons = [];
    for (const teaming of ['shows', 'champions', 'vets', 'draft']) for (const seed of [3, 8]) seasons.push(play(seed, teaming));
    seasons.push(play(5, 'shows', { count: 'small' }));
    seasons.push(play(6, 'draft', { end: 'team-final' }));
  });

  it('every team picks its captain on camera, except in a draft, whose captains are the drafters', () => {
    // the user, 2026-10-18: "there's no dialogue for team captain, it just chooses without even announcing it"
    const outcomes = new Set();
    for (const s of seasons) {
      const scenes = s.state.scenes.filter(x => x.kind === 'team-captain');
      if (s.teaming === 'draft') { expect(scenes.length, 'a draft has no captain vote').toBe(0); continue; }
      const first = s.state.episodes[0]?.teams || [];
      expect(scenes.length, `${s.teaming}: one captain scene per team`).toBe(s.state.teamNames ? Object.keys(s.state.teamNames).length : first.length);
      for (const sc of scenes) {
        // the teams as they were made (the season's end has sent people home and switched others)
        const team = first.find(t => t.name === sc.data.team) || null;
        // the one the scene crowned is the team's captain as the season began, and is on that team
        expect(sc.data.captain).toBeTruthy();
        if (team) expect(team.members).toContain(sc.data.captain);
        // a race is voted out loud, everybody on the team (the user, 2026-10-18: "we don't even see the votes")
        if (sc.data.candidates.length > 1) expect(sc.data.ballots.length).toBe(sc.data.of);
        outcomes.add(sc.data.outcome);
      }
      // the announcement speaks before the vote, so its two voices are never the captains it is about to crown
      // (Sami and Julia spoke first, and both won: the user, 2026-10-18 "this still appears with a spoil of who wins")
      const rev = s.state.scenes.find(x => x.kind === 'teams-revealed');
      for (const v of rev.data.voices || []) expect(scenes.map(x => x.data.captain)).not.toContain(v);
      expect((rev.data.voices || []).length).toBe(2);
    }
    // more than one way it goes, across these seasons
    expect(outcomes.size, [...outcomes].join(', ')).toBeGreaterThan(1);
  });

  it('puts everybody on exactly one team', () => {
    for (const s of seasons) {
      const first = s.episodes[0].teams;
      expect(first.length).toBeGreaterThanOrEqual(2);
      const all = first.flatMap(t => t.members);
      expect(new Set(all).size).toBe(all.length);
      expect(all.length).toBe(24);
    }
  });

  it('the losing team votes, only its own members vote, and only for a teammate', () => {
    let teamVotes = 0;
    for (const s of seasons) for (const e of s.episodes) for (const v of e.votes.filter(x => x.team)) {
      teamVotes++;
      const t = (teamsAt(e) || []).find(x => x.name === v.team);
      // a switch can move somebody during the week: the members as the episode ended, plus those who started on it
      // (the premiere makes its teams after the week began: its own list, e.teams)
      const members = new Set([...(t?.members || []), ...((e.teams || []).find(x => x.name === v.team)?.members || []), ...((e.intel?.end?.teams || []).find(x => x.name === v.team)?.members || [])]);
      for (const b of v.ballots) { expect(members.has(b.voter), `${b.voter} voted for ${v.team}`).toBe(true); expect(members.has(b.target)).toBe(true); }
      // (the winners vote one of their own in only when nobody else is left to go: teams.js, a team final)
      if (!v.winners) expect(e.daily.winners).not.toContain(v.votedIn);
    }
    expect(teamVotes).toBeGreaterThan(20);
  });

  it('the call-out never reaches into the winning team unless nobody else could go', () => {
    let calls = 0;
    for (const s of seasons) for (const e of s.episodes) for (const c of e.callouts.filter(x => x.team)) {
      calls++;
      const winTeam = teamOf(e, e.daily.winners[0]);
      const oppTeam = teamOf(e, c.opponent);
      if (oppTeam === winTeam) {
        // the winners sent one of their own: then nobody of the division outside the winning team was left
        const div = e.division;
        const outside = (teamsAt(e) || []).filter(t => t.name !== winTeam).flatMap(t => t.members).filter(n => (div === 'all' || s.state.division[n] === div) && !e.votedIn.includes(n));
        expect(outside.filter(n => e.exits.every(x => x.name !== n)).length, `ep${e.ep} ${c.opponent}`).toBeLessThanOrEqual(e.votedIn.length);
      }
      expect(c.opponent).not.toBe(e.votedIn[0]);
    }
    expect(calls).toBeGreaterThan(20);
  });

  it('every week of a Teams season has its Arena', () => {
    for (const s of seasons) for (const e of s.episodes) if ((e.elims || 0) > 0 && !e.purged) expect(e.arena.length, `seed ${s.state.seed} ep${e.ep}`).toBeGreaterThan(0);
  });

  it('a switch moves the player, and only somebody their own team voted in switches', () => {
    let switches = 0;
    for (const s of seasons) for (const e of s.episodes) for (const sw of e.switches || []) {
      switches++;
      const v = e.votes.find(x => x.votedIn === sw.name);
      expect(v?.team).toBe(sw.from);
      expect(s.state.teamHistory.some(h => h.name === sw.name && h.how === 'switch' && h.ep === e.ep)).toBe(true);
    }
    expect(switches).toBeGreaterThan(0);
  });

  it('the teams break up before the final, and nobody has a team after it', () => {
    for (const s of seasons.filter(x => x.state.options.teams.end !== 'team-final')) {
      expect(s.state.teamsBroken).toBeTruthy();
      const after = s.episodes.filter(e => e.ep > s.state.teamsBroken.ep);
      for (const e of after) expect(e.votes.every(v => !v.team)).toBe(true);
    }
  });

  it('a team final crowns the whole best team, and they share first place', () => {
    const s = seasons.find(x => x.state.options.teams.end === 'team-final');
    expect(s.state.final.teamPodium.length).toBeGreaterThanOrEqual(1);
    const best = s.state.final.teamPodium[0];
    expect(s.champions.sort()).toEqual([...best.members].sort());
    for (const n of best.members) expect(s.placements[n]).toBe(1);
  });

  // the user, 2026-10-17: "reactions to the dailies, defeat, victory, strategy, who to blame, vote, alliance, per team"
  it('after every team daily both teams react, and the losers talk about a teammate', () => {
    let wins = 0, talks = 0, blocs = 0;
    for (const s of seasons) {
      const sc = s.state.scenes;
      for (const w of sc.filter(x => x.kind === 'team-daily-win')) {
        wins++;
        const loss = sc.find(x => x.kind === 'team-daily-loss' && x.ep === w.ep);
        expect(loss, `ep ${w.ep}: a winning team's scene with no losing team's`).toBeTruthy();
        expect(loss.data.team).not.toBe(w.data.team);
        expect(w.data.oppTeam).toBe(loss.data.team);
      }
      for (const t of sc.filter(x => x.kind === 'team-vote-talk')) {
        talks++;
        const e = s.episodes.find(x => x.ep === t.ep) || s.episodes[t.ep - 1];
        const team = (teamsAt(e) || []).find(x => x.name === t.data.team);
        // the group and the name they settle on are all on the team that lost
        for (const n of [...t.data.group, t.data.target]) expect(team?.members, `ep ${t.ep}: ${n} not on ${t.data.team}`).toContain(n);
        expect(t.data.group).not.toContain(t.data.target);
        // "the slowest out there" only when the name did come last of that team
        if (t.data.slowest) expect(sc.find(x => x.kind === 'team-daily-loss' && x.ep === t.ep).data.worst).toBe(t.data.target);
      }
      for (const b of sc.filter(x => x.kind === 'team-bloc')) {
        blocs++;
        const al = s.state.alliances.find(a => a.id === b.data.alliance);
        expect(al.team).toBe(b.data.team);
        const e = s.episodes.find(x => x.ep === b.ep) || s.episodes[b.ep - 1];
        const team = (teamsAt(e) || []).find(x => x.name === b.data.team);
        // founded inside one team (a member may switch later and take the bloc across with them)
        for (const m of b.who) expect(team.members, `ep ${b.ep}: ${m} not on ${b.data.team}`).toContain(m);
      }
    }
    expect(wins).toBeGreaterThan(20);
    expect(talks).toBeGreaterThan(20);
    expect(blocs).toBeGreaterThan(0);
  });

  it('an Arena winner their own team voted in either switches or stays, on camera', () => {
    let stays = 0, switches = 0;
    for (const s of seasons) for (const sc of s.state.scenes.filter(x => x.kind === 'team-stay' || x.kind === 'team-switch')) {
      sc.kind === 'team-stay' ? stays++ : switches++;
      expect(sc.data.from).not.toBe(sc.data.to);
      expect(sc.data.voted).toBeGreaterThan(0);
      // the stay is not a switch: the player is still on the team that voted them in at the end of that episode
      if (sc.kind === 'team-stay') {
        const e = s.episodes.find(x => x.ep === sc.ep) || s.episodes[sc.ep - 1];
        const end = e.intel?.end?.teams || e.teams;
        if (end?.length > 1) expect(end.find(t => t.members.includes(sc.who[0]))?.name).toBe(sc.data.from);
      }
    }
    expect(stays).toBeGreaterThan(0);
    expect(switches).toBeGreaterThan(0);
  });

  it('a solo season has no teams', () => {
    const { cast, names, background } = challengeCast(24, 3);
    setPlayers(cast);
    const s = playChallengeSeason({ cast: names, background, seed: 3 });
    expect(s.state.teams).toBeUndefined();
  });
});
