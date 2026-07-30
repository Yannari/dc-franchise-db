// The Big Brother visual player.
//
// Built on the shared Total Drama VP kit — rp-page, rpPortrait, the badge-pill
// scene card and _tvState click-to-reveal — rather than a private stylesheet,
// so a houseguest looks like a camper. These cover the two things that were
// actually wrong with it: it was unreachable, and it displayed almost none of
// what the engine produces.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { buildVPScreens, buildBBWeekScreens, _tvState } from '../js/vp-screens.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  // vp-screens.js reads gs, players and seasonConfig as bare globals, which
  // main.js puts on window at boot. A test has to provide the same environment
  // or every portrait throws before it can draw.
  globalThis.gs = gs;
  globalThis.players = players;
  globalThis.seasonConfig = seasonConfig;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.format = 'big-brother';
  seasonConfig.finaleSize = 3;
  seasonConfig.romance = 'enabled';
  // Reveal state is module-level and would leak between tests, so a screen
  // opened by one case would look already-revealed to the next.
  Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { delete _tvState[k]; });
}

const week = () => { reset(); return simulateBBEpisode(); };

// Scenes are hidden until revealed, which is the point of the player. Build
// once to create the reveal keys, open them all, then build again.
function revealed(ep) {
  buildBBWeekScreens(ep);
  Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = 99; });
  return buildBBWeekScreens(ep);
}

describe('the Big Brother visual player', () => {
  beforeEach(reset);

  // It shipped unreachable: nothing imported its builders, so every Big
  // Brother week replayed as nothing at all.
  it('is what buildVPScreens returns for a Big Brother week', () => {
    const ep = week();
    const screens = buildVPScreens(gs.episodeHistory[0]);
    expect(screens.length).toBeGreaterThan(8);
    expect(screens.every(s => s.html && s.label)).toBe(true);
    expect(screens.some(s => s.id === 'bb-error')).toBe(false);
    expect(ep.format).toBe('big-brother');
  });

  it('runs the episode in the order the show does', () => {
    const screens = buildBBWeekScreens(week());
    const ids = screens.map(s => s.id);
    // Cold open, then life and ceremony alternating, ending on the eviction.
    expect(ids[0]).toBe('bb-cold');
    expect(ids.at(-1)).toBe('bb-evict');
    const spine = ids.filter(id => !id.startsWith('bb-camp') && !id.startsWith('bb-life-c'));
    expect(spine).toEqual([
      'bb-cold', 'bb-life-1', 'bb-hoh', 'bb-life-2', 'bb-noms',
      'bb-life-3', 'bb-veto', 'bb-life-4', 'bb-cer', 'bb-evict',
    ]);
  });

  it('opens on the whole house arriving in week one', () => {
    const html = buildBBWeekScreens(week())[0].html;
    expect(html).toContain('MOVE-IN DAY');
    // Every houseguest is shown, through the shared portrait helper.
    for (const p of CAST) expect(html).toContain(p.name);
    expect(html).toContain('rp-portrait');
  });

  it('shows the competition by name, not just its winner', () => {
    const ep = week();
    const comps = (ep.acts || []).map(a => a.competition).filter(Boolean);
    const html = revealed(ep).map(s => s.html).join('');
    expect(comps.length).toBeGreaterThan(0);
    for (const comp of comps) {
      expect(html).toContain(comp.name);
      // and what happened in it, not only the result
      expect(comp.beats.some(b => html.includes(b.text.slice(0, 30)))).toBe(true);
    }
  });

  it('gives house life its own screens', () => {
    const ep = week();
    const screens = revealed(ep);
    const lifeScreens = screens.filter(s => s.id.startsWith('bb-life'));
    expect(lifeScreens.length).toBeGreaterThanOrEqual(4);
    const beats = (ep.acts || []).flatMap(a => a.socialBeats || []);
    const lifeHtml = lifeScreens.map(s => s.html).join('');
    expect(beats.length).toBeGreaterThan(0);
    // The events the engine generated actually appear somewhere in the player.
    const all = screens.map(s => s.html).join('');
    const shown = beats.filter(b => all.includes(b.text.slice(0, 30))).length;
    expect(shown / beats.length).toBeGreaterThan(0.8);
    expect(lifeHtml).toContain('LIFE IN THE HOUSE');
  });

  it('uses the shared visual player kit rather than a private one', () => {
    const html = buildBBWeekScreens(week()).map(s => s.html).join('');
    expect(html).toContain('rp-page');
    expect(html).toContain('rp-portrait');
    expect(html).toContain('rp-eyebrow');
    expect(html).not.toContain('bbvp-');
  });

  it('hides what has not been revealed yet', () => {
    const html = buildBBWeekScreens(week()).map(s => s.html).join('');
    // Unrevealed scenes render as dimmed placeholders, as in Total Drama.
    expect(html).toContain('opacity:0.12');
    expect(html).toContain('Reveal next');
  });

  it('replays every week of a finished season without error', () => {
    reset();
    let guard = 0;
    while (gs.activePlayers.length > 3 && guard++ < 30) simulateBBEpisode();
    expect(gs.episodeHistory.length).toBeGreaterThan(5);
    for (const record of gs.episodeHistory) {
      const screens = buildVPScreens(record);
      expect(screens.some(s => s.id === 'bb-error'), `week ${record.num} failed to build`).toBe(false);
      expect(screens.length).toBeGreaterThan(8);
    }
  });
});
