// ============================================================================
// A11Y / ROBUSTNESS SMOKE  —  UX Plan Item 13 (part C)
// ----------------------------------------------------------------------------
// Loose, non-pixel checks that the shell survives keyboard nav, reduced motion,
// and the theme toggle. See journey.spec.js for the full flow + run notes.
// ============================================================================
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking, expectClean, clearStorage } from './helpers.js';

test.describe('Robustness smoke', () => {
  test('keyboard reaches the tab bar and casting-room cards; Escape closes the drawer', async ({ page }) => {
    const errors = attachErrorTracking(page);
    await page.goto(APP_URL);
    await clearStorage(page);
    await page.reload();
    await page.waitForFunction(() => typeof window.showTab === 'function');

    await seedCast(page);

    // Tab-bar buttons are focusable (keyboard-reachable primary nav).
    const castTabBtn = page.locator(`[onclick="showTab('cast')"]`).first();
    await castTabBtn.focus();
    await expect(castTabBtn).toBeFocused();

    // Casting-room cards are keyboard-focusable (tabindex=0, role=button).
    const firstCard = page.locator('#tab-cast .cr-card').first();
    await expect(firstCard).toHaveAttribute('tabindex', '0');
    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    // Escape closes the Manage drawer/menu.
    await page.locator('.cr-manage-btn').first().click();
    await expect(page.locator('#cr-manage-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#cr-manage-menu')).toBeHidden();

    expectClean(errors, 'keyboard');
  });

  test('renders under prefers-reduced-motion: reduce', async ({ page }) => {
    const errors = attachErrorTracking(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(APP_URL);
    await page.waitForFunction(() => typeof window.showTab === 'function');

    // Shell renders — nav present, no page errors. Not a pixel assertion.
    await expect(page.locator(`[onclick="showTab('cast')"]`).first()).toBeVisible();
    await seedCast(page);
    await expect(page.locator('#tab-cast .cr-card')).toHaveCount(14);
    expectClean(errors, 'reduced-motion');
  });

  test('theme toggle flips the documented data-theme', async ({ page }) => {
    const errors = attachErrorTracking(page);
    await page.goto(APP_URL);
    await page.waitForFunction(() => typeof window.showTab === 'function');

    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toBeVisible();
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(before); // dark <-> light
    expectClean(errors, 'theme');
  });
});
