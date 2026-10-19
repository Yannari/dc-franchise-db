// A custom identity has lines of its own (the user, 2026-10-19: "how do u build the custom identities dialogue" →
// "both"): lines written around its name, for any name (the premiere, Don at the mat, trash talk), and lines the user
// writes for a team (its introduction, what it says when it's good at something, struggling, winning, going home).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { identityLine } from '../js/rr/script/identity.js';
import { raceCast } from './helpers/rr-cast.js';

const OWN = { introA: 'We met at a pie-eating contest. Neither of us won.', introB: 'We both threw up. It was beautiful.',
  win: 'Pie for everyone!', good: 'Finally, something with crust.', struggle: 'This is not pie. Why is nothing pie?', elim: 'At least there will be pie at home.' };

describe('rr custom identity lines', () => {
  let res, eps, ct, ot;
  beforeAll(() => {
    const { cast, teams } = raceCast(10, 21);
    // a custom identity, and a team with lines of its own
    Object.assign(teams[0], { identity: null, name: 'Stunt Doubles', custom: { name: 'Stunt Doubles', mix: ['wrestlers'], voice: 'wrestlers', strength: 'wrestlers' } });
    Object.assign(teams[1], { lines: OWN });
    ct = teams[0].id; ot = teams[1].id;
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 21 });
    eps = airSeason(res);
  });

  const intro = id => eps[0].segments.find(s => s.kind === 'team-intro' && s.teams[0] === id);

  it('a custom team is introduced by its own name, in a line written for any name', () => {
    const s = intro(ct);
    expect(s.lineId).toMatch(/^ci\./);
    expect(s.lines.map(l => l.text).join(' ')).toContain('Stunt Doubles');
    expect(s.lines.some(l => l.kind === 'conf')).toBe(true);
  });

  it("a team's own introduction is the one that airs: Don's label, then each of them, to camera", () => {
    const s = intro(ot);
    const t = res.state.teams[ot];
    expect(s.lineId).toBe('ci.own');
    const confs = s.lines.filter(l => l.kind === 'conf');
    expect(confs.find(l => l.by === t.a)?.text).toBe(OWN.introA);
    expect(confs.find(l => l.by === t.b)?.text).toBe(OWN.introB);
    expect(s.lines[0].by).toBe('Don');
  });

  it("a team's own line for a moment is said before the kit's", () => {
    const st = { teams: { x: { id: 'x', a: 'P', b: 'Q', identity: 'wrestlers', lines: { win: ['Pie for everyone!'] } } } };
    expect(identityLine(st, 'P', 'win', () => 0.99)).toBe('Pie for everyone!');
    expect(identityLine(st, 'P', 'win', () => 0.99)).not.toBe('Pie for everyone!');
  });

  it('the Casting Room writes them: rrLine* on the cards become the team\'s lines', async () => {
    const { raceSetTeam, raceTeams } = await import('../js/rr-run.js');
    const { setPlayers: set } = await import('../js/core.js');
    const { cast } = raceCast(6, 3);
    set(cast.map((p, i) => ({ ...p, chPartner: cast[i % 2 ? i - 1 : i + 1].name })));
    const t0 = raceTeams()[0];
    // an introduction line is that person's, on their own card: it can't land on the wrong one of the two
    expect(raceSetTeam(t0.a, t0.b, 'rrLineIntro', OWN.introA)).toBe(true);
    raceSetTeam(t0.b, t0.a, 'rrLineIntro', OWN.introB);
    raceSetTeam(t0.a, t0.b, 'rrLineWin', 'Pie {for} everyone!');
    const t = raceTeams()[0];
    expect(t.lines.introA).toBe(OWN.introA);
    expect(t.lines.introB).toBe(OWN.introB);
    // braces would read as slots: a typed line is said as typed
    expect(t.lines.win).toEqual(['Pie for everyone!']);
  });
});
