// A team that switches sides at an Either/Or is seen doing it (the user, 2026-10-22: "maybe they got out after seeing the
// stairs or the line for the elevator but u have to show this", "cause it looks like they teleporting"). A team followed
// through its stages was only ever shown on the side it ended on, after deciding the other one at the box.
import { it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

it('airs every switch of side, before the team is seen on its new side', () => {
  let sw = 0;
  for (const seed of [8, 3, 21, 44, 5]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    res.legs.forEach((leg, i) => {
      for (const r of (res.state.taskLog || []).filter(r => r.leg === leg.n && r.switched)) {
        sw++;
        const segs = eps[i].segments;
        const at = segs.findIndex(s => s.teams.includes(r.team) && s.stretch === r.stretch && s.kind === 'task-try' && s.ending === 'switched');
        expect(at, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}`).toBeGreaterThan(-1);
        const after = segs.findIndex(s => s.teams[0] === r.team && s.stretch === r.stretch && s.kind === 'task-stage');
        if (after >= 0) expect(at, `seed ${seed} leg ${leg.n} ${r.team}@${r.stretch}: the switch first`).toBeLessThan(after);
      }
    });
  }
  expect(sw).toBeGreaterThan(3);
}, 900000);
