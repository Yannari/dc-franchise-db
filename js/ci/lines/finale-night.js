// ══════════════════════════════════════════════════════════════════════
// ci/lines/finale-night.js — the last day, the meeting, finale night
// ══════════════════════════════════════════════════════════════════════
//
// ci/finale.js decides every moment; these are its words.
//   final.morning(.friend)   a wakes up a finalist (b: the person who got them here)
//   final.video.friend/home  a watches a message: from b, a blocked friend, or from home
//   final.rate.tease         a sends the final ratings and keeps the first place secret
//   final.leave              a says goodbye to the apartment
//   meet.talk.*              two people settle what they had, face to face:
//     catfishfriend.forgive/hurt  a is the catfish, b their friend
//     knewit / wrongsuspect       a suspected b: right, or wrong
//     flirt.spark/awkward, rival.clear/clash, ally, kin ({q}: what a calls b), kin.tense.thaw/cold
//   meet.all                 all of them, one room (a, b, c among them)
//   reveal.open / reveal.board / reveal.suspense   the host
//   studio.confront          a, blocked by b, face to face in the studio
//   studio.cheer             a, blocked, cheering for b, still in
//   reveal.react.<tone>      a hears their place: proud, surprised, gutted, shocked
//   reveal.witness.smirk/cheer  a watches b's place land
//   reveal.final2            the last two, a and b (in name order: it gives nothing away)
//   reveal.react.second      a, runner-up, to b, the winner
//   reveal.react.win / reveal.speech(.catfish)   a wins; the speech thanks b
//   reveal.fan               a is the fans' favourite
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const host = (t, extra = {}) => ({ turns: [{ by: 'host', say: t }], ...extra });

export const FINALE_NIGHT = {
  // ── The last day ──────────────────────────────────────────────────
  ...E('final.morning', [
    { turns: [{ by: 'a', react: "Final day. FINAL DAY!" }, { by: 'a', say: "I walked in here with a plan and a suitcase. Look at me now." }], beat: '{a} jumps on the bed like a kid.' },
    { turns: [{ by: 'a', say: "Last morning in this apartment. I'm going to miss talking to a TV." }], beat: '{a} pours a coffee and sits very still with it.' },
    { turns: [{ by: 'a', react: "I made it. I actually made it." }, { by: 'a', say: "Every day I thought it was my last. And it wasn't." }] },
    { turns: [{ by: 'a', say: "Whatever happens today, I played my game. I'm proud of that." }], beat: '{a} looks around the apartment, slowly.' },
    { turns: [{ by: 'a', react: "Last day. I need a minute." }, { by: 'a', say: "I'm going to miss this. Even the weird parts." }], beat: '{a} sits on the edge of the bed for a long time.' },
    { turns: [{ by: 'a', say: "Good morning, Circle. For the last time." }], beat: '{a} waves at the screen.' },
    { turns: [{ by: 'a', react: "Okay, who let me make it this far?" }, { by: 'a', say: "Today I find out if anyone in there actually liked me." }] },
    { turns: [{ by: 'a', say: "My mom is going to see all of this. Every single dance in the kitchen." }], beat: '{a} laughs into {a.posAdj} pillow.' },
  ]),
  ...E('final.morning.friend', [
    { turns: [{ by: 'a', say: "I would not be in this final without {b}. I need {b} to know that." }] },
    { turns: [{ by: 'a', react: "Final day." }, { by: 'a', say: "The first person I'm hugging at the end is {b}. That's not even a question." }] },
    { turns: [{ by: 'a', say: "Day one, I didn't trust anybody. Then {b} happened. Thank God for {b}." }], beat: '{a} smiles at nothing for a while.' },
    { turns: [{ by: 'a', say: "If I lose today, I want to lose to {b}. That's how much I love {b}." }] },
    { turns: [{ by: 'a', react: "Final day, and the first thing I thought about was {b}." }], beat: '{a} rolls over and grins at the ceiling.' },
    { turns: [{ by: 'a', say: "{b} believed in me when nobody else did. I'm not forgetting that." }] },
  ]),
  ...E('final.video.friend', [
    { turns: [{ by: 'b', video: "Hi! It's me. I'm out here screaming for you every single night. Win this." }, { by: 'a', react: "{b}! Oh my God, {b}!" }], beat: '{a} covers {a.posAdj} mouth with both hands.' },
    { turns: [{ by: 'b', video: "I'm so proud of you. You did it the right way. Now finish it." }, { by: 'a', react: "Okay, I'm crying. I'm crying at nine in the morning." }] },
    { turns: [{ by: 'b', video: "You carried me in there, and now I'm cheering you to the end. Go get it." }, { by: 'a', say: "This one's for you, {b}." }] },
  ]),
  ...E('final.video.home', [
    { stage: "A video from home: {a}'s family, crowded around a phone.", turns: [{ by: 'a', react: "Mom! Is that the whole family?" }, { by: 'a', say: "Okay. Now I really have to win." }] },
    { stage: 'A message from home plays on the screen.', turns: [{ by: 'a', react: "Oh no. Oh no, I wasn't ready for that." }, { by: 'a', say: "I miss them so much. One more day." }], beat: '{a} touches the screen.' },
    { stage: "{a}'s best friend from home waves at the camera, holding a sign.", turns: [{ by: 'a', react: "Is that a SIGN? With my FACE on it?" }, { by: 'a', say: "I have the best people in the world." }] },
  ]),
  ...E('final.rate.tease', [
    { turns: [{ by: 'a', say: "And my first place goes to... nope. That one stays between me and the Circle." }] },
    { turns: [{ by: 'a', say: "My number one was the easiest choice of the whole game." }], beat: '{a} smiles and says nothing more.' },
    { turns: [{ by: 'a', say: "First place. I'm not saying it out loud. They'll find out tonight." }] },
    { turns: [{ by: 'a', say: "The top spot? I knew it before I opened the ratings." }], beat: '{a} taps the screen once and leans back.' },
  ]),
  // The last ratings ever: nothing about next time.
  ...E('final.rate.middle', [
    { turns: [{ by: 'a', say: "{b}, right in the middle. You were a great part of my game." }] },
    { turns: [{ by: 'a', say: "Middle spot goes to {b}. No hard feelings, ever." }] },
    { turns: [{ by: 'a', say: "{b} lands in the middle. That was the hardest one to place." }], beat: '{a} hovers over the screen before confirming.' },
    { turns: [{ by: 'a', say: "Circle, {b} in the middle. I love {b}, but this is the end of the road." }] },
    { turns: [{ by: 'a', say: "{b}, the middle. If I could give everybody first, I would." }] },
    { turns: [{ by: 'a', say: "Putting {b} right in the middle. It doesn't feel good. None of these do today." }] },
  ]),
  ...E('final.leave', [
    { turns: [{ by: 'a', say: "Goodbye, apartment. Goodbye, couch. Goodbye, Circle." }], beat: '{a} switches off the screen for the last time.' },
    { turns: [{ by: 'a', react: "Okay. This is it." }, { by: 'a', say: "Circle, thank you. For everything." }], beat: '{a} takes one last look and closes the door.' },
    { turns: [{ by: 'a', say: "I talked to more people from this couch than I have in my whole life." }], beat: '{a} pats the couch on the way out.' },
    { turns: [{ by: 'a', react: "I'm about to see their real faces. I'm going to throw up." }], beat: '{a} grabs a jacket and leaves the apartment for good.' },
    { turns: [{ by: 'a', say: "Bye, kitchen. You fed me through so much drama." }], beat: '{a} blows a kiss at the fridge.' },
    { turns: [{ by: 'a', react: "Okay. Okay okay okay." }, { by: 'a', say: "Last walk down that hallway. Let's go." }], beat: '{a} takes a breath and opens the door.' },
    { turns: [{ by: 'a', say: "This apartment knows all my secrets. I'm leaving them here." }] },
    { turns: [{ by: 'a', react: "My heart is pounding." }, { by: 'a', say: "Every face I've imagined for weeks is behind that door." }], beat: '{a} smooths down {a.posAdj} shirt twice.' },
  ]),

  // ── The meeting: two people, finally face to face ─────────────────
  ...E('meet.talk.catfishfriend.forgive', [
    { turns: [{ by: 'a', say: "Hi! I'm {a}. Haha. Okay. My real name is {a.real}." }, { by: 'b', react: "Wait, WHAT?" },
      { by: 'b', say: "I don't even care. Come here. You were my person in there." }], beat: '{a} and {b} hug and do not let go.' },
    { turns: [{ by: 'b', say: "You're not {a}." }, { by: 'a', say: "I'm not. I'm {a.real}. Everything I said to you was still me." },
      { by: 'b', say: "Honestly? I believe you." }] },
    { turns: [{ by: 'a', say: "I need to say sorry to you more than anyone." }, { by: 'b', say: "You played the game. And you were a good friend doing it." },
      { by: 'a', react: "Okay, now I'm crying." }] },
    { turns: [{ by: 'b', react: "You! It was YOU!" }, { by: 'a', say: "Hi. I'm {a.real}. Please don't be mad." }, { by: 'b', say: "Mad? I'm obsessed with you." }] },
    { turns: [{ by: 'a', say: "I hated lying to you the most. You have to believe that." }, { by: 'b', say: "I do. Every chat we had still counts." }], beat: '{b} pulls {a} into a hug.' },
    { turns: [{ by: 'b', say: "So I've been best friends with a stranger for weeks." }, { by: 'a', say: "Not a stranger. Just a different face." }, { by: 'b', react: "I'll allow it." }] },
    { turns: [{ by: 'a', say: "{a.real}. That's me. The real one." }, { by: 'b', say: "Well, nice to meet you. Again." }], beat: 'They both burst out laughing.' },
  ]),
  ...E('meet.talk.catfishfriend.hurt', [
    { turns: [{ by: 'b', say: "I told you things. Real things. And you weren't even real." }, { by: 'a', say: "The person who answered was real. I swear." },
      { by: 'b', say: "I need a minute." }], beat: '{b} steps away to the other side of the room.' },
    { turns: [{ by: 'a', say: "Hi. I'm {a.real}." }, { by: 'b', react: "So it was all fake." }, { by: 'a', say: "Not all of it. Not the friendship." },
      { by: 'b', say: "That's hard to hear right now." }] },
    { turns: [{ by: 'b', say: "You looked me in the eye. Through a screen. Every day." }, { by: 'a', say: "I know. I'm sorry. I really am." }], beat: '{b} does not hug {a} back.' },
    { turns: [{ by: 'b', say: "Every time I said I trusted you, you were lying." }, { by: 'a', say: "About my face. Not about you." }, { by: 'b', say: "It's the same thing to me." }] },
    { turns: [{ by: 'a', say: "Can we talk? Please?" }, { by: 'b', say: "Later. Not right now. I need to breathe." }], beat: '{b} turns away, arms crossed.' },
    { turns: [{ by: 'b', react: "Wow. You're not even close to who I pictured." }, { by: 'a', say: "I know. I'm so sorry." }] },
  ]),
  ...E('meet.talk.knewit', [
    { turns: [{ by: 'a', react: "I KNEW IT! I said it on day three!" }, { by: 'b', say: "Okay, okay, you got me. You were the only one." }] },
    { turns: [{ by: 'a', say: "Nobody listened to me. Nobody!" }, { by: 'b', say: "And I was so worried you'd convince them." }], beat: '{a} takes a little bow.' },
    { turns: [{ by: 'a', react: "There it is. There's the catfish." }, { by: 'b', say: "Hi. Yeah. Nice to finally meet you, detective." }] },
    { turns: [{ by: 'a', say: "From day one, I had a feeling about you." }, { by: 'b', say: "And you never let it go. Respect." }] },
    { turns: [{ by: 'a', react: "Called it! I CALLED IT!" }, { by: 'b', say: "You did. You absolutely did." }], beat: 'Everyone near them laughs.' },
  ]),
  ...E('meet.talk.wrongsuspect', [
    { turns: [{ by: 'a', react: "You're REAL? You're actually real?" }, { by: 'b', say: "Real since day one! I told you!" }, { by: 'a', say: "I'm so sorry. I was so sure." }] },
    { turns: [{ by: 'b', say: "So. You thought I was a catfish." }, { by: 'a', react: "In my defense, your pictures were really, really good." }, { by: 'b', say: "I'll take that as a compliment." }] },
    { turns: [{ by: 'a', say: "I owe you the biggest apology." }, { by: 'b', say: "You owe me a hug, is what you owe me." }], beat: '{a} and {b} laugh and hug.' },
    { turns: [{ by: 'a', react: "Wait. That's actually you?" }, { by: 'b', say: "What did you think I was, a robot?" }, { by: 'a', say: "Honestly? Kind of." }] },
    { turns: [{ by: 'b', say: "So, detective. How did you get it so wrong?" }, { by: 'a', react: "Your pictures were too good! That's on you!" }] },
  ]),
  ...E('meet.talk.flirt.spark', [
    { turns: [{ by: 'a', say: "So. Hi. In person." }, { by: 'b', say: "Hi. You're even better in person." }], beat: '{a} and {b} stand a little too close for a little too long.' },
    { turns: [{ by: 'b', say: "I've been waiting all game to do this." }, { by: 'a', react: "Then do it." }], beat: '{b} kisses {a}, and the room loses its mind.' },
    { turns: [{ by: 'a', say: "I was so scared you'd be different." }, { by: 'b', say: "And?" }, { by: 'a', say: "You're exactly you." }] },
    { turns: [{ by: 'a', react: "Oh no. You're cute in person too." }, { by: 'b', say: "That's a problem?" }, { by: 'a', say: "For my heart, yes." }] },
    { turns: [{ by: 'b', say: "Do I get the date now? The one you promised?" }, { by: 'a', say: "The minute we're out of here." }], beat: '{a} and {b} cannot stop smiling.' },
  ]),
  ...E('meet.talk.flirt.awkward', [
    { turns: [{ by: 'a', say: "So. Hi." }, { by: 'b', say: "Hi. This is... different from the messages." }], beat: '{a} and {b} do a handshake that turns into half a hug.' },
    { turns: [{ by: 'b', say: "Well. The chemistry was very strong through a screen." }, { by: 'a', react: "Yeah. I think we were better at typing." }] },
    { turns: [{ by: 'a', say: "Okay, I'll say it. I thought this would feel different." }, { by: 'b', say: "Me too. Friends?" }, { by: 'a', say: "Friends." }] },
    { turns: [{ by: 'a', say: "So we're definitely friends, right?" }, { by: 'b', say: "Definitely friends. Totally friends." }], beat: 'They both laugh a little too hard.' },
    { turns: [{ by: 'b', say: "You're taller than I thought." }, { by: 'a', react: "Is that good?" }, { by: 'b', say: "It's... information." }] },
  ]),
  ...E('meet.talk.rival.clear', [
    { turns: [{ by: 'a', say: "Can we just squash it? It's over now." }, { by: 'b', say: "Yeah. In real life, I think I'd actually like you." }] },
    { turns: [{ by: 'b', say: "So. We had some moments." }, { by: 'a', say: "We did. It was the game. No hard feelings?" }, { by: 'b', say: "No hard feelings." }], beat: '{a} and {b} shake hands, then hug.' },
    { turns: [{ by: 'a', say: "I was so mad at you for so long." }, { by: 'b', say: "And now?" }, { by: 'a', say: "Now I'm too tired. Come here." }] },
    { turns: [{ by: 'b', say: "I'll be honest, you were a great player." }, { by: 'a', say: "So were you. That's why we fought." }] },
    { turns: [{ by: 'a', say: "Truce?" }, { by: 'b', say: "Truce. And maybe a drink later." }], beat: '{a} and {b} bump fists.' },
  ]),
  ...E('meet.talk.rival.clash', [
    { turns: [{ by: 'a', say: "Funny. You look exactly like someone who'd throw me under the bus." }, { by: 'b', say: "And you look exactly like someone who'd deserve it." }], beat: 'The room goes very quiet.' },
    { turns: [{ by: 'b', say: "I'm not going to pretend we're friends." }, { by: 'a', say: "Good. Neither am I." }] },
    { turns: [{ by: 'a', say: "Oh, so you're {b}." }, { by: 'b', react: "Wow. Okay. Nice to meet you too." }], beat: '{a} and {b} keep to opposite ends of the room.' },
    { turns: [{ by: 'b', say: "I see the profile picture lied about the attitude too." }, { by: 'a', react: "Excuse me?" }], beat: 'Somebody steps between them.' },
    { turns: [{ by: 'a', say: "You said a lot of things about me in there." }, { by: 'b', say: "And I'd say them again." }] },
  ]),
  ...E('meet.talk.ally', [
    { turns: [{ by: 'a', react: "My partner! My day one!" }, { by: 'b', say: "We did it. We actually did it." }], beat: '{a} and {b} jump up and down together.' },
    { turns: [{ by: 'b', say: "Every night I checked on you before I went to bed." }, { by: 'a', say: "And I checked on you. We had each other's backs the whole time." }] },
    { turns: [{ by: 'a', say: "Final four, final three, whatever it is, it's us." }, { by: 'b', say: "It was always us." }] },
    { turns: [{ by: 'b', react: "There you are!" }, { by: 'a', say: "I'd know that laugh anywhere. Come here." }], beat: '{a} and {b} hug and spin around.' },
    { turns: [{ by: 'a', say: "I'm so glad you're exactly who you said you were." }, { by: 'b', say: "And you're even better." }] },
  ]),
  ...E('meet.talk.kin', [
    { turns: [{ by: 'a', react: "My {q}! My {q} made the final!" }, { by: 'b', say: "We both did! Mom is going to lose her mind." }], beat: '{a} and {b} hold on to each other.' },
    { turns: [{ by: 'a', say: "Weeks in the same building, and I couldn't even knock on your door." }, { by: 'b', say: "Now we never have to text each other again." }] },
    { turns: [{ by: 'b', say: "Whatever happens tonight, one of us did good." }, { by: 'a', say: "Both of us did good. That's my {q}." }] },
    { turns: [{ by: 'a', react: "Get over here!" }, { by: 'b', say: "Do you know how hard it was not to message you every day?" }], beat: '{a} lifts {b} off the ground.' },
    { turns: [{ by: 'b', say: "We have so much to tell everyone at home." }, { by: 'a', say: "They watched it all. We have so much to explain." }] },
  ]),
  ...E('meet.talk.kin.tense.thaw', [
    { turns: [{ by: 'a', say: "I didn't think we'd ever be in the same room again." }, { by: 'b', say: "Me neither. It's... not terrible." }] },
    { turns: [{ by: 'b', say: "Maybe we can talk. After this. Properly." }, { by: 'a', say: "Yeah. I'd like that." }], beat: '{a} and {b} share a small, careful smile.' },
    { turns: [{ by: 'a', say: "The Circle made me miss you a little. Don't make it weird." }, { by: 'b', react: "Too late. It's weird." }] },
  ]),
  ...E('meet.talk.kin.tense.cold', [
    { turns: [{ by: 'a', say: "Of course you made the final." }, { by: 'b', say: "Nice to see you too." }], beat: '{a} and {b} do not hug.' },
    { turns: [{ by: 'b', say: "We don't have to do this here." }, { by: 'a', say: "Good. Because I'm not going to." }] },
    { turns: [{ by: 'a', react: "Great. My {q}." }, { by: 'b', say: "Let's just get through tonight." }] },
  ]),
  ...E('meet.all', [
    { turns: [{ by: 'a', say: "Everybody. Look at us. All real. Well, mostly real." }, { by: 'b', react: "To the Circle!" }, { by: 'c', say: "To the Circle!" }], beat: 'Glasses go up, and somebody spills theirs immediately.' },
    { turns: [{ by: 'b', say: "Can we just take a second? We actually did this." }, { by: 'a', say: "Whatever happens tonight, this was the best thing I've ever done." }], beat: 'The finalists pile together on the couch.' },
    { turns: [{ by: 'c', say: "Okay, group hug. Real faces only." }, { by: 'a', react: "Get in here!" }], beat: 'Everyone piles in, laughing and crying at the same time.' },
  ]),

  ...E('meet.reflect', [
    { turns: [{ by: 'a', say: "I talked to these people every single day, and I'm only seeing their faces now. It's wild." }] },
    { turns: [{ by: 'a', say: "Some of you are exactly who I pictured. Some of you, absolutely not." }], beat: 'The room laughs.' },
    { turns: [{ by: 'a', say: "Whatever the board says tonight, this right here is the prize." }] },
    { turns: [{ by: 'a', say: "I didn't think I'd cry today. I've cried four times already." }], beat: '{a} wipes {a.posAdj} eyes and laughs.' },
    { turns: [{ by: 'a', say: "I'm keeping all of you. You're stuck with me now." }] },
    { turns: [{ by: 'a', say: "Weeks of typing to a TV, and it was all for this room." }] },
  ]),

  // ── Finale night ──────────────────────────────────────────────────
  ...E('reveal.open', [
    host("Welcome to the finale of The Circle! Tonight, one of our finalists wins it all."),
    host("It's finale night. Everybody who was blocked is here, the finalists are here, and in a few minutes we find out who won."),
    host("Good evening and welcome to finale night. The ratings are in. Nobody on that couch knows how this ends."),
  ]),
  ...E('studio.confront', [
    { turns: [{ by: 'host', say: "{a}, you're sitting right across from the person who blocked you." }, { by: 'a', say: "Oh, I know. Hi, {b}." },
      { by: 'b', say: "It was a game move. I hope you know that." }, { by: 'a', say: "I know. Still hurt, though." }] },
    { turns: [{ by: 'host', say: "{a}, anything you want to say to {b}?" }, { by: 'a', say: "Just that I saw it coming. You weren't as subtle as you think." },
      { by: 'b', react: "Okay. That's fair." }], beat: 'The audience laughs.' },
    { turns: [{ by: 'a', say: "{b}, I've had a lot of time to think about it." }, { by: 'b', say: "And?" }, { by: 'a', say: "And I'd have done the same thing. Respect." }] },
  ]),
  ...E('studio.cheer', [
    { turns: [{ by: 'a', say: "{b}, I'm screaming for you. Whatever happens, you already won to me." }, { by: 'b', react: "Stop, you're going to make me cry on camera." }] },
    { turns: [{ by: 'host', say: "{a}, who are you rooting for?" }, { by: 'a', say: "{b}. Obviously. Since day one." }] },
    { turns: [{ by: 'a', react: "{b}! That's my favorite person in this whole room!" }], beat: '{b} blows a kiss across the studio.' },
  ]),
  ...E('reveal.board', [
    host("Finalists, your final ratings are in. Let's find out where you placed."),
    host("It's time. The final ratings, from last place to first."),
    host("This is the moment. Every rating from this season comes down to tonight's board."),
  ]),
  ...E('reveal.suspense', [
    host("The next name on the board is..."),
    host("Finishing next..."),
    host("And the next place goes to..."),
    host("Finalists, hold hands if you need to. The next name is..."),
  ]),
  ...E('reveal.react.proud', [
    { turns: [{ by: 'a', say: "Honestly? I'll take it. I'm proud of every day I spent in there." }] },
    { turns: [{ by: 'a', react: "That's okay! That's okay. I made the final!" }], beat: '{a} claps along with everybody else.' },
    { turns: [{ by: 'a', say: "Right where I thought I'd be. No regrets." }] },
    { turns: [{ by: 'a', say: "I'm good with that. I came in as a stranger and I'm leaving with friends." }] },
    { turns: [{ by: 'a', react: "Hey! Not bad!" }], beat: '{a} throws both arms up and gets a cheer from the audience.' },
  ]),
  ...E('reveal.react.surprised', [
    { turns: [{ by: 'a', react: "Wait, that high? Me?" }, { by: 'a', say: "I thought I'd be last. I really did." }] },
    { turns: [{ by: 'a', react: "Oh my God. You guys actually liked me!" }], beat: '{a} laughs with both hands on {a.posAdj} head.' },
    { turns: [{ by: 'a', say: "That's way better than I expected. Thank you, everybody." }] },
    { turns: [{ by: 'a', react: "Hold on, you put me THERE?" }], beat: '{a} looks around the couch in disbelief.' },
    { turns: [{ by: 'a', say: "I genuinely thought I'd go first. Thank you!" }] },
  ]),
  ...E('reveal.react.gutted', [
    { turns: [{ by: 'a', react: "Oh. Okay." }, { by: 'a', say: "I thought I had more people in my corner than that." }], beat: '{a} smiles, but it does not reach {a.posAdj} eyes.' },
    { turns: [{ by: 'a', say: "That one stings. I'm not going to lie." }] },
    { turns: [{ by: 'a', react: "Wow. That low." }, { by: 'a', say: "I guess I know who my friends really were." }] },
    { turns: [{ by: 'a', say: "Okay. I need to sit with that one." }], beat: '{a} stares at the board for a long moment.' },
    { turns: [{ by: 'a', react: "That's not where I thought I'd be." }, { by: 'a', say: "But I'm still proud of how I played." }] },
  ]),
  ...E('reveal.react.shocked', [
    { turns: [{ by: 'a', react: "A catfish, that high? You guys!" }, { by: 'a', say: "You liked the person behind the profile. That means everything." }] },
    { turns: [{ by: 'a', say: "Even after the reveal? I can't believe it." }], beat: '{a} wipes {a.posAdj} eyes.' },
    { turns: [{ by: 'a', react: "No way. No WAY." }, { by: 'a', say: "I was sure you'd all hate me once you met me." }] },
  ]),
  ...E('reveal.witness.smirk', [
    { turns: [{ by: 'a', react: "Hm. Karma's real." }], beat: '{a} sips a drink and says nothing else.' },
    { turns: [{ by: 'a', say: "I'm not saying I'm happy about it. I'm just not sad about it." }] },
    { turns: [{ by: 'a', react: "Well, well, well." }], beat: '{b} catches {a} smirking and rolls {b.posAdj} eyes.' },
  ]),
  ...E('reveal.witness.cheer', [
    { turns: [{ by: 'a', react: "Let's go, {b}! That's amazing!" }] },
    { turns: [{ by: 'a', say: "So proud of you. Seriously." }], beat: '{a} squeezes {b}’s hand.' },
    { turns: [{ by: 'a', react: "{b}! That's my person!" }], beat: 'The audience cheers with {a}.' },
  ]),
  ...E('reveal.final2', [
    { turns: [{ by: 'host', say: "Two finalists left. {a}. {b}. Please stand up." }], beat: '{a} and {b} stand, holding hands.' },
    { turns: [{ by: 'host', say: "{a} and {b}. One of you is about to win The Circle." }, { by: 'a', react: "I can't breathe." }, { by: 'b', react: "Me neither." }] },
    { turns: [{ by: 'host', say: "It's down to {a} and {b}. Whoever is not in second place..." }], beat: 'The host waits. And waits.' },
  ]),
  ...E('reveal.react.second', [
    { turns: [{ by: 'a', say: "Second place. I'm so happy for {b}. I really am." }], beat: '{a} hugs {b} tight.' },
    { turns: [{ by: 'a', react: "So close. So, so close." }, { by: 'a', say: "But if anyone deserved it, it's {b}." }] },
    { turns: [{ by: 'a', say: "Second out of everyone who walked in here? I'll take that home with pride." }] },
  ]),
  ...E('reveal.react.win', [
    { turns: [{ by: 'a', react: "Are you serious? ME? Are you SERIOUS?" }], beat: '{a} falls to {a.posAdj} knees as the confetti comes down.' },
    { turns: [{ by: 'a', react: "No. No way. Oh my God!" }], beat: 'Everyone rushes the couch.' },
    { turns: [{ by: 'a', react: "I won? I WON!" }], beat: '{a} cannot stop jumping.' },
  ]),
  ...E('reveal.speech', [
    { turns: [{ by: 'a', say: "I came in here wanting to be myself, and you all let me. Thank you." },
      { by: 'a', say: "{b}, I would not be standing here without you. This is half yours." },
      { by: 'a', say: "To everybody at home: be kind to people online. There's a real person behind every screen." }] },
    { turns: [{ by: 'a', say: "I'm shaking. Okay." }, { by: 'a', say: "Every single person in this room made my game. Even the ones who blocked me in their heads." },
      { by: 'a', say: "And {b}. You know what you did for me in there. Thank you." }] },
    { turns: [{ by: 'a', say: "I don't even know what to say. I just tried to be a good friend in there." },
      { by: 'a', say: "{b}, you kept me going on the days I wanted to quit." }, { by: 'a', say: "This is for my family. I'm coming home!" }] },
  ]),
  ...E('reveal.speech.catfish', [
    { turns: [{ by: 'a', say: "My name is {a.real}, and I played as {a}. You still picked me. I don't know what to say." },
      { by: 'a', say: "{b}, you were the one person I wished I could have told the truth to sooner." },
      { by: 'a', say: "The face wasn't mine. Everything else was." }] },
    { turns: [{ by: 'a', say: "You all met {a}. Tonight you met me. Thank you for liking both of us." },
      { by: 'a', say: "{b}, I owe you the biggest hug of my life." }, { by: 'a', say: "No more catfishing. I promise. Probably." }] },
    { turns: [{ by: 'a', say: "I hid behind a profile because I didn't think the real me could win this." },
      { by: 'a', say: "And now the real me is standing here. With all of you. {b}, thank you for believing in me." }] },
  ]),
  ...E('reveal.fan', [
    { turns: [{ by: 'host', say: "And the fans at home have voted. Your Fan Favorite of this season is {a}!" }, { by: 'a', react: "Me? The fans picked ME?" }], beat: 'The audience is on its feet.' },
    { turns: [{ by: 'host', say: "One more award tonight. The people watching at home loved one player most. {a}, you're the Fan Favorite!" }, { by: 'a', react: "Oh my God. Thank you, everybody!" }] },
    { turns: [{ by: 'host', say: "The audience has spoken. The Fan Favorite is {a}!" }, { by: 'a', say: "I don't even know what to say. I love you guys!" }] },
  ]),
};
