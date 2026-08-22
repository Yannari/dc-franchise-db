import { describe, it, expect } from 'vitest';
import { auditLife, repairLife } from '../js/life-consistency.js';

/* A calendar: four off-seasons in order. */
const RANK = new Map([['s1', 10], ['s2', 20], ['s3', 30], ['s4', 40]]);
const ev = (player, kind, afterSeason, extra = {}) =>
  ({ player, kind, afterSeason, seq: 1, status: 'approved', ...extra });

describe('two relationships at once', () => {
  // The bug this file was written for: Alejandro started seeing Bridgette,
  // started seeing Lindsay six seasons later, and the record did not close the
  // first one until three years after the second began.
  const log = [
    ev('alejandro', 'dating', 's1', { whom: 'bridgette' }),
    ev('alejandro', 'dating', 's2', { whom: 'lindsay' }),
    ev('alejandro', 'moved-in', 's3', { whom: 'lindsay' }),
    ev('bridgette', 'quietly-ended', 's4', { whom: 'alejandro' }),
  ];

  it('sees the overlap', () => {
    const found = auditLife(log, { seasonRank: RANK });
    expect(found.some(p => p.fix === 'end-the-first' && p.with === 'bridgette')).toBe(true);
  });

  it('re-dates the ending rather than deleting a relationship', () => {
    const { events, changes } = repairLife(log, { seasonRank: RANK });
    // Nothing is lost: both relationships still happened.
    expect(events).toHaveLength(4);
    const ended = events.find(e => e.kind === 'quietly-ended');
    expect(ended.afterSeason).toBe('s2');
    expect(changes.some(c => c.kind === 'redated')).toBe(true);
    expect(auditLife(events, { seasonRank: RANK })).toHaveLength(0);
  });

  it('writes the ending when there is none at all', () => {
    const open = log.slice(0, 3);
    const { events } = repairLife(open, { seasonRank: RANK });
    const closed = events.find(e => e.kind === 'quietly-ended');
    expect(closed).toBeTruthy();
    expect([closed.player, closed.whom].sort()).toEqual(['alejandro', 'bridgette']);
  });
});

describe('a position you are not standing in', () => {
  it('will not let somebody resign from a job they were laid off from', () => {
    const log = [ev('tyler', 'laid-off', 's1'), ev('tyler', 'quit-job', 's2')];
    const found = auditLife(log, { seasonRank: RANK });
    expect(found).toHaveLength(1);
    expect(found[0].event.kind).toBe('quit-job');
    const { events } = repairLife(log, { seasonRank: RANK });
    expect(events.map(e => e.kind)).toEqual(['laid-off']);
  });

  it('lets them resign once they have a job again', () => {
    const log = [ev('tyler', 'laid-off', 's1'), ev('tyler', 'new-job', 's2'),
      ev('tyler', 'quit-job', 's3')];
    expect(auditLife(log, { seasonRank: RANK })).toHaveLength(0);
  });

  it('starts everybody employed, because the roster gives them a job', () => {
    expect(auditLife([ev('owen', 'quit-job', 's1')], { seasonRank: RANK })).toHaveLength(0);
  });

  it('will not graduate somebody who never enrolled', () => {
    const found = auditLife([ev('noah', 'graduated', 's1')], { seasonRank: RANK });
    expect(found[0].why).toMatch(/education/);
  });

  it('drops a second one-off and an answer with no question', () => {
    const log = [ev('dwayne', 'bankruptcy', 's1'), ev('dwayne', 'bankruptcy', 's2'),
      ev('ezekiel', 'sober', 's1')];
    const { events } = repairLife(log, { seasonRank: RANK });
    expect(events.filter(e => e.kind === 'bankruptcy')).toHaveLength(1);
    expect(events.some(e => e.kind === 'sober')).toBe(false);
  });
});

describe('the log that ships', () => {
  it('has nothing impossible left in it', async () => {
    const fs = await import('node:fs');
    const { airKey } = await import('../js/franchise-calendar.js');
    const log = JSON.parse(fs.readFileSync('life_events.json', 'utf8')).events;
    const seasons = JSON.parse(fs.readFileSync('seasons_database.json', 'utf8')).seasons;
    const rank = new Map(seasons.map(x => [x.seasonId, airKey(x)]));
    expect(auditLife(log, { seasonRank: rank })).toEqual([]);
  });
});
