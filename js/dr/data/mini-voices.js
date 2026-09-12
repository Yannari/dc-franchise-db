// ══════════════════════════════════════════════════════════════════════
// dr/data/mini-voices.js — the mini challenge, in its own words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// Third time the same bug, found the same way. This is a Werk Room Dance-Off
// — eight counts, no warning, everybody watching — and the thirteen lines
// that printed under it were about being "funny enough", getting "a laugh",
// "the timing of a person who has done this exact thing in a bar". Nobody is
// telling a joke. It is a dance-off. Those sentences were written for a
// reading challenge and they print, word for word, under a photoshoot, a quiz
// and a wig swap, because `mini-attempt` had three tiers keyed on how well she
// did and no idea what she was doing.
//
// And the same dump had two queens given the SAME LINE verbatim — Nichelle
// and Caleb, "the energy of somebody who has decided that caring too much is
// worse than caring too little", eight rows apart. That is the second half of
// the problem and it is arithmetic: this beat fires ONCE PER QUEEN, thirteen
// times, and the middle tier takes about forty per cent of them. Four variants
// cannot cover five queens. See the variant counts below — they are higher
// here than anywhere else in the show and that is why.
//
// ── WHAT THE MINI ACTUALLY KNOWS, AND NEVER SAID ──────────────────────
//
// A mini is not one thing. js/dr/data/minis.js gives every one of them an
// `interaction`, and it is the most under-used field in the show:
//
//   solo     she performs for the room. A dance-off, a photoshoot, a quick drag.
//   targets  she does a bit ABOUT another queen, TO HER FACE — and the engine
//            has recorded which queen since the day it was written. Three of
//            the seven minis work this way and no line has ever named the
//            person she went after.
//   pairs    the room splits and her result depends partly on what her partner
//            did for her.
//
// So a `targets` mini's prose gets `{b}` and must use it. "She reads the room"
// is not what happens in a reading challenge; she reads ONE QUEEN, who is
// standing there, and the two of them still have to work together tomorrow.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON. This is the werk room with a camera in it, and the register is
// already set by the rest of the werk room: intimate, funny, quick. A mini is
// the light relief before the maxi and it should read that way — but it is
// also the first time the room finds out what somebody can do.
//
// Placeholders:
//   {a}  the queen performing. Available in every attempt and win tier.
//   {b}  WHO SHE WENT AFTER, or her partner. Legal ONLY in a mini whose
//        `cast` below is 'targets' or 'pairs', and in those it should be used
//        in most lines — it is the whole point. Rejected everywhere else.
//   {c}  the mini, by name, e.g. Werk Room Dance-Off.
//
// SAY WHAT SHE IS PHYSICALLY DOING. That is the instruction. A `nailed` on a
// dance-off is eight counts of something the room did not know she had; on a
// photoshoot it is one frame with a bucket of water hitting her and her face
// still right; on a reading challenge it is one sentence about {b} that takes
// the whole room out. A line that would print under any of the seven is a line
// that has not been written yet.
//
// Same rules as every other pool, all enforced by tests: no real people, this
// show's vocabulary only, never quote a stat by number, prose rather than
// captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The three cuts, best to worst. These are `MINI_TIERS` in js/dr/stage.js. */
export const MINI_TIER_IDS = ['nailed', 'decent', 'flat'];

/**
 * AND THE PASS, which is only possible in a targeting mini.
 *
 * The worst thing that happens in a library is not a bad read — it is a queen
 * who stands up, opens her mouth, and has nothing. The pool's floor was "a
 * read that did not land", so the moment everybody remembers could not
 * happen. `passed` is rare and earned: the engine only sets it when she is
 * genuinely under, not on a flat roll.
 */
export const MINI_PASS_ID = 'passed';
/**
 * Build tiers from whatever shape the author used.
 *
 * A HELPER THAT ONLY TAKES NOTES CANNOT BE FILLED. The pick pool in
 * maxi-voices.js shipped that way and the file stopped parsing the first time
 * somebody wrote prose into it, because there was nowhere for the lines to go
 * and they had to break out of the helper to put them somewhere. Same shape,
 * same trap, so the same tolerance: notes, note-and-lines pairs, and
 * already-built tiers, mixed freely and in tier order.
 */
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


/**
 * HOW MANY VARIANTS EACH TIER NEEDS, and it is not four.
 *
 * `mini-attempt` fires once per living queen — thirteen times in a premiere —
 * and the tiers split the field roughly 30 / 40 / 30. So the middle tier is
 * asked for five distinct lines in a single episode and the outer two for four
 * each, and a four-variant pool is guaranteed to repeat. It did: the dump that
 * built this file printed one line twice in the same mini.
 *
 * The draw is without replacement within an episode, so hitting these numbers
 * removes the repeat entirely rather than making it less likely.
 */
export const MINI_VARIANTS = {
  announce: 4, nailed: 6, decent: 8, flat: 6, win: 4, passed: 4,
};

/**
 * One mini's whole voice.
 *
 * `cast` mirrors `interaction` in js/dr/data/minis.js and decides whether {b}
 * is legal. It is restated here rather than imported so the writer can see it
 * next to the lines, and a test checks the two files agree.
 */
const MINI_TIER_ORDER = ['announce', 'nailed', 'decent', 'flat', 'win'];

/* AND `passed` ONLY WHERE PASSING IS A THING. A queen can stand up in the
   library with nothing to say; she cannot "pass" a dance-off — she dances
   badly, which is what `flat` is. Adding the tier to every mini gave four
   solo pools a tier with no note and nothing to write in it. */
/* ── TWO MINIS HAVE NO ATTEMPT TO TIER ──
   `nailed / decent / flat` is a queen doing a thing and being scored on it,
   and Spill the T and Guess Who are not that. The host asks the ROOM a
   question and the room answers: nobody performs, so there is nothing to rank
   and the three attempt tiers have no meaning. That is why both shipped with
   no voice at all while every other mini got one, and why the coverage guard
   had been red on `guess-who` since the mini was built.
   What they do have is a per-round outcome the engine already decides — how
   much the answer STINGS on a vote, and whether anybody knew on a guess — so
   the tiers are those, and the lines hung on them are what the room SAYS
   about it. See docs/PROSE-PROMPT-dr-round-minis.md. */
const ROUND_TIER_ORDER = {
  vote: ['announce', 'brutal', 'pointed', 'harmless', 'win'],
  guess: ['announce', 'nobody', 'some', 'win'],
};
export const ROUND_CASTS = new Set(Object.keys(ROUND_TIER_ORDER));

const mini = (id, name, cast, note, ...rest) => ({
  id,
  name,
  cast,
  note,
  tiers: tiersFrom(
    ROUND_TIER_ORDER[cast]
      || (cast === 'targets' ? [...MINI_TIER_ORDER, 'passed'] : MINI_TIER_ORDER),
    rest.flat(),
  ),
});

const T = (...args) => args;

export const MINI_VOICES = [
  mini('reading', 'Reading Is Fundamental', 'targets',
    'THE LIBRARY, AND THE LINE IS THE READ. She stands up, the host has just '
    + 'called her name, and she says ONE THING about {b}, to her face, in '
    + 'front of everybody. So the line is not a description of a read — it IS '
    + 'the read, in quotation marks, in her mouth, followed by what the room '
    + 'did with it. A line like \"{a} reads {b} beautifully\" is the thing this '
    + 'pool exists to replace. Funny rather than cruel: a read that lands is a '
    + 'friendship that survives it, and a read that misses is a grudge.',
    [
      tier('announce', 'The library opens and the host explains the only rule: make it funny.', [
        'The host opens the library and the room shifts — everybody loves {c} and everybody is afraid of it, because the rule is simple and the rule is merciless: be funny or be the one who was not funny, in front of everybody.',
        '\"It is time for {c}!\" The host announces it and half the room grins and the other half swallows, because a reading challenge is a room full of queens about to say the worst thing they can think of about each other and hoping it lands as comedy.',
        'The host explains {c} the way the host always explains it — one rule, no exceptions. Read her. Make it funny. If it is not funny it is just mean, and mean without a punchline is the fastest way to make an enemy in a room you still have to live in.',
        '{c} is announced and the werk room divides instantly into queens who have been preparing a read since the first day and queens who are right now trying to think of one, and the gap between those two groups is about to become very public.',
      ]),
      tier('nailed', 'One sentence about {b} and the room is gone. Nobody recovers for a minute.', [
        '\"{b}. Sweetheart. Your drag is so old your wigs have osteoporosis.\" The room folds in half. {b} is laughing too hard to defend herself, which is the only correct response.',
        '\"{b}, your idea of a wardrobe is one swimsuit in four different colours.\" {a} sits down immediately, which is the professional move, and the screaming goes on without her.',
        '\"{b}, everybody calls you a triple threat. I have been trying all week to find the other two.\" One queen has to put her head on the table. {b} says \"I hate you\" and means the opposite.',
        '\"{b}, I love your confidence. I would love it more if it came with anything.\" It is over. {a} has won the library with eleven words and everybody in the room knows it.',
        '\"{b}, you say you are a pageant queen. Which pageant? Where? Was anybody there?\" The specificity is what kills. {b} covers her face with both hands.',
        '\"{b}, you told us on day one you were here to win. Just to be clear — win what?\" {a} delivers it kindly, which makes it so much worse, and the room does not recover for a full minute.',
        { angle: 'the-frontrunner', line: '\"{b}, you have won so many challenges I am starting to think the judges owe you money.\" {b} tries to wave it off but her grin gives her away. The room screams.' },
        { angle: 'the-frontrunner', line: '\"{b}, at this point we are all just competing for second place. And some of us know it.\" {a} gestures at the room and every queen in it laughs because every queen in it was thinking it.' },
        { angle: 'the-frontrunner', line: '\"{b}, I want to congratulate you on your wins. All of them. I brought a list but we do not have time.\" {b} puts her face in her hands and the room falls apart.' },
        { angle: 'the-frontrunner', line: '\"{b}, you are so good at drag that the rest of us have started a support group. We meet on Tuesdays.\" The room howls. {b} blows her a kiss.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, you have lip synced so many times the DJ knows your shoe size.\" The room screams. {b} covers her mouth but she is laughing.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, at this point the bottom two is not a punishment, it is your address.\" {a} delivers it deadpan and the room goes from zero to screaming in one second.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, every week you survive a lip sync and every week you look surprised about it. Girl, you have a season pass.\" {b} slaps the table laughing.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, you know that spot on the stage where they put the bottom two? They should name it after you. Put a little plaque down.\" The room folds.' },
        { angle: 'never-won', line: '\"{b}, the judges love your work. They told me. They just have not told you.\" The simplicity of it is what kills. {b} laughs so hard she cannot breathe.' },
        { angle: 'never-won', line: '\"{b}, you have been safe so many times I thought safe was your drag name.\" {a} sits down and the screaming starts.' },
        { angle: 'never-won', line: '\"{b}, I keep waiting for the judges to call your name and then I remember — they keep calling it. They just keep saying safe after.\" The room erupts.' },
        { angle: 'never-won', line: '\"{b}, some queens collect wins. You collect participation.\" Short, clean, devastating. {b} drops her head onto the table.' },
        { angle: 'brand-new', line: '\"{b}, I have known you for two days and I already have material. That should worry you.\" {b} laughs but the worry is real and everybody sees it.' },
        { angle: 'brand-new', line: '\"{b}, we just met and honestly? I have concerns.\" {a} says nothing else. The nothing else is the joke and the room gives it up.' },
        { angle: 'weak-design', line: '\"{b}, I saw your garment on the rack and I thought it was the fabric they had not cut yet.\" The room screams. {b} mouths \"it was not that bad\" and nobody agrees.' },
        { angle: 'weak-design', line: '\"{b}, I have seen better sewing on a pillow from a hotel room.\" {a} mimes stuffing a pillow. {b} is laughing too hard to object.' },
        { angle: 'weak-dance', line: '\"{b}, every time you dance the music gets confused.\" Short and precise. The room erupts because they have all seen it.' },
        { angle: 'weak-dance', line: '\"{b}, you dance like you are trying to remember where you parked.\" {b} screams and points at {a} and the pointing is the concession.' },
        { angle: 'weak-singing', line: '\"{b}, I heard you rehearsing through the wall and I want to say thank you — for stopping.\" {b} gasps and the gasp turns into a laugh and the laugh takes the room with it.' },
        { angle: 'weak-singing', line: '\"{b}, your singing voice is so unique that nobody else has ever made that sound. Including animals.\" The room dies. {b} cannot argue.' },
        { angle: 'weak-comedy', line: '\"{b}, you told a joke yesterday and the room was so quiet I could hear the air conditioning.\" {b} winces and then laughs because the read is better than anything she managed.' },
        { angle: 'weak-comedy', line: '\"{b}, you are funny. Not on purpose, but you are funny.\" Short, kind enough to survive, and the twist does all the work. The room gives it up.' },
        { angle: 'weak-acting', line: '\"{b}, I saw your scene and I could not tell if you were acting or if something was wrong.\" {b} puts both hands over her face and the room screams.' },
        { angle: 'weak-acting', line: '\"{b}, you gave that scene everything you had and it still was not enough. But you looked great standing there.\" {b} dies laughing because the compliment at the end is the real knife.' },
        { angle: 'weak-runway', line: '\"{b}, your runway is always a surprise. Not a good surprise. The kind of surprise where you check if you locked the door.\" The room screams.' },
        { angle: 'weak-runway', line: '\"{b}, I love that you walk the runway like nobody is watching. Because after last week I understand why.\" {b} gasps, laughs, and points at {a}.' },
      ]),
      tier('decent', 'A decent read. {b} laughs, which is the correct answer either way.', [
        '\"{b}, that look you wore yesterday? I have thoughts. Mostly medical.\" Good laugh, honest laugh, and {b} takes it the way it was meant.',
        '\"{b}, you are so talented. At things we have not seen yet.\" It lands, the room gives it up, and {a} sits down.',
        '\"{b}, I would read you but I do not want to be the third person this week.\" A cheat, and the room forgives it because it is funny about the room rather than about {b}.',
        '\"{b}, your makeup was beautiful today. From very far away. In the dark.\" {b} points at her and laughs. A solid read nobody will quote tomorrow.',
        '\"{b}, do you ever get tired? Because I get tired.\" Not the sharpest but the timing carries it.',
        '\"{b}, you are the reason the rest of us look prepared.\" Half the room laughs and the other half winces.',
        '\"{b}, I have never seen somebody work so hard to arrive in second.\" A good line rushed slightly, and rushing it costs her the top of the room.',
        '\"{b}, congratulations on your drag. Genuinely. However you got there.\" {b} laughs. So does everybody. Nobody screams.',
        { angle: 'the-frontrunner', line: '\"{b}, at this point you should just judge the rest of us.\" It gets a laugh. It is the obvious read and everybody thought of it, but {a} said it first.' },
        { angle: 'the-frontrunner', line: '\"{b}, congratulations on winning. Again. As usual.\" The room chuckles. It is not sharp but it is accurate and accuracy counts.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, they keep putting you in the bottom and you keep surviving. You are like a cockroach but with better wigs.\" {b} laughs and waves it off.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, you have lip synced so much you should charge for tickets.\" A decent laugh. {b} nods like she has heard it from herself already.' },
        { angle: 'never-won', line: '\"{b}, you are consistent. Consistently safe.\" It lands. It is not the sharpest read but it is the truest one and truth does half the work.' },
        { angle: 'never-won', line: '\"{b}, you do great work and the judges have noticed. They write it down and then they call somebody else.\" A good laugh and a wince from {b}.' },
        { angle: 'brand-new', line: '\"{b}, I need more time. Come back next week and give me something to work with.\" The room laughs. {b} shrugs because she has been here two days and cannot argue.' },
        { angle: 'brand-new', line: '\"{b}, you have been here two days and you already have a catchphrase. The catchphrase is asking where things are.\" A real laugh from the queens who sit near {b}.' },
        { angle: 'weak-design', line: '\"{b}, I saw your garment and I could not tell which way was up. I mean that literally.\" {b} laughs and nods because she knows exactly which garment.' },
        { angle: 'weak-design', line: '\"{b}, your sewing is... brave. That is the nicest word I have.\" A decent laugh. {b} accepts it.' },
        { angle: 'weak-dance', line: '\"{b}, I have seen you dance. I have also seen traffic.\" The room gives it a laugh. Not the biggest but earned.' },
        { angle: 'weak-singing', line: '\"{b}, your singing is what happens when confidence meets the wrong key.\" A real laugh. {b} shrugs because she knows.' },
        { angle: 'weak-comedy', line: '\"{b}, you told a joke last week and I laughed. The next day. When I finally got it.\" {b} nods and smiles. It is fair.' },
        { angle: 'weak-acting', line: '\"{b}, your acting has one speed and that speed is confused.\" A laugh from most of the room. {b} opens her mouth to argue and then closes it.' },
        { angle: 'weak-runway', line: '\"{b}, your runway is always... a choice. And choice is a generous word.\" {b} laughs and does a little curtsy.' },
      ]),
      tier('flat', 'It comes out mean instead of funny, or it does not come out at all.', [
        '\"{b}, you are just not very good.\" No joke in it. The room hears that and the silence costs {a} more than it costs {b}.',
        '\"{b}, nobody here likes you.\" It is not a read, it is a sentence, and two queens wince. {a} realises halfway through and cannot stop.',
        '\"{b}, your look yesterday was ugly and your look today is ugly.\" Cruel without a punchline. The room gives her nothing.',
        '\"{b}, remember when — no, sorry, hold on.\" {a} has the shape of a read and none of the words. She reaches the end with nothing at the end of it.',
        '\"{b}, at least you are trying.\" Delivered like a punchline that never arrives. One person laughs out of kindness.',
        '\"{b}, I will not say what I want to say.\" The room waits. She does not say it. A read she refuses to finish is a read she did not have.',
        { angle: 'the-frontrunner', line: '\"{b}, you win too much.\" That is the whole read. The room waits for the turn and there is no turn. {a} sits down to silence.' },
        { angle: 'the-frontrunner', line: '\"{b}, must be nice winning everything.\" It comes out bitter instead of funny and {b} raises an eyebrow and the room sides with {b}.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, you are always in the bottom.\" The room waits for a punchline. {a} thinks that was the punchline. It was not.' },
        { angle: 'been-in-the-bottom', line: '\"{b}, maybe stop losing.\" It is advice, not comedy. {b} stares at her and the stare wins the exchange.' },
        { angle: 'never-won', line: '\"{b}, you have never won anything.\" True. Not funny. The room gives {a} the silence of a fact delivered as a joke that is not one.' },
        { angle: 'never-won', line: '\"{b}, the judges do not know your name.\" It lands mean and {b}\'s face tightens and {a} can see she has made an enemy, not a joke.' },
        { angle: 'brand-new', line: '\"{b}, I do not even know who you are.\" It is supposed to be the joke and it just sounds rude. {b} nods slowly and the room is on {b}\'s side.' },
        { angle: 'brand-new', line: '\"{b}, you just got here and... that is all I have.\" {a} shrugs. The room gives a sympathy laugh and sympathy is the wrong currency in a library.' },
        { angle: 'weak-design', line: '\"{b}, I saw your garment and I thought somebody left their laundry on the rack.\" It is mean enough to sting but there is no turn in it and the room gives a polite laugh at best.' },
        { angle: 'weak-dance', line: '\"{b}, you cannot dance.\" {a} delivers it like a punchline but a fact is not a punchline and {b} shrugs it off.' },
        { angle: 'weak-singing', line: '\"{b}, do not sing.\" The room laughs a little but the laugh is at {a} for having nothing sharper. {b} looks relieved.' },
        { angle: 'weak-comedy', line: '\"{b}, you are not funny.\" Said by a queen who is also not being funny. The room feels the irony and {a} does not.' },
      ]),
      tier('passed', 'She stands up with nothing and the room watches her find that out.', [
        '{a} stands up, looks straight at {b}, opens her mouth — and nothing arrives. \"I... pass.\" She sits down.',
        '\"{b}. {b}. Okay. {b} is...\" {a} tries three openings, abandons all of them, and says \"I have nothing.\"',
        '{a} gets as far as {b}\'s name and stalls. The pause goes past funny and out the other side. \"Next,\" she says, and the host moves on.',
        'She had one prepared and it has gone. {a} stands there searching for it, then laughs at herself and passes.',
        { angle: 'the-frontrunner', line: '\"So, {b}, you keep winning and I keep...\" {a} trails off. She had the set-up and no punchline. \"Pass.\" The room moves on.' },
        { angle: 'been-in-the-bottom', line: '{a} starts with \"{b}, you have been in the bottom...\" and cannot find where the joke goes. She waves her hand and sits down. The read was there and she could not get to it.' },
        { angle: 'never-won', line: '{a} points at {b} and says \"{b}, you have never...\" and stops. She knows the fact but she cannot make it a joke. \"Pass,\" she says, and sits down.' },
        { angle: 'brand-new', line: '{a} looks at {b} and realises she has nothing because she does not know {b} well enough to read her. \"I literally do not know you,\" she says. It is honest and it is zero points.' },
        { angle: 'weak-design', line: '{a} starts with \"{b}, your sewing is...\" and trails off because she cannot find the turn. She had the topic and not the joke. \"Pass.\"' },
        { angle: 'weak-singing', line: '{a} opens with \"{b}, your singing...\" and the room leans in expecting a punchline that does not come. {a} shakes her head and sits down.' },
      ]),
      tier('win', 'She had the sharpest tongue in the room and everybody now knows it.', [
        '{a} wins the library and the win is not close. She read {b} into the floor and the room has not stopped talking about it, and now she gets to decide something about the maxi on top of that.',
        'The host does not have to think about it. {a} takes {c} and the queens applaud in the specific way a room applauds somebody who was genuinely, unarguably the funniest person in it.',
        '{a} takes the library and the reaction is half admiration and half recalculation, because a queen who is that quick with a microphone is a queen who is going to be quick at everything else too.',
        'It is {a}, and it was {a} from the third read onward. She collects the win with the composure of somebody who knew what she had before she stood up.',
      ]),
    ]),
  mini('puppets', 'Puppet Parody', 'targets',
    'She is handed a puppet of {b} and has to BE her — the voice, the walk, the '
    + 'thing {b} says twenty times a day and does not know she says. Played to '
    + '{b}\'s face while {b} watches.',
    [
      tier('announce', 'Everybody gets a puppet of somebody else and has to play her.', [
        'The host wheels out a rack of puppets and the room erupts — everybody knows what {c} is and everybody knows the queen who gets their puppet is about to show them something about themselves they cannot unsee.',
        '"It\'s {c}!" Puppets come out, each one a caricature of somebody in the room, and the queens scramble to find out which queen they drew and whether that queen is somebody they have been watching closely enough to become.',
        'The host announces {c} and every queen in the room starts doing math — who have they been studying, who have they been sitting next to, who has a catchphrase they can land with a felt mouth and a hand up its back.',
        '{c} is announced. Puppets are distributed. Each queen looks at the puppet she has been handed and either grins because she knows exactly what to do or panics because she has somehow spent weeks in the same room as {b} and has nothing.',
      ]),
      tier('nailed', 'The impression is so exact that {b} puts her hands over her face.', [
        '{a} picks up the puppet and becomes {b} — the walk, the voice, the phrase {b} says at the mirror station every single morning without knowing she says it — and {b} is across the room with her hands over her face because she has just been shown herself and it is devastating and hilarious.',
        'The voice is right. The posture is right. The thing {a} does with the puppet\'s hands is something {b} does with her own hands and has never once noticed, and now the entire room is looking at {b} to confirm it, and {b} is dying.',
        '{a} holds the puppet up and delivers a performance so specific to {b} that the room forgets they are looking at felt and foam. {b} is screaming. The other queens are screaming. The impression found the thing about {b} that is truest and funniest and used it.',
        'It is not an impersonation so much as an autopsy — {a} dissects {b}\'s mannerisms, her catchphrases, the way she flips her hair before she disagrees with anybody, and {b} watches from three feet away with the expression of somebody who has just been told what they look like from the outside.',
        'The puppet looks like {b} but the voice coming out of {a}\'s mouth IS {b}, and {b} knows it, and the room knows it, and the moment when {b} starts laughing at herself instead of defending herself is the moment {a} wins the room.',
        '{a} channels {b} so accurately through felt and foam that the queens on either side of {b} are pointing at her and howling, because every single mannerism is correct, and {b} cannot argue with any of it.',
      ]),
      tier('decent', 'She finds one thing {b} does and does it, and one thing is enough.', [
        '{a} finds one thing about {b} — a phrase, a gesture, the way she stands when she is about to disagree — and commits to it hard enough that the puppet bit works. Not the funniest in the room, but a real observation delivered with enough conviction to land.',
        'The puppet version of {b} has one good bit and {a} rides it the whole way through. {b} laughs and points at {a} and the laugh is genuine, which is all a decent puppet performance needs — the target has to admit it.',
        '{a} goes for {b}\'s most obvious mannerism and does it well enough that the room laughs. It is not a deep cut but it is an accurate one, and an accurate obvious thing is better than an inaccurate subtle one every time.',
        'A solid puppet performance — {a} found something real about {b}, committed to the voice, and made it through without the room losing interest. {b} nods at the end, which is the nod of a queen who has been impersonated competently and cannot be mad about it.',
        'The impression has one strong angle and {a} pushes it for everything it is worth. {b} watches with the half-smile of a queen who knows she has been clocked but also knows it could have been worse.',
        '{a} gets a genuine reaction from {b} and a laugh from the room, which means the puppet bit worked. The impersonation is not a demolition but it is a real observation wrapped in a felt body, and that is exactly what {c} is asking for.',
        '{a} grabs the puppet and leans into the one thing she has noticed about {b} all season. It gets a laugh, {b} waves it off with a grin, and the room moves on to the next queen knowing {a} did her job.',
        'Not the read of the century, but {a} finds a hook — something {b} does or says — and builds the puppet bit around it. The room makes noise. {b} shakes her head while laughing. A clean, middle-of-the-pack puppet set.',
      ]),
      tier('flat', 'The puppet is a voice she cannot do about a person she has not watched.', [
        '{a} picks up the puppet and opens her mouth and what comes out is not {b} — it is a generic impression of a generic queen, and {b} watches it with the patient expression of somebody who knows they are not being seen.',
        'The voice is wrong and the material is thinner than the felt, and {b} sits through an impression of herself that could be an impression of anybody. {a} can feel the room not laughing and pushes harder, which makes it worse.',
        '{a} has not been watching {b}. That becomes obvious in the first sentence, because the puppet says nothing specific, does nothing {b} actually does, and {b} is sitting right there knowing it.',
        '{a} tries a voice that is not {b}\'s voice, makes a joke that is not about {b}, and finishes the puppet set to polite silence from a room that has just watched somebody impersonate a person they have apparently never met.',
        'The puppet hangs in {a}\'s hand like what it is — felt and foam — because {a} cannot find anything to do with it. {b} watches from across the room without recognition, which is the worst outcome a puppet set can have.',
        'It is clear from the first three seconds that {a} does not have a take on {b}. The puppet flails, the voice wanders, and the room gives {a} the silence of queens who are grateful they drew a different puppet.',
      ]),
      tier('passed', 'She has the puppet and no voice to put in it. She holds it up, says nothing anybody can use, and hands it back.', [
        '{a} picks up the puppet of {b} and holds it up and opens her mouth and what comes out is {a}\'s voice, not {b}\'s, saying nothing in particular about anyone. She moves the puppet\'s mouth twice, producing silence that has a felt body attached to it, and puts it down. \"I do not have one,\" she says, and the room believes her.',
        'The puppet goes up and {a} stares at it like she is meeting {b} for the first time, which is what it looks like when a queen has spent weeks in the same room as somebody and observed nothing. She tries a voice. The voice is hers. She tries a mannerism. The mannerism is also hers. She puts the puppet on the table and says \"next\" before the host has to.',
        '{a} holds the puppet of {b} in front of her face and says three words that could be about any queen in any room, and {b} watches from across the table with the specific patience of a queen who was expecting to be clocked and instead was ignored. {a} puts the puppet down and shrugs, which is its own kind of confession.',
        'Nothing. {a} picks up the puppet, looks at {b}, looks back at the puppet, and produces a silence that tells the room she has no impression, no angle, no material. She makes the puppet wave, which gets a sympathy laugh and nothing else, and hands it back with the energy of a queen returning something she borrowed and never used.',
      ]),
      tier('win', 'She saw {b} more clearly than {b} sees herself, and made it funny.', [
        '{a} wins {c} and the win is deserved — she took a felt puppet and made it more {b} than {b} has ever been, and the room is still quoting lines from the set while the host hands out the prize.',
        'The host announces {a} as the winner and the room agrees, because {a} turned a puppet into a person and that person was {b}, rendered so accurately that {b} spent the whole set alternating between horror and hysterical laughter.',
        '{a} takes {c} because she saw every queen she impersonated more clearly than they see themselves, and the gap between her puppet work and the runner-up was the gap between observation and guesswork.',
        '{a} won {c} and everybody in the room knows which line did it — the moment {a} made the puppet do the thing {b} does, the thing {b} has done every day in the werk room and never noticed, and {b} finally saw it and could not stop laughing.',
      ]),
    ]),
  mini('quick-drag', 'Quick Drag', 'solo',
    'A full look, face and all, against a clock that is far too short. Not a '
    + 'performance — a race, in silence, with everybody visibly panicking at '
    + 'their own station.',
    [
      tier('announce', 'A full look, start to finish, on a clock nobody thinks is fair.', [
        'The host announces {c} and reads the clock out loud. Half the room laughs. The other half does not, because a full face and a full look in that time means skipping steps they have never skipped.',
        '{c} — a full look, head to toe, face painted and outfit assembled, on a timer that was designed to be too short. The queens look at the clock, look at their stations, and start doing triage on which parts of their face they are willing to skip.',
        'The host sets the clock for {c} and the room goes quiet. Every queen is staring at the timer and doing the same math: what can she cut and still look finished.',
        '"It\'s {c}!" The clock starts and every queen in the room is suddenly moving faster than anyone has seen them move. No blending, no second passes, no fixing mistakes — just speed and instinct.',
      ]),
      tier('nailed', 'Finished, painted and standing there before the clock stops.', [
        '{a} is done. The clock is still running and she is standing at her station with a full face and a full look. She has clearly done this before — probably in a bathroom with a broken lock and a gig in twenty minutes.',
        'The timer has not stopped and {a} is already standing back from the mirror, arms crossed, painted and styled. She watches the other queens still working and does not hide the fact that she is watching.',
        '{a} puts the brush down with time to spare and turns around. The face is done — not rushed, not half-blended, done. The queens on either side of her are still contouring.',
        'Finished. {a} is standing in a complete look while the clock is still counting and the queens around her are still painting. The gap is visible to everybody, especially the queens on the wrong side of it.',
        'The clock stops and {a} has been ready for a full fifteen seconds. Her look does not appear to have been built in a panic, which in {c} is harder than the speed itself.',
        '{a} steps back from the mirror and the look is finished — wig, face, outfit, all of it — and the room makes a noise because the clock still has time on it, which should not be possible and yet there she is.',
      ]),
      tier('decent', 'She gets there. Something is unfinished and she is standing in front of it.', [
        '{a} makes the buzzer and she is standing in a look that reads as complete from the front, which is all {c} is asking for. The blend is not perfect and she knows it, but the blend is not what the judges are looking at — the overall impression is, and the overall impression works.',
        'The clock stops and {a} is standing in something — not her best, not her worst, but a look she assembled under pressure and can stand behind. One eye is slightly more blended than the other. Nobody will mention it unless they are looking for it.',
        '{a} finishes as the buzzer sounds and the look is there — a recognizable drag face on a body wearing clothes that go together. It is not the look she would have built with an hour, but it is a look she built with the time she had, and it holds up from arm\'s length.',
        'She made it. {a} is standing in a completed look when the clock stops, and the look is serviceable — the wig is on, the face is painted, the outfit matches. It is the kind of result that survives a glance and rewards nobody who stares, and in {c} that is passing.',
        'The timer runs out and {a} is there, upright, in drag, with a face that reads and a look that coheres, and that is the entire ask of {c}. She will not win on polish but she will not lose on effort.',
        '{a} puts the last thing in place as the buzzer goes and steps back to reveal a look that is ninety percent of what she wanted — the missing ten percent is something she decided to skip when the clock hit thirty seconds, and it was the right call.',
        '{a} is standing when time is called and the look holds together. The wig could be better, the contour could be sharper, but the silhouette is correct and the face reads from the back of the room, which is where the host is standing.',
        'A completed look from {a} — not flawless, but finished, which is the bar that {c} sets and the bar that most queens clear on nerve rather than speed.',
      ]),
      tier('flat', 'Time runs out on a half-built look and she has to present it anyway.', [
        'The buzzer sounds and {a} is standing at her station with one eye done and the other eye not done and a wig that is not quite on, and the room can see every single second she ran out of.',
        '{a} is not finished. The clock stops and she puts her hands down and turns around and the look is a look that stopped happening in the middle of happening, and presenting it requires the kind of bravery that {c} was not supposed to test.',
        'Time runs out and {a} has a face that is halfway between two ideas and an outfit that committed to neither of them, and she stands there in the wreckage of a look that needed three more minutes it was never going to get.',
        'The buzzer catches {a} mid-contour, and mid-contour is where she stays. She turns around and shows the room what a queen looks like when the clock is the enemy and the clock won.',
        '{a} puts the brush down when the buzzer goes and the brush still had work to do, and now the work it was going to do is visible as the work it did not do, and {a} has to stand in that.',
        'The clock stops and {a}\'s look stops with it — half-wigged, half-painted, wearing an expression that says she knew this was coming and could not stop it from coming anyway.',
      ]),
      tier('win', 'She built a whole look in the time everybody else needed for a face.', [
        '{a} wins {c} and the win is a statement about preparation — she built a full look in the time most queens needed for a mug, and the look does not have the fingerprints of panic on it, which is the difference between fast and ready.',
        'The host calls {a} as the winner of {c} and the room does not argue, because everybody watched her finish early and everybody is still looking at a face that should not have been possible in the time allotted.',
        '{a} takes {c} because she treated the timer as a boundary, not a crisis, and built a look inside it that would have been competitive without the time constraint, which is the only way to win a speed challenge — by making speed look optional.',
        '{a} won {c} and the look she built in a panic is better than looks some queens build with an afternoon, and the room knows it, and the walk back to her station has the energy of somebody who has been underestimated about the wrong thing.',
      ]),
    ]),
  mini('photoshoot', 'Photoshoot Mini', 'solo',
    'One frame each, with something going wrong IN SHOT on every take — water, '
    + 'wind, something thrown. The face has to stay right while it happens.',
    [
      tier('announce', 'One frame each, and something goes wrong in every single one of them.', [
        'The host announces {c} and the camera is already set up, which means every queen in the room is about to discover what her face does when something unexpected hits it mid-pose, and the camera is going to capture whatever that is.',
        '{c} — one shot each, no reshoots, and the host mentions casually that there will be obstacles. The queens look at the set and try to figure out what is about to be thrown at them, sprayed at them, or dropped on them.',
        'The host explains {c} and the rules are simple: pose, hold it, and deal with whatever happens next without losing the face. The camera does not care about excuses and the shutter does not wait for recovery.',
        '"It\'s time for {c}!" The set is lit, the camera is loaded, and somewhere just off frame there is a fan, or a hose, or a bucket, or something worse, and the queens are about to find out which one.',
      ]),
      tier('nailed', 'It hits her mid-frame and the face does not move. That is the shot.', [
        'Water hits {a} in the face and her expression does not change — not the jaw, not the eyes, not the angle of the chin. The camera fires and the frame is a queen who looks like she expected to be drenched and planned for it, and the shot is the best one taken today.',
        '{a} is mid-pose when the obstacle hits and she absorbs it without blinking, without flinching, without breaking whatever the face was doing before it happened, and the camera catches a queen who appears to be posing in chaos voluntarily.',
        'The thing hits her and she stays. {a} holds the pose through whatever just happened to her body and the camera takes a picture of a queen who did not move, and the picture is better than any picture taken of a queen who was not hit with anything.',
        'Wind, water, confetti — it does not matter what hit {a} because {a}\'s face did not acknowledge it. The shutter fires and the frame is a queen in the middle of an obstacle looking like she chose to be there, which is the entire job of {c}.',
        '{a} takes the hit mid-pose and the hit makes the photo better, not worse, because the obstacle gave the shot motion and drama and {a}\'s face gave it composure, and the combination is the best frame of the day.',
        'Whatever they threw at {a}, she wore it. The camera fires and the shot is a queen standing in the wreckage of a surprise with an expression that says she has modeled through worse, and the shot is stunning.',
      ]),
      tier('decent', 'She gets a usable frame out of it, eventually, and knows which one.', [
        '{a} flinches and recovers, and the recovery is fast enough that the camera catches her on the way back to the pose rather than on the way out of it, and the resulting frame is not perfect but it is usable and it reads as intentional.',
        'The obstacle hits and {a} breaks the pose for half a second and then puts it back together, and the frame the camera takes is the frame of a queen who was surprised and dealt with it rather than a queen who was never surprised at all.',
        '{a} takes the hit and the face moves, but the body stays, and the frame has enough of the original pose in it to read as a photograph rather than a candid shot of somebody being attacked. A usable shot from a queen who had to work for it.',
        'She gets hit, she adjusts, and the frame that comes out of it is a queen who pivoted mid-obstacle and found a new angle that works. Not the angle she walked in with, but an angle that holds up on camera.',
        'The obstacle lands and {a} is visibly dealing with it, but dealing with it well — the face recovers, the body finds a line, and the camera takes a frame that could be printed without apology.',
        '{a} does not hold the original pose through the obstacle, but she finds a second pose inside the chaos, and the second pose is good enough. The camera catches a queen adapting, and adapting well reads better than freezing.',
        'A solid frame from {a} — not the shot of the day, but a shot of a queen who took a hit and made it look like she was posing with it rather than surviving it, and in {c} that distinction is the whole game.',
        'The camera fires and the shot shows {a} mid-recovery from whatever just happened to her, and the recovery is photogenic enough that the frame works. Not a model\'s frame, but a performer\'s frame, and the difference is the difference between stillness and survival.',
      ]),
      tier('flat', 'She flinches, and the camera has already taken the picture.', [
        '{a} flinches. The camera fires while the flinch is happening and the frame is a queen with her eyes closed and her chin tucked and the posture of a person who has just been startled, and the frame is not going to improve because the frame has already been taken.',
        'The obstacle hits {a} and her body does what bodies do — it ducks, it turns, it closes its eyes — and the camera captures all of it, and none of it is a pose, and none of it is a photograph anybody would choose to print.',
        '{a} sees it coming and cannot stop herself from reacting to it, and the reaction is a flinch, and the camera takes a picture of the flinch, and the flinch is the shot, and the shot is not the shot {a} wanted.',
        'Water hits {a} in the face and she gasps and the gasp becomes the frame, and the frame is a queen caught mid-surprise with the expression of somebody who forgot there was a camera in the room.',
        'The camera fires at the exact moment {a} breaks, and the frame has the energy of a person being startled rather than a queen being photographed, and the gap between those two things is the gap {c} is measuring.',
        'It hits her and she moves, and the movement is away from the camera and away from the pose and into the posture of a person who was not ready, and the camera does not forgive people who are not ready.',
      ]),
      tier('win', 'She has been photographed her whole life and it shows in one frame.', [
        '{a} wins {c} and the winning frame is a frame that does not look like it was taken during a challenge — it looks like it was taken by a photographer who had all day and a queen who had all the composure in the world, and neither of those things was true.',
        'The host announces {a} as the winner and puts the winning shot on screen, and the room makes a noise because the shot is a queen in the middle of an obstacle looking like she is on a magazine cover, and nobody else\'s shot looks like that.',
        '{a} takes {c} because her frame is the only frame that could be published without context — without explaining the water, the wind, the thing that hit her — because the frame does not show any of it. It shows a queen posing.',
        '{a} won {c} and the winning shot has the quality of a queen who has done this before, who knows what a camera wants, and who gave it to the camera while something was trying to take it away from her.',
      ]),
    ]),
  mini('dance-off', 'Werk Room Dance-Off', 'solo',
    'THE MINI THIS FILE WAS BUILT FOR. The music starts with NO WARNING and '
    + 'she has eight counts. No costume, no concept, no preparation — a body, a '
    + 'floor, and a room standing in a circle. Nothing here is about being '
    + 'funny; the old prose thought it was.',
    [
      tier('announce', 'The music starts with no warning and everybody has eight counts.', [
        'The music drops and nobody was told it was coming. {c} — no warning, no warm-up, no time to think about what the body is going to do. The beat starts and the queens have eight counts to prove they have a body that knows what to do when a beat starts.',
        'The host hits play and the room has a beat and no instructions and the beat does not care whether anybody was ready, and {c} is about to separate the queens who dance from the queens who have been saying they dance.',
        '{c} starts the way it always starts — with music and no explanation. The queens look at each other, the beat drops, and now it is a circle and a floor and eight counts and whatever your body does when it has nothing to fall back on.',
        'Music. No warning. {c} is announced by the fact that it is happening, and every queen in the room now has eight counts to show the room what she does when a beat finds her with no choreography, no concept, and no costume — just a body and a floor.',
      ]),
      tier('nailed', 'Eight counts of something the room did not know she had.', [
        '{a} hits the floor and the room goes quiet and then the room goes loud, because whatever {a}\'s body is doing it is doing it like it has been waiting for this beat specifically, and the eight counts she gets are eight counts of something nobody in the room knew she could do.',
        'The beat drops and {a} drops with it — not the arms-up, bounce-in-place thing that most queens default to when the music starts, but actual movement, choreography that she is building on the fly and landing like she rehearsed it.',
        '{a} takes the floor cold and the floor disappears, because what her body does in those eight counts is the kind of dancing that makes the rest of the room stop dancing and watch, which is the highest compliment a circle can pay.',
        'Eight counts. {a} takes them and fills every single one with a move that has weight and intention and the confidence of a queen whose body has been in rooms like this before and has never lost one.',
        'The music hits and {a}\'s body responds before her face does — hips, feet, shoulders, all of it moving like the beat is a conversation she has been having her whole life, and the room forms a circle not because they were told to but because they want to watch.',
        '{a} steps into the center and the eight counts she gets are not enough, which is the problem with being this good at {c} — the room wants more and the format says no, and {a} walks back into the circle knowing she left the room wanting.',
      ]),
      tier('decent', 'She moves well and commits and the circle makes noise for her.', [
        '{a} moves and the movement has conviction — not the most technical eight counts of the day, but the kind of dancing that comes from a queen who committed to whatever her body was going to do and did not apologize for it midway through.',
        'The beat drops and {a} finds it. She is not the best dancer in the room but she is not pretending to be — she rides the rhythm, she commits to the movement, and the circle makes noise for her because the noise was earned.',
        '{a} takes the floor and does something with the eight counts she is given — something real, something that reads as dancing rather than standing in the vicinity of music, and the room responds to the commitment more than the technique.',
        'A solid showing from {a} — she hears the beat, she moves to it, and the movement has enough personality in it to hold the room\'s attention for the eight counts she gets. The circle claps and means it.',
        '{a} dances and the dancing is the dancing of a queen who may not be a dancer but who has a body that listens to music and knows how to respond to it, and that is what {c} is measuring — not ability, but instinct.',
        'The music starts and {a} moves and the moving is good — hips finding the pocket, feet doing something intentional, shoulders committing to whatever the arms are about to do. The circle makes noise. The noise is genuine.',
        '{a} steps in and gives the room eight counts of a queen who showed up to dance and danced, and the eight counts hold together, and the room appreciates them, and the walk back to the edge of the circle has the posture of somebody who did not embarrass herself.',
        'The beat finds {a} and {a} lets it in. The eight counts are not a showstopper but they are a show — real movement, real rhythm, a queen engaging with the music rather than waiting for it to end.',
      ]),
      tier('flat', 'She does not dance, and eight counts is a long time to not dance for.', [
        '{a} steps into the center and the body freezes. The music is playing and the beat is right there and {a}\'s arms are moving but the arms are moving in the way arms move when the brain is sending instructions the body does not know how to execute.',
        'The beat drops and {a} does not drop with it. She bounces. She sways. She does the thing that people do when music is playing and they do not want to be standing still but do not know what else to do, and eight counts of that is a very long time.',
        '{a} takes the floor and the floor takes her right back, because the movement is not movement — it is the absence of stillness, which is not the same thing, and the room can tell the difference, and {a} can tell that the room can tell the difference.',
        'Eight counts of {a} searching for a dance that does not arrive. The arms go up and come back down and the hips shift but the shift has no rhythm in it and the feet are doing nothing, and the room gives her the merciful silence of queens who have been there.',
        'The music is playing and {a} is in the center and she is moving, technically, but the movement has the quality of a person standing in a room where music is happening rather than a person dancing to music, and the room claps politely when it is over.',
        '{a} does not dance. She stands in the middle of the circle and does something with her body for eight counts and the something is not dancing, and the circle is kind enough not to make it worse, and {a} walks back to the edge knowing exactly what just happened.',
      ]),
      tier('win', 'She took the floor cold and the room has not stopped talking about it.', [
        '{a} wins {c} and the win was obvious from the first two counts — she hit the floor and the floor belonged to her and the room knew it and the room has not stopped talking about the moment when the beat dropped and {a} dropped with it.',
        'The host calls {a} as the winner and the room confirms it with the kind of noise that means everybody in the circle already knew, because when {a} took her eight counts the rest of the room stopped being dancers and started being an audience.',
        '{a} takes {c} because her body heard the music before her brain did, and what happened in those eight counts was the kind of moment that makes a mini challenge feel like a main stage, and the walk back to her station has the energy of a queen who just told the room something about herself.',
        '{a} won {c} and the eight counts she danced are the eight counts the room will be referencing in confessionals tomorrow, because what {a} did on that floor was not a mini challenge performance — it was a moment.',
      ]),
    ]),
  mini('quiz', 'Wrong Answers Only', 'targets',
    'A quiz about the queens themselves, scored on how funny the WRONG answers '
    + 'are. The questions are about {b}, and getting it right is worth less '
    + 'than getting it wrong beautifully.',
    [
      tier('announce', 'A quiz about each other, scored on the wrong answers.', [
        'The host announces {c} and explains the scoring, and the scoring is the best part: a right answer is worth a right answer, but a wrong answer that is funnier than the truth is worth more, and the queens immediately stop trying to remember facts and start trying to be funny.',
        '{c} — a quiz about the queens in this room, and the host makes it clear that this is not a trivia contest. The wrong answers are scored, which means the queen who knows the least about her sisters but is the funniest about not knowing has the advantage.',
        'The host sets up {c} and the room realizes this is not a test of who has been paying attention — it is a test of who can say something about another queen that is funnier than the truth, and the truth is the floor, not the ceiling.',
        '"It\'s {c}!" Questions about the queens, scored on comedy rather than accuracy, and the room shifts from studying each other\'s faces for answers to studying each other\'s faces for material.',
      ]),
      tier('nailed', 'A wrong answer about {b} so good the right one would have been a waste.', [
        '{a} does not know the answer about {b} and does not need to, because the wrong answer she gives is so precisely observed and so perfectly delivered that {b} is laughing harder than she would have laughed at the right one.',
        'The question is about {b} and {a} answers it wrong on purpose, and the wrong answer is funnier than any right answer could have been, because it takes something true about {b} and bends it into comedy, and {b} is across the room screaming.',
        '{a} looks at the question about {b}, looks at {b}, and delivers an answer that is factually incorrect and emotionally devastating, and {b} puts her face in her hands because the wrong answer revealed something the right answer would have hidden.',
        'A wrong answer about {b} that lands harder than the truth — {a} took the question, found the funniest possible version of the wrong answer, and delivered it with the timing of a queen who understood from the first question that {c} is a comedy show, not a quiz.',
        'The answer is wrong and the room does not care because {a} just said something about {b} that everybody was thinking and nobody had said yet, and {b} is laughing and pointing at {a} with the energy of a queen who has just been got.',
        '{a} answers the question about {b} with something so funny that the host has to stop the game to recover, and {b} is doubled over, and the right answer has been forgotten by everybody in the room including the person who wrote it.',
      ]),
      tier('decent', 'She plays along and gets a laugh out of not knowing.', [
        '{a} does not know the answer about {b} and leans into not knowing, and the lean gets a laugh — not the biggest laugh of the quiz, but a real one, earned by a queen who understood that admitting ignorance with charm is worth more than guessing with confidence.',
        'The question is about {b} and {a} answers it with a shrug and a line that gets the room to make noise, and the noise is the noise of a queen who played {c} the way it is supposed to be played — wrong answers, right energy.',
        '{a} goes for a joke about {b} and the joke lands well enough that {b} laughs and the room laughs and the moment passes without anybody remembering what the right answer was, which is the ideal outcome of a decent round in {c}.',
        'A solid answer from {a} — she does not know what {b}\'s answer is and makes not knowing into the bit, and the bit works. {b} shakes her head with a grin. The room moves on. {a} scored where {c} is actually scored.',
        '{a} plays the question about {b} for comedy and the comedy is serviceable — not the funniest answer of the quiz, but a real attempt at humor rather than a real attempt at accuracy, and in {c} that is the better instinct to have.',
        'The question is about {b} and {a} gives an answer that gets {b} to laugh once, genuinely, which is the basic unit of success in {c}. Not a standout round, but a round that contributed something to the room rather than draining something from it.',
        '{a} answers and the answer is wrong and funny enough — {b} reacts, the room reacts, and {a} moves on with the energy of a queen who played the game correctly if not spectacularly.',
        'A wrong answer about {b} that gets the job done — {a} finds something to say that is not the truth and is funnier than the truth, and the gap between decent and great in {c} is delivery, and {a}\'s delivery was solid.',
      ]),
      tier('flat', 'She answers correctly and flatly, which is the only way to lose this.', [
        '{a} gives the right answer about {b}. The right answer. In a quiz scored on wrong answers. {b} nods and the room is silent, because accuracy in {c} is the one thing nobody is rewarding, and {a} just demonstrated that she does not understand what game she is playing.',
        'The question is about {b} and {a} answers it correctly, which would be impressive in a real quiz and is worthless here, because {c} is not a quiz and the right answer is the thing that has the least value in the room.',
        '{a} tries to be funny about {b} and the attempt does not land — the wrong answer is not wrong enough or not funny enough or not specific enough, and {b} sits through it without laughing, which is the clearest scoring system {c} has.',
        'A flat round from {a}. She either gives the right answer about {b} and gets nothing for it, or gives a wrong answer about {b} that is not funny enough to earn anything, and the silence after either outcome sounds the same.',
        '{a} answers the question about {b} and the answer is correct and delivered with the energy of a person taking an exam, and {b} stares at her with the expression of a queen who was hoping to be roasted and was instead informed.',
        '{a} tries for a joke about {b} and the joke misses, and the miss leaves her standing in the gap between what she said and what was funny, and {b} is across the room with an expression that is charitable but not amused.',
      ]),
      tier('passed', 'She does not know, cannot make not knowing funny, and says so — which is the one answer the quiz has no points for.', [
        '{a} looks at the question about {b} and has nothing — not a wrong answer, not a right answer, nothing. She says \"I genuinely do not know\" in a voice that is not playing for a laugh, and the room gives her the silence of queens who can feel the difference between a bit and an admission.',
        'The question is about {b} and {a} opens her mouth and closes it and the closing is the answer. \"Pass,\" she says, and the passing scores nothing, because {c} has points for right and points for funny and no points at all for a queen who stands there with an empty page.',
        '{a} stares at the question about {b} and cannot find either the truth or a joke about the truth. She tries to start twice — \"she is...\" and then nothing, \"I think...\" and then nothing — and the two false starts are worse than silence because they prove she was reaching and came back with air.',
        '\"I have nothing.\" {a} says it flatly about the question on {b}, and the flatness is not a performance — she genuinely cannot produce a wrong answer that is funny or a right answer that is correct, and saying so out loud in a room full of queens who all had something is the loneliest moment in {c}.',
      ]),
      tier('win', 'She understood that the quiz was not a quiz.', [
        '{a} wins {c} because she understood from the first question that accuracy was a trap, and every answer she gave was wrong and funny and specific to the queen it was about, and the room is still laughing at the answer about {b} while the host announces the prize.',
        'The host calls {a} as the winner of {c} and nobody is surprised, because {a} played every question like a setup for a punchline, and every punchline landed, and the wrong answers she gave taught the room more about the queens than the right answers ever could have.',
        '{a} takes {c} because she had the best wrong answers in the room — the funniest, the most specific, the most observant — and the gap between playing the quiz right and playing it well is the gap {a} found and lived in for the whole game.',
        '{a} won {c} and the win is the win of a queen who listened to the rules, heard that wrong answers are scored, and decided to be the wrongest and the funniest person in the room for the next fifteen minutes, and succeeded.',
      ]),
    ]),
  /* ── SPILL THE T ──
     The host asks a superlative about the room and everybody votes; the
     queens who vote WITH THE MAJORITY take the round. The question itself is
     DATA — written once in js/dr/data/spill.js and asked verbatim — so what
     is missing is not a description of the round, it is the ROOM. */
  mini('spill-the-t', 'Spill the T', 'vote',
    'NOBODY PERFORMS. The host reads a question about the room, every queen '
    + 'writes a name, and the names go up on a board. So the line is never a '
    + 'narration of that — it is what somebody SAYS while it happens, in '
    + 'quotation marks. The named queen answering back, the room going up, '
    + 'one queen defending her vote out loud. `{a}` is the queen the room '
    + 'named. A line like "the room reacts to the result" is the thing this '
    + 'pool exists to replace.',
    tier('announce', 'The host reads the question out. Her line, not a description of it.', []),
    tier('brutal', 'The room piled on one queen and she has to answer it to their faces.', []),
    tier('pointed', 'A clear answer with a bit of blood in it. She takes it or she does not.', []),
    tier('harmless', 'The room split, or the answer was fond. Nobody is wounded.', []),
    tier('win', 'She read the room better than anybody. What she says about that.', [])),
  /* ── GUESS WHO ──
     The mirror of the vote: something belongs to one of them and the room
     works out whose, so there IS a right answer and the tally can be a room
     agreeing on the wrong one. The reveal is the moment. */
  mini('guess-who', 'Guess Who', 'guess',
    'SOMETHING OF HERS GOES UP WITH NO NAME ON IT and the room guesses. The '
    + 'line is spoken, not narrated: the room calling out names, the owner '
    + 'claiming it, somebody being wrong out loud and having to own that. '
    + '`{a}` is the queen it belonged to. The two tiers are the only thing '
    + 'that matters on the night — whether anybody knew her well enough.',
    tier('announce', 'The host puts it up and asks whose it is. Her line.', []),
    tier('nobody', 'Not one of them knew. She has been in this room for weeks. Her line about that.', []),
    tier('some', 'Some of them knew her. What she says, and what the ones who guessed say.', []),
    tier('win', 'She knew the room best. What she says about that.', [])),
  mini('wig-swap', 'Wig Swap', 'pairs',
    'She styles {b}\'s wig and then has to WEAR the one {b} did for her. Two '
    + 'jobs, and the second one is out of her hands entirely — she is judged '
    + 'in something somebody else made.',
    [
      tier('announce', 'Everybody styles somebody else\'s wig, and wears the one done for them.', [
        'The host announces {c} and the rules are two jobs in one: style a wig for another queen, and then walk out wearing whatever wig that queen styled for you. Half the room starts planning what to build and the other half starts worrying about what will be built for them.',
        '{c} — each queen is paired up and each pair swaps wigs. She styles the wig her partner will wear, and then she puts on the wig her partner styled for her, and she has no control over what that wig looks like until it is on her head.',
        'The host explains {c} and the room does the math: the wig she builds is for somebody else, and the wig she wears is built by somebody else, and whether the somebody else who got her name is an ally or an enemy is about to matter very much.',
        '"It\'s {c}!" Every queen is about to discover two things: how well she can style a wig for a queen who is not her, and how well a queen who is not her can style a wig she has to wear in front of the host and the cameras.',
      ]),
      tier('nailed', 'What she built for {b} is better than anything {b} owns.', [
        '{a} hands {b} a wig and the wig is better than anything {b} brought from home — the shape is right, the color is right, and {b} puts it on and looks at herself in the mirror with the expression of a queen who has just been given a gift by somebody who understands her face.',
        'The wig {a} built for {b} sits on {b}\'s head like it was always meant to be there, and {b} knows it, and the room knows it, and {a} stands back with the satisfied expression of a queen who studied {b}\'s bone structure and made a wig that honors it.',
        '{a} styled a wig for {b} that {b} would choose for herself if she saw it on a shelf, and that is the highest compliment in {c} — not a funny wig, not a safe wig, but a wig that says I see your face and I know what goes on it.',
        '{a} gives {b} a wig and {b} puts it on and the room goes quiet because the wig is genuinely beautiful, styled to {b}\'s proportions with the care of a queen who treated somebody else\'s head like it mattered as much as her own.',
        'What {a} built for {b} is the kind of wig that starts conversations — the shape, the style, the way it frames {b}\'s face like {a} has been mentally styling {b} since the first day and has been waiting for {c} to prove it.',
        'The wig {a} hands to {b} is so well-styled that {b} puts it on and immediately angles toward the mirror, because the wig does something for her face that her own wigs do not always do, and {a} built it in twenty minutes.',
      ]),
      tier('decent', 'A serviceable wig, and she wears what {b} gave her without complaint.', [
        '{a} styles a wig for {b} and the wig is solid — it fits, it flatters well enough, and {b} puts it on without wincing, which is the baseline of a decent {c} performance. On the other end, {a} wears what {b} gave her and makes it work.',
        'The wig {a} built for {b} is a wig — styled, presentable, and sitting on {b}\'s head in a way that does not require apology. It is not {b}\'s best wig night, but it is a wig night she can stand in, and {a} delivered that.',
        '{a} hands {b} a wig that reads as competent and wears whatever {b} handed back without complaint, and the pair of them stand together looking like two queens who did right by each other if not spectacularly by each other.',
        'A clean swap — {a}\'s wig for {b} has the right shape and roughly the right energy, and {b}\'s wig for {a} is wearable, and the two of them look like queens who took {c} seriously and executed it without drama.',
        '{a} styles something for {b} that works and wears something from {b} that also works, and the mutual serviceability of the exchange is the best version of a decent {c} result — nobody was sabotaged, nobody was embarrassed, both wigs function.',
        'The wig {a} gives {b} is fine. It sits on the head, it has a shape, the color does not fight {b}\'s paint. {a} wears what she was given in return with the composure of a queen who has worn worse and said nothing about it.',
        '{a} and {b} swap wigs and both wigs are wearable, and in {c} wearable-in-both-directions is a result that puts a pair in the safe middle of the pack, which is exactly where this pair lands.',
        'Neither queen flinched when the swap happened, and that says everything — {a} received something wearable and delivered something wearable, and mutual competence is the quietest compliment two queens can pay each other in {c}.',
      ]),
      tier('flat', 'She was given something unwearable, or she made one, or both.', [
        '{a} hands {b} a wig and {b} puts it on and {b}\'s face says everything — the wig does not sit right, does not suit her, does not do the one thing a wig is supposed to do, and {a} is standing there watching her own work fail on somebody else\'s head.',
        'The wig {a} built for {b} is wrong — wrong shape, wrong color, wrong energy — and {b} wears it with the expression of a queen who is being polite about something impolite, and the room can see the gap between what {a} intended and what {a} delivered.',
        '{a} styled a wig for {b} and the wig looks like it was styled for a different queen, or a different species, and {b} stands in it with the patient expression of a queen who has been given a problem to wear on her head and is choosing not to make it worse.',
        'What {a} gives {b} is a wig that sits on {b}\'s head like it landed there from somewhere else, and what {b} gives {a} is not much better, and the two of them stand together looking like queens who did not take the swap seriously enough or did not have the skills to take it seriously at all.',
        'The wig is unwearable. {a} hands it to {b} and {b} holds it for a moment before putting it on, the way you hold something you know is going to be a problem, and the problem is confirmed the moment it touches her head.',
        '{a} opens the wig box from {b} and what is inside is a wig in the way that anything with hair on it is technically a wig, and {a} puts it on with the composure of a queen who has just learned something about what {b} thinks of her.',
      ]),
      tier('win', 'She did right by {b} and got away with what {b} did to her.', [
        '{a} wins {c} and the win sits on two things — the wig she built for {b} was beautiful, and the wig she was given by her own partner was something she wore with enough grace that nobody pitied her, and the combination of generosity and survival is what {c} rewards.',
        'The host calls {a} as the winner of {c} because the wig she styled was the best wig handed to anybody today, and the wig she wore was handled with the composure of a queen who makes anything work once it is on her head.',
        '{a} takes {c} because she understood both halves of the game — she built a wig for {b} with the care of somebody who wanted {b} to look good, and she wore what she was given with the confidence of somebody who trusts her own face more than she trusts somebody else\'s styling.',
        '{a} won {c} and the room agrees because her wig was the one everybody wished they had been given, and the wig she was given was the one everybody feared they would get, and she made both situations work.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a mini into a voice
// ══════════════════════════════════════════════════════════════════════

export function miniVoice(id) {
  return MINI_VOICES.find(m => m.id === id) || null;
}

/**
 * A mini's lines for one tier, or null.
 *
 * Null rather than a fallback line, for the same reason every other voice pool
 * in this show hands back null: the file ships empty and is filled one mini at
 * a time, and an unwritten mini keeps the generic beat in challenge-beats.js
 * exactly as it reads today rather than printing a blank.
 *
 * The variant floor is NOT enforced here. A tier with two lines written is
 * used, because two specific lines beat four generic ones — the guard is what
 * insists on the full count before it ships.
 */
/* ── A LINE MAY BE ABOUT SOMETHING ─────────────────────────────────────
   A real read is specific: "you are always telling yourself how talented you
   are — you are also a pathological liar" only lands because it is about
   THAT queen. A line written with `{b}` in it has to be true of whoever `{b}`
   turns out to be, so every read here was general, and a general read is the
   one thing a library cannot survive.

   `angle` is what the read is ABOUT, chosen by js/dr/mini.js from what is
   actually true of the target tonight — she has never won, she has been in
   the bottom twice, she cannot sew, nobody knows her yet. A line tagged with
   one is only ever drawn when that fact holds, so a read about a queen who
   has never placed is never said to the queen who won last week.

   The shape is the one js/dr/werk.js and js/dr/confessional.js already use
   for craft: a plain string assumes nothing and is always available, and
   `{ angle, line }` is offered only when it fits. Untagged lines therefore
   keep working exactly as they did, which is what makes this safe to fill
   one tier at a time. */
export const lineAngle = l => (typeof l === 'string' ? null : (l && l.angle) || null);
export const lineOf = l => (typeof l === 'string' ? l : (l && l.line) || '');

export function miniLinesFor(id, tierId, angle = null) {
  const m = miniVoice(id);
  const t = m && m.tiers.find(x => x.id === tierId);
  if (!t || !t.lines.length) return null;
  /* Tagged lines first when one fits: a specific read is the better card
     every time, and the untagged pool is the floor rather than the default. */
  const fitting = t.lines.filter(l => lineAngle(l) && lineAngle(l) === angle);
  if (fitting.length) return fitting;
  const general = t.lines.filter(l => !lineAngle(l));
  return general.length ? general : t.lines;
}

/** Whether this mini's prose is allowed to name a second queen. */
export function miniNamesOther(id) {
  const m = miniVoice(id);
  return !!m && (m.cast === 'targets' || m.cast === 'pairs');
}

/** Every (mini, tier) pair still short of its variant count. */
export function unwrittenMiniVoices() {
  const out = [];
  for (const m of MINI_VOICES) {
    for (const t of m.tiers) {
      const need = MINI_VARIANTS[t.id] || 4;
      if (t.lines.length < need) out.push(`${m.id}/${t.id} (${t.lines.length}/${need})`);
    }
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function miniVoiceTierCount() {
  return MINI_VOICES.reduce((n, m) => n + m.tiers.length, 0);
}
