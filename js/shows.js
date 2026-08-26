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
      comp: 'challenge', comps: 'immunity wins', compBeast: 'challenge beast', compWon: 'immunities',
      // What this show calls the prize nobody in the game votes on. The
      // measure behind it is shared (js/audience.js) and show-agnostic; only
      // the name is a show's own.
      audienceAward: 'Fan Favorite' },
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
      comp: 'competition', comps: 'competition wins', compBeast: 'comp beast', compWon: 'competitions',
      audienceAward: "America's Favourite Houseguest" },
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
  // ── The Traitors ────────────────────────────────────────────────────
  // An all-alumni social deduction format. Two things about it break
  // assumptions the other two shows never tested:
  //
  // 1. It has TWO exit verbs. `words.exit` is 'banished' because that is the
  //    vote, and a vote is what most screens are describing. But a murder is
  //    not a banishment, and any sentence about a departure must read the
  //    round's own exit channel rather than this default. Printing "banished"
  //    over a murder is the same bug as "evicted" over a camp.
  // 2. Every player has franchise history and NOBODY is returning to this
  //    show — the two things `isReturnee` has safely meant at once for fifteen
  //    seasons. `historyFromLedger` below is that split.
  'traitors': {
    prefix: 'tr', name: 'The Traitors', short: 'TR', emoji: '🗡️',
    words: { player: 'player', players: 'players', round: 'Episode', exit: 'banished',
      comp: 'mission', comps: 'missions won', compBeast: 'mission asset',
      compWon: 'missions' },
      // audienceAward is deliberately absent: the format has no in-show award
      // and the manual says a show without one leaves the field out and calls
      // nothing. Inventing a name would be worse than having none.

    // Reputation and grudges come from the appearance ledger rather than from
    // the per-season Returning checkbox. On the other two shows those coincide,
    // because a returnee is the only person with history worth carrying. Here
    // every player has history, so the checkbox would have to be ticked twenty
    // times a season to enable a system that already knows the answer — and the
    // day one is missed, that player walks in with no reputation and nothing
    // reports it. Read by buildFranchiseMeta().
    historyFromLedger: true,

    // PROVISIONAL. tests/ratings.test.js requires an overlay at registration and
    // requires it to differ from every other show's, so this cannot wait for the
    // ratings pass — but it has not been measured against a played season yet
    // and must be recalibrated there.
    //
    // The reasoning behind the shape: this show sells the betrayal, not the
    // arithmetic that produced it. A banishment that lands on a Traitor is the
    // event of the week, so `blindside` is the highest multiplier on the board.
    // `predictable` is punished hard because a season where the Faithfuls are
    // simply right every week has no show in it. Romance exists but is not what
    // anybody tuned in for.
    audience: { strategy: 1.15, blindside: 1.4, mess: 1.1, predictable: 0.6,
      steamroll: 1.1, showmance: 0.85 },

    // roundsAsTraitor rather than seasonsAsTraitor: recruitment means the role
    // is not a season-level property of a person.
    careerStats: [
      ['tr.missionsWon',     'totalMissionsWon'],
      ['tr.shieldsWon',      'totalShieldsWon'],
      ['tr.roundsAsTraitor', 'totalRoundsAsTraitor'],
      ['tr.timesRecruited',  'totalTimesRecruited'],
      ['tr.timesMurdered',   'totalTimesMurdered'],
      ['tr.timesBanished',   'totalTimesBanished'],
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
