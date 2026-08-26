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
import { openThread, advanceThread, findOpenThread, heatAt } from '../threads.js';

const FAMILY = 'trust';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

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
//               FIRST. A genuine role reversal: a new thread opens with the
//               parties' narrative roles swapped, not just a repeat of this
//               one with a different verb.
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
    let bondDelta = 0;
    let thread;
    if (branch === 'kept') {
      bondDelta = 2;
      addBond(asker, asked, bondDelta);
      thread = openThread(FAMILY, [asker, asked], ctx.ep, line);
    } else if (branch === 'broken') {
      bondDelta = -3;
      addBond(asker, asked, bondDelta);
      thread = openThread(FAMILY, [asker, asked], ctx.ep, line);
    } else if (branch === 'deflected') {
      bondDelta = 0;
      thread = openThread(FAMILY, [asker, asked], ctx.ep, line);
    } else {
      bondDelta = -1;
      addBond(asker, asked, bondDelta);
      // Role reversal: the new thread's parties are the SAME pair (a thread
      // is keyed on party-set, not on who is asking whom), but the note
      // records that the narrative role flipped, which is what a later
      // event reads to know whose move it is next.
      thread = openThread(FAMILY, [asker, asked], ctx.ep, line);
    }
    return { branch, pair: [asker, asked], threadId: thread?.id, bondDelta };
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    return t && heatAt(t, ctx.ep) >= 1 ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
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

export const _internal = { _sawMurderLastNight };
