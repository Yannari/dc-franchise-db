// Shared helpers for the E2E journey + smoke suites.
//
// Seeding philosophy (per UX Plan Item 13): drive the JOURNEY SPINE with real UI
// clicks (tab buttons, preset card, Start, Play Episode, Season menu, portraits),
// but SEED BULK DATA programmatically. Creating 12+ players one field at a time
// through the cast form is not the regression surface this suite guards.
import { expect } from '@playwright/test';

export const APP_URL = '/simulator.html';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

// A varied, VALID 14-player cast: 2 even tribes of 7, a couple of returnees,
// full 9-stat blocks. 14 players keeps the default quick-setup structure
// (merge 12/8, jury 9, finale 3/4) green in the Ready Check without any tuning.
export async function seedCast(page, { count = 14, seasonNumber = 42, seasonName = 'E2E Test Season' } = {}) {
  await page.evaluate(({ count, STAT_KEYS }) => {
    const archs = ['mastermind', 'hero', 'schemer', 'loyal-soldier', 'challenge-beast',
      'social-butterfly', 'villain', 'floater', 'wildcard', 'underdog',
      'perceptive-player', 'goat', 'chaos-agent', 'hothead'];
    const half = Math.ceil(count / 2);
    const mk = (i) => {
      const stats = {};
      STAT_KEYS.forEach((k, j) => { stats[k] = 3 + ((i * 3 + j * 2) % 8); });
      return {
        name: 'Tester' + (i + 1), slug: 'tester' + (i + 1),
        gender: i % 2 ? 'f' : 'm', sexuality: 'straight',
        archetype: archs[i % archs.length], stats,
        isReturnee: i < 2, tribe: i < half ? 'Red' : 'Blue', id: 't' + i,
      };
    };
    window.players = Array.from({ length: count }, (_, i) => mk(i));
    window.renderCast();
  }, { count, STAT_KEYS });
}

// Console/page-error tracker. avatar PNG 404s are EXPECTED (seeded testers have no
// portrait files) and filtered out. Anything else — including a .js/.mjs/.json 404
// (a dead module graph) or an uncaught JS exception — is a real regression.
export function attachErrorTracking(page) {
  const bucket = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (err) => bucket.pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // Playwright collapses resource-load failures to a bare "Failed to load
    // resource..." string; the failing URL lives in msg.location().url.
    const url = (msg.location && msg.location().url) || '';
    const text = msg.text();
    if (isExpectedAvatar404(text, url)) return;
    bucket.consoleErrors.push(url ? `${text}  @ ${url}` : text);
  });
  return bucket;
}

function isExpectedAvatar404(text, url) {
  // Only missing avatar PNGs are tolerated. A .js/.mjs/.json 404 (dead module
  // graph) has a non-.png URL and stays fatal.
  const isResource404 = /Failed to load resource/i.test(text) || /\b404\b/.test(text);
  return isResource404 && /\.png(\?|$)/i.test(url);
}

// Assert no real errors have accumulated, then clear the bucket so each checkpoint
// is independent. Includes any leaked text in the failure message for triage.
export function expectClean(bucket, label) {
  expect(bucket.pageErrors, `${label}: page errors\n${bucket.pageErrors.join('\n')}`).toHaveLength(0);
  expect(bucket.consoleErrors, `${label}: console errors\n${bucket.consoleErrors.join('\n')}`).toHaveLength(0);
  bucket.pageErrors.length = 0;
  bucket.consoleErrors.length = 0;
}

// Wipe per-origin storage so a run never inherits a previous season/franchise.
export async function clearStorage(page) {
  await page.evaluate(async () => {
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map((d) => new Promise((res) => {
        const req = indexedDB.deleteDatabase(d.name); req.onsuccess = req.onerror = req.onblocked = () => res();
      })));
    }
  });
}

// Fast-forward the running season to the finale phase using the exposed sim API.
// Real Play-Episode clicks drive episode 1 (the spine); bulk episodes are seeded.
export async function fastForwardToFinale(page, cap = 80) {
  return page.evaluate((cap) => {
    let i = 0;
    while (window.gs && window.gs.phase !== 'finale' && i < cap) { window.simulateNext(); i++; }
    return { iters: i, phase: window.gs.phase };
  }, cap);
}

// Read an IndexedDB value straight from the app's own persistence layer
// (savestate.js) inside the page. Used to verify writes actually landed.
export async function idbGet(page, key) {
  return page.evaluate(async (k) => {
    const m = await import('/js/savestate.js');
    return m._idbGet(k);
  }, key);
}

// Synchronization barrier: the app's auto-save (`saveGameState`) fires a
// fire-and-forget `_idbPut('gs', ...)`. Before reloading we poll a FRESH IDB
// read until the completed season is durably written, so the write can't race
// the reload on a slow runner.
export async function waitForGsPersisted(page, winner) {
  await page.waitForFunction(async (w) => {
    const m = await import('/js/savestate.js');
    const g = await m._idbGet('gs');
    return !!g && g.phase === 'complete' && g.finaleResult && g.finaleResult.winner === w;
  }, winner, { timeout: 15_000 });
}
