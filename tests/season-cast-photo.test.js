// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// season-cast-photo.test.js — the group shot, and the field that names it
// ══════════════════════════════════════════════════════════════════════
//
// `castPhotoPath` has been on every row of seasons_database.json since the
// field was added, and NOTHING HAS EVER READ IT. Both renderers rebuilt the
// filename from format and number instead — which hard-codes the extension, so
// a .webp cast photo was invisible to a page holding a field that named it
// exactly, and a photo under any other name could not be pointed at at all.
//
// These hold the field to being the answer.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildWikiTab } from '../js/season-wiki-tab.js';

// Anchored to this file, not the process CWD: run from a git worktree, a bare
// relative path opens the MAIN checkout.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(ROOT, rel), 'utf8');
const db = JSON.parse(read('seasons_database.json'));

const doc = {
  seasonNumber: 1, format: 'drag-race', seasonId: 'dr-1', castSize: 2, episodeCount: 1,
  placements: [{ name: 'A', placement: 1 }, { name: 'B', placement: 2 }],
  dr: { episodes: [] },
};

describe('the cast photo', () => {
  it('draws the one the season row names', () => {
    const html = buildWikiTab(doc, { seasonRow: { castPhotoPath: 'assets/cast/dr-1-cast.webp' } });
    expect(html).toContain('wk-castphoto');
    expect(html).toContain('assets/cast/dr-1-cast.webp');
  });

  it('draws no frame at all for a season with no photo', () => {
    // A broken image is worse than no image: it says the page is missing
    // something rather than that this season has no group shot yet.
    expect(buildWikiTab(doc, { seasonRow: {} })).not.toContain('wk-castphoto');
    expect(buildWikiTab(doc, {})).not.toContain('wk-castphoto');
  });

  it('is read from the row, not rebuilt from the season number', () => {
    /* The bug this file exists for. A path that does not follow
       `<id>-cast.png` must still be the one drawn — otherwise the field is
       decoration and the extension is hard-coded forever. */
    const html = buildWikiTab(doc, { seasonRow: { castPhotoPath: 'assets/cast/whatever-i-called-it.webp' } });
    expect(html).toContain('assets/cast/whatever-i-called-it.webp');
    expect(html).not.toContain('dr-1-cast.png');
  });

  it('both renderers consult the field', () => {
    // Source-level, like tests/studio-backend-parity.test.js: these are two
    // inline scripts in two HTML pages with no import surface to call.
    expect(read('seasons.html'), 'seasons.html rebuilds the filename')
      .toMatch(/castPhotoPath/);
    expect(read('season_ref.html'), 'the season page rebuilds the filename')
      .toMatch(/castPhotoPath/);
  });

  it('every path in the database has a legal shape', () => {
    /* Not "exists": most rows point at a photo nobody has made yet, and both
       call sites fall back quietly. What must hold is that the value is a
       path under assets/cast with an image extension — anything else is a
       typo that will fail silently forever. */
    for (const row of db.seasons || []) {
      if (!row.castPhotoPath) continue;
      expect(row.castPhotoPath, `${row.seasonId || row.seasonNumber}`)
        .toMatch(/^assets\/cast\/[a-z0-9][a-z0-9-]*\.(png|webp|jpe?g)$/);
    }
  });

  it('the photo this season claims to have is actually there', () => {
    const row = (db.seasons || []).find(r => r.seasonId === 'dr-1');
    expect(row, 'dr-1 is not in the seasons database').toBeTruthy();
    expect(existsSync(join(ROOT, row.castPhotoPath)),
      `${row.castPhotoPath} is named by the row and missing from the repo`).toBe(true);
  });

  it('both backends accept an upload', () => {
    /* The same failure studio-backend-parity.test.js was written for: an
       endpoint on one runtime only posts, succeeds, and saves nothing. */
    expect(read('worker/worker-studio.js')).toContain("'/api/season-cast-photo'");
    expect(read('serve.py')).toContain("'/api/season-cast-photo'");
  });
});
