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
  'owned-it': [
    '{a} finds {b} after the table. {b} speaks before {a} has finished asking.\n{b}: "Yes, I wrote your name. Ask me why and I’ll tell you."\n{a}: "Go on, then."\n{b}: "You went quiet this week. Quiet worries me."',
    '{b} doesn’t make {a} work for it.\n{b}: "That was me. {who} as well. Now you know."\n{a}: "At least you’re honest."\n{b}: "One of us has to be."',
    '{a} catches {b} on the stairs.\n{a}: "You wrote my name."\n{b}: "I did. It wasn’t personal."\n{a}: "It felt personal."',
    '{b} owns the vote straight away.\n{b}: "I’m not going to lie to you. It was me."\n{a} (to camera): "I respect that. I don’t like it, but I respect it."',
    '{a} asks, and {b} nods.\n{b}: "Guilty. And I’d do it again, the way the room was."\n{a}: "Good to know where I stand."',
  ],
  'denied-it': [
    '{a} asks {b} straight out, and {b} says it wasn’t {bObj}.\n{b}: "Not me. I swear."\n{a} (to camera): "They read it out. I heard {bPos} name on it."',
    '{a} brings it up. {b} shakes {bPos} head.\n{b}: "I didn’t write you. Hand on heart."\n{a}: "Okay."\n{a} (to camera): "I heard it read out. Why lie about something everyone saw?"',
    '{b} denies it to {a}’s face.\n{b}: "It wasn’t me. Honestly."\n{a}: "Right."\n{a} (to camera): {cam:holding-info}',
    '{b} tells {a} the vote came from somebody else.\n{a}: "Funny, because they read it out with your name next to it."\n{b}: "They must have got it muddled."',
    '{a} lets {b}’s denial go, and doesn’t forget it.\n{b}: {say:deny}\n{a} (to camera): "Everyone heard it. Everyone."',
  ],
  'made-it-a-price': [
    '{b} admits the vote, then puts a condition on the next one.\n{b}: "I wrote it. And I won’t write it tomorrow, if you and me can come to something."\n{a}: "Is that a threat or an offer?"\n{b}: "Bit of both."',
    '{b} owns it, and makes it a deal.\n{b}: "I wrote you. Give me a reason not to again."\n{a} (to camera): "So that’s the conversation. Not the vote, the price."',
    '{b} turns the vote into a negotiation.\n{b}: "Yes, it was me. What have you got for me?"\n{a}: "Wow."',
    '{a} asks. {b} answers and adds a condition.\n{b}: "I’ll write somebody else tomorrow. If we’re being honest with each other."\n{a}: "We’ll see."',
    '{b} has terms.\n{b}: "I had you tonight. Tomorrow’s open. Depends what you tell me."\n{a} (to camera): "Everything’s a trade with {b}."',
  ],
  'named-the-others': [
    '{b} didn’t write it, and tells {a} who did.\n{b}: "It wasn’t me. It was {who}."\n{a}: "I know. I heard."\n{b}: "Then you know who to watch."',
    '{b} runs through the votes with {a}.\n{b}: "Not me. {who}. It was all read out."\n{a}: "I just wanted to hear you say it."',
    '{a} asks {b}. {b} points elsewhere.\n{b}: "Don’t look at me. Look at {who}."\n{a} (to camera): "Good. Now I’ve got names."',
    '{b} tells {a} exactly who voted for {aObj}.\n{b}: "{who}. That’s who wants you gone."\n{a}: "Thank you."',
    '{b} is clear it wasn’t {bObj}.\n{b}: "I was never on you. {who}, though."\n{a} (to camera): {cam:holding-info}',
  ],
  'would-not-say': [
    '{b} didn’t write the name, and won’t talk about who did.\n{a}: "Who else was it?"\n{b}: "I’m not doing that. Not tonight."\n{a} (to camera): "That hurt more than the vote."',
    '{b} won’t discuss the others.\n{b}: "It wasn’t me. That’s all I’m saying."\n{a}: "Why protect them?"\n{b}: "I’m not protecting anyone."',
    '{a} asks who. {b} changes the subject.\n{b}: "Let’s not do this."\n{a} (to camera): "{b} knows something. {b} won’t say it."',
    '{b} refuses to name anyone.\n{b}: "It wasn’t me, and I’m not a grass."\n{a}: "Fair enough."',
    '{b} won’t get into it.\n{b}: "You heard the votes the same as I did."\n{a} (to camera): {cam:unsure-info}',
  ],
  'reassured-it': [
    '{b} didn’t write it, and stays with {a} until {aSub} stops shaking.\n{b}: "It wasn’t me, and it’s not going to be me. Alright?"\n{a}: "Alright."',
    '{b} sits with {a} after the table.\n{b}: "Breathe. You’re still here."\n{a}: "Barely."\n{b}: "Barely counts."',
    '{b} reassures {a}.\n{b}: "I’ve got you. I’m not writing your name."\n{a} (to camera): "I believe {bObj}. I have to believe someone."',
    '{b} squeezes {a}’s hand.\n{b}: "You’re not going anywhere. Not if I can help it."\n{a}: "Thank you."',
    '{b} makes {a} a promise.\n{b}: "It won’t be me. Not tonight, not tomorrow."\n{a} (to camera): "That meant everything."',
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
    '{a} wrote {gone}’s name, and knows it.\n{a}: "I did that. My name was on it."\n{b}: "So was mine."\n{a}: "Doesn’t make it better."',
    '{a} can’t stop thinking about {aPos} vote.\n{a}: "{gone} was Faithful, and I helped send {goneObj} home."\n{b}: "We all did."',
    '{a} tells {b} {aSub} got it wrong.\n{a}: "I was so sure. I was so sure about {gone}."\n{b}: "We all were."',
    '{a} owns {aPos} mistake.\n{a}: "That’s on me. I’ll carry that."\n{b}: "Don’t carry it on your own."',
    '{a} shakes {aPos} head at {b}.\n{a}: "I wrote {gone}. I was wrong."\n{a} (to camera): {cam:was-wrong}',
  ],
  'blamed-the-loudest': [
    '{a} knows who started it.\n{a}: "{loud} said {gone}’s name first. The rest of us followed."\n{b}: "That’s not a defence, though."\n{a}: "I know it’s not."',
    '{a} tells {b} who pushed for {gone}.\n{a}: "{loud}. From the start. Remember that."\n{b}: "I will."',
    '{a} blames the loudest voices.\n{a}: "{loud} drove that. We were passengers."\n{b}: "We still wrote it."',
    '{a} is angry with {loud}.\n{a}: "{loud} was so certain. And {loud} was wrong."\n{a} (to camera): "Why was {loud} so keen? That’s my question now."',
    '{a} and {b} work out who led the room.\n{b}: "It was {loud}’s idea."\n{a}: "And we just went along with it."',
  ],
  'defended-the-vote': [
    '{a} won’t call it a mistake.\n{a}: "It was the right read on what we had. {gone} being Faithful doesn’t change that."\n{b}: "It does a bit."',
    '{a} defends {aPos} vote.\n{a}: "With what we knew, {gone} made sense."\n{b}: "And now?"\n{a}: "Now we know more."',
    '{a} sticks by the reasoning.\n{a}: "I’d do the same thing with the same information."\n{b} (to camera): "{a} would never admit being wrong."',
    '{a} explains it to {b}.\n{a}: "You play the evidence. The evidence said {gone}."\n{b}: "The evidence was rubbish."',
    '{a} refuses to feel bad.\n{a}: "It was the best answer we had."\n{a} (to camera): {cam:was-wrong}',
  ],
  'went-quiet': [
    '{a} doesn’t want to talk about {gone}. {b} keeps trying.\n{b}: "Are you okay?"\n{a}: "Not tonight."\n{b}: "Okay."',
    '{b} asks about {gone}. {a} shuts it down.\n{a}: "Please. Not now."',
    '{a} goes quiet after the reveal.\n{b}: "Talk to me."\n{a}: "There’s nothing to say."',
    '{a} barely speaks.\n{b} (to camera): "{a} took {gone} really hard. Harder than {aSub} lets on."',
    '{a} says it twice, and the second time {b} stops.\n{a}: "Not tonight."\n{a}: "Not tonight, please."',
  ],
  'alone-with-it': [
    '{a} stands in the corridor for a long time, working out how many of them got it wrong.\n{a} (to camera): {cam:was-wrong}',
    'Nobody sees {a} do the maths. {a} wrote {gone}’s name.\n{a} (to camera): {cam:vote-cost}',
    '{a} goes to bed thinking about {gone}’s face at the reveal.\n{a} (to camera): {cam:was-wrong}',
    '{a} sits on the stairs, alone.\n{a} (to camera): "{gone} was Faithful. And I wrote {goneObj} down."',
    '{a} can’t stop replaying {gone}’s last words.\n{a} (to camera): {cam:was-wrong}',
    '{a} lies awake, thinking about {gone}.\n{a} (to camera): {cam:cant-sleep}',
    '{a} goes over the whole table again, looking for where it went wrong.\n{a} (to camera): {cam:replay-week}',
    '{a} washes {aPos} face and looks at the mirror.\n{a} (to camera): {cam:vote-cost}',
    '{a} goes through every ballot in {aPos} head.\n{a} (to camera): {cam:ballots}',
    '{a} wonders how {aSub} got {gone} so wrong.\n{a} (to camera): {cam:gut}',
    '{a} sits by the fire after everyone else has gone up.\n{a} (to camera): {cam:was-wrong}',
    '{a} keeps seeing {gone} stand up at the end.\n{a} (to camera): "That moment when they say Faithful. It stays with you."',
    '{a} thinks about the ones who pushed hardest for {gone}.\n{a} (to camera): {cam:holding-info}',
    '{a} can’t settle.\n{a} (to camera): {cam:after-table}',
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
    '{b} gives {a} the credit.\n{b}: "You had {gone}. Before any of us."\n{a}: "I didn’t want to say it out loud till it was done."\n{b}: "Well, it’s done."',
    '{b} tells {a} {aSub} called it.\n{b}: "Your read was spot on."\n{a}: "Thank you. I was terrified I was wrong."',
    '{b} congratulates {a}.\n{b}: "That was you. You found a Traitor."\n{a} (to camera): {cam:was-right}',
    '{a} gets a hug from {b}.\n{b}: "You were right about {gone}. All week."\n{a}: "I was, wasn’t I?"',
    '{b} makes sure {a} hears it.\n{b}: "Remember this. You got one."\n{a}: "We got one."',
  ],
  'who-knew': [
    '{a} and {b} work out who had {gone} tonight.\n{a}: "{who} had it right."\n{b}: "What does that tell us?"\n{a}: "That {who} are worth listening to. Or very lucky."',
    '{a} and {b} go through the votes.\n{b}: "Who wrote {gone}? {who}."\n{a}: "Interesting."',
    'Neither of them wrote {gone}. {a} and {b} talk about the ones who did.\n{a}: "{who}. Remember that."',
    '{a} and {b} wonder how {who} knew.\n{b}: "Instinct?"\n{a}: "Or information."',
    '{a} and {b} note who got it right.\n{a} (to camera): {cam:ballots}',
  ],
  overclaimed: [
    '{b} tells {a} {bSub} saw it coming, having written {other}.\n{b}: "I always knew about {gone}."\n{a}: "You wrote {other}."\n{b}: "Well, yes, but I knew."',
    '{b} claims to have known.\n{b}: "I said {gone} days ago."\n{a} (to camera): "{b} wrote {other}. I heard it."',
    '{b} takes credit {bSub} hasn’t earned.\n{b}: "Called it."\n{a}: "Did you, though?"',
    '{b} boasts about the reveal.\n{b}: "I had {gone} from day one."\n{a}: "Your ballot said {other}."\n{b}: "Tactical."',
    '{b} goes on about how obvious {gone} was.\n{a} (to camera): "Funny how many people saw it coming once it was over."',
  ],
  'next-one': [
    '{a} gives {gone} about four seconds.\n{a}: "Right. Who else looks like that?"\n{b}: "Let us enjoy it for one minute."',
    '{b} says one down. {a} is already on the next.\n{b}: "One down."\n{a}: "How many to go?"',
    '{a} moves straight on.\n{a}: "{gone} didn’t work alone. Who was {goneSub} close to?"\n{b}: "Oh, now you’re talking."',
    '{a} wants the next name.\n{a}: "Don’t relax. That’s what they want."\n{b}: "Who, then?"',
    '{a} and {b} start on the next one.\n{a} (to camera): {cam:plan}',
  ],
  'on-their-own': [
    '{a} watches the reveal and goes straight upstairs to take it in without an audience.\n{a} (to camera): {cam:was-right}',
    'Nobody needs to see {a} be pleased about it. {a} goes where nobody can.\n{a} (to camera): {cam:was-right}',
    '{a} sits on the bed, breathing out properly for the first time in days.\n{a} (to camera): {cam:was-right}',
    '{a} lets {aRef} smile, alone.\n{a} (to camera): "Got one. Finally."',
    '{a} thinks about {gone} as the castle quietens.\n{a} (to camera): {cam:gut}',
    '{a} goes over the week that led to {gone}.\n{a} (to camera): {cam:replay-week}',
    '{a} wonders who {gone} was working with.\n{a} (to camera): {cam:holding-info}',
    '{a} looks back at {aPos} own vote.\n{a} (to camera): {cam:ballots}',
    '{a} takes a moment on the stairs.\n{a} (to camera): {cam:after-table}',
    '{a} tries not to look too pleased on the way up.\n{a} (to camera): "Being right makes you visible. I’d rather be quietly right."',
    '{a} counts who is left.\n{a} (to camera): {cam:few-left}',
    '{a} thinks about the next table already.\n{a} (to camera): {cam:plan}',
    '{a} is quietly proud of tonight.\n{a} (to camera): {cam:was-right}',
    '{a} knows the night isn’t over yet.\n{a} (to camera): {cam:cant-sleep}',
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
    '{a} tells {b} {aSub} trusts who {aSub} trusts, harder now.\n{a}: "So one of them wasn’t what I thought. Fine."\n{b}: "You alright?"\n{a}: "I trust you more than I did this morning."',
    '{a} sat with {gone} all week and doesn’t fall apart about it.\n{a}: "We stick together. Even more now."\n{b}: "Agreed."',
    '{a} pulls {b} closer.\n{a}: "{gone} fooled me. You’re not going to."\n{b}: "I’m not {gone}."',
    '{a} and {b} close ranks.\n{b} (to camera): "{a} and me are tighter than ever tonight."',
    '{a} decides to trust {b} more.\n{a}: "It’s us now. Just us."\n{b}: "Just us."',
  ],
  'who-else': [
    '{a} is already listing names.\n{a}: "If {gone} fooled me, who else was in that little group?"\n{b}: "I was."\n{a}: "I know."',
    '{a} stops grieving {gone} and starts counting.\n{a}: "Who was {gone} whispering with all week?"\n{b}: "Loads of people."\n{a}: "Name them."',
    '{a} wants to know who else.\n{a}: "{gone} wasn’t alone. Traitors never are."',
    '{a} looks hard at the group.\n{a} (to camera): {cam:holding-info}',
    '{a} starts suspecting everyone {gone} was close to.\n{b}: "Including me?"\n{a}: "Nobody’s off the list."',
  ],
  'couldnt-see-it': [
    '{a} can’t get past it.\n{a}: "I sat next to {gone} every single morning. How did I not see one thing?"\n{b}: "Because {goneSub} was good at it."',
    '{a} doubts {aPos} own judgement.\n{a}: "If I missed {gone}, what else am I missing?"\n{b}: "Don’t go down that road."',
    '{a} is shaken.\n{a}: "{gone} looked me in the eye. Every day."\n{b}: "I know."',
    '{a} feels stupid.\n{a} (to camera): {cam:gut}',
    '{a} tells {b} {aSub} feels like a fool.\n{a}: "I defended {gone}. Out loud."\n{b}: "So did I."',
  ],
  'cut-loose': [
    '{a} is done with {gone}’s group.\n{a}: "I’m not carrying {gone}’s name around. I’m out of that group as of tonight."\n{b}: "That includes me?"\n{a}: "We’ll see."',
    '{a} starts putting distance between {aRef} and everyone {gone} was close to.\n{b}: "You’re cutting us off?"\n{a}: "I’m protecting myself."',
    '{a} leaves the group.\n{a} (to camera): "That group stinks of Traitor now. I’m out."',
    '{a} tells {b} {aSub} needs space.\n{a}: "Nothing personal. I just can’t be seen with you lot right now."',
    '{a} walks away from the circle.\n{b} (to camera): "{a} jumped ship very quickly."',
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
    '{a} goes and finds {b} after the table.\n{a}: "You said my name. I’d rather hear why from you than from anybody else."\n{b}: "Fair. You’ve been too quiet."',
    '{a} confronts {b}.\n{a}: "You had me. Out loud. What did you see?"\n{b}: "Honestly? Nothing I can prove."',
    '{a} asks {b} straight.\n{a}: "Why me?"\n{b}: {say:suspect:you}',
    '{a} wants an explanation.\n{a}: "You said my name at the table. I want to know why."\n{b}: "It was a gut feeling."',
    '{a} and {b} have it out.\n{a}: "Next time, say it to my face first."\n{b}: "I did say it to your face. At the table."',
  ],
  'worked-the-room': [
    '{a} has {said} to answer for, and starts with {b}.\n{a}: "{said} had my name tonight. Were you nearly one of them?"\n{b}: "No. Never."',
    '{a} checks {b} is still on side.\n{a}: "I need to know you’re not next."\n{b}: "I’m not."',
    '{a} works the room, starting with {b}.\n{a}: "Tell me honestly. What are people saying about me?"\n{b}: "Just what you heard."',
    '{a} gets to {b} before anyone else can.\n{a}: "I’m Faithful. I need you to know that."\n{b}: "I believe you."',
    '{a} does damage control.\n{a} (to camera): "Two people said my name. I have to fix that tonight."',
  ],
  rattled: [
    '{a} gets through the conversation with {b}, and doesn’t get through the hour after it.\n{b}: "You okay?"\n{a}: "No. Not really."',
    'Hearing your name said twice at a table does something. {b} watches it happen to {a}.\n{a}: "Am I next?"\n{b}: "I don’t know."',
    '{a} is shaken.\n{a}: "{said}. Both of them. Out loud."\n{b}: "It’s just talk."',
    '{a} can’t stop shaking.\n{a} (to camera): {cam:cant-sleep}',
    '{a} lets {b} see the fear.\n{a}: "I’m scared. I’m actually scared."',
  ],
  hardened: [
    '{a} comes out of the table sharper than {aSub} went in.\n{a}: "{said}. Good. Now I know exactly where they are."\n{b}: "You’re taking this well."',
    '{a} isn’t rattled.\n{a}: "They’ve shown their hand."\n{b} (to camera): "{a} looked almost happy about it."',
    '{a} gets harder.\n{a}: "Let them come."\n{b}: "Easy."',
    '{a} turns it into fuel.\n{a} (to camera): "Say my name. I’ll remember yours."',
    '{a} shrugs it off.\n{a}: "I’ve been named before. I’m still here."',
  ],
  'counted-them': [
    '{a} sits on the stairs and counts the people who said {aPos} name out loud: {said}.\n{a} (to camera): {cam:frozen-out}',
    'Nobody is watching, so {a} stops pretending it didn’t land.\n{a} (to camera): "{said}. Both in public. That’s a plan, not a hunch."',
    '{a} goes over who said {aPos} name.\n{a} (to camera): {cam:holding-info}',
    '{a} lies on the bed going through the table.\n{a} (to camera): {cam:replay-week}',
    '{a} can’t sleep for thinking about {said}.\n{a} (to camera): {cam:cant-sleep}',
    '{a} tries to work out what {aSub} did wrong.\n{a} (to camera): "Too loud, maybe. Too many opinions. I need to be less of a target."',
    '{a} counts {aPos} allies, and it doesn’t take long.\n{a} (to camera): "Two people said my name tonight. I need two more people saying it isn’t me."',
    '{a} thinks about the next table.\n{a} (to camera): {cam:go-first}',
    '{a} plans what to say at breakfast.\n{a} (to camera): {cam:rehearse}',
    '{a} sits alone after being named.\n{a} (to camera): {cam:frozen-out}',
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
    '{named} brings it up before {b} can.\n{named}: "{gone} said my name on the way out. Ask me anything you like."\n{b}: "Alright. Why you?"\n{named}: "Because I was the one asking {goneObj} questions."',
    '{named} doesn’t wait for the question.\n{named}: "I know what {gone} said. I’m Faithful, and I’ll tell you my whole week if you want it."',
    '{named} faces it head on.\n{named}: "You heard {gone}. I didn’t run from it."\n{b}: "No, you didn’t."',
    '{named} tells {b} the whole week, unprompted.\n{b} (to camera): "Maybe too much. But maybe that’s just honesty."',
    '{named} answers {gone}’s parting shot.\n{named}: "Parting shots are cheap. Judge me on what I do."',
  ],
  'let-it-stand': [
    '{named} says nothing about it at all, and {b} can’t stop noticing.\n{b}: "Aren’t you going to say anything about what {gone} said?"\n{named}: "No."',
    '{gone} named {named} at the door. {named} doesn’t mention it once.\n{b} (to camera): "Silence can be louder than an answer."',
    '{named} acts like nothing was said.\n{b}: "You’re very calm."\n{named}: "Why wouldn’t I be?"',
    '{named} won’t dignify it.\n{named}: "I’m not answering a goodbye speech."',
    '{named} keeps quiet.\n{b} (to camera): {cam:holding-info}',
  ],
  'picked-it-up': [
    '{b} takes {gone}’s parting name and runs with it.\n{b}: "{gone} had no reason to lie at that point."\n{named}: "{gone} had every reason. It was revenge."',
    '{b} tells {named} {bSub} is taking it seriously.\n{b}: "People say the truth on the way out."\n{named}: "Or they say the loudest name."',
    '{b} makes {named} a question.\n{b}: "Why would {gone} say you?"\n{named}: "Ask {gone}. Oh wait."',
    '{b} won’t let {gone}’s words go.\n{b} (to camera): "Last words mean something. I’m watching {named} now."',
    '{b} tells {named} straight.\n{b}: "I’m going to be watching you."\n{named}: "Watch away."',
  ],
  dismissed: [
    '{b} throws {gone}’s last accusation out.\n{b}: "{gone} was always going to name somebody. It happened to be you."\n{named}: "Thank you."',
    '{b} reassures {named}.\n{b}: "Ignore it. It was sour grapes."\n{named}: "I hope everyone sees it that way."',
    '{b} laughs it off.\n{b}: "A parting shot. Nothing more."\n{named} (to camera): "I was more relieved than I let on."',
    '{b} sticks up for {named}.\n{b}: "I don’t believe a word of it."\n{named}: "You’re a good friend."',
    '{b} tells {named} not to worry.\n{b}: "Nobody’s taking that seriously."\n{named}: "Somebody is. There’s always somebody."',
  ],
  'alone-with-it': [
    '{named} goes upstairs with {gone}’s last sentence and can’t put it down.\n{named} (to camera): {cam:cant-sleep}',
    'Nobody is going to say it to {named}’s face, so {named} says it to the mirror.\n{named} (to camera): "{gone} named me. On the way out. In front of everyone."',
    '{named} replays {gone}’s goodbye over and over.\n{named} (to camera): {cam:replay-week}',
    '{named} can’t sleep after being named by {gone}.\n{named} (to camera): {cam:cant-sleep}',
    '{named} thinks about how to answer it tomorrow.\n{named} (to camera): {cam:rehearse}',
    '{named} sits on the edge of the bed.\n{named} (to camera): {cam:after-table}',
    '{named} wonders who believed {gone}.\n{named} (to camera): {cam:unsure-info}',
    '{named} lies awake counting who might vote {namedObj} out now.\n{named} (to camera): {cam:frozen-out}',
    '{named} works out what {gone} saw.\n{named} (to camera): {cam:gut}',
    '{named} feels the castle turn.\n{named} (to camera): {cam:frozen-out}',
    '{named} decides to stay calm tomorrow.\n{named} (to camera): {cam:stay-quiet}',
    '{named} plans to go first at breakfast.\n{named} (to camera): {cam:go-first}',
    '{named} thinks about {gone}’s face as {goneSub} said it.\n{named} (to camera): "{gone} meant it. That’s what scares me."',
    '{named} looks at the door for a long time.\n{named} (to camera): {cam:after-table}',
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
    '{a} and {b} wrote the same name two tables running.\n{a}: "Twice now."\n{b}: "Either we’re reading the same thing, or we’re both wrong the same way."\n{a}: "I’ll take those odds."',
    '{a} and {b} notice they voted together again.\n{b}: "Same name. Again."\n{a}: "We should talk before tables."',
    '{a} and {b} discover they think alike.\n{a} (to camera): "{b} and me keep landing in the same place. That’s worth something."',
    '{a} and {b} compare notes.\n{b}: "Great minds."\n{a}: "Or matching mistakes."',
    '{a} and {b} decide it’s not a coincidence.\n{a}: "Let’s do it on purpose next time."\n{b}: "Deal."',
  ],
  'moved-off': [
    '{b} was on {a}’s name last week, and isn’t tonight.\n{a}: "Last table we wrote the same name. Tonight you wrote {them}. Talk me through it."\n{b}: "I changed my mind."',
    '{a} noticed {b} move.\n{a}: "Why {them}?"\n{b}: "Something didn’t sit right."',
    '{a} asks what changed.\n{a}: "You left me."\n{b}: "I voted my gut."',
    '{a} doesn’t like it.\n{a} (to camera): "{b} moved. Who moved {bObj}?"',
    '{a} and {b} disagree now.\n{b}: "Different week, different read."\n{a}: "Or different friends."',
  ],
  'came-across': [
    '{b} wasn’t with {a} last week, and is tonight.\n{a}: "You came across. I want to know whether it was me or the room."\n{b}: "A bit of both."',
    '{a} noticed {b}’s vote.\n{a}: "You’re with me now?"\n{b}: "Tonight I am."',
    '{a} welcomes {b} over.\n{a}: "Good to have you."\n{b}: "Don’t get used to it."',
    '{a} wonders what brought {b} over.\n{a} (to camera): {cam:holding-info}',
    '{b} explains the switch.\n{b}: "You made sense this week. That’s all."',
  ],
  'never-with-me': [
    '{a} and {b} haven’t written the same name once across two tables.\n{a}: "We’ve never agreed. Not once."\n{b}: "I noticed."',
    '{a} points it out.\n{a}: "Two tables. Two different names."\n{b}: "We just see it differently."',
    '{a} and {b} keep splitting.\n{a} (to camera): "Every time. {b} is never with me."',
    '{a} wonders why.\n{a}: "Are you avoiding me on purpose?"\n{b}: "Don’t be paranoid."',
    '{a} files it away.\n{a} (to camera): {cam:ballots}',
  ],
  'flat-denial': [
    '{b} claims to have been on {a}’s name last week. The ballots said otherwise, and they were read out.\n{b}: "I’ve been with you the whole time."\n{a}: "No, you haven’t."',
    '{b} rewrites the last table.\n{b}: "We voted together, didn’t we?"\n{a} (to camera): "No, we didn’t. I was there."',
    '{b} lies about {bPos} vote.\n{b}: {say:deny}\n{a}: "I heard it read out."',
    '{b} insists.\n{b}: "I’m always with you."\n{a} (to camera): {cam:holding-info}',
    '{a} catches the lie and says nothing.\n{a} (to camera): "{b} just lied to me about something everyone heard. Why?"',
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
    '{a} liked {gone}, plainly and without strategy, and tells {b} so.\n{a}: "I’m allowed to just be sad about it."\n{b}: "You are."',
    '{a} misses {gone} already.\n{a}: "{gone} was a good person."\n{b}: "{goneSub} was."',
    '{a} tears up in the corridor.\n{b}: "Come here."',
    '{a} tells {b} what {gone} meant to {aObj}.\n{a}: "We laughed every day."\n{b}: "I know you did."',
    '{a} is gutted.\n{a} (to camera): {cam:vote-cost}',
  ],
  relieved: [
    '{a} doesn’t pretend {gone} leaving is bad news.\n{a}: "I’m not going to stand here and lie about it."\n{b}: "At least you’re honest."',
    '{a} and {gone} weren’t friends.\n{a}: "Bit of a relief, honestly."\n{b} (to camera): "Noted."',
    '{a} admits it.\n{a}: "I won’t miss {gone}."\n{b}: "Harsh."\n{a}: "True."',
    '{a} breathes easier.\n{a} (to camera): "One less person looking at me. I’m not going to cry about that."',
    '{a} shrugs about {gone}.\n{a}: "It is what it is."',
  ],
  guilty: [
    '{a} wrote {gone}’s name, and tells {b} before {b} asks anything.\n{a}: "I wrote it, and I liked {goneObj}. Both are true and I can’t make them fit."',
    '{a} feels awful.\n{a}: "I voted for someone I liked."\n{b}: "That’s the game."',
    '{a} confesses to {b}.\n{a}: "It was me. One of them, anyway."\n{b}: "You did what you thought was right."',
    '{a} can’t shake the guilt.\n{a} (to camera): {cam:vote-cost}',
    '{a} tells {b} {aSub} feels sick.\n{a}: "I looked {gone} in the eye and wrote {goneObj} down."',
  ],
  'angry-at-the-room': [
    '{a} is furious with the room.\n{a}: "{who} put that name in the air. I want that remembered."\n{b}: "It will be."',
    '{a} isn’t sad about {gone} so much as angry with {who}.\n{a}: "They led everyone by the nose."\n{b}: "We let them."',
    '{a} blames {who}.\n{a}: "{who}. Remember that name."',
    '{a} fumes to {b}.\n{a} (to camera): "{who} pushed that. And the room just followed."',
    '{a} won’t let it go.\n{a}: "Sheep. We’re all sheep."\n{b}: "Speak for yourself."',
  ],
  'on-their-own': [
    '{a} sits with {gone} being gone, and doesn’t go and find anybody.\n{a} (to camera): {cam:after-table}',
    'Nobody sees {a} cry, which is the only reason {a} lets it happen.\n{a} (to camera): {cam:vote-cost}',
    '{a} looks at {gone}’s place at the table as the others leave.\n{a} (to camera): {cam:vote-cost}',
    '{a} walks past {gone}’s room, door already open.\n{a} (to camera): {cam:few-left}',
    '{a} thinks about the first day, when {gone} was still here.\n{a} (to camera): {cam:few-left}',
    '{a} sits by the fire where {gone} used to sit.\n{a} (to camera): {cam:few-left}',
    '{a} misses {gone} quietly.\n{a} (to camera): {cam:after-table}',
    '{a} finds a jumper {gone} left on the sofa.\n{a} (to camera): "Somebody should post it on. It’s daft, the things that get you."',
    '{a} goes to bed early.\n{a} (to camera): {cam:after-table}',
    '{a} counts who is left in the room.\n{a} (to camera): {cam:ballots}',
    '{a} thinks about what {gone} would say now.\n{a} (to camera): "{gone} would tell me to stop moping and play. So I will."',
    '{a} lies awake thinking about {gone}.\n{a} (to camera): {cam:cant-sleep}',
    '{a} goes over the vote that sent {gone} home.\n{a} (to camera): {cam:vote-cost}',
    '{a} stays in {aPos} room.\n{a} (to camera): {cam:alone-choice}',
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
    'Neither {a} nor {b} heard their own name once all evening.\n{b}: "Clean sheet."\n{a}: "Touch wood."\nThey both knock on the table.',
    '{a} and {b} are relieved.\n{a}: "Nobody said us."\n{b}: "Let’s keep it that way."',
    '{a} and {b} smile at each other.\n{b} (to camera): {cam:invisible}',
    '{a} and {b} share a quiet moment.\n{a}: "Invisible. Just how I like it."',
    '{a} and {b} get through another table.\n{b}: "One more down."\n{a}: "One more survived."',
  ],
  'worried-by-it': [
    '{a} isn’t sure it’s good news.\n{a}: "Nobody said my name. I don’t think that means what you think it means."\n{b}: "Meaning?"\n{a}: "Meaning they might be saving me for later."',
    '{a} worries about being ignored.\n{a}: "Safe at the table. Not safe at night."',
    '{a} can’t decide if it’s safety.\n{a} (to camera): {cam:invisible}',
    '{a} tells {b} it feels wrong.\n{a}: "Too quiet. Nobody talks about the people they’re planning to murder."',
    '{a} frets.\n{b}: "You’re overthinking."\n{a}: "That’s my job."',
  ],
  'made-it-a-plan': [
    '{a} and {b} agree to keep doing what kept them off the table.\n{a}: "Stay quiet, vote together, let the loud ones fight."\n{b}: "Easy."',
    'Neither was named. {a} and {b} turn it into a strategy.\n{b}: "We stay under the radar."\n{a}: "All the way to the end."',
    '{a} and {b} make a plan.\n{a} (to camera): {cam:plan}',
    '{a} and {b} decide to stay invisible.\n{b}: "Nobody votes for people they don’t notice."',
    '{a} and {b} shake on it.\n{a}: "Quiet and together."\n{b}: "Quiet and together."',
  ],
  'one-of-us-is-lying': [
    '{a} points out that two people getting through untouched is luck or a reason.\n{a}: "Why weren’t you named?"\n{b}: "Why weren’t you?"',
    '{a} asks {b} a horrible, fair question.\n{a}: "Why is nobody looking at you?"\n{b}: "Because I’m Faithful."\n{a}: "That’s what they’d say."',
    '{a} gets suspicious of {b}.\n{a} (to camera): "Nobody touches {b}. Ever. Why?"',
    '{a} tests {b}.\n{a}: "It’s very convenient, you being safe."\n{b}: "So are you."',
    '{a} and {b} eye each other.\n{b} (to camera): "{a} suspects me. I can feel it."',
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
    '{a} says what everyone is thinking.\n{a}: "One of us isn’t coming down in the morning."\n{b}: "Don’t."\n{a}: "Somebody has to say it."',
    '{a} puts it plainly to {b}.\n{a}: "The table’s done. Now the other thing starts."\n{b}: "I hate this bit."',
    '{a} tells {b} the truth of it.\n{a}: "Could be you. Could be me."\n{b}: "Thanks for that."',
    '{a} says it out loud on the stairs.\n{a}: "Murder night."\n{b}: "Every night’s murder night."',
    '{a} faces it.\n{a}: "See you in the morning. Hopefully."\n{b}: "Hopefully."',
  ],
  'would-not-say-it': [
    '{b} won’t talk about the rest of the night, and {a} notices how carefully.\n{a}: "Scared?"\n{b}: "Tired."',
    '{a} raises it twice. {b} changes the subject twice.\n{b}: "Anyway, did you see the dessert?"\n{a} (to camera): "Clumsy. Very clumsy."',
    '{b} won’t discuss the murder.\n{b}: "Let’s talk about anything else."',
    '{b} avoids the subject.\n{a} (to camera): {cam:holding-info}',
    '{b} goes quiet when {a} mentions the night.\n{a}: "You’ve gone pale."\n{b}: "I’m fine."',
  ],
  'made-a-plan': [
    '{a} and {b} agree what to do in the morning, depending on which of them is still there.\n{b}: "If it’s me, you already know who to look at."\n{a}: "I know."',
    '{a} and {b} make a plan for the morning.\n{a}: "If I’m gone, go after them."\n{b}: "Promise."',
    '{a} and {b} go through the list.\n{b}: "If I’m murdered, it tells you something."\n{a}: "Don’t say that."',
    '{a} and {b} agree on tomorrow.\n{a} (to camera): {cam:plan}',
    '{a} and {b} leave instructions for each other.\n{b}: "Avenge me."\n{a}: "Dramatic."',
  ],
  'joked-about-it': [
    '{a} makes a genuinely funny joke about the hour, and {b} laughs harder than it deserves.\n{a}: "If I’m murdered, you can have my shoes."\n{b}: "Deal."',
    '{b} does an impression of somebody being murdered upstairs, and {a} has to sit down.\n{a}: "Stop. I’ll wet myself."',
    '{a} and {b} laugh off the fear.\n{b} (to camera): "Laughing is the only way through it."',
    '{a} jokes about leaving a note.\n{a}: "Dear Traitors, please knock."\n{b} loses it.',
    '{a} and {b} giggle on the stairs.\n{a}: "Goodnight. Maybe goodbye."\n{b}: "Stop it."',
  ],
  'performed-it': [
    '{a} says all the right frightened things to {b}.\n{a}: "I hate this bit. I hate it."\n{b}: "Me too."\n{a} (to camera): {cam:steer}',
    '{a} acts terrified.\n{a}: "I won’t sleep a wink."\n{b}: "Nor me."',
    '{a} tells {b} how much {aSub} hates this hour.\n{b}: "You alright?"\n{a}: "Terrified."',
    '{a} performs fear for {b}.\n{b} (to camera): "{a} seemed genuinely scared. I think."',
    '{a} gets the timing exactly right.\n{a}: "Hold my hand up the stairs?"\n{b}: "Of course."',
  ],
  'alone-with-it': [
    '{a} stands at the bottom of the stairs for a while, not going up.\n{a} (to camera): {cam:after-table}',
    'The castle empties out fast after a table, and {a} is the last one out of the room.\n{a} (to camera): {cam:after-table}',
    '{a} climbs the stairs slowly.\n{a} (to camera): {cam:cant-sleep}',
    '{a} takes the long way to bed.\n{a} (to camera): {cam:cant-sleep}',
    '{a} lies in bed listening.\n{a} (to camera): {cam:cant-sleep}',
    '{a} sits by the window, not ready to sleep.\n{a} (to camera): {cam:after-table}',
    '{a} sits on the end of the bed with the light still on.\n{a} (to camera): {cam:cant-sleep}',
    '{a} folds tomorrow’s clothes on the chair.\n{a} (to camera): {cam:switch-off}',
    '{a} says goodnight to nobody.\n{a} (to camera): {cam:alone-choice}',
    '{a} lies awake running through who might be next.\n{a} (to camera): {cam:replay-week}',
    '{a} turns the light off and stares at the ceiling.\n{a} (to camera): {cam:replay-week}',
    '{a} is too tired to be scared.\n{a} (to camera): "I’m past scared. I’m just tired now."',
    '{a} thinks about home before sleeping.\n{a} (to camera): {cam:homesick}',
    '{a} is last to leave the fire.\n{a} (to camera): {cam:after-table}',
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
    '{a} said {them}’s name at the table, and the reveal agreed.\n{a}: "I said it out loud, before any of you. I’d like that written down."\n{b}: "Consider it written."',
    '{a} feels vindicated.\n{a}: "I told you about {them}."\n{b}: "You did."',
    '{a} is proud.\n{a} (to camera): {cam:was-right}',
    '{a} reminds {b}.\n{a}: "Who said {them}? Me."\n{b}: "Alright, alright."',
    '{a} and {b} celebrate quietly.\n{b}: "You nailed it."\n{a}: "I did, didn’t I?"',
  ],
  'named-the-wrong-one': [
    '{a} said {them}’s name, and the reveal made {aObj} look like the reason {them} is gone.\n{a}: "That was me. I put that name in the room and it was wrong."\n{b}: "You weren’t the only one."',
    '{a} feels terrible.\n{a}: "{them} was Faithful. And I started it."',
    '{a} knows people will blame {aObj}.\n{a} (to camera): {cam:was-wrong}',
    '{a} tells {b} {aSub} messed up.\n{a}: "I got {them} completely wrong."\n{b}: "We all did."',
    '{a} worries about the fallout.\n{a}: "Now everyone’s going to look at me."\n{b}: "Probably."',
  ],
  'stood-by-it': [
    '{a} said {them}’s name at the table and says it again in the corridor.\n{a}: "I haven’t moved. {them}. Tonight, tomorrow, whenever."\n{b}: "You’re sure."\n{a}: "Completely."',
    '{a} won’t back down.\n{a}: "I still think {them}."\n{b}: "Even now?"',
    '{a} stands firm.\n{a} (to camera): {cam:certain}',
    '{a} repeats it.\n{a}: "{them}. I’ll keep saying it."',
    '{a} tells {b} {aSub} isn’t changing.\n{a}: "My gut says {them}. My gut’s rarely wrong."',
  ],
  'walked-it-back': [
    '{a} named {them} at the table, and spends the corridor saying it wasn’t personal.\n{a}: "I shouldn’t have said it like that."\n{b}: "But you still think it."\n{a}: "…Yes."',
    '{a} softens it.\n{a}: "I didn’t mean to go so hard on {them}."\n{b}: "You did go hard."',
    '{a} wishes {aSub} had worded it better.\n{a} (to camera): {cam:overdid}',
    '{a} backtracks.\n{a}: "It was a feeling, not an accusation."\n{b}: "Sounded like an accusation."',
    '{a} tries to smooth it over.\n{a}: "I’ll apologise to {them} tomorrow."\n{b}: "Good idea."',
  ],
  'alone-with-it': [
    '{a} goes over what {aSub} said at the table, word by word.\n{a} (to camera): {cam:replay-week}',
    '{a} put {them}’s name in the air in front of everybody.\n{a} (to camera): "You can’t take a sentence back."',
    '{a} lies awake thinking about {them}.\n{a} (to camera): {cam:cant-sleep}',
    '{a} wonders if {aSub} was too harsh.\n{a} (to camera): {cam:overdid}',
    '{a} replays {them}’s face when {aSub} said it.\n{a} (to camera): {cam:vote-cost}',
    '{a} stands by it, alone.\n{a} (to camera): {cam:certain}',
    '{a} doubts {aRef}.\n{a} (to camera): {cam:changed-mind}',
    '{a} wonders how the room took it.\n{a} (to camera): {cam:unsure-info}',
    '{a} thinks about {them} as {aSub} gets ready for bed.\n{a} (to camera): {cam:gut}',
    '{a} goes over {aPos} own record at the table.\n{a} (to camera): {cam:ballots}',
    '{a} worries {aSub} made {aRef} a target.\n{a} (to camera): "Say a name at that table and you’re the next conversation."',
    '{a} decides to keep quieter tomorrow.\n{a} (to camera): {cam:stay-quiet}',
    '{a} sits with it for a while before going up.\n{a} (to camera): {cam:after-table}',
    '{a} sits on the landing for a while.\n{a} (to camera): {cam:after-table}',
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
    '{a} asks {b} for tomorrow.\n{a}: "Whatever happens, you and me."\n{b}: "Yes. No conditions."\n{a}: "Thank you."',
    '{b} doesn’t negotiate.\n{a}: "I need you."\n{b}: "You’ve got me."',
    '{b} says yes straight away.\n{b}: "I’m with you. All the way."\n{a} (to camera): "That’s all I needed to hear."',
    '{a} and {b} shake on it.\n{b}: "Tomorrow, we’re together."',
    '{b} promises {a}.\n{b}: "I won’t let you down."\n{a}: "I know."',
  ],
  conditional: [
    '{b} says yes, then says what would have to stay true.\n{b}: "Up to a point."\n{a}: "Where’s the point?"\n{b}: "You’ll know when you reach it."',
    '{b} agrees, with conditions.\n{b}: "As long as you don’t give me a reason."\n{a}: "I won’t."',
    '{b} hedges.\n{b}: "For now. Ask me again tomorrow."\n{a} (to camera): {cam:unsure-info}',
    '{b} gives a careful yes.\n{b}: "I’m with you. Mostly."\n{a}: "Mostly?"',
    '{b} sets a limit.\n{b}: "If they come for you at the table, I can’t go down with you."\n{a}: "Understood."',
  ],
  refused: [
    '{b} tells {a} {bSub} can’t promise.\n{b}: "I can’t promise that."\n{a}: "Oh."\nThe corridor goes very quiet.',
    '{b} says no.\n{b}: "I’m sorry. I have to play my own game."\n{a} (to camera): "I didn’t expect that."',
    '{b} won’t commit.\n{b}: "Not tonight. I can’t."\n{a}: "Right. Okay."',
    '{b} turns {a} down.\n{b}: "I don’t make promises in here."',
    '{b} refuses.\n{a} (to camera): {cam:frozen-out}',
  ],
  traded: [
    '{b} will give {a} tomorrow in exchange for a name.\n{b}: "A name for a name."\n{a}: "Fine."\nBoth of them know what that was.',
    '{b} makes it a transaction.\n{b}: "Tell me who you suspect, and I’m yours."\n{a}: {say:suspect:someone}',
    '{b} wants something in return.\n{b}: "What do I get?"\n{a}: "My vote."',
    '{a} doesn’t enjoy the trade, and makes it anyway.\n{a} (to camera): "Everything’s a deal in here."',
    '{a} and {b} swap information for loyalty.\n{b}: "Deal."',
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
