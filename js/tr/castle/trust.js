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
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { openThread, advanceThread, closeThread, findOpenThread, openThreadsFor, heatAt,
  advanceCiting, lastClosedThread, outcomeSense } from '../threads.js';

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

const CONFIDE_LINES = [
  '{a} told {b} something they hadn\'t said out loud to anyone else in the castle.',
  '{a} let their guard down with {b} for a minute, and meant it.',
  'Over cold coffee, {a} admitted to {b} how frightened they actually were.',
  '{a} confided a real fear to {b}, not a strategic one — a personal one.',
];

registerEvent({
  id: 'trust-confide-fear',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  // Confiding needs SOME warmth already, or it reads as a stranger
  // oversharing — that is a different, worse event than the one intended.
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const bond = getBond(a, b);
    if (bond < 1) return 0;
    return 2 + Math.min(3, bond / 3);
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const note = pick(rng, CONFIDE_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'confided', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

const TRADE_LINES = [
  '{a} and {b} compared notes on {c} — quietly, and to no one else.',
  '{a} asked {b} point blank what they made of {c}. {b} told them.',
  'Walking back from breakfast, {a} and {b} traded honest reads on {c}.',
  '{a} and {b} spent ten minutes on {c} and did not once say anything they would repeat elsewhere.',
  '"What do you actually think about {c}," {b} asked, and {a} answered the actual question.',
  '{a} gave {b} the version of their read on {c} that had the doubts still in it.',
];

registerEvent({
  id: 'trust-trade-reads',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 2 : 0.5;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others);
    addBond(a, b, 1);
    let note = pick(rng, TRADE_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    // SPEC 5.5, BRANCHING ON A CLOSED THREAD'S OUTCOME. An honest read on
    // somebody is mostly a memory of how the last thing about them ended, and
    // the castle wrote that down when closeThread named the outcome.
    const prior = lastClosedThread(target, { beforeEp: ctx.ep });
    const sense = outcomeSense(prior?.outcome);
    // NO DAY NUMBER: see the note in suspicion.js's susp-noticed-inconsistency.
    // "day N" belongs to same-thread residue citation and is guarded as such.
    if (sense === 'walked') note += ` Both of them remembered ${target} being asked once, and coming out of it clean.`;
    else if (sense === 'cracked') note += ` Neither of them had forgotten what came out of ${target} the last time.`;
    else if (sense === 'coupled') note += ` Whatever ${target} was doing, it had stopped being a secret a while ago.`;
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'traded-reads', pair: [a, b], about: target, threadId: t?.id,
      priorOutcome: prior?.outcome ?? null };
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
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(CIRCLE_LINES, `trust-circle-forms|${ctx.ep}`, { a, b }));
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
    '{b} looked {a} in the eye and said "count on it" — and meant it enough to actually do it.',
    'When the moment came, {b} voted exactly the way they told {a} they would.',
    '{b} gave {a} a name and then wrote that name down, which is rarer here than it sounds.',
    '{a} did not have to check. {b} had said it, and {b} did it.',
  ],
  broken: [
    '{b} promised {a} their vote, smiled, and cast it somewhere else entirely.',
    '{a} believed {b}. The ballot said otherwise.',
    '{b} said the right name to {a} at lunch and a different one on the slate.',
    'The promise held right up until the pen, and then it did not.',
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
      if (bondDelta) addBond(asker, asked, bondDelta);
      thread = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [asker, asked], ctx.ep, line);
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
      addBond(asker, asked, bondDelta);
      if (existing) closeThread(existing.id, ctx.ep, 'turned-back');
      thread = openThread(FAMILY, [asked, asker], ctx.ep, line);
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
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(HUDDLE_LINES, `trust-post-murder-huddle|${ctx.ep}`, { a, b }));
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
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(PACT_LINES, `trust-protect-pact|${ctx.ep}`, { a, b });
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'pact', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

const CHECKIN_LINES = [
  '{a} checked in with {b} — the arrangement was still holding.',
  '{a} caught {b} on the stairs, asked nothing in particular, and got the answer they wanted.',
  'Neither of them named it. {a} asked if they were still good and {b} said they were.',
  '{a} wanted to hear it out loud again this morning, and {b} said it again without complaint.',
  'It took four words at the door, and {a} went into the day steadier for them.',
];

registerEvent({
  id: 'trust-late-checkin',
  // CITES (Plan 5 Task 2). "The arrangement" is whichever one they made, and
  // the day they made it on is the difference between a check-in and a
  // sentence about nothing.
  citesResidue: true,
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // ACT: CLOSING. Widened from `{ late: 1.5 }` into a full profile by Plan 5
  // Task 5: a quiet check-in on somebody after the table reads as ordinary
  // manners in week one and as a survival move at final six, so the early
  // term earns its place as much as the late one.
  acts: { early: 0.6, late: 1.5 },
  // DECISION (round 1 fix): originally gated on `heatAt >= 1`. Heat starts at
  // 1 on open and decays 0.5 per round of silence, and this window (dawn)
  // only ever sees a trust thread AFTER at least one full round has elapsed
  // since it last moved — most of these windows run before that same
  // thread's own evening/after-table slot has fired again. So `>= 1`
  // required the thread to have already been ADVANCED at least once
  // (heat 2 -> 1.5 after one round of decay) before this could ever be
  // eligible — a conjunction measured at 0.2% of trust firings over 250
  // seasons, which is the dead-content failure rare-state amplification
  // exists to prevent, not a deliberately rare beat (nothing about "checking
  // in" is meant to be rarer than the pact it follows up on). Loosened to
  // `> 0`: any trust thread that hasn't fully gone cold yet, which a plain
  // single-open thread (heat 1) still satisfies one round later (0.5 > 0).
  // `rare: true` was considered and rejected — that flag amplifies a weight
  // that is ALREADY positive when eligibility is rolled; it does nothing for
  // an event whose real problem is that eligibility itself almost never
  // triggers, which is what was happening here.
  // ROUND 2 FIX: see `_threadForActors` above — this used to require the
  // exact original pair to be the scene, which measured ZERO firings across
  // 60 real seasons. Now any open trust thread involving either actor
  // drawn into the scene qualifies, and the real partner is read off the
  // thread's own `parties`.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    return t && heatAt(t, ctx.ep) > 0 ? 2 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    addBond(a, b, 1);
    const { thread, cited } = advanceCiting(t, ctx.ep,
      lineFor(CHECKIN_LINES, `trust-late-checkin|${ctx.ep}`, { a, b }));
    return { branch: 'checked-in', pair: [a, b], threadId: thread?.id, cited, bondDelta: 1 };
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
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    addBond(a, b, 1);
    const note = pick(rng, SHARE_SUSPICION_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
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
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(INVITE_LINES, `trust-inner-circle-invite|${ctx.ep}`, { a, b }));
    return { branch: 'invited-in', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

const FAVOR_LINES = [
  '{b} did {a} a small, real favor tonight — the kind that only makes sense if the pact still holds.',
  '{b} took something off {a}\'s plate without being asked and without mentioning it afterwards.',
  '{b} covered for {a} over something trivial, which is how you find out about the untrivial ones.',
  'Nobody saw {b} do it except {a}, and {b} had made sure of that.',
  '{a} had not asked. {b} had noticed anyway, and dealt with it.',
];

registerEvent({
  id: 'trust-return-favor',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return findOpenThread(FAMILY, [a, b]) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const existing = findOpenThread(FAMILY, [a, b]);
    addBond(a, b, 1);
    const note = lineFor(FAVOR_LINES, `trust-return-favor|${ctx.ep}`, { a, b });
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'favor-returned', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

const VOW_LINES = [
  '{a} and {b} agreed: whatever was said between them stays between them.',
  '{a} asked {b} never to repeat it, and {b} said they would not, and both of them believed it.',
  'They drew a line around the conversation, {a} and {b}, and agreed nothing crossed it.',
  '{b} promised {a} that nobody else would ever hear a word of it, including the parts that were nothing.',
  'It was a small agreement about a small thing, and {a} and {b} both understood it was not.',
];

registerEvent({
  id: 'trust-vow-of-silence',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // ROUND 2 FIX: see `_threadForActors` — this measured ZERO firings across
  // 60 real seasons under the exact-pair gate. Same fix as late-checkin.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    return t && heatAt(t, ctx.ep) >= 1 ? 1.5 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(FAMILY, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const advanced = advanceThread(t.id, ctx.ep,
      lineFor(VOW_LINES, `trust-vow-of-silence|${ctx.ep}`, { a, b }));
    addBond(a, b, 0.5);
    return { branch: 'vowed-silence', pair: [a, b], threadId: advanced?.id, bondDelta: 0.5 };
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
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(DEFEND_LINES, `trust-defend-in-absentia|${ctx.ep}`, { a, b }));
    return { branch: 'defended', pair: [a, b], threadId: t?.id, bondDelta: 2 };
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
    addBond(a, b, bondDelta);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
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
    if (bondDelta) addBond(a, b, bondDelta);
    // Write the beat FIRST so the payoff carries the story it is paying off,
    // then resolve. `hedged` is the branch that leaves it open, and it has to
    // exist or this becomes an event that ends every trust story it touches.
    const { note, cited } = advanceCiting(thread, ctx.ep, line);
    const outcome = branch === 'sworn' ? 'passed-clean' : branch === 'broken' ? 'turned-back' : null;
    if (outcome) closeThread(thread.id, ctx.ep, outcome);
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

export const _internal = { _sawMurderLastNight };
