// ══════════════════════════════════════════════════════════════════════
// dr/data/runway-voices.js — the runway, in her own voice
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The runway walk in stage-beats.js is a NARRATOR describing a queen from the
// outside, and it has one voice for thirteen women. Read a dumped season and
// every walk is the same sentence with a different name in it: "{a} turns the
// corner and the panel goes quiet." A fashion queen who lives and dies on
// proportion, a camp queen who built the joke on purpose, and a pageant queen
// who has done this since she was nineteen are all narrated identically, and
// the only thing that varies is how good the look was.
//
// The show does not do that. It puts HER VOICE over her own walk. So this
// file replaces the narrator with the queen, and gives her two things the
// narrator never had: what kind of drag she does, and what kind of person
// she is.
//
// ── THE THREE POOLS, AND WHY THEY ARE SEPARATE ────────────────────────
//
// A walk has to answer three questions and they have three different sources:
// what did she bring for THIS CATEGORY, how did her craft read it, and what
// does a woman like her think about the result. A single crossed pool —
// category × style × archetype × tier — is tens of thousands of lines, of
// which a thirteen-queen season would read thirteen. So the three axes are
// authored independently and JOINED at render time, in this order:
//
//   RUNWAY_THEMES    the garment.  8 families × 3 fits.   What she brought for {c}.
//   RUNWAY_VOICES    her craft.   10 styles  × 5 tiers.   How it read on the walk.
//   RUNWAY_SWAGGER   her nerve.    5 groups  × 5 tiers.   What she thinks of it.
//
// stage.js renders `theme + " " + voice + " " + swagger` as one paragraph.
// That is 384 lines producing 1,200 distinct paragraphs, every one of which
// is about the right category, in the right craft's voice, at the right
// place in the field, from the right kind of woman.
//
// ── THE TWO CONSTRAINTS THAT MAKE THE JOIN WORK ───────────────────────
//
// Each pool knows ONLY its own axis and must not trespass on another's.
//
//   A THEME line knows the category and whether it suits her. It must NOT
//   say how the look landed — it is written before the panel has reacted,
//   and it lands identically on a stunning walk and a disaster.
//
//   A VOICE line knows how it landed and what craft she does. It must NOT
//   name the garment, the fabric or the colour — the theme line already
//   chose those and it chose different ones last week.
//
//   A SWAGGER line knows only the tier. It must not name the garment, the
//   category, the colour or the concept. A swagger line that says "and the
//   feathers were worth it" is broken, because the theme line it lands
//   after may have been about a suit.
//
// The swagger line is also the LAST sentence of the paragraph and has to read
// as one after any two lines that preceded it.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// FIRST PERSON, UNQUOTED. This is her voiceover running over her own walk —
// the show's own device. Not "she walks out"; not a quoted line of dialogue.
// Just: I built this in four days and I can feel the front row stop talking.
// The screen already draws her portrait and her name beside the paragraph, so
// the reader never loses track of who is speaking.
//
// Placeholders:
//   {a}  her own name. AVAILABLE BUT RARELY RIGHT — she is speaking, and a
//        queen who refers to herself in the third person is doing a bit. Use
//        it for exactly that, and only in a style where the bit is in
//        character.
//   {c}  tonight's runway category, e.g. Mother of the Bride Realness.
//        REQUIRED IN EVERY THEME LINE and forbidden everywhere else — the
//        theme line is the only thing in the whole episode that tells the
//        viewer what she was asked to walk in.
//
// Same rules as every other pool, all enforced by tests: no real people,
// this show's vocabulary only, never quote a stat by number, four variants
// minimum per tier, prose rather than captions.
//
// ── THE TIERS ARE RANKED, NOT SCORED ──────────────────────────────────
//
// stage.js ranks the queens who walked TONIGHT and cuts the field: the top
// 15% are `stunning`, the next quarter `strong`, and so on down to
// `disaster`. So `stunning` means best in this room on this night, not a
// number — and a `weak` on a strong night is a look that would have been
// fine two weeks ago. Write to the room, not to a score.

import { runwayById } from './runways.js';

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The five score cuts, best to worst. Voice and swagger share them. */
export const RUNWAY_TIER_IDS = ['stunning', 'strong', 'fine', 'weak', 'disaster'];

/** The three fits, from `fitFor` in js/dr/perform.js: 1, 0.5 and 0. */
export const RUNWAY_FIT_IDS = ['home', 'neutral', 'against'];

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — THE GARMENT. What she brought, for this category.
// ══════════════════════════════════════════════════════════════════════
//
// THE CATEGORY IS THE ONE THING THE OLD RUNWAY NEVER SAID. Twenty prompts in
// js/dr/data/runways.js, each of them a real instruction to a designer — and
// the walk that followed was "she comes around the corner and the look is
// finished from the wig to the heel", which would print identically under
// Night of a Thousand Ghouls and under Denim and Diamonds. The engine knew
// which category it was and chose not to look.
//
// ── WHY FAMILIES RATHER THAN CATEGORIES ───────────────────────────────
//
// Twenty categories × three fits is 240 fragments, and the categories are not
// twenty different ideas — Ghouls, Creatures of the Deep and Leather and Lace
// are one instruction wearing three hats. So they collapse into eight
// families, exactly the way challenge families work in maxi-performance.js.
// The category still names itself in the line through {c}, so the reader sees
// Creatures of the Deep and not "the horror category".
//
// ── THE THREE FITS ARE THE THEME RELATION, AND THEY ARE MEASURED ──────
//
// `fitFor` in js/dr/perform.js already scores whether the category calls for
// her style — 1 when it is her wheelhouse, 0 when it clashes, 0.5 when the
// prompt names no styles and asks everybody the same question. Those are
// these three tiers, so `home` really is her wheelhouse and `against` really
// is a prompt she has to fight, by the same number the score used.
//
// This is where a queen's relationship to the theme lives, and it is the most
// interesting axis in the file: a spooky queen given Night of a Thousand
// Ghouls has been waiting all season and says so; the same queen given
// Pageant Perfection is doing an impression of somebody else's drag and knows
// the panel can tell.
//
// A theme line does NOT know how the look landed. Write it as the sentence
// she would say walking out of the workroom, before anybody has reacted.

const theme = (family, note, tiers) => ({ family, note, tiers });

export const RUNWAY_THEMES = [
  theme('haunted',
    'Horror, the deep, the occult, leather. A prompt that wants to frighten '
    + 'somebody. Texture, silhouette and a face that is doing something wrong.', [
      tier('home', 'Her prompt. She has had this look in her head for years.', [
        'I have had this {c} look in my head since before I got the call, and the only change I made was making it worse.',
        '{c} is what I do — the dark, the weird, the thing that makes people look twice — and I have been waiting all season for the prompt to ask.',
        'I built this {c} look years ago and I have been waiting for a runway that deserves it, and tonight is the night.',
        'This is my {c} and I am not playing — I cut the silhouette to unsettle and I painted the face to match, and every stitch of it was built to be remembered.',
      ]),
      tier('neutral', 'Not her language, but a language she can speak.', [
        '{c} is not my usual but I can speak it — I pulled the reference, I found the angle, and the silhouette does enough of the talking.',
        'I do not live in {c} but I can visit, and what I packed is something that respects the prompt without pretending this is mine.',
        'My take on {c} is honest — I do not do this every night, but I know what the category wants and I brought something that answers it.',
        '{c} is a stretch and I leaned into the stretch — the look is not what I usually walk in, but it is not a costume either.',
      ]),
      tier('against', 'She does not do frightening and is going to try anyway.', [
        '{c} is the opposite of everything I do, and the look I am wearing is my best impression of somebody who lives in this world.',
        'I do not do {c} — never have, never wanted to — and what is on my body tonight is a compromise between the prompt and the only drag I actually know.',
        'My version of {c} is polite, and I know it, and the queens who own this category are going to eat me alive.',
        '{c} wants a queen I am not, and I tried — I really tried — but what I am walking in is a negotiation between the brief and my actual skill set.',
      ]),
    ]),
  theme('pageant',
    'Pageant Perfection, Black and White Ball, Something Borrowed. Polish, '
    + 'symmetry, correctness, and a rulebook everybody in the room knows.', [
      tier('home', 'The rulebook is hers. She has won on this prompt before it was a prompt.', [
        'I have won on {c} before it was a category — this is the drag I was raised in, and the walk is muscle memory from a decade of stages.',
        '{c} is what I am trained for, what I was built for, and the look tonight is the one I would have walked in a pageant last year without changing a single pin.',
        'I know the {c} rulebook because I helped write it — the silhouette, the proportion, the finish — and tonight is exactly where I belong.',
        'This is my {c} and I could walk it with my eyes closed — the gown is correct, the proportions are correct, and I did not have to think about any of it.',
      ]),
      tier('neutral', 'She can do correct. Correct is not what she is known for.', [
        'I can do {c} — correct, polished, appropriate — it is just not what people book me for, and the panel knows that.',
        '{c} asks for symmetry and taste and I brought both, but the look is going to read as an impression of somebody else\'s drag and we all know it.',
        'I packed a {c} that is clean and finished, the look of a queen who learned the rules rather than growing up inside them.',
        'I packed a {c} look that is technically right, and technically right is the most dangerous place to be on this stage.',
      ]),
      tier('against', 'Being asked to be tasteful by people who cast her for not being.', [
        '{c} is the prompt they cast me to fail at, and the look I built is my best argument that I should not have to apologise for my actual drag.',
        'They knew who I was when they put me on this show, and now {c} is asking me to be the opposite of the reason I am here.',
        'I do not do {c} and I do not want to do {c}, and the thing I am wearing is the most polite version of myself I could manage on short notice.',
        '{c} asks for restraint, and I walked in here because I do not have any, and the look tonight is what happens when those two things meet.',
      ]),
    ]),
  theme('structure',
    'Structure and Silhouette, The Colour Wheel. A design prompt. Line, '
    + 'proportion, construction and an idea you can see from the back row.', [
      tier('home', 'A question about shape, asked of somebody who thinks in shapes.', [
        '{c} is a question about shape and I think in shapes — the line is clean, the proportion is deliberate, and the idea reads from the back row.',
        'I built this {c} look around a single silhouette idea, and everything else — the fabric, the weight, the way it moves — serves that idea and nothing else.',
        '{c} asked for construction and concept and I brought both, because this is the only week the competition scores on the thing I am actually trained for.',
        'This is my {c} and the engineering is the point — every seam is structural, every panel is doing something, and the whole thing says what I wanted it to say.',
      ]),
      tier('neutral', 'She built something. Whether it is an idea is somebody else\'s call.', [
        'I built a {c} look that holds together — clean lines, solid construction — and whether it has an idea in it is something the panel gets to decide.',
        'My {c} is constructed well, finished properly, and standing up on its own, which is the most I can promise about a category that asks for a concept I am not sure I have.',
        'The {c} silhouette is there and the construction is honest, and I am walking it knowing that solid is not the same as interesting.',
        'I answered {c} with a garment that works — the proportions are right, the execution is clean — and I am hoping the panel sees enough idea in it to call it more than competent.',
      ]),
      tier('against', 'The prompt wants a concept and she brought a garment.', [
        '{c} wants a design idea and I brought a garment, and the distance between those two things is going to show on the walk.',
        'I do not think in silhouettes and {c} is asking me to, and what I am wearing is the best shape I could manage without a designer\'s eye.',
        'My {c} is a dress, and the prompt wanted an argument, and I can feel the difference every time I look at the queens who actually have one.',
        '{c} asks for construction I do not have the vocabulary for, and the look I am walking is the closest I could get with the tools I actually own.',
      ]),
    ]),
  theme('spectacle',
    'Feathers and Fringe, Showgirl, Curtain Up. Showbusiness. Big, plumed, '
    + 'lit from the front, and unembarrassed about any of it.', [
      tier('home', 'Enormous, and she was built for enormous.', [
        'I was built for {c} — the bigger the better, the more the more — and the look tonight is the loudest thing I have ever put on my body and I mean every inch of it.',
        '{c} is my language and I am fluent — the plumes, the shimmer, the silhouette that fills the whole stage — and tonight I do not have to hold back.',
        'This is my {c} and it is enormous on purpose, because showgirl is not a costume for me, it is how I was raised and how I perform best.',
        '{c} asked for spectacle and I brought spectacle — unapologetic, oversized, lit from every angle — because this is the only prompt that lets me be exactly who I am.',
      ]),
      tier('neutral', 'She can be big for one night.', [
        'I can do {c} for one night — I packed something that reads from the back of the room and carries the weight of the category without pretending I live here.',
        'My {c} is big enough — feathered, finished, present — and I am wearing it with the confidence of a queen who can borrow this energy even if she does not own it.',
        '{c} is not my home but I dressed for the occasion, and the look is doing the heavy lifting while I try to walk like a woman who was born in a headdress.',
        'I brought a {c} look that does what the prompt asks — it fills the frame, it catches the light — and I am hoping the walk sells the rest.',
      ]),
      tier('against', 'Asked to be a showgirl when her whole thing is not being one.', [
        '{c} asks me to be enormous and I am a queen who works small — intimate, precise, deliberate — and the look I am wearing is what happens when a minimalist tries to be loud.',
        'I do not do {c} and the look is honest about that — it is the biggest thing I could build without feeling like I am in somebody else\'s drag.',
        'My {c} is quiet for {c}, and I know it, and the queens who were born in sequins and plumes are going to walk past me like I am not here.',
        '{c} wants a showgirl and I am not one — never have been, never will be — and what is on my body is the closest I could get without feeling like a lie.',
      ]),
    ]),
  theme('nightlife',
    'Club Kid Couture, Bodysuit Realness, Denim and Diamonds. The room this '
    + 'drag actually comes from. Body, nerve, silhouette, three in the morning.', [
      tier('home', 'Finally, the prompt is her Friday night.', [
        '{c} is my Friday night — the body, the nerve, the silhouette I built for a dark room — and tonight the runway gets to see what I actually look like at three in the morning.',
        'I have worn this {c} look in rooms the panel has never been to, and bringing it onto this stage feels like finally being asked to show up as myself.',
        'This is my {c} and it is the real thing — the proportions, the attitude, the look I would walk into a club in without changing a single thing.',
        '{c} finally asks for the drag I actually do, and the look tonight is not a runway version of nightlife — it is nightlife, on a runway, exactly as I built it.',
      ]),
      tier('neutral', 'She has been to a club. This is not the same as being of one.', [
        'I have been to a club and I can dress for {c}, but the look is a tourist version and I know the difference even if the panel does not.',
        'My {c} is a look I packed for tonight, not a look I would walk into a venue in, and the distinction is going to be obvious next to the queens who live in this world.',
        '{c} asks for body and nerve and I brought both, but the nerve is borrowed and the body is styled rather than lived in, and that shows.',
        'I can speak {c} well enough to walk it — the silhouette works, the proportions are there — but the attitude is rehearsed rather than natural.',
      ]),
      tier('against', 'A prompt that asks for a body and a nerve she does not trade on.', [
        '{c} asks for a body confidence I do not trade on, and the look I built is my attempt to answer a prompt that was written for a different kind of queen.',
        'I do not do {c} — my drag hides the body, builds the character, tells the story somewhere above the neck — and this prompt stripped all of that away.',
        'My {c} is covered where it should not be and structured where it should flow, and I can feel the prompt fighting the only drag I know how to do.',
        '{c} wants nerve and silhouette and skin, and I have built my entire career on the opposite of all three.',
      ]),
    ]),
  theme('cartoon',
    'Cartoon Come to Life, Two Looks in One. Camp, colour, a reveal, a joke '
    + 'built into the construction. Nothing here is subtle and it must not be.', [
      tier('home', 'Permission, in writing, to be ridiculous.', [
        '{c} is permission, in writing, to be ridiculous, and I took every inch of permission they gave me and then some.',
        'I built this {c} look to make people laugh before they gasp, because that is the order it should go in and that is the order I live in.',
        '{c} is camp and camp is what I do — the reveal is built, the joke is in the construction, and the whole thing is stupid on purpose, which is the hardest thing to get right.',
        'This is my {c} and every absurd detail was a choice — the scale, the colour, the thing that is about to happen when I hit the mark — and I committed to all of it.',
      ]),
      tier('neutral', 'Playing along, and enjoying it more than she expected.', [
        'I do not usually do {c} but I am having more fun with it than I expected — the look is silly and I wore it with permission and the permission felt good.',
        '{c} let me play, and I played, and the look I packed is not my strongest but it is the one I had the most fun putting on.',
        'My {c} is a queen having a good time with a prompt that does not take itself seriously, and I brought something that matches that energy.',
        'I came into {c} planning to survive it and ended up enjoying it — the look is bigger and weirder than anything I usually walk in, and the smile is real.',
      ]),
      tier('against', 'She does not do silly and this prompt is only silly.', [
        '{c} is silly and I do not do silly — my drag is polished, restrained, intentional — and the look I built is what happens when a serious queen tries to be fun.',
        'I do not do camp and {c} is only camp, and the thing on my body tonight is a negotiation I lost with the prompt.',
        'My version of {c} is too controlled to be funny and too weird to be elegant, and I am walking it knowing I am in no-man\'s-land.',
        '{c} asks for joy and excess and commitment to absurdity, and I brought effort, which is not the same thing.',
      ]),
    ]),
  theme('personal',
    'Hometown Pride, Bring Back My Girls, Best Drag, Category Is: You. The '
    + 'prompt is her. No brief to hide behind and nothing to blame.', [
      tier('home', 'The easiest brief she will ever get and the most exposing.', [
        '{c} is the easiest brief I will ever get and the most dangerous — it is me, no filter, no theme to hide behind, and I brought the look that says who I am.',
        'I know exactly who I am for {c}, and the look tonight is the truest thing I have worn all season — no brief to interpret, just the drag I would do if nobody was watching.',
        'This is my {c} and it is the most honest look in my luggage — no category to answer, no prompt to satisfy, just me and the thing I built when nobody told me what to build.',
        '{c} asks who I am, and I know the answer, and the look tonight is not my safest — it is my most real, which is scarier.',
      ]),
      tier('neutral', 'Asked who she is, on a night when she is not certain.', [
        '{c} asks who I am, and tonight that is a harder question than it sounds — I brought a look that answers it, but the answer feels less certain than it did when I packed.',
        'My {c} is a version of me — a true one, not a dishonest one — but it is the version I thought I was before I got here, and a few weeks in this competition have complicated that.',
        'I packed this {c} look knowing what it was supposed to say, and now I am walking it wondering if it still says the thing I meant.',
        '{c} is personal and I brought something personal, and the problem with personal is that it exposes the gap between who I think I am and who the panel sees.',
      ]),
      tier('against', 'A prompt with no walls, which is the only kind she cannot build for.', [
        '{c} has no walls and I need walls — I need a brief, a reference, a constraint to push against — and a prompt that says just be yourself is the only one I cannot answer.',
        'I do not know what {c} means for me, which is the whole problem — every other prompt tells me what to build, and this one asks me to decide, which I am worse at.',
        'My {c} is a look I assembled from the pieces of my drag that I could identify, and the result feels like a collage rather than a statement.',
        '{c} asks for the queen underneath the categories and the costumes, and I am not sure she has a look of her own, which is a terrifying thing to discover on a runway.',
      ]),
    ]),
  theme('open',
    'FALLBACK. A category this catalogue does not name — a challenge-derived '
    + 'eleganza, one walk of a Ball, an authored one-off. The line may use {c} '
    + 'but must not assume anything about what {c} means, because it could be '
    + 'anything. Describe the making and the wearing, not the theme.', [
      tier('home', 'Whatever it turned out to be, it turned out to be hers.', [
        'Whatever {c} turned out to mean, it turned out to mean something I already had in my luggage, and the look tonight is mine in a way that feels lucky.',
        'I read the {c} brief and I saw myself in it immediately — the look I built is the thing I would have worn anyway, which is the best possible version of this night.',
        '{c} could have been anything and it turned out to be something I know how to do, and the garment I am walking in is the proof.',
        'The {c} prompt landed in my wheelhouse and I built something I am proud of, something that answers the brief and sounds like me at the same time.',
      ]),
      tier('neutral', 'A brief, answered.', [
        'I read the {c} brief and I answered it — honestly, cleanly, without reaching for something I do not have.',
        'My {c} is a response — it addresses the prompt, it fits my body, and it walks — and that is the most I can promise about a category I had no instinct for.',
        '{c} asked a question and I gave it an answer, and the answer is competent rather than inspired, which I am at peace with.',
        'I built a {c} look that says I read the brief and I tried, and the trying is genuine even if the result is not my strongest walk.',
      ]),
      tier('against', 'A brief she read three times and still does not have an angle on.', [
        'I read the {c} brief and I did not see myself in it anywhere — the look I built is my best guess at a prompt I still do not fully understand.',
        '{c} asked for something I do not have a reference for, and the garment I am wearing is a honest attempt at a language I never learned.',
        'I read the {c} prompt three times and built the most sincere version of something I have no instinct for, and sincerity is all I can offer tonight.',
        'I do not know what {c} wanted from me, and the look I am walking in tonight is the result of that confusion made into a garment.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — HER CRAFT. One voice per drag style.
// ══════════════════════════════════════════════════════════════════════
//
// The ten styles are js/dr/queen.js's DRAG_STYLES and this file must carry
// all ten: a queen's style is either authored on her roster entry or derived
// from her strongest craft stat, so every queen in every season has one.
//
// WHAT SEPARATES THEM IS WHAT SHE NOTICES. That is the whole instruction. A
// fashion queen walking a stunning look talks about proportion and line and
// the exact weight of the fabric; a camp queen walking the same tier talks
// about the moment the joke lands and the fact that she meant every stupid
// inch of it; a pageant queen talks about the years of doing this and the
// fact that this is what she is FOR. Same tier, same room, three different
// women — because they are looking at three different things.
//
// And the failure tiers separate hardest of all. A fashion queen's disaster
// is a taste failure and she knows it before she reaches the mark. A club-kid
// queen's disaster is that the room did not get it, which is not the same
// admission at all.

const voice = (style, note, tiers) => ({ style, note, tiers });

export const RUNWAY_VOICES = [
  voice('pageant',
    'Trained, symmetrical, decades of it. Poise is not an accident and she '
    + 'will tell you what it cost. Reads a sloppy queen without saying so.', [
      tier('stunning', 'This is the room she was built for, and she knows it.', [
        'I have trained for this walk my entire career and tonight the training is visible — the posture, the turn, the way the gown sits — and I can feel the panel seeing all of it.',
        'Everything is in place and I know it before I reach the mark — the silhouette is clean, the proportions are right, and the poise is the kind you cannot fake.',
        'This is the room I was built for and the walk shows it — years of preparation, years of stages, and tonight all of it is landing exactly where I put it.',
        'The technique is perfect and I am not being modest — the presentation, the finish, the way I hold the last beat — this is what I trained to do and tonight it worked.',
      ]),
      tier('strong', 'Clean, correct, expensive. She will take it.', [
        'Clean, correct and expensive — three words the panel will use and three words I will take, because that is the standard and I hit it tonight.',
        'The presentation is solid, the technique is there, and the walk reads as a queen who knows what she is doing, which I do, and the panel can see that I do.',
        'I did my job tonight — the proportions are right, the walk is rehearsed, the finish is polished — and I will take a clean score on a night like this.',
        'The look reads as trained, which it is, and the walk reads as prepared, which it was, and I am satisfied with a night that lands where I expected it to.',
      ]),
      tier('fine', 'Textbook. Nothing to fault and nothing to remember.', [
        'I walked a textbook walk in a correct look and nobody is going to remember this by tomorrow, which is the worst kind of safe.',
        'I hit every mark and did not miss a beat and the result is perfectly forgettable, which for a queen who has spent years on this is not a compliment.',
        'Everything is technically right and nothing is interesting, and I can feel the panel filing me under competent, which is the faintest praise I know.',
        'The training held and the technique was fine and the look did what it was supposed to do, and fine is the word that is going to haunt me tonight.',
      ]),
      tier('weak', 'Dated, and she can feel the panel deciding that word.', [
        'The look is dated and I can feel the panel deciding that word while I walk — the reference, the silhouette, the whole presentation reads as last decade.',
        'I trained for this but the training is showing its age, and the walk that would have won five years ago is reading as stiff tonight.',
        'The poise is there but the taste has not moved, and I can feel the distance between what I learned and what the panel is looking for.',
        'Something is off and I know what it is — the pageant I trained in is not this pageant, and the technique that used to carry me is carrying less tonight.',
      ]),
      tier('disaster', 'The training does not save her and that is the humiliation.', [
        'The training was supposed to save me and it did not — the look fell apart, the walk fell apart, and the poise that never fails me failed me on the one stage that mattered.',
        'I have never bombed a walk in my life and I am bombing this one, and the worst part is that I can feel every year of training watching me do it.',
        'Everything I spent a decade learning — the posture, the turn, the hold — none of it is working tonight, and the humiliation is not the bad walk, it is that the training should have prevented it.',
        'The technique broke down and I do not know why, and a pageant queen who cannot walk is a queen with nothing, and I can feel the panel arriving at that conclusion.',
      ]),
    ]),
  voice('comedy',
    'The look is a delivery system for a bit. She is watching for the laugh '
    + 'the way another queen watches for the gasp, and she times the walk to it.', [
      tier('stunning', 'The bit lands on the runway and the panel breaks.', [
        'I timed the walk to the reveal and the reveal hit exactly where I built it to hit, and the sound from the panel is the sound I have been chasing my whole career.',
        'The bit landed — not a smile, not a chuckle, an actual break — and I can feel the room go with me the way a room goes with a comedian when the set is working.',
        'I built a joke into the construction and the joke played, and the laugh from the front row is louder than anything a pretty gown has ever gotten on this stage.',
        'The timing worked, the gag worked, and the panel is laughing the way I need them to laugh — not polite, not surprised, genuinely broken by something I built on purpose.',
      ]),
      tier('strong', 'It works. She hears exactly the laugh she built for.', [
        'It worked — I hear the laugh I built for, right where I put it, and the walk reads as somebody who meant every stupid detail.',
        'The bit is landing and the panel is amused in exactly the way I wanted, which is the difference between a funny look and a look that happens to be funny.',
        'I got the reaction I was going for — not a gasp, not silence, a laugh, right on time, from the right people.',
        'The gag played and I can hear it playing, and the walk is selling the bit the way I rehearsed it, which is the only thing I was worried about.',
      ]),
      tier('fine', 'A smile, not a laugh, and she knows the difference.', [
        'I got a smile, which is not a laugh, and I know the difference — a smile means they see the joke and a laugh means the joke worked, and those are two different things.',
        'I can see the bit reading but it does not break — the panel is amused, not undone — and for me, amused is the most disappointing positive review.',
        'They got it. They saw the joke, they appreciated the joke, and they moved on, and the moving-on is the part that tells me it was not enough.',
        'I got a polite smile from the panel, which means the concept was clear but the execution did not surprise anybody, and surprise was the whole point.',
      ]),
      tier('weak', 'The joke does not read as a joke, which is worse than not being funny.', [
        'I can tell the joke is not reading as a joke — it is reading as a bad look — and that is worse than not being funny, because at least a bad comedian is understood.',
        'I can see the panel looking at the construction and not seeing the bit, which means the bit failed at the one thing it was supposed to do, which is be visible.',
        'I can see my gag did not land because they did not know there was a gag, and a joke that reads as a mistake is the loneliest place I can stand.',
        'Nobody is laughing because nobody can tell there is anything to laugh at, and I am walking a look that was built around a joke that is invisible.',
      ]),
      tier('disaster', 'Silence, and she has to keep walking through it.', [
        'Silence, and I have to keep walking through it, which is the specific humiliation comedy prepares you for and never actually makes easier.',
        'The look is dying on the runway and I can hear it die — no laugh, no gasp, no reaction at all — just the sound of my heels and the air conditioning.',
        'I built a joke and wore it and walked it and nobody laughed and nobody will, and the runway is very long when the only sound is your own footsteps.',
        'The bit bombed and I am still on stage, still walking, still committed to a joke that is not funny, and the commitment is making it worse.',
      ]),
    ]),
  voice('fashion',
    'Proportion, line, fabric, reference. Unsentimental about her own work and '
    + 'contemptuous of a look with no idea under it, including when it is hers.', [
      tier('stunning', 'The line is right and she can see the panel see it.', [
        'The line is right — I can see it in the mirror and I can see the panel see it — the proportion, the weight, the way the whole thing moves as one idea.',
        'Every decision I made on this garment was correct, and the walk is proving it — the drape, the cut, the way the silhouette reads from every angle.',
        'The look is exactly what I designed it to be, and the panel is giving it the kind of attention that means they are reading the construction, not just the surface.',
        'I can feel the garment working the way I built it to work — the line, the movement, the relation between the body and the fabric — and the front row has stopped talking.',
      ]),
      tier('strong', 'A good garment worn correctly. She wanted more.', [
        'A good garment, worn correctly, and I wanted more — the construction is clean and the idea is there, but the idea did not arrive the way I wanted it to.',
        'The look is strong and I know it and the panel will score it well, and I am annoyed because strong is not what I was aiming for.',
        'I built a garment that works and walked it well and the result is good, and good from a fashion queen is a word she uses when she does not want to say disappointed.',
        'The proportions are right and the silhouette reads and the execution is solid, and I will take it, and I wish I did not have to settle for taking it.',
      ]),
      tier('fine', 'It is a look. That is the most she will say for it.', [
        'It is a look — a finished, constructed, presentable look — and that is the most I will say for it, because saying more would be lying.',
        'The garment exists and it walks and it does not fall apart, and that is the review I am giving it, because I know what I am capable of and this is not it.',
        'I am wearing something I made and it is adequate and the adequacy of it is the thing I am going to think about tonight when I take it off.',
        'I know the look is fine in the way a garment is fine when I did not have the time or the vision to make it interesting.',
      ]),
      tier('weak', 'A taste failure, diagnosed in real time by the person who made it.', [
        'The proportions are wrong and I know they are wrong because I can see them while I am walking, and the diagnosis is arriving in real time and it is not kind.',
        'I made a taste decision and the decision was bad and I can see it on my body while the panel sees it from the front, and we are all arriving at the same conclusion.',
        'The look is a failure and I am the most qualified person in the room to say so, because I know what I was trying to do and I can see how far from it I landed.',
        'The line is off, the weight is wrong, and I built this myself, which means the mistake is mine in a way a bought garment never is.',
      ]),
      tier('disaster', 'She knew before she left the room and wore it anyway.', [
        'I knew before I left the werk room that this look was wrong, and I wore it anyway because the alternative was wearing nothing, and I am not sure nothing would have been worse.',
        'The look is bad — genuinely bad, taste-failure bad — and I diagnosed it in the mirror and walked it out anyway, and the panel is seeing exactly what I saw.',
        'I knew. I knew in the workroom, I knew in the hallway, I knew at the curtain, and I am walking it knowing, which is the particular punishment of having taste and no time.',
        'A fashion queen walking a bad look is a fashion queen who failed at the only thing she is supposed to be good at, and I am walking it out in front of people who know that.',
      ]),
    ]),
  voice('camp',
    'On purpose. Every stupid inch of it on purpose, and the joy is in the '
    + 'commitment. Would rather be enormous and wrong than small and correct.', [
      tier('stunning', 'Ridiculous, total, and the room goes with her.', [
        'I went all the way and the room came with me — every absurd detail, every oversized choice, every inch of this that a tasteful queen would have cut, and they are all in.',
        'The commitment paid off and I can hear it — the panel is not just amused, they are delighted, and delighted is the sound of camp landing exactly where it should.',
        'I built the most ridiculous version of myself I could, and the room is responding to the ridiculous with the kind of joy that proves I was right to commit.',
        'I gave them everything and everything is too much and too much is the point, and the panel gets it — not polite amusement, actual joy.',
      ]),
      tier('strong', 'Big and committed and it lands.', [
        'It is big and it is committed and it is landing, and I can feel the room going along with the choices even if they are not losing their minds over them.',
        'The camp is reading — the proportions are absurd, the details are deliberate, and the panel sees that I meant every inch of it.',
        'I built something ridiculous and walked it like I built something ridiculous, and the reaction tells me the commitment is visible even if the gag is not transcendent.',
        'I can feel the look doing what camp does when it works — it is too much, obviously too much, and the room is enjoying it without needing to be told to.',
      ]),
      tier('fine', 'They are amused. She was going for something louder than amused.', [
        'They are amused, which is the word I was afraid of — amused means they see the camp and they appreciate the camp and the camp did not move them.',
        'I wanted a scream and I got a chuckle, and for a camp queen the difference between those two sounds is the difference between the top and the middle.',
        'I put the commitment in and the construction is there and the panel is smiling politely, which is the worst possible reaction to something I built to be absurd.',
        'I went big and they went mild, and I can feel the gap between the reaction I designed for and the reaction I am actually getting.',
      ]),
      tier('weak', 'Committed to something the room does not want to go along with.', [
        'I committed fully to a choice the room does not want to go along with, and the commitment is now the problem, because I cannot dial it back mid-walk.',
        'The look is too much in a way that is not landing as too-much-on-purpose, and I can feel the panel deciding whether I knew what I was doing.',
        'I went all the way and the room did not follow, and the distance between where I am and where they are is visible and getting wider.',
        'The camp is reading as mess rather than as camp, and the distinction is everything, and I am on the wrong side of it tonight.',
      ]),
      tier('disaster', 'The commitment is the problem and there is no dialling it back mid-walk.', [
        'The commitment is the whole problem — I went all in on something that did not work, and the all-in part means there is no version of this walk that recovers.',
        'I am wearing a joke that is not funny, at a volume that cannot be lowered, on a stage that does not let me stop and explain.',
        'The look is a disaster and the disaster is made worse by the fact that every detail was a choice, which means I chose this, all of it, on purpose.',
        'I built the most I could build and wore the most I could wear and the result is the most visible failure on the runway tonight, and every inch of it was intentional.',
      ]),
    ]),
  voice('club-kid',
    'Nightlife, not theatre. Silhouette over sewing, nerve over finish, and a '
    + 'suspicion that this panel is not the room her drag was made for.', [
      tier('stunning', 'The shape does what it does in a dark room, in the light, in front of them.', [
        'I can feel the shape doing what it does at three in the morning in a room with no lights, except tonight it is doing it under stage lighting, in front of a panel, and it still works.',
        'I built this for a room the panel has never been in, and the fact that it translates to this stage is the victory — the silhouette, the nerve, all of it, reading.',
        'I made this look for darkness and it is working in the light, which is the riskiest thing I can attempt, and tonight the risk paid.',
        'I can feel the shape landing the way it lands in the venue I built it for, except this time the people watching can actually see it, and they like what they see.',
      ]),
      tier('strong', 'It reads, and reading was the risk.', [
        'I can feel it reading, and reading was the whole risk — my nightlife drag under panel lights is a translation that can fail, and tonight the translation held.',
        'The look is landing and the panel is following the silhouette, which means the thing I do in the dark is legible in the light, which is all I was hoping for.',
        'The shape works and the nerve is there and the walk reads as intentional rather than unfinished, which is the line my drag walks every time it leaves the club.',
        'I can see the panel seeing it — not perfectly, not the way a dark room sees it, but enough to know the look is communicating what I built it to communicate.',
      ]),
      tier('fine', 'Legible. Safe. Not why she does this.', [
        'The look is legible and safe, and safe is not why I do this — I do this for the moment a silhouette changes how a room feels, and tonight the room feels nothing.',
        'They can see it and they understand it and it is not moving them, and the difference between understood and felt is the whole point of my drag.',
        'I walked something legible and got a legible response, and for a queen who built her whole career on the moment the room shifts, legible is the loneliest word.',
        'The look reads as a look, which is all a panel needs, and it is not enough for me, because I did not come here to be understood — I came here to be felt.',
      ]),
      tier('weak', 'Under these lights it looks like what it is made of.', [
        'Under these lights my look is showing its construction, and in a dark room the construction is invisible, and on this stage it is the only thing anybody can see.',
        'The silhouette that works at midnight looks like craft supplies under panel lights, and I can feel the gap between the idea and the execution widening with every step.',
        'I built this for a room that forgives, and this stage does not forgive, and the result is that every seam and every shortcut is visible and telling.',
        'The look is translating badly — the thing I see when I wear it is not the thing the panel sees when I walk it — and the lights are the problem and also the truth.',
      ]),
      tier('disaster', 'They do not get it, and she is not sure that is entirely their fault.', [
        'They do not get it, and I am not sure that is entirely their fault — the look that works in my world does not work in this room, and the room is not wrong.',
        'The panel is looking at me like I walked out in my underwear, and the worst part is that they might be right, because the context that makes this drag work is not in this room.',
        'I built something for a room that does not exist here, and the walk is proving it — the look reads as unfinished rather than intentional, and I cannot fix that from the runway.',
        'Nobody understands what I am wearing and the silence is the sound of an idea that needed a venue I did not bring with me.',
      ]),
    ]),
  voice('spooky',
    'Horror, ritual, the uncanny. Slow and deliberate; she is building a '
    + 'feeling rather than presenting a garment, and the feeling can fail.', [
      tier('stunning', 'The temperature of the room actually changes.', [
        'I can feel the room change — not a gasp, not a laugh, something lower and slower — and the look is doing what it was built to do, which is make the air different.',
        'The walk is slow and the face is deliberate and the thing I am building is not a look, it is a feeling, and tonight the feeling arrived.',
        'I can hear that nobody is cheering and nobody should be — the silence from the panel is the compliment, and the fact that they are not sure whether to be impressed or unsettled is my whole point.',
        'I am building an atmosphere rather than presenting a garment, and the atmosphere has landed — the room is quieter than it was when I walked out, and quieter is the win.',
      ]),
      tier('strong', 'Unsettling and controlled. She holds it the whole way.', [
        'The walk is controlled and the face is holding and the feeling I am building is sustained from the curtain to the mark, which is everything I was aiming for.',
        'The look is landing as unsettling rather than costume, and that distinction is the one thing I care about tonight — unsettling is a mood, costume is a purchase.',
        'I held the character the whole walk and the panel is sitting with it, and sitting with it is the reaction I wanted — not a scream, not a laugh, a sustained discomfort.',
        'The dread is reading and I can feel it reading, and the walk was slow enough and controlled enough that nobody had to ask what I was doing.',
      ]),
      tier('fine', 'Atmospheric enough. Nobody is frightened.', [
        'The atmosphere is there, barely, and nobody is frightened, which means I built a mood that did not quite commit enough to land.',
        'I can tell the look reads as dark and the walk reads as intentional and the result is atmospheric without being affecting, which is another way of saying I did not pull it off.',
        'I wanted dread and I got aesthetic, and the gap between those two words is the gap between a great night and a forgettable one.',
        'I know my face is doing something and the silhouette is doing something and neither of them is doing enough, and the room is appreciating the effort without feeling the result.',
      ]),
      tier('weak', 'Costume, not dread, and the difference is everything.', [
        'I can see the look reads as costume, not as dread, and the difference is everything — a costume is something I put on, and dread is something I become.',
        'I built something dark and walked it darkly and it is reading as dress-up, which is the specific failure of a spooky queen who did not commit hard enough tonight.',
        'The face is painted and the walk is slow and the panel is seeing a garment rather than a feeling, which means every intentional choice I made is invisible.',
        'I can feel it reading as a look rather than an experience, and my walk reading as a look means I have failed at the only thing my drag is supposed to do.',
      ]),
      tier('disaster', 'It reads as funny, which is the one thing it must not do.', [
        'It is reading as funny, which is the single worst outcome for a queen who built something intended to frighten — funny means I failed so completely the failure is entertaining.',
        'I can hear a laugh from the panel and the laugh is not with me, it is at the distance between what I intended and what they are seeing, and that distance is enormous.',
        'The look is supposed to be frightening and it is amusing, and the amusement is the cruelest possible response to something I built with absolute seriousness.',
        'I walked out trying to build dread and I am getting laughter, and a spooky queen who is accidentally camp is a queen who has lost control of her own drag.',
      ]),
    ]),
  voice('broadway',
    'Theatre-trained, projects to the back row, thinks in acts. The walk has '
    + 'a beginning and an ending and she has rehearsed the ending.', [
      tier('stunning', 'She plays the room and the room plays back.', [
        'I am playing the room and the room is playing back — the entrance has a beat, the turn has a beat, and the ending I rehearsed is landing exactly where I put it.',
        'I gave the walk a beginning, a middle and an ending, and all three are working, and the panel is watching it the way an audience watches a scene.',
        'I can feel the room responding to the pacing — the slow build, the held moment, the final beat — and the response tells me the staging is reading as intention.',
        'Every beat is hitting and the staging is clean and the walk has the structure of a scene, which is what I do with a runway whether the runway asked for it or not.',
      ]),
      tier('strong', 'A performance, delivered. The technique holds.', [
        'I delivered the performance and the technique held — the entrance worked, the turn worked, and the whole thing read as intentional.',
        'I performed the walk and the performance landed — not transcendent, not historic, but solid and staged and delivered the way I was trained to deliver it.',
        'I made the stagecraft visible and the pacing clean, and the panel saw a queen who knows how to use a stage, which tonight was enough for me.',
        'I hit my marks and I held my moments and the walk read as rehearsed in the way that means professional, not in the way that means stiff.',
      ]),
      tier('fine', 'Competent stagecraft with nothing behind it tonight.', [
        'The technique is there and nothing is behind it — I hit every mark and held every beat and the whole thing felt like staging without a performance attached.',
        'I performed the walk competently and the competence is all there is tonight, which for a queen who lives on a stage is an admission.',
        'I got the pacing right and the staging clean and the energy is absent, and without the energy the whole thing is a demonstration rather than a moment.',
        'The walk has structure and the structure is empty, and I can feel the difference between performing and going through the motions tonight.',
      ]),
      tier('weak', 'Too big for the room, and she can hear that it is too big.', [
        'I am projecting to a back row that does not exist and the panel is right there, and everything I am doing is too big for the distance between us.',
        'I know my performance is oversized — the gestures, the pacing, the held moments — and the panel is close enough to see the effort rather than the effect.',
        'I am doing too much and I can hear it, and the instinct that makes me fill a theatre is filling this runway past the point where it reads as natural.',
        'I can feel the technique showing as technique rather than as presence, and the difference is that my effort at the wrong scale looks like it is trying too hard.',
      ]),
      tier('disaster', 'The ending she rehearsed does not survive contact with the runway.', [
        'The ending I rehearsed did not survive contact with the stage — the timing is off, the beat is gone, and the whole walk unravelled from the entrance.',
        'I had a plan and the plan fell apart the moment I walked out, and everything after that is a performer trying to recover a moment that already passed.',
        'I felt the stagecraft collapse and the technique did not save me, and the walk that was supposed to be a performance is just me in a garment with nothing to say.',
        'I lost the room at the first beat and spent the rest of the walk trying to get it back, and every attempt made the distance worse.',
      ]),
    ]),
  voice('dancer',
    'It is a body and it moves. The look exists to be moved in and she is '
    + 'impatient with anything that restricts her.', [
      tier('stunning', 'The movement is the look and she has never been more certain of anything.', [
        'The movement is the look — every step, every turn, every moment the body does something the garment was built to let it do — and I have never been more certain of a walk.',
        'I am moving and the garment is moving with me and the whole thing is one conversation between my body and the construction, and the panel is watching both sides of it.',
        'The walk is alive tonight — the energy is in my legs and my arms and the way the look responds to being moved — and the panel is seeing what happens when a garment is worn by a body that uses it.',
        'I built this to be moved in and tonight I am moving in it, and the result is the walk I have been trying to walk all season — fluid, physical, entirely mine.',
      ]),
      tier('strong', 'She moves well and the garment lets her.', [
        'I am moving well and the garment is letting me, which is all I asked for tonight — freedom, fluidity, and enough room to put my body into the walk.',
        'The look works because it moves — it was built to be walked hard and I am walking it hard, and the panel can see the difference between a queen standing in a dress and a queen using one.',
        'The body is doing what it does and the construction is not fighting me, and a dancer in a garment that cooperates is a dancer having a good night.',
        'I moved well tonight — the turn, the walk, the way my body filled the look — and the result reads as a queen who is comfortable in motion, which I am.',
      ]),
      tier('fine', 'A walk. She wanted somewhere to put the energy and there was nowhere.', [
        'It is a walk, and I wanted somewhere to put the energy and the garment did not give me anywhere, so I walked it like everybody else walks it.',
        'I had energy for tonight and the look absorbed it — no room to move, no room to perform, just a walk from one end to the other like any other queen.',
        'The body wanted to do something and the construction said no, and the result is a competent walk that could have been anybody, which for me is a failure.',
        'I walked the runway like a model instead of a dancer, and the difference is that a model stands in a garment and I need to live in one, and tonight I could not.',
      ]),
      tier('weak', 'The construction is fighting her and it wins.', [
        'The construction is fighting my body and the construction is winning — every step is a negotiation with a garment that was not built for the way I move.',
        'I cannot move the way I need to move and the restriction is visible — the walk is stiff, the turns are careful, and the panel is watching a dancer being defeated by a dress.',
        'The look is wearing me instead of the other way around, and a dancer being worn by a garment is a dancer having the worst possible night.',
        'Every step is a compromise between what my body wants to do and what the construction will allow, and the compromise is making both of them look bad.',
      ]),
      tier('disaster', 'She cannot move in it, and standing still is not a skill she has.', [
        'I cannot move in this and standing still is not a skill I have — my body does not know what to do when it is not allowed to move, and the walk is showing that.',
        'The garment has locked me into a walk I do not know how to do — slow, careful, contained — and the panel is watching a dancer try to be a mannequin and fail at both.',
        'I am frozen in something I built wrong, and a dancer who cannot move is not a dancer, and what is left is a queen with no idea what to do with her hands.',
        'The construction has turned my body into a liability — every step is wrong, every turn is dangerous, and the energy I normally bring is trapped inside a garment that cannot hold it.',
      ]),
    ]),
  voice('glamour',
    'Beauty as the entire argument. Face, hair, silhouette, light. No concept '
    + 'is needed because she IS the concept, which is either true tonight or it is not.', [
      tier('stunning', 'Beautiful, and beautiful is enough when it is this beautiful.', [
        'I am beautiful tonight and I do not need to be anything else — the face is right, the silhouette is right, and the light is doing what light does when it has something worth hitting.',
        'The look is working because I am working, and beauty is not passive — it is a skill, and tonight the skill is landing the way I spent years learning to make it land.',
        'Everything is where it should be — the mug, the proportion, the way I am wearing the light — and the panel is looking at me the way I need them to look at me.',
        'The beauty is the argument and the argument is enough tonight, and I can feel the panel seeing a woman who is exactly what she intended to be.',
      ]),
      tier('strong', 'She looks expensive and she knows how to be looked at.', [
        'I look expensive and I know how to be looked at, and that combination is carrying me tonight — the mug is clean, the proportions are right, and the walk reads as money.',
        'The look is strong and the beauty is holding, and I will take a night where the face and the silhouette do their job and nothing falls apart.',
        'I am giving them beauty and they are taking it, and the transaction is clean and professional and exactly what a glamour queen should deliver on a good night.',
        'The presentation is polished and the beauty reads from the front row, and I am walking it the way I walk everything — with the confidence of a woman who knows she is being watched.',
      ]),
      tier('fine', 'Pretty. Pretty is the faintest praise on this stage.', [
        'I am pretty tonight, and pretty is the faintest praise this stage offers — it means I showed up and my face was done and nobody gasped.',
        'I know the beauty is there, technically, and nobody is moved by it, and the distance between pretty and stunning is the distance between noticed and remembered.',
        'I look fine and fine is the word that haunts a glamour queen — it means the face is clean and the walk is smooth and neither of them is doing anything.',
        'I know my mug is right and my body is right and the result is pleasant, and pleasant from me is the same as forgettable.',
      ]),
      tier('weak', 'The face is doing all the work and it cannot carry it alone.', [
        'I can feel my face doing all the work and the face cannot carry it alone tonight — the mug is right but the silhouette is wrong, and the imbalance shows.',
        'I am relying on beauty to save a walk that the beauty cannot save, because beauty needs a frame and the frame tonight is not holding.',
        'The mug is the only thing working and I can feel the panel looking past it to the garment, which is where the problem is.',
        'My face is beautiful and my walk is not, and a glamour queen whose body cannot sell what her face is promising is a queen in trouble.',
      ]),
      tier('disaster', 'The one thing she sells did not turn up tonight.', [
        'The one thing I sell did not show up tonight — the beauty is not there, the mug is off, and without it I have nothing, because beauty was the whole act.',
        'I built my entire drag on being beautiful and tonight I am not, and there is no plan B because I never needed one before.',
        'I know my face is wrong and my body is wrong and the walk is wrong, and a glamour queen having a bad beauty night is a queen with no other trick to pull.',
        'I am supposed to be the most beautiful queen on this stage and I am not even close tonight, and the absence of the one thing I do is louder than anything else.',
      ]),
    ]),
  voice('art',
    'Conceptual, difficult, uninterested in being liked. If it has to be '
    + 'explained she will explain it, and she resents having to.', [
      tier('stunning', 'The idea arrives whole and lands without a word of explanation.', [
        'I walked an idea out whole — no explanation, no caption, no footnote — and I can see the panel sitting with it the way they sit with something they cannot dismiss.',
        'I walked out an argument and the argument landed without a single word of setup, which is the only victory an art queen recognises.',
        'The concept is reading and I did not have to explain it, and the moment a difficult idea communicates on its own is the moment I live for.',
        'The look says what I built it to say and the panel heard it, and the silence is not confusion, it is the silence of people deciding what they think, which is all I wanted.',
      ]),
      tier('strong', 'Difficult, and they follow her anyway.', [
        'It is difficult and they followed me anyway, which is the best version of a night where the look asks the room to do some work.',
        'The concept is not obvious and the panel went with it, and getting a difficult idea through to a room that did not have to go along with it is a win I will take.',
        'I walked something hard and the panel tracked it, and for a queen who makes conceptual drag, being tracked is the victory — not being adored, being understood.',
        'I put the idea in the room and the room is sitting with it, and sitting with it means it worked, even if the reaction is not the gasp a pretty gown gets.',
      ]),
      tier('fine', 'They see a garment. She made an argument.', [
        'They see a garment and I made an argument, and the gap between those two readings is the gap that defines every walk I do.',
        'I know the concept is in there but the panel is looking at the surface, and a concept that does not survive surface-reading needed me to execute it better.',
        'I built an idea and they saw a dress, and the distance between idea and dress is the distance between what I intended and what I delivered tonight.',
        'I can see the panel appreciating the construction and missing the concept, which means my concept was not strong enough to survive being worn.',
      ]),
      tier('weak', 'The concept did not survive being made out of fabric.', [
        'The concept did not survive being made out of fabric — the idea was clear in my head and unclear on my body, and the translation failed.',
        'I had an argument and the garment did not make it, and the panel is seeing the failure of the execution rather than the ambition of the idea.',
        'The idea is dying somewhere between the construction and the presentation, and I can feel it dying, and a queen whose ideas do not read is a queen whose ideas do not exist.',
        'I built something conceptual and it reads as confusing, which is not the same thing, and the difference is the gap between an artist and a mess.',
      ]),
      tier('disaster', 'Nobody can tell what it is, and you had to be there is not available on a runway.', [
        'Nobody can tell what I am wearing or why, and the explanation I have is too long for a runway and too late for the panel, who have already decided.',
        'I walked out something whose concept is invisible and whose execution is baffling, and the whole walk is the sound of my idea needing a gallery wall and getting a runway instead.',
        'I built something only I understand, and a runway is not a context where understanding is optional — it is the whole transaction, and the transaction failed.',
        'The look is illegible and I am walking it knowing it is illegible, and the worst part is that the idea was good, and good does not matter when nobody can see it.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 3 — HER NERVE. One closing sentence per archetype group.
// ══════════════════════════════════════════════════════════════════════
//
// Five groups rather than fifteen archetypes, because fifteen would be four
// hundred lines for a distinction the reader cannot hear: a mastermind and a
// schemer walking a bad runway have the same thought.
//
// READ THE CONSTRAINT AT THE TOP OF THIS FILE BEFORE WRITING THESE. A swagger
// line lands after a voice line it has never seen, so it may not name the
// garment, the fabric, the colour, the concept or the category. It knows one
// thing and one thing only: how the walk went.
//
// Still first person. Still one to two sentences — this is the button on the
// paragraph, not a second paragraph.

const swagger = (group, note, tiers) => ({ group, note, tiers });

export const RUNWAY_SWAGGER = [
  swagger('predator',
    'villain, mastermind, schemer. Reads the runway as a move in a longer '
    + 'game. Notices who is watching, and what tonight buys her next week.', [
      tier('stunning', 'A win she intends to spend.', [
        'I am going to spend this, and by tomorrow every queen in that room is going to know tonight bought me something.',
        'That just moved me up the board, and I am already planning what I do with the breathing room.',
        'I can feel the power shift and I intend to use it before anybody else works out what just happened.',
        'This bought me at least a week of safety, and safety is currency, and I know exactly where to spend it.',
      ]),
      tier('strong', 'Banked. Not the point of the evening, but banked.', [
        'Banked. Not the win, not the story, but one more night where nobody is looking at me for the wrong reasons.',
        'That is a solid night, and solid nights accumulate, and I am counting.',
        'Not the headline, but the headline is not always where the power is. I will take a quiet night the panel forgets.',
        'A clean score I can put away and use later when somebody else is falling apart.',
      ]),
      tier('fine', 'Invisible tonight, which has its uses and she says so.', [
        'Invisible tonight, and I am fine with invisible — invisible means nobody is looking at me while I look at everybody else.',
        'The middle of the pack is the safest place to scheme from, and I am scheming.',
        'Nobody is thinking about me right now, which is exactly where I want to be while I think about them.',
        'I will take forgettable. Forgettable tonight means I am still here tomorrow, and tomorrow is what I am playing for.',
      ]),
      tier('weak', 'Recalculating, out loud, before she has left the stage.', [
        'I am recalculating before I have left the stage — who is safe, who is exposed, and what this costs me by the end of the week.',
        'That was bad, and the bad part is not the walk, the bad part is what the walk just did to my position.',
        'I need to make a move before this night finishes deciding things I do not want decided, and the move is forming while I am still walking.',
        'The damage is done and the question is containment — who noticed, who cares, and who I can redirect by morning.',
      ]),
      tier('disaster', 'She is already deciding who this gets blamed on.', [
        'Somebody is going to eat this night for me. I am already deciding who.',
        'The walk is over and I am already in the next conversation, the one where this becomes somebody else\'s problem.',
        'I have had worse nights and survived them by making sure the panel was looking at another queen, and tonight is no different.',
        'I know this is a disaster, and my disaster plan is the same as it always is: make sure when the panel looks for somebody to send home, they are looking at somebody else.',
      ]),
    ]),
  swagger('sunshine',
    'hero, loyal-soldier, social-butterfly, showmancer. Generous, and means '
    + 'it. Thinks about the room and the girls in it as much as her own night.', [
      tier('stunning', 'Delighted, and slightly embarrassed to be delighted.', [
        'I am so happy right now and I am trying not to show it too hard, because the girls are right there and some of them are not having this kind of night.',
        'That felt amazing and I want to be cool about it, but I am not cool, and the grin is already on my face.',
        'I am delighted and slightly embarrassed to be this delighted, because the joy is real and the room is watching and some of them needed tonight more.',
        'I want to scream and I am not going to, but the smile is doing all the screaming for me.',
      ]),
      tier('strong', 'Happy with it and happy to say so.', [
        'I am happy with that, genuinely, and I am going to say so, because a good night should be enjoyed and I am enjoying it.',
        'That was a good walk and I feel good and I am not going to pretend I do not — the girls will understand.',
        'A solid night, and I am glad, and I am going to let myself be glad without apologising for it.',
        'I am smiling because it went well and I am allowed to smile when things go well.',
      ]),
      tier('fine', 'Fine is fine. Somebody else needed tonight more.', [
        'Fine is fine. I am safe, the girls who needed a big night got one, and I will take a quiet week.',
        'Somewhere in the middle, which is not where I wanted to be, but the queens who are struggling need the panel\'s attention more than I do.',
        'It was okay. I am okay with okay. The girls on the ends are the ones feeling something right now, and I will check on them later.',
        'Not my best night, not my worst, and I would rather be here than at either end of the table where it actually matters.',
      ]),
      tier('weak', 'Disappointed in herself and refusing to be a burden about it.', [
        'I am disappointed but I am not going to make it anybody else\'s problem — the girls have their own walks to think about.',
        'That was not good enough and I know it, and I am going to sit with that quietly, because the last thing this room needs is me falling apart.',
        'I let myself down tonight and the feeling is heavy, but I will carry it alone — the other queens do not need my energy on top of their own.',
        'I am upset and I am choosing not to show it, because the girls who did well deserve their moment and I am not going to take it.',
      ]),
      tier('disaster', 'Holding it together for everybody else, which is its own exhaustion.', [
        'I am holding it together because somebody has to, and the fact that the person holding it together is the one falling apart is something I will deal with later.',
        'I want to cry and I am not going to, because the room has enough emotion in it and adding mine would make it worse.',
        'The girls are watching and I am going to be okay in front of them even if I am not okay, because that is what I do.',
        'I am smiling and the smile is a decision, and behind the decision is a night I am going to have to process alone.',
      ]),
    ]),
  swagger('firecracker',
    'hothead, chaos-agent, wildcard. Feels it immediately and entirely. No '
    + 'distance between what happened and what she thinks about it.', [
      tier('stunning', 'Euphoric and completely without composure about it.', [
        'I am losing my mind right now and I do not care who sees it — that was the best I have ever felt on a stage and the feeling is all over my face.',
        'I cannot keep it together and I am not trying to — the walk was everything, and the adrenaline is hitting me like a wall.',
        'I am shaking, actually shaking, because that was it, that was the night, and the high is so big I cannot stand still.',
        'I want to run back out there and do it again, right now, and the fact that I cannot is the only thing stopping me from losing it completely.',
      ]),
      tier('strong', 'Buzzing. Wants to do it again immediately.', [
        'I am buzzing and I want to go again — the energy is still in my body and there is nowhere to put it and I love this feeling.',
        'That was fun and I am still in it and I want to walk that runway one more time before the high goes away.',
        'The adrenaline is still going and I am feeding off it and the night is not over and I am already restless.',
        'I feel electric right now and the walk was good and I want more of this — more stage, more lights, more of whatever just happened.',
      ]),
      tier('fine', 'Bored by her own walk, which is the worst thing that could have happened.', [
        'I am bored by my own walk, which is the worst possible outcome for somebody who needs to feel something to function.',
        'Nothing happened out there, emotionally, and I am a queen who runs on emotion, and a night where I feel nothing is worse than a night where I fail.',
        'I did not feel it tonight and the walk shows it and the boredom is eating me alive because I came here to burn, not to coast.',
        'The walk was fine and the feeling is flat and flat is the one thing I cannot survive, because my whole drag is about the high.',
      ]),
      tier('weak', 'Furious, and not with herself.', [
        'I am furious and I am not even sure at who yet, but the fury is here and it is looking for somewhere to land.',
        'Something went wrong and I am angry about it and the anger is not directed inward, which means it is about to be directed somewhere else.',
        'I want to throw something and I am going to redirect that energy before it becomes somebody else\'s problem, but right now it is very loud in my head.',
        'I am seething and the seething is going to come out, and the question is not whether it comes out but when and at who.',
      ]),
      tier('disaster', 'Detonating internally, and the internally part will not last.', [
        'I am about to explode and the only thing keeping me together is the fact that the cameras are still rolling.',
        'I can feel the detonation happening and the internally part has about thirty seconds before it becomes externally.',
        'I am going to lose it, fully, and the countdown started the moment I finished that walk, and there is not enough composure in my body to stop it.',
        'I am holding a scream behind my teeth and the scream is winning and the backstage is about to find out what that sounds like.',
      ]),
    ]),
  swagger('professional',
    'challenge-beast, perceptive-player. Assesses. Knows where she probably '
    + 'landed before the panel opens its mouth, and is usually right.', [
      tier('stunning', 'Notes the result and moves on. There is a critique to survive.', [
        'I know where I landed and I am already thinking about critique — the walk was strong, the result is clear, and there is still a panel to face.',
        'Good. Noted. There is a critique coming and the critique is the part that matters, so I am not celebrating until the scoring is done.',
        'The walk went well and I registered that and moved on, because the night is not over and a strong runway means nothing if the critique goes sideways.',
        'I am satisfied with the result and I am putting the satisfaction away, because what comes next requires focus, not feelings.',
      ]),
      tier('strong', 'Where she expected to be. That is the job.', [
        'Where I expected to be, which is where I should be, which is the job done.',
        'I predicted this placement before I walked and I was right, and being right is the only satisfaction I need from tonight.',
        'That is exactly where I thought I would land, and landing where I think I will land is the whole skill.',
        'A predictable result from a predictable performance, and I am fine with predictable because predictable means I understand the game.',
      ]),
      tier('fine', 'Middle of the pack, correctly identified, mildly annoying.', [
        'Middle of the field, which I called before the walk started, and being right about a mediocre night is its own specific irritation.',
        'I knew this was a middle-of-the-room walk and I was correct, and the correctness does not make the result less annoying.',
        'Average night, accurately assessed, mildly irritating. I can diagnose it and I can fix it and tonight is data.',
        'I landed exactly where I thought I would and exactly where I did not want to, and both of those things are useful information.',
      ]),
      tier('weak', 'Diagnosing the error while still walking, so it does not happen twice.', [
        'I am diagnosing the error while I am still on the stage, because this mistake has a name and if I can name it I can fix it.',
        'I know what went wrong and I am filing it so it does not happen again — the mistake was specific, identifiable, and correctable.',
        'The analysis is already running — what broke, when it broke, what I should have done instead — and by the time I reach the back of the stage I will have the answer.',
        'Something failed and I can see what it was and I am already rebuilding the approach, because a failure I understand is a failure that dies tonight.',
      ]),
      tier('disaster', 'A failure she can name precisely, which does not help at all.', [
        'I can name every single thing that went wrong and the naming does not help at all, because knowing what happened is not the same as not having let it happen.',
        'I know precisely what failed and precisely when and precisely why, and the precision is not a comfort — it is a record of a disaster I saw coming and could not stop.',
        'I have the diagnosis and it does not matter, because the walk already happened and me understanding it does not undo it.',
        'I can explain this failure in detail and the detail makes it worse, because a queen who can see exactly what she did wrong and still did it wrong has a problem the analysis cannot fix.',
      ]),
    ]),
  swagger('scrapper',
    'underdog, goat, floater. Did not expect to be here and has not stopped '
    + 'noticing. Every good night is a surprise and every bad one is a confirmation.', [
      tier('stunning', 'Astonished by herself, and daring anybody to take it off her.', [
        'I just did that, and I have no idea how, and I am daring anybody in this room to tell me it does not count.',
        'I was not supposed to have a night like this and I am having one, and the shock is still on my face and I do not care.',
        'I am astonished by myself right now, genuinely astonished, and the astonishment feels like the beginning of something I have been waiting for.',
        'That was mine and I earned it and I am holding onto it with both hands because a queen like me does not get nights like this often.',
      ]),
      tier('strong', 'Waiting for somebody to tell her it does not count.', [
        'It went well and I am waiting for somebody to tell me it does not count, because that is what I am used to.',
        'I am happy and I am suspicious of the happiness, because the last time I felt this good about a walk somebody told me it was not as good as I thought.',
        'A good night, and the voice in my head is already asking what the catch is, because there is always a catch for a queen like me.',
        'The walk was strong and I know it was strong and I still cannot quite believe it was strong, because believing good things is not a skill I have practised.',
      ]),
      tier('fine', 'Survived another one. That was the entire ambition.', [
        'I survived another one and that was the entire ambition, and the ambition was met, and I am going to take the win even if the win is just still being here.',
        'Another week, another walk, another night where I was not the worst, and for me that is the goal and I hit it.',
        'I am still standing and the walk is done and nobody is looking at me, which is exactly where I want to be — invisible and safe.',
        'Not great, not terrible, and I will take it with both hands because a quiet night is a surviving night and surviving is the whole game.',
      ]),
      tier('weak', 'The thing she was afraid of, happening on schedule.', [
        'This is the thing I was afraid of, happening on the schedule I expected it to happen on, and the only surprise is that it took this long.',
        'I knew this night was coming and here it is, right on time, and the preparation does not make it hurt less.',
        'I predicted this and I was right, and being right about my own failure is the specific punishment of a queen who knows exactly where she stands.',
        'The bad night arrived, the one I have been bracing for since the first week, and it is exactly as bad as I thought it would be.',
      ]),
      tier('disaster', 'Confirmation. She had a whole speech ready for this and no need to give it.', [
        'Confirmation. I had a whole speech ready for this — the gracious one, the grateful one — and I do not even need to give it because the walk said everything.',
        'I knew this was going to happen and I prepared for it and the preparation was wasted because there is no preparing for how it actually feels.',
        'This is the night I have been expecting since I walked through the door, and it is here, and I am too tired to be surprised.',
        'I knew I did not belong here and the runway just proved it, and the proof is exactly as crushing as I imagined it would be during every night I spent worrying about it.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a queen into a voice
// ══════════════════════════════════════════════════════════════════════

/**
 * Which swagger group an archetype belongs to.
 *
 * Every one of the fifteen archetypes is mapped. An unknown one — a roster
 * entry from before this show, a typo, a future archetype — falls to
 * `scrapper`, which is the most neutral of the five and the only one whose
 * lines assume nothing about how the season has gone for her.
 */
export const SWAGGER_BY_ARCHETYPE = {
  villain: 'predator', mastermind: 'predator', schemer: 'predator',
  hero: 'sunshine', 'loyal-soldier': 'sunshine',
  'social-butterfly': 'sunshine', showmancer: 'sunshine',
  hothead: 'firecracker', 'chaos-agent': 'firecracker', wildcard: 'firecracker',
  'challenge-beast': 'professional', 'perceptive-player': 'professional',
  underdog: 'scrapper', goat: 'scrapper', floater: 'scrapper',
};

export const SWAGGER_GROUPS = [...new Set(Object.values(SWAGGER_BY_ARCHETYPE))];

export function swaggerGroupFor(archetype) {
  return SWAGGER_BY_ARCHETYPE[archetype] || 'scrapper';
}

/**
 * Which theme family a category belongs to.
 *
 * Every label in js/dr/data/runways.js is mapped. ANYTHING ELSE FALLS TO
 * `open`, and a great many things are anything else: a week with no authored
 * category gets "<Challenge name> eleganza", a Ball generates its own three
 * walks, and an author may pin a one-off. `open` is written to be honest
 * about that — it describes the making and the wearing and assumes nothing
 * about what the prompt meant.
 */
export const THEME_BY_CATEGORY = {
  'Night of a Thousand Ghouls': 'haunted',
  'Creatures of the Deep': 'haunted',
  'Leather and Lace': 'haunted',
  'Pageant Perfection': 'pageant',
  'Black and White Ball': 'pageant',
  'Something Borrowed': 'pageant',
  'Structure and Silhouette': 'structure',
  'The Colour Wheel': 'structure',
  'Feathers and Fringe': 'spectacle',
  Showgirl: 'spectacle',
  'Curtain Up': 'spectacle',
  'Club Kid Couture': 'nightlife',
  'Bodysuit Realness': 'nightlife',
  'Denim and Diamonds': 'nightlife',
  'Cartoon Come to Life': 'cartoon',
  'Two Looks in One': 'cartoon',
  'Hometown Pride': 'personal',
  'Bring Back My Girls': 'personal',
  'Best Drag': 'personal',
  'Category Is: You': 'personal',
};

export function themeFamilyFor(category) {
  return THEME_BY_CATEGORY[category] || 'open';
}

/**
 * Her relationship to tonight's prompt.
 *
 * READ FROM THE CATEGORY, NOT FROM THE SCORE'S `fit`, and the difference is
 * the whole reason `clashes` was added to js/dr/data/runways.js.
 *
 * `runwayScore` records fit as 1, 0.5 or 0 — and 0 means "her style is not on
 * this category's list", which for a prompt naming two styles out of ten is
 * eight queens in ten. Dumping an episode and reading it is what showed what
 * that does to the prose: the off-theme paragraph fired for eight of ten
 * walks and printed verbatim three times in one runway, because a four-variant
 * tier cannot cover eight queens. "Not her wheelhouse" and "fighting the
 * prompt" were the same number and they are not the same sentence.
 *
 * So the narration reads the two authored lists directly: `styles` is home,
 * `clashes` is against, everything else is neutral — about six queens in ten.
 * The score is untouched and still reads `fitFor`, because that term was
 * calibrated and this is prose.
 *
 * A category with no entry in the catalogue — a challenge-derived eleganza, a
 * Ball's own walk, an authored one-off — is neutral, which is the honest read:
 * nobody declared what it flatters.
 */
export function fitTierFor(style, category) {
  const c = runwayById(category);
  if (!c || !style) return 'neutral';
  if ((c.styles || []).includes(style)) return 'home';
  if ((c.clashes || []).includes(style)) return 'against';
  return 'neutral';
}

/** What she brought for tonight, or null — see voiceLinesFor on why null. */
export function themeLinesFor(family, fitId) {
  const f = RUNWAY_THEMES.find(x => x.family === family);
  const t = f && f.tiers.find(x => x.id === fitId);
  return t && t.lines.length ? t.lines : null;
}

/**
 * Her craft lines for tonight, or null.
 *
 * NULL RATHER THAN A FALLBACK LINE, and that is deliberate: this file ships
 * empty and is filled style by style, so for most of its life some styles are
 * written and some are not. stage.js reads a null here and falls back to the
 * narrator walk in stage-beats.js, which means a half-filled file gives a
 * season where six queens speak for themselves and four are narrated — never
 * a season with holes in the runway.
 */
export function voiceLinesFor(style, tierId) {
  const v = RUNWAY_VOICES.find(x => x.style === style);
  const t = v && v.tiers.find(x => x.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** Her closing sentence, or null — omitted entirely rather than faked. */
export function swaggerLinesFor(group, tierId) {
  const g = RUNWAY_SWAGGER.find(x => x.group === group);
  const t = g && g.tiers.find(x => x.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** Every (style, tier) and (group, tier) pair still waiting on prose. */
export function unwrittenRunwayVoices() {
  const out = [];
  for (const f of RUNWAY_THEMES) {
    for (const t of f.tiers) if (t.lines.length < 4) out.push(`theme:${f.family}/${t.id}`);
  }
  for (const v of RUNWAY_VOICES) {
    for (const t of v.tiers) if (t.lines.length < 4) out.push(`voice:${v.style}/${t.id}`);
  }
  for (const g of RUNWAY_SWAGGER) {
    for (const t of g.tiers) if (t.lines.length < 4) out.push(`swagger:${g.group}/${t.id}`);
  }
  return out;
}

/** How many tiers exist across both pools, for the progress report. */
export function runwayVoiceTierCount() {
  return RUNWAY_THEMES.reduce((n, f) => n + f.tiers.length, 0)
    + RUNWAY_VOICES.reduce((n, v) => n + v.tiers.length, 0)
    + RUNWAY_SWAGGER.reduce((n, g) => n + g.tiers.length, 0);
}
