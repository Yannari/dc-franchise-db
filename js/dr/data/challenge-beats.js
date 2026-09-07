// ══════════════════════════════════════════════════════════════════════
// dr/data/challenge-beats.js — the announcement, the mini, the performance
// ══════════════════════════════════════════════════════════════════════
//
// The last four phases of the week that were still bare marker scenes: the
// host arriving to announce the challenge, the mini, the moment the room finds
// out how it is being divided, and the maxi performance itself.
//
// ── WHY THIS IS A SEPARATE FILE FROM stage-beats.js ───────────────────
//
// It is the same shape — always-fires beats with a tier chosen by the outcome,
// no eligibility and nothing drawn — and structurally the maxi performance
// belongs beside the runway walk. It is separate for a boring practical
// reason: stage-beats.js was out being written when this was added, and
// editing a file underneath somebody writing prose into it is how you lose an
// afternoon of their work to a merge. Two files, no collision.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
//   {a}  the queen this beat is about
//   {c}  the challenge's name — only where `speaker` is 'host'
//
// Same rules as everywhere: no real people, this show's vocabulary only, never
// quote a stat by number, four genuinely different variants per tier, prose
// rather than captions.
//
// THE REGISTER. The host announcing a challenge is performing — big, arch,
// pleased with herself, and the queens are reacting in real time. The mini is
// fast and silly. The maxi performance is the one place the writing should
// take the queens' craft seriously: this is the thing they came to do.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const CHALLENGE_BEATS = [
  // ══ THE HOST ARRIVES ═════════════════════════════════════════════════
  {
    id: 'host-arrives', step: 'maxi-announce', scope: 'once', speaker: 'host',
    note: 'The host walks into the werk room out of drag and the room stops what it is doing.',
    tierBy: 'always',
    tiers: [
      tier('arrival', 'She has news and is going to take her time with it.', [
        "The door goes and it is her, out of drag, in a suit that costs more than anybody's entire wardrobe, and thirteen queens stop mid-sentence like somebody hit a switch. She lets the silence run a second longer than it needs to. She always does. Then: \"Ladies.\"",
        "Nobody hears her come in. They just gradually notice, one at a time, that she is standing by the door watching them work with an expression of enormous private amusement. By the time the last queen clocks it, the room has gone from a workshop to an audience.",
        "\"Hello, hello, hello.\" Thirteen voices come back at once, ragged and delighted, and somebody at the back is already clapping for no reason at all. She waits for it to die down, which takes a while, because they know she is about to change the shape of their week.",
        "She comes in the way she always comes in — like the room was already hers and she has just been elsewhere for a while. Every queen straightens up without deciding to. Whatever anybody was arguing about ninety seconds ago is over.",
      ]),
    ],
  },
  {
    id: 'the-brief', step: 'maxi-announce', scope: 'once', speaker: 'host',
    note: 'She explains what the maxi challenge actually is, and names the runway category.',
    tierBy: 'always',
    tiers: [tier('brief', 'What they are doing this week, and what they are walking in.', [
      "\"This week,\" she says, and the pause after it is long enough to park a truck in, \"{c}.\" She explains the rules the way she always does — slowly, clearly, and with just enough delight to make it sound like she designed the challenge specifically to ruin somebody's week. The runway category lands at the end like an afterthought, except it is not an afterthought and everybody in the room knows it.",
      "She lays out {c} with the cadence of somebody reading a bedtime story to children she intends to terrify. The maxi is explained, the rules are explained, and then the runway category drops and three queens in the room are already thinking about what they packed and two of them are realising they did not pack enough.",
      "\"{c}.\" She says the name of the challenge and lets it sit there like a gift nobody has unwrapped yet. Then she explains what it involves, piece by piece, and the room's face changes with each piece — interest, then concern, then the particular wide-eyed focus of people doing maths they did not study for. The runway category arrives last, delivered like dessert.",
      "The brief is delivered with the showmanship of somebody who has done this before and enjoys it more every time. {c} — the concept, the structure, the stakes, and the runway theme — laid out in four sentences, each one landing on a different queen's weak spot. By the time she is done the room has already split into the people who are excited and the people who are pretending to be.",
    ])],
  },
  {
    id: 'announce-reaction', step: 'maxi-announce', scope: 'per-queen', speaker: 'narrator',
    note: 'How the brief lands on her specifically. Fires for a few queens, not all.',
    tierBy: 'aptitude',
    tiers: [
      tier('delighted', 'This is her challenge and she cannot hide it.', [
        "{a} hears the brief and her face does something she cannot control. The corners of her mouth go up before she can stop them and the queen next to her notices and says nothing, because saying something would be admitting that {a} just became the favourite and nobody admits that out loud.",
        "This is {a}'s challenge. She knows it before the host finishes explaining the rules. The brief lands on her like a coat she has been waiting to put on all season, and the only thing stopping her from grinning is the twelve other queens in the room who would notice.",
        "{a} is already building her approach before the host has finished talking. Her eyes go somewhere else — somewhere internal, somewhere she is casting and choreographing and picking fabric — and the queens around her can see her leaving the room without moving.",
        "The brief hits and {a} looks down at her station with the focus of somebody who already knows what she is going to do. Not a guess. Not a hope. A plan, arriving fully formed in the time it takes the host to explain the runway theme, and {a} is already three steps ahead of the explanation.",
      ]),
      tier('braced', 'She can do this. She is not thrilled about it.', [
        "{a} nods through the brief with the measured energy of somebody who is doing arithmetic in her head. She can do this. She has done things like this. She is not going to be the one who falls apart this week but she is also not going to be the one skipping to her station, and the difference between those two things is the distance between safe and high.",
        "The brief lands and {a} takes a breath and the breath says everything — she is not panicking, she is not delighted, she is in the middle ground where most queens live on most weeks, which is the ground where you survive by being better than two people and you go by being worse than one.",
        "{a} listens, processes, and files the challenge under \"manageable\" which is not the same as \"exciting\" and she knows it. She will do the work, she will do it competently, and whether competence is enough depends entirely on what twelve other queens bring, which is the part she cannot control.",
        "She can do this. {a} repeats it to herself without moving her lips and the repetition is either confidence or a pep talk and at this stage in the season the difference barely matters. The brief is clear, the runway is doable, and she will figure out the rest at her station.",
      ]),
      tier('dreading', 'This is the week she was hoping would not come.', [
        "{a} hears the brief and her face does not change, which is how you can tell it changed internally. This is the challenge she has been hoping would not arrive, and it has arrived, and the next four days belong to the thing she is worst at. She smiles. The smile is structural, not emotional.",
        "This is {a}'s nightmare week and the nightmare just started. She listens to the brief with the expression of somebody reading their own medical results — attentive, calm, and already calculating what this is going to cost her. The host finishes and {a} has not blinked once.",
        "The brief drops and {a}'s whole energy shifts. Not panic — something quieter than panic, something that sits in the chest and says \"you are going to have to fight through four days of doing the thing you cannot do, in front of cameras, and pretend it is fine.\" She picks up a pencil. She puts the pencil down.",
        "{a} knew this week was coming. She packed for it, she told herself she was ready for it, and now that it is here she can feel the distance between being ready and being good at something, which is the distance the bottom two lives in. She smiles at the queen next to her and the smile is a wall.",
      ]),
    ],
  },

  // ══ THE MINI ═════════════════════════════════════════════════════════
  {
    id: 'mini-announce', step: 'mini', scope: 'once', speaker: 'host',
    note: 'The mini is explained. Fast, silly, and worth something real.',
    tierBy: 'always',
    tiers: [tier('announce', 'A quick one, and what winning it buys.', [
      "\"But first — a mini challenge.\" The room groans the way a room groans when it is delighted and pretending not to be. She explains it in thirty seconds because a mini is supposed to be fast and loud and over before anybody has time to think, and the prize at the end is real enough that every queen in the room starts paying attention.",
      "The mini drops like a fire drill. She explains the rules, she explains the prize — which is the part that makes queens lean forward — and before the room has fully processed what is happening the clock is about to start and thirteen queens are looking at each other trying to decide who is about to embarrass themselves first.",
      "\"Mini challenge.\" Two words and the room's energy changes because a mini is the one part of the week where being silly is the strategy and being serious is the mistake. She names the prize and it is good enough to matter and small enough to be fun and that balance is the whole point.",
      "She announces the mini with the energy of somebody setting off a party popper in an office. The rules are simple, the timeline is short, the prize is worth having, and the whole thing exists to remind everybody that this is supposed to be fun before the maxi reminds them that it is not.",
    ])],
  },
  {
    id: 'mini-attempt', step: 'mini', scope: 'per-queen', speaker: 'narrator',
    note: 'Her go at it. One beat per queen who attempts, tiered by how it went.',
    tierBy: 'mini',
    tiers: [
      tier('nailed', 'She is very good at this and everybody enjoys it.', [
        "{a} goes and the room loses it. Whatever the mini asked for, she delivered it with the timing of a person who has done this exact thing in a bar at two in the morning for an audience of six and has perfected it under those conditions. The host is laughing. The other queens are clapping. {a} takes a bow that is entirely earned.",
        "{a} steps up and immediately it is clear that this mini was designed for someone exactly like her. She nails it — not with effort, with ease, and the ease is the part that makes the other queens nervous because ease in a mini means confidence in a maxi and confidence in a maxi means trouble for everybody else.",
        "The mini hits and {a} hits harder. She is funny, she is fast, she commits fully, and the room rewards her with the kind of noise that tells you somebody just won before the judges have said a word. {a} grins at the camera because she knows.",
        "{a} goes for it and going for it was exactly the right call. The mini is fast and silly and {a} matches both of those things perfectly. The room erupts and the host watches with the expression of somebody who just found this week's confessional moment.",
      ]),
      tier('decent', 'A solid effort that gets a laugh.', [
        "{a} gives it a go and the go is good enough. Not the best in the room, not the worst, but she gets a laugh and a laugh in a mini is the difference between background and footage. She walks back to her spot with the energy of somebody who did not embarrass herself and is satisfied with that.",
        "A solid effort from {a}. She reads the mini correctly — commit, do not overthink, get out — and the result is a moment that lands well enough to make the cut. Not the winner, but not the queen they show struggling either, and in a mini that middle ground is perfectly fine.",
        "{a} throws herself at the mini with the energy of somebody who has decided that caring too much is worse than caring too little. The result is decent — a laugh, a clap, a nod from the host — and {a} walks back knowing she did what the mini asked without doing anything the season will remember.",
        "The mini gets a genuine effort from {a} and the effort translates into a genuine reaction from the room. She is funny enough, quick enough, and game enough that the host smiles and the queens who have already gone nod with the respect of people who know a solid run when they see one.",
      ]),
      tier('flat', 'It does not land and she knows before she has finished.', [
        "{a} goes and it does not land. She can feel it not landing while she is doing it, which is the worst version — the awareness arrives before the attempt is over and the remaining seconds feel like they last a week. She walks back to her spot and says \"well\" and the \"well\" contains everything.",
        "The mini asks for something {a} does not have in the building tonight. She tries. The trying is visible and the visibility is the problem, because a mini is supposed to look effortless and effort is the only thing on display. The room is kind about it, which is its own kind of verdict.",
        "{a} steps up and immediately the energy shifts from anticipation to encouragement, which is the shift that tells you somebody is struggling before they have finished. She gets through it. She does not get a laugh. She gets the particular silence of a room deciding not to make it worse.",
        "It falls flat and {a} knows it falls flat and the knowing is written on her face for the three seconds it takes her to compose herself and say \"that happened\" and the room laughs at that, which is a mercy laugh, but a mercy laugh is still a laugh and she takes it.",
      ]),
    ],
  },
  {
    id: 'mini-win', step: 'mini', scope: 'per-queen', speaker: 'host',
    note: 'The mini winner is named and told what she has won.',
    tierBy: 'always',
    tiers: [tier('win', 'She takes it, and the advantage that comes with it.', [
      "{a} wins the mini and the prize lands in her hands and the room applauds because the room is generous when the stakes are small. The advantage is real — it will matter when the maxi starts — and {a} accepts it with the grin of somebody who just bought herself a head start in a race everybody else is running flat.",
      "\"Condragulations, {a}, you have won the mini challenge.\" The prize is explained, the advantage is hers, and {a} holds it like a ticket to somewhere better. The other queens clap. Some of them mean it. All of them are thinking about what the advantage costs them.",
      "The mini winner is {a} and the win comes with something useful. She takes the prize, she thanks the host, and she walks back to her station with the posture of somebody who just got a three-second head start in a four-day race. It is not much. It is enough.",
      "{a} takes the mini and the advantage that comes with it. The host hands it over with ceremony because even a small win deserves ceremony on this stage, and {a} receives it with the focus of somebody who is already thinking about how to spend it on the maxi.",
    ])],
  },

  // ══ HOW THE ROOM IS DIVIDED ══════════════════════════════════════════
  {
    id: 'the-division', step: 'choice', scope: 'once', speaker: 'narrator',
    note: 'The room finds out how it is being split — teams, parts, characters, materials.',
    tierBy: 'assignment',
    tiers: [
      tier('draft', 'A pick order, and everybody can count.', [
        "The pick order is announced and the room immediately becomes a mathematics class. Everybody is counting — how many queens, how many slots, where they fall in the order, and what will be left when it reaches them. The queen picking first tries not to look too pleased. The queen picking last tries not to look at all.",
        "A draft. The room exhales because a draft means strategy and strategy means the queen who picks smart has an edge over the queen who picks late. The order is read out and thirteen faces do the same calculation at the same time: what do I want, when do I pick, and will it still be there.",
        "The pick order drops and the room rearranges itself socially in real time. Picking early is power and picking late is a problem and everybody in the room knows exactly which one they have. The first queen in the order squares her shoulders. The last queen in the order starts planning around whatever is left.",
        "\"You will be picking in order.\" The order is read and the room goes quiet in the way that means everybody is running scenarios. A draft turns a creative challenge into a strategic one for the first thirty seconds, and those thirty seconds are the difference between getting your vision and getting somebody else's scraps.",
      ]),
      tier('captains', 'Two queens are handed the room and start choosing.', [
        "Two captains. The host names them and the room splits into the people doing the choosing and the people being chosen, and the being-chosen half is standing there trying to look desirable and available like the first day of school in heels. The captains look at each other. The draft begins.",
        "The room is handed to two queens and both of them know that the team they build in the next sixty seconds is the team they live or die with. They start picking and the picks are fast because overthinking a captain's draft is how you end up with a team that is talented in one direction and empty in three others.",
        "Two captains, one room, and the quiet cruelty of watching people decide your value out loud. The picks go back and forth and every queen who is chosen walks to her team with relief and every queen still standing tries not to count how many are left.",
        "Captain picks. The two queens named start choosing and the room watches itself get divided in real time. It is a team challenge and the teams are being assembled right now and every queen in the room is either delighted or doing the maths on how to survive somebody else's vision.",
      ]),
      tier('solo', 'Everybody is on their own this week.', [
        "No teams. No partners. No captain, no draft, no safety net. Everybody is on their own this week and the room receives this information with the complicated energy of people who are relieved they cannot be dragged down and terrified they have nobody to hide behind.",
        "\"You are all on your own.\" The sentence changes the room. Some queens straighten up because solo means their talent is the only variable. Others go quiet because solo means there is nobody to share the blame with if the maxi goes wrong, and wrong on your own is worse than wrong with company.",
        "Solo week. The relief in the room is immediate and dishonest — everybody is glad they do not have to depend on somebody else, and everybody is aware that depending on somebody else was also a place to put the blame. This week the blame lives at home.",
        "Nobody is paired and nobody is grouped and the result is a room full of queens who are simultaneously free and exposed. Solo means the best version of yourself wins and the worst version of yourself goes, with no buffer, no partner, and no excuse.",
      ]),
    ],
  },
  {
    id: 'pick-reaction', step: 'choice', scope: 'per-queen', speaker: 'narrator',
    note: 'What she ends up with, and what her face does about it.',
    tierBy: 'pick',
    tiers: [
      tier('got-it', 'She got exactly what she wanted.', [
        "{a} gets her pick and the satisfaction on her face is immediate and poorly hidden. She wanted this one, she got this one, and the walk back to her station has the energy of somebody carrying a weapon she knows how to use. The other queens clock it. They always clock it.",
        "The pick lands in {a}'s lap and it is the one she was hoping for. She takes it without hesitation and without ceremony and gets to work immediately, which is the tell — queens who got what they wanted do not stand around discussing it. They build.",
        "{a} gets exactly what she asked for and the room watches her receive it with the quiet fury of people who wanted the same thing. She does not gloat. She does not need to. Her station is already being reorganised around the pick before the next queen has made her choice.",
        "First choice, best choice. {a} takes what she wanted and the wanting was so obvious that nobody in the room is surprised, which is its own kind of advantage — when everybody expects you to do well, the pressure is yours but so is the permission.",
      ]),
      tier('settled', 'Not her first choice. She is making it work.', [
        "{a} takes what is available and decides, visibly, to make it work. The decision is in the way she picks it up — not with excitement, with purpose — and the purpose says \"I did not get what I wanted but what I wanted is not the only way to win.\" It is not a lie. It is not entirely true either.",
        "Not her first choice. Not her second. {a} takes the pick and looks at it the way a chef looks at an ingredient that was not on the list but is in the kitchen. She can work with this. She will have to work with this. The difference between those two sentences is the difference between safe and low.",
        "{a} settles and the settling is graceful enough that the room might not notice, but {a} notices. She had a plan and the plan involved a different pick and now she is rebuilding in real time, at her station, with the materials she has instead of the materials she wanted.",
        "The pick is fine. {a} takes it and nods and the nod is a decision to stop wanting what she did not get and start working with what she did. It is not the weapon she would have chosen but it is a weapon and she knows how to hold one.",
      ]),
      tier('left-over', 'She got what nobody else took.', [
        "{a} gets what nobody else wanted, and the getting is its own small humiliation — not because the pick is bad, but because the room decided it was bad before she had a chance to prove otherwise. She takes it without complaint and the lack of complaint is louder than a complaint would have been.",
        "Whatever was left is what {a} has. She picks it up with the energy of somebody finding a coat at a lost-and-found — it will do the job, it will not be pretty, and the fact that nobody else wanted it means she has something to prove this week, which is either a disadvantage or a motivation depending on what kind of queen she is.",
        "{a} takes the leftover and the leftover becomes her challenge inside the challenge: make this work. Make this work when everybody in the room can see that it was last on the shelf. The queens who picked before her look away because looking at her right now would be admitting what they did.",
        "The last pick goes to {a} and she takes it with a smile that costs her something. She is already thinking about how to turn this into a story — not the story of the queen who got what was left, but the story of the queen who made what was left into something nobody expected.",
      ]),
      tier('picked-last', 'The room chose, and it chose her last.', [
        "{a} is the last queen standing and the standing is the verdict. The room chose, and it chose her last, and the walk to her team has the energy of somebody arriving at a party where the seating chart was decided without her. She smiles. The smile is armour and everybody in the room knows it.",
        "Picked last. {a} walks to where she is told to walk and sits where she is told to sit and the queens who are already seated look at her with the particular kindness of people who feel guilty and are compensating. {a} does not need their kindness. She needs a maxi that lets her prove the draft wrong.",
        "The room chose and {a} was the last name called and the silence between the second-to-last and the last is the silence where everybody in the room decides how to feel about it. {a} decides to feel nothing, or at least to display nothing, which on this stage amounts to the same thing.",
        "{a} is picked last and takes it with a dignity that costs more than anything she packed in her suitcase. She joins her team, she does not make a speech about it, and she starts working with the focus of somebody who has something to prove and a specific group of people to prove it to.",
      ]),
    ],
  },

  // ══ THE PERFORMANCE ITSELF ═══════════════════════════════════════════
  {
    id: 'performance', step: 'maxi-perform', scope: 'per-queen', speaker: 'narrator',
    note: 'Her actual maxi challenge performance. One beat per queen, tiered by how she did. THIS IS THE THING THEY CAME TO DO — write it like it matters.',
    tierBy: 'perf',
    tiers: [
      tier('extraordinary', 'The performance the season is remembered for.', [
        "{a} performs and the room forgets it is a challenge. Whatever she brought to the maxi — the preparation, the instinct, the hours at her station — comes together into something that transcends the format. She is not competing. She is doing the thing she was put on this earth to do, and the difference between those two states is the difference between a win and a moment the season is built around.",
        "This is what {a} came here to do and {a} does it at a level that makes the judging feel like a formality. The performance is precise and alive and full of the kind of choices that reveal themselves on second viewing — a detail in the construction, a beat in the timing, a decision that could have gone safe and went brave instead.",
        "{a} delivers something the panel was not expecting, which is the hardest thing to do on a show that has been running long enough to expect everything. The performance is original without being weird, polished without being cold, and the craft — the actual craft, the thing underneath the drag — is so clean that the judges are going to have to invent new compliments.",
        "The maxi belongs to {a} from the first beat. She builds a performance that works on every level the challenge asked for and two levels it did not, and the building is invisible — what the panel sees is not effort, it is the result of effort, which is the version that wins.",
      ]),
      tier('strong', 'She is good and she knows exactly how good.', [
        "{a} delivers a strong maxi — prepared, confident, and executed with the kind of precision that says she rehearsed this and the rehearsal paid. She knows where she stands in the room tonight and the knowing is in her posture. Not the best. Close enough to make the conversation interesting.",
        "A good performance from {a}. Not the one that stops the panel but the one that makes the panel argue about placement, which is its own kind of compliment. The craft is solid, the choices are deliberate, and she walks away from the maxi knowing she put something real on that stage.",
        "{a} brings a maxi performance that earns its place in the top half of the room. The work is clean, the concept is clear, and the execution has the energy of somebody who prepared for this specific challenge and used the preparation well. She will not be going anywhere tonight.",
        "The performance is good and {a} knows it is good. She finishes with the particular calm of somebody who does not need to ask how it went because the work answered the question. Strong, skilled, and exactly aware of where the line is between a compliment from the judges and a win.",
      ]),
      tier('competent', 'She does the job. Nothing catches fire.', [
        "{a} does the challenge. She does it correctly, she does it on time, and she does it without anything memorable happening in either direction. The maxi is complete and competent and will sit in the safe pile because the safe pile is where competence lives when excellence showed up to the same party.",
        "A workmanlike maxi from {a}. The brief was answered, the details were handled, and the performance exists in the zone where the judges will struggle to say anything specific because there is nothing specific to say — it works, it is fine, and fine is its own verdict on a night like this.",
        "{a} delivers what the challenge asked for and nothing it did not. The performance is complete and professional and lands in the middle of the room, which is where most queens land most weeks and which is both safe and invisible and she will have to decide which of those matters more.",
        "The maxi is done and {a}'s contribution is exactly what competent looks like — present, adequate, and indistinguishable from two other queens who also did the job without setting anything on fire. She walks away from it knowing she survived, which is not the same as knowing she shone.",
      ]),
      tier('struggling', 'It is not working and she is still in the middle of it.', [
        "{a} is in the middle of the maxi and the maxi is not working and she can feel it not working in real time. The concept was fine in her head and the execution is betraying the concept on camera and the gap between what she planned and what is happening is getting wider with every beat.",
        "Something went wrong and {a} is still performing through the wrongness because stopping is not an option. The craft is there — she can sew, she can act, she can move — but tonight the craft is not converting into the thing the challenge asked for, and the judges can see the gap between effort and result.",
        "{a} is struggling and the struggling is visible. She catches herself, recovers, pushes through, and the pushing through is valiant but the damage is in the foundation and no amount of performance energy is going to fix a structure that is not holding. She finishes because she has to and the finishing is its own kind of brave.",
        "The maxi is getting away from {a}. She knows it. She is working harder than anybody else on the stage and the work is not landing and the not-landing is the nightmare version of a challenge — not a disaster, which at least has the drama of a story, but a slow failure that the judges watch with sympathy and write about with disappointment.",
      ]),
      tier('collapse', 'It comes apart, on camera, with nowhere to go.', [
        "It comes apart. {a} is on stage and the maxi is falling away from her in real time — the seam, the timing, the concept — and there is nowhere to go because the cameras are rolling and the judges are watching and the collapse is the performance now. She stands in the wreckage of what she built and the standing is the only thing she has left.",
        "{a}'s maxi falls apart on camera in the way that becomes a clip people watch out of context. The construction fails, or the concept fails, or both fail at the same time, and {a} is left on stage holding something that is no longer what she meant it to be. She does not stop. The not-stopping is heartbreaking.",
        "The collapse is total and {a} is in the middle of it. Whatever she planned, whatever she built, whatever she rehearsed at her station until three in the morning — none of it survives contact with the stage. She finishes because there is no mechanism for not finishing, and the walk off stage has the weight of somebody carrying everything that just went wrong.",
        "It falls apart. Not slowly, not gracefully, not in a way that can be saved with improv or charm. {a}'s maxi comes undone on the stage and the undoing is so complete that the judges stop writing and just watch, because the only thing left to judge is how she handles something nobody can handle well.",
      ]),
    ],
  },
  {
    id: 'performance-moment', step: 'maxi-perform', scope: 'per-queen', speaker: 'narrator',
    note: 'A single standout moment inside the performance. Fires only for a queen who had one.',
    tierBy: 'always',
    tiers: [tier('moment', 'The bit everybody will quote afterwards.', [
      "There is a moment — one moment — where {a} does something the room was not expecting and the not-expecting turns into the kind of reaction that tells you this is the clip. A choice, a gesture, a line delivery, a reveal, and the panel sees it and the queens see it and for two seconds the challenge belongs entirely to {a}.",
      "{a} hits a beat in the maxi that lands differently from everything around it. The room shifts. One of the judges turns to the other. Whatever {a} just did — the choice, the commitment, the timing — it was the moment the performance stopped being good and started being something people talk about after the credits roll.",
      "The moment arrives and {a} does not waste it. It is a single beat in a long maxi and she finds the beat and lives inside it with the precision of somebody who knows exactly what makes a performance become a memory. The rest of the challenge is context. This is the thing.",
      "Something happens during {a}'s maxi that is better than the rest of the maxi and everybody in the room can feel the difference. It is a moment — specific, brief, unrepeatable — and {a} finds it the way performers find things: not by planning, by being present enough that the moment recognises her.",
    ])],
  },
];

export const CHALLENGE_IDS = CHALLENGE_BEATS.map(b => b.id);

export function unwrittenChallengeTiers() {
  const out = [];
  for (const b of CHALLENGE_BEATS) {
    for (const t of b.tiers) if (!t.lines || t.lines.length < 4) out.push(`${b.id}/${t.id}`);
  }
  return out;
}

/** How many beats this file adds to a night of the given shape. */
export function challengeBeatCount({ living = 0, reacting = 3, moments = 1, hasMini = true }) {
  let n = 2; // host-arrives, the-brief
  n += reacting;
  if (hasMini) n += 1 + living + 1;
  n += 1 + living; // the division, and a pick reaction each
  n += living + moments;
  return n;
}
