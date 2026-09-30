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
import { G_STATEMENT_NAME } from './g-statement-name.js';
import { G_ASK_GUESS } from './g-ask-guess.js';
import { G_MAKE } from './g-make.js';
import { G_REST } from './g-rest.js';
import { G_MORE } from './g-more.js';
import { G_CALLBACKS } from './g-callbacks.js';
import { SCENES_MORE } from './scenes-more.js';
import { SCENES_WEAR } from './scenes-wear.js';
import { REGISTER_LINES } from './registers.js';
import { VOICE_NOTICED } from './voice-noticed.js';
import { FORMAT_LINES, FORMAT_LINES_2, FORMAT_LINES_3 } from './formats.js';

export const POOLS = {};
for (const part of [CHAT_A, CHAT_B, SLIPS, FEED, CIRCLE, PROFILES, RATINGS, HANGOUT, BLOCKING, VISIT, GOODBYE, FINALE, HOST, GAME_LINES, LIFE_LINES, SHARED_LINES, G_STATEMENT_NAME, G_ASK_GUESS, G_MAKE, G_REST, G_MORE, G_CALLBACKS, SCENES_MORE, SCENES_WEAR, REGISTER_LINES, VOICE_NOTICED, FORMAT_LINES, FORMAT_LINES_2, FORMAT_LINES_3]) {
  for (const [k, v] of Object.entries(part)) POOLS[k] = [...(POOLS[k] || []), ...v];
}
