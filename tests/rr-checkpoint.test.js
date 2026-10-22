// Every challenge is a checkpoint (the user, 2026-10-21: "shouldnt we have like we all the either/or for all challenge a
// moment they pick that blue paper read it and choose", "the don box are here for a reason its a checkpoint use them",
// "make sure each checkpoint is used correctly from a don box or a local/guide that suppose to give that paper").
// Each team reaching a challenge takes its clue there and reads it, and at an Either/Or decides there; the episode shows
// it taking the clue before it shows it at the challenge: the teams followed there and the first one in their own
// moment, the rest in a quick shot together (the user's choice).
import { describe, it, expect, beforeAll } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const TASKS = new Set(['either', 'botch', 'allin', 'task', 'route', 'superteam']);
const seasons = [];
beforeAll(() => {
  for (const [n, seed] of [[12, 8], [8, 3], [10, 21]]) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    seasons.push({ seed, res, aired: airSeason(res) });
  }
}, 600000);

const firstVisits = (st, leg) => {
  const seen = new Set(), out = [];
  for (const r of [...(st.taskLog || [])].filter(r => r.leg === leg.n).sort((x, y) => x.from - y.from)) {
    const kind = PLACES[leg.place]?.stretches.find(s => s.id === r.stretch)?.kind;
    if (!TASKS.has(kind) || seen.has(`${r.team}|${r.stretch}`)) continue;
    seen.add(`${r.team}|${r.stretch}`);
    out.push({ ...r, kind });
  }
  return out;
};

describe('rr: every challenge is a checkpoint', () => {
  it('has every team take its clue there as it arrives, once', () => {
    let n = 0;
    for (const { seed, res } of seasons) for (const leg of res.legs) {
      if (leg.kind === 'final') continue;
      const clues = res.state.scenes.filter(s => s.leg === leg.n && s.kind === 'clue');
      for (const r of firstVisits(res.state, leg)) {
        const mine = clues.filter(s => s.data.team === r.team && s.data.stretch === r.stretch);
        expect(mine.length, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}`).toBe(1);
        expect(mine[0].data.t, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}: at its arrival`).toBeLessThanOrEqual(r.from + 0.5);
        n++;
      }
    }
    expect(n).toBeGreaterThan(200);
  });

  it('has a team decide its side of an Either/Or at the box, once', () => {
    for (const { seed, res } of seasons) for (const leg of res.legs) {
      for (const r of firstVisits(res.state, leg).filter(r => r.kind === 'either')) {
        const d = res.state.scenes.filter(s => s.leg === leg.n && s.kind === 'decide-side' && s.data.team === r.team && s.data.stretch === r.stretch);
        expect(d.length, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}`).toBe(1);
      }
    }
  });

  it('shows each team taking its clue before it shows it at the challenge', () => {
    let full = 0, quick = 0;
    for (const { seed, res, aired } of seasons) res.legs.forEach((leg, i) => {
      if (leg.kind === 'final') return;
      const segs = aired[i].segments;
      for (const r of firstVisits(res.state, leg)) {
        const at = segs.findIndex(s => s.stretch === r.stretch && s.teams.includes(r.team) && /^(task-|attempt-fail|watching)/.test(s.kind));
        const clue = segs.findIndex(s => ['clue', 'clue-montage'].includes(s.kind) && s.stretch === r.stretch && s.teams.includes(r.team));
        if (at < 0 && clue < 0) continue;   // (a team Don reached on the road before it got there)
        expect(clue, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}: seen taking its clue`).toBeGreaterThan(-1);
        if (at >= 0) expect(clue, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}: the clue first`).toBeLessThan(at);
        if (segs[clue].kind === 'clue') full++; else quick++;
      }
    });
    expect(full).toBeGreaterThan(20);
    expect(quick).toBeGreaterThan(20);
  });
});
