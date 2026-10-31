// pm/talk/ — the villa's conversations, built from movements.
//
// One file per talking kind: { plans: { featured, short }, moves: { slot: [entries] },
// notes: [entries] }. Put together by pm/script.js talkScript; how islanders talk is
// docs/pm-dialogue-style.md; which scenes are long, short or a note, and what each
// follows from, is pm/story/director.js.
import { GRAFT_EYES_WHOLE } from './whole/graft-eyes.js';
import { FRIENDSHIP_WHOLE } from './whole/friendship.js';
import { PULL_WHOLE } from './whole/pull.js';
import { CHAT_WHOLE } from './whole/chat.js';
import { GROUP_CHAT_WHOLE, groupChatFacts } from './whole/group-chat.js';
import { WATCHING_WHOLE, watchingFacts } from './whole/watching.js';
import { WHERE_HEAD_WHOLE } from './whole/where-head.js';
import { extend, build } from './build.js';
import { DOUBT_END_REASONS, EX_STING, EX_COLD, CASA_REACT_STUNG, BLOWUP_DUMPED, VENT_REASONS, RECOUPLE_EX } from './more/breakup-talk.js';
import { PULL } from './pull.js';
import { LOYALTY } from './loyalty.js';
import { CHAT } from './chat.js';
import { KISS } from './kiss.js';
import { DEEP_CHAT } from './deep-chat.js';
import { FRIENDSHIP } from './friendship.js';
import { FRIENDSHIP_MORE } from './more/friendship.js';
import { FRIENDSHIP_VOLUME } from './more/friendship-volume.js';
import { PULL_VOLUME } from './more/pull-volume.js';
import { LOYALTY_VOLUME, GOSSIP_VOLUME } from './more/loyalty-gossip-volume.js';
import { PULL_VOLUME_2, FRIENDSHIP_VOLUME_2, NOTES_VOLUME } from './more/everyday-volume.js';
import { PULL_VOLUME_3 } from './more/pull-volume-3.js';
import { FRIENDSHIP_VOLUME_3 } from './more/friendship-volume-3.js';
import { LOYALTY_VOLUME_2, GOSSIP_VOLUME_2 } from './more/loyalty-gossip-volume-2.js';
import { FRIENDSHIP_VOLUME_4 } from './more/friendship-volume-4.js';
import { PULL_VOLUME_4 } from './more/pull-volume-4.js';
import { INTRO_VOLUME } from './more/intro-volume.js';
import { FRIENDSHIP_VOLUME_5 } from './more/friendship-volume-5.js';
import { PULL_VOLUME_5 } from './more/pull-volume-5.js';
import { VENT_VOLUME_2, DEBRIEF_VOLUME_2, BLOWUP_VOLUME_2, DATE_VOLUME_2, COMFORT_VOLUME_2, DUMP_GOODBYE_VOLUME } from './more/midsize-volume.js';
import { NOTES_VOLUME_2, STAGES_VOLUME_2, SMALL_MOVES_2 } from './more/notes-volume-2.js';
import { DEBRIEF_RECOUNT, PARENTS_ADVICE_VOLUME, FAMILIES_VOLUME_2 } from './more/debrief-arcs-volume.js';
import { TINY_POOLS } from './more/tiny-pools-volume.js';
import { NOTES_ELEVEN, LOYALTY_ELEVEN, ARGUMENT_ELEVEN, GOSSIP_ELEVEN, DEBRIEF_ELEVEN, PILE_IN_ELEVEN, GAME_KISS_ELEVEN } from './more/round-eleven-b.js';
import { FRIENDSHIP_ELEVEN, PULL_ELEVEN } from './more/round-eleven-a.js';
import { ROUND_TEN } from './more/round-ten-volume.js';
import { NOTES_VOLUME_3 } from './more/notes-volume-3.js';
import { PULL_VOLUME_7 } from './more/pull-volume-7.js';
import { FRIENDSHIP_VOLUME_8 } from './more/friendship-volume-8.js';
import { FRIENDSHIP_NOTES_7, FRIENDSHIP_CLOSE_7 } from './more/friendship-volume-7.js';
import { FRIENDSHIP_VOLUME_6 } from './more/friendship-volume-6.js';
import { PULL_VOLUME_6, GOSSIP_TELL_VOLUME_2, ARGUMENT_START_VOLUME, PILE_IN_LAND_VOLUME } from './more/pull-gossip-volume-6.js';
import { ROWED_VOLUME } from './more/rowed-volume.js';
import { HOTSPOT_VOLUME } from './more/hotspot-volume.js';
import { STORYLINE_VOLUME } from './more/storyline-volume.js';
import { LOYALTY_VOLUME_3, GOSSIP_VOLUME_3 } from './more/loyalty-gossip-volume-3.js';
import { LADDER_VOLUME, GAME_KISS_VOLUME, ARGUMENT_VOLUME_2, GOSSIP_TELL_VOLUME } from './more/ladder-volume.js';
import { FAMILIES_VOLUME, PILE_IN_VOLUME, DEBRIEF_STAGES, VENT_STAGES, ADVICE_STAGES } from './more/small-pools-volume.js';
import { CHAT_VOLUME, DEEP_VOLUME, KISS_VOLUME, ARGUMENT_VOLUME, VENT_VOLUME, DATE_VOLUME, KEEPING_OPEN_VOLUME, COMEDY_VOLUME, COMFORT_VOLUME, ADVICE_VOLUME } from './more/everyday-volume-4.js';
import { DECL_FINAL_MORE } from './more/final.js';
import { CHAT_MORE, DEEP_MORE, KISS_MORE, PULL_MORE, LOYALTY_MORE, ICK_MORE, ARGUMENT_MORE, ADVICE_MORE, COMFORT_MORE,
  REASSURANCE_MORE, CONFESSION_MORE, CONFRONT_MORE, DEBRIEF_MORE, RECOUPLE_MORE, BED_MORE, GOODBYE_MORE, DECL_MORE, DATE_MORE } from './more/everyday.js';
import { GOSSIP } from './gossip.js';
import { TOLD_CONFRONT } from './confront.js';
import { STIRRER_CONFRONT } from './stirrer.js';
import { ARGUMENT } from './argument.js';
import { COMEDY } from './comedy.js';
import { ICK } from './ick.js';
import { ADVICE } from './advice.js';
import { VENT } from './vent.js';
// The storylines and what the villa makes of them (pm/threads.js).
import { GRAFT_EYES } from './graft-eyes.js';
import { WATCHING } from './watching.js';
import { WHERE_HEAD } from './where-head.js';
import { GRAFT_SHUT, GRAFT_TURN } from './graft-turn.js';
import { FEELS_OFF } from './feels-off.js';
import { SECRET_BURDEN } from './secret-burden.js';
import { GROUP_CHAT } from './group-chat.js';
import { BED_CHAT } from './bed-chat.js';
import { VENT_STORY } from './more/vent-story.js';
import { GROUP_CHAT_STORY } from './more/group-chat-story.js';
import { GROUP_CHAT_SPARK } from './more/group-chat-spark.js';
import { PULL_STORY, PULL_STORY_PLANS } from './more/pull-story.js';
import { WHERE_HEAD_MORE, WHERE_HEAD_PLANS } from './more/where-head-more.js';
import { STORY_MORE, WATCHING_PLANS, FEELS_OFF_PLANS, BED_CHAT_PLANS } from './more/story-more.js';
import { GROUP_CHAT_ENDED } from './more/group-chat-ended.js';
import { DOUBT_END } from './doubt-end.js';
import { STRETCH_ANSWER, SECRET_KEPT, HOOK, PICK_PLAN } from './stretch.js';
import { GRAFT_EYES_VOLUME, WATCHING_VOLUME, WHERE_HEAD_VOLUME, GROUP_CHAT_STRETCH } from './more/stretch-volume.js';
import { JUST_FRIENDS } from './just-friends.js';
import { REKINDLE } from './rekindle.js';
import { PICK_CHAT, VOTE_WORRY, STICK_TWIST } from './tonight.js';
import { VOTE_WORRY_VOLUME, PICK_CHAT_VOLUME, STICK_TWIST_VOLUME } from './more/tonight-volume.js';
import { GROUP_CHAT_VOLUME, GROUP_CHAT_NAMED } from './more/group-chat-volume.js';
import { BABY_DOLL_VOLUME, PHOTOS_VOLUME, PHOTO_ROW_VOLUME, JOURNEY_REACT_VOLUME_2, JOURNEY_OPEN_VOLUME, SECRET_BURDEN_VOLUME, CASA_RETURN_VOLUME_2, CASA_RETURN_VOLUME_3, DEBRIEF_TWIST_VOLUME } from './more/repeat-volume-2.js';
import { RECEIPT_VOLUME, JOURNEY_REACT_VOLUME, CASA_RETURN_VOLUME, ENTRANCE_VOLUME, DEBRIEF_VOLUME_3, CASA_MISS_VOLUME, BED_CHAT_VOLUME } from './more/repeat-volume.js';
import { COMFORT } from './comfort.js';
import { CASA_MISS, BED_SHARE } from './casa.js';
import { CHALLENGE_KISS, CHALLENGE_WIN } from './challenge.js';
import { DEBRIEF } from './debrief.js';
import { RECOUPLE_PICK } from './recouple.js';
import { DUMP_REACTION, SOLIDARITY, DUMP_GOODBYE, DUMP_UNFAIR, DUMP_BETRAYED } from './dumping.js';
import { DATE_PICKED, DATE, DATE_BACK } from './dates.js';
import { DECLARATION } from './final.js';
import { INTRO } from './intro.js';
import { BREAKDOWN, OVERTHINKING, JEALOUS_SULK, HEAD_TURNED, TORCH, DOUBLE_STANDARD } from './alone.js';
import { ARRIVAL_CHAT, FIRST_TOAST, BOMBSHELL_TEXT, BOMBSHELL_GUESS, ENTRANCE, BOMBSHELL_REACT } from './arrivals.js';
import { FINAL_DATE, JOURNEY_OPEN, JOURNEY_REACT, JOURNEY_END, SPEECH } from './journey.js';
import { FINAL_DATE_MATES, JOURNEY_OPEN_MATES, JOURNEY_END_MATES, DECLARATION_MATES } from './more/just-friends-final.js';
import { GAME_KISS, TOD_TRUTH } from './kiss-games.js';
import { LIE_WRITE, LIE_ROW } from './lie-detector.js';
import { HIDEAWAY_TEXT, HIDEAWAY_VOTE, HIDEAWAY_WIN, HIDEAWAY_SNUB, HIDEAWAY, HIDEAWAY_MORNING } from './hideaway.js';
import { SPORTS_PICK, SPORTS_RACE } from './sports-day.js';
import { KNOWING_Q } from './knowing-q.js';
import { GOALS_BOARD } from './goals-board.js';
import { SORTS_PLACE } from './sorts-place.js';
import { TOWER_FALL } from './tower-fall.js';
import { CHAL_BUZZ, CHAL_WATCH, CHAL_PRIZE, CHAL_ROW, CHAL_SPARK } from './challenge-frame.js';
import { ENEMY_SNIPE, ENEMY_BITCH, ENEMY_CLASH, ENEMY_FREEZE, ENEMY_TRUCE } from './enemies.js';
import { MOVIE_TEXT, MOVIE_SEAT, MOVIE_REACT, MOVIE_ROW, MOVIE_SPLIT, MOVIE_CALLOUT, MOVIE_AFTER } from './movie-night.js';
import { FAMILIES, NOTES, HEART_RATE, SNOG_MARRY_PIE } from './rituals.js';
import { CASA_TEXT, CASA_GOODBYE, CASA_RETURN, CASA_REACT, CASA_ROW, PHOTO_TEXT, PHOTOS, PHOTO_ROW, PHOTO_SPLIT, POSTCARD_TEXT, POSTCARD } from './casa-amor.js';
import { DUMP_NERVES, RECOUPLE_NERVES, DUMP_PLEA } from './ceremony.js';
import { APOLOGY, APOLOGY_REJECTED, REUNITE, VOTE_FALLOUT, VOTE_CALLOUT, GRUDGE_COLD, GRUDGE_END, FIRST_ARRIVAL } from './aftermath.js';
import { RECEIPT, LOOK_WHO, SNOGGER_KISS, SNOGGER_WIN, SNOGGER_ROW, COUPLE_GOALS, COUPLE_GOALS_ROW, KNOWING_ME, KNOWING_ROW, TALENT_ACT, TALENT_WIN, TALENT_SNUB, BABY_DOLL, SORTS_PODIUM, GRAFTIES_AWARD, BLOW_SLIP, BLOW_DARE, LIP_RACE, LIP_WATCH, TOWER_Q, COURSE_RUN, COURSE_PICK, COURSE_WIN, BLIND_RUN, SPORTS_CAPTAINS, SPORTS_WIN, SPORTS_SORE, HEADLINE } from './challenges.js';
import { STEP_FORWARD, STEP_REVEAL, STEP_CHOOSE, STEP_BACK, STEP_LAST, STEAL, GROUP_ENTRANCE, VISIT_ARRIVE, VISIT_CONFRONT, VISIT_LEAVE, RETURN_ENTRANCE } from './coupling.js';
import { FIRST_LOOK, PROFILE_PICK, PUBLIC_COUPLE, RANKING_COUPLE, STAND_UP, STAND_UP_PICK, SAVE_SETUP, BOMBSHELL_SAVE, PUBLIC_MATCH, RETURN_EX, MISSION_BRIEF, MISSION_DUMP, MISSION_RETURN, SLEEPOVER_INVITE, SLEEPOVER_NIGHT, SLEEPOVER_SINGLE, SLEEPOVER_CHOICE, IMMUNITY_WIN, WALK, WALK_DOUBT, WALK_GOODBYE, WALK_AFTER, ENVELOPE, SAVE_TIE, DUMP_TIE } from './formats.js';
import { EX_TEXT, EX_REVEAL, EX_PARTNER, EX_CONFRONT, PAIR_TEXT, KIN_ENTRANCE, KIN_GOODBYE, KIN_WALK, SC_ARRIVE, SC_RULES, SC_VOTE, SC_STAY, SC_LEAVE, ICEBREAKER, KISS_PICK, LADY_LUCK_KISS, LADY_LUCK_PICK, GRUDGE_CLASH } from './last-pools.js';
import { BLOWUP, PILE_IN, VILLA_DIVIDED, COLD_SHOULDER, CLEAR_THE_AIR } from './blowup.js';
import { BETRAY_SEE, BETRAY_CONFRONT, BETRAY_END, MUGGED_LOW, FOUND_LOVE, VILLA_HAPPY, REDEEM_REFLECT, REDEEM_ACT, REDEEM_DOUBT, GRASS_TALK, GRASS_FROZEN, GRASS_CONFRONT, PARENTS_NAMED, PARENTS_ADVICE, PARENTS_MEDIATE, PARENTS_WOBBLE, EXW_STIR, EXW_PARTNER, EXW_TALK, EXW_BACK } from './arcs.js';
import { TRIANGLE_TORN, TRIANGLE_RIVALS, TRIANGLE_CASE, TRIANGLE_ULTIMATUM, TRIANGLE_TEAMS, TRIANGLE_CHOICE, CAMP_RALLY, CAMP_CONFRONT, CAMP_CLASH, CAMP_LOBBY, CAMP_SPLIT, CAMP_SWITCH, CAMP_AFTER, FEUD_CONFRONT, FEUD_INTERRUPT, FEUD_SHADE, FEUD_ICK, FEUD_CLOSURE, GAME_PLAN, GAME_LATCH, GAME_TWO_FACED, GAME_SUSPECT, GAME_CALLED, GAME_FALLOUT, GAME_END } from './storylines.js';
import { RIVAL_SHADE, RIVAL_PLAY, CODE_CALL, RIVAL_ROW, RIVAL_STEP_BACK, RIVAL_WON, CRUSH_CONFIDE, CRUSH_WATCH, CRUSH_MOVE, CRUSH_PLEA, CRUSH_OVER } from './rivalry.js';
import { CLOSE_OFF, KEEPING_OPEN, OPEN_BACK_UP, EXCLUSIVE_ASK, OFFICIAL_ASK, ASK_DECLINED, LOVE_SAID, LOVE_HANGING } from './ladder.js';
import { KIN_HEART, KIN_VET, KIN_PROTECT, EX_AWKWARD, EX_JEALOUS } from './kin.js';
import { REASSURANCE, JEALOUS_CONFRONT, JEALOUS_RETALIATE, CONFESSION, NO_SHOW } from './jealousy.js';

// More for the pools a season wears thin (pm/talk/more/, measured).
extend(FRIENDSHIP, FRIENDSHIP_MORE); extend(FRIENDSHIP, FRIENDSHIP_VOLUME);
extend(CHAT, CHAT_MORE); extend(DEEP_CHAT, DEEP_MORE); extend(KISS, KISS_MORE); extend(PULL, PULL_MORE); extend(PULL, PULL_VOLUME);
extend(LOYALTY, LOYALTY_MORE); extend(LOYALTY, LOYALTY_VOLUME); extend(GOSSIP, GOSSIP_VOLUME);
extend(PULL, PULL_VOLUME_2); extend(PULL, PULL_VOLUME_3); extend(FRIENDSHIP, FRIENDSHIP_VOLUME_3); extend(FRIENDSHIP, FRIENDSHIP_VOLUME_2); extend(ICK, ICK_MORE); extend(ARGUMENT, ARGUMENT_MORE); extend(ADVICE, ADVICE_MORE);
extend(COMFORT, COMFORT_MORE); extend(REASSURANCE, REASSURANCE_MORE); extend(CONFESSION, CONFESSION_MORE);
extend(JEALOUS_CONFRONT, CONFRONT_MORE); extend(DEBRIEF, DEBRIEF_MORE); extend(RECOUPLE_PICK, RECOUPLE_MORE);
extend(BED_SHARE, BED_MORE); extend(DUMP_GOODBYE, GOODBYE_MORE); extend(DECLARATION, DECL_MORE); extend(DECLARATION, DECL_FINAL_MORE);
// A couple of friends at the final (pm/just-friends.js): their own date, film and speeches.
extend(FINAL_DATE, FINAL_DATE_MATES); extend(JOURNEY_OPEN, JOURNEY_OPEN_MATES); extend(JOURNEY_END, JOURNEY_END_MATES); extend(DECLARATION, DECLARATION_MATES);
for (const t of [FINAL_DATE, JOURNEY_END, DECLARATION]) t.leads = [...(t.leads || []), 'mates']; extend(DATE, DATE_MORE);

// Whole conversations (pm/talk/whole/): one talk start to finish, in the speakers' own voices.
extend(GRAFT_EYES, GRAFT_EYES_WHOLE); extend(FRIENDSHIP, FRIENDSHIP_WHOLE); extend(PULL, PULL_WHOLE); extend(CHAT, CHAT_WHOLE); extend(GROUP_CHAT, GROUP_CHAT_WHOLE); extend(WATCHING, WATCHING_WHOLE); extend(WHERE_HEAD, WHERE_HEAD_WHOLE);

export const TALK = { pull: PULL, loyalty: LOYALTY, chat: CHAT, kiss: KISS, 'deep-chat': DEEP_CHAT, friendship: FRIENDSHIP, gossip: GOSSIP, 'told-confront': TOLD_CONFRONT, 'stirrer-confront': STIRRER_CONFRONT, argument: ARGUMENT,
  comedy: COMEDY, ick: ICK, advice: ADVICE, vent: VENT, comfort: COMFORT, 'casa-miss': CASA_MISS, 'bed-share': BED_SHARE,
  'challenge-kiss': CHALLENGE_KISS, 'challenge-win': CHALLENGE_WIN,
  reassurance: REASSURANCE, 'jealous-confront': JEALOUS_CONFRONT, 'jealous-retaliate': JEALOUS_RETALIATE, confession: CONFESSION, 'no-show': NO_SHOW, debrief: DEBRIEF,
  'recouple-pick': RECOUPLE_PICK, 'dump-reaction': DUMP_REACTION, solidarity: SOLIDARITY, 'dump-goodbye': DUMP_GOODBYE, 'dump-unfair': DUMP_UNFAIR, 'dump-betrayed': DUMP_BETRAYED,
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
  'movie-text': MOVIE_TEXT, 'movie-seat': MOVIE_SEAT, 'movie-react': MOVIE_REACT, 'movie-row': MOVIE_ROW, 'movie-split': MOVIE_SPLIT, 'movie-callout': MOVIE_CALLOUT, 'movie-after': MOVIE_AFTER,
  families: FAMILIES, notes: NOTES, 'heart-rate': HEART_RATE, 'snog-marry-pie': SNOG_MARRY_PIE,
  'casa-text': CASA_TEXT, 'casa-goodbye': CASA_GOODBYE, 'casa-return': CASA_RETURN, 'casa-react': CASA_REACT, 'casa-row': CASA_ROW,
  'photo-text': PHOTO_TEXT, photos: PHOTOS, 'photo-row': PHOTO_ROW, 'photo-split': PHOTO_SPLIT, 'postcard-text': POSTCARD_TEXT, postcard: POSTCARD,
  'sports-pick': SPORTS_PICK, 'sports-race': SPORTS_RACE, 'knowing-q': KNOWING_Q, 'goals-board': GOALS_BOARD, 'sorts-place': SORTS_PLACE, 'tower-fall': TOWER_FALL,
  'chal-buzz': CHAL_BUZZ, 'chal-watch': CHAL_WATCH, 'chal-prize': CHAL_PRIZE, 'chal-row': CHAL_ROW, 'chal-spark': CHAL_SPARK,
  'enemy-snipe': ENEMY_SNIPE, 'enemy-bitch': ENEMY_BITCH, 'enemy-clash': ENEMY_CLASH, 'enemy-freeze': ENEMY_FREEZE, 'enemy-truce': ENEMY_TRUCE,
  'dump-nerves': DUMP_NERVES, 'recouple-nerves': RECOUPLE_NERVES, 'dump-plea': DUMP_PLEA,
  apology: APOLOGY, 'apology-rejected': APOLOGY_REJECTED, reunite: REUNITE, 'vote-fallout': VOTE_FALLOUT, 'vote-callout': VOTE_CALLOUT,
  'grudge-cold': GRUDGE_COLD, 'grudge-end': GRUDGE_END, 'first-arrival': FIRST_ARRIVAL,
  'receipt': RECEIPT, 'look-who': LOOK_WHO, 'snogger-kiss': SNOGGER_KISS, 'snogger-win': SNOGGER_WIN, 'snogger-row': SNOGGER_ROW, 'couple-goals': COUPLE_GOALS, 'couple-goals-row': COUPLE_GOALS_ROW, 'knowing-me': KNOWING_ME, 'knowing-row': KNOWING_ROW, 'talent-act': TALENT_ACT, 'talent-win': TALENT_WIN, 'talent-snub': TALENT_SNUB, 'baby-doll': BABY_DOLL, 'sorts-podium': SORTS_PODIUM, 'grafties-award': GRAFTIES_AWARD, 'blow-slip': BLOW_SLIP, 'blow-dare': BLOW_DARE, 'lip-race': LIP_RACE, 'lip-watch': LIP_WATCH, 'tower-q': TOWER_Q, 'course-run': COURSE_RUN, 'course-pick': COURSE_PICK, 'course-win': COURSE_WIN, 'blind-run': BLIND_RUN, 'sports-captains': SPORTS_CAPTAINS, 'sports-win': SPORTS_WIN, 'sports-sore': SPORTS_SORE, 'headline': HEADLINE,
  'step-forward': STEP_FORWARD, 'step-reveal': STEP_REVEAL, 'step-choose': STEP_CHOOSE, 'step-back': STEP_BACK, 'step-last': STEP_LAST, 'steal': STEAL, 'group-entrance': GROUP_ENTRANCE, 'visit-arrive': VISIT_ARRIVE, 'visit-confront': VISIT_CONFRONT, 'visit-leave': VISIT_LEAVE, 'return-entrance': RETURN_ENTRANCE,
  'first-look': FIRST_LOOK, 'profile-pick': PROFILE_PICK, 'public-couple': PUBLIC_COUPLE, 'ranking-couple': RANKING_COUPLE, 'stand-up': STAND_UP, 'stand-up-pick': STAND_UP_PICK, 'save-setup': SAVE_SETUP, 'bombshell-save': BOMBSHELL_SAVE, 'public-match': PUBLIC_MATCH, 'return-ex': RETURN_EX, 'mission-brief': MISSION_BRIEF, 'mission-dump': MISSION_DUMP, 'mission-return': MISSION_RETURN, 'sleepover-invite': SLEEPOVER_INVITE, 'sleepover-night': SLEEPOVER_NIGHT, 'sleepover-single': SLEEPOVER_SINGLE, 'sleepover-choice': SLEEPOVER_CHOICE, 'immunity-win': IMMUNITY_WIN, 'walk': WALK, 'walk-doubt': WALK_DOUBT, 'walk-goodbye': WALK_GOODBYE, 'walk-after': WALK_AFTER, 'envelope': ENVELOPE, 'save-tie': SAVE_TIE, 'dump-tie': DUMP_TIE,
  'ex-text': EX_TEXT, 'ex-reveal': EX_REVEAL, 'ex-partner': EX_PARTNER, 'ex-confront': EX_CONFRONT, 'pair-text': PAIR_TEXT, 'kin-entrance': KIN_ENTRANCE, 'kin-goodbye': KIN_GOODBYE, 'kin-walk': KIN_WALK, 'sc-arrive': SC_ARRIVE, 'sc-rules': SC_RULES, 'sc-vote': SC_VOTE, 'sc-stay': SC_STAY, 'sc-leave': SC_LEAVE, 'icebreaker': ICEBREAKER, 'kiss-pick': KISS_PICK, 'lady-luck-kiss': LADY_LUCK_KISS, 'lady-luck-pick': LADY_LUCK_PICK, 'grudge-clash': GRUDGE_CLASH,
  blowup: BLOWUP, 'pile-in': PILE_IN, 'villa-divided': VILLA_DIVIDED, 'cold-shoulder': COLD_SHOULDER, 'clear-the-air': CLEAR_THE_AIR,
  'betray-see': BETRAY_SEE, 'betray-confront': BETRAY_CONFRONT, 'betray-end': BETRAY_END, 'mugged-low': MUGGED_LOW, 'found-love': FOUND_LOVE, 'villa-happy': VILLA_HAPPY, 'redeem-reflect': REDEEM_REFLECT, 'redeem-act': REDEEM_ACT, 'redeem-doubt': REDEEM_DOUBT, 'grass-talk': GRASS_TALK, 'grass-frozen': GRASS_FROZEN, 'grass-confront': GRASS_CONFRONT, 'parents-named': PARENTS_NAMED, 'parents-advice': PARENTS_ADVICE, 'parents-mediate': PARENTS_MEDIATE, 'parents-wobble': PARENTS_WOBBLE, 'exw-stir': EXW_STIR, 'exw-partner': EXW_PARTNER, 'exw-talk': EXW_TALK, 'exw-back': EXW_BACK,
  'triangle-torn': TRIANGLE_TORN, 'triangle-rivals': TRIANGLE_RIVALS, 'triangle-case': TRIANGLE_CASE, 'triangle-ultimatum': TRIANGLE_ULTIMATUM, 'triangle-teams': TRIANGLE_TEAMS, 'triangle-choice': TRIANGLE_CHOICE, 'camp-rally': CAMP_RALLY, 'camp-confront': CAMP_CONFRONT, 'camp-clash': CAMP_CLASH, 'camp-lobby': CAMP_LOBBY, 'camp-split': CAMP_SPLIT, 'camp-switch': CAMP_SWITCH, 'camp-after': CAMP_AFTER, 'feud-confront': FEUD_CONFRONT, 'feud-interrupt': FEUD_INTERRUPT, 'feud-shade': FEUD_SHADE, 'feud-ick': FEUD_ICK, 'feud-closure': FEUD_CLOSURE, 'game-plan': GAME_PLAN, 'game-latch': GAME_LATCH, 'game-two-faced': GAME_TWO_FACED, 'game-suspect': GAME_SUSPECT, 'game-called': GAME_CALLED, 'game-fallout': GAME_FALLOUT, 'game-end': GAME_END,
  'rival-shade': RIVAL_SHADE, 'rival-play': RIVAL_PLAY, 'code-call': CODE_CALL, 'rival-row': RIVAL_ROW, 'rival-step-back': RIVAL_STEP_BACK,
  'rival-won': RIVAL_WON, 'crush-confide': CRUSH_CONFIDE, 'crush-watch': CRUSH_WATCH, 'crush-move': CRUSH_MOVE, 'crush-plea': CRUSH_PLEA, 'crush-over': CRUSH_OVER,
  'kin-heart': KIN_HEART, 'kin-vet': KIN_VET, 'kin-protect': KIN_PROTECT, 'ex-awkward': EX_AWKWARD, 'ex-jealous': EX_JEALOUS,
  'graft-eyes': GRAFT_EYES, watching: WATCHING, 'where-head': WHERE_HEAD, 'graft-shut': GRAFT_SHUT, 'graft-turn': GRAFT_TURN,
  'feels-off': FEELS_OFF, 'secret-burden': SECRET_BURDEN, 'group-chat': GROUP_CHAT, 'bed-chat': BED_CHAT };

// A doubt's confide says its real reason (threads.js doubt): `why` leads, and {x} is who {a} looks at.
extend(VENT, VENT_STORY);
VENT.leads = [...(VENT.leads || []), 'why'];
VENT.slots = (state, ev) => (ev.extra?.about ? { x: ev.extra.about } : {});
// The board's numbers, as said out loud: "an eight", "a nine".
const SCORE_WORD = ['nothing', 'a one', 'a two', 'a three', 'a four', 'a five', 'a six', 'a seven', 'an eight', 'a nine', 'a ten'];
TALK['snogger-row'].slots = (state, ev) => {
  const w = n => SCORE_WORD[Math.max(0, Math.min(10, n | 0))];
  const mine = w(ev.extra?.mine);
  return { mine, Mine: mine[0].toUpperCase() + mine.slice(1), top: w(ev.extra?.top) };
};
// …and a group chat names who it is about ({x}) and who with ({about}), and
// says exactly what happened (talk/more/group-chat-story.js) whenever it can.
extend(GROUP_CHAT, GROUP_CHAT_STORY);
extend(GROUP_CHAT, GROUP_CHAT_SPARK);
extend(GROUP_CHAT, GROUP_CHAT_ENDED);
extend(GROUP_CHAT, GROUP_CHAT_VOLUME); extend(GROUP_CHAT, GROUP_CHAT_NAMED);
// The pools one episode heard twice (2026-10-25, more/repeat-volume.js).
for (const [k, more] of [['receipt', RECEIPT_VOLUME], ['journey-react', JOURNEY_REACT_VOLUME], ['casa-return', CASA_RETURN_VOLUME], ['entrance', ENTRANCE_VOLUME],
  ['debrief', DEBRIEF_VOLUME_3], ['casa-miss', CASA_MISS_VOLUME], ['bed-chat', BED_CHAT_VOLUME],
  ['baby-doll', BABY_DOLL_VOLUME], ['photos', PHOTOS_VOLUME], ['photo-row', PHOTO_ROW_VOLUME], ['journey-react', JOURNEY_REACT_VOLUME_2],
  ['journey-open', JOURNEY_OPEN_VOLUME], ['secret-burden', SECRET_BURDEN_VOLUME], ['casa-return', CASA_RETURN_VOLUME_2],
  ['casa-return', CASA_RETURN_VOLUME_3], ['debrief', DEBRIEF_TWIST_VOLUME]]) extend(TALK[k], more);
extend(VOTE_WORRY, VOTE_WORRY_VOLUME); extend(PICK_CHAT, PICK_CHAT_VOLUME); extend(STICK_TWIST, STICK_TWIST_VOLUME);
TALK['doubt-end'] = DOUBT_END;
TALK['stretch-answer'] = STRETCH_ANSWER;
TALK['secret-kept'] = SECRET_KEPT;
TALK.hook = HOOK;
TALK['pick-plan'] = PICK_PLAN;
// The story kinds carry the stretch, so they are drawn more (more/stretch-volume.js).
extend(GRAFT_EYES, GRAFT_EYES_VOLUME); extend(WATCHING, WATCHING_VOLUME); extend(WHERE_HEAD, WHERE_HEAD_VOLUME); extend(GROUP_CHAT, GROUP_CHAT_STRETCH);
TALK['just-friends'] = JUST_FRIENDS;
// Overthinking while the partner is at Casa: the other villa's lines lead (talk/alone.js).
OVERTHINKING.leads = [...(OVERTHINKING.leads || []), 'paAway'];
// The postcard from the night before leads the stick-or-twist talk (pm/postcards.js).
STICK_TWIST.facts = (state, ev) => {
  const pc = state.postcards?.[ev.players[0]];
  return { postcard: pc && pc.ep >= (state.splitEp ?? 0) ? pc.of : null };
};
STICK_TWIST.leads = [...(STICK_TWIST.leads || []), 'postcard'];
// A couple just back together talk about it in bed (bed-chat.js).
BED_CHAT.leads = [...(BED_CHAT.leads || []), 'backNow'];
// Break-ups with a reason and a reaction (pm/breakups.js, talk/more/breakup-talk.js):
// the doubt's end says why and how it was taken; the exes after it.
extend(DOUBT_END, DOUBT_END_REASONS);
DOUBT_END.leads = [...(DOUBT_END.leads || []), 'why', 'took'];
DOUBT_END.slots = (state, ev) => (ev.extra?.about ? { x: ev.extra.about } : {});
extend(VENT, VENT_REASONS);
extend(RECOUPLE_PICK, RECOUPLE_EX);
RECOUPLE_PICK.leads = [...(RECOUPLE_PICK.leads || []), 'exPick', 'reclaimFrom', 'stoleFrom', 'tookFrom', 'leftFrom', 'afterNo', 'cites'];
extend(CASA_REACT, CASA_REACT_STUNG);
CASA_REACT.leads = [...(CASA_REACT.leads || []), 'of'];
TALK['ex-sting'] = build('ex-sting', EX_STING);
TALK['ex-sting'].slots = (state, ev) => (ev.extra?.about ? { x: ev.extra.about } : {});
TALK['ex-cold'] = build('ex-cold', EX_COLD);
// A fight over somebody names them: {x} is who the two of them are fighting over (pm/blowup.js).
TALK.blowup.slots = (state, ev) => (ev.extra?.about ? { x: ev.extra.about } : {});
extend(TALK.blowup, BLOWUP_DUMPED);
TALK.rekindle = REKINDLE;
TALK['pick-chat'] = PICK_CHAT; TALK['vote-worry'] = VOTE_WORRY; TALK['stick-twist'] = STICK_TWIST;
// A story's pull is about the story: no tangent, and its own why, answer and probe.
extend(PULL, PULL_STORY);
PULL.plans.featured = [...PULL_STORY_PLANS, ...PULL.plans.featured];
PULL.leads = [...(PULL.leads || []), 'story'];
// "What's going on?" runs on past the answer: what it did to them, and what now.
extend(WHERE_HEAD, WHERE_HEAD_MORE);
WHERE_HEAD.plans = WHERE_HEAD_PLANS;
// …and the other storyline talks run on a movement longer each.
for (const [k, more] of Object.entries(STORY_MORE)) extend(TALK[k], more);
WATCHING.plans = WATCHING_PLANS;
WATCHING.facts = (state, ev) => ({ ...watchingFacts(state, ev) }); FEELS_OFF.plans = FEELS_OFF_PLANS; BED_CHAT.plans = BED_CHAT_PLANS;
GROUP_CHAT.slots = (state, ev) => ({ ...(ev.extra?.x ? { x: ev.extra.x } : {}), ...(ev.extra?.about ? { about: ev.extra.about } : {}) });
// `sec`: what kind of secret it was (a kiss, a promise, a pull) — never passed until 2026-10-26, so the
// story's found-out tells (more/group-chat-story.js) never played: 45 chats in 10 seasons lost their telling.
GROUP_CHAT.facts = (state, ev) => ({ hasWith: !!ev.extra?.about, ...(ev.extra?.sec ? { sec: ev.extra.sec } : {}), ...groupChatFacts(state, ev) });
// The witness names who it was with.
SECRET_BURDEN.slots = (state, ev) => { const s = (state.secrets || []).find(z => z.id === ev.extra?.secret); return s?.with ? { about: s.with } : {}; };
SECRET_BURDEN.facts = (state, ev) => ({ hasWith: !!(state.secrets || []).find(z => z.id === ev.extra?.secret)?.with });

// The one-line notes the everyday kinds wore thin (talk/more/everyday-volume.js).
for (const [k, notes] of Object.entries(NOTES_VOLUME)) extend(TALK[k], { notes });
// Round four of the everyday volume (talk/more/everyday-volume-4.js).
extend(CHAT, CHAT_VOLUME); extend(DEEP_CHAT, DEEP_VOLUME); extend(KISS, KISS_VOLUME); extend(ARGUMENT, ARGUMENT_VOLUME);
extend(VENT, VENT_VOLUME); extend(DATE, DATE_VOLUME); extend(KEEPING_OPEN, KEEPING_OPEN_VOLUME); extend(COMEDY, COMEDY_VOLUME);
extend(COMFORT, COMFORT_VOLUME); extend(ADVICE, ADVICE_VOLUME);
extend(LOYALTY, LOYALTY_VOLUME_2); extend(GOSSIP, GOSSIP_VOLUME_2);
extend(FRIENDSHIP, FRIENDSHIP_VOLUME_4);
extend(PULL, PULL_VOLUME_4);
extend(INTRO, INTRO_VOLUME);
extend(FAMILIES, FAMILIES_VOLUME); extend(PILE_IN, PILE_IN_VOLUME);
extend(DEBRIEF, { stages: DEBRIEF_STAGES }); extend(VENT, { stages: VENT_STAGES }); extend(ADVICE, { stages: ADVICE_STAGES });
extend(FRIENDSHIP, FRIENDSHIP_VOLUME_5);
extend(PULL, PULL_VOLUME_5);
for (const [k, more] of Object.entries(LADDER_VOLUME)) extend(TALK[k], more);
extend(TALK['game-kiss'], GAME_KISS_VOLUME); extend(ARGUMENT, ARGUMENT_VOLUME_2); extend(GOSSIP, GOSSIP_TELL_VOLUME);
extend(LOYALTY, LOYALTY_VOLUME_3); extend(GOSSIP, GOSSIP_VOLUME_3);
for (const [k, more] of Object.entries(STORYLINE_VOLUME)) extend(TALK[k], more);
extend(VENT, VENT_VOLUME_2); extend(DEBRIEF, DEBRIEF_VOLUME_2); extend(BLOWUP, BLOWUP_VOLUME_2);
extend(DATE, DATE_VOLUME_2); extend(COMFORT, COMFORT_VOLUME_2); extend(DUMP_GOODBYE, DUMP_GOODBYE_VOLUME);
for (const [k, more] of Object.entries(HOTSPOT_VOLUME)) extend(TALK[k], more);
for (const [k, notes] of Object.entries(NOTES_VOLUME_2)) extend(TALK[k], { notes });
for (const [k, stages] of Object.entries(STAGES_VOLUME_2)) extend(TALK[k], { stages });
for (const [k, more] of Object.entries(SMALL_MOVES_2)) extend(TALK[k], more);
for (const [k, more] of Object.entries(ROWED_VOLUME)) extend(TALK[k], more);
extend(FRIENDSHIP, FRIENDSHIP_VOLUME_6);
extend(PULL, PULL_VOLUME_6); extend(GOSSIP, GOSSIP_TELL_VOLUME_2); extend(ARGUMENT, ARGUMENT_START_VOLUME); extend(PILE_IN, PILE_IN_LAND_VOLUME);
extend(FRIENDSHIP, { notes: FRIENDSHIP_NOTES_7, moves: { close: FRIENDSHIP_CLOSE_7 } });
extend(FRIENDSHIP, FRIENDSHIP_VOLUME_8);
extend(PULL, PULL_VOLUME_7);
for (const [k, notes] of Object.entries(NOTES_VOLUME_3)) extend(TALK[k], { notes });
for (const [k, more] of Object.entries(ROUND_TEN)) extend(TALK[k], more);
extend(FRIENDSHIP, FRIENDSHIP_ELEVEN); extend(PULL, PULL_ELEVEN);
for (const [k, notes] of Object.entries(NOTES_ELEVEN)) extend(TALK[k], { notes });
extend(LOYALTY, LOYALTY_ELEVEN); extend(ARGUMENT, ARGUMENT_ELEVEN); extend(GOSSIP, GOSSIP_ELEVEN);
extend(DEBRIEF, DEBRIEF_ELEVEN); extend(PILE_IN, PILE_IN_ELEVEN); extend(TALK['game-kiss'], GAME_KISS_ELEVEN);
for (const [k, more] of Object.entries(TINY_POOLS)) extend(TALK[k], more);
extend(DEBRIEF, DEBRIEF_RECOUNT); extend(TALK['parents-advice'], PARENTS_ADVICE_VOLUME); extend(FAMILIES, FAMILIES_VOLUME_2);

// A telling or a burden that says "earlier" or "this morning" is about today's
// secret only (script.js factsFor `ago`): a secret from before Casa was told as
// if it had happened that morning.
for (const talk of [SECRET_BURDEN, GOSSIP]) for (const pool of Object.values(talk.moves)) for (const e of pool) {
  const text = [e.stage, e.beat, ...(e.turns || []).map(x => (Array.isArray(x) ? x[1] : ''))].filter(Boolean).join(' ');
  if (/\bearlier\b|this morning|\btoday\b|just now|an hour ago/i.test(text) && !e.when?.ago) e.when = { ...(e.when || {}), ago: 'today' };
}
