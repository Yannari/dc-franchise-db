// A team that is only talked about isn't on screen (the user, 2026-10-22: "when someone reference someone else the
// icons of these people appear even when theyre not suppose to be here"). A confessional about the Mechanics, a bleacher
// grudge, Don naming who threw the Boomerang: the team named is in the words, not in the shot. Read across seasons: every
// team a segment puts on screen speaks in it or is one of the people in it.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const absent = [];
let read = 0;
beforeAll(() => {
  for (const seed of [3, 8, 21]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const st = res.state;
    const teamOf = n => Object.keys(st.teams).find(id => [st.teams[id].a, st.teams[id].b, ...(st.teams[id].members || [])].includes(n));
    airSeason(res).forEach((ep, i) => {
      for (const sg of ep.segments) {
        if (!sg.teams?.length) continue;
        read++;
        const there = new Set([...(sg.lines || []).map(l => l.by), ...(sg.who || [])].filter(Boolean).map(teamOf).filter(Boolean));
        for (const id of sg.teams) if (!there.has(id)) absent.push(`seed ${seed} leg ${i + 1} ${sg.kind}: ${id} on screen, ${[...there].join('/')} in it`);
      }
    });
  }
}, 600000);

describe('rr: a team only talked about is not on screen', () => {
  it('puts on screen only the teams in the scene', () => {
    expect(read).toBeGreaterThan(300);
    expect(absent.slice(0, 12)).toEqual([]);
  });
});
