// What a cast carries in from their lives.
//
// Design: docs/superpowers/specs/2026-08-18-life-carryover-design.md
import { describe, expect, it } from 'vitest';
import { lifeSeeds, CARRY, ENDED, arrivalLine, soloLine } from '../js/life-cast.js';

const SEASONS = [
  { seasonId: 'td-1', airYear: 2020, airSlot: 'spring' },
  { seasonId: 'td-2', airYear: 2020, airSlot: 'fall' },
  { seasonId: 'td-3', airYear: 2021, airSlot: 'spring' },
];
const cast = (...names) => names.map(n => ({ name: n[0].toUpperCase() + n.slice(1), slug: n }));
const ev = (player, kind, extra = {}) => ({ player, kind, afterSeason: 'td-1', seq: 1,
  status: 'approved', ...extra });

describe('couples both cast', () => {
  it('seeds one bond and one showmance for the pair, not one each', () => {
    const out = lifeSeeds(cast('alejandro', 'lindsay'),
      [ev('alejandro', 'dating', { whom: 'lindsay' })], SEASONS);
    expect(out.pairs).toHaveLength(1);
    expect(out.showmances).toHaveLength(1);
    expect(out.pairs[0].bondDelta).toBe(CARRY.dating);
  });

  it('weighs a marriage more heavily than dating', () => {
    const log = [ev('alejandro', 'dating', { whom: 'lindsay' }),
      ev('alejandro', 'wedding', { whom: 'lindsay', seq: 2 })];
    const out = lifeSeeds(cast('alejandro', 'lindsay'), log, SEASONS);
    expect(out.pairs[0].bondDelta).toBe(CARRY.married);
  });

  it('adds for a child, the one thing off the relationship track that carries', () => {
    const log = [ev('alejandro', 'dating', { whom: 'lindsay' }),
      ev('alejandro', 'birth', { seq: 2 })];
    const out = lifeSeeds(cast('alejandro', 'lindsay'), log, SEASONS);
    expect(out.pairs[0].bondDelta).toBe(CARRY.dating + CARRY.child);
    expect(out.showmances[0].kids).toBe(1);
  });

  it('names the reason, so the seeded bond can be explained', () => {
    const out = lifeSeeds(cast('alejandro', 'lindsay'),
      [ev('alejandro', 'moved-in', { whom: 'lindsay' })], SEASONS);
    expect(out.pairs[0].reason).toBe('Living together');
  });
});

describe('cast without their partner', () => {
  it('records who is at home rather than seeding nothing', () => {
    // Lindsay is not in this cast. That is the test the whole design is about.
    const out = lifeSeeds(cast('alejandro'),
      [ev('alejandro', 'moved-in', { whom: 'lindsay' })], SEASONS);
    expect(out.pairs).toHaveLength(0);
    expect(out.showmances).toHaveLength(0);
    expect(out.soloPartners).toEqual([
      { name: 'Alejandro', whom: 'lindsay', whomName: 'Lindsay', stage: 'living-together' },
    ]);
  });

  it('makes a readable name out of a hyphenated slug', () => {
    const out = lifeSeeds(cast('owen'), [ev('owen', 'dating', { whom: 'mary-jane' })], SEASONS);
    expect(out.soloPartners[0].whomName).toBe('Mary Jane');
  });
});

describe('exes', () => {
  it('seeds a negative bond when both are cast again', () => {
    const log = [ev('alejandro', 'dating', { whom: 'lindsay' }),
      ev('alejandro', 'broke-up', { whom: 'lindsay', seq: 2 })];
    const out = lifeSeeds(cast('alejandro', 'lindsay'), log, SEASONS);
    expect(out.pairs).toHaveLength(1);
    expect(out.pairs[0].bondDelta).toBe(ENDED['broke-up']);
    expect(out.showmances).toHaveLength(0);
  });

  it('fades an old break-up, since it is a fact rather than a live wound', () => {
    const log = [
      ev('alejandro', 'dating', { whom: 'lindsay' }),
      ev('alejandro', 'broke-up', { whom: 'lindsay', seq: 2 }),
      // two newer off-seasons, so the break-up is two gaps back
      ev('owen', 'hobby', { afterSeason: 'td-2' }),
      ev('owen', 'hobby', { afterSeason: 'td-3' }),
    ];
    const out = lifeSeeds(cast('alejandro', 'lindsay'), log, SEASONS);
    expect(Math.abs(out.pairs[0].bondDelta)).toBeLessThan(Math.abs(ENDED['broke-up']));
  });

  it('ignores an ex they got back together with', () => {
    const log = [
      ev('alejandro', 'dating', { whom: 'lindsay' }),
      ev('alejandro', 'broke-up', { whom: 'lindsay', seq: 2 }),
      ev('alejandro', 'dating', { whom: 'lindsay', afterSeason: 'td-2', seq: 1 }),
    ];
    const out = lifeSeeds(cast('alejandro', 'lindsay'), log, SEASONS);
    expect(out.pairs.every(p => p.kind !== 'life-ex')).toBe(true);
    expect(out.showmances).toHaveLength(1);
  });
});

describe('what it refuses to do', () => {
  it('reads only approved rows, so a proposal cannot change a season', () => {
    const out = lifeSeeds(cast('alejandro', 'lindsay'),
      [ev('alejandro', 'dating', { whom: 'lindsay', status: 'proposed' })], SEASONS);
    expect(out.pairs).toHaveLength(0);
  });

  it('returns empty everything with no log, rather than throwing', () => {
    expect(lifeSeeds(cast('alejandro'), [], SEASONS))
      .toEqual({ pairs: [], showmances: [], soloPartners: [] });
  });

  it('carries nothing mechanical off a job, a house or a degree', () => {
    const log = [ev('alejandro', 'new-job'), ev('alejandro', 'bought-home'),
      ev('alejandro', 'graduated')];
    const out = lifeSeeds(cast('alejandro', 'lindsay'), log, SEASONS);
    expect(out).toEqual({ pairs: [], showmances: [], soloPartners: [] });
  });
});

describe('the sentences', () => {
  it('takes its vocabulary from the show rather than saying "camp"', () => {
    const line = arrivalLine({ players: ['Ali', 'Bo'], stage: 'dating' },
      { players: 'houseguests' });
    expect(line).toContain('houseguests');
    expect(line).not.toMatch(/camp/i);
  });

  it('says outright when a couple arrived married', () => {
    expect(arrivalLine({ players: ['Ali', 'Bo'], stage: 'married' }, {}))
      .toBe('Ali and Bo arrived married.');
  });

  it('phrases around gender rather than guessing at it', () => {
    const lines = ['married', 'engaged', 'dating']
      .map(stage => soloLine({ name: 'Ali', whomName: 'Bo', stage }));
    for (const l of lines) expect(l).not.toMatch(/fianc|husband|wife|girlfriend|boyfriend/i);
  });
});
