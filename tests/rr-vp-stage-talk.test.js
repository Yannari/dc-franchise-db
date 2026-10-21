// A moment at a challenge in stages is shot where the team is at that minute (the user, 2026-10-21, on Home City:
// "theyre in an elevator tug to what fall from where?", "theyre not even in the staircase nor climbing it"): a team
// frozen on the deck rail is on the deck, a team starting the stairs is in the stairwell, not in the hallway by the
// elevator or the glass room at the top.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { stretchPlates, standable } from '../js/vp-rr-ep/plates.js';

const shots = [];
beforeAll(() => {
  for (const seed of [8, 21, 34]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'fire-mountain-isle', 3: 'tomb-sands' } } });
    const aired = airSeason(res);
    for (let i = 0; i < 3; i++) for (const s of episodeScreens(res, aired, i).screens) shots.push({ res, leg: res.legs[i], s });
  }
}, 600000);

// the stage a team is at, at minute t, from its run (the first stage still ahead of it)
const stageAt = (row, t) => row?.stages?.find(x => x.t >= t - 0.5)?.id ?? null;

describe('rr viewer: a moment at a staged challenge, where the team is', () => {
  it('shoots a team\'s own moment at a staged challenge on the plate of the stage it is at', () => {
    const bad = [];
    let n = 0;
    for (const { res, leg, s } of shots) {
      if (s.kind !== 'world' || s.mode !== 'talk' || s.seg === 'task-stage' || s.seg === 'don-demo' || !s.teams?.length || s.teams.length > 2 || s.split) continue;   // (a meeting before the split: rr-either-meet)
      const row = (res.state.taskLog || []).filter(r => r.leg === leg.n && r.team === s.teams[0] && r.stretch === s.stretch)
        .find(r => r.from <= s.t + 0.5 && s.t <= r.to + 0.5);
      const stage = stageAt(row, s.t);
      if (!stage) continue;
      const sg = stretchPlates(s.place, s.stretch, s.side)?.stages?.[stage];
      const want = [sg?.plate, ...(sg?.alt || [])].filter(p => p && standable(p)).map(p => p.f);
      if (!want.length) continue;
      n++;
      if (!want.includes(s.plate.f)) bad.push(`${leg.place} ${s.stretch}:${s.side || ''} ${s.seg} at ${stage}: ${s.plate.f}, not ${want.join('/')}`);
    }
    expect(n).toBeGreaterThan(20);
    expect(bad.slice(0, 12)).toEqual([]);
  });
});
