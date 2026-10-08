// ══════════════════════════════════════════════════════════════════════
// td/story/lines/index.js — every Total Drama story pool, by key
// ══════════════════════════════════════════════════════════════════════
//
// Keys are '<pool>.<outcome>' (write.js falls back to '<pool>.any'). Entry ids
// are unique across files (tests/td-story.test.js). Written against
// docs/td-dialogue-style.md.
import cover from './cover.js';
import rivalry from './rivalry.js';
import showmance from './showmance.js';
import strategy from './strategy.js';
import more from './more.js';
import crowd from './crowd.js';
import life from './life.js';
import firstday from './firstday.js';
import nMorning from './n-morning.js';
import nChal from './n-chal.js';
import nTribal from './n-tribal.js';
import nAlliance from './n-alliance.js';
import nVote from './n-vote.js';
import nVote2 from './n-vote2.js';
import rewrite1 from './rewrite1.js';
import rewrite2 from './rewrite2.js';

const FILES = [cover, rivalry, showmance, strategy, more, crowd, life, rewrite1, rewrite2, firstday, nMorning, nChal, nTribal, nAlliance, nVote, nVote2];

export const STORY_POOLS = {};
for (const f of FILES) for (const [k, v] of Object.entries(f)) STORY_POOLS[k] = STORY_POOLS[k] ? [...STORY_POOLS[k], ...v] : [...v];

// A scene that has a third person in it only plays when there is one: c's lines would be
// dropped and the rest would answer nobody ("Thanks, {c}."). An entry that reads fine without
// c says so with `cOptional: true`.
for (const pool of Object.values(STORY_POOLS)) {
  for (const e of pool) {
    const usesC = (e.turns || []).some(t => t.by === 'c' || /\{c(\.\w+)?\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ')));
    if (usesC && !e.cOptional && e.when?.third === undefined) e.when = { ...(e.when || {}), third: true };
    // ...and a fourth person the same way
    const usesD = (e.turns || []).some(t => t.by === 'd' || /\{d(\.\w+)?\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ')));
    if (usesD && e.when?.fourth === undefined) e.when = { ...(e.when || {}), fourth: true };
  }
}
