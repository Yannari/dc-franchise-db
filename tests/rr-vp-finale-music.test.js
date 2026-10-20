// After the winners are crowned the finale anthem plays on: a proposal on the winners' mat is not a Chill Zone check-in.
// Found 2026-10-20 (seed 41): the crown, then the winning couple's proposal on the mat, switched to the Chill Zone's
// music and back again for the winners' card.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { soundAt } from '../js/vp-rr-ep/sound.js';

describe('rr viewer: the finale after the crown', () => {
  it('keeps the finale anthem on the mat once the winners are crowned', () => {
    const { cast, teams } = raceCast(12, 41);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 41 });
    const eps = airSeason(res);
    const ep = episodeScreens(res, eps, eps.length - 1);
    const crown = ep.screens.findIndex(s => s.seg === 'don-crown');
    expect(crown).toBeGreaterThan(0);
    const after = ep.screens.map((s, si) => ({ s, si })).filter(({ s, si }) => si > crown && s.mode === 'mat');
    expect(after.length, 'a scene on the mat after the crown (the proposal)').toBeGreaterThan(0);
    for (const { s, si } of after) expect(soundAt(ep, si, 0).moment, `${s.seg}`).toEqual({ race: 'finale' });
    // ...and the finale's mat is the finish line, not a Chill Zone
    expect(ep.screens[crown].hud?.task).toBe('THE FINISH LINE');
  }, 240000);
});
