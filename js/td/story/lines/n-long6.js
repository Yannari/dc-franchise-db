// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-long6.js — every moment the engine stages, as a whole conversation
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-08, on "Thom: You're doing great! One more try! (Eureka gets it on the next
// try.)": "that's barely a conversation". Measured: these engine moments aired in their own one to
// four lines because no long version fit. Each version here is a scene with a start, a middle and
// a turn, venue-neutral (no dock, no beach, no fire: camp is camp) unless the kind belongs to one
// venue. Roles from the td/script/lines headers:
//   friend.teach    a teaches b                         friend.meal     a and b share food
//   friend.struggle a and b get through something hard  friend.secret   a tells b something real
//   friend.celebrate a starts it; b, c join in          friend.defend   a stands up for b
//   friend.drift    a quietly pulls away from b         cross.friend    a and b, other teams, friends anyway
//   crowd.dinner    a, b, c pick over the day           drama.thaw      rivals a and b soften
//   drama.showboat  a brags; b has to listen            drama.dig       a takes a passive-aggressive shot at b
//   drama.intimidate a unnerves b                       drama.mess      the Wawanakwa mess hall (hosted camp only)
//   villain.power   a, a villain, says who runs camp; b hears it
//   alliance.form   {group} is born                     talk.approach   a sounds b out
//   trade.info      a trades b information for trust
//   morning.*       the last day: open (a and b wake up), bond (closest pair), rival (worst pair),
//                   close (a and b walk out for the last time), reflect (a alone)
// Ids: 'nl6.'.

export default {
  'long.friend.teach.any': [
    { id: 'nl6.t1', turns: [
      { beat: "{b} has been trying the same thing for ten minutes. {a} finally walks over." },
      { by: 'a', say: "Can I show you something?" },
      { by: 'b', say: "Is it how to stop being terrible at this?" },
      { by: 'a', say: "Sort of. You're rushing it. Slow down at the start and the rest takes care of itself." },
      { by: 'b', say: "That's it?" },
      { by: 'a', say: "Try it." },
      { beat: "{b} tries it slowly. It works." },
      { by: 'b', say: "Oh, come on. That's so annoying." },
      { by: 'a', say: "You're welcome." },
      { by: 'b', say: "Why are you helping me, though? We're not exactly close." },
      { by: 'a', say: "Because if you get better, the team gets better. And because you looked like you were about to throw something." },
      { by: 'b', conf: "{a} fixed in two minutes what I'd been getting wrong all week. I owe {a.obj} one, and I hate owing people." },
    ] },
    { id: 'nl6.t2', when: { voice: ['warm', 'earnest', 'goofy'] }, turns: [
      { by: 'a', say: "You're doing great! One more try!" },
      { by: 'b', say: "I've done it twelve times. I'm not doing great." },
      { by: 'a', say: "You're doing great at trying. That's the first part." },
      { by: 'b', say: "What's the second part?" },
      { by: 'a', say: "Actually doing it. Go on. Watch my hands, not yours." },
      { beat: "{b} gets it on the next try. {a} cheers louder than {b} does." },
      { by: 'b', say: "Okay, okay, calm down, people are looking." },
      { by: 'a', say: "Let them look! You did it!" },
      { by: 'b', conf: "{a} celebrated me like I'd won the whole game. It was embarrassing. It was also the nicest thing anybody's done for me out here." },
    ] },
    { id: 'nl6.t3', when: { voice: ['tough', 'competitive', 'bossy'] }, turns: [
      { by: 'a', say: "Again." },
      { by: 'b', say: "My arms are shaking." },
      { by: 'a', say: "Then they're working. Again." },
      { by: 'b', say: "Are you training me or torturing me?" },
      { by: 'a', say: "Yes." },
      { beat: "{b} does it again, faster this time." },
      { by: 'a', say: "See? That's twice as fast as this morning." },
      { by: 'b', say: "I hate that you're right." },
      { by: 'b', conf: "{a} is a nightmare coach. I'm also way better than I was yesterday, so I guess I'll keep showing up." },
    ] },
  ],
  'long.friend.meal.any': [
    { id: 'nl6.m1', turns: [
      { beat: "{a} and {b} eat together, away from everybody else." },
      { by: 'b', say: "If you could have one meal right now, anything, what would it be?" },
      { by: 'a', say: "Don't do this to me." },
      { by: 'b', say: "Come on. One meal." },
      { by: 'a', say: "...A burger. A huge one, with everything on it, and fries, and a milkshake I don't need." },
      { by: 'b', say: "That's a good answer." },
      { by: 'a', say: "What's yours?" },
      { by: 'b', say: "Anything hot. Literally anything that's hot and isn't rice." },
      { by: 'a', say: "That's so sad, and I completely agree." },
      { by: 'a', conf: "We described food for half an hour. It was torture. It was also the best conversation I've had out here in days." },
    ] },
    { id: 'nl6.m2', turns: [
      { by: 'a', say: "Want the rest of mine?" },
      { by: 'b', say: "You haven't eaten anything." },
      { by: 'a', say: "I'm not hungry." },
      { by: 'b', say: "Nobody here is not hungry." },
      { by: 'a', say: "Okay, I'm hungry. You just look like you need it more." },
      { by: 'b', say: "Split it, then. Half each." },
      { by: 'a', say: "Deal." },
      { by: 'b', conf: "{a} tried to give me {a.posAdj} food. Out here, that's not a small thing. I'm going to remember that a lot longer than I remember what it tasted like." },
    ] },
  ],
  'long.friend.struggle.any': [
    { id: 'nl6.g1', turns: [
      { beat: "It's been a long, miserable day. {a} and {b} sit slumped next to each other, too tired to move." },
      { by: 'a', say: "Remind me why we signed up for this." },
      { by: 'b', say: "The money." },
      { by: 'a', say: "Right. The money." },
      { by: 'b', say: "And the adventure." },
      { by: 'a', say: "This isn't an adventure. This is being hungry outdoors." },
      { beat: "They both start laughing, too tired to stop." },
      { by: 'b', say: "We're going to be fine, right?" },
      { by: 'a', say: "We're going to be fine. Tired, hungry, gross, and fine." },
      { by: 'b', conf: "Some days the only thing getting me through is having one person who's just as miserable as I am. Today that was {a}." },
    ] },
    { id: 'nl6.g2', when: { voice: ['anxious', 'emotional', 'warm'] }, turns: [
      { by: 'b', say: "Hey. Are you crying?" },
      { by: 'a', say: "No. Maybe. It's just a lot today." },
      { by: 'b', say: "It's a lot every day." },
      { by: 'a', say: "I know. I just thought I'd be better at this." },
      { by: 'b', say: "You're still here. That's better at this than most people." },
      { by: 'a', say: "That's the nicest way anyone's ever told me I'm barely surviving." },
      { by: 'b', say: "Barely surviving counts. Come on, sit with me for a bit." },
      { by: 'a', conf: "I was about two minutes from falling apart, and {b} just sat down next to me like it was nothing. It wasn't nothing." },
    ] },
  ],
  'long.friend.secret.any': [
    { id: 'nl6.x1', turns: [
      { beat: "{a} and {b} are the last two awake." },
      { by: 'a', say: "Can I tell you something I haven't said to anybody here?" },
      { by: 'b', say: "Of course." },
      { by: 'a', say: "I'm not doing this for the money. I mean, I want the money. But mostly I wanted to find out if I could." },
      { by: 'b', say: "Could what?" },
      { by: 'a', say: "Do something hard without giving up halfway. I've given up halfway on a lot of things." },
      { by: 'b', say: "You haven't given up on this." },
      { by: 'a', say: "Not yet. That's why I'm telling you. So somebody knows, if I start to." },
      { by: 'b', conf: "{a} told me something real tonight. I'm not going to use it. I'm going to remind {a.obj} of it if {a} ever needs it." },
    ] },
  ],
  'long.friend.celebrate.any': [
    { id: 'nl6.c1', turns: [
      { by: 'a', say: "Okay, everybody. Toast!" },
      { by: 'b', say: "With what? We've got water." },
      { by: 'a', say: "With the finest water money can't buy!" },
      { by: 'c', say: "What are we toasting?" },
      { by: 'a', say: "Us! Still being here! Nobody cried today!" },
      { by: 'b', say: "I cried a little at lunch." },
      { by: 'a', say: "Then to almost nobody crying today!" },
      { beat: "Everybody raises their cups anyway." },
      { by: 'c', conf: "It was the dumbest toast I've ever heard, and it's the first time all week the whole team laughed at the same time." },
    ] },
  ],
  'long.friend.defend.any': [
    { id: 'nl6.d1', turns: [
      { beat: "Two people are giving {b} a hard time. {a} walks over and stands between them." },
      { by: 'a', say: "Is there a problem?" },
      { by: 'b', say: "It's fine, {a}." },
      { by: 'a', say: "It doesn't look fine. It looks like two people ganging up on one." },
      { beat: "The other two find something else to do." },
      { by: 'b', say: "You didn't have to do that." },
      { by: 'a', say: "I know I didn't. That's kind of the point." },
      { by: 'b', say: "People are going to think you're on my side now." },
      { by: 'a', say: "Then they'd be right." },
      { by: 'b', conf: "{a} didn't even raise {a.posAdj} voice. {a} just stood there, and it was enough. I'm not forgetting that." },
    ] },
  ],
  'long.friend.drift.any': [
    { id: 'nl6.r1', turns: [
      { by: 'b', say: "We used to plan everything together." },
      { by: 'a', say: "Things change." },
      { by: 'b', say: "Things don't just change. People change them." },
      { by: 'a', say: "What do you want me to say?" },
      { by: 'b', say: "I want you to say why you made a plan this morning without me." },
      { beat: "{a} doesn't answer straight away." },
      { by: 'a', say: "Because I didn't think you'd agree with it." },
      { by: 'b', say: "You could have asked." },
      { by: 'b', conf: "{a} made a plan without me, and I found out from somebody else. That's the part that hurts. Not the plan. Finding out like that." },
    ] },
  ],
  'long.cross.friend.any': [
    { id: 'nl6.y1', turns: [
      { beat: "{a} and {b}, from different teams, end up at the same water run and take their time about it." },
      { by: 'a', say: "Your team's going to wonder where you are." },
      { by: 'b', say: "Yours too." },
      { by: 'a', say: "When this is all over, we're hanging out. For real." },
      { by: 'b', say: "If we still like each other after the merge." },
      { by: 'a', say: "Why wouldn't we?" },
      { by: 'b', say: "Because at the merge you might have to write my name." },
      { by: 'a', say: "...Then let's make sure we're on the same side by then." },
      { by: 'b', conf: "{a} is on the other team, and {a} is honestly one of my favourite people here. That's going to be a problem one day. Not today." },
    ] },
  ],
  'long.crowd.dinner.any': [
    { id: 'nl6.n1', turns: [
      { beat: "{a}, {b} and {c} pick at dinner. Nobody is eating much." },
      { by: 'b', say: "Anyone else not hungry?" },
      { by: 'a', say: "I'm hungry. I'm just not hungry for this." },
      { by: 'c', say: "Fair." },
      { by: 'a', say: "So. Today." },
      { by: 'b', say: "Do we have to talk about today?" },
      { by: 'a', say: "We don't have to. But everybody's going to be thinking about it, so we might as well." },
      { by: 'c', say: "Fine. Today was weird. People were weird." },
      { by: 'b', say: "People are always weird. Today they were weird in groups." },
      { by: 'c', conf: "When three people sit down to dinner and nobody mentions the vote, it's because everybody's thinking about the vote." },
    ] },
  ],
  'long.drama.thaw.any': [
    { id: 'nl6.w1', turns: [
      { by: 'a', say: "Truce? For one afternoon?" },
      { by: 'b', say: "What's in it for me?" },
      { by: 'a', say: "Somebody to talk to who isn't lying to you." },
      { by: 'b', say: "You've lied to me." },
      { by: 'a', say: "Once. And you've called me worse things than a liar, so I'd say we're even." },
      { by: 'b', say: "...One afternoon." },
      { by: 'a', say: "One afternoon. Then we can go back to hating each other." },
      { by: 'b', say: "Deal. Sit down, then." },
      { by: 'b', conf: "I didn't expect {a} to be the one to offer a truce. I didn't expect myself to take it either. I'm still not sure who won that." },
    ] },
  ],
  'long.drama.showboat.any': [
    { id: 'nl6.s1', turns: [
      { by: 'a', say: "Not to brag, but I've basically got this whole game figured out." },
      { by: 'b', say: "That is bragging." },
      { by: 'a', say: "It's not bragging if it's true." },
      { by: 'b', say: "Okay. Who goes next, then?" },
      { by: 'a', say: "I'm not going to just tell you." },
      { by: 'b', say: "Because you don't know." },
      { by: 'a', say: "Because I'm being strategic about who I tell." },
      { by: 'b', say: "You just told me you've got the whole game figured out." },
      { by: 'b', conf: "{a} says that kind of thing out loud, in front of people. Everyone smiled at {a}. Everyone also remembered it." },
    ] },
  ],
  'long.drama.dig.any': [
    { id: 'nl6.k1', turns: [
      { beat: "{b} finishes explaining an idea to the group. There's a pause." },
      { by: 'a', say: "No, that's a great idea, {b}. Really. Super creative." },
      { by: 'b', say: "Was that sarcastic?" },
      { by: 'a', say: "Why would it be sarcastic?" },
      { by: 'b', say: "Because of the way you said 'super creative'." },
      { by: 'a', say: "I can say it again in a different voice if you want." },
      { beat: "Somebody else stares hard at the ground." },
      { by: 'b', conf: "{a} said 'great' and made it sound like an insult. In front of everybody. And now everybody's going to pretend they didn't notice." },
    ] },
  ],
  'long.drama.intimidate.any': [
    { id: 'nl6.i1', turns: [
      { beat: "{a} has been watching {b} all day. Every time {b} looks up, {a} is looking back." },
      { by: 'b', say: "Can I help you?" },
      { by: 'a', say: "Nope." },
      { by: 'b', say: "Then why are you staring at me?" },
      { by: 'a', say: "Just interested in what you're going to do next." },
      { by: 'b', say: "I'm going to get water." },
      { by: 'a', say: "Interesting." },
      { by: 'b', say: "Getting water isn't interesting!" },
      { by: 'a', say: "It is when you do it." },
      { by: 'b', conf: "{a} hasn't said one threatening thing to me all day, and I'm more scared of {a.obj} than of anybody who has." },
    ] },
  ],
  'long.drama.mess.any': [
    { id: 'nl6.h1', when: { venue: 'hosted-camp' }, turns: [
      { beat: "In the mess hall, {a} and {b} stare down at their trays." },
      { by: 'a', say: "On a scale of one to ten, how dead is this meatloaf?" },
      { by: 'b', say: "It's past ten. It's haunted." },
      { by: 'a', say: "I think it just moved." },
      { by: 'b', say: "Don't say that. Now I can't stop looking at it." },
      { by: 'a', say: "Should we tell Chef?" },
      { by: 'b', say: "Tell Chef what? That his food is alive? He'll take it as a compliment." },
      { beat: "They spend the rest of dinner daring each other to take a bite. Neither of them does." },
      { by: 'a', conf: "The food in here is terrible, but at least it's terrible together. That's the closest thing to a team-building exercise we've had." },
    ] },
  ],
  'long.villain.power.any': [
    { id: 'nl6.v1', turns: [
      { by: 'a', say: "You know what I've noticed? Whispering is for people who are scared." },
      { by: 'b', say: "And you're not scared?" },
      { by: 'a', say: "I don't whisper. I just tell people what's going to happen, and then it happens." },
      { by: 'b', say: "That's a lot of confidence for somebody who could go home any night." },
      { by: 'a', say: "Could I? Name the last vote that didn't go the way I said." },
      { beat: "{b} opens {b.posAdj} mouth, then closes it." },
      { by: 'a', say: "That's what I thought." },
      { by: 'b', conf: "The worst part of {a} saying that is I couldn't think of a single vote. I need to change that, fast." },
    ] },
  ],
  'long.alliance.form.any': [
    { id: 'nl6.a1', turns: [
      { by: 'a', say: "I think I'm next." },
      { by: 'b', say: "Funny. I think I'm next." },
      { by: 'a', say: "We can't both be next." },
      { by: 'b', say: "We can if we don't do something about it." },
      { by: 'a', say: "So we do something about it. Together." },
      { by: 'b', say: "Like an alliance?" },
      { by: 'a', say: "Like an alliance. Two people nobody's counting on, counting on each other." },
      { by: 'b', say: "Does it get a name?" },
      { by: 'a', say: "{group}." },
      { by: 'b', conf: "Ten minutes ago we were both sure we were going home. Now we're {group}. That's how fast it moves out here." },
    ] },
  ],
  'long.talk.approach.any': [
    { id: 'nl6.p1', turns: [
      { by: 'b', say: "Aren't you supposed to be with your people right now?" },
      { by: 'a', say: "My people aren't exactly treating me like one of their people." },
      { by: 'b', say: "Ouch." },
      { by: 'a', say: "Yeah. So I'm looking around. Seeing who else might be looking around." },
      { by: 'b', say: "And you thought of me?" },
      { by: 'a', say: "You've been on your own a lot. I figured you might be open to a conversation." },
      { by: 'b', say: "A conversation about what?" },
      { by: 'a', say: "About what happens if the two of us stop being the people everybody forgets about." },
      { by: 'b', conf: "{a} came to me because {a}'s own group is cutting {a.obj} out. I'm not sure if I'm being recruited or rescued." },
    ] },
  ],
  'long.trade.info.any': [
    { id: 'nl6.q1', turns: [
      { by: 'a', say: "I'll tell you what I know if you tell me what you know." },
      { by: 'b', say: "You first." },
      { by: 'a', say: "Why me first?" },
      { by: 'b', say: "Because you came to me." },
      { by: 'a', say: "Fine. People are a lot more nervous than they look. Two of them asked me today if they're safe." },
      { by: 'b', say: "Who?" },
      { by: 'a', say: "Your turn." },
      { by: 'b', say: "...Okay. I heard a name this morning, and it wasn't yours." },
      { by: 'a', say: "That's a start." },
      { by: 'b', conf: "{a} and I just traded half a secret each. Neither of us gave everything. That's how you know we're both actually playing." },
    ] },
  ],
  'long.morning.open.any': [
    { id: 'nl6.o1', turns: [
      { beat: "The last morning. {a} and {b} wake up before everybody else, and for a while neither of them says anything." },
      { by: 'a', say: "It's the last day." },
      { by: 'b', say: "I know. It feels weird." },
      { by: 'a', say: "Promise me something. Whatever happens tonight, we still talk after this." },
      { by: 'b', say: "Obviously. Who else would understand any of it?" },
      { by: 'a', say: "Nobody back home is going to get it. The hunger, the votes, all of it." },
      { by: 'b', say: "We'll just have to explain it to each other forever." },
      { by: 'a', conf: "I came here not knowing anybody. I'm leaving with at least one person I'll know for the rest of my life." },
    ] },
  ],
  'long.morning.bond.any': [
    { id: 'nl6.o2', turns: [
      { beat: "{a} and {b} sit shoulder to shoulder and watch the sun come up." },
      { by: 'a', say: "I couldn't have done this without you." },
      { by: 'b', say: "You could have. You'd have just been grumpier." },
      { by: 'a', say: "Much grumpier." },
      { by: 'b', say: "Do you remember the first day? You didn't even like me." },
      { by: 'a', say: "I didn't know you." },
      { by: 'b', say: "And now?" },
      { by: 'a', say: "Now I'd be in big trouble if you weren't here." },
      { by: 'b', conf: "Whatever happens tonight, {a} and I made it here together. Nobody gets to take that away." },
    ] },
  ],
  'long.morning.rival.any': [
    { id: 'nl6.o3', turns: [
      { by: 'b', say: "Did you take my bag?" },
      { by: 'a', say: "Why would I want your bag?" },
      { by: 'b', say: "Why would you do half the stuff you did out here?" },
      { by: 'a', say: "It's the last day. Are we really still doing this?" },
      { by: 'b', say: "Yes. We are absolutely still doing this." },
      { by: 'a', say: "...It's under the bench. I moved it. It was in my way." },
      { by: 'b', say: "Of course it was." },
      { by: 'a', conf: "{b} and I have fought about everything since day one. It would honestly be weird to stop now, on the last day." },
    ] },
  ],
  'long.morning.close.any': [
    { id: 'nl6.o4', turns: [
      { beat: "{a} and {b} take one last look around camp before they leave it for the last time." },
      { by: 'a', say: "Should we say something? Like a speech?" },
      { by: 'b', say: "To who? Camp?" },
      { by: 'a', say: "Yeah. To camp." },
      { by: 'b', say: "...Goodbye, camp. You were terrible." },
      { by: 'a', say: "Goodbye, camp. You were really terrible, and I'm going to miss you." },
      { beat: "They stand there a second longer than they need to." },
      { by: 'b', conf: "I hated this place every single day, and walking out of it for the last time, I almost cried. Don't tell anybody." },
    ] },
  ],
  'long.morning.reflect.any': [
    { id: 'nl6.o5', turns: [
      { beat: "{a} sits alone, the last morning, looking at the camp {a} has lived in for weeks." },
      { by: 'a', conf: "I keep thinking about the first day. I didn't know where anything was, or who anybody was." },
      { by: 'a', conf: "Now I know exactly who everybody is. Who lies, who doesn't, who snores." },
      { by: 'a', conf: "I've got bruises on my bruises. I've lost track of how many times I nearly went home." },
      { by: 'a', conf: "And I'm still here, on the last day, with a shot at the whole thing." },
      { by: 'a', conf: "Whatever happens tonight, I'm proud of that. I didn't know I would be, but I am." },
    ] },
  ],
};
