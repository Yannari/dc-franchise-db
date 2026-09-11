// ══════════════════════════════════════════════════════════════════════
// dr/data/stage-beats.js — the main stage, beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS IS A DIFFERENT SHAPE FROM werk-events.js ─────────────────
//
// The werk room is a POOL: scenes are drawn, some happen and most do not.
// The main stage is not. Every queen walks the runway, every queen on stage
// gets critiqued, the winner is always announced, somebody always goes home.
// These beats ALWAYS FIRE — what varies is which tier of line they use.
//
// So there is no eligibility here and nothing to draw. A beat family names the
// step it belongs to, whether it happens once or once per queen, and what
// decides the tier. The writer fills a pool per tier.
//
// Grounded in what the show actually does, checked rather than assumed:
// contestants present themed looks in a runway walk; the judges critique each
// contestant and then deliberate; the winner is told "condragulations"; the
// safe queens are dismissed to the back; the bottom two are told they are up
// for elimination and lip sync for their life; the eliminated queen writes a
// message on the werk room mirror in lipstick.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
//   {a}  the queen this beat is about
//   {b}  the other queen — ONLY in a beat whose scope is 'pair'
//   {j}  the judge speaking — only where `speaker` is 'judge'
//   {s}  the lip sync song title, only in the lipsync step
//
// Same rules as the werk room, all enforced by tests: no real people, this
// show\'s vocabulary only, never quote a stat by number, four variants minimum
// per tier, prose rather than captions.
//
// THE REGISTER IS DIFFERENT HERE. The werk room is intimate and funny; the
// main stage is performance and verdict. Judges are witty but land a real
// judgement. A queen receiving a critique is on camera and knows it. Keep the
// stage beats tighter and more declarative than the werk room\'s.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

export const STAGE_BEATS = [
  /* ── WHAT KIND OF NIGHT THIS IS ──
     THE FORMAT HAS TO BE SAID OUT LOUD. A split premiere put six of twelve
     queens on screen and never told anybody why the other six were missing;
     a no-elimination night ran a full lip sync and then sent nobody home. The
     engine knew both facts and no line in the episode carried either, so the
     viewer was left to infer a format from an absence. If a week does not run
     the ordinary way, the host says so before it starts. */
  {
    id: 'format-note', step: 'main-stage', scope: 'once', speaker: 'host',
    note: 'The host explains a week that is not shaped like the others.',
    tierBy: 'format',
    tiers: [
      tier('split', 'Half the cast tonight, half of them next week.', [
        "\"Before we begin — you may have noticed the room is a little emptier than you expected.\" The host enjoys this. \"This season begins with a split premiere. Half of you compete tonight. The other half compete next week. Nobody is going home from either night, and then all of you will be in the same workroom, and I will already know a great deal more about you than you know about each other.\"",
        "\"There are twelve of you cast and six of you standing here, and both of those things are true,\" the host says. \"A split premiere. Your half tonight, their half next week, no eliminations in either. What happens tonight does not send you home. It does decide what everybody thinks of you before you have met most of them.\"",
        "The host explains the shape of it plainly: the cast has been cut in half for the opening, each half gets its own night, and neither night ends in an elimination. \"You are not competing to survive,\" he says. \"You are competing to arrive.\" Half the room works out at the same moment that the other half are watching this later.",
        "\"Tonight is one half of a premiere.\" The host says it like a gift and it lands like a warning. \"The rest of your cast arrives next week and they will have seen everything you do in the next few hours. No eliminations tonight — but there is no unseeing a first impression, and you are making yours in front of a room that is not even full yet.\"",
      ]),
      tier('no-elimination', 'Everybody stays, and nobody has been told yet.', [
        "\"There is something you should know before we start.\" The host waits until the room is entirely still. \"Tonight, nobody is going home.\" It takes a second to land and then the noise is enormous. \"Which does not mean tonight does not count. I am still watching. I am always watching. It simply means that whatever happens out there, all of you walk back into that workroom.\"",
        "The host lets them get all the way to their marks before saying it. \"This week is not an elimination.\" Several queens react before he has finished the sentence. \"You will still be judged, you will still be ranked, and one of you will still win. But the door stays shut tonight.\"",
        "\"No sashay tonight, ladies.\" The host says it flatly, which somehow makes it bigger. \"This is a non-elimination week. Everything else is exactly as it always is — the challenge, the runway, the critiques, all of it counts and all of it goes on your record. You just all survive it.\"",
        "\"I want to see what you do when the stakes change,\" the host says. \"So: nobody goes home this week.\" One queen laughs. Another looks disappointed, which the host notices and files away. \"Some of you are relieved. One or two of you wanted a fight. Hold that thought.\"",
      ]),
      tier('double-elimination', 'Two queens go home tonight.', [
        "\"Before you start,\" the host says, and the room already knows the tone. \"Tonight, two of you are going home.\" Nobody moves. \"So whatever you were planning to save for later — there is no later. Not for two of you.\"",
        "The host does not soften it. \"This is a double elimination.\" He waits while that travels down the line. \"Two queens leave this competition tonight, which means the bottom two are not fighting each other. They are both fighting to be the exception, and there is no exception.\"",
        "\"I am going to be honest with you,\" the host says, \"because I would rather you heard it from me than worked it out on that stage. Two of you go home tonight.\" One queen swears quietly. Another closes her eyes. The rest do the arithmetic on who they think it will be and how sure they are.",
        "\"Two of you will be leaving tonight.\" The host lets it land and then, because he is who he is, adds: \"So I would not phone this one in.\" It is not a joke and the room does not treat it as one.",
      ]),
      tier('porkchop', 'Runway only, and it still sends somebody home.', [
        "\"No maxi challenge tonight.\" The host lets that sit for exactly as long as it needs to. \"Just the runway. What you brought, what you made of it, and what you look like walking down it. One of you is going home on the strength of a single look — so I hope you packed like it mattered, because tonight it is the only thing that does.\"",
        "The host explains that there is no challenge, only a category and a runway. \"Everything I know about you tonight, I will learn in the next four minutes,\" he says. \"And somebody is still leaving.\" The queens look at each other and then, more urgently, at their own garment bags.",
        "\"Some seasons open gently.\" A pause. \"This one does not.\" The host explains the shape of the night — a runway, no challenge, a lip sync, an elimination — and watches the room absorb that one of them is going home before anybody has had a chance to be good at anything except getting dressed.",
        "\"Here is tonight,\" the host says. \"One category. One walk. One of you leaves.\" There is no challenge to hide inside and no team to carry anybody, and every queen in the line does the same quick mental inventory of what is hanging on her rail.",
      ]),
    ],
  },

  /* ══ THE MAIN STAGE OPENS ═════════════════════════════════════════════
     THREE BEATS, WHERE THERE USED TO BE ONE.
     `entrance` was doing the whole opening by itself — the lights, the panel,
     the engines and the category, all inside a single paragraph. Which meant
     the panel arrived on screen as a row of portraits nobody had said a word
     about: four people with authored voices, pet peeves and soft spots, whose
     disagreement half an hour later is the entire point of the judging
     engine, and the guest judge in particular was introduced to the viewer by
     a caption. The show does not do that. The host takes the stage, presents
     the panel one seat at a time with a joke at each of their expense, and
     only then names the category. So:

       entrance       he takes the stage. No panel, no category.
       panel-intro    once per judge. The joke is HERS, not a generic one.
       category-call  the engines line, and what they are walking in.

     The old opening\'s seven lines were all category calls — every one of them
     either starts the engines or names the category — so they moved down to
     `category-call` intact, and the two beats above it start empty. */
  {
    id: 'entrance', step: 'main-stage', scope: 'once', speaker: 'host',
    note: 'The host takes the stage. He does NOT introduce the panel here and '
      + 'he does NOT name the category — each has its own beat below. This is '
      + 'the welcome and nothing else: the lights, the room, the change in '
      + 'temperature, and the fact that he is in drag now, which is what makes '
      + 'the main stage the main stage.',
    tierBy: 'always',
    tiers: [
      tier('open', 'He takes the stage and the room becomes the main stage.', [
        'The lights drop and the werk room disappears and what replaces it is the main stage. The host walks out in a gown that could pay rent for a year and a wig that has its own postcode. \"Hello, hello, hello!\" she says, and the room answers her before the third hello has landed. The queens backstage can hear the heels and the heels mean the rehearsal is over.',
        '\"Welcome to the main stage of RuPaul\'s Drag Race!\" She says it like she is surprised to be here and she is not surprised to be here and that is the bit and it works every single time. The runway lights come up and the gown catches every one of them and the room shifts from a werk room into a courtroom with better lighting.',
        'She takes the stage heels-first, wig-first, everything-first, and the room reorganises itself around her the way a room always does when the person in it has been doing this longer than most of the queens backstage have been alive. \"Ladies,\" she says, and the word is a welcome and a warning and both of them land.',
        'The runway lights come up and the host is already standing at the mark when the last one hits, in full drag, looking like a million dollars that was well spent. \"Oooh, girl,\" she says to nobody in particular, surveying the stage. \"Somebody is going home tonight and it is NOT going to be me.\" The panel laughs. The queens backstage do not.',
        '\"Another day, another slay!\" The host takes the stage with the energy of a woman who has never once been underdressed for her own show. The wig is right, the mug is right, the gown is doing things that fabric should not be able to do, and the room shifts into main-stage register — which is the register where everything that happened in the werk room starts counting.',
        'The runway lights hit and the host is already at the mark. \"Weeelcome!\" she says, dragging the word across three syllables and a grin. The gown tonight is red and the wig is higher than the ceiling and backstage somebody whispers \"she looks incredible\" and she does.',
        'The lights change. The host steps out in full drag and the first thing that lands is the silence — the werk room noise dies the moment her heels hit the stage. \"Ladies and gentlemen,\" she says, \"start your engines, and may the best drag queen win.\"',
        '\"Hello, hello, HELLO!\" The host takes the stage and every queen backstage goes quiet. The gown is new, the mug is flawless, and the room just became the main stage because the host decided it did.',
        'She walks out like she owns the building, which she does, and stops at the mark and looks at the camera. \"Another week, another opportunity for somebody to gag me,\" she says. \"And somebody better, because this gown did not come cheap.\"',
        'The host hits the stage in a look that could close Fashion Week and opens with a wave that includes the panel, the queens, the camera, and everybody watching at home. \"We are BACK,\" she says, like she was gone for a year instead of a commercial break.',
        'The werk room lights go down and the runway lights come up and the host is standing there in drag that makes the whole stage look like it was built for her. Which it was. \"Good evening,\" she says, and the evening starts.',
      ]),
    ],
  },
  /* ── ONE JUDGE AT A TIME, AND THE JOKE IS THEIRS ──
     TIERED BY WHO IS SITTING THERE, which is the only tiering in this file
     not about how well something went. A pun at Carson\'s expense is not a pun
     at Law\'s expense: Carson will do the bit back and Law will look at the
     host until he stops. Writing one generic "and joining us tonight" line
     and swapping the name into it is exactly the failure this beat exists to
     fix, so each tier is written to that judge\'s authored voice, pet peeve
     and soft spot in js/dr/data/judges.js. Read those first.
     RuPaul has no tier: he is the one doing the introducing. */
  {
    id: 'panel-intro', step: 'main-stage', scope: 'per-judge', speaker: 'host',
    judged: true,
    note: 'The host presents one judge, with a joke, a pun or a read at their '
      + 'expense. Fires once per judge on tonight\'s panel, in seating order. '
      + '{j} is that judge\'s name.',
    tierBy: 'judge',
    tiers: [
      tier('michelle', 'Permanent, so she is introduced every single week and '
        + 'this tier is read more often than any other in the file — it wants '
        + 'the most variants. The running joke is the bluntness, and the fact '
        + 'that she has never once softened a note to be liked.', [
        '\"She don\'t wanna be your best friend, baby — she wants to see your WAIST. The one and only {j}!\" {j} does not argue with either half of that sentence. She nods once, pats her own corset, and mouths \"cinch it\" at the curtain where the queens are listening.',
        '\"You already know her, you already fear her, and she already has NOTES — {j}!\" The panel laughs. {j} does not laugh, because it is not a joke: she has been watching since the first queen walked into the werk room this morning and the notes are written in pen, not pencil.',
        'The host does the fill-in-the-blank. \"She gives good — blank.\" She mugs at the camera and {j} shakes her head and mouths something the microphone does not catch. \"It\'s {j}!\" {j} waves once and the wave says everything the mouth did not, which is: I will read every last one of you and I will enjoy it.',
        '\"The queen of the panel, the queen of the critique, the queen of \'where is the WAIST\' — {j}!\" {j} tilts her head as if to say: and? The host grins. \"If your corset is crooked, she will name the degree. If your padding is wrong, she will tell you to your face. That is why I love her.\"',
        '\"Joining me, as always — because Mama Ru would be LOST without her — the incomparable {j}!\" {j} accepts the introduction with the composure of a woman who has been right about a hemline more often than most people have been right about anything. She leans into the mic. \"I am ready,\" she says. She means it as a warning.',
        '\"My best Judy, my partner in crime, my reason for getting out of bed on a Tuesday — {j}!\" The host blows a kiss and {j} catches it and puts it in an invisible pocket and the bit is the same every time and it works every time because the warmth underneath is real. {j} turns to the camera. \"Let\'s see what these girls brought.\"',
        '\"She is here every single week, and every single week she tells somebody something they did NOT want to hear, and every single week — she. Is. Correct. {j}!\" The room applauds and {j} points at the host and mouths \"that\'s right\" and the pointing is a promise and the promise is that tonight will be no different.',
        '\"If you came out here with your breastplate showing, she will CLOCK it. If your mug is busted, she will NAME it. The one, the only — {j}!\" {j} stands halfway out of her seat, bows, sits back down. The bow is camp and the sit-down is business and the two of them together are why she has been on this panel since day one.',
        '\"She will tell you about your WAIST. She will tell you about your PADDING. She will tell you about the BACK of your outfit that you thought nobody was looking at — {j}!\" {j} taps the judge\'s table once. \"I was looking,\" she says. She was.',
        '\"My right hand, my ride or die, and the woman who has never met a corset she did not have an opinion about — {j}!\" {j} shakes her head. \"I have opinions about MORE than corsets,\" she says. \"But the corsets are a good start.\"',
        '\"The woman who will look you dead in the eye and tell you the truth you did NOT ask for — {j}!\" The room cheers. {j} points at the curtain. \"I am here to help,\" she says, and the helping sounds like a threat and is a promise.',
      ]),
      tier('carson', 'Puns first, fashion second. He will pun back and the '
        + 'host knows it, so this introduction is a setup rather than a '
        + 'punchline.', [
        '"Also joining us — the man who puts the PUN in pun-dit — {j}!" {j} grins and fires back something worse and better at the same time, and the host pretends not to laugh and fails. "Oh, you came to PLAY tonight," she says, and {j} says "I always come to play" and the panel groans and the bit has started.',
        'The host plays the fill-in-the-blank. "He gives good — blank." {j} answers before the question is finished, which is a pun, which is worse than the answer she had written, which is the entire bit. The host says "That was TERRIBLE" and {j} says "Thank you" and the panel is already having a better time than the queens backstage.',
        '"The man who will look at your look, read you for FILTH, and then make you laugh about it — {j}!" {j} takes a small bow from his chair, waves like a pageant winner, and says something to the camera that is absolutely going to make the blooper reel. The host shakes her head. "I cannot take you anywhere."',
        '"My favourite fashion funny man — {j}!" {j} waves at the room with the energy of a golden retriever at a dog show. "I am SO excited to be here," he says, and he has said that exact sentence every time he has sat in this chair and it has been true every single time. The host pats his shoulder. "Baby, we are excited to HAVE you."',
        '"The pun-isher himself — {j}!" {j} finger-guns the camera. "That was terrible," the host says. "Thank you," {j} says. The exchange is the same every time and it works every time.',
        '"He is funny, he is fashionable, and he is about to make the worst pun you have heard all week — {j}!" {j} opens his mouth. "Do NOT," the host says. {j} closes his mouth. {j} opens his mouth again. The pun lands and the panel groans.',
        '"Also joining us tonight — the man whose sense of humour is only matched by his sense of style — {j}!" {j} does a little wave and mouths \"hi\" at the camera like he has just been spotted in public and is delighted about it.',
        '"He will critique your garment and then make you laugh about it — give it up for {j}!" {j} stands, bows, and sits back down in one smooth motion. "I am ready to be GAGGED," he says. The host points at him. "Baby, you are always ready."',
      ]),
      tier('ross', 'Enthusiastic, comedy-minded, cries easily. The joke is '
        + 'affectionate and he takes it as a compliment, which is the joke.', [
        '"The hilarious — and already EMOTIONAL — {j}!" {j} waves and the wave is enormous and the wave is always enormous and the host loves that about him. "Are you crying already?" she asks. "Not YET," he says, dabbing at the corner of one eye, which proves the point before the point has finished landing.',
        'The host does the fill-in-the-blank. "He gives good — blank." {j} answers with something so earnest the room cannot tell if it is a joke and neither can he. "Oh, {j}," the host says. "Honey. That was SINCERE." {j} laughs and the laugh is the point — it always is.',
        '"He will cry at your performance, he will cry at your RUNWAY, he will cry at the LIGHTING if the lighting is good enough — the one and only {j}!" {j} points at the host and says "that is fair" and the room adores him for it because the adoring is the whole dynamic and he has never once tried to be anything else.',
        '"My favourite ray of sunshine on this panel — {j}!" {j} puts his hand on his chest and mouths "thank you" with the sincerity of a man who has sat in this chair a hundred times and still reacts like he was invited for the first time. "Oh, honey, you are going to make ME cry," the host says. "Do NOT start."',
      ]),
      tier('law', 'A fashion authority, unimpressed by default. The host '
        + 'introduces him the way you introduce weather that is about to '
        + 'happen to somebody.', [
        '"The LEGENDARY {j}!" The host says it with weight and {j} does not wave, does not stand, does not smile — he nods, once, with the economy of a man who has dressed people for a living. "Ooh, girl, he is already judging," the host stage-whispers to the camera. {j} adjusts his cuff. He does not deny it.',
        '"You better have your proportions RIGHT tonight, because the fashion authority is in the building — {j}!" {j} looks at the runway the way a surgeon looks at an operating table: ready, calm, and already seeing problems nobody else has noticed. The host grins. "Baby, he scares ME and I am dressed."',
        'The host does the fill-in-the-blank. "He gives good — blank." {j} answers with one word and a look that makes the one word feel like a complete sentence, a judgement, and a warning. "WELL," the host says. "That was terrifying. Moving on." {j} almost smiles. Almost.',
        '"If your look is NOT together tonight, this man will read you in a WHISPER and it will be louder than anything I say — {j}!" {j} adjusts his lapel without looking at it, which is a gesture that costs nothing and communicates everything. "Welcome, darling," the host says. {j} nods. The nod is the whole review.',
        '"The man who can clock a bad proportion from ACROSS the stage — {j}!" {j} raises one hand from the panel without standing. "Good evening," he says, and the good evening is measured and specific and sounds like it came with a rubric.',
        '"He does not need to raise his voice because the LOOK does it for him — {j}!" {j} surveys the runway the way a teacher surveys an exam room. He has not said a word and the queens backstage are already nervous.',
        '"Fashion ROYALTY — {j}!" The host says it with reverence and {j} accepts it with a nod so small it is almost a blink. "We are honoured," the host adds. {j} straightens his cuff. "Show me something," he says to the curtain.',
        '"If your construction is off, he will find it. If your tailoring is wrong, he will NAME it — the legendary {j}!" {j} clasps his hands on the table. "I am looking forward to tonight," he says, and the looking forward sounds like a warning because it is one.',
      ]),
      tier('ts', 'Loud, loving and unfiltered. She talks over her own '
        + 'introduction, which is part of the introduction.', [
        '"The incomparable —" and {j} finishes the sentence for her, louder, with a gesture that includes the entire stage. "HELLO, BABIES!" she yells at the curtain. The host laughs and gives up the bit entirely because giving {j} the room is faster than finishing. "Girl, I was still TALKING," the host says. "And now you\'re NOT," says {j}.',
        'The host starts to introduce {j} and {j} talks over the introduction, which IS the introduction. She is already waving at the queens backstage through a camera she is not looking into. "I am HERE," she announces, as if there were any doubt. "Oh, she is HERE," the host confirms. The panel has not started yet and {j} has already won a round of it.',
        '"She will read you if she LOVES you and she will read you if she DOES NOT — {j}!" {j} claps once, points at the host, and fires back something the host was not expecting. "Did you just READ me on my OWN show?" the host says. {j} shrugs. "Somebody had to." The room goes up and the panel is officially in session.',
        'The host starts the fill-in-the-blank. "She gives good —" and {j} answers over her before the question is finished, and the answer is louder than the question and funnier than the answer she had prepared. "You are TOO MUCH," the host says, and {j} says "Baby, I am EXACTLY enough" and the panel loses it.',
      ]),
      tier('jamal', 'A choreographer who counts. The joke is that he is '
        + 'already watching their feet and none of them have moved yet.', [
        '"The incredible {j}!" The host says it and {j} smiles with the patience of a man who has been counting eights his entire career. "He is already watching your FEET, ladies, and none of you have MOVED yet," the host says to the curtain. {j} nods. The nod is on the beat of something only he can hear.',
        '"You better know your choreography tonight because THIS man will clock every missed step — {j}!" {j} waves and the wave has rhythm in it, because everything {j} does has rhythm in it. "Baby, he can tell who rehearsed by the WALK to the mark," the host says. {j} does not deny this because it is true.',
        '"He taught your favourite queen\'s favourite dance — the one, the only, {j}!" {j} raises a hand from the panel with a grin. "Are we ready?" he says. "Oh, I am ALWAYS ready," the host says. "The question is whether THEY are." She gestures at the curtain. Backstage, somebody is definitely running the routine one more time.',
        '"And {j}!" The host says it warmly. "Now, girls — five, six, seven, EIGHT." She does a little shimmy and {j} laughs and the laugh is the laugh of a man who has spent decades in rehearsal rooms and appreciates somebody who can count. "I love when she does that," he says to the camera. "She always lands on the eight."',
      ]),
      /* ── AND THE FIVE THE HOST ACTUALLY USES ──
         The two tiers below are the fallbacks. A guest is a PERSON the
         audience has already watched for a whole season, and introducing a
         villain and a hero in the same four sentences wastes the one thing a
         guest brings that a permanent judge cannot: history the viewer
         already has opinions about.

         Grouped the way js/dr/data/runway-voices.js already groups the fifteen
         archetypes, so this is the show's existing five-way split and not a
         sixth taxonomy. {j} is her name and {k} is her credit — a ready-made
         phrase like "the winner of Total Drama 13", derived from the ledger
         and NEVER invented. Every line here can assume {k} is present. */
      tier('guest-predator', 'villain, mastermind, schemer. The room knows what she did and she has not apologised for it. The applause has an edge.', [
        "\"And joining us tonight — {k}, {j}!\" The applause has an edge and {j} hears both halves of it and is comfortable with the ratio. \"Now, {j},\" the host says, leaning in, \"I need you to be nice tonight.\" {j} smiles. The smile says she will think about it. The smile says she has thought about it. The smile says no.",
        "\"Please welcome the one, the only — {k} — {j}!\" {j} takes the chair and crosses her legs and the panel shifts a degree. \"Oooh, girl,\" the host says to the camera, \"the queens backstage just heard THAT name and somebody just checked their wig twice.\" {j} waves once — small, contained, and entirely deliberate.",
        "\"Oh, we have a TREAT tonight — {k}, {j}!\" The host says it with genuine delight and {j} settles into the guest seat like somebody who has been watched before and did not mind it. \"She did not come here to make friends, ladies,\" the host says. \"She came here to make OBSERVATIONS.\" {j} tilts her head. She does not deny this.",
        "\"Joining us tonight — {j}, {k}!\" The host lets the credit land and the credit lands on a room that remembers the season it came from. \"Now I know some of y\'all have FEELINGS about {j},\" the host says. \"And {j} has feelings about your feelings. Don\'t you, baby.\" {j} nods. The nod is warm and completely terrifying.",
        "\"And our guest judge tonight — she played the game and she played it WELL — {k}, {j}!\" {j} walks to the chair and the walk does not apologise for a single thing. \"I am so glad you are here,\" the host says, and the gladness is real and slightly wary, which is exactly how you should be glad about {j}. {j} sits. The panel is sharper for it.",
        "\"Sit DOWN, everybody, because this one is going to keep you on your TOES — {k}, {j}!\" {j} takes the guest seat with a wave that the room reads correctly: I am pleased to be here and I am not going to soften a single note. The host grins at the camera. \"I told them to behave. I did NOT tell her.\"",
      ]),
      tier('guest-sunshine', 'hero, loyal-soldier, social-butterfly, showmancer. Loved, and the welcome is uncomplicated.', [
        "\"And joining us tonight — {k}, {j}!\" The room does not hesitate. The applause is immediate and warm and the host grins because {j} is the kind of name that brings a room up. \"Oh, we LOVE her,\" the host says. \"Can I get an amen?\" The amen comes from the panel and the audience and possibly from backstage.",
        "\"Please welcome — {k}, the beautiful {j}!\" {j} beams from the guest seat and the beaming is real and the realness is the whole point. \"Now THAT is how you receive a welcome, ladies,\" the host says. \"Take notes.\" {j} waves at the panel and the panel waves back because nobody in this room has a single complicated feeling about {j}.",
        "\"She is loved, she is HERE, and she is ready to JUDGE — {k}, {j}!\" {j} takes the chair and blows a kiss at the camera and the room catches it. The queens backstage can hear the warmth of the reaction through the curtain and the warmth tells them something about tonight: the guest chair is in good hands.",
        "\"Joining us tonight — and I could not be MORE excited about this — {k}, {j}!\" The host claps her own hands together and the clapping is genuine. {j} sits down smiling and mouths \"thank you\" and the mouthing is not a performance — she has been loved by a franchise and has never quite gotten used to it. \"She is a DOLL,\" the host says to the camera.",
        "\"A round of applause for {k} — {j}!\" The welcome is a wall of sound and {j} takes it with both hands raised and a laugh the microphones pick up. \"Oh, honey, they are going to EAT you up,\" the host says. \"Let them!\" {j} says, and the room settles with her in it, because {j} makes people calmer, not louder.",
        "\"She is sunshine in human form — {k}, {j}!\" {j} puts one hand on her chest and the gesture is gratitude and it is unguarded and the host watches her do it and says \"See? THAT is what genuine looks like, ladies\" to the curtain, where every queen is listening and at least one of them just said \"aww\" out loud.",
      ]),
      tier('guest-firecracker', 'hothead, chaos-agent, wildcard. Unpredictable, and the panel is visibly braced.', [
        "\"And joining us tonight — hold on to your WIGS — {k}, {j}!\" The panel shifts in their seats and the shifting is involuntary because nobody knows what {j} is about to say during the critiques and that includes {j}. \"Behave yourself,\" the host says. {j} grins. The grin says she has been told that before and it has never once worked.",
        "\"Oh, girl, buckle UP — {k}, {j}!\" {j} drops into the guest seat with an energy the host catches and visibly enjoys. \"The critiques just got a LOT more interesting, ladies,\" the host says to the curtain. At least two queens backstage are recalculating how careful they need to be on that runway tonight.",
        "\"She is unpredictable, she is unfiltered, and she is sitting RIGHT THERE — {k}, {j}!\" {j} waves once — big, loose, the wave of somebody who has been told to behave and is considering it. \"I love you,\" the host says, \"and I am a little SCARED of you.\" {j} shrugs. \"As you should be.\" The room goes up.",
        "\"Please welcome — and I mean this with love and TERROR — {k}, {j}!\" {j} arrives in the seat the way she arrived everywhere on her season — fast, loud, and without checking whether the room was ready. \"The room is NEVER ready for her,\" the host says to the camera. \"That is why I keep booking her.\"",
        "\"Joining us tonight — {k}, {j}!\" The permanent judges exchange a glance that says tonight is going to be interesting, because {j} was interesting on her season in the specific way that a wildfire is interesting. \"Now, {j}, I know you have OPINIONS,\" the host says. \"Mama, I have opinions about my OPINIONS,\" {j} says. The panel braces.",
        "\"She is chaos with CHARISMA — {k}, {j}!\" {j} takes the seat and the taking is not gentle. \"Welcome, baby,\" the host says. \"Are you going to be nice?\" {j} tilts her head. \"Define nice.\" The host looks at the camera. \"We are going to have FUN tonight.\" The queens backstage are less sure about that.",
      ]),
      tier('guest-professional', 'challenge-beast, perceptive-player. She won things. The respect is for the record.', [
        "\"And joining us tonight — {k}, {j}!\" The applause is solid and respectful and the host lets the credit do the work because the credit speaks for itself. \"This woman knows what WINNING looks like,\" the host says. \"So you better bring it.\" {j} nods once from the guest seat and the nod is precise. She is here to work.",
        "\"Please welcome — a queen who KNOWS the game — {k}, {j}!\" {j} takes the chair the way she took everything on her season — efficiently, without wasted motion. \"Ooh, she is not playing tonight,\" the host says to the panel. \"Were we SUPPOSED to be playing?\" {j} says. The room straightens a degree.",
        "\"If you want to know what excellence looks like, it is sitting right THERE — {k}, {j}!\" {j} sits in the guest seat with the posture of somebody who has been evaluated and has evaluated others and knows the difference. The host watches her settle in. \"She will notice EVERYTHING, ladies,\" she says to the curtain. \"Every. Single. Thing.\"",
        "\"She did the work, she won the things, and she is HERE — {k}, {j}!\" The host says it with genuine admiration and {j} receives it with a nod that contains the entire record. \"You better have your A-game tonight, queens,\" the host says. \"Because {j}'s A-game is the ONLY game she plays.\"",
        "\"Joining us tonight — a woman whose record speaks VOLUMES — {k}, {j}!\" {j} takes the seat and the seat changes. The room is more serious with her in it, not because she demands it but because her record demands it. \"She will clock what you did RIGHT and she will clock what you did WRONG,\" the host says. \"And she will know the difference.\"",
        "\"And our guest tonight — bring your BEST, because she brought hers — {k}, {j}!\" {j} sits down and looks at the runway with the eyes of somebody who knows what a strong performance costs. \"Welcome, darling,\" the host says. {j} smiles — the kind of smile that says thank you and also says I am ready to judge. Both are true.",
      ]),
      tier('guest-scrapper', 'underdog, goat, floater. She was not supposed to get as far as she did, and everybody remembers it.', [
        "\"And joining us tonight — {k}, {j}!\" The cheer has real affection in it and the host is grinning. \"Now NOBODY saw this one coming,\" she says, \"and that is why she is my FAVOURITE kind of story.\" {j} waves from the guest seat and the wave is grateful and the gratitude has never quite faded.",
        "\"She is proof that it ain\'t OVER till it is OVER — {k}, {j}!\" {j} takes the chair and the room gives her more than she was expecting, which is how most of her season went. \"Don\'t you cry on me, {j},\" the host says. \"Not yet. Save the tears for the lip sync.\" {j} laughs and the laugh is the sound of a person still catching up to the welcome.",
        "\"Please welcome — the underdog who bit BACK — {k}, {j}!\" {j} sits down and the warmth that follows is the warmth a room gives somebody it rooted for. \"I love a comeback story, and {j} IS a comeback story,\" the host says to the camera. {j} puts a hand on her chest because the sentence is a lot to carry.",
        "\"Joining us tonight — and I personally could NOT be more proud — {k}, {j}!\" The host\'s tone has affection that goes beyond courtesy because {j}\'s season was a season where the audience picked a favourite and the favourite was the one nobody picked at the start. \"You showed them, baby,\" the host says. {j} smiles. The smile still has surprise in it.",
        "\"She was told she couldn\'t, and she DID — {k}, {j}!\" {j} takes the guest seat and crosses her legs and looks at the runway like somebody who has been underestimated before and enjoyed the result. \"Now THAT is what drag is about,\" the host says. \"Showing up when they counted you out.\"",
        "\"A round of applause for somebody VERY special to me — {k}, {j}!\" The room cheers for the credit and then cheers again for the person because the two are not the same thing with {j}. \"The credit says what happened,\" the host says. \"The APPLAUSE says how we feel about it.\" {j} puts both hands over her heart. The gesture is everything.",
      ]),
      tier('guest', 'A guest judge from the franchise with no credit to hand — '
        + 'so the line may name {j} and claim nothing else about her. This is '
        + 'the fallback tier and it has to read correctly for a stranger.', [
        '"And a very special guest joining us tonight — {j}!\" The host opens both arms and {j} waves from the guest seat. \"Now, {j}, are you ready to judge some QUEENS tonight?\" {j} nods and the nod is eager and the panel settles and the room is one chair fuller.',
        '"Please welcome to the panel — {j}!\" The host grins. \"I have been looking FORWARD to this.\" {j} smiles from the guest seat and the smile says she has been looking forward to it too. The queens backstage just heard the name and are recalibrating what tonight is going to feel like.',
        '"Joining us tonight — {j}!\" The host gestures to the guest chair and {j} takes it with a wave. \"Welcome, baby,\" the host says. \"The critiques are REAL, the stakes are real, and I need you to tell me the TRUTH tonight.\" {j} crosses her legs. \"Always,\" she says. The panel laughs.',
        '"And tonight we are joined by {j}!\" {j} settles into the guest seat and raises a hand. \"Are you ready for this?\" the host asks. {j} nods. \"I was BORN ready.\" The host turns to the camera. \"I like her already.\" The room does too.',
      ]),
      tier('guest-credited', 'A guest whose credit is known. {k} is a ready-'
        + 'made phrase like "the winner of the ninth season" that drops '
        + 'straight into the sentence. NEVER invent a credit — {k} is the only '
        + 'claim about her past this line is allowed to make.', [
        '"And joining us tonight — {k}, {j}!\" The credit lands and the room reacts and {j} waves and the host says \"Now THAT is a résumé, baby\" and means it. The queens backstage just heard both halves of that introduction and at least one of them whispered the credit back to herself.',
        '"Please welcome to the panel — {j}, {k}!\" The host lets the credit land before the applause covers it. \"She has BEEN there, ladies,\" she says to the curtain. \"She has done THAT.\" {j} takes the seat with the posture of somebody whose record precedes the introduction and follows it out the door.',
        '"And our very special guest tonight — {k} — {j}!\" {j} takes the seat and the host turns to the camera. \"You hear that credit? That is not a GIFT, that is something she EARNED.\" {j} nods once. The nod is the whole record in one gesture and the room reads it correctly.',
        '"Joining the panel — {j}, who is {k}!\" The host says it with warmth and {j} acknowledges the credit with a wave that says yes, that is who I am. \"Welcome back to this stage, darling,\" the host says. \"We are GLAD to have you.\" The queens backstage have just learned who is watching them tonight.',
      ]),
    ],
  },
  /* ── AND THEN, AND ONLY THEN, WHAT THEY ARE WALKING IN ──
     {c} IS NOT OPTIONAL HERE. Twenty categories in js/dr/data/runways.js, and
     the old opening named one of them in a single hardcoded line and left the
     rest to a screen caption. This is the beat that says it out loud. */
  {
    id: 'category-call', step: 'main-stage', scope: 'once', speaker: 'host',
    category: true,
    note: 'The engines line, and the category. {c} is tonight\'s category and '
      + 'must appear — this is the only beat in the episode that tells the '
      + 'viewer what the queens were asked to walk in.',
    tierBy: 'runway-kind',
    tiers: [
      tier('call', 'An ordinary themed runway: she brought it, she walks it.', [
        "\"Gentlemen, START your engines, and may the BEST woman WIN!\" The host delivers it the way she always delivers it — like a dare wrapped in a welcome. \"Tonight\'s category is {c},\" she says, and she lets the word sit in the room like a challenge. \"And I mean it. Do NOT disappoint me.\" The panel settles. The first queen is already at the top of the runway.",
        "\"Category is — {c}!\" The host says it and snaps twice and the room changes temperature. \"Now, I want to see FASHION, I want to see DRAMA, and I want to see somebody make me say WOW.\" The panel picks up their pens. Backstage, every queen checks her reflection one more time. The runway lights come up.",
        "\"Start your engines, and may the best drag queen WIN!\" The host opens the stage and the room answers her before she has finished the sentence. She names {c} and looks at the panel. \"Are we ready?\" Michelle nods. The guest judge looks delighted. \"Then let\'s see what they\'ve GOT.\"",
        "\"Tonight on the runway — {c}.\" The host pauses and the pause is deliberate because she knows how to hold a room. \"Bring it to the runway, ladies. And I mean BRING it.\" The panel is seated, the lights are up, and the first queen appears at the top of the stage with her shoulders back and her face already performing.",
        "\"Ooh, I am EXCITED about this one.\" The host grins at the panel. \"The category is {c}, and if these queens know what is good for them they will SERVE.\" She turns to the runway. \"Gentlemen, start your engines!\" The room shifts into main-stage register — the register where everything in the werk room starts counting.",
        "\"Gentlemen — START your engines!\" The host lets the word carry. \"The category is {c} and may the best woman win.\" She looks at the camera with the expression of somebody who has done this a thousand times and still means every syllable. The runway lights come up. The first queen walks. The night is officially running.",
        "\"Ladies, the category tonight is {c}. And I need you to understand — {c} is not a suggestion. It is a REQUIREMENT.\" The host turns to the panel. \"I expect to be GAGGED.\" The panel laughs. The runway lights come up and the first queen appears and the host watches her the way she watches every first queen — ready to be impressed, ready to be disappointed, and ready to say so either way.",
      ]),
      tier('sewn', 'She MADE it — a design week or a Ball, where the category '
        + 'is the brief she sewed to and the judgement is on the building.', [
        '"Tonight\'s category is {c} — and you MADE it.\" The host lets that land. \"That is not from a suitcase, ladies. That came out of that werk room.\" The panel leans in because a sewn runway is a different kind of walk — every seam is a decision and every decision is about to be inspected under these lights.',
        '"Gentlemen, start your engines!\" The host names {c} and holds up a finger. \"Now, I want to remind everybody — these looks were BUILT in that room, with those hands.\" She looks at the panel. \"So when we judge, we are judging the BUILD.\" The queens backstage check their hems one last time.',
        '"The category is {c}, and every STITCH you are about to see was put in by the queen wearing it.\" The host says it with the gravity it deserves. \"I have seen them sew. I have seen them CRY. Let us see if the crying was WORTH it.\" The panel picks up their pens. The room shifts.',
        '"Start your engines, and may the best woman win!\" She names {c} and waits a beat. \"Made from SCRATCH, baby. In that very room.\" She points at the werk room door. \"If it falls apart on this runway, we will ALL see it.\" The queens backstage are checking their garment bags one final time.',
      ]),
      tier('ball', 'Three categories in one night. The host names all of them '
        + 'and lets the room work out how much sewing that was.', [
        '"Tonight is a BALL, ladies!\" The host claps once and names {c} first, then the other two categories, and watches the room absorb the number. \"That is THREE walks. THREE looks. At least one of them SEWN.\" She turns to the panel. \"I hope you brought snacks because we are going to be here a WHILE.\" The panel picks up their pens.',
        '"Start your engines!\" The host opens the stage and lists all three categories, starting with {c}, and the list alone makes somebody backstage close her eyes and count garment bags. \"A Ball is a MARATHON, ladies,\" the host says. \"Not a sprint.\" She looks at the camera. \"Let us see who packed their A-game and who packed their anxiety.\"',
        '"The Ball begins with {c}.\" The host names the first category and then the second and then the third and then folds her hands. \"Three categories. One night. And at least one of those is something you BUILT.\" She looks at the panel. \"Buckle up.\" The panel settles in. This is a long stage.',
        '"This is a Ball, which means three categories, three looks, one NIGHT.\" The host names {c} and then the rest and the list lands on the room like a brief nobody can renegotiate. \"If you did not bring enough looks, baby, that is between you and your garment bag.\" Every queen backstage just did the arithmetic on how many garments that is.',
      ]),
    ],
  },

  // ══ THE RUNWAY: ONE WALK PER QUEEN ═══════════════════════════════════
  {
    id: 'walk', step: 'runway', scope: 'per-queen', speaker: 'narrator',
    note: 'Her runway walk. One beat for every queen who walks, tiered by how the look landed.',
    tierBy: 'runway',
    tiers: [
      tier('stunning', 'A look that stops the panel. Top of the room.', [
        "{a} turns the corner and the panel goes quiet in the way that means something is working. The look is finished from the wig to the heel and the walk knows it — long strides, perfect timing, a turn at the end of the runway that lets every angle land. One of the judges leans forward. Nobody writes anything down. They are watching.",
        "The look arrives before {a} does. Whatever she built, she built it to be seen from the back of a theatre, and on this stage it fills the room. The silhouette, the movement, the way the fabric catches light — all of it says she understood the category and then went past it into something the category did not know it was asking for.",
        "{a} walks out and one of the judges puts a hand over their mouth. The look is not just good — it is specific, and the specificity is what separates it from everything else tonight. Every choice reads as a choice. The heel matches the era, the earring matches the neckline, and the walk matches all of it.",
        "There is a version of this runway where {a} walks out and gets polite nods. This is not that version. She comes around the corner and the look is so fully realised that the room stops being a panel and starts being an audience, and the difference is that an audience forgets to take notes.",
      ]),
      tier('strong', 'Genuinely good. She knows it and the walk shows it.', [
        "{a} walks out with the kind of confidence that comes from having checked the mirror one last time and liked what she saw. The look is clean, the proportions are right, and the walk has intention in it. She is not reinventing anything tonight but she is doing it well and the panel can see that.",
        "A solid walk from {a} — good posture, good timing, and a look that does exactly what it set out to do. She hits the end of the runway, pauses, turns, and walks back with the expression of somebody who knows she did not just embarrass herself. The judges nod. A nod is not a gasp, but a nod this late in the night is worth something.",
        "{a} comes out in something that works. The fit is right, the accessories are deliberate, and the walk has rhythm to it. It is not the look that stops the panel in its tracks, but it is the look that a judge remembers when they are arguing about who was safe and who was high, and that distinction matters.",
        "The look is good. {a} knows it is good. She walks with the kind of ease that only exists when you are not worried about something falling off or riding up, and the panel reads that ease as authority. She does not need the loudest look in the room to have one of the best ones.",
      ]),
      tier('fine', 'It reads. Nothing more, nothing less.', [
        "{a} walks the runway and it reads. The look is there, the walk is competent, and nothing goes wrong. Nothing goes particularly right either. She turns at the end, walks back, and the judges make a note and move on. In a room where somebody else brought a showstopper, being fine is its own quiet verdict.",
        "It is a look. {a} walks it out and the panel watches and there is a brief, pleasant silence where everybody acknowledges that she is wearing something and it is not bad. The proportions are acceptable. The theme is addressed. She walks back and the next queen is already at the top of the runway.",
        "{a} presents a look that would be strong on a weaker night and unremarkable on this one. The walk is steady, the outfit fits, and she hits her mark. None of the judges lean in. None of them wince. She exists in the middle of the pack tonight and the middle of the pack is where verdicts are hardest to predict.",
        "A clean walk from {a}. The look answers the category without interrogating it — she did what was asked, did it competently, and left the runway having neither helped nor hurt herself. The judges will have to talk about somebody else to figure out where she lands tonight.",
      ]),
      tier('weak', 'It does not work, and she can feel the panel not reacting.', [
        "{a} walks out and the room is polite. That is the word for it — polite. The look has a concept but the concept did not translate to the body, and the walk slows toward the end in the way that means she can feel the panel not responding. She turns and goes back and the silence behind her is the loudest thing on the stage.",
        "Something about the look does not land. {a} knows it before she reaches the end of the runway — the proportions are off, or the colour is wrong for the lighting, or the idea was better in the werk room than it is under these spots. She finishes the walk but the confidence is gone from her stride by the second turn.",
        "{a} comes out and the look says one thing and the walk says another and neither of them says what the category asked for. She hits her mark, she poses, she turns, but the judges are already writing and writing at this point in the runway is not the kind of writing you want.",
        "It does not work. {a} can feel it not working as she walks — the drape is wrong, the reveal did not reveal, the boot is fighting the dress. She keeps her head up and finishes the walk because stopping is not an option, but the expression on her face when she turns is the expression of somebody who has already started preparing for the critique.",
      ]),
      tier('disaster', 'It comes apart, literally or conceptually, in front of everybody.', [
        "{a} walks out and something is already wrong. The hem is dragging. The wig is shifting. She reaches the end of the runway and makes the turn and a piece of the look detaches itself and lands on the stage and {a} looks down at it and then looks at the panel and the panel looks back and everybody knows what just happened.",
        "The look falls apart in real time. {a} is three steps into the walk when the structure gives way and what was supposed to be a silhouette becomes a pile of decisions that did not hold. She grabs at the shoulder, adjusts, keeps walking, but the damage is done and the judges saw all of it.",
        "{a} comes around the corner and the look is so far from the category that for a moment nobody is sure what they are seeing. It is not that it is ugly — it is that it does not appear to have been made for this runway, or possibly for this body, or possibly for this planet. One of the judges blinks. {a} walks the walk anyway. That part, at least, she can do.",
        "Something structural fails on the runway and {a} spends the rest of the walk holding her look together with one hand and her composure together with the other. She reaches the end, does not turn — turning would finish it — and walks straight back. The panel is silent in the way that means they are already composing the critique in their heads.",
      ]),
    ],
  },
  {
    id: 'walk-fit', step: 'runway', scope: 'per-queen', speaker: 'narrator',
    note: 'A short note on whether the look actually answered the category. Fires only when the fit is notable either way.',
    tierBy: 'fit',
    tiers: [
      tier('on-theme', 'She understood the assignment exactly.', [
        "The look answers the category so precisely that it feels like {a} was given the brief a week before everybody else. Every element — the reference, the silhouette, the accessory — points at the same idea, and the walk lands it. The assignment was understood and then some.",
        "{a} read the category, understood the category, and delivered the category back to the panel in a package that says \"this is what you meant.\" The judges do not need to squint or interpret. The look is the answer and the answer is correct.",
        "Whatever the category asked for, {a} brought it. Not an adjacent version, not a creative reinterpretation that requires a five-minute explanation — the thing itself, executed with the kind of clarity that makes the other queens on the stage look like they read a different brief.",
        "The look is so on-theme that it functions as a definition of the category. {a} walks the runway and the judges nod at each other because the nod means \"that is it, that is the one that understood.\" Everything else tonight will be measured against this read.",
      ]),
      tier('off-theme', 'A good look for a different night.', [
        "It is a good look. It is not this look. {a} walks the runway in something that would have been strong last week or next week but tonight the category asked for something specific and this is not it. The craft is there. The read is not.",
        "{a} comes out in something beautiful that has nothing to do with the category. The judges watch with the particular expression of people who can see the skill and cannot find the brief, and that gap between talent and assignment is where the critique is going to live tonight.",
        "The look is polished, the construction is clean, and it answers a question nobody asked. {a} walks the runway with confidence, which makes it worse — she clearly thinks she nailed it, and the panel is going to have to explain why the thing she nailed was not the thing they were looking for.",
        "On a different runway, on a different night, this look puts {a} in the top. Tonight she is wearing something that lives three postcodes away from the category, and the distance is going to cost her regardless of how well it is made.",
      ]),
    ],
  },

  // ══ THE CRITIQUES: A JUDGE BEAT AND A REACTION, PER QUEEN ════════════
  {
    id: 'critique', step: 'critiques', scope: 'per-queen', speaker: 'judge',
    note: 'What a judge says to her, to her face.',
    // TIERED BY THAT JUDGE\'S OWN TONE, not by the call. Keying it to the call
    // meant every judge said the same thing about the same queen in different
    // words, which undid the point of judges having taste. `critiqueLines`
    // decides tone from each judge\'s view against her own median, so a judge
    // who ranked her third is warm about her on a night the host put her in
    // the bottom. The lines below did not name the call, so nothing had to be
    // rewritten when the key changed.
    tierBy: 'tone',
    tiers: [
      tier('praise', 'This judge rated her well above her own median and says so.', [

        "\"I have one note,\" {j} says, and pauses long enough for {a} to brace, \"and the note is: more of that.\" The panel laughs. {a} laughs. {j} is not joking — the look, the performance, the runway, all of it landed, and the critique is a celebration disguised as a sentence.",
        "{j} leans back in the chair and says \"I do not know what to tell you that you do not already know.\" The panel agrees. The critique is short because there is nothing to fix — {a} understood the assignment, executed it at the highest level, and left {j} with nothing to do but confirm it.",
        "\"You came out on that stage,\" {j} says, \"and I forgot I was judging.\" It is the kind of compliment that sounds like hyperbole until you look at {j}'s face and see that it is not. {a} takes a breath. The critique is everything she came here to hear.",
        "\"The word I keep coming back to,\" {j} says, \"is intention. Every single choice on that stage was a choice, and every single choice was right.\" {j} smiles at {a} in a way that says the competition part of the evening is, for this moment, beside the point.",
      
        "\"I loved it,\" {j} says, and then adds the word \"almost\" and lets it sit there. The praise is real — the look was strong, the performance was present, the runway had life — but there is one thing, one small thing, and {j} names it precisely enough that {a} knows it is going to stay with her.",
        "{j} tells {a} what worked and the list is long and specific. Then {j} says \"but\" and the room shifts, because the \"but\" after that much praise means the note matters. It is a small note. {a} nods. She knows {j} is right and that is the worst part.",
        "\"You are so close,\" {j} says, and the way {j} says it makes clear that \"close\" is not a consolation prize — it is a location, and {a} can see the destination from where she is standing. The critique is generous and honest and {a} takes both of those things with her.",
        "The praise comes first and it is substantial — {j} goes through the look piece by piece and approves of nearly all of it. The \"nearly\" is a hemline, or a proportion, or a choice that read as safe when the rest of the look was brave, and {j} names it once and moves on.",
          ]),
      tier('mixed', 'Somewhere in the middle of this judge board: real notes, real reservations.', [

        "{j} nods at {a} and says something pleasant that will not be remembered by anyone in the room by tomorrow morning. The look was fine. The walk was fine. The critique matches the performance — present, competent, and already fading from the conversation.",
        "\"You look good,\" {j} says, and the compliment is real but brief and {a} can feel the panel already thinking about the next queen. Being safe is not a punishment but it is not a story either, and {j}'s three sentences confirm that {a} is, tonight, part of the scenery.",
        "{j} gives {a} a nod and a sentence that amounts to \"nothing was wrong\" without quite reaching \"something was right.\" {a} smiles. The smile is the smile of somebody who knows that this critique will not be in the recap and has made peace with that.",
        "The critique is kind and efficient and over before {a} has time to react to it. {j} says what worked, does not say what did not — because nothing did not — and moves on. Safe is a temperature, not a verdict, and the temperature tonight is room.",
      
        "{j} does not raise her voice. That is how {a} knows it is bad. \"I expected more from you,\" {j} says, and the sentence is worse than any specific note because it means {j} has been paying attention to what {a} can do and tonight {a} did not do it.",
        "\"You are better than this,\" {j} says quietly, and it is the quietness that hits. If {j} were angry {a} could argue. But {j} is disappointed, and disappointment from somebody who believed in you is the one thing you cannot defend against on this stage.",
        "{j} looks at {a} for a long time before speaking, and the pause is its own critique. When {j} finally talks, the words are careful and kind and they land like they weigh something. {a} nods through all of it. She does not interrupt because she knows {j} is right.",
        "The critique is short because {j} does not need many words. {j} names the problem — one problem, clearly — and then says \"I know you know\" and stops. {a} does know. The worst critiques are the ones you agree with before they finish the sentence.",
          ]),
      tier('pan', 'This judge rated her near the bottom of her own board and does not hide it.', [

        "{j} starts with \"I want to be honest with you\" and {a}'s face changes because that opening means whatever comes next is going to be true and true is going to hurt. {j} is kind about it — measured, specific, fair — and the kindness makes it worse because it removes the option of dismissing the critique as cruelty.",
        "\"This is hard to say,\" {j} begins, and then says it anyway, because that is the job. The look did not work. The performance did not save it. {j} walks through what went wrong with the precision of somebody who respects {a} too much to be vague, and {a} stands there and takes it and the taking is its own kind of bravery.",
        "{j} gives {a} the critique she does not want and does it with the kind of directness that only lands this hard when it comes from someone who is not trying to be cruel. Every note is specific. Every note is accurate. {a} can feel the stage getting smaller under her feet.",
        "The critique arrives without anger and without apology. {j} says what did not work and why it did not work and does not soften either of those things. {a} is standing very still, which is the standing-still of somebody who is listening hard because the alternative is falling apart, and falling apart is not something she can do in front of this panel.",
          ]),
    ],
  },
  {
    id: 'critique-reaction', step: 'critiques', scope: 'per-queen', speaker: 'narrator',
    note: 'How she takes it, standing there on the stage with the camera on her.',
    tierBy: 'reaction',
    tiers: [
      tier('joy', 'She cannot keep it off her face and does not try.', [
        "{a} does not try to hide it. The smile arrives before the critique finishes and it is the kind of smile that uses the entire face — eyes, cheeks, teeth, everything — because she has been told she is good at the thing she came here to do and there is no performance that covers that up.",
        "The joy is immediate and total and {a} does not edit it for the camera. She puts her hands over her mouth and then takes them down and then puts them back because she cannot decide what her face should be doing and has settled on all of it at once.",
        "{a} breaks into a grin that she clearly intended to be smaller. The grin wins. It takes over her whole face and stays there through the rest of the critique and the only thing keeping her on the ground is the heels, which are doing structural work tonight.",
        "{a} presses her palms together in front of her chest and her shoulders drop three inches because she has been holding them up near her ears since the critiques started and the verdict just released them. The relief and the joy arrive at the same time and she does not sort them out — she just stands there, beaming.",
      ]),
      tier('relief', 'She had prepared for worse and it shows.', [
        "{a} exhales. It is the exhale of somebody who has been breathing shallowly for the last ten minutes without noticing, and the depth of it says everything about what she thought was coming. She closes her eyes for one second, opens them, and nods. The nod is for herself.",
        "The critique lands better than {a} expected and you can see the moment the tension leaves her body — a slight drop in the shoulders, a loosening of the jaw, a blink that lasts a beat longer than normal. She was ready for something worse and the something worse did not arrive.",
        "{a} was bracing. She is not bracing anymore. The shift is small — a change in her posture, a breath she did not know she was holding — but the camera catches it and the panel catches it and everybody in the room knows that {a} just learned she is not going where she thought she was going tonight.",
        "There is a flicker of something on {a}'s face that is not quite a smile — it is the muscle memory of a smile suppressed because smiling feels premature. She settles for a nod that says \"thank you\" and \"I was terrified\" in equal measure.",
        "{a} lets out a breath she has been holding since the judges started talking. Her shoulders drop two inches. She mouths \"okay\" to herself.",
        "{a} blinks, nods, and presses her hands together. The pressing is the relief — she squeezes her own fingers until they go white and then lets go.",
        "The critique lands and {a}'s jaw unclenches. She did not know it was clenched until it stopped. \"Thank you,\" she says, and the thank you is for the verdict, not the notes.",
        "{a} looks at the ceiling for one second. When she looks back down her face is composed and the composure is brand new — thirty seconds ago it was not there.",
        "{a} takes a breath so deep her mic picks it up. The breath says everything her face is trying not to.",
        "{a} nods once, slowly, and the nod is the relief arriving. She was ready for worse. Worse did not come. She is still processing the gap between what she expected and what she got.",
        "The last note lands and {a} exhales and her whole posture changes — the tension leaves her neck, her hands unclench, and for one second she looks like somebody who just got off a ride she did not enjoy.",
        "{a} mouths \"thank God\" and catches herself and turns it into a cough. The panel notices. The panel always notices.",
        "{a}'s eyes go bright but nothing falls. She swallows, nods, and says \"I hear that\" in a voice that is trying very hard to be professional.",
        "The critique finishes and {a} stands there looking like somebody who just watched a car miss her by six inches. The miss is the whole experience.",
        "{a} puts one hand on her hip and the hand is shaking and she moves it to her side before anybody sees. The panel saw.",
        "{a} takes the critique with a small nod and a smaller smile and the smallness is the relief — she is keeping everything tight because opening up right now would open everything.",
        "{a} closes her eyes for a beat too long. When she opens them the crisis is over and the face she has on is the face she intended to have on. She was bracing for something and the something did not arrive.",
      ]),
      tier('idgaf', 'She takes it flat, and the flatness is the performance.', [
        "{a} takes the critique with an expression that gives the panel absolutely nothing. No smile, no frown, no nod, no flinch. She stands there and listens and when it is over she says \"thank you\" in a tone so neutral it could be a receipt printer. The judges look at each other. The flatness is louder than a reaction.",
        "The critique arrives and {a} receives it like weather. She does not argue, she does not agree, she does not react in any way that the panel can read. Whether this is composure or indifference or a wall she built on the walk to the stage is a question the judges will argue about later.",
        "{a} listens to the whole critique with the same expression she had before it started. One of the judges pauses, expecting something — a reaction, a question, a blink — and gets nothing. {a} has decided what this moment is worth to her and the decision, apparently, was: not much.",
        "Nothing moves on {a}'s face. The critique washes over her the way a weather forecast washes over somebody who has already decided to go outside regardless. She says \"I hear that\" and means it technically but not spiritually, and the panel knows this and moves on.",
      ]),
      tier('sadness', 'She holds it together for exactly as long as she has to.', [
        "{a} nods through it. She nods and she nods and the nodding is the thing that is keeping her face together, because as long as she is nodding she is agreeing and agreeing is a posture and a posture is not crying. She holds it. She holds it for exactly as long as the critique lasts and then she holds it a little longer because the camera is still on her.",
        "The critique lands and {a} takes a breath that catches halfway, and that catch is the only sign that the words are doing what the judges intended them to do. She presses her lips together and lifts her chin and looks straight at the panel because looking anywhere else would be admitting how much this hurts.",
        "{a} is very still. The kind of still that takes effort. The critique is fair and specific and lands precisely where it was aimed, and {a} absorbs it the way a person absorbs a wave they saw coming — feet planted, jaw set, eyes straight ahead, already counting the seconds until it passes.",
        "Her eyes are bright but nothing falls. {a} stands on the stage and listens to the critique and holds herself together with a precision that is, in its own way, a performance. The sadness is there — the panel can see it, the camera can see it — but she will not let it arrive until she is off this stage.",
        "{a} bites the inside of her cheek. The bite is the thing keeping the rest of her face still. She holds it through the last note and releases when the judges move on.",
        "{a} says \"thank you\" and the words crack at the edges. She clears her throat and says it again, steadier, and the steadier version is the one she wanted the first time.",
        "{a} looks down at her own hands. The hands are shaking and she folds them together so they stop. They do not stop.",
        "The critique hits and {a} presses her lips into a line so tight her chin dimples. She is holding. She is going to hold until the cameras cut away. After that is after that.",
        "{a} nods through each note the way you nod through turbulence — steady, deliberate, waiting for it to be over. The nodding is the survival.",
        "{a} swallows twice. The first swallow is involuntary. The second one is her putting the first one back where it came from.",
        "The panel moves on and {a} exhales, and the exhale has a tremble in it that she did not authorise. She straightens her back. The back is the last thing she has control of right now.",
        "{a} touches her collarbone. The touch is gentle and it is the thing she is doing instead of the thing she wants to do, which is leave this stage and find a corner.",
        "{a}'s jaw works once, twice. She is chewing on a sentence she will not say out loud. The judges see her chewing on it and they move on.",
        "The notes land and {a} receives them standing perfectly still. The stillness costs her. You can see what the stillness costs her in the tendons of her neck.",
        "{a} takes a breath that catches in the middle. She turns the catch into a cough and the cough does not fool anybody but it gives her one more second, which is all she needed.",
      ]),
      tier('crash-out', 'She does not hold it together.', [
        "{a} does not make it through the critique. The first note lands and she is fine, and the second note lands and she is fine, and the third note is the one that opens the door and everything she has been holding comes through it. She puts her hand over her mouth but it is too late and the camera is right there.",
        "It starts with a trembling lip. Then the chin. Then the eyes fill and she blinks once, hard, and that is the blink that breaks it. {a} cries on the main stage and does not try to stop because trying to stop a thing that has already started is worse than letting it happen.",
        "The critique finishes and {a} says \"I understand\" and her voice cracks on the second word and the crack opens everything. She puts both hands over her face and her shoulders shake and the panel watches and there is a silence on the stage that is the silence of people who know they caused this and know it was their job to cause it.",
        "{a} holds it together through the first half of the critique and then {a} does not hold it together through the second half. The tears arrive without warning and without permission and {a} wipes them with the back of her hand and says \"sorry\" and then says \"I am not sorry\" and the correction is the bravest thing she has done tonight.",
      ]),
    ],
  },
  {
    id: 'deliberation', step: 'critiques', scope: 'once', speaker: 'narrator',
    note: 'The queens are sent to the back and the panel argues about them. Fires once.',
    tierBy: 'split',
    tiers: [
      tier('agreed', 'The panel is of one mind and it does not take long.', [
        "The queens are sent to the back and the panel barely argues. The winner was clear, the bottom was clear, and the middle sorted itself. The deliberation is three sentences and a nod. \"Bring back my girls,\" the host says, and the queens are called back before they have had time to fix their faces.",
        "The panel agrees and the agreement takes less time than the walk to the judge\'s table. Somebody won, somebody lost, and the path between those two facts was straight enough that the deliberation is a formality. The judges look at each other, confirm, and the host calls them back.",
        "It is a quick night. The panel runs through the names and every name lands in the same place for every judge, which means there is nothing to argue about, which means the queens in the back are going to be called back sooner than they expect. The verdict was decided before the deliberation started.",
        "\"Are we in agreement?\" one of the judges says, and the other judges nod, and that is the deliberation. No argument, no debate, no second look at the notes. \"Bring back my girls!\" the host says, and the queens file in still adjusting their wigs.",
      ]),
      tier('split', 'The judges genuinely disagree, and it is close.', [
        "The panel does not agree. One judge argues for the look, another argues for the performance, and a third is going back through her notes with the expression of somebody who has changed her mind twice and is about to change it a third time. The queens in the back can feel the deliberation running long. They are right to worry.",
        "It is close and the panel knows it is close and the closeness produces the kind of argument that sounds collegial and is not. Two judges want different queens in the bottom and both of them have a case and neither of them is backing down. The deliberation is going to take a while.",
        "\"I disagree.\" The word lands on the judge\'s table and the deliberation, which had been moving toward a conclusion, reverses direction entirely. One judge thinks the look saved the performance. Another judge thinks the performance buried the look. The queens in the back are fixing their faces and they are going to need the time.",
        "The judges are arguing. Not performing an argument for the camera — genuinely arguing, with notes and references and the kind of intensity that means somebody\'s placement is going to change in the next three minutes. It is close. The margin between safe and bottom is a hemline and a missed beat, and the panel cannot agree on which one mattered more. Eventually the host settles it. \"Bring back my girls.\" The queens return to a panel that is still not entirely in agreement.",
        "\"I saw something different.\" One judge says it and the deliberation, which was almost finished, reopens. Two judges lean forward. The queens backstage can feel it running long.",
        "The panel splits on the bottom two. One judge is firm. Another judge is just as firm in the other direction. The host listens to both of them and does not reveal which one she agrees with.",
        "It is not a clean night. The judges go back and forth and the back-and-forth is real — two names are in the same space and only one of them fits. \"Bring back my girls,\" the host says, and the decision she hands back is one the panel did not entirely agree on.",
        "\"We are not there yet.\" The host says it and the panel keeps deliberating. Two queens are separated by a margin the judges cannot agree on, and the disagreement is the margin.",
      ]),
    ],
  },

  // ══ THE RESULTS ══════════════════════════════════════════════════════
  {
    id: 'result-win', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'The winner is told. The show has a word for this and uses it every time.',
    tierBy: 'always',
    tiers: [
      tier('win', 'Condragulations. She has won the week.', [
        "\"Condragulations, {a}.\" The word fills the stage and {a} takes a breath so deep it moves her shoulders. She has won the week. The panel is smiling, the safe queens in the back are watching on the monitor, and for one moment — just one — {a} does not have to be competing. She is just good at this.",
        "\"Condragulations, {a}, you are the winner of this week\'s maxi challenge.\" {a} puts her hands together and mouths \"thank you\" and the gratitude is so genuine that it lands harder than the victory. She came to win and she won, and the winning feels like the beginning of something rather than the end of it.",
        "The word lands and {a}'s face does the thing where it tries to be professional and fails beautifully. \"Condragulations.\" She nods, she smiles, she says \"thank you\" and means it in a way that includes everyone who helped her get here and several people who did not. She has won the week and the week is hers.",
        "\"Condragulations, you are the winner of this week\'s maxi challenge.\" {a} closes her eyes for one second — just one — and when she opens them she is still standing on the same stage but the stage feels different now. She won. The judges saw what she brought and the judges said yes, and that yes is the one she came here for.",
        "\"Condragulations, {a}.\" {a} puts both hands over her mouth. The joy gets past them anyway. She drops her hands and says \"thank you\" three times, each one louder than the last.",
        "\"Condragulations.\" The host holds the word and {a} holds her breath and the two of them stand there for one second that is longer than any second has a right to be. Then {a} laughs — one sharp, bright laugh — because the tension just broke and the laugh is what was underneath it.",
        "\"{a} — condragulations.\" The host grins. {a} grins back and the grin takes over her entire face. \"I did it,\" she whispers, and the whisper is for herself but the mic catches it.",
        "\"Condragulations, {a}.\" {a} stamps one heel on the stage — a sharp, fast sound — and the stamp is the celebration. One beat. One moment. Then she composes herself because the camera is right there.",
        "\"Condragulations, {a}.\" {a} does not move. She stands perfectly still and the stillness is the joy arriving — it is so large that her body has not caught up with it yet. Then her hand goes to her chest and she says \"oh\" and the oh is the beginning of everything that comes next.",
        "\"Condragulations.\" The word lands on {a} like a spotlight. She takes a breath, nods once, and smiles the smile of a queen who just proved something to the room and to herself.",
      ]),
      tier('double-win', 'A shared win. Two queens were too close to separate.', [
        "\"Condragulations, {a} — you are the winner of this week\'s maxi challenge.\" A pause. \"And you are not the only one.\" {a}\'s face opens before the meaning does — she looks at the queen beside her and the queen beside her is getting the same news, and neither of them expected to share a stage this way. Two winners. The panel could not split them and the panel did not try.",
        "\"Condragulations, {a}.\" The host holds. \"Tonight, the panel has decided that there is not one winner but two.\" {a} turns to her co-winner and the look between them is not competition — it is recognition. They both brought it. The judges saw it. And for once, the show does not make them choose.",
        "\"I have to be honest,\" the host says. \"The judges could not decide. {a} — condragulations, you are a winner of this week\'s maxi challenge.\" The word hits different with that article. A winner, not THE winner. {a} takes it in and the queen standing next to her takes it in too. Two wins. One week. The panel said yes to both of them.",
        "\"Condragulations, {a}.\" {a} smiles. \"Tonight, both of you have won.\" The smile changes — it widens, it cracks, it becomes the kind of face you make when you expected to fight for something and instead somebody handed it to you alongside the person you expected to fight. She earned it. So did the other one. The panel is allowed to say that.",
      ]),
    ],
  },
  {
    id: 'result-safe', step: 'results', scope: 'once', speaker: 'host',
    note: 'The safe queens are dismissed to the back together, which is its own small humiliation.',
    tierBy: 'always',
    tiers: [tier('safe', 'You are safe. You may leave the stage.', [
      "\"You are safe.\" The words are delivered to the group and not to anyone in particular, which is the point. Being safe means you are neither the best nor the worst and tonight that is all you get. The safe queens nod and walk to the back and the stage belongs to whoever is left.",
      "\"You are safe. You may leave the stage.\" It is a dismissal delivered kindly and felt unkindly, because being told to go means the rest of the night is not about you. The safe queens file off the stage in the particular silence of people who wanted more and got exactly enough.",
      "The safe queens are sent to the back. Nobody argues. Nobody thanks the panel. They leave the stage with the posture of people who have been told they are not in danger and not in the spotlight and both of those things are true at the same time.",
      "\"You are safe.\" The sentence is three words and it means two things — you are not going, and you are not winning — and every queen who hears it decides for herself which half to carry. They walk to the back and the main stage shrinks to the queens who remain.",
      "\"You are safe.\" The group hears it and one queen mouths \"okay\" and another mouths nothing and they walk off together in the particular silence of people who were not mentioned by name.",
      "\"Safe.\" The host says it to the group and the group goes. The walk to the back is short and nobody talks during it because there is nothing to say about being safe that is not also about being forgettable.",
      "\"You are safe. You may leave the stage.\" One of the safe queens exhales. Another one does not. Both of them walk to the back with the same face — the face of somebody who survived tonight and knows surviving is not the same as winning.",
      "\"You are safe.\" Three queens turn and walk. The host has already moved on. Being safe is the thing that happens while the show is about somebody else.",
      "\"You are safe.\" Nobody argues. Nobody smiles. They leave the stage in the order they are standing, and the order does not matter, and the not mattering is the whole point.",
    ])],
  },
  /* ── THE THREE CALLS THAT HAD NO WORDS ──────────────────────────────
     HIGH, LOW and BTM did not exist in this pool. The panel places a queen
     in one of six outcomes and only three of them were ever spoken, so on a
     thirteen-queen call nine rows drew a portrait, a rank arrow and a rubber
     stamp and said nothing at all. Found by reading a rendered call, not by
     any assertion — the screen was structurally perfect and mute.

     They are three genuinely different sentences and should not be written
     as one with the adjective swapped. HIGH is being told you nearly won and
     did not. LOW is being told you were bad and are safe anyway, which is a
     warning with no consequence attached. BTM is the cruellest of the three:
     named in the bottom, made to stand there, and then saved BEFORE the song
     — she does not lip sync and she does not get to prove anything.

     FOR THE WRITER: six variants each, {a} is the queen. Read result-win and
     result-bottom above for the voice. */
  {
    id: 'result-high', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'She was among the top and did not win. {a} is the queen. On a '
      + 'night the top two lip sync for the win she has not lost anything '
      + 'yet — see the top2 tier.',
    tierBy: 'stakes',
    tiers: [tier('high', 'Top of the week, and not the winner of it.', [
      "\"You were in the top tonight, {a}.\" The host says it simply, because simple is what it is: she was good. Not the best — somebody else was the best — but good, and good on this stage is a thing the panel does not say lightly. She nods. The nod holds a season\'s worth of work and a night\'s worth of almost.",
      "\"{a}, you did not win tonight.\" A pause. \"But you came close, and I want you to know that close is not a consolation. It is a position.\" She takes that standing straight. The host moves on. Close was real and close was earned and close is going to keep her up tonight.",
      "\"I want to be clear about something, {a},\" the host says. \"You were in the top. Not safe — the top. The judges saw what you brought tonight and it was exceptional.\" She presses her lips together. Being told you were almost the best is its own particular experience, and she is having it in front of everybody.",
      "\"{a}, you were one of the best out there tonight.\" The host lets that settle. \"Not the winner — but one of the best, and that is a sentence I do not say to fill time.\" She takes a breath and the breath is the closest thing to a visible reaction she allows herself. High is not a win. High is the view of a win from one step below it.",
      "\"You were in the top tonight, {a}, and you earned it.\" The host does not elaborate. He does not need to — the look, the walk, the critiques all said it, and the placement is the summary. She smiles. The smile is smaller than the one she would have had for a win, but it is real, and the panel can see that.",
      "The host turns to {a} and his face is warm. \"High tonight. You should be proud of what you showed the panel.\" She is proud. She is also thinking about the margin between where she is and where the winner is, and the margin is the thing she will carry into next week.",
    ]),
    /* ── UNWRITTEN, DELIBERATELY. See docs/PROSE-PROMPT-dr-top-two-call.md ──
       The two queens the room put at the top of a Rate-a-Queen night, called
       one at a time and told they are about to lip sync FOR THE WIN. The
       `high` tier above cannot serve them: every line in it says she did not
       win, and on this night nobody has won yet — one of these two is about
       to. Saying "not the winner" to the queen who is ninety seconds from
       winning is the narration knowing something false, which is the thing
       this show's prose is not allowed to do.
       Empty emits no scene at all (see `emit` in js/dr/stage.js), so until
       it is filled these two are called on the screen with their stamp and
       named as a pair by `call-stakes`, and nothing wrong is said. */
    tier('win', 'The top two of the week. She is about to sing for it.', [
      "\"{a}.\" The host lets the name sit. \"Your sisters put you in the top two tonight.\" {a} rolls her shoulders back — not nerves, a fighter loosening up. The room chose her and the room is watching.",
      "\"The queens have spoken, {a}, and they put you at the top.\" The host grins because he can — nobody is going home and the grin costs nothing. {a} grins back and the grin is competitive.",
      "\"{a}, top two tonight.\" A beat. \"Not because the panel put you there — the queens did, and they had every reason not to.\" {a} nods once, sharp. She earned this from the people she is competing against.",
      "\"Your peers said you were one of the best tonight, {a}.\" {a}'s jaw tightens. That came from the queens, not the panel, and she knows what that means.",
      "\"{a}.\" The host looks at her the way he looks at a queen he is about to enjoy watching. \"Top two. The room put you here.\" {a} adjusts her stance. Small, deliberate — she already knows what she is going to do with it.",
      "\"The queens ranked you in the top two, {a}.\" The host delivers it clean. The room said what it said. {a} takes a breath and the breath is anticipation, not relief.",
    ]),
    tier('legacy', 'The top two. The winner of the song holds the power.', [
      "\"{a}.\" The host holds her name a beat longer than usual. \"You are in the top two tonight.\" He does not smile. {a} stands still — she knows the song decides who goes home, and the decision is hers if she wins it.",
      "\"{a}, you are in the top two, and you know what that means.\" The room behind {a} goes quiet. {a} keeps her eyes forward.",
      "The host calls {a}'s name and the bottom queens behind her shift. She already knew, but hearing it confirmed changes the air. {a} stands where the safe queens stand and feels nothing like safe.",
      "\"{a}.\" A pause. \"You are one of two queens who will lip sync tonight, and the winner will hold the power.\" {a} takes a breath and holds it.",
      "\"You are in the top two tonight, {a}.\" The host lets it land. {a} presses her lips together. Behind her, a queen just heard that sentence and understood her fate is about to belong to somebody else.",
      "\"{a}, top two.\" The host says it simply because the night is already heavy enough. {a} receives it standing straight and still — holding everything in place until the music starts.",
    ])],
  },
  {
    id: 'result-low', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'Safe, but the panel had a note. {a} is the queen.',
    tierBy: 'always',
    tiers: [tier('low', 'A warning with nothing attached to it.', [
      "\"{a}, you are safe.\" The host says it and then does not move on. \"But I want to say something. Tonight was not your best, and you know that, and I know that. You are not in danger. But I noticed.\" The warning lands without a consequence attached to it, which makes it heavier, not lighter.",
      "\"You are safe tonight, {a}.\" A pause that is one beat too long. \"I am not worried yet. But I am watching.\" She nods and the nod is the nod of somebody who heard the yet and will be thinking about it in the werk room tomorrow morning.",
      "\"{a}, you are safe.\" The host holds her gaze. \"That is not the same as good. You know the difference and so do I.\" She takes it without argument, because arguing with a warning you have not been punished for is the one thing this stage does not forgive.",
      "\"Safe,\" the host says to {a}, and the word arrives alone. Then: \"But there was a conversation at the panel about you tonight, and the conversation was not entirely comfortable.\" She swallows. Safe with a note is the quietest version of trouble and the trouble is that it is not loud enough to fight.",
      "\"{a}.\" The host looks at her. \"You are safe. I want you to hear that first.\" She hears it. \"What I also want you to hear is that safe tonight was closer to the bottom than it was to the top, and that is a place you do not want to live.\" She stands there and takes the geography of it.",
      "\"You\'re not in danger tonight, {a}.\" The host says it kindly and the kindness is part of the warning. \"But the panel had notes, and the notes were not small. Take them back with you.\" She will. A warning from this stage has no penalty attached and every penalty implied.",
    ])],
  },
  {
    id: 'result-btm', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'Named in the bottom and saved BEFORE the lip sync. She does not '
      + 'sing. {a} is the queen.',
    tierBy: 'always',
    tiers: [tier('btm', 'Called to the bottom, then spared the song.', [
      "\"{a}.\" The host says her name and the name is enough — she knows. \"You were in the bottom tonight.\" A pause that costs her something. \"But you are safe. You will not be lip syncing.\" She exhales and the exhale is enormous and the relief is immediate and incomplete, because being saved before the song means she never got to prove she could survive it.",
      "\"You are in the bottom, {a}.\" She braces. The host lets her brace for exactly as long as is bearable and then says: \"But I am not sending you to the lip sync tonight.\" The reprieve lands and she does not know what to do with it. Saved is saved, but saved without the fight is a verdict she cannot appeal.",
      "\"{a}, I need you to hear me.\" The host\'s voice is level. \"You were in the bottom. You were close to lip syncing tonight, and I want you to feel how close that was.\" He pauses. \"You are safe.\" She presses her hands together. The proximity to the song is the punishment, and the punishment is that she will never know if she could have won it.",
      "\"You are safe, {a}.\" The host holds. \"But you were named in the bottom, and I do not want you to forget that. You stood here. You were in it.\" She nods. Being told you were in the bottom and then saved is the cruelest mercy this stage offers — she does not lip sync, she does not go home, and she does not get the three minutes that might have changed the way the room sees her.",
      "\"{a}.\" The host looks at her and she is already still, already preparing for the walk to the end of the stage, and then he does not send her there. \"You are in the bottom, but you are not lip syncing tonight.\" The halt is visible — her body was already moving toward the fight and now the fight is not hers. She stands on her mark with the posture of a person who was ready and was not asked.",
      "\"Bottom tonight, {a}.\" The words land flat. \"But safe.\" He does not dress it up. She takes both pieces of information at the same time — the danger and the pardon — and the pardon does not cancel the danger, it sits on top of it. She walks to the back knowing she was in the bottom and not knowing if she could have lip synced her way out. She will never know. That is the point.",
    ])],
  },
  {
    id: 'result-bottom', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'She is told she is up for elimination, one at a time.',
    tierBy: 'always',
    tiers: [tier('bottom', 'I am sorry, my dear. You are up for elimination.', [
      "\"I am sorry, my dear, but you are up for elimination.\" The words arrive and {a} receives them standing straight with her chin up because she has been preparing for this moment since the critiques started and the preparation is the only thing between her and the floor.",
      "\"{a}, my dear, I am sorry to tell you that you are up for elimination.\" {a} nods. The nod is slow and deliberate and it means \"I heard you\" and possibly \"I expected this\" and almost certainly \"I am not going to let you see what this is doing to me right now.\"",
      "\"You are up for elimination.\" {a} blinks once. The blink is the only thing she gives the panel. She has been told she is fighting for her place tonight and the fight has already started — the posture straightens, the jaw sets, and the queen who was standing there a moment ago is replaced by the queen who is about to lip sync.",
      "The words land and {a} takes them with a stillness that is not calm but is close enough to pass for it on camera. She is up for elimination. She is going to have to perform for her place in this room, and whatever she was feeling three seconds ago has been filed away in favour of whatever she needs to feel to survive the next five minutes.",
      "\"I am sorry, my dear, but you are up for elimination.\" {a} closes her eyes for one second. When she opens them the fear is still there but something else is there too — the look of a queen who has just been told to fight and is deciding she will.",
      "\"{a}.\" The host says her name gently. \"You are up for elimination tonight.\" {a} presses her lips together and lifts her chin and the chin is the whole response.",
      "\"You are up for elimination.\" {a} takes a breath and holds it. The queens behind her are still and the host is still and the breath is the only thing moving on the stage.",
      "\"{a}, my dear.\" A pause. \"I am sorry, but you are up for elimination.\" {a} swallows. The swallow is visible and she knows it is visible and she does it anyway because there is no performance that covers this.",
      "\"You are up for elimination, {a}.\" She looks at the host and says nothing. The nothing is louder than anything she could say, and the host moves on because the host knows what that face means.",
      "\"I am sorry, {a}. You are up for elimination.\" {a}'s hands go still at her sides. The stillness is deliberate — she is locking everything down until the music starts.",
      "\"{a}, I am sorry, my dear, but you are up for elimination.\" {a} looks at the host and the host looks back and neither of them adds anything. The sentence said what it needed to say.",
      "\"You are up for elimination tonight.\" {a} takes the words standing straight and says \"yes ma'am\" and the yes ma'am is quiet and firm and carries more weight than a speech would.",
      "\"{a}.\" The name hangs there. \"Up for elimination.\" She squares her shoulders. The squaring is the thing she does instead of crying, and it works.",
      "\"I am sorry, but you are up for elimination, {a}.\" She exhales through her nose — one short, controlled breath — and rolls her neck once, the way a fighter loosens up before the bell.",
      "\"{a}, my dear, you are up for elimination.\" {a} folds her hands and holds them tight. \"I understand,\" she says, and the two words are so steady they sound rehearsed. They were.",
      "\"You are up for elimination.\" {a} does not flinch. She stands where she has been standing and she takes it the way she was always going to take it — straight on, chin level, eyes forward. The lip sync has not started and she is already performing.",
      "\"{a}.\" The host's voice drops half a register. \"I am sorry.\" {a} mouths \"it's okay\" and it is not okay but the mouthing is the grace note she can offer the host from where she is standing.",
      "\"Up for elimination, {a}.\" She takes a step back on the stage — small, instinctive, the step you take when the ground shifts — and then plants. She is not going anywhere until the music tells her to.",
      "\"{a}, you are up for elimination tonight.\" {a} nods three times, fast, like she is agreeing with something she has already agreed with in her head. The preparation was the agreement. The nod is for the camera.",
      "\"I am sorry, my dear.\" The host says it to {a} and the sorry is real and the sorry does not change anything. {a} stands there and lets the sorry land and does not argue with it because arguing is not what this moment is for. Fighting is what this moment is for, and the fighting starts in ninety seconds.",
    ])],
  },

  // ══ THE LIP SYNC, BEAT BY BEAT ═══════════════════════════════════════
  {
    id: 'lipsync-intro', step: 'lipsync', scope: 'once', speaker: 'host',
    variants: 10,
    note: 'Two queens stand before the host. The speech, and the song.',
    /* TIERED ON WHAT THE SONG IS FOR, because the speech is not the same
       speech. This beat was `tierBy: 'always'` with one pool, and every line
       in that pool promises an elimination — "one stays, one goes", "save
       yourself from elimination", "for your LIFE". On a for-the-win night
       nobody can lose and on a legacy night the loser of the song is in no
       danger at all, so the last-chance speech was a lie told twice a season
       in the host's own voice. Measured on a Rate-a-Queen no-elimination
       night: "Two queens, one song, one stays, one goes." Nobody went. */
    tierBy: 'stakes',
    tiers: [tier('life', 'This is your last chance to impress me.', [
      "\"Two queens stand before me.\" The room goes quiet in the way that means something is about to end for somebody. The host looks at both of them with an expression that is equal parts sympathy and expectation. \"This is your last chance to impress me and save yourself from elimination. The time has come for you to lip sync — {s} — for your life. Good luck, and don\'t fuck it up.\"",
      "The stage clears except for the two of them. The host names the song — {s} — and the energy in the room changes shape. This is not a critique anymore and it is not a runway. It is a fight set to music, and both queens know that whatever happened before this moment counts for nothing if they win the next three minutes.",
      "\"Prior to tonight, you were asked to prepare a lip sync performance of {s}.\" The host delivers the speech with the gravity it deserves, because this is the one part of the show that is not negotiable. Two queens, one song, one stays, one goes. \"Good luck, and don\'t fuck it up.\" The music starts and both of them take their positions.",
      "The host looks at both queens and says the words that mean somebody is about to go home tonight. {s}. The positions are taken, the track drops in, and for a moment — just a moment — both of them stand perfectly still, because the first beat of a lip sync belongs to nobody and both of them know it.",
      "\"Ladies, this is your last chance to impress me and save yourself from elimination.\" The host holds the pause. \"The time has come for you to lip sync for your LIFE.\" The emphasis on the last word fills the stage. \"{s}. Now make me proud — and don\'t fuck it up.\" Both queens take their marks and the music is already coming up under his voice.",
      "\"Two queens stand before me.\" Both of them have heard the sentence from the back of the stage for weeks and neither of them has heard it from here. It is not a longer speech than usual and it does not feel like the same one. The song is {s}. Somewhere behind them the safe queens have stopped talking. Whatever either of them did earlier tonight has stopped counting, and the only thing left is three minutes and a floor.",
      "The host lets the stage settle. Two queens, two marks, one song. \"The time has come,\" he says, and the room holds its breath on the pause, \"for you to lip sync... for your life.\" He names the song — {s} — and steps back. \"And remember: don\'t fuck it up.\" The track drops. Both of them move.",
      "The host announces {s} and the announcement is a starting gun. Both queens hear the title and both queens react — one adjusts her wig, one rolls her shoulders — and the safe queens at the back of the stage go silent, because whatever is about to happen on this floor is going to decide who walks back into the werkroom and who does not.",
      "\"For your life.\" The host says it and the phrase lands on both queens at the same time, and the weight of it is the weight of everything they have done in this competition compressed into the next three minutes of {s}. The track starts. One of them moves first. The other follows half a beat later.",
      "The stage belongs to two queens and a song. The host steps back after delivering the speech — the same speech, the same gravity, the same \"don\'t fuck it up\" — and the music fills the space the host leaves behind, and {s} begins, and both queens know that the next three minutes are the only three minutes that matter.",
    ]),
    tier('win', 'The top two, and the song is the prize. Nobody can lose.', [
      "\"Ladies, prior to tonight you were asked to prepare a lip sync performance of {s}.\" The host grins, and the grin is the one he saves for a night nobody can lose. \"This is a lip sync for the WIN. Good luck, and don\'t fuck it up.\" The track drops and both queens take their marks.",
      "\"The time has come for you to lip sync — not for survival, but for the WIN.\" He lets the distinction land. \"The song is {s}. Now show me what you came here to do.\" Both queens adjust their stances and the music is already rising under his voice.",
      "\"Two queens stand before me, and tonight both of you are walking back to that werkroom.\" He pauses. \"But only one of you is walking back a winner. The song is {s}. Lip sync for the WIN, and don\'t fuck it up.\"",
      "\"{s}.\" He names it and steps back. \"Now I want to see everything. This is your moment — a lip sync for the WIN. Make mama proud.\" The track fills the room and both queens move at the same time.",
      "\"Nobody is in danger tonight, ladies. But somebody is about to win this week right here on this stage.\" He surveys both queens. \"The song is {s}. Lip sync for the WIN. Don\'t fuck it up.\" The music starts.",
      "\"I am looking at two queens who earned the right to be standing here tonight.\" He lets the room see both of them. \"The song is {s}. Now earn the rest of it. Lip sync for the WIN.\" The track rises and neither queen blinks.",
      "\"This is not a fight for survival. This is a fight for a CROWN.\" He looks at both of them and the look carries joy because tonight the stage is a reward, not a sentence. \"The song is {s}. Lip sync for the WIN.\" The music fills the stage before either queen has time to be nervous.",
      "\"Tonight the lip sync decides who wins the week.\" He says it simply. \"The song is {s}. Two queens, one song, one winner. Lip sync for the WIN.\" He steps back and the track drops before his foot has finished moving.",
      "\"You are the top two tonight, and that means you have earned three minutes on this stage with {s}.\" He pauses. \"Lip sync for the WIN. Show me why you are here.\" Both queens take their marks.",
      "\"Ladies, both of you were the best tonight.\" A beat. \"But I need to know who was THE best. The song is {s}. Lip sync for the WIN, and make me proud.\" The track rises and both queens are already on their marks before the first bar lands.",
    ]),
    tier('legacy', 'The top two, and the song decides who holds the power.', [
      "\"Ladies, prior to tonight you were asked to prepare a lip sync performance of {s}.\" The host does not grin. \"This is a lip sync for your LEGACY. The winner will have the power to decide who leaves this competition tonight. Good luck, and don\'t fuck it up.\"",
      "\"The time has come for you to lip sync for your LEGACY.\" He delivers it and the word fills the stage differently than \"life\" or \"win\" ever has. \"The song is {s}. The winner of this lip sync chooses who goes. Don\'t fuck it up.\"",
      "\"Two queens stand before me, and neither of you is in danger tonight.\" He holds the beat. \"But somebody in this room IS, and the winner of this song decides who. {s}. Lip sync for your LEGACY, and don\'t fuck it up.\"",
      "\"{s}.\" He names the song and both queens nod. \"Tonight the lip sync is not about survival. It is about power. The winner decides who leaves. Lip sync for your LEGACY.\" The track fills the room and both of them take their positions.",
      "\"Nobody on this stage is in the bottom tonight, but somebody in this room is.\" The host lets that settle. \"The song is {s}. Lip sync for your LEGACY, because the winner holds the power and the power has weight. Good luck.\"",
      "\"One of you is about to hold a lipstick with a name on it.\" The host lets that image do the work. \"The song is {s}. Lip sync for your LEGACY.\" He steps back and neither queen blinks and the track drops into the space he left behind.",
      "\"Tonight the lip sync carries a responsibility.\" The host looks at both queens. \"You are performing {s}, and the queen who wins this song earns the right to choose. Lip sync for your LEGACY.\" He steps back and the music starts.",
      "\"You earned the right to be here by being the best tonight. Now earn the right to decide.\" He pauses. \"The song is {s}. Lip sync for your LEGACY, and don\'t fuck it up.\" Both queens set their feet.",
      "\"This is not a lip sync for the week. This is a lip sync for the POWER.\" He lets the distinction land on both queens. \"The song is {s}. The winner chooses who leaves, and that choice follows you. Good luck.\" The track rises.",
      "\"Ladies, the winner of this song walks off this stage with the power to end somebody else\'s run.\" He holds the room. \"The song is {s}. Lip sync for your LEGACY.\" The music comes up and both queens take their marks.",
    ]),
    ],
  },
  {
    id: 'lipsync-beat', step: 'lipsync', scope: 'per-queen', speaker: 'narrator',
    note: 'How she performs it. One beat per queen in the lip sync, tiered by her score.',
    tierBy: 'lipsync',
    tiers: [
      tier('legendary', 'A performance the season will be remembered for.', [
        "{a} owns the stage from the first beat and does not give it back. Every word is mouthed with the timing of somebody who has performed this song a hundred times in a mirror and is now performing it for the only audience that matters. The energy is not desperation — it is authority, and the authority fills the room.",
        "This is the lip sync the season will be remembered for. {a} performs with a ferocity that transcends the format — she is not fighting for her place, she is fighting to prove something larger than survival, and the proof is in every beat, every gesture, every moment where she makes the song hers.",
        "{a} comes alive in a way that makes the rest of the night feel like a warm-up. The lip sync is flawless — the words, the emotion, the movement, the connection to the song — all of it locked in and delivered at a level that makes one of the judges put down their pen because the pen is no longer relevant.",
        "From the first bar it is clear that {a} is not lip syncing. She is performing. The distinction is the difference between survival and art, and {a} is doing the second one with a commitment so total that the other queen on the stage becomes a backdrop.",
      ]),
      tier('strong', 'She fights, and she is good at it.', [
        "{a} fights. She knows the words, she hits the beats, she uses the stage, and the performance has the energy of somebody who has decided that going is not an option and has built the next three minutes around that decision. It is not the lip sync of the season but it is a lip sync that earns a place in the room.",
        "{a} delivers a solid lip sync — committed, prepared, and present for every beat of the song. She makes eye contact with the panel at the right moments, uses the floor, and gives the kind of performance that says \"I belong here and I am showing you why\" without ever looking desperate.",
        "The lip sync is good and {a} knows it is good. She performs with the confidence of somebody who prepared for this possibility and is now executing the preparation. The words are right, the energy is right, and the fight is visible in every line she mouths.",
        "{a} does not hold anything back. The performance is full-commitment, full-energy, and full of the kind of moments that make the judges lean in. She is fighting for her life and the fight is good enough that the outcome feels earned rather than inevitable.",
      ]),
      tier('trying', 'She is giving everything and it is not quite landing.', [
        "{a} is trying. The effort is visible in every movement — too much, sometimes, which is its own problem. She knows most of the words and fills in the gaps with energy, but the energy without the precision produces a performance that reads as spirited rather than skilled, and spirited does not always win.",
        "She is fighting but the fight is not landing. {a} moves across the stage with the intensity of somebody who knows this might be her last performance and cannot quite convert that knowledge into the kind of lip sync that changes a panel\'s mind. The emotion is real. The execution is not matching it.",
        "{a} gives everything she has and what she has tonight is not quite enough. The words slip in the second verse, the energy peaks too early, and by the final chorus she is running on commitment alone. Commitment is not nothing — the panel can see how much she wants this — but wanting is not the same as delivering.",
        "The lip sync starts strong and then {a} loses the thread somewhere in the middle — a wrong word, a beat she misreads — and spends the rest of the song trying to recover. The recovery is valiant but the stumble was visible and visible stumbles on this stage do not disappear with effort.",
      ]),
      tier('lost', 'She does not know the words and the room can tell.', [
        "{a} does not know the song. It is obvious from the first verse — the mouth is moving but the shapes are wrong and the timing is off and the performance has the energy of somebody who is pretending to swim in deep water. The panel watches with the particular patience of people who have already made their decision.",
        "The song starts and {a} starts and they are not in the same place at the same time. She mouths something that might be the lyrics and might be breathing and the distinction does not matter because the other queen on the stage knows every word and the comparison is doing all the work the panel needs it to do.",
        "{a} is on the stage and the song is on the stage and they are having two separate experiences. She tries to compensate with movement but movement without lyrics is choreography, and choreography without context is just walking around, and the judges can see all of this and are waiting for it to end.",
        "It is clear within the first ten seconds that {a} did not learn the words. She watches the other queen for cues, which is the one thing you cannot do in a lip sync without the panel noticing, and the panel notices, and the performance becomes a countdown rather than a contest.",
      ]),
    ],
  },
  {
    id: 'lipsync-stunt', step: 'lipsync', scope: 'per-queen', speaker: 'narrator',
    note: 'The stunt: the split, the reveal, the jump. Fires only when one is attempted.',
    tierBy: 'stunt',
    tiers: [
      tier('landed', 'She lands it and the room comes apart.', [
        "{a} goes for the split and lands it clean and the room erupts. The judges stand. The safe queens in the back are screaming at the monitor. The stunt was timed to the song and executed with the precision of somebody who has practised this in every dressing room she has ever been in, and the practice paid.",
        "The reveal happens mid-chorus and {a} tears away the outer layer and underneath is something the panel did not see coming. The room gasps. One of the judges says something that gets lost in the noise. The stunt was a gamble and the gamble paid and the energy on the stage just shifted permanently.",
        "{a} drops into a death drop so clean that the floor should send her a thank-you card. The timing is perfect — right on the beat, right at the peak of the song — and the impact shakes the stage and the judges and everything that was undecided about this lip sync.",
        "She kicks into a move that should not work in those heels and it works in those heels. The panel reacts before they can stop themselves — one of them slaps the table, another stands up — and {a} does not break character for even a second, which is the part that makes it legendary rather than lucky.",
      ]),
      tier('failed', 'She goes for it and it does not work.', [
        "{a} goes for the split and does not make it all the way down. The landing is awkward, the recovery is worse, and the three seconds she spends getting back up are three seconds where the other queen has the stage entirely to herself. The stunt was a gamble and the gamble did not pay.",
        "The reveal is supposed to be the moment. {a} reaches for the tear-away and it does not tear, and she pulls again and it tears in the wrong place, and the panel watches with the kind of silence that is worse than laughter. The stunt was the plan and the plan just failed on live television.",
        "{a} attempts a move that her body does not quite agree with tonight. The intention is clear — it was supposed to be a moment — but the execution lands somewhere between ambitious and unfortunate, and the gap between those two things is where the lip sync slips away from her.",
        "She goes for it. She should not have gone for it. The stunt misfires — a slip, a stumble, a beat lost to recovery — and the energy that was building collapses into the particular silence of a room that just watched someone bet everything on a single moment and lose.",
      ]),
    ],
  },
  /* ── THE PAUSE BEFORE THE LAST THING SHE SAYS ──
     The call is the most structured four minutes the show has and its order
     is a decision — see js/dr/data/results-order.js. This is the beat where
     the host stops, before whichever block the night has been built to end
     on. She may say almost nothing; the silence is the beat, and the queens
     still standing there are the ones it is happening to. */
  {
    id: 'results-hold', step: 'results', scope: 'once', speaker: 'host',
    variants: 10,
    note: 'The host holds the room before the last call of the night. Written '
      + 'so it works whether what follows is a win or an elimination — it does '
      + 'NOT know which, and a line that assumes good news or bad is wrong '
      + 'half the time.',
    tierBy: 'always',
    tiers: [
      tier('hold', 'She stops, and the room stops with her.', [
        "The host looks at the queens still on the stage and takes a breath that the room takes with her. Whatever she says next changes somebody's night, and the pause before she says it is the loudest silence the stage has produced.",
        "She folds her hands. The queens standing in front of her are watching her mouth and she knows they are watching her mouth and she lets them watch it not move for three more seconds than anybody would choose.",
        "The host stops speaking and the stopping is deliberate. The room is arranged around a verdict that has not been said yet and the arrangement holds, perfectly still, while the host decides how long to let it hold.",
        "A pause that sits heavier than anything she has said tonight. The queens on the stage are breathing and the host is breathing and nobody else in the room is breathing at all.",
        "The host shifts her weight and the shift is the only motion on the stage. She is about to speak. She has not spoken yet. The gap between those two facts is where the entire room lives for the next four seconds.",
        "She takes one step forward and the step tightens every queen on the stage by half an inch. The host has not said anything. The step was the sentence.",
        "The host holds eye contact with the queen at the end of the line and the eye contact stretches past comfortable and into something that has weight. Whatever she is about to say, the queen receiving the look already knows it is for her.",
        "Silence. The host lets it build the way a host who has done this a thousand times lets it build — long enough to mean something, short enough that nobody passes out. The queens stand in it like statues who can feel their own heartbeat.",
        "The host surveys the line and her face gives nothing. The queens look back at her and their faces give everything. The asymmetry is the whole point of the pause and the pause is not over.",
        "She waits. The waiting is a performance and the queens standing on the other side of it are the audience, and the audience cannot leave, and the audience is terrified, and the host knows all of this and lets the beat sit for one more second before she opens her mouth.",
        "The host folds her hands and the folding is the cue. Every queen on the stage reads it. The room goes still. Whatever is next is next.",
      ]),
    ],
  },
  {
    /* ── THE HOLD, AND THEN THE TWO NAMES ──
       `lipsync-call` below is one paragraph that names NEITHER queen: "one
       queen lives to fight another week, the other queen is going home." It
       is a description of a verdict rather than the verdict, and the verdict
       is the most watched thirty seconds the show has.
       The real thing is a sequence and the host runs it: she holds the room
       for as long as she can bear to, she says one queen's name and lets her
       go, and then she turns to the other one. So three beats, all spoken by
       her, all naming somebody. `lipsync-call` stays as the fallback for as
       long as these are unwritten, and is skipped once they are. */
    id: 'lipsync-suspense', step: 'lipsync', scope: 'once', speaker: 'host',
    variants: 10,
    note: 'After the song and before the names. She holds the room, and the '
      + 'holding is the point — nobody breathes, including the two queens. She '
      + 'may say almost nothing here; the silence is the beat.',
    tierBy: 'always',
    tiers: [
      tier('held', 'The pause before she says a name.', [
        "\"I have made my decision.\" The host looks at both queens and lets the sentence hang there, and the hanging is the beat.",
        "\"Ladies, I have made my decision.\" The pause stretches. Both queens stare straight ahead and neither one moves.",
        "The host steps forward between both queens. \"I have made my decision.\" The silence after the sentence is louder than the song was.",
        "\"Two queens stand before me. Two queens performed their hearts out tonight.\" The host surveys the stage. \"But I have made my decision.\"",
        "\"I have made my decision.\" The host holds the pause longer than either queen would choose, and the holding is deliberate.",
        "The track fades and the host waits, looking at both of them, letting the room settle before she opens her mouth. \"I have made my decision.\"",
        "\"Ladies.\" The host folds her hands. \"This was not easy, but I have made my decision.\" The room holds its breath.",
        "\"Both of you gave me everything tonight.\" The host pauses. \"But I have to make a choice, and I have made that choice.\"",
        "The host looks at one queen and then the other and then back to the first. The silence does the work. Then: \"I have made my decision.\"",
        "\"Ladies, what you just gave this stage was extraordinary.\" A beat. \"But I have made my decision, and a decision must be made.\"",
      ]),
    ],
  },
  {
    id: 'lipsync-shantay', step: 'lipsync', scope: 'per-queen', speaker: 'host',
    variants: 10,
    note: 'SHE SAYS THE NAME. "{a}, shantay you stay." One per queen who '
      + 'survives the song — usually one, sometimes both on a double shantay, '
      + 'and several in a lalaparuza. The words themselves are fixed and the '
      + 'show says them every week; what varies is what she says around them '
      + 'and what {a} does when she hears her own name.',
    tierBy: 'always',
    tiers: [
      tier('shantay', 'She stays, and she hears it first.', [
        "\"{a} — shantay, you stay.\" {a} clasps two fists under her chin, squeezes them tight, and every breath after that one is lighter than the last.",
        "\"{a}, my dear — shantay, you stay.\" {a} drops into a curtsy so deep it is almost a collapse, and when she rises the tears are already falling.",
        "\"{a}.\" A pause. \"Shantay, you stay.\" {a} closes her eyes and nods and the nod is the whole answer.",
        "\"Shantay, you stay, {a}.\" {a} puts one hand on her sternum and takes the deepest breath she has taken all night.",
        "\"{a} — condragulations, you are safe. Shantay, you stay.\" {a} grabs the nearest queen in a hug before the sentence is finished.",
        "\"{a}, shantay you stay.\" The tension breaks and {a} laughs once — short, sharp, disbelieving — because the relief came faster than the composure could contain it.",
        "\"Shantay, you stay.\" The host says it directly to {a} and {a} receives it with one slow nod and both fists clenched at her sides.",
        "\"{a}, you may join the other girls. Shantay, you stay.\" {a} touches her own face, presses her lips together, and walks to the back of the stage.",
        "\"Shantay, you stay, {a}.\" {a} mouths the word thank you three times before the sound comes out.",
        "\"{a}. Shantay — you stay.\" {a} brings both hands together, bows her head once, and the bow is the most honest thing she does all night.",
      ]),
    ],
  },
  {
    id: 'lipsync-sashay', step: 'lipsync', scope: 'per-queen', speaker: 'host',
    variants: 10,
    note: 'AND THEN THE OTHER ONE. She turns to {a}, says something that is '
      + 'hers alone — the host is warm here and has been watching her all '
      + 'season — and then "now sashay away." The kindness before the sentence '
      + 'is the part that varies; the sentence does not.',
    tierBy: 'always',
    tiers: [
      tier('sashay', 'She goes, and the host tells her so herself.', [
        "\"{a}, every single person watching knows how fierce this queen is. Now — sashay away.\" {a} lifts her chin, takes one long breath, and exits without looking back.",
        "\"{a}, my dear, I am so proud of what you have shown us. Now, sashay away.\" {a} blows a kiss to the room and turns.",
        "\"{a}. You fought hard tonight and I respect that. Now, sashay away.\" {a} stands tall, takes a breath, and walks to the back of the stage.",
        "\"{a}, you brought something special to this competition. Now, sashay away.\" {a} mouths thank you and heads for the door.",
        "\"{a}, this is not the end for you. But tonight — sashay away.\" {a} presses her hands together, bows once, and goes.",
        "\"{a}, remember who you are and what you came here to do. You did it. Now, sashay away.\" {a} nods and the nod holds everything she cannot say out loud.",
        "\"{a}, my dear. You have so much more to give. Now — sashay away.\" {a} touches her heart, looks at the room one last time, and walks.",
        "\"{a} — I am sorry, my dear, but you must sashay away.\" {a} closes her eyes for one second, opens them, and leaves the stage standing straight.",
        "\"{a}, thank you for everything. Now, sashay away.\" {a} waves to the queens at the back and the wave is small and steady and it is the last thing she gives the room.",
        "\"{a}, you are a star. Don\'t let tonight change that. Now — sashay away.\" {a} straightens her back and walks and the walking is the bravest part.",
      ]),
    ],
  },
  // ══ THE NIGHT THE SONG IS A PRIZE ════════════════════════════════════
  //
  // A for-the-win night and a legacy night both put the two BEST queens on
  // the song, and neither of them can be eliminated by it. The stage had no
  // prose for either: `lipsync-call` has no tier for those calls, and
  // stage.js falls back to `tiers[0]` — the shantay tier — so a night nobody
  // could lose was narrated as "the half where somebody stays and the half
  // where somebody goes", and THE WINNER'S NAME WAS NEVER SAID. Measured on
  // a Rate-a-Queen no-elimination night: the queen who won the song, and the
  // week with it, is not named once on her own screen.
  //
  // These four beats are the named sequence for those nights, and they are
  // the exact counterpart of lipsync-shantay/lipsync-sashay: she says the
  // name, the queen answers, and then she turns to the other one.
  //
  // THE VOCABULARY IS THE WHOLE POINT. Nobody is saved here, so nothing in
  // these pools may say "shantay", "safe", "stay", or "sashay" — those are
  // survival words and this is not a survival night. See the pool notes.
  {
    id: 'lipsync-win-name', step: 'lipsync', scope: 'per-queen', speaker: 'host',
    variants: 10,
    note: 'SHE SAYS THE NAME OF THE QUEEN WHO TOOK THE SONG. The counterpart '
      + 'of `lipsync-shantay` on a night nobody can go home. {a} won the lip '
      + 'sync; on a `win` night that also wins her the week, and on a '
      + '`legacy` night it wins her the power to eliminate.',
    tierBy: 'stakes',
    tiers: [
      tier('win', 'She took the song, and the song was the week.', [
        "\"{a} — condragulations, you\'re a winner, baby.\" {a} clasps both fists under her chin and squeezes, and every part of her face that was holding still lets go at once.",
        "\"Condragulations, {a}. You have won this week\'s challenge.\" {a} drops into a curtsy and comes back up with tears already running, and the tears are the honest kind that arrive before the composure can catch them.",
        "\"{a}.\" A pause that knows what it is doing. \"Condragulations — you are the winner of tonight\'s lip sync.\" {a} puts one hand on her sternum and presses hard, as if the win needs to be held in place.",
        "\"The winner of tonight\'s lip sync is — {a}. Condragulations, my dear.\" {a} closes her eyes and nods once and the nod is the whole answer, delivered before she trusts herself to speak.",
        "\"{a}, condragulations. You\'re a winner, baby. You have won this week\'s challenge.\" {a} grabs the nearest queen in a hug that arrives faster than the sentence ends.",
        "\"Condragulations, {a}.\" The host says it simply and {a} receives it with both hands over her mouth and a sound that is not a word but means more than one.",
        "\"{a} — condragulations.\" {a} presses her palms together, bows her head, and when she lifts it the smile has rewritten her entire face from the mouth outward.",
        "\"Tonight\'s winner is {a}. Condragulations.\" {a} takes the deepest breath she has taken all night and lets it out as a laugh — short, sharp, disbelieving — because the win landed before she was ready for it.",
        "\"{a}. Condragulations, you\'re a winner, baby.\" {a} mouths the words thank you three times before the sound arrives, and when it does it cracks on the second syllable.",
        "\"Condragulations, {a}. You are this week\'s winner.\" {a} straightens her back and stands taller than she has stood all night, and the standing is the first thing she does with the win.",
      ]),
      tier('legacy', 'She took the song, and the song was the power.', [
        "\"{a} — condragulations, you have won the lip sync.\" The host holds her gaze. \"With that comes the power to decide which queen in the bottom must leave.\" {a} nods, and the nod is slower than any nod she has given all night.",
        "\"The winner of tonight\'s lip sync is {a}.\" The host lets the name land. \"And that means, {a}, you now hold the power.\" {a} presses her lips together and the weight of it arrives on her face before the sentence is finished.",
        "\"{a}. Condragulations.\" A beat that is not a celebration. \"You have earned the right to choose.\" {a} takes a breath and the breath is not relief — it is preparation for a decision she has to make in front of everyone.",
        "\"Condragulations, {a}. You have won the lip sync for your legacy.\" The host does not smile. \"You now have the power to decide who leaves this competition tonight.\" {a} closes her eyes for one second and when she opens them her jaw is set.",
        "\"{a}, you have won the lip sync.\" The host delivers it and then delivers the rest. \"That means you hold the power, and the power is a choice.\" {a} folds her hands together and the folding has the quality of somebody bracing for what she is about to do.",
        "\"Condragulations, {a}.\" The word sounds different on a legacy night — heavier, less like a prize and more like a responsibility. \"You now decide which queen in the bottom leaves tonight.\" {a} straightens her back and the straightening is the first decision she makes with the authority.",
        "\"{a}. You took that song.\" The host pauses. \"And with it, you have taken the power to send one of the bottom queens home.\" {a} nods once, chin up, and the chin is doing the work her voice cannot.",
        "\"The power belongs to {a} tonight.\" The host says it directly and {a} receives it standing perfectly still, because the thing she has just been given is not a trophy — it is a burden dressed as a prize.",
        "\"{a}, condragulations. The lip sync is yours, and so is the decision.\" {a} exhales once through her nose and the exhale is the only tell — everything else on her face is already the face of somebody who knows what she has to do next.",
        "\"Condragulations, {a}. You have won the lip sync.\" The host holds the room quiet. \"You now hold the power to decide who leaves.\" {a} puts one hand on her hip and it looks like confidence until you notice the fingers are pressing into the bone.",
      ]),
    ],
  },
  {
    id: 'lipsync-win-reaction', step: 'lipsync', scope: 'per-queen', speaker: 'queen',
    variants: 6,
    note: 'AND THEN SHE ANSWERS IT — {a}, in her own voice, in the second '
      + 'after the host says her name. The exact counterpart of '
      + '`sashay-words`, which is the last card of an elimination night: this '
      + 'is the last card of a night she won. Tiered by swagger group so the '
      + 'queen who has been narrating her own runway walks all season sounds '
      + 'like herself when she finally gets something.',
    tierBy: 'swagger',
    tiers: [
      tier('predator', 'She expected this and says so.', [
        "\"I told them.\" {a} adjusts a ring on her finger without looking at it. \"I told every single one of them this was going to happen, and they smiled, and now here we are.\" The smile she gives the room is warm and completely terrifying.",
        "\"Was there ever any doubt?\" {a} tilts her head and the question is not a question. She straightens her wig with one hand, slowly, as if the moment belongs to her and she is deciding how long to let it last.",
        "\"This is what I came here to do.\" {a} folds her arms and surveys the stage like she owns the building. \"Every single week, this. Remember that.\" Her voice is even and the evenness is the threat.",
        "\"I would say I am surprised, but I have never been a good liar.\" {a} runs her tongue along her top teeth and the gesture is the kind of thing a person does when they have been right about themselves for a very long time.",
        "\"Thank you. Truly.\" {a} presses her palms together and bows, and the bow is so precise it might be rehearsed, which is exactly the point. \"Now — who wants to tell me I didn\'t earn that?\" Nobody does.",
        "\"You are welcome.\" {a} drops a small curtsy that is more possession than gratitude, and the queens watching from the back of the stage do not make a sound, because the quiet is hers and they know it.",
      ]),
      tier('sunshine', 'She is delighted and hides none of it.', [
        "\"Oh my GOD.\" {a} puts both hands on her cheeks and the tears are already there, already falling, already making a mess of the beat she spent forty minutes on. \"I cannot — I literally cannot right now.\" She laughs through the tears and the laugh is pure.",
        "\"Thank you, thank you, thank you.\" {a} grabs the nearest queen and holds on, and the holding is not performance — it is a person who needs to touch another person because the feeling is too large to carry alone. \"I love this so much.\"",
        "\"I — oh.\" {a} fans her face with both hands and the fanning does nothing. \"I promised myself I would not cry and I am SUCH a liar.\" She laughs once, huge and uncontrolled, and the laugh fills the stage.",
        "\"This is the best night of my life.\" {a} says it simply and the simplicity is what makes it land. She puts one hand on her chest and breathes and the breath shudders on the way out because the joy arrived faster than the composure could hold it.",
        "\"I just — I cannot believe this.\" {a} bounces on her toes twice and the bouncing is involuntary, the body doing what the body does when the feeling is too big to stand still inside. \"Thank you. I mean it. Thank you.\"",
        "\"Oh my god, oh my god.\" {a} covers her mouth and the sound behind her hand is somewhere between a laugh and a sob and she does not try to sort them out. She reaches for the queen beside her and squeezes her arm and does not let go.",
      ]),
      tier('firecracker', 'The adrenaline has nowhere to go.', [
        "\"LET\'S GO.\" {a} throws both arms up and the scream that follows is not a word — it is adrenaline that has been sitting in a body for three minutes and has finally been told it can leave. She spins once on her heel and nearly falls and does not care.",
        "\"I TOLD YOU.\" {a} is pointing at nobody in particular and the pointing is wild and the voice is louder than the room needs it to be and she does not notice because the volume is not a choice right now.",
        "\"Oh, you thought?\" {a} slaps her own thigh and cackles. \"You actually thought?\" She is talking to the stage and the stage does not answer and she does not need it to. The cackle keeps going.",
        "\"YES. YES. YES.\" {a} pounds her fist into her palm three times and each time is harder than the last. She is vibrating. The room can see it. She is not going to stop vibrating for at least an hour.",
        "\"THAT is what I am talking about.\" {a} drops into a squat and comes back up like a spring and the energy has no direction and no plan and no intention of slowing down. \"I said what I said and I MEANT it.\"",
        "\"Woo.\" {a} blows out a long breath and then immediately laughs because the breath did nothing. \"WOO.\" The second one is louder and more honest and the queens watching from the back are laughing because the chaos is contagious.",
      ]),
      tier('professional', 'She takes it like a craftsman, not a fan.', [
        "\"Thank you.\" {a} nods once, precisely. The hand she puts on her chest is steady and the gratitude is real but it is gratitude that knows its own shape — a craftsman accepting a verdict she worked for and expected to receive.",
        "\"I prepared for that, and it went the way I prepared for it to go.\" {a} folds her hands and the folding is calm and the calm is earned. She is not surprised. She is satisfied, which is a different thing and a rarer one.",
        "\"I came here to do a job, and the job is done.\" {a} straightens her shoulders and the straightening is the reaction — not tears, not screaming, just the posture of a person who measures herself by the work and the work measured up.",
        "\"I appreciate it.\" {a} takes a slow breath and lets it out even slower. The face gives very little and the little it gives is enough — a tightening around the eyes that reads as pride to anybody who knows what pride looks like when it is quiet.",
        "\"Good.\" {a} says it under her breath and the word is for herself, not the room. She adjusts her earring, checks her reflection in the nearest surface, and walks back to the line with the stride of somebody who finished what she started.",
        "\"That felt right.\" {a} presses her palms together once, briefly, and the gesture is a period at the end of a sentence rather than an exclamation mark. She is already thinking about next week.",
      ]),
      tier('scrapper', 'She has not had much and she knows what this is.', [
        "\"I —\" {a} stops. Starts again. \"I have never won anything like this before.\" The words come out careful and slow and the slowness is a person trying not to break something she has just been handed for the first time.",
        "\"They told me I couldn\'t and I am standing right here.\" {a} says it quietly and the quiet is louder than any scream because she means every syllable and the room can hear that she means them. She wipes one eye with the back of her hand.",
        "\"This is — a lot.\" {a} laughs once and the laugh cracks in the middle. \"I just want everyone who said I wasn\'t good enough to see this.\" She touches her own face as if checking that it is still there.",
        "\"Thank you for seeing me.\" {a} says it to the room and the room goes quiet because the sentence is too honest to talk over. She presses her lips together and nods and the nod is the thing she does instead of crying.",
        "\"I have been waiting my whole life for something like this and I did not know that until right now.\" {a} puts both hands on her knees and bends forward and the bending is the weight of it arriving all at once.",
        "\"Oh.\" {a} covers her mouth and the sound behind her hand is small and private and the room lets her have it. \"I did that. I actually did that.\" She straightens up and the straightening is a person who just learned something about herself.",
      ]),
    ],
  },
  {
    id: 'lipsync-win-runnerup', step: 'lipsync', scope: 'per-queen', speaker: 'host',
    variants: 8,
    note: 'AND THEN THE OTHER ONE. {a} lost the song and IS NOT IN DANGER AND '
      + 'WAS NEVER IN DANGER — she was one of the two best queens on this '
      + 'stage tonight, which is how she got on it. She is not saved, she is '
      + 'not safe, and she is not staying: none of those words apply to a '
      + 'queen who was never at risk. She came second in a fight for a prize.',
    tierBy: 'stakes',
    tiers: [
      tier('win', 'She came second for the week.', [
        "\"You gave a beautiful performance tonight.\" The host holds {a}'s gaze and the gaze is warm but the warmth does not contain the word \"condragulations.\" {a} nods. The nod is small and the room reads it correctly: she knows what second place is and she is not pretending it is first.",
        "{a} stands in the spot where a winner stood a moment ago and the difference between the two spots is one sentence. The host thanks her and the thanks is genuine and {a} receives it with a grace that costs her something, which the room can see.",
        "\"You turned it out, and you should be proud of what you did on that stage.\" {a} presses her lips together and the pressing is the thing she does instead of letting the face break. She came to win the song and she did not win the song and the host is being kind about it, which is almost harder.",
        "The host turns to {a} and the turn carries respect but not a crown. \"That was a hell of a fight.\" {a} tilts her head and the tilt says \"I know\" and the knowing is earned because she was there and she felt the song leave her hands midway through the second verse.",
        "{a} hears the compliment and takes it and puts it somewhere that is not the place where victories go. She bows her head once, briefly, and when she raises it the face is composed and the composure is real, not performed — she is a queen who gave everything and came up one sentence short.",
        "\"Thank you for that lip sync.\" The host says it directly to {a} and {a} smiles and the smile is the kind that arrives a beat late because the body needed a moment to decide what to do with the feeling of losing a fight she wanted to win.",
        "The runner-up stands on the stage and the stage does not feel smaller but it feels different — the air has changed since the winner's name was called and {a} is standing in the air that is left. She straightens her shoulders and the straightening is dignity, not defiance.",
        "{a} takes a breath and the breath is the size of a person who gave a performance and was told it was the second-best performance in the room. The host nods at her and the nod says \"you belong here\" and {a} nods back and the exchange is enough.",
      ]),
      tier('legacy', 'She came second for the power, and somebody else now holds it.', [
        "{a} lost the song and the song was the power to decide who leaves, and the power is now in somebody else's hands. She stands on the stage and the standing is the particular stillness of a person who knows that the next thing that happens in this room is not hers to control.",
        "\"You gave a great performance.\" The host means it and {a} hears it but what {a} hears louder is the absence of the other sentence — the one that would have put a queen's fate in her hands. That sentence went to the other side of the stage and {a} watches it arrive there instead.",
        "The host thanks {a} and the thanks lands on a queen who is processing two things at once: the loss of the song and the knowledge that somebody else now holds the power and will spend it on a name that {a} cannot influence.",
        "{a} steps back and the step is the step of a person yielding a stage to the winner, and tonight yielding the stage means yielding the decision. The power to send a queen home crossed the stage during the song and landed on the other side.",
        "\"That was a fight.\" The host says it to {a} and {a} nods and the nod carries the weight of a person who understands exactly what she just lost — not just the song, but the pen that writes the name on the lipstick. Somebody else holds that pen now.",
        "The runner-up stands and the room is already turning its attention to the winner because the winner is about to do a thing that nobody else in this room can do tonight. {a} feels the attention shift and the shift is its own verdict.",
        "{a} presses her palms together once and the gesture is a thank-you for the chance and a release of the outcome and the release is harder than it looks because the outcome tonight was not just a trophy — it was a sentence that decides whether somebody stays or leaves.",
        "The host catches {a}'s eye and holds it for a moment that says \"you fought well\" without saying the rest, which is \"and you lost, and the person who won is about to do something irreversible, and you will watch.\" {a} holds the gaze and lets it go.",
      ]),
    ],
  },
  {
    id: 'lipsync-legacy-choice', step: 'lipsync', scope: 'pair', speaker: 'host',
    variants: 8,
    note: 'THE LEGACY NIGHT ONLY, AND THE THING THAT WAS NEVER NARRATED AT '
      + 'ALL. {a} won the song and now spends it: she names {b}, and {b} goes '
      + 'home. week.js emitted this as a marker with an empty string for '
      + 'text and nothing in js/ rendered that kind, so on a legacy night the '
      + 'queen who was eliminated left the season without the screen ever '
      + 'saying who sent her or that she had been sent.',
    tierBy: 'always',
    tiers: [
      tier('choice', 'She holds the power and she uses it, out loud, on {b}.', [
        "{a} walks to the lipstick rack and the room holds its breath and she uncaps the tube and the name written on it is {b}. The room exhales. {b} closes her eyes for one second and opens them and the opening is a person who has just been told her season is over by somebody who was standing next to her an hour ago.",
        "\"I have made my decision.\" {a} turns the lipstick toward the room and the name on it reads {b}, and {b} nods once because the nod is the only response available to a queen who has just been named by another queen in front of everyone she has worked beside for weeks.",
        "The host asks {a} to reveal her choice and {a} holds up the lipstick and the name is {b}. The room does not gasp — the room goes quiet, which is worse. {b} stands still and the stillness is a queen processing a verdict that was written by someone who earned the right to write it.",
        "{a} says the name out loud — \"{b}\" — and the name fills the room. {b} takes it in and the taking-in happens behind her eyes where nobody can see it except the people who are watching closely, and tonight everybody is watching closely.",
        "The lipstick is uncapped and the name is {b} and {a} delivers it with the steadiness of a queen who made this decision before the song was over and has been carrying it since. {b} hears it and the hearing is the loudest quiet thing that has happened on this stage all night.",
        "{a} holds the power and the power has a name and the name is {b}. She says it clearly and without hesitation and the clarity is a kindness even if the verdict is not. {b} receives it standing up and the standing is its own statement.",
        "\"The queen I have chosen to leave tonight is {b}.\" {a} says it and the sentence ends and the room holds the ending. {b} presses her lips together and breathes out through her nose and the breath is a person deciding how to carry this in front of an audience.",
        "The host nods at {a} and {a} reveals the lipstick and {b} sees her own name on it and the seeing is a thing that takes longer than it should because the brain needs a moment to turn a name on a tube into a sentence about the rest of her season. {b} nods. The nod is enough.",
      ]),
    ],
  },
  {
    id: 'lipsync-call', step: 'lipsync', scope: 'once', speaker: 'host',
    note: 'The verdict. Shantay, sashay, or one of the rarer calls.',
    tierBy: 'call',
    tiers: [
      tier('shantay', 'One stays, one goes.', [
        "\"Shantay, you stay.\" The words go to one queen and the absence of them goes to the other. The queen who stays takes a breath that fills her entire body. The queen who does not receives the silence and nods and begins the walk that every queen in this room knows is coming for all of them eventually.",
        "The host looks at both of them and the decision is in the eyes before it is in the words. \"Shantay, you stay.\" One queen lives to fight another week. The other queen is already being hugged by the safe queens in the back, because the walk to the door starts here.",
        "\"Shantay, you stay.\" One queen presses her palms together and mouths \"thank you\" and the relief rewrites her entire face. The other queen straightens her back because she is about to walk off this stage and she is going to do it the way she came onto it — upright, in drag, and looking like somebody who was here.",
        "The call is made and the stage splits into two halves — the half where somebody stays and the half where somebody goes. \"Shantay, you stay\" is said once and means everything to the person who hears it and everything different to the person who does not.",
      ]),
      tier('double-elimination', 'Both queens go. Nobody was safe on that stage.', [
        "The host looks at the two of them for a long time and then does not say shantay to either one. \"I am sorry, my dears.\" A beat that costs the room something. \"Both of you — sashay away.\" It is the only call of the night and it takes two queens with it.",
        "\"There is no shantay tonight.\" The host says it plainly and both queens hear the whole sentence before either reacts. \"Both of you are going home.\" They take each other\'s hands on the way to the back, which is more than either of them expected to have at the end of this.",
        "Two queens lip synced for their lives and neither of them keeps it. The host tells them both, in the same sentence, in a voice that does not enjoy it: \"Sashay away.\" The queens still standing at the back of the stage do not make a sound.",
        "The call is a double and the host does not draw it out. Both names, one after the other, both leaving. One of them starts to argue and stops. The other has already turned toward the door, because she worked it out four bars into the song.",
      ]),
      tier('no-elimination', 'A night that was never going to send anybody home.', [
        "The music stops and the host lets the room hold its breath for a moment it does not need to hold. \"Ladies,\" he says, \"I have already made my decision about tonight. Nobody is going home.\" The scream that follows is the loudest sound either queen has made all day, and neither of them is entirely sure whether to be relieved or robbed.",
        "\"Now — you both fought for that.\" The host looks at the two of them and then at the room. \"But tonight is not an elimination. Both of you are staying.\" One of them puts her hands over her face. The other laughs, once, in the way somebody laughs when the adrenaline has nowhere to go.",
        "There is no sashay tonight and the queens on that stage did not know that until this second. \"Shantay,\" the host says, and then, before anybody can work out who it was aimed at, \"you BOTH stay.\" The room comes apart. Somewhere in it, the queen who lost that lip sync is doing the arithmetic on how close that was.",
        "The host thanks them both and does not reach for either phrase. \"Nobody is leaving this competition tonight,\" he says. \"Which means both of you go back to that workroom knowing exactly how it feels to stand here. Use it.\" They walk off together. Neither one says anything until the door closes.",
        "\"Two queens stood before me,\" the host says, \"and two queens are walking back.\" It is not the sentence either of them was braced for. The relief arrives late and all at once, and one of them has to be helped off the stage by the other, which is the first real thing that has happened between them all season.",
      ]),
      tier('double-shantay', 'Both were too good to lose. Nobody goes home.', [
        "The host pauses longer than usual and both queens are standing there expecting the worst and then: \"Shantay, you both stay.\" The stage erupts. Nobody goes. The lip sync was too good to end with a loss and the panel has decided that both of them earned another week, and the relief that hits both queens at the same time is visible from the back of the room.",
        "\"I have made my decision.\" The pause is long enough to stop time. \"Shantay, you both stay.\" Both queens stare at the host for a full second before the words land, and then they land all at once — the tears, the hug, the scream from the back where the safe queens are watching. Nobody is going tonight. Both of them were too good.",
        "Neither queen expected this. The host says the words and both of them look at each other and then at the host and then at each other again because a double save means the lip sync was something special and they both know it and the knowing is bigger than the relief.",
        "\"Shantay, you BOTH stay.\" The emphasis on \"both\" is where the room breaks open. Two queens who were fighting for their lives are suddenly not fighting anymore and the transition from combat to gratitude happens in real time on their faces and it is the most honest moment of the night.",
      ]),
      tier('double-sashay', 'Both were bad enough that both go.', [
        "The host does not say \"shantay.\" The host says something worse: neither of them will be staying. The stage goes cold. Both queens hear it at the same time and the shared devastation bonds them for exactly the length of time it takes to walk to the door together, which is longer than either of them expected.",
        "\"Neither of you will be staying.\" The words land on the stage like a verdict from a court that does not offer appeals. Both queens stand there. Neither argues. The lip sync was what it was and what it was, tonight, was not enough for either of them.",
        "It is the rarest call and neither queen was prepared for it. Both of them are going. The host delivers it with gravity and both queens nod because the nod is the only thing available to them — there is no argument to make when both performances failed to clear the bar.",
        "\"I am sorry, my dears, but neither of you has shown me enough to stay.\" The words settle over both queens at the same time. There is a shared glance — not quite solidarity, not quite blame — and then they both begin the walk that leads away from the stage and toward the door.",
      ]),
      /* THE TWO CALLS THAT HAD NO TIER. `week.js` emits `for-the-win` and
         `legacy`, and neither existed here — so `stage.js`'s
         `tiers.find(id) || tiers[0]` handed both of them the SHANTAY tier,
         which is the tier that says one queen stays and one goes. Two nights
         a season narrated as an elimination that did not happen.
         These are the FALLBACK for those calls; the named sequence above
         (`lipsync-win-name` and the beats around it) is what actually runs
         once its pools are written, exactly as `lipsync-shantay` supersedes
         the `shantay` tier below. */
      tier('for-the-win', 'The top two sang for the win. Nobody went home.', [
        "The call is made and the call is a crown, not a farewell — one queen earned the week and both queens earned the right to walk back into the werkroom together. The stage exhales because tonight the music decided a winner, not a departure.",
        "Nobody leaves tonight. The lip sync was a fight for a crown, not a fight for survival, and the room can feel the difference in the way the queens stand when the music ends — upright, both of them, because upright is the only posture available when neither of them is walking to the door.",
        "The host delivers the verdict and the verdict is a name and a prize and the absence of a goodbye. Both queens stay. One of them won the song and the other one gave a performance that, on any other night, would have been enough — and tonight it was enough, just not the most.",
        "Two queens sang and one of them won and neither of them lost, not in the way this show usually means when it says \"lost.\" The winner takes the week. The runner-up takes the knowledge that she stood on this stage and fought and walked away standing.",
      ]),
      tier('legacy', 'The top two sang for the power to eliminate.', [
        "The lip sync ends and the power lands. One queen now holds the decision that will end another queen's run, and the room can see the weight of it arrive on her face the moment the host says her name. The other queen steps back and the stepping-back is a person watching authority pass to someone else.",
        "They sang for the right to choose who leaves and one of them won that right and the right is heavier than any trophy this show has ever handed out. The winner holds the lipstick and the lipstick holds a name and the name belongs to a queen who is somewhere in this room not knowing it yet.",
        "The music stops and the host speaks and one queen receives the power to send somebody away. The room shifts. The bottom queens at the back of the stage go still because the stillness is the only thing available to a person whose fate was just placed in another queen's hands.",
        "Two queens fought for a pen and one of them won it and the pen writes one name and the name is a ticket out the door. The winner holds the instrument and the room watches her hold it and the watching is the particular silence of people who know that what comes next cannot be taken back.",
      ]),
      tier('triple', 'Three of them fought and one of them loses.', [
        "They stood on that stage together and fought and one of them is going. The host names who stays — twice — and each \"shantay\" lands with relief for one and dread for the remaining. The queen who is left standing without a save closes her eyes for one second and then opens them and walks.",
        "A three-way lip sync is a war with three fronts and tonight one queen lost on all of them. The host calls two names and both of those names get to stay and the third name is never said, which is its own kind of verdict. The departing queen hugs the other two because the fight was real even if the result was not what she wanted.",
        "They all fought. All but one of them stay. The one who does not is the one who knew, halfway through the song, that the stage was slipping away from her — and the knowing did not help, because knowing and fixing are not the same thing at the speed of a lip sync.",
        "\"Shantay, you stay.\" Twice. And then the silence that follows the second one is the silence where the third queen understands that the third call is not coming. She nods. She hugs the two who stayed. She walks to the back to say her goodbyes and the walk is steady, which is the most she can give the room right now.",
      ]),
      tier('double-out', 'Three fought. One stays. Two sashay.', [
        "Three queens lip synced and only one of them is staying. The host says \"shantay, you stay\" once and only once, and the name it lands on exhales hard enough for the whole room to hear it. The other two stand there and the standing is the particular stillness of two queens who both understand the same sentence at the same time. \"Sashay away.\" It takes both of them and the room folds in on itself.",
        "The host lets the song end and lets the silence after it go on for exactly as long as it needs to. Then one name. One \"shantay.\" One queen who gets to stay. The other two receive no such word and the absence of it is the verdict: two queens are going home tonight and both of them knew it was possible and neither of them believed it would be them.",
        "\"Shantay, you stay.\" One queen. The relief on her face is enormous and immediate and she presses both hands over her mouth. The other two are still standing on that stage and the host turns to them and the turning is slower than it needs to be. \"I am sorry, my dears. Both of you — sashay away.\" Two queens leave tonight and the room is smaller for it.",
        "One name is called and that name gets to breathe. The other two names are not called and the not-calling is louder than the calling was. Two queens are leaving tonight because the show said two were leaving and the show does what it says. They hug each other first and then they hug the queen who stayed and then they walk.",
      ]),
    ],
  },

  // ══ THE NIGHT THE PANEL SAYS NOTHING ═════════════════════════════════
  //
  // On a Rate-a-Queen week the judges do not critique. That is the twist:
  // the room decides, so there is nothing for the panel to say between the
  // runway and the call, and the host says so instead.
  //
  // It sits in the CRITIQUES slot because that is the hole it fills — the
  // queens are still standing on the stage waiting to be told something, and
  // what they are told is that nobody is going to tell them anything.
  {
    id: 'rate-announce', step: 'critiques', scope: 'once', speaker: 'host',
    variants: 6,
    note: 'The host tells the room the panel is sitting this one out and they '
      + 'are deciding it themselves. No {a} — it is said to everybody.',
    writerNote: 'He is enjoying this and he should not hide it. The sentence '
      + 'underneath is "I am taking my own power away and handing it to the '
      + 'people you have been living with", and every queen on that stage '
      + 'does the arithmetic on that in real time. Say what they have to do — '
      + 'rank each other, top to bottom — and what it decides: the top of the '
      + 'week and the bottom of it. Do not say who wins or who lip syncs; '
      + 'that is the call, and it has not happened yet.',
    tierBy: 'always',
    tiers: [tier('announce', 'No critiques tonight. They are doing it.', [
      '"Tonight," the host says, and the grin is already leaking through, "the judges will not be critiquing you." The queens look at each other. "Instead, you will be rating each other — top to bottom — and the results will determine who is in the top and who is in the bottom tonight." The arithmetic hits every face at once.',
      '"This week, the panel is stepping back." The host lets that land. "You are going to rank each other. Every queen rates every other queen, and when those numbers come in, they decide who rises and who falls tonight." The queens stand on that stage and do the maths with their friendships.',
      '"No critiques tonight." The host says it like a gift and means it like a dare. "Your sisters are going to rate you — every one of them, top to bottom — and the placements come from those numbers." The stage is silent in the particular way that means everybody is counting allies.',
      '"The panel had a lot to say about what they saw tonight." The host pauses. "But they are not going to say any of it. Instead, the people who know your work best — the queens standing on this stage — will rank each other, and those rankings decide everything." Every smile in the room acquires a second meaning.',
      '"I am handing the power to you." The host turns the sentence over like he is enjoying the weight of it. "Each of you will rate every other queen, top to bottom. The highest average rises. The lowest falls. The judges are watching — but tonight, the judges are not deciding."',
      '"No panel tonight, ladies." The host lets the relief begin and then finishes the sentence. "You will be rating each other. Every queen in this room, ranked by every other queen in this room, and the numbers will tell me who was the best and who was the worst." The relief evaporates. The room recalculates.',
    ])],
  },

  // ══ WHAT THE SONG IS FOR ═════════════════════════════════════════════
  //
  // Two queens standing on a stage about to lip sync is the same picture
  // whether they are fighting to survive or fighting to win, and the screen
  // never said which. On an ordinary night it is for her life. On a
  // Rate-a-Queen with nothing at stake it is the top two, for the win. On a
  // Legacy night it is for the power to send somebody home.
  {
    id: 'call-stakes', step: 'results', scope: 'pair', speaker: 'host',
    variants: 6,
    note: 'After the top and the bottom have been called: what the song is '
      + 'actually for tonight. {a} and {b} are the two who will sing it.',
    writerNote: 'One or two sentences, said last, after the names. The whole '
      + 'job is to make the stakes unmistakable before the music starts, '
      + 'because the picture is identical either way and the meaning is not.',
    tierBy: 'stakes',
    tiers: [
      tier('life', 'The ordinary night: the bottom two, for their lives.', [
        '"{a}, {b} — the time has come for you to lip sync for your life." The sentence means exactly what it always means: one of them stays and one of them does not, and the song is the only thing left between each of them and the door.',
        '"Two queens stand before me." The host looks at {a} and then at {b} and the look says all of it. "This is a lip sync for your LIFE." The emphasis lands where it always does and the weight of it never gets lighter.',
        '"Ladies, this is a lip sync for your life." {a} and {b} take their marks and the stakes are the simplest version of themselves: survive the song or go home tonight. There is no consolation round and there is no second chance.',
        '"{a}, {b}." The host holds the pause. "One of you will stay, and one of you will sashay away." The words are the same as every other night and the meaning of them has never once been diminished by repetition.',
        '"For your life." The host delivers it to both of them and both of them receive it standing. Whatever happened on the runway and whatever the panel said has been compressed into a song and a floor, and {a} and {b} already know the song is the only argument either of them has left.',
        '"This is a lip sync for your life, ladies." The host steps back and the step is the last soft thing either of them will see tonight. {a} and {b} face the stage and the stage is suddenly the only thing left in the building.',
      ]),
      tier('win', 'The top two, for the win. Nobody is going home.', [
        '"{a}, {b} — tonight you will be lip syncing not for your life, but for the WIN." The emphasis changes the room. Nobody is in danger and nobody is going home, and the song is a victory lap with a prize attached.',
        '"This is not a lip sync for survival, ladies — this is a lip sync for the win." The host grins. {a} and {b} are the best two queens on the stage tonight and the song is going to decide which of them is the best one.',
        '"{a}, {b}, you will be lip syncing for the WIN tonight." The host lets the word do its work. No one goes home. The song is a reward, not a punishment, and the queen who wins it wins the week.',
        '"Ladies, tonight the lip sync is for the win." {a} and {b} look at each other and the look is not the look of two queens who are afraid. It is the look of two queens who are about to compete for something they both want, and the song is the arena.',
        '"For the win." The host says it simply because it does not need to be complicated. {a} and {b} earned this song by being the best tonight, and whoever takes it gets to keep what the panel already gave them.',
        '"No one is going home tonight." The host looks at {a} and {b} and the relief does not last because the next sentence replaces it with ambition. "Instead, you will lip sync for the WIN." Both queens adjust their stances. The fight just changed shape.',
      ]),
      tier('legacy', 'The top two, and the winner decides who goes home.', [
        '"{a}, {b} — you will be lip syncing tonight, and the winner will have the power to eliminate one of the bottom queens." The sentence rewrites the stakes entirely. They are not fighting for themselves. They are fighting for the right to send somebody else home.',
        '"This is a lip sync for your LEGACY." The host delivers it and the word fills the stage. {a} and {b} are not in danger. The bottom queens are in danger, and the winner of this song is the one who decides which of them goes.',
        '"Ladies, you are the top two tonight, and that means you lip sync for the power to eliminate." {a} and {b} hear it and the responsibility is visible. Whoever wins the song chooses who leaves, and that choice is going to follow her for the rest of the season.',
        '"Tonight, the winner of the lip sync will choose which queen in the bottom goes home." The host says it evenly. {a} and {b} are performing for the right to make a decision that nobody in this room is going to forget.',
        '"For your legacy." The host pauses long enough for the meaning to settle. {a} and {b} are the best, the bottom queens are the worst, and the song connects those two facts with a power nobody asked for and somebody is about to win.',
        '"The winner of this lip sync will decide who sashays away tonight." {a} and {b} take their marks knowing that this song is not about survival and it is not exactly about winning — it is about earning the authority to end somebody else\'s run, and that authority starts the moment the music does.',
      ]),
    ],
  },

  // ══ HER LAST WORDS, ON THE LIP SYNC SCREEN ═══════════════════════════
  //
  // Not the same beat as `farewell` below, and the difference is the whole
  // reason this exists. `farewell` is the NARRATOR describing a goodbye in
  // the werk room, minutes later, in third person. This is HER, on the
  // stage, in the second after the host says her name — first person, in
  // quotation marks, out loud, to the room.
  //
  // It is the last card on the lip sync screen and the only one that is her
  // own voice, so it is the closing note of the whole night.
  //
  // SHAPE: gratitude, then the one-liner. "Thank you for the opportunity"
  // is the thing every queen says and the thing the audience expects, and
  // what makes it hers is whatever she puts after it. Keep it SHORT — two
  // or three sentences. This is a parting shot, not the goodbye speech;
  // the speech is `farewell` and it happens on the next screen.
  //
  // Tiered by SWAGGER GROUP, the same five attitudes js/dr/data/runway-
  // voices.js already sorts queens into, so a queen's exit line sounds like
  // the queen who has been narrating her own runway walks all season.
  {
    id: 'sashay-words', step: 'lipsync', scope: 'per-queen', speaker: 'queen',
    variants: 6,
    note: 'Her own last words on the stage. {a} is her. First person, in quotes.',
    writerNote: 'GRATITUDE THEN THE ONE-LINER, and the one-liner is the '
      + 'character. Two or three sentences, spoken aloud, in quotation marks. '
      + 'Every queen thanks the show — that part is ritual and should stay '
      + 'recognisable — and then she says the thing only she would say. The '
      + 'tiers are the five swagger groups from runway-voices.js, so match '
      + 'the voice that has been narrating her walks: predator leaves with a '
      + 'threat wrapped in a compliment, sunshine means every word of it, '
      + 'firecracker goes out loud and unserious, professional treats it as '
      + 'a result and shakes hands, scrapper points out she was never '
      + 'supposed to get this far. NOT a speech — she gets a real one on the '
      + 'next screen. This is the parting shot.',
    tierBy: 'swagger',
    tiers: [
      tier('predator', 'She leaves a threat behind, beautifully wrapped.', [
        "\"Thank you for the stage. Every queen here made me sharper, and I hope they remember that when they see what I do next.\" {a} holds eye contact with the room one beat too long before turning.",
        "\"I had a beautiful time and I wish every single one of you the best. And I mean that — because you are going to need it.\" {a} smiles, and the smile is a gift with a warning inside it.",
        "\"This was everything I wanted. I am grateful. I am proud. And whoever takes the crown should know I am watching.\" {a} turns and the turn has the energy of someone who is already planning her next entrance.",
        "\"Thank you for having me. I left something on every stage I touched and I am not taking any of it back.\" {a} says it softly, and the softness is more dangerous than volume.",
        "\"I want to thank this show, these queens, and this stage. I will see all of you again, under different lights, and I will be ready.\" {a} bows and the bow has teeth in it.",
        "\"Every night here made me better and I am taking all of it with me. So thank you — genuinely — for sharpening the blade.\" {a} exits and the exit is a promise wrapped in gratitude.",
      ]),
      tier('sunshine', 'She means it, all of it, with no edge at all.', [
        "\"I love every person in this room. I loved being here. I loved every single second.\" {a}'s voice cracks on the last word but the smile holds and the smile is real.",
        "\"This was the greatest thing I have ever done in my life and I would do it again tomorrow, even knowing tonight.\" {a} presses both hands to her chest and means every syllable.",
        "\"Thank you for letting me be here. Thank you for seeing me. I came in with a dream and I am leaving with a family.\" {a} is crying and laughing at the same time and both are genuine.",
        "\"I do not have a clever thing to say. I just loved it. All of it. Every challenge, every runway, every one of you.\" {a} opens her arms to the room and the gesture is big and earnest and unembarrassed.",
        "\"Wherever I go after this, I go knowing I was here, and that is enough. That is more than enough.\" {a} wipes her eyes, still smiling, and the smiling is not a performance.",
        "\"I came in wanting to make people happy and I think I did that, and if I did nothing else it was everything.\" {a} blows a kiss to the room and the kiss lands on all of them.",
      ]),
      tier('firecracker', 'Loud, funny, refusing to be sad on camera.', [
        "\"Well that happened! Thank you, I had a blast, tell my wigs I will be home soon.\" {a} cackles on her way off the stage and the cackling is so loud it startles the queen next to her.",
        "\"Thank you for the memories, the drama, and the free makeup. I am going home to sleep for a hundred years.\" {a} throws her arms up and the throwing is a celebration, not a surrender.",
        "\"Listen — I gave you everything I had and if it was not enough then I need to go get more, so excuse me!\" {a} spins, poses, and exits with more energy than she had for the lip sync.",
        "\"I was fun, I was fierce, and I was here, and if you forget me that is on you.\" {a} points at the room, winks, and leaves like she has somewhere better to be.",
        "\"No tears from me, baby. I walked in loud and I am walking out louder.\" {a} snaps, turns, and the snap echoes in the room longer than it should.",
        "\"It has been real, it has been beautiful, and it has been the most exhausting thing I have ever survived. Goodnight!\" {a} does a full curtain-call bow and then exits laughing.",
      ]),
      tier('professional', 'A result. She takes it like one and shakes hands.', [
        "\"Thank you. I came here to do a job and I did it and tonight the job ended.\" {a} nods once, with the composure of someone who has processed the result before the room has.",
        "\"I gave everything I had to give and the outcome is the outcome. Thank you for the opportunity.\" {a} shakes the host's hand and the handshake is firm and steady.",
        "\"This is how it goes. Somebody leaves every week and tonight it is me and I can hold that.\" {a} straightens her back and walks and the walking has the rhythm of a queen who has practiced leaving well.",
        "\"Thank you for this experience. I respect the process, I respect the decision, and I am proud of the work I did here.\" {a} delivers it cleanly and exits with the dignity of someone who prepared for this possibility.",
        "\"No regrets. I would not change a single thing about how I ran this. Thank you.\" {a} nods to the host, nods to the queens, and exits on her own terms.",
        "\"It was an honour. I take my placement, I take the experience, and I leave with my head up.\" {a} turns and the turn is measured and intentional and she does not rush it.",
      ]),
      tier('scrapper', 'She was never supposed to be here this long and says so.', [
        "\"Nobody thought I would last this long. I was not supposed to be here past week two and I made it to here, and that is mine.\" {a}'s voice is rough but the words are steady.",
        "\"I came in with nothing and I built something, and if tonight is the end then the end is further than anybody expected, including me.\" {a} laughs at herself and the laugh is earned.",
        "\"Every single week I thought this was it, and every single week I survived, and tonight I did not, and that is still more weeks than anyone gave me.\" {a} shrugs and the shrug carries the whole run.",
        "\"I was not the most talented queen in this building but I was the hardest to get rid of, and I am proud of that.\" {a} grins and the grin has a chip in it.",
        "\"They counted me out on day one. I stayed until now. That maths is mine and nobody can take it.\" {a} taps her chest once and exits with the walk of someone who outperformed every prediction.",
        "\"I did not have the budget, I did not have the training, and I still gave every one of you a fight. You are welcome.\" {a} points at the room, laughs, and goes.",
      ]),
    ],
  },

  // ══ THE EXIT ═════════════════════════════════════════════════════════
  {
    id: 'farewell', step: 'exit', scope: 'per-queen', speaker: 'narrator',
    variants: 10,
    note: 'What she says to the room on her way out.',
    tierBy: 'always',
    tiers: [tier('goodbye', 'The last thing she says to the queens still standing.', [
      "{a} hugs every queen in the room one at a time and does not rush any of them. Some of the hugs are long and some of them are longer and by the time she reaches the door she has said everything she needs to say without saying most of it out loud. The last thing she says to the room is \"do not forget me\" and she means it and nobody will.",
      "\"I had the time of my life,\" {a} says, and the sentence is a cliche and she knows it is a cliche and she says it anyway because sometimes the truest thing you can say is the thing everybody says. She waves. She turns. She walks toward the door with the posture of somebody who is already thinking about what comes next.",
      "{a} says goodbye with the kind of composure that costs everything. She tells the room she loves them and she tells them to fight and she tells one queen in particular something quiet that makes that queen cry, and then she walks to the door and does not look back because looking back is the thing that will break her.",
      "The goodbye is short because {a} does not trust herself with a long one. \"Thank you,\" she says to the room. \"All of you. Thank you.\" Then she turns and walks and the door closes behind her and the queens who are left stand in the silence she leaves behind.",
      "{a} goes around the room and tells each queen something specific — not a generic goodbye but a real sentence, aimed at a real person, about a real thing that happened between them. By the time she reaches the last one she is crying and the last one is crying and the room lets them have it.",
      "\"I\'m proud of what I did here,\" {a} says, and the sentence lands in the room like a decision rather than a feeling. She hugs the queens she is closest to and nods at the ones she is not, and the distribution of hugs and nods tells the room everything about how the season went.",
      "{a} stops at the door and turns around and looks at the room one more time and the look is the kind of look that holds everything — the fights, the friendships, the nights she thought she was going home and the night she actually is. Then she blows a kiss and the kiss is for the room and the room catches it.",
      "She does not cry. {a} says goodbye with dry eyes and a steady voice and the steadiness is not cold — it is the composure of a queen who decided backstage that the last thing these queens would remember about her would be how she left, and she is leaving like somebody who was supposed to be here.",
      "{a} holds both hands up and says \"I love every single one of you\" and means it so completely that the room goes quiet, because a room full of queens can tell the difference between a speech and a truth, and this is the second one. Then she walks, and the walking is the part that costs her.",
      "{a} says something to the room that nobody outside of it will ever hear, because the goodbye is not for the cameras — it is for the queens who are still standing in the workroom at midnight watching somebody leave. Whatever she says, one of them laughs and two of them cry, and that ratio is the whole relationship.",
    ])],
  },
  {
    id: 'mirror-message', step: 'exit', scope: 'per-queen', speaker: 'narrator',
    variants: 10,
    note: 'The lipstick message she leaves on the werk room mirror. A fixed ritual — it always happens.',
    tierBy: 'always',
    tiers: [tier('message', 'Written in lipstick, for whoever comes back in tomorrow.', [
      "{a} picks up the lipstick and writes on the mirror and the message is short and the shortness is the point. A name. A heart. A word that means \"I was here and now I am not and whoever reads this tomorrow should know that I left it for them.\" She caps the lipstick, looks at what she wrote, and walks out.",
      "The lipstick message takes {a} less than a minute. She writes it quickly, in the handwriting of somebody who has already decided what she wants to say, and when she steps back the mirror holds the words the way a mirror holds everything — reversed, temporary, and meant for somebody else.",
      "{a} stands in front of the werk room mirror with a lipstick in her hand and writes the thing she has been thinking about since the verdict. It is not a speech. It is a sentence, maybe two, and the queens who walk in tomorrow morning will read it and know that {a} was here and that {a} wanted them to keep going.",
      "The message is written in red and it says what it needs to say and nothing more. {a} puts the cap back on, puts the lipstick down, and looks at the mirror one more time — her own reflection framed by the words she left behind — and then she turns and the werk room is empty.",
      "{a} writes the message in letters large enough to see from the door, because the queens who walk in tomorrow will see it from the door and she wants it to be the first thing they read. She draws a heart under the words, caps the lipstick, and leaves the room the way she found it — with one more message on the mirror.",
      "The lipstick message takes three tries because {a} keeps changing what she wants to say. The first attempt gets wiped. The second gets wiped. The third stays, and the third is shorter than the first two, which is always how it works: the thing she actually needs to say is simpler than the speech she was planning.",
      "{a} writes on the mirror and then stands back and reads it through the reflection, which means reading it backwards, which means reading it the way the queens will read it tomorrow when they walk in and see it and know that {a} was the last person standing in this room tonight.",
      "She does not write much. Two words and a name, maybe three words, and a drawing that might be a crown or might be a star or might be the thing {a} draws when she does not know what else to draw. The message is not for posterity. It is for the queen who opens that door tomorrow and needs to see that somebody was here.",
      "The lipstick is red and the mirror is clean and {a} writes the sentence she decided on during the lip sync, because she had three minutes of a song to think about what she would put on that glass if the song did not go her way, and the song did not go her way, and the sentence was ready.",
      "{a} picks up the lipstick and hesitates. She looks at the mirror — at her own face, at the messages from queens who stood here before her — and then she writes something that is less a goodbye and more a promise, and the promise is for the queens who are still in this and not for herself.",
    ])],
  },
  /* THE PORKCHOP. Fires on the FIRST elimination of a season and never
     again, because that is what the joke is: Victoria "Porkchop" Parker was
     the first queen ever sent home on this show, and "you are getting the
     porkchop" has meant "you went out first" ever since. Quoted from the
     host\'s own line — "I\'m sorry my dear, but you are getting the Porkchop."
     A show whose vocabulary is this specific is not finished until its oldest
     running joke is in it. */
  {
    id: 'porkchop', step: 'exit', scope: 'per-queen', speaker: 'host',
    note: 'ONLY the first queen eliminated in a season. The oldest joke the show has.',
    tierBy: 'always',
    tiers: [tier('porkchop', 'First out. She gets the porkchop.', [
      "\"I\'m sorry, my dear,\" the host says, \"but you are getting the porkchop.\" {a} laughs despite everything, because every queen who has ever watched this show knows exactly what that means and exactly who it is named after. Somebody has to go first. This season it is her, and the joke is older than most of the room.",
      "There is a title that comes with going out first and it is not a good one. The host delivers it with real affection: \"You are getting the porkchop.\" {a} takes it on the chin. \"Somebody\'s got to hold it,\" she says, and the room loves her for the answer more than it would have loved a better week.",
      "{a} is the first queen out of this season, which means she inherits the porkchop — the oldest running joke this competition has, handed down from the first queen ever sent home. She knows it. She said the word herself before the host could. \"Porkchop,\" she says. \"Fine. I\'ll take it.\"",
      "\"You are getting the porkchop, my dear.\" It lands as a kindness rather than a cut, because the host says it to exactly one queen a season and every one of them ends up wearing it as a badge. {a} presses her hand to her chest, says \"an honour,\" and means about half of it.",
      "Somebody has to go first and this season it is {a}. The host delivers the porkchop with the gentleness of somebody who has been handing it out long enough to know that the queens who get it rarely stay gone. {a} curtsies, which is exactly the right response to being told you are going home in episode one.",
      "\"The porkchop goes to you, my dear.\" {a} laughs once, short and sharp, because the porkchop is the only tradition in the show that belongs to the queen who gets it the worst, and laughing at it is the only way to carry it well. She takes it. She owns it. She walks out carrying the title nobody wants and everybody remembers.",
      "The host names {a} as this season's porkchop and {a} receives the title with a grin that is two-thirds genuine and one-third shield. First out is first out, but first out with the porkchop is a legacy that goes back to the beginning of the show, and {a} is now part of that lineage whether she wanted to be or not.",
      "{a} gets the porkchop. She stands there for a second, processing it, and then she says \"well, somebody had to\" with the delivery of a queen who has already decided that this is a funny story she will tell for the rest of her career rather than a thing that happened to her.",
      "\"You, my dear, are getting the porkchop.\" The host delivers it the way the host always delivers it — with real warmth and no apology — and {a} puts both hands on her hips and looks at the ceiling and then back at the host and says \"I am going to make that porkchop famous,\" and the room believes her.",
      "The porkchop lands on {a} and {a} wears it immediately. She does not fight the title and she does not mourn it — she picks it up, puts it on like a sash, and walks out of the room like the first queen eliminated from this season is a crown she was born to wear, which is the only way to carry this particular honour.",
    ])],
  },
  {
    id: 'closing', step: 'exit', scope: 'once', speaker: 'host',
    variants: 10,
    note: 'The host closes the night on the queens who are left.',
    tierBy: 'always',
    tiers: [tier('close', 'If you cannot love yourself, how in the hell are you going to love somebody else?', [
      "The stage is one queen shorter and everybody standing on it can feel the gap. The host does not hurry through it. She waits until the room is with her, asks it the question she asks every week, and gets the answer she always gets — louder tonight, because the queens who are left have something to be loud about. Then the lights come up and it is next week.",
      "\"Now, let the music play.\" The host closes the night with the words that mean the stage is done and the werk room is next, and the queens who survived walk off into whatever comes tomorrow. Somebody just left and the room is lighter by one voice and heavier by everything that voice said.",
      "The host delivers the closing and the queens respond and the ritual is the same as it has been every week. That is the comfort of it — the same words, the same amen, the same walk off the stage — and the comfort is real even when the night was hard, because the words mean you are still here to hear them.",
      "The closing words land the way they always do — familiar, earned, and aimed at a room full of people who needed to hear them tonight more than most nights. The queens say amen and the host smiles and the music plays and the stage empties one last time until next week, when all of this starts again with one fewer voice in the room.",
      "\"If you can\'t love yourself, how in the hell are you gonna love somebody else? Can I get an amen up in here?\" The amen comes back louder than it has any right to be on a night where somebody just walked out the door. The host nods. \"Now, let the music play.\" The queens walk off the stage and the walking is the last thing they do as this week\'s cast. Next week they are a smaller room.",
      "\"Remember: we\'re all born naked and the rest is drag.\" The host lets that land, and then: \"If you can\'t love yourself, how in the hell are you gonna love somebody else?\" The room gives back the amen without being asked, because the amen has been part of this ritual long enough that it does not need a question mark any more. The music plays. The queens walk.",
      "\"Can I get an amen?\" The host says it and the room says amen and the exchange is the same one it has been every week and the sameness is the entire comfort. \"Now let the music play.\" The stage empties. The queens who survived tonight walk to the back with the posture of people who have one more week, and one more week is the only currency this competition trades in.",
      "The host looks at the queens who are left and the looking is the part that means something, because the words that follow are the same words every week and the queens know them by heart. \"If you can\'t love yourself, how in the hell are you gonna love somebody else?\" The amen arrives. The music plays. The room is smaller by one voice and louder by one absence.",
      "\"Now, let the music play!\" The host ends the night with the line that means it is over and the queens walk off the stage into whatever is waiting for them in the werkroom — a lipstick message on the mirror, a station that is empty, and a morning that starts with one fewer person in the room.",
      "The closing is the same closing it has always been, and the sameness is the point. The host says the words. The queens say the amen. The music starts. They walk. Tonight happened and it is over and tomorrow is another day in a competition that just got one queen smaller, and the closing is the breath between those two things.",
    ])],
  },
];

export const STAGE_IDS = STAGE_BEATS.map(b => b.id);

/**
 * HOW MANY VARIANTS A BEAT ACTUALLY NEEDS, which is four almost everywhere
 * and is not four for a ritual.
 *
 * `usedLines` prevents a repeat WITHIN one render pass, and a beat that fires
 * once a night has nothing to collide with inside that pass — so the draw is
 * free every episode and a four-variant pool is seen three times over a
 * twelve-episode season. That is fine for a beat nobody is watching closely
 * and wrong for the mirror message, the goodbye and the two words the host
 * says at the end of a lip sync, which are the most watched lines in the
 * show and the ones a viewer can already recite.
 *
 * So a beat may declare `variants`. Nothing else changes: the hard floor
 * stays at four everywhere, because a tier below four repeats inside a single
 * episode, which is a bug rather than a thinness.
 */
export const stageVariantTarget = b => b.variants || 4;

/** Every (beat, tier) pair still waiting on prose. */
export function unwrittenStageTiers() {
  const out = [];
  for (const b of STAGE_BEATS) {
    for (const t of b.tiers) {
      if (!t.lines || t.lines.length < 4) out.push(`${b.id}/${t.id}`);
    }
  }
  return out;
}

/** Written, but thinner than the ritual it carries. Reported, never failed. */
export function thinStageTiers() {
  const out = [];
  for (const b of STAGE_BEATS) {
    const want = stageVariantTarget(b);
    if (want <= 4) continue;
    for (const t of b.tiers) {
      const n = (t.lines || []).length;
      if (n >= 4 && n < want) out.push(`${b.id}/${t.id} (${n}/${want})`);
    }
  }
  return out;
}

/** How many beats a stage of this shape produces, for the count guard. */
export function stageBeatCount({
  walking = 0, onStage = 0, bottom = 0, exits = 0,
  high = 0, low = 0, atRisk = 0, judges = 0, win = 1,
} = {}) {
  let n = 0;
  for (const b of STAGE_BEATS) {
    // The panel introductions: one per seat, minus the host, who is doing
    // the introducing. Callers pass the number who actually get introduced.
    if (b.scope === 'per-judge') { n += judges; continue; }
    if (b.scope === 'once') { n += 1; continue; }
    if (b.step === 'runway') n += walking;
    else if (b.step === 'critiques') n += onStage;
    else if (b.step === 'lipsync') n += bottom;
    else if (b.step === 'exit') n += exits;
    else if (b.step === 'results') {
      /* Each result call is its own count. This read "win ? 1 : bottom",
         from when the only per-queen results were the winner and the
         bottom two — with high, low and btm added it under-reported every
         night by however many queens the panel placed in between. */
      if (b.id === 'result-win') n += win || 1;
      else if (b.id === 'result-high') n += high;
      else if (b.id === 'result-low') n += low;
      else if (b.id === 'result-btm') n += atRisk;
      else n += bottom;
    }
  }
  return n;
}
