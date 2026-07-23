import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { seasonConfig } from '../js/core.js';
import { simulateKillerClown } from '../js/chal/killer-clown.js';

// Varied cast: athletes, schemers, weak links — stats spread wide so winner
// diversity is a real test (a deterministic formula would crown the same
// athlete every run).
const CAST = [
  { name: 'Ax', archetype: 'challenge-beast', stats: { physical: 9, endurance: 9, boldness: 7, intuition: 4, mental: 4 } },
  { name: 'Bo', archetype: 'challenge-beast', stats: { physical: 8, endurance: 8, boldness: 6, intuition: 5, mental: 5 } },
  { name: 'Cy', archetype: 'hero',            stats: { physical: 7, endurance: 6, boldness: 6, intuition: 6, loyalty: 8 } },
  { name: 'Dee', archetype: 'villain',        stats: { physical: 5, endurance: 5, strategic: 8, loyalty: 2, intuition: 6 } },
  { name: 'Em', archetype: 'schemer',         stats: { physical: 4, endurance: 5, strategic: 8, loyalty: 3, mental: 7 } },
  { name: 'Fi', archetype: 'social-butterfly', stats: { physical: 4, endurance: 4, social: 8, intuition: 6 } },
  { name: 'Gil', archetype: 'floater',        stats: { physical: 5, endurance: 5, intuition: 5 } },
  { name: 'Hana', archetype: 'perceptive-player', stats: { physical: 5, endurance: 6, intuition: 8, mental: 7 } },
  { name: 'Io', archetype: 'underdog',        stats: { physical: 3, endurance: 4, boldness: 5, loyalty: 7 } },
  { name: 'Jun', archetype: 'loyal-soldier',  stats: { physical: 6, endurance: 7, loyalty: 8, boldness: 4 } },
  { name: 'Kat', archetype: 'wildcard',       stats: { physical: 6, endurance: 5, boldness: 8, temperament: 3 } },
  { name: 'Lou', archetype: 'goat',           stats: { physical: 2, endurance: 3, social: 5, intuition: 3 } },
  { name: 'Mim', archetype: 'mastermind',     stats: { physical: 4, endurance: 4, strategic: 9, mental: 8, loyalty: 2 } },
  { name: 'Nia', archetype: 'hothead',        stats: { physical: 7, endurance: 6, boldness: 7, temperament: 2 } },
];

function runOnce(epNum = 12) {
  seedGame(CAST, { isMerged: true, phase: 'post-merge', episode: epNum, mergeName: 'MergeCamp', episodeHistory: [] });
  seasonConfig.romance = 'disabled'; // keep runs deterministic-ish and fast
  const ep = { num: epNum };
  simulateKillerClown(ep);
  return ep;
}

describe('Killer Clown balance', () => {
  const RUNS = 60;
  const winners = new Set();
  let totalGrabs = 0, totalStuns = 0, totalMisses = 0, totalRefusals = 0, runBeats = 0, runClownActs = 0;
  const perRunGrabs = [];

  it('simulates repeatedly without crashing and produces full data', () => {
    for (let i = 0; i < RUNS; i++) {
      const ep = runOnce(6 + (i % 8));
      const d = ep.killerClown;
      expect(d).toBeTruthy();
      expect(ep.immunityWinner).toBeTruthy();
      winners.add(ep.immunityWinner);
      const grabs = d.beats.filter(b => b.type === 'grab').length;
      perRunGrabs.push(grabs);
      totalGrabs += grabs;
      totalStuns += d.beats.filter(b => b.type === 'stun' || b.type === 'friendlyfire').length;
      totalMisses += d.beats.filter(b => b.type === 'miss').length;
      totalRefusals += d.beats.filter(b => b.type === 'refuse').length;
      runBeats += d.beats.filter(b => b.phase === 'run').length;
      runClownActs += d.beats.filter(b => b.phase === 'run'
        && ['grab', 'stun', 'miss', 'refuse', 'evade', 'chase', 'scrum'].includes(b.type)).length;
      // results are complete + times are finite
      expect(d.results.length).toBe(CAST.length);
      d.results.forEach(r => expect(Number.isFinite(r.returnTime)).toBe(true));
    }
  }, 120000);

  it('the clown actually catches people (grabs happen in most runs)', () => {
    const runsWithGrab = perRunGrabs.filter(g => g > 0).length;
    expect(totalGrabs).toBeGreaterThanOrEqual(RUNS);            // avg >= 1 grab per run
    expect(runsWithGrab).toBeGreaterThanOrEqual(RUNS * 0.6);    // most nights someone gets taken
  });

  it('rescues still happen but are not a permanent stun-lock', () => {
    expect(totalStuns).toBeGreaterThanOrEqual(RUNS * 0.4);      // heroism exists
    expect(totalGrabs).toBeGreaterThanOrEqual(totalStuns * 0.4); // but the clown is not neutered
  });

  it('rescue attempts can miss and rescuers can refuse', () => {
    expect(totalMisses + totalRefusals).toBeGreaterThan(0);
  });

  it('the winner varies across runs (no deterministic champion)', () => {
    expect(winners.size).toBeGreaterThanOrEqual(4);
  });

  it('the run home is a real phase with events, not just a math pass', () => {
    expect(runBeats).toBeGreaterThanOrEqual(RUNS * 3); // win + flag + real drama every run
  });

  it('the clown hunts DURING the run home, not just in the forest', () => {
    expect(runClownActs).toBeGreaterThanOrEqual(RUNS); // avg >= 1 clown moment on the road home
  });
});
