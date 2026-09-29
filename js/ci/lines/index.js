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
import { HOST } from './host.js';
import { GAME_LINES } from './games.js';
import { LIFE_LINES } from './life.js';
import { SHARED_LINES } from './shared.js';

export const POOLS = {};
for (const part of [CHAT_A, CHAT_B, SLIPS, FEED, CIRCLE, PROFILES, RATINGS, HANGOUT, BLOCKING, VISIT, GOODBYE, FINALE, HOST, GAME_LINES, LIFE_LINES, SHARED_LINES]) {
  for (const [k, v] of Object.entries(part)) POOLS[k] = [...(POOLS[k] || []), ...v];
}
