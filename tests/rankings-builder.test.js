// The rankings builder, per show.
//
// It ran a Total Drama rubric over a Big Brother season: two competition
// columns for a game with three, an advantage lifecycle labelled for idols,
// and a legend hardcoded to "Imm +0.8 / Rew +0.3" underneath headers that had
// been relabelled to HOH and Veto. Every Block Buster in a season scored zero.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(process.cwd(), 'js/rankings-update.js'), 'utf8');

describe('the rankings builder knows which show it is ranking', () => {
  it('gives Big Brother its third competition', () => {
    const bb = SRC.slice(SRC.indexOf("'big-brother': {"), SRC.indexOf('};', SRC.indexOf("'big-brother': {")));
    expect(bb, 'no third competition column for the house').toMatch(/comp3:\s*\{/);
    expect(bb).toMatch(/Arena|Block/i);
    const td = SRC.slice(SRC.indexOf("'total-drama': {"), SRC.indexOf("'big-brother': {"));
    expect(td, 'Total Drama must not gain a column it cannot fill').toMatch(/comp3:\s*null/);
  });

  it('scores that third competition instead of ignoring it', () => {
    expect(SRC, 'comp3 is declared but never scored').toMatch(/_rub\.comp3\s*\?\s*num\(p\.comp3Wins\)/);
  });

  it('reads it off the house record when a season is loaded', () => {
    expect(SRC).toMatch(/comp3:\s*isHouse\s*\?\s*\(p\.bb\?\.blockBusterWins/);
  });

  it('keeps the positional parser aligned with the columns', () => {
    // The row is read by index, so a new column shifts every field after it.
    // This is the failure that silently files veto wins under "advantages".
    const parser = SRC.slice(SRC.indexOf('immWins:       parseInt'), SRC.indexOf('overrideReason:'));
    const idx = [...parser.matchAll(/nums\[(\d+)\]/g)].map(m => Number(m[1]));
    const seen = [...new Set(idx)].sort((a, b) => a - b);
    expect(seen[0]).toBe(1);
    seen.forEach((n, i) => expect(n, `gap or repeat at index ${n}`).toBe(i + 1));
  });

  it('builds the legend from the rubric instead of restating it', () => {
    // The markup, not the comment explaining why the markup went away.
    expect(SRC, 'the legend can still disagree with the scorer')
      .not.toMatch(/<span>🏆 Imm \+0\.8<\/span>/);
    expect(SRC).not.toMatch(/<span>🎁 Rew \+0\.3<\/span>/);
    expect(SRC).toMatch(/function _ruRenderLegend/);
    expect(SRC).toMatch(/ru-legend-show/);
  });

  it('counts every competition toward a career total', () => {
    expect(SRC).toMatch(/row\.immWins\+row\.rewWins\+\(row\.comp3Wins\|\|0\)/);
  });
});

describe('loading the season that is open in the simulator', () => {
  // `extractSeasonTemplate()` is the TOTAL DRAMA builder and stamps
  // `format: 'total-drama'` on whatever it is handed. Pressing the button on
  // a Big Brother season therefore produced a Total Drama document: the board
  // relabelled itself back to Imm/Rew and then filled those columns from
  // immunityWins and rewardWins, which a house does not have. Every player
  // came out zero and the season ranked on placement alone.
  it('reaches for the house builder when the house is what is loaded', () => {
    expect(SRC).toMatch(/buildBigBrotherSeasonDocument/);
    const fn = SRC.slice(SRC.indexOf('function _ruUseCurrentSeason'),
      SRC.indexOf('let rankingsDB'));
    expect(fn, 'the button still always builds a Total Drama document')
      .toMatch(/houseNow[\s\S]*buildBigBrotherSeasonDocument[\s\S]*extractSeasonTemplate/);
    expect(fn, 'the house is detected from the format or the played weeks')
      .toMatch(/seasonConfig\?\.format === 'big-brother'|gs\?\.bb\?\.weeks/);
  });

  it('keeps the message the house builder gives an unfinished season', () => {
    const fn = SRC.slice(SRC.indexOf('function _ruUseCurrentSeason'),
      SRC.indexOf('let rankingsDB'));
    // 'play the finale before exporting' is actionable; swallowing it into
    // 'no season is loaded' sends somebody looking for the wrong problem.
    expect(fn).toMatch(/finale\|weeks/);
  });
});

describe('the published house document has what the board fills from', () => {
  it('carries the per-player tallies on a bb block', () => {
    const doc = JSON.parse(readFileSync(resolve(process.cwd(),
      'data/seasons/bb-1-data.json'), 'utf8'));
    expect(doc.format).toBe('big-brother');
    const p = doc.placements[0];
    for (const key of ['hohWins', 'vetoWins', 'blockBusterWins']) {
      expect(p.bb, `a placement with no ${key} fills the board with zeroes`)
        .toHaveProperty(key);
    }
  });
});
