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

import { lineFor, pronounSlots } from './lines.js';

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
    '{a} and {b} spot each other and grin.\n{b}: "You swore you’d never do another one."\n{a}: "So did you."',
    '{a} and {b} clock each other from a season they both played.\n{a}: "Well, well."\n{b}: "Don’t. I know."\n{a}: "Last time you told me you’d never do one of these again."',
    '{a} spots {b} across the hall and grins.\n{b}: "Here we go again."\n{a}: "Here we go again."',
    '{a} and {b} hug like old friends.\n{b} (to camera): "{a} and me go way back. Everyone’s about to find that out."',
  ],
  'left-it-at-the-door': [
    '{a} gives {b} a polite nod and nothing else.\n{a} (to camera): "We’ve played before. Nobody needs to know yet."',
    '{a} and {b} shake hands like strangers.\n{a}: "Nice to meet you."\n{b}: "Likewise."\n{b} (to camera): "We’ve met. Nobody needs to know that."',
    '{a} and {b} pretend they’ve never met.\n{a} (to camera): "We played together before. Not a word. Not yet."',
    '{a} gives {b} a tiny nod, and nothing more.\n{b} (to camera): "History’s a target. We’re keeping it quiet."',
  ],
  'still-owed': [
    '{a} sees {b} and the smile drops.\n{b}: "Hello again."\n{a}: "Hello."',
    '{a} recognises {b} across the hall and goes very still.\n{a} (to camera): "Of all the people. {b}. I haven’t forgotten."',
    '{a} sees {b} and the smile drops.\n{b}: "Hi, {a}."\n{a}: "{b}."',
    '{a} and {b} meet again, coldly.\n{a} (to camera): "{b} owes me. {b} knows it."',
  ],
  'said-it-to-the-room': [
    '{a} tells the whole table.\n{a}: "Me and {b} go back. Might as well know now."\n{b} (to camera): "Thanks for that."',
    '{a} tells the whole table about {b}.\n{a}: "Me and {b} have played together before. Better you hear it from me."\n{b} (to camera): "Thanks for that, {a}."',
    '{a} outs the history to the room.\n{a}: "I’d rather say it now than have it come out later."',
    '{a} announces the connection.\n{b}: "Well, that’s put a target on both of us."',
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
    '{a} and {b} shake hands in the library, like old times.\n{b}: "Same as before?"\n{a}: "Same as before."',
    '{a} and {b} pick their old alliance back up like no time has passed.\n{a}: "Same as before?"\n{b}: "Same as before."',
    '{a} and {b} shake on it again.\n{b} (to camera): "{a} and me worked last time. Why change it?"',
    '{a} and {b} slip straight back into it.\n{a}: "I’ve missed this."\n{b}: "Me too."',
  ],
  'renegotiated-it': [
    '{a} and {b} set new terms.\n{b}: "You left me hanging at the end last time."\n{a}: "Not this time. Promise."',
    '{a} and {b} rebuild it from the start, on new terms.\n{b}: "Last time, you let me down at the end."\n{a}: "So this time we write it down."\n{b}: "In our heads."',
    '{a} and {b} set new rules.\n{a} (to camera): "Old alliance, new rules. Learned my lesson."',
    '{a} and {b} renegotiate.\n{b}: "Different game. Different deal."',
  ],
  'not-the-same-terms': [
    '{b} turns the old deal down gently.\n{b}: "I’m playing my own game this time."\n{a}: "Right."',
    '{a} wants it back exactly as it was. {b} doesn’t.\n{b}: "I love you. But not like last time."\n{a}: "What does that mean?"\n{b}: "It means I’m playing my own game."',
    '{b} turns down the old deal.\n{a} (to camera): "{b} said no. Kindly. Twice."',
    '{b} wants something different.\n{b}: "Friends, yes. Alliance, not yet."',
  ],
  'somebody-noticed': [
    '{c} catches {a} and {b} whispering in the corridor.\n{c}: "Old friends, is it?"\n{a}: "Just catching up."',
    '{a} and {b} resume an old alliance in a corner, and {c} watches from the doorway.\n{c} (to camera): "Those two. I knew it."',
    '{c} catches {a} and {b} whispering.\n{c}: "Old friends, are we?"\n{a}: "Something like that."',
    '{a} and {b} get spotted.\n{c} (to camera): {cam:holding-info}',
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
    '{a} stops {b} at the door.\n{a}: "You haven’t apologised. Not once."\n{b}: "For a game?"',
    '{a} still hasn’t forgiven what {b} did, seasons ago, and makes sure {b} knows it.\n{a}: "You remember what you did."\n{b}: "That was years ago."\n{a}: "Not to me."',
    '{a} brings up the past.\n{a}: "You stabbed me in the back once. Not again."',
    '{a} holds the grudge tight.\n{a} (to camera): "{b} knows what {bSub} did. I’m not letting it go."',
  ],
  'said-it-once-and-stopped': [
    '{a} says it across the table, once.\n{a}: "I remember what you did."\nThen {aSub} passes the salt.',
    '{a} says it once, quietly, then never again all evening.\n{a}: "I haven’t forgotten."\n{b}: "I know."',
    '{a} lets {b} know, and leaves it there.\n{b} (to camera): "One sentence. That was enough."',
    '{a} mentions the past, briefly.\n{a} (to camera): "Said it. Done. Now we play."',
  ],
  'wants-something-for-it': [
    '{a} doesn’t want sorry.\n{a}: "Vote with me tonight and we’re even."\n{b}: "And if I don’t?"\n{a}: "Then we’re not."',
    '{a} doesn’t want an apology from {b}. {a} wants a vote.\n{a}: "You owe me. Tuesday, you vote with me."\n{b}: "And then we’re square?"\n{a}: "Then we’re square."',
    '{a} cashes in the grudge.\n{a} (to camera): "{b} owes me one. I’m collecting."',
    '{a} names the price.\n{b}: "That’s steep."\n{a}: "So was what you did."',
  ],
  'let-it-go-at-last': [
    '{a} holds out a hand to {b}.\n{a}: "Water under the bridge."\n{b}: "Really?"\n{a}: "Really."',
    '{a} looks at {b} and decides it was a very long time ago.\n{a}: "You know what? I’m done being angry."\n{b}: "Really?"\n{a}: "Really."',
    '{a} finally forgives {b}.\n{a} (to camera): "Holding onto it was only hurting me."',
    '{a} offers {b} a hand.\n{a}: "Fresh start."\n{b}: "I’d like that."',
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
    '{a} and {b} end up by the fire long after everyone else.\n{b}: "This is exactly how it started last time."\n{a}: "I know."',
    '{a} and {b} find the old feelings haven’t gone anywhere.\n{b}: "Still there, then."\n{a}: "Still there."',
    '{a} and {b} pick up where they left off.\n{a} (to camera): "I told myself I was over it. I was lying."',
    '{a} and {b} end up by the fire together.\n{b}: "This is a terrible idea."\n{a}: "The worst."',
  ],
  'agreed-not-to': [
    '{a} and {b} agree before anything can happen.\n{a}: "Not again. Not in here."\n{b}: "Agreed."',
    '{b} says it before {a} can.\n{b}: "Not here."\n{a}: "No. Not here."\n{a} (to camera): "Relieved. And not."',
    '{a} and {b} agree to keep it in the past.\n{b} (to camera): "It was lovely. It’s over. It has to be."',
    '{a} and {b} set a boundary.\n{a}: "Friends."\n{b}: "Just friends."',
  ],
  'one-of-them-still-is': [
    '{b} talks about someone else {bSub} likes, and {a} smiles through it.\n{a} (to camera): "Fine. I’m fine."',
    '{b} is over it. {a} has been pretending to be since day one.\n{b}: "It’s so nice that we’re just mates now."\n{a}: "Yeah. So nice."',
    '{a} still has feelings.\n{a} (to camera): "{b} moved on. I didn’t. Great."',
    '{a} watches {b} laugh with someone else.\n{a} (to camera): "It shouldn’t sting. It stings."',
  ],
  'the-room-got-there-first': [
    '{a} and {b} walk in separately, and the table still whistles.\n{b}: "We came in separately!"\n{a}: "Doesn’t matter, apparently."',
    '{a} and {b} do nothing at all, and the castle has them back together by lunch.\n{b}: "Apparently we’re back together."\n{a}: "News to me."',
    'The rumour runs ahead of them.\n{a} (to camera): "We’ve barely spoken. They’ve got us married off already."',
    '{a} and {b} get teased at lunch.\n{b}: "We’re not!"\n{a}: "We’re really not."',
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
    '{a} and {b} square up over the last croissant.\n{b}: "Still losing to me, then."\n{a}: "It’s day four."',
    'Whatever it was between {a} and {b} last time, it hasn’t cooled.\n{a}: "Still here, then."\n{b}: "Still beating you, then."',
    '{a} and {b} square up again.\n{b} (to camera): "Same rivalry. Different castle."',
    '{a} and {b} trade barbs.\n{a}: "Try not to lose this one."\n{b}: "Try to keep up."',
  ],
  'called-a-truce': [
    '{b} offers a truce.\n{b}: "Different game. Different us."\n{a}: "Truce. For now."',
    '{b} calls a truce.\n{b}: "We were rivals last time. This is a different game."\n{a}: "Fair."\nBoth of them mean it.',
    '{a} and {b} agree to put it aside.\n{a} (to camera): "Different game. Different rules. Truce."',
    '{a} and {b} shake on a ceasefire.\n{b}: "For now."\n{a}: "For now."',
  ],
  'reopened-it': [
    '{a} brings up the one moment from last time.\n{a}: "You know what you did in the final week."\n{b}: "Seriously? Still?"',
    '{a} raises the specific thing, by name, and {b} remembers it exactly.\n{a}: "That last night. You lied to my face."\n{b}: "I did not lie."\n{a}: "You absolutely lied."',
    '{a} reopens the old argument.\n{b} (to camera): "{a} can’t let it go. Years later."',
    '{a} brings up that one moment.\n{b}: "Seriously? Still?"',
  ],
  'useful-rivalry': [
    '{a} and {b} bicker loudly at breakfast, then wink at each other.\n{a} (to camera): "Nobody suspects two people who hate each other."',
    '{a} points out that the room thinks they hate each other, and that’s worth something.\n{a}: "Nobody will ever suspect us of working together."\n{b}: "Oh, that’s good."',
    '{a} and {b} use the rivalry as a smokescreen.\n{b} (to camera): "Public enemies. Private allies. Perfect."',
    '{a} and {b} agree to keep fighting in public.\n{a}: "Make it look real."\n{b}: "It was real."',
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
    '{a} stands up for {b} with history.\n{a}: "I’ve played with {b}. I know what {bSub} looks like lying. That isn’t it."',
    '{a} shuts down the suspicion around {b} with history nobody else has.\n{a}: "I played with {b} before. I know exactly who {bSub} is. It’s not {bObj}."',
    '{a} vouches for {b}.\n{a}: "I’ve seen {b} under pressure. {bSub} doesn’t lie."',
    '{a} uses the past to defend {b}.\n{b} (to camera): "{a} had my back. Again."',
  ],
  'history-is-not-evidence': [
    '{a} vouches for {b} from last time, and someone rolls their eyes.\n{a}: "It counts for something!"\n{b} (to camera): "It didn’t."',
    '{a} defends {b} with their history, and somebody cuts in: that was a different show.\n{a}: "But I know {bObj}."\nNobody moves. {b} is still on the table.',
    '{a}’s defence doesn’t land.\n{a} (to camera): "They don’t care what happened before. Fair enough."',
    '{a} tries history, and it fails.\n{b}: "Thanks for trying."',
  ],
  'now-they-are-a-pair': [
    '{a} defends {b} so hard that they’re now one name.\n{b}: "You’ve tied us together."\n{a}: "We were already tied."',
    '{a} defends {b} so completely that the castle stops counting them as two people.\n{b} (to camera): "Now we’re one target instead of two."',
    '{a} goes all in for {b}.\n{a}: "If it’s {b}, it’s me as well."\n{b}: "Don’t say that."',
    '{a} ties {aRef} to {b}.\n{a} (to camera): "In for a penny."',
  ],
  'would-not-spend-it': [
    '{a} stays quiet about the past while {b} gets questioned.\n{b}: "You could have said something."\n{a}: "Not yet."',
    '{a} could say the thing about the old season, and doesn’t.\n{a} (to camera): "Not tonight. I’m saving it."',
    '{a} stays quiet about the history.\n{b} (to camera): "{a} could have helped me. {a} didn’t."',
    '{a} keeps the card in {aPos} pocket.\n{a} (to camera): {cam:holding-info}',
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
    '{a} takes {c} aside.\n{a}: "Word of advice about {b}. Don’t turn your back."\n{c}: "Noted."',
    '{a} pulls {c} aside and tells {cObj} exactly what {b} is capable of.\n{a}: "I’ve played with {b}. Be careful."\n{c}: "Careful how?"\n{a}: "Just careful."',
    '{a} warns {c} about {b}.\n{a}: "{b} will smile at you and then vote you out."',
    '{a} gives {c} a warning.\n{c} (to camera): "{a} really doesn’t trust {b}."',
  ],
  'already-knew': [
    '{a} warns {c} about {b}.\n{c}: "I worked that out on day one."\n{a}: "Oh. Good."',
    '{a} warns {c} about {b}.\n{c}: "I know."\n{a}: "You… know?"\n{c}: "I’m not stupid."',
    '{c} is ahead of {a}.\n{a} (to camera): "Didn’t expect the ‘I know’."',
    '{c} already has {b} figured out.\n{c}: "Tell me something I don’t know."',
  ],
  'defended-them-instead': [
    '{c} shakes {cPos} head at {a}.\n{c}: "{b}’s been kind to me all week."\n{a}: "That’s the trick."',
    '{c} listens, then defends {b}.\n{c}: "{b} has been nothing but decent to me this week."\n{a}: "That’s how it starts."',
    '{c} won’t hear it.\n{c}: "I judge people as I find them."',
    '{c} sticks up for {b}.\n{a} (to camera): "{c} will learn."',
  ],
  'used-it-immediately': [
    '{c} repeats {a}’s warning at dinner, word for word.\n{a} (to camera): "That was meant to be private."',
    '{c} thanks {a} for the warning, and has it at the table within the hour.\n{a} (to camera): "I told {c} in confidence. Lesson learned."',
    '{c} runs with the warning.\n{c}: "Someone who knows {b} says {bSub}’s dangerous."',
    '{c} uses the information straight away.\n{a} (to camera): "Well, that backfired."',
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
    '{a} watches {b} help with the washing-up.\n{a}: "You never did that last time."\n{b}: "People grow up."',
    '{a} admits {b} is playing a totally different game.\n{a}: "You’re not who you were last time."\n{b}: "Good. That person lost."',
    '{a} is thrown by the new {b}.\n{a} (to camera): "I expected the old {b}. This one’s calmer. Smarter."',
    '{a} tells {b} {bSub} has changed.\n{b}: "People do."',
  ],
  disappointment: [
    '{a} tries an old in-joke on {b}.\n{b}: "I don’t do that any more."\n{a}: "Shame."',
    '{a} expected {b} to be exactly who {bSub} was last time.\n{a}: "Where’s the old {b}? The fun one?"\n{b}: "Left at home."',
    '{a} misses the old {b}.\n{a} (to camera): "This {b} is a stranger."',
    '{a} is disappointed.\n{a}: "You used to be a laugh."\n{b}: "I used to lose."',
    // THREE ADDED AFTER READING A DUMP: this pool produced the worst
    // within-season repeat in 3200 seasons (four printings of "had been
    // looking forward to seeing"). `lineFor` consumes no rng, so widening the
    // pool is path-neutral - verified bit-identical on the 400-season firing
    // table - and a wider pool is the only lever that does not move anything
    // else.
  ],
  dissonance: [
    '{a} keeps saying "last time".\n{b}: "Every sentence. Last time, last time."\n{a}: "Because you were different!"',
    '{a} keeps comparing this {b} to the old one, out loud.\n{a}: "Last time you’d have—"\n{b}: "Stop. Please. It’s not last time."',
    '{a} can’t stop comparing.\n{b} (to camera): "{a} keeps talking to someone who doesn’t exist any more."',
    '{a} brings up the past again.\n{b}: "Can we be in this game, please?"',
  ],
  'asked-to-be-let-off': [
    '{b} asks {a} on the road.\n{b}: "Judge me on this week. Just this week."\n{a}: "I’ll try."',
    '{b} says it on the road, and doesn’t say it lightly.\n{b}: "I’m not that person any more."\n{a}: "Prove it."\n{b}: "I’m trying to."',
    '{b} asks for a clean slate.\n{b}: "Judge me on this game. Just this one."',
    '{b} asks {a} to let go of the past.\n{a} (to camera): "Maybe. We’ll see."',
  ],
  'stopped-comparing': [
    '{a} laughs at something {b} says.\n{a}: "I like this version of you."\n{b}: "Me too."',
    'Somewhere on the road, {a} stops measuring {b} against the old version.\n{a}: "I like this you better."\n{b}: "So do I."',
    '{a} lets the old {b} go.\n{a} (to camera): "New game. New person. Fine."',
    '{a} decides to take {b} as {bSub} is now.\n{b}: "Thank you."',
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
    '{a} listens to {b} and {c} swap old stories.\n{a}: "Anyone want to hear about my holiday?"\nNobody does.',
    '{a} sits outside a conversation about who did what to whom, having done none of it.\n{a} (to camera): "They’ve all got history. I’ve got nothing. Just me."',
    '{a} listens to the old stories with nothing to add.\n{a} (to camera): {cam:left-out}',
    '{a} feels like the outsider.\n{a}: "Anyone want to hear about my life?"\nNobody answers.',
  ],
  'asked-to-be-told': [
    '{a} pulls up a chair.\n{a}: "Right. From the beginning. Who betrayed who?"\n{b}: "Get comfy."',
    '{a} makes {b} tell the whole thing from the beginning, with names.\n{a}: "Start from the start. Who did what?"\n{b}: "How long have you got?"',
    '{a} gets the full history.\n{a} (to camera): "Now I know who hates who. Useful."',
    '{a} asks to be filled in.\n{b}: "Okay. So, it all started…"',
  ],
  'made-a-virtue-of-it': [
    '{a} says it at the table.\n{a}: "I’m the only one here with no history. No grudges. Think about that."',
    '{a} turns it into a strength.\n{a}: "I’ve never played with any of you. That makes me the only clean person here."\n{b}: "Or the only unknown."',
    '{a} leans into being fresh.\n{a} (to camera): "No history. No grudges. No target."',
    '{a} sells {aRef} as neutral.\n{a}: "I’m Switzerland."',
  ],
  'went-and-found-one': [
    '{a} sits down next to someone new at breakfast.\n{a}: "We haven’t really talked. Let’s fix that."',
    '{a} can’t join {b} and {c}’s story, so {aSub} starts one with somebody else.\n{a} (to camera): "If I can’t have history, I’ll make some."',
    '{a} builds new bonds.\n{a}: "Fancy a cuppa? We should get to know each other."',
    '{a} finds a new ally.\n{a} (to camera): "Their past. My future."',
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
    '{a} and {b} bump fists at breakfast.\n{b}: "Final two again?"\n{a}: "Final two again."',
    '{a} and {b} have gone the distance together once already.\n{a}: "Final two again?"\n{b}: "Wouldn’t bet against us."',
    '{a} and {b} fall back into their old rhythm.\n{b} (to camera): "{a} and me have been to the end before. We know the way."',
    '{a} and {b} share a look.\n{a}: "Like old times."',
  ],
  'compared-endings': [
    '{a} and {b} replay their old final.\n{a}: "You had it won."\n{b}: "You had it won!"',
    '{a} and {b} spend an hour on how their season actually finished.\n{a}: "You should have won."\n{b}: "No, you should have."\n{a}: "We’re never going to agree on this."',
    '{a} and {b} replay their old final.\n{b} (to camera): "We disagree on basically all of it."',
    '{a} and {b} argue about the past.\n{a}: "That’s not how it happened."',
  ],
  'both-know-how-it-ends': [
    '{a} and {b} say it calmly.\n{b}: "One day it’s you or me."\n{a}: "No hard feelings."\n{b}: "None."',
    '{a} and {b} agree one of them is going to have to do it to the other.\n{a}: "When it comes to it—"\n{b}: "I know. No hard feelings."\n{a}: "No hard feelings."',
    '{a} and {b} face facts.\n{b} (to camera): "Only one of us can win. We both know."',
    '{a} and {b} make peace with it.\n{a}: "May the best one win."',
  ],
  'the-room-priced-them': [
    '{a} and {b} feel the room watching them.\n{b}: "We’re the biggest target here."\n{a}: "We always were."',
    'Two old finalists in one castle is a number, and by lunch the castle has worked it out.\n{b}: "We’re a target."\n{a}: "We were always going to be."',
    '{a} and {b} feel the room watching.\n{a} (to camera): "Two finalists. Everyone’s nervous."',
    '{a} and {b} get marked as a threat.\n{b} (to camera): "Being good last time makes you a target this time."',
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
    '{a} finally says it.\n{a}: "I was angry for years. I’m not any more."\n{b}: "Thank you."',
    '{a} finally says what happened between them and {b}, and means it when {aSub} says it’s fine.\n{a}: "It’s done. I mean it."\n{b}: "Thank you."',
    '{a} and {b} make peace.\n{b} (to camera): "Years of tension. Gone in five minutes."',
    '{a} and {b} bury the past.\n{a}: "Water under the bridge."',
  ],
  grudge: [
    '{a} brings up the old betrayal again.\n{b}: "We’ve done this."\n{a}: "We’ve never finished it."',
    '{a} brings the whole thing back up, and it goes as well as last time.\n{a}: "You never apologised."\n{b}: "Because I didn’t do anything wrong."\n{a}: "Here we go."',
    '{a} and {b} have the same row again.\n{b} (to camera): "Different castle. Same argument."',
    '{a} reopens it.\n{b}: "Not this again."',
  ],
  strategic: [
    '{a} leans in.\n{a}: "I could tell this room a lot about you."\n{b}: "You wouldn’t."\n{a}: "Keep it that way, then."',
    '{a} makes it clear, calmly, that the history is a card {aSub} can play any time.\n{a}: "I could tell them what you did last time."\n{b}: "You wouldn’t."\n{a}: "Try me."',
    '{a} holds the past over {b}.\n{a} (to camera): "{b} knows I know. That’s leverage."',
    '{a} uses history as a threat.\n{b}: "That’s low."',
  ],
  buries: [
    '{a} draws a line under it.\n{a}: "That was a different game. This is this one."\n{b}: "Deal."',
    '{a} decides, out loud, that whatever happened before stays there.\n{a}: "That was then. This is now."\n{b}: "Agreed."',
    '{a} draws a line under it.\n{a} (to camera): "Left the past at the door."',
    '{a} tells {b} it’s forgotten.\n{b}: "Just like that?"\n{a}: "Just like that."',
  ],
};

registerEvent({
  id: 'callback-history-confrontation',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['boldness', 'loyalty', 'strategic', 'temperament'],
    relationship: ['prior-history', 'rival'],
  },
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

    const line = pronounSlots(pick(rng, CONFRONTATION_LINES[branch]), { a, b })
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
