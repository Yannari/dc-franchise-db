// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-morning3.js — the morning after a vote, as whole scenes
// ══════════════════════════════════════════════════════════════════════
//
// The long versions of the engine's morning moments (td/script/lines/fallout.js and blind.js have
// the meanings). The user, reading a played morning: "it starts super randomly", "we don't see the
// start". Each scene here opens on where they are and what they're doing, and ends on what changed.
//   long.fallout.mourn.one   a's ally {fallen} went home; b voted {fallen} out, and a knows
//   long.fallout.mourn.many  a's ally {fallen} went home; a knows who did it, and tells the camera
//   long.fallout.found.one   a found out b wrote a's own name last night
//   long.fallout.blame.*     the plan broke; a blames b, who in fact stayed loyal ('swapped': {plan}
//                            was meant to go and {boot} went; 'ally': {boot}, one of their own; 'broke')
//   long.fallout.flip.ally   a flipped against b, an ally still here; b is friendly; b doesn't know
//   long.blind.denial.any    b voted against a; a still treats b as an ally (only b's camera knows)
// Ids: 'nmx.'.

export default {
  'long.fallout.mourn.one': [
    { id: 'nmx.m1', turns: [
      { beat: "Breakfast. {b} slides along the bench to make room for {a}. {a} sits at the other end." },
      { by: 'b', say: "There's room here, you know." },
      { by: 'a', say: "I'm fine here." },
      { by: 'b', say: "Okay, you're obviously not fine. Is this about {fallen}?" },
      { by: 'a', say: "It's about who wrote {fallen}'s name.", v: { tough: "You know exactly what it's about.", quiet: "...You know what it's about." } },
      { by: 'b', say: "It was a vote. Everybody had to write somebody." },
      { by: 'a', say: "Everybody didn't have to write {fallen}." },
      { beat: "{a} picks up the bowl and goes to eat on the steps, alone." },
      { by: 'b', conf: "I knew {a} would be upset. I didn't think {a} would figure out it was me this fast." },
      { by: 'a', conf: "{fallen} was the one person here who had my back no matter what, and {b} took that from me. {b} can say it was just a vote all {b} wants." },
    ] },
    { id: 'nmx.m2', turns: [
      { by: 'b', say: "Hey, I'm really sorry about {fallen}, I know you two were close." },
      { by: 'a', say: "Are you?" },
      { by: 'b', say: "Of course I am." },
      { by: 'a', say: "Because I counted the votes last night, and I know how many people it took, and I know who was sitting next to who." },
      { by: 'b', say: "That doesn't mean anything." },
      { by: 'a', say: "Then look me in the eye and tell me you didn't write it." },
      { beat: "{b} opens {b.posAdj} mouth, then closes it again." },
      { by: 'a', say: "Yeah. That's what I thought.", v: { emotional: "I can't believe you. I actually can't believe you.", calm: "Okay, thanks for being honest. Sort of." } },
      { by: 'a', conf: "I don't need {b} to admit it. {b}'s face did that for {b.obj}." },
    ] },
  ],
  'long.fallout.mourn.many': [
    { id: 'nmx.n1', turns: [
      { beat: "Morning. {a} sits by {fallen}'s empty spot in the shelter, folding a shirt {fallen} left behind." },
      { by: 'a', conf: "{fallen} forgot this, and I think I'm going to keep it. That's stupid, isn't it?", v: { tough: "Whatever. It's just a shirt." } },
      { by: 'a', conf: "Everybody's acting like last night didn't happen. Everybody's smiling at breakfast. And I know at least half of them wrote {fallen}'s name." },
      { by: 'a', conf: "So I'm going to smile back. And I'm going to remember every single one of them.", v: { warm: "I'm not going to be bitter about it. I'm just going to play like {fallen} would've wanted me to, which is a lot smarter than I've been playing." } },
    ] },
  ],
  'long.fallout.found.one': [
    { id: 'nmx.f1', turns: [
      { beat: "{a} is waiting by the water pump when {b} comes down with the bottles." },
      { by: 'a', say: "Morning." },
      { by: 'b', say: "Morning! Sleep okay?" },
      { by: 'a', say: "Not really. I was busy thinking about who wrote my name last night." },
      { beat: "{b} keeps pumping the water a little too carefully." },
      { by: 'b', say: "People were all over the place last night." },
      { by: 'a', say: "Some people were, but you weren't. You knew exactly what you were doing." },
      { by: 'b', say: "I don't know what you think you heard.", v: { schemer: "If you're asking, the answer is it wasn't personal.", anxious: "I... okay, look, it wasn't, I didn't mean..." } },
      { by: 'a', say: "I didn't hear anything. I just watched your face when they read it." },
      { by: 'a', conf: "{b} wrote my name and went to bed like it was nothing. Fine. I've got a long memory and nothing to do all day." },
    ] },
    { id: 'nmx.f2', turns: [
      { by: 'a', say: "Can I ask you something, and you be honest with me?" },
      { by: 'b', say: "Sure." },
      { by: 'a', say: "Was it you? Last night?" },
      { by: 'b', say: "...Yeah. It was me.", v: { tough: "Yeah. And I'd do it again.", warm: "Yeah, and I'm sorry, I really am." } },
      { by: 'a', say: "Why?" },
      { by: 'b', say: "Because everybody else was voting for you, and I didn't want to be the only one who wasn't." },
      { by: 'a', say: "So you just went along." },
      { by: 'b', say: "I just went along, I know, and I'm not proud of it." },
      { by: 'a', conf: "At least {b} admitted it. Most people here would have lied to my face. That's almost worse, because now I can't even hate {b} properly." },
    ] },
  ],
  'long.fallout.blame.swapped': [
    { id: 'nmx.b1', turns: [
      { beat: "{a} corners {b} behind the shelter before breakfast." },
      { by: 'a', say: "It was supposed to be {plan}. We all said {plan}." },
      { by: 'b', say: "I know. I wrote {plan}." },
      { by: 'a', say: "Then how is {boot} the one who went home?" },
      { by: 'b', say: "I don't know! Somebody flipped, but it wasn't me." },
      { by: 'a', say: "Everybody says it wasn't them. That's the problem.", v: { tough: "Somebody's lying to me, and right now it looks like you.", anxious: "I just need to know who I can trust, and I don't know anymore." } },
      { by: 'b', say: "I wrote {plan}. I'll swear on anything you want." },
      { by: 'b', conf: "I did exactly what we planned, and now I'm the one getting blamed for it. Whoever really flipped is sitting at breakfast right now, laughing at both of us." },
    ] },
  ],
  'long.fallout.blame.ally': [
    { id: 'nmx.b2', turns: [
      { by: 'a', say: "We lost {boot}, one of our own. How does that even happen?" },
      { by: 'b', say: "Somebody in the group flipped." },
      { by: 'a', say: "Or somebody in the group talked. Did you tell anyone what we were doing?" },
      { by: 'b', say: "No! Why would I tell anyone?" },
      { by: 'a', say: "I don't know. I don't know anything this morning." },
      { by: 'b', say: "Then don't look at me like that. I'm the one who's still with you." },
      { by: 'a', conf: "{boot} is gone and I don't know who to blame, so I'm blaming everybody, including people who probably don't deserve it. I'll apologise when I know who does." },
    ] },
  ],
  'long.fallout.blame.broke': [
    { id: 'nmx.b3', turns: [
      { by: 'a', say: "So the plan fell apart." },
      { by: 'b', say: "It did." },
      { by: 'a', say: "You were in every conversation. Where did it go wrong?" },
      { by: 'b', say: "I wish I knew. Everyone was on board at dinner.", v: { calm: "It went wrong between dinner and the vote, which is two hours. That's a lot of time for people to change their minds." } },
      { by: 'a', say: "Somebody wasn't on board. Somebody just said they were." },
      { by: 'b', say: "Well, it wasn't me." },
      { by: 'a', conf: "I believe {b}. Probably. But 'probably' is exactly the word I used about the person who flipped." },
    ] },
  ],
  'long.fallout.flip.ally': [
    { id: 'nmx.x1', turns: [
      { beat: "{b} hands {a} a cup of something hot and sits down beside {a.obj} on the steps." },
      { by: 'b', say: "Here. You look like you didn't sleep either." },
      { by: 'a', say: "Thanks. I didn't, really." },
      { by: 'b', say: "Last night was crazy. I really thought I was going home." },
      { by: 'a', say: "Yeah, me too. For you, I mean." },
      { by: 'b', say: "I'm just glad we've got each other, seriously, that's the only thing keeping me sane out here." },
      { by: 'a', say: "Yeah. Same." },
      { by: 'a', conf: "I wrote {b}'s name last night. {b} just brought me breakfast. I don't think I've ever felt this guilty about anything in my whole life.", v: { schemer: "{b} has no idea I wrote that name. And honestly, it's better for both of us if it stays that way.", tough: "I did what I had to do. It doesn't mean I have to like sitting here while {b} thanks me for it." } },
    ] },
    { id: 'nmx.x2', turns: [
      { by: 'b', say: "Can I tell you something embarrassing? Last night, when they read my name, I looked straight at you." },
      { by: 'a', say: "Why me?" },
      { by: 'b', say: "Because I knew it wasn't you. You were the one person I didn't have to worry about." },
      { beat: "{a} looks down at the ground." },
      { by: 'a', say: "Yeah, well, I'm glad you're still here." },
      { by: 'b', say: "Me too. We go to the end together, right?" },
      { by: 'a', say: "...Right." },
      { by: 'a', conf: "That was my vote with {b}'s name on it. And {b} thinks I'm the only person here who'd never do that." },
    ] },
  ],
  'long.blind.denial.any': [
    { id: 'nmx.d1', turns: [
      { beat: "{a} drops down next to {b} on the dock, swinging {a.posAdj} legs over the water like nothing happened." },
      { by: 'a', say: "Okay, so somebody wrote my name last night, and I've narrowed it down." },
      { by: 'b', say: "Oh yeah? Who?", v: { anxious: "Oh. Oh, really? Who?" } },
      { by: 'a', say: "Not you, obviously. So that's one down, and everybody else to go." },
      { by: 'b', say: "That's... a good start." },
      { by: 'a', say: "You'll help me figure it out, right?" },
      { by: 'b', say: "Of course." },
      { by: 'b', conf: "{a} wants me to help find out who voted against {a.obj}. I'm the one who did it. I'm going to need a really good poker face this week." },
    ] },
  ],
};
