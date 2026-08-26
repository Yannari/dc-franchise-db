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
import { openThread, advanceThread, closeThread, findOpenThread } from '../threads.js';
import { activeSeasons } from '../../franchise-meta.js';

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

/** The single strongest signal across every shared season, positive or negative. */
function strongestRelation(history) {
  const priority = ['betrayed-by-them', 'betrayed-them', 'rivals', 'showmance', 'allies', 'costars'];
  for (const rel of priority) {
    const hit = history.find(h => h.relation === rel);
    if (hit) return hit;
  }
  return history[0] || null;
}

registerEvent({
  id: 'callback-recognized',
  family: FAMILY,
  window: 'dawn',
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
      `${a} and ${b} clocked each other from a previous season before either one said a word about it.`);
    return { branch: 'recognized', pair: [a, b], relation: strongest?.relation, threadId: t?.id };
  },
});

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
    const note = `${a} and ${b} picked their old alliance back up like no time had passed at all.`;
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'alliance-reformed', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

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
      `${a} still hadn't forgiven what ${b} did to them, seasons ago, and made sure ${b} knew it.`);
    return { branch: 'grudge-resurfaced', pair: [a, b], threadId: t?.id, bondDelta: -2 };
  },
});

registerEvent({
  id: 'callback-showmance-reunion-spark',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return sharedHistory(a, b).some(h => h.relation === 'showmance') ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 2);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} and ${b} found out the old feelings hadn't actually gone anywhere.`);
    return { branch: 'reunion-spark', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

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
      `Whatever it was between ${a} and ${b} last time, it clearly hadn't cooled off.`);
    return { branch: 'rivalry-carried-over', pair: [a, b], threadId: t?.id, bondDelta: -1 };
  },
});

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
      `${defender} shut down the suspicion around ${defended} with the one thing nobody else in the room could offer: they'd already vouched for each other once before.`);
    return { branch: 'defended-by-history', pair: [defender, defended], threadId: t?.id, bondDelta: 2 };
  },
});

registerEvent({
  id: 'callback-warns-newbies',
  family: FAMILY,
  window: 'morning',
  rare: true,
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
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} pulled ${c} aside and told them exactly what ${b} was capable of, from experience.`);
    return { branch: 'warned', actor: a, about: b, warned: c, threadId: t?.id, bondDelta: -1 };
  },
});

registerEvent({
  id: 'callback-different-show-different-person',
  family: FAMILY,
  window: 'after-table',
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
    let note;
    if (negative && currentBond >= 2) {
      bondDelta = 1;
      note = `${a} admitted ${b} was playing a completely different game than the one ${a} remembered — and it was throwing them.`;
    } else if (!negative && currentBond <= 0) {
      bondDelta = -0.5;
      note = `${a} expected ${b} to be exactly who they were last time. This ${b} was a stranger wearing the name.`;
    } else {
      note = `${a} kept comparing this version of ${b} to the one they remembered, out loud, to ${b}'s visible annoyance.`;
    }
    if (bondDelta) addBond(a, b, bondDelta);
    const t = openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: negative && currentBond >= 2 ? 'redemption' : (!negative && currentBond <= 0 ? 'disappointment' : 'dissonance'),
      pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'callback-no-history-envy',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [outsider, insider] = ctx.actors;
    const others = ctx.living.filter(n => n !== outsider && n !== insider);
    return others.some(n => sharedHistory(insider, n).length) ? 1 : 0;
  },
  fire(ctx) {
    const [outsider, insider] = ctx.actors;
    addBond(outsider, insider, -0.5);
    const t = openThread(FAMILY, [outsider, insider], ctx.ep,
      `${outsider} sat outside a conversation full of names and seasons they had no part of, and it stung more than they expected.`);
    return { branch: 'left-out', pair: [outsider, insider], threadId: t?.id, bondDelta: -0.5 };
  },
});

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
      `${a} and ${b} had already gone the distance together once. That kind of thing doesn't just evaporate.`);
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
  ],
  grudge: [
    '{a} brought the whole thing back up, unprompted, and it went about as well as last time.',
    'It turned into the exact fight {a} and {b} had already had once before.',
  ],
  strategic: [
    '{a} made it very clear, calmly, that the history between them was a card {a} could play whenever they wanted.',
    '{a} treated the whole thing like leverage, and {b} clocked exactly what was happening.',
  ],
  buries: [
    '{a} decided, out loud, that whatever happened before stays in the season it happened in.',
    '{a} told {b} they weren\'t interested in relitigating any of it, and left it there.',
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

    const line = pick(rng, CONFRONTATION_LINES[branch]).replace('{a}', a).replace('{b}', b);
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
      if (existing) closeThread(existing.id, ctx.ep, 'buried');
      else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    }
    return { branch, pair: [a, b], relation: strongest?.relation, threadId, bondDelta };
  },
});
