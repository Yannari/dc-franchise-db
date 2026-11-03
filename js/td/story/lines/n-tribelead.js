// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tribelead.js — First Impressions: Tribe Leaders, as the people in it talk
// ══════════════════════════════════════════════════════════════════════
//
// td/story/twist.js writeTribeLeaders (twists.js executeTribeLeaders decides everything).
// Day one, Survivor: Kaôh Rōng. These people met a few hours ago. Nobody leaves, nobody switches.
//   tl.huddle.self     before the leader vote: a (the boldest) puts a forward; b answers; c doubts (may be missing)
//   tl.huddle.other    a puts {target} forward; b answers; c doubts (may be missing)
//   tl.booth.<why>     one voter, alone, choosing {target} to lead (liked: already get on; bold: took charge;
//                      strong: looks capable; smart: seems sharp; kind: easy to talk to; gut; nothing)
//   tl.lead.any        h names a the leader of {tribe}; a reacts; b (another of the tribe) reacts (may be missing)
//   tl.weak.<why>      h gives the leader a the one job; a names b, {target}, the weakest (weak: body; old: age;
//                      quiet: hasn't spoken up; enemy: a doesn't like b); b reacts; c reacts (may be missing)
//   tl.named.any       a, just named the weakest by {leader}, to the camera
//   tl.chopper.any     h tells a, b and c (c may be missing), the ones named ({named}: all of them), what it gets them
//   tl.choose.clue     a, alone at {tribe}'s camp, takes the idol clue over the rice
//   tl.choose.rice     a takes the extra bag of rice for {tribe} over the clue
//   tl.choose.riceonly a finds a bag of rice waiting, and nothing else, and takes it for {tribe}
//   tl.tell.rice       the tribe arrives; a shows them the rice; b ({leader}) and c react
//   tl.tell.riceonly   the same when there was no clue to choose (idols off): the rice was simply waiting
//   tl.tell.truth      a tells them it was the clue, not the rice; b ({leader}) and c react
//   tl.tell.lie        a took the clue and tells them there was nothing to take; b and c believe it
//   tl.after.any       a, the leader, to the camera once {target} is back from the helicopter
// The rice is the twist's own prop, said through {staple} (= 'rice', a name the word filter does not match): td/script/food.js keeps the word out of
// camp scenes at a venue where Chef does the cooking, and this bag comes from production, not the camp pot.
// Ids: 'ntl.'.

export default {
  'tl.huddle.self': [
    { id: 'ntl.hs1', turns: [
      { by: 'a', say: "Okay, somebody has to do this, so I'll just say it. I think I should lead.", v: { anxious: "Okay, um, I know this is weird, but I think I could do it? Lead, I mean.", bossy: "Look, somebody has to run this, and I already know I can." } },
      { by: 'b', say: "I mean, you've been the one talking since we got here, so that makes sense." },
      { by: 'a', say: "I'm not trying to be anybody's boss. I just want us to be organised." },
      { by: 'c', opt: true, say: "We've known you for three hours, though.", v: { dry: "Bold move, putting your own name up. I respect it, I just don't trust it.", warm: "I'm not saying no, I just think we should hear from everybody first." } },
      { by: 'a', opt: true, say: "That's fair, {c}. Vote however you want, I won't hold it against you." },
    ] },
    { id: 'ntl.hs2', turns: [
      { beat: "The tribe sits in a loose circle on their bags. Nobody wants to go first." },
      { by: 'a', say: "Fine, I'll go first. If you want me to lead, I'll do it, and I'll do it properly." },
      { by: 'b', say: "Honestly, that's more than anyone else has said." },
      { by: 'c', opt: true, say: "Or we could vote for somebody who didn't just ask for it.", v: { schemer: "The person who asks for the job is usually the one who shouldn't get it." } },
      { by: 'a', say: "Then vote for somebody else. I just didn't want us to sit here in silence." },
    ] },
    { id: 'ntl.hs3', turns: [
      { by: 'a', say: "Can I put myself forward? Is that allowed?", v: { loud: "Are we allowed to vote for ourselves? Because I want to vote for me!", calm: "Is it alright if I put my own name in?" } },
      { by: 'b', say: "Nobody said you couldn't." },
      { by: 'a', say: "Then I'm putting myself forward. I think I can keep us together." },
      { by: 'b', say: "Okay. I'll think about it." },
    ] },
  ],
  'tl.huddle.other': [
    { id: 'ntl.ho1', turns: [
      { by: 'a', say: "I think it should be {target}. {target} has been helping everybody since we got here.", v: { schemer: "I think {target} should lead. Trust me, it's better for all of us if {target} has the job." } },
      { by: 'b', say: "Yeah, I can see that." },
      { by: 'a', say: "And {target} doesn't seem like the type to let it go to {target}'s head." },
      { by: 'c', opt: true, say: "Why not you, though? You're the one who brought it up.", v: { dry: "Funny how the person nominating somebody else always seems to want the job." } },
      { by: 'a', opt: true, say: "Because I'd rather have {target} doing it, {c}. That's all." },
    ] },
    { id: 'ntl.ho2', turns: [
      { beat: "A few of them drift over to the shade while the rest are still unpacking." },
      { by: 'a', say: "Be honest. Who's actually got a clue what they're doing here?" },
      { by: 'b', say: "{target}, probably. {target} got everybody moving while the rest of us were standing around." },
      { by: 'a', say: "That's what I was thinking. {target} it is, then." },
      { by: 'c', opt: true, say: "I don't know. I'm not voting for anyone just because they spoke up first.", v: { warm: "{target} is nice, but I'd like to get to know everybody before I pick." } },
    ] },
    { id: 'ntl.ho3', turns: [
      { by: 'a', say: "We need somebody people will actually listen to. I keep coming back to {target}." },
      { by: 'b', say: "Same. I'd follow {target}.", v: { anxious: "Me too. I really don't want it to be me, so, yeah, {target}." } },
      { by: 'a', say: "Good. Then let's not overthink it." },
    ] },
  ],

  'tl.booth.liked': [
    { id: 'ntl.bli1', turns: [{ by: 'a', conf: "{target} was the first person here who actually talked to me, so {target} has my vote. That matters to me.", v: { warm: "{target} made me feel welcome from the very first minute. Of course I'm voting for {target}." } }] },
    { id: 'ntl.bli2', turns: [{ by: 'a', conf: "I like {target}. I'd rather be led by somebody I like than somebody I'm scared of." }] },
    { id: 'ntl.bli3', turns: [{ by: 'a', conf: "{target} and I clicked straight away. If I have to follow somebody, I want it to be somebody I actually like." }] },
    { id: 'ntl.bli4', turns: [{ by: 'a', conf: "I trust {target} already, and that's saying something, because I don't trust anybody this fast." }] },
    { id: 'ntl.bli5', turns: [{ by: 'a', conf: "{target} has been looking out for me since we got here. That's who I want in charge." }] },
  ],
  'tl.booth.bold': [
    { id: 'ntl.bbo1', turns: [{ by: 'a', conf: "{target} just took charge, nobody asked, and everybody went along with it. That's a leader whether I like it or not.", v: { dry: "{target} started giving out jobs before anyone asked, so I guess {target} is the leader now." } }] },
    { id: 'ntl.bbo2', turns: [{ by: 'a', conf: "Somebody has to make decisions, and {target} clearly isn't afraid to. I'm voting for {target}." }] },
    { id: 'ntl.bbo3', turns: [{ by: 'a', conf: "{target} wasn't scared to speak up when the rest of us were just standing there. That's what a leader does." }] },
    { id: 'ntl.bbo4', turns: [{ by: 'a', conf: "{target} has an opinion about everything. Normally that would annoy me, but today it's exactly what we need." }] },
    { id: 'ntl.bbo5', turns: [{ by: 'a', conf: "I'd rather have somebody too confident than somebody who freezes. {target} doesn't freeze." }] },
  ],
  'tl.booth.strong': [
    { id: 'ntl.bst1', turns: [{ by: 'a', conf: "{target} looks like {target} could carry the whole tribe on {target}'s back. I want that person in charge.", v: { competitive: "We want to win, right? Then you put the strongest person in front, and that's {target}." } }] },
    { id: 'ntl.bst2', turns: [{ by: 'a', conf: "If we're going to win challenges, I want the leader to be somebody who can actually do them. That's {target}." }] },
    { id: 'ntl.bst3', turns: [{ by: 'a', conf: "{target} is the one I'd want next to me in a challenge, so {target} gets my vote to lead." }] },
    { id: 'ntl.bst4', turns: [{ by: 'a', conf: "We're going to need muscle out here, and {target} has the most of it. Simple as that." }] },
    { id: 'ntl.bst5', turns: [{ by: 'a', conf: "{target} picked up the heaviest bag without even thinking about it, and everybody noticed." }] },
  ],
  'tl.booth.smart': [
    { id: 'ntl.bsm1', turns: [{ by: 'a', conf: "{target} is sharp. You can tell after five minutes of talking to {target}. I want somebody who thinks things through.", v: { nerdy: "{target} asks really good questions, which is rare, so I'm voting for {target}." } }] },
    { id: 'ntl.bsm2', turns: [{ by: 'a', conf: "I'm going with {target}. Out of everybody here, {target} is the one who seems to have a plan." }] },
    { id: 'ntl.bsm3', turns: [{ by: 'a', conf: "{target} is the smartest person on this tribe. I could tell in about ten minutes." }] },
    { id: 'ntl.bsm4', turns: [{ by: 'a', conf: "If we have to follow somebody, I want it to be somebody who's actually thinking ahead. That's {target}." }] },
    { id: 'ntl.bsm5', turns: [{ by: 'a', conf: "{target} doesn't say much, but when {target} does, it's always the right thing. That's a good sign in a leader." }] },
  ],
  'tl.booth.kind': [
    { id: 'ntl.bki1', turns: [{ by: 'a', conf: "{target} gets along with everybody, and if the leader is somebody people like, nobody fights. So, {target}." }] },
    { id: 'ntl.bki2', turns: [{ by: 'a', conf: "{target} is easy to talk to, and I think that's the most important thing on day one.", v: { anxious: "{target} is the only person here who doesn't make me nervous, so I'm voting for {target}." } }] },
    { id: 'ntl.bki3', turns: [{ by: 'a', conf: "{target} made a point of talking to every single one of us. A leader who does that is a leader people will listen to." }] },
    { id: 'ntl.bki4', turns: [{ by: 'a', conf: "I want somebody fair in charge, and {target} seems fair. {target} gets my vote." }] },
    { id: 'ntl.bki5', turns: [{ by: 'a', conf: "{target} is the reason this tribe already feels like a tribe. Easy vote." }] },
  ],
  'tl.booth.gut': [
    { id: 'ntl.bgu1', turns: [{ by: 'a', conf: "I can't really explain it. I just have a feeling {target} is the right person for this.", v: { calm: "Gut says {target}. I usually listen to my gut." } }] },
    { id: 'ntl.bgu2', turns: [{ by: 'a', conf: "Something about {target} makes me think {target} won't panic when things go wrong. I'm going with that." }] },
    { id: 'ntl.bgu3', turns: [{ by: 'a', conf: "Don't ask me why. {target} just feels like the right call." }] },
    { id: 'ntl.bgu4', turns: [{ by: 'a', conf: "I watched everybody for a few hours, and my gut kept landing on {target}." }] },
  ],
  'tl.booth.nothing': [
    { id: 'ntl.bno1', turns: [{ by: 'a', conf: "I don't know any of these people, so honestly, {target}. Why not?", v: { dry: "I've known all of them for half a day. {target}. Sure. Why not." } }] },
    { id: 'ntl.bno2', turns: [{ by: 'a', conf: "I'm voting for {target}. If it goes badly, at least it wasn't me who had to do it." }] },
    { id: 'ntl.bno3', turns: [{ by: 'a', conf: "Everybody seemed to be leaning toward {target}, so I'm going with the group on this one." }] },
    { id: 'ntl.bno4', turns: [{ by: 'a', conf: "Honestly, I just didn't want it to be me. {target} seemed happy enough to do it." }] },
    { id: 'ntl.bno5', turns: [{ by: 'a', conf: "I'm writing {target}. I barely know anybody yet, so it might as well be the person who seems up for it." }] },
  ],

  'tl.lead.any': [
    { id: 'ntl.l1', turns: [
      { by: 'h', say: "The votes are in. {tribe}, your leader is {a}." },
      { by: 'a', say: "Wow. Okay. Thank you, guys, really.", v: { loud: "YES! Okay! Thank you! I won't let you down!", calm: "Thank you. I'll do my best with it.", dry: "Great. Responsibility. My favourite.", anxious: "Me? Oh no. I mean, thank you, but oh no." } },
      { by: 'b', opt: true, say: "Don't make us regret it.", v: { warm: "You'll be great. Seriously.", cruel: "We'll see how long that lasts." } },
    ] },
    { id: 'ntl.l2', turns: [
      { by: 'h', say: "{a}, congratulations. {tribe} picked you to lead." },
      { beat: "A few of the tribe clap. One or two of them don't." },
      { by: 'a', say: "I appreciate it. I'm going to try and be fair to everybody.", v: { proud: "I'm not surprised, but I appreciate it.", tough: "Alright. Then we do this my way, and we do it right.", cruel: "Good choice. Honestly, the only choice.", bossy: "Good. Then everybody listen, because we're getting organised right now.", chaotic: "Oh, you're going to regret this. In a fun way." } },
      { by: 'b', opt: true, say: "Fair is all we're asking for." },
    ] },
    { id: 'ntl.l3', turns: [
      { by: 'h', say: "{tribe} has made its choice. {a}, you're the leader." },
      { by: 'a', say: "I didn't think it would be me, honestly.", v: { schemer: "Good. That's good. I'll take care of everyone.", emotional: "I really didn't expect that. Thank you, I mean it.", loud: "Me?! Okay! Good call, everybody! Good call!", tough: "Alright. Then nobody slacks off on my watch.", chaotic: "Me? You actually voted for me? Okay, this is going to be fun.", cruel: "Finally, somebody here with taste." } },
      { by: 'h', say: "Don't get comfortable. Your first decision is coming right now." },
    ] },
  ],

  'tl.weak.weak': [
    { id: 'ntl.ww1', turns: [
      { by: 'h', say: "Here's your first job, {a}. Look at your tribe and tell me who you think is the weakest." },
      { by: 'a', say: "Seriously? Right now, in front of everybody?", v: { cruel: "Oh, that's easy.", bossy: "Fine. Somebody has to say it.", chaotic: "Oh, I love this job already.", calm: "Alright. If that's the job, I'll do it properly.", tough: "Fine. I'm not going to sugarcoat it." } },
      { by: 'h', say: "Right now." },
      { by: 'a', say: "I'm sorry, {b}, but physically I think it's you. It's nothing personal.", v: { cruel: "It's {b}. Look at {b}. I don't need to explain it.", warm: "{b}, I'm so sorry. I just mean in challenges, and you seem great otherwise." } },
      { by: 'b', say: "Wow. Okay.", v: { tough: "Weakest? You haven't even seen me do anything yet.", quiet: "...Okay.", loud: "WOW. Day one, and I'm the weakest? Thanks a lot!", emotional: "That really hurts, honestly." } },
      { by: 'c', opt: true, say: "That's rough.", v: { warm: "Hey, it's one person's opinion. Don't let it get to you." } },
    ] },
    { id: 'ntl.ww2', turns: [
      { by: 'h', say: "Leaders make the hard calls. {a}, who is the weakest person on {tribe}?" },
      { beat: "{a} looks along the line. Everybody suddenly finds something interesting on the ground." },
      { by: 'a', say: "I'm going to say {b}. I don't think {b} is going to be much help in the challenges.", v: { cruel: "{b}. I don't think {b} will be much help with anything, honestly.", warm: "I'm so sorry, {b}. I'm only saying it because I have to pick someone." } },
      { by: 'b', say: "You don't know that.", v: { proud: "You've known me for three hours. You don't know anything about what I can do.", anxious: "Oh. Okay. I mean, you might be right, but still." } },
      { by: 'a', say: "Maybe I'm wrong. I hope I am.", v: { tough: "Then prove me wrong. I'd honestly like that.", cruel: "I'm not." } },
    ] },
    { id: 'ntl.ww3', turns: [
      { by: 'h', say: "{a}, as leader, you have to name the weakest member of your tribe." },
      { by: 'a', say: "This is horrible. Okay. {b}.", v: { calm: "Alright. I'm saying {b}, and it's only about the physical stuff.", dry: "Great, I've been leader for one minute and I already have to hurt somebody. {b}.", cruel: "Easy. {b}.", bossy: "{b}. Next question.", chaotic: "Ooh, okay. Eeny, meeny... {b}." } },
      { by: 'b', say: "Of course it's me." },
      { by: 'c', opt: true, say: "That was cold." },
    ] },
  ],
  'tl.weak.old': [
    { id: 'ntl.wo1', turns: [
      { by: 'h', say: "{a}, your first decision as leader. Who is the weakest person on {tribe}?" },
      { by: 'a', say: "I don't want to say this, but I think it's {b}. Not because of anything {b} did, just, the rest of us are younger.", v: { cruel: "{b}. Come on, {b} could be my parent.", warm: "{b}, please don't take this the wrong way. I just think the challenges are going to be hardest on you." } },
      { by: 'b', say: "Because I'm older? That's what this is?", v: { calm: "Because of my age. Alright. I've heard worse.", tough: "Older doesn't mean weaker. You'll find that out.", loud: "Oh, because I'm OLD? Is that it?" } },
      { by: 'a', say: "I'm sorry. You asked me to pick somebody." },
    ] },
    { id: 'ntl.wo2', turns: [
      { by: 'h', say: "Name the weakest, {a}." },
      { by: 'a', say: "It's {b}. I'm sorry, but I think {b} will have the hardest time out here." },
      { by: 'b', say: "I've been working my whole life. You don't know what I can do." },
      { by: 'c', opt: true, say: "I think {b} might surprise you, actually." },
    ] },
  ],
  'tl.weak.quiet': [
    { id: 'ntl.wq1', turns: [
      { by: 'h', say: "{a}, who is the weakest person on your tribe?" },
      { by: 'a', say: "I'll say {b}. {b} has barely said a word since we got here, and I don't know if {b} is with us or not.", v: { warm: "I'm saying {b}, but only because I haven't really gotten to know {b} yet." } },
      { by: 'b', say: "I've been listening. That's not the same as being weak.", v: { quiet: "...I just don't talk much.", anxious: "I was going to talk to everybody, I just didn't know how to start." } },
      { by: 'a', say: "Then talk to us more, and I'll change my mind." },
    ] },
    { id: 'ntl.wq2', turns: [
      { by: 'h', say: "Your first call, {a}. Who's the weakest?" },
      { by: 'a', say: "{b}. I'm not trying to be mean, I just don't know anything about {b}." },
      { by: 'b', say: "You could have asked." },
      { by: 'c', opt: true, say: "That's fair, actually." },
    ] },
  ],
  'tl.weak.enemy': [
    { id: 'ntl.we1', turns: [
      { by: 'h', say: "{a}, name the weakest person on {tribe}." },
      { by: 'a', say: "{b}.", v: { cruel: "{b}. Easily.", schemer: "I'm going to have to say {b}. Sorry, {b}, it's just my honest opinion." } },
      { by: 'b', say: "Of course you'd say me. You've had a problem with me since we got here.", v: { loud: "OF COURSE it's me! You've hated me since the minute we got here!", dry: "Shocking. Truly. Nobody saw that coming." } },
      { by: 'a', say: "This isn't about that.", v: { cruel: "Maybe it is, maybe it isn't." } },
      { by: 'c', opt: true, say: "Okay, let's all just calm down." },
    ] },
    { id: 'ntl.we2', turns: [
      { by: 'h', say: "Who's the weakest, {a}?" },
      { beat: "{a} doesn't even pretend to think about it." },
      { by: 'a', say: "{b}." },
      { by: 'b', say: "You're not even going to give a reason?" },
      { by: 'a', say: "You know the reason." },
    ] },
  ],

  'tl.named.any': [
    { id: 'ntl.n1', turns: [{ by: 'a', conf: "{leader} called me the weakest in front of everybody. I'm going to remember that for a long time.", v: { warm: "It hurt, I'm not going to lie. But I'm going to prove {leader} wrong, and I'm going to be nice about it.", tough: "Weakest. Okay, let {leader} think that, because it makes my life easier.", schemer: "Being called the weakest on day one is actually the best place to be. Nobody worries about the weak one.", emotional: "I wanted to cry, honestly. I held it together, but I really wanted to cry." } }] },
    { id: 'ntl.n2', turns: [{ by: 'a', conf: "I didn't come here to be the weak one. I came here to win, and now I've got something to prove.", v: { anxious: "Everybody heard it, so now everybody thinks I'm the weak link. That's a target on my back already.", dry: "Weakest. On day one. Before any challenge. That has to be some kind of record." } }] },
    { id: 'ntl.n3', turns: [{ by: 'a', conf: "{leader} had one decision to make and used it on me. Fine. Now I know exactly where I stand.", v: { chaotic: "{leader} wants to call me weak? Great. Now I get to have some fun proving it wrong.", goofy: "Weakest on the tribe. I'm putting that on a t-shirt.", calm: "I'm not angry, because {leader} had to pick somebody. I just wish it wasn't me." } }] },
    { id: 'ntl.n4', turns: [{ by: 'a', conf: "I keep replaying it. {leader} looked right at me and said it. I know it's just a game, but that one stung.", v: { tough: "I've been underestimated my whole life. {leader} is just the newest one.", loud: "The WEAKEST? Me? {leader} has no idea who {leader} just picked a fight with!" } }] },
  ],

  'tl.chopper.any': [
    { id: 'ntl.c1', turns: [
      { by: 'h', say: "{named}. Your leaders just called you the weakest people on your tribes." },
      { by: 'a', say: "Yeah. We were there.", v: { dry: "Thanks for the reminder." } },
      { by: 'h', say: "Well, here's the thing. Being called weak just got you a ride. You're flying to camp in the helicopter, and you'll get there long before your tribes do." },
      { by: 'b', say: "Wait, really?", v: { loud: "NO WAY! Are you serious?!", calm: "Huh. I didn't see that coming.", anxious: "Is this a trick? This feels like a trick." } },
      { by: 'h', say: "Really. And there's something waiting for each of you when you land." },
      { by: 'c', opt: true, say: "Being the weakest is the best thing that's happened to me all day." },
    ] },
    { id: 'ntl.c2', turns: [
      { beat: "The helicopter's rotors start turning somewhere behind the trees." },
      { by: 'h', say: "While your tribes walk to camp, you get to fly." },
      { by: 'a', say: "Hold on. We get rewarded for being called weak?" },
      { by: 'h', say: "You do. Get in." },
      { by: 'b', say: "I'm not going to argue with that.", v: { warm: "Oh, I love this. I really needed this today.", competitive: "Then I'm going to make the most of it." } },
    ] },
  ],

  'tl.choose.clue': [
    { id: 'ntl.cc1', turns: [
      { beat: "{a} finds a bag of {staple} and a sealed envelope waiting at the {tribe} camp, with a note: take one." },
      { by: 'a', conf: "The {staple} is for everybody. The clue is for me. They called me the weakest, so I'm going to look after myself.", v: { schemer: "The {staple} feeds them for a few days. The clue keeps me in the game for weeks. That isn't a hard choice.", anxious: "I feel so guilty, but if I'm the weakest, I'm going home first unless I find an idol. I have to take the clue." } },
    ] },
    { id: 'ntl.cc2', turns: [
      { beat: "{a} stands between the {staple} and the envelope for a long time." },
      { by: 'a', conf: "Everybody already thinks I'm the first to go. The idol is the only thing that changes that. I'm taking the clue.", v: { competitive: "I didn't come here to make friends with a bag of {staple}. I came here to win. Clue." } },
    ] },
    { id: 'ntl.cc3', turns: [
      { beat: "{a} sits down in the empty camp, the envelope in one hand and the bag of {staple} at {a.posAdj} feet." },
      { by: 'a', conf: "If I take the {staple}, they like me for a day. If I take the clue, I might still be here in a month. I'm taking the clue.", v: { warm: "I hate this. They're going to be so hungry. But I really need a chance to stay, so I'm taking the clue.", dry: "Food or survival. Tough one. I'll take survival." } },
    ] },
    { id: 'ntl.cc4', turns: [
      { beat: "{a} reads the note twice before picking anything up." },
      { by: 'a', conf: "They made me feel like the weakest person here. The clue is how I make sure that doesn't send me home.", v: { proud: "Everybody wrote me off before lunch. With this clue, they're going to regret it." } },
    ] },
  ],
  'tl.choose.rice': [
    { id: 'ntl.cr1', turns: [
      { beat: "{a} finds a bag of {staple} and a sealed envelope waiting at the {tribe} camp, with a note: take one." },
      { by: 'a', conf: "I could take the clue, but then I'm the person who let the tribe go hungry on day one. I'm taking the {staple}.", v: { warm: "They're going to be starving when they get here. Of course I'm taking the {staple}.", schemer: "Rice buys me friends. Right now, friends are worth more than a clue." } },
    ] },
    { id: 'ntl.cr2', turns: [
      { beat: "{a} picks up the envelope, turns it over, and puts it back down." },
      { by: 'a', conf: "They called me the weakest. Walking in with food for everybody is the best answer I can give them.", v: { proud: "Let's see who's weak when I'm the one who fed the whole tribe.", earnest: "I want them to trust me. Taking the {staple} is how I start." } },
    ] },
    { id: 'ntl.cr3', turns: [
      { beat: "{a} looks at the envelope for a long time, then picks up the bag of {staple} instead." },
      { by: 'a', conf: "I'd love an idol. But I'm not going to be the person who let everybody go hungry on the first night.", v: { anxious: "If I take the clue and they find out, they'll vote me out for sure. The {staple} is safer. I think." } },
    ] },
    { id: 'ntl.cr4', turns: [
      { beat: "{a} drags the bag of {staple} into the middle of camp and sits on it." },
      { by: 'a', conf: "A clue helps me. The {staple} helps all of us, and I need all of us to like me right now.", v: { calm: "I thought about it, and the {staple} is the better long game. People remember who fed them." } },
    ] },
  ],
  'tl.choose.riceonly': [
    { id: 'ntl.co1', turns: [
      { beat: "{a} finds an extra bag of {staple} waiting at the {tribe} camp, with a note that says it belongs to the tribe." },
      { by: 'a', conf: "They called me the weakest, and I'm the one walking them into camp with extra food. I'll take that.", v: { dry: "So the weak one brings dinner. Funny how that works." } },
    ] },
    { id: 'ntl.co2', turns: [
      { beat: "{a} finds a bag of {staple} waiting at the empty {tribe} camp, with a note that says it's for the whole tribe." },
      { by: 'a', conf: "The weakest one gets to walk in with dinner. I'm going to enjoy telling them where it came from.", v: { warm: "They're going to be so happy. I can't wait to see their faces when they walk in.", anxious: "Maybe this helps. Maybe they'll stop looking at me like I'm the first one out." } },
    ] },
    { id: 'ntl.co3', turns: [
      { beat: "{a} drags the bag of {staple} into the middle of the empty {tribe} camp and sits down on it to wait." },
      { by: 'a', conf: "I didn't do anything to earn it except get insulted. But I'll take it, and so will they.", v: { proud: "Called weak, flown in, and handed the food. Today is going a lot better than it started." } },
    ] },
  ],

  'tl.tell.rice': [
    { id: 'ntl.tr1', turns: [
      { beat: "The rest of {tribe} finally walks into camp, sweaty and tired. {a} is waiting with the bag of {staple}." },
      { by: 'b', say: "Where have you been? And what is that?" },
      { by: 'a', say: "I flew here. And I got us extra {staple}." },
      { by: 'c', say: "Wait, seriously? You got us food?", v: { warm: "Oh my gosh, thank you! I'm so hungry.", food: "Real food! I could hug you right now!" } },
      { by: 'b', say: "Okay. I might have been wrong about you.", v: { proud: "Huh. Good. That's good.", warm: "I owe you an apology. Thank you." } },
    ] },
    { id: 'ntl.tr2', turns: [
      { by: 'c', say: "How did you get here before us?" },
      { by: 'a', say: "Helicopter. And they gave me a choice when I landed. I picked the {staple}, for all of us." },
      { by: 'b', say: "That's actually really generous." },
      { by: 'a', conf: "{b} called me the weakest a few hours ago, and now {b} is thanking me. I'm going to enjoy that." },
    ] },
    { id: 'ntl.tr3', turns: [
      { beat: "{tribe} walks into camp to find {a} sitting on a bag of {staple}." },
      { by: 'c', say: "Is that what I think it is?" },
      { by: 'a', say: "Extra {staple}. There was a clue to the idol too, but I picked this, for everybody." },
      { by: 'b', say: "Thank you. Honestly, that was a really decent thing to do." },
      { by: 'a', say: "You're welcome. Maybe don't call me the weakest next time." },
      { by: 'b', say: "Yeah. That's fair." },
    ] },
  ],
  'tl.tell.riceonly': [
    { id: 'ntl.to1', turns: [
      { beat: "The rest of {tribe} walks into camp, tired from the hike. {a} is waiting beside a bag of {staple}." },
      { by: 'c', say: "Wait, where did that come from?" },
      { by: 'a', say: "It was here when I landed. It's for all of us." },
      { by: 'b', say: "Okay, that's great news. We really needed that." },
      { by: 'a', say: "Not bad for the weakest person on the tribe, right?" },
      { by: 'b', say: "Yeah, okay. I deserved that." },
    ] },
    { id: 'ntl.to2', turns: [
      { by: 'b', say: "How long have you been here?" },
      { by: 'a', say: "A couple of hours. Long enough to find this." },
      { beat: "{a} nods at the bag of {staple}." },
      { by: 'c', say: "Real food. You're officially my favourite person on this tribe.", v: { dry: "So being called the weakest comes with a meal. Noted." } },
      { by: 'a', conf: "Nobody's calling me the weakest tonight. They're too busy eating." },
    ] },
    { id: 'ntl.to3', turns: [
      { beat: "{tribe} walks into camp to find {a} already sitting next to a bag of {staple}." },
      { by: 'b', say: "Is that ours?" },
      { by: 'a', say: "It's ours. The helicopter came with a bonus." },
      { by: 'c', say: "I'm not going to complain about that." },
      { by: 'b', conf: "I called {a} the weakest a few hours ago, and {a} is the reason we're eating tonight. I need to stop saying things on day one." },
    ] },
  ],
  'tl.tell.truth': [
    { id: 'ntl.tt1', turns: [
      { beat: "The rest of {tribe} walks into camp. {a} gets up to meet them." },
      { by: 'b', say: "So? What did you get?" },
      { by: 'a', say: "There was a choice. A bag of {staple} for everybody, or a clue to the idol. I took the clue." },
      { by: 'c', say: "You took the clue over food for the whole tribe?", v: { loud: "Are you kidding me? We're STARVING!", dry: "Cool. So we're hungry and you're hunting for an idol. Great start.", warm: "I mean, I get it, but that's kind of hard to hear." } },
      { by: 'a', say: "I'm telling you the truth. I could have lied about it." },
      { by: 'b', say: "I'll give you that. Doesn't mean I like it." },
    ] },
    { id: 'ntl.tt2', turns: [
      { by: 'b', say: "What was waiting for you?" },
      { by: 'a', say: "A clue to the hidden immunity idol, or a bag of {staple}. You called me the weakest, so I took the clue." },
      { by: 'b', say: "That's fair, I guess." },
      { by: 'c', conf: "Now everybody knows {a} is looking for an idol. If {a} finds it, we have a problem." },
    ] },
    { id: 'ntl.tt3', turns: [
      { beat: "{tribe} walks into camp. There's no bag of {staple} anywhere." },
      { by: 'c', say: "So what was the prize?" },
      { by: 'a', say: "Either extra {staple} for the tribe or an idol clue. I took the clue, and I'm not going to pretend I didn't." },
      { by: 'b', say: "Wow. Okay." },
      { by: 'c', say: "At least you were honest about it." },
      { by: 'b', conf: "{a} told us straight out, and I respect that. I also know exactly who to watch now." },
    ] },
  ],
  'tl.tell.lie': [
    { id: 'ntl.tl1', turns: [
      { beat: "The rest of {tribe} walks into camp. {a} has the envelope folded small, deep in a pocket." },
      { by: 'b', say: "So what was there? Was there anything?" },
      { by: 'a', say: "Nothing, honestly. They just flew me here and dropped me off.", v: { schemer: "Nothing. I looked everywhere. It was just a ride." } },
      { by: 'c', say: "Lucky you. We walked for hours." },
      { by: 'a', conf: "I have a clue to the idol and nobody knows. Being the weakest is going great so far." },
    ] },
    { id: 'ntl.tl2', turns: [
      { by: 'c', say: "Did they give you anything?" },
      { by: 'a', say: "No. I think the ride was the whole reward." },
      { by: 'b', say: "Figures." },
      { by: 'a', conf: "I'm not proud of lying on day one. But if I'd told them I took the clue over food, I'd be the first one out." },
    ] },
    { id: 'ntl.tl3', turns: [
      { beat: "{tribe} walks into camp. {a} is already busy tidying up the camp, as if nothing happened." },
      { by: 'b', say: "Look at you, already working. What did they give you?" },
      { by: 'a', say: "Nothing. Just a fast ride and a long wait." },
      { by: 'c', say: "That's kind of rough, after being called the weakest." },
      { by: 'a', conf: "It's in my pocket right now. If they knew, they'd never let me out of their sight." },
    ] },
  ],

  'tl.after.any': [
    { id: 'ntl.a1', turns: [{ by: 'a', conf: "I called {target} the weakest, and {target} got a helicopter ride for it. I don't think I'm going to live that down.", v: { dry: "So the lesson is, never call anybody weak on this show. Noted.", warm: "I feel terrible. I called {target} the weakest, and {target} got the best part of the whole day. Good. {target} deserved it more than me.", anxious: "I named {target} the weakest, and now {target} is going to hate me and has a head start. This is a disaster." } }] },
    { id: 'ntl.a2', turns: [{ by: 'a', conf: "Being leader lasted one decision, and the decision was to insult {target}. Not exactly how I pictured it.", v: { schemer: "{target} thinks I hurt {target}'s feelings. Fine. People who think you've hurt them work harder to prove you wrong.", warm: "I need to go and talk to {target}. I didn't mean it the way it sounded." } }] },
    { id: 'ntl.a3', turns: [{ by: 'a', conf: "I picked {target} because I had to pick somebody, and now {target} has a head start on all of us. I'll be more careful the next time I'm in charge.", v: { cruel: "I'd still pick {target} again. A helicopter ride doesn't make {target} any stronger.", tough: "I said what I thought. If {target} wants to prove me wrong, good, because that helps the tribe." } }] },
    { id: 'ntl.a4', turns: [{ by: 'a', conf: "Nobody told me being called the weakest was a prize. If I'd known, I'd have picked myself.", v: { goofy: "Hold on. Can I call myself the weakest? Is it too late? I want a helicopter ride." } }] },
  ],
};
