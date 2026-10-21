// The season opens on Don, standing at the start (the user, 2026-10-21, on the first shot of leg one: "why is don
// avatar just not here in this shot"): his welcome ("I'm your host, Don") was played as a voice-over across an empty
// close-up of the station. He says who he is, so he is there to see, at the start line, with the camera on him.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { PLACE_PLATES } from '../js/vp-rr-ep/plates.js';

const welcomes = [];
beforeAll(() => {
  for (const seed of [8, 21, 34]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const aired = airSeason(res);
    const screens = episodeScreens(res, aired, 0).screens;
    welcomes.push({ seed, place: res.legs[0].place, screens: screens.filter(s => s.seg === 'don-narrate' && s.ending === 'welcome') });
  }
}, 600000);

describe('rr viewer: the season opens on Don', () => {
  it('shows Don standing at the start line for his welcome', () => {
    for (const { seed, place, screens } of welcomes) {
      expect(screens.length, `seed ${seed}`).toBe(1);
      const s = screens[0];
      expect(s.don, `seed ${seed}: Don in the shot`).toBe(true);
      expect(s.donStand, `seed ${seed}: somewhere to stand`).toBeTruthy();
      expect(s.plate.f, `seed ${seed}: at the start`).toBe(PLACE_PLATES[place].opener.f);
    }
  });
});
