// ══════════════════════════════════════════════════════════════════════
// season-ref-page.test.js — the season page, rendered and read
// ══════════════════════════════════════════════════════════════════════
//
// `season_ref.html`'s wiki tab is a page script: it cannot be imported, and
// nothing had ever executed it. So it shipped a Traitors season with:
//
//   * every one of fifteen departures labelled "Voted out", seven of which
//     were murders, and the word "banished" on the page ZERO times
//   * a header reading "Voted to evict" over a banishment ballot
//   * "reached the end without ever having a vote cast against them" about
//     five people, contradicted two sections higher by the page's own voting
//     grid — the canonical bug sentence from CLAUDE.md
//   * an infobox headed "Total Drama", from a two-way ternary, on the page
//     whose entire job is to be about one particular season
//
// None of it errors. All of it is prose. The only way to find it is to RUN the
// page and READ what it draws, which is what this does: the wiki-tab statement
// is extracted by its anchor and executed against real documents from all
// three shows. The anchor doubles as a staleness guard — if the block is
// renamed or moved, this fails rather than silently testing nothing.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { join } from 'node:path';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { buildTraitorsSeasonDocument, TRAITORS_FORMAT } from '../js/tr/export.js';
import { DEFAULT_FORMAT, showWords, exitVerbs, roundExits, publicBallots,
  showName, seasonId, parseSeasonRef } from '../js/shows.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const PAGE = join(process.cwd(), 'season_ref.html');
const ANCHOR = 'const wikiHTML = (() => {';

/** The page's own wiki-tab statement, extracted and made callable. */
function wikiTab() {
  const src = fs.readFileSync(PAGE, 'utf8').split('\n');
  const start = src.findIndex(l => l.includes(ANCHOR));
  expect(start, `season_ref.html no longer builds its wiki tab as "${ANCHOR}"`)
    .toBeGreaterThan(-1);
  const end = src.findIndex((l, i) => i > start && l.trim() === '})();');
  expect(end, 'the wiki-tab block is not closed the way this reader expects')
    .toBeGreaterThan(start);
  // eslint-disable-next-line no-new-func
  return new Function('s', 'shows', src.slice(start + 1, end).join('\n'));
}

// The page reaches js/shows.js through `window.shows`; this is that handle.
const shows = { showWords, exitVerbs, roundExits, publicBallots,
  showName, seasonId, parseSeasonRef, DEFAULT_FORMAT };

const strip = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const render = doc => strip(wikiTab()(doc, shows));

const traitorsDoc = (() => {
  setPlayers(ROSTER);
  const season = playTraitorsSeason({ cast: ROSTER.map(p => p.name), traitorCount: 3, seed: 7 });
  return buildTraitorsSeasonDocument(season, { seasonNumber: 1 });
})();
const readDoc = f => JSON.parse(fs.readFileSync(join(process.cwd(), 'data/seasons', f), 'utf8'));
const tdDoc = readDoc('season8-data.json');   // the live co-winner season
const bbDoc = readDoc('bb-1-data.json');

describe('the season page names its own show', () => {
  it('heads a season with the show that made it', () => {
    // A two-way ternary on `weeks.length` printed "Total Drama" in a Traitors
    // infobox, while `showName` sat imported forty lines above and correct.
    expect(render(traitorsDoc)).toContain(showName(TRAITORS_FORMAT));
    expect(render(traitorsDoc), 'a Traitors season headed as Total Drama')
      .not.toContain(showName(DEFAULT_FORMAT));
    // And neither shipped show moved.
    expect(render(tdDoc)).toContain(showName(DEFAULT_FORMAT));
    expect(render(bbDoc)).toContain(showName('big-brother'));
    expect(render(bbDoc)).not.toContain(showName(TRAITORS_FORMAT));
  });

  it('counts its cast in the show own noun', () => {
    expect(render(traitorsDoc)).toMatch(/20 players/);
    expect(render(tdDoc)).toMatch(/\d+ contestants/);
    expect(render(bbDoc)).toMatch(/\d+ houseguests/);
  });
});

describe('every departure is described by the door it went through', () => {
  it('labels a murder as a murder and a banishment as a banishment', () => {
    const text = render(traitorsDoc);
    const [banish, murder] = exitVerbs(TRAITORS_FORMAT);
    const count = w => (text.match(new RegExp(w, 'gi')) || []).length;
    // Both, and neither standing in for the other. The measured defect was
    // fifteen "Voted out" labels and zero occurrences of "banished".
    expect(count(banish), 'the page never says "banished"').toBeGreaterThan(4);
    expect(count(murder), 'the page never says "murdered"').toBeGreaterThan(4);
    expect(text, 'a camp verb over a castle').not.toMatch(/\bVoted out\b/);
    expect(text, 'a house verb over a castle').not.toMatch(/\bEvicted\b/);
  });

  it('draws everybody who left, not only the person the vote removed', () => {
    // `evicted` is the BANISHMENT. Reading it as "who left" left the murdered
    // out of the wall, the grid and the round-by-round entirely.
    const html = wikiTab()(traitorsDoc, shows);
    const text = strip(html);
    const murdered = (traitorsDoc.votingHistory || [])
      .flatMap(r => r.exits || []).filter(x => x.verb === 'murdered');
    expect(murdered.length, 'this season murdered nobody — the arm is vacuous')
      .toBeGreaterThan(4);
    for (const x of murdered) {
      expect(text, `${x.name} was murdered and is nowhere on the page`).toContain(x.name);
      expect(text, `${x.name} was murdered and the page says they were banished`)
        .not.toContain(`${x.name} was banished`);
      /* AND THEY HAVE TO ACTUALLY LEAVE. Naming them in the round-by-round is
         not leaving: the cast wall reads its exit ledger, and that ledger was
         built from `w.evicted` — the vote — so the murdered kept a card with
         no exit under it and stayed lit through the rest of the season. The
         wall's own tooltip says which round somebody went out in. */
      expect(html, `${x.name} was murdered and the wall records no exit for them`)
        .toMatch(new RegExp(`${x.name}[^"]*out in episode`, 'i'));
    }
  });

  it('heads the ballot column with the act, not another show act', () => {
    expect(render(traitorsDoc)).toContain('Voted to banish');
    expect(render(bbDoc)).toContain('Voted to evict');
    // A CAMP HAS NO EVICTIONS EITHER, and this header said so for fourteen
    // published seasons.
    expect(render(tdDoc), 'a camp headed its ballot column "Voted to evict"')
      .not.toContain('Voted to evict');
  });

  it('says missions, not challenges, about a castle', () => {
    expect(render(traitorsDoc)).not.toMatch(/won the most challenges/);
    expect(render(tdDoc)).toMatch(/won the most challenges/);
  });
});

describe('the page does not contradict its own voting grid', () => {
  it('never claims somebody was untouched who its own grid shows taking votes', () => {
    // THE CANONICAL BUG SENTENCE. It trusted `p.votesReceived`, a field a
    // document can simply not carry, and an absent number is not a zero — so
    // the page said five people reached the end untouched while, two sections
    // higher, its grid showed one of them taking votes in episode two.
    const text = render(traitorsDoc);
    const m = text.match(/([^.]*) reached the end without ever having a vote cast against them/);
    const named = m ? m[1].split(/,\s*/).map(x => x.trim()).filter(Boolean) : [];
    const against = {};
    for (const r of traitorsDoc.votingHistory || []) {
      for (const v of publicBallots(r, TRAITORS_FORMAT)) {
        if (v.target) against[v.target] = (against[v.target] || 0) + 1;
      }
    }
    for (const n of named) {
      expect(against[n] || 0,
        `the page says ${n} was never voted against; its own grid counts ${against[n]}`)
        .toBe(0);
    }
    // The season has to contain somebody who WAS voted against, or this arm
    // is checking an empty list.
    expect(Object.keys(against).length, 'nobody was ever voted against')
      .toBeGreaterThan(5);
  });

  it('names every champion of a split season and no champion as its runner-up', () => {
    // `winner{}` is singular and a split leaves it null, so the row that
    // exists to say who won said nothing; and the runner-up was `cast[1]`,
    // which on a split is another champion. Season 8 is the live case.
    const text = render(tdDoc);
    const firsts = (tdDoc.placements || []).filter(p => Number(p.placement) === 1);
    expect(firsts.length, 'season 8 is the co-winner fixture; it must stay one')
      .toBeGreaterThan(1);
    for (const p of firsts) expect(text).toContain(p.name);
    expect(text).toMatch(/Winners/);
    const ru = text.match(/Runner-up ([A-Za-z' -]+?) (?:Contents|Jury|Winner)/);
    if (ru) {
      expect(firsts.map(p => p.name),
        'a co-winner is listed as the runner-up on their own season page')
        .not.toContain(ru[1].trim());
    }
  });
});

// ══ the winner card, on every season that has ever shipped ════════════
//
// The Strategy and Legacy blocks moved INSIDE `sr-winner-info` so that a split
// season draws them under the person the singular `winner{}` block actually
// names, instead of under whichever champion came first. That is right, and it
// silently changed the layout of all fifteen published seasons: `sr-winner-row`
// is `display:flex; align-items:center`, so a one-line row became a paragraph
// with a 72px avatar floating in the middle of it. Content preserved is not
// layout preserved, and nothing had rendered this.
describe('the winner card of every published season', () => {
  const winnerCard = () => {
    const src = fs.readFileSync(PAGE, 'utf8').split('\n');
    const start = src.findIndex(l => l.includes('const winnerHTML=`<div class="sr-winner">'));
    expect(start, 'season_ref.html no longer builds a winner card this way')
      .toBeGreaterThan(-1);
    const end = src.findIndex((l, i) => i > start && l.trim() === '</div>`;');
    expect(end).toBeGreaterThan(start);
    // eslint-disable-next-line no-new-func
    return new Function('s', '_won', 'w', 'finalistsHTML',
      `${src.slice(start, end + 1).join('\n')} return winnerHTML;`);
  };

  /** The page's own resolution rule, so this reads what the page would draw. */
  const wonOf = doc => (doc.winners && doc.winners.length ? doc.winners
    : ((doc.placements || []).filter(p => p.placement === 1).length
      ? (doc.placements || []).filter(p => p.placement === 1)
      : (doc.winner ? [typeof doc.winner === 'string' ? { name: doc.winner } : doc.winner] : [])))
    .filter(x => x && x.name);

  const files = fs.readdirSync(join(process.cwd(), 'data/seasons'))
    .filter(f => f.endsWith('-data.json'));

  it('keeps the prose, and never centres an avatar against a paragraph', () => {
    expect(files.length, 'no published seasons to render').toBeGreaterThan(10);
    const fn = winnerCard();
    let withProse = 0;
    for (const f of files) {
      const doc = readDoc(f);
      const won = wonOf(doc);
      const html = fn(doc, won, doc.winner, '');
      // One card per winner, still.
      expect((html.match(/sr-winner-row/g) || []).length,
        `${f}: one row per champion`).toBe(won.length);
      // The prose belongs to the singular block and appears once, under the
      // person that block names — never copied onto a co-winner.
      const strategy = (html.match(/>Strategy</g) || []).length;
      const legacy = (html.match(/>Legacy</g) || []).length;
      expect(strategy, `${f}: the strategy block was duplicated or lost`)
        .toBeLessThanOrEqual(1);
      expect(legacy, `${f}: the legacy block was duplicated or lost`)
        .toBeLessThanOrEqual(1);
      if (strategy || legacy) {
        withProse++;
        // AND THE ROW HOLDING IT IS TOP-ALIGNED. `align-items:center` against a
        // paragraph puts the portrait halfway down it.
        expect(html, `${f}: prose inside a centred row`).toContain('is-tall');
      }
    }
    // Every shipped season carries this prose, so a run that found none would
    // be checking nothing at all.
    expect(withProse, 'no published season carries winner prose').toBeGreaterThan(10);
  });
});
