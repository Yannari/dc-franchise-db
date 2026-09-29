// The Influencers' Hangout (spec §9): the two of them, one private chat, one
// name to agree on. Data only. a and b are the Influencers; in `hangout.view.*`
// c is the Player they are discussing; in agree/yield/trade, a is the one
// who decided, b the one who gave way, and c the Player they will block.
export const HANGOUT = {
  'hangout.open': [
    { id: 'hangout.open.01', turns: [
      { by: 'a', react: "'Influencers, you will now meet in the Hangout.' Okay. Me and {b}. Let's go." },
      { by: 'a', send: "Hey partner {e:handshake} Crazy night huh" },
      { by: 'b', send: "Crazy is one word for it lol. You ready to do this?" },
      { by: 'a', send: "Not even a little bit" },
    ] },
    { id: 'hangout.open.02', turns: [
      { by: 'a', send: "Well well well. Look who's an Influencer {e:crown}" },
      { by: 'b', react: "Okay, {a}, keep it cute.", send: "Look at us!! Okay but this is the hard part" },
      { by: 'a', send: "The hardest part. Let's just be honest with each other" },
    ], beat: '{b} pulls a pillow onto {b.posAdj} lap and hugs it.' },
    { id: 'hangout.open.03', turns: [
      { by: 'a', say: "I have to be careful. Whatever I say in here, {b} can repeat.", send: "Hey {b}! First of all congrats {e:party}" },
      { by: 'b', send: "You too!! Now the not fun part {e:sweat}" },
    ] },
    { id: 'hangout.open.04', turns: [
      { by: 'a', send: "Okay. Before we say any names. How are you feeling?" },
      { by: 'b', send: "Honestly? Like I'm gonna throw up" },
      { by: 'a', send: "Same {e:laugh} Let's go one by one" },
    ] },
  ],
  'hangout.view.fake.cut': [
    { id: 'hangout.view.fake.cut.01', turns: [
      { by: 'a', say: "I have to say it.", send: "Can I be real? Something about {c} doesn't feel real to me" },
      { by: 'b', react: "Oh, thank God. I thought it was just me.", send: "YES. The pictures, the way {c.sub} talks. It doesn't match" },
      { by: 'a', send: "If {c.sub}'s a catfish, {c.sub}'s playing all of us" },
    ] },
    { id: 'hangout.view.fake.cut.02', turns: [
      { by: 'a', send: "What's your read on {c}?" },
      { by: 'b', send: "Honestly? I think {c.sub}'s a catfish {e:fish}" },
      { by: 'a', react: "I knew it.", send: "Every answer is too perfect. Nobody's that perfect" },
    ], beat: '{a} nods at the screen, slowly.' },
    { id: 'hangout.view.fake.cut.03', turns: [
      { by: 'a', send: "My gut says {c} is not who {c.sub} says {c.sub} is" },
      { by: 'b', react: "Hm. That's a big thing to say.", send: "I've had the same feeling. I just didn't want to say it first" },
    ] },
  ],
  'hangout.view.threat.cut': [
    { id: 'hangout.view.threat.cut.01', turns: [
      { by: 'a', send: "Let's talk about {c}. {c.Sub}'s friends with literally everyone" },
      { by: 'b', send: "That's what scares me. {c.Sub}'s gonna be up here every single time" },
      { by: 'a', react: "Exactly. If not now, when?" },
    ] },
    { id: 'hangout.view.threat.cut.02', turns: [
      { by: 'a', say: "I like {c}. But I'm not here to make friends. I'm here to win.", send: "I love {c} but {c.sub} is a huge threat" },
      { by: 'b', send: "Everybody loves {c.obj}. That's the problem" },
    ] },
    { id: 'hangout.view.threat.cut.03', turns: [
      { by: 'a', send: "{c} is running this game and nobody's saying it out loud" },
      { by: 'b', react: "Oof. Okay. Yeah.", send: "I've been thinking the same thing {e:eyes}" },
    ] },
  ],
  'hangout.view.grudge.cut': [
    { id: 'hangout.view.grudge.cut.01', turns: [
      { by: 'a', say: "I'm not gonna pretend I like {c}.", send: "Not gonna lie, {c} and I are not good right now" },
      { by: 'b', send: "Oh I've seen it lol. What happened?" },
      { by: 'a', send: "Let's just say I don't trust {c.obj} anymore" },
    ] },
    { id: 'hangout.view.grudge.cut.02', turns: [
      { by: 'a', send: "Honestly {c} has been coming at me for days" },
      { by: 'b', react: "Is this personal? This feels personal.", send: "Is this a game move or a personal thing?" },
      { by: 'a', send: "Both {e:side}" },
    ] },
    { id: 'hangout.view.grudge.cut.03', turns: [
      { by: 'a', send: "I can't keep playing next to {c}. I just can't" },
      { by: 'b', send: "I hear you. {c.Sub} hasn't been great to me either" },
    ] },
  ],
  'hangout.view.noBond.cut': [
    { id: 'hangout.view.noBond.cut.01', turns: [
      { by: 'a', send: "Real talk, I barely know {c}" },
      { by: 'b', send: "Same. We've talked like once" },
      { by: 'a', react: "That's not a reason to block somebody. But it's not a reason to keep them, either." },
    ] },
    { id: 'hangout.view.noBond.cut.02', turns: [
      { by: 'a', send: "{c} is sweet but I don't have a connection there" },
      { by: 'b', send: "It's a numbers game. We have to protect our people" },
      { by: 'a', send: "{c} isn't anybody's people {e:sad}" },
    ], beat: '{a} winces as the message sends.' },
    { id: 'hangout.view.noBond.cut.03', turns: [
      { by: 'a', say: "This feels awful. I don't even know {c}.", send: "What has {c} actually said to you?" },
      { by: 'b', send: "Honestly? Nothing. Which kind of says something" },
    ] },
  ],
  'hangout.view.noBond.keep': [
    { id: 'hangout.view.noBond.keep.01', turns: [
      { by: 'a', send: "What about {c}?" },
      { by: 'b', send: "{c} is cool. I don't want {c.obj} gone" },
      { by: 'a', send: "Agreed. {c} is safe" },
    ] },
    { id: 'hangout.view.noBond.keep.02', turns: [
      { by: 'a', send: "I'm protecting {c}. Not negotiable" },
      { by: 'b', react: "Okay. So that's {a}'s person.", send: "Noted {e:laugh} Next" },
    ] },
    { id: 'hangout.view.noBond.keep.03', turns: [
      { by: 'b', send: "{c}?" },
      { by: 'a', send: "Not {c}. {c.Sub}'s been good to me" },
      { by: 'b', send: "Fair enough" },
    ] },
    { id: 'hangout.view.noBond.keep.04', turns: [
      { by: 'a', send: "Can we take {c} off the table? {c.Sub}'s not a threat to either of us" },
      { by: 'b', send: "Yeah. Off the table" },
    ] },
    { id: 'hangout.view.noBond.keep.05', turns: [
      { by: 'a', react: "Please don't say {c}. Please don't say {c}.", send: "Where are you at with {c}?" },
      { by: 'b', send: "Love {c.obj}. I'm not blocking {c.obj}" },
      { by: 'a', react: "Thank God." },
    ] },
  ],
  'hangout.agree': [
    { id: 'hangout.agree.01', turns: [
      { by: 'a', send: "So we're saying {c}?" },
      { by: 'b', send: "We're saying {c}. I hate it but yeah" },
      { by: 'a', send: "Same page. Let's do it {e:handshake}" },
    ], beat: '{a} lets out a long breath.' },
    { id: 'hangout.agree.02', turns: [
      { by: 'a', send: "On three we both type the name" },
      { by: 'b', send: "{c}" },
      { by: 'a', send: "{c}. Wow. Okay {e:shock}" },
    ], beat: 'In two apartments, two people laugh out of pure nerves.' },
    { id: 'hangout.agree.03', turns: [
      { by: 'a', say: "Thank God we agree. I did not want to fight about this.", send: "It has to be {c}. We both know it" },
      { by: 'b', send: "It has to be {c}" },
    ] },
  ],
  'hangout.yield': [
    { id: 'hangout.yield.01', turns: [
      { by: 'b', send: "I don't love it, but if you really feel that strongly about {c}, I'll go with you" },
      { by: 'a', send: "I really do. Thank you for trusting me" },
      { by: 'b', react: "{a} owes me one. A big one." },
    ] },
    { id: 'hangout.yield.02', turns: [
      { by: 'a', send: "I can't block the person you want. I just can't. It has to be {c}" },
      { by: 'b', react: "Okay. Fine. I'm not gonna win this one.", send: "Okay. {c}. But you owe me" },
    ], beat: '{b} closes {b.posAdj} eyes and shakes {b.posAdj} head.' },
    { id: 'hangout.yield.03', turns: [
      { by: 'b', say: "If I fight {a} on this, I make an enemy. I'll give it to {a.obj}.", send: "Okay. I'll trust your gut on {c}" },
      { by: 'a', send: "You won't regret it {e:heart}" },
    ] },
  ],
  'hangout.trade': [
    { id: 'hangout.trade.01', turns: [
      { by: 'a', send: "Okay how about this. We block {c}, and next time you get to pick" },
      { by: 'b', react: "A deal. Okay. Let's hear it.", send: "Deal. But you're keeping your word" },
      { by: 'a', send: "Always {e:handshake}" },
    ] },
    { id: 'hangout.trade.02', turns: [
      { by: 'b', send: "If we go {c}, I need you to keep my people safe next time" },
      { by: 'a', send: "Done. Your people are my people" },
      { by: 'b', react: "We'll see about that." },
    ] },
    { id: 'hangout.trade.03', turns: [
      { by: 'a', say: "Give a little to get a little.", send: "I'll give you {c} if you put me first next Ratings" },
      { by: 'b', send: "Ha. Okay. Deal {e:handshake}" },
    ] },
  ],
  'hangout.pact': [
    { id: 'hangout.pact.01', turns: [
      { by: 'a', send: "Real quick before we go. You and me, we look out for each other from now on?" },
      { by: 'b', send: "You and me. For real {e:handshake}" },
    ], beat: '{a} fist-pumps where the camera can see it.' },
    { id: 'hangout.pact.02', turns: [
      { by: 'b', send: "I feel like we make a good team" },
      { by: 'a', send: "We do. Let's keep it going. Alliance? {e:eyes}" },
      { by: 'b', send: "Alliance {e:heart}" },
    ] },
    { id: 'hangout.pact.03', turns: [
      { by: 'a', say: "{b} is someone I want next to me in this game.", send: "Whatever happens next, I have your back" },
      { by: 'b', send: "And I have yours. Promise" },
    ] },
  ],
};
