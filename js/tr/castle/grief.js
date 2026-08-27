// ══════════════════════════════════════════════════════════════════════
// tr/castle/grief.js — the empty chair, the counting, who sits where now
// ══════════════════════════════════════════════════════════════════════
//
// This is the family that makes a castle read as unlike a camp. Nobody is
// voted out overnight here — somebody is TAKEN, off-screen, with no
// explanation, and the room finds out at breakfast. A camp's exit is a
// tribal council everybody watched happen; a castle's is an absence. Every
// event in this file is downstream of that one fact, and every one of them
// requires it: `_murderedLastNight` is the shared gate.
//
// No belief writes here either. A murder reaction is about how the SURVIVORS
// process a death, not a claim about who caused it — that channel (if one
// exists at all) belongs to suspicion.js or deduction.js, not here.
import { gs, players } from '../../core.js';
import { pStats } from '../../players.js';
import { addBond, getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { openThread, advanceThread, findOpenThread, continueThread } from '../threads.js';
import { alignmentAt } from '../roles.js';

const FAMILY = 'grief';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/** Was there a murder in the round that just closed? Shared by every event below. */
function _victimLastNight(ep) {
  const rounds = gs?.tr?.rounds;
  if (!rounds) return null;
  const round = rounds.find(r => r.ep === ep - 1 && r.murdered);
  return round ? round.murdered : null;
}

const EMPTY_CHAIR_LINES = [
  '{a} and {b} both ended up staring at the same empty seat at breakfast.',
  'Nobody moved {v}\'s chair. {a} and {b} noticed at the same time that nobody had.',
  '{a} caught {b} looking at the gap at the table before either of them said anything.',
];

registerEvent({
  id: 'grief-empty-chair',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 3 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    addBond(a, b, 1);
    const note = pick(rng, EMPTY_CHAIR_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{v\}/g, v);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'empty-chair', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'grief-headcount',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const actors = ctx.actors;
    const remaining = (ctx.living || []).length;
    const v = _victimLastNight(ctx.ep);
    const note = actors.length === 2
      ? `${actors[0]} said it out loud so ${actors[1]} didn't have to: ${remaining} of them left.`
      : `${actors[0]} counted the castle twice, like the number might change.`;
    const t = openThread(FAMILY, actors, ctx.ep, note);
    if (actors.length === 2) addBond(actors[0], actors[1], 1);
    return { branch: 'headcount', actors, victim: v, remaining, threadId: t?.id };
  },
});

registerEvent({
  id: 'grief-seating-shift',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `grief|morning` held five events and
  // no advancer, the largest dead cell in the pool. Grief is cumulative by
  // nature — the second empty chair is only heavy because of the first — so
  // the citation is doing the work the family already implied.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      `${a} sat somewhere new this morning, and ${b} sat down right next to them without being asked.`);
    return { branch: 'reseated', pair: [a, b], threadId: thread?.id, cited, bondDelta: 1 };
  },
});

registerEvent({
  id: 'grief-shared-mourning-bond',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (!_victimLastNight(ctx.ep)) return 0;
    return getBond(a, b) >= 3 ? 2.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = `${a} and ${b} didn't talk much this morning. They didn't need to.`;
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'shared-mourning', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

registerEvent({
  id: 'grief-suspicion-of-timing',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `grief|morning`. "Why last night" is a question
  // that gets sharper every time it is asked, and the citation is what makes
  // the second asking sound different from the first.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    addBond(a, b, 1);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      `${a} said to ${b}, quietly: "of everyone, why ${v}, and why last night?" Neither of them had an answer.`);
    return { branch: 'timing', pair: [a, b], victim: v, threadId: thread?.id, cited, bondDelta: 1 };
  },
});

// ── FLAGSHIP: the morning reaction — a four-way fork on archetype AND role,
// not a random pick with four labels ────────────────────────────────────
//
// A hero mourns differently than a mastermind, and — this is the part that
// matters — a Traitor sitting at that same breakfast table is processing a
// death they may have CAUSED, which no archetype check alone can capture.
// Role decides what is available (a Traitor can choose to exploit the grief;
// a Faithful cannot, because there is nothing behind their reaction to
// exploit); archetype decides what a person given that choice is like at it.
//   MOURNING OPENLY        — loyal/social archetypes, or just a strong bond
//                            with whoever else is present. Warms the pair.
//   SUSPICIOUS IMMEDIATELY — perceptive/strategic types start asking "who
//                            benefits" out loud. Opens a thread aimed at that
//                            question rather than at grief itself.
//   STOIC WITHDRAWAL       — low-social players go quiet. No bond movement;
//                            the ABSENCE of a reaction is itself the state
//                            change worth recording.
//   OPPORTUNISTIC USE      — ONLY reachable by a living Traitor (role gate,
//                            checked first) — regardless of archetype. A
//                            hero who took the recruitment IS a Traitor now
//                            and this branch is open to them exactly as it is
//                            to a villain; what differs is how well they sell
//                            it, scored the same way cover.js scores a lie.
/** See cover.js: lines that need no partner when there is none to name. */
function _partnerSafe(pool, partner) {
  if (partner) return pool;
  const safe = pool.filter(l => !l.includes('{b}'));
  return safe.length ? safe : pool;
}

const REACTION_LINES = {
  mourn: [
    '{a} didn\'t hide how hard it hit them. {b} sat with them and let it be quiet for a while.',
    '{a} said {v}\'s name out loud like it needed saying, and {b} agreed.',
  ],
  suspicious: [
    '{a} skipped past the grief entirely and went straight to "who benefits from this?" {b} didn\'t have a good answer.',
    '{a} was already building a theory before breakfast was over, and said as much to {b}.',
  ],
  stoic: [
    '{a} said almost nothing all morning. {b} noticed, and let them have it.',
    '{a} went quiet in a way that read as more, not less.',
  ],
  opportunistic: [
    '{a} used the room\'s grief to steer {b} toward exactly where {a} wanted the suspicion to land — smoothly enough that {b} never felt managed.',
    '{a} tried to use the moment to move {b} where they wanted, and it came out clumsy enough that {b} half-noticed something was off.',
  ],
};

registerEvent({
  id: 'grief-morning-reaction',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 3 : 0;
  },
  fire(ctx, rng) {
    const reactor = ctx.actors[0];
    const partner = ctx.actors[1] || null;
    const victim = _victimLastNight(ctx.ep);
    const st = pStats(reactor);
    const archetype = players.find(p => p.name === reactor)?.archetype || 'floater';
    const isTraitor = alignmentAt(reactor, ctx.ep) === 'traitor';

    const mournScore = (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.5
      + (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer'].includes(archetype) ? 0.3 : 0);
    const suspiciousScore = (st.strategic / 10) * 0.5 + (st.intuition / 10) * 0.5
      + (['perceptive-player', 'mastermind', 'schemer'].includes(archetype) ? 0.3 : 0);
    const stoicScore = (1 - st.social / 10) * 0.6 + 0.15;
    // Permission gate FIRST, competence second — role overrides archetype.
    // A living Traitor can always attempt this branch; the score below only
    // decides how likely they are to REACH for it, not whether they may.
    const opportunisticScore = isTraitor
      ? (st.strategic / 10) * 0.5 + (st.boldness / 10) * 0.5 + 0.2
      : 0;

    const total = mournScore + suspiciousScore + stoicScore + opportunisticScore;
    const roll = rng() * total;
    let branch;
    if (roll < mournScore) branch = 'mourn';
    else if (roll < mournScore + suspiciousScore) branch = 'suspicious';
    else if (roll < mournScore + suspiciousScore + stoicScore) branch = 'stoic';
    else branch = 'opportunistic';

    // See the note on _partnerSafe in cover.js — the old strip left sentences
    // ending on their own verb whenever `{b}` sat mid-clause, and every one of
    // those was quotable by a later citation.
    let line = pick(rng, _partnerSafe(REACTION_LINES[branch], partner))
      .replace(/\{a\}/g, reactor).replace(/\{v\}/g, victim)
      .replace(/\{b\}/g, partner || 'somebody');

    // Every branch has to leave SOMETHING — a solo scene (no partner drawn)
    // still writes residue on the reactor even when it can't move a bond,
    // which is what stops "stoic" (and a solo "mourn"/"opportunistic")
    // from being a no-op event that only reads as content.
    const parties = partner ? [reactor, partner] : [reactor];
    let bondDelta = 0;
    if (branch === 'mourn' && partner) {
      bondDelta = 2;
    } else if (branch === 'opportunistic' && partner) {
      // The "visibly bad at it" case (a nice archetype dragged into the
      // Traitor role) still gets the branch — the role gate already granted
      // it — but the archetype-driven competence gap is reflected in the
      // line pool above (the second line is the clumsy version) and in a
      // smaller net bond gain than a competent user of this same branch
      // would get, which is the mechanical trace of "visibly bad at it."
      const niceButTraitor = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']
        .includes(archetype);
      bondDelta = niceButTraitor ? 0 : 1;
    }
    // 'suspicious' and 'stoic' write no bond delta on purpose — a theory
    // being floated, or a withdrawal, is not itself a change in how two
    // people feel about each other. Both still open the thread below.
    if (bondDelta) addBond(reactor, partner, bondDelta);
    const threadId = openThread(FAMILY, parties, ctx.ep, line)?.id;

    return { branch, reactor, partner, victim, isTraitor, archetype, threadId, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

registerEvent({
  id: 'grief-keepsake',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const actor = ctx.actors[0];
    const v = _victimLastNight(ctx.ep);
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} quietly kept something small of ${v}'s — nobody asked, and ${actor} didn't offer an explanation.`);
    return { branch: 'keepsake', actor, victim: v, threadId: t?.id };
  },
});

registerEvent({
  id: 'grief-blame-the-room',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, -0.5);
    const v = _victimLastNight(ctx.ep);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} said out loud that somebody in this castle let ${v} die. ${b} didn't disagree.`);
    return { branch: 'blamed-room', pair: [a, b], victim: v, threadId: t?.id, bondDelta: -0.5 };
  },
});

registerEvent({
  id: 'grief-toast-to-them',
  family: FAMILY,
  window: 'evening',
  rare: true,
  // ADVANCES AND CITES (Plan 5 Task 2). The only event in `grief|evening`,
  // and a toast that names the day the castle lost somebody is exactly what a
  // toast is for.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    // Reachable, uncommon state: the castle has lost more than one person —
    // by the second death, a ritual like this has grounds to exist.
    const deaths = (gs.tr?.rounds || []).filter(r => r.murdered).length;
    return deaths >= 2 ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      `${a} and ${b} raised a glass, quietly, to everyone the castle had already lost.`);
    return { branch: 'toasted', pair: [a, b], threadId: thread?.id, cited, bondDelta: 2 };
  },
});

registerEvent({
  id: 'grief-numb-to-it-now',
  family: FAMILY,
  window: 'dawn',
  acts: { late: 2 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const deaths = (gs.tr?.rounds || []).filter(r => r.murdered).length;
    return deaths >= 2 && _victimLastNight(ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} told ${b} the empty chair barely registered anymore, and hated how true that was.`);
    // No bond move — the point of this one IS the absence of a felt reaction.
    return { branch: 'numb', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 0 };
  },
});

registerEvent({
  id: 'grief-someone-cries-alone',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 1) return 0;
    if (!_victimLastNight(ctx.ep)) return 0;
    // SPEC 5.3, EMOTIONAL STATE. The person who goes off on their own to fall
    // apart is overwhelmingly the person the room was voting for last night.
    // ctx.state is READ-ONLY here: a frozen view of the round record.
    return isNervy(ctx.state?.[ctx.actors[0]]) ? 2.5 : 1;
  },
  fire(ctx) {
    const actor = ctx.actors[0];
    const state = ctx.state?.[actor];
    const why = state === 'desperate'
      ? ` It was not really about the empty chair; ${actor} had watched the room write their own name down and was still counting.`
      : state === 'paranoid'
        ? ` Somebody had said ${actor}'s name at that table, and it had not stopped ringing since.`
        : '';
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} found somewhere nobody could see them and let it out, alone, before breakfast.${why}`);
    return { branch: 'cried-alone', actor, threadId: t?.id, state: state || 'content' };
  },
});

// ROUND 1 FIX: this event originally gated on `alignmentAt(v, ep - 1) ===
// 'traitor'` — the murder victim having secretly been a Traitor. That
// precondition is IMPOSSIBLE under the current engine: murder.js's target
// pool is `livingFaithfuls(ep).filter(...)` (js/tr/murder.js, the line
// choosing who the conclave can even consider) — the Traitors never
// murder one of their own, so `_victimLastNight` can never resolve to a
// Traitor. Zero firings across a 60-season dead-event sweep confirmed it
// (not a rare state; an unreachable one — the exact distinction the brief
// draws). Rare-state amplification cannot rescue a precondition that never
// clears, so the fix is a different, REACHABLE irony rather than a
// loosened gate on the same impossible one: the room mourning someone who
// spent their last days under a suspicion — from suspicion.js's own
// threads — that never led anywhere and now never will. Murder victims are
// always Faithfuls, and Faithfuls collect suspicion threads constantly, so
// this fires routinely instead of never.
registerEvent({
  id: 'grief-wrongly-suspected-irony',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const v = _victimLastNight(ctx.ep);
    if (!v) return 0;
    const threads = gs.tr?.threads || [];
    return threads.some(t => t.kind === 'suspicion' && t.parties.includes(v)) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const v = _victimLastNight(ctx.ep);
    addBond(a, b, 1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} and ${b} realized, too late, that ${v} had spent their last days under a suspicion that never actually went anywhere.`);
    return { branch: 'wrongly-suspected-irony', pair: [a, b], victim: v, threadId: t?.id, bondDelta: 1 };
  },
});
