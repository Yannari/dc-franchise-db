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
import { registerEvent, isNervy } from '../events.js';
import { sceneApi, arcContinue } from './effects.js';
import { findOpenThread, heatAt, priorMoments } from '../threads.js';
import { suspicion } from '../deduction.js';

import { lineFor, whoTheyTold, pronounSlots } from './lines.js';

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

// ── REWRITE (Task 7 stage 6). TOP OF THE BLAME TABLE after batch 1, at 12 of
// 205 loud seasons. The audit's verdict was "one branch (`sparked`) — the fork
// is in the wording, not in the game", and the wording was six lines carrying
// two firings a season in the busiest window in the castle.
//
// A SPARK IS NOT A DECISION, IT IS A THING TWO PEOPLE NOTICE, and the fork is
// what each of them does in the ten seconds afterwards. Five, and every one of
// them opens the spark arc — the fork is never in WHETHER something started,
// which is the silent-branch defect the sibling showmance events carry a note
// about, but in what shape it started in and who else has it.
//
// THE RECORD THE FORK READS: the stored bond between them (how much there was
// to build on before tonight), each of their boldness and social, and how many
// people are still in the castle — because a spark in a room of eighteen is a
// private thing and a spark in a room of six is public whatever they do.
//
//   sparked        — mutual, unhurried, and neither of them says a word.
//   named-it-fast  — one of them says it out loud on the spot.
//   one-sided-so-far — only one of them is in it, and the other has not
//                    noticed. NAMED THAT WAY because `one-sided` already means
//                    the opposite thing in `mission-what-cost-us`, where it is
//                    adverse; the denylist arm in tr-castle-prose.test.js
//                    caught the collision, which is what it is for.
//   interrupted    — somebody walks in, and the interruption is what makes it
//                    real, because now a third person has it.
//   said-nothing   — both of them clock it and both of them decide not to.
const SPARK_LINES = {
  sparked: [
    '{a} and {b} end up on the same sofa, closer than they need to be.\n{b}: "Is it me, or is this sofa getting smaller?"\n{a}: "It’s definitely the sofa."',
    '{a} makes {b} laugh twice in five minutes.\n{b}: "Stop it. People are looking."\n{a}: "Let them look."',
    '{a} and {b} talk by the fire until everyone else has gone up.\n{a} (to camera): "I didn’t come here for this. But, well. Here we are."',
    '{b} catches {a} looking.\n{b}: "What?"\n{a}: "Nothing."\n{b}: "Doesn’t look like nothing."',
  ],
  'named-it-fast': [
    '{a} says it before the kettle boils.\n{a}: "I think I fancy you."\n{b}: "Think?"\n{a}: "Fine. Know."',
    '{b} says it about ten seconds in.\n{b}: "This is going to be a problem, isn’t it?"\n{a}: "Probably."\n{b}: "Good."',
    '{b} doesn’t waste time.\n{b}: "I like you. That’s going to complicate things."\n{a}: "Things were already complicated."',
    '{a} and {b} name it straight away.\n{b} (to camera): "Why play games about it? We’re playing enough games already."',
  ],
  'one-sided-so-far': [
    '{a} laughs a beat too long at {b}’s joke.\n{b}: "It wasn’t that funny."\n{a}: "It was a bit funny."',
    '{a} spends the evening falling for {b}, who is just being nice.\n{b}: "Night, {a}! Sleep well."\n{a} (to camera): "Did you see that? {bSub} said sleep well."',
    '{a} reads a lot into {b}’s smile.\n{b} (to camera): "{a}’s lovely. I think {aSub} might like me a bit more than I realised."',
    '{a} hangs on {b}’s every word.\n{b}: "You alright? You’re staring."\n{a}: "Am I? Sorry."',
  ],
  interrupted: [
    '{a} and {b} are leaning closer when {c} bangs a cupboard.\n{c}: "Don’t mind me."\n{a}: "We weren’t—"\n{c}: "Course not."',
    '{a} and {b} are nearly there when {c} comes in for a glass of water.\n{c}: "Oh! Sorry. Carry on."\n{b}: "We weren’t doing anything."\n{c}: "Clearly."',
    '{c} walks in at exactly the wrong moment.\n{a} (to camera): "{c} has the worst timing in the castle."',
    '{a} leans in, and the door opens.\n{c}: "Anyone seen my jumper?"\n{b}: "No!"',
  ],
  'said-nothing': [
    '{a} and {b} sit by the fire saying nothing for a long time.\n{b} (to camera): "Nothing was said. That was the loud bit."',
    'Both of them notice. Neither says so.\n{a}: "Well. Night, then."\n{b}: "Night."\nNeither moves.',
    '{a} and {b} sit in a loaded silence.\n{b} (to camera): "Something happened. Nothing happened. You know?"',
    '{a} and {b} say goodnight a bit too slowly.\n{a} (to camera): "I’m not saying anything. Not yet."',
  ],
};

registerEvent({
  id: 'romance-spark',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['boldness', 'social', 'temperament'],
    relationship: ['close-ally', 'neutral'],
    knowledge: ['incomplete', 'witnessed'],
  },
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
    const [a, b] = ctx.actors;
    const bond = getBond(a, b);
    const sa = pStats(a);
    const sb = pStats(b);
    // WHO ELSE IS IN THE CASTLE, read off the living roster rather than
    // assumed: `interrupted` needs somebody to do the interrupting, and a
    // small castle makes being walked in on much likelier.
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = others.length ? others[Math.floor(rng() * others.length)] : null;
    const scores = {
      sparked: 0.5 + Math.max(0, bond) * 0.07,
      'named-it-fast': (sa.boldness / 10) * 0.3 + (sb.boldness / 10) * 0.2,
      'one-sided-so-far': Math.max(0.05, 0.35 - Math.max(0, bond) * 0.05),
      interrupted: c ? 0.15 + Math.max(0, 12 - others.length) * 0.03 : 0,
      'said-nothing': (1 - sa.boldness / 10) * 0.3 + (sa.temperament / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'sparked';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'named-it-fast' ? 'said it out loud the same evening'
      : branch === 'one-sided-so-far' ? 'was in it on their own so far'
        : branch === 'interrupted' ? 'was walked in on before anything was said'
          : branch === 'said-nothing' ? 'both noticed it and neither said so'
            : 'something started between them';
    const note = lineFor(SPARK_LINES[branch], `romance-spark|${branch}|${ctx.ep}`,
      { a, b, c: c || b });
    const bondDelta = branch === 'named-it-fast' ? 1.5
      : branch === 'one-sided-so-far' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // THE THIRD PERSON WALKS AWAY WITH SOMETHING, which is what makes
    // `interrupted` a scene rather than a non-event: {c} now holds a fact
    // about two people, and the bond records that they know it.
    if (branch === 'interrupted' && c) api.addBond(a, c, -0.5, { source: sceneWhy });
    const t = api.openArc(SPARK_KIND, [a, b], { source: sceneWhy, seed: note });
    const out = { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], threadId: t?.id, bondDelta };
    if (branch === 'named-it-fast') { out.speaker = a; out.respondent = b; }
    return out;
  },
});
// ── REWRITE (Task 7 stage 5). The audit’s verdict was REWRITE ("one branch
// — the fork is in the wording"), and once `evening` opened up it went to
// second on the blame table at 19 of 271 loud seasons.
//
// A SHOWMANCE BECOMING PUBLIC IS AN EVENT WITH A ROOM IN IT, and the room is
// where the fork belongs. Four ways a castle finds out, and they cost the
// couple four different amounts:
//
//   stopped-hiding-it  — they simply stop sitting apart, and the castle
//                        absorbs it over a morning.
//   the-room-said-it   — somebody else says it out loud first, at the table,
//                        and the two of them are answering rather than telling.
//   told-one-person    — they choose who finds out first, which is a strategic
//                        act as much as a romantic one.
//   agreed-to-hide-it  — it is a showmance and they decide the castle does not
//                        get to know, which is the version that costs the most
//                        to maintain.
//
// EVERY BRANCH STILL CLOSES THE SPARK AND OPENS THE SHOWMANCE. The fork is in
// how the castle learns, never in whether the thing happened — an event that
// sometimes declines to do what it is named for is the silent-branch defect
// the prose suite has a rule about, and the sibling break-up event carries the
// same note for the same reason.
const SHOWMANCE_FORM_LINES = {
  'stopped-hiding-it': [
    '{a} kisses {b} on the cheek at breakfast in front of everyone.\n{b}: "Well, that’s that, then."\n{a}: "That’s that."',
    '{a} and {b} stop pretending it’s nothing.\n{a}: "So we’re doing this?"\n{b}: "We’re doing this."\nThe castle has a showmance now.',
    '{a} takes {b}’s hand at dinner in front of everyone.\n{b} (to camera): "No more hiding. It’s out."',
    '{a} and {b} sit together openly.\n{a}: "Let them talk."\n{b}: "They will."',
  ],
  'the-room-said-it': [
    '{a} and {b} walk in together and the table cheers.\n{a}: "Oh, stop it."\n{b} (to camera): "So the whole table worked it out before we did. Brilliant."',
    'Somebody asks across the table whether {a} and {b} are a thing, before either of them has said it.\n{b}: "We’re not— I mean—"\n{a}: "Yeah. We are."',
    'The room names it first.\n{b} (to camera): "We didn’t even get to say it. They said it for us."',
    'The table teases {a} and {b}.\n{a}: "Alright, alright."\n{b}: "Yes. Fine. We are."',
  ],
  'told-one-person': [
    '{a} and {b} tell one friend on the stairs.\n{a}: "Not a word."\n{b}: "We mean it."',
    '{a} and {b} pick one person to tell first, carefully.\n{a}: "Can you keep a secret?"\n{b}: "We’re sort of together."',
    '{a} and {b} tell their closest ally.\n{a} (to camera): "One person. The right person. For now."',
    '{a} and {b} decide who gets to know.\n{b}: "Just one. Someone we trust."\n{a}: "That’s a short list."',
  ],
  'agreed-to-hide-it': [
    '{a} and {b} agree on a rule.\n{b}: "Nothing in public."\n{a}: "Nothing in public. Starting when?"\n{b}: "Starting now. Stop smiling."',
    '{a} and {b} agree it’s real, and agree the castle won’t be told.\n{a}: "Nobody finds out."\n{b}: "Nobody."\nThey shake on it.',
    '{a} and {b} keep it secret.\n{b} (to camera): "A couple is a target. We’re not giving them one."',
    '{a} and {b} agree to act normal.\n{a}: "Sit apart at breakfast."\n{b}: "I hate this."\n{a}: "Me too."',
  ],
};

registerEvent({
  id: 'romance-showmance-forms',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['boldness', 'strategic', 'social'],
    relationship: ['romance'],
  },
  // NOT THE SAME DAY (whole-plan review, F7). Every band in this plan measures
  // an arc’s length in BEATS and none in EPISODES, so a spark that becomes a
  // showmance in the same evening it was struck reads as healthy accumulation
  // - two beats - while being an arc with no time in it. 28.6% of escalations
  // were same-day. A castle where people are in each other’s company all day
  // can move fast, but it cannot move from "neither of them planned it that
  // way" to a thing the castle has to plan around between two draws of the same
  // window.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const t = _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    if (!t || ctx.ep <= t.openedEp) return 0;
    return 6 + heatAt(t, ctx.ep) * 6;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-showmance-forms');
    const spark = _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    const [a, b] = spark.parties;
    const sa = pStats(a), sb = pStats(b);
    const scores = {
      'stopped-hiding-it': (sa.boldness / 10) * 0.3 + (sb.boldness / 10) * 0.3 + 0.2,
      'the-room-said-it': (sa.social / 10) * 0.3 + (sb.social / 10) * 0.3,
      'told-one-person': (sa.strategic / 10) * 0.35 + (sb.social / 10) * 0.2,
      'agreed-to-hide-it': (sa.strategic / 10) * 0.25 + (1 - sb.boldness / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'the-room-said-it' ? 'had the room say it out loud before they did'
      : branch === 'told-one-person' ? 'chose who found out about them first'
        : branch === 'agreed-to-hide-it' ? 'agreed the castle was not going to be told'
          : 'they stopped pretending it was nothing';
    api.resolveArc(spark.id, 'became-showmance', { source: sceneWhy });
    const bondDelta = branch === 'agreed-to-hide-it' ? 2.5
      : branch === 'the-room-said-it' ? 1 : 2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // ── HOW FAR IT ACTUALLY GOT (writing-contracts.md, "Evidence for group
    //    consensus") ─────────────────────────────────────────────────────
    //
    // This branch used to assert that the whole castle had it, and wrote no
    // receipt to say so. The news now travels to named people (`whoTheyTold`
    // — chosen by bond, no rng draw) with a propagation hop each, and the
    // sentence takes its words from `api.consensusPhrase`, which is only
    // allowed to say "the people still in the castle" once the receipts pass
    // the consensus floor. Below the floor it names them or counts them.
    const factId = api.recordClaim(a, `${a} and ${b} are a showmance`,
      { about: b, listeners: [b], channel: 'conversation', source: sceneWhy }).id;
    const heard = whoTheyTold(b, [a, b], ctx.living, branch === 'agreed-to-hide-it' ? 0
      : branch === 'told-one-person' ? 1 : 6);
    for (const to of heard) {
      api.propagate(factId, b, to,
        { channel: 'conversation', source: `word of ${a} and ${b} reached ${to}` });
    }
    const who = api.consensusPhrase({ factId,
      evidence: branch === 'the-room-said-it' ? 'public-ceremony' : null });
    const t = api.openArc(SHOWMANCE_KIND, [a, b], { source: sceneWhy,
      seed: lineFor(SHOWMANCE_FORM_LINES[branch], `romance-showmance-forms|${branch}|${ctx.ep}`,
        { a, b, who }) });
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], threadId: t?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 6). The audit: "one branch (`protected`) — the fork
// is in the wording, not in the game." Standing in front of somebody is the
// most consequential thing this family does, and it had exactly one outcome:
// it always worked and it always cost nothing.
//
// THE RECORD THE FORK READS is `ctx.state` — the emotional state the last
// Round Table left the protected partner in, which is a fact the whole castle
// watched being made — together with the defender's boldness and loyalty. A
// person the room came for last night is a person who actually needs
// defending, and a person who does not is somebody being defended in public
// for no reason, which is how a couple becomes a bloc.
//
//   protected      — it works, quietly, and the room moves on.
//   too-loud       — it works and it costs: the castle now reads them as one
//                    vote rather than two people.
//   asked-not-to   — the protected partner tells them to stop. THE DIRECTION
//                    FLIPS on this branch: {b} is speaking and {a} answers.
//   did-not-step-in— the defence does not come, and {b} counts the seconds it
//                    did not come in.
const PROTECT_LINES = {
  protected: [
    '{a} answers a question aimed at {b} before {b} can.\n{a}: "{b} was with me. Next."\n{b} (to camera): "{a} didn’t even let me speak. I didn’t mind."',
    '{a} puts {aRef} between {b} and a room that’s getting too interested in {bObj}.\n{a}: "Leave {b} out of this. You’ve got nothing."',
    '{a} shields {b} at the table.\n{b} (to camera): "{a} stepped in for me. I felt safe for the first time in days."',
    '{a} changes the subject away from {b}.\n{a}: "Can we talk about the actual evidence?"',
  ],
  'too-loud': [
    '{a} jumps in so fast for {b} that the table goes quiet.\n{b}: "Calm down."\n{a}: "I am calm!"',
    '{a} defends {b} so loudly that three people wonder why.\n{a}: "It is NOT {b}! Absolutely not!"\n{b} (to camera): "Too much, {a}. Way too much."',
    '{a} overdoes it.\n{a}: "I’ll bet my life on {b}!"\nThe room exchanges looks.',
    '{a} protests too much.\n{b}: "You’re not helping."',
  ],
  'asked-not-to': [
    '{b} pulls {a} aside.\n{b}: "Every time you defend me, they look at us both."\n{a}: "So I just sit there?"\n{b}: "Yes."',
    '{b} takes {a} aside afterwards.\n{b}: "Don’t do that for me again."\n{a}: "I was helping."\n{b}: "I know. That’s why."',
    '{b} asks {a} to stop defending {bObj}.\n{b}: "It makes us both look worse."',
    '{b} is kind about it.\n{b}: "Thank you. But please, don’t."',
  ],
  'did-not-step-in': [
    '{a} says nothing while {b} is questioned.\n{b}: "You didn’t say a word."\n{a}: "I couldn’t. You know I couldn’t."',
    '{b}’s name goes round the table, and {a} looks at the floor.\n{b} (to camera): "{a} didn’t say a word. Not one."',
    '{a} stays silent while {b} is attacked.\n{a} (to camera): "If I defend {b}, they come for me. I couldn’t."',
    '{a} lets {b} take it alone.\n{b}: "Thanks for nothing."\n{a}: "I’m sorry."',
  ],
};

registerEvent({
  id: 'romance-protection-instinct',
  family: FAMILY,
  window: 'dawn',
  // ACT: CLOSING. Standing in front of the vote for somebody is a late-season
  // shape: early nobody is close enough to the block for it to cost anything.
  acts: { early: 0.5, late: 1.7 },
  advancesThread: true,
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'backfire', 'rejected', 'ambiguous'],
    voice: ['boldness', 'loyalty', 'strategic'],
    relationship: ['close-ally'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-protection-instinct');
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    // THE FACT THE WHOLE CASTLE WATCHED BEING MADE. `ctx.state` is the frozen
    // view of what the last table did to {b}; read-only here.
    const underFire = isNervy(ctx.state?.[b]);
    const scores = {
      protected: 0.35 + (sa.loyalty / 10) * 0.3 + (underFire ? 0.25 : 0),
      'too-loud': (sa.boldness / 10) * 0.35 + (underFire ? 0 : 0.2),
      'asked-not-to': (sb.strategic / 10) * 0.3 + (sb.boldness / 10) * 0.15,
      'did-not-step-in': (sa.strategic / 10) * 0.25 + (1 - sa.loyalty / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'protected';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'too-loud' ? 'defended somebody loudly enough to make them a pair'
      : branch === 'asked-not-to' ? 'was asked to stop defending somebody'
        : branch === 'did-not-step-in' ? 'let it come at somebody and said nothing'
          : 'put themselves between somebody and the room';
    const note = lineFor(PROTECT_LINES[branch], `romance-protection-instinct|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'protected' ? 1
      : branch === 'too-loud' ? 0.5
        : branch === 'asked-not-to' ? -0.5 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id, note, { source: sceneWhy });
    const out = { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], threadId: advanced?.id, bondDelta };
    if (branch === 'protected' || branch === 'too-loud') {
      out.speaker = a; out.respondent = b;
      out.crowd = { name: a, colour: 'kind' };
    } else if (branch === 'asked-not-to') {
      // {b} is the one speaking, so {a} is the person answering for it.
      out.speaker = b; out.respondent = a;
    } else {
      out.speaker = b; out.respondent = a;
    }
    return out;
  },
});
const JEALOUSY_LINES = {
  'said-it-out-loud': [
    '{a} watches {b} laugh with {c} and says it.\n{a}: "You laugh more with {c} than with me."\n{b}: "Are you serious?"',
    '{a} doesn’t love how much time {b} spends with {c}, and says so.\n{a}: "You and {c} are very close."\n{b}: "We’re friends."\n{a}: "Are you?"',
    '{a} brings up {c}.\n{a}: "Every time I look round, you’re with {c}."',
    '{a} tells {b} it bothers {aObj}.\n{b}: "Are you jealous?"\n{a}: "…A bit."',
  ],
  'swallowed-it': [
    '{a} watches {b} and {c} and says nothing.\n{a} (to camera): "I’m fine. I’m absolutely fine."',
    '{a} watches {b} and {c} all evening and says nothing.\n{a} (to camera): "I’m not jealous. I’m just… watching."',
    '{a} keeps it in.\n{a} (to camera): "{b} and {c}. I don’t like it. I won’t say it."',
    '{a} pretends not to mind.\n{b}: "You okay?"\n{a}: "Fine!"',
  ],
  'made-it-strategy': [
    '{a} mentions {c} casually.\n{a}: "You spend a lot of time with {c}. Watch {c} at the table."\n{b}: "Is that about the game?"',
    '{a} tells {b} that {c} is worth watching, and about a third of it is strategy.\n{a}: "I don’t trust {c}."\n{b}: "Is that about the game?"\n{a}: "Mostly."',
    '{a} dresses up jealousy as suspicion.\n{a} (to camera): "Is {c} a Traitor? Maybe. Do I want {c} away from {b}? Definitely."',
    '{a} warns {b} off {c}.\n{a}: "Just be careful with {c}."',
  ],
  'went-to-them': [
    '{a} finds {c} alone.\n{a}: "Whatever you’re doing with {b}, stop."\n{c}: "I’m not doing anything."',
    '{a} takes it to {c}, in a corridor.\n{a}: "What’s going on with you and {b}?"\n{c}: "Nothing. Why?"\n{a}: "Keep it that way."',
    '{a} confronts {c}.\n{c} (to camera): "{a} warned me off. Seriously?"',
    '{a} has a word with {c}.\n{c}: "You’re being ridiculous."\n{a}: "Am I?"',
  ],
};

registerEvent({
  // ── REWRITE (Task 7 stage 5). One branch, one pool, fifth on the blame
  // table. The premise is right and the outcome was fixed: somebody was
  // always jealous and the bond always went down by one.
  //
  // FOUR THINGS THAT HAPPEN WHEN A THIRD PERSON GETS BETWEEN A COUPLE IN A
  // CASTLE, and only one of them is a row. The fork is the WATCHER’s, because
  // the person being watched has not done anything yet:
  //
  //   said-it-out-loud — it becomes a conversation, and conversations about
  //                      this cost something even when they go well.
  //   swallowed-it     — nothing is said, and it is still there in the morning.
  //   made-it-strategy — the jealousy is real and gets dressed up as a read on
  //                      the third person, which is the castle’s favourite
  //                      way of not saying a thing.
  //   went-to-them     — the watcher goes to the THIRD person rather than the
  //                      partner, which is a different scene entirely and the
  //                      one most likely to end badly for everybody.
  id: 'romance-jealousy-third-party',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'strategic'],
    relationship: ['romance', 'rival'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-jealousy-third-party');
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const third = pick(rng, others.length ? others : [a]);
    const sa = pStats(a);
    const scores = {
      'said-it-out-loud': (sa.boldness / 10) * 0.45 + (sa.social / 10) * 0.2,
      'swallowed-it': (1 - sa.boldness / 10) * 0.45 + (sa.temperament / 10) * 0.2,
      'made-it-strategy': (sa.strategic / 10) * 0.5 + (sa.mental / 10) * 0.15,
      'went-to-them': (sa.boldness / 10) * 0.3 + (1 - sa.temperament / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'swallowed-it' ? 'said nothing about it and did not stop noticing'
      : branch === 'made-it-strategy' ? 'turned being jealous into a read on somebody'
        : branch === 'went-to-them' ? 'took it to the third person instead of the partner'
          : 'a third person came between them';
    // `went-to-them` is the one branch whose cost lands somewhere other than
    // the couple, so it is the one that moves a different pair’s bond.
    const bondDelta = branch === 'said-it-out-loud' ? -1
      : branch === 'swallowed-it' ? -0.5 : branch === 'made-it-strategy' ? -1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    let thirdDelta = 0;
    if (branch === 'went-to-them') {
      thirdDelta = -2;
      api.addBond(a, third, thirdDelta, { source: sceneWhy });
    }
    const openedT = api.openArc(FAMILY, [a, b], { source: sceneWhy,
      seed: lineFor(JEALOUSY_LINES[branch], `romance-jealousy-third-party|${branch}|${ctx.ep}`,
        { a, b, c: third }) });
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b, third,
      threadId: openedT?.id, bondDelta, thirdDelta };
  },
});
// -- TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ------------
//
// One branch (`broke-up`), and every one of its five lines was the SAME
// break-up: loud, in front of people, over in a minute. That is one of the
// four ways this ends and it is the least common one. The four now are four
// different endings with four different costs, and only one of them is a
// scene. `faded-out` in particular is the honest majority case and the pool
// could not produce it.
//
// EVERY BRANCH STILL CLOSES THE SHOWMANCE. The fork is in how it ends and what
// it costs, never in whether it ended -- an event that sometimes declines to
// do the thing it is named for is the silent-branch defect the prose suite has
// a rule about.
const BREAKUP_LINES = {
  'broke-up': [
    '{a} and {b} end it on the stairs.\n{a}: "We’re a target together."\n{b}: "So that’s it?"\n{a}: "That’s it."',
    '{a} and {b} end it in front of enough people that it’s round the castle by lunch.\n{b}: "I can’t do this any more."\n{a}: "Fine. Then don’t."',
    '{a} and {b} split publicly.\n{a} (to camera): "Everyone saw. Everyone’s going to talk."',
    '{a} and {b} have a very public ending.\n{b}: "We’re done."\n{a}: "Clearly."',
  ],
  'faded-out': [
    '{a} sits at the other end of the table for the second day running.\n{b} (to camera): "Nobody said it’s over. It’s over."',
    'Nobody ends it. {a} and {b} just stop sitting together.\n{a} (to camera): "It sort of stopped. Nobody said anything."',
    '{a} and {b} drift apart.\n{b} (to camera): "We didn’t break up. We just stopped."',
    '{a} and {b} fade out.\n{a}: "We’re okay, right?"\n{b}: "Yeah. Course."',
  ],
  'ended-kindly': [
    '{a} and {b} talk it through by the window.\n{b}: "Still friends?"\n{a}: "Always."',
    '{a} and {b} end it properly, in private.\n{a}: "I think we should stop."\n{b}: "I think so too. Thank you for saying it first."',
    '{a} and {b} part as friends.\n{b} (to camera): "It was lovely. It just couldn’t last in here."',
    '{a} and {b} have a gentle goodbye.\n{a}: "Friends?"\n{b}: "Always."',
  ],
  'ended-in-strategy': [
    '{b} says it plainly.\n{b}: "I can’t be half of a pair when the numbers get small."\n{a}: "Right. Understood."',
    '{b} ends it because of what it’s costing at the table.\n{b}: "We’re a target. I can’t be a target."\n{a}: "So it’s the game."\n{b}: "It’s always the game."',
    '{b} puts the game first.\n{b} (to camera): "I liked {a}. I like winning more."',
    '{b} is blunt.\n{b}: "People think we’re a pair. That’s dangerous."',
  ],
};

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
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'social', 'strategic', 'loyalty'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-showmance-breakup');
    const sceneWhy = 'it ended between them';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sb = pStats(b);
    const scores = {
      'broke-up': (1 - sb.temperament / 10) * 0.5 + 0.15,
      'faded-out': (1 - sb.social / 10) * 0.4 + 0.25,
      'ended-kindly': (sb.loyalty / 10) * 0.4 + (sb.temperament / 10) * 0.3,
      'ended-in-strategy': (sb.strategic / 10) * 0.5 + (1 - sb.loyalty / 10) * 0.2,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'broke-up';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    api.resolveArc(t.id, 'broken-up', { source: sceneWhy });
    const bondDelta = branch === 'broke-up' ? -2
      : branch === 'faded-out' ? -0.5 : branch === 'ended-kindly' ? 1 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const residueThread = api.openArc(FAMILY, [a, b],
      { source: sceneWhy,
        seed: lineFor(BREAKUP_LINES[branch], `romance-showmance-breakup|${branch}|${ctx.ep}`, { a, b }) });
    // `{b}` is the one who ends it on three of the four; `faded-out` has
    // nobody driving it, and the pair order is the arc's own.
    const bEnds = branch !== 'faded-out';
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: bEnds ? b : a, respondent: bEnds ? a : b,
      threadId: residueThread?.id, bondDelta };
  },
});

// -- TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ------------
//
// One branch (`shield-pact`), in the thinnest window in the game. A couple
// agreeing to stand up for each other is only interesting because it is a bad
// idea, and the pool could not say so: three of the four branches now are the
// ways it goes wrong, and one of them is the couple deciding, correctly, that
// being seen to protect each other is what gets both of them written down.
const SHIELD_LINES = {
  'shield-pact': [
    '{a} and {b} whisper before lights out.\n{b}: "Anyone says your name, I speak."\n{a}: "And the same for you."',
    '{a} and {b} quietly agree: if either name comes up tomorrow, the other speaks first.\n{a}: "You’ve got me?"\n{b}: "I’ve got you."',
    '{a} and {b} make a pact in the dark.\n{b}: "Anyone says your name, I’m on my feet."',
    '{a} and {b} promise to protect each other.\n{a} (to camera): "Whatever happens tomorrow, I’m not alone."',
  ],
  'one-sided-pact': [
    '{a} promises, and {b} hesitates.\n{a}: "I’ve got you tomorrow."\n{b}: "I know you have."\n{a} (to camera): "That’s not the same thing, is it?"',
    '{a} promises to stand up for {b}. {b} says something warm that isn’t the same promise.\n{a}: "I’ll defend you. Will you defend me?"\n{b}: "You know I care about you."',
    '{a} notices what {b} didn’t say.\n{a} (to camera): "I promised. {b} didn’t. I heard the gap."',
    '{b} dodges the promise.\n{b}: "Let’s see what happens."',
  ],
  'agreed-to-be-strangers': [
    '{a} and {b} shake hands, very formally.\n{a}: "See you at the table. Stranger."\n{b}: "Stranger."',
    '{a} and {b} agree to be nothing in public tomorrow.\n{a}: "Don’t sit with me."\n{b}: "Don’t look at me."\n{a}: "It’s safer."',
    '{a} and {b} agree to keep apart.\n{b} (to camera): "Sensible. Horrible, but sensible."',
    '{a} and {b} make a painful plan.\n{a}: "Strangers till the table."\n{b}: "Strangers."',
  ],
  'refused-the-pact': [
    '{b} won’t promise.\n{a}: "Why not?"\n{b}: "Because I might have to break it."',
    '{b} won’t make the promise, and won’t explain.\n{a}: "Why not?"\n{b}: "I just can’t."\n{a} lies awake with that.',
    '{b} refuses.\n{a} (to camera): "{b} wouldn’t promise. What does that mean?"',
    '{b} turns {a} down gently.\n{b}: "Don’t ask me that. Please."',
  ],
};

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
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'strategic', 'boldness', 'temperament'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-shields-target-together');
    const sceneWhy = 'agreed to take the pressure off each other';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sb = pStats(b);
    const scores = {
      'shield-pact': (sb.loyalty / 10) * 0.5 + (sb.boldness / 10) * 0.25,
      'one-sided-pact': (1 - sb.loyalty / 10) * 0.35 + (1 - sb.boldness / 10) * 0.3,
      'agreed-to-be-strangers': (sb.strategic / 10) * 0.5 + (sb.mental / 10) * 0.25,
      'refused-the-pact': (1 - sb.loyalty / 10) * 0.4 + (sb.strategic / 10) * 0.25,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'shield-pact';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'shield-pact' ? 1
      : branch === 'one-sided-pact' ? -0.5
        : branch === 'agreed-to-be-strangers' ? 0.5 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id,
      lineFor(SHIELD_LINES[branch], `romance-shields-target-together|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: b, respondent: a,
      threadId: advanced?.id, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 6). The audit's verdict was MERGE into
// `cover-swap-story-with-partner` — "a couple synchronising an account is the
// swap event with a relationship on it" — and that premise now lives there as
// a branch. This event keeps its registration and earns it by being the half
// the swap event cannot do: the swap is two people AGREEING an account in
// private, and this is the account meeting the room. Once it is in the room it
// can hold, or be split, or fail, or be refused, and those are four scenes.
//
// THE RECORD THE FORK READS: the showmance arc's own beats — how many times
// these two have already answered for each other, which is exactly what makes
// the room start asking them separately — plus the two of them's mental and
// loyalty. An alibi given for the first time and an alibi given for the fourth
// time are not the same object, and the thread is where that is stored.
const SHARED_ALIBI_LINES = {
  'shared-alibi': [
    '{a} and {b} answer the same question in the same breath.\n{a}: "We were in my room."\n{b}: "In {aPos} room. All night."',
    '{a} and {b} vouch for each other’s whereabouts last night.\n{a}: "We were together all night."\n{b}: "All night."\nNobody asks if that makes it more or less convincing.',
    '{a} and {b} back each other up.\n{b}: "I was with {a}. The whole time."',
    '{a} and {b} give the same answer.\n{a} (to camera): "Our story’s simple. We were together."',
  ],
  'asked-separately': [
    '{a} and {b} get asked separately and give the same answer, down to the time.\n{a} (to camera): "Because it’s true. That’s how it works."',
    'Someone takes {a} and {b} into different rooms, and the two accounts come back identical.\n{a} (to camera): "Same story, because it’s true."',
    '{a} and {b} are questioned apart.\n{b}: "Ask {a}. {a} will say the same."',
    '{a} and {b} pass the separate-rooms test.\n{b} (to camera): "Nice try. We match."',
  ],
  'did-not-match': [
    '{a} and {b} are asked where they were and answer at once, differently.\n{a}: "The kitchen."\n{b}: "The stairs."\nSilence.',
    '{a} says the kitchen. {b} says the stairs.\n{a}: "The kitchen."\n{b}: "The stairs."\nBoth of them hear it.',
    '{a} and {b} give different answers.\n{a} (to camera): "That was bad. Very bad."',
    '{a} and {b} contradict each other in front of everyone.\n{b}: "I mean — we were — it doesn’t matter."',
  ],
  'refused-to-vouch': [
    '{b} is asked about {a} and hesitates.\n{b}: "I was asleep. I can only speak for me."\n{a} (to camera): "Thanks for that."',
    '{b} is asked whether {a} was there, and says {bSub} can’t swear to it.\n{b}: "I was asleep. I can’t say where {a} was."\n{a}: "Thanks a lot."',
    '{b} won’t vouch for {a}.\n{a} (to camera): "{b} left me hanging."',
    '{b} is honest.\n{b}: "I’m not going to lie for anyone."',
  ],
};

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
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire', 'rejected'],
    voice: ['mental', 'loyalty', 'temperament'],
    relationship: ['close-ally'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-shared-alibi');
    const show = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = show.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    // HOW MANY TIMES THEY HAVE DONE THIS, off the arc rather than out of the
    // air. The more often a couple have answered for each other, the likelier
    // the room is to separate them before asking again.
    const times = priorMoments(show, ctx.ep).length;
    const scores = {
      'shared-alibi': Math.max(0.15, 0.6 - times * 0.1),
      'asked-separately': Math.min(3, times) * 0.15 + (sa.mental / 10) * 0.15,
      'did-not-match': (1 - sa.mental / 10) * 0.3 + (1 - sb.mental / 10) * 0.2,
      'refused-to-vouch': (sb.loyalty / 10) * 0.25 + (sb.temperament / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'shared-alibi';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'asked-separately' ? 'gave the same account in two different rooms'
      : branch === 'did-not-match' ? 'gave two versions of the same evening'
        : branch === 'refused-to-vouch' ? 'would not swear to a partner’s evening'
          : 'a couple gave the same account of the night';
    const note = lineFor(SHARED_ALIBI_LINES[branch], `romance-shared-alibi|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'shared-alibi' ? 0.5
      : branch === 'asked-separately' ? 1
        : branch === 'did-not-match' ? -1 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    const out = { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], threadId: thread?.id, cited, bondDelta };
    // WHO ANSWERS depends on which way the account failed: on the two branches
    // where {b} is the one being leaned on it is {a} asking, and on the refusal
    // it is {b} speaking and {a} left holding it.
    if (branch === 'refused-to-vouch') { out.speaker = b; out.respondent = a; }
    else { out.speaker = a; out.respondent = b; }
    return out;
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
    '{a} leans on {b}’s shoulder at dinner without a second thought.\n{a} (to camera): "{b} is the one thing in here I don’t worry about."',
    '{a} tells {b} everything, as usual.\n{a}: "You’re the only one I trust in here."\n{b}: "I know."',
    '{a} spends the day next to {b} and never once feels the ground shift.\n{a} (to camera): "{b} and me are solid. I don’t worry about {bObj}."',
    '{a} trusts {b} completely.\n{a}: "You’re the one person I don’t doubt."\n{b}: "Good."',
  ],
  suspicious: [
    '{a} watches {b} a little longer than usual at breakfast.\n{b}: "What?"\n{a}: "Nothing. You look tired."',
    '{a} replays something {b} said last night.\n{a} (to camera): "It was one sentence. It’s been in my head all day."',
    'Something about {b} has started to sit wrong with {a}.\n{a} (to camera): "I can’t put my finger on it. But something’s off."',
    '{a} watches {b} a bit more carefully.\n{a} (to camera): {cam:unsure-info}',
  ],
  confronts: [
    '{a} closes the bedroom door behind {b}.\n{a}: "I need you to be honest with me."\n{b}: "About what?"\n{a}: "You know about what."',
    '{a} asks {b} quietly at the window.\n{a}: "If you were one of them, would you tell me?"\n{b}: "I’m not one of them."',
    '{a} asks {b}, privately and directly.\n{a}: "Is there something I need to know?"\n{b}: "Like what?"\n{a}: "You tell me."',
    '{a} takes {b} aside.\n{a}: "Look me in the eye and tell me you’re Faithful."\n{b}: "I’m Faithful."',
  ],
  // REWRITTEN FOR `night` (round 2, R2). These two lines used to put the
  // doubter on their feet AT THE ROUND TABLE, which is the only thing that
  // held this event in `after-table` - and holding it there was costing all
  // four of its branches. Said out loud in a corridor at two in the morning
  // with the house waking up is the same public act, and it is a better one:
  // the person hears it from them, not from the room.
  exposes: [
    '{a} stands up at two in the morning and says it loud enough for the corridor.\n{a}: "I think {b} is a Traitor."\n{b}: "You don’t mean that."',
    '{a} says it where people can hear.\n{a}: "I can’t protect you if you’re lying to me."\n{b}: "I’m not lying!"',
    '{a} turns on {b} in front of two others.\n{a}: "I trusted you more than anyone. That’s why I can see it."\n{b} (to camera): "The one person I thought was safe."',
    '{a} says the name out loud, and it’s {b}’s.\n{a} (to camera): "It broke my heart to say it. I said it anyway."',
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
  '{b} now has to explain, to {who}, why the one person who knows them best said that out loud.',
  'By breakfast {who} will have it. {b} has until breakfast.',
];

registerEvent({
  id: 'romance-liability-exposed',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected', 'backfire'],
    voice: ['boldness', 'intuition', 'loyalty'],
    relationship: ['romance'],
  },
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

    const line = pronounSlots(pick(rng, LIABILITY_LINES[branch]), { a: doubter, b: suspected })
      .replace(/\{a\}/g, doubter).replace(/\{b\}/g, suspected);
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
      // ── "BY BREAKFAST THE WHOLE CASTLE WILL HAVE IT" NEEDED A COUNT ──
      //
      // The exposure happens in front of the room, so the people present are
      // licensed to know it outright — that is the `public-ceremony` evidence
      // the consensus rule accepts. Everybody NOT present learns it the
      // ordinary way, one named hop at a time, and the sentence takes its
      // words from the receipts rather than from the author's sense of scale.
      const exposureId = api.recordClaim(doubter,
        `${doubter} named ${suspected} in front of the room`,
        { about: suspected, listeners: [suspected], channel: 'public-ceremony',
          source: sceneWhy }).id;
      for (const to of whoTheyTold(doubter, [doubter, suspected], ctx.living, 6)) {
        api.propagate(exposureId, doubter, to,
          { channel: 'conversation', source: `${to} heard what was said about ${suspected}` });
      }
      const who = api.consensusPhrase({ factId: exposureId });
      const coverThread = api.openArc('cover', [suspected],
        { source: sceneWhy, seed: `${line}${line.includes('\n') ? '\n' : ' '}${lineFor(EXPOSED_AFTERMATH_LINES, `romance-liability-exposed|exposes|${ctx.ep}`,
          { a: doubter, b: suspected, who })}` });
      threadId = coverThread?.id ?? threadId;
    }
    // GROUNDED (once-skipped) as a SUSPICION READ, not a partner pair: the
    // subject is the doubted partner, and the close names them and says which
    // way the doubt went. speaker=doubter fixes the hunch chip's observer.
    return { branch, doubter, suspected, speaker: doubter, respondent: suspected,
      topic: suspected, topicKind: 'romance-suspicion', threadId, bondDelta };
  },
});

// ── REWRITE (Task 7 stage 6). Third on the blame table after batch 1. The
// audit: "one branch (`showmance-fight`) — the fork is in the wording, not in
// the game." A couple in a castle has more than one way to have a row, and the
// differences between them are the whole of what a viewer takes from the
// scene: a loud one is entertainment, a quiet one is a countdown, and one that
// is really about a ballot is a strategy problem wearing a relationship.
//
// THE RECORD THE FORK READS: the showmance arc's heat (how live this has been
// for the last few days), both temperaments, and `ctx.state` — whether the
// last Round Table left either of them rattled, which is the single commonest
// reason two people in here turn on each other.
//
//   showmance-fight — loud, public, and the castle pretends not to hear it.
//   went-cold       — no shouting at all, which is worse and lasts longer.
//   about-the-vote  — the argument is about a name, and the relationship is
//                     just where it is being held.
//   patched-it      — they have it out and put it back together the same
//                     night, which is rarer here than a break-up.
const FIGHT_LINES = {
  'showmance-fight': [
    '{a} and {b} argue in whispers, then not in whispers.\n{b}: "Keep your voice down."\n{a}: "Why? They can all hear us anyway!"',
    '{a} and {b} have a real fight, loud enough that the room pretends not to notice.\n{b}: "You always do this!"\n{a}: "Do what?"\n{b}: "Make everything about you!"',
    '{a} and {b} row in the kitchen.\n{a} (to camera): "Everyone heard. Of course they did."',
    '{a} and {b} have their first proper fight.\n{b}: "I need some space."\n{a}: "Fine!"',
  ],
  'went-cold': [
    '{a} and {b} sit apart at dinner.\n{a}: "Pass the bread, please."\n{b}: "Here."\n{a} (to camera): "Very polite. Very cold."',
    'There’s no shouting. {a} and {b} are extremely polite for four hours.\n{a}: "Could you pass the salt, please?"\n{b}: "Of course."\nEveryone at the table winces.',
    '{a} and {b} go icy.\n{b} (to camera): "We’re not fighting. We’re just not talking."',
    '{a} and {b} are frostily civil.\n{a}: "Goodnight."\n{b}: "Goodnight."',
  ],
  'about-the-vote': [
    '{a} finds out how {b} voted.\n{a}: "You didn’t even warn me."\n{b}: "It was my vote."',
    'It looks like a lovers’ row. It’s really about a name.\n{a}: "You wrote them down. You didn’t tell me."\n{b}: "I don’t have to tell you everything."',
    '{a} and {b} argue about the vote.\n{b} (to camera): "It’s not about us. It’s about the game."',
    '{a} and {b} disagree on who goes.\n{a}: "We should be voting together."\n{b}: "Says who?"',
  ],
  'patched-it': [
    '{a} knocks on {b}’s door before bed.\n{a}: "I was wrong earlier."\n{b}: "So was I. Come in."',
    '{a} and {b} have it out properly, then put it back together the same night.\n{b}: "I’m sorry."\n{a}: "Me too. Come here."',
    '{a} and {b} make up before bed.\n{a} (to camera): "Silly row. We’re fine."',
    '{a} and {b} fix it.\n{b}: "Never go to bed angry."\n{a}: "Especially not in here."',
  ],
};

registerEvent({
  id: 'romance-showmance-fight',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  rare: true,
  variationAxes: {
    outcome: ['backfire', 'ambiguous', 'rejected', 'accepted'],
    voice: ['temperament', 'strategic', 'loyalty'],
    relationship: ['close-ally'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-showmance-fight');
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    // HOW LIVE THIS HAS BEEN, and what the last table did to them. Both stored.
    const heat = heatAt(t, ctx.ep);
    const rattled = isNervy(ctx.state?.[a]) || isNervy(ctx.state?.[b]);
    const scores = {
      'showmance-fight': (1 - sa.temperament / 10) * 0.35 + (1 - sb.temperament / 10) * 0.25,
      'went-cold': (sa.temperament / 10) * 0.3 + (sb.temperament / 10) * 0.2,
      'about-the-vote': (sa.strategic / 10) * 0.25 + (rattled ? 0.35 : 0),
      'patched-it': (sa.loyalty / 10) * 0.2 + (sb.loyalty / 10) * 0.2 + heat * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'showmance-fight';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'went-cold' ? 'stopped speaking to each other for an evening'
      : branch === 'about-the-vote' ? 'fell out over a name rather than over each other'
        : branch === 'patched-it' ? 'had it out and put it back the same night'
          : 'they had it out in front of people';
    const note = lineFor(FIGHT_LINES[branch], `romance-showmance-fight|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'showmance-fight' ? -1.5
      : branch === 'went-cold' ? -2
        : branch === 'about-the-vote' ? -1 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id, note, { source: sceneWhy });
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b,
      threadId: advanced?.id, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit's verdict was MERGE into
// `romance-liability-exposed` — "the room pricing the couple is what
// liability-exposed already forks on" — and it noted the worse half: this
// event wrote NO EFFECTS AT ALL. It printed a sentence and nothing about the
// season was different afterwards, which is the same defect stage 5 found in
// `cover-preemptive-alibi`.
//
// It keeps its registration and earns it on the same reasoning as the other
// two merges in this file: `romance-liability-exposed` is about what one
// PARTNER comes to think, and this is about what the ROOM says out loud, which
// is a different scene with a different victim. The room saying it is now a
// thing that happens TO the couple rather than a caption on them.
//
// THE RECORD THE FORK READS: how many people are left (a castle of six prices
// a couple much harder than a castle of sixteen), the showmance arc's own
// length, and the two of them's strategic and temperament. All looked up.
const OPTICS_LINES = {
  'called-strategic': [
    'Someone calls {a} and {b} a voting bloc at dinner.\n{a}: "We’re not a bloc."\n{b}: "We’re a couple. Different thing."',
    'Somebody points out that {a} and {b} getting together is awfully convenient.\n{a}: "It’s not strategic."\n{b}: "It’s really not."\nNobody looks convinced.',
    '{who} call it a strategic alliance.\n{b} (to camera): "Now everyone thinks we’re a voting bloc with a kiss on top."',
    '{a} and {b} get accused of playing a game with it.\n{a}: "Can’t people just like each other?"',
  ],
  'made-a-joke-of-it': [
    '{a} bows to the table.\n{a}: "Yes, it’s all strategy. The flowers were strategy too."\nThe table laughs.',
    '{a} gets in front of it by saying it first, and worse.\n{a}: "Yes, it’s all a long con. I’m a genius."\nThe room laughs and lets it go.',
    '{a} jokes it away.\n{a}: "If this is strategy, it’s terrible strategy."',
    '{a} laughs it off.\n{b} (to camera): "{a} disarmed the whole room in one sentence."',
  ],
  'leaned-into-it': [
    '{a} and {b} walk into dinner hand in hand, on purpose.\n{b}: "If they think we’re a team, let them be scared of it."',
    '{a} and {b} stop denying it’s strategic and start using it.\n{a}: "So what if we’re a pair? Two votes."\n{b}: "Two votes."',
    '{a} and {b} embrace the power-couple label.\n{a} (to camera): "If they’re scared of us, good."',
    '{a} and {b} own it.\n{b}: "We’re together. Deal with it."',
  ],
  'it-landed-inside': [
    '{a} lies awake with what the room said.\n{a} (to camera): "What if they’re right? What if I’m just useful?"',
    'The room says it about {a} and {b}, and by evening {a} wonders if it’s true.\n{a} (to camera): "Is {b} with me because {bSub} likes me? Or because I’m useful?"',
    '{a} starts doubting {b}.\n{a}: "Would you still be with me if my name came up at the table?"\n{b}: "Of course. Why?"',
    '{a} can’t shake the idea.\n{a} (to camera): {cam:unsure-info}',
  ],
};

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
  variationAxes: {
    outcome: ['backfire', 'accepted', 'ambiguous', 'rejected'],
    voice: ['strategic', 'social', 'temperament'],
    relationship: ['close-ally'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-strategic-optics');
    const showmance = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep);
    const [a, b] = showmance.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    // HOW SMALL THE ROOM IS AND HOW OLD THE COUPLE IS. A castle with six
    // people in it can afford to price a bloc; one with sixteen cannot be
    // bothered. Both read, neither assumed.
    const room = (ctx.living || []).length;
    const age = priorMoments(showmance, ctx.ep).length;
    const scores = {
      'called-strategic': 0.45 + Math.max(0, 12 - room) * 0.04,
      'made-a-joke-of-it': (sb.social / 10) * 0.35,
      'leaned-into-it': (sa.strategic / 10) * 0.3 + Math.min(3, age) * 0.08,
      'it-landed-inside': (1 - sa.temperament / 10) * 0.3 + Math.max(0, 10 - room) * 0.02,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'called-strategic';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'made-a-joke-of-it' ? 'got in front of the accusation by saying it first'
      : branch === 'leaned-into-it' ? 'stopped denying the couple was a bloc'
        : branch === 'it-landed-inside' ? 'took the room’s reading of the couple home with them'
          : 'the room read the couple as a strategy';
    // ── WHO ACTUALLY SETTLED IT (writing-contracts.md, "Evidence for group
    //    consensus") ─────────────────────────────────────────────────────
    //
    // The `called-strategic` branch is the room pricing the couple, and one of
    // its lines used to say the CASTLE had decided. The reading is a claim
    // somebody made and then repeated, so it is recorded as one and propagated
    // to named people; `{who}` then takes its words from the receipts. The
    // sibling lines in this pool already do the honest version by hand ("three
    // people had repeated it without the lightness"), which is what made the
    // odd one out visible.
    let who = 'a few of them';
    if (branch === 'called-strategic') {
      const readingId = api.recordClaim(a, `${a} and ${b} are being read as one vote`,
        { about: b, listeners: [b], channel: 'conversation', source: sceneWhy }).id;
      for (const to of whoTheyTold(a, [a, b], ctx.living, 4)) {
        api.propagate(readingId, a, to,
          { channel: 'conversation', source: `${to} heard the couple priced as a bloc` });
      }
      who = api.consensusPhrase({ factId: readingId });
    }
    const note = lineFor(OPTICS_LINES[branch], `romance-strategic-optics|${branch}|${ctx.ep}`,
      { a, b, who });
    // AND IT WRITES SOMETHING NOW, which is the defect the audit recorded
    // separately from the branch count. Every branch moves the bond, because
    // being priced by a room is a thing that happens to two people together.
    const bondDelta = branch === 'made-a-joke-of-it' ? 0.5
      : branch === 'leaned-into-it' ? 1
        : branch === 'it-landed-inside' ? -1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "one branch (`grief-spark`) — the
// fork is in the wording, not in the game." It is also the family's only
// bridge from grief into romance, so the single outcome meant the castle had
// exactly one way of turning a death into a relationship.
//
// COMFORT AFTER A DEATH DOES NOT ALWAYS TURN INTO SOMETHING, and the version
// where it does not is the more interesting scene about half the time. So this
// forks on what the comfort BECOMES, and one of the four deliberately does not
// open a spark at all — it opens a trust arc instead, which is stage 5's
// `romance-road-spark:walked-it-off` precedent and the reason that branch
// exists: a family that can only produce romance produces romance where a
// season needed a friendship.
//
// THE RECORD THE FORK READS: how many people this castle has actually lost
// (counted off the rounds, not asserted), the stored bond, and the two of
// them's temperament and boldness.
const GRIEF_SPARK_LINES = {
  'grief-spark': [
    '{a} finds {b} on the stairs and sits down beside {bObj}.\n{b}: "I can’t stop thinking about last night."\n{a}: "Then don’t think. Just sit."',
    '{a} and {b} lean on each other after last night, and it turns into something else.\n{b}: "I’m glad you’re still here."\n{a}: "Me too. You, I mean."',
    'Comfort becomes something more.\n{a} (to camera): "Last night was awful. Then this happened. I don’t know."',
    '{a} and {b} hold each other a little too long.\n{b}: "Is this okay?"\n{a}: "Yes."',
  ],
  'just-comfort': [
    '{b} makes {a} a tea and sits with {aObj} until it goes cold.\n{a}: "Thank you."\n{b}: "You don’t have to say anything."',
    '{a} sits with {b} until it’s light, and that’s all.\n{b}: "Thank you for staying."\n{a}: "Where else would I be?"',
    '{a} comforts {b} through the night.\n{b} (to camera): "{a} didn’t leave. I won’t forget that."',
    '{a} holds {b}’s hand while {bSub} cries.\n{a}: "It’s okay. Let it out."',
  ],
  'too-soon': [
    '{a} and {b} nearly kiss, and {b} stops.\n{b}: "Not today. Not like this."\n{a}: "No. You’re right."',
    'It gets as far as a hand on an arm.\n{b}: "Not like this."\n{a}: "No. You’re right."',
    '{b} pulls back.\n{b} (to camera): "Grief makes you do things. I didn’t want it to be that."',
    '{a} and {b} stop themselves.\n{a}: "Sorry."\n{b}: "Don’t be. Just — not tonight."',
  ],
  'the-room-noticed': [
    '{a} and {b} come down to breakfast together, and the table goes quiet.\n{b}: "Morning."\nNobody answers for a second.',
    'Nobody meant it to be a scene. The castle has it by breakfast.\n{a}: "They’re all looking at us."\n{b}: "Of course they are."',
    '{a} and {b} are spotted.\n{b} (to camera): "Six in the morning. Someone walked in. Brilliant."',
    '{a} and {b} get caught holding each other.\n{a}: "It’s not what it looks like."\n{b}: "It’s a bit what it looks like."',
  ],
};

registerEvent({
  id: 'romance-comfort-after-loss-sparks',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['temperament', 'boldness', 'loyalty'],
    relationship: ['close-ally', 'neutral'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-comfort-after-loss-sparks');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    // HOW MANY THIS CASTLE HAS ACTUALLY LOST, counted off the stored rounds.
    // The fourth body is not the first body, and a room that has been doing
    // this for a week comforts differently and watches more closely.
    const lost = (gs.tr?.rounds || []).filter(r => r.murdered || r.banished).length;
    const scores = {
      'grief-spark': 0.3 + (sa.boldness / 10) * 0.25 + Math.max(0, bond - 1) * 0.06,
      'just-comfort': (sa.loyalty / 10) * 0.3 + (sb.loyalty / 10) * 0.2,
      'too-soon': (sb.temperament / 10) * 0.3 + Math.max(0, 3 - lost) * 0.08,
      'the-room-noticed': Math.min(4, lost) * 0.09 + (1 - sa.temperament / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'grief-spark';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'just-comfort' ? 'sat with somebody until it was light and left it there'
      : branch === 'too-soon' ? 'stopped it before it started, and both of them knew why'
        : branch === 'the-room-noticed' ? 'was found at six in the morning by somebody who did not knock'
          : 'comfort after a death turned into something else';
    const note = lineFor(GRIEF_SPARK_LINES[branch],
      `romance-comfort-after-loss-sparks|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'grief-spark' ? 1.5
      : branch === 'just-comfort' ? 2
        : branch === 'the-room-noticed' ? 0.5 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // THE BRANCH THAT DOES NOT MAKE A ROMANCE. `just-comfort` opens a TRUST
    // arc instead of a spark, so the season carries a friendship out of the
    // morning rather than a couple — the same move stage 5 made with
    // `romance-road-spark:walked-it-off`, and the reason this family stopped
    // being a machine that turns every close pair into a showmance.
    const kind = branch === 'just-comfort' ? 'trust' : SPARK_KIND;
    const t = api.openArc(kind, [a, b], { source: sceneWhy, seed: note });
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b,
      threadId: t?.id, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// THE ROAD, WHICH THIS FAMILY HAD NEVER BEEN ON
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED 2026-09-05 across the window x family grid: romance held evening 3,
// dawn 2, morning 2, night 2, after-table 1 — and JOURNEY-OUT 0, JOURNEY-BACK
// 0. Two people in this castle could fall for each other at breakfast, at
// dinner, at midnight and after a banishment, and then walk five miles beside
// each other twice a day with nothing to say.
//
// The road is the format's best romantic setting and the one it never used: a
// mission is the only hour of the day the castle spends OUTSIDE, in daylight,
// with a legitimate reason to be paired off and no round table at the end of
// it. It is also the only place a showmance is unavoidably PUBLIC — everybody
// can see who walked with whom for an hour, which is exactly the liability
// this family is built on.
//
// All four gate on a thread that already exists, so none of them can create a
// pairing and none needs the concurrency cap; all four declare `rare: true`,
// which is the guard-2 rule the file's own header records this family
// breaking once already.

// ── romance-walked-together ─────────────────────────────────────────────
const WALKED_LINES = {
  'walked-the-whole-way': [
    '{a} and {b} walk the whole way side by side.\n{a}: "You’re a good walking partner."\n{b}: "I’m a good everything partner."',
    '{a} and {b} walk out together and back together.\n{b}: "Same again tomorrow?"\n{a}: "Obviously."',
    '{a} and {b} don’t swap partners once.\n{a} (to camera): "Best walk of the week."',
    '{a} and {b} stick together all day.\n{b}: "People are going to talk."\n{a}: "They’re already talking."',
  ],
  'kept-apart-on-purpose': [
    '{a} and {b} walk at opposite ends of the line and keep looking back.\n{b} (to camera): "Very subtle. Nobody’s fooled."',
    '{a} and {b} walk at opposite ends of the line, which fools nobody.\n{b} (to camera): "Very subtle. We’re fooling nobody."',
    '{a} and {b} deliberately keep apart.\n{a}: "Don’t walk with me."\n{b}: "I wasn’t going to."',
    '{a} and {b} avoid each other in public.\n{a} (to camera): "It’s killing me. But it’s smart."',
  ],
  'the-column-saw-it': [
    '{a} and {b} walk close, and someone behind them coughs.\n{a}: "We’re being watched."\n{b}: "We’re always being watched."',
    'Somebody walks behind {a} and {b} for a mile and says nothing.\n{a}: "Were they listening?"\n{b}: "Probably."',
    '{a} and {b} are watched on the road.\n{b} (to camera): "There’s no privacy in here. None."',
    '{a} and {b} get an audience.\n{a}: "Awkward."',
  ],
  'first-hour-alone': [
    '{a} and {b} slow down until the others are specks.\n{b}: "An hour. Just us."\n{a}: "Don’t waste it."',
    'It’s the only hour this week {a} and {b} have had without a room round them.\n{b}: "Finally."\n{a}: "Finally."',
    '{a} and {b} make the most of it.\n{a} (to camera): "One hour. No eyes. Heaven."',
    '{a} and {b} talk properly, alone.\n{b}: "I’ve wanted to say this all week."',
  ],
};

registerEvent({
  id: 'romance-walked-together',
  family: FAMILY,
  window: 'journey-out',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // Either stage: a spark walks the road as readably as a showmance does.
    return (_threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep)
      || _threadForActors(SPARK_KIND, ctx.actors, ctx.ep)) ? 1.6 : 0;
  },
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['boldness', 'social', 'strategic', 'temperament'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-walked-together');
    const sceneWhy = 'spent the road out beside each other, in front of everybody';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep)
      || _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'walked-the-whole-way': (sa.boldness / 10) * 0.35 + (sb.boldness / 10) * 0.2,
      'kept-apart-on-purpose': ((sa.strategic + sb.strategic) / 20) * 0.45,
      // Needs a column big enough to hold a witness.
      'the-column-saw-it': (ctx.living || []).length >= 7 ? 0.4 : 0.1,
      'first-hour-alone': ((sa.temperament + sb.temperament) / 20) * 0.3 + 0.1,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0) || 1;
    let roll = rng() * total;
    let branch = 'walked-the-whole-way';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'first-hour-alone' ? 2
      : branch === 'walked-the-whole-way' ? 1
        : branch === 'kept-apart-on-purpose' ? -0.5 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id,
      lineFor(WALKED_LINES[branch], `romance-walked-together|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    // WHAT THE COUNTRY MAKES OF IT. A romance played in the open is the single
    // most watchable thing in this format and the crowd map pays it as
    // spectacle rather than as affection.
    let crowd = null;
    if (branch === 'walked-the-whole-way') crowd = { name: a, colour: 'exposed', reason: 'spent a whole road beside the same person, in front of everybody', mult: 0.5 };
    else if (branch === 'the-column-saw-it') crowd = { name: b, colour: 'exposed', reason: 'stopped being a secret somewhere on the road', mult: 0.5 };
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b,
      threadId: advanced?.id, bondDelta, ...(crowd ? { crowd } : {}) };
  },
});

// ── romance-carried-them-home ───────────────────────────────────────────
// The road back, after a mission has taken something out of somebody. The
// fork is whether the help is given as a partner or performed as a player.
const CARRIED_LINES = {
  'took-care-of-them': [
    '{a} takes {b}’s bag without asking.\n{b}: "I can carry that."\n{a}: "I know you can."',
    '{b} is finished by the end of the afternoon, and {a} gets {bObj} home without making a thing of it.\n{a}: "Lean on me."\n{b}: "Thank you."',
    '{a} helps {b} home quietly.\n{b} (to camera): "{a} carried me, basically. I won’t forget it."',
    '{a} takes {b}’s bag.\n{a}: "Give it here."\n{b}: "You’re a star."',
  ],
  'made-a-performance-of-it': [
    '{a} carries {b}’s bag where everyone can see.\n{a}: "Nobody carries their own bag on my watch!"\n{b}: "Nobody asked you to."',
    '{a} helps {b} home very visibly.\n{a}: "Everyone, make way!"\n{b} (to camera): "Sweet. Also a bit much."',
    '{a} makes a show of it.\n{b}: "I can walk, you know."\n{a}: "I know. People are watching."',
    '{a} helps loudly.\n{b} (to camera): "Half kindness, half performance."',
  ],
  'let-them-struggle': [
    '{b} drops behind and {a} doesn’t wait.\n{b}: "Thanks a lot."\n{a}: "You told me you were fine."',
    '{b} falls back on the road, and {a} stays exactly where {aSub} was.\n{b} (to camera): "{a} didn’t even look back."',
    '{a} doesn’t help {b}.\n{b}: "Wait for me?"\n{a}: "Keep up."',
    '{a} leaves {b} behind.\n{b} (to camera): "So that’s how it is."',
  ],
  'they-refused-it': [
    '{a} reaches for {b}’s bag and {b} pulls it away.\n{b}: "Don’t. Not in front of everyone."\n{a}: "Fine."',
    '{a} tries to take it off {b}, and {b} won’t have it.\n{b}: "I’m fine. I don’t need saving."\n{a}: "I was only—"\n{b}: "I know."',
    '{b} refuses help in front of six people.\n{a} (to camera): "Proud. Too proud."',
    '{b} pushes {a} away.\n{b}: "Not in front of everyone."',
  ],
};

registerEvent({
  id: 'romance-carried-them-home',
  family: FAMILY,
  window: 'journey-back',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    if ((ctx.ep || 0) < 2) return 0;
    return (_threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep)
      || _threadForActors(SPARK_KIND, ctx.actors, ctx.ep)) ? 1.6 : 0;
  },
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['loyalty', 'social', 'strategic', 'boldness'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-carried-them-home');
    const sceneWhy = 'got them home off the road, or did not';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep)
      || _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'took-care-of-them': (sa.loyalty / 10) * 0.45 + (1 - sa.social / 10) * 0.15,
      'made-a-performance-of-it': (sa.social / 10) * 0.35 + (sa.strategic / 10) * 0.25,
      'let-them-struggle': (1 - sa.loyalty / 10) * 0.35 + (sa.strategic / 10) * 0.2,
      'they-refused-it': (sb.boldness / 10) * 0.3 + (1 - sb.social / 10) * 0.2,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0) || 1;
    let roll = rng() * total;
    let branch = 'took-care-of-them';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'took-care-of-them' ? 2.5
      : branch === 'made-a-performance-of-it' ? 0.5
        : branch === 'they-refused-it' ? -1 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id,
      lineFor(CARRIED_LINES[branch], `romance-carried-them-home|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    let crowd = null;
    if (branch === 'took-care-of-them') crowd = { name: a, colour: 'kind', reason: 'got somebody home off a road without making anything of it', mult: 0.6 };
    else if (branch === 'made-a-performance-of-it') crowd = { name: a, colour: 'selfish', reason: 'made a performance out of looking after somebody', mult: 0.5 };
    else if (branch === 'let-them-struggle') crowd = { name: a, colour: 'cowardly', reason: 'left the person they are closest to at the back of the column', mult: 0.5 };
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b,
      threadId: advanced?.id, bondDelta, ...(crowd ? { crowd } : {}) };
  },
});

// ── romance-voted-differently ───────────────────────────────────────────
// The one thing this family has that no other pairing in the castle does: two
// people who are supposed to be on the same side, and a public record of
// whether they were. `after-table` held ONE romance event before this.
const VOTED_LINES = {
  'wrote-the-same-name': [
    '{a} and {b} turn their slates at the same moment. Same name.\n{b}: "Great minds."\n{a}: "Or matching mistakes."',
    '{a} and {b} turn over the same name without needing to look at each other.\n{b}: "Great minds."\n{a}: "Or matching mistakes."',
    '{a} and {b} vote together.\n{a} (to camera): "Same name. We didn’t even plan it."',
    '{a} and {b} are in sync.\n{b}: "Knew you’d write that."',
  ],
  'wrote-different-names': [
    '{a} sees {b}’s slate and stops smiling.\n{a}: "You didn’t tell me."\n{b}: "You didn’t ask."',
    '{a} writes one name and {b} writes another, and the whole room watches.\n{a}: "You didn’t tell me."\n{b}: "You didn’t ask."',
    '{a} and {b} split their votes.\n{b} (to camera): "We don’t have to agree on everything."',
    '{a} and {b} vote differently.\n{a}: "So what was that?"\n{b}: "My vote."',
  ],
  'covered-for-them': [
    '{a} writes a name nobody else writes, so {b}’s name stays alone.\n{b}: "What was that vote?"\n{a}: "That was for you."',
    '{a} votes somewhere useless so that {b}’s name doesn’t need company.\n{a} (to camera): "Wasted vote. Worth it."',
    '{a} throws a vote to keep attention off {b}.\n{b}: "Why did you write that?"\n{a}: "For you."',
    '{a} sacrifices {aPos} vote for {b}.\n{a} (to camera): "Nobody will understand that vote. {b} will."',
  ],
  'one-of-them-was-in-danger': [
    '{a} watches {b}’s name come up three times.\n{a} (to camera): "Every time it came up I stopped breathing."',
    '{b}’s name is in the air all evening, and {a} has to sit there and hear it.\n{a} (to camera): "Horrible. I just had to sit there."',
    '{a} watches {b} get votes.\n{a}: "You’re still here."\n{b}: "Just."',
    '{a} squeezes {b}’s hand under the table.\n{b} (to camera): "That was close. Too close."',
  ],
};

registerEvent({
  id: 'romance-voted-differently',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return (_threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep)
      || _threadForActors(SPARK_KIND, ctx.actors, ctx.ep)) ? 1.8 : 0;
  },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'boldness', 'temperament'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-voted-differently');
    const sceneWhy = 'found out at the table what the other one had written';
    const t = _threadForActors(SHOWMANCE_KIND, ctx.actors, ctx.ep)
      || _threadForActors(SPARK_KIND, ctx.actors, ctx.ep);
    const [a, b] = t.parties;
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      'wrote-the-same-name': ((sa.loyalty + sb.loyalty) / 20) * 0.4 + Math.max(0, bond) * 0.04,
      'wrote-different-names': ((sa.strategic + sb.strategic) / 20) * 0.35,
      'covered-for-them': (sa.loyalty / 10) * 0.3 + (sa.boldness / 10) * 0.2,
      'one-of-them-was-in-danger': 0.3,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0) || 1;
    let roll = rng() * total;
    let branch = 'wrote-the-same-name';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'wrote-the-same-name' ? 1.5
      : branch === 'covered-for-them' ? 2
        : branch === 'one-of-them-was-in-danger' ? 1 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const advanced = api.advanceArc(t.id,
      lineFor(VOTED_LINES[branch], `romance-voted-differently|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    let crowd = null;
    if (branch === 'covered-for-them') crowd = { name: a, colour: 'selfless', reason: 'spent a vote keeping somebody else out of danger', mult: 0.5 };
    else if (branch === 'wrote-the-same-name') crowd = { name: a, colour: 'exposed', reason: 'voted as a pair in front of a room that can count', mult: 0.4 };
    return { branch, topic: b, topicKind: 'romance-bond', pair: [a, b], speaker: a, respondent: b,
      threadId: advanced?.id, bondDelta, ...(crowd ? { crowd } : {}) };
  },
});
