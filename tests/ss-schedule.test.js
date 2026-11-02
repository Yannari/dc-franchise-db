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
import { ssRandomDraw, SS_CARD_IDS, SS_SIGNATURE_CARDS } from '../js/ss/schedule.js';
import { SIGNATURES } from '../js/ss/twists.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
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
  it("books only Secret Story cards, never on the final, and on week one only launch night's own", () => {
    const ids = new Set(twistsForFormat({ format: 'secret-story' }).map(t => t.id));
    let total = 0, sigs = 0;
    for (let s = 1; s <= 40; s++) {
      const book = ssRandomDraw(seeds(s), weeks);
      total += book.length;
      for (const [ep, id] of book) {
        expect(ids.has(id), id).toBe(true);
        expect(SS_CARD_IDS.has(id)).toBe(true);
        // (week one has no prime: only launch night's own twists, the Public's Signs and the season's signature, go
        // there, and only there)
        const launch = id === 'ss-public-signs' || !!SS_SIGNATURE_CARDS[id];
        expect(ep >= 2 || launch, `${id} on week ${ep}`).toBe(true);
        if (launch) expect(ep).toBe(1);
        expect(ep).toBeLessThan(12);
      }
      // a once-a-season card once
      for (const id of ['ss-for-life', 'ss-everybody', 'ss-ticket', 'ss-house-decides', 'ss-vote-to-evict']) expect(book.filter(b => b[1] === id).length).toBeLessThanOrEqual(1);
      expect(book.filter(b => /^ss-(second-house|clans|bears)$/.test(b[1])).length).toBeLessThanOrEqual(1);
      expect(book.filter(b => SS_SIGNATURE_CARDS[b[1]]).length).toBeLessThanOrEqual(1);
      sigs += book.some(b => SS_SIGNATURE_CARDS[b[1]]) ? 1 : 0;
    }
    // (most seasons have a signature, as the show's own draw does)
    expect(sigs).toBeGreaterThan(25);
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

// the user, 2026-11-02: "secret box isnt in the list of the available twist so i dont even know what it is the voice
// doesnt explain it too i thought i said all the twist have to be explained before they happen"
describe("the season's signature", () => {
  it('is on the twist list: a card for every signature the show plays, on its own shelf, each explained', () => {
    const cat = twistsForFormat({ format: 'secret-story' });
    expect(TWIST_CATEGORIES.some(c => c.id === 'ss-signature')).toBe(true);
    for (const s of SIGNATURES.filter(x => x.built)) {
      const card = cat.find(t => t.ssSignature === s.id);
      expect(card, s.id).toBeTruthy();
      expect(card.category).toBe('ss-signature');
      expect(SS_SIGNATURE_CARDS[card.id]).toBe(s.id);
      expect(card.desc.length, s.id).toBeGreaterThan(250);
    }
    expect(cat.find(t => t.id === 'ss-sig-secret-box').name).toBe('The Secret Box');
  });
  const play = (schedule, seed = 5) => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSignature: undefined, ssSecretRoom: 'off', twistSchedule: schedule });
    withSeededRandom(seed, () => simulateBBEpisode());
    return gs.bb.secretStory;
  };
  it('placed on the timeline, is the one the season plays, and the timeline shows it on launch night right away', () => {
    for (const [card, id] of [['ss-sig-secret-box', 'secret-box'], ['ss-sig-masters', 'masters'], ['ss-sig-thieves', 'thieves']]) {
      const st = play([{ id: 'x', episode: 1, type: card }]);
      expect(st.draw.signature).toBe(id);
      // (written once: the card that was placed, not a second copy the show drew)
      expect(seasonConfig.twistSchedule.filter(t => t.type === card && Number(t.episode) === 1).length).toBe(1);
    }
    // (the show's own draw goes on the timeline as the same card, as soon as launch night is simulated)
    let seen = 0;
    for (const seed of [1, 2, 3, 4, 6, 7]) {
      const st = play([], seed);
      if (!st.draw.signature) continue;
      seen++;
      expect(seasonConfig.twistSchedule.some(t => t.auto && t.type === `ss-sig-${st.draw.signature}` && Number(t.episode) === 1), String(seed)).toBe(true);
    }
    expect(seen).toBeGreaterThan(2);
  });
  it('a season Randomize drew plays exactly its cards: no signature card, no signature', () => {
    expect(play([{ id: 'x', episode: 3, type: 'ss-red-room', random: true }]).draw.signature).toBeNull();
  });
  it('is explained to the people at home on launch night, before the first housemate walks on', () => {
    play([{ id: 'x', episode: 1, type: 'ss-sig-secret-box' }]);
    const screens = bbWeekSteps(gs.episodeHistory.at(-1), { host: 'Josh' });
    const i = screens.findIndex(s => s.id === 'bb-ss-launch-signature');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(screens.findIndex(s => /^bb-ss-launch-arr-/.test(s.id)));
    const sc = screens[i];
    expect(sc.rules.length).toBeGreaterThanOrEqual(3);
    const said = sc.steps.map(st => st.t).join(' ');
    expect(said).toContain('The Secret Box');
    expect(said).toMatch(/find one housemate's secret/);
    expect(said).toMatch(/three weeks/);
    expect(sc.steps.at(-1).rule).toBe(sc.rules.length);
    // (the rules are about what is coming: on launch night "every week" stays every week, not "every day")
    play([{ id: 'x', episode: 1, type: 'ss-sig-masters' }]);
    const m = bbWeekSteps(gs.episodeHistory.at(-1), { host: 'Josh' }).find(s => s.id === 'bb-ss-launch-signature');
    expect(m.steps.map(st => st.t).join(' ')).toMatch(/Every week, the two of them add one more housemate/);
    // (a season with no signature has no such screen)
    play([{ id: 'x', episode: 3, type: 'ss-red-room', random: true }]);
    expect(bbWeekSteps(gs.episodeHistory.at(-1), { host: 'Josh' }).some(s => s.id === 'bb-ss-launch-signature')).toBe(false);
  });
});
