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
import { DECL_FINAL_MORE } from './more/final.js';
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
import { INTRO } from './intro.js';
import { BREAKDOWN, OVERTHINKING, JEALOUS_SULK, HEAD_TURNED, TORCH, DOUBLE_STANDARD } from './alone.js';
import { ARRIVAL_CHAT, FIRST_TOAST, BOMBSHELL_TEXT, BOMBSHELL_GUESS, ENTRANCE, BOMBSHELL_REACT } from './arrivals.js';
import { FINAL_DATE, JOURNEY_OPEN, JOURNEY_REACT, JOURNEY_END, SPEECH } from './journey.js';
import { GAME_KISS, TOD_TRUTH } from './kiss-games.js';
import { LIE_WRITE, LIE_ROW } from './lie-detector.js';
import { HIDEAWAY_TEXT, HIDEAWAY_VOTE, HIDEAWAY_WIN, HIDEAWAY_SNUB, HIDEAWAY, HIDEAWAY_MORNING } from './hideaway.js';
import { MOVIE_TEXT, MOVIE_SEAT, MOVIE_REACT, MOVIE_ROW, MOVIE_SPLIT } from './movie-night.js';
import { FAMILIES, NOTES, HEART_RATE, SNOG_MARRY_PIE } from './rituals.js';
import { CASA_TEXT, CASA_GOODBYE, CASA_RETURN, CASA_REACT, CASA_ROW, PHOTO_TEXT, PHOTOS, PHOTO_ROW, PHOTO_SPLIT } from './casa-amor.js';
import { DUMP_NERVES, RECOUPLE_NERVES, DUMP_PLEA } from './ceremony.js';
import { APOLOGY, APOLOGY_REJECTED, REUNITE, VOTE_FALLOUT, VOTE_CALLOUT, GRUDGE_COLD, GRUDGE_END, FIRST_ARRIVAL } from './aftermath.js';
import { BLOWUP, PILE_IN, VILLA_DIVIDED, COLD_SHOULDER, CLEAR_THE_AIR } from './blowup.js';
import { BETRAY_SEE, BETRAY_CONFRONT, BETRAY_END, MUGGED_LOW, FOUND_LOVE, VILLA_HAPPY, REDEEM_REFLECT, REDEEM_ACT, REDEEM_DOUBT, GRASS_TALK, GRASS_FROZEN, GRASS_CONFRONT, PARENTS_NAMED, PARENTS_ADVICE, PARENTS_MEDIATE, PARENTS_WOBBLE, EXW_STIR, EXW_PARTNER, EXW_TALK, EXW_BACK } from './arcs.js';
import { TRIANGLE_TORN, TRIANGLE_RIVALS, TRIANGLE_CASE, TRIANGLE_ULTIMATUM, TRIANGLE_TEAMS, TRIANGLE_CHOICE, CAMP_RALLY, CAMP_CONFRONT, CAMP_CLASH, CAMP_LOBBY, CAMP_SPLIT, CAMP_SWITCH, CAMP_AFTER, FEUD_CONFRONT, FEUD_INTERRUPT, FEUD_SHADE, FEUD_ICK, FEUD_CLOSURE, GAME_PLAN, GAME_LATCH, GAME_TWO_FACED, GAME_SUSPECT, GAME_CALLED, GAME_FALLOUT, GAME_END } from './storylines.js';
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
extend(BED_SHARE, BED_MORE); extend(DUMP_GOODBYE, GOODBYE_MORE); extend(DECLARATION, DECL_MORE); extend(DECLARATION, DECL_FINAL_MORE); extend(DATE, DATE_MORE);

export const TALK = { pull: PULL, loyalty: LOYALTY, chat: CHAT, kiss: KISS, 'deep-chat': DEEP_CHAT, friendship: FRIENDSHIP, gossip: GOSSIP, argument: ARGUMENT,
  comedy: COMEDY, ick: ICK, advice: ADVICE, vent: VENT, comfort: COMFORT, 'casa-miss': CASA_MISS, 'bed-share': BED_SHARE,
  'challenge-kiss': CHALLENGE_KISS, 'challenge-win': CHALLENGE_WIN,
  reassurance: REASSURANCE, 'jealous-confront': JEALOUS_CONFRONT, 'jealous-retaliate': JEALOUS_RETALIATE, confession: CONFESSION, 'no-show': NO_SHOW, debrief: DEBRIEF,
  'recouple-pick': RECOUPLE_PICK, 'dump-reaction': DUMP_REACTION, solidarity: SOLIDARITY, 'dump-goodbye': DUMP_GOODBYE,
  'date-picked': DATE_PICKED, date: DATE, 'date-back': DATE_BACK,
  'close-off': CLOSE_OFF, 'keeping-open': KEEPING_OPEN, 'open-back-up': OPEN_BACK_UP, 'exclusive-ask': EXCLUSIVE_ASK,
  'official-ask': OFFICIAL_ASK, 'ask-declined': ASK_DECLINED, 'love-said': LOVE_SAID, 'love-hanging': LOVE_HANGING,
  declaration: DECLARATION, intro: INTRO,
  breakdown: BREAKDOWN, overthinking: OVERTHINKING, 'jealous-sulk': JEALOUS_SULK, 'head-turned': HEAD_TURNED, torch: TORCH, 'double-standard': DOUBLE_STANDARD,
  'arrival-chat': ARRIVAL_CHAT, 'first-toast': FIRST_TOAST, 'bombshell-text': BOMBSHELL_TEXT, 'bombshell-guess': BOMBSHELL_GUESS, entrance: ENTRANCE, 'bombshell-react': BOMBSHELL_REACT,
  'final-date': FINAL_DATE, 'journey-open': JOURNEY_OPEN, 'journey-react': JOURNEY_REACT, 'journey-end': JOURNEY_END, speech: SPEECH,
  'game-kiss': GAME_KISS, 'tod-truth': TOD_TRUTH,
  'lie-write': LIE_WRITE, 'lie-row': LIE_ROW,
  'hideaway-text': HIDEAWAY_TEXT, 'hideaway-vote': HIDEAWAY_VOTE, 'hideaway-win': HIDEAWAY_WIN, 'hideaway-snub': HIDEAWAY_SNUB, hideaway: HIDEAWAY, 'hideaway-morning': HIDEAWAY_MORNING,
  'movie-text': MOVIE_TEXT, 'movie-seat': MOVIE_SEAT, 'movie-react': MOVIE_REACT, 'movie-row': MOVIE_ROW, 'movie-split': MOVIE_SPLIT,
  families: FAMILIES, notes: NOTES, 'heart-rate': HEART_RATE, 'snog-marry-pie': SNOG_MARRY_PIE,
  'casa-text': CASA_TEXT, 'casa-goodbye': CASA_GOODBYE, 'casa-return': CASA_RETURN, 'casa-react': CASA_REACT, 'casa-row': CASA_ROW,
  'photo-text': PHOTO_TEXT, photos: PHOTOS, 'photo-row': PHOTO_ROW, 'photo-split': PHOTO_SPLIT,
  'dump-nerves': DUMP_NERVES, 'recouple-nerves': RECOUPLE_NERVES, 'dump-plea': DUMP_PLEA,
  apology: APOLOGY, 'apology-rejected': APOLOGY_REJECTED, reunite: REUNITE, 'vote-fallout': VOTE_FALLOUT, 'vote-callout': VOTE_CALLOUT,
  'grudge-cold': GRUDGE_COLD, 'grudge-end': GRUDGE_END, 'first-arrival': FIRST_ARRIVAL,
  blowup: BLOWUP, 'pile-in': PILE_IN, 'villa-divided': VILLA_DIVIDED, 'cold-shoulder': COLD_SHOULDER, 'clear-the-air': CLEAR_THE_AIR,
  'betray-see': BETRAY_SEE, 'betray-confront': BETRAY_CONFRONT, 'betray-end': BETRAY_END, 'mugged-low': MUGGED_LOW, 'found-love': FOUND_LOVE, 'villa-happy': VILLA_HAPPY, 'redeem-reflect': REDEEM_REFLECT, 'redeem-act': REDEEM_ACT, 'redeem-doubt': REDEEM_DOUBT, 'grass-talk': GRASS_TALK, 'grass-frozen': GRASS_FROZEN, 'grass-confront': GRASS_CONFRONT, 'parents-named': PARENTS_NAMED, 'parents-advice': PARENTS_ADVICE, 'parents-mediate': PARENTS_MEDIATE, 'parents-wobble': PARENTS_WOBBLE, 'exw-stir': EXW_STIR, 'exw-partner': EXW_PARTNER, 'exw-talk': EXW_TALK, 'exw-back': EXW_BACK,
  'triangle-torn': TRIANGLE_TORN, 'triangle-rivals': TRIANGLE_RIVALS, 'triangle-case': TRIANGLE_CASE, 'triangle-ultimatum': TRIANGLE_ULTIMATUM, 'triangle-teams': TRIANGLE_TEAMS, 'triangle-choice': TRIANGLE_CHOICE, 'camp-rally': CAMP_RALLY, 'camp-confront': CAMP_CONFRONT, 'camp-clash': CAMP_CLASH, 'camp-lobby': CAMP_LOBBY, 'camp-split': CAMP_SPLIT, 'camp-switch': CAMP_SWITCH, 'camp-after': CAMP_AFTER, 'feud-confront': FEUD_CONFRONT, 'feud-interrupt': FEUD_INTERRUPT, 'feud-shade': FEUD_SHADE, 'feud-ick': FEUD_ICK, 'feud-closure': FEUD_CLOSURE, 'game-plan': GAME_PLAN, 'game-latch': GAME_LATCH, 'game-two-faced': GAME_TWO_FACED, 'game-suspect': GAME_SUSPECT, 'game-called': GAME_CALLED, 'game-fallout': GAME_FALLOUT, 'game-end': GAME_END,
  'rival-shade': RIVAL_SHADE, 'rival-play': RIVAL_PLAY, 'code-call': CODE_CALL, 'rival-row': RIVAL_ROW, 'rival-step-back': RIVAL_STEP_BACK,
  'rival-won': RIVAL_WON, 'crush-confide': CRUSH_CONFIDE, 'crush-watch': CRUSH_WATCH, 'crush-move': CRUSH_MOVE, 'crush-plea': CRUSH_PLEA, 'crush-over': CRUSH_OVER,
  'kin-heart': KIN_HEART, 'kin-vet': KIN_VET, 'kin-protect': KIN_PROTECT, 'ex-awkward': EX_AWKWARD, 'ex-jealous': EX_JEALOUS };
