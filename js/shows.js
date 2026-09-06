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
    prefix: 'td', name: 'Total Drama', short: 'TD', emoji: '🎬', accent: '#7d4cff',
    // Always runnable: this is the engine every other show was grown from.
    runnableFlag: true,
    // The season is decided by a body of eliminated players. Not universal:
    // a castle's last table is a decision by the people still sitting at it,
    // so a "Jury votes" column over one is a heading about a body that never
    // met. Screens ask this rather than assuming.
    hasJury: true,
    // WHERE A LOADED SEASON KEEPS ITS ROUNDS, as a path on `gs`. Declared here
    // because the alternative — `format === 'big-brother' ? gs.bb.weeks :
    // gs.episodeHistory` — is a two-show world, and a third show falls out of
    // its else branch reading an array that is not its own. See seasonRounds().
    roundsPath: 'episodeHistory',
    // What this show calls its people, its rounds and leaving. Every page and
    // prompt that describes a season needs these four words, and hardcoding
    // them is how a Total Drama season came to be told it had houseguests who
    // were nominated. A show states its own vocabulary here.
    // `comp` and friends are here because the finale writes about what a
    // finalist WON, and a Big Brother jury does not sit through challenges or
    // hand out immunity. A juror was saying "three individual immunities" and
    // "challenge beast" about a houseguest's Heads of Household.
    words: { player: 'contestant', players: 'contestants', round: 'Episode', exit: 'voted out',
      // `exit` is what HAPPENED to them; `exitAction` is what the room DID.
      // A ballot column is headed with the act, not the participle, and it
      // was headed "Voted to evict" over a camp on every one of fourteen
      // seasons because the only word the registry had was the participle.
      exitAction: 'eliminate',
      // The late-game boundary not everybody reaches. A career line saying
      // "never made the merge" about a house or a castle names a milestone
      // that show does not contain.
      milestone: 'the merge',
      /* THE NOUNS THIS SHOW'S FANS BUILD A HANDLE OUT OF -- see
         js/social/crowd.js. The word bank there had no format parameter at
         all, so a third of a Traitors season's posts were signed
         `@campfireapologist`, `@bigjury`, `@antitribal32`, and not one of 698
         distinct handles contained a word from the show being watched. */
      fanWords: ['tribal', 'idol', 'merge', 'campfire', 'marshmallow',
        'immunity', 'challenge', 'tribe', 'postmerge'],
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
    /* WHICH NUMBERS A CHARACTER ARTICLE SHOWS, and what each is called.
       js/wiki-view.js chose these with `format === 'big-brother' ? A : B`, so
       every show that is not the house got the CAMP's rows: a Traitors
       article's own profile panel read "Challenge wins 2" and "Idols found"
       about somebody who won missions and carried a Dagger. Declared per show
       so the else branch stops being one particular show. */
    articleStats: {
      career: [['challengeWins', 'Challenge wins']],
      season: [['challengeWins', 'Challenge wins'], ['immunityWins', 'Immunity wins'],
        ['idolsFound', 'Idols found']],
      comps: [['challengeWins', 'Challenge wins'], ['immunityWins', 'Immunity wins'],
        ['rewardWins', 'Reward wins'], ['idolsFound', 'Idols found']],
    },
  },
  'big-brother': {
    prefix: 'bb', name: 'Big Brother', short: 'BB', emoji: '📹', accent: '#38bdf8',
    // Set at the bottom of js/bb-run.js. Read by formatIsRunnable().
    runnableFlag: '_bbRunnable',
    hasJury: true,
    roundsPath: 'bb.weeks',
    words: { player: 'houseguest', players: 'houseguests', round: 'Week', exit: 'evicted',
      exitAction: 'evict',
      milestone: 'jury',
      fanWords: ['veto', 'nomination', 'eviction', 'houseguest', 'block',
        'hoh', 'jury', 'feeds', 'slop', 'havenot'],
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
    articleStats: {
      career: [['hohWins', 'HOH wins'], ['vetoWins', 'Veto wins'],
        ['blockBusterWins', 'Block Buster wins'], ['timesNominated', 'Times nominated']],
      season: [['bb.hohWins', 'HOH wins'], ['bb.vetoWins', 'Veto wins'],
        ['bb.blockBusterWins', 'Block Buster wins'], ['bb.timesNominated', 'Times nominated']],
      comps: [['bb.hohWins', 'HOH wins'], ['bb.vetoWins', 'Veto wins'],
        ['bb.blockBusterWins', 'Block Buster wins'], ['bb.timesNominated', 'Times nominated'],
        ['bb.timesOnBlock', 'Times on the block'], ['bb.timesSaved', 'Saved by the veto']],
    },
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
    prefix: 'tr', name: 'The Traitors', short: 'TR', emoji: '🗡️', accent: '#b91c3c',
    // Set at the bottom of js/tr-run.js. Read by formatIsRunnable().
    runnableFlag: '_trRunnable',
    roundsPath: 'tr.rounds',
    // ── THE BALLOTS THE AUDIENCE NEVER SAW ────────────────────────────
    //
    // The conclave's murder ballots ride on the same `votes[]` as the Round
    // Table's, distinguished only by `channel`. Anything drawn for the public
    // — the archive's events, the feed, a poll — must drop these, or the
    // show's central secret is printed on the page that exists to guess at
    // it. `js/social/adapter.js` already refuses to write a poll that would
    // reveal it; the archive was revealing it anyway, as five nights of
    // "Accusation" events. Declared here so a fourth show with a private
    // ballot names its own channel instead of somebody adding a branch.
    privateBallotChannels: ['murder'],
    words: { player: 'player', players: 'players', round: 'Episode', exit: 'banished',
      exitAction: 'banish',
      // No merge and no jury: the castle's boundary is the last table.
      milestone: 'the final table',
      fanWords: ['banishment', 'murder', 'traitor', 'faithful', 'roundtable',
        'conclave', 'castle', 'shield', 'dagger', 'mission', 'turret'],
      // THE SECOND EXIT VERB, and the first one in the registry. `exit` is the
      // vote, because a vote is what most screens are describing; a murder is
      // not a vote and must never be printed as one. Every screen that names a
      // departure reads the ROUND's own exit channel through `exitVerbs()`
      // below, and falls back to `exit` only where a show has just the one.
      exitMurder: 'murdered',
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
    articleStats: {
      career: [['missionsWon', 'Missions won'], ['shieldsWon', 'Shields won'],
        ['roundsAsTraitor', 'Rounds wearing the cloak']],
      season: [['tr.missionsWon', 'Missions won'], ['tr.shieldsWon', 'Shields won'],
        ['tr.roundsAsTraitor', 'Rounds wearing the cloak']],
      comps: [['tr.missionsWon', 'Missions won'], ['tr.shieldsWon', 'Shields won'],
        ['tr.reads', 'Correct reads'], ['tr.daggersWon', 'Daggers won']],
    },
  },

  // ── DRAG RACE ──────────────────────────────────────────────────────
  //
  // THE FIRST SHOW HERE WITH NO BALLOTS ANYWHERE. A panel ranks the week, the
  // bottom two lip sync, and the host alone decides who leaves — so this
  // show's rounds are a PLACEMENT GRID, not a vote. Three consequences every
  // reader has to know about:
  //
  //   * `eliminated` is null on every round. Every existing reader of that
  //     field means "the vote", and there isn't one. Departures ride on
  //     `exits[]` and are read through roundExits() below.
  //   * The per-round export is a third array (`episodes`), not
  //     `votingHistory` or `weeks`. Borrowing `weeks` would have been worse
  //     than a third shape: season_ref.html decides its ENTIRE layout from
  //     whether that array is non-empty, so a drag season would have been
  //     drawn a Power of Veto column over a runway.
  //   * Two doors out — the lip sync and a disqualification — so `exitVerbs()`
  //     returns two and no screen may print either as the default.
  //
  // Spec: docs/superpowers/specs/2026-09-06-drag-race-design.md
  'drag-race': {
    prefix: 'dr', name: 'Drag Race', short: 'DR', emoji: '👑', accent: '#ff2d95',
    // Set at the bottom of js/dr-run.js. Absent until that file exists, which
    // is deliberate: the setup screen must refuse a show with no engine.
    runnableFlag: '_drRunnable',
    roundsPath: 'dr.episodes',
    words: {
      player: 'queen', players: 'queens', round: 'Episode',
      exit: 'sashayed away', exitAction: 'send home',
      // THE SECOND EXIT VERB. Read through exitVerbs(); never printed as the
      // first. A queen who is disqualified did not lose a lip sync, and saying
      // so is the same bug class as "evicted" over a camp.
      exitDq: 'disqualified',
      challenge: 'maxi challenge', comp: 'maxi challenge', comps: 'maxi challenges won',
      compBeast: 'challenge queen', compWon: 'maxi challenges',
      // No merge and no jury: the season narrows to a finale and stops.
      milestone: 'the finale',
      audienceAward: 'Miss Congeniality',
      fanWords: ['runway', 'lip sync', 'werk room', 'untucked', 'shantay', 'sashay',
        'maxi challenge', 'snatch game', 'main stage', 'condragulations'],
      host: 'RuPaul',
    },
    // PROVISIONAL until a season has been played and the signals printed
    // (ADDING-A-SHOW.md §2.5). The shape's reasoning: this show sells
    // personality and mess, not the arithmetic of a vote — there is no vote to
    // do arithmetic on — so `mess` is the highest multiplier and `strategy`
    // the lowest of any registered show. `steamroll` is punished because "the
    // same three at the top every week" is the complaint about this format.
    audience: { strategy: 0.4, blindside: 0.7, mess: 1.4, predictable: 0.8,
      steamroll: 1.2, showmance: 0.6, twist: 0.9 },
    careerStats: [
      ['dr.wins',         'totalMaxiWins'],
      ['dr.highs',        'totalHighs'],
      ['dr.lows',         'totalLows'],
      ['dr.bottoms',      'totalBottoms'],
      ['dr.lipsyncWins',  'totalLipsyncWins'],
      ['dr.congeniality', 'totalCongeniality'],
    ],
    articleStats: {
      career: [['maxiWins', 'Maxi challenge wins'], ['lipsyncWins', 'Lip syncs won']],
      season: [['dr.wins', 'Maxi challenge wins'], ['dr.lipsyncWins', 'Lip syncs won'],
        ['dr.bottoms', 'Times in the bottom']],
      comps: [['dr.wins', 'Maxi challenge wins'], ['dr.highs', 'Highs'],
        ['dr.lows', 'Lows'], ['dr.bottoms', 'Bottoms']],
    },
    polls: ['Who wins the next maxi challenge?', 'Who lip syncs next week?',
      'Who was robbed this week?', 'Who takes the crown?'],
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
  const own = SHOWS[format]?.words;
  const w = { show: showName(format), ...(SHOWS[DEFAULT_FORMAT].words), ...(own || {}) };
  // THE ONE WORD WHERE ABSENCE IS THE ANSWER. Inheriting the default show's
  // vocabulary is deliberate everywhere else — it is why a registered show can
  // omit `comp` and still get a sensible word instead of "undefined" — but an
  // award is a thing a show either HANDS OUT or does not. A format that omits
  // the field has no such award, and inheriting made every caller announce a
  // Fan Favorite over a castle. So the field is dropped for a registered show
  // that left it out, and callers must handle a missing name by calling
  // nothing. An UNREGISTERED format keeps the fallback, because there the
  // absence means "we do not know this show", not "this show has no award".
  if (own && !('audienceAward' in own)) delete w.audienceAward;
  return w;
}

/**
 * Every way this show has of removing somebody, in the order it uses them.
 *
 * One verb for the shows that have one; The Traitors has two, and any sentence
 * about a departure has to take the one belonging to THAT round rather than
 * the show's default. Returning a list rather than a flag means a screen loops
 * over what the show declares instead of asking whether it is the show with
 * the murder in it.
 */
export function exitVerbs(format) {
  const w = showWords(format);
  // The show's own verbs, in the order it uses them: the ordinary one first,
  // then whatever second door that format declares. A show with none of the
  // extras returns a list of one, which is what two of the four do.
  return [w.exit, w.exitMurder, w.exitDq].filter(Boolean);
}

/**
 * EVERYBODY WHO LEFT ON THIS ROUND, with the verb that removed each of them.
 *
 * ── why this exists ────────────────────────────────────────────────────
 *
 * `js/tr/export.js` writes an `exits[]` on every round precisely because
 * `eliminated` cannot hold two people, and it shipped with two readers. So
 * every OTHER screen — the wiki grid, the season page, the archive's
 * still-in count — went on asking `row.eliminated === name` and a Traitors
 * season rendered with half its cast never leaving: a murdered player's
 * article read "3 episodes played · never had a vote cast against them", and
 * a finale night with two people alive counted eleven.
 *
 * Patching the readers one at a time is how the same bug comes back on the
 * sixth screen nobody rendered. This is the rule instead: ask this, never the
 * field. A round that carries `exits[]` is believed; a round from a
 * one-door show is normalised into the same shape from `evicted`/
 * `eliminated`, with the show's own verb, so a caller writes ONE loop.
 *
 * Shape per entry: `{ name, slug, verb, channel }`. `channel` is the door
 * they left by — `banishment` for a vote of the room, `murder` for the thing
 * the room did not vote on. On a one-door show it is `vote`, which is what
 * every existing screen has always been describing.
 */
export function roundExits(round, format) {
  if (!round) return [];
  const slug = n => String(n).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const given = Array.isArray(round.exits) ? round.exits.filter(x => x && x.name) : [];
  if (given.length) {
    return given.map(x => ({
      name: x.name,
      slug: x.slug || slug(x.name),
      verb: x.verb || showWords(format).exit,
      channel: x.channel || 'vote',
    }));
  }
  // A round with no `exits[]` is a round from a show with one door out. It
  // still gets the same shape, so nothing downstream has to know which kind
  // of round it is holding.
  const gone = round.evicted || round.eliminated || null;
  if (!gone) return [];
  return [{ name: gone, slug: round.evictedSlug || round.eliminatedSlug || slug(gone),
    verb: showWords(format).exit, channel: 'vote' }];
}

/**
 * The ballots of this round that the AUDIENCE SAW.
 *
 * A show can have more than one ballot in a night and not show them all. The
 * registry names the private channels; everything else, including a ballot
 * with no channel at all, is public — because the two shows that have only
 * ever had one ballot never wrote the field, and a screen must not have to
 * know which kind of show it is reading.
 *
 * Any screen drawn for the public — the archive's events, the feed, a poll —
 * reads THIS, never `round.votes` directly.
 */
export function publicBallots(round, format) {
  const all = Array.isArray(round?.votes) ? round.votes : [];
  const secret = new Set(SHOWS[format]?.privateBallotChannels || []);
  if (!secret.size) return all;
  return all.filter(b => !b?.channel || !secret.has(b.channel));
}

/** Did `name` leave on this round, by any door the show has? */
export function exitedOn(round, name, format) {
  const want = String(name || '').trim().toLowerCase();
  if (!want) return false;
  const wantSlug = want.replace(/[^a-z0-9]+/g, '-');
  return roundExits(round, format).some(x =>
    String(x.name).trim().toLowerCase() === want || x.slug === wantSlug);
}

/**
 * The loaded season's rounds, from whichever field this show keeps them in.
 *
 * Reads `roundsPath` off the registry rather than branching: a show that
 * forgets to declare one gets the default show's field, which is the
 * bare-integer rule applied to state, and NOT another show's array.
 */
export function seasonRounds(gs, format) {
  const path = SHOWS[format]?.roundsPath || SHOWS[DEFAULT_FORMAT].roundsPath;
  const list = path.split('.').reduce((o, k) => (o == null ? o : o[k]), gs);
  return Array.isArray(list) ? list : [];
}

export function showName(format) {
  return SHOWS[format]?.name || SHOWS[DEFAULT_FORMAT].name;
}

// Identity accessors. These exist so that no screen has to hold its own copy of
// the show list. Eight files did, none of them errored, and every one was a
// place a third show would have been drawn as Total Drama.
//
// Unknown formats return a neutral value rather than falling back to the
// default show: being told nothing is recoverable, being told the wrong show is
// not. formatPrefix() above is the deliberate exception and keeps its Total
// Drama fallback, because for a PREFIX an absent format really is Total Drama —
// that is the bare-integer rule the whole site depends on.
export function showShort(fmt)  { return SHOWS[fmt]?.short  || ''; }
export function showIcon(fmt)   { return SHOWS[fmt]?.emoji  || ''; }
export function showAccent(fmt) { return SHOWS[fmt]?.accent || 'var(--accent)'; }

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
