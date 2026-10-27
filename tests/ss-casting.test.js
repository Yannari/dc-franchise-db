// Casting the House of Secrets: every housemate's secret on the cast screen,
// real history offered and never imposed, and who would recognise whom.
// Spec: docs/superpowers/specs/2026-10-27-secret-story-show-design.md
import { describe, it, expect } from 'vitest';
import { SECRET_POOL, SECRET_KINDS, KIND_KIT, drawSecret } from '../js/ss/secret-pool.js';
import { castSecrets, rerollSecret, writtenSecret, historySecretOptions, recognitions, resolveNominationRule } from '../js/ss/casting.js';
import { withSeededRandom } from './helpers/rng.js';

const P = (name, archetype = 'floater', stats = {}) => ({ name, archetype, stats });

describe('the secret pool', () => {
  it('holds enough secrets for three newbie casts, none twice', () => {
    expect(SECRET_POOL.length).toBeGreaterThanOrEqual(60);
    expect(new Set(SECRET_POOL.map(s => s.id)).size).toBe(SECRET_POOL.length);
    expect(new Set(SECRET_POOL.map(s => s.text)).size).toBe(SECRET_POOL.length);
  });
  it('gives every secret something to hunt with', () => {
    const kinds = new Set(SECRET_KINDS.map(k => k.id));
    for (const s of SECRET_POOL) {
      expect(kinds.has(s.kind), s.id).toBe(true);
      expect(s.clues.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.tells.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.difficulty).toBeGreaterThan(0);
      expect(s.difficulty).toBeLessThan(1);
    }
    for (const k of kinds) expect(KIND_KIT[k], k).toBeTruthy();
  });
  it('never names a real brand, team or celebrity', () => {
    const text = JSON.stringify(SECRET_POOL);
    // A capitalised word mid-sentence would be a proper noun; the pool has none.
    const proper = [...text.matchAll(/[a-z,] ([A-Z][a-z]+)/g)].map(m => m[1]).filter(w => !['I'].includes(w));
    expect(proper).toEqual([]);
  });
  it('never draws a secret already taken', () => {
    const taken = new Set(SECRET_POOL.slice(1).map(s => s.id));
    expect(drawSecret(P('A'), { taken }).id).toBe(SECRET_POOL[0].id);
    expect(drawSecret(P('A'), { taken: new Set(SECRET_POOL.map(s => s.id)) })).toBeNull();
  });
});

describe('the cast screen', () => {
  const cast = [P('Ana', 'mastermind', { mental: 9 }), P('Ben', 'hero'), P('Cy'),
    { ...P('Di'), secret: { id: 'chess', kind: 'talent', text: 'I am a chess grandmaster', clues: ['a'], tells: ['b'], difficulty: 0.4, firstSeason: 'ss-1' } }];

  it('gives everybody a secret, different from each other', () => {
    const map = withSeededRandom(3, () => castSecrets(cast));
    expect(Object.keys(map).sort()).toEqual(['Ana', 'Ben', 'Cy', 'Di']);
    const ids = Object.values(map).map(e => e.id);
    expect(new Set(ids).size).toBe(4);
  });
  it('keeps a canon secret locked, and never draws it for anybody else', () => {
    const map = withSeededRandom(3, () => castSecrets(cast));
    expect(map.Di).toMatchObject({ source: 'canon', text: 'I am a chess grandmaster', firstSeason: 'ss-1' });
    expect(Object.entries(map).filter(([n, e]) => n !== 'Di' && e.id === 'chess')).toEqual([]);
  });
  it('keeps the user\'s choices when it redraws the rest', () => {
    const own = writtenSecret('I once ate a whole wedding cake alone', 'record');
    const map = withSeededRandom(4, () => castSecrets(cast, { existing: { Ben: own } }));
    expect(map.Ben).toMatchObject({ source: 'own', kind: 'record', text: 'I once ate a whole wedding cake alone' });
    expect(map.Ben.clues.length).toBeGreaterThan(0);
  });
  it('rerolls one housemate without touching anybody else', () => {
    const map = withSeededRandom(5, () => castSecrets(cast));
    const fresh = withSeededRandom(6, () => rerollSecret(cast[0], map));
    expect(fresh.source).toBe('pool');
    expect(Object.values(map).map(e => e.id)).not.toContain(fresh.id);
  });
  it('refuses an empty secret', () => {
    expect(writtenSecret('   ', 'job')).toBeNull();
  });
});

describe('real history, offered and never imposed', () => {
  it('offers a tie to somebody in the house, and a past show', () => {
    const opts = historySecretOptions('Ana', {
      cast: ['Ana', 'Ben'],
      pairs: [{ a: 'Ana', b: 'Ben', kin: 'siblings' }, { a: 'Ana', b: 'Zed', kin: 'exes' }],
      career: [{ where: 'Total Drama 3', rec: { winner: true } }],
    });
    expect(opts.map(o => o.text)).toEqual(['We are brother and sister', 'I have already won Total Drama 3']);
    expect(opts[0].pair).toBe('Ben');
  });
  it('the default draw ignores history', () => {
    const map = withSeededRandom(1, () => castSecrets([P('Ana'), P('Ben')]));
    expect(map.Ana.source).toBe('pool');
  });
});

describe('who recognises whom', () => {
  const careers = {
    Ana: [{ where: 'Total Drama 3', format: 'total-drama', num: 3 }],
    Ben: [{ where: 'Total Drama 3', format: 'total-drama', num: 3 }],
    Cy: [{ where: 'Big Brother 1', format: 'big-brother', num: 1 }],
  };
  it('knows the people they played with, and says from where', () => {
    const r = withSeededRandom(2, () => recognitions(['Ana', 'Ben', 'Cy', 'Di'], { careers }));
    expect(r).toContainEqual({ who: 'Ana', whom: 'Ben', from: 'Total Drama 3', shared: true });
    expect(r).toContainEqual({ who: 'Ben', whom: 'Ana', from: 'Total Drama 3', shared: true });
  });
  it('recognises a famous face more often than an unknown one', () => {
    const many = Array.from({ length: 40 }, (_, i) => `N${i}`);
    const r = withSeededRandom(9, () => recognitions([...many, 'Cy'], { careers, fame: { Cy: 1 } }));
    const ofCy = r.filter(x => x.whom === 'Cy' && x.famous).length;
    expect(ofCy).toBeGreaterThan(10);
    expect(r.every(x => x.whom === 'Cy')).toBe(true);
  });
});

describe('the nomination rule', () => {
  it('keeps a chosen rule and draws one for random', () => {
    expect(resolveNominationRule('gendered')).toBe('gendered');
    expect(resolveNominationRule('mixed')).toBe('mixed');
    expect(['gendered', 'mixed']).toContain(resolveNominationRule('random', () => 0.2));
  });
});
