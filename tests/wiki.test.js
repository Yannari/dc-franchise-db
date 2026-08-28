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

  it('draws the week grid, with the strongest thing that happened in each cell', () => {
    // The table people screenshot. Winning the arena outranks being nominated,
    // because being nominated is HOW you get into the arena — a cell that said
    // "Nominated" for the week somebody won their way off it would be telling
    // the story backwards.
    const withWeeks = { ...player, seasonDetails: [{ ...player.seasonDetails[0],
      weekRows: [
        { week: 1, hoh: true, votesAgainst: 0 },
        { week: 2, nominated: true, onBlock: true, votesAgainst: 3 },
        { week: 3, nominated: true, arenaPlayed: true, arenaWon: true, votesAgainst: 0 },
        { week: 4, veto: true, votesAgainst: 0 },
        { week: 5, nominated: true, onBlock: true, evicted: true, votesAgainst: 6 },
      ] }] };
    const html = renderArticle({ ...withWeeks, career: careerOf(withWeeks) }, 'big-brother',
      { root: '.', allShows: ['big-brother'] });
    // The grid lives under the season's own Voting History heading now.
    expect(html).toContain('Voting History');
    expect(html).toContain('wk-c-hoh');
    expect(html).toContain('wk-c-arena');
    expect(html).toContain('wk-c-out');
    // The week they won the arena reads as the arena, not as a nomination.
    const cells = html.match(/<td class="wk-c-[a-z]*">[\s\S]*?<\/td>/g) || [];
    expect(cells[2]).toContain('Block Buster');
    // And the summary underneath counts what the row shows.
    expect(html).toMatch(/in the Block Buster 1x, winning 1/);
  });

  it('leaves the grid out when no season document was reachable', () => {
    const html = renderArticle({ ...player, career: careerOf(player) }, 'big-brother',
      { root: '.', allShows: ['big-brother'] });
    expect(html).not.toContain('Week by week');
  });

  it('puts the personality written from the episodes in the LEAD', () => {
    // This used to render one Personality heading per season. The reference
    // pages do not: theirs holds the casting questionnaire and no prose at all,
    // and the character narrative is in the lead, above the contents box, as
    // one paragraph about the person.
    //
    // So the AI's per-season description moved to the lead, and Personality
    // became the single authored description of the person.
    const withPersona = { ...player, seasonDetails: [
      { ...player.seasonDetails[0], personality: 'Ran the house from the kitchen and never raised her voice.' },
      { ...player.seasonDetails[1], personality: 'Came back loud and lost the room by week two.' },
    ] };
    const html = renderArticle(
      { ...withPersona, personality: 'clipped, sarcastic', career: careerOf(withPersona) },
      'big-brother', { root: '.', allShows: ['big-brother'] });

    const lead = html.slice(0, html.indexOf('wk-contents'));
    expect(lead, 'the written description is not in the lead')
      .toMatch(/wk-lead-persona/);
    // ONE of them, not both: the lead is a lead, and two paragraphs describing
    // different seasons would disagree with each other.
    const both = ['Ran the house from the kitchen', 'Came back loud']
      .filter(t => lead.includes(t));
    expect(both.length, 'the lead prints a paragraph per season again').toBe(1);

    // And the section under the heading is now the authored description,
    // which used to be suppressed whenever any season had been read.
    expect(html, 'the Personality section lost the authored description')
      .toContain('clipped, sarcastic');
  });

  it('gives Personality one heading, never one per season', () => {
    const withPersona = { ...player, seasonDetails: [
      { ...player.seasonDetails[0], personality: 'Ran the house from the kitchen.' },
      { ...player.seasonDetails[1], personality: 'Came back loud.' },
    ] };
    const html = renderArticle(
      { ...withPersona, personality: 'clipped, sarcastic', career: careerOf(withPersona) },
      'big-brother', { root: '.', allShows: ['big-brother'] });
    const sec = html.slice(html.indexOf('id="wk-personality"'));
    const body = sec.slice(0, sec.indexOf('</section>'));
    expect(body, 'a season heading is back inside Personality').not.toMatch(/wk-sub/);
  });

  it('falls back to the voice profile when no season has been read', () => {
    const html = renderArticle(
      { ...player, personality: 'clipped, sarcastic', career: careerOf(player) },
      'big-brother', { root: '.', allShows: ['big-brother'] });
    expect(html).toContain('clipped, sarcastic');
  });

  it('quotes people, which needs the screenplay and nothing else has it', () => {
    const withQuotes = { ...player, seasonDetails: [
      { ...player.seasonDetails[0], quotes: [
        { text: 'Start counting.', context: 'to the house, on her way out the door' },
        'Mm.',
      ] }, player.seasonDetails[1]] };
    const html = renderArticle({ ...withQuotes, career: careerOf(withQuotes) },
      'big-brother', { root: '.', allShows: ['big-brother'] });
    expect(html).toContain('Quotes');
    expect(html).toContain('Start counting.');
    expect(html).toContain('on her way out the door');
    expect(html).toContain('Mm.');
  });

  it('gives an article a gallery placeholder to fill', () => {
    const html = renderArticle({ ...player, career: careerOf(player) }, 'big-brother',
      { root: '.', allShows: ['big-brother'] });
    expect(html).toContain('data-wk-gallery="ireland"');
  });
});

// ── THE SEASON DOCUMENT IS WHERE THE PROSE LIVES ────────────────────────
//
// `players_database.json` is derived — rebuilt by an export — and holds the
// numbers. A season's written personality, quotes and trivia are written into
// the season document by the wiki fill, and the article read only the derived
// copy. So a season that HAD been filled showed the voice profile and no
// quotes: the writing was in a file nothing on the page opened.
describe('reading a filled season', () => {
  const PLAYER = {
    id: 'jade', name: 'Jade',
    seasonDetails: [{ season: 14, format: 'total-drama', placement: 1, status: 'Winner' }],
  };
  const DOC = {
    format: 'total-drama', seasonNumber: 14,
    placements: [{ placement: 1, name: 'Jade', playerSlug: 'jade',
      personality: 'Calm, watchful and deliberately reassuring.',
      quotes: [{ text: 'A clown attacked me.', context: 'in confessional' }],
      trivia: ['Trusted Zaid with a coconut, a vote, or a plush banana.'] }],
    votingHistory: [
      { episode: 2, eliminated: 'Amelie',
        votes: [{ voter: 'Jade', target: 'Amelie' }, { voter: 'Amelie', target: 'Jade' }] },
      { episode: 3, eliminated: 'Ted',
        votes: [{ voter: 'Jade', target: 'Ted' }, { voter: 'Ted', target: 'Jade' }] },
    ],
  };

  it('takes personality, quotes and trivia from the season document', () => {
    const [show] = careerOf(PLAYER, { seasonDocs: [DOC] });
    const s14 = show.seasons[0];
    expect(s14.personality).toMatch(/deliberately reassuring/);
    expect(s14.quotes[0].text).toBe('A clown attacked me.');
    expect(s14.trivia[0]).toMatch(/plush banana/);
  });

  it('falls back to the derived copy when no document is loaded', () => {
    const derived = { ...PLAYER, seasonDetails: [{ ...PLAYER.seasonDetails[0],
      personality: 'From the players database.' }] };
    const [show] = careerOf(derived, {});
    expect(show.seasons[0].personality).toBe('From the players database.');
  });

  it('never lets an empty field in the document blank a filled one', () => {
    const doc = { ...DOC, placements: [{ ...DOC.placements[0], quotes: [], trivia: [] }] };
    const derived = { ...PLAYER, seasonDetails: [{ ...PLAYER.seasonDetails[0],
      quotes: [{ text: 'kept', context: 'kept' }] }] };
    const [show] = careerOf(derived, { seasonDocs: [doc] });
    expect(show.seasons[0].quotes[0].text).toBe('kept');
  });

  // A camp has no weeks, so the round-by-round section was missing entirely
  // from every Total Drama article rather than showing what a camp DOES have.
  it('builds a round-by-round history for a show with no weeks', () => {
    const [show] = careerOf(PLAYER, { seasonDocs: [DOC] });
    const rows = show.seasons[0].weekRows;
    expect(rows.map(r => r.week)).toEqual([2, 3]);
    expect(rows[0].votedFor).toBe('Amelie');
    expect(rows[0].votesAgainst).toBe(1);
    expect(rows.some(r => r.evicted)).toBe(false);   // she won
  });

  it('stops the history at the round they left', () => {
    const doc = { ...DOC, placements: [{ placement: 5, name: 'Ted', playerSlug: 'ted' }] };
    const ted = { id: 'ted', name: 'Ted',
      seasonDetails: [{ season: 14, format: 'total-drama', placement: 5 }] };
    const [show] = careerOf(ted, { seasonDocs: [doc] });
    const rows = show.seasons[0].weekRows;
    expect(rows.length).toBe(2);
    expect(rows[1].evicted).toBe(true);
  });

  it('draws the camp grid with the ballot in it', () => {
    const dossier = buildDossier(PLAYER, { seasonDocs: [DOC] });
    const html = renderArticle(dossier, 'total-drama', { root: '.' });
    // Under the season's own heading now, with the round word the camp uses.
    expect(html).toMatch(/Voting History/);
    expect(html).toMatch(/<th>Episode<\/th>/);
    /* AND THE HEADER IS NOT THE HOUSE'S EITHER. This line asserted "Voted to
       evict" over a CAMP — two lines above its own comment saying Big
       Brother's vocabulary must not appear on this grid. A camp eliminates;
       the word comes from the registry. */
    expect(html).toMatch(/Voted to eliminate/);
    expect(html).not.toMatch(/Voted to evict/);
    expect(html).toMatch(/A clown attacked me/);
    // Big Brother's vocabulary must not appear on a camp's grid.
    expect(html).not.toMatch(/Head of Household|Power of Veto/);
  });
});

// ── THE LEAD AND THE TABBED INFOBOX ─────────────────────────────────────
//
// Modelled on the reference pages: a career sentence naming every season, a
// paragraph on the game itself, and one infobox whose stat block changes with a
// season tab. The old version opened "was a contestant on Total Drama, Season
// 14, winning once" and listed every season's rows in one flat column.
describe('the lead', () => {
  const one = { id: 'jade', name: 'Jade', seasonDetails: [
    { season: 14, format: 'total-drama', placement: 1, status: 'Winner', challengeWins: 3 }] };
  const twice = { id: 'jesse', name: 'Jesse', seasonDetails: [
    { season: 7, format: 'total-drama', placement: 1, status: 'Winner' },
    { season: 18, format: 'total-drama', placement: 5, status: 'Juror' }] };

  const html = p => renderArticle(buildDossier(p, {}), 'total-drama', { root: '.' });

  it('names the season somebody won, and links it', () => {
    const out = html(one);
    expect(out).toMatch(/<strong>Jade<\/strong> was the winner of/);
    expect(out).toMatch(/season_ref\.html\?season=14/);
  });

  it('states a whole career in order, the way a returnee page opens', () => {
    const out = html(twice);
    // Won first, came back later — and the later season is the second clause.
    expect(out).toMatch(/was the winner of[\s\S]*?and returned for[\s\S]*?finishing 5th/);
    // Scoped to the LEAD. The infobox links its seasons as well now, newest
    // first, and it is drawn above the paragraph this is about.
    const lead = out.match(/<p class="wk-lead">([\s\S]*?)<\/p>/)?.[1] || '';
    expect(lead.indexOf('season=7')).toBeLessThan(lead.indexOf('season=18'));
  });

  it('says "later won" when the second season was also a win', () => {
    const twoWins = { id: 'jesse', name: 'Jesse', seasonDetails: [
      { season: 7, format: 'total-drama', placement: 1 },
      { season: 12, format: 'total-drama', placement: 1 }] };
    expect(html(twoWins)).toMatch(/later won/);
  });

  // THE DUPLICATION BUG. The lead printed `story`, which is also what the
  // season's Summary section prints — so a one-season article said the same six
  // sentences twice, with a contents box between them.
  it('never repeats the narrative the Summary section already carries', () => {
    const doc = { format: 'total-drama', seasonNumber: 14, votingHistory: [],
      placements: [{ placement: 1, name: 'Jade', playerSlug: 'jade',
        story: 'She tested everybody and lost nobody.' }] };
    const out = renderArticle(buildDossier(one, { seasonDocs: [doc] }), 'total-drama', { root: '.' });
    const leadGame = out.match(/<p class="wk-lead-game">([\s\S]*?)<\/p>/)?.[1] || '';
    expect(leadGame).not.toMatch(/tested everybody/);
    // It is in the article — once, under Summary.
    expect((out.match(/tested everybody and lost nobody/g) || []).length).toBe(1);
  });

  it('summarises the record instead, the way the reference lead does', () => {
    const out = html(one);
    // Prose, with the count spelled out the way a paragraph does it.
    expect(out).toMatch(/winning three challenges/);
    expect(out).toMatch(/During .* time on the show/);
  });
});

describe('the infobox', () => {
  const twice = { id: 'ireland', name: 'Ireland', seasonDetails: [
    { season: 4, format: 'big-brother', placement: 3, status: 'Juror', votesReceived: 5,
      bb: { hohWins: 1, vetoWins: 2 }, alliances: ['The Sanctum'] },
    { season: 6, format: 'big-brother', placement: 8, status: 'Juror', votesReceived: 7,
      bb: { timesNominated: 4 } }] };
  const out = () => renderArticle(buildDossier(twice, {}), 'big-brother', { root: '.' });

  it('gives every season a tab, newest first and selected', () => {
    const html = out();
    const tabs = [...html.matchAll(/data-ibx-tab="(\d+)"/g)].map(m => m[1]);
    expect(tabs).toEqual(['6', '4']);
    // The newest panel is the one showing.
    expect(html).toMatch(/class="wk-ib-season is-on" data-ibx-panel="6"/);
    expect(html).toMatch(/class="wk-ib-season" data-ibx-panel="4"/);
  });

  it('keeps every season number in its own block', () => {
    const html = out();
    const s4 = html.split('data-ibx-panel="4"')[1];
    expect(s4).toMatch(/<th>HOH wins<\/th><td>1<\/td>/);
    expect(s4).toMatch(/The Sanctum/);
    // Season 6 had no HOH win, so the row is absent rather than a zero.
    const s6 = html.split('data-ibx-panel="6"')[1].split('data-ibx-panel="4"')[0];
    expect(s6).not.toMatch(/HOH wins/);
  });

  it('draws no tabs for a single season', () => {
    const one = { id: 'jade', name: 'Jade',
      seasonDetails: [{ season: 14, format: 'total-drama', placement: 1 }] };
    const html = renderArticle(buildDossier(one, {}), 'total-drama', { root: '.' });
    expect(html).not.toMatch(/wk-ib-tabs/);
    expect(html).toMatch(/data-ibx-panel="14"/);
  });

  it('uses the words each show uses for its competitions', () => {
    expect(out()).not.toMatch(/Challenge wins|Idols found/);
    const jade = { id: 'jade', name: 'Jade', seasonDetails: [
      { season: 14, format: 'total-drama', placement: 1, challengeWins: 3, immunityWins: 3 }] };
    const td = renderArticle(buildDossier(jade, {}), 'total-drama', { root: '.' });
    expect(td).toMatch(/Challenge wins/);
    expect(td).not.toMatch(/HOH wins|Veto wins/);
  });
});

// Four seasons is where the first version fell apart: it repeated "and later
// won" for every win after the second.
describe('a long career in one sentence', () => {
  const four = { id: 'alejandro', name: 'Alejandro', seasonDetails: [
    { season: 1, format: 'total-drama', placement: 2 },
    { season: 2, format: 'total-drama', placement: 2 },
    { season: 4, format: 'total-drama', placement: 1 },
    { season: 8, format: 'total-drama', placement: 1 }] };

  it('counts the seasons and the wins, then lists them in order', () => {
    const html = renderArticle(buildDossier(four, {}), 'total-drama', { root: '.' });
    const p = html.match(/<p class="wk-lead">([\s\S]*?)<\/p>/)[1].replace(/<[^>]+>/g, '');
    expect(p).toMatch(/played 4 seasons of Total Drama, winning 2 of them/);
    // Said once, not once per win.
    expect((p.match(/winning/g) || []).length).toBe(1);
    expect(p).not.toMatch(/later won[\s\S]*later won/);
    // A serial comma list, ending with "and".
    expect(p).toMatch(/, and /);
  });

  it('says "winning once" rather than "winning 1 of them"', () => {
    const three = { id: 'x', name: 'Xan', seasonDetails: [
      { season: 1, format: 'total-drama', placement: 4 },
      { season: 2, format: 'total-drama', placement: 1 },
      { season: 3, format: 'total-drama', placement: 6 }] };
    const html = renderArticle(buildDossier(three, {}), 'total-drama', { root: '.' });
    expect(html).toMatch(/winning once/);
  });
});

// ── THE SECTION TREE ────────────────────────────────────────────────────
//
// A fandom article nests: "The Mad House 7" is a heading, and Summary,
// Have/Have-Not History and Voting History are 2.1, 2.2, 2.3 underneath it.
// Flat, every one of those had to carry the season's name in its own title to
// stay unambiguous — which is how "Week by week — Total Drama All-Stars" ended
// up as a top-level heading beside "Competition history".
describe('the section tree', () => {
  const HOUSE = {
    format: 'big-brother', seasonNumber: 1,
    placements: [{ placement: 1, name: 'Wayne', playerSlug: 'wayne' }],
    weeks: [
      { week: 1, hoh: 'Wayne', initialNominees: ['Axel', 'Emmah'], finalNominees: ['Axel', 'Emmah'],
        votes: { Axel: 6 }, evicted: 'Axel', haveNots: ['Wayne'],
        ballots: [{ voter: 'Wayne', evict: 'Axel' }] },
      { week: 2, hoh: 'Raj', vetoWinner: 'Wayne', initialNominees: ['Wayne', 'Zee'],
        finalNominees: ['Zee', 'Millie'], votes: { Millie: 5, Zee: 4 }, evicted: 'Millie',
        haveNots: [], ballots: [{ voter: 'Wayne', evict: 'Millie' }] },
    ],
  };
  const WAYNE = { id: 'wayne', name: 'Wayne', seasonDetails: [
    { season: 1, format: 'big-brother', placement: 1, status: 'Winner',
      bb: { hohWins: 1, vetoWins: 1 } }] };

  const html = () => renderArticle(buildDossier(WAYNE, { seasonDocs: [HOUSE] }),
    'big-brother', { root: '.' });

  it('makes the season a heading with its own subsections', () => {
    const out = html();
    // A LINK, like every heading on a fandom article that names a season.
    expect(out).toMatch(/<h2><a href="[^"]*season=bb-1">Big Brother 1<\/a><\/h2>/);
    expect(out).toMatch(/<h3>Summary<\/h3>/);
    expect(out).toMatch(/<h3>Voting History<\/h3>/);
  });

  it('nests them in the contents, so they number 2.1 and 2.2', () => {
    const out = html();
    const toc = out.match(/<nav class="wk-contents">([\s\S]*?)<\/nav>/)?.[1] || '';
    // A list inside a list is what the numbering is drawn from.
    expect(toc).toMatch(/<ol>[\s\S]*<ol>/);
    expect(toc).toMatch(/#wk-s1-summary/);
    expect(toc).toMatch(/#wk-s1-votes/);
  });

  // The reason the exporter changed at all.
  it('draws Have/Have-Not History when the season recorded have-nots', () => {
    const out = html();
    expect(out).toMatch(/Have\/Have-Not History/);
    expect(out).toMatch(/Have-Not/);
    expect(out).toMatch(/1 week on slop/);
  });

  it('leaves it out for a season exported before have-nots were carried', () => {
    const older = { ...HOUSE, weeks: HOUSE.weeks.map(({ haveNots, ...w }) => w) };
    const out = renderArticle(buildDossier(WAYNE, { seasonDocs: [older] }), 'big-brother', { root: '.' });
    // Absent, not an empty grid: every cell reading "Have" would be a claim
    // the record never made.
    expect(out).not.toMatch(/Have\/Have-Not History/);
    expect(out).toMatch(/Voting History/);
  });

  it('builds the house grid from the season document, which nothing did before', () => {
    const out = html();
    const grid = out.match(/<h3>Voting History<\/h3>([\s\S]*?)<\/section>/)[1];
    expect(grid).toMatch(/<th>Week<\/th>/);
    expect(grid).toMatch(/HOH/);
    expect(grid).toMatch(/Veto/);
    expect(grid).toMatch(/1x Head of Household/);
  });

  it('keeps the career tables for a returnee and drops them for one season', () => {
    expect(html()).not.toMatch(/<h2>Appearances<\/h2>/);
    const twice = { ...WAYNE, seasonDetails: [...WAYNE.seasonDetails,
      { season: 4, format: 'big-brother', placement: 6, bb: { hohWins: 1 } }] };
    const out = renderArticle(buildDossier(twice, { seasonDocs: [HOUSE] }), 'big-brother', { root: '.' });
    expect(out).toMatch(/<h2>Appearances<\/h2>/);
    expect(out).toMatch(/<h2>Competition history<\/h2>/);
  });
});

// ── THE LEAD, WRITTEN AND MEASURED ──────────────────────────────────────
//
// Two versions of the same paragraph. The measured one is assembled from
// counters and always exists; the written one comes from the wiki fill, in the
// register of the reference pages, and wins whenever it is there.
describe('the game paragraph', () => {
  const JADE = { id: 'jade', name: 'Jade', seasonDetails: [{
    season: 14, format: 'total-drama', placement: 1, status: 'Winner',
    challengeWins: 3, immunityWins: 3, votesReceived: 10,
    alliances: ['The Anchor'], unbreakableBonds: ['Benji', 'Hannah'] }] };
  const DOC = { format: 'total-drama', seasonNumber: 14, votingHistory: [],
    winner: { name: 'Jade', vote: '', runnerUp: 'Logan' },
    placements: [{ placement: 1, name: 'Jade', playerSlug: 'jade' }] };
  const out = (player, doc = DOC) => renderArticle(
    buildDossier(player, { seasonDocs: [doc] }), 'total-drama', { root: '.' });
  const para = html => (html.match(/<p class="wk-lead-game">([\s\S]*?)<\/p>/)?.[1] || '');

  it('writes prose, not a list of counters', () => {
    const p = para(out(JADE));
    expect(p).toMatch(/During .* time on the show/);
    expect(p).toMatch(/winning three challenges/);       // spelled out
    expect(p).toMatch(/forming a dominant alliance in <em>The Anchor<\/em>/);
    // Every castmate named in the prose is a link to their page.
    expect(p).toMatch(/with <[^>]*>?<span>Benji<\/span>[\s\S]*?<span>Hannah<\/span>/);
  });

  it('links the season it is talking about', () => {
    expect(para(out(JADE))).toMatch(/<a href="\.\/season_ref\.html\?season=14"/);
  });

  it('says how the vote went when the season recorded one', () => {
    const doc = { ...DOC, winner: { ...DOC.winner, vote: 'Jade 4 — Logan 3' } };
    expect(para(out(JADE, doc)))
      .toMatch(/a close final vote[\s\S]*4 to 3 decision over [\s\S]*Logan/);
  });

  it('calls a landslide what it is', () => {
    const doc = { ...DOC, winner: { ...DOC.winner, vote: 'Jade 7 — Logan 1' } };
    const p = para(out(JADE, doc));
    expect(p).toMatch(/the final vote/);
    expect(p).not.toMatch(/close final vote/);
  });

  it('prefers the written lead once the fill has run', () => {
    const doc = { ...DOC, placements: [{ ...DOC.placements[0],
      lead: 'During her time on the show, Jade read the carnival better than anybody in it.' }] };
    const p = para(out(JADE, doc));
    expect(p).toMatch(/read the carnival better than anybody/);
    // And the assembled one is gone rather than printed underneath it.
    expect(p).not.toMatch(/winning three challenges/);
  });

  it('uses the pronoun the roster gives, and they/them when it gives none', () => {
    const withGender = buildDossier(JADE, { seasonDocs: [DOC],
      roster: { players: [{ slug: 'jade', gender: 'f' }] } });
    expect(para(renderArticle(withGender, 'total-drama', { root: '.' }))).toMatch(/During her time/);
    expect(para(out(JADE))).toMatch(/During their time/);
  });
});

// ── THE OTHER SHOWS ──
//
// The reference pages carry "Big Brother (US)" and "Charm School" as headings
// on a Mad House character's page, saying what they did elsewhere.
//
// Scoping each article to one show was deliberate — a character's Big Brother
// article and their Total Drama article are different articles — but it left a
// hole. Eighteen players have now played both, effectively the whole Big
// Brother season 1 cast, and their Total Drama pages said nothing about it.
// The other career was on the same dossier the whole time and rendered nowhere.
describe('an article says what they did on the other show', () => {
  const crossover = {
    id: 'caleb', name: 'Caleb', bio: {},
    career: [
      { format: 'total-drama', count: 1, wins: 0, best: 15, totals: {},
        seasons: [{ season: 9, seasonId: 'td-9', title: 'Land of Powers', placement: 15, status: 'Juror', record: {} }] },
      { format: 'big-brother', count: 1, wins: 0, best: 4, totals: {},
        seasons: [{ season: 1, seasonId: 'bb-1', title: 'The House That Kept Receipts', placement: 4, status: 'Jury', record: {} }] },
    ],
  };
  const opts = { root: '.', allShows: ['total-drama', 'big-brother'] };

  it('names the other show as its own section, from the record', () => {
    const html = renderArticle(crossover, 'total-drama', opts);
    expect(html, 'no Big Brother section on a crossover player').toMatch(/id="wk-elsewhere-big-brother"/);
    expect(html).toMatch(/Caleb competed on/);
    expect(html).toContain('The House That Kept Receipts');
    expect(html, 'the placement is not stated').toMatch(/finishing 4th/);
  });

  it('works in the other direction too', () => {
    const html = renderArticle(crossover, 'big-brother', opts);
    expect(html).toMatch(/id="wk-elsewhere-total-drama"/);
    expect(html).toContain('Land of Powers');
    expect(html, 'a Big Brother page is describing its own season as elsewhere')
      .not.toContain('The House That Kept Receipts</em>, finishing 4th');
  });

  it('offers a way into that article', () => {
    // The same hook the empty state uses, so the page already knows how to
    // switch — no second mechanism.
    expect(renderArticle(crossover, 'total-drama', opts))
      .toMatch(/data-wiki-show="big-brother"/);
  });

  it('says nothing at all for somebody who played one show', () => {
    const single = { ...crossover, career: [crossover.career[0]] };
    expect(renderArticle(single, 'total-drama', opts)).not.toMatch(/wk-elsewhere-/);
  });

  it('states jury standing only when the record says so', () => {
    // "as a member of the jury" is the reference's phrasing and the status
    // field holds it. The jury NUMBER would need the rest of that season's
    // cast, which this article does not have and must not guess at.
    const html = renderArticle(crossover, 'total-drama', opts);
    expect(html).toMatch(/as a member of the jury/);
    expect(html, 'invented a jury position').not.toMatch(/first member of the jury|third member/);

    const preMerge = JSON.parse(JSON.stringify(crossover));
    preMerge.career[1].seasons[0].status = 'Pre-Merge';
    expect(renderArticle(preMerge, 'total-drama', opts))
      .not.toMatch(/as a member of the jury/);
  });

  it('says winning and runner-up in words, not placements', () => {
    const won = JSON.parse(JSON.stringify(crossover));
    won.career[1].seasons[0].placement = 1;
    expect(renderArticle(won, 'total-drama', opts)).toMatch(/winning the season/);
    won.career[1].seasons[0].placement = 2;
    expect(renderArticle(won, 'total-drama', opts)).toMatch(/finishing as the runner-up/);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Co-winners in the lead
// ══════════════════════════════════════════════════════════════════════
//
// "The winner of season 8" is a claim about everybody else in it, and season 8
// had two. The Traitors makes it the normal case: the pot is split between
// however many are left standing, so a page that says "the winner" over a
// shared win writes the other champions out of their own season.
describe('a season more than one person won', () => {
  const doc = {
    seasonNumber: 8, format: 'total-drama', title: 'Heroes VS Villains',
    winner: { name: 'Alejandro', playerSlug: 'alejandro', vote: '4-4', runnerUp: 'Sanders' },
    placements: [
      { name: 'Alejandro', playerSlug: 'alejandro', placement: 1 },
      { name: 'Cameron', playerSlug: 'cameron', placement: 1 },
      { name: 'Sanders', playerSlug: 'sanders', placement: 3 },
    ],
  };
  const playerNamed = name => ({
    id: name.toLowerCase(), name,
    seasonDetails: [{ season: 8, format: 'total-drama', placement: 1, challengeWins: 3 }],
  });
  const career = p => careerOf(p, { seasonDocs: [doc] });

  it('counts the winners off the document, not off the singular field', () => {
    for (const name of ['Alejandro', 'Cameron']) {
      const s = career(playerNamed(name))[0].seasons[0];
      expect(s.coWinners, `${name}'s record does not know the win was shared`).toBe(2);
    }
    // ...and the tally belongs to the player the winner block names. Cameron
    // did not beat Sanders 4-4; Alejandro did, and the lead used to say both.
    expect(career(playerNamed('Alejandro'))[0].seasons[0].finalVote).toBe('4-4');
    expect(career(playerNamed('Alejandro'))[0].seasons[0].runnerUp).toBe('Sanders');
    expect(career(playerNamed('Cameron'))[0].seasons[0].finalVote).toBe('');
    expect(career(playerNamed('Cameron'))[0].seasons[0].runnerUp).toBe('');
  });

  it('calls each of them a co-winner rather than the winner', () => {
    for (const name of ['Alejandro', 'Cameron']) {
      const p = playerNamed(name);
      const html = renderArticle({ ...p, career: career(p) }, 'total-drama',
        { root: '.', allShows: ['total-drama'] });
      expect(html, `${name}'s article claims the season outright`).toContain('a co-winner of');
      expect(html).not.toContain('the winner of');
    }
  });

  it('still says "the winner" when there was one', () => {
    const solo = { ...doc, placements: doc.placements.filter(p => p.name !== 'Cameron') };
    const p = playerNamed('Alejandro');
    const c = careerOf(p, { seasonDocs: [solo] });
    expect(c[0].seasons[0].coWinners).toBe(1);
    const html = renderArticle({ ...p, career: c }, 'total-drama',
      { root: '.', allShows: ['total-drama'] });
    expect(html).toContain('the winner of');
    expect(html).not.toContain('a co-winner of');
  });
});
