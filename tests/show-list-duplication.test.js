// ══════════════════════════════════════════════════════════════════════
// show-list-duplication.test.js — js/shows.js is the only show list
// ══════════════════════════════════════════════════════════════════════
//
// THIS IS A RULE OVER THE TREE, NOT A LIST OF KNOWN OFFENDERS.
//
// Thirteen files each kept their own copy of the show list. Eight of them were
// pure identity — name, short code, icon, accent, prefix — and every one of
// them was a place a third show would have been drawn as Total Drama. None of
// them errored. That is the whole failure mode: an unregistered show does not
// crash a two-show map, it comes out of it wearing the default show's face.
//
// A guard shaped as a list of those eight would pass the moment a ninth
// appeared, and a ninth DID appear: js/quick-setup.js's show picker was never
// in the manual's table, so nobody looked at it, and it had already drifted —
// Big Brother's icon was 🏠 there and 📹 in the registry. Two faces, one show,
// nothing reporting it. Writing this guard turned up three more the same way
// (js/social-page.js and both tools/ scripts), none of which anybody had
// listed. So the rule is stated over every file in the tree and the known-good
// cases are named as EXEMPTIONS, which means a new file cannot become the tenth
// copy quietly — it has to be argued into the list below.
//
// Two shapes, because one grep is not enough (docs/ADDING-A-SHOW.md §13):
//
//   MAP     `{ 'total-drama': …, 'big-brother': … }` — an object keyed by slug.
//   TERNARY `format === 'big-brother' ? A : B`       — a two-show world with no
//           braces and no colon-after-slug, so the map grep never sees it. This
//           is how js/social/session.js generated an entire season's social
//           feed in Total Drama's words while passing every audit in the
//           manual.
//
// The TERNARY rule deliberately fires only on a NON-DEFAULT slug. A ternary on
// 'total-drama' is usually the bare-integer rule — "Total Drama is unprefixed,
// everything else takes its own prefix" — which is correct and scales to any
// number of shows. A ternary on 'big-brother' cannot: a third show falls out of
// the else branch as Total Drama.
//
// Neither rule is exhaustive. `!== 'big-brother'`, `?? 'total-drama'` and a
// switch on the slug are all show lists too. Treat this as the floor, and when
// you find a shape it misses, add the shape rather than the file.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUGS = Object.keys(SHOWS);

// Directories with nothing to enforce: vendored code, generated output, the
// manual (which QUOTES the offending shapes on purpose), and tests, whose
// fixtures are allowed — required, even — to name several shows at once.
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', '.superpowers', '.github',
  'tests', 'docs', 'coverage', 'test-results', 'playwright-report',
  'data', 'assets', 'dist',
]);

const SOURCE_OF_TRUTH = 'js/shows.js';

// ── The exemptions ────────────────────────────────────────────────────
//
// A per-show map is only a duplicate when it holds IDENTITY — what the show is
// called, what it looks like, how its seasons are keyed. A map holding per-show
// DATA is not a copy of anything; the registry does not know a venue list or a
// ranking weight and should not. Each of these was checked one at a time, and
// the reason is the point of the entry — an exemption with no reason is how a
// real duplicate gets waved through on the next pass.
const PER_SHOW_DATA = {
  'js/player-trivia.js':          'trivia questions per show — content, not identity',
  'js/quick-setup.js':            'CONFIG_SCOPE: which config fields each show has',
  'js/ranking-boards.js':         'format → board FILE; the storage layout is this file\'s job',
  'js/rankings-update.js':        'per-format ranking weights — a veto is not an immunity',
  'js/settings.js':               'venue list per show',
  'js/social/adapter.js':         'SHOW_WORDS: genuine per-show vocabulary',
  'worker/worker-season-live.js': 'SHOW_WORDS fallback, worker-side; same vocabulary',
};

// ── The ternary backlog ───────────────────────────────────────────────
//
// Nineteen two-show ternaries stand today. They are NOT exempt — they are
// deferred with the wiki-view screen work, and this is a ratchet: the recorded
// count is a ceiling, so a file may lose ternaries but never gain one, and a
// file not listed here may not grow its first. Lower a number when you fix one;
// the staleness check below fails if you fix one and leave the number up.
//
// docs/ADDING-A-SHOW.md §13 records thirteen, across seven files. It is a
// LINE-based grep and every one of the six extra ternaries below is written
// across two lines, so the manual has never seen them — including the two that
// mattered most for a third show: js/stats-export.js dispatched the whole
// season export on the Big Brother slug, and js/social/live.js picked which
// round array to read the same way, so a Traitors season was exported as a
// camp and had no audience reaction to anything. BOTH ARE FIXED (Plan 7 Task
// 3) — the export dispatches through a registered builder per show, and the
// round array is read from the registry's `roundsPath` — and their rows are
// gone from the backlog below, which is a ratchet: neither file may grow one
// back.
const TERNARY_BACKLOG = {
  'js/cast-ui.js':                3,
  'js/run-ui.js':                 2,
  'js/social/adapter.js':         4,
  'js/social/events.js':          1,
  'js/wiki-view.js':              5,
  'player.html':                  1,
  'worker/worker-season-live.js': 1,  // inside a comment describing the bug
};

// ── Regex construction ────────────────────────────────────────────────
//
// BUILT BY CONCATENATION, NEVER FROM A TEMPLATE LITERAL. `\b` inside a template
// literal is U+0008 — a backspace character — not a word boundary, and four
// guards in this repo have never once matched because of it. `sourceIsClean`
// below asserts the character codes rather than trusting how they look.

/** An object key: a quoted slug in key position, followed by a colon. */
function mapKeyRe(slug) {
  return new RegExp('(?:^|[{,(\\[])\\s*([\'"])' + slug + '\\1\\s*:', 'm');
}

/** A two-show ternary: `x === 'slug' ?` / `x !== 'slug' ?`. */
function ternaryRe(slug) {
  return new RegExp('[!=]==\\s*([\'"])' + slug + '\\1\\s*\\?', 'g');
}

function sourceIsClean(re) {
  return !re.source.split('').some(c => c.charCodeAt(0) < 0x20);
}

// ── The sweep ─────────────────────────────────────────────────────────

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|mjs|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = walk(ROOT).map(f => ({
  rel: path.relative(ROOT, f).split(path.sep).join('/'),
  text: fs.readFileSync(f, 'utf8'),
}));

/** Which slugs this file holds as object keys. */
function mapKeys(text) {
  return SLUGS.filter(slug => mapKeyRe(slug).test(text));
}

/** How many two-show ternaries this file holds. */
function ternaryCount(text) {
  let n = 0;
  for (const slug of SLUGS) {
    if (slug === DEFAULT_FORMAT) continue;
    n += (text.match(ternaryRe(slug)) || []).length;
  }
  return n;
}

describe('js/shows.js is the only show list', () => {
  it('scanned the tree, so a pass cannot be vacuous', () => {
    // A guard that silently walked nothing passes forever. The floor is well
    // below the real count (530 at the time of writing) and well above zero.
    expect(FILES.length).toBeGreaterThan(300);
    expect(FILES.some(f => f.rel === SOURCE_OF_TRUTH)).toBe(true);
    expect(SLUGS.length).toBeGreaterThanOrEqual(3);
  });

  it('builds its regexes without the U+0008 trap', () => {
    for (const slug of SLUGS) {
      expect(sourceIsClean(mapKeyRe(slug)), `map regex for ${slug}`).toBe(true);
      expect(sourceIsClean(ternaryRe(slug)), `ternary regex for ${slug}`).toBe(true);
    }
  });

  it('can see the show list it exists to protect', () => {
    // If the rule cannot detect the registry's own map, it detects nothing.
    const registry = FILES.find(f => f.rel === SOURCE_OF_TRUTH);
    expect(mapKeys(registry.text).length).toBe(SLUGS.length);
  });

  it('no file outside the registry enumerates the shows as a map', () => {
    const offenders = FILES
      .filter(f => f.rel !== SOURCE_OF_TRUTH)
      .filter(f => !(f.rel in PER_SHOW_DATA))
      .map(f => ({ rel: f.rel, slugs: mapKeys(f.text) }))
      .filter(f => f.slugs.length >= 2);

    expect(
      offenders.map(o => `${o.rel} — keys: ${o.slugs.join(', ')}`),
      'These files hold their own show list. Read the identity from js/shows.js '
      + '(SHOWS, showName, showShort, showIcon, showAccent, formatPrefix), or — '
      + 'if the map holds per-show DATA rather than identity — add it to '
      + 'PER_SHOW_DATA above WITH THE REASON.',
    ).toEqual([]);
  });

  it('every per-show-data exemption still holds a per-show map', () => {
    // A stale exemption is a hole. When one of these stops enumerating shows,
    // the entry must go, or it silently re-permits a future duplicate.
    const stale = Object.keys(PER_SHOW_DATA).filter(rel => {
      const f = FILES.find(x => x.rel === rel);
      return !f || mapKeys(f.text).length < 2;
    });
    expect(stale, 'Exemptions no longer needed — delete them from PER_SHOW_DATA')
      .toEqual([]);
  });

  it('no file grows a new two-show ternary', () => {
    const over = [];
    for (const f of FILES) {
      if (f.rel === SOURCE_OF_TRUTH) continue;
      const n = ternaryCount(f.text);
      const allowed = TERNARY_BACKLOG[f.rel] || 0;
      if (n > allowed) over.push(`${f.rel} — ${n} two-show ternaries, ${allowed} allowed`);
    }
    expect(
      over,
      "`format === 'big-brother' ? A : B` is a show list: a third show falls out "
      + 'of the else branch wearing Total Drama\'s words. Branch on the registry '
      + '(showWords(format), SHOWS[format]) instead.',
    ).toEqual([]);
  });

  it('the ternary backlog is not stale', () => {
    const shrunk = Object.entries(TERNARY_BACKLOG)
      .map(([rel, allowed]) => {
        const f = FILES.find(x => x.rel === rel);
        const n = f ? ternaryCount(f.text) : 0;
        return n < allowed ? `${rel} — ${allowed} recorded, ${n} left` : null;
      })
      .filter(Boolean);
    expect(shrunk, 'Fixed some — lower the number in TERNARY_BACKLOG (or delete the row)')
      .toEqual([]);
  });
});
