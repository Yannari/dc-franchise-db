// ══════════════════════════════════════════════════════════════════════
// js/dr/data/reunion-beats.js — the season, talked through by the people who lived it
// ══════════════════════════════════════════════════════════════════════
//
// The reunion airs AFTER the finale (the user's call): the winner sits in
// her crown and the whole season is on the table. Every line is spoken —
// the host asks, a queen answers, someone on the sofa reacts — and every
// fact in a line is filled from what actually happened (js/dr/reunion.js):
// the episode, the challenge, the song, the look. No pool invents a moment.
//
// Placeholders: {a} the queen in the seat, {b} the other queen in it,
// {w} the winner, {ep} an episode number, {song} a lip sync song,
// {chal} a challenge, {cat} a runway category, {n} a count, {cast} how many.
//
// PLAIN ENGLISH. These are people talking on a sofa: say what happened, how
// it felt, move on. Nothing clever that has to be read twice.

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

  // ── THE HOT SEAT ──────────────────────────────────────────────────────
  'seat-first-host': [
    '"{a}, you were the first queen to go home this season. Episode {ep}, {song}. What was that like to watch back?"',
    '"{a}, first out. Episode {ep}, {song}. How are you doing, honestly?"',
    '"{a}, you walked in and you were the first to walk out. Let\'s talk about episode {ep}, and {song}."',
  ],
  'seat-first-answer': [
    '"Honestly? I watched it twice and I cried both times," {a} says. "I wish I had shown you who I am. I did not get the chance, and that is on me."',
    '"It was the worst week of my life," {a} says, "and the best thing that has ever happened to me. Both. At the same time."',
    '"I was so nervous I forgot my own name," {a} says. "I know what I would do differently. Give me another shot and you will see it."',
    '"People keep telling me being first out does not matter," {a} says. "It matters. But I am proud I was here at all."',
    '"I have watched every episode since," {a} says. "I cheered for all of you. Even the ones I did not like."',
    '"I went home and I got better," {a} says. "That is all I can do. You will see."',
  ],
  'seat-exit-host': [
    '"{a}, episode {ep}. You lip synced to {song} against {b}, and it did not go your way. Talk to me."',
    '"{a}, let\'s talk about {song}. You and {b}, episode {ep}. What happened on that stage?"',
    '"{a}, you went home in episode {ep}, to {song}. When you look back at that lip sync, what do you see?"',
  ],
  'seat-exit-answer': [
    '"I knew the words. I did not know what to do with them," {a} says. "{b} came to fight and I came to survive. You can see it."',
    '"I thought I had it," {a} says. "Then I watched it back and I did not have it. {b} deserved to stay that night."',
    '"I was tired," {a} says. "That is not an excuse, it is just the truth. By that week I had nothing left in the tank."',
    '"I would do that song differently now," {a} says. "More face, fewer spins. You live and you learn, on television."',
    '"I went into that lip sync scared," {a} says. "You cannot be scared on that stage. {b} was not scared of anything."',
    '"I had a plan for {song} and the plan went out of my head in the first ten seconds," {a} says. "After that I was just hoping."',
    '"Honestly, I was relieved," {a} says. "Is that terrible? I was exhausted, and I missed my own bed."',
    '"I was proud of that lip sync," {a} says. "It was not enough. But I was proud of it."',
    '"I should never have been in the bottom that week," {a} says. "But once I was there, {b} earned it."',
    '"I cried the whole way back to the hotel," {a} says. "Then I ordered a pizza and cried into that."',
  ],
  'seat-robbed-host': [
    '"{a}, episode {ep}, {song}. You won that lip sync against {b} and I still sent you home. Let\'s talk about it."',
    '"{a}, I know you have been waiting for this one. {song}, episode {ep}. Go ahead."',
  ],
  'seat-robbed-answer': [
    '"I won that lip sync," {a} says. "Everybody in this room knows I won that lip sync. I understand why you did it. I do not have to like it."',
    '"I was angry for a month," {a} says. "Then I watched the whole season, and I get it. But I left everything on that stage, and I would do it again."',
    '"Look at the tape," {a} says, and half the sofa laughs because they already have. "I am not bitter. I am just right."',
  ],
  'seat-finalist-host': [
    '"{a}, you made it all the way to the finale. When did you know you could win this?"',
    '"{a}, you were in the final. Walk me through the moment you realised you were a real threat."',
  ],
  'seat-finalist-answer': [
    '"Somewhere around the middle," {a} says. "I looked around the werk room and thought: I can do this. Then I tried very hard not to say it out loud."',
    '"I never knew," {a} says. "Every week I thought it was my last. I just kept not being wrong about that until the very end."',
    '"Honestly, the week I finally stopped trying to fit in," {a} says. "That was the night I started trying to win."',
  ],
  'seat-high-host': [
    '"And {chal}, episode {ep}. You won that. That was your night."',
    '"I have to bring up {chal}. You won it, and you won it big."',
  ],
  'seat-high-answer': [
    '"I still watch that episode when I have a bad day," {a} says. "That was me at my best, and I got to show you."',
    '"I did not sleep the night before," {a} says. "I did not sleep the night after either. For completely different reasons."',
    '"That was the week I believed I belonged here," {a} says. "Thank you for seeing it."',
  ],
  'seat-look-host': [
    '"Your {cat} look is still one of my favourites of the season."',
    '"I have to say it. That {cat} runway, episode {ep}. Stunning."',
  ],
  'seat-look-answer': [
    '"I made that in two nights on no sleep," {a} says. "I am so glad somebody noticed."',
    '"That look cost me more than my rent," {a} says. "Worth every cent."',
    '"Thank you," {a} says, and she is clearly delighted. "I almost did not bring it."',
  ],
  'seat-ally': [
    '"I just want to say {a} was the reason I got through that competition," {b} says from further down the sofa. "Everybody should know that."',
    '{b} reaches over and squeezes {a}\'s hand. "She deserved a lot more screen time than she got. That is all I am saying."',
    '"{a} is the kindest person in this room," {b} says. "Do not let the edit tell you otherwise."',
    '"When I was in the bottom, {a} was the one who helped me with my makeup," {b} says. "I never said thank you on camera. Thank you."',
    '"People did not see how funny {a} is off camera," {b} says. "She had the whole werk room crying laughing every morning."',
    '{b} leans forward. "{a} taught me how to pad properly. My hips owe her everything."',
  ],
  'seat-shade': [
    '"Mm-hm," {b} says, loud enough for the microphones. {a} turns around. "Something to add?" "No," {b} says. "Not yet."',
    '{b} laughs at the wrong moment and does not apologise for it. {a} lets it go for about two seconds. "You want to say that to my face?" "I just did," {b} says.',
    '"That is not how I remember it," {b} says. The host leans back. He has been waiting for someone to say that.',
    '"Well, she was very confident," {b} says. It is not a compliment, and {a} knows it is not a compliment.',
    '{b} does a slow clap from the end of the sofa. {a} does not turn around. "I can hear you, you know." "I know," {b} says.',
    '"I just think we remember that week very differently," {b} says. "Mine has more facts in it."',
  ],

  // ── THE FEUDS ─────────────────────────────────────────────────────────
  'feud-host': [
    '"{a}. {b}. I think it is time. Talk to each other."',
    '"There is one conversation this whole room has been waiting for. {a}, {b}, the floor is yours."',
    '"Episode {ep}. {a} and {b}. What happened?"',
  ],
  'feud-a': [
    '"You talked about me every single time I left the room," {a} says. "I know because people told me. People always tell you."',
    '"I was there to compete," {a} says. "You were there to compete with me. There is a difference."',
    '"I tried to be your friend," {a} says. "For about three days. Then I saw what you were doing."',
  ],
  'feud-b': [
    '"I said it to your face as well," {b} says. "Do not act like I was hiding it."',
    '"You made everything about you," {b} says. "Every challenge, every critique, every conversation in Untucked. It was exhausting."',
    '"I do not regret one thing I said," {b} says. "I regret how loud I said it. That is different."',
  ],
  'feud-a2': [
    '"Okay," {a} says. "Then let\'s be honest right now. Did you want me gone?" {b} does not answer straight away, and that is an answer.',
    '"You could have come to me," {a} says. "You never came to me once."',
    '"I watched it back and you were right about one thing," {a} says. "One. I will not tell you which."',
  ],
  'feud-host2': [
    '"Is there any way back from this? Either of you?"',
    '"Look at each other. Is this still worth it?"',
  ],
  'feud-cools': [
    'There is a long pause. Then {b} stands up, walks the length of the sofa and hugs {a}. It is awkward. It is real. The room exhales.',
    '"I am sorry," {b} says eventually, "for the Untucked thing." "I am sorry too," {a} says, "for everything else." They laugh, and it sounds like the start of something.',
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

  // ── THE CONTROVERSIES ─────────────────────────────────────────────────
  'robbed-host': [
    '"I know what you are all thinking. Episode {ep}. {a} won the lip sync to {song}, and {b} stayed. I made that call. Let\'s talk about it."',
    '"Episode {ep}. The call everybody still texts me about. {a}, {b}."',
  ],
  'robbed-stayed': [
    '"I know how it looked," {b} says. "I also know what I had done before that night. I was not going to apologise for staying."',
    '"I felt awful," {b} says. "I still feel awful. But I am not giving it back."',
    '"She beat me on that stage," {b} says. "Everybody can see it. I just tried to make that save worth it every week after."',
  ],
  'robbed-host-why': [
    '"When it is close, I look at the whole competition," the host says. "That night, the whole competition spoke. It was not about one song."',
    '"It was one of the hardest calls I have ever made," the host says. "And I stand by it. That is the job."',
  ],
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
