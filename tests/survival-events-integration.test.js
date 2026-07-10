import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setGs, gs, setPlayers, seasonConfig } from '../js/core.js';
import { generateSurvivalEvents } from '../js/episode.js';

// End-to-end: drive generateSurvivalEvents with the food/water system on and a
// non-island venue, and confirm the emitted camp-event narration reads native to
// that venue (carnival) with no island vocab leaking through.

const stats = (o = {}) => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 8,
  loyalty: 5, boldness: 8, intuition: 8, temperament: 5, ...o,
});

const ISLAND_VOCAB = /(coconut|jungle|makeshift spear|the well|the surf|treeline)/i;
const CARNIVAL_VOCAB = /(carnival|midway|funnel|corn dog|candy apple|ferris wheel|carousel|funhouse|snack stand|ticket booth|fryer|tents)/i;

function collectText(ep) {
  const out = [];
  for (const camp of Object.values(ep.campEvents || {})) {
    for (const phase of ['pre', 'post']) {
      for (const e of (camp[phase] || [])) if (e.text) out.push(e.text);
    }
  }
  return out;
}

describe('generateSurvivalEvents — venue-native output (carnival)', () => {
  beforeEach(() => {
    setPlayers([
      { name: 'Alice', gender: 'f', archetype: 'challenge-beast', stats: stats() },
      { name: 'Bob', gender: 'm', archetype: 'floater', stats: stats({ loyalty: 3 }) },
      { name: 'Cara', gender: 'f', archetype: 'hero', stats: stats() },
      { name: 'Dan', gender: 'm', archetype: 'villain', stats: stats({ loyalty: 2 }) },
    ]);
    setGs({
      activePlayers: ['Alice', 'Bob', 'Cara', 'Dan'],
      isMerged: true,
      mergeName: 'Chaos',
      tribes: [{ name: 'Chaos', members: ['Alice', 'Bob', 'Cara', 'Dan'] }],
      currentProviders: ['Alice'],
      currentSlackers: ['Bob'],
      playerStates: {},
      survival: { Alice: 20, Bob: 18, Cara: 22, Dan: 19 },   // low → collapse eligible
      tribeFood: { Chaos: 10 },                              // very low → crisis/rationing/etc fire
      collapseWarning: {},
      bonds: {},
      episode: 3,
      episodeHistory: [],
    });
    seasonConfig.foodWater = 'enabled';
    seasonConfig.survivalDifficulty = 'brutal';
    seasonConfig.setting = 'carnival';
  });

  it('emits carnival-flavored survival narration and never island vocab', () => {
    const ep = { num: 4, campEvents: {} };
    // Run several times to sample many event types (RNG-gated), aggregate text.
    let all = [];
    for (let i = 0; i < 40; i++) {
      const e = { num: 4, campEvents: {} };
      // refresh volatile state each run
      gs.tribeFood = { Chaos: 10 };
      gs.survival = { Alice: 20, Bob: 18, Cara: 22, Dan: 19 };
      gs.collapseWarning = {};
      gs.currentProviders = ['Alice']; gs.currentSlackers = ['Bob'];
      gs.activePlayers = ['Alice', 'Bob', 'Cara', 'Dan'];
      gs.tribes = [{ name: 'Chaos', members: ['Alice', 'Bob', 'Cara', 'Dan'] }];
      generateSurvivalEvents(e);
      all = all.concat(collectText(e));
    }
    expect(all.length).toBeGreaterThan(0);
    // No island vocab anywhere
    const leaks = all.filter(t => ISLAND_VOCAB.test(t));
    expect(leaks, leaks.join('\n')).toEqual([]);
    // At least some lines are recognizably carnival
    expect(all.some(t => CARNIVAL_VOCAB.test(t)), all.join('\n---\n')).toBe(true);
  });

  afterEach(() => {
    // restore defaults so other suites are unaffected
    seasonConfig.setting = 'hosted-camp';
    seasonConfig.foodWater = 'disabled';
  });
});
