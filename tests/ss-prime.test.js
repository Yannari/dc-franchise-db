// The prime: a full episode every week (the user, 2026-10-27: "prime are full
// episode so theyre not sometimes with 30 click like real full episodes").
// Part 2 design §10–§12.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { ringPhone, whoAnswers, roomOfTruths, revealOnExit, playPrime, primeName } from '../js/ss/prime.js';
import { runDilemma, DILEMMAS } from '../js/ss/dilemmas.js';
import { openKitties, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom, seededRandom } from './helpers/rng.js';

const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
const fresh = () => { const s = { secrets: H.map(n => ({ id: `s-${n}`, holders: [n], text: `secret of ${n}`, clues: ['a clue', 'another clue'], found: false })), theories: {}, buzzes: [] }; openKitties(s, H); return s; };
const ctxOf = (seed, over = {}) => ({ rng: rngFor(seed), week: 4, stat: (n, k) => over.stats?.[n]?.[k] ?? 5, bond: over.bond || (() => 0), archetype: () => 'floater', pop: () => 0 });

describe('the prime\'s segments', () => {
  it('the bold get to the red phone first', () => {
    let bold = 0;
    for (let s = 1; s <= 200; s++) if (whoAnswers(ctxOf(s, { stats: { Ana: { boldness: 10 } } }), H) === 'Ana') bold++;
    expect(bold).toBeGreaterThan(70);
  });
  it('every phone message and dilemma keeps the money honest', () => {
    for (let s = 1; s <= 120; s++) {
      const st = fresh();
      const c = ctxOf(s, { bond: (a, b) => (a < b ? -3 : 4) });
      ringPhone(st, c, { house: H });
      runDilemma(st, c, { to: H[s % 6], house: H });
      expect(actualTotal(st)).toBe(expectedTotal(st));
    }
  });
  it('every dilemma can be built and has two options', () => {
    const st = fresh();
    const c = ctxOf(3, { bond: (a, b) => (a === 'Ana' && b === 'Ben' ? 8 : a === 'Ana' ? -4 : 0) });
    st.kitty.Ben = 30000;
    for (const d of DILEMMAS) {
      const b = d.build(fresh(), c, 'Ana', H);
      if (!b) continue;
      expect(b.text.length, d.id).toBeGreaterThan(20);
      expect(b.yes.label && b.no.label, d.id).toBeTruthy();
    }
  });
  it('the room of truths plays the tapes of the people who talk behind your back', () => {
    const t = roomOfTruths(fresh(), ctxOf(1, { bond: (a, b) => (b === 'Cy' ? -4 : 1) }), { house: H });
    expect(t.subject).toBe('Cy');
    expect(t.talkers.length).toBeGreaterThan(0);
    expect(t.effects.bond.every(([a]) => a === 'Cy')).toBe(true);
  });
  // (the user, 2026-10-31: "they only revealed their secret to the public not the housemates")
  it('a secret nobody found is told on the set, to the public: shared, it stays hidden in the house with its partner', () => {
    const st = fresh();
    st.secrets[0].holders = ['Ana', 'Ben'];
    st.theories = { Cy: { Ana: { text: 'secret of Ana', right: true, conf: 0.6 } }, Di: { Ana: { text: 'x', right: false, conf: 0.5 } } };
    const r = revealOnExit(st, { evicted: 'Ana', house: H.filter(n => n !== 'Ana'), week: 4 });
    expect(r.alreadyFound).toBe(false);
    expect(r.right).toEqual(['Cy']);
    expect(r.wrong).toEqual(['Di']);
    expect(r.partners).toEqual(['Ben']);
    expect(st.secrets[0].found).toBe(false);
    expect(st.secrets[0].revealedOnExit).toBe(4);
    expect(st.theories.Cy.Ana).toBeUndefined();
  });
  it('a secret nobody found, held alone, is out once its holder leaves', () => {
    const st = fresh();
    const r = revealOnExit(st, { evicted: 'Ana', house: H.filter(n => n !== 'Ana'), week: 4 });
    expect(r.partners).toEqual([]);
    expect(st.secrets[0].found).toBe(true);
    expect(st.secrets[0].foundBy).toBe(null);
  });
  it('the night is named from what happens in it', () => {
    expect(primeName([{ kind: 'phone' }])).toBe('The Red Phone');
    expect(primeName([{ kind: 'dilemma' }, { kind: 'dilemma' }])).toBe('The Night of Dilemmas');
  });
  it('a prime always has at least one segment after the first week', () => {
    for (let s = 1; s <= 40; s++) {
      const p = playPrime(fresh(), { ...ctxOf(s), week: 3 }, { house: H, nominees: ['Ed', 'Fi'] });
      expect(p.segments.length).toBeGreaterThan(0);
    }
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));

describe('a prime on screen', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined });
  withSeededRandom(11, () => { for (let n = 0; n < 4; n++) simulateBBEpisode(); });
  const rows = (gs.episodeHistory || []).filter(r => (r.acts || []).some(a => a.type === 'ss-prime'));

  it('every week has a prime, and its secret reveal and After Secret after the verdict', () => {
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      const types = r.acts.map(a => a.type);
      expect(types.indexOf('ss-prime')).toBeLessThan(types.indexOf('eviction'));
      expect(types.indexOf('ss-after')).toBeGreaterThan(types.indexOf('eviction'));
    }
  });

  it('the prime is a full episode: many screens, a hundred-odd clicks, no Big Brother words', () => {
    for (const r of rows) {
      const screens = bbWeekSteps(r, { host: 'Josh' });
      const prime = screens.filter(s => /^bb-ss-(prime|after)/.test(s.id || ''));
      const clicks = prime.reduce((s, x) => s + (x.steps || []).length, 0);
      expect(prime.length, `week ${r.num}`).toBeGreaterThanOrEqual(6);
      expect(clicks, `week ${r.num}`).toBeGreaterThanOrEqual(60);
      const text = prime.flatMap(s => s.steps.map(x => x.t)).join(' ');
      expect(text).not.toMatch(/\b(houseguests?|Head of Household|veto|evict(ed|ion)?|jury|Diary Room)\b/i);
      expect(text).not.toMatch(/undefined|NaN|\[object/);
      const hosts = new Set(prime.flatMap(s => s.steps.filter(x => x.k === 'host').map(x => x.by)));
      expect([...hosts].sort()).toEqual(['Blaineley', 'Josh']);
    }
  });
});
