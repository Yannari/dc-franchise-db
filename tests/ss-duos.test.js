// Duo secrets (the user, 2026-10-28: "couple secrets are one of the most common: the struggle to hide your
// relationship to protect your secret is one of the most common storylines"). The pool of shared secrets, the draw
// that casts a real couple most seasons, and the week of hiding it: stolen moments, jealousy, slips.
import { describe, expect, it } from 'vitest';
import { DUO_POOL, duoSecret, drawDuo, duoRel } from '../js/ss/duos.js';
import { coupleWeek } from '../js/ss/couples.js';
import { openKitties } from '../js/ss/kitty.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST6 = [{ name: 'Ana', gender: 'f' }, { name: 'Ben', gender: 'm' }, { name: 'Cy', gender: 'm' }, { name: 'Di', gender: 'f' }, { name: 'Ed', gender: 'm' }, { name: 'Fi', gender: 'f' }];
describe('the duo secrets', () => {
  it('a pool of couples, families and friends, each with clues and tells', () => {
    for (const r of ['romance', 'family', 'friends']) expect(DUO_POOL.filter(d => d.rel === r).length).toBeGreaterThanOrEqual(2);
    for (const d of DUO_POOL) { expect(d.clues.length).toBeGreaterThanOrEqual(2); expect(d.tells.length).toBeGreaterThanOrEqual(1); }
  });
  it('a duo is one secret, kept by both, worded for who they are', () => {
    const e = duoSecret(DUO_POOL.find(d => d.id === 'duo-siblings'), CAST6[0], CAST6[1]);
    expect(e.Ana).toMatchObject({ pair: 'Ben', text: 'We are brother and sister' });
    expect(e.Ben).toMatchObject({ pair: 'Ana', text: 'We are brother and sister' });
    expect(duoSecret(DUO_POOL.find(d => d.id === 'duo-siblings'), CAST6[1], CAST6[2]).Ben.text).toBe('We are brothers');
    expect(e.Ana.tells.join(' ')).toContain('Ben');
    expect(duoRel(e.Ana)).toBe('family');
  });
  it('the draw casts a couple only between two who could be one', () => {
    const compat = (a, b) => (a === 'Ana' && b === 'Ben') || (a === 'Ben' && b === 'Ana');
    const d = drawDuo(CAST6, { rng: () => 0.01, compat, rel: 'romance' });
    expect([d.a.name, d.b.name].sort()).toEqual(['Ana', 'Ben']);
    expect(drawDuo(CAST6, { rng: () => 0.01, compat: () => false, rel: 'romance' })).toBe(null);
  });
});

const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
const ctx = (r = 0.5, over = {}) => ({ rng: () => r, week: 2, stat: () => 5, bond: () => 0, compat: () => true, ...over });
const st = rel => {
  const s = { secrets: [{ id: 'duo', kind: 'real-pair', holders: ['Ana', 'Ben'], text: rel === 'romance' ? 'We are a couple' : 'We are cousins', clues: ['a', 'b'], tells: [], difficulty: 0.55 },
    ...['Cy', 'Di', 'Ed', 'Fi'].map(n => ({ id: n, kind: 'personal', holders: [n], text: n, clues: ['c'], difficulty: 0.5 }))] };
  openKitties(s, H, 10000, 0);
  return s;
};
describe('a couple hiding it, every week', () => {
  it('a stolen moment brings them closer, and somebody may catch it', () => {
    const s = st('romance');
    const evs = coupleWeek(s, ctx(0.01, { pick: 'stolen' }), { house: H });
    const ev = evs.find(e => e.kind === 'stolen');
    expect(ev).toBeTruthy();
    expect(ev.effects.bond.some(([a, b, d]) => [a, b].sort().join() === 'Ana,Ben' && d > 0)).toBe(true);
    expect(ev.caughtBy).toBeTruthy();
    expect(s.theories?.[ev.caughtBy]?.Ana || s.theories?.[ev.caughtBy]?.Ben).toBeTruthy();
  });
  it('jealousy: somebody flirts with one of them, and the other has to watch', () => {
    const s = st('romance');
    const ev = coupleWeek(s, ctx(0.5, { pick: 'jealous' }), { house: H }).find(e => e.kind === 'jealous');
    expect(ev.flirt).toBeTruthy();
    expect(['Ana', 'Ben']).not.toContain(ev.flirt);
    expect(ev.effects.bond.some(([, , d]) => d < 0)).toBe(true);
  });
  it('family and friends have their own weeks, and a found secret has none', () => {
    const s = st('family');
    const evs = coupleWeek(s, ctx(0.5), { house: H });
    expect(evs.every(e => ['defend', 'joke', 'care'].includes(e.kind))).toBe(true);
    s.secrets[0].found = true;
    expect(coupleWeek(s, ctx(0.5), { house: H })).toEqual([]);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('a real couple in a season', () => {
  it('is set up on launch night, hides it every week on screen, and the words are clean', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off',
      ssSecrets: duoSecret(DUO_POOL.find(d => d.id === 'duo-couple'), CAST[0], CAST[1]) });
    withSeededRandom(4, () => { for (let i = 0; i < 4; i++) simulateBBEpisode(); });
    delete seasonConfig.ssSecrets;
    const s = gs.bb.secretStory;
    expect(s.secrets.find(x => x.holders.includes('Bowie'))).toMatchObject({ kind: 'real-pair', holders: ['Bowie', 'Chase'] });
    const acts = gs.episodeHistory.flatMap(r => r.acts.filter(a => a.type === 'ss-duo'));
    expect(acts.length).toBeGreaterThanOrEqual(2);
    const all = gs.episodeHistory.flatMap(r => bbWeekSteps(r, { host: 'Josh' }));
    const text = all.flatMap(sc => sc.steps.map(x => String(x.t || '')));
    expect(text.some(t => /never met|not one look/i.test(t))).toBe(true);
    for (const a of acts) expect(text.some(t => t.includes('Bowie') && t.includes('Chase'))).toBe(true);
    expect(text.filter(t => /\bundefined\b|\bNaN\b|\[object/.test(t))).toEqual([]);
  });
});
