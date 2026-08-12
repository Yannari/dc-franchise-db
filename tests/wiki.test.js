// A character's page, assembled from what the databases already knew.
//
// Everything here existed and was shown nowhere: a per-season narrative for 150
// of 152 players, keyMoments on every season detail, the personality prose the
// episode writer reads, the records they hold. The page was a stat sheet
// standing on top of all of it.
//
// The rule under test throughout: SECTIONS WITH NO DATA ARE ABSENT, not padded.
// Sixteen players have recorded bonds and no published season carries a
// showmance yet, so a relationships block that invented something for everybody
// would be the most-read part of the page and the least true.
import { describe, expect, it, beforeAll } from 'vitest';
import { renderArticle } from '../js/wiki-view.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  splitStory, personalityOf, relationshipsOf, coupleStatus,
  careerOf, buildDossier, dossierFacts, dossierHash,
} from '../js/wiki.js';

const j = p => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'));
let players, voices, roster;

beforeAll(() => {
  players = j('players_database.json').players;
  voices = j('voice-profiles.json').profiles;
  roster = j('franchise_roster.json');
});

const find = id => players.find(p => p.id === id);

describe('the story, split back into seasons', () => {
  it('cuts a wall of text into a chapter per season', () => {
    const parts = splitStory('SEASON 1 — Cullhouse\nShe played hard.\nSEASON 2 — Action\nAnd again.');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({ season: 1, title: 'Cullhouse' });
    expect(parts[1].text).toBe('And again.');
  });

  it('drops the duplicated header the generator emits', () => {
    // Real data: "SEASON 1 — Cullhouse" appears twice in a row, the prose after
    // the second. Rendered raw that is the same title printed twice.
    const parts = splitStory('SEASON 1 — Cullhouse\nSEASON 1 — Cullhouse\nShe played hard.');
    expect(parts).toHaveLength(1);
    expect(parts[0].text).toBe('She played hard.');
  });

  it('keeps prose that has no headers at all', () => {
    expect(splitStory('Just a paragraph.'))
      .toEqual([{ season: null, title: null, text: 'Just a paragraph.' }]);
    expect(splitStory('')).toEqual([]);
  });

  it('reads the real stories without losing them', () => {
    const withStory = players.filter(p => (p.story || '').length > 200);
    expect(withStory.length).toBeGreaterThan(100);
    for (const p of withStory.slice(0, 20)) {
      expect(splitStory(p.story).length, `${p.name} lost their story`).toBeGreaterThan(0);
    }
  });
});

describe('personality', () => {
  it('is the prose, without the bio sentence prepended to it', () => {
    // "21, Asian Canadian, lesbian. Twin Sister of Harriett…" — the lead-in is
    // metadata, and left in the paragraph it reads as character.
    const jane = personalityOf('Jane', voices);
    expect(jane).not.toMatch(/^21,/);
    expect(jane).toMatch(/^Twin Sister/);
  });

  it('is empty for somebody with no profile, rather than undefined', () => {
    expect(personalityOf('Nobody At All', voices)).toBe('');
  });
});

describe('the career, grouped by show', () => {
  it('describes two shows as two careers', () => {
    const career = careerOf(find('bowie'));
    expect(career).toHaveLength(2);
    expect(career.find(c => c.show === 'Big Brother').count).toBe(1);
    expect(career.find(c => c.show === 'Total Drama').count).toBe(2);
  });

  it('attaches each season its own chapter and moments', () => {
    const td = careerOf(find('alejandro'))[0];
    expect(td.seasons.some(s => s.story)).toBe(true);
    expect(td.seasons.some(s => s.keyMoments.length)).toBe(true);
    expect(td.seasons.map(s => s.season))
      .toEqual([...td.seasons.map(s => s.season)].sort((a, b) => a - b));
  });
});

describe('relationships', () => {
  it('reads the bonds a season recorded', () => {
    const rel = relationshipsOf(find('alejandro'));
    expect(rel.bonds.map(b => b.name)).toContain('Cameron');
    expect(rel.any).toBe(true);
  });

  it('says nothing about couples until a season records one', () => {
    // THE RULE. No published season carries showmances — the export only just
    // started recording them — so a couple line must be absent rather than
    // guessed at from bonds.
    const rel = relationshipsOf(find('alejandro'), { seasonDocs: [] });
    expect(rel.showmances).toEqual([]);
    expect(coupleStatus(rel)).toBe(null);
  });

  it('reports a couple once a season document has one', () => {
    const doc = {
      seasonNumber: 4, format: 'total-drama',
      showmances: [{ players: ['Alejandro', 'Heather'], phase: 'showmance', startEpisode: 3 }],
      alliances: [{ name: 'The Snakes', members: ['Alejandro', 'Noah'] }],
    };
    const rel = relationshipsOf(find('alejandro'), { seasonDocs: [doc] });
    expect(coupleStatus(rel)).toMatchObject({ together: true, partner: 'Heather' });
    expect(rel.alliances[0].name).toBe('The Snakes');
  });

  it('reports a breakup as one, with how it ended', () => {
    const doc = {
      seasonNumber: 5, format: 'total-drama',
      showmances: [{ players: ['Alejandro', 'Heather'], phase: 'broken', endEpisode: 9, endedBy: 'vote' }],
    };
    expect(coupleStatus(relationshipsOf(find('alejandro'), { seasonDocs: [doc] })))
      .toMatchObject({ together: false, partner: 'Heather', endedBy: 'vote' });
  });
});

describe('the dossier', () => {
  it('assembles somebody who has everything', () => {
    const d = buildDossier(find('alejandro'), { voices, roster });
    expect(d.name).toBe('Alejandro');
    expect(d.personality.length).toBeGreaterThan(30);
    expect(d.career.length).toBeGreaterThan(0);
    expect(d.moments.length).toBeGreaterThan(5);
  });

  it('leaves the bio line out when nothing is known', () => {
    // Total Drama's cast predates the bio fields. An empty "· · ·" is worse
    // than no line at all.
    const d = buildDossier(find('alejandro'), { voices, roster });
    expect(d.bioLine).not.toMatch(/·\s*·/);
    expect(d.bioLine.startsWith('·')).toBe(false);
  });

  it('survives a player with nothing at all', () => {
    const d = buildDossier({ id: 'ghost', name: 'Ghost', seasonDetails: [] }, {});
    expect(d.career).toEqual([]);
    expect(d.moments).toEqual([]);
    expect(d.relationships.any).toBe(false);
    expect(buildDossier(null, {})).toBe(null);
  });
});

describe('what a writer would be handed', () => {
  // The prose should be WRITTEN rather than assembled — a bio is not a
  // personality profile plus a list of placements. But the model gets facts and
  // writes about them; anything it states that is not in here is an invention.
  it('carries what happened and nothing else', () => {
    const facts = dossierFacts(buildDossier(find('bowie'), { voices, roster }));
    expect(facts.name).toBe('Bowie');
    expect(facts.shows.map(s => s.show))
      .toEqual(expect.arrayContaining(['Total Drama', 'Big Brother']));
    expect(JSON.stringify(facts).length, 'the prompt bundle is too big to be cheap')
      .toBeLessThan(20000);
  });

  it('fingerprints the facts, so prose is written once and not per view', () => {
    const d = buildDossier(find('bowie'), { voices, roster });
    expect(dossierHash(d)).toBe(dossierHash(buildDossier(find('bowie'), { voices, roster })));

    // A career that changed must invalidate. That is the whole reason the hash
    // exists: regenerate when a season is published, not when somebody visits.
    const changed = JSON.parse(JSON.stringify(find('bowie')));
    changed.seasonDetails.push({ season: 15, placement: 1, format: 'big-brother' });
    expect(dossierHash(buildDossier(changed, { voices, roster }))).not.toBe(dossierHash(d));
  });
});

// ── the reference half of a character article ──────────────────────────
//
// A fandom page is half prose and half table, and only the prose half existed:
// seasonDetails has carried the competition numbers all along and careerOf
// dropped every one, so an article could describe a season at length and never
// say what the person did in it.
describe('the record an article is written from', () => {
  const player = {
    name: 'Ireland', id: 'ireland', story: '',
    seasonDetails: [
      { season: 4, format: 'big-brother', placement: 3, status: 'Juror',
        challengeWins: 3, votesReceived: 5, juryVotes: 2,
        bb: { hohWins: 1, vetoWins: 2, blockBusterWins: 3, blockBusterPlayed: 4,
              blockBusterStreak: 3, timesNominated: 5, timesOnBlock: 2, timesSaved: 1 } },
      { season: 6, format: 'big-brother', placement: 8, status: 'Juror',
        challengeWins: 0, votesReceived: 7, juryVotes: 0,
        bb: { hohWins: 0, vetoWins: 0, blockBusterWins: 1, blockBusterPlayed: 3,
              blockBusterStreak: 1, timesNominated: 4, timesOnBlock: 3, timesSaved: 0 } },
    ],
  };

  it('carries the season record through to the article', () => {
    const bb = careerOf(player).find(c => c.format === 'big-brother');
    expect(bb.seasons[0].record.bb.blockBusterWins).toBe(3);
    expect(bb.seasons[0].record.bb.blockBusterStreak).toBe(3);
    expect(bb.seasons[1].record.votesReceived).toBe(7);
  });

  it('totals the career, and takes the best streak rather than the sum', () => {
    const bb = careerOf(player).find(c => c.format === 'big-brother');
    expect(bb.totals.hohWins).toBe(1);
    expect(bb.totals.blockBusterWins).toBe(4);
    expect(bb.totals.timesNominated).toBe(9);
    // Three in a row and one on its own is a best of three, not four.
    expect(bb.totals.bestBlockBusterStreak).toBe(3);
  });

  it('draws a competition table that says how the arena went', () => {
    const html = renderArticle({ ...player, career: careerOf(player) }, 'big-brother',
      { root: '.', allShows: ['big-brother'] });
    expect(html).toContain('Competition history');
    // The arena cell carries won-of-played and the run, because a bare 3 says
    // nothing about whether they kept landing there.
    expect(html).toMatch(/3 of 4/);
    expect(html).toMatch(/3 in a row/);
    // And the infobox names it rather than folding it into "wins".
    expect(html).toContain('Block Buster wins');
    expect(html).toContain('Longest arena run');
  });

  it('gives an article a gallery placeholder to fill', () => {
    const html = renderArticle({ ...player, career: careerOf(player) }, 'big-brother',
      { root: '.', allShows: ['big-brother'] });
    expect(html).toContain('data-wk-gallery="ireland"');
  });
});
