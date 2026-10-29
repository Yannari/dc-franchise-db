// The season timeline speaks Secret Story (the user, 2026-10-28: "I'm still seeing Big Brother twists when Secret
// Story is selected, and no Secret Story twists"). Its own twists, on its own shelves; Big Brother's never run in it;
// and a twist placed on a week happens that week.
import { describe, expect, it } from 'vitest';
import { TWIST_CATALOG, TWIST_CATEGORIES, twistsForFormat } from '../js/core.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, bbTwistsForWeek } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import { ssRandomDraw, SS_CARD_IDS } from '../js/ss/schedule.js';
import { readSchedule } from '../js/bb/secret-story.js';

describe('the timeline for a Secret Story season', () => {
  it("offers Secret Story's twists, every one on a shelf with a button, and none of Big Brother's", () => {
    const cat = twistsForFormat({ format: 'secret-story' });
    expect(cat.length).toBeGreaterThanOrEqual(20);
    expect(cat.every(t => t.format === 'secret-story')).toBe(true);
    for (const id of ['ss-linked', 'ss-red-room', 'ss-bridge', 'ss-second-house', 'ss-false-voice', 'ss-robot', 'ss-house-decides', 'ss-ticket']) expect(cat.map(t => t.id)).toContain(id);
    const shelves = new Set(TWIST_CATEGORIES.map(c => c.id));
    for (const t of cat) { expect(shelves.has(t.category), t.id).toBe(true); expect(String(t.desc || '').length, t.id).toBeGreaterThan(120); }
    // (Big Brother keeps its own)
    expect(twistsForFormat({ format: 'big-brother' }).some(t => t.id === 'bb-double-eviction')).toBe(true);
    expect(twistsForFormat({ format: 'big-brother' }).some(t => t.format === 'secret-story')).toBe(false);
    // (twists of one kind never share a week: the incompatibilities are both ways)
    const byId = Object.fromEntries(TWIST_CATALOG.map(t => [t.id, t]));
    for (const t of cat) for (const o of t.incompatible || []) expect(byId[o]?.incompatible || [], `${t.id} / ${o}`).toContain(t.id);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('a twist placed on a week', () => {
  it('happens that week; a Big Brother twist on the timeline does not run', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off',
      twistSchedule: [{ episode: 2, type: 'ss-red-room' }, { episode: 2, type: 'ss-bridge' }, { episode: 3, type: 'ss-house-decides' }, { episode: 3, type: 'bb-double-eviction' }] });
    expect(bbTwistsForWeek(3)).toEqual([]);
    withSeededRandom(5, () => { for (let i = 0; i < 3; i++) simulateBBEpisode(); });
    const st = gs.bb.secretStory;
    seasonConfig.twistSchedule = [];
    expect(st.weekTwists[2]?.kind).toBe('red-room');
    expect((st.primes || []).find(p => p.week === 2)?.theme).toBe('bridge');
    expect(gs.episodeHistory.find(r => r.num === 3).acts.find(a => a.type === 'eviction')?.ssPublic?.mode).toBe('house-decides');
  });
});

// the user, 2026-10-28: "the randomizer is not using at all the twists of Secret Story"
describe("the timeline's Randomize", () => {
  const weeks = Array.from({ length: 12 }, (_, i) => ({ ep: i + 1, active: 14 - Math.max(0, i - 1), finale: i === 11 }));
  const seeds = n => { let x = n; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); };
  it('books only Secret Story cards, never on week one or the final, every card a real twist', () => {
    const ids = new Set(twistsForFormat({ format: 'secret-story' }).map(t => t.id));
    let total = 0;
    for (let s = 1; s <= 40; s++) {
      const book = ssRandomDraw(seeds(s), weeks);
      total += book.length;
      for (const [ep, id] of book) {
        expect(ids.has(id), id).toBe(true);
        expect(SS_CARD_IDS.has(id)).toBe(true);
        expect(ep).toBeGreaterThanOrEqual(2);
        expect(ep).toBeLessThan(12);
      }
      // a once-a-season card once
      for (const id of ['ss-for-life', 'ss-everybody', 'ss-ticket', 'ss-house-decides', 'ss-vote-to-evict']) expect(book.filter(b => b[1] === id).length).toBeLessThanOrEqual(1);
      expect(book.filter(b => /^ss-(second-house|clans|bears)$/.test(b[1])).length).toBeLessThanOrEqual(1);
    }
    // (a season gets a real handful, not none and not one a week of everything)
    expect(total / 40).toBeGreaterThan(4);
    expect(total / 40).toBeLessThan(14);
  });
  it('a drawn season plays exactly its cards; a hand-placed card only pins its week', () => {
    const was = seasonConfig.twistSchedule;
    seasonConfig.twistSchedule = [{ episode: 3, type: 'ss-red-room', random: true }];
    const st = {};
    readSchedule(st, 3); readSchedule(st, 4);
    expect(st.forceWeekTwist).toEqual({ 3: 'red-room', 4: 'none' });
    expect(st.forcePrimeTheme[3]).toBe('none');
    expect(st.forceVoteMode[4]).toBe('save');
    expect(st.forceTicket[4]).toBe('none');
    seasonConfig.twistSchedule = [{ episode: 3, type: 'ss-red-room' }];
    const hand = {};
    readSchedule(hand, 3); readSchedule(hand, 4);
    expect(hand.forceWeekTwist).toEqual({ 3: 'red-room' });
    expect(hand.forcePrimeTheme).toBeUndefined();
    seasonConfig.twistSchedule = was;
  });
});
