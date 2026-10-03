// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist4.js — punishments, Camp Comeback, Prizes and Punishments (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/punishments.js, camp-comeback.js and prize-exchange.js.
//
//   punish.serious  a talks game in a costume; b cannot keep a straight face   scene
//   punish.horn     a keeps being summoned mid-conversation; b carries on       scene
//   punish.tether   a and b are tied together and cannot talk privately         scene
//   punish.pity     b is kind to a about the punishment, which is worse         scene
//   camp.table      a, in camp, lives with b, who voted a out ({tally} voted)   scene
//   camp.honest     a, in camp, says out loud what b has been doing             scene
//   camp.door       a fears b, one of {campers} campers, coming back            scene
//   camp.room       a in the camp room; b visits                                scene; intent visited
//   swap.money      a is nominated holding {item}; b judges the choice          scene
//   swap.robbery    b took the veto from a, on the block, for {gave}            scene
//   swap.gave       a swapped the veto away for {took}; b wonders why           scene
//   swap.boxes      a is stuck with {item}; b makes use of it                   scene

export default {
  'punish.serious.scene': [
    { id: 'pn4.s1', turns: [{ by: 'a', say: "Listen to me. This is important." }, { beat: '{b} tries very hard not to laugh at the costume.' }, { by: 'a', dr: "Best argument I've made all season. Nobody heard it." }] },
    { id: 'pn4.s2', turns: [{ by: 'b', say: "Sure. Absolutely. Yes." }, { by: 'a', say: "You're talking to me like I'm a child." }, { by: 'b', say: "You're dressed like one." }] },
    { id: 'pn4.s3', turns: [{ by: 'a', dr: "I have to say everything twice. Once for the laugh. Once so {b} actually listens." }] },
    { id: 'pn4.s4', turns: [{ by: 'a', say: "Can I take it off for five minutes?" }, { by: 'b', say: "No." }, { by: 'a', dr: "So the conversation I needed to have isn't happening today." }] },
    { id: 'pn4.s5', turns: [{ by: 'b', dr: "{a} had a good point. I just couldn't look at {a} while {a} made it." }] },
    { id: 'pn4.s6', turns: [{ by: 'a', dr: "Nobody takes you seriously in a costume. Nobody thinks you're a threat either. I'll take that half." }] },
  ],
  'punish.horn.scene': [
    { id: 'pn4.h1', turns: [{ by: 'a', say: "So here's what I think we should do—" }, { beat: 'The horn goes. {a} has to leave.' }, { by: 'b', dr: "I finished that conversation with someone else." }] },
    { id: 'pn4.h2', turns: [{ by: 'b', dr: "I know exactly how long {a} gets between horns. I save the hard questions for when {a} is gone." }] },
    { id: 'pn4.h3', turns: [{ by: 'a', say: "What did I miss?" }, { by: 'b', say: "Nothing much." }, { by: 'a', dr: "That's the fourth time today I've missed nothing much." }] },
    { id: 'pn4.h4', turns: [{ by: 'a', dr: "Every plan I'm part of this week has a hole in it. The hole is me, running off when the horn goes." }] },
    { id: 'pn4.h5', turns: [{ beat: 'The horn goes again.' }, { by: 'a', say: "You're joking." }, { by: 'b', say: "Go on. We'll wait." }, { by: 'a', dr: "They won't." }] },
    { id: 'pn4.h6', turns: [{ by: 'a', dr: "I keep coming back to rooms that have already moved on without me." }] },
  ],
  'punish.tether.scene': [
    { id: 'pn4.t1', turns: [{ by: 'b', dr: "I haven't had a private conversation since they tied me to {a}. Every deal I make, {a} hears." }] },
    { id: 'pn4.t2', turns: [{ by: 'a', say: "I need ten minutes alone." }, { by: 'b', say: "So do I." }, { by: 'a', say: "Well, we can't." }] },
    { id: 'pn4.t3', turns: [{ by: 'a', dr: "I've heard every pitch {b} made this week. I know more about {b} than I ever wanted to." }] },
    { id: 'pn4.t4', turns: [{ by: 'b', say: "This is your fault." }, { by: 'a', say: "How is this my fault?" }, { by: 'b', say: "I don't know. It just is." }] },
    { id: 'pn4.t5', turns: [{ by: 'b', dr: "Most of this game is whispers. You don't realise until you can't have any." }] },
    { id: 'pn4.t6', turns: [{ by: 'a', say: "Can you at least walk slower?" }, { by: 'b', say: "Can you walk faster?" }] },
  ],
  'punish.pity.scene': [
    { id: 'pn4.p1', turns: [{ by: 'b', say: "Honestly, you're doing really well with it." }, { by: 'a', dr: "Being laughed at was better. Now people are just being nice to me." }] },
    { id: 'pn4.p2', turns: [{ by: 'b', say: "At least people feel bad for you." }, { by: 'a', say: "Does pity come with a vote?" }] },
    { id: 'pn4.p3', turns: [{ beat: '{b} brings {a} a plate without being asked.' }, { by: 'a', dr: "I'm not someone playing any more. I'm someone having a hard week." }] },
    { id: 'pn4.p4', turns: [{ by: 'b', dr: "I made one joke about the punishment. Then I saw how tired {a} looked and stopped." }] },
    { id: 'pn4.p5', turns: [{ by: 'b', say: "Need anything?" }, { by: 'a', say: "I need people to stop asking me that." }] },
    { id: 'pn4.p6', turns: [{ by: 'a', dr: "Everyone's being so kind to me. Nobody's making plans with me." }] },
  ],
  'camp.table.scene': [
    { id: 'cm4.t1', turns: [{ by: 'b', dr: "I voted {a} out. Now I pass {a} the milk every morning. I've started having breakfast late." }] },
    { id: 'cm4.t2', turns: [{ by: 'b', say: "Sorry. Again." }, { by: 'a', say: "You can stop apologising." }, { by: 'b', dr: "I can't. It's the only thing making this bearable." }] },
    { id: 'cm4.t3', when: { intent: 'many' }, turns: [{ by: 'a', dr: "All {tally} people who voted me out are being very normal about it. It's funnier every day." }] },
    { id: 'cm4.t4', turns: [{ by: 'a', say: "Morning, {b}." }, { by: 'b', say: "Morning." }, { beat: 'They both look at their cereal.' }] },
    { id: 'cm4.t5', turns: [{ by: 'a', dr: "Usually when you vote someone out, you never see them again. {b} sees me every day." }] },
    { id: 'cm4.t6', turns: [{ by: 'b', dr: "{a} is still in the house. My vote didn't get rid of anyone. It just made breakfast awkward." }] },
    { id: 'cm4.t7', turns: [{ by: 'a', say: "Pass the salt, {b}?" }, { beat: '{b} passes it very carefully.' }] },
    { id: 'cm4.t8', turns: [{ by: 'b', dr: "I can't avoid {a}. We share a kitchen. We share a bathroom. I voted {a} out." }] },
    { id: 'cm4.t9', turns: [{ by: 'a', dr: "I don't hold it against {b}. I just like watching {b} squirm a little." }] },
    { id: 'cm4.t10', turns: [{ by: 'b', say: "Do you hate me?" }, { by: 'a', say: "Not yet." }] },
  ],
  'camp.honest.scene': [
    { id: 'cm4.h1', turns: [{ by: 'a', say: "Everyone knows what {b} has been doing. I'll just say it." }, { beat: 'And {a} does.' }] },
    { id: 'cm4.h2', turns: [{ by: 'a', dr: "I can't be nominated. I can't be voted out. So I'm telling the truth about {b}." }] },
    { id: 'cm4.h3', turns: [{ by: 'b', say: "Why would you say that?" }, { by: 'a', say: "What are you going to do, evict me?" }, { beat: '{b} has no answer.' }] },
    { id: 'cm4.h4', turns: [{ by: 'b', dr: "I spent weeks managing what people think. {a} undid it in one sentence over the washing up." }] },
    { id: 'cm4.h5', turns: [{ by: 'a', dr: "I've got no reason to lie any more. People know that. So they believe me about {b}." }] },
    { id: 'cm4.h6', turns: [{ by: 'a', say: "{b} has been playing all of you." }, { by: 'b', say: "That's not true." }, { by: 'a', say: "It is, though." }] },
    { id: 'cm4.h7', turns: [{ by: 'a', dr: "Nobody in the game will say it about {b}. I'm not in the game. So I will." }] },
    { id: 'cm4.h8', turns: [{ by: 'b', dr: "{a} has nothing to lose. That makes {a} the most dangerous person in this house for me." }] },
    { id: 'cm4.h9', turns: [{ by: 'a', say: "Ask {b} about last week." }, { by: 'b', say: "Here we go." }] },
    { id: 'cm4.h10', turns: [{ by: 'a', dr: "Telling the truth costs me nothing now. It's costing {b} a lot." }] },
  ],
  'camp.door.scene': [
    { id: 'cm4.d1', turns: [{ by: 'a', dr: "There are {campers} people in that camp, comparing what we promised them. One of them is coming back. I keep thinking it's {b}." }] },
    { id: 'cm4.d2', turns: [{ by: 'a', dr: "Everyone's being really nice to the camp. That's how you know we've all worked out one of them is coming back." }] },
    { id: 'cm4.d3', turns: [{ by: 'a', dr: "Whoever comes back has dirt on all of us. I'm trying to remember what I said to {b}." }] },
    { id: 'cm4.d4', turns: [{ by: 'a', dr: "{b} has been quiet and polite since going into camp. The angry ones don't scare me. {b} does." }] },
    { id: 'cm4.d5', turns: [{ by: 'a', say: "How's camp, {b}?" }, { by: 'b', say: "Fine." }, { by: 'a', dr: "Fine is what you say when you're taking notes." }] },
    { id: 'cm4.d6', turns: [{ by: 'a', dr: "If {b} comes back through that door, I'm in trouble." }] },
    { id: 'cm4.d7', turns: [{ by: 'a', dr: "I've started being extra nice to everyone in camp. Just in case." }] },
    { id: 'cm4.d8', turns: [{ by: 'a', say: "Do you think {b} will come back?" }, { beat: 'Nobody wants to answer that.' }] },
    { id: 'cm4.d9', turns: [{ by: 'a', dr: "{b} has had a lot of time to think in that camp. That's what scares me." }] },
    { id: 'cm4.d10', turns: [{ by: 'b', dr: "Everyone in the house is suddenly very friendly. They know one of us is coming back." }] },
  ],
  'camp.room.scene': [
    { id: 'cm4.r1', turns: [{ by: 'a', dr: "I watch the competitions on that little TV and call every mistake before it happens. Nobody playing can hear me." }] },
    { id: 'cm4.r2', turns: [{ by: 'a', dr: "Bad bed, small TV, no way back into the game. I know this house better than anyone still playing it." }] },
    { id: 'cm4.r3', when: { intent: 'visited' }, turns: [{ beat: '{b} comes and sits in the camp room for an hour.' }, { by: 'a', dr: "Nobody asked {b} to. It's the nicest thing anyone has done for me all week." }] },
    { id: 'cm4.r4', when: { intent: 'visited' }, turns: [{ by: 'b', say: "Thought you might want company." }, { by: 'a', say: "I always want company in here." }] },
    { id: 'cm4.r5', turns: [{ by: 'a', dr: "I commentate the competitions to the wall. The wall never disagrees." }] },
    { id: 'cm4.r6', when: { intent: 'visited' }, turns: [{ by: 'a', say: "What's going on out there?" }, { by: 'b', say: "Same as ever." }, { by: 'a', say: "Tell me anyway." }] },
    { id: 'cm4.r7', turns: [{ by: 'a', dr: "The days are long in camp. I've counted the ceiling tiles twice." }] },
    { id: 'cm4.r8', when: { intent: 'visited' }, turns: [{ by: 'b', say: "I brought you a snack." }, { by: 'a', say: "You're my favourite person in this house." }] },
    { id: 'cm4.r9', turns: [{ by: 'a', dr: "From in here, I can see every mistake people are making. I just can't do anything about it." }] },
    { id: 'cm4.r10', when: { intent: 'visited' }, turns: [{ by: 'a', say: "You'll get in trouble for hanging out with me." }, { by: 'b', say: "I'll risk it." }] },
  ],
  'swap.money.scene': [
    { id: 'px4.m1', turns: [{ by: 'b', dr: "{a} is on the block holding {item}. Everyone watched {a} choose it. That's going to sound terrible to a jury." }] },
    { id: 'px4.m2', turns: [{ by: 'b', say: "You picked {item}." }, { beat: '{b} says nothing else. Nobody needs more.' }] },
    { id: 'px4.m3', turns: [{ by: 'a', dr: "I keep explaining why I picked {item}. The explanation keeps getting longer." }] },
    { id: 'px4.m4', turns: [{ by: 'b', dr: "There was one thing on that table that could have saved {a}. {a} came away with {item}. That's the story a jury will hear." }] },
    { id: 'px4.m5', turns: [{ by: 'b', say: "Was it worth it?" }, { by: 'a', say: "Ask me on Thursday." }] },
    { id: 'px4.m6', turns: [{ by: 'a', dr: "Maybe I should have gone for the veto. Too late now." }] },
  ],
  'swap.robbery.scene': [
    { id: 'px4.r1', turns: [{ by: 'a', say: "You knew where I was sitting." }, { beat: '{b} has no answer that sounds good out loud.' }] },
    { id: 'px4.r2', turns: [{ by: 'a', dr: "I'm on the block. I had the veto in my hands. {b} took it and gave me {gave}." }] },
    { id: 'px4.r3', turns: [{ by: 'a', dr: "I had the only thing that mattered for about ninety seconds. Now I've got {gave} and a campaign to run." }] },
    { id: 'px4.r4', turns: [{ by: 'b', say: "It was just a trade." }, { by: 'a', say: "It was my veto, {b}. I'm on the block." }] },
    { id: 'px4.r5', turns: [{ by: 'b', dr: "Everyone watched me take it. I didn't think about that part." }] },
    { id: 'px4.r6', turns: [{ by: 'a', dr: "That wasn't a trade. {b} decided in front of everyone whether I stay in this house." }] },
  ],
  'swap.gave.scene': [
    { id: 'px4.g1', turns: [{ by: 'b', dr: "{a} had the veto and swapped it for {took}. Either {a} isn't playing, or {a} wants us to think so." }] },
    { id: 'px4.g2', turns: [{ by: 'b', dr: "Giving the veto away is either the most relaxed thing anyone's done all season or the most calculated. I can't tell which." }] },
    { id: 'px4.g3', turns: [{ by: 'b', say: "You gave it away." }, { by: 'a', say: "I didn't need it." }, { by: 'b', dr: "That's what worries me." }] },
    { id: 'px4.g4', turns: [{ by: 'a', dr: "I'm happy with {took}. People keep asking me if I'm sure." }] },
    { id: 'px4.g5', turns: [{ by: 'b', dr: "{a} looks perfectly happy with {took}. That's exactly how I'd look if I'd planned it." }] },
    { id: 'px4.g6', turns: [{ by: 'b', say: "Why didn't you keep the veto?" }, { by: 'a', say: "Why would I?" }] },
  ],
  'swap.boxes.scene': [
    { id: 'px4.b1', turns: [{ by: 'b', say: "You didn't have to take that box." }, { by: 'a', say: "I didn't know what was in it!" }, { by: 'b', say: "Still." }] },
    { id: 'px4.b2', turns: [{ by: 'a', dr: "The competition was over on Wednesday. I'm still paying for it on Thursday, when it matters." }] },
    { id: 'px4.b3', turns: [{ by: 'b', dr: "Every time {a} gets pulled away for the punishment, I get another conversation without {a}." }] },
    { id: 'px4.b4', turns: [{ by: 'a', dr: "I got {item}, in front of everyone. Now I have to live with it all week." }] },
    { id: 'px4.b5', turns: [{ by: 'b', dr: "{a}'s punishment was funny for about a day. Now it's useful." }] },
    { id: 'px4.b6', turns: [{ by: 'a', say: "Don't laugh." }, { by: 'b', say: "I'm not laughing." }, { beat: '{b} is laughing.' }] },
  ],
};
