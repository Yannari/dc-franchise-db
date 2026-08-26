// ══════════════════════════════════════════════════════════════════════
// tr/castle/romance.js — a showmance is protection AND liability, at once
// ══════════════════════════════════════════════════════════════════════
//
// THIS DOES NOT DUPLICATE js/romance.js. That file is the full-season TD
// pipeline (sparks -> intensity -> first move -> showmance -> love triangle
// -> affair), it runs off `gs.showmances` populated during episode
// simulation, and it has its own 4-showmance season cap enforced inside
// `_challengeRomanceSpark()`. `js/tr/headless.js` never runs episode.js at
// all — a Traitors season has no challenges, no episode loop, nothing that
// calls that pipeline — so `gs.showmances` is never populated in a castle
// season, and gating this family on it would make every event here dead on
// arrival: exactly the failure the dead-event audit exists to catch.
//
// So the castle tracks its OWN lightweight romantic escalation, using the
// same free substrate every other family uses — bonds + threads — rather
// than pushing synthetic entries into `gs.showmances` (which would silently
// corrupt whatever the real pipeline expects to find there if a future task
// ever does wire the two together). Escalation is encoded as two THREAD
// KINDS, not one: 'romance-spark' for the early stage, 'romance-showmance'
// once it has escalated. `findOpenThread` keyed on kind means the two
// stages are genuinely distinct states a later event can check for
// independently, not two labels on the same object.
//
// romanticCompat(a, b) (CLAUDE.md's own rule) gates the spark — the one
// place in this family a romantic pairing is actually proposed. Everything
// downstream just reads whether a spark/showmance thread exists.
//
// THE THEME: a showmance with a Traitor is the strongest protection in the
// format (nobody suspects the person you're sleeping next to) and the
// biggest liability (nobody is better positioned to notice something is
// wrong). `romance-liability-exposed` is the flagship this family earns its
// place with — see below.
import { gs } from '../../core.js';
import { pStats, romanticCompat } from '../../players.js';
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { openThread, advanceThread, closeThread, findOpenThread, heatAt } from '../threads.js';
import { alignmentAt } from '../roles.js';

const FAMILY = 'romance';
const SPARK_KIND = 'romance-spark';
const SHOWMANCE_KIND = 'romance-showmance';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

/**
 * ROUND 2 FIX (dead-event audit at real season scale): every event from
 * `romance-showmance-forms` onward originally gated on
 * `findOpenThread(kind, [a, b])` — requiring the CURRENT scene to be the
 * exact same two people who hold the thread. At a 20-person cast the
 * runner's scene sampler (`_sceneActors` in events.js) draws a specific
 * pair on roughly 1 in 300 attempts, so the whole escalation chain
 * (spark -> showmance -> everything downstream) measured ZERO firings past
 * the spark itself across 60 real seasons: not one showmance ever
 * "escalated," because the two sparked people were essentially never
 * redrawn together again. The fix reads whether EITHER actor drawn into
 * the current scene already belongs to a thread of the given kind, and
 * pulls the real partner from the thread's own `parties` — the same
 * pattern applied to `trust-late-checkin`/`trust-vow-of-silence`.
 *
 * ROUND 3 FIX: the first version of this helper reused `openThreadsFor`,
 * which ALSO filters to `heatAt(t, ep) > 0` (threads.js: it exists to answer
 * "what's still worth continuing," not "does this thread exist"). A
 * showmance thread that goes two rounds without being advanced decays to
 * heat 0 and stays fully `state: 'open'` — but `openThreadsFor` stops
 * returning it, so every downstream event here (protection-instinct,
 * breakup, fight, ...) silently lost the ability to find a showmance that
 * simply hadn't been talked about in a couple of rounds. Measured: three
 * of these still fired ZERO times even after the pair-exactness fix. This
 * version reads `gs.tr.threads` directly and checks only `state ===
 * 'open'` — existence, not heat — because heat is the CONTINUATION
 * guard's business (events.js's `_score`), not eligibility's.
 * `romance-showmance-forms` still applies its OWN explicit `heatAt > 0`
 * check on top of this, because escalating a spark specifically wants a
 * still-warm one — that design choice is unaffected.
 */
function _threadForActors(kind, actors) {
  const threads = gs.tr?.threads || [];
  const names = actors || [];
  const matches = threads.filter(t => t.state === 'open' && t.kind === kind
    && names.some(n => t.parties.includes(n)));
  if (!matches.length) return null;
  return matches.reduce((a, b) => (b.lastEp > a.lastEp ? b : a));
}

const SPARK_LINES = [
  '{a} and {b} sat closer than the conversation strictly required, and both of them noticed.',
  'Something shifted between {a} and {b} tonight that had nothing to do with the game.',
  '{a} caught {b}\'s eye across the room and it lasted a beat too long to be nothing.',
];

registerEvent({
  id: 'romance-spark',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread(SPARK_KIND, [a, b]) || findOpenThread(SHOWMANCE_KIND, [a, b])) return 0;
    if (!romanticCompat(a, b)) return 0;
    return getBond(a, b) >= 2 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const note = pick(rng, SPARK_LINES).replace('{a}', a).replace('{b}', b);
    const t = openThread(SPARK_KIND, [a, b], ctx.ep, note);
    return { branch: 'sparked', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'romance-showmance-forms',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    return t && heatAt(t, ctx.ep) > 0 ? 2.5 : 0;
  },
  fire(ctx) {
    const spark = _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    const [a, b] = spark.parties;
    closeThread(spark.id, ctx.ep, 'became-showmance');
    addBond(a, b, 2);
    const t = openThread(SHOWMANCE_KIND, [a, b], ctx.ep,
      `${a} and ${b} stopped pretending it was nothing. The castle has a showmance now.`);
    return { branch: 'showmance-formed', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

registerEvent({
  id: 'romance-protection-instinct',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    addBond(a, b, 1);
    const advanced = advanceThread(t.id, ctx.ep, `${a} put themselves between ${b} and a room that was getting a little too interested in ${b}'s name.`);
    return { branch: 'protected', pair: [a, b], threadId: advanced?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'romance-jealousy-third-party',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const third = pick(rng, others.length ? others : [a]);
    addBond(a, b, -1);
    const openedT = openThread(FAMILY, [a, b], ctx.ep,
      `${a} didn't love how much time ${b} was spending with ${third}, and said so.`);
    return { branch: 'jealousy', pair: [a, b], third, threadId: openedT?.id, bondDelta: -1 };
  },
});

registerEvent({
  id: 'romance-showmance-breakup',
  family: FAMILY,
  window: 'after-table',
  rare: true,
  // ROUND 2 FIX: originally required `getBond(...) < 1`. A showmance forms
  // on top of a spark bond boost (+1) and its OWN formation boost (+2) —
  // baseline is already 5+ by the time a thread exists — and the family's
  // only negative showmance events (jealousy -1, fight -1.5) are themselves
  // rare enough that stacking two or three of them onto the same pair
  // before the thread's lifetime ends measured ZERO firings across 1000
  // seasons. `< 1` was not a rare-but-reachable bar, it was an
  // unreachable one at this family's actual event frequency. Loosened to
  // `< 5` — reachable after a single fight or two jealousy incidents, which
  // is what "a real breakup" should cost, not four.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    return t && getBond(...t.parties) < 5 ? 2 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    closeThread(t.id, ctx.ep, 'broken-up');
    addBond(a, b, -2);
    const residueThread = openThread(FAMILY, [a, b], ctx.ep,
      `${a} and ${b} ended it, in front of enough people that everyone would know by lunch.`);
    return { branch: 'broke-up', pair: [a, b], threadId: residueThread?.id, bondDelta: -2 };
  },
});

registerEvent({
  id: 'romance-shields-target-together',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    addBond(a, b, 1);
    const advanced = advanceThread(t.id, ctx.ep, `${a} and ${b} quietly agreed: if either of their names comes up tomorrow, the other one is speaking first.`);
    return { branch: 'shield-pact', pair: [a, b], threadId: advanced?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'romance-shared-alibi',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    addBond(a, b, 0.5);
    const openedT = openThread(FAMILY, [a, b], ctx.ep,
      `${a} and ${b} vouched for each other's whereabouts last night. Nobody thought to ask whether that made it MORE or LESS convincing.`);
    return { branch: 'shared-alibi', pair: [a, b], threadId: openedT?.id, bondDelta: 0.5 };
  },
});

// ── FLAGSHIP: the liability is exposed — a four-way fork on the FAITHFUL
// partner's own reading of the person they're sleeping next to ──────────
//
// This only exists when the showmance is MIXED — one Traitor, one Faithful
// — because a same-role showmance has nothing to expose. The check reads
// the Faithful partner's intuition, loyalty, temperament and boldness, not
// a coin: a sharp, bold Faithful is far more likely to actually confront or
// expose their partner than a loyal, low-boldness one, who is far more
// likely to stay oblivious or bury the discomfort in silence.
//   OBLIVIOUS           — notices nothing. The showmance is pure protection
//                          this round; nothing about it costs the Traitor
//                          anything. Bond warms.
//   SUSPICIOUS-BUT-SILENT — starts to wonder, says nothing YET. Opens a
//                          `suspicion` thread naming the Traitor partner —
//                          real cross-family residue a later suspicion.js
//                          event can build on — with no bond move, because
//                          nothing has actually been said between them.
//   CONFRONTS-PRIVATELY — raises it directly, just the two of them. Real
//                          tension: the showmance thread advances with a
//                          note that changes its own tenor, and the bond
//                          takes a genuine hit even though nothing public
//                          happened.
//   EXPOSES-PUBLICLY     — the showmance ITSELF becomes evidence, out loud,
//                          in front of the room. The showmance thread is
//                          CLOSED (a real state transition — the couple as
//                          it existed is over) and a `cover` thread opens
//                          on the Traitor, because now they need damage
//                          control from the exact person who used to be
//                          their best cover.
const LIABILITY_LINES = {
  oblivious: [
    '{a} spent the whole day next to {b} and never once felt the ground shift.',
    'Whatever was true about {b}, {a} was nowhere close to seeing it.',
  ],
  suspicious: [
    '{a} couldn\'t say why, exactly, but something about {b} had started to sit wrong.',
    'A small, cold thought about {b} took root in {a} and refused to leave.',
  ],
  confronts: [
    '{a} asked {b}, privately and directly, if there was something {a} needed to know.',
    'It came out quiet and it came out honest: {a} looked at {b} and asked them to explain themselves.',
  ],
  exposes: [
    '{a} said it out loud, in front of the room, about the person they had been sleeping next to.',
    '{a} stood up at the table and told everyone exactly what they now believed about {b}.',
  ],
};

registerEvent({
  id: 'romance-liability-exposed',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    if (!t) return 0;
    const [x, y] = t.parties;
    if (isTraitor(x, ctx.ep) === isTraitor(y, ctx.ep)) return 0; // needs a MIXED pair
    return 3;
  },
  fire(ctx, rng) {
    const showmance0 = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [x, y] = showmance0.parties;
    const traitor = isTraitor(x, ctx.ep) ? x : y;
    const faithful = traitor === x ? y : x;
    const st = pStats(faithful);

    const obliviousScore = (1 - st.intuition / 10) * 0.6 + (st.loyalty / 10) * 0.2;
    const suspiciousScore = (st.intuition / 10) * 0.5 + (1 - st.boldness / 10) * 0.3;
    const confrontsScore = (st.boldness / 10) * 0.5 + (st.intuition / 10) * 0.3;
    const exposesScore = (st.boldness / 10) * 0.4 + (1 - st.loyalty / 10) * 0.4;
    const total = obliviousScore + suspiciousScore + confrontsScore + exposesScore;
    const roll = rng() * total;
    let branch;
    if (roll < obliviousScore) branch = 'oblivious';
    else if (roll < obliviousScore + suspiciousScore) branch = 'suspicious';
    else if (roll < obliviousScore + suspiciousScore + confrontsScore) branch = 'confronts';
    else branch = 'exposes';

    const line = pick(rng, LIABILITY_LINES[branch]).replace('{a}', faithful).replace('{b}', traitor);
    const showmance = findOpenThread(SHOWMANCE_KIND, [x, y]);
    let bondDelta = 0;
    let threadId = showmance?.id ?? null;

    if (branch === 'oblivious') {
      bondDelta = 1;
      addBond(faithful, traitor, bondDelta);
      const advanced = showmance ? advanceThread(showmance.id, ctx.ep, line) : openThread(SHOWMANCE_KIND, [x, y], ctx.ep, line);
      threadId = advanced?.id ?? threadId;
    } else if (branch === 'suspicious') {
      // No bond move — nothing has been SAID. Residue lands as a suspicion
      // thread on the Traitor, readable by suspicion.js's own events.
      const susp = openThread('suspicion', [faithful, traitor], ctx.ep, line);
      threadId = susp?.id ?? threadId;
    } else if (branch === 'confronts') {
      bondDelta = -2;
      addBond(faithful, traitor, bondDelta);
      const advanced = showmance ? advanceThread(showmance.id, ctx.ep, line) : openThread(SHOWMANCE_KIND, [x, y], ctx.ep, line);
      threadId = advanced?.id ?? threadId;
    } else {
      bondDelta = -4;
      addBond(faithful, traitor, bondDelta);
      if (showmance) closeThread(showmance.id, ctx.ep, 'exposed');
      const coverThread = openThread('cover', [traitor], ctx.ep,
        `${traitor}'s own showmance just told the room what they were. Damage control starts now.`);
      threadId = coverThread?.id ?? threadId;
    }
    return { branch, faithful, traitor, threadId, bondDelta };
  },
});

registerEvent({
  id: 'romance-showmance-fight',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    addBond(a, b, -1.5);
    const advanced = advanceThread(t.id, ctx.ep, `${a} and ${b} had a real fight, loud enough that the room pretended not to notice.`);
    return { branch: 'showmance-fight', pair: [a, b], threadId: advanced?.id, bondDelta: -1.5 };
  },
});

registerEvent({
  id: 'romance-strategic-optics',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1 : 0;
  },
  fire(ctx) {
    const showmance = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = showmance.parties;
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `Somebody pointed out, not unkindly, that ${a} and ${b} getting together was awfully convenient for both their games.`);
    return { branch: 'called-strategic', pair: [a, b], threadId: t?.id };
  },
});

registerEvent({
  id: 'romance-comfort-after-loss-sparks',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread(SPARK_KIND, [a, b]) || findOpenThread(SHOWMANCE_KIND, [a, b])) return 0;
    if (!romanticCompat(a, b)) return 0;
    const rounds = gs.tr?.rounds || [];
    return rounds.some(r => r.ep === ctx.ep - 1 && r.murdered) && getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1.5);
    const t = openThread(SPARK_KIND, [a, b], ctx.ep,
      `${a} and ${b} leaned on each other after last night, and it turned into something neither of them expected.`);
    return { branch: 'grief-spark', pair: [a, b], threadId: t?.id, bondDelta: 1.5 };
  },
});
