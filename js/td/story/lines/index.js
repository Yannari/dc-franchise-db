// ══════════════════════════════════════════════════════════════════════
// td/story/lines/index.js — every Total Drama story pool, by key
// ══════════════════════════════════════════════════════════════════════
//
// Keys are '<pool>.<outcome>' (write.js falls back to '<pool>.any'). Entry ids
// are unique across files (tests/td-story.test.js). Written against
// docs/td-dialogue-style.md.
import firstday from './firstday.js';
import nMorning from './n-morning.js';
import nChal from './n-chal.js';
import nTribal from './n-tribal.js';
import nAlliance from './n-alliance.js';
import nVote from './n-vote.js';
import nVote2 from './n-vote2.js';
import nVote3 from './n-vote3.js';
import nDrama from './n-drama.js';
import nRomance from './n-romance.js';
import nTalk from './n-talk.js';
import nCamp from './n-camp.js';
import nGroup from './n-group.js';
import nGroup2 from './n-group2.js';
import nArrival from './n-arrival.js';

const FILES = [firstday, nMorning, nChal, nTribal, nAlliance, nVote, nVote2, nVote3, nDrama, nRomance, nTalk, nCamp, nGroup, nGroup2, nArrival];

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
    // ...and a second: a scene a person plays alone (a confessional, a solo decision) never
    // pulls in a b who is not there
    const usesB = (e.turns || []).some(t => t.by === 'b' || /\{b(\.\w+)?\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ')));
    if (usesB && e.when?.pair === undefined) e.when = { ...(e.when || {}), pair: true };
  }
}
