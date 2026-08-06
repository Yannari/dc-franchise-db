// The finale's competition pickers, rendered by a real browser.
//
// The unit tests prove the finale RUNS what is pinned. They cannot prove the
// Season Timeline ever offers the pin, and a control that is only asserted
// about in a unit test is a control that can quietly stop being drawn — which
// is how five twists once shipped with no screen at all.
//
// Asserted on the rendered DOM rather than on visibility: the designer's panel
// switching is its own navigation story, and this is about whether the finale
// row draws its two pickers and whether choosing one is recorded where the
// finale reads it.
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking } from './helpers.js';

test('the finale row offers a picker for parts one and two', async ({ page }) => {
  const errors = attachErrorTracking(page);
  await page.goto(APP_URL);
  await seedCast(page, { count: 14 });
  await page.waitForFunction(() => typeof window.showTab === 'function');

  const row = await page.evaluate(() => {
    window.showTab('setup');
    window.seasonConfig.format = 'big-brother';
    window.seasonConfig.jurySize = 7;
    window.renderTimeline();
    const finale = document.querySelector('.fd-episode.finale');
    const comps = finale?.querySelector('.fd-ep-comps');
    return {
      html: comps?.innerHTML || '',
      selects: comps ? comps.querySelectorAll('select').length : 0,
      options: comps
        ? [...comps.querySelectorAll('select')].map(s => [...s.options].map(o => o.value))
        : [],
    };
  });

  expect(row.selects, 'the finale row drew no competition pickers').toBe(2);
  expect(row.html).toContain('PART 1');
  expect(row.html).toContain('PART 2');
  // Part three is stated, not offered — it is the jury quiz every season.
  expect(row.html).toContain('Jury Statements');
  expect(row.options.flat()).not.toContain('bb-final-part-three');

  // Each picker offers a real choice, including the set piece written for it.
  expect(row.options[0].length).toBeGreaterThan(2);
  expect(row.options[1].length).toBeGreaterThan(2);
  expect(row.options[0]).toContain('bb-final-part-one');
  expect(row.options[1]).toContain('bb-final-part-two');

  // And choosing one lands where the finale looks for it.
  const pinned = await page.evaluate(() => {
    const sel = document.querySelector('.fd-episode.finale .fd-ep-comps select');
    sel.value = 'bb-final-part-one';
    sel.dispatchEvent(new Event('change'));
    return window.seasonConfig.bbFinalComps;
  });
  expect(pinned?.one).toBe('bb-final-part-one');

  // The tracker hands back { pageErrors, consoleErrors }, not a flat array.
  expect(errors.pageErrors, JSON.stringify(errors.pageErrors)).toEqual([]);
  expect(errors.consoleErrors, JSON.stringify(errors.consoleErrors)).toEqual([]);
});
