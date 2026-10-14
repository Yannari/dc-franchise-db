// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-witness.js — the people watching a fight (td/story/witness.js)
// ══════════════════════════════════════════════════════════════════════
// Said in the middle of somebody else's argument (a fight, blame, a prank, a power struggle, a row over food), so
// nothing here names what it is about. Roles:
//   witness.side    c backs a against b
//   witness.turned  c backs a against b, and b is c's friend: it costs c something to say it
//   witness.defend  a was on the receiving end of b (a jab, a threat, a prank); c stands up for a
//   witness.join    a was doing it to b; c goes along with a
//   witness.out     a and b are going at it; c won't take a side, and may get pulled in anyway
//   witness.after.<side|turned|out>  the morning after: a was let down by b (b backed {other} against a, or b
//                   stayed out while a and {other} went at it)
// Ids: 'nwt.'.
export default {
  'witness.side.any': [
    { id: 'nwt.s1', turns: [
      { by: 'c', say: "{b}, honestly, back off. {a} doesn't deserve that.", v: { tough: "{b}, that's enough. Leave {a.obj} alone.", anxious: "Um, {b}? I think maybe that's enough? {a} didn't do anything." } },
      { by: 'b', say: "Nobody asked you, {c}." },
      { by: 'c', say: "You didn't have to ask. I'm saying it anyway." },
    ] },
    { id: 'nwt.s2', turns: [
      { beat: "{c} steps in next to {a}." },
      { by: 'c', say: "I'm with {a} on this one, and I think most people here are.", v: { dry: "For the record, I'm with {a}. Somebody had to say it.", loud: "I'm with {a}! Sorry, {b}, but come on!" } },
      { by: 'b', say: "Of course you are." },
    ] },
    { id: 'nwt.s3', turns: [
      { by: 'c', say: "Can we stop pretending {a} started this? I watched the whole thing, {b}." },
      { by: 'b', say: "Then you watched it wrong.", v: { anxious: "I... think you watched it wrong." } },
      { by: 'c', say: "I don't think I did." },
    ] },
    { id: 'nwt.s4', turns: [
      { by: 'a', say: "Am I crazy, {c}? Tell me I'm not crazy." },
      { by: 'c', say: "You're not crazy. {b} is being completely unfair right now.", v: { warm: "You're not crazy. You're upset, and you've got every right to be.", cruel: "You're not crazy. {b} is just being {b}, as usual." } },
      { by: 'b', say: "Wow. Okay. Good to know where everybody stands." },
    ] },
    { id: 'nwt.s5', turns: [
      { by: 'c', say: "{b}, if you've got a problem with {a}, you've got a problem with me too." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'c', say: "It's a fact. Do what you want with it.", v: { warm: "It's just me telling you. I'm not going anywhere.", schemer: "It's information. Use it wisely." } },
    ] },
    { id: 'nwt.s6', turns: [
      { beat: "{c} has been listening from a few feet away, and finally can't stay quiet." },
      { by: 'c', say: "Okay, I've heard enough. {a} has a point, {b}, and you know it." },
      { by: 'b', say: "I know you'd say that. You always take {a.posAdj} side." },
      { by: 'c', say: "I take the side that's right. Today it's {a}'s." },
    ] },
    { id: 'nwt.s7', turns: [
      { by: 'c', say: "Leave it, {a}. {b} isn't worth it." },
      { by: 'b', say: "Excuse me?" },
      { by: 'c', say: "You heard me. Come on, {a}, let's go." },
      { beat: "{c} walks off with {a}, and {b} is left standing there." },
    ] },
    { id: 'nwt.s8', turns: [
      { by: 'b', say: "{c}, back me up here." },
      { by: 'c', say: "Sorry, I can't, because I think {a} is right about this one." },
      { by: 'b', say: "Unbelievable." },
    ] },
  ],
  'witness.turned.any': [
    { id: 'nwt.t1', turns: [
      { by: 'b', say: "{c}, come on. Tell {a.obj}." },
      { by: 'c', say: "I'm sorry, {b}. I love you, but you're wrong about this one.", v: { blunt: "No. You're my friend, and you're wrong, and I'm not going to pretend you're not.", anxious: "I... I'm sorry, {b}. I just don't think {a} is the one in the wrong here." } },
      { beat: "{b} stares at {c} like {c.sub} just switched teams." },
    ] },
    { id: 'nwt.t2', turns: [
      { by: 'c', say: "{b}, stop. I'm saying this as your friend: you're making this worse." },
      { by: 'b', say: "My friend? Then act like it." },
      { by: 'c', say: "I am. Somebody who wasn't your friend would let you keep going." },
    ] },
    { id: 'nwt.t3', turns: [
      { beat: "Everybody turns to look at {c}, because everybody knows {c} and {b} are close." },
      { by: 'c', say: "Don't look at me like that. {a} is right, and I'm not going to lie because it's {b}." },
      { by: 'b', say: "Thanks a lot, {c}.", v: { emotional: "Seriously, {c}? You too?" } },
      { by: 'c', conf: "I like {b}. I do. But I'm not going to stand there and agree with something I think is wrong, even for a friend." },
    ] },
    { id: 'nwt.t4', turns: [
      { by: 'b', say: "{c}, you know me. You know I wouldn't—" },
      { by: 'c', say: "I do know you, {b}, and that's why I know you're not being fair to {a} right now." },
      { by: 'b', say: "Wow." },
      { by: 'c', conf: "That's going to cost me with {b}. I said it anyway. If being friends means agreeing with everything, then we were never really friends." },
    ] },
  ],
  // one of them was doing it to the other (a jab, a threat, a prank, saying it out loud in front of everybody):
  // c stands up for a, on the receiving end, against b, who was doing it
  'witness.defend.any': [
    { id: 'nwt.d1', turns: [
      { by: 'c', say: "Okay, {b}, that's enough. Leave {a.obj} alone.", v: { anxious: "Hey, um, {b}? Maybe leave {a.obj} alone? Please?", loud: "{b}! Seriously! Leave {a.obj} alone!" } },
      { by: 'b', say: "Relax, I'm only joking around." },
      { by: 'c', say: "Nobody's laughing, though, are they?" },
    ] },
    { id: 'nwt.d2', turns: [
      { beat: "{c} walks over and stands next to {a} without being asked." },
      { by: 'c', say: "You good, {a}?" },
      { by: 'a', say: "Yeah. I'm fine." },
      { by: 'c', say: "Good. {b}, find somebody else to pick on.", v: { warm: "Good. Come and sit with us, {a}. Forget about it." } },
    ] },
    { id: 'nwt.d3', turns: [
      { by: 'c', say: "Do you actually enjoy this, {b}? Because it's really not a good look." },
      { by: 'b', say: "Who asked you?" },
      { by: 'c', say: "Nobody. I'm saying it anyway, because somebody should." },
      { by: 'c', conf: "I don't care whose side anybody's on out here. What {b} was doing to {a} was nasty, and I wasn't going to just watch." },
    ] },
    { id: 'nwt.d4', turns: [
      { by: 'c', say: "Funny how you only do this when there's an audience, {b}." },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'c', say: "It means everybody can see what you're doing, so you can stop now." },
    ] },
  ],
  // c goes along with a, the one doing it, at b's expense
  'witness.join.any': [
    { id: 'nwt.j1', turns: [
      { beat: "{c} laughs, a little too loudly." },
      { by: 'b', say: "Oh, great, you think this is funny too?" },
      { by: 'c', say: "Come on, {b}, you have to admit it's a bit funny.", v: { cruel: "It is funny. You should see your face right now.", anxious: "Sorry! Sorry. It's not funny. It's a little bit funny." } },
      { by: 'c', conf: "Was it mean? Maybe. But {a} isn't wrong about {b}, and I'm not going to pretend I didn't laugh." },
    ] },
    { id: 'nwt.j2', turns: [
      { by: 'c', say: "I mean, {a} has a point, {b}." },
      { by: 'b', say: "Of course you'd say that." },
      { by: 'a', say: "See? It's not just me." },
      { beat: "{b} looks around for somebody else, and nobody steps up." },
    ] },
    { id: 'nwt.j3', turns: [
      { by: 'b', say: "{c}, are you seriously going to let {a.obj} talk to me like that?" },
      { by: 'c', say: "Honestly? I'm staying out of the part where you're both loud, but {a} isn't wrong." },
      { by: 'b', say: "Unbelievable." },
      { by: 'b', conf: "Fine. Now I know {c} is with {a}. Good to know before the vote." },
    ] },
    { id: 'nwt.j4', turns: [
      { by: 'c', say: "Sorry, {b}, but {a} kind of has a point." },
      { by: 'b', say: "Wow. Thanks a lot, {c}, that really helps." },
      { by: 'c', conf: "I'm not trying to pile on. {a} just said what half of us were thinking." },
    ] },
    { id: 'nwt.j5', turns: [
      { beat: "{c} nods along while {a} talks." },
      { by: 'b', say: "Are you seriously nodding right now, {c}?" },
      { by: 'c', say: "I'm not saying anything, I'm just listening." },
      { by: 'b', say: "You don't have to say anything, {c}. I can see you." },
      { by: 'b', conf: "{c} didn't say a word. {c} didn't have to. I saw which way {c}'s head was going." },
    ] },
  ],
  'witness.out.any': [
    { id: 'nwt.o1', turns: [
      { by: 'a', say: "{c}, you saw it. Tell {b.obj}." },
      { by: 'c', say: "Leave me out of this. I'm not picking a side.", v: { goofy: "I'm just here for the water, I swear.", schemer: "I'm Switzerland. Neutral. Please don't drag me in." } },
      { by: 'b', say: "Typical." },
    ] },
    { id: 'nwt.o2', turns: [
      { beat: "{c} picks up {c.posAdj} things and quietly moves further away." },
      { by: 'c', conf: "Not my fight. If I pick a side now, I've made an enemy for nothing, and I'm not doing that." },
    ] },
    { id: 'nwt.o3', turns: [
      { by: 'b', say: "{c}, what do you think?" },
      { by: 'c', say: "I think you should both go cool off before somebody says something they can't take back.", v: { blunt: "I think you're both being loud. That's what I think." } },
      { by: 'a', say: "That's not an answer." },
      { by: 'c', say: "It's the only one you're getting." },
    ] },
    { id: 'nwt.o4', turns: [
      { by: 'c', say: "Okay, I'm going to go stand literally anywhere else.", v: { anxious: "I'm just going to... go. Over there. Away from this.", dry: "This is lovely, but I'm going to go and look at a tree." } },
      { beat: "Nobody stops {c.obj}. {a} and {b} both notice {c.sub} left without saying a word for either of them." },
    ] },
    { id: 'nwt.o5', turns: [
      { by: 'c', conf: "When {a} and {b} go at each other like that, the smartest thing I can do is keep my mouth shut. I just hope neither of them noticed how quiet I was." },
    ] },
  ],
  // the morning after: a was let down by b
  'witness.after.side.any': [
    { id: 'nwa.s1', turns: [
      { by: 'a', say: "So, yesterday. You and {other}." },
      { by: 'b', say: "I said what I thought. That's all." },
      { by: 'a', say: "In front of everybody, though. You could have said it to me later." },
      { by: 'b', say: "I could have. I didn't think it should wait.", v: { warm: "You're right, I could have. I'm sorry it happened like that.", tough: "If you didn't want an audience, you shouldn't have started it in front of one." } },
      { by: 'a', conf: "{b} picked {other} over me in front of the whole camp. I'll remember that when it's my turn to pick." },
    ] },
    { id: 'nwa.s2', turns: [
      { beat: "{a} is waiting when {b} comes back from the water." },
      { by: 'a', say: "I didn't know you and {other} were that close." },
      { by: 'b', say: "It's not about being close. You were out of line yesterday." },
      { by: 'a', say: "And you just had to be the one to say it." },
      { by: 'b', say: "Somebody did." },
      { by: 'b', conf: "{a} wants me to say sorry for agreeing with {other}. I'm not going to. I'd do it again." },
    ] },
    { id: 'nwa.s3', turns: [
      { by: 'a', say: "Can I ask you something? Why {other}?" },
      { by: 'b', say: "What do you mean?" },
      { by: 'a', say: "Yesterday, when it all kicked off, you went straight to {other}'s side. I'm trying to work out what I did to you." },
      { by: 'b', say: "You didn't do anything to me. I just thought you were wrong." },
      { by: 'a', conf: "I keep a list in my head of who stood where. {b} is on it now, and not in a good place." },
    ] },
  ],
  'witness.after.turned.any': [
    { id: 'nwa.t1', turns: [
      { by: 'a', say: "I thought you were my friend." },
      { by: 'b', say: "I am your friend. That's why I said it." },
      { by: 'a', say: "Friends don't side with {other} against me in front of everybody." },
      { by: 'b', say: "Friends tell you when you're wrong. I'm sorry it hurt.", v: { tough: "Friends tell you the truth. I'm not apologising for that.", emotional: "I know. I've felt sick about it all night. I just couldn't agree with you." } },
      { by: 'a', conf: "Out of everybody here, it had to be {b}. I could take that from anyone else, but not from {b}." },
    ] },
    { id: 'nwa.t2', place: 'eat', turns: [
      { beat: "{a} doesn't sit with {b} at breakfast. {b} notices." },
      { by: 'b', say: "Are we okay?" },
      { by: 'a', say: "You took {other}'s side. So, no. Not really." },
      { by: 'b', say: "I wasn't taking a side. I just told you the truth." },
      { by: 'a', say: "Then you can have breakfast with the truth." },
      { by: 'b', conf: "I knew saying it would cost me something with {a}. I didn't think it would cost this much." },
    ] },
    { id: 'nwa.t3', turns: [
      { by: 'b', say: "Can we talk about yesterday?" },
      { by: 'a', say: "There's nothing to talk about. You picked {other}." },
      { by: 'b', say: "I didn't pick anybody. I told you what I thought, because I care about you." },
      { by: 'a', say: "Funny way of showing it." },
      { by: 'a', conf: "{b} keeps saying it was because {b} cares. Maybe. But {other} heard every word of it, and that's what I can't get past." },
    ] },
    { id: 'nwa.t4', turns: [
      { by: 'b', say: "You haven't said two words to me all morning." },
      { by: 'a', say: "I'm just tired, that's all." },
      { by: 'b', say: "This is about {other}, isn't it?" },
      { by: 'a', say: "You stood there and agreed with {other}. In front of everybody. Yeah, it's about that." },
      { by: 'b', conf: "I said what I thought, and now {a} is acting like I pushed {a.obj} off a cliff. I'm not taking it back." },
    ] },
    { id: 'nwa.t5', turns: [
      { by: 'a', say: "Just so you know, I'm still annoyed about yesterday." },
      { by: 'b', say: "I figured. You haven't looked at me since we woke up." },
      { by: 'a', say: "I'm not asking you to say sorry. I just want you to know I noticed." },
      { by: 'b', say: "Okay. That's fair, and I'm sorry it came out the way it did." },
      { by: 'a', conf: "I'm not going to make a big thing of it. I'm just going to remember it, and that's worse." },
    ] },
  ],
  'witness.after.out.any': [
    { id: 'nwa.o1', turns: [
      { by: 'a', say: "You were standing right there yesterday." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "And you didn't say a word. Not one." },
      { by: 'b', say: "It wasn't my fight.", v: { warm: "I didn't want to make it worse. I'm sorry. I should have said something.", schemer: "Getting involved wouldn't have helped either of us." } },
      { by: 'a', say: "It didn't have to be your fight. It just had to be me." },
      { by: 'a', conf: "With {other}, at least I know where I stand. With {b}, I honestly don't know any more." },
    ] },
    { id: 'nwa.o2', turns: [
      { by: 'b', say: "You're mad at me. I can tell." },
      { by: 'a', say: "I'm not mad. I'm just noticing who backs me up when it counts." },
      { by: 'b', say: "That's not fair. I didn't take {other}'s side." },
      { by: 'a', say: "You didn't take mine either." },
      { by: 'b', conf: "I stayed out of it to keep everybody happy, and now nobody is. Great plan." },
    ] },
    { id: 'nwa.o3', turns: [
      { beat: "{b} brings {a} a cup of water. {a} takes it without a word." },
      { by: 'b', say: "About yesterday. I should have said something." },
      { by: 'a', say: "Yeah. You should have." },
      { by: 'b', say: "Next time I will." },
      { by: 'a', say: "Let's hope there isn't a next time." },
      { by: 'a', conf: "{b} apologised, which is more than I expected. It doesn't change the fact that when {other} went for me, {b} just watched." },
    ] },
  ],
};
