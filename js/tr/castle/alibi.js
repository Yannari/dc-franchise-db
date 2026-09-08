// ══════════════════════════════════════════════════════════════════════
// tr/castle/alibi.js — the one castle scene that is about something
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS, IN ONE MEASUREMENT. 96.7% of every reason the Round
// Table cites is the voting record. The castle runs ~67 suspicion scenes a
// season and contributes none of it, and when that channel was priced
// (tests/tr-castle-channel-pricing.test.js) it came back an ANTI-SIGNAL: edge
// -0.24, worse than its own contentless twin.
//
// The cause was structural. `susp-timeline-crosscheck` picks who it is about
// with `pick(rng, others)` — a uniformly random third party — and then decides
// whether their account held out of stats and bonds. Nothing in that chain
// touches who was actually out of bed, so the scene finds a hole because the
// dice said so. It cannot be evidence, however the branch is worded.
//
// THIS SCENE IS THE SAME SCENE WITH ONE THING CHANGED: the outcome reads the
// night. `murderBallots` records who was awake choosing a name, which is
// exactly the hour a morning reconstruction asks about. Somebody who was at
// the conclave has an hour they cannot honestly account for, and this is the
// scene where two people notice.
//
// ── AND IT STILL WRITES NO BELIEFS ────────────────────────────────────
//
// tests/tr-castle-belief-gate.test.js forbids any js/tr/castle/ frame from
// reaching `learn`, and that rule is NOT relaxed here. The scene records a
// FINDING — an observation, on the round — and `alibiEvidence()` in
// js/tr/deduction.js turns findings into beliefs, in the file that owns belief
// writes and alongside the other three evidence passes.
//
// That split is not a workaround, it is the correct shape: a castle event
// observes, the deduction layer infers. The guard stays literally true and the
// new channel sits where every other priced channel already lives.
//
// ── WHAT THE SCENE MAY KNOW ───────────────────────────────────────────
//
// Reading the conclave roll is reading a Traitor-only fact, and it is
// legitimate here for a diegetic reason rather than a mechanical one: the
// people at the conclave were PHYSICALLY OUT OF THEIR BEDS in a building full
// of sleeping players. Somebody noticing an empty room is the most ordinary
// observation in the format. What the scene must never do is hand that fact
// over whole — so the finding is probabilistic, it is wrong a meaningful share
// of the time, and nothing about it is certain.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { lineFor } from './lines.js';

const FAMILY = 'suspicion';
const TOPIC = 'suspicion-third';

/**
 * How often a checker actually notices, and how often they are simply wrong.
 *
 * PRICED, NOT PICKED. The synthetic in tests/tr-castle-channel-pricing.test.js
 * clears the gate at 30% catch and 12% false — deliberately unflattering rates
 * — with edge +0.198 over 478 emissions and both disjoint blocks clearing. The
 * skill terms below move the real rates around those anchors rather than
 * beyond them, so the channel cannot drift into a Traitor detector.
 *
 * THE FALSE POSITIVE IS LOAD-BEARING AND MUST NOT BE TUNED AWAY. Without it
 * "could not account for the hour" becomes a certain accusation of a Traitor,
 * every listener learns to treat it as one, and the format collapses into a
 * detector. Innocent people failing to account for their evening is the whole
 * reason the accusation is worth arguing about.
 */
const CATCH_BASE = 0.30;
const FALSE_BASE = 0.12;

/** Who was awake choosing a name, on the night this morning follows. */
function outLastNight(ep) {
  const round = (gs.tr?.rounds || []).find(r => r.ep === ep - 1);
  if (!round) return null;
  const ballots = round.murderBallots || [];
  if (!ballots.length) return null;
  return new Set(ballots.map(b => b.voter).filter(Boolean));
}

/**
 * File the observation for `alibiEvidence()` to read this same episode.
 *
 * NOT A BELIEF, and nothing in this file may write one — see the header and
 * tests/tr-castle-belief-gate.test.js. `watchers` are the only people who were
 * in this conversation, and the deduction layer gives the read to them and to
 * nobody else.
 */
function recordFinding(ep, subject, watchers, source) {
  if (!gs.tr) gs.tr = {};
  if (!Array.isArray(gs.tr._alibiFindings)) gs.tr._alibiFindings = [];
  gs.tr._alibiFindings.push({ ep, subject, checkers: [...watchers], source });
}

/**
 * Did this pair notice, and are they wrong about it?
 *
 * ONE FUNCTION FOR EVERY SCENE THAT READS THE NIGHT, so the three of them
 * cannot drift apart into three different detection rates that were each
 * priced once and never again. `skill` is whatever the scene thinks makes
 * somebody observant; the anchors and the ceiling on them live here.
 */
function noticed(ep, subject, skill, roll) {
  const out = outLastNight(ep);
  const wasOut = !!out && out.has(subject);
  const p = wasOut
    ? CATCH_BASE * (0.6 + 0.8 * skill)
    : FALSE_BASE * (1.4 - 0.8 * skill);
  return roll < p;
}

const ACCOUNT_LINES = {
  'could-not-place-them': [
    '{a} and {b} put last night back together between them, and there is an hour of it with {c} nowhere in it.',
    'Everybody else can be placed somewhere. {c} cannot, for a stretch in the middle of the night.',
    '{a} remembers the corridor being quiet. {b} remembers it not being quiet. Neither can find {c} in either version.',
    '{a} asked {c} about it directly and got an answer that took slightly too long to arrive.',
    'Two people went looking for {c} in last night and came back without {c}.',
    'It is one hour. {a} cannot stop turning it over.',
    '{b} would like there to be an explanation and cannot construct one.',
    'They have not accused {c} of anything. They have simply failed, twice, to account for {c}.',
  ],
  'accounted-for': [
    '{a} and {b} walked through the whole night and {c} is in all of it.',
    'Somebody saw {c} at every point that mattered, which is more than most of them could say.',
    '{c} is clear, and {a} says so out loud, which costs {a} something.',
    'They went looking for a gap around {c} and there is no gap.',
    '{b} had half expected to find something. {b} did not.',
    'The reconstruction puts {c} exactly where {c} said, and {a} lets it go.',
    'Two people spent a morning quietly checking {c} and came out the other side with nothing.',
    'It is not proof of anything. It is one name they can stop turning over.',
  ],
  'two-accounts': [
    '{a} and {b} cannot agree on their own night, let alone {c}.',
    'The reconstruction fell apart on the question of when the lamps went out.',
    'Halfway through {a} realised {a} could not place {a}’s own hour either.',
    'Two people, two versions of the same corridor, and no way to choose.',
    'They gave up on {c} and spent the rest of it arguing about each other.',
    'Nobody in this castle wears a watch, and it shows.',
    'It proves nothing about {c} and it has put something between {a} and {b}.',
    'The night is not reconstructable and both of them know it.',
  ],
  'nobody-saw-anything': [
    'Everybody slept. That is the entire finding.',
    '{a} and {b} established that no one was awake to see anything at all.',
    'A castle full of people and not one witness to any of it.',
    'The night is a blank, and a blank protects whoever needed protecting.',
    '{a} points out that the absence of witnesses is itself worth noticing. {b} does not disagree.',
    'They cannot place {c} and they cannot place anybody, which is not the same as a finding.',
    'It was dark, everybody was asleep, and that is all anybody has.',
    '{b} says the useful thing: somebody was awake. They just have no idea who.',
  ],
};

registerEvent({
  id: 'susp-account-of-the-night',
  family: FAMILY,
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'mental', 'temperament'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    // There has to have BEEN a night. Episode one has no conclave behind it,
    // and a morning that reconstructs nothing is not this scene.
    if (!outLastNight(ctx.ep)) return 0;
    const [a, b] = ctx.actors;
    // Two people who are getting on will do this together; two who are not
    // will not sit down to it at all.
    //
    // WEIGHTED HIGH ON PURPOSE, and the reason is volume rather than
    // importance. At weight 2 this produced 0.17 findings a season — one
    // season in six — which is invisible as drama and, at 120 emissions over
    // 800 seasons, below the count `gateChannel` needs to price anything.
    // The alternative was raising the catch rate, and that is the one dial
    // that must not move: it would turn "could not account for the hour" into
    // a Traitor detector. So the scene happens more often and finds a gap just
    // as rarely when it does.
    // 6 -> 3, AND THE REASON IS THE POOL RATHER THAN THIS SCENE.
    //
    // 6 was chosen when this was the only event reading the night and it had
    // to reach measurable volume alone. There are three of them now, and at
    // weight 5-6 apiece in windows whose typical weight is 1-3 they crowded
    // the castle: `romance-comfort-after-loss-sparks:too-soon` fell to 36
    // firings against the variety floor's 40, not because anything about it
    // changed but because these three were taking its draws.
    //
    // Three scenes at 3 reach the same volume together that one at 6 reached
    // alone, without displacing the rest of the castle to get it. The catch
    // rate is untouched, as it must be.
    return getBond(a, b) >= -2 ? 3 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-account-of-the-night');
    const [a, b] = ctx.actors;
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    if (!others.length) return null;
    const c = others[Math.floor(rng() * others.length)];
    const out = outLastNight(ctx.ep);
    const sa = pStats(a), sb = pStats(b);

    // THE SUBJECT IS STILL CHOSEN NARRATIVELY. Only the OUTCOME reads the
    // night — which is the whole difference between this scene and the one it
    // is modelled on. A scene that picked its subject off the conclave roll
    // would be a detector wearing a scene's clothes.
    const skill = ((sa.intuition ?? 5) / 10) * 0.6 + ((sb.mental ?? 5) / 10) * 0.4;
    const wasOut = !!out && out.has(c);
    // Skill moves the rate around the priced anchors and never past them: the
    // sharpest possible pair catch ~0.42, the dimmest ~0.18, and the false
    // positive moves the other way for the same pair.
    const pGap = wasOut
      ? CATCH_BASE * (0.6 + 0.8 * skill)
      : FALSE_BASE * (1.4 - 0.8 * skill);

    // Two rolls, always both taken, so the stream does not depend on whether
    // anybody was out — a night with a blocked murder consumes exactly what a
    // night without one does.
    const gapRoll = rng();
    const shapeRoll = rng();
    let branch;
    if (gapRoll < pGap) branch = 'could-not-place-them';
    else if (shapeRoll < 0.18) branch = 'two-accounts';
    else if (shapeRoll < 0.30) branch = 'nobody-saw-anything';
    else branch = 'accounted-for';

    const sceneWhy = branch === 'could-not-place-them'
      ? `could not account for an hour of ${c}'s night`
      : branch === 'accounted-for' ? `put ${c} in every part of the night`
        : branch === 'two-accounts' ? 'could not reconstruct the night at all'
          : 'established that nobody had been awake to see anything';
    const note = lineFor(ACCOUNT_LINES[branch],
      `susp-account-of-the-night|${branch}|${ctx.ep}`, { a, b, c });

    const bondDelta = branch === 'accounted-for' ? 1
      : branch === 'two-accounts' ? -1.5 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });

    // ── THE FINDING, WHICH IS NOT A BELIEF ─────────────────────────────
    //
    // Recorded on the round for `alibiEvidence()` (js/tr/deduction.js) to read
    // this same episode. NOTHING here calls `learn`, directly or through a
    // helper — see the file header and tests/tr-castle-belief-gate.test.js.
    // The two checkers are carried because they are the only people who were
    // in this conversation: the finding is theirs, and the deduction layer
    // gives it to them and to nobody else.
    if (branch === 'could-not-place-them') {
      recordFinding(ctx.ep, c, [a, b], `could not account for an hour of ${c}'s night`);
    }

    // THE BEAT, AND WITHOUT IT THE SCENE IS SILENT. The composer prints a
    // castle scene from the thread beat, not from the return value: the first
    // draft of this file computed `note` and returned it, and the prose gates
    // reported all four branches saying it "0 way(s)" in 6,966 firings. Every
    // sibling in suspicion.js opens an arc seeded with its note, and that is
    // how the sentence reaches the screen.
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      about: c, topic: c, topicKind: TOPIC, threadId: t?.id, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// TWO MORE WAYS TO NOTICE THE SAME HOUR
// ══════════════════════════════════════════════════════════════════════
//
// THE VOLUME PROBLEM, AND WHY THE ANSWER IS MORE SCENES RATHER THAN A BIGGER
// DIAL. `susp-account-of-the-night` clears the gate (edge +0.691) and reaches
// the table 9 times in 8,792 citations, because one event can only fire so
// often. The two levers were the catch rate and the number of scenes, and the
// catch rate is the one that must not move: raise it and "could not account
// for the hour" stops being an argument and becomes a verdict.
//
// So these two read the SAME fact through the SAME `noticed()` — the conclave
// roll, at the same anchors — and differ only in who does the noticing and
// what it looks like. Three scenes reading one fact is three chances a week
// for the castle to have something to say, at exactly the detection rate that
// was priced.
//
// AND THEY ARE DELIBERATELY NOT ABOUT DETECTIVES. One is a person who sleeps
// badly and the other is a room-mate; neither is investigating anybody. The
// format's best evidence is noticed by accident, and a castle where three
// separate scenes are all formal investigations reads like a procedural.

const DOOR_LINES = {
  'heard-it-go': [
    '{a} does not sleep well and heard a door. {a} is fairly sure it was {c}’s.',
    'Somewhere after two, a door. {a} lay there working out whose it was.',
    '{a} has been awake half the night for a week and has started keeping a list.',
    'It is not evidence and {a} cannot stop thinking about it: {c}’s door, and then nothing.',
    '{a} heard somebody moving and counted the steps to the landing before they stopped.',
    'The castle is old and every door in it announces itself. {a} thinks that one was {c}’s.',
    '{a} would not swear to it. {a} would not take it back either.',
    'A door, in the middle of the night, and {a} has been carrying it since.',
  ],
  'passed-it-on': [
    '{a} mentions it to {b} at breakfast, carefully, the way you mention a thing you are not sure of.',
    '{a} tells {b} about the door and watches {b}’s face while saying whose it was.',
    'It gets said out loud for the first time, quietly, over tea.',
    '{a} needed somebody else to be holding it too, and picked {b}.',
    '{b} does not dismiss it, which is what {a} was hoping for and also afraid of.',
    '{a} says it and immediately wishes {a} had waited a day.',
    'Two people now know about the door, which is one more than knew an hour ago.',
    '{b} asks {a} twice whether {a} is certain. {a} is not certain.',
  ],
  'talked-themselves-out': [
    '{a} decided it was the wind, and mostly believes that.',
    'By morning it had become nothing much, which is what the middle of the night usually becomes.',
    '{a} has heard doors all week and it has never meant anything before.',
    'The version {a} tells at breakfast is smaller than the version {a} lay awake with.',
    '{a} is not going to accuse somebody of a noise.',
    'It goes into the pile of things {a} noticed and did not act on.',
    '{a} half suspects {a} dreamed it.',
    'Nothing comes of it, and {a} is not sure whether that is a relief.',
  ],
  'slept-through': [
    '{a} slept straight through and has no idea whether anything happened at all.',
    'Whatever the castle did between two and four, {a} was not present for it.',
    '{a} is faintly annoyed at having missed it, which is its own kind of tell.',
    'Nothing. {a} woke at seven with nothing to report and slightly resents it.',
    'The one night {a} would have liked to be awake, {a} was not.',
    '{a} asks around at breakfast and gets nothing worth having.',
    'Everybody slept, apparently. Somebody did not, but nobody can say who.',
    '{a} has no door, no footsteps and no theory.',
  ],
};

registerEvent({
  id: 'susp-heard-a-door',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'temperament', 'mental'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    if (!outLastNight(ctx.ep)) return 0;
    return 3;   // see the note on weight in `susp-account-of-the-night`
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-heard-a-door');
    const [a, b] = ctx.actors;
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    if (!others.length) return null;
    const c = others[Math.floor(rng() * others.length)];
    const sa = pStats(a);
    // A light sleeper with a suspicious turn of mind. Same anchors as every
    // other scene that reads the night — see `noticed`.
    const skill = ((sa.intuition ?? 5) / 10) * 0.7 + (1 - (sa.temperament ?? 5) / 10) * 0.3;
    const gapRoll = rng();
    const shapeRoll = rng();
    const heard = noticed(ctx.ep, c, skill, gapRoll);
    let branch;
    if (heard) branch = shapeRoll < 0.55 ? 'passed-it-on' : 'heard-it-go';
    else branch = shapeRoll < 0.45 ? 'talked-themselves-out' : 'slept-through';

    const sceneWhy = branch === 'passed-it-on' ? 'told somebody about a door in the night'
      : branch === 'heard-it-go' ? 'lay awake deciding whose door it had been'
        : branch === 'talked-themselves-out' ? 'decided a noise in the night was nothing'
          : 'slept through whatever happened';
    const note = lineFor(DOOR_LINES[branch],
      `susp-heard-a-door|${branch}|${ctx.ep}`, { a, b, c });
    const bondDelta = branch === 'passed-it-on' ? 1 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });

    // ONLY THE BRANCH WHERE IT LEAVES {a}'s HEAD. A thing one person heard and
    // told nobody is not a read the room can act on, so `heard-it-go` moves no
    // belief and is the poorer scene for the same reason it is the truer one.
    if (branch === 'passed-it-on') {
      recordFinding(ctx.ep, c, [a, b], `heard ${c}'s door in the middle of the night`);
    }
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      about: c, topic: c, topicKind: TOPIC, threadId: t?.id, bondDelta };
  },
});

const BED_LINES = {
  'the-bed-was-empty': [
    '{a} woke at some point and the other bed was empty. {a} has not mentioned it to {c}.',
    '{a} got up in the night and came back to a room with one person in it instead of two.',
    'It could be a dozen things. {a} has been through most of them and keeps arriving back.',
    '{a} said nothing about it at breakfast and has thought about nothing else since.',
    'The bed was made too well for somebody who had been in it.',
    '{a} lay there afterwards pretending to be asleep, which {a} is not proud of.',
    'Sharing a room with somebody means knowing when they are not in it.',
    '{a} would like a reason to stop noticing this. {a} has not been given one.',
  ],
  'said-it-out-loud': [
    '{a} tells {b} about the empty bed, and having said it cannot unsay it.',
    'It comes out badly and too fast, the way a thing you have been sitting on does.',
    '{a} needed one other person to know, and {b} is now that person.',
    '{b} asks the obvious question and {a} does not have an answer to it.',
    'They agree not to say anything yet. Both of them know that will not last.',
    '{a} says it and then spends ten minutes qualifying it.',
    'The empty bed is now two people’s problem.',
    '{b} believes {a}, which is the part {a} had not prepared for.',
  ],
  'they-had-a-reason': [
    '{c} says it was the bathroom, and it probably was the bathroom.',
    '{a} asked, got an ordinary answer, and felt slightly ridiculous.',
    'There is an explanation and it is boring, which is what an explanation should be.',
    '{a} apologised for asking, which {c} waved off.',
    'It is nothing. {a} has decided it is nothing and is mostly convinced.',
    '{c} was up. People are up. That is the whole of it.',
    '{a} will not raise it again, and would not be able to say why not.',
    'The answer arrived quickly and easily, and {a} took it.',
  ],
  'never-woke': [
    '{a} slept through and can vouch for nothing at all.',
    'A room with two people in it and neither can say what the other did.',
    '{a} is a heavy sleeper, which in this castle is a small tragedy.',
    'Nothing. {a} woke up, {c} was there, and that is all {a} has.',
    'Whatever happened, it happened around {a} without disturbing {a}.',
    '{a} would love to be able to say something useful and cannot.',
    'The night passed and took its evidence with it.',
    '{a} envies the people who wake at every sound and does not become one.',
  ],
};

registerEvent({
  id: 'susp-the-other-bed',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'mental', 'social'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    if (!outLastNight(ctx.ep)) return 0;
    return 3;   // see the note on weight in `susp-account-of-the-night`
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-the-other-bed');
    const [a, b] = ctx.actors;
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    if (!others.length) return null;
    const c = others[Math.floor(rng() * others.length)];
    const sa = pStats(a);
    // Waking up at all is most of it; the rest is being awake enough to
    // register what you are looking at.
    const skill = (1 - (sa.temperament ?? 5) / 10) * 0.4 + ((sa.mental ?? 5) / 10) * 0.6;
    const gapRoll = rng();
    const shapeRoll = rng();
    const sawIt = noticed(ctx.ep, c, skill, gapRoll);
    let branch;
    if (sawIt) branch = shapeRoll < 0.5 ? 'said-it-out-loud' : 'the-bed-was-empty';
    else branch = shapeRoll < 0.5 ? 'they-had-a-reason' : 'never-woke';

    const sceneWhy = branch === 'said-it-out-loud' ? 'told somebody about an empty bed'
      : branch === 'the-bed-was-empty' ? 'woke to an empty bed and said nothing'
        : branch === 'they-had-a-reason' ? 'asked, and got an ordinary answer'
          : 'slept through the whole night';
    const note = lineFor(BED_LINES[branch],
      `susp-the-other-bed|${branch}|${ctx.ep}`, { a, b, c });
    const bondDelta = branch === 'said-it-out-loud' ? 1
      : branch === 'they-had-a-reason' ? 0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });

    if (branch === 'said-it-out-loud') {
      recordFinding(ctx.ep, c, [a, b], `woke to ${c}'s bed empty in the middle of the night`);
    }
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      about: c, topic: c, topicKind: TOPIC, threadId: t?.id, bondDelta };
  },
});
