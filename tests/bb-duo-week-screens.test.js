// You Go, They Go, on screen.
//
// A SEPARATE FILE FROM THE MECHANICS ON PURPOSE. The mechanics pass whether or
// not anything is ever drawn, and that is exactly how the Twin Twist shipped
// with ten changeovers a season and nothing visible anywhere — its swap was
// handed to a screen that never rendered it.
//
// So this plays real seasons with the week scheduled and asserts on HTML that
// came back out of `buildVPScreens`, never on the act that went in.
import { beforeAll, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

const screensByLabel = new Map();
let acts = [];
let duoWeeks = [];

function playSeason(seed) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.popularity = {};
  Object.assign(seasonConfig, {
    format: 'big-brother', finaleSize: 3, jurySize: 7,
    twistSchedule: [{ episode: 2, type: 'bb-duo-week' }],
  });

  withSeededRandom(seed, () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
  });

  acts.push(...(gs.bb.weeks || []).flatMap(w => w.acts || []).filter(Boolean));
  duoWeeks.push(...(gs.bb.weeks || []).filter(w => w.duoWeek));

  for (const [i, ep] of (gs.episodeHistory || []).entries()) {
    let built = [];
    try { built = buildVPScreens(ep, i + 1) || []; } catch { built = []; }
    for (const sc of built) {
      if (!sc?.label) continue;
      if (!screensByLabel.has(sc.label)) screensByLabel.set(sc.label, []);
      screensByLabel.get(sc.label).push(sc);
    }
  }
}

beforeAll(() => { for (const seed of [3, 11, 29]) playSeason(seed); });

const screensFor = label => screensByLabel.get(label) || [];
const htmlFor = label => screensFor(label).map(s => s.html).join('');

describe('the week produced the acts', () => {
  it('paired the house and announced it', () => {
    expect(acts.filter(a => a.type === 'duo-week-open').length).toBeGreaterThan(0);
  });

  it('ran the strategy-for-two events', () => {
    expect(acts.filter(a => a.type === 'duo-week-events').length).toBeGreaterThan(0);
  });

  it('took somebody out with their partner', () => {
    expect(acts.filter(a => a.type === 'duo-week-eviction').length).toBeGreaterThan(0);
  });
});

describe('and every one of them reached a screen', () => {
  it('draws the pairing, with the pairs on it', () => {
    const [screen] = screensFor('You Go, They Go: The Pairing');
    expect(screen, 'the pairing never became a screen').toBeTruthy();
    expect(screen.html).toContain('YOU GO, THEY GO');
    const open = acts.find(a => a.type === 'duo-week-open');
    for (const [a, b] of open.pairs) {
      expect(screen.html, `the pair ${a} & ${b} is missing`).toContain(a);
      expect(screen.html).toContain(b);
    }
  });

  it('states the rule that makes the week worth watching', () => {
    // Not "two evictions" — the specific, cruel half: the partner leaves on
    // whatever the room thought of them, including nothing.
    const html = htmlFor('You Go, They Go: The Pairing');
    expect(html).toMatch(/does not matter if it was none/i);
  });

  it('draws the week’s duo events, with their text', () => {
    const html = htmlFor('You Go, They Go: Chained');
    expect(html.length, 'the events never became a screen').toBeGreaterThan(0);
    const ev = acts.find(a => a.type === 'duo-week-events');
    const first = ev.events[0];
    // A slice, because the renderer escapes — the run of words has to survive.
    expect(html).toContain(first.badgeText);
  });

  it('draws both names at the door', () => {
    const list = screensFor('You Go, They Go: And Their Partner');
    expect(list.length, 'two people left and only the vote was drawn').toBeGreaterThan(0);
    const out = acts.find(a => a.type === 'duo-week-eviction');
    const html = list.map(s => s.html).join('');
    expect(html).toContain('AND THEIR PARTNER');
    expect(html).toContain(out.evicted);
    expect(html).toContain(out.taken);
  });

  it('says on screen when the partner had no votes against them', () => {
    // The one thing a reader will not believe unless it is stated: the second
    // name leaving was not a close vote, it was not a vote at all.
    const zero = acts.filter(a => a.type === 'duo-week-eviction' && a.gotNothing);
    if (!zero.length) return; // covered exhaustively in the mechanics file
    expect(htmlFor('You Go, They Go: And Their Partner')).toMatch(/ZERO VOTES/);
  });
});

describe('the week is honest with the rest of the season', () => {
  it('removed exactly two houseguests on the weeks it fired', () => {
    const fired = duoWeeks.filter(w => w.duoWeekTaken);
    expect(fired.length).toBeGreaterThan(0);
    for (const w of fired) {
      expect(w.evicted).toBeTruthy();
      expect(w.secondEvicted).toBe(w.duoWeekTaken.taken);
      expect(w.evicted).not.toBe(w.secondEvicted);
    }
  });
});
