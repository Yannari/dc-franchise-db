// ══════════════════════════════════════════════════════════════════════
// tr/castle/callback.js — two people with real history, and a franchise
// that remembers it whether or not this task does
// ══════════════════════════════════════════════════════════════════════
//
// THE FAMILY NOTHING ELSE IN THIS FRANCHISE CAN DO. Every other family
// invents a relationship from scratch, inside this one season. This family
// reads one that already existed, from `js/franchise-meta.js`'s ledger —
// `activeSeasons()` — free of charge, because the ledger already stores
// exactly the shape this needs: `deriveSeasonRecord()` (franchise-meta.js)
// writes `rec.players[name] = { allies, rivals, betrayed, betrayedBy,
// showmances, winner, finalist, placement, ... }` for every name that ever
// played a season, and two people standing in this castle may well have
// both been in one.
//
// A grudge from three seasons ago walking into a castle is free, unique to
// this simulator, and — this is the point the brief calls out — frequently
// WRONG. An old ally is not evidence of current loyalty; an old betrayer is
// not evidence of a current Traitor. Nothing here writes a belief for
// exactly that reason: a callback is a relationship fact, not an alignment
// claim, and CLAUDE.md's own governing rule (bonds/threads/residue free,
// beliefs earned through gateChannel()) applies to old history exactly as
// hard as it applies to new.
//
// THIS FAMILY IS DEAD IN A DEBUT SEASON, ON PURPOSE — DOCUMENTED HERE SO
// NOBODY MISTAKES A GREEN AUDIT FOR "IT WORKS SEASON ONE" (round 1 review
// finding). Every event below reads `activeSeasons()` and returns weight 0
// with an empty or brand-new ledger — verified directly: emptying the
// ledger while leaving the other six families untouched drops `callback`'s
// firings to exactly 0 while trust/suspicion/grief/cover/romance/testing
// are unaffected. That is the correct design (a callback that fired
// without real history would be exactly the fabricated-evidence failure
// this family exists to avoid), but it means all 11 events here — ~13% of
// the whole castle pool — are structurally inert the first time this
// franchise ever runs a Traitors season. `tests/tr-castle-audit.test.js`'s
// dead-event sweep only shows this family alive because it fabricates a
// prior season on purpose (see that file's `seedFranchiseHistory()`) — a
// green audit run there proves these events CAN fire given real history,
// not that they will in a debut season. No fallback is implemented; if a
// debut-season callback beat is ever wanted, it would need its own
// precondition entirely (e.g. reading THIS season's early bonds/threads
// instead of the ledger), not a loosening of what this family checks now.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { openThread, advanceThread, closeThread, findOpenThread, continueThread } from '../threads.js';
import { activeSeasons } from '../../franchise-meta.js';

import { lineFor } from './lines.js';

const FAMILY = 'callback';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/**
 * Every past season both `a` and `b` appear in together, oldest first, with
 * the relationship `a`'s own record says they had with `b`. Reads ONLY the
 * ledger's derived shape (see the header) — never re-derives anything.
 */
function sharedHistory(a, b) {
  const seasons = activeSeasons();
  const out = [];
  for (const [key, rec] of Object.entries(seasons || {})) {
    const pa = rec?.players?.[a];
    const pb = rec?.players?.[b];
    if (!pa || !pb) continue;
    let relation = 'costars';
    if ((pa.allies || []).includes(b)) relation = 'allies';
    else if ((pa.betrayed || []).includes(b)) relation = 'betrayed-them';
    else if ((pa.betrayedBy || []).includes(b)) relation = 'betrayed-by-them';
    else if ((pa.showmances || []).some(sh => sh.partner === b)) relation = 'showmance';
    else if ((pa.rivals || []).includes(b)) relation = 'rivals';
    out.push({ seasonKey: key, seasonName: rec.seasonName || key, relation,
      bothFinalists: !!pa.finalist && !!pb.finalist });
  }
  return out;
}

/**
 * Shared seasons where something actually HAPPENED between the two - not the
 * mere fact of having been cast together.
 *
 * `sharedHistory` reports `costars` for any pair who were in one season, which
 * on a returnee cast is every pair alive. Any event whose sentence claims two
 * people have (or lack) HISTORY in the ordinary sense has to filter that out,
 * or it is asserting something true of the entire room. See F2 on
 * `callback-no-history-envy`.
 */
const STORY_RELATIONS = new Set(['allies', 'betrayed-them', 'betrayed-by-them', 'showmance', 'rivals']);
function storyWith(a, b) {
  return sharedHistory(a, b).filter(h => STORY_RELATIONS.has(h.relation));
}

/** The single strongest signal across every shared season, positive or negative. */
function strongestRelation(history) {
  const priority = ['betrayed-by-them', 'betrayed-them', 'rivals', 'showmance', 'allies', 'costars'];
  for (const rel of priority) {
    const hit = history.find(h => h.relation === rel);
    if (hit) return hit;
  }
  return history[0] || null;
}

const RECOGNIZED_LINES = [
  '{a} and {b} clocked each other from a previous season before either one said a word about it.',
  '{a} knew exactly who {b} was the moment they walked in, and said nothing, and so did {b}.',
  'Neither {a} nor {b} needed an introduction, and both of them sat through one anyway.',
  'It took {a} half a second to place {b}, and about the same for {b} to notice being placed.',
  '{a} and {b} shook hands like strangers in front of a room that had no idea.',
  'There was a look between {a} and {b} at the door that was several seasons long.',
  '{a} said "hello" to {b} in a tone that had a whole season folded into it.',
  '{b} clocked {a} across the hall and went back to their conversation a beat too smoothly.',
];

registerEvent({
  id: 'callback-recognized',
  family: FAMILY,
  window: 'dawn',
  // ACT: OPENING (spec 5.4.3, 'early: broad, social, thread-opening').
  // Clocking somebody from a previous season happens before either of them has
  // said a word in THIS one. By the back half everybody has been re-met.
  acts: { early: 1.6, late: 0.5 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread(FAMILY, [a, b])) return 0;
    return sharedHistory(a, b).length ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const strongest = strongestRelation(sharedHistory(a, b));
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(RECOGNIZED_LINES, `callback-recognized|${ctx.ep}|${strongest?.relation || 'none'}`, { a, b }));
    return { branch: 'recognized', pair: [a, b], relation: strongest?.relation, threadId: t?.id };
  },
});

const REFORM_LINES = [
  '{a} and {b} picked their old alliance back up like no time had passed at all.',
  'It took {a} and {b} about a minute to be exactly what they had been last time.',
  '{a} and {b} did not renegotiate anything. The old terms simply resumed.',
  'Whatever {a} and {b} built last time was apparently still standing, and they moved back into it.',
  '{b} said "same as before?" and {a} said "same as before," and that was a whole alliance done.',
];

registerEvent({
  id: 'callback-old-alliance-reforms',
  family: FAMILY,
  window: 'evening',
  rare: true,
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'allies') ? 2.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(REFORM_LINES, `callback-old-alliance-reforms|${ctx.ep}`, { a, b });
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'alliance-reformed', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

const GRUDGE_LINES = [
  '{a} still hadn\'t forgiven what {b} did to them, seasons ago, and made sure {b} knew it.',
  '{a} brought up something {b} had assumed everybody had forgotten, and nobody had.',
  'It had been years. {a} produced it in full detail, in front of people, anyway.',
  '{b} apologised for it once, apparently, and {a} has apparently never accepted it.',
  '{a} does not talk about {b} very much, and every time {a} does it is about the same night.',
];

registerEvent({
  id: 'callback-grudge-resurfaces',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'betrayed-by-them') ? 2.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, -2);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(GRUDGE_LINES, `callback-grudge-resurfaces|${ctx.ep}`, { a, b }));
    return { branch: 'grudge-resurfaced', pair: [a, b], threadId: t?.id, bondDelta: -2 };
  },
});

const REUNION_LINES = [
  '{a} and {b} found out the old feelings hadn\'t actually gone anywhere.',
  'Whatever {a} and {b} had ended, apparently, only on paper.',
  '{a} and {b} were fine, and adult, and completely over it, for about two days.',
  'It turns out {a} and {b} still have all their old shorthand, and it still works.',
  '{b} laughed at something the way they used to, and {a} was in trouble again immediately.',
];

registerEvent({
  id: 'callback-showmance-reunion-spark',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // 2 -> 3.5 (whole-plan review, finding 5): a prior showmance is the
    // rarest relation in a real ledger, so this competes for the fewest pairs
    // of anything in the family and needed the base weight to say so.
    return sharedHistory(a, b).some(h => h.relation === 'showmance') ? 3.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(REUNION_LINES, `callback-showmance-reunion-spark|${ctx.ep}`, { a, b }));
    return { branch: 'reunion-spark', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

const RIVALRY_LINES = [
  'Whatever it was between {a} and {b} last time, it clearly hadn\'t cooled off.',
  '{a} and {b} were competing about something before either of them noticed they had started.',
  'Everything between {a} and {b} is still a scoreboard, and both of them can read it.',
  '{a} disagreed with {b} on a point neither of them cared about, purely out of habit.',
  'Put {a} and {b} in a room and the temperature does the same thing it always did.',
];

registerEvent({
  id: 'callback-competitive-history',
  family: FAMILY,
  window: 'after-table',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'rivals') ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, -1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(RIVALRY_LINES, `callback-competitive-history|${ctx.ep}`, { a, b }));
    return { branch: 'rivalry-carried-over', pair: [a, b], threadId: t?.id, bondDelta: -1 };
  },
});

const DEFEND_HISTORY_LINES = [
  '{a} shut down the suspicion around {b} with the one thing nobody else in the room could offer: they\'d already vouched for each other once before.',
  '"I have played a whole season with {b}," said {a}, and the room had no answer to that.',
  '{a} produced a reason to trust {b} that predated everybody else in the castle.',
  'Nobody else in the room had ever seen {b} under pressure. {a} had, and said so, and it landed.',
  '{a} did not defend {b}\'s answer. {a} defended {b}, out of a history the room could not argue with.',
];

registerEvent({
  id: 'callback-protects-old-ally-from-vote',
  family: FAMILY,
  window: 'evening',
  rare: true,
  // ROUND 2 FIX: originally required the suspicion thread to name `b`
  // specifically (the second of the two scene-drawn actors) — stacking
  // three independent rare conditions (this exact history pair, drawn
  // together, AND a suspicion thread on the specific one of them the
  // sampler happened to put second) measured ZERO firings across 1000 real
  // seasons even with `rare: true`'s 2x amplification. The relation itself
  // doesn't care which of the two is under suspicion — an ally defends
  // whichever one of them the room is circling — so this now checks BOTH
  // and defends whichever one actually has a thread, which is the same
  // real-world condition without an arbitrary ordering requirement baked
  // into the check.
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (!sharedHistory(a, b).some(h => h.relation === 'allies')) return 0;
    const threads = gs.tr?.threads || [];
    return threads.some(t => t.state === 'open' && t.kind === 'suspicion' && (t.parties.includes(a) || t.parties.includes(b))) ? 3 : 0;
  },
  fire(ctx) {
    const [x, y] = ctx.actors;
    const threads = gs.tr?.threads || [];
    const susp = threads.find(t => t.state === 'open' && t.kind === 'suspicion' && (t.parties.includes(x) || t.parties.includes(y)));
    const defended = susp.parties.includes(x) ? x : y;
    const defender = defended === x ? y : x;
    addBond(defender, defended, 2);
    closeThread(susp.id, ctx.ep, 'defended-by-history');
    const t = openThread(FAMILY, [defender, defended], ctx.ep,
      lineFor(DEFEND_HISTORY_LINES, `callback-protects-old-ally-from-vote|${ctx.ep}`,
        { a: defender, b: defended }));
    return { branch: 'defended-by-history', pair: [defender, defended], threadId: t?.id,
      bondDelta: 2, crowd: { name: defender, colour: 'selfless', mult: 0.75 } };
  },
});

const WARN_LINES = [
  '{a} pulled {c} aside and told them exactly what {b} was capable of, from experience.',
  '{a} gave {c} the short version of what {b} did last time, and {c} went very quiet.',
  '"Whatever {b} tells you," {a} said to {c}, "remember I said this first."',
  '{a} does not warn people about many players. {a} warned {c} about {b} before breakfast.',
  '{c} had no reason to distrust {b} until {a} spent ten minutes supplying several.',
];

registerEvent({
  id: 'callback-warns-newbies',
  family: FAMILY,
  window: 'morning',
  // ACT: OPENING, hard. A warning is only useful before the person warned has
  // formed their own read — 'I'm telling you now' is the whole speech, and it
  // is not a speech anybody makes at final five.
  acts: { early: 2, late: 0.4 },
  rare: true,
  // ADVANCES AND CITES (Plan 5 Task 2). `callback|morning` held no advancer.
  // A returnee warning the room about somebody is the family's own thesis
  // said twice, and the second time it lands harder for naming the first.
    citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'betrayed-by-them') ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const c = pick(rng, others.length ? others : [a]);
    addBond(a, c, 0.5);
    addBond(a, b, -1);
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep,
      lineFor(WARN_LINES, `callback-warns-newbies|${ctx.ep}`, { a, b, c }));
    return { branch: 'warned', actor: a, about: b, warned: c, threadId: thread?.id, cited, bondDelta: -1 };
  },
});

const DIFFERENT_PERSON_LINES = {
  redemption: [
    '{a} admitted {b} was playing a completely different game than the one {a} remembered — and it was throwing them.',
    '{a} came in ready to dislike {b} and has spent a week failing to.',
    'Whoever {b} was last time, {a} has had to concede this is not that person.',
    '{a} keeps waiting for the old {b} to show up, and is starting to think they will not.',
    '{b} has done two things this week that the {b} in {a}\'s head would never have done.',
    '{a} has caught themselves enjoying {b}\'s company, which was not the plan at all.',
  ],
  disappointment: [
    '{a} expected {b} to be exactly who they were last time. This {b} was a stranger wearing the name.',
    '{a} had been looking forward to seeing {b} again, and got somebody colder than they remembered.',
    'The {b} that {a} liked seems to have stayed at home this season.',
    '{a} tried the old shorthand on {b} twice, and it did not work either time.',
    '{b} has been perfectly polite to {a} all week, and {a} would prefer almost anything else.',
    'Whatever {a} remembered liking about {b} has not turned up yet.',
    // THREE ADDED AFTER READING A DUMP: this pool produced the worst
    // within-season repeat in 3200 seasons (four printings of "had been
    // looking forward to seeing"). `lineFor` consumes no rng, so widening the
    // pool is path-neutral - verified bit-identical on the 400-season firing
    // table - and a wider pool is the only lever that does not move anything
    // else.
    '{a} keeps starting sentences to {b} that only made sense last season, and stopping halfway.',
    'There is a version of {b} that {a} came here to see, and it did not travel.',
    '{a} gave it a week before admitting to themselves that {b} had changed.',
  ],
  dissonance: [
    '{a} kept comparing this version of {b} to the one they remembered, out loud, to {b}\'s visible annoyance.',
    '{a} has said "you never used to" to {b} three times today, and {b} has counted all three.',
    '{b} would quite like to be judged on this season, and {a} keeps producing the last one.',
    '{a} narrated the old {b} at the new {b} until {b} stopped answering.',
    '{a} keeps introducing {b} by something {b} did four years ago.',
    'Every conversation {a} has with {b} has a third person in it, and it is the old {b}.',
  ],
};

registerEvent({
  id: 'callback-different-show-different-person',
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
  // Its `redemption` branch measured 3 takes per 400 seasons at head against
  // 14 at base - the single worst per-branch casualty of the redistribution.
  window: 'journey-out',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).length ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const strongest = strongestRelation(sharedHistory(a, b));
    const negative = strongest && ['betrayed-by-them', 'betrayed-them', 'rivals'].includes(strongest.relation);
    const currentBond = getBond(a, b);
    let bondDelta = 0;
    let branch;
    if (negative && currentBond >= 2) { bondDelta = 1; branch = 'redemption'; }
    else if (!negative && currentBond <= 0) { bondDelta = -0.5; branch = 'disappointment'; }
    else branch = 'dissonance';
    const note = lineFor(DIFFERENT_PERSON_LINES[branch],
      `callback-different-show-different-person|${ctx.ep}|${branch}`, { a, b });
    if (bondDelta) addBond(a, b, bondDelta);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});

// LINES REWRITTEN TO MATCH THE PREDICATE, NOT THE OTHER WAY ROUND (whole-plan
// review, F2). These used to claim {a} "had no part of" the SEASONS being
// talked about, and on this franchise's returnee casts that is false for
// nearly everybody: a cast where twenty people played the same two prior
// seasons has no strangers in it. What it does have is people who were IN the
// season and not in the STORY - who never allied, never fell out, never
// betrayed anybody - and that is what the gate below now checks and what these
// sentences now say. Season 42 used to run "no part of them" in episode 1 and
// "finally said out loud what happened between them and Beth" in episode 2,
// contradicting itself inside one thread; there is nothing left to contradict.
const ENVY_LINES = [
  '{a} sat outside a conversation about who did what to whom, and had done none of it to anybody.',
  '{b} and two others spent twenty minutes on a falling-out {a} had only ever heard about.',
  '{a} laughed in the right places at a story {a} was not in, and went to bed early.',
  'Everybody at that table had done something to somebody at that table, except {a}.',
  '{a} was in that season too, and nobody telling it needed to mention {a} once.',
  '{a} asked one question about it, got a kind answer, and did not ask a second.',
];

registerEvent({
  id: 'callback-no-history-envy',
  family: FAMILY,
  window: 'morning',
  // ACT: OPENING. Sitting outside a conversation full of seasons you had no
  // part of is a first-days sting; nine episodes in, this room has its own
  // history and the franchise one has stopped being the only currency.
  acts: { early: 1.6, late: 0.5 },
  // The second advancer in `callback|morning`.
    citesResidue: true,
  // THE PRECONDITION NOW ENCODES ITS OWN SENTENCE (whole-plan review, F2).
  // It used to check ONLY that the insider shares history with somebody, and
  // nothing whatsoever about the outsider - so on the returnee casts this
  // family is built for, where everybody co-starred with everybody, the line
  // was false on all 157 firings per 200 seasons.
  //
  // `sharedHistory` returns `costars` for any two people who were in the same
  // season, which is why "did they share a season" cannot be the test. The
  // test is whether they share a STORY: an alliance, a rivalry, a betrayal, a
  // showmance. The outsider must have none of that with the insider, and there
  // must be a third person the insider DOES have it with and the outsider does
  // not. That is a conversation about something that happened, held in front
  // of somebody it did not happen to.
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [outsider, insider] = ctx.actors;
    if (storyWith(outsider, insider).length) return 0;
    const others = ctx.living.filter(n => n !== outsider && n !== insider);
    return others.some(n => storyWith(insider, n).length && !storyWith(outsider, n).length) ? 1 : 0;
  },
  fire(ctx) {
    const [outsider, insider] = ctx.actors;
    addBond(outsider, insider, -0.5);
    const { thread, cited } = continueThread(FAMILY, [outsider, insider], ctx.ep,
      lineFor(ENVY_LINES, `callback-no-history-envy|${ctx.ep}`, { a: outsider, b: insider }));
    return { branch: 'left-out', pair: [outsider, insider], threadId: thread?.id, cited, bondDelta: -0.5 };
  },
});

const ALUMNI_LINES = [
  '{a} and {b} had already gone the distance together once. That kind of thing doesn\'t just evaporate.',
  '{a} and {b} have both sat in the last chairs of a season, and neither had to explain to the other what that costs.',
  'Everybody else here is guessing what the end feels like. {a} and {b} are not.',
  '{a} and {b} were the last two standing once, and something of that walked in with them.',
  'There was an ease between {a} and {b} that comes from having survived the same finish together.',
];

registerEvent({
  id: 'callback-shared-alumni-status',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.bothFinalists) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 3);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      lineFor(ALUMNI_LINES, `callback-shared-alumni-status|${ctx.ep}`, { a, b }));
    return { branch: 'alumni-bond', pair: [a, b], threadId: t?.id, bondDelta: 3 };
  },
});

// ── FLAGSHIP: the history confrontation — a four-way fork on what the
// PRESENT-DAY actor decides to do with a past that may point the wrong way
// entirely ─────────────────────────────────────────────────────────────
//
// The check reads the confronting actor's OWN stats (loyalty, strategic,
// temperament, boldness), scored against the POLARITY of their shared
// history — a positive history (ally/showmance) and a negative one
// (betrayed-by-them/rivals) feed different branches at different rates,
// which is what makes this a check on the person and their history
// together, not a bare stat roll relabelled four ways.
//   RECONCILES        — high loyalty, positive-leaning history. Old
//                        wounds or old bonds get explicitly settled;
//                        strong bond gain.
//   RENEWED-GRUDGE     — low loyalty + negative history. The old betrayal
//                        gets re-litigated, out loud, and it costs both of
//                        them; real bond damage, thread stays hot.
//   USES-IT-STRATEGICALLY — high strategic + high boldness, REGARDLESS of
//                        polarity: treats the shared history as leverage
//                        rather than emotion either way. Opens a
//                        `cover`-adjacent-but-neutral thread noting the
//                        history is now a known card in play; small bond
//                        move because the other party clocks being used.
//   BURIES-IT          — high temperament, low boldness: consciously
//                        decides not to relitigate any of it. Closes
//                        whatever callback thread exists between them —
//                        a real resolution, not a non-event, because a
//                        deliberate choice to let it go IS the state
//                        change.
const CONFRONTATION_LINES = {
  reconciles: [
    '{a} finally said out loud what happened between them and {b}, and meant it when they said it was fine now.',
    '{a} and {b} actually talked it through, properly, for the first time since it happened.',
    '{b} apologised, badly, and {a} accepted it anyway, and both of them looked lighter afterwards.',
    'It took {a} and {b} an hour and a half and it should have taken them a season and a half.',
  ],
  grudge: [
    '{a} brought the whole thing back up, unprompted, and it went about as well as last time.',
    'It turned into the exact fight {a} and {b} had already had once before.',
    '{a} wanted an apology and {b} wanted it dropped, which is where they were last time too.',
    '{a} listed it out in order, {b} disputed the order, and nothing at all was resolved.',
  ],
  strategic: [
    '{a} made it very clear, calmly, that the history between them was a card {a} could play whenever they wanted.',
    '{a} treated the whole thing like leverage, and {b} clocked exactly what was happening.',
    '{a} did not threaten {b} with any of it. {a} simply mentioned that they remembered it well.',
    '"People here don\'t know that story yet," {a} said to {b}, pleasantly, and left it hanging.',
  ],
  buries: [
    '{a} decided, out loud, that whatever happened before stays in the season it happened in.',
    '{a} told {b} they weren\'t interested in relitigating any of it, and left it there.',
    '{a} waved the whole history off in one sentence and genuinely never raised it again.',
    '"Different game, different castle," {a} said to {b}, and started talking about something else.',
  ],
};

registerEvent({
  id: 'callback-history-confrontation',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).length ? 3 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const strongest = strongestRelation(sharedHistory(a, b));
    const positive = strongest && ['allies', 'showmance', 'costars'].includes(strongest.relation);
    const negative = strongest && ['betrayed-by-them', 'betrayed-them', 'rivals'].includes(strongest.relation);

    const reconcileScore = (st.loyalty / 10) * 0.5 + (positive ? 0.3 : 0.1);
    const grudgeScore = (1 - st.loyalty / 10) * 0.4 + (negative ? 0.4 : 0.05);
    const strategicScore = (st.strategic / 10) * 0.4 + (st.boldness / 10) * 0.3;
    const buriesScore = (st.temperament / 10) * 0.4 + (1 - st.boldness / 10) * 0.2 + 0.1;
    const total = reconcileScore + grudgeScore + strategicScore + buriesScore;
    const roll = rng() * total;
    let branch;
    if (roll < reconcileScore) branch = 'reconciles';
    else if (roll < reconcileScore + grudgeScore) branch = 'grudge';
    else if (roll < reconcileScore + grudgeScore + strategicScore) branch = 'strategic';
    else branch = 'buries';

    const line = pick(rng, CONFRONTATION_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const existing = findOpenThread(FAMILY, [a, b]);
    let bondDelta = 0;
    let threadId = existing?.id ?? null;
    if (branch === 'reconciles') {
      bondDelta = 3;
      addBond(a, b, bondDelta);
      const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
      threadId = t?.id ?? threadId;
    } else if (branch === 'grudge') {
      bondDelta = -3;
      addBond(a, b, bondDelta);
      const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
      threadId = t?.id ?? threadId;
    } else if (branch === 'strategic') {
      bondDelta = -1;
      addBond(a, b, bondDelta);
      const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
      threadId = t?.id ?? threadId;
    } else {
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        advanceThread(existing.id, ctx.ep, line);
        closeThread(existing.id, ctx.ep, 'buried');
      } else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    }
    return { branch, pair: [a, b], relation: strongest?.relation, threadId, bondDelta };
  },
});
