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
      { by: 'a', say: "I'll be quick. I think the three of us could run this place.", v: { loud: ['Okay, I\'m just going to say it! You, me, and {c}! Let\'s run this house!'], soft: ['I really trust you two. I think we should stick together.'], sharp: ['I\'ve looked at everybody. You two are the only ones worth working with.'] } },
      { by: 'b', say: "I've been thinking the same thing.", v: { sharp: ['Okay. What\'s in it for me?'], soft: ['Really? Me? Yes. Yes, absolutely.'] } },
      { by: 'c', say: "So what do we call ourselves?", v: { odd: ['Do we get a secret handshake?'] } },
      { by: 'a', say: "{alliance}. And nobody outside this room hears that name." },
      { by: 'a', conf: "Day one, and I've already got a group. In this game, the first alliance is usually the one that decides the first vote.", v: { sharp: ['Three votes on day one. Everybody else is still unpacking.'], soft: ['I feel so much better knowing I\'ve got people.'] } },
    ] },
    { id: 'af.2', turns: [
      { by: 'a', say: "Can I trust you two? Like, really trust you?", v: { sharp: ['Before I say anything, I need to know you can keep your mouths shut.'] } },
      { by: 'b', say: "Yeah. Of course.", v: { odd: ['I have never told a secret in my life. Okay, once.'] } },
      { by: 'a', say: "Then let's make it official. Us three, and we see who else we can bring in.", v: { loud: ['Then we\'re a team! Starting right now!'] } },
      { by: 'c', conf: "{a} moved fast. I like that in an ally. I'd hate it in an enemy.", v: { soft: ['It\'s nice to have people to lean on in here.'] } },
    ] },
    { id: 'af.3', turns: [
      { beat: 'A quiet corner of the pool deck. {a}, {b} and {c} talk with their backs to the villa.' },
      { by: 'a', say: "We vote together, we protect each other, and we don't tell anybody.", v: { soft: ['I just want us to look after each other, okay?'] } },
      { by: 'b', say: "Deal.", v: { loud: ['DEAL!'] } },
      { by: 'b', conf: "{alliance} is born. Let's see how long it lasts.", v: { soft: ['I really hope this lasts.'], sharp: ['Every alliance ends. The trick is being there when it does.'] } },
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
      { by: 'a', conf: "The people from my old show found each other in about five minutes. {alliance} was decided before anyone else even noticed.", v: { sharp: ['Old friends make the best first alliance. And the easiest to cut, later.'] } },
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
      { by: 'a', conf: "{alliance} needs numbers, and {b} has been loyal to us all week. Bringing {b} in is easy.", v: { sharp: ['More numbers means more control. {b} is a number.'] } },
      { by: 'b', say: "So I'm in? Just like that?", v: { odd: ['Do I get a jacket? Tell me there\'s a jacket.'] } },
      { by: 'a', say: "Just like that." },
    ] },
    { id: 'ag.3', turns: [
      { by: 'b', conf: "{a} pulled me aside and told me about {alliance}. I'm in. I'm also the newest one in, which makes me the easiest one to cut.", v: { soft: ['I\'m just happy to have a group.'] } },
    ] },
  ],
  'alliance-betrayal.vote': [
    { id: 'ab.v1', turns: [
      { by: 'a', say: "You voted for me. My own alliance. You said my name out loud.", v: { loud: ['YOU VOTED FOR ME! You\'re supposed to be on my SIDE!'], soft: ['I can\'t believe you did that to me.'] } },
      { by: 'b', say: "It wasn't personal.", v: { sharp: ['It was the right move. Deal with it.'], soft: ['I\'m so sorry. I had no choice.'] } },
      { by: 'a', say: "It was personal to me.", v: { sharp: ['Everything\'s personal now.'] } },
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
  ],
  'alliance-betrayal.callout': [
    { id: 'ab.c1', turns: [
      { by: 'a', say: "You called me out. Me. After everything.", v: { loud: ['You called ME out?! After EVERYTHING?!'], soft: ['Out of everybody, you picked me.'] } },
      { by: 'b', say: "I picked the fight I could win.", v: { soft: ['I\'m sorry. I had to survive.'], sharp: ['It\'s the Arena. Friendship stops at the sand.'] } },
      { by: 'a', conf: "{b} looked at a whole house of people and picked an ally. That says everything.", v: { soft: ['I keep thinking about the look on {b}\'s face when {b} said my name.'] } },
    ] },
    { id: 'ab.c2', turns: [
      { by: 'a', say: "I thought we were in this together.", v: { sharp: ['So that\'s what our alliance was worth.'] } },
      { by: 'b', say: "We were. Until it was me or you.", v: { soft: ['We still are. Please understand.'] } },
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
      { by: 'a', conf: "I'm not in that alliance anymore. Honestly, I'm not sure I ever really was.", v: { sharp: ['Free agent. Best thing that\'s happened to my game.'], soft: ['I feel lonely now. But I feel honest.'] } },
    ] },
    { id: 'al.3', turns: [
      { by: 'b', say: "We need to talk about where your head's at." },
      { by: 'a', say: "My head's somewhere else. Let's leave it there.", v: { loud: ['My head\'s OUT! I\'m out!'] } },
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
      { by: 'a', conf: "{b} cut me out of the alliance for no reason. Paranoid people make bad leaders.", v: { soft: ['I didn\'t do anything wrong. I really didn\'t.'] } },
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
      { by: 'a', say: "Now we find out who we really are in this game.", v: { odd: ['Now? Now we panic. Professionally.'] } },
    ] },
  ],
  'alliance-end.numbers': [
    { id: 'ae.n1', turns: [
      { by: 'a', say: "There's only two of us left. We're not an alliance anymore, we're just friends.", v: { soft: ['It\'s just you and me now. I\'m glad it\'s you.'], sharp: ['Two people isn\'t an alliance. It\'s a target.'] } },
      { by: 'b', say: "Then let's be friends who vote together.", v: { loud: ['Then we\'re a duo! A deadly duo!'] } },
    ] },
    { id: 'ae.n2', turns: [
      { by: 'a', conf: "Everybody else in our group got picked off one by one. Now there's nobody to protect.", v: { soft: ['I miss them. All of them.'] } },
    ] },
    { id: 'ae.n3', turns: [
      { by: 'a', conf: "Alliances in this game don't break. They just get smaller until there's nothing left.", v: { sharp: ['Our numbers are gone. Time to find new ones.'] } },
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
      { by: 'a', say: "We stop being numbers for them. We vote together.", v: { loud: ['We fight back! Together!'] } },
      { by: 'c', conf: "The vets thought the rookies would just line up and go home one at a time. Not anymore.", v: { soft: ['For the first time in here, I don\'t feel alone.'] } },
    ] },
    { id: 'ru.2', turns: [
      { by: 'a', conf: "We're the new threats. The vets forgot that a threat is something you're supposed to be scared of.", v: { odd: ['Rookie revolution! I made us a chant. We\'re not using it. Yet.'] } },
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
      { by: 'a', conf: "{b} and {c} went quiet the second I walked in. That's not a coincidence. That's an alliance.", v: { sharp: ['Silence when you walk in tells you more than any conversation.'] } },
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
      { by: 'a', conf: "A deal with {b} is insurance. Insurance only matters if somebody keeps paying it.", v: { soft: ['It\'s nice knowing there\'s one person in here who won\'t come for me.'] } },
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
      { by: 'b', conf: "{a} and I have a deal now. It's not an alliance. It's insurance.", v: { loud: ['Insurance! Best purchase I\'ve made all week!'] } },
    ] },
    { id: 'dl.6', turns: [
      { by: 'a', say: "Let's keep each other off the ballot. Just us. Nobody else needs to know.", v: { sharp: ['A quiet deal. Just between us.'] } },
      { by: 'b', say: "Fine by me.", v: { soft: ['I\'d like that a lot.'] } },
      { by: 'a', conf: "A deal nobody knows about is the best kind. Nobody can use it against you.", v: { soft: ['It\'s nice to have one person I don\'t have to worry about.'] } },
    ] },
    { id: 'dl.7', turns: [
      { by: 'b', conf: "{a} asked me for a deal, and I said yes. I'll keep it as long as it keeps me safe.", v: { soft: ['I\'ll keep it. I keep my promises.'], sharp: ['Every deal has an expiry date. Mine just isn\'t written down.'] } },
    ] },
  ],
  'deal-broken.vote': [
    { id: 'db.v1', turns: [
      { by: 'b', say: "We had a deal. You said my name anyway.", v: { loud: ['WE HAD A DEAL!'], soft: ['I trusted you. We shook on it.'] } },
      { by: 'a', say: "Things changed.", v: { soft: ['I know. I\'m sorry. I didn\'t have a choice.'], sharp: ['Deals expire.'] } },
      { by: 'b', conf: "A deal only means something if you keep it. {a} didn't. Now I know what {a}'s word is worth.", v: { sharp: ['Noted. {a} is on my list now. Right at the top.'] } },
    ] },
    { id: 'db.v2', turns: [
      { by: 'b', conf: "We shook on it. {a} looked me in the eye. Then said my name out loud in front of the whole house.", v: { loud: ['In front of the WHOLE HOUSE!'] } },
    ] },
    { id: 'db.v3', turns: [
      { by: 'b', say: "So our deal meant nothing?" },
      { by: 'a', say: "It meant something. Just not enough.", v: { sharp: ['It meant exactly what I needed it to mean.'] } },
    ] },
  ],
  'deal-broken.callout': [
    { id: 'db.c1', turns: [
      { by: 'b', say: "You promised you'd never call me out. You promised!", v: { loud: ['You PROMISED!'], soft: ['You promised me.'] } },
      { by: 'a', say: "I'm sorry. It's me or you now.", v: { sharp: ['Promises don\'t count in the Arena.'] } },
      { by: 'b', conf: "{a} broke our deal to save {a.ref}. I'm going to make {a} regret that in there.", v: { soft: ['That hurt more than being voted in.'] } },
    ] },
    { id: 'db.c2', turns: [
      { by: 'b', conf: "Of everybody {a} could have called out, {a} picked the one person {a} made a deal with.", v: { sharp: ['Remember that, everybody. That\'s what {a}\'s deals are worth.'] } },
    ] },
    { id: 'db.c3', turns: [
      { by: 'b', say: "We had a deal, {a}." },
      { by: 'a', say: "We did. Now we have an elimination.", v: { soft: ['I know. I\'m so sorry.'] } },
    ] },
  ],

  // ── romance milestones ─────────────────────────────────────────────
  'spark.any': [
    { id: 'sp.1', turns: [
      { beat: '{a} and {b} keep ending up next to each other. Neither seems to mind.' },
      { by: 'a', conf: "I'm not here for romance. But {b}... I don't know. There's something there.", v: { sharp: ['{b} is a distraction. A very good-looking distraction.'], loud: ['Okay, I\'m into {b}! I said it!'], soft: ['Every time {b} smiles at me, I forget where I am.'] } },
    ] },
    { id: 'sp.2', turns: [
      { by: 'a', say: "You're kind of distracting, you know that?", v: { odd: ['Can you stop being cute? I\'m trying to strategise.'] } },
      { by: 'b', say: "I'll take that as a compliment.", v: { soft: ['That\'s... really sweet.'] } },
      { by: 'b', conf: "{a} said I was distracting. I'm going to be thinking about that for a while.", v: { sharp: ['{a} is interested. I can use that. I might also like it.'] } },
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
      { by: 'a', say: "I like you. Like, really like you.", v: { sharp: ['I don\'t do this. I\'m doing this.'] } },
      { by: 'b', say: "Good. Because I really like you too.", v: { odd: ['Oh thank God, I was about to say it first and it was going to be so awkward.'] } },
    ] },
  ],
  'breakup.any': [
    { id: 'bu.1', turns: [
      { by: 'a', say: "I can't do this anymore. Not in here.", v: { sharp: ['This isn\'t working. It\'s over.'], soft: ['I\'m so sorry. I can\'t be in a relationship and play this game.'] } },
      { by: 'b', say: "What? Where is this coming from?", v: { loud: ['WHAT? Are you serious right now?'] } },
      { by: 'a', say: "It's just not working.", v: { soft: ['I care about you. I just can\'t.'] } },
      { by: 'b', conf: "{a} ended it. Just like that. I'm not going to cry in front of everybody. I'll cry in the shower like a normal person.", v: { sharp: ['Fine. {a} just made a very big mistake, and a very big enemy.'], loud: ['I\'m so angry I can\'t even see straight!'] } },
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
      { by: 'b', conf: "{a} apologised. I believed it. Maybe I'm soft. Or maybe {a} meant it.", v: { sharp: ['An apology is a move too. I\'ll accept it and keep watching.'] } },
    ] },
  ],
  'apology.rejected': [
    { id: 'ap.r1', turns: [
      { by: 'a', say: "Look, I'm sorry about the vote.", v: { soft: ['I\'m so sorry. Can we please talk?'] } },
      { by: 'b', say: "Sorry doesn't take it back.", v: { loud: ['SORRY?! You think SORRY fixes it?!'], sharp: ['Save it.'] } },
      { by: 'a', conf: "I tried. {b} doesn't want to hear it. Fine.", v: { soft: ['I really meant it. I wish {b} believed me.'] } },
    ] },
    { id: 'ap.r2', turns: [
      { by: 'b', conf: "{a} only said sorry because {a} is scared of what I'll do. I'm not falling for it.", v: { soft: ['I want to forgive {a}. I\'m just not ready.'] } },
    ] },
    { id: 'ap.r3', turns: [
      { by: 'a', say: "Can we just move on?" },
      { by: 'b', say: "No.", v: { soft: ['Not yet. Maybe not ever.'] } },
    ] },
  ],
  // what each person wants from this season, said to a friend or to the camera
  'psyche.prove': [
    { id: 'py.p1', turns: [
      { by: 'a', conf: "People back home think I'm just here for the camera. I want to win something real, so nobody can say that again.", v: { loud: ['I\'m going to prove EVERYBODY wrong!'], soft: ['I want my family to be proud of me. That\'s all.'], sharp: ['Every doubter is fuel. I have a lot of fuel.'] } },
    ] },
    { id: 'py.p2', turns: [
      { by: 'a', say: "Do you think I can actually win this?" },
      { by: 'b', say: "I think you can do anything you decide to do.", v: { sharp: ['If you stop doubting yourself, yeah.'] } },
      { by: 'a', conf: "I don't need everybody to believe in me. I need to believe in me.", v: { odd: ['I believe in me. Mostly. Sometimes. Today, yes.'] } },
    ] },
    { id: 'py.p3', turns: [
      { by: 'a', conf: "I didn't come here to be a number. I came here to be somebody people are scared to call out.", v: { soft: ['I just want to show I belong here.'] } },
    ] },
  ],
  'psyche.belong': [
    // in a group, and still feeling outside it
    { id: 'py.b4', when: { allied: true }, turns: [
      { by: 'a', conf: "I'm in an alliance, and I still feel like the one they'd cut first. Being in a group isn't the same as belonging to it.", v: { soft: ['I have people. I just don\'t always feel like I\'m really one of them.'], sharp: ['An alliance isn\'t a family. I keep forgetting that.'] } },
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
      { by: 'a', conf: "I can't stand not knowing what's going on in this house. If there's a plan, I want to be the one who made it.", v: { sharp: ['I don\'t play to survive. I play to decide.'], soft: ['I just feel safer when I know what\'s happening.'] } },
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
      { by: 'a', conf: "Everybody remembers how I went out last time. I'm here to give them something else to remember.", v: { sharp: ['Redemption is the best revenge.'] } },
    ] },
  ],
  'psyche.home': [
    { id: 'py.h1', turns: [
      { by: 'a', conf: "I think about home every day. I'm doing this for my family. I just wish they were closer.", v: { soft: ['I sleep with my mom\'s shirt under my pillow. Don\'t tell anyone.'], sharp: ['Home is the reason I\'m here. Home is also the reason I want to leave.'] } },
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
      { by: 'a', conf: "I froze. I have no idea what happened. My brain just stopped.", v: { loud: ['I choked! I completely CHOKED!'], soft: ['I\'m so embarrassed. Everybody saw it.'], sharp: ['One bad day. That\'s all it was. One bad day.'] } },
    ] },
    { id: 'dk.2', turns: [
      { by: 'a', conf: "Everybody saw me fall apart today. I can already feel them deciding I'm weak.", v: { odd: ['I fell off the thing. All of the things.'] } },
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
      { by: 'a', conf: "Let somebody else look strong this week. Strong people go home in this game.", v: { sharp: ['Let them think I\'m weak. Weak people get called out last.'] } },
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
      { by: 'a', say: "Sure you didn't.", v: { loud: ['You absolutely did!'] } },
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
      { by: 'a', conf: "Nobody chose me. {b} got stuck with me. Great way to start a daily.", v: { odd: ['I\'m the free toy at the bottom of the cereal box.'] } },
    ] },
    { id: 'pk.3', turns: [
      { by: 'a', conf: "Every single person got picked before me. I'm going to use that in the daily.", v: { sharp: ['Fine. Underestimate me.'] } },
    ] },
  ],
  'partner-blame.any': [
    { id: 'pb.1', turns: [
      { by: 'a', say: "We lost because you couldn't keep up.", v: { loud: ['You cost us that whole daily!'], sharp: ['I carried us, and you still dropped it.'] } },
      { by: 'b', say: "I was doing my best!", v: { sharp: ['Maybe if you weren\'t screaming at me the whole time.'] } },
      { by: 'a', say: "Your best lost us the daily.", v: { soft: ['I know. I\'m sorry. I\'m just frustrated.'] } },
      { by: 'b', conf: "{a} blamed me in front of everybody. Now the whole house thinks I'm the weak one.", v: { soft: ['I really tried. I really did.'] } },
    ] },
    { id: 'pb.2', turns: [
      { by: 'a', conf: "I don't want to throw {b} under the bus. But {b} was the reason we lost, and everybody saw it.", v: { sharp: ['Partners are supposed to help. {b} was dead weight.'] } },
    ] },
    { id: 'pb.3', turns: [
      { by: 'b', say: "Go ahead, say it." },
      { by: 'a', say: "You were slow. That's all.", v: { loud: ['You were SLOW!'] } },
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
      { by: 'c', say: "Then take it yourself. You were slow too.", v: { sharp: ['Start with the mirror.'] } },
    ] },
    { id: 'tb.d3', turns: [
      { by: 'c', conf: "I wasn't going to let {a} pin the loss on {b}. Not while I'm standing right there.", v: { soft: ['{b} is my friend. Of course I said something.'] } },
    ] },
  ],
  'team-blame.alone': [
    { id: 'tb.a1', turns: [
      { by: 'a', say: "We lost because of {b}. I'm sorry, but somebody has to say it.", v: { loud: ['{b} lost us that challenge! Everybody saw it!'] } },
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
      { by: 'b', say: "I don't know. I'm scared.", v: { sharp: ['I\'m not scared. I\'m angry.'], loud: ['I\'m ready! I\'m so ready!'] } },
      { by: 'a', say: "Scared's fine. Scared means you care. Just don't let it slow you down.", v: { odd: ['Scared is just excited wearing a hoodie.'] } },
      { by: 'b', conf: "{a} sat up with me until I could breathe again. I'm going in there for both of us.", v: { sharp: ['{a} believes in me. That\'s one more person than I needed.'] } },
    ] },
    { id: 'ep.2', turns: [
      { by: 'a', say: "Get some sleep. You're going to need it.", v: { soft: ['Try to rest, okay? I\'ll be cheering for you.'] } },
      { by: 'b', say: "I can't sleep.", v: { odd: ['Sleep is for people who aren\'t terrified.'] } },
      { by: 'a', say: "Then let's just sit here for a while." },
    ] },
    { id: 'ep.3', turns: [
      { by: 'b', conf: "The night before the Arena is the longest night in this game. Having {a} there made it a little shorter.", v: { loud: ['I\'m going in there with my whole heart tomorrow!'] } },
    ] },
  ],
  'arena-eve-alone.any': [
    { id: 'ea.1', turns: [
      { by: 'a', conf: "Nobody came to check on me tonight. Not one person. I guess that tells me everything.", v: { sharp: ['Fine. I don\'t need anybody. I just need to win.'], soft: ['I didn\'t think I\'d feel this alone in a house full of people.'], loud: ['Nobody?! NOBODY?!'] } },
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
    { id: 'ec.r1', turns: [
      { by: 'a', say: "You picked me because you think I'm easy. You're about to find out how wrong you are.", v: { loud: ['You think I\'m EASY?! You have no idea!'], sharp: ['Enjoy your last night in that bed.'] } },
      { by: 'b', say: "We'll see tomorrow.", v: { soft: ['I\'m not trying to fight with you, okay?'] } },
      { by: 'a', say: "Yeah. We will." },
      { by: 'b', conf: "I didn't expect {a} to come at me like that. I'm not going to lie, it got in my head.", v: { sharp: ['{a} rattled me. I hate that {a} rattled me.'] } },
    ] },
    { id: 'ec.r2', turns: [
      { by: 'a', say: "Sleep well. If you can.", v: { odd: ['Sweet dreams! Of losing!'] } },
      { by: 'b', conf: "{a} knows exactly how to get under my skin. I can't let it follow me into the Arena.", v: { soft: ['I just want to sleep. Now I can\'t.'] } },
    ] },
    { id: 'ec.r3', turns: [
      { by: 'a', say: "Just so you know, I'm not going home tomorrow." },
      { by: 'b', say: "Neither am I." },
      { by: 'b', conf: "I said it. I didn't feel it.", v: { loud: ['I\'m going to be up all night now!'] } },
    ] },
  ],
  'arena-eve-confront.backfires': [
    { id: 'ec.b1', turns: [
      { by: 'a', say: "You made a big mistake picking me.", v: { loud: ['BIG mistake! Huge!'] } },
      { by: 'b', say: "We'll see who made the mistake.", v: { sharp: ['Did you come out here just to tell me that? Cute.'], dry: ['Thanks for stopping by. Close the door on your way out.'] } },
      { by: 'a', conf: "I went to rattle {b}. {b} didn't even blink. Now I'm the one who can't sleep.", v: { soft: ['That didn\'t go how I wanted at all.'] } },
    ] },
    { id: 'ec.b2', turns: [
      { by: 'a', say: "Hope you're ready for tomorrow." },
      { by: 'b', say: "I've been ready since TJ said my name.", v: { soft: ['I\'m ready. Are you?'] } },
    ] },
    { id: 'ec.b3', turns: [
      { by: 'a', conf: "I tried to get in {b}'s head. Turns out there's nothing in there to get into. Or there's a wall.", v: { sharp: ['{b} is calmer than I thought. Noted.'] } },
    ] },
  ],
  'vet-dismisses.any': [
    { id: 'vd.1', turns: [
      { by: 'a', say: "Rookies. You'll learn. Or you'll go home.", v: { loud: ['ROOKIE! Know your place!'], dry: ['Adorable. Rookies always think they have a plan.'] } },
      { by: 'b', say: "Wow. Thanks for the advice.", v: { soft: ['Okay. That was kind of mean.'] } },
      { by: 'b', conf: "{a} thinks being a vet makes {a} better than me. I'm going to enjoy proving otherwise.", v: { soft: ['I didn\'t come here to be talked down to.'] } },
    ] },
    { id: 'vd.2', turns: [
      { by: 'a', say: "Let the vets handle the strategy, okay? You just do your dailies.", v: { sharp: ['You\'re a number. Be a good number.'] } },
      { by: 'b', say: "I can think for myself.", v: { loud: ['I can THINK, thank you!'] } },
    ] },
    { id: 'vd.3', turns: [
      { by: 'b', conf: "The vets treat us like extras in their show. We're not extras.", v: { sharp: ['Keep underestimating the rookies. Please.'] } },
    ] },
  ],

  // ── fights and the night out ────────────────────────────────────────
  'party.any': [
    { id: 'pt.1', turns: [
      { beat: 'Music is pounding out of the beach bar. {a} is on a table.' },
      { by: 'a', say: "This is the best night of my life!", v: { loud: ['THIS IS THE BEST NIGHT OF MY LIFE!'], sharp: ['Enjoy it, everyone. Tomorrow somebody\'s going home.'], soft: ['I love everybody here. I love all of you.'] } },
      { by: 'b', say: "Get down from there before you fall!", v: { odd: ['Can I come up? I\'m coming up.'] } },
      { by: 'c', conf: "Nights out in this game are where alliances get made and broken. Also where people fall off tables.", v: { soft: ['Everyone was so happy for once. It was really nice.'] } },
    ] },
    { id: 'pt.2', turns: [
      { beat: 'Shots line the bar. TJ is somehow there, dancing badly in the corner.' },
      { by: 'a', say: "To being here! And not being in the Arena!", v: { loud: ['TO NOT BEING IN THE ARENA!'] } },
      { by: 'b', say: "I'll drink to that.", v: { sharp: ['Speak for yourself.'] } },
    ] },
    { id: 'pt.3', turns: [
      { by: 'a', conf: "Party nights are fun until somebody says something they can't take back. And somebody always does.", v: { odd: ['I danced so hard I think I pulled something. Worth it.'] } },
    ] },
  ],
  'fight.any': [
    { id: 'fg.1', turns: [
      { by: 'a', say: "Say it again. Say it to my face.", v: { loud: ['SAY IT AGAIN! SAY IT TO MY FACE!'], sharp: ['Go on. Repeat that. I dare you.'] } },
      { by: 'b', say: "I said what I said.", v: { soft: ['I didn\'t mean it like that!'], loud: ['I SAID WHAT I SAID!'] } },
      { beat: 'People pull them apart before it goes any further.' },
      { by: 'a', conf: "{b} has been asking for that all season. Tonight {b} got it.", when: { early: false }, v: { soft: ['I hate that I lost it. I just couldn\'t hold it in anymore.'] } },
      { by: 'a', conf: "I don't know {b} well yet, but I already know I can't stand {b}.", when: { early: true } },
    ] },
    { id: 'fg.2', turns: [
      { by: 'a', say: "You've been running your mouth all night.", v: { loud: ['YOU\'VE BEEN RUNNING YOUR MOUTH ALL NIGHT!'] } },
      { by: 'b', say: "And you've been drinking all night, so I guess we're even.", v: { sharp: ['And? What are you going to do about it?'] } },
      { by: 'b', conf: "{a} wanted a fight. {a} got one. Now everybody's going to pick a side.", v: { soft: ['I didn\'t want this. I really didn\'t.'] } },
    ] },
    { id: 'fg.3', turns: [
      { by: 'a', say: "Don't walk away from me!" },
      { by: 'b', say: "Watch me.", v: { soft: ['I\'m not doing this with you tonight.'] } },
      { beat: 'Half the bar watches {b} storm off into the night.' },
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
      { beat: '{a} lunges at {b}. Security is between them in seconds, but everybody saw it.' },
      { by: 'b', conf: "Everybody saw what {a} did. Production saw it. TJ is going to see it. That's it for {a}.", v: { loud: ['Everybody SAW it! EVERYBODY!'] } },
    ] },
  ],
  'partner-draw.any': [
    { id: 'pd.d1', turns: [
      { by: 'tj', say: "Today's daily is pairs, people, and the partners are drawn at random! No complaining! Okay, a little complaining." },
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
      { by: 'b', conf: "{a} picked me first. Everybody saw it. That's not just a daily, that's a statement.", v: { soft: ['It felt so nice to be chosen first.'] } },
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
