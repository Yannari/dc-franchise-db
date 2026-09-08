// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-season-page.test.js — the reference article for a season with no vote
// ══════════════════════════════════════════════════════════════════════
//
// The season page is 3,000 lines of inline script, so this drives the ONE
// function that decides the tab's shape rather than loading the page. The
// builder was extracted from season_ref.html for exactly that reason: a tab
// nothing can call is a tab nothing can check, and this one has now been
// wrong about a whole show twice.
import { describe, expect, it } from 'vitest';
import { buildWikiTab } from '../js/season-wiki-tab.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 11, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const doc = buildDragSeasonDocument(playDragSeason({ cast: cast(11, 3), seed: 4 }).rows, { seasonNumber: 1 });
const episodes = doc.dr.episodes;
const html = buildWikiTab(doc);
const text = html.replace(/<[^>]+>/g, ' ');

describe('the drag season page', () => {
  it('draws a track record grid with a cell per queen per episode', () => {
    expect(html).toMatch(/track-record/);
    for (const p of doc.placements) expect(html, `${p.name} missing`).toContain(p.name);
    // The whole point of the chart: no ragged rows. A queen already gone
    // still has a cell, or the columns do not line up.
    const cells = (html.match(/data-result="/g) || []).length;
    expect(cells).toBe(doc.placements.length * episodes.length);
  });

  it('draws no block, no veto, no nominations, no jury, no tally', () => {
    for (const gone of ['Power of Veto', 'On the block', 'Head of Household', 'Nominated', 'votes:']) {
      expect(text, `"${gone}" drawn over a runway`).not.toContain(gone);
    }
  });

  it("speaks this show's words only", () => {
    expect(foreignWordsIn(text, 'drag-race')).toEqual([]);
    expect(text).toMatch(/maxi challenge/i);
    expect(text).toMatch(/sashayed away/i);
  });

  it('states the season facts without a week count', () => {
    expect(text).toMatch(/Episodes/);
    expect(html).not.toMatch(/>Weeks</);
  });

  /* ── THE FOUR DEFECTS A TEST DID NOT FIND ─────────────────────────
     Every one of these passed the assertions above and was caught by dumping
     the tab and reading it. They are guards now because each is invisible
     from inside: a page that says "Episode undefined" renders, validates and
     looks like a working page. */
  it('numbers every round it names', () => {
    // A placement episode numbers itself `episode`; the whole page keys off
    // `week`. Left alone that printed "Episode undefined" seven times and put
    // "Sashayed away" under the WINNER's photo on the memory wall.
    expect(text).not.toMatch(/undefined/);
    expect(text).not.toMatch(/NaN/);
  });

  it('does not offer to re-export ballots this show will never have', () => {
    // True and useful on a show whose ballots went unrecorded. On a show
    // where nobody votes it apologises for a section that cannot exist and
    // promises a grid that can never be drawn.
    expect(text).not.toMatch(/vote-by-vote history needs the/);
  });

  it("names the power table in this show's words, and quotes no tally", () => {
    expect(text).not.toMatch(/Immunity|Won immunity/);
    expect(text).not.toMatch(/how many votes the eliminated/);
    expect(text).toMatch(/Maxi challenge/);
  });

  it('gives the finale night an account of itself', () => {
    // The finale has no maxi winner and no exit, so every clause the game
    // history knew was false of it and the last episode drew a heading with
    // nothing under it — the one night the season is about.
    expect(text).toMatch(/reached the finale/);
    expect(text).toMatch(/was crowned/);
  });

  it('names BOTH queens in the bottom, not one', () => {
    // The one who goes home is marked ELIM, not BTM, so reading the column
    // announced a bottom two of one person — beside the very next sentence
    // naming both of them.
    const lines = text.match(/\w+ and \w+ landed in the bottom/g) || [];
    expect(lines.length).toBeGreaterThan(3);
  });

  it('STILL DRAWS A HOUSE CORRECTLY', () => {
    // The regression that matters: this builder draws every show on the site,
    // and a third shape added to it must not have moved the other two.
    const bb = buildWikiTab({
      format: 'big-brother', seasonNumber: 1,
      placements: [
        { name: 'Ava', playerSlug: 'ava', placement: 1, status: 'Winner' },
        { name: 'Bo', playerSlug: 'bo', placement: 2, status: 'Evicted' },
      ],
      weeks: [{
        week: 1, hoh: 'Ava', initialNominees: ['Bo'], finalNominees: ['Bo'],
        vetoWinner: 'Ava', evicted: 'Bo', votes: { Bo: 3 },
        ballots: [{ voter: 'Ava', evict: 'Bo' }],
      }],
    });
    expect(bb).toContain('Head of Household');
    expect(bb).toContain('Power of Veto');
  });

  it('AND STILL DRAWS A CAMP CORRECTLY', () => {
    const td = buildWikiTab({
      format: 'total-drama', seasonNumber: 1,
      placements: [
        { name: 'Gwen', playerSlug: 'gwen', placement: 1, status: 'Winner' },
        { name: 'Duncan', playerSlug: 'duncan', placement: 2, status: 'Voted out' },
      ],
      votingHistory: [{ episode: 1, eliminated: 'Duncan', votes: [{ voter: 'Gwen', target: 'Duncan' }] }],
    });
    expect(td.replace(/<[^>]+>/g, ' ')).toMatch(/voted out/i);
    expect(td).not.toContain('Power of Veto');
  });
});
