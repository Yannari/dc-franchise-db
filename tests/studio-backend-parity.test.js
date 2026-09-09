// ══════════════════════════════════════════════════════════════════════
// studio-backend-parity.test.js — the two servers must agree
// ══════════════════════════════════════════════════════════════════════
//
// THE STUDIO HAS TWO BACKENDS AND THEY ARE DIFFERENT PROGRAMS. `serve.py` is a
// Python process on a laptop writing straight into the working tree; the
// worker is Cloudflare's, serving a static site and writing through the GitHub
// Contents API. Same endpoints, same payloads, two implementations.
//
// The failure is quiet and it has happened twice. A client posts a field or an
// endpoint that only one runtime implements; the other ignores it and still
// answers `ok: true`; the UI reports success and the author finds out weeks
// later that nothing was saved. That is how the portrait catalog went months
// working on localhost and silently discarded on the live site, and how
// `/api/season-ratings` came to exist on one server only.
//
// So this asserts the SHAPE both must share, not the implementations:
//   - every POST endpoint one accepts, the other accepts
//   - every roster field one persists, the other persists
//
// See docs/ADDING-A-SHOW.md §8.1. The real fix is one implementation rather
// than two — retire serve.py's write endpoints and point localhost at the
// worker — and until somebody does that, this is the guard that says they have
// drifted.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Anchored to this file, not the process CWD: run from a git worktree, a bare
// relative path opens the MAIN checkout and reports on code the branch has
// already changed.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(ROOT, rel), 'utf8');

const serve = read('serve.py');
const worker = read('worker/worker-studio.js');

/** The POST paths serve.py routes, from its do_POST allowlist. */
function servePostPaths() {
  const m = serve.match(/def do_POST[\s\S]*?if self\.path not in \(([^)]*)\)/);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]).sort();
}

/** The POST paths the worker routes. */
function workerPostPaths() {
  return [...new Set([...worker.matchAll(/url\.pathname === '(\/api\/[a-z/-]+)'/g)]
    .map(x => x[1]))].sort();
}

describe('the two Studio backends', () => {
  it('serve.py declares its write endpoints where this can read them', () => {
    expect(servePostPaths().length, 'the do_POST allowlist moved or was rewritten')
      .toBeGreaterThan(0);
  });

  it('every endpoint serve.py accepts, the worker accepts too', () => {
    const only = servePostPaths().filter(p => !workerPostPaths().includes(p));
    expect(only, 'these write endpoints exist on localhost only — authoring '
      + 'through them on the live site posts, succeeds, and saves nothing')
      .toEqual([]);
  });

  it('every roster field one persists, the other persists', () => {
    const grab = (src, re) => {
      const m = src.match(re);
      return m ? [...m[1].matchAll(/'([a-zA-Z]+)'/g)].map(x => x[1]).sort() : null;
    };
    const py = grab(serve, /ROSTER_FIELDS\s*=\s*\(([^)]*)\)/);
    const js = grab(worker, /const ROSTER_FIELDS\s*=\s*\[([^\]]*)\]/);
    expect(py, 'serve.py ROSTER_FIELDS moved').toBeTruthy();
    expect(js, 'worker ROSTER_FIELDS moved').toBeTruthy();
    // The worker owns fields serve.py has no use for; what must never happen is
    // serve.py persisting something the worker drops, because the live site is
    // where most authoring happens.
    const droppedByWorker = py.filter(k => !js.includes(k));
    expect(droppedByWorker, 'serve.py saves these and the worker does not').toEqual([]);
  });
});
