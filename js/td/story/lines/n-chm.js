// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-chm.js — the challenge, brought back to camp
// ══════════════════════════════════════════════════════════════════════
// td/story/chalmoments.js (header there). After the challenge, at camp. {chal} is the challenge.
// two: the moment was between a and b (a did it, b was on the other end); otherwise it was a's own
// moment and b, a teammate, saw it. bLikesA / bHatesA: how b feels about a. Ids: 'ncm.'.

export default {
  // a saved / carried / stood up for b during the challenge
  'chm.saved.any': [
    { id: 'ncm.s4', when: { merged: true, two: false }, turns: [
      { by: 'b', say: "You were unstoppable at {chal}." },
      { by: 'a', say: "I had a good day, that's all." },
      { by: 'b', say: "That's what worries me. A good day like that, everybody notices." },
      { by: 'a', conf: "I won today, and the second I did, I could feel people starting to count. Winning out here is great until it isn't." },
    ] },
    { id: 'ncm.s1', when: { physical: true, two: true }, turns: [
      { beat: "{b} finds {a} rinsing off the mud from {chal} and sits down next to {a.obj}." },
      { by: 'b', say: "I didn't say it out there, but thank you. I was going down, and you didn't let me." },
      { by: 'a', say: "You'd have done the same.", v: { tough: "Don't make it a thing.", warm: "Of course. I wasn't going to leave you." } },
      { by: 'b', say: "I don't know if I would have, honestly. That's why it matters." },
      { by: 'b', conf: "{a} could have let me fail and nobody would have blamed {a.obj}. I'm not going to forget that, not at a vote, not ever." },
    ] },
    { id: 'ncm.s2', when: { two: true, bHatesA: true }, turns: [
      { by: 'b', say: "So, about today." },
      { by: 'a', say: "You're welcome." },
      { by: 'b', say: "I wasn't going to say thank you." },
      { by: 'a', say: "I know. I'm saying it for you." },
      { by: 'b', conf: "The one person here I can't stand pulled me out of trouble at {chal}. Now I owe {a.obj}, and I hate owing {a.obj} anything." },
    ] },
    { id: 'ncm.s3', when: { merged: false, two: false }, turns: [
      { by: 'b', say: "That thing you did out there? Everybody saw it." },
      { by: 'a', say: "It wasn't a big deal." },
      { by: 'b', say: "It was a really big deal. We'd have lost without it." },
      { by: 'b', conf: "Today at {chal}, {a} carried the whole team. That's great for us now. It's also exactly what people remember when they're looking for a threat." },
    ] },
  ],
  // a sabotaged b
  'chm.sabotage.any': [
    { id: 'ncm.b1', when: { two: true }, turns: [
      { beat: "{b} marches straight past the fire and stops in front of {a}." },
      { by: 'b', say: "I saw what you did out there." },
      { by: 'a', say: "I don't know what you're talking about.", v: { schemer: "You'll have to be more specific. I did a lot of things.", cruel: "And? It worked, didn't it?" } },
      { by: 'b', say: "At {chal}. You messed with my stuff on purpose. Everybody saw." },
      { by: 'a', say: "Everybody saw you lose. That's all anybody's going to remember." },
      { by: 'b', conf: "{a} cheated, and {a} doesn't even care that I know. Fine. Now I know exactly what kind of player {a} is." },
    ] },
    { id: 'ncm.b2', when: { two: true }, turns: [
      { by: 'b', say: "Can I ask you something? Did you mess with my gear today?" },
      { by: 'a', say: "Why would I do that?" },
      { by: 'b', say: "That's not a no." },
      { by: 'a', say: "It's a 'why would I do that'." },
      { by: 'b', conf: "{a} didn't deny it. {a} just asked me a question back. That's what guilty people do." },
    ] },
    { id: 'ncm.b3', when: { merged: false, two: false }, turns: [
      { by: 'b', say: "I saw you at {chal}. With the other team's stuff." },
      { by: 'a', say: "You didn't see anything." },
      { by: 'b', say: "I saw enough." },
      { by: 'b', conf: "{a} sabotaged them, and we won because of it. I'm happy we won. I'm just not sure I'm happy about how." },
    ] },
  ],
  // a and b argued, blamed each other
  'chm.clash.any': [
    { id: 'ncm.c1', when: { two: true }, turns: [
      { beat: "{a} and {b} come back from {chal} still arguing, ten steps apart." },
      { by: 'b', say: "If you'd just listened to me, we'd have had it." },
      { by: 'a', say: "If you'd stopped shouting for one second, maybe I could have." },
      { by: 'b', say: "I was shouting because you weren't moving!" },
      { by: 'a', say: "I wasn't moving because you were shouting!" },
      { by: 'b', conf: "Me and {a} have been fighting since the second {chal} started, and I don't think it's stopping when the challenge did." },
    ] },
    { id: 'ncm.c2', when: { two: true, bLikesA: true }, turns: [
      { by: 'b', say: "Hey. About what I said out there." },
      { by: 'a', say: "Yeah. About that." },
      { by: 'b', say: "I was angry. I didn't mean it." },
      { by: 'a', say: "Some of it you did." },
      { by: 'b', say: "...Some of it I did." },
      { by: 'a', conf: "{b} apologised, sort of. We'll be fine. But I'm going to remember what {b} said in the heat of it, because that's usually what people really think." },
    ] },
    { id: 'ncm.c3', when: { merged: false, two: false }, turns: [
      { by: 'b', say: "You were really hard on everybody today." },
      { by: 'a', say: "Somebody had to be. We were falling apart at {chal}." },
      { by: 'b', say: "There's hard, and there's that." },
      { by: 'b', conf: "{a} yelled at half the team today. Some of them are going to remember that a lot longer than they remember the result." },
    ] },
  ],
  // a taunted b / showed off
  'chm.taunt.any': [
    { id: 'ncm.t3', when: { merged: true, two: false }, turns: [
      { by: 'b', say: "You know half the people here want to see you lose now, right?" },
      { by: 'a', say: "They wanted that before {chal}." },
      { by: 'b', say: "Now they want it more." },
      { by: 'a', conf: "I showed off a little. Okay, a lot. But if they're going to come after me anyway, I'd rather they come after me for something." },
    ] },
    { id: 'ncm.t1', when: { two: true }, turns: [
      { by: 'b', say: "That little speech you gave me at {chal}? Real classy." },
      { by: 'a', say: "Hey, if you can't handle a bit of trash talk...", v: { cruel: "It wasn't a speech. It was a fact." } },
      { by: 'b', say: "I can handle it. I'm just keeping a list." },
      { by: 'a', say: "Put me at the top." },
      { by: 'b', say: "Oh, you're already there." },
      { by: 'b', conf: "{a} rubbed it in my face today in front of everybody. One day soon it's going to be my turn, and I'm going to enjoy it a lot." },
    ] },
    { id: 'ncm.t2', when: { merged: false, two: false }, turns: [
      { by: 'b', say: "Did you have to celebrate quite that loudly?" },
      { by: 'a', say: "Yes. Yes, I did." },
      { by: 'b', say: "The other team's going to hate you." },
      { by: 'a', say: "The other team already hated me. Now they hate me with reason." },
      { by: 'b', conf: "{a} is fun to be on a team with. I just don't love the idea of being next to {a} when the other side finally gets the chance to get even." },
    ] },
  ],
  // a panicked; b saw it
  'chm.panic.any': [
    { id: 'ncm.p1', turns: [
      { by: 'b', say: "Hey. Are you okay after today?" },
      { by: 'a', say: "I froze. I totally froze out there.", v: { tough: "I'm fine. I just had a moment.", anxious: "No. I'm so embarrassed. I just completely froze." } },
      { by: 'b', say: "Everybody freezes sometimes." },
      { by: 'a', say: "Not in front of everybody, at {chal}, when it actually mattered." },
      { by: 'b', say: "Then it'll matter less next time." },
      { by: 'a', conf: "I keep replaying it. The moment I just stopped. I don't want that to be the thing people remember about me." },
    ] },
    { id: 'ncm.p2', when: { bHatesA: true }, turns: [
      { by: 'b', say: "Feeling better? You were screaming pretty loud out there." },
      { by: 'a', say: "Very funny." },
      { by: 'b', say: "I'm just saying, the whole island heard you." },
      { by: 'a', conf: "{b} is never going to let me forget today. Fine. I'm never going to let {b} forget it either, the next time {b} slips up." },
    ] },
  ],
  // a wiped out; b saw it
  'chm.wipeout.any': [
    { id: 'ncm.w1', when: { physical: true }, turns: [
      { beat: "Back at camp, {b} is acting out {a}'s fall from {chal} for anyone who'll watch." },
      { by: 'a', say: "Okay, it wasn't that bad." },
      { by: 'b', say: "You did a full flip." },
      { by: 'a', say: "It was a half flip. Maybe three quarters." },
      { by: 'b', say: "You landed on your face." },
      { by: 'a', say: "I landed on my face with style.", v: { anxious: "Please stop telling people, I want to disappear." } },
      { by: 'a', conf: "I'm going to be the person who fell at {chal} for the rest of this game, aren't I." },
    ] },
    { id: 'ncm.w2', when: { physical: true, merged: false, bLikesA: true }, turns: [
      { by: 'b', say: "How's the arm?" },
      { by: 'a', say: "It's fine. My pride's the bit that's broken." },
      { by: 'b', say: "Your pride will heal." },
      { by: 'a', say: "Not if everybody keeps doing the impression." },
      { by: 'b', conf: "{a} took a really bad fall today, and the first thing {a} asked when {a} got up was if the team was still in it. That's who I want on my side." },
    ] },
  ],
  // a quit, or almost
  'chm.quit.any': [
    { id: 'ncm.q3', when: { merged: true }, turns: [
      { by: 'b', say: "You stepped down pretty early today." },
      { by: 'a', say: "I knew I wasn't winning that one. Why burn myself out?" },
      { by: 'b', say: "Some people are going to say that's weak." },
      { by: 'a', say: "Some people are going to be on the jury wishing they'd been that smart." },
      { by: 'b', conf: "{a} gave up at {chal} and called it strategy. Maybe it was. It still looked like giving up." },
    ] },
    { id: 'ncm.q1', when: { merged: false }, turns: [
      { by: 'b', say: "Can I ask why you stopped?" },
      { by: 'a', say: "I was done. I didn't have anything left." },
      { by: 'b', say: "We were so close." },
      { by: 'a', say: "I know we were. You don't think I know that?" },
      { by: 'b', conf: "{a} gave up at {chal}. Maybe {a} really didn't have anything left. But people here are going to remember that the next time they need a reason." },
    ] },
    { id: 'ncm.q2', when: { bLikesA: true }, turns: [
      { by: 'a', say: "Go on, say it. I quit." },
      { by: 'b', say: "I wasn't going to say anything." },
      { by: 'a', say: "Everybody else is going to." },
      { by: 'b', say: "Then let them. You're more than one bad challenge." },
      { by: 'a', conf: "I quit at {chal}, and the one person I thought would be angry with me is the only one being nice about it. That's almost worse." },
    ] },
  ],
  // a got hurt
  'chm.hurt.any': [
    { id: 'ncm.h1', when: { physical: true }, turns: [
      { beat: "{b} wraps a strip of cloth around {a}'s ankle by the fire." },
      { by: 'a', say: "Ow. Ow. Okay, that's tight." },
      { by: 'b', say: "It's supposed to be tight. You're lucky it's not broken." },
      { by: 'a', say: "Tell that to {chal}." },
      { by: 'b', say: "I'll be sure to pass the message along." },
      { by: 'a', conf: "I'm hurt, and everybody knows I'm hurt, which means everybody knows I'm weaker in the next challenge. That scares me more than the ankle does." },
    ] },
  ],
  // a and b had a moment
  'chm.spark.any': [
    { id: 'ncm.r3', when: { two: true }, turns: [
      { by: 'b', say: "So that was interesting today." },
      { by: 'a', say: "Which part?" },
      { by: 'b', say: "The part where you kept looking at me instead of doing the challenge." },
      { by: 'a', say: "I was looking at the challenge. You were just standing in front of it." },
      { by: 'b', say: "Sure." },
      { by: 'a', conf: "Okay, I was looking at {b}. Everybody noticed. I've been hearing about it all afternoon." },
    ] },
    { id: 'ncm.r1', when: { two: true }, turns: [
      { beat: "Everybody's drying off after {chal}. {a} and {b} keep ending up next to each other." },
      { by: 'b', say: "So... that was a thing that happened out there." },
      { by: 'a', say: "What thing?", v: { flirty: "Which thing? The part where you couldn't take your eyes off me?" } },
      { by: 'b', say: "You know what thing." },
      { by: 'a', say: "Yeah. I know what thing." },
      { by: 'c', opt: true, say: "Are you two going to share the towel, or should I get a second one?" },
      { by: 'b', conf: "We were supposed to be focused on {chal}. I was not focused on {chal}." },
    ] },
    { id: 'ncm.r2', when: { physical: true, two: true }, turns: [
      { by: 'b', say: "You held my hand out there." },
      { by: 'a', say: "You were about to fall." },
      { by: 'b', say: "And after I didn't fall?" },
      { by: 'a', say: "...I didn't let go, did I." },
      { by: 'a', conf: "Okay, so maybe something happened at {chal}. And maybe everybody saw it. And maybe I don't mind." },
    ] },
  ],
  // a and b made a pact during the challenge
  'chm.pact.any': [
    { id: 'ncm.k1', when: { two: true }, turns: [
      { by: 'a', say: "What we said out there, about sticking together. Did you mean it?" },
      { by: 'b', say: "I don't say things I don't mean. Did you?" },
      { by: 'a', say: "I meant it then. I'm checking I still mean it now that we're not hanging off a cliff." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "I still mean it." },
      { by: 'b', conf: "Something happens when you go through {chal} with somebody. It's not strategy. It's just that I know now that {a} won't let go." },
    ] },
  ],
  // a came back from a bad start
  'chm.comeback.any': [
    { id: 'ncm.m1', turns: [
      { by: 'b', say: "Where did that come from today?" },
      { by: 'a', say: "Honestly? I don't know. I was about to give up, and then I just didn't." },
      { by: 'b', say: "Everybody wrote you off in the first half." },
      { by: 'a', say: "I know. I could hear them." },
      { by: 'a', conf: "I spent the start of {chal} being the worst one out there and the end of it being the best. I want everybody to remember the end." },
    ] },
  ],
  // a was funny at the challenge
  'chm.comedy.any': [
    { id: 'ncm.f1', turns: [
      { by: 'b', say: "I'm still laughing about what you did at {chal}." },
      { by: 'a', say: "Which part?" },
      { by: 'b', say: "All of it. Every part. The host's face." },
      { by: 'a', say: "I regret nothing." },
      { by: 'b', conf: "We lost. Or won. Honestly, I don't even remember. I just remember {a}, and I'll be laughing about it for days." },
    ] },
  ],
  // a and b connected
  'chm.bond.any': [
    { id: 'ncm.o1', when: { two: true }, turns: [
      { by: 'a', say: "We make a pretty good team, you know." },
      { by: 'b', say: "Who'd have thought?" },
      { by: 'a', say: "Not me. Not this morning." },
      { by: 'b', say: "Then let's not waste it." },
      { by: 'b', conf: "{a} and I barely spoke before {chal}. Now I'd want {a} next to me on any challenge, and maybe on more than challenges." },
    ] },
  ],
  // a betrayed b during the challenge
  'chm.betray.any': [
    { id: 'ncm.x1', when: { two: true }, turns: [
      { beat: "{b} waits until the others have gone, then turns on {a}." },
      { by: 'b', say: "You left me out there. You actually left me." },
      { by: 'a', say: "I had a choice to make." },
      { by: 'b', say: "You had a choice, and you chose you." },
      { by: 'a', say: "Wouldn't you?", v: { warm: "I'm sorry. I really am. I panicked.", cruel: "Yeah. And I'd do it again." } },
      { by: 'b', conf: "{a} ditched me the second it got hard at {chal}. I'm never trusting {a} with anything again, and I'm going to make sure everybody here knows why." },
    ] },
  ],
};
