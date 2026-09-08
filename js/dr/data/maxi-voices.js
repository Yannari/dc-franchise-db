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
  walk('snatch-game', 'The character, and whether she has six answers for it.'),
  walk('girl-group', 'Her verse, her eight-count, and whether the group is one thing.'),
  walk('rusical', 'The words, the key, and whether she knows it yet.'),
  walk('roast', 'Her material — read aloud, in the room, before anybody laughs.'),
  walk('makeover', 'The two of them side by side, and whether they read as family.'),
  walk('ball', 'Three looks, one of them still in pieces on the table.'),
  walk('design', 'Construction, and whether the material is used or hidden.'),
  walk('talent-show', 'The act, and whether it has an ending.'),
  walk('lalaparuza', 'Almost nothing to walk through, which is its own note.'),
  walk('acting', 'Her lines, her character, and whether she has made a choice.'),
  walk('commercial', 'The concept, and whether anybody could follow it.'),
  walk('improv', 'Nothing written down, so the note is about her instincts.'),
  walk('photoshoot', 'The look she is shooting in, and what it does under a light.'),
  walk('choreography', 'The count, and whether she is on it yet.'),
  walk('singing', 'The vocal, sung to the host, in the werk room, unaccompanied.'),
  walk('runway-challenge', 'The looks themselves, which are the whole week.'),
  walk('generic', 'FALLBACK. A challenge this file does not know the shape of — '
    + 'so the note must not assume a garment, a script, a team or a stage.'),
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
