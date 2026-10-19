// An engagement the audience watched is not a probability (the user, 2026-10-19: a couple who said yes on the race's
// mat should be engaged after it). The race records the couple's stage (rr/export.js showmanceStage); the life hook
// hands the season's engaged couples to the resolver, which records the engagement that off-season, like a breakup
// seen on screen ends a relationship.
import { describe, it, expect } from 'vitest';
import { resolveOffSeason } from '../js/life-resolver.js';

describe('an engagement on screen', () => {
  const season = { seasonId: 'rr-2', format: 'ridonculous-race', number: 2 };
  const careers = [{ id: 'ida', name: 'Ida' }, { id: 'bo', name: 'Bo' }];
  const people = new Map(Object.entries({ ida: { gender: 'f', sexuality: 'straight' }, bo: { gender: 'm', sexuality: 'straight' } }));
  const seasonRank = () => new Map([['rr-1', 1], ['rr-2', 2]]);
  const run = (events, extra, n = 20) => Array.from({ length: n }, (_, i) =>
    resolveOffSeason({ season, careers, events, cast: ['ida', 'bo'], people, seedSalt: 'e' + i, seasonRank: seasonRank(), ...extra }));

  it('a couple dating in their life who got engaged on screen are engaged after it, every time', () => {
    const dating = [{ id: 'e1', player: 'ida', whom: 'bo', kind: 'dating', status: 'approved', seasonId: 'rr-1', seq: 1 }];
    for (const out of run(dating, { pairs: [['ida', 'bo']], engagedPairs: [['ida', 'bo']] })) {
      const e = out.filter(x => x.kind === 'engaged');
      expect(e.length).toBe(1);
      expect([e[0].player, e[0].whom].sort()).toEqual(['bo', 'ida']);
      expect(out.some(x => ['broke-up', 'quietly-ended', 'separated'].includes(x.kind))).toBe(false);
    }
  });

  it('two people who met on the show and got engaged on it arrive engaged', () => {
    for (const out of run([], { pairs: [['ida', 'bo']], engagedPairs: [['ida', 'bo']] })) {
      expect(out.filter(x => x.kind === 'engaged').length).toBe(1);
    }
  });

  it('a married couple are not engaged again', () => {
    const married = [{ id: 'e1', player: 'ida', whom: 'bo', kind: 'wedding', status: 'approved', seasonId: 'rr-1', seq: 1 }];
    for (const out of run(married, { pairs: [['ida', 'bo']], engagedPairs: [['ida', 'bo']] }, 5)) {
      expect(out.filter(x => x.kind === 'engaged').length).toBe(0);
    }
  });
});
