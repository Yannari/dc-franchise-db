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
    return getBond(a, b) >= -2 ? 6 : 1.5;
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
      if (!gs.tr) gs.tr = {};
      if (!Array.isArray(gs.tr._alibiFindings)) gs.tr._alibiFindings = [];
      gs.tr._alibiFindings.push({ ep: ctx.ep, subject: c, checkers: [a, b],
        source: `could not account for an hour of ${c}'s night` });
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
