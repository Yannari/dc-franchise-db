// No team goes back to where it was to talk (the user, 2026-10-22: "when they seen in the next phase of the challenge
// then in another they returned to a previous zone to have a conversation with another team i told we fixed that",
// "cause it looks like they teleporting"). At a staged challenge a team is seen at its stages in order; a scene with
// another team (a meeting, the box) never puts it back at a spot it has already left: the foot of the tower, the box,
// an earlier stage. Its own run can (a slip back down, a stage done again).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';
import { PLACES } from '../js/rr/places.js';

const back = [];
let checked = 0;
beforeAll(() => {
  for (const [n, seed] of [[12, 8], [10, 3], [12, 21]]) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    eps.forEach((_, i) => {
      const ep = episodeScreens(res, eps, i);
      const place = res.legs[i].place;
      // where each plate is in a staged challenge's order: its checkpoint first, then its stages
      const order = {};
      const orderOf = (stretch, side, f, reached = -1) => {
        const key = `${stretch}|${side || ''}`;
        if (!order[key]) {
          const st = PLACES[place]?.stretches.find(s => s.id === stretch);
          const ids = st?.stages?.map(x => x.id) || st?.sides?.find(x => x.id === side)?.stages?.map(x => x.id) || [];
          const sp = stretchPlates(place, stretch, side);
          const m = {};
          ids.forEach((id, j) => { const g = sp?.stages?.[id]; for (const p of [g?.plate, ...(g?.alt || [])]) { const pf = Array.isArray(p) ? p[0] : p?.f; if (pf) (m[pf] ||= []).push(j); } });
          order[key] = m;
        }
        // (a shot that is two stages, the vault the crown jewel challenge starts and ends in: the first not behind the
        // team; only when every one is behind has it gone back)
        const js = order[key][f];
        return js ? (js.find(j => j >= reached) ?? js.at(-1)) : null;
      };
      const reached = {};
      for (const s of ep.screens) {
        if (s.kind !== 'world' || !s.stretch || !s.plate?.f || s.replay) continue;
        for (const id of s.teams || []) {
          const k = `${id}|${s.stretch}`;
          const at = s.checkpoint ? -1 : orderOf(s.stretch, s.side, s.plate.f, reached[k] ?? -1);
          if (at == null) continue;
          const own = s.teams.length === 1 || (s.teams[0] === id && /^task-/.test(s.seg));
          if (!own && reached[k] != null) { checked++; if (at < reached[k]) back.push(`seed ${seed} ${s.id} ${s.seg} ${id} @${s.stretch}: back from ${reached[k]} to ${at}`); }
          reached[k] = Math.max(reached[k] ?? -2, at);
        }
      }
    });
  }
}, 900000);

describe('rr viewer: nobody teleports back', () => {
  it('never shows a team, in a scene with another team, back at a spot of the challenge it has already left', () => {
    expect(checked).toBeGreaterThan(30);
    expect(back).toEqual([]);
  });
});
