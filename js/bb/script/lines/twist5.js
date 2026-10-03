// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist5.js — Team America, America's Nominee, High Rollers (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/team-america.js, americas-nominee.js and high-rollers.js.
//
//   team.tell       a keeps finding {group} in the same room (b is one)        scene
//   team.saboteur   a is sure somebody is steering the house; blames b          scene
//   team.reluctant  a and b are on the secret team and do not like each other  scene
//   team.cover      b asks a, the mission lead, what that talk was about        scene
//   an.chair        a is America's Nominee; b is a's closest friend             scene; intent told
//   an.hunt         a decides b had a hand in the anonymous nomination          scene
//   an.outside      a talks about the audience with the vote; b hears it        scene; intent heard
//   an.camera       a plays to the cameras; b notices                           scene; intent seen
//   an.mvp          a is the secret MVP (never said); b watches a             overplayed | quiet
//   roller.walked   a watches b pay {price} at the High Roller's Room            threat | scared
//   roller.lost     a paid {price} and lost; b is the nearest person             kind | mocked
//   roller.wheel    a was spun onto the block; b paid for the spin              follows | wheel (alone)
//   roller.derby    a watches b use a veto bought at the window                  admires | bought

export default {
  'team.tell.scene': [
    { id: 'ta5.t1', turns: [{ by: 'a', dr: "{group}. Same room, again. They're not even friends. People who aren't friends don't keep finding each other." }] },
    { id: 'ta5.t2', turns: [{ by: 'a', say: "What are you lot up to?" }, { by: 'b', say: "Nothing. Just chatting." }, { by: 'a', dr: "{group}, just chatting. Sure." }] },
    { id: 'ta5.t3', turns: [{ by: 'a', dr: "Every alliance in this house shows itself eventually. One hasn't. I think it's got {b} in it." }] },
    { id: 'ta5.t4', turns: [{ by: 'a', dr: "I've started counting who goes into which room. {group} keep ending up in the same one." }] },
    { id: 'ta5.t5', turns: [{ beat: '{a} walks in. The conversation stops.' }, { by: 'a', say: "Don't let me interrupt." }, { by: 'b', say: "You're not." }] },
    { id: 'ta5.t6', turns: [{ by: 'b', dr: "{a} keeps walking in on us. We need to be more careful." }] },
    { id: 'ta5.t7', turns: [{ by: 'a', dr: "{group} all went quiet when I sat down. Twice today." }] },
    { id: 'ta5.t8', turns: [{ by: 'a', say: "You and {b} are close all of a sudden." }, { by: 'b', say: "Are we?" }, { by: 'a', say: "Seems like it." }] },
    { id: 'ta5.t9', turns: [{ by: 'a', dr: "I can't prove anything about {group}. I just know what I keep seeing." }] },
    { id: 'ta5.t10', turns: [{ by: 'b', dr: "{a} is watching us. If {a} works it out, we're finished." }] },
  ],
  'team.saboteur.scene': [
    { id: 'ta5.s1', turns: [{ by: 'a', say: "Somebody has been working us all week." }, { by: 'b', say: "Not me." }, { by: 'a', say: "That's what you'd say." }] },
    { id: 'ta5.s2', turns: [{ by: 'a', dr: "Somebody is pushing this house around. I'm pretty sure it's {b}." }] },
    { id: 'ta5.s3', turns: [{ by: 'b', dr: "I spent the evening defending a plan I was never part of. Nobody believed me." }] },
    { id: 'ta5.s4', turns: [{ by: 'b', say: "What plan? I don't even know what you're talking about!" }, { by: 'a', say: "Funny, that." }] },
    { id: 'ta5.s5', turns: [{ by: 'a', dr: "Things keep happening that nobody can explain. {b} is the hardest person to read. So it's {b}." }] },
    { id: 'ta5.s6', turns: [{ by: 'b', dr: "{a} has decided I'm behind everything. I've done nothing." }] },
    { id: 'ta5.s7', turns: [{ by: 'a', say: "Things don't just happen in here. Somebody makes them happen." }, { by: 'b', say: "Well, it isn't me." }] },
    { id: 'ta5.s8', turns: [{ by: 'a', dr: "Every time something weird happens this week, {b} is nearby. That's not a coincidence." }] },
    { id: 'ta5.s9', turns: [{ by: 'b', dr: "I'm being blamed for something I don't understand. I can't even defend myself properly." }] },
    { id: 'ta5.s10', turns: [{ by: 'a', say: "I'm watching you, {b}." }, { by: 'b', say: "Watch all you like. I've got nothing to hide." }] },
  ],
  'team.reluctant.scene': [
    { id: 'ta5.r1', turns: [{ by: 'a', dr: "I want {b} out of this house. And I have to keep finding reasons to be alone with {b}. It's exhausting." }] },
    { id: 'ta5.r2', turns: [{ by: 'a', say: "We're not close, by the way. {b} and me." }, { beat: 'Nobody had asked.' }] },
    { id: 'ta5.r3', turns: [{ by: 'a', dr: "Twenty minutes being nice to {b}. Then I walk out and tell someone {b} can't be trusted. Both are true." }] },
    { id: 'ta5.r4', turns: [{ by: 'b', dr: "{a} and I have to work together. We'd never have picked each other." }] },
    { id: 'ta5.r5', turns: [{ by: 'a', say: "Can we get this over with?" }, { by: 'b', say: "Gladly." }] },
    { id: 'ta5.r6', turns: [{ by: 'b', dr: "I'm stuck on a team with {a}. I can't tell anyone, and I can't stand {a}." }] },
    { id: 'ta5.r7', turns: [{ by: 'a', dr: "{b} and I need to talk again. I'd rather do the dishes for a week." }] },
    { id: 'ta5.r8', turns: [{ by: 'b', say: "Same time tomorrow?" }, { by: 'a', say: "Unfortunately." }] },
    { id: 'ta5.r9', turns: [{ by: 'a', dr: "I don't trust {b}. I have to work with {b} anyway. That's the job." }] },
    { id: 'ta5.r10', turns: [{ by: 'b', dr: "{a} and I agree on one thing this week, and only one thing." }] },
  ],
  'team.cover.scene': [
    { id: 'ta5.c1', turns: [{ by: 'b', say: "What was that conversation about?" }, { by: 'a', say: "Just the usual. Who's thinking what for the week." }, { by: 'b', dr: "Quick answer. Too quick." }] },
    { id: 'ta5.c2', turns: [{ by: 'a', dr: "{b} asked me straight out. I gave up something real just to change the subject. It worked. It cost me." }] },
    { id: 'ta5.c3', turns: [{ by: 'b', say: "What were you two talking about?" }, { by: 'a', say: "It was nothing." }, { by: 'b', dr: "It wasn't nothing." }] },
    { id: 'ta5.c4', turns: [{ by: 'a', dr: "I explained my way out of it. {b} didn't believe a word. Now I've got two problems." }] },
    { id: 'ta5.c5', turns: [{ by: 'b', dr: "{a} had a perfect answer ready. Nobody has a perfect answer ready unless they've practised it." }] },
    { id: 'ta5.c6', turns: [{ by: 'b', say: "You'd tell me if something was going on, right?" }, { by: 'a', say: "Of course." }] },
  ],
  'an.chair.scene': [
    { id: 'an5.c1', turns: [{ by: 'a', dr: "I'm on the block and there's nobody to campaign to. The HOH didn't put me here. Whoever did, I can't talk to." }] },
    { id: 'an5.c2', when: { intent: 'told' }, turns: [{ by: 'a', say: "Who do I even talk to?" }, { by: 'b', say: "I don't know." }, { by: 'a', say: "Neither do I." }] },
    { id: 'an5.c3', turns: [{ by: 'a', dr: "Everyone in here likes me, and I'm nominated anyway. The people I needed to impress were never in here." }] },
    { id: 'an5.c4', turns: [{ by: 'a', dr: "Every other nominee could look at someone and know who did it. I look around the kitchen and see nobody." }] },
    { id: 'an5.c5', when: { intent: 'told' }, turns: [{ by: 'b', say: "It's not personal." }, { by: 'a', say: "That's the worst part. I can't even be angry at anyone." }] },
    { id: 'an5.c6', when: { intent: 'told' }, turns: [{ by: 'b', dr: "{a} keeps asking who to talk to. I don't have an answer." }] },
  ],
  'an.hunt.scene': [
    { id: 'an5.h1', turns: [{ by: 'a', say: "Somebody in here knows." }, { by: 'b', say: "Knows what?" }, { by: 'a', say: "You tell me." }] },
    { id: 'an5.h2', turns: [{ by: 'a', dr: "I don't believe nobody in this house had a hand in it. I think it was {b}." }] },
    { id: 'an5.h3', turns: [{ by: 'b', dr: "{a} has decided I'm behind the third nominee. I don't even know how it works." }] },
    { id: 'an5.h4', turns: [{ by: 'a', dr: "{b} has been quiet. Quiet people are hiding something." }] },
    { id: 'an5.h5', turns: [{ by: 'b', say: "It wasn't me. It's the public." }, { by: 'a', say: "That's what someone would say if it was them." }] },
    { id: 'an5.h6', turns: [{ by: 'b', dr: "The house needs someone to blame. This week it's me." }] },
  ],
  'an.outside.scene': [
    { id: 'an5.o1', turns: [{ by: 'a', dr: "There's a whole audience voting on this game. They've never met us and they've already picked favourites." }] },
    { id: 'an5.o2', when: { intent: 'heard' }, turns: [{ by: 'a', say: "We're being watched by people with a vote." }, { by: 'b', say: "Don't say that." }, { by: 'a', say: "It's true, though." }] },
    { id: 'an5.o3', turns: [{ by: 'a', dr: "Every argument in this house now has an audience with a vote. That changes what an argument is for." }] },
    { id: 'an5.o4', turns: [{ by: 'a', dr: "I've stopped trying to find who picked the third nominee. I'm trying to work out what the people watching want." }] },
    { id: 'an5.o5', when: { intent: 'heard' }, turns: [{ by: 'b', say: "What do you think they want?" }, { by: 'a', say: "I wish I knew." }] },
    { id: 'an5.o6', when: { intent: 'heard' }, turns: [{ by: 'b', dr: "{a} keeps talking about the audience. It's making me paranoid." }] },
  ],
  'an.camera.scene': [
    { id: 'an5.p1', turns: [{ by: 'a', dr: "There's a vote out there and I want to be its favourite. So I'm being nice. Very nice." }] },
    { id: 'an5.p2', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{a} is suddenly lovely to everyone. Always in the rooms with the most cameras." }] },
    { id: 'an5.p3', turns: [{ by: 'a', say: "They're watching all of it, you know." }, { beat: '{a} smiles at the nearest camera.' }] },
    { id: 'an5.p4', when: { intent: 'seen' }, turns: [{ by: 'b', say: "Who are you performing for?" }, { by: 'a', say: "Everyone." }] },
    { id: 'an5.p5', turns: [{ by: 'a', dr: "Somebody out there is choosing who goes on the block. I'd like it not to be me." }] },
    { id: 'an5.p6', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{a} has stopped hiding it. Every nice thing {a} does is for the cameras." }] },
  ],
  'an.mvp.overplayed': [
    { id: 'an5.v1', turns: [{ by: 'a', say: "Who do you think did it?" }, { by: 'b', say: "No idea. You?" }, { by: 'b', dr: "{a} asked for my theory before sharing one. I noticed." }] },
    { id: 'an5.v2', turns: [{ by: 'b', dr: "{a} defends {nominee} harder than anyone. That's either kindness or guilt." }] },
    { id: 'an5.v3', turns: [{ by: 'b', say: "I heard the third nominee gets picked from a list." }, { by: 'a', say: "Oh, right. Yeah." }, { by: 'b', dr: "I made that up. {a} didn't correct me." }] },
    { id: 'an5.v4', turns: [{ by: 'b', dr: "{a} is very interested in who put {nominee} up. A bit too interested." }] },
    { id: 'an5.v5', turns: [{ by: 'a', say: "I just think it's sad for {nominee}, that's all." }, { by: 'b', dr: "That's the third time {a} has said that today." }] },
    { id: 'an5.v6', turns: [{ by: 'a', say: "Poor {nominee}." }, { by: 'b', say: "Mm." }, { by: 'b', dr: "{a} keeps bringing {nominee} up. Why?" }] },
  ],
  'an.mvp.quiet': [
    { id: 'an5.q1', turns: [{ by: 'a', say: "No idea who did it." }, { beat: '{a} changes the subject.' }] },
    { id: 'an5.q2', turns: [{ by: 'b', say: "Who do you think did it?" }, { by: 'a', say: "America." }, { beat: 'The kitchen laughs.' }] },
    { id: 'an5.q3', turns: [{ by: 'b', say: "Any theories?" }, { by: 'a', say: "None. It could be anyone. It could be no one." }] },
    { id: 'an5.q4', turns: [{ by: 'a', dr: "I said I was confused once. Then I talked about anything else all night." }] },
    { id: 'an5.q5', turns: [{ by: 'b', dr: "{a} doesn't seem bothered about the third nominee at all. Lucky {a}." }] },
    { id: 'an5.q6', turns: [{ by: 'a', dr: "Everyone's trying to work out the third nominee. I'm staying out of it." }] },
  ],
  'roller.walked.threat': [
    { id: 'hr5.t1', turns: [{ by: 'a', dr: "{b} paid {price} in public without blinking. That's not a scared person. That's someone with a plan." }] },
    { id: 'hr5.t2', turns: [{ by: 'a', dr: "If {b} has {price} to spend, {b} has been earning it somewhere. Earning takes friends." }] },
    { id: 'hr5.t3', turns: [{ by: 'a', say: "{b} bought a seat like it was nothing." }, { beat: 'Nobody laughs.' }] },
    { id: 'hr5.t4', turns: [{ by: 'a', dr: "I used to think {b} was just furniture. Not any more." }] },
    { id: 'hr5.t5', turns: [{ by: 'b', dr: "I paid for my seat and now everyone's looking at me differently." }] },
    { id: 'hr5.t6', turns: [{ by: 'a', dr: "It's not the money I'm worried about. It's the nerve." }] },
  ],
  'roller.walked.scared': [
    { id: 'hr5.s1', turns: [{ by: 'a', dr: "Nobody comfortable pays for safety. {b} is worried about something. I want to know what." }] },
    { id: 'hr5.s2', turns: [{ by: 'a', say: "You don't buy an umbrella on a sunny day." }, { beat: 'The kitchen goes quiet.' }] },
    { id: 'hr5.s3', turns: [{ by: 'a', dr: "{b} paid the second the door opened. No hesitation. That's someone who already knows they're in trouble." }] },
    { id: 'hr5.s4', turns: [{ by: 'a', say: "Feeling nervous, {b}?" }, { by: 'b', say: "No. Why?" }, { by: 'a', say: "No reason." }] },
    { id: 'hr5.s5', turns: [{ by: 'b', dr: "I went in because I'm scared. I hope nobody noticed." }] },
    { id: 'hr5.s6', turns: [{ by: 'a', dr: "I watched {b} walk to that door. That wasn't confidence. That was panic." }] },
  ],
  'roller.lost.kind': [
    { id: 'hr5.k1', turns: [{ beat: '{b} finds {a} on the hammock.' }, { by: 'b', say: "Tell me about home." }, { by: 'a', dr: "{b} didn't mention the money once. That's the kindest thing anyone's done for me." }] },
    { id: 'hr5.k2', turns: [{ by: 'b', say: "You played it. Most of them didn't have the nerve." }, { by: 'a', say: "Thanks. I needed that." }] },
    { id: 'hr5.k3', turns: [{ beat: '{b} brings {a} a plate without being asked.' }, { by: 'a', dr: "Losing {price} in front of everyone is fine. Eating alone afterwards would have been worse." }] },
    { id: 'hr5.k4', turns: [{ by: 'b', say: "It's only money." }, { by: 'a', say: "It's fake money." }, { by: 'b', say: "Even better." }] },
    { id: 'hr5.k5', turns: [{ by: 'a', dr: "I lost {price} and {b} made me laugh about it. I won't forget that." }] },
    { id: 'hr5.k6', turns: [{ by: 'b', dr: "{a} looked gutted. I just sat with {a} for a bit." }] },
  ],
  'roller.lost.mocked': [
    { id: 'hr5.m1', turns: [{ by: 'b', say: "Do they take returns?" }, { beat: 'Everyone laughs. {a} laughs too, because the alternative is worse.' }] },
    { id: 'hr5.m2', turns: [{ by: 'a', dr: "By lunch, {b} was doing an impression of me losing {price}. I had to stand there and take it." }] },
    { id: 'hr5.m3', turns: [{ by: 'b', say: "Oh, that's so unlucky." }, { by: 'a', dr: "{b} said it in exactly the tone that isn't sympathy. I've added a name to a list." }] },
    { id: 'hr5.m4', turns: [{ by: 'b', say: "How much was it again?" }, { by: 'a', say: "You know how much." }] },
    { id: 'hr5.m5', turns: [{ by: 'a', dr: "{b} thinks my loss is the funniest thing that's happened all week. I'll remember that." }] },
    { id: 'hr5.m6', turns: [{ by: 'b', dr: "I made one joke about {a}'s money. Maybe two." }] },
  ],
  'roller.wheel.follows': [
    { id: 'hr5.f1', turns: [{ by: 'a', say: "The wheel didn't wake up and pick me. {b} paid for that wheel to spin." }, { beat: 'The room goes quiet.' }] },
    { id: 'hr5.f2', turns: [{ by: 'a', dr: "Nobody chose my name. But somebody chose the spin, and that somebody is sitting there with immunity." }] },
    { id: 'hr5.f3', turns: [{ by: 'a', say: "Enjoying your safety, {b}?" }, { by: 'b', say: "It was random." }, { by: 'a', say: "The spin wasn't." }] },
    { id: 'hr5.f4', turns: [{ by: 'b', dr: "{a} has worked out whose money started the wheel. I can feel it from across the room." }] },
    { id: 'hr5.f5', turns: [{ by: 'a', dr: "Blame the wheel, they said. I'm blaming the person who paid for it." }] },
    { id: 'hr5.f6', turns: [{ by: 'a', dr: "{b} bought that spin. My nomination has a name on it after all." }] },
  ],
  'roller.wheel.wheel': [
    { id: 'hr5.w1', turns: [{ by: 'a', dr: "I've spent all day angry at a piece of casino equipment. At least it can't vote." }] },
    { id: 'hr5.w2', turns: [{ by: 'a', dr: "I keep saying 'at random' like it'll start to sound better. It doesn't." }] },
    { id: 'hr5.w3', turns: [{ by: 'a', dr: "I'm on the block and I can't even campaign against whoever did it. Nobody did it." }] },
    { id: 'hr5.w4', turns: [{ by: 'a', dr: "A wheel put me on the block. How do I argue with a wheel?" }] },
    { id: 'hr5.w5', turns: [{ by: 'a', dr: "This is the loneliest nomination there is. Nobody to blame. Nobody to beg." }] },
    { id: 'hr5.w6', turns: [{ by: 'a', dr: "Just my luck. Literally." }] },
  ],
  'roller.derby.admires': [
    { id: 'hr5.a1', turns: [{ by: 'a', dr: "{b} never played a second of that competition and used a veto. Best money anyone has spent in this house." }] },
    { id: 'hr5.a2', turns: [{ by: 'a', dr: "Anyone who can buy their way into a veto ceremony is not a floater. I've moved {b} up my list." }] },
    { id: 'hr5.a3', turns: [{ by: 'a', say: "Some spare cash and a good guess." }, { beat: '{a} says it twice.' }, { by: 'a', dr: "What else is {b} holding?" }] },
    { id: 'hr5.a4', turns: [{ by: 'a', dr: "I'm impressed by {b}. That's worse for {b} than if I were angry." }] },
    { id: 'hr5.a5', turns: [{ by: 'a', say: "Nice bet." }, { by: 'b', say: "Thanks." }, { by: 'a', dr: "That wasn't a compliment. Well. It was. That's the problem." }] },
    { id: 'hr5.a6', turns: [{ by: 'b', dr: "{a} keeps watching me since the veto. I think I've shown too much." }] },
  ],
  'roller.derby.bought': [
    { id: 'hr5.b1', turns: [{ by: 'a', say: "People train for that competition. {b} bought it at a betting window." }, { by: 'b', say: "And?" }, { by: 'a', say: "It's not a game any more. It's a shop." }] },
    { id: 'hr5.b2', turns: [{ by: 'a', dr: "{b} took someone off the block with a veto {b} won lying down. I want that on the record." }] },
    { id: 'hr5.b3', turns: [{ by: 'a', say: "Congratulations on your gambling." }, { beat: 'Half the house laughs. The other half agrees.' }] },
    { id: 'hr5.b4', turns: [{ by: 'b', say: "It's in the rules." }, { by: 'a', say: "Lots of things are in the rules." }] },
    { id: 'hr5.b5', turns: [{ by: 'a', dr: "I competed for that veto. {b} bought it. That's not fair." }] },
    { id: 'hr5.b6', turns: [{ by: 'b', dr: "{a} is furious I bought the veto. I'd do it again." }] },
  ],
};
