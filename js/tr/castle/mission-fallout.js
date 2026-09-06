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
    '“{who} was the one they sent to {task},” {a} said on the road back, and {b} did not argue with the arithmetic.',
    '{a} laid it out on the walk home — {who}, named for it, the job still not done — and {b} said yes, that was the afternoon.',
    'It took {a} about a mile to get to {who}, and when {a} did, {b} had already been there.',
    '“Somebody had to {task}. It was {who}, and it didn’t happen.” {b} nodded, and kept walking, and kept the name.',
    '{a} said {who}’s name and the task next to it, and {b} agreed that it was the part of {mission} worth remembering.',
  ],
  defended: [
    '“{who} was asked to {task},” {a} said. {b} said half the castle would have missed that and most of them know it.',
    '{a} put {who} up on the road back and {b} took {who} straight back down. “That was a lottery. You know it was.”',
    '“One extra job,” {b} said. “On {mission}, of all days. You want to hang somebody for that?”',
    '{a} named {who} for the missed task and {b} spent the rest of the walk explaining why that proved nothing at all.',
    '“Somebody had to {task},” {b} repeated, flatly. “Go on, then. Tell me you’d have managed it.”',
  ],
  redirected: [
    '{a} started on {who} and {b} moved it onto the day itself — {tier}, and no one person did that.',
    '“Forget {who},” {b} said. “Look at what {mission} actually paid us and tell me one missed job explains it.”',
    '{a} wanted {who}’s name in the conversation. {b} wanted the result, and the result was that {tier}.',
    '{b} let {a} finish about {who} and then said the thing {a} had been avoiding: {tier}, and that is a team number.',
  ],
  shrugged: [
    '{a} said {who}’s name on the walk back and {b} said nothing useful about it for the next twenty minutes.',
    '“{who} didn’t {task},” {a} said. “Mm,” {b} said, and looked at the road.',
    '{a} tried twice to get {b} onto {who} and {b} changed the subject twice, politely, both times.',
    '{b} would not put a name to a missed extra on {mission}, and {a} noticed how carefully {b} would not.',
  ],
  // ── THE SOLO SCENE, AND WHY IT IS A WIDENING RATHER THAN A NEW EVENT ──
  //
  // Measured: this window's scene sampler draws ONE person about 40% of the
  // time, and a night with three solo draws had two of them arrive at a window
  // holding almost nothing solo — which is where a third of the phase's unspent
  // budget was going. The honest fix for a gate that is too narrow is to widen
  // the gate, not to register a fourteenth event beside it. The fact is
  // identical (the record names {who} for {task} and says it did not happen);
  // what changes is that there is nobody to argue with about it.
  alone: [
    '{a} walked home turning over the one thing on the record with a name attached to it: {who}, sent to {task}, and it did not happen.',
    'Nobody else on that road seemed to have noticed that {who} had been the one asked to {task}. {a} had noticed.',
    '{a} spent the walk back from {mission} deciding what {who}’s missed job was actually worth, and did not say a word about it to anybody.',
    'It was a small thing — {task}, one person, one job — and {a} carried it the whole way home without putting it down.',
    'Everybody on that road was talking about {mission}. {a} was thinking about {who}, and about one job that did not get done.',
    'The estate manager had read out that nobody managed to {task}. {a} was the only one still thinking about it at the gate.',
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
    '{a} and {b} walked {team} home the way people walk home from something they did together, and {tier}.',
    'Whatever {mission} had been, {a} and {b} had been on the same end of it, and by the gate that had turned into something.',
    '{a} said {team} had done what it could and {b} said it twice more, louder, to nobody in particular.',
    'They were the last two off {team}’s side of the road, {a} and {b}, and neither of them was in a hurry about it.',
  ],
  'divided-it': [
    '{a} wanted to know why {team} had ended up where it did, and {b} heard the question underneath the question.',
    'By the second hill {a} and {b} had stopped talking about {mission} and started talking about each other.',
    '{team} came apart on the road back rather than on the job — {a} started it and {b} did not let it go.',
    '“We were on the same side all day,” {b} said. “So say what you actually mean.” {a} said it.',
  ],
  professional: [
    '{a} and {b} took {mission} apart on the walk back without once making it personal, which took effort from both of them.',
    '“It was the day, not the people,” {a} said about {team}, and {b} agreed, and both of them half meant it.',
    '{a} and {b} agreed that {tier}, and that nobody on {team} was going to be able to prove otherwise.',
    'It was a tidy, unemotional debrief of {team}’s afternoon, conducted between two people who were watching each other conduct it.',
  ],
  'one-sided': [
    '{a} went through {team}’s whole afternoon on the road home and {b} contributed roughly four words to it.',
    '{a} was still talking about {mission} at the gate. {b} had stopped listening somewhere near the top of the hill.',
    '“You were there,” {a} said. “I was there,” {b} agreed, and that was the whole of {b}’s contribution.',
    '{b} let {a} carry the entire conversation about {team} and gave away nothing at all in the process.',
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
    '{a} and {b} put {ta} and {tb} side by side on the road home and the two afternoons fitted together without a seam.',
    'Two halves of {mission}, told by two people who had not spoken since the briefing, and nothing in either one contradicted the other.',
    '{a} described {ta}’s day, {b} described {tb}’s, and by the gate they had one afternoon between them instead of two.',
    '{a} and {b} compared their parts of {mission} on the walk home. Their accounts matched, and {tier}.',
  ],
  traded: [
    '{a} gave {b} what {ta} had seen and took what {tb} had seen in exchange, and both of them came home with a name.',
    '{a} and {b} traded halves of {mission} on the road back like people who had agreed the price in advance.',
    '“You tell me yours, I’ll tell you mine.” By the gate {a} and {b} each knew things about {mission} nobody on their own side did.',
    '{a} had {ta}’s afternoon and {b} had {tb}’s, and neither of them walked back with only half of it.',
  ],
  gap: [
    '{b} told it as though {tb} had carried {mission}. Everybody on that road had heard the result, and {a} let the sentence sit there.',
    '“That’s not what they read out,” {a} said, quietly, when {b} finished explaining how well {tb} had done.',
    '{b}’s version of {tb}’s afternoon and the version the estate manager had announced were not the same version, and {a} had heard both.',
    '{a} did not say anything while {b} rewrote {tb}’s day on the walk home. {a} did keep it, though.',
  ],
  boasted: [
    '{b} had been on {tb}, {tb} had taken {mission}, and {b} was not going to let {a} forget either fact before the gate.',
    '“{tb},” {b} said, about six times on the way back, and each time {a} liked it slightly less.',
    '{b} was generous about {ta}’s afternoon in the specific way that makes generosity worse.',
    '{a} got the whole of {tb}’s good day narrated at {a} on the road home, and {tier} did not come into it once.',
  ],
  'shrugged-off': [
    '{a} asked {b} how {tb} had actually got on and {b} gave an answer that could have described any afternoon of the season.',
    '“Fine,” {b} said about {tb}, and {a} was still waiting for the second half of it at the gate.',
    '{b} had nothing to say about {mission} that {a} could do anything with, and said it pleasantly.',
    '{a} spent the road home asking about {tb} and came back through the gate knowing exactly what {a} had gone out knowing.',
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
    '{a} and {b} worked out what {mission} had actually been worth on the walk back, and {tier}.',
    'Somewhere on the road {a} said the total out loud and {b} made {a} say it again, slower.',
    '{a} and {b} spent the walk home doing sums about {mission} that neither of them entirely trusted.',
    '“So where does that leave the pot?” {b} asked, and {a} had the answer ready, because {a} had been working on it since the gate.',
  ],
  bitter: [
    '{a} could not get past what {mission} had cost against what it paid, and said so for most of the road.',
    '{a} said out loud, on the road, that {tier} — in the voice of somebody who had been holding the sentence in since the briefing.',
    '{b} regretted asking {a} about the money before they had got a mile down the road.',
    '{a} was still angry about {mission} at the gate, and {b} had run out of things to say about it two hills back.',
  ],
  joked: [
    '{a} made {b} laugh about {mission} on the road back, which was not a thing {b} had expected to do today.',
    'By the second hill {a} and {b} had turned {mission} into a running joke and the walk got considerably shorter.',
    '{a} said something unrepeatable about the estate manager and {b} had to stop walking for a moment.',
    'It was true that {tier}, and {a} said something about that on the road home that made {b} laugh out loud in front of everybody.',
  ],
  'already-past-it': [
    '{a} was done with {mission} before the road bent, and wanted to talk about tonight instead.',
    '“The money’s the money,” {a} said. “Who are we actually talking about at that table?”',
    '{a} and {b} gave {mission} about four minutes and the rest of the walk to the vote.',
    'Neither {a} nor {b} was interested in what the day had paid. Both of them were interested in who was going to be sitting where.',
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
    '{a} asked {b} about a part of {mission} only somebody on {team} could have seen, and {b} described it without pausing.',
    '{b} answered {a}’s question about {team}’s afternoon in more detail than {a} had asked for, and all of it was right.',
    '“Where were you when it went?” {a} asked. {b} said exactly where, and it matched the afternoon {a} had had.',
    '{a} went looking for a hole in {b}’s account of {mission} and did not find one anywhere on the road.',
  ],
  caught: [
    '{b} answered two questions about {team} and then asked {a} why {a} was asking.',
    '“You were standing next to me,” {b} said. “So you already know. Which means this isn’t about {mission}.”',
    '{b} worked out somewhere on the second hill that {a} was checking rather than reminiscing, and said so.',
    '{a} asked one question too many about {team}’s afternoon and watched {b}’s face change while {a} was asking it.',
  ],
  blank: [
    '{a} asked {b} about {mission} and {b} could not put the afternoon in order, and heard {b}’s own answer not work.',
    '{b} got the sequence of {team}’s afternoon wrong on the road home and knew it before {a} said anything.',
    '“I don’t — it was all one thing,” {b} said about {mission}, and it sounded worse out loud than it had in {b}’s head.',
    '{b} had been on {team} all afternoon and could not tell {a} what had happened on it, which {a} filed away.',
  ],
  turned: [
    '{b} answered {a}’s question about {team} and then put one of {b}’s own in front of {a}, and it was a better question.',
    '“Fine — where were you?” {b} said, before {a} had finished, and the walk home stopped being {a}’s conversation.',
    '{a} tested {b} on {mission} and came away having been tested harder, which was not the plan.',
    '{b} let {a} run the whole thing about {team} and then turned it round on the last hill without raising {b}’s voice.',
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
    '{a} said the name out loud on the road back from {mission} — the first time anybody had, all day — and {b} let it stand there.',
    'Somewhere between the vans {a} told {b} what the missing one would have been like on {team}, and got most of the way through it.',
    '“They’d have hated today,” {a} said, and {b} laughed before {b} could stop, and then neither of them said anything for a while.',
    '{a} and {b} spent the last mile talking about somebody who was not on the road, by name, at length.',
  ],
  'did-not-mention-it': [
    '{a} and {b} walked back from {mission} talking about absolutely nothing, and both of them knew what they were not talking about.',
    'There were {living} of them on the road home and neither {a} nor {b} said a word about the ones who were not.',
    '{a} started to say the name on the walk back and put it away again, and {b} pretended not to have heard the start of it.',
    'The whole way home {a} and {b} kept the conversation on {mission}, deliberately, and it took work.',
  ],
  angry: [
    '“We did all that,” {a} said about {mission}, “and we’re still going home to lose somebody tonight.” {b} had no answer to it.',
    '{a} was furious on the road back and it was not about the afternoon, and {b} worked that out about a mile in.',
    '{a} said something bitter about the castle on the walk home from {mission} and {b} did not disagree fast enough to help.',
    'Whatever {a} was carrying off {team} today, it came out on the road and it came out at nobody in particular.',
  ],
  // THE SOLO SCENE. Same widening, same measured reason as event 1's `alone`:
  // the sampler draws one person about 40% of the time and this window had
  // almost nothing for them. The arc is `grief` and it is opened on one
  // party, which is what a private one is.
  //
  // EIGHT LINES, NOT FOUR, AND THE REASON IS ARITHMETIC RATHER THAN TASTE. A
  // solo branch is the ONLY branch its event has on a solo draw, so all of that
  // event's solo firings in a season — about three — come out of this one pool,
  // where a three-way collision runs at roughly 6%. A probe over 800 seasons
  // attributing every within-season triple repeat to the branch that printed
  // it put this pool at the top of the entire castle, ahead of every
  // pre-existing one. Eight lines takes the same collision to about 1.6%.
  'on-their-own': [
    '{a} walked the whole road back from {mission} thinking about the one who should have been on {team} and was not.',
    'There were {living} of them coming back up the path, and {a} counted, and wished {a} had not.',
    'Nobody on that road mentioned the empty seat, and {a} thought about very little else the whole way home.',
    '{a} had got through the entire afternoon without it landing. It landed on the walk back, alone, between the vans and the gate.',
    'Two of them would have been on {team} last week. {a} did that sum twice on the road home and got the same answer.',
    '{a} kept turning round on the path, out of habit, to check somebody was keeping up.',
    'It was a shorter column coming back from {mission} than it had been going out, and {a} was near the end of it.',
    'Somebody had told a joke on the way out that only one person would have laughed at, and {a} thought about that the whole way back.',
    'The vans go out full and come back with a spare seat in them, and {a} sat next to it.',
    '{a} had spent the whole of {mission} not thinking about it, which takes more work than thinking about it.',
    'Somebody on {team} kept saying \u201cwe\u201d and meaning a smaller number than they had last week, and {a} noticed every time.',
    'There is a point on that road where the castle comes into view, and {a} always used to be told about it.',
    '{a} carried the kit for two on {mission} without mentioning why it was heavier.',
    'Nobody had taken the missing one off the team sheet, and {a} had read the sheet four times.',
    '{a} walked at the back on purpose, because the back is where you can have a face.',
    'It had been a good afternoon, which {a} felt oddly guilty about the whole way home.',
  ],
  useful: [
    '{a} brought the missing one up on the road back and then, gently, brought up who had got quieter since.',
    '“Think about who’s been comfortable this week,” {a} said, on the walk home from {mission}, and {b} understood the shape of it.',
    '{a} used the empty seat on {team} to start a conversation that was not about the empty seat at all.',
    '{b} noticed that {a} only ever mentioned the dead when {a} wanted something from the living, and noticed it on this road.',
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
        { a, mission: m.name, team: team.name, living: (gs.activePlayers || []).length });
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
      living: (gs.activePlayers || []).length,
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
    '{a} went back over {mission} on the road home and could not find a minute of it anybody could ask about.',
    'By the gate {a} had the whole of {team}’s afternoon in order and knew which parts of it were safe to be certain about.',
    '{a} spent the walk home checking {mission} against what everybody else had seen, and it matched everywhere it had to.',
    'Nobody had watched {a} all afternoon, and {a} had spent all afternoon making sure of it.',
  ],
  thin: [
    'There was an hour of {mission} {a} could not account for cleanly, and {a} walked the whole road home turning it over.',
    '{a} had one gap in the afternoon and no good way to fill it, and the gate arrived before an answer did.',
    'The problem with {team}’s day, from where {a} was standing, was the part in the middle where nobody could say where {a} had been.',
    '{a} kept arriving at the same twenty minutes of {mission} and kept not liking them.',
  ],
  overtold: [
    '{a} told {who} about {mission} on the road back without being asked once, and heard it happening.',
    '{a} volunteered rather more of the afternoon than anybody had wanted, and then spent the last mile regretting the extra.',
    '“I was on {team} the whole time,” {a} said, twice, to somebody who had not asked either time.',
    '{a} put the whole day in front of people who were not looking for it, and they looked at each other instead.',
  ],
  unasked: [
    'Nobody asked {a} anything about {mission} on the way home, and {a} noticed how much that was worth.',
    '{a} came off {team} braced for a question and walked the entire road without getting one.',
    'The afternoon had been loud enough that nobody was thinking about {a} at all, and {a} let that happen.',
    '{a} had an account of {mission} ready the whole way home and never once had to use it.',
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
    '“{who} was gone the whole middle of it,” {a} said on the road back, “and {mission} finished a body light.” {b} did the same arithmetic out loud.',
    '{a} and {b} worked out on the walk home roughly what {who}’s hour had taken off the afternoon, and neither of them liked the answer.',
    '{a} put it plainly: {who} left {team} to go looking, and {team} did {mission} without {who}. {b} agreed that was the shape of it.',
    '“It’s not that {who} went,” {b} said. “It’s that we paid for it and {who} kept it.”',
  ],
  'defended-the-hour': [
    '“I’d have gone,” {b} said, when {a} started on {who}. “So would you. Don’t pretend.”',
    '{a} raised {who}’s hour away from {team} and {b} pointed out that anybody with a chance at that would have taken it.',
    '“{who} played the game,” {b} said on the road home. “You’re annoyed because {who} played it first.”',
    '{b} would not have {who} blamed for the detour on {mission}, and said so twice before the gate.',
  ],
  'saw-it-happen': [
    '{a} had watched {who} come back up with it and told {b} exactly what that had looked like.',
    '“I was standing there when they handed it over,” {a} said. {b} had not been, and listened all the way home.',
    '{a} described {who}’s return to {b} in detail, because {a} had been close enough to see the faces around it.',
    'Only a handful of people had actually seen {who} come back holding it on {mission}, and {a} was one of them, and {b} was not.',
  ],
  'let-it-alone': [
    '{a} brought {who}’s hour up on the road back and {b} declined the conversation, politely and completely.',
    '“Not worth it,” {b} said about {who}. “There’s a table tonight and it isn’t going to be about a missing hour.”',
    '{a} tried to make {who}’s detour matter on the walk home and could not get {b} to hold the other end of it.',
    '{b} had already decided {who}’s afternoon was not tonight’s problem, and nothing {a} said on that road moved it.',
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
    '“{who} went and did it,” {a} said on the road back, which was to {task}, and nobody had asked, and {b} agreed it had been the best thing about {mission}.',
    '{a} and {b} spent a mile being genuinely impressed that {who} had managed to {task}, which neither of them had expected of the day.',
    '{a} said the thing out loud that nobody had said at the vans: {who} was the reason {mission} paid what it did.',
    '“Somebody had to {task},” {b} said. “On today of all days.” {a} had been thinking exactly that since it happened.',
  ],
  'suspicious-of-eager': [
    '“Why {who}, though,” {a} said on the walk back. “Why is {who} the one volunteering to {task} in front of everybody?”',
    '{a} did not think {who} had gone for the extra on {mission} out of public spirit, and by the gate {b} was not sure either.',
    '{b} pointed out that {who} had made very certain the room was watching while {who} went to {task}.',
    '“Nobody works that hard for the pot,” {a} said about {who}. “They work that hard for the room.”',
  ],
  'used-it': [
    '{a} started on the extra job {who} had gone and done, and finished on why that made {who} the wrong name for tonight — which was where {a} had been going.',
    '“You can’t put up somebody who just went and did that in front of the room,” {b} said, and {a} filed the whole conversation under what it actually was.',
    '{a} was building {who} a case on the road home and did not pretend otherwise when {b} asked what {a} was doing.',
    'By the gate {a} had turned {who}’s extra on {mission} into an argument about the table, and {b} had let it happen.',
  ],
  unimpressed: [
    '“It’s a bonus,” {b} said about {who}. “Somebody was always going to {task}. It isn’t a personality.”',
    '{a} raised what {who} had pulled off and {b} said the day’s result was a team number and it always had been.',
    '{b} was not going to spend the road home admiring {who} for one extra job, and made that clear without being unkind about it.',
    '“Good for {who},” {b} said, in a voice that closed the subject before the next bend.',
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
    'It was not the first long day {a} and {b} had had together, and on the road back from {mission} that started to be worth something.',
    '{a} and {b} had been through {season} and now they had been through {mission}, and by the gate the second one had reopened the first.',
    '“We’re quite good at this,” {a} said to {b} on the walk home, meaning rather more than {mission}.',
    '{a} and {b} fell into an old rhythm on the road back that neither of them had used since {season}.',
  ],
  'old-account': [
    '{a} waited until {mission} was behind them and then brought up {season}, which had been coming all day.',
    '“Same as {season},” {a} said on the road home, and {b} knew precisely which part of {season} {a} meant.',
    'The afternoon put {a} and {b} back in each other’s company for the first time since {season}, and {a} used the hours.',
    '{b} got asked about {season} on the walk back from {mission}, and had had a whole afternoon to see it coming.',
  ],
  'not-that-person': [
    '“That was {season},” {b} said, walking home from {mission}. “I was twenty-four and I was wrong about most of it.”',
    '{b} refused to be the person {a} remembered from {season}, and pointed at the afternoon they had just had as the evidence.',
    '“You’ve had a whole day of me,” {b} said. “Judge that, not {season}.”',
    '{b} answered {a}’s version of {season} with {mission}, which was the only argument {b} had and was not a bad one.',
  ],
  'still-that-person': [
    '{a} had watched {b} all afternoon on {mission} and come away certain that {season} had told the truth about {b}.',
    '“You did exactly what you did in {season},” {a} said, at the gate, and did not soften it.',
    'By the end of the road {a} had matched something {b} did today to something {b} did in {season}, out loud, in front of {b}.',
    '{a} had gone out wanting to be wrong about {b} and came back through the gate holding {season} tighter than before.',
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
    '{a} walked the whole road home from {mission} without talking to anybody, and arrived having decided something.',
    'Everybody else was in twos on the way back. {a} was not, and did not appear to mind.',
    '{a} put {mission} away somewhere on the second hill and spent the rest of the road on tonight.',
    'The walk back took {a} about an hour and {a} used every minute of it, quietly, on the same question.',
    '{a} was the first one back through the gate, by some distance, and had not spoken since the vans.',
    'Two people tried to fall into step with {a} on the road home. Both of them gave up.',
    '{a} walked it at a pace that made conversation impossible, on purpose.',
    'The road home took an hour and {a} spent all of it about ten yards ahead.',
    '{a} had nothing to say about the afternoon and said none of it, at length.',
    'Somebody asked {a} a question at the halfway stone and got most of a word back.',
    '{a} looked at the castle getting bigger and did not slow down for any of it.',
    'It is a long way to walk without talking and {a} managed the whole of it.',
  ],
  'caught-up-with-it': [
    'It got {a} on the road home — not at {mission}, where there had been too much going on, but afterwards, in the quiet.',
    '{a} had been fine all afternoon. {a} was not fine somewhere between the vans and the gate, and there was nobody there for it.',
    'The afternoon had kept {a} busy. The road home did not, and that turned out to be the harder half.',
    '{a} got most of the way back from {mission} before the day caught up, and then had to stop for a moment.',
    '{a} spent the walk home going over one small thing from {mission} that nobody else had noticed and could not put it down.',
    'Somewhere on the last hill {a} stopped being all right about it, at some length, with nobody there to see.',
  ],
  'sorting-it': [
    '{a} spent the road home putting {mission} in order — who had been where, who had been loud about it, who had not.',
    'By the gate {a} had a list. {a} had started it at the vans and had not spoken to anybody since.',
    '{a} went back through the afternoon on the walk home the way people go back through a receipt.',
    'Somewhere on the road {a} worked out which part of {mission} was actually going to matter tonight.',
    '{a} walked home from {mission} rebuilding the afternoon from the start, twice, until the order stopped changing.',
    '{a} spent the road home reviewing how each player had behaved during {mission} and said nothing about it.',
  ],
  'nothing-doing': [
    '{a} walked home from {mission} thinking about nothing in particular, which was the most restful hour of the week.',
    'There were {living} of them left and {a} spent the entire road home thinking about a sandwich.',
    '{a} had had enough of {mission}, enough of the castle, and enough of everybody, and walked accordingly.',
    'The road back was long, {a} was tired, and for one hour {a} simply did not play.',
    '{a} looked at the hills the whole way home and thought about the game for approximately none of it.',
    'Whatever {mission} had been, {a} left it at the vans and walked the rest of it as a person with nothing to work out.',
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
      a, mission: m.name, living: (gs.activePlayers || []).length,
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
    '{a} asked what {tb} had actually been doing while {ta} was on the far side of {mission}, and {b} told {a}, start to finish.',
    '{b} walked {a} through {tb}’s whole afternoon on the road home, in order, without being asked twice.',
    '“You were nowhere near us,” {b} said. “Right. So — here’s what happened.” And {b} told it.',
    '{a} came off {ta} knowing nothing about the other half of {mission} and came home knowing most of it.',
  ],
  'thin-answer': [
    '{a} asked about {tb}’s half of {mission} and got about four sentences, none of which put {b} anywhere in particular.',
    '“We were all over the place,” {b} said about {tb}, which was true and was also all {a} got.',
    '{b}’s account of the afternoon had {tb} in it and did not have {b} in it, and {a} noticed the shape of the gap.',
    '{a} asked where {b} had been on {mission} and {b} answered about {tb} instead, twice.',
  ],
  'asked-back': [
    '{b} answered about {tb} and then wanted the same about {ta}, in the same detail, which {a} had not been expecting to give.',
    '“Your turn,” {b} said, before {a} had finished processing the first half. “Where were you when it went wrong?”',
    '{a} and {b} ended up trading whole afternoons on the road home because {b} would not do it one way.',
    '{b} was perfectly happy to describe {tb}, on condition that {a} described {ta}, and meant the condition.',
  ],
  'refused-it': [
    '“Why does it matter where I was?” {b} said about {mission}, and {a} did not have a good answer that was also honest.',
    '{b} declined to account for {tb}’s afternoon to somebody who had spent it on {ta}, and did not soften the declining.',
    '{a} asked one straightforward question about the other half of {mission} and got a wall for it.',
    '“Ask somebody who was on {tb},” {b} said. “Oh — wait.” And {b} walked on ahead.',
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
    'By the time the gate came into view {a} and {b} had a name, and both of them had got there off the same part of {mission}.',
    '{a} said a name on the road back and {b} had been about to say it, which is the sort of thing that builds something.',
    '“Same person?” {a} said, near the gate. “Same person,” {b} said, and neither of them had to explain further.',
    '{a} and {b} spent the last mile of {mission} settling on one name and the rest of it agreeing about why.',
  ],
  'agreed-for-different-reasons': [
    '{a} and {b} arrived at the same name on the road home for two entirely different reasons and did not notice the difference.',
    'They agreed on who, {a} and {b}. What {a} was arguing from and what {b} was arguing from had almost nothing in common.',
    '{a} named somebody off what happened on {mission}. {b} named the same person off something from three days ago. It held, for now.',
    'By the gate {a} and {b} had a name between them and a disagreement underneath it that neither had gone looking for.',
  ],
  split: [
    '{a} and {b} could not get to one name on the road home and were still not there when the castle came into view.',
    '“Then we cancel each other out,” {b} said, at the gate, and that was where the walk ended.',
    '{a} wanted one name, {b} wanted another, and the last mile was spent finding out how firmly.',
    'Two names went into the road back from {mission} and two names came out the other end of it.',
  ],
  'kept-it-back': [
    '{a} asked {b} who {b} was writing and {b} gave an answer that was not a name.',
    '“I’ll know when I’m sitting down,” {b} said, on the walk home, which {a} had heard {b} say before.',
    '{a} put a name in front of {b} on the road back and got nothing at all to put beside it.',
    '{b} let {a} talk about tonight the whole way home from {mission} and never once said who {b} had in mind.',
  ],
  // Eight lines, for the reason given over `on-their-own` in event 6: this is
  // the only branch this event has on a solo draw, so it carries every one of
  // that event's solo firings on its own.
  alone: [
    '{a} walked back from {mission} arriving, slowly and entirely alone, at a name.',
    'Somewhere between the vans and the gate {a} stopped weighing it and simply decided.',
    '{a} had two names going into the road home from {mission} and one coming out, and had not discussed it with anybody.',
    'By the time {a} came through the gate the decision had been made on the road, in {a}’s own head, off {a}’s own afternoon.',
    'Nobody walked with {a} on the way back, which suited {a}, because {a} had a decision to make and did not want help with it.',
    '{a} ran the whole table in {a}’s head on that road, seat by seat, and stopped at one of them.',
    'It was not a hard walk and it was not a hard decision, and {a} was slightly troubled by how easy both had been.',
    '{a} changed {a}’s mind twice between the vans and the gate and then changed it back.',
    '{a} put three names on the road home and took two of them off again before the drive.',
    'The walk back from {mission} is exactly long enough to talk yourself into something, and {a} did.',
    '{a} did not want anybody’s opinion tonight, and made sure of it by walking faster than everybody.',
    'By the gate {a} had a name and a reason, and the reason was the part {a} kept testing.',
    '{a} decided on the road that the safest name and the right name were not the same, and picked one.',
    'Nobody asked {a} who {a} was writing, which was the only useful thing about that walk.',
    '{a} had been going to wait until the evening to decide and found that {a} had already decided.',
    'It came to {a} somewhere in the last quarter mile, plainly, the way these things do when nobody is talking.',
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
    '{a} and {b} finished it at the gate, properly, with the towers already over them, and walked in with nothing owed.',
    'Whatever had been running between {a} and {b} since before {mission} got its ending in the last hundred yards.',
    '{a} said the last of it on the path up and {b} accepted it, and that was genuinely that.',
    'It had taken all day and the whole road, but {a} and {b} came through the gate square with each other.',
  ],
  'ended-badly': [
    '{a} and {b} finished it at the gate, and finishing it was worse for both of them than leaving it open had been.',
    'The last hundred yards took whatever {a} and {b} had left and spent it, and neither of them was pretending otherwise inside.',
    '“Fine,” {b} said, at the door. “Then we know where we are.” They did. It was not a good place.',
    '{a} pushed it one sentence too far on the path up from {mission}, and it broke where it stood.',
  ],
  'carried-inside': [
    'The castle arrived before {a} and {b} were done, and both of them knew exactly what that meant for tonight.',
    '{a} and {b} ran out of road before they ran out of it, and carried the rest of it in through the gate.',
    '“Later,” {a} said, at the door, and {b} heard the word for what it was.',
    'Coming back from {mission} put {a} and {b} back inside the walls with the thing still open between them.',
  ],
  'quietly-dropped': [
    'Neither {a} nor {b} picked it up again on the path from {mission}, and by the door it had stopped being a thing.',
    '{a} let it go somewhere on the last mile and did not tell {b} that {a} had, which was the kindest version.',
    'It simply stopped mattering to {a} and {b} between the vans and the gate, the way these things do.',
    '{a} and {b} walked the last stretch talking about the food, and the other thing was never mentioned again.',
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
    '{a} and {b} had not said fifty words to each other before this afternoon and worked like they had.',
    'Nobody put {a} and {b} together. The draw did, and it turned out to be a good draw.',
    'They spent four hours finding out they think the same way about a problem.',
    '{a} has been in this castle a week and only met {b} properly today.',
    'It is a strange way to meet somebody, and it worked.',
    'By the end of it {a} and {b} were finishing each other’s jobs without being asked.',
    'Before today {a} and {b} had no reason to talk to each other, and now they do.',
    '{a} came off that field having decided {b} is worth knowing.',
  ],
  'polite-and-nothing': [
    '{a} and {b} were perfectly civil for four hours and came home strangers.',
    'They did the work. They did not do anything else.',
    'Not every pairing takes. That one did not, and neither of them minded.',
    '{a} could not tell you one thing about {b} that {a} did not know this morning.',
    'It was an afternoon of two people being professionally pleasant.',
    'Nothing went wrong between them and nothing happened either.',
    'They will go back to not speaking tomorrow and it will not be awkward.',
    'Four hours, no friction, no ground gained.',
  ],
  'got-in-the-way': [
    '{a} and {b} could not get out of each other’s way all afternoon.',
    'Two people with the same idea and no way to agree whose it was.',
    'It was not a row. It was four hours of very slightly the wrong rhythm.',
    'They each thought the other was slowing it down and both were a bit right.',
    '{a} has decided {b} is hard work, on the evidence of one afternoon.',
    'Nobody said anything. Everybody could see it.',
    'By the third hour they had stopped consulting each other entirely.',
    '{a} will bring it up at a round table eventually, and {b} will not have forgotten either.',
  ],
  'one-of-them-carried-it': [
    '{a} did most of it and {b} knows {a} did most of it.',
    'There is a debt on that field now and both of them can feel the shape of it.',
    '{b} was out of {b}’s depth and {a} took it on without making a thing of it.',
    '{a} said nothing about it on the road home, which {b} noticed more than a complaint.',
    'Being carried is a hard thing to be grateful for and {b} is managing it.',
    'It cost {a} an afternoon and bought something that is not a favour yet.',
    '{b} will remember this the next time {a}’s name comes up, one way or the other.',
    'They came home even in the record and not even at all.',
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
      topic: b, topicKind: 'road-partner', threadId: t?.id, bondDelta,
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
    '{a} watched {who} {task} as if it were nothing, and said so, out loud, to {b}.',
    '{who} had to {task}, made it look straightforward, and {a} has not stopped mentioning it.',
    '{a} spent the whole road home telling {b} how {who} handled the {task}.',
    '{a} told {b} that {who} was the best thing about the whole day.',
    'It was not close. Somebody had to {task}, {who} did, and everybody else watched.',
    '{a} would not have got near it and is honest with {b} about that.',
    '{a} has seen plenty of people try hard out there and very few do it that well.',
    '{a} has decided {who} is somebody to keep, on the evidence of one afternoon.',
  ],
  'noted-it-quietly': [
    '{a} said nothing at the time about what it took to {task}, and has thought about it since.',
    '{a} filed the way {who} managed to {task}, and did not tell {b} what {a} was filing.',
    '{a} now knows exactly what {who} can do, and has not told anybody yet.',
    '{a} watched {who} closely enough to be able to describe it later, which is a decision.',
    '{a} mentioned to {b} that somebody had to {task}, in a way that sounded like small talk.',
    '{a} wondered aloud to {b} what else {who} can do that {who} has not shown yet.',
    '{a} is building a list of what people are capable of and {who} went on it today.',
    'The observation is worth more unshared and {a} has kept most of it.',
  ],
  'found-it-suspicious': [
    '{who} was far too good at it for {a}’s liking, and {a} said so to {b}.',
    '{a} wanted to know where {who} learned to do that.',
    'There is no reason being competent should look bad. It looked bad to {a}.',
    '{a} put it to {b} that nobody is that calm doing that job for the first time.',
    'The case against {who} is thin and {a} knows it, but {a} cannot stop making it.',
    '{a} has turned an afternoon’s good work into a question about {who}.',
    'Everybody saw how good {who} was out there, and {a} thinks that should worry people.',
    '{b} thinks {a} is reaching. {a} may be reaching.',
  ],
  'wished-it-had-been-them': [
    '{a} could have been the one to {task} and was not asked, and has been quiet since.',
    'It is a small thing to mind and {a} minds it.',
    '{a} congratulated {who} and meant about two thirds of it.',
    'Being useful is how you stay here, and {a} was not useful this afternoon.',
    '{a} told {b} the truth of it: {a} wanted that job.',
    'Nobody chose {a} for it and nobody was thinking about {a} at all, which is worse.',
    '{a} has spent the road home working out how to be indispensable by Thursday.',
    'The afternoon was a good one and {a} came out of it feeling replaceable.',
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
      topic: win.player, topicKind: 'road-praise', threadId: t?.id || existing?.id || null,
      bondDelta, ...(crowd ? { crowd } : {}) };
  },
});

// ── mission-laughed-about-it ────────────────────────────────────────────
// A bad afternoon is the best bonding material this format has, and the file
// had no event that could say so. Gated on the tier actually being poor.
const LAUGHED_LINES = {
  'laughed-about-it': [
    'It was a disaster and by the second mile {a} and {b} could not stop laughing about it.',
    'Somebody has to find it funny first, and {a} did, and then {b} was gone too.',
    'They have a joke now that nobody else in the castle has, which is worth more than the money was.',
    'The afternoon was worthless and the walk home was the best hour of {a}’s week.',
    '{a} did an impression of the whole thing and {b} had to stop walking.',
    'Failing at something together is a fast way to stop being strangers.',
    'Nothing about the day worked and both of them came home lighter.',
    'It will be a running joke by Thursday and neither of them will remember starting it.',
  ],
  'too-soon': [
    '{a} tried to make it funny and {b} was not ready for it to be funny.',
    'It cost real money and {a} joked about it about ninety minutes too early.',
    '{b} had wanted that afternoon to go well more than {a} realised.',
    '{a} laughed and nobody laughed back, and the road went very quiet.',
    '{a} apologised, which made it slightly worse.',
    'There is a right hour for that joke and it was not on that road.',
    '{b} said "it is not funny" and meant it, and {a} believed {b}.',
    'It is a small misjudgement and {a} will be careful with {b} for a day or two.',
  ],
  'blamed-the-set-up': [
    '{a} and {b} agreed, at length, that the afternoon had been unwinnable.',
    'It is easier to be angry at the day than at each other, and they took the easier thing.',
    'By the gate they had built a complete case against the whole design of it.',
    'Neither of them said a word about anybody on their own team, which took effort.',
    'They could have won it, but blaming the setup is easier than blaming each other.',
    'A shared grievance about nobody in particular is the safest bond two people can have here.',
    '{a} started it and {b} improved it and by the drive it was a full theory.',
    'It is the most agreeable conversation either of them has had all week.',
  ],
  'went-quiet-about-it': [
    'Neither {a} nor {b} said anything about the afternoon for the whole road home.',
    'It had cost too much to be discussed and they both knew it.',
    'They walked five miles beside each other and talked about the hedge.',
    'There was nothing to say about it and neither of them tried.',
    '{a} tried once. {b} did not pick it up. That was the end of it.',
    'The silence was not hostile and it was not comfortable either.',
    'They will each say something about it to somebody else tonight, and not to each other.',
    'By the gate the afternoon had become a thing neither of them was going to mention.',
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
      topic: b, topicKind: 'road-partner', threadId: t?.id || existing?.id || null, bondDelta };
  },
});

// ── mission-the-good-day ────────────────────────────────────────────────
// The other end of the same rule: a triumph is a public fact, and what two
// people do with a good day is not automatically warm. A visible alliance is
// a target, and a season this format runs on knows it.
const GOOD_DAY_LINES = {
  'enjoyed-it': [
    'For one afternoon {a} and {b} were just two people who had done a job well.',
    'Nobody mentioned the game on that road and both of them noticed afterwards.',
    'It went well, and going well is rare enough here to be worth an hour of not being careful.',
    '{a} and {b} came home genuinely pleased and did not bother hiding it.',
    'They had a good day, and neither of them can remember the last one.',
    'The money was up and the sun was out and neither of them was thinking about Thursday.',
    '{a} said it was the first time all week {a} had forgotten where {a} was.',
    'It will not last past dinner and both of them are aware of that.',
  ],
  'too-visible': [
    '{a} and {b} were the story of that afternoon and the story travels.',
    'Being the two who won it is being the two everybody looked at.',
    '{a} worked out on the road home that a good day has a cost attached.',
    'People here like winners right up until they start counting how often those two win.',
    'They did it together, publicly, and the room has now paired them in its head.',
    '{b} would rather have had a quiet afternoon and says so.',
    '{a} and {b} were that useful and that visible together, and the road noticed both.',
    'It is a good problem and it is a problem.',
  ],
  'took-the-credit': [
    '{a} spent the road home making sure the right version of the afternoon travelled.',
    'It was a team result and {a} has been describing it in the first person.',
    '{b} noticed which parts {a} was leaving out.',
    '{a} is not lying about any of it and is not telling it straight either.',
    'Credit is the only currency out there and {a} is collecting it.',
    'By the gate three people had heard {a}’s account and none had heard {b}’s.',
    '{b} let it go, which is not the same as not minding.',
    'It is a small thing that will be a large thing in about a week.',
  ],
  'shared-it-out': [
    '{a} made sure the people who did the work were the people who got named for it.',
    '{a} could have taken it and handed it round instead.',
    'It costs nothing to do that and almost nobody here does it.',
    '{b} noticed, and {b} will not be the only one.',
    '{a} named four people and was not one of them, which the road heard.',
    'Generosity with credit is the cheapest alliance there is and {a} is good at it.',
    'Whether {a} meant it or was playing a long game, the effect was the same.',
    '{a} came home with less credit and more people.',
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
      topic: b, topicKind: 'road-partner', threadId: t?.id || existing?.id || null,
      bondDelta, ...(crowd ? { crowd } : {}) };
  },
});
