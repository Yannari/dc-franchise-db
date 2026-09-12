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
        "The door goes and it is her. Out of drag, in a suit that costs more than anybody's entire wardrobe. The whole room stops mid-sentence. She lets the silence run a second longer than it needs to. She always does. Then: \"Ladies.\"",
        "Nobody hears her come in. They just gradually notice, one at a time, that she is standing by the door watching them work. By the time the last queen clocks it the room has gone from a workshop to an audience. \"Did you miss me?\"",
        "\"Hello, hello, hello.\" Every voice in the room comes back at once, ragged and delighted. Somebody at the back is already clapping for no reason. She waits for it to die down. They know she is about to change the shape of their week.",
        "She comes in the way she always comes in — like the room was already hers and she has just been elsewhere for a while. Every queen straightens up without deciding to. \"I have news.\" Whatever anybody was arguing about ninety seconds ago is over.",
        "The heel clicks give her away before the door does. Every queen at her station lifts her head at the same time, and the host walks in already talking. \"Good morning, ladies.\" The good morning is a preamble and everybody in the room can hear what comes after it even though she has not said it yet.",
        "She walks in carrying nothing and wearing everything and the room goes from a workshop to a stage in about three seconds. Queens put down their glue guns. The queen at the mirror turns around. \"I hope you are all sitting comfortably,\" the host says, and nobody sits because nobody ever sits when she says that.",
        "The host pushes the door open with one hand and the room feels it before it sees it. Conversations stop mid-word. A queen at the end of the room mouths \"oh here we go\" to nobody. The host crosses to the centre of the room and stands there until every eye is on her, which takes two seconds because every eye was already on the door.",
        "\"Ladies.\" She says it from the doorway and the word fills the room before she does. Two queens were mid-argument. They are not mid-argument any more. The host crosses the room in heels that hit the floor like punctuation and takes her spot in the centre, and the spot was waiting for her because the spot is always waiting for her.",
        "She comes in without announcement, which IS the announcement. The room reads the face — casual, warm, alert — and starts doing the calculation everybody does when the host arrives unscheduled: good news or bad news. The host lets them calculate. She is in no hurry.",
        "The host walks in and the energy in the room shifts immediately. Somebody was singing at her station. Somebody else was asleep. Both of them are awake and standing now. \"I have an announcement,\" she says, and the word announcement does more work than any sentence that follows it.",
        "\"Morning, girls.\" The host crosses the room with the walk of somebody who knows what she is about to say and is enjoying the part where they do not. Queens scatter from the couches. Somebody hides a snack. The host notices, files it, and does not comment. \"So.\" A pause. \"Let me tell you about this week.\"",
      ]),
    ],
  },
  {
    id: 'the-brief', step: 'maxi-announce', scope: 'once', speaker: 'host',
    note: 'She explains what the maxi challenge actually is, and names the runway category.',
    tierBy: 'always',
    tiers: [tier('brief', 'What they are doing this week, and what they are walking in.', [
      "\"This week...\" The pause is long enough to park a truck in. \"{c}.\" She explains the rules slowly, clearly, with just enough delight to make it sound like she designed it specifically to ruin somebody's week. The runway category lands at the end. Not an afterthought. Everybody knows it.",
      "She lays out {c} with the cadence of somebody reading a bedtime story to children she intends to terrify. Rules are explained. Then the runway category drops. Somewhere in the room three queens are thinking about what they packed. Two of them are realising they did not pack enough.",
      "\"{c}.\" She says the name and lets it sit there. Then she explains what it involves piece by piece. The room's face changes with each piece — interest, then concern, then the wide-eyed focus of people doing maths they did not study for. The runway category arrives last.",
      "The brief is delivered with the showmanship of somebody who has done this before and enjoys it more every time. {c} — concept, structure, stakes, runway theme — laid out in four sentences. Each one lands on a different queen's weak spot. By the time she is done the room has split into the excited and the pretending.",
    ])],
  },
  {
    id: 'announce-reaction', step: 'maxi-announce', scope: 'per-queen', speaker: 'narrator',
    note: 'How the brief lands on her specifically. Fires for a few queens, not all.',
    tierBy: 'aptitude',
    tiers: [
      tier('delighted', 'This is her challenge and she cannot hide it.', [
        "{a} hears the brief and her face does something she cannot control. Corners of her mouth go up before she can stop them. The queen next to her notices and says nothing. Saying something would be admitting {a} just became the favourite.",
        "This is {a}'s challenge. She knows it before the host finishes explaining the rules. \"Oh, this is MY week,\" she whispers to nobody. The only thing stopping her from grinning is every other queen in the room.",
        "{a} is already building her approach before the host has finished talking. Her eyes go somewhere else — somewhere internal, somewhere she is casting and choreographing and picking fabric. The queens around her can see her leaving the room without moving.",
        "The brief hits and {a} looks down at her station. Not a guess. Not a hope. A plan, arriving fully formed. She is already three steps ahead of the explanation. \"I have been waiting for this one,\" she says under her breath.",
      ]),
      tier('braced', 'She can do this. She is not thrilled about it.', [
        "{a} nods through the brief. She can do this. She has done things like this. She is not going to be the one who falls apart this week. She is also not going to be the one skipping to her station. \"I am fine with this,\" she tells the queen next to her. Fine is fine.",
        "The brief lands and {a} takes a breath. She is not panicking. She is not delighted. She is in the middle ground where most queens live most weeks. You survive by being better than two people. You go by being worse than one.",
        "{a} listens. Processes. Files the challenge under \"manageable\" — not the same as \"exciting\" and she knows it. \"I can work with this,\" she says. Whether that is enough depends entirely on what everybody else brings.",
        "She can do this. {a} repeats it to herself without moving her lips. The brief is clear. The runway is doable. She will figure out the rest at her station. \"Okay,\" she mouths. \"Okay.\"",
      ]),
      tier('dreading', 'This is the week she was hoping would not come.', [
        "{a} hears the brief and her face does not change. That is how you know. This is the challenge she was hoping would not come. It came. \"Girl,\" she mouths to herself. Four days of doing the thing she is worst at. On camera.",
        "This is {a}'s nightmare week and it just started. She listens to the brief. She nods. She is already calculating what this is going to cost her. The host finishes and {a} has not blinked once. \"I am going to figure this out,\" she says. She does not sound sure.",
        "The brief drops and {a}'s whole energy shifts. Not panic — something quieter. The thing she cannot do is the thing the week is asking for. She picks up a pencil. She puts the pencil down. \"Okay. Okay okay okay.\"",
        "{a} knew this week was coming. She packed for it. She told herself she was ready. Now that it is here she can feel the distance between being ready and being good at something. \"I just have to not be the worst,\" she whispers. That is the whole plan.",
      ]),
    ],
  },

  // ══ THE MINI ═════════════════════════════════════════════════════════
  {
    id: 'mini-announce', step: 'mini', scope: 'once', speaker: 'host',
    note: 'The mini is explained. Fast, silly, and worth something real.',
    tierBy: 'always',
    tiers: [tier('announce', 'A quick one, and what winning it buys.', [
      "\"But first — a mini challenge.\" The room groans. They love it. She explains it in thirty seconds because a mini is supposed to be fast and loud and over before anybody thinks twice. Then she names the prize. Every queen leans forward.",
      "The mini drops like a fire drill. Rules. Prize. Go. The room has not fully processed what is happening and the clock is already about to start. Queens are looking at each other trying to figure out who is about to embarrass herself first.",
      "\"Mini challenge.\" Two words and the energy changes. A mini is the one part of the week where being silly IS the strategy. She names the prize — good enough to matter, small enough to be fun. \"Ready?\" Nobody is ready. That is the point.",
      "She announces the mini and the room wakes up. Rules are simple. Timeline is short. Prize is worth having. \"This is supposed to be fun,\" she says. The maxi will remind them later that it is not.",
    ])],
  },
  /* ── THE HOST CALLS THE NEXT QUEEN UP ──
     A targeting mini is taken in turns and the turn is the format: one queen
     at a time, named out loud, standing up in front of everybody. "First
     up..." and "And last but not least..." are not decoration — the last read
     of the night is the one the room has been waiting for, and none of that
     reached the screen because the segment was rendered as thirteen
     simultaneous attempts. */
  {
    id: 'mini-turn', step: 'mini', scope: 'per-queen', speaker: 'host',
    /* AN ANNOUNCEMENT IS NOT A PARAGRAPH. Every other pool in this file is
       held to eighty characters because a one-liner there is a caption
       pretending to be a scene. This beat's whole job is a name shouted over
       a noisy room — "And last but not least... {a}!" is thirty-two
       characters and is exactly right, and padding it to reach a floor
       written for paragraphs would make it worse. */
    announcement: true,
    note: 'The host names the next queen to take her turn. Short and loud — '
      + 'this is an announcement, not a paragraph. {a} is the queen called.',
    tierBy: 'position',
    tiers: [
      tier('first', 'The first queen up, and the room does not know what to expect yet.', [
        "\"First up...\" The host lets the pause do the work, because the pause is half of it. \"It is {a}!\" The room makes a noise it will make twelve more times tonight.",
        "\"Opening the library for us tonight — {a}!\" The room is already screaming before she is out of her chair.",
        "\"We begin with {a}.\" Said flatly, which somehow raises the stakes rather than lowering them.",
        "\"Let us start where it hurts. {a}!\" The host is enjoying this more than anybody.",
        "\"The library is open, and first through the door is {a}!\" Somebody at the back shouts something encouraging and somebody else shouts something that is not.",
      ]),
      tier('next', 'One of the middle. The rhythm is established and she has to keep it.', [
        "\"Next is... {a}!\" The host says it over the noise of the last one, which is the only way to get through thirteen of these.",
        "\"Following that — and good luck — {a}.\"",
        "\"Up next, {a}!\" The host does not have to raise her voice; the room does it for her.",
        "\"And now {a}.\" A beat. \"No pressure.\"",
        "\"Keep it going. {a}!\" The host is running this like a room she has run a hundred times, because she has.",
        "\"Next up... {a}!\" The queen before her sits down still laughing.",
      ]),
      tier('last', 'The last one, and everybody has been waiting to see what she does.', [
        "\"And last but not least... {a}!\"",
        "\"Closing the library tonight — {a}.\" Everybody has been waiting for this one.",
        "\"Last one. {a}, the room is yours.\" And it is, briefly, and everybody in it is looking at her.",
        "\"And finally, {a}!\" She stands up like somebody who has been saving something.",
        "\"To close us out... {a}!\" The host sits back. She knows what is coming.",
      ]),
    ],
  },
  {
    id: 'mini-attempt', step: 'mini', scope: 'per-queen', speaker: 'narrator',
    note: 'Her go at it. One beat per queen who attempts, tiered by how it went.',
    tierBy: 'mini',
    tiers: [
      tier('nailed', 'She is very good at this and everybody enjoys it.', [
        "{a} goes and the room LOSES it. She has done this exact thing in a bar at two in the morning for six people and perfected it. The host is laughing. Queens are clapping. {a} takes a bow. Earned.",
        "{a} steps up and nails it. Not with effort — with ease. The ease is the part that makes the other queens nervous. \"She is trouble,\" someone whispers. Ease in a mini means confidence in a maxi.",
        "The mini hits and {a} hits harder. Funny. Fast. Fully committed. The room makes the noise that means somebody just won before the judges say a word. {a} grins at the camera. She knows.",
        "{a} goes for it and going for it was exactly the right call. The room erupts. The host goes, \"THAT is what a mini challenge is for.\" {a} sits back down like she just paid rent.",
      ]),
      tier('decent', 'A solid effort that gets a laugh.', [
        "{a} gives it a go and the go is good enough. Not the best. Not the worst. She gets a laugh — and a laugh in a mini is the difference between background and footage. She walks back satisfied. She did not embarrass herself.",
        "Solid effort from {a}. She reads the mini right — commit, do not overthink, get out. Not the winner. Not the queen they show struggling either. That middle ground is perfectly fine.",
        "{a} throws herself at the mini. The result is decent — a laugh, a clap, a nod from the host. \"That was cute,\" someone says. She walks back knowing she did what the mini asked. Nothing more.",
        "The mini gets a genuine effort from {a} and it gets a genuine reaction. Funny enough. Quick enough. Game enough. The host smiles. The queens who already went nod. A solid run.",
      ]),
      tier('flat', 'It does not land and she knows before she has finished.', [
        "{a} goes and it does not land. She can feel it not landing while she is doing it. The remaining seconds feel like they last a week. She walks back and goes, \"Well.\" The \"well\" contains everything.",
        "The mini asks for something {a} does not have tonight. She tries. The trying is visible — and a mini is supposed to look effortless. The room is kind about it. Kindness is its own verdict.",
        "{a} steps up and the energy in the room shifts from anticipation to encouragement. That shift tells you everything. She gets through it. She does not get a laugh. She gets silence.",
        "It falls flat. {a} knows it falls flat. She composes herself in three seconds and goes, \"That happened.\" The room laughs at that — a mercy laugh. But a mercy laugh is still a laugh and she takes it.",
      ]),
    /* ── SHE PASSED, AND THE CARD USED TO CONGRATULATE HER FOR IT ──
       js/dr/stage.js emits `passed` for a queen who stands up and has
       nothing, and this beat had no such tier — so `emit`'s
       `tiers.find(id) || tiers[0]` handed her NAILED, and the note over
       "she had one prepared and it has gone, and passes" read "She is very
       good at this and everybody enjoys it."
       The `lines` stay empty on purpose: every mini that can be passed
       carries its own voiced pool (js/dr/data/mini-voices.js) and mEmit
       takes the TEXT from there and only the NOTE from here. An unvoiced
       mini emits nothing rather than the wrong thing, which is the contract
       the rest of this file already keeps. */
    tier('passed', 'She stands up, opens her mouth and has nothing.', []),
    ],
  },
  /* ── SHE JUST FOUND OUT WHAT THE ROOM THINKS OF HER ──
     A vote mini (js/dr/data/spill.js) asks the room a question and reads the
     answers out. The question and the count are DATA — js/dr/stage.js draws
     that card itself and it renders on every night — and this beat is the
     other half: what the queen the room named does with her face.
     Tiered on the question's `sting`, because being voted the next one going
     home and being voted most likely to spend the money sensibly are not the
     same afternoon.
     THE POOLS ARE EMPTY ON PURPOSE. An unwritten tier emits no scene, so
     today the segment is the question and the count and nothing else — which
     is a smaller card, not a broken one. See docs/PROSE-PROMPT-dr-spill.md. */
  {
    id: 'mini-named', step: 'mini', scope: 'per-queen', speaker: 'narrator',
    note: 'The room has just named {a}, out loud, in front of her. What she '
      + 'does with that. {a} is the queen named; do not write a second name.',
    tierBy: 'sting',
    tiers: [
      tier('brutal', 'The room named her as the next to go, the shadiest, or '
        + 'the one about to crack. It is early in the week and she has not '
        + 'done anything yet.', []),
      tier('pointed', 'Not cruel, but not nothing — invisible, or a threat. '
        + 'She has to decide in front of everybody whether to take it well.', []),
      tier('harmless', 'A compliment, or close enough to one. The room laughs '
        + 'and it costs her nothing.', []),
    ],
  },
  {
    id: 'mini-win', step: 'mini', scope: 'per-queen', speaker: 'host',
    note: 'The mini winner is named and told what she has won.',
    tierBy: 'always',
    tiers: [tier('win', 'She takes it, and the advantage that comes with it.', [
      "{a} wins the mini and the room applauds. The advantage is real — it will matter when the maxi starts. {a} takes it with a grin. \"Thank you, mama.\" A head start in a race everybody else is running flat.",
      "\"Condragulations, {a}, you have won the mini challenge.\" The prize is explained. The advantage is hers. The other queens clap. Some of them mean it. All of them are doing the maths on what this costs them.",
      "The mini winner is {a}. She takes the prize. She thanks the host. She walks back to her station holding it like a boarding pass to somewhere better. \"That is mine,\" she says. It is not much. It is enough.",
      "{a} takes the mini and the advantage that comes with it. The host hands it over — \"Use it wisely\" — and {a} is already thinking about how to spend it on the maxi. A small win. But a win.",
    ])],
  },

  // ══ HOW THE ROOM IS DIVIDED ══════════════════════════════════════════
  {
    id: 'the-division', step: 'choice', scope: 'once', speaker: 'narrator',
    note: 'The room finds out how it is being split — teams, parts, characters, materials.',
    tierBy: 'assignment',
    tiers: [
      tier('draft', 'A pick order, and everybody can count.', [
        "The pick order is announced and the room becomes a maths class. Everybody is counting — how many queens, how many slots, where they fall. The queen picking first tries not to look too pleased. The queen picking last tries not to look at all.",
        "A draft. The room exhales. A draft means the queen who picks smart has an edge over the queen who picks late. The order is read. Thirteen faces do the same calculation: what do I want, when do I pick, and will it still be there.",
        "The pick order drops and the room rearranges itself in real time. Picking early is power. Picking late is a problem. \"I am going to be fine,\" someone says. She is not going to be fine.",
        "\"You will be picking in order.\" The room goes quiet. Everybody is running scenarios. A draft turns a creative challenge into a strategic one for thirty seconds — and those thirty seconds are the difference between getting your vision and getting scraps.",
        "The host reads the pick order and every queen listens for her own name. The ones who hear it early try to look neutral. The ones who hear it late try to look unbothered. Nobody in the room is neutral or unbothered. The draft has started before anybody has picked anything.",
        "A draft. The room immediately splits into two groups — the queens who are counting slots and the queens who are counting queens, and both groups are doing the same thing from different ends of the same panic.",
        "\"Pick order.\" Two words and the room reorganises. The queen at the top of the list is already scanning the board. The queen at the bottom of the list is already building a case for why the last slot is actually the best one.",
        "The host announces the order and the order lands like a ranking, because it is one. First pick is confidence. Middle pick is maths. Last pick is character, and the queen who got it is going to need a lot of it.",
      ]),
      tier('captains', 'Two queens are handed the room and start choosing.', [
        "Two captains. The host names them and the room splits — the people doing the choosing and the people being chosen. The being-chosen half is standing there like the first day of school in heels. The captains look at each other. The draft begins.",
        "The room is handed to two queens. Both of them know the team they build in the next sixty seconds is the team they live or die with. The picks are fast. Overthinking a captain's draft is how you end up talented in one direction and empty in three.",
        "Two captains. One room. The quiet cruelty of watching people decide your value out loud. Every queen chosen walks to her team with relief. Every queen still standing tries not to count how many are left.",
        "Captain picks. The two queens start choosing and the room watches itself get divided in real time. \"I will take...\" A pause. A name. A sigh of relief or a swallowed reaction. Repeat until the room is split.",
      ]),
      /* THE HOST CASTS IT AND NOBODY PICKS ANYTHING. `solo` is the closest
         existing tier and it is still wrong — solo is thirteen queens each
         doing their own thing, this is one production with a call sheet. */
      /* THE ACTING CHALLENGE AND THE COMMERCIAL. Both were rendering the
         CAPTAINS tier, because both group the room and the renderer inferred
         captains from `teams.length > 1` — and neither has one. Acting cuts
         the cast in two and drafts named PARTS inside each half; the
         commercial pairs the room off and hands each pair a product. The
         screen opened "Two captains. The host names them and the room splits
         — the people doing the choosing and the people being chosen" over a
         night where nobody chose anybody.
         Unwritten on purpose: `emit` skips a tier with no lines, so until
         these are written the screen says nothing about the split, which is
         better than saying something false about it. */
      /* THE MAKEOVER, WHICH IS NOT A DRAFT AND WAS BEING CALLED ONE. Its room
         is handed out by whoever won the mini, so "a pick order, and everybody
         can count" printed over a night where nobody counted anything. */
      tier('paired', 'One queen won the mini, and she is handing the whole room out.', [
        "One queen won the mini and that queen is now holding the whole room in her hands. She picks the partners. Every queen in the room just lost control of her week and every one of them is staring at the same person.",
        "The mini winner pairs the room. No draft, no counting slots, no strategy — one queen decides who works with whom, out loud, in front of everybody. The room does the math on who she likes and who she does not.",
        "\"You won the mini. You are pairing the room.\" The winner stands up. Every other queen sits very still. This is not a draft. There is no turn. There is one person with the power and twelve people waiting to find out what she thinks of them.",
        "Pairs, chosen by the mini winner. She has the whole room to hand out and the whole room knows it. Some queens are smiling at her. Some queens are avoiding eye contact. Neither strategy is going to change what she already decided.",
      ]),
      /* AND THE SAME NIGHT WITH NOBODY TO DO THE PAIRING. An episode that
         books no mini has no winner to hand the room out, and the makeover
         fell through to `draft` — a pick order, on a night with no picking. */
      tier('drawn', 'No mini winner, so no favours. The names come out of a bag.', [
        "Nobody won the right to pair this room, so the room draws. Names in a bag, one hand at a time, and whatever comes out is who she is spending the day with. No strategy, no grudge, no favour — which is either a relief or a disappointment depending on who you asked to be paired with.",
        "No pairing prize this week. The host holds out the bag and the room lines up. Every queen gets exactly as much control over her afternoon as the person next to her, which is none.",
        "The names go in a bag and the bag decides. The room watches each draw and does the same arithmetic every time: is that better or worse than what is left. By the last hand there is no arithmetic left to do.",
        "\"Reach in.\" No draft, no captain, no winner handing out favours. One by one the queens pull a name and meet the person on it, and the meeting is the whole ceremony.",
      ]),
      /* AND THE WEEK NOBODY IS A STRANGER. The loved-ones makeover hands
         every queen her own person and there is nothing to hand out at all. */
      tier('own-family', 'Nobody is paired with anybody. They are already paired.', [
        "There is nothing to hand out. The doors open and the room stops being a competition for about ninety seconds, because the person walking through them belongs to somebody standing here.",
        "No draft, no bag, no mini winner. Every queen gets hers, and the only thing the host has to do is stand back and let the room fall apart for a minute.",
        "The host does not read an order. She opens a door. What happens next is not a challenge yet — it becomes one again when somebody remembers there is a runway tonight.",
        "Nobody is assigned anybody. They walk in and they are already family, which makes the job easier and the stakes considerably worse.",
      ]),
      tier('two-casts', 'The room is cut in two, and the parts are fought over inside each half.', [
        "Two casts. Same script. The host splits the room and both halves are doing the same six parts, judged against each other. Two queens just realised they are playing the same character.",
        "The room is cut in half. Same script, same characters, back to back on the panel. The queens who got the stronger cast know it already.",
        "\"Same script. Two casts.\" Every queen looks at the one next to her trying to figure out who she is being compared to. The comparison is the whole point.",
        "Two halves, one script. Whoever is playing her part on the other side is the person she needs to beat. Not be different from. Beat. The panel sees both.",
      ]),
      tier('pairs', 'Two by two, and a product each.', [
        "Pairs. Two by two, and each pair gets a product with a trap in it — something that does not sell itself. The commercial is how they get out of it.",
        "\"You will be working in pairs.\" Two queens per commercial, one product each. The product is ridiculous. Selling it straight is not an option.",
        "Two by two. The host hands out products and the reactions land live — one pair laughs, one pair stares, one pair is already whispering about the angle.",
        "Pairs and products. Each duo gets something to sell and thirty seconds to do it in. Write it, shoot it, answer for it on the panel.",
      ]),
      tier('cast', 'No draft at all. The host reads out who is playing what.', [
        "No picks. No draft. The host reads the cast list. Every queen hears her part in the same sentence as everybody else — lead, featured, ensemble — and nobody chose any of it. The room takes it in silence because there is nothing to argue with. The call sheet is the call sheet.",
        "The host announces who is playing what and the room listens. No volunteers, no trades, no captain making choices under pressure. She reads the list. One queen gets the lead and did not raise her hand for it. One queen gets the background and could not have stopped it.",
        "\"Here is what you are doing this week.\" The host reads parts off a list. No negotiation. No draft. The room hears it at once and processes it at different speeds. The queen who got the lead is already thinking about camera blocking. The queen who got the ensemble is already thinking about how to be seen.",
        "The host casts the video. Not a draft — a cast list. Roles assigned, not chosen. The room takes it quietly. The lead queen exhales because the pressure just arrived. The ensemble queen exhales because the anonymity just arrived. Both of them are right to be worried.",
      ]),
      tier('solo', 'Everybody is on their own this week.', [
        "No teams. No partners. No captain, no draft, no safety net. Everybody is on her own this week. The room is relieved they cannot be dragged down and terrified they have nobody to hide behind.",
        "\"You are all on your own.\" The sentence changes the room. Some queens straighten up — solo means their talent is the only variable. Others go quiet. Solo means there is nobody to share the blame with. \"Just me and my sewing machine,\" someone says.",
        "Solo week. The relief is immediate. Everybody is glad they do not have to depend on somebody else. Everybody is also aware that depending on somebody else was a place to put the blame. This week the blame lives at home.",
        /* NO {a} HERE. `the-division` is `scope: 'once'` and fires with an empty
         player list, so `{a}` filled to nothing and the card printed
         "\"Good,\" says. She means it." — a quote with the speaker cut out of
         it. The schema test below now refuses `{a}` on a once-scope beat. */
      "Nobody is paired. Nobody is grouped. Solo means the best version of yourself wins and the worst version goes. No buffer. No partner. No excuse. Somewhere in the room somebody says \"good\" out loud and means it. Probably.",
      "Solo. Every queen in the room just became her own team and her own problem, and the room gets quieter because quiet is what happens when everybody is running the same calculation: can I do this alone. Some of them can. Some of them are about to find out.",
      "No partners. The host says it and the room splits into the queens who are relieved and the queens who are pretending to be, and neither group is going to admit which one they are in because both of them involve being scared of something.",
      "\"This week, it is just you.\" The host says it simply because it is simple. No team, no captain, no draft. Every queen looks at her own station and sees the same thing: a mirror, a machine, and nobody else's talent to lean on.",
      "Solo week. The whole room exhales at once and the exhale is half relief, half terror, and the ratio depends on who you ask. The queen who has been carrying a weak partner all season just lost her excuse. The queen who has been carried just lost her shield.",
      ]),
    ],
  },
  {
    /* ── THE STUDIO TAPING ──
       The scripted parody and the advert, the way `studio-day` is the music
       video's. A separate pool rather than a shared one because that pool
       talks about the call sheet, the shot list and the edit — this is a scene
       being blocked and a product being sold, and borrowing the video's words
       is the bug the whole split exists to stop.
       NOT A REHEARSAL. That word belongs to the room where a number is taught,
       and this is a set: a script, a camera, a monitor and somebody behind it.
       IMPROV AND THE ROAST HAVE NO DAY LIKE THIS. Improv is unscripted by
       definition and the roast is a set written alone and delivered live, so
       neither has an afternoon anybody could form a view of — and inventing
       one would be a director's notes on a rehearsal the format exists to
       not have. */
    id: 'studio-taping', step: 'prep', scope: 'per-queen', speaker: 'narrator',
    note: 'Her hours on the set in front of {m}, and what the day did to what she thinks of her.',
    tierBy: 'impression',
    tiers: [
      tier('made-the-scene', 'She gave him something better than what was written.', [
        'Take two. {a} does something off-script. {m} watches the playback. "Again. That." {a} does it again, better. {m} keeps it and resets for a second angle.',
        '"Where did THAT come from?" {m} pulls off her headset. {a} shrugs. The take was better than the page and {m} is already reworking the scene around it.',
        '"That was not what I wrote for you," {m} says. Not angry — impressed. {a} brought something the script did not have and now {m} wants two more angles on it.',
        '{a} ad-libs a reaction on take one. {m} leans into the monitor. "Keep going." They shoot four more takes of the same moment and {m} builds the scene around {a}.',
      ]),
      tier('takes-direction', 'A note, a take, and on to the next setup.', [
        '"Faster on the turn." {a} adjusts. {m} nods, calls for the next setup. Done. Clean afternoon, no story for the panel.',
        '{m} gives a note. {a} takes it first try. "Good." {m} is already looking at the next setup on the monitor.',
        '{a} hits the mark, hears the note, delivers. {m} calls cut after take two. The crew barely notices — that is what a good day looks like.',
        '"That works." Two takes and {a} is done. She did what {m} asked and {m} moved on. No drama, no blooper reel.',
      ]),
      tier('many-resets', 'They go again, and again, and the room feels the afternoon.', [
        '"Again." Take five. {a} stumbles on the same beat. "You are inside one line thinking about the next," {m} says. Take six. Seven. They land on nine.',
        '{m} gives the same note four times. {a} takes none of them. "Stop. You are performing nerves, not the scene." Take seven is the one they keep.',
        '"One more," {m} says. She has said it five times. {a} cannot land the transition and the queens waiting outside can hear every reset.',
        '"Smaller." {a} gives the same performance. "Smaller." Again. Six takes of the same note. {m} stays calm. {a} hears the calm getting thinner.',
      ]),
      tier('argued-with-him', 'She was asked for something and said no, in front of the crew.', [
        '"I think my version is better," {a} says. To {m}. On set. {m} looks at her. "Do it my way." {a} does not. {m} adjusts the shot and builds around her.',
        '"I need this from you." "No." {a} says it on a set where the crew heard every word. {m} finishes the day and tells the panel {a} was the hardest part of it.',
        '"I know what I am doing," {a} says. The set goes quiet. {m} does not repeat the note. She moves the camera.',
        '"Find the lens." "I AM finding the lens." She is not. {m} gives the note once more, {a} refuses once more, and {m} moves on. The panel hears about the move-on.',
      ]),
    ],
  },
  {
    /* ── THE REHEARSAL ROOM ──
       A Rumix is performed live with choreography and a music video is danced,
       and neither had a rehearsal in either the engine or the episode: the
       number simply existed on the night, learned by nobody. This is the
       afternoon, one card per queen, run by the choreographer rather than by
       the panel — see MENTORS in js/dr/data/judges.js. */
    id: 'rehearsal', step: 'prep', scope: 'per-queen', speaker: 'narrator',
    note: 'The choreographer teaches the number. Who has it by the end of the day.',
    tierBy: 'choreo',
    tiers: [
      tier('first-pass', 'She has it after one run and spends the rest of the day helping.', [
        '{m} runs the number once. {a} already has it — spacing, timing, every transition. He sends her to help the back row.',
        '"You are done." {m} waves {a} over to the girl still counting her feet. {a} mirrors the choreo and the girl learns it off her.',
        'One run-through. {a} gives it back clean. {m} moves on. {a} stays and quietly drills it again on her own.',
        '{a} picks up the choreo so fast {m} uses her as the mirror. The other queens learn the number off {a}\'s body.',
      ]),
      tier('got-there', 'It takes the afternoon and by the end of it she has the number.', [
        '{a} is a half-beat late for the first hour. {m} stays on her. By the afternoon run-through she has every count.',
        '"There it is." {m} says it when {a} locks the transition. All day, but she got there.',
        'Same correction three times. Fourth pass, {a} lands it. {m} nods and moves down the line.',
        '{a} fights the opening eight-count all morning. {m} sees the work. By end of day she is hitting every mark.',
      ]),
      tier('behind-the-count', 'She is a half-count late all day and she knows it.', [
        '{a} is a half-count behind every transition. {m} claps the beat louder, right next to her ear. She is still late.',
        '"Where are you?" {m} asks {a} on the third run-through. She opens her mouth. Nothing comes out. She is still finding one.',
        '{m} watches {a} miss the same pickup five times. He does not say anything. He does not have to.',
        '{a} knows the steps. Her body is late to every one of them. {m} is running out of afternoon.',
      ]),
      tier('still-counting', 'The room moves on without her. She is mouthing numbers.', [
        'The room is running the number. {a} is in the back mouthing counts from the first section. {m} sees it.',
        '"Five, six — {a}, look up." She is staring at the floor counting her feet. The music is past her.',
        '{m} moves the group to the next section. {a} is still on the first one. The gap gets wider every hour.',
        '{a} asks {m} to walk her through it again. He does. The room has moved on. She is learning yesterday.',
      ]),
    ],
  },
  {
    /* ── THE BOOTH ──
       `booth` decides what the panel actually hears and it was a number with
       no screen: only the two extreme outcomes narrated, so ten queens in a
       twelve-queen room recorded a vocal the episode never mentioned. One card
       each, like the shoot day and the host's walkthrough, and the tier is
       decided in js/dr/chal/rumix.js rather than here — the engine says what
       happened and this says it in words. */
    id: 'booth-session', step: 'prep', scope: 'per-queen', speaker: 'narrator',
    note: 'Her hour in the booth with the vocal producer, and what came out of it.',
    tierBy: 'booth',
    tiers: [
      tier('got-it-on-tape', 'The take is better than the verse. She found something in her.', [
        "\"Again. Same energy, less air before the punchline.\" {m} plays the track back and {a} delivers take three. {m} pulls off her headphones, nods once, and {a} knows that nod. The verse on the page was shaky. The verse on the tape is not. {m} heard something in {a}'s delivery and pulled it out before {a} knew it was there.",
        "{a} sits down in the booth and {m} plays the track. First take is nervous. \"You are rushing the second bar,\" {m} says. \"Breathe before the rhyme. Trust the beat.\" {a} breathes. Take two lands. Take three lands harder. The recording is better than the verse she wrote, and the recording is what the panel hears.",
        "\"That bar scans now,\" {m} says after take four. \"It did not scan when you walked in.\" {a} knows. The verse on paper had a punchline that tripped over itself, and {m} spent twenty minutes rearranging the breath marks until {a} could say it at tempo. What the panel hears tonight is the version {m} found inside the one {a} brought.",
        "{m} stops the playback after the second bar. \"Hold that vowel longer. You are swallowing the rhyme.\" {a} does it again. {m} nods. By take four the recording sounds like a queen who has been writing verses her whole career. She has not. The booth — and {m} — made it sound like she has.",
      ]),
      tier('clean-session', 'In, done, out. No drama and no rescue needed.', [
        "{a} walks in, puts on the headphones, and records. Three takes. {m} listens, plays back the third, and says \"That is it.\" {a} is out of the booth in ten minutes. No crisis. No rescue. The queens waiting outside do not even look up.",
        "\"You know this verse,\" {m} says after take one. She records two more anyway — because that is what a session is — and {a} is done. Clean. Professional. The tape sounds exactly like the verse she wrote, and {m} does not need to fix what was never broken.",
        "A quick session. {m} plays the track, {a} delivers the bars, and {m} gives one note: \"Breathe after the second line, not before it.\" {a} adjusts. Done. {m} moves on to the next queen. Some sessions are a rescue operation. This one was paperwork.",
        "{m} nods after take two and pulls off her headphones. \"We are good.\" {a} looks surprised — she expected more takes. {m} did not need them. The verse was learned, the delivery was clean, and the tape captured what {a} brought. No drama. No story. Just a queen who came prepared.",
      ]),
      tier('many-takes', 'They get it eventually, and everybody knows how long it took.', [
        "\"Again.\" {m} resets the track. Take five. {a} stumbles on the same bar. \"You are thinking about the next line while you are still inside this one,\" {m} says. \"Stay in the bar.\" Take six. Take seven. Take nine finally lands and {m} says \"That one\" with the voice of a person who has been patient long enough.",
        "{a}'s session runs long. {m} stops her after take three. \"The timing is off on the punchline. Say it to me without the track.\" {a} says it. It works. {m} plays the track again. It does not work. They do this four more times. The queens waiting outside have been waiting long enough to notice.",
        "\"You are flat on the second bar,\" {m} says. They do it again. \"Still flat.\" Again. {m}'s patience does not break — it never breaks — but it shifts from warm to professional somewhere around take seven, and {a} can hear the shift. They land on take nine. It is usable. It is not the take either of them wanted.",
        "Take after take. {m} stays calm. {a} stays less calm. \"Stop,\" {m} says after take six. \"You are performing nerves, not the verse. Breathe. Start from the top.\" {a} breathes. Take seven is better. Take eight is the one they keep. It took too long and the queens waiting outside heard every reset.",
      ]),
      tier('could-not-get-it', 'She wrote it and she cannot sing it. The tape is what the panel hears.', [
        "\"One more time. From the top.\" {m} has said it eleven times. {a} cannot land the verse. She wrote it — she can read it off the page — but putting it on tape at tempo with the track in her ears is a different skill from writing, and she does not have it. {m} picks the least bad take. The panel hears the least bad take.",
        "{m} stops the playback. \"You are losing the second bar every time. Do you hear it?\" {a} hears it. She cannot fix it. The verse lives on paper and dies in the booth, and {m}'s notes are landing on a queen who is too rattled to take them. The tape they settle on has the confidence of take one and the pitch of take twelve. Neither is good.",
        "\"I need you to breathe,\" {m} says. {a} cannot breathe. The booth is too small and the headphones are too loud and the verse that sounded right in the werk room sounds wrong in her own ears. {m} tries everything — slower tempo, punched-in bars, a read-through without the track. The recording they keep is the best of nothing good.",
        "{a} wrote a real verse and she cannot get it on tape. {m} hears the problem — the rhythm is fighting the beat — and gives the note three different ways. {a} takes none of them. \"The panel hears THIS version,\" {m} says quietly, playing back the take they are going to use. The take is not what {a} wrote. It is what the booth captured.",
      ]),
    ],
  },
  {
    /* ── SOMEBODY ELSE DECIDED WHO SHE IS WORKING WITH ──
       The makeover's room is handed out by whoever won the mini, so most of
       the cast neither picked nor was cast by the host. That is a third thing
       and the screen had no words for it, so it borrowed the music video's
       call sheet — which is how "the role exists in the video" came to be
       printed over a challenge about a wig.
       `{b}` is the queen who did the pairing and `{d}` is the partner's NAME.
       Four of the eight lines here used to say "her partner" over a man the
       pick has been carrying a name for since the module was written, and the
       prep room said it six more times — a whole makeover in which the
       person being made over is never once addressed.
       NOT EVERY TIER HAS A `{b}`. `drawn` and `own-family` are the weeks
       nobody handed anything out, so their lines must not reach for one. */
    id: 'paired-off', step: 'choice', scope: 'per-queen', speaker: 'narrator',
    note: 'Who {b} paired her with, and what the room thinks it meant.',
    tierBy: 'pairing',
    tiers: [
      tier('dumped-on', 'She was handed the hardest man in the room, and everybody saw it.', [
        "{b} says {a}'s name and the room goes quiet. That is the hardest partner on the board and everybody knows it. {a} smiles because there is nothing else to do.",
        "{d} is the hardest partner in the room, and {b} hands {d} to {a} with a smile. {a} takes it. She does not have a choice, and the not having a choice is the point.",
        "{b} pairs {a} with the one nobody wanted. The room watches. {a} nods and walks over to meet {d} and the walk is longer than it should be.",
        "{a} gets the name and tries not to react. She does not quite pull it off. {b} has already moved on to the next queen.",
      ]),
      tier('looked-after', 'She was given somebody she can work with, deliberately.', [
        "{b} gives {a} {d}, who is somebody she can actually work with. It is generous and the room reads it immediately — that is a favour, out loud, in front of the whole cast.",
        "{a} gets paired and the relief is visible. {b} gave her someone workable and everybody in the room just clocked the alliance. Whether or not there is one.",
        "{b} hands {a} {d}, who she can build with. It is kind. It is also visible, and visible kindness in this room becomes a talking point on the panel.",
        "{d} for {a}, chosen deliberately by {b} out of everybody she could have handed her. {a} exhales. The room takes a note, and the note is not about the wig.",
      ]),
      tier('kept-the-best', 'She won the mini, and the first thing she did was keep the best for herself.', [
        "{a} won the mini and the mini bought her this: first pick of the room. She takes {d}. Nobody is surprised and nobody says anything, because everybody in here would have done the same.",
        "\"I am keeping {d}.\" {a} does not dress it up and does not apologise for it. She won, the win bought her the room, and the best in it is hers before anybody else gets a name.",
        "{a} takes {d} for herself first, out loud, in front of everybody. It is not a betrayal — it is the prize. The room watches anyway, because now they know what is left.",
        "First name {a} calls is her own. {d} walks over to her station and the rest of the room does the arithmetic on what is still on the board.",
      ]),
      tier('drawn', 'Nobody handed anything out. She reached into the bag and took what came out.', [
        "Nobody won the right to pair this room, so the room draws. {a} reaches in, pulls a name, and gets {d}. No strategy in it, no favour, no grudge — a hand in a bag and a stranger she has ninety minutes to turn into family.",
        "{a} draws {d}. They look at each other and start from nothing at the same moment. That is the whole ceremony.",
        "The names come out of a bag. {a} gets {d} and walks them back to her station already talking, because the talking is the work and the clock has started.",
        "{a}'s hand comes out of the bag with {d} on the paper. She takes one look and starts making a list. The list is long. The afternoon is not.",
      ]),
      tier('own-family', 'She did not draw a stranger. She got hers.', [
        "{a} sees {d} and the challenge stops being a challenge for about fifteen seconds. Then it starts again, because {d} still has to walk a runway tonight and has never walked anything.",
        "{a} has known {d} her whole life. She gets the face she already knows by heart and the terrifying job of putting it on a stage.",
        "The doors open and there is {d}. {a} does not move for a second. Then she does, and the two of them hold on longer than the cameras need.",
        "{a} gets {d}. Not a stranger, not a draw, not a favour from anybody — hers. The paint will be the easy part.",
      ]),
      tier('next-name', 'No message in it. She was the next name on the list.', [
        "{b} says {a}'s name. No pause, no drama, just the next queen on the list. {a} walks over to meet {d} and sizes {d} up on the way.",
        "{a} gets {d}. She shakes hands, looks at the shoulders, and starts thinking about proportions. There is work to do and the sooner she starts the better.",
        "Next name: {a}. She meets {d}. First handshake, first look, first assessment of what she is working with. {d} is nervous. She is already planning the wig.",
        "{b} calls {a} and moves on. {a} meets {d}, takes one look, and starts making a list in her head. The list is long. The afternoon is not.",
      ]),
    ],
  },
  {
    /* ── THE CALL SHEET ──
       The pick-reaction beat below cannot serve this: every one of its tiers
       is about what she CHOSE and how far down her own list it was, and on
       this challenge she chose nothing. Being handed the lead and being handed
       the back of the frame are different afternoons, and neither of them is
       a draft. */
    id: 'call-sheet', step: 'choice', scope: 'per-queen', speaker: 'narrator',
    note: 'What the host cast her as. She had no say and everybody heard it at once.',
    tierBy: 'role',
    tiers: [
      tier('lead', 'She was handed the whole video and did not ask for it.', [
        "\"You are my lead.\" The host says it and the room goes quiet. {a} did not ask for this. She did not campaign. The host read her name off a list she had no part in writing, and now the video belongs to {a}. If it works, she carried it. If it does not, she sank it. There is no middle on a lead.",
        "The host looks at {a}. \"This is YOUR video. You are the centre of it.\" {a} nods. The room does the maths: she has been safe for weeks, the host just bet on her in front of everybody, and the part she was given is the one with the most screen time and the most risk.",
        "\"The lead goes to {a}.\" The host says it the way she says everything — direct, final, not a discussion. {a} did not raise her hand. The host raised it for her. The part the camera follows, the part the edit is built around, the part the panel will judge the hardest because it had the most to work with.",
        "{a} is handed the whole video. \"I want to see what you can do with this,\" the host tells her. The room watches {a} take in the weight of it. The lead is a bet the host made, and now {a} has to prove the bet was right. Nobody else in the room has that pressure and nobody else has that screen time.",
      ]),
      tier('featured', 'A real part, and the pressure that comes with being named.', [
        "The host reads {a}'s name and the part beside it. Featured. A real role — scenes, camera time, a section of the video that belongs to her. \"You have material,\" the host says. \"Use it.\" Not the pressure of the lead but not the anonymity of the ensemble.",
        "\"{a}, you are featured.\" The host moves on. The word sits with {a} — featured means the panel will see her, the camera will find her, and the part she was given is enough to stand out on if she uses it and enough to flop on if she does not.",
        "{a} gets a featured part. The host names her and the room hears it. A named role with screen time and a moment the camera has to find. \"Make it count,\" the host says. Whether the panel notices it for the right reasons is entirely on {a} now.",
        "\"Featured,\" the host says, reading off the call sheet. {a} takes it in. The part has weight — not the weight of the lead, but enough that flopping it would be her fault and nailing it would be her credit. That is what featured means on a call sheet you did not write.",
      ]),
      tier('standard', 'Something to do, and nothing that will carry her.', [
        "The host reads {a}'s part. Standard. Something to do on camera, nothing that will carry her. {a} nods. The role is what it is — enough to work with, not enough to coast on. \"The camera will find everyone,\" the host says. Whether the camera finds something worth cutting to is on {a}.",
        "\"{a}, you are here.\" The host points at the call sheet and moves on. Standard. Present in the video, not the centre of it. She has scenes. She has camera time. None of it will distinguish her unless she finds something in it the host did not put there.",
        "{a} is cast in the middle of the call sheet. Not the part with the pressure and not the part with the anonymity. \"It is what you make of it,\" the host says. Standard means the panel will not be looking for her. Standard means she has to give them a reason to look.",
        "\"Standard,\" the host reads, and {a} hears it. The role exists in the video. It will not carry her to the top or sink her to the bottom unless she decides to make it do one of those things. Queens with standard parts survive by being better than the part. Queens with standard parts go home by being exactly as invisible as the part allows.",
      ]),
      tier('ensemble', 'The back of the frame. She has to make herself findable.', [
        "\"Ensemble.\" The host says it and moves on before the word has landed. {a} hears it. The back of the video. The camera will not find her. The director will not build a setup around her. If she wants to exist in the final cut, she has to make herself findable — and that is the whole challenge from here.",
        "{a} gets the ensemble. \"Everybody has a job this week,\" the host says. {a}'s job is to not disappear. The back of the frame. No featured moment, no close-up, no scene the edit is built around. She is in the video unless she gives the camera no reason to come back to her.",
        "The host reads {a}'s name at the bottom of the call sheet. Ensemble. The polite word for the background. {a} takes it quietly. Queens have stood out from the ensemble before — found the camera, given the editor a reaction, made themselves matter from the back of the frame. Queens have also vanished from it.",
        "\"You are in the ensemble,\" the host says. {a} nods. She knows what it means: she is starting this challenge behind everybody who got a name on the call sheet. The camera will not come to her. She has to go to the camera. That is the only path out of the background.",
      ]),
    ],
  },
  {
    /* ── THE DAY ON SET ──
       THE WHOLE MECHANIC WAS INVISIBLE. `js/dr/chal/music-video.js` computes a
       director's impression per queen — did she read the note, could she do
       it, did she come apart on the ninth take, did she argue — and feeds it
       to the panel through `judgeViews`. It reached the screen as ONE scene
       carrying a data payload and no words, so the shoot was a thing that
       happened to the numbers and nowhere else. Reported as "we don't have a
       video moment with the director": correct, and the §11.5 A bug class
       written by the person who had just finished writing about it.
       One card per queen, like the host's walkthrough, because the day is the
       challenge on this one. */
    id: 'studio-day', step: 'prep', scope: 'per-queen', speaker: 'narrator',
    note: 'Her hours in front of {m}, and what she will tell the panel.',
    tierBy: 'impression',
    tiers: [
      tier('made-the-day', 'She starts building the video around her.', [
        "\"Stay right there.\" {m} waves at the crew to hold and turns to {a}. \"Do that again. Exactly that.\" {a} does it again. {m} watches the monitor, nods, and calls for an extra setup. She is building the video around {a} now — adding shots the call sheet did not ask for because the footage is too good to leave on the floor. She will tell the panel all of it.",
        "{m} gives {a} the first note and {a} takes it cold. First take. \"That is the one,\" {m} says. She moves the camera closer. She calls for a second angle. By lunch {m} is rearranging the shot list to give {a} more screen time, and the crew knows what that means. {m} does not rearrange a shot list for a queen who is doing fine. She rearranges it for a queen who is making the day.",
        "\"You are giving me everything I need,\" {m} tells {a} between setups. \"Keep doing that.\" {a} keeps doing it. {m} shoots more of her than the call sheet required because the material justifies it. What {m} tells the panel later is what she has been telling the crew all afternoon: {a} is the one.",
        "{a} finds the camera on every setup. {m} sees it — she sees everything — and starts building extra shots around {a} without announcing it. \"The edit is going to love you,\" {m} says, not looking up from the monitor. She does not say that to queens she is being polite to. She says it to queens she is building a video around.",
      ]),
      tier('easy', 'She takes the note, gives her the take, and she moves on.', [
        "\"Smaller. Find the lens.\" {a} adjusts. {m} watches the monitor, nods, calls cut. They move to the next setup. A clean day — {a} takes the note, gives {m} the take, and {m} moves on. She will not single {a} out to the panel, but she will not flag her either.",
        "{m} gives {a} a note. {a} takes it. First try. \"Good,\" {m} says, already looking at the next setup. {a}'s day on set is professional and uncomplicated — she does what the camera needs, she listens when {m} talks, and she does not make the day longer than it has to be.",
        "\"That works.\" {m} says it after take two and {a} is done. No drama. No extended session. {m} got what she needed and moved on. {a} is not the queen making the day and she is not the queen costing the day. She is the queen doing the work.",
        "{a} hits her mark. {m} calls cut. They move on. A clean session — the kind that does not generate a story for the panel and does not generate a problem for the edit. {m} will tell the judges {a} was easy to work with. On a video challenge, easy to work with is a compliment.",
      ]),
      tier('slow', 'They get there. Getting there takes most of the afternoon.', [
        "\"Smaller,\" {m} says. {a} gives her the same performance. \"Smaller,\" {m} says again. {a} adjusts, barely. They do this six times. {m}'s patience does not break — it never breaks — but it shifts from warm to professional somewhere around take five, and {a} can hear the shift. They get there. They did not get there quickly.",
        "{m} gives {a} a note about scale. {a} gives {m} a stage performance. \"The lens is RIGHT THERE,\" {m} says, pointing. \"You do not need to fill a room. You need to fill eighteen inches.\" They do it again. Smaller. Again. By the time the take lands, the crew has been watching the same setup for forty minutes.",
        "\"I need you to trust the camera,\" {m} tells {a}. {a} tries. The try is too big. {m} resets. Tries again. Still too big. {m} spends most of the afternoon on {a} — not because the footage is bad, but because the footage keeps not being right. \"We got there,\" {m} will tell the panel. The \"eventually\" is implied.",
        "{a} is slow. Not bad — slow. {m} gives notes and {a} processes them at a pace that costs the day its margin. \"One more,\" {m} says. She has said it four times. By the time {a}'s footage is usable, the setups behind her are rushed. {m} does not blame her to the panel. She describes the day. The description is enough.",
      ]),
      tier('argued', 'She was asked for something and told her no, in front of the crew.', [
        "\"Smaller,\" {m} says. \"No,\" {a} says. On set. In front of the crew. {m} looks at her. \"Smaller,\" she says again, with the voice of a person who is not asking. {a} does it bigger. {m} stops talking. She shoots around {a} — wider angles, less of her in the frame — and what the panel hears is not that {a} was bad. It is that {a} was difficult.",
        "{m} gives {a} a note. {a} gives it back. \"I think my version is better,\" {a} says. {m} does not argue — she is a judge, not a debate partner. She moves the camera, adjusts the shot list, and builds the edit so the video works without the queen who was supposed to make it work. The panel will hear about the adjustment.",
        "\"Find the camera,\" {m} says. \"I AM finding the camera,\" {a} says. She is not. {m} knows it. The crew knows it. The argument happens in front of everyone and the camera is still rolling. {m} gives the note one more time, {a} refuses it one more time, and {m} moves on. What she tells the panel is the move-on, not the note.",
        "\"I need this from you,\" {m} says, and {a} says no. Out loud. On a set. To a judge who will be sitting at the panel tonight and who remembers everything she saw today. {m} does not raise her voice. She finishes the day. She tells the panel {a} was the hardest part of it. Both of them mean what they said.",
      ]),
    ],
  },
  {
    id: 'pick-reaction', step: 'choice', scope: 'per-queen', speaker: 'narrator',
    note: 'What she ends up with, and what her face does about it.',
    tierBy: 'pick',
    tiers: [
      tier('got-it', 'She got exactly what she wanted.', [
        "{a} gets her pick and the satisfaction is immediate. She wanted this one. She got this one. The walk back to her station has the energy of somebody carrying a weapon she knows how to use. The other queens clock it. They always clock it.",
        "The pick lands and it is the one she was hoping for. {a} takes it without hesitation and gets to work immediately. That is the tell — queens who got what they wanted do not stand around discussing it. They build.",
        "{a} gets exactly what she wanted and the room watches her take it. \"Yes ma'am,\" she says under her breath. Her station is already being reorganised around the pick before the next queen has chosen.",
        "First choice, best choice. {a} takes what she wanted. The wanting was so obvious nobody in the room is surprised. She sits down, opens her kit, and starts. No speech. No gloating. Just work.",
      ]),
      tier('settled', 'Not her first choice. She is making it work.', [
        "{a} takes what is available and decides — visibly — to make it work. Not with excitement. With purpose. \"I can do something with this,\" she says. It is not a lie. It is not entirely true either.",
        "Not her first choice. Not her second. {a} takes the pick and looks at it. She can work with this. She will have to work with this. The difference between those two sentences is the distance between safe and low.",
        "{a} settles. The settling is graceful enough the room might not notice. But {a} notices. She had a plan. The plan involved a different pick. Now she is rebuilding in real time. \"Okay girl, pivot,\" she tells herself.",
        "The pick is fine. {a} takes it and nods. The nod is a decision to stop wanting what she did not get and start working with what she did. Not the weapon she would have chosen. But it is a weapon.",
      ]),
      tier('left-over', 'She got what nobody else took.', [
        "{a} gets what nobody else wanted. That is its own small humiliation — not because the pick is bad, but because the room decided it was bad before she could prove otherwise. She takes it without complaint. The silence is louder than a complaint would have been.",
        "Whatever was left is what {a} has. She picks it up the way you pick up a lost-and-found coat. It will do the job. It will not be pretty. \"I am going to make this work,\" she says. She has something to prove this week.",
        "{a} takes the leftover and the leftover becomes her challenge inside the challenge. Make this work. Make it work when everybody can see it was last on the shelf. The queens who picked before her look away.",
        "The last pick goes to {a} and she takes it with a smile that costs her something. \"Watch me,\" she says. Not loud. Not to anybody in particular. But she says it.",
      ]),
      tier('picked-last', 'The room chose, and it chose her last.', [
        "{a} is the last queen standing. The room chose, and it chose her last. She walks to her team like somebody arriving at a party where the seating chart was decided without her. She smiles. The smile is a shield.",
        "Picked last. {a} walks to where she is told. The queens already seated look at her with the kindness of people who feel guilty. {a} does not need their kindness. She needs a maxi that lets her prove the draft wrong.",
        "The room chose and {a} was the last name called. The silence between second-to-last and last is the silence where everybody decides how to feel about it. {a} decides to feel nothing. Or at least to show nothing.",
        "{a} is picked last. She joins her team. She does not make a speech about it. She starts working with the focus of somebody who has something to prove and a specific group of people to prove it to. \"I will remember this,\" she says. Quietly.",
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
        "{a} performs and the room forgets it is a challenge. The preparation. The instinct. The hours at her station. All of it comes together into something that makes the format disappear. She is not competing. She is doing the thing she was put on this earth to do. The panel is quiet. That is how you know.",
        "This is what {a} came here to do. She does it at a level that makes the judging feel like a formality. Precise. Alive. Full of choices that reveal themselves on second viewing — a detail in the construction, a beat in the timing, a decision that could have gone safe and went brave.",
        "{a} delivers something the panel was not expecting. Original without being weird. Polished without being cold. The craft — the actual craft underneath the drag — is so clean the judges are going to have to invent new compliments. \"That,\" one of them says. Just that.",
        "The maxi belongs to {a} from the first beat. She builds a performance that works on every level the challenge asked for and two it did not. What the panel sees is not effort. It is the result of effort. That is the version that wins.",
      ]),
      tier('strong', 'She is good and she knows exactly how good.', [
        "{a} delivers a strong maxi. Prepared. Confident. Executed with the kind of precision that says she rehearsed this and the rehearsal paid. She knows where she stands in the room tonight. Not the best. Close enough to make the conversation interesting.",
        "A good performance from {a}. Not the one that stops the panel — the one that makes the panel argue about placement. The craft is solid. The choices are deliberate. She walks away knowing she put something real on that stage.",
        "{a} brings a maxi performance that earns its place in the top half. The work is clean. The concept is clear. She prepared for this specific challenge and used the preparation well. She is not going anywhere tonight.",
        "The performance is good and {a} knows it is good. She finishes with the calm of somebody who does not need to ask how it went. The work answered the question. Strong. Skilled. Exactly aware of where she stands.",
      ]),
      tier('competent', 'She does the job. Nothing catches fire.', [
        "{a} does the challenge. Does it correctly. Does it on time. Does it without anything memorable happening in either direction. The maxi is competent and will sit in the safe pile — because that is where competence lives when excellence showed up to the same party.",
        "A workmanlike maxi from {a}. The brief was answered. The details were handled. The judges will struggle to say anything specific because there is nothing specific to say. It works. It is fine. Fine is its own verdict.",
        "{a} delivers what the challenge asked for and nothing it did not. The performance lands in the middle of the room. Most queens land there most weeks. It is both safe and invisible. She will have to decide which of those matters more.",
        "The maxi is done and {a}'s contribution is exactly what competent looks like. Present. Adequate. Indistinguishable from two other queens who also did the job without setting anything on fire. She survived. That is not the same as shining.",
      ]),
      tier('struggling', 'It is not working and she is still in the middle of it.', [
        "{a} is in the middle of the maxi and it is not working. She can feel it not working in real time. The concept was fine in her head. The execution is betraying it on camera. The gap between what she planned and what is happening gets wider with every beat.",
        "Something went wrong and {a} is still performing through the wrongness. The craft is there — she can sew, she can act, she can move. But tonight the craft is not converting into what the challenge asked for. The judges can see the gap between effort and result.",
        "{a} is struggling and it is visible. She catches herself. Recovers. Pushes through. But the damage is in the foundation and no amount of energy is going to fix a structure that is not holding. She finishes because she has to. \"It is what it is,\" she says backstage. It is.",
        "The maxi is getting away from {a}. She knows it. She is working harder than anybody on the stage and the work is not landing. Not a disaster — a disaster at least has the drama of a story. This is a slow failure. The judges watch with sympathy.",
      ]),
      tier('collapse', 'It comes apart, on camera, with nowhere to go.', [
        "It comes apart. {a} is on stage and the maxi is falling away from her in real time. The seam. The timing. The concept. There is nowhere to go. The cameras are rolling. The collapse IS the performance now. She stands in the wreckage of what she built.",
        "{a}'s maxi falls apart on camera. The construction fails, or the concept fails, or both fail at the same time. {a} is left on stage holding something that is no longer what she meant it to be. She does not stop. The not-stopping is heartbreaking.",
        "The collapse is total. Whatever she planned. Whatever she built. Whatever she rehearsed at her station until three in the morning — none of it survives contact with the stage. She finishes because there is no mechanism for not finishing. The walk off stage says everything.",
        "It falls apart. Not slowly. Not gracefully. Not in a way that can be saved with improv or charm. {a}'s maxi comes undone on the stage. The judges stop writing and just watch. The only thing left to judge is how she handles something nobody can handle well.",
      ]),
    ],
  },
  {
    id: 'performance-moment', step: 'maxi-perform', scope: 'per-queen', speaker: 'narrator',
    note: 'A single standout moment inside the performance. Fires only for a queen who had one.',
    tierBy: 'always',
    tiers: [tier('moment', 'The bit everybody will quote afterwards.', [
      "There is a moment — one moment — where {a} does something the room was not expecting. A choice. A gesture. A line delivery. A reveal. The panel sees it. The queens see it. For two seconds the challenge belongs entirely to {a}. That is the clip.",
      "{a} hits a beat in the maxi that lands differently from everything around it. The room shifts. One judge turns to the other. Whatever {a} just did — the commitment, the timing — that was the moment the performance stopped being good and started being something people talk about.",
      "The moment arrives and {a} does not waste it. A single beat in a long maxi. She finds it and lives inside it. The rest of the challenge is context. This is the thing. \"Did you see that?\" someone in the back row says. Everybody saw that.",
      "Something happens during {a}'s maxi that is better than the rest of the maxi. Everybody in the room can feel the difference. A moment — specific, brief, unrepeatable. {a} finds it the way performers find things. Not by planning. By being present enough that the moment finds her.",
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
