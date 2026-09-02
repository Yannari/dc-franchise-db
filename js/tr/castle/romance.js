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

import { lineFor, whoTheyTold } from './lines.js';

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
    '{a} and {b} sat closer than the conversation strictly required, and both of them noticed.',
    'Something shifted between {a} and {b} tonight that had nothing to do with the game.',
    '{a} caught {b}’s eye across the room and it lasted a beat too long to be nothing.',
    '{a} made {b} laugh, twice, and then spent the rest of the evening trying to do it again.',
    'They were the last two awake, {a} and {b}, and neither of them went to bed.',
    '{b} said something ordinary and {a} looked at them for a second too long afterwards.',
    '{a} and {b} ran out of things to say an hour ago and are both still sitting there.',
    'Neither of them touched the game once. In this castle that is practically a declaration.',
    '{a} moved a chair four inches and {b} noticed exactly how far it had moved.',
    'Somewhere in the middle of a dull conversation {a} and {b} stopped having it and kept talking.',
  ],
  'named-it-fast': [
    '“This is going to be a problem, isn’t it,” {b} said, about ten seconds in, and {a} did not disagree.',
    '{a} said the thing out loud before either of them had decided to, which is one way of deciding.',
    'It took {a} one evening and one sentence. {b} had been expecting it to take a week.',
    '{b} named it first — plainly, no joke on the end of it — and then had to wait for {a} to answer.',
    '“I like you,” {a} said to {b}, in a castle where nobody says anything, and the room did not fall in.',
    '{a} decided that pretending was more effort than it was worth and told {b} so.',
    'Neither of them had planned to have that conversation tonight. They had it anyway, fast.',
    '{b} asked {a} a direct question about it and got a direct answer, which nobody here expects.',
  ],
  'one-sided-so-far': [
    '{a} spent the evening in something that {b} was, as far as {b} knew, merely being pleasant in.',
    '{b} thought it was a nice conversation. {a} thought about it for two hours afterwards.',
    'It was mutual for exactly one of them, and {a} is the one who knows that.',
    '{a} said goodnight, went upstairs, and came back down twice for things {a} did not need.',
    '{b} has no idea. {a} would very much like to keep it that way for now.',
    'Whatever this is, {a} is in it on {a}’s own so far, and it is not comfortable in there.',
    '{a} laughed at something that was not funny and heard {a}’s own laugh from outside it.',
    'Nothing about the evening was reciprocal, which {a} has decided not to think about.',
  ],
  interrupted: [
    '{a} and {b} were most of the way to something when {c} came in for a glass of water.',
    '{c} walked in at exactly the wrong moment, said nothing, and has said nothing since.',
    'The door went. {a} and {b} were suddenly two people discussing tomorrow’s mission.',
    'It ended the second {c} appeared, and it ended in a way {c} could not fail to read.',
    '{c} apologised for interrupting, which told {a} and {b} that {c} knew what had been interrupted.',
    'Whatever was about to happen between {a} and {b} did not, because the castle is full of people.',
    '{c} took one look at the pair of them and left again, faster than {c} had come in.',
    'Nothing was said. {c} has been carrying it since about half past eleven.',
  ],
  'said-nothing': [
    'Both of them noticed. Neither of them said so, and both of them noticed the not saying.',
    '{a} and {b} sat with it for an hour and let it go up the stairs unaccompanied.',
    'There was a version of the evening where somebody spoke. This was the other one.',
    '{a} nearly said it. {b} nearly said it. They said goodnight instead, in exactly the same tone.',
    'They both know. Neither of them is going to be the one who has to be right about it.',
    '{a} decided a week is a long time in here and that there was no rush, and was wrong about that.',
    'It went unnamed, which in this place is not the same as it going away.',
    'What passed between {a} and {b} was entirely deniable, and both of them intend to deny it.',
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
    const out = { branch, pair: [a, b], threadId: t?.id, bondDelta };
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
    '{a} and {b} stopped pretending it was nothing. The castle has a showmance now.',
    'By breakfast {who} knew about {a} and {b}, and {a} and {b} had stopped minding.',
    '{a} and {b} arrived together and left together and did not explain either.',
    'It stopped being deniable somewhere last night. {a} and {b} are a thing the castle has to plan around now.',
    'Nobody announced anything. {a} and {b} simply stopped sitting apart.',
    'There was no moment. There was a week of moments, and this was the one after which nobody bothered asking.',
  ],
  'the-room-said-it': [
    'Somebody said it out loud at the table before {a} or {b} had, and both of them went red and neither denied it.',
    '"So how long has that been going on," somebody asked the room, cheerfully, and {a} and {b} had to answer it.',
    '{a} and {b} did not get to choose the hour. The castle chose it, over dinner, in front of everybody.',
    'It was announced for them. {b} laughed. {a} did not, quite, and the room noticed which.',
    'The joke went round the table twice before {a} and {b} realised it had stopped being a joke.',
    '{a} and {b} had a plan for telling people and the room got there first.',
  ],
  'told-one-person': [
    '{a} and {b} picked one person to tell first, and picked carefully, and told them together.',
    'Before it got out on its own, {a} and {b} decided who was going to hear it from them.',
    'It is a strategic decision as much as anything else, and {a} and {b} made it like one.',
    '{a} and {b} chose the one person in this castle it would be useful to have known first.',
    'They told one person and asked them to keep it, which is the same as telling four.',
    '{a} and {b} worked out who they could afford to have know, and went and found them.',
  ],
  'agreed-to-hide-it': [
    '{a} and {b} agreed it was real and agreed the castle was not going to be told, and shook on the second part.',
    'It became a thing that night, and it became a secret in the same conversation.',
    '{a} said the room would use it. {b} agreed, and so they arranged to be strangers in daylight.',
    '{a} and {b} decided that whatever this was, it was going to cost less if nobody knew.',
    'They have a showmance and a rule about it, and the rule is that there is no showmance.',
    '{a} and {b} started sitting further apart than they had before, deliberately, which fools nobody for long.',
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
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
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
    '{a} put themselves between {b} and a room that was getting a little too interested in {b}’s name.',
    'The moment {b}’s name came up, {a} was talking, and kept talking until it had gone away again.',
    '{a} made it very clear, without ever raising their voice, that coming for {b} meant coming for both of them.',
    '{a} took a question aimed at {b} and answered it themselves, badly, on purpose.',
    '{b} did not need defending. {a} defended them anyway, in front of everybody.',
    '{a} changed the subject four times in a morning and got away with all four.',
    'Somebody started a sentence with {b}’s name in it and {a} finished it with somebody else’s.',
    '{a} did it so smoothly that {b} only worked out what had happened an hour later.',
  ],
  'too-loud': [
    '{a} defended {b} at a volume that made three people wonder what needed defending.',
    'It was a good defence. It was also, everybody agreed afterwards, an unmistakably personal one.',
    '{a} went further than {b} would have gone for {a}, and the room did the arithmetic on that.',
    'By the end of it nobody was thinking about {b}’s name any more. They were thinking about the pair of them.',
    '{a} used the word "we" twice and could not get it back either time.',
    '{a} won the argument and lost the week: two votes that move together are one vote to this castle.',
    'Nobody doubted {a} meant it. That was rather the trouble.',
    'The defence was so complete that it read, to the room, as an alibi with feelings on it.',
  ],
  'asked-not-to': [
    '“Do not do that for me again,” {b} said to {a}, afterwards, and meant it as a kindness.',
    '{b} took {a} aside and explained, patiently, exactly what {a} had cost them both.',
    '“You are making me a pair,” {b} said. “I need to be a person.”',
    '{b} would rather take a bad morning alone than a good one as half of something.',
    '{a} expected to be thanked. {a} was asked, quite gently, to stop.',
    '“Next time let it come at me,” {b} said, and {a} did not have an answer to that.',
    '{b} pointed out that the only people {a} defends are people {a} is sleeping next to, and let it sit.',
    '{a} had done a generous thing and had to hear why it was a foolish one.',
  ],
  'did-not-step-in': [
    '{b}’s name went round the table and {a} looked at the floor for the whole of it.',
    'It would have taken one sentence. {a} did not spend it, and {b} counted the seconds it took not to.',
    '{a} decided the smart play was to let it pass, and {b} watched {a} decide that.',
    'Nobody expects to be defended in here. {b} had expected it anyway, which is the mistake.',
    '{a} was three feet away and did not say a word, and both of them knew the distance afterwards.',
    '{a} waited to see which way the room went before deciding whether to have an opinion.',
    'The silence was the whole scene. It went on for about ninety seconds.',
    '{a} said something on {b}’s behalf afterwards, privately, which is not the same thing and both of them knew it.',
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
    const out = { branch, pair: [a, b], threadId: advanced?.id, bondDelta };
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
    '{a} did not love how much time {b} was spending with {c}, and said so.',
    '{a} asked what {b} and {c} had been talking about for that long, and did not like being the kind of person who asks.',
    '{b} came back from a conversation with {c} to find {a} had been counting the minutes, and being told so.',
    'It was not about {c} at all, and both {a} and {b} knew that, and they had the row anyway.',
    '"I’m going to say it badly," {a} said, and did, and {b} let {a} finish.',
    '{a} put it plainly to {b}: not jealous, exactly, but not comfortable, and here is why.',
  ],
  'swallowed-it': [
    '{a} watched {b} and {c} for most of an evening and said nothing at all about it.',
    '{a} decided that saying it would be worse than thinking it, and thought it for three hours.',
    '{b} had no idea. {a} intended to keep it that way and was already failing.',
    '{a} made a joke about {c} that was not a joke, and {b} did not hear which one it was.',
    'It sat in {a} all evening and {a} took it to bed rather than to {b}.',
    '{a} was perfectly pleasant to {b} about {c} and was not, underneath, in the slightest.',
  ],
  'made-it-strategy': [
    '{a} told {b} that {c} was worth watching, and about a third of that was strategy.',
    '{a} turned an evening of watching {b} and {c} into a very persuasive case against {c}.',
    'It came out as a read, complete with reasons, and {b} could not tell where the read ended.',
    '{a} would not say "I did not like that". {a} said "{c} is playing you", which is a different sentence.',
    '{a} made {c} into a problem for the two of them rather than a problem for {a}, which is neater and worse.',
    '{b} agreed that {c} was worth keeping an eye on, and never found out why {a} had raised it.',
  ],
  'went-to-them': [
    '{a} did not take it to {b}. {a} took it to {c}, in a corridor, and it did not go well.',
    '{a} asked {c} directly what {c} thought {c} was doing, which {c} had not been expecting.',
    'It was {c} who got the conversation, not {b}, and {c} had done nothing to earn it.',
    '{a} went round {b} entirely and had it out with {c}, and now three people have a problem.',
    '"Just so we understand each other," {a} said to {c}, and {c} understood rather more than {a} meant.',
    '{c} came away from that corridor with something about {a} that {c} had not had an hour before.',
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
    return { branch, pair: [a, b], speaker: a, respondent: b, third,
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
    '{a} and {b} ended it in front of enough people that it would be around the castle by lunch.',
    'It finished in the kitchen, with an audience, and neither {a} nor {b} lowered their voice for it.',
    '{a} and {b} stopped, and four people watched them stop, and nobody pretended otherwise.',
    'Whatever {a} and {b} had, it was over by the time the plates were cleared, and publicly.',
    '{b} walked away from {a} mid-sentence, and that was the end of it, in front of four people.',
  ],
  'faded-out': [
    'Nobody ended it. {a} and {b} simply stopped sitting together, and by the third day it had stopped.',
    'There was no conversation about it, which is how most of these actually go. {a} and {b} just went quiet.',
    '{a} and {b} were still perfectly friendly and had stopped being anything else about a week ago.',
    'It ran out rather than ending. Neither {a} nor {b} could have named the day.',
    'The game took up all the room there was, and what {a} and {b} had did not survive the crowding.',
  ],
  'ended-kindly': [
    '{a} and {b} ended it properly, in private, and both of them were better about it than they had to be.',
    '\u201cThis place is not the place for it,\u201d {b} said to {a}, and {a} agreed, and they meant it kindly.',
    'It finished with the two of them agreeing it had finished, which almost never happens here.',
    '{a} and {b} decided together, said so to each other and to nobody else, and went to bed.',
    'They were friends by the end of the conversation, {a} and {b}, which neither had expected going in.',
  ],
  'ended-in-strategy': [
    '{b} ended it because of what it was costing at the table, and told {a} that in exactly those words.',
    '\u201cThey are going to come for whichever of us is easier,\u201d {b} said, and ended it, and was not wrong.',
    '{a} was left holding a very reasonable explanation and no relationship at all.',
    '{b} priced the thing and put it down, and did {a} the courtesy of saying which of those had come first.',
    'It ended for a reason {a} could not argue with, which is the worst reason for it to end.',
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
    return { branch, pair: [a, b], speaker: bEnds ? b : a, respondent: bEnds ? a : b,
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
    '{a} and {b} quietly agreed: if either of their names comes up tomorrow, the other one is speaking first.',
    'Last thing before sleep, {a} and {b} worked out who says what if it goes wrong tomorrow.',
    '{a} and {b} agreed on a signal, which is either very sweet or very organised.',
    'Whoever gets named first, the other one stands up. {a} and {b} settled that in the dark and did not discuss it again.',
    '{b} told {a} not to defend them tomorrow. {a} agreed, and both of them knew {a} was lying.',
  ],
  'one-sided-pact': [
    '{a} promised to stand up for {b} tomorrow. {b} said something warm that was not the same promise.',
    '{a} committed to it out loud and waited, and {b} did not commit to anything out loud.',
    'It was supposed to be mutual. {a} noticed, somewhere in the dark, that only one of them had said it.',
    '{b} let {a} make the promise and did not stop {a} and did not match it.',
    '{a} came away from that thinking it was settled. It was settled in one direction.',
  ],
  'agreed-to-be-strangers': [
    '{a} and {b} agreed to be nothing in public tomorrow, which is the sensible version and it cost them.',
    '\u201cDon\u2019t defend me,\u201d {b} said, and meant it. \u201cIf you stand up for me they write us both down.\u201d',
    'The pact {a} and {b} made was the opposite of a pact: two people agreeing not to look at each other.',
    '{a} and {b} worked out that being seen to protect each other is what gets both of them named.',
    'They chose the game over the gesture, {a} and {b}, and both of them were quiet about it afterwards.',
  ],
  'refused-the-pact': [
    '{b} would not make the promise, and would not explain why, and {a} lay there with that.',
    '\u201cI\u2019m not going to say that to you,\u201d {b} told {a}, in the dark, and did not soften it.',
    '{a} asked for the one thing and {b} declined, kindly, and the kindness made it worse.',
    '{b} said tomorrow would be tomorrow, which is not a no and is not anything else either.',
    '{a} had thought this was already agreed. It turned out, at midnight, not to be.',
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
    return { branch, pair: [a, b], speaker: b, respondent: a,
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
    '{a} and {b} vouched for each other’s whereabouts last night. Nobody thought to ask whether that made it MORE or LESS convincing.',
    '{a} was with {b}. {b} was with {a}. The room had to decide what that was worth.',
    'The two people least able to clear each other cleared each other, and did it with a straight face.',
    '{a} answered for {b} before {b} could answer, which {a} realised afterwards had not helped.',
    'Two names, one night, one account, delivered twice. The room let it go and did not forget it.',
    '“We were together,” {a} said, for the pair of them, and {b} nodded at the right moment.',
    'It is the most useless alibi in the castle and the two of them keep giving it anyway.',
    '{a} and {b} agreed on the hour, the room and the reason, which is one detail more than anybody honest has.',
  ],
  'asked-separately': [
    'Somebody had the wit to take {a} and {b} into different rooms, and the two accounts came back identical.',
    '{a} was asked first and did not know it. {b} was asked second and did.',
    'Split up and questioned apart, {a} and {b} produced the same night down to the same cold tea.',
    'The room stopped asking them together, which is when this stopped being a formality.',
    '{a} came out of one conversation and could not warn {b} before {b} went into the other.',
    'Two people, two rooms, one account. It held, and everybody noticed how much it held.',
    'They had not rehearsed it. They did not need to, which is either love or a problem.',
    'The identical answer was the reassuring part and the frightening part at the same time.',
  ],
  'did-not-match': [
    '{a} said the kitchen. {b} said the stairs. Both of them heard the other one say it.',
    'The accounts came apart on one word, and one word is all it takes in here.',
    '{a} put the two of them together an hour later than {b} did, and neither could fix it afterwards.',
    'They had never actually compared the night. It showed, in front of four people.',
    '{b} corrected {a} mid-sentence, publicly, which made it worse rather than better.',
    'Two people who share a bed gave two different versions of an evening, and the room wrote it down.',
    'It was a small discrepancy about a dull hour, and it will be quoted at the table.',
    '{a} tried to make the two versions the same version and made three versions.',
  ],
  'refused-to-vouch': [
    '{b} was asked whether {a} had been there and said, honestly, that {b} could not swear to it.',
    '“I was asleep,” {b} said, which is true, and which left {a} standing there with nothing.',
    '{b} would not lie for {a}, not even a small one, and {a} had not known that until this morning.',
    '{a} looked at {b} for the easy answer and did not get it in front of the whole room.',
    '{b} declined to be an alibi and had reasons, and gave none of them out loud.',
    'The room asked. {b} hesitated. The hesitation was the answer and everybody had it.',
    '“I am not going to say something I do not know,” {b} said, and {a} could not argue with it and wanted to.',
    '{b} chose being believed over being useful, and {a} understood the choice and hated it.',
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
    const out = { branch, pair: [a, b], threadId: thread?.id, cited, bondDelta };
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
  '{b} now has to explain, to {who}, why the one person who knows them best said that out loud.',
  'By breakfast {who} will have it. {b} has until breakfast.',
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
        { source: sceneWhy, seed: `${line} ${lineFor(EXPOSED_AFTERMATH_LINES, `romance-liability-exposed|exposes|${ctx.ep}`,
          { a: doubter, b: suspected, who })}` });
      threadId = coverThread?.id ?? threadId;
    }
    return { branch, doubter, suspected, threadId, bondDelta };
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
    '{a} and {b} had a real fight, loud enough that the room pretended not to notice.',
    'It started over nothing and got somewhere real, and everybody downstairs heard the end of it.',
    '{a} said something to {b} that could not be taken back, and did not take it back.',
    '{b} walked out on {a} mid-argument and the door said the rest.',
    'Two people who had been finishing each other’s sentences spent an evening interrupting them instead.',
    'Four people found somewhere else to be, quite quickly, and none of them went far.',
    'It got personal in about ninety seconds and stayed personal for twenty minutes.',
    '{a} brought up something from day two that {a} had promised not to bring up.',
  ],
  'went-cold': [
    'There was no shouting. {a} and {b} were extremely polite to each other for four hours.',
    '{a} said “fine” in a way that meant the opposite, and then said nothing else at all.',
    'They sat in the same room all evening and did not once speak to each other, and everybody saw it.',
    '{b} answered every question {a} asked and asked none back, which is its own kind of shouting.',
    'It was over before it started and neither of them has admitted it started.',
    '{a} moved a chair to the other side of the fire, and that was the entire argument.',
    'Nobody heard a word of it. Everybody in the hall knew exactly what was happening.',
    '{b} went to bed early without saying goodnight, and {a} noticed both halves of that.',
  ],
  'about-the-vote': [
    'It looked like a lovers’ row. It was actually about a name, and both of them knew that.',
    '{a} and {b} fell out over who to write, which is not a thing couples in the outside world do.',
    '“You are asking me to choose,” {b} said, and {a} said “yes,” and that was the whole argument.',
    'They did not fight about each other. They fought about the third person in every conversation.',
    '{a} wanted a promise about tonight. {b} would not give one, and the evening went from there.',
    'The words were about trust and the subject was a ballot, and neither of them pretended otherwise.',
    '{b} pointed out that {a} had never once asked for something that was not strategic.',
    'It ended with the two of them further apart on a name than they had been at breakfast.',
  ],
  'patched-it': [
    'They had it out properly and then, unusually for this castle, put it back together the same night.',
    '{a} apologised first and meant it, and {b} let {a} finish before saying so.',
    'It was a bad hour and then it was over, and the being over was the surprising part.',
    '{a} and {b} came back downstairs together, later, and nobody asked.',
    'Whatever it was cost them one evening. Most things in here cost a week.',
    '{b} said the thing that ends arguments instead of the thing that wins them.',
    'The row was real and the making-up was real, and the castle found both of them slightly unbearable.',
    'They fought about something worth fighting about and then decided it was not worth it.',
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
    return { branch, pair: [a, b], speaker: a, respondent: b,
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
    'Somebody pointed out, not unkindly, that {a} and {b} getting together was awfully convenient for both their games.',
    'The word "convenient" got used about {a} and {b} this morning, and it travelled.',
    'Two votes that always land together stop looking like a couple and start looking like a bloc, and the room said so.',
    '{a} and {b} were asked, more or less to their faces, whether any of it was real.',
    'Nobody doubted {a} and {b} liked each other. Several people doubted that was all it was.',
    'It got said at breakfast, lightly, and by lunch three people had repeated it without the lightness.',
    'Somebody counted how many times {a} and {b} had voted the same way, out loud, and got to five.',
    'It was settled this morning, by {who}, that {a} and {b} are a number rather than two numbers.',
  ],
  'made-a-joke-of-it': [
    '{a} got in front of it by saying it first and worse, and the room laughed and let it go.',
    '“We are a voting bloc, obviously,” {b} said, cheerfully, and somehow that was the end of it.',
    '{a} and {b} played up to it so thoroughly that nobody could take it seriously any more.',
    'The joke was better than the accusation, which is the only defence that works in a room like this.',
    '{b} agreed with every word of it and added two more, and the subject died of embarrassment.',
    '{a} made the couple into the castle’s running gag, deliberately, and it cost them nothing.',
    'It is very hard to keep prosecuting somebody who has already pleaded guilty and made it funny.',
    '{a} and {b} let the room have the joke and kept the arrangement, which was the trade.',
  ],
  'leaned-into-it': [
    '{a} and {b} stopped denying it was strategic and started using it, which was worse for everybody else.',
    '“Yes,” {b} said. “We vote together. What are you going to do about it.”',
    'The couple decided that being feared as a bloc beat being pitied as a couple.',
    '{a} and {b} began arriving at conversations together, on purpose, and the room hated it.',
    'It was an accusation on Tuesday and a strategy by Thursday, and the two of them made the switch openly.',
    'They confirmed every suspicion the room had and dared it to do anything about it.',
    'A pair that admits it is a pair is much harder to split than one that denies it, and {a} knew that.',
    '{a} and {b} spent the morning being exactly as inseparable as they had been accused of being.',
  ],
  'it-landed-inside': [
    'The room said it about {a} and {b}. By evening {a} had started wondering whether it was true of {b}.',
    'It was meant as a dig at both of them. Only one of them took it home.',
    '{a} heard "convenient" and could not stop hearing it for the rest of the day.',
    'Somebody else’s sentence got inside the two of them, which is exactly what it was for.',
    '{b} asked {a}, later and lightly, whether any of it had ever been about the game. {a} said no, twice.',
    'The accusation did no damage in the hall at all. It did all of its damage upstairs.',
    '{a} began doing arithmetic on {b} that {a} had never previously thought to do.',
    'One sentence at breakfast, and by nightfall {a} was reading a whole week differently.',
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
    return { branch, pair: [a, b], speaker: a, respondent: b,
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
    '{a} and {b} leaned on each other after last night, and it turned into something neither of them expected.',
    '{b} was the one who found {a} this morning, and neither of them moved for a long time afterwards.',
    'It was meant to be comfort. Somewhere in the middle of it, for {a} and {b}, it stopped being only that.',
    '{a} held on to {b} a little longer than the moment strictly needed, and {b} let them.',
    'Grief put {a} and {b} in the same room at six in the morning, and something else kept them there.',
    'Neither of them was thinking about anything except the empty chair, and then, quite suddenly, one of them was.',
    '{a} came down to cry about somebody else and did not go back up for two hours.',
    'It is a terrible way for a thing to start and it started anyway.',
  ],
  'just-comfort': [
    '{a} sat with {b} until it was light, and that is all that happened, and it was not nothing.',
    'Nothing started. {a} and {b} simply got each other through a bad morning, which counts for more in here.',
    '{b} made tea neither of them drank and stayed until {a} could talk about it.',
    'It could have turned into something. {a} noticed the moment it could have and let it pass.',
    'What {a} and {b} have after this morning is not romantic and is much harder to break.',
    'They talked about the dead for an hour and about themselves not at all, and both preferred it that way.',
    '{a} needed somebody to be there and {b} was there, and neither of them made it mean more than that.',
    'By breakfast the two of them were something. It is not what the castle would guess it is.',
  ],
  'too-soon': [
    'It got as far as a hand on an arm, and then {b} said “not like this,” and was right.',
    '{a} pulled back before {b} had to, and both of them were grateful and neither said so.',
    'Somewhere in it {b} remembered why they were both awake, and that ended it.',
    '{a} said the wrong true thing at the wrong hour and heard it land wrong.',
    'They stopped. Grief makes people reach for whoever is nearest and both of them knew that.',
    '“Ask me again in a week,” {b} said, which is a long time in here and both of them knew that too.',
    'It very nearly happened and then, for about four good reasons, it did not.',
    '{a} went back upstairs at five and lay awake being sensible about it.',
  ],
  'the-room-noticed': [
    'Nobody meant it to be a scene. The castle had it by breakfast anyway.',
    '{a} and {b} were found together at six in the morning by somebody who did not knock.',
    'Two people comforting each other over a body is a lovely thing that looks like something else from a doorway.',
    'Whatever it was, it happened in a hall with sightlines, and this castle has nothing to do but look.',
    'By nine o’clock there were two versions of what {a} and {b} had been doing, and neither was kind.',
    'The comfort was real. The account of the comfort that went round at breakfast was not.',
    '{a} and {b} found out at lunch what the castle had decided about their morning.',
    'It cost them nothing at the time and a great deal by the evening.',
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
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: t?.id, bondDelta };
  },
});