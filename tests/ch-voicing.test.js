// The Challenge's episode voicing (js/vp-ch-ep/voicing.js). The user, 2026-11-01: "make the automatic voicing of
// the episode available for the challenge like big brother with a button". A clip is found by its speaker and its
// words, so the lines voiced must be the viewer's own lines word for word, every speaker the viewer shows (a
// player, a confessional, TJ), and TJ must find his voice under either of his names.
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens } from '../js/vp-ch-ep/steps.js';
import { chEpisodeLines, spokenOf, resolveVoices, lineId, chVoiceLine, chVoiceSeason } from '../js/vp-ch-ep/voicing.js';
import { challengeCast } from './helpers/ch-cast.js';

let rows;
beforeAll(() => {
  const { cast, names, background } = challengeCast(24, 9);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed: 9 });
  airSeason(r.state);
  rows = challengeRows(r);
  window.gs = { episodeHistory: rows };
  window.seasonConfig = { format: 'the-challenge', seasonNumber: 3 };
});

describe('voicing a Challenge episode', () => {
  it('voices exactly the lines the viewer says, once each, players, confessionals and TJ', () => {
    for (const row of rows.slice(0, 4)) {
      const lines = chEpisodeLines(row);
      const onScreen = chStepScreens(row, { history: rows, season: 3 }).flatMap(s => s.steps).map(spokenOf).filter(l => l && l.text);
      const ids = new Set(onScreen.map(l => lineId(l.by, l.text)));
      expect(lines.length).toBeGreaterThan(20);
      expect(new Set(lines.map(l => l.id)).size).toBe(lines.length);
      expect(new Set(lines.map(l => l.id))).toEqual(ids);
      expect(lines.some(l => l.by === 'TJ')).toBe(true);
      expect(lines.some(l => l.by !== 'TJ')).toBe(true);
      for (const l of lines) expect(l.text).not.toMatch(/\{[a-z]+\}|undefined/);
    }
  });

  it('finds TJ by either name, and a player by the forgiving match', () => {
    expect(resolveVoices(['TJ'], { 'TJ Maxx': 'ws__tj' })).toEqual({ TJ: 'ws__tj' });
    expect(resolveVoices(['TJ'], { tj: 'ws__tj2' })).toEqual({ TJ: 'ws__tj2' });
    expect(resolveVoices(['Lt. Sarge', 'Nobody'], { 'Lt-Sarge': 'ws__s' })).toEqual({ 'Lt. Sarge': 'ws__s' });
  });

  it('keeps its own folder, and plays nothing for a line with no clip', () => {
    expect(chVoiceSeason()).toBe('ch-3');
    expect(chVoiceLine(1, { tj: 'Go!' })).toBe(false);
    expect(chVoiceLine(1, { dir: 'They run.' })).toBe(false);
  });
});
