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
import { openThread, advanceThread, closeThread, findOpenThread, openThreadsFor, heatAt } from '../threads.js';

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
    const note = pick(rng, CONFIDE_LINES).replace('{a}', a).replace('{b}', b);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'confided', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

const TRADE_LINES = [
  '{a} and {b} compared notes on {c} — quietly, and to no one else.',
  '{a} asked {b} point blank what they made of {c}. {b} told them.',
  'Walking back from breakfast, {a} and {b} traded honest reads on {c}.',
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
    const note = pick(rng, TRADE_LINES).replace('{a}', a).replace('{b}', b).replace('{c}', target);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'traded-reads', pair: [a, b], about: target, threadId: t?.id };
  },
});

// A closer circle than a single confidence — gated behind real warmth (rare,
// so the RARE_MULTIPLIER guard in events.js can do its job: a rare event
// that never gets the amplification cannot outbid common events on raw
// weight, no matter how good it reads).
registerEvent({
  id: 'trust-circle-forms',
  family: FAMILY,
  window: 'evening',
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
      `${a} and ${b} agreed, without quite saying the word, that they were a unit now.`);
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
  ],
  broken: [
    '{b} promised {a} their vote, smiled, and cast it somewhere else entirely.',
    '{a} believed {b}. The ballot said otherwise.',
  ],
  deflected: [
    '{b} never actually said yes — they talked around it until {a} stopped pushing.',
    '{a} asked for a number. {b} gave them a vibe.',
  ],
  turned: [
    '{b} answered the ask with an ask of their own: "you first."',
    'Instead of committing, {b} turned it around on {a} — now THEY owe an answer.',
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

    const line = pick(rng, COMMIT_LINES[branch]).replace('{a}', asker).replace('{b}', asked);
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
      `${a} and ${b} sat close after last night, and neither one pretended they weren't scared.`);
    return { branch: 'huddled', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

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
    const note = `${a} and ${b} made it explicit: whatever happens, neither one puts the other's name down.`;
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'pact', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'trust-late-checkin',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  acts: { late: 1.5 },
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
    const advanced = advanceThread(t.id, ctx.ep, `${a} checked in with ${b} — the arrangement was still holding.`);
    return { branch: 'checked-in', pair: [a, b], threadId: advanced?.id, bondDelta: 1 };
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
    const note = pick(rng, SHARE_SUSPICION_LINES).replace('{a}', a).replace('{b}', b).replace('{c}', target);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'shared-suspicion', pair: [a, b], about: target, threadId: t?.id, bondDelta: 1 };
  },
});

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
      `${a} told ${b}, in so many words: you're one of the people I'm actually playing this with.`);
    return { branch: 'invited-in', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

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
    const note = `${b} did ${a} a small, real favor tonight — the kind that only makes sense if the pact still holds.`;
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'favor-returned', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

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
    const advanced = advanceThread(t.id, ctx.ep, `${a} and ${b} agreed: whatever was said between them stays between them.`);
    addBond(a, b, 0.5);
    return { branch: 'vowed-silence', pair: [a, b], threadId: advanced?.id, bondDelta: 0.5 };
  },
});

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
      `When somebody brought ${b}'s name up sideways, ${a} shut it down before it went anywhere.`);
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
  ],
  leakedAccident: [
    '{b} didn\'t mean to repeat it — it just slipped out in a different conversation entirely.',
    'The secret got out through {b}, and {b} looked as surprised as anyone that it had.',
  ],
  leakedDeliberate: [
    '{b} traded {a}\'s secret to somebody else for something better.',
    '{b} decided {a}\'s secret was worth more spent than kept.',
  ],
};

registerEvent({
  id: 'trust-secret-swap',
  family: FAMILY,
  window: 'evening',
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

    const line = pick(rng, SECRET_SWAP_LINES[branch]).replace('{a}', a).replace('{b}', b);
    let bondDelta = branch === 'kept' ? 1 : branch === 'leakedAccident' ? -1 : -3;
    addBond(a, b, bondDelta);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});

export const _internal = { _sawMurderLastNight };
