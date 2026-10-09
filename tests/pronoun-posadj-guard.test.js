// pronouns(name).pos is the STANDALONE possessive ("hers", "theirs"); before a noun it is posAdj ("her
// game"). Read in played TD finales, 2026-10-09: "That's how good theirs game was", "She built hers game".
// 242 lines across 32 files had it. A word straight after ${x.pos} is a noun, except the few that follow
// a standalone possessive ("...and so is theirs too").
import { it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ALLOWED_AFTER = new Set(['too', 'wrong', 'either', 'is', 'was', 'instead']);
function* jsFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* jsFiles(p); else if (e.name.endsWith('.js')) yield p;
  }
}

it('no standalone possessive before a noun', () => {
  const bad = [];
  for (const f of jsFiles('js')) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\.pos\} ([a-zA-Z']+)/g)) if (!ALLOWED_AFTER.has(m[1])) bad.push(`${f}: ...pos} ${m[1]}`);
  }
  expect(bad).toEqual([]);
});
