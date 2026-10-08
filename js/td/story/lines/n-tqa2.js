// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tqa2.js — more questions at the vote (n-tqa.js has the header)
// ══════════════════════════════════════════════════════════════════════
// New topics here (tribal.js tribalQA):
//   tqa.immune     a is safe tonight; b (may be missing) is anybody else
//   tqa.outsider   nobody here is close to a; b is the closest a has
//   tqa.idol       people suspect a has an idol; b is the sharpest player sitting there
//   tqa.merge      the first vote as one tribe; a and b came from different tribes
//   tqa.endgame    six or fewer left; a is the most strategic, b a's closest
//   tqa.room       a question to the room; a, b and c answer (the boldest three)
// Ids: 'ntr.'.

export default {
  'tqa.confident.any': [
    { id: 'ntr.c1', turns: [
      { by: 'h', say: "{a}, if your name came up tonight, would it surprise you?" },
      { by: 'a', say: "Honestly? Yeah, it would. I've been good to everybody here.", v: { dry: "It'd surprise me, but I've been wrong before.", tough: "It'd surprise me, and then it'd make me really angry." } },
      { by: 'h', say: "Being good to everybody. Is that enough out here, {b}?" },
      { by: 'b', say: "It should be.", v: { schemer: "It's a good start." } },
    ] },
    { id: 'ntr.c2', turns: [
      { by: 'h', say: "{a}, you look relaxed. Why?" },
      { by: 'a', say: "Because I talked to people today, and everybody told me the same name, and it isn't mine." },
      { by: 'h', say: "Everybody told you the same thing. Does that ever worry you?" },
      { by: 'a', say: "Should it?" },
      { by: 'h', say: "I don't know. {b}, should it?" },
      { by: 'b', say: "I think {a} is fine.", v: { anxious: "I, um... I don't know, why are you asking me?" } },
    ] },
    { id: 'ntr.c3', turns: [
      { by: 'h', say: "{a}, if you had to bet on who goes home tonight, who's your bet?" },
      { by: 'a', say: "Not me, that's for sure. I'm not going to say a name, but I'm sleeping in camp tonight." },
      { beat: "{b} picks at a thread on {b.posAdj} sleeve." },
    ] },
  ],
  'tqa.scramble.any': [
    { id: 'ntr.s1', turns: [
      { by: 'h', say: "{a}, you've barely sat still since you got here. What's going on?" },
      { by: 'a', say: "What's going on is that people have been lying to me all day, and I know my name's being thrown around.", v: { emotional: "I'm scared, okay? I know my name is out there, and I don't know who to trust anymore." } },
      { by: 'h', say: "Do you have a name you'd rather see?" },
      { by: 'a', say: "{target}, and I said that to {target}'s face this afternoon, so I'm not saying anything new." },
      { by: 'b', say: "You did, and I told you what I thought about it." },
    ] },
    { id: 'ntr.s2', turns: [
      { by: 'a', say: "Can I say something before anyone asks me anything?" },
      { by: 'h', say: "Please." },
      { by: 'a', say: "If you vote me out tonight, you're keeping {target}, and {target} will turn on every single one of you. I'm just saying it out loud so nobody can pretend they didn't hear it." },
      { by: 'b', say: "That's a lot of words for somebody who's worried.", v: { calm: "Everybody can make up their own mind, {a}." } },
    ] },
  ],
  'tqa.sank.any': [
    { id: 'ntr.k1', when: { defends: true }, turns: [
      { by: 'h', say: "{b}, everybody saw {a} struggle today. Why are you shaking your head?" },
      { by: 'b', say: "Because one bad challenge doesn't tell you who someone is. {a} has done more around camp than anybody." },
      { by: 'a', say: "Thanks. I mean it." },
      { by: 'h', say: "Interesting. So {a} has a protector." },
    ] },
    { id: 'ntr.k2', when: { defends: false }, turns: [
      { by: 'h', say: "{a}, do you think the tribe will hold today against you?" },
      { by: 'a', say: "I'd hold it against me, if I'm honest. I'm just hoping they remember the rest of the week too.", v: { tough: "If they vote on one challenge, they're not thinking long-term." } },
      { by: 'b', say: "We remember the rest of the week." },
      { beat: "{b} doesn't say what exactly they remember." },
    ] },
  ],
  'tqa.leader.any': [
    { id: 'ntr.l1', turns: [
      { by: 'h', say: "{b}, if somebody's running this tribe, who is it?" },
      { by: 'b', say: "I mean, everybody here knows. {a} talks, and people listen." },
      { by: 'a', say: "People listen because I make sense, {b}. That's not running anything.", v: { schemer: "If I were running things, would I be sitting here getting called out?", tough: "Somebody has to make a call. I'm not sorry it's me." } },
      { by: 'h', say: "Does it bother you that {b} sees it that way?" },
      { by: 'a', say: "It bothers me that {b} said it out loud." },
    ] },
    { id: 'ntr.l2', turns: [
      { by: 'h', say: "{a}, you've been very quiet tonight. That's not like you." },
      { by: 'a', say: "I don't have anything to say. Everybody knows how I feel." },
      { by: 'b', say: "Everybody definitely knows how you feel, {a}. You told all of us." },
      { by: 'h', say: "Oh. So there was a conversation." },
      { by: 'a', say: "There are always conversations." },
    ] },
  ],
  'tqa.pair.any': [
    { id: 'ntr.p1', turns: [
      { by: 'h', say: "{a}, if you had to choose between {b} and a million dollars, what would you pick?" },
      { by: 'a', say: "Can I say both?", v: { warm: "Don't make me answer that. Seriously.", dry: "The money. Sorry, {b}. You understand." } },
      { by: 'b', say: "I'd pick you.", v: { goofy: "I'd pick the money, but I'd share some with you." } },
      { by: 'a', say: "Now I look terrible." },
    ] },
  ],
  'tqa.immune.any': [
    { id: 'ntr.i1', turns: [
      { by: 'h', say: "{a}, you can't go home tonight. Does that make the vote easier or harder?" },
      { by: 'a', say: "Harder, honestly. Everybody's been asking me what I'm doing all afternoon.", v: { schemer: "Easier. I get to watch everyone else sweat.", warm: "Harder. Somebody I like is going home, and I can't do anything about it." } },
      { by: 'b', opt: true, say: "You could tell us what you're doing." },
      { by: 'a', opt: true, say: "Nice try, {b}." },
    ] },
    { id: 'ntr.i2', turns: [
      { by: 'h', say: "{a}, you won immunity today. Does anybody here have a reason to be nervous about you?" },
      { by: 'a', say: "Everybody should be a little nervous. That's the game.", v: { anxious: "Me? No! I'm the least scary person here, immunity or not." } },
      { by: 'b', opt: true, say: "I was nervous before you won it." },
    ] },
  ],
  'tqa.outsider.any': [
    { id: 'ntr.o1', turns: [
      { by: 'h', say: "{a}, who do you trust out here?" },
      { by: 'a', say: "Honestly? I don't know. Maybe {b}, a little.", v: { tough: "Myself. That's the list.", anxious: "Is it bad if I don't really know? I'm trying." } },
      { by: 'h', say: "{b}, does {a} trust the right person?" },
      { by: 'b', say: "I've never lied to {a}.", v: { schemer: "I'd like to think so." } },
      { by: 'a', say: "That's not really an answer, but I'll take it." },
    ] },
    { id: 'ntr.o2', turns: [
      { by: 'h', say: "{a}, does it feel like you're on the outside of this tribe?" },
      { by: 'a', say: "It feels like everybody already had their friends before I got the chance to make any." },
      { by: 'b', say: "That's not fair. We tried to include you." },
      { by: 'a', say: "Tried. Sure." },
    ] },
  ],
  'tqa.idol.any': [
    { id: 'ntr.d1', turns: [
      { by: 'h', say: "There's been a lot of idol talk this week. {a}, are you the one people are talking about?" },
      { by: 'a', say: "People talk about everybody. I can't control what they say.", v: { loud: "Me? With an idol? I can barely find my own shoes!", calm: "If I had one, would I tell you?" } },
      { by: 'b', say: "That's not a no." },
      { by: 'a', say: "It's not a yes either, {b}." },
      { by: 'h', say: "Well, we'll find out soon enough, won't we?" },
    ] },
    { id: 'ntr.d2', turns: [
      { by: 'h', say: "{b}, if somebody here had an idol, who would it be?" },
      { by: 'b', say: "I'd look at {a}. {a} has been way too relaxed all week for somebody in {a.posAdj} position." },
      { by: 'a', say: "I'm relaxed because I sleep well. That's all.", v: { tough: "I'm relaxed because I'm not scared of you, {b}.", anxious: "I'm not relaxed! I'm terrified! Look at my hands!" } },
      { by: 'h', say: "Sleeping well. Is that what we're calling it?" },
    ] },
    { id: 'ntr.d3', turns: [
      { by: 'h', say: "{a}, people keep looking at your bag tonight. Do you know why?" },
      { by: 'a', say: "Because it's a nice bag.", v: { dry: "Because it's the only clean thing on this island." } },
      { by: 'b', say: "That's a very careful answer." },
      { by: 'a', say: "I'm a very careful person, {b}." },
    ] },
    { id: 'ntr.d4', turns: [
      { by: 'b', say: "Can I just say something? If anybody has an idol tonight, I hope they're smart enough to use it." },
      { by: 'h', say: "Are you talking to anyone in particular?" },
      { by: 'b', say: "No. Just thinking out loud." },
      { beat: "{a} doesn't look up from the fire." },
    ] },
  ],
  'tqa.merge.any': [
    { id: 'ntr.m1', turns: [
      { by: 'h', say: "First vote as one tribe. {a}, are the old tribes still a thing tonight?" },
      { by: 'a', say: "No. We're one tribe now. That's the whole point.", v: { schemer: "Officially? No. Unofficially, ask me after the votes." } },
      { by: 'h', say: "{b}, you came from the other side. Do you believe that?" },
      { by: 'b', say: "I believe {a} believes it. I'll wait and see what the votes say." },
    ] },
    { id: 'ntr.m2', turns: [
      { by: 'h', say: "{b}, how does it feel to finally sit next to the people you've been competing against?" },
      { by: 'b', say: "Weird. Some of them are really nice, which makes this so much harder." },
      { by: 'a', say: "We're not that nice. Don't get attached." },
    ] },
  ],
  'tqa.endgame.any': [
    { id: 'ntr.e1', turns: [
      { by: 'h', say: "We're getting close to the end. {a}, who do you want sitting next to you at the final?" },
      { by: 'a', say: "Whoever I can beat. That's the honest answer, isn't it?", v: { warm: "{b}. Because I'd want somebody I actually care about up there with me.", tough: "Nobody. I want to be up there alone." } },
      { by: 'b', say: "Wow. Thanks." },
      { by: 'a', say: "That wasn't about you!" },
      { by: 'b', say: "It kind of was." },
    ] },
    { id: 'ntr.e2', turns: [
      { by: 'h', say: "{a}, is this still about friendship, or is it purely about winning now?" },
      { by: 'a', say: "Both. It's always both. It's just that one of them matters more every day." },
      { by: 'b', say: "Which one?" },
      { by: 'a', say: "You know which one, {b}." },
    ] },
  ],
  'tqa.room.any': [
    { id: 'ntr.r1', turns: [
      { by: 'h', say: "Show of hands. Who here said something today they'd take back if they could?" },
      { beat: "Nobody moves. Then {a} slowly raises a hand." },
      { by: 'a', say: "I'm not saying what. I'm just being honest." },
      { by: 'b', say: "I know what it was." },
      { by: 'c', say: "Everybody knows what it was.", v: { goofy: "I don't know what it was, and now I really want to." } },
    ] },
    { id: 'ntr.r2', turns: [
      { by: 'h', say: "Quick one, and be honest. Is anybody here going in tonight without knowing how they're voting?" },
      { by: 'a', say: "No. I've known all day.", v: { anxious: "I... maybe. A little. Is that bad?" } },
      { by: 'b', say: "Same." },
      { by: 'c', say: "I've known since breakfast.", v: { dry: "I've known since day one. It's been a long wait." } },
      { by: 'h', say: "And yet somebody here is wrong." },
    ] },
    { id: 'ntr.r3', turns: [
      { by: 'h', say: "Everybody, one word for how today went. {a}?" },
      { by: 'a', say: "Long.", v: { loud: "Chaotic!", warm: "Hard. But okay." } },
      { by: 'b', say: "Suspicious.", v: { goofy: "Damp." } },
      { by: 'c', say: "Honestly? Eye-opening." },
      { by: 'h', say: "Eye-opening. I like that one. Somebody learned something today." },
    ] },
    { id: 'ntr.r4', turns: [
      { by: 'h', say: "Raise your hand if you think you might be going home tonight." },
      { beat: "{a} raises a hand straight away. After a second, {b} does too." },
      { by: 'h', say: "{c}, your hand is down. You feel safe?" },
      { by: 'c', say: "I feel fine. I'm not going to jinx it.", v: { tough: "I feel safe. I'm not going to pretend I don't." } },
    ] },
    { id: 'ntr.r5', turns: [
      { by: 'h', say: "If you could ask anybody here one question, and they'd have to answer honestly, who would you ask?" },
      { by: 'a', say: "{b}. And I'd ask where {b.sub} really went this afternoon." },
      { by: 'b', say: "I went to the bathroom, {a}." },
      { by: 'c', say: "For two hours?" },
    ] },
  ],
};
