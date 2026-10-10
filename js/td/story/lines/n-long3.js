// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-long3.js — more versions of the moments that ran out over a season
// ══════════════════════════════════════════════════════════════════════
// Same keys and roles as the engine's moments (td/script/lines headers). Ids: 'nly.'.

export default {
  // a thanks b for something b did
  'long.friend.thanks.any': [
    { id: 'nly.t1', turns: [
      { beat: "{a} finds {b} washing up by the water and crouches down next to {b.obj}." },
      { by: 'a', say: "I never said thank you for the other day." },
      { by: 'b', say: "For what?" },
      { by: 'a', say: "For not letting me fall apart. You didn't have to stay up with me." },
      { by: 'b', say: "That's what you do, isn't it?" },
      { by: 'a', say: "Not out here. Out here most people would've let me." },
      { by: 'a', conf: "I don't have a lot of people I'd trust with my life in here. I've got one now." },
    ] },
    { id: 'nly.t2', turns: [
      { by: 'a', say: "Hey. This is for you." },
      { beat: "{a} hands {b} the last piece of fruit from breakfast." },
      { by: 'b', say: "That's yours." },
      { by: 'a', say: "It's a thank you. You carried me in that challenge and you didn't say a word about it." },
      { by: 'b', say: "I'm not going to say no to fruit." },
      { by: 'b', conf: "I didn't know what to say when {a} handed it over. Out here, giving away food is huge, and I got really emotional about a piece of fruit.", v: {"goofy":"Is this an engagement? I think {a} and I are engaged now. Through fruit."} },
    ] },
  ],
  // a pulls the camp back together after a bad day
  'long.friend.rally.any': [
    { id: 'nly.r1', when: { lost: true }, turns: [
      { beat: "Everyone's slumped around the fire after the loss. {a} stands up." },
      { by: 'a', say: "Okay. I know today was bad. I'm not going to pretend it wasn't." },
      { by: 'b', say: "Then sit down." },
      { by: 'a', say: "No, listen. We lost one. We didn't lose the game. Tomorrow we fix whatever went wrong." },
      { by: 'c', opt: true, say: "And what went wrong?" },
      { by: 'a', say: "Everything. Which means everything can get better." },
      { by: 'b', conf: "I wanted to stay miserable, and {a} wouldn't let me. That's either annoying or exactly what we needed." },
    ] },
    { id: 'nly.r2', when: { lost: true }, turns: [
      { by: 'a', say: "Can everybody stop looking at their feet for one second?" },
      { by: 'b', say: "We're tired." },
      { by: 'a', say: "I know. I'm tired too. But if we go to bed like this, we wake up like this, and we lose again." },
      { by: 'b', say: "So what, a pep talk?" },
      { by: 'a', say: "A pep talk, and then everybody gets the last of the hot water." },
      { by: 'b', say: "...Okay, that's a good pep talk." },
    ] },
  ],
  // a opens up to b
  'long.friend.open.any': [
    { id: 'nly.o1', turns: [
      { by: 'a', say: "Can I tell you why I'm really here?" },
      { by: 'b', say: "I thought it was the money." },
      { by: 'a', say: "The money's nice. But I've spent my whole life being the quiet one in the room, and I wanted to see if I could be something else." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And I'm still pretty quiet. But I'm louder than I was on day one." },
      { by: 'b', conf: "I've known {a} for weeks and I just met {a.obj} for the first time." },
    ] },
    { id: 'nly.o2', turns: [
      { beat: "{a} and {b} sit up late on the dock, after the fire's died down." },
      { by: 'a', say: "Do you ever feel like you're playing two games? The one out here, and the one in your head?" },
      { by: 'b', say: "All the time." },
      { by: 'a', say: "The one in my head is way harder. In my head, I'm always about to go home." },
      { by: 'b', say: "You're not going home." },
      { by: 'a', say: "Say that again. Slowly." },
    ] },
  ],
  // a lifts everyone's mood
  'long.friend.lift.any': [
    { id: 'nly.l1', turns: [
      { beat: "It's raining, and everybody's crammed inside the {quarters}, miserable. {a} starts humming." },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Singing. Join in. It's the only song I know all the words to." },
      { by: 'c', opt: true, say: "That's a commercial jingle." },
      { by: 'a', say: "And it slaps." },
      { beat: "By the third time through, half the {quarters} is singing it." },
      { by: 'b', conf: "We were soaking wet and starving, and somehow {a} had us singing about breakfast cereal." },
    ] },
  ],
  // a steadies b (spiralling / just rattled)
  'long.friend.mentor.any': [
    { id: 'nly.m1', turns: [
      { by: 'b', say: "I think I messed everything up today." },
      { by: 'a', say: "Okay. Walk me through it." },
      { by: 'b', say: "I said too much to the wrong person, and now everybody knows I'm worried." },
      { by: 'a', say: "Being worried isn't a crime. Everybody's worried." },
      { by: 'b', say: "Not everybody shows it." },
      { by: 'a', say: "Then tomorrow you show up calm, you help with the water, and you let them wonder." },
      { by: 'b', conf: "{a} talked me down in about two minutes. I have no idea how {a} does that, but I'm so glad {a} does." },
    ] },
  ],
  // a makes the whole camp laugh (b and c among them)
  'long.friend.laugh.any': [
    { id: 'nly.h1', turns: [
      { beat: "{a} walks into camp wearing a crown made of seaweed." },
      { by: 'b', say: "What is happening?" },
      { by: 'a', say: "I've been crowned. By the ocean. I am now your ruler of the sea." },
      { by: 'c', say: "You smell like low tide." },
      { by: 'a', say: "Royalty always smells like something." },
      { beat: "Even the people who were arguing ten minutes ago are laughing." },
    ] },
  ],
  // a and b, on bad terms, trade shots in front of everyone
  'long.cross.rival.any': [
    { id: 'nly.x1', turns: [
      { beat: "The two teams pass each other on the path to the challenge. {a} and {b} slow down at the same time." },
      { by: 'a', say: "Nice of you to show up." },
      { by: 'b', say: "Nice of you to keep losing, so we don't have to try very hard." },
      { by: 'a', say: "Enjoy it. It won't last." },
      { by: 'b', say: "That's what you said last time." },
      { by: 'a', conf: "There's somebody on that team I would love to beat more than I want to win. It's {b}. It's always {b}." },
    ] },
    { id: 'nly.x2', turns: [
      { by: 'b', say: "How's your team doing? Oh, wait, I already know." },
      { by: 'a', say: "Funny. Is that what you practised in the mirror this morning?" },
      { by: 'b', say: "I don't need to practise. I just tell the truth." },
      { by: 'a', say: "The truth is we're going to beat you today, and you're going to have to walk past me after." },
      { by: 'b', conf: "{a} talks a big game. One of these days {a} is going to have to back it up, and I'm going to be right there to watch." },
    ] },
  ],
  // a, outside or at the bottom of their alliance, sounds out b
  'long.talk.approach.outside': [
    { id: 'nly.a1', turns: [
      { beat: "{a} offers to help {b} carry water, which {a} has never done before." },
      { by: 'b', say: "This is new." },
      { by: 'a', say: "I'm trying new things. Like talking to people I don't usually talk to." },
      { by: 'b', say: "And what do you want to talk about?" },
      { by: 'a', say: "Honestly? Who you trust in here. Because I don't think it's the same people I trust, and I think that's interesting." },
      { by: 'b', conf: "{a} is fishing. I just can't tell yet if I'm the fish or if {a} wants me to help hold the rod." },
    ] },
  ],
  // b is in the same alliance: a sounds b out
  'long.talk.approach.inside': [
    { id: 'nly.a2', turns: [
      { by: 'a', say: "Can I ask you something about the group, just between us?" },
      { by: 'b', say: "Sure." },
      { by: 'a', say: "Do you feel like everybody in it is still on the same page?" },
      { by: 'b', say: "Why? Do you think somebody isn't?" },
      { by: 'a', say: "I don't know. That's why I'm asking you first." },
      { by: 'b', conf: "{a} came to me with doubts about our own group. Either {a} knows something, or {a} is testing me. I'd really like to know which one." },
    ] },
  ],
  // after-dark games
  'long.romance.night.kiss': [
    { id: 'nly.k1', turns: [
      { beat: "Somebody found an empty bottle, and now the whole camp is sitting in a circle around the fire." },
      { by: 'c', opt: true, say: "Spin it! Spin it!" },
      { beat: "The bottle wobbles to a stop, pointing straight at {b}. {a} spun it." },
      { by: 'a', say: "Okay. Rules are rules." },
      { by: 'b', say: "Rules are rules." },
      { beat: "It's a quick kiss. Then it isn't so quick. The whole circle loses its mind." },
      { by: 'c', opt: true, say: "That was NOT a game kiss! Everybody saw that!" },
      { by: 'a', say: "It was a completely normal game kiss." },
      { by: 'b', say: "Totally normal. Very normal. Can somebody else spin now, please?" },
      { by: 'b', conf: "That was supposed to be a game. It didn't feel like a game." },
    ] },
  ],
  'long.romance.night.never': [
    { id: 'nly.k2', turns: [
      { by: 'c', opt: true, say: "Never have I ever... had a crush on somebody in this game." },
      { beat: "Nobody moves. Then {a} slowly puts a finger down. Then {b} does too." },
      { by: 'c', opt: true, say: "Oh. Oh, okay. Interesting." },
      { by: 'a', say: "Don't look at me like that." },
      { by: 'b', say: "I'm not looking at you like anything." },
      { by: 'a', say: "You're looking at me like you want to know who it is." },
      { by: 'b', say: "And you're looking at me like you already know who mine is." },
      { beat: "Neither of them says anything else for the rest of the game." },
      { by: 'a', conf: "I wasn't going to tell anybody. Then {b} put a finger down at the exact same time, and now I can't stop thinking about it." },
    ] },
  ],
  // a trades b information for trust
  'long.trade.info.any': [
    { id: 'nly.i1', turns: [
      { by: 'a', say: "I'm going to tell you something, and I want something back." },
      { by: 'b', say: "That depends what it is." },
      { by: 'a', say: "There's a group of three you don't know about. They meet behind the {quarters} when everybody's at the water." },
      { by: 'b', say: "And what do you want?" },
      { by: 'a', say: "Your word that when they come for me, you won't help them." },
      { by: 'b', conf: "{a} just handed me something real. I'm going to keep my word, mostly because I want {a} to keep telling me things." },
    ] },
  ],
  'long.trade.info.idol': [
    { id: 'nly.i2', turns: [
      { by: 'a', say: "If I told you I knew who has an idol, what would that be worth to you?" },
      { by: 'b', say: "A lot. Who?" },
      { by: 'a', say: "Not so fast. What's it worth?" },
      { by: 'b', say: "My vote stays away from you for two votes." },
      { by: 'a', say: "Three." },
      { by: 'b', say: "Fine. Three." },
      { by: 'a', conf: "That information was worth three votes of safety. I'm basically running a bank now." },
    ] },
  ],
  // a keeps going against the odds; b sees it
  'long.life.underdog.driven': [
    { id: 'nly.u1', turns: [
      { by: 'b', say: "You're up early." },
      { by: 'a', say: "I'm practising the rope climb. I was the slowest one up it yesterday." },
      { by: 'b', say: "You were also the only one who didn't quit." },
      { by: 'a', say: "Not quitting doesn't win challenges." },
      { by: 'b', say: "It does eventually." },
      { by: 'b', conf: "{a} has the worst luck in this game and the most stubborn heart. I know which one I'd bet on." },
    ] },
  ],
  'long.life.underdog.unseen': [
    { id: 'nly.u2', turns: [
      { by: 'b', say: "Did you sort all the firewood by size?" },
      { by: 'a', say: "Somebody had to. It was a mess." },
      { by: 'b', say: "Nobody asked you to." },
      { by: 'a', say: "Nobody asks me to do anything. I just do it." },
      { by: 'b', conf: "I feel a little guilty, honestly. I've been treating {a} like the weakest one here, and {a} has been doing my chores for a week.", v: {"cruel":"{a} doing everybody's chores is great. Keep {a} around, I say. Until the end.","warm":"I want to give {a} a hug. Nobody has said thank you once, and I'm starting with me."} },
    ] },
  ],
};
