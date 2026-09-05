// ══════════════════════════════════════════════════════════════════════
// imports-are-committed.test.js — the site loads what the repo actually has
// ══════════════════════════════════════════════════════════════════════
//
// Reported from the published site:
//
//     GET .../js/tr/castle/alone.js   NS_ERROR_CORRUPTED_CONTENT
//     Loading module ... blocked because of a disallowed MIME type ("text/html")
//
// That MIME type is the tell: GitHub Pages answered a missing file with its
// 404 HTML page, and the browser refused to run HTML as a module. The file
// existed on the machine it was written on and had never been committed, while
// the `import` for it had — so every checkout but one, including the live site,
// failed to load the whole Traitors engine.
//
// It has happened twice in two days, both times the same way: a file was
// restored or edited from a working tree that carried somebody's in-progress
// work, and the import travelled without the module. Nothing on a developer's
// own machine can notice, because the file is right there.
//
// So the question is not "does this resolve on disk" — it always does. It is
// "does git know about it".
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every path git is tracking, as repo-relative posix strings. */
function trackedFiles() {
  return new Set(execSync('git ls-files', { cwd: ROOT, maxBuffer: 1e8 })
    .toString().split('\n').filter(Boolean));
}

function jsFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) jsFiles(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** Import specifiers, with comment lines dropped — a path quoted in a comment
 *  is documentation, and two index.js files legitimately name their own. */
function importsIn(src) {
  // LINE-WISE ONLY. Stripping `/* ... */` across the whole file looks tidier
  // and silently ate the very import this test exists for: one unbalanced
  // `/*` inside a string or a regex literal swallows everything to the next
  // `*/`, and the check then passed by finding nothing — the same
  // matcher-never-matches trap this repo keeps hitting. Dropping comment LINES
  // is enough; the only false positives were two index.js files quoting their
  // own path in a `//` line.
  const code = src.split('\n')
    .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  return [...code.matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)].map(m => m[1]);
}

describe('every module the app imports is in the repository', () => {
  it('has no import pointing at an untracked file', () => {
    const tracked = trackedFiles();
    const missing = [];
    for (const abs of jsFiles(path.join(ROOT, 'js'))) {
      const rel = path.relative(ROOT, abs).split(path.sep).join('/');
      for (const spec of importsIn(fs.readFileSync(abs, 'utf8'))) {
        const target = path.posix.normalize(
          path.posix.join(path.posix.dirname(rel), spec));
        if (tracked.has(target)) continue;
        // On disk but not in git is the reported bug. Not on disk at all is a
        // plain broken import, and both break the same way for a visitor.
        const onDisk = fs.existsSync(path.join(ROOT, target));
        missing.push(`${rel} imports ${spec} — ${onDisk
          ? 'the file exists but is NOT COMMITTED' : 'the file does not exist'}`);
      }
    }
    expect(missing, 'the published site will 404 on these and refuse the module')
      .toEqual([]);
  });

  it('is looking at a real tracked list', () => {
    // The check is worthless if `git ls-files` came back empty — it would pass
    // by finding nothing rather than by everything being present.
    const tracked = trackedFiles();
    expect(tracked.size).toBeGreaterThan(200);
    expect(tracked.has('js/tr/headless.js')).toBe(true);
  });
});
