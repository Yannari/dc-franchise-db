// The show switcher, on the pages that used to ignore it.
//
// It is mounted by the site header on EVERY page, so it looked operable
// everywhere and filtered on two. A control that appears to work is worse than
// no control: "show me Big Brother" answered with all 152 players, 134 of whom
// have never been in that house.
//
// Asserted on counts rather than on the control, because the bug was never in
// the switcher — it was in the pages not listening.
import { test, expect } from '@playwright/test';

// Both were stale, and stale in a way that hid the bug they were meant to
// catch: the roster used to hold 152 Total Drama players with Big Brother's
// cast not merged into it at all. It is one roster now.
const BB_PLAYERS = 17;      // the cast of the one Big Brother season played
const ALL_PLAYERS = 169;    // 152 contestants + 17 houseguests

test('the timeline shows one show at a time', async ({ page }) => {
  await page.goto('/timeline.html?show=big-brother');
  await page.waitForSelector('th.season-col', { timeout: 15000 });
  await page.waitForTimeout(500);

  const cols = await page.locator('th.season-col a').allTextContents();
  expect(cols.map(c => c.trim())).toEqual(['BB1']);
  expect(await page.locator('tbody tr').count()).toBe(BB_PLAYERS);

  await page.goto('/timeline.html?show=all');
  await page.waitForSelector('th.season-col', { timeout: 15000 });
  await page.waitForTimeout(500);
  expect(await page.locator('th.season-col a').count()).toBeGreaterThan(14);
});

test('the players list shows one show at a time', async ({ page }) => {
  await page.goto('/devotees.html?show=big-brother');
  await page.waitForSelector('.card', { timeout: 15000 });
  await page.waitForTimeout(800);
  expect(await page.locator('.card').count()).toBe(BB_PLAYERS);

  await page.goto('/devotees.html?show=all');
  await page.waitForSelector('.card', { timeout: 15000 });
  await page.waitForTimeout(800);
  expect(await page.locator('.card').count()).toBe(ALL_PLAYERS);
});

test('a leaderboard is scoped to its show', async ({ page }) => {
  // Big Brother's only season was won by MISHA, so she tops a wins board that
  // is genuinely scoped. Alejandro tops it when both shows are counted.
  //
  // This named Wayne, who has played Total Drama seasons 9 and 13 and has never
  // been in that house — so it was asking a correctly-scoped board to show
  // somebody the scope excludes, and the board has been right all along.
  // Waiting on the board's TEXT rather than a row selector: the markup differs
  // between the worker and the local-JSON fallback, and which one answers is
  // exactly the thing a test must not depend on.
  await page.goto('/leaderboards.html?show=big-brother');
  await expect(page.locator('#board')).toContainText('Misha', { timeout: 20000 });
  await expect(page.locator('#board')).not.toContainText('Alejandro');

  await page.goto('/leaderboards.html?show=total-drama');
  await expect(page.locator('#board')).toContainText('Alejandro', { timeout: 20000 });
});

test('the social feed follows the show you picked', async ({ page }) => {
  await page.goto('/social.html?show=big-brother');
  await page.waitForSelector('.post, .msg, .state-card', { timeout: 15000 });
  await expect(page.locator('#ctx-chip')).toContainText('Big Brother');
});

/** A season's own name, which is what the wiki heads its sections with. */
function seasonTitle(format, number) {
  const db = JSON.parse(readFileSync('seasons_database.json', 'utf8'));
  const row = (db.seasons || []).find(s => s.seasonNumber === number
    && (s.format || 'total-drama') === format);
  if (!row?.title) throw new Error(`no season document for ${format} ${number}`);
  return row.title;
}

/** Whoever the roster says has played more than one show, if anybody has. */
function aTwoShowCareer() {
  const db = JSON.parse(readFileSync('players_database.json', 'utf8'));
  return (db.players || []).find(p => new Set((p.seasonDetails || [])
    .map(d => d.format || 'total-drama')).size > 1) || null;
}

test('a two-show career is described as two careers', async ({ page }) => {
  // "3 seasons" is true and useless for somebody who played two of one show and
  // one of another: it reads as a three-season veteran of one franchise, which
  // is a different career.
  //
  // FOUND IN THE DATA, NOT NAMED. This asked for Bowie, who has played Total
  // Drama 9 and 10 and nothing else — so it waited for a two-show layout on a
  // one-show career and timed out. Nobody in the franchise has crossed shows
  // yet, so today this skips; the day somebody returns across one it starts
  // guarding, without anybody remembering to come back and rename them.
  const vet = aTwoShowCareer();
  test.skip(!vet, 'no player has crossed shows yet');

  await page.goto(`/player.html?player=${vet.id}`);
  await page.waitForSelector('.pp-showhead', { timeout: 15000 });

  const shows = [...new Set((vet.seasonDetails || []).map(d => d.format || 'total-drama'))];
  const NAME = { 'total-drama': 'Total Drama', 'big-brother': 'Big Brother' };
  for (const f of shows) {
    const n = (vet.seasonDetails || []).filter(d => (d.format || 'total-drama') === f).length;
    await expect(page.locator('.pp-meta')).toContainText(`${n} ${NAME[f] || f}`);
  }

  // Each show gets its own heading and its own bars, because the career totals
  // are cross-format sums — one "Challenge Wins" bar belongs to neither show.
  expect(await page.locator('.pp-showhead').count()).toBe(shows.length);
  expect(await page.locator('.pp-statbars').count()).toBe(shows.length);
});

test('a Big Brother career shows the three competitions the house runs', async ({ page }) => {
  // The half of the old test that CAN run today, on the show that has a cast.
  // Big Brother keeps counters Total Drama has no equivalent for, and they were
  // computed into byShow and displayed nowhere at all.
  //
  // "Times Nominated" was the third chip until the competition record was split
  // into the three comps a house actually runs — the HOH, the veto and the
  // arena — which is what the total is made of and what the total could not say.
  await page.goto('/player.html?player=misha&show=big-brother');
  await page.waitForSelector('.pp-chip', { timeout: 20000 });
  const chips = (await page.locator('.pp-chip .l').allTextContents()).map(t => t.replace(/\s+/g, ' ').trim());
  expect(chips).toContain('HOH');
  expect(chips).toContain('Vetoes');
  expect(chips.join(' ')).toMatch(/Block ?Buster/i);
  // And immunity is Total Drama's word: it must not appear on a houseguest.
  const bars = await page.locator('.pp-statlbl').allTextContents();
  expect(bars.join(' ')).not.toMatch(/Immunity/i);
});

test('a one-show career is not made to look like two', async ({ page }) => {
  await page.goto('/player.html?player=alejandro');
  await page.waitForSelector('.pp-statbars', { timeout: 15000 });
  expect(await page.locator('.pp-showhead').count()).toBe(0);
  await expect(page.locator('.pp-meta')).toContainText('4 seasons');
});

test('the wiki is its own tab, and one article per show', async ({ page }) => {
  // A character's Big Brother article and their Total Drama article are
  // different articles. Stacked under one heading — which is how this first
  // shipped — every section had to be read twice to work out which show it was
  // about.
  await page.goto('/player.html?player=bowie');
  await page.waitForSelector('.pp-viewtab', { timeout: 15000 });
  await expect(page.locator('#pp-view-wiki')).toBeHidden();

  await page.click('#pv-wiki');
  await expect(page.locator('.wk-article')).toBeVisible();
  // Laid out like a fandom article: infobox, contents, sections.
  await expect(page.locator('.wk-infobox')).toBeVisible();
  await expect(page.locator('.wk-lead')).toContainText('Bowie');

  // A SEASON IS NAMED, NOT NUMBERED. This looked for the literal "Season 9";
  // the article heads its season sections with the season's own title, so
  // Bowie's read "Total Drama: Land of Powers" and "Champions vs Contenders".
  // Numbering them would be worse, and on two shows it would be ambiguous —
  // there is a season 9 on more than one show now.
  const td = await page.locator('.wk-section h2').allTextContents();
  expect(td.join(' '), 'no season of his is named in the article')
    .toContain(seasonTitle('total-drama', 9));
  await expect(page.locator('.wk-ib-show')).toContainText('Total Drama');
});

test('the wiki follows the show switcher', async ({ page }) => {
  // ON SOMEBODY WHO HAS THAT CAREER. This asked for Bowie's Big Brother
  // article, and Bowie has never been in that house — so it waited for an
  // article on a page that correctly says "No Big Brother article" instead.
  await page.goto('/player.html?player=misha&view=wiki&show=big-brother');
  await page.waitForSelector('.wk-article', { timeout: 15000 });
  await expect(page.locator('.wk-ib-show')).toContainText('Big Brother');

  const heads = await page.locator('.wk-section h2').allTextContents();
  expect(heads.join(' '), 'the Big Brother article is showing a Total Drama season')
    .not.toContain(seasonTitle('total-drama', 9));
  expect(heads.join(' '), 'the Big Brother season is not in its own article')
    .toContain(seasonTitle('big-brother', 1));
});

test('a show they never played says so, with a way across', async ({ page }) => {
  // Not an empty page with headings and nothing under them.
  //
  // Scoped in on the WIKI view: the profile has its own empty state for the
  // same situation ("No Big Brother career"), so a bare .wk-empty now matches
  // two elements, one of them in the hidden tab.
  await page.goto('/player.html?player=alejandro&view=wiki&show=big-brother');
  const wiki = page.locator('#pp-view-wiki');
  await expect(wiki.locator('.wk-empty h2')).toContainText('No Big Brother article');

  await wiki.locator('[data-wiki-show="total-drama"]').click();
  await expect(page.locator('.wk-article')).toBeVisible();
  await expect(page.locator('.wk-ib-show')).toContainText('Total Drama');
});

test('a profile scoped to a show they never played is empty, not their other career', async ({ page }) => {
  // The page ignoring the question: switch the site to Big Brother, open
  // somebody who has only played Total Drama, and read their Total Drama stats
  // under a Big Brother heading.
  await page.goto('/player.html?player=alejandro&show=big-brother');
  await page.waitForSelector('.pp-viewtab', { timeout: 15000 });

  await expect(page.locator('.wk-empty h2')).toContainText('No Big Brother career');
  expect(await page.locator('.pp-statbars').count(), 'a career was drawn anyway').toBe(0);
  expect(await page.locator('.pp-tab').count()).toBe(0);
  // and it offers the career that does exist
  await expect(page.locator('[data-goto-show="total-drama"]')).toBeVisible();
});

test('a profile scoped to a show they DID play shows only that show', async ({ page }) => {
  // ON SOMEBODY WHO PLAYED IT. This opened Bowie under a Big Brother filter and
  // waited for his Big Brother season; he has played Total Drama 9 and 10 and
  // has never been in that house, so the page correctly shows an empty career
  // and the test read that as a scoping failure. The neighbouring test above
  // already covers the empty case on purpose.
  await page.goto('/player.html?player=misha&show=big-brother');
  await page.waitForSelector('.pp-meta', { timeout: 15000 });

  await expect(page.locator('.pp-meta')).toContainText('1 season');
  await expect(page.locator('.pp-meta')).toContainText('#1');
  const tabs = await page.locator('.pp-tab').allTextContents();
  expect(tabs.map(t => t.replace(/[^A-Za-z0-9]/g, ''))).toEqual(['BB1']);

  // And the season tab is the house's, not a bare integer that could be either
  // show's season 1.
  await expect(page.locator('.pp-meta')).toContainText('BB1');
});

test('a comparison compares within one show, and says which', async ({ page }) => {
  // Comparing on totalChallengeWins compares cross-format sums — a Big Brother
  // competition win is folded into that field by design — so under a show
  // filter the table counted seasons the filter excluded. A side-by-side is
  // where an unattributable number does the most damage.
  // ON TWO PEOPLE WHO PLAYED IT. This compared Bowie and Wayne under a Big
  // Brother filter; neither has ever been in that house, so the page correctly
  // answers "there is nothing to compare" and the test read that as a failure
  // to scope. The scoping it wants to see needs a pair the scope contains.
  await page.goto('/compare.html?players=misha,jules&show=big-brother');
  await expect(page.locator('#statsTable')).toContainText('Big Brother only', { timeout: 15000 });
  await expect(page.locator('#statsTable')).not.toContainText('Career totals');

  // And the empty answer is still the right answer for a pair who did not.
  await page.goto('/compare.html?players=bowie,wayne&show=big-brother');
  await expect(page.locator('#statsTable')).toContainText('never played Big Brother', { timeout: 15000 });

  await page.goto('/compare.html?players=bowie,wayne&show=all');
  await expect(page.locator('#statsTable')).toContainText('Career totals across every show', { timeout: 15000 });
});

test('comparing two people on a show neither played says so', async ({ page }) => {
  await page.goto('/compare.html?players=alejandro,heather&show=big-brother');
  await expect(page.locator('#statsTable')).toContainText('never played Big Brother', { timeout: 15000 });
});

test('the franchise page does not lend one show another show\'s narrative', async ({ page }) => {
  // franchise_database.json predates the second show and carries no format:
  // its evolution and trends are keyed by bare season number, so read under a
  // Big Brother scope they hand Big Brother 1 Total Drama season 1's story.
  await page.goto('/franchise.html?show=big-brother');
  await page.waitForSelector('#sc-seasons', { timeout: 15000 });
  await page.waitForTimeout(1200);

  await expect(page.locator('#evolution-list')).toContainText('written for Total Drama');
  await expect(page.locator('#trends-grid')).toContainText('recorded for Total Drama only');

  await page.goto('/franchise.html?show=total-drama');
  await page.waitForTimeout(1500);
  await expect(page.locator('#evolution-list')).not.toContainText('written for Total Drama');
});

// ── NO SHOW IS DESCRIBED IN ANOTHER SHOW'S WORDS ─────────────────────────
//
// The unit half of this lives in tests/show-vocabulary.test.js and runs against
// synthetic fixtures. This half runs against the SITE'S OWN DATA, on the page
// where both of the shipped bugs actually appeared:
//
//   "reached the end without ever being nominated"  — over a Total Drama season
//   "Amelie was evicted, 5-2."                      — over a camp
//
// Scoped deliberately to the text the PAGE generates — headings, table headers,
// the grid legend, the derived facts line under each round, and trivia. The
// AI-written narrative and per-round prose are excluded: they are somebody's
// prose rather than the page's, and holding a language model to a word list
// would make this fail for reasons nobody can fix in the code.
import { readFileSync } from 'node:fs';

const EXCLUSIVE = {
  'big-brother': ['head of household', 'power of veto', 'evicted', 'eviction',
    'houseguest', 'nominated', 'nomination', 'on the block'],
  'total-drama': ['tribe', 'tribal council', 'campfire', 'immunity challenge',
    'contestant', 'voted out'],
};

/**
 * One published season per registered show — and specifically one that HAS a
 * round-by-round record.
 *
 * The first version picked whichever season came first in the index, which for
 * Total Drama is season 1: exported before ballots were carried, so its Game
 * history section renders nothing and the assertion passed over an empty page.
 * A guard that passes because there was nothing to check is the failure mode
 * this whole file exists to prevent.
 */
function seasonsToCheck() {
  const db = JSON.parse(readFileSync('seasons_database.json', 'utf8'));
  const chosen = new Map();
  for (const s of db.seasons || []) {
    const format = s.format || 'total-drama';
    if (chosen.has(format)) continue;
    const ref = s.seasonId || String(s.seasonNumber);
    const file = format === 'total-drama'
      ? `season${s.seasonNumber}-data.json`
      : `${ref}-data.json`;
    let doc;
    try { doc = JSON.parse(readFileSync(`data/seasons/${file}`, 'utf8')); } catch { continue; }
    const rounds = (doc.weeks || []).length + (doc.votingHistory || []).length;
    if (rounds) chosen.set(format, ref);
  }
  return [...chosen.entries()];
}

for (const [format, seasonRef] of seasonsToCheck()) {
  test(`the ${format} season page speaks its own show (${seasonRef})`, async ({ page }) => {
    await page.goto(`/season_ref.html?season=${seasonRef}`);
    await page.waitForSelector('.sr-tab', { timeout: 15000 });
    await page.getByRole('button', { name: /wiki/i }).click();
    await page.waitForSelector('#sr-panel-wiki .wk-article', { timeout: 15000 });

    // The round-by-round section must actually be on the page. Without this,
    // a season with no ballots renders nothing and passes for free.
    expect(await page.locator('#sr-panel-wiki .sr-week').count()).toBeGreaterThan(0);

    // EVERYTHING THE PAGE WROTE, minus the parts a model wrote.
    //
    // An allowlist of selectors was the first attempt and it missed the bug: the
    // derived round line lives in `.sr-week-b` when a season has no written
    // prose and in `.sr-week-f` when it does, and the allowlist named only the
    // second. Taking the whole panel and REMOVING the AI-written nodes cannot
    // miss a place the page generates text, which is the property that matters.
    const generated = await page.evaluate(() => {
      const clone = document.querySelector('#sr-panel-wiki').cloneNode(true);
      // .sr-week-p — the per-round narrative; .wk-lead — the season narrative.
      clone.querySelectorAll('.sr-week-p, .wk-lead').forEach(el => el.remove());
      return clone.textContent.replace(/\s+/g, ' ');
    });

    const forbidden = Object.entries(EXCLUSIVE)
      .filter(([f]) => f !== format).flatMap(([, list]) => list);
    // `\\b`, not `\b`: inside a template literal `\b` is the backspace
    // character, so the pattern becomes "\x08evicted\x08" and matches nothing.
    // The first version of this line had it wrong and passed against a page
    // that was visibly saying "was evicted" over a Total Drama season.
    const found = forbidden.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(generated));
    expect(found, `${format} page used another show's words: ${found.join(', ')}`).toEqual([]);
  });
}
