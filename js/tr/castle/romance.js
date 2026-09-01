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
//
// THE CAP (round 1 review finding): js/romance.js caps the TD pipeline at 4
// ACTIVE showmances a season (CLAUDE.md's own rule, enforced inside
// `_challengeRomanceSpark()`). Because this family deliberately does not
// touch `gs.showmances` (see above), that cap does not automatically apply
// here — a castle season on its own has NOTHING capping how many concurrent
// `romance-spark`/`romance-showmance` threads can exist. `_activeRomanceCount()`
// below enforces the SAME 4-active limit locally, on the two events that can
// OPEN a new spark (`romance-spark`, `romance-comfort-after-loss-sparks`) —
// escalation and reaction events never create a new pairing, so they don't
// need the check. At current volume this was never observed to matter (59
// spark/showmance formations across 5000 seasons, ~0.012/season — nowhere
// close to 4 concurrent), but it is a real uncapped path that a future
// author scaling this family's spark-formation rate could hit without
// warning if the check were only a comment.
// ── THE FAMILY WAS REGISTERED AND NOT IN THE GAME (whole-plan review,
// findings 5 and 11) ───────────────────────────────────────────────────
//
// Measured on the shipped pool: 492 firings across 5,000 seasons — 0.32% of
// all castle firings, about one every ten seasons — and NINE of the eleven
// events under 15 firings in 5,000. The audit passed anyway, because its bar
// was `> 0` and its season count had been raised to 5,000 until it cleared.
//
// The diagnosis was not eleven weak events. It was one bottleneck and one
// undeclared guard:
//
//   THE ENTRY POINT. Everything here is downstream of `romance-spark`, which
//   needed a romantically compatible pair at bond >= 2 — 16 of 190 pairs, 8.4%
//   — drawn together, in `evening`, the most crowded window in the pool (28
//   events), at weight 1.5 against a total eligible score around 27. Measured
//   end to end: 0.47% of evening two-actor draws, about one spark every
//   thirty-three seasons. Everything downstream was rationing that. The gate
//   is now bond >= 0 (not actively hostile — 83 of 190 pairs) with the weight
//   scaled by real warmth, and `romance-showmance-forms` no longer refuses a
//   spark whose heat has decayed: heat scales its weight instead of gating it,
//   because a spark nobody escalates otherwise sits open forever and holds one
//   of the four concurrent-romance slots against everybody else.
//
//   GUARD 2, DECLARED. events.js's header states the rule this family broke,
//   by name: "Gate content behind a rare state and weight it like everything
//   else and it will never win a draw against common events — you will have
//   shipped content you believe is in the game and is not." Seven events here
//   gate on a showmance existing, which is exactly such a state, and none of
//   them declared `rare: true`, so the amplifier built for them never applied.
//   They do now.
//
// After both: the rarest event in the whole pool fires once every forty-three
// seasons, against once every two hundred and fifty before. That is what let
// the dead-event sweep's season count come down from 5,000 to 400 — see
// tests/tr-castle-reachability.test.js for where that number comes from.
import { gs } from '../../core.js';
import { pStats, romanticCompat } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue } from './effects.js';
import { findOpenThread, heatAt } from '../threads.js';
import { suspicion } from '../deduction.js';

import { lineFor } from './lines.js';

const FAMILY = 'romance';
const SPARK_KIND = 'romance-spark';
const SHOWMANCE_KIND = 'romance-showmance';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

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
// EXPORTED (round 2, R7's rule applied a second time): js/tr/castle/journey.js
// needs exactly this lookup and exactly these reasons, and a second copy would
// have re-learned the two fixes above the hard way.
//
// WHOLE-PLAN REVIEW, F4: `some` IS DELIBERATE, AND `every` WAS TRIED AND
// REJECTED ON MEASUREMENT. The finding is real - a scene drawn as (Chef
// Hatchet + Amy) matches Amy's showmance with Beardo, narrates "Beardo and
// Amy...", bonds Beardo<->Amy, and Chef Hatchet is convened and then absent.
// 215 such firings per 200 seasons across the thirteen events using this
// helper and trust.js's twin. Requiring `every` convened actor to be a party
// removes all 215.
//
// IT ALSO REMOVES 73% OF THIS FAMILY'S REACH. Against a given couple, `some`
// is eligible on ~15.7% of draws (solo 4.0%, exact pair 0.3%, one-partner-
// plus-anybody 11.4%); `every` keeps only the first two, a 3.6x cut. Measured
// over 400 seasons: romance-shields-target-together 50 -> 9,
// romance-strategic-optics 33 -> 6, romance-shared-alibi 25 -> 5,
// romance-protection-instinct 47 -> 14, trust-vow-of-silence 48 -> 28. And
// `romance-liability-exposed`, already the pool's thinnest four-way fork, put
// three of its four branches under the branch floor in
// tr-castle-reachability.test.js and could NOT be recovered: weight 3 -> 9 ->
// 15 moved its worst branch 15 -> 21 -> 22 against a floor of 24, and a
// cooldown override on top of that reached 23. The event is capped by how
// often a showmance partner is drawn at all, not by what it is worth once
// drawn.
//
// SO THE HALF OF THE DEFECT THAT COULD BE FIXED WITHOUT BURNING THE FAMILY
// WAS: see `pickEvent` in js/tr/events.js, which now keys the player and pair
// cooldowns on the people the event actually WROTE as well as the ones the
// scene convened. The uncorrected half is stated rather than hidden: the
// outsider still spends a scene draw on a story they have no part of.
export function _threadForActors(kind, actors) {
  const threads = gs.tr?.threads || [];
  const names = actors || [];
  const matches = threads.filter(t => t.state === 'open' && t.kind === kind
    && names.some(n => t.parties.includes(n)));
  if (!matches.length) return null;
  return matches.reduce((a, b) => (b.lastEp > a.lastEp ? b : a));
}

/**
 * How many spark/showmance pairings are currently active, castle-wide.
 * Mirrors js/romance.js's 4-active-showmance cap locally, since this family
 * cannot reuse that cap directly (see the header comment: it never touches
 * `gs.showmances`). Only the two events that OPEN a new spark check this —
 * escalation/reaction events operate on a pairing that already exists and
 * don't add to the count.
 */
// EXPORTED (Plan 5 Task 4 round 2, R7). js/tr/castle/journey.js opens the
// second door into this family and has to obey the SAME cap; it had its own
// copy of both, and two copies of a constant desync silently - the failure
// would be five concurrent showmances in a season, with nothing red.
export const MAX_ACTIVE_ROMANCES = 4;
export function _activeRomanceCount() {
  const threads = gs.tr?.threads || [];
  return threads.filter(t => t.state === 'open' && (t.kind === SPARK_KIND || t.kind === SHOWMANCE_KIND)).length;
}

const SPARK_LINES = [
  '{a} and {b} sat closer than the conversation strictly required, and both of them noticed.',
  'Something shifted between {a} and {b} tonight that had nothing to do with the game.',
  '{a} caught {b}\'s eye across the room and it lasted a beat too long to be nothing.',
  '{a} made {b} laugh, twice, and then spent the rest of the evening trying to do it again.',
  'They were the last two awake, {a} and {b}, and neither of them went to bed.',
  '{b} said something ordinary and {a} looked at them for a second too long afterwards.',
];

registerEvent({
  id: 'romance-spark',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread(SPARK_KIND, [a, b]) || findOpenThread(SHOWMANCE_KIND, [a, b])) return 0;
    if (!romanticCompat(a, b)) return 0;
    if (_activeRomanceCount() >= MAX_ACTIVE_ROMANCES) return 0;
    const bond = getBond(a, b);
    return bond >= 0 ? 1.2 + bond * 0.25 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-spark');
    const sceneWhy = 'something started between them';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 1, { source: sceneWhy });
    const note = pick(rng, SPARK_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = api.openArc(SPARK_KIND, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'sparked', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

const SHOWMANCE_FORM_LINES = [
  '{a} and {b} stopped pretending it was nothing. The castle has a showmance now.',
  'By breakfast everybody knew about {a} and {b}, and {a} and {b} had stopped minding.',
  '{a} and {b} arrived together and left together and did not explain either.',
  'It stopped being deniable somewhere last night. {a} and {b} are a thing the castle has to plan around now.',
  'Nobody announced anything. {a} and {b} simply stopped sitting apart.',
];

registerEvent({
  id: 'romance-showmance-forms',
  family: FAMILY,
  window: 'evening',
  rare: true,
  // NOT THE SAME DAY (whole-plan review, F7). Every band in this plan measures
  // a thread's length in BEATS and none in EPISODES, so a spark that becomes a
  // showmance in the same evening it was struck reads as healthy accumulation
  // - two beats - while being an arc with no time in it. 28.6% of escalations
  // were same-day. A castle where people are in each other's company all day
  // can move fast, but it cannot move from "neither of them planned it that
  // way" to a thing the castle has to plan around between two draws of the same
  // window.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    if (!t || ctx.ep <= t.openedEp) return 0;
    return 6 + heatAt(t, ctx.ep) * 6;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-showmance-forms');
    const sceneWhy = 'they stopped pretending it was nothing';
    const spark = _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    const [a, b] = spark.parties;
    api.resolveArc(spark.id, 'became-showmance', { source: sceneWhy });
    api.addBond(a, b, 2, { source: sceneWhy });
    const t = api.openArc(SHOWMANCE_KIND, [a, b],
      { source: sceneWhy, seed: lineFor(SHOWMANCE_FORM_LINES, `romance-showmance-forms|${ctx.ep}`, { a, b }) });
    return { branch: 'showmance-formed', pair: [a, b], threadId: t?.id, bondDelta: 2 };
  },
});

const PROTECT_LINES = [
  '{a} put themselves between {b} and a room that was getting a little too interested in {b}\'s name.',
  'The moment {b}\'s name came up, {a} was talking, and kept talking until it had gone away again.',
  '{a} made it very clear, without ever raising their voice, that coming for {b} meant coming for both of them.',
  '{a} took a question aimed at {b} and answered it themselves, badly, on purpose.',
  '{b} did not need defending. {a} defended them anyway, in front of everybody.',
];

registerEvent({
  id: 'romance-protection-instinct',
  family: FAMILY,
  window: 'dawn',
  // ACT: CLOSING. Standing in front of the vote for somebody is a late-season
  // shape: early nobody is close enough to the block for it to cost anything.
  acts: { early: 0.5, late: 1.7 },
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-protection-instinct');
    const sceneWhy = 'put themselves between somebody and the room';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    api.addBond(a, b, 1, { source: sceneWhy });
    const advanced = api.advanceArc(t.id, lineFor(PROTECT_LINES, `romance-protection-instinct|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch: 'protected', pair: [a, b], threadId: advanced?.id, bondDelta: 1,
      crowd: { name: a, colour: 'kind' } };
  },
});

const JEALOUSY_LINES = [
  '{a} didn\'t love how much time {b} was spending with {c}, and said so.',
  '{a} asked what {b} and {c} had been talking about for that long, and did not like being the kind of person who asks.',
  '{b} came back from a conversation with {c} to find {a} had been counting the minutes.',
  '{a} made a joke about {c} that was not a joke, and {b} heard which one it was.',
  'It was not about {c} at all, and both {a} and {b} knew that, and they had the row anyway.',
];

registerEvent({
  id: 'romance-jealousy-third-party',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-jealousy-third-party');
    const sceneWhy = 'a third person came between them';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const third = pick(rng, others.length ? others : [a]);
    api.addBond(a, b, -1, { source: sceneWhy });
    const openedT = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(JEALOUSY_LINES, `romance-jealousy-third-party|${ctx.ep}`, { a, b, c: third }) });
    return { branch: 'jealousy', pair: [a, b], third, threadId: openedT?.id, bondDelta: -1 };
  },
});

const BREAKUP_LINES = [
  '{a} and {b} ended it, in front of enough people that everyone would know by lunch.',
  'It finished in the kitchen, with an audience, and neither {a} nor {b} lowered their voice for it.',
  '{a} and {b} stopped, and the castle watched them stop, and nobody pretended otherwise.',
  'Whatever {a} and {b} had, it was over by the time the plates were cleared, and publicly.',
  '{b} walked away from {a} mid-sentence, and that was the end of it, in front of four people.',
];

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
  // AND NOT THE SAME DAY EITHER (F7). 14 of 26 breakups landed in the very
  // episode the showmance formed and 3 more in the next one - an entire arc,
  // spark to breakup, inside one day. The bond floor below is what makes a
  // breakup earned; elapsed time is what makes it a story.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    if (!t || ctx.ep <= t.openedEp) return 0;
    return getBond(...t.parties) < 5 ? 2 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-showmance-breakup');
    const sceneWhy = 'it ended between them';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    api.resolveArc(t.id, 'broken-up', { source: sceneWhy });
    api.addBond(a, b, -2, { source: sceneWhy });
    const residueThread = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(BREAKUP_LINES, `romance-showmance-breakup|${ctx.ep}`, { a, b }) });
    return { branch: 'broke-up', pair: [a, b], threadId: residueThread?.id, bondDelta: -2 };
  },
});

const SHIELD_LINES = [
  '{a} and {b} quietly agreed: if either of their names comes up tomorrow, the other one is speaking first.',
  'Last thing before sleep, {a} and {b} worked out who says what if it goes wrong tomorrow.',
  '{a} and {b} agreed on a signal, which is either very sweet or very organised.',
  'Whoever gets named first, the other one stands up. {a} and {b} settled that in the dark and did not discuss it again.',
  '{b} told {a} not to defend them tomorrow. {a} agreed, and both of them knew {a} was lying.',
];

registerEvent({
  id: 'romance-shields-target-together',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-shields-target-together');
    const sceneWhy = 'agreed to take the pressure off each other';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    api.addBond(a, b, 1, { source: sceneWhy });
    const advanced = api.advanceArc(t.id, lineFor(SHIELD_LINES, `romance-shields-target-together|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch: 'shield-pact', pair: [a, b], threadId: advanced?.id, bondDelta: 1 };
  },
});

const SHARED_ALIBI_LINES = [
  '{a} and {b} vouched for each other\'s whereabouts last night. Nobody thought to ask whether that made it MORE or LESS convincing.',
  'Asked separately, {a} and {b} gave the same account of the night, which proves either everything or nothing.',
  '{a} was with {b}. {b} was with {a}. The room had to decide what that was worth.',
  'The two people least able to clear each other cleared each other, and did it with a straight face.',
  '{a} answered for {b} before {b} could answer, which {a} realised afterwards had not helped.',
];

registerEvent({
  id: 'romance-shared-alibi',
  family: FAMILY,
  window: 'morning',
  rare: true,
  // ADVANCES AND CITES (Plan 5 Task 2). `romance|morning` held no advancer.
  // Two people vouching for each other AGAIN, and naming the last night they
  // did it, is how an alibi stops sounding like an alibi and starts sounding
  // like an arrangement.
    citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-shared-alibi');
    const sceneWhy = 'a couple gave the same account of the night';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    api.addBond(a, b, 0.5, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, lineFor(SHARED_ALIBI_LINES, `romance-shared-alibi|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch: 'shared-alibi', pair: [a, b], threadId: thread?.id, cited, bondDelta: 0.5 };
  },
});

// ── FLAGSHIP: the liability is exposed — a four-way fork on the DOUBTING
// partner's own reading of the person they're sleeping next to ──────────
//
// BELIEF, NOT TRUTH (whole-plan review, finding 3 — the same defect as
// susp-misread-tell, found by the role-symmetry probe rather than by the
// review). This used to require the showmance to be MIXED by GROUND TRUTH
// (one real Traitor, one real Faithful) and then spend up to -4 bond on it.
// The acting partner is the Faithful one — somebody with no access whatever
// to the fact the gate was reading — so the bond move was an oracle, and
// bonds feed bondResistance() -> suspicion() straight back into the room's
// reasoning. The precondition is now the partner's own READ: a showmance
// where one of the two has started to suspect the other. Whether the doubt
// is right is not this event's business, which is a better version of the
// same scene — the format's whole engine is people being sure and wrong.
//
// The check reads the doubting partner's intuition, loyalty, temperament and
// boldness, not a coin: a sharp, bold doubter is far more likely to actually
// confront or expose their partner than a loyal, low-boldness one, who is
// far more likely to stay oblivious or bury the discomfort in silence.
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
    '{a} defended {b} twice today, warmly, and had no idea what they were defending.',
    '{b} left three separate openings and {a} walked past every one of them.',
  ],
  suspicious: [
    '{a} couldn\'t say why, exactly, but something about {b} had started to sit wrong.',
    'A small, cold thought about {b} took root in {a} and refused to leave.',
    '{a} caught themselves checking where {b} had been, and was appalled at themselves for checking.',
    'Nothing {b} did was wrong. {a} started counting the things anyway.',
  ],
  confronts: [
    '{a} asked {b}, privately and directly, if there was something {a} needed to know.',
    'It came out quiet and it came out honest: {a} looked at {b} and asked them to explain themselves.',
    '{a} closed the door, sat down, and asked {b} the question they had been not-asking for three days.',
    '"Just tell me," {a} said to {b}, and meant it, and waited a long time for the answer.',
  ],
  // REWRITTEN FOR `night` (round 2, R2). These two lines used to put the
  // doubter on their feet AT THE ROUND TABLE, which is the only thing that
  // held this event in `after-table` - and holding it there was costing all
  // four of its branches. Said out loud in a corridor at two in the morning
  // with the house waking up is the same public act, and it is a better one:
  // the person hears it from them, not from the room.
  exposes: [
    '{a} said it out loud at two in the morning, loudly enough that it was not just {b} who heard it.',
    '{a} woke half the corridor telling {b}, and everybody who came out of their room, exactly what they now believed.',
    '{a} did not wait for morning, or for witnesses, and got both anyway.',
    '{a} said {b}\'s name and the word out loud in the corridor, and three doors opened.',
    'Whatever {a} had meant to do with it, what {a} actually did was tell the whole floor at once.',
  ],
};

// FOUND BY COUNTING WHAT THE SEASONS ACTUALLY PRINTED, not by reading the
// source. `exposes` built `line` out of the five-line pool above and then
// never wrote it anywhere: the branch closes the showmance and opens a COVER
// thread, and the cover thread's note was a hard-coded sentence. So the
// flagship's loudest branch printed one constant across 61 firings per 3200
// seasons while its own pool sat unused — dead content inside a live branch,
// which is exactly the class the branch floor exists for and cannot see,
// because the branch fires perfectly well.
//
// The fix keeps the exposure sentence (the pooled one) as the LEAD, so it is
// what a reader sees and what a later citation quotes, and gives the
// damage-control half its own pool behind it.
const EXPOSED_AFTERMATH_LINES = [
  '{b}\'s own showmance just stood up and named them in front of the room. Damage control starts now.',
  'The person who slept next to {b} has just told the castle what they think {b} is. There is no version of tomorrow where {b} is not answering for that.',
  'Whatever protection {b} had, it was mostly {a}, and {a} has just spent it in public.',
  '{b} now has to explain, to everybody, why the one person who knows them best said that out loud.',
  'By breakfast the whole castle will have it. {b} has until breakfast.',
];

registerEvent({
  id: 'romance-liability-exposed',
  family: FAMILY,
  // RELOCATED `after-table` -> `night` (round 2, R2). This is the family's
  // flagship and it forks FOUR ways on 25 firings per 400 seasons, so every
  // branch of it sat at or under the reachability floor - `exposes` at 2,
  // `oblivious` at 3. Four branches on a rare event need volume, and
  // `after-table` is the second most contested window in the pool and lost 30%
  // of its draws to this task. `night` runs immediately after it, so every
  // belief this event reads is at least as fresh, and the scene is better
  // there on the merits: this is a person lying awake next to somebody they
  // have started to doubt, which is not a thing that happens in a crowded
  // room. Only the `exposes` line pool had to change; see the note on it.
  window: 'night',
  // ACT: CLOSING. A showmance standing up and naming its own partner in
  // front of the room is a back-half beat by construction - it needs a
  // showmance old enough to be a liability and a room small enough for the
  // naming to matter. Measured 0 early, 6 middle, 17 late per 400 seasons
  // before this was declared, which is the tag written down rather than
  // imposed. It also protects the pool's thinnest four-way fork: this event
  // fires ~23 times per 400 seasons across FOUR branches, so every branch
  // sits within ordinary path noise of the reachability floor, and the tag
  // concentrates the firings it does get in the act it belongs to.
  acts: { early: 0.4, late: 2.5 },
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    if (!t) return 0;
    const [x, y] = t.parties;
    // Needs a DOUBT inside the couple, not a mixed pair of alignments.
    if (suspicion(x, y, ctx.ep) <= 0 && suspicion(y, x, ctx.ep) <= 0) return 0;
    return 3;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-liability-exposed');
    const sceneWhy = 'the room priced what the couple was worth to it';
    const showmance0 = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [x, y] = showmance0.parties;
    const doubter = suspicion(x, y, ctx.ep) >= suspicion(y, x, ctx.ep) ? x : y;  // the doubter
    const suspected = doubter === x ? y : x;                                        // the suspected
    const st = pStats(doubter);

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

    const line = pick(rng, LIABILITY_LINES[branch]).replace(/\{a\}/g, doubter).replace(/\{b\}/g, suspected);
    const showmance = findOpenThread(SHOWMANCE_KIND, [x, y]);
    let bondDelta = 0;
    let threadId = showmance?.id ?? null;

    if (branch === 'oblivious') {
      bondDelta = 1;
      api.addBond(doubter, suspected, bondDelta, { source: sceneWhy });
      const advanced = showmance
        ? api.advanceArc(showmance.id, line, { source: sceneWhy })
        : api.openArc(SHOWMANCE_KIND, [x, y], { source: sceneWhy, seed: line });
      threadId = advanced?.id ?? threadId;
    } else if (branch === 'suspicious') {
      // No bond move — nothing has been SAID. Residue lands as a suspicion
      // thread on the suspected partner, readable by suspicion.js's own events.
      const susp = api.openArc('suspicion', [doubter, suspected], { source: sceneWhy, seed: line });
      threadId = susp?.id ?? threadId;
    } else if (branch === 'confronts') {
      bondDelta = -2;
      api.addBond(doubter, suspected, bondDelta, { source: sceneWhy });
      const advanced = showmance
        ? api.advanceArc(showmance.id, line, { source: sceneWhy })
        : api.openArc(SHOWMANCE_KIND, [x, y], { source: sceneWhy, seed: line });
      threadId = advanced?.id ?? threadId;
    } else {
      bondDelta = -4;
      api.addBond(doubter, suspected, bondDelta, { source: sceneWhy });
      if (showmance) api.resolveArc(showmance.id, 'exposed', { source: sceneWhy });
      const coverThread = api.openArc('cover', [suspected],
        { source: sceneWhy, seed: `${line} ${lineFor(EXPOSED_AFTERMATH_LINES, `romance-liability-exposed|exposes|${ctx.ep}`,
          { a: doubter, b: suspected })}` });
      threadId = coverThread?.id ?? threadId;
    }
    return { branch, doubter, suspected, threadId, bondDelta };
  },
});

const FIGHT_LINES = [
  '{a} and {b} had a real fight, loud enough that the room pretended not to notice.',
  'It started over nothing and got somewhere real, and everybody downstairs heard the end of it.',
  '{a} said something to {b} that could not be taken back, and did not take it back.',
  '{b} walked out on {a} mid-argument and the door said the rest.',
  'Two people who had been finishing each other\'s sentences spent an evening interrupting them instead.',
];

registerEvent({
  id: 'romance-showmance-fight',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-showmance-fight');
    const sceneWhy = 'they had it out in front of people';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    api.addBond(a, b, -1.5, { source: sceneWhy });
    const advanced = api.advanceArc(t.id, lineFor(FIGHT_LINES, `romance-showmance-fight|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch: 'showmance-fight', pair: [a, b], threadId: advanced?.id, bondDelta: -1.5 };
  },
});

const OPTICS_LINES = [
  'Somebody pointed out, not unkindly, that {a} and {b} getting together was awfully convenient for both their games.',
  'The word "convenient" got used about {a} and {b} this morning, and it travelled.',
  'Two votes that always land together stop looking like a couple and start looking like a bloc, and the room said so.',
  '{a} and {b} were asked, more or less to their faces, whether any of it was real.',
  'Nobody doubted {a} and {b} liked each other. Several people doubted that was all it was.',
];

registerEvent({
  id: 'romance-strategic-optics',
  family: FAMILY,
  window: 'morning',
  // ACT: CLOSING. 'Your relationship is a strategy and people are saying so'
  // needs a room that has started reading everything as strategy.
  acts: { early: 0.5, late: 1.6 },
  rare: true,
  // The second advancer in `romance|morning`.
    citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-strategic-optics');
    const sceneWhy = 'the room read the couple as a strategy';
    const showmance = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = showmance.parties;
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, lineFor(OPTICS_LINES, `romance-strategic-optics|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch: 'called-strategic', pair: [a, b], threadId: thread?.id, cited };
  },
});

const GRIEF_SPARK_LINES = [
  '{a} and {b} leaned on each other after last night, and it turned into something neither of them expected.',
  '{b} was the one who found {a} this morning, and neither of them moved for a long time afterwards.',
  'It was meant to be comfort. Somewhere in the middle of it, for {a} and {b}, it stopped being only that.',
  '{a} held on to {b} a little longer than the moment strictly needed, and {b} let them.',
  'Grief put {a} and {b} in the same room at six in the morning, and something else kept them there.',
];

registerEvent({
  id: 'romance-comfort-after-loss-sparks',
  family: FAMILY,
  window: 'dawn',
  // NO ACT PROFILE, DELIBERATELY, AND THIS IS A WITHDRAWAL (round 2).
  // It shipped as OPENING `{1.3, 1.2, 0.5}` on the argument that a spark is
  // only a story if there is season left for it to become one - every
  // escalation this family owns is downstream of it and needs episodes. True,
  // and it cost more than it was worth: measured, the tag took this event's
  // LATE firings from 5 per 400 seasons to ZERO and closed the pool's only
  // grief -> romance bridge in the back half - a hole no floor in this repo
  // can see, because every one of them is keyed per event or per branch and
  // never per act.
  //
  // The second draft re-profiled it to `{0.9, 1.3}`. That is a near-flat
  // profile, which is the thing tests/tr-castle.test.js's own well-formedness
  // guard calls "a no-op wearing the shape of a pacing decision" - and the
  // honest reading is that this event HAS no act. It needs a death to have
  // happened, which rules out only the first morning; and grief is heaviest
  // when the room is smallest while romance needs runway, which are two true
  // things pulling opposite ways and cancelling. Its measured 1/7/5 split is
  // where the volume is, not a statement of tone.
  //
  // So it carries nothing. An event with no act should say so by being
  // absent from the ledger, not by declaring 1s.
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread(SPARK_KIND, [a, b]) || findOpenThread(SHOWMANCE_KIND, [a, b])) return 0;
    if (!romanticCompat(a, b)) return 0;
    if (_activeRomanceCount() >= MAX_ACTIVE_ROMANCES) return 0;
    const rounds = gs.tr?.rounds || [];
    return rounds.some(r => r.ep === ctx.ep - 1 && r.murdered) && getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'romance-comfort-after-loss-sparks');
    const sceneWhy = 'comfort after a death turned into something else';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 1.5, { source: sceneWhy });
    const t = api.openArc(SPARK_KIND, [a, b],
      { source: sceneWhy, seed: lineFor(GRIEF_SPARK_LINES, `romance-comfort-after-loss-sparks|${ctx.ep}`, { a, b }) });
    return { branch: 'grief-spark', pair: [a, b], threadId: t?.id, bondDelta: 1.5 };
  },
});
