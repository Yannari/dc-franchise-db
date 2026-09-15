// ══════════════════════════════════════════════════════════════════════
// current-season-split.test.js — a season with several winners does not throw
// ══════════════════════════════════════════════════════════════════════
//
// A Traitors season can end in a split: `winners[]` holds every taker and
// `winner` is null. current-season.html read `seasonData.winner.name` in five
// places and threw on it. The page script cannot be imported, so the functions
// are lifted out by name and run against a real split season from the engine.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { buildTraitorsSeasonDocument } from '../js/tr/export.js';
import { seasonWinners } from '../js/records.js';
import roster from '../franchise_roster.json';

const html = readFileSync('current-season.html', 'utf8');

/** `function name(...) { ... }` out of the page, by brace count. */
function lift(name) {
  const start = html.indexOf(`function ${name}(`);
  expect(start, `${name} is no longer in current-season.html`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = html.indexOf('{', start); i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`${name} never closes`);
}

const ROSTER = roster.players.slice(0, 20);
function splitDoc() {
  for (let seed = 1; seed <= 300; seed++) {
    setPlayers(ROSTER);
    const doc = buildTraitorsSeasonDocument(
      playTraitorsSeason({ cast: ROSTER.map(p => p.name), traitorCount: 3, seed }), { seasonNumber: 1 });
    if (doc.winners.length > 1) return doc;
  }
  return null;
}

let prevWindow;
beforeAll(() => { prevWindow = globalThis.window; });
afterAll(() => { globalThis.window = prevWindow; });

describe('a split season on the Current Season page', () => {
  const doc = splitDoc();
  const page = new Function(
    `${lift('_csWinners')}\n${lift('generateVotingAnalyticsHTML')}\n`
    + 'return { _csWinners, generateVotingAnalyticsHTML };')();

  it('found a split, or nothing below is tested', () => {
    expect(doc, 'no season in 300 seeds ended in a split').toBeTruthy();
    expect(doc.winner).toBe(null);
  });

  it('names every winner through the shared resolver', () => {
    globalThis.window = { __seasonWinners: seasonWinners };
    expect(page._csWinners(doc).map(w => w.name).sort())
      .toEqual(doc.winners.map(w => w.name).sort());
  });

  it('draws the voting chart with every winner and no jury', () => {
    globalThis.window = { __seasonWinners: seasonWinners };
    const out = page.generateVotingAnalyticsHTML(doc);
    expect(out).toContain('Winners:');
    for (const w of doc.winners) expect(out).toContain(w.name);
    expect(out, 'a jury vote on a show with no jury').not.toMatch(/jury vote/);
  });

  it('still reads a lone winner before the module block has loaded', () => {
    globalThis.window = {};
    expect(page._csWinners({ winner: { name: 'Gwen', vote: '5-3' } }))
      .toEqual([expect.objectContaining({ name: 'Gwen', vote: '5-3' })]);
    expect(page._csWinners({ winner: null, winners: [{ name: 'A' }, { name: 'B' }] })).toEqual([]);
  });

  it('has no unguarded read of a winner block left in the page', () => {
    const unguarded = html.match(/\b(?:seasonData|aiData)\.winner\.\w+|\$\{winner\.\w+/g) || [];
    expect(unguarded, unguarded.join(' | ')).toEqual([]);
  });

  it('the module block publishes the resolver the page reads', () => {
    expect(html).toMatch(/import \{ seasonWinners \} from '\.\/js\/records\.js'/);
    expect(html).toMatch(/window\.__seasonWinners = seasonWinners/);
  });
});
