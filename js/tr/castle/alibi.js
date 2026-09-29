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
    '{a} and {b} go hour by hour through last night.\n{b}: "Where was {c} at midnight?"\n{a}: "Nowhere I saw."',
    '{a} and {b} put last night back together, and there’s an hour with {c} nowhere in it.\n{a}: "Where was {c} between eleven and twelve?"\n{b}: "I have no idea."\n{a}: "Neither have I."',
    '{a} and {b} can’t place {c}.\n{a}: "Where was {c} at midnight?"\n{b}: "Nowhere I saw."\n{b} (to camera): "An hour missing. That’s a long time in here."',
    '{a} and {b} find a gap.\n{a}: "{c} vanished for a bit, didn’t {cSub}?"\n{b}: "A good hour."',
  ],
  'accounted-for': [
    '{a} and {b} rule {c} out.\n{b}: "{c} was with us the whole time."\n{a}: "Then it isn’t {c}."',
    '{a} and {b} walk through the whole night, and {c} is in all of it.\n{b}: "{c} was with us all evening."\n{a}: "Then it’s not {c}."',
    '{a} and {b} clear {c}.\n{a}: "{c} was with us all evening."\n{b}: "Then it’s not {c}."\n{a} (to camera): "{c}’s accounted for. Every minute."',
    '{a} and {b} confirm {c}’s night.\n{b}: "{c} was by the fire till bed."\n{a}: "Then it isn’t {c}."',
  ],
  'two-accounts': [
    '{a} and {b} disagree about their own evening.\n{a}: "We went up at eleven."\n{b}: "It was nearer one."',
    '{a} and {b} can’t agree on their own night, let alone {c}.\n{a}: "We went up at eleven."\n{b}: "It was after midnight."\n{a}: "Was it?"',
    '{a} and {b} have different versions.\n{a}: "We went up at eleven."\n{b}: "Nearer one."\n{b} (to camera): "If we can’t agree on our own night, how can we judge anyone?"',
    '{a} and {b} muddle the timeline.\n{a}: "This is hopeless."\n{b}: "Completely hopeless."',
  ],
  'nobody-saw-anything': [
    '{a} and {b} compare nights.\n{b}: "I slept."\n{a}: "So did I."\n{b}: "Useless, the pair of us."',
    'Everybody slept. That’s the entire finding.\n{a}: "So nobody saw anything."\n{b}: "Nobody saw anything."',
    '{a} and {b} come up empty.\n{a}: "Anything?"\n{b}: "Nothing."\n{a} (to camera): "Nothing. Absolutely nothing."',
    '{a} and {b} give up.\n{b}: "We were all asleep. That’s it."\n{a}: "Useless, the pair of us."',
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
    '{a} mentions it over tea.\n{a}: "A door went at two. I think it was {c}’s."\n{b}: "You think?"',
    '{a} doesn’t sleep well, and heard a door. {a} is fairly sure it was {c}’s.\n{a} (to camera): "Two in the morning. A door. I think it was {c}’s."',
    '{a} lies awake and hears it.\n{a} (to camera): {cam:heard-doors}',
    '{a} heard something in the night.\n{a} (to camera): "I’m not certain. But I’m fairly sure."',
  ],
  'passed-it-on': [
    '{a} leans in at breakfast.\n{a}: "Did you hear a door last night?"\n{b}: "No. Whose?"',
    '{a} mentions it to {b} at breakfast, carefully.\n{a}: "Did you hear a door last night?"\n{b}: "No. Why?"\n{a}: "I think it was {c}’s."',
    '{a} shares it with {b}.\n{a}: "I heard {c}’s door at two."\n{b}: "You’re sure it was {c}’s?"\n{b} (to camera): "{a} heard {c}’s door. That’s interesting."',
    '{a} tells {b} quietly.\n{a}: "Keep this between us."\n{b}: "Between us."',
  ],
  'talked-themselves-out': [
    '{a} shrugs it off.\n{a}: "Old building. Old doors. It was the wind."\n{b}: "Probably."',
    '{a} decides it was the wind, and mostly believes that.\n{a} (to camera): "Old castle. Old doors. It was the wind. Probably."',
    '{a} talks {aRef} out of it.\n{a} (to camera): {cam:drop-it}',
    '{a} lets it go.\n{a} (to camera): "I’m not accusing anyone over a creak."',
  ],
  'slept-through': [
    '{b} asks, and {a} yawns.\n{a}: "Heard nothing. Slept like a log."\n{b}: "Lucky you."',
    '{a} slept straight through and has no idea whether anything happened.\n{a} (to camera): {cam:slept-fine}',
    '{a} heard nothing.\n{b}: "Did you hear anything?"\n{a}: "I was out like a light."',
    '{a} slept soundly.\n{a} (to camera): "Nothing. I heard nothing."',
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
    '{a} lies still and says nothing about the empty bed.\n{a} (to camera): "{c} wasn’t there. I’m keeping that."',
    '{a} woke at some point, and the other bed was empty. {a} hasn’t mentioned it to {c}.\n{a} (to camera): "{c} wasn’t there. I don’t know for how long."',
    '{a} saw {c}’s empty bed in the night.\n{a} (to camera): {cam:holding-info}',
    '{a} keeps quiet about the empty bed.\n{a} (to camera): "I’m not saying anything. Yet."',
  ],
  'said-it-out-loud': [
    '{a} tells {b} in a whisper.\n{a}: "{c}’s bed was empty last night."\n{b}: "For how long?"',
    '{a} tells {b} about the empty bed, and can’t unsay it.\n{a}: "{c} wasn’t in bed last night."\n{b}: "What time?"\n{a}: "Late. Really late."',
    '{a} shares the empty bed with {b}.\n{a}: "{c}’s bed was empty last night."\n{b}: "For how long?"\n{b} (to camera): "Well. That changes things."',
    '{a} lets it out.\n{a}: "I shouldn’t have told you that."',
  ],
  'they-had-a-reason': [
    '{b} asked {c} about it at breakfast, and got an answer straight away.\n{b}: "{c} says {cSub} couldn’t sleep and went down for water."\n{a}: "Right. Of course."',
    '{c} says it was the bathroom, and it probably was.\n{b}: "{c} went to the loo. That’s all it was."\n{a}: "Fair enough."',
    '{c} has already explained the empty bed to half the castle.\n{b}: "Bathroom, apparently."\n{a}: "Makes sense. I think."',
    '{c} has an answer for the empty bed, and {b} passes it on.\n{b}: "{c} couldn’t sleep, so {cSub} got some water."\n{a}: "Right."',
  ],
  'never-woke': [
    '{b} asks about {c}, and {a} shakes {aPos} head.\n{a}: "I was out cold. Can’t help you."\n{b}: "Never mind."',
    '{a} slept through and can vouch for nothing.\n{b}: "Was {c} in bed all night?"\n{a}: "No idea. I was asleep."',
    '{a} can’t help.\n{a} (to camera): {cam:slept-fine}',
    '{a} saw nothing.\n{a}: "Sorry. I sleep like a log."',
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
