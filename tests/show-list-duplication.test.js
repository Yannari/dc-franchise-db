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
  'js/settings.js':               'per-show venue list: where a season of that show can be set',
  'js/social/adapter.js':         'SHOW_WORDS: genuine per-show vocabulary',
  'worker/worker-season-live.js': 'SHOW_WORDS fallback, worker-side; same vocabulary',
  'worker/worker-episode-live.js':'external wiki hosts per-show — endpoint data, not show identity',
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
//
// js/social/adapter.js is gone from the backlog too (Plan 7 Task 6). Its four
// were three event LABELS and the in-season POLL QUESTIONS, all decided by
// which of two shows was in hand — so a castle's timeline was headed
// "Challenge win" and "Elimination" and its audience was asked who makes the
// merge. Every one of them is a field on the show's own vocabulary entry now.
// Its replacement comments deliberately do not quote the shape they replaced:
// this counter matches source text, and a comment quoting the old ternary
// keeps the count where it was — which is how the first draft of the Task 3
// fix nearly let this ratchet pass untightened.
// ── AND IT COUNTS CODE, NOT SOURCE TEXT ──────────────────────────────
//
// The counter used to match the FILE, so a slot could be held open by a
// COMMENT: `worker/worker-season-live.js` carried a row of 1 for a ternary
// that lived only inside a note describing the bug, and the note explaining a
// fix could quote the shape it replaced and keep the count exactly where it
// was. A ratchet a comment can satisfy is not a ratchet. Comments are stripped
// before anything below counts, which is why that row is gone.
const TERNARY_BACKLOG = {
  'compare.html':                 1,
  'js/cast-ui.js':                3,
  'js/run-ui.js':                 2,
  'js/social/events.js':          1,
  'js/wiki-view.js':              4,
  'player.html':                  1,
};

// ── The comparison backlog ────────────────────────────────────────────
//
// A TERNARY IS ONE SHAPE OF ONE IDEA, and the rule above only ever saw that
// shape. `const isHouse = format === 'big-brother'` a hundred lines above its
// use, `if (format === 'big-brother') { ... } else { ... }`, and
// `format !== 'big-brother' ? ...` are the same show list written three other
// ways, and the ternary rule matched none of them. Measured over this tree:
// 12 ternaries against 71 comparisons, so five of every six were invisible.
//
// They are NOT all wrong. A house genuinely has weeks and a block, and a screen
// that draws a block has to know whether there is one — that is a question
// about the GAME, not about vocabulary. What is wrong is an else branch quietly
// meaning "the default show", and no regex can tell the two apart. So this is a
// ratchet and not a ban: the counts are what stood when it was written, a file
// may lose comparisons and never gain one, and a file not listed may not grow
// its first.
const COMPARISON_BACKLOG = {
  'compare.html':                 1,
  'js/bb-run.js':                 2,
  'js/bb/themes.js':              1,
  'js/cast-room.js':              1,
  'js/cast-ui.js':                3,
  // 2 -> 0, paid off by the fourth show. `formatIsRunnable` was a ladder of
  // `fmt === '<show>'` returns, one rung per show, so registering Drag Race
  // meant adding a fourth rung — a show list with return statements in it.
  // It reads `runnableFlag` off the registry now (`true` for always-runnable,
  // the window flag's name otherwise), so a fifth show adds a field and
  // touches no logic. Row kept at 0 rather than deleted: it records that this
  // file was cleaned and must not silently re-grow one.
  'js/core.js':                   0,
  'js/edit-layer.js':             1,
  'js/episode.js':                1,
  'js/finale.js':                 2,
  'js/intentions.js':             1,
  'js/player-trivia.js':          2,
  // 7 -> 8 for the main stage's blueprint chip. `blueprintFor` draws a
  // different DIAGRAM per show — tribes and a merge, a house and a jury, a
  // castle and its traitor ratio, a workroom and where the season stops — and
  // that is per-show layout rather than identity, which is why the file
  // already carried one branch each for the house and the castle. The drag
  // branch returns before the shared chips instead of adding a fourth arm to
  // the `house ? 'houseguest' : 'player'` ternary, so this commit adds one
  // comparison and no ternary.
  //
  // THE REAL FIX, when somebody has a reason to touch all four: let each
  // registry entry declare its own blueprint builder, which would take this
  // row to 0 rather than to 9 the next time a show is added.
  'js/quick-setup.js':            8,
  'js/rankings-update.js':        1,
  'js/romance.js':                3,
  // 9 -> 11 for the castle's run wiring (Plan 8, Task 7), and the two are two
  // DIFFERENT questions rather than one asked twice. `_isCastleRow(ep)` asks
  // what a stored episode IS, because the timeline, the episode card and the
  // transcript all draw a history that can outlive the config; `_castle` in
  // the Season Hub asks what the season being SET UP is. Three copies of the
  // first were collapsed into the helper before this number was raised, and
  // that collapse also removed a two-show ternary — the ratchet below is
  // unchanged. Neither is a vocabulary branch: a castle has no tribes and no
  // merge, which is a fact about the GAME, and the words on both surfaces come
  // from exitVerbs()/roundExits(). Raised deliberately, in the commit that
  // spends it.
  // 12 -> 16, and the four are NOT all one piece of work. Two of them arrived
  // with the Traitors run wiring and were never recorded here, so this row was
  // already failing at 14 before the fourth show existed — verified by
  // stashing. The other two are the main stage's, and they are the same two
  // questions the castle asks: `_isStageRow(ep)` asks what a STORED episode is,
  // because the episode card and the timeline draw a history that outlives the
  // config, and the Season Hub asks what the season being PLAYED is. Neither
  // is a vocabulary branch — the words on both come from the registry through
  // showWords() and roundExits().
  'js/run-ui.js':                 16,
  'js/social/archive.js':         3,
  'js/social/events.js':          2,
  'js/social/live.js':            1,
  'js/stats-export.js':           5,
  // 1 -> 2 for the castle's transcript (Plan 8, Task 6). This file already
  // hands a Big Brother row to its own writer in the same shape and for the
  // same reason: a show's TRANSCRIPT is not a field the registry can declare,
  // and a castle shares no structure with a camp -- no tribes, no challenge,
  // no Tribal Council -- so there is nothing to branch on inside one function.
  // Raised deliberately, in the commit that spends it.
  'js/text-backlog.js':           2,
  // The run loop's castle branch (Plan 8, Task 7). One comparison, and it is
  // the same shape js/bb-run.js's `isBigBrotherSeason` has for the same
  // reason: which ENGINE a season plays is not a field the registry can
  // declare, and this module exists precisely to be the one place that asks.
  // The run loop's main-stage branch. One comparison, the same shape and the
  // same reason as js/tr-run.js and js/bb-run.js directly above and below:
  // which ENGINE a season plays is not a field the registry can declare, and
  // this module exists precisely to be the one place that asks.
  'js/dr-run.js':                 1,
  'js/tr-run.js':                 1,
  'js/tr/endgame.js':             1,
  // 6 -> 7 for the castle's screen dispatch (Plan 8, Task 1). `buildVPScreens`
  // already branches on `format === 'big-brother'` for the same reason and in
  // the same shape: a show's SCREENS are not a field the registry can declare,
  // and the alternative — a builder reference in js/shows.js — would put UI
  // into the identity table this file exists to keep clean. Raised
  // deliberately, in the commit that spends it, which is what a ratchet is for.
  'js/vp-screens.js':             7,
  'js/vp-ui.js':                  1,
  'js/wiki-fill-run.js':          1,
  'js/wiki-view.js':              7,
  'player.html':                  4,
  'rankings.html':                1,
  'tools/backfill_formats.mjs':   2,
  'worker/worker-season-live.js': 1,
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

/** ANY comparison against the slug — the hoisted boolean and the if/else too. */
function comparisonRe(slug) {
  return new RegExp('[!=]==\\s*([\'"])' + slug + '\\1', 'g');
}

/** A format guessed from a season id's PREFIX: `id.startsWith('bb-')`. */
function prefixGuessRe(prefix) {
  return new RegExp('startsWith\\(\\s*([\'"])' + prefix + '-', 'g');
}

function sourceIsClean(re) {
  return !re.source.split('').some(c => c.charCodeAt(0) < 0x20);
}

/**
 * The file with its comments taken out.
 *
 * EVERY COUNT BELOW READS THIS. A source-text ratchet can be satisfied by a
 * comment, and this one was: `worker/worker-season-live.js` held a backlog row
 * of 1 for a ternary that existed only inside a note describing the bug, and
 * the first draft of the Task 3 fix nearly kept its own count open by quoting
 * the shape it had just replaced.
 */
function codeOf(text) {
  return String(text)
    // CRLF FIRST. `.` does not match a carriage return, so on a CRLF file the
    // line-comment strip below matched nothing at all and every comment in the
    // tree was still being counted — the exact defect this function exists to
    // remove, reintroduced by the newline convention.
    .replace(/\r\n?/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map(l => l.replace(/(^|\s)\/\/.*$/, '')).join('\n');
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

const FILES = walk(ROOT).map(f => {
  const text = fs.readFileSync(f, 'utf8');
  return {
    rel: path.relative(ROOT, f).split(path.sep).join('/'),
    text,
    code: codeOf(text),
  };
});

/** Which slugs this file holds as object keys. */
function mapKeys(text) {
  return SLUGS.filter(slug => mapKeyRe(slug).test(text));
}

/** How many two-show ternaries this file holds. */
function ternaryCount(code) {
  let n = 0;
  for (const slug of SLUGS) {
    if (slug === DEFAULT_FORMAT) continue;
    n += (code.match(ternaryRe(slug)) || []).length;
  }
  return n;
}

/** How many comparisons against a non-default slug, in ANY shape. */
function comparisonCount(code) {
  let n = 0;
  for (const slug of SLUGS) {
    if (slug === DEFAULT_FORMAT) continue;
    n += (code.match(comparisonRe(slug)) || []).length;
  }
  return n;
}

/** How many formats this file guesses from a season id's prefix. */
function prefixGuessCount(code) {
  let n = 0;
  for (const slug of SLUGS) {
    if (slug === DEFAULT_FORMAT) continue;
    n += (code.match(prefixGuessRe(SHOWS[slug].prefix)) || []).length;
  }
  return n;
}

describe('js/shows.js is the only show list', () => {
  it('scanned the tree, so a pass cannot be vacuous', () => {
    /* ── A FLOOR BELOW THE REAL POPULATION HIDES EVERYTHING ABOVE IT ────
       This read `> 300` against a real 532. Capping the walk at two levels
       deep left exactly 300-odd files and a PLANTED three-show map in
       `js/tr/` — and the floor passed, because 300 is a number this walk can
       reach while missing 232 files. A coverage floor is only a floor if it
       is set at the population, not at a comfortable fraction of it.
       Measured: 532. If a real refactor moves it, move this with it — that is
       a deliberate act and it should look like one. */
    expect(FILES.length,
      'the walk is finding far fewer files than this tree holds; it is capped, '
      + 'skipping a directory, or filtering an extension it should not')
      .toBeGreaterThan(500);
    expect(FILES.some(f => f.rel === SOURCE_OF_TRUTH)).toBe(true);
    expect(SLUGS.length).toBeGreaterThanOrEqual(3);
    // AND IT REACHES THE DEEP DIRECTORIES. A file count can be met by a wide
    // shallow tree; the show engines live three and four levels down, which
    // is exactly where a depth cap stops looking.
    const deepest = Math.max(...FILES.map(f => f.rel.split('/').length));
    expect(deepest, 'the walk never descends past the top two levels')
      .toBeGreaterThanOrEqual(4);
    expect(FILES.some(f => f.rel.startsWith('js/tr/')),
      'nothing under js/tr/ was scanned at all').toBe(true);
    expect(FILES.some(f => f.rel.startsWith('js/bb/')),
      'nothing under js/bb/ was scanned at all').toBe(true);
  });

  /* ── AND NOTHING IN THE TREE CONTAINS ONE, TEST FILES INCLUDED ────────
     `\\b` inside a template literal is U+0008, a real backspace character, and
     it looks perfectly correct in an editor. Four guards in this repo and one
     production `.replace()` had never once matched because of it. The arm
     below checks the regexes THIS file builds; this one checks the whole
     tree, and it includes tests/ because that is where fourteen of them were
     hiding — including an eaten `\\1` backreference, which reaches RegExp as
     U+0001 and makes a duplicate-name check unfalsifiable.
     A source file has no business containing either character. */
  it('no source file in the tree holds a control character', () => {
    const all = [];
    const sweep = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.git', 'coverage', 'dist', 'assets',
          'test-results', 'playwright-report'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) sweep(full);
        else if (/\.(js|mjs|html)$/.test(entry.name)) all.push(full);
      }
    };
    sweep(ROOT);
    expect(all.length, 'the control-character sweep walked nothing')
      .toBeGreaterThan(600);
    const dirty = [];
    for (const f of all) {
      const text = fs.readFileSync(f, 'utf8');
      for (const [i, line] of text.split(/\r?\n/).entries()) {
        const bad = [...line].filter(c => {
          const n = c.charCodeAt(0);
          // Tab is formatting. U+0000 is allowed because there is exactly one
          // way to write it and it is a deliberate key separator in
          // js/tr/roundtable.js — a character that cannot appear in a name.
          // Everything else in this range arrived by accident.
          return n < 0x20 && n !== 9 && n !== 0;
        });
        if (bad.length) {
          dirty.push(`${path.relative(ROOT, f).split(path.sep).join('/')}:${i + 1}`
            + ` — U+${bad[0].charCodeAt(0).toString(16).padStart(4, '0')}`);
        }
      }
    }
    expect(dirty,
      'A literal control character in source. This is almost always an escape '
      + 'eaten by a template literal: a word boundary became U+0008 and the '
      + 'pattern now matches nothing, or a backreference became U+0001 and is '
      + 'gone. Build patterns by concatenation, never from a template literal.')
      .toEqual([]);
  });

  it('builds its regexes without the U+0008 trap', () => {
    for (const slug of SLUGS) {
      expect(sourceIsClean(mapKeyRe(slug)), `map regex for ${slug}`).toBe(true);
      expect(sourceIsClean(ternaryRe(slug)), `ternary regex for ${slug}`).toBe(true);
      expect(sourceIsClean(comparisonRe(slug)), `comparison regex for ${slug}`).toBe(true);
      expect(sourceIsClean(prefixGuessRe(SHOWS[slug].prefix)),
        `prefix regex for ${slug}`).toBe(true);
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
      .map(f => ({ rel: f.rel, slugs: mapKeys(f.code) }))
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
      return !f || mapKeys(f.code).length < 2;
    });
    expect(stale, 'Exemptions no longer needed — delete them from PER_SHOW_DATA')
      .toEqual([]);
  });

  /* ── AND THE EXEMPTION LIST MAY NOT GROW ─────────────────────────────
     The staleness check above only ever made the list SHRINK. Nothing stopped
     it growing, and the reason string was never read — so a planted identity
     map plus a row saying "looks fine to me" passed, which turns the whole
     rule into a list of files somebody once agreed to. A ceiling makes adding
     one a deliberate act with a number to change, and the reason has to be a
     reason. */
  it('cannot be widened without saying so', () => {
    const rels = Object.keys(PER_SHOW_DATA);
    expect(rels.length,
      'PER_SHOW_DATA has grown. Every entry is a file allowed to hold its own '
      + 'show list, so adding one narrows this rule: raise this ceiling in the '
      + 'same commit, with the reason, or read the identity from js/shows.js.')
      .toBeLessThanOrEqual(8);
    for (const rel of rels) {
      const why = String(PER_SHOW_DATA[rel] || '');
      expect(why.length, `${rel}'s exemption has no reason worth reading`)
        .toBeGreaterThan(24);
      // A reason has to say what the map HOLDS. "looks fine" does not.
      expect(why, `${rel}'s exemption does not say what its map holds`)
        .toMatch(/per-show|per-format|vocabulary|weights|list|layout|fields|content/i);
    }
    // ...and no two files share a reason, which is what copy-paste produces.
    const reasons = rels.map(r => PER_SHOW_DATA[r]);
    expect(new Set(reasons).size, 'two exemptions carry the identical reason')
      .toBe(reasons.length);
  });

  /* ── THE SAME IDEA IN EVERY OTHER SHAPE ──────────────────────────────
     Five of every six show comparisons in this tree are not ternaries. See
     COMPARISON_BACKLOG above for why this ratchets rather than bans. */
  it('no file grows a new comparison against a show slug', () => {
    const over = [];
    for (const f of FILES) {
      if (f.rel === SOURCE_OF_TRUTH) continue;
      const n = comparisonCount(f.code);
      const allowed = COMPARISON_BACKLOG[f.rel] || 0;
      if (n > allowed) over.push(`${f.rel} — ${n} show comparisons, ${allowed} allowed`);
    }
    expect(over,
      "`format === 'big-brother'` in any shape — a hoisted boolean, an if/else, "
      + 'a negation — is a two-show world. Ask the registry what this show '
      + 'declares (showWords, SHOWS[format].<field>) rather than which show it is.')
      .toEqual([]);
  });

  it('the comparison backlog is not stale', () => {
    const shrunk = Object.entries(COMPARISON_BACKLOG)
      .map(([rel, allowed]) => {
        const f = FILES.find(x => x.rel === rel);
        const n = f ? comparisonCount(f.code) : 0;
        return n < allowed ? `${rel} — ${allowed} recorded, ${n} left` : null;
      })
      .filter(Boolean);
    expect(shrunk, 'Fixed some — lower the number in COMPARISON_BACKLOG (or delete the row)')
      .toEqual([]);
  });

  /* ── AND NOBODY GUESSES A FORMAT FROM A PREFIX ───────────────────────
     `seasonId.startsWith('bb-')` is a show list one character wide: every
     other show falls past it into the default, so `tr-1` was ranked as a Total
     Drama season and backfilled as one. `parseSeasonRef` resolves any
     registered prefix and returns null rather than guessing, so unlike the two
     ratchets above this one is a BAN — there were three instances, all three
     are fixed, and none of them had a defence. */
  it('nobody reads a show out of a season id by hand', () => {
    const offenders = FILES
      .filter(f => f.rel !== SOURCE_OF_TRUTH)
      .map(f => ({ rel: f.rel, n: prefixGuessCount(f.code) }))
      .filter(f => f.n > 0);
    expect(offenders.map(o => `${o.rel} — ${o.n}`),
      "startsWith('bb-') is a show list. Use parseSeasonRef(id)?.format, which "
      + 'knows every registered prefix and returns null rather than guessing.')
      .toEqual([]);
  });

  it('no file grows a new two-show ternary', () => {
    const over = [];
    for (const f of FILES) {
      if (f.rel === SOURCE_OF_TRUTH) continue;
      const n = ternaryCount(f.code);
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
        const n = f ? ternaryCount(f.code) : 0;
        return n < allowed ? `${rel} — ${allowed} recorded, ${n} left` : null;
      })
      .filter(Boolean);
    expect(shrunk, 'Fixed some — lower the number in TERNARY_BACKLOG (or delete the row)')
      .toEqual([]);
  });
});
