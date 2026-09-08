// ══════════════════════════════════════════════════════════════════════
// dr-article.test.js — a queen's page, and the row she leaves behind
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { renderArticle } from '../js/wiki-view.js';
import { buildDossier } from '../js/wiki.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';
import { RESULT_LABELS } from '../js/dr/grid.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'nb'][i % 2],
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const season = playDragSeason({ cast: cast(10, 7), seed: 2 });
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1 });
const episodes = doc.dr.episodes;
const winner = doc.placements[0];
const booted = doc.placements[doc.placements.length - 1];
// Somebody who left in the MIDDLE: the first-boot's row is the one case where
// "stops at her exit" and "runs to the end" are hardest to tell apart.
const midBoot = doc.placements[Math.floor(doc.placements.length / 2)];

const playerFor = p => ({
  id: p.playerSlug, name: p.name, slug: p.playerSlug,
  seasonDetails: [{
    season: 1, format: 'drag-race', placement: p.placement, status: p.status,
    challengeWins: p.dr?.wins || 0, dr: p.dr,
  }],
  story: 'They arrived early, made themselves useful, and stayed useful.',
});
const article = p => renderArticle(buildDossier(playerFor(p), { seasonDocs: [doc] }), 'drag-race', { root: '.' });
const strip = h => h.replace(/<[^>]+>/g, ' ');

describe('the character article', () => {
  it("describes a winner and a boot in this show's words", () => {
    for (const p of [winner, booted, midBoot]) {
      const text = strip(article(p));
      expect(foreignWordsIn(text, 'drag-race'), p.name).toEqual([]);
      expect(text, p.name).toContain(p.name);
    }
  });

  it('says sashayed away, never evicted or voted out', () => {
    const text = strip(article(midBoot));
    expect(text).toMatch(/sashayed away/i);
    expect(text).not.toMatch(/\bevicted\b|\bvoted out\b|\bbanished\b/i);
  });

  it('the infobox counts maxi wins and lip syncs, not immunity', () => {
    /* Drawn off `record.dr`, which the dossier did not carry: `record` spread
       `d.bb` and `d.tr` by name — the list of shows that existed when it was
       written — so a fourth show's numbers reached the article as undefined
       and the entire per-show stat block drew empty, with no error. And the
       registry asked for a career key `maxiWins` where buildDossier files the
       total under the path's LAST SEGMENT, `wins`. Both silent. */
    // Two queens, because a maxi winner is safe and therefore rarely the one
    // who lip synced — asking for both on one row is asking for a rare season.
    const maxi = doc.placements.find(p => (p.dr?.wins || 0) > 0);
    const sync = doc.placements.find(p => (p.dr?.lipsyncWins || 0) > 0);
    expect(maxi, 'nobody won a maxi').toBeTruthy();
    expect(sync, 'nobody won a lip sync').toBeTruthy();
    const html = article(maxi);
    expect(html).toMatch(/Maxi challenge wins/i);
    expect(article(sync)).toMatch(/Lip syncs won/i);
    expect(html).not.toMatch(/Immunity/i);
    // A row is only drawn when the number is there, so the label appearing
    // proves the number arrived — which is the half that was broken.
    const near = strip(html).replace(/\s+/g, ' ');
    expect(near).toMatch(`Maxi challenge wins ${maxi.dr.wins}`);
  });

  it('the grid is headed Track Record, and carries no ballot rows', () => {
    const html = article(midBoot);
    expect(html).toContain('Track Record');
    expect(html).not.toContain('Voting History');
    expect(html).not.toContain('Votes against');
    // "never had a vote cast against them" is true of every queen who ever
    // competed. Printed under a track record chart it reads as an achievement.
    expect(strip(html)).not.toMatch(/vote cast against them/);
  });
});

describe('the career grid', () => {
  const rowsFor = p => (buildDossier(playerFor(p), { seasonDocs: [doc] }).career || [])
    .flatMap(sh => sh.seasons || []).flatMap(x => x.weekRows || []);

  it("runs to the queen's last episode, not the first blank", () => {
    const rows = rowsFor(winner);
    expect(rows.length).toBe(episodes.length);
    expect(rows[rows.length - 1].result).toMatch(/WINNER|WIN|FINALIST/);
  });

  it('a queen who left mid-season has OUT cells after her exit, NOT missing rows', () => {
    /* The house and the camp both stop a grid at the exit, which is right for
       them: their grids are per-round records of what somebody DID, and after
       they leave there is nothing. A track record chart is the opposite — its
       whole value is that the columns line up across every queen, and a row
       that stops early cannot be drawn beside one that does not. */
    const rows = rowsFor(midBoot);
    expect(rows.length).toBe(episodes.length);
    const elim = rows.findIndex(r => r.result === 'ELIM');
    expect(elim).toBeGreaterThanOrEqual(0);
    expect(elim, 'she left on the last episode — pick a different queen').toBeLessThan(rows.length - 1);
    for (const r of rows.slice(elim + 1)) expect(r.result).toBe('OUT');
  });

  it('the exit cell carries the verb the ROUND recorded', () => {
    const row = rowsFor(midBoot).find(r => r.evicted);
    expect(row, 'she never leaves the grid').toBeTruthy();
    expect(row.exitVerb).toBe('sashayed away');
  });

  it('every result the grid emits has a cell rule to draw it', () => {
    /* A result the renderer does not know draws a BLANK cell, which reads as
       a quiet week for somebody who won the season. The check is the label
       the reader sees, not the key: ELIM is drawn as the round's own exit
       verb, which is the whole point of carrying the verb on the row. */
    const seen = new Set();
    for (const p of [winner, midBoot]) for (const r of rowsFor(p)) seen.add(r.result);
    expect(seen.size, 'this season produced too few distinct results to check').toBeGreaterThan(3);
    for (const p of [winner, midBoot]) {
      const text = strip(article(p));
      for (const r of rowsFor(p)) {
        if (!r.result || r.result === 'OUT') continue;
        const want = r.result === 'ELIM' ? 'Sashayed away' : RESULT_LABELS[r.result].label;
        expect(text, `no cell drawn for ${r.result} on ${p.name}`).toContain(want);
      }
    }
  });
});
