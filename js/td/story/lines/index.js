// ══════════════════════════════════════════════════════════════════════
// td/story/lines/index.js — every Total Drama story pool, by key
// ══════════════════════════════════════════════════════════════════════
//
// Keys are '<pool>.<outcome>' (write.js falls back to '<pool>.any'). Entry ids
// are unique across files (tests/td-story.test.js). Written against
// docs/td-dialogue-style.md.
import morning from './morning.js';
import chal from './chal.js';
import cover from './cover.js';
import alliance from './alliance.js';
import alliance2 from './alliance2.js';
import morning2 from './morning2.js';
import chal2 from './chal2.js';
import deals from './deals.js';
import rivalry from './rivalry.js';
import showmance from './showmance.js';
import strategy from './strategy.js';
import more from './more.js';
import booth from './booth.js';
import tribal from './tribal.js';
import crowd from './crowd.js';
import life from './life.js';
import tribal2 from './tribal2.js';

const FILES = [morning, chal, cover, alliance, alliance2, morning2, chal2, deals, rivalry, showmance, strategy, more, booth, tribal, crowd, life, tribal2];

export const STORY_POOLS = {};
for (const f of FILES) for (const [k, v] of Object.entries(f)) STORY_POOLS[k] = STORY_POOLS[k] ? [...STORY_POOLS[k], ...v] : [...v];

// A scene that has a third person in it only plays when there is one: c's lines would be
// dropped and the rest would answer nobody ("Thanks, {c}."). An entry that reads fine without
// c says so with `cOptional: true`.
for (const pool of Object.values(STORY_POOLS)) {
  for (const e of pool) {
    const usesC = (e.turns || []).some(t => t.by === 'c' || /\{c(\.\w+)?\}/.test(t.say || t.conf || t.beat || ''));
    if (usesC && !e.cOptional && e.when?.third === undefined) e.when = { ...(e.when || {}), third: true };
  }
}
