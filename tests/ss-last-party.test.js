// The final week's last party (js/ss/final.js finalParty): the user, 2026-10-29 — every eliminated housemate back
// one last time; a secret nobody heard is told; the showmance; the one who buzzed you; the grudges; who backs whom.
import { describe, expect, it } from 'vitest';
import { finalParty, validateKitties } from '../js/ss/final.js';
import { transfer, burn, mint } from '../js/ss/kitty.js';

const BONDS = { 'Ana|Bo': 6, 'Cy|Di': -6, 'Ana|Eve': -5, 'Bo|Fay': 3 };
const bond = (a, b) => BONDS[[a, b].sort().join('|')] ?? 0;
const ctx = (r = 0.5) => ({ rng: () => r, week: 12, bond, stat: () => 5 });
const mk = () => ({ secrets: [
  { holders: ['Cy'], text: 'I am a twin', found: false },                                      // walked out: never heard
  { holders: ['Di'], text: 'I was a dancer', found: true, foundBy: 'Ana', week: 4 },             // buzzed by a finalist
  { holders: ['Eve'], text: 'I survived a crash', kind: 'survived', found: true, foundBy: null, revealedOnExit: 6 },
  { holders: ['Ana'], text: 'I am a pilot', found: false, unveiled: 11 },
] });

describe('the last party', () => {
  it('brings back every eliminated housemate, and tells the secret nobody ever heard', () => {
    const state = mk();
    const p = finalParty(state, ctx(), { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'] });
    expect(p.guests).toEqual(['Cy', 'Di', 'Eve', 'Fay']);
    const sec = p.moments.filter(m => m.kind === 'secret');
    expect(sec.map(m => m.who)).toEqual(['Cy']);
    expect(state.secrets[0].found).toBe(true);
    expect(state.secrets[0].revealedAtParty).toBe(12);
    // a finalist's unveiled secret and a found one are not told again
    expect(p.moments.some(m => m.kind === 'secret' && m.who === 'Di')).toBe(false);
  });
  it('faces whoever buzzed you, and the story behind a secret told on the set', () => {
    const p = finalParty(mk(), ctx(), { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'] });
    expect(p.moments.find(m => m.kind === 'buzzed')).toMatchObject({ who: 'Di', with: 'Ana' });
    expect(p.moments.find(m => m.kind === 'story')?.who).toBe('Eve');
  });
  it('settles or reignites the worst grudge, and the calm make up more often', () => {
    const calm = finalParty(mk(), { ...ctx(0.3), stat: () => 10 }, { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'] });
    const hot = finalParty(mk(), { ...ctx(0.3), stat: () => 0 }, { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'] });
    // Eve and Ana (-5): Eve's grudge
    expect(calm.moments.find(m => m.who === 'Eve' && (m.kind === 'makeup' || m.kind === 'fight'))?.kind).toBe('makeup');
    expect(hot.moments.find(m => m.who === 'Eve' && (m.kind === 'makeup' || m.kind === 'fight'))?.kind).toBe('fight');
  });
  it('picks up a showmance, or puts a broken one to rest', () => {
    const on = finalParty(mk(), ctx(), { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'], couples: [{ a: 'Bo', b: 'Fay', broken: false }] });
    expect(on.moments.find(m => m.kind === 'lovers')).toMatchObject({ who: 'Fay', with: 'Bo' });
    const off = finalParty(mk(), ctx(0.99), { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'], couples: [{ a: 'Bo', b: 'Fay', broken: true }] });
    expect(off.moments.find(m => m.who === 'Fay' && m.with === 'Bo')?.kind).toBe('cold');
  });
  it('has every guest on good terms back a finalist, and every moment carries a consequence', () => {
    const p = finalParty(mk(), ctx(), { finalists: ['Ana', 'Bo'], eliminated: ['Cy', 'Di', 'Eve', 'Fay'] });
    expect(p.moments.find(m => m.kind === 'support' && m.who === 'Fay')?.with).toBe('Bo');
    for (const m of p.moments) expect((m.fx.bond || []).length + (m.fx.pub || []).length).toBeGreaterThan(0);
  });
});

describe('a validated kitty', () => {
  it('cannot be taken below what the semi-final validated', () => {
    const state = { kitty: { Ana: 30000, Bo: 5000 } };
    validateKitties(state, { house: ['Ana', 'Bo'], week: 11 });
    expect(burn(state, 'Ana', 10000, 'a fine')).toBe(0);
    expect(transfer(state, 'Ana', 'Bo', 10000, 'a steal')).toBe(0);
    mint(state, 'Ana', 4000, 'a game');
    expect(burn(state, 'Ana', 10000, 'a fine')).toBe(4000);
    expect(state.kitty.Ana).toBe(30000);
  });
});
