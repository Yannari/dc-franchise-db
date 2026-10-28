// Twist family 5: who is really talking (the false Voice, Monsieur Robot) and the night the public decides
// differently (the house decides, the vote to eliminate, the ticket). Each rule on its own, then in a season.
import { describe, expect, it } from 'vitest';
import { falseVoiceWeek, revealFalseVoice, robotWeek, unmaskRobot } from '../js/ss/deceptions.js';
import { evictShares, houseDecides, ticketVote } from '../js/ss/public-votes.js';
import { openKitties, balance, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus'];
const SHARP = new Set(['Ana', 'Ben']);
const BONDS = { 'Cy|Di': -7, 'Ana|Ed': 6 };
const bond = (a, b) => BONDS[`${a}|${b}`] ?? BONDS[`${b}|${a}`] ?? 0;
const ctx = (r = 0.5, over = {}) => ({ rng: () => r, week: 3, stat: (n, k) => (SHARP.has(n) && k === 'intuition' ? 10 : 3), bond, ...over });
const house = () => {
  const st = { secrets: H.map(n => ({ id: n, kind: 'personal', holders: [n], text: `${n}'s secret`, clues: ['c1', 'c2'], difficulty: 0.5 })) };
  openKitties(st, H, 10000, 0);
  return st;
};

describe('the false Voice', () => {
  it('the sharp refuse; the trusting answer and hand the house a lead; the doubters are paid at the prime', () => {
    const st = house();
    const ev = falseVoiceWeek(st, ctx(0.5), { house: H });
    expect(ev.doubters.sort()).toEqual(['Ana', 'Ben']);
    expect(ev.fooled).toContain('Cy');
    expect(st.shownClues.some(c => c.how === 'false-voice' && c.holders.includes('Cy'))).toBe(true);
    const seg = revealFalseVoice(st, ctx(0.5), { house: H });
    expect(seg.doubters.sort()).toEqual(['Ana', 'Ben']);
    expect(balance(st, 'Ana')).toBe(11000);
    expect(revealFalseVoice(st, ctx(0.5), { house: H })).toBe(null);
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
});

describe('Monsieur Robot', () => {
  it('an eliminated housemate inside; right guesses paid; what it heard costs the one who said it', () => {
    const st = house();
    const ev = robotWeek(st, ctx(0.01), { house: H, gone: ['Zed'] });
    expect(ev.robot).toBe('Zed');
    expect(ev.heard).toEqual({ a: 'Cy', b: 'Di' });
    const seg = unmaskRobot(st, ctx(0.01), { house: H });
    expect(seg.right.length).toBeGreaterThan(0);
    for (const n of seg.right) expect(balance(st, n)).toBe(11000);
    expect(seg.effects.bond).toContainEqual(['Di', 'Cy', -1.2]);
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
});

describe('the public decides differently', () => {
  it('a vote to eliminate sends the most disliked, not the least loved', () => {
    const st = { public: { Ana: { seen: 3, warmth: 3, pity: 0, fun: 0, real: 0, arc: 0, heat: 0, game: 0, log: [] }, Ben: { seen: 3, warmth: 0, pity: 0, fun: 1, real: 0, arc: 0, heat: 3, game: 0, log: [] }, Cy: { seen: 1, warmth: 0, pity: 0, fun: 0, real: 0, arc: 0, heat: 0, game: 0, log: [] } } };
    const pc = evictShares(st, ['Ana', 'Ben', 'Cy'], () => 0.5, 0);
    expect(Object.entries(pc).sort((a, b) => b[1] - a[1])[0][0]).toBe('Ben');
  });
  it('the house decides between the bottom two, each by who they keep least', () => {
    const r = houseDecides(ctx(0.5), { bottom: ['Cy', 'Ed'], house: H, publicLowest: 'Cy' });
    // Ana likes Ed: Ana votes Cy out
    expect(r.votes.Ana).toBe('Cy');
    expect(Object.keys(r.votes)).not.toContain('Cy');
    expect(r.tally.Cy + r.tally.Ed).toBe(H.length - 2);
    expect(['Cy', 'Ed']).toContain(r.evicted);
  });
  it('the ticket: never a vote for yourself, and the winner is immune next week', () => {
    const st = house();
    const r = ticketVote(st, ctx(0.5), { house: H });
    for (const [v, t] of Object.entries(r.votes)) expect(v).not.toBe(t);
    expect(st.nextImmune[4]).toContain(r.winner);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('family 5 in a season', () => {
  const play = () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off' });
    withSeededRandom(21, () => {
      simulateBBEpisode();
      const st = gs.bb.secretStory;
      Object.assign(st, { forceDeception: { 2: 'false-voice', 3: 'robot' }, forceVoteMode: { 2: 'house-decides', 3: 'evict' }, forceTicket: { 3: true }, forceSplit: { 2: 'none', 3: 'none' }, forceWeekTwist: { 2: 'none', 3: 'none' } });
      st.plan = { ...(st.plan || {}), fakes: [] };
      simulateBBEpisode(); simulateBBEpisode();
    });
    return gs.episodeHistory;
  };
  it('the false Voice, the robot, the house deciding, the vote to eliminate and the ticket all air, cleanly', () => {
    const rows = play();
    const row2 = rows.find(r => r.num === 2), row3 = rows.find(r => r.num === 3);
    const pub2 = row2.acts.find(a => a.type === 'eviction')?.ssPublic, pub3 = row3.acts.find(a => a.type === 'eviction')?.ssPublic;
    const s2 = bbWeekSteps(row2, { host: 'Josh' }), s3 = bbWeekSteps(row3, { host: 'Josh' });
    const ids = [...s2, ...s3].map(s => String(s.id));
    expect(ids.some(i => /^bb-ss-false-voice-w2/.test(i))).toBe(true);
    expect(ids.some(i => /^bb-ss-prime-falsevoice-w2/.test(i))).toBe(true);
    expect(ids.some(i => /^bb-ss-robot-w3/.test(i))).toBe(true);
    expect(ids.some(i => /^bb-ss-prime-robot-w3/.test(i))).toBe(true);
    expect(ids.some(i => /^bb-ss-prime-ticket-w3/.test(i))).toBe(true);
    // the house decided in week 2: the evicted was one of the public's bottom two, and the house's majority
    expect(pub2?.mode).toBe('house-decides');
    expect(pub2.bottom).toContain(pub2.evicted);
    const v2 = s2.find(s => /^bb-ss-prime-verdict/.test(String(s.id)));
    expect(v2.steps.map(st => st.t).join('\n')).toMatch(/the house decides/i);
    // week 3: the public voted to eliminate, and the highest share left
    expect(pub3?.mode).toBe('evict');
    const pc = pub3.percents;
    expect(Object.entries(pc).sort((a, b) => b[1] - a[1])[0][0]).toBe(pub3.evicted);
    const text = [...s2, ...s3].flatMap(s => s.steps.map(st => String(st.t || '')));
    expect(text.filter(t => /\bundefined\b|\bNaN\b|\[object/.test(t))).toEqual([]);
    const st = gs.bb.secretStory;
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
});
