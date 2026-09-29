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
  findOpenThread, openThreadsFor, heatAt, lastClosedThread, outcomeSense, priorMoments,
} from '../threads.js';
// A PURE READ of what somebody already thinks — the same import
// js/tr/castle/suspicion.js holds, and it writes nothing.
import { suspicion } from '../deduction.js';
import { lineFor, whoTheyTold, namesPhrase, countWord, pronounSlots } from './lines.js';

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
    '{a} tells {b} something {aSub} hasn’t said to anyone else in the castle.\n{a}: "I’m scared I’m next. Honestly. I haven’t told anyone that."\n{b}: "You’re not next. Not if I’ve got anything to do with it."',
    '{a} lets {aPos} guard down with {b} for a minute.\n{a}: "Can I be honest? I don’t know who to trust any more."\n{b}: "You can trust me."\n{a}: "That’s what everyone says."',
    '{a} and {b} end up talking properly for the first time.\n{a}: "I miss home. I didn’t think I would, this much."\n{b}: "Me too. It’s the nights."',
    '{a} admits something to {b} in a quiet corner.\n{a}: "I think people are starting to look at me."\n{b}: "Who?"\n{a}: "I don’t know. That’s what scares me."',
  ],
  'traded-it': [
    '{a} tells {b} something real, and {b} tells {aObj} something back.\n{a}: "I nearly voted for you on the first night."\n{b}: "Honestly? I nearly voted for you too."\nThey both laugh.',
    '{a} goes first, and {b} goes further.\n{a}: "I don’t trust half the people at that table."\n{b}: "I don’t trust any of them. Except you, maybe."',
    '{a} and {b} swap a secret each.\n{b}: "Okay, your turn."\n{a}: "I’ve got a name. I haven’t told anyone."\n{b}: "Tell me yours, I’ll tell you mine."',
    '{a} opens up, and {b} matches it.\n{a}: "I’m playing harder than I let on."\n{b}: "So am I. I think we both knew that."',
  ],
  'invited-them-in': [
    '{a} starts off confiding in {b}, and ends up making an offer.\n{a}: "I’m scared. But I think if we stick together, we’re both safer."\n{b}: "You mean properly? Us two?"\n{a}: "Us two."\n{b}: "Alright. Yes."',
    '{a} tells {b} how worried {aSub} is, then what {aSub} wants to do about it.\n{a}: "I don’t want to do this on my own any more. Do you?"\n{b}: "No."\n{a}: "Then let’s not."',
    '{a} lets {b} in, all the way.\n{a}: "I’ll be straight with you, because I need someone in here."\n{b}: "I’m listening."',
    'It stops being a confession halfway through and turns into a plan.\n{a}: "So what do we do?"\n{b}: "We look after each other. That’s what."',
  ],
  'regretted-it': [
    '{a} says too much to {b}, and knows it before the sentence is finished.\n{a}: "Forget I said that."\n{b}: "Said what?"\n{a} (to camera): "Why did I say that? Why?"',
    '{a} hears {aRef} telling {b} too much, and can’t stop.\n{a}: "...and that’s why I don’t trust anyone. God. Sorry. That was a lot."\n{b}: "It’s fine."\n{a} (to camera): "It was not fine."',
    '{a} confides in {b}, and immediately wishes {aSub} hadn’t.\n{a}: "…so that’s the plan for tomorrow."\n{b}: "Wow. Thanks for telling me."\n{a} (to camera): "I told {b} my plan for tomorrow. Out loud. What was I thinking?"',
    '{a} opens up to {b}, then panics about it.\n{a}: "You won’t repeat that, will you?"\n{b}: "No. Why would I?"\n{a}: "No reason."',
  ],
  'nearly-said-it': [
    '{a} writes a note to somebody, then tears it up.\n{a} (to camera): "Some things you don’t put in writing. Not in here."',
    '{a} knocks on a door, hears voices inside, and walks away.\n{a} (to camera): {cam:who-to-tell}',
    '{a} sits on the end of the bed, rehearsing what {aSub} might say to someone tomorrow.\n{a} (to camera): {cam:holding-info}',
    '{a} nearly corners somebody in the kitchen, then makes a tea instead.\n{a} (to camera): "I bottled it. I’ll say it tomorrow."',
    '{a} spends the evening working out who {aSub} could tell, and tells nobody.\n{a} (to camera): {cam:who-to-tell}',
    '{a} catches someone’s eye across the hall, and looks away before saying anything.\n{a} (to camera): "Not tonight. Not with everyone around."',
    '{a} goes to find somebody to talk to, and finds them already deep in conversation.\n{a} (to camera): {cam:holding-info}',
    '{a} keeps something to {aRef} for one more night.\n{a} (to camera): {cam:drop-it}',
    '{a} gets as far as the door of the room {aSub} was going to talk in, then goes to bed.\n{a} (to camera): {cam:holding-info}',
    '{a} almost tells somebody how {aSub} really feels tonight, and doesn’t.\n{a} (to camera): "There’s one person I could tell. I didn’t go and find them."',
    '{a} starts to say something at dinner, then stops.\n{a} (to camera): "I nearly said it. I nearly told them what I think. Then I thought, not yet."',
    '{a} waits outside someone’s room for a minute, then walks away.\n{a} (to camera): {cam:who-to-tell}',
    '{a} has something to say, and nobody to say it to tonight.\n{a} (to camera): "I’m carrying it on my own. For now."',
    '{a} opens {aPos} mouth to say something, and closes it again.\n{a} (to camera): "It’s not the right time. Or I’m a coward. One of the two."',
    '{a} decides tonight isn’t the night to trust anyone.\n{a} (to camera): {cam:plan}',
    '{a} keeps it to {aRef} one more night.\n{a} (to camera): "Tomorrow. I’ll say it tomorrow. Maybe."',
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
    '{a} and {b} compare notes on {c}, quietly.\n{a}: "What do you make of {c}?"\n{b}: "Honestly? {c} doesn’t sit right with me."\n{a}: "Same."',
    '{a} asks {b} straight out what {bSub} thinks of {c}.\n{b}: {say:suspect:{c}}\n{a}: {say:agree-suspect:{c}}',
    '{a} and {b} go through {c} together.\n{b}: "You first."\n{a}: "{c}’s too nice. Nobody’s that nice in here."\n{b}: "I thought it was just me."',
    '{a} and {b} swap reads on {c}.\n{a}: "Trust {c}?"\n{b}: "About as far as I could throw {cObj}."',
  ],
  'one-way': [
    '{a} gives {b} a proper read on {c}, and gets nothing back.\n{a}: {say:suspect:{c}}\n{b}: "Interesting."\n{a}: "And you?"\n{b}: "Oh, I don’t know. Could be anyone."',
    '{a} shares what {aSub} thinks of {c}. {b} doesn’t share back.\n{a}: "That’s what I think about {c}. Your turn."\n{b}: "I haven’t really made my mind up."\n{a} (to camera): "I gave {b} everything. {b} gave me a shrug. I’ll remember that."',
    '{a} goes first, as usual, and {b} doesn’t go at all.\n{a}: "Your turn."\n{b}: "I haven’t really got a view on {c}."\n{a}: "Everyone’s got a view."',
    '{a} tells {b} exactly what {aSub} thinks about {c}.\n{b}: "Thanks. Good to know."\n{a}: "And you?"\n{b}: "I’ll let you know."\n{a} (to camera): "That was a one-way street."',
  ],
  'same-name': [
    '{a} and {b} both say {c} at the same time.\n{a}: "{c}."\n{b}: "{c}."\n{a}: "Right. Well. That settles that."',
    '{a} and {b} have both got {c} in mind, separately.\n{b}: "Have you been thinking about {c}?"\n{a}: "For two days."\n{b}: "Then we vote together tonight."',
    'Both of them say the same name, and it becomes a plan.\n{a}: "So that’s two of us on {c}."\n{b}: "Let’s make it more."',
    '{a} and {b} land on {c} independently.\n{a}: "I think it’s {c}."\n{b}: "I was going to say {c}."\n{a} (to camera): "When two people get to the same name on their own, you listen."',
  ],
  disagreed: [
    '{a} says {c}. {b} says somebody else, and neither will budge.\n{a}: {say:suspect:{c}}\n{b}: {say:doubt-suspect:{c}}\n{a}: "Fine. We’ll see tonight."',
    '{a} and {b} can’t agree about {c}.\n{b}: "You’re wrong about {c}."\n{a}: "Then who?"\n{b}: "Not {c}. That’s all I know."',
    '{a} and {b} argue about {c}, and by the end they’re not really talking about {c}.\n{b}: "You always go for the easy name."\n{a}: "And you always defend it."',
    '{a} pushes {c}. {b} pushes back.\n{a}: "{c} has been off all week."\n{b}: "{c}’s been fine. You’re reaching."\n{a} (to camera): "{b} was very quick to defend {c}. Very quick."',
  ],
  'read-the-room': [
    '{a} watches who sits with who at dinner, and adjusts the list in {aPos} head.\n{a} (to camera): {cam:watching}',
    '{a} takes a lap of the castle before bed, noting who is talking to who.\n{a} (to camera): "Three little huddles tonight. I know where I stand with two of them."',
    '{a} lies on the bed going through everyone, one name at a time.\n{a} (to camera): {cam:replay-week}',
    '{a} counts {aPos} friends in the castle, and it doesn’t take long.\n{a} (to camera): "Real friends in here? One. Maybe two on a good day."',
    '{a} sits by the fire working out the castle on {aPos} own.\n{a} (to camera): {cam:gut}',
    '{a} goes through the whole castle, name by name, working out who {aSub} would actually stand next to.\n{a} (to camera): {cam:watching}',
    '{a} ranks everyone left, on {aPos} own, by how much {aSub} trusts them.\n{a} (to camera): "Top of my list, three people. Bottom of my list, everyone else."',
    '{a} sits on the bed and sorts the castle into people {aSub} trusts and people {aSub} doesn’t.\n{a} (to camera): "The trust pile’s getting smaller every day."',
    '{a} works out, alone, who {aSub}’d want at the final table.\n{a} (to camera): {cam:the-end}',
    '{a} goes over every name left in the castle.\n{a} (to camera): "Friend, maybe, no, no, friend, no idea. That’s the castle."',
    '{a} does the whole list alone, with nobody to check it against.\n{a} (to camera): {cam:notes}',
    '{a} lies in the dark ranking the castle.\n{a} (to camera): "You do this every night. It changes every night."',
  ],
  'went-back-over-one': [
    '{a} doesn’t go through the whole room tonight. Just {c}, twice.\n{a} (to camera): "Everyone else has moved on from {c}. I haven’t."',
    '{a} sits on the stairs going over {c} again.\n{a} (to camera): {cam:replay-week}',
    '{a} can’t stop thinking about {c}.\n{a} (to camera): "{c} said one thing yesterday that doesn’t fit. I keep coming back to it."',
    '{a} goes back over everything {c} has done.\n{a} (to camera): "It’s {c}. Or it’s nothing. I need to know which."',
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
// ── REWRITE (Task 7 stage 6). The audit's verdict was MERGE into
// `trust-confide-fear`, and stage 5 folded the premise in there as a branch.
// This keeps its registration on the standing reasoning — an `evening` scene
// is worth more than a tidy registry — and earns it by forking on the one
// thing confide-fear cannot reach: a unit of two is not the only kind. The
// record the fork reads is the living roster and the bond each of them has
// with a third person, because whether this is a pair or the start of a bloc
// is a fact about the room and not about the two of them.
const CIRCLE_LINES = {
  circle: [
    '{a} and {b} agree, without quite saying the word, that they’re in this together now.\n{b}: "So we’re… a thing? Strategically?"\n{a}: "Don’t call it that. But yes."',
    '{a} and {b} walk away from the conversation as a pair.\n{a}: "You watch my back, I’ll watch yours."\n{b}: "Deal."',
    '{a} and {b} shake on it, quietly.\n{a}: "Nobody needs to know."\n{b}: "Nobody will."',
    'Nobody says the word alliance. Both of them know that’s what it is.\n{a}: "So we look after each other."\n{b}: "We look after each other."\n{b} (to camera): "{a} and me are solid now. That changes things."',
  ],
  'said-the-word': [
    '{b} makes {a} say it out loud.\n{b}: "It’s an alliance. Say it."\n{a}: "Fine. It’s an alliance."\n{b}: "Good. Now I believe you."',
    '{a} uses the actual word, in a room with the door open.\n{a}: "We’re an alliance now, yeah?"\n{b}: "Keep your voice down!"\n{a}: "Sorry. Yes. But yes?"\n{b}: "Yes."',
    '{a} and {b} put a name to it.\n{a}: "An alliance. Us two."\n{b}: "People are going to notice."\n{a}: "Let them."',
    '{b} wants it said properly.\n{b}: "I’m not doing maybe. Are we an alliance or not?"\n{a}: "We are."',
  ],
  'three-of-us': [
    'It’s two people until {a} mentions {c}.\n{a}: "What about {c}?"\n{b}: "Three of us?"\n{a}: "Three’s safer than two."',
    '{b} agrees, as long as {c} is in too.\n{b}: "I’m in if {c} is."\n{a}: "Fine. I’ll talk to {c}."',
    '{a} and {b} decide to bring {c} in.\n{b}: "{c}’s loyal. We need loyal."\n{a}: "Agreed."',
    '{a} suggests {c}, and {b} likes it.\n{a}: "Three votes is a lot at that table."\n{b}: "Three votes is a lot anywhere."',
  ],
  'not-this-week': [
    '{a} offers {b} a proper alliance. {b} holds back.\n{b}: "Let’s see how tonight goes."\n{a}: "That’s a no."\n{b}: "It’s a not yet."',
    '{b} likes the idea but won’t commit.\n{b}: "I like you. I’m just not locking anything in this week."\n{a}: "Right. Not this week."\n{a} (to camera): "Not locking in. Right. I’ll remember that."',
    'It very nearly becomes something, and then {b} steps back.\n{b}: "Ask me again in a few days."\n{a}: "Fine."',
    '{a} tries to make it official. {b} won’t name it.\n{b}: "We’re friends. Let’s leave it there for now."\n{a}: "Friends who vote together?"\n{b}: "Friends. Let’s see about the rest."',
  ],
};

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
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['boldness', 'strategic', 'loyalty'],
    relationship: ['close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 4 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-circle-forms');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // THE THIRD PERSON, READ OFF THE ROOM. `three-of-us` needs somebody for
    // the pair to argue about, and picks the person {b} is actually closest
    // to — a stored bond, not a name pulled out of the air.
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    let c = null, best = -Infinity;
    for (const n of others) { const v = getBond(b, n); if (v > best) { best = v; c = n; } }
    const scores = {
      circle: 0.45,
      'said-the-word': (sb.boldness / 10) * 0.3 + (sa.boldness / 10) * 0.15,
      'three-of-us': c && best >= 2 ? 0.2 + Math.max(0, best) * 0.06 : 0,
      // NAMED `not-this-week` and not `not-yet`, because `not-yet` already
      // means something benign in `romance-showmance-on-the-way-back` and one
      // branch string cannot mean two things to `_tone`. The denylist arm in
      // tr-castle-prose.test.js caught it, which is what it is for.
      'not-this-week': (sb.strategic / 10) * 0.25 + (1 - sb.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'circle';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'said-the-word' ? 'used the word out loud'
      : branch === 'three-of-us' ? 'made a pair into a bloc'
        : branch === 'not-this-week' ? 'declined to name it this week'
          : 'became a unit without saying so';
    const note = lineFor(CIRCLE_LINES[branch], `trust-circle-forms|${branch}|${ctx.ep}`,
      { a, b, c: c || b });
    const bondDelta = branch === 'not-this-week' ? -0.5 : branch === 'said-the-word' ? 2 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'three-of-us' && c) api.addBond(a, c, 1, { source: sceneWhy });
    const t = api.openArc(FAMILY, branch === 'three-of-us' && c ? [a, b, c] : [a, b],
      { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
// ══════════════════════════════════════════════════════════════════════
// THE ALLIANCE ENDS — the counterpart to trust-circle-forms
// ══════════════════════════════════════════════════════════════════════
//
// Formation has an event; the break did not, and the back half of a season is
// mostly breaks (the forms event's own act note says so: "what is left is
// testing and breaking them"). A warm pair comes apart four ways, by WHO they
// are: they air it and hold (benign), they quietly cool (drift), one cuts the
// other loose in the open (severed), or — the darkest, and the "I don't trust
// you any more, I think you're one of them" the request asked for — the
// falling-out turns into a Traitor read (turned-cold). No belief is written
// (no castle file writes beliefs); the bond collapses and a suspicion-shaped
// thread opens, which is the residue a real read leaves. `turned-cold` leans
// on INTUITION and on whether `{b}` has already moved against `{a}` at a table,
// so the flip is earned, not random.
const CIRCLE_BREAK_LINES = {
  'talked-through': [
    '{a} says the thing that has been bothering {aObj} all week, and {b} hears it.\n{a}: "I felt like you went behind my back yesterday."\n{b}: "I didn’t. But I get why it looked like that."\n{a}: "Okay. Okay. We’re good."',
    '{b} tells {a} to say it.\n{b}: "Just say it."\n{a}: "I don’t know if I trust you any more."\n{b}: "Then ask me anything."\nBy the end, they’re still a pair.',
    '{a} and {b} have it out, and come through it.\n{b}: "So are we done?"\n{a}: "No. We’re not done. I just needed to say it."',
    '{a} tells {b} what went wrong, and {b} listens.\n{b}: "I’m sorry. I should’ve told you first."\n{a}: "Yeah. You should."',
  ],
  drifted: [
    '{a} and {b} don’t fall out. They just stop talking.\n{a} (to camera): "We used to sit together every meal. I can’t remember the last time."',
    'Nobody ends it. {a} sits somewhere else at breakfast, and {b} lets {aObj}.\n{b} (to camera): "We just drifted. It happens in here. Doesn’t make it nice."',
    '{a} and {b} are polite to each other now. That’s all.\n{a}: "Morning."\n{b}: "Morning."',
    '{a} notices {b} has stopped checking in.\n{a} (to camera): "No fight. No row. Just nothing. That’s worse."',
  ],
  severed: [
    '{a} tells {b} it’s over.\n{a}: "I’m not tied to you any more. Just so you know."\n{b}: "Wow. Okay."\n{a}: "It’s nothing personal."\n{b}: "It feels personal."',
    '{a} ends it in one sentence.\n{a}: "We’re done. As a team, I mean."\n{b}: "Just like that?"\n{a}: "Just like that."',
    '{a} tells {b} straight.\n{a}: "I can’t protect you any more. I need to look after myself."\n{b}: "I thought we were in this together."',
    '{a} cuts {b} loose.\n{a}: "Vote how you want tonight. I’m voting how I want."\n{b}: "Fine by me."\n{b} (to camera): "So that’s that, then."',
  ],
  'turned-cold': [
    '{a} looks at {b} and wonders, for the first time, if {bSub}’s a Traitor.\n{a}: "Were you ever really with me?"\n{b}: "What are you talking about?"\n{a}: "I just want an honest answer."',
    '{a} says it in the past tense.\n{a}: "I trusted you."\n{b}: "Trusted?"\n{a}: "Trusted."',
    '{a} turns on {b}.\n{a}: {say:suspect:{b}}\n{b}: {say:deny}\n{a}: "I want to believe you. I just don’t."',
    '{a} tells {b} {aSub} doesn’t trust {bObj} any more.\n{b}: "After everything?"\n{a}: "Because of everything."',
  ],
};

registerEvent({
  id: 'trust-circle-breaks',
  family: FAMILY,
  window: 'evening',
  // ACT: the mirror of trust-circle-forms. Alliances form early and come apart
  // late, so this is weighted the other way — rare early, common by the endgame.
  acts: { early: 0.4, middle: 1.0, late: 1.5 },
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['loyalty', 'boldness', 'intuition'],
    relationship: ['close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Only a real alliance can break. Same warm-bond floor formation uses.
    return getBond(a, b) >= 4 ? 1.3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-circle-breaks');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    // Has `b` already moved against `a` in the open? A ballot or an accusation
    // `a` heard read out — public, no alignment read — makes the Traitor flip
    // earned rather than a mood. Scanned across the season, like `_accusedMe`.
    let struckFirst = 0;
    for (const r of (gs.tr?.rounds || [])) {
      if ((r.ballots || []).some(x => x.voter === b && x.voted === a)) struckFirst++;
      if ((r.accusations || []).some(x => x.accuser === b && x.target === a)) struckFirst++;
    }
    const scores = {
      'talked-through': (sa.loyalty / 10) * 0.45 + Math.max(0, getBond(a, b)) / 10 * 0.3,
      drifted: (1 - sa.boldness / 10) * 0.4 + (1 - sa.loyalty / 10) * 0.2 + 0.1,
      severed: (sa.boldness / 10) * 0.4 + (1 - sa.loyalty / 10) * 0.3,
      // Intuition sees the pattern; being struck at first gives it something to see.
      'turned-cold': (sa.intuition / 10) * 0.4 + Math.min(0.4, struckFirst * 0.2),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'drifted';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'talked-through' ? 'aired it and kept the alliance'
      : branch === 'drifted' ? 'let the alliance quietly cool'
        : branch === 'severed' ? 'cut a partner loose in the open'
          : 'stopped trusting a partner and started suspecting one';
    const note = lineFor(CIRCLE_BREAK_LINES[branch], `trust-circle-breaks|${branch}|${ctx.ep}`,
      { a, b });
    const bondDelta = branch === 'talked-through' ? 1.5
      : branch === 'drifted' ? -1.5 : branch === 'severed' ? -3 : -3.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'turned-cold') api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});

const COMMIT_LINES = {
  kept: [
    '{a} asks {b} for {bPos} vote tonight, and {b} gives a straight answer.\n{a}: "Are you with me tonight?"\n{b}: "Count on it."\n{a}: "No hedging?"\n{b}: "No hedging."',
    '{a} asks, and {b} gives one name, plainly.\n{a}: "Who are you writing?"\n{b}: "The same as you. I promise."',
    '{b} looks {a} in the eye and promises.\n{b}: "I’m voting with you. Don’t worry."\n{a}: "I’m going to hold you to that."\n{b}: "Do."',
    '{a} checks {b} is still on the plan.\n{b}: "Nothing’s changed. Same name."\n{a}: "Good. Tonight, then."',
  ],
  broken: [
    '{b} promises {a} {bPos} vote, and doesn’t mean it.\n{a}: "You’re with me tonight?"\n{b}: "Course I am."\n{b} (to camera): "I’m not. But {a} doesn’t need to know that yet."',
    '{a} believes {b}. {b} walks off knowing it was a lie.\n{a}: "Thank you. I needed that."\n{b}: "Any time."\n{b} (to camera): "I feel bad. I’m still not voting that way."',
    '{b} tells {a} what {aSub} wants to hear.\n{b}: "Yes. Absolutely. Same name."\n{a}: "Promise?"\n{b}: "Promise."\n{b} (to camera): "Different name. Sorry, {a}."',
    '{b} smiles and says yes, and has already decided otherwise.\n{a}: "Same name tonight?"\n{b}: "Same name. Course."\n{a} (to camera): "{b} said yes. I think {b} meant it."',
  ],
  deflected: [
    '{b} never actually says yes.\n{a}: "So you’re with me tonight?"\n{b}: "I’m just seeing how it goes."\n{a}: "That’s not a yes."\n{b}: "It’s not a no either."',
    '{a} asks for a promise. {b} gives a feeling.\n{b}: "You know I like you."\n{a}: "That’s not what I asked."',
    '{b} talks around it until {a} gives up.\n{a}: "So who are you writing?"\n{b}: "Well, it depends, doesn’t it, on how the day goes and who says what at dinner—"\n{a} (to camera): "Five minutes of talking and not one answer. I noticed."',
    '{b} dodges the question.\n{a}: "Yes or no?"\n{b}: "Let’s wait and see what everyone says at the table."',
  ],
  turned: [
    '{b} answers {a}’s question with a question.\n{a}: "Are you voting with me?"\n{b}: "Are you voting with me?"\n{a}: "I asked first."\n{b}: "You go first."',
    '{b} turns it round.\n{b}: "You tell me your name first, then I’ll tell you mine."\n{a}: "That’s not fair."\n{b}: "It’s perfectly fair."\n{a} (to camera): "Now I owe {b} an answer. How did that happen?"',
    '{b} puts it back on {a}.\n{b}: "Why do you need to know so badly?"\n{a}: "Because I’m scared."\n{b}: "So am I."',
    'Instead of committing, {b} asks {a} to commit first.\n{b}: "Prove it. Tell me who."\n{a}: "I asked first."',
  ],
};

registerEvent({
  id: 'trust-vote-commitment-test',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'boldness', 'intuition'],
    relationship: ['close-ally', 'neutral'],
  },
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

    const line = pronounSlots(pick(rng, COMMIT_LINES[branch])
      .replace(/\{a\}/g, asker).replace(/\{b\}/g, asked), { a: asker, b: asked });
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

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`huddled`) — the fork
// is in the wording." Two frightened people finding each other after a murder
// is the right premise and it had one ending, which is that it always worked.
// The record the fork reads is how many the castle has actually lost — counted
// off `gs.tr.rounds`, never asserted — plus both temperaments. The fourth body
// is not the first body, and by then some people want company and some people
// cannot stand to be touched.
const HUDDLE_LINES = {
  huddled: [
    '{a} and {b} sit close after last night, and neither pretends they aren’t scared.\n{a}: "That could’ve been us."\n{b}: "I know. Don’t."',
    '{a} and {b} find each other before anybody else is down.\n{b}: "Stay with me this morning?"\n{a}: "Wasn’t going anywhere."',
    '{a} and {b} sit on the stairs together.\n{a}: "I can’t stop thinking about last night."\n{b}: "Me neither. Stay close today, yeah?"',
    '{a} and {b} spend the morning together, quietly.\n{a}: "Tea?"\n{b}: "Please. And stay a bit?"\n{b} (to camera): "{a} makes me feel safer. That’s all I want today."',
  ],
  'counted-the-room': [
    'It starts as comfort and turns into strategy inside ten minutes.\n{a}: "Okay. Who’s left that we trust?"\n{b}: "Let’s count."',
    '{a} and {b} are still frightened at the end of it, but now they have a list.\n{b}: "So that’s four we trust."\n{a}: "Out of everyone. Four."',
    '{a} and {b} sit together and go through the castle.\n{a}: "Who would even want that? Why them, of everyone?"\n{b}: "Let’s go through it properly."',
    'Comfort turns into planning.\n{a}: "We need to be smart now."\n{b}: "We need to be alive now."',
  ],
  'could-not-be-near-anyone': [
    '{a} goes to sit with {b}, and {b} can’t do it this morning.\n{b}: "Sorry. I just need to be on my own."\n{a}: "That’s fine. I’ll be around."',
    '{b} has been comforted by four people already and can’t take a fifth.\n{b}: "I’m okay. Honestly. I just need space."\n{a}: "Say no more."',
    '{b} gently turns {a} away.\n{b}: "It’s not you. I just can’t be near anyone right now."\n{a}: "Okay. I’ll be around."',
    '{a} tries to help. {b} isn’t ready.\n{a}: "Do you want to talk?"\n{b}: "Not yet. Sorry."\n{a} (to camera): "Everyone deals with it differently. I left {b} to it."',
  ],
  'went-round-the-room': [
    '{a} doesn’t sit with {b}. {a} sits with everyone, one at a time.\n{b}: "Busy morning?"\n{a}: "Everyone needed a hug."\n{b} (to camera): "{a} comforted half the castle before nine. I noticed."',
    '{a} goes from person to person all morning.\n{b}: "You’ve been busy."\n{a}: "People are upset."\n{b}: "Yeah. I know."',
    '{a} makes the rounds, and {b} watches.\n{b}: "You’ve spoken to everyone today."\n{a}: "Someone has to."\n{b} (to camera): "Kind? Or working the room? I honestly can’t tell with {a}."',
    '{a} checks on everyone except {b}.\n{b} (to camera): "Everyone got a hug from {a}. Except me."',
  ],
};

registerEvent({
  id: 'trust-post-murder-huddle',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'social', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (getBond(a, b) < 0) return 0;
    return _sawMurderLastNight(ctx) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-post-murder-huddle');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // HOW MANY THIS CASTLE HAS LOST, counted off the stored rounds.
    const lost = (gs.tr?.rounds || []).filter(r => r.murdered || r.banished).length;
    const scores = {
      huddled: 0.45 + (sb.temperament / 10) * 0.15,
      'counted-the-room': (sb.strategic / 10) * 0.3 + Math.min(4, lost) * 0.06,
      'could-not-be-near-anyone': (1 - sb.temperament / 10) * 0.25 + Math.min(4, lost) * 0.05,
      'went-round-the-room': (sa.social / 10) * 0.3 - (getBond(a, b) > 4 ? 0.15 : 0),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'huddled';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'counted-the-room' ? 'turned a huddle into arithmetic'
      : branch === 'could-not-be-near-anyone' ? 'could not be comforted this morning'
        : branch === 'went-round-the-room' ? 'comforted everybody in turn'
          : 'huddled after the news';
    const note = lineFor(HUDDLE_LINES[branch], `trust-post-murder-huddle|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'huddled' ? 2
      : branch === 'counted-the-room' ? 1
        : branch === 'could-not-be-near-anyone' ? -0.5 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
const PACT_LINES = {
  pact: [
    '{a} and {b} make it official: neither of them writes the other’s name down.\n{a}: "Never you. Not once."\n{b}: "Never you."\nThey shake on it.',
    '{a} says it plainly to {b}.\n{a}: "Whatever happens, I’m not voting for you."\n{b}: "Same. Whatever happens."',
    '{a} and {b} promise each other, quietly.\n{b}: "Deal?"\n{a}: "Deal. Till the end."',
    '{a} and {b} agree on one thing.\n{a}: "You don’t write me, I don’t write you."\n{b}: "Easy."',
  ],
  'with-one-exception': [
    '{b} agrees, with one condition.\n{b}: "Unless it’s the two of us at the end."\n{a}: "Fair."\n{b} (to camera): "Only fair. The end’s the end."',
    '{b} signs up to everything except the last night.\n{b}: "All the way. Except the final."\n{a}: "Which is the only bit that matters."',
    '{a} and {b} agree, and both hear the gap in it.\n{a}: "So if it’s us two—"\n{b}: "Then it’s every person for themselves."',
    '{b} promises, but not for the final.\n{a}: "Never me. Say it."\n{b}: "Never you. Until the very end."\n{a} (to camera): "{b} left a door open. I saw it."',
  ],
  'one-way': [
    '{a} promises. {b} says something warm that isn’t a promise.\n{a}: "I’ll never vote for you."\n{b}: "You know how I feel about you."\n{a} (to camera): "That’s not the same thing."',
    '{a} gives the guarantee and gets a smile back.\n{b}: "Aw, that’s sweet."\n{a}: "And you?"\n{b}: "Obviously."',
    '{a} commits. {b} doesn’t, quite.\n{b}: "We’ll be fine."\n{a}: "That’s not a promise."\n{a} (to camera): "We’ll be fine isn’t a promise."',
    '{a} notices {b} didn’t actually say it.\n{a}: "Never you. Promise."\n{b}: "Yeah. Same."\n{a} (to camera): "I said never you. {b} said ‘yeah, same’. I’m not sure ‘same’ counts."',
  ],
  'said-it-again': [
    '{a} and {b} have promised this before, and they promise it again.\n{a}: "Still never you?"\n{b}: "Still never you. Why, what’s happened?"\n{a}: "Nothing. Just checking."',
    '{a} asks for the promise a second time.\n{b}: "We’ve already done this."\n{a}: "I know. I just need to hear it."\n{b} (to camera): "Why does {a} need to hear it again?"',
    '{a} and {b} repeat their pact.\n{b}: "Same deal as always."\n{a}: "Same deal."',
    '{a} checks the pact still stands.\n{b}: "Of course it does. Stop worrying."\n{a}: "I’ll stop when we’re at the end."',
  ],
};

registerEvent({
  id: 'trust-protect-pact',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'strategic', 'boldness'],
    relationship: ['close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (getBond(a, b) < 3) return 0;
    return findOpenThread(FAMILY, [a, b]) ? 3 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-protect-pact');
    const [a, b] = ctx.actors;
    const existing = findOpenThread(FAMILY, [a, b]);
    // HOW MANY TIMES THEY HAVE ALREADY DONE THIS, off the stored arc.
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    const sb = pStats(b);
    const scores = {
      pact: 0.4 + (sb.loyalty / 10) * 0.3,
      'with-one-exception': (sb.strategic / 10) * 0.35,
      'one-way': (1 - sb.loyalty / 10) * 0.3 + (1 - sb.boldness / 10) * 0.15,
      'said-it-again': Math.min(3, times) * 0.18,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'pact';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'with-one-exception' ? 'agreed to protect each other, with a clause'
      : branch === 'one-way' ? 'promised and was not promised back'
        : branch === 'said-it-again' ? 'renewed a promise neither of them had broken'
          : 'agreed to protect each other';
    const note = lineFor(PACT_LINES[branch], `trust-protect-pact|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'pact' ? 1
      : branch === 'with-one-exception' ? 0.5
        : branch === 'said-it-again' ? 0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
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
    '{a} checks in with {b}. The arrangement is still holding.\n{a}: {say:check-in}\n{b}: {say:check-in-yes}',
    '{a} catches {b} on the stairs.\n{a}: {say:check-in}\n{b}: {say:check-in-yes}\n{a}: "Good. That’s all I needed."',
    '{a} finds {b} before breakfast.\n{a}: "Still us two?"\n{b}: "Still us two."',
    '{a} and {b} have a quick word in the corridor.\n{a}: {say:check-in}\n{b}: "Nothing’s changed. Relax."',
    '{a} checks the plan with {b}.\n{b}: "Same as yesterday."\n{a}: "Good."',
  ],
  'asked-for-a-name': [
    '{a} doesn’t want to know if they’re still good. {a} wants a name.\n{a}: "Fine, we’re good. But who tonight?"\n{b}: "Straight to it, then."\n{a}: "No time for anything else."',
    '{a} checks in with {b}, and goes straight to the vote.\n{a}: "Who are you writing tonight?"\n{b}: "I haven’t decided."\n{a}: "Decide with me."',
    '{a} wants more than reassurance.\n{b}: "We’re fine."\n{a}: "I know. Who, though?"',
    '{a} asks {b} for a name.\n{a}: "Give me one name for tonight."\n{b}: "You first."',
  ],
  'air-in-the-answer': [
    '{a} checks in with {b}, and there’s a gap in the answer.\n{a}: {say:check-in}\n{b}: {say:check-in-hedge}\n{a} (to camera): "I didn’t like that pause."',
    '{a} asks if they’re still good, and {b} hesitates.\n{a}: {say:check-in}\n{b}: "Of course. Why?"\n{a}: "You hesitated."\n{b}: "I didn’t."',
    '{b} says all the right words, with a gap in the middle.\n{b}: "Yeah, course, we’re — yeah."\n{a}: "Right."\n{a} (to camera): "That was a lot of air in a yes."',
    '{a} spends the morning thinking about {b}’s answer.\n{a}: "We’re still good?"\n{b}: "Of course."\n{a} (to camera): "{b} said ‘of course.’ It was the way {b} said it."',
  ],
  'checked-on-them': [
    '{a} doesn’t mention the game. {a} just asks how {b} is.\n{a}: "How are you doing, after last night?"\n{b}: "Honestly? Not great."\n{a}: "Want to talk about it?"',
    'Half the table said {b}’s name last night. {a} sits down next to {bObj} at breakfast.\n{a}: "You alright?"\n{b}: "No. But thanks for asking."',
    '{a} checks on {b} as a friend, not a player.\n{b}: "You’re not going to ask about the vote?"\n{a}: "No. I’m asking about you."',
    '{a} brings {b} a cup of tea.\n{a}: "Rough night?"\n{b}: "The roughest."',
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

// ── REWRITE (Task 7 stage 6). Top of the blame table after the romance batch.
// The audit: "one branch (`shared-suspicion`) — the fork is in the wording,
// not in the game."
//
// HONESTY IS AN OFFER AND THE OTHER PERSON ANSWERS IT, which is the shape the
// whole family runs on. The record the fork reads is `suspicion(b, c, ep)` —
// what {b} ALREADY thinks about the person {a} has just named, which is stored
// and is the difference between handing somebody a gift and handing them an
// argument. Nothing here invents a read; it looks one up and lets {b}'s
// personality decide how {b} answers it.
const SHARE_SUSPICION_LINES = {
  'shared-suspicion': [
    '{a} tells {b}, flat out, who {aSub} is worried about.\n{a}: {say:suspect:{c}}\n{b}: "Wow. Okay. Thank you for telling me."',
    '{a} gives {b} a real read on {c}.\n{a}: "I’m only telling you. {c}. I think it’s {c}."\n{b}: "Why?"\n{a}: "Gut. And a couple of things."',
    '{a} tells {b} exactly who {aSub} suspects.\n{a}: "It’s {c}. I’ve thought it for days."\n{b}: "I’m glad you told me."',
    '{a} trusts {b} with {aPos} real suspicion.\n{a}: "Keep this to yourself. I don’t trust {c}."\n{b}: "I won’t say a word."',
  ],
  'both-had-it': [
    '{a} says {c}, and {b} has been thinking the same.\n{a}: "{c}."\n{b}: "I’ve been sitting on {c} for two days."\n{a}: "Then that’s our name."',
    'Two people get to {c} separately.\n{b}: {say:agree-suspect:{c}}\n{a}: "Tonight, then."',
    '{a} and {b} both suspect {c}, and now they know it.\n{b}: "I didn’t want to say it first."\n{a}: "Neither did I."',
    '{a} and {b} land on the same person.\n{a}: "You’ve been watching {c} too?"\n{b}: "Since Tuesday."\n{a} (to camera): "Two of us on {c} now. That’s the start of a vote."',
  ],
  'defended-them': [
    '{a} names {c}. {b} spends ten minutes explaining why {a} is wrong.\n{b}: {say:doubt-suspect:{c}}\n{a}: "You’re very sure."\n{b}: "I am."',
    '{a} finds out, the hard way, that {b} likes {c}.\n{a}: "I think it’s {c}."\n{b}: "No way. I’d stake my game on {c}."',
    '{b} defends {c} to {a}.\n{b}: "You’ve got {c} completely wrong."\n{a}: "Have I?"\n{a} (to camera): "I didn’t know {b} and {c} were that close. Now I do."',
    '{a} brings up {c}, and {b} shuts it down.\n{b}: "Not {c}. Anyone but {c}."\n{a}: "Why not?"\n{b}: "Because I know {c}."',
  ],
  'took-it-back': [
    '{a} names {c}, then immediately asks {b} not to repeat it.\n{a}: "Forget I said that."\n{b}: "Too late."',
    '{a} says it, then tries to un-say it.\n{a}: "Actually, don’t tell anyone I said {c}."\n{b}: "Why not?"\n{a}: "Just don’t."',
    '{a} backs off {aPos} own suspicion.\n{a}: "I’m probably wrong about {c}. Ignore me."\n{b}: "You don’t sound sure."\n{b} (to camera): "{a} said it though. You can’t take it back."',
    '{a} regrets naming {c} out loud.\n{a}: "That stays between us, yeah?"\n{b}: "Course."',
  ],
  'made-them-pay-first': [
    '{a} won’t name anyone until {b} does.\n{a}: "You first."\n{b}: "Fine. I don’t trust {c}."\n{a}: "Then we agree."',
    '{a} makes {b} go first.\n{b}: "Why do I always have to go first?"\n{a}: "Because I trust you more when you do."',
    '{a} only says {c} after {b} has committed.\n{b}: "There. I’ve said mine."\n{a}: "{c}."',
    '{a} gets {b} to show {bPos} hand before {a} shows {aPos}.\n{a}: "You first."\n{b}: "Fine. I think it’s {c}."\n{a}: "Good. So do I."\n{a} (to camera): "Trust, but with a receipt."',
  ],
};

registerEvent({
  id: 'trust-share-suspicion-honestly',
  family: FAMILY,
  window: 'morning',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'social', 'strategic', 'intuition'],
    relationship: ['close-ally', 'neutral'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 2 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-share-suspicion-honestly');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    const sb = pStats(b);
    // WHAT {b} ALREADY THINKS ABOUT THE PERSON {a} HAS JUST NAMED. Stored, and
    // it is the whole fork: agreeing is easy when you already had the name,
    // and defending them is what happens when you had the opposite of it.
    const theirRead = suspicion(b, target, ctx.ep);
    const bond = getBond(b, target);
    const scores = {
      'shared-suspicion': 0.4 + (pStats(a).loyalty / 10) * 0.2,
      'both-had-it': Math.max(0, theirRead) * 0.25,
      'defended-them': Math.max(0, bond) * 0.08 + (theirRead > 0 ? 0 : 0.2),
      'took-it-back': (1 - pStats(a).temperament / 10) * 0.3,
      'made-them-pay-first': (pStats(a).strategic / 10) * 0.25 + (1 - pStats(a).loyalty / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'shared-suspicion';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'both-had-it' ? 'found they had the same name and made it a plan'
      : branch === 'defended-them' ? 'named somebody the other person was not prepared to lose'
        : branch === 'took-it-back' ? 'said a name and immediately asked for it back'
          : branch === 'made-them-pay-first' ? 'would not name anybody until the other one had'
            : 'shared a suspicion honestly';
    const note = lineFor(SHARE_SUSPICION_LINES[branch],
      `trust-share-suspicion-honestly|${branch}|${ctx.ep}`, { a, b, c: target });
    const bondDelta = branch === 'both-had-it' ? 2
      : branch === 'shared-suspicion' ? 1
        : branch === 'made-them-pay-first' ? 0.5
          : branch === 'took-it-back' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // TERMINAL: an honest read that gets handed straight back has ended, and
    // `buried` is what the two of them do with it afterwards.
    if (t && branch === 'defended-them') api.resolveArc(t.id, 'buried', { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, about: target,
      threadId: t?.id, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). MERGE-verdict event, kept for the same reason
// the other two in this file are, and forked on the thing an invitation
// actually has that a confidence does not: an answer with a price on it. The
// record the fork reads is the stored bond and {b}'s strategic and loyalty —
// somebody who has been on the outside of a plan all week does not accept
// being let in the same way as somebody who assumed they already were.
const INVITE_LINES = {
  'invited-in': [
    '{a} tells {b} {bSub}’s one of the people {aSub} is actually playing with.\n{a}: "I want you in. Properly. The real plan."\n{b}: "What’s the real plan?"\n{a}: "Sit down."',
    '{a} lets {b} see the whole plan, including the bad bits.\n{a}: "This is everything. Now you know."\n{b}: "Why me?"\n{a}: "Because I trust you."',
    '{a} brings {b} into the inner circle.\n{a}: "It’s me, and a couple of others. Now you."\n{b}: "I’m honoured, honestly."',
    '{a} invites {b} in.\n{a}: "You in?"\n{b}: "I’m in."',
  ],
  'showed-the-worst-of-it': [
    '{a} leads with the part that makes {aObj} look bad.\n{a}: "Before you say yes: on the second night, I voted for someone I liked, for strategy."\n{b}: "Why are you telling me that?"\n{a}: "Because you should know."',
    '{a} tells {b} the worst of it first.\n{a}: "I’ve lied to people in here. Not you. But people."\n{b}: "Thanks for being honest."',
    '{a} is honest with {b} about everything.\n{a}: "Here’s what I’ve done. All of it."\n{b}: "That’s a lot to tell someone."\n{b} (to camera): "It was a lot. But it meant I could trust {a}."',
    '{a} confesses before inviting {b} in.\n{a}: "I’m not perfect. I want you in anyway."\n{b}: "Then I’m in."',
  ],
  'asked-what-it-costs': [
    '{b} says yes, then asks what’s expected in return.\n{b}: "And in return?"\n{a}: "Your vote. When it matters."\n{b}: "Fair."',
    '{b} wants to know the price.\n{b}: "What do I owe you for this?"\n{a}: "Nothing. Yet."\n{b}: "Yet."',
    '{b} accepts, carefully.\n{b}: "What happens if I say no to something?"\n{a}: "Then we talk."',
    '{b} asks what the catch is.\n{b}: "There’s always a catch."\n{a}: "The catch is you stay loyal."',
  ],
  declined: [
    '{b} says no. Kindly.\n{b}: "I’d rather not owe anyone anything this week."\n{a}: "I get it."\n{a} (to camera): "I get it. I don’t like it."',
    '{b} turns {a} down.\n{b}: "I think I’m safer on my own. Sorry."\n{a}: "No, that’s fair."',
    '{b} won’t join.\n{b}: "Alliances get people banished. I’m staying out of it."\n{a}: "Suit yourself."',
    '{b} declines, with reasons.\n{b}: "If your group goes down, I go with it. No thanks."\n{a}: "Fair enough."\n{a} (to camera): "Can’t argue with that."',
  ],
};

registerEvent({
  id: 'trust-inner-circle-invite',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'strategic', 'boldness'],
    relationship: ['close-ally'],
    knowledge: ['incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 5 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-inner-circle-invite');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      'invited-in': 0.4 + Math.max(0, bond - 5) * 0.06,
      'showed-the-worst-of-it': (sa.boldness / 10) * 0.25 + (sa.loyalty / 10) * 0.2,
      'asked-what-it-costs': (sb.strategic / 10) * 0.3,
      declined: (1 - sb.loyalty / 10) * 0.25 + (sb.strategic / 10) * 0.1,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'invited-in';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'showed-the-worst-of-it' ? 'led with the part that made them look bad'
      : branch === 'asked-what-it-costs' ? 'accepted and priced it in the same breath'
        : branch === 'declined' ? 'would rather owe nobody anything this week'
          : 'was brought inside';
    const note = lineFor(INVITE_LINES[branch], `trust-inner-circle-invite|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'showed-the-worst-of-it' ? 2.5
      : branch === 'invited-in' ? 1
        : branch === 'asked-what-it-costs' ? 0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // TERMINAL: an invitation refused is a story that ended in the room it
    // started in, and neither of them will raise it again.
    if (t && branch === 'declined') api.resolveArc(t.id, 'buried', { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
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
    '{b} does {a} a small favour tonight, the kind that only makes sense if they’re still a team.\n{b}: "I told them you were with me all evening."\n{a}: "You didn’t have to."\n{b}: "Yes I did."',
    '{b} quietly takes something off {a}’s plate.\n{a}: "Did you do the washing up for me?"\n{b}: "Don’t mention it."',
    '{b} backs {a} up at dinner without being asked.\n{a}: "You didn’t have to do that at dinner."\n{b}: "You’d have done it for me."\n{a} (to camera): "{b} had my back tonight. I owe {b} one."',
    '{b} returns the favour from yesterday.\n{b}: "We’re even now."\n{a}: "We were never counting."',
  ],
  'noticed-and-said-so': [
    '{a} catches {b} doing it and says thank you properly.\n{a}: "I saw that. Thank you."\n{b}: "It was nothing."\n{a}: "It wasn’t nothing."',
    '{a} thanks {b} out loud.\n{a}: "You didn’t have to do that."\n{b}: "I know."',
    '{a} notices what {b} did for {aObj}.\n{a}: "You stuck up for me earlier."\n{b}: "Someone had to."',
    '{a} makes a point of thanking {b}.\n{b}: "Stop, you’re embarrassing me."\n{a}: "I mean it. Thank you."',
  ],
  'refused-it-back': [
    '{b} does {a} a favour and won’t let {a} return it.\n{a}: "Let me do something for you."\n{b}: "We’re not keeping score."\n{a} (to camera): "Generous? Or a way of making me owe {bObj}?"',
    '{b} won’t take anything back.\n{b}: "No. Keep it. I don’t want anything."\n{a}: "That makes me nervous."',
    '{b} refuses to be paid back.\n{b}: "Friends don’t count."\n{a}: "Everyone counts in here."',
    '{a} tries to return the favour and gets turned down.\n{b}: "Honestly, don’t."\n{a}: "I owe you."\n{b}: "You don’t."',
  ],
  'kept-the-score': [
    '{b} does {a} a favour, then mentions it again an hour later.\n{b}: "Remember I stuck up for you earlier."\n{a}: "I remember. I said thank you."',
    '{b} brings it up twice before bed.\n{b}: "So, earlier. That was me, just so you know."\n{a}: "I know, {b}. Thank you."\n{a} (to camera): "Okay, {b}. I get it. I owe you."',
    '{b} makes sure {a} knows the favour counts.\n{b}: "You owe me one."\n{a}: "Apparently."',
    '{b} keeps a running tab.\n{b}: "That’s two I’ve done for you now."\n{a}: "You’re counting?"',
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
    '{a} and {b} agree that whatever they’ve said stays between them.\n{a}: "This doesn’t leave this room."\n{b}: "It won’t. I swear."',
    '{a} asks {b} never to repeat it.\n{b}: "I won’t. You have my word."\n{a}: "Good."',
    '{a} and {b} make a promise.\n{a}: "Not a word to anyone."\n{b}: "Not a word."',
    '{a} and {b} agree to keep it quiet.\n{a}: "Not a word."\n{b}: "Not a word."\n{b} (to camera): "{a} trusted me with that. I’m not breaking it."',
  ],
  'agreed-a-version': [
    '{a} and {b} don’t agree to say nothing. They agree what to say.\n{a}: "If anyone asks, we were in the kitchen till eleven."\n{b}: "Till eleven. Got it."',
    '{a} and {b} line up their stories.\n{b}: "So what’s our version?"\n{a}: "We went up together. That’s it."',
    '{a} and {b} work out what they’ll both say.\n{a}: "Keep it simple. Same answer, same order."\n{b}: "Same answer. Same order."',
    '{a} and {b} agree on the story they’ll tell.\n{a}: "So, dinner, fire, bed."\n{b}: "Dinner, fire, bed."\n{a} (to camera): "Nothing to hide. We just want the same answer."',
  ],
  'one-sided-vow': [
    '{a} asks {b} to keep it quiet. {b} agrees, and asks nothing back.\n{b}: "Fine. I won’t say anything."\n{a}: "Don’t you want the same?"\n{b}: "No. I’m fine."',
    '{b} promises easily and won’t take a promise back.\n{a}: "What do you want back?"\n{b}: "Nothing."\n{a} (to camera): "{b} didn’t want anything back. That’s either kind or clever."',
    '{b} agrees to stay quiet, no questions asked.\n{b}: "Consider it forgotten."\n{a}: "Just like that?"',
    '{a} gets a promise and gives nothing.\n{b}: "Your secret’s safe."\n{a}: "And what do you want for it?"\n{b}: "Nothing."\n{a} (to camera): "{b} didn’t ask me to promise anything. I’m not sure why."',
  ],
  'would-not-promise': [
    '{a} asks {b} to keep it between them. {b} says no.\n{b}: "I’m not promising that. I won’t lie to you about what I’d do."\n{a}: "That’s worse than a yes."\n{b}: "It’s honest."',
    '{b} won’t make the promise.\n{b}: "If it matters at the table, I’ll say it."\n{a}: "Great. Thanks."',
    '{b} refuses, and explains why.\n{b}: "I can’t promise silence in a game like this."\n{a}: "Fair."\n{a} (to camera): "At least {b} said it to my face."',
    '{b} won’t swear to it.\n{b}: "Sorry. No promises this week."\n{a}: "Next week, then?"',
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

// ── REWRITE (Task 7 stage 6), AND THE AUDIT'S ONE `REMOVE` ANSWERED ───
//
// This is the single event the stage-1 audit marked REMOVE, and the reason it
// gave was not the premise: "a two-person event in which one of the two is
// explicitly NOT in the room. It feeds the composer a pair whose second member
// cannot react, which is the presence-model defect Task 6 fix round 1 spent a
// round on."
//
// That is a defect in the RECORD, not in the scene, and stage 5 found and
// fixed the identical shape in `cover-feign-fear:borrowed-it` by reporting one
// participant instead of two. The same fix works here and is better than
// deleting the premise: being defended while you are upstairs is one of the
// most characteristic things that happens in this format, and an `after-table`
// scene is worth more than a tidy registry. So {b} is no longer named as a
// participant on any branch — {b} is not in the room, and the composer must
// not be told otherwise — while the bond between them still moves, because
// what {a} spent is real whether or not {b} ever hears about it.
//
// AND THE SUCCESS BRANCH IS RENAMED. `defended` is already produced by
// `susp-out-of-earshot` and `mission-what-cost-us`, where it means the
// OPPOSITE thing — a door shut in the face of the person asking — and stage 5
// moved it to ADVERSE_BRANCHES for that reason. Two events writing one branch
// string with opposite senses would make `_tone` mean two things, so this one
// is `spoke-for-them`. Same reasoning stage 5 used when it renamed
// `grief-headcount`'s new branch rather than reusing `would-not-say-it`.
//
// THE FORK IS WHAT THE DEFENCE COSTS, and the record it reads is the open
// suspicion story naming {b} — which the weight already requires — plus its
// heat. Defending somebody against a cold story is cheap; defending them
// against a live one is the scene.
const DEFEND_LINES = {
  'spoke-for-them': [
    'Someone brings up {b}’s name at dinner, and {a} shuts it down.\n{a}: "It’s not {b}. I’d bet my game on it."\n{a} (to camera): "{b} wasn’t there to defend {bRef}. So I did."',
    '{b} isn’t in the room. {a} argues for {bObj} anyway.\n{a}: "You’re wrong about {b}. Completely wrong."\n{a} (to camera): "And I won that argument."',
    '{a} defends {b} behind {bPos} back.\n{a}: "Leave {b} out of it. {b}’s Faithful."',
    '{a} sticks up for {b} while {b} is out of earshot.\n{a} (to camera): "{b} would do the same for me."',
  ],
  'lost-the-argument': [
    '{a} defends {b} and loses, in front of four people.\n{a}: "It’s not {b}!"\n{a} (to camera): "Nobody listened. They kept saying {b}’s name."',
    '{a} argues for {b}, and gets outnumbered.\n{a} (to camera): "I tried. I really tried. They’re set on {b}."',
    'The room hears {a} out, and keeps saying {b}’s name.\n{a} (to camera): "I made it worse, I think."',
    '{a} loses the argument about {b} on the facts.\n{a} (to camera): "They had points. I didn’t have answers."',
  ],
  'was-asked-why': [
    'Somebody asks {a} why {aSub} cares so much about {b}.\n{a} (to camera): "Why do I care? Because {b}’s my friend. But now they’re looking at me too."',
    '{a} defends {b}, and the question comes back at {aObj}.\n{a} (to camera): "Somebody asked why I’m so keen to protect {b}. That’s not a good question to get."',
    '{a} gets asked why {aSub}’s defending {b}.\n{a} (to camera): "I didn’t have a great answer. I just trust {b}."',
    '{a} stands up for {b}, and draws attention to {aRef}.\n{a} (to camera): "Great. Now there’s two of us under suspicion."',
  ],
  'let-it-sit': [
    '{b}’s name comes up, and {a} lets it sit there.\n{a} (to camera): "I could’ve defended {b}. It would’ve cost me. I didn’t."',
    '{a} says nothing while {b} gets talked about.\n{a} (to camera): "I hated doing that. But I can’t go down with {b}."',
    '{a} works out what a defence would cost tonight, and doesn’t pay it.\n{a} (to camera): {cam:vote-cost}',
    '{a} stays quiet about {b}.\n{a} (to camera): "Sorry, {b}. Not tonight."',
  ],
};

registerEvent({
  id: 'trust-defend-in-absentia',
  family: FAMILY,
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'backfire', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'boldness', 'strategic'],
    knowledge: ['incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (getBond(a, b) < 1) return 0;
    // Wants some grounds — an open suspicion thread naming b is what makes a
    // defense a defense rather than a compliment out of nowhere.
    const threads = gs.tr?.threads || [];
    return threads.some(t => t.state === 'open' && t.kind === 'suspicion' && t.parties.includes(b)) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-defend-in-absentia');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    // THE STORY BEING DEFENDED AGAINST, and how live it is. Both stored; the
    // weight has already established that at least one such story exists.
    const against = (gs.tr?.threads || [])
      .filter(t => t.state === 'open' && t.kind === 'suspicion' && t.parties.includes(b))
      .sort((x, y) => heatAt(y, ctx.ep) - heatAt(x, ctx.ep))[0];
    const heat = against ? heatAt(against, ctx.ep) : 0;
    const scores = {
      'spoke-for-them': 0.35 + (sa.loyalty / 10) * 0.25,
      'lost-the-argument': heat * 0.3 + (1 - sa.social / 10) * 0.2,
      'was-asked-why': (sa.boldness / 10) * 0.25 + heat * 0.2,
      'let-it-sit': (sa.strategic / 10) * 0.25 + (1 - sa.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'spoke-for-them';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'lost-the-argument' ? 'argued for somebody absent and was beaten'
      : branch === 'was-asked-why' ? 'was asked why they cared so much'
        : branch === 'let-it-sit' ? 'let a name sit there and gain weight'
          : 'defended somebody who was not there';
    const note = lineFor(DEFEND_LINES[branch], `trust-defend-in-absentia|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'defended' ? 2
      : branch === 'lost-the-argument' ? 1
        : branch === 'was-asked-why' ? 1 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // ONE PARTICIPANT. {b} is upstairs. See the header — this is the whole of
    // what the audit's REMOVE verdict was about, and it is a record fix.
    const out = { branch, actor: a, threadId: t?.id, bondDelta };
    // Spending capital on somebody who is not in the room to see it done, and
    // will never be told. The country is watching and that is the whole point.
    if (branch === 'spoke-for-them' || branch === 'lost-the-argument') {
      out.crowd = { name: a, colour: 'selfless' };
    }
    return out;
  },
});
// A second forking event, distinct from the vote-commitment flagship: what
// happens to something told in confidence, scored off the RECEIVER'S own
// loyalty/temperament/social rather than a coin. Three real outcomes, three
// different consequences — none of them cosmetic.
const SECRET_SWAP_LINES = {
  kept: [
    '{a} tells {b} privately that {a} trusts {target} least.\n{a}: "Just between us. I don’t trust {target}."\n{b}: "Understood."\n{b} keeps it quiet.',
    '{b} has two chances to repeat what {a} said about {target}, and says nothing both times.\n{b} (to camera): "{a} told me that in confidence. It stays there."',
    '{a} confides in {b} about {target}.\n{a}: "Don’t tell anyone."\n{b}: "I won’t."\nAnd {b} doesn’t.',
    '{b} keeps {a}’s secret about {target}.\n{b} (to camera): "I know what {a} thinks of {target}. Nobody else will."',
  ],
  leakedAccident: [
    'Later, {b} lets slip to {who} that {a} doesn’t trust {target}.\n{b}: "Even {a} doesn’t trust {target}— oh. I wasn’t supposed to say that."\n{b} (to camera): "I didn’t mean to. It just came out."',
    'Later, while talking to {who}, {b} gives away {a}’s secret by accident.\n{b}: "...which is why {a} thinks it’s {target}. Oh, God. Don’t tell {a} I said that."',
    'Later, {b} tells {who} what {a} said about {target}, without thinking.\n{b} (to camera): "I realised halfway through the sentence. Too late."',
    'Later that day, {b} accidentally repeats {a}’s suspicion of {target} to {who}.\n{b} (to camera): "Well, that’s one friendship I’ve probably ruined."',
  ],
  leakedDeliberate: [
    'As soon as {a} is out of earshot, {b} tells {who}, on purpose, that {a} doesn’t trust {target}.\n{b}: "Just so you know, {a}’s been saying things about {target}."\n{b} (to camera): "Information is currency. I just spent some."',
    'Later, {b} trades {a}’s secret about {target} to {who}.\n{b}: "I’ll tell you something, if you tell me something."\n{b} (to camera): "Sorry, {a}. It was worth more to me out than in."',
    'Later, {b} uses what {a} said about {target}.\n{b} (to camera): "I needed {who} on side. {a}’s secret got me there."',
    'By the afternoon, {b} passes {a}’s suspicion of {target} to {who} on purpose.\n{b} (to camera): "In this game, secrets are for spending."',
  ],
  'refused-to-trade': [
    '{a} gives {b} something real, and gets nothing back.\n{a}: "Your turn."\n{b}: "I haven’t really got anything."\n{a} (to camera): "Right. So it’s one way."',
    '{b} takes what {a} offers and doesn’t offer anything.\n{a}: "Your turn."\n{b}: "I haven’t really got anything."\n{a} (to camera): "I gave. {b} took. That tells me something about {b}."',
    '{a} tries to trade secrets. {b} won’t play.\n{b}: "I’d rather keep mine, thanks."\n{a}: "That’s not how it works."\n{b}: "It is now."',
    '{b} listens to {a}’s secret and keeps {b}’s own.\n{a}: "That’s not how it works."\n{b}: "It is now."',
  ],
};

registerEvent({
  id: 'trust-secret-swap',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'social', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
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
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-secret-swap');
    const sceneWhy = 'traded something they had not told anyone';
    const [a, b] = ctx.actors;
    const target = whoTheyTold(a, [a, b], ctx.living, 1)[0];
    const st = pStats(b);
    const keepScore = (st.loyalty / 10) * 0.6 + (st.temperament / 10) * 0.4;
    const accidentScore = (1 - st.social / 10) * 0.5 + 0.15;
    const deliberateScore = (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.5;
    // A FOURTH OUTCOME, and it happens BEFORE the other three can: there is
    // no secret to keep or leak because {b} never gave one. The three above
    // all assume the trade completed; this is the one where it did not, and
    // it leaves {a} exposed alone.
    const refuseScore = (1 - st.boldness / 10) * 0.3 + (st.strategic / 10) * 0.2;
    const total = keepScore + accidentScore + deliberateScore + refuseScore;
    const roll = rng() * total;
    let branch;
    if (roll < keepScore) branch = 'kept';
    else if (roll < keepScore + accidentScore) branch = 'leakedAccident';
    else if (roll < keepScore + accidentScore + deliberateScore) branch = 'leakedDeliberate';
    else branch = 'refused-to-trade';

    // ── THE SECRET IS A STORED CLAIM BEFORE IT IS A LEAK ────────────────
    //
    // The causal contract needs the thing that travelled to exist on the record
    // before anybody can be said to have repeated it. `a` telling `b` in
    // confidence is the claim; `b` telling anybody else is a propagation hop
    // with a named recipient and a receipt. Before this, the leak branches
    // wrote a bond and nothing else, so "it arrived back at {a} by three
    // separate routes" named nobody, informed nobody, and could not be cited by
    // any later scene — the exact shape the knowledge contract forbids.
    // `refused-to-trade` produced no secret at all, so nothing travelled and
    // nothing may be recorded as having travelled.
    const leaked = branch !== 'kept' && branch !== 'refused-to-trade';
    // Deliberate is ONE person, chosen; accidental spreads. Neither draws rng
    // (see `whoTheyTold`), so this cannot reroute a season.
    const heard = leaked
      ? (whoTheyTold(b, [a, b, target], ctx.living,
        branch === 'leakedDeliberate' ? 1 : 3).length
          ? whoTheyTold(b, [a, b, target], ctx.living,
            branch === 'leakedDeliberate' ? 1 : 3)
          : [target])
      : [];
    // STILL `pick(rng, ...)`, AND THAT IS LOAD-BEARING. Swapping it for the
    // hashed `lineFor` would remove an rng draw from the castle stream and
    // reroute every draw after it — see the header of js/tr/castle/lines.js,
    // which measured that at -2.9% firings on one event. The pool is the same
    // length it was; only two of its sentences now carry substitutions.
    const line = pick(rng, SECRET_SWAP_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b)
      .replace(/\{target\}/g, target)
      .replace(/\{who\}/g, namesPhrase(heard)).replace(/\{n\}/g, countWord(heard.length));
    // A one-sided trade costs the pair less than a leak and more than nothing:
    // {a} is not betrayed, only unmatched, and knows it.
    let bondDelta = branch === 'kept' ? 1 : branch === 'refused-to-trade' ? -0.5
      : branch === 'leakedAccident' ? -1 : -3;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (leaked && heard.length) {
      const claim = api.recordClaim(a, `${a} told ${b} that ${a} trusted ${target} least`,
        { about: target, listeners: [b], channel: 'conversation', source: sceneWhy });
      for (const to of heard) {
        api.propagate(claim.id, b, to,
          { channel: 'conversation', source: `${b} repeated what ${a} said in confidence` });
      }
    }
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: target,
      topicKind: 'secret-confidence', threadId: t?.id, bondDelta };
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
    'The lights are out before {b} says it.\n{b}: "Whatever happens tomorrow, I’m not writing your name. I promise."\n{a}: "I believe you."',
    '{b} waits until it’s dark to give {a} a straight promise.\n{b}: "You’re safe with me. Always."\n{a}: "Goodnight, {b}."\n{b}: "Goodnight."',
    'In the dark, {b} tells {a} what {a} needs to hear.\n{b}: "I’ve got you tomorrow."\n{a}: "Promise?"\n{b}: "Promise."',
    '{b} whispers it across the room.\n{b}: "Not you. Never you."\n{a}: "Never you either."',
  ],
  hedged: [
    '{a} asks in the dark, and {b} gives an answer with a way out.\n{a}: "You’re with me tomorrow?"\n{b}: "Probably. Let’s see."\n{a} (to camera): "Probably. In the dark. Great."',
    '{b} says something that sounds like yes.\n{b}: "Yeah, yeah. Go to sleep."\n{a}: "Is that a yes?"\n{a} (to camera): "That wasn’t a yes."',
    '{a} asks, and {b} half answers.\n{b}: "I’ll see what everyone says tomorrow."\n{a}: "That’s not an answer."',
    '{b} gives a yes that isn’t quite a yes.\n{b}: "We’ll be fine. Night."\n{a}: "Night."',
  ],
  broken: [
    '{b} tells {a}, in the dark, that {b} can’t promise.\n{b}: "I can’t promise that. I’m sorry."\n{a}: "Right."\nNeither of them sleeps much.',
    '{b} says no, plainly, and rolls over.\n{b}: "No. Not tomorrow. I can’t."\n{a}: "Okay. Thanks for saying it."\n{a} (to camera): "At least I know."',
    '{b} won’t give {a} the promise.\n{b}: "I don’t know where my vote’s going. I won’t lie to you."\n{a}: "I appreciate that."',
    'It ends at lights out.\n{b}: "I’m not voting with you tomorrow."\n{a}: "Why?"\n{b}: "Goodnight."',
  ],
  'turned-it-round': [
    '{a} asks in the dark, and {b} asks it straight back.\n{a}: "Are you with me tomorrow?"\n{b}: "Are you with me?"\nNeither answers first.',
    '{b} won’t go first.\n{b}: "You tell me first."\n{a}: "I asked you."\n{b}: "I know."',
    '{b} puts the same question to {a} and waits.\n{a}: "Will you stick with me tomorrow?"\n{b}: "Will you stick with me?"\n{a}: "I asked first."\n{a} (to camera): "Stalemate. In the dark. Brilliant."',
    '{a} and {b} end the night waiting for the other to promise.\n{a}: "Well?"\n{b}: "Well?"',
  ],
};

registerEvent({
  id: 'trust-last-word-before-lights-out',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['loyalty', 'boldness', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
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
    // A FOURTH ANSWER IN THE DARK: {b} refuses to go first and puts it back.
    // Distinct from `hedged`, which buys an exit -- this buys the same
    // commitment from the asker, and it reads intuition, which nothing else
    // in this fork does.
    const turnScore = (st.intuition / 10) * 0.35 + (st.strategic / 10) * 0.2;
    const total = swearScore + hedgeScore + breakScore + turnScore;
    const roll = rng() * total;
    let branch;
    if (roll < swearScore) branch = 'sworn';
    else if (roll < swearScore + hedgeScore) branch = 'hedged';
    else if (roll < swearScore + hedgeScore + breakScore) branch = 'broken';
    else branch = 'turned-it-round';

    const line = pick(rng, LAST_WORD_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread(FAMILY, [a, b]);
    // Mutual wariness is not a betrayal and it is not nothing.
    const bondDelta = branch === 'sworn' ? 3 : branch === 'turned-it-round' ? -0.5
      : branch === 'hedged' ? 0 : -2;
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
