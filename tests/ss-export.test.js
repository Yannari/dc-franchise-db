// A Secret Story season publishes as ss-N, under its own show, beside Big Brother's.
// Spec: docs/superpowers/specs/2026-10-27-secret-story-show-design.md
import { describe, it, expect } from 'vitest';
import { mergeBigBrotherSeason, mergeBigBrotherSeasonsDatabase } from '../js/stats-export.js';
import { secretStoryExport } from '../js/bb/secret-story.js';

const state = {
  secrets: [
    { holders: ['Ana'], text: 'I survived a plane crash', kind: 'personal', found: true, foundBy: 'Ben', week: 3 },
    { holders: ['Ben'], text: 'I was a child chess champion', kind: 'personal', found: false, foundBy: null, week: null },
    { holders: ['Cy', 'Di'], text: 'We are a fake couple, cast by The Voice', kind: 'voice-pair', found: false, foundBy: null, week: null },
  ],
  kitty: { Ana: 0, Ben: 25000, Cy: 10000, Di: 5000 },
  buzzes: [
    { week: 2, by: 'Di', target: 'Ben', right: false },
    { week: 3, by: 'Ben', target: 'Ana', right: true, took: 10000 },
  ],
};

describe('secretStoryExport', () => {
  const out = secretStoryExport(state, { finalists: ['Ben', 'Cy'] });
  it('gives every housemate their secret, the hunt and the kitty', () => {
    expect(out.players.Ana).toMatchObject({ secret: 'I survived a plane crash', foundBy: 'Ben', foundWeek: 3, secretKept: 0, kitty: 0 });
    expect(out.players.Ben).toMatchObject({ secretsFound: 1, buzzesRight: 1, buzzesWrong: 0, secretKept: 1, kitty: 25000 });
    expect(out.players.Di).toMatchObject({ buzzesWrong: 1, secretKept: 0 });     // never found, but left before the end
    expect(out.players.Cy).toMatchObject({ secret: 'We are a fake couple, cast by The Voice', secretKept: 1 });
  });
  it('lists the secrets board', () => {
    expect(out.secrets).toHaveLength(3);
    expect(out.secrets[0]).toMatchObject({ holders: ['Ana'], found: true, foundBy: 'Ben', week: 3 });
  });
});

const doc = {
  format: 'secret-story', seasonNumber: 1, castSize: 4, episodeCount: 3,
  winner: { name: 'Ben' },
  placements: [
    { name: 'Ben', placement: 1, status: 'Winner', bb: { hohWins: 2, timesNominated: 1 }, ss: { secretsFound: 1, secretKept: 1, kitty: 25000 } },
    { name: 'Cy', placement: 2, status: 'Runner-up', bb: {}, ss: { secretKept: 1 } },
    { name: 'Ana', placement: 3, status: 'Eliminated', bb: {}, ss: {} },
  ],
};
const bbRow = { format: 'big-brother', seasonNumber: 1, seasonId: 'bb-1', title: 'Big Brother 1' };

describe('the seasons database', () => {
  const db = mergeBigBrotherSeasonsDatabase({ seasons: [bbRow] }, doc);
  it('files the season as ss-1 and leaves Big Brother 1 alone', () => {
    const row = db.seasons.find(s => s.format === 'secret-story');
    expect(row).toMatchObject({ seasonId: 'ss-1', title: 'Secret Story 1', jurySize: 0 });
    expect(db.seasons.find(s => s.seasonId === 'bb-1')).toBeTruthy();
  });
});

describe('the players database', () => {
  const db = mergeBigBrotherSeason({ players: [] }, doc);
  const ben = db.players.find(p => p.name === 'Ben');
  it('records the appearance under Secret Story with its own block', () => {
    const d = ben.seasonDetails[0];
    expect(d.format).toBe('secret-story');
    expect(d.ss).toMatchObject({ secretsFound: 1, secretKept: 1, kitty: 25000 });
    expect(d.challengeWins).toBe(2);
  });
  it('gives the winner an SS badge, not a BB one', () => {
    expect(ben.badges).toContain('SS1 Winner');
    expect(ben.badges).not.toContain('BB1 Winner');
  });
  it('files the career under Secret Story, not Big Brother', () => {
    expect(ben.byShow?.['secret-story']).toMatchObject({ seasons: 1, secretsFound: 1, secretsKept: 1 });
    expect(ben.byShow?.['big-brother']).toBeUndefined();
  });
});
