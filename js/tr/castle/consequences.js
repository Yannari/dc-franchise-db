// ══════════════════════════════════════════════════════════════════════
// tr/castle/consequences.js — the two hours either side of a banishment
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS. `after-table` (the whole of the `roundtable-scramble`
// phase) and `night` (the whole of `post-banishment`) are the two windows in
// which the room deals with what it has just done. Task 7 stage 1 measured
// them at 1.43 and 1.31 scenes an episode against phase budgets of 4-7 and
// 2-4 — 26% and 44% of what the schedule is willing to spend — and allocated
// them +11 and +5 events. This file is those sixteen.
//
// ── THE RECORD EVERY EVENT HERE POINTS AT ─────────────────────────────
//
// `runRoundTable` (js/tr/roundtable.js) pushes tonight's round BEFORE
// `roundtable-scramble` runs, and `_night` (js/tr/headless.js) writes the
// murder onto that same round before `post-banishment` runs. So both windows
// can read a complete, same-episode round record, and the causal contract's
// first question — WHICH RECORD MADE THIS EVENT ELIGIBLE — has a real answer
// for every event below. The five facts used, and who is entitled to each:
//
//   round.ballots        PUBLIC. Read out at the table. Anybody may cite it.
//   round.accusations    PUBLIC. Said out loud in front of the room.
//   round.banished +
//     banishedWasTraitor PUBLIC. `revealCascade` runs before this window.
//   round.exitSpeech     PUBLIC when `burns` — one person shouting on the way
//                        out of a door, in front of everybody.
//   gs.tr.conclaveTension  TRAITOR-ONLY. Who overruled whom in the turret.
//
// ── OBSERVER SAFETY, DECIDED BEFORE THE SCENE WAS WRITTEN ─────────────
//
// THE ONE HARD RULE IN THIS FILE: exactly ONE event reads conclave material
// (`night-overruled-in-the-turret`), and its `weight()` returns 0 unless
// EVERY person the scene convened is a Traitor. Not "a Traitor is present" —
// every one of them. A pact scene with a Faithful standing in it is a
// Faithful being handed Traitor-only knowledge through the one channel the
// belief gate does not watch, which is precisely the hole the observer
// contract exists to close. Nothing else here touches the turret, the murder,
// or tonight's target, and no sentence anywhere in this file says what
// somebody is.
//
// The other fifteen are built out of PUBLIC facts only, which is why they can
// convene anybody. A Faithful in these scenes cites a ballot or an accusation
// the whole castle heard; alignment never enters, and `alignmentAt` appears in
// exactly two weight functions — the turret event's gate, and the check in
// `after-somebody-goes-tonight` that a pact still exists at all, which is
// public knowledge because the format announces it on night one.
//
// ── WHAT IS DELIBERATELY NOT WRITTEN HERE, AND WHY ────────────────────
//
// `setVoteIntent` and `addMurderPreference` are the two scene-API writes that
// look tailor-made for these windows and are DEAD IN THEM. Both readers key on
// an exact episode: `voteIntentFor(gs, voter, ep)` (js/tr/state.js) is read by
// `chooseBanishmentVote` at the table, and `murderPreferenceFor` by
// `formPreference` at the conclave. Both of those have already happened by the
// time these two windows run, so an intent or a preference written here is
// stamped with an episode whose reader is already behind it — a write nothing
// will ever read, wearing the clothes of a consequence. Found by reading the
// two readers rather than by running a season, because a no-op leaves nothing
// to measure. If a later stage wants a corridor promise to reach TOMORROW's
// ballot, that is a change to how the ledger is keyed, not a new event.
//
// `setEmotionalState` is the opposite case and IS used, in `after-table` only.
// `emotionalOverrideFor` keeps an override live while `o.ep >= ep`, so one
// written after the table is live for the rest of that episode — and `night`
// is the rest of that episode. Three shipped night events gate on
// `isNervy(ctx.state)` (`cover-alone-with-it`, `susp-heard-in-the-corridor`,
// `grief-nobody-sleeps`), so a scene that rattles somebody in the corridor
// after the table changes which scenes they get in the dark. That is a real
// cross-window information path and it is why the write is here. It is NOT
// used in `night`: an override written there is superseded before anything
// reads it, which would be the same dead write in a different window.
//
// ── COUNTS ARE PRINTED IN WORDS ───────────────────────────────────────
//
// `tests/tr-castle-prose.test.js`'s number rule allows a printed digit only
// when it equals the living count, the lost count, the murders, the
// banishments, the cast size, or an episode that has happened. How many people
// wrote somebody's name is on none of those lists, so it is printed as a word
// (`countWord` below) — which is also how anybody actually says it.
//
// And the consensus rule: `everyone`, `the whole room` and their family are
// banned outright, so a scene that wants to say the room moved NAMES the
// people. `votersAgainst` and `accusersOf` return names for exactly that
// reason.
//
// ── WHY THE EVENTS CARRY THE OTHER FAMILIES' NAMES ────────────────────
//
// Same reason js/tr/castle/mission-fallout.js gives: `family` is the ARC KIND
// an event opens and continues, not the subject of the sentence and not the
// file it lives in. A suspicion formed in the corridor after a table is the
// same suspicion that was formed at breakfast, and a seventh kind called
// `aftermath` would be a seventh storyline running beside the six the castle
// tells, which `findOpenThread` could never connect to anything that happened
// earlier in the day.
//
// No belief writes here, same as every other castle file. These events move
// bonds, arcs and (in one window) how somebody is holding up, and nothing else.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may hold;
// every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue, arcAdvanceCiting } from './effects.js';
import { alignmentAt } from '../roles.js';
import { wasAllied } from '../alliances.js';
import { lineFor } from './lines.js';
import { findOpenThread } from '../threads.js';

// ── THE SHARED READS ──────────────────────────────────────────────────

/**
 * TONIGHT'S ROUND TABLE, or nothing — never last night's.
 *
 * Same shape, and the same reason, as `lastMission` (js/tr/state.js): episode
 * one has no table at all, and an endgame round's is recorded elsewhere, so
 * the tail of `gs.tr.rounds` is the PREVIOUS episode's table on those nights.
 * An event reading it without checking would narrate yesterday's banishment
 * over tonight's corridor — a sentence that is wrong about the game and that
 * no test looks for. The `banished` check is belt and braces: `runRoundTable`
 * returns null rather than recording a round it could not resolve, but every
 * function below indexes the name.
 */
export function table(ctx) {
  const rounds = gs.tr?.rounds || [];
  const last = rounds[rounds.length - 1];
  return last && last.ep === ctx.ep && last.banished ? last : null;
}

/** Who is still here and wrote `name` down tonight, in ballot order. */
export function votersAgainst(round, name, living) {
  const out = [];
  for (const b of (round.ballots || [])) {
    if (b.voted !== name) continue;
    if (living && !living.includes(b.voter)) continue;
    if (!out.includes(b.voter)) out.push(b.voter);
  }
  return out;
}

/** The one name this person wrote down, or null. */
export function ballotOf(round, voter) {
  return (round.ballots || []).find(b => b.voter === voter)?.voted ?? null;
}

/** Who said `name` out loud at the table, and is still here to be asked about it. */
export function accusersOf(round, name, living) {
  const out = [];
  for (const a of (round.accusations || [])) {
    if (a.target !== name) continue;
    if (living && !living.includes(a.accuser)) continue;
    if (!out.includes(a.accuser)) out.push(a.accuser);
  }
  return out;
}

/** Who this person named at the table, or null if they kept quiet. */
export function accusedBy(round, accuser) {
  return (round.accusations || []).find(a => a.accuser === accuser)?.target ?? null;
}

/**
 * A LIST OF PEOPLE, NAMED, because the consensus rule forbids the shortcut.
 *
 * Two names and then a word — never a digit, and never "the room".
 * `tests/tr-castle-prose.test.js` bans `everyone`, `the whole castle`, `the
 * whole room`, `the group agrees`, `the castle turns` and `nobody trusts`
 * outright, and the writing contract's own correction to the sentence it
 * forbids is to say `three players` or to name them. This does both.
 */
const NUMBER_WORDS = ['nobody', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten'];
export function countWord(n) { return NUMBER_WORDS[n] || 'more than ten'; }
export function namesList(arr) {
  if (!arr.length) return 'nobody';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  const rest = arr.length - 2;
  return `${arr[0]}, ${arr[1]} and ${countWord(rest)} other${rest === 1 ? '' : 's'}`;
}

/**
 * ONE LINE, CHOSEN WITHOUT AN RNG DRAW.
 *
 * Same contract, and the same measurement behind it, as
 * js/tr/castle/mission-fallout.js's: `fire(ctx, rng)` is handed the castle
 * layer's own stream, so one extra draw inside one `fire()` shifts every draw
 * after it and a purely cosmetic edit reroutes the season. `lineFor`
 * (js/tr/castle/lines.js) hashes the key instead and consumes nothing. The key
 * carries the episode AND the substitution values, so the same pair on the
 * same night reads the same way — it is one scene — and everything else moves.
 */
export function line(pool, eventId, branch, ep, vars) {
  return lineFor(pool, `${eventId}|${branch}|${ep}`, vars);
}

/** Weighted branch draw from `{ name: score }`. One rng call, like the pool. */
export function forkOn(rng, scores) {
  const keys = Object.keys(scores);
  const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
  if (!(total > 0)) return keys[keys.length - 1];
  let roll = rng() * total;
  for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) return k; }
  return keys[keys.length - 1];
}

export function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }



// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 1. YOU WROTE MY NAME — the ballot is public, so the
//    question has a checkable answer and the lie has a cost
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.ballots`. Every ballot is read out at the table, so both
// people in this scene heard both of these facts — who took votes, and who
// cast them. The KNOWLEDGE axis here is mechanical rather than decorative: the
// branch set is chosen by what the record says `{b}` actually did, and the two
// sets are different scenes. If `{b}` wrote the name, `{b}` is answering for
// it; if `{b}` did not, `{b}` is the one person `{a}` can safely talk to about
// who did. Same premise, two different conversations, decided by a fact.
const WROTE_MY_NAME = {
  // ── {b} DID WRITE IT ──
  'owned-it': [
    '“I did write it,” {b} said, before {a} had finished asking. “Ask me why and I’ll tell you why.”',
    '{b} did not make {a} work for it. “That was me. {who} was the other one. Now you know.”',
    '“You want me to say I didn’t,” {b} said. “I did. It was the read I had at six o’clock.”',
    '{a} asked and {b} answered in one sentence, which was not the sentence {a} had braced for.',
    '{b} put it on the table before {a} could: the name, the reason, and no apology attached to either.',
  ],
  'denied-it': [
    '{b} said the name had not come from {b}. It had, and {a} had heard it read out with the rest.',
    '“Not me,” {b} said, and {a} let it go, and did not stop hearing it for the rest of the night.',
    '{a} asked {b} straight and got a straight answer that did not match what the table had said out loud.',
    '{b} explained at some length who {b} thought had done it, and never once got to {b}’s own ballot.',
    '“Somebody’s told you wrong.” Nobody had told {a} anything. {a} had been sitting there.',
  ],
  'made-it-a-price': [
    '{b} admitted the vote and attached a condition to the next one, which {a} noticed was the actual conversation.',
    '“I wrote it,” {b} said. “And I’ll write somebody else tomorrow, if we’re being honest with each other.”',
    '{b} traded the admission for something — not a promise exactly, but the shape of one.',
    '“You were the safe name tonight,” {b} said to {a}, as though that were a kindness, and half meant it.',
    '{b} owned the ballot and then spent ten minutes explaining what it would take not to do it again.',
  ],
  // ── {b} DID NOT WRITE IT ──
  'named-the-others': [
    '{b} had not written it, and told {a} who had: {who}, and it was not a secret, because the table had read it out.',
    '“It wasn’t me. It was {who}.” {b} said it flatly, as a fact anybody in that room could have supplied.',
    '{a} wanted the list and {b} gave {a} the list. {who}, in the order the names came out.',
    '{b} went through the ballots for {a} from memory and got {who} right, which {a} filed away as its own fact.',
    '“I’m not going to pretend I don’t know,” {b} said. “{who}. You heard it same as me.”',
  ],
  'would-not-say': [
    '{b} had not written the name and would not discuss anybody who had, which {a} found harder to take than the vote.',
    '“I’m not doing that,” {b} said, when {a} asked who else. “Not tonight, not with you, not about them.”',
    '{a} got nothing out of {b} except that it had not been {b}, and {b} clearly did not expect to be believed.',
    '{b} changed the subject twice, pleasantly, and both times {a} let it happen and both times noticed.',
    '“Ask them,” {b} said. That was all {b} said, and {a} spent an hour deciding what it meant.',
  ],
  'reassured-it': [
    '{b} had not written it and said so, and then stayed until {a} stopped shaking about it, which took a while.',
    '“It wasn’t me and it isn’t going to be me,” {b} said, and {a} decided to believe the second half too.',
    '{b} sat with {a} in the corridor for a long time and did not once say anything strategic.',
    '{a} came to check and stayed for the company, and {b} let that happen without commenting on it.',
    '{b} said {a}’s name back to {a}, once, in the tone people use when they mean the whole sentence.',
  ],
};

registerEvent({
  id: 'after-you-wrote-my-name',
  family: 'suspicion',
  window: 'after-table',
  // NOT `roles: 'initiator-first'`. The direction is stable — `{a}` asks and
  // `{b}` answers on every branch — but `reassured-it` is a scene where `{b}`
  // is doing the work and the reaction card belongs to `{a}`, so the field is
  // returned per branch, which is the form `sceneSpeakers` documents for
  // exactly this case.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'boldness', 'strategic', 'social'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const [a] = ctx.actors;
    // {a} has to have taken a vote tonight and still be standing. Nothing to
    // ask about otherwise — and this is a broad gate, because a table spreads
    // its ballots and most survivors collect at least one.
    return votersAgainst(round, a, ctx.living).length ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-you-wrote-my-name');
    const sceneWhy = 'went to the person who might have written their name down';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const against = votersAgainst(round, a, ctx.living);
    const theyWroteIt = against.includes(b);
    const others = against.filter(n => n !== b);
    const st = pStats(b);
    const bond = getBond(a, b);
    // TWO BRANCH SETS, CHOSEN BY THE RECORD RATHER THAN BY THE ROLL. That is
    // what makes the knowledge axis mechanical: `{b}` cannot own a ballot
    // `{b}` did not cast, and cannot hand over a list `{b}` is on.
    const branch = theyWroteIt
      ? forkOn(rng, {
        'owned-it': (st.boldness / 10) * 0.5 + (st.loyalty / 10) * 0.3,
        'denied-it': (1 - st.loyalty / 10) * 0.5 + (st.social / 10) * 0.3,
        'made-it-a-price': (st.strategic / 10) * 0.55 + 0.1,
      })
      : forkOn(rng, {
        'named-the-others': (st.social / 10) * 0.45 + (st.strategic / 10) * 0.3 + (others.length ? 0.25 : 0),
        'would-not-say': (1 - st.social / 10) * 0.5 + (st.loyalty / 10) * 0.25,
        'reassured-it': (st.loyalty / 10) * 0.4 + Math.max(0, bond) / 10 * 0.5,
      });
    const note = line(WROTE_MY_NAME[branch], 'after-you-wrote-my-name', branch, ctx.ep, {
      a, b, who: namesList(others.length ? others : against),
    });
    const bondDelta = branch === 'owned-it' ? 0.5
      : branch === 'denied-it' ? -1.5
        : branch === 'made-it-a-price' ? -0.5
          : branch === 'named-the-others' ? 1
            : branch === 'would-not-say' ? -1 : 2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // BEING ASKED FOR AND REFUSED AN ANSWER IS WHAT RATTLES SOMEBODY, and this
    // is the write the file's header is about: `night` reads it back through
    // `ctx.state`, so the corridor changes what the dark offers.
    if (branch === 'denied-it' || branch === 'would-not-say') {
      api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
    }
    const kind = (branch === 'reassured-it' || branch === 'named-the-others') ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    // `reassured-it` is the one branch where the answerer runs the scene.
    const speaker = branch === 'reassured-it' ? b : a;
    const respondent = branch === 'reassured-it' ? a : b;
    return { branch, pair: [a, b], speaker, respondent, threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 2. THE ROOM GOT IT WRONG — a Faithful is gone, and the
//    ballots say who did it
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.banishedWasTraitor === false`, revealed to the whole
// castle by `revealCascade` before this window runs, plus `round.ballots`,
// which say whether the person having this reaction is one of the people who
// did it. The second half is what stops this being a mood: a scene about
// guilt that cannot say whether the person is guilty of anything is the
// disconnected shape the plan is written against.
const GOT_IT_WRONG = {
  'counted-my-own': [
    '{a} had written {gone} down. {a} knew that before the reveal and had to know it again afterwards.',
    'The name {a} put on that slate was {gone}’s, and there is no version of the evening where that is not true.',
    '{a} said very little after it. {a} had written the name, and saying anything felt like asking to be forgiven for it.',
    'It took {a} about a minute to get from the reveal to the arithmetic: {a} had helped do that.',
    '{a} went over it with {b} and could not get past the one part — {a}’s own ballot, with {gone} on it.',
  ],
  'blamed-the-loudest': [
    '{a} had the name of the person who put {gone} in the room: {loud}, out loud, before a single ballot was written.',
    '“{loud} said it first,” {a} said to {b}. “The rest of us just agreed with it, which I know is not a defence.”',
    '{a} was not looking for absolution. {a} was looking for {loud}, and found {b} instead.',
    '“Who started that?” {a} asked, already knowing. {b} said {loud}’s name and neither of them enjoyed it.',
    '{a} traced {gone}’s whole evening back to one sentence {loud} said at the table, and could not let it go.',
  ],
  'defended-the-vote': [
    '“It was the right read on what we had,” {a} said. “{gone} being wrong doesn’t make the read wrong.”',
    '{a} would not call it a mistake. {a} called it the best available answer to a question with no good ones.',
    '“We are going to get some of these wrong,” {a} said to {b}, evenly. “Tonight was one. It is not the last one.”',
    '{a} laid out the reasoning for {b} again, in order, and it held up, and {gone} was still gone.',
    '{b} expected {a} to be shaken and got something colder and more useful instead.',
  ],
  'went-quiet': [
    '{a} did not want to talk about {gone} and {b} kept finding new ways to ask.',
    '“Not tonight,” {a} said, twice, and the second time {b} stopped.',
    '{a} answered three questions about the table without once saying {gone}’s name.',
    '{b} sat with {a} for a while and got nothing but the sound of somebody deciding not to say something.',
    '{a} left the conversation before it started, politely, and {b} let {a} go.',
  ],
  'alone-with-it': [
    '{a} stood in the corridor for a long time working out how many of them had been wrong, and how loudly.',
    'Nobody saw {a} do the arithmetic. {a} had written {gone} down, and there was nothing to do with that but hold it.',
    '{a} went back over the table from the start and could not find the moment it should have gone differently.',
    'It was not grief exactly. {a} had helped put {gone} in that chair and had been sure at the time.',
    '{a} said {gone}’s name once, to nobody, and did not like how ordinary it sounded.',
    'The corridor was empty and {a} stayed in it, because the alternative was going in and being asked about it.',
    '{a} kept coming back to the same thing: {a} had been certain, and certainty had cost somebody the game.',
    'Nobody was going to ask {a} how {a} felt about it, which was the only mercy the evening had offered.',
    '{a} had been so sure at six o\u2019clock that it had not occurred to {a} to be careful about it.',
    'Somewhere between the table and the stairs {a} stopped being certain, and there was nothing left to be certain at.',
    'It is a strange thing to be told you were wrong by somebody who has already left the building.',
    '{a} thought about the face {gone} had made and decided not to think about it again, and then did.',
    'The room had voted. {a} had voted. {a} kept trying to make those two facts feel like different sizes.',
    '{a} counted how many of them had put {gone}\u2019s name down and stopped counting at a number {a} was in.',
    'There was nobody to apologise to, which {a} found was not the relief it should have been.',
    '{a} washed a cup that did not need washing for about four minutes, which is a way of not going upstairs.',
  ],
};

registerEvent({
  id: 'after-the-room-got-it-wrong',
  family: 'grief',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['temperament', 'loyalty', 'strategic', 'social'],
    knowledge: ['witnessed'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    // The reveal said Faithful. That is the whole gate, and it is true of
    // rather more than half of all tables.
    return round.banishedWasTraitor === false ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-the-room-got-it-wrong');
    const sceneWhy = 'reckoned with a banishment the reveal said was wrong';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const gone = round.banished;
    const wroteIt = ballotOf(round, a) === gone;
    const loudOnes = accusersOf(round, gone, ctx.living);
    const st = pStats(a);
    if (!b) {
      const soloNote = line(GOT_IT_WRONG['alone-with-it'], 'after-the-room-got-it-wrong',
        'alone-with-it', ctx.ep, { a, gone });
      const solo = arcContinue(api, 'grief', [a], ctx.ep, soloNote, { source: sceneWhy });
      // A person who wrote the name and watched the reveal is not fine.
      if (wroteIt) api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
      return { branch: 'alone-with-it', actor: a, subject: gone,
        topic: gone, topicKind: 'after-wrong',
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const branch = forkOn(rng, {
      // Only reachable when the record says so — the same knowledge rule as
      // event 1, applied to a person's own ballot.
      'counted-my-own': wroteIt ? (st.loyalty / 10) * 0.5 + (1 - st.temperament / 10) * 0.35 : 0,
      'blamed-the-loudest': loudOnes.length ? (1 - st.temperament / 10) * 0.45 + (st.boldness / 10) * 0.3 : 0,
      'defended-the-vote': (st.strategic / 10) * 0.45 + (st.temperament / 10) * 0.35,
      'went-quiet': (1 - st.social / 10) * 0.5 + 0.15,
    });
    const note = line(GOT_IT_WRONG[branch], 'after-the-room-got-it-wrong', branch, ctx.ep, {
      a, b, gone, loud: namesList(loudOnes),
    });
    const bondDelta = branch === 'counted-my-own' ? 1.5
      : branch === 'blamed-the-loudest' ? 0.5
        : branch === 'defended-the-vote' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'grief', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: gone,
      topic: gone, topicKind: 'after-wrong',
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 3. THE ROOM GOT IT RIGHT — and now the question is who
//    actually knew
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.banishedWasTraitor === true`, plus the ballots. The
// interesting half is the CONTRADICTION this makes available: a person who
// claims afterwards to have known can be checked against a ballot the whole
// room heard read out, and `overclaimed` is the branch where the record
// disagrees with the claim. Two incompatible stored facts and a listener who
// knows both — the contradiction contract's shape exactly, and it is chosen by
// the record rather than by the roll.
const GOT_IT_RIGHT = {
  'credit-where-due': [
    '{a} had written {gone} down and {b} said so out loud, which {a} had been too superstitious to do.',
    '“You had it,” {b} said. “Before any of us.” {a} had, and the slate says so.',
    '{b} went through the ballots and stopped on {a}’s. “That’s a read. That’s an actual read.”',
    '{a} and {b} both had {gone}’s name on their slates and neither had said a word to the other beforehand.',
    '“We got one,” {b} said to {a}, and it was the first time either of them had been able to say that.',
  ],
  'who-knew': [
    '{a} and {b} worked out who had {gone}’s name tonight — {who} — and what that was worth going forward.',
    'Neither of them had written it. {a} and {b} spent the corridor deciding what {who} having written it meant.',
    '“{who},” {b} said. “Either that is very good or it is very convenient.” {a} had been thinking the same word.',
    '{a} listed the people who got it right and {b} listened without agreeing to any conclusion about them.',
    'The interesting thing was not that {gone} was gone. It was {who}, and both of them knew it.',
  ],
  overclaimed: [
    '{b} explained to {a} how {b} had seen it coming, at some length, having written {other} down instead.',
    '“I knew,” {b} said. {a} had heard {b}’s ballot read out, and it had not said {gone} on it.',
    '{b} claimed the read in front of {a}, and {a} let it go, and wrote it down somewhere permanent.',
    '{a} listened to {b} take credit for a call {b} had not made and did not correct a word of it.',
    '{b} told {a} the whole reasoning, which was excellent, and did not match the name {b} actually wrote.',
  ],
  'next-one': [
    '{a} gave {gone} about four seconds and then asked {b} who was left that looked the same.',
    '“One down,” {b} said, and {a} was already onto the arithmetic of the ones who are not.',
    'Neither {a} nor {b} wanted to celebrate. Both of them wanted to know who {gone} had been sitting with.',
    '{a} and {b} skipped the whole reaction and went straight to what {gone} being right means for tomorrow.',
    '“Who did they eat with?” {a} asked. It is not a sentimental question and {b} answered it seriously.',
  ],
  'on-their-own': [
    '{a} watched the reveal and went straight upstairs to look at it properly without an audience.',
    'Nobody needed to see {a} be pleased about it. {a} went where nobody could.',
    '{a} spent the corridor putting {gone} into the shape of everything {gone} had said this week, and it fitted.',
    'It was the first thing this castle had confirmed for {a}, and {a} took it away to keep.',
    '{a} did the sums alone: who sat with {gone}, who defended {gone}, who never once said the name.',
    'Being right is not the same as being safe, and {a} spent a quiet ten minutes on the difference.',
    '{a} went back over the week with one fact in it that was now certain, and it changed the shape of the rest.',
    'There was nobody in the corridor, which suited {a}, who had a good deal of rearranging to do.',
    '{a} had been carrying a theory all week and the castle had just handed {a} the proof of it.',
    'One name off the board and a great many things behind it now made sense, and {a} wanted an hour with that.',
    '{a} did not celebrate. {a} sat on the stairs and went through the week again with the answer already in it.',
    'It is a quiet sort of pleasure, being right, and {a} took it somewhere nobody would see it.',
    '{a} thought about every person who had argued for {gone} and put a small mark against each of them.',
    'Nothing about the castle had changed and everything about {a}\u2019s map of it had.',
    '{a} said nothing to anybody, because the moment {a} said it out loud somebody would want the reasoning.',
    'The reveal made a week of small things line up, and {a} spent the corridor lining them up again to be sure.',
  ],
};

registerEvent({
  id: 'after-the-room-got-it-right',
  family: 'trust',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['strategic', 'intuition', 'social', 'boldness'],
    knowledge: ['witnessed', 'misinformed'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    return round.banishedWasTraitor === true ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-the-room-got-it-right');
    const sceneWhy = 'took apart a banishment the reveal said was right';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const gone = round.banished;
    const rightOnes = votersAgainst(round, gone, ctx.living);
    if (!b) {
      const soloNote = line(GOT_IT_RIGHT['on-their-own'], 'after-the-room-got-it-right',
        'on-their-own', ctx.ep, { a, gone });
      const solo = arcContinue(api, 'trust', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'on-their-own', actor: a, subject: gone,
        topic: gone, topicKind: 'after-right',
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const aWasRight = rightOnes.includes(a);
    const bWasRight = rightOnes.includes(b);
    const bVoted = ballotOf(round, b);
    const st = pStats(b);
    const branch = forkOn(rng, {
      // Somebody has to have actually been right for anybody to be credited.
      'credit-where-due': (aWasRight || bWasRight) ? (st.social / 10) * 0.45 + (st.loyalty / 10) * 0.35 : 0,
      'who-knew': rightOnes.length ? (st.intuition / 10) * 0.45 + (st.strategic / 10) * 0.35 : 0,
      // Only available when the record CONTRADICTS the claim: {b} did not
      // write the name and there is another name on the slate to name.
      overclaimed: (!bWasRight && bVoted) ? (st.boldness / 10) * 0.4 + (1 - st.loyalty / 10) * 0.35 : 0,
      'next-one': (st.strategic / 10) * 0.4 + (st.mental / 10) * 0.3,
    });
    const note = line(GOT_IT_RIGHT[branch], 'after-the-room-got-it-right', branch, ctx.ep, {
      a, b, gone, who: namesList(rightOnes), other: bVoted || gone,
    });
    const bondDelta = branch === 'credit-where-due' ? 2
      : branch === 'who-knew' ? 1 : branch === 'overclaimed' ? -1 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'overclaimed' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    // On `overclaimed` and `credit-where-due` it is `{b}` doing the talking.
    const bTalks = branch === 'overclaimed' || branch === 'credit-where-due';
    return { branch, pair: [a, b], speaker: bTalks ? b : a, respondent: bTalks ? a : b,
      subject: gone, topic: gone, topicKind: 'after-right', threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 3b. THE CIRCLE HARBOURED ONE — the reveal said Traitor, and
//    it was somebody {a} had sat with all week
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.banishedWasTraitor === true`, plus a PUBLIC alliance edge
// — `{a}` was in the revealed Traitor's circle. That is the fact the whole
// castle can see (the format runs on who sits with whom) and it is the fact
// this scene is about: not "a Traitor is gone" but "the Traitor was one of
// MINE, and now I have to decide what my own circle is worth." No alignment is
// read — `wasAllied` reads the stored bond and stat affinity, the same public
// test the vote bias runs on — so a Faithful may lead this scene freely; being
// fooled by a Traitor is a Faithful experience, the one nobody is spared.
//
// `{a}` IS THE CIRCLE SURVIVOR, `{b}` THE PERSON THEY TALK IT OUT WITH — who
// may or may not have been in the circle too. Gating on BOTH being circle-mates
// made the scene almost unreachable: `_sceneActors` draws pairs uniformly (or
// off an open thread), and two of one small surviving circle land together
// about 0.4% of a draw — over 120 seasons the scene fired zero times. Requiring
// only the LEAD to be a circle survivor widens it to any pair that includes one,
// which is what makes the fallout something the season actually shows.
//
// It goes BOTH WAYS by `{a}`'s archetype, on purpose. A loyal survivor closes
// ranks and holds their remaining people tighter (bond up); a strategic one
// audits who else sat with the Traitor (paranoia, bond flat); a low-intuition
// one cannot trust their own read any more (bond down, paranoid); a bold,
// disloyal one cuts the whole circle loose (bond down hard). WHO was in the
// circle decides whether it hardens into a faction or scatters into free
// agents — which is the whole point of building alliances out of the cast entry.
const CIRCLE_HARBOURED = {
  'closed-ranks': [
    '“So one of them wasn’t what I thought,” {a} told {b}. “Fine. I trust who I trust, and I trust harder now.”',
    '{a} had sat with {gone} all week and did not fall apart about it — {a} pulled the people {a} had left in closer, {b} among them.',
    '“I’m not going to stop trusting people because {gone} lied to me,” {a} said to {b}. “That is exactly what they would want.”',
    '{b} expected {a} to be shaken and found {a} steadier instead: fewer people, held tighter, and {a} said as much out loud.',
    '“I picked wrong on {gone},” {a} admitted to {b}. “I do not think I have picked wrong on everyone.”',
  ],
  'who-else': [
    '“If {gone} fooled me, who else was in that little group?” {a} asked, and {b} could see {a} already listing them.',
    '{a} stopped grieving {gone} fast and started counting who {gone} had spent the week whispering with, out loud, to {b}.',
    '“One in that circle usually means two,” {a} said to {b}. Neither of them enjoyed where the sentence pointed.',
    '{a} walked {b} through everyone {gone} had eaten with, in order, and left the conclusion sitting there for {b} to pick up.',
    '“I vouched for {gone},” {a} said. “So somebody should be looking hard at me — unless I look harder first.”',
  ],
  'couldnt-see-it': [
    '“I sat next to {gone} every single morning,” {a} said to {b}. “How did I not see one thing?”',
    '{a} could not get past it: if {a} had missed it in {gone}, {a} had no idea what {a} was missing in anybody else.',
    '“I would have sworn on {gone},” {a} told {b}, and the way {a} said it made {b} wonder who else {a} had sworn on.',
    '{a} kept turning it over with {b} — the same week, the same person, and not one moment in it that had felt wrong.',
    '{b} tried to steady {a} and it did not take, because the lesson of the night was that steady is easy to fake.',
  ],
  'cut-loose': [
    '“I am not carrying {gone}’s name around,” {a} told {b}. “Whatever that group was, I am out of it as of tonight.”',
    '{a} started putting daylight between {a} and everyone {gone} had been close to, and did not much care who noticed.',
    '“That circle is a target now,” {a} said to {b}. “I would rather stand alone than be the last one in {gone}’s club.”',
    '{a} was pleasant about it and completely clear: whatever {a} had been part of, {a} would be seen on {a}’s own now.',
    '“Nothing personal,” {a} said, which {b} understood to mean {a} was cutting a good many things loose at once.',
  ],
};

registerEvent({
  id: 'after-the-circle-harboured-one',
  family: 'trust',
  window: 'after-table',
  advancesThread: true,
  // NOT citesResidue. This is a REACTION to tonight's reveal, not a callback:
  // it opens or advances a trust thread about the betrayal, but it names no
  // earlier day, so declaring citesResidue would put it in the citing-event
  // sweep (tr-castle.test.js) as content that promises a citation it never
  // writes — and its alliance-edge precondition is not constructible in that
  // sweep's probe world anyway.
  variationAxes: {
    // The pool's own vocabulary, not this event's branch names. The four
    // words below are what the other 130 events classify with; the branch
    // strings (tightened/fractured/paranoid/severed) stay where they
    // belong, on the branch, and tests/tr-castle-reachability.test.js
    // still guards each of them by name.
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'intuition', 'boldness'],
    knowledge: ['witnessed'],
    relationship: ['close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    if (round.banishedWasTraitor !== true) return 0;
    const [x, y] = ctx.actors;
    const gone = round.banished;
    // AT LEAST ONE of the pair has to have been in the revealed Traitor's
    // circle — that person leads. `wasAllied` reads the bond that stood when
    // `gone` was alive, so it still answers the moment after the banishment.
    return (wasAllied(x, gone) || wasAllied(y, gone)) ? 4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-the-circle-harboured-one');
    const sceneWhy = 'sat with a circle-mate the reveal had just called a Traitor';
    const round = table(ctx);
    const gone = round.banished;
    // THE CIRCLE SURVIVOR LEADS. If both were in it, actor order stands; the
    // reaction card belongs to `{a}` either way.
    const [x, y] = ctx.actors;
    const a = wasAllied(x, gone) ? x : y;
    const b = a === x ? y : x;
    const st = pStats(a);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      // A loyal survivor hardens what circle is left around the loss.
      'closed-ranks': (st.loyalty / 10) * 0.5 + (st.social / 10) * 0.25 + Math.max(0, bond) / 10 * 0.25,
      // A strategic survivor turns outward and audits the rest of the circle.
      'who-else': (st.strategic / 10) * 0.5 + (st.intuition / 10) * 0.3,
      // A survivor who trusts their own read cannot, tonight, and it shows.
      'couldnt-see-it': (1 - st.intuition / 10) * 0.45 + (st.temperament / 10) * 0.25 + 0.1,
      // A bold, low-loyalty survivor treats the circle as a liability and leaves it.
      'cut-loose': (st.boldness / 10) * 0.45 + (1 - st.loyalty / 10) * 0.4,
    });
    const note = line(CIRCLE_HARBOURED[branch], 'after-the-circle-harboured-one', branch, ctx.ep, {
      a, b, gone,
    });
    // The circle either hardens (up) or comes apart (down), by branch. These
    // sizes match the file's other trust scenes, so the fallout bends the bond
    // graph — and therefore next episode's blocs and vote bias — without
    // snapping it.
    const bondDelta = branch === 'closed-ranks' ? 2
      : branch === 'who-else' ? -0.5
        : branch === 'couldnt-see-it' ? -1.5 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // The two branches where the shared trust actually cracked leave the
    // survivor rattled going into the night, the same write `after-you-wrote-my-name`
    // makes and `post-banishment` reads back.
    if (branch === 'couldnt-see-it' || branch === 'cut-loose') {
      api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
    }
    const kind = (branch === 'closed-ranks') ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      subject: gone, topic: gone, topicKind: 'after-right',
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 4. TWO PEOPLE SAID MY NAME — the accusation record, and
//    what surviving it does to somebody
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.accusations`, which `debate()` fills with one entry per
// speaker naming their top read. Two or more of them landing on one person is
// a real, public, countable thing that happened in front of the whole castle,
// and it is the honest source for a scene about pressure — as opposed to
// "tension rises", which is the sentence this file exists instead of.
const SAID_MY_NAME = {
  'asked-them-why': [
    '{a} went and found {b} afterwards. “You said my name. I’d rather hear the reason from you than from anybody else.”',
    '“You had me,” {a} said to {b}. “At the table, out loud. What did you see?”',
    '{a} did not shout about it. {a} asked {b} what {b} had, and waited through the whole answer.',
    '“Say it to me the way you said it to them,” {a} told {b}, and {b} did, and it was shorter.',
    '{a} put it to {b} directly, because {b} had put it to the room directly first.',
  ],
  'worked-the-room': [
    '{a} had {said} to answer for and started with {b}, who had not been one of them.',
    '“{said} had my name tonight,” {a} said. “I need to know whether you were nearly one of them.”',
    '{a} went round the survivors in order and {b} was the first stop, for reasons {a} did not explain.',
    '{a} counted the people who had said it — {said} — and then went looking for the ones who had not.',
    '“I’m not asking you to defend me,” {a} said to {b}. “I’m asking whether you agreed with {said}.”',
  ],
  rattled: [
    '{a} got through the conversation with {b} and did not get through the hour after it.',
    'Hearing the name said twice at a table does something, and {b} watched it doing it to {a}.',
    '{a} kept coming back to it with {b} — the same sentence, three times, slightly differently each time.',
    '{b} said all the right things and {a} was still counting {said} on the way up the stairs.',
    '“I’m fine,” {a} told {b}, in the voice of somebody who has just heard their own name twice in public.',
  ],
  hardened: [
    '{a} came out of that table sharper than {a} went in, and {b} was the first person to notice.',
    '“{said},” {a} said to {b}, unbothered. “Good. Now I know exactly where they are.”',
    '{a} treated the whole thing as information rather than as an attack, and {b} found that slightly unnerving.',
    'Something in {a} settled after being named. {b} could not decide whether that was strength or a tell.',
    '{a} thanked {b} for nothing in particular and went to work on the list.',
  ],
  'counted-them': [
    '{a} sat on the stairs afterwards and counted the people who had said the name out loud: {said}.',
    'Nobody was watching, so {a} stopped pretending it had not landed. {said}, and both times in public.',
    '{a} went over the table in order, twice, and both times stopped at the same two voices.',
    '{said} had said {a}’s name in front of the room, and {a} spent the corridor deciding what that cost.',
    '{a} had held it together in there. Out here, on {a}’s own, {a} did not have to.',
    'Being named twice in one evening is a fact, and {a} sat with the fact rather than with the feeling.',
    '{a} said the names back to {a}’s self — {said} — and put each one somewhere it would keep.',
    'There is a version of tomorrow where this does not matter. {a} could not find it in the corridor.',
  ],
};

registerEvent({
  id: 'after-two-people-said-my-name',
  family: 'suspicion',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'boldness', 'social', 'strategic'],
    knowledge: ['witnessed'],
    relationship: ['rival', 'neutral', 'close-ally'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const [a] = ctx.actors;
    // TWO IS THE BAR, and it is the same bar `emotionalStateOf` uses: one
    // person naming somebody is ordinary debate noise, because `debate()` has
    // every speaker name their top read.
    return accusersOf(round, a, ctx.living).length >= 2 ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-two-people-said-my-name');
    const sceneWhy = 'answered for a name that was said out loud at the table';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const said = accusersOf(round, a, ctx.living);
    const st = pStats(a);
    if (!b) {
      const soloNote = line(SAID_MY_NAME['counted-them'], 'after-two-people-said-my-name',
        'counted-them', ctx.ep, { a, said: namesList(said) });
      const solo = arcContinue(api, 'suspicion', [a], ctx.ep, soloNote, { source: sceneWhy });
      api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
      return { branch: 'counted-them', actor: a, threadId: solo.thread?.id,
        cited: solo.cited, bondDelta: 0 };
    }
    const bSaidIt = said.includes(b);
    const branch = forkOn(rng, {
      'asked-them-why': bSaidIt ? (st.boldness / 10) * 0.55 + (st.temperament / 10) * 0.25 : 0,
      'worked-the-room': bSaidIt ? 0 : (st.social / 10) * 0.45 + (st.strategic / 10) * 0.35,
      rattled: (1 - st.temperament / 10) * 0.55 + 0.15,
      hardened: (st.temperament / 10) * 0.4 + (st.strategic / 10) * 0.35,
    });
    const note = line(SAID_MY_NAME[branch], 'after-two-people-said-my-name', branch, ctx.ep, {
      a, b, said: namesList(said),
    });
    const bondDelta = branch === 'asked-them-why' ? -0.5
      : branch === 'worked-the-room' ? 0.5 : branch === 'rattled' ? 1 : 0;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'rattled') api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
    const kind = branch === 'asked-them-why' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 5. THE LAST THING THEY SAID — somebody left a name behind
//    on the way out of the door
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `round.exitSpeech` (js/tr/exit.js), which carries `burns` and a
// `target`, and is said in front of the whole castle. It is the single most
// citable public fact this window has and nothing in the pool read it. A
// leaver's accusation is worth exactly what the room decides it is worth,
// which is why three of the five branches are the room deciding it is worth
// nothing.
const LAST_THING = {
  'answered-it': [
    '“{gone} said my name on the way out,” {named} said, to {b}, before {b} could raise it. “Ask me anything you like.”',
    '{named} did not wait for the question. {named} took {b} through the whole week, in order, unprompted.',
    '{named} answered {gone}’s parting shot the way you answer a thing you have been expecting for days.',
    '“That was a guess,” {named} said to {b}. “A loud one, at the door, from somebody with nothing left to lose.”',
    '{b} raised it once and {named} had an answer ready, which {b} noted was itself a kind of information.',
  ],
  'let-it-stand': [
    '{named} said nothing about it at all, and {b} could not stop noticing the shape of the nothing.',
    '{gone} had named {named} at the door. {named} did not mention it once, and {b} was the one who could not let it go.',
    '“You’re not going to answer that?” {b} asked. {named} said no, and did not explain the no.',
    '{named} let {gone}’s last sentence sit there all evening and never once picked it up.',
    '{b} gave {named} three separate openings to deny it and {named} took none of them.',
  ],
  'picked-it-up': [
    '{b} took {gone}’s parting name and started carrying it. By the end of the corridor {named} was a question.',
    '“{gone} had no reason to lie at that point,” {b} said. It is not true and it is very persuasive.',
    '{b} repeated what {gone} had said about {named}, to {named}’s face, to see what it did.',
    '{b} decided {gone}’s last sentence was worth something and made sure {named} knew it had been decided.',
    '“People tell the truth at the door,” {b} said, which is a thing people say, and {named} had no answer for it.',
  ],
  dismissed: [
    '“{gone} was always going to name somebody,” {b} said to {named}. “It happened to be you.”',
    '{b} threw {gone}’s last accusation out in one sentence and {named} was more grateful than {named} let on.',
    '“That’s a leaver talking,” {b} said. “I’ve stopped listening to leavers.” {named} did not argue.',
    '{b} pointed out that {gone} had named {named} about nine seconds after being banished, and left it there.',
    '{b} treated the whole thing as noise, out loud, in front of {named}, which was itself a decision.',
  ],
  'alone-with-it': [
    '{named} went upstairs with {gone}’s last sentence and did not put it down for an hour.',
    'Nobody was going to say it to {named}’s face, so {named} said it to {named}’s own reflection instead.',
    '{gone} had said {named}’s name at the door, and {named} spent the corridor working out who had believed it.',
    'The worst part was not the accusation. It was that {named} could not tell who in that room had nodded.',
    '{named} replayed the door twice and could not decide whether {gone} had meant it or had just needed a name.',
    'It is one sentence from somebody who is already gone. {named} could not make it weigh nothing.',
    '{named} counted the faces that had been looking at {gone} and the faces that had turned to look at {named}.',
    'Alone, {named} finally let it land, which is not the same as letting it go.',
    'A person on their way out the door has nothing left to lose, and {named} kept coming back to that.',
    '{named} tried out four different reasons {gone} might have picked {named}, and did not like the simplest one.',
    'It would have been easier if {gone} had been angry. {gone} had not been angry, and that was the problem.',
    '{named} did the sum that nobody says out loud: how much of tomorrow that one sentence had already spent.',
    'By the time the corridor lights went off {named} had a plan for the morning and no confidence in it.',
    '{named} wanted very badly to have said something back, and had not, and now could not.',
    'There is no answering somebody who has already gone through the door, and {named} tried anyway, out loud, alone.',
    '{named} went upstairs deciding whether to raise it first thing or let the room forget, and got no further.',
  ],
};

registerEvent({
  id: 'after-the-last-thing-they-said',
  family: 'suspicion',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'social', 'strategic'],
    knowledge: ['witnessed', 'heard-with-source'],
    relationship: ['neutral', 'rival', 'close-ally'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const sp = round.exitSpeech;
    if (!sp || !sp.burns || !sp.target) return 0;
    // The named person has to be in the scene, and still here to be named at.
    if (!ctx.living?.includes(sp.target)) return 0;
    return ctx.actors.includes(sp.target) ? 3.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-the-last-thing-they-said');
    const sceneWhy = 'dealt with the name the banished player left behind';
    const round = table(ctx);
    const gone = round.banished;
    const named = round.exitSpeech.target;
    const b = ctx.actors.find(n => n !== named) || null;
    if (!b) {
      const soloNote = line(LAST_THING['alone-with-it'], 'after-the-last-thing-they-said',
        'alone-with-it', ctx.ep, { named, gone });
      const solo = arcContinue(api, 'suspicion', [named], ctx.ep, soloNote, { source: sceneWhy });
      api.setEmotionalState(named, 'paranoid', { source: sceneWhy });
      return { branch: 'alone-with-it', actor: named, subject: gone,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const sn = pStats(named);
    const sb = pStats(b);
    const bond = getBond(named, b);
    const branch = forkOn(rng, {
      'answered-it': (sn.boldness / 10) * 0.5 + (sn.social / 10) * 0.3,
      'let-it-stand': (1 - sn.social / 10) * 0.45 + (sn.temperament / 10) * 0.3,
      'picked-it-up': (sb.strategic / 10) * 0.45 + Math.max(0, -bond) / 10 * 0.4,
      dismissed: (sb.loyalty / 10) * 0.4 + Math.max(0, bond) / 10 * 0.45,
    });
    const note = line(LAST_THING[branch], 'after-the-last-thing-they-said', branch, ctx.ep, {
      named, b, gone,
    });
    const bondDelta = branch === 'answered-it' ? 0.5
      : branch === 'let-it-stand' ? -1 : branch === 'picked-it-up' ? -2 : 2;
    api.addBond(named, b, bondDelta, { source: sceneWhy });
    if (branch === 'picked-it-up') api.setEmotionalState(named, 'paranoid', { source: sceneWhy });
    const kind = branch === 'dismissed' ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [named, b], ctx.ep, note, { source: sceneWhy });
    // THE DIRECTION IS THE BRANCH'S, NOT THE EVENT'S. On two of these the
    // named player answers for themselves; on the other two `{b}` is the one
    // doing something and the named player is the one being done to.
    const namedDrives = branch === 'answered-it' || branch === 'let-it-stand';
    return { branch, pair: [named, b],
      speaker: namedDrives ? named : b, respondent: namedDrives ? b : named,
      subject: gone, threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 6. THE COUNT MOVED — two slates, two weeks, and a
//    difference anybody in that room could check
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: two rounds of `ballots`, both read out loud. This is the only
// event in the pool that compares tonight's table with the last one, and the
// comparison is what makes the KNOWLEDGE axis real: which of the five branches
// is even available is decided by whether `{b}` was with `{a}` last week, this
// week, both or neither. `flat-denial` is the contradiction shape — `{b}`
// disputing an account of a ballot the whole castle heard read out — and it is
// reachable only when the record says `{b}` did in fact move.
const COUNT_MOVED = {
  'with-me-again': [
    '{a} and {b} had written the same name two tables running, and neither of them had planned it either time.',
    '“Twice now,” {a} said to {b}. “Either we are reading the same thing or we are both wrong the same way.”',
    '{a} noticed that {b}’s slate had matched {a}’s again and decided that was worth saying out loud.',
    'Two nights, two slates, one name each time. {a} and {b} were the last to work out that they were a bloc.',
    '“You had {them} as well,” {b} said. {a} had. It was the second week that had happened.',
  ],
  'moved-off': [
    '{b} had been on {a}’s name last week and was not tonight, and {a} had heard both slates read out.',
    '“Last table we wrote the same name,” {a} said. “Tonight you wrote {them}. Talk me through it.”',
    '{a} did not accuse {b} of anything. {a} just recited both of {b}’s ballots back to {b}, in order.',
    'The difference between {b}’s two slates was a whole week of something {a} had not been told about.',
    '“What changed?” {a} asked {b}, and the honest answer would have taken longer than {b} was willing to spend.',
  ],
  'came-across': [
    '{b} had not been with {a} last week and was tonight, and {a} wanted to know what had done it.',
    '“You came across,” {a} said to {b}. “I noticed. I want to know whether it was me or the room.”',
    '{a} had watched {b} write a name {a} had not expected, and it had been the same name {a} wrote.',
    '{b} joined {a} on a slate without discussing it first, which {a} found both useful and strange.',
    '“Same name, no conversation,” {b} said to {a}. “That is either very good or slightly worrying.”',
  ],
  'never-with-me': [
    '{a} and {b} had not written the same name once, across two tables, and both of them had noticed.',
    '“We have never agreed. Not once.” {a} said it flatly to {b}, as an observation rather than a complaint.',
    '{a} laid both weeks out for {b}: four slates between them, no overlap at all.',
    '{b} pointed out, before {a} could, that the two of them had never once been on the same name.',
    'Two tables in and {a} and {b} had voted opposite each other every time, which is data, and both of them read it.',
  ],
  'flat-denial': [
    '{b} said {b} had been on {a}’s name last week. {b} had not been, and it had been read out in front of both of them.',
    '“I have been with you the whole time,” {b} said, over a record {a} had heard with {a}’s own ears.',
    '{a} let {b} rewrite last week’s slate out loud and did not correct one word of it.',
    '{b} was very warm about how consistent {b} had been, which {a} priced accordingly.',
    '“Both weeks,” {b} said. It was one week, and {a} knew which.',
  ],
};

registerEvent({
  id: 'after-the-count-moved',
  family: 'testing',
  window: 'after-table',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['strategic', 'loyalty', 'social', 'boldness'],
    knowledge: ['witnessed', 'misinformed'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const rounds = gs.tr?.rounds || [];
    // A comparison needs two tables. From the second banishment onward that is
    // true of every night, which is what makes this a broad gate rather than a
    // signature one.
    const prev = rounds[rounds.length - 2];
    return (prev && prev.ballots?.length) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-the-count-moved');
    const sceneWhy = 'compared two weeks of slates out loud';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const rounds = gs.tr?.rounds || [];
    const prev = rounds[rounds.length - 2] || round;
    const nowTogether = !!ballotOf(round, a) && ballotOf(round, a) === ballotOf(round, b);
    const thenTogether = !!ballotOf(prev, a) && ballotOf(prev, a) === ballotOf(prev, b);
    const st = pStats(b);
    // THE RECORD PICKS THE SET, THE STATS PICK WITHIN IT — the same shape as
    // event 1, and the reason both axes are implemented rather than declared.
    let branch;
    if (nowTogether && thenTogether) branch = 'with-me-again';
    else if (nowTogether) branch = 'came-across';
    else if (thenTogether) {
      branch = forkOn(rng, {
        'moved-off': (st.loyalty / 10) * 0.5 + (st.boldness / 10) * 0.25,
        'flat-denial': (1 - st.loyalty / 10) * 0.5 + (st.social / 10) * 0.3,
      });
    } else branch = 'never-with-me';
    const note = line(COUNT_MOVED[branch], 'after-the-count-moved', branch, ctx.ep, {
      a, b, them: ballotOf(round, b) || round.banished,
    });
    const bondDelta = branch === 'with-me-again' ? 2
      : branch === 'came-across' ? 1.5
        : branch === 'moved-off' ? -1 : branch === 'flat-denial' ? -2 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = (branch === 'with-me-again' || branch === 'came-across') ? 'trust' : 'testing';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 7. THE EMPTY SEAT — grief attached to a real relationship
//    with the person who is actually gone
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: the bond ledger, and tonight's banishment. The causal contract's
// hardest sentence about this window is that grief must attach to a REAL bond
// with the person who left — "Bowie grieves because his stored bond with
// Miriam was high" — so this event will not fire without one, in either
// direction. A strong negative bond is the `relieved` branch, and it is a
// different scene rather than the same one with a minus sign in front of it.
const EMPTY_SEAT = {
  mourned: [
    '{a} liked {gone}, plainly and without strategy, and told {b} so in the corridor afterwards.',
    '“I’m allowed to just be sad about it,” {a} said to {b}, and {b} agreed that {a} was.',
    '{a} could not make {gone} into a game piece even now, and {b} stopped trying to help {a} do it.',
    '{b} found {a} still holding the back of the chair {gone} had been sitting in an hour earlier.',
    '{a} said something small and true about {gone} to {b} and then could not say anything else for a while.',
  ],
  relieved: [
    '{a} did not pretend to {b} that {gone} leaving was bad news, which {b} respected and filed.',
    '“I’m not going to stand here and lie about it,” {a} said. {a} and {gone} had not been friends.',
    '{a} was lighter about it than the evening warranted, and {b} watched {a} not bother to hide that.',
    '“One less person in this castle who has a problem with me,” {a} said to {b}, and meant every word.',
    '{b} asked {a} how {a} was doing and got an honest answer that surprised them both.',
  ],
  guilty: [
    '{a} had written {gone} down. {a} told {b} that before {b} had asked anything at all.',
    '“I wrote it and I liked them,” {a} said. “Both of those are true and I can’t make them fit.”',
    '{a} kept explaining the vote to {b} long after {b} had stopped needing it explained.',
    '{b} did not judge {a} for it and {a} could not stop apologising to somebody who was not owed one.',
    '{a} had known {gone} better than most and had still put the name down, and could not get past it.',
  ],
  'angry-at-the-room': [
    '“{who} put that name in the air,” {a} said to {b}, about {gone}. “I want that remembered.”',
    '{a} was not sad about {gone} so much as furious with {who}, and said so, twice.',
    '{a} named {who} to {b} as the reason {gone} is gone, and did not soften it for the corridor.',
    '“Somebody talked that room into it,” {a} said. {a} had a name, and {a} said the name: {who}.',
    '{a} went looking for {b} specifically to say {who}’s name out loud to a witness.',
  ],
  'on-their-own': [
    '{a} sat with the fact of {gone} being gone and did not go and find anybody to sit with.',
    'Nobody saw {a} do it, which is the only reason {a} let it happen at all.',
    '{a} went past the empty chair twice on purpose before going upstairs.',
    'There was a thing {a} had meant to say to {gone} tomorrow, and {a} stood in the corridor holding it.',
    '{a} had known {gone} well enough that this one actually cost something, and nobody needed to see that.',
    'It is easier to be sad about somebody when there is nobody there asking what it means.',
    '{a} did not say {gone}’s name to anybody all evening and said it once, alone, on the stairs.',
    'The castle was noisy. {a} found the one corridor that was not and stayed in it.',
    '{a} kept expecting {gone} to come round the corner, and kept being wrong about it.',
    'They had been the two who did the washing up. {a} did it alone tonight and took a long time over it.',
    '{a} sat in the chair next to the one nobody would be in tomorrow and stayed there a while.',
    'It is a particular kind of tired, losing the one person in a building you did not have to explain yourself to.',
    '{a} caught themselves about to go and tell {gone} something, twice, in the same hour.',
    'Nobody in this castle knew what {gone} had been to {a}, and {a} was not about to start telling them.',
    '{a} had a good four things to be strategic about and could not make any of them matter tonight.',
    'The room {gone} had slept in had the door shut, and {a} walked past it twice without opening it.',
  ],
};

registerEvent({
  id: 'after-the-empty-seat',
  family: 'grief',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'temperament', 'social', 'boldness'],
    relationship: ['close-ally', 'rival'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const [a] = ctx.actors;
    // A REAL RELATIONSHIP WITH THE PERSON WHO LEFT, in either direction. The
    // causal contract's own worked example, applied as a gate rather than as
    // an intention.
    return Math.abs(getBond(a, round.banished)) >= 3 ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-the-empty-seat');
    const sceneWhy = 'sat with the chair the banished player had been in';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const gone = round.banished;
    const bond = getBond(a, gone);
    const wroteIt = ballotOf(round, a) === gone;
    const loudOnes = accusersOf(round, gone, ctx.living);
    const st = pStats(a);
    if (!b) {
      const soloNote = line(EMPTY_SEAT['on-their-own'], 'after-the-empty-seat',
        'on-their-own', ctx.ep, { a, gone });
      const solo = arcContinue(api, 'grief', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'on-their-own', actor: a, subject: gone,
        topic: gone, topicKind: 'seat-loss',
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const branch = forkOn(rng, {
      mourned: bond >= 3 ? (st.loyalty / 10) * 0.5 + (st.social / 10) * 0.3 : 0,
      relieved: bond <= -3 ? (st.boldness / 10) * 0.5 + 0.25 : 0,
      guilty: (bond >= 3 && wroteIt) ? (st.loyalty / 10) * 0.6 + (1 - st.temperament / 10) * 0.3 : 0,
      'angry-at-the-room': (bond >= 3 && loudOnes.length)
        ? (1 - st.temperament / 10) * 0.5 + (st.boldness / 10) * 0.3 : 0,
    });
    const note = line(EMPTY_SEAT[branch], 'after-the-empty-seat', branch, ctx.ep, {
      a, b, gone, who: namesList(loudOnes),
    });
    const bondDelta = branch === 'mourned' ? 2
      : branch === 'relieved' ? 0.5 : branch === 'guilty' ? 1.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'grief', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: gone,
      topic: gone, topicKind: 'seat-loss',
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 8. NOBODY SAID OUR NAMES — the complement, and the
//    strategic problem of being invisible
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: the SAME two lists as events 1 and 4, read the other way round.
// Neither of these two took a vote and neither was named out loud, and that is
// a checkable fact about a table rather than the absence of one. It is also
// the part of the format nothing in the pool covered: it was full of people
// under pressure and had nothing at all for the two the room walked straight
// past, which is a real and slightly frightening position to be in.
const NOBODY_SAID = {
  'quietly-pleased': [
    'Neither {a} nor {b} had heard their own name once all evening, and each had noticed the other one hadn’t either.',
    '“Clean sheet,” {b} said to {a}, meaning the whole table, and both of them knocked on something wooden.',
    '{a} and {b} compared evenings and found they had had the same one: nothing at all.',
    'Nobody wrote either of them down. {a} said so out loud to {b} and immediately wished {a} hadn’t.',
    '“That’s two of us they didn’t look at,” {a} said. {b} had already done that arithmetic.',
  ],
  'worried-by-it': [
    '“Nobody said my name,” {a} said to {b}. “I don’t think that means what you think it means.”',
    '{a} could not decide whether being ignored by that room was safety or a category, and said so.',
    '“They are not frightened of us,” {b} said to {a}. “That is what tonight was.”',
    '{a} would rather have been named. {a} tried to explain that to {b} and made a decent job of it.',
    'Two people got through a whole table without being mentioned, and {a} found that unnerving rather than restful.',
  ],
  'made-it-a-plan': [
    '{a} and {b} agreed to keep doing what had kept them off the table — stay quiet, vote together, let louder people draw the room’s attention.',
    'Neither had been named. {a} and {b} spent the corridor turning that into something deliberate.',
    '”Same again next week,” {b} said — same seats, same quiet, same way of staying out of everyone’s mouth — and {a} agreed to all of it.',
    '{a} and {b} treated the quiet evening as a method rather than as luck, and settled it between them.',
    'They came out of it with an actual arrangement, {a} and {b}, which is more than most corridors produce.',
  ],
  'one-of-us-is-lying': [
    '{a} pointed out to {b} that two people getting through a table untouched is either luck or a reason.',
    '“Why weren’t you named?” {a} asked {b}, pleasantly. It is a horrible question and it is a fair one.',
    '{b} laughed and then stopped, because {a} had not been joking about the arithmetic.',
    '{a} counted off the people who take it every week and worked out, out loud, that {b} is not one of them.',
    '“Being invisible is a skill,” {a} said to {b}. “I would like to know where you learned it.”',
  ],
};

registerEvent({
  id: 'after-nobody-said-our-names',
  family: 'trust',
  window: 'after-table',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['strategic', 'social', 'intuition', 'boldness'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const [a, b] = ctx.actors;
    const clean = n => !votersAgainst(round, n, ctx.living).length
      && !accusersOf(round, n, ctx.living).length;
    return (clean(a) && clean(b)) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-nobody-said-our-names');
    const sceneWhy = 'worked out what a table that ignored them both was worth';
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      'quietly-pleased': (st.social / 10) * 0.4 + Math.max(0, bond) / 10 * 0.4,
      'worried-by-it': (st.intuition / 10) * 0.5 + (1 - st.temperament / 10) * 0.25,
      'made-it-a-plan': (st.strategic / 10) * 0.5 + Math.max(0, bond) / 10 * 0.3,
      'one-of-us-is-lying': (st.boldness / 10) * 0.35 + Math.max(0, -bond) / 10 * 0.45,
    });
    const note = line(NOBODY_SAID[branch], 'after-nobody-said-our-names', branch, ctx.ep, { a, b });
    const bondDelta = branch === 'quietly-pleased' ? 1
      : branch === 'worried-by-it' ? 0.5
        : branch === 'made-it-a-plan' ? 2.5 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'one-of-us-is-lying' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 9. SOMEBODY GOES TONIGHT — the hour between the table and
//    the dark, when the castle knows what happens next and not to whom
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: that a pact exists and has not been emptied. That is PUBLIC —
// the format announces it on night one and the reveal cascade keeps the count
// honest — and it is the only alignment read in this event: `isTraitor(a)`,
// the acting player's own role, which is the one read a castle event is
// allowed (probes A/B/C, tests/tr-castle.test.js). Nothing here names tonight's
// target, because nothing in this scene knows it: `_night` has not run.
//
// THE ALIGNMENT AXIS IS MECHANICAL HERE and is the reason the event exists in
// this file rather than as a fifth branch somewhere else. A Faithful having
// this conversation is afraid; somebody on the pact is doing an impression of
// being afraid, an hour before doing the thing. `performed-it` is available
// only to the second, and it is the same corridor either way.
const GOES_TONIGHT = {
  'said-it-out-loud': [
    '“One of us isn’t coming down in the morning,” {a} said to {b}, because somebody had to say it.',
    '{a} put it plainly to {b}: the table is finished, and the other thing has not started yet.',
    '“I hate this hour,” {a} told {b}. “The table I can argue with. This part I can’t.”',
    '{a} said the quiet part to {b} in the corridor and neither of them pretended to be surprised by it.',
    '“Say goodnight properly,” {a} said to {b}, and it was a joke, and it was not one.',
  ],
  'would-not-say-it': [
    '{b} would not talk about the rest of the night, and {a} noticed how carefully {b} would not.',
    '{a} raised it twice and {b} changed the subject twice, and the second one was clumsy.',
    '“Don’t,” {b} said, when {a} started. That was the whole conversation and it lasted a while.',
    '{a} tried to make a joke about the hour and {b} did not take it, which was itself an answer.',
    '{b} said goodnight to {a} early and specifically, and {a} stood there working out why.',
  ],
  'made-a-plan': [
    '{a} and {b} agreed what to do in the morning depending on which of them is still there to do it.',
    '“If it’s me,” {b} said to {a}, “then you already know who to look at.” They went through the list.',
    '{a} and {b} worked out, in the corridor, what each of them would say tomorrow if the other one is gone.',
    'They arranged a thing to check in the morning, {a} and {b}, which is the most either of them could do.',
    '“Whoever’s left,” {a} said, and {b} finished the sentence, and they meant it as far as it goes.',
  ],
  'joked-about-it': [
    '{a} made a genuinely funny joke about the hour and {b} laughed harder than the joke deserved.',
    '{b} did an impression of somebody being murdered upstairs and {a} had to sit down.',
    'The two of them got the giggles in a corridor in a castle where somebody is about to be killed off.',
    '{a} and {b} spent the worst hour of the day laughing, which is a thing people do and nobody puts in the edit.',
    '“Well,” {b} said, “goodnight, statistically,” and {a} laughed and then thought about it and stopped.',
  ],
  'performed-it': [
    '{a} said all the right frightened things to {b} in the corridor and had the timing exactly right.',
    '{a} told {b} how much {a} hates this hour, which is true, and left out the part that makes it true.',
    '{b} thought {a} looked shaken about the night and could not have said what {b} was actually looking at.',
    '{a} was careful to be the one who said it first, which is a thing {a} had thought about beforehand.',
    '“I don’t sleep on these nights,” {a} told {b}, in the voice of somebody who genuinely does not.',
  ],
  'alone-with-it': [
    '{a} stood at the bottom of the stairs for a while, not going up, and could not have said why.',
    'The castle empties out fast after a table, and {a} was the last one out of the room.',
    '{a} checked the corridor twice on the way to bed, knowing perfectly well that checking does nothing.',
    'It is a bad hour to be on your own in, and {a} spent all of it on {a}’s own.',
    '{a} went to bed early to get the waiting over with, and lay there doing the waiting anyway.',
    'Somebody in this building is not coming down tomorrow. {a} could not stop doing the arithmetic on it.',
    '{a} said goodnight to a corridor with nobody in it, out of habit, and heard how it sounded.',
    'There was nothing to decide and nothing to do, so {a} went up, which took longer than it should have.',
    '{a} brushed their teeth for a very long time, because the alternative was lying down.',
    'Everybody in this building went to bed knowing one of them would not get up, and {a} thought about that on the landing.',
    '{a} counted the doors on the way past and could not stop putting odds on each of them.',
    'The last hour before lights out is the honest one, and {a} spent it not being honest with anybody, including {a}.',
    '{a} left the landing light on, which nobody does for a reason they would admit to.',
    'There is a version of this where {a} is the one, and {a} looked at that version for a while before turning over.',
    '{a} listened for a door and heard nothing at all, which was somehow worse than hearing one.',
    '{a} had said goodnight to everybody as normally as possible, and that had taken a real effort.',
  ],
};

registerEvent({
  id: 'after-somebody-goes-tonight',
  // TRUST, NOT COVER, AND IT WAS READING A TRANSCRIPT THAT SETTLED IT. The
  // first draft filed this under `cover` because one of its five branches is a
  // Traitor performing dread. That is the SUBJECT of one sentence and not the
  // arc the scene opens: `fire()` below opens a `trust` story on four branches
  // and a `suspicion` one on the fifth, and `family` is what both
  // `_threadThisEventWouldAdvance` (js/tr/events.js) and the screen's
  // consequence pool read. Mismatched, the continuation guard looked for a
  // cover story these two have never had, and the screen answered a scene
  // about two people laughing in a corridor with "{a} gets away with it.
  // Nobody asks a second question" — a cover-story payoff on a joke. Both are
  // the same defect and both are fixed by the family agreeing with the arc.
  family: 'trust',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['temperament', 'boldness', 'social', 'strategic'],
    alignment: ['faithful', 'original-traitor', 'recruited-traitor'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    // A table has to have happened — this is the hour BETWEEN the two things —
    // and there has to be somebody left to do the other one.
    if (!table(ctx)) return 0;
    const anyPact = (ctx.living || []).some(n => alignmentAt(n, ctx.ep) === 'traitor');
    return anyPact ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-somebody-goes-tonight');
    const sceneWhy = 'spent the hour between the table and the dark';
    const [a, b] = ctx.actors;
    const st = pStats(a);
    if (!b) {
      const soloNote = line(GOES_TONIGHT['alone-with-it'], 'after-somebody-goes-tonight',
        'alone-with-it', ctx.ep, { a });
      const solo = arcContinue(api, 'trust', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'alone-with-it', actor: a,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    // THE ONE ALIGNMENT READ, AND IT IS THE ACTING PLAYER'S OWN — the only
    // read js/tr/castle is allowed (probes A/B/C, tests/tr-castle.test.js).
    // `performed-it` is scored at zero for anybody not on the pact, which is
    // the axis being IMPLEMENTED rather than declared: a Faithful cannot reach
    // that branch, and somebody on the pact reaches it often.
    const onThePact = isTraitor(a, ctx.ep);
    const branch = forkOn(rng, {
      'said-it-out-loud': (st.boldness / 10) * 0.45 + (st.social / 10) * 0.25,
      'would-not-say-it': (1 - st.social / 10) * 0.5 + 0.15,
      'made-a-plan': (st.strategic / 10) * 0.45 + (st.loyalty / 10) * 0.25,
      'joked-about-it': (st.social / 10) * 0.4 + (st.temperament / 10) * 0.3,
      'performed-it': onThePact ? (st.social / 10) * 0.6 + (st.strategic / 10) * 0.6 + 0.4 : 0,
    });
    const note = line(GOES_TONIGHT[branch], 'after-somebody-goes-tonight', branch, ctx.ep, { a, b });
    const bondDelta = branch === 'said-it-out-loud' ? 1
      : branch === 'would-not-say-it' ? -1
        : branch === 'made-a-plan' ? 2 : branch === 'joked-about-it' ? 1.5 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'would-not-say-it' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 10. WHAT I SAID AT THE TABLE — the accusation, checked
//    against what the reveal then said
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD, AND WHY THIS IS THE SHARPEST KNOWLEDGE AXIS IN THE FILE: what
// this person said out loud is on `round.accusations`, who left is on
// `round.banished`, and what they turned out to be is on
// `round.banishedWasTraitor` — three public facts that between them settle
// whether the accusation was RIGHT, WRONG or STILL OPEN. All three branch sets
// are chosen by the record, not by the roll, and a person cannot take credit
// for a call the room heard them not make.
const WHAT_I_SAID = {
  'got-it-right': [
    '{a} had said {them}’s name at that table, and the reveal had agreed with {a} in front of everybody in the room.',
    '“I said it out loud,” {a} said to {b}, “before any of you, and I would like that written down somewhere.”',
    '{b} came to find {a} about it. {a} had named {them} and {a} had been right, and both of them knew what that buys.',
    '{a} was careful not to gloat and did not quite manage it, and {b} let {a} off.',
    '“How did you have that?” {b} asked. {a} explained, and about half of the explanation was true.',
  ],
  'named-the-wrong-one': [
    '{a} had said {them}’s name at that table and the reveal had made {a} look like the reason {them} is gone.',
    '“That was me,” {a} said to {b}. “I put that name in the room and it was the wrong name.”',
    '{a} spent the corridor being reminded, gently and by several people, of what {a} had said out loud.',
    '{b} did not have to raise it. {a} raised it first, which {b} noted was at least brave.',
    '“I was sure,” {a} said. That is the whole problem with tonight, and {b} did not say so.',
  ],
  'stood-by-it': [
    '{a} said {them}’s name at the table and said it again to {b} in the corridor, unchanged.',
    '“I haven’t moved,” {a} told {b}. “{them}. Tonight, tomorrow, whenever you like.”',
    '{a} was still on {them} an hour later, which {b} found either convincing or worrying.',
    '{a} repeated the reasoning to {b} word for word, which is impressive and is also a thing rehearsed people do.',
    '“I’ll say it again next week,” {a} said about {them}, and {b} believed that much at least.',
  ],
  'walked-it-back': [
    '{a} had named {them} at the table and spent the corridor explaining to {b} that it had not been personal.',
    '“I shouldn’t have said it like that,” {a} told {b}, about {them}, and did not withdraw the substance.',
    '{a} softened it for {b}, and {b} wondered which of the two versions {a} actually holds.',
    '{a} said {them}’s name in public and apologised for it in private, which is a choice with a shape to it.',
    '“In the room it comes out harder than you mean,” {a} said. {b} has heard that before.',
  ],
  'alone-with-it': [
    '{a} went over what {a} had actually said at that table, word by word, and did not enjoy all of it.',
    '{a} had put {them}’s name in the air in front of everybody, and there is no taking a sentence back.',
    'Nobody was there to hear {a} rehearse a better version of what {a} had said an hour too late.',
    '{a} had meant to say one thing about {them} and had said something slightly worse, and knew it.',
    'The corridor was empty, so {a} said it again properly, to nobody, the way it should have come out.',
    '{a} could still hear {a}’s own voice saying {them}’s name, which is not a comfortable thing to carry upstairs.',
    'There is a version of that sentence that would have landed better, and {a} found it about an hour late.',
    '{a} counted who had looked up when {a} said it, and could not make the count come out the same twice.',
    '{a} had gone into that room with three sentences and had used the wrong one.',
    'It had sounded reasonable in {a}\u2019s head all afternoon and had come out of {a}\u2019s mouth as an accusation.',
    '{a} kept hearing the pause after it, which had been about a second and had felt like a minute.',
    'Whatever {them} thought of {a} before tonight, {a} had just changed it, and not in a direction {a} had chosen.',
    '{a} worked out, too late, exactly which word had done the damage.',
    'There is a difference between naming somebody and going after them, and {a} was no longer sure which {a} had done.',
    'Half the room would have forgotten it by morning. {a} could not get past the other half.',
    '{a} drafted an apology to {them} on the stairs and decided an apology would make it larger.',
  ],
};

registerEvent({
  id: 'after-what-i-said-at-the-table',
  // SUSPICION, NOT TESTING, and reading a transcript is what settled it. The
  // first draft filed this under `testing` because the scene is somebody being
  // asked to account for themselves, and the screen's `testing` consequence
  // pool is written for the OTHER shape entirely -- one person quietly
  // measuring another, who does not know it. It printed "Amy fails it, and
  // Chase does not say so" over a scene in which Chase had just admitted
  // naming the wrong person and Amy had done nothing at all. `suspicion` is
  // both the arc these branches actually open and the register that answers
  // them, and it puts this event beside its own mirror,
  // `after-two-people-said-my-name`.
  family: 'suspicion',
  window: 'after-table',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'loyalty', 'social', 'temperament'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'rival', 'close-ally'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const round = table(ctx);
    if (!round) return 0;
    const [a] = ctx.actors;
    // They have to have said something. `debate()` gives most of the room a
    // line, so this is broad — but a person who kept quiet has no sentence to
    // answer for and this is not their scene.
    return accusedBy(round, a) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-what-i-said-at-the-table');
    const sceneWhy = 'answered for the name they said out loud at the table';
    const [a, b] = ctx.actors;
    const round = table(ctx);
    const them = accusedBy(round, a);
    const theyWent = them === round.banished;
    const wasRight = theyWent && round.banishedWasTraitor === true;
    const wasWrong = theyWent && round.banishedWasTraitor === false;
    const st = pStats(a);
    if (!b) {
      const soloNote = line(WHAT_I_SAID['alone-with-it'], 'after-what-i-said-at-the-table',
        'alone-with-it', ctx.ep, { a, them });
      const solo = arcContinue(api, 'suspicion', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'alone-with-it', actor: a, subject: them,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const branch = wasRight ? 'got-it-right'
      : wasWrong ? 'named-the-wrong-one'
        : forkOn(rng, {
          'stood-by-it': (st.boldness / 10) * 0.5 + (st.temperament / 10) * 0.3,
          'walked-it-back': (st.social / 10) * 0.45 + (1 - st.boldness / 10) * 0.35,
        });
    const note = line(WHAT_I_SAID[branch], 'after-what-i-said-at-the-table', branch, ctx.ep, {
      a, b, them,
    });
    const bondDelta = branch === 'got-it-right' ? 1.5
      : branch === 'named-the-wrong-one' ? -1.5
        : branch === 'stood-by-it' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'named-the-wrong-one') {
      api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
    }
    const kind = branch === 'got-it-right' ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: them,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// AFTER-TABLE 11. I NEED YOU TOMORROW — the window's closer
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: an open trust story between these two, and tonight's table,
// which is what makes the ask concrete rather than sentimental — the room has
// just demonstrated exactly what it does with a name.
//
// A CLOSER, and the pool needs them: it opens twenty-odd stories a season and
// closes under one. Two of the four branches end the story, in opposite senses
// (`passed-clean` and `turned-back`), and the two that do not are the honest
// middle — an arrangement with a price on it is not a promise, and neither is
// a maybe.
const NEED_YOU = {
  agreed: [
    '“Tomorrow, whatever happens, you and me.” {b} said yes to {a} with nothing attached to it.',
    '{b} did not negotiate. {b} said {a}’s name back and that was the whole of the arrangement.',
    '{a} asked outright, in a corridor, an hour after a banishment, and {b} said yes and meant it.',
    'It took about four words. {b} gave {a} the thing {a} had been circling for a week.',
    '“You don’t have to keep asking me,” {b} said to {a}. “The answer is going to be the same one.”',
  ],
  conditional: [
    '{b} said yes to {a} and then said what would have to be true for the yes to survive the week.',
    '“Up to a point,” {b} said, and {a} spent the night working out where the point is.',
    '{b} agreed to everything {a} asked for except the part {a} had actually come for.',
    '“If it’s you or me at that table, I’m not going to lie to you now,” {b} said. {a} respected it and did not like it.',
    '{a} got an answer from {b} that would serve for either outcome, and both of them heard it happen.',
  ],
  refused: [
    '“I can’t promise that,” {b} said to {a}, plainly, and did not dress it up afterwards.',
    '{b} said no. {a} had not expected no, and the corridor got very quiet.',
    '{a} asked for the one thing and {b} would not give it, and was kind about it, which was worse.',
    '“Not after tonight,” {b} said. “Ask me next week and I still don’t think I can.”',
    '{b} ended it rather than let {a} keep asking, which {b} considered the decent version.',
  ],
  traded: [
    '{b} would give {a} tomorrow in exchange for a name, and {a} gave one, and both of them knew what that was.',
    '“A name for a name,” {b} said. {a} did not enjoy the transaction and completed it anyway.',
    '{a} and {b} settled tomorrow between them, at a price, in a corridor, without writing anything down.',
    '{b} attached a cost to it and {a} paid it, and neither of them called it what it was.',
    '“That’s not a friendship,” {b} said, “but it will hold until Thursday.” {a} took the deal.',
  ],
};

registerEvent({
  id: 'after-i-need-you-tomorrow',
  family: 'trust',
  window: 'after-table',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'strategic', 'boldness', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if (!table(ctx)) return 0;
    // It closes a story, so there has to be one to close.
    return findOpenThread('trust', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'after-i-need-you-tomorrow');
    const sceneWhy = 'asked for tomorrow, an hour after a banishment';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      agreed: (st.loyalty / 10) * 0.5 + Math.max(0, bond) / 10 * 0.35,
      conditional: (1 - st.boldness / 10) * 0.5 + 0.2,
      refused: (1 - st.loyalty / 10) * 0.45 + (st.strategic / 10) * 0.35,
      traded: (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.2,
    });
    const note = line(NEED_YOU[branch], 'after-i-need-you-tomorrow', branch, ctx.ep, { a, b });
    const bondDelta = branch === 'agreed' ? 3
      : branch === 'conditional' ? 0 : branch === 'refused' ? -2.5 : 1;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    // Write the beat FIRST so the payoff carries the story it is paying off,
    // then resolve — the same order `trust-last-word-before-lights-out` uses
    // and for the same reason.
    const thread = findOpenThread('trust', [a, b]);
    const { cited } = arcAdvanceCiting(api, thread, ctx.ep, note, { source: sceneWhy });
    const outcome = branch === 'agreed' ? 'passed-clean'
      : branch === 'refused' ? 'turned-back' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread.id, cited, outcome, bondDelta };
  },
});
