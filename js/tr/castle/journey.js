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
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { openThread, advanceThread, closeThread, findOpenThread, continueThread,
  advanceCiting, heatAt } from '../threads.js';
import { alignmentAt } from '../roles.js';
import { MAX_ACTIVE_ROMANCES, _activeRomanceCount, _threadForActors } from './romance.js';
import { _sentenceCase } from './cover.js';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

/** How many people the castle has already lost, from the round record. */
function _deaths() { return (gs.tr?.rounds || []).filter(r => r.murdered).length; }

// ══════════════════════════════════════════════════════════════════════
// journey-out — the walk away from the castle
// ══════════════════════════════════════════════════════════════════════

const STEP_LINES = {
  confided: [
    '{b} fell into step with {a} on the way out and said more in ten minutes of walking than in three days indoors.',
    'Out of the castle\'s hearing, {b} told {a} the thing they had been carrying around all week.',
    'Walking put {b} at ease in a way the great hall never had, and {a} got the honest version.',
  ],
  probed: [
    '{b} kept pace with {a} the whole way out and asked questions the whole way out with it.',
    'Somewhere on the road {a} realised {b} had been steering the conversation since the gate.',
    '{b} spent the walk taking {a} apart very politely, one small question at a time.',
  ],
  quiet: [
    '{a} and {b} walked the whole way without saying much, and neither of them minded.',
    '{b} had nothing to say on the road out, and {a} decided not to fill the gap.',
    'It was a long walk and {b} spent it inside their own head, with {a} beside them.',
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Nobody walks the whole road beside someone they are actively hostile to.
    return getBond(a, b) >= 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const confideScore = (st.loyalty / 10) * 0.5 + (st.social / 10) * 0.5;
    const probeScore = (st.strategic / 10) * 0.5 + (st.intuition / 10) * 0.5;
    const quietScore = (1 - st.social / 10) * 0.7 + 0.15;
    const total = confideScore + probeScore + quietScore;
    const roll = rng() * total;
    let branch;
    if (roll < confideScore) branch = 'confided';
    else if (roll < confideScore + probeScore) branch = 'probed';
    else branch = 'quiet';

    const bondDelta = branch === 'confided' ? 2 : branch === 'probed' ? -0.5 : 0.5;
    addBond(a, b, bondDelta);
    const line = pick(rng, STEP_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const { thread, cited } = continueThread('trust', [a, b], ctx.ep, line);
    return { branch, pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

const EARSHOT_LINES = {
  agreed: [
    '{a} waited until the castle was out of sight to say {c}\'s name, and {b} said they had been thinking it too.',
    'Off the path, {a} finally said what they thought about {c}. {b} did not need convincing.',
    '{a} tried the theory about {c} out on {b} where nobody could overhear it, and it landed.',
  ],
  hedged: [
    '{a} floated {c}\'s name on the road and {b} neither agreed nor argued, which {a} noticed.',
    'Out of earshot {a} named {c}. {b} said "maybe" and changed the subject before the next bend.',
    '{a} put {c} in front of {b} and got a shrug for it, and walked the rest of the way wondering why.',
  ],
  defended: [
    '{a} said {c}\'s name out on the road and {b} shut it down flat.',
    '{b} would not have a word said about {c}, not even out here where nobody was listening.',
    '{a} learned something on that walk, and it was about {b}, not about {c}.',
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    // You need somebody you can say it to. A warm pair says it; a hostile one
    // walks in silence and this is not their scene.
    return getBond(a, b) >= 1 ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : ctx.living);
    const st = pStats(b);
    // What `b` does with a name said out loud: a sharp, ambitious player takes
    // it and builds; a cautious one refuses to commit to anything; a loyal one
    // defends. Nothing here reads who anybody actually is.
    const agreeScore = (st.intuition / 10) * 0.5 + (st.strategic / 10) * 0.5;
    const hedgeScore = (1 - st.boldness / 10) * 0.6 + 0.2;
    const defendScore = (st.loyalty / 10) * 0.6 + Math.max(0, getBond(b, target)) / 10 * 0.4;
    const total = agreeScore + hedgeScore + defendScore;
    const roll = rng() * total;
    let branch;
    if (roll < agreeScore) branch = 'agreed';
    else if (roll < agreeScore + hedgeScore) branch = 'hedged';
    else branch = 'defended';

    const bondDelta = branch === 'agreed' ? 1.5 : branch === 'hedged' ? 0 : -1;
    if (bondDelta) addBond(a, b, bondDelta);
    const line = pick(rng, EARSHOT_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, target);
    // The thread is the PAIR's — what these two now share is that one of them
    // said a name to the other, which is a fact about the two of them.
    const { thread, cited } = continueThread('suspicion', [a, b], ctx.ep, line);
    return { branch, pair: [a, b], about: target, threadId: thread?.id, cited, bondDelta };
  },
});

const ROAD_REHEARSAL_LINES = {
  airtight: [
    '{a} used the walk to run their own story back through, start to finish, and could not find a seam in it.',
    'By the time the castle was out of sight {a} had the whole account smooth enough to say in their sleep.',
    '{a} spent the road out rehearsing, and came off it with an answer for every question anybody had left.',
  ],
  serviceable: [
    '{a} went over their story on the walk and got most of it to hold, which would have to do.',
    'There was one part {a} still could not say twice the same way, and the road ran out before it was fixed.',
    '{a} practised until the account was good enough, and tried not to think about the part that was not.',
  ],
  overcooked: [
    '{a} rehearsed the story so many times on the way out that it stopped sounding like something that happened.',
    'By the last mile {a}\'s account had grown three details it did not need and could not lose.',
    '{a} polished it past the point of being believable and knew it, and could not stop.',
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
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    return ctx.actors.some(n => isTraitor(n, ctx.ep)) ? 2 : 0;
  },
  fire(ctx, rng) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    // Competence, not permission: the role already granted the scene.
    const tightScore = (st.strategic / 10) * 0.5 + (st.mental / 10) * 0.5;
    const okScore = 0.5;
    const overScore = (1 - st.temperament / 10) * 0.6 + 0.15;
    const total = tightScore + okScore + overScore;
    const roll = rng() * total;
    let branch;
    if (roll < tightScore) branch = 'airtight';
    else if (roll < tightScore + okScore) branch = 'serviceable';
    else branch = 'overcooked';

    const line = pick(rng, ROAD_REHEARSAL_LINES[branch]).replace(/\{a\}/g, actor);
    const { thread, cited } = continueThread('cover', [actor], ctx.ep, line);
    return { branch, actor, threadId: thread?.id, cited };
  },
});

const WALK_PICK_LINES = {
  flattered: [
    '{a} chose {b} to walk with instead of the obvious person, and {b} spent the road visibly pleased about it.',
    '{b} had not expected to be picked, and did not hide how much it landed.',
    '{a} dropped back to walk with {b}, and {b} took it as exactly what it looked like.',
  ],
  wary: [
    '{a} chose {b} to walk with, and {b} spent the whole road working out why.',
    '{b} noticed they had been picked and did not once believe it was an accident.',
    '{a} fell in beside {b}, and {b} answered every question with a shorter question.',
  ],
  transactional: [
    '{b} understood the pick immediately, priced it, and started talking about what happened at the next vote.',
    '{a} picked {b} for the walk and {b} had turned it into an arrangement before the first hill.',
    '{b} accepted the company and made sure {a} knew what it would be worth later.',
  ],
};

// WHO YOU WALK WITH IS A TEST, and the test is on the person picked: the pick
// itself says something, and what they do with it says more.
registerEvent({
  id: 'testing-who-you-walk-with',
  family: 'testing',
  window: 'journey-out',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 4) return 0;
    return 2;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const flatterScore = (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.5;
    const waryScore = (st.intuition / 10) * 0.6 + (1 - st.temperament / 10) * 0.4;
    const dealScore = (st.strategic / 10) * 0.6 + (1 - st.loyalty / 10) * 0.4;
    const total = flatterScore + waryScore + dealScore;
    const roll = rng() * total;
    let branch;
    if (roll < flatterScore) branch = 'flattered';
    else if (roll < flatterScore + waryScore) branch = 'wary';
    else branch = 'transactional';

    const bondDelta = branch === 'flattered' ? 2 : branch === 'wary' ? -0.5 : 0.5;
    addBond(a, b, bondDelta);
    const line = pick(rng, WALK_PICK_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = openThread('testing', [a, b], ctx.ep, line);
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
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
  ],
  'solo-again': [
    '{a} had stopped counting the people on the road out, and hated that they knew the number anyway.',
    'The column out of the gate got shorter every time, and {a} had started walking at the back of it.',
    '{a} looked at how few of them were on the road now and could remember every single gap in it.',
    'There was more road than people by this point, and {a} was the only one who said anything about it.',
  ],
  'pair-first': [
    'The group leaving was shorter than last time. {a} said it out loud and {b} only nodded.',
    '{a} and {b} both clocked how much smaller the column out of the gate had got.',
    'Neither {a} nor {b} said anything about it, but both of them counted the road out.',
    '{a} caught {b} looking back at the gate to check the number, and did not mention it.',
  ],
  'pair-again': [
    '{a} and {b} had both stopped counting out loud, which was its own way of counting.',
    'The road out was shorter again. {a} started to say so and {b} said they already knew.',
    '{a} and {b} walked out through a gate that used to be crowded, and neither of them filled the silence.',
    'By now {a} and {b} could have named everybody missing from the road without stopping to think.',
  ],
};

// SOLO-CAPABLE ON PURPOSE. `_sceneActors` draws one actor about 40% of the
// time when it is not walking a live thread into the room, and a window whose
// whole pool demands a pair simply returns nothing on those draws — content
// that exists and is skipped, which is the failure the reachability sweep is
// for. Two of this window's events take a lone actor.
registerEvent({
  id: 'grief-shorter-column',
  family: 'grief',
  window: 'journey-out',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // The castle has to have lost somebody for the road to be shorter.
    return _deaths() >= 1 ? 2 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const deaths = _deaths();
    const branch = `${b ? 'pair' : 'solo'}-${deaths >= 2 ? 'again' : 'first'}`;
    const line = _sentenceCase(pick(rng, SHORT_COLUMN_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b || 'somebody'));
    if (b) addBond(a, b, 1);
    const parties = b ? [a, b] : [a];
    const t = openThread('grief', parties, ctx.ep, line);
    return { branch, actors: [...ctx.actors], deaths,
      threadId: t?.id, bondDelta: b ? 1 : 0 };
  },
});


const ROAD_SPARK_LINES = [
  '{a} and {b} walked the whole road out beside each other and neither of them had planned it that way.',
  'Out of the castle and away from everybody, {a} and {b} talked about nothing in particular for two hours.',
  'Somewhere on the road out {a} said something small and stupid and {b} laughed longer than it deserved.',
];

// A SECOND ENTRY POINT FOR ROMANCE, AND IT IS A FIX, NOT A FLOURISH.
//
// `romance-spark` (romance.js, `evening`) is the ONLY door into this family:
// every escalation, reaction and payoff downstream is gated on a spark or
// showmance thread that only it can open. That made the whole family a
// function of how many draws `evening` gets — and populating three empty
// windows takes draws away from `evening`, because the round budget is 4-8
// for the WHOLE round and journey-out/journey-back/night were previously
// giving their share back. Measured on 200 seasons: adding the rest of this
// file dropped romance from 202 firings to 128 and pushed
// `romance-jealousy-third-party` to 2 firings per 400 seasons, under the
// reachability floor. A single door in the most contested window is the
// actual fragility; a second door in an uncontested one is the fix.
//
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
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    if (findOpenThread('romance-spark', [a, b]) || findOpenThread('romance-showmance', [a, b])) return 0;
    if (!romanticCompat(a, b)) return 0;
    if (_activeRomanceCount() >= MAX_ACTIVE_ROMANCES) return 0;
    const bond = getBond(a, b);
    return bond >= 0 ? 1.2 + bond * 0.25 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const note = pick(rng, ROAD_SPARK_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = openThread('romance-spark', [a, b], ctx.ep, note);
    return { branch: 'road-spark', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

// ══════════════════════════════════════════════════════════════════════
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
  ],
  dropped: [
    '{a} decided somewhere on the way back that it was not worth carrying and let it go.',
    'Neither {a} nor {b} raised it again on the road home. It was simply over.',
    'The walk back was long enough for {a} to talk themselves out of it entirely.',
  ],
  soured: [
    'It came apart on the walk back. {b} said the wrong thing and {a} stopped pretending.',
    'Whatever {a} and {b} had, it did not survive the road home.',
    '{b} pushed it one sentence too far on the way back, and {a} was done.',
  ],
  unresolved: [
    'They talked the whole way back and settled nothing, and both of them knew it.',
    '{a} and {b} got to the gate with the same question still open between them.',
    'The castle came back into view before {a} and {b} had got anywhere near the end of it.',
  ],
};

// FOUR BRANCHES, THREE OF THEM CLOSE. This is the single biggest lever on the
// pool's payoff rate: an open trust story between two people who are walking
// home together either gets settled here or is explicitly carried on.
registerEvent({
  id: 'trust-settled-on-the-way-back',
  family: 'trust',
  window: 'journey-back',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // There has to be something to settle. No open trust story, no scene.
    return findOpenThread('trust', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
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
    if (bondDelta) addBond(a, b, bondDelta);

    // The unresolved branch is a real beat and writes one; the other three end
    // the story. `advanceCiting` first, THEN close: the citation has to be
    // written into the last beat or the payoff carries no memory of what it is
    // paying off.
    const { note, cited } = advanceCiting(thread, ctx.ep, line);
    let outcome = null;
    if (branch === 'held') outcome = 'passed-clean';
    else if (branch === 'dropped') outcome = 'buried';
    else if (branch === 'soured') outcome = 'turned-back';
    if (outcome) closeThread(thread.id, ctx.ep, outcome);
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

const LET_IT_GO_LINES = {
  cleared: [
    'On the road back {b} answered it, properly, and {a} could not find anything wrong with the answer.',
    '{b} finally gave {a} the whole account on the walk home, and it held together.',
    'By the gate {a} had run out of ways to make {b} look guilty, and said so.',
  ],
  slipped: [
    'It was a long walk and {b} talked too much on it. {a} got something out of it that {b} did not mean to give.',
    'Somewhere on the road home {b} said one sentence too many, and {a} heard it.',
    'The walk back went on long enough that {b} contradicted themselves, and {a} was still listening.',
  ],
  hardened: [
    'Nothing about the walk back changed {a}\'s mind about {b}, and {b} could tell.',
    '{b} spent the road home defending themselves to {a}, and made it worse with every mile.',
    'By the time the castle came back into view {a} was more certain about {b}, not less.',
  ],
};

registerEvent({
  id: 'susp-let-it-go-on-the-road-back',
  family: 'suspicion',
  window: 'journey-back',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread('suspicion', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // The SUSPECTED player is the one under test — how well they hold up over
    // a long walk with nothing to do but be asked about it.
    const clearScore = (st.temperament / 10) * 0.5 + (st.social / 10) * 0.5;
    const slipScore = (1 - st.temperament / 10) * 0.6 + (1 - st.mental / 10) * 0.4;
    const hardenScore = 0.45;
    const total = clearScore + slipScore + hardenScore;
    const roll = rng() * total;
    let branch;
    if (roll < clearScore) branch = 'cleared';
    else if (roll < clearScore + slipScore) branch = 'slipped';
    else branch = 'hardened';

    const line = pick(rng, LET_IT_GO_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread('suspicion', [a, b]);
    const bondDelta = branch === 'cleared' ? 2 : branch === 'slipped' ? -2 : -1;
    addBond(a, b, bondDelta);
    const { note, cited } = advanceCiting(thread, ctx.ep, line);
    const outcome = branch === 'cleared' ? 'denied-convincingly'
      : branch === 'slipped' ? 'confessed-unrelated' : null;
    if (outcome) closeThread(thread.id, ctx.ep, outcome);
    return { branch, pair: [a, b], threadId: thread.id, cited, note, outcome, bondDelta };
  },
});

const STORY_SURVIVED_LINES = {
  held: [
    'A whole day out of the castle and nobody caught {a} in anything. The story was still standing at the gate.',
    '{a} got through the entire journey without having to change a single word of it.',
    'By the walk home {a} had stopped bracing for the question, because it never came.',
  ],
  frayed: [
    '{a} had to patch it twice on the road and neither patch was clean.',
    'The story got {a} home, but it had lost a piece somewhere out there.',
    '{a} spent the walk back quietly listing everything they would have to remember differently now.',
  ],
  // THE ACCOUNT COMES APART, NOT THE PERSON. This branch closes the cover
  // THREAD with `exposed`, and a sentence implying the room now knows what
  // {a} is would be the engine claiming a fact no belief anywhere holds -
  // castle events write zero beliefs, so nobody in the castle learned
  // anything here except that one story stopped working.
  broke: [
    'Somebody asked the one question on the road back, and {a} did not have an answer that matched the last one.',
    'The account came apart in the open, hours from the castle, and {a} had nothing to put in its place.',
    '{a} heard their own story fall over on the walk home and could not pick it back up.',
  ],
};

registerEvent({
  id: 'cover-story-survived-the-day',
  family: 'cover',
  window: 'journey-back',
  threadScope: 'solo',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    return findOpenThread('cover', [actor]) ? 3 : 0;
  },
  fire(ctx, rng) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    const holdScore = (st.strategic / 10) * 0.5 + (st.temperament / 10) * 0.5;
    const frayScore = 0.5;
    const breakScore = (1 - st.mental / 10) * 0.5 + (1 - st.temperament / 10) * 0.5;
    const total = holdScore + frayScore + breakScore;
    const roll = rng() * total;
    let branch;
    if (roll < holdScore) branch = 'held';
    else if (roll < holdScore + frayScore) branch = 'frayed';
    else branch = 'broke';

    const line = pick(rng, STORY_SURVIVED_LINES[branch]).replace(/\{a\}/g, actor);
    const thread = findOpenThread('cover', [actor]);
    const { note, cited } = advanceCiting(thread, ctx.ep, line);
    // A cover story that held is retired clean; one that came apart in front
    // of people is `exposed`, which reads as `cracked` to anything downstream.
    const outcome = branch === 'held' ? 'passed-clean' : branch === 'broke' ? 'exposed' : null;
    if (outcome) closeThread(thread.id, ctx.ep, outcome);
    // The Traitor whose story broke in the open loses standing with whoever
    // walked back beside them — the one observable consequence available here
    // without touching a belief.
    let bondDelta = 0;
    const witness = ctx.actors.find(n => n !== actor);
    if (witness && branch === 'broke') { bondDelta = -1.5; addBond(actor, witness, bondDelta); }
    return { branch, actor, threadId: thread.id, cited, note, outcome, witness: witness || null, bondDelta };
  },
});

const CASTLE_IN_VIEW_LINES = {
  buried: [
    '{a} and {b} talked about the ones who were gone the whole way back, and by the gate they had said everything there was.',
    'Somewhere on the road home {a} and {b} stopped talking about the dead and started talking about tomorrow.',
    'They left it out there on the road. {a} and {b} came back through the gate lighter than they went out.',
  ],
  carried: [
    'The castle came back into view and {a} felt the whole thing land on them again, with {b} right there.',
    '{a} and {b} had almost stopped thinking about it, and then they saw the roof.',
    'Coming back through the gate put it straight back on {a} and {b} both.',
  ],
};

registerEvent({
  id: 'grief-castle-in-view',
  family: 'grief',
  window: 'journey-back',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread('grief', ctx.actors) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(a);
    // Whether a person can put a death down is temperament and how much of it
    // they were carrying to begin with.
    const buryScore = (st.temperament / 10) * 0.6 + 0.2;
    const carryScore = (st.loyalty / 10) * 0.5 + (1 - st.temperament / 10) * 0.5;
    const roll = rng() * (buryScore + carryScore);
    const branch = roll < buryScore ? 'buried' : 'carried';

    const line = pick(rng, CASTLE_IN_VIEW_LINES[branch]).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const thread = findOpenThread('grief', [a, b]);
    const bondDelta = branch === 'buried' ? 1.5 : 1;
    addBond(a, b, bondDelta);
    const { note, cited } = advanceCiting(thread, ctx.ep, line);
    if (branch === 'buried') closeThread(thread.id, ctx.ep, 'buried');
    return { branch, pair: [a, b], threadId: thread.id, cited, note,
      outcome: branch === 'buried' ? 'buried' : null, bondDelta };
  },
});

const WALKED_BACK_LINES = [
  '{a} and {b} were the last two through the gate, and neither of them had been walking fast.',
  'The road back took {a} and {b} longer than it took anybody else, and nobody said anything about it.',
  '{a} and {b} came in from the road still talking, hours after they had run out of things to say.',
];

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
  fire(ctx, rng) {
    const kind = _threadForActors('romance-showmance', ctx.actors) ? 'romance-showmance' : 'romance-spark';
    const thread = _threadForActors(kind, ctx.actors);
    const [a, b] = thread.parties;
    addBond(a, b, 2);
    const line = pick(rng, WALKED_BACK_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const advanced = advanceThread(thread.id, ctx.ep, line);
    return { branch: 'walked-back-together', pair: [a, b], kind,
      threadId: advanced?.id ?? thread.id, bondDelta: 2 };
  },
});

const CAME_BACK_HOLDING_LINES = [
  '{a} and {b} came back through the gate close enough together that nobody in the courtyard had to ask.',
  'Whatever the road did to {a} and {b}, they walked back in as a pair and stopped pretending otherwise.',
  'They were the last two in off the road, and by the time {a} and {b} reached the gate it was not a secret any more.',
  '{a} and {b} did not announce it. They did not have to; the whole castle watched them come back up the path.',
];

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
    // that fizzled three rounds ago.
    return t && heatAt(t, ctx.ep) > 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const spark = _threadForActors('romance-spark', ctx.actors);
    const [a, b] = spark.parties;
    closeThread(spark.id, ctx.ep, 'became-showmance');
    addBond(a, b, 2);
    const note = pick(rng, CAME_BACK_HOLDING_LINES).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
    const t = openThread('romance-showmance', [a, b], ctx.ep, note);
    return { branch: 'showmance-on-the-road', pair: [a, b], threadId: t?.id,
      outcome: 'became-showmance', bondDelta: 2 };
  },
});

// Nothing below this line: `night` events live with their families, because
// night is a room in the castle and the road is not.
export const JOURNEY_WINDOWS = ['journey-out', 'journey-back'];
