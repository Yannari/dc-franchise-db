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
import { pStats, pronouns } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { peopleLost } from '../state.js';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
/**
 * SOLO SCENES NEED PRONOUNS AND THE PAIR-SHAPED LIBRARY NEVER DID. Every other
 * file in this directory alternates {a} and {b}, so a name does not repeat
 * inside one sentence and a name-only substitution reads fine. A ONE-ACTOR
 * scene has only {a}, and the same substitution printed
 *
 *     "Chris McLean came back knowing what Chris McLean was going to write,
 *      days before Chris McLean has to write it."
 *
 * and, worse, "{a}self" as "Beardoself". So {a} is the name, used once, and
 * {sub}/{Sub}/{obj}/{posAdj}/{pos}/{ref} are that person's pronouns for every
 * reference after it. `pronouns()` has no `Pos` — see the project rules.
 */
const fill = (s, a) => {
  const p = pronouns(a);
  return String(s).replace(/\{a\}/g, a)
    .replace(/\{Sub\}/g, p.Sub).replace(/\{sub\}/g, p.sub)
    .replace(/\{obj\}/g, p.obj).replace(/\{posAdj\}/g, p.posAdj)
    .replace(/\{pos\}/g, p.pos).replace(/\{ref\}/g, p.ref);
};

/** One actor, and only one. The whole point of this file. */
const soloOnly = ctx => (ctx.actors?.length === 1 ? ctx.actors[0] : null);

// ── 1. the walk back, on your own ─────────────────────────────────────

const WALK_BACK_LINES = {
  'went-over-it': [
    '{a} replayed the one moment that mattered until it wore out.',
    'The walk is an hour and {a} spent fifty minutes of it on four seconds.',
    '{a} came back with a question rather than an answer, which is progress of a kind.',
    'Nobody watching would have known {a} was working. {Sub} was working.',
    '{a} had the whole thing solved by the ford and unsolved again by the gate.',
    '{a} walked back arguing with somebody who was not there.',
    'The afternoon would not sit still for {a}, so {sub} kept turning it over.',
    '{a} got two miles before admitting the interesting part had been at the start.',
    '{a} walked the whole way back going over the afternoon one more time.',
    'The road back is long enough to replay a mission twice, and {a} did.',
    '{a} spent the walk deciding which part of that had been a mistake.',
    'Nobody talked to {a} on the way back, so {sub} talked to {ref}.',
    '{a} rebuilt the whole afternoon out there, in order, looking for the moment.',
    'It is easier to see an hour clearly once you are a mile away from it, and {a} did.',
    '{a} worked out on that road what {sub} should have said at the time.',
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
    'The road back has a front and a back, and {a} has learned which end {sub} is at.',
    '{a} had an hour to think about why nobody had waited.',
    'Being walked past is quieter than being avoided, and harder to point at.',
    'Nobody fell in beside {a} for the whole road back, and {sub} noticed that.',
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
    'The walk did what walks do, and {a} came back easier than {sub} left.',
    '{a} looked at the hills for a while and stopped thinking about any of it.',
    'Somewhere past the ford {a} forgave the afternoon.',
    '{a} arrived back genuinely fine, which nobody else quite believed.',
    'It was a long way and {a} spent it thinking about almost nothing.',
    '{a} let the day go and got an hour of not playing out of it.',
    'The one useful thing about a long road is that it ends, and {a} used that.',
    '{a} came in last and in a better mood than the people who came in first.',
    'Whatever went wrong out there, {a} did not carry it up the drive.',
  ],
  'worked-out-a-move': [
    'By the time the gate came up {a} had decided what to do tomorrow, and it is not nothing.',
    '{a} used the whole road to build something and arrived home with a plan in it.',
    'An hour of walking is an hour of thinking nobody can interrupt, and {a} spent all of it.',
    '{a} went out with a problem and came back with a sequence of moves.',
    'Somewhere around the halfway mark it stopped being worry and started being arithmetic.',
    '{a} worked out who to talk to first, and what to say, and what to leave out.',
    'The road home is the only place in this game with no audience, and {a} used it as an office.',
    '{a} reached the drive with the whole of tomorrow already decided.',
    'It is a good plan. {a} will find out this week whether it survives other people.',
    '{a} spent the walk choosing between two names and chose.',
    'By the last mile {a} had stopped rehearsing feelings and started rehearsing sentences.',
    '{a} came home quieter than {sub} left, and considerably more dangerous.',
  ],
};

registerEvent({
  id: 'trust-the-walk-back-alone',
  family: 'trust',
  window: 'journey-back',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'strategic', 'social', 'intuition', 'mental'],
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
      'worked-out-a-move': (st.mental / 10) * 0.35 + (st.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-over-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'worked-out-a-move' ? 'used the road home to build a plan'
      : branch === 'noticed-the-quiet' ? 'walked back with nobody beside them'
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
    'Somebody asked {a} who {sub} was thinking of. {Sub} said {sub} was still deciding.',
    'The evening was a formality {a} sat through politely.',
    '{a} had one name and no doubt, and neither of those is comfortable to carry.',
    '{a} had written the name in {posAdj} head before the plates were cleared.',
    'Nothing at that table was going to move {a}, and nothing did.',
    '{a} spent the evening listening to arguments {sub} had already discounted.',
    '{a} came to the hall to watch other people decide.',
    '{a} knew what name {sub} was writing hours before anybody sat down.',
    'The decision was made before dinner and nothing at the table moved it.',
    '{a} spent the evening not being talked out of something.',
    'Whatever the room said tonight, {a} had finished deciding at about five.',
    '{a} settled it early and spent the rest of the evening watching everybody else.',
    'It was not a hard call for {a}, and that told {obj} something too.',
    '{a} has been sure since the morning and has said so to nobody.',
    'The name was chosen before the candles were lit.',
    '{a} let the whole evening happen around a decision already made.',
    'Some people go to the table to find out. {a} went to confirm.',
    '{a} had one name in mind and no interest in a second.',
    'Nothing said between six and nine had any effect on {a} whatsoever.',
  ],
  'still-deciding': [
    '{a} had reasons for both and confidence in neither.',
    '{a} asked two people and came away with more doubt than {sub} took in.',
    'The hour ran out before the thinking did.',
    '{a} has been sure three times tonight and unsure four.',
    '{a} had two names and an hour, and used the hour badly.',
    '{a} kept waiting for one more piece and the evening did not provide one.',
    'Nothing tipped it. {a} went down to the table still torn between two names.',
    '{a} would have taken any excuse to be sure and was not offered one.',
    '{a} went down to the table genuinely not knowing what to write.',
    'Two names, no way to choose between them, and an hour to go.',
    '{a} changed their mind twice before the doors even opened.',
    'It is a bad feeling to walk into that room undecided, and {a} did.',
    '{a} was still arguing with themselves on the stairs.',
    'Nothing {a} knew was enough, and {sub} knew that too.',
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
  'not-worried-tonight': [
    '{a} does not expect to hear {posAdj} own name tonight and is behaving accordingly.',
    '{a} spent the hour before the table relaxed, which means {a} does not expect tonight to be about {obj}.',
    '{a} ate a full meal before the table, unhurried, the way people eat when they do not expect to hear their own name.',
    '{a} spent the hour being pleasant to people rather than counting them.',
    '{a} is not frightened tonight, and it shows in the way {a} moves through the room.',
    '{a} has enough people in this room and knows roughly how many that is.',
    '{a} was the only one talking about something other than the vote.',
    'It may be confidence and it may be complacency, and {a} cannot tell which either.',
    '{a} has not been named all week and has started, quietly, to expect that to hold.',
    '{a} watched other people be frightened and felt something uncomfortably close to comfort.',
    '{a} will go down those stairs the way you go down stairs on an ordinary evening.',
    'Somebody in this castle is having an easy hour and it is {a}.',
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
      'not-worried-tonight': (st.temperament / 10) * 0.3 + (st.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'still-deciding';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'not-worried-tonight' ? 'spent the hour before the table entirely unworried'
      : branch === 'decided-early' ? 'had the name settled hours before the table'
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
    'The reveal went the way {a} said it would, and {sub} kept a very still face.',
    '{a} has been right once now. It is worth more than it sounds and less than {sub} hopes.',
    'Being right in this castle is only useful if somebody remembers you were.',
    '{a} said that name three days ago to nobody, and now cannot prove it.',
    '{a} watched the room react and thought: I had that.',
    'One correct read. {a} is already working out how to spend it.',
    '{a} would like credit and knows exactly how bad asking for it would look.',
    'It is the first thing all week {a} has got right, and it happened in private.',
    '{a} did not say I told you so, at considerable personal cost.',
    'The satisfaction lasted about a minute and then turned into arithmetic.',
    '{a} was right, and being right has made {sub} more frightened rather than less.',
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
    '{a} has to work out now which of the other things {sub} believes came from the same place.',
    'It is not the mistake that costs you. It is that the room watched you make it.',
    '{a} spent the evening quietly taking a theory apart.',
    'Wrong, and loudly wrong, which is the version that follows you.',
    '{a} will be more careful now, which is exactly what the pact wanted.',
    'One bad read and {a} has stopped trusting {ref}.',
    '{a} apologised to nobody in particular, twice.',
    'The worst part is that {a} still cannot see where the reasoning went wrong.',
  ],
  'counting-the-cost': [
    '{a} did the right thing and has been sitting with it since.',
    'The room is one person smaller and {a} signed for it.',
    '{a} keeps arriving at the same total and keeps recounting.',
    'It was not a mistake. {a} would just rather it had been somebody else’s.',
    '{a} got the result {sub} wanted and did not enjoy a minute of it.',
    '{a} sat with a correct vote and a person who is not here any more.',
    'The arithmetic worked. {a} did not sleep on it any better for that.',
    '{a} has started counting the cost in people, which is a bad habit to acquire here.',
    '{a} sat with the result and worked out what it had cost, in people rather than points.',
    'Somebody {a} liked is gone and {sub} helped, and both of those are true at once.',
    '{a} wrote that name for good reasons and has spent the evening testing them again.',
    'It was the right vote and it does not feel like one, and {a} cannot make those meet.',
    '{a} has stopped being able to tell the difference between a good read and a convenient one.',
    'The room got a result. {a} got a person who is not there any more.',
    '{a} would do it again and would rather not have to.',
    'It is one thing to play this properly and another to be the person who did.',
    '{a} is not sure any more which of those two {sub} is being.',
    'Nobody made {a} write it. That is the part that stays.',
    '{a} counted what the week has taken and included themselves in the total.',
    'The vote was correct. {a} sat up a while with it anyway.',
  ],
  'voted-against-the-room': [
    '{a} wrote a different name from almost everybody and is alone with having done it.',
    'The room went one way. {a} went the other, in public, in {posAdj} own handwriting.',
    '{a} is the only person here who has a slate to explain tomorrow.',
    'It felt right in the moment. It looks like an announcement now.',
    '{a} broke from the room tonight and everybody watched it happen.',
    'Nobody has said anything about it yet. That is not the same as nobody noticing.',
    '{a} has become visible in the one way that cannot be taken back.',
    'There are two reasons to write a name nobody else writes, and {a} can think of both.',
    '{a} would write it again. {Sub} would simply rather not have been alone in it.',
    'Being the odd slate is a statement about you before it is a statement about them.',
    '{a} spent the walk up wondering whether that had been brave or merely loud.',
    'One name, in one hand, against all the others. {a} has to live in that now.',
  ],
};

registerEvent({
  id: 'susp-what-one-person-does-with-it',
  family: 'suspicion',
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'temperament', 'loyalty', 'strategic', 'boldness'],
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
      'voted-against-the-room': (st.boldness / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'was-wrong';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'voted-against-the-room' ? 'wrote a name nobody else wrote'
      : branch === 'was-right' ? 'was right about a name and said nothing'
      : branch === 'was-wrong' ? 'was wrong about a name in front of everybody'
        : 'counted what the vote had cost';
    const line = fill(pick(rng, AFTER_RESULT_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ══════════════════════════════════════════════════════════════════════
// SIXTEEN MORE, ACROSS EVERY WINDOW THE DAY HAS
// ══════════════════════════════════════════════════════════════════════
//
// The three above proved the shape works: solo-only, deep pools, arcs OPENED
// rather than continued, weights below the gated events. The repetition
// ceiling took them without moving.
//
// These sixteen take that across the whole day. Every window gets solo cover,
// because `_sceneActors` convenes one person about 40% of the time everywhere
// and the solo bracket was eight events wide against the pair bracket's
// thirty.
//
// POOLS OF TWELVE HERE RATHER THAN TWENTY, and that is arithmetic rather than
// a lowered standard: nineteen solo events share the draws that eight used to,
// so each fires roughly a third as often as the first three did. Depth is
// only worth what the firing rate demands of it.

// ── dawn: the first one down, and who followed ────────────────────────

const FIRST_DOWN_LINES = {
  'had-the-room': [
    '{a} came down before anybody else and had ten minutes of a castle with nobody in it.',
    'The hall at that hour belongs to whoever is first, and this morning that was {a}.',
    '{a} sat in an empty room and listened to the building rather than the people.',
    'Nobody else was up. {a} did not mind that at all.',
    '{a} had a whole pot of coffee and no conversation, which after this week is a luxury.',
    'The first hour is the only honest one, and {a} took all of it.',
    '{a} was down early enough to hear the castle still deciding to wake up.',
    'Ten minutes alone in that hall did {a} more good than the whole of yesterday.',
    '{a} came down first on purpose and would do it again tomorrow.',
    'An empty room, a set table, and {a} not having to be anybody in particular.',
    '{a} watched the light come up over the drive and thought about nothing much.',
    'It is the one part of the day nobody is playing, and {a} has started guarding it.',
  ],
  'counted-them-in': [
    '{a} was down first and watched every single person arrive after.',
    '{a} noted the order they came down in, which is not nothing.',
    'Being first means seeing everybody else’s first face of the day, and {a} looked at all of them.',
    '{a} has learned that people are worst at hiding things before eight.',
    'The order people come down in changes when something has happened. {a} knows the usual one.',
    '{a} counted them in and had a number before anybody else had a suspicion.',
    'Somebody came down looking like they had not slept, and {a} was there to see it.',
    '{a} sat where the door was visible, which was not an accident.',
    'Fourteen people, fourteen entrances, and {a} watched every one.',
    '{a} was reading the room before the room had finished assembling.',
    'Two of them came down together and {a} filed that.',
    '{a} said good morning to everybody and meant something different by it each time.',
  ],
  'nobody-came': [
    '{a} sat down there alone for a long time before anybody joined.',
    'It stopped being peaceful somewhere around the twentieth minute.',
    '{a} was first down and stayed the only one down for longer than felt normal.',
    'The hall filled up around {a} without anybody sitting near {obj}.',
    '{a} had chosen the seat carefully and then nobody chose the ones beside it.',
    'Being early is only pleasant if somebody eventually arrives at you.',
    '{a} made a pot of coffee for a table that filled up elsewhere.',
    '{a} spent forty minutes being the first one down and then being on {posAdj} own.',
    'People came down, saw {a}, and sat at the other end. Twice.',
    'It is possible to be in a full room and still be where {a} was this morning.',
    '{a} left the hall before most of them had finished arriving.',
    'Nobody was rude to {a}. That is not the same as somebody sitting down.',
  ],
  'wished-they-had-waited': [
    '{a} was first down and spent the whole of it wishing somebody else had been.',
    'Being first means being watched arrive by everybody after you, and {a} had not thought of that.',
    '{a} came down early and then had nowhere to put {ref} for ten minutes.',
    'The first person into an empty room has to react to it alone, in front of whoever walks in next.',
    '{a} would rather have come down inside a group and did not manage it.',
    '{a} got the room to {ref} and discovered {sub} did not want it.',
    'There is no good way to be standing on your own when the rest of them arrive.',
    '{a} was early and it looked eager, and eager is a thing people remember.',
    '{a} spent those ten minutes rehearsing how to look normal, which is how you fail to.',
    'It is a small thing. {a} has been turning it over since breakfast.',
    '{a} went down first by accident and has been paying for it in small ways all morning.',
    'Nobody suspects you for being early. {a} is not entirely convinced of that.',
  ],
};

registerEvent({
  id: 'trust-first-one-down',
  family: 'trust',
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'intuition', 'social', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-first-one-down');
    const a = ctx.actors[0];
    const st = pStats(a);
    const friends = (ctx.living || []).filter(n => n !== a && getBond(a, n) > 1).length;
    const scores = {
      'had-the-room': (st.temperament / 10) * 0.5,
      'counted-them-in': (st.intuition / 10) * 0.5 + 0.1,
      'nobody-came': friends === 0 ? 0.8 : friends === 1 ? 0.35 : 0.1,
      'wished-they-had-waited': (1 - st.boldness / 10) * 0.3 + (1 - st.social / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'had-the-room';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'wished-they-had-waited' ? 'was first down and wished they had not been'
      : branch === 'counted-them-in' ? 'watched the whole castle come down'
      : branch === 'nobody-came' ? 'sat down first and stayed on their own'
        : 'had the hall to themselves for an hour';
    const line = fill(pick(rng, FIRST_DOWN_LINES[branch]), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── morning: the castle in daylight ───────────────────────────────────

const DAYLIGHT_LINES = {
  'looked-at-it-properly': [
    '{a} walked the length of the hall in daylight and looked at it like a building for once.',
    'It is a beautiful place and {a} had not noticed for four days.',
    '{a} stood at a window for a while and remembered this was supposed to be an experience.',
    'The castle is enormous and mostly empty, and {a} felt both of those this morning.',
    '{a} found a room nobody uses and sat in it for ten minutes.',
    'There is a whole wing of this place {a} has never been into.',
    '{a} touched the stone on the way past, for no reason {sub} could have given.',
    'Daylight makes it a building rather than a set, and {a} needed that today.',
    '{a} counted the windows on the front, which is the sort of thing you do here.',
    'It looked like a holiday for about ninety seconds.',
    '{a} took the long way round for the first time all week.',
    'The building does not care who any of them are, and {a} found that restful.',
  ],
  'the-empty-rooms': [
    '{a} noticed how many of the beds are not being slept in now.',
    'There are rooms in this castle with nobody’s things in them, and {a} walked past two.',
    '{a} passed a door that used to be somebody’s and did not look in.',
    'The building has got bigger every day this week and there is only one reason for that.',
    '{a} counted the occupied rooms rather than the people, which comes to the same number.',
    'Somebody’s case is still by a door. {a} has been looking at it for three days.',
    'It is a large castle for the number of them left in it.',
    '{a} heard {posAdj} own footsteps in a corridor and did not like it.',
    'The place echoes now in a way it did not on the first night.',
    '{a} shut a door that had been left open by somebody who is gone.',
    'Half the coat hooks are empty and {a} has started noticing which.',
    '{a} went the other way rather than pass the room at the end.',
  ],
  'got-on-with-it': [
    '{a} did the ordinary things in an ordinary order and felt better for it.',
    'There is washing and eating and walking about, and {a} did all three deliberately.',
    '{a} made the bed, which nobody was going to check.',
    'Routine is the only thing in here that behaves, and {a} leaned on it.',
    '{a} kept busy on purpose and it worked until about eleven.',
    'The trick is not to sit still, and {a} has worked that out.',
    '{a} found something to do with both hands and did it for an hour.',
    'It is easier to think while moving, and {a} moved all morning.',
    '{a} did not talk to anybody before lunch and did not need to.',
    '{a} cleaned something that was not dirty.',
    'A morning spent usefully is a morning not spent worrying, mostly.',
    '{a} got through it the way {sub} gets through all of them.',
  ],
  'wanted-to-go-home': [
    '{a} looked at the building this morning and wanted, quite badly, to leave it.',
    'It stopped being an adventure at some point and {a} cannot work out when.',
    '{a} thought about the drive home and then had to stop thinking about it.',
    'There is a life outside this and {a} spent ten minutes this morning inside it.',
    '{a} would take the money and {sub} would also take a car, right now, either.',
    'The castle is beautiful and {a} has stopped being able to see that.',
    '{a} is tired in a way that sleep has not touched for days.',
    'Everybody here says they would never walk. {a} has now thought about it properly.',
    '{a} misses somebody specific and has told nobody in this building who.',
    'It is a long way from home in a way that has nothing to do with distance.',
    '{a} stood in the light for a while and did not feel any better for it.',
    '{a} will not go. {Sub} did, however, consider it before breakfast.',
  ],
};

registerEvent({
  id: 'grief-the-castle-in-daylight',
  family: 'grief',
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'loyalty', 'social'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-castle-in-daylight');
    const a = ctx.actors[0];
    const st = pStats(a);
    const lost = peopleLost(gs);
    const scores = {
      'looked-at-it-properly': (st.temperament / 10) * 0.45,
      'the-empty-rooms': Math.min(0.9, lost * 0.18) + (st.loyalty / 10) * 0.2,
      'got-on-with-it': (1 - st.social / 10) * 0.3 + 0.3,
      'wanted-to-go-home': (1 - st.temperament / 10) * 0.3 + Math.min(0.25, lost * 0.05),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'got-on-with-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'wanted-to-go-home' ? 'looked at the building and wanted to leave it'
      : branch === 'the-empty-rooms' ? 'noticed how much of the castle is empty now'
      : branch === 'looked-at-it-properly' ? 'looked at the building rather than the game'
        : 'kept busy through the morning on purpose';
    const line = fill(pick(rng, DAYLIGHT_LINES[branch]), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-out: where in the column, and why ─────────────────────────

const COLUMN_PLACE_LINES = {
  'took-the-back': [
    '{a} let the whole column go ahead and walked at the back of it, watching.',
    'The back of a line is the only seat with a view of everybody, and {a} took it.',
    '{a} dropped to the rear early and stayed there the whole way out.',
    'Nobody at the front knows who is behind them. {a} has noticed that.',
    '{a} walked last and counted pairs the entire way.',
    'It is a deliberate place to walk and {a} chose it deliberately.',
    '{a} hung back at the gate and let everybody sort themselves out first.',
    'From the back {a} could see exactly who had wanted to be beside whom.',
    '{a} spent the road out being nobody’s conversation and everybody’s audience.',
    'The rear of the column is where you go when you would rather look than talk.',
    '{a} let two people pass on purpose and then a third.',
    '{a} has walked at the back three days running and is getting good at it.',
  ],
  'took-the-front': [
    '{a} set off at the front and set the pace for everybody behind.',
    'Being at the front means nobody is watching you, which suits {a} today.',
    '{a} walked out ahead of the column and did not look back once.',
    'It is a way of being visible and unavailable at the same time, and {a} used it.',
    '{a} led the way to a place {sub} had never been, confidently.',
    'The front of the column is the loneliest place in it and {a} chose it anyway.',
    '{a} wanted the walk over with and walked accordingly.',
    'Somebody has to be first through the gate. {a} made sure it was {obj}.',
    '{a} set a pace nobody was going to complain about and nobody could match.',
    'Ahead of everybody, out of earshot of everybody. That was the point.',
    '{a} did not want to be asked anything on that road and arranged not to be.',
    'It looked like enthusiasm. It was closer to avoidance.',
  ],
  'went-where-put': [
    '{a} ended up in the middle of the column without choosing to and stayed there.',
    '{a} walked out beside whoever happened to be next to {obj} at the gate.',
    'It was a walk. {a} walked it.',
    '{a} did not think about where in the line to be, and did not notice until the gate.',
    'Somebody talked at {a} for a mile and {sub} let them.',
    '{a} was carried along by the shape of the group and did not resist it.',
    'The column moved and {a} moved with it, and that was the whole of the hour.',
    '{a} has stopped choosing where to walk, which is new.',
    'It did not occur to {a} that the order meant anything.',
    '{a} spent the road out thinking about the mission rather than the people.',
    'No positioning, no reading, no plan. Just the road.',
    '{a} arrived at the other end having noticed almost nothing.',
  ],
  'walked-off-the-path': [
    '{a} left the track entirely and walked the field alongside it, twenty yards out.',
    'There is no rule that says you have to walk in the line, and {a} tested that.',
    '{a} walked parallel to the rest of them and near none of them.',
    'It is not sulking. It is the only privacy available between the gate and the field.',
    '{a} took the hedge line and let the column be a thing happening over there.',
    'Nobody called {a} back, which {sub} noticed.',
    '{a} spent the walk out at a distance {sub} had chosen precisely.',
    'From out there the column looks like what it is: a shape with gaps in it.',
    '{a} does not want to be asked anything this morning and has arranged not to be.',
    'It costs you something to walk apart and {a} decided this morning it was worth it.',
    '{a} rejoined them at the gate, and nobody remarked on where {sub} had been.',
    'The wet grass was worth it for the hour of nobody talking.',
  ],
};

registerEvent({
  id: 'susp-where-in-the-column',
  family: 'suspicion',
  window: 'journey-out',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'boldness', 'social'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return (ctx.living || []).length >= 5 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-where-in-the-column');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'took-the-back': (st.intuition / 10) * 0.45 + (st.strategic / 10) * 0.25,
      'took-the-front': (st.boldness / 10) * 0.4 + (1 - st.social / 10) * 0.2,
      'went-where-put': (1 - st.strategic / 10) * 0.35 + 0.2,
      'walked-off-the-path': (1 - st.social / 10) * 0.3 + (st.boldness / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-where-put';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'walked-off-the-path' ? 'left the column and walked the field alongside it'
      : branch === 'took-the-back' ? 'walked at the back where the whole column was visible'
      : branch === 'took-the-front' ? 'walked out at the front, ahead of being asked anything'
        : 'walked wherever the column put them';
    const line = fill(pick(rng, COLUMN_PLACE_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── after-table: the stairs, afterwards ───────────────────────────────

const STAIRS_AFTER_LINES = {
  'straight-up': [
    '{a} went straight up afterwards and did not stop to talk to anybody.',
    'There was a room full of people wanting to explain themselves and {a} walked past all of them.',
    '{a} took the stairs two at a time and shut a door.',
    'Nothing anybody said in that hall afterwards was going to help, and {a} knew it.',
    '{a} left before the candles were out.',
    'The debrief is the worst part and {a} has stopped attending it.',
    '{a} said goodnight to nobody in particular and went.',
    'Some people need the hall afterwards. {a} needs the stairs.',
    '{a} was gone before the room had worked out what it thought.',
    'It is a long way up to those rooms and {a} did it fast tonight.',
    '{a} did not trust {posAdj} own face in that hall a minute longer.',
    'Up, in, door shut, and the whole thing left downstairs.',
  ],
  'stayed-down': [
    '{a} stayed in the hall a long time after most of them had gone up.',
    '{a} did not want to be alone with it, so {sub} was not.',
    'The last few in that room are the ones who cannot face the stairs, and {a} was one.',
    '{a} sat with the candles going out one at a time.',
    'Somebody has to be last out and tonight {a} volunteered.',
    '{a} stayed down there and let people talk at {obj} until it stopped meaning anything.',
    'The hall empties slowly after a table. {a} watched all of it empty.',
    '{a} was still there when the crew started moving chairs.',
    'It is easier to be in a room with people you cannot trust than alone with what happened.',
    '{a} stayed until there was nobody left to stay with.',
    '{a} put off going up for as long as the room allowed.',
    'The stairs were the same length either way and {a} took an hour to face them.',
  ],
  'said-nothing-going-up': [
    '{a} went up with two other people and none of them said a word.',
    'Three of them on that staircase and not one sentence between them.',
    '{a} climbed the stairs beside somebody {sub} had voted for and neither mentioned it.',
    'There is nothing to say on those stairs and {a} said exactly that much.',
    '{a} nodded at a landing and that was the entire exchange.',
    'They went up together the way people leave a funeral.',
    '{a} could hear the others breathing and nothing else.',
    'It is a quiet building after a table and {a} did not break it.',
    'Somebody said goodnight halfway up. Nobody answered.',
    '{a} went up in company and arrived alone.',
    'Whatever any of them thought, the staircase did not hear it.',
    '{a} has learned that the walk up is not the place.',
  ],
  'went-up-with-a-decision': [
    '{a} went up those stairs having decided something, and it will be visible tomorrow.',
    'A staircase is about the right length to settle a thing on, and {a} settled one.',
    '{a} climbed thinking about tonight and reached the landing thinking about Thursday.',
    'Whatever {a} had been unsure of at the table, {sub} was not unsure of it by the top.',
    '{a} stopped once on the way up, which is where the decision happened.',
    '{a} went to bed with a name and a route to it.',
    'The hall was for reacting. The stairs were for choosing, and {a} chose.',
    '{a} has stopped waiting to see what the room does and started deciding what {sub} does.',
    'By the second landing it had gone from a feeling to a plan.',
    '{a} said goodnight to two people on the way and had already decided about one of them.',
    'Somewhere between the hall and the corridor {a} stopped being a passenger.',
    'It is a small staircase and {a} came off the top of it a different player.',
  ],
};

registerEvent({
  id: 'trust-the-stairs-afterwards',
  family: 'trust',
  window: 'after-table',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'social', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-stairs-afterwards');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'straight-up': (1 - st.social / 10) * 0.45 + 0.15,
      'stayed-down': (st.social / 10) * 0.4 + (1 - st.temperament / 10) * 0.25,
      'said-nothing-going-up': (st.temperament / 10) * 0.35 + 0.15,
      'went-up-with-a-decision': (st.strategic / 10) * 0.35 + (st.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'said-nothing-going-up';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'went-up-with-a-decision' ? 'settled tomorrow somewhere on the stairs'
      : branch === 'straight-up' ? 'went straight up rather than stay in the hall'
      : branch === 'stayed-down' ? 'stayed in the hall until it was empty'
        : 'climbed the stairs in silence with the others';
    const line = fill(pick(rng, STAIRS_AFTER_LINES[branch]), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── night: the hours nobody sees ──────────────────────────────────────

const LAST_LIGHT_LINES = {
  'could-not-sleep': [
    '{a} lay awake listening to a building that makes a great deal of noise at night.',
    'Every floorboard in this place is somebody coming for you at two in the morning.',
    '{a} got up twice to check a door that was already locked.',
    'Sleep is the first thing this castle takes and {a} lost it on the second night.',
    '{a} heard footsteps and spent an hour deciding whose they were.',
    '{a} has stopped expecting to sleep and started planning around not sleeping.',
    'The night is long here and {a} was awake for most of this one.',
    '{a} counted the hours by the sounds the building makes.',
    'It is not fear exactly. {a} has not found the right word for it yet.',
    '{a} lay in the dark doing arithmetic that never came out the same twice.',
    'Somewhere around three {a} gave up and sat by the window.',
    '{a} will be tired tomorrow and tired is how mistakes happen here.',
  ],
  'slept-fine': [
    '{a} slept straight through, which in this building is close to a superpower.',
    '{a} went up, went to bed, and was gone inside five minutes.',
    'Whatever is happening upstairs, {a} was not awake for any of it.',
    '{a} sleeps well and has learned not to mention it at breakfast.',
    'It is a comfortable bed in a frightening castle and {a} has picked the bed.',
    '{a} slept the sleep of somebody with nothing on their mind, or very good control of it.',
    '{a} was out before the corridor had gone quiet.',
    'Eight hours. Nobody else in this castle got eight hours.',
    '{a} has decided that being tired helps nobody and acts accordingly.',
    '{a} woke up once, listened, decided it was the building, and went back to sleep.',
    'Rest is a strategy and {a} treats it as one.',
    '{a} came down looking better than anybody had a right to.',
  ],
  'went-over-tomorrow': [
    '{a} spent the last hour of the night planning the first hour of tomorrow.',
    '{a} worked out who to talk to and in what order, lying in the dark.',
    'Tomorrow has a table in it and {a} was already at it.',
    '{a} rehearsed a sentence four times and still did not like it.',
    '{a} decided three things before sleeping and will change two of them by lunch.',
    'The night is the only time in this castle nobody can interrupt you thinking.',
    '{a} used the dark to work rather than to rest.',
    '{a} had the whole of tomorrow arranged before falling asleep.',
    '{a} thought about a name until the name stopped sounding like a person.',
    'It is easier to be certain at midnight than at any other hour, and {a} was.',
    '{a} fell asleep mid-plan and woke up still holding it.',
    '{a} has a version of tomorrow that works. It requires everybody else to cooperate.',
  ],
  'counted-the-doors': [
    '{a} lay awake counting how many times a door went, and roughly where.',
    'Somebody was up at about two. {a} could not say who and is fairly sure of the direction.',
    'The corridor gives up more than anybody in it realises, and {a} was listening to all of it.',
    '{a} has learned which board creaks outside which room, which is a strange thing to know.',
    'Three sets of footsteps and {a} has a guess at two of them.',
    '{a} is not going to be able to prove any of this and is collecting it anyway.',
    'It is not sleeping and it is not quite watching. {a} has done it four nights running.',
    '{a} counted the doors and then counted them again on the way back.',
    'Somebody went past {a}\'s room twice and did not go in anywhere.',
    '{a} could tell you the order the corridor went quiet in.',
    'There is a difference between a door closing and a door being closed carefully, and {a} heard the second kind.',
    '{a} will be tired tomorrow and will know one thing nobody else does.',
  ],
};

registerEvent({
  id: 'trust-the-last-light',
  family: 'trust',
  window: 'night',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'strategic', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-last-light');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'could-not-sleep': (1 - st.temperament / 10) * 0.55,
      'slept-fine': (st.temperament / 10) * 0.45 + (st.boldness / 10) * 0.15,
      'went-over-tomorrow': (st.strategic / 10) * 0.5,
      'counted-the-doors': (st.intuition / 10) * 0.4,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'could-not-sleep';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'counted-the-doors' ? 'lay awake tracking who moved in the corridor'
      : branch === 'slept-fine' ? 'slept straight through in a castle nobody sleeps in'
      : branch === 'went-over-tomorrow' ? 'spent the night arranging tomorrow'
        : 'lay awake listening to the building';
    const line = fill(pick(rng, LAST_LIGHT_LINES[branch]), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── dawn: what the empty chair does to one person ─────────────────────

const CHAIR_ALONE_LINES = {
  'sat-somewhere-else': [
    '{a} sat somewhere different this morning and could not have said why.',
    'The chair {a} has used all week is next to one nobody is using now.',
    '{a} moved down two places and nobody remarked on it.',
    'It is a small rearrangement and it took {a} the whole of breakfast to make it.',
    '{a} took a seat with its back to the empty one.',
    'Nobody sits in the same place forever here. It just usually takes longer than this.',
    '{a} chose a chair by which view it gave rather than who was near it.',
    '{a} sat down, looked left, and got up again.',
    'The table has more room than it had on Monday and {a} spread out into it.',
    '{a} has changed seats twice this week and both times somebody had gone.',
    '{a} ended up at the far end and stayed there.',
    'It is easier to eat facing a wall, and {a} found one.',
  ],
  'kept-the-place': [
    '{a} sat exactly where {sub} always sits, beside a chair with nobody in it.',
    '{a} would not move, and made a small point of not moving.',
    'The empty place stayed empty next to {a} for the whole of breakfast.',
    '{a} put a cup down in front of the empty chair without thinking and left it there.',
    'Somebody offered to shift along. {a} said no.',
    '{a} has kept the same seat since the first morning and is not starting now.',
    'It is a way of saying something without saying it, and {a} said it.',
    '{a} sat beside the gap for an hour and did not look at it once.',
    'Everybody else moved up. {a} did not.',
    '{a} would rather sit next to nothing than admit the arrangement had changed.',
    'The chair stayed pushed in and {a} stayed next to it.',
    '{a} ate a whole breakfast beside an absence and behaved perfectly normally.',
  ],
  'did-not-notice': [
    '{a} was three mouthfuls in before working out what was different about the table.',
    'It took {a} longer than it should have to see who was not there.',
    '{a} noticed the chair, then noticed how long it had taken to notice.',
    'That is the part that will bother {a} later: not the gap, the delay.',
    '{a} had to count twice to work out which one it was.',
    'Somebody has been gone since the first light and {a} needed telling.',
    '{a} could not immediately picture where that person had been sitting.',
    'A week ago {a} would have known instantly. That is the week doing its work.',
    '{a} realised halfway through and put the fork down.',
    'The room adjusts faster than the people in it, and {a} adjusted with it.',
    '{a} is getting used to this, which is worse than being upset by it.',
    'Nobody said the name. {a} did not ask.',
  ],
  'took-the-chair': [
    '{a} sat down in the empty place, deliberately, and let the room have a look at that.',
    'Somebody had to take that chair eventually. {a} did not wait to see who.',
    '{a} pulled the chair out, sat in it and asked for the toast.',
    'It is the only seat with a clear view of the whole table and {a} took it.',
    'Two people looked up. {a} did not look back at either of them.',
    'There is a version of that which is practical and a version which is a statement, and nobody can tell which this was.',
    '{a} turned the cup back over before sitting down.',
    'The chair had been empty for an hour and {a} ended that.',
    'It reads as cold. {a} has decided to be read as cold.',
    '{a} sat in it every morning after that, which is the part the room will remember.',
    'Nobody said anything. Everybody registered it.',
    '{a} took the seat and left the rest of them to feel whatever they were going to feel.',
  ],
};

registerEvent({
  id: 'grief-the-chair-beside-them',
  family: 'grief',
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'temperament', 'social', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-chair-beside-them');
    const a = ctx.actors[0];
    const st = pStats(a);
    const lost = peopleLost(gs);
    const scores = {
      'sat-somewhere-else': (1 - st.temperament / 10) * 0.4 + 0.15,
      'kept-the-place': (st.loyalty / 10) * 0.5,
      // Getting used to it takes a few of them.
      'did-not-notice': Math.min(0.6, Math.max(0, lost - 1) * 0.16) + 0.1,
      'took-the-chair': (st.boldness / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'kept-the-place';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'took-the-chair' ? 'sat down in the empty place on purpose'
      : branch === 'kept-the-place' ? 'sat beside the empty place and would not move'
      : branch === 'did-not-notice' ? 'took too long to notice who was missing'
        : 'moved seats without being able to say why';
    const line = fill(pick(rng, CHAIR_ALONE_LINES[branch]), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── evening: the thing you noticed and said nothing about ─────────────

const SAID_NOTHING_LINES = {
  'holding-it': [
    '{a} saw something this afternoon and has told nobody all evening.',
    'It is worth more unsaid than said, and {a} has worked that out.',
    '{a} has been carrying one observation since about three o’clock.',
    'Everybody in that hall told {a} something tonight. {Sub} told them nothing.',
    '{a} nearly said it twice and stopped both times.',
    'The thing {a} knows is small and specific and {sub} is keeping it that way.',
    '{a} would like to be asked the right question and nobody is asking it.',
    'It will be worth saying at a table. It is worth nothing said in a corridor.',
    '{a} has decided who to tell and is waiting for the hour to be right.',
    'Somebody made a mistake in front of {a} and does not know {sub} saw.',
    '{a} spent the evening being extremely normal about it.',
    'The advantage of knowing something is knowing it alone, for a while.',
  ],
  'not-sure-it-counts': [
    '{a} saw something and has spent the evening deciding whether it was anything.',
    'It looked wrong at the time and looks like nothing now, and {a} cannot settle it.',
    '{a} has replayed it enough times to have stopped trusting the memory.',
    'Either it was a tell or {a} is looking too hard, and both are possible.',
    '{a} would say it if {sub} could describe it, and {sub} cannot.',
    'The trouble with a small thing is that it does not survive being explained.',
    '{a} tried the sentence out silently and it sounded ridiculous.',
    '{a} does not want to be the person who accuses somebody of a facial expression.',
    'It might mean everything. It might be that they were tired.',
    '{a} has been at ninety per cent certain all evening and cannot get to ninety-five.',
    '{a} nearly asked somebody else if they had seen it too, and did not risk it.',
    'By bedtime {a} had talked {ref} out of it, mostly.',
  ],
  'let-it-go': [
    '{a} decided it was nothing and stopped carrying it, which took some doing.',
    '{a} has watched people be wrong about small things all week and would rather not join them.',
    'It was probably nothing. {a} chose to act as though that were certain.',
    '{a} put it down deliberately rather than let it grow into a theory.',
    'Being right about a big thing beats being loud about a small one, and {a} knows it.',
    '{a} has started discarding observations rather than collecting them.',
    'The pile of things {a} half-noticed is too big to be useful, so {sub} shrank it.',
    '{a} let it go and slept better for it.',
    'Not everything in this castle is a clue and {a} has decided this one was not.',
    '{a} had a suspicion for about an hour and then it expired.',
    '{a} would rather have three certainties than thirty maybes.',
    'It stopped mattering somewhere between dinner and the stairs.',
  ],
  'decided-who-to-tell': [
    '{a} has picked exactly one person to tell this to, and has not told them yet.',
    'The value of a thing like this is in who hears it first, and {a} has spent the evening on that question.',
    '{a} nearly said it to the wrong person twice and stopped both times.',
    'It is not a secret any more. It is a gift {a} has not decided when to give.',
    '{a} has the name of the recipient and is waiting for a corridor rather than a room.',
    'Telling one person makes an ally. Telling two makes a rumour. {a} knows the difference.',
    '{a} rehearsed how to bring it up so that it sounds like it just occurred to {obj}.',
    '{a} chose somebody who will be grateful rather than somebody who will be useful, and knows that was sentimental.',
    'The whole evening was {a} standing near one person waiting for everybody else to leave.',
    '{a} will tell them tomorrow, on the road, where nobody can hear it.',
    '{a} changed {posAdj} mind about who twice and settled on the first answer.',
    'It is worth one favour to the right person and nothing at all to the wrong one.',
  ],
};

registerEvent({
  id: 'susp-said-nothing-about-it',
  family: 'suspicion',
  window: 'evening',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'temperament', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-said-nothing-about-it');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'holding-it': (st.strategic / 10) * 0.45 + (1 - st.social / 10) * 0.2,
      'not-sure-it-counts': (1 - st.boldness / 10) * 0.4 + (st.intuition / 10) * 0.2,
      'let-it-go': (st.temperament / 10) * 0.4,
      'decided-who-to-tell': (st.social / 10) * 0.3 + (st.strategic / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'not-sure-it-counts';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'decided-who-to-tell' ? 'chose which single person to tell, and has not told them yet'
      : branch === 'holding-it' ? 'kept an observation to themselves all evening'
      : branch === 'let-it-go' ? 'decided an observation was nothing and dropped it'
        : 'could not decide whether what they saw was anything';
    const line = fill(pick(rng, SAID_NOTHING_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-back: what one person carries home ────────────────────────

const CAME_BACK_LINES = {
  'brought-it-home': [
    '{a} came back up the drive still carrying the afternoon.',
    'Whatever happened out there arrived at the castle with {a} and stayed.',
    '{a} was still angry about it four hours later, quietly.',
    'It was one hour of one day and {a} has not put it down since.',
    '{a} went out fine and came back with something to think about.',
    'Some afternoons follow you in through the door. This was one.',
    '{a} could not let it go on the road and did not manage it in the hall either.',
    'The mission ended at four. For {a} it has not.',
    '{a} carried it up the stairs and it is still there now.',
    '{a} has decided the afternoon meant something and cannot stop testing what.',
    'It was a small thing on a long road and it grew the whole way home.',
    '{a} came in last, said nothing, and went straight up with it.',
  ],
  'shook-it-off': [
    '{a} came back through the gate and left the afternoon on the other side of it.',
    'By the time the castle was in sight {a} had finished with the day.',
    '{a} came in cheerful, which surprised the people who had watched the mission.',
    'It was a bad hour. {a} declined to make it a bad evening.',
    '{a} washed, changed and stopped thinking about it, in that order.',
    'The one advantage of a long road back is that it is long enough.',
    '{a} arrived home lighter than {sub} left, which nobody expected.',
    '{a} has learned to end an afternoon at the gate and did it again today.',
    'Whatever happened out there did not come in with {a}.',
    '{a} came back through the door already talking about something else.',
    'It stopped being interesting somewhere near the ford.',
    '{a} put it behind {obj} deliberately and it stayed behind.',
  ],
  'watched-them-come-in': [
    '{a} got back early and watched everybody else arrive.',
    '{a} was through the gate first and turned round to see who came in how.',
    'People arrive at a castle in the order they walked, and {a} read the order.',
    '{a} noted who came in together and who came in a long way behind.',
    'The drive is a good place to stand if you want to see fourteen faces in a row.',
    '{a} stayed in the courtyard longer than there was any reason to.',
    'Two of them came up that drive still arguing, and {a} was there for it.',
    '{a} counted them in the way somebody counts a returning boat.',
    'Somebody came back looking worse than the afternoon justified, and {a} saw.',
    '{a} had been home ten minutes and learned more in those ten than in the whole mission.',
    '{a} watched the last one in and thought about how far behind they were.',
    'It is not spying. {a} was simply already there.',
  ],
  'came-back-decided': [
    '{a} went out unsure and came back through that gate with a name.',
    'Something happened out there that closed the question for {a}, and it was small.',
    'The afternoon settled it. {a} could not tell you which minute of it did.',
    '{a} spent the road home not deliberating but confirming, which is a different walk.',
    'By the ford {a} had stopped considering anybody else.',
    'It is the surest {a} has felt about anything since the first night.',
    '{a} came back knowing what {sub} was going to write, days before {sub} has to write it.',
    'One person behaved one way out there and it finished the argument in {a}\'s head.',
    '{a} arrived home calm, which the room read as nothing and is actually a decision.',
    'There is no evidence for it that {a} could say out loud, and {sub} is certain anyway.',
    '{a} has stopped watching the person {sub} decided about, and somebody will notice that.',
    'The mission gave {a} nothing except one answer, and {sub} took it home.',
  ],
};

registerEvent({
  id: 'grief-what-came-back-with-them',
  family: 'grief',
  window: 'journey-back',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'intuition', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-what-came-back-with-them');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'brought-it-home': (1 - st.temperament / 10) * 0.5,
      'shook-it-off': (st.temperament / 10) * 0.45,
      'watched-them-come-in': (st.intuition / 10) * 0.4,
      'came-back-decided': (st.intuition / 10) * 0.3 + (st.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'shook-it-off';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'came-back-decided' ? 'settled on a name somewhere on the road home'
      : branch === 'brought-it-home' ? 'brought the afternoon back into the castle'
      : branch === 'watched-them-come-in' ? 'stood in the courtyard and watched everybody arrive'
        : 'left the afternoon at the gate';
    const line = fill(pick(rng, CAME_BACK_LINES[branch]), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── morning: keeping a record ─────────────────────────────────────────

const KEEPING_TRACK_LINES = {
  'wrote-it-down': [
    '{a} has started keeping track of things, on paper, where nobody can see it.',
    '{a} wrote out the week in order this morning and it looked different written down.',
    'Memory is not reliable in here and {a} has stopped relying on it.',
    '{a} keeps a list. {Sub} would not enjoy anybody finding the list.',
    '{a} has names and days and a column {sub} has not decided what to call.',
    'Writing it down turned four impressions into two facts, which is the point.',
    '{a} has been doing this since the third day and it is starting to pay.',
    'The list is short. The bit {a} keeps in {posAdj} head is longer.',
    '{a} added a name this morning and underlined an older one.',
    'It is not evidence. It is a way of not forgetting what was.',
    '{a} reads it back every morning and changes about one thing a day.',
    '{a} hid it somewhere better after breakfast.',
  ],
  'went-through-it-again': [
    '{a} went through the whole week again from the beginning, in order.',
    'Every morning {a} rebuilds the season from the first night and looks for the join.',
    '{a} has done this so many times the early days have stopped meaning anything.',
    '{a} can recite who sat where on the first night and is not sure that helps.',
    'The trouble with going over it is that the tenth time feels like proof.',
    '{a} found something in the second day that {sub} had walked past nine times.',
    '{a} spent the morning being certain and then unpicking the certainty.',
    'Going back over it is the only work available before lunch.',
    '{a} keeps arriving at the same two names by a different route each time.',
    'It is a good sign when a review changes your mind and a bad one when it never does.',
    '{a} has been over this week so often that {sub} has started to distrust the review.',
    '{a} got to day four and stopped, because day four is where it stops making sense.',
  ],
  'gave-up-tracking': [
    '{a} has stopped trying to hold the whole thing in one piece.',
    'There is too much of it now and {a} has admitted that.',
    '{a} used to know where everybody had been. {Sub} does not any more.',
    'Somewhere in the middle of this week the arithmetic got away from {a}.',
    '{a} has decided to go on instinct, which is either brave or the end of {obj}.',
    'Keeping track is a full-time job and {a} has other ones.',
    '{a} tried to reconstruct the week and could not get past the murders.',
    'The list got long enough to be useless and {a} let it.',
    '{a} would rather be wrong quickly than right too late.',
    '{a} has stopped counting and started guessing, and knows it.',
    'It is possible to think about this too much, and {a} has been.',
    '{a} put the whole thing down this morning and felt better and worse at once.',
  ],
  'checked-their-own-record': [
    '{a} went back over {posAdj} own week this morning, looking at it the way the room would.',
    'It is a useful and horrible exercise: read your own days as evidence against yourself.',
    '{a} found two things {sub} had done that look bad written down and were nothing at the time.',
    '{a} has been so busy watching everybody else that {sub} had not checked how {sub} looks.',
    'There is a version of {a}\'s week that convicts {sub}, and {sub} has now assembled it.',
    '{a} realised {sub} has been in the wrong room twice and can prove neither was deliberate.',
    '{a} spent the morning building the case against {ref}, which is one way to prepare.',
    'It turns out {a} has no alibi for a single night this week, and nor does anybody.',
    '{a} is innocent and spent an hour finding out how little that helps.',
    '{a} has started narrating {posAdj} own movements aloud, which is not helping.',
    'The most frightening thing {a} found was how easy it was to find.',
    '{a} will be more careful this week about things that were never careless.',
  ],
};

registerEvent({
  id: 'susp-keeping-track-of-it',
  family: 'suspicion',
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['mental', 'strategic', 'intuition', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // There has to be a week worth reviewing.
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-keeping-track-of-it');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'wrote-it-down': (st.mental / 10) * 0.45 + (st.strategic / 10) * 0.2,
      'went-through-it-again': (st.intuition / 10) * 0.4 + 0.15,
      'gave-up-tracking': (1 - st.mental / 10) * 0.4 + (1 - st.temperament / 10) * 0.15,
      'checked-their-own-record': (1 - st.boldness / 10) * 0.3 + (st.intuition / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-through-it-again';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'checked-their-own-record' ? 'went back over their own week looking for how it reads'
      : branch === 'wrote-it-down' ? 'keeps a written record nobody is meant to see'
      : branch === 'gave-up-tracking' ? 'stopped trying to hold the whole week in one piece'
        : 'went back over the whole week from the first night';
    const line = fill(pick(rng, KEEPING_TRACK_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── after-table: the count, gone over again ───────────────────────────

const RECOUNT_LINES = {
  'read-the-ballots': [
    '{a} has the whole vote memorised and has been through it twice since.',
    'Fourteen names went up. {a} could still tell you every one and who wrote it.',
    '{a} learned more from who did not vote with the room than from who did.',
    'The vote is the only hard data this game gives out, and {a} treats it that way.',
    '{a} worked out which two votes had been decided before the debate started.',
    'Somebody voted against the room tonight and {a} is interested in why.',
    '{a} does the tally again on paper because the tally is the truth.',
    'Every ballot is a person telling you something. {a} read all fourteen.',
    '{a} noticed one name arrive later in the pile than it should have.',
    'The debate is theatre. {a} has stopped listening to it and started counting.',
    '{a} can name the three people whose vote {sub} still cannot explain.',
    '{a} went to bed with the count and woke up with it.',
  ],
  'one-vote-bothering-them': [
    'One ballot has been bothering {a} since the moment it was turned over.',
    '{a} cannot make one of those votes fit any story {sub} has.',
    'It is a single name written by a single person and {a} cannot get past it.',
    '{a} has explained that vote to {ref} four different ways and believed none of them.',
    'Everything tonight made sense except one slate, and {a} keeps returning to it.',
    'Somebody did something small and strange and only {a} seems to have noticed.',
    '{a} would ask them about it if asking were not itself an accusation.',
    'The rest of the count is ordinary. That one is not.',
    '{a} has decided that vote was either a mistake or the whole answer.',
    'It could be nothing. {a} has never been able to leave a question half-answered.',
    '{a} will be looking at that person differently for the rest of the week.',
    'One name, written by the last hand {a} expected. {Sub} is still on it.',
  ],
  'stopped-counting': [
    '{a} did not go over the vote at all tonight, for the first time.',
    'There is a point where the arithmetic stops helping and {a} reached it.',
    '{a} has run the numbers every night this week and got nowhere with them.',
    '{a} let the count go and went to bed, which felt like giving something up.',
    'The votes have stopped telling {a} anything {sub} did not already suspect.',
    '{a} is going to try trusting people for a day and see whether it works better.',
    '{a} put the whole evening down without processing it, deliberately.',
    'It is possible to over-read fourteen names, and {a} has been.',
    '{a} decided the answer is not in the tally and stopped looking there.',
    'For once {a} did not reconstruct the room before sleeping.',
    '{a} has been counting for six nights and is no closer than on the first.',
    '{a} would rather be rested than right, tonight at least.',
  ],
  'counted-who-did-not-look': [
    '{a} did not watch the slates at all tonight. {Sub} watched the faces reading them.',
    'The slate tells you what somebody did. The face tells you whether they expected it.',
    'One person did not look up once, and {a} has that in a very short list.',
    '{a} counted who checked the room before writing, which is a question about confidence.',
    'Two people looked at each other when the name came out. {a} was looking at them.',
    'The vote is public. Where everybody\'s eyes went during it is not, unless you watch.',
    '{a} learned more in four seconds of somebody\'s face than in the whole hour of talking.',
    'Somebody was not surprised tonight, and being unsurprised is the whole game.',
    '{a} has stopped listening at that table and started looking.',
    'Nobody hides a reaction well when they are also holding a piece of chalk.',
    '{a} watched one person\'s hands rather than their face, which is where it usually shows.',
    'It is not proof and {a} would not trade it for proof.',
  ],
};

registerEvent({
  id: 'susp-going-over-the-count',
  family: 'suspicion',
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['mental', 'intuition', 'strategic', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-going-over-the-count');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'read-the-ballots': (st.mental / 10) * 0.4 + (st.strategic / 10) * 0.25,
      'one-vote-bothering-them': (st.intuition / 10) * 0.45 + 0.1,
      'stopped-counting': (st.temperament / 10) * 0.3 + (1 - st.mental / 10) * 0.2,
      'counted-who-did-not-look': (st.intuition / 10) * 0.3 + (st.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'read-the-ballots';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'counted-who-did-not-look' ? 'read the faces at the table rather than the slates'
      : branch === 'one-vote-bothering-them' ? 'cannot make one ballot fit'
      : branch === 'stopped-counting' ? 'did not go over the vote at all tonight'
        : 'went through the whole count again afterwards';
    const line = fill(pick(rng, RECOUNT_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── night: rehearsing tomorrow, alone ─────────────────────────────────

const REHEARSING_LINES = {
  'practised-it': [
    '{a} said tomorrow’s sentence out loud, to a wall, twice.',
    '{a} has a line ready and has taken most of the life out of it practising.',
    'It sounds better in {a}’s head than it does in the room, and {sub} knows that already.',
    '{a} worked out where to be standing when {sub} says it.',
    'Nobody rehearses unless they are frightened of the moment, and {a} is.',
    '{a} has three versions and will use whichever the room gives room to.',
    '{a} practised the pause before the name, which is the part that does the work.',
    'It is a short speech and {a} has spent an hour on it.',
    '{a} rehearsed being surprised, in case tomorrow requires it.',
    '{a} would rather sound rehearsed than say it badly.',
    '{a} tried it kind and tried it hard and has not chosen yet.',
    'By the end {a} could not tell whether the sentence was any good.',
  ],
  'decided-to-say-nothing': [
    '{a} has decided to say nothing at all tomorrow, and that is a plan too.',
    'The quiet ones last longer here and {a} has done the arithmetic.',
    '{a} will let the room do the work and stand somewhere near the back of it.',
    'Every sentence {a} says is a sentence somebody can use, so {sub} is saying none.',
    '{a} has watched three loud players leave and drawn a conclusion.',
    'Saying nothing is a choice and {a} made it lying down at midnight.',
    '{a} intends to agree with whoever is winning and remember that {sub} did.',
    'There is nothing {a} can say tomorrow that improves {posAdj} position.',
    '{a} has one name and no intention of being the one to say it.',
    'The plan is to be unremarkable for one more day.',
    '{a} will answer questions and ask none.',
    'It is not cowardice. It is the fourth night in a row it has been correct.',
  ],
  'no-plan-at-all': [
    '{a} tried to plan tomorrow and could not make one part of it hold still.',
    'There is no version of tomorrow {a} can see the shape of.',
    '{a} would need to know one more thing, and there is no way to get it before morning.',
    '{a} gave up on planning about one and went to sleep on it.',
    'Every plan {a} started tonight required somebody else to behave predictably.',
    '{a} has run out of moves that do not depend on being lucky.',
    '{a} will go down in the morning and find out what kind of day it is.',
    'It is hard to plan a day when you do not know who is in the room with you.',
    '{a} tried to choose a name and could not make the case for any of them.',
    '{a} is going to improvise, which {sub} is not good at.',
    'The honest answer is that {a} does not know what to do tomorrow.',
    '{a} fell asleep without deciding anything, which is itself a decision.',
  ],
  'decided-to-go-first': [
    '{a} has decided to be the one who speaks first tomorrow, which is the most dangerous chair.',
    'Somebody has to start it. {a} has decided it may as well be {obj}.',
    'The first name said out loud shapes the whole hour, and {a} intends to be the one saying it.',
    '{a} is tired of watching other people set the terms of the evening.',
    'Going first means everybody has to react to you. {a} wants exactly that.',
    '{a} has spent four nights letting the room lead and is finished with it.',
    'It will make {a} a target and {sub} has done the arithmetic on that already.',
    '{a} would rather be wrong loudly than right too late, for once.',
    '{a} lay there deciding to be brave tomorrow, which is not the same as being brave tomorrow.',
    'The plan is one sentence, said early, before anybody else has committed.',
    '{a} has a name and has decided the name is worth {posAdj} own safety.',
    'There is a moment early in those hours where the room is still deciding, and {a} means to be in it.',
  ],
};

registerEvent({
  id: 'testing-rehearsing-tomorrow',
  family: 'testing',
  window: 'night',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['strategic', 'boldness', 'social', 'mental'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-rehearsing-tomorrow');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'practised-it': (st.social / 10) * 0.35 + (st.strategic / 10) * 0.3,
      'decided-to-say-nothing': (1 - st.boldness / 10) * 0.4 + (st.strategic / 10) * 0.2,
      'no-plan-at-all': (1 - st.mental / 10) * 0.35 + 0.15,
      'decided-to-go-first': (st.boldness / 10) * 0.4,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'no-plan-at-all';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'decided-to-go-first' ? 'decided to be the one who opens the table tomorrow'
      : branch === 'practised-it' ? 'rehearsed tomorrow out loud to an empty room'
      : branch === 'decided-to-say-nothing' ? 'decided to say nothing at all tomorrow'
        : 'could not make a plan for tomorrow hold still';
    const line = fill(pick(rng, REHEARSING_LINES[branch]), a);
    const t = api.openArc('testing', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── evening: what the money is for, thought about alone ───────────────

const OWN_REASON_LINES = {
  'why-they-came': [
    '{a} sat and remembered, in detail, why {sub} applied for this in the first place.',
    'It was a specific reason and {a} has not said it out loud to anybody here.',
    '{a} thought about the person who told {sub} to go for it.',
    'There is a version of {a}’s life on the other side of this, and {sub} looked at it.',
    'It is not really about the money and it is entirely about the money.',
    '{a} has a use for it that would take about four words to explain and {sub} has explained it to nobody.',
    '{a} remembered the audition and how far away all this seemed.',
    'The reason has not changed. What it would cost has.',
    '{a} has stopped mentioning it because saying it out loud here makes it a lever.',
    '{a} thought about home for a while and then stopped, on purpose.',
    'Everybody here wants to win. {a} spent an hour working out why {a} wants it more than most.',
    '{a} would take a smaller share and go home tomorrow, some evenings. Not most.',
  ],
  'what-it-has-cost': [
    '{a} added up what this week has already taken and did not like the total.',
    '{a} has lied to people {sub} likes, for money, and sat with that this evening.',
    'It is a game until you have done something in it you would not do at home.',
    '{a} has crossed a line and has been quietly checking which side of it {sub} is on.',
    '{a} is not sure {sub} is going to like the person who walks out of here.',
    'The prize gets bigger and so does the thing {a} has to be to win it.',
    '{a} thought about how {sub} will describe this week to somebody afterwards.',
    'There is a version of this {a} could be proud of, and {sub} is no longer in it.',
    '{a} would like to win and would also like to still be {ref} at the end.',
    '{a} has started keeping score of the wrong things.',
    'The money is real. So is what {a} did on Tuesday.',
    '{a} sat with it and then went to bed, unresolved.',
  ],
  'not-thinking-about-it': [
    '{a} has stopped thinking about the money entirely and finds that easier.',
    'The pot is somebody else’s problem until there are three of them left.',
    '{a} plays the day rather than the prize and has done since the first night.',
    'It is a number on a wall. {a} has better things to look at.',
    '{a} could not tell you what the pot is at without being told.',
    'Thinking about winning is how people stop paying attention, and {a} has noticed.',
    '{a} would rather concentrate on Thursday than on the end of this.',
    '{a} has decided the money is a distraction and treats it as one.',
    'Nobody wins this by wanting it, and {a} believes that quite firmly.',
    '{a} has not done the division and does not intend to.',
    '{a} spent the evening on people rather than on arithmetic.',
    'The prize will still be there. The room will not.',
  ],
  'did-the-arithmetic': [
    '{a} did the division tonight, properly, for every number of people it could end with.',
    '{a} knows what the pot is worth split three ways, and four, and two.',
    'It is a different game once you have looked at the number for two people.',
    '{a} has worked out precisely how much each banishment is worth, which is a cold thing to know.',
    'The maths is simple and {a} has been doing it since the second night.',
    '{a} worked out which of the people {sub} likes are also expensive.',
    'Every face at that table has a price now and {a} did that to {ref} this evening.',
    '{a} would like to stop thinking about it in pounds and cannot.',
    '{a} did the sum, wrote nothing down, and will not forget any of it.',
    'There is an amount at which {a} would do something {sub} would not otherwise, and {sub} now knows what it is.',
    '{a} spent the evening finding out {sub} is more interested in the money than {sub} had assumed.',
    'It is a lot split five ways. It is a life split two ways.',
  ],
};

registerEvent({
  id: 'grief-what-it-is-all-for',
  family: 'grief',
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'temperament', 'strategic', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return (gs.tr?.pot || 0) > 0 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-what-it-is-all-for');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'why-they-came': (st.loyalty / 10) * 0.35 + 0.2,
      'what-it-has-cost': (st.loyalty / 10) * 0.3 + (1 - st.temperament / 10) * 0.3,
      'not-thinking-about-it': (st.strategic / 10) * 0.3 + (st.temperament / 10) * 0.25,
      'did-the-arithmetic': (st.mental / 10) * 0.3 + (st.strategic / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'why-they-came';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'did-the-arithmetic' ? 'did the division and looked at the number'
      : branch === 'what-it-has-cost' ? 'added up what the week has already cost them'
      : branch === 'not-thinking-about-it' ? 'has stopped thinking about the prize at all'
        : 'remembered exactly why they came here';
    const line = fill(pick(rng, OWN_REASON_LINES[branch]), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-out: the walk as relief ───────────────────────────────────

const GLAD_OF_AIR_LINES = {
  'glad-to-be-out': [
    '{a} got through the gate and felt a whole day come off {posAdj} shoulders.',
    'It is a relief to be somewhere with weather in it, and {a} said so to nobody.',
    '{a} had not been outside the walls in three days and had not realised.',
    'The castle is beautiful and {a} was extremely glad to be a mile from it.',
    '{a} walked out into an ordinary field and felt briefly ordinary.',
    'Nobody can corner you on a road, and {a} enjoyed the hour for that alone.',
    '{a} took a breath at the top of the drive that {sub} had been holding since breakfast.',
    'For an hour {a} was a person walking rather than a person being watched.',
    '{a} would have kept walking past the mission if that had been allowed.',
    'The air out there is the only thing in this game nobody is playing.',
    '{a} looked back at the building once and did not want to go back to it.',
    'It is the best hour of the day and {a} has started counting on it.',
  ],
  'dreading-the-mission': [
    '{a} spent the walk out not looking forward to a single part of what was coming.',
    '{a} is bad at these and knows it and has to do one anyway.',
    'The missions are the one place {a} cannot hide, and {sub} was walking toward it.',
    '{a} would have taken a table over an afternoon of being watched work.',
    '{a} has failed one of these publicly and has not stopped thinking about it.',
    'Everybody sees what you can do out there, and {a} would rather they did not.',
    '{a} walked out with a knot that did not shift until it was over.',
    '{a} spent the road working out how to be useful without being central.',
    'It is an hour of being measured and {a} has never enjoyed being measured.',
    '{a} has already decided which part of it {sub} will be bad at.',
    '{a} arrived at the field wishing {sub} had a reason not to.',
    'The walk out is fine. It is what it walks toward.',
  ],
  'already-working': [
    '{a} used the whole walk to plan the afternoon rather than to enjoy it.',
    'A mission is the only place with a legitimate reason to be beside anybody, and {a} had a list.',
    '{a} knew who {sub} wanted to be paired with before the gate was shut.',
    '{a} spent the road deciding which two people to end up between.',
    'The work starts before the horn, and {a} has understood that all week.',
    '{a} had a question ready for somebody and a whole afternoon to ask it in.',
    'An hour’s walk is an hour to arrange an hour’s work.',
    '{a} was not looking at the hills at any point.',
    '{a} planned the afternoon down to who would be carrying what.',
    'Missions are where {a} does most of the real playing and {sub} prepares for them.',
    '{a} walked out already three moves into the day.',
    'By the time {a} reached the field, {sub} knew exactly what the field was for.',
  ],
  'walked-it-like-a-race': [
    '{a} went out at a pace nobody had asked for and did not apologise for it.',
    '{a} was at the field before half of them had cleared the drive.',
    'There is one thing {a} is unambiguously good at and it is happening this afternoon.',
    '{a} walked out like somebody who intends to be picked first.',
    '{a} took the hill without breaking stride and made sure it was seen.',
    'The mission is the one hour {a} does not have to be clever, and {sub} was glad of it.',
    '{a} spent the road out warming up, which nobody else thought to do.',
    'It is a small advantage and {a} intends to spend it in front of an audience.',
    '{a} likes being the useful one. It is not complicated and it works.',
    '{a} arrived at the field ready and stood there being ready for four minutes.',
    'Everybody else walked out worrying. {a} walked out looking forward to it.',
    'This is the part of the week {a} came for, whatever {sub} says at the table.',
  ],
};

registerEvent({
  id: 'trust-glad-of-the-air',
  family: 'trust',
  window: 'journey-out',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'strategic', 'boldness', 'physical'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-glad-of-the-air');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'glad-to-be-out': (st.temperament / 10) * 0.4 + 0.15,
      'dreading-the-mission': (1 - st.physical / 10) * 0.35 + (1 - st.boldness / 10) * 0.25,
      'already-working': (st.strategic / 10) * 0.5,
      'walked-it-like-a-race': (st.physical / 10) * 0.3 + (st.endurance / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'glad-to-be-out';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'walked-it-like-a-race' ? 'went out hard and let everybody see they could'
      : branch === 'dreading-the-mission' ? 'walked out dreading being watched work'
      : branch === 'already-working' ? 'planned the afternoon on the way to it'
        : 'was simply glad to be outside the walls';
    const line = fill(pick(rng, GLAD_OF_AIR_LINES[branch]), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── night: lying awake with a name ────────────────────────────────────

const AWAKE_WITH_IT_LINES = {
  'certain-of-someone': [
    '{a} lay in the dark with one name and no way to prove it until morning.',
    '{a} has been sure since about nine and has had six hours to be sure in.',
    'It is one of those certainties that arrives whole and cannot be argued with.',
    '{a} went through it once more in the dark and it came out the same.',
    'By two in the morning {a} was no longer wondering, only waiting.',
    '{a} would go and say it now if there were anybody awake to say it to.',
    'The name has been there so long it has stopped feeling like a guess.',
    '{a} is right, or {sub} is about to be very publicly wrong.',
    'There is nothing worse than being certain at midnight and waiting for nine.',
    '{a} rehearsed how to say it without sounding as certain as {sub} is.',
    'It is the kind of night that decides how somebody plays the next day.',
    '{a} slept eventually, and woke up with the same name.',
  ],
  'afraid-of-the-morning': [
    '{a} lay awake working out how many people would need to change their mind.',
    'The arithmetic does not favour {a} and {sub} did it four times anyway.',
    '{a} knows what tomorrow looks like and would like it not to.',
    'It is a bad feeling, knowing the room before you walk into it.',
    '{a} has been the name in that room before and can feel the shape of it again.',
    'There is nothing to do at three in the morning except be frightened efficiently.',
    '{a} counted the people who would speak up and ran out of fingers early.',
    '{a} thought about what {sub} would say and could not make it sound convincing.',
    'Tomorrow is coming whether {a} sleeps or not, and {sub} did not much.',
    '{a} would take being murdered over being banished, some nights.',
    'The castle is very loud when you are the only one awake in it.',
    '{a} watched the window get grey and gave up on sleeping.',
  ],
  'slept-fine': [
    '{a} put a whole day of this down and slept straight through it.',
    'Whatever is coming will come. {a} was unconscious by eleven.',
    '{a} has an enviable ability to stop, and used it.',
    'There is no decision to make until morning and {a} declined to make one.',
    'Whatever kept the corridor awake, it did not reach {a}.',
    '{a} sleeps better here than at home, which {sub} finds slightly insulting.',
    '{a} does not lie awake. It is possibly the best quality {sub} has in this game.',
    'Nothing in the head {a} took to bed was urgent enough to stay there.',
    '{a} went out cold and woke up ready, which is most of the battle.',
    'Being rested is an advantage nobody counts and {a} takes it every night.',
    '{a} slept like somebody with nothing to answer for, whatever the truth is.',
    'A whole floor of people worrying, and {a} in the middle of it, out.',
  ],
  'changed-their-mind': [
    '{a} went to bed certain of one name and woke up certain of a different one.',
    'Somewhere in the small hours the whole thing rearranged itself and came out the other way.',
    '{a} cannot reconstruct the step that changed it, only that it is changed.',
    'The name {a} had all week stopped fitting at about three in the morning.',
    '{a} woke up thinking about somebody {sub} had not suspected once, and cannot stop.',
    'It is the fourth theory of the week and it is the first one that has survived breakfast.',
    '{a} spent a night defending a position and lost the argument to {ref}.',
    '{a} is going to have to walk this back in front of people, and knows it.',
    'The new answer is worse, because {a} likes them.',
    '{a} liked being certain. {Sub} liked it more than {sub} liked being right, and noticed that.',
    '{a} has changed {posAdj} mind and has told nobody, which buys about a day.',
    'Sleep did something to the week and the shape it woke up in is not the shape it went to bed in.',
  ],
};

registerEvent({
  id: 'susp-awake-with-a-name',
  family: 'suspicion',
  window: 'night',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'temperament', 'boldness', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-awake-with-a-name');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'certain-of-someone': (st.intuition / 10) * 0.45 + (st.boldness / 10) * 0.15,
      'afraid-of-the-morning': (1 - st.temperament / 10) * 0.45 + (1 - st.boldness / 10) * 0.15,
      'slept-fine': (st.temperament / 10) * 0.45,
      'changed-their-mind': (st.intuition / 10) * 0.25 + (1 - st.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'certain-of-someone';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'changed-their-mind' ? 'went to bed sure of one name and woke sure of another'
      : branch === 'afraid-of-the-morning' ? 'lay awake counting the room against them'
      : branch === 'slept-fine' ? 'put the whole day down and slept through it'
        : 'lay awake certain of one name';
    const line = fill(pick(rng, AWAKE_WITH_IT_LINES[branch]), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-back: the one who walked home last ────────────────────────

const WALKED_LAST_LINES = {
  'deliberately-behind': [
    '{a} dropped to the back of the column on purpose and stayed there.',
    'It is the only place on the road where nobody is talking at you.',
    '{a} let everybody get twenty yards ahead and walked in their dust.',
    '{a} wanted an hour without being asked a question and took it.',
    'From the back you can see all of them at once, and {a} did.',
    '{a} has been at the front all week. Today {sub} was not.',
    'Being last is a way of being invisible, and {a} needed that today.',
    '{a} slowed down until the conversation ahead stopped including {sub}.',
    'Nobody looks behind them on a road home. {a} counted on it.',
    '{a} spent the whole walk watching backs and learning nothing, restfully.',
    'It is a strange comfort, being last in a line of people you distrust.',
    '{a} arrived last and had spent the whole hour glad of it.',
  ],
  'could-not-keep-up': [
    '{a} could not hold the pace and spent the last mile pretending it was a choice.',
    'The column pulled away from {a} somewhere after the ford.',
    '{a} arrived winded and hoped nobody had been counting.',
    'It is a small physical failure and in here nothing is small.',
    '{a} watched the group get further away and could do nothing about it.',
    'Somebody slowed to walk with {a} and {sub} was not sure whether to be grateful.',
    '{a} has been noticeably slower since the middle of the week, and has noticed.',
    'A castle on a hill is a cruel thing at the end of a long afternoon.',
    '{a} made it up the drive and had to stand still at the top of it.',
    'People remember who struggled, and {a} struggled where they could see.',
    '{a} spent the last stretch working out how to explain it at dinner.',
    'It was a long walk and {a} has a longer one tomorrow.',
  ],
  'took-the-long-way': [
    '{a} took the long way round the wall and came in through the far gate.',
    '{a} was not ready to be in a room with any of them yet.',
    'Ten extra minutes is not much, and it was exactly enough.',
    '{a} walked the whole perimeter rather than go straight in.',
    'The path round the back is longer and quieter and {a} has started using it.',
    '{a} arrived after everybody else and let them assume whatever they liked.',
    '{a} needed to be a person for a few minutes before being a player again.',
    'There is one bench on that path and {a} sat on it.',
    '{a} came in through a door that nobody watches.',
    'It buys nothing except ten minutes, and {a} wanted the ten minutes.',
    '{a} looked at the castle from the far side for a while before going into it.',
    'By the time {a} came through, the hall had already moved on without {obj}.',
  ],
  'set-the-pace': [
    '{a} set the pace home and did not once check whether anybody was keeping it.',
    '{a} was through the gate two minutes before anybody else and was already inside by the time the group arrived.',
    'The whole column walked at {a}\'s speed for an hour and most of them did not enjoy it.',
    '{a} led it home hard, which is either leadership or a message.',
    '{a} does not slow down for people and has stopped pretending to.',
    'Two of them asked {a} to ease off. {Sub} did, for about four minutes.',
    '{a} arrived home not winded at all, which several people noticed and one of them minded.',
    '{a} walked at the front for an hour and the rest of the group fell in behind without being asked.',
    '{a} took the front on the way out and kept it on the way back.',
    '{a} turned a walk into a race that nobody else agreed to.',
    '{a} was first up the drive and turned round to watch the rest of it arrive.',
    '{a} outpaced the whole group and spent the rest of the evening wondering whether that was smart.',
  ],
};

registerEvent({
  id: 'trust-the-back-of-the-column',
  family: 'trust',
  window: 'journey-back',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['physical', 'endurance', 'temperament', 'social', 'strategic'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-back-of-the-column');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'deliberately-behind': (st.strategic / 10) * 0.3 + (1 - st.social / 10) * 0.25,
      'could-not-keep-up': (1 - st.endurance / 10) * 0.4 + (1 - st.physical / 10) * 0.2,
      'took-the-long-way': (st.temperament / 10) * 0.25 + (1 - st.social / 10) * 0.25,
      'set-the-pace': (st.endurance / 10) * 0.3 + (st.physical / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'deliberately-behind';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'set-the-pace' ? 'set the pace the whole way home and never looked back'
      : branch === 'could-not-keep-up' ? 'could not hold the pace on the road home'
      : branch === 'took-the-long-way' ? 'took the long way round rather than go straight in'
        : 'dropped to the back of the column on purpose';
    const line = fill(pick(rng, WALKED_LAST_LINES[branch]), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── morning: how the room is holding one person now ───────────────────

const HOW_THEYRE_TREATED_LINES = {
  'people-are-warmer': [
    '{a} has noticed that people are being kinder this morning, and does not trust it.',
    'Three separate players went out of their way to speak to {a} before ten.',
    'Warmth in this castle usually means somebody wants something, and {a} knows it.',
    '{a} is either safe or being set up, and both look exactly like this.',
    'Somebody saved {a} a seat, which has not happened all week.',
    '{a} is being included suddenly and cannot work out what changed.',
    'It is nice. {a} would like to enjoy it and cannot.',
    'People are nicest to the person they have decided is not the problem.',
    '{a} got a good morning from somebody who has not used the name in days.',
    '{a} has been moved from one column to another in somebody else’s head.',
    'The room opened up around {a} today and {sub} spent the morning looking for the catch.',
    '{a} is popular this morning and intends to find out why before lunch.',
  ],
  'people-are-cooler': [
    '{a} walked into breakfast and something in the room adjusted.',
    'Two conversations changed subject when {a} sat down.',
    'Nobody has been rude. {a} is simply being talked around rather than to.',
    'It is not exclusion exactly. It is being handled.',
    '{a} has felt this before and it usually precedes a table.',
    'People are polite to {a} and specific with each other.',
    '{a} asked a simple question this morning and got a careful answer.',
    'Something was decided about {a} last night, in a room {sub} was not in.',
    '{a} noticed at breakfast and has been recalculating ever since.',
    'The temperature dropped about two degrees around {a} and only around {obj}.',
    '{a} is being kept at exactly arm’s length by four different people.',
    '{a} knows the sound of a room that has already voted.',
  ],
  'nothing-changed': [
    'Nobody treats {a} any differently, and {sub} is not sure that is good.',
    '{a} is neither suspected nor consulted, which is a strange place to stand.',
    'Being nobody’s problem is safe until it is time to be somebody’s ally.',
    '{a} has not been asked for an opinion in three days.',
    'The room moves around {a} without much reference to {obj}.',
    '{a} could probably reach the last five like this, and probably lose there.',
    'It is possible to be invisible in a castle this size, and {a} is managing it.',
    '{a} is doing well and has no idea whether {sub} is doing well.',
    'Nobody has said the name yet at a table, which is either skill or luck.',
    '{a} wondered this morning whether being forgettable is a plan or an accident.',
    '{a} has no enemies and no advocates, and knows which of those matters at the end.',
    'The week is going perfectly and {a} finds that mildly alarming.',
  ],
  'being-managed': [
    'People are being kind to {a} and {sub} can feel the shape of what it is for.',
    'It is warmth with a purpose behind it and {a} spotted the purpose first.',
    '{a} is being handled well. {Sub} would be enjoying it if {sub} had not noticed.',
    'Three people have been generous with {a} this morning and none of it was free.',
    '{a} knows what it looks like when somebody is banking a favour, because {sub} does it.',
    'The friendliness arrives just before the question, every time, and {a} has started counting.',
    '{a} is somebody\'s vote this week rather than somebody\'s friend, and can tell the difference.',
    'It is well done. {a} would like to know who taught them.',
    '{a} has decided to let it happen and see what they eventually ask for.',
    'Being wanted and being liked feel almost identical, and {a} has learned to test which.',
    'Somebody sat next to {a} at breakfast for a reason and it was not breakfast.',
    '{a} is being courted, which is flattering right up until you work out the price.',
  ],
};

registerEvent({
  id: 'grief-how-the-room-holds-them',
  family: 'grief',
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'social', 'temperament', 'strategic'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // Needs a week of behaviour for the room to have changed against.
    return peopleLost(gs) >= 2 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-how-the-room-holds-them');
    const a = ctx.actors[0];
    const st = pStats(a);
    // Bonds are the honest measure of how the room actually holds them.
    const others = (gs.activePlayers || []).filter(n => n !== a);
    const warmth = others.length
      ? others.reduce((acc, n) => acc + getBond(a, n), 0) / others.length
      : 0;
    const scores = {
      'people-are-warmer': Math.max(0, warmth) * 0.12 + (st.social / 10) * 0.2,
      'people-are-cooler': Math.max(0, -warmth) * 0.12 + (st.intuition / 10) * 0.2,
      'nothing-changed': 0.35 - Math.min(0.3, Math.abs(warmth) * 0.04),
      'being-managed': (st.intuition / 10) * 0.25 + (st.strategic / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'nothing-changed';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'being-managed' ? 'worked out the warmth in the room is being spent on them, not felt'
      : branch === 'people-are-warmer' ? 'noticed the room being suddenly kinder'
      : branch === 'people-are-cooler' ? 'noticed the room cooling around them'
        : 'noticed that nobody treats them any differently at all';
    const line = fill(pick(rng, HOW_THEYRE_TREATED_LINES[branch]), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});
