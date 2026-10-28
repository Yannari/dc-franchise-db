// Twist family 2, F2.1: the cards (js/ss/powers.js). Each card's rule on its own, and a card played in a real
// season, on screen: the house's names read first, then the card, then the list the public votes on.
import { describe, expect, it } from 'vitest';
import { grantPower, cardsBeforeNominations, cardsAfterNominations, expireCards, liveCards } from '../js/ss/powers.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus'];
// Ana loves Ben, hates Gus; everybody else is neutral
const BONDS = { 'Ana|Ben': 8, 'Ana|Gus': -6 };
const ctx = (over = {}) => ({ rng: () => 0.01, week: 3, stat: () => 7, bond: (a, b) => BONDS[`${a}|${b}`] ?? 0, looks: () => 0, ...over });

describe('the cards', () => {
  it('the Joker saves a friend and puts the holder\'s worst enemy up', () => {
    const st = {};
    grantPower(st, { kind: 'joker', holder: 'Ana', week: 2 });
    const r = cardsAfterNominations(st, ctx(), { house: H, nominees: ['Ben', 'Cy'], immune: [], week: 3, tally: {} });
    expect(r.played[0]).toMatchObject({ kind: 'joker', holder: 'Ana', saved: 'Ben', put: 'Gus' });
    expect(r.nominees).toEqual(['Gus', 'Cy']);
    expect(liveCards(st, H, 3)).toEqual([]);
  });
  it('the Switch does nothing until the one it covers is nominated', () => {
    const st = {};
    grantPower(st, { kind: 'switch', holder: 'Ana', week: 2, protects: 'Ben' });
    expect(cardsAfterNominations(st, ctx(), { house: H, nominees: ['Cy', 'Di'], week: 3 }).played).toEqual([]);
    const r = cardsAfterNominations(st, ctx(), { house: H, nominees: ['Cy', 'Ben'], week: 4 });
    expect(r.played[0]).toMatchObject({ kind: 'switch', saved: 'Ben', put: 'Gus' });
  });
  it('the secret immunity takes its holder off, and the house\'s next most named goes up', () => {
    const st = {};
    grantPower(st, { kind: 'immunity', holder: 'Cy', week: 2 });
    const r = cardsAfterNominations(st, ctx(), { house: H, nominees: ['Cy', 'Di'], week: 3, tally: { Cy: 4, Di: 3, Ed: 2, Fi: 1 } });
    expect(r.nominees).toEqual(['Ed', 'Di']);
  });
  it('one card a night, never the immune', () => {
    const st = {};
    grantPower(st, { kind: 'joker', holder: 'Ana', week: 2 });
    grantPower(st, { kind: 'immunity', holder: 'Cy', week: 2 });
    const r = cardsAfterNominations(st, ctx(), { house: H, nominees: ['Cy', 'Ben'], immune: ['Gus', 'Ed'], week: 3, tally: { Fi: 2 } });
    expect(r.played).toHaveLength(1);
    expect(r.nominees).not.toContain('Gus');
    expect(r.nominees).not.toContain('Ed');
  });
  it('the thief takes an immunity before the vote; the ring nominates', () => {
    const st = {};
    grantPower(st, { kind: 'thief', holder: 'Ana', week: 3 });
    grantPower(st, { kind: 'nominate', holder: 'Ana', week: 3 });
    const r = cardsBeforeNominations(st, ctx(), { house: H, immune: ['Gus'], week: 3 });
    expect(r.immune).toContain('Ana');
    expect(r.immune).not.toContain('Gus');
    expect(r.dOffice).toEqual(['Gus']);
  });
  it('a card nobody plays in three weeks is gone', () => {
    const st = {};
    grantPower(st, { kind: 'joker', holder: 'Ana', week: 1 });
    expireCards(st, 5);
    expect(liveCards(st, H, 5)).toEqual([]);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('a card in a season', () => {
  it('the house\'s names are read, the card is played live, and the public votes on the new list', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off' });
    let played = null;
    withSeededRandom(4, () => {
      simulateBBEpisode();
      // everybody in the house holds a secret immunity: whoever the house names plays theirs
      for (const n of gs.activePlayers) grantPower(gs.bb.secretStory, { kind: 'immunity', holder: n, week: 2 });
      gs.bb.secretStory.forceWeekTwist = { 2: 'none' };
      simulateBBEpisode();
    });
    const row = gs.episodeHistory.find(r => r.num === 2);
    const ss = row.acts.find(a => a.secretStory)?.secretStory;
    played = (ss.cards || []).find(c => c.kind === 'immunity');
    expect(played).toBeTruthy();
    expect(ss.before).toContain(played.saved);
    expect(ss.nominees).not.toContain(played.saved);
    expect(ss.nominees).toContain(played.put);
    const noms = bbWeekSteps(row, { host: 'Josh' }).find(s => s.id === 'bb-noms-v');
    const text = noms.steps.map(s => s.t).join('\n');
    expect(text).toContain('secret immunity');
    expect(text).not.toMatch(/undefined|NaN/);
  });
});

describe('the week the Voice changes the nominations', () => {
  const run = kind => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off' });
    withSeededRandom(6, () => { simulateBBEpisode(); gs.bb.secretStory.forceWeekTwist = { 2: kind }; simulateBBEpisode(); simulateBBEpisode(); });
    const row = gs.episodeHistory.find(r => r.num === 2);
    return { row, ss: row.acts.find(a => a.secretStory)?.secretStory, screens: bbWeekSteps(row, { host: 'Josh' }) };
  };
  const clean = screens => screens.flatMap(s => s.steps.map(st => String(st.t || ''))).filter(t => /\bundefined\b|\bNaN\b/.test(t));
  it("linked destinies: a nominee's partner goes up too", () => {
    const { ss, screens } = run('linked');
    expect(ss.twist.kind).toBe('linked');
    for (const l of ss.linked) { expect(ss.nominees).toContain(l.to); expect(ss.twist.pairs.some(p => p.includes(l.from) && p.includes(l.to))).toBe(true); }
    expect(screens.some(s => /^bb-ss-ntwist-linked/.test(s.id))).toBe(true);
    expect(clean(screens)).toEqual([]);
  });
  it('nominated for life: up this week and the next', () => {
    const { ss, screens } = run('for-life');
    expect(ss.lifer).toBeTruthy();
    expect(ss.nominees).toContain(ss.lifer);
    const next = gs.episodeHistory.find(r => r.num === 3).acts.find(a => a.secretStory)?.secretStory;
    const life = gs.bb.secretStory.forLife;
    if (next && gs.episodeHistory.find(r => r.num === 3).houseAtStart.includes(life.who)) expect(next.nominees).toContain(life.who);
    expect(clean(screens)).toEqual([]);
  });
  it('inverted: the least saved go up', () => {
    const { ss } = run('inverted');
    expect(ss.inverted).toBe(true);
    const saves = Object.entries(ss.tally).sort((a, b) => a[1] - b[1]);
    expect(ss.before).toContain(saves[0][0]);
  });
  it('the two houses: nobody from the Immunity House is nominated', () => {
    const { ss } = run('houses');
    for (const n of ss.twist.immuneHouse) expect(ss.before).not.toContain(n);
  });
  it('the red room: who went in and who they dragged are both up', () => {
    const { ss } = run('red-room');
    expect(ss.nominees).toContain(ss.twist.who);
    expect(ss.nominees).toContain(ss.twist.dragged);
  });
  it('the exclusive nominator: one ballot, and the names are theirs', () => {
    const { ss, screens } = run('exclusive');
    expect(ss.ballots).toHaveLength(1);
    expect(ss.ballots[0].voter).toBe(ss.exclusive);
    expect(clean(screens)).toEqual([]);
  });
});

