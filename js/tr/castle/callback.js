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
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue } from './effects.js';
import { findOpenThread, heatAt } from '../threads.js';
// A PURE READ of what somebody already believes — the same import
// js/tr/castle/suspicion.js holds, and it writes nothing.
import { suspicion } from '../deduction.js';
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
// EXPORTED for js/tr/castle/mission-fallout.js, which needs the same
// "have these two got a story, or were they merely cast together" filter and
// must not carry a second copy of it — a duplicate would drift from this one
// the first time a relation is added to the ledger's derived shape.
const STORY_RELATIONS = new Set(['allies', 'betrayed-them', 'betrayed-by-them', 'showmance', 'rivals']);
export function storyWith(a, b) {
  return sharedHistory(a, b).filter(h => STORY_RELATIONS.has(h.relation));
}

/** The single strongest signal across every shared season, positive or negative. */
export function strongestRelation(history) {
  const priority = ['betrayed-by-them', 'betrayed-them', 'rivals', 'showmance', 'allies', 'costars'];
  for (const rel of priority) {
    const hit = history.find(h => h.relation === rel);
    if (hit) return hit;
  }
  return history[0] || null;
}

// ── REWRITE (Task 7 stage 5). `callback-recognized:recognized` was on the
// audit's REWRITE list and seventh on stage 4's blame table. One branch, one
// pool, on the most-fired event in the callback family.
//
// THE RECORD ALREADY DECIDES THE SCENE AND THE OLD VERSION ONLY LET IT
// DECIDE THE HASH KEY. `strongestRelation(sharedHistory(a, b))` returns what
// the franchise ledger says these two were to each other — allies, rivals, a
// showmance, one of them put the other out — and two people who won a season
// together do not clock each other across a hall the same way two people who
// ended one badly do. So the ledger chooses the branch SET (the stage-4 rule:
// the record picks the set, the stats pick within it) and nothing invents an
// incident the ledger does not carry.
//
//   WARM LEDGER (allies / showmance / costars):
//     picked-it-back-up      — they let it show, and it costs them nothing yet.
//     left-it-at-the-door    — they agree, silently, to be strangers here.
//   COLD LEDGER (rivals / a betrayal in either direction):
//     still-owed             — the recognition is a debt, and both of them know
//                              which way round it runs.
//     left-it-at-the-door    — reachable from both, because pretending not to
//                              know somebody is the one move available to
//                              anybody who has history of any temperature.
//   EITHER, ONCE THE ROOM IS INVOLVED:
//     said-it-to-the-room    — one of them tells the castle they have played
//                              together, which makes it everybody's fact.
const RECOGNIZED_LINES = {
  'picked-it-back-up': [
    '{a} and {b} clocked each other from a season they both played and neither of them bothered pretending otherwise.',
    '{a} knew exactly who {b} was the moment they walked in, and said so, and {b} laughed.',
    'It took {a} half a second to place {b}, and about the same for {b} to be pleased about it.',
    'There was a look between {a} and {b} at the door that was several seasons long, and a good several.',
    '{a} and {b} were talking like people who had done this before within about four minutes, because they had.',
    '{b} said {a}\'s name the way you say the name of somebody you have shared a bad night with.',
    '{a} got to {b} before anybody else in the castle did, and {b} had been counting on that.',
    '{a} and {b} did not have to build anything this morning. It was already there and both of them used it.',
  ],
  'left-it-at-the-door': [
    '{a} and {b} shook hands like strangers in front of a room that had no idea.',
    'Neither {a} nor {b} needed an introduction, and both of them sat through one anyway.',
    '{b} clocked {a} across the hall and went back to their conversation a beat too smoothly.',
    '{a} said "hello" to {b} in a tone with nothing at all folded into it, which took work.',
    '{a} and {b} agreed without a word that the castle did not need to be told what they were to each other.',
    'Somebody asked whether {a} and {b} had met. Both of them said not really, at the same time.',
    '{a} and {b} spent the whole of breakfast being carefully unfamiliar with one another.',
    'It would have cost them nothing to say it. They did not say it, and both of them noticed the other not saying it.',
  ],
  'still-owed': [
    '{a} recognised {b} across the hall and went very still, and it was not a happy stillness.',
    '{b} knew what {a} was before {a} opened their mouth, and had known since the coach.',
    '{a} and {b} had unfinished business from a season nobody else in this castle watched, and it walked in with them.',
    'There is a way of saying somebody\'s name that is not a greeting. {a} used it on {b}.',
    '{b} smiled at {a} and did not mean any part of it, and {a} understood the whole message.',
    '{a} looked at {b} for slightly too long, and {b} let them.',
    'Whatever {a} and {b} had settled last time, it turned out not to be settled.',
    '{a} said nothing to {b} at all this morning, which was louder than anything {a} could have said.',
  ],
  'said-it-to-the-room': [
    '{a} told the whole table they had played a season with {b}, and watched the room do the arithmetic.',
    '"We\'ve done this before, {b} and me," {a} said, to everybody, and {b} had not been consulted.',
    '{a} put the history on the table at breakfast rather than let somebody else find it later.',
    '{b} would have preferred it kept quiet. {a} said it out loud on the first morning instead.',
    '{a} announced the connection cheerfully and completely, and made it everybody\'s problem including their own.',
    'It came out over the toast: {a} and {b}, a whole season, and the room went briefly very interested.',
    '{a} decided the castle was going to find out anyway and chose the hour it found out in.',
    '{a} named the season out loud. {b} confirmed it, because there was nothing else to do with it.',
  ],
};

const _WARM_RELATIONS = new Set(['allies', 'showmance', 'costars']);

registerEvent({
  id: 'callback-recognized',
  family: FAMILY,
  window: 'dawn',
  // ACT: OPENING (spec 5.4.3, 'early: broad, social, thread-opening').
  // Clocking somebody from a previous season happens before either of them has
  // said a word in THIS one. By the back half everybody has been re-met.
  acts: { early: 1.6, late: 0.5 },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    relationship: ['close-ally', 'rival', 'prior-history', 'romance'],
    voice: ['boldness', 'social', 'temperament'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread(FAMILY, [a, b])) return 0;
    return sharedHistory(a, b).length ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-recognized');
    const [a, b] = ctx.actors;
    const strongest = strongestRelation(sharedHistory(a, b));
    const relation = strongest?.relation || 'costars';
    const warm = _WARM_RELATIONS.has(relation);
    const st = pStats(a);
    // THE LEDGER PICKS THE SET. `still-owed` is unreachable off a warm record
    // and `picked-it-back-up` is unreachable off a cold one — neither person
    // can be owed something the ledger does not say happened, and neither can
    // pick up an alliance that was a rivalry.
    const scores = {
      'picked-it-back-up': warm ? (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.3 : 0,
      'still-owed': warm ? 0 : (st.temperament / 10) * 0.2 + 0.5,
      'left-it-at-the-door': (1 - st.boldness / 10) * 0.5 + (st.strategic / 10) * 0.3,
      'said-it-to-the-room': (st.boldness / 10) * 0.45 + (st.social / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'still-owed' ? 'recognised somebody they had unfinished business with'
      : branch === 'left-it-at-the-door' ? 'agreed to pretend they had never met'
        : branch === 'said-it-to-the-room' ? 'told the room they had played a season together'
          : 'recognised each other from a season they both played';
    const bondDelta = branch === 'picked-it-back-up' ? 2
      : branch === 'still-owed' ? -1.5
        : branch === 'left-it-at-the-door' ? 0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy,
      seed: lineFor(RECOGNIZED_LINES[branch], `callback-recognized|${branch}|${ctx.ep}|${relation}`, { a, b }) });
    const out = { branch, topic: b, topicKind: 'callback-history', pair: [a, b], speaker: a, respondent: b,
      relation: strongest?.relation, threadId: t?.id, bondDelta };
    // NO CROWD MOMENT ON `said-it-to-the-room`, deliberately. The obvious
    // colour is `masterful`, and `masterful` is reserved in js/tr/crowd.js
    // for "a Traitor doing precisely what a Traitor is there to do" — a
    // Faithful reaches this branch just as often, and paying the same ledger
    // for both would make that colour's own ledger mean two different things.
    // The consequence this scene has is the arc and the bond.
    return out;
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`alliance-reformed`) —
// the fork is in the wording." It also made the ledger deterministic, which is
// the defect stage 4 named when it rewrote `callback-competitive-history`: a
// recorded alliance produced a recorded alliance, every time, in a family whose
// whole thesis is that an old relationship may not survive contact with a new
// game. The record the fork reads is the ledger entry itself — how the shared
// season ENDED for each of them, off `sharedHistory` — and the two of them's
// loyalty and strategic. The alumni rule holds: the claim stays exactly what
// the ledger supports, and only the interpretation moves.
const REFORM_LINES = {
  'alliance-reformed': [
    '{a} and {b} picked their old alliance back up like no time had passed at all.',
    'It took {a} and {b} about a minute to be exactly what they had been last time.',
    '{a} and {b} did not renegotiate anything. The old terms simply resumed.',
    'Whatever {a} and {b} built last time was apparently still standing, and they moved back into it.',
    '{b} said “same as before?” and {a} said “same as before,” and that was a whole alliance done.',
    'Two people who have done this before did not have to do any of the early parts of it.',
    'The shorthand came back before the trust did, and then the trust came back too.',
    'Everybody else in this castle is on day one with each other. {a} and {b} are not.',
  ],
  'renegotiated-it': [
    '{a} and {b} rebuilt it from the beginning, on new terms, because the old ones had a hole in them.',
    '“Last time you went to the end and I did not,” {b} said. “So no, not the same as before.”',
    'It took an hour and it is a better alliance than the one they had, and both of them know why.',
    '{a} would not simply resume. {a} wanted the parts that failed named first, and {b} named them.',
    'They kept about half of it and threw out the rest, which is more than most people manage.',
    'The old deal is dead. Something with the same two people in it is not.',
    '{b} put a condition on it that would not have been necessary if last time had gone differently.',
    '{a} and {b} spent the evening being honest about a season they had both misremembered.',
  ],
  'not-the-same-terms': [
    '{a} wanted it back exactly as it was. {b} did not, and said so, kindly, twice.',
    '“I am not doing what I did last time,” said {b}, and {a} had no way to argue with that.',
    'One of them offered the old alliance and the other one accepted a much smaller version.',
    '{a} came out of it with an ally. {a} had gone in expecting a partner.',
    '{b} was warm about all of it and committed to none of it.',
    'The history is real and {b} is not going to be governed by it, and {a} heard that.',
    'What resumed was the friendliness. The rest of it {b} left where it was.',
    '{a} spent the rest of the evening working out when {b} had decided that.',
  ],
  'somebody-noticed': [
    '{a} and {b} resumed an old alliance in a corner, and {c} watched the whole of it from the doorway.',
    'It took ninety seconds and {c} saw every one of them.',
    'Two returnees rebuilding a bloc is the most legible thing in this castle, and {c} read it.',
    '{c} did not need to hear a word to know what had just happened between {a} and {b}.',
    'The old alliance came back and acquired a witness in the same evening.',
    '{c} said nothing about it to anybody, which is worse than saying something.',
    'By morning {c} had told one person, and that person is very good at arithmetic.',
    '{a} and {b} were careful. They were not careful about {c}.',
  ],
};

registerEvent({
  id: 'callback-old-alliance-reforms',
  family: FAMILY,
  window: 'evening',
  rare: true,
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['loyalty', 'strategic', 'boldness'],
    relationship: ['close-ally'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'allies') ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-old-alliance-reforms');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // THE LEDGER ENTRY, READ RATHER THAN SUMMARISED. Whether either of them
    // actually got to the end of that season is stored on the shared record,
    // and it is the difference between "same as before" and "not that again".
    const hist = sharedHistory(a, b).filter(h => h.relation === 'allies');
    const endedWell = hist.some(h => h.bothFinalists);
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = others.length ? others[Math.floor(rng() * others.length)] : null;
    const scores = {
      'alliance-reformed': 0.35 + (endedWell ? 0.3 : 0) + (sb.loyalty / 10) * 0.15,
      'renegotiated-it': (sb.strategic / 10) * 0.3 + (endedWell ? 0 : 0.2),
      'not-the-same-terms': (1 - sb.loyalty / 10) * 0.3 + (endedWell ? 0 : 0.15),
      'somebody-noticed': c ? 0.2 + Math.max(0, 10 - others.length) * 0.02 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'alliance-reformed';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'renegotiated-it' ? 'rebuilt an old alliance on new terms'
      : branch === 'not-the-same-terms' ? 'would not resume an old alliance as it was'
        : branch === 'somebody-noticed' ? 'rebuilt a bloc in front of a witness'
          : 'picked an old alliance back up';
    const note = lineFor(REFORM_LINES[branch], `callback-old-alliance-reforms|${branch}|${ctx.ep}`,
      { a, b, c: c || b });
    const bondDelta = branch === 'alliance-reformed' ? 2
      : branch === 'renegotiated-it' ? 2.5
        : branch === 'not-the-same-terms' ? 0.5 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'somebody-noticed' && c) api.addBond(a, c, -0.5, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, topic: b, topicKind: 'callback-history', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`grudge-resurfaced`) —
// the fork is in the wording." Same determinism the whole family had: a
// recorded betrayal produced a recorded grudge, always. The record the fork
// reads is the ledger entry and {a}'s own temperament and loyalty — what a
// person does with an old wound in a new game is the scene, and there are four
// things they do with it.
const GRUDGE_LINES = {
  'grudge-resurfaced': [
    '{a} still hadn’t forgiven what {b} did to them, seasons ago, and made sure {b} knew it.',
    '{a} brought up something {b} had assumed everybody had forgotten, and nobody had.',
    'It had been years. {a} produced it in full detail, in front of people, anyway.',
    '{b} apologised for it once, apparently, and {a} has apparently never accepted it.',
    '{a} does not talk about {b} very much, and every time {a} does it is about the same night.',
    'The first evening in this castle and {a} was already back on a night from another one.',
    '{a} has been carrying it for two seasons and has not put it down for this one.',
    '“You know what you did,” said {a}, in a room where nobody else did.',
  ],
  'said-it-once-and-stopped': [
    '{a} said the thing, once, quietly, and then never mentioned it again all evening.',
    'It got named. It did not get relitigated, and {b} was more unsettled by that than by a row.',
    '{a} let {b} know the account was still open and declined to read out the balance.',
    '“I have not forgotten,” said {a}, and then asked {b} about the mission, pleasantly.',
    'One sentence, no volume, and it did more than twenty minutes of shouting would have.',
    '{a} has learned that the threat of a story is worth more than the story.',
    '{b} spent the rest of the night waiting for the rest of it. There was no rest of it.',
    '{a} put it on the table, face down, and left it there.',
  ],
  'wants-something-for-it': [
    '{a} did not want an apology from {b}. {a} wanted a vote, and named the night.',
    'The grudge turned out to be negotiable, and the price was specific.',
    '“We can be square,” said {a}, “and here is what square costs.”',
    '{a} converted an old betrayal into a present-day arrangement inside four minutes.',
    'It stopped being about last time about halfway through and became about Thursday.',
    '{b} would rather have had the argument, and said so, and paid anyway.',
    '{a} has been waiting two seasons to have something {b} needs, and now has it.',
    'What {a} produced was not a grievance. It was an invoice.',
  ],
  'let-it-go-at-last': [
    '{a} looked at {b} across a castle and decided, finally, that it was a very long time ago.',
    '“I am not doing this again,” {a} said, mostly to {a}, and meant it about the grudge.',
    'It came up and {a} put it back down, and {b} did not know what to do with that.',
    '{a} has been angry about it since a different show and stopped being angry about it tonight.',
    '{b} braced for it and got a genuinely warm conversation instead.',
    '{a} decided that carrying it into this castle would cost {a} more than it would cost {b}.',
    'The account got closed, quietly, by the person who had been keeping it.',
    '{a} said the old thing out loud in order to be finished with it, and was.',
  ],
};

registerEvent({
  id: 'callback-grudge-resurfaces',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['backfire', 'ambiguous', 'accepted'],
    voice: ['temperament', 'loyalty', 'strategic'],
    relationship: ['rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'betrayed-by-them') ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-grudge-resurfaces');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    // HOW MANY SEASONS AGO, off the ledger. An old wound and a recent one are
    // not the same wound, and the record knows which this is.
    const hist = sharedHistory(a, b).filter(h => h.relation === 'betrayed-by-them');
    const seasons = hist.length;
    const scores = {
      'grudge-resurfaced': 0.35 + (1 - sa.temperament / 10) * 0.25,
      'said-it-once-and-stopped': (sa.temperament / 10) * 0.3 + (sa.strategic / 10) * 0.15,
      'wants-something-for-it': (sa.strategic / 10) * 0.35 + (1 - sa.loyalty / 10) * 0.15,
      'let-it-go-at-last': (sa.loyalty / 10) * 0.2 + Math.min(3, seasons) * 0.08,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'grudge-resurfaced';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'said-it-once-and-stopped' ? 'named an old debt and declined to read the balance'
      : branch === 'wants-something-for-it' ? 'converted an old betrayal into a present-day price'
        : branch === 'let-it-go-at-last' ? 'closed an account they had been keeping for two seasons'
          : 'an old grudge came back up';
    const note = lineFor(GRUDGE_LINES[branch], `callback-grudge-resurfaces|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'grudge-resurfaced' ? -2
      : branch === 'said-it-once-and-stopped' ? -1
        : branch === 'wants-something-for-it' ? -0.5 : 2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // TERMINAL: a grudge the holder puts down is a story that ended, and
    // `buried` is what it ended as.
    if (t && branch === 'let-it-go-at-last') api.resolveArc(t.id, 'buried', { source: sceneWhy });
    return { branch, topic: b, topicKind: 'callback-history', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`reunion-spark`)."
// An old showmance walking into a new castle is the rarest relation in the
// ledger and it had one outcome, which is that it always restarted. The record
// the fork reads is the ledger entry — how that season ended for the pair —
// and both temperaments and loyalties, and the fork is that two people can
// perfectly well decide, out loud, that they are not doing this again.
const REUNION_LINES = {
  'reunion-spark': [
    '{a} and {b} found out the old feelings hadn’t actually gone anywhere.',
    'Whatever {a} and {b} had ended, apparently, only on paper.',
    '{a} and {b} were fine, and adult, and completely over it, for about two days.',
    'It turns out {a} and {b} still have all their old shorthand, and it still works.',
    '{b} laughed at something the way they used to, and {a} was in trouble again immediately.',
    'They got about four hours into a castle before it was obvious to everybody but them.',
    '{a} has been over {b} for two seasons and was over being over {b} by Tuesday lunchtime.',
    'Neither of them said anything about it. Everybody in that hall could see it anyway.',
  ],
  'agreed-not-to': [
    '“Not here,” said {b}, before {a} had asked, and {a} was relieved and was not.',
    '{a} and {b} sat down and agreed, like adults, that this was not going to happen again.',
    'They had the conversation on the first night and got it out of the way properly.',
    '“It cost us both a season,” {b} said. “I am not spending another one on it.”',
    '{a} and {b} decided to be friends, out loud, with a handshake, which fooled neither of them.',
    'It was settled before the first Round Table, which is more than most things here.',
    'Both of them wanted it and both of them said no, and that is a stronger thing than either.',
    'The old feelings turned up on schedule and got shown the door on schedule too.',
  ],
  'one-of-them-still-is': [
    '{b} is over it. {a} has been in this castle for four days pretending to be.',
    'It was mutual once. It is currently mutual in one direction only, and {a} knows which.',
    '{b} was warm and easy about all of it, which is exactly the problem.',
    '{a} would take it back tomorrow. {b} has genuinely moved on and did not have to say so.',
    'One of them keeps finding reasons to be in the same room. It is not {b}.',
    '{a} said something old and {b} laughed at it as a joke rather than as a memory.',
    'The shorthand still works and {b} is using it on everybody, which {a} has noticed.',
    '{a} has done the arithmetic four times and got the same answer each time.',
  ],
  'the-room-got-there-first': [
    'Two people did nothing at all and the castle had them back together by lunchtime.',
    '{c} worked it out inside an hour and told two people, and neither of them checked.',
    '{a} and {b} have been extremely careful and the room does not require evidence.',
    'It is the first thing anybody said about either of them, and it is not currently true.',
    '{c} decided about {a} and {b} out loud, and a decision said out loud in here is a fact about somebody by lunch.',
    'Being an old couple in here is a vote pattern before it is anything else, and the room said so.',
    '{c} asked {b} outright, at breakfast, in front of everyone, and got a very careful answer.',
    'Nothing has happened. Everybody in the building is treating it as though something has.',
  ],
};

registerEvent({
  id: 'callback-showmance-reunion-spark',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'loyalty', 'social'],
    relationship: ['close-ally'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // 2 -> 3.5 (whole-plan review, finding 5): a prior showmance is the
    // rarest relation in a real ledger, so this competes for the fewest pairs
    // of anything in the family and needed the base weight to say so.
    return sharedHistory(a, b).some(h => h.relation === 'showmance') ? 3.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-showmance-reunion-spark');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = others.length ? others[Math.floor(rng() * others.length)] : null;
    const scores = {
      'reunion-spark': 0.35 + (sa.boldness / 10) * 0.2,
      'agreed-not-to': (sb.temperament / 10) * 0.3 + (sa.temperament / 10) * 0.15,
      'one-of-them-still-is': (1 - sb.loyalty / 10) * 0.25 + (sa.loyalty / 10) * 0.2,
      'the-room-got-there-first': c ? 0.25 + Math.max(0, 12 - others.length) * 0.02 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'reunion-spark';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'agreed-not-to' ? 'agreed out loud not to do it again'
      : branch === 'one-of-them-still-is' ? 'was over it in one direction only'
        : branch === 'the-room-got-there-first' ? 'was put back together by a room with no evidence'
          : 'an old romance flickered again';
    const note = lineFor(REUNION_LINES[branch], `callback-showmance-reunion-spark|${branch}|${ctx.ep}`,
      { a, b, c: c || b });
    const bondDelta = branch === 'reunion-spark' ? 2
      : branch === 'agreed-not-to' ? 1
        : branch === 'one-of-them-still-is' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // TERMINAL: two people settling it on the first night is a story that
    // closed on the first night, and both of them meant it to.
    if (t && branch === 'agreed-not-to') api.resolveArc(t.id, 'buried', { source: sceneWhy });
    return { branch, topic: b, topicKind: 'callback-history', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});
// -- TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ------------
//
// One branch (`rivalry-carried-over`), and it made the ledger deterministic: a
// recorded rivalry produced a recorded rivalry, every time, in a castle where
// the whole interest of an old relationship is that it may not survive
// contact with a new game. Four branches now, and the two that matter most are
// the ones where the ledger loses -- the rivalry is put down on purpose, or it
// is USED, which is a rivalry becoming an asset rather than a feeling.
//
// The alumni rule holds in all four: the claim stays exactly what the ledger
// supports (these two were rivals) and only the interpretation moves.
const RIVALRY_LINES = {
  'rivalry-carried-over': [
    'Whatever it was between {a} and {b} last time, it clearly hadn\'t cooled off.',
    '{a} and {b} were competing about something before either of them noticed they had started.',
    'Everything between {a} and {b} is still a scoreboard, and both of them can read it.',
    '{a} disagreed with {b} on a point neither of them cared about, purely out of habit.',
    'Put {a} and {b} in a room and the temperature does the same thing it always did.',
  ],
  'called-a-truce': [
    '\u201cWe were rivals on a beach,\u201d {b} said to {a}. \u201cThis is not a beach.\u201d {a} agreed, and both of them meant it.',
    '{a} and {b} agreed to leave the old season where it was, out loud, in a corridor, at some length.',
    '{b} put it down first, which surprised {a}, and then {a} put it down too.',
    'Two people who spent a whole season needling each other decided, tonight, that it was expensive.',
    '{a} said the thing {a} should have said seasons ago, and {b} took it better than {a} deserved.',
  ],
  'reopened-it': [
    'It was not a general chill. {a} raised the specific thing, by name, and {b} remembered it exactly.',
    '{a} and {b} got into the old argument again, in full, with the same two positions and less patience.',
    'Whatever the two of them had left unfinished last time, {a} finished it in a stone corridor at midnight.',
    '{b} had thought this was over. {a} had not, and said so, and the evening went where it went.',
    'The old grievance came out whole, on both sides, and neither of them had improved at it.',
  ],
  'useful-rivalry': [
    '{a} pointed out to {b} that the room already believes they hate each other, and that is worth something.',
    '\u201cNobody will ever put us together,\u201d {b} said to {a}. \u201cSo let\u2019s not be put together.\u201d',
    'Two old rivals worked out, quite fast, that being old rivals is the best available disguise.',
    '{a} and {b} agreed to keep performing it, which is a stranger kind of alliance than the ordinary sort.',
    '{b} suggested they keep the rivalry running. {a} had been about to suggest the same thing.',
  ],
};

registerEvent({
  id: 'callback-competitive-history',
  family: FAMILY,
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'strategic', 'loyalty', 'boldness'],
    relationship: ['prior-history', 'rival'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'rivals') ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-competitive-history');
    const sceneWhy = 'carried a rivalry over from a previous season';
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'rivalry-carried-over': (1 - sa.temperament / 10) * 0.4 + 0.25,
      'called-a-truce': (sa.temperament / 10) * 0.35 + (sb.loyalty / 10) * 0.3,
      'reopened-it': (1 - sa.temperament / 10) * 0.35 + (sa.boldness / 10) * 0.3,
      'useful-rivalry': (sa.strategic / 10) * 0.35 + (sb.strategic / 10) * 0.35,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'rivalry-carried-over';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'rivalry-carried-over' ? -1
      : branch === 'called-a-truce' ? 2.5 : branch === 'reopened-it' ? -2.5 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy,
        seed: lineFor(RIVALRY_LINES[branch], `callback-competitive-history|${branch}|${ctx.ep}`, { a, b }) });
    return { branch, topic: b, topicKind: 'callback-history', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`defended-by-history`)
// — the fork is in the wording." It also resolved the suspicion arc every
// single time, which is a very strong claim for one sentence to make: an old
// season is a reason to trust somebody and it is not proof, and a room is
// perfectly entitled to say so. The record the fork reads is the arc being
// defended against — how hot it is, off `heatAt`, which is stored — and the
// defender's own social and boldness. Only the branch that actually lands
// closes the arc now.
const DEFEND_HISTORY_LINES = {
  'defended-by-history': [
    '{a} shut down the suspicion around {b} with the one thing nobody else in the room could offer: they’d already vouched for each other once before.',
    '“I have played a whole season with {b},” said {a}, and the room had no answer to that.',
    '{a} produced a reason to trust {b} that predated everybody else in the castle.',
    'Nobody else in the room had ever seen {b} under pressure. {a} had, and said so, and it landed.',
    '{a} did not defend {b}’s answer. {a} defended {b}, out of a history the room could not argue with.',
    '{a} described one night from another season, in detail, and it did all the work.',
    'The room wanted evidence. {a} had something better, which was a witness with a memory.',
    'It took {a} about a minute and the name came off the table for the night.',
  ],
  'history-is-not-evidence': [
    '“That was a different show,” somebody said to {a}, and the room agreed, and {b} was still on the table.',
    '{a} vouched for {b} out of a whole season, and the room pointed out that seasons end differently.',
    'The defence was the best available and it was not good enough, and {a} knew it halfway through.',
    '“People change,” said somebody, which is unanswerable and is also how {b} stays on the table.',
    '{a} produced a history. The room produced this week, and this week won.',
    'Nobody thought {a} was lying. Several people thought {a} was out of date.',
    'It is the only card {a} had and the room had already seen it.',
    'The room let {a} finish, politely, and then went back to exactly where it had been.',
  ],
  'now-they-are-a-pair': [
    '{a} defended {b} so completely that the castle stopped counting them as two people.',
    'The name came off the table and a different, worse name went on it, which was “both of them”.',
    '{a} spent everything on {b} and the room noticed the size of the payment.',
    '“You two,” said somebody, and that was the whole of the room’s new position.',
    'It worked, and it cost {a} the thing {a} had been keeping, which was being unattached.',
    '{a} won the argument and joined {b} on the table in the same sentence.',
    'A returnee vouching for a returnee is a bloc, whatever else it is, and the castle can count.',
    'By the end of the evening {a} and {b} were one item on everybody’s list.',
  ],
  'would-not-spend-it': [
    '{a} could have said the thing about the old season. {a} listened to the whole evening and did not.',
    '{b} looked at {a} once, waiting. {a} looked at the fire.',
    'It would have taken one sentence and {a} decided the sentence was too expensive tonight.',
    '{a} has one card and is not spending it on a Tuesday, and {b} will find that out later.',
    'Nobody in that room knows {a} and {b} played a season together, and {a} would like that to continue.',
    '{a} did not defend {b}. {a} also did not agree with any of it, and said nothing at all.',
    'The history stayed in {a}’s pocket, where it is worth more and does less.',
    '{a} will explain it to {b} tomorrow, and {b} will say it is fine.',
  ],
};

registerEvent({
  id: 'callback-protects-old-ally-from-vote',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'backfire', 'ambiguous'],
    voice: ['social', 'boldness', 'strategic'],
    relationship: ['close-ally'],
    knowledge: ['witnessed'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-protects-old-ally-from-vote');
    const [x, y] = ctx.actors;
    const threads = gs.tr?.threads || [];
    const susp = threads.find(t => t.state === 'open' && t.kind === 'suspicion' && (t.parties.includes(x) || t.parties.includes(y)));
    const defended = susp.parties.includes(x) ? x : y;
    const defender = defended === x ? y : x;
    const sd = pStats(defender);
    // HOW LIVE THE THING BEING DEFENDED AGAINST IS. Stored on the arc, and it
    // is the difference between taking a name off the table and joining it.
    const heat = heatAt(susp, ctx.ep);
    const scores = {
      'defended-by-history': 0.3 + (sd.social / 10) * 0.3 - heat * 0.15,
      'history-is-not-evidence': heat * 0.3 + (1 - sd.social / 10) * 0.2,
      'now-they-are-a-pair': (sd.boldness / 10) * 0.3 + heat * 0.15,
      'would-not-spend-it': (sd.strategic / 10) * 0.3 + (1 - sd.boldness / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'defended-by-history';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'history-is-not-evidence' ? 'produced a history and the room produced this week'
      : branch === 'now-they-are-a-pair' ? 'defended an old ally and joined them on the table'
        : branch === 'would-not-spend-it' ? 'kept an old season in their pocket'
          : 'vouched for an old ally under scrutiny';
    const bondDelta = branch === 'defended-by-history' ? 2
      : branch === 'now-they-are-a-pair' ? 1.5
        : branch === 'history-is-not-evidence' ? 1 : -1.5;
    api.addBond(defender, defended, bondDelta, { source: sceneWhy });
    // AND ONLY THE BRANCH THAT LANDS CLOSES IT. The old version resolved the
    // suspicion arc on every firing, which made an old season proof rather
    // than a reason; three of these four leave the room exactly where it was.
    if (branch === 'defended-by-history') {
      api.resolveArc(susp.id, 'defended-by-history', { source: sceneWhy });
    }
    const note = lineFor(DEFEND_HISTORY_LINES[branch],
      `callback-protects-old-ally-from-vote|${branch}|${ctx.ep}`, { a: defender, b: defended });
    const t = api.openArc(FAMILY, [defender, defended], { source: sceneWhy, seed: note });
    const out = { branch, topic: defended, topicKind: 'callback-history', pair: [defender, defended], speaker: defender, respondent: defended,
      threadId: t?.id, bondDelta };
    if (branch === 'defended-by-history' || branch === 'now-they-are-a-pair') {
      out.crowd = { name: defender, colour: 'selfless', mult: 0.75 };
    }
    return out;
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`warned`) — the fork is
// in the wording; no thread write, so no reachable follow-up and no terminal
// outcome." The thread write arrived in stage 2. The fork is here, and it is
// {c}'s: a warning is a thing you hand somebody, and the whole of what happens
// next belongs to the person you handed it to. The record it reads is what {c}
// already thinks of {b} — `suspicion(c, b, ep)`, stored — and {c}'s own
// intuition and loyalty.
const WARN_LINES = {
  warned: [
    '{a} pulled {c} aside and told them exactly what {b} was capable of, from experience.',
    '{a} gave {c} the short version of what {b} did last time, and {c} went very quiet.',
    '“Whatever {b} tells you,” {a} said to {c}, “remember I said this first.”',
    '{a} does not warn people about many players. {a} warned {c} about {b} before breakfast.',
    '{c} had no reason to distrust {b} until {a} spent ten minutes supplying several.',
    '{a} told it plainly, without decorating it, which is what made {c} believe all of it.',
    'It took four minutes and {c} will be looking at {b} differently for the rest of the season.',
    '{a} said one sentence about a night from another show and {c} has not stopped thinking about it.',
  ],
  'already-knew': [
    '{a} warned {c} about {b}, and {c} said “I know,” and {a} had not expected the “I know”.',
    '{c} had the whole story already, from somebody else, with different details in it.',
    '“You are the third person to tell me that,” said {c}, which told {a} something about the castle.',
    '{c} listened politely to news that was several days old to {c}.',
    '{a} arrived with a warning and found the warning already installed.',
    '{c} knew, and knew a version {a} did not recognise, and did not correct it.',
    'The reputation got here before {a} did, which is either useful or alarming.',
    '{c} thanked {a} for it and had clearly not needed any of it.',
  ],
  'defended-them-instead': [
    '{c} listened to all of it and then said {b} had been nothing but decent to {c} this week.',
    '“That is not the person I have met,” said {c}, and would not be moved off it.',
    '{a} warned {c} about {b} and {c} came away with a lower opinion of {a}.',
    '{c} pointed out that {a} was the only person in the castle with a grievance about {b}.',
    'The warning landed on somebody who has already decided about {b}, and it landed badly.',
    '{c} will be telling {b} about this conversation before lunch, and {a} does not know that.',
    '“Why are you telling me this,” asked {c}, which is a much better question than {a} had ready.',
    '{c} took nothing from it except a fact about how much {a} minds.',
  ],
  'used-it-immediately': [
    '{c} thanked {a} for the warning and had it at the table within the hour.',
    'What {a} gave {c} in confidence was public by lunchtime, with {a}’s name still on it.',
    '{c} took the whole story, and the source, and spent both.',
    '{a} handed {c} a weapon and did not think to say it was not for using today.',
    '{c} is new here and has just been given the only piece of history in the building.',
    'It went into the room fast and it went in bigger than {a} had told it.',
    '{a} said it once. {c} has now said it four times, in four rooms.',
    '{b} heard about it from a third person by the afternoon, which is how {b} knew {a} had said it.',
  ],
};

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
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['intuition', 'loyalty', 'social'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'betrayed-by-them') ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-warns-newbies');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const c = pick(rng, others.length ? others : [a]);
    const sc = pStats(c);
    // WHAT THE PERSON BEING WARNED ALREADY THINKS, looked up. A warning that
    // arrives at somebody who has already decided is a different scene from
    // one that arrives at somebody with no opinion at all.
    const theirRead = suspicion(c, b, ctx.ep);
    const theirBond = getBond(c, b);
    const scores = {
      warned: 0.35 + (sc.loyalty / 10) * 0.15,
      // A FLOOR, NOT ONLY A SLOPE. Keyed purely on `suspicion(c, b)` this
      // measured 9 firings in 4,200 seasons — the prose suite's guard-on-the-
      // guard reddened on it — because a stored read is uncommon and a
      // reputation travelling ahead of a warning is not. `theirRead` still
      // does the work when there IS one; the floor is the ordinary case of a
      // castle in which everybody has already been talking.
      'already-knew': 0.25 + Math.max(0, theirRead) * 0.25,
      'defended-them-instead': Math.max(0, theirBond) * 0.09 + (sc.loyalty / 10) * 0.15,
      'used-it-immediately': (sc.strategic / 10) * 0.3 + (1 - sc.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'warned';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'already-knew' ? 'arrived with a warning that was already installed'
      : branch === 'defended-them-instead' ? 'warned somebody who had already decided the other way'
        : branch === 'used-it-immediately' ? 'handed over a warning and watched it be spent'
          : 'warned a first-timer about somebody they had played with';
    const note = lineFor(WARN_LINES[branch], `callback-warns-newbies|${branch}|${ctx.ep}`, { a, b, c });
    const withC = branch === 'defended-them-instead' ? -1
      : branch === 'used-it-immediately' ? 0 : 0.5;
    if (withC) api.addBond(a, c, withC, { source: sceneWhy });
    api.addBond(a, b, -1, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, actor: a, pair: [a, c], speaker: a, respondent: c,
      about: b, warned: c, topic: b, topicKind: 'callback-warning',
      threadId: thread?.id, cited, bondDelta: -1 };
  },
});
// ── WIDENED AND REFORKED (Task 7 stage 6). A KEEP-list event and the top of
// the blame table after the callback batch, at 8 + 3 of 114 loud seasons
// between its two commonest branches. It is the highest-firing event in
// `journey-out` and it had three branches over six-line pools.
//
// FIVE BRANCHES AND TEN LINES EACH. The two added ones are the two positions
// this scene most obviously has and could not reach: {b} is entitled to notice
// being compared to a version of themselves, and either of them may simply
// have stopped caring what the other one used to be. The record is unchanged
// and is the one this event was always built on — `strongestRelation` over the
// franchise ledger, plus the stored present-day bond — with {b}'s temperament
// added, because how somebody takes being narrated at is a fact about them.
const DIFFERENT_PERSON_LINES = {
  redemption: [
    '{a} admitted {b} was playing a completely different game than the one {a} remembered — and it was throwing them.',
    '{a} came in ready to dislike {b} and has spent a week failing to.',
    'Whoever {b} was last time, {a} has had to concede this is not that person.',
    '{a} keeps waiting for the old {b} to show up, and is starting to think they will not.',
    '{b} has done two things this week that the {b} in {a}’s head would never have done.',
    '{a} has caught themselves enjoying {b}’s company, which was not the plan at all.',
    '{a} arrived with a whole file on {b} and has been quietly throwing pages of it away.',
    'The person {a} was warned about does not appear to be on this cast.',
    '{a} said so out loud, on the road, which is not a thing {a} had planned to say.',
    'Whatever happened to {b} between then and now, {a} would like to know what it was.',
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
    '{a} kept comparing this version of {b} to the one they remembered, out loud, to {b}’s visible annoyance.',
    '{a} has said “you never used to” to {b} three times today, and {b} has counted all three.',
    '{b} would quite like to be judged on this season, and {a} keeps producing the last one.',
    '{a} narrated the old {b} at the new {b} until {b} stopped answering.',
    '{a} keeps introducing {b} by something {b} did four years ago.',
    'Every conversation {a} has with {b} has a third person in it, and it is the old {b}.',
    '{a} corrected {b} about {b}’s own season, twice, on a hill, with people listening.',
    'It is not unkind. It is relentless, and {b} has run out of ways to change the subject.',
    '{a} remembers a great deal about a fortnight that {b} would rather not discuss at all.',
    'By the second mile {b} was answering in the past tense out of self-defence.',
  ],
  'asked-to-be-let-off': [
    '“I am not that person,” said {b}, on the road, and did not say it lightly.',
    '{b} asked {a}, straight out, to stop introducing {b} by a season {b} has left behind.',
    '“You keep telling people who I was,” said {b}. “I am walking right here.”',
    '{b} let {a} finish the story and then asked {a} not to tell it again.',
    'It came out much harder than {b} had meant it to and {b} did not take it back.',
    '{b} has been waiting three days to say it and picked a road with nobody else on it.',
    '“Whatever I did to you, I did four years ago,” said {b}, “and I have not done it since.”',
    '{a} had not realised any of it was landing. {b} explained, at some length, that all of it was.',
  ],
  'stopped-comparing': [
    'Somewhere on that road {a} stopped measuring {b} against a person who no longer exists.',
    '{a} let the old season go, quietly, without announcing it, and the walk got easier.',
    'It took a fortnight and two miles and {a} arrived at judging {b} on this week.',
    '{a} has been carrying a version of {b} since a different show and put it down on a hill.',
    'Neither of them mentioned the old season once, which had not happened before today.',
    '{a} decided the person walking beside {a} is the only one available and is probably the real one.',
    'They talked for an hour about nothing that had happened before this castle.',
    'It is a small thing to stop doing and {a} had been doing it since the first night.',
  ],
};

registerEvent({
  id: 'callback-different-show-different-person',
  family: FAMILY,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'loyalty', 'intuition'],
    relationship: ['close-ally', 'rival', 'neutral'],
    knowledge: ['witnessed'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-different-show-different-person');
    const [a, b] = ctx.actors;
    const strongest = strongestRelation(sharedHistory(a, b));
    const negative = strongest && ['betrayed-by-them', 'betrayed-them', 'rivals'].includes(strongest.relation);
    const currentBond = getBond(a, b);
    const sa = pStats(a);
    const sb = pStats(b);
    // THE LEDGER PICKS THE BRANCH SET AND THE PRESENT-DAY BOND NARROWS IT —
    // both stored, exactly as before. What is new is that {b} gets a say: the
    // last two branches are {b} declining to be narrated at, and {a} stopping.
    const scores = {
      redemption: negative && currentBond >= 2 ? 0.7 : 0,
      disappointment: !negative && currentBond <= 0 ? 0.7 : 0,
      dissonance: 0.4,
      'asked-to-be-let-off': (sb.boldness / 10) * 0.3 + (1 - sb.temperament / 10) * 0.2,
      'stopped-comparing': (sa.temperament / 10) * 0.25 + (sa.intuition / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'dissonance';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'asked-to-be-let-off' ? 'asked to be judged on this season'
      : branch === 'stopped-comparing' ? 'stopped measuring somebody against who they used to be'
        : 'compared who they had been on a different show';
    const note = lineFor(DIFFERENT_PERSON_LINES[branch],
      `callback-different-show-different-person|${ctx.ep}|${branch}`, { a, b });
    const bondDelta = branch === 'redemption' ? 1
      : branch === 'disappointment' ? -0.5
        : branch === 'asked-to-be-let-off' ? -1
          : branch === 'stopped-comparing' ? 1.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    const out = { branch, topic: b, topicKind: 'callback-history', pair: [a, b], threadId: t?.id, bondDelta };
    // {a} is the one doing the comparing on three of the five. On
    // `asked-to-be-let-off` the direction reverses, because {b} is the one
    // speaking and {a} is answering for a fortnight's worth of it.
    if (branch === 'asked-to-be-let-off') { out.speaker = b; out.respondent = a; }
    else { out.speaker = a; out.respondent = b; }
    return out;
  },
});
const ENVY_LINES = {
  'left-out': [
    '{a} sat outside a conversation about who did what to whom, and had done none of it to anybody.',
    '{b} and {c} spent twenty minutes on a falling-out {a} had only ever heard about.',
    '{a} laughed in the right places at a story {a} was not in, and went to bed early.',
    'Everybody at that table had done something to somebody at that table, except {a}.',
    '{a} was in that season too, and nobody telling it needed to mention {a} once.',
    '{a} asked one question about it, got a kind answer, and did not ask a second.',
    '{b} said “you had to be there,” to {a}, which was true and did not help.',
    'It is a very long story and {a} is not in any of it.',
  ],
  'asked-to-be-told': [
    '{a} made {b} tell the whole thing from the beginning, with names, and listened to all of it.',
    '“Start at the start,” said {a}, and {b} did, for about half an hour.',
    '{a} decided that not knowing was worse than asking, and asked, in front of two people.',
    'By the end of it {a} knew more about {b} and {c} than most of the people who had been there.',
    '{a} asked the question everybody else was too polite to ask and got a real answer.',
    'It cost {a} nothing to admit to not knowing, and it bought {a} an hour of {b}’s attention.',
    '{b} enjoyed telling it much more than {a} enjoyed hearing it, and both of them got something.',
    '{a} took notes, more or less, and {b} noticed the taking of them.',
  ],
  'made-a-virtue-of-it': [
    '“I have never played with any of you,” {a} said, “which makes me the only clean person here.”',
    '{a} pointed out, pleasantly, that everybody with a history has a reason to lie about it.',
    '{a} turned having no history into the only argument in the room nobody could answer.',
    '{b} had four seasons of reasons to be trusted. {a} had none of them and said that was the point.',
    '{a} is the only person here who owes nobody anything, and said so to {b} in a way that was meant to travel.',
    '“You lot have all done things to each other,” said {a}. “I have done nothing to anybody.”',
    'It is a much better position than it sounds, and {a} worked that out over breakfast.',
    '{a} stopped apologising for not being in the story about an hour ago.',
  ],
  'went-and-found-one': [
    '{a} could not join {b} and {c}’s story, so {a} spent the morning starting one with somebody else.',
    'By lunch {a} had a history in this castle that has nothing to do with any previous season.',
    '{a} left that conversation and went and made a different one, deliberately, with somebody outside it.',
    'If nobody will give you a past, said {a}, more or less, then get a present.',
    '{a} stopped trying to get into the old story and started building a new one, in the same room.',
    '{b} and {c} did not notice {a} leave, which is exactly what {a} had been counting on.',
    '{a} is going to have a story by Thursday and it is not going to include {b}.',
    'Everybody else is playing last season. {a} has decided to play this one.',
  ],
};

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
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'backfire'],
    voice: ['boldness', 'social', 'strategic'],
    relationship: ['neutral'],
    knowledge: ['incomplete'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-no-history-envy');
    const [outsider, insider] = ctx.actors;
    // THE THIRD PERSON THE STORY IS ACTUALLY ABOUT, off the ledger and off the
    // same predicate the weight used. Named in the prose rather than left as
    // "somebody", which is the consensus rule this family follows elsewhere.
    const others = ctx.living.filter(n => n !== outsider && n !== insider);
    const pool = others.filter(n => storyWith(insider, n).length && !storyWith(outsider, n).length);
    const c = pool.length ? pool[Math.floor(rng() * pool.length)] : (others[0] || insider);
    const so = pStats(outsider);
    const scores = {
      'left-out': 0.4 + (1 - so.boldness / 10) * 0.2,
      'asked-to-be-told': (so.social / 10) * 0.3 + (so.boldness / 10) * 0.15,
      'made-a-virtue-of-it': (so.strategic / 10) * 0.3 + (so.boldness / 10) * 0.2,
      'went-and-found-one': (so.social / 10) * 0.25 + (so.strategic / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'left-out';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'asked-to-be-told' ? 'made somebody tell the whole story from the beginning'
      : branch === 'made-a-virtue-of-it' ? 'turned having no history into an argument'
        : branch === 'went-and-found-one' ? 'went and started a story of their own instead'
          : 'was left out of a conversation about a season they never played';
    const note = lineFor(ENVY_LINES[branch], `callback-no-history-envy|${branch}|${ctx.ep}`,
      { a: outsider, b: insider, c });
    const bondDelta = branch === 'asked-to-be-told' ? 1
      : branch === 'made-a-virtue-of-it' ? -1
        : branch === 'went-and-found-one' ? -0.5 : -0.5;
    api.addBond(outsider, insider, bondDelta, { source: sceneWhy });
    if (branch === 'went-and-found-one' && c) api.addBond(outsider, c, 0.5, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [outsider, insider], ctx.ep, note,
      { source: sceneWhy });
    return { branch, pair: [outsider, insider], speaker: outsider, respondent: insider,
      about: c, topic: c, topicKind: 'callback-envy',
      threadId: thread?.id, cited, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). MERGE-verdict event ("two alumni clocking each
// other, told twice"), kept on the standing reasoning and forked on the thing
// `callback-recognized` cannot reach: these two did not merely play a season
// together, they both got to the END of one, and the ledger says so
// (`bothFinalists`). What two finalists have in common is a specific piece of
// knowledge about how this ends, and the fork is what they do with it.
const ALUMNI_LINES = {
  'alumni-bond': [
    '{a} and {b} had already gone the distance together once. That kind of thing doesn’t just evaporate.',
    '{a} and {b} have both sat in the last chairs of a season, and neither had to explain to the other what that costs.',
    'Everybody else here is guessing what the end feels like. {a} and {b} are not.',
    '{a} and {b} were the last two standing once, and something of that walked in with them.',
    'There was an ease between {a} and {b} that comes from having survived the same finish together.',
    'Two people who have been to the end of one of these recognised each other across a hall.',
    'It is not friendship exactly. It is the thing two people have after the same long week.',
    '{a} said about four words to {b} and {b} understood all of them.',
  ],
  'compared-endings': [
    '{a} and {b} spent an hour on how their season had actually finished, and disagreed about most of it.',
    'Two finalists, one ending, two completely different accounts of it.',
    '{b} remembered a conversation {a} would swear never happened, and neither of them is lying.',
    '{a} found out tonight what {b} had been doing on the last day, and had not known.',
    'They went over the end of it like two people reading different pages of the same book.',
    '{a} has told that story a hundred times. {b} has been in it and has never heard it that way.',
    'It was warm for about twenty minutes and then it was two people correcting each other.',
    'By the end of it {a} understood something about that season that {a} had had wrong for two years.',
  ],
  'both-know-how-it-ends': [
    '{a} and {b} agreed, without much ceremony, that one of them is going to have to do it to the other.',
    '“We both know how this goes,” said {b}, and {a} did not pretend otherwise.',
    'Two people who have been to the end know exactly what the end requires, and said so out loud.',
    'It is the most honest conversation in this castle and it is a scheduling discussion.',
    '{a} and {b} shook hands over the fact that the handshake expires.',
    '“Not yet,” said {a}. “Not yet,” agreed {b}. Both of them meant the “yet”.',
    'Nobody else in this hall has had this conversation because nobody else has needed to.',
    'They set a date, more or less, for stopping being on the same side.',
  ],
  'the-room-priced-them': [
    'Two finalists in one castle is a number, and by lunchtime the castle had worked out the number.',
    '{c} pointed out, quite loudly, that {a} and {b} had both been to a final before.',
    'The ease between them was visible from across the hall and read as an arrangement.',
    'It took the room one breakfast to decide that {a} and {b} were a problem.',
    'Nobody minds two people getting on. Everybody minds two people who have both done this before getting on.',
    '{a} and {b} did nothing except be comfortable, and the comfort was the evidence.',
    'By the evening the phrase going round was “the two who have been here before”.',
    '{c} counted their placements out loud, which is a thing you can do to returnees.',
  ],
};

registerEvent({
  id: 'callback-shared-alumni-status',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['strategic', 'social', 'temperament'],
    relationship: ['close-ally'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.bothFinalists) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'callback-shared-alumni-status');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = others.length ? others[Math.floor(rng() * others.length)] : null;
    const scores = {
      'alumni-bond': 0.35 + (sa.loyalty / 10) * 0.2,
      'compared-endings': (sa.social / 10) * 0.3 + (sb.social / 10) * 0.15,
      'both-know-how-it-ends': (sa.strategic / 10) * 0.3 + (sb.strategic / 10) * 0.2,
      'the-room-priced-them': c ? 0.2 + Math.max(0, 12 - others.length) * 0.02 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'alumni-bond';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'compared-endings' ? 'found they remembered the same ending differently'
      : branch === 'both-know-how-it-ends' ? 'agreed out loud that one of them will have to do it'
        : branch === 'the-room-priced-them' ? 'was counted by a room that can read a placement'
          : 'two returnees clocked each other';
    const note = lineFor(ALUMNI_LINES[branch], `callback-shared-alumni-status|${branch}|${ctx.ep}`,
      { a, b, c: c || b });
    const bondDelta = branch === 'alumni-bond' ? 3
      : branch === 'compared-endings' ? 1
        : branch === 'both-know-how-it-ends' ? 2 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'the-room-priced-them' && c) api.addBond(a, c, -0.5, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, topic: b, topicKind: 'callback-history', pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
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
    'Neither of them cried. Both of them very nearly did, which the other one noticed.',
    '{a} said the sentence {a} has been not-saying for two years and {b} took it well.',
    'They found out, an hour in, that they had been angry about two different things.',
    '{b} had assumed {a} would never raise it. {a} raised it on a staircase, at midnight.',
    'It is over. It has been over for about forty minutes and both of them keep checking.',
    'Whatever this castle does to them, that particular thing is finished.',
  ],
  grudge: [
    '{a} brought the whole thing back up, unprompted, and it went about as well as last time.',
    'It turned into the exact fight {a} and {b} had already had once before.',
    '{a} wanted an apology and {b} wanted it dropped, which is where they were last time too.',
    '{a} listed it out in order, {b} disputed the order, and nothing at all was resolved.',
    'They got about nine minutes in before it was the same argument with the same two sentences.',
    '{b} said “that is not what happened” four times and did not once say what had.',
    'Two people who have had this fight before had it again, faster and worse.',
    '{a} came out of it angrier than {a} went in, which had not been the plan.',
    'Somebody in the next room heard the whole of it, which neither of them realised.',
    'It ended the way it ended last time, which is that one of them left.',
  ],
  strategic: [
    '{a} made it very clear, calmly, that the history between them was a card {a} could play whenever they wanted.',
    '{a} treated the whole thing like leverage, and {b} clocked exactly what was happening.',
    '{a} did not threaten {b} with any of it. {a} simply mentioned that they remembered it well.',
    '"People here don\'t know that story yet," {a} said to {b}, pleasantly, and left it hanging.',
    '{a} did not ask for anything. {a} made sure {b} knew what could be asked for.',
    'It was raised, priced and shelved inside two minutes, and {b} understood all three steps.',
    '{a} mentioned a date. Just the date, nothing else, and watched {b} hear it.',
    '“I have never told anybody that,” said {a}, which is a promise and a threat at once.',
    '{b} asked what {a} wanted. {a} said nothing at all, which was the answer.',
    '{a} has been holding this since a different season and picked tonight to let {b} see it.',
  ],
  buries: [
    '{a} decided, out loud, that whatever happened before stays in the season it happened in.',
    '{a} told {b} they weren\'t interested in relitigating any of it, and left it there.',
    '{a} waved the whole history off in one sentence and genuinely never raised it again.',
    '"Different game, different castle," {a} said to {b}, and started talking about something else.',
    '{a} put it down without ceremony and did not pick it up again for the rest of the season.',
    '“That was then,” said {a}, and would not be drawn any further than that.',
    '{b} braced for the whole of it and got one sentence and a change of subject.',
    '{a} has decided the old season is not worth what carrying it costs, and said so once.',
    'It went in the ground quietly, at {a}’s choosing, and {b} was not asked to help dig.',
    '{a} said it was finished and then behaved for four days as though it were, which settled it.',
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
    const api = sceneApi(ctx, 'callback-history-confrontation');
    const sceneWhy = 'was confronted with what they did in a previous season';
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
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      const t = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
      threadId = t?.id ?? threadId;
    } else if (branch === 'grudge') {
      bondDelta = -3;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      const t = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
      threadId = t?.id ?? threadId;
    } else if (branch === 'strategic') {
      bondDelta = -1;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      const t = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
      threadId = t?.id ?? threadId;
    } else {
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'buried', { source: sceneWhy });
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    }
    return { branch, topic: b, topicKind: 'callback-history', pair: [a, b], relation: strongest?.relation, threadId, bondDelta };
  },
});
