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
import { lineFor } from './lines.js';

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
    '{b} fell into step with {a} on the way out and said more in ten minutes of walking than in three days indoors.',
    'Out of the castle’s hearing, {b} told {a} the thing they had been carrying around all week.',
    'Walking put {b} at ease in a way the great hall never had, and {a} got the honest version.',
    'Two miles from anybody, {b} told {a} something {b} had not planned on telling anybody at all.',
    '{b} talked for the whole first hill and {a} did not interrupt once, and got the lot.',
    'There is no door to be on the other side of out here, and {b} used that.',
    '{b} started a sentence about the second night and, for once, finished it.',
    '{a} asked nothing at all and {b} answered all of it anyway, over about a mile.',
    'The road does something to people. {b} came off it having said the true version.',
    '{b} said it to the hedgerow rather than to {a}, and {a} had the sense to keep looking forward.',
  ],
  probed: [
    '{b} kept pace with {a} the whole way out and asked questions the whole way out with it.',
    'Somewhere on the road {a} realised {b} had been steering the conversation since the gate.',
    '{b} spent the walk taking {a} apart very politely, one small question at a time.',
    'Every answer {a} gave got a follow-up, and {b} never once sounded like they were interrogating anybody.',
    '{b} asked {a} about the weather, then about breakfast, then about last night, in that order.',
    'It was the friendliest interrogation {a} has ever been on the wrong end of.',
    '{b} circled back to the same hour three times in two miles, from three different directions.',
    '{a} came off the road having given away four things and taken away none.',
    '{b} let {a} do nine-tenths of the talking, which is how {b} always does this.',
    '{b} began with questions about breakfast, then asked {a} where they had been the previous night.',
  ],
  quiet: [
    '{a} and {b} walked the whole way without saying much, and neither of them minded.',
    '{b} had nothing to say on the road out, and {a} decided not to fill the gap.',
    'It was a long walk and {b} spent it inside their own head, with {a} beside them.',
    '{a} tried twice to start something and {b} let both attempts die, without any rudeness in it.',
    'They matched pace for an hour, {a} and {b}, and that was the whole of the conversation.',
    'Two people, one road, about nine words between them, and no bad feeling in any of it.',
    '{b} is not a talker and {a} has stopped taking it personally.',
    'They pointed at a bird once. That was the high point of the discourse.',
    '{a} found the silence restful, which after a week in that hall is not nothing.',
    '{b} walked the whole way half a step behind and neither of them adjusted.',
  ],
  'said-too-much': [
    '{b} talked for two miles and spent the last one working out how much of it {a} would keep.',
    'It came out easily and stopped being easy about four hundred yards from the gate.',
    '{b} heard themselves telling {a} about the first night and could not find the end of the sentence.',
    '{a} got more than {a} had wanted, and {b} knew it before the castle was back in sight.',
    'The road is a confessional right up until you can see the windows again.',
    '{b} said the true thing and then said “forget that,” which is not how a road works.',
    'By the gate {b} had gone very quiet, and the quiet was about the last mile rather than this one.',
    '{b} will spend the rest of the day deciding what {a} is going to do with it.',
    'What {b} handed over out there is not the kind of thing you hand back.',
    '{a} did not ask for any of it and is now carrying all of it.',
  ],
  'fell-behind': [
    '{b} dropped back at the first stile and finished the road with somebody else entirely.',
    'They started the walk together. Somewhere in the second mile {b} was not there any more.',
    '{b} let the gap open a little at a time until it was not a gap, it was a decision.',
    '{a} looked round on the hill and {b} was three people back and not hurrying.',
    'It was not a snub. It was, by the top of the road, unmistakably something.',
    '{b} stopped to do up a boot and did not catch {a} up again all the way out.',
    '{a} slowed twice. {b} did not take either invitation.',
    'Whoever {b} wanted to walk beside today, it was not {a}, and {a} worked that out at the stile.',
    'The column stretched and {b} chose which end of it to be at.',
    '{b} walked the last mile with the one person {a} had been hoping to talk to.',
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
    const line = pick(rng, STEP_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    '{a} waited until the castle was out of sight to say {c}’s name, and {b} said they had been thinking it too.',
    'Off the path, {a} finally said what they thought about {c}. {b} did not need convincing.',
    '{a} tried the theory about {c} out on {b} where nobody could overhear it, and it landed.',
    'The second the gate was behind them, {a} said {c}, and {b} said {c} back.',
    '{a} and {b} spent the middle of the road agreeing about {c} in more detail than either had planned.',
    'Two miles of {c}, and by the end of it neither of them was hedging about any of it.',
    '{a} had been carrying {c}’s name since Tuesday and put it down in front of {b} on the hill.',
    'It is much easier to say a name where there are no walls, and {a} and {b} both found that out.',
  ],
  hedged: [
    '{a} floated {c}’s name on the road and {b} neither agreed nor argued, which {a} noticed.',
    'Out of earshot {a} named {c}. {b} said “maybe” and changed the subject before the next bend.',
    '{a} put {c} in front of {b} and got a shrug for it, and walked the rest of the way wondering why.',
    '{b} agreed that {c} was worth watching, and would not say a word about what they had seen.',
    '{a} said {c} was the one. {b} said everyone was the one, and laughed, and left it.',
    '{b} gave {a} an answer with no weight in it and let {a} carry it the rest of the way.',
    '"Could be," said {b}, about {c}, and that was the whole of {b}’s contribution to two miles.',
    '{a} could not tell whether {b} was being careful or was simply not interested, and still cannot.',
  ],
  defended: [
    '{a} said {c}’s name out on the road and {b} shut it down flat.',
    '{b} would not have a word said about {c}, not even out here where nobody was listening.',
    '{a} learned something on that walk, and it was about {b}, not about {c}.',
    '{b} told {a} to leave {c} alone, out on the road, and much harder than the question deserved.',
    '{a} had picked the one name {b} would not hear, and found that out a mile from the castle.',
    '"You are wrong, and you are going to look stupid," {b} said, which is a lot of certainty for a hedgerow.',
    '{b} defended {c} for a quarter of an hour to an audience of one and did not stop being angry.',
    '{a} had thought this was a safe conversation. It was a safe conversation about the wrong person.',
  ],
  'named-somebody-else': [
    '{a} said {c}. {b} listened to all of it and then said a different name entirely.',
    '“Not {c},” said {b}, and then gave {a} somebody else and three reasons, on the hill.',
    '{b} traded a name for a name out on the road, which is the fairest exchange available here.',
    '{a} came off the walk with a name {a} had not gone out with.',
    '{b} would not follow {a} to {c} and would not let {a} go home empty either.',
    'Two names went out on that road. Only one of them came back with anybody behind it.',
    '{b} said the name {b} had been keeping, which is worth more than agreeing about {c} was.',
    '{a} put {c} down and {b} put somebody else down beside it, and they walked round both.',
  ],
  'would-not-talk-about-it': [
    '“Not out here,” {b} said, which is odd, because out here is the only place anybody can.',
    '{b} would not discuss anybody at all on the road, and gave no reason for it.',
    '{a} said {c}’s name and {b} started talking about the weather with real determination.',
    '{b} does not do this on walks. {b} has never done this on walks, and {a} knows that now.',
    '{a} got three names into it before realising {b} had not said one.',
    '{b} listened, said nothing, and let {a} arrive at the castle having spoken to the road.',
    '“I would rather not,” said {b}, pleasantly, and meant it, and did not.',
    'Whatever {b} thinks about {c}, it is not going to be said within two miles of {a}.',
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
    const line = pick(rng, EARSHOT_LINES[branch])
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
    '{a} used the walk to run the account of {topic} back through, start to finish, and could not find a seam in it.',
    'By the time the castle was out of sight, {a} had the story of {topic} smooth enough to say in {a}’s sleep.',
    '{a} spent the road out on {topic}, and came off it with an answer for every question the table could ask.',
    '{a} walked the whole account of {topic} through twice, under {a}’s breath, and it held both times.',
    'The road was long enough for {a} to test every version of {topic} and keep the plainest one.',
    '{a} found the one hour of {topic} that did not fit, moved it, and the rest of it closed up behind it.',
    'Two miles of quiet work on {topic}, and {a} arrived with a night nobody can take apart.',
    '{a} said the account of {topic} to a gate post, and the gate post believed every word.',
  ],
  serviceable: [
    '{a} went over the account of {topic} on the walk and got most of it to hold, which would have to do.',
    'There was one part of {topic} that {a} still could not say the same way twice, and the road ran out before it was fixed.',
    '{a} practised the story of {topic} until it was good enough, and tried not to think about the part that was not.',
    '{a} got {topic} down to one weak hour and decided one weak hour was survivable.',
    'By the last mile the account of {topic} worked, provided nobody asked about the middle of it.',
    '{a} has a version of {topic}. It is not a good version, and it is the version {a} is going with.',
    'The story of {topic} holds if you do not push it, and {a} spent the walk hoping nobody would.',
    '{a} traded a better account of {topic} for a simpler one, on the grounds that simpler survives being repeated.',
  ],
  overcooked: [
    '{a} rehearsed {topic} so many times on the way out that it stopped sounding like something that happened.',
    'By the last mile, {a}’s account of {topic} had grown three details it did not need and could not lose.',
    '{a} polished the story of {topic} past the point of being believable, knew it, and could not stop.',
    'The version of {topic} {a} walked back with had a time on every hour, which no honest person has.',
    '{a} added a small human detail to {topic}, and then another, and by the gate it was a performance.',
    '{a} has now got an account of {topic} so good that having it is itself the problem.',
    'Nobody remembers {topic} in that much detail. {a} does, in nine parts, with a reason for each.',
    '{a} rehearsed the shrug about {topic} as well, which is roughly where this stops being preparation.',
  ],
  'stopped-rehearsing': [
    '{a} got half a mile into rehearsing {topic}, heard how it sounded, and decided the rehearsing is the thing that gets people caught.',
    '{a} put the account of {topic} down on the road out and went in with nothing prepared, on purpose.',
    'People who have done nothing do not have an account. {a} arrived at that, about {topic}, on the hill.',
    '{a} decided the safest version of {topic} is the one {a} has not thought about, and stopped thinking about it.',
    'The rehearsal of {topic} ended at the second stile. {a} walked the rest of it thinking about the weather, deliberately.',
    '{a} has watched two people caught by being too ready, and will not be the third over {topic}.',
    '{a} stopped rehearsing {topic}, out loud, mid-sentence, and did not start again.',
    'Whatever {a} says about {topic} tonight, {a} has decided it will be said for the first time.',
  ],
  'could-not-get-it-straight': [
    '{a} could not get through the account of {topic} once, all the way out, without losing an hour of it.',
    'Every time {a} started on {topic}, it came out in a different order, and the order is the whole thing.',
    '{a} spent two miles on {topic} and arrived less sure of it than at the gate.',
    'The account of {topic} will not sit still. {a} has been walking behind it since breakfast.',
    '{a} had {topic} straight at breakfast. {a} does not have it now, and the road did not give it back.',
    'Somewhere between {a}’s two versions of {topic} there is a true one, and {a} can no longer find it.',
    '{a} stopped four times to fix the same hour of {topic} and fixed it four different ways.',
    'By the gate, {a} had a headache and an account of {topic} with a hole in the middle of it.',
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
    const topic = victim ? `the night ${victim} was murdered` : 'what happened on the mission';
    const sceneWhy = branch === 'stopped-rehearsing' ? 'decided the rehearsing was the dangerous part'
      : branch === 'could-not-get-it-straight' ? 'could not get one evening into the same order twice'
        : 'ran through their account of the night on the road';
    const line = pick(rng, ROAD_REHEARSAL_LINES[branch])
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
    '{a} chose {b} to walk with instead of the obvious person, and {b} spent the road visibly pleased about it.',
    '{b} had not expected to be picked, and did not hide how much it landed.',
    '{a} dropped back to walk with {b}, and {b} took it as exactly what it looked like.',
    '{b} had been braced for a long walk on their own, and spent the whole of it grinning instead.',
    'Being chosen did something visible to {b}, and {a} saw it happen and said nothing.',
    '{b} has been the last person picked for four days, and today {b} was the first.',
    'It is a very small thing and {b} carried it the whole two miles like luggage.',
    '{b} said “really?” out loud when {a} fell in beside them, and then was embarrassed about saying it.',
    'Nobody in this castle has chosen {b} for anything yet. {b} noticed the difference immediately.',
    '{b} talked more in that hour than in the three days before it, out of sheer relief.',
  ],
  wary: [
    '{a} chose {b} to walk with, and {b} spent the whole road working out why.',
    '{b} noticed they had been picked and did not once believe it was an accident.',
    '{a} fell in beside {b}, and {b} answered every question with a shorter question.',
    '{b} was perfectly pleasant for two hours and gave {a} absolutely nothing.',
    '{b} kept half a step ahead the whole way, which is not where you walk with a friend.',
    'Nobody picks {b} for the company. {b} has been in this format before and knows that.',
    '{b} spent the first mile waiting for the ask and the second mile more worried that it never came.',
    '{a} got the weather, the boots and the view, and nothing else at all.',
    '{b} counted how many other people {a} could have walked with, and got to six.',
    'Being chosen is information about the chooser, and {b} spent the road reading it.',
  ],
  transactional: [
    '{b} understood the pick immediately, priced it, and started talking about what happened at the next vote.',
    '{a} picked {b} for the walk and {b} had turned it into an arrangement before the first hill.',
    '{b} accepted the company and made sure {a} knew what it would be worth later.',
    '{b} was glad of the walk and said so, and then said what they wanted for it.',
    'By the second hill {b} had stopped talking about the walk and started talking about the vote.',
    '{b} treated two miles of company as an opening bid and negotiated up from it.',
    '“You want something,” {b} said, cheerfully. “Good. So do I.”',
    '{b} does not mind being used, provided the using is mutual and stated.',
    'It took {b} about nine minutes to convert a kindness into a commitment.',
    '{b} named a night, a name and a price, in that order, before the halfway stone.',
  ],
  'would-not-be-picked': [
    '{a} fell in beside {b} and {b} found a reason to be somewhere else within the mile.',
    '{b} does not want to be seen walking with {a}, and made that clear without saying it.',
    '“I promised I would walk with somebody,” {b} said, which was true and was not the reason.',
    '{b} sped up. It was not subtle and it was not meant to be.',
    '{a} chose {b} and {b} declined to be chosen, politely, in front of two other people.',
    'Being seen beside {a} costs {b} something this week, and {b} has done the arithmetic.',
    '{b} took the pick as an accusation rather than a compliment and got out of it.',
    '{a} has been refused a walk before and never quite this quickly.',
    '{b} spent four minutes with {a} and the rest of the road at the front of the column.',
    'The gap between them by the top of the hill was about forty yards and entirely deliberate.',
  ],
  'turned-it-around': [
    '{a} picked {b}, and by the second mile {b} was the one doing the asking.',
    '{b} let {a} start it and then spent an hour finding out what {a} wanted to know and why.',
    'It was supposed to be a test of {b}. {b} sat the test and then set one.',
    '{b} answered three questions and asked five, and {a} did not notice the swap until the gate.',
    '“Why me,” {b} asked, first thing, and would not move on until there was an answer.',
    '{b} asked {a} about breakfast, the previous night and who {a} trusted; {a} answered all three.',
    '{a} came off the road having learned nothing and having said a great deal.',
    '{b} turned the walk into an interview and {a} was the one being interviewed.',
    'The pick told {b} something. {b} spent the road finding out what.',
    '{b} is very good at this and {a} had not previously known that about {b}.',
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
    const line = pick(rng, WALK_PICK_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    'The group that left the castle was noticeably shorter than the last one, and {a} was the one who said so.',
    '{a} counted the people on the road out and wished they had not.',
    'Somebody used to walk at the front of this. {a} noticed the gap where they should have been.',
    'It was the first time the road out had felt short, and {a} could not stop doing the arithmetic.',
    '{a} counted the column at the gate and got a number {a} did not like.',
    'There is a gap in the line where somebody walked on Monday, and {a} kept looking at it.',
    '{a} realised halfway out that nobody was behind {a} any more.',
    'It is the same road and it takes the same time and it is not the same walk.',
    '{a} did the subtraction twice, on the road, and got the same answer twice.',
  ],
  'solo-again': [
    '{a} had stopped counting the people on the road out, and hated that they knew the number anyway.',
    'The column out of the gate got shorter every time, and {a} had started walking at the back of it.',
    '{a} looked at how few of them were on the road now and could remember every single gap in it.',
    'There was more road than people by this point, and {a} was the only one who said anything about it.',
    '{a} counted the column out of habit and then wished {a} had not.',
    'The road out takes the same time and feels twice as long with four fewer people on it.',
    '{a} walked in the space where somebody used to walk, and noticed doing it.',
    'It is quieter every week and nobody has said so out loud since the second one.',
    '{a} could see the whole column from the front now, which was not true on Monday.',
    'There is a point where a group stops being a group, and {a} thinks they passed it.',
  ],
  'pair-first': [
    'The group leaving was shorter than last time. {a} said it out loud and {b} only nodded.',
    '{a} and {b} both clocked how much smaller the column out of the gate had got.',
    'Neither {a} nor {b} said anything about it, but both of them counted the road out.',
    '{a} caught {b} looking back at the gate to check the number, and did not mention it.',
    '{a} and {b} both counted, separately, and both arrived at the same short number.',
    'Neither of them said it out loud. Both of them walked slower for about a minute.',
    '{b} started a sentence about who was missing and {a} finished it.',
    'It is the first road out that has felt like this, and {a} and {b} were beside each other for it.',
    '{a} said “fewer of us” and {b} said “yes,” and that was the whole conversation.',
  ],
  'pair-again': [
    '{a} and {b} had both stopped counting out loud, which was its own way of counting.',
    'The road out was shorter again. {a} started to say so and {b} said they already knew.',
    '{a} and {b} walked out through a gate that used to be crowded, and neither of them filled the silence.',
    'By now {a} and {b} could have named everybody missing from the road without stopping to think.',
    '{a} and {b} have walked this road with three different sets of people on it.',
    'They have stopped counting out loud. Both of them still count.',
    '{a} pointed at a stile and said a name, and {b} knew which week it was from.',
    'It gets shorter every time and neither of them remarks on it any more.',
    '{a} and {b} walked at the front because there is not much behind the front now.',
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
    const line = _sentenceCase(pick(rng, SHORT_COLUMN_LINES[branch])
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
    'Something happened on that walk between {a} and {b} that had not been happening in the castle.',
    'It was a long road and {a} and {b} walked all of it together, and neither of them planned that.',
    '{a} and {b} fell into step near the front and did not swap out once the whole way.',
    '{a} and {b} both felt the flirtation begin between the gate and the vans.',
    'They talked about nothing for four miles, {a} and {b}, and arrived slightly different.',
    '{b} laughed at something {a} said and {a} spent the next mile trying to do it again.',
  ],
  'named-it': [
    'Halfway to the vans {a} said the thing out loud, which is not what people do here, and {b} did not run.',
    '"This is going to be a problem," {b} said, on the road, and {a} said yes, and that was the naming of it.',
    '{a} decided somewhere on that walk that pretending was more work than saying it, and said it.',
    'It got named on the road out, plainly, by {b}, and {a} had about a second to decide what to do with that.',
    'Neither of them was going to say it in the castle. On the road, {a} did.',
    '{a} and {b} agreed out loud that something was happening, which makes it a fact rather than a feeling.',
  ],
  'somebody-saw': [
    '{a} and {b} walked out together and half the column watched them do it.',
    'It would have been private if the road had not had eleven other people on it.',
    'Somebody two places back saw the whole of it, and the castle had it before the mission did.',
    '{a} and {b} thought they were at the back. They were not at the back.',
    'Whatever started on that walk started in front of witnesses, which is not the same thing at all.',
    'The road out is the worst place in this format to have a private moment, and {a} and {b} had one there.',
  ],
  'walked-it-off': [
    '{a} felt it coming and dropped back to walk with somebody else, and could have told you exactly why.',
    'It nearly happened on that road, and {b} put a stop to it before it did.',
    '{a} thought about the rest of the season and walked the last mile with the wrong person on purpose.',
    '"Not here," {b} said, and meant not ever, or meant not yet, and did not clarify which.',
    '{a} decided that a showmance is a target with two people in it, and sped up.',
    'It was there and both of them left it on the road, and neither mentioned it at the mission.',
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
    'Whatever had been sitting between {a} and {b} all day, {b} answered it straight on the walk home, and that was that.',
    'By the time the castle came back into view {b} had given {a} the answer they had been waiting for.',
    '{b} said the thing plainly on the road back. {a} believed it, and stopped asking.',
    'It took {b} one sentence on the walk home, and {a} had been waiting three days for it.',
    '{b} said it without being asked, halfway back, and {a} did not need to hear it twice.',
  ],
  dropped: [
    '{a} decided somewhere on the way back that it was not worth carrying and let it go.',
    'Neither {a} nor {b} raised it again on the road home. It was simply over.',
    'The walk back was long enough for {a} to talk themselves out of it entirely.',
    '{a} started to bring it up at the third mile and decided, mid-breath, not to bother.',
    'By the gate {a} could not remember why it had mattered enough to carry all day.',
  ],
  soured: [
    'It came apart on the walk back. {b} said the wrong thing and {a} stopped pretending.',
    'Whatever {a} and {b} had, it did not survive the road home.',
    '{b} pushed it one sentence too far on the way back, and {a} was done.',
    '{b} explained, and then explained the explanation, and {a} walked the last mile alone.',
    '{a} and {b} could have left it alone on the walk back, but {b} kept talking and made it worse.',
  ],
  unresolved: [
    'They talked the whole way back and settled nothing, and both of them knew it.',
    '{a} and {b} got to the gate with the same question still open between them.',
    'The castle came back into view before {a} and {b} had got anywhere near the end of it.',
    '{a} and {b} agreed to finish it later, which both of them heard as what it was.',
    'The road ran out before the conversation did, and {a} and {b} carried the rest of it inside.',
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

    const line = pick(rng, SETTLED_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    'On the road back {b} answered it, properly, and {a} could not find anything wrong with the answer.',
    '{b} finally gave {a} the whole account on the walk home, and it held together.',
    'By the gate {a} had run out of ways to make {b} look guilty, and said so.',
    '{b} walked {a} through it hour by hour on the way home and it survived every hour.',
    '{a} came back through the gate having decided, for now, that they had been wrong about {b}.',
    '{b} did not sound rehearsed, and after a mile of it {a} stopped listening for the joins.',
    'It took two miles and {b} used all of them, and by the end {a} had nothing left to ask.',
    '{a} put the hardest version of it to {b} on the road and {b} answered that one too.',
    '{b} let {a} go back over the same afternoon three times and told it the same way each time.',
    'Somewhere between the ford and the drive {a} stopped building the case against {b}.',
    '{a} had wanted {b} to slip and {b} did not, and {a} was quietly relieved about it.',
    '{b} said the one thing that would have been stupid to invent, and {a} believed it.',
    '{a} apologised on the last stretch, which {a} had not planned to do.',
    'By the time the walls came up {a} could not remember what had started it.',
  ],
  slipped: [
    'It was a long walk and {b} talked too much on it. {a} got something out of it that {b} did not mean to give.',
    'Somewhere on the road home {b} said one sentence too many, and {a} heard it.',
    'The walk back went on long enough that {b} contradicted themselves, and {a} was still listening.',
    '{b} volunteered a detail nobody had asked for, on the road home, and it was the wrong one.',
    '{a} had almost let it go when {b} said the thing that made letting it go impossible.',
    '{b} answered a question {a} had not asked, which is the answer {a} took home.',
    'Twice on that road {b} put the same hour in two different places, and {a} counted both.',
    '{b} got the order wrong, in a small way, and {a} does not think it was tiredness.',
    '{a} said nothing for the last mile because {a} did not want {b} to stop talking.',
    'The lie was not in what {b} said. It was in how fast {b} said it.',
    '{b} corrected themselves halfway through a sentence and hoped {a} had not been counting.',
    '{a} went out on that road ready to be convinced and came back with a note instead.',
    '{b} named somebody who was not there, and only {a} noticed.',
    'It was one word. It was the wrong word, and {a} has it now.',
  ],
  hardened: [
    'Nothing about the walk back changed {a}\'s mind about {b}, and {b} could tell.',
    '{b} spent the road home defending themselves to {a}, and made it worse with every mile.',
    'By the time the castle came back into view {a} was more certain about {b}, not less.',
    '{b} answered everything on the walk home, at length, and {a} believed none of it.',
    'The road back gave {b} every chance to fix it with {a}, and {b} used all of them badly.',
    '{b} was too smooth about it, and smooth is what {a} had been afraid of.',
    'A mile in, {b} asked who else thought this, which told {a} more than the denial had.',
    '{b} tried three different explanations on {a} and that was two too many.',
    '{a} watched {b} work and thought: this is somebody who has done this before.',
    '{b} got angry about it near the end, and {a} noted exactly where the anger arrived.',
    'They walked the last half mile without speaking and both knew why.',
    '{b} kept checking whether {a} was convinced, which is not what innocent people do.',
    '{a} let {b} finish and then said nothing at all, all the way to the gate.',
    'It was the wrong answer given very well, and {a} came home sure of it.',
  ],
  'never-raised-it': [
    '{a} had the whole road to ask {b} about it and did not ask.',
    'Two miles, nobody else within earshot, and {a} talked to {b} about the weather.',
    '{a} rehearsed the question for the first half of that walk and spent the second half not asking it.',
    '{b} has no idea {a} suspects anything, which is either {a} being clever or {a} losing the nerve for it.',
    'The moment came up three times on that road and {a} let all three of them go past.',
    '{a} decided that asking would tell {b} more than the answer would tell {a}.',
    'It is the safest thing {a} did all day and {a} is not sure it was the right thing.',
    '{a} walked the entire way home beside the person {a} suspects and said nothing about it at all.',
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

    const line = pick(rng, LET_IT_GO_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    'A whole day out of the castle and nobody caught {a} out on {topic}. The account was still standing at the gate.',
    '{a} got through the entire journey without changing a word of the account of {topic}.',
    'By the walk home {a} had stopped bracing for the question about {topic}, because it never came.',
    'Nobody out there pressed {a} on {topic} at all, which was the best news {a} had had all week.',
    '{a} said the same three sentences about {topic} to four different people and none of them blinked.',
  ],
  frayed: [
    '{a} had to patch the account of {topic} twice on the road, and neither patch was clean.',
    'The story of {topic} got {a} home, but it had lost a piece somewhere out there.',
    '{a} spent the walk back quietly listing everything about {topic} they would have to remember differently now.',
    'One person on the road remembered {topic} differently, and {a} had to agree with them.',
    '{a} came home with an account of {topic} that worked and one loose end they could not tie off.',
  ],
  // THE ACCOUNT COMES APART, NOT THE PERSON. This branch closes the cover
  // THREAD with `exposed`, and a sentence implying the room now knows what
  // {a} is would be the engine claiming a fact no belief anywhere holds -
  // castle events write zero beliefs, so nobody in the castle learned
  // anything here except that one story stopped working.
  broke: [
    'Somebody asked the one question about {topic} on the road back, and {a} did not have an answer that matched the last one.',
    'The account of {topic} came apart in the open, hours from the castle, and {a} had nothing to put in its place.',
    '{a} heard their own account of {topic} fall over on the walk home and could not pick it back up.',
    'It went wrong in the open, in front of people, and {a} had a whole road home to think about {topic}.',
    '{a} answered about {topic} too fast, out there where there was nowhere to go, and the answer was wrong.',
  ],
  'nobody-asked': [
    '{a} carried a complete account of {topic} all the way home and nobody asked for one word of it.',
    'A whole day, and not one person put a question to {a} about {topic}.',
    '{a} had answers ready for questions that never came, and spent the evening wondering why.',
    'Nobody is looking at {a} at all, and {a} cannot decide whether that is safety or a set-up.',
    'The account {a} built for {topic} went unused, and is now a day older and no better.',
    '{a} spent the road back braced for it and arrived home unasked.',
    'It is easier to hold a story up than to carry one nobody wants, and {a} is finding that out.',
    'Not a single question about {topic}. {a} has started to wonder what that means.',
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
    const line = pick(rng, STORY_SURVIVED_LINES[branch])
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
    '{a} and {b} talked about the ones who were gone the whole way back, and by the gate they had said everything there was.',
    'Somewhere on the road home {a} and {b} stopped talking about the dead and started talking about tomorrow.',
    'They left it out there on the road. {a} and {b} came back through the gate lighter than they went out.',
    '{a} and {b} said the last of it at the last bend, and walked in with nothing owed.',
    'It got said properly, out there, and {a} and {b} both put it down before the gate.',
  ],
  carried: [
    'The castle came back into view and {a} felt the whole thing land on them again, with {b} right there.',
    '{a} and {b} had almost stopped thinking about it, and then they saw the roof.',
    'Coming back through the gate put it straight back on {a} and {b} both.',
    '{a} and {b} had a good day, right up until the towers came over the hill.',
    'The walk home was fine. The last two hundred yards of it were not, for either of them.',
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
    '{a} started on the ones who were gone and {b} put the conversation somewhere else entirely, twice, before the last bend.',
    '{b} did not want the dead on this road and steered {a} off them without ever saying so out loud.',
    'Every time it came near, {b} found something about tomorrow to say instead, and {a} let {b} have it.',
    '{a} and {b} spent the last mile talking about the food at the castle, which was neither of their subjects.',
  ],
  'turned-sharp': [
    'It stopped being about the ones who were gone somewhere near the gate and started being about who was still here.',
    '“You keep saying we,” {b} said, on the last stretch. “Somebody in this castle did that.” After which the walk was quiet.',
    '{a} was still mourning and {b} had moved on to arithmetic, and the two of them found that out with the towers already up.',
    '{a} and {b} came back through the gate having turned a conversation about the dead into a disagreement about the living.',
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

    const line = pick(rng, CASTLE_IN_VIEW_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    '{a} and {b} were the last two through the gate, and neither of them had been walking fast.',
    'The road back took {a} and {b} longer than it took anybody else, and nobody said anything about it.',
    '{a} and {b} came in from the road still talking, hours after they had run out of things to say.',
    '{a} and {b} stopped twice on the way back for no reason either of them offered.',
  ],
  watched: [
    'Somebody held the gate for {a} and {b} for rather longer than they had expected to have to.',
    '{a} and {b} walked back together and were aware, the entire way, of exactly who was looking.',
    'It was a long road and there was nowhere on it for {a} and {b} to be out of sight, and both of them felt that.',
    '{a} and {b} came up the path apart, which fooled precisely nobody who had watched them set off.',
  ],
  'said-out-loud': [
    'Somewhere on the road home one of them said the thing, and by the gate {a} and {b} had stopped calling it nothing.',
    '{a} put it into words on the walk back rather than leaving it to be inferred, and {b} did not laugh it off.',
    '{a} and {b} spent the last mile agreeing what this actually was, out loud, in sentences.',
    '“So what are we doing?” {b} asked, on the road. It took the rest of the walk, and they answered it.',
  ],
  strained: [
    'The road home did {a} and {b} no favours at all, and by the gate they were walking a yard further apart than they had set off.',
    'Something about the day got in between {a} and {b} on the walk back, and neither of them could name it in time.',
    '{a} wanted the walk to fix it and {b} wanted the walk to be over, and those are not the same walk.',
    '{a} and {b} ran out of conversation about two miles from the castle and had to do the rest of it in silence.',
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
    const line = pick(rng, WALKED_BACK_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    '{a} and {b} came back through the gate close enough together that nobody in the courtyard had to ask.',
    'They were the last two in off the road, and by the time {a} and {b} reached the gate it was not a secret any more.',
    '{a} and {b} did not announce it. They did not have to; the courtyard watched them come back up the path.',
    'Whatever the road did to {a} and {b}, they walked back in as a pair and stopped pretending otherwise.',
  ],
  'told-them': [
    '{a} told somebody on the road back, in as many words, and by the time {a} and {b} reached the gate three other people knew.',
    '{b} said it out loud to the person walking beside {b}, and did not ask them to keep it, which was the decision.',
    'It got out on the road rather than at the castle: {a} answered a direct question honestly and that was that.',
    'Somebody asked {b} straight out on the walk home whether it was what it looked like, and {b} said yes.',
  ],
  'agreed-quietly': [
    '{a} and {b} settled it between them on the last mile - not for anybody else, just so the two of them had said it.',
    'By the gate {a} and {b} had agreed what they were, quietly, and agreed to let the castle work it out on its own.',
    '{a} and {b} came in separately and had, an hour earlier, stopped calling it nothing at all.',
    'Nobody saw it happen. {a} and {b} walked in ten minutes apart and were something they had not been that morning.',
  ],
  'not-yet': [
    '{a} and {b} got most of the way to saying it on the road home and put it down again at the gate.',
    'There was a moment on the last hill where it nearly happened, and then the castle came into view and it did not.',
    '{a} started the sentence twice on the walk back and finished it neither time, with {b} waiting both times.',
    '{a} and {b} came back through the gate exactly as they had left it, which took more effort than either had expected.',
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

    const note = pick(rng, CAME_BACK_HOLDING_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    '{a} let a mile go by and then asked the question {a} had come out here to ask.',
    'There was nobody within earshot for the first time in a week, and {a} used it.',
    '{a} said it plainly, once, and then let {b} have the silence to answer into.',
    '{a} waited until the gate was out of sight and then asked {b} about it directly.',
    'Two miles from anybody, {a} finally put the question to {b} plainly.',
    '{a} had been carrying it since that day and let it out on the road, where it was safe to.',
    'The road is the one place in this game with no audience, and {a} used it on {b}.',
    '{a} brought it up the way you bring up a thing you have rehearsed.',
    'It came out of {a} between one field and the next, and {b} had known it was coming.',
  ],
  // Raised, and put back down again without an answer.
  'let-it-lie': [
    '{a} carried it the whole way out and carried it the whole way back.',
    'The moment was there for about a hundred yards. {a} let it go past.',
    '{b} gave {a} two openings. {a} took neither and talked about the mission.',
    '{a} got as far as the first word of it and then talked about the weather instead.',
    'It nearly came up. {b} watched {a} decide against it and said nothing about that either.',
    '{a} started, stopped, and spent the rest of the road being pleasant.',
    'Whatever {a} had meant to ask {b} out there, it stayed unasked.',
    '{a} decided the road was not as private as it looked and kept walking.',
    'Both of them knew what the walk was for. Neither of them opened it.',
  ],
  // It goes badly: the old thing is worse for being handled.
  'reopened-it': [
    '{a} meant to settle it and managed to make it a great deal worse.',
    'Whatever had been scabbed over came off on that road, in front of the hills.',
    'They went out with one problem between them and came back with the same one, louder.',
    '{a} raised it and the whole of it came back up with it, mile after mile.',
    'It was settled until {a} touched it. By the top of the road it was not settled.',
    '{b} answered the question and then answered it twice more, louder.',
    'What {a} wanted was a line under it. What {a} got was the argument again, in a field.',
    'They arrived at the mission not speaking, having left the castle fine.',
    '{a} picked at it until {b} stopped pretending it did not matter.',
  ],
  // Or it closes: the road ends the story.
  'put-it-down': [
    '{a} and {b} left it in a field, which is a better place for it than the castle.',
    'It got said, it got answered, and neither of them picked it back up.',
    'Whatever was between them went into the ditch at the second gate and stayed there.',
    '{a} said it, {b} answered it, and that was genuinely the end of the thing.',
    'It took about four hundred yards and then neither of them needed it any more.',
    'They walked the rest of the way out lighter than they walked the first mile.',
    'Whatever it had been, it did not survive being said out loud on an empty road.',
    '{b} explained. {a} believed it. The road did what the hall could not.',
    'It ended quietly, somewhere between the stile and the water, and stayed ended.',
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
    const line = pick(rng, ROAD_RAISE_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
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
    '{a} got about four hundred yards before last night came out of {a} again.',
    'The road had barely started and {a} was already saying {b}\u2019s name like an accusation.',
    '{a} spent the first hill relitigating the table, at volume, at {b}.',
    '{a} did not last a mile before starting on {b} about last night.',
    'The gate was barely shut when {a} said the name again, and meant it at {b}.',
    'Whatever {a} had been holding through breakfast came out on the first hill.',
    '{a} had clearly decided the road was the place, and told {b} so at length.',
    'It picked up exactly where the table left it, with worse footing.',
    '{a} started it before the castle was out of sight and did not slow down.',
  ],
  // Held, in public, in front of a walking column.
  'in-front-of-everybody': [
    'It happened in the open, on a track, with no walls to take it behind.',
    '{a} and {b} had it out where every single person on that road could hear.',
    'Nobody intervened and nobody looked away. Fourteen witnesses and not one of them neutral.',
    'They had it out on an open road with fourteen people close enough to hear every word.',
    'Nobody pretended not to listen. There is nowhere on a road to pretend.',
    '{a} and {b} argued the length of a field and the column went quiet around them.',
    'It was not a private conversation and neither of them tried to make it one.',
    'The walk arranged itself into an audience without anybody deciding to.',
    'Two people arguing, twelve people walking slightly slower to hear it.',
  ],
  // Somebody steps in and it stops.
  'somebody-stepped-in': [
    'It was going somewhere bad until a third voice made it stop going there.',
    'Somebody got between {a} and {b} and walked one of them up the road.',
    'The argument ended because somebody else decided it was going to.',
    'It got as far as raised voices before somebody put themselves between them.',
    'A third person said the thing that ended it, and both of them let it be ended.',
    'The column absorbed it. Somebody changed the subject and it stayed changed.',
    'It was stopped, not settled, and everybody walking knew the difference.',
    'Somebody walked {b} up to the front and that was the end of the argument.',
    'It ended because a third party made ending it easier than continuing.',
  ],
  // Or it does not happen at all, and the not-happening is the scene.
  'swallowed-it': [
    '{a} said nothing to {b} for six miles and meant every word of it.',
    'It stayed in {a}, all the way out and all the way through the afternoon.',
    '{a} rehearsed it the whole road and delivered none of it.',
    '{a} had it ready the whole way out and never once said it.',
    'Twice {a} drew breath to start on {b}. Twice {a} kept walking.',
    'Whatever {a} thinks about last night, the road did not hear it.',
    '{a} walked the entire way behind {b} and said nothing at all.',
    'It stayed in. That is not the same as it going away.',
    '{a} decided this was not the hour for it, and the deciding took the whole hour.',
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
    const line = pick(rng, ROAD_ARGUMENT_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = arcContinue(api, 'confrontation', [a, b], ctx.ep, line,
      { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});

const COLUMN_SHAPE_LINES = {
  // The column sorts itself and somebody reads the sorting.
  'read-the-order': [
    '{a} watched who chose whom on that road and did the arithmetic quietly.',
    'The column is a seating plan nobody thinks about, and {a} thinks about it.',
    '{a} hung back a little and read the whole line of them from behind.',
    '{a} spent the walk noting who had chosen to be near whom, and remembering it.',
    'A column arranges itself honestly. {a} watched it arrange itself.',
    '{a} counted the pairs on the road out and did not like one of the answers.',
    'Nobody picks who they walk beside by accident, and {a} knows that.',
    '{a} let the column go ahead and looked at the shape of it from the back.',
    'The road sorts people. {a} was reading the sort the whole way.',
  ],
  // Two people who should not be together, are.
  'the-wrong-pair': [
    '{b} was walking with the last person {a} would have paired them with.',
    '{a} looked up the road, saw who {b} had fallen in beside, and thought about it all day.',
    'It is a small thing to notice. {a} noticed it and kept it.',
    '{a} saw {b} walking with somebody {b} has spent all week disagreeing with.',
    'Two people who do not like each other walked a whole mile side by side, and {a} noticed.',
    '{a} could not work out what {b} was doing at that end of the column.',
    'The pairing made no sense from anywhere except one explanation, and {a} got there.',
    '{a} watched {b} fall in beside the last person {a} expected and said nothing.',
    'It is not proof of anything. {a} filed it anyway.',
  ],
  // Somebody is walking alone and that is its own answer.
  'walking-alone': [
    '{b} had the road to themselves for an hour, and not by choosing it.',
    '{a} counted the pairs and got everybody except {b}.',
    'There was a space around {b} the whole way out that nobody stepped into.',
    '{b} walked the whole road out on their own, and {a} was not the only one to see it.',
    'Nobody fell in beside {b}. {a} noticed how quickly that had stopped being an accident.',
    '{b} was alone at the back of the column for an hour, which in this castle is a verdict.',
    '{a} thought about walking with {b} and thought better of it, along with everybody else.',
    'A column of fourteen and {b} in a gap of their own the whole way.',
    '{a} watched the space around {b} and understood exactly what it meant.',
  ],
  'the-gap-in-the-middle': [
    'The column went out in two halves today with thirty yards of nothing between them, and {a} walked in the gap looking at both.',
    '{a} noticed the road had a front group and a back group and that nobody was crossing between them.',
    'It was not a column this morning. It was two of them, and {a} could name who was in each.',
    '{a} watched the gap open over the first mile and stay open for the rest of it.',
    'Two groups, one road, and {b} was the only person who moved between them. {a} was counting.',
    'The shape of it told {a} more than an hour of talking would have: this castle has come apart into two rooms.',
    '{a} spent the walk out working out which half {a} was in, and did not like the answer.',
    'Nobody planned that split and everybody walked it, which is the part {a} keeps turning over.',
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
    const line = pick(rng, COLUMN_SHAPE_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = api.openArc('suspicion', [a, b], { source: sceneWhy, seed: line });
    return { branch, pair: [a, b], speaker: a, respondent: b, topic: b,
      topicKind: 'road-read', threadId: t?.id, bondDelta };
  },
});

const ROAD_FAVOUR_LINES = {
  'took-the-weight': [
    '{a} shifted the load onto {a}\u2019s own shoulder at the gate and said nothing about it.',
    '{b} did not ask and {a} did not wait to be asked.',
    'By the top of the hill {a} had most of it, and neither of them had discussed that.',
    '{a} took the heavy end off {b} at the second stile without being asked.',
    'Somewhere on the hill {a} was carrying {b}’s share and neither of them mentioned it.',
    '{b} was struggling and {a} simply took it, which is not nothing out here.',
    '{a} carried it the last mile and handed it back at the gate without comment.',
    'It was a small thing. {b} has decided to remember it anyway.',
    '{a} did it quietly, which is the only way it counts.',
  ],
  'made-a-point-of-it': [
    '{a} helped, visibly, in front of the people {a} wanted to have seen it.',
    'The generosity was genuine. So was the timing of it.',
    '{a} took the weight where the column was thickest and put it down where it was not.',
    '{a} took the weight off {b} and made sure the column saw it happen.',
    'The help was real and the audience for it was chosen.',
    '{a} carried it, and mentioned carrying it, twice.',
    'It was generous and it was theatre, and {b} could tell which part was which.',
    '{b} said thank you and spent the next mile working out what it had cost.',
    'A favour done loudly is still a favour. It is just also something else.',
  ],
  'let-them-struggle': [
    '{b} carried the whole of it and {a} walked beside {b} carrying nothing.',
    'There was one obvious moment to offer and {a} let it pass.',
    '{a} was close enough the whole way. That is what {b} will remember.',
    '{a} watched {b} struggle with it the whole way and did not offer.',
    'Nobody helped {b}. {a} was closest, and did not.',
    '{a} could have taken it at any point on that road and chose not to.',
    'It was not cruelty. It was a decision, made once and kept for a mile.',
    '{b} managed it alone and noticed exactly who had let them.',
    '{a} walked ahead. {b} arrived last, and carrying everything.',
  ],
  'needed-carrying': [
    'It went the other way today: {a} was the one struggling and {b} took it off {a} without being asked.',
    '{a} could not hold the pace with it and {b} said nothing about that, which is the part {a} will remember.',
    '{a} has been the one helping all week. Today {a} needed it, and {b} was there.',
    '{b} carried {a}\'s load for the last mile and made no comment on why it was necessary.',
    '{a} is not used to being the weak one on a road and did not enjoy finding out.',
    'There is a debt on that road now and it is the wrong way round from how {a} likes it.',
    '{b} slowed to {a}\'s pace for an hour and let {a} keep whatever dignity was left in it.',
    '{a} said thank you once, quietly, and has been thinking about it since.',
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
    const line = pick(rng, ROAD_FAVOUR_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      threadId: thread?.id, cited, bondDelta };
  },
});
