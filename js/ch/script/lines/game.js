// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/game.js — alliances, deals, romance, the daily, the nights
// ══════════════════════════════════════════════════════════════════════
//
// The rest of the engine's scenes as scripts: alliances forming, growing,
// cracking and ending; deals made and broken; a spark, a showmance, a
// breakup; the moments inside a daily; partners and teams afterwards; the
// night before the Arena; fights; the night out.
//
// Same rules as every pool: the ending is the engine's, the words describe it,
// no invented past, a confessional says the feeling and the reason. Key turns
// carry voice variants (families and leading tags) as lists.

export default {
  // ── alliances ───────────────────────────────────────────────────────
  'alliance-form.any': [
    { id: 'af.1', turns: [
      { beat: '{a} waves {b} and {c} into the gym and shuts the door behind them.' },
      { by: 'a', say: "I'll be quick. I think we could run this place.", v: { loud: ['Okay, I\'m just going to say it! All of us, together! Let\'s run this house!'], soft: ['I really trust you guys. I think we should stick together.'], sharp: ['I\'ve looked at everybody. You\'re the only ones worth working with.'] } },
      { by: 'b', say: "I've been thinking the same thing.", v: { sharp: ['Okay. What\'s in it for me?'], soft: ['Really? Me? Yes. Yes, absolutely.'] } },
      { by: 'c', say: "So what do we call ourselves?", v: { odd: ['Do we get a secret handshake?'] } },
      { by: 'a', say: "{alliance}. And nobody outside this room hears that name." },
      { by: 'a', conf: "I've already got a group. In this game, the first alliance is usually the one that decides the first vote.", v: { sharp: ['We\'ve got the votes already. Everybody else is still figuring things out.'], soft: ['I feel so much better knowing I\'ve got people.'] } },
    ] },
    { id: 'af.2', turns: [
      { by: 'a', say: "Can I trust you guys? Like, really trust you?", v: { sharp: ['Before I say anything, I need to know you can keep your mouths shut.'] } },
      { by: 'b', say: "Yeah. Of course.", v: { odd: ['I have never told a secret in my life. Okay, once.'] } },
      { by: 'a', say: "Then let's make it official. Us, and we see who else we can bring in.", v: { loud: ['Then we\'re a team! Starting right now!'] } },
      { by: 'c', conf: "{a} moved fast. That's good, as long as {a} is on my side.", v: { soft: ['It\'s nice to have people to lean on in here.'] } },
    ] },
    { id: 'af.3', turns: [
      { beat: 'A quiet corner of the pool deck. {a}, {b} and {c} talk with their backs to the villa.' },
      { by: 'a', say: "We vote together, we protect each other, and we don't tell anybody.", v: { soft: ['I just want us to look after each other, okay?'] } },
      { by: 'b', say: "Deal.", v: { loud: ['DEAL!'] } },
      { by: 'b', conf: "So that's {alliance}. Let's see how long it lasts.", v: { soft: ['I really hope this lasts.'], sharp: ['This won\'t last forever. I just have to make sure I\'m still here when it ends.'] } },
    ] },
  ],
  'alliance-form.sameshow': [
    { id: 'af.s1', turns: [
      { by: 'a', say: "We came from the same show. Nobody else in here knows us like we know each other.", v: { loud: ['Same show, same team! Come on!'] } },
      { by: 'b', say: "We stick together, we go far.", v: { sharp: ['Everyone else will expect us to stick together. Let them.'] } },
      { by: 'a', conf: "Everybody else is a stranger. We already know each other's games. That's a head start nobody else has.", v: { soft: ['It feels like being back home with my people.'] } },
    ] },
    { id: 'af.s2', turns: [
      { by: 'b', say: "Let's be honest, the others are going to come for us because we know each other." },
      { by: 'a', say: "Then let's give them a reason to be scared.", v: { soft: ['Then we take care of each other first.'] } },
      { by: 'a', say: "{alliance}. Just us." },
    ] },
    { id: 'af.s3', turns: [
      { by: 'a', conf: "The people from my old show found each other in about five minutes. {alliance} was decided before anyone else even noticed.", v: { sharp: ['I trust them for now. When I need to cut somebody, they\'ll be the easiest.'] } },
    ] },
  ],
  'alliance-grow.any': [
    { id: 'ag.1', turns: [
      { by: 'a', say: "We've been talking, and we want you with us. Officially.", v: { loud: ['Welcome to the team! Officially!'], sharp: ['You\'ve been voting with us anyway. Might as well make it real.'] } },
      { by: 'b', say: "With {alliance}? Seriously?", v: { soft: ['Really? Oh my gosh. Thank you.'] } },
      { by: 'a', say: "Seriously. Just don't make us regret it." },
      { by: 'b', conf: "I went from being a swing vote to being in the biggest group in the house. That's a good week.", v: { sharp: ['Being in the big alliance is safe. It\'s also crowded. I\'ll keep both eyes open.'] } },
    ] },
    { id: 'ag.2', turns: [
      { by: 'a', say: "You've been with us all week. We want you in {alliance}." },
      { by: 'b', say: "So I'm in? Just like that?" },
      { by: 'a', say: "Just like that." },
      { by: 'a', conf: "{alliance} needs numbers, and {b} has been loyal to us all week. Bringing {b} in is easy.", v: { sharp: ['We need more votes, and {b} is one more.'] } },
    ] },
    { id: 'ag.3', turns: [
      { by: 'b', conf: "{a} pulled me aside and told me about {alliance}. I'm in. I'm also the newest one in, which makes me the easiest one to cut.", v: { soft: ['I\'m just happy to have a group.'] } },
    ] },
    { id: 'ag.4', turns: [
      { by: 'a', say: "Got a minute? There's something I want to ask you." },
      { by: 'b', say: "That sounds serious." },
      { by: 'a', say: "It is. A few of us have been working together. We'd like you in." },
      { by: 'b', say: "In {alliance}?" },
      { by: 'a', say: "In {alliance}. You vote with us, we look out for you." },
      { by: 'b', say: "Okay. Yeah. I'm in." },
      { by: 'b', conf: "Going it alone in here is a good way to end up in the Arena. Now I've got people." },
    ] },
    { id: 'ag.5', turns: [
      { by: 'a', say: "We've been watching how you play, and we like it." },
      { by: 'b', say: "Who's we?" },
      { by: 'a', say: "{alliance}. And we want you in it." },
      { by: 'b', say: "What's the catch?" },
      { by: 'a', say: "No catch. You're with us at the vote, and we're with you." },
      { by: 'b', say: "Then I'm with you." },
      { by: 'a', conf: "{b} asked what the catch was. Smart. The catch is that we'll need {b.obj} on a vote {b.sub} won't like." },
    ] },
    { id: 'ag.6', turns: [
      { by: 'b', say: "I keep seeing all of you talking in corners. What's going on?" },
      { by: 'a', say: "Honestly? We were going to ask you to join us." },
      { by: 'b', say: "Join what?" },
      { by: 'a', say: "{alliance}. If you want it." },
      { by: 'b', say: "I want it." },
      { by: 'b', conf: "I walked up to ask questions and walked away in an alliance. Not bad for one conversation." },
    ] },
  ],
  'alliance-betrayal.vote': [
    { id: 'ab.v1', turns: [
      { by: 'a', say: "You voted for me. My own alliance. You said my name out loud.", v: { loud: ['YOU VOTED FOR ME! You\'re supposed to be on my SIDE!'], soft: ['I can\'t believe you did that to me.'] } },
      { by: 'b', say: "It wasn't personal.", v: { sharp: ['It was the right move. Deal with it.'], soft: ['I\'m so sorry. I had no choice.'] } },
      { by: 'a', say: "It was personal to me.", v: { sharp: ['Then don\'t expect anything from me after this.'] } },
      { by: 'a', conf: "{b} broke the one rule we had. Whatever happens next, {b} brought it on {b.ref}.", v: { soft: ['I trusted {b} with everything. Everything.'] } },
    ] },
    { id: 'ab.v2', turns: [
      { beat: 'The alliance gathers after the vote. Nobody looks at {b}.' },
      { by: 'a', say: "Anybody want to explain what that was?", v: { loud: ['Somebody explain! Right now!'] } },
      { by: 'b', say: "I did what I had to do.", v: { soft: ['I\'m sorry. I panicked.'] } },
      { by: 'a', conf: "One vote. That's all it took to break us.", v: { sharp: ['One vote, and now I know who {b} really is.'] } },
    ] },
    { id: 'ab.v3', turns: [
      { by: 'a', conf: "{b} voted against our own. I don't know how we come back from that.", v: { loud: ['How do we come back from that?! We don\'t!'] } },
    ] },
    // written long from the start (the long cut, 2026-10-15)
    { id: 'ab.v4', turns: [
      { beat: 'After the vote, {a} waits for {b} outside. {b} sees {a} and stops.' },
      { by: 'a', say: "Were you going to tell me first, or was I supposed to find out with everybody else?" },
      { by: 'b', say: "I didn't decide until I was standing there." },
      { by: 'a', say: "That's worse. That means nobody even had to talk you into it." },
      { by: 'b', say: "I looked around that room and I could see where it was going. I didn't want to be the last one left." },
      { by: 'a', say: "You weren't going to be the last one. You were going to be with us." },
      { by: 'b', say: "Until you needed a name. Then it would have been me." },
      { by: 'a', say: "You can't know that." },
      { by: 'b', say: "Neither do you. That's the point." },
      { by: 'a', conf: "{b} thinks we were going to turn on {b.obj}. Now we'll never find out, because {b} did it first." },
    ] },
    { id: 'ab.v5', turns: [
      { by: 'b', say: "Before you start, I know what you're going to say." },
      { by: 'a', say: "Then say it for me." },
      { by: 'b', say: "That I'm a traitor. That I sold out the group." },
      { by: 'a', say: "Close. I was going to ask why you didn't come to me first." },
      { by: 'b', say: "Because you'd have talked me out of it." },
      { by: 'a', say: "Yeah. I would have." },
      { by: 'a', conf: "{b} knew it was wrong and did it anyway. That tells me everything about the rest of this game." },
    ] },
    { id: 'ab.v6', turns: [
      { beat: '{a} sits down next to {b} on the steps. Neither of them says anything for a while.' },
      { by: 'a', say: "So that's it, then. We're done." },
      { by: 'b', say: "We don't have to be." },
      { by: 'a', say: "You said a name we agreed not to say. In front of everybody." },
      { by: 'b', say: "And next week we might need each other again." },
      { by: 'a', say: "Next week I'll be voting with people who didn't do that to me." },
      { by: 'b', conf: "I knew it would cost me {a}. I didn't think {a} would walk away that fast." },
    ] },
    { id: 'ab.v7', turns: [
      { by: 'a', say: "Can I ask you one thing?" },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "When we made that alliance, did you mean it?" },
      { by: 'b', say: "I meant it then." },
      { by: 'a', say: "And tonight?" },
      { by: 'b', say: "Tonight I had to look after myself." },
      { by: 'a', say: "Then we were never really an alliance." },
      { by: 'a', conf: "I'm not going to scream at {b}. I'm just going to make sure the rest of the group knows what {b} is." },
    ] },
  ],
  'alliance-betrayal.callout': [
    { id: 'ab.c1', turns: [
      { by: 'a', say: "You called me out. Me. After everything.", v: { loud: ['You called ME out?! After EVERYTHING?!'], soft: ['Out of everybody, you picked me.'] } },
      { by: 'b', say: "I picked the fight I could win.", v: { soft: ['I\'m sorry. I had to survive.'], sharp: ['It\'s the Arena. I had to pick somebody I could beat.'] } },
      { by: 'a', conf: "{b} could have picked anybody in this house, and picked an ally.", v: { soft: ['I keep thinking about the look on {b}\'s face when my name came out.'] } },
    ] },
    { id: 'ab.c2', turns: [
      { by: 'a', say: "I thought we were in this together.", v: { sharp: ['So that\'s what our alliance was worth.'] } },
      { by: 'b', say: "We were. Until it was me or you.", v: { soft: ['It\'s not over. Let me explain.'] } },
    ] },
    { id: 'ab.c3', turns: [
      { by: 'a', conf: "Getting called out by an enemy is part of the game. Getting called out by your own alliance is the worst thing that can happen in here.", v: { loud: ['My own ally! My OWN ALLY!'] } },
    ] },
  ],
  'alliance-leave.any': [
    { id: 'al.1', turns: [
      { by: 'a', say: "I don't think this group is working for me anymore.", v: { sharp: ['I\'m done carrying this group.'], soft: ['I\'m sorry. I just don\'t feel safe in this group anymore.'] } },
      { by: 'b', say: "So that's it? You're just walking away?", v: { loud: ['You\'re just LEAVING?!'] } },
      { by: 'a', say: "I'm walking away before you all push me out.", v: { soft: ['I have to do what\'s right for me.'] } },
    ] },
    { id: 'al.2', turns: [
      { by: 'a', conf: "I'm not in that alliance anymore. Honestly, I'm not sure I ever really was.", v: { sharp: ['Free agent. Best thing that\'s happened to my game.'], soft: ['I feel lonely now, but at least I\'m not pretending anymore.'] } },
    ] },
    { id: 'al.3', turns: [
      { by: 'b', say: "We need to talk about where your head's at." },
      { by: 'a', say: "I'm not in it anymore. Let's leave it at that.", v: { loud: ['My head\'s OUT! I\'m out!'] } },
    ] },
  ],
  'alliance-leave.pushed-out': [
    { id: 'al.p1', turns: [
      { by: 'b', say: "We're not doing this with you anymore. After that vote, we can't.", v: { sharp: ['You made your choice. Now we make ours.'] } },
      { by: 'a', say: "Fine. I'll be fine on my own.", v: { soft: ['Okay. I understand. I\'m sorry.'], loud: ['FINE! I don\'t need you!'] } },
      { by: 'a', conf: "Kicked out of my own alliance. Now everybody in it knows I'm the easy target.", v: { sharp: ['They kicked me out. Now I know everything they do, and I owe them nothing.'] } },
    ] },
    { id: 'al.p2', turns: [
      { by: 'b', conf: "{a} turned on us. {a} doesn't get to stay in the group after that.", v: { soft: ['It was hard to tell {a}. It had to be done.'] } },
    ] },
    { id: 'al.p3', turns: [
      { by: 'a', say: "So I'm out? Just like that?" },
      { by: 'b', say: "You did it to yourself.", v: { soft: ['I\'m sorry. It wasn\'t only my call.'] } },
    ] },
  ],
  'alliance-leave.cut-loose': [
    { id: 'al.c1', turns: [
      { by: 'b', say: "I don't trust you anymore. I'm sorry, but you're out.", v: { sharp: ['I\'m cutting you loose. Nothing personal.'], loud: ['I can\'t trust you! You\'re out!'] } },
      { by: 'a', say: "What did I even do?", v: { soft: ['What? Why? What did I do?'] } },
      { by: 'b', conf: "Maybe {a} didn't do anything. I can't take the chance.", v: { soft: ['I hope I\'m wrong about {a}. I\'m not willing to find out.'] } },
    ] },
    { id: 'al.c2', turns: [
      { by: 'a', conf: "{b} cut me out of the alliance for no reason. {b} is getting paranoid.", v: { soft: ['I didn\'t do anything wrong. I really didn\'t.'] } },
    ] },
    { id: 'al.c3', turns: [
      { by: 'b', say: "It's not working with you. That's all I'm going to say." },
      { by: 'a', say: "That's all? Seriously?", v: { loud: ['THAT\'S ALL?!'] } },
    ] },
  ],
  'alliance-leave.exposed': [
    { id: 'al.e1', turns: [
      { by: 'b', say: "You said yes to us and voted the other way. We all heard it.", v: { loud: ['WE ALL HEARD IT! You lied to our faces!'] } },
      { by: 'a', say: "I can explain.", v: { sharp: ['So what if I did?'] } },
      { by: 'b', say: "You don't have to. We're done.", v: { soft: ['I don\'t want to hear it. I\'m too hurt.'] } },
    ] },
    { id: 'al.e2', turns: [
      { by: 'a', conf: "The vote is out loud. Of course they found out. I just hoped it would take longer.", v: { sharp: ['Worth it. Mostly worth it.'] } },
    ] },
    { id: 'al.e3', turns: [
      { by: 'b', conf: "{a} looked us in the eye and lied. Then said a different name in front of everybody. That's it for {a}.", v: { soft: ['I really thought {a} was one of us.'] } },
    ] },
  ],
  'alliance-end.betrayal': [
    { id: 'ae.b1', turns: [
      { by: 'a', say: "There's no point pretending anymore. This alliance is over.", v: { loud: ['IT\'S OVER! The whole thing is over!'], soft: ['I don\'t think we can fix this. I wish we could.'] } },
      { by: 'b', say: "Yeah. It is.", v: { sharp: ['It was over the second somebody broke it.'] } },
      { by: 'a', conf: "One betrayal, and everything we built is gone. Now it's every person for themselves.", v: { sharp: ['Every person for themselves. That suits me fine.'] } },
    ] },
    { id: 'ae.b2', turns: [
      { by: 'a', conf: "We had the numbers. We had the house. And we threw it away on one vote.", v: { soft: ['It hurts more than losing a daily. A lot more.'] } },
    ] },
    { id: 'ae.b3', turns: [
      { by: 'b', say: "So what now?" },
      { by: 'a', say: "Now everybody's on their own.", v: { odd: ['Now? Now we panic.'] } },
    ] },
  ],
  'alliance-end.numbers': [
    { id: 'ae.n1', turns: [
      { by: 'a', say: "There's only two of us left. We're not an alliance anymore, we're just friends.", v: { soft: ['It\'s just you and me now. I\'m glad it\'s you.'], sharp: ['Two people isn\'t enough. We\'re a target now.'] } },
      { by: 'b', say: "Then let's be friends who vote together.", v: { loud: ['Then we\'re a duo! A deadly duo!'] } },
    ] },
    { id: 'ae.n2', turns: [
      { by: 'a', conf: "Everybody else in our group got picked off one by one. Now there's nobody to protect.", v: { soft: ['I miss them. All of them.'] } },
    ] },
    { id: 'ae.n3', turns: [
      { by: 'a', conf: "We didn't fall apart. They just picked us off one at a time until there was nobody left.", v: { sharp: ['Our numbers are gone. Time to find new ones.'] } },
    ] },
    { id: 'ae.n4', turns: [
      { by: 'a', say: "Do you think we can still call it an alliance?" },
      { by: 'b', opt: 1, say: "With who? It's us." },
      { by: 'a', say: "That's what I mean. There's nobody left to count on." },
      { by: 'b', opt: 1, say: "We can count on each other. That's not nothing." },
      { by: 'a', conf: "An alliance is supposed to give you votes. Ours doesn't have enough people left to give anybody anything." },
    ] },
    { id: 'ae.n5', turns: [
      { by: 'a', conf: "Every week another one of us went into the Arena, and not one of them came back." },
      { by: 'a', conf: "I can't walk into a vote and tell people we have the numbers. Everybody can count." },
      { by: 'a', conf: "So that's it. I'm playing my own game now, whether I like it or not." },
    ] },
    { id: 'ae.n6', turns: [
      { by: 'b', opt: 1, say: "You're quiet." },
      { by: 'a', say: "I'm just thinking about who's left. It's a short list." },
      { by: 'b', opt: 1, say: "We're still here." },
      { by: 'a', say: "We are. But two people don't decide a vote in this house." },
      { by: 'a', conf: "We started this thing to protect each other. There's almost nobody left to protect." },
    ] },
  ],
  'alliance-end.final': [
    { id: 'ae.f1', turns: [
      { by: 'a', say: "So this is it. No more alliance. It's just a race now.", v: { loud: ['No more teams! Every person for themselves!'], soft: ['Whatever happens, I\'m so glad we did this together.'] } },
      { by: 'b', say: "Good luck. I mean it.", v: { sharp: ['Good luck. You\'ll need it.'] } },
      { by: 'a', conf: "We got each other to the final. Now I have to try to beat the people who got me here.", v: { sharp: ['Thank you for the ride. Now get out of my way.'] } },
    ] },
    { id: 'ae.f2', turns: [
      { by: 'a', conf: "The final means the alliance is done. It's weird. It feels like losing family.", v: { odd: ['It\'s like a band breaking up. A really sweaty band.'] } },
    ] },
    { id: 'ae.f3', turns: [
      { by: 'b', say: "See you at the finish line?" },
      { by: 'a', say: "See you behind me at the finish line.", v: { soft: ['See you there. Be safe out there.'] } },
    ] },
  ],
  'rookie-uprising.any': [
    { id: 'ru.1', turns: [
      { beat: '{a} gathers {b} and {c} in the bedroom, door closed.' },
      { by: 'a', say: "They've voted in a rookie two weeks running. We're next. Every single one of us.", v: { loud: ['Two rookies in a row! We are NEXT!'], sharp: ['The vets are picking us off. Time to make them pay for it.'] } },
      { by: 'b', say: "So what do we do?", v: { soft: ['What can we even do? There\'s so few of us.'] } },
      { by: 'a', say: "We stop letting them use us. We vote together.", v: { loud: ['We fight back! Together!'] } },
      { by: 'c', conf: "The vets thought the rookies would just line up and go home one at a time. Not anymore.", v: { soft: ['For the first time in here, I don\'t feel alone.'] } },
    ] },
    { id: 'ru.2', turns: [
      { by: 'a', conf: "The vets keep calling us threats. Good. They should be scared of us.", v: { odd: ['Rookie revolution! I made us a chant. We\'re not using it. Yet.'] } },
    ] },
    { id: 'ru.3', turns: [
      { by: 'b', say: "If we stick together, they can't get us all." },
      { by: 'a', say: "Then we stick together.", v: { loud: ['Then we STICK TOGETHER!'] } },
    ] },
  ],
  'meeting-spotted.any': [
    { id: 'ms.1', turns: [
      { by: 'a', conf: "I walked past the gym and saw {b} and {c} in there with the door shut. Nobody shuts a door in this house unless they're making a plan.", v: { loud: ['Doors shut in the middle of the day?! They\'re up to something!'], soft: ['I wish I hadn\'t seen it. Now I can\'t stop thinking about it.'] } },
    ] },
    { id: 'ms.2', turns: [
      { by: 'a', conf: "{b} and {c} went quiet the second I walked in. That's not a coincidence. That's an alliance.", v: { sharp: ['They stopped talking the second I walked in. They\'re working together.'] } },
    ] },
    { id: 'ms.3', turns: [
      { by: 'a', conf: "I counted who was missing from the kitchen. {b}, {c}, and a couple of others. Now I know who's working together.", v: { odd: ['I did a headcount. I\'m basically a detective now.'] } },
    ] },
  ],
  // ── deals ───────────────────────────────────────────────────────────
  'deal.any': [
    { id: 'dl.1', turns: [
      { by: 'a', say: "I won't put your name down if you don't put mine. And if either of us goes in, we don't call each other out.", v: { loud: ['Deal time! You don\'t vote me, I don\'t vote you!'], sharp: ['Simple trade. Safety for safety.'] } },
      { by: 'b', say: "Deal. Shake on it.", v: { soft: ['Okay. Deal. I\'d never vote for you anyway.'] } },
      { by: 'a', conf: "The deal with {b} keeps me safe, but only as long as it holds.", v: { soft: ['It\'s nice knowing there\'s one person in here who won\'t come for me.'] } },
    ] },
    { id: 'dl.2', turns: [
      { by: 'b', say: "Can I trust you not to come after me?" },
      { by: 'a', say: "If you can promise me the same thing.", v: { sharp: ['Depends. Can I trust you?'] } },
      { by: 'b', say: "Done.", v: { odd: ['Pinky promise. That\'s legally binding.'] } },
    ] },
    { id: 'dl.3', turns: [
      { by: 'a', conf: "{b} and I made a deal. Neither of us votes for the other, neither of us calls the other out. Let's see how long a promise lasts in here.", v: { soft: ['I really hope {b} means it. I do.'] } },
    ] },
    { id: 'dl.4', turns: [
      { beat: '{a} catches {b} alone by the washing machine.' },
      { by: 'a', say: "Quick question. If your name ever comes up, do you want my vote or not?", v: { sharp: ['You want to stay safe? I can help with that. For a price.'] } },
      { by: 'b', say: "What's the catch?", v: { soft: ['Of course I do. What do you need from me?'] } },
      { by: 'a', say: "Same thing back. And you never call me out.", v: { loud: ['Same deal for me! And NO calling me out!'] } },
      { by: 'b', say: "Deal.", v: { odd: ['Deal. Should we spit-shake? We shouldn\'t spit-shake.'] } },
    ] },
    { id: 'dl.5', turns: [
      { by: 'b', say: "I don't want to end up across from you in that Arena.", v: { sharp: ['I\'d rather not have to beat you.'] } },
      { by: 'a', say: "Then let's make sure we never do.", v: { soft: ['Me neither. Let\'s look out for each other.'] } },
      { by: 'b', conf: "{a} and I have a deal now. It's not an alliance. It's insurance.", v: { loud: ['A deal! I love a deal!'] } },
    ] },
    { id: 'dl.6', turns: [
      { by: 'a', say: "Let's keep each other off the ballot. Just us. Nobody else needs to know.", v: { sharp: ['A quiet deal. Just between us.'] } },
      { by: 'b', say: "Fine by me.", v: { soft: ['I\'d like that a lot.'] } },
      { by: 'a', conf: "A deal nobody knows about is the best kind. Nobody can use it against you.", v: { soft: ['It\'s nice to have one person I don\'t have to worry about.'] } },
    ] },
    { id: 'dl.7', turns: [
      { by: 'b', conf: "{a} asked me for a deal, and I said yes. I'll keep it as long as it keeps me safe.", v: { soft: ['{a} asked me for a deal, and I said yes. I\'ll keep it. I keep my promises.'], sharp: ['I\'ll keep the deal as long as it works for me.'] } },
    ] },
  ],
  'deal-broken.vote': [
    { id: 'db.v1', turns: [
      { by: 'b', say: "We had a deal. You said my name anyway.", v: { loud: ['WE HAD A DEAL!'], soft: ['I trusted you. We shook on it.'] } },
      { by: 'a', say: "Things changed.", v: { soft: ['I know. I\'m sorry. I didn\'t have a choice.'], sharp: ['The deal stopped working for me.'] } },
      { by: 'b', conf: "A deal only means something if you keep it. {a} didn't. Now I know what {a}'s word is worth.", v: { sharp: ['Noted. {a} is on my list now. Right at the top.'] } },
    ] },
    { id: 'db.v2', turns: [
      { by: 'b', conf: "We shook on it. {a} looked me in the eye. Then said my name out loud in front of the whole house.", v: { loud: ['In front of the WHOLE HOUSE!'] } },
    ] },
    { id: 'db.v3', turns: [
      { by: 'b', say: "So our deal meant nothing?" },
      { by: 'a', say: "It meant something. Just not enough.", v: { sharp: ['It kept me safe while I needed it to.'] } },
    ] },
    { id: 'db.v4', turns: [
      { beat: '{b} waits until the others have gone inside, then walks straight over to {a}.' },
      { by: 'b', say: "Was any of it real? The deal? Any of it?" },
      { by: 'a', say: "It was real when we made it." },
      { by: 'b', say: "And tonight?" },
      { by: 'a', say: "Tonight the numbers were against you. I wasn't going to go down with you." },
      { by: 'b', say: "You didn't even warn me." },
      { by: 'a', say: "If I'd warned you, you'd have told everybody, and then it'd be my name." },
      { by: 'b', say: "So you protected yourself. Got it." },
      { by: 'b', conf: "I'd have understood if {a} came to me first. Saying my name without a word to me first is the part I can't let go." },
    ] },
    { id: 'db.v5', turns: [
      { by: 'a', say: "Before you say anything, I know." },
      { by: 'b', say: "You know? Great. That fixes everything." },
      { by: 'a', say: "Everybody else was voting the same way. Mine didn't change anything." },
      { by: 'b', say: "It changed something for me." },
      { by: 'a', say: "What do you want me to say?" },
      { by: 'b', say: "Nothing. I don't want anything from you any more." },
      { by: 'a', conf: "I knew {b} would be angry. I didn't think {b} would stop talking to me completely. That's going to cost me." },
    ] },
    { id: 'db.v6', turns: [
      { by: 'b', say: "Hey. Funny thing happened at the vote." },
      { by: 'a', say: "Don't." },
      { by: 'b', say: "No, it's funny. The one person who swore they'd never say my name..." },
      { by: 'a', say: "I said don't." },
      { by: 'b', say: "...stood up and said my name." },
      { by: 'a', say: "You'd have done the same thing." },
      { by: 'b', say: "No. I wouldn't. That's the difference between us." },
      { by: 'b', conf: "I'm still here, and {a} has to sleep in the same villa as me now. Good luck with that." },
    ] },
  ],
  'deal-broken.callout': [
    { id: 'db.c1', turns: [
      { by: 'b', say: "You promised you'd never call me out. You promised!", v: { loud: ['You PROMISED!'], soft: ['You promised me.'] } },
      { by: 'a', say: "I'm sorry. It's me or you now.", v: { sharp: ['I\'m sorry, but I had to pick somebody I can beat.'] } },
      { by: 'b', conf: "{a} broke our deal to save {a.ref}. I'm going to make {a} regret that in there.", v: { soft: ['That hurt more than being voted in.'] } },
    ] },
    { id: 'db.c2', turns: [
      { by: 'b', conf: "Of everybody {a} could have called out, it was the one person with a deal.", v: { sharp: ['Remember that, everybody. That\'s what {a}\'s deals are worth.'] } },
    ] },
    { id: 'db.c3', turns: [
      { by: 'b', say: "We had a deal, {a}." },
      { by: 'a', say: "I know. I'm sorry. I had to.", v: { soft: ['I know. I\'m so sorry.'] } },
    ] },
  ],

  // ── romance milestones ─────────────────────────────────────────────
  'spark.any': [
    { id: 'sp.1', turns: [
      { beat: '{a} and {b} keep ending up next to each other. Neither seems to mind.' },
      { by: 'a', conf: "I'm not here for romance. But {b}... I don't know. There's something there.", v: { sharp: ['{b} is a distraction. A very good-looking distraction.'], loud: ['Okay, I\'m into {b}! I said it!'], soft: ['Every time {b} smiles at me, I forget where I am.'] } },
    ] },
    { id: 'sp.2', turns: [
      { by: 'a', say: "You're kind of distracting, you know that?", keep: ['distract'], v: { odd: ['Can you stop being so distracting? I\'m trying to strategise.'] } },
      { by: 'b', say: "I'll take that as a compliment.", v: { soft: ['That\'s... really sweet.'] } },
      { by: 'b', conf: "{a} said I was distracting. I'm going to be thinking about that for a while.", v: { sharp: ['{a} is interested. I can use that. I might also like it.'] } },
    ] },
    // written long from the start (the long cut, 2026-10-16)
    { id: 'sp.4', turns: [
      { by: 'a', say: "Can I ask you something weird?" },
      { by: 'b', say: "Everything you ask is weird." },
      { by: 'a', say: "Fair. Do you ever forget there are cameras?" },
      { by: 'b', say: "Right now? A little." },
      { by: 'a', say: "Yeah. Me too." },
      { beat: 'Neither of them says anything for a moment. Neither of them looks away.' },
      { by: 'b', conf: "I came here to win, not to catch feelings. Somebody tell that to whatever just happened with {a}." },
    ] },
    { id: 'sp.5', turns: [
      { by: 'a', say: "You've got something on your face." },
      { by: 'b', say: "Where?" },
      { by: 'a', say: "Here. Hold still." },
      { by: 'b', say: "Is it gone?" },
      { by: 'a', say: "There was nothing there. I just wanted an excuse." },
      { by: 'b', say: "Smooth. Really smooth." },
      { by: 'a', conf: "Was that a bit much? Maybe. Did {b} smile? Yes. I'll take it." },
    ] },
    { id: 'sp.6', turns: [
      { by: 'b', say: "Why do you always sit next to me?" },
      { by: 'a', say: "Do I?" },
      { by: 'b', say: "Every meal. Every night. Every time." },
      { by: 'a', say: "Maybe I like the view." },
      { by: 'b', say: "The view is a wall." },
      { by: 'a', say: "Not that view." },
      { by: 'b', conf: "I'm trying very hard not to like {a}. It isn't working." },
    ] },
    { id: 'sp.7', turns: [
      { beat: '{a} and {b} are the last two still awake, talking about everything except the game.' },
      { by: 'a', say: "What's the first thing you'll do when you get home?" },
      { by: 'b', say: "Sleep for a week. You?" },
      { by: 'a', say: "Honestly? Probably text you." },
      { by: 'b', say: "That's either really sweet or really cheesy." },
      { by: 'a', say: "Can it be both?" },
      { by: 'a', conf: "I don't know if {b} feels it too. But I'm not imagining it. Am I?" },
    ] },
    { id: 'sp.8', turns: [
      { by: 'a', say: "You were really good today." },
      { by: 'b', say: "You were watching me?" },
      { by: 'a', say: "Everybody was watching you." },
      { by: 'b', say: "But you were watching me." },
      { by: 'a', say: "Okay, yes. I was watching you." },
      { by: 'b', conf: "Showmances are dangerous in this game. They make you a pair, and a pair is a target. I know that. I'm still smiling." },
    ] },
    { id: 'sp.9', turns: [
      { by: 'b', say: "Stop looking at me like that." },
      { by: 'a', say: "Like what?" },
      { by: 'b', say: "Like that. Everybody can see." },
      { by: 'a', say: "Let them see." },
      { by: 'b', say: "You're going to get us both in trouble." },
      { by: 'a', say: "Worth it." },
      { by: 'a', conf: "Everybody says don't get attached in here. Too late." },
    ] },
    { id: 'sp.3', turns: [
      { by: 'b', conf: "Something happened with {a} today. Nothing big. I just noticed I was looking for {a} every time I walked into a room.", v: { loud: ['I think I have a crush! In THIS house!'] } },
    ] },
  ],
  'showmance.any': [
    { id: 'sh.1', turns: [
      { beat: '{a} and {b} kiss on the pool deck. Three people whistle. One person groans.' },
      { by: 'a', say: "So... is this a thing now?", v: { loud: ['We\'re a thing! Everybody, we\'re a thing!'], sharp: ['Let\'s keep this quiet. People will use it.'] } },
      { by: 'b', say: "I think it's a thing.", v: { soft: ['I hope it\'s a thing.'] } },
      { by: 'a', conf: "I came here to win money. I did not plan on this. But here we are.", v: { soft: ['I\'m so happy. I didn\'t think I\'d find this here.'] } },
    ] },
    { id: 'sh.2', turns: [
      { by: 'b', conf: "{a} and I are official. Everybody is going to see us as a pair, and a pair is a target. I don't care.", v: { sharp: ['A couple is two votes. That\'s power, and I know it.'] } },
    ] },
    { id: 'sh.3', turns: [
      { by: 'a', say: "I like you. Like, really like you.", v: { sharp: ['I don\'t usually do this. But I really like you.'] } },
      { by: 'b', say: "Good. Because I really like you too.", v: { odd: ['Oh thank God, I was about to say it first and it was going to be so awkward.'] } },
    ] },
  ],
  'breakup.any': [
    { id: 'bu.1', turns: [
      { by: 'a', say: "I can't do this anymore. Not in here.", v: { sharp: ['This isn\'t working. It\'s over.'], soft: ['I\'m so sorry. I can\'t be in a relationship and play this game.'] } },
      { by: 'b', say: "What? Where is this coming from?", v: { loud: ['WHAT? Are you serious right now?'] } },
      { by: 'a', say: "It's just not working.", v: { soft: ['I care about you. I just can\'t.'] } },
      { by: 'b', conf: "{a} ended it, just like that. I'm not going to cry in front of everybody. I'll do that later, on my own.", v: { sharp: ['Fine. {a} just made a very big mistake, and a very big enemy.'], loud: ['I\'m so angry I can\'t even see straight!'] } },
    ] },
    { id: 'bu.2', turns: [
      { by: 'b', conf: "Getting dumped in a house you can't leave is a special kind of torture. I still have to see {a} at breakfast.", v: { odd: ['Breakfast is going to be so awkward. Breakfast is already awkward.'] } },
    ] },
    { id: 'bu.3', turns: [
      { by: 'a', say: "I think we're better as friends." },
      { by: 'b', say: "Wow. Okay. Got it.", v: { soft: ['Okay. If that\'s what you want.'] } },
    ] },
  ],
  'apology.accepted': [
    { id: 'ap.a1', turns: [
      { by: 'a', say: "I owe you an apology. About the vote. I felt sick about it.", v: { sharp: ['I\'ll say this once. I\'m sorry about the vote.'], loud: ['I\'m SORRY! Okay? I\'m really sorry!'] } },
      { by: 'b', say: "I appreciate that. I really do.", v: { sharp: ['Fine. Thank you. Don\'t make me regret it.'] } },
      { by: 'b', conf: "{a} came to me on {a.posAdj} own and said sorry. In this house, that counts for a lot.", v: { soft: ['I didn\'t expect it. It made my whole day.'] } },
    ] },
    { id: 'ap.a2', turns: [
      { by: 'a', say: "Are we okay? I need us to be okay.", v: { soft: ['Please tell me we\'re okay.'] } },
      { by: 'b', say: "We're okay.", v: { odd: ['We\'re okay. Hug it out? Hug it out.'] } },
    ] },
    { id: 'ap.a3', turns: [
      { by: 'b', conf: "{a} apologised. I believed it. Maybe I'm soft. Or maybe {a} meant it.", v: { sharp: ['I\'ll accept it, but I\'m still watching {a}.'] } },
    ] },
  ],
  'apology.rejected': [
    { id: 'ap.r1', turns: [
      { by: 'a', say: "Look, I'm sorry about the vote.", v: { soft: ['I\'m so sorry. Can we please talk?'] } },
      { by: 'b', say: "Sorry doesn't take it back.", v: { loud: ['SORRY?! You think SORRY fixes it?!'], sharp: ['Save it.'] } },
      { by: 'a', conf: "I tried. {b} doesn't want to hear it. Fine.", v: { soft: ['I really meant it. I wish {b} believed me.'] } },
    ] },
    { id: 'ap.r2', turns: [
      { by: 'b', conf: "{a} only said sorry out of fear of what I'll do. I'm not falling for it.", v: { soft: ['I want to forgive {a}. I\'m just not ready.'] } },
    ] },
    { id: 'ap.r3', turns: [
      { by: 'a', say: "Can we just move on?" },
      { by: 'b', say: "No.", v: { soft: ['Not yet. Maybe not ever.'] } },
    ] },
  ],
  // what each person wants from this season, said to a friend or to the camera
  'psyche.prove': [
    { id: 'py.p1', turns: [
      { by: 'a', conf: "People back home think I'm just here for the camera. I want to win something real, so nobody can say that again.", v: { loud: ['I\'m going to prove EVERYBODY wrong!'], soft: ['I want my family to be proud of me. That\'s all.'], sharp: ['Everybody doubting me just makes me want it more.'] } },
    ] },
    { id: 'py.p2', turns: [
      { by: 'a', say: "Do you think I can actually win this?" },
      { by: 'b', say: "I think you can do anything you decide to do.", v: { sharp: ['If you stop doubting yourself, yeah.'] } },
      { by: 'a', conf: "I don't need everybody to believe in me. I just need to stop doubting myself.", v: { odd: ['Some days I think I can win this whole thing. Today is not one of those days, and I hate it.'] } },
    ] },
    { id: 'py.p3', turns: [
      { by: 'a', conf: "I didn't come here to be a number. I came here to be somebody people are scared to call out.", v: { soft: ['I just want to show I belong here.'] } },
    ] },
  ],
  'psyche.belong': [
    // in a group, and still feeling outside it
    { id: 'py.b4', when: { allied: true }, turns: [
      { by: 'a', conf: "I'm in an alliance, but I still feel like the one they'd cut first.", v: { soft: ['I have people. I just don\'t always feel like I\'m really one of them.'], sharp: ['An alliance isn\'t a family. I keep forgetting that.'] } },
    ] },
    { id: 'py.b5', when: { allied: true }, turns: [
      { by: 'a', conf: "My group is great, but I always feel one bad week away from being on the outside.", v: { loud: ['I love my people! I\'m also terrified of them!'] } },
    ] },
    { id: 'py.b1', when: { allied: false }, turns: [
      { by: 'a', conf: "I just want to feel like I fit in somewhere in this house. Some days I do. Some days I really don't.", v: { soft: ['I miss feeling like part of something.'], sharp: ['Everybody has their group. I\'m still looking for mine.'] } },
    ] },
    { id: 'py.b2', turns: [
      { by: 'a', say: "Can I sit with you guys?", v: { loud: ['Scoot over! I\'m sitting here!'] } },
      { by: 'b', say: "Of course. Get in here.", v: { sharp: ['Sure. Grab a plate.'] } },
      { by: 'a', conf: "Such a small thing. It made my whole day.", v: { soft: ['I almost cried. Over a seat.'] } },
    ] },
    { id: 'py.b3', when: { allied: false }, turns: [
      { by: 'a', conf: "I keep laughing at everybody's jokes so they'll want me around. I hate that I do that.", v: { odd: ['I\'ve laughed at so many bad jokes this week. So many.'] } },
    ] },
  ],
  'psyche.control': [
    { id: 'py.c1', turns: [
      { by: 'a', conf: "I can't stand not knowing what's going on in this house. If there's a plan, I want to be the one who made it.", v: { sharp: ['I don\'t want to just get by. I want to be the one making the calls.'], soft: ['I just feel safer when I know what\'s happening.'] } },
    ] },
    { id: 'py.c2', turns: [
      { by: 'b', say: "You don't have to run everything, you know." },
      { by: 'a', say: "Somebody has to.", v: { soft: ['I know. I just can\'t help it.'] } },
    ] },
    { id: 'py.c3', turns: [
      { by: 'a', conf: "Every vote this season, I want to know the name before TJ does.", v: { odd: ['I have a chart. In my head. It\'s a very good chart.'] } },
    ] },
  ],
  'psyche.protect': [
    { id: 'py.r1', turns: [
      { by: 'a', conf: "I'll do almost anything to keep my people safe in here. Almost anything.", v: { loud: ['Nobody touches my people! Nobody!'], soft: ['If anything happened to my friends because of me, I couldn\'t live with it.'] } },
    ] },
    { id: 'py.r2', turns: [
      { by: 'a', say: "You okay? If anybody's giving you trouble, you tell me." },
      { by: 'b', say: "I'm okay. Thanks for looking out for me.", v: { sharp: ['I can handle myself. But thanks.'] } },
    ] },
    { id: 'py.r3', turns: [
      { by: 'a', conf: "My game is simple. Keep the people I care about here as long as possible.", v: { sharp: ['Protecting my friends is my strategy. It\'s also my weakness.'] } },
    ] },
  ],
  'psyche.temper': [
    { id: 'py.t1', turns: [
      { by: 'a', conf: "I know I have a temper. I'm trying. This house makes it really, really hard.", v: { loud: ['I\'m trying not to explode! I\'m TRYING!'], soft: ['I don\'t want to be the angry one. I just feel everything so much.'] } },
    ] },
    { id: 'py.t2', turns: [
      { by: 'b', say: "Breathe. Just breathe." },
      { by: 'a', say: "I'm breathing. I'm breathing really angrily.", v: { soft: ['Okay. Okay. I\'m okay.'] } },
    ] },
    { id: 'py.t3', turns: [
      { by: 'a', conf: "If I lose my cool at the wrong time, I'm going home. I know that. I keep telling myself that.", v: { odd: ['I count to ten now. Sometimes I get to eleven.'] } },
    ] },
  ],
  'psyche.redemption': [
    { id: 'py.d1', turns: [
      { by: 'a', conf: "Last time I went out early and I've thought about it every single day since. This time is different. It has to be.", v: { loud: ['Not this time! This time I\'m going all the way!'], soft: ['I just don\'t want to feel like that again.'] } },
    ] },
    { id: 'py.d2', turns: [
      { by: 'a', say: "Last time didn't go how I wanted." },
      { by: 'b', say: "So make this time count.", v: { sharp: ['Then stop talking about last time.'] } },
    ] },
    { id: 'py.d3', turns: [
      { by: 'a', conf: "Everybody remembers how I went out last time. I'm here to give them something else to remember.", v: { sharp: ['I want to make up for last time.'] } },
    ] },
  ],
  'psyche.home': [
    { id: 'py.h1', turns: [
      { by: 'a', conf: "I think about home every day. I'm doing this for my family. I just wish they were closer.", v: { soft: ['I sleep with my mom\'s shirt under my pillow. Don\'t tell anyone.'], sharp: ['I\'m doing this for my family, but missing them makes me want to leave.'] } },
    ] },
    { id: 'py.h2', turns: [
      { by: 'a', say: "What do you miss most?" },
      { by: 'b', say: "My bed. My dog. Real coffee.", v: { odd: ['My bed. My dog. Not in that order. Okay, in that order.'] } },
      { by: 'a', conf: "Everybody misses something in here. I just miss everything.", v: { soft: ['I didn\'t think it would be this hard.'] } },
    ] },
    { id: 'py.h3', turns: [
      { by: 'a', conf: "Some days the only thing keeping me here is knowing how proud they'll be.", v: { loud: ['I\'m doing this for you, family! Hi!'] } },
    ] },
  ],

  // ── the daily, from the inside ──────────────────────────────────────
  'daily-clutch.any': [
    { id: 'dc.1', turns: [
      { by: 'a', conf: "I was dying out there, but something just kicked in. I don't even know where it came from.", v: { loud: ['That was the best I\'ve EVER done in my LIFE!'], sharp: ['People keep underestimating me. Keep doing it.'], soft: ['I surprised myself today. I really did.'] } },
    ] },
    { id: 'dc.2', turns: [
      { by: 'a', conf: "I don't think anybody expected me to do that. I definitely didn't.", v: { odd: ['Who was that? Was that me? That was me!'] } },
    ] },
    { id: 'dc.3', turns: [
      { by: 'a', conf: "When it mattered, I showed up. That's going to make some people nervous.", v: { soft: ['I just kept going. I didn\'t want to let anyone down.'] } },
    ] },
  ],
  'daily-choke.any': [
    { id: 'dk.1', turns: [
      { by: 'a', conf: "I froze. I have no idea what happened. My brain just stopped.", v: { loud: ['I choked! I completely CHOKED!'], soft: ['I\'m so embarrassed. I wanted the ground to swallow me.'], sharp: ['One bad day. That\'s all it was. One bad day.'] } },
    ] },
    { id: 'dk.2', turns: [
      { by: 'a', conf: "I fell apart today. I can already feel them deciding I'm weak.", v: { odd: ['I fell apart. All the way apart. Pieces everywhere.'] } },
    ] },
    { id: 'dk.3', turns: [
      { by: 'a', conf: "I'm better than that. I know I'm better than that. That's what makes it so bad.", v: { soft: ['I just want to go hide in my bunk.'] } },
    ] },
  ],
  'throw.any': [
    { id: 'th.1', turns: [
      { by: 'a', conf: "It's not my week. Winning today gets me nothing except a target. So I didn't win today.", v: { sharp: ['Losing on purpose is a skill. I\'m very skilled.'], odd: ['I tripped. On purpose. Very convincingly.'] } },
    ] },
    { id: 'th.2', turns: [
      { by: 'a', conf: "Nobody can know I took my foot off the gas. If they find out, I'm done.", v: { soft: ['I feel a little bad. A little.'] } },
    ] },
    { id: 'th.3', turns: [
      { by: 'a', conf: "Let somebody else look strong this week. Strong people go home in this game.", v: { sharp: ['Let them think I\'m weak. The house doesn\'t vote in people it isn\'t scared of.'] } },
    ] },
  ],
  'throw-caught.any': [
    { id: 'tc.1', turns: [
      { by: 'a', say: "You weren't even trying out there. I saw you.", v: { loud: ['YOU THREW IT! I SAW YOU!'], sharp: ['Interesting performance today. Very interesting.'] } },
      { by: 'b', say: "What? I was exhausted!", v: { sharp: ['Prove it.'] } },
      { by: 'a', conf: "{b} threw that daily. I'd bet my life on it. Now everybody's going to hear about it.", v: { soft: ['I didn\'t want to say anything. But it wasn\'t fair to the rest of us.'] } },
    ] },
    { id: 'tc.2', turns: [
      { by: 'a', conf: "{b} slowed down at the end on purpose. I watched it happen. Nobody throws a daily in front of me.", v: { odd: ['I saw {b} stop and smell the flowers. During a challenge.'] } },
    ] },
    { id: 'tc.3', turns: [
      { by: 'a', say: "Why'd you stop running?" },
      { by: 'b', say: "I didn't stop.", v: { soft: ['I got a cramp. I swear.'] } },
      { by: 'a', say: "Sure you didn't.", v: { loud: ['You did not. I watched you.'] } },
    ] },
  ],
  'call-home.any': [
    { id: 'ch.1', turns: [
      { beat: '{a} holds the phone with both hands.' },
      { by: 'a', say: "Mom? Mom, it's me! I'm okay, I promise I'm okay.", v: { loud: ['MOM! IT\'S ME! I\'M WINNING!'], sharp: ['Hey. Yeah, it\'s me. Don\'t cry, okay? I\'m fine.'] } },
      { by: 'a', conf: "Ten minutes on the phone and I feel like a different person. That's what I needed.", v: { soft: ['I cried the whole time. Happy crying.'] } },
    ] },
    { id: 'ch.2', turns: [
      { by: 'a', conf: "Winning that daily got me a call home. Hearing my family's voices was worth more than any money.", v: { odd: ['My dog barked at me through the phone. Best moment of the season.'] } },
    ] },
    { id: 'ch.3', turns: [
      { by: 'a', say: "Tell everyone I love them. Tell them I'm coming home with the money.", v: { soft: ['Tell everyone I miss them so much.'] } },
    ] },
  ],
  'picked-last.any': [
    { id: 'pk.1', turns: [
      { by: 'a', conf: "Picked last. In front of everybody. That tells you exactly where I stand in this house.", v: { loud: ['LAST! I got picked LAST!'], soft: ['It\'s stupid that it hurts. It really hurts.'], sharp: ['Remember who skipped you. I remember all of them.'] } },
    ] },
    { id: 'pk.2', turns: [
      { by: 'b', say: "Looks like it's you and me." },
      { by: 'a', say: "Lucky me.", v: { soft: ['Yeah. Okay. Let\'s do our best.'] } },
      { by: 'a', conf: "Nobody chose me. {b} got stuck with me. Great way to start a daily.", v: { odd: ['I\'m the leftover. Great.'] } },
    ] },
    { id: 'pk.3', turns: [
      { by: 'a', conf: "Every single person got picked before me. I'm going to use that in the daily.", v: { sharp: ['Fine. Underestimate me.'] } },
    ] },
  ],
  'partner-blame.any': [
    { id: 'pb.1', turns: [
      { by: 'a', say: "We lost because you couldn't keep up.", v: { loud: ['You cost us that whole daily!'], sharp: ['I carried us, and you still dropped it.'] } },
      { by: 'b', say: "I was doing my best!", keep: ['best'], v: { sharp: ['That was my best! Maybe if you weren\'t screaming at me the whole time.'] } },
      { by: 'a', say: "Your best lost us the daily.", v: { soft: ['I know. I\'m sorry. I\'m just frustrated.'] } },
      { by: 'b', conf: "{a} blamed me in front of everybody. Now the whole house thinks I'm the weak one.", v: { soft: ['I really tried. I really did.'] } },
    ] },
    { id: 'pb.2', turns: [
      { by: 'a', conf: "I don't want to throw {b} under the bus. But {b} was the reason we lost.", v: { sharp: ['Partners are supposed to help. {b} was dead weight.'] } },
    ] },
    { id: 'pb.3', turns: [
      { by: 'b', say: "Go ahead, say it." },
      { by: 'a', say: "You were slow. That's all.", v: { loud: ['You were SLOW!'] } },
    ] },
    { id: 'pb.4', turns: [
      { by: 'a', say: "Can we talk about what happened out there?" },
      { by: 'b', say: "If you're going to tell me it was my fault, no." },
      { by: 'a', say: "I'm not saying it was all you. I'm saying we didn't work together." },
      { by: 'b', say: "You didn't listen to a word I said." },
      { by: 'a', say: "Because you kept changing the plan halfway through." },
      { by: 'b', say: "Because the plan wasn't working." },
      { by: 'a', conf: "I don't know if {b} and I are going to make it through another partner week. We pull in different directions." },
      { by: 'b', conf: "{a} wants a partner who does what {a.sub}'s told. That's not me." },
    ] },
    { id: 'pb.5', turns: [
      { by: 'b', say: "You've been quiet since we finished." },
      { by: 'a', say: "I'm trying not to say something I'll regret." },
      { by: 'b', say: "Then just say it. Get it over with." },
      { by: 'a', say: "We should have won that. We had it, and then we didn't." },
      { by: 'b', say: "And that's on me." },
      { by: 'a', say: "I didn't say that." },
      { by: 'b', say: "You didn't have to." },
      { by: 'b', conf: "Losing is bad enough. Losing and then watching your partner sulk about it is worse." },
    ] },
    { id: 'pb.6', turns: [
      { by: 'a', conf: "I picked the wrong partner, or the wrong partner got picked for me. Either way, I'm the one who has to live with it at the vote." },
      { by: 'a', conf: "We fell apart out there. Now people are going to look at both of us like we're easy to send in." },
      { by: 'b', opt: 1, conf: "{a} can blame me all {a.sub} wants. I know what I did out there, and I know what {a} didn't." },
    ] },
  ],
  'partner-carried.any': [
    { id: 'pc.1', turns: [
      { by: 'b', say: "Thank you. Seriously. You did most of that.", v: { soft: ['I would have been lost without you today.'], sharp: ['Fine. You carried me. I\'ll remember it.'] } },
      { by: 'a', say: "We're a team. That's what partners do.", v: { sharp: ['You owe me one.'], odd: ['I\'ll accept payment in snacks.'] } },
      { by: 'b', conf: "{a} carried me today. I owe {a} for that, and I'm going to pay it back.", v: { sharp: ['I owe {a} a favour now. I hate owing people.'] } },
    ] },
    { id: 'pc.2', turns: [
      { by: 'a', conf: "{b} was struggling, so I took over. Now {b} owes me. That's how this game works.", v: { soft: ['I just wanted us both to do well.'] } },
    ] },
    { id: 'pc.3', turns: [
      { by: 'b', conf: "I couldn't have done it without {a}. I'm not going to forget that when it comes to the vote.", v: { soft: ['{a} was so patient with me.'] } },
    ] },
  ],
  'team-blame.defended': [
    { id: 'tb.d1', turns: [
      { by: 'a', say: "Let's be real. We lost because of {b}.", v: { loud: ['We LOST because of {b}!'], sharp: ['I\'ll say what everybody\'s thinking. {b} sank us.'] } },
      { by: 'c', say: "Back off. {b} gave everything out there.", v: { loud: ['BACK OFF! {b} was trying!'], soft: ['That\'s not fair. We all made mistakes.'] } },
      { by: 'b', conf: "{a} came for me in front of the team. {c} stood up for me. I know who my friends are now.", v: { soft: ['I almost cried when {c} defended me.'] } },
    ] },
    { id: 'tb.d2', turns: [
      { by: 'a', say: "Somebody has to take responsibility for that." },
      { by: 'c', say: "Then take it yourself. You were slow too.", v: { sharp: ['Then start with yourself.'] } },
    ] },
    { id: 'tb.d3', turns: [
      { by: 'c', conf: "I wasn't going to let {a} pin the loss on {b}. Not while I'm standing right there.", v: { soft: ['{b} is my friend. Of course I said something.'] } },
    ] },
  ],
  'team-blame.alone': [
    { id: 'tb.a1', turns: [
      { by: 'a', say: "We lost because of {b}. I'm sorry, but somebody has to say it.", v: { loud: ['{b} lost us that challenge! Say I\'m wrong!'] } },
      { beat: 'Nobody says a word. {b} walks off.' },
      { by: 'b', conf: "Nobody stood up for me. Not one person. That hurt more than losing.", v: { sharp: ['Fine. I\'ll remember who stayed quiet.'] } },
    ] },
    { id: 'tb.a2', turns: [
      { by: 'b', conf: "I'm the team's scapegoat now. One bad day, and that's who I am to them.", v: { soft: ['I really tried my best.'] } },
    ] },
    { id: 'tb.a3', turns: [
      { by: 'a', say: "{b}, you were the weak link today." },
      { by: 'b', say: "Got it. Thanks.", v: { loud: ['THANKS, {a}!'] } },
    ] },
  ],

  // ── the night before the Arena ──────────────────────────────────────
  'arena-eve-pep.any': [
    { id: 'ep.1', turns: [
      { beat: '{a} finds {b} sitting by the water, staring at nothing.' },
      { by: 'a', say: "You've got this. You know that, right?", v: { loud: ['You are going to DESTROY in there tomorrow!'], soft: ['Hey. Whatever happens tomorrow, I\'m proud of you.'], sharp: ['Stop worrying. Worrying loses eliminations.'] } },
      { by: 'b', say: "I don't know. I'm scared.", v: { sharp: ['I\'m not scared. I\'m angry. Maybe I\'m a little scared too.'], loud: ['I\'m ready! I\'m so ready! ...Okay, I\'m scared.'] } },
      { by: 'a', say: "Scared's fine. Scared means you care. Just don't let it slow you down.", v: { odd: ['Being scared is fine. Just use it.'] } },
      { by: 'b', conf: "{a} sat up with me until I could breathe again. I'm going in there for both of us.", v: { sharp: ['{a} believes in me. That\'s enough.'] } },
    ] },
    { id: 'ep.2', turns: [
      { by: 'a', say: "Get some sleep. You're going to need it.", v: { soft: ['Try to rest, okay? I\'ll be cheering for you.'] } },
      { by: 'b', say: "I can't sleep.", v: { odd: ['Sleep is for people who aren\'t terrified.'] } },
      { by: 'a', say: "Then let's just sit here for a while." },
    ] },
    // written long from the start (the long cut, 2026-10-16)
    { id: 'epx.1', turns: [
      { beat: '{a} knocks on the bedroom door. {b} is lying awake in the dark.' },
      { by: 'a', say: "Can't sleep either?" },
      { by: 'b', say: "I keep running through every game they could pick." },
      { by: 'a', say: "Stop. You can't train for all of them tonight." },
      { by: 'b', say: "Then what do I do?" },
      { by: 'a', say: "You sleep, you eat breakfast, and you walk in there like it's yours." },
      { by: 'b', say: "That easy, huh?" },
      { by: 'a', say: "No. But you're good enough to make it look easy." },
      { by: 'b', conf: "I needed somebody to tell me I could do this. {a} did, and I think I actually believe it." },
    ] },
    { id: 'epx.2', turns: [
      { by: 'b', say: "If I don't come back, take my snacks." },
      { by: 'a', say: "You're coming back. And I'm taking your snacks anyway." },
      { by: 'b', say: "Seriously, though. What if I lose?" },
      { by: 'a', say: "Then you lose fighting. But you won't." },
      { by: 'b', say: "How do you know?" },
      { by: 'a', say: "Because I've watched you all season. You don't quit." },
      { by: 'a', conf: "I'm scared for {b}. I'm not going to let {b} see that tonight." },
    ] },
    { id: 'epx.3', turns: [
      { beat: '{a} and {b} sit by the pool. The rest of the villa has gone quiet.' },
      { by: 'a', say: "Whatever happens tomorrow, you've already earned your place in here." },
      { by: 'b', say: "Tell that to the people who voted me in." },
      { by: 'a', say: "They voted you in because they're scared of you. Use that." },
      { by: 'b', say: "I'll try." },
      { by: 'a', say: "Don't try. Do it." },
      { by: 'b', conf: "{a} is right. They sent me in because they think I'll lose. I'm going to prove them wrong." },
    ] },
    { id: 'epx.4', turns: [
      { by: 'a', say: "Want me to stay up with you?" },
      { by: 'b', say: "You don't have to." },
      { by: 'a', say: "I know. I want to." },
      { by: 'b', say: "Okay. Talk to me about anything. Anything but tomorrow." },
      { by: 'a', say: "Okay. Tell me about home." },
      { beat: 'They talk until the sky starts to get light.' },
      { by: 'b', conf: "I forgot about the Arena for a few hours. That's the best thing anybody could have done for me." },
    ] },
    { id: 'ep.3', turns: [
      { by: 'b', conf: "The night before the Arena is the worst. Having {a} there made it easier.", v: { loud: ['I\'m going in there with my whole heart tomorrow!'] } },
    ] },
    // written long from the start (the long cut, 2026-10-15)
    { id: 'ep.4', turns: [
      { beat: '{a} knocks once and sits down on the end of {b}\'s bed without asking.' },
      { by: 'a', say: "I'm not here to give you a speech. I just didn't want you sitting here on your own." },
      { by: 'b', say: "I keep going over it. Who I pick, what the game is, everything." },
      { by: 'a', say: "You won't know the game until TJ tells you. So stop trying to guess it." },
      { by: 'b', say: "And the pick?" },
      { by: 'a', say: "That one's yours. I'm not going to tell you who. I'll just tell you I'll be screaming either way." },
      { by: 'b', say: "Okay." },
      { by: 'a', say: "Okay. Now lie down. You need to sleep." },
      { by: 'b', conf: "{a} didn't say anything clever. {a} just sat there until I stopped shaking, and that was enough." },
    ] },
    { id: 'ep.5', turns: [
      { by: 'b', say: "Can I ask you something honestly?" },
      { by: 'a', say: "Always." },
      { by: 'b', say: "Do you think I can win tomorrow?" },
      { by: 'a', say: "I've watched you in every daily. You don't give up when it hurts. That's what the Arena is." },
      { by: 'b', say: "And if I lose?" },
      { by: 'a', say: "Then you lose fighting, and everybody in that stand will know it." },
      { by: 'b', say: "That's not a yes." },
      { by: 'a', say: "It's a yes. I'm just not going to jinx it." },
      { by: 'a', conf: "I want {b} to win tomorrow more than I've wanted anything in this game so far." },
    ] },
  ],
  'arena-eve-alone.any': [
    { id: 'ea.1', turns: [
      { by: 'a', conf: "Nobody came to check on me tonight. Not one person. I guess I know where I stand now.", v: { sharp: ['Fine. I don\'t need anybody. I just need to win.'], soft: ['I didn\'t think I\'d feel this alone in a house full of people.'], loud: ['Nobody?! NOBODY?!'] } },
    ] },
    { id: 'ea.2', turns: [
      { beat: '{a} lies awake on a lounger by the pool, long after everyone else has gone to bed.' },
      { by: 'a', conf: "Tomorrow I fight for my life in this game. Tonight I'm just trying not to think about it.", v: { odd: ['I\'ve counted every star. There are a lot. I\'m still awake.'] } },
    ] },
    { id: 'ea.3', turns: [
      { by: 'a', conf: "If I win tomorrow, it's on my own. That's fine. I'd rather owe nobody.", v: { soft: ['I wish somebody had come to say good luck.'] } },
    ] },
  ],
  'arena-eve-confront.rattled': [
    // The night before the Arena, the one who thinks it'll be them goes to find the one who was voted in.
    // Nobody has been called out yet: that happens at the Arena, in front of the house.
    { id: 'ec.r1', turns: [
      { by: 'a', say: "If you're thinking about calling me out tomorrow, go ahead. I'm not easy.", v: { loud: ['Call me out tomorrow. I DARE you.'], sharp: ['Pick me tomorrow and you go home. Think about it.'], soft: ['I just want you to know, if it\'s me tomorrow, I\'m not going to make it easy.'] } },
      { by: 'b', say: "I haven't decided anything.", keep: ['decided'], v: { soft: ['I haven\'t decided anything, okay?'], dry: ['I haven\'t decided anything. Goodnight.'] } },
      { by: 'a', say: "Yeah, you have. I can see it on your face." },
      { by: 'b', conf: "{a} came straight at me tonight. I'm not going to lie, it got in my head.", v: { sharp: ['{a} rattled me. I hate that {a} rattled me.'], loud: ['Now I can\'t sleep! Thanks, {a}!'] } },
    ] },
    { id: 'ec.r2', turns: [
      { by: 'a', say: "Sleep well. And think really hard about tomorrow.", v: { odd: ['Sweet dreams! Choose wisely!'], sharp: ['Think hard before you say a name tomorrow.'] } },
      { by: 'b', conf: "{a} knows exactly how to get under my skin. I can't let it follow me into the Arena.", v: { soft: ['I just want to sleep. Now I can\'t.'] } },
    ] },
    { id: 'ec.r3', turns: [
      { by: 'a', say: "Just so you know, if it's me tomorrow, I'm not the one going home." },
      { by: 'b', say: "Neither am I." },
      { by: 'b', conf: "I said it, but I didn't believe it.", v: { loud: ['I\'m going to be up all night now!'] } },
    ] },
  ],
  'arena-eve-confront.backfires': [
    { id: 'ec.b1', turns: [
      { by: 'a', say: "If you pick me tomorrow, it's a big mistake.", keep: ['mistake'], v: { loud: ['Pick me and it\'s a BIG mistake! Huge!'], sharp: ['Calling me out would be a mistake. Just so you know.'], soft: ['I really think picking me tomorrow would be a mistake.'] } },
      { by: 'b', say: "We'll see who made the mistake.", v: { sharp: ['Did you come out here just to tell me that?'], dry: ['Okay. Goodnight.'] } },
      { by: 'a', conf: "I went out there to rattle {b}. {b} didn't even blink. Now I'm the one who can't sleep.", v: { soft: ['That didn\'t go how I wanted at all.'] } },
    ] },
    { id: 'ec.b2', turns: [
      { by: 'a', say: "Is it me tomorrow? Just tell me.", v: { loud: ['Is it ME?! Just tell me!'], soft: ['Can you just tell me if it\'s me tomorrow?'], dry: ['So. Is it me?'] } },
      { by: 'b', say: "You'll find out at the Arena, same as everybody.", v: { soft: ['I\'m not telling anybody tonight. Sorry.'], sharp: ['You\'ll hear it when TJ asks me.'] } },
      { by: 'a', conf: "{b} wouldn't tell me. That's a yes. That's definitely a yes.", v: { sharp: ['No answer is an answer.'] } },
    ] },
    { id: 'ec.b3', turns: [
      { by: 'a', conf: "I tried to get in {b}'s head. {b} didn't react at all, and I can't tell if that's good or bad.", v: { sharp: ['{b} is calmer than I thought. Noted.'] } },
    ] },
  ],
  'vet-dismisses.any': [
    { id: 'vd.1', turns: [
      { by: 'a', say: "Rookies. You'll learn. Or you'll go home.", v: { loud: ['ROOKIE! Know your place!'], dry: ['Adorable. Rookies always think they have a plan.'] } },
      { by: 'b', say: "Wow. Thanks for the advice.", v: { soft: ['Okay. That was kind of mean.'] } },
      { by: 'b', conf: "{a} thinks being a vet makes {a.obj} better than me. I'm going to enjoy proving otherwise.", v: { soft: ['I didn\'t come here to be talked down to.'] } },
    ] },
    { id: 'vd.2', turns: [
      { by: 'a', say: "Let the vets handle the strategy, okay? You just do your dailies.", v: { sharp: ['You\'re a vote for us. Just vote how we tell you.'] } },
      { by: 'b', say: "I can think for myself.", v: { loud: ['I can THINK, thank you!'] } },
    ] },
    { id: 'vd.3', turns: [
      { by: 'b', conf: "The vets treat us like extras in their show. We're not extras.", v: { sharp: ['Keep underestimating the rookies. Please.'] } },
    ] },
  ],

  // ── fights and the night out ────────────────────────────────────────
  'party.any': [
    { id: 'pt.1', turns: [
      { beat: 'The music is loud at the beach bar, and {a} is dancing on a table.' },
      { by: 'a', say: "This is the best night of my life!", v: { loud: ['THIS IS THE BEST NIGHT OF MY LIFE!'], sharp: ['Enjoy it, everyone. Tomorrow somebody\'s going home.'], soft: ['I love everybody here. I love all of you.'] } },
      { by: 'b', say: "Get down from there before you fall!", v: { odd: ['Can I come up? I\'m coming up.'] } },
      { by: 'c', conf: "Nights out in this game are where alliances get made and broken. Also where people fall off tables.", v: { soft: ['Everyone was so happy for once. It was really nice.'] } },
    ] },
    { id: 'pt.2', turns: [
      { beat: 'Everybody\'s at the bar doing shots.' },
      { by: 'a', say: "To being here! And not being in the Arena!", v: { loud: ['TO NOT BEING IN THE ARENA!'] } },
      { by: 'b', say: "I'll drink to that.", v: { sharp: ['Speak for yourself.'] } },
    ] },
    // written long from the start (the long cut, 2026-10-16): the night out opens on the place and the mood
    { id: 'pt.4', turns: [
      { beat: 'TJ sends the house to the Beach Club for the night. The music is already going when the cars pull up.' },
      { by: 'a', say: "Okay, nobody talk about the game tonight. Nobody." },
      { by: 'b', say: "You say that every time." },
      { by: 'a', say: "And every time somebody ruins it. Not tonight." },
      { by: 'c', opt: 1, say: "Shots first. Rules later." },
      { by: 'b', say: "To not talking about the game." },
      { by: 'a', say: "To not talking about the game!" },
      { by: 'b', conf: "We lasted about ten minutes before somebody brought up the vote. It was {a}." },
    ] },
    { id: 'pt.5', turns: [
      { beat: 'The Beach Club is lit up in orange and red. The house walks in, and the DJ turns it up.' },
      { by: 'a', say: "Now THIS is what I came here for." },
      { by: 'b', say: "You came here for a million dollars." },
      { by: 'a', say: "Tonight I came here for the bar." },
      { by: 'c', opt: 1, say: "Somebody keep an eye on {a}. I'm serious." },
      { by: 'b', say: "Somebody keep an eye on all of us." },
      { by: 'c', opt: 1, conf: "A night out is where everybody gets loose, and loose is when people say what they really think." },
    ] },
    { id: 'pt.6', turns: [
      { beat: 'After the daily, TJ surprises the house with a night out at the Beach Club.' },
      { by: 'a', say: "Is everybody coming? Even the people who aren't talking?" },
      { by: 'b', say: "Everybody's coming. Free drinks don't care who's fighting." },
      { by: 'a', say: "Fair." },
      { beat: 'Within an hour, {a} is on the dance floor and {b} is at the bar telling everybody a story.' },
      { by: 'c', opt: 1, say: "Is {b} still telling that story? It's been twenty minutes." },
      { by: 'a', conf: "I needed this. Two more days and somebody in this house goes home, but for one night, it's just a party." },
    ] },
    { id: 'pt.3', turns: [
      { by: 'a', conf: "Party nights are fun until somebody says something they can't take back. And somebody always does.", v: { odd: ['I danced so hard I think I pulled something. Worth it.'] } },
    ] },
  ],
  // ── the night out's drama (party.js nightDrama), written long ──
  // loose lips: a told b about the alliance's plan; c, an ally, saw it
  'party-slip.told': [
    { id: 'ps.t1', turns: [
      { beat: 'At the bar, {a} is three drinks in and leaning on {b}.' },
      { by: 'a', say: "Can I tell you something? You can't tell anybody." },
      { by: 'b', say: "Of course. What is it?" },
      { by: 'a', say: "{alliance}. That's us. We've got the numbers, and we've got a plan." },
      { by: 'b', say: "What plan?" },
      { by: 'a', say: "{target}. Next chance we get." },
      { by: 'b', say: "Wow. Okay. Thanks for telling me." },
      { by: 'b', conf: "{a} has no idea what just happened. I know the name of the alliance, I know who's in it, and I know who they're coming for." },
    ] },
    { id: 'ps.t2', turns: [
      { by: 'a', say: "You're one of the good ones, you know that?" },
      { by: 'b', say: "That's the drink talking." },
      { by: 'a', say: "No, I mean it. That's why you're safe. {alliance} isn't coming for you." },
      { by: 'b', say: "{alliance}?" },
      { by: 'a', say: "Oh. I wasn't supposed to say that." },
      { by: 'b', say: "Say what? Keep going." },
      { by: 'a', conf: "I don't know how much I said last night. I just know {b} was smiling a lot." },
    ] },
    { id: 'ps.t3', turns: [
      { beat: 'Out on the deck, away from the music, {a} sits down next to {b}.' },
      { by: 'a', say: "Can I be honest with you? I'm in {alliance}." },
      { by: 'b', say: "I figured there was a group. I didn't know the name." },
      { by: 'a', say: "Well, now you do. And now you know we're not coming for you." },
      { by: 'b', say: "Who are you coming for?" },
      { by: 'a', say: "I've said too much." },
      { by: 'b', conf: "Never tell somebody in this game the name of your alliance. {a} just did, and I'm going to use it." },
    ] },
  ],
  'party-slip.caught': [
    { id: 'ps.c1', turns: [
      { by: 'a', say: "Honestly, {alliance} has this whole game wrapped up." },
      { by: 'b', say: "{alliance}?" },
      { beat: '{c} walks up with two drinks and stops dead.' },
      { by: 'c', say: "{a}. Can I borrow you for a second?" },
      { by: 'a', say: "I'm talking." },
      { by: 'c', say: "Yeah. I heard. That's the problem." },
      { by: 'c', conf: "One night out. That's all it took for {a} to say our name out loud to somebody outside the group." },
    ] },
    { id: 'ps.c2', turns: [
      { by: 'a', say: "You want to know a secret? There's a group, and it's called {alliance}." },
      { by: 'b', say: "Who's in it?" },
      { by: 'c', say: "Nobody. It's a joke. {a}'s drunk." },
      { by: 'a', say: "I'm not drunk." },
      { by: 'c', say: "You're very drunk. Let's get you some water." },
      { by: 'b', conf: "Nobody shuts a joke down that fast. {alliance} is real." },
      { by: 'c', conf: "I'm going to have to talk to the others about {a}. We can't trust somebody who talks like that." },
    ] },
    { id: 'ps.c3', turns: [
      { beat: '{a} has an arm round {b} at the bar, talking too loudly.' },
      { by: 'a', say: "{alliance} looks after its people, and I'm telling you, you could be one of them." },
      { by: 'c', say: "{a}! Dance floor. Now." },
      { by: 'a', say: "In a minute." },
      { by: 'c', say: "Now." },
      { by: 'b', say: "Go on. We can finish this later." },
      { by: 'c', conf: "The rule is simple. You don't say the name. {a} broke it in front of me." },
    ] },
  ],
  'party-slip.self': [
    { id: 'ps.s1', turns: [
      { by: 'a', say: "Can I tell you something? I really like you. I do." },
      { by: 'b', say: "Okay..." },
      { by: 'a', say: "Which is why it's hard, because {alliance} wants you gone next." },
      { by: 'b', say: "Wait. What?" },
      { by: 'a', say: "I didn't say that. Forget I said that." },
      { by: 'b', say: "No. Say it again." },
      { by: 'b', conf: "{a} got drunk and told me exactly who wants me gone. I'm not going to forget a single word of it." },
    ] },
    { id: 'ps.s2', turns: [
      { beat: 'Late at the bar, {a} is talking to {b} about the game, and {b} is listening very carefully.' },
      { by: 'a', say: "It's nothing personal. {alliance} just thinks you're the biggest threat." },
      { by: 'b', say: "Who's in {alliance}?" },
      { by: 'a', say: "Doesn't matter." },
      { by: 'b', say: "It matters to me." },
      { by: 'a', conf: "I woke up this morning, and I remembered saying something to {b}. I don't remember what. That's what scares me." },
      { by: 'b', conf: "Now I know what I'm up against, and I know who told me. Thank you, open bar." },
    ] },
    { id: 'ps.s3', turns: [
      { by: 'a', say: "You're not going to like this, but you deserve to know." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "{alliance} is coming for you. I'm in it. I'm sorry." },
      { by: 'b', say: "Then why are you telling me?" },
      { by: 'a', say: "Because I've had four drinks and I feel bad." },
      { by: 'b', conf: "{a} feels bad tonight. Tomorrow {a} won't remember saying it. I will." },
    ] },
  ],
  'party-deal.any': [
    { id: 'pdeal.1', turns: [
      { beat: 'At the bar, {a} and {b} clink glasses.' },
      { by: 'a', say: "Final. You and me. Promise me." },
      { by: 'b', say: "You're drunk." },
      { by: 'a', say: "I'm drunk and I mean it. Promise me." },
      { by: 'b', say: "Okay. Final. You and me." },
      { by: 'a', say: "Shake on it." },
      { beat: 'They shake on it, and then they hug, and then they spill both drinks.' },
      { by: 'b', conf: "I made a deal at a bar. In this game, that still counts. I just hope {a} remembers it in the morning." },
    ] },
    { id: 'pdeal.2', turns: [
      { by: 'a', say: "I've been thinking. We should go to the end together." },
      { by: 'b', say: "We should?" },
      { by: 'a', say: "Nobody would see it coming. We barely talk in the house." },
      { by: 'b', say: "That's actually smart." },
      { by: 'a', say: "I'm smart when I've had a drink." },
      { by: 'b', say: "Deal. But if you tell anybody, it's off." },
      { by: 'a', conf: "Best decision I've made all season, and I made it at a bar." },
    ] },
    { id: 'pdeal.3', turns: [
      { beat: '{a} and {b} have found a quiet corner of the Beach Club.' },
      { by: 'a', say: "Whatever happens this week, I've got your back. All the way." },
      { by: 'b', say: "All the way to the final?" },
      { by: 'a', say: "All the way to the final." },
      { by: 'b', say: "Then I've got yours." },
      { by: 'a', say: "To the final." },
      { by: 'b', say: "To the final." },
      { by: 'a', conf: "People say a deal at a party doesn't count. Every deal counts in here. That's what makes it dangerous." },
    ] },
  ],
  'party-callout.firesback': [
    { id: 'pc.f1', turns: [
      { beat: '{a} climbs onto a chair, and the music cuts out.' },
      { by: 'a', say: "Can I have everybody's attention? I want to say something to {b}." },
      { by: 'b', say: "Oh, here we go." },
      { by: 'a', say: "Here's the thing, {b}: {beef}, and I'm done pretending I'm fine with it." },
      { by: 'b', say: "You want to do this here? Fine. Get down from the chair and say it to my face." },
      { by: 'a', say: "I just did." },
      { by: 'b', say: "No, you shouted it at a party because you're scared to say it sober." },
      { beat: 'Half the club goes ooh. The DJ puts the music back on.' },
      { by: 'b', conf: "{a} wanted to embarrass me in front of everybody. I gave it right back, and now everybody's talking about {a}." },
    ] },
    { id: 'pc.f2', turns: [
      { by: 'a', say: "Everybody listen! {b}, {beef}." },
      { by: 'b', say: "Are you serious right now?" },
      { by: 'a', say: "Dead serious." },
      { by: 'b', say: "Then let's talk about what you've done. Want me to start the list?" },
      { by: 'x', opt: 1, say: "Okay, okay, break it up." },
      { by: 'a', say: "Start it. Go on." },
      { by: 'b', say: "Not tonight. You'll hear it when it counts." },
      { by: 'a', conf: "I said what I came to say. {b} wants to make it a war? Fine. It's a war." },
    ] },
    { id: 'pc.f3', turns: [
      { beat: 'In the middle of the dance floor, {a} stops dancing and points at {b}.' },
      { by: 'a', say: "You. I've got something to say to you." },
      { by: 'b', say: "Say it, then." },
      { by: 'a', say: "{beef}. Everybody knows it, and nobody says it." },
      { by: 'b', say: "And you think yelling it at a party makes you brave?" },
      { by: 'a', say: "It makes me honest." },
      { by: 'b', say: "It makes you drunk." },
      { by: 'b', conf: "Tomorrow {a} is going to wake up and remember every word, and so is everybody else in this house." },
    ] },
  ],
  'party-callout.walks': [
    { id: 'pc.w1', turns: [
      { beat: '{a} climbs onto the bar. Somebody turns the music down.' },
      { by: 'a', say: "{b}! Yeah, you. {beef}." },
      { by: 'b', say: "I'm not doing this." },
      { by: 'a', say: "Of course you're not. You never do anything." },
      { beat: '{b} puts down the drink and walks out of the club without a word.' },
      { by: 'x', opt: 1, say: "{a}, that was a lot." },
      { by: 'b', conf: "I'm not going to fight {a} at a party. I'll answer at the vote, where it counts." },
    ] },
    { id: 'pc.w2', turns: [
      { by: 'a', say: "Hey, everybody! I want to talk about {b}." },
      { by: 'b', say: "Please don't." },
      { by: 'a', say: "{beef}. There. I said it." },
      { by: 'b', say: "Okay. Good night, everybody." },
      { beat: '{b} leaves. The whole club watches {b} go, then turns back to {a}.' },
      { by: 'a', conf: "{b} walked away. Fine. I said it out loud, and that's what I wanted." },
    ] },
    { id: 'pc.w3', turns: [
      { beat: 'The music is loud, and {a} is louder.' },
      { by: 'a', say: "{b}, look at me. {beef}!" },
      { by: 'b', say: "We're at a party. Can you just have fun?" },
      { by: 'a', say: "This is me having fun." },
      { by: 'b', say: "Then have it without me." },
      { beat: '{b} heads back to the cars early.' },
      { by: 'b', conf: "I was humiliated in front of everybody, and I didn't say a word back. That's going to cost {a} more than it costs me." },
    ] },
  ],
  'party-tears.comforted': [
    { id: 'pt.c1', turns: [
      { beat: 'Away from the dance floor, {a} is sitting on the steps, crying.' },
      { by: 'b', say: "Hey. Hey. What's going on?" },
      { by: 'a', say: "I miss home. I miss my family. I don't know why it's hitting me now." },
      { by: 'b', say: "Because it's the first time all week you stopped." },
      { by: 'a', say: "I'm sorry. I'm ruining your night." },
      { by: 'b', say: "You're not ruining anything. Come here." },
      { beat: '{b} sits down and puts an arm round {a}.' },
      { by: 'a', conf: "Everybody's dancing, and I fell apart. {b} came and found me. I'll never forget that." },
    ] },
    { id: 'pt.c2', turns: [
      { by: 'a', say: "I'm fine. I'm fine. I just need a minute." },
      { by: 'b', say: "You're not fine. Talk to me." },
      { by: 'a', say: "Everybody in that house is playing a game, and I'm just tired." },
      { by: 'b', say: "Then don't play tonight. Tonight just be a person." },
      { by: 'a', say: "Can we stay out here for a bit?" },
      { by: 'b', say: "As long as you want." },
      { by: 'b', conf: "In here everybody has to look strong. Sometimes somebody needs to be allowed not to be." },
    ] },
    { id: 'pt.c3', turns: [
      { beat: '{a} has stopped dancing and is staring at the ocean, wiping tears away.' },
      { by: 'b', say: "Is it the game or is it home?" },
      { by: 'a', say: "Both. Everything." },
      { by: 'b', say: "Okay. One drink of water, then we go back in together." },
      { by: 'a', say: "Together?" },
      { by: 'b', say: "Together." },
      { by: 'a', conf: "I came out tonight to forget about the game. Instead I found out who my real friend is in here." },
    ] },
  ],
  'party-tears.alone': [
    { id: 'pt.a1', turns: [
      { beat: '{a} is sitting alone at the end of the bar, crying into a drink. Nobody comes over.' },
      { by: 'a', conf: "Thirty people in that club, and not one of them noticed me. That says everything about where I am in this game." },
    ] },
    { id: 'pt.a2', turns: [
      { beat: 'While the house dances, {a} walks down to the water alone and sits in the sand.' },
      { by: 'a', conf: "I miss home so much it hurts. And I can't tell anybody in there, because tomorrow they'll use it." },
    ] },
    { id: 'pt.a3', turns: [
      { beat: '{a} leaves the party early and cries in the back of the car on the way home.' },
      { by: 'a', conf: "Everybody thinks I'm the strong one. I'm not. I'm just good at hiding it until I'm alone." },
    ] },
  ],
  'fight.any': [
    { id: 'fg.1', turns: [
      { by: 'a', say: "What did you just say about me? Say it to my face.", v: { loud: ['WHAT DID YOU SAY ABOUT ME? SAY IT TO MY FACE!'], sharp: ['I heard what you said about me. Go on. Repeat it. I dare you.'] } },
      { by: 'b', say: "I said what I said.", v: { soft: ['I didn\'t mean it like that!'], loud: ['I SAID WHAT I SAID!'] } },
      { beat: 'People pull them apart before it goes any further.' },
      { by: 'a', conf: "{b} has been asking for that all season. Tonight {b} got it.", when: { early: false }, v: { soft: ['I hate that I lost it. I just couldn\'t hold it in anymore.'] } },
      { by: 'a', conf: "I don't know {b} well yet, but I already can't stand {b.obj}.", when: { early: true } },
    ] },
    { id: 'fg.2', when: { cause: ['talk'] }, turns: [
      { by: 'a', say: "You've been running your mouth all night.", v: { loud: ['YOU\'VE BEEN RUNNING YOUR MOUTH ALL NIGHT!'] } },
      { by: 'b', say: "And you've been drinking all night, so I guess we're even.", v: { sharp: ['And? What are you going to do about it?'] } },
      { by: 'b', conf: "{a} wanted a fight. {a} got one. Now everybody's going to pick a side.", v: { soft: ['I didn\'t want this. I really didn\'t.'] } },
    ] },
    { id: 'fg.3', turns: [
      { by: 'a', say: "Don't walk away from me!" },
      { by: 'b', say: "Watch me.", v: { soft: ['I\'m not doing this with you tonight.'] } },
      { beat: 'Half the bar watches {b} storm off into the night.' },
    ] },
    // written long from the start (the long cut, 2026-10-15)
    { id: 'fg.4', turns: [
      { by: 'a', say: "Do you have a problem with me? Because you keep looking over here." },
      { by: 'b', say: "I'm allowed to look wherever I want." },
      { by: 'a', say: "Not like that, you're not." },
      { by: 'b', say: "Like what? Go on, tell me what I'm doing." },
      { by: 'a', say: "You've been rolling your eyes every time I talk. Everybody's noticed." },
      { by: 'b', say: "Then maybe stop saying things that make me roll my eyes." },
      { beat: '{a} stands up. Two people stand up with {a.obj}, just in case.' },
      { by: 'a', say: "Say one more word." },
      { by: 'b', say: "I'm not scared of you." },
      { beat: 'Somebody pulls {a} back by the arm. {b} doesn\'t move.' },
      { by: 'b', conf: "{a} wanted me to back down in front of everybody. I'm not backing down from anybody in this house." },
    ] },
    { id: 'fg.5', when: { cause: ['talk'] }, turns: [
      { by: 'b', say: "If you've got something to say about me, say it here. Not behind my back." },
      { by: 'a', say: "Fine. I think you're fake. I think you smile at everybody and then talk about them the second they leave." },
      { by: 'b', say: "That's rich, coming from you." },
      { by: 'a', say: "Meaning what, exactly?" },
      { by: 'b', say: "It means you do exactly the same thing, you're just louder about it." },
      { by: 'a', say: "At least I say it to people's faces." },
      { by: 'b', say: "You're saying it now because you're angry. That's not the same thing." },
      { beat: 'The room has gone completely quiet. Nobody is pretending not to listen any more.' },
      { by: 'a', conf: "I said what everybody's been thinking about {b}. If that makes me the bad guy tonight, fine." },
      { by: 'b', conf: "{a} wanted a fight, and {a} got one. I just hope everybody watching remembers who started it." },
    ] },
    { id: 'fg.6', when: { cause: ['talk'] }, turns: [
      { by: 'a', say: "Can I talk to you? Now?" },
      { by: 'b', say: "If you're going to yell, no." },
      { by: 'a', say: "I'm not going to yell. I want to know why my name keeps coming out of your mouth." },
      { by: 'b', say: "Because you're the one people are talking about. I'm just saying it out loud." },
      { by: 'a', say: "You're not saying it out loud. You're saying it when I'm not there." },
      { by: 'b', say: "Well, now you're here. So what?" },
      { beat: 'The room goes quiet. Somebody turns the music down.' },
      { by: 'a', say: "So stop. That's what." },
      { by: 'b', conf: "{a} came at me in front of everybody. That tells me {a} is scared." },
      { by: 'a', conf: "I'm done letting {b} talk about me. If it happens again, it's going to get ugly." },
    ] },
    { id: 'fg.7', when: { cause: ['clash', 'talk'] }, turns: [
      { by: 'b', say: "Why are you even mad at me right now?" },
      { by: 'a', say: "You know exactly why." },
      { by: 'b', say: "I genuinely don't." },
      { by: 'a', say: "Then think about it for a second, and you'll get there." },
      { by: 'b', say: "I'm not doing riddles with you. Say it or drop it." },
      { by: 'a', say: "Fine. You made me look stupid in front of everybody, and you enjoyed it." },
      { by: 'b', say: "I didn't make you look stupid. You did that yourself." },
      { beat: '{a} takes a step forward. {c} gets between them.', opt: 'c' },
      { by: 'c', opt: 1, say: "Both of you, walk away. It's not worth it." },
      { by: 'a', conf: "One day {b} is going to say that to the wrong person." },
    ] },
    { id: 'fg.8', when: { cause: ['talk', 'vote'] }, turns: [
      { by: 'a', say: "Keep my name out of your mouth." },
      { by: 'b', say: "Or what?" },
      { by: 'a', say: "Keep going and find out." },
      { by: 'b', say: "You don't scare anybody in here." },
      { by: 'a', say: "I don't need to scare anybody. I need you to stop." },
      { by: 'b', say: "Then stop giving me things to talk about." },
      { beat: 'A couple of people laugh. {a} does not.' },
      { by: 'a', conf: "{b} thinks it's all a joke. It won't be a joke when we're both standing in the Arena." },
      { by: 'b', conf: "{a} has a temper, and it just came out in front of the whole bar. That's going to cost {a.obj}." },
    ] },
  ],
  'fight-physical.any': [
    { id: 'fp.1', turns: [
      { by: 'a', say: "Get out of my face!", v: { loud: ['GET OUT OF MY FACE!'] } },
      { beat: '{a} shoves {b}. Hard. Somebody screams and three people grab {a}.' },
      { by: 'b', say: "Did you just put your hands on me?", v: { loud: ['YOU PUT YOUR HANDS ON ME!'], soft: ['Oh my God. Oh my God.'] } },
      { by: 'b', conf: "{a} crossed the line. There's no coming back from that in this game, and {a} knows it.", v: { sharp: ['{a} just ended {a.posAdj} own game.'] } },
    ] },
    { id: 'fp.2', turns: [
      { beat: 'The argument between {a} and {b} goes from shouting to shoving in a second.' },
      { by: 'a', conf: "I lost it. I know I lost it. I'm going to pay for it.", v: { soft: ['I\'m so ashamed. That\'s not who I am.'], sharp: ['{b} pushed me to it. I\'m not apologising.'] } },
    ] },
    { id: 'fp.3', turns: [
      { by: 'a', say: "Say one more word. One more.", v: { loud: ['SAY ONE MORE WORD!'] } },
      { by: 'b', say: "Or what?", v: { soft: ['Please, just stop.'] } },
      { beat: '{a} lunges at {b}. Security is between them in seconds, but the damage is done.' },
      { by: 'b', conf: "{a} put hands on me. The cameras got it. TJ is going to see it. That's it for {a}.", v: { loud: ['The CAMERAS got it! It\'s OVER for {a}!'] } },
    ] },
  ],
  'partner-draw.any': [
    { id: 'pd.d1', turns: [
      { by: 'tj', say: "Today's daily is pairs, people, and the partners are drawn at random! No complaining!" },
      { by: 'a', say: "Looks like it's us.", v: { loud: ['PARTNER! Let\'s GO!'], soft: ['Hi, partner! We\'ve got this.'] } },
      { by: 'b', say: "Let's not embarrass ourselves.", v: { soft: ['We\'re going to be great.'] } },
    ] },
    { id: 'pd.d2', turns: [
      { by: 'tj', say: "Reach into the bag, pull a name, and that's your soulmate for the day!" },
      { by: 'a', conf: "I got {b}. Could have been better. Could have been a lot worse.", v: { odd: ['Partner roulette! I got {b}! I don\'t know if that\'s good!'] } },
    ] },
    { id: 'pd.d3', turns: [
      { by: 'tj', say: "Pairs day! Grab a partner from the hat!" },
      { by: 'b', say: "Oh. It's you.", v: { soft: ['Oh! It\'s you! Okay, cool.'] } },
    ] },
  ],
  'partner-pick.any': [
    { id: 'pp.1', turns: [
      { by: 'tj', say: "Pairs today, people! And you get to pick! Choose wisely. Or don't. It's way funnier when you don't." },
      { by: 'a', say: "I'll take {b}.", v: { loud: ['{b}! Obviously {b}!'], sharp: ['{b}. Strongest option.'] } },
      { by: 'b', conf: "{a} picked me first. That's not just a daily, that's a statement.", v: { soft: ['It felt so nice to be chosen first.'] } },
    ] },
    { id: 'pp.2', turns: [
      { by: 'tj', say: "You pick your partner today! This is like a middle-school dance but with more sweating!" },
      { by: 'a', say: "{b}, you and me." },
      { by: 'b', say: "Let's do it.", v: { odd: ['Partners! Do we need a team name? We need a team name.'] } },
    ] },
    { id: 'pp.3', turns: [
      { by: 'a', conf: "Picking a partner is picking a side. I picked {b}, and everybody in that line knows what it means.", v: { soft: ['I just picked the person I trust most.'] } },
    ] },
  ],
};
