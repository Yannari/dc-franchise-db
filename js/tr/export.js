// ══════════════════════════════════════════════════════════════════════
// tr/export.js — a finished season, in the shape the rest of the site reads
// ══════════════════════════════════════════════════════════════════════
//
// THE PER-ROUND SHAPE, AND WHY IT IS NOT A THIRD ONE (spec §10.1).
//
// Total Drama exports `votingHistory[]`, Big Brother exports `weeks[]`, and
// `roundLedger()` in js/wiki-fill.js normalises both — as does the season
// page's Wiki tab, separately, and the voting grid on top of that. A third
// shape means editing every one of them, and docs/ADDING-A-SHOW.md §5 says so
// in as many words: reuse one of the two if you possibly can.
//
// So a Traitors round is ONE `votingHistory[]`-shaped record carrying TWO
// ballot sets — the public banishment everybody votes in, and the private
// murder only the Traitors vote in — distinguished by a `channel` field on
// each ballot. A reader that wants the public vote filters on the channel; a
// reader that does not know about channels sees a votingHistory row with
// votes and somebody leaving at the end of it, which is exactly what it is.
//
// This is also true to the fiction. The conclave IS a vote: every living
// Traitor argues for a target (js/tr/murder.js `runConclave`), the argument is
// resolved on social weight, and the loser's preference is on the record as a
// ballot that lost. Modelling the murder as anything other than a ballot would
// have been modelling it as less than it is.
//
// TWO EXIT VERBS, AND THE GUARD THAT HAS TO SEE BOTH. Every other show in the
// registry has exactly one way of leaving, and every sentence generator in the
// repo reads `words.exit` for it. Here a round produces a BANISHED player and
// a MURDERED one, and printing "banished" over a murder is precisely the bug
// class tests/show-vocabulary.test.js exists for — one show's word over
// another show's departure, one clause further in. So each row carries an
// `exits[]` list whose verbs come from the registry (`exitVerbs`), never from
// a literal here, and `roundLedger()` renders that list rather than guessing.
import { SHOWS, seasonId, formatPrefix, exitVerbs } from '../shows.js';
// THE BELIEF SNAPSHOT'S READERS, AND EVERY ONE OF THEM IS A READER. See the
// section at the foot of this file: `learn` and `recordFact` are deliberately
// absent, so nothing in the export layer can become a fourth alignment writer.
import { believes, ALIGNMENT_CRED_CEILING } from '../knowledge.js';
import { suspicion, knowsAlignmentOf } from './deduction.js';
import { alignmentFactId, alignmentAt } from './roles.js';

export const TRAITORS_FORMAT = 'traitors';

/** The slug rule the rest of the export layer uses, character for character. */
function _slug(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Keys ──────────────────────────────────────────────────────────────
//
// EVERY ONE OF THESE IS DERIVED FROM THE REGISTRY'S PREFIX, never written as
// the literal `tr`. The bare-integer rule means an unprefixed key is Total
// Drama permanently, so a Traitors key that forgets its prefix does not fail —
// it lands on top of a Total Drama season and takes its place.

/** `data/seasons/tr-1-data.json` — the published season document. */
export function seasonFilePath(seasonNumber) {
  return `data/seasons/${seasonId(TRAITORS_FORMAT, seasonNumber)}-data.json`;
}

/** `tr_episode_s1_e1` — one written episode. Mirrors js/episode-store.js. */
export function episodeStoreKey(seasonNumber, episode) {
  return `${formatPrefix(TRAITORS_FORMAT)}_episode_s${Number(seasonNumber) || 1}_e${Number(episode) || 1}`;
}

/**
 * `AI_ANALYTICS_tr-1` — the analytics bundle for a season.
 *
 * The canonical builder for this key is `_sKey` inside current-season.html,
 * which is a page script and cannot be imported. Derived from `seasonId` here
 * so the two agree by construction rather than by somebody remembering; the
 * test pins the exact string against both.
 */
export function analyticsKey(seasonNumber) {
  return `AI_ANALYTICS_${seasonId(TRAITORS_FORMAT, seasonNumber)}`;
}

// ── The rounds ────────────────────────────────────────────────────────

function _exit(name, verb, channel) {
  return name ? { name, slug: _slug(name), verb, channel } : null;
}

function _ballot(b, channel) {
  return {
    voter: b.voter, voterSlug: _slug(b.voter),
    target: b.voted || null, targetSlug: b.voted ? _slug(b.voted) : '',
    channel: b.channel || channel,
  };
}

/**
 * One round's ballots, both sets, in one array.
 *
 * The banishment set comes off the round record exactly as the table cast it,
 * revotes included — a revote is the same banishment still being decided, and
 * it carries its own `banishment-revote` channel so a reader can tell the two
 * apart without them becoming two rounds.
 *
 * The murder set comes off `murderBallots`, which js/tr/headless.js writes from
 * the conclave's own `argued` list. It is READ, never recomputed: re-deriving
 * who wanted whom dead from the victim would produce a unanimous conclave every
 * night and erase the entire mechanism — the overruled Traitor's ballot is the
 * one that matters most, and it is the one a recomputation cannot see.
 *
 * EXPORTED, because js/tr/headless.js now writes the same array onto the
 * episode record for the Round Table screen to draw. Two derivations of "which
 * ballots did this round hold" is precisely the shape that lets one of them
 * quietly stop carrying the murder channel -- at which point `publicBallots()`
 * has nothing left to filter and every guard built on it passes for free.
 */
export function traitorsRoundBallots(round) {
  const out = [];
  for (const b of round.ballots || []) out.push(_ballot(b, 'banishment'));
  for (const rv of round.revotes || []) {
    for (const b of rv.ballots || []) out.push(_ballot(b, 'banishment-revote'));
  }
  for (const b of round.murderBallots || []) out.push(_ballot(b, 'murder'));
  return out;
}

/**
 * The season's rounds, as `votingHistory[]`.
 *
 * Built from BOTH of what `playTraitorsSeason` hands back, because neither
 * alone is the season: `rounds` carries the ballots but starts at episode two
 * (night one has no Round Table, so it writes no round record), and `log`
 * carries every episode including the first murder. They are joined on the
 * episode number rather than by position, and the endgame's tables — which are
 * Round Tables in every respect except the reveal — are appended from
 * `endgame.rounds`.
 */
export function traitorsVotingHistory(season = {}) {
  const [banishVerb, murderVerb] = exitVerbs(TRAITORS_FORMAT);
  // ── ONE ROW PER EPISODE, AND THE FINALE HAS TWO TABLES IN IT ────────
  //
  // This was a Map keyed on `ep` with the endgame's rounds written into it
  // SECOND, so an endgame table sharing an episode with a mandated one simply
  // OVERWROTE it. Invisible while the endgame lived on a finale row of its
  // own; a silent data loss the moment it moved onto the episode whose Round
  // Table handed over to it. The mandated banishment disappeared from the
  // history and `_departures` placed nineteen of twenty players.
  //
  // One row per episode is a contract this file is tested on, so the fix is
  // not to split them. The MANDATED table is the episode's round — it is the
  // one whose ballots `votes` should report and whose banishment `eliminated`
  // means — and the endgame's banishments ride along in `exits[]`, in the
  // order they happened, so nobody is lost and nothing is double-counted.
  const mandated = new Map();
  const endgameByEp = new Map();
  for (const r of season.rounds || []) if (!mandated.has(r.ep)) mandated.set(r.ep, r);
  for (const r of (season.endgame?.rounds || [])) {
    if (!endgameByEp.has(r.ep)) endgameByEp.set(r.ep, []);
    endgameByEp.get(r.ep).push(r);
    // An endgame that ran on an episode of its own still needs a row.
    if (!mandated.has(r.ep)) mandated.set(r.ep, r);
  }
  // Night one lives only on the log — there is no round record for a night
  // with no table — so the log is what decides which episodes exist at all.
  const eps = new Set([...(season.log || []).map(l => l.ep), ...mandated.keys()]);

  return [...eps].sort((a, b) => a - b).map(ep => {
    const round = mandated.get(ep) || {};
    const logged = (season.log || []).find(l => l.ep === ep) || {};
    const banished = round.banished ?? logged.banished ?? null;
    const murdered = round.murdered ?? logged.murdered ?? null;
    const second = round.secondVictim ?? logged.secondVictim ?? null;
    // A refused ultimatum is a body and not a murder — see offerRecruitment.
    // It leaves by the same door the murdered do, so it is reported with the
    // murder verb rather than invented a third one nothing else knows.
    const executed = round.executed ?? logged.executed ?? null;

    // THE ENDGAME'S OWN TABLES, on the episode that handed over to them. The
    // mandated banishment goes out first because it happened first; then each
    // endgame table in the order it sat. `round` is the mandated one, so a
    // banishment already reported above is not repeated here.
    const endgameExits = (endgameByEp.get(ep) || [])
      .filter(r => r !== round && r.banished)
      .map(r => _exit(r.banished, banishVerb, 'banishment'))
      .filter(Boolean);
    const exits = [
      _exit(banished, banishVerb, 'banishment'),
      ...endgameExits,
      _exit(murdered, murderVerb, 'murder'),
      _exit(second, murderVerb, 'murder'),
      _exit(executed, murderVerb, 'murder'),
    ].filter(Boolean);

    return {
      episode: ep,
      // `eliminated` is the BANISHMENT and only the banishment: it is the
      // field every existing votingHistory reader treats as "who the vote
      // removed", and a murder is not a vote the room cast. The murdered are
      // on `exits[]` and on `murdered`, where a reader has to have meant it.
      eliminated: banished,
      eliminatedSlug: banished ? _slug(banished) : '',
      murdered,
      murderedSlug: murdered ? _slug(murdered) : '',
      banishedWasTraitor: round.banishedWasTraitor ?? logged.wasTraitor ?? null,
      // The night the Traitors struck and a Shield held. Nobody left, so it is
      // not an exit — but the ballots were cast and the room saw the attempt.
      murderBlocked: !!(logged.blocked && !murdered),
      endgame: !!round.endgame,
      exits,
      votes: traitorsRoundBallots(round),
    };
  });
}

// ── Placements ────────────────────────────────────────────────────────

/**
 * Who left, in the order they left, worst placement first.
 *
 * Order inside a round is the order of the day: the table banishes in the
 * evening and the conclave kills at night, so the banished player's game ended
 * first and finishes below the person murdered the same night.
 */
function _departures(history) {
  const out = [];
  for (const row of history) {
    for (const x of row.exits) out.push({ ...x, episode: row.episode });
  }
  return out;
}

/**
 * `placements[]`, in the shape docs/ADDING-A-SHOW.md §5 requires.
 *
 * CO-WINNERS ARE THE NORMAL CASE HERE and the shape says so: every taker holds
 * `placement: 1` with `status: 'Winner'`, and the survivors who took nothing
 * share the next ordinal. Resolving what every downstream reader does with a
 * one-to-four-way tie is its own task; this is the record it has to read.
 */
export function traitorsPlacements(season = {}, history = traitorsVotingHistory(season)) {
  const takers = season.endgame?.takers || [];
  const losers = season.endgame?.losers || [];
  const out = [];

  // The show's own numbers, ON THE PLACEMENT, because that is where the two
  // existing shows put theirs and where the ranking board looks. See
  // `traitorsBoardStats`.
  const stats = name => traitorsBoardStats(season, name, history);

  for (const name of takers) {
    out.push({ name, playerSlug: _slug(name), placement: 1, status: 'Winner',
      exit: null, exitEpisode: null, tr: stats(name) });
  }
  const loserPlace = takers.length + 1;
  for (const name of losers) {
    out.push({ name, playerSlug: _slug(name), placement: loserPlace, status: 'Runner-up',
      exit: null, exitEpisode: null, tr: stats(name) });
  }

  // Everybody else, best-placed last out. `_departures` is in the order the
  // castle emptied, so walking it backwards is the standings from the top.
  let place = takers.length + losers.length + 1;
  for (const d of _departures(history).reverse()) {
    out.push({
      name: d.name, playerSlug: d.slug, placement: place++,
      // "Banished"/"Murdered" — capitalised from the show's own verb rather
      // than written out here, so a screen printing the status prints the
      // show's word for it.
      status: d.verb.charAt(0).toUpperCase() + d.verb.slice(1),
      exit: d.verb, exitEpisode: d.episode,
      tr: stats(d.name),
    });
  }
  return out.sort((a, b) => a.placement - b.placement);
}

// ── Career stats ──────────────────────────────────────────────────────

/**
 * The six `tr.*` figures the registry's `careerStats` reads off an appearance.
 *
 * Counted from the season record, never re-simulated: `roundsAsTraitor` in
 * particular is a fact about the role history — recruitment means the role is
 * not a season-level property of a person, so a player can be a Faithful for
 * five rounds and a Traitor for three, and the only place that is written down
 * is `roleHistory`.
 */
export function traitorsCareerStats(season = {}, name) {
  const history = traitorsVotingHistory(season);
  // `roleHistory` entries are `{ name, from, to, ep, via }` — a flip, not a
  // state — so an era runs from one entry to the next.
  const flips = (season.roleHistory || []).filter(r => r.name === name)
    .sort((a, b) => a.ep - b.ep);
  const lastEp = history.length ? Math.max(...history.map(r => r.episode)) : 0;
  /* ── AN ERA ENDS WHEN THEY LEAVE, NOT WHEN THE SEASON DOES ──────────
     The open era ran to the last episode of the SEASON, so somebody who took
     the cloak on night one and was banished in episode two was credited with
     ten rounds wearing it. Nobody read the field until the character article
     started drawing it, at which point it said so on the page. Their own exit
     closes the era; a survivor's runs to the end. */
  const myExit = history.find(r => (r.exits || []).some(x => x.name === name))?.episode;
  const gone = myExit == null ? lastEp + 1 : myExit;
  let roundsAsTraitor = 0;
  for (let i = 0; i < flips.length; i++) {
    if (flips[i].to !== 'traitor') continue;
    const until = Math.min(flips[i + 1]?.ep ?? lastEp + 1, gone);
    roundsAsTraitor += Math.max(0, until - flips[i].ep);
  }

  const exitsOf = verb => history.reduce((n, row) =>
    n + row.exits.filter(x => x.name === name && x.verb === verb).length, 0);
  const [banishVerb, murderVerb] = exitVerbs(TRAITORS_FORMAT);

  return {
    // `bestTeam` is recorded by the mission itself (js/tr/missions.js) rather
    // than re-derived from `teams[].perf` here — two copies of the tie rule
    // drift the first time either moves.
    missionsWon: (season.missions || []).filter(m =>
      (m.teams || []).some(t => t.name === m.bestTeam && (t.members || []).includes(name))).length,
    shieldsWon: (season.shields || []).filter(s => s.holder === name).length,
    roundsAsTraitor,
    // Recruited, not selected: every player's first flip is at episode one via
    // `selection`, and counting those would report the whole cast as recruits.
    timesRecruited: flips.filter(f => f.to === 'traitor'
      && (f.via === 'recruitment' || f.via === 'ultimatum')).length,
    timesMurdered: exitsOf(murderVerb),
    timesBanished: exitsOf(banishVerb),
  };
}

/**
 * The figures a RANKING BOARD reads off one appearance.
 *
 * The other two shows put their scoring numbers on the placement itself —
 * Total Drama writes `immunityWins`/`rewardWins`, Big Brother writes a `bb`
 * block with `hohWins`, `vetoWins`, `blockBusterWins`, `timesOnBlock` — and
 * js/rankings-update.js reads them there. A show that writes none of them does
 * not fail: every column loads as zero and the board comes out ranked on
 * PLACEMENT ALONE, which is what happened to Big Brother for a whole season
 * and reads exactly like a working board. So this exists, and the placement
 * carries it.
 *
 * Two of these are not career stats and are here rather than in
 * `traitorsCareerStats` because nothing else asks for them:
 *
 *   `reads`  — banishment ballots you cast that landed on a real Traitor. The
 *              game, scored. Measured at -0.635 against final placement.
 *   `wanted` — murder ballots that named YOU. Every night a Traitor stood in
 *              the turret and argued for your name. Measured at +0.014
 *              against final placement over 4,000 player-seasons: the only
 *              number this show produces that is not a restatement of how
 *              long somebody lasted. See the `traitors` rubric in
 *              js/rankings-update.js for why the board leans on it.
 *
 * The Dagger lifecycle is `won -> played | lost`, and `lost` — the holder left
 * the castle still carrying it — is the commonest ending it has. There is no
 * WASTED state: a Dagger cannot be spent to no effect, because it is only
 * spendable at a table where it changes the count.
 */
export function traitorsBoardStats(season = {}, name, history = traitorsVotingHistory(season)) {
  let reads = 0;
  let wanted = 0;
  for (const row of history) {
    for (const v of row.votes) {
      if (v.channel === 'murder') { if (v.target === name) wanted++; continue; }
      // A read is only a read if the table ACTED on it and the body was a
      // Traitor. `banishedWasTraitor` is read off the round as the engine
      // wrote it -- re-deriving alignment at season end is this project's
      // most expensive recurring mistake, because alignment has eras.
      if (v.voter === name && v.target && v.target === row.eliminated
          && row.banishedWasTraitor) reads++;
    }
  }
  const mine = (season.daggers || []).filter(d => d.holder === name);
  return {
    ...traitorsCareerStats(season, name),
    reads,
    wanted,
    daggersWon: mine.length,
    daggersPlayed: mine.filter(d => d.outcome === 'played').length,
    daggersWasted: 0,
    daggersHeld: mine.filter(d => d.outcome !== 'played').length,
  };
}

/**
 * One appearance, for `players_database.json`.
 *
 * `format` IS THE POINT OF THIS FUNCTION. An appearance with no format is
 * Total Drama — that is the bare-integer rule applied to a career — so a
 * Traitors appearance that forgets to say so joins the Total Drama career of
 * whoever shares its slug, silently, and shows up in their challenge totals.
 * `_tagSeasonDetail` in js/stats-export.js stamps it on the way in; this
 * stamps it at the source so a detail is never correct only by the grace of
 * having gone through that one function.
 */
export function traitorsSeasonDetails(season = {}, seasonNumber = 1) {
  const history = traitorsVotingHistory(season);
  const backgrounds = season.backgrounds || {};
  return traitorsPlacements(season, history).map(p => ({
    season: Number(seasonNumber),
    format: TRAITORS_FORMAT,
    seasonId: seasonId(TRAITORS_FORMAT, seasonNumber),
    name: p.name,
    playerSlug: p.playerSlug,
    placement: p.placement,
    status: p.status,
    // The number of ballots cast against them across the season, both channels
    // — being wanted dead by the turret is a fact about a game as much as
    // being voted for at the table is.
    votesReceived: history.reduce((n, row) =>
      n + row.votes.filter(v => v.target === p.name && v.channel !== 'murder').length, 0),
    // ALUMNI / CELEBRITY / CIVILIAN, from the snapshot the season took at
    // setup — never re-resolved here. This layer is read on replay, long after
    // the database it was resolved from has been edited, and re-deriving it
    // would let a later correction rewrite what the premiere said.
    // `null` for a season that predates the field, which is honest: it is not
    // that nobody was an alumnus, it is that nobody wrote it down.
    backgroundType: backgrounds[p.name]?.type || null,
    background: backgrounds[p.name] || null,
    tr: p.tr || traitorsCareerStats(season, p.name),
  }));
}

// ── The document ──────────────────────────────────────────────────────

/**
 * The published season document.
 *
 * `winner{}` is populated ONLY when the season genuinely produced one, which
 * on this format means a lone surviving Traitor. A four-way split has no
 * runner-up and no ordinal between the takers, so `winners[]` is the honest
 * field and picking a "main" winner out of it would be inventing a fact.
 */
export function buildTraitorsSeasonDocument(season = {}, { seasonNumber = 1, twists = [] } = {}) {
  const history = traitorsVotingHistory(season);
  const placements = traitorsPlacements(season, history);
  const takers = season.endgame?.takers || [];

  const winners = takers.map(name => ({
    name, playerSlug: _slug(name), share: season.endgame?.share ?? null,
  }));

  return {
    seasonNumber: Number(seasonNumber),
    format: TRAITORS_FORMAT,
    seasonId: seasonId(TRAITORS_FORMAT, seasonNumber),
    title: '[AI_FILL]',
    subtitle: '[AI_FILL]',
    castSize: placements.length,
    episodeCount: history.length,
    // The side that ended up with the money, which is the fact this format
    // reports instead of a jury tally.
    endgameWinner: season.endgame?.winner || season.winner || null,
    pot: season.pot ?? null,
    winners,
    // How the castle emptied, in the show's own words. NOT `winner.vote`:
    // that field is a TALLY, quoted by the wiki lead and pattern-matched by
    // js/social/feed.js, which reads two numbers in it as a jury having voted.
    // The prose line carries the pot — "all of it to Bowie" holds 72,233 — so
    // putting it there had the feed announcing a jury verdict on a show that
    // has no jury, which is this project's oldest bug wearing a new hat.
    // There IS no tally at the end of a Traitors season: the last table is a
    // banishment like every other, and what follows is a decision, not a vote.
    endgameLine: season.endgame?.line || '',
    winner: winners.length === 1
      ? { ...winners[0], vote: '',
          // The people who were at the final table and took nothing. They are
          // `placement: 2` with status Runner-up two fields down; naming them
          // here is the same fact, in the field the champion cards read.
          runnerUp: (season.endgame?.losers || []).join(' & ') || null,
          keyStats: '[AI_FILL]', strategy: '[AI_FILL]', legacy: '[AI_FILL]' }
      : null,
    placements,
    votingHistory: history,
    twists: Array.isArray(twists) ? twists : [],
    seasonNarrative: '[AI_FILL]',
    awards: '[AI_FILL]',
    emoji: SHOWS[TRAITORS_FORMAT].emoji,
    // What the show calls a departure, carried on the document so a reader
    // that has the record but not the registry still uses the right verb.
    exitVerbs: exitVerbs(TRAITORS_FORMAT),
    // Who walked in, and what the room already knew about each of them. The
    // SNAPSHOT, published verbatim: an alumnus's appearances are the ones that
    // were on the record the night the season was cast, not the ones on it now.
    backgrounds: season.backgrounds || {},
  };
}

// ── What the castle believes ──────────────────────────────────────────
//
// THE ONE FUNCTION IN THIS FILE THAT READS LIVE STATE, AND IT HAS TO.
//
// Everything above is pure over a finished `season` object. This is not, and
// the reason is the thing it reports: a belief is not on the season object and
// never can be. `gs.knowledge` is an OVERWRITING store — `learn()` keeps the
// strongest evidence seen and drops the rest — so a reader that walked the
// store after the credits would be reading the survivors of an overwriting
// process and calling it "what the castle believed". The only honest place to
// ask what a room believed on a given night is ON THAT NIGHT, so this is a
// SNAPSHOT, taken once per round by js/tr/headless.js and written onto the
// episode record — which is what `js/vp-tr/` means by "read it through the
// export": a screen is handed a record and cannot reach past it.
//
// IT READS AND IT NEVER WRITES. `learn` and `recordFact` are not imported here
// and must never be: the credibility ceiling is a closed set of write sites —
// three `public` alignment writers (the turret, a recruit shown the turret, the
// banishment reveal) and exactly one `observed` (the Seer) — swept over the
// WRITES in tests/tr-missions.test.js. A reporting layer that could write would
// be a fourth writer with no price on it.
//
// AND IT INVENTS NO PRECISION. Every number below comes out of the model as the
// model holds it: `effectiveConfidence` after decay, the `sourceType` tier the
// belief actually arrived on, the `valence` the read roll landed on, and
// `suspicion()` — which is that confidence AFTER bondResistance, i.e. what the
// belief is worth to that person at a ballot, and the reason a well-liked
// Traitor survives a table the evidence should have lost them. `ceiling` is
// read off js/knowledge.js rather than retyped, because a hand-copied 0.62 is
// a channel that silently reprices itself the day the ceiling moves.

/**
 * One person's read of the room, as the model holds it tonight.
 *
 * Living candidates only. A `public` belief about somebody who has already been
 * banished is certainty about a chair, and this board is about the people still
 * in it — `suspicionBoard()` walks the living for the same reason.
 *
 * A ZERO-SCORE ROW IS KEPT AND IT IS NOT NOISE. `suspicion()` returns 0 for a
 * belief the observer has correctly identified as false, which is the intuition
 * prior in js/tr/deduction.js clearing an innocent — about a third of all the
 * suspicion ever aimed at a Faithful is deleted for the sole reason that they
 * are one. Dropping those rows would report a room that had never considered
 * the people it had considered and cleared.
 */
function _readOf(observer, candidates, ep) {
  const rows = [];
  for (const name of candidates) {
    if (name === observer) continue;
    const b = believes(observer, alignmentFactId(name), ep);
    if (!b) continue;
    rows.push({
      name,
      // What it is worth at the ballot: confidence through bondResistance.
      score: _r3(suspicion(observer, name, ep)),
      // What the belief itself is worth, before the relationship blunts it.
      confidence: _r3(b.effectiveConfidence || 0),
      sourceType: b.sourceType || null,
      valence: b.valence || null,
      // WHY THEY THINK IT, in the engine's own words — `learn()`'s `source` is
      // a sentence the evidence layer wrote ("never once voted against Amy",
      // "the reveal", "kept X in on the night X was revealed"), and a suspicion
      // without its reason is a number a screen would have to invent a story
      // for.
      why: b.source || null,
      // THE FULL CASE, not just the winning line. `why` is the single strongest
      // reason; `clues` is the top few DISTINCT reasons behind this read, so the
      // screen can show that a suspicion was built out of several things across
      // the season rather than one event. Falls back to the single source for a
      // belief formed before the history existed (an older save).
      clues: Array.isArray(b.clues) && b.clues.length
        ? b.clues.slice(0, 3).map(c => ({
          source: c.source,
          sourceType: c.sourceType || null,
          confidence: _r3(c.confidence || 0),
          ep: c.ep == null ? null : c.ep,
        }))
        : (b.source ? [{ source: b.source, sourceType: b.sourceType || null,
          confidence: _r3(b.effectiveConfidence || 0),
          ep: b.learnedEp == null ? null : b.learnedEp }] : []),
      learnedEp: b.learnedEp == null ? null : b.learnedEp,
      // Certainty, and there are only ever two ways to hold it about an
      // alignment: you were in the turret, or you watched somebody's cloak come
      // off at a banishment. `knowsAlignmentOf` discriminates on `public`,
      // which is the closed set.
      certain: !!knowsAlignmentOf(observer, name, ep),
    });
  }
  return rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

const _r3 = n => Math.round((Number(n) || 0) * 1000) / 1000;

/**
 * WHAT EACH PERSON BELIEVES, WHAT THE FAITHFULS BELIEVE TOGETHER, AND WHAT IS
 * TRUE — spec §9.1's three layers, in one record, deliberately.
 *
 * The screen's whole subject is the DISTANCE between the second and the third,
 * and a shape that held them apart would leave the screen joining them itself.
 *
 *   `boards`  — layer one, per observer. Every living player's own read.
 *   `castle`  — layer two, and it is the FAITHFULS' read and not the room's.
 *               Pooling the Traitors in would average certainty together with
 *               guesswork and report a castle that half-knows the answer; the
 *               people doing the deducing are the people who do not know, and
 *               theirs is the only collective read that is a question. (The
 *               same trap Plan 7 measured on the crowd ledgers: a pooled figure
 *               across two factions accruing on opposite slopes says less than
 *               either half of it.)
 *   `truth`   — layer three. AUDIENCE ONLY. It is on the record because the
 *               audience layer is entitled to it and the record is the only
 *               place a screen can get anything; js/vp-tr/suspicion.js drops it
 *               before a `player:` observer's screen is built, exactly as
 *               js/vp-tr/round-table.js drops `table.truth`.
 *
 * `flips` IS THE ERA RULE, CARRIED. Recruitment mutates ground truth mid-season,
 * so a read formed in episode three was CORRECT when it was formed even if
 * tonight's truth disagrees. Never recompute alignment at season end — three
 * tasks in this plan have hit that trap. Each snapshot is taken on its own
 * night, so `truth` here is that night's era BY CONSTRUCTION, and the flips so
 * far are listed so a screen can say a read was right when it was made.
 *
 * NOT WRITTEN ON AN ENDGAME ROW, and the caller is where that is enforced. The
 * endgame reveals nothing (spec §8) and `_tableRecord` already withholds
 * `truth` there; a belief block carrying every survivor's alignment would hand
 * the last table exactly what the format spends it refusing to say.
 */
export function traitorsBeliefSnapshot(ep, { living = [], faithfuls = [], flips = [] } = {}) {
  const candidates = [...living];
  const boards = [];
  for (const observer of candidates) {
    const entries = _readOf(observer, candidates, ep);
    if (entries.length) boards.push({ observer, entries });
  }

  // THE COLLECTIVE. Counted over the Faithfuls' boards only, and a name's
  // weight is the SUM of what it is worth to each of them at the ballot —
  // which is the quantity the table actually resolves. A mean would report two
  // people certain and sixteen indifferent as a mild consensus, and a mild
  // consensus is not what banishes anybody.
  const agg = new Map();
  for (const b of boards) {
    if (faithfuls.indexOf(b.observer) < 0) continue;
    for (const e of b.entries) {
      const row = agg.get(e.name)
        || { name: e.name, accusers: 0, weight: 0, top: 0, cleared: 0 };
      if (e.score > 0) { row.accusers++; row.weight += e.score; row.top = Math.max(row.top, e.score); }
      else row.cleared++;
      agg.set(e.name, row);
    }
  }
  const castle = [...agg.values()]
    .map(r => ({ ...r, weight: _r3(r.weight), top: _r3(r.top) }))
    .sort((a, b) => b.weight - a.weight || b.accusers - a.accusers
      || a.name.localeCompare(b.name));

  const truth = {};
  for (const n of candidates) truth[n] = alignmentAt(n, ep);

  return {
    ep,
    // THE MOST AN INFERENCE IS EVER WORTH IN THIS FORMAT, read from the module
    // that decides it. The screen draws it as a wall, because that is what it
    // is: no Faithful can reach certainty about anybody, ever, and everything
    // past the wall got there by standing in a room with somebody.
    ceiling: ALIGNMENT_CRED_CEILING,
    living: candidates,
    boards,
    castle,
    truth,
    flips: flips.map(f => ({ name: f.name, ep: f.ep, via: f.via || null })),
  };
}
