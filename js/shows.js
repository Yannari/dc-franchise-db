// ══════════════════════════════════════════════════════════════════════
// shows.js — which show a season belongs to
// ══════════════════════════════════════════════════════════════════════
//
// The franchise was one show numbered 1..14, so a season was an integer and
// every page could assume it. With a second show that integer stops being an
// identity: "Season 1" is now a question, not an answer.
//
// A season is (format, season_number), each show numbering from one. This file
// is the only place that knows the slugs, the URL prefixes and the display
// names, so adding a third show is one entry here rather than a search for
// every place a format was assumed.

export const SHOWS = {
  'total-drama': {
    prefix: 'td', name: 'Total Drama', short: 'TD', emoji: '🎬',
    // What this show calls its people, its rounds and leaving. Every page and
    // prompt that describes a season needs these four words, and hardcoding
    // them is how a Total Drama season came to be told it had houseguests who
    // were nominated. A show states its own vocabulary here.
    words: { player: 'contestant', players: 'contestants', round: 'Episode', exit: 'voted out' },
    // Season-detail fields this show contributes to a career, and the byShow
    // key each lands under. A show declares its own shape here rather than
    // _rebuildByShow branching on the format.
    careerStats: [
      ['challengeWins', 'totalChallengeWins'],
      ['immunityWins', 'totalImmunityWins'],
      ['rewardWins', 'totalRewardWins'],
      ['idolsFound', 'totalIdolsFound'],
    ],
  },
  'big-brother': {
    prefix: 'bb', name: 'Big Brother', short: 'BB', emoji: '📹',
    words: { player: 'houseguest', players: 'houseguests', round: 'Week', exit: 'evicted' },
    careerStats: [
      ['challengeWins', 'totalCompWins'],
      ['bb.hohWins', 'hohWins'],
      ['bb.vetoWins', 'vetoWins'],
      ['bb.timesNominated', 'timesNominated'],
    ],
  },
};

/** The default for anything that predates formats — every old season is this. */
export const DEFAULT_FORMAT = 'total-drama';

const BY_PREFIX = Object.fromEntries(
  Object.entries(SHOWS).map(([format, show]) => [show.prefix, format]));

export function formatPrefix(format) {
  return SHOWS[format]?.prefix || SHOWS[DEFAULT_FORMAT].prefix;
}

/**
 * The show's own words, for anything that writes about a season.
 *
 * Falls back to the default show's vocabulary so an unregistered format still
 * produces readable text rather than "undefined was undefined".
 */
export function showWords(format) {
  return { show: showName(format),
    ...(SHOWS[DEFAULT_FORMAT].words), ...(SHOWS[format]?.words || {}) };
}

export function showName(format) {
  return SHOWS[format]?.name || SHOWS[DEFAULT_FORMAT].name;
}

/** "td-14" — the string form used in URLs and cross-references. */
export function seasonId(format, number) {
  return `${formatPrefix(format)}-${Number(number)}`;
}

/**
 * Read a season reference from a URL, a JSON field or a saved link.
 *
 * A BARE INTEGER IS TOTAL DRAMA, PERMANENTLY. Every link on the site and every
 * link anybody has bookmarked is `?season=7`, and those cannot be allowed to
 * rot the day a second show exists.
 *
 * Returns null rather than guessing, so a caller can tell "no season" from
 * "season 0".
 */
export function parseSeasonRef(ref) {
  if (ref == null || ref === '') return null;
  const raw = String(ref).trim().toLowerCase();

  if (/^\d+$/.test(raw)) {
    const number = Number(raw);
    return number > 0 ? { format: DEFAULT_FORMAT, number } : null;
  }

  const match = raw.match(/^([a-z]+)-(\d+)$/);
  if (!match) return null;
  const format = BY_PREFIX[match[1]];
  const number = Number(match[2]);
  if (!format || number <= 0) return null;
  return { format, number };
}
