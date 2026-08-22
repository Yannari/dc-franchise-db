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
    // `comp` and friends are here because the finale writes about what a
    // finalist WON, and a Big Brother jury does not sit through challenges or
    // hand out immunity. A juror was saying "three individual immunities" and
    // "challenge beast" about a houseguest's Heads of Household.
    words: { player: 'contestant', players: 'contestants', round: 'Episode', exit: 'voted out',
      comp: 'challenge', comps: 'immunity wins', compBeast: 'challenge beast', compWon: 'immunities' },
    // Season-detail fields this show contributes to a career, and the byShow
    // key each lands under. A show declares its own shape here rather than
    // _rebuildByShow branching on the format.
    // WHAT THIS SHOW IS FOR, as the ratings read it. A multiplier per signal,
    // applied on top of the four demographics' universal tastes in
    // js/ratings.js — that table says what a Young Adult wants from reality
    // television, this says what the show is selling.
    //
    // Total Drama is sold on stunts, chaos and who is kissing whom. Vote
    // arithmetic happens, but nobody tuned in for it, so a quiet competent
    // week rates worse here than the identical week does on Big Brother.
    // `twist` is a MAP rather than a number, and it is the reason maps exist.
    // A twist here is not an intrusion into a game, it is the format: nobody
    // tunes in to a stunt show expecting a clean season. So the younger half
    // enjoys it more than they would elsewhere and the older half minds it far
    // less — where a single multiplier could only make everyone's existing
    // feeling louder, which rated twisty seasons BELOW quiet ones on the show
    // built out of twists.
    audience: { strategy: 0.7, mess: 1.3, showmance: 1.25, predictable: 1.15,
      twist: { teens: 1.35, youngAdults: 1.25, middleAged: 0.45, older: 0.3 } },
    careerStats: [
      ['challengeWins', 'totalChallengeWins'],
      ['immunityWins', 'totalImmunityWins'],
      ['rewardWins', 'totalRewardWins'],
      ['idolsFound', 'totalIdolsFound'],
    ],
  },
  'big-brother': {
    prefix: 'bb', name: 'Big Brother', short: 'BB', emoji: '📹',
    words: { player: 'houseguest', players: 'houseguests', round: 'Week', exit: 'evicted',
      comp: 'competition', comps: 'competition wins', compBeast: 'comp beast', compWon: 'competitions' },
    // Big Brother is sold on the vote. Strategy is the product rather than the
    // background, a flip is the event of the week, and the steamroll penalty
    // is magnified because "the same six people ran the house all summer" is
    // the defining complaint about THIS show — not about television.
    audience: { strategy: 1.3, blindside: 1.25, steamroll: 1.3, mess: 0.85, showmance: 0.9 },
    careerStats: [
      ['challengeWins', 'totalCompWins'],
      ['bb.hohWins', 'hohWins'],
      ['bb.vetoWins', 'vetoWins'],
      // THE ARENA. Left out, so a career's competition record silently excluded
      // the one comp won while already on the block -- Ireland's three counted
      // for nothing anywhere byShow was read.
      ['bb.blockBusterWins', 'blockBusterWins'],
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
