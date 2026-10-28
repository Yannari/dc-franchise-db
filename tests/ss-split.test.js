// Twist family 4: the split (js/ss/split.js). The second house parts the closest pairs; the clans draft; the bears
// are few; each week a duel on averages makes one side immune; the traitor's offer; the reunion. And in a season,
// on screen.
import { describe, expect, it } from 'vitest';
import { startSplit, splitWeek, splitActive } from '../js/ss/split.js';
import { openKitties, balance, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo'];
// Ana and Ben are inseparable; Cy and Di too; Gus is on his own
const BONDS = { 'Ana|Ben': 9, 'Cy|Di': 8, 'Gus|Ana': -3, 'Gus|Ben': -3 };
const bond = (a, b) => BONDS[`${a}|${b}`] ?? BONDS[`${b}|${a}`] ?? 0;
const ctx = (r = 0.4, over = {}) => ({ rng: () => r, week: 2, stat: () => 5, bond, ...over });
const side = (s, n) => s.sides.findIndex(x => x.includes(n));

describe('the split, decided', () => {
  it('the second house parts the closest pairs and balances the sides', () => {
    const st = {};
    const s = startSplit(st, ctx(), { house: H, kind: 'second-house' });
    expect(side(s, 'Ana')).not.toBe(side(s, 'Ben'));
    expect(side(s, 'Cy')).not.toBe(side(s, 'Di'));
    expect(Math.abs(s.sides[0].length - s.sides[1].length)).toBeLessThanOrEqual(1);
    expect(s.apart).toBe(true);
    expect(s.parted.length).toBeGreaterThanOrEqual(2);
  });
  it('the clans live together; the bears are few and live apart', () => {
    expect(startSplit({}, ctx(), { house: H, kind: 'clans' }).apart).toBe(false);
    const b = startSplit({}, ctx(), { house: H, kind: 'bears' });
    expect(b.apart).toBe(true);
    expect(Math.min(b.sides[0].length, b.sides[1].length)).toBeGreaterThanOrEqual(3);
    expect(Math.min(b.sides[0].length, b.sides[1].length)).toBeLessThanOrEqual(4);
  });
  it("the duel is scored on each side's average, and the winners are immune and paid", () => {
    const st = {};
    openKitties(st, H, 10000, 0);
    startSplit(st, ctx(), { house: H, kind: 'bears' });
    const small = st.split.sides.find(x => x.length <= 4);
    // the small side is far stronger, member for member: on averages it wins, on sums it would lose
    const strong = new Set(small);
    const ev = splitWeek(st, ctx(0.5, { stat: n => (strong.has(n) ? 9 : 4) }), { house: H });
    expect(ev.duel.winners).toEqual(small);
    for (const n of small) { expect(st.nextImmune[2]).toContain(n); expect(balance(st, n)).toBe(10500); }
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
  it("the traitor's offer, taken: the money, the move, and the old side remembers", () => {
    const st = {};
    openKitties(st, H, 10000, 0);
    startSplit(st, ctx(), { house: H, kind: 'clans' });
    const ev = splitWeek(st, ctx(0.01), { house: H });
    expect(ev.traitor).toBeTruthy();
    const t = ev.traitor;
    expect(t.took).toBe(true);
    expect(st.split.sides[t.to]).toContain(t.who);
    expect(st.split.sides[t.from]).not.toContain(t.who);
    expect(balance(st, t.who)).toBeGreaterThanOrEqual(13000);
    expect(ev.effects.bond.some(([a, b, d]) => b === t.who && d < 0)).toBe(true);
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
  it('ends with the reunion, and the parted pairs find each other', () => {
    const st = {};
    openKitties(st, H, 10000, 0);
    startSplit(st, ctx(), { house: H, kind: 'second-house' });
    splitWeek(st, ctx(0.6), { house: H });
    const end = splitWeek(st, ctx(0.6, { week: 3 }), { house: H });
    expect(end.reunion).toBeTruthy();
    expect(splitActive(st, 4)).toBe(false);
    expect(end.effects.bond.some(([a, b, d]) => [a, b].sort().join() === 'Ana,Ben' && d > 0)).toBe(true);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('a split in a season', () => {
  it('the house splits, a side is immune each week, the reunion airs, and the words are clean', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off' });
    withSeededRandom(12, () => { simulateBBEpisode(); gs.bb.secretStory.forceSplit = { 2: 'second-house' }; for (let i = 0; i < 3; i++) simulateBBEpisode(); });
    const acts = gs.episodeHistory.flatMap(r => r.acts.filter(a => a.type === 'ss-split').map(a => ({ ...a, num: r.num })));
    expect(acts.some(a => a.start)).toBe(true);
    expect(acts.some(a => a.reunion)).toBe(true);
    for (const a of acts.filter(x => x.duel)) {
      const ss = gs.episodeHistory.find(r => r.num === a.num).acts.find(x => x.secretStory)?.secretStory;
      // (the winners are immune: no house-voted nominee among them)
      for (const n of a.duel.winners) if (!(ss.dOffice || []).includes(n)) expect(ss.before).not.toContain(n);
    }
    for (const r of gs.episodeHistory.filter(x => x.num >= 2)) {
      const screens = bbWeekSteps(r, { host: 'Josh' });
      const text = screens.flatMap(s => s.steps.map(st => String(st.t || '')));
      expect(text.filter(t => /\bundefined\b|\bNaN\b|\[object/.test(t))).toEqual([]);
    }
    const all = gs.episodeHistory.flatMap(r => bbWeekSteps(r, { host: 'Josh' }));
    expect(all.some(s => /^bb-ss-split-start/.test(String(s.id)))).toBe(true);
    expect(all.some(s => /^bb-ss-split-end/.test(String(s.id)))).toBe(true);
    const st = gs.bb.secretStory;
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
});
