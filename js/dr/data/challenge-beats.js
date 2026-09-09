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
        "\"Hello, hello, hello.\" Thirteen voices come back at once, ragged and delighted. Somebody at the back is already clapping for no reason. She waits for it to die down. They know she is about to change the shape of their week.",
        "She comes in the way she always comes in — like the room was already hers and she has just been elsewhere for a while. Every queen straightens up without deciding to. \"I have news.\" Whatever anybody was arguing about ninety seconds ago is over.",
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
        "Nobody is paired. Nobody is grouped. Solo means the best version of yourself wins and the worst version goes. No buffer. No partner. No excuse. \"Good,\" {a} says. She means it. Probably.",
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
      tier('first-pass', 'She has it after one run and spends the rest of the day helping.'),
      tier('got-there', 'It takes the afternoon and by the end of it she has the number.'),
      tier('behind-the-count', 'She is a half-count late all day and she knows it.'),
      tier('still-counting', 'The room moves on without her. She is mouthing numbers.'),
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
      tier('got-it-on-tape', 'The take is better than the verse. He found something in her.', [
        "The verse on paper was fine. The verse on tape is better. The producer heard something in {a}'s delivery that she did not know was there — a tone, a rhythm, a way of landing the punchline — and he pulled it out in three takes. What the panel hears tonight is a recording that is more confident than the queen who made it.",
        "{a} sits down in the booth and the producer plays the track. First take: shaky. Second take: closer. Third take: the producer nods and {a} knows that nod means the bar she was worried about just landed. The tape is better than the page. The tape is what the panel hears.",
        "The booth session rescues her. {a} walked in with a verse that read well and did not sing well, and the producer spent thirty minutes finding the version of it that does both. What lands on the track is a verse {a} did not know she had in her until somebody who records voices for a living heard it.",
        "The producer finds the verse inside {a}. Not the one she wrote — the one she can deliver. He adjusts her timing on the second bar, smooths a vowel on the third, and by take four the recording sounds like a queen who has been doing this. She has not. The booth made it sound like she has.",
      ]),
      tier('clean-session', 'In, done, out. No drama and no rescue needed.', [
        "{a} walks into the booth, puts on the headphones, and records her verse. Three takes. The producer nods on the third. No drama. No rescue. No thirty-minute crisis that costs the queens behind her their warm-up time. In, done, out.",
        "A clean session. {a} knows her verse, she can say it on rhythm, and the producer has nothing to fix. He records three takes, picks the best one, and {a} is out of the booth in twelve minutes. The queens waiting outside do not even look up.",
        "The booth is uneventful. {a} goes in, delivers her bars, takes one note from the producer about a breath in the second line, and records the corrected version. Done. The tape sounds exactly like the verse she wrote, which is all a clean session needs to be.",
        "{a}'s session is quick and professional. She knows the words. She can say them on the beat. The producer records her, plays it back once, and sends her out. Some queens need the booth to save them. {a} needed it to document what she already had.",
      ]),
      tier('many-takes', 'They get it eventually, and everybody knows how long it took.', [
        "It takes nine takes. The producer is patient — he does this — but {a} can hear the patience shifting from encouraging to professional. The verse is there. The delivery keeps not being there. Take nine lands and the producer says \"that one\" and {a} leaves the booth knowing everybody heard how long she was in it.",
        "{a}'s session runs long. The first three takes are shaky. The next three are overcorrecting. The producer stops her, resets, talks her through the timing, and by take eight they have something usable. Not great. Usable. The queens waiting outside have been waiting long enough to notice.",
        "The booth takes longer than it should. {a} knows the verse but she cannot get it on tape — the headphones throw her off, the track is faster than she rehearsed, and the producer keeps resetting. They get there eventually. The eventually is the part {a} will remember.",
        "Take after take. The producer stays calm. {a} stays less calm. The verse is real — she wrote something — but the recording session is turning a good verse into a nervous one, and every extra take makes the next one more nervous. They land on a take that works. It is not the take she wanted.",
      ]),
      tier('could-not-get-it', 'She wrote it and she cannot sing it. The tape is what the panel hears.', [
        "{a} wrote a verse. A real one — bars that hit on paper. She cannot get them on tape. The producer tries everything: slower tempo, different breath marks, punching in one bar at a time. The recording they settle on is the best of twelve bad takes. The panel hears the best of twelve bad takes.",
        "The booth breaks her. {a} can say her verse at a mirror. She cannot say it into a microphone with a track playing in her ears and a producer watching her mouth. Every take is worse than the one before. The tape they use is the first one, because the first one had the confidence the rest of them lost.",
        "{a} cannot get her verse on tape. The bars scan when she reads them. They do not scan when she records them. The producer gives her note after note and {a} takes none of them because taking a note requires calm and calm left the booth four takes ago. What the panel hears tonight is the version without calm.",
        "She wrote it. She cannot sing it. The distinction is the whole session. {a} has four bars that read well on paper and fall apart the moment she tries to deliver them at tempo into a microphone. The producer cannot rescue what is not there. The tape captures the gap between writing and performing, and the panel hears the gap.",
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
        "{a} gets the lead. She did not ask for it. She did not campaign for it. The host read her name off the cast list and the room looked at her the way a room looks at somebody who just got handed a thing she cannot give back. The video belongs to {a} now. If it works, she carried it. If it does not, she sank it.",
        "The host names {a} as the lead and the room recalibrates. The lead is the most screen time, the most pressure, and the most exposure if the video falls apart. {a} did not volunteer. She was cast. The difference between choosing the lead and being given it is the difference between confidence and obligation.",
        "{a} is handed the whole video. Not a section. Not a verse. The part the camera follows, the part the edit is built around, the part the panel will judge the hardest because it had the most to work with. She did not raise her hand. The host raised it for her.",
        "The lead goes to {a}. The room hears it and does the maths: she has been safe for weeks, the host just bet on her in front of everybody, and the part she was given is the one that can either make this a win week or a bottom week. There is no middle on a lead.",
      ]),
      tier('featured', 'A real part, and the pressure that comes with being named.', [
        "{a} gets a featured part. Not the lead, not the background — a named role with screen time and a moment the camera has to find. It is enough to stand out on if she uses it. It is enough to flop on if she does not. The host read her name and the room heard it.",
        "The host casts {a} in a featured role. A real part — scenes, close-ups, a section of the video that belongs to her. Not the pressure of the lead but not the anonymity of the ensemble. Enough rope to impress. Enough rope to hang.",
        "{a} is given a featured part. She has material to work with — the kind of material that shows up in the edit, the kind the panel notices. Whether the panel notices it for the right reasons is on her. The part is enough. The part was always going to be enough.",
        "A featured role for {a}. The host names her and moves on. The part has screen time, it has a moment, and it has exactly enough weight that flopping it would be her fault and nailing it would be her credit. That is what featured means.",
      ]),
      tier('standard', 'Something to do, and nothing that will carry her.', [
        "{a} gets a standard part. Something to do on camera. Not the lead. Not the feature. A role that exists in the video and will not carry her to the top or sink her to the bottom unless she makes it do one of those things herself.",
        "The host reads {a}'s part and it is fine. A standard role — present in the video, not the centre of it. She has scenes. She has camera time. None of it will distinguish her unless she finds something in it the host did not put there.",
        "{a} is cast in the middle of the call sheet. Not the part with the pressure and not the part with the anonymity. Standard. She will be in the video. Whether she will be IN the video is a different question and the answer depends entirely on what she does with a role that asks for competence and rewards initiative.",
        "A standard part. {a} hears it and nods. The role is what it is — enough to work with, not enough to coast on. Queens with standard parts survive the video by being better than the part. Queens with standard parts go home by being exactly as forgettable as the part allows.",
      ]),
      tier('ensemble', 'The back of the frame. She has to make herself findable.', [
        "{a} gets the ensemble. The back of the frame. The part the camera finds last and the edit uses least. She is in the video the way furniture is in a room — present, functional, and invisible unless somebody decides to look. The entire challenge for {a} is making somebody decide to look.",
        "The host casts {a} in the ensemble and moves on before the word has landed. Ensemble is the back of the video. The camera will not find her. The director will not build a setup around her. If she wants to exist in the final cut, she has to make herself findable.",
        "{a} is given the ensemble. The polite word for the background. She has no featured moment, no close-up, no scene the edit is built around. She is in the video the same way every other background queen is in the video — unless she gives the camera a reason to come back to her.",
        "Ensemble. {a} hears the word and knows what it means: she is starting this challenge behind everybody who got a name on the call sheet. The camera will not come to her. She has to go to the camera. Queens have stood out from the ensemble before. Queens have also disappeared into it.",
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
    note: 'Her hours in front of the director, and what he will tell the panel.',
    tierBy: 'impression',
    tiers: [
      tier('made-the-day', 'He starts building the video around her.', [
        "The director starts building the video around {a}. She takes the first note, delivers the first take, and by the third setup he is adjusting the shot list to give her more screen time. He does not tell her this. He tells the panel. The panel hears that {a} made a director change his plan to put more of her in the edit.",
        "{a} makes the day easy. The director gives her a note and she takes it the first time. He asks for something she did not rehearse and she delivers it. By lunch he is adding setups for her — not because the call sheet says so, but because the footage he is getting from {a} is better than the footage he planned for.",
        "The director loves working with {a}. She finds the camera, she reads the note, she gives him takes he can use. By the afternoon he is building extra shots around her because the material is too good to leave on the floor. What he tells the panel is what he has been telling the crew all day: she is the one.",
        "{a} is the queen the director remembers at the end of the day. Not because she had the biggest part — because she used the part she had so well that the edit expanded around her. She took direction. She found the lens. She gave him more than the call sheet asked for. The panel will hear all of it.",
      ]),
      tier('easy', 'She takes the note, gives him the take, and he moves on.', [
        "{a} takes the note and gives the director what he asks for. No drama. No crisis. He sets up the shot, she hits her mark, he calls cut, and they move on. A clean day. The director will not single her out to the panel, but he will not flag her either. That is what easy looks like.",
        "The director gives {a} a note and she takes it. First try. He moves to the next setup. {a}'s day on set is professional and uncomplicated — she does what the camera needs, she listens when the director talks, and she does not make the day longer than it has to be.",
        "{a}'s session with the director is straightforward. He tells her what the shot needs. She adjusts. He gets his take in two or three attempts and moves on. Not the queen the director will rave about to the panel, but not the one he will warn them about either.",
        "A clean day for {a}. The director sets up, {a} performs, the director moves on. She is not the queen making the day and she is not the queen costing the day. She is the queen doing the work — taking the note, finding the mark, giving the take.",
      ]),
      tier('slow', 'They get there. Getting there takes most of the afternoon.', [
        "The director and {a} get there. It takes time. Every note requires two or three tries to land. The camera finds her eventually but not on the first setup, and the director's patience shifts from generous to professional somewhere around the sixth take. They finish. They did not finish quickly.",
        "{a}'s day on set is long. The director gives her a note about scale — smaller for the lens — and {a} gives him a stage performance. They do it again. Smaller. Again. By the time the take lands, the crew has been watching the same setup for forty minutes and the director is behind schedule.",
        "The director spends most of the afternoon on {a}. Not because the footage is good — because the footage keeps not being right. She takes the note eventually. The take eventually lands. But eventually is the word the director uses when the panel asks how her day went, and it is not a compliment.",
        "{a} is slow. Not bad — slow. The director gives notes and she processes them at a pace that costs the day its margin. By the time her footage is usable, the setups behind her are rushed. The director does not blame her to the panel. He describes the day. The description is enough.",
      ]),
      tier('argued', 'She was asked for something and told him no, in front of the crew.', [
        "{a} argues with the director. On set. In front of the crew. He asks her to play it smaller and she tells him no — her version is better. The director stops arguing before she does. He shoots around her. What the panel hears is not that she was bad. It is that she was difficult, and on a video challenge the director's word is evidence.",
        "The director gives {a} a note and {a} gives it back. She does not want to play it that way. She tells him so. The crew watches a queen argue with a director in front of a camera, and the camera is still running. What the panel hears about {a}'s day is the argument, not the performance.",
        "{a} was asked for something and said no. Not politely, not quietly — in front of the crew, on a set, while the camera was rolling. The director's note was about scale: play it smaller for the lens. {a}'s answer was to play it bigger. The director stopped giving the note and started building the edit without her.",
        "The director and {a} disagree. The disagreement happens on camera, in front of the crew, on a set where the director is the authority and {a} is the talent. She tells him his note is wrong. He tells the panel she was the hardest part of the day. Both of them mean it.",
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
