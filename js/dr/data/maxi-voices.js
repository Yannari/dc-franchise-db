// ══════════════════════════════════════════════════════════════════════
// dr/data/maxi-voices.js — the draft and the walkthrough, in their own words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The maxi challenge was HALF fixed. `familyForChallenge` gives the
// performance itself the challenge's own language — a Snatch Game collapse is
// breaking character in the second question, a Rusical collapse is being
// off-key in front of a live band — and that half is good. Two other beats on
// the same night were never touched, and dumping a Snatch Game and reading it
// is what showed how bad they are.
//
// ── ONE: THE PICK NEVER SAYS WHAT SHE PICKED ──────────────────────────
//
// Eleven `pick-reaction` cards on one episode, and between them they say
// "the pick", "it", "this one", "what is available" — on a night where the
// thing being picked is a CELEBRITY SHE HAS TO BE FOR SIX QUESTIONS. The
// engine knows exactly what she got; `assignment.picks[n].choice` has carried
// it since the draft resolver was written, and the screen even title-cases it
// onto the card. The prose could not say it.
//
// "First choice, best choice. Q5 takes what she wanted" is a sentence about
// nothing. "She wanted Judy and she got Judy" is the same beat with the show
// in it.
//
// ── TWO: THE WALKTHROUGH REPEATS ITSELF SIX TIMES ─────────────────────
//
// Worse, and it is arithmetic. The walkthrough event has FOUR variants and
// fires once per queen — ten times on that episode — so the draw exhausts and
// starts repeating. This printed verbatim, six times, in one prep room:
//
//   "The host stops at {a}'s station and looks at what she is building and
//    says one thing. The thing is specific..."
//
// And it is wrong twice over, because on a Snatch Game nobody is BUILDING
// anything — she is choosing a character and writing jokes. The note is also
// never specific, in a sentence that promises it is.
//
// ── THE TWO POOLS ─────────────────────────────────────────────────────
//
//   PICK_VOICES         4 role kinds × 4 pick tiers.  What she got.
//   WALKTHROUGH_VOICES  17 families.                  What the host said about it.
//
// ── WHY ROLE KINDS AND NOT CHALLENGE FAMILIES FOR THE PICK ────────────
//
// Because the pick is the same emotional beat everywhere and only the OBJECT
// changes, and the object arrives as `{d}`. A queen missing her first-choice
// character and a queen missing her first-choice verse are having the same
// afternoon. Keying this on all seventeen families would be sixty-eight tiers
// to say four things.
//
// The four kinds are the authored `roles` field in js/dr/data/challenges.js
// plus the one case it does not cover — a draft whose `roles` is null is
// drafting a PERSON, which is the makeover and the lip sync challenge.
//
// The walkthrough is the opposite case: the host's note is entirely about the
// work in front of her, and the work is different in every family. So that one
// is per family, like the performance it is a note about.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON, werk room register. Intimate and quick, people mid-job.
//
// Placeholders:
//   {a}  the queen.
//   {d}  WHAT SHE PICKED, already resolved to a readable name — "Judy
//        Garland", "The Prosecutor", "Verse Two", or the queen's own name in
//        a partner draft. THE WHOLE POINT OF THE PICK POOL: use it in most
//        lines. A test rejects a pick tier that never reaches for it.
//   {c}  the challenge, by name.
//
// {d} IS NOT ALWAYS PRETTY. It is a title-cased slug for anything without an
// authored name, so it may read like "Red Lame" or "Slot Three". Write around
// it as an object rather than leaning on it as a phrase: "she got {d}" is
// safe, "the {d} she had been planning all week" is not.
//
// Same rules as every other pool, all enforced by tests: no real people beyond
// the host and the authored panel, this show's vocabulary only, never quote a
// stat by number, prose rather than captions.

import { MAXI_TYPES } from './challenges.js';

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four pick outcomes. These are the tiers of `pick-reaction`. */
export const PICK_TIER_IDS = ['got-it', 'settled', 'left-over', 'picked-last'];

/**
 * HOW MANY VARIANTS, and it is not four.
 *
 * `pick-reaction` fires once per queen with a pick — eleven times on the
 * episode that produced this file — and `settled` took six of them against a
 * four-variant pool, so two queens got the same paragraph word for word. The
 * walkthrough is worse: four variants, ten fires, and the same line printed
 * six times.
 */
export const MAXI_VARIANTS = { 'got-it': 6, settled: 8, 'left-over': 6, 'picked-last': 6, walkthrough: 8 };

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — THE DRAFT. What she got, and how she took it.
// ══════════════════════════════════════════════════════════════════════

/**
 * One kind of pick, from whatever shape the author used.
 *
 * VARARGS ON PURPOSE. `P(...)` groups the four tiers when they are all
 * written together, but a writer filling one tier at a time naturally closes
 * `P(` after the first and leaves the other three as siblings — which is what
 * happened, and the file stopped parsing. Taking the rest and flattening it
 * accepts both without asking anybody to remember which.
 */
const kind = (id, note, ...rest) => ({
  kind: id, note, tiers: tiersFrom(PICK_TIER_IDS, rest.flat()),
});

/**
 * Build the four pick tiers from whatever shape the author used.
 *
 * THE FIRST VERSION TOOK FOUR NOTE STRINGS AND NOTHING ELSE, which is a
 * schema that cannot be filled: there was nowhere to put the lines. Anybody
 * writing prose into it had to break out of the helper, and the file stopped
 * parsing the moment somebody did.
 *
 * So it accepts all three shapes, in tier order, mixed freely:
 *   'a note'                     an unwritten tier
 *   'a note', ['line', ...]      a note and its lines
 *   tier('got-it', 'note', [..]) an already-built tier, id and all
 */
const tiersFrom = (ids, args) => {
  const out = [];
  let i = 0;
  for (const id of ids) {
    const v = args[i];
    if (v && typeof v === 'object' && !Array.isArray(v)) { out.push(v); i += 1; continue; }
    const next = args[i + 1];
    if (Array.isArray(next)) { out.push(tier(id, v, next)); i += 2; continue; }
    out.push(tier(id, v));
    i += 1;
  }
  return out;
};

// A pass-through, so `P(...)` and a bare list of tiers are the same thing to
// `kind` above. It survives only because the authored files already use it.
const P = (...args) => args;

export const PICK_VOICES = [
  kind('characters',
    'SNATCH GAME, and nothing else. {d} is a person she now has to BE — the '
    + 'voice, the hair, the six answers. The most consequential pick in the '
    + 'season: a queen who loses her character loses the week, because the '
    + 'second choice is somebody she has not practised in a mirror.', P(
      'She got {d}, which is the one she has been doing at home for years.', [
        '{a} takes {d} and the relief on her face is visible — this is the character she packed a wig for, the voice she has been practising in the mirror since she got her flight confirmation.',
        'First choice, first pick: {a} takes {d} and immediately starts muttering in a voice that is not her own, because she has been doing {d} at home long enough that the transition is muscle memory.',
        '{a} grabs {d} before anybody else can, and {d} is the character she came here to play. The wig is ready, the jokes are ready, and the six answers are already written in her head.',
        '{a} lands {d} and sits down grinning, because {d} is the one she has been studying for weeks and the one she has six answers for and the one that fits her face.',
        '{a} picks {d} and the werk room watches a queen who just got exactly what she wanted and knows it — the voice is already shifting, the shoulders are already moving, and {d} is about to walk this room before the cameras even start.',
        '{a} takes {d} — her first choice, her only choice, the character she has been rehearsing since the cast list dropped. She sits back down and starts writing answers she already has.',
      ]),
      tier('settled', 'Not {d}, but she has something. She is already rebuilding the voice.', [
        '{a} takes {d} and the choice is not the choice she walked in with, but it is a choice she can build on — she is already at her station adjusting the voice, reshaping the material, figuring out which of her prepared jokes can bend to fit a different mouth.',
        'Not her first pick, but {a} takes {d} and gets to work immediately, because the difference between settling and losing is what you do with the character in the twenty minutes between the draft and the game.',
        '{a} settles on {d} and the settling is visible — a breath, a nod, and then the hands start moving. She did not come here for {d}, but she came here with enough range that {d} is a person she can become.',
        '{a} picks {d} and it is not the character she packed for, but it is a character, and {a} is already at her station finding the voice, finding the walk, finding the one thing about {d} that she can build six answers around.',
        'Not the dream pick. {a} takes {d} and the adjustment happens in real time — the prepared wig will not work, the prepared answers need rewriting, but the core of a performance is forming behind {a}\'s eyes as she walks back to her station.',
        '{d} was not the plan. {a} takes the character and sits down and the face shifts from disappointment to calculation in about four seconds, which is the face of a queen who has decided to make this work rather than mourn the character she lost.',
        '{a} settles on {d} with the composure of a queen who has a backup plan and is activating it now. The voice is new. The material is being rebuilt. The six answers are being rewritten at her station before the next pick is made.',
        '{a} lands on {d} and the walk back to her station is the walk of a queen already building — not the character she rehearsed, but a character, and having a character is better than having a gap where a character was supposed to be.',
      ]),
      tier('left-over', 'She is left with {d}, whom she has never once attempted.', [
        '{a} is left with {d} and the problem is immediate: she has never done {d}, has never practised {d}, and is sitting at a station staring at a name she has to become in less than an hour with no material and no wig.',
        'The draft lands {a} with {d}, and {d} is a character she has never attempted — no voice, no material, no reference beyond what everybody knows, and the Snatch Game does not care that she did not choose this.',
        '{a} gets {d} by elimination and the silence at her station is the silence of a queen who is starting from nothing — no rehearsed lines, no prepared wig, no sense of what {d} sounds like, and a clock that is already running.',
        'What is left is {d}, and what {a} has prepared for {d} is nothing. She sits down with a blank page and a character she has to learn in the time it takes the other queens to fine-tune characters they already know.',
        '{a} takes {d} because {d} is what is available, and available is the only criterion left when the draft has passed her by. She has never once practised {d} and the prep time is the prep time everybody else is using to polish, not to start.',
        '{a} is handed {d} by the draft and the handing is not kind — she has no voice, no references, no jokes, and the queen across the room who got her first choice is already rehearsing while {a} is still googling.',
      ]),
      tier('picked-last', 'Last pick, and {d} is whatever nobody else was willing to try.', [
        'Last pick. {a} takes {d} and {d} is what is left after every other queen took what she wanted, and the reason {d} is still on the board when {a} gets there is the same reason {a} is sitting at her station with the expression of somebody who has been handed a problem.',
        '{a} is picked last and {d} is what remains — a character nobody else wanted, for reasons that are about to become {a}\'s reasons, in a game where the character IS the week and {a} is playing a character chosen by elimination.',
        'The board is empty except for {d}. {a} takes it because there is nothing else to take, and the fact that every queen in the room passed on {d} is the fact {a} is trying not to think about as she walks back to her station.',
        'Last pick, last character: {a} gets {d}, which is the name nobody wanted, and the work now is not preparation — it is invention, building a performance out of a character she did not choose and cannot trade.',
        '{a} picks last and gets {d}, and {d} is the character left on the table because every other queen in the room saw it and chose something else, and {a} is now sitting with the consequences of every choice that was not hers.',
        'Picked last. {a} takes {d} and sits down with the energy of a queen who knows she has the hardest path in the room and no time to feel sorry about it — the game starts in an hour and she is starting from a name on a card.',
      ]),
    ),
  kind('parts',
    'A SCRIPTED ROLE with lines already written for it. {d} is a part in '
    + 'somebody else\'s script — the size of it, the jokes in it and whether '
    + 'it suits her are all decided before she opens her mouth.', P(
      'She wanted {d} and got {d}, and {d} is the part with the lines in it.', [
        '{a} takes {d} and the part is the one with the jokes — the lines are already written, the exits are already blocked, and the size of {d} in the script is the size {a} wanted when she walked into the room.',
        'First pick, best part: {a} grabs {d} and {d} is the role everybody knew had the material. The lines are there, the beats are there, and {a} is already reading them at her station with the expression of a queen who got what she came for.',
        '{a} lands {d} — the part she wanted, with the jokes she could see from the table, in a script where the distribution of funny is not equal and {a} just took the largest share of it.',
        '{a} takes {d} and sits down with the script open to her scenes, and the scenes are the scenes she wanted — enough lines, enough space, enough room to make the part hers rather than the part making her its.',
        '{a} picks {d} and the choice is the choice that came with the most material already on the page, which means the hardest part of {c} is already done and the rest is delivery.',
        '{a} claims {d} and the claim is confident because {d} is the part with lines, with beats, with a character she can see herself inside of — and she grabbed it before anybody else could.',
      ]),
      tier('settled', 'Not the part she wanted. {d} is workable and she is deciding how.', [
        '{a} takes {d} and the part is not the part she came in wanting, but it is a part — lines on a page, a character to build, and enough material that the performance will not be a queen standing in a scene she cannot fill.',
        'Not first choice. {a} settles on {d} and starts reading the lines, and the lines are workable — not the funniest part in the script, not the biggest, but a part with enough in it to make something out of.',
        '{a} picks {d} and the pick is a pragmatic one — not the role with the most jokes, but a role with some, and {a} is already at her station figuring out how to make {d} more than what is on the page.',
        '{d} is not the dream role, but {a} takes it with the composure of a queen who knows that a middling part well-performed beats a great part phoned in, and starts working the lines immediately.',
        '{a} settles on {d} and the adjustment is quiet — a read through the script, a nod, and then she starts marking the beats she can push. The role is not the biggest one in the room, but the biggest role in the room is already taken.',
        '{a} takes {d} and the part is enough. Not generous, not bare, but enough — and {a} is at her station running the lines before the draft has finished, which is the face of a queen who has decided to earn the part rather than wish for a different one.',
        'Not her first pick, but {a} takes {d} and finds the handle immediately — there is a joke on page two and a character choice on page three, and the rest is what she brings to a part that is waiting to be brought something.',
        '{a} picks {d} and sits down with a script that has a role in it she can work with, and working with it is already happening — the lines are being read, the delivery is being tested, and the part is becoming hers.',
      ]),
      tier('left-over', '{d} is the part left on the table, and there is a reason it was left.', [
        '{a} is left with {d} and {d} is the part everybody else saw and walked past, and the reason they walked past it is visible in the script: thin lines, fewer beats, and a character that exists to serve somebody else\'s jokes.',
        'The draft lands {a} on {d}, and {d} is the part that sat on the table while better parts were claimed around it. {a} opens the script and the part is exactly as sparse as the queens who skipped it suspected.',
        '{a} gets {d} by elimination and the script confirms the draft\'s opinion — {d} has fewer lines, fewer entrances, and less to do than the roles already claimed, and {a} is starting from a page with less on it.',
        '{a} takes {d} because {d} is what remained, and what remained is a role the script did not prioritise — smaller scenes, fewer jokes, and the kind of part that asks a queen to create something almost entirely from her own pocket.',
        '{a} is handed {d} and {d} is the part left behind — not because it cannot be played, but because the parts claimed ahead of it could be played more easily, and the gap between easy material and thin material is the gap {a} now has to close.',
        'What is left is {d}. {a} opens the script to her scenes and the scenes are short and the lines are functional and the comedy is going to have to come from somewhere the script did not put it, which is wherever {a} can find it.',
      ]),
      tier('picked-last', 'Picked last, and {d} is a part with almost nothing in it.', [
        'Last pick. {a} takes {d} and {d} is the part the script barely acknowledges — a handful of lines, most of them reactive, in a show where the reactive parts disappear behind the proactive ones, and {a} is holding a script that has almost nothing on her pages.',
        '{a} picks last and gets {d}, which is the one-scene, two-line, barely-there part that every other queen avoided, and the script is open on {a}\'s lap with a highlighter that has almost nothing to highlight.',
        'Picked last. {a} takes {d} and the part is a part in the way that a cameo is a part — present, technically, in a show that belongs to somebody else. {a} is going to have to build something out of almost nothing.',
        '{a} is picked last and {d} is the leftover — the role with the fewest lines, the smallest presence, and the kind of material that asks a queen to be memorable with almost no tools to be memorable with.',
        'Last pick, and {d} is what remains: a part so thin that {a} can read all of her lines in the time it takes the first-pick queen to read her first scene, and the gap between those two parts is the gap the draft created.',
        '{a} picks last and gets {d}, and {d} is barely a part — a walk-on with dialogue that fits on one side of a cue card, in a script where other queens have pages.',
      ]),
    ),
  kind('slots',
    'A POSITION IN A GROUP NUMBER — a verse, an eight-count, a place in the '
    + 'running order. {d} is not a character, it is real estate: where in the '
    + 'song she stands and how much of it is hers.', P(
      '{d} is the spot everybody wanted and she took it first.', [
        '{a} takes {d} and {d} is the position everybody in the room was looking at — the verse with the most bars, the slot in the running order that gets the audience at its warmest, the piece of real estate in {c} that {a} claimed before anybody else could.',
        'First pick: {a} grabs {d} and {d} is the prime position in the number. She walks back to her station with the slot that has the most room in it, the most time in it, and the most opportunity to be seen.',
        '{a} takes {d} and the choice is immediate and deliberate — she wanted {d} because {d} is the position in {c} where a queen can shine, and she took it before the competition had a chance to weigh in.',
        '{a} claims {d} and the claim is strategic — {d} is the position with the most real estate, the best placement in the number, and the kind of slot that lets a queen control how the audience remembers her.',
        '{a} picks {d} and {d} is the slot that gives her the most to work with — the most counts, the best placement, the position in {c} that every queen in the room wanted and one queen got.',
        '{a} takes {d} first and the position is the one she came in wanting — the spot in the number that has the most room to move, the most bars to fill, and the best sight line to the panel.',
      ]),
      tier('settled', '{d} is not the spot she wanted, and she can work with where she is.', [
        '{a} takes {d} and {d} is not the position she walked in wanting, but it is a position — a verse, a count, a slot in {c} that has enough room to work with if the queen standing in it works hard enough.',
        'Not the dream slot. {a} settles on {d} and starts counting the bars she has, and the bars are enough — not generous, not prime, but a piece of the number she can own if she commits to owning it.',
        'The room watches {a} take {d} and nobody reacts, which tells {a} everything about where {d} sits in the pecking order of {c}. She files that away. A position nobody envies is a position nobody is watching, and being unwatched has its own uses on a night like this.',
        '{d} is not the spot {a} came for, but {a} takes it and starts working it — finding the pocket in her verse, marking the counts in her section, locating the moment in her slot that she can push into something the panel remembers.',
        '{a} settles on {d} and the settling is pragmatic — the best positions are taken, the remaining positions are fine, and fine is a starting point rather than a ceiling for a queen who knows how to work a stage.',
        '{a} takes {d} and the position is middle-of-the-pack, which is where the position is and not where the performance has to be. She starts counting her bars with the focus of a queen making the best of a slot that is neither a gift nor a punishment.',
        'Not first choice, but {a} picks {d} and starts learning her section immediately, because the slot is the slot and what she does inside it is the variable she controls.',
        '{a} takes {d} and goes straight to the queen who got the slot before hers, because a number is a relay and the handover is the part nobody rehearses. Whatever {d} lacks on the count sheet, it has a neighbour, and {a} has decided the neighbour is the opportunity.',
      ]),
      tier('left-over', '{d} is what nobody chose, and she can hear why.', [
        '{a} is left with {d} and {d} is the slot that sat unclaimed while better positions were drafted around it — fewer bars, a harder placement, or a position in {c} that asks a queen to shine in a part of the number where the audience is not looking.',
        'The draft leaves {a} with {d}, and {d} is the position the room avoided — a short verse, a buried slot, a piece of the number that every queen ahead of her in the draft saw and chose something else.',
        '{a} gets {d} by elimination and the slot is exactly as unappealing as the draft suggested — a thin section of the number, a placement that fights the energy in the room, and a count that gives her less than the queens around her.',
        '{a} takes {d} because {d} is what is left, and what is left is a position in {c} that nobody chose because the positions that got chosen first were chosen first for a reason {a} can now hear in the count.',
        'What remains is {d}. {a} takes the slot and starts counting, and the count is short, and the placement is hard, and the number is not going to wait for her to figure out how to make a thin section feel full.',
        '{a} is handed {d} and {d} is the leftover slot — the verse nobody wanted, the eight-count nobody chose, the position in {c} that asks a queen to be memorable in a part of the number that was not designed to be memorable.',
      ]),
      tier('picked-last', 'Picked last and handed {d}, which is barely a position at all.', [
        'Last pick. {a} takes {d} and {d} is the scraps of the number — a position so thin that calling it a slot is generous, in a challenge where the other queens have verses and {a} has a couplet.',
        '{a} picks last and gets {d}, and {d} is not really a position — it is what is left after the real positions have been claimed, and {a} is standing in a part of {c} that barely exists on the count sheet.',
        'Picked last. {a} takes {d} and the slot is the slot that remained because it is barely a slot — fewer bars than anybody else, a placement the audience will not notice, and a piece of the number that exists as a transition, not a moment.',
        '{a} picks last and {d} is what nobody wanted — the smallest slot in {c}, the shortest verse, the part of the number that was designed to connect two other parts and never to stand on its own.',
        '{a} is handed {d} and does the arithmetic out loud, which is a mistake, because saying the number of counts she has been given makes the queens around her wince. Nobody argues with her. Nobody offers to swap. That silence is the second thing that happens to {a} tonight.',
        '{a} is last and {d} is last, and the combination of a last-picked queen and a last-available position is the combination that produces either the most invisible performance of the night or the most surprising one.',
      ]),
    ),
  kind('partner',
    'A PERSON, not a thing. {d} is another queen — the one she has to make '
    + 'over, or the one she has to face. Everything about her week now depends '
    + 'on somebody who has her own opinions about it.', P(
      'She took {d}, and taking {d} was the whole plan.', [
        '{a} takes {d} and the choice is not a surprise — she has been watching {d} since the first week, studying the proportions, the skin tone, the features, because {d} is the queen she knew she could transform and the one she wanted standing next to her.',
        'First pick: {a} chooses {d}, and {d} is the queen she came into the room planning to take. The two of them meet eyes across the werk room and the pairing is set, and {a} is already looking at {d}\'s face like a canvas.',
        '{a} takes {d} and the take is deliberate — she picked the queen whose face she understands, whose body she can dress, whose proportions she has been sketching in the margins of her notebook since {c} was announced.',
        '{a} claims {d} and the claim is the whole strategy — {d} is the queen she can see herself in, the queen she can make look like family, and the queen she took before anybody else had the chance.',
        '{a} picks {d} and {d} is the person she wanted standing next to her on the runway — the face she can paint, the body she can style, the queen she chose because the choosing is half the challenge.',
        '{a} takes {d} with the certainty of a queen who has been planning this pairing since the day {c} was announced, and {d} walks over with the expression of somebody who has just become somebody else\'s project.',
      ]),
      tier('settled', '{d} was not who she came for, and {d} will do.', [
        '{a} takes {d} and {d} was not the plan, but {d} is a queen, and a queen is a face and a body and a set of proportions that {a} is now studying with the intensity of somebody who has to make a stranger look like her sister.',
        'Not her first choice. {a} settles on {d} and the two of them size each other up — {a} looking at the bone structure and the skin tone and the things she can work with, {d} looking at {a} and wondering what she is about to become.',
        '{a} picks {d} and the pick is a pivot — not the queen she walked in wanting, but a queen she can work with, and the walk from the draft board to {d}\'s station is the walk of a queen recalculating in real time.',
        '{d} was not who {a} came for, and {a} takes a moment to adjust — studying {d}\'s face the way you study a face you have to transform in a hurry, finding the angles that work and accepting the ones that do not.',
        '{a} settles on {d} with the composure of a queen who knows that the partner you get is the partner you get, and the two of them sit down together to start figuring out how to look like they belong next to each other.',
        'Not the dream pairing, but {a} takes {d} and starts working immediately — examining the jawline, the brow, the shape of the eyes, building a plan for a face she did not expect to be painting today.',
        '{a} takes {d} and {d} accepts the pairing with a nod, and the nod begins a partnership that neither of them planned for and both of them have to make work before the runway.',
        '{a} picks {d} and the adjustment is happening in real time — the look she had in mind is being rebuilt for a different body, a different face, a different queen than the one she walked in wanting.',
      ]),
      tier('left-over', 'She is left with {d}, which is a pairing neither of them chose.', [
        '{a} is left with {d} and neither of them chose this. The two of them sit down together with the energy of queens who have been assigned to each other by arithmetic rather than by desire, and the work of making that look like a choice starts now.',
        'The draft pairs {a} with {d} by elimination, and the pairing has the energy of two strangers at a bus stop — they are here together because nobody else is, and the challenge of looking like family starts from a place where they are not.',
        '{a} gets {d} because {d} is who is left, and {d} gets {a} for the same reason, and the two of them begin {c} from the unique position of a partnership that exists because nothing else did.',
        '{a} and {d} find each other by process of elimination and sit down together, and the sitting has the quality of two people deciding to make the best of a situation neither of them designed — different proportions, different faces, and a runway coming.',
        '{a} takes {d} because the draft left no other option, and the pairing is what it is — two queens who did not pick each other trying to look like they did, which is its own kind of challenge inside {c}.',
        '{a} is handed {d} by the order of the draft, and {d} is handed {a} by the same order, and the mutual lack of choice is the thing they are going to have to work around before they can work together.',
      ]),
      tier('picked-last', 'Picked last and paired with {d} by process of elimination.', [
        'Last pick. {a} takes {d} because {d} is the only queen left, and {d} takes {a} because {a} is the only queen left, and the pairing is two last picks walking toward each other with the energy of the only two people at a party who have not been introduced.',
        '{a} is picked last and paired with {d} by default, and the default is visible — neither of them chose this, the room chose it for them, and the challenge of {c} now includes the challenge of pretending that did not happen.',
        'Picked last. {a} gets {d} and the getting is mutual and involuntary — the draft has run its course and the two queens at the bottom of it are now a pair, and the pair starts working with the quiet determination of people who know they did not choose this.',
        '{a} and {d} are what is left, and what is left is a pairing assembled from the remains of a draft that served everybody else first. The two of them sit down together and the sitting is a decision to start rather than to complain.',
        'Last pick, last partner: {a} and {d} find each other at the bottom of the draft and begin {c} from the position of two queens who arrived at each other by elimination rather than by intention.',
        '{a} picks last and gets {d}, and {d} is paired with {a} by the only force more impersonal than a draft — the fact that nobody else is available, and the fact that {c} does not wait for queens to feel ready.',
      ]),
    ),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — THE WALKTHROUGH. What the host said, about this week's work.
// ══════════════════════════════════════════════════════════════════════
//
// She walks the room mid-build and stops at each station. The note is the
// most useful thing anybody says to a queen all week, because the runway can
// still answer it — and this beat has been printing "she looks at what she is
// building and says one thing, and the thing is specific" without ever being
// specific, over challenges where nothing is being built.
//
// SO SAY THE NOTE. Not that a note was given: what it was about. A Snatch
// Game note is about the character choice and whether she has jokes for it. A
// design note is about construction and whether the material is being used or
// hidden. A Rusical note is about whether she knows the words yet.
//
// ONE TIER PER FAMILY. There is no good/bad split: the host's note is neither,
// and a queen taking it well or badly is a separate beat that already exists.
// Write the range inside the pool — some notes are a rescue, some are a
// warning, and the same eight lines should cover both.

const walk = (family, note, lines = []) => ({ family, note, lines: lines.slice() });

export const WALKTHROUGH_VOICES = [
  walk('snatch-game', 'The character, and whether she has six answers for it.', [
    'The host stops at {a}\'s station and asks about the character, and {a} drops into the voice mid-answer, testing it on the one person in the room whose reaction matters — and the host either laughs or does not, and both are the note.',
    'The host sits down across from {a} and the question is the question: who is she doing, and does she have the jokes. {a} runs through a line in character, and the host\'s face either opens or tightens, and the tightening is the warning.',
    'The host asks {a} to show her the character, right here, in the werk room, without the wig and without the costume, and what comes out of {a}\'s mouth is either a voice that sounds like somebody or a voice that sounds like {a} trying.',
    '{a} walks the host through her character — the voice, the references, the six answers she has prepared — and the host listens with the expression of a person who has watched queens crash at {c} enough times to see it coming.',
    'The host stops at {a}\'s station and the walkthrough is a dress rehearsal for {c}: do the voice, tell me a joke, show me you have something to say in the third question when the panel asks you something you did not prepare for.',
    'The host pulls up a chair and {a} does the character, and the host gives her a note that is either "you have something" or "you do not have enough", and the note lands differently depending on whether {a} agrees with it.',
    '{a} shows the host her material and the host responds with the honesty of a person who is about to watch {a} perform this on camera and wants it to go well more than she wants {a} to feel comfortable right now.',
    'The host walks {a}\'s character and the walkthrough is pointed — does the voice hold for six questions, does the impression have depth past the first catchphrase, can {a} improvise when the panel throws something she has not rehearsed.',
  ]),
  walk('girl-group', 'Her verse, her eight-count, and whether the group is one thing.', [
    'The host watches {a} run her verse and listens for the thing that will either save or sink her: whether the lyrics are learned, whether the delivery has personality, and whether {a}\'s section of the number belongs to the same song as everybody else\'s.',
    'The host stops at {a}\'s section and the note is about fit — does her verse match the energy of the group, does her eight-count land on the count, is the thing she is doing in her corner going to cohere with the thing the queen next to her is doing.',
    '{a} runs her verse for the host and the host watches the mouth and the feet at the same time, because a girl group number falls apart when a queen knows the words but not the steps, or knows the steps but not the words.',
    'The host asks {a} to sing her section, and {a} sings it, and the host gives her a note about either the lyrics or the delivery or the choreography, and the note is the distance between what {a} thinks she has and what {a} actually has.',
    'The host pulls {a} aside and walks her verse — the lyrics, the attitude, the eight-count that leads into the chorus — and the walk produces a note specific enough to fix something and general enough to worry about something else.',
    '{a} shows the host her part of {c} and the host looks at the group and looks back at {a} and the note is about whether {a}\'s section matches what the rest of the group is building, because a girl group number is one song, not five solos.',
    'The host watches {a}\'s section and the note lands on the thing {a} was hoping nobody would notice — a lyric she has not landed, a count she is half a beat off, a delivery that reads as uncertain in a number that needs to read as confident.',
    'The host stops the room and listens to {a}\'s verse in context, and the context is what the note is about — is {a}\'s energy the same energy as the queens on either side of her, and if not, what does {a} need to change.',
  ]),
  walk('rusical', 'The words, the key, and whether she knows it yet.', [
    'The host asks {a} to sing it, right here, in the werk room, and what comes out is either the words in the right key or the words in approximately the right key, and the approximation is the note.',
    '{a} runs her part of the Rusical for the host and the host listens for the thing that a live audience will hear instantly: whether {a} knows the words, whether she is in the right key, and whether the performance has shape or just volume.',
    'The host stops at {a}\'s station and asks to hear it, and hearing it in the werk room without a backing track is the cruelest and most useful test — every flat note is exposed, every lyric gap is audible, and the host\'s note is about what needs fixing.',
    '{a} sings for the host unaccompanied, and the host gives her a note that is either about pitch or about performance, and the distinction matters — a pitch note is fixable, a performance note is a warning that knowing the words is not enough.',
    'The host pulls {a} aside and the Rusical walkthrough is a vocal check: sing it, full voice, no backing track, in a room where everybody can hear you. {a} sings. The host makes a face that is either encouraging or concerned.',
    '{a} runs her section and the host listens with the ear of somebody who knows that a Rusical in the werk room and a Rusical on the stage are different animals, and the note is about whether {a}\'s preparation will survive the transition.',
    'The host asks for the verse and the verse comes out, and the host\'s note is about what the verse sounds like to an audience that has not heard it before — is the story clear, is the melody carried, does it sound rehearsed or memorised.',
    'The host watches {a} perform her Rusical section and the walkthrough becomes a coaching session — a note on the key, a note on the acting inside the singing, a note on whether {a}\'s piece connects to the pieces around it.',
  ]),
  walk('roast', 'Her material — read aloud, in the room, before anybody laughs.', [
    'The host asks {a} to read her material, out loud, in the werk room, where the jokes have to work without a spotlight and without an audience, and the silence between the punchlines is the note.',
    '{a} reads her roast set to the host and the host listens without laughing, which is not cruelty — it is the host hearing the material the way a panel will hear it, stripped of delivery, testing whether the jokes stand on their own.',
    'The host stops at {a}\'s station and the walkthrough is a table read of comedy: read me the set, read me the callbacks, read me the closer. {a} reads. The host gives a note about structure that is more useful than any note about individual jokes.',
    '{a} runs her roast material for the host and the host\'s face does the thing a host\'s face does when material is either landing or not landing, and {a} watches the face and knows which one it is before the note arrives.',
    'The host sits with {a} and asks to hear the set, and the set sounds different in the werk room than it does in {a}\'s head, because the werk room does not laugh politely and the host does not laugh at all — she listens and then speaks.',
    '{a} reads her jokes to the host and the host\'s note is about the arc — not whether the jokes are funny but whether the set has a shape, whether it builds, and whether the closer earns the walk-off.',
    'The host pulls {a} aside and listens to the material, and the listening is clinical — timing, callbacks, whether {a} is roasting or just reading insults, and whether the difference between those two things is visible in the writing.',
    '{a} walks the host through her roast set and the host gives a note that {a} can either use or ignore, and both are valid, and both will be visible on stage — the used note as a fix, the ignored note as a gap.',
  ]),
  walk('makeover', 'The two of them side by side, and whether they read as family.', [
    'The host looks at {a} and her partner side by side and the walkthrough is a single question: do they look like they belong together? The note is about the gap between them — the mug, the hair, the styling — and whether {a} can close it before the runway.',
    'The host stops at {a}\'s station and looks at the two of them next to each other, and the note is visual — does the paint match, does the silhouette match, would a stranger looking at these two queens believe they are family.',
    '{a} stands next to her partner and the host studies the pairing the way the panel will study it: as two people who are supposed to look like they belong to each other, and the host\'s note is about everything that currently says they do not.',
    'The host walks {a}\'s makeover and the walkthrough is a side-by-side comparison — the paint, the proportions, the overall concept, and whether the family resemblance reads from ten feet away or only from three.',
    '{a}\'s partner stands in whatever {a} has built so far, and the host looks at the two of them and gives a note that is either "I see it" or "I do not see it yet", and the "yet" is the useful part.',
    'The host asks {a} to show her the look so far, and {a}\'s partner presents what {a} has painted and styled, and the host evaluates the pairing as a unit, not as two individuals who happen to be standing next to each other.',
    '{a} and her partner stand together and the host walks around them, and the note is about the one thing that breaks the illusion — a mismatched brow, a silhouette that diverges, a concept that reads on one body and not on the other.',
    'The host checks {a}\'s makeover and the check is honest — does the partner look like family or does the partner look like a stranger in borrowed clothes, and the difference between those two is the note.',
  ]),
  walk('ball', 'Three looks, one of them still in pieces on the table.', [
    'The host stops at {a}\'s station and there are three looks on the table, two of them finished and one of them in pieces, and the note is about the one in pieces because the one in pieces is the one that will be judged the hardest.',
    '{a} shows the host her ball looks and the host studies the construction of the design look — the one that is still being built, the one that matters most, the one where the materials on the table have to become a garment before the runway.',
    'The host walks {a}\'s ball and the walkthrough covers three looks in ninety seconds, but the note always lands on the same one — the look she is building, the look that is not done, the look where the gap between concept and construction is still visible.',
    '{a} lays out her three looks and the host looks at them in order and gives a note about the arc — whether the three looks build, whether they tell a story, and whether the design look finishes the story or leaves it half-told.',
    'The host asks {a} about the concept and {a} explains the three looks, and the host\'s note is about the design look — the one still on the table, the one that has to be on a body in a few hours, where ambition and time have to meet.',
    '{a}\'s ball looks are laid out and the host gives a note that is about the weakest of the three, because the ball is three looks and a queen is only as strong as her weakest one.',
    'The host walks {a}\'s station and the note lands on construction — is the design look going to be a garment or is it going to be fabric with intent, and does {a} have the skills and the hours to close the gap.',
    'The host circles {a}\'s station once, studying the constructed garment from every angle, and the feedback lands where it always lands at a ball — on whether the ambition behind {a}\'s design can survive the hours remaining, or whether what is unfinished will stay that way.',
  ]),
  walk('design', 'Construction, and whether the material is used or hidden.', [
    'The host stops at {a}\'s station and picks up a piece of the material and holds it and looks at what {a} is doing with it, and the note is about whether the material is being used — shaped, structured, made into something — or draped over a body and called a garment.',
    '{a} shows the host her design and the host feels the construction, because design challenges are judged by touch as much as by sight — is it sewn or is it glued, is the material a choice or a surrender, does the garment have structure.',
    'The host walks {a}\'s design and the walkthrough is a construction check: how is it built, what is the material doing, is the thing on the dress form a garment that would survive a walk down the runway or a concept that would not survive a breeze.',
    'The host looks at {a}\'s design and the note is about the material — is {a} using it or is {a} hiding it, because the difference between a queen who understands fabric and a queen who is fighting it is visible in every seam.',
    '{a}\'s design is on the form and the host examines it with the specificity of somebody who knows what a finished garment looks like and can tell, from four feet away, whether this one is going to be finished or explained.',
    'The host asks {a} to show her the back, because the back is where design challenges are won or lost — the front is what a queen plans and the back is what she runs out of time for.',
    '{a} presents her design and the host gives a note about proportion, or material use, or the gap between the concept {a} described and the garment {a} is building, and the note is the distance between those two things.',
    'The host walks {a}\'s construction and the note is tactical — what needs to happen between now and the runway, what can be fixed, what cannot be fixed and has to be owned, and whether {a} knows the difference.',
  ]),
  walk('talent-show', 'The act, and whether it has an ending.', [
    'The host asks {a} to show her the act, and {a} shows her the act, and the host\'s note is about the ending — because a talent show act without an ending is a talent show act that stops, and stops and ends are not the same thing.',
    '{a} runs her talent show act for the host and the host watches for shape — a beginning, a build, a closer — because a talent act that is just one thing for two minutes outstays its welcome by a minute and a half.',
    'The host stops at {a}\'s station and the walkthrough is a performance: show me the act, show me the button, show me how you leave the stage. {a} shows. The host gives a note about whether the button exists.',
    '{a} performs for the host and the host\'s note is about the arc of the act — does it start somewhere, does it arrive somewhere else, and does the audience know when to clap, because an audience that does not know when to clap is an audience that does not.',
    'The host watches {a}\'s talent show act and the note is structural: the talent is there or it is not, and the host is not here to judge the talent — she is here to judge whether the talent has been shaped into a performance.',
    '{a} runs the act and the host listens with the ear of a producer, not a fan — does it build, does it surprise, does it end, and can it end in the time allotted, because a talent act that runs long is a talent act that is not an act.',
    'The host walks {a}\'s talent and the walkthrough is about packaging — the skill is either there or it is not, but the question is whether the skill has been turned into a moment the audience will remember or a demonstration they will watch.',
    '{a} shows the host her act and the host gives a note that lands on the thing {a} has not thought about — the ending, the transition, the moment where the act stops being a rehearsal and starts being a show.',
  ]),
  walk('lalaparuza', 'Almost nothing to walk through, which is its own note.', [
    'The host stops at {a}\'s station and there is almost nothing to walk through, because the walkthrough is a conversation about preparation for a thing that cannot be prepared for, and the host says so.',
    'The walkthrough is short because {c} does not have material to review — the host asks {a} how she is feeling, and the answer is either confident or terrified, and the host gives a note that fits whichever one it is.',
    '{a} has nothing to show the host because there is nothing to show — no script, no garment, no choreography. The walkthrough is a check-in, a reading of the room, and a note about whatever the host can see in {a}\'s face.',
    'The host walks {a}\'s station and the walkthrough is ninety seconds of a conversation that both of them know is not about preparation, because you cannot prepare for this — it is about whether {a} is ready, and ready is a different thing.',
    'Almost nothing to walk through. The host stops at {a}\'s station and the note is not about material — it is about {a}, about her head, about whether the queen who is about to walk onto that stage is the queen who needs to.',
    'The host asks {a} if she is ready and the question is the walkthrough, because {c} has no rehearsal, no material, no script to review — it has a queen who is either going to show up tonight or is not.',
    '{a}\'s walkthrough is brief and personal — the host sits down, asks a question that has nothing to do with preparation, and gives a note that has everything to do with whether {a}\'s head is in the right place.',
    'The host gives {a} a note that is less about the challenge and more about {a}, because {c} has no material to note — it has a moment, and the moment is coming, and the host wants to know if {a} is ready for it.',
  ]),
  walk('acting', 'Her lines, her character, and whether she has made a choice.', [
    'The host asks {a} to run her lines, and {a} runs them, and the host gives a note about the character behind the lines — because the lines are written and the character is not, and the character is what the panel is watching.',
    '{a} reads the script for the host and the host\'s note is about commitment — has {a} made a choice about who this person is, or is {a} reading words off a page and hoping the words do the work that a character is supposed to do.',
    'The host stops at {a}\'s station and the acting walkthrough is a table read: say the lines, say them in character, show me the choice you made about who you are playing and why you are playing her that way.',
    '{a} delivers her lines and the host watches the face, because acting challenges are not about the words — they are about the person saying the words, and the host\'s note is about whether that person exists yet.',
    'The host sits across from {a} and asks her to perform the scene, and performing it in the werk room without a costume and without a set is the purest test of whether {a} has a character or whether {a} has a script.',
    '{a} shows the host her character and the host gives a note about the gap between reading and acting — is {a} a queen who has learned lines, or is {a} a queen who has built a person who says those lines.',
    'The host walks {a}\'s scene and the note lands on specificity: what has {a} decided about this character that was not on the page, and if the answer is nothing, then the note is that the answer cannot be nothing.',
    '{a} runs the scene for the host and the host responds with a note about risk — has {a} made a choice that could fail, or has {a} played it safe, and safe in an acting challenge is a form of failure the host has seen before.',
  ]),
  walk('commercial', 'The concept, and whether anybody could follow it.', [
    'The host asks {a} to pitch the concept, and {a} pitches it, and the host\'s note is about clarity — can a stranger follow this in thirty seconds, because a commercial that requires explanation has already failed.',
    '{a} explains her commercial concept and the host listens with the attention of a person who is about to watch this concept performed, filmed, and judged, and the note is about whether the concept can survive all three.',
    'The host stops at {a}\'s station and the walkthrough is a pitch meeting: what is the product, what is the joke, and can somebody who walked in three seconds ago understand both of them before the ad is over.',
    '{a} walks the host through the concept and the host gives a note about the gap between the idea in {a}\'s head and the idea as it would read on a screen, because a concept that is funny to explain is not the same as a concept that is funny to watch.',
    'The host asks what the ad is selling and how it is selling it, and the answer is either clear or complicated, and the host\'s note is calibrated to whichever one — a clear concept gets a note about execution, a complicated one gets a note about simplifying.',
    '{a} pitches the commercial and the host responds with the question that tells {a} everything: what is the joke? If {a} can say it in one sentence, the concept works. If {a} needs three, the concept needs work.',
    'The host walks {a}\'s commercial and the note is about focus — is the ad doing one thing well or three things badly, because the queens who crash at commercial challenges are the ones who tried to fit a sketch into thirty seconds.',
    '{a} explains the concept and the host nods or does not nod, and the nod or the non-nod is the note before the note, and {a} can feel which one it is before the host opens her mouth.',
  ]),
  walk('improv', 'Nothing written down, so the note is about her instincts.', [
    'The host asks {a} about her approach and there is nothing to show, because improv has no script and no material — the walkthrough is about instincts, and the host\'s note is about whether {a}\'s instincts are going to serve her or betray her.',
    '{a} has nothing to read to the host because improv has nothing written. The walkthrough is a conversation about how {a} thinks on her feet, and the host gives a note about listening — because improv is about reacting, not performing prepared bits.',
    'The host pulls up a chair and asks {a} one question: when a scene goes sideways, what do you do? The answer reveals more than any rehearsal could, and the host gives a note built entirely on how {a} describes her own reflexes under pressure.',
    'The host asks {a} how she handles improv and {a}\'s answer is either confident or nervous, and both are useful information, because a confident improviser and a nervous improviser need different notes and the host gives the right one.',
    '{a}\'s improv walkthrough is a check-in rather than a review — the host asks about approach, about energy, about the tendency to either dominate a scene or disappear from one, and the note lands on whichever tendency the host sees.',
    'The host walks {a}\'s station and the walkthrough is philosophical, because improv cannot be reviewed — the note is about whether {a} is the kind of performer who listens before she speaks or the kind who speaks before she thinks.',
    'Nothing written down, nothing to rehearse. The host gives {a} a note about instinct — whether to push or pull, whether to lead or follow, and whether {a} knows the difference between being funny and being funny at somebody.',
    'The host sits with {a} and the improv walkthrough is a conversation about scenes she has not had yet — the kind she is good in, the kind she is bad in, and which kind to aim for when the lights go on.',
  ]),
  walk('photoshoot', 'The look she is shooting in, and what it does under a light.', [
    'The host stops at {a}\'s station and looks at the outfit she is shooting in, and the note is about what the garment does under a light — a photoshoot look is not a runway look, and the thing that reads in motion may die in a frame.',
    '{a} shows the host her shoot look and the host evaluates it as a photographer would — how does the fabric catch light, does the silhouette hold in a still frame, is the colour going to fight or serve whatever the lighting setup is.',
    'The host walks {a}\'s photoshoot look and the note is visual and specific: the detail that will read in a photograph, the detail that will not, the thing that works on a body in motion and will flatten in a still.',
    '{a} presents her look and the host gives a note about stillness — a photoshoot strips movement away, and what is left is a garment and a face, and the host\'s note is about whether both of those do enough on their own.',
    'The host asks {a} to hold the pose she is planning and looks at it the way a camera will — without forgiveness, without motion, without the benefit of a walk that could distract from a weakness in the styling.',
    'The host checks {a}\'s shoot concept and the note is about whether the look and the pose and the styling are telling the same story, because a photoshoot that sends mixed signals produces a confusing frame.',
    '{a}\'s photoshoot walkthrough is about the frame — what the camera is going to see, what it is going to miss, and whether what it sees is strong enough to stand alone without a runway walk to sell it.',
    'The host looks at {a}\'s look under the werk room lights and gives a note about the one thing that will change between here and the set — the light itself, and whether {a}\'s choices will survive the shift.',
  ]),
  walk('choreography', 'The count, and whether she is on it yet.', [
    'The host watches {a} run the choreography and the note is about the count — is she on it, is she ahead of it, is she behind it, because choreography is not dancing and the difference between the two is discipline.',
    '{a} runs her section for the host and the host watches the feet, because the feet tell the truth — a face can fake it but feet that are half a beat off are half a beat off and the camera will catch it.',
    'The host stops at {a}\'s station and asks her to run it full out, and running it full out in the werk room is the test — the count, the energy, the face on top of the count, and whether {a} can hold all three at the same time.',
    '{a} dances the routine for the host and the host gives a note about the gap between knowing the choreography and performing the choreography, because learning steps is not the same as selling them.',
    'The host walks {a}\'s choreography and the note is specific: a count, a transition, a section where {a}\'s body is doing something different from what the choreographer asked it to do, and {a} can either fix it or own it.',
    '{a} runs the routine and the host watches for the moment where {a}\'s confidence breaks — the transition she is not sure about, the count she marks instead of commits to, the section where memory replaces muscle.',
    'The host asks {a} to do it again, slower, and the slower version reveals everything the fast version hid — a wrong count, an uncertain transition, a moment where {a}\'s body is guessing instead of knowing.',
    'The host gives {a} a note about performance on top of the choreography — the steps are there or they are not, and the note is about what happens above the steps: the face, the energy, the thing that separates a dancer from a performer.',
  ]),
  walk('singing', 'The vocal, sung to the host, in the werk room, unaccompanied.', [
    'The host asks {a} to sing it, and {a} sings it, in the werk room, without a backing track, and the host listens with the face of somebody who can hear every flat note the audience is going to hear and is deciding which ones to mention.',
    '{a} sings for the host unaccompanied and the vulnerability is total — no track to hide behind, no harmonies to lean on, just a voice in a room, and the host gives a note about what that voice is doing and what it is not.',
    'The host stops at {a}\'s station and the singing walkthrough is the hardest walkthrough in the show: sing it, right now, without anything underneath you. {a} sings. The note is about everything the bare vocal reveals.',
    '{a} sings the song for the host and the host\'s note is clinical — pitch, breath, where the support drops out, where the voice is thinnest, where the performance is covering for a vocal that needs more rehearsal.',
    'The host asks {a} to sing the section she is least confident about, and {a} sings it, and the host gives a note about the specific place where the vocal needs work, because a singing challenge note that is not specific is not useful.',
    '{a}\'s vocal fills the werk room and the host listens without comment until {a} finishes, and then the note comes — about the thing {a} could feel herself doing wrong and the thing {a} could not feel but the host could hear.',
    'The host walks {a}\'s vocal and the walkthrough is a lesson: sing it again, breathe here instead of there, support from here, let the note sit instead of pushing it, and {a} tries again and the second attempt either shows the fix or shows that it needs more time.',
    'The host listens to {a} sing and gives a note about whether the vocal sounds like a singer or like a queen trying to sing, and the distance between those two things is the note, and the note is honest.',
  ]),
  walk('runway-challenge', 'The looks themselves, which are the whole week.', [
    'The host stops at {a}\'s station and looks at the garments, because a runway challenge walkthrough is a runway preview — the looks are the week, and the note is about the looks, and the looks have to speak without a performance to carry them.',
    '{a} lays out her looks and the host evaluates them the way a panel will — construction, concept, proportion, and whether the story across them holds or whether each look is a stranger to the one beside it.',
    'The host walks {a}\'s looks and the walkthrough is a fitting — does this read on a body, does that fall correctly, is the concept visible or is the concept something {a} will have to explain on the main stage.',
    '{a} shows the host the looks and the host\'s note is about the one that is weakest, because a runway challenge is a presentation of taste and the weakest look is the taste the panel will remember.',
    'The host examines {a}\'s garments with the eye of somebody who has watched enough runway challenges to know which construction choices survive a walk and which ones fall apart between the first step and the turn.',
    '{a} presents her looks and the host gives a note about styling — are the accessories serving the garment or fighting it, is the hair completing the look or sitting on top of it, and does the presentation say what {a} thinks it says.',
    'The host walks {a}\'s runway challenge and the note is about risk — did {a} play it safe, did she take a swing, and is the swing going to land or is the swing going to explain why she should have played it safe.',
    'The host looks at {a}\'s looks and gives a note about the detail that reads from a distance and the detail that disappears, and which one matters more when the panel is ten feet away and the garment is moving.',
  ]),
  walk('generic', 'FALLBACK. A challenge this file does not know the shape of — '
    + 'so the note must not assume a garment, a script, a team or a stage.', [
    'The host stops at {a}\'s station and asks about the approach to {c}, and {a} explains, and the host gives a note that is about the gap between intention and execution — is {a} building what she thinks she is building.',
    '{a} walks the host through her plan for {c} and the host listens and gives a note about whether the plan has a shape or whether the plan is a list of ideas that have not been turned into a performance yet.',
    'The host checks in with {a} and the walkthrough is a conversation about where {a} is in the process — what is done, what is not done, and whether the distance between the two is going to close before the cameras start.',
    '{a} shows the host where she is with {c} and the host gives a note that {a} can either use or set aside, and both are decisions, and both will be visible when the work is presented.',
    'The host walks {a}\'s station and the note is about readiness — not about the specific work, but about whether {a} is on track or whether {a} is about to discover she is not.',
    'The host asks {a} how she is feeling about {c} and the answer tells the host more than the work itself does, because confidence and preparation show up in the face before they show up in the material.',
    '{a}\'s walkthrough is brief and productive — the host identifies the one thing that needs the most attention, gives a note about it, and moves on, leaving {a} with a specific piece of feedback and not enough time to overthink it.',
    'The host gives {a} a note about {c} that is honest without being destructive — saying the thing that needs to be said in a way that a queen can hear it and use it rather than hear it and spiral.',
  ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════════════

/**
 * Which kind of thing this challenge hands out, or null when it hands out
 * nothing.
 *
 * Read off the authored `roles` field, with the one case it does not name:
 * a draft whose `roles` is null is drafting a PERSON. `assignment: 'none'`
 * challenges return null and never reach the pick pool at all.
 */
export function pickKindFor(challengeId) {
  const c = MAXI_TYPES.find(x => x.id === challengeId);
  if (!c || c.assignment === 'none') return null;
  if (c.roles === 'characters') return 'characters';
  if (c.roles === 'parts') return 'parts';
  if (c.roles === 'slots') return 'slots';
  return 'partner';
}

// ══════════════════════════════════════════════════════════════════════
// POOL 3 — THE HELP. One queen strong at tonight's craft coaches another.
// ══════════════════════════════════════════════════════════════════════

export const HELP_VOICES = [
  walk('talent-show', 'She watches the act fall apart in rehearsal and walks over.', [
    "{a} watches {b} run the act for the third time and the third time is no better than the first. She does not say anything — she walks over and sits down and says \"show me the ending\" and {b} shows her the ending and {a} says \"that is not an ending, that is where you stop\" and spends the next forty minutes building {b} a closer.",
    "{b}'s act has no shape and {a} can see it from across the room. She puts her own rehearsal on hold and crosses the floor and the note she gives is the note the host would have given: the talent is there, the performance around it is not, and here is how to fix it before tonight.",
    "{a} is good at this kind of performance and {b} is drowning in it. {a} watches {b} rehearse the same bit three times without landing it and decides that watching is not something she is willing to do for a fourth. She walks over and coaches {b} through the timing until the bit works, and the coaching costs her an hour of her own prep.",
    "She has her own act to rehearse and she puts it down. {a} sits with {b} and runs the act with her, calling out the moments that land and the moments that die, and the running-through is the thing that turns {b}'s set from a list of ideas into a performance. It costs {a} time she does not have.",
  ]),
  walk('snatch-game', 'She helps another queen find the character before the taping.', [
    "{a} watches {b} struggle with the voice and the struggle is visible from three chairs away. She leans over and says \"you are doing her face but not her voice\" and spends twenty minutes feeding {b} references and punchlines until {b}'s impression has enough material to survive six questions.",
    "{b}'s character has no depth past the catchphrase and {a} knows it. She pulls {b} aside and runs a mock round — throwing questions the way the host throws them — and every answer {b} gives that dies, {a} rebuilds with her until it lives.",
    "{a} can see that {b} has chosen a character she cannot sustain. She does not say that. She sits down and helps {b} find four backup answers and two physical bits, and the finding takes most of the prep time {a} was going to spend on her own material.",
    "She has her own character to prepare and she puts it aside. {a} coaches {b} through the voice, the references, the improvised answers — the things a character needs to survive the back half of {c} when the prepared material runs out. It costs {a} forty minutes she did not have.",
  ]),
  walk('girl-group', 'She helps another queen learn the verse.', [
    "{a} watches {b} fumble the lyrics for the fourth time and walks over. She runs {b}'s verse with her, line by line, until {b} can sing it without looking at the paper — and the coaching costs {a} time she was going to spend polishing her own section.",
    "{b}'s eight-count is a mess and {a} can see it from across the room. She puts her own choreography on hold and teaches {b} the steps, counting them out until {b}'s body knows the rhythm her brain already lost.",
    "{a} pulls {b} aside and they run the full number together, and the running is the thing that locks {b}'s verse into the song instead of sitting next to it. It costs {a} an hour she needed for her own delivery.",
    "She has her own lyrics to learn and she puts them down. {a} coaches {b} through the melody, the attitude, the entrance into the chorus — the parts that need to match the group — and the matching takes longer than either of them expected.",
  ]),
  walk('design', 'She watches the construction fail and walks over with her own tools.', [
    "{a} looks at {b}'s construction and sees the problem before {b} does. She does not ask — she walks over with her scissors and her iron and spends forty minutes rebuilding {b}'s garment from the inside while {b} watches and learns and does not quite know how to say thank you.",
    "{b}'s garment is coming apart at the seams, literally, and {a} is good enough at construction to see it and generous enough to fix it. She crosses the room and sits at {b}'s station and puts her own work on hold and the help is specific: this seam, this dart, this hem.",
    "{a} watches {b} fight with the fabric and decides the fighting is not something she is willing to watch any longer. She walks over and shows {b} the technique — the real one, the one {a} has been using for years — and the showing costs her an hour of her own prep time.",
    "She has her own look to finish and she puts it down and walks to {b}'s station. {a} is strong at tonight's craft and {b} is drowning in it and {a} rebuilds the construction while {b} hands her pins, and the rebuild costs {a} time she does not have.",
  ]),
  walk('rusical', 'She coaches the vocal and the blocking.', []),
  walk('roast', 'She helps sharpen the material.', []),
  walk('makeover', 'She helps with the other queen\'s face.', []),
  walk('ball', 'She helps with the construction.', []),
  walk('acting', 'She runs the scene with her until it works.', []),
  walk('commercial', 'She helps with the concept and the delivery.', []),
  walk('improv', 'She feeds her setups in rehearsal.', []),
  walk('photoshoot', 'She coaches the poses and the concept.', []),
  walk('choreography', 'She teaches the steps.', []),
  walk('singing', 'She helps find the key.', []),
  walk('runway-challenge', 'She helps with the look.', []),
  walk('lalaparuza', 'She coaches the lip sync.', []),
  walk('generic', 'She is strong at tonight\'s craft and spends her own time on someone who is not.', [
    "{a} watches {b} struggle with the challenge and does not wait to be asked. She crosses the room and sits down and spends forty minutes of her own prep time coaching {b} through the part that is not working — and the help is specific and practical and costs {a} time she does not have, and she gives it anyway.",
    "{a} is good at this. {b} is not. {a} can see it from across the room and could keep working on her own preparation and let the challenge sort it out, and instead she walks over and quietly coaches {b} through the thing that is falling apart.",
    "She has her own work to do and she puts it down and goes to {b}. {a} is strong at tonight's craft and {b} is drowning in it and {a} decides that {b} drowning is not something she is willing to watch. The note is direct and useful.",
    "{a} spends more time on {b}'s preparation than on her own. The maths does not work and {a} knows the maths does not work and she does it anyway because {b} is going to be on that stage tonight and {a} is not going to be the queen who watched her go out there unprepared.",
  ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 4 — THE SABOTAGE. One queen quietly makes another worse.
// ══════════════════════════════════════════════════════════════════════

export const SABOTAGE_VOICES = [
  walk('talent-show', 'She gives a note about the act. The note is deliberately wrong.', [
    "{a} tells {b} the ending does not land and {b} should change it, and the suggestion {a} offers is worse than what {b} had. {a} knows this. The new ending will die on stage and {a} will be watching from the wings when it does.",
    "\"I think the energy is too big,\" {a} says, and {b} pulls back, and the pulling-back kills the one thing the act had going for it. {a} watches {b} rehearse the smaller version and nods like it is working. It is not working. {a} chose this note because it would not work.",
    "{a} offers to watch {b}'s act and give feedback. The feedback is specific and confident and wrong — she tells {b} to cut the strongest bit and lean into the weakest, and {b} listens because {a} sounds like she knows. {a} does know. That is the point.",
    "It is subtle. {a} suggests a different song for {b}'s act, one that does not match the talent at all, and the suggestion sounds reasonable enough that {b} makes the change with four hours left. The change will cost {b} the performance and {a} walks back to her own rehearsal with the focus of somebody who has just done something she is not going to discuss.",
  ]),
  walk('snatch-game', 'She gives bad character advice disguised as help.', [
    "{a} tells {b} the impression needs to be bigger, and {b} goes bigger, and the bigger version is a cartoon of a character that was already thin. {a} watches {b} rehearse the new voice and encourages her. The encouragement is the sabotage.",
    "\"I do not think that character works for you,\" {a} says, and the doubt is planted at exactly the right time — late enough that {b} cannot fully commit to a new character, early enough that {b} will not fully commit to the old one either.",
    "{a} feeds {b} a reference for the character that sounds right and is wrong — a catchphrase the real person never said, a mannerism from somebody else — and {b} takes it because {a} delivers it with the confidence of somebody who has done her research.",
    "{a} suggests {b} lean into the physical comedy and away from the voice, and {b} does, and the leaning is the thing that will leave {b} with nothing to say when the host asks a question that requires an answer instead of a gesture.",
  ]),
  walk('design', 'She gives a construction note that will fall apart on the runway.', [
    "{a} offers {b} a suggestion and the suggestion is wrong. Not obviously wrong — wrong in the way that will only become visible under the stage lights, when the proportions read differently and the hem sits where it should not — and {a} offers it with the warmth of somebody who is helping.",
    "{a} tells {b} the colour is wrong and {b} should change it, and {b} changes it, and the new colour is worse. {a} knows it is worse. {a} chose it because it is worse.",
    "\"I think you should take that in,\" {a} says, and {b} takes it in, and the taking-in ruins the silhouette in a way that will not be obvious until {b} is standing in front of the panel. {a} watches {b} make the alteration and nods encouragingly. The nod is the worst part.",
    "It is subtle. {a} adjusts something on {b}'s mannequin while {b} is across the room, and the adjustment is small enough that {b} will not notice until the runway. The room does not see it. The cameras might.",
  ]),
  walk('girl-group', 'She gives a note about the verse. The note is wrong.', []),
  walk('rusical', 'She gives a vocal note that will sabotage the performance.', []),
  walk('roast', 'She gives a joke note that will bomb.', []),
  walk('makeover', 'She gives a makeup note that will read wrong on stage.', []),
  walk('ball', 'She gives a construction note that will fall apart.', []),
  walk('acting', 'She gives a character note that will flatten the scene.', []),
  walk('commercial', 'She gives a concept note that will sink the spot.', []),
  walk('improv', 'She steers the scene somewhere it cannot go.', []),
  walk('photoshoot', 'She gives a posing note that will read wrong on camera.', []),
  walk('choreography', 'She teaches a wrong count.', []),
  walk('singing', 'She gives a note about the key that will put her off.', []),
  walk('runway-challenge', 'She gives a styling note that will misfire.', []),
  walk('lalaparuza', 'She gives a lip sync note that will cost the performance.', []),
  walk('generic', 'She gives a note. The note is deliberately wrong.', [
    "{a} offers {b} a suggestion and the suggestion is wrong. Not obviously wrong — wrong in the way that will only become visible on that stage, when the pressure is on and the choice unravels — and {a} offers it with the warmth of somebody who is helping and the precision of somebody who is not.",
    "It is subtle. {a} gives {b} a note that sounds right and is wrong, and {b} follows it, and the following will not show its cost until {b} is in front of the panel. {a} goes back to her own work with the focus of somebody who has just done something she is not going to talk about.",
    "{a} tells {b} the approach is off and {b} should change it, and {b} changes it, and the new direction is worse. {a} knows it is worse. {a} chose it because it is worse. The exchange looks like mentorship and functions like sabotage.",
    "{a} gives {b} a confident, specific, wrong note. {b} follows it because {a} sounds like she knows, and the following will not show its cost until {b} is in front of the panel. {a} watches {b} make the change and nods encouragingly. The nod is the worst part.",
  ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 5 — THE SHUNNED. Nobody helps her. An event, not an absence.
// ══════════════════════════════════════════════════════════════════════

export const SHUNNED_VOICES = [
  walk('talent-show', 'The room is running acts for each other. Nobody runs one for her.', [
    "The room is rehearsing in pairs — one queen watches, gives a note, trades places. Nobody asks {a} to watch. Nobody offers to watch hers. She runs the act alone, in a corner, and the running-alone changes the energy of it in a way the panel will see without knowing why.",
    "{a} asks if anyone wants to run their act together and the room gives her the specific silence of people who heard the question and decided the answer. She rehearses alone. The solo rehearsal is louder than it needs to be, or quieter, and neither is right.",
    "Three queens are giving each other notes on their acts. {a} is not part of the circle. She could ask — the circle is not closed — but the not-being-invited is its own answer and {a} reads it and rehearses on her own.",
    "The room has paired off for feedback and {a} is the one left without a partner. The being-left is not cruelty — it is arithmetic, one queen short of an even number — but the arithmetic always seems to land on her.",
  ]),
  walk('snatch-game', 'The room is running characters for each other. Nobody runs one for her.', [
    "Queens are testing voices on each other, throwing questions back and forth, workshopping punchlines. Nobody throws a question at {a}. She sits at her station with her reference photos and rehearses the voice to nobody, which is a different kind of rehearsal than rehearsing to a room that is listening.",
    "{a} asks if anyone wants to run a mock round and the room goes quiet in the particular way that means everybody heard and nobody wants to. She prepares alone. The alone-preparation means she will not know if the character works until the cameras are rolling.",
    "The werk room is full of queens helping each other find material. References are being traded, impressions tested, weak answers rebuilt. None of this traffic flows toward {a}, and the not-flowing changes the way she prepares.",
    "Three queens are workshopping their characters together — feeding each other setups, testing reactions, building the chemistry the taping will need. {a} watches from her station and does not ask to join because the asking would confirm the thing the watching already told her.",
  ]),
  walk('design', 'The room is lending tools and checking hems. Nobody checks hers.', [
    "The room is helping each other. Queens are crossing to other stations, offering advice, lending tools, checking hems. Nobody crosses to {a}'s station. Nobody offers. Nobody checks. The absence changes the way she works — faster, quieter, and facing the mirror instead of the room.",
    "{a} asks for help and the room gives her the specific silence of people who heard the question and chose not to answer it. She figures it out on her own, and the figuring-out takes twice as long as it would have with one person's help.",
    "Three queens walk past {a}'s station while she is struggling with the construction and all three of them keep walking. She does not ask again.",
    "The room has decided, without discussing it, that {a} is on her own tonight. Help flows in every direction except toward her station.",
  ]),
  walk('girl-group', 'The group is rehearsing together. She is not part of it.', []),
  walk('rusical', 'The cast is running harmonies together. Nobody includes her.', []),
  walk('roast', 'The queens are testing material on each other. Nobody tests on her.', []),
  walk('makeover', 'The pairs are helping each other. Nobody helps her.', []),
  walk('ball', 'The room is lending tools and fabric. Nobody lends to her.', []),
  walk('acting', 'The cast is running lines together. Nobody runs with her.', []),
  walk('commercial', 'The teams are workshopping concepts. Nobody workshops with her.', []),
  walk('improv', 'The room is riffing together. Nobody riffs with her.', []),
  walk('photoshoot', 'The queens are coaching each other\'s poses. Nobody coaches hers.', []),
  walk('choreography', 'The room is running the routine together. She is dancing alone.', []),
  walk('singing', 'The queens are warming up together. Nobody warms up with her.', []),
  walk('runway-challenge', 'The queens are styling each other. Nobody styles her.', []),
  walk('lalaparuza', 'The queens are coaching each other\'s lip syncs. Nobody coaches hers.', []),
  walk('generic', 'The room is helping each other and nobody is helping her.', [
    "The room is helping each other. Queens are crossing the floor, giving notes, offering a hand. Nobody crosses to {a}. Nobody offers. Nobody checks. The absence is loud enough that {a} can hear it, and the hearing changes the way she works — faster, quieter, and facing the mirror instead of the room.",
    "{a} asks for help and the room gives her the specific silence of people who heard the question and chose not to answer it. It is not cruelty — it is calculation, a whole room deciding independently that helping {a} is not in their interest tonight.",
    "Three queens walk past {a} while she is struggling and all three of them keep walking. She does not ask again. She works it out on her own, and the working-out takes twice as long as it would have taken with one person's help, and the room knows this and the room is fine with it.",
    "The room has decided, without discussing it, that {a} is on her own tonight. The decision is visible in the traffic pattern — help flows in every direction except toward her — and {a} is aware of the pattern and the awareness settles into her preparation like a weight.",
  ]),
];

/** Her lines for this kind of pick, or null — the usual fallback contract. */
export function pickLinesFor(kindId, tierId) {
  const k = PICK_VOICES.find(x => x.kind === kindId);
  const t = k && k.tiers.find(y => y.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** The host's note for this family, or null. */
export function walkthroughLinesFor(family) {
  const w = WALKTHROUGH_VOICES.find(x => x.family === family)
    || WALKTHROUGH_VOICES.find(x => x.family === 'generic');
  return w && w.lines.length ? w.lines : null;
}

export function helpLinesFor(family) {
  const w = HELP_VOICES.find(x => x.family === family)
    || HELP_VOICES.find(x => x.family === 'generic');
  return w && w.lines.length ? w.lines : null;
}

export function sabotageLinesFor(family) {
  const w = SABOTAGE_VOICES.find(x => x.family === family)
    || SABOTAGE_VOICES.find(x => x.family === 'generic');
  return w && w.lines.length ? w.lines : null;
}

export function shunnedLinesFor(family) {
  const w = SHUNNED_VOICES.find(x => x.family === family)
    || SHUNNED_VOICES.find(x => x.family === 'generic');
  return w && w.lines.length ? w.lines : null;
}

/** Every tier still short of its variant count. */
export function unwrittenMaxiVoices() {
  const out = [];
  for (const k of PICK_VOICES) {
    for (const t of k.tiers) {
      const need = MAXI_VARIANTS[t.id] || 4;
      if (t.lines.length < need) out.push(`pick:${k.kind}/${t.id} (${t.lines.length}/${need})`);
    }
  }
  const need = MAXI_VARIANTS.walkthrough;
  for (const w of WALKTHROUGH_VOICES) {
    if (w.lines.length < need) out.push(`walkthrough:${w.family} (${w.lines.length}/${need})`);
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function maxiVoiceTierCount() {
  return PICK_VOICES.reduce((n, k) => n + k.tiers.length, 0) + WALKTHROUGH_VOICES.length;
}
