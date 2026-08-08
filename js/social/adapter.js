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
  comps: ['challenge'],
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
    comps: ['challenge', 'immunity challenge', 'reward challenge'],
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
    comps: ['competition', 'HOH', 'veto'],
  },
};

/** The words this show uses. Unknown formats get the generic set, never a crash. */
export function words(format) {
  return SHOW_WORDS[format] || GENERIC;
}

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
    'comp-win': format === 'big-brother' ? 'Competition win' : 'Challenge win',
    nomination: format === 'big-brother' ? 'Nomination' : 'Votes against',
    'veto-used': 'Veto used',
    eviction: format === 'big-brother' ? 'Eviction' : 'Elimination',
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

  const inSeason = format === 'big-brother'
    ? [
        { id: 'evicted', text: 'Who gets evicted this week?' },
        { id: 'hoh', text: 'Who wins the next HOH?' },
        { id: 'veto', text: 'Does the veto get used?' },
      ]
    : [
        { id: 'boot', text: 'Who goes home tonight?' },
        { id: 'immunity', text: 'Who wins the next challenge?' },
        { id: 'merge', text: 'Who makes the merge?' },
      ];
  return [...inSeason, ...always];
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
