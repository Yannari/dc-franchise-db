// ============================================================================
// PRIMARY-JOURNEY E2E SAFETY NET  —  UX Plan Item 13
// ----------------------------------------------------------------------------
// One serial journey through the whole game-first flow on a shared page:
//   Boot -> Cast -> Quick Setup -> Season Hub -> mid-season Overview ->
//   fast-forward to finale -> Retrospective -> Franchise -> reload persistence.
//
// This suite exists to catch the SHELL/UI regressions unit tests miss:
//   * always-open Manage menu           (must be closed on load, close on Escape)
//   * casting-room cross-tab bleed       (visible ONLY on the Cast tab)
//   * missing cast-tab scroll            (overflow content must scroll)
//   * clipped Season dropdown            (z-index: opens fully above the rail)
//   * dead module graph                  (zero pageerrors; window API exposed)
//
// HOW TO RUN
//   npx playwright install chromium      # one-time browser download
//   npm run test:e2e                     # or: npx playwright test
//   npm run test:all                     # vitest + playwright together
//
// SERVER: Playwright starts `python serve.py 4173` (see playwright.config.js).
// serve.py sends Cache-Control: no-store — plain http.server caches stale ES
// modules and poisons runs. Never swap it for `python -m http.server`.
//
// The journey spine uses REAL UI clicks (tabs, preset card, Start, Play Episode,
// Season menu, winner portrait). Bulk data (the 14-player cast, episodes 2..N)
// is seeded programmatically — hand-typing a cast through the form is not the
// regression surface this suite guards.
// ============================================================================
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking, expectClean, clearStorage, fastForwardToFinale } from './helpers.js';

test.describe.configure({ mode: 'serial' });

/** Click a real tab-bar button by its showTab() target — unambiguous locator. */
function tab(page, key) { return page.locator(`[onclick="showTab('${key}')"]`).first(); }

test.describe('Primary journey', () => {
  let page;
  let errors;
  let winner; // resolved at the finale, asserted in retrospective + franchise

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    errors = attachErrorTracking(page);
    await page.goto(APP_URL);
    await clearStorage(page);        // guarantee a clean origin regardless of reuse
    await page.reload();
    await page.waitForFunction(() => typeof window.showTab === 'function');
  });

  test.afterAll(async () => { await page?.close(); });

  // ── 1. Boot ───────────────────────────────────────────────────────────────
  test('boots with a live module graph and no errors', async () => {
    // Dead-module-graph guard: if any module failed to load, main.js could not
    // have exposed these on window.
    const api = await page.evaluate(() => ['showTab', 'renderCast', 'simulateNext',
      'simulateFinale', 'qsStartSeason', 'frOpenCareer'].map((k) => typeof window[k]));
    expect(api).toEqual(['function', 'function', 'function', 'function', 'function', 'function']);

    // Journey nav stages present (assert presence, never an exhaustive list — the
    // parallel agent may add sections).
    await expect(tab(page, 'cast')).toBeVisible();
    await expect(tab(page, 'setup')).toBeVisible();
    await expect(tab(page, 'run')).toBeVisible();

    // Cast tab is the landing stage.
    await expect(page.locator('#tab-cast')).toHaveClass(/active/);
    expectClean(errors, 'boot');
  });

  // ── 2. Cast ────────────────────────────────────────────────────────────────
  test('casting room: cards, filter, stats toggle, Manage menu, no bleed, scroll', async () => {
    await tab(page, 'cast').click();
    await seedCast(page);

    const cards = page.locator('#tab-cast .cr-card');
    await expect(cards).toHaveCount(14);

    // Manage menu closed by DEFAULT (the always-open regression).
    const menu = page.locator('#cr-manage-menu');
    await expect(menu).toBeHidden();
    // Opens on click, closes on Escape.
    await page.locator('.cr-manage-btn').first().click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    // Filter shrinks the grid (unique name -> one card).
    await page.locator('#cr-f-search').fill('Tester3');
    await expect(cards).toHaveCount(1);
    await page.locator('#cr-f-search').fill('');
    await expect(cards).toHaveCount(14);

    // Stats toggle reveals all 9 stats per card.
    await page.locator('#cr-statsbtn').click();
    await expect(page.locator('#tab-cast .cr-card').first().locator('.cr-as')).toHaveCount(9);

    // Cast tab scrolls when content overflows.
    const scroll = await page.evaluate(() => {
      const el = document.getElementById('tab-cast');
      return { overflowY: getComputedStyle(el).overflowY, overflows: el.scrollHeight > el.clientHeight };
    });
    expect(['auto', 'scroll', 'overlay']).toContain(scroll.overflowY);
    expect(scroll.overflows).toBe(true);

    // ZERO cross-tab bleed: the casting room must not paint on other tabs.
    // Checked on Franchise + Overview (both named in the bleed invariant).
    // NB: the Hub tab auto-initialises a season when players exist
    // (run-ui.initRunTab), so it is exercised at the Start step below rather
    // than here — visiting it now would create the season prematurely.
    for (const other of ['franchise', 'results']) {
      await tab(page, other).click();
      await expect(page.locator('#tab-cast')).toBeHidden();
      await expect(page.locator('#tab-cast .cr-grid')).toBeHidden();
    }
    await tab(page, 'cast').click();
    await expect(page.locator('#tab-cast')).toBeVisible();

    expectClean(errors, 'cast');
  });

  // ── 3. Quick Setup ──────────────────────────────────────────────────────────
  test('quick setup: preset updates blueprint + ready check, Start enabled', async () => {
    await tab(page, 'setup').click();
    await expect(page.locator('#tab-setup')).toBeVisible();

    // Season number so franchise auto-record has an identity to stamp.
    await page.locator('#qs-season-number').fill('42');

    // Real preset click updates the blueprint line + Ready Check.
    await page.locator('#qs-preset-survivor').click();
    await expect(page.locator('.qs-blueprint')).toContainText(/players/i);
    const readyRows = page.locator('.qs-ready-row');
    expect(await readyRows.count()).toBeGreaterThan(0);
    // No blocking (✗) rows — a valid 14/2-tribe cast clears every check.
    await expect(page.locator('.qs-ready-row', { hasText: '✗' })).toHaveCount(0);

    // Start enabled, and clicking it lands on the Season Hub with a live season.
    // Locate by class (`.qs-start`) so this is robust to the button's label —
    // "▶ Start Season" before init, "Open Season Hub →" once a season exists.
    const start = page.locator('.qs-start').first();
    await expect(start).toBeVisible();
    await expect(start).toBeEnabled();
    await start.click();
    await expect(page.locator('#tab-run')).toHaveClass(/active/);
    await page.waitForFunction(() => window.gs && window.gs.initialized && window.gs.activePlayers.length === 14);

    expectClean(errors, 'quick-setup');
  });

  // ── 4. Season Hub: play episode 1 ────────────────────────────────────────────
  test('season hub: Play Episode advances to EP 01 with results', async () => {
    await page.getByRole('button', { name: /Play Episode/ }).first().click();
    await page.waitForFunction(() => window.gs.episode >= 1 && window.gs.episodeHistory.length >= 1);

    await expect(page.locator('.hub-rail-num').first()).toHaveText('EP 01');
    // Aftermath / eliminated info present.
    await expect(page.locator('.ep-eliminated').first()).toContainText(/Tester/);
    expectClean(errors, 'season-hub-ep1');
  });

  // ── 5. Mid-season Overview ───────────────────────────────────────────────────
  test('overview is populated after episode 1', async () => {
    await tab(page, 'results').click();
    await expect(page.locator('#tab-results .overview-ranking')).toBeVisible();
    expect(await page.locator('#tab-results .overview-table-row').count()).toBeGreaterThan(0);
    expectClean(errors, 'overview-mid');
  });

  // ── 6. Fast-forward to the finale ────────────────────────────────────────────
  test('fast-forwards through the season and runs the finale', async () => {
    await tab(page, 'run').click();
    const ff = await fastForwardToFinale(page);
    expect(ff.phase).toBe('finale');

    // Run the finale via its real Hub button.
    await page.getByRole('button', { name: /Finale/ }).first().click();
    await page.waitForFunction(() => window.gs.phase === 'complete' && window.gs.finaleResult && window.gs.finaleResult.winner);
    winner = await page.evaluate(() => window.gs.finaleResult.winner);
    expect(winner).toMatch(/Tester/);
    expectClean(errors, 'finale');
  });

  // ── 7. Retrospective + Season dropdown (z-index regression) ───────────────────
  test('retrospective shows the winner and the Season dropdown opens unclipped', async () => {
    await tab(page, 'results').click();
    await expect(page.locator('#tab-results .retro-shell')).toBeVisible();
    await expect(page.locator('#tab-results .retro-hero')).toContainText(winner);
    expect(await page.locator('#tab-results .retro-placement').count()).toBeGreaterThan(0);

    // Season dropdown must open FULLY VISIBLE above the episode rail — the
    // z-index regression. Open it, then confirm its first item is genuinely on
    // top (elementFromPoint at the item centre resolves INSIDE the panel).
    const clip = await page.evaluate(() => {
      const sm = document.getElementById('season-menu');
      sm.open = true;
      const panel = sm.querySelector('.season-menu-panel');
      const first = panel.querySelector('button');
      const r = first.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        open: sm.open,
        // The top item's centre must resolve INSIDE the panel — i.e. nothing
        // (the episode rail, page chrome) is painted over it. THIS is the
        // z-index regression the invariant guards.
        covered: !panel.contains(hit),
        // The top item must clear the sticky nav (top >= 0) and sit above the
        // fold (bottom <= viewport height) — not clipped behind the rail below.
        // Horizontal edges are intentionally NOT asserted: the panel right-aligns
        // and may sit a few px past the viewport edge by design.
        topItemVerticallyOnScreen: r.top >= 0 && r.bottom <= innerHeight,
      };
    });
    expect(clip.open).toBe(true);
    expect(clip.covered).toBe(false);                  // not hidden behind rail/chrome
    expect(clip.topItemVerticallyOnScreen).toBe(true); // not clipped behind the rail
    await page.evaluate(() => { document.getElementById('season-menu').open = false; });

    expectClean(errors, 'retrospective');
  });

  // ── 8. Franchise: auto-recorded season + career panel ─────────────────────────
  test('franchise records the season and opens a career panel', async () => {
    await tab(page, 'franchise').click();
    // The auto-recorded season card carries the winner's name (assert presence,
    // not an exhaustive card list — a trophy case may be added alongside).
    await expect(page.locator('#tab-franchise .fr-card', { hasText: winner }).first()).toBeVisible();

    // Real click on the winner portrait opens the career legacy panel.
    await page.locator(`#tab-franchise [onclick="frOpenCareer('${winner}')"]`).first().click();
    const career = page.locator('.fr-career-panel');
    await expect(career).toBeVisible();
    await expect(career).toContainText(winner);
    expectClean(errors, 'franchise');
  });

  // ── 9. Reload persistence ─────────────────────────────────────────────────────
  test('reload restores the completed season and the franchise record', async () => {
    // Persist explicitly via the real Season menu, then reload.
    await tab(page, 'run').click();
    await page.evaluate(() => { window.saveSeasonToStorage && window.saveSeasonToStorage(); });
    await page.reload();
    await page.waitForFunction(() => typeof window.showTab === 'function');

    // Season restored to its completed state (localStorage survived).
    await page.waitForFunction((w) => window.gs && window.gs.phase === 'complete' && window.gs.finaleResult && window.gs.finaleResult.winner === w, winner);

    // Franchise record restored (IndexedDB survived).
    await tab(page, 'franchise').click();
    await expect(page.locator('#tab-franchise .fr-card', { hasText: winner }).first()).toBeVisible();

    expectClean(errors, 'reload');
  });
});
