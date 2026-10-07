// ══════════════════════════════════════════════════════════════════════
// td/script/lines/crowd.js — camp scenes with three people talking (camp-events.js _crowdScenes)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "make sure we have more than just 1 on 1 conversation". Each is a real
// moment of the camp day the engine decided, with three speakers and the others around them.
//
//   crowd.meal.any    breakfast: a (the most sociable), b and c (a's closest) over the food
//   crowd.won.any     back from a win: a scored the most for the team; b and c say so
//   crowd.lost.any    back from a loss: a blames b, who scored the least; c tries to calm it down
//   crowd.immune.any  after the merge: a just won immunity; b is glad, c is not
//   crowd.huddle.any  a, b and c, of the alliance {group}, close ranks before the vote
//   crowd.nerves.any  the team going to the vote tonight: a, b and c at the fire
//   crowd.clash.any   a and b, who can't stand each other, go at it in front of everyone; c steps in
//   crowd.chores.any  the morning's work: a leads it, b and c pitch in
//   crowd.dinner.any  the evening meal: a, b and c pick over the day
//   crowd.chime-<fight|banter|romance>.any  c, who is there and sees it, joins the end of a's and b's
//                     talk; c reacts only to what anyone standing there could see
//
// Ids: 'cw.'.

const MEAL = [
  { id: 'cw.m1', turns: [
    { by: 'a', say: "Is this oatmeal or glue?" },
    { by: 'b', say: "Yes." },
    { by: 'c', say: "I've decided not to look at it. It helps." },
  ] },
  { id: 'cw.m2', turns: [
    { beat: '{a}, {b} and {c} share the end of a bench and one questionable loaf of bread.' },
    { by: 'a', say: "So what do we think today's challenge is?" },
    { by: 'b', say: "Something with mud. It's always something with mud." },
    { by: 'c', say: "Or heights. Please not heights." },
  ] },
  { id: 'cw.m3', turns: [
    { by: 'b', say: "Did anyone else hear that noise last night?" },
    { by: 'c', say: "The howling? I thought I dreamed it." },
    { by: 'a', say: "That was {b}. Snoring." },
    { by: 'b', say: "It was NOT." },
  ] },
  { id: 'cw.m4', turns: [
    { by: 'a', say: "Okay, everyone say one thing you miss from home. Go." },
    { by: 'c', say: "A real bed." },
    { by: 'b', say: "Food that doesn't move." },
    { by: 'a', say: "Same. Both. All of it." },
  ] },
  { id: 'cw.m5', turns: [
    { by: 'c', say: "Pass the... whatever that is." },
    { by: 'b', say: "You're brave." },
    { by: 'a', say: "Or starving. Out here it's hard to tell the difference." },
  ] },
  { id: 'cw.m6', turns: [
    { by: 'a', say: "Morning, sunshines." },
    { by: 'b', say: "It's too early for sunshine." },
    { by: 'c', say: "It's too early for {a}." },
    { by: 'a', say: "Rude. Accurate, but rude." },
  ] },
  { id: 'cw.m7', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "So. Who's everyone sitting with these days?" },
    { by: 'b', say: "Is this breakfast or an interview?" },
    { by: 'c', say: "With {a} it's always both." },
  ] },
  { id: 'cw.m8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I saved you guys the least burnt pieces." },
    { by: 'b', say: "You're a hero." },
    { by: 'c', say: "Seriously, you're the only reason I eat here." },
  ] },
];

const WON = [
  { id: 'cw.w1', turns: [
    { by: 'b', say: "Did you SEE {a} out there?" },
    { by: 'c', say: "I saw. I'm still not over it." },
    { by: 'a', say: "Okay, okay. We all did it." },
    { by: 'b', say: "We all did a little. You did a LOT." },
  ] },
  { id: 'cw.w2', turns: [
    { beat: '{b} and {c} hoist {a} up onto their shoulders. It lasts about four seconds.' },
    { by: 'a', say: "Put me down! Put me DOWN!" },
    { by: 'c', say: "Our champion!" },
  ] },
  { id: 'cw.w3', turns: [
    { by: 'c', say: "Nobody here goes home this time!" },
    { by: 'b', say: "And we have {a} to thank for it." },
    { by: 'a', say: "Tell me that again when we lose next week." },
  ] },
  { id: 'cw.w4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "That's how you do it! THAT'S how you do it!" },
    { by: 'b', say: "Calm down, you'll pull something." },
    { by: 'c', say: "Let {a} have it. {a} earned it." },
  ] },
  { id: 'cw.w5', when: { register: 'shy' }, turns: [
    { by: 'b', say: "You were incredible today." },
    { by: 'a', say: "I was? I mean... I was. Thanks." },
    { by: 'c', say: "Look at that, {a}'s blushing." },
  ] },
  { id: 'cw.w6', turns: [
    { by: 'b', say: "Group hug. Come on." },
    { by: 'a', say: "I'm all sweaty." },
    { by: 'c', say: "We're ALL sweaty. Get in here." },
  ] },
  { id: 'cw.w7', turns: [
    { by: 'a', say: "Honestly? I thought we had no chance." },
    { by: 'c', say: "That's because you weren't watching yourself." },
    { by: 'b', conf: "{a} just became really valuable to this team. Also really dangerous." },
  ] },
];

const LOST = [
  { id: 'cw.l1', turns: [
    { by: 'a', say: "We had that! We HAD that, until {b} fell apart!" },
    { by: 'b', say: "Oh, so it's my fault now?" },
    { by: 'c', say: "Hey. Hey! It's nobody's fault. We all lost." },
    { by: 'a', say: "Some of us lost harder." },
  ] },
  { id: 'cw.l2', turns: [
    { by: 'a', say: "Somebody has to say it. {b}, you were the weak link." },
    { by: 'b', say: "I tried my best!" },
    { by: 'c', say: "That's enough. Yelling about it now doesn't help anybody." },
  ] },
  { id: 'cw.l3', turns: [
    { beat: 'The walk back from the challenge is very quiet until {a} breaks it.' },
    { by: 'a', say: "I'm just going to say what everyone's thinking." },
    { by: 'c', say: "Please don't." },
    { by: 'a', say: "{b} cost us that." },
    { by: 'b', conf: "Great. Now I have a target on my back." },
  ] },
  { id: 'cw.l4', when: { hot: true }, turns: [
    { by: 'a', say: "I can't BELIEVE we lost to them!" },
    { by: 'b', say: "Don't look at me like that." },
    { by: 'a', say: "Then don't give me a reason to!" },
    { by: 'c', say: "Both of you, sit down. Now." },
  ] },
  { id: 'cw.l5', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "What happened out there, {b}?" },
    { by: 'b', say: "I don't know. I froze." },
    { by: 'c', say: "Everyone freezes sometimes. Leave {b} alone." },
  ] },
  { id: 'cw.l6', turns: [
    { by: 'c', say: "Okay. Deep breaths. We lost. It happens." },
    { by: 'a', say: "It happens a lot more when certain people stop trying." },
    { by: 'b', say: "Say my name if you mean me." },
    { by: 'a', say: "{b}." },
  ] },
  { id: 'cw.l7', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'm not blaming anyone. I'm just noting who finished last." },
    { by: 'b', say: "That's blaming." },
    { by: 'c', say: "That's definitely blaming." },
    { by: 'a', conf: "Plant the seed. Let everyone else water it." },
  ] },
];

const IMMUNE = [
  { id: 'cw.i1', turns: [
    { by: 'b', say: "Congrats! You're safe!" },
    { by: 'a', say: "For one night." },
    { by: 'c', say: "One night is all you need, apparently." },
    { by: 'c', conf: "I'm happy for {a}. I'm also out of options." },
  ] },
  { id: 'cw.i2', turns: [
    { by: 'a', say: "Nobody can touch me tonight!" },
    { by: 'b', say: "Enjoy it." },
    { by: 'c', say: "Some of us were really counting on touching you tonight." },
  ] },
  { id: 'cw.i3', turns: [
    { beat: '{a} walks into camp with the immunity necklace on. {b} claps. {c} doesn\'t.' },
    { by: 'b', say: "Look at you!" },
    { by: 'c', say: "Yeah. Look at you." },
    { by: 'a', say: "I'll take that as a congratulations, {c}." },
  ] },
  { id: 'cw.i4', turns: [
    { by: 'b', say: "That's three in a row, right?" },
    { by: 'a', say: "Who's counting?" },
    { by: 'c', say: "Everybody. Everybody is counting." },
  ] },
  { id: 'cw.i5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "If you want me gone, you'll have to beat me first." },
    { by: 'c', say: "We'll get there." },
    { by: 'b', say: "Can we just enjoy one nice evening?" },
  ] },
  { id: 'cw.i6', turns: [
    { by: 'c', say: "So who are YOU voting for, since you're safe?" },
    { by: 'a', say: "Wouldn't you like to know." },
    { by: 'b', conf: "And now everybody wants {a}'s vote. Safe and powerful. Great." },
  ] },
];

const HUDDLE = [
  { id: 'cw.h1', turns: [
    { beat: '{a}, {b} and {c} slip away from the others, one at a time, and meet up out of sight.' },
    { by: 'a', say: "{group} sticks together. No matter what you hear today." },
    { by: 'b', say: "Agreed." },
    { by: 'c', say: "Agreed. Nobody freelances." },
  ] },
  { id: 'cw.h2', turns: [
    { by: 'b', say: "People are going to come to each of us with offers." },
    { by: 'c', say: "Let them. We listen, we nod, we tell each other." },
    { by: 'a', say: "Exactly. That's how {group} wins." },
  ] },
  { id: 'cw.h3', turns: [
    { by: 'a', say: "Is everybody still in? Be honest." },
    { by: 'c', say: "I'm in." },
    { by: 'b', say: "I'm in. Why, did you hear something?" },
    { by: 'a', say: "No. I just like hearing you say it." },
  ] },
  { id: 'cw.h4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's how this goes. We vote as one. If anyone breaks, the other two vote them out next." },
    { by: 'b', say: "That's... intense." },
    { by: 'c', say: "That's {group}." },
  ] },
  { id: 'cw.h5', turns: [
    { by: 'c', say: "We can't be seen together too much." },
    { by: 'b', say: "Then this is the last time today." },
    { by: 'a', say: "Hands in. {group} on three." },
    { beat: 'Three hands meet in the middle. Nobody says it out loud.' },
  ] },
  { id: 'cw.h6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just want you both to know I trust you. Completely." },
    { by: 'b', say: "Same." },
    { by: 'c', say: "Same. Whatever happens, {group} goes deep." },
  ] },
  { id: 'cw.h7', turns: [
    { by: 'b', say: "Somebody's going to try to split us up." },
    { by: 'a', say: "Somebody always does." },
    { by: 'c', say: "And it never works if we talk. So we talk." },
  ] },
];

const NERVES = [
  { id: 'cw.n1', turns: [
    { beat: '{a}, {b} and {c} sit around the fire, watching it burn down.' },
    { by: 'a', say: "Anyone else feel sick?" },
    { by: 'b', say: "Every single vote." },
    { by: 'c', say: "Tonight's worse. Tonight I don't know where the votes are." },
  ] },
  { id: 'cw.n2', turns: [
    { by: 'b', say: "If it's me tonight..." },
    { by: 'c', say: "Don't." },
    { by: 'a', say: "Don't even start that sentence." },
  ] },
  { id: 'cw.n3', turns: [
    { by: 'a', say: "Who's going home? Just guess." },
    { by: 'c', say: "I'm not guessing out loud." },
    { by: 'b', say: "Smart. The trees have ears out here." },
  ] },
  { id: 'cw.n4', turns: [
    { by: 'c', say: "I hate this part. The waiting." },
    { by: 'a', say: "At least at the vote it's over." },
    { by: 'b', say: "For one of us it's over." },
    { beat: 'Nobody says anything for a while.' },
  ] },
  { id: 'cw.n5', when: { hot: true }, turns: [
    { by: 'a', say: "Why is everybody whispering? Just say it!" },
    { by: 'b', say: "Nobody's whispering." },
    { by: 'c', say: "Everybody is whispering, {b}." },
  ] },
  { id: 'cw.n6', turns: [
    { by: 'b', say: "Whatever happens tonight, it was nice knowing you guys." },
    { by: 'c', say: "Stop. You're making it weird." },
    { by: 'a', say: "It was already weird." },
  ] },
];

const CLASH = [
  { id: 'cw.c1', turns: [
    { by: 'a', say: "Could you not stand right there?" },
    { by: 'b', say: "It's a free camp." },
    { by: 'a', say: "Then go be free somewhere else!" },
    { by: 'c', say: "Okay, okay, both of you, separate corners." },
  ] },
  { id: 'cw.c2', turns: [
    { by: 'b', say: "You've been on my case since day one." },
    { by: 'a', say: "Maybe because you've earned it since day one." },
    { by: 'c', say: "Can we NOT do this in front of everybody?" },
  ] },
  { id: 'cw.c3', turns: [
    { beat: 'It starts over who used the last of the water, and it is not about the water.' },
    { by: 'a', say: "You always do this!" },
    { by: 'b', say: "Do what? Exist?" },
    { by: 'c', say: "Here. Take mine. Both of you. Just stop." },
  ] },
  { id: 'cw.c4', when: { hot: true }, turns: [
    { by: 'a', say: "Say that again. Say it to my face." },
    { by: 'b', say: "Gladly." },
    { beat: '{c} steps right between them.' },
    { by: 'c', say: "Nobody is saying anything to anybody's face." },
  ] },
  { id: 'cw.c5', when: { calm: true }, turns: [
    { by: 'a', say: "I'm not going to fight with you, {b}." },
    { by: 'b', say: "Because you know you'd lose." },
    { by: 'c', say: "Because people are watching. Have some dignity." },
  ] },
  { id: 'cw.c6', turns: [
    { by: 'c', say: "What is going on with you two?" },
    { by: 'a', say: "Ask {b}." },
    { by: 'b', say: "Ask {a}." },
    { by: 'c', conf: "This is going to end at a vote. I just hope I'm not in the middle of it." },
  ] },
];

// crowd.chores.any — the morning's work: a leads it, b and c pitch in (or don't)
const CHORES = [
  { id: 'cw.k1', turns: [
    { by: 'a', say: "Okay. Wood, water, cleanup. Who's doing what?" },
    { by: 'b', say: "I'll do water." },
    { by: 'c', say: "Why do I feel like I'm about to get cleanup?" },
    { by: 'a', say: "Because you're getting cleanup." },
  ] },
  { id: 'cw.k2', turns: [
    { beat: '{a}, {b} and {c} haul a log between them, badly.' },
    { by: 'b', say: "Lift with your legs!" },
    { by: 'c', say: "I AM lifting with my legs!" },
    { by: 'a', say: "Then your legs are lazy!" },
  ] },
  { id: 'cw.k3', turns: [
    { by: 'c', say: "Remind me why we're doing chores at a camp that's a TV show?" },
    { by: 'a', say: "Because nobody else will." },
    { by: 'b', say: "And because {host} said so. And {host} has a cannon." },
  ] },
  { id: 'cw.k4', when: { strong: true }, turns: [
    { by: 'a', say: "I've got this one. Grab the other end, {b}." },
    { by: 'b', say: "Show-off." },
    { by: 'c', say: "Let the show-off carry it. More rest for us." },
  ] },
  { id: 'cw.k5', turns: [
    { by: 'b', say: "Is it just me, or does {c} always disappear when there's work?" },
    { by: 'c', say: "I'm right here!" },
    { by: 'a', say: "Now you are." },
  ] },
  { id: 'cw.k6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You two do the heavy part. I'll supervise." },
    { by: 'b', say: "You'll what?" },
    { by: 'c', conf: "{a} has done zero work this whole game and somehow everyone thinks {a} is a hard worker. How?" },
  ] },
  { id: 'cw.k7', turns: [
    { by: 'c', say: "This is the most I've talked to either of you all game." },
    { by: 'b', say: "Chores bring people together." },
    { by: 'a', say: "Chores bring people to the edge. Hand me that bucket." },
  ] },
];

// crowd.dinner.any — the evening meal: a, b and c pick over the day
const DINNER = [
  { id: 'cw.d1', turns: [
    { by: 'a', say: "Well. That was a day." },
    { by: 'b', say: "Every day here is a day." },
    { by: 'c', say: "This one was more of a day than usual." },
  ] },
  { id: 'cw.d2', turns: [
    { beat: '{a}, {b} and {c} poke at dinner, nobody eating much.' },
    { by: 'b', say: "Anyone else not hungry?" },
    { by: 'c', say: "I'm hungry. I'm just not hungry for this." },
    { by: 'a', say: "Fair." },
  ] },
  { id: 'cw.d3', turns: [
    { by: 'c', say: "Did you see who was sitting together at lunch?" },
    { by: 'a', say: "Everyone saw." },
    { by: 'b', say: "Everyone's pretending they didn't see." },
  ] },
  { id: 'cw.d4', turns: [
    { by: 'a', say: "If this is our last dinner together, I want it on record: this food was terrible." },
    { by: 'b', say: "Noted." },
    { by: 'c', say: "Seconded." },
  ] },
  { id: 'cw.d5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Can we just not talk about the game for five minutes?" },
    { by: 'b', say: "Deal. Five minutes." },
    { by: 'c', say: "Starting... now. So. Anybody got a pet?" },
  ] },
  { id: 'cw.d6', turns: [
    { by: 'b', say: "Pass the salt." },
    { by: 'c', say: "There's no salt." },
    { by: 'a', say: "There's never any salt. It's part of the experience." },
  ] },
];

// chime.<tone>.any — a third person who is there and sees it joins in at the end of a two-person talk.
// c only reacts to what anyone standing there could see; never to anything said in secret.
const CH_FIGHT = [
  { id: 'ch.f1', turns: [{ by: 'c', say: "Okay, can you two take this somewhere else? Some of us are trying to live here." }] },
  { id: 'ch.f2', turns: [{ by: 'c', say: "Wow. Okay. I'm just going to stand over here and pretend I didn't hear any of that." }] },
  { id: 'ch.f3', turns: [{ by: 'c', say: "Are you two done? Because that was a lot." }, { by: 'a', say: "Stay out of it." }] },
  { id: 'ch.f4', turns: [{ by: 'c', say: "Every single day with you two." }, { by: 'b', say: "Tell {a.obj}, not me." }] },
  { id: 'ch.f5', when: { registerB: 'fiery' }, turns: [{ by: 'c', say: "Breathe, {b}. Just breathe." }, { by: 'b', say: "I AM breathing!" }] },
  { id: 'ch.f6', turns: [{ beat: '{c} has stopped pretending not to watch.' }, { by: 'c', say: "Should I get popcorn, or...?" }] },
  { id: 'ch.f7', turns: [{ by: 'c', conf: "{a} and {b} are going to blow up this whole camp one day. I just hope I'm not standing next to them." }] },
];
const CH_BANTER = [
  { id: 'ch.b1', turns: [{ by: 'c', say: "Mind if I join you two?" }, { by: 'a', say: "Go for it." }] },
  { id: 'ch.b2', turns: [{ by: 'c', say: "Need an extra pair of hands?" }, { by: 'b', say: "Always." }] },
  { id: 'ch.b3', turns: [{ by: 'c', say: "What's going on over here?" }, { by: 'a', say: "Nothing much. Pull up a seat." }] },
  { id: 'ch.b4', turns: [{ beat: '{c} wanders over halfway through.' }, { by: 'c', say: "Did I miss anything good?" }, { by: 'b', say: "Nope. Same old." }] },
  { id: 'ch.b5', turns: [{ by: 'c', say: "Is there room for one more?" }, { by: 'b', say: "There's always room." }] },
  { id: 'ch.b6', when: { register: 'shy' }, turns: [{ by: 'c', say: "Can I... sit here?" }, { by: 'a', say: "Of course you can." }] },
  { id: 'ch.b7', turns: [{ by: 'c', say: "You two look busy." }, { by: 'a', say: "We are. Grab something and help." }, { by: 'c', say: "I walked right into that." }] },
];
const CH_ROMANCE = [
  { id: 'ch.r1', turns: [{ by: 'c', say: "Get a room, you two." }, { by: 'a', say: "We were just talking!" }] },
  { id: 'ch.r2', turns: [{ by: 'c', say: "Ooooh. Look at you two." }, { by: 'b', say: "Don't." }, { by: 'c', say: "I'm just saying." }] },
  { id: 'ch.r3', turns: [{ beat: '{c} walks past and very loudly clears {c.posAdj} throat.' }, { by: 'c', say: "Carry on." }] },
  { id: 'ch.r4', turns: [{ by: 'c', say: "Everyone can see you, by the way." }, { by: 'a', say: "Good. Let them." }] },
  { id: 'ch.r5', turns: [{ by: 'c', conf: "{a} and {b}? Everybody knew before they did." }] },
  { id: 'ch.r6', when: { registerB: 'shy' }, turns: [{ by: 'c', say: "{b}, your face is so red right now." }, { by: 'b', say: "It's the sun!" }, { by: 'c', say: "It's cloudy." }] },
];

export default {
  'crowd.meal.any': MEAL, 'crowd.won.any': WON, 'crowd.lost.any': LOST, 'crowd.immune.any': IMMUNE,
  'crowd.huddle.any': HUDDLE, 'crowd.nerves.any': NERVES, 'crowd.clash.any': CLASH,
  'crowd.chores.any': CHORES, 'crowd.dinner.any': DINNER,
  'crowd.chime-fight.any': CH_FIGHT, 'crowd.chime-banter.any': CH_BANTER, 'crowd.chime-romance.any': CH_ROMANCE,
};

/** Data these scenes always carry. */
export const GUARANTEED = { 'crowd.huddle.any': ['group'], 'crowd.nerves.any': ['tribal'], 'crowd.immune.any': ['tribal'] };
