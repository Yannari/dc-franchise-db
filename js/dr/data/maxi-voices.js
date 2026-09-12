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
        '{a} takes {d} and the relief is all over her face. This is the character she packed a wig for. The voice she has been practising in the mirror since she got the call. She sits down and starts writing answers she already knows.',
        'First choice, first pick. {a} takes {d} and immediately starts muttering in a voice that is not her own. She has been doing {d} at home long enough that the switch is muscle memory.',
        '{a} grabs {d} before anybody else can. That is the character she came here to play. Wig is ready. Jokes are ready. Six answers already written in her head.',
        'The board still has {d} on it. {a} practically lunges. \"Oh, I have been WAITING.\" She grabs the card, kisses it, walks back to her station. The other queens start worrying because that energy means {a} came prepared.',
        '\"That one is MINE.\" {a} says it out loud when {d} comes up. Nobody fights her for it. The confidence alone scared them off. She sits down and opens a notebook that already has six pages of material in it.',
        '{a} takes {d} — her first choice, her only choice, the character she has been rehearsing since the cast list dropped. She sits back down like she just won something. She basically did.',
      ]),
      tier('settled', 'Not {d}, but she has something. She is already rebuilding the voice.', [
        '{a} takes {d}. Not the one she walked in with but she can build on it. She is already at her station adjusting the voice, figuring out which of her prepared jokes can bend to fit a different mouth.',
        'Not her first pick but {a} takes {d} and gets to work immediately. The difference between settling and losing is what you do with the character in the twenty minutes between the draft and the game.',
        '{a} settles on {d}. A breath. A nod. Then the hands start moving. She did not come here for {d} but she came here with enough range that {d} is a person she can become.',
        '{a} picks {d} and it is not the character she packed for. But it is a character. She is already at her station finding the voice, finding the walk, finding the one thing about {d} she can build six answers around.',
        'Not the dream pick. {a} takes {d} and the adjustment happens in real time. The prepared wig will not work. The prepared answers need rewriting. But a performance is forming behind {a}\'s eyes as she walks back to her station.',
        '{d} was not the plan. {a} takes the character and sits down. Her face shifts from disappointment to calculation in about four seconds. She has decided to make this work rather than mourn the character she lost.',
        '{a} settles on {d} with the composure of a queen who has a backup plan and is activating it now. Voice is new. Material is being rebuilt. Six answers are being rewritten at her station before the next pick is made.',
        '{a} lands on {d}. Not the character she rehearsed, but a character. Having a character is better than having nothing. She is already building by the time she sits down.',
      ]),
      tier('left-over', 'She is left with {d}, whom she has never once attempted.', [
        '{a} is left with {d}. She has never done {d}. Never practised {d}. She is sitting at her station staring at a name she has to become in less than an hour with no material and no wig.',
        'The draft lands {a} with {d}. A character she has never attempted. No voice, no material, no reference beyond what everybody knows. The game does not care that she did not choose this.',
        '{a} gets {d} by elimination. The silence at her station says everything. She is starting from nothing — no rehearsed lines, no prepared wig, no sense of what {d} sounds like. The clock is already running.',
        'What is left is {d}. What {a} has prepared for {d} is nothing. She sits down with a blank page and a character she has to learn in the time it takes the other queens to fine-tune characters they already know.',
        '{a} takes {d} because {d} is what is available. She has never once practised {d}. The prep time everybody else is using to polish, she is using to START.',
        '{a} is handed {d} by the draft and the handing is not kind. No voice. No references. No jokes. The queen across the room who got her first choice is already rehearsing while {a} is still googling.',
      ]),
      tier('picked-last', 'Last pick, and {d} is whatever nobody else was willing to try.', [
        'Last pick. {a} takes {d}. {d} is what is left after every other queen took what she wanted. The reason {d} is still on the board is the same reason {a} is sitting at her station looking like somebody just handed her a problem.',
        '{a} is picked last and {d} is what remains. A character nobody else wanted, for reasons that are about to become {a}\'s reasons. The character IS the week. {a} is playing one chosen by elimination.',
        'The board is empty except for {d}. {a} takes it because there is nothing else to take. Every queen in the room passed on {d}. {a} is trying not to think about that as she walks back to her station.',
        'Last pick, last character. {a} gets {d} — the name nobody wanted. The work now is not preparation. It is invention. Building a performance out of a character she did not choose and cannot trade.',
        '{a} picks last and gets {d}. {d} is the character left on the table because every other queen saw it and chose something else. {a} is now sitting with the consequences of every choice that was not hers.',
        'Picked last. {a} takes {d} and sits down with the energy of a queen who knows she has the hardest path in the room and no time to feel sorry about it. The game starts in an hour. She is starting from a name on a card.',
      ]),
    ),
  kind('parts',
    'A SCRIPTED ROLE with lines already written for it. {d} is a part in '
    + 'somebody else\'s script — the size of it, the jokes in it and whether '
    + 'it suits her are all decided before she opens her mouth.', P(
      'She wanted {d} and got {d}, and {d} is the part with the lines in it.', [
        '{a} takes {d} and the part is the one with the jokes. Lines already written. Exits already blocked. The size of {d} in the script is the size {a} wanted when she walked into the room.',
        'First pick, best part. {a} grabs {d} — the role everybody knew had the material. Lines are there. Beats are there. She is already reading them at her station with the face of a queen who got what she came for.',
        '{a} lands {d}. The part she wanted, with the jokes she could see from the table. The distribution of funny in this script is not equal. {a} just took the largest share of it.',
        '{a} takes {d} and sits down with the script open to her scenes. Enough lines. Enough space. Enough room to make the part hers rather than the part making her its.',
        '{a} picks {d}. The choice that came with the most material already on the page. Hardest part of {c} is already done. The rest is delivery.',
        '{a} claims {d} and the claim is confident. {d} is the part with lines, with beats, with a character she can see herself inside of. She grabbed it before anybody else could.',
      ]),
      tier('settled', 'Not the part she wanted. {d} is workable and she is deciding how.', [
        '{a} takes {d}. Not the part she came in wanting but it is a part. Lines on a page. A character to build. Enough material that the performance will not be a queen standing in a scene she cannot fill.',
        'Not first choice. {a} settles on {d} and starts reading. The lines are workable. Not the funniest part. Not the biggest. But enough in it to make something out of.',
        '{a} picks {d}. Pragmatic pick — not the role with the most jokes but a role with some. She is already at her station figuring out how to make {d} more than what is on the page.',
        '{d} is not the dream role. {a} takes it and starts working the lines immediately. A middling part well-performed beats a great part phoned in. She knows that.',
        '{a} settles on {d}. A read through the script. A nod. Then she starts marking the beats she can push. The biggest role in the room is already taken. This one will have to do.',
        '{a} takes {d} and the part is enough. Not generous, not bare, but enough. She is at her station running lines before the draft has finished. She has decided to earn the part rather than wish for a different one.',
        'Not her first pick. {a} takes {d} and finds the handle immediately — a joke on page two, a character choice on page three. The rest is what she brings to it.',
        '{a} picks {d} and sits down with a script she can work with. Lines are being read. Delivery is being tested. The part is becoming hers.',
      ]),
      tier('left-over', '{d} is the part left on the table, and there is a reason it was left.', [
        '{a} is left with {d}. The part everybody else saw and walked past. Thin lines. Fewer beats. A character that exists to serve somebody else\'s jokes.',
        'The draft lands {a} on {d} — the part that sat on the table while better parts were claimed around it. {a} opens the script. Exactly as sparse as the queens who skipped it suspected.',
        '{a} gets {d} by elimination. The script confirms what the draft said — fewer lines, fewer entrances, less to do than the roles already claimed. She is starting from a page with less on it.',
        '{a} takes {d} because {d} is what remained. Smaller scenes. Fewer jokes. The kind of part that asks a queen to create something almost entirely from her own pocket.',
        '{a} is handed {d}. The part left behind — not because it cannot be played but because the parts claimed ahead of it could be played more easily. That gap is {a}\'s problem now.',
        'What is left is {d}. {a} opens the script to her scenes. Short. Functional. The comedy is going to have to come from somewhere the script did not put it.',
      ]),
      tier('picked-last', 'Picked last, and {d} is a part with almost nothing in it.', [
        'Last pick. {a} takes {d}. The part the script barely acknowledges — a handful of lines, most of them reactive. {a} is holding a script that has almost nothing on her pages.',
        '{a} picks last and gets {d}. The one-scene, two-line, barely-there part every other queen avoided. The script is open on {a}\'s lap with a highlighter that has almost nothing to highlight.',
        'Picked last. {a} takes {d}. The part is a part the way a cameo is a part — present, technically, in a show that belongs to somebody else. She is going to have to build something out of almost nothing.',
        '{a} is picked last and {d} is the leftover. Fewest lines. Smallest presence. The kind of material that asks a queen to be memorable with almost no tools to be memorable with.',
        'Last pick and {d} is what remains. A part so thin {a} can read all her lines in the time it takes the first-pick queen to read her first scene. That gap is what the draft created.',
        '{a} picks last and gets {d}. Barely a part. A walk-on with dialogue that fits on one side of a cue card, in a script where other queens have pages.',
      ]),
    ),
  /* ── A PLACE IN A RUNNING ORDER IS NOT A VERSE ──
     The roast and the stand-up both declare `roles: 'slots'`, so both drew
     the pool below — which describes a position in a GROUP NUMBER and says so
     in its own note. A queen picking her spot on a comedy bill was told she
     had taken "the verse with the most bars", "the position with the most
     real estate, the best placement in the number", and sent off "counting
     her bars". There is no number, no verse and no bars on a stand-up night;
     there is one microphone and an order of service.
     And the difference is the mechanic. js/dr/chal/roast.js scores a slot by
     `SLOT_DIFFICULTY` and a room temperature that every set before yours has
     already moved: going first is a cold room that has not decided to laugh
     yet, going last is a room that is tired and has heard four queens do the
     same three jokes about the host. A verse has none of that.
     EMPTY ON PURPOSE. `pickLinesFor` returns null for an unwritten pool and
     the renderer falls back to the generic `pick-reaction` beat, which says
     she got what she wanted without claiming it was a bar of music. Bland and
     true beats vivid and wrong. See docs/PROSE-PROMPT-dr-stand-up.md. */
  kind('running-order',
    'A PLACE ON THE BILL — the roast and the stand-up. {d} is when she goes '
    + 'on, and when she goes on is most of the result: first is a room that '
    + 'has not warmed up, last is a room that has already laughed itself out '
    + 'and heard everybody else do the obvious jokes. The middle is safest '
    + 'and the most forgettable.', P(
      'She got the spot on the bill she wanted, and on a comedy night that is most of the battle.', [],
      tier('settled', 'Not the slot she wanted. She has to build the set around where she is.', []),
      tier('left-over', 'She is going on where nobody wanted to go on.', []),
      tier('picked-last', 'Last to choose, so she is taking whatever the room is by then.', []),
    )),
  kind('slots',
    'A POSITION IN A GROUP NUMBER — a verse, an eight-count, a place in the '
    + 'running order. {d} is not a character, it is real estate: where in the '
    + 'song she stands and how much of it is hers.', P(
      '{d} is the spot everybody wanted and she took it first.', [
        '{a} takes {d}. The position everybody in the room was looking at. The verse with the most bars. The slot in the running order that gets the audience at its warmest. She claimed it before anybody else could.',
        'First pick. {a} grabs {d} — the prime position in the number. She walks back to her station with the slot that has the most room and the most opportunity to be seen.',
        '{a} takes {d}. Immediate and deliberate. {d} is the position in {c} where a queen can shine. She took it before the competition had a chance to weigh in.',
        '{a} claims {d}. Strategic pick — the position with the most real estate, the best placement in the number. The kind of slot that lets a queen control how the audience remembers her.',
        '{a} picks {d}. The slot that gives her the most to work with. Most counts. Best placement. The position in {c} every queen in the room wanted and one queen got.',
        '{a} takes {d} first. The spot in the number with the most room to move, the most bars to fill, the best sight line to the panel. She came in wanting it and she got it.',
      ]),
      tier('settled', '{d} is not the spot she wanted, and she can work with where she is.', [
        '{a} takes {d}. Not the position she walked in wanting but it is a position. A verse, a count, a slot in {c} with enough room if she works hard enough.',
        'Not the dream slot. {a} settles on {d} and starts counting the bars she has. Not generous. Not prime. But a piece of the number she can own if she commits to owning it.',
        'The room watches {a} take {d} and nobody reacts. That tells {a} everything about where {d} sits in the pecking order. A position nobody envies is a position nobody is watching. Being unwatched has its own uses.',
        '{d} is not the spot {a} came for. She takes it and starts working it — finding the pocket in her verse, marking the counts, locating the moment in her slot she can push into something the panel remembers.',
        '{a} settles on {d}. Best positions are taken. Remaining positions are fine. Fine is a starting point, not a ceiling, for a queen who knows how to work a stage.',
        '{a} takes {d}. Middle-of-the-pack position but that is where the position is, not where the performance has to be. She starts counting her bars and getting to work.',
        'Not first choice but {a} picks {d} and starts learning her section immediately. The slot is the slot. What she does inside it is the variable she controls.',
        '{a} takes {d} and goes straight to the queen who got the slot before hers. A number is a relay and the handover is the part nobody rehearses. {a} has decided the neighbour is the opportunity.',
      ]),
      tier('left-over', '{d} is what nobody chose, and she can hear why.', [
        '{a} is left with {d}. The slot that sat unclaimed while better positions were drafted around it. Fewer bars. A harder placement. A part of the number where the audience is not looking.',
        'The draft leaves {a} with {d}. The position the room avoided — a short verse, a buried slot. Every queen ahead of her in the draft saw it and chose something else.',
        '{a} gets {d} by elimination. The slot is exactly as unappealing as the draft suggested. A thin section of the number. A count that gives her less than the queens around her.',
        '{a} takes {d} because {d} is what is left. Nobody chose it. The positions that got chosen first were chosen first for a reason {a} can now hear in the count.',
        'What remains is {d}. {a} takes the slot and starts counting. The count is short. The placement is hard. The number is not going to wait for her to figure it out.',
        '{a} is handed {d}. The leftover slot. The verse nobody wanted. The eight-count nobody chose. A part of the number that was not designed to be memorable.',
      ]),
      tier('picked-last', 'Picked last and handed {d}, which is barely a position at all.', [
        'Last pick. {a} takes {d}. Scraps of the number. A position so thin that calling it a slot is generous. Other queens have verses. {a} has a couplet.',
        '{a} picks last and gets {d}. Not really a position — it is what is left after the real positions have been claimed. {a} is standing in a part of {c} that barely exists on the count sheet.',
        'Picked last. {a} takes {d}. Barely a slot — fewer bars than anybody else, a placement the audience will not notice. A piece of the number that exists as a transition, not a moment.',
        '{a} picks last and {d} is what nobody wanted. The smallest slot in {c}. The shortest verse. The part of the number that was designed to connect two other parts, never to stand on its own.',
        '{a} is handed {d} and does the arithmetic out loud. Mistake. Saying the number of counts she has been given makes the queens around her wince. Nobody argues. Nobody offers to swap. That silence is the second thing that happens to {a} tonight.',
        '{a} is last and {d} is last. A last-picked queen and a last-available position. That combination produces either the most invisible performance of the night or the most surprising one.',
      ]),
    ),
  kind('group-slots',
    'A POSITION IN A GIRL GROUP — lead, featured, standard or ensemble. {d} '
    + 'names the actual slot (Lead, Featured, Standard, Ensemble), not a '
    + 'character. The prose must know what each one IS: lead has the most verse '
    + 'and the front of the choreo; featured has a strong slot and room to '
    + 'stand out; standard is a solid verse and a place in the number; ensemble '
    + 'is backup — fewest bars, most choreography, smallest spotlight.', P(
      tier('got-it', 'She got the position she wanted — and {d} is worth wanting.', [
        '{a} takes {d}. The position she wanted. She is already counting bars at her station.',
        '{d} goes to {a}. The room clocks it. That is the slot with the verse and the front of the choreo.',
        '{a} grabs {d} without hesitating. Most material, most risk. She took it like she packed for it.',
        '{d} lands on {a}. The slot she wanted, the bars she can write to, the front of the number. Done.',
        '{a} walks away from the draft with {d}. The position that makes or breaks girl group week. She chose it on purpose.',
        '{d}. {a} takes it and grins. Every queen wanted that position. She is the one walking away with it.',
      ]),
      tier('settled', '{d} is not what she came for, but she can build on it.', [
        '{a} takes {d}. Not the position she wanted. She is recalculating.',
        '{d} is not what {a} came for, but it has bars and choreo. A queen who outworks a middle slot gets noticed. {a} knows that.',
        '{a} settles into {d}. Not her first choice, but {d} has room in it. A smart queen finds a moment the lead does not have.',
        '{d} goes to {a} and she takes it clean. The verse is there. The choreo is there. She will figure out the rest at her station.',
        '{a} takes {d}. Four seconds later she is already writing at her station. {d} has bars. She will give them something.',
        '{d} was not the plan. {a} takes it anyway. {d} is the kind of slot where a queen who outworks the material gets noticed.',
        '{a} picks up {d}. Not what she wanted but it has a verse and choreography. She can make this work.',
        '{d} is what is left by the time {a} picks. It has bars. She will make them count.',
      ]),
      tier('left-over', '{d} is what nobody else wanted, and she knows why.', [
        '{a} is left with {d}. The position the room avoided. She takes it and starts figuring out how to be noticed.',
        'Nobody reached for {d}. {a} takes it. Least verse, most choreography. She is already calculating.',
        '{d} goes to {a} by default. The room picked around it. {d} is the position where you disappear if you are not careful.',
        '{a} ends up with {d}. Not by choice. {d} is what the room left on the table and {a} has to find something in it worth showing the panel.',
        '{d} is what nobody wanted and {a} is holding it. Short verse. Long choreography. Spotlight is somewhere else.',
        'The room avoided {d}. {a} is the one left with it. Fewest bars, smallest moment. She knows what that means.',
      ]),
      tier('picked-last', 'Picked last. {d} is barely a position.', [
        'Last pick. {a} takes {d}. Smallest slot. Shortest verse. The most to prove.',
        '{a} gets {d}. Last. Fewest bars, most background. She takes it to her station and stares at it.',
        '{d} is what is left and {a} is holding it. The back of the number and a prayer the panel notices her.',
        '{a} takes {d} because there is nothing else. {d} is the position where a girl group buries you. {a} is in the grave.',
        'Last pick. {d}. The room does not look at {a} because looking would be admitting what everybody already knows.',
        '{d} goes to {a}. Back of the number. Shortest verse. She has to make something out of almost nothing.',
      ]),
    )),
  kind('partner',
    'A PERSON, not a thing. {d} is another queen — the one she has to make '
    + 'over, or the one she has to face. Everything about her week now depends '
    + 'on somebody who has her own opinions about it.', P(
      'She took {d}, and taking {d} was the whole plan.', [
        '{a} takes {d}. Not a surprise — she has been watching {d} since the first week. Studying the proportions, the skin tone, the features. {d} is the queen she knew she could transform.',
        'First pick. {a} chooses {d}. The queen she came into the room planning to take. They meet eyes across the werk room. {a} is already looking at {d}\'s face like a canvas.',
        '{a} takes {d}. Deliberate pick — the queen whose face she understands, whose body she can dress, whose proportions she has been sketching in her notebook since {c} was announced.',
        '{a} claims {d}. The claim IS the whole strategy. {d} is the queen she can see herself in. The queen she can make look like family. She took her before anybody else had the chance.',
        '{a} picks {d}. The person she wanted standing next to her on the runway. The face she can paint. The body she can style. The choosing is half the challenge.',
        '{a} takes {d} with the certainty of a queen who has been planning this pairing since {c} was announced. {d} walks over with the face of somebody who has just become somebody else\'s project.',
      ]),
      tier('settled', '{d} was not who she came for, and {d} will do.', [
        '{a} takes {d}. Not the plan, but {d} is a queen — a face and a body and a set of proportions {a} is now studying like somebody who has to make a stranger look like her sister.',
        'Not her first choice. {a} settles on {d} and the two of them size each other up. {a} is looking at bone structure and skin tone. {d} is looking at {a} and wondering what she is about to become.',
        '{a} picks {d}. A pivot — not the queen she walked in wanting but a queen she can work with. The walk from the draft board to {d}\'s station is a queen recalculating in real time.',
        '{d} was not who {a} came for. She takes a moment — studying {d}\'s face the way you study a face you have to transform in a hurry. Finding the angles that work. Accepting the ones that do not.',
        '{a} settles on {d}. The partner you get is the partner you get. The two of them sit down together to start figuring out how to look like they belong next to each other.',
        'Not the dream pairing but {a} takes {d} and starts working immediately. Examining the jawline, the brow, the shape of the eyes. Building a plan for a face she did not expect to be painting today.',
        '{a} takes {d}. {d} accepts the pairing with a nod. The nod begins a partnership that neither of them planned for and both of them have to make work before the runway.',
        '{a} picks {d} and the adjustment is happening in real time. The look she had in mind is being rebuilt for a different body, a different face, a different queen than the one she walked in wanting.',
      ]),
      tier('left-over', 'She is left with {d}, which is a pairing neither of them chose.', [
        '{a} is left with {d} and neither of them chose this. They sit down together with the energy of queens assigned to each other by arithmetic. The work of making that look like a choice starts now.',
        'The draft pairs {a} with {d} by elimination. They are here together because nobody else is. The challenge of looking like family starts from a place where they are not.',
        '{a} gets {d} because {d} is who is left. {d} gets {a} for the same reason. A partnership that exists because nothing else did.',
        '{a} and {d} find each other by process of elimination. They sit down together. Different proportions. Different faces. A runway coming. They are going to have to make this work.',
        '{a} takes {d} because the draft left no other option. Two queens who did not pick each other trying to look like they did. That is its own kind of challenge inside {c}.',
        '{a} is handed {d} by the draft. {d} is handed {a} by the same order. The mutual lack of choice is the thing they are going to have to work around before they can work together.',
      ]),
      tier('picked-last', 'Picked last and paired with {d} by process of elimination.', [
        'Last pick. {a} takes {d} because {d} is the only queen left. {d} takes {a} because {a} is the only queen left. Two last picks walking toward each other.',
        '{a} is picked last and paired with {d} by default. Neither of them chose this. The room chose it for them. The challenge of {c} now includes the challenge of pretending that did not happen.',
        'Picked last. {a} gets {d}. Mutual and involuntary. The draft has run its course and the two queens at the bottom of it are now a pair. They start working with the quiet determination of people who know they did not choose this.',
        '{a} and {d} are what is left. A pairing assembled from the remains of a draft that served everybody else first. They sit down together. The sitting is a decision to start rather than to complain.',
        'Last pick, last partner. {a} and {d} find each other at the bottom of the draft and begin {c} from the position of two queens who arrived at each other by elimination, not by intention.',
        '{a} picks last and gets {d}. {d} is paired with {a} by the only force more impersonal than a draft — nobody else is available. {c} does not wait for queens to feel ready.',
      ]),
    ),
  kind('opponents',
    'A QUEEN SHE CHOSE TO FACE. {d} is not a partner — {d} is the queen '
    + 'standing on the other side of the stage. She picked {d} because she '
    + 'thinks she can beat her, because she has a grudge, or because {d} is '
    + 'the weakest lip syncer in the room. The prose is about the call-out '
    + 'and what it says about both of them.', P(
      'She called out {d}. The queen she wanted and the queen she got.', [
        '{a} calls {d}. The room hears it. {d} hears it. {a} picked the queen she wanted to face and the picking is a statement — she thinks she can take {d} and she wants {d} to know it.',
        '{a} points at {d}. No hesitation. She has been watching {d} lip sync all season and she has decided she can beat her. {d} steps forward. The song has not started and the challenge is already happening.',
        '{a} names {d} and the room shifts. That is the opponent she wanted. The choice says everything about how {a} sees herself in this bracket — confident enough to pick the match she wants rather than the match she needs.',
        'First pick. {a} calls out {d}. The call-out is calm and the calm is deliberate. She chose {d} because she has a plan for {d}, and the plan starts with making {d} think about what just happened.',
        '{a} takes {d}. The pick she came in with. She has been watching {d} perform and she has done the arithmetic and the arithmetic says she wins this one.',
        '{a} calls {d} and means it. Not the safest pick. Not the weakest queen in the room. The queen she wants standing across from her when the song starts.',
      ]),
      tier('settled', '{d} was not who she came for, but {d} is beatable.', [
        '{a} calls {d}. Not her first choice — somebody else took the opponent she wanted. But {d} is beatable. {a} can see the win from here, even if the road changed.',
        '{d} is not the queen {a} planned to face. She adjusts. {d} is still somebody she can take in a lip sync, and the bracket does not care about her original plan.',
        '{a} settles on {d}. The opponent she wanted is already taken. {d} is the next best match — a queen she can out-perform if she brings the right energy.',
        'Not the call-out she planned. {a} names {d} and the naming is pragmatic. {d} is available. {d} is beatable. The bracket moves fast and {a} is moving with it.',
        '{a} picks {d}. A recalculation — somebody else took the match she wanted, so she reads the room and picks the next queen she thinks she can beat.',
        '{d} was not the plan. {a} calls her anyway. A lip sync is a lip sync and {a} has done enough of them to know she can take {d} if she commits.',
        '{a} calls {d} after her first choice was taken. The adjustment is quick. {d} is a winnable fight and {a} does not have time to mourn the fight she lost.',
        '{a} settles on {d}. Not the dream match-up. But {a} has watched {d} perform and she has seen enough to believe she wins this.',
      ]),
      tier('left-over', 'She is left with {d}, and {d} is not somebody she wanted to face.', [
        '{a} is left with {d}. Not the opponent she planned for. Not the match-up she wanted. {d} is the queen still standing when every other option was taken.',
        'The bracket leaves {a} with {d}. She did not choose this fight — the draft chose it for her. {d} is not the weakest lip syncer in the room. {a} knows that.',
        '{a} gets {d} by elimination. The opponent she wanted is gone. The backup is gone. {d} is what is left, and {d} is not the easy win {a} was looking for.',
        '{d} is the opponent {a} did not want. She takes the match because the bracket gives her no alternative. The fight she is walking into is harder than the one she planned.',
        '{a} is paired with {d} and the pairing is not kind. Every easier opponent was claimed. {d} is the queen left standing and {d} can lip sync.',
        'The draft leaves {a} facing {d}. Not a favourable match. Not the fight she came in wanting. The bracket does not care what she wanted.',
      ]),
      tier('picked-last', 'Last pick. {d} is the opponent nobody else would take.', [
        'Last pick. {a} calls {d} because {d} is the only queen left. The bracket made this match. Neither of them chose it.',
        '{a} picks last and gets {d}. The opponent the room avoided. The queen nobody wanted to face, for reasons {a} is about to discover on stage.',
        'Last call. {a} and {d}. A match assembled from the bottom of the bracket by two queens who ran out of choices at the same time.',
        '{a} picks last. {d} is who is left. The match the bracket built — not a rivalry, not a strategy, just two queens the draft put together because nobody else was available.',
        'Last pick and {d} is the opponent standing. {a} and {d} face each other with the energy of two queens who arrived at this fight by elimination.',
        '{a} is last and {d} is last. The bracket paired them. The lip sync will tell the room whether the bracket was kind or cruel.',
      ]),
    ),
  kind('products',
    'A PRODUCT she has to sell in thirty seconds. {d} is the thing on the '
    + 'table — absurd, unsellable, and paired with a trap angle everybody '
    + 'reaches for. The prose is about whether she can find the joke in the '
    + 'product and whether her partner can keep up. Never reference a script '
    + 'or written lines: a commercial is pitched and shot, not read.', P(
      'She got {d}. The product with the joke already inside it.', [
        '{a} gets {d} and sees the angle immediately. The product is absurd and absurd is where she lives. She is pitching before her partner has finished reading the brief.',
        '{d} lands in {a}\'s lap and she grins. A product that sells itself if you commit to the bit. She is already writing the tagline in her head.',
        '{a} draws {d}. The product everybody in the room wanted — the one where the joke writes itself and the thirty seconds feel like enough. She takes it to her station and starts blocking the spot.',
        '{a} gets {d} and the concept is there before the brief is finished. A product she can see the ad for. A product she can sell. The partner beside her watches {a} light up and starts taking notes.',
        '{d} goes to {a}. The product with the comedy in its bones. She does not need to find the funny — she needs to not waste it. The thirty seconds start feeling generous.',
        '{a} takes {d} and the product is a gift. Not easy — nothing in {c} is easy — but a product where the concept and the comedy are the same thing.',
      ]),
      tier('settled', '{d} is not the dream product, but the ad is in there somewhere.', [
        '{a} gets {d}. Not the product she would have chosen off a shelf, but a product. Thirty seconds. A camera. A partner. She starts looking for the angle that is not the obvious one.',
        '{d} goes to {a} and she reads the brief twice. The joke is not on the surface. It is going to take some digging and the digging is going to have to happen fast.',
        '{a} takes {d}. A product with a trap in it — the obvious angle is the one every pair reaches for, and the one that never wins. She is looking for the second idea.',
        '{d}. {a} reads it. Thinks. The product is sellable but the ad is not obvious. Finding the concept that makes thirty seconds feel like a story is the challenge inside the challenge.',
        '{a} draws {d} and the product is workable. The angle is there if she tilts it right. Her partner is watching her think. The pitch meeting starts in the silence.',
        'Not the dream product. {a} takes {d} and starts looking for the concept that makes it funny rather than weird. The line between those two things is where the ad lives.',
        '{a} gets {d}. A product that needs more work than the ones claimed first. The thirty seconds are going to require a concept she has not found yet.',
        '{a} takes {d} and starts workshopping out loud. The product is a puzzle. The ad is the answer to the puzzle. She and her partner have an afternoon to solve it.',
      ]),
      tier('left-over', '{d} is the product nobody wanted to sell.', [
        '{a} is left with {d}. The product that sat on the table while better concepts were claimed around it. Hard to sell. Harder to make funny. She starts looking for the angle anyway.',
        '{d} goes to {a} because nobody else reached for it. A product where the comedy is buried and the thirty seconds are going to feel very long if she does not find it.',
        '{a} gets {d} by elimination. The brief is thin. The product is tough. The angle that would make it work is the angle nobody in the room has found yet.',
        '{a} takes {d} — the product the room avoided. Not because it is unsellable but because selling it requires finding something nobody else could see. The ad starts from nothing.',
        '{d}. {a} reads the brief and the product is exactly as hard as the queens who skipped it suspected. Thirty seconds to sell something nobody wants to buy.',
        '{a} draws {d}. The product left behind. The concept nobody wanted because the joke is not inside the product — it has to be invented from scratch.',
      ]),
      tier('picked-last', 'Last pair. {d} is the product nobody could sell.', [
        'Last pair. {a} gets {d}. The product the room left on the table. Thirty seconds to sell something designed to be unsellable, with a partner who got here the same way she did.',
        '{a} draws last and gets {d}. A product whose ad has to be invented from nothing — the concept is not in the brief, not in the product, and not in the angle everybody else already tried.',
        '{d} is the last product on the table and {a} is the last queen picking. A thirty-second spot for a product nobody wanted to touch. She and her partner look at each other.',
        'Last pick. {a} takes {d}. The product designed to trap a pair — the obvious angle is the wrong angle and the right angle is the one nobody can find in an afternoon.',
        '{a} gets {d} last. The product the room avoided. The concept that has to be built from the ground up. Thirty seconds to make something work that nobody else wanted to try.',
        '{a} and her partner get {d}. Last pair, last product, last chance to find a concept inside something the room decided was not worth picking.',
      ]),
    ),
  kind('premises',
    'AN IMPROV PREMISE handed to her cold. {d} is a character she has never '
    + 'rehearsed and a scene she has never seen — the entire challenge is about '
    + 'whether she can find something inside a concept with no script, no lines '
    + 'and no time to prepare. The prose must never reference a script, written '
    + 'lines, or material on a page: improv has none of those.', P(
      'She drew {d}. The premise is in her wheelhouse and she knows it.', [
        '{a} draws {d} and the room can see the idea land. No script. No written lines. Just a premise and a queen who already knows where the first joke lives inside it.',
        '{d} goes to {a} and she grins. The premise sits in the exact place her comedy sits — the rhythm of {d} is the rhythm she does best, and the room can see the match from across the floor.',
        '{a} takes {d}. A premise she can see the scene inside of before the lights come up. No lines to learn because there are no lines. No material to prepare because the material is whatever she invents on the spot. She likes those odds.',
        '{a} draws {d} and sits back. The premise is hers the moment she hears it. Not because it is easy — because it is the kind of difficult she is built for.',
        'The premise is {d}. {a} takes it and does not need to think about it. She is already running the first thirty seconds of the scene in her head. No script. No rehearsal. Just nerve and a concept she can ride.',
        '{a} hears {d} and the relief is instant. A premise wide enough to play in and specific enough to find the joke. She does not write anything down because there is nothing to write down. Improv starts when the lights go on.',
      ]),
      tier('settled', '{d} is not the premise she would have chosen, but she can find a scene inside it.', [
        '{a} draws {d}. Not the premise she was hoping for. She turns it over — where is the joke, where is the character, where is the thirty-second scene that saves her. She can see one. It is not obvious. It will have to do.',
        '{d} goes to {a} and she pauses. The premise is workable. Not the one she would have picked off a menu but one she can build a character out of if her nerve holds.',
        '{a} takes {d} and sits with it. The scene is in there somewhere. Not on the surface — not the kind of premise where the first idea is the funniest — but in there. She has until the lights come up to find it.',
        'The premise is {d}. {a} reads it twice. Not hard. Not impossible. Somewhere in between, where the scene depends entirely on what she brings to it and there is no script to fall back on.',
        '{a} draws {d} and exhales. Not the gift premise. Not the trap premise. The kind of premise that will be exactly as good as the queen playing it. She has no lines to learn because there are no lines. She has an idea to find.',
        '{d}. {a} takes it. She can work with this. The premise has an angle if she tilts it right, and tilting a premise right on stage with no rehearsal is either the thing she is best at or the thing that will cost her.',
        '{a} gets {d}. The premise needs more from her than the obvious first idea. She is already past the obvious one and looking for the second, which is where the improv either finds its legs or does not.',
        '{a} draws {d} and the premise is a question she has to answer in real time. Not the funniest concept on the table. Not the worst. The kind where the scene lives or dies on whether she commits.',
      ]),
      tier('left-over', '{d} is the premise the room was glad to dodge.', [
        '{a} is left with {d}. The premise the room looked at and looked away from. The joke is not obvious. The character is not obvious. She has to build a scene out of something nobody else wanted to touch.',
        '{d} goes to {a} because nobody else took it. A premise with a narrow door — the scene is in there but the scene is hard to find, and she has no rehearsal time to look for it.',
        '{a} draws {d}. The room watches her read it. The premise is the kind that sounds funnier in a writers\' room than it will be under a spotlight with no script and no second take.',
        'The premise is {d}. {a} takes it because it is what she drew. A hard concept. A narrow concept. The kind of premise where a queen either invents something brilliant or stands on stage with nothing.',
        '{a} gets {d} — the premise the other queens were relieved not to draw. No script. No lines. No obvious first joke. She is going to have to find something inside {d} that nobody in the room can see yet.',
        '{d}. {a} reads it and the pause is the tell. A premise where the joke is buried, and she has however long the walk to the stage takes to dig it out.',
      ]),
      tier('picked-last', 'Last pick. {d} is the premise nobody wanted.', [
        'Last pick. {a} draws {d}. The premise nobody reached for. The concept that sat on the table while every other queen chose around it. She is going to walk into a scene with no script and the hardest prompt in the room.',
        '{a} picks last and gets {d}. A premise designed to be difficult and made more difficult by the fact that every easier premise is already taken. No lines. No rehearsal. Just {d} and her nerve.',
        'Last draw. {a} takes {d}. The premise the room avoided — the one where the joke is not inside the concept, it has to be invented from nothing while the lights are on her.',
        '{a} draws last and gets {d}. Not a gift. Not a scene that plays itself. {d} is the kind of premise that asks a queen to be funny about something that is not inherently funny, in front of judges, with no preparation.',
        '{d} is the last premise on the table and {a} is the last queen standing. Every other queen chose something easier. She takes {d} and walks to her station with the specific posture of somebody who has decided not to panic.',
        '{a} is last and {d} is what is left. A premise that needs invention, not delivery — and invention with no script and no rehearsal is the hardest thing improv asks for.',
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
  walk('rumix', 'The bars she has written, and whether she can actually say them.', [
    'The host stops at {a}\'s station and reads her verse off the page. Four bars. The host says them back. {a} hears her own lyrics in someone else\'s voice and the verse either sounds like something or it does not.',
    'The host asks {a} to run the verse. Right here. No track. No booth. Just the bars out loud. {a} delivers them and the host either nods or gives her the face — the face that says \"you need to rewrite before you record.\"',
    '{a} walks the host through what she has written. The host listens, pauses, reads a bar back. \"Does that scan?\" The question is not rhetorical. {a} tries saying it on rhythm and the answer is in the stumble or the lack of one.',
    'The host pulls up a chair and {a} reads her verse. The host gives her one note — maybe the punchline lands, maybe the rhyme scheme is fighting the beat — and {a} has until the booth session to decide what to do with it.',
    '{a} shows the host her bars. The host is listening for the same thing the panel will listen for tonight: can she hear this verse in a room full of verses and remember whose it was. The note she gives {a} answers that question.',
    'The host stops by {a}\'s station. The verse. Read it. {a} reads and the host watches her mouth — is she performing or is she reading. One of those is ready for a booth. The other needs another hour.',
    'The host asks {a} to spit the verse without looking at the paper. {a} gets through two bars before pausing. The pause is the note. The host tells her what she already knows: the verse needs to live in her mouth, not on the page.',
    '{a} runs her verse and the host interrupts halfway. Not to stop her — to redirect. The note is specific: this bar scans, this one does not, and the punchline needs to hit harder or it will disappear inside the track.',
  ]),
  walk('music-video', 'Her part, and whether she knows how big to play it for a lens.', [
    'The host stops at {a} and asks about the part. {a} explains her approach and the host gives her the note — play it bigger, play it smaller, find the camera. The note is always about the camera.',
    'The host watches {a} rehearse her section. The note is about scale. A stage queen is playing too big for a lens. A shy queen is not playing big enough. The host tells {a} which one she is today.',
    '{a} walks the host through her concept for the part. The host listens, watches her mark the choreography, and gives her one note that is either \"trust the camera\" or \"you are hiding from the camera.\"',
    'The host pulls {a} aside. The part she was given — does she understand it. {a} explains what she is going to do. The host either likes the read or steers her away from it. The direction is quick and specific.',
    'The host asks {a} to show her what the character looks like on camera. Not on a stage. Not for a crowd. For a lens two feet away. {a} adjusts or she does not, and the host\'s note says which.',
    '{a} runs her scene for the host. The host gives her the note: \"The director is watching you closer than the panel ever does. What she sees is what the judges hear about.\" The note is about precision.',
    'The host stops at {a}\'s station and asks to see the performance. {a} shows her. The host reads {a}\'s face on an imaginary monitor and tells her what the camera will pick up that a live audience would miss.',
    'The host checks in with {a}. She asks one question — do you know your part — and {a}\'s answer tells the host everything. A queen who knows her part says what the character does. A queen who does not says what the costume looks like.',
  ]),
  walk('snatch-game', 'The character, and whether she has six answers for it.', [
    'The host stops at {a}\'s station and asks about the character. {a} drops into the voice mid-answer, testing it on the one person in the room whose reaction matters. The host either laughs or she does not — and the laugh or the silence tells {a} everything she needs to know.',
    'The host sits down across from {a}. The question is the question: who is she doing, and does she have the jokes. {a} runs through a line in character. The host\'s face either opens or tightens. The tightening is the warning.',
    'The host asks {a} to show her the character. Right here, in the werk room. No wig, no costume. What comes out of {a}\'s mouth is either a voice that sounds like somebody or a voice that sounds like {a} trying.',
    '{a} walks the host through her character — the voice, the references, the six answers. The host listens with the face of a person who has watched queens crash at {c} enough times to see it coming.',
    'The host stops at {a}\'s station. Do the voice. Tell me a joke. Show me you have something to say in the third question when the panel throws something you did not prepare for.',
    'The host pulls up a chair. {a} does the character. The host gives her a note that is either \"you have something\" or \"you do not have enough.\" The note lands differently depending on whether {a} agrees with it.',
    '{a} shows the host her material. The host responds with the honesty of a person who is about to watch this on camera and wants it to go well more than she wants {a} to feel comfortable right now.',
    'The host walks {a}\'s character. Pointed walkthrough — does the voice hold for six questions, does the impression have depth past the first catchphrase, can {a} improvise when the panel throws something she has not rehearsed.',
  ]),
  walk('girl-group', 'Her verse, her eight-count, and whether the group is one thing.', [
    'The host watches {a} run her verse. Listening for the thing that will either save or sink her — are the lyrics learned, does the delivery have personality, does {a}\'s section belong to the same song as everybody else\'s.',
    'The host stops at {a}\'s section. The note is about fit. Does her verse match the energy of the group. Does her eight-count land on the count. Is what she is doing in her corner going to cohere with the queen next to her.',
    '{a} runs her verse for the host. The host watches the mouth and the feet at the same time. A girl group number falls apart when a queen knows the words but not the steps, or the steps but not the words.',
    'The host asks {a} to sing her section. {a} sings it. The host gives a note about either the lyrics or the delivery or the choreography. The note is the distance between what {a} thinks she has and what she actually has.',
    'The host pulls {a} aside and walks her verse — lyrics, attitude, the eight-count that leads into the chorus. The note is specific enough to fix something and general enough to worry about something else.',
    '{a} shows the host her part of {c}. The host looks at the group. Looks back at {a}. The note is about whether {a}\'s section matches what the rest of the group is building. A girl group number is one song, not five solos.',
    'The host watches {a}\'s section and the note lands on the thing {a} was hoping nobody would notice. A lyric she has not landed. A count she is half a beat off. A delivery that reads as uncertain in a number that needs to read as confident.',
    'The host stops the room and listens to {a}\'s verse in context. Is {a}\'s energy the same energy as the queens on either side of her. If not — what does {a} need to change.',
  ]),
  walk('rusical', 'The words, the key, and whether she knows it yet.', [
    'The host asks {a} to sing it. Right here, in the werk room. What comes out is either the words in the right key or approximately the right key. The approximation is the note.',
    '{a} runs her part of the Rusical for the host. The host listens for the thing a live audience will hear instantly — does {a} know the words, is she in the right key, does the performance have shape or just volume.',
    'The host stops at {a}\'s station and asks to hear it. Hearing it in the werk room without a backing track is the cruelest and most useful test. Every flat note is exposed. Every lyric gap is audible. The note is about what needs fixing.',
    '{a} sings for the host unaccompanied. The host gives a note that is either about pitch or about performance. The distinction matters. A pitch note is fixable. A performance note is a warning that knowing the words is not enough.',
    'The host pulls {a} aside. Sing it. Full voice. No backing track. In a room where everybody can hear you. {a} sings. The host makes a face that is either encouraging or concerned.',
    '{a} runs her section. The host listens with the ear of somebody who knows a Rusical in the werk room and a Rusical on the stage are different animals. The note is about whether {a}\'s preparation will survive the transition.',
    'The host asks for the verse. The verse comes out. The note is about what it sounds like to an audience that has not heard it before — is the story clear, is the melody carried, does it sound rehearsed or memorised.',
    'The host watches {a} perform her Rusical section. The walkthrough becomes a coaching session — a note on the key, a note on the acting inside the singing, a note on whether {a}\'s piece connects to the pieces around it.',
  ]),
  /* THE STAND-UP, WHICH IS NOT THE ROAST. Empty on purpose: an unwritten
     family falls back to the generic walkthrough, which asks about the work
     without claiming she is roasting anybody. See
     docs/PROSE-PROMPT-dr-stand-up.md. */
  walk('stand-up', 'Five minutes of her own material, read aloud, with nobody to aim it at.', []),
  walk('roast', 'Her material — read aloud, in the room, before anybody laughs.', [
    'The host asks {a} to read her material. Out loud. In the werk room, where the jokes have to work without a spotlight and without an audience. The silence between the punchlines is the note.',
    '{a} reads her roast set to the host. The host listens without laughing — not cruelty, just hearing the material the way a panel will hear it. Stripped of delivery. Testing whether the jokes stand on their own.',
    'The host stops at {a}\'s station. Read me the set. Read me the callbacks. Read me the closer. {a} reads. The host gives a note about structure that is more useful than any note about individual jokes.',
    '{a} runs her roast material for the host. The host\'s face does the thing it does when material is either landing or not. {a} watches the face and knows which one it is before the note arrives.',
    'The host sits with {a} and asks to hear the set. It sounds different in the werk room than it does in {a}\'s head. The werk room does not laugh politely. The host does not laugh at all. She listens and then speaks.',
    '{a} reads her jokes. The host\'s note is about the arc — not whether the jokes are funny but whether the set has a shape. Whether it builds. Whether the closer earns the walk-off.',
    'The host pulls {a} aside and listens to the material. Clinical — timing, callbacks, whether {a} is roasting or just reading insults. Whether the difference between those two things is visible in the writing.',
    '{a} walks the host through her roast set. The host gives a note {a} can either use or ignore. Both are valid. Both will be visible on stage — the used note as a fix, the ignored note as a gap.',
  ]),
  walk('makeover', 'The two of them side by side, and whether they read as family.', [
    'The host looks at {a} and {d} side by side. One question: do they look like they belong together? The note is about the gap — the mug, the hair, the styling — and whether {a} can close it before the runway.',
    'The host stops at {a}\'s station. Looks at the two of them next to each other. The note is visual — does the paint match, does the silhouette match. Would a stranger believe they are family.',
    '{a} stands next to {d}. The host studies the pairing the way the panel will study it — two people who are supposed to look like they belong to each other. The note is about everything that currently says they do not.',
    'The host walks {a}\'s makeover. A side-by-side comparison — paint, proportions, overall concept. Does the family resemblance read from ten feet away or only from three.',
    '{a}\'s makeover stands in front of the host. {d} wears whatever {a} has built so far. The host looks at the two of them. \"I see it\" or \"I do not see it yet.\" The \"yet\" is the useful part.',
    'The host asks {a} to show her the look so far. {a}\'s makeover presents itself: {d} stands in what {a} has painted and styled. The host evaluates the pairing as a unit. Not two individuals who happen to be standing next to each other.',
    '{a} and {d} stand together. The host walks around them. The note is about the one thing that breaks the illusion — a mismatched brow, a silhouette that diverges, a concept that reads on one body and not on the other.',
    'The host checks {a}\'s makeover. Honest check — does {d} look like family or like a stranger in borrowed clothes. The difference between those two is the note.',
  ]),
  walk('ball', 'Three looks, one of them still in pieces on the table.', [
    'The host stops at {a}\'s station. Three looks on the table, two finished and one in pieces. \"Talk me through this one.\" The note is about the one in pieces because the one in pieces is the one that will be judged the hardest.',
    '{a} shows the host her ball looks. The host studies the construction of the design look — still being built, still on the table. \"Is this gonna be done?\" {a} says yes. The host\'s face says we will see.',
    'The host walks {a}\'s ball. Three looks in ninety seconds but the note always lands on the same one — the look she is building. \"Where is this going?\" The gap between concept and construction is still visible.',
    '{a} lays out her three looks. The host looks at them in order. \"Do these tell a story?\" The note is about the arc — whether the three looks build, and whether the design look finishes the story or leaves it half-told.',
    'The host asks {a} about the concept. {a} explains the three looks. \"And you can finish this in time?\" The note is about the design look — the one still on the table, where ambition and time have to meet.',
    '{a}\'s ball looks are laid out. The host goes \"what is the weakest one?\" {a} points at it without hesitating. \"Then fix that one.\"',
    'The host walks {a}\'s station. Picks up the garment and looks at the seams. \"Is this gonna hold together on that runway?\" {a} says yes. The host puts it down without answering.',
    'The host circles {a}\'s station once, studying the constructed garment from every angle. \"You are running out of time, baby.\" The feedback lands where it always lands at a ball — on whether the ambition can survive the hours remaining.',
  ]),
  walk('design', 'Construction, and whether the material is used or hidden.', [
    'The host stops at {a}\'s station. Picks up a piece of the material. Holds it. Looks at what {a} is doing with it. \"Are you using this or hiding it?\" The note is about whether the material is being shaped into something or draped over a body and called a garment.',
    '{a} shows the host her design. The host feels the construction — design challenges are judged by touch as much as by sight. \"Is this sewn or glued?\" The garment either has structure or it does not.',
    'The host walks {a}\'s design. \"Would this survive a walk down the runway?\" Construction check — how is it built, what is the material doing, is the thing on the dress form a garment or a concept that would not survive a breeze.',
    'The host looks at {a}\'s design. \"What is the material doing for you?\" The note is about whether {a} is using it or fighting it. The difference between a queen who understands fabric and a queen who is at war with it is visible in every seam.',
    '{a}\'s design is on the form. The host examines it from four feet away. \"I can see what you are going for.\" That sentence can mean two very different things and {a} is trying to figure out which one.',
    'The host goes \"show me the back.\" The back is where design challenges are won or lost. The front is what a queen plans. The back is what she runs out of time for.',
    '{a} presents her design. The host gives a note about proportion. \"The concept you described and the garment you are building — they are not the same thing yet.\" {a} nods because the host is right.',
    'The host walks {a}\'s construction. Tactical note — what needs to happen between now and the runway. \"What can you still fix?\" The question is the note. Whether {a} knows the answer is the test.',
  ]),
  walk('talent-show', 'The act, and whether it has an ending.', [
    '\"Show me the act.\" {a} shows her the act. The host\'s note is about the ending — a talent show act without an ending is one that just stops. \"How does this end?\" Stops and ends are not the same thing.',
    '{a} runs her talent show act for the host. The host watches for shape — a beginning, a build, a closer. \"It is one thing for two minutes. Where does it go?\" A talent act that stays flat outstays its welcome by a minute and a half.',
    'The host stops at {a}\'s station. \"Show me the act, show me the button, show me how you leave the stage.\" {a} shows. The host gives a note about whether the button exists.',
    '{a} performs for the host. \"Does the audience know when to clap?\" The note is about arc — does it start somewhere, does it arrive somewhere else. An audience that does not know when to clap is an audience that does not.',
    'The host watches {a}\'s talent show act. \"The talent is there. Has it been shaped into a performance?\" The host is not here to judge the skill. She is here to judge whether the skill has been packaged.',
    '{a} runs the act. The host listens like a producer, not a fan. \"Does it build? Does it surprise? Does it end?\" A talent act that runs long is a talent act that is not an act.',
    'The host walks {a}\'s talent. \"You have the skill. The question is whether the skill has been turned into a moment the audience remembers or a demonstration they watch.\" {a} takes the note.',
    '{a} shows the host her act. \"What about the ending?\" The note lands on the thing {a} has not thought about. The moment where the act stops being a rehearsal and starts being a show.',
  ]),
  walk('lalaparuza', 'Almost nothing to walk through, which is its own note.', [
    'The host stops at {a}\'s station. Almost nothing to walk through. \"How are you feeling?\" The walkthrough is a conversation about preparation for a thing that cannot be prepared for.',
    'The walkthrough is short. {c} does not have material to review. The host asks {a} how she is feeling. The answer is either confident or terrified. \"Good\" or \"I am scared\" — the host gives a note that fits whichever one it is.',
    '{a} has nothing to show the host. No script. No garment. No choreography. The walkthrough is a check-in. \"Are you ready?\" The note is about whatever the host can see in {a}\'s face.',
    'The host walks {a}\'s station. Ninety seconds. Both of them know it is not about preparation — you cannot prepare for this. \"Where is your head at?\" It is about whether {a} is ready. Ready is a different thing.',
    '{a} is sitting at her station with nothing in front of her. No fabric. No script. The host pulls up a chair. \"Talk to me.\" They talk. Not about the lip sync — about {a}. The note lands somewhere between advice and a pep talk.',
    '\"Are you ready?\" The host asks and the question IS the walkthrough. {c} has no rehearsal, no material, no script to review. It has a queen who is either going to show up tonight or is not.',
    '{a}\'s walkthrough is brief and personal. The host sits down. Asks a question that has nothing to do with preparation. \"What do you want the judges to see?\" The note has everything to do with whether {a}\'s head is in the right place.',
    'The host gives {a} a note that is less about the challenge and more about {a}. \"I believe in you. Do you believe in you?\" {c} has no material to note. It has a moment, and the moment is coming.',
  ]),
  walk('acting', 'Her lines, her character, and whether she has made a choice.', [
    '\"Run me the lines.\" {a} runs them. The host gives a note about the character behind the lines — the lines are written, the character is not. \"Who is this person?\" The character is what the panel is watching.',
    '{a} reads the script for the host. \"Have you made a choice about who this is?\" The note is about commitment — is {a} reading words off a page and hoping the words do the work a character is supposed to do.',
    'The host stops at {a}\'s station. \"Say the lines. Say them in character. Show me the choice.\" {a} delivers. The host watches and gives a note about whether the choice is visible.',
    '{a} delivers her lines. The host watches the face. Acting challenges are not about the words — they are about the person saying the words. \"I need to see her. Not you reading. Her.\"',
    'The host sits across from {a}. \"Perform the scene. Right here.\" No costume. No set. The purest test of whether {a} has a character or whether {a} has a script.',
    '{a} shows the host her character. \"Are you a queen who learned lines or a queen who built a person?\" The note is about the gap between reading and acting. {a} takes it and goes back to work.',
    'The host walks {a}\'s scene. \"What have you decided about this character that is not on the page?\" If the answer is nothing, then the note is that the answer cannot be nothing.',
    '{a} runs the scene for the host. \"You are playing it safe.\" The note is about risk — has {a} made a choice that could fail. Safe in an acting challenge is a form of failure the host has seen before.',
  ]),
  walk('commercial', 'The concept, and whether anybody could follow it.', [
    '\"Pitch it to me.\" {a} pitches. The host\'s note is about clarity — can a stranger follow this in thirty seconds. \"If you have to explain it, it has already failed.\"',
    '{a} explains her commercial concept. The host listens. \"Would I buy this?\" The note is about whether the concept can survive being performed, filmed, and judged.',
    'The host stops at {a}\'s station. \"What is the product, what is the joke, and can I understand both before the ad is over?\" That is the whole walkthrough. {a} answers or she does not.',
    '{a} walks the host through the concept. \"That is funny to explain. Is it funny to watch?\" The note is about the gap between the idea in {a}\'s head and the idea as it would read on a screen.',
    '\"What are you selling?\" The host asks and the answer is either clear or complicated. A clear concept gets a note about execution. A complicated one gets \"simplify.\"',
    '{a} pitches the commercial. The host responds with one question: \"What is the joke?\" If {a} can say it in one sentence the concept works. If she needs three, the concept needs work.',
    'The host walks {a}\'s commercial. \"Is this one thing done well or three things done badly?\" The queens who crash at commercial challenges are the ones who tried to fit a sketch into thirty seconds.',
    '{a} explains the concept. The host nods or does not nod. {a} can feel which one it is before the host opens her mouth. The nod is the note before the note.',
  ]),
  walk('improv', 'Nothing written down, so the note is about her instincts.', [
    '\"What is your approach?\" Nothing to show. Improv has no script, no material. The walkthrough is about instincts. \"Are your instincts going to serve you or betray you tonight?\"',
    '{a} has nothing to read because improv has nothing written. \"Do you listen or do you perform?\" The host gives a note about listening — improv is about reacting, not delivering prepared bits.',
    'The host pulls up a chair. \"When a scene goes sideways, what do you do?\" The answer reveals more than any rehearsal could. The host gives a note built entirely on how {a} describes her own reflexes.',
    '\"Are you nervous?\" The host asks and {a}\'s answer is either honest or not. A confident improviser and a nervous improviser need different notes. The host gives the right one.',
    '{a}\'s improv walkthrough is a check-in, not a review. \"Are you the queen who takes over a scene or the queen who disappears from one?\" The note lands on whichever tendency the host sees.',
    'The host walks {a}\'s station. \"Do you listen before you speak or speak before you think?\" Improv cannot be reviewed. The note is about instinct.',
    'Nothing written down. Nothing to rehearse. \"Do you know the difference between being funny and being funny AT somebody?\" The host gives {a} a note about whether to push or pull.',
    'The host sits with {a}. \"What kind of scene are you good in?\" The improv walkthrough is a conversation about scenes she has not had yet — the kind she is good in, the kind she is bad in, and which to aim for when the lights go on.',
  ]),
  walk('photoshoot', 'The look she is shooting in, and what it does under a light.', [
    'The host stops at {a}\'s station. Looks at the outfit. \"What does this do under a light?\" A photoshoot look is not a runway look. The thing that reads in motion may die in a frame.',
    '{a} shows the host her shoot look. The host evaluates it the way a photographer would. \"How does the fabric catch light? Does the silhouette hold in a still frame?\" The note is specific.',
    'The host walks {a}\'s photoshoot look. \"What reads in a photograph and what does not?\" The note is about the detail that works on a body in motion and will flatten in a still.',
    '{a} presents her look. \"A photoshoot strips movement away. What is left?\" A garment and a face. The host\'s note is about whether both of those do enough on their own.',
    '\"Hold the pose.\" The host looks at it the way a camera will. Without forgiveness. Without motion. Without the benefit of a walk that could distract from a weakness in the styling.',
    'The host checks {a}\'s shoot concept. \"Are the look and the pose telling the same story?\" A photoshoot that sends mixed signals produces a confusing frame.',
    '{a}\'s photoshoot walkthrough is about the frame. \"Is this strong enough to stand alone without a runway walk to sell it?\" What the camera sees is what the camera gets.',
    'The host looks at {a}\'s look under the werk room lights. \"The light is going to change on that set.\" The note is about whether {a}\'s choices will survive the shift.',
  ]),
  walk('choreography', 'The count, and whether she is on it yet.', [
    'The host watches {a} run the choreography. \"Are you on the count?\" Is she on it, ahead of it, behind it. Choreography is not dancing. The difference between the two is discipline.',
    '{a} runs her section for the host. The host watches the feet. The feet tell the truth — a face can fake it but feet that are half a beat off are half a beat off. The camera will catch it.',
    '\"Run it full out.\" The host stops at {a}\'s station. Full out in the werk room is the test — the count, the energy, the face on top of the count. Can {a} hold all three at the same time.',
    '{a} dances the routine for the host. \"You know the steps. Are you selling them?\" Learning choreography is not the same as performing it. The note is about that gap.',
    'The host walks {a}\'s choreography. Specific note — a count, a transition, a section where {a}\'s body is doing something different from what the choreographer asked. \"Fix it or own it.\"',
    '{a} runs the routine. The host watches for the moment where {a}\'s confidence breaks. The transition she is not sure about. The count she marks instead of commits to. The section where memory replaces muscle.',
    '\"Again. Slower.\" The slower version reveals everything the fast version hid. A wrong count. An uncertain transition. A moment where {a}\'s body is guessing instead of knowing.',
    '\"The steps are there. What about the face?\" The host gives {a} a note about performance on top of the choreography. The energy. The thing that separates a dancer from a performer.',
  ]),
  walk('singing', 'The vocal, sung to the host, in the werk room, unaccompanied.', [
    '\"Sing it for me.\" {a} sings it. In the werk room. Without a backing track. The host listens with the face of somebody who can hear every flat note the audience is going to hear and is deciding which ones to mention.',
    '{a} sings for the host unaccompanied. Total vulnerability. No track to hide behind. No harmonies to lean on. Just a voice in a room. \"That is what you have. Let me tell you what you need.\"',
    'The host stops at {a}\'s station. \"Sing it. Right now. Without anything underneath you.\" {a} sings. The bare vocal reveals everything. The note is about everything it reveals.',
    '{a} sings for the host. The note is clinical — pitch, breath, where the support drops out, where the voice is thinnest. \"You are covering here. I can hear it.\" The performance is covering for a vocal that needs more rehearsal.',
    '\"Sing me the part you are least confident about.\" {a} sings it. The host gives a note about the specific place where the vocal needs work. A singing challenge note that is not specific is not useful.',
    '{a}\'s vocal fills the werk room. The host listens without comment until {a} finishes. Then the note comes — about the thing {a} could feel herself doing wrong AND the thing she could not feel but the host could hear.',
    '\"Sing it again. Breathe here instead of there. Support from here. Let the note sit instead of pushing it.\" {a} tries again. The second attempt either shows the fix or shows that it needs more time.',
    'The host listens to {a} sing. \"Does that sound like a singer or does that sound like a queen trying to sing?\" The distance between those two things is the note. The note is honest.',
  ]),
  walk('runway-challenge', 'The looks themselves, which are the whole week.', [
    'The host stops at {a}\'s station. Looks at the garments. \"The looks are the whole week. Do they speak?\" A runway challenge walkthrough is a runway preview — the looks have to work without a performance to carry them.',
    '{a} lays out her looks. The host evaluates them the way a panel will. Construction. Concept. Proportion. \"Do these belong together or is each one a stranger to the one beside it?\"',
    'The host walks {a}\'s looks. \"Does this read on a body? Does that fall correctly?\" The walkthrough is a fitting. Is the concept visible or is it something {a} will have to explain on the main stage.',
    '{a} shows the host the looks. \"Which one is the weakest?\" A runway challenge is a presentation of taste. The weakest look is the taste the panel will remember.',
    'The host examines {a}\'s garments. She has watched enough runway challenges to know which construction choices survive a walk and which fall apart between the first step and the turn. \"This one worries me.\"',
    '{a} presents her looks. \"Are the accessories serving the garment or fighting it?\" The note is about styling — the hair, the presentation, whether it says what {a} thinks it says.',
    'The host walks {a}\'s runway challenge. \"Did you play it safe?\" The note is about risk. Did she take a swing. Is the swing going to land or is the swing going to explain why she should have played it safe.',
    'The host looks at {a}\'s looks. \"What reads from a distance?\" The note is about which details survive when the panel is ten feet away and the garment is moving.',
  ]),
  walk('generic', 'FALLBACK. A challenge this file does not know the shape of — '
    + 'so the note must not assume a garment, a script, a team or a stage.', [
    'The host stops at {a}\'s station. \"Talk me through your approach to {c}.\" {a} explains. The host gives a note about the gap between intention and execution. \"Is this what you think you are building?\"',
    '{a} walks the host through her plan for {c}. \"Is this a plan or is this a list of ideas?\" The host listens and gives a note about whether the plan has a shape yet.',
    'The host checks in with {a}. \"What is done and what is not done?\" The walkthrough is a conversation about where {a} is in the process and whether the distance is going to close before the cameras start.',
    '{a} shows the host where she is with {c}. The host gives a note. {a} can either use it or set it aside. Both are decisions. Both will be visible when the work is presented.',
    'The host walks {a}\'s station. \"Are you on track?\" The note is about readiness. Not about the specific work — about whether {a} is about to discover she is not where she thinks she is.',
    '\"How are you feeling about {c}?\" The answer tells the host more than the work itself does. Confidence and preparation show up in the face before they show up in the material.',
    '{a}\'s walkthrough is brief and productive. The host identifies the one thing that needs the most attention. Gives a note. Moves on. {a} is left with specific feedback and not enough time to overthink it.',
    'The host gives {a} a note about {c}. Honest without being destructive. \"I am saying this because I want you to do well.\" The thing that needs to be said, said in a way a queen can hear and use.',
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
const GROUP_CHALLENGES = new Set(['girl-group', 'rumix', 'music-video']);

export function pickKindFor(challengeId) {
  const c = MAXI_TYPES.find(x => x.id === challengeId);
  if (!c || c.assignment === 'none') return null;
  if (challengeId === 'improv') return 'premises';
  if (challengeId === 'commercial') return 'products';
  if (challengeId === 'lipsync-challenge') return 'opponents';
  if (c.roles === 'characters') return 'characters';
  if (c.roles === 'parts') return 'parts';
  if (GROUP_CHALLENGES.has(c.id)) return 'group-slots';
  /* A COMEDY BILL RATHER THAN A BAR OF MUSIC. `roles: 'slots'` is declared by
     the girl group AND by the roast and the stand-up, and the `slots` pool is
     written entirely about a verse in a number — see the note on
     `running-order` above for what that printed over a comedy night. */
  if (c.roles === 'slots') {
    return (c.id === 'roast' || c.id === 'stand-up') ? 'running-order' : 'slots';
  }
  return 'partner';
}

// ══════════════════════════════════════════════════════════════════════
// POOL 3 — THE HELP. One queen strong at tonight's craft coaches another.
// ══════════════════════════════════════════════════════════════════════

export const HELP_VOICES = [
  walk('talent-show', 'She watches the act fall apart in rehearsal and walks over.', [
    "{a} watches {b} run the act for the third time. Third time is no better than the first. She walks over. \"Show me the ending.\" {b} shows her. \"That is not an ending. That is where you stop.\" {a} spends the next forty minutes building {b} a closer.",
    "{b}'s act has no shape and {a} can see it from across the room. She puts her own rehearsal on hold, crosses the floor. \"The talent is there. The performance around it is not. Let me help.\" She fixes it before tonight. It costs her prep time she needed.",
    "{a} is good at this and {b} is drowning in it. {a} watches {b} rehearse the same bit three times without landing it. Fourth time she walks over. \"You are rushing the middle. Slow down here.\" She coaches {b} through the timing until it works. Costs her an hour of her own prep.",
    "She has her own act to rehearse and she puts it down. {a} sits with {b} and runs the act with her. \"That lands. That dies. That — do that again.\" The running-through turns {b}'s set from a list of ideas into a performance. It costs {a} time she does not have.",
  ]),
  walk('snatch-game', 'She helps another queen find the character before the taping.', [
    "{a} watches {b} struggle with the voice from three chairs away. Leans over. \"You are doing her face but not her voice.\" Spends twenty minutes feeding {b} references and punchlines until the impression has enough material to survive six questions.",
    "{b}'s character has no depth past the catchphrase. {a} knows it. She pulls {b} aside and runs a mock round — throwing questions the way the host throws them. Every answer that dies, {a} rebuilds with her. \"Try it like this.\"",
    "{a} can see that {b} has chosen a character she cannot sustain. She does not say that. She sits down. \"Let me help you find four backup answers.\" The finding takes most of the prep time {a} was going to spend on her own material.",
    "She has her own character to prepare and she puts it aside. {a} coaches {b} through the voice, the references, the improvised answers. \"When the host throws you something you did not prepare for — what do you do?\" It costs {a} forty minutes she did not have.",
  ]),
  walk('girl-group', 'She helps another queen learn the verse.', [
    "{a} watches {b} fumble the lyrics for the fourth time. Walks over. \"Run it with me.\" She runs {b}'s verse with her line by line until {b} can sing it without looking at the paper. Costs {a} time she was going to spend polishing her own section.",
    "{b}'s eight-count is a mess. {a} can see it from across the room. She puts her own choreography on hold. \"Five, six, seven, eight — no, HERE.\" She teaches {b} the steps until {b}'s body knows the rhythm her brain already lost.",
    "{a} pulls {b} aside. They run the full number together. The running is the thing that locks {b}'s verse into the song instead of sitting next to it. It costs {a} an hour she needed for her own delivery.",
    "She has her own lyrics to learn and she puts them down. \"Let me hear your section.\" {a} coaches {b} through the melody, the attitude, the entrance into the chorus. The matching takes longer than either of them expected.",
  ]),
  walk('design', 'She watches the construction fail and walks over with her own tools.', [
    "{a} looks at {b}'s construction and sees the problem before {b} does. She walks over with her scissors and her iron. \"Let me.\" Spends forty minutes rebuilding {b}'s garment from the inside while {b} watches and learns.",
    "{b}'s garment is coming apart at the seams. Literally. {a} is good enough at construction to see it and generous enough to fix it. She crosses the room. \"This seam. This dart. This hem.\" Puts her own work on hold.",
    "{a} watches {b} fight with the fabric. \"You are fighting it. Come here.\" She walks over and shows {b} the technique — the real one, the one she has been using for years. Costs her an hour of her own prep time.",
    "She has her own look to finish and she puts it down. Walks to {b}'s station. \"Hand me the pins.\" {a} is strong at tonight's craft and {b} is drowning in it. {a} rebuilds the construction while {b} assists. Costs {a} time she does not have.",
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
    "{a} watches {b} struggle and does not wait to be asked. She crosses the room. \"Let me see.\" Spends forty minutes of her own prep time coaching {b} through the part that is not working. Specific. Practical. Costs {a} time she does not have.",
    "{a} is good at this. {b} is not. {a} can see it from across the room. She could keep working on her own preparation. Instead she walks over. \"Here. Like this.\" Quietly coaches {b} through the thing that is falling apart.",
    "She has her own work to do and she puts it down. Goes to {b}. {a} is strong at tonight's craft and {b} is drowning in it. \"Show me where you are stuck.\" {b} drowning is not something she is willing to watch.",
    "{a} spends more time on {b}'s preparation than on her own. The maths does not work. {a} knows the maths does not work. She does it anyway because {b} is going to be on that stage tonight and {a} is not going to be the queen who watched her go out there unprepared.",
  ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 4 — THE SABOTAGE. One queen quietly makes another worse.
// ══════════════════════════════════════════════════════════════════════

export const SABOTAGE_VOICES = [
  walk('talent-show', 'She gives a note about the act. The note is deliberately wrong.', [
    "\"The ending does not land. Change it.\" {a} tells {b} and the suggestion she offers is worse than what {b} had. {a} knows this. The new ending will die on stage. {a} will be watching from the wings when it does.",
    "\"I think the energy is too big.\" {b} pulls back. The pulling-back kills the one thing the act had going for it. {a} watches {b} rehearse the smaller version and nods like it is working. It is not working. {a} chose this note because it would not work.",
    "{a} offers to watch {b}'s act and give feedback. The feedback is specific. Confident. Wrong. \"Cut that bit. Lean into this one.\" {b} listens because {a} sounds like she knows. {a} does know. That is the point.",
    "Subtle. {a} suggests a different song for {b}'s act. One that does not match the talent at all. The suggestion sounds reasonable enough that {b} makes the change with four hours left. {a} walks back to her own rehearsal. The change will cost {b} the performance.",
  ]),
  walk('snatch-game', 'She gives bad character advice disguised as help.', [
    "\"Go bigger.\" {a} tells {b} the impression needs to be bigger. {b} goes bigger. The bigger version is a cartoon of a character that was already thin. {a} watches {b} rehearse the new voice and nods encouragingly. The encouragement is the sabotage.",
    "\"I do not think that character works for you.\" The doubt is planted at exactly the right time — late enough that {b} cannot fully commit to a new character, early enough that she will not fully commit to the old one either.",
    "{a} feeds {b} a reference for the character that sounds right and is wrong. A catchphrase the real person never said. A mannerism from somebody else. {b} takes it because {a} delivers it with the confidence of somebody who has done her research.",
    "\"Lean into the physical comedy. Away from the voice.\" {b} does. The leaning is the thing that will leave {b} with nothing to say when the host asks a question that requires an answer instead of a gesture.",
  ]),
  walk('design', 'She gives a construction note that will fall apart on the runway.', [
    "\"I would change the proportions on that.\" {a} offers {b} a suggestion that is wrong. Not obviously wrong — wrong in the way that will only become visible under the stage lights. {a} offers it with warmth. {b} goes \"really? Okay\" and changes it.",
    "\"Girl, that colour is not working.\" {a} tells {b} to change it. {b} changes it. The new colour is worse. {a} knows it is worse. {a} chose it because it is worse.",
    "\"I think you should take that in.\" {b} takes it in. The taking-in ruins the silhouette in a way that will not be obvious until {b} is in front of the panel. {a} watches {b} make the alteration. Nods encouragingly. The nod is the worst part.",
    "Subtle. {a} adjusts something on {b}'s mannequin while {b} is across the room. The adjustment is small enough that {b} will not notice until the runway. The room does not see it. The cameras might.",
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
    "\"I would change your approach.\" {a} offers {b} a suggestion that sounds right and is wrong. Wrong in the way that will only become visible on that stage when the pressure is on. {a} offers it with warmth. {b} goes \"thank you, girl\" and follows it.",
    "Subtle. {a} gives {b} a note that sounds right and is wrong. {b} follows it. The cost will not show until {b} is in front of the panel. {a} goes back to her own work like nothing happened.",
    "\"Your approach is off. Try this instead.\" {b} changes it. The new direction is worse. {a} knows it is worse. {a} chose it because it is worse. The exchange looks like mentorship. It is not.",
    "{a} gives {b} a confident, specific, wrong note. \"Trust me.\" {b} follows it because {a} sounds like she knows. {a} watches {b} make the change. Nods encouragingly. The nod is the worst part.",
  ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 5 — THE SHUNNED. Nobody helps her. An event, not an absence.
// ══════════════════════════════════════════════════════════════════════

export const SHUNNED_VOICES = [
  walk('talent-show', 'The room is running acts for each other. Nobody runs one for her.', [
    "The room is rehearsing in pairs. One queen watches, gives a note, trades places. Nobody asks {a} to watch. Nobody offers to watch hers. She runs the act alone in a corner. The running-alone changes the energy of it in a way the panel will see without knowing why.",
    "\"Does anyone want to run their act together?\" Silence. Everybody heard. Nobody volunteers. {a} rehearses alone.",
    "Three queens are giving each other notes on their acts. {a} is not part of the circle. She could ask. The circle is not closed. But the not-being-invited is its own answer.",
    "The room has paired off for feedback and {a} is the one left without a partner. Not cruelty — arithmetic. One queen short of an even number. But the arithmetic always seems to land on her.",
  ]),
  walk('snatch-game', 'The room is running characters for each other. Nobody runs one for her.', [
    "Queens are testing voices on each other. Throwing questions back and forth. Workshopping punchlines. Nobody throws a question at {a}. She sits at her station with her reference photos and rehearses the voice to nobody.",
    "\"Does anyone want to run a mock round?\" Quiet. Everybody heard. Nobody volunteers. She prepares alone. She will not know if the character works until the cameras are rolling.",
    "The werk room is full of queens helping each other find material. References being traded. Impressions tested. Weak answers rebuilt. None of this traffic flows toward {a}.",
    "Three queens are workshopping their characters together — feeding each other setups, testing reactions. {a} watches from her station. Does not ask to join because the asking would confirm the thing the watching already told her.",
  ]),
  walk('design', 'The room is lending tools and checking hems. Nobody checks hers.', [
    "The room is helping each other. Queens crossing to other stations, offering advice, lending tools, checking hems. Nobody crosses to {a}'s station. Nobody offers. Nobody checks. She works faster, quieter. Faces the mirror instead of the room.",
    "\"Can someone help me with this?\" The room gives {a} the specific silence of people who heard the question and chose not to answer. She figures it out on her own. Takes twice as long.",
    "Three queens walk past {a}'s station while she is struggling with the construction. All three keep walking. She does not ask again.",
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
    "The room is helping each other. Queens crossing the floor, giving notes, offering a hand. Nobody crosses to {a}. Nobody offers. Nobody checks. The absence is loud enough that {a} can hear it. She works faster. Quieter. Faces the mirror instead of the room.",
    "\"Can someone — \" {a} starts. The room gives her the specific silence of people who heard and chose not to answer. Not cruelty. Calculation. A whole room deciding independently that helping {a} is not in their interest tonight.",
    "Three queens walk past {a} while she is struggling. All three keep walking. She does not ask again. Works it out on her own. Takes twice as long. The room knows this. The room is fine with it.",
    "The room has decided, without discussing it, that {a} is on her own tonight. Help flows in every direction except toward her. {a} is aware of the pattern. The awareness settles into her preparation like a weight.",
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
