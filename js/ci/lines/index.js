// Every pool, merged into one map keyed by pool key. Data only.
import { CHAT_A } from './chat-a.js';
import { CHAT_B } from './chat-b.js';
import { SLIPS } from './slips.js';
import { FEED } from './feed.js';
import { CIRCLE } from './circle.js';
import { PROFILES } from './profiles.js';
import { RATINGS } from './ratings.js';
import { HANGOUT } from './hangout.js';
import { BLOCKING } from './blocking.js';
import { VISIT } from './visit.js';
import { GOODBYE } from './goodbye.js';
import { FINALE } from './finale.js';

export const POOLS = {};
for (const part of [CHAT_A, CHAT_B, SLIPS, FEED, CIRCLE, PROFILES, RATINGS, HANGOUT, BLOCKING, VISIT, GOODBYE, FINALE]) {
  for (const [k, v] of Object.entries(part)) POOLS[k] = [...(POOLS[k] || []), ...v];
}
