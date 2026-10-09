// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/batch2.js — the voice overhaul, batch 2: the next most-aired scenes
// ══════════════════════════════════════════════════════════════════════
// { entryId: { turnIndex: { tag: line } } }. Same meaning and facts as the line it varies.

export default {
  // vt2.sure (anxious, finally calm)
  'nl4.u3': {
    0: { quiet: "Can I tell you something? I actually feel okay about tonight.", kid: "Guess what? I'm not even a little bit scared about tonight.", theatrical: "Can I tell you something? For the first time in this entire game, I feel good about a vote." },
    3: { warm: "I'm really happy for you. You deserve one night where you're not worried.", dry: "Look at you, relaxed. I'd better write this date down.", kid: "That's awesome. You deserve a good night." },
    7: { quiet: "{a} feels safe. I hope {a} is right.", dry: "{a} finally feels safe, which in this game usually means something's about to go wrong. I hope I'm wrong.", warm: "{a} finally feels safe, and I'd give a lot for {a} to be right about that.", kid: "{a} is happy for once. I really hope nothing bad happens tonight." },
  },
  // vt2.sure (calm planner)
  'nl4.u4': {
    1: { goofy: "You've walked me through it three times. I could draw you a map at this point.", warm: "You've already gone over it three times. It's going to be okay, I promise.", kid: "You've asked me that like three times already." },
    5: { quiet: "Not to me. People don't really tell me their plans.", ditzy: "Not to me, but honestly, people don't tell me stuff. I think they think I'll forget it.", theatrical: "Not to me, but let's be honest, I'm hardly the first stop on the gossip tour." },
  },
  // vt2.sure (loud, overconfident)
  'nl4.u2': {
    1: { quiet: "You're really sure about this.", dry: "You're very confident for somebody who hasn't seen a single ballot.", warm: "You sound really confident. I hope you're right." },
    7: { dry: "Nodding and voting are not the same thing, but sure.", anxious: "Is it, though? Because people nod at me too, and I never know what it means.", quiet: "...I don't think it is, though." },
  },
  // vp2.numbers (tough)
  'nv4.n2': {
    2: { warm: "Just like that? You're not even a little bit sad about it?", dry: "Just like that. Very romantic.", kid: "Wait, just like that? That's it?" },
    8: { tough: "I don't need a reason to like or dislike {target}. I need the votes, and I've got them, so I'm sleeping fine tonight.", competitive: "I counted, I've got the numbers, and that's the whole job tonight. I'm not losing sleep over it.", blunt: "I'm not going to pretend I've got feelings about {target}. I've got the numbers, and that's all I need." },
  },
  // vp2.pair (loud)
  'nv4.p2': {
    1: { quiet: "That seems a little much.", warm: "That's a bit harsh. They're just close.", ditzy: "Wait, they're a team? I thought they were just friends." },
    7: { dry: "{partner} is going to take this really badly, and I mean really badly.", anxious: "{partner} is going to be so upset. I really don't want to be around for that.", kid: "{partner} is going to be really mad at us." },
  },
  // vp2.pair (warm)
  'nv4.p3': {
    2: { dry: "They're sweet together. It's almost annoying.", goofy: "They're so cute together. I've seen them share a water bottle.", kid: "They're really cute together." },
    8: { tough: "Then stop saying it and write it. That's how you get through this.", warm: "Then don't keep saying it, okay? Just write it down, and we'll get through tomorrow together.", dry: "Then stop saying it out loud. The trees have ears out here." },
  },
  // long.crowd.lost.any (loud blame)
  'nl.l2': {
    1: { quiet: "I didn't freeze. I slipped.", anxious: "I didn't freeze, I slipped! I swear I slipped.", kid: "I didn't freeze! I slipped, it wasn't my fault." },
    4: { warm: "Seriously, you're all going to pile on {b} right now? That's not fair.", tough: "Back off {b}. You want to blame somebody, look in a mirror.", earnest: "Come on, that's not fair. {b} tried as hard as any of us." },
    7: { goofy: "I'm upset at everything, including this log. Especially this log.", dry: "I'm upset at everything. It's very efficient.", kid: "I'm just upset. Can I be upset at everything?" },
  },
  // deep.swing (said no)
  'ndp.s2': {
    0: { quiet: "{pitcher} asked for my vote, and I said no. It felt good, for a minute.", theatrical: "{pitcher} asked me for my vote, and I said no. For about five glorious minutes, I was the most powerful person on this island.", kid: "{pitcher} asked me to vote with {pitcher}, and I said no. I felt really grown-up for like five minutes.", nerdy: "{pitcher} asked for my vote, and I said no. Being the deciding vote felt good for about five minutes." },
    1: { quiet: "Now somebody here is angry with me, and I'm not sure I picked right.", theatrical: "And now I've made an enemy, and the worst part is, I don't even know if I chose the right side.", kid: "But now {pitcher} is probably mad at me, and I don't know if I did the right thing.", tough: "So now somebody's angry with me, and that's fine. I'd rather make an enemy than a mistake." },
  },
  // vote.doubt.holds (anxious goes along)
  'ne.h4': {
    3: { tough: "You're not the problem. Don't let anybody make you feel like that.", dry: "You're not the problem. There are at least three bigger problems in this camp.", kid: "You're not the problem. You're nice." },
  },
  // long.crowd.won.any (loud victory)
  'nl.w2': {
    1: { quiet: "We heard you.", warm: "We heard you the first five times, and we love you, but please.", kid: "We know! You said it like five times!" },
    5: { dry: "That's so corny. I love it, but it's so corny.", cruel: "That is the corniest thing I've ever heard.", kid: "That's so cheesy." },
    7: { quiet: "{a} is going to be loud all night, and I don't mind, because nobody goes home.", warm: "{a} is going to be unbearable tonight, and I don't care one bit, because all of us get to stay.", kid: "{a} is going to be so loud tonight, but it's okay, because nobody has to leave." },
  },
  // morning.blindside (schemer questions c)
  'nm.b12': {
    3: { anxious: "No! I swear I found out when everybody else did, please believe me.", tough: "No, I found out when everybody else did. Don't look at me like that.", kid: "No! I promise I didn't know anything!" },
    9: { calm: "I lost my closest ally last night. I'll be sad about it later. Right now I need a new one, and I need one by tonight.", nerdy: "I lost my closest ally last night, so my numbers just changed. I need a new ally by tonight, and I need to pick well.", schemer: "I lost my closest ally last night, and I'm not going to waste the day feeling sorry for myself. I'll have a new one by tonight." },
  },
  // vp2.numbers (warm, fewest hurt)
  'nv4.n3': {
    1: { dry: "Nobody does. That's kind of the whole game.", tough: "Nobody wants to. We still have to.", kid: "Me neither." },
    7: { tough: "You can feel awful and still do it. That's just tonight.", warm: "You're allowed to feel awful and still do it. It doesn't make you a bad person.", dry: "You can feel awful and still do it. Welcome to the game." },
  },
  // vt2.decoy (a is the boot, thinks it's {wrote})
  'nvu.d4': {
    1: { warm: "Hey, you're going to put that fire out if you keep poking it.", goofy: "You're going to kill that fire, and then we'll be cold and sad.", kid: "Stop poking it, you'll put the fire out." },
    2: { quiet: "Good. Something should go out tonight that isn't me.", theatrical: "Good. Let something go out tonight, as long as it isn't me.", kid: "Good. Something can go out tonight, just not me." },
    5: { quiet: "What are you thinking?", warm: "Okay, so what are you thinking? Talk to me.", kid: "What are you going to do?" },
  },
  // vt2.safe (a thinks they make merge)
  'nvt.f2': {
    0: { quiet: "I think I'm going to make the merge.", theatrical: "Can I tell you something? I think I'm going to make the merge. I can actually see it.", kid: "Guess what? I think I'm actually going to make it to the merge!", flirty: "Can I tell you something? I think we're both making the merge, and I'm really happy about it." },
    2: { quiet: "Tonight's {wrote}. After that, nobody has a reason to come for me.", nerdy: "Tonight's {wrote}, and after that, I'm nobody's first target. I've thought it through.", kid: "Tonight's {wrote}, and then nobody's going to want to vote me. I think." },
    4: { quiet: "Thank you for having my back.", warm: "It's the best feeling, and I mean it. Thank you for having my back.", kid: "Thanks for being my friend here. Really." },
    6: { quiet: "I said 'always.' I'm writing {a}'s name anyway.", cruel: "'Always.' It just came out. I'm still writing {a}'s name, and I'll live with it.", anxious: "I said 'always,' and I felt sick saying it. I'm still writing {a}'s name.", emotional: "'Always.' I actually said it to {a}'s face, and I'm still writing the name. I feel horrible." },
  },
  // long.cross.rival.any (loud)
  'ny.r2': {
    0: { quiet: "Enjoy your last few days, {b}.", theatrical: "{b}! Enjoy your final days, darling, and make them count.", goofy: "Hey, {b}! Enjoy your last few days, and bring snacks!", competitive: "Hey, {b}! Enjoy it while it lasts, because we're coming." },
    1: { quiet: "...Excuse me?", tough: "Excuse me? Say that again.", kid: "Hey! That's mean." },
    6: { quiet: "I don't hate {b}. I just really want to beat {b}.", theatrical: "I don't hate {b}. I just want to beat {b}, every single time, in front of everybody.", proud: "I don't hate {b}. I just want {b} to know who's better, every single time." },
  },
  // chal.won (quiet night)
  'nc.w7': {
    1: { kid: "What's the best part about winning?", goofy: "Okay, best part of winning. Go.", food: "Best part of winning? Besides the food?" },
    7: { quiet: "{a} won it for us. I'll remember that.", kid: "{a} is the reason we won. I hope {a} knows I was cheering really loud.", warm: "{a} is the reason we're safe, and I'm going to remember that. I hope {a} remembers I was cheering." },
  },
  // long.conf.bigmove.any (schemer, the aphorism)
  'nk.bm4': {
    0: { schemer: "Everybody's gotten comfortable, and I've been waiting for exactly that.", calm: "Everybody here has gotten comfortable, and I've noticed nobody is watching me.", dry: "Everybody's so comfortable. They've stopped watching me, which is rude, but useful." },
    1: { schemer: "So I'm going to move now, while nobody's looking.", calm: "So this is when I move, and I feel completely ready.", dry: "So I'm going to do something about it, and I'm a little bit excited, honestly." },
  },
  // long.friend.open.any
  'nly.o1': {
    0: { kid: "Can I tell you the real reason I wanted to be here?", theatrical: "Can I tell you the real reason I'm here? The truth, I mean.", quiet: "Can I tell you why I'm really here?" },
    4: { goofy: "And I'm still pretty quiet, but I'm louder than I was. I'm at a medium volume now.", kid: "And I'm still kind of shy, but I'm less shy than on day one." },
    5: { warm: "I've known {a} for weeks, and I feel like I just met {a.obj} for the first time. I really liked it.", dry: "Weeks of knowing {a}, and today I finally met {a.obj}.", kid: "I've known {a} for weeks, but I feel like I just found out who {a} really is." },
  },
  // vt2.decoy (scared friend)
  'nvt.d3': {
    0: { quiet: "If it's me tonight, I'm not mad at you.", theatrical: "If it's me tonight, I need you to know I won't be mad at you. Not even a little.", kid: "If they vote me tonight, I'm not mad at you, okay?" },
    3: { tough: "Then we make it somebody else. Come on.", warm: "Then let's make sure it's somebody else. I'm not losing you tonight.", kid: "Then let's make it somebody else!" },
    6: { quiet: "One friend, one name, three hours. It's not much.", kid: "I have one friend and one plan. I hope that's enough.", theatrical: "One friend, one name, and three hours. It's not an army, but it's not nothing." },
  },
  // psy.temper
  'nps.t1': {
    1: { quiet: "I know people expect me to blow up. I have, back home.", theatrical: "I know exactly what everybody thinks. That I'm a ticking bomb. And honestly, back home, I have exploded more than once.", kid: "I know people think I'm going to get really mad. I get mad a lot at home." },
  },
  // long.friend.drift.any
  'ny.dr1': {
    1: { quiet: "Yeah. I've been busy.", ditzy: "Oh, yeah, I've been, like, busy. With stuff.", kid: "Yeah, I've been busy." },
    4: { tough: "Okay. Sure.", warm: "Okay. Well, I miss you.", dry: "Okay. Very detailed." },
  },
  // vote.swing.no (already safe)
  'nv.n5': {
    3: { quiet: "It doesn't help me.", nerdy: "Because it doesn't help me. My position is the same either way.", kid: "Because it doesn't help me." },
    6: { quiet: "{b} said no. I'll manage without that vote.", tough: "{b} said no, and that's fine. I didn't need it.", anxious: "{b} said no, and now I'm counting again. I think I'm still okay, but my stomach doesn't believe me." },
  },
  // chal.won (exhausted hero)
  'nc.w3': {
    1: { kid: "Are you okay?", goofy: "Blink twice if you're alive.", warm: "Hey, are you alive? Talk to me." },
    5: { quiet: "You were amazing. We don't win without you.", theatrical: "You were incredible out there, honestly. We don't win that without you.", kid: "You were so good out there! We wouldn't have won without you." },
    6: { quiet: "{a} won it for us. Everybody saw it, though, and that worries me.", kid: "{a} won that for us! But now everybody knows how good {a} is.", warm: "{a} won us that challenge, and I'm so proud of {a}. I'm just scared everybody else noticed too." },
  },
  // morning.agreed (gift for lastBoot)
  'nm.a2': {
    1: { kid: "What's that for?", goofy: "Ooh, who's that for?" },
    3: { warm: "You could still give it to {lastBoot.obj}. After the show, I mean.", kid: "You can still give it to {lastBoot.obj} after the show." },
  },
  // chal.regroup (no blame)
  'nbl.r2': {
    0: { quiet: "Sorry. I was the slowest again.", kid: "I'm sorry. I was the slowest again, I know.", anxious: "I'm sorry, I'm so sorry, I know I was the slowest again." },
    1: { warm: "Hey, stop. We're not doing that tonight.", tough: "Stop it. We're not doing that tonight.", bossy: "No. We're not doing that tonight, everybody, listen." },
    6: { quiet: "I expected to get yelled at, and we made a plan instead. I really like these people.", kid: "I thought everybody was going to be mad at me, but they weren't. We made a plan together.", emotional: "I came back ready for everybody to yell at me, and they made a plan with me instead. I nearly cried." },
  },
  // arc.spark.pair (a watches a couple)
  'nl5.p2': {
    0: { kid: "Have you two ever had a fight? Like, even one?", nerdy: "Have you two ever disagreed? About anything?" },
    3: { dry: "That's really sweet. Really, really sweet.", kid: "That's so cute." },
    6: { kid: "If {b} and {c} both make it to the merge, they're going to stick together forever. Somebody has to split them up.", quiet: "If {b} and {c} reach the merge together, nobody splits them. I think it has to happen soon." },
  },
  // vote.swing.no (secretive)
  'nw.n1': {
    3: { quiet: "I don't need you to finish. I'm not voting {target}.", warm: "I'm sorry, but I don't need to hear the rest. I'm not voting {target}.", kid: "No. I'm not voting {target}." },
    5: { quiet: "That's my business.", dry: "That's between me and my piece of paper.", kid: "I'm not telling you." },
    6: { quiet: "{b} won't say, so {b} is with somebody else. I need to find out who.", anxious: "{b} won't tell me, and that means {b} is with somebody else. I'm panicking a little.", kid: "{b} won't tell me who {b} is voting. That means {b} has a different plan. I need to find out." },
  },
  // psy.belong (missing lastBoot)
  'nl4.p1': {
    1: { quiet: "You okay?", warm: "Hey, are you okay? You've been quiet all morning.", kid: "Are you okay?" },
    7: { tough: "You sit with me. That's settled.", warm: "You sit with me. You always can.", kid: "You can sit with me! Every day." },
    8: { quiet: "I didn't think I'd need anybody here, and I do. That scares me.", kid: "I didn't think I'd need friends to win. But I do, and I really miss {lastBoot}.", tough: "I came here to win, not to need people. It turns out I need them, and I hate that." },
  },
  // vote.doubt.breaks
  'ne.b8': {
    0: { quiet: "What do you really think of {wrote}?", kid: "Can I ask you something? Do you like {wrote}?" },
    3: { quiet: "Don't do anything stupid.", warm: "Hey, just don't do anything you'll regret, okay?", kid: "Don't do anything dumb, okay?" },
  },
  // morning.blindside (warm, grieving)
  'nm.b4': {
    1: { quiet: "You okay?", tough: "Hey. You holding up?", kid: "Are you okay?" },
    5: { quiet: "None of us did.", dry: "None of us did. That's kind of the point of a blindside.", kid: "Nobody knew it was going to happen." },
  },
};
