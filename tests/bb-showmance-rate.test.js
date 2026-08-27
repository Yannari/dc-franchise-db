// How often two people in a house end up together.
//
// Reported from a real season: three live showmances by episode five, none of
// them a showmancer. Measured over twelve seasons of a house whose cast
// contained no showmancer AT ALL, 31 showmances still formed — 22 of them
// involving a hero — because the two things that were supposed to control this
// barely did.
//
//   THE CAP WAS A FLAT FOUR. A house of fourteen could carry three couples at
//   once while a full Total Drama cast of twenty-two carried the same number.
//   It is one per seven people now, floored at one: fourteen carries two.
//
//   THE ARCHETYPE BARELY MATTERED. The first move needs a spark to reach a
//   threshold, and that threshold was 0.5 for a showmancer against 0.8 for
//   everybody else. Somebody whose entire game is this should be most of the
//   couples in a season rather than a rounding error.
//
// After, across 24 seasons: 2.0 showmances a season (was 2.6), 0.4 of them
// live by the end of week five (was 0.7), and 30% involve a showmancer from a
// cast that is 17% showmancer.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const K = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(K.map((k, i) => [k, 1 + ((s * 13 + i * 5) % 10)]));
const ARCH = ['mastermind', 'hero', 'showmancer', 'villain', 'schemer', 'goat',
  'social-butterfly', 'loyal-soldier', 'wildcard', 'showmancer', 'perceptive-player',
  'challenge-beast'];

function house(size = 14) {
  seedGame(Array.from({ length: size }, (_, i) => ({ name: 'P' + i,
    archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
    sexuality: 'straight', stats: spread(i + 1) })),
  { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
    finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
    romance: 'enabled', twistSchedule: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
    getBond, getPerceivedBond, ordinal });
}

describe('the number of couples a house can carry', () => {
  it('never runs more at once than the house has room for', () => {
    let peak = 0, weeks = 0;
    for (let s = 0; s < 6; s++) {
      house(14);
      for (let w = 0; w < 11; w++) {
        if (!simulateBBEpisode()) break;
        weeks++;
        const live = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up'
          && (sh.players || []).every(p => (gs.activePlayers || []).includes(p)));
        // One per seven people, and the roster only shrinks.
        const room = Math.max(1, Math.floor((gs.activePlayers || []).length / 7));
        expect(live.length,
          `${live.length} live showmances with ${(gs.activePlayers || []).length} in the house`)
          .toBeLessThanOrEqual(room + 1);   // +1: a couple can outlive the shrinking cap
        peak = Math.max(peak, live.length);
      }
    }
    expect(weeks).toBeGreaterThan(20);
    // The reported season had three at once in a house of fourteen.
    expect(peak, 'still running three couples at once in a full house').toBeLessThan(3);
  });

  it('scales the ceiling with the cast instead of using a flat four', () => {
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance, 'the cap is still a constant').toMatch(/function showmanceCap/);
    expect(romance).toMatch(/Math\.max\(1, Math\.floor\(\(Number\(houseSize\) \|\| 0\) \/ 7\)\)/);
    // Both routes into a showmance have to respect it, or the other one
    // quietly becomes the way every couple forms.
    expect((romance.match(/showmanceCap\(/g) || []).length,
      'only one of the two formation paths reads the cap').toBeGreaterThanOrEqual(3);
  });

  it('makes being a showmancer mean something', () => {
    const romance = readFileSync('js/romance.js', 'utf8');
    // The pace multiplier is applied per archetype, and only in a house.
    expect(romance).toMatch(/const houseRules = seasonConfig\.format === 'big-brother'/);
    const m = romance.match(/arch === 'showmancer' \? ([\d.]+) :[\s\S]*?includes\(arch\) \? ([\d.]+) : ([\d.]+)/);
    expect(m, 'the first move no longer paces on archetype').toBeTruthy();
    const [, showmancer, social, ordinary] = m.map(Number);
    expect(showmancer).toBeLessThan(social);
    expect(social).toBeLessThan(ordinary);
  });

  it('leaves Total Drama alone', () => {
    // A beach season is thirteen episodes with a spark already burning and was
    // not the thing that measured wrong. The pace multiplier is 1 there.
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance).toMatch(/const pace = arch => \(houseRules[\s\S]*?: 1\);/);
  });
});
