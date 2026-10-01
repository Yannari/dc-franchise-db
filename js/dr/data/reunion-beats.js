// ══════════════════════════════════════════════════════════════════════
// js/dr/data/reunion-beats.js — the season, talked through by the people who lived it
// ══════════════════════════════════════════════════════════════════════
//
// The reunion airs AFTER the finale (the user's call): the winner sits in
// her crown and the whole season is on the table. Every line is spoken —
// the host asks, a queen answers, someone on the sofa cuts in — and every
// fact in a line is filled from what actually happened (js/dr/reunion.js):
// the episode, the song, the challenge, the look, the thing she said in
// Untucked. No pool invents a moment.
//
// NOTHING REPEATS IN ONE REUNION. The first version gave every queen the
// same five-line seat from five-line pools, and a twelve-queen season read
// "the kindest person in this room" three times (the user: "kinda
// repetitive"). The engine never draws a line twice; a pool that runs dry
// drops its beat rather than reuse one, so the pools a seat draws from on
// every queen are written long.
//
// Placeholders: {a} the queen in the seat, {b} the other queen in it,
// {c} a third queen, {w} the winner, {ep} an episode number, {song} a lip
// sync song, {chal} a challenge, {cat} a runway category, {n} a count,
// {cast} how many, {rec} what happened between two queens, as the host says
// it to {a} ("you said in Untucked that she should go home").
//
// PLAIN ENGLISH. These are people talking on a sofa: say what happened, how
// it felt, move on. Nothing clever that has to be read twice.

/* WHAT HAPPENED BETWEEN TWO QUEENS, as somebody says it out loud. Keyed by
   the season's event type, said by the host TO the queen who did it ("you
   …"), with {t} the other queen. `by` is something players[0] did to
   players[1]; `pair` is something the two did to each other, so either can
   be asked about it. `said` marks a receipt that was WORDS, so only those
   are answered with "I said it because it was true". An event type
   not listed here is never brought up — the reunion only quotes what it can
   say correctly. */
export const RECEIPTS = {
  'untucked:who-should-go': { by: 'said in Untucked that {t} should go home, with her sitting right there', said: true, heat: 3 },
  'werk:idea-theft-accusation': { by: 'accused {t} of stealing your concept', said: true, heat: 3 },
  'untucked:the-whole-room-turns': { by: 'turned the whole of Untucked against {t}', said: true, heat: 3 },
  'werk:bottom-written-off': { by: 'wrote {t} off the week she was in the bottom', heat: 2 },
  'untucked:called-out-for-the-edit': { by: 'told {t} in Untucked she was playing to the cameras', said: true, heat: 2 },
  'werk:read-lands-wrong': { by: 'read {t} in the werk room and it went too far', said: true, heat: 2 },
  'sabotage': { by: "got in the way of {t}'s prep", heat: 3 },
  'stole-a-bit': { by: "took {t}'s bit", heat: 2 },
  'werk:copying-her-idea': { by: "changed your look to be closer to {t}'s", heat: 2 },
  'werk:fabric-hoard': { by: 'took the fabric {t} wanted off the wall', heat: 1 },
  'untucked:that-is-not-what-i-said': { by: 'repeated something {t} said, and not the way she said it', said: true, heat: 2 },
  'untucked:say-it-to-my-face': { pair: 'and {t} had it out in Untucked', said: true, heat: 3 },
  'untucked:not-going-easy': { pair: 'and {t} went for each other in Untucked before you lip synced', said: true, heat: 2 },
  'werk:rehearsal-collision': { pair: 'and {t} fought over the same idea in rehearsal', heat: 1 },
  'mini:did-her-dirty': { pair: 'and {t} styled each other in the mini challenge, and neither of you has let it go', heat: 1 },
};

export const REUNION_LINES = {
  // ── THE OPENING ───────────────────────────────────────────────────────
  'open-host': [
    '"Welcome to the reunion! The crown has been placed, the tears have dried, and the lace fronts have been glued back on. Tonight, we talk about all of it."',
    '"Ladies, welcome back. {w} has had the crown for a week now, and I hear it has not come off once."',
    '"Look at this room. {cast} queens, one season, and a whole lot of unfinished business. Let\'s get into it."',
    '"Welcome back, everybody. It has been a season, and every one of you made it one. Now let\'s find out what really happened."',
  ],
  'open-room': [
    'The whole cast is back on the sofas, the early exits at one end and the finalists at the other. {w} sits in the middle with the crown on, pretending not to notice everybody looking at it.',
    'Everybody is back, in the best drag they own. The queens who have not seen each other since the werk room hug like it has been years. Two of them very pointedly do not.',
    'The sofas fill up in the order they went home. {w} walks on last, crown and all, and the room gives her a standing ovation she tries to wave down and does not really mean it.',
  ],

  // ── THE SEASON IN NUMBERS ─────────────────────────────────────────────
  'numbers-host': [
    '"Before anybody starts, let\'s look at the numbers. The numbers do not lie, even when some of you do."',
    '"First, the season on paper. Brace yourselves."',
    '"Let\'s start with the facts, because in about five minutes nobody in this room is going to agree on any of them."',
  ],
  'numbers-most-btm': [
    '"I was in the bottom {n} times," {a} says. "I know that stage better than my own bed. And I am still here, talking to you."',
    '"That is {n} times," {a} says, and holds up the fingers. "Every one of those lip syncs, I thought it was over. It was not. Until it was."',
    '"The bottom and I had a relationship," {a} says. "We went on {n} dates. I would not call it healthy."',
  ],

  // ── THE FIRST ONES OUT ────────────────────────────────────────────────
  // A real reunion does not give a twenty-minute seat to the queen who left
  // in week one. They get a segment together, quick, and the room is warm.
  'early-host': [
    `"Let's start with the queens who did not get nearly enough time with us. {names}, I want to hear from you first."`,
    `"Some of you were not here long, but you were here. {names}. Let's talk."`,
    `"The first ones out. {names}. You went home early, and I still think about you."`,
  ],
  // QUESTION AND ANSWER TRAVEL TOGETHER. A loose question pool and a loose
  // answer pool gave "What have the fans been saying?" the answer "Panic."
  'early-qa': [
    { q: `"{a}, episode {ep}. {song}, against {b}. What went through your head when the music started?"`, a: [
      `"Panic," {a} says. "Pure panic. I knew every word of {song} the night before, and on that stage I knew about four of them."`,
      `"Mostly the words I was about to forget," {a} says. "I could see {b} warming up and I thought, oh no, she is going to do the splits."`,
    ] },
    { q: `"{a}, you went home in episode {ep}. Have you watched it back?"`, a: [
      `"Once," {a} says. "Through my fingers. {b} was so good that night, and I was just standing there with my mouth open."`,
      `"No," {a} says. "And I am not going to. I know how it ends."`,
    ] },
    { q: `"{a}, what did you do the day after you got home?"`, a: [
      `"I slept for a whole day," {a} says. "Then I got up and booked three gigs. Being on this show, even for a minute, changes your phone."`,
      `"Ate a whole pizza in bed," {a} says. "Then I started sketching my next look. I was not done."`,
    ] },
    { q: `"{a}, {song}. Do you still listen to that song?"`, a: [
      `"I cannot," {a} says, laughing. "It comes on in a shop and I have to leave the shop."`,
      `"Every day," {a} says. "I am taking it back. It is mine now."`,
    ] },
    { q: `"{a}, if you could go back to episode {ep}, what would you change?"`, a: [
      `"The whole week," {a} says, straight away. "I was behind from the moment the challenge was announced. The lip sync was just the ending."`,
      `"I would breathe," {a} says. "I was so busy trying to be perfect that I forgot to be any fun."`,
      `"Not the lip sync," {a} says. "I gave {b} a fight. I would change the week that put me there."`,
    ] },
    { q: `"{a}, what have the fans been saying to you since?"`, a: [
      `"They have been so kind," {a} says. "Kinder than I was to myself. One girl told me I was her favourite and I cried in a car park."`,
      `"That I deserved more time," {a} says. "I agree with them, for the record."`,
    ] },
  ],
  'early-sofa': [
    '"She was so funny on day one," {b} says. "The whole werk room was laughing. I was gutted when she left."',
    '"I still have the earrings she lent me," {b} says. "I am not giving them back, but I want you to know I have them."',
    '"You were robbed of time," {b} tells her. "Not of the lip sync. Of time. Everybody would have loved you."',
    '"She was the first person to talk to me when I walked in," {b} says. "I did not forget that."',
  ],

  // ── THE HOT SEAT: THE GENERIC EXIT ────────────────────────────────────
  'seat-exit-qa': [
    { q: `"{a}, episode {ep}. You lip synced to {song} against {b}, and it did not go your way. Talk to me."`, a: [
      `"I knew the words. I did not know what to do with them," {a} says. "{b} came to fight and I came to survive. You can see it."`,
      `"I went into that lip sync scared," {a} says. "You cannot be scared on that stage. {b} was not scared of anything."`,
      `"I had a plan for {song} and the plan went out of my head in the first ten seconds," {a} says. "After that I was just hoping."`,
    ] },
    { q: `"{a}, episode {ep}. You and {b}. Was that the right result?"`, a: [
      `"Yes," {a} says, and that surprises the room. "I hate saying it. {b} was better that night."`,
      `"No," {a} says, without a pause. "And I have watched it back eleven times to be sure."`,
      `"I thought it was the wrong result," {a} says. "Then I watched it back. It was the right one. I am still annoyed about it."`,
    ] },
    { q: `"{a}, you went out in episode {ep}. Were you surprised to be in the bottom that week?"`, a: [
      `"Surprised? I was furious," {a} says. "I thought I had done enough to be safe. Then I watched the episode and, well. I had not."`,
      `"I should never have been in the bottom that week," {a} says. "But once I was there, {b} earned it."`,
      `"Not really," {a} says. "I could feel it coming all week. You know when you know."`,
    ] },
    { q: `"{a}, {song}. Be honest. Did you know the words?"`, a: [
      `"I knew the words," {a} says. "I practised {song} in the hotel mirror every night that week. My body just did not get the message."`,
      `"Most of them," {a} says. "The ones I did not know, I mouthed with a lot of feeling."`,
    ] },
    { q: `"{a}, you and {b} on that stage, episode {ep}. Did you think you had won it?"`, a: [
      `"About halfway through, I looked at {b} and I knew," {a} says. "You can feel it on that stage. The room goes with one of you."`,
      `"For about thirty seconds, yes," {a} says. "Then {b} found the second verse and I lost her."`,
    ] },
    { q: `"{a}, you went home in episode {ep}, to {song}. When you look back at that lip sync, what do you see?"`, a: [
      `"I would do {song} differently now," {a} says. "More face, fewer spins. You live and you learn, on television."`,
      `"I was proud of that lip sync," {a} says. "It was not enough against {b}. But I was proud of it."`,
      `"A queen who was tired," {a} says. "By that week I had nothing left in the tank."`,
    ] },
    { q: `"{a}, take me back to episode {ep}. How did you feel walking out of that room?"`, a: [
      `"I cried the whole way back to the hotel," {a} says. "Then I ordered a pizza and cried into that."`,
      `"Honestly, I was relieved," {a} says. "Is that terrible? I was exhausted, and I missed my own bed."`,
    ] },
  ],
  'seat-exit-reply': [
    `"For the record, I was terrified of you that night," {b} says. "You just did not see it."`,
    `"I watched it back too," {b} says, "and I would not have wanted to be up against either of us."`,
    `"You made me work for it," {b} says. "Nobody else made me work for it the way you did."`,
    `{b} shakes her head. "I thought you had me in the second verse. I really did."`,
    `"I still think about that night," {b} says. "Neither of us deserved to be in the bottom."`,
  ],

  // ── THE HOT SEAT: SENT HOME AFTER WINNING THE SONG ───────────────────
  'seat-robbed-host': [
    '"{a}, episode {ep}, {song}. You won that lip sync against {b} and I still sent you home. Let\'s talk about it."',
    '"{a}, I know you have been waiting for this one. {song}, episode {ep}. Go ahead."',
    '"{a}. Episode {ep}. I owe you a conversation."',
    `"{a}, you won {song}. Episode {ep}. And you went home anyway. How long did it take you to forgive me?"`,
  ],
  'seat-robbed-answer': [
    '"I won that lip sync," {a} says. "Everybody in this room knows I won that lip sync. I understand why you did it. I do not have to like it."',
    '"I was angry for a month," {a} says. "Then I watched the whole season, and I get it. But I left everything on that stage, and I would do it again."',
    '"Look at the tape," {a} says, and half the sofa laughs because they already have. "I am not bitter. I am just right."',
    `"I am still working on it," {a} says, and smiles so the room knows she is half joking. Half.`,
    `"I knew the second the music stopped that I had won it," {a} says. "And I knew the second you looked at {b} that it was not going to matter."`,
  ],
  'robbed-stayed': [
    '"I know how it looked," {b} says. "I also know what I had done before that night. I was not going to apologise for staying."',
    '"I felt awful," {b} says. "I still feel awful. But I am not giving it back."',
    '"She beat me on that stage," {b} says. "Everybody can see it. I just tried to make that save worth it every week after."',
    `"I did not celebrate," {b} says. "I could not. I knew what everybody watching was going to say."`,
    `"I have said sorry to her a hundred times," {b} says. "It was not my call. But I have still said it."`,
  ],
  'robbed-host-why': [
    '"When it is close, I look at the whole competition," the host says. "That night, the whole competition spoke. It was not about one song."',
    '"It was one of the hardest calls I have ever made," the host says. "And I stand by it. That is the job."',
    `"I judged the whole season that night," the host says. "Not one song. I would make the same call again, and I would feel just as bad."`,
    `"The lip sync is a big part of it," the host says. "It is not all of it. That night, the rest of it mattered."`,
  ],

  // ── THE HOT SEAT: THE ONE WITH THE RECEIPTS ───────────────────────────
  'seat-villain-host': [
    '"{a}. You were not everybody\'s favourite this season. Episode {ep}: you {rec}. Do you want to explain that?"',
    '"{a}, I have a list. I will start with episode {ep}, when you {rec}."',
    '"{a}, a lot of people in this room have something to say to you. Let\'s start with episode {ep}. You {rec}."',
  ],
  'seat-villain-answer': [
    `"I came here to win, not to make friends," {a} says. "I made a few anyway. They are just not sitting near me."`,
    `"I watched it back and I did not love myself," {a} says, more quietly than anybody expects. "I was scared, and I get mean when I am scared."`,
    `"You edit a television show," {a} tells the host. "You know what you left out."`,
    `"It was a competition," {a} says. "I competed. I am not going to apologise for wanting it."`,
  ],
  'seat-villain-answer-said': [
    `"I said what everybody else was thinking," {a} says. "I was just the only one who said it with the cameras on."`,
    `"Was it kind? No," {a} says. "Was it true? Ask her how that week went."`,
  ],
  'seat-villain-victim': [
    `"It was not about winning," {b} says. "It was about you making sure I did not."`,
    `"I went home and cried about that," {b} says. "I am telling you so you know it landed."`,
    `"I am not even angry any more," {b} says. "I am just tired of hearing about it from my followers."`,
  ],
  'seat-villain-victim-said': [
    `"I would have respected it more if you had said it to me first," {b} says. "Instead I heard it on the episode."`,
  ],
  'seat-villain-back': [
    `"I hear you," {a} says. "And I am sorry. That part was not the competition. That part was me."`,
    `"You gave as good as you got," {a} says. "We just do not show your half."`,
    `{a} opens her mouth, closes it, and then says, "Fine. That was not my best week."`,
  ],
  'seat-villain-back-said': [
    `"Then I am sorry it landed like that," {a} says. "I am not sorry I said it."`,
  ],

  // ── THE HOT SEAT: SHE KEPT SURVIVING ─────────────────────────────────
  'seat-survivor-host': [
    '"{a}. {n} times in the bottom. You lip synced your way through this competition. Where does that come from?"',
    '"{a}, every time I thought you were done, you were not. How?"',
  ],
  'seat-survivor-answer': [
    '"Fear," {a} says. "Every time that music started I thought about my mother watching and I just did not want her to see me go home."',
    '"I grew up performing in bars where nobody was listening," {a} says. "A stage with people actually watching? That is a holiday."',
    '"I knew I was not the best seamstress in the room," {a} says. "So I made sure I was the best on that stage."',
  ],
  'seat-survivor-sofa': [
    '"Nobody wanted to be up against her," {b} says. "We all said it. In the werk room, every week: please, not her."',
    '"She sent me home," {b} says, "and I would still pay to watch her do it again."',
  ],

  // ── THE HOT SEAT: SHE WON BIG AND WENT HOME ──────────────────────────
  'seat-frontrunner-host': [
    '"{a}, you won {n} challenges. A lot of people had you as the winner. Then episode {ep} happened. What went wrong?"',
    '"{a}, {n} wins. When you went home in episode {ep}, I heard the gasp from the control room. What happened?"',
  ],
  'seat-frontrunner-answer': [
    '"I got comfortable," {a} says. "That is the honest answer. I stopped being scared of that week, and that week punished me for it."',
    '"I had one bad day," {a} says. "One. On this show, one bad day is all it takes."',
    '"I peaked," {a} says, and laughs. "I peaked early. Write it on my headstone."',
  ],
  'seat-frontrunner-sofa': [
    '"Every one of us breathed out when she went home," {b} says. "I am not proud of it. But we did."',
    '"I thought she was going to win," {b} says. "I still think she could have."',
  ],

  // ── THE HOT SEAT: WHERE WERE YOU? ─────────────────────────────────────
  'seat-quiet-host': [
    '"{a}, I have to be honest. We did not see a lot of you on television. Where were you?"',
    '"{a}, you were safe week after week. Was that a strategy?"',
  ],
  'seat-quiet-answer': [
    '"I was there," {a} says. "I was there every day. I was just sewing while everybody else was screaming."',
    '"It was a strategy for about two weeks," {a} says. "After that it was just how it went. I wish I had taken a bigger swing."',
    '"I was in my head," {a} says. "Everybody was so loud, and I thought, if I keep my head down, I will get through. I did. But nobody saw me get through."',
  ],
  'seat-quiet-sofa': [
    '"She was the funniest one backstage," {b} says. "The cameras just were not there for it."',
    '"She is the one who held the werk room together," {b} says. "She just does not do it loudly."',
  ],

  // ── THE HOT SEAT: THE FINALIST WHO DID NOT WIN ───────────────────────
  'seat-finalist-qa': [
    { q: `"{a}, you made it all the way to the finale. When did you know you could win this?"`, a: [
      `"Somewhere around the middle," {a} says. "I looked around the werk room and thought: I can do this. Then I tried very hard not to say it out loud."`,
      `"I never knew," {a} says. "Every week I thought it was my last. I just kept not being wrong about that until the very end."`,
    ] },
    { q: `"{a}, you were in the final. When did you realise you were a real threat?"`, a: [
      `"Honestly, the week I finally stopped trying to fit in," {a} says. "That was the night I started trying to win."`,
      `"When the others started being careful around me," {a} says. "Nobody is careful around somebody who is going home."`,
    ] },
    { q: `"{a}, the lip sync for the crown. {song}. How does it feel watching it back?"`, a: [
      `"I left everything on that stage," {a} says. "I can watch it back now without crying. Most of the time."`,
      `"I still think I had the second half," {a} says, and smiles. "I am allowed to think that."`,
    ] },
  ],

  // ── HER HIGH POINT ────────────────────────────────────────────────────
  'seat-high-host': [
    '"And {chal}, episode {ep}. You won that. That was your night."',
    '"I have to bring up {chal}. You won it, and you won it big."',
    '"Can we talk about {chal}? Episode {ep}. I am still thinking about it."',
    '"Before we move on, {chal}. You won that week, and you deserved it."',
    '"Episode {ep}, {chal}. Tell me about that win."',
    '"Let\'s give you your flowers. {chal}. What a week."',
  ],
  'seat-high-answer': [
    '"I still watch that episode when I have a bad day," {a} says. "That was me at my best, and I got to show you."',
    '"I did not sleep the night before," {a} says. "I did not sleep the night after either. For completely different reasons."',
    '"That was the week I believed I belonged here," {a} says. "Thank you for seeing it."',
    '"I called my best friend from the hotel and just screamed," {a} says. "No words. Just screaming."',
    '"Nobody expected that from me," {a} says. "Including me. Especially me."',
    '"I had to be talked into the idea," {a} says. "I nearly went safe. I am so glad I did not."',
  ],
  'seat-look-host': [
    '"Your {cat} look is still one of my favourites of the season."',
    '"I have to say it. That {cat} runway, episode {ep}. Stunning."',
    '"Episode {ep}. {cat}. You walked out and the panel went quiet. In a good way."',
    '"Can we talk about your {cat} look? Where did that come from?"',
    '"{cat}, episode {ep}. That look is still all over my phone."',
  ],
  'seat-look-answer': [
    '"I made that in two nights on no sleep," {a} says. "I am so glad somebody noticed."',
    '"That look cost me more than my rent," {a} says. "Worth every cent."',
    '"Thank you," {a} says, and she is clearly delighted. "I almost did not bring it."',
    '"My grandmother\'s curtains," {a} says. "She does not know yet. Please do not show her this episode."',
    '"I sketched it on a napkin two years ago," {a} says. "It took this show to make me finish it."',
  ],

  // ── SOMEBODY ON THE SOFA ──────────────────────────────────────────────
  'seat-ally': [
    '"I just want to say {a} was the reason I got through that competition," {b} says from further down the sofa. "Everybody should know that."',
    '{b} reaches over and squeezes {a}\'s hand. "She deserved a lot more screen time than she got. That is all I am saying."',
    '"{a} is the kindest person in this room," {b} says. "Do not let the edit tell you otherwise."',
    '"When I was in the bottom, {a} was the one who helped me with my makeup," {b} says. "I never said thank you on camera. Thank you."',
    '"People did not see how funny {a} is off camera," {b} says. "She had the whole werk room crying laughing every morning."',
    '{b} leans forward. "{a} taught me how to pad properly. My hips owe her everything."',
    '"She sat with me the night before my lip sync," {b} says. "She did not have to. She just did."',
    '"I would not be on this sofa without her," {b} says. "That is not a figure of speech."',
    '"Can I just say," {b} cuts in, "{a} is a star, and you are all going to see it."',
    '"{a} is the reason I did not quit in week three," {b} says. "She does not even know that. Now she does."',
  ],
  'seat-shade': [
    '"Mm-hm," {b} says, loud enough for the microphones. {a} turns around. "Something to add?" "No," {b} says. "Not yet."',
    '{b} laughs at the wrong moment and does not apologise for it. {a} lets it go for about two seconds. "You want to say that to my face?" "I just did," {b} says.',
    '"That is not how I remember it," {b} says. The host leans back. He has been waiting for someone to say that.',
    '"Well, she was very confident," {b} says. It is not a compliment, and {a} knows it is not a compliment.',
    '{b} does a slow clap from the end of the sofa. {a} does not turn around. "I can hear you, you know." "I know," {b} says.',
    '"I just think we remember that week very differently," {b} says. "Mine has more facts in it."',
    '{b} mouths something to the queen next to her. The camera catches it. The host asks her to say it out loud, and she does.',
    '"Funny," {b} says. "You were not that humble in the werk room."',
  ],
  'seat-receipt-host': [
    '"Before you get comfortable. Episode {ep}. You {rec}. {b} is sitting right there."',
    '"I would not be doing my job if I did not bring up episode {ep}. {a}, you {rec}."',
    '"There is one more thing. Episode {ep}, {a}. You {rec}."',
  ],
  'seat-receipt-qa': [
    { a: `"In my defence, it was a very long day," {a} says. Nobody accepts this defence.`, b: [
      `"It was a long day for all of us," {b} says. "Some of us managed."`,
    ] },
    { a: `"I have apologised for that," {a} says. "Privately. I will do it publicly too. {b}, I am sorry."`, b: [
      `"I accept," {b} says. "Slowly. But I accept."`,
      `"It is fine," {b} says, in a voice that makes it clear it is not fine.`,
    ] },
    { a: `"I did what I had to do to get through that week," {a} says. "I am not proud of it."`, b: [
      `"At least you can say that now," {b} says.`,
    ] },
    { a: `"We have talked about it since," {a} says, and looks at {b}. "Haven't we?"`, b: [
      `"We have," {b} says. "We are fine. Mostly."`,
    ] },
  ],
  'seat-receipt-qa-said': [
    { a: `"I meant every word at the time," {a} says. "I mean about half of it now."`, b: [
      `"Half is a start," {b} says.`,
    ] },
    { a: `"I stand by it," {a} says, and looks straight at {b}. "Somebody had to say it."`, b: [
      `"Somebody did not have to say it," {b} says. "Somebody chose to."`,
    ] },
  ],

  // ── THE ROOM ──────────────────────────────────────────────────────────
  'room-threat-host': [
    '"Quick question for the whole room. Who was the queen to beat this season?"',
    '"Everybody, be honest. Who were you scared of?"',
  ],
  'room-threat': [
    '"{b}," {a} says, without needing to think about it. "From the first week."',
    '"Honestly? {b}," {a} says. "Every time she walked in with a garment bag I wanted to go home."',
    '"{b}," {a} says. "And she knew it, which was the worst part."',
    '"Me," {a} says, and the room boos her. "Fine. {b}."',
    '"{b}. Next question," {a} says.',
  ],
  'room-threat-react': [
    '{b} puts a hand on her chest. "I had no idea. I was terrified the entire time."',
    '"I will take it," {b} says, and blows the sofa a kiss.',
    '{b} looks genuinely surprised. "Me? I thought I was going home every single week."',
  ],
  'room-stay-host': [
    '"Who do you wish had stayed longer?"',
    '"Who went home too soon?"',
  ],
  'room-stay': [
    '"{b}," {a} says. "We never got to see her real drag. She had so much more."',
    '"{b}, easily," {a} says. "The werk room got quieter when she left, and not in a good way."',
    '"{b}," {a} says. "I would have loved to see what she did with a few more weeks."',
    '"{b}," {a} says, and {b} blows her a kiss from the other end of the sofa.',
  ],
  'room-surprise-host': [
    '"And who surprised you?"',
    '"Who did you underestimate?"',
  ],
  'room-surprise': [
    '"{b}," {a} says. "I wrote her off in the first week, and she made me eat it."',
    '"{b}," {a} says. "She came in quiet and left loud."',
    '"{b}," {a} says. "I did not see her coming. None of us did."',
  ],

  // ── THE FEUDS ─────────────────────────────────────────────────────────
  'feud-host': [
    '"{a}. {b}. Episode {ep}: {a}, you {rec}. Talk to each other."',
    '"There is one conversation this whole room has been waiting for. Episode {ep}, {a}, when you {rec}. {b}, the floor is yours too."',
    '"Episode {ep}. {a} and {b}. {a}, you {rec}. What happened?"',
  ],
  'feud-a': [
    `"You talked about me every single time I left the room," {a} says. "I know because people told me. People always tell you."`,
    `"I was there to compete," {a} says. "You were there to compete with me. There is a difference."`,
    `"I tried to be your friend," {a} says. "For about three days. Then I saw what you were doing."`,
    `"I did what I did because I wanted to stay," {a} says. "You would have done the same."`,
  ],
  'feud-b': [
    `"You made everything about you," {b} says. "Every challenge, every critique, every conversation in Untucked. It was exhausting."`,
    `"I do not regret one thing I said to you," {b} says. "I regret how loud I said it. That is different."`,
    `"You know exactly what you did in episode {ep}," {b} says. "Do not make me say it again."`,
    `"I have watched episode {ep} more times than you have," {b} says. "It does not get better."`,
  ],
  'feud-a2': [
    '"Okay," {a} says. "Then let\'s be honest right now. Did you want me gone?" {b} does not answer straight away, and that is an answer.',
    '"You could have come to me," {a} says. "You never came to me once."',
    '"I watched it back and you were right about one thing," {a} says. "One. I will not tell you which."',
    '"I am not doing this for the cameras," {a} says. "I am doing this because I am actually hurt."',
  ],
  'feud-third': [
    '"Can I say something?" {c} says, and does not wait. "{b} is not the one who started it. I was there."',
    '"I was standing right next to you both," {c} says. "Neither of you is telling it the way it happened."',
    '"This is exactly what Untucked was like," {c} tells the host. "Every week. You are welcome."',
  ],
  'feud-host2': [
    `"Is there any way back from this? Either of you?"`,
    `"Can you two ever be friends?"`,
    `"Do you want to fix this?"`,
  ],
  'feud-cools': [
    'There is a long pause. Then {b} stands up, walks the length of the sofa and hugs {a}. It is awkward. It is real. The room exhales.',
    '"I am sorry," {b} says eventually, "for Untucked." "I am sorry too," {a} says, "for everything else." They laugh, and it sounds like the start of something.',
    '{a} holds out a hand. {b} looks at it for a second and then takes it. "Coffee," {b} says. "Not tonight. But coffee."',
  ],
  'feud-hardens': [
    '"No," {a} says. "And that is fine. We do not have to be friends." {b} nods. It is the first thing they have agreed on all season.',
    '{b} looks at the host and shrugs. "Some people you just do not click with." {a} is already looking the other way.',
    '"I wish her well," {b} says, in a voice that does not. The host moves on before anyone can throw a shoe.',
  ],

  // ── THE BONDS ─────────────────────────────────────────────────────────
  'friend-host': [
    '"Now, not everything this season was a fight. {a}, {b}, you two were inseparable."',
    '"{a} and {b}. The friendship of the season. When did it start?"',
  ],
  'friend-a': [
    '"The first week," {a} says. "She lent me lash glue when mine dried out. That was it. I was hers."',
    '"She sat next to me in the werk room and never moved," {a} says. "I did not ask. She just stayed."',
    '"I would not have made it through without her," {a} says. "I mean that. Not in the television way."',
  ],
  'friend-b': [
    '"We still talk every day," {b} says. "Every single day. Mostly about all of you."',
    '"She is my sister now," {b} says. "Drag gave me a lot of things. She is the best one."',
    '"She is the first person I called when I got home," {b} says. "Before my mother. Do not tell my mother."',
  ],
  'romance-host': [
    '"And then there were two of you who got a little closer than everybody else. {a}, {b}. Care to explain?"',
    '"I have to ask. {a} and {b}. What is going on?"',
  ],
  'romance-a': [
    '"It was a stressful competition," {a} says with a grin. "We found ways to relax." The sofa screams.',
    '"We are just friends," {a} says. {b} laughs so hard she has to put her drink down.',
    '"No comment," {a} says, and then looks straight at {b}. That is enough for the room.',
  ],
  'romance-b': [
    '"We are taking it slow," {b} says. "Slower than the lip syncs, anyway."',
    '"Next question," {b} says, and she is blushing through two layers of foundation.',
    '"Ask me again in six months," {b} says. "I will tell you everything."',
  ],

  // ── THE NIGHT NOBODY WENT HOME ────────────────────────────────────────
  'double-host': [
    '"And episode {ep}. {a} and {b}, and {song}. I could not send either one of you home."',
    '"Can we talk about the double shantay? Episode {ep}. {song}. I am still out of breath."',
  ],
  'double-answer': [
    '"I thought I had lost," {a} says. "When you said both, I did not hear the second word. {b} had to grab me."',
    '"That was the best night of the whole competition," {b} says. "We both knew it before you said anything."',
  ],

  // ── THE AWARDS ────────────────────────────────────────────────────────
  'award-host': [
    '"And now, the awards. Everybody sit up straight."',
    '"It is time to hand out some hardware. Some of it you will want. Some of it you will not."',
  ],
  'award-assassin': [
    '"I did not come here to lip sync," {a} says. "But if you put a song on, I will destroy it. Sorry to everyone I destroyed."',
    '"Every time I was in the bottom, I thought: this is my stage now," {a} says. "It kept working. I kept being in the bottom. Fair trade."',
  ],
  'award-look': [
    '"I am going to frame this," {a} says. "Next to the look. Next to the receipt for the look."',
    '"That look was everything I have ever wanted to say about myself," {a} says. "Without talking. Which, for me, is a miracle."',
  ],
  'award-boot': [
    '"I stand by that look," {a} says, holding the golden boot above her head. "History will prove me right."',
    '"I want to thank my glue gun," {a} says, and the whole sofa loses it, "which betrayed me."',
    '"I knew," {a} says. "The second I walked out, I knew. I just kept walking. That is called professionalism."',
  ],
  'award-congeniality': [
    '"I still cannot believe it," {a} says. "I was just being myself. Apparently that works."',
    '"I want to thank every person who voted," {a} says. "And everyone in this room who made it easy to be nice. Some of you made it harder."',
  ],

  // ── THE WINNER ────────────────────────────────────────────────────────
  'winner-host': [
    '"{w}. America\'s Next Drag Superstar. A week later, how does it feel?"',
    '"{w}, let\'s end where the season ended. What has changed this week?"',
  ],
  'winner-answer': [
    '"I have not slept," {w} says. "I keep waking up and checking the crown is still there. It is. Every time."',
    '"Everything and nothing," {w} says. "My phone has not stopped. My mother has not stopped crying. I am still the same person. Just shinier."',
    '"I keep thinking about the queen who walked in on day one," {w} says. "I wish I could tell her it works out. I would tell her to breathe more."',
    '"I called my mother from the car," {w} says. "She said she always knew. She did not always know. She told me to get a real job for ten years."',
  ],
  'winner-journey-host': [
    '"You won {n} challenges this season. Which one meant the most to you?"',
    '"That is {n} wins. When you look back at them, which one is yours forever?"',
  ],
  'winner-journey-answer': [
    '"{chal}," {w} says, without thinking about it. "That was the week I stopped being scared of you."',
    '"{chal}," {w} says. "I almost did not do it the way I did it. I am so glad I did."',
    '"Honestly? {chal}," {w} says. "That was the first night I thought I might actually win this."',
  ],
  'winner-runnerup-host': [
    '"{a}, you were so close. What is next for you?"',
    '"{a}, you were right there at the end. How are you doing?"',
  ],
  'winner-runnerup-answer': [
    '"I am so proud of {w}," {a} says. "And I am so proud of me. Both things can be true."',
    '"Second place on this show is still a career," {a} says. "Watch me."',
    '"I will be back," {a} says, smiling. "Do not make that face. You know I will be back."',
  ],
  'winners-double': [
    '"We are sharing everything now," {w} says. "The crown, the calendar, the group chat. It is a lot of crown for two wigs."',
    '"Two of us, one reign," {w} says. "We already had our first argument about who keeps the crown on Tuesdays."',
  ],

  // ── THE CLOSE ─────────────────────────────────────────────────────────
  'close-host': [
    '"That is our reunion, and that is our season. Thank you, every one of you. And remember: if you can\'t love yourself, how in the hell you gonna love somebody else?" "Amen!" "Now let the music play!"',
    '"Ladies, you gave me a season I will never forget. Thank you for your charisma, uniqueness, nerve and talent. If you can\'t love yourself, how in the hell you gonna love somebody else?" The sofa shouts the amen back.',
  ],
};
