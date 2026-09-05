// ══════════════════════════════════════════════════════════════════════
// tr/state.js — everything a Traitors season remembers
// ══════════════════════════════════════════════════════════════════════
//
// Kept in one place because two of these fields are the kind that get added
// ad hoc during a build and then quietly fail to serialize. Functions do not
// survive JSON.stringify and neither do Sets, so anything set-shaped is
// declared here and repaired here rather than discovered missing after a
// season is saved.
//
// It is also where a background is RESOLVED, because a background is state
// before it is prose: `backgrounds` below is a snapshot, and the resolver that
// fills it has to live beside the field it fills or the two drift.
import { alumniRecord, alumniAppearances } from '../alumni.js';
// THE LEAF PRONOUN TABLE. `pronouns()` in js/players.js is `pronounsOf(gender)`
// and nothing else, but it pulls in core.js and therefore the whole engine --
// which is the exact reason js/pronouns-of.js was split out, and the reason the
// life layer wrote 25 canon events in singular they before it existed. Same
// rule, same table, no dependency. js/tr/headless.js resolves the premiere's
// own clauses off it too, so the two files cannot disagree about a player.
import { pronounsOf } from '../pronouns-of.js';

/** A season's Traitors state, empty. */
export function initTraitorsState() {
  return {
    // WHO EACH PLAYER WAS BEFORE THE DOOR, FROZEN AT SETUP.
    //   name -> { type, sourceShows, appearances, summary, recognized, warnings }
    //
    // A SNAPSHOT, and that is the whole point of it. `players_database.json`
    // is edited between seasons -- a placement gets corrected, an occupation
    // gets filled in -- and a replay that re-resolved from the live database
    // would quietly rewrite its own premiere every time somebody tidied the
    // record. What the castle was told on the night is a fact about the night.
    // Plain values only, so it survives JSON.stringify with the rest of this.
    backgrounds: {},

    // name -> [{ truth, sinceEp }], oldest first. NOT a single value: alignment
    // is a property of a person AND a round, because recruitment changes it
    // mid-season and a belief formed before a flip was correct when it was
    // formed. See truthAtLearn() in tr/roles.js.
    alignment: {},

    // Every change of allegiance, in order: { name, from, to, ep, via }.
    // `via` is 'selection' | 'recruitment' | 'ultimatum'. This is what makes
    // alignment ERAS possible — a player who flips in episode 8 was genuinely
    // a Faithful in episode 3, and a belief formed then was correct when it
    // was formed.
    roleHistory: [],

    // Completed rounds, and the export shape (spec 10.1): each carries its
    // ballots with a `channel`, so a murder is a ballot only the Traitors cast
    // and the whole round still normalises to votingHistory[].
    rounds: [],

    // The shared prize fund. Nobody votes for it and only the winning faction
    // collects it, which is the whole strategic sting of a mission.
    pot: 0,
    potCeiling: 0,

    // Every mission this season ran, in order:
    //   { id, ep, name, teams, quality, gross, earned, potAfter, sideObjectives, summary }
    // `gross` and `earned` differ once the pot is near its ceiling — a season
    // that wins 15,000 with 4,000 of headroom left banks 4,000, and the rest
    // is gone rather than owed. Kept because the pot alone cannot say WHY it
    // stalled: a season that stopped earning because the cast kept failing and
    // a season that stopped because it had already filled the pot look
    // identical from `pot` and completely different from here.
    missions: [],

    // Every mission narration template printed this season. Prose bookkeeping
    // and nothing else: four variants per category is four variants only if
    // the season remembers which it has spent, and a nine-mission season runs
    // the same archetype three times. Plain strings, so it survives a save.
    missionLines: [],

    // Open narrative threads — see spec section 5.2. Events prefer to advance
    // one of these over starting something new, which is the single rule that
    // keeps a season from reading as forty unconnected incidents.
    threads: [],

    // What events have written down, keyed by player: [{ ep, note, threadId }].
    // This is why episode 7's accusation can name episode 2. Without it every
    // event is a sentence nobody can refer back to.
    residue: {},

    // Three cooldown scopes: by event id, by player, by PAIR. The pair scope is
    // the one that matters — without it the same two people have the same
    // conversation four times and the season reads as a loop.
    cooldowns: { event: {}, player: {}, pair: {} },

    // Who overruled whom at the conclave, and on which night:
    //   [{ ep, winner, loser, target, theirTarget }]
    // Not a mood. By episode 8 there is not a set of three Traitors but a
    // faction with a history, and the endgame betrayal has a DATE attached
    // rather than a schedule. Read by the exit blowup and (later) the endgame.
    conclaveTension: [],

    // Set-shaped, so it must be declared here. Cleared each round by
    // expireShields() (js/tr/powers.js) — which is what "expires unused"
    // means, and the reason a Shield is a gamble rather than a purchase.
    shieldedThisRound: new Set(),

    // Every Shield won this season, oldest first:
    //   { ep, holder, witnesses, visibility, pactAware, outcome, seenLine }
    // `witnesses` is the SEMI-VISIBILITY: the players who saw it won, and the
    // only ones who may ever form a read off what the following night did or
    // did not do to the holder. `outcome` is 'pending' until the night
    // resolves and then 'blocked' or 'expired' — the second is the common
    // case and the format intends it to be.
    shields: [],

    // Every Dagger won this season, oldest first:
    //   { ep, holder, witnesses, roomSize, visibility, seenLine, drawAt,
    //     pactAware, outcome, playedEp, target, banished }
    // A Dagger DOES NOT EXPIRE — unlike a Shield it is kept until its holder
    // draws it, which is the only reason it can reach the endgame at all
    // (spec 7.3: it breaks 3-3 deadlocks, and nothing spent in week two ever
    // breaks one). `drawAt` is the room size at or below which this holder
    // will use it, rolled at acquisition, so the table reads a recorded
    // decision instead of taking a draw off the game's own stream.
    // `outcome` is 'held' until it is either 'played' or 'lost' — lost meaning
    // the holder left the castle still carrying it, which is the commonest
    // ending a Dagger has.
    daggers: [],

    // THE SEER, and there is at most one of these in a whole season:
    //   { ep, seer, subject, truth, room, meetingLine, readLine, belief, claims }
    // Spec 7.3: once per game, endgame only, one player made to confirm their
    // alignment truthfully to one other. The belief it writes is the game's
    // ONE `observed` alignment belief and there may never be a second — see
    // the ceiling note in js/knowledge.js. `claims` is what each of the two
    // said about it afterwards, at `rumor`, true or false.
    seer: null,

    // The episode the endgame opened on, or null while the mandated loop is
    // still running. Written by runEndgame and read by openSeer, which is the
    // whole of the Seer's endgame gate: it is a property of season state, so
    // no caller can fake it.
    endgameFrom: null,

    // Nights the Traitors struck and nobody died: [{ ep, target }].
    // The TARGET is stored because the VP shows it — the audience knows who
    // was nearly murdered. The room does not, and must not: only the FACT of
    // a blocked attempt is public, which is what Task 4 reads.
    blockedMurders: [],

    // A recruiter's fate is tied to their recruit's: [{ recruiter, recruit, ep }].
    // A recruit banished soon after may burn the person who turned them, which
    // is the worst outcome in the format and the reason recruitment is a
    // decision with a tail rather than a free extra body.
    loyaltyDebt: [],

    // This round's shared castle-event spending money:
    // { total, used, windowsLeft }. startRoundBudget() (tr/events.js) draws
    // `total` (4-8) once per round from the castle layer's OWN hashed rng
    // (headless.js) — never the game rng, so registering content can never
    // perturb the murder/vote/ballot draws. Every runWindow() call across
    // that round's windows depletes the same `used` counter (what keeps a
    // round to 4-8 events TOTAL, not 4-8 per window) and decrements
    // `windowsLeft` (what lets each window cap itself at a fair share of
    // whatever remains, instead of the earliest windows racing to spend the
    // whole pot before the rest get a turn). Null between rounds.
    roundBudget: null,

    // ── WHAT THE SCENES DID, AND WHY (Plan 10, Task 4) ─────────────────
    //
    // Every one of these is written through js/tr/scene-api.js and through
    // nothing else. That is the point of them: a castle scene that says a
    // thing happened leaves the thing AND a receipt saying what caused it, so
    // "which scene made Gabby suspect Julia" is a lookup rather than an
    // investigation over two hundred event files.

    // The receipts themselves: one per state write, in the order they
    // happened. `{ kind, ep, sceneId, eventId, observer, subject, players,
    // belief, delta, confidence, value, truthStatus, source, applied,
    // debugLine }`. DEBUG-ONLY — `debugLine` is rendered by js/vp-tr/debug.js
    // and may never reach viewer prose, which is why the vocabulary it uses
    // (`belief`, `source:`) is banned everywhere else.
    receipts: [],

    // Things people SAID: `{ id, ep, speaker, about, claim, truthStatus,
    // channel, listeners, source }`. A contradiction is not a mood — the
    // causal contract requires two incompatible stored claims and an observer
    // who knows both before anybody may be said to have caught anybody out.
    // This is where the first of the two gets written down at the time.
    claims: [],

    // How a fact travelled: `{ factId, from, to, channel, ep, sceneId }`.
    // The reaction radius is the union of witnesses and named recipients, and
    // "the whole castle knows" is false until these receipts say otherwise.
    propagation: [],

    // Who somebody left a scene meaning to write down:
    // `{ voter, target, strength, ep, sceneId, source }`. An INTENT, read by
    // chooseBanishmentVote as one term beside suspicion and noise — a corridor
    // conversation can move a ballot and can never own one.
    voteIntents: [],

    // What somebody said they were GOING to do, and what became of it:
    // `{ id, sourceSceneId, promisedAction, owner, ep, threadId, status,
    // resolutionSceneId, abandonmentReason, detail }`. Written and settled by
    // js/tr/episode-editor.js, which will not let an episode be filed with one
    // still `open` — "a confessional says I'm checking that story and nobody
    // checks, postpones, or explains why it was dropped" is the forbidden case
    // this ledger exists to make unspellable.
    promises: [],

    // What a scene did to a Traitor's private shortlist:
    // `{ traitor, target, delta, ep, sceneId, source }`. Read by
    // formPreference (js/tr/murder.js), so the conclave argues from something
    // that happened in the castle rather than from nowhere. Negative deltas
    // are the interesting half.
    murderPrefs: [],

    // name -> { state, ep, sceneId, source }. `emotionalStateOf` DERIVES how
    // somebody is holding up from the last Round Table; this is the one
    // sanctioned override, and it expires at the next table. A conversation
    // can rattle somebody for a day; only the room can decide what they are.
    emotionOverrides: {},
  };
}

// ══════════════════════════════════════════════════════════════════════
// HOW MANY PEOPLE THE CASTLE HAS LOST — ONE SOURCE, BECAUSE THE OBVIOUS
// ONE IS WRONG
// ══════════════════════════════════════════════════════════════════════
//
// `gs.tr.rounds` is NOT a census of the dead. Night one's murder deliberately
// leaves no round record (js/tr/headless.js: there is no Round Table on night
// one, so nothing is pushed), so every count derived by summing `rounds` is
// short by at least one for the whole season. `grief-nobody-sleeps` printed
// that count to the viewer — "2 empty beds, so far" on a night with three —
// and was measured wrong on 100% of 363 firings across 200 seasons.
//
// The living cast is the honest source: it is decremented by every exit
// whatever recorded it. `castSize()` reads the alignment ledger, which
// receives one entry per player at selection and is never pruned, so
// cast − living is the number of people who are gone.
//
// USE THESE, NOT `rounds.filter(...)`, for anything a sentence prints or a
// branch is chosen by. The rule the whole-plan review wrote for this defect:
// any event emitting a count must agree with the season state it claims to
// describe, and `tests/tr-castle.test.js` now asserts it over the pool.

/** How many people started the season. 0 before selection has run. */
export function castSize(g) {
  return Object.keys(g?.tr?.alignment || {}).length;
}

/** How many people are gone — murdered, banished, however they left. */
export function peopleLost(g) {
  const cast = castSize(g);
  if (!cast) return 0;
  return Math.max(0, cast - (g?.activePlayers || []).length);
}

/**
 * How many people the Traitors have murdered, night one included.
 *
 * Derived, not counted: banishments are ALL on the round record (there is no
 * banishment without a Round Table), so the murders are everyone else who is
 * gone. This is the count `_deaths()` and the grief family's `deaths >= 2`
 * gates want and the round sum cannot give them.
 */
export function murderCount(g) {
  const banished = (g?.tr?.rounds || []).filter(r => r.banished).length;
  return Math.max(0, peopleLost(g) - banished);
}

/**
 * TONIGHT'S AFTERNOON, or nothing — never yesterday's.
 *
 * WHY THIS IS A FUNCTION AND NOT `gs.tr.missions.at(-1)` AT FOURTEEN CALL
 * SITES. An endgame round runs no mission at all (`runMission` returns null
 * below `MIN_PLAYERS`), so the last element of the log is the PREVIOUS
 * episode's afternoon on those rounds. A `journey-back` event reading the tail
 * of the array without checking would narrate yesterday's mission over
 * tonight's road — a sentence that is wrong about the game and that no test
 * currently looks for, printed on the one night the window is least likely to
 * be watched carefully. Task 7 stage 2 measured 721 `journey-back` firings and
 * found 100% same-episode, but only because the window never fired on an
 * endgame round in that sample; the shape is reachable and the check belongs
 * in one place.
 *
 * Returns the record for `ep` exactly, or null. Callers gate on the null.
 */
export function lastMission(g, ep) {
  const log = g?.tr?.missions;
  if (!Array.isArray(log) || !log.length) return null;
  const last = log[log.length - 1];
  return last && last.ep === ep ? last : null;
}

/** Field names on gs.tr that hold Sets and need flattening before a save. */
const TR_SETS = ['shieldedThisRound'];

/** Flatten Sets so the state survives JSON.stringify. Returns the same object. */
export function prepTrForSave(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    if (g.tr[key] instanceof Set) g.tr[key] = [...g.tr[key]];
  }
  return g;
}

/**
 * Rebuild Sets after a load. Idempotent, and safe on a state that never had
 * them — INCLUDING one where the Set was stringified while still a Set.
 *
 * `JSON.stringify(new Set([...]))` is `{}`, not an array: a snapshot taken
 * without `prepGsForSave` first loses the contents and leaves a plain object
 * behind. `new Set({})` then throws "is not iterable", so a state that had
 * merely lost some shields could not be loaded at all — the rollback after a
 * failed re-run died on this line and reported a TypeError instead of the
 * reason the re-run failed.
 *
 * The data is gone either way; what this decides is whether the season comes
 * back empty or does not come back. Same shape as `repairGsSets` in core.js,
 * which has always taken an array or nothing and never trusted the field.
 */
export function repairTrSets(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    const v = g.tr[key];
    if (v instanceof Set) continue;
    g.tr[key] = Array.isArray(v) ? new Set(v) : new Set();
  }
  return g;
}

// ══════════════════════════════════════════════════════════════════════
// THREE KINDS OF PERSON, AND THE ONE THING NONE OF THEM MAY DO
// ══════════════════════════════════════════════════════════════════════
//
// The castle is cast by hand out of ALUMNI (a recorded franchise past the room
// can quote at them), CELEBRITIES (recognised for something that is not a
// reality competition) and CIVILIANS (not recognised at all). Celebrity and
// Civilian read the same profile fields; what separates them is whether the
// room knows the face, and whether public reputation can move opening threat.
//
// THE FAILURE MODE THIS FILE IS SHAPED AROUND is prose that knows a fact
// nobody recorded. A celebrity has no placement. A civilian has no finish. A
// summary that hands either of them one is not colour — it is the screen
// asserting a run of television that never aired, on a show whose whole
// premise is that the audience can trust what it is shown and the room cannot.
// So a background prints only from what is written down, and choosing Alumni
// for somebody with nothing written down produces a BLOCKING WARNING rather
// than a plausible sentence. That contestant is still castable; they are just
// not an alumnus.

/** The only three values that are ever stored. Lowercase, exactly these. */
export const TR_BACKGROUND_TYPES = ['alumni', 'celebrity', 'civilian'];

/**
 * What the room already knows, and what it still has to find out.
 *
 * `{obj}` and `{posAdj}` IN THESE CLAUSES ARE FILLED FROM THE ROSTER'S GENDER
 * (see `_voice`). They used to be a literal "them", which printed singular they
 * over players the roster says are men and women -- the defect js/pronouns-of.js
 * exists for, printed on the show's opening screen twenty times in a row.
 *
 * Two clauses per archetype, because a background that printed only the first
 * would be a résumé card: `rep` is what a reputation MEANS to the people
 * reading it, `now` is how this person actually behaves once the door shuts.
 * History controls the first; personality controls the second; new castle
 * behaviour can overturn either. Alumni get both. Celebrity and Civilian get
 * `now` alone, because there is no recorded past for `rep` to describe.
 */
const _ARCHETYPE_VOICE = {
  'mastermind': [
    { rep: "for running a room from the quiet end of the table",
      now: "plans in silence and explains nothing until arguing is pointless" },
    { rep: "for keeping three moves ahead without anybody seeing the board",
      now: "steers conversations toward conclusions that were decided before they started" },
    { rep: "for never once raising {posAdj} voice and still getting the outcome",
      now: "treats every meal, every walk, every aside as a placement" },
    { rep: "for leaving a season with nobody able to prove what {sub} actually did",
      now: "builds consensus around ideas {sub} planted days earlier" },
    { rep: "for assembling a majority that only showed itself on the night it mattered",
      now: "watches who is talking and to whom, and files every detail" },
    { rep: "for controlling a vote from two conversations away",
      now: "asks questions that feel casual and are nothing of the sort" },
  ],
  'schemer': [
    { rep: "for redirecting a vote so calmly nobody noticed being steered",
      now: "finds the softest place in a conversation and leans on exactly that" },
    { rep: "for selling an alliance and dissolving it in the same week",
      now: "trades loyalty like currency and always comes out ahead on the exchange" },
    { rep: "for whispering a name into the right ear at the right hour",
      now: "makes promises with an expiry date only {sub} can see" },
    { rep: "for turning a trusted friend into a useful target overnight",
      now: "reads debts, grudges, and weak spots faster than most people read faces" },
    { rep: "for swapping sides so smoothly the betrayed still waved goodbye",
      now: "commits to nothing longer than it serves {obj} and moves on without looking back" },
    { rep: "for engineering a blindside that the victim voted toward willingly",
      now: "tests every bond for its breaking point and keeps a running list" },
  ],
  'hothead': [
    { rep: "for detonating in public and taking somebody down with the blast",
      now: "says out loud the accusation everybody else is still weighing" },
    { rep: "for a confrontation that stopped the whole table cold",
      now: "runs hot and speaks before the thought is finished, which lands about half the time" },
    { rep: "for standing up mid-vote and making it personal",
      now: "treats silence as agreement and will not tolerate either" },
    { rep: "for calling out a lie so loudly the liar could not recover",
      now: "carries every slight in short-term memory and brings it up at volume" },
    { rep: "for a temper that burned alliances down to the foundation",
      now: "goes from calm to furious with no visible middle step" },
    { rep: "for arguing a point past the moment it stopped helping {obj}",
      now: "speaks with the filter off and accepts the fallout as the cost of honesty" },
  ],
  'challenge-beast': [
    { rep: "for carrying a team through the parts of the day that hurt",
      now: "wants the castle earning, and measures people by what they do on the day" },
    { rep: "for winning the missions nobody else could finish",
      now: "shows up hardest when something physical is on the line" },
    { rep: "for being the reason a tribe survived a challenge it had no business surviving",
      now: "treats every task as a scoreboard and intends to be at the top of it" },
    { rep: "for performances that made {obj} too useful to vote out",
      now: "earns {posAdj} place through effort and expects everybody else to do the same" },
    { rep: "for finishing first so often the competition stopped being about second",
      now: "pours everything into the physical game and lets the politics sort itself" },
    { rep: "for a run of wins that kept {obj} safe long past the point of being liked",
      now: "competes like the money depends on it because for {obj} it does" },
  ],
  'social-butterfly': [
    { rep: "for knowing everybody's business inside a week",
      now: "collects confidences faster than the castle can track who told what to whom" },
    { rep: "for being liked by every side without belonging to any of them",
      now: "makes friends instinctively and without apparent effort" },
    { rep: "for turning every conversation into an invitation",
      now: "learns a name and remembers it, remembers the detail after it, and uses both" },
    { rep: "for holding the centre of a room without holding any power in it",
      now: "gravitates toward people and people gravitate back" },
    { rep: "for making connections that outlasted the season they were formed in",
      now: "treats every meal as a meeting and every meeting as an opportunity" },
    { rep: "for being trusted by four people who did not trust each other",
      now: "moves between groups so naturally that nobody notices the overlap" },
  ],
  'loyal-soldier': [
    { rep: "for staying with a side long after it stopped paying",
      now: "picks a person early and defends them past the point of comfort" },
    { rep: "for keeping a promise that cost {obj} the game",
      now: "gives {posAdj} word once and does not revisit it, whatever the table does" },
    { rep: "for refusing to flip when flipping was the obviously correct move",
      now: "stands beside the person {sub} chose on the first night, right through to the end" },
    { rep: "for absorbing a blindside rather than betraying an ally to prevent it",
      now: "values trust above strategy and says so plainly" },
    { rep: "for being the last one standing with a sinking ship",
      now: "treats a handshake as a contract and holds the other party to it" },
    { rep: "for walking into a losing vote rather than walking away from a friend",
      now: "does not scheme, does not manoeuvre, and does not apologise for either" },
  ],
  'wildcard': [
    { rep: "for doing the one thing nobody had planned around",
      now: "changes direction without warning, which makes a plan hard to build" },
    { rep: "for voting against {posAdj} own alliance on a feeling",
      now: "makes decisions on instinct and defends them with conviction" },
    { rep: "for a move so strange the whole table stopped and asked why",
      now: "follows a logic that makes sense to {obj} and almost nobody else" },
    { rep: "for switching sides at a moment that broke two plans at once",
      now: "keeps everybody guessing because {sub} is genuinely undecided until the last second" },
    { rep: "for playing a game nobody else recognised as a strategy",
      now: "treats unpredictability as a position and holds it deliberately" },
    { rep: "for doing exactly the wrong thing and somehow landing on {posAdj} feet",
      now: "improvises through every situation and rarely plays the same way twice" },
  ],
  'chaos-agent': [
    { rep: "for lighting a fire and then standing in the smoke",
      now: "prefers a loud messy table to a quiet correct one" },
    { rep: "for blowing up a majority on purpose and enjoying the result",
      now: "treats disorder as a resource and manufactures it when supplies run low" },
    { rep: "for destroying a stable alliance by telling both halves what the other said",
      now: "starts arguments between people who were getting along and watches from nearby" },
    { rep: "for creating a situation so chaotic that nobody, including {obj}, could control it",
      now: "considers a calm evening in the castle a personal failure" },
    { rep: "for an act of sabotage so brazen even the host mentioned it",
      now: "throws a rock at every window and relocates before the glass lands" },
    { rep: "for making the season memorable and the cast miserable, simultaneously",
      now: "stirs trouble for the entertainment value and calls it gameplay" },
  ],
  'floater': [
    { rep: "for surviving nights that took out better players",
      now: "keeps every door open and commits to nothing until the vote is called" },
    { rep: "for reaching the final week without anybody being able to name {posAdj} alliance",
      now: "drifts toward whoever is in power and does it pleasantly" },
    { rep: "for being on no side and therefore on no target list",
      now: "agrees with the last person who spoke and means it just enough" },
    { rep: "for outlasting the loud players by being none of the things they were",
      now: "avoids conflict, avoids commitments, and avoids being discussed" },
    { rep: "for going deep without a single memorable move on the record",
      now: "occupies the middle of every conversation and the edge of every decision" },
    { rep: "for lasting to a point that made the rest of the cast furious",
      now: "reads the majority and joins it, repeatedly, without ever leading it" },
  ],
  'underdog': [
    { rep: "for lasting far longer than anybody had allowed for",
      now: "gets written off early and is still there on the nights that decide things" },
    { rep: "for surviving a vote {sub} was never supposed to survive",
      now: "plays from behind and has learned to use the view" },
    { rep: "for turning a fourth-boot prediction into a deep run",
      now: "carries no expectations and no target, which is its own kind of weapon" },
    { rep: "for proving the early consensus wrong by a margin of weeks",
      now: "lets the castle underestimate {obj} and makes no effort to correct it" },
    { rep: "for scraping through elimination after elimination on nothing but nerve",
      now: "treats every round as borrowed time and plays accordingly" },
    { rep: "for a quiet start that turned into one of the longest stays in the season",
      now: "stays small, stays useful, and outlasts the names above {obj} one at a time" },
  ],
  'hero': [
    { rep: "for taking the straight line even when it cost {obj}",
      now: "says the uncomfortable thing to a face rather than behind a back" },
    { rep: "for standing up for somebody at a table that wanted them gone",
      now: "defends the person under pressure and accepts the target it paints on {obj}" },
    { rep: "for refusing to lie when lying was the obvious play",
      now: "plays with {posAdj} cards visible and dares the castle to punish it" },
    { rep: "for calling out a betrayal in front of everybody, consequences included",
      now: "trusts openly, which in this castle is either brave or reckless" },
    { rep: "for a move that was honourable and expensive in exactly equal measure",
      now: "would rather go home clean than stay by doing something ugly" },
    { rep: "for protecting an ally when protecting {ref} would have been smarter",
      now: "treats integrity as non-negotiable and lets the numbers fall where they fall" },
  ],
  'villain': [
    { rep: "for playing ugly and refusing to apologise afterwards",
      now: "plays for the result and lets the castle dislike {obj} for it" },
    { rep: "for a betrayal so cold the audience remembered it by name",
      now: "treats other people as positions on a board and moves them without sentiment" },
    { rep: "for dismantling a majority from the inside while smiling at breakfast",
      now: "does the ruthless thing first and rationalises it later, if at all" },
    { rep: "for cutting somebody loose the moment they stopped being useful",
      now: "weighs every friendship against what it costs and acts on the arithmetic" },
    { rep: "for a move that was effective and cruel and not accidental",
      now: "uses warmth as a tool and puts it away when the job is done" },
    { rep: "for making an enemy of half the cast and outlasting most of them anyway",
      now: "plays without apology and considers likability someone else's problem" },
  ],
  'goat': [
    { rep: "for being kept around because keeping {obj} around was convenient",
      now: "is underestimated in every room, which is the only advantage on offer" },
    { rep: "for reaching the end as somebody else's insurance policy",
      now: "survives by being nobody's priority, which is a strategy if you commit to it" },
    { rep: "for sitting beside the winner without anybody asking how {sub} got there",
      now: "occupies a seat the castle considers safe and does not correct them" },
    { rep: "for outlasting threats by never being mistaken for one",
      now: "absorbs dismissal without flinching and stays in the chair" },
    { rep: "for a finish that everybody attributed to somebody else's decision",
      now: "knows exactly what the castle thinks of {obj} and uses every bit of it" },
    { rep: "for being dragged to the end by players who thought they were doing the dragging",
      now: "plays the role the castle assigns and banks the survival it buys" },
  ],
  'perceptive-player': [
    { rep: "for noticing the thing the rest of the room walked straight past",
      now: "watches far more than {sub} talks, and keeps the notes" },
    { rep: "for reading a lie before the sentence was finished",
      now: "catalogues what people say and checks it against what they do" },
    { rep: "for catching a scheme by remembering who sat where three nights ago",
      now: "listens to the gap between what is said and what is meant" },
    { rep: "for spotting the traitor by a detail nobody else thought to track",
      now: "files every contradiction and waits for the pattern to surface" },
    { rep: "for asking one quiet question that unravelled an entire alliance",
      now: "observes without announcing it and speaks only when the evidence is ready" },
    { rep: "for a read so accurate the target never recovered from being seen",
      now: "trusts what {sub} noticed over what {sub} was told, every time" },
  ],
  'showmancer': [
    { rep: "for playing the whole game through whoever was sitting closest",
      now: "builds a game out of one close attachment at a time" },
    { rep: "for a bond that rewrote both players' strategies from the second week on",
      now: "plays with {posAdj} heart in it, which makes {obj} readable and hard to vote against" },
    { rep: "for turning a partnership into a voting bloc of two",
      now: "finds one person and makes that relationship the centre of every decision" },
    { rep: "for choosing loyalty to a partner over loyalty to a winning position",
      now: "invests everything in one bond and defends it past the point of reason" },
    { rep: "for a connection so visible it drew fire from every other alliance in the cast",
      now: "gravitates toward closeness and plays best when {sub} is playing for somebody else" },
    { rep: "for pairing off early and never once pretending it was purely strategic",
      now: "lets affection steer {posAdj} game and is honest about the cost" },
  ],
};
const _VOICE_FALLBACK = [
  { rep: "for a game the franchise remembers only in pieces",
    now: "gives the castle very little to read on the first morning" },
  { rep: "for a season that ended without leaving much of a mark",
    now: "arrives without a reputation and seems content to build one slowly" },
  { rep: "for a run the record barely annotated",
    now: "keeps {posAdj} cards close and lets the castle fill in the blanks" },
];

function _voice(archetype, pr, name) {
  const raw = _ARCHETYPE_VOICE[archetype] || _VOICE_FALLBACK;
  const pool = Array.isArray(raw) ? raw : [raw];
  const v = pool[_bHash(name || '') % pool.length];
  const fill = t => String(t).replace(/\{(\w+)\}/g, (m, k) => (pr && pr[k] != null) ? pr[k] : m);
  return { rep: fill(v.rep), now: fill(v.now) };
}

/**
 * FNV-1a over the name, and it chooses which SENTENCE this billing is in.
 *
 * One frame for every player in the cast is what the first version had, and a
 * premiere prints twenty of them consecutively on the show's opening screen --
 * so the frame, not the clause, was what the reader saw, and every alumnus was
 * introduced with the identical two sentences. Four frames a type, chosen off
 * the NAME so a replay of a season bills everybody exactly as it billed them
 * before: this is a snapshot, and a snapshot that reshuffles is not one.
 */
function _bHash(s) {
  let h = 2166136261;
  const t = String(s);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const _frame = (pool, key) => pool[_bHash(key) % pool.length];

function _ordinal(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  const tens = v % 100;
  if (tens >= 11 && tens <= 13) return `${v}th`;
  return `${v}${['th', 'st', 'nd', 'rd'][v % 10] || 'th'}`;
}

/** "Total Drama 2 · 4th place" — the show name is the REGISTRY's, never a literal. */
function _appearanceLine(app) {
  const ord = _ordinal(app.placement);
  const finish = app.status || (ord ? `${ord} place` : null);
  return finish ? `${app.seasonLabel} · ${finish}` : app.seasonLabel;
}

/**
 * Does anything on the profile SAY this person is publicly known?
 *
 * Explicit metadata only. The temptation is to read an occupation and decide
 * that an actor must be famous and a nurse must not, which is the resolver
 * inventing the one kind of fact this whole feature refuses to invent. If
 * nobody wrote it down the answer is Civilian, and the user overrides it in
 * one click.
 */
function _claimsFame(player, row) {
  for (const src of [player, row]) {
    if (!src) continue;
    if (src.publicFigure === true || src.celebrity === true) return true;
    if (src.fame) return true;
  }
  return false;
}

function _field(player, row, key) {
  const a = player?.[key];
  if (a != null && String(a).trim() !== '') return String(a).trim();
  const b = row?.[key];
  if (b != null && String(b).trim() !== '') return String(b).trim();
  return '';
}

/**
 * Who this contestant is, as the castle will be told it.
 *
 * @param player   the cast entry: { name, backgroundType?, archetype?, occupation?, ... }
 * @param database players_database.json (array or { players }), or null for the loaded one
 * @returns { type, sourceShows, appearances, summary, recognized, warnings }
 */
export function resolveTraitorsBackground(player, database = null) {
  const p = typeof player === 'string' ? { name: player } : (player || {});
  const name = String(p.name || '').trim();
  const row = alumniRecord(name, database);
  const recorded = alumniAppearances(name, database);

  const chosen = TR_BACKGROUND_TYPES.includes(p.backgroundType) ? p.backgroundType : null;
  // The default is the record, and with no record it is Civilian — the only
  // one of the three that asserts nothing whatsoever about a person.
  const fallback = recorded.length ? 'alumni'
    : (_claimsFame(p, row) ? 'celebrity' : 'civilian');
  const type = chosen || fallback;

  const occupation = _field(p, row, 'occupation');
  const pr = pronounsOf(p.gender || row?.gender);
  const voice = _voice(p.archetype || row?.archetype, pr, name);
  const opener = occupation ? `${name}, ${occupation}.` : `${name}.`;
  const warnings = [];

  let appearances = [];
  let summary = '';
  let recognized = false;

  if (type === 'alumni' && recorded.length) {
    // The record and the person, in that order, because that is the order the
    // room gets them in: a face it half-knows, then a fortnight of finding out
    // how little the half it knew was worth.
    appearances = recorded;
    recognized = true;
    const record = `${recorded.map(_appearanceLine).join(' · ')}.`;
    // EVERY FRAME CARRIES THE RECORD AND THE PERSON, in that order, because
    // that is the order the room gets them in. What varies is the sentence
    // around them, never the claim inside them.
    summary = [opener, record, _frame([
      `Remembered ${voice.rep}. ${name} ${voice.now}.`,
      `The record says ${voice.rep}. In person, ${name} ${voice.now}.`,
      `Known ${voice.rep}, which is half the story. ${name} ${voice.now}.`,
      `A reputation built ${voice.rep} arrived before ${pr.sub} did. ${name} ${voice.now}.`,
    ], `alumni|${name}`)].join(' ');
  } else if (type === 'alumni') {
    // THE BLOCKING CASE. No record, so no record is printed — the summary
    // names the gap instead of filling it in, and the warning stops the season
    // rather than being a note nobody reads.
    recognized = false;
    warnings.push({
      code: 'alumni-without-history',
      blocking: true,
      player: name,
      message: `${name} is classified Alumni, but the franchise has no recorded appearance for them. `
        + 'Record the show they played, or reclassify them as Celebrity or Civilian — the castle '
        + 'will not be handed a past that was never played.',
    });
    summary = [
      opener,
      `Nothing in the franchise record backs an Alumni billing, so the castle has nothing to recognise ${name} for.`,
      `Here ${name} ${voice.now}.`,
    ].join(' ');
  } else if (type === 'celebrity') {
    recognized = true;
    summary = [opener, _frame([
      `Recognised on the drive before the first handshake. ${name} ${voice.now}.`,
      `A face the castle already knows. ${name} ${voice.now}.`,
      `Placed by the room inside a minute, which is a head start and a target. ${name} ${voice.now}.`,
      `The name arrives before the person does. ${name} ${voice.now}.`,
    ], `celebrity|${name}`)].join(' ');
  } else {
    recognized = false;
    summary = [opener, _frame([
      `No record, no reputation. ${name} ${voice.now}.`,
      `A stranger to the castle, starting from nothing. ${name} ${voice.now}.`,
      `Nobody here has a read on ${name} yet. ${name} ${voice.now}.`,
      `No face to place and no history to look up. ${name} ${voice.now}.`,
    ], `civilian|${name}`)].join(' ');
  }

  return {
    type,
    // Derived from the appearances, which take their format from the ledger —
    // never an allow-list here, so a fourth show becomes an alumni source the
    // day it starts recording seasons.
    sourceShows: [...new Set(appearances.map(a => a.format))],
    appearances,
    summary,
    recognized,
    warnings,
  };
}

/**
 * The whole cast's backgrounds, keyed by name, ready to be frozen onto `gs.tr`.
 *
 * Takes names or cast objects, because the setup screen holds objects and the
 * headless harness holds a list of names, and both have to be able to take the
 * snapshot.
 */
export function snapshotTraitorsBackgrounds(cast = [], database = null) {
  const out = {};
  for (const entry of (cast || [])) {
    const p = typeof entry === 'string' ? { name: entry } : (entry || {});
    const name = String(p.name || '').trim();
    if (!name) continue;
    out[name] = resolveTraitorsBackground(p, database);
  }
  return out;
}

/**
 * Every warning that has to be cleared before a season can start.
 *
 * Non-blocking warnings exist to be read; these exist to stop the button. The
 * setup screen asks this rather than `.warnings.length`, so the difference
 * between "worth knowing" and "will print a lie" lives in one place.
 */
export function traitorsBackgroundBlockers(backgrounds = {}) {
  const out = [];
  for (const bg of Object.values(backgrounds || {})) {
    for (const w of (bg?.warnings || [])) if (w?.blocking) out.push(w);
  }
  return out;
}


// ══════════════════════════════════════════════════════════════════════
// READING BACK WHAT THE SCENES WROTE
// ══════════════════════════════════════════════════════════════════════
//
// These live here rather than in js/tr/scene-api.js for one structural
// reason: the engine modules that CONSUME a scene's output — deduction.js at
// the ballot, murder.js at the conclave, events.js at the state map — would
// otherwise have to import the scene API, and the scene API imports
// deduction.js. A cycle, and this project does not have one. So the writer
// imports the readers, never the other way round, and there is exactly one
// derivation of each question.
//
// Every one takes `g` (the game state) explicitly, like `castSize` and
// `peopleLost` above, so this file stays free of a `gs` import.

/** What `voter` last said, this episode, they meant to do. Null when nothing was said. */
export function voteIntentFor(g, voter, ep) {
  const list = g?.tr?.voteIntents || [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].voter === voter && list[i].ep === ep) return { ...list[i] };
  }
  return null;
}

/** Net push the day's scenes gave `traitor` toward (or away from) `target`. */
export function murderPreferenceFor(g, traitor, target, ep) {
  let sum = 0;
  for (const p of (g?.tr?.murderPrefs || [])) {
    if (p.traitor === traitor && p.target === target && p.ep === ep) sum += p.delta;
  }
  return sum;
}

/**
 * A scene-set emotional state, if one is still live at `ep`.
 *
 * The lifetime is deliberately one round: an override written in episode N is
 * live for every window of episode N and is superseded by episode N's own
 * Round Table verdict, because that verdict is a louder fact about the same
 * person than a corridor conversation was.
 */
export function emotionalOverrideFor(g, name, ep) {
  const o = g?.tr?.emotionOverrides?.[name];
  if (!o || o.ep == null || ep == null) return null;
  return o.ep >= ep ? o : null;
}

/**
 * The receipts still sitting in the LIVE BUFFER, or only this episode's.
 *
 * The buffer is deliberately short-lived — see `trimRecordedReceipts` — so this
 * answers "what has not been snapshotted onto a row yet", which is exactly what
 * `_recordEpisode` needs and almost never what anybody else does. For the
 * season's whole history, use `recordedReceipts`.
 */
export function receiptsForEp(g, ep = null) {
  const all = g?.tr?.receipts || [];
  return (ep == null ? all : all.filter(r => r.ep === ep)).slice();
}

/**
 * DROP THE RECEIPTS THAT ARE NOW SAFELY ON A ROW.
 *
 * ── WHY THE BUFFER IS TRIMMED AT ALL ─────────────────────────────────────
 *
 * `gs.tr.receipts` used to be append-only for a whole season, and `gs`
 * serializes wholesale (js/savestate.js has no special case for `gs.tr`), so a
 * save carried every receipt TWICE: once in the never-trimmed buffer and once
 * more spread across the per-episode snapshots on `episodeHistory`. That is the
 * Big Brother 19MB leak shape exactly — season data copied per-episode with the
 * original kept alive beside it — and with ~210 events about to be authored it
 * multiplies rather than adds.
 *
 * The per-episode rows are the copy that is KEPT: they are the only thing
 * anything reads (js/vp-tr/debug.js), and their union is a lossless
 * reconstruction of the season, so trimming the buffer loses nothing.
 *
 * ── TRIMS BY IDENTITY, NOT BY EPISODE NUMBER ────────────────────────────
 *
 * `taken` is the very array that was just written onto the row, and only those
 * objects are dropped. Filtering on `r.ep === ep` would be equivalent today and
 * would stop being equivalent the moment anything writes a receipt after
 * `_recordEpisode` has run — at which point it would delete a receipt that was
 * never snapshotted, and the loss would be invisible.
 *
 * ── AND IT CHECKS THE ROW BEFORE IT LETS ANYTHING GO ────────────────────
 *
 * A receipt is dropped only if it is ACTUALLY FOUND on a recorded row. That
 * makes the caller's ordering — snapshot first, trim second — safe rather than
 * merely conventional: call this before the row is pushed and it finds nothing
 * on a row, drops nothing, and the buffer is left intact for the real trim. The
 * failure mode it forecloses is the expensive one, because a trim that ran too
 * early would delete receipts that exist nowhere else and no reader would ever
 * know what was missing.
 *
 * It is a membership test over the rows, not a re-derivation of them, so it
 * cannot disagree with what was snapshotted: the row holds the same objects.
 */
export function trimRecordedReceipts(g, taken) {
  if (!g?.tr?.receipts || !taken?.length) return g;
  const onRows = new Set();
  for (const row of (g.episodeHistory || [])) {
    for (const r of (row?.tr?.receipts || [])) onRows.add(r);
  }
  const gone = new Set(taken);
  g.tr.receipts = g.tr.receipts.filter(r => !(gone.has(r) && onRows.has(r)));
  return g;
}

/**
 * EVERY RECEIPT THE SEASON HAS WRITTEN, across episode boundaries.
 *
 * The rows first, in order, then whatever is still in the live buffer — which
 * is the episode currently in progress, and is why a scene can still read back
 * what it did tonight. The two sets are disjoint by construction, because
 * `trimRecordedReceipts` removes from the buffer exactly what the row took.
 */
export function recordedReceipts(g, ep = null) {
  const out = [];
  for (const row of (g?.episodeHistory || [])) {
    for (const r of (row?.tr?.receipts || [])) out.push(r);
  }
  out.push(...(g?.tr?.receipts || []));
  return ep == null ? out : out.filter(r => r.ep === ep);
}
