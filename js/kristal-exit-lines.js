// Every word of Kristal-talKs' in-season exit interviews.
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
// Composer: js/kristal-exit.js. Decisions: js/exit-interview/core.js.
//
// The user, 2026-10-21, on the first sketch: "too short and too repetitive,
// it's gonna become boring quickly." So the hour takes its shape from HOW they
// left (the kind) and HOW they are taking it (the mood), and the segments
// rotate. Answers are keyed by mood group:
//
//   hot  — bitter, denial       (it was done to them, or it wasn't real)
//   soft — gracious, relieved, elated
//   hurt — gutted               (it was somebody they loved)
//
// Rules for anyone adding lines: people talk. Whole sentences, the punchline
// last, no stacked fragments, no forced jokes. Say the name, not a pronoun —
// the guest's gender is not in hand here. A slot is only filled when the
// record has it; a line whose slot is empty is never picked.
//
// Pronouns: {sub} {obj} {pos} are the GUEST's (he/she/they only for a
// nonbinary guest — the user's rule), filled from the roster's gender.
//
// Slots: {guest} {week} {votes} {x} (the person this beat is about) {flippers}
// {suspect} {with} {partner} {a} {b} {c} {place} {players} {player} {exit}
// {caller} {quote}.

// ── the cold open, by kind ──────────────────────────────────────────────
export const COLD = {
  'first-boot': [
    'First one out. {guest} was {exit} in week {week}, and I don’t think the rest of the {players} learned how to spell that name. Let’s fix that.',
    'Somebody has to go first, and this season it was {guest}. Week {week}, {votes}. Let’s hear the version nobody got to air.',
    'Week {week}, and the first person through the door is sitting across from me. {guest}, welcome to Kristal-talKs.',
    'Nobody plans to be the first one {exit}. {guest} didn’t either. {votes}, week {week}, and here we are.',
  ],
  blindside: [
    '{guest} walked into that vote thinking it was somebody else’s night. It was {votes}. Week {week}. Let’s talk about it.',
    'If you watched week {week}, you saw {guest}’s face when the votes were read. I want to know what was going on behind it.',
    '{votes}. {guest} did not see it coming, and the people who did it were people {guest} trusted. We have a lot to get through.',
    'Week {week} had a blindside in it, and the person it landed on is in my studio. {guest}, how are you holding up?',
  ],
  'seen-it-coming': [
    '{guest} knew. Everybody knew. It still went {votes} in week {week}, and knowing doesn’t make it hurt less.',
    'Week {week}. {guest} sat on that block, campaigned, and went out {votes}. Let’s go through it.',
    'Some evictions are a surprise and some are a countdown. {guest}’s was a countdown. Week {week}, {votes}.',
    '{guest} is here, week {week}, {votes}. No blindside this time, just a house that had made up its mind.',
  ],
  backdoor: [
    '{guest} was never on the block until the veto made room. Week {week}, {votes}. That is a backdoor, and we’re going to talk about who opened it.',
    'Week {week}: {guest} went from safe to {exit} in about two days. {votes}. Pull up a chair.',
    'A backdoor needs a plan and a key. In week {week}, somebody had both, and {guest} was on the other side of the door.',
  ],
  walked: [
    '{guest} left on {pos} own terms in week {week}. Nobody voted, nobody pushed. This is the first time {guest} is telling it.',
    'There was no vote in week {week}. {guest} just decided it was over. I want to understand why.',
    'Week {week}, and {guest} walked out the door. Not {exit}, walked. Let’s talk about the last day in there.',
  ],
  expelled: [
    '{guest} didn’t get a vote in week {week}. Production made the decision. I have questions and so does everyone listening.',
    'Week {week} ended with {guest} removed from the game. {guest} is here to tell {pos} side, and I’m going to push.',
  ],
  medical: [
    '{guest} didn’t lose a vote in week {week}. {guest} lost the game to a doctor’s call. First of all, how are you?',
    'Week {week}, and {guest} had to leave for {pos} health. No strategy talk to start. Just how it happened.',
  ],
  showmance: [
    '{guest} is out, and {partner} is still in there. Week {week}, {votes}. I can already tell this one’s going to be emotional.',
    'Week {week}. {guest} got {exit} {votes}, and the person {guest} was falling for is still playing. Let’s talk about {partner}.',
    'Half a showmance is sitting in my studio. {guest}, week {week}, {votes}. {partner} is still in there.',
  ],
  double: [
    'Two {players} out in one night, {guest} and {with}. Week {week}, and {guest} is first in the chair.',
    'Week {week} took {guest} and {with} at once. {guest} goes first, and {with} gets an hour too.',
    'Double night in week {week}. {guest} and {with} left together, and only one of them is in my chair right now.',
  ],
  again: [
    'I’ve had {guest} in this chair before. {guest} got back in, and in week {week} got {exit} a second time. {votes}.',
    'Second time out, second time on the show. {guest}, week {week}, {votes}. Was it worth going back?',
  ],
  winner: [
    'The season’s over, and {guest} won it. This is the first conversation since the confetti.',
    '{guest} won. I need everyone to sit with that for a second, because {sub} did it the hard way.',
    'Finale night, and the winner is in my chair. {guest}, congratulations. Now tell me everything.',
  ],
  finalist: [
    'The season’s over. {guest} finished {place}. This is the first conversation since the lights came up.',
    '{guest} made it to the very last night and finished {place}. We have the whole season to go through.',
    'Finale night. {guest}, {place}. I have been waiting all season to ask you some of these.',
  ],
};

/** Said after the cold open when the guest is going to the jury. */
export const JUROR = [
  'One thing first: {guest} is on the jury, which means after tonight {guest} hears nothing until the finale. No podcast, no clips, nothing. So whatever gets said today, {guest} won’t hear the replies.',
  'And a reminder: {guest} is heading to the jury house after this. Anything the other {players} say about {guest} on this show, {guest} finds out at the finale.',
  'Quick note: as a juror, {guest} goes dark after this recording until the finale, so no answering back. Make it count.',
];

// ── the first question, by kind, and the answer by mood ─────────────────
export const OPEN_Q = {
  'first-boot': [
    'Walk me through the first few days. When did you know you were in trouble?',
    'First boot. Be honest, was it something you did, or something you never got a chance to do?',
    'You barely got started. Who were you, in there, before it all went wrong?',
  ],
  blindside: [
    'When they read the votes, what went through your head?',
    'Take me to the night before the vote. Who told you that you were safe?',
    'How sure were you, going into that room, that it wasn’t you?',
  ],
  'seen-it-coming': [
    'You knew for days. What does that week feel like from the inside?',
    'Was there a moment, any moment, where you thought you’d turned it around?',
    'If you knew it was coming, what did you do with the time?',
  ],
  backdoor: [
    'When the veto came off and the replacement went up, how fast did you realise it was you?',
    'You weren’t even nominated on Thursday. When did you work out what was happening?',
  ],
  walked: [
    'What was the moment you decided you were done?',
    'Do you regret walking out of there?',
  ],
  expelled: [
    'Tell me what happened, in your words.',
    'Do you think production made the right call?',
  ],
  medical: [
    'How are you feeling now?',
    'Did you fight to stay, or did you know it was time?',
  ],
  showmance: [
    'Let’s start with {partner}. How did you say goodbye?',
    'Do you trust {partner} to play without you?',
  ],
  double: [
    'You and {with} out on the same night. Did you see that coming?',
    'What was it like leaving with {with} beside you?',
  ],
  again: [
    'You got a second chance. What did you do differently, and what didn’t you?',
    'Going back in, who did you think you could trust?',
  ],
  finalist: [
    'How does it feel, right now, tonight?',
    'When did you first believe you could make it to the end?',
  ],
};

export const OPEN_A = {
  'first-boot': {
    hot: [
      'I didn’t get a week. I got four days and a bad first impression, and that’s not a game, that’s a coin toss.',
      'People decided who I was before I opened my mouth. I’d love to know where they got that from.',
      'Honestly? I don’t think I did anything. Somebody needed a name and mine was the easiest one to say.',
    ],
    soft: [
      'I came in too hot. I wanted everyone to like me on day one, and in that place that reads as a threat.',
      'Somebody has to go first. I just wish it hadn’t been me, because I had a whole plan I never got to use.',
      'I was still learning where the cups were. I didn’t understand how fast it moves until it moved past me.',
    ],
    hurt: [
      'I really thought I’d made friends. That’s the part I can’t get over, that I was wrong about all of them.',
      'I cried in the diary room on day two and I think everyone could tell. I wanted it so badly.',
    ],
  },
  blindside: {
    hot: [
      'I was angry before they finished reading. I knew exactly whose handwriting I was looking at.',
      'I had the votes. I counted them three times. Somebody lied to my face that afternoon and I want to know who.',
      'Honestly, I still think the count was wrong. I had promises from more than enough people.',
    ],
    soft: [
      'I laughed, honestly. It was such a good move that I couldn’t even be mad in the moment.',
      'I went numb. Then I thought, okay, they got me, and I respect it more than I want to.',
      'I hugged everyone on the way out because that’s who I am, even if half of them didn’t deserve it.',
    ],
    hurt: [
      'I looked straight at the people I trusted most, and none of them would look back. That’s when I knew.',
      'It wasn’t the vote. It was realising the people I’d have taken to the end had already let me go.',
    ],
  },
  'seen-it-coming': {
    hot: [
      'I spent four days campaigning to people who had already decided. They just let me keep talking.',
      'Everybody told me what I wanted to hear and then voted the way they were always going to.',
    ],
    soft: [
      'I knew, and I made my peace with it on Wednesday. I just wanted to go out with my head up.',
      'It’s strange, but knowing helped. I said everything I wanted to say before I left.',
      'I tried. I pitched to everyone, I didn’t burn anything, and the numbers just weren’t there.',
    ],
    hurt: [
      'Knowing didn’t make it easier. It meant I had a week to watch my friends decide I was the one.',
      'The worst part was seeing how relieved some of them looked when I said I understood.',
    ],
  },
  backdoor: {
    hot: [
      'That wasn’t a nomination, that was an ambush. Somebody had it planned before the veto was even played.',
      'I was safe on Thursday and gone by the vote. Somebody made a deal behind my back and I want names.',
    ],
    soft: [
      'Honestly, it was well played. I didn’t see it, and that’s on me for being comfortable.',
      'I knew the moment the veto came off. You can feel the room change when you’re the plan.',
    ],
    hurt: [
      'The person holding the veto told me I had nothing to worry about. I believed it, right up until I didn’t.',
    ],
  },
  walked: {
    hot: [
      'I wasn’t going to sit there and be treated like that for another week. I left before they could vote me out.',
      'They wanted me to break, and I didn’t give them the satisfaction of a vote.',
    ],
    soft: [
      'I just knew. I wasn’t myself any more, and no amount of money is worth not recognising yourself.',
      'It was the hardest decision I’ve ever made and I’d make it again. I needed to go home.',
    ],
    hurt: [
      'I miss it already, which is the stupid part. I walked out and I’d give anything to be back in there.',
    ],
  },
  expelled: {
    hot: [
      'It was blown out of proportion. Things get said in there, and I was the one they made an example of.',
      'I’m not going to pretend I was perfect, but the other side of that argument is still in the game.',
    ],
    soft: [
      'I crossed a line. I know I did, and I’ve apologised to the person it hurt.',
    ],
    hurt: [
      'I lost it, and I lost the game for it. I wish I could take that one minute back.',
    ],
  },
  medical: {
    hot: [
      'I wanted to stay. The doctors made the call, and I’ll always wonder what would have happened.',
    ],
    soft: [
      'I’m okay now, and that’s what matters. The game was going to end for me one way or another.',
      'My body made the decision before I did. I’m at peace with it.',
    ],
    hurt: [
      'I was doing so well. That’s what kills me. I was finally getting somewhere.',
    ],
  },
  showmance: {
    hot: [
      '{partner} is going to be fine. I’m worried about how many people in there will use me against {partner} now.',
      'They took me out to get to {partner}. Everyone in there knows it.',
    ],
    soft: [
      'I told {partner} to go win it. That’s all I said. I didn’t want to make it harder.',
      'We knew one of us would go first. I’m glad it was me, honestly.',
    ],
    hurt: [
      'I didn’t get to say a proper goodbye to {partner}. That’s the part I keep replaying.',
      'Leaving {partner} in there is the worst feeling I’ve ever had, and I’ve had a rough week.',
    ],
  },
  double: {
    hot: [
      'Two in one night means nobody has time to think, and the house took the cheap shot.',
      'A double is a chaos night, and they used the chaos to get rid of me without a campaign.',
    ],
    soft: [
      'It goes so fast. One minute you’re watching {with} go and the next it’s your name.',
      'Honestly, I’m glad I didn’t have to sit through a week of being the target.',
    ],
    hurt: [
      'Watching {with} leave and then going myself an hour later, I didn’t even have time to be sad for {with}.',
    ],
  },
  again: {
    hot: [
      'They were never going to let me stay. Coming back made me the target the second I walked in.',
      'Same people, same plan. I got back in and they picked up exactly where they left off.',
    ],
    soft: [
      'I got extra weeks most people never get. I’m grateful, even if it ended the same way.',
      'I played better the second time. It just wasn’t enough, and that’s okay.',
    ],
    hurt: [
      'I thought the second time would be different. I trusted the same people and got the same result.',
    ],
  },
  finalist: {
    hot: [
      'I played the best game out there, and I’m going to keep saying it until the jury believes me.',
      'Getting to the end means something. I’m not going to let anyone tell me it doesn’t.',
    ],
    soft: [
      'I’m exhausted and I’m proud. I didn’t think I’d see the last night, and I did.',
      'Every single week I was the underdog in my own head. I made it. I can’t stop smiling.',
      'I just want to sleep for a week and then watch every episode.',
    ],
    hurt: [
      'I’m proud, but I wanted that so badly. It’s going to take a while to feel anything else.',
    ],
  },
};

// ── the tape: who they suspected, and what the votes say ────────────────
export const TAPE_Q = {
  wrong: [
    'You think it was {suspect}. I watched the ballots. It was {flippers}.',
    'Here’s the thing. You keep saying {suspect}, but the people who wrote your name were {flippers}.',
    'I’m going to play you the votes, because I don’t think you know. {flippers} voted you out.',
  ],
  right: [
    'You said {suspect}, and you were right. {flippers} wrote your name. How does it feel to be right?',
    'Your read was good. {flippers} voted you out, just like you thought.',
  ],
  nosuspect: [
    'You don’t have a name for who did it. I do. {flippers}.',
    'You told me you have no idea who flipped. It was {flippers}.',
  ],
};
export const TAPE_A = {
  wrong: {
    hot: [
      'No. No way. {flippers}? I would have bet my life on {flippers}. I need a minute.',
      'Then I owe {suspect} an apology, and {flippers} owe me a lot more than that.',
      'That’s actually worse. I spent my last week fighting the wrong person.',
    ],
    soft: [
      'Wow. Okay. Good for {flippers}, honestly. That’s a move I didn’t see.',
      'I really thought it was {suspect}. Well, now I know who I underestimated.',
    ],
    hurt: [
      '{flippers}? We talked about the finale together. I’m not okay with that.',
      'I would never have guessed {flippers}. I don’t think I’ll be able to watch that episode.',
    ],
  },
  right: {
    hot: [
      'I knew it. I could see it on {flippers} all week, and nobody listened to me.',
      'Of course it was {flippers}. The worst liars in there, and I still couldn’t stop it.',
    ],
    soft: [
      'Good. At least my read was right, even if my game wasn’t.',
      'I’m almost relieved. It means I wasn’t crazy.',
    ],
    hurt: [
      'I knew, and I still hoped I was wrong about {flippers}.',
    ],
  },
  nosuspect: {
    hot: ['{flippers}. Okay. I’ll remember that at the finale.', 'I’m going to need to see that tape twice.'],
    soft: ['Fair enough. {flippers} played it better than I did.', 'Huh. I didn’t even have {flippers} on my list.'],
    hurt: ['{flippers}. I trusted {flippers} more than anyone.'],
  },
};

// ── a person named, by stance ───────────────────────────────────────────
export const NAMED_Q = {
  blame: [
    'Who do you hold responsible?',
    'Let’s talk about {x}. Did {x} put you there?',
    'If you had to put one name on it, would it be {x}?',
  ],
  respect: [
    'Let’s talk about {x}. You’re not angry?',
    'What do you make of {x}’s game now?',
  ],
  drag: [
    'Tell me about {x}.',
    'I noticed you rolling your eyes when I said {x}. Go on.',
    'What does everyone at home not know about {x}?',
  ],
  warn: [
    'What should people know about {x}?',
    'Is {x} as nice as {x} looks on TV?',
  ],
  praise: [
    'Who was your person in there?',
    'Tell me about {x}. It looked like a real friendship.',
  ],
  miss: [
    'Who are you going to miss?',
    'What do you want {x} to know?',
  ],
};
export const NAMED_A = {
  blame: {
    hot: [
      '{x}. Every road leads back to {x}. Nothing happens in that house without {x} touching it.',
      'It was {x}, and {x} will tell everyone it wasn’t. That’s exactly how {x} plays.',
      'I warned people about {x} for a week, and they voted me out instead. Enjoy that.',
    ],
    hurt: [
      'It was {x}, and that’s what hurts. I’d have done anything for {x}.',
      '{x} looked me in the eye and told me I was fine. I don’t know what to do with that.',
    ],
    soft: [
      'Probably {x}. I’m not even mad, it was smart.',
    ],
  },
  respect: {
    soft: [
      '{x} played a great game against me. I’d rather lose to someone like {x} than to a lucky one.',
      'Honestly, I’m rooting for {x}. That sounds strange, but {x} earned it.',
    ],
    hot: ['{x} is good. I hate how good {x} is.'],
    hurt: ['I respect {x}. I just wish it hadn’t been at my expense.'],
  },
  drag: {
    hot: [
      '{x} is the most fake person I have ever met, and I’ve met a lot of people.',
      '{x} talks about loyalty more than anyone in there and has the least of it.',
      'Everyone thinks {x} is playing a quiet game. {x} isn’t quiet, {x} is just hiding.',
      'I’m going to say it once: {x} is not who you think. Watch the next few weeks.',
    ],
    soft: [
      '{x} and I never clicked, and I think we both knew it from day one.',
      'I’ll be polite about {x}. It’s going to be hard.',
    ],
    hurt: [
      '{x} made my life miserable in there and smiled the whole time.',
    ],
  },
  warn: {
    soft: [
      'I’d keep an eye on {x}. {x} is a lot sharper than people give credit for.',
      'Be careful with {x}. I don’t think {x} is mean, but {x} is always counting.',
    ],
    hot: [
      'Watch {x}. That’s all I’ll say.',
      'If anyone in there is still trusting {x}, they’re next.',
    ],
    hurt: ['I hope {x} is kinder to the next person than {x} was to me.'],
  },
  praise: {
    soft: [
      '{x}, without question. {x} kept me sane in there.',
      '{x} is the real thing. If {x} wins, I’ll be the loudest one cheering.',
      'I’d trust {x} with my life outside of that house. Inside it, with most of my life.',
    ],
    hot: [
      '{x} was the only honest person in there. Everyone else can keep their apologies.',
    ],
    hurt: [
      '{x}. I already miss {x} more than I miss the game.',
    ],
  },
  miss: {
    hurt: [
      'I want {x} to know I’m not mad. I want {x} to keep going.',
      '{x}, I love you, win the thing. That’s all.',
      'I’ll miss {x} every single day. We talked every night until we fell asleep.',
    ],
    soft: [
      'I’ll miss {x}. We were going to make it to the end together.',
      '{x} was the best part of being in there.',
    ],
    hot: ['I’ll miss {x}. {x} is the only one I’ll miss.'],
  },
};

// ── answering back: what they heard was said about them ─────────────────
export const BACK_Q = [
  '{x} sat in this chair after week {week}. I have the clip. “{quote}”',
  'You’ve heard what {x} said about you on this show. For everyone else: “{quote}”',
  'Before we go on, I have to play you something {x} said in this chair. “{quote}”',
];
export const BACK_A = {
  drag: {
    hot: [
      'That’s rich, coming from {x}. Ask {x} about the conversation in the kitchen in week two.',
      '{x} can say what {x} wants from a podcast. I said it to {x}’s face in there.',
      'I heard it. I laughed. {x} still doesn’t get that everybody saw what {x} did.',
    ],
    hurt: ['That one stung. I thought {x} and I were okay.'],
    soft: ['{x} is allowed to be upset. I’d probably say the same thing.'],
  },
  warn: {
    hot: ['{x} should worry about {x}’s own game, which is over.'],
    hurt: ['I don’t know why {x} would say that. I never did anything to {x}.'],
    soft: ['Fair. I was careful around {x} too.'],
  },
  respect: {
    soft: ['I appreciate that, and I mean it. {x} played a clean game against me.', 'That’s classy of {x}. I’ll say the same thing back.'],
    hot: ['Respect is easy once you’re both out. I’ll take it, I guess.'],
    hurt: ['That means more than {x} knows.'],
  },
  praise: {
    soft: ['{x} said that? I’m going to cry. {x} was my favourite person in there.', 'That’s {x}. Kind even when there’s nothing to gain.'],
    hot: ['At least somebody in that house had manners.'],
    hurt: ['I miss {x}. Hearing that makes it worse, in a good way.'],
  },
  miss: {
    soft: ['I miss {x} too.'],
    hot: ['Yeah, well, {x} could have voted differently.'],
    hurt: ['We’re getting dinner the minute this is over. I miss {x} so much.'],
  },
};

// ── the segments ────────────────────────────────────────────────────────
export const FAN_Q = {
  warm: [
    'I have to read you one of these. “{guest} deserved so much better, that house doesn’t know what it lost.”',
    'The comments this week are mostly love. Somebody wrote, “{guest} was the only one I actually liked.”',
    'Listener mail. “Please put {guest} on another season immediately.”',
  ],
  mixed: [
    'Your mentions are split. Half say you got robbed, half say you saw it coming. One person just wrote “{guest} talked too much.”',
    'A listener asked me to ask you: “Do you think you played too safe?”',
    'Somebody wrote in: “{guest} was fun to watch, but did {guest} have a plan?”',
  ],
  cold: [
    'I’ll be honest, the fans are not kind this week. Top comment: “{guest} got exactly what {guest} deserved.”',
    'I’m going to read you one, and you’re not going to like it. “Bye {guest}, nobody will miss the attitude.”',
    'The internet has decided you were the villain. How do you feel about that?',
  ],
};
export const FAN_A = {
  hot: [
    'They saw an edit. They didn’t live it. I’m fine with being the villain if it means I told the truth.',
    'I’m not reading the comments, and now I definitely won’t.',
    'People at home have no idea what it’s like on day thirty with no sleep.',
  ],
  soft: [
    'That’s so kind. I really didn’t expect anyone to be in my corner.',
    'I’ll take it. Honestly, I needed to hear that today.',
    'I’ll read the bad ones too. They’re usually right about something.',
  ],
  hurt: [
    'That’s nice. It doesn’t make it hurt less, but it’s nice.',
    'I’m going to read every one of those tonight and cry.',
  ],
};

export const RANK_Q = [
  'Rank who’s left. Top three.',
  'Give me your power ranking, top three, no hesitating.',
  'Who’s running that game right now? Top three.',
];
export const RANK_A = [
  '{a}, {b}, then {c}. And {a} is a long way ahead.',
  'One: {a}. Two: {b}. Three: {c}, and that’s being generous.',
  '{a} first, easily. {b}, and then {c} by a whisker.',
];

export const MESSAGE_Q = [
  'You get one message into the house. Who’s it for?',
  'If {x} could hear you right now, what would you say?',
];
export const MESSAGE_A = {
  soft: ['{x}, keep your head down and win the next one. You’ve got this.', '{x}, I’m proud of you. Don’t trust the people who hug you the most.'],
  hot: ['{x}, open your eyes. The people around you are not your friends.', '{x}, they will do to you exactly what they did to me.'],
  hurt: ['{x}, I miss you. Please don’t give up because I’m gone.', '{x}, it’s not your fault. Keep going.'],
};

export const CALLER_IN = [
  'We have someone on the line. {caller}, you’re on Kristal-talKs.',
  'I said I had a surprise. {caller} is calling in.',
  'Somebody who knows exactly how this feels: {caller}, go ahead.',
];
export const CALLER_SAY = {
  warm: [
    '{guest}, welcome to the outside. It’s quieter out here, I promise.',
    'I just wanted to say I’m sorry it went that way. You were one of the good ones.',
  ],
  cold: [
    'I just want to know if you’re still telling people it was my fault.',
    'Hi {guest}. Remember week {week}? Because I do.',
  ],
};
export const CALLER_REPLY = {
  warm: ['{caller}! We need to get dinner. I mean it.', 'Thank you, {caller}. That really helps.'],
  cold: ['{caller}, you knew what you did. We both know.', 'Hello, {caller}. I see you’re still upset.'],
};

export const NEXT_Q = [
  'Who goes next?',
  'Next week’s eviction. One name.',
  'Who should be packing tonight?',
];
export const NEXT_A = {
  hot: ['{x}. And I’ll be watching.', '{x}, if there is any justice.'],
  soft: ['Probably {x}. The numbers are moving that way.', '{x}, I think, but I’ve been wrong before.'],
  hurt: ['I don’t want anyone to go. If I have to say, {x}.'],
};

export const PREDICT_Q = [
  'Who wins?',
  'Last one. Who takes it all?',
  'Give me a winner.',
  'If you had to bet your own money, who wins this season?',
];
export const PREDICT_A = {
  hot: ['{x}, and I hate saying it.', '{x}. Not because {x} deserves it, because nobody in there will stop {x}.'],
  soft: ['{x}. {x} has the best game in there and nobody’s noticed yet.', '{x}, and I’d be happy for {x}.', '{x}. Watch, you’ll see.'],
  hurt: ['I want it to be {x}. I really do.', '{x}. I’m rooting for {x} with everything I have.'],
};

export const CLOSE = {
  bitter: ['That’s {guest}. Not done being angry, and honestly, I don’t blame {obj}.', 'That was {guest}. I think a few people in that house will be hearing this one.'],
  denial: ['That’s {guest}, still not convinced it really happened. We’ll check in at the finale.'],
  gracious: ['That’s {guest}, taking it better than most would. Thank you for coming in.', '{guest}, everybody. Class act.'],
  relieved: ['That’s {guest}, home and sleeping in a real bed tonight. Good for you.'],
  gutted: ['Thank you, {guest}. Go get some rest. We’ll see you at the finale.', '{guest}, everybody. Be kind in the comments.'],
  elated: ['That was {guest}. What a night.', 'Congratulations, {guest}. Enjoy every second of this.'],
};

export const PLACE = { 1: 'first', 2: 'second', 3: 'third' };

// ── the debrief after the finale plays back the in-season prediction ────
// Slots: {week} {said} (who they picked) {winner}.
export const PLAYBACK_Q = {
  right: [
    'In week {week} you sat in this chair and told me {said} would win. {said} won. Take your bow.',
    'I have the tape from week {week}. You said {said}. You were right.',
  ],
  wrong: [
    'In week {week}, right here, you told me {said} would win. {winner} won. What happened?',
    'I’m going to play you week {week}. You said {said}. It was {winner}.',
    'You picked {said} in week {week}. Do you want to take that back now that {winner} has the money?',
  ],
};
export const PLAYBACK_A = {
  right: ['I called it. I want that on the record.', 'I knew in week {week} and I know now.', 'Nobody listened to me, and I was right.'],
  wrong: [
    '{said} had it, and then {said} didn’t. I still don’t understand how.',
    'Okay, I was wrong. {winner} played a better back half than any of us saw.',
    'Don’t play me that. I was very emotional that week.',
  ],
};
