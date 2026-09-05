// ══════════════════════════════════════════════════════════════════════
// tr/castle/alone.js — the scenes one person has
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED, AND IT IS WHERE THE REPETITION ACTUALLY LIVES. Firings per season
// over 40 seasons, the ten busiest branches in the pool:
//
//     2.4  mission-a-body-short:on-their-own
//     2.3  trust-confide-fear:nearly-said-it
//     2.1  grief-toast-to-them:poured-two
//     1.9  susp-overheard-conversation:saw-it-alone
//     1.8  mission-a-name-by-the-time-were-back:alone
//     1.8  susp-alliance-shape-guess:drew-it-alone
//     1.6  night-the-seat-they-had:on-their-own
//     1.6  after-somebody-goes-tonight:alone-with-it
//     1.5  after-the-room-got-it-wrong:alone-with-it
//     1.5  mission-what-cost-us:alone
//
// SEVEN OF THE TEN ARE SOLO BRANCHES. `_sceneActors` convenes ONE person about
// 40% of the time and only a handful of events carry a solo branch, so that
// handful absorbs nearly every solo draw in the season. Those are the lines a
// viewer sees twice.
//
// So these are SOLO-ONLY events: they take exactly one actor and decline a
// pair. That is deliberate targeting rather than a limitation — a pair-capable
// event competes in a bracket that already has thirty entrants, while the solo
// bracket has about eight.
//
// ── AND THREE RULES LEARNED THE EXPENSIVE WAY ────────────────────────
//
// An earlier batch of five events for `evening` was written and reverted. It
// took the repetition ceiling from 3.9% to 7.0%. What it got wrong:
//
//   1. POOLS OF EIGHT. A branch that fires twice a season needs far more than
//      eight lines before a viewer stops recognising them. These carry TWENTY
//      — twelve left the pool-health floor at 0.1333 against a 0.13 band and
//      sixteen left it at exactly 0.130, which is the same measurement saying
//      the same thing more quietly each time. Twenty clears it.
//   2. CONTINUING THREADS. Every `arcContinue` draws a recall card from the
//      composer's own small recall pools, so thread-continuing events multiply
//      repetition somewhere the event cannot see. These OPEN arcs.
//   3. WEIGHTS AT PARITY WITH GATED EVENTS. An ungated event weighted like a
//      gated one becomes the window's most common scene. These sit low.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { peopleLost } from '../state.js';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
const fill = (s, a) => String(s).replace(/\{a\}/g, a);

/** One actor, and only one. The whole point of this file. */
const soloOnly = ctx => (ctx.actors?.length === 1 ? ctx.actors[0] : null);

// ── 1. the walk back, on your own ─────────────────────────────────────

const WALK_BACK_LINES = {
  'went-over-it': [
    '{a} replayed the one moment that mattered until it wore out.',
    'The walk is an hour and {a} spent fifty minutes of it on four seconds.',
    '{a} came back with a question rather than an answer, which is progress of a kind.',
    'Nobody watching would have known {a} was working. {a} was working.',
    '{a} had the whole thing solved by the ford and unsolved again by the gate.',
    '{a} walked back arguing with somebody who was not there.',
    'The afternoon would not sit still for {a}, so {a} kept turning it over.',
    '{a} got two miles before admitting the interesting part had been at the start.',
    '{a} walked the whole way back going over the afternoon one more time.',
    'The road back is long enough to replay a mission twice, and {a} did.',
    '{a} spent the walk deciding which part of that had been a mistake.',
    'Nobody talked to {a} on the way back, so {a} talked to {a}.',
    '{a} rebuilt the whole afternoon out there, in order, looking for the moment.',
    'It is easier to see an hour clearly once you are a mile away from it, and {a} did.',
    '{a} worked out on that road what {a} should have said at the time.',
    'The mission finished at four. {a} was still working on it at six.',
    '{a} came back up the drive with the day sorted into a shape.',
    'Somewhere on that road {a} stopped being annoyed and started being interested.',
    '{a} went over it until it stopped meaning anything, which took most of the walk.',
    'By the gate {a} had a theory, and the theory had a name in it.',
  ],
  'noticed-the-quiet': [
    '{a} has become easy to walk past, and knows the day it started.',
    'The gap in front of {a} stayed exactly the same width for a mile.',
    '{a} said one thing to the group ahead and got a polite nothing back.',
    '{a} would rather have been avoided than simply not thought of.',
    '{a} fell in behind a group and out of it again without anybody adjusting.',
    'The road back has a front and a back, and {a} has learned which end {a} is at.',
    '{a} had an hour to think about why nobody had waited.',
    'Being walked past is quieter than being avoided, and harder to point at.',
    'Nobody fell in beside {a} for the whole road back, and {a} noticed that.',
    '{a} walked back alone and could not tell whether that was a choice anybody had made.',
    'There were thirteen people on that road and {a} spoke to none of them.',
    '{a} counted how many had walked out beside somebody and how many had not.',
    'The column has a shape and {a} has stopped being anywhere near the middle of it.',
    '{a} let two groups pass and neither of them slowed.',
    'It is a small thing to walk back alone. It is a smaller thing every time.',
    '{a} spent the road working out when exactly this had started happening.',
    'Nobody was unkind to {a} on that walk. Nobody was anything at all.',
    '{a} has been in this castle nine days and walked back alone for four of them.',
    'The quiet was not restful and {a} did not pretend it was.',
    '{a} arrived back at the drive a good way behind everybody else.',
  ],
  'let-it-go': [
    '{a} chose not to spend the walk on it, which took more effort than spending it would have.',
    '{a} counted birds. Genuinely, for about a mile.',
    'The day was over and {a} let it be over, an hour before anybody else did.',
    '{a} arrived back with nothing to report and no interest in reporting it.',
    '{a} decided the afternoon was not worth the walk home and stopped carrying it.',
    '{a} spent the road looking at weather rather than at people, deliberately.',
    'It is a long way back and {a} used it for nothing at all, on purpose.',
    '{a} came in through the door without a single thing to say about the day.',
    '{a} put the whole afternoon down somewhere on that road and did not pick it up again.',
    'It stopped mattering about halfway back, and {a} let it stop mattering.',
    '{a} decided out there that it was one bad hour and not a pattern.',
    'The walk did what walks do, and {a} came back easier than {a} left.',
    '{a} looked at the hills for a while and stopped thinking about any of it.',
    'Somewhere past the ford {a} forgave the afternoon.',
    '{a} arrived back genuinely fine, which nobody else quite believed.',
    'It was a long way and {a} spent it thinking about almost nothing.',
    '{a} let the day go and got an hour of not playing out of it.',
    'The one useful thing about a long road is that it ends, and {a} used that.',
    '{a} came in last and in a better mood than the people who came in first.',
    'Whatever went wrong out there, {a} did not carry it up the drive.',
  ],
};

registerEvent({
  id: 'trust-the-walk-back-alone',
  family: 'trust',
  window: 'journey-back',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'strategic', 'social', 'intuition'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    // `journey-back` carries three of the pool's ten busiest branches and all
    // three of them are solo. This competes for exactly those draws.
    return soloOnly(ctx) ? 1.6 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-walk-back-alone');
    const a = ctx.actors[0];
    const st = pStats(a);
    // Is anybody actually close to them? Read off the bond graph rather than
    // rolled — walking back alone means something different to somebody who
    // has friends in the castle than to somebody who does not.
    const friends = (ctx.living || []).filter(n => n !== a && getBond(a, n) > 1).length;
    const scores = {
      'went-over-it': (st.strategic / 10) * 0.45 + (st.intuition / 10) * 0.3,
      'noticed-the-quiet': friends === 0 ? 0.9 : friends === 1 ? 0.45 : 0.15,
      'let-it-go': (st.temperament / 10) * 0.5,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-over-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'noticed-the-quiet' ? 'walked back with nobody beside them'
      : branch === 'let-it-go' ? 'put the afternoon down on the road back'
        : 'went over the afternoon the whole way back';
    const line = fill(pick(rng, WALK_BACK_LINES[branch]), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── 2. the hour before the table ──────────────────────────────────────

const BEFORE_TABLE_LINES = {
  'decided-early': [
    '{a} had it done by the afternoon and spent the evening being careful not to show it.',
    'Somebody asked {a} who {a} was thinking of. {a} said {a} was still deciding.',
    'The evening was a formality {a} sat through politely.',
    '{a} had one name and no doubt, and neither of those is comfortable to carry.',
    '{a} had written the name in {a}’s head before the plates were cleared.',
    'Nothing at that table was going to move {a}, and nothing did.',
    '{a} spent the evening listening to arguments {a} had already discounted.',
    '{a} came to the hall to watch other people decide.',
    '{a} knew what name {a} was writing hours before anybody sat down.',
    'The decision was made before dinner and nothing at the table moved it.',
    '{a} spent the evening not being talked out of something.',
    'Whatever the room said tonight, {a} had finished deciding at about five.',
    '{a} settled it early and spent the rest of the evening watching everybody else.',
    'It was not a hard call for {a}, which is its own kind of information.',
    '{a} has been sure since the morning and has said so to nobody.',
    'The name was chosen before the candles were lit.',
    '{a} let the whole evening happen around a decision already made.',
    'Some people go to the table to find out. {a} went to confirm.',
    '{a} had one name in mind and no interest in a second.',
    'Nothing said between six and nine had any effect on {a} whatsoever.',
  ],
  'still-deciding': [
    '{a} had reasons for both and confidence in neither.',
    '{a} asked two people and came away with more doubt than {a} took in.',
    'The hour ran out before the thinking did.',
    '{a} has been sure three times tonight and unsure four.',
    '{a} had two names and an hour, and used the hour badly.',
    '{a} kept waiting for one more piece and the evening did not provide one.',
    'Nothing tipped it. {a} went down still holding both.',
    '{a} would have taken any excuse to be sure and was not offered one.',
    '{a} went down to the table genuinely not knowing what to write.',
    'Two names, no way to choose between them, and an hour to go.',
    '{a} changed their mind twice before the doors even opened.',
    'It is a bad feeling to walk into that room undecided, and {a} did.',
    '{a} was still arguing with themselves on the stairs.',
    'Nothing {a} knew was enough, and {a} knew that too.',
    '{a} wanted one more hour and did not get one.',
    'The evening gave {a} nothing that helped, and time ran out anyway.',
    '{a} has two names and no reason to prefer either, which is worse than having none.',
    '{a} would rather have been wrong with conviction than right by accident.',
    'By the time the doors opened {a} had settled on nothing at all.',
    '{a} went in hoping the room would decide it for them.',
  ],
  'dreading-it': [
    '{a} has stopped pretending the walk down those stairs is fine.',
    'Somebody is going to be told to leave in an hour and {a} cannot stop counting toward it.',
    '{a} changed twice, which is not about clothes.',
    'The candles get lit at the same time every night and {a} hears it now.',
    '{a} watched the hall fill and wished it would fill slower.',
    'The hour before is the one nobody films, and {a} spent all of it.',
    '{a} has done this six times and it has got worse each time.',
    '{a} washed up twice rather than go down early.',
    '{a} spent the hour before the table not wanting to go to it.',
    'It is one thing to write a name. {a} has to sit opposite it first.',
    '{a} has been in this castle long enough for the table to have stopped being exciting.',
    'The worst hour of the day is the one before, and {a} felt every minute of it.',
    '{a} could not eat before the table and did not pretend otherwise.',
    'Somebody is leaving tonight and {a} has spent the evening knowing that.',
    '{a} sat on the stairs for a while rather than be in the hall.',
    'The room fills up slowly and {a} watched it fill from the doorway.',
    '{a} would have skipped it if skipping it were a thing anybody could do.',
    'It never gets easier and {a} has stopped expecting it to.',
    '{a} was ready an hour early and dreaded every one of the sixty minutes.',
    'Nobody in this building sleeps well on a table night, and {a} has stopped trying.',
  ],
};

registerEvent({
  id: 'grief-the-hour-before-the-table',
  family: 'grief',
  window: 'evening',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['strategic', 'temperament', 'boldness', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    // `evening` is the largest budget in the day and a solo draw there faces
    // 0.51 eligible events against 8.49 for a pair — the worst gap in the pool.
    return soloOnly(ctx) ? 1.6 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-hour-before-the-table');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'decided-early': (st.strategic / 10) * 0.45 + (st.boldness / 10) * 0.25,
      'still-deciding': (1 - st.strategic / 10) * 0.4 + 0.2,
      'dreading-it': (1 - st.temperament / 10) * 0.45 + (st.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'still-deciding';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'decided-early' ? 'had the name settled hours before the table'
      : branch === 'dreading-it' ? 'spent the hour before the table dreading it'
        : 'went down to the table still undecided';
    const line = fill(pick(rng, BEFORE_TABLE_LINES[branch]), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── 3. what one person does with the result ───────────────────────────

const AFTER_RESULT_LINES = {
  'was-right': [
    '{a} was right and the room will never know, which is most of the cost.',
    '{a} allowed themselves about four seconds of it and then put it away.',
    'It confirmed a method as well as a name, and the method is the useful half.',
    '{a} has one true thing now and nobody safe to tell.',
    '{a} had that name days ago and has no way to prove it now.',
    '{a} kept a straight face through the reveal and paid for it later.',
    'One right read, held privately, worth nothing until it is worth everything.',
    '{a} did the sums again afterwards to check it had not been luck.',
    '{a} was right about that one and has told nobody, which is the harder half.',
    'The reveal went the way {a} said it would, and {a} kept a very still face.',
    '{a} has been right once now. It is worth more than it sounds and less than {a} hopes.',
    'Being right in this castle is only useful if somebody remembers you were.',
    '{a} said that name three days ago to nobody, and now cannot prove it.',
    '{a} watched the room react and thought: I had that.',
    'One correct read. {a} is already working out how to spend it.',
    '{a} would like credit and knows exactly how bad asking for it would look.',
    'It is the first thing all week {a} has got right, and it happened in private.',
    '{a} did not say I told you so, at considerable personal cost.',
    'The satisfaction lasted about a minute and then turned into arithmetic.',
    '{a} was right, and being right has made {a} more frightened rather than less.',
  ],
  'was-wrong': [
    '{a} spent the night finding out how much had been built on one bad read.',
    '{a} said that name out loud to two people and both of them remember.',
    'Being confidently wrong is the expensive kind, and {a} was.',
    '{a} will hedge everything for the next three days because of tonight.',
    '{a} had built a week on that read and spent the night dismantling it.',
    'The name came back clean and took most of {a}’s confidence with it.',
    '{a} has to decide now whether to say so or let the room forget.',
    '{a} went back through it twice and still cannot find the wrong turn.',
    '{a} was wrong, in front of everybody, and has to sit with that until morning.',
    'The reveal went the other way and {a} has spent since then rebuilding everything.',
    '{a} pushed that name hard and the name was clean.',
    'Everything {a} thought about this game was built on that read, and the read was wrong.',
    '{a} has to work out now which of the other things {a} believes came from the same place.',
    'It is not the mistake that costs you. It is that the room watched you make it.',
    '{a} spent the evening quietly taking a theory apart.',
    'Wrong, and loudly wrong, which is the version that follows you.',
    '{a} will be more careful now, which is exactly what the pact wanted.',
    'One bad read and {a} has stopped trusting {a}.',
    '{a} apologised to nobody in particular, twice.',
    'The worst part is that {a} still cannot see where the reasoning went wrong.',
  ],
  'counting-the-cost': [
    '{a} did the right thing and has been sitting with it since.',
    'The room is one person smaller and {a} signed for it.',
    '{a} keeps arriving at the same total and keeps recounting.',
    'It was not a mistake. {a} would just rather it had been somebody else’s.',
    '{a} got the result {a} wanted and did not enjoy a minute of it.',
    '{a} sat with a correct vote and a person who is not here any more.',
    'The arithmetic worked. {a} did not sleep on it any better for that.',
    '{a} has started counting the cost in people, which is a bad habit to acquire here.',
    '{a} sat with the result and worked out what it had cost, in people rather than points.',
    'Somebody {a} liked is gone and {a} helped, and both of those are true at once.',
    '{a} wrote that name for good reasons and has spent the evening testing them again.',
    'It was the right vote and it does not feel like one, and {a} cannot make those meet.',
    '{a} has stopped being able to tell the difference between a good read and a convenient one.',
    'The room got a result. {a} got a person who is not there any more.',
    '{a} would do it again and would rather not have to.',
    'It is one thing to play this properly and another to be the person who did.',
    '{a} is not sure any more which of those two {a} is being.',
    'Nobody made {a} write it. That is the part that stays.',
    '{a} counted what the week has taken and included themselves in the total.',
    'The vote was correct. {a} sat up a while with it anyway.',
  ],
};

registerEvent({
  id: 'susp-what-one-person-does-with-it',
  family: 'suspicion',
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'temperament', 'loyalty', 'strategic'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    // `after-table` spends the least of its budget of any window and two of the
    // pool's busiest branches are its solo ones.
    if (!soloOnly(ctx)) return 0;
    // There has to have been a result to sit with.
    return peopleLost(gs) >= 1 ? 1.6 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-what-one-person-does-with-it');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'was-right': (st.intuition / 10) * 0.5 + (st.strategic / 10) * 0.2,
      'was-wrong': (1 - st.intuition / 10) * 0.45 + 0.15,
      'counting-the-cost': (st.loyalty / 10) * 0.4 + (1 - st.temperament / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'was-wrong';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'was-right' ? 'was right about a name and said nothing'
      : branch === 'was-wrong' ? 'was wrong about a name in front of everybody'
        : 'counted what the vote had cost';
    const line = fill(pick(rng, AFTER_RESULT_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});
