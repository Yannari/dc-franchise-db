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

/** Rebuild Sets after a load. Idempotent, and safe on a state that never had them. */
export function repairTrSets(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    if (!(g.tr[key] instanceof Set)) g.tr[key] = new Set(g.tr[key] || []);
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
  'mastermind':        { rep: 'for running a room from the quiet end of the table',
                         now: 'plans in silence and explains nothing until arguing is pointless' },
  'schemer':           { rep: 'for redirecting a vote so calmly nobody noticed being steered',
                         now: 'finds the softest place in a conversation and leans on exactly that' },
  'hothead':           { rep: 'for detonating in public and taking somebody down with the blast',
                         now: 'says out loud the accusation everybody else is still weighing' },
  'challenge-beast':   { rep: 'for carrying a team through the parts of the day that hurt',
                         now: 'wants the castle earning, and measures people by what they do on the day' },
  'social-butterfly':  { rep: 'for knowing everybody else’s business inside a week',
                         now: 'collects confidences faster than the room can track who told what to whom' },
  'loyal-soldier':     { rep: 'for staying with a side long after it stopped paying',
                         now: 'picks a person early and defends them past the point of comfort' },
  'wildcard':          { rep: 'for doing the one thing nobody had planned around',
                         now: 'changes direction without warning, which makes a plan hard to build' },
  'chaos-agent':       { rep: 'for lighting a fire and then standing in the smoke',
                         now: 'prefers a loud messy table to a quiet correct one' },
  'floater':           { rep: 'for surviving nights that took out better players',
                         now: 'keeps every door open and commits to nothing until the vote is called' },
  'underdog':          { rep: 'for lasting far longer than anybody had allowed for',
                         now: 'gets written off early and is still there on the nights that decide things' },
  'hero':              { rep: 'for taking the straight line even when it cost {obj}',
                         now: 'says the uncomfortable thing to a face rather than behind a back' },
  'villain':           { rep: 'for playing ugly and refusing to apologise afterwards',
                         now: 'plays for the result and lets the room dislike {obj} for it' },
  'goat':              { rep: 'for being kept around because keeping {obj} around was convenient',
                         now: 'is underestimated in every room, which is the only advantage on offer' },
  'perceptive-player': { rep: 'for noticing the thing the rest of the room walked straight past',
                         now: 'watches far more than it talks, and keeps the notes' },
  'showmancer':        { rep: 'for playing the whole game through whoever was sitting closest',
                         now: 'builds a game out of one close attachment at a time' },
};
const _VOICE_FALLBACK = {
  rep: 'for a game the franchise remembers only in pieces',
  now: 'gives the castle very little to read on the first morning',
};

function _voice(archetype, pr) {
  const v = _ARCHETYPE_VOICE[archetype] || _VOICE_FALLBACK;
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
  const voice = _voice(p.archetype || row?.archetype, pr);
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
      `The castle already knows ${name} ${voice.rep}, and half the room walked in with that read formed. Here ${name} ${voice.now}.`,
      `That is the version of ${name} this room arrived holding — a player remembered ${voice.rep}. Whatever the record says about ${pr.obj}, inside these walls ${name} ${voice.now}.`,
      `A reputation ${voice.rep} came up the drive ahead of ${pr.posAdj} luggage. What it does not cover is that ${name} ${voice.now}.`,
      `The franchise files ${name} ${voice.rep}, which is a useful thing to be known for right up until somebody has to trust you. Here ${name} ${voice.now}.`,
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
      `The castle places ${name} before the introductions have finished; the recognition buys social access and asks a question about threat in the same breath. Here ${name} ${voice.now}.`,
      `Two people on the flags knew the face before they knew the name, which is worth something and costs something. Here ${name} ${voice.now}.`,
      `${name} is placed on the drive, and being placed is an advantage right up to the evening somebody decides it makes ${pr.obj} worth removing. Here ${name} ${voice.now}.`,
      `The room puts ${name} somewhere inside a minute and spends the rest of the afternoon deciding what to do about it. Here ${name} ${voice.now}.`,
    ], `celebrity|${name}`)].join(' ');
  } else {
    recognized = false;
    summary = [opener, _frame([
      `Nobody arrives with a television version of ${name} already in mind — composure and life experience are the whole of the résumé this room can read. Here ${name} ${voice.now}.`,
      `No face to place, nothing to look up, and no reputation doing any of the work for ${pr.obj}. Here ${name} ${voice.now}.`,
      `The castle gets ${name} with nothing attached, which is either the cleanest start available on these flags or the quietest. Here ${name} ${voice.now}.`,
      `What this room can read about ${name} is what ${pr.posAdj} face does over the next fortnight and not one thing before it. Here ${name} ${voice.now}.`,
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

/** Every receipt the season holds, or only the ones written on one episode. */
export function receiptsForEp(g, ep = null) {
  const all = g?.tr?.receipts || [];
  return (ep == null ? all : all.filter(r => r.ep === ep)).slice();
}
