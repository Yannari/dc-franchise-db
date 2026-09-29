// ══════════════════════════════════════════════════════════════════════
// tr/castle/mission-fallout.js — the road home, and what the afternoon
// left on it
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS. `journey-back` is the whole of the `mission-fallout`
// phase (js/tr/castle/phases.js), it is budgeted 4-6 scenes a night, and until
// this file it held SIX registered events and produced 0.70 scenes an episode
// — 17% of its own minimum, the worst-served window in the game by a factor of
// three. Task 7 stage 1 measured that; stage 2 measured why it was fixable.
//
// EVERY EVENT HERE IS GATED ON A RECORD, AND THE RECORD IS ALWAYS THERE.
// `playTraitorsSeason` runs `runMission` -> `missionEvidence` ->
// `runCastlePhase('mission-fallout')`, in that order, and `runMission` pushes
// its record before it returns. Stage 2 wrapped every `journey-back` firing
// over 120 seasons: 721 firings, 100% of which could read a mission record
// whose `ep` was the current episode. So the causal writing contract's first
// question — WHICH RECORD MADE THIS EVENT ELIGIBLE — has the same answer for
// every event below, and it is a real one: tonight's afternoon.
//
// ── THE FOUR RULES STAGE 2 MEASURED, AND WHY EACH ONE IS OBEYED ────────
//
//  1. `lastMission(gs, ep)` (js/tr/state.js), never `missions.at(-1)`. An
//     endgame round runs no mission, so the tail of the log is YESTERDAY's
//     afternoon on those nights. Fourteen hand-written `m.ep === ctx.ep`
//     checks is fourteen chances to omit one, with a symptom — last night's
//     mission narrated over tonight's road — that no test looks for.
//  2. THERE IS NO PER-PLAYER MISSION SCORE. `teams[].perf` is a TEAM number
//     and `sideObjectives[]` is the only place an individual's name is
//     attached to an outcome. So nothing here says "{b} underperformed": that
//     claim has no record behind it, and the causal contract forbids
//     personality inventing a fact. What a scene may say is what the record
//     says — which half of the room had the better afternoon, what tier the
//     day reached, and who was named for a solo task and missed it.
//  3. GATE ON THE BROAD FACTS. Tier and team membership are readable in 100%
//     of firings and a missed side objective in 67%. The relic block is 23.3%
//     and "somebody in this scene IS the searcher" is 3.9% — which is the
//     shape of `cover-suspect-own-ally`, 18 firings in 300 seasons, the event
//     that drags the pool's mean yield to 0.131. Exactly TWO events here read
//     the relic block, both declared `rare` so guard 2 pays back what the gate
//     costs, and neither is load-bearing for the window's budget.
//  4. TWO GATES ARE DEAD AND ARE NOT USED. `tier === 'failed'` fires 0.7% of
//     afternoons and `earned < gross` — the pot ceiling clipping the day's
//     take — occurred ZERO times in 120 seasons. Neither can carry an event,
//     and neither appears in a `weight()` below. `failed` appears only as one
//     more value a tier phrase can render, where its rarity costs nothing.
//
// ── THE NUMBER RULE (tests/tr-castle-prose.test.js) ────────────────────
//
// A digit printed in a castle sentence must equal a fact the season can
// justify: how many are living, lost, murdered or banished, how many started,
// or an episode that has already happened. THE MONEY IS NOT ON THAT LIST, and
// a mission record is mostly money — `gross`, `earned`, `potAfter`. So the pot
// is discussed here in words and never in figures, which is also how people
// actually talk about it on a minibus.
//
// ── WHY THE EVENTS CARRY THE OTHER FAMILIES' NAMES ────────────────────
//
// Same reason js/tr/castle/journey.js gives for the two road windows, and it
// is worth repeating because this file is where somebody will next be tempted:
// `family` is the ARC KIND an event opens and continues, not the subject of
// the sentence and not the file it lives in. A seventh kind called `mission`
// would be a seventh storyline running beside the six the castle tells, and
// `findOpenThread` would never let a mission scene continue anything that
// happened indoors. A suspicion formed on the road is the same suspicion.
//
// No belief writes here, same as every other castle file. These events move
// bonds and arcs and nothing else.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may hold;
// every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue, arcAdvanceCiting } from './effects.js';
import { alignmentAt } from '../roles.js';
import { lastMission, murderCount } from '../state.js';
import { sideObjectiveLabel } from '../missions.js';
import { lineFor, whoTheyTold, namesPhrase, countWord } from './lines.js';
import { findOpenThread } from '../threads.js';
// The SAME "have these two got a story, or were they merely cast together"
// filter callback.js applies, imported rather than copied — a second copy
// would drift the first time a relation is added to the ledger's shape.
import { storyWith, strongestRelation } from './callback.js';

function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

/**
 * ONE LINE, CHOSEN WITHOUT AN RNG DRAW — and the reason is measured.
 *
 * The first version of this file drew its sentences with `pick(rng, pool)`.
 * That works, but the window it fills now produces 4.4 scenes an episode where
 * it used to produce 0.7, so each of these pools is drawn six times as often
 * per season as anything written before it — and a uniform draw over four
 * lines, taken five or six times a season, collides. It did: the repetition
 * audit's worst season printed one of the solo lines FIVE times.
 *
 * `lineFor` (js/tr/castle/lines.js) hashes the key instead, and its own
 * docblock explains why that is strictly better than a coin here: it indexes
 * with `%` over a prime multiplier, so a family of keys differing only in the
 * last field walks every slot exactly once before any of them repeats. The key
 * below carries the episode AND the substitution values (the names, the
 * mission, the team, the task), so the same pair on the same night reads the
 * same way — which is correct, it is one scene — and everything else moves.
 */
function line(pool, eventId, branch, ep, vars) {
  return lineFor(pool, `${eventId}|${branch}|${ep}`, vars);
}

/**
 * TEST-ONLY HOLD-OUT, AND THE REASON IT HAD TO EXIST.
 *
 * `tests/tr-missions.test.js` holds a standing guard — "a mission grants
 * NOTHING but money" — which plays forty seasons twice, missions on and
 * missions off, and demands the banishment log, the murder log AND the castle
 * scene list come back bit-identical. Its own projection says so out loud:
 * "the mission must not displace a single pickEvent() draw either".
 *
 * EVERY EVENT IN THIS FILE DISPLACES ONE, BY DESIGN. The `mission-fallout`
 * phase is the afternoon's fallout; a scene about the day that cannot read the
 * day is the disconnected-event shape the whole plan is written against. So
 * with missions switched off these fourteen events weight 0 and the window
 * draws something else, and the two arms part company.
 *
 * THE FILE'S OWN ANSWER TO THIS, APPLIED A FOURTH TIME. That guard has already
 * been narrowed three times — the Chess archetype, the Shield archetype, and
 * the pot itself — and every time by HOLDING THE THING OUT OF BOTH ARMS rather
 * than by softening the assertion, because (its words) "mostly identical" has
 * no failure state. This is the fourth hold-out and it takes the same shape,
 * including the arm that proves the hold-out holds something real out: with
 * this switched back ON, the arms diverge.
 *
 * WHAT THE ORIGINAL CLAIM STILL COVERS, INTACT: a mission still grants no
 * immunity, saves nobody at a table, nudges no ballot and writes no belief,
 * and displaces no draw in the other six castle windows. What it now does is
 * give the road home something to be about — which is not an advantage to
 * anybody, and is the one thing this window is for.
 *
 * Nothing in the show may ever call this. Same contract as
 * `_setMissionsEnabled` in js/tr/missions.js.
 */
let _enabled = true;
export function _setMissionFalloutEnabled(on) { _enabled = on !== false; }

/**
 * Tonight's afternoon, or null — the single gate every event here opens with.
 *
 * Also refuses a record without two teams on it. `runMission` cannot produce
 * one, but every helper below indexes `m.teams`, and an event that threw
 * inside `fire()` because a record shape drifted would take the whole window
 * down rather than skipping one scene.
 */
function afternoon(ctx) {
  if (!_enabled) return null;
  const m = lastMission(gs, ctx.ep);
  if (!m || !Array.isArray(m.teams) || m.teams.length < 2) return null;
  return m;
}

/** The team somebody was on, or null if they were not out there. */
function teamOf(m, name) {
  return m.teams.find(t => Array.isArray(t.members) && t.members.includes(name)) || null;
}

/** Did this person's half of the room have the better afternoon? */
function onTheBetterHalf(m, name) {
  const t = teamOf(m, name);
  return !!t && t.name === m.bestTeam;
}

/**
 * HOW THE DAY WENT, IN WORDS, because it may not be said in figures.
 *
 * Four phrasings per tier so the same tier twice in a season is not the same
 * sentence twice. `failed` is here for completeness and fires on 0.7% of
 * afternoons; it is never gated on.
 */
const TIER_PHRASE = {
  triumph: ['the estate manager had run out of ways to say it went well',
    'it had gone better than anybody out there had planned for',
    'the day had been an outright success and everybody knew it',
    'they had taken everything there was to take'],
  solid: ['the day had gone the way it was supposed to go',
    'they had done what the day asked and not much more',
    'it had been a decent afternoon by any honest measure',
    'the work had got done without anybody having to be a hero about it'],
  scraped: ['they had got through it and not one yard further',
    'it had been close and nobody was pretending otherwise',
    'the day had cost more than it paid and they all felt it',
    'they had scraped it, and scraping it had taken everything'],
  failed: ['the afternoon had come to nothing at all',
    'they had come home with the story and none of the money',
    'nothing about the day had worked and there was no arguing it',
    'it had gone wrong early and never once come back'],
};
function tierPhrase(m, eventId, ep) {
  return lineFor(TIER_PHRASE[m.tier] || TIER_PHRASE.solid,
    `tier|${eventId}|${ep}`, { mission: m.name, best: m.bestTeam });
}

/**
 * A recorded solo task somebody was named for and did not complete.
 *
 * THE ONLY PLACE AN INDIVIDUAL'S NAME IS ATTACHED TO A MISSION OUTCOME (rule 2
 * in the header), which is what makes it the only honest basis for a scene
 * that puts a name to how the day went. `exclude` keeps the two people in the
 * room out of it where the event wants a third party to argue about.
 */
function missedTask(m, { exclude = [], living = null } = {}) {
  for (const o of (m.sideObjectives || [])) {
    if (o.achieved) continue;
    if (exclude.includes(o.player)) continue;
    if (living && !living.includes(o.player)) continue;
    if (!sideObjectiveLabel(o.id)) continue;
    return o;
  }
  return null;
}

/** The counterpart: a solo task somebody was named for and pulled off. */
function wonTask(m, { exclude = [], living = null } = {}) {
  for (const o of (m.sideObjectives || [])) {
    if (!o.achieved) continue;
    if (exclude.includes(o.player)) continue;
    if (living && !living.includes(o.player)) continue;
    if (!sideObjectiveLabel(o.id)) continue;
    return o;
  }
  return null;
}

/** Weighted branch draw from `{ name: score }`. One rng call, like the pool. */
function forkOn(rng, scores) {
  const keys = Object.keys(scores);
  const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
  let roll = rng() * total;
  for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) return k; }
  return keys[keys.length - 1];
}

// ══════════════════════════════════════════════════════════════════════
// 1. WHAT IT COST US — a name, a task, and whether the other one will
//    put the two together
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `sideObjectives[]` names one or two people per afternoon and
// says whether each of them got there. A miss is on the record 67% of the
// time. That is the fact; everything below is interpretation of it, and the
// four branches are four different things `{b}` DOES with a name being put in
// front of them, not four ways of saying the same shrug.
const COST_US_LINES = {
  pinned: [
    'On the road back, {a} brings up who was meant to {task}.\n{a}: "{who} was the one they sent to {task}. It didn’t happen."\n{b}: "No. It didn’t."\n{a}: "That’s money we haven’t got."',
    '{a} lays it out for {b} on the walk home.\n{a}: "{who} had one job. {task}. And it’s not done."\n{b}: "I’m not going to argue with that."',
    '{a} can’t let it go.\n{a}: "Did you see {who} out there? Nowhere near it."\n{b}: "I saw."\n{a}: "Then you know what that cost us."',
    '{a} and {b} put the missed job on {who}.\n{b}: "It was {who}’s job."\n{a}: "Exactly. So why wasn’t it done?"',
  ],
  defended: [
    '{a} blames {who}, and {b} defends {who}.\n{a}: "{who} was asked to {task} and didn’t."\n{b}: "Half of us would’ve missed that. It was a lottery."\n{a}: "A lottery {who} lost."',
    '{b} won’t let {a} pin it on {who}.\n{b}: "Come on. That task was impossible."\n{a}: "{who} didn’t even try."\n{b}: "You don’t know that."',
    '{a} puts {who} up for it. {b} takes {who} straight back down.\n{b}: "Anyone could’ve missed it. Leave {who} alone."',
    '{b} sticks up for {who} on the walk back.\n{b}: "It’s not on one person. It never is."\n{a}: "It usually is, in here."',
  ],
  redirected: [
    '{a} starts on {who}, and {b} moves it onto the whole day.\n{b}: "Forget {who}. The whole afternoon was a mess."\n{a}: "Fine. But {who} didn’t help."',
    '{b} won’t make it about one person.\n{b}: "Look at what {mission} actually paid. One missed job doesn’t explain that."\n{a}: "No. You’re right."',
    '{a} blames {who}. {b} blames the day.\n{b}: "Honestly, {tier}. That’s not {who}’s fault."',
    '{b} steers it away from {who}.\n{b}: "We all had a bad day. Let’s not pick one person."',
  ],
  shrugged: [
    '{a} brings up {who} on the walk back. {b} says nothing useful.\n{a}: "{who} didn’t {task}."\n{b}: "Mm."\n{a}: "That’s it? Mm?"',
    '{a} mentions {who}’s missed job. {b} looks at the road.\n{b}: "Does it matter now?"\n{a}: "It matters to the pot."',
    '{b} isn’t interested in blaming {who}.\n{b}: "Can we not? I’m tired."',
    '{a} raises it, and {b} lets it drop.\n{a} (to camera): "{b} didn’t care. Or didn’t want to be seen caring."',
  ],
  alone: [
    '{a} walks home thinking about the one job that didn’t get done: {who} was sent to {task}, and it didn’t happen.\n{a} (to camera): {cam:mission-angry}',
    'Nobody else on the road seems to have noticed that {who} was meant to {task}. {a} noticed.\n{a} (to camera): "{who} had one job. I’m not saying anything yet. I’m remembering it."',
    '{a} walks back going over what {mission} could have paid.\n{a} (to camera): {cam:mission-angry}',
    '{a} keeps coming back to {who} and the job that wasn’t done.\n{a} (to camera): "Was it an accident? That’s what I want to know."',
    '{a} works out what the missed task cost the pot.\n{a} (to camera): {cam:money}',
    '{a} walks back alone, annoyed about {mission}.\n{a} (to camera): {cam:mission-angry}',
    '{a} replays the moment it went wrong on {mission}.\n{a} (to camera): {cam:replay-mission}',
    '{a} counts the cost of {mission} in {aPos} head.\n{a} (to camera): "Someone should have done that job. Someone didn’t."',
    '{a} thinks about {who} the whole way back.\n{a} (to camera): {cam:holding-info}',
    '{a} walks home going over who pulled their weight on {mission}, and who didn’t.\n{a} (to camera): {cam:replay-mission}',
  ],
};

registerEvent({
  id: 'mission-what-cost-us',
  family: 'suspicion',
  window: 'journey-back',
  // NO `roles: 'initiator-first'` HERE, DELIBERATELY, even though the paired
  // branches all run one way. This event also fires SOLO, and a one-person
  // scene has no respondent to name — a blanket declaration would promise the
  // screen a direction the `alone` branch cannot deliver. The paired branches
  // say it themselves, on the result, which takes precedence over `roles`
  // anyway (see `sceneSpeakers`, js/tr/events.js).
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'intuition', 'social'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    // A third party, still alive, whom the record names for a task they did
    // not finish. Without that there is nothing to have the argument ABOUT —
    // or, on a solo draw, nothing to be turning over.
    return missedTask(m, { exclude: ctx.actors, living: ctx.living }) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-what-cost-us');
    const sceneWhy = 'went back over the solo task nobody finished';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const miss = missedTask(m, { exclude: ctx.actors, living: ctx.living });
    if (!b) {
      const soloNote = line(COST_US_LINES.alone, 'mission-what-cost-us', 'alone', ctx.ep, {
        a, who: miss.player, task: sideObjectiveLabel(miss.id), mission: m.name,
      });
      const solo = arcContinue(api, 'suspicion', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'alone', actor: a, subject: miss.player,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const st = pStats(b);
    // What {b} does with a name: a sharp player takes it and keeps it, a loyal
    // one defends, a strategic one moves the argument to ground it can win on,
    // a closed one refuses to be drawn.
    const branch = forkOn(rng, {
      pinned: (st.intuition / 10) * 0.5 + (st.strategic / 10) * 0.4,
      defended: (st.loyalty / 10) * 0.6 + Math.max(0, getBond(b, miss.player)) / 10 * 0.4,
      redirected: (st.mental / 10) * 0.45 + (st.strategic / 10) * 0.35,
      shrugged: (1 - st.social / 10) * 0.6 + 0.15,
    });
    const note = line(COST_US_LINES[branch], 'mission-what-cost-us', branch, ctx.ep, {
      a, b, who: miss.player, task: sideObjectiveLabel(miss.id),
      mission: m.name, tier: tierPhrase(m, 'mission-what-cost-us', ctx.ep),
    });
    const bondDelta = branch === 'pinned' ? 1.5
      : branch === 'defended' ? -1 : branch === 'redirected' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'suspicion', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: miss.player,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 2. SAME SIDE — two people who were on the same half of the room, and
//    what they do with the half's result
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `teams[].members` says who was with whom and `bestTeam` says
// which half had the better afternoon. Both are readable in 100% of firings,
// and neither is a claim about a person — which is the point. The scene is
// what two people make of a number that was made for both of them.
const SAME_SIDE_LINES = {
  'closed-ranks': [
    '{a} and {b} walk home together, both from {team}.\n{a}: "We did alright today."\n{b}: "We did. Whatever anyone says."',
    '{a} and {b} were on the same end of {mission}, and by the gate that means something.\n{b}: "Good team today."\n{a}: "Good team."',
    '{a} and {b} back each other up on the way home.\n{a}: "If anyone asks, {team} gave it everything."\n{b}: "Because we did."',
    '{a} and {b} come off {mission} closer than they went in.\n{b} (to camera): "{a} and me worked well today. That counts for something."',
  ],
  'divided-it': [
    '{a} wants to know why {team} ended up where it did, and {b} hears the real question.\n{a}: "What happened to us out there?"\n{b}: "You mean what happened to me."\n{a}: "I didn’t say that."',
    'By the second hill, {a} and {b} have stopped talking about {mission} and started talking about each other.\n{b}: "You think I let us down."\n{a}: "I think somebody did."',
    '{a} and {b} disagree about how {team} did.\n{a}: "We should’ve won that."\n{b}: "We did our best."\n{a}: "Did we?"',
    '{a} and {b} fall out over {mission} on the walk back.\n{b} (to camera): "{a} blames me. I can feel it."',
  ],
  professional: [
    '{a} and {b} go over {mission} on the walk back without making it personal.\n{a}: "Timing was off. That’s all."\n{b}: "Agreed. Nobody’s fault."',
    '{a} and {b} talk about the mission like it was work.\n{b}: "It was the day, not the people."\n{a}: "Mostly."',
    '{a} and {b} keep it calm on the road home.\n{a}: "We’ll do better next time."\n{b}: "We will."',
    '{a} and {b} have a sensible chat about {mission}.\n{a} (to camera): "Very polite. Very careful. Neither of us said what we thought."',
  ],
  'one-sided': [
    '{a} goes through {team}’s whole afternoon on the road home, and {b} says about four words.\n{a}: "And then, when we got to the end—"\n{b}: "Yeah."\n{a}: "Are you even listening?"',
    '{a} is still talking about {mission} at the gate. {b} stopped listening at the top of the hill.\n{b} (to camera): "{a} does not stop."',
    '{a} talks the whole way home. {b} nods.\n{b}: "Mm. Right."',
    '{a} wants to go over every detail. {b} doesn’t.\n{b}: "Can we talk about anything else?"',
  ],
};

registerEvent({
  id: 'mission-same-side',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['social', 'loyalty', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    const [a, b] = ctx.actors;
    const ta = teamOf(m, a);
    // The whole premise is the shared half. Different halves is event 3.
    return ta && ta === teamOf(m, b) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-same-side');
    const sceneWhy = 'debriefed the half of the room they shared';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const team = teamOf(m, a);
    const won = onTheBetterHalf(m, a);
    const st = pStats(b);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      // A day that went their way pulls people together; one that did not
      // gives them something to divide.
      'closed-ranks': (st.loyalty / 10) * 0.5 + Math.max(0, bond) / 10 * 0.4 + (won ? 0.35 : 0.05),
      'divided-it': (1 - st.temperament / 10) * 0.5 + Math.max(0, -bond) / 10 * 0.4 + (won ? 0.05 : 0.3),
      professional: (st.strategic / 10) * 0.4 + (st.mental / 10) * 0.3,
      'one-sided': (1 - st.social / 10) * 0.55 + 0.1,
    });
    const note = line(SAME_SIDE_LINES[branch], 'mission-same-side', branch, ctx.ep, {
      a, b, team: team.name, mission: m.name,
      tier: tierPhrase(m, 'mission-same-side', ctx.ep),
    });
    const bondDelta = branch === 'closed-ranks' ? 2
      : branch === 'divided-it' ? -1.5 : branch === 'professional' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'divided-it' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, team: team.name,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 3. THE OTHER HALF — two accounts of one afternoon, and only one of
//    them is checkable
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD, AND THE CONTRADICTION IT MAKES POSSIBLE: `bestTeam` is a fact
// about which half did better, and it was read out to everybody. So a person
// telling the other half of the room that their side carried the day, when the
// record says it did not, is contradicting something the listener also heard —
// which is the contradiction contract's shape exactly (two incompatible stored
// claims, and the doubter knows both). `boasted` is its mirror: the same
// behaviour from the side the record actually backs, which is not a lie and
// lands differently for that reason.
const OTHER_HALF_LINES = {
  'compared-clean': [
    '{a} and {b} put {ta}’s afternoon and {tb}’s afternoon side by side on the walk home. They fit together.\n{a}: "So you were doing that while we were doing this."\n{b}: "Yep. Makes sense now."',
    '{a} and {b} compare notes on {mission}, and nothing contradicts.\n{b}: "Same story from both sides."\n{a}: "Good. One less thing to worry about."',
    '{a} and {b} swap halves of {mission}.\n{a}: "What was it like on your side?"\n{b}: "Chaos. Yours?"\n{a}: "Same."',
    '{a} checks {b}’s version of the afternoon against {aPos} own. It matches.\n{a} (to camera): "Clean. {b}’s story holds."',
  ],
  traded: [
    '{a} tells {b} what {ta} saw, and gets what {tb} saw in return.\n{a}: "Who went quiet on your side?"\n{b}: "Funny you should ask."',
    '{a} and {b} trade halves of {mission} on the road back.\n{b}: "I’ll tell you who slacked off, if you tell me who."\n{a}: "Deal."',
    '{a} and {b} swap information like a business deal.\n{a} (to camera): "I gave {b} {ta}’s afternoon. {b} gave me {tb}’s. Fair trade."',
    '{a} and {b} come home with a name each from the other team.\n{b}: "That’s useful."\n{a}: "Very."',
  ],
  gap: [
    '{b} tells it like {tb} carried {mission}. {a} knows that’s not what the result said.\n{a}: "That’s not what they read out."\n{b}: "Well, it felt like it."',
    '{b}’s version of {tb}’s afternoon doesn’t match what everyone heard.\n{a} (to camera): "{b} is rewriting the afternoon. I was there."',
    '{b} makes {tb} sound better than they did.\n{a}: "Hang on. You lost that bit."\n{b}: "Did we?"',
    '{a} lets {b}’s version sit there, and doesn’t believe it.\n{a} (to camera): {cam:holding-info}',
  ],
  boasted: [
    '{b} was on {tb}, {tb} won {mission}, and {b} won’t let {a} forget it.\n{b}: "Did I mention we won?"\n{a}: "About six times."',
    '{b} boasts about {tb} the whole way home.\n{b}: "We were brilliant. Just brilliant."\n{a} (to camera): "{b} is unbearable today."',
    '{b} can’t stop going on about {tb}’s win.\n{a}: "Alright, we get it."',
    '{b} rubs it in.\n{b}: "Better luck next time, {a}."\n{a}: "Thanks."',
  ],
  'shrugged-off': [
    '{a} asks {b} how {tb} actually got on, and gets nothing.\n{b}: "Fine."\n{a}: "Just fine?"\n{b}: "Just fine."',
    '{b} gives {a} an answer that could describe any afternoon.\n{a} (to camera): "Vague. Very vague."',
    '{b} won’t talk about {tb}’s side.\n{b}: "It was a mission. We did it."',
    '{a} tries to find out about {tb}. {b} changes the subject.\n{a} (to camera): {cam:unsure-info}',
  ],
};

registerEvent({
  id: 'mission-the-other-half',
  family: 'suspicion',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'strategic', 'social', 'temperament'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'rival', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    const [a, b] = ctx.actors;
    const ta = teamOf(m, a), tb = teamOf(m, b);
    return ta && tb && ta !== tb ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-the-other-half');
    const sceneWhy = 'compared the two halves of the afternoon on the road home';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const ta = teamOf(m, a), tb = teamOf(m, b);
    const bWon = tb.name === m.bestTeam;
    const st = pStats(b);
    // THE FOURTH BRANCH IS DECIDED BY THE RECORD, NOT BY THE ROLL, and that
    // is the knowledge axis doing real work: overselling your own half is a
    // contradiction the listener can check when the record disagrees (`gap`)
    // and merely tiresome when it agrees (`boasted`). Same behaviour, two
    // different scenes, because the fact underneath is different.
    const bragBranch = bWon ? 'boasted' : 'gap';
    const branch = forkOn(rng, {
      'compared-clean': (st.social / 10) * 0.4 + (st.loyalty / 10) * 0.3,
      traded: (st.strategic / 10) * 0.45 + (st.intuition / 10) * 0.3,
      [bragBranch]: (st.boldness / 10) * 0.5 + (1 - st.temperament / 10) * 0.3,
      'shrugged-off': (1 - st.social / 10) * 0.5 + 0.1,
    });
    const note = line(OTHER_HALF_LINES[branch], 'mission-the-other-half', branch, ctx.ep, {
      a, b, ta: ta.name, tb: tb.name, mission: m.name,
      tier: tierPhrase(m, 'mission-the-other-half', ctx.ep),
    });
    const bondDelta = branch === 'compared-clean' ? 1
      : branch === 'traded' ? 1.5 : branch === 'gap' ? -1
        : branch === 'boasted' ? -1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'traded' || branch === 'compared-clean' ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 4. WHAT THE DAY WAS WORTH — the pot, discussed in words
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `tier`, and how the afternoon paid. Readable every time, which
// is what makes this the broadest event in the window and the one that keeps
// the phase from going quiet on a night the others do not clear.
// NO FIGURES: see the number rule in the header.
const WORTH_LINES = {
  'counted-it': [
    '{a} and {b} work out what {mission} was actually worth on the walk back.\n{a}: "So that’s what, a few thousand?"\n{b}: "Something like that. Not bad."\n{a}: "Not bad at all."',
    '{a} says the total out loud, and {b} makes {aObj} say it again.\n{b}: "Say that again."\n{a}: "You heard."\n{b}: "I want to hear it again."',
    '{a} and {b} add up the pot on the way home.\n{b}: "The pot’s getting big now."\n{a}: "Big enough to lie for."',
    '{a} and {b} agree that {tier}.\n{a} (to camera): {cam:money}',
  ],
  bitter: [
    '{a} can’t get over what {mission} cost against what it paid.\n{a}: "All that, for that?"\n{b}: "It’s money."\n{a}: "It’s not enough money."',
    '{a} is bitter about {mission} the whole way home.\n{a}: "We should have got double that."\n{b}: "Should’ve, would’ve."',
    '{a} says it out loud: {tier}.\n{b}: "Alright, we know."\n{a}: "I’m just saying."',
    '{a} grumbles about the pot.\n{a} (to camera): {cam:mission-angry}',
  ],
  joked: [
    '{a} makes {b} laugh about {mission} on the road back.\n{a}: "Did you see my face when it collapsed?"\n{b}: "I’ll never forget it."\nThey’re still laughing at the gate.',
    'By the second hill, {mission} has become a running joke.\n{b}: "Next time, you’re carrying the heavy one."\n{a}: "Next time, you’re not dropping it."',
    '{a} and {b} laugh the whole way home.\n{b} (to camera): "Best walk home we’ve had. Needed that."',
    '{a} does an impression of the estate manager, and {b} cries laughing.\n{b}: "Stop, stop."',
  ],
  'already-past-it': [
    '{a} is done with {mission} before the road bends.\n{a}: "The money’s the money. Who are we talking about at the table?"\n{b}: "Straight to business."',
    '{a} wants to talk about tonight, not the mission.\n{a}: "Forget the mission. Who’s going tonight?"\n{b}: "You tell me."',
    '{a} moves on from {mission} immediately.\n{a}: "Right. The Round Table."\n{b}: "Give it five minutes."',
    '{a} has already stopped thinking about the afternoon.\n{a} (to camera): {cam:plan}',
  ],
};

registerEvent({
  id: 'mission-what-the-day-was-worth',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'social', 'strategic', 'mental'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // THE BROADEST TWO-PERSON GATE IN THE WINDOW, AND DELIBERATELY SO. Two
    // people on the road after an afternoon that has a recorded result. If
    // this one is narrow, the phase is empty on the nights the others do not
    // clear.
    //
    // NOT WIDENED TO SOLO, and the reason is worth recording because it is a
    // real constraint on where a solo scene may live. A solo firing has to
    // write a beat on a ONE-PARTY arc (the silence floor in
    // tests/tr-castle-castle-prose.test.js requires a beat from every firing),
    // and `trust-late-checkin` and its twin in js/tr/castle/trust.js both do
    // `const [a, b] = t.parties` on whatever open `trust` arc they find. A
    // one-party trust arc therefore hands them `b === undefined`, which the
    // scene API refuses outright — measured, as a thrown season, the first
    // time this event opened one. Solo coverage for this window lives on
    // `mission-what-cost-us`, `mission-a-body-short`, `mission-the-long-walk`
    // and `mission-a-name-by-the-time-were-back`, whose arcs are `suspicion`
    // and `grief` and where nothing in the pool destructures the parties.
    return afternoon(ctx) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-what-the-day-was-worth');
    const sceneWhy = 'argued about what the afternoon had actually been worth';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const st = pStats(a);
    const thin = m.tier === 'scraped' || m.tier === 'failed';
    const branch = forkOn(rng, {
      'counted-it': (st.mental / 10) * 0.45 + (st.strategic / 10) * 0.3,
      bitter: (1 - st.temperament / 10) * 0.5 + (thin ? 0.3 : 0.05),
      joked: (st.social / 10) * 0.5 + (st.boldness / 10) * 0.25,
      'already-past-it': (st.strategic / 10) * 0.4 + 0.2,
    });
    const note = line(WORTH_LINES[branch], 'mission-what-the-day-was-worth', branch, ctx.ep, {
      a, b, mission: m.name,
      tier: tierPhrase(m, 'mission-what-the-day-was-worth', ctx.ep),
    });
    const bondDelta = branch === 'joked' ? 1.5
      : branch === 'counted-it' ? 1 : branch === 'bitter' ? -1 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 5. WHAT YOU SAW OUT THERE — a test built out of a shared afternoon
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: they were on the same team, so `{a}` knows what `{b}` should be
// able to describe. That is what makes this a TEST rather than a question —
// the asker can check the answer, which is the one thing a castle conversation
// almost never has and the reason this event is in this window and not indoors.
const WHAT_YOU_SAW_LINES = {
  answered: [
    '{a} asks {b} about a part of {mission} only someone on {team} could have seen, and {b} answers straight away.\n{a}: "What happened at the far end?"\n{b}: "We got stuck for ten minutes, then {team} got it moving."',
    '{b} answers {a}’s question about {team}’s afternoon in detail, and all of it checks out.\n{a} (to camera): "Everything {b} said matches. Good."',
    '{a} tests {b} on {mission}, and {b} passes.\n{b}: "Ask me anything. I was there."',
    '{a} checks {b} was where {bSub} said.\n{b}: "I was on {team} the whole time. Ask them."',
  ],
  caught: [
    '{b} answers two questions about {team}, then turns it round.\n{b}: "You were standing next to me. So why are you asking?"\n{a}: "Just checking."\n{b}: "This isn’t about the mission, is it?"',
    '{b} realises {a} is testing {bObj}.\n{b}: "You know exactly where I was."\n{a} (to camera): "Caught."',
    '{b} catches on to {a}’s questions.\n{b}: "What are you really asking me?"',
    '{b} works out what {a} is doing.\n{b}: "Is this a test? It feels like a test."',
  ],
  blank: [
    '{a} asks {b} about {mission}, and {b} can’t put the afternoon in order.\n{b}: "We did the — no, first we — I don’t know, it’s a blur."\n{a} (to camera): "It was three hours ago."',
    '{b} gets {team}’s afternoon muddled on the way home.\n{b}: {say:answer-shaky}\n{a} (to camera): {cam:holding-info}',
    '{b} can’t remember the order of things at {mission}.\n{a}: "You were there."\n{b}: "I know. It’s just all mixed up."',
    '{b} goes blank on a simple question.\n{a} (to camera): "Strange. {b} was right in the middle of it."',
  ],
  turned: [
    '{b} answers {a}’s question, then asks a better one back.\n{b}: "Fine. Where were you when it went wrong?"\n{a}: "Me?"\n{b}: "You."',
    '{b} flips the conversation.\n{b}: "Why are you so interested in {team}?"\n{a} (to camera): "Good question. I didn’t have a good answer."',
    '{b} turns the questions on {a}.\n{b}: "My turn. What were you doing?"',
    '{b} takes over the conversation.\n{a} (to camera): "I asked one question. I answered five."',
  ],
};

registerEvent({
  id: 'mission-what-you-saw-out-there',
  family: 'testing',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'backfire', 'ambiguous'],
    voice: ['intuition', 'mental', 'boldness', 'temperament'],
    knowledge: ['witnessed', 'incomplete'],
    alignment: ['faithful', 'original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    const [a, b] = ctx.actors;
    const ta = teamOf(m, a);
    if (!ta || ta !== teamOf(m, b)) return 0;
    // A test is worth running on somebody you are not sure about.
    return getBond(a, b) < 4 ? 3 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-what-you-saw-out-there');
    const sceneWhy = 'checked an account of the afternoon against the afternoon';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const team = teamOf(m, a);
    const st = pStats(b);
    // A person carrying something has more to keep straight and answers this
    // differently. THE ROLE READ IS THE ANSWERER'S OWN, which is the one role
    // a castle event may look at (probes A/B/C, tests/tr-castle.test.js).
    const carrying = isTraitor(b, ctx.ep);
    const branch = forkOn(rng, {
      answered: (st.mental / 10) * 0.5 + (st.temperament / 10) * 0.3,
      caught: (st.intuition / 10) * 0.5 + (carrying ? 0.25 : 0.05),
      blank: (1 - st.mental / 10) * 0.45 + (1 - st.temperament / 10) * 0.3 + (carrying ? 0.15 : 0),
      turned: (st.boldness / 10) * 0.4 + (st.strategic / 10) * 0.3,
    });
    const note = line(WHAT_YOU_SAW_LINES[branch], 'mission-what-you-saw-out-there', branch,
      ctx.ep, { a, b, team: team.name, mission: m.name });
    const bondDelta = branch === 'answered' ? 1
      : branch === 'caught' ? -1 : branch === 'blank' ? -1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'blank' ? 'suspicion' : 'testing';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    // `turned` HANDS THE SCENE OVER, so it hands the roles over with it: on
    // that branch {b} is asking and {a} is answering, and the screen must
    // answer in {a}'s voice or it renders the person who took control of the
    // conversation as the person fumbling it. See the note above.
    // `caught` was inverted here too for one draft and put back, and the
    // reason is worth keeping: flipping it fixed the REACTION card (the person
    // who worked out they were being measured stopped being drawn as the one
    // fumbling) and broke the CONSEQUENCE card, which names the speaker as the
    // one who came away with a read — so the tester was rendered as having
    // failed their own test. The screen's `tested` pools assume the asker
    // never loses the conversation, and one field cannot say otherwise for
    // both cards at once. `turned` is flipped because there the answerer
    // genuinely takes the scene over and asks the better question; `caught` is
    // not, because the answerer only NOTICES. That limit is castle-day.js's to
    // fix, not this file's.
    const tookOver = branch === 'turned';
    return { branch, pair: [a, b], speaker: tookOver ? b : a, respondent: tookOver ? a : b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 6. A BODY SHORT — the afternoon ran without somebody in it
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: `murderCount(gs)` (js/tr/state.js — derived, because night one's
// murder is never pushed as a round and a count off `rounds` is short by one
// all season), plus the mission's own team lists, which are drawn from the
// living. The castle went out to `{mission}` with fewer people than it had,
// and the road home is where that lands.
const BODY_SHORT_LINES = {
  'named-them': [
    '{a} says the name of the person who should have been on {team}, the first time anyone has all day.\n{a}: "They’d have loved that mission."\n{b}: "They would."',
    '{a} tells {b} what the missing one would have been like on {mission}.\n{a}: "They’d have been straight in the water. No hesitation."\n{b}: "They would."',
    '{a} brings up the empty space on {team}.\n{a}: "We were one short today. Did you feel it?"\n{b}: "All afternoon."',
    '{a} mentions who wasn’t there.\n{b}: "I was thinking the same thing."',
  ],
  'did-not-mention-it': [
    '{a} and {b} walk back from {mission} talking about nothing, and both know what they’re not talking about.\n{a}: "Nice weather."\n{b}: "Lovely."',
    'There are {living} of them on the road home, and neither {a} nor {b} mentions the ones who aren’t.\n{b} (to camera): "We didn’t say it. We both thought it."',
    '{a} and {b} keep the chat light.\n{a}: "What’s for dinner?"\n{b}: "No idea."',
    '{a} and {b} avoid the subject all the way home.\n{a} (to camera): "Some things you don’t say out loud."',
  ],
  angry: [
    '{a} is furious on the road back, and it isn’t about the mission.\n{a}: "We did all that, and we’re still going home to lose somebody tonight."\n{b}: "I know."',
    '{a} can’t let it go.\n{a}: "What’s the point of the money if we keep losing people?"\n{b} has no answer.',
    '{a} is angry about who is missing.\n{a} (to camera): {cam:mission-angry}',
    '{a} snaps on the walk home.\n{a}: "I’m sick of it. All of it."',
  ],
  'on-their-own': [
    '{a} walks back from {mission} thinking about the one who should have been on {team}.\n{a} (to camera): "There should have been one more of us out there. I kept turning round to say something to them."',
    'There are {living} of them coming back up the path. {a} counts, and wishes {aSub} hadn’t.\n{a} (to camera): {cam:few-left}',
    '{a} walks home alone, missing someone.\n{a} (to camera): {cam:homesick}',
    '{a} notices the gap on {team} the whole afternoon.\n{a} (to camera): "We were one short. You feel it in a mission."',
    '{a} walks the long way back, thinking about who has gone.\n{a} (to camera): {cam:few-left}',
    '{a} looks at the line walking home and thinks how short it has got.\n{a} (to camera): {cam:few-left}',
    '{a} keeps thinking about the empty place on {team}.\n{a} (to camera): {cam:few-left}',
    '{a} walks back, quieter than usual.\n{a} (to camera): "Missions are harder when you know who should be there."',
    '{a} thinks about the first mission, when everyone was still here.\n{a} (to camera): {cam:few-left}',
    '{a} walks home on {aPos} own after {mission}.\n{a} (to camera): "Every mission there are fewer of us doing it. You notice it most on the walk back."',
  ],
  useful: [
    '{a} brings up the missing player, then brings up who has got quieter since.\n{a}: "Think about who’s been comfortable this week."\n{b}: "You mean since they went?"\n{a}: "Exactly since."',
    '{a} uses the empty space on {team} to make a point.\n{a}: "Who benefits from them being gone?"\n{b}: "I hadn’t thought about it like that."',
    '{a} ties the missing player to a suspicion.\n{a} (to camera): {cam:holding-info}',
    '{a} gets {b} thinking.\n{a}: "Someone relaxed the day they went. Watch for it."',
  ],
};

registerEvent({
  id: 'mission-a-body-short',
  family: 'grief',
  window: 'journey-back',
  // No `roles` — same reason as `mission-what-cost-us`: this one also fires
  // solo, and the paired branches name the pair on the result instead.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['temperament', 'loyalty', 'social', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (!ctx.actors?.length || ctx.actors.length > 2) return 0;
    if (!afternoon(ctx)) return 0;
    // The castle has to have lost somebody for the afternoon to be a body
    // short. True from the first morning onward, so ~every episode.
    return murderCount(gs) >= 1 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-a-body-short');
    const sceneWhy = 'the afternoon ran with the castle a body short';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const team = teamOf(m, a) || m.teams[0];
    const st = pStats(a);
    if (!b) {
      const soloNote = line(BODY_SHORT_LINES['on-their-own'], 'mission-a-body-short',
        'on-their-own', ctx.ep,
        { a, mission: m.name, team: team.name, living: countWord((gs.activePlayers || []).length) });
      const solo = arcContinue(api, 'grief', [a], ctx.ep, soloNote, { source: sceneWhy });
      return { branch: 'on-their-own', actor: a,
        threadId: solo.thread?.id, cited: solo.cited, bondDelta: 0 };
    }
    const branch = forkOn(rng, {
      'named-them': (st.loyalty / 10) * 0.45 + (st.social / 10) * 0.35,
      'did-not-mention-it': (1 - st.social / 10) * 0.5 + (st.temperament / 10) * 0.25,
      angry: (1 - st.temperament / 10) * 0.5 + (st.boldness / 10) * 0.25,
      useful: (st.strategic / 10) * 0.45 + (1 - st.loyalty / 10) * 0.3,
    });
    const note = line(BODY_SHORT_LINES[branch], 'mission-a-body-short', branch, ctx.ep, {
      a, b, mission: m.name, team: team.name,
      living: countWord((gs.activePlayers || []).length),
    });
    const bondDelta = branch === 'named-them' ? 2
      : branch === 'did-not-mention-it' ? 0.5 : branch === 'angry' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'useful' ? 'suspicion' : 'grief';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 7. WHAT THEY CAN ASK ME ABOUT — a Traitor auditing the day
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: the afternoon this person actually had — which half they were
// on, how it went — is the only material an account of the day can be built
// out of, and it is the material everybody else has too. That is the whole
// mechanic: the day is a shared, checkable fact, and a person with something
// to keep straight has to decide how much of it to volunteer tonight.
//
// SOLO OR PAIRED, deliberately. `_sceneActors` (js/tr/events.js) draws one
// person about 40% of the time, and a window whose events all need two is a
// window that declines two draws in five.
const AUDIT_LINES = {
  solid: [
    '{a} goes back over {mission} on the road home, and can’t find a minute anyone could question.\n{a} (to camera): {cam:story-fine}',
    'By the gate, {a} has all of {team}’s afternoon in order.\n{a} (to camera): "Every minute accounted for. Let them ask."',
    '{a} checks {aPos} own afternoon, and it’s clean.\n{a} (to camera): {cam:story-fine}',
    '{a} walks home confident about {mission}.\n{a} (to camera): "Nobody can say I wasn’t pulling my weight."',
  ],
  thin: [
    'There’s an hour of {mission} {a} can’t account for, and {aSub} turns it over the whole way home.\n{a} (to camera): {cam:story-close}',
    '{a} has one gap in the afternoon and no good way to fill it.\n{a} (to camera): "If anyone asks where I was at three, I’m in trouble."',
    '{a} worries about a missing hour on {mission}.\n{a} (to camera): {cam:story-close}',
    '{a} can’t make {aPos} afternoon add up.\n{a} (to camera): "I need a better story for that bit."',
  ],
  overtold: [
    '{a} tells {who} all about {mission} without being asked once.\n{a} (to camera): {cam:overdid}',
    '{a} gives far more of the afternoon than anyone wanted.\n{a} (to camera): "Why did I tell {who} all that? Nobody asked."',
    '{a} explains {aPos} whole afternoon to {who}.\n{a} (to camera): {cam:overdid}',
    '{a} says too much on the walk home.\n{a} (to camera): "Too much detail. That’s what guilty people do."',
  ],
  unasked: [
    'Nobody asks {a} anything about {mission} on the way home, and {a} notices how much that’s worth.\n{a} (to camera): {cam:story-fine}',
    '{a} expected a question and never gets one.\n{a} (to camera): {cam:invisible}',
    '{a} walks the whole road without a single question.\n{a} (to camera): "Nobody’s curious about me. Perfect."',
    '{a} came off {team} braced for questions. None come.\n{a} (to camera): {cam:story-fine}',
  ],
};

registerEvent({
  id: 'mission-what-they-can-ask-me',
  family: 'cover',
  window: 'journey-back',
  threadScope: 'solo',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire', 'rejected'],
    voice: ['strategic', 'temperament', 'mental', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    if (!afternoon(ctx)) return 0;
    // Solo OR paired: whichever of the people in the scene is carrying
    // something. Reads only that person's OWN alignment.
    return ctx.actors.some(n => isTraitor(n, ctx.ep)) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-what-they-can-ask-me');
    const sceneWhy = 'audited the afternoon for the parts that could be asked about';
    const m = afternoon(ctx);
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const team = teamOf(m, actor) || m.teams[0];
    const st = pStats(actor);
    const branch = forkOn(rng, {
      solid: (st.strategic / 10) * 0.45 + (st.temperament / 10) * 0.35,
      thin: (1 - st.mental / 10) * 0.45 + (1 - st.temperament / 10) * 0.3,
      overtold: (st.social / 10) * 0.35 + (1 - st.temperament / 10) * 0.3,
      unasked: 0.4,
    });
    // ── OVERTELLING IS PROPAGATION, AND IT NOW LEAVES RECEIPTS ──────────
    //
    // The `overtold` branch's whole content is that the actor volunteered their
    // afternoon to people who had not asked. It said "three separate people"
    // and named none, so nothing in the castle actually learned anything and no
    // later scene could cite it. The listeners are chosen by who this person
    // talks to (`whoTheyTold`, js/tr/castle/lines.js — no rng draw), the
    // sentence is filled from the list that was actually reached, and the
    // account is stored as a claim they heard.
    const told = branch === 'overtold'
      ? whoTheyTold(actor, ctx.actors || [actor], ctx.living, 3)
      : [];
    const note = line(AUDIT_LINES[branch], 'mission-what-they-can-ask-me', branch, ctx.ep, {
      a: actor, mission: m.name, team: team.name,
      who: namesPhrase(told), n: countWord(told.length),
    });
    if (told.length) {
      api.recordClaim(actor, `${actor} gave an unprompted account of ${m.name}`,
        { listeners: told, channel: 'conversation',
          source: 'volunteered the afternoon to people who had not asked' });
    }
    const { thread, cited } = arcContinue(api, 'cover', [actor], ctx.ep, note, { source: sceneWhy });
    // The one observable consequence available without touching a belief: a
    // person who talked too much on the road spent something with whoever was
    // walking beside them.
    let bondDelta = 0;
    const beside = ctx.actors.find(n => n !== actor);
    if (beside && (branch === 'overtold' || branch === 'thin')) {
      bondDelta = branch === 'overtold' ? -1 : -0.5;
      api.addBond(actor, beside, bondDelta, { source: sceneWhy });
    } else if (beside && branch === 'solid') {
      bondDelta = 0.5;
      api.addBond(actor, beside, bondDelta, { source: sceneWhy });
    }
    return { branch, actor, actors: beside ? [actor, beside] : [actor],
      speaker: beside ? actor : null, respondent: beside || null,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 8. THE HOUR THEY WENT MISSING — the relic detour, argued about by the
//    people who did not take it
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: on a Reliquary afternoon `m.shield` (or `m.dagger`) carries
// `searcher`, `found`, `cost` — what the hour actually took out of the pot,
// scored by running the same afternoon with the searcher's hour put back in —
// and `witnesses` and `visibility`, which say who saw the prize handed over.
//
// THE ONE RELIC-GATED PAIR EVENT, AND IT IS DECLARED `rare`. The block is on
// 23.3% of afternoons; that is a real precondition rather than a rare
// conjunction, but it is well under the broad gates around it, so guard 2's
// amplification is what stops it being outdrawn every night by
// `mission-what-the-day-was-worth`. It deliberately does NOT require anybody
// in the scene to BE the searcher (3.9%) — the shield fallout contract's own
// worked example is Ellie and the teammates, not Fiore.
//
// AND IT MAY NOT SAY EVERYONE IS ANGRY. `witnesses` is the list of people who
// saw it happen; the contract forbids "everyone learned" when the record does
// not say so. So the branches turn on whether THESE TWO saw it, which the
// record answers exactly.
const MISSING_HOUR_LINES = {
  'counted-the-cost': [
    '{a} and {b} work out what {who}’s hour away from {team} cost the afternoon.\n{a}: "{who} was gone the whole middle of it."\n{b}: "And we finished a person short."\n{a}: "Exactly."',
    '{a} and {b} add up what {who}’s missing hour took off the pot.\n{b}: "That’s a lot of money for one shield."\n{a}: "That’s what I’m saying."',
    '{a} brings up {who} going missing.\n{a}: "Where did {who} even go?"\n{b}: "To get the shield, I think."',
    '{a} and {b} aren’t happy about {who}’s hour.\n{b} (to camera): "{who} looked after {who}. The rest of us paid for it."',
  ],
  'defended-the-hour': [
    '{a} complains about {who} leaving. {b} defends it.\n{b}: "I’d have gone looking too. So would you."\n{a}: "Maybe."',
    '{b} sticks up for {who}.\n{b}: "Anyone with a chance at a shield would take it."\n{a}: "Not in the middle of the job."',
    '{b} won’t hold it against {who}.\n{b}: "It’s the game. You’d have done the same."',
    '{b} defends {who}’s hour.\n{a} (to camera): "{b}’s very quick to defend {who}."',
  ],
  'saw-it-happen': [
    '{a} tells {b} exactly what it looked like when {who} came back with it.\n{a}: "{who} came back with something in {whoPos} pocket. I saw it."\n{b}: "What was it?"\n{a}: "No idea. But {who} looked pleased."',
    '{a} was there when {who} was handed something.\n{a}: "I was standing right there."\n{b} listens all the way home.',
    '{a} describes {who}’s return to {b}.\n{a} (to camera): {cam:holding-info}',
    '{a} saw {who} slip back into the team.\n{a}: "{who} thought nobody noticed. I noticed."',
  ],
  'let-it-alone': [
    '{a} brings up {who}’s hour, and {b} won’t discuss it.\n{b}: "Not worth it. There’s a table tonight."\n{a}: "Fine."',
    '{b} politely shuts the subject down.\n{b}: "Let {who} have it. We’ve got bigger things to worry about."',
    '{b} isn’t interested in {who}’s missing hour.\n{a} (to camera): "{b} wouldn’t touch it. Interesting."',
    '{b} changes the subject.\n{b}: "Anyway. Tonight."',
  ],
};

registerEvent({
  id: 'mission-the-hour-they-went-missing',
  family: 'suspicion',
  window: 'journey-back',
  roles: 'initiator-first',
  // RARE AND DECLARED (spec §5.4.1). See the header note above: the relic block
  // is 23.3% of afternoons, so without guard 2 this loses every draw to the
  // events beside it that read a fact present every night.
  rare: true,
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['loyalty', 'boldness', 'strategic', 'temperament'],
    knowledge: ['witnessed', 'heard-with-source', 'incomplete'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    const relic = m.shield || m.dagger;
    if (!relic || !relic.searcher) return 0;
    // The two arguing about it are not the one who went. A scene where the
    // searcher is present is a different scene and this is not it.
    if (ctx.actors.includes(relic.searcher)) return 0;
    if (ctx.living && !ctx.living.includes(relic.searcher)) return 0;
    return 3;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-the-hour-they-went-missing');
    const sceneWhy = 'argued about the hour somebody spent away from their team';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const relic = m.shield || m.dagger;
    const team = teamOf(m, relic.searcher) || m.teams[0];
    const st = pStats(b);
    // WHAT THE RECORD ALLOWS EACH BRANCH TO SAY. `saw-it-happen` is only
    // available when the record puts {a} on the witness list, because a person
    // describing a handover they did not see is the misinformed-speaker case
    // and this event does not have one.
    const aSaw = Array.isArray(relic.witnesses) && relic.witnesses.includes(a) && relic.found;
    const scores = {
      'counted-the-cost': (st.strategic / 10) * 0.45 + (st.mental / 10) * 0.3,
      'defended-the-hour': (st.boldness / 10) * 0.35 + (st.loyalty / 10) * 0.35,
      'let-it-alone': (st.temperament / 10) * 0.4 + 0.15,
    };
    if (aSaw) scores['saw-it-happen'] = 0.9;
    const branch = forkOn(rng, scores);
    const note = line(MISSING_HOUR_LINES[branch], 'mission-the-hour-they-went-missing',
      branch, ctx.ep, { a, b, who: relic.searcher, mission: m.name, team: team.name });
    const bondDelta = branch === 'counted-the-cost' ? 1
      : branch === 'defended-the-hour' ? -1 : branch === 'saw-it-happen' ? 1.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'suspicion', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: relic.searcher,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 9. THE ONE WHO TOOK THE EXTRA — a recorded success, and what a room
//    does with somebody who volunteers
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: the mirror of event 1. `sideObjectives[].achieved === true`
// names a person who broke off to do a job nobody had to do and pulled it off.
// The fact is flattering; what the castle does with a flattering fact three
// days before a banishment is not.
const TOOK_EXTRA_LINES = {
  credited: [
    '{a} and {b} are impressed that {who} went and managed to {task}.\n{a}: "{who} actually did it. Nobody asked, and {who} just did it."\n{b}: "Best bit of the whole day."',
    '{a} and {b} give {who} the credit.\n{b}: "Say what you like about {who}, that was brilliant."\n{a}: "Agreed."',
    '{a} can’t stop talking about {who}’s bonus.\n{a}: "Did you see {who} go for it?"\n{b}: "Couldn’t miss it."',
    '{b} praises {who} on the way home.\n{b} (to camera): "Fair play to {who}. That was bold."',
  ],
  'suspicious-of-eager': [
    '{a} wonders why {who} was so keen to {task}.\n{a}: "Why {who}, though? Why volunteer in front of everyone?"\n{b}: "To look good?"\n{a}: "Exactly."',
    '{a} doesn’t think {who} went for the extra out of kindness.\n{a} (to camera): "Nobody’s that eager unless they want to be seen being eager."',
    '{a} and {b} discuss {who}’s enthusiasm.\n{b}: "Maybe {who} just wanted to help."\n{a}: "Maybe."',
    '{a} finds {who}’s eagerness suspicious.\n{a} (to camera): {cam:holding-info}',
  ],
  'used-it': [
    '{a} brings up {who}’s bonus, and uses it to argue {who} isn’t the name for tonight.\n{a}: "You can’t vote out someone who just did that for the pot."\n{b}: "I suppose not."\n{b} (to camera): "{a} was steering me. I could tell."',
    '{a} uses {who}’s good deed to push the vote elsewhere.\n{a}: "It can’t be {who}. Not after today."',
    '{a} spins {who}’s bonus into an argument.\n{a} (to camera): {cam:plan}',
    '{a} makes {who}’s extra work count for something.\n{b}: "You really want {who} safe, don’t you?"',
  ],
  unimpressed: [
    '{b} isn’t impressed by {who}.\n{b}: "Somebody was always going to {task}. It isn’t a personality."\n{a}: "Harsh."',
    '{a} praises {who}. {b} shrugs.\n{b}: "It’s a team number. It always has been."',
    '{b} won’t give {who} the credit.\n{b}: "Anyone could’ve done that."',
    '{b} rolls {bPos} eyes at {who}’s bonus.\n{b} (to camera): "Showing off. That’s all that was."',
  ],
};

registerEvent({
  id: 'mission-took-the-extra',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'strategic', 'intuition', 'temperament'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    return wonTask(m, { exclude: ctx.actors, living: ctx.living }) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-took-the-extra');
    const sceneWhy = 'weighed up the one who volunteered for the extra job';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const win = wonTask(m, { exclude: ctx.actors, living: ctx.living });
    const st = pStats(a);
    const branch = forkOn(rng, {
      credited: (st.social / 10) * 0.4 + (st.loyalty / 10) * 0.35,
      'suspicious-of-eager': (st.intuition / 10) * 0.45 + (1 - st.loyalty / 10) * 0.25,
      'used-it': (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.2,
      unimpressed: (st.temperament / 10) * 0.35 + (1 - st.social / 10) * 0.3,
    });
    const note = line(TOOK_EXTRA_LINES[branch], 'mission-took-the-extra', branch, ctx.ep, {
      a, b, who: win.player, task: sideObjectiveLabel(win.id), mission: m.name,
    });
    const bondDelta = branch === 'credited' ? 1.5
      : branch === 'suspicious-of-eager' ? 0.5 : branch === 'used-it' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'credited' ? 'trust' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, subject: win.player,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 10. WE'VE DONE THIS BEFORE — a shared afternoon on top of a shared
//     season
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD, AND IT IS TWO OF THEM: the franchise ledger says what these two
// were to each other in a previous season, and tonight's mission record says
// whether they were on the same half of the room today. The alumni-history
// contract's rule applies in full — the claim stays exactly what the ledger
// supports, and a low bond may motivate distrust but may not manufacture an
// incident. `storyWith` (js/tr/castle/callback.js) is what filters out the
// pairs who were merely CAST together, which on a returnee cast is everybody.
const DONE_THIS_BEFORE_LINES = {
  'same-page': [
    '{a} and {b} have done long days together before, back in {season}, and today reminds them.\n{a}: "Just like {season}."\n{b}: "Except we won this time."',
    '{a} and {b} walk home from {mission} talking about {season}.\n{b}: "We’ve always worked well together."\n{a}: "We have."',
    '{a} and {b}’s history makes today easier.\n{b} (to camera): "{a} and me go back to {season}. It shows."',
    '{a} and {b} fall back into old habits from {season}.\n{a}: "Same team, same result."',
  ],
  'old-account': [
    '{a} waits until {mission} is behind them, then brings up {season}.\n{a}: "We never talked about what happened in {season}."\n{b}: "Do we have to?"\n{a}: "Yes."',
    '{a} brings up something from {season}.\n{a}: "Same as {season}, isn’t it?"\n{b}: "I knew you’d say that."',
    '{a} reopens an old argument from {season}.\n{b}: "That was ages ago."\n{a}: "Not to me."',
    '{a} can’t let {season} go.\n{a} (to camera): "{b} knows what {b} did in {season}. I haven’t forgotten."',
  ],
  'not-that-person': [
    '{b} tells {a} {bSub}’s not who {bSub} was in {season}.\n{b}: "That was {season}. I was young and I was wrong about most of it."\n{a}: "Prove it."\n{b}: "I did. Today."',
    '{b} refuses to be the person {a} remembers.\n{b}: "I’ve changed. Look at today."',
    '{b} points at {mission} as proof.\n{b}: "Did I let you down today?"\n{a}: "No."\n{b}: "Then stop living in {season}."',
    '{b} asks {a} to let {season} go.\n{a} (to camera): "Maybe {b} has changed. Maybe."',
  ],
  'still-that-person': [
    '{a} watched {b} all afternoon and came away sure {season} told the truth about {bObj}.\n{a}: "You did exactly what you did in {season}."\n{b}: "What’s that supposed to mean?"',
    '{a} says it at the gate.\n{a}: "Same old {b}."\n{b}: "Wow."',
    '{a} sees the old {b} on {mission}.\n{a} (to camera): "People don’t change. {b} certainly hasn’t."',
    '{a} tells {b} {bSub} hasn’t changed.\n{b}: "You never gave me the chance to."',
  ],
};

registerEvent({
  id: 'mission-weve-done-this-before',
  family: 'callback',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'boldness', 'temperament', 'strategic'],
    relationship: ['prior-history', 'close-ally', 'rival'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if (!afternoon(ctx)) return 0;
    const [a, b] = ctx.actors;
    // Something actually happened between them in a previous season, and it is
    // on the ledger. Merely having been cast together is not history.
    return storyWith(a, b).length ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-weve-done-this-before');
    const sceneWhy = 'a shared afternoon reopened a shared season';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const history = storyWith(a, b);
    const rel = strongestRelation(history);
    const together = !!teamOf(m, a) && teamOf(m, a) === teamOf(m, b);
    const st = pStats(b);
    const sour = rel.relation === 'betrayed-by-them' || rel.relation === 'betrayed-them'
      || rel.relation === 'rivals';
    const branch = forkOn(rng, {
      // A day spent on the same side reopens the good half of a history; a day
      // spent watching from the other half reopens the rest of it.
      'same-page': (st.loyalty / 10) * 0.45 + (together ? 0.35 : 0.05) + (sour ? 0 : 0.2),
      'old-account': (st.boldness / 10) * 0.35 + (sour ? 0.35 : 0.05),
      'not-that-person': (st.social / 10) * 0.35 + (st.temperament / 10) * 0.3,
      'still-that-person': (st.intuition / 10) * 0.3 + (sour ? 0.3 : 0.05),
    });
    const note = line(DONE_THIS_BEFORE_LINES[branch], 'mission-weve-done-this-before',
      branch, ctx.ep, { a, b, mission: m.name, season: rel.seasonName });
    const bondDelta = branch === 'same-page' ? 2
      : branch === 'old-account' ? -0.5 : branch === 'not-that-person' ? 0.5 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'callback', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, season: rel.seasonName,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 11. THE LONG WALK — one person, the whole road, nobody to perform for
// ══════════════════════════════════════════════════════════════════════
//
// A SOLO EVENT, AND THE WINDOW NEEDED ONE. `_sceneActors` (js/tr/events.js)
// draws a single person about 40% of the time, and before this file every
// event in `journey-back` but one required two — so two draws in five arrived
// at a window that had nothing for them and the phase's budget rolled away
// unspent. That is a large share of the 0.70 scenes an episode this window
// used to produce, and no amount of two-person content fixes it.
//
// THE RECORD: the afternoon they have just had, and the fact that the castle
// is a body short. Nothing here needs a second person to react.
const LONG_WALK_LINES = {
  'straight-through': [
    '{a} walks the whole road home from {mission} without talking to anyone, and arrives having decided something.\n{a} (to camera): {cam:have-a-name}',
    'Everyone else walks home in twos. {a} doesn’t, and doesn’t seem to mind.\n{a} (to camera): {cam:alone-choice}',
    '{a} marches home on {aPos} own.\n{a} (to camera): {cam:front}',
    '{a} doesn’t say a word on the walk back.\n{a} (to camera): {cam:plan}',
    '{a} walks back alone, deep in thought.\n{a} (to camera): {cam:have-a-name}',
    '{a} gets home first, having talked to nobody.\n{a} (to camera): {cam:alone-choice}',
  ],
  'caught-up-with-it': [
    'It catches up with {a} on the road home, not at {mission} but afterwards, in the quiet.\n{a} (to camera): {cam:homesick}',
    '{a} was fine all afternoon, and isn’t fine somewhere between the vans and the gate.\n{a} (to camera): "It just hit me. All of it."',
    '{a} gets emotional on the walk back.\n{a} (to camera): {cam:cost}',
    '{a} walks home quietly, holding it together.\n{a} (to camera): {cam:homesick}',
    '{a} feels the day land on {aObj} on the way back.\n{a} (to camera): "I kept it together out there. Just not on the walk home."',
  ],
  'sorting-it': [
    '{a} spends the road home putting {mission} in order: who was where, who was loud, who wasn’t.\n{a} (to camera): {cam:replay-mission}',
    'By the gate, {a} has a list.\n{a} (to camera): {cam:notes}',
    '{a} goes over the afternoon step by step on the way back.\n{a} (to camera): {cam:replay-mission}',
    '{a} works out who pulled their weight on {mission}.\n{a} (to camera): "I know exactly who did nothing today."',
    '{a} thinks about who was quiet on the mission.\n{a} (to camera): {cam:watching}',
  ],
  'nothing-doing': [
    '{a} walks home from {mission} thinking about nothing in particular.\n{a} (to camera): {cam:switch-off}',
    'There are {living} of them left, and {a} spends the whole road thinking about a sandwich.\n{a} (to camera): "I’m starving. That’s my strategy tonight: dinner."',
    '{a} has a quiet, easy walk home.\n{a} (to camera): {cam:switch-off}',
    '{a} lets {aPos} mind wander on the way back.\n{a} (to camera): {cam:fresh-air}',
    '{a} enjoys the walk home.\n{a} (to camera): {cam:switch-off}',
  ],
};

registerEvent({
  id: 'mission-the-long-walk',
  family: 'grief',
  window: 'journey-back',
  threadScope: 'solo',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'strategic', 'social', 'loyalty'],
  },
  weight(ctx) {
    // ONE PERSON EXACTLY. Two people on a road are talking to each other and
    // there are eight other events in this window for that.
    if (ctx.actors?.length !== 1) return 0;
    if (!afternoon(ctx)) return 0;
    return murderCount(gs) >= 1 ? 3.5 : 2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-the-long-walk');
    const sceneWhy = 'walked the whole road home alone';
    const [a] = ctx.actors;
    const m = afternoon(ctx);
    const st = pStats(a);
    const nervy = ctx.state?.[a] === 'paranoid' || ctx.state?.[a] === 'desperate';
    const branch = forkOn(rng, {
      'straight-through': (st.temperament / 10) * 0.4 + (st.strategic / 10) * 0.25,
      'caught-up-with-it': (1 - st.temperament / 10) * 0.45 + (nervy ? 0.35 : 0.05),
      'sorting-it': (st.mental / 10) * 0.35 + (st.intuition / 10) * 0.3,
      'nothing-doing': (1 - st.strategic / 10) * 0.35 + 0.15,
    });
    const note = line(LONG_WALK_LINES[branch], 'mission-the-long-walk', branch, ctx.ep, {
      a, mission: m.name, living: countWord((gs.activePlayers || []).length),
    });
    // A SOLO SCENE STILL HAS A CONSEQUENCE, and this is the sanctioned one:
    // `setEmotionalState` (js/tr/scene-api.js) is how a scene overrides how
    // somebody is holding up, and it lapses at the next Round Table. A person
    // whom the road caught out is rattled tonight; one who used it to sort the
    // day is not, and neither is a claim about anything but them.
    if (branch === 'caught-up-with-it') {
      api.setEmotionalState(a, 'paranoid', { source: sceneWhy });
    } else if (branch === 'nothing-doing' && nervy) {
      api.setEmotionalState(a, 'content', { source: sceneWhy });
    }
    const { thread, cited } = arcContinue(api, 'grief', [a], ctx.ep, note, { source: sceneWhy });
    return { branch, actor: a, threadId: thread?.id, cited, bondDelta: 0 };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 12. WHO WAS WHERE — an account asked for by somebody who could not see
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD, AND THE REASON THIS IS NOT EVENT 5: they were on DIFFERENT
// halves of the room today, so `{a}` genuinely does not know what `{b}`'s
// afternoon looked like and cannot check the answer. Event 5 is a test, because
// the asker was there. This is a question, because the asker was not — and the
// knowledge contract's difference between a witness and an incomplete speaker
// is the whole of the difference between the two scenes.
const WHO_WAS_WHERE_LINES = {
  'straight-answer': [
    '{a} asks what {tb} was doing while {ta} was on the far side, and {b} tells {aObj}, start to finish.\n{b}: "We did the ropes first, then the boat, then we waited for you lot."\n{a}: "Okay. That matches."',
    '{b} walks {a} through {tb}’s whole afternoon.\n{a} (to camera): "Straight answer. No hesitation. I like that."',
    '{a} asks {b} where {tb} got to. {b} answers plainly.\n{b}: {say:answer-clean}',
    '{b} tells {a} exactly where {bSub} was on {mission}.\n{b}: "Ask anyone on {tb}. They’ll say the same."',
  ],
  'thin-answer': [
    '{a} asks about {tb}’s half of {mission} and gets about four sentences.\n{b}: "We were all over the place, honestly."\n{a}: "Where were you, though?"\n{b}: "Around."',
    '{b} gives {a} a thin answer about {tb}.\n{b}: {say:answer-shaky}\n{a} (to camera): {cam:holding-info}',
    '{b} is vague about {tb}’s afternoon.\n{a} (to camera): "Not much of an answer."',
    '{b} can’t say much about where {bSub} was.\n{b}: "I don’t know. Everywhere?"',
  ],
  'asked-back': [
    '{b} answers about {tb}, then wants the same about {ta}.\n{b}: "Your turn. Where were you when it went wrong?"\n{a}: "Me? I was—"\n{b}: "In detail, please."',
    '{b} turns it round on {a}.\n{b}: "What was {ta} doing, then?"\n{a} (to camera): "I didn’t expect to have to answer."',
    '{b} answers, then asks back.\n{b}: "Fair’s fair. Your afternoon."',
    '{b} matches {a}’s question with one of {bPos} own.\n{a}: "Fine. We were at the far end."',
  ],
  'refused-it': [
    '{b} won’t account for {tb}’s afternoon.\n{b}: "Why does it matter where I was?"\n{a}: "Just asking."\n{b}: "Ask someone else."',
    '{b} flatly refuses.\n{b}: "I don’t have to explain myself to you."\n{a} (to camera): "No. But you’d want to, if you had nothing to hide."',
    '{b} won’t answer.\n{b}: "I’m not doing this on the walk home."',
    '{b} declines to say.\n{a} (to camera): {cam:holding-info}',
  ],
};

registerEvent({
  id: 'mission-who-was-where',
  family: 'testing',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'boldness', 'temperament', 'strategic'],
    knowledge: ['incomplete', 'heard-with-source'],
    alignment: ['faithful', 'original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    const [a, b] = ctx.actors;
    const ta = teamOf(m, a), tb = teamOf(m, b);
    if (!ta || !tb || ta === tb) return 0;
    return 3;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-who-was-where');
    const sceneWhy = 'asked for an account of the half of the day they could not see';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const ta = teamOf(m, a), tb = teamOf(m, b);
    const st = pStats(b);
    const carrying = isTraitor(b, ctx.ep);
    const branch = forkOn(rng, {
      'straight-answer': (st.social / 10) * 0.45 + (st.loyalty / 10) * 0.3,
      // Somebody with an account to keep gives a thinner one, and the thinness
      // is the observable — not the alignment, which nobody in the scene reads.
      'thin-answer': (1 - st.social / 10) * 0.3 + (carrying ? 0.4 : 0.1),
      'asked-back': (st.strategic / 10) * 0.4 + (st.intuition / 10) * 0.25,
      'refused-it': (1 - st.temperament / 10) * 0.4 + (st.boldness / 10) * 0.2,
    });
    const note = line(WHO_WAS_WHERE_LINES[branch], 'mission-who-was-where', branch, ctx.ep, {
      a, b, ta: ta.name, tb: tb.name, mission: m.name,
    });
    const bondDelta = branch === 'straight-answer' ? 1.5
      : branch === 'asked-back' ? 0.5 : branch === 'thin-answer' ? -1 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'straight-answer' || branch === 'asked-back' ? 'testing' : 'suspicion';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    // Same inversion, same reason, as `turned` in event 5: on `asked-back` it
    // is {b} putting the question and {a} answering it. `refused-it` was
    // flipped in the same draft and put back for the reason recorded over
    // `caught` — a flat refusal is not taking the scene over, and the
    // consequence card then credited the refuser with the read.
    const tookOver = branch === 'asked-back';
    return { branch, pair: [a, b], speaker: tookOver ? b : a, respondent: tookOver ? a : b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 13. A NAME BY THE TIME WE'RE BACK — the road is where the vote gets
//     decided
// ══════════════════════════════════════════════════════════════════════
//
// THE RECORD: the afternoon everybody has just had, which is the last shared
// thing before the table and therefore the material every argument tonight
// will be built out of. Broad on purpose — this and event 4 are the two that
// keep the phase from going quiet on a night the narrower gates do not clear.
//
// SOLO OR PAIRED. One person decides on the road; two people agree, or find
// out they do not. Both are the same scene and the second is worth more.
const NAME_BY_BACK_LINES = {
  agreed: [
    'By the time the gate comes into view, {a} and {b} have a name, and they both got there from the same part of {mission}.\n{a}: "It’s got to be them."\n{b}: "I was about to say the same."',
    '{a} says a name on the road back, and {b} was about to say it too.\n{b}: "Snap."\n{a}: "Then that’s tonight."',
    '{a} and {b} agree on tonight’s name on the walk home.\n{a}: {say:suspect:someone quiet}\n{b}: "Same. Let’s do it."',
    '{a} and {b} settle on a name.\n{b} (to camera): "Two of us, same name. That’s a start."',
  ],
  'agreed-for-different-reasons': [
    '{a} and {b} get to the same name on the road home, for completely different reasons.\n{a}: "Because of what they did at the mission."\n{b}: "Because of what they said at breakfast."\n{a}: "Same name, though."',
    '{a} and {b} agree on who, and not on why.\n{b} (to camera): "{a} has a totally different reason. Doesn’t matter. Same vote."',
    '{a} and {b} land on the same person, from opposite directions.\n{a}: "Whatever the reason, it’s them."',
    '{a} and {b} agree, and don’t notice they disagree.\n{a} (to camera): "Same name. That’s all I needed."',
  ],
  split: [
    '{a} and {b} can’t agree on a name, and they’re still arguing at the gate.\n{b}: "Then we cancel each other out."\n{a}: "Looks like it."',
    '{a} and {b} each want a different name.\n{a}: "You’re wrong."\n{b}: "So are you."',
    '{a} and {b} split on tonight.\n{a} (to camera): "Two votes, two names. We’re useless."',
    '{a} and {b} don’t agree about anyone.\n{b}: "We’ll have to decide at the table."',
  ],
  'kept-it-back': [
    '{a} asks {b} who {bSub}’s writing, and {b} won’t say.\n{b}: "I’ll know when I’m sitting down."\n{a}: "You said that last time."',
    '{b} keeps {bPos} name to {bRef}.\n{b}: "I’m not saying yet."\n{a} (to camera): "{b} knows. {b} just won’t tell me."',
    '{b} won’t give {a} a name.\n{b}: "Wait and see."',
    '{b} holds back on the walk home.\n{a} (to camera): {cam:unsure-info}',
  ],
  alone: [
    '{a} walks back from {mission}, slowly settling on a name.\n{a} (to camera): {cam:have-a-name}',
    'Somewhere between the vans and the gate, {a} stops weighing names and picks one.\n{a} (to camera): {cam:have-a-name}',
    '{a} decides on tonight’s vote on the road home.\n{a} (to camera): {cam:certain}',
    '{a} walks back alone, working out who to write.\n{a} (to camera): {cam:undecided}',
    '{a} changes {aPos} mind about tonight on the walk back.\n{a} (to camera): {cam:changed-mind}',
    '{a} picks a name somewhere on the last mile.\n{a} (to camera): {cam:have-a-name}',
    '{a} thinks about tonight’s Round Table the whole way home.\n{a} (to camera): {cam:dread-table}',
    '{a} walks home, sure of {aPos} vote.\n{a} (to camera): {cam:have-a-name}',
    '{a} still has two names by the time the castle is in sight.\n{a} (to camera): {cam:undecided}',
    '{a} decides on the walk home, and doesn’t tell anyone.\n{a} (to camera): "I know who I’m writing. Nobody else needs to yet."',
  ],
};

registerEvent({
  id: 'mission-a-name-by-the-time-were-back',
  family: 'suspicion',
  window: 'journey-back',
  advancesThread: true,
  citesResidue: true,
  // ACT: this is the pre-table conversation, and it matters more the fewer
  // people there are to have it about.
  acts: { early: 0.8, late: 1.4 },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['strategic', 'boldness', 'social', 'loyalty'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    if (!afternoon(ctx)) return 0;
    // There has to be a table to be walking towards. Round one has none.
    return ctx.ep > 1 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-a-name-by-the-time-were-back');
    const sceneWhy = 'settled on a name for tonight on the road home';
    const m = afternoon(ctx);
    const [a, b] = ctx.actors;
    if (!b) {
      const st = pStats(a);
      const soloNote = line(NAME_BY_BACK_LINES.alone, 'mission-a-name-by-the-time-were-back',
        'alone', ctx.ep, { a, mission: m.name });
      const { thread, cited } = arcContinue(api, 'suspicion', [a], ctx.ep, soloNote, { source: sceneWhy });
      // A decision made alone is still a decision the season can read: it is
      // the vote intent the roundtable will find sitting there.
      void st;
      return { branch: 'alone', actor: a, threadId: thread?.id, cited, bondDelta: 0 };
    }
    const st = pStats(b);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      agreed: (st.loyalty / 10) * 0.4 + Math.max(0, bond) / 10 * 0.5,
      'agreed-for-different-reasons': (st.strategic / 10) * 0.4 + (st.mental / 10) * 0.25,
      split: (st.boldness / 10) * 0.35 + Math.max(0, -bond) / 10 * 0.45,
      'kept-it-back': (1 - st.social / 10) * 0.35 + (st.strategic / 10) * 0.25,
    });
    const note = line(NAME_BY_BACK_LINES[branch], 'mission-a-name-by-the-time-were-back',
      branch, ctx.ep, { a, b, mission: m.name });
    const bondDelta = branch === 'agreed' ? 2
      : branch === 'agreed-for-different-reasons' ? 1 : branch === 'split' ? -1 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'split' || branch === 'kept-it-back' ? 'suspicion' : 'trust';
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 14. BACK THROUGH THE GATE — the last hundred yards, where a running
//     story either ends or gets carried inside
// ══════════════════════════════════════════════════════════════════════
//
// THE ONE CLOSER IN THIS FILE, AND WHY THE WINDOW IS WHERE IT BELONGS. Plan
// 5's second amendment measured the pool's real deficit: arcs close 3.5% of
// the time, 0.84 a season, and a story that never pays off is a story a viewer
// cannot read. `journey-back` is where the day physically ends, so a thing that
// has been running since breakfast either gets settled at the gate or is
// explicitly carried indoors — and this event says which, out loud, rather
// than letting the arc drift.
//
// It takes ANY open arc between the two, not one kind, because whichever story
// these two are actually in is the one the gate is arriving on. `family` stays
// `trust` so guard 1's `advancesThread` lookup has a kind to test, and the
// arc it resolves is read from the world rather than from the family.
const ARC_KINDS_AT_THE_GATE = ['suspicion', 'trust', 'grief', 'testing', 'callback'];
const THE_GATE_LINES = {
  'settled-it': [
    '{a} and {b} finish their argument at the gate, properly, and walk in with nothing owed.\n{a}: "Are we okay?"\n{b}: "We’re okay."',
    'Whatever has been going on between {a} and {b} gets settled in the last hundred yards.\n{b}: "Let’s leave it out here."\n{a}: "Agreed."',
    '{a} and {b} shake hands at the gate.\n{a} (to camera): "Done. Sorted. Moving on."',
    '{a} and {b} clear the air before going inside.\n{b}: "No more of this."\n{a}: "No more."',
  ],
  'ended-badly': [
    '{a} and {b} finish the argument at the gate, and it ends badly for both of them.\n{b}: "Fine. Think what you want."\n{a}: "I will."',
    'The last hundred yards take whatever {a} and {b} had left.\n{a} (to camera): "That’s done now. Properly done."',
    '{a} and {b} walk through the gate not speaking.\n{b} (to camera): "That was the end of it. Of us."',
    '{a} says one thing too many at the gate.\n{b}: "Wow. Okay."',
  ],
  'carried-inside': [
    'The castle arrives before {a} and {b} are done, and they carry it inside.\n{a}: "We’ll finish this later."\n{b}: "We will."',
    '{a} and {b} run out of road before they run out of argument.\n{b} (to camera): "It’s not over. It’ll come up at the table."',
    '{a} and {b} walk in still arguing.\n{a}: "This isn’t finished."',
    '{a} and {b} bring the row through the front door.\n{a} (to camera): "Everyone saw us come in. Great."',
  ],
  'quietly-dropped': [
    'Neither {a} nor {b} brings it up again, and by the door it has gone quiet on its own.\n{a} (to camera): "I let it go. Not worth it."',
    '{a} stops pushing the point on the last mile, and doesn’t tell {b}.\n{b}: "So are we done arguing?"\n{a}: "Looks like it."',
    '{a} and {b} let the argument fade.\n{b} (to camera): "Sometimes the best thing is to just stop."',
    'The argument dies out before the gate.\n{a}: "Forget it."\n{b}: "Forgotten."',
  ],
};

registerEvent({
  id: 'mission-back-through-the-gate',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  citesResidue: true,
  // ACT: CLOSING (spec §5.4.3). Settling things belongs to the part of the
  // season that is running out of road.
  acts: { early: 0.7, late: 1.5 },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'loyalty', 'boldness', 'social'],
    relationship: ['close-ally', 'neutral', 'rival', 'prior-history'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if (!afternoon(ctx)) return 0;
    return ARC_KINDS_AT_THE_GATE.some(k => findOpenThread(k, ctx.actors)) ? 3.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-back-through-the-gate');
    const sceneWhy = 'brought it to the gate and decided whether it came inside';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const kind = ARC_KINDS_AT_THE_GATE.find(k => findOpenThread(k, ctx.actors));
    const thread = findOpenThread(kind, ctx.actors);
    const st = pStats(b);
    const bond = getBond(a, b);
    const branch = forkOn(rng, {
      'settled-it': (st.temperament / 10) * 0.4 + Math.max(0, bond) / 10 * 0.45,
      'ended-badly': (1 - st.temperament / 10) * 0.4 + Math.max(0, -bond) / 10 * 0.45,
      'carried-inside': (1 - st.boldness / 10) * 0.4 + 0.2,
      'quietly-dropped': (st.social / 10) * 0.3 + (1 - st.loyalty / 10) * 0.25,
    });
    const note = line(THE_GATE_LINES[branch], 'mission-back-through-the-gate',
      branch, ctx.ep, { a, b, mission: m.name });
    const bondDelta = branch === 'settled-it' ? 2
      : branch === 'ended-badly' ? -2 : branch === 'carried-inside' ? 0 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    // ADVANCE FIRST, THEN CLOSE. The citation has to be written into the last
    // beat or the payoff carries no memory of what it is paying off — the same
    // ordering `trust-settled-on-the-way-back` documents in journey.js.
    const advanced = arcAdvanceCiting(api, thread, ctx.ep, note, { source: sceneWhy });
    const outcome = branch === 'settled-it' ? 'passed-clean'
      : branch === 'ended-badly' ? 'turned-back'
        : branch === 'quietly-dropped' ? 'buried' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b, kind,
      threadId: thread.id, cited: advanced.cited, note: advanced.note, outcome, bondDelta };
  },
});

export const MISSION_FALLOUT_WINDOW = 'journey-back';

// ══════════════════════════════════════════════════════════════════════
// THE AFTERNOONS THAT WENT WELL, WHICH THIS FILE COULD NOT SAY
// ══════════════════════════════════════════════════════════════════════
//
// REPORTED FROM WATCHING A SEASON: the missions produce drama and never
// produce anything else. Reading the fourteen events above by their bond
// direction bears it out — the register runs "what cost us", "a body short",
// "who was where", "the hour they went missing". An afternoon in this format
// is also the only time eighteen strangers do something TOGETHER, in
// daylight, with a shared result, and that half of it had no events at all.
//
// So these four are the other half. Same contract as everything above — gated
// on tonight's record through `afternoon()`, no belief writes, no invented
// per-player score (rule 2: `sideObjectives[]` is the only place the record
// attaches an individual's name to an outcome, and `mission-good-hands` is
// the only one of these four that names one).
//
// AND THEY ARE NOT ALL WARM, because "positive" is not a register either. A
// good day makes an alliance visible, which is a cost; being carried is a
// debt; noticing somebody is competent is the first half of deciding they are
// dangerous. What they have in common is that the afternoon PRODUCED
// something between two people rather than took something away.

// ── mission-same-half-first-time ────────────────────────────────────────
// Two people who have no history at all, put on the same team by a draw. The
// castle's whole social graph starts somewhere and this is one of the places.
const FIRST_TIME_LINES = {
  'found-they-worked': [
    '{a} and {b} had barely spoken before today, and worked like old friends.\n{a}: "Where have you been all week?"\n{b}: "Right here. You just never talked to me."',
    'Nobody put {a} and {b} together. The draw did, and it was a good draw.\n{b} (to camera): "{a} and me clicked today. Didn’t see that coming."',
    '{a} and {b} discover they make a good team.\n{a}: "We should do that again."\n{b}: "We should."',
    '{a} and {b} walk back like friends.\n{a} (to camera): "New ally, maybe. We’ll see."',
  ],
  'polite-and-nothing': [
    '{a} and {b} are perfectly polite for four hours and come home strangers.\n{a}: "Well done today."\n{b}: "You too."\nThat’s it.',
    '{a} and {b} do the work, and nothing else.\n{b} (to camera): "Nice enough. No connection."',
    '{a} and {b} are civil and nothing more.\n{a} (to camera): "Four hours with {b}. I still don’t know {bObj}."',
    '{a} and {b} work fine together, and say almost nothing.\n{b}: "Cheers."\n{a}: "Cheers."',
  ],
  'got-in-the-way': [
    '{a} and {b} can’t get out of each other’s way all afternoon.\n{a}: "Could you not stand there?"\n{b}: "Could you not stand there?"',
    '{a} and {b} have the same idea and can’t agree whose it is.\n{b} (to camera): "{a} and me are too alike. It was a nightmare."',
    '{a} and {b} clash all afternoon.\n{a}: "That was painful."\n{b}: "Agreed. Never again."',
    '{a} and {b} trip over each other at every turn.\n{a} (to camera): "Worst partner I’ve had."',
  ],
  'one-of-them-carried-it': [
    '{a} does most of the work, and {b} knows it.\n{b}: "Thanks for carrying me today."\n{a}: "Any time."\n{b} (to camera): "I owe {a} one now."',
    '{a} carries the team, and {b} feels the debt.\n{b}: "I wasn’t much use, was I?"\n{a}: "You were fine."',
    '{a} pulls {b} through the afternoon.\n{a} (to camera): "I did the work. {b} knows. That’s worth something later."',
    '{b} thanks {a} quietly on the walk home.\n{b}: "I won’t forget that."',
  ],
};

registerEvent({
  id: 'mission-same-half-first-time',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['social', 'temperament', 'strategic', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    const [a, b] = ctx.actors;
    // THE SAME TEAM, and no story between them yet. `storyWith` is the same
    // "have these two got a history" filter callback.js uses, imported rather
    // than re-implemented.
    const ta = teamOf(m, a);
    if (!ta || !ta.members.includes(b)) return 0;
    if (findOpenThread('trust', [a, b]) || findOpenThread('suspicion', [a, b])) return 0;
    if (Math.abs(getBond(a, b)) > 2) return 0;
    return 2.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-same-half-first-time');
    const sceneWhy = 'was put on the same half as somebody they did not know';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = forkOn(rng, {
      'found-they-worked': ((sa.social + sb.social) / 20) * 0.4 + 0.1,
      'polite-and-nothing': (1 - sa.social / 10) * 0.3 + 0.15,
      'got-in-the-way': ((10 - sa.temperament) + (10 - sb.temperament)) / 20 * 0.3,
      'one-of-them-carried-it': (sa.physical / 10) * 0.25 + (1 - sb.physical / 10) * 0.2,
    });
    const note = line(FIRST_TIME_LINES[branch], 'mission-same-half-first-time', branch, ctx.ep,
      { a, b, mission: m.name });
    const bondDelta = branch === 'found-they-worked' ? 2.5
      : branch === 'one-of-them-carried-it' ? 1
        : branch === 'got-in-the-way' ? -1.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc('trust', [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'one-of-them-carried-it') crowd = { name: a, colour: 'kind', reason: 'covered for somebody out of their depth and said nothing about it', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: t?.id, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── mission-good-hands ──────────────────────────────────────────────────
// Somebody was VISIBLY good at something. The record has exactly one place
// that names an individual (`sideObjectives`), and this reads it — but the
// fork is what watching competence does to the watcher, which in this castle
// is not always admiration.
const GOOD_HANDS_LINES = {
  admired: [
    '{a} watched {who} {task} like it was nothing, and says so to {b}.\n{a}: "Did you see {who}? Made it look easy."\n{b}: "Very easy. Suspiciously easy?"\n{a}: "No, just good."',
    '{a} can’t stop talking about how {who} managed to {task}.\n{a}: "That was the best thing I’ve seen in here."\n{b}: "Fair play to {who}."',
    '{a} is impressed by {who}.\n{a} (to camera): "{who} has hidden talents."',
    '{a} and {b} agree {who} was brilliant today.\n{b}: "Give {who} the credit. It was all {who}."',
  ],
  'noted-it-quietly': [
    '{a} says nothing at the time about how {who} managed to {task}, and thinks about it since.\n{a} (to camera): {cam:holding-info}',
    '{a} files away how good {who} was.\n{a} (to camera): "Remember that. {who}’s more capable than {who} lets on."',
    '{a} keeps quiet about {who}’s skill.\n{a} (to camera): {cam:watching}',
    '{a} notes {who}’s performance and doesn’t tell {b}.\n{a} (to camera): "Useful to know."',
  ],
  'found-it-suspicious': [
    '{who} was far too good at it for {a}’s liking.\n{a}: "Where did {who} learn to do that?"\n{b}: "Maybe {who}’s just good."\n{a}: "Maybe."',
    '{a} is suspicious of how easy {who} made it look.\n{a} (to camera): "Too good. Too calm. Makes me wonder."',
    '{a} tells {b} {who} was suspiciously skilled.\n{b}: "You’re suspicious of everyone."',
    '{a} doesn’t trust {who}’s performance.\n{a} (to camera): {cam:holding-info}',
  ],
  'wished-it-had-been-them': [
    '{a} could have been the one to {task}, and wasn’t asked.\n{a} (to camera): "I could have done that. Nobody asked me."',
    '{a} minds that it was {who}, not {aObj}.\n{a} (to camera): "Small thing. I mind it."',
    '{a} is quiet about {who}’s moment.\n{b}: "You alright?"\n{a}: "Fine. Just wanted a go."',
    '{a} wishes it had been {aObj}.\n{a} (to camera): {cam:left-out}',
  ],
};

registerEvent({
  id: 'mission-good-hands',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'social', 'strategic', 'loyalty'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    return wonTask(m, { exclude: ctx.actors, living: ctx.living }) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-good-hands');
    const sceneWhy = 'talked about somebody who was very good out there';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const win = wonTask(m, { exclude: ctx.actors, living: ctx.living });
    const st = pStats(a);
    const branch = forkOn(rng, {
      admired: (st.social / 10) * 0.35 + (st.loyalty / 10) * 0.3,
      'noted-it-quietly': (st.strategic / 10) * 0.4 + (1 - st.social / 10) * 0.2,
      'found-it-suspicious': (st.intuition / 10) * 0.35 + (1 - st.loyalty / 10) * 0.2,
      'wished-it-had-been-them': (1 - st.physical / 10) * 0.3 + (st.boldness / 10) * 0.15,
    });
    const note = line(GOOD_HANDS_LINES[branch], 'mission-good-hands', branch, ctx.ep, {
      a, b, who: win.player, task: sideObjectiveLabel(win.id), mission: m.name,
    });
    const bondDelta = branch === 'admired' ? 1
      : branch === 'found-it-suspicious' ? -0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    // The person being TALKED ABOUT is the topic, and where the talk is
    // hostile it is their standing with {a} that moves, not the pair's.
    if (branch === 'found-it-suspicious') {
      api.addBond(a, win.player, -1, { source: sceneWhy });
    } else if (branch === 'admired') {
      api.addBond(a, win.player, 1.5, { source: sceneWhy });
    }
    const existing = findOpenThread('trust', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc('trust', [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'admired') crowd = { name: win.player, colour: 'masterful', reason: 'was the best thing on that field and the road home said so', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: win.player, topicKind: 'road-third-name', threadId: t?.id || existing?.id || null,
      bondDelta, ...(crowd ? { crowd } : {}) };
  },
});

// ── mission-laughed-about-it ────────────────────────────────────────────
// A bad afternoon is the best bonding material this format has, and the file
// had no event that could say so. Gated on the tier actually being poor.
const LAUGHED_LINES = {
  'laughed-about-it': [
    'It was a disaster, and by the second mile {a} and {b} can’t stop laughing about it.\n{a}: "When you fell in the mud—"\n{b}: "Don’t. Don’t."\nThey’re both in tears.',
    'Somebody has to find it funny first. {a} does, and then {b} goes too.\n{b}: "Worst mission ever."\n{a}: "Best worst mission."',
    '{a} and {b} laugh the whole way home about {mission}.\n{a} (to camera): "What a shambles. Loved it."',
    '{a} and {b} replay the worst moments, laughing.\n{b}: "Can we do it again tomorrow?"\n{a}: "Absolutely not."',
  ],
  'too-soon': [
    '{a} tries to make it funny, and {b} isn’t ready.\n{a}: "Well, that went well."\n{b}: "It cost us money, {a}."\n{a}: "Sorry. Too soon."',
    '{a} jokes about {mission} ninety minutes too early.\n{b} (to camera): "{a} thinks it’s funny. It’s not funny."',
    '{a} makes a joke that lands badly.\n{b}: "Not now."',
    '{a}’s joke falls flat.\n{a} (to camera): "Read the room, me. Read the room."',
  ],
  'blamed-the-set-up': [
    '{a} and {b} agree the afternoon was impossible.\n{a}: "Nobody could have won that."\n{b}: "Nobody. It was rigged."',
    '{a} and {b} blame the mission, not each other.\n{b}: "It was the set-up. Not us."\n{a}: "Definitely not us."',
    '{a} and {b} decide it was unwinnable.\n{a} (to camera): "Easier to blame the mission than each other."',
    '{a} and {b} moan about the task all the way home.\n{b}: "Whoever designed that was having a laugh."',
  ],
  'went-quiet-about-it': [
    'Neither {a} nor {b} says anything about the afternoon all the way home.\n{a} (to camera): "Nothing to say. It went badly."',
    '{a} and {b} walk back in silence.\n{b} (to camera): "Too raw to talk about."',
    '{a} and {b} don’t mention {mission} once.\n{a}: "Let’s never speak of it."\n{b}: "Deal."',
    '{a} and {b} keep quiet on the road home.\n{a} (to camera): {cam:mission-angry}',
  ],
};

registerEvent({
  id: 'mission-laughed-about-it',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['social', 'temperament', 'boldness', 'loyalty'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    // ONLY WHEN THE DAY ACTUALLY WENT BADLY. Laughing off a triumph is not a
    // scene, and the tier is on the record rather than guessed at.
    if (m.tier !== 'scraped' && m.tier !== 'failed') return 0;
    const [a, b] = ctx.actors;
    const ta = teamOf(m, a);
    return (ta && ta.members.includes(b)) ? 3 : 1.2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-laughed-about-it');
    const sceneWhy = 'walked home off a bad afternoon together';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = forkOn(rng, {
      'laughed-about-it': (sa.social / 10) * 0.35 + (sb.temperament / 10) * 0.25,
      'too-soon': (sa.boldness / 10) * 0.25 + (1 - sb.temperament / 10) * 0.25,
      'blamed-the-set-up': (sa.strategic / 10) * 0.3 + 0.15,
      'went-quiet-about-it': (1 - sa.social / 10) * 0.3 + (1 - sb.social / 10) * 0.2,
    });
    const note = line(LAUGHED_LINES[branch], 'mission-laughed-about-it', branch, ctx.ep,
      { a, b, mission: m.name, tier: tierPhrase(m, 'mission-laughed-about-it', ctx.ep) });
    const bondDelta = branch === 'laughed-about-it' ? 2.5
      : branch === 'blamed-the-set-up' ? 1.5
        : branch === 'too-soon' ? -1 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread('trust', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc('trust', [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: t?.id || existing?.id || null, bondDelta };
  },
});

// ── mission-the-good-day ────────────────────────────────────────────────
// The other end of the same rule: a triumph is a public fact, and what two
// people do with a good day is not automatically warm. A visible alliance is
// a target, and a season this format runs on knows it.
const GOOD_DAY_LINES = {
  'enjoyed-it': [
    'For one afternoon, {a} and {b} are just two people who did a job well.\n{a}: "That was fun, actually."\n{b}: "It was, wasn’t it?"',
    'Nobody mentions the game on the road home.\n{b} (to camera): "For an hour, it wasn’t The Traitors. It was just a good day."',
    '{a} and {b} walk home happy.\n{a}: "We smashed it."\n{b}: "We did."',
    '{a} and {b} enjoy the win together.\n{a} (to camera): {cam:switch-off}',
  ],
  'too-visible': [
    '{a} and {b} are the story of the afternoon, and the story travels.\n{a} (to camera): "Everyone’s talking about us. That’s not always good."',
    '{a} and {b} won it, and now everyone’s watching them.\n{b}: "We’re a target now, aren’t we?"\n{a}: "Probably."',
    '{a} and {b} worry about being too successful.\n{a} (to camera): "Nobody votes out the ones who fail. They vote out the ones who look like they’re running things."',
    '{a} and {b} are the pair everyone’s looking at tonight.\n{b} (to camera): "Winning makes you visible. Visible makes you vulnerable."',
  ],
  'took-the-credit': [
    '{a} spends the road home making sure {aPos} version of the afternoon is the one that travels.\n{b} (to camera): "It was a team result. {a} is telling it like a solo."',
    '{a} talks about the win in the first person.\n{a}: "When I got the last piece in—"\n{b}: "We got it in."\n{a}: "Yeah, we."',
    '{a} takes all the credit.\n{b} (to camera): "Typical."',
    '{a} tells everyone how {aSub} won it.\n{b}: "Funny. I was there too."',
  ],
  'shared-it-out': [
    '{a} makes sure the people who did the work get the credit.\n{a}: "{b} was the one who figured it out."\n{b}: "You didn’t have to say that."\n{a}: "Yes I did."',
    '{a} could have taken the credit, and hands it round instead.\n{b} (to camera): "{a} gave me the credit. That meant a lot."',
    '{a} shares the win.\n{a}: "Everyone did their bit."',
    '{a} names everyone who helped.\n{a} (to camera): "It was a team win. I’m not taking that from anyone."',
  ],
};

registerEvent({
  id: 'mission-the-good-day',
  family: 'trust',
  window: 'journey-back',
  roles: 'initiator-first',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'strategic', 'loyalty', 'temperament'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const m = afternoon(ctx);
    if (!m) return 0;
    // MEASURED AT 1 FIRING IN 200 SEASONS with `triumph` AND both actors on
    // the winning half. A triumph is rare and the intersection of the two is
    // rarer still — a written event that is not in the game, which is the
    // dead-content class this whole directory is audited for. `solid` is the
    // common good afternoon and it carries the same scene; the winning half
    // is what still makes it THEIR day rather than the castle's.
    if (m.tier !== 'triumph' && m.tier !== 'solid') return 0;
    const [a, b] = ctx.actors;
    if (!onTheBetterHalf(m, a) || !onTheBetterHalf(m, b)) return 0;
    return m.tier === 'triumph' ? 3 : 2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'mission-the-good-day');
    const sceneWhy = 'walked home off the best afternoon of the week';
    const [a, b] = ctx.actors;
    const m = afternoon(ctx);
    const st = pStats(a);
    const branch = forkOn(rng, {
      'enjoyed-it': (st.temperament / 10) * 0.35 + 0.15,
      'too-visible': (st.intuition / 10) * 0.3 + (st.strategic / 10) * 0.2,
      'took-the-credit': (st.social / 10) * 0.3 + (1 - st.loyalty / 10) * 0.25,
      'shared-it-out': (st.loyalty / 10) * 0.35 + (st.social / 10) * 0.2,
    });
    const note = line(GOOD_DAY_LINES[branch], 'mission-the-good-day', branch, ctx.ep,
      { a, b, mission: m.name, best: m.bestTeam });
    const bondDelta = branch === 'enjoyed-it' ? 2
      : branch === 'shared-it-out' ? 2.5
        : branch === 'took-the-credit' ? -1.5 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread('trust', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc('trust', [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'shared-it-out') crowd = { name: a, colour: 'selfless', reason: 'handed round the credit for an afternoon they could have kept', mult: 0.6 };
    else if (branch === 'took-the-credit') crowd = { name: a, colour: 'selfish', reason: 'told a team result in the first person all the way home', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: t?.id || existing?.id || null,
      bondDelta, ...(crowd ? { crowd } : {}) };
  },
});
