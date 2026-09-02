// ══════════════════════════════════════════════════════════════════════
// tr/castle/trust.js — confiding, trading reads, and the vote you asked for
// ══════════════════════════════════════════════════════════════════════
//
// THE GOVERNING RULE (spec §5.9 / channel-audit.js): bonds, state, threads and
// residue are free. Beliefs about alignment are earned through gateChannel(),
// and none of these events attempt it — trust is a relationship mechanic, not
// an evidence source, and the expectation going in was that most castle
// events would carry no belief at all. Every consequence below is a bond
// delta and/or a thread/residue write.
//
// THE SHAPE THE REST OF THE POOL SHOULD COPY: a family is a handful of
// low-drama connective events (confide, trade a read, a late check-in) plus
// ONE flagship event that is a CHECK, not a coin flip with flavour text
// pasted over it — see trustVoteCommitment below. Text variants are for
// wording; the fork itself has to come from stats, archetype, or an existing
// thread's state, or "four outcomes" is really one outcome wearing masks.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent, isNervy, emotionalStateOf } from '../events.js';
import { sceneApi, arcAdvanceCiting } from './effects.js';
import {
  findOpenThread, openThreadsFor, heatAt, lastClosedThread, outcomeSense,
} from '../threads.js';
// A PURE READ of what somebody already thinks — the same import
// js/tr/castle/suspicion.js holds, and it writes nothing.
import { suspicion } from '../deduction.js';
import { lineFor } from './lines.js';

const FAMILY = 'trust';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/**
 * ROUND 2 FIX (dead-event audit at real season scale): `findOpenThread(kind,
 * [a, b])` requires the SAME TWO PEOPLE to be the exact scene the runner
 * draws again — and at a 20-person cast, a specific pair is redrawn on
 * roughly 1 in 300 draws (`_sceneActors` in events.js samples uniformly
 * over the living cast, with no awareness of thread state). A continuation
 * event gated on the exact original pair is therefore not "uncommon," it is
 * unreachable in practice: `trust-late-checkin` and `trust-vow-of-silence`
 * both measured ZERO firings across 60 real seasons before this fix, even
 * though their preconditions (a still-open trust thread) are common. The
 * fix reads whether EITHER actor drawn into the current scene is a party to
 * an open thread of this kind at all, and pulls the actual partner from the
 * thread's own `parties`, rather than requiring the scene to already be
 * that exact pair.
 */
// WHOLE-PLAN REVIEW, F4: this helper has the same loose match as romance.js's
// twin, for the same reason, and the same `every` fix was tried on both and
// rejected on the same measurement. See the long note over
// `_threadForActors` in js/tr/castle/romance.js. The half that WAS fixed is
// in `pickEvent` (js/tr/events.js): the cooldowns now key on who the event
// actually wrote, not only on who the scene convened.
function _threadForActors(kind, actors, ep) {
  for (const n of actors || []) {
    const hit = openThreadsFor(n, ep).find(t => t.kind === kind);
    if (hit) return hit;
  }
  return null;
}

// ── REWRITE (Task 7 stage 5), AND THE AUDIT'S TWO MERGES FOLDED IN ────
//
// The audit's verdict here was REWRITE ("one branch — the fork is in the
// wording, not in the game"), and its verdict on `trust-circle-forms` and
// `trust-inner-circle-invite` was MERGE INTO THIS ONE: all three were the
// same premise, warmth quietly becoming a unit, told three times. Neither of
// those two events is deleted — an `evening` scene is worth more than a tidy
// registry — but the premise they were duplicating now lives here as a real
// branch, so the three of them stop being interchangeable.
//
// AND THIS EVENT BECAME THE LOUDEST IN THE CASTLE THE MOMENT THE WINDOW
// OPENED UP. `runWindow`'s barren-draw fix took `evening` from 1.98 scenes an
// episode to 4.58; this fired proportionally more, out of a four-line pool,
// and went to the top of the blame table at 21 of 287 loud seasons.
//
// FIVE THINGS THAT HAPPEN WHEN SOMEBODY TELLS YOU A REAL ONE. The fork is
// `{b}`'s, because the person doing the confiding has already decided; what
// is undecided is what the room's other half does with it.
//
//   confided        — it is taken the way it was meant, and nothing is asked
//                     for in return.
//   traded-it       — {b} answers with one of their own, which is the only
//                     way this ever becomes mutual.
//   invited-them-in — the confidence turns into an offer: not a feeling any
//                     more, an arrangement. This is the merged premise.
//   regretted-it    — {a} hears themselves, watches {b} file it, and cannot
//                     take it back.
//   nearly-said-it  — THE SOLO BRANCH, and it is the widening the yield
//                     measurement asked for rather than a new event. Measured
//                     over 60 seasons, a solo draw in `evening` faced 0.51
//                     eligible events against a pair draw's 8.49, which is
//                     why that window was starving. Somebody carrying a thing
//                     they cannot say, going as far as the door of the room
//                     the person is in, is the same premise with the second
//                     half withheld.
const CONFIDE_LINES = {
  confided: [
    '{a} told {b} something they had not said out loud to anyone else in the castle.',
    '{a} let their guard down with {b} for a minute, and meant it.',
    'Over cold coffee, {a} admitted to {b} how frightened they actually were.',
    '{a} confided a real fear to {b} — not a strategic one, a personal one.',
    '{a} said the true version out loud to {b} and {b} did not make {a} pay for it.',
    'It took {a} two goes to get it out. {b} waited through both of them.',
  ],
  'traded-it': [
    '{a} said a real thing to {b}, and {b} put one down next to it.',
    '{a} went first. {b} went second, and {b} went further, which had not been the deal.',
    'By the end of it neither {a} nor {b} could have used what they had without losing what they had.',
    'They ended up telling each other the two worst nights of the season, {a} and {b}, in the wrong order.',
    '{a} confided and {b} confided back, and the balance came out level, which is rarer here than it sounds.',
    '{b} answered a real thing with a real thing, and that is the whole of what happened.',
  ],
  'invited-them-in': [
    'It stopped being a confession halfway through and turned into an offer. {b} said yes.',
    '{a} told {b} the frightening version and then told {b} what they were going to do about it, and made it "we".',
    '"So it is us, then," {b} said, when {a} had finished, and {a} had not been going to put it that plainly.',
    '{a} meant to say one true thing to {b}. What {a} and {b} came out of that room with was an arrangement.',
    'What began as {a} being honest ended with {a} and {b} agreeing who they were, out loud, for the first time.',
    '{b} heard {a} out and then did the thing nobody does here, which was to commit to something.',
  ],
  'regretted-it': [
    '{a} heard themselves saying it and could not stop, and watched {b}’s face while it came out.',
    '{a} said one thing too many to {b} and knew it before the sentence had finished.',
    '{b} did not react at all, which is how {a} knew {b} had kept it.',
    '{a} gave {b} something real and spent the rest of the evening working out what {b} would do with it.',
    'It was too much. {a} could see it landing as too much, and there is no unsaying a thing like that.',
    '{b} said the right words back and had already filed it, and {a} caught the filing.',
  ],
  'nearly-said-it': [
    '{a} got as far as the door of the room {a} had been going to say it in, and then went to bed.',
    'There is one person in this castle {a} could have told, and {a} spent the evening not going to find them.',
    '{a} rehearsed it, the whole true version, and then said something about the weather instead.',
    'It sat in {a} all evening, and {a} took it upstairs still sitting there.',
    '{a} decided that there is nobody here you can say that to, and was not entirely sure that was true.',
    '{a} nearly said it twice and got as far as the first word once.',
    'The thing about a castle is that a real sentence costs more than it is worth, and {a} did the sum and kept quiet.',
    'Nobody asked {a} how {a} was, which was a relief, and was not.',
    '{a} wrote none of it down, said none of it, and carried all of it up the stairs.',
    'It would have taken nine words. {a} could not find a night to spend them in.',
    '{a} said a version of it to the mirror, which is not the same and is what {a} had.',
    'The person {a} wanted to tell is the person it is about, which is the whole trouble with it.',
    '{a} started the sentence three times in {a}’s head and could not get past the second word.',
    'It is not that {a} does not trust anybody. It is that trusting anybody costs more this week.',
    '{a} looked round the room at dinner and did the sum on each of them and got no for all of them.',
    'There was a moment in the corridor when {a} could have, and {a} said goodnight instead.',
    '{a} put it away again, carefully, the way you put away a thing you intend to get out later.',
    'Everyone else seemed to have somebody. {a} noticed that, which did not help.',
  ],
};

registerEvent({
  id: 'trust-confide-fear',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'social', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  // Confiding needs SOME warmth already, or it reads as a stranger
  // oversharing — that is a different, worse event than the one intended.
  // WIDENED TO A SOLO DRAW (Task 7 stage 5): the solo branch needs no warmth
  // to gate on, because there is nobody to be warm with, and `evening` needs
  // every solo-capable event it can get. See the header.
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    if (ctx.actors.length === 1) return 1.5;
    const [a, b] = ctx.actors;
    const bond = getBond(a, b);
    if (bond < 1) return 0;
    return 2 + Math.min(3, bond / 3);
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-confide-fear');
    const [a, b] = ctx.actors;
    if (!b) {
      const soloWhy = 'carried something all evening and did not say it';
      const t = api.openArc(FAMILY, [a], { source: soloWhy,
        seed: lineFor(CONFIDE_LINES['nearly-said-it'], `trust-confide-fear|nearly-said-it|${ctx.ep}`, { a }) });
      return { branch: 'nearly-said-it', actor: a, threadId: t?.id, bondDelta: 0 };
    }
    const st = pStats(b);
    const scores = {
      confided: (st.loyalty / 10) * 0.45 + (st.temperament / 10) * 0.3 + 0.2,
      'traded-it': (st.social / 10) * 0.45 + Math.max(0, getBond(a, b)) / 10 * 0.35,
      'invited-them-in': (st.boldness / 10) * 0.35 + Math.max(0, getBond(a, b) - 4) / 10 * 0.6,
      'regretted-it': (st.strategic / 10) * 0.4 + (1 - st.loyalty / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'traded-it' ? 'answered a real thing with a real thing'
      : branch === 'invited-them-in' ? 'turned a confidence into an arrangement'
        : branch === 'regretted-it' ? 'said one thing too many and could not take it back'
          : 'confided a real fear';
    const bondDelta = branch === 'confided' ? 1.5
      : branch === 'traded-it' ? 2 : branch === 'invited-them-in' ? 2.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const note = lineFor(CONFIDE_LINES[branch], `trust-confide-fear|${branch}|${ctx.ep}`, { a, b });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});

// ── TASK 7 STAGE 4: REWRITTEN, AND WIDENED TO A SOLO DRAW ─────────────
//
// The audit's verdict on this event was REWRITE: "one branch (`traded-reads`)
// — the fork is in the wording, not in the game." It is also the highest-
// firing event in the whole `after-table` window, so a single-branch flagship
// was costing that window most of its variety.
//
// FOUR PAIRED BRANCHES, and they are four different things that happen when
// two people compare reads: it is genuinely mutual, or one of them pays and
// the other does not, or they land on the SAME name and it becomes an
// arrangement, or they land on different names and that costs them something.
// The last two are chosen by what the two of them actually think, not by the
// roll — `suspicion()` is the read each already holds, so the scene's outcome
// is a fact about the season rather than a coin.
//
// AND A SOLO BRANCH, which is the widening the yield measurement asked for
// rather than a fifth event. `after-table` spent 26% of its phase budget and
// eleven of its fourteen events refused a one-person draw outright; `runWindow`
// BREAKS on the first draw with nothing eligible, so one solo draw cost the
// rest of the night. The same premise with nobody to trade with is a person
// working out, on their own, which of the room they would actually stand next
// to — which is the trust family's own question asked quietly.
const TRADE_LINES = {
  'traded-reads': [
    '{a} and {b} compared notes on {c} — quietly, and to no one else.',
    '{a} asked {b} point blank what they made of {c}. {b} told them.',
    'Walking back from the table, {a} and {b} traded honest reads on {c}.',
    '{a} and {b} spent ten minutes on {c} and did not once say anything they would repeat elsewhere.',
    '“What do you actually think about {c},” {b} asked, and {a} answered the actual question.',
    '{a} gave {b} the version of their read on {c} that had the doubts still in it.',
  ],
  'one-way': [
    '{a} gave {b} a real read on {c} and got back something that could have been said to anybody.',
    '{a} paid first, as usual, and {b} did not pay at all, and both of them noticed which.',
    '“Your turn,” {a} said, having gone first about {c}. {b}’s turn lasted about four seconds.',
    '{b} listened to everything {a} thought about {c} and volunteered nothing whatsoever in return.',
    '{a} came away from that conversation having given {b} more than {a} had meant to.',
  ],
  'same-name': [
    '{a} and {b} arrived at {c} separately and independently, and that turned into an arrangement.',
    'Both of them said {c}. Neither had planned to, and by the end of it {a} and {b} were a unit.',
    '“{c}.” “{c}.” {a} and {b} said it at almost the same time and then had to decide what to do about it.',
    '{a} and {b} found they had the same name and spent the rest of the conversation on what to do with it.',
    'Two people got to {c} by different routes, and {a} and {b} both understood what that was worth.',
  ],
  disagreed: [
    '{a} said {c}. {b} said somebody else entirely, and neither of them could move the other one.',
    '{a} and {b} did not agree about {c}, and by the end of it they were not really talking about {c}.',
    '“You’re wrong about {c},” {b} said, and would not say who {b} had instead, which was worse.',
    '{a} put {c} up and {b} took it apart, and something between them was slightly colder afterwards.',
    'It was supposed to be two people helping each other. It turned into {a} defending {c} to {b}.',
  ],
  // ── TASK 7 STAGE 5: THE SOLO BRANCH SPLIT IN TWO, AND BOTH WIDENED ────
  //
  // `read-the-room` was the loudest single source of within-season repetition
  // left in the castle after this stage's first batch — 13 of the 134 seasons
  // that printed a sentence three times, measured over 800. The cause is
  // structural rather than a bad pool: this is the ONLY branch this event has
  // on a solo draw, so every one of its solo firings in a season came out of
  // one eight-line pool, and a three-way collision over eight runs at about
  // 6% per triple of firings.
  //
  // Both terms of that get attacked. The pool is a SECOND SOLO ACTION rather
  // than eight more sentences for the same one: ranking the whole room is one
  // scene, and going back over one specific person the castle has already
  // resolved something about is a different one. `lastClosedThread` on that
  // person is the record the second branch is built on — how the last story
  // about them ENDED, which the whole castle watched being made — and it is
  // the same record the paired branches already cite.
  'read-the-room': [
    '{a} went through the room, name by name, and worked out which of them {a} would actually stand next to.',
    'Nobody to trade with, so {a} did it alone: the whole list, in order, ranked by nothing {a} could prove.',
    '{a} sat with the question of who in this castle {a} genuinely believes, and did not like how short the list was.',
    'It is easier to be honest about the room when nobody in it is listening. {a} took the opportunity.',
    '{a} tried to put a name to the feeling and could not, and spent the rest of the hour on it anyway.',
    '{a} had reads on all of them and evidence for none, and knew exactly which of those two matters.',
    'On {a}’s own, the list came out different from the one {a} would have said out loud, which was the point.',
    '{a} did the whole room from memory and stopped, twice, at the same name, and could not say why.',
    '{a} sorted the castle into people {a} would tell something to and people {a} would not, and the second pile was most of it.',
    'It took {a} about four minutes to rank the room and the rest of the hour to stop rearranging the top of it.',
    '{a} started the list from the person {a} trusted most and got about three names in before it stopped being easy.',
    '{a} did it the other way round for once — worst first — and found the answer came out faster.',
    'Alone on the landing, {a} put the whole room in order and then took the order apart again.',
    '{a} could have asked somebody. {a} did not want the answer contaminated by somebody else wanting something.',
  ],
  'went-back-over-one': [
    '{a} did not do the whole room tonight. {a} did {c}, twice, from the beginning.',
    'Everybody else had moved on from {c}. {a} sat on the stairs and went through it again.',
    'There was one name {a} could not leave where the castle had left it, and it was {c}’s.',
    '{a} spent the hour on a single person, which is either thorough or a symptom, and {a} was not sure which.',
    '{a} went back over every conversation {a} had ever had with {c} looking for the one that did not fit.',
    'The room had made its mind up about {c}. {a} unmade it, privately, and put it back together differently.',
    '{a} kept starting at the beginning with {c} and arriving somewhere slightly worse each time.',
    'One name, all evening. {a} would have been embarrassed to admit how much of the night went on {c}.',
    '{a} tried very hard to be finished with {c} and got to the top of the stairs and turned round.',
    '{a} wrote nothing down about {c}, because writing it down would have made it a thing {a} had done.',
    'It is possible {a} was wrong about {c}. {a} spent an hour finding out and came back no surer.',
    '{a} went over {c} again the way you press a bruise, deliberately, and for no useful reason.',
  ],
};

registerEvent({
  id: 'trust-trade-reads',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['social', 'strategic', 'loyalty', 'intuition'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    // WIDENED FROM `length !== 2` TO "one or two". See the header above.
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    if (ctx.actors.length === 1) return 1.5;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 2 : 0.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-trade-reads');
    const sceneWhy = 'traded honest reads on somebody';
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    // SPEC 5.5, BRANCHING ON A CLOSED THREAD'S OUTCOME. An honest read on
    // somebody is mostly a memory of how the last thing about them ended, and
    // the castle wrote that down when closeThread named the outcome.
    const prior = lastClosedThread(target, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    if (!b) {
      // TWO SOLO SCENES, AND THE RECORD DECIDES WHICH IS AVAILABLE. Going back
      // over one person needs the castle to have already closed a story about
      // them; without one there is nothing to go back over, and the branch
      // scores zero rather than inventing a history for `{c}`.
      const sa = pStats(a);
      const canRevisit = !!prior;
      const wide = (sa.strategic / 10) * 0.45 + (sa.mental / 10) * 0.3 + 0.2;
      const deep = canRevisit ? (sa.intuition / 10) * 0.55 + (sa.temperament / 10) * 0.2 : 0;
      const soloBranch = rng() * (wide + deep) < wide ? 'read-the-room' : 'went-back-over-one';
      let soloNote = lineFor(TRADE_LINES[soloBranch],
        `trust-trade-reads|${soloBranch}|${ctx.ep}`, { a, c: target });
      if (soloBranch === 'went-back-over-one') {
        if (sense === 'walked') soloNote += ` ${target} had been asked once and had come out of it clean, and that was the part ${a} kept returning to.`;
        else if (sense === 'cracked') soloNote += ` Something had come out of ${target} once already, and ${a} could not make it mean nothing.`;
        else if (sense === 'coupled') soloNote += ` Most of what ${a} had on ${target} was really about who ${target} had been spending the evenings with.`;
      }
      const t = api.openArc(FAMILY, [a], { source: sceneWhy, seed: soloNote });
      return { branch: soloBranch, actor: a, subject: soloBranch === 'went-back-over-one' ? target : undefined,
        threadId: t?.id, bondDelta: 0, priorOutcome: prior?.outcome ?? null };
    }
    // WHAT THE TWO OF THEM ALREADY THINK decides the last two branches, so
    // `same-name` is a real convergence and `disagreed` is a real difference.
    const agree = suspicion(a, target, ctx.ep) > 0 && suspicion(b, target, ctx.ep) > 0;
    const sb = pStats(b);
    const branch = agree && rng() < 0.55 ? 'same-name'
      : rng() < (1 - sb.social / 10) * 0.5 + 0.15 ? 'one-way'
        : (suspicion(a, target, ctx.ep) > 0) !== (suspicion(b, target, ctx.ep) > 0) ? 'disagreed'
          : 'traded-reads';
    let note = lineFor(TRADE_LINES[branch], `trust-trade-reads|${branch}|${ctx.ep}`,
      { a, b, c: target });
    // NO DAY NUMBER: see the note in suspicion.js's susp-noticed-inconsistency.
    // "day N" belongs to same-thread residue citation and is guarded as such.
    if (sense === 'walked') note += ` Both of them remembered ${target} being asked once, and coming out of it clean.`;
    else if (sense === 'cracked') note += ` Neither of them had forgotten what came out of ${target} the last time.`;
    else if (sense === 'coupled') note += ` Whatever ${target} was doing, it had stopped being a secret a while ago.`;
    const bondDelta = branch === 'same-name' ? 2.5
      : branch === 'traded-reads' ? 1 : branch === 'one-way' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'disagreed' ? 'suspicion' : FAMILY;
    const t = api.openArc(kind, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, about: target, threadId: t?.id,
      bondDelta, priorOutcome: prior?.outcome ?? null };
  },
});

// A closer circle than a single confidence — gated behind real warmth (rare,
// so the RARE_MULTIPLIER guard in events.js can do its job: a rare event
// that never gets the amplification cannot outbid common events on raw
// weight, no matter how good it reads).
const CIRCLE_LINES = [
  '{a} and {b} agreed, without quite saying the word, that they were a unit now.',
  'Nobody said "alliance". {a} and {b} both left the conversation knowing that was what it had been.',
  '{a} started saying "we" about things {a} used to say "I" about, and {b} did not correct it.',
  'It was decided somewhere between the stairs and the door, by {a} and {b}, and never announced.',
  '{b} said "you and me, then," and {a} said "you and me," and that was the whole ceremony.',
];

registerEvent({
  id: 'trust-circle-forms',
  family: FAMILY,
  window: 'evening',
  // ACT: OPENING (spec 5.4.3, 'early: broad, social, thread-opening'). Two
  // people deciding they are a unit is a thing that happens while there is
  // still a season left to be a unit FOR; in the back half the alliances
  // that exist are the ones that already exist, and what is left is
  // testing and breaking them.
  acts: { early: 1.4, middle: 1.2, late: 0.5 },
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 4 ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'trust-circle-forms');
    const sceneWhy = 'became a unit without saying so';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 2, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(CIRCLE_LINES, `trust-circle-forms|${ctx.ep}`, { a, b }) });
    return { branch: 'circle', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

// ── FLAGSHIP: the vote commitment test — a check, not a coin ───────────
//
// "Will you vote with me tonight?" is not one event with eight phrasings. It
// is a fork with FOUR distinct outcomes, and each one writes different
// residue and leaves a different story open:
//   KEPT      — the commitment holds. Warms the pair, and is itself evidence
//               the next writer can build a "who keeps their word" thread on.
//   BROKEN    — the ask is honoured in the room and abandoned in the booth.
//               The asker's trust in this person takes real, lasting damage.
//   DEFLECTED — no promise either way. Nothing moves much, but the ask itself
//               is now on the record (residue), which is what lets a LATER
//               event reference "the time they wouldn't commit."
//   TURNED    — the asked flips the dynamic and asks the asker to commit
//               FIRST. Structural, not just narrated: the prior thread (if
//               any) is CLOSED with outcome 'turned-back' and the new one is
//               opened with `parties` REVERSED, so `thread.parties[0]` tells
//               a downstream reader who is actually on the spot now — see
//               the comment in fire() for why party order survives the
//               sorted lookup key.
//
// The fork is driven by the asked player's own stats plus the EXISTING bond,
// not a bare RNG draw dressed up after the fact — a real check has to be
// something an author could get wrong by mutating, which is exactly what the
// mutation pass below exercises.
const COMMIT_LINES = {
  kept: [
    '{b} looked {a} in the eye and said "count on it" — with none of the usual room left around the promise.',
    '{b} gave {a} one name, plainly, and did not hedge when {a} asked a second time.',
    '{b} made the promise cleanly enough that {a} stopped checking for an exit hidden inside it.',
    '{a} asked for certainty. {b} answered with the one name they genuinely intended to put down.',
  ],
  broken: [
    '{b} promised {a} their vote, smiled, and kept the name they actually intended to write to themselves.',
    '{a} believed {b}. {b} left the conversation knowing the promise was false.',
    '{b} said the name {a} needed to hear and privately kept a different one.',
    'The promise sounded firm. It was already broken in {b}\'s head.',
  ],
  deflected: [
    '{b} never actually said yes — they talked around it until {a} stopped pushing.',
    '{a} asked for a number. {b} gave them a vibe.',
    '{b} agreed with everything {a} said and committed to none of it.',
    '{a} asked twice. {b} answered a slightly different question both times.',
  ],
  turned: [
    '{b} answered the ask with an ask of their own: "you first."',
    'Instead of committing, {b} turned it around on {a} — now THEY owe an answer.',
    '{b} wanted to know why {a} needed to know, and would not move until {a} answered that.',
    'By the end {a} had made a promise and {b} had made none, and neither had planned that.',
  ],
};

registerEvent({
  id: 'trust-vote-commitment-test',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Needs a relationship worth staking a vote on — this is not a stranger's
    // question, it is a question you only ask someone you already talk to.
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-vote-commitment-test');
    const sceneWhy = 'asked for a vote to their face';
    const [asker, asked] = ctx.actors;
    const st = pStats(asked);
    const bond = getBond(asker, asked);
    // The real check: keeping a commitment scales with loyalty and the
    // existing bond; breaking one scales with strategic ambition against low
    // loyalty; deflecting is what a low-boldness player does under pressure
    // instead of choosing either extreme; turning it back is a boldness +
    // intuition move — reading the ask as leverage rather than a question.
    const keepScore = (st.loyalty / 10) * 0.6 + Math.max(0, bond) / 10 * 0.4;
    const breakScore = (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.5;
    const deflectScore = (1 - st.boldness / 10) * 0.7 + 0.15;
    const turnScore = (st.boldness / 10) * 0.5 + (st.intuition / 10) * 0.5;
    const total = keepScore + breakScore + deflectScore + turnScore;
    const roll = rng() * total;
    let branch;
    if (roll < keepScore) branch = 'kept';
    else if (roll < keepScore + breakScore) branch = 'broken';
    else if (roll < keepScore + breakScore + deflectScore) branch = 'deflected';
    else branch = 'turned';

    const line = pick(rng, COMMIT_LINES[branch]).replace(/\{a\}/g, asker).replace(/\{b\}/g, asked);
    const existing = findOpenThread(FAMILY, [asker, asked]);
    let bondDelta = 0;
    let thread;
    if (branch === 'kept' || branch === 'broken' || branch === 'deflected') {
      bondDelta = branch === 'kept' ? 2 : branch === 'broken' ? -3 : 0;
      if (bondDelta) api.addBond(asker, asked, bondDelta, { source: sceneWhy });
      thread = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [asker, asked], { source: sceneWhy, seed: line });
    } else {
      // STRUCTURAL reversal, not a narration-only one: any prior commitment
      // thread for this pair is CLOSED (a real state transition, matching
      // how susp-private-accusation resolves its own 'turned' branch), and
      // the replacement thread is opened with `parties` REVERSED —
      // `openThread`/`findOpenThread` key lookups on the SORTED party set,
      // so this changes nothing about how the thread is found, but
      // `thread.parties` itself preserves insertion order (see threads.js:
      // `parties: [...parties]`), so a downstream reader can check
      // `thread.parties[0]` to learn whose move it actually is now — the
      // asked player, not the original asker. Earlier this branch opened
      // the SAME [asker, asked] order as every other branch and only the
      // prose claimed a reversal; that claim was false and nothing
      // downstream could have told the two cases apart.
      bondDelta = -1;
      api.addBond(asker, asked, bondDelta, { source: sceneWhy });
      if (existing) api.resolveArc(existing.id, 'turned-back', { source: sceneWhy });
      thread = api.openArc(FAMILY, [asked, asker], { source: sceneWhy, seed: line });
    }
    return { branch, pair: [asker, asked], onTheSpot: branch === 'turned' ? asker : asked,
      threadId: thread?.id, bondDelta };
  },
});

const HUDDLE_LINES = [
  '{a} and {b} sat close after last night, and neither one pretended they weren\'t scared.',
  '{a} and {b} found each other before anybody else was down, and stayed together all morning.',
  'Neither {a} nor {b} said the word "frightened". They sat shoulder to shoulder for an hour instead.',
  '{a} got to {b} first, and {b} had been waiting to be got to.',
  'Whatever else was true this morning, {a} and {b} were not going to be alone in it.',
];

registerEvent({
  id: 'trust-post-murder-huddle',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (getBond(a, b) < 0) return 0;
    return _sawMurderLastNight(ctx) ? 2 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'trust-post-murder-huddle');
    const sceneWhy = 'huddled after the news';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 2, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(HUDDLE_LINES, `trust-post-murder-huddle|${ctx.ep}`, { a, b }) });
    return { branch: 'huddled', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

const PACT_LINES = [
  '{a} and {b} made it explicit: whatever happens, neither one puts the other\'s name down.',
  '{a} said it plainly to {b} — never you, not once, not even as a spare.',
  'They shook on it, {a} and {b}, which nobody in this castle does lightly.',
  '{b} asked {a} for the one guarantee worth having, and got it, and gave it back.',
  '{a} and {b} agreed there was no version of any night where either wrote the other down.',
];

registerEvent({
  id: 'trust-protect-pact',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (getBond(a, b) < 3) return 0;
    return findOpenThread(FAMILY, [a, b]) ? 3 : 1;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'trust-protect-pact');
    const sceneWhy = 'agreed to protect each other';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 1, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(PACT_LINES, `trust-protect-pact|${ctx.ep}`, { a, b });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'pact', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

// ── REWRITE (Task 7 stage 5). `trust-late-checkin:checked-in` was the
// second-loudest repeat in the castle (16 of 144 loud seasons over 800),
// and for the same reason as `grief-keepsake`: one branch, a five-line pool,
// and a dawn event that fires several times a season.
//
// THE PREMISE IS RIGHT AND THE FORK WAS MISSING. Checking in on an
// arrangement is what people in a castle actually do at dawn — but a
// check-in has an ANSWER, and the answer is the scene. Four of them, and
// they are four different mornings rather than four wordings of one:
//
//   still-good        — the arrangement holds and both of them said so.
//   asked-for-a-name  — one of them wants it made concrete tonight, and
//                       being asked for a name is not the same as being
//                       asked if you are still good.
//   air-in-the-answer — the words were right and the delivery was not, and
//                       the person who asked walked away knowing it.
//   checked-on-them   — not about the arrangement at all. GATED ON THE
//                       PUBLIC RECORD: reachable only when the other party
//                       took a ballot at the last Round Table, which the
//                       whole castle watched being read out. A knowledge
//                       axis with a fact behind it, not a mood.
const CHECKIN_LINES = {
  'still-good': [
    '{a} checked in with {b}. The arrangement was still holding.',
    '{a} caught {b} on the stairs, asked nothing in particular, and got the answer they wanted.',
    'Neither of them named it. {a} asked if they were still good and {b} said they were.',
    '{a} wanted to hear it out loud again this morning, and {b} said it again without complaint.',
    'It took four words at the door, and {a} went into the day steadier for them.',
    '{b} saw {a} coming and answered the question before {a} had asked it.',
    'It was over in the time it takes to pour two coffees, and both of them felt better for it.',
    '{a} did not need reassuring and took the reassurance anyway, and {b} did not make anything of that.',
  ],
  'asked-for-a-name': [
    '{a} did not want to know if they were still good. {a} wanted a name for tonight, and asked for one.',
    '"Fine," {a} said, "but who." {b} had not expected the morning to start there.',
    '{a} pushed past the pleasantries at the bottom of the stairs and asked {b} to commit to somebody.',
    'The check-in lasted about a minute before {a} turned it into a question with a name in it.',
    '{b} came down expecting the usual two words and got asked to pick.',
    '{a} said they would go first if {b} would go second, and then said a name to prove it.',
    'It stopped being a check-in the moment {a} said "so who are we writing".',
    '{a} wanted the arrangement to mean something today rather than in general, and said so.',
  ],
  'air-in-the-answer': [
    '{b} said all the right words to {a} and left a gap in the middle of them.',
    '{a} asked if they were still good and {b} said "of course", and {a} spent the morning on the "of course".',
    'The answer came a beat late. It was the right answer. {a} noticed the beat.',
    '{b} agreed with everything {a} said and did not add a single thing to any of it.',
    '{a} went looking for reassurance and got the shape of it without the weight.',
    '{b} would not look up from the toast for the whole of it, and {a} counted that.',
    'Nothing {b} said was wrong. {a} came away from it worse than before asking, all the same.',
    '"We\'re good," {b} said, and then said it again, which was one time too many.',
  ],
  'checked-on-them': [
    '{a} did not mention the arrangement at all. {a} asked {b} how they were after last night, and waited for a real answer.',
    'Half the room had said {b}\'s name at that table. {a} came and sat down next to {b} at breakfast and asked nothing about strategy.',
    '{b} had taken votes last night and had not slept. {a} did not need telling and turned up anyway.',
    '{a} found {b} first thing and made it clear the visit was not about tonight.',
    '"Not asking you for anything," {a} said, and then did not ask {b} for anything, which {b} had not expected.',
    '{a} let the arrangement go unmentioned for one morning, because {b} had had their name read out and that was the bigger thing.',
    '{b} had been braced for a strategy conversation. {a} brought tea and sat down and talked about nothing.',
    'It was the first thing anybody had said to {b} since the table that was not about the table.',
  ],
};

registerEvent({
  id: 'trust-late-checkin',
  // CITES (Plan 5 Task 2). "The arrangement" is whichever one they made, and
  // the day they made it on is the difference between a check-in and a
  // sentence about nothing.
  citesResidue: true,
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'boldness', 'temperament', 'social'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['close-ally', 'neutral'],
  },
  // ACT: CLOSING. Widened from `{ late: 1.5 }` into a full profile by Plan 5
  // Task 5: a quiet check-in on somebody after the table reads as ordinary
  // manners in week one and as a survival move at final six, so the early
  // term earns its place as much as the late one.
  acts: { early: 0.6, late: 1.5 },
  // DECISION (round 1 fix): originally gated on `heatAt >= 1`. Heat starts at
  // 1 on open and decays 0.5 per round of silence, and this window (dawn)
  // only ever sees a trust arc AFTER at least one full round has elapsed
  // since it last moved — most of these windows run before that same
  // arc's own evening/after-table slot has fired again. So `>= 1`
  // required the arc to have already been ADVANCED at least once
  // (heat 2 -> 1.5 after one round of decay) before this could ever be
  // eligible — a conjunction measured at 0.2% of trust firings over 250
  // seasons, which is the dead-content failure rare-state amplification
  // exists to prevent, not a deliberately rare beat (nothing about "checking
  // in" is meant to be rarer than the pact it follows up on). Loosened to
  // `> 0`: any trust arc that hasn't fully gone cold yet, which a plain
  // single-open arc (heat 1) still satisfies one round later (0.5 > 0).
  // `rare: true` was considered and rejected — that flag amplifies a weight
  // that is ALREADY positive when eligibility is rolled; it does nothing for
  // an event whose real problem is that eligibility itself almost never
  // triggers, which is what was happening here.
  // ROUND 2 FIX: see `_threadForActors` above — this used to require the
  // exact original pair to be the scene, which measured ZERO firings across
  // 60 real seasons. Now any open trust arc involving either actor
  // drawn into the scene qualifies, and the real partner is read off the
  // arc's own `parties`.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    // TWO PARTIES, BECAUSE `fire()` DESTRUCTURES THEM (Task 7 stage 3). This
    // is a two-person scene that reads its people off the arc rather than off
    // the draw, so a ONE-party `trust` arc hands `fire()` `b === undefined`
    // and the scene API refuses the bond outright — a thrown season, not a
    // skipped scene. The pool held no one-party trust arc when this was
    // written, so the guard is inert today and this is exactly why it is
    // cheap: the first event anywhere to open one would otherwise take the
    // window down, and it would take it down in whichever season happened to
    // draw the pair. Measured as a real crash while widening
    // `mission-what-the-day-was-worth` to solo, which is why that widening was
    // withdrawn and this line added instead.
    if (!t || t.parties.length < 2) return 0;
    return heatAt(t, ctx.ep) > 0 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-late-checkin');
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const st = pStats(b);
    // THE PUBLIC RECORD DECIDES WHETHER THE FOURTH BRANCH EXISTS. `ctx.state`
    // is a frozen read of the last Round Table's ballots and accusations —
    // every one of which was read out in front of the room — so an event
    // gated on it is gated on something both people in this scene watched.
    // `ctx.state` is keyed on the CONVENED actors, and this event reads its
    // people off the arc instead, so the state is taken from the source
    // rather than from the map when the arc's partner was not convened.
    const bState = ctx.state?.[b] ?? emotionalStateOf(b, ctx.ep);
    const scores = {
      'still-good': (st.loyalty / 10) * 0.5 + (st.temperament / 10) * 0.3 + 0.2,
      'asked-for-a-name': (pStats(a).boldness / 10) * 0.45 + (pStats(a).strategic / 10) * 0.35,
      'air-in-the-answer': (1 - st.loyalty / 10) * 0.5 + (1 - st.social / 10) * 0.25,
      'checked-on-them': isNervy(bState) ? (pStats(a).social / 10) * 0.5 + Math.max(0, getBond(a, b)) / 10 * 0.5 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'asked-for-a-name' ? 'wanted the arrangement to name somebody tonight'
      : branch === 'air-in-the-answer' ? 'got the right words and not much behind them'
        : branch === 'checked-on-them' ? 'checked on somebody the room had voted for'
          : 'checked in before the day started';
    const bondDelta = branch === 'still-good' ? 1
      : branch === 'asked-for-a-name' ? 0.5
        : branch === 'air-in-the-answer' ? -0.5 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const note = lineFor(CHECKIN_LINES[branch], `trust-late-checkin|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta, state: bState };
  },
});

/**
 * Did somebody die overnight, in the round that just closed? Grief.js has an
 * equivalent (and the flagship reaction lives there) — this local copy exists
 * because trust-post-murder-huddle needs the SAME fact for a much smaller
 * purpose (gating one connective event) and importing grief.js from trust.js
 * would make the two families depend on each other's load order for no
 * reason. Both read the same round shape from headless.js: `round.murdered`
 * on the round whose `ep` is one behind the current one.
 */
function _sawMurderLastNight(ctx) {
  const rounds = gs?.tr?.rounds;
  if (!rounds) return false;
  return rounds.some(r => r.ep === ctx.ep - 1 && r.murdered);
}

// ── Task 6 additions: scaling the family without diluting it ──────────

const SHARE_SUSPICION_LINES = [
  '{a} told {b}, flat out, who they were actually worried about — no hedging.',
  '{a} handed {b} a real read on {c}, the kind you only give someone you trust.',
  '{a} could have hedged about {c} and did not, which {b} noticed and valued.',
  '"It\'s {c}," said {a}, with nothing else attached, and let {b} do what they liked with it.',
  '{a} gave {b} the unflattering version of what they thought about {c}, out loud, first.',
  '{b} asked {a} straight and {a} answered straight, and {c}\'s name was in the answer.',
];

registerEvent({
  id: 'trust-share-suspicion-honestly',
  family: FAMILY,
  window: 'morning',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 2 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-share-suspicion-honestly');
    const sceneWhy = 'shared a suspicion honestly';
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    api.addBond(a, b, 1, { source: sceneWhy });
    const note = pick(rng, SHARE_SUSPICION_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'shared-suspicion', pair: [a, b], about: target, threadId: t?.id, bondDelta: 1 };
  },
});

const INVITE_LINES = [
  '{a} told {b}, in so many words: you\'re one of the people I\'m actually playing this with.',
  '{a} let {b} see the whole plan, including the parts that made {a} look bad.',
  'There is a shorter list than the one {a} talks about, and {a} told {b} they were on it.',
  '{a} stopped managing {b} and started including them, and said so.',
  '{b} realised halfway through that {a} was telling them the real version, and {a} let them realise it.',
];

registerEvent({
  id: 'trust-inner-circle-invite',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 5 ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'trust-inner-circle-invite');
    const sceneWhy = 'was brought inside';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 1, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(INVITE_LINES, `trust-inner-circle-invite|${ctx.ep}`, { a, b }) });
    return { branch: 'invited-in', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

// ── TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ────────────
//
// The verdict was "one branch (`favor-returned`) — the fork is in the wording,
// not in the game", and it was right: a favour was done, a bond went up by
// one, every single time. The four branches now are four different things a
// favour can be, and three of them are not warmth. Being kept in somebody's
// ledger is the one that matters: `kept-the-score` moves the bond DOWN and
// opens a suspicion story, because a favour you are expected to repay is a
// debt and both people in this castle know the difference.
const FAVOR_LINES = {
  'favor-returned': [
    '{b} did {a} a small, real favour tonight — the kind that only makes sense if the arrangement still holds.',
    '{b} took something off {a}’s plate without being asked and without mentioning it afterwards.',
    '{b} quietly sorted something out for {a} over a trivial thing, which is how you find out about the untrivial ones.',
    'Nobody saw {b} do it except {a}, and {b} had made sure of that.',
    '{a} had not asked. {b} had noticed anyway, and dealt with it.',
  ],
  'noticed-and-said-so': [
    '{a} caught {b} doing it and said thank you properly, out loud, which embarrassed both of them.',
    '“You didn’t have to do that,” {a} said. “I know,” said {b}, and that was the end of the conversation.',
    '{a} made a point of naming what {b} had done, in front of {b}, rather than filing it silently.',
    '{b} had meant it to go unnoticed and {a} noticed, and told {b} so, and meant it.',
    'It was a small thing and {a} treated it as a large one, which {b} did not correct.',
  ],
  'refused-it-back': [
    '{b} did {a} the favour and would not let {a} return it, which {a} found harder to accept than the favour.',
    '“We’re not keeping accounts,” {b} said, and {a} could not tell whether that was generosity or a position.',
    '{a} tried to square it and {b} would not be squared with, and the whole thing sat there unfinished.',
    '{b} waved it off twice. The second wave was firmer than the first and {a} stopped offering.',
    '“Get me back some other week,” {b} said, which is either kindness or an open invoice.',
  ],
  'kept-the-score': [
    '{b} did {a} the favour and mentioned it again about an hour later, in passing, to no particular purpose.',
    '{b} brought it up twice before bed. {a} had thanked {b} the first time.',
    '“That’s two you owe me,” {b} said, lightly, and {a} heard the number rather than the tone.',
    '{a} realised somewhere in the evening that {b} had been counting, and had been counting for a while.',
    '{b} was generous in the specific way that leaves a receipt, and {a} took the receipt.',
  ],
};

registerEvent({
  id: 'trust-return-favor',
  family: FAMILY,
  window: 'after-table',
  // The pair is [the one who receives, the one who does it] — and it is the
  // DOER who runs every one of these scenes, so the field is returned rather
  // than declared, because `roles: 'initiator-first'` would name the wrong one.
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'social', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return findOpenThread(FAMILY, [a, b]) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-return-favor');
    const sceneWhy = 'returned a favour';
    const [a, b] = ctx.actors;
    const existing = findOpenThread(FAMILY, [a, b]);
    const st = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      'favor-returned': (st.loyalty / 10) * 0.5 + Math.max(0, bond) / 10 * 0.3,
      'noticed-and-said-so': (pStats(a).social / 10) * 0.45 + 0.15,
      'refused-it-back': (1 - st.social / 10) * 0.4 + (st.loyalty / 10) * 0.25,
      'kept-the-score': (st.strategic / 10) * 0.45 + (1 - st.loyalty / 10) * 0.35,
    };
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    let roll = rng() * total;
    let branch = 'favor-returned';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const note = lineFor(FAVOR_LINES[branch], `trust-return-favor|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'favor-returned' ? 1
      : branch === 'noticed-and-said-so' ? 2 : branch === 'refused-it-back' ? 0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'kept-the-score' ? 'suspicion' : FAMILY;
    const target = kind === FAMILY ? existing : findOpenThread(kind, [a, b]);
    const t = target
      ? api.advanceArc(target.id, note, { source: sceneWhy })
      : api.openArc(kind, [a, b], { source: sceneWhy, seed: note });
    // `noticed-and-said-so` is the one branch where the person who received it
    // is doing the talking; everywhere else the doer runs the scene.
    const doerDrives = branch !== 'noticed-and-said-so';
    return { branch, pair: [a, b], speaker: doerDrives ? b : a, respondent: doerDrives ? a : b,
      threadId: t?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 5). Top of the blame table after the `evening`
// batch: one branch over a five-line pool, on a `rare`-amplified dawn event.
// The audit's verdict was MERGE (into `trust-late-checkin`); it is rewritten
// in place instead, because deleting an event costs `dawn` scenes it does not
// have to spare, and because once BOTH have a real fork they stop being the
// same scene — a check-in is about whether the arrangement holds, and this is
// about what the two of them will say if asked.
//
// FOUR VOWS, and the interesting ones are the two where the agreement has a
// shape to it rather than being a handshake:
//
//   vowed-silence      — the plain version: nothing leaves the room.
//   agreed-a-version   — they do not agree to say nothing, they agree what to
//                        say, which is a much more useful and much more
//                        incriminating kind of pact.
//   one-sided-vow      — {a} asks, {b} agrees, and {b} does not ask for the
//                        same back. The asymmetry is the scene.
//   would-not-promise  — {b} will not give the promise, and gives a reason,
//                        and the reason is the good part.
const VOW_LINES = {
  'vowed-silence': [
    '{a} and {b} agreed: whatever was said between them stays between them.',
    '{a} asked {b} never to repeat it, and {b} said they would not, and both of them believed it.',
    'They drew a line around the conversation, {a} and {b}, and agreed nothing crossed it.',
    '{b} promised {a} that nobody else would ever hear a word of it, including the parts that were nothing.',
    'It was a small agreement about a small thing, and {a} and {b} both understood it was not.',
    'Neither {a} nor {b} used the word promise. Both of them made one.',
  ],
  'agreed-a-version': [
    '{a} and {b} did not agree to say nothing. {a} and {b} agreed what to say, which is a different animal.',
    'They worked out, between them, the version of last night that both of them would give if asked.',
    '"If it comes up," {b} said, "we were in the kitchen." {a} had been about to suggest the same thing.',
    '{a} and {b} settled on one account and rehearsed the dull half of it twice.',
    'It stopped being a promise to keep quiet somewhere in the middle and became a script.',
    '{a} and {b} came out of that conversation with the same story and a slightly worse opinion of themselves.',
  ],
  'one-sided-vow': [
    '{a} asked {b} to keep it. {b} agreed, and did not ask {a} for anything back, and {a} noticed.',
    '{b} gave the promise easily and would not take one, which {a} could not decide the meaning of.',
    '"You don’t need to promise me anything," {b} said, which is either generous or a decision {b} has already made.',
    '{a} came away holding {b}’s word and nothing of {a}’s in {b}’s hands.',
    'It was meant to be mutual. Only one half of it got said out loud.',
    '{b} said yes before {a} finished asking, and did not put a single condition on it.',
  ],
  'would-not-promise': [
    '{a} asked {b} to keep it between them and {b} said no, and said why, which was worse than a yes.',
    '"I’m not promising that," {b} said. "I’m not going to lie to you about what I’d do."',
    '{b} would not give {a} the sentence {a} came for, and was completely honest about not giving it.',
    '{a} asked for silence and got an explanation of the circumstances under which {b} would break it.',
    '{b} refused, kindly, and {a} spent the rest of the day rating the kindness against the refusal.',
    '"Ask me a smaller thing," {b} said, and {a} did not have a smaller thing.',
  ],
};

registerEvent({
  id: 'trust-vow-of-silence',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js’s guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'strategic', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  // ROUND 2 FIX: see `_threadForActors` — this measured ZERO firings across
  // 60 real seasons under the exact-pair gate. Same fix as late-checkin.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    // Two parties, same reason as `trust-late-checkin` above: `fire()` reads
    // `[a, b] = t.parties` and a one-party arc would throw rather than skip.
    if (!t || t.parties.length < 2) return 0;
    return heatAt(t, ctx.ep) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-vow-of-silence');
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const st = pStats(b);
    const scores = {
      'vowed-silence': (st.loyalty / 10) * 0.5 + 0.2,
      'agreed-a-version': (st.strategic / 10) * 0.45 + (st.mental / 10) * 0.2,
      'one-sided-vow': (st.social / 10) * 0.3 + (1 - st.strategic / 10) * 0.25,
      'would-not-promise': (st.boldness / 10) * 0.35 + (1 - st.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'agreed-a-version' ? 'agreed what the two of them would say if asked'
      : branch === 'one-sided-vow' ? 'gave a promise and did not take one'
        : branch === 'would-not-promise' ? 'would not promise to keep it'
          : 'agreed to keep it between them';
    const bondDelta = branch === 'vowed-silence' ? 0.5
      : branch === 'agreed-a-version' ? 1.5 : branch === 'one-sided-vow' ? 1 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id,
      lineFor(VOW_LINES[branch], `trust-vow-of-silence|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: advanced?.id, bondDelta };
  },
});

const DEFEND_LINES = [
  'When somebody brought {b}\'s name up sideways, {a} shut it down before it went anywhere.',
  '{b} was not in the room. {a} argued for them anyway, and won the argument.',
  '{a} spent capital defending {b} to people who were never going to tell {b} about it.',
  'The name came up and {a} said "no" before anybody had finished the sentence.',
  '{a} could have let {b}\'s name sit there and gain weight. {a} took it off the table instead.',
];

registerEvent({
  id: 'trust-defend-in-absentia',
  family: FAMILY,
  window: 'after-table',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (getBond(a, b) < 1) return 0;
    // Wants some grounds — an open suspicion thread naming b is what makes a
    // defense a defense rather than a compliment out of nowhere.
    const threads = gs.tr?.threads || [];
    return threads.some(t => t.state === 'open' && t.kind === 'suspicion' && t.parties.includes(b)) ? 2.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'trust-defend-in-absentia');
    const sceneWhy = 'defended somebody who was not there';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 2, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(DEFEND_LINES, `trust-defend-in-absentia|${ctx.ep}`, { a, b }) });
    // Spending capital on somebody who is not in the room to see it done, and
    // will never be told. The country is watching and that is the whole point.
    return { branch: 'defended', pair: [a, b], threadId: t?.id, bondDelta: 2,
      crowd: { name: a, colour: 'selfless' } };
  },
});

// A second forking event, distinct from the vote-commitment flagship: what
// happens to something told in confidence, scored off the RECEIVER'S own
// loyalty/temperament/social rather than a coin. Three real outcomes, three
// different consequences — none of them cosmetic.
const SECRET_SWAP_LINES = {
  kept: [
    '{b} sat on what {a} told them. It never came up again, anywhere.',
    'Whatever {a} said, it went into {b} and stayed there.',
    '{b} had two chances to spend it and did not take either of them.',
    'Weeks later {a} would still be the only other person who knew, and {a} would know that.',
  ],
  leakedAccident: [
    '{b} didn\'t mean to repeat it — it just slipped out in a different conversation entirely.',
    'The secret got out through {b}, and {b} looked as surprised as anyone that it had.',
    '{b} assumed everyone already knew, said so out loud, and discovered they had not.',
    'It came out of {b} as an aside, in a room {a} was not in, and never went back in.',
  ],
  leakedDeliberate: [
    '{b} traded {a}\'s secret to somebody else for something better.',
    '{b} decided {a}\'s secret was worth more spent than kept.',
    '{b} waited until it would do the most good — for {b} — and then told the right person.',
    '{b} did the arithmetic on {a}\'s secret and sold at the top.',
  ],
};

registerEvent({
  id: 'trust-secret-swap',
  family: FAMILY,
  // RELOCATED BY PLAN 5 TASK 4 ROUND 2 (R2), and relocation rather than
  // reweighting is the point. Filling three empty windows took 22% of
  // `evening`'s draws and 30% of `after-table`'s, because the round budget is
  // a fixed 4-8 for the WHOLE round. That starved BRANCHES inside events whose
  // own totals still looked fine, which is invisible to any event-keyed floor.
  // A bigger weight in a crowded window only moves the starvation onto its
  // neighbours; moving the scene to a thin window is content-neutral and gives
  // everything left behind more room. This scene needs no particular room to
  // happen in, and the road out is a better one for it than the one it had.
  window: 'journey-out',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-secret-swap');
    const sceneWhy = 'traded something they had not told anyone';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const keepScore = (st.loyalty / 10) * 0.6 + (st.temperament / 10) * 0.4;
    const accidentScore = (1 - st.social / 10) * 0.5 + 0.15;
    const deliberateScore = (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.5;
    const total = keepScore + accidentScore + deliberateScore;
    const roll = rng() * total;
    let branch;
    if (roll < keepScore) branch = 'kept';
    else if (roll < keepScore + accidentScore) branch = 'leakedAccident';
    else branch = 'leakedDeliberate';

    const line = pick(rng, SECRET_SWAP_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    let bondDelta = branch === 'kept' ? 1 : branch === 'leakedAccident' ? -1 : -3;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});


// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// `night` held ONE event in the whole pool (romance-shields-target-together)
// and drew 16 firings in 200 seasons - 0.24% of everything the castle did. It
// is also the last window of the round, so it runs AFTER the Round Table and
// AFTER the conclave: whatever the room decided today is already decided, and
// the only thing left is what two people say about it in the dark.
//
// A CLOSER, for the reason Plan 5's second amendment gives: the pool opens 22
// threads a season and closes 0.86 of them. Lights-out is where a promise
// either gets made properly or stops being worth making.

const LAST_WORD_LINES = {
  sworn: [
    'The candles were out before {b} said it: whatever happens tomorrow, {a} has it in writing now, or as close as this place gets.',
    '{b} waited until the room was dark to give {a} the promise straight, with no conditions attached to it.',
    'It was the last thing either of them said that night, and {b} meant it: {a} would not be alone at that table.',
    '{b} said {a}\'s name back to them in the dark, once, as a promise, and left it at that.',
    'There were no terms on it. {b} made sure {a} heard that there were no terms on it.',
  ],
  hedged: [
    '{a} asked in the dark and {b} gave an answer with just enough air in it to climb back out of later.',
    '{b} said something that sounded like yes to {a}, and neither of them called it what it was.',
    'The answer {b} gave {a} at lights-out would have covered either outcome, which {a} noticed and let go.',
    '{b} promised {a} everything except the one thing {a} had asked for.',
    '{a} lay there afterwards working out what {b} had actually agreed to, and could not.',
  ],
  broken: [
    '{b} told {a} in the dark that they could not promise that, and did not soften it.',
    'It ended at lights-out. {b} said no to {a}, plainly, and rolled over.',
    '{a} finally asked outright, and the answer {b} gave closed the whole thing.',
    '{b} was kind about it, which somehow made it worse, and {a} did not ask twice.',
    '"I can\'t," said {b}, into the dark, and {a} stopped asking anyone anything that night.',
  ],
};

registerEvent({
  id: 'trust-last-word-before-lights-out',
  family: FAMILY,
  window: 'night',
  // TRUE: the event only exists where these two already have an open trust
  // story, and it writes its beat onto that thread before resolving it.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread(FAMILY, ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-last-word-before-lights-out');
    const sceneWhy = 'the last thing said before lights out';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const bond = getBond(a, b);
    // The person being ASKED is the one under test, same shape as this
    // family's flagship. Nerve is what the dark changes: a bold, loyal player
    // commits, a cautious one buys an exit, and a low-loyalty player says no.
    const swearScore = (st.loyalty / 10) * 0.5 + (st.boldness / 10) * 0.3 + Math.max(0, bond) / 10 * 0.2;
    const hedgeScore = (1 - st.boldness / 10) * 0.6 + 0.2;
    const breakScore = (1 - st.loyalty / 10) * 0.5 + (st.strategic / 10) * 0.5;
    const total = swearScore + hedgeScore + breakScore;
    const roll = rng() * total;
    let branch;
    if (roll < swearScore) branch = 'sworn';
    else if (roll < swearScore + hedgeScore) branch = 'hedged';
    else branch = 'broken';

    const line = pick(rng, LAST_WORD_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread(FAMILY, [a, b]);
    const bondDelta = branch === 'sworn' ? 3 : branch === 'hedged' ? 0 : -2;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    // Write the beat FIRST so the payoff carries the story it is paying off,
    // then resolve. `hedged` is the branch that leaves it open, and it has to
    // exist or this becomes an event that ends every trust story it touches.
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    const outcome = branch === 'sworn' ? 'passed-clean' : branch === 'broken' ? 'turned-back' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

export const _internal = { _sawMurderLastNight };
