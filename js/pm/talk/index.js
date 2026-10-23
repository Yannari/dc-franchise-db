// pm/talk/ — the villa's conversations, built from movements.
//
// One file per talking kind: { plans: { featured, short }, moves: { slot: [entries] },
// notes: [entries] }. Put together by pm/script.js talkScript; how islanders talk is
// docs/pm-dialogue-style.md; which scenes are long, short or a note, and what each
// follows from, is pm/story/director.js.
import { extend } from './build.js';
import { PULL } from './pull.js';
import { LOYALTY } from './loyalty.js';
import { CHAT } from './chat.js';
import { KISS } from './kiss.js';
import { DEEP_CHAT } from './deep-chat.js';
import { FRIENDSHIP } from './friendship.js';
import { FRIENDSHIP_MORE } from './more/friendship.js';
import { CHAT_MORE, DEEP_MORE, KISS_MORE, PULL_MORE, LOYALTY_MORE, ICK_MORE, ARGUMENT_MORE, ADVICE_MORE, COMFORT_MORE,
  REASSURANCE_MORE, CONFESSION_MORE, CONFRONT_MORE, DEBRIEF_MORE, RECOUPLE_MORE, BED_MORE, GOODBYE_MORE, DECL_MORE, DATE_MORE } from './more/everyday.js';
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
import { RECOUPLE_PICK } from './recouple.js';
import { DUMP_REACTION, SOLIDARITY, DUMP_GOODBYE } from './dumping.js';
import { DATE_PICKED, DATE, DATE_BACK } from './dates.js';
import { DECLARATION } from './final.js';
import { RIVAL_SHADE, RIVAL_PLAY, CODE_CALL, RIVAL_ROW, RIVAL_STEP_BACK, RIVAL_WON, CRUSH_CONFIDE, CRUSH_WATCH, CRUSH_MOVE, CRUSH_PLEA, CRUSH_OVER } from './rivalry.js';
import { CLOSE_OFF, KEEPING_OPEN, OPEN_BACK_UP, EXCLUSIVE_ASK, OFFICIAL_ASK, ASK_DECLINED, LOVE_SAID, LOVE_HANGING } from './ladder.js';
import { KIN_HEART, KIN_VET, KIN_PROTECT, EX_AWKWARD, EX_JEALOUS } from './kin.js';
import { REASSURANCE, JEALOUS_CONFRONT, JEALOUS_RETALIATE, CONFESSION, NO_SHOW } from './jealousy.js';

// More for the pools a season wears thin (pm/talk/more/, measured).
extend(FRIENDSHIP, FRIENDSHIP_MORE);
extend(CHAT, CHAT_MORE); extend(DEEP_CHAT, DEEP_MORE); extend(KISS, KISS_MORE); extend(PULL, PULL_MORE);
extend(LOYALTY, LOYALTY_MORE); extend(ICK, ICK_MORE); extend(ARGUMENT, ARGUMENT_MORE); extend(ADVICE, ADVICE_MORE);
extend(COMFORT, COMFORT_MORE); extend(REASSURANCE, REASSURANCE_MORE); extend(CONFESSION, CONFESSION_MORE);
extend(JEALOUS_CONFRONT, CONFRONT_MORE); extend(DEBRIEF, DEBRIEF_MORE); extend(RECOUPLE_PICK, RECOUPLE_MORE);
extend(BED_SHARE, BED_MORE); extend(DUMP_GOODBYE, GOODBYE_MORE); extend(DECLARATION, DECL_MORE); extend(DATE, DATE_MORE);

export const TALK = { pull: PULL, loyalty: LOYALTY, chat: CHAT, kiss: KISS, 'deep-chat': DEEP_CHAT, friendship: FRIENDSHIP, gossip: GOSSIP, argument: ARGUMENT,
  comedy: COMEDY, ick: ICK, advice: ADVICE, vent: VENT, comfort: COMFORT, 'casa-miss': CASA_MISS, 'bed-share': BED_SHARE,
  'challenge-kiss': CHALLENGE_KISS, 'challenge-win': CHALLENGE_WIN,
  reassurance: REASSURANCE, 'jealous-confront': JEALOUS_CONFRONT, 'jealous-retaliate': JEALOUS_RETALIATE, confession: CONFESSION, 'no-show': NO_SHOW, debrief: DEBRIEF,
  'recouple-pick': RECOUPLE_PICK, 'dump-reaction': DUMP_REACTION, solidarity: SOLIDARITY, 'dump-goodbye': DUMP_GOODBYE,
  'date-picked': DATE_PICKED, date: DATE, 'date-back': DATE_BACK,
  'close-off': CLOSE_OFF, 'keeping-open': KEEPING_OPEN, 'open-back-up': OPEN_BACK_UP, 'exclusive-ask': EXCLUSIVE_ASK,
  'official-ask': OFFICIAL_ASK, 'ask-declined': ASK_DECLINED, 'love-said': LOVE_SAID, 'love-hanging': LOVE_HANGING,
  declaration: DECLARATION,
  'rival-shade': RIVAL_SHADE, 'rival-play': RIVAL_PLAY, 'code-call': CODE_CALL, 'rival-row': RIVAL_ROW, 'rival-step-back': RIVAL_STEP_BACK,
  'rival-won': RIVAL_WON, 'crush-confide': CRUSH_CONFIDE, 'crush-watch': CRUSH_WATCH, 'crush-move': CRUSH_MOVE, 'crush-plea': CRUSH_PLEA, 'crush-over': CRUSH_OVER,
  'kin-heart': KIN_HEART, 'kin-vet': KIN_VET, 'kin-protect': KIN_PROTECT, 'ex-awkward': EX_AWKWARD, 'ex-jealous': EX_JEALOUS };
