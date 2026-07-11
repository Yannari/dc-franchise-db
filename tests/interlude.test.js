// Interlude episodes (non-elimination): full act-structured "check in on the
// out-of-game cast" episodes. Rescue Island (still-competing rivals) vs Jury
// House (out-for-good jury).
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, seasonConfig } from '../js/core.js';
import { generateInterludeLife } from '../js/rescue-island.js';

const NAMES = ['Lynda', 'Anastasia', 'Spencer', 'Logan', 'Natalia', 'Richard', 'Amelie', 'Ted', 'Ivy', 'Diego'];
const ARCH = ['floater', 'villain', 'mastermind', 'loyal-soldier', 'social-butterfly', 'hero', 'villain', 'hothead', 'social-butterfly', 'challenge-beast'];
const CAST = NAMES.map((n, i) => ({ name: n, archetype: ARCH[i] }));
const stripNames = (t) => NAMES.reduce((s, n) => s.split(n).join('~'), t);
const flat = (d) => (d.acts || []).flatMap(a => a.beats || []);

function seedJury() {
  seedGame(CAST, {
    isMerged: true, mergeName: 'merge', episode: 8,
    eliminated: ['Lynda', 'Amelie', 'Ted', 'Ivy', 'Diego', 'Spencer', 'Natalia'],
    jury: ['Lynda', 'Amelie', 'Ted', 'Ivy', 'Diego', 'Spencer', 'Natalia'],
    activePlayers: ['Anastasia', 'Logan', 'Richard'],
    phase: 'merge', initialized: true, episodeHistory: [],
  });
}
function seedRescue() {
  seedGame(CAST, {
    isMerged: false, episode: 6, riPlayers: ['Lynda', 'Amelie', 'Ted', 'Ivy', 'Diego', 'Spencer'], eliminated: [],
    activePlayers: ['Anastasia', 'Logan', 'Natalia', 'Richard'],
    phase: 'pre-merge', initialized: true, episodeHistory: [], riArrivalEp: {},
  });
  seasonConfig.ri = true; seasonConfig.riFormat = 'rescue';
}

describe('Interlude — full episode structure', () => {
  it('jury motel builds multiple acts with a roundtable act', () => {
    seedJury();
    const ep = { num: 9, isInterlude: true, interludeMode: 'jury-house', twists: [] };
    generateInterludeLife(ep);
    const d = ep.interlude;
    expect(d.venue).toBe('jury');
    expect(d.acts.length).toBeGreaterThanOrEqual(3);
    expect(d.acts.some(a => a.roundtable?.lines?.length)).toBe(true);
    // full-length episode: dense — roughly 3+ beats per resident, plus confessionals
    expect(flat(d).length).toBeGreaterThanOrEqual(d.residents.length * 2.5);
    expect(flat(d).some(b => b.badge === 'CONFESSIONAL')).toBe(true);
    expect(d.teaser).toBeTruthy();
  });

  it('rescue island builds a storm centerpiece act', () => {
    seedRescue();
    const ep = { num: 6, isInterlude: true, interludeMode: 'rescue-island', twists: [] };
    generateInterludeLife(ep);
    const d = ep.interlude;
    expect(d.venue).toBe('rescue');
    expect(d.acts.some(a => a.title === 'The Storm')).toBe(true);
    // storm beats present
    const badges = flat(d).map(b => b.badge);
    expect(badges).toContain('THE RESCUE');
  });

  it('every resident appears at least once (both venues)', () => {
    for (const seed of [seedJury, seedRescue]) {
      seed();
      const mode = seed === seedJury ? 'jury-house' : 'rescue-island';
      const ep = { num: 9, isInterlude: true, interludeMode: mode, twists: [] };
      generateInterludeLife(ep);
      const seen = new Set(flat(ep.interlude).flatMap(b => b.players));
      ep.interlude.residents.forEach(r => expect(seen.has(r)).toBe(true));
    }
  });

  it('venues are semantically different: no jury-rooting on rescue island', () => {
    seedRescue();
    const ep = { num: 6, isInterlude: true, interludeMode: 'rescue-island', twists: [] };
    generateInterludeLife(ep);
    const text = flat(ep.interlude).map(b => b.text).join(' ');
    // rescue cast is still competing — they never "root for a finalist" or debate the win
    expect(text).not.toMatch(/jury vote|deserves the win|rooting/i);
    // and they DO reference the return / coming back
    expect(text).toMatch(/return|back in|second life|coming back/i);
  });

  it('never repeats a sentence template within an episode', () => {
    let dup = 0;
    for (let i = 0; i < 30; i++) {
      seedJury();
      const ep = { num: 9, isInterlude: true, interludeMode: 'jury-house', twists: [] };
      generateInterludeLife(ep);
      const seen = new Set();
      flat(ep.interlude).map(e => stripNames(e.text)).forEach(k => { if (seen.has(k)) dup++; seen.add(k); });
    }
    expect(dup).toBe(0);
  });

  it('requires at least 2 residents', () => {
    seedGame(CAST, { isMerged: true, eliminated: ['Lynda'], activePlayers: NAMES.slice(1), phase: 'merge', initialized: true, episodeHistory: [] });
    const ep = { num: 3, isInterlude: true, interludeMode: 'jury-house', twists: [] };
    generateInterludeLife(ep);
    expect(ep.interlude).toBeUndefined();
  });
});
