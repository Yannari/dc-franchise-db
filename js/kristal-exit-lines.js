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
// THE FIRST SEASON READ (three seeded Big Brother seasons, 2026-10-21) found:
// questions that asked for a name answered by lines that gave none ("Who told
// you that you were safe?" / "I hugged everyone on the way out"), so every
// question in a bank must fit every answer in its bank; lines about somebody
// still playing ("watch the next few weeks") said about people already out, so
// those live in NAMED_IN and are only drawn while the person is still in the
// game; and banks of two lines, which a season of ten interviews exhausts by
// week four. Keep every bucket a season can draw from at five or more.
//
// Rules for anyone adding lines: people talk. Whole sentences, the punchline
// last, no stacked fragments, no forced jokes. Use names; a pronoun for the
// guest only through {sub} {obj} {pos} (he/she, and they only for a nonbinary
// guest — the user's rule). A line whose slot is empty is never picked.
//
// A line opening "[J]" is a juror's only ("my jury vote"); the marker is stripped.
//
// Slots: {guest} {week} {votes} {x} (the person this beat is about) {flippers}
// {suspect} {with} {partner} {a} {b} {c} {place} {players} {player} {exit}
// {caller} {quote} {sub} {obj} {pos}.

// ── the cold open, by kind ──────────────────────────────────────────────
export const COLD = {
  'first-boot': [
    'First one out. {guest} was {exit} in {when}, and I don’t think the rest of the {players} learned how to spell that name. Let’s fix that.',
    'Somebody has to go first, and this season it was {guest}. {when}, {votes}. Let’s hear the version nobody got to air.',
    '{when}, and the first person through the door is sitting across from me. {guest}, welcome to Kristal-talKs.',
    'Nobody plans to be the first one {exit}. {guest} didn’t either. {votes}, {when}, and here we are.',
    'The first {exitNoun} of the season is always the cruellest. {guest} got it, {votes}, and {sub} came straight here.',
  ],
  blindside: [
    '{guest} walked into that vote thinking it was somebody else’s night. It was {votes}. {when}. Let’s talk about it.',
    'If you watched {when}, you saw {guest}’s face when the votes were read. I want to know what was going on behind it.',
    '{votes}, and {guest} did not see it coming. Some of those votes came from people {guest} trusted, and we’re going to name them.',
    '{when} had a blindside in it, and the person it landed on is in my studio. {guest}, how are you holding up?',
    '{guest} thought the numbers were there. They weren’t. {when}, {votes}, and a lot of questions.',
    'There’s getting {exit}, and there’s what happened to {guest} in {when}. {votes}. Pull up a chair.',
  ],
  'seen-it-coming': [
    '{guest} knew. Everybody knew. It still went {votes} in {when}, and knowing doesn’t make it hurt less.',
    'Some {exitNoun}s are a surprise and some are a countdown. {guest}’s was a countdown. {when}, {votes}.',
    '{guest} is here, {when}, {votes}. No blindside this time. {guest} saw it coming for days.',
    '{when}, {votes}. {guest} spent days as the target, and {sub} is going to tell us what that was like.',
  ],
  backdoor: [
    '{guest} was never on the block until the veto made room. {when}, {votes}. That is a backdoor, and we’re going to talk about who opened it.',
    '{when}: {guest} went from safe to {exit} in about two days. {votes}. Pull up a chair.',
    'A backdoor needs a plan and a key. In {when}, somebody had both, and {guest} was on the other side of the door.',
    '{guest} watched the veto come off and the replacement go up. {when}, {votes}. This one was planned.',
  ],
  walked: [
    '{guest} left on {pos} own terms in {when}. Nobody voted, nobody pushed. This is the first time {guest} is telling it.',
    'There was no vote in {when}. {guest} just decided it was over. I want to understand why.',
    '{when}, and {guest} walked out the door. Not {exit}, walked. Let’s talk about the last day in there.',
  ],
  expelled: [
    '{guest} didn’t get a vote in {when}. Production made the decision. I have questions and so does everyone listening.',
    '{when} ended with {guest} removed from the game. {guest} is here to tell {pos} side, and I’m going to push.',
  ],
  medical: [
    '{guest} didn’t lose a vote in {when}. {guest} lost the game to a doctor’s call. First of all, how are you?',
    '{when}, and {guest} had to leave for {pos} health. No strategy talk to start. Just how it happened.',
  ],
  showmance: [
    '{guest} is out, and {partner} is still in there. {when}, {votes}. I can already tell this one’s going to be emotional.',
    '{when}. {guest} got {exit} {votes}, and the person {guest} was falling for is still playing. Let’s talk about {partner}.',
    'Half a showmance is sitting in my studio. {guest}, {when}, {votes}. {partner} is still in there.',
  ],
  double: [
    'Two {players} out in one night, {guest} and {with}. {when}, and {guest} is first in the chair.',
    '{when} took {guest} and {with} at once. {guest} goes first, and {with} gets an hour too.',
    'Double night in {when}. {guest} and {with} left together, and only one of them is in my chair right now.',
  ],
  again: [
    'I’ve had {guest} in this chair before. {guest} got back in, and in {when} got {exit} a second time. {votes}.',
    'Second time out, second time on the show. {guest}, {when}, {votes}. Was it worth going back?',
  ],
  winner: [
    'The season’s over, and {guest} won it. This is the first conversation since the confetti.',
    '{guest} won. I need everyone to sit with that for a second, because {sub} did it the hard way.',
    'Finale night, and the winner is in my chair. {guest}, congratulations. Now tell me everything.',
  ],
  finalist: [
    'The season’s over. {guest} finished {place}. This is the first conversation since the lights came up.',
    '{guest} made it to the very last night and finished {place}. We have the whole season to go through.',
    'Finale night. {guest}, {place}. I have been waiting all season to ask some of these.',
  ],
};

/** Said after the cold open when the guest is going to the jury. */
export const JUROR = [
  'One thing first: {guest} is on the jury, which means after tonight {guest} hears nothing until the finale. No podcast, no clips, nothing. So whatever gets said today, {guest} won’t hear the replies.',
  'And a reminder: {guest} is heading to the jury after this. Anything the other {players} say about {guest} on this show, {guest} finds out at the finale.',
  'Quick note: as a juror, {guest} goes dark after this recording until the finale, so no answering back. Make it count.',
  '{guest} has a jury vote now, by the way, and goes into sequester tonight. Everyone still playing should be a little nervous.',
];

// ── the first question, by kind, and the answer by mood ─────────────────
// Every question here fits every answer in the same kind.
export const OPEN_Q = {
  'first-boot': [
    'First boot. Be honest, was it something you did, or something you never got a chance to do?',
    'What went wrong, as fast as it went wrong?',
    'Take me through those first few days.',
    'How does it feel to be the first one out?',
  ],
  blindside: [
    'When they read the votes, what went through your head?',
    'Walk me through the moment they read the votes.',
    'What was the first thing you felt when it wasn’t the other name?',
    'Talk me through that vote.',
    'How are you, honestly, after that?',
  ],
  'seen-it-coming': [
    'You knew for days. What does that week feel like from the inside?',
    'What did you do with the time, once you knew?',
    'Was there any part of you that still thought you’d stay?',
    'How do you sit there when everyone has already decided?',
  ],
  backdoor: [
    'When the veto came off and the replacement went up, what went through your head?',
    'Talk me through the veto meeting.',
    'How fast did you work out it was a backdoor?',
  ],
  walked: ['What was the moment you decided you were done?', 'Do you regret walking out of there?', 'Take me through the last day.'],
  expelled: ['Tell me what happened, in your words.', 'Do you think production made the right call?'],
  medical: ['How are you feeling now?', 'Did you fight to stay, or did you know it was time?'],
  showmance: ['Let’s start with {partner}. How did you say goodbye?', 'Do you trust {partner} to play without you?', 'What happens with {partner} now?'],
  double: ['You and {with} out on the same night. What was that like?', 'How fast did that double night go, from the inside?'],
  again: ['You got a second chance. What did you do differently, and what didn’t you?', 'Was it worth going back in?'],
  finalist: ['How does it feel, right now, tonight?', 'Take me through the last week.', 'What is the first thing you want to do now?', 'How are you feeling?'],
};

export const OPEN_A = {
  'first-boot': {
    hot: [
      'I didn’t get a week. I got four days and a bad first impression, and that’s not a game, that’s a coin toss.',
      'People decided who I was before I opened my mouth. I’d love to know where they got that from.',
      'Honestly, I don’t think I did anything. Somebody needed a name and mine was the easiest one to say.',
      'It’s the most frustrating thing in the world, being judged on four days by people who barely know your last name.',
      'I was the easy vote. Nobody had to defend it to anybody. That’s it, that’s the whole story.',
    ],
    soft: [
      'I came in too hot. I wanted everyone to like me on day one, and in that place that reads as a threat.',
      'Somebody has to go first. I just wish it hadn’t been me, because I had a whole plan I never got to use.',
      'I was still learning where the cups were. I didn’t understand how fast it moves until it moved past me.',
      'I talked to everyone and committed to no one, and it turns out that makes you everyone’s second choice.',
      'Looking back, I can see it. I was loud, I was new, and I was easy to agree on.',
    ],
    hurt: [
      'I really thought I’d made friends. That’s the part I can’t get over, that I was wrong about all of them.',
      'I cried in the diary room on day two and I think everyone could tell. I wanted it so badly.',
      'I’ve watched this show my whole life. Going first is the one thing I prayed wouldn’t happen.',
    ],
  },
  blindside: {
    hot: [
      'I was angry before they finished reading. I knew exactly whose handwriting I was looking at.',
      'I had the votes. I counted them three times. Somebody lied to my face that afternoon.',
      'Honestly, I still think the count was wrong. I had promises from more than enough people.',
      '[J]I kept my face still for the cameras, but inside I was already working out who I’d be talking to at the finale.',
      'My first thought was, who? My second thought was, how many of them? I still don’t like the answer.',
    ],
    soft: [
      'I laughed, honestly. It was such a good move that I couldn’t even be mad in the moment.',
      'I went numb. Then I thought, okay, they got me, and I respect it more than I want to.',
      'I hugged everyone on the way out because that’s who I am, even if half of them didn’t deserve it.',
      'It was a clean hit. I was comfortable, and comfortable people get blindsided. That’s the game.',
      'I just smiled. There was nothing else to do. You don’t get to argue with a vote that’s already been read.',
    ],
    hurt: [
      'I looked straight at the people I trusted most, and none of them would look back. That’s when I knew.',
      'It wasn’t the vote. It was realising the people I’d have taken to the end had already let me go.',
      'I don’t remember walking to the door. I remember thinking, this can’t be right, they promised.',
    ],
  },
  'seen-it-coming': {
    hot: [
      'Everybody told me what I wanted to hear and then voted the way they were always going to.',
      'It was a done deal by Tuesday, and they still made me go through the whole week like it wasn’t.',
      'The worst part was how polite they all were about it. I’d rather they had just said it.',
      'I knew, they knew, and everybody pretended otherwise for six days. It was exhausting.',
    ],
    soft: [
      'I knew, and I made my peace with it midweek. I just wanted to go out with my head up.',
      'It’s strange, but knowing helped. I said everything I wanted to say before I left.',
      'I tried. I pitched to everyone, I didn’t burn anything, and the numbers just weren’t there.',
      'I spent the last few days just enjoying it. You can’t do much else when the votes are gone.',
      'Honestly, I was ready. You can only be the target for so long before you want it to end.',
    ],
    hurt: [
      'Knowing didn’t make it easier. It meant I had a week to watch my friends decide I was the one.',
      'The worst part was seeing how relieved some of them looked when I said I understood.',
      'I kept hoping somebody would fight for me. Nobody did, and that’s what I’ll remember.',
    ],
  },
  backdoor: {
    hot: [
      'That wasn’t a nomination, that was an ambush. Somebody had it planned before the veto was even played.',
      'I was safe at the start of the week and gone by the vote. Somebody made a deal behind my back.',
      'A backdoor is the coward’s way of doing it, and I think everyone in there knows who did it.',
      'Nobody had the nerve to put me up on day one. They waited until I couldn’t play for safety.',
    ],
    soft: [
      'Honestly, it was well played. I didn’t see it, and that’s on me for being comfortable.',
      'I knew the moment the veto came off. You can feel the room change when you’re the plan.',
      'It’s a compliment, in a way. You don’t backdoor somebody you could beat in a straight vote.',
      'I had a feeling something was off at the veto meeting, and by then it was too late to do anything.',
    ],
    hurt: [
      'The person holding the veto told me I had nothing to worry about. I believed it, right up until I didn’t.',
      'I didn’t even get to fight for it. One meeting and it was over.',
    ],
  },
  walked: {
    hot: ['I wasn’t going to sit there and be treated like that for another week.', 'They wanted me to break, and I didn’t give them the satisfaction of a vote.'],
    soft: ['I just knew. I wasn’t myself any more, and no amount of money is worth not recognising yourself.', 'It was the hardest decision I’ve ever made and I’d make it again.'],
    hurt: ['I miss it already, which is the stupid part. I walked out and I’d give anything to be back in there.'],
  },
  expelled: {
    hot: ['It was blown out of proportion. Things get said in there, and I was the one they made an example of.', 'I’m not going to pretend I was perfect, but the other side of that argument is still in the game.'],
    soft: ['I crossed a line. I know I did, and I’ve apologised to the person it hurt.'],
    hurt: ['I lost it, and I lost the game for it. I wish I could take that one minute back.'],
  },
  medical: {
    hot: ['I wanted to stay. The doctors made the call, and I’ll always wonder what would have happened.'],
    soft: ['I’m okay now, and that’s what matters. The game was going to end for me one way or another.', 'My body made the decision before I did. I’m at peace with it.'],
    hurt: ['I was doing so well. That’s what kills me. I was finally getting somewhere.'],
  },
  showmance: {
    hot: ['{partner} is going to be fine. I’m worried about how many people in there will use me against {partner} now.', 'They took me out to get to {partner}. Everyone in there knows it.'],
    soft: ['I told {partner} to go win it. That’s all I said. I didn’t want to make it harder.', 'We knew one of us would go first. I’m glad it was me, honestly.'],
    hurt: ['I didn’t get to say a proper goodbye to {partner}. That’s the part I keep replaying.', 'Leaving {partner} in there is the worst feeling I’ve ever had.'],
  },
  double: {
    hot: ['Two in one night means nobody has time to think, and they took the cheap shot.', 'A double is a chaos night, and they used the chaos to get rid of me without a campaign.'],
    soft: ['It goes so fast. One minute you’re watching {with} go and the next it’s your name.', 'Honestly, I’m glad I didn’t have to sit through a week of being the target.'],
    hurt: ['Watching {with} leave and then going myself an hour later, I didn’t even have time to be sad for {with}.'],
  },
  again: {
    hot: ['They were never going to let me stay. Coming back made me the target the second I walked in.', 'Same people, same plan. I got back in and they picked up exactly where they left off.'],
    soft: ['I got extra weeks most people never get. I’m grateful, even if it ended the same way.', 'I played better the second time. It just wasn’t enough, and that’s okay.'],
    hurt: ['I thought the second time would be different. I trusted the same people and got the same result.'],
  },
  finalist: {
    hot: [
      'I played the best game out there, and I’m going to keep saying it until the jury believes me.',
      'Getting to the end means something. I’m not going to let anyone tell me it doesn’t.',
      'I’m proud of what I did, and a little angry about how it was judged.',
    ],
    soft: [
      'I’m exhausted and I’m proud. I didn’t think I’d see the last night, and I did.',
      'Every single week I was the underdog in my own head. I made it. I can’t stop smiling.',
      'I just want to sleep for a week and then watch every episode.',
      'Honestly, it hasn’t landed yet. Ask me again tomorrow.',
    ],
    hurt: [
      'I’m proud, but I wanted that so badly. It’s going to take a while to feel anything else.',
      'Getting that close and not winning is its own kind of heartbreak.',
    ],
  },
};

// ── the tape: who they suspected, and what the ballots say ──────────────
// {flippers} are people the guest trusted who voted against them.
export const TAPE_Q = {
  wrong: [
    'You said {suspect}. I watched the ballots. {flippers} voted against you too, and you trusted {flippers}.',
    'I have to show you something. You were looking at {suspect}, but {flippers} wrote your name as well.',
    'Before you go any further on {suspect}: {flippers} voted you out. I don’t think you knew.',
    'Here’s what the audience saw that you didn’t. {flippers} voted against you.',
  ],
  right: [
    'You said {suspect}, and you were right. {flippers} wrote your name. How does it feel to be right?',
    'Your read was good. {flippers} voted against you, just like you thought.',
    'I watched the ballots. {flippers}, exactly as you said.',
  ],
  nosuspect: [
    'You don’t have a name for who flipped. I do. {flippers}.',
    'You keep saying you have no idea. It was {flippers}.',
    'I’ll tell you what the audience saw. {flippers} voted against you.',
  ],
};
export const TAPE_A = {
  wrong: {
    hot: [
      'No. No way. {flippers}? I would have bet my life on {flippers}. I need a minute.',
      'Then I owe {suspect} an apology, and I want a word with {flippers}.',
      'That’s actually worse. I spent my last week fighting the wrong person.',
      '[J]{flippers}. Okay. That changes how I’m voting at the finale, I’ll tell you that.',
    ],
    soft: [
      'Wow. Okay. Good for {flippers}, honestly. That’s a move I didn’t see.',
      'I really thought it was {suspect}. Well, now I know who I underestimated.',
      'That’s a good poker face. I had no idea.',
      'Huh. I owe {suspect} a hug and {flippers} a handshake.',
      'Okay, that’s a twist. I’m almost impressed.',
    ],
    hurt: [
      '{flippers}? We talked about the finale together. I’m not okay with that.',
      'I would never have guessed {flippers}. I don’t think I’ll be able to watch that episode.',
      'I’m going to need you to stop the tape for a second.',
    ],
  },
  right: {
    hot: ['I knew it. I could see it on {flippers} all week, and nobody listened to me.', 'Of course it was {flippers}. I said it and nobody believed me.'],
    soft: ['Good. At least my read was right, even if my game wasn’t.', 'I’m almost relieved. It means I wasn’t crazy.'],
    hurt: ['I knew, and I still hoped I was wrong about {flippers}.'],
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
    'Whose idea was it, really?',
    'Is this on {x}?',
  ],
  respect: [
    'Let’s talk about {x}. You’re not angry?',
    'What do you make of {x}’s game now?',
    'Is there anyone you’re impressed by, even now?',
    'You don’t sound bitter about {x}. Why not?',
  ],
  drag: [
    'Tell me about {x}.',
    'Your face just changed. Is that about {x}?',
    'What does everyone at home not know about {x}?',
    'Who was the hardest person to live with?',
    'Let’s talk about {x}. Be honest.',
    'Who fooled the audience the most?',
  ],
  warn: [
    'What should people know about {x}?',
    'Is {x} as nice as {x} looks on TV?',
    'Who should everybody be watching?',
    'Who is playing harder than it looks?',
    'Who did you never quite trust?',
  ],
  praise: [
    'Who was your person in there?',
    'Tell me about {x}. It looked like a real friendship.',
    'Who are you rooting for now?',
    'Who would you trust outside the game?',
    'Who made it bearable?',
  ],
  miss: [
    'Who are you going to miss?',
    'What do you want {x} to know?',
    'Who did you not get to say goodbye to properly?',
    'Who do you wish had come with you?',
  ],
};
export const NAMED_A = {
  blame: {
    hot: [
      'It was {x}, and {x} will tell everyone it wasn’t. That’s exactly how {x} plays.',
      '{x}. It always comes back to {x}.',
      '[J]I’ve thought about it all night, and it’s {x}. I’d bet my jury vote on it.',
      '{x} had been working on it for days. I just didn’t see it until it was too late.',
      'Put it on {x}. {x} can thank me later for the screen time.',
    ],
    hurt: [
      'It was {x}, and that’s what hurts. I’d have done anything for {x}.',
      '{x} looked me in the eye and told me I was fine. I don’t know what to do with that.',
      '{x}. I keep replaying every conversation we had, looking for the moment it changed.',
    ],
    soft: [
      'Probably {x}. I’m not even mad, it was smart.',
      'It was {x}, and honestly, I’d have done the same thing in {x}’s position.',
      '{x}, I think. Good for {x}.',
    ],
  },
  respect: {
    soft: [
      '{x} played a great game against me. I’d rather lose to someone like {x} than to a lucky one.',
      'Honestly, I’m rooting for {x}. That sounds strange, but {x} earned it.',
      '{x} is the real deal. I hope people at home are paying attention.',
      'I have nothing but respect for {x}. It was a clean shot.',
      '{x} out-played me. I can say that out loud.',
    ],
    hot: ['{x} is good. I hate how good {x} is.', 'I respect {x}. I just don’t have to like it.'],
    hurt: ['I respect {x}. I just wish it hadn’t been at my expense.', '{x} was fair to me, which almost makes it worse.'],
  },
  drag: {
    hot: [
      '{x} is the most fake person I have ever met, and I’ve met a lot of people.',
      '{x} talks about loyalty more than anyone in there and has the least of it.',
      'Everyone thinks {x} is playing a quiet game. {x} isn’t quiet, {x} is just hiding.',
      'I lived with {x} for weeks and I still couldn’t tell you one true thing {x} said.',
      '{x} is nice to your face and runs to the next room to repeat everything.',
      'I don’t have the time to list everything wrong with {x}’s game, and you don’t have the airtime.',
    ],
    soft: [
      '{x} and I never clicked, and I think we both knew it from day one.',
      'I’ll be polite about {x}. It’s going to be hard.',
      'We were never going to be friends. Let’s leave it there.',
      '{x} is a lot. I’ll just say {x} is a lot.',
    ],
    hurt: ['{x} made my life miserable in there and smiled the whole time.', '{x} knew exactly which buttons to press, and pressed all of them.'],
  },
  warn: {
    soft: [
      'I’d keep an eye on {x}. {x} is a lot sharper than people give credit for.',
      '{x} is always counting. Always.',
      'People underestimate {x}, and I think {x} likes it that way.',
      '{x} is nicer than me and smarter than people think, and that’s a dangerous mix.',
      'I never fully trusted {x}. I can’t tell you why, it was just a feeling.',
    ],
    hot: ['Watch {x}. That’s all I’ll say.', '{x} is not as innocent as {x} looks.', 'I warned people about {x} for a week, and they voted me out instead.'],
    hurt: ['I hope {x} is kinder to the next person than {x} was to me.', 'I wanted to trust {x}. I just couldn’t.'],
  },
  praise: {
    soft: [
      '{x}, without question. {x} kept me sane in there.',
      '{x} is the real thing. If {x} wins, I’ll be the loudest one cheering.',
      '{x}. We’d talk for hours about everything except the game.',
      'I’d trust {x} with my life outside of the game.',
      '{x} is the only person in there I never had to second-guess.',
    ],
    hot: ['{x} was the only honest person in there. Everyone else can keep their apologies.', '{x}. The one person who never lied to me.',
      '{x}, and that’s the only nice thing I’ll say about anybody today.', '{x} had my back when nobody else did.', 'Just {x}. Everyone else was playing a part.'],
    hurt: ['{x}. I already miss {x} more than I miss the game.', '{x}, always. That’s the friendship I’m taking home.'],
  },
  miss: {
    hurt: [
      'I want {x} to know I’m not mad. I want {x} to keep going.',
      '{x}, I love you, win the thing. That’s all.',
      'I’ll miss {x} every single day. We talked every night until we fell asleep.',
      '{x}. I didn’t get to say a real goodbye, and it’s killing me.',
    ],
    soft: [
      'I’ll miss {x}. We were going to make it to the end together.',
      '{x} was the best part of being in there.',
      '{x}. The late-night talks were the whole experience for me.',
    ],
    hot: ['I’ll miss {x}. {x} is the only one I’ll miss.', '{x}. Everybody else can stay in there forever.'],
  },
};
/** A second person blamed in the same hour, and a flipper the tape just named. */
export const BLAME2_Q = ['Who else had a hand in it?', 'And who helped?', 'Was anyone else in on it?', 'Anyone else you’re looking at?'];
export const BLAME2_A = {
  hot: ['{x} helped. {x} just let someone else say it out loud.', 'And {x}. {x} knew and didn’t warn me.', '{x} was in on it. I’d put money on it.'],
  soft: ['{x}, probably. That’s fine, it’s the game.', 'I think {x} went along with it.', '{x} knew. I don’t hold it against {x}.'],
  hurt: ['{x} knew. That’s the part that hurts.', 'I think {x} went along with it, and I wish {x} hadn’t.'],
};
/** Said to the friend the tape just exposed. */
export const AFTER_TAPE_A = {
  hot: [
    '{x}, you looked me in the eye. Enjoy the next few weeks, because I’ll be at the finale.',
    'I have nothing to say to {x} that you could put on a podcast.',
    '{x} knows what {x} did. I just want everyone at home to know it too.',
    'Honestly? Good luck to {x}. {x} is going to need it once everyone finds out.',
  ],
  hurt: [
    '{x}, I would have taken you to the end. I hope it was worth it.',
    'I don’t want to say anything to {x} yet. I need to sit with it.',
    'I thought {x} was the one person I didn’t have to worry about.',
    '{x}, I’m not angry. I’m just really sad.',
  ],
  soft: [
    'Well played, {x}. I mean that.',
    '{x} got me. I’ll be clapping at the finale, through gritted teeth.',
  ],
};
export const AFTER_TAPE_Q = ['And now that you know it was {x}?', 'What do you want to say to {x} now?', 'Does knowing it was {x} change how you see the whole game?', 'Take a second. {x}.'];

/** Only about somebody still in the game. */
export const NAMED_IN = {
  drag: {
    hot: [
      'I’m going to say it once: {x} is not who you think. Watch the next few weeks.',
      'If anyone in there is still trusting {x}, they’re next.',
      '{x} won’t last. {crowd} is starting to see it.',
    ],
    soft: ['{x} will get there, or {x} won’t. I’m just glad I don’t have to live with it any more.'],
    hurt: ['I hope {crowd} sees {x} the way I saw {x}, before it’s too late.'],
  },
  warn: {
    soft: ['If I were still in there, {x} would be my target.', 'Everybody left {inside} should be watching {x}.'],
    hot: ['If anyone in there is still trusting {x}, they’re next.', '{x} is coming for everyone left. You heard it here.'],
    hurt: ['Somebody please look out for {x}’s next target.'],
  },
  praise: {
    soft: ['{x} can win this. I really believe that.', 'I hope {x} goes all the way.'],
    hot: ['{x} is the only one in there who deserves it.'],
    hurt: ['Please let {x} make it to the end.'],
  },
};

// ── answering back: what they heard was said about them ─────────────────
export const BACK_Q = [
  '{x} sat in this chair after {when}. I have the clip. “{quote}”',
  'You’ve heard what {x} said about you on this show. For everyone else: “{quote}”',
  'Before we go on, I have to play you something {x} said in this chair. “{quote}”',
  '{when}, {x}, this chair: “{quote}” You’ve had time to think about it.',
];
export const BACK_A = {
  drag: {
    hot: [
      'That’s rich, coming from {x}. Everybody in there saw what {x} did.',
      '{x} can say what {x} wants from a podcast. I said it to {x}’s face in there.',
      'I heard it. I laughed. {x} still doesn’t get it.',
      'I’m not going to dignify that. Okay, I will. {x} is wrong, and {x} knows it.',
    ],
    hurt: ['That one stung. I thought {x} and I were okay.', 'I listened to it three times. I still don’t understand it.'],
    soft: ['{x} is allowed to be upset. I’d probably say the same thing.', 'Fair enough. It’s {x}’s hour, {x} gets to say it.'],
  },
  blame: {
    hot: ['{x} needed someone to blame and picked the easiest name.', 'I didn’t even vote for that, and {x} knows it.'],
    hurt: ['I wish {x} had asked me before saying that on air.', 'It wasn’t me. I hope {x} believes that one day.'],
    soft: ['I get why {x} thinks that. It wasn’t me, but I get it.', '{x} is guessing, and {x} guessed wrong.'],
  },
  warn: {
    hot: ['{x} should worry about {x}’s own game, which is over.', 'Funny, I was saying the same thing about {x}.'],
    hurt: ['I don’t know why {x} would say that. I never did anything to {x}.'],
    soft: ['Fair. I was careful around {x} too.', 'That’s a compliment, I think. I’ll take it.'],
  },
  respect: {
    soft: ['I appreciate that, and I mean it. {x} played a clean game against me.', 'That’s classy of {x}. I’ll say the same thing back.'],
    hot: ['Respect is easy once you’re both out. I’ll take it, I guess.'],
    hurt: ['That means more than {x} knows.'],
  },
  praise: {
    soft: ['{x} said that? I’m going to cry. {x} was my favourite person in there.', 'That’s {x}. Kind even when there’s nothing to gain.'],
    hot: ['At least somebody {inside} had manners.'],
    hurt: ['I miss {x}. Hearing that makes it worse, in a good way.'],
  },
  miss: {
    soft: ['I miss {x} too.', 'We’re getting dinner the minute this is over.'],
    hot: ['Yeah, well, {x} could have voted differently.'],
    hurt: ['We’re getting dinner the minute this is over. I miss {x} so much.'],
  },
};

// ── the segments ────────────────────────────────────────────────────────
export const FAN_Q = {
  warm: [
    'I have to read you one of these. “{guest} deserved so much better, {crowd} doesn’t know what it lost.”',
    'The comments this week are mostly love. Somebody wrote, “{guest} was the only one I actually liked.”',
    'Listener mail. “Please put {guest} on another season immediately.”',
    'Your mentions are very kind this week. Top comment: “Justice for {guest}.”',
    'Someone sent in a drawing of you. I’m not going to show it to you, but it’s very flattering.',
  ],
  mixed: [
    'Your mentions are split. Half say you got robbed, half say you saw it coming.',
    'A listener asked me to ask you: “Do you think you played too safe?”',
    'Somebody wrote in: “{guest} was fun to watch, but did {guest} have a plan?”',
    'The fans can’t decide on you. Some love you, some think you talked yourself out the door.',
    'Listener question: “What would you have done differently in the first week?”',
  ],
  cold: [
    'I’ll be honest, the fans are not kind this week. Top comment: “{guest} got exactly what {guest} deserved.”',
    'I’m going to read you one, and you’re not going to like it. “Bye {guest}, nobody will miss the attitude.”',
    'The internet has decided you were the villain. How do you feel about that?',
    'Your comments are rough. One person wrote, “Finally, some peace {inside}.”',
    'A listener wants to know why you were so hard on everybody.',
  ],
};
export const FAN_A = {
  warm: {
    hot: ['Good. At least somebody was paying attention.', 'See, the people at home get it. {crowd} didn’t.'],
    soft: ['That’s so kind. I really didn’t expect anyone to be in my corner.', 'I’ll take it. Honestly, I needed to hear that today.', 'Stop, I’m going to cry on your podcast.'],
    hurt: ['That’s nice. It doesn’t make it hurt less, but it’s nice.', 'I’m going to read every one of those tonight and cry.'],
  },
  mixed: {
    hot: ['They saw an edit. They didn’t live it.', 'People at home have no idea what it’s like on day thirty with no sleep.'],
    soft: ['That’s fair. I probably did play it too safe in places.', 'I’d have changed the first week. I came in too fast.', 'Honestly, they’re not wrong. I’ll own that.',
      'Both halves have a point. That’s the annoying part.', 'Split sounds right. I was split on me too.'],
    hurt: ['I did my best. That’s all I can say.', 'I hear it. I’m not ready to hear all of it yet.'],
  },
  cold: {
    hot: ['I’m fine with being the villain if it means I told the truth.', 'I’m not reading the comments, and now I definitely won’t.', 'They saw an edit. They didn’t live it.'],
    soft: ['I’ll read the bad ones too. They’re usually right about something.', 'That’s fair. I wasn’t always my best self in there.'],
    hurt: ['That’s hard to hear. I’m going to log off for a while.', 'I wasn’t a villain. I was scared.'],
  },
};

/**
 * A listener's QUESTION gets an answer to that question. FAN_A is a reaction
 * to what the comments say ("They saw an edit"), which answers "the internet
 * thinks you're the villain" and does not answer "do you think you played too
 * safe?". A question matching one of these is answered from its own lines.
 */
export const FAN_FIT = [
  { when: /too safe/i, a: {
    hot: ['Too safe? I played the only game the numbers gave me.', 'Safe is what you call it when it doesn’t work.'],
    soft: ['That’s fair. I probably did play it too safe in places.', 'Honestly, they’re not wrong. I’ll own that.'],
    hurt: ['Maybe. I was scared, and it showed.', 'Probably. I didn’t want to be the one who blew it up.'],
  } },
  { when: /have a plan/i, a: {
    hot: ['I had a plan. Nobody else stuck to theirs.', 'I had a plan. I just didn’t print it on a T-shirt.'],
    soft: ['I had one. It needed one more week.', 'A plan, yes. A good one, apparently not.'],
    hurt: ['I had a plan. I didn’t have the numbers.'],
  } },
  { when: /differently/i, a: {
    hot: ['Nothing. I’d play it the same and hope the others played it better.', 'I’d have trusted nobody. Lesson learned.'],
    soft: ['I’d have changed the first week. I came in too fast.', 'Talked less, listened more. Every time.'],
    hurt: ['I’d have trusted fewer people. Or the right ones.'],
  } },
  { when: /so hard on everybody/i, a: {
    hot: ['Because somebody had to say it, and nobody else would.', 'I was honest. It looks hard when everyone else is pretending.'],
    soft: ['That’s fair. I wasn’t always my best self in there.'],
    hurt: ['I wasn’t a villain. I was scared.'],
  } },
];
/** FAN_A lines that answer one particular question, kept off the others. */
export const FAN_SPECIFIC = /too safe|first week/i;

export const RANK_Q = [
  'Rank who’s left. Top three.',
  'Give me your power ranking, top three, no hesitating.',
  'Who’s running that game right now? Top three.',
  'Top three threats left {inside}. Go.',
];
export const RANK_A = [
  '{a}, {b}, then {c}. And {a} is a long way ahead.',
  'One: {a}. Two: {b}. Three: {c}, and that’s being generous.',
  '{a} first, easily. {b}, and then {c} by a whisker.',
  '{a}, {b}, {c}. Ask me next week and it could be backwards.',
];

export const MESSAGE_Q = [
  'You get one message in to somebody still playing. Who’s it for?',
  'If {x} could hear you right now, what would you say?',
  'Say something to {x}. {x} won’t hear it for a while, but say it.',
  'One message, one person still in there. Go.',
];
export const MESSAGE_A = {
  soft: ['{x}, keep your head down and win the next one. You’ve got this.', '{x}, I’m proud of you. Don’t trust the people who hug you the most.', '{x}, have fun. It goes so fast.'],
  hot: ['{x}, open your eyes. The people around you are not your friends.', '{x}, they will do to you exactly what they did to me.', '{x}, win it and make them all watch.'],
  hurt: ['{x}, I miss you. Please don’t give up because I’m gone.', '{x}, it’s not your fault. Keep going.', '{x}, I’ll be waiting for you.'],
};

export const CALLER_IN = [
  'We have someone on the line. {caller}, you’re on Kristal-talKs.',
  'I said I had a surprise. {caller} is calling in.',
  'Somebody who knows exactly how this feels: {caller}, go ahead.',
  'The phones are open, and the first one through is {caller}.',
  'Hold on, we have a caller. {caller}, hi.',
  '{caller} asked to be put through. Go ahead, {caller}.',
];
export const CALLER_SAY = {
  warm: [
    '{guest}, welcome to the outside. It’s quieter out here, I promise.',
    'I just wanted to say I’m sorry it went that way. You were one of the good ones.',
    'Hey {guest}. I watched it at home and yelled at the TV for you.',
    '{guest}! I’ve been waiting for you to get out. We have so much to talk about.',
    'I’m so proud of you, {guest}. You played it your way.',
    'Welcome to the club nobody wanted to join. The snacks are better out here.',
    'I cried when they read your name, {guest}. Genuinely.',
  ],
  cold: [
    'I just want to know if you’re still telling people it was my fault.',
    'Hi {guest}. I heard what you said about me. I wanted to hear you say it to me.',
    'So, how does it feel? Because I remember how it felt when it was me.',
    '{guest}, I’m not calling to fight. I’m calling to say you were wrong about me.',
    'I just want to say, from out here, it looks very different. Ask me how I know.',
    'Funny how it feels when it’s your turn, isn’t it?',
  ],
};
export const CALLER_REPLY = {
  warm: ['{caller}! We need to get dinner. I mean it.', 'Thank you, {caller}. That really helps.', '{caller}, you’re the best. I’ll call you after this.',
    'Stop, {caller}, you’re going to make me cry on air.', 'I missed you so much, {caller}.'],
  cold: ['{caller}, you knew what you did. We both know.', 'Hello, {caller}. I see you’re still upset.', 'I said what I said, {caller}.',
    'We can talk about this off the air, {caller}.', 'I’m not doing this with you right now, {caller}.'],
};

export const NEXT_Q = ['Who goes next?', 'Next {exitNoun}. One name.', 'Who should be packing tonight?', 'Who’s in trouble next?'];
export const NEXT_A = {
  hot: ['{x}. And I’ll be watching.', '{x}, if there is any justice.', '{x}. {crowd} will wake up eventually.'],
  soft: ['Probably {x}. The numbers are moving that way.', '{x}, I think, but I’ve been wrong before.', 'My gut says {x}.'],
  hurt: ['I don’t want anyone to go. If I have to say, {x}.', '{x}, I suppose. I hope I’m wrong.'],
};

export const PREDICT_Q = [
  'Who wins?',
  'Last one. Who takes it all?',
  'Give me a winner.',
  'If you had to bet your own money, who wins this season?',
  'Who’s sitting in the final chair at the end?',
];
export const PREDICT_A = {
  hot: ['{x}, and I hate saying it.', '{x}. Not because {x} deserves it, because nobody in there will stop {x}.', '{x}. Mark it down.'],
  soft: ['{x}. {x} has the best game in there and nobody’s noticed yet.', '{x}, and I’d be happy for {x}.', '{x}. Watch, you’ll see.', 'I’m saying {x}.'],
  hurt: ['I want it to be {x}. I really do.', '{x}. I’m rooting for {x} with everything I have.'],
};

export const CLOSE = {
  bitter: ['That’s {guest}. Not done being angry, and honestly, I don’t blame {obj}.', 'That was {guest}. I think a few people {inside} will be hearing this one, eventually.', '[J]{guest}, everybody. Somebody check on the jury.'],
  denial: ['That’s {guest}, still not convinced it really happened. We’ll check in at the finale.', '{guest}, everybody. Give it a week, I think it’ll land.'],
  gracious: ['That’s {guest}, taking it better than most would. Thank you for coming in.', '{guest}, everybody. Class act.', 'Thank you, {guest}. That was a generous hour.'],
  relieved: ['That’s {guest}, home and sleeping in a real bed tonight. Good for {obj}.'],
  gutted: ['Thank you, {guest}. Go get some rest. We’ll see you at the finale.', '{guest}, everybody. Be kind in the comments.', 'That was {guest}. Take care of yourself.'],
  elated: ['That was {guest}. What a night.', 'Congratulations, {guest}. Enjoy every second of this.'],
};

export const PLACE = { 1: 'first', 2: 'second', 3: 'third' };

// ── the debrief after the finale plays back the in-season prediction ────
// Slots: {week} {said} (who they picked) {winner}.
export const PLAYBACK_Q = {
  right: [
    'In {when} you sat in this chair and told me {said} would win. {said} won. Take your bow.',
    'I have the tape from {when}. You said {said}. You were right.',
  ],
  wrong: [
    'In {when}, right here, you told me {said} would win. {winner} won. What happened?',
    'I’m going to play you {when}. You said {said}. It was {winner}.',
    'You picked {said} in {when}. Do you want to take that back now that {winner} has the money?',
  ],
};
export const PLAYBACK_A = {
  right: ['I called it. I want that on the record.', 'I knew in {when} and I know now.', 'Nobody listened to me, and I was right.'],
  wrong: [
    '{said} had it, and then {said} didn’t. I still don’t understand how.',
    'Okay, I was wrong. {winner} played a better back half than any of us saw.',
    'Don’t play me that. I was very emotional that week.',
  ],
};


// ── what belongs to one show ────────────────────────────────────────────
// Merged over the shared banks for that show only (js/kristal-exit.js
// bankFor). A kind that only one show has (Big Brother's backdoor, Total
// Drama's lost challenge) lives here whole.
export const SHOW = {
  'big-brother': {
    COLD: {
      'seen-it-coming': [
        '{when}. {guest} sat on that block, campaigned, and went out {votes}. Let’s go through it.',
        '{guest} spent all of {when} on the block. {votes}. Let’s go through it.',
      ],
    },
    OPEN_Q: {
      'seen-it-coming': ['Take me through the week on the block.', 'What does a week on the block feel like from the inside?'],
    },
    OPEN_A: {
      'seen-it-coming': {
        hot: ['I spent four days campaigning to people who had already decided. They just let me keep talking.'],
        soft: ['I campaigned to everybody. I didn’t burn a single bridge on the way out, and I’m proud of that.'],
      },
    },
    NEXT_Q: ['Who’s on the block next week?', 'Next eviction. One name.'],
  },
  'total-drama': {
    COLD: {
      blindside: [
        '{guest} walked into tribal thinking it was somebody else’s night. It was {votes}. {when}.',
        '{when}, and the votes came out with {guest}’s name on them, {votes}. {guest} did not see it.',
        'If you watched {when}, you saw {guest}’s face at the votes. I want to know what was going on behind it.',
      ],
      'seen-it-coming': [
        '{guest} knew going into tribal. {votes}, {when}, and knowing didn’t make it hurt less.',
        '{when}, {votes}. {guest} spent the whole day scrambling and walked into tribal with nothing.',
        '{guest} is here, {when}, {votes}. Camp had made up its mind before the challenge was over.',
      ],
      'lost-duel': [
        '{guest} got voted out, fought on the island, and lost the duel in {when}. Two goodbyes in one season. Let’s talk.',
        'The island finally closed on {guest} in {when}. {guest} was so close to coming back.',
        '{when}: {guest} lost the duel, and the way back in with it.',
      ],
      'lost-challenge': [
        'No vote for {guest} in {when}. The challenge decided it, and the challenge doesn’t listen to pitches.',
        '{guest} went out on a challenge in {when}. Nobody wrote a name down, which somehow makes it worse.',
        '{when}: the challenge took {guest}. Let’s talk about it.',
      ],
    },
    OPEN_Q: {
      blindside: ['Walk me through tribal.', 'What went through your head when they read the votes?', 'When did you know?'],
      'seen-it-coming': ['Take me through the last day at camp.', 'Was there anything left to try before tribal?', 'What does that day feel like?'],
      'lost-challenge': ['Take me through the challenge.', 'What happened out there?', 'Is it better or worse than being voted out?'],
      'lost-duel': ['What was the island like?', 'Take me through the duel.', 'Which one hurt more, the vote or the duel?'],
    },
    OPEN_A: {
      'seen-it-coming': {
        hot: ['I spent the afternoon pitching to people who had already decided. They just let me keep talking.', 'Everybody told me it was going to be someone else. Everybody.'],
        soft: ['I tried everything. I talked to everyone at camp, and the numbers just weren’t there.', 'I knew, and I made my peace with it on the walk to tribal.'],
        hurt: ['The walk to tribal was the longest walk of my life.'],
      },
      'lost-duel': {
        hot: ['I outlasted everybody on that island and lost on one bad round. That’s the part I can’t take.', 'They voted me out, and then the island did it again. I’ve been sent home twice by the same people.'],
        soft: ['The island taught me more than camp did. I’m almost glad I got to go there.', 'I fought for every day out there. I lost to someone who wanted it a bit more.'],
        hurt: ['I could see the way back. I was that close, and then it was gone.'],
      },
      'lost-challenge': {
        hot: ['I wasn’t beaten by a person. I was beaten by a bad draw and a stopwatch.', 'Put me in front of a vote any day. That challenge was rigged against me.'],
        soft: ['I gave it everything and it wasn’t enough. I can live with that.', 'Honestly, I’d rather go out fighting than go out on a vote.'],
        hurt: ['I was so close. I keep seeing the moment I slipped.'],
      },
    },
    NEXT_Q: ['Who gets snuffed next?', 'Next one voted out. One name.'],
    FAN_Q: { mixed: ['The fan forums are split on you. Half say you played too hard, half say not hard enough.'] },
  },
  traitors: {
    COLD: {
      'seen-it-coming': [
        'The round table wrote {guest}’s name in {when}, {votes}. Every slate turned over, one after another.',
        '{guest} watched the slates go round in {when}, {votes}, and knew halfway through.',
      ],
      blindside: [
        '{guest} sat down at that table sure it was somebody else’s night. {votes}, {when}. Let’s talk about the slates.',
        'In {when} the table turned on {guest}, {votes}, and some of those slates came from friends.',
      ],
      murdered: [
        '{guest} didn’t get a round table. {guest} got a letter under the door in {when}. Murdered in the night.',
        'The Traitors came for {guest} in {when}. No vote, no goodbye speech, just an empty seat at breakfast.',
        'Breakfast in {when}, and {guest} never walked in. The Traitors murdered {obj} overnight.',
      ],
    },
    OPEN_Q: {
      murdered: ['When did you find out?', 'Why do you think they chose you?', 'Who do you think did it?'],
    },
    OPEN_A: {
      murdered: {
        hot: ['They murdered me because I was getting close. That’s the only reason.', 'I was a threat to them, and I’ll take that as a compliment.'],
        soft: ['Honestly, it’s a relief not to be banished by my friends.', 'Being murdered means they were scared of me. I’ll take it.'],
        hurt: ['I didn’t get to say goodbye to anybody. One night I was there and then I wasn’t.'],
      },
    },
    NEXT_Q: ['Who goes at the next round table?', 'Who gets murdered next?'],
  },
  'drag-race': {
    COLD: {
      'lip-sync': [
        '{guest} lip synced for {pos} life in {when} and sashayed away. Tonight {sub} gets the last word.',
        'The bottom two, the song, the decision. {when} ended with {guest} walking off that stage.',
        '{guest} left it all on the stage in {when}. It wasn’t enough. Let’s talk about it.',
      ],
    },
    OPEN_Q: {
      'lip-sync': ['Take me back to the lip sync.', 'When did you know?', 'Did you know the song?', 'What went through your head when they said your name?'],
    },
    OPEN_A: {
      'lip-sync': {
        hot: ['I lip synced better and everyone in that room knows it.', 'I shouldn’t have been in the bottom in the first place. The critique was wrong.'],
        soft: ['I gave it everything. She was better tonight, and I can say that.', 'I didn’t know the second verse. That’s on me.'],
        hurt: ['I wanted that crown since I was a kid. I can’t believe it’s over.'],
      },
    },
    NEXT_Q: ['Who’s in the bottom next week?', 'Who lip syncs next?'],
  },
  'perfect-match': {
    COLD: {
      dumped: [
        '{guest} has been dumped from the villa in {when}. The bags are packed, and the tan isn’t even finished.',
        'The villa said goodbye to {guest} in {when}. Let’s talk about the couples left behind.',
        '{guest} came looking for love and left in {when}. Pull up a sun lounger.',
      ],
    },
    OPEN_Q: { dumped: ['Did you see it coming?', 'How are you feeling, now it’s over?', 'Did you find what you came for?'] },
    OPEN_A: {
      dumped: {
        hot: ['They picked looks over chemistry and I’m the one who pays for it.', 'I was the realest person in that villa and that’s why I’m gone.'],
        soft: ['I came for love and I made real friends. I’ll take that.', 'It wasn’t my time. My person wasn’t in there.'],
        hurt: ['I really thought it was going somewhere. I feel stupid now.'],
      },
    },
    NEXT_Q: ['Who gets dumped next?', 'Which couple won’t make it?'],
  },
  'the-circle': {
    COLD: {
      blocked: [
        '{guest} got blocked in {when}. One message on a screen, and it was over.',
        'The Influencers sent {guest} home in {when}. Now, finally, we get to talk face to face.',
        '{guest} was blocked in {when}, and walked into one last room on the way out.',
      ],
    },
    OPEN_Q: { blocked: ['How did it feel to see your name on that screen?', 'What went through your head when you read that message?', 'Was your profile the real you?'] },
    OPEN_A: {
      blocked: {
        hot: ['The Influencers blocked the biggest threat. That’s all that was.', 'I played honest in a game full of catfish, and honest lost.'],
        soft: ['It’s a ratings game. I wasn’t in the top, so I can’t argue.', 'I loved my time in there. I’d do it all again tomorrow.'],
        hurt: ['I thought I had real friends in there. Now I don’t know who any of them really are.'],
      },
    },
    NEXT_Q: ['Who gets blocked next?', 'Who’s at the bottom of the next ratings?'],
  },
  'the-challenge': {
    COLD: {
      'lost-elimination': [
        '{guest} went into the elimination in {when} and came out on the wrong side. Let’s talk.',
        'The arena took {guest} in {when}. No vote can save you in there.',
        '{guest} lost the elimination in {when}. We’re going to talk about who sent {obj} in.',
      ],
    },
    OPEN_Q: { 'lost-elimination': ['Take me through the elimination.', 'Who sent you in?', 'Did you think you’d win it?'] },
    OPEN_A: {
      'lost-elimination': {
        hot: ['They threw me in because they were scared to face me in a final.', 'I got the worst elimination for me and they knew it.'],
        soft: ['I got beat. On another day it goes the other way.', 'I left everything in that arena. I’m proud of that.'],
        hurt: ['I was so close. I can still feel it slipping.'],
      },
    },
    NEXT_Q: ['Who goes in next?', 'Who’s the next one in the arena?'],
  },
};
