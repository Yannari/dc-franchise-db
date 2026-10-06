// Every house-scene pool for the storyline layer (js/bb/story/write.js), by key
// 'story.<type>.<step>.<outcome>' and 'recap.<type>.<step>[.<outcome>].<a|b|caption>'.
// Written against docs/bb-dialogue-style.md; tests/bb-story.test.js holds them to it.
import FEUD from './feud.js';
import ALLIANCE from './alliance.js';
import SHOWMANCE from './showmance.js';
import TARGET from './target.js';
import SCHEME from './scheme.js';
import LIFE from './life.js';
import MORE_ALLIANCE from './more-alliance.js';
import MORE_HOUSE from './more-house.js';
import MORE_COUPLE from './more-couple.js';
import SET from './set.js';
import GROUPS from './groups.js';
import MORE_GROUPS from './more-groups.js';
import MORE_SETS from './more-sets.js';
import MORE_GROUPS2 from './more-groups2.js';
import GROUPS3 from './groups3.js';
import FIRSTNIGHT from './firstnight.js';
import MORE_SETS2 from './more-sets2.js';
import GAMETALK from './gametalk.js';
import GAMETALK2 from './gametalk2.js';
import GAMETALK3 from './gametalk3.js';

// Ids are prefixed 'st:' so a story entry can never share an id (and so a usage ledger
// entry) with an old house-event line.
const RAW = {};
// the 'more-*' files widen pools that already exist: their entries are added, never replace
for (const part of [FEUD, ALLIANCE, SHOWMANCE, TARGET, SCHEME, LIFE, MORE_ALLIANCE, MORE_HOUSE, MORE_COUPLE, SET, GROUPS, MORE_GROUPS, MORE_SETS, MORE_GROUPS2, GROUPS3, FIRSTNIGHT, MORE_SETS2, GAMETALK, GAMETALK2, GAMETALK3]) {
  for (const [k, pool] of Object.entries(part)) RAW[k] = [...(RAW[k] || []), ...pool];
}
export const STORY_POOLS = Object.fromEntries(Object.entries(RAW).map(([k, pool]) => [k, pool.map(e => ({ ...e, id: `st:${e.id}` }))]));
