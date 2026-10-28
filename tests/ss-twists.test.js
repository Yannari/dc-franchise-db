// The twist catalog, the season randomizer, the signature roles, and launch night.
import { describe, expect, it } from 'vitest';
import { drawSeason, sameness, SIGNATURES } from '../js/ss/twists.js';
import { castRole, playRole, accuseRole } from '../js/ss/signatures.js';
import { openKitties, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom, seededRandom } from './helpers/rng.js';

const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo'];

describe('the randomizer', () => {
  it('only draws signatures the engine plays', () => {
    for (let s = 1; s <= 60; s++) { const d = drawSeason({ rng: rngFor(s) }); if (d.signature) expect(SIGNATURES.find(x => x.id === d.signature).built).toBe(true); }
  });
  it('a new season is never a copy of a past one, and never repeats last season\'s signature', () => {
    const past = [];
    for (let s = 1; s <= 12; s++) {
      const d = drawSeason({ rng: rngFor(s), past });
      for (const p of past) expect(sameness(d, p)).toBeLessThan(1);
      if (past.length && d.signature) expect(d.signature).not.toBe(past[past.length - 1].signature);
      past.push(d);
    }
  });
  it('locks pin a piece', () => {
    const d = drawSeason({ rng: rngFor(4), locks: { signature: 'thieves', secretRoom: 'off' } });
    expect(d.signature).toBe('thieves');
    expect(d.tools.secretRoom).toBe('off');
    expect(d.secretRoomWeek).toBe(null);
  });
});

describe('the signature roles', () => {
  const ctxOf = (seed, over = {}) => ({ rng: rngFor(seed), week: 3, stat: (n, k) => over.stats?.[n]?.[k] ?? 5, bond: over.bond || (() => 0) });
  it('the masters add a nominee every week, and the money never moves', () => {
    const st = {}; openKitties(st, H);
    castRole(st, ctxOf(1), { signature: 'masters', house: H });
    const act = playRole(st, ctxOf(2), { house: H });
    expect(st.rules.dOffice[3]).toContain(act.target);
    expect(st.role.pair).not.toContain(act.target);
  });
  it('the thieves start at zero, steal, and the ledger stays honest', () => {
    const st = {}; openKitties(st, H);
    castRole(st, ctxOf(1), { signature: 'thieves', house: H });
    for (const p of st.role.pair) expect(st.kitty[p]).toBe(0);
    playRole(st, ctxOf(2), { house: H });
    expect(st.role.pair.reduce((s, p) => s + st.kitty[p], 0)).toBeGreaterThan(0);
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
  it('the sharp unmask the pair in time; a wrong accusation costs the accuser', () => {
    let unmasked = 0, wrong = 0;
    for (let s = 1; s <= 30; s++) {
      const st = {}; openKitties(st, H);
      castRole(st, ctxOf(s), { signature: 'masters', house: H });
      for (let w = 1; w <= 8 && st.role.active; w++) {
        playRole(st, { ...ctxOf(s * 10 + w, { stats: Object.fromEntries(H.map(n => [n, { intuition: 8 }])) }), week: w }, { house: H });
        const acc = accuseRole(st, { ...ctxOf(s * 100 + w), week: w }, { house: H });
        if (acc?.right) unmasked++;
        if (acc && !acc.right) { wrong++; expect(acc.paid).toBeGreaterThan(0); }
      }
      expect(actualTotal(st)).toBe(expectedTotal(st));
    }
    expect(unmasked).toBeGreaterThan(10);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Duncan', 'Gwen'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'hothead'][i % 7] }));

describe('a season with a signature, and its launch night', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: undefined, ssSignature: 'masters' });
  withSeededRandom(5, () => { for (let n = 0; n < 4; n++) simulateBBEpisode(); });
  const rows = gs.episodeHistory;
  it('draws the season and plays the masters every week', () => {
    expect(gs.bb.secretStory.draw.signature).toBe('masters');
    expect(rows.some(r => (r.acts || []).some(a => a.type === 'ss-role'))).toBe(true);
  });
  it('launch night is a full episode: every arrival, every secret to the public, the commandments, the role', () => {
    const screens = bbWeekSteps(rows[0], { host: 'Josh' });
    const launch = screens.filter(s => /^bb-ss-(launch|secrets)/.test(s.id || ''));
    const text = launch.flatMap(s => s.steps.map(x => x.t)).join(' ');
    for (const n of NAMES) expect(text, n).toContain(`${n}`);
    expect(launch.reduce((s, x) => s + x.steps.length, 0)).toBeGreaterThan(80);
    expect(text).toMatch(/Masters of the Nominations/);
    expect(text).toMatch(/Never reveal your secret to another housemate/);
    expect(text).not.toMatch(/undefined|NaN|houseguest|Head of Household/);
  });
});
