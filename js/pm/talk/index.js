// pm/talk/ — the villa's conversations, built from movements.
//
// One file per talking kind: { plans: { featured, short }, moves: { slot: [entries] },
// notes: [entries] }. Put together by pm/script.js talkScript; how islanders talk is
// docs/pm-dialogue-style.md; which scenes are long, short or a note, and what each
// follows from, is pm/story/director.js.
import { PULL } from './pull.js';
import { LOYALTY } from './loyalty.js';
import { CHAT } from './chat.js';
import { KISS } from './kiss.js';
import { DEEP_CHAT } from './deep-chat.js';
import { FRIENDSHIP } from './friendship.js';
import { GOSSIP } from './gossip.js';
import { ARGUMENT } from './argument.js';
import { COMEDY } from './comedy.js';
import { ICK } from './ick.js';
import { ADVICE } from './advice.js';
import { VENT } from './vent.js';
import { COMFORT } from './comfort.js';
import { CASA_MISS, BED_SHARE } from './casa.js';
import { CHALLENGE_KISS, CHALLENGE_WIN } from './challenge.js';
import { DEBRIEF } from './debrief.js';
import { KIN_HEART, KIN_VET, KIN_PROTECT, EX_AWKWARD, EX_JEALOUS } from './kin.js';
import { REASSURANCE, JEALOUS_CONFRONT, JEALOUS_RETALIATE, CONFESSION, NO_SHOW } from './jealousy.js';

export const TALK = { pull: PULL, loyalty: LOYALTY, chat: CHAT, kiss: KISS, 'deep-chat': DEEP_CHAT, friendship: FRIENDSHIP, gossip: GOSSIP, argument: ARGUMENT,
  comedy: COMEDY, ick: ICK, advice: ADVICE, vent: VENT, comfort: COMFORT, 'casa-miss': CASA_MISS, 'bed-share': BED_SHARE,
  'challenge-kiss': CHALLENGE_KISS, 'challenge-win': CHALLENGE_WIN,
  reassurance: REASSURANCE, 'jealous-confront': JEALOUS_CONFRONT, 'jealous-retaliate': JEALOUS_RETALIATE, confession: CONFESSION, 'no-show': NO_SHOW, debrief: DEBRIEF,
  'kin-heart': KIN_HEART, 'kin-vet': KIN_VET, 'kin-protect': KIN_PROTECT, 'ex-awkward': EX_AWKWARD, 'ex-jealous': EX_JEALOUS };
