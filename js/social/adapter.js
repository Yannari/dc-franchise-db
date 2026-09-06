// What each show calls things.
//
// Birdie and ChatAlumni render the same canonical events for every format, and
// the only thing that differs is vocabulary: Total Drama eliminates people from
// a camp after a challenge, Big Brother evicts them from a house after a
// competition. Without one adapter that difference becomes an `if (format ===
// 'big-brother')` in every renderer, and the fifteenth one gets forgotten.
//
// A new show adds an entry here. It does not touch a component.
//
// Pure: no DOM, no data files, no gs.
import { DEFAULT_FORMAT, seasonId } from '../shows.js';

/** The default vocabulary. An unknown format renders in these words rather than crashing. */
const GENERIC = {
  name: 'The Show',
  short: 'SHOW',
  episode: 'episode',
  Episode: 'Episode',
  episodeShort: 'Ep',
  elimination: 'elimination',
  eliminated: 'eliminated',
  challenge: 'challenge',
  home: 'camp',
  vote: 'vote',
  // THE BALLOT THAT DECIDES THE SEASON, which is not the weekly one. A
  // finale take written with `vote` said "not one bitter eviction vote at the
  // end" about a night decided by a jury -- the right show, the wrong ballot.
  // Null where a show has no final ballot at all, and a sentence that needs
  // one must then say something else rather than invent it.
  finalVote: 'final vote',
  comps: ['challenge'],
  danger: 'the crosshairs',
  Danger: 'The crosshairs',
  onDanger: 'in the crosshairs',
  nominated: 'took votes',
  Pawn: 'A spare vote',
  Ceremony: 'The ceremony',
  nominee: 'the one taking votes',
  pawn: 'a spare vote',
  ceremony: 'the ceremony',
  jury: 'the jury',
  safe: 'safe',
  // ── the two fields that used to be a ternary on one show ──
  //
  // `nominationLabel` heads the timeline row for somebody the room decided
  // about and did not remove; `polls` are the questions this show can honestly
  // ask while a season is running. Both used to be a ternary testing the
  // second show's slug — a two-answer question in a file that exists because
  // there will be more than two shows — so a third show asked its audience who
  // wins the next challenge and who makes the merge, over a format with
  // neither. The literal is deliberately NOT quoted here: the duplication
  // guard counts that shape by matching source text, and a comment quoting the
  // thing it replaced keeps the count where it was and lets the ratchet pass
  // untightened. That has already happened once in this repo.
  nominationLabel: 'Votes against',
  polls: [
    { id: 'boot', text: 'Who goes home tonight?' },
    { id: 'immunity', text: 'Who wins the next challenge?' },
  ],
};

const SHOW_WORDS = {
  'total-drama': {
    name: 'Total Drama',
    short: 'TD',
    episode: 'episode',
    Episode: 'Episode',
    episodeShort: 'Ep',
    elimination: 'elimination',
    eliminated: 'eliminated',
    challenge: 'challenge',
    home: 'camp',
    vote: 'vote',
    finalVote: 'jury vote',
    comps: ['challenge', 'immunity challenge', 'reward challenge'],
    // ── the danger vocabulary ──
    //
    // The alumni room was written in Big Brother and shown to both shows, so a
    // Total Drama night read "Alessio is on the block. Fight or do not." There
    // is no block on this show. There is no nomination ceremony, no pawn, no
    // veto — a `nomination` event here is somebody who TOOK VOTES at a
    // ceremony and stayed, which is a different fact needing different words.
    danger: 'the crosshairs',
    Danger: 'The crosshairs',
    onDanger: 'in the crosshairs',
    nominated: 'took votes',
    Pawn: 'A spare vote',
    Ceremony: 'The ceremony',
    nominee: 'the one taking votes',
    pawn: 'a spare vote',
    ceremony: 'the ceremony',
    jury: 'the jury',
    safe: 'safe',
    nominationLabel: 'Votes against',
    polls: [
      { id: 'boot', text: 'Who goes home tonight?' },
      { id: 'immunity', text: 'Who wins the next challenge?' },
      { id: 'merge', text: 'Who makes the merge?' },
    ],
  },
  'big-brother': {
    name: 'Big Brother',
    short: 'BB',
    episode: 'week',
    Episode: 'Week',
    episodeShort: 'Wk',
    elimination: 'eviction',
    eliminated: 'evicted',
    challenge: 'competition',
    home: 'house',
    vote: 'eviction vote',
    finalVote: 'jury vote',
    comps: ['competition', 'HOH', 'veto'],
    danger: 'the block',
    Danger: 'The block',
    onDanger: 'on the block',
    nominated: 'was nominated',
    Pawn: 'A pawn',
    Ceremony: 'Nominations',
    nominee: 'the nominee',
    pawn: 'a pawn',
    ceremony: 'the nomination ceremony',
    jury: 'the jury',
    safe: 'safe',
    nominationLabel: 'Nomination',
    polls: [
      { id: 'evicted', text: 'Who gets evicted this week?' },
      { id: 'hoh', text: 'Who wins the next HOH?' },
      { id: 'veto', text: 'Does the veto get used?' },
    ],
  },
  // ── The Traitors ──
  //
  // A show with two exit verbs, and only one of them belongs in `eliminated`.
  // `elimination`/`eliminated` are the words the room uses about the VOTE —
  // the banishment — because every take that reaches for them is reacting to
  // a decision the room made. A murder is not a decision the room made and is
  // not describable in these words at all, which is why `exit`/`exitMurder`
  // live on the registry (`exitVerbs`) and a screen naming a departure reads
  // the round's own channel. Nothing here may be used to describe a murder.
  //
  // There is no block, no nomination and no ceremony. The Round Table is a
  // room where the castle accuses each other out loud and then votes, so the
  // danger vocabulary is about SUSPICION rather than about a position on a
  // board: you are not put somewhere, you are talked about.
  traitors: {
    name: 'The Traitors',
    short: 'TR',
    episode: 'episode',
    Episode: 'Episode',
    episodeShort: 'Ep',
    elimination: 'banishment',
    eliminated: 'banished',
    challenge: 'mission',
    home: 'castle',
    vote: 'banishment vote',
    // NO FINAL BALLOT AT ALL. The last table is a banishment like every
    // other, and what follows it is a decision by the people still sitting
    // there -- nobody votes on the winner.
    finalVote: null,
    comps: ['mission'],
    danger: 'suspicion',
    Danger: 'Suspicion',
    onDanger: 'under suspicion',
    nominated: 'was accused',
    Pawn: 'A safe name',
    Ceremony: 'The Round Table',
    nominee: 'the accused',
    pawn: 'a safe name',
    ceremony: 'the Round Table',
    // NOT 'the jury'. Nobody who leaves this castle ever votes again — the
    // last table is a banishment like every other and what follows it is a
    // decision by the people still sitting there.
    jury: 'the final table',
    safe: 'safe',
    nominationLabel: 'Accusation',
    // NOT "who gets murdered tonight?" — the conclave is the show's secret and
    // a poll naming it would tell the audience there are Traitors deciding,
    // which is the one thing a viewer is meant to be guessing at. Everything
    // askable here is askable from the outside of the castle.
    polls: [
      { id: 'banished', text: 'Who gets banished tonight?' },
      { id: 'traitor', text: 'Who is a Traitor?' },
      { id: 'survive', text: 'Who is still here in the morning?' },
    ],
  },
  'drag-race': {
    name: 'Drag Race',
    short: 'DR',
    episode: 'episode',
    Episode: 'Episode',
    episodeShort: 'Ep',
    elimination: 'elimination',
    eliminated: 'sashayed away',
    challenge: 'maxi challenge',
    home: 'werk room',
    // ── NOBODY VOTES ON THIS SHOW ──────────────────────────────────
    //
    // Not "a different kind of vote": none. A panel ranks the week and the
    // host decides, so every label built from a vote must be absent rather
    // than translated, and every consumer has to handle the absence. A
    // borrowed word here would put a ballot on a page about a runway.
    vote: null,
    finalVote: null,
    comps: ['maxi challenge', 'lip sync'],
    danger: 'the bottom',
    Danger: 'The bottom',
    onDanger: 'in the bottom',
    nominated: 'landed in the bottom',
    Pawn: 'A safe queen',
    Ceremony: 'The main stage',
    nominee: 'a bottom queen',
    pawn: 'a safe queen',
    ceremony: 'the main stage',
    // No jury: nobody who leaves ever decides anything again.
    jury: null,
    safe: 'safe',
    // There is no nomination on this show, so there is no label for one.
    nominationLabel: null,
    polls: [
      { id: 'win', text: 'Who wins the next maxi challenge?' },
      { id: 'lipsync', text: 'Who lip syncs next week?' },
      { id: 'robbed', text: 'Who was robbed this week?' },
    ],
  },
};

/** The words this show uses. Unknown formats get the generic set, never a crash. */
export function words(format) {
  return SHOW_WORDS[format] || GENERIC;
}

const _cap = s => String(s || '').replace(/^./, c => c.toUpperCase());

/**
 * What to call one canonical event, in this show's language.
 *
 * The event kinds come from js/social/events.js and are deliberately
 * show-neutral — `eviction` is the kind whatever the show calls it — so this is
 * the single place the neutral name becomes the shown one.
 */
export function eventLabel(kind, format) {
  const w = words(format);
  const map = {
    'episode-aired': `${w.Episode} aired`,
    // ── THREE LABELS THAT USED TO BE A TERNARY ON ONE SHOW'S SLUG ──
    //
    // A ternary on one show has exactly two answers, and the second of them is
    // whatever Total Drama says. So a third show's timeline was headed
    // "Challenge win", "Votes against" and "Elimination" over a castle that
    // runs missions and banishes people — the file whose entire job is to stop
    // that, doing it. Built from the show's own vocabulary now: a fourth show
    // gets its labels by declaring `challenge`, `nominated` and `elimination`,
    // and there is nothing here to remember to extend.
    'comp-win': `${_cap(w.challenge)} win`,
    nomination: w.nominationLabel,
    'veto-used': 'Veto used',
    eviction: _cap(w.elimination),
    blindside: 'Blindside',
    betrayal: 'Betrayal',
    'alliance-formed': 'Alliance',
    'showmance-formed': 'Showmance',
    'showmance-broken': 'Breakup',
    'romantic-spark': 'Spark',
    argument: 'Argument',
    'ganging-up': 'Pile-on',
    kindness: 'Kindness',
    domination: 'Domination',
    twist: 'Twist',
    finale: 'Finale',
  };
  return map[kind] || kind.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
}

/** "TD 14 · Episode 7", the chip that tells you where you are. */
export function contextLabel(format, season, episode) {
  const w = words(format);
  const head = `${w.short} ${season}`;
  return episode ? `${head} · ${w.Episode} ${episode}` : head;
}

/**
 * Which prediction questions this show can honestly ask.
 *
 * A poll about a veto in a season with no veto is a fabricated game event
 * wearing a question mark. The list is derived from the show's own mechanics,
 * and preseason drops everything that needs a game already in progress.
 */
export function pollQuestions(format, { preseason = false } = {}) {
  const w = words(format);
  const always = [
    { id: 'winner', text: `Who wins ${w.name} this season?` },
    { id: 'favourite', text: 'Who are you rooting for?' },
  ];
  if (preseason) return always;

  // Declared by the show, not chosen by a ternary. See `polls` in SHOW_WORDS.
  return [...(w.polls || GENERIC.polls), ...always];
}

/**
 * The file the published season log lives in.
 *
 * Total Drama keeps the bare filename its fourteen files already use; every
 * other show is namespaced by `seasonId`, exactly as the publish path writes
 * them. The prefix comes from shows.js rather than being spelled out here —
 * this project has already carried three copies of that map and watched them
 * drift.
 */
export function seasonDataFile(format, season) {
  return (!format || format === DEFAULT_FORMAT)
    ? `season${Number(season)}-data.json`
    : `${seasonId(format, season)}-data.json`;
}
