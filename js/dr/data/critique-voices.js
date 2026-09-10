// ══════════════════════════════════════════════════════════════════════
// dr/data/critique-voices.js — the critique, made of what actually happened
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The critiques were three paragraphs keyed on nothing but `tone`, so the
// same sentence covered a collapsed Snatch Game and a hemline:
//
//   "Michelle Visage looks at Bowie for a long time before speaking, and the
//    pause is its own critique."
//
// It is good prose about nothing. It names no fault, no look, no moment and
// no reason, and it would print unchanged over any queen on any night of any
// season. And the engine knew better the whole time: `critiqueLines` computes
// which term actually moved that judge on that queen and hands it to the
// screen as two tags — `challenge · runway` — sitting above prose that never
// mentions either of them. The judges' authored `petPeeve` and `softSpot`
// were read by nothing at all.
//
// ── WHAT THE ENGINE NOW HANDS YOU ─────────────────────────────────────
//
// Every critique carries a `reason`, measured rather than rolled:
//
//   dimension  challenge | runway | risk | polish — the term that moved THIS
//              judge most on THIS queen, which is her taste weight times the
//              queen's real number. Law arrives at the runway and Ross at the
//              challenge because that is what each of them is actually
//              weighing, so the voice comes out of the selection.
//   direction  praise | fault
//   standing   where she really placed on that dimension tonight, out of the
//              queens still on stage. "Best look of the night" and "third
//              best look" are different critiques and this is the difference.
//   styleLean  what this judge has authored for or against her kind of drag.
//   peeve      the judge's own words for what she cannot forgive.
//   softSpot   and for what she forgives everything else for.
//
// ── THE POOLS ─────────────────────────────────────────────────────────
//
//   CRITIQUE_REASONS  4 dimensions × 2 directions.  What she did, and how it
//                     is being weighed.
//   CRITIQUE_BIAS     2 directions.  When this judge's taste for her kind of
//                     drag is itself the reason, and everybody can tell.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THE REGISTER IS THE MAIN STAGE: performance and verdict. She is standing
// there, the cameras are on her, and the judge is talking TO her rather than
// about her. Tighter and more declarative than the werk room. Judges are
// witty and land a real judgement; a queen receiving one knows she is on
// camera.
//
// Placeholders:
//   {a}  the queen.
//   {j}  the judge speaking.
//   {p}  this judge's pet peeve, in her own words — "a hidden waist", "being
//        off the count", "a cheap fabric under a good idea". USE IT IN THE
//        FAULT TIERS: it is the whole reason a fault sounds like Michelle
//        rather than like a narrator.
//   {o}  her soft spot — "a live vocal", "proportion", "a clean eight".
//        The praise tiers' equivalent.
//   {y}  the queen's drag style, e.g. camp, fashion, pageant. BIAS POOL ONLY.
//
// {p} AND {o} ARE PHRASES, NOT SENTENCES. They drop in as objects: "and {j}
// has never once forgiven {p}" works, "{j} says {p}" does not.
//
// SAY WHERE SHE PLACED WHEN IT IS WORTH SAYING. The engine hands you her real
// standing on that dimension and the prose should use it — the best look of
// the night is a different critique from a look that was fourth of six, and a
// pan that could be about anybody is the thing this file replaces.
//
// Same rules as every other pool, all enforced by tests: no real people
// beyond the panel, this show's vocabulary only, never quote a stat by
// number, four variants minimum, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four things a judge can be weighing. `taste` in js/dr/data/judges.js. */
export const DIMENSIONS = ['challenge', 'runway', 'risk', 'polish'];
export const DIRECTIONS = ['praise', 'fault'];

/** Six, because a critiqued queen draws one every week for a whole season. */
export const CRITIQUE_VARIANTS = 6;

const tiersFrom = (ids, args) => {
  const out = [];
  let i = 0;
  for (const id of ids) {
    const v = args[i];
    if (v && typeof v === 'object' && !Array.isArray(v)) { out.push(v); i += 1; continue; }
    if (Array.isArray(args[i + 1])) { out.push(tier(id, v, args[i + 1])); i += 2; continue; }
    out.push(tier(id, v));
    i += 1;
  }
  return out;
};

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — THE REASON. What she did, weighed by somebody in particular.
// ══════════════════════════════════════════════════════════════════════

const dim = (id, note, ...rest) => ({
  dimension: id, note, tiers: tiersFrom(DIRECTIONS, rest.flat()),
});

export const CRITIQUE_REASONS = [
  dim('challenge',
    'WHAT SHE DID IN THE CHALLENGE — the performance, the character, the joke, '
    + 'the verse. A judge arriving here is unmoved by a beautiful queen who did '
    + 'nothing and will forgive a rough look for a night that worked.',
    tier('praise', 'The work was the best thing on that stage and {j} says so plainly.', [
      "{j} leans into the mic and says what the room already knows: {a} understood the assignment better than anybody else tonight.",
      "\"That is what I come here to see,\" {j} tells {a}, and you can hear the relief of a judge who finally got a performance worth praising.",
      "{j} points at {a} and tells her she found {o} in the middle of a challenge that ate most of the cast alive, and she made it look easy.",
      "The critique is short because {j} does not need many words: {a} did the work, the work was excellent, and {o} was the cherry on top.",
      "{j} says {a} gave them exactly what they were looking for — commitment, clarity, and a performance the room will not forget by next week.",
      "\"You came out here and you DID something,\" {j} says, and the emphasis on the verb is the whole review — because half the cast tonight did not.",
    ]),
    tier('fault', 'She did not do the challenge, and no amount of the rest covers it.', [
      "{j} looks at {a} and says she does not know what happened up there, because whatever it was, it was not the challenge they were given.",
      "\"I was confused,\" {j} says flatly. \"I did not know what you were doing, and I do not think you knew either.\" {a} has nothing to answer with.",
      "{j} tells {a} that a beautiful queen standing in a beautiful garment cannot rescue a performance that never arrived, and {p} made it worse.",
      "The critique lands like a verdict: {j} says {a} was lost from the first beat, and the look could not carry a challenge this empty.",
      "{j} shakes her head and tells {a} she has seen what {a} can do, and tonight was not it — the character was hollow, the commitment absent, and {p} was all she could see.",
      "\"You gave us nothing to judge,\" {j} says, and the nothing is the point — {a} was physically present and creatively elsewhere.",
    ])),
  dim('runway',
    'THE GARMENT. Construction, proportion, the idea, and whether it survived '
    + 'contact with a body. A judge arriving here can be entirely uninterested '
    + 'in how funny she was.',
    tier('praise', 'The look is the best thing that walked and {j} takes it apart to say why.', [
      "{j} studies the garment from hem to neckline and tells {a} that this is the look of the night — proportion, idea, finish, all of it working.",
      "\"I cannot stop staring at you,\" {j} says, and then walks {a} through every detail that makes the garment sing — the line, the fabric, the movement.",
      "{j} points out that {a} found {o} on a runway where most queens brought costumes, and the difference between the two has never been clearer.",
      "The critique is a love letter to the construction: {j} tells {a} that every seam is intentional, every choice is earned, and the garment stands on its own.",
      "{j} says the look told a story before {a} opened her mouth, and a runway that speaks for itself is what {o} looks like in practice.",
      "\"This is what fashion looks like on this stage,\" {j} tells {a}, and the sentence is so plain it functions as the highest compliment available.",
    ]),
    tier('fault', 'The garment does not hold up, and a good night does not fix a bad seam.', [
      "{j} tells {a} the garment fell apart the moment she moved, and {p} is not something this panel can overlook no matter how charming the queen inside it is.",
      "\"I wanted to love this,\" {j} says, \"but I cannot get past the construction.\" {a} nods because she already knew — the garment betrayed her the second she hit the light.",
      "{j} says {a} had an idea and then ran out of skill before the idea was finished, and {p} turned a concept into a costume.",
      "The critique is specific and it stings: {j} names the hem, the closure, the weight of the fabric, and tells {a} that a look this ambitious needed hands that matched the ambition.",
      "{j} looks at {a} and says the runway saved nobody tonight, and a queen who walked a garment this unfinished was asking the panel to look the other way.",
      "\"Baby, I love you, but I do not love that garment,\" {j} says, and {a} takes it because {p} is sitting right there on the stage and everybody saw it.",
    ])),
  dim('risk',
    'THE NERVE. Whether she tried something that could have failed. A judge '
    + 'arriving here would rather see an ambitious mess than a safe success.',
    tier('praise', 'She went for something, and {j} rewards the going more than the result.', [
      "{j} tells {a} that what she attempted tonight could have been a disaster, and the fact that it was not is a credit to the nerve it took to try.",
      "\"You scared me,\" {j} says, smiling. \"I thought you were going to eat it. And then you did not, and now I am standing here praising the audacity.\"",
      "{j} says {a} brought {o} to the stage tonight — the willingness to fail publicly, which is the only road to something the panel has not seen before.",
      "The critique is an endorsement of risk: {j} tells {a} that a safe version of tonight would have landed her in the middle, and the gamble put her at the top.",
      "{j} looks at {a} and says the thing every queen needs to hear once — that the mess was worth it, that the ambition read louder than the stumble, and that {o} is rarer than perfection.",
      "\"Other queens played it smart tonight and I have already forgotten them,\" {j} tells {a}. \"I will not forget you. That is what nerve buys.\"",
    ]),
    tier('fault', 'She played it safe, and safe is what {j} came here to warn her about.', [
      "{j} tells {a} she was good tonight — competent, polished, perfectly fine — and asks her whether perfectly fine is really what she travelled here to deliver.",
      "\"I have seen this from you before,\" {j} says. \"And I liked it before. But I cannot keep rewarding the same safe choice every week, and {p} is starting to show.\"",
      "{j} says {a} made every correct decision and not a single interesting one, and the panel can tell the difference between a queen who is coasting and a queen who is competing.",
      "The critique is gentle but the message is not: {j} tells {a} she needs to take a risk soon, because {p} is what happens when talent hides behind reliability.",
      "{j} leans forward and asks {a} what she is afraid of, because the queen standing on that stage tonight was managing her position instead of fighting for it.",
      "\"You are too talented for this,\" {j} says, and the compliment is the sharpest part of the pan — because the talent is real and the cowardice is wasting it.",
    ])),
  dim('polish',
    'THE FINISH. Whether it was FINISHED — the paint, the seam, the timing, '
    + 'the thing between a professional and somebody having a go.',
    tier('praise', 'It was finished, and almost nothing on that stage tonight was.', [
      "{j} tells {a} the difference tonight was the finish — every detail was handled, every transition was clean, and {o} was present from the first moment to the last.",
      "\"Professionalism,\" {j} says, pointing at {a}. \"That is what I am looking at. A queen who treated every inch of this like it mattered.\"",
      "{j} says {a} was not the flashiest thing on that stage, but she was the most complete, and completion is what separates a competitor from a professional.",
      "The critique is about craft: {j} tells {a} that the paint was correct, the garment was pressed, the timing was exact, and that {o} held the whole package together.",
      "{j} looks at {a} and tells her that she did the work before the cameras turned on, and the preparation showed in every beat of the performance.",
      "\"Some queens brought a moment. You brought a SHOW,\" {j} tells {a}, and the distinction is that a show has been rehearsed, refined, and finished.",
    ]),
    tier('fault', 'It is unfinished, and she knew it was unfinished when she walked out.', [
      "{j} asks {a} whether she ran out of time or ran out of effort, because the result is a concept that never became a finished product, and {p} is all over it.",
      "\"Close is not the same as done,\" {j} tells {a}. \"And tonight you were close, and the gap between close and done is where {p} lives.\"",
      "{j} says {a} had every ingredient except the last ten percent, and the last ten percent is the part that turns a rehearsal into a performance.",
      "The critique is surgical: {j} names three details that were almost right and tells {a} that almost-right reads as unfinished under these lights, especially when {p} is visible.",
      "{j} tells {a} that polish is not a bonus round — it is the baseline, and a queen who walks onto this stage with seams showing and paint unblended is asking for exactly this conversation.",
      "\"You have the talent,\" {j} says. \"What you do not have is the discipline to finish what you start, and the gap is {p} staring back at me from that stage.\"",
    ])),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — WHAT SHE DID, IN THE NIGHT'S OWN WORDS
// ══════════════════════════════════════════════════════════════════════
//
// THE JUDGE VARIED AND THE CHALLENGE DID NOT. Pool 1's `challenge` tier is one
// pool for every night of the season, so the same praise printed over a
// makeover, a Snatch Game and a Rusical — the judge's name changed, her pet
// peeve changed, and what she was actually talking about did not:
//
//   makeover     "That is what I come here to see," Michelle Visage tells her
//   snatch-game  RuPaul tells her she found a big personality
//   rusical      "You came out here and you DID something"
//
// Not one of those is about a makeover, a character or a live vocal. Michelle
// does not say "I do not see the family resemblance" because no critique has
// ever known it was a makeover.
//
// So the `challenge` dimension — and only that one — is keyed by the challenge
// family as well. The other three ask the same question every week: the
// garment is the garment, nerve is nerve, and finished is finished. What she
// DID is the only thing that changes with the night, which is why this is
// thirty-four tiers rather than a hundred and thirty-six.
//
// Same families as js/dr/data/maxi-performance.js, so a challenge with a
// performance pool automatically has a critique to go with it.
//
// WRITE THE NIGHT'S OWN VOCABULARY. A makeover fault is the resemblance and
// whether the two of them read as family; a Snatch Game fault is the character
// and whether she could hold it; a Rusical fault is the words and the key. A
// line that would work on any other night is the line this pool replaces.

const chal = (family, note, ...rest) => ({
  family, note, tiers: tiersFrom(DIRECTIONS, rest.flat()),
});

export const CRITIQUE_CHALLENGE = [
  chal('snatch-game',
    'The character: whether she picked one she could do, whether she held it '
    + 'for six questions, and whether it was funny as that person rather than '
    + 'as herself.',
    tier('praise', 'The character was alive and she never once dropped it.', [
      "{j} tells {a} she found the character in the first question and never let go — six rounds, six laughs, and not once did {a} break to check whether it was landing.",
      "\"You did not play her, you BECAME her,\" {j} says, and {a} grins because the becoming is the part that took the most work and {o} was woven into every answer.",
      "{j} says {a} picked somebody she had no business pulling off and then pulled her off for six straight questions without dropping the voice, the posture, or the joke.",
      "The critique is the best kind: {j} tells {a} the character was so committed that {j} forgot she was watching a queen do an impression and started watching the person.",
      "{j} leans back and tells {a} that every answer built on the last one — the character had an arc, a point of view, and {o} holding it all together from the first question to the sixth.",
      "\"THAT is Snatch Game,\" {j} says. \"You picked somebody you understood, you found the funny inside her, and you held it when everybody around you was falling apart.\"",
    ]),
    tier('fault', 'She could not hold it, or she picked somebody she cannot do.', [
      "{j} tells {a} the character was gone by question three — the voice drifted, the bit repeated, and by the end {a} was answering as herself in a wig that no longer meant anything.",
      "\"You picked somebody you do not know well enough,\" {j} says, and {a} cannot argue because the impression ran out of material halfway through and {p} filled the silence.",
      "{j} says {a} had one joke and used it six times, and a Snatch Game character who only does one thing is not a character, it is a catchphrase in a costume.",
      "The critique is about the choice: {j} tells {a} she picked somebody too subtle for this format, and subtle dies in a game that rewards the loudest, funniest version of a person.",
      "{j} looks at {a} and says the character never arrived — {a} sat in that chair and answered questions as herself with an accent, and an accent is not a character and {p} made the gap obvious.",
      "\"I wanted to laugh and I could not find the joke,\" {j} says. \"The impression was surface and the funny never came, and by question four I had stopped waiting for it.\"",
    ])),
  chal('girl-group',
    'Her verse, her eight-count, and whether she disappeared into the group '
    + 'or stood out of it.',
    tier('praise', 'Her verse was the one the number needed and she sold it.', [
      "{j} tells {a} her verse was the one the whole number needed — it hit, it landed, and the girls beside her looked better because she was there.",
      "\"You ATE that verse,\" {j} says. \"You wrote it, you sold it, you hit every count, and I could not take my eyes off you — and that is {o} in a group number.\"",
      "{j} says {a} found {o} inside a girl group challenge, which means she stood out without stepping on anybody, and that is the hardest thing to do in a group number where everybody is sharing the stage.",
      "The critique is about presence: {j} tells {a} she understood the assignment — her verse had a hook, her choreo was tight, and she served the camera like it was hers alone.",
      "{j} points at {a} and says she was the standout in a group that did not have a weak link, which means her verse was not just good, it was the one everybody will remember.",
      "\"That is how you do a girl group,\" {j} tells {a}. \"The verse was sharp, the energy was right, you gave me {o}, and the other girls knew you were the one to watch.\"",
    ]),
    tier('fault', 'She was carried, or she was off the count, or she vanished.', [
      "{j} tells {a} she vanished inside the number — the verse was forgettable, the energy was flat, and in a group of four she was the one {j} had to look for.",
      "\"You were off the count for the whole chorus,\" {j} says, and {a} knows it, because being off the count in a group number means everybody else is right and you are the one who is wrong, and {p} made it worse.",
      "{j} says {a} was carried — her verse was thin, her stage presence was behind the other girls, and when the camera found her she gave it nothing to work with.",
      "The critique is blunt: {j} tells {a} she wrote the weakest verse in the group and then performed it like she knew it was the weakest, and {p} was visible in every wide shot.",
      "{j} looks at {a} and says the number would have been tighter without her, and that is the worst thing you can say about a queen in a girl group — that the group was stronger than the part she brought to it.",
      "\"I could not find you,\" {j} says. \"Four queens on that stage and you were the one I kept losing, and {p} was all I saw when I finally found you.\"",
    ])),
  chal('rumix',
    'The verse itself — whether it was written, whether it was recorded, and '
    + 'whether she could stand inside it on a stage.',
    tier('praise', 'The verse was hers and she delivered it like she meant it.', [
      "{j} tells {a} her verse was the one — the one bar the track needed. She wrote it, she recorded it clean, and she stood on that stage and delivered it like the words had always been hers.",
      "\"You WROTE that,\" {j} says. \"You wrote it, you walked into the booth and you laid it down, and then you came out here and performed it live like you have been rapping your whole life. That is {o}.\"",
      "{j} says {a}\'s verse was the one everybody in the room will be repeating tomorrow. The writing was sharp, the booth recording was clean, and the live performance sold every bar.",
      "The critique is about ownership: {j} tells {a} that verse was not assigned to her — she built it. The bars scanned, the delivery had weight, and the stage performance proved the booth tape was not a fluke.",
      "{j} points at {a} and says she gave the track its best verse. Written well, recorded cleanly, and performed with the confidence of a queen who knows her bars are better than everybody else\'s.",
      "\"You did not just learn a verse — you WROTE one,\" {j} tells {a}. \"And then you sold it live. The writing was the test and the stage was the proof, and {o} was all over both.\"",
    ]),
    tier('fault', 'The bars were filler, or the tape was thin, or she lost her own verse live.', [
      "{j} tells {a} the verse was filler — nothing in those four bars that the track will miss. She wrote words to fill time and then performed them like she knew they were not enough.",
      "\"The bars were not there,\" {j} says. \"You walked into the booth with a verse that did not scan and then you came out here and lost it on the stage, and {p} was the cherry on top.\"",
      "{j} says {a}\'s verse was the weakest in the track. The writing was thin, the recording sounded uncertain, and the live performance confirmed what the booth tape suggested — she was in over her head.",
      "The critique is about the writing: {j} tells {a} the verse never had a punchline, the flow did not match the beat, and {p} made the live performance the worst version of bars that were already the weakest on the track.",
      "{j} looks at {a} and says she lost her own lyrics on a stage. Her OWN lyrics. Written that day. If the verse was forgettable to the person who wrote it, it was invisible to the panel.",
      "\"You wrote four bars and I cannot remember one of them,\" {j} says. \"The booth tape was shaky, the stage was shakier, and {p} was the only thing I could focus on by the end.\"",
    ])),
  chal('music-video',
    'What ended up on the tape, and what was said about the day on set.',
    tier('praise', 'She understood the camera and gave the edit everything it needed.', [
      "{j} tells {a} she was the one who understood the camera. \"You found the lens every time,\" {j} says. \"The edit has more of you than anybody else because you gave it more to use.\"",
      "\"I was on that set,\" {j} says. \"You took direction, you found the camera every single setup, and you gave the edit so much material they could have cut a solo video from your footage alone. That is {o}.\"",
      "{j} says {a} understood something the other queens did not — a video is not a stage. She played smaller, she played smarter, and the lens rewarded her for it. \"The set report confirms what the tape already shows,\" {j} says.",
      "The critique is about camera instinct: {j} tells {a} she gave the edit everything — the angles, the energy, the takes. \"You were the easiest queen to shoot and the hardest to cut around,\" {j} says. \"That is rare.\"",
      "\"I saw what you did on that set,\" {j} tells {a}. \"You showed up knowing your part, took every note, found the camera on every setup, and gave {o} through a lens — which is harder than giving it on a stage.\"",
      "\"You are a camera queen,\" {j} tells {a}. \"The tape proves it. You found the light, you found the lens, and you gave {o} in every single setup. The set was yours.\"",
    ]),
    tier('fault', 'She was unfindable in the frame, or the day cost her more than the part was worth.', [
      "{j} tells {a} the camera could not find her. A full day on set and {a} was the queen the lens had to chase instead of the queen who found it, and {p} showed up every time the camera got close.",
      "\"You were lost,\" {j} says. \"I was on that set. Lost in the part, lost in the blocking, and {p} was all the camera found when it finally landed on you.\"",
      "{j} says {a} did not know how to play for a camera. She played for a stage — too big, too broad — and the lens picked up {p} instead of the performance she was asked for.",
      "\"The set report was not kind,\" {j} tells {a}. \"You took more takes than anyone, you could not find the camera, and {p} was visible in the footage they DID manage to use.\"",
      "{j} looks at {a} and says a music video is about the edit, and the edit had nothing from her. \"You were given notes. You did not take them. And {p} was the only thing consistent across your setups,\" {j} says.",
      "\"The tape does not lie,\" {j} says. \"And the tape says you were unfindable. The camera looked for you and all it found was {p}. That is not a music video performance.\"",
    ])),
  chal('rusical',
    'THE WORDS AND THE KEY. A live vocal in front of a band, a part with lines '
    + 'in it, and nowhere to hide.',
    tier('praise', 'She sang it, in key, and acted it at the same time.', [
      "{j} tells {a} she sang it live and she sang it RIGHT — in key, on beat, with a character underneath the vocal that made the part hers and not just the part she was assigned.",
      "\"You gave me a PERFORMANCE,\" {j} says. \"The words were there, the key was there, and you acted through every bar — that is {o} and it is rare on this stage.\"",
      "{j} says {a} found {o} in the middle of a live number with a band behind her, which means every note was earned and every beat was landed and the acting never dropped.",
      "The critique is about control: {j} tells {a} she held the vocal AND the character for the entire number, and the queens who could not do both tonight are the proof of how hard that is.",
      "{j} points at {a} and says the vocal was strong, the lyrics were locked, and the face was acting the whole time — three things at once that most queens on that stage could barely manage one of.",
      "\"THAT is a Rusical performance,\" {j} tells {a}. \"You learned the words, you found the key, you sold the character, and you made it look like you have been doing this your whole life.\"",
    ]),
    tier('fault', 'The words went, or the key did, and the band did not stop for her.', [
      "{j} tells {a} the words were not there — she lost them in the second verse and the band kept going and {a} was standing on a stage with her mouth open and nothing coming out, and {p} was the soundtrack.",
      "\"The lyrics went and then you went,\" {j} says. \"Once you lost the words you lost the character and then you lost the number, and {p} was all that was left.\"",
      "{j} says {a} was off the key from the first note and never found it, and a Rusical performance that is pitchy from bar one has nowhere to recover because the band does not wait for you.",
      "The critique is about preparation: {j} tells {a} she did not learn the part well enough and it showed — the words dropped, the confidence dropped with them, and {p} filled the space the performance left behind.",
      "{j} looks at {a} and says the vocal was not there and the acting could not save it, because a Rusical needs both and {a} brought neither, and the empty bars where the lyrics should have been were louder than anything she sang.",
      "\"You had a part with real lyrics and you did not learn them,\" {j} says, and the flatness in the delivery is its own verdict — {a} was given a number and gave it back unfinished.",
    ])),
  chal('roast',
    'Her own material, her own timing, a live room. Whether the jokes were '
    + 'hers and whether they landed.',
    tier('praise', 'She wrote it, she landed it, and she held the room.', [
      "{j} tells {a} she wrote her own material and it LANDED — every joke hit, the timing was hers, and the room was laughing before {a} even reached the punchline.",
      "\"You held that room,\" {j} says. \"The material was yours, the timing was yours, and {o} was in every beat — you did not borrow a single laugh tonight.\"",
      "{j} says {a} brought the one thing a roast needs: material that is actually funny, delivered by someone who knows where the laugh is and waits for it.",
      "The critique is short because the set spoke for itself: {j} tells {a} the jokes were sharp, the callbacks were smart, and she read the room better than anyone else on that stage tonight.",
      "{j} points at {a} and says the set was tight and the delivery was tighter — no filler, no panic, just a queen who wrote real jokes and landed them on a live audience.",
      "\"The room was YOURS,\" {j} tells {a}. \"You had them from the first line, you kept them through the middle, and the closer was {o} in joke form — that is a roast.\"",
    ]),
    tier('fault', 'The material was thin or the timing was gone and the room went quiet.', [
      "{j} tells {a} the room went quiet and it went quiet early — the first joke missed, the second missed worse, and by the third the audience had decided, and {p} was hanging over all of it.",
      "\"The material was not there,\" {j} says. \"You stood on that stage with jokes that were not funny and you could hear the silence and the silence got louder and {p} was the only thing I could focus on.\"",
      "{j} says {a} wrote a set that relied on shock and forgot that shock without a punchline is just uncomfortable, and the room's silence was its own review.",
      "The critique is about timing: {j} tells {a} she had material but no rhythm — the punchlines arrived in the wrong places, the pauses were too long or too short, and {p} was visible in every stumble.",
      "{j} looks at {a} and says a roast queen needs to read the room, and {a} read it wrong from the first joke and never adjusted, and the dead air between the punchlines told the whole story.",
      "\"I wanted to laugh,\" {j} says. \"I was rooting for you. But the jokes were thin and the delivery was thinner and {p} was sitting right there in every silence.\"",
    ])),
  chal('makeover',
    'THE RESEMBLANCE. Whether the two of them read as family — the paint, the '
    + 'proportions, the walk she taught her — and whether she made her partner '
    + 'comfortable enough to sell it.',
    tier('praise', 'They read as sisters and her partner is having the night of her life.', [
      "{j} tells {a} the family resemblance is undeniable — the paint matches, the walk matches, and her partner is LIVING, which means {a} did not just dress her, she taught her how to be in drag.",
      "\"I see sisters,\" {j} says. \"The proportions are the same, the mug is the same spirit, and her partner is having the time of her life up there — that is {o} and that is a makeover.\"",
      "{j} says {a} painted her partner like family and not like a copy — the resemblance is in the spirit, the silhouette, the energy, and {o} is holding the whole thing together.",
      "The critique is about generosity: {j} tells {a} she gave her partner enough of herself that they read as related without looking identical, and the partner's confidence is the proof that {a} made her feel beautiful.",
      "{j} points at both of them and says this is what a makeover is supposed to be — two people who look like they came from the same world, both of them glowing, neither of them upstaging the other.",
      "\"She looks like she BELONGS next to you,\" {j} tells {a}. \"The paint is family, the garment is family, and the smile on that woman's face tells me you treated her like a queen and not like a project.\"",
    ]),
    tier('fault', 'They do not look related, or she painted a stranger and left her there.', [
      "{j} tells {a} she does not see the family resemblance — the mugs do not match, the silhouettes do not match, and her partner looks like she was painted by someone who forgot to look in the mirror first.",
      "\"I do not see sisters,\" {j} says. \"I see you and I see someone standing next to you, and {p} is the gap between the two of you that a makeover is supposed to close.\"",
      "{j} says {a} painted herself on her partner's face instead of finding what they share, and the result is a stranger wearing {a}'s mug who does not know why she looks like that.",
      "The critique is about the partner: {j} tells {a} the woman standing beside her does not look comfortable, does not look related, and does not look like {a} spent the day teaching her anything — she looks abandoned in a corset, and {p} is on full display.",
      "{j} looks at {a} and says the makeover missed the point — it is not about making somebody look like you, it is about making somebody look like your FAMILY, and {p} made the gap obvious.",
      "\"She is not having fun up there,\" {j} says, and that is the sharpest part of the critique — {a} built a look and forgot to build a person inside it, and the discomfort reads from the back row.",
    ])),
  chal('ball',
    'Three looks and one of them sewn on the day. Whether the trio holds '
    + 'together and whether the built one holds up.',
    tier('praise', 'All three land and the sewn one is the best of them.', [
      "{j} tells {a} all three looks told a story and the sewn one was the best of the three — the construction held, the concept was clear, and the runway told a beginning, a middle and an end.",
      "\"Three for three,\" {j} says. \"The first look set the tone, the second raised it, and the one you BUILT today was the one that gagged me — that is {o} and that is how you win a ball.\"",
      "{j} says {a} understood what a ball is — three looks that talk to each other, not three separate outfits, and the sewn look proved she has the hands to back up the eye.",
      "The critique is about cohesion: {j} tells {a} the trio reads as a collection, each look builds on the last, and the construction of the final garment shows {o} from the first stitch to the last.",
      "{j} points at {a} and says the built look is the one that separates the queens who pack well from the queens who can actually sew, and {a} can actually sew.",
      "\"You brought three looks and none of them were filler,\" {j} tells {a}. \"The sewn one is a GARMENT — proportioned, finished, intentional — and {o} is all over the construction.\"",
    ]),
    tier('fault', 'The trio does not cohere, or the built look is unfinished.', [
      "{j} tells {a} the three looks do not talk to each other — she brought three separate outfits to a ball that needed a story, and {p} was the thread that was supposed to connect them.",
      "\"That hem,\" {j} says, and does not need to finish the sentence because the hem is telling its own story — the built look is unfinished, the construction is showing, and {p} is sitting on that stage.",
      "{j} says {a} packed well but sewed poorly, and a ball queen who cannot deliver the built look is a queen who brought two-thirds of the assignment and hoped nobody would count.",
      "The critique is about the construction: {j} tells {a} the sewn garment is falling apart under the lights, the seams are visible, the shape is gone, and {p} is the difference between a garment and a costume.",
      "{j} looks at {a} and says the trio does not cohere — two of the looks go together and the third is from a different planet, and a ball is a collection and not a yard sale.",
      "\"Baby, the glue is showing,\" {j} says. \"The built look needed two more hours that you did not have, and {p} is what happens when the concept outpaces the skill.\"",
    ])),
  chal('design',
    'What she made out of what she was handed, and whether the material is '
    + 'used or hidden.',
    tier('praise', 'She used the material rather than disguising it, and it is a garment.', [
      "{j} tells {a} she used the material instead of hiding it — the fabric is the star, the construction respects what it is, and {o} is in every choice she made with it.",
      "\"You made a GARMENT out of that,\" {j} says, and the emphasis on garment is the point — most queens built costumes and {a} built something a person would wear, and {o} is the difference.",
      "{j} says {a} understood the assignment: take the material, honour the material, and make something that could not have been made from anything else — that is design, not decoration.",
      "The critique is about craft: {j} tells {a} she did not apologise for the material, she celebrated it, and the garment reads as fashion rather than as a project because {o} is in the proportion and the finish.",
      "{j} points at {a} and says the construction is clean, the silhouette is intentional, and the material is doing what {a} asked it to do rather than fighting her — that takes hands and it takes vision.",
      "\"Most queens wrapped it. You BUILT something,\" {j} tells {a}. \"The material is still visible, the shape is earned, and {o} is in every seam — that is a design challenge done right.\"",
    ]),
    tier('fault', 'It is glue and hope, or the material is being apologised for.', [
      "{j} tells {a} the material is being hidden instead of used — she covered it, wrapped it, buried it under other things, and {p} is that the design challenge is about the material, not about avoiding it.",
      "\"It is a piece of fabric with some glue on it,\" {j} says, and {a} knows it because the garment is not a garment, it is a concept that ran out of execution, and {p} is holding it together instead of stitches.",
      "{j} says {a} fought the material instead of working with it, and the fighting shows — the shape is wrong, the draping is wrong, and what walked down that runway was hope rather than construction.",
      "The critique is about the gap: {j} tells {a} there was an idea and there was a result and the distance between them is called skill, and tonight the skill was not enough and {p} filled the space.",
      "{j} looks at {a} and says the garment is apologising for itself — every fold is an excuse, every pin is a confession, and the material deserved a queen who knew what to do with it.",
      "\"I can see every place you gave up,\" {j} says. \"The top is a garment and the bottom is a prayer, and {p} is sitting right at the seam where the effort stopped.\"",
    ])),
  chal('talent-show',
    'The act. Whether she had one, whether it had an ending, and whether it '
    + 'was worth the four minutes.',
    tier('praise', 'The act was hers, it was finished, and the room wanted more of it.', [
      "{j} tells {a} the act was real — it had a beginning, a middle and an end, it belonged to {a} and nobody else, and {o} was present in every second of it.",
      "\"THAT is a talent show,\" {j} says. \"You came out, you showed us something that is YOURS, and when it ended the room wanted more — and {o} was the reason.\"",
      "{j} says {a} brought a talent, not a concept — something she has done before, something she owns, and the confidence of a queen who knows what her four minutes are for.",
      "The critique is about finish: {j} tells {a} the act had an ending, which sounds simple but half the queens tonight walked off stage without one, and {o} made the difference between a performance and a skit.",
      "{j} points at {a} and says the four minutes were worth every second — the talent was undeniable, the presentation was polished, and the room is still buzzing.",
      "\"You did not walk a runway with music behind you,\" {j} tells {a}. \"You performed, you committed, and {o} was in every beat — THAT is what a talent show asks for.\"",
    ]),
    tier('fault', 'The act had no ending, or it was a runway walk with music.', [
      "{j} tells {a} the act did not have an ending — it started somewhere, it went somewhere, and then {a} stood there and it stopped, and {p} was the silence where the closer should have been.",
      "\"That was a runway walk with a backing track,\" {j} says, and the sentence is the whole critique — {a} did not bring a talent, she brought a vibe, and a vibe is not worth four minutes of stage time.",
      "{j} says {a} had four minutes and filled two of them, and the two empty minutes were louder than the two full ones, and {p} was all over the filler.",
      "The critique is about preparation: {j} tells {a} a talent show needs a talent and what she brought tonight was an idea she had in the hotel room and did not rehearse, and {p} was visible from the first beat.",
      "{j} looks at {a} and says the act was not finished — it was not even started properly — and a queen who walks onto this stage without a closer is a queen who did not respect the platform.",
      "\"What was the act?\" {j} asks, and the question is genuine — {a} stood on that stage for four minutes and {j} still cannot name what the talent was, and {p} is the answer she did not bring.",
    ])),
  chal('lalaparuza',
    'Lip syncs back to back. Whether she performed the song or just knew it.',
    tier('praise', 'She performed every one of them and got better as they went.', [
      "{j} tells {a} she performed every song and got BETTER as they went — the first was strong, the second was stronger, and by the last one {a} was giving {o} with every beat.",
      "\"You did not just know the words, you PERFORMED them,\" {j} says. \"Every sync was a show, and the stamina to keep building through all of them is {o} on display.\"",
      "{j} says {a} treated every lip sync like it was the only one, which means every song got the full performance and not the leftover energy from the one before it.",
      "The critique is about endurance: {j} tells {a} that lip syncing back to back separates the queens who can perform from the queens who can only survive, and {a} performed every single one.",
      "{j} points at {a} and says she grew — the first sync was good and the last was great, and {o} was the thread connecting every song into one unstoppable run.",
      "\"The energy never dropped,\" {j} tells {a}. \"You gave every song its own moment, you never coasted, and the fact that you were STRONGER at the end tells me everything about who you are.\"",
    ]),
    tier('fault', 'She ran out somewhere in the middle and the rest was survival.', [
      "{j} tells {a} she ran out of gas in the middle — the first sync was fine but the energy dropped by the second and by the last she was marking it, and {p} was all that was left.",
      "\"You knew the words but you stopped performing them,\" {j} says. \"Somewhere after the first song the body gave up and the mouth kept moving, and {p} was in every sync after that.\"",
      "{j} says {a} survived the lip syncs but did not perform them, and the difference between surviving and performing is the difference between standing on that stage and owning it.",
      "The critique is about stamina: {j} tells {a} back-to-back syncs are a marathon and she sprinted the first one and had nothing left for the rest, and {p} was the fatigue showing in every movement.",
      "{j} looks at {a} and says the last two syncs were a different queen from the first — the fire was gone, the commitment was gone, and {p} was the only thing that stayed consistent.",
      "\"You started strong and you ended flat,\" {j} says. \"A lalaparuza rewards the queen who saves something for the end, and you gave it all away in the first song and had nothing left.\"",
    ])),
  chal('acting',
    'A scripted part on camera. Lines, character, and whether she made a '
    + 'choice rather than reading the page.',
    tier('praise', 'She made a choice and committed to it, and the camera got it.', [
      "{j} tells {a} she made a CHOICE — she found the character in the script, committed to a take, and the camera caught every bit of it, and {o} was the thing that made the choice work.",
      "\"You did not read the lines, you LIVED them,\" {j} says. \"The character was a real person for those three minutes because you decided who she was and did not break, and {o} was in every take.\"",
      "{j} says {a} understood that an acting challenge rewards the queen who makes a decision and sticks to it, and {a} made a strong one and committed with her whole body.",
      "The critique is about commitment: {j} tells {a} she could have played it safe and read the page but she made the character her own, and {o} was the specificity that turned a script into a performance.",
      "{j} points at {a} and says the camera loved her — her choices were clear, her timing was sharp, and the character had a point of view that was not the queen standing inside it.",
      "\"You gave that character a LIFE,\" {j} tells {a}. \"A personality, a rhythm, a reason to be in the scene — most queens tonight played themselves and you played somebody, and {o} was in the difference.\"",
    ]),
    tier('fault', 'She read the lines, or she lost them, or she played herself.', [
      "{j} tells {a} she read the page — she said the words in the right order and that was the ceiling of the performance, and {p} was the absence of anything happening behind the eyes.",
      "\"There was no character,\" {j} says. \"You stood in front of a camera and said the lines and that is all that happened, and {p} was the only thing I saw.\"",
      "{j} says {a} played herself in a costume, which is the safest and least interesting version of an acting challenge, and the camera does not forgive safe because safe is boring on screen.",
      "The critique is about the lost lines: {j} tells {a} she dropped the script halfway through and improvised badly, and the improvising was worse than the forgetting because {p} stepped in where the words should have been.",
      "{j} looks at {a} and says the performance had no take — no decision about who the character was, no point of view, just a queen reciting words she memorised that morning, and {p} was the blank space where the acting should have lived.",
      "\"You had a script and you did not USE it,\" {j} says. \"A script is a gift — it tells you what to say so you can focus on HOW to say it — and you brought neither the what nor the how tonight.\"",
    ])),
  chal('commercial',
    'Thirty seconds, a product, a co-star and a tagline. Whether it sells.',
    tier('praise', 'She sold something ridiculous and made it look easy.', [
      "{j} tells {a} she sold it — the product was absurd, the concept was committed, and the tagline landed because {a} delivered it like she believed it, and {o} was the sell.",
      "\"I would BUY that,\" {j} says, laughing. \"The concept was tight, the timing was perfect, and {a} sold something ridiculous with the confidence of a woman who has done infomercials her whole life.\"",
      "{j} says {a} understood the format — thirty seconds, one product, one sell — and she used every second of it, and {o} was the thing that made the ridiculous feel watchable.",
      "The critique is about commitment: {j} tells {a} the product was silly and she played it straight and that is why it worked — a commercial needs someone who believes in what she is selling, even when what she is selling is nonsense.",
      "{j} points at {a} and says the tagline was the line of the night — sharp, memorable, and delivered to camera like {a} has been talking to a lens her whole career.",
      "\"You did not wink at the audience,\" {j} tells {a}. \"You committed to the bit, you sold the product, and {o} was in the delivery — a commercial queen knows the camera is her customer and you treated it that way.\"",
    ]),
    tier('fault', 'The concept was unfollowable, or the tagline died on camera.', [
      "{j} tells {a} the commercial did not sell anything — the concept was muddled, the tagline was unclear, and {p} was the confused look on every face watching it back.",
      "\"What was the product?\" {j} asks, and the question is the critique — {a} had thirty seconds and {j} still does not know what she was supposed to be selling, and {p} was the concept that never arrived.",
      "{j} says {a} tried to fit a movie into a commercial, and a commercial needs one idea and one sell, and tonight she had four ideas and no sell and {p} was the only thing that read on camera.",
      "The critique is about the tagline: {j} tells {a} the closer died — the delivery was flat, the line was forgettable, and a commercial without a tagline is just someone talking to a camera for thirty seconds.",
      "{j} looks at {a} and says the camera needed {a} to be charming and confident and what it got was uncertain and rushed, and {p} was visible in every frame where {a} did not know where to look.",
      "\"A commercial is SIMPLE,\" {j} says. \"One product, one hook, one sell. You gave me six products, no hook, and {p} where the sell should have been.\"",
    ])),
  chal('improv',
    'No script. Whether she was quick, and whether quick was funny.',
    tier('praise', 'She was fast and it was funny and she made her partner better.', [
      "{j} tells {a} she was quick and she was FUNNY, which are two different things — a lot of queens tonight were fast and none of them were as funny as {a}, and {o} was in every callback.",
      "\"You made your scene partner better,\" {j} says. \"That is the hardest part of improv — the funny AND the generous — and {a} did both and {o} was the instinct behind it.\"",
      "{j} says {a} found the joke in every setup and let it breathe instead of rushing to the next one, which is the mark of someone who understands that improv is listening as much as talking.",
      "The critique is about timing: {j} tells {a} she knew when to talk and when to shut up, and the shutting-up is the part that made the talking land, and {o} was in every pause she took.",
      "{j} points at {a} and says the scene was alive because {a} was responding to what was actually happening, not to a script in her head, and {o} was the spontaneity the panel was looking for.",
      "\"Yes-and,\" {j} tells {a}. \"You took every offer and built on it and the scene grew because you let it grow, and {o} was in every choice you made on the fly.\"",
    ]),
    tier('fault', 'She reached for a script that does not exist, or she steamrollered.', [
      "{j} tells {a} she steamrolled her scene partner — every joke was hers, every setup was interrupted, and the scene died because improv needs two people and {a} would not let the other one talk, and {p} was the result.",
      "\"You were reaching for a script that does not exist,\" {j} says. \"Improv is LIVE, it is NOW, and you were performing material you rehearsed in your head instead of listening to the scene, and {p} killed every real moment.\"",
      "{j} says {a} was loud and fast and neither of those is the same as funny, and the scene partner standing next to her had nothing to work with because {a} took every beat and gave none back.",
      "The critique is about listening: {j} tells {a} she did not hear a single offer her partner gave her, and improv without listening is just someone talking over someone else, and {p} was in every interrupted beat.",
      "{j} looks at {a} and says the scene had no flow — {a} was pushing bits that were not landing and refusing to let go of them, and {p} was the desperation that shows when a queen is performing AT an audience instead of WITH a scene partner.",
      "\"There was no scene,\" {j} says. \"There was you, talking, loudly, over another queen who was trying to build something, and {p} was every moment where you would not let the funny happen.\"",
    ])),
  chal('photoshoot',
    'One frame with something going wrong in it. Whether the face held.',
    tier('praise', 'The face never moved and the frame is the one they will print.', [
      "{j} tells {a} the face held — whatever was happening around her, {a} gave the camera one expression and did not break, and {o} is in the stillness that made the shot.",
      "\"THAT is a photograph,\" {j} says. \"One frame, one face, no flinch — {a} understood that the lens catches everything and she gave it {o} and nothing else.\"",
      "{j} says {a} is the only queen tonight who gave the camera what it needed — a face that was modellinig THROUGH the chaos rather than reacting to it, and {o} was the discipline in every frame.",
      "The critique is about control: {j} tells {a} the picture is the one they will print because the face told a story without moving, and stillness under pressure is {o} in its purest form.",
      "{j} points at {a} and says every other queen tonight fought the concept and {a} surrendered to it, and the surrendering is why the frame is art and not just a picture of a drag queen.",
      "\"You gave face,\" {j} tells {a}. \"Through every distraction, through everything going wrong around you, the face was THERE and it was serving {o} from the first click to the last.\"",
    ]),
    tier('fault', 'She flinched, or the concept never reached the picture.', [
      "{j} tells {a} she flinched — the one thing a photoshoot needs is a face that does not move and {a}'s face moved, and {p} was in every frame where the composure broke.",
      "\"The concept did not reach the picture,\" {j} says. \"Whatever {a} was trying to give the camera, the camera did not get it, and {p} is all I see in the frame.\"",
      "{j} says {a} fought the setup instead of working with it, and the fighting shows in the photo — the tension in the jaw, the panic in the eyes, and {p} reading louder than any pose she tried to give.",
      "The critique is about the flinch: {j} tells {a} the moment she broke was the moment the lens caught, and a photoshoot queen has to trust the frame even when the frame is uncomfortable.",
      "{j} looks at {a} and says the shot is not usable — the concept was there but {a} was not inside it, and {p} was the distance between the queen and the picture she was supposed to be giving.",
      "\"A model does not react,\" {j} says. \"A model commits. You reacted, and {p} is what the camera caught instead of the shot we were all hoping for.\"",
    ])),
  chal('choreography',
    'The count. Whether she learned it and whether she hit it.',
    tier('praise', 'She hit every count and made the queen next to her look better.', [
      "{j} tells {a} she hit every count — the eight was clean, the transitions were sharp, and {o} was in the precision that made the queen next to her look better by comparison.",
      "\"You were ON it,\" {j} says. \"Every count, every beat, every transition — {a} learned the choreo and then she performed it, and {o} was the snap in every movement.\"",
      "{j} says {a} was the anchor in the number — the queen everybody else could follow because her count was clean and her body knew the routine and {o} held it all together.",
      "The critique is about the work before the stage: {j} tells {a} she came in knowing the choreography and it showed in every wide shot, because a queen who learned it looks different from a queen who is faking it.",
      "{j} points at {a} and says the choreo was tight, the face was performing, and the two things at once is the hard part — knowing the steps so well that the body can do them while the face sells them.",
      "\"I could watch you all day,\" {j} tells {a}. \"The count was right, the energy was right, and {o} was in every hit — you danced like you have been doing this for years.\"",
    ]),
    tier('fault', 'She was off the count and it is visible in every wide shot.', [
      "{j} tells {a} she was off the count — a full beat behind in the chorus, visible in every wide shot, and {p} was the lag between {a} and every other queen on that stage.",
      "\"You did not learn the choreo,\" {j} says flatly. \"You were marking it, you were watching the queen next to you for the next step, and {p} was in every movement that arrived a beat late.\"",
      "{j} says {a} was a half-count behind for the whole number and a half-count is enough to wreck a group routine, because the eye goes to the person who is out of sync and it stays there.",
      "The critique is about preparation: {j} tells {a} the choreography needed hours she did not give it, and the shortcut shows — the arms are late, the feet are guessing, and {p} is all over the wide shot.",
      "{j} looks at {a} and says the number would have been tighter without the queen who was off, and tonight that queen was {a}, and {p} was the thing every judge saw in every formation.",
      "\"The body was lost,\" {j} says. \"You were counting in your head instead of feeling it in your body, and {p} was the distance between thinking the step and being ON the step.\"",
    ])),
  chal('singing',
    'A live vocal with nothing over it.',
    tier('praise', 'She can genuinely sing and she chose to prove it.', [
      "{j} tells {a} she can SING — not perform a vocal, not mouth a lyric, but actually sing, in key, with control, and {o} was in every note she chose to hold.",
      "\"That voice is REAL,\" {j} says. \"No track, no safety net, just {a} and a microphone, and {o} was in every sustained note that told me she has been training that voice for years.\"",
      "{j} says {a} proved something tonight — she stood up there with nothing over her voice and let the room hear it raw, and raw was beautiful, and {o} was the courage to do it naked.",
      "The critique is about the choice: {j} tells {a} most queens would have played it safe with a track, and {a} chose to stand there with her own vocal and that choice is {o} in its bravest form.",
      "{j} points at {a} and says the vocal was the best thing on that stage tonight — clean, controlled, emotional — and a live voice with nothing hiding it is the most exposed a queen can be.",
      "\"You opened your mouth and the room went quiet,\" {j} tells {a}. \"Not quiet because it was bad — quiet because it was GOOD, and {o} was in every note the audience held its breath for.\"",
    ]),
    tier('fault', 'She cannot, and there was no arrangement to hide behind.', [
      "{j} tells {a} the vocal was not there — the key was wrong, the breath was short, and there was no arrangement to cover it, and {p} was exposed in every note that did not land.",
      "\"Baby, you cannot sing,\" {j} says, and the directness is a kindness because the alternative is pretending the vocal was passable when it was not, and {p} was audible from the first bar.",
      "{j} says {a} chose to stand on that stage with nothing over her voice and the voice was not ready for that exposure, and {p} was in every flat note and every breath that came too early.",
      "The critique is about the gap: {j} tells {a} there is a difference between wanting to sing and being able to sing, and tonight the wanting was bigger than the ability, and {p} lived in the gap.",
      "{j} looks at {a} and says a live vocal needs a live voice and what the room got tonight was a queen pushing past her range and hoping the emotion would cover the pitch, and it did not.",
      "\"There was nothing to hide behind,\" {j} says. \"And you needed something to hide behind, because the vocal was not there and {p} was all that was left when the note went flat.\"",
    ])),
  chal('runway-challenge',
    'The looks are the whole night. Whether she brought enough of them.',
    tier('praise', 'She packed for this and it shows in every walk.', [
      "{j} tells {a} she packed for this — every look was intentional, every walk was a statement, and {o} was in the depth of a suitcase that had an answer for every category.",
      "\"You came PREPARED,\" {j} says. \"Every look was strong, every category was served, and {o} was the range — you showed us you did not bring one trick, you brought a wardrobe.\"",
      "{j} says {a} understood that a runway night means every walk counts and she did not waste a single one — the looks built on each other and the last one was the exclamation point.",
      "The critique is about the suitcase: {j} tells {a} the difference tonight was that she brought enough, and enough is harder than it sounds when every look has to stand on its own and stand next to the rest.",
      "{j} points at {a} and says she served a collection — not just looks, a COLLECTION — and {o} was the editorial eye that connected every walk to the one before it.",
      "\"That suitcase is doing the Lord's work,\" {j} tells {a}. \"Every look was a moment, every category was answered, and the depth of what you packed tells me you knew this night was coming.\"",
    ]),
    tier('fault', 'She had one good look and a week that needed several.', [
      "{j} tells {a} she had one strong look and the rest were filler, and a runway night rewards the queen who packed deep, not the queen who packed one winner and hoped the rest would pass.",
      "\"You ran out of looks,\" {j} says. \"The first walk was sickening and the rest were not, and {p} was the gap between the queen who packed one moment and the night that needed five.\"",
      "{j} says {a} did not bring enough — the suitcase was shallow, the looks repeated, and a runway challenge exposes a queen who did not prepare for range, and {p} was visible in every repeated trick.",
      "The critique is about depth: {j} tells {a} she showed one version of herself five times and the runway wanted five different versions, and {p} was the monotony that settled in after the second walk.",
      "{j} looks at {a} and says the night needed looks and {a} brought outfits, and the difference between a look and an outfit is everything on a night where the runway IS the challenge.",
      "\"One look does not carry a night,\" {j} says. \"You needed several and you had one, and {p} was what I saw every time you walked out in something that was not the first one.\"",
    ])),
  chal('generic',
    'FALLBACK for a challenge with no family of its own. The line may not '
    + 'assume a garment, a script, a team or a stage, because it could be any '
    + 'of them — so write about how she met the brief, not about the brief.',
    tier('praise', 'She did what the week asked and did it better than anybody.', [
      "{j} tells {a} she understood the assignment better than anyone else tonight — the brief was met, the execution was clean, and {o} elevated the whole thing from competent to excellent.",
      "\"You did what we ASKED,\" {j} says, and the emphasis is because half the queens tonight did not — {a} read the brief, met the brief, and then exceeded it, and {o} was the exceeding.",
      "{j} says {a} found {o} inside the challenge, which means she did not just show up and participate, she showed up and won the night from the inside out.",
      "The critique is simple: {j} tells {a} she did the work, she did it well, and {o} was the thing that separated her from the other queens who also did the work but did not do it like that.",
      "{j} points at {a} and says the assignment was answered — fully, specifically, with personality — and {o} was the thing that made {a}'s version of it the one the panel will remember.",
      "\"THAT is how you do it,\" {j} tells {a}. \"You took what the week gave you, you found {o} inside it, and you delivered something the rest of the cast did not — and that is why you are standing where you are standing.\"",
    ]),
    tier('fault', 'She did not do what the week asked, and everything else is decoration.', [
      "{j} tells {a} she did not do the assignment — she did something, and the something had effort in it, but the something was not the thing the week asked for, and {p} is all that is left.",
      "\"You missed the brief,\" {j} says. \"I do not know what you were doing tonight, but it was not what we asked for, and {p} was the only thing that read from this side of the stage.\"",
      "{j} says {a} decorated around the challenge instead of meeting it, and decoration without substance is costume without character, and {p} was holding it all together badly.",
      "The critique is about the miss: {j} tells {a} every other queen on that stage found the assignment and {a} found something else, and the something else was not enough, and {p} was in the gap.",
      "{j} looks at {a} and says the effort was visible but the effort was pointed in the wrong direction, and all the work in the world does not help when the work is not answering the question that was asked.",
      "\"You worked hard on the wrong thing,\" {j} says, and the gentleness is in the \"worked hard\" and the verdict is in the \"wrong thing\" — {a} brought effort and misdirected it, and {p} was the result.\"",
    ])),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — WHEN THE JUDGE IS THE REASON
// ══════════════════════════════════════════════════════════════════════
//
// `styleBias` is authored on every judge and is a real lean: Law is worth a
// fifth of a point against a camp queen before she has walked, and Michelle
// leans toward a pageant one. Small numbers, deliberately — a bias tilts a
// night, never decides it — but when it is the largest thing in a critique it
// is worth saying out loud, because the room can tell.
//
// This fires as a SHORT SECOND CLAUSE after the reason, so write it as an
// aside rather than a verdict. It lands after a line it has not seen, so it
// may not restate what the fault was — only that this judge and this kind of
// drag have never got on, or have always got on.
//
// {y} is her style. Do not make the judge sound unfair: she is not being
// unjust, she has a taste, everybody knows what it is, and she would be the
// first to say so.

const bias = (id, note, lines = []) => ({ id, note, lines: lines.slice() });

export const CRITIQUE_BIAS = [
  bias('for', 'This judge has always been sold on {y}, and here is a {y} queen.', [
    "— and everybody on that panel knows {j} has a weakness for {y}, so the praise lands with a footnote the room can read.",
    "— and {j} would be the first to admit that a {y} queen walks in with a head start, because that is what taste looks like when it is honest.",
    "— and the lean is showing: {j} lights up at {y} the way some people light up at dessert, and {a} is serving exactly that.",
    "— and the bias is public knowledge by now: {j} loves {y}, {a} brought {y}, and the score reflects the match.",
  ]),
  bias('against', 'This judge has never been sold on {y}, and everybody in the '
    + 'room including {a} knows it before {j} opens her mouth.', [
    "— and the room felt {j} sharpen the moment {a} walked, because a {y} queen has always had to work harder under this particular gaze.",
    "— and the impatience is not personal, it is taste: {j} has never been sold on {y}, and a queen bringing {y} to this stage knows the hill is steeper.",
    "— and {a} knew before the critique started that {j} and {y} have never seen eye to eye, so every note tonight carries a grain of salt the room can taste.",
    "— and the lean is as familiar as the judge: {j} arrives at {y} already unconvinced, and {a} needed to be twice as good to land at the same score.",
  ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 4 — HOW HARD SHE SAYS IT
// ══════════════════════════════════════════════════════════════════════
//
// LAW WAS ROSS WITH A DIFFERENT PET PEEVE. Every judge has an authored
// `voice` — Law's says "unimpressed by default, and he will not pretend
// otherwise to be nice", Ross's says he "cries easily and will forgive a look
// entirely for a performance that moved him" — and no critique read either of
// them. The only thing separating one judge's pan from another's was which
// dimension the engine walked them to and whose peeve got substituted in, so
// the hardest seat on the panel and the softest one said the same sentence.
//
// `warmth` is now authored on all seven and derived for a guest from her
// social stat, and this pool is what it buys.
//
// ── IT ONLY SPEAKS AT THE ENDS ────────────────────────────────────────
//
// Same principle as the style bias: a delivery clause fires only when the
// judge is genuinely at one end of the panel, because a note about HOW
// somebody spoke, attached to every critique every week, stops being a
// characteristic and becomes furniture. Most judges most weeks get nothing
// here and the reason line stands on its own.
//
// AND BLUNT PRAISE IS THE RAREST THING ON THE PANEL. A `blunt` judge saying
// something kind is worth more than a warm judge saying it, and the pool
// should know that — it is not the same beat as a blunt pan.

const deliver = (id, note, ...rest) => ({
  id, note, tiers: tiersFrom(DIRECTIONS, rest.flat()),
});

export const CRITIQUE_DELIVERY = [
  deliver('blunt',
    'THE HARD SEAT. She does not soften, does not wrap it in a joke, and does '
    + 'not care whether the queen in front of her is about to cry. Law and '
    + 'Michelle live here. The clause is about the DELIVERY, not the fault — '
    + 'the reason line has already said what was wrong.',
    'Praise from her, which almost never happens and everybody in the room knows it.', [
      "— and {j} does not give that note lightly, so the room hears it twice: once for what was said and once for who said it.",
      "— and praise from {j} is rare enough that the other judges look over, because {j} saying something kind out loud means she could not talk herself out of it.",
      "— and everybody on that panel knows {j} does not hand out compliments to be polite, so the fact that she said it at all is the compliment.",
      "— and {j} says it the way she says everything — flat, direct, no warmth in the delivery — but the words are kind, and from her that is the highest volume the praise comes in.",
      "— and {j} is not smiling when she says it, because {j} does not smile when she praises. She just says it. The room knows what it costs her to mean it.",
      "— and the fact that {j} found something worth saying out loud is the part {a} will remember, because {j} would rather say nothing than say something she does not mean.",
    ],
    'She says it flatly and does not soften it, and the flatness is the worst part.', [
      "— and {j} delivers it without flinching, without softening, without the pause that would let {a} brace for it.",
      "— and {j} does not wrap it in a joke or a qualifier. She says it the way you read a receipt: here is what happened, here is what it cost.",
      "— and the delivery is the blade: {j} says it once, says it flat, and does not check whether {a} is okay, because checking would be softening and {j} does not soften.",
      "— and {j} is not being cruel — she is being exact, which from this seat on the panel feels the same and is not.",
      "— and the room goes quiet the way it goes quiet when {j} says something true without caring how it lands, because the landing is not her problem.",
      "— and {j} says it like somebody reading a diagnosis. No malice. No gentleness. The note and nothing around it.",
    ]),
  deliver('kind',
    'THE SOFT SEAT. She finds a way in, softens the landing, and means every '
    + 'word of the kind part. Ross lives here. Careful: kind is not weak — a '
    + 'gentle pan from somebody who clearly wanted her to do well can land '
    + 'harder than a blunt one.',
    'Warm, and warm from her is not cheap: she is delighted rather than polite.', [
      "— and {j} means it, which is the thing about {j}: the warmth is never performance, so when it shows up the room trusts it.",
      "— and {j} lights up saying it, and the warmth is genuine enough that the other judges nod along before they realise they are nodding.",
      "— and the delight in {j}'s voice is not politeness — it is the sound of somebody who wanted {a} to do well and got what she wanted.",
      "— and {j} says it with the energy of somebody who has been waiting all night to say something kind and finally has a reason.",
      "— and when {j} praises, she praises with her whole face, and {a} can see that the note is not a courtesy — it is the judge who roots hardest actually being rewarded.",
      "— and {j} is beaming, and a beam from the soft seat is not cheap — it is the judge who gives the most finding something worth giving it for.",
    ],
    'She finds the kindest possible way to say it, which does not make it hurt less.', [
      "— and {j} finds the gentlest possible angle, which somehow makes the note land harder, because a pan from somebody who clearly wanted to say something nice is its own kind of devastating.",
      "— and {j} softens the delivery without softening the note, so {a} hears every word through a voice that wishes it were saying something else.",
      "— and the kindness in {j}'s voice is real, which is what makes it worse: she wanted {a} to do well, and she is telling her she did not, and the disappointment is louder than any blunt note could be.",
      "— and {j} wraps the critique in as much warmth as the truth will hold, and {a} can hear the effort it is costing her to be kind about something that was not.",
      "— and {j} is trying so hard to find something positive that the reaching is the critique — {a} can hear the judge who roots for everybody running out of things to root for.",
      "— and {j} says it gently, and the gentleness is the sharpest thing about it, because a soft voice delivering a hard note leaves nowhere to hide.",
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════════════

/** How strong a style lean has to be before it is worth naming out loud. */
export const BIAS_SPEAKS = 0.3;

/** The reason lines for this dimension and direction, or null. */
export function reasonLinesFor(dimension, direction, family = null) {
  /* THE NIGHT'S OWN WORDS FIRST. Only the `challenge` dimension varies with
     which challenge it was — the garment, the nerve and the finish ask the
     same question every week — so a family pool is consulted for that one and
     the generic tier stays as the fallback for a family nobody has written. */
  if (dimension === 'challenge' && family) {
    const c = CRITIQUE_CHALLENGE.find(x => x.family === family)
      || CRITIQUE_CHALLENGE.find(x => x.family === 'generic');
    const ct = c && c.tiers.find(y => y.id === direction);
    if (ct && ct.lines.length) return ct.lines;
  }
  const d = CRITIQUE_REASONS.find(x => x.dimension === dimension);
  const t = d && d.tiers.find(y => y.id === direction);
  return t && t.lines.length ? t.lines : null;
}

/** How far from the middle a judge has to sit before the delivery is worth saying. */
export const DELIVERY_SPEAKS = 0.25;

/**
 * The delivery clause, or null.
 *
 * Null for anybody near the middle of the panel, which is most of them — a
 * note on HOW somebody spoke, attached to every critique every week, stops
 * being a characteristic and becomes furniture.
 *
 * A guest's warmth is derived from her social stat in js/dr/judges.js, so an
 * unusually warm or unusually cold franchise alumna gets this too without
 * anybody authoring her.
 */
export function deliveryLinesFor(warmth, direction) {
  const w = Number(warmth);
  if (!Number.isFinite(w)) return null;
  const id = w <= DELIVERY_SPEAKS ? 'blunt'
    : w >= 1 - DELIVERY_SPEAKS ? 'kind' : null;
  if (!id) return null;
  const d = CRITIQUE_DELIVERY.find(x => x.id === id);
  const t = d && d.tiers.find(y => y.id === direction);
  return t && t.lines.length ? t.lines : null;
}

/**
 * The bias clause, or null.
 *
 * Null on a lean too small to mention, which is most of them — a bias is a
 * tilt and saying it out loud every week would turn every judge into a single
 * joke about one kind of drag.
 */
export function biasLinesFor(styleLean) {
  const n = Number(styleLean) || 0;
  if (Math.abs(n) < BIAS_SPEAKS) return null;
  const b = CRITIQUE_BIAS.find(x => x.id === (n > 0 ? 'for' : 'against'));
  return b && b.lines.length ? b.lines : null;
}

/** Every tier still short of its variant count. */
export function unwrittenCritiqueVoices() {
  const out = [];
  for (const d of CRITIQUE_DELIVERY) {
    for (const t of d.tiers) {
      if (t.lines.length < CRITIQUE_VARIANTS) {
        out.push(`delivery:${d.id}/${t.id} (${t.lines.length}/${CRITIQUE_VARIANTS})`);
      }
    }
  }
  for (const c of CRITIQUE_CHALLENGE) {
    for (const t of c.tiers) {
      if (t.lines.length < CRITIQUE_VARIANTS) {
        out.push(`challenge:${c.family}/${t.id} (${t.lines.length}/${CRITIQUE_VARIANTS})`);
      }
    }
  }
  for (const d of CRITIQUE_REASONS) {
    for (const t of d.tiers) {
      if (t.lines.length < CRITIQUE_VARIANTS) {
        out.push(`reason:${d.dimension}/${t.id} (${t.lines.length}/${CRITIQUE_VARIANTS})`);
      }
    }
  }
  for (const b of CRITIQUE_BIAS) {
    if (b.lines.length < 4) out.push(`bias:${b.id} (${b.lines.length}/4)`);
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function critiqueVoiceTierCount() {
  return CRITIQUE_REASONS.reduce((n, d) => n + d.tiers.length, 0)
    + CRITIQUE_CHALLENGE.reduce((n, c) => n + c.tiers.length, 0)
    + CRITIQUE_DELIVERY.reduce((n, d) => n + d.tiers.length, 0)
    + CRITIQUE_BIAS.length;
}
