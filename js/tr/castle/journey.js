// ══════════════════════════════════════════════════════════════════════
// tr/castle/journey.js — the two windows outside the castle walls
// ══════════════════════════════════════════════════════════════════════
//
// `journey-out` and `journey-back` are two of the seven windows spec §5.6
// gives a round, and until this file they held ZERO events between them. Every
// round of every season ran both, found nothing eligible, and returned — the
// budget rolled forward into evening and after-table, and the two windows
// existed as plumbing only.
//
// THERE IS NO MISSION ENGINE, AND THIS FILE DOES NOT PRETEND OTHERWISE.
// js/tr/headless.js says so at the call site: "journey-out/journey-back sit
// here because that is where the mission itself would run — there is no
// mission engine yet (a later plan builds one), so these two windows simply
// run as social scenes with nothing mechanical behind them." Nothing in here
// may narrate a mission RESULT — no shield won, no prize, no trial passed —
// because no such fact exists anywhere in the state and a sentence claiming
// one would be the engine lying to the viewer about its own game. What these
// two windows have that no other window has is the CASTLE'S ABSENCE: on the
// road there is nobody else listening, and coming back the castle is a thing
// you can see getting closer. Every event below is built out of that and out
// of nothing else.
//
// WHY THE EVENTS HERE CARRY OTHER FAMILIES' NAMES. `family` is the THREAD KIND
// an event opens and continues, not the file it lives in — `findOpenThread`
// matches on kind, so an event declaring `family: 'journey'` could only ever
// continue another journey event's thread and would be a seventh storyline
// running beside the six the castle already tells. The road is a PLACE, not a
// subject. A suspicion voiced out of earshot is the same suspicion; it is just
// finally being said out loud.
//
// WHY journey-back IS WHERE THE CLOSERS ARE. Plan 5's second amendment
// measured the pool's real deficit: threads close 3.5% of the time, 0.84 a
// season, and a story that never pays off is a story a viewer cannot read. The
// two crowded windows (evening, after-table) cannot carry more content without
// starving what is already there — guard 1 multiplies a declared advancer by
// 4x-9x and `rare` by only 2x, which is how ten declarations in `morning` once
// starved `romance-shared-alibi` to the edge of dead. journey-back is empty,
// so a closer placed here competes with nothing, and it is also the right
// place on the merits: the walk home is when a thing that has been running all
// day gets settled or dropped.
//
// No belief writes here, same as every other castle file: these events move
// bonds, threads and residue and nothing else.
import { gs } from '../../core.js';
import { pStats, romanticCompat } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcAdvanceCiting, arcContinue } from './effects.js';
import { findOpenThread, heatAt, priorMoments } from '../threads.js';
import { alignmentAt } from '../roles.js';
import { MAX_ACTIVE_ROMANCES, _activeRomanceCount, _threadForActors } from './romance.js';
import { _sentenceCase } from './cover.js';
import { murderCount } from '../state.js';
import { lineFor, pronounSlots } from './lines.js';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

// NOT FROM THE ROUND RECORD (whole-plan review, F1). Night one's murder is
// never pushed as a round, so `rounds.filter(r => r.murdered)` undercounts by
// one all season — which here decided which BRANCH of the shrinking-column
// scene ran ("first" vs "again"), and the count is printed by grief.js.
/** How many people the castle has already lost. */
function _deaths() { return murderCount(gs); }

// THE MOST RECENT MURDER VICTIM, off the round log — real sim data, the name a
// Traitor rehearsing an alibi is accounting for. Null before the first murder,
// on which the road-cover topic falls back to the last afternoon out. Reading
// the log is a PURE READ; it changes no state and no firing.
function _lastMurdered() {
  // the finished episodes first: they hold night one, which leaves no round
  const rows = gs?.episodeHistory || [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const ex = (rows[i] && rows[i].exits) || [];
    for (let j = ex.length - 1; j >= 0; j--) if (ex[j] && ex[j].channel === 'murder' && ex[j].name) return ex[j].name;
  }
  const rounds = gs?.tr?.rounds || [];
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i] && rounds[i].murdered) return rounds[i].murdered;
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// journey-out — the walk away from the castle
// ══════════════════════════════════════════════════════════════════════

// ── REWRITE (Task 7 stage 6). The audit: "3 branches; no thread write, so no
// reachable follow-up and no terminal outcome" — the thread write arrived in
// stage 2's migration, and the branch count and the pools did not. Five
// branches now, every pool at ten lines, and a terminal outcome the walk did
// not have.
//
// THE RECORD THE FORK READS is still {b} — who somebody becomes on a walk out
// of earshot is a real thing about them — plus the stored bond and the arc's
// own heat, because the second honest walk with the same person is a different
// scene from the first.
const STEP_LINES = {
  confided: [
    '{b} falls into step with {a} on the way out and starts talking.\n{b}: "Can I tell you something? I haven’t said this to anyone in there."\n{a}: "Go on."\n{b}: "I don’t trust half the people at breakfast."',
    '{b} walks with {a} and opens up.\n{b}: "It’s easier out here. No walls."\n{a}: "No ears, you mean."\n{b}: "That too."',
    '{b} tells {a} more in ten minutes of walking than in days indoors.\n{b}: "I miss my kids. I haven’t said that out loud yet."\n{a}: "You can say it to me."',
    '{b} and {a} walk ahead of the others.\n{b}: "Honestly? I’m struggling."\n{a}: "Me too. Nobody admits it."',
    '{b} confides in {a} on the track.\n{b}: "If I go next, I want you to know who I think it is."\n{a}: "Don’t say that. You’re not going next."\n{b}: "Just in case. Promise me you’ll listen."\n{a} (to camera): {cam:holding-info}',
  ],
  probed: [
    '{b} keeps pace with {a} the whole way out, asking questions.\n{b}: "So where were you last night, after the fire?"\n{a}: "Bed. Why?"\n{b}: "Just asking."',
    '{b} walks with {a} and won’t stop asking.\n{b}: "Who do you trust? Honestly?"\n{a}: "Is this an interview?"',
    '{b} quizzes {a} on the road.\n{b}: {say:ask-where}\n{a}: {say:answer-clean}',
    '{b} asks {a} one question after another.\n{b}: "Where were you after dinner? And before that? And who with?"\n{a}: "Is this a walk or a trial?"\n{a} (to camera): "Three miles of questions. I felt like I was on trial."',
    '{b} digs.\n{b}: "What did you make of last night?"\n{a}: "Same as you, probably."\n{b}: "I doubt that."',
  ],
  quiet: [
    '{a} and {b} walk the whole way without saying much, and neither minds.\n{a}: "Nice out."\n{b}: "Lovely."\nThat’s about it.',
    '{a} and {b} share a comfortable silence on the track.\n{b} (to camera): "Sometimes you don’t need to talk. That’s rare in here."',
    '{a} and {b} walk side by side, saying nothing.\n{a} (to camera): {cam:switch-off}',
    '{a} and {b} walk without a word.\n{b}: "Good to not talk for a bit."\n{a}: "Mm."',
    '{a} and {b} enjoy the quiet.\n{a} (to camera): {cam:fresh-air}',
  ],
  'said-too-much': [
    '{b} talks for two miles and spends the last one worrying about it.\n{b}: "Forget what I said about the vote."\n{a}: "Which bit?"\n{b}: "All of it."',
    '{b} tells {a} far too much.\n{b}: "…and that’s why I’m not voting for them. Oh God. Forget I said that."\n{a}: "Said what?"\n{b} (to camera): {cam:overdid}',
    '{b} realises {bSub} has said too much.\n{b}: "That stays between us, yeah?"\n{a}: "Of course."\n{a} (to camera): "Of course it doesn’t."',
    '{b} lets something slip on the walk.\n{b}: "Well, I know who the others went to first, so—"\n{a}: "Who?"\n{b}: "Nobody. Forget it."\n{a} (to camera): {cam:holding-info}',
    '{b} goes quiet after saying one thing too many.\n{b}: "I shouldn’t have told you that."\n{a}: "Too late now."',
  ],
  'fell-behind': [
    '{b} drops back at the first stile and finishes the walk with somebody else.\n{a} (to camera): "Didn’t want to walk with me, then. Noted."',
    '{b} slows down and lets {a} go on alone.\n{a}: "You coming?"\n{b}: "Go ahead. I’ll catch up."\n{b} never catches up.',
    '{b} peels away from {a} halfway.\n{a} (to camera): {cam:left-out}',
    '{b} finds a reason to walk with someone else.\n{a}: "Something I said?"\n{b}: "No, just — I’ll see you there."',
    '{b} falls behind on purpose.\n{b} (to camera): "I needed a break from {a}. Nothing personal."',
  ],
};

// THE FORK IS ON THE PERSON WHO CAUGHT UP, not on a roll with three labels.
// Who someone becomes on a walk out of earshot is a real thing about them:
// a loyal, sociable player says the true thing, a strategic one uses the
// privacy to work, and a low-social player just walks.
registerEvent({
  id: 'trust-fall-into-step',
  family: 'trust',
  window: 'journey-out',
  // TRUE, AND DECLARED ON PURPOSE. Two people who already have a trust story
  // walking out of the castle together is the most natural continuation beat
  // in this window, and `continueThread` really does attach to their open
  // thread. Guard 1's 4x-9x lands in a window holding five events, not in the
  // pool's most crowded one — see the header.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['loyalty', 'social', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Nobody walks the whole road beside someone they are actively hostile to.
    return getBond(a, b) >= 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-fall-into-step');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      confided: (st.loyalty / 10) * 0.45 + (st.social / 10) * 0.45,
      probed: (st.strategic / 10) * 0.5 + (st.intuition / 10) * 0.5,
      quiet: (1 - st.social / 10) * 0.6 + 0.15,
      // Saying too much needs somebody who talks and does not hold it well.
      'said-too-much': (st.social / 10) * 0.35 + (1 - st.temperament / 10) * 0.35,
      // And walking away from somebody needs a reason not to walk with them.
      'fell-behind': Math.max(0.05, 0.4 - Math.max(0, bond) * 0.07),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'quiet';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'said-too-much' ? 'said more on the road than they meant to'
      : branch === 'fell-behind' ? 'let the gap open on the road out'
        : 'fell into step on the road out';
    const bondDelta = branch === 'confided' ? 2
      : branch === 'probed' ? -0.5
        : branch === 'said-too-much' ? 1
          : branch === 'fell-behind' ? -1.5 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, STEP_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, line, { source: sceneWhy });
    // TERMINAL: a road walked apart is a story that ended on the road, and
    // `buried` is what neither of them will raise at the castle.
    if (thread && branch === 'fell-behind') {
      api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    }
    const out = { branch, pair: [a, b], threadId: thread?.id, cited, bondDelta };
    // {b} is the one who caught up and {b} is the one doing the talking, so
    // {b} drives every branch except the one where {b} leaves.
    if (branch === 'fell-behind') { out.speaker = a; out.respondent = b; }
    else { out.speaker = b; out.respondent = a; }
    return out;
  },
});
// ── REWRITE (Task 7 stage 6). The audit: "3 branches; no thread write" — the
// write landed in stage 2 and the branch count did not. Five now, pools at
// eight, and the two added branches are the two answers the road most obviously
// has and this event could not give: naming somebody back, and refusing to
// have the conversation at all.
//
// THE RECORD THE FORK READS is unchanged and is {b}'s: their own stats and the
// stored bond between {b} and the person {a} has just named. Nothing here
// reads who anybody actually is.
const EARSHOT_LINES = {
  agreed: [
    '{a} waits until the castle is out of sight to say {c}’s name.\n{a}: "It’s {c}. I’m sure of it."\n{b}: "I’ve been thinking it for days."',
    '{a} floats {c} on the road, and {b} jumps on it.\n{a}: "What do you think about {c}?"\n{b}: {say:agree-suspect:{c}}',
    '{a} and {b} agree on {c}.\n{a}: "So it’s {c}."\n{b}: "It’s {c}."',
    'Away from the castle, {a} names {c}.\n{b}: "Thank God. I thought it was just me."\n{a}: "Then we watch {cObj} tonight. Both of us."',
    '{a} says {c}, quietly.\n{b}: "Same. Let’s watch {cObj} at dinner."\n{a}: "Watch {cObj} at the table too."',
  ],
  hedged: [
    '{a} floats {c}’s name on the road. {b} neither agrees nor argues.\n{a}: "What about {c}?"\n{b}: "Maybe. I don’t know."\n{a} (to camera): "That’s not a no."',
    '{a} mentions {c}.\n{b}: {say:doubt-suspect:{c}}\n{a}: "Fair. Just keep an eye out."',
    '{a} tests {c}’s name on {b}.\n{b}: "Could be. Could be anyone."\n{a}: "Anyone isn’t an answer."\n{b}: "It’s the only honest one."',
    '{a} brings up {c}. {b} shrugs.\n{b}: "I need more than a feeling."\n{a}: "A feeling is how it starts."\n{b}: "A feeling is how Faithfuls go home."',
    '{a} tries {c} on {b}.\n{b}: "I’ll think about it."\n{a}: "Think fast. The table’s tonight."\n{a} (to camera): {cam:unsure-info}',
  ],
  defended: [
    '{a} says {c}’s name out on the road, and {b} shuts it down.\n{a}: "I think it’s {c}."\n{b}: "No. Absolutely not."',
    '{b} defends {c} straight away.\n{b}: "{c}? Never. I’d stake my game on {cObj}."\n{a}: "You’re very sure."\n{b}: "I am."',
    '{a} suggests {c}. {b} is having none of it.\n{b}: "You’re wrong about {c}."\n{a}: "We’ll see."',
    '{b} won’t hear a word against {c}.\n{a}: "I’m only saying what I’ve seen."\n{b}: "Then you’ve seen wrong. Drop it."\n{a} (to camera): "Why is {b} so protective of {c}?"',
    '{a} names {c}, and {b} bristles.\n{b}: "Leave {c} out of it."\n{a}: "Touchy."\n{b}: "Loyal. There’s a difference."',
  ],
  'named-somebody-else': [
    '{a} says {c}. {b} listens, then says a different name.\n{a}: "{c}, surely."\n{b}: "No. Somebody else. Somebody quieter."',
    '{a} brings up {c}. {b} has another name.\n{b}: "Forget {c}. Think about who’s been too quiet."\n{a}: "Too quiet like who?"\n{b}: "Work it out. I’m not saying it out here."',
    '{a} suggests {c}. {b} disagrees.\n{b}: "I’ve got a different name."\n{a}: "Go on."',
    '{b} steers {a} away from {c}.\n{b}: "You’re looking in the wrong place."\n{a}: "Then where should I look?"\n{b}: "Closer to home."',
    '{a} and {b} have different names.\n{a}: "It’s {c}. I’m sure of it."\n{b}: "It isn’t. I’ve got someone else."\n{a} (to camera): "{b} wouldn’t go with {c}. Interesting."',
  ],
  'would-not-talk-about-it': [
    '{a} mentions {c}.\n{b}: "Not out here."\n{a}: "Out here’s the only place we can."\n{b}: "Still no."',
    '{b} refuses to talk names on the road.\n{b}: "Can we just walk?"\n{a}: "We can walk and talk."\n{b}: "Not about that."',
    '{a} brings up {c}. {b} changes the subject.\n{b}: "Look at that view."\n{a}: "The view’s been there all week."\n{a} (to camera): "Dodged it completely."',
    '{b} won’t discuss {c}.\n{b}: "I’m not doing names today."\n{a}: "Then when?"\n{b}: "Not out here."',
    '{b} goes quiet at {c}’s name.\n{a}: "What about {c}?"\n{b}: "…What about {cObj}?"\n{a} (to camera): {cam:unsure-info}',
  ],
};

// SAYING IT OUT LOUD IS THE MECHANIC. Inside the castle a suspicion is a
// glance; on the road it has to become a sentence with a name in it, and the
// other person has to do something with that sentence.
registerEvent({
  id: 'susp-out-of-earshot',
  family: 'suspicion',
  window: 'journey-out',
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['intuition', 'strategic', 'loyalty', 'boldness'],
    relationship: ['close-ally', 'rival', 'neutral'],
    knowledge: ['incomplete', 'witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    // You need somebody you can say it to. A warm pair says it; a hostile one
    // walks in silence and this is not their scene.
    return getBond(a, b) >= 1 ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-out-of-earshot');
    const [a, b] = ctx.actors;
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : ctx.living);
    const st = pStats(b);
    // What `b` does with a name said out loud: a sharp, ambitious player takes
    // it and builds; a cautious one refuses to commit to anything; a loyal one
    // defends. Nothing here reads who anybody actually is.
    const scores = {
      agreed: (st.intuition / 10) * 0.5 + (st.strategic / 10) * 0.5,
      hedged: (1 - st.boldness / 10) * 0.6 + 0.2,
      defended: (st.loyalty / 10) * 0.6 + Math.max(0, getBond(b, target)) / 10 * 0.4,
      // Trading a name for a name needs somebody who has one to trade.
      'named-somebody-else': (st.strategic / 10) * 0.3 + (st.boldness / 10) * 0.3,
      // And refusing the conversation is temperament plus a low appetite for
      // being on any record at all.
      'would-not-talk-about-it': (st.temperament / 10) * 0.35 + (1 - st.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'hedged';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'named-somebody-else' ? 'answered a name on the road with a different one'
      : branch === 'would-not-talk-about-it' ? 'would not discuss anybody out on the road'
        : 'talked about somebody out of their earshot on the road';
    const bondDelta = branch === 'agreed' ? 1.5
      : branch === 'defended' ? -1
        : branch === 'named-somebody-else' ? 1
          : branch === 'would-not-talk-about-it' ? -0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, EARSHOT_LINES[branch]), { a, b, c: target })
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    // The thread is the PAIR's — what these two now share is that one of them
    // said a name to the other, which is a fact about the two of them.
    const { thread, cited } = arcContinue(api, 'suspicion', [a, b], ctx.ep, line, { source: sceneWhy });
    // A ROAD SUSPICION IS A HUNCH, NOT EVIDENCE — it moves the bond and shows a
    // labelled read chip on the card, but it does NOT write the belief board.
    // Only priced channels (missions, ballots, murders, the Seer) move the vote.
    return { branch, pair: [a, b], speaker: a, respondent: b, about: target,
      topic: target, topicKind: 'road-third-name',
      threadId: thread?.id, cited, bondDelta };
  },
});
// ── REWRITE (Task 7 stage 6). The audit's verdict was the harshest in the
// table: "3 branches; writes NO effects: the scene happens and nothing in the
// season is different afterwards." Stage 2's migration gave it a thread write.
// This gives it a fork worth having, a fifth branch, wider pools, and the two
// things a rehearsal on a road can actually END in.
//
// THE RECORD THE FORK READS is the cover arc itself — `priorMoments` counts
// how many times this person has already been over this account, and the
// fourth rehearsal of one story is a symptom rather than preparation — plus
// the Traitor's own mental, strategic and temperament.
// EVERY LINE NAMES WHAT IS BEING REHEARSED. `{topic}` fills from the concrete
// thing the Traitor is accounting for — the night the last victim was murdered,
// or the last afternoon out before any murder — so the scene is never a Traitor
// rehearsing an unnamed "story", the vague premise the reviewer read.
const ROAD_REHEARSAL_LINES = {
  airtight: [
    '{a} says {topic} over in {aPos} head, one step per stride, all the way to the vans.\n{a} (to camera): "Nothing missing. Nothing extra. That’s how you tell it."',
    '{a} runs the account of {topic} back through on the walk, and can’t find a gap in it.\n{a} (to camera): {cam:story-fine}',
    '{a} goes over {topic} step by step on the road.\n{a} (to camera): {cam:story-hold}',
    '{a} tests {aPos} own story about {topic} and it holds.\n{a} (to camera): "Every minute accounted for. Let them ask."',
  ],
  serviceable: [
    '{a} gets {topic} most of the way straight before the vans come into view.\n{a} (to camera): "It’s not perfect. Perfect sounds made up anyway."',
    '{a} goes over {topic} on the walk, and gets most of it to hold.\n{a} (to camera): {cam:story-hold}',
    '{a} patches {aPos} account of {topic} as {aSub} walks.\n{a} (to camera): "It’ll do. It has to."',
    '{a} runs through {topic} one more time.\n{a} (to camera): {cam:story-close}',
  ],
  overcooked: [
    '{a} has told {topic} to {aRef} so many times the words have gone smooth.\n{a} (to camera): "Too smooth. Real stories have lumps in them."',
    '{a} rehearses {topic} so many times it stops sounding real.\n{a} (to camera): {cam:overdid}',
    '{a} says the account of {topic} under {aPos} breath all the way out.\n{a} (to camera): "Now it sounds rehearsed. Because it is."',
    '{a} over-practises {topic}.\n{a} (to camera): {cam:overdid}',
  ],
  'stopped-rehearsing': [
    '{a} stops mid-sentence on {topic} and just walks.\n{a} (to camera): {cam:story-hold}',
    '{a} gets half a mile into rehearsing {topic} and stops.\n{a} (to camera): "Rehearsing is how you get caught. I’m just going to tell it."',
    '{a} gives up practising {topic}.\n{a} (to camera): {cam:story-hold}',
    '{a} decides not to rehearse {topic} any more.\n{a} (to camera): "The more I say it, the worse it sounds."',
  ],
  'could-not-get-it-straight': [
    '{a} loses track of {topic} for the third time and kicks a stone.\n{a} (to camera): "If I can’t tell it to myself, how do I tell it to them?"',
    '{a} can’t get through {topic} once without losing an hour of it.\n{a} (to camera): {cam:story-close}',
    '{a} tries to run {topic} in order, and it won’t go.\n{a} (to camera): "There’s a gap. I can’t fill it."',
    '{a} mutters {topic} to {aRef} and gets it wrong twice.\n{a} (to camera): {cam:story-close}',
  ],
};

// TRAITOR-ONLY, BY ROLE — the actor's own alignment, which is self-knowledge
// and the one ground-truth read the probes allow. Written as a `find` over
// the scene, exactly like every weight() in cover.js, so it cannot tell WHICH
// of two people is the Traitor.
registerEvent({
  id: 'cover-road-rehearsal',
  family: 'cover',
  window: 'journey-out',
  // A cover story is personal: the thread is on the Traitor alone, so the
  // lookup has to be per-actor or a two-person scene misses it entirely.
  threadScope: 'solo',
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire', 'rejected'],
    voice: ['mental', 'strategic', 'temperament'],
    alignment: ['traitor'],
    knowledge: ['incomplete'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return ctx.actors.some(n => isTraitor(n, ctx.ep)) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-road-rehearsal');
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    // HOW MANY TIMES THIS PERSON HAS ALREADY BEEN OVER IT, off the stored arc.
    const existing = findOpenThread('cover', [actor]);
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    const scores = {
      // Competence, not permission: the role already granted the scene.
      airtight: (st.strategic / 10) * 0.5 + (st.mental / 10) * 0.5,
      serviceable: 0.5,
      overcooked: (1 - st.temperament / 10) * 0.5 + Math.min(3, times) * 0.1,
      'stopped-rehearsing': (st.intuition / 10) * 0.25 + Math.min(3, times) * 0.09,
      'could-not-get-it-straight': (1 - st.mental / 10) * 0.4 + (1 - st.temperament / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'serviceable';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    // THE CONCRETE THING BEING REHEARSED. The last victim's murder is the night
    // a Traitor most needs an account for; before any murder, the last afternoon
    // out. A pure read of the round log — no rng draw, no state write, so the
    // firing stream is bit-identical to before.
    const victim = _lastMurdered();
    // on the road OUT, today's mission has not happened: the account is of yesterday's
    const topic = victim ? `the night ${victim} was murdered` : 'what happened on yesterday’s mission';
    const sceneWhy = branch === 'stopped-rehearsing' ? 'decided the rehearsing was the dangerous part'
      : branch === 'could-not-get-it-straight' ? 'could not get one evening into the same order twice'
        : 'ran through their account of the night on the road';
    const line = pronounSlots(pick(rng, ROAD_REHEARSAL_LINES[branch]), { a: actor })
      .replace(/\{a\}/g, actor).replace(/\{topic\}/g, topic);
    const { thread, cited } = arcContinue(api, 'cover', [actor], ctx.ep, line, { source: sceneWhy });
    // TWO TERMINAL OUTCOMES, and the event had neither. An account walked
    // smooth enough to stop working on is `passed-clean`; a rehearsal
    // deliberately abandoned is `buried`, because nobody else will ever know
    // there was one.
    if (thread && branch === 'airtight') {
      api.resolveArc(thread.id, 'passed-clean', { source: sceneWhy });
    }
    if (thread && branch === 'stopped-rehearsing') {
      api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    }
    return { branch, actor, topic, topicKind: 'road-cover', threadId: thread?.id, cited };
  },
});
// ── WIDENED AND REFORKED (Task 7 stage 6). A KEEP-list event, and the clearest
// demonstration in the pool of why a KEEP verdict was never "no work": three
// branches with five-line pools, on the highest-firing event in `journey-out`,
// put `flattered` and `wary` in the top ten of the repetition blame table two
// batches running. Five branches now, ten lines each — both terms of
// `C(F,3)/P^2` at once.
//
// THE TWO ADDED BRANCHES ARE THE TWO REFUSALS the test could not express: the
// person picked can decline to be picked, and the person picked can turn the
// walk round and do the asking. The record they read is the stored bond
// between the two and {b}'s own boldness — nothing invented.
const WALK_PICK_LINES = {
  flattered: [
    '{a} chooses {b} to walk with, and {b} is visibly pleased.\n{b}: "Me? Really?"\n{a}: "Why not you?"\n{b} (to camera): "Nobody usually picks me. That was nice."',
    '{a} falls in beside {b}.\n{a}: "Walk with me?"\n{b}: "I’d love to."',
    '{a} picks {b} over the obvious choice.\n{b}: "Why me? You usually walk with the others."\n{a}: "Fancied a change."\n{b} (to camera): "{a} chose me. I won’t forget that."',
    '{b} beams all the way down the track.\n{b}: "I thought you’d walk with your usual lot."\n{a}: "Fancied a change."',
  ],
  wary: [
    '{a} chooses {b} to walk with, and {b} spends the road working out why.\n{b}: "Why me today?"\n{a}: "Does there have to be a reason?"\n{b}: "In here? Yes."',
    '{b} is suspicious of {a}’s choice.\n{b}: "What do you want, {a}?"\n{a}: "A walk. Just a walk."\n{b}: "Nobody wants just a walk."\n{b} (to camera): "{a} never walks with me. What does {aSub} want?"',
    '{a} picks {b}. {b} is wary.\n{b}: "What are you after?"\n{a}: "Company."',
    '{b} keeps {bPos} guard up.\n{a}: "You’re very quiet."\n{b}: "I’m listening. You’re the one who picked me."\n{b} (to camera): {cam:unsure-info}',
  ],
  transactional: [
    '{b} understands the pick immediately.\n{b}: "So. What are we talking about? The vote?"\n{a}: "Straight to it."\n{b}: "Why else would you walk with me?"',
    '{b} gets down to business.\n{b}: "You want my vote. What do I get?"\n{a}: "Straight to it, then."\n{b}: "Life’s short. So’s the walk."',
    '{b} treats the walk as a deal.\n{b}: "Let’s make this worth it."\n{a}: "Fine by me."',
    '{b} works out straight away what the walk is for.\n{b}: "Let’s skip the small talk. What are you offering?"\n{a}: "Who says I’m offering anything?"\n{b} (to camera): "{a} picked me for a reason. I want to know what it’s worth."',
  ],
  'would-not-be-picked': [
    '{a} falls in beside {b}, and {b} finds a reason to be elsewhere within the mile.\n{b}: "Just need to catch someone. Sorry."\n{a}: "Right. Course."\n{a} (to camera): "Charming."',
    '{b} slips away from {a}.\n{b}: "I’ll see you there."\n{a}: "I’ll walk with you."\n{b}: "No, it’s fine. Honestly."',
    '{b} walks faster until {a} gives up.\n{a}: "Slow down a bit?"\n{b}: "Can’t. Need to catch the others."\n{a} (to camera): {cam:left-out}',
    '{b} doesn’t want to walk with {a}.\n{a}: "Walk with me?"\n{b}: "Maybe later."\n{b} (to camera): "Not today. I’m not having that conversation."',
  ],
  'turned-it-around': [
    '{a} picks {b}, and by the second mile {b} is doing the asking.\n{b}: "So who are you writing tonight?"\n{a}: "I was going to ask you that."\n{b}: "I asked first."',
    '{b} takes charge of the conversation.\n{b}: "Let’s talk about you, actually. Who do you trust?"\n{a}: "I was going to ask you that."\n{a} (to camera): "I picked {b} to get answers. I ended up giving them."',
    '{b} flips it on {a}.\n{b}: {say:ask-where}\n{a}: "I asked you first."\n{b}: "And I asked second. Go on."',
    '{b} runs rings round {a}.\n{b}: "Your turn. What do you know?"\n{a}: "Not much."\n{b}: "Liar."',
  ],
};

// WHO YOU WALK WITH IS A TEST, and the test is on the person picked: the pick
// itself says something, and what they do with it says more.
registerEvent({
  id: 'testing-who-you-walk-with',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one who picked, the one who was picked], and the
  // comment above says so — "the test is on the person picked". Four of this
  // event's fifteen lines name {a} last, which is precisely where the screen's
  // fallback heuristic answers in the picker's voice.
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: 'testing',
  window: 'journey-out',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['social', 'intuition', 'strategic', 'boldness'],
    relationship: ['close-ally', 'rival', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    return 2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-who-you-walk-with');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      flattered: (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.5,
      wary: (st.intuition / 10) * 0.6 + (1 - st.temperament / 10) * 0.4,
      transactional: (st.strategic / 10) * 0.6 + (1 - st.loyalty / 10) * 0.4,
      // You only refuse a walk with somebody you would rather not be seen
      // beside, so this reads the stored bond and nothing else about them.
      'would-not-be-picked': Math.max(0, 0.45 - Math.max(0, bond) * 0.09),
      'turned-it-around': (st.boldness / 10) * 0.35 + (st.intuition / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'flattered';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'would-not-be-picked' ? 'declined to be walked with'
      : branch === 'turned-it-around' ? 'was picked and did the asking instead'
        : 'who they chose to walk beside';
    const bondDelta = branch === 'flattered' ? 2
      : branch === 'wary' ? -0.5
        : branch === 'transactional' ? 0.5
          : branch === 'would-not-be-picked' ? -2 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, WALK_PICK_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = api.openArc('testing', [a, b], { source: sceneWhy, seed: line });
    // TERMINAL: a walk refused is a test that got no answer, and `turned-back`
    // is what the pick came home as.
    if (t && branch === 'would-not-be-picked') {
      api.resolveArc(t.id, 'turned-back', { source: sceneWhy });
    }
    // THE CONCRETE SUBJECT is the person picked ({b}) — the test is on them.
    const out = { branch, pair: [a, b], topic: b, topicKind: 'road-walk-test',
      threadId: t?.id, bondDelta };
    // AND ON ONE BRANCH THE DIRECTION REVERSES, which `roles:
    // 'initiator-first'` cannot express — that is a property of the event and
    // this is a property of the branch. An explicit pair on the result takes
    // precedence over `roles` (see `sceneSpeakers`), so it is stated here.
    if (branch === 'turned-it-around') { out.speaker = b; out.respondent = a; }
    return out;
  },
});
// FOUR POOLS, NOT TWO, AND A BRANCH LABEL THAT SAYS WHICH (round 2, R5). This
// is the most-fired new event in the pool - 906 firings per 400 seasons - it is
// solo-capable, and it shipped with three lines and a CONSTANT branch label.
// The repetition audit's (id, branch) table is the only thing in this project
// that notices a season looping, and a constant label makes an event
// structurally invisible to it: every firing collapses onto one row whatever
// the scene was. `grief-nobody-sleeps` had the same defect and got the same
// fix; this one was missed.
//
// The two real axes are who is present (a lone actor or a pair) and whether
// this is the FIRST time the road out has been shorter or another one in a
// series. Those are different scenes, so they are four pools and four branch
// labels rather than one pool of six lines.
const SHORT_COLUMN_LINES = {
  'solo-first': [
    '{a} looks back at the line behind {aObj} and it’s shorter than {aSub} expected.\n{a} (to camera): "You notice it on the walks. There’s room to breathe now. I hate that."',
    '{a} looks at the group leaving the castle and sees how short it has got.\n{a} (to camera): {cam:few-left}',
    'The line leaving the castle is shorter than last time, and {a} notices.\n{a} (to camera): "There used to be so many of us on this walk."',
    '{a} counts the people on the road out.\n{a} (to camera): {cam:few-left}',
  ],
  'solo-again': [
    '{a} walks at the back and counts without meaning to.\n{a} (to camera): {cam:few-left}',
    '{a} has stopped counting the people on the road, and knows the number anyway.\n{a} (to camera): {cam:few-left}',
    '{a} walks out with fewer people again.\n{a} (to camera): "It gets smaller every time. You stop saying it out loud."',
    '{a} notices the gap in the line.\n{a} (to camera): {cam:few-left}',
  ],
  'pair-first': [
    '{a} nudges {b} and nods at the line ahead.\n{a}: "Half the size of the first day."\n{b}: "Less than half."',
    'The group leaving is shorter than last time.\n{a}: "Look how few of us there are."\n{b}: "Don’t."\n{b} only nods.',
    '{a} and {b} walk at the back and count the line.\n{a}: "It’s getting small."\n{b}: "It is."',
    '{a} says it out loud.\n{a}: "We used to take up the whole road."\n{b}: "Don’t."',
  ],
  'pair-again': [
    '{a} and {b} fall into step at the back, where the gaps are.\n{b}: "Remember when you couldn’t hear yourself on this walk?"\n{a}: "Now you can hear everything."',
    '{a} and {b} have both stopped counting out loud.\n{a}: "Shorter again."\n{b}: "I know."',
    '{a} and {b} look at the line and say nothing.\n{b} (to camera): {cam:few-left}',
    '{a} and {b} walk out with fewer people again.\n{a}: "Who’s next, do you think?"\n{b}: "Don’t."',
  ],
};

// SOLO-CAPABLE ON PURPOSE. `_sceneActors` draws one actor about 40% of the
// time when it is not walking a live thread into the room, and a window whose
// whole pool demands a pair simply returns nothing on those draws — content
// that exists and is skipped, which is the failure the reachability sweep is
// for. Two of this window's events take a lone actor.
registerEvent({
  id: 'grief-shorter-column',
  variationAxes: {
    outcome: ['ambiguous', 'accepted'],
    relationship: ['close-ally', 'neutral'],
  },
  family: 'grief',
  window: 'journey-out',
  // COOLDOWN OVERRIDE (spec 5.4.2). 878 firings per 400 seasons, up to five
  // in one - second only to `susp-heard-in-the-corridor`, and for the same
  // structural reason: it needs only a death to have happened, so once the
  // season is underway it is eligible on every road out forever. The default
  // 2-episode event window lets the show narrate the shrinking column every
  // other episode, which is the one observation that genuinely does not need
  // restating - the audience can see the column. Both scopes widened.
  cooldown: { event: 3, player: 5 },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // The castle has to have lost somebody for the road to be shorter.
    return _deaths() >= 1 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-shorter-column');
    const sceneWhy = 'the column that set out was shorter than the last one';
    const [a, b] = ctx.actors;
    const deaths = _deaths();
    const branch = `${b ? 'pair' : 'solo'}-${deaths >= 2 ? 'again' : 'first'}`;
    const line = _sentenceCase(pronounSlots(pick(rng, SHORT_COLUMN_LINES[branch]), { a, b })
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b || 'somebody'));
    if (b) api.addBond(a, b, 1, { source: sceneWhy });
    const parties = b ? [a, b] : [a];
    const t = api.openArc('grief', parties, { source: sceneWhy, seed: line });
    return { branch, actors: [...ctx.actors], deaths,
      threadId: t?.id, bondDelta: b ? 1 : 0 };
  },
});


// ── REWRITE (Task 7 stage 5). Third on the blame table, and the only romance
// event in `journey-out` — so every road-out spark in a season came out of one
// pool with one label on it.
//
// FOUR WALKS, and the fork is what the two of them do with an hour of being
// next to each other where nobody can hear:
//
//   road-spark      — it starts, quietly, and neither of them names it.
//   named-it        — one of them says the thing out loud on the road, which
//                     is a much larger act than letting it happen.
//   somebody-saw    — a third person on that road watched the whole thing,
//                     which makes it the castle’s business before it is
//                     theirs.
//   walked-it-off   — it nearly happened and one of them stepped away from it,
//                     for a reason they could give if asked.
//
// EVERY BRANCH STILL OPENS THE SPARK ARC except `walked-it-off`, which is the
// one that does not — and that branch resolves nothing and opens nothing on
// the romance side, so it writes an ordinary `trust` beat instead. An event
// that sometimes declines to do what it is named for has to say so somewhere
// the record can see, and the branch label is that.
const ROAD_SPARK_LINES = {
  'road-spark': [
    'Something happens on the walk between {a} and {b} that never happens in the castle.\n{a}: "You’re different out here."\n{b}: "So are you. Nicer."\n{a}: "Don’t tell anyone."',
    '{a} and {b} fall behind the group without deciding to.\n{b}: "We should catch up."\n{a}: "Should we?"',
    '{a} makes {b} laugh twice before the first gate.\n{b}: "Stop it, I’ll fall over."\n{a}: "Then fall over. I’ll catch you."\n{b} (to camera): "I haven’t laughed like that since I got here. That’s a problem."',
    '{a} offers {b} a hand over the stile and doesn’t let go straight away.\n{b}: "You can let go now."\n{a}: "I know."',
    '{a} and {b} walk close enough that their arms keep touching.\n{b}: "You’re very close."\n{a}: "It’s a narrow path."\n{b}: "It isn’t."\n{a} (to camera): "Nothing happened. Something happened."',
  ],
  'named-it': [
    'Halfway to the vans, {a} says it out loud, and {b} doesn’t run.\n{a}: "I like you. I don’t know what to do with that in here."\n{b}: "Nothing, yet."',
    '{a} stops on the track and says it.\n{a}: "This is going to get complicated."\n{b}: "It already is."',
    '{b} asks, and {a} answers honestly.\n{b}: "Is this a game thing?"\n{a}: "No. Unfortunately."',
    '{a} names it before {aSub} can talk {aRef} out of it.\n{a}: "I’d rather say it than spend a week pretending."\n{b}: "Okay. Then I’ll say it back."\n{b} (to camera): "Brave. Stupid. Brave."',
  ],
  'somebody-saw': [
    '{a} and {b} walk out together, and half the line watches them do it.\n{b}: "Everyone’s looking."\n{a}: "Let them."',
    '{a} and {b} laugh at something, and three heads turn.\n{b}: "Everyone’s looking at us."\n{a}: "Let them."\n{a} (to camera): "By lunch that’ll be a rumour."',
    '{a} and {b} walk at the back, and someone keeps glancing round.\n{b}: "We’ve got an audience."\n{a}: "We always had one."',
    '{a} and {b} get noticed.\n{a}: "We’ve been clocked."\n{b}: "We were clocked on day two."\n{b} (to camera): "There’s no private in this place. Not even in a field."',
  ],
  'walked-it-off': [
    '{a} feels it coming and drops back to walk with somebody else.\n{a} (to camera): "Not now. Not in here. I know exactly where that goes."',
    '{a} lengthens {aPos} stride and leaves {b} behind.\n{b}: "Was it something I said?"\n{a}: "No. That’s the problem."',
    '{a} walks it off before it becomes anything.\n{a} (to camera): "A crush is a weakness. Weaknesses get used."',
    '{a} changes the subject, then changes walking partner.\n{b}: "Was it something I said?"\n{a}: "No. I just need to catch someone."\n{b} (to camera): "Well. That was a very fast exit."',
  ],
};


// The gates are `romance-spark`'s own, deliberately identical: not already
// paired, romantically compatible (CLAUDE.md's rule), and under the castle's
// local 4-active cap - IMPORTED from romance.js (round 2, R7), not copied.
// This file used to hold its own `MAX_ACTIVE_ROMANCES = 4` and its own count
// helper, which held the same number today and would have desynced silently
// the first time either was tuned. One cap, one definition, two doors.

registerEvent({
  id: 'romance-road-spark',
  family: 'romance',
  window: 'journey-out',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'social', 'strategic'],
    relationship: ['romance', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (!romanticCompat(a, b)) return 0;
    if (findOpenThread('romance-spark', [a, b]) || findOpenThread('romance-showmance', [a, b])) return 0;
    if (_activeRomanceCount() >= MAX_ACTIVE_ROMANCES) return 0;
    const bond = getBond(a, b);
    return bond >= 0 ? 1.2 + bond * 0.25 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-road-spark');
    const [a, b] = ctx.actors;
    const sa = pStats(a), sb = pStats(b);
    const scores = {
      'road-spark': (sa.social / 10) * 0.3 + (sb.social / 10) * 0.3 + 0.2,
      'named-it': (sa.boldness / 10) * 0.4 + (sb.boldness / 10) * 0.2,
      'somebody-saw': Math.min(0.5, (ctx.living || []).length / 24) + (sa.social / 10) * 0.2,
      'walked-it-off': (sa.strategic / 10) * 0.3 + (1 - sb.boldness / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'named-it' ? 'said it out loud on the road'
      : branch === 'somebody-saw' ? 'started something on the road with the column watching'
        : branch === 'walked-it-off' ? 'left it on the road rather than pick it up'
          : 'something started between them on the road out';
    const bondDelta = branch === 'named-it' ? 2
      : branch === 'somebody-saw' ? 1 : branch === 'walked-it-off' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // `walked-it-off` opens a TRUST arc rather than a spark, because nothing
    // romantic started and an arc that says one did would be read as one by
    // every romance event downstream. What these two now have is that one of
    // them stepped away from something in front of the other.
    const t = api.openArc(branch === 'walked-it-off' ? 'trust' : 'romance-spark', [a, b],
      { source: sceneWhy,
        seed: lineFor(ROAD_SPARK_LINES[branch], `romance-road-spark|${branch}|${ctx.ep}`, { a, b }) });
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});


// journey-back — the walk home, and the castle getting bigger
// ══════════════════════════════════════════════════════════════════════
//
// THE CLOSER WINDOW. Every event below except the last can end a story, and
// each one ends it with an outcome js/tr/threads.js knows how to read
// (`OUTCOME_SENSE`), so a later event can branch on how it went rather than
// only on whether it happened.

const SETTLED_LINES = {
  held: [
    '{b} answers the thing that’s been between them all day, straight, on the walk home.\n{a}: "So that’s the truth?"\n{b}: "That’s the truth."\n{a}: "Okay. I believe you."',
    '{b} explains {bRef} on the way back.\n{b}: "I wasn’t hiding anything. I was just tired."\n{a}: "Alright. That makes sense."',
    '{a} asks, and {b} answers properly.\n{a}: "So where were you?"\n{b}: "Kitchen, then the fire, then bed. Ask anyone."\n{a}: "Okay. I believe you."\n{a} (to camera): "{b} answered everything. I’m satisfied."',
    '{a} and {b} clear it up on the road.\n{b}: "Are we good?"\n{a}: "We’re good."',
  ],
  dropped: [
    '{a} decides somewhere on the way back that it isn’t worth carrying.\n{a} (to camera): {cam:drop-it}',
    '{a} lets it go on the walk.\n{a}: "Forget it. It doesn’t matter."\n{b}: "You sure?"\n{a}: "I’m sure."',
    '{a} drops the subject.\n{a} (to camera): "Life’s too short. Even in here."',
    '{a} lets {b} off.\n{a}: "I was being paranoid."\n{b}: "You were a bit."\n{a}: "Don’t push it."',
  ],
  soured: [
    'It comes apart on the walk back. {b} says the wrong thing.\n{b}: "Why do you even care?"\n{a}: "Because you lied to me."\n{b}: "I didn’t lie."',
    '{a} and {b} fall out on the road.\n{a}: "I’m done trying with you."\n{b}: "Fine."',
    '{b} gets defensive, and {a} stops pretending.\n{b}: "Why are you always on at me?"\n{a}: "Because you never give me a straight answer."\n{a} (to camera): "That answer told me everything."',
    '{a} and {b} argue all the way home.\n{b}: "You’ve made your mind up."\n{a}: "You made it up for me."',
  ],
  unresolved: [
    '{a} and {b} talk the whole way back and settle nothing.\n{a}: "So we still don’t agree."\n{b}: "Looks like it."',
    '{a} and {b} go round in circles.\n{a}: "So we still disagree."\n{b}: "We still disagree."\n{b} (to camera): "Two miles of talking. Nothing changed."',
    '{a} and {b} can’t settle it.\n{a}: "Let’s leave it."\n{b}: "For now."',
    '{a} and {b} reach the gate no closer.\n{b}: "Are we done?"\n{a}: "For now."\n{a} (to camera): {cam:unsure-info}',
  ],
};

// FOUR BRANCHES, THREE OF THEM CLOSE. This is the single biggest lever on the
// pool's payoff rate: an open trust story between two people who are walking
// home together either gets settled here or is explicitly carried on.
registerEvent({
  id: 'trust-settled-on-the-way-back',
  family: 'trust',
  window: 'journey-back',
  // ACT: CLOSING. Four branches, three of which end a trust story. Settling
  // things belongs to the part of the season that is running out of road.
  acts: { early: 0.7, late: 1.5 },
  advancesThread: true,
  citesResidue: true,
  // The direction is a property of the event on every branch: {a} brings it
  // and {b} is the one whose stats decide what happens to it. Annotated in
  // Task 7 stage 3, alongside the axes.
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'temperament', 'strategic', 'boldness'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // There has to be something to settle. No open trust story, no scene.
    return findOpenThread('trust', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-settled-on-the-way-back');
    const sceneWhy = 'settled it between them on the road back';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const bond = getBond(a, b);
    const holdScore = (st.loyalty / 10) * 0.6 + Math.max(0, bond) / 10 * 0.4;
    const dropScore = (st.temperament / 10) * 0.5 + 0.2;
    const sourScore = (1 - st.loyalty / 10) * 0.5 + (st.strategic / 10) * 0.5;
    const openScore = (1 - st.boldness / 10) * 0.5 + 0.15;
    const total = holdScore + dropScore + sourScore + openScore;
    const roll = rng() * total;
    let branch;
    if (roll < holdScore) branch = 'held';
    else if (roll < holdScore + dropScore) branch = 'dropped';
    else if (roll < holdScore + dropScore + sourScore) branch = 'soured';
    else branch = 'unresolved';

    const line = pronounSlots(pick(rng, SETTLED_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread('trust', [a, b]);
    const bondDelta = branch === 'held' ? 2 : branch === 'soured' ? -2 : branch === 'dropped' ? 0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });

    // The unresolved branch is a real beat and writes one; the other three end
    // the story. `advanceCiting` first, THEN close: the citation has to be
    // written into the last beat or the payoff carries no memory of what it is
    // paying off.
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    let outcome = null;
    if (branch === 'held') outcome = 'passed-clean';
    else if (branch === 'dropped') outcome = 'buried';
    else if (branch === 'soured') outcome = 'turned-back';
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

const LET_IT_GO_LINES = {
  cleared: [
    '{b} answers it properly on the road back, and {a} can’t fault the answer.\n{a}: "That makes sense, actually."\n{b}: "Because it’s true."',
    '{b} explains, and {a} believes it.\n{b}: "That’s all it was. Honestly."\n{a}: "Okay. That makes sense."\n{a} (to camera): "{b} had an answer for everything. A good one."',
    '{a} asks. {b} answers.\n{b}: {say:answer-clean}\n{a}: "Okay. Fair enough."',
    '{b} clears {bPos} name on the walk.\n{b}: "Ask anyone. They’ll tell you the same."\n{a}: "I believe you."',
  ],
  slipped: [
    '{b} talks too much on the long walk, and {a} gets something {b} didn’t mean to give.\n{b}: "—and then I went back up, because—"\n{a}: "Back up? You said you stayed down."\n{b}: "Did I?"',
    '{b} slips up.\n{b}: "I only went down for a minute."\n{a}: "Down? You said you never left your room."\n{a} (to camera): "One little detail. {b} didn’t even notice."',
    '{b} gets {bPos} story muddled.\n{b}: {say:answer-shaky}\n{a}: "That’s not what you said this morning."\n{a} (to camera): {cam:holding-info}',
    '{b} says something that doesn’t match.\n{a}: "That’s not what you said this morning."\n{b}: "Isn’t it?"',
  ],
  hardened: [
    'Nothing about the walk back changes {a}’s mind about {b}, and {b} can tell.\n{b}: "You still don’t believe me."\n{a}: "No."',
    '{a} stays cold with {b} the whole way.\n{b}: "Are you going to talk to me at all?"\n{a}: "I’m listening."\n{b}: "You’re not."\n{b} (to camera): "Whatever I say, {a} has decided."',
    '{a} listens to {b} and isn’t moved.\n{b}: "I’ve explained it three times."\n{a}: "I know. It sounded better the first time."\n{a} (to camera): "Nice try."',
    '{a} doesn’t budge.\n{b}: "What would it take?"\n{a}: "More than that."',
  ],
  'never-raised-it': [
    '{a} opens {aPos} mouth by the second gate and closes it again.\n{b}: "What?"\n{a}: "Nothing. Nice day."',
    '{a} has the whole road to ask {b} about it, and doesn’t ask.\n{a} (to camera): {cam:drop-it}',
    '{a} almost asks, then doesn’t.\n{b}: "Something on your mind?"\n{a}: "No. Nothing."',
    '{a} keeps the question to {aRef}.\n{a} (to camera): "Not today. I’ll ask when it matters."',
  ],
};

registerEvent({
  id: 'susp-let-it-go-on-the-road-back',
  family: 'suspicion',
  window: 'journey-back',
  advancesThread: true,
  citesResidue: true,
  // {a} is the doubter and {b} is the one being asked about all the way home
  // - the direction is the event's, on all three branches.
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['temperament', 'social', 'mental'],
    knowledge: ['witnessed', 'incomplete'],
    alignment: ['faithful', 'original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread('suspicion', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-let-it-go-on-the-road-back');
    const sceneWhy = 'let a suspicion go on the road back';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // The SUSPECTED player is the one under test — how well they hold up over
    // a long walk with nothing to do but be asked about it.
    const clearScore = (st.temperament / 10) * 0.5 + (st.social / 10) * 0.5;
    const slipScore = (1 - st.temperament / 10) * 0.6 + (1 - st.mental / 10) * 0.4;
    const hardenScore = 0.45;
    // A FOURTH OUTCOME, and the only one that reads the DOUBTER rather than
    // the suspected: {a} had the road and did not use it. Cautious players
    // do this constantly and the event could not say so.
    const sa = pStats(a);
    const unaskedScore = (1 - sa.boldness / 10) * 0.4 + (sa.strategic / 10) * 0.2;
    const total = clearScore + slipScore + hardenScore + unaskedScore;
    const roll = rng() * total;
    let branch;
    if (roll < clearScore) branch = 'cleared';
    else if (roll < clearScore + slipScore) branch = 'slipped';
    else if (roll < clearScore + slipScore + hardenScore) branch = 'hardened';
    else branch = 'never-raised-it';

    const line = pronounSlots(pick(rng, LET_IT_GO_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread('suspicion', [a, b]);
    const bondDelta = branch === 'cleared' ? 2 : branch === 'slipped' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    // ── TWO STORED ACCOUNTS, OR NOBODY CONTRADICTED ANYBODY ─────────────
    //
    // "The walk back went on long enough that {b} contradicted themselves, and
    // {a} was still listening" is the causal contract's named forbidden case:
    // `Gabby catches Julia changing her story` is invalid unless two
    // incompatible stored claims exist and the observer knows both. This branch
    // asserted it off `pStats(b).temperament` alone and wrote nothing.
    //
    // Both accounts are minted HERE because here is where both were spoken —
    // the whole branch is one long conversation in which `b` gives an account
    // and then gives a different one. `contradicts` is DECLARED (scene-api
    // refuses an id that is not on the record), and `a` is the listener on
    // both, so `a` is the only person entitled to cite either.
    if (branch === 'slipped') {
      const first = api.recordClaim(b, `${b}'s account of the afternoon, given early on the road`,
        { listeners: [a], channel: 'conversation', source: sceneWhy });
      api.recordClaim(b, `${b}'s account of the afternoon, given again nearer the gate`,
        { listeners: [a], channel: 'conversation', contradicts: [first.id],
          source: `${b} gave two accounts of the same hours on one walk` });
    }
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    const outcome = branch === 'cleared' ? 'denied-convincingly'
      : branch === 'slipped' ? 'confessed-unrelated' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    // The walk moves a's HUNCH about b (shown as a labelled read chip) and the
    // bond — it does not write the belief board. The vote stays on hard evidence.
    // THE CONCRETE SUBJECT is the suspect being walked home: {b}, the person
    // {a} spent the road asking about. The composer closes on the doubt about
    // {b} by name.
    return { branch, pair: [a, b], topic: b, topicKind: 'road-suspect-walk',
      threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

const STORY_SURVIVED_LINES = {
  held: [
    '{a} comes through the gate with {topic} exactly as it left.\n{a} (to camera): "Nobody touched it. I’ll take that."',
    'A whole day out of the castle and nobody catches {a} out on {topic}.\n{a} (to camera): {cam:story-fine}',
    '{a}’s story about {topic} is still holding at the gate.\n{a} (to camera): {cam:story-fine}',
    '{a} gets through the day with {topic} intact.\n{a} (to camera): "Nobody laid a finger on it."',
  ],
  frayed: [
    '{a} gets asked about {topic} twice and answers slightly differently each time.\n{a} (to camera): "Close enough. I hope."',
    '{a} has to patch the story about {topic} twice on the road.\n{a} (to camera): {cam:story-close}',
    '{a}’s account of {topic} wobbles on the way home.\n{a} (to camera): "Two patches. Neither of them clean."',
    '{a} fumbles a question about {topic}.\n{a} (to camera): {cam:story-close}',
  ],
  // THE ACCOUNT COMES APART, NOT THE PERSON. This branch closes the cover
  // THREAD with `exposed`, and a sentence implying the room now knows what
  // {a} is would be the engine claiming a fact no belief anywhere holds -
  // castle events write zero beliefs, so nobody in the castle learned
  // anything here except that one story stopped working.
  broke: [
    '{a} hears {aRef} contradict {aRef} about {topic}, out loud, on the road.\n{a} (to camera): "That’s going to come up at the table. I know it is."',
    'Somebody asks the one question about {topic} on the road back, and {a} has no matching answer.\n{a} (to camera): {cam:story-close}',
    '{a}’s story about {topic} falls apart on the walk.\n{a} (to camera): "That’s it. That’s the question I couldn’t answer."',
    '{a} gets caught out on {topic}.\n{a} (to camera): {cam:story-close}',
  ],
  'nobody-asked': [
    '{a} waits all day for a question about {topic}, and it never comes.\n{a} (to camera): {cam:story-fine}',
    '{a} carries a full account of {topic} all the way home, and nobody asks for a word of it.\n{a} (to camera): {cam:story-fine}',
    'Nobody mentions {topic} all day.\n{a} (to camera): {cam:invisible}',
    '{a} had the answers ready. Nobody wanted them.\n{a} (to camera): "All that preparation for nothing. Good."',
  ],
};

registerEvent({
  id: 'cover-story-survived-the-day',
  family: 'cover',
  window: 'journey-back',
  threadScope: 'solo',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['social', 'strategic', 'temperament', 'mental'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    return findOpenThread('cover', [actor]) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-story-survived-the-day');
    const sceneWhy = 'their account of the night lasted the whole day';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    const holdScore = (st.strategic / 10) * 0.5 + (st.temperament / 10) * 0.5;
    const frayScore = 0.5;
    const breakScore = (1 - st.mental / 10) * 0.5 + (1 - st.temperament / 10) * 0.5;
    // A FOURTH OUTCOME, and the only one where the day does nothing to the
    // story at all: nobody asks a liked player anything. It is the branch a
    // Traitor most wants and least enjoys, and no other fork here reads
    // `social` -- the three above are all about how well the account holds
    // once it is under pressure.
    const unaskedScore = (st.social / 10) * 0.45;
    const total = holdScore + frayScore + breakScore + unaskedScore;
    const roll = rng() * total;
    let branch;
    if (roll < holdScore) branch = 'held';
    else if (roll < holdScore + frayScore) branch = 'frayed';
    else if (roll < holdScore + frayScore + breakScore) branch = 'broke';
    else branch = 'nobody-asked';

    const victim = _lastMurdered();
    const topic = victim ? `the night ${victim} was murdered` : 'what happened on the mission';
    const line = pronounSlots(pick(rng, STORY_SURVIVED_LINES[branch]), { a: actor })
      .replace(/\{a\}/g, actor).replace(/\{topic\}/g, topic);
    const thread = findOpenThread('cover', [actor]);
    // ── "AN ANSWER THAT MATCHED THE LAST ONE" NEEDS A LAST ONE ──────────
    //
    // The `broke` branch's own words are "Somebody asked the one question on
    // the road back, and {a} did not have an answer that matched the last one."
    // The last one was stored nowhere, so nothing in the season could say what
    // it had been or who had heard it. Both accounts are now on the record with
    // the second declared incompatible with the first, and the person walking
    // beside them is the listener — which is also who the bond penalty below
    // is applied to, so the sentence, the receipt and the consequence all name
    // the same person.
    const heardIt = ctx.actors.find(n => n !== actor);
    if (branch === 'broke' && heardIt) {
      const first = api.recordClaim(actor, `${actor}'s account of the night, as first given`,
        { listeners: [heardIt], channel: 'conversation', source: sceneWhy });
      api.recordClaim(actor, `${actor}'s account of the night, as given again on the road back`,
        { listeners: [heardIt], channel: 'conversation', contradicts: [first.id],
          source: `${actor} could not repeat their own account the same way twice` });
    }
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    // A cover story that held is retired clean; one that came apart in front
    // of people is `exposed`, which reads as `cracked` to anything downstream.
    const outcome = branch === 'held' ? 'passed-clean' : branch === 'broke' ? 'exposed' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    // The Traitor whose story broke in the open loses standing with whoever
    // walked back beside them — the one observable consequence available here
    // without touching a belief.
    let bondDelta = 0;
    const witness = ctx.actors.find(n => n !== actor);
    if (witness && branch === 'broke') { bondDelta = -1.5; api.addBond(actor, witness, bondDelta,
      { source: sceneWhy }); }
    return { branch, actor, topic, topicKind: 'road-cover-back', threadId: thread.id, cited, note, outcome, witness: witness || null, bondDelta };
  },
});

const CASTLE_IN_VIEW_LINES = {
  buried: [
    '{a} and {b} talk about the ones who are gone the whole way back.\n{b}: "I still expect to see them at dinner."\n{a}: "Me too."',
    '{a} and {b} remember the people who have left.\n{a}: "Remember the first walk? All of us?"\n{b}: "Feels like a year ago."',
    '{a} and {b} say everything there is to say about who has gone.\n{a}: "I miss the noise."\n{b}: "I miss the people making it."\n{b} (to camera): {cam:few-left}',
    '{a} and {b} share memories of the missing.\n{a}: "I miss the noise."\n{b}: "I miss the people making it."',
  ],
  carried: [
    'The castle comes back into view, and {a} feels it all land again.\n{a}: "I don’t want to go back in."\n{b}: "I know."',
    '{a} slows down as the castle appears.\n{b}: "Alright?"\n{a}: "Just give me a second."',
    '{a} stops at the top of the hill.\n{a} (to camera): {cam:homesick}',
    '{a} sees the castle and goes quiet.\n{b}: "Same."\n{a}: "Back in, then."',
  ],
  // ── TWO BRANCHES ADDED (Task 7 stage 3) ──────────────────────────────
  //
  // The audit's verdict on this event was REWRITE for a specific reason: two
  // branches is short of four materially different paths, and the two it had
  // were the same scene with the volume turned up and down (they put it down,
  // or they did not). The two below are different ACTIONS, which is the bar:
  // one of them refuses to have the conversation at all, and one of them ends
  // it by turning it into an argument about who is left.
  'talked-past-it': [
    '{a} starts on the ones who are gone, and {b} changes the subject twice.\n{a}: "Do you miss—"\n{b}: "What’s for dinner, do you reckon?"',
    '{b} won’t talk about who has left.\n{b}: "Not today."\n{a}: "You can be sad, you know."\n{a} (to camera): "{b} doesn’t do sad. Or doesn’t do it in front of me."',
    '{b} steers the conversation away.\n{b}: "Let’s talk about something nice."\n{a}: "Like what?"\n{b}: "Anything. Dinner. Dogs. Anything."',
    '{a} tries, {b} deflects.\n{a}: "Do you miss them?"\n{b}: "Look, a deer."\n{a} (to camera): {cam:unsure-info}',
  ],
  'turned-sharp': [
    'Near the gate, it stops being about the ones who have gone and starts being about who’s still here.\n{a}: "One of the people walking in front of us did this."\n{b}: "I know."',
    '{a} turns grief into suspicion.\n{a}: "Somebody in there is enjoying this."\n{b}: "Who?"',
    '{a} and {b} get serious by the gate.\n{b}: "Who benefits from them being gone?"\n{a}: "That’s the question."',
    '{a} stops mourning and starts counting.\n{a} (to camera): {cam:watching}',
  ],
};

registerEvent({
  id: 'grief-castle-in-view',
  family: 'grief',
  window: 'journey-back',
  // ACT: CLOSING. This event buries or carries a grief thread on the road
  // home — thread-closing, which spec 5.4.3 puts in the back half.
  acts: { early: 0.6, late: 1.5 },
  advancesThread: true,
  citesResidue: true,
  // The direction is a property of the event: {a} is the one carrying it and
  // {b} is the one who has to answer that. Annotated as part of the stage-3
  // rewrite, which is when the direction became a decision rather than an
  // accident of which name the sentence happened to end on.
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'loyalty', 'social', 'strategic'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread('grief', ctx.actors) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-castle-in-view');
    const sceneWhy = 'the castle came back into view';
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const stB = pStats(b);
    // Whether a person can put a death down is temperament and how much of it
    // they were carrying to begin with. The two branches added in stage 3 fork
    // on the OTHER person instead, because both of them are things {b} does to
    // the conversation rather than things {a} feels about it.
    const buryScore = (st.temperament / 10) * 0.6 + 0.2;
    const carryScore = (st.loyalty / 10) * 0.5 + (1 - st.temperament / 10) * 0.5;
    const deflectScore = (1 - stB.social / 10) * 0.4 + (stB.temperament / 10) * 0.3;
    const sharpScore = (stB.strategic / 10) * 0.4 + (1 - stB.loyalty / 10) * 0.3;
    const total = buryScore + carryScore + deflectScore + sharpScore;
    let roll = rng() * total;
    let branch;
    if (roll < buryScore) branch = 'buried';
    else if (roll < buryScore + carryScore) branch = 'carried';
    else if (roll < buryScore + carryScore + deflectScore) branch = 'talked-past-it';
    else branch = 'turned-sharp';

    const line = pronounSlots(pick(rng, CASTLE_IN_VIEW_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread('grief', [a, b]);
    const bondDelta = branch === 'buried' ? 1.5
      : branch === 'carried' ? 1 : branch === 'talked-past-it' ? -0.5 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    // TWO TERMINAL OUTCOMES NOW, NOT ONE. `buried` is the story put down
    // together; `turned-sharp` ends it the other way — the mourning stops
    // being mourning and the arc is closed as one that turned back on itself,
    // which is a resolution and not a reconciliation. The middle two carry on.
    const outcome = branch === 'buried' ? 'buried'
      : branch === 'turned-sharp' ? 'turned-back' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

// FOUR BRANCHES, REWRITTEN IN TASK 7 STAGE 3. The audit's verdict was
// REWRITE and the reason was exact: this event had ONE branch
// (`walked-back-together`) and its fork was entirely in the wording, so five
// sentences described the same unchanging beat and the couple's story could
// only ever get warmer. What a long walk actually does to two people who are
// in something is not one thing — it is easy, or it is watched, or it gets
// said out loud, or the day puts something between them — and those are four
// different actions with four different consequences.
const WALKED_BACK_LINES = {
  easy: [
    '{a} and {b} are the last two through the gate, walking slowly.\n{b}: "We should hurry."\n{a}: "Should we?"\n{b}: "No."',
    '{a} and {b} dawdle on purpose.\n{b}: "We should hurry."\n{a}: "Should we, though?"\n{a} (to camera): "Longest walk home ever. Didn’t mind at all."',
    '{a} and {b} take their time.\n{b}: "I like walking with you."\n{a}: "I like it too."',
    '{a} and {b} fall behind, laughing.\n{a}: "They’ll think we’ve got lost."\n{b}: "Let them."\n{b} (to camera): "Best part of the day, that."',
  ],
  watched: [
    'Somebody holds the gate for {a} and {b} longer than expected.\n{b}: "Everyone’s staring."\n{a}: "Let them."',
    '{a} and {b} arrive to raised eyebrows.\n{b}: "Why’s everyone staring?"\n{a}: "Because we came back together. Again."\n{a} (to camera): "They’ve all noticed. Of course they have."',
    '{a} and {b} walk in together, and the courtyard notices.\n{b}: "So much for subtle."\n{a}: "We were never subtle."',
    '{a} and {b} get looks at the gate.\n{a}: "Walk in separately next time?"\n{b}: "No chance."\n{b} (to camera): "Everyone saw us come back together. That’ll be a conversation."',
  ],
  'said-out-loud': [
    'Somewhere on the road home one of them says it.\n{a}: "I like you. Properly."\n{b}: "I like you too."',
    '{a} and {b} stop calling it nothing.\n{b}: "So this is a thing."\n{a}: "It’s a thing."',
    '{a} and {b} admit it on the way home.\n{b}: "So we’re saying it."\n{a}: "We’re saying it."\n{a} (to camera): "We said it. Out loud. No going back."',
    '{b} says it first.\n{b}: "I think about you a lot."\n{a}: "Good. Me too."',
  ],
  strained: [
    'The road home does {a} and {b} no favours, and by the gate they’re walking a yard apart.\n{a}: "Something wrong?"\n{b}: "No."',
    '{a} and {b} have an awkward walk back.\n{a}: "Did I do something?"\n{b}: "No. I’m just tired."\n{b} (to camera): "It was weird. I don’t know what changed."',
    '{a} and {b} barely talk on the way home.\n{a}: "You’re quiet."\n{b}: "Tired."',
    '{a} and {b} drift apart on the walk.\n{a}: "You’re miles away."\n{b}: "Am I? Sorry."\n{a} (to camera): {cam:unsure-info}',
  ],
};

// RARE, AND DECLARED (spec §5.4.1). The precondition is a spark that already
// exists, and the pool holds very few — an event gated on a rare state and
// weighted like a common one is content nobody ever sees. This is the same
// omission that starved seven romance events in Plan 4.
registerEvent({
  id: 'romance-walked-back-together',
  family: 'romance',
  window: 'journey-back',
  rare: true,
  // NO `advancesThread`, DELIBERATELY, and the reason is the one Plan 5's
  // second amendment turns on: the flag is read by guard 1 as
  // `findOpenThread(ev.family, actors)` — family `romance` — and the thread
  // this event actually advances is of kind `romance-spark` or
  // `romance-showmance`. Declaring it here would buy a 4x-9x multiplier that
  // never fires, i.e. a label rather than a behaviour, which is exactly what
  // the amendment measured and withdrew. The event still advances a real
  // thread; guard 1 simply cannot see it.
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // Same lookup, same reason as `romance-showmance-on-the-way-back` above.
    return _threadForActors('romance-showmance', ctx.actors)
      || _threadForActors('romance-spark', ctx.actors) ? 2 : 0;
  },
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['social', 'boldness', 'temperament', 'loyalty'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-walked-back-together');
    const sceneWhy = 'walked back together';
    const kind = _threadForActors('romance-showmance', ctx.actors) ? 'romance-showmance' : 'romance-spark';
    const thread = _threadForActors(kind, ctx.actors);
    const [a, b] = thread.parties;
    const st = pStats(b);
    // A pair still hiding it is watched; a pair who have stopped hiding it can
    // say it. So the branch weights read the arc's own kind as well as the
    // person — which is the relationship axis doing mechanical work rather
    // than choosing an adjective.
    const declared = kind === 'romance-showmance';
    const easyScore = (st.social / 10) * 0.4 + (st.loyalty / 10) * 0.3;
    const watchedScore = (1 - st.boldness / 10) * 0.4 + (declared ? 0.05 : 0.35);
    const saidScore = (st.boldness / 10) * 0.4 + (declared ? 0.3 : 0.1);
    const strainScore = (1 - st.temperament / 10) * 0.4 + 0.1;
    const total = easyScore + watchedScore + saidScore + strainScore;
    let roll = rng() * total;
    let branch;
    if (roll < easyScore) branch = 'easy';
    else if (roll < easyScore + watchedScore) branch = 'watched';
    else if (roll < easyScore + watchedScore + saidScore) branch = 'said-out-loud';
    else branch = 'strained';

    const bondDelta = branch === 'easy' ? 2
      : branch === 'said-out-loud' ? 2.5 : branch === 'watched' ? 0.5 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, WALKED_BACK_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const advanced = api.advanceArc(thread.id, line, { source: sceneWhy });
    return { branch, pair: [a, b], kind,
      threadId: advanced?.id ?? thread.id, bondDelta };
  },
});

// FOUR BRANCHES, REWRITTEN IN TASK 7 STAGE 3, AND THREE OF THEM STILL
// ESCALATE. The audit's verdict was REWRITE for the usual reason - one branch,
// with the fork in the wording - but this event has a job the others do not
// (see the note below: it is the second door a spark has to become a
// showmance, and every downstream romance event is a function of how often
// that door opens). So the rewrite is deliberately asymmetric: `told-them`,
// `walked-in-holding` and `agreed-quietly` are three genuinely different
// actions that all end the spark and open a showmance, and `not-yet` is the
// fourth, which is what it looks like when the road nearly does it and does
// not. `not-yet` is weighted as the minority branch on purpose - turning a
// quarter of this event's firings into non-escalations would cost
// `romance-liability-exposed` the state it needs, which is the exact
// starvation this event was built to undo.
const CAME_BACK_HOLDING_LINES = {
  'walked-in-holding': [
    '{a} and {b} walk through the gate together, and neither steps away.\n{a}: "They’ve seen."\n{b}: "Good."',
    '{a} and {b} come back through the gate holding hands.\n{b}: "People are looking."\n{a}: "Good."',
    '{a} and {b} walk into the courtyard hand in hand.\n{b}: "People are looking."\n{a}: "Good."\n{a} (to camera): "No point hiding it now."',
    '{a} and {b} don’t let go at the gate.\n{a}: "You can let go now."\n{b}: "I don’t want to."\n{b} (to camera): "Let them look. I don’t care any more."',
  ],
  'told-them': [
    '{a} lets it slip to one person on the walk home.\n{b}: "Who else knows?"\n{a}: "…A few people."',
    '{a} tells somebody on the road back, and by the gate three people know.\n{b}: "You told them?"\n{a}: "I couldn’t help it."',
    '{a} can’t keep it quiet.\n{b}: "Who did you tell?"\n{a}: "Just one person. Maybe two."\n{b} (to camera): "{a} told half the castle before we got home."',
    '{a} spills it on the walk.\n{b}: "So much for keeping it secret."\n{a}: "Sorry. Not sorry."',
  ],
  'agreed-quietly': [
    '{a} and {b} slow down at the gate so they come in last.\n{b}: "So that’s settled."\n{a}: "That’s settled."',
    '{a} and {b} settle it between them on the last mile.\n{a}: "Just us know. For now."\n{b}: "Just us."',
    '{a} and {b} make it official, privately.\n{a}: "Just us know."\n{b}: "Just us."\n{b} (to camera): "Nobody else needs to know. Yet."',
    '{a} and {b} agree quietly.\n{a}: "We’re a thing, then?"\n{b}: "We’re a thing."',
  ],
  'not-yet': [
    '{a} almost says it at the gate and lets go of {b}’s sleeve instead.\n{b}: "What were you going to say?"\n{a}: "Nothing. Tomorrow."\n{b} (to camera): "Nearly. Tomorrow, maybe."',
    '{a} and {b} nearly say it on the road home, and put it down at the gate.\n{a}: "Later."\n{b}: "Later."',
    '{a} and {b} almost admit it.\n{a}: "I think I—"\n{b}: "Not here."\n{a} (to camera): "So close. Not yet."',
    '{a} and {b} stop just short.\n{b}: "Not here. Not with everyone watching."\n{a}: "Later, then."',
  ],
};

// THE SECOND DOOR ON ESCALATION, and the fix for R2's worst casualty.
//
// `romance-showmance-forms` (romance.js, `evening`) is the ONLY way a spark
// becomes a showmance, and EVERY event downstream of a showmance is therefore
// a function of how many draws `evening` gets. When this task took 22% of
// them, `romance-liability-exposed` - the family's flagship - held at 21
// firings per 400 seasons but split them across four branches, and its
// `exposes` branch fell to 2, under the reachability floor. Reweighting it in
// `after-table` would only have starved its neighbours, and it cannot be
// relocated: its own prose has the doubter standing up AT THE TABLE.
//
// So the fix is upstream and structural, the same shape as `romance-road-spark`
// one window earlier: a second escalation door in a window that is not
// contested. It moves nothing about `romance-liability-exposed` except how
// often the state it needs exists at all.
//
// IT IS ALSO A CLOSER. `became-showmance` retires the spark thread, so this
// costs the cap nothing (one open romance thread becomes one open romance
// thread) and pays into the metric this task exists to move.
registerEvent({
  id: 'romance-showmance-on-the-way-back',
  family: 'romance',
  window: 'journey-back',
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // `_threadForActors`, NOT `findOpenThread` — imported from romance.js, and
    // the difference is the whole reachability of this event. A party-exact
    // lookup asks the runner to redraw one specific pair, which at a 20-person
    // cast happens about once in 300 draws; romance.js measured ZERO
    // escalations across 60 seasons that way before it was fixed there. This
    // asks whether EITHER person in the scene is in a spark, and takes the
    // real partner from the thread. First version of this event shipped with
    // the exact form and drew 21 firings per 400 seasons for it.
    const t = _threadForActors('romance-spark', ctx.actors);
    // A still-warm spark, the same precondition `romance-showmance-forms`
    // applies: a day out of the castle escalates something live, not something
    // that fizzled three rounds ago. And not one struck this morning either -
    // see F7 on the twin in romance.js.
    return t && ctx.ep > t.openedEp && heatAt(t, ctx.ep) > 0 ? 2.5 : 0;
  },
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['boldness', 'social', 'temperament', 'loyalty'],
    relationship: ['romance'],
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'romance-showmance-on-the-way-back');
    const sceneWhy = 'stopped hiding it on the road back';
    const spark = _threadForActors('romance-spark', ctx.actors);
    const [a, b] = spark.parties;
    const st = pStats(a);
    const stB = pStats(b);
    // HOW two people stop hiding it: the loud one walks in holding on, the
    // sociable one tells somebody, the private pair settle it between
    // themselves, and the one who cannot get the sentence out does not.
    const holdScore = (st.boldness / 10) * 0.5 + (stB.boldness / 10) * 0.3;
    const tellScore = (st.social / 10) * 0.5 + (stB.social / 10) * 0.25;
    const quietScore = (1 - st.social / 10) * 0.45 + (st.loyalty / 10) * 0.3;
    // The minority branch, deliberately capped low - see the note above the
    // line pools. At these weights it takes roughly one firing in eight.
    const notYetScore = (1 - st.boldness / 10) * 0.22 + 0.05;
    const total = holdScore + tellScore + quietScore + notYetScore;
    let roll = rng() * total;
    let branch;
    if (roll < holdScore) branch = 'walked-in-holding';
    else if (roll < holdScore + tellScore) branch = 'told-them';
    else if (roll < holdScore + tellScore + quietScore) branch = 'agreed-quietly';
    else branch = 'not-yet';

    const note = pronounSlots(pick(rng, CAME_BACK_HOLDING_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    if (branch === 'not-yet') {
      // The spark survives, one beat warmer and no further along. This is the
      // event's only non-escalating path and it writes a real beat, so the
      // silence floor is satisfied and the story is still open tomorrow.
      const advanced = api.advanceArc(spark.id, note, { source: sceneWhy });
      api.addBond(a, b, 0.5, { source: sceneWhy });
      return { branch, pair: [a, b], threadId: advanced?.id ?? spark.id,
        outcome: null, bondDelta: 0.5 };
    }
    api.resolveArc(spark.id, 'became-showmance', { source: sceneWhy });
    const bondDelta = branch === 'agreed-quietly' ? 1.5 : 2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc('romance-showmance', [a, b], { source: sceneWhy, seed: note });
    return { branch, pair: [a, b], threadId: t?.id,
      outcome: 'became-showmance', bondDelta };
  },
});

// Nothing below this line: `night` events live with their families, because
// night is a room in the castle and the road is not.
export const JOURNEY_WINDOWS = ['journey-out', 'journey-back'];

// ══════════════════════════════════════════════════════════════════════
// FOUR MORE FOR THE ROAD OUT — the window the library forgot
// ══════════════════════════════════════════════════════════════════════
//
// `journey-out` held EIGHT events against thirty-one in `evening` and
// twenty-six in `after-table`, and seven of the eight families had exactly
// ONE event in it. That is the eligible-event exhaustion the plan's own Task 5
// ruling measured in `journey-back` and `night` — both of which were then
// filled, while this one was not. A phase cannot spend a scene budget it has
// no eligible events for, so a starved window caps density everywhere.
//
// TWO OF THESE ARE FAMILIES THE WINDOW HAD NONE OF. `callback` and
// `confrontation` never fired on the road, which meant the walk out could
// never carry a piece of history or an argument — the two things a private
// hour away from the castle is most obviously for.
//
// AND EVERY ONE READS STORED STATE, which is the plan's demand of a callback:
// "reads stored history rather than matching a name". The road event that
// raises something reads an OPEN THREAD and its prior days; the argument reads
// last night's ACCUSATIONS; the column reads the bond graph; the favour reads
// who is carrying what. None of them invents a past.

const ROAD_RAISE_LINES = {
  // They bring it up, out here, where the castle cannot hear it.
  'said-it-out-there': [
    '{a} lets a mile go by, then asks the question {aSub} came out here to ask.\n{a}: "About the other day. Did you mean it?"\n{b}: "Yes. I did."',
    '{a} raises the old thing on the road.\n{a}: "We never talked about it properly."\n{b}: "No. Go on, then."',
    '{a} finally brings it up.\n{a}: "I need to ask you something, and I need a straight answer."\n{b}: "Alright."',
    '{a} asks, away from the castle.\n{a} (to camera): "Out here, nobody can overhear. So I asked."',
  ],
  // Raised, and put back down again without an answer.
  'let-it-lie': [
    '{a} carries it the whole way out, and the whole way back.\n{a} (to camera): {cam:drop-it}',
    '{a} almost says it, twice.\n{b}: "What?"\n{a}: "Nothing. Doesn’t matter."',
    '{a} decides not to bring it up.\n{a} (to camera): "Not worth ruining a nice walk over."',
    '{a} keeps quiet about it.\n{a} (to camera): {cam:holding-info}',
  ],
  // It goes badly: the old thing is worse for being handled.
  'reopened-it': [
    '{a} means to settle it, and makes it worse.\n{a}: "I just want to understand."\n{b}: "You want to win the argument."\n{a}: "That’s not fair."',
    '{a} brings it up and it blows up.\n{b}: "Why are we doing this again?"\n{a}: "Because you never answered."',
    '{a} and {b} are back where they started.\n{b}: "We sorted this."\n{a}: "You sorted it. I let it go. It came back."\n{b} (to camera): "{a} just can’t let it go."',
    '{a} reopens the wound.\n{b}: "I thought we were past this."\n{a}: "So did I."',
  ],
  // Or it closes: the road ends the story.
  'put-it-down': [
    '{a} and {b} leave it in a field, which is a better place for it than the castle.\n{a}: "Done?"\n{b}: "Done."',
    '{a} and {b} finally clear the air.\n{b}: "I’m sorry about the other day."\n{a}: "Me too."',
    '{a} and {b} put the old thing to rest.\n{a}: "Done with it?"\n{b}: "Done with it."\n{a} (to camera): "Feels lighter. Honestly."',
    '{a} and {b} shake on it on the track.\n{b}: "Fresh start?"\n{a}: "Fresh start."',
  ],
};

// RAISING AN OLD THING WHERE THE CASTLE CANNOT HEAR IT.
//
// FILED UNDER `trust`, AND THE FIRST DRAFT GOT THAT WRONG. It was written as a
// `callback`, on the reasoning that it brings up the past — and
// tests/tr-castle-reachability.test.js caught it inside one run: that family
// means FRANCHISE history, and the suite carries a deliberate invariant that
// callback fires ZERO times in a debut season, so "a green run is never
// mistaken for 'callback works in season one'". This event reads an IN-SEASON
// thread, so it fired 113 times on an empty ledger and broke a documented
// property of the pool.
//
// The invariant was right and the filing was wrong. What this scene actually
// is, is two people with a story between them raising it on a private road —
// which is trust, continued. The distinction from `trust-fall-into-step` is
// the precondition: that one is the conversation a walk produces, this one
// requires a thread with a DAY already behind it (`priorMoments`), and cites
// it rather than describing a past in general terms.
registerEvent({
  id: 'trust-raised-it-on-the-road',
  family: 'trust',
  window: 'journey-out',
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['boldness', 'temperament', 'loyalty', 'social'],
    relationship: ['close-ally', 'neutral', 'prior-history'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // THE HISTORY HAS TO EXIST. No open thread between them, or one with no
    // day behind it, and there is nothing to raise — a scene that "brings up
    // the past" with no past on the record is the vague-callback defect the
    // whole grounding pass was about.
    const t = findOpenThread('callback', [a, b]) || findOpenThread('trust', [a, b])
      || findOpenThread('suspicion', [a, b]);
    if (!t) return 0;
    if (!priorMoments(t, ctx.ep).length) return 0;
    // WEIGHTED TO SUPPLEMENT, NOT TO TAKE OVER. Four events entering a
    // window that held six is a 60%% increase in weight, and the phase
    // budget does not grow to match — so every existing event fires less.
    // Measured: `cover-swap-story-with-partner:were-together-anyway` fell
    // to 34 firings against tr-castle-prose's variety floor of 40. These
    // weights are set below the window's typical 2.5 for that reason.
    return 1.4 + Math.min(0.8, heatAt(t, ctx.ep));
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-raised-it-on-the-road');
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const sb = pStats(b);
    const scores = {
      // Saying it needs nerve and a reason to bother.
      'said-it-out-there': (st.boldness / 10) * 0.5 + (st.social / 10) * 0.3,
      // Letting it lie is what a careful person does with a private hour.
      'let-it-lie': (1 - st.boldness / 10) * 0.55 + 0.15,
      // It reopens when the person answering cannot leave it alone.
      'reopened-it': (1 - sb.temperament / 10) * 0.5 + (st.boldness / 10) * 0.2,
      // And it closes when both of them would rather it did.
      'put-it-down': (sb.temperament / 10) * 0.35 + (st.loyalty / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'let-it-lie';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'said-it-out-there' ? 'raised it on the road, away from the castle'
      : branch === 'reopened-it' ? 'reopened an old argument on the road out'
        : branch === 'put-it-down' ? 'settled an old thing on the road out'
          : 'nearly raised it on the road and did not';
    const bondDelta = branch === 'put-it-down' ? 2
      : branch === 'said-it-out-there' ? 1
        : branch === 'reopened-it' ? -2.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, ROAD_RAISE_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, line, { source: sceneWhy });
    // A thing put down on the road is a thing the castle does not carry back.
    // 'buried' is the pool's own word for a story that ended where it was had —
    // trust-fall-into-step resolves its terminal road branch the same way.
    if (thread && branch === 'put-it-down') {
      api.resolveArc(thread.id, 'buried', { source: sceneWhy });
    }
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

const ROAD_ARGUMENT_LINES = {
  // It carries over from the table and does not wait for the mission.
  'straight-back-into-it': [
    '{a} gets about four hundred yards before last night comes out again.\n{a}: "And another thing about last night—"\n{b}: "Here we go."',
    '{a} and {b} pick up the row where they left it.\n{b}: "Can we not do this now?"\n{a}: "When, then?"',
    '{a} can’t let last night go.\n{a}: "You embarrassed me."\n{b}: "You embarrassed yourself."',
    '{a} and {b} start arguing before they’re out of sight of the castle.\n{a}: "About last night—"\n{b}: "We’re not even out of the gate."\n{b} (to camera): "Four hundred yards. That’s all it took."',
  ],
  // Held, in public, in front of a walking column.
  'in-front-of-everybody': [
    'It happens in the open, on a track, with no walls to take it behind.\n{a}: "Don’t you dare."\n{b}: "Or what?"\nEveryone stops walking.',
    '{a} and {b} argue in front of the whole group.\n{b}: "Say it to my face!"\n{a}: "I am saying it to your face!"\n{a} (to camera): "Probably shouldn’t have done that in front of everyone."',
    '{a} and {b} have a shouting match on the road.\n{b}: "Say it to my face, then!"\n{a}: "I am!"',
    'The whole column watches {a} and {b} row.\n{a}: "You lied to me!"\n{b}: "Keep your voice down!"\n{b} (to camera): "Everyone saw. Great."',
  ],
  // Somebody steps in and it stops.
  'somebody-stepped-in': [
    'It’s going somewhere bad until a third voice stops it.\n{a}: "You’re a liar."\n{b}: "Say that again—"\nSomebody further up the track tells them both to pack it in, and they do.',
    '{a} and {b} get louder, and someone gets between them.\n{a}: "You’re a liar."\n{b}: "Say that again—"\n{a} (to camera): "Probably a good thing somebody stopped us."',
    'Somebody steps in before {a} and {b} say something they can’t take back.\n{b}: "Fine. Fine."\n{a}: "Fine."',
    'Another player pulls {a} away from {b} by the arm.\n{a}: "I wasn’t finished."\n{b}: "Yes, you were."',
  ],
  // Or it does not happen at all, and the not-happening is the scene.
  'swallowed-it': [
    '{a} says nothing to {b} for six miles, and means every word of it.\n{b} (to camera): "The silent treatment. For six miles."',
    '{a} ignores {b} the whole walk.\n{b}: "Are you going to talk to me?"\n{a}: "No."',
    '{a} bites {aPos} tongue all the way.\n{a} (to camera): "If I’d opened my mouth, I’d have said too much."',
    '{a} walks ahead of {b} in silence.\n{a} (to camera): {cam:alone-choice}',
  ],
};

// THE OTHER MISSING FAMILY. A confrontation reads last night's PUBLIC record —
// who accused whom at the table — so the argument on the road is the argument
// the room already heard, continued where the host is not standing.
registerEvent({
  id: 'confront-it-starts-on-the-road',
  family: 'confrontation',
  window: 'journey-out',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['boldness', 'temperament', 'strategic'],
    relationship: ['rival', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // LAST NIGHT'S TABLE, AND ONLY THAT. An argument on the road out is the
    // argument the room already had; without a public accusation between these
    // two there is nothing to carry, and inventing one would hand the walk a
    // grievance the record does not contain.
    const round = (gs.tr?.rounds || []).filter(r => r.ep === ctx.ep - 1).pop();
    if (!round) return 0;
    const said = (round.accusations || []).some(x =>
      (x.accuser === a && x.target === b) || (x.accuser === b && x.target === a));
    if (!said) return 0;
    // And people who like each other do not carry it onto the road.
    // WEIGHTED TO SUPPLEMENT, NOT TO TAKE OVER. Four events entering a
    // window that held six is a 60%% increase in weight, and the phase
    // budget does not grow to match — so every existing event fires less.
    // Measured: `cover-swap-story-with-partner:were-together-anyway` fell
    // to 34 firings against tr-castle-prose's variety floor of 40. These
    // weights are set below the window's typical 2.5 for that reason.
    return getBond(a, b) <= 1 ? 1.8 : 0.6;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-it-starts-on-the-road');
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const scores = {
      'straight-back-into-it': (st.boldness / 10) * 0.5 + (1 - st.temperament / 10) * 0.3,
      'in-front-of-everybody': (st.boldness / 10) * 0.4 + (1 - st.strategic / 10) * 0.25,
      'somebody-stepped-in': 0.35,
      'swallowed-it': (1 - st.boldness / 10) * 0.5 + (st.strategic / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'swallowed-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'swallowed-it' ? 'carried last night up the road and never said it'
      : branch === 'somebody-stepped-in' ? 'was talked down on the road out'
        : 'took last night onto the road';
    const bondDelta = branch === 'swallowed-it' ? -0.5
      : branch === 'somebody-stepped-in' ? -1 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, ROAD_ARGUMENT_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = arcContinue(api, 'confrontation', [a, b], ctx.ep, line,
      { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

const COLUMN_SHAPE_LINES = {
  // The column sorts itself and somebody reads the sorting.
  'read-the-order': [
    '{a} watches who chooses whom on the road, and does the maths quietly.\n{a} (to camera): {cam:watching}',
    '{a} notes who walks with who.\n{a} (to camera): "Watch who walks with who. That’s the real vote."',
    '{a} reads the line like a map.\n{a} (to camera): {cam:notes}',
    '{a} counts the pairs on the road out.\n{a} (to camera): {cam:watching}',
  ],
  // Two people who should not be together, are.
  'the-wrong-pair': [
    '{b} is walking with the last person {a} would have paired {bObj} with.\n{a} (to camera): "Since when are they friends?"',
    '{a} notices {b}’s new walking partner.\n{a} (to camera): {cam:holding-info}',
    '{a} does a double take at {b}’s company.\n{a} (to camera): "That’s new. I don’t like new."',
    '{a} clocks {b} with an unexpected partner.\n{a} (to camera): {cam:watching}',
  ],
  // Somebody is walking alone and that is its own answer.
  'walking-alone': [
    '{b} has the road to {bRef} for an hour, and not by choice.\n{a} (to camera): "Nobody’s walking with {b}. That tells you something."',
    '{a} notices {b} walking alone.\n{a} (to camera): {cam:watching}',
    '{a} sees {b} left on {bPos} own.\n{a} (to camera): "Somebody’s been talking about {b}."',
    '{a} watches {b} walk alone.\n{a} (to camera): {cam:holding-info}',
  ],
  'the-gap-in-the-middle': [
    '{a} drifts between the two groups on purpose.\n{a} (to camera): "In the middle you hear both halves. Nobody notices you."',
    'The column goes out in two halves with a gap between them, and {a} walks in the gap.\n{a} (to camera): "Two groups. Two sides. I’m in the middle."',
    '{a} notices the line split in two.\n{a} (to camera): {cam:watching}',
    '{a} walks alone between two groups.\n{a} (to camera): "Neither half wants me. Or both do. Hard to tell."',
  ],
};

// THE COLUMN AS EVIDENCE. Reads the live bond graph rather than a roll: who
// walks beside whom is a real fact this engine already holds, and a suspicion
// scene that reads it is deducing from the game rather than from a die.
registerEvent({
  id: 'susp-the-shape-of-the-column',
  family: 'suspicion',
  window: 'journey-out',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'social'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // A column needs a column. Six people on a road is a group; three is a
    // walk, and the shape of three tells nobody anything.
    // WEIGHTED TO SUPPLEMENT, NOT TO TAKE OVER. Four events entering a
    // window that held six is a 60%% increase in weight, and the phase
    // budget does not grow to match — so every existing event fires less.
    // Measured: `cover-swap-story-with-partner:were-together-anyway` fell
    // to 34 firings against tr-castle-prose's variety floor of 40. These
    // weights are set below the window's typical 2.5 for that reason.
    return (ctx.living || []).length >= 6 ? 1.2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-the-shape-of-the-column');
    const [a, b] = ctx.actors;
    const st = pStats(a);
    // IS {b} ACTUALLY ALONE? Read off the bonds, not decided by the roll — a
    // player nobody has a positive bond with really is walking on their own.
    const friends = (ctx.living || []).filter(n => n !== b && getBond(b, n) > 1).length;
    const scores = {
      'read-the-order': (st.intuition / 10) * 0.45 + (st.strategic / 10) * 0.3,
      'the-wrong-pair': (st.intuition / 10) * 0.4 + 0.15,
      // Only reachable when the isolation is real.
      'walking-alone': friends === 0 ? 0.9 : friends === 1 ? 0.3 : 0,
      // A FOURTH READ, and the only one about the WHOLE column rather than
      // one person in it: the road has split into two groups and the gap is
      // the information. Needs a road with enough people on it to have a
      // middle, which is why it is gated on the living count.
      'the-gap-in-the-middle': (ctx.living || []).length >= 8
        ? (st.intuition / 10) * 0.3 + 0.15 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'read-the-order';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'the-gap-in-the-middle' ? 'read the gap the column had opened in itself'
      : branch === 'walking-alone' ? 'walked the road out with nobody beside them'
      : branch === 'the-wrong-pair' ? 'was seen walking with somebody unexpected'
        : 'read the order of the column on the road out';
    // A read costs the person read, a little, and only in the reader's head.
    const bondDelta = branch === 'walking-alone' ? -0.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, COLUMN_SHAPE_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = api.openArc('suspicion', [a, b], { source: sceneWhy, seed: line });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: b,
      topicKind: 'road-read', threadId: t?.id, bondDelta };
  },
});

const ROAD_FAVOUR_LINES = {
  'took-the-weight': [
    '{a} takes the load onto {aPos} own shoulder and says nothing about it.\n{b}: "You don’t have to."\n{a}: "I know."',
    '{a} carries {b}’s bag without being asked.\n{b}: "You don’t have to."\n{a}: "I know."\n{b} (to camera): "{a} just took it. Didn’t say a word."',
    '{a} lifts the heavy end.\n{b}: "Thank you."\n{a}: "Don’t mention it."',
    '{a} helps {b} quietly.\n{b}: "Thank you."\n{a}: "It’s nothing."\n{b} (to camera): "Kind. Really kind."',
  ],
  'made-a-point-of-it': [
    '{a} helps, visibly, in front of the people {aSub} wants to see it.\n{a}: "Here, let me take that!"\n{b} (to camera): "Very loud help, that."',
    '{a} makes a show of carrying {b}’s load.\n{a}: "Make way! Heavy load coming through!"\n{b}: "It’s a rucksack."\n{b} (to camera): "Nice gesture. Shame about the audience."',
    '{a} helps {b} with a lot of noise.\n{a}: "Anyone else need a hand?"\n{b}: "I think you’ve helped enough."',
    '{a} helps where everyone can see.\n{a}: "Here, give it to me! Everyone, I’ve got it!"\n{b}: "Alright, alright."\n{b} (to camera): "{a} wanted credit for that."',
  ],
  'let-them-struggle': [
    '{b} carries all of it, and {a} walks beside {bObj} carrying nothing.\n{b}: "Don’t help, then."\n{a}: "You’re doing fine."',
    '{a} watches {b} struggle.\n{b}: "A hand would be nice."\n{a}: "You’re doing great."\n{b} (to camera): "{a} didn’t lift a finger. I’ll remember that."',
    '{a} doesn’t offer to help.\n{b}: "A hand would be nice."\n{a}: "You’ve got it."',
    '{a} leaves {b} to it.\n{b}: "Could you take one end?"\n{a}: "You’ve got it."\n{b} (to camera): "Nice to know who helps and who doesn’t."',
  ],
  'needed-carrying': [
    '{a} is the one struggling today, and {b} takes the load without being asked.\n{a}: "I’m fine."\n{b}: "You’re not. Give it here."',
    '{b} helps {a} up the hill.\n{b}: "Give me your hand."\n{a}: "I’m fine—"\n{b}: "You’re not. Hand."\n{a} (to camera): "I needed that. I won’t forget it."',
    '{b} takes the weight off {a}.\n{a}: "Thank you."\n{b}: "That’s what we do."',
    '{b} notices {a} flagging.\n{b}: "Swap?"\n{a}: "Please."',
  ],
};

// A ROAD IS PHYSICAL, and almost nothing in this pool is. The mission is an
// hour away on foot with something to carry, and who takes the weight off whom
// is a trust beat the castle's rooms cannot produce.
registerEvent({
  id: 'trust-took-the-weight-on-the-road',
  family: 'trust',
  window: 'journey-out',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'physical', 'endurance', 'social', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Nobody carries anything for somebody they are actively against.
    // WEIGHTED TO SUPPLEMENT, NOT TO TAKE OVER. Four events entering a
    // window that held six is a 60%% increase in weight, and the phase
    // budget does not grow to match — so every existing event fires less.
    // Measured: `cover-swap-story-with-partner:were-together-anyway` fell
    // to 34 firings against tr-castle-prose's variety floor of 40. These
    // weights are set below the window's typical 2.5 for that reason.
    return getBond(a, b) >= -1 ? 1.2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-took-the-weight-on-the-road');
    const [a, b] = ctx.actors;
    const st = pStats(a);
    const bond = getBond(a, b);
    const scores = {
      // Doing it quietly is loyalty plus the physical wherewithal to spare.
      'took-the-weight': (st.loyalty / 10) * 0.4 + (st.physical / 10) * 0.3
        + Math.max(0, bond) / 10 * 0.3,
      // Doing it visibly is a social player buying something with it.
      'made-a-point-of-it': (st.social / 10) * 0.35 + (st.strategic / 10) * 0.35,
      // Not doing it needs a reason, and a thin bond is one.
      'let-them-struggle': Math.max(0.1, 0.5 - Math.max(0, bond) * 0.08),
      // A FOURTH OUTCOME, and it REVERSES the scene: {a} is the one who
      // cannot carry it and {b} takes it off them. The three above all read
      // {a} as the helper; this is the only fork where {a} is the helped, and
      // it is the only one that reads endurance.
      'needed-carrying': (1 - st.endurance / 10) * 0.35 + (1 - st.physical / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'took-the-weight';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'needed-carrying' ? 'was the one who needed carrying on the road'
      : branch === 'took-the-weight' ? 'took the weight off them on the road'
      : branch === 'made-a-point-of-it' ? 'helped on the road where the column could see it'
        : 'let them carry it the whole way';
    const bondDelta = branch === 'took-the-weight' ? 2
      : branch === 'needed-carrying' ? 1.5
        : branch === 'made-a-point-of-it' ? 1 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = pronounSlots(pick(rng, ROAD_FAVOUR_LINES[branch]), { a, b }).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});
