// The Big Brother visual player.
//
// Built on the shared Total Drama VP kit — rp-page, rpPortrait, the badge-pill
// scene card and _tvState click-to-reveal — rather than a private stylesheet,
// so a houseguest looks like a camper. These cover the two things that were
// actually wrong with it: it was unreachable, and it displayed almost none of
// what the engine produces.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
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
  // The shared builders reach for these as bare globals too — main.js puts the
  // whole module surface on window at boot.
  globalThis.pStats = pStats;
  globalThis.pronouns = pronouns;
  globalThis.threatScore = threatScore;
  globalThis.getBond = getBond;
  globalThis.getPerceivedBond = getPerceivedBond;
  globalThis.ordinal = ordinal;
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
    // The eviction is the last act; the shared vote, alliance and
    // relationship sections follow it as appendices.
    expect(ids).toContain('bb-evict');
    const spine = ids.filter(id => id !== 'bb-camp' && !['bb-overview','bb-interview','bb-votes','bb-alliances','bb-rels','bb-debug'].includes(id));
    // House life is its own act with its own phase, so the player walks the
    // acts the engine produced rather than guessing where a beat belonged.
    expect(spine).toEqual([
      'bb-cold', 'bb-house-1', 'bb-hoh', 'bb-house-2', 'bb-noms',
      'bb-house-3', 'bb-veto', 'bb-house-4', 'bb-cer', 'bb-evict',
    ]);
  });

  it('introduces the cast one at a time on move-in day', () => {
    const ep = week();
    const first = buildBBWeekScreens(ep)[0].html;
    expect(first).toContain('MOVE-IN DAY');
    // Arrivals are revealed one at a time, so before any reveal they are all
    // still placeholders behind the door.
    expect(first).toContain('Next houseguest');
    expect(first).not.toContain('HOUSEGUEST 1');
    // Once everybody is in, every houseguest has been introduced by name.
    const all = revealed(ep)[0].html;
    expect(all).toContain('HOUSEGUEST 1');
    for (const p of CAST) expect(all).toContain(p.name);
    expect(all).toContain('THE DOOR LOCKS');
    expect(all).toContain('rp-portrait');
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
    const lifeScreens = screens.filter(s => s.id.startsWith('bb-house'));
    expect(lifeScreens.length).toBeGreaterThanOrEqual(4);
    const beats = (ep.acts || []).flatMap(a => a.socialBeats || []);
    const lifeHtml = lifeScreens.map(s => s.html).join('');
    expect(beats.length).toBeGreaterThan(0);
    // The events the engine generated actually appear somewhere in the player.
    const all = screens.map(s => s.html).join('');
    const shown = beats.filter(b => all.includes(b.text.slice(0, 30))).length;
    expect(shown / beats.length).toBeGreaterThan(0.8);
    expect(lifeHtml).toContain('HOUSE LIFE');
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
