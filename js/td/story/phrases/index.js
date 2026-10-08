// ══════════════════════════════════════════════════════════════════════
// td/story/phrases/index.js — the phrasebook, by move
// ══════════════════════════════════════════════════════════════════════
//
// move -> { any: [...], <voice tag>: [...], <age band>: [...], '<tag>+<age>': [...] }.
// td/story/phrase.js reads it; tests/td-phrase.test.js checks it.
import core1 from './core1.js';
import core2 from './core2.js';
import core3 from './core3.js';
import core4 from './core4.js';

const FILES = [core1, core2, core3, core4];

export const PHRASES = {};
for (const f of FILES) for (const [move, book] of Object.entries(f)) {
  const into = (PHRASES[move] ||= {});
  for (const [k, list] of Object.entries(book)) into[k] = [...(into[k] || []), ...list];
}
