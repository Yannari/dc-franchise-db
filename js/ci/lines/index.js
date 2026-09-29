// Every pool, merged into one map keyed by pool key. Data only.
import { CHAT_A } from './chat-a.js';
import { CHAT_B } from './chat-b.js';
import { SLIPS } from './slips.js';
import { FEED } from './feed.js';
import { CIRCLE } from './circle.js';
import { PROFILES } from './profiles.js';

export const POOLS = {};
for (const part of [CHAT_A, CHAT_B, SLIPS, FEED, CIRCLE, PROFILES]) {
  for (const [k, v] of Object.entries(part)) POOLS[k] = [...(POOLS[k] || []), ...v];
}
