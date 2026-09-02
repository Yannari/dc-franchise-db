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
    'By breakfast everybody knew about {a} and {b}, and {a} and {b} had stopped minding.',
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
    const t = api.openArc(SHOWMANCE_KIND, [a, b], { source: sceneWhy,
      seed: lineFor(SHOWMANCE_FORM_LINES[branch], `romance-showmance-forms|${branch}|${ctx.ep}`, { a, b }) });
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
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
