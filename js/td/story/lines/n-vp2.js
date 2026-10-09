// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-vp2.js — the plan, as one whole conversation
// ══════════════════════════════════════════════════════════════════════
//
// director.js planTalk tries these first: a scene written start to finish, where every line answers
// the one before (the user, reading a played episode: "they're not talking to each other", "it's cut
// short", "there's no setup"). a runs the plan, b is with a, c (and d) are there in a group.
// Facts: markMe / markB (coming: {mark} is a, or is b), told (somebody warned a today: {teller}),
// sparkSeen (a saw what made {target} a target this morning), tally: close / tight / all / enough,
// alt ({alt}, the name b would rather write), shaky ({shaky}, the plan's least sure vote, not here),
// cover ({cover}, the name to tell camp), others ({others}, the rest writing it).
// Ids: 'nvq.'.

export default {
  // ── {target}'s side is coming for {mark} ──
  'vp2.coming': [
    { id: 'nvq.c1', when: { markMe: true, told: true }, turns: [
      { beat: "{a} drags {b} down to the water on the excuse of washing the pots." },
      { by: 'b', say: "These are already clean." },
      { by: 'a', say: "I know they're clean. {teller} came and found me this afternoon, and {target} is getting votes on me." },
      { by: 'b', say: "On you? Since when?", v: { anxious: "On you? Oh no. Since when?", dry: "Well, that explains why {target} was so friendly at lunch." } },
      { by: 'a', say: "Since this morning, apparently. {target} has been going round everybody, one at a time." },
      { by: 'b', say: "Do you believe {teller}? People say all kinds of stuff before a vote." },
      { by: 'a', say: "{teller} had nothing to gain by telling me, and everything to lose if {target} finds out. So yeah, I believe it." },
      { by: 'b', say: "Okay. So what do you want to do?" },
      { by: 'a', say: "I want {target} to walk in there tonight thinking it's me, and walk out with their bag.", v: { warm: "I don't even want to do this. But if it's me or {target}, it's not going to be me.", tough: "I want {target} gone. Tonight." } },
      { by: 'b', say: "How many have we got?" },
      { by: 'a', say: "With you, {votes}. They've got {them}, maybe, if nobody changes their mind.", when: { tally: 'close' } },
      { by: 'b', say: "That's not much of a cushion." },
      { by: 'a', say: "Then we don't need a cushion, we need nobody to blink." },
      { by: 'b', conf: "{a} is scared. You can hear it under the plan. And scared people either play brilliantly or fall apart, so tonight I'm finding out which one {a} is." },
    ] },
    { id: 'nvq.c2', when: { markMe: true, told: false }, turns: [
      { by: 'a', say: "Can you come here a second? And try to look like we're talking about firewood." },
      { by: 'b', say: "We are talking about firewood. Kind of." },
      { by: 'a', say: "{target} has been asking people about me. Who I'm close to, what I've said about the vote." },
      { by: 'b', say: "Maybe {target} is just nosy.", v: { calm: "Asking isn't the same as voting." } },
      { by: 'a', say: "Nobody's that nosy the day of a vote. {target} is counting, and I'm what's being counted." },
      { by: 'b', say: "So you want to go first." },
      { by: 'a', say: "I want to go first. {target}, tonight, before {target} gets the numbers together." },
      { by: 'b', say: "And if you're wrong about {target}?" },
      { by: 'a', say: "Then I've voted out someone who was asking a lot of questions about me. I can live with that." },
      { by: 'b', say: "Okay. I'm with you." },
      { by: 'a', conf: "I don't have proof. I have a feeling, and the way {target} looked at me at breakfast. Out here, that's usually all you get." },
    ] },
    { id: 'nvq.c3', when: { markB: true }, turns: [
      { beat: "{a} waits until the others have gone to get water, then sits down right next to {b}." },
      { by: 'a', say: "I need to tell you something, and I need you not to freak out." },
      { by: 'b', say: "That's a terrible way to start a sentence.", v: { anxious: "Oh no. Oh no, what happened?", tough: "Just say it." } },
      { by: 'a', say: "{target}'s side is coming for you tonight." },
      { by: 'b', say: "For me? I haven't done anything to {target}." },
      { by: 'a', say: "You haven't done anything, you're just with me, and that's enough for them." },
      { by: 'b', say: "So what, I just sit there and wait for it?" },
      { by: 'a', say: "No, we go after {target} first. It's {votes} of us if we hold, and they've got {them}." },
      { by: 'b', say: "And you're sure about that number?" },
      { by: 'a', say: "I'm sure about everyone except {shaky}. I'll talk to {shaky} before dinner.", when: { shaky: true } },
      { by: 'b', say: "Thank you, seriously, for telling me." },
      { by: 'b', conf: "{a} could've let me walk in there blind. Instead {a} told me, and now I owe {a} my whole game. I don't know how I feel about owing anybody that much." },
    ] },
    { id: 'nvq.c4', when: { markMe: false, markB: false }, turns: [
      { by: 'a', say: "Have you heard what {target}'s group is planning?" },
      { by: 'b', say: "No? Should I have?" },
      { by: 'a', say: "They're writing {mark} tonight. All of them." },
      { by: 'b', say: "{mark}? But {mark} is with us." },
      { by: 'a', say: "That's exactly why. Take {mark} out and we're one short for the rest of the game." },
      { by: 'b', say: "So we save {mark}." },
      { by: 'a', say: "We save {mark} by sending {target} home first. If {target} goes, their whole plan goes with them." },
      { by: 'b', say: "Does {mark} know?" },
      { by: 'a', say: "Not yet, and I'd like to keep it that way until the votes are read. {mark} can't act normal to save their life." },
      { by: 'b', say: "That's fair, actually.", v: { goofy: "That's so true. {mark} once told me a secret by accident while trying to keep a different secret." } },
      { by: 'b', conf: "{a} is protecting {mark} without {mark} even knowing. That's either really sweet or really calculated, and with {a}, it's usually both." },
    ] },
    { id: 'nvq.c5', when: { third: true, markMe: true }, turns: [
      { beat: "{a} rounds up {b} and {c} behind the {quarters}, one at a time, so nobody sees them leave together." },
      { by: 'c', say: "This had better be good, I left my lunch." },
      { by: 'a', say: "{target} is putting my name out there tonight." },
      { by: 'c', say: "Wait, really?", v: { dry: "Of course {target} is. {target} has been circling you for days." } },
      { by: 'a', say: "Really. So I need to know right now if you're with me or not." },
      { by: 'b', say: "I'm with you, you know I'm with you." },
      { by: 'c', say: "I'm with you too. I just want to know why {target} would come for you." },
      { by: 'a', say: "Because I'm with you two, and three of us voting together is the biggest group here. {target} wants to break us up before we break them up." },
      { by: 'c', say: "Then we break them up first." },
      { by: 'a', say: "That's {votes}, if {others} stay on it. Nobody talks about this at dinner.", when: { others: true } },
      { by: 'c', conf: "I came here for my lunch and left with a whole war. That's honestly a pretty normal afternoon out here." },
    ] },
  ],

  // ── a grudge ──
  'vp2.grudge': [
    { id: 'nvq.g1', turns: [
      { beat: "{a} is splitting wood a lot harder than the wood deserves. {b} watches for a while before coming over." },
      { by: 'b', say: "What did that log ever do to you?" },
      { by: 'a', say: "The log's fine. It's {target}." },
      { by: 'b', say: "What happened now?" },
      { by: 'a', say: "Nothing new, that's the problem. It's every day. The comments, the eye rolls, the way {target} talks to me like I'm stupid.", v: { tough: "Same thing as always. {target} keeps pushing me, and I'm done being pushed.", warm: "I keep trying with {target}, and {target} keeps making it so hard." } },
      { by: 'b', say: "So you want {target} gone because you can't stand {target}." },
      { by: 'a', say: "I want {target} gone because {target} can't stand me either. One of us goes eventually. I'd rather it was tonight, and I'd rather it was {target}." },
      { by: 'b', say: "I mean, that's honest." },
      { by: 'a', say: "Are you in?" },
      { by: 'b', say: "I'd rather vote {alt}, if I'm honest.", when: { alt: true } },
      { by: 'a', say: "{alt} can wait. I can't spend another day biting my tongue.", when: { alt: true } },
      { by: 'a', say: "And after this morning, if {target} really found something out there, I'd rather not wait around to find out what.", when: { sparkKind: 'idol' } },
      { by: 'b', say: "Fine. I'm in." },
      { by: 'b', conf: "This isn't strategy. This is {a} being sick of {target}. But {a} has the votes, and I'm not about to stand between {a} and that axe." },
    ] },
    { id: 'nvq.g2', turns: [
      { by: 'b', say: "You've been quiet since lunch. That's never good with you." },
      { by: 'a', say: "Did you hear what {target} said to me?" },
      { by: 'b', say: "I heard part of it." },
      { by: 'a', say: "In front of everybody. Like it was funny." },
      { by: 'b', say: "It wasn't funny." },
      { by: 'a', say: "No, it wasn't. So tonight I'm writing {target}, and I'd really like you to write it too." },
      { by: 'b', say: "Is that the only reason?" },
      { by: 'a', say: "It's the reason I care about. If you want a strategy one, {target} doesn't trust either of us, so we'd be next anyway.", v: { schemer: "There's a strategy reason too. {target} was never going to take either of us to the end. So we lose nothing." } },
      { by: 'b', say: "Okay, {target}. Have we got the numbers?" },
      { by: 'a', say: "{others} are on it too. That's {votes}.", when: { others: true } },
      { by: 'a', conf: "Everyone thinks I'm being petty. Maybe I am. But being petty and being right aren't the opposite of each other." },
    ] },
  ],

  // ── a pair ──
  'vp2.pair': [
    { id: 'nvq.p1', turns: [
      { beat: "{target} and {partner} walk past, laughing, and disappear down the beach together. {a} waits until they're gone." },
      { by: 'a', say: "Have you ever seen one of them without the other?" },
      { by: 'b', say: "Not since about day two." },
      { by: 'a', say: "Then you know what happens at the merge. Two votes that never split." },
      { by: 'b', say: "It's kind of cute, though." },
      { by: 'a', say: "It's very cute, and it's also going to beat us, so tonight we split them up." },
      { by: 'b', say: "Which one?" },
      { by: 'a', say: "{target}. {partner} won't know what to do without {target}, and the other way round, I'm not so sure." },
      { by: 'b', say: "{partner} is going to be devastated." },
      { by: 'a', say: "{partner} is going to be devastated and on their own, and somebody on their own needs friends. Guess who'll be right there." },
      { by: 'b', conf: "{a} already has a plan for {partner} after {target} goes. Sometimes I forget how far ahead {a} thinks, and then {a} says something like that." },
    ] },
  ],

  // ── a threat ──
  'vp2.threat': [
    { id: 'nvq.t1', when: { sparkSeen: true }, turns: [
      { by: 'a', say: "Did you see {target} this morning? Chores done before anybody was up, and then helping everybody else with theirs." },
      { by: 'b', say: "{target} is just like that." },
      { by: 'a', say: "Exactly. {target} is just like that, and everybody loves it, and that's how {target} wins this game." },
      { by: 'b', say: "You want to vote out the nicest person here." },
      { by: 'a', say: "I want to vote out the person who beats all of us at the end, and right now that's {target}." },
      { by: 'b', say: "That's going to look really bad." },
      { by: 'a', say: "For a day. Then everybody's going to be glad it wasn't them sitting next to {target} at the final." },
      { by: 'b', say: "I'd rather do {alt}.", when: { alt: true } },
      { by: 'a', say: "Everybody would rather do {alt}. That's why {alt} isn't dangerous.", when: { alt: true } },
      { by: 'b', say: "Fine. It's {target}." },
      { by: 'b', conf: "I like {target}, I really do. I just like being in this game a little bit more." },
    ] },
    { id: 'nvq.t2', turns: [
      { by: 'b', say: "Okay, you've got that look. Who is it?" },
      { by: 'a', say: "{target}." },
      { by: 'b', say: "{target}? {target} hasn't done anything." },
      { by: 'a', say: "{target} hasn't had to. Everybody already likes {target}. {target} wins challenges and never complains and never gets a single vote." },
      { by: 'b', say: "So you want to get rid of someone for being too good." },
      { by: 'a', say: "I want to get rid of someone before it's too late to get rid of them. Give it another week and nobody will dare write that name." },
      { by: 'b', say: "And if it blows up on us?" },
      { by: 'a', say: "Then it blows up on us, and at least we tried. If we don't do it, it's definitely blowing up on us at the end." },
      { by: 'b', say: "Okay. How many have we got?" },
      { by: 'a', say: "It's tight. Everybody else is pushing {other}, so we need one more person before tonight.", when: { tally: 'tight', other: true } },
      { by: 'a', conf: "I don't want to vote out the strong player either. I just know I'll be the one sitting next to them at the end, losing." },
    ] },
  ],

  // ── {target} is with {theirs} ──
  'vp2.group': [
    { id: 'nvq.r1', turns: [
      { beat: "Across camp, {target} is sitting with the others from {theirs}, heads close together. {a} nods toward them." },
      { by: 'a', say: "Look at them. They're doing it again." },
      { by: 'b', say: "Doing what?" },
      { by: 'a', say: "Planning. {theirs} has been planning since the second we got here, and every time we walk past, they go quiet." },
      { by: 'b', say: "So you want to go after {target}." },
      { by: 'a', say: "{target} is the glue. The others listen to {target}. Take {target} out and they start arguing with each other by tomorrow." },
      { by: 'b', say: "You've really thought about this." },
      { by: 'a', say: "I've had a lot of time. Nobody from {theirs} talks to me.", when: { fromTarget: false } },
      { by: 'a', say: "And the worst part? {target} is the one who warned me about {warnedAbout} this afternoon.", when: { fromTarget: true } },
      { by: 'b', say: "Wait, {target} helped you, and you're voting {target} out?", when: { fromTarget: true } },
      { by: 'a', say: "{target} helped me because {target} wants something from me. I'm not going to forget it, I'm just not going to let it decide tonight.", when: { fromTarget: true } },
      { by: 'b', say: "Do we have enough?" },
      { by: 'a', say: "It's close. They've got {them} on {other}, and we've got {votes} on {target}.", when: { tally: 'close', other: true, otherMe: false } },
      { by: 'a', say: "It's close. They've got {them} on me, and we've got {votes} on {target}.", when: { tally: ['close', 'tight'], otherMe: true } },
      { by: 'b', conf: "{a} is right about {theirs}. They're a wall. But walls don't fall because you push them once, and I'm worried what happens when this one pushes back." },
    ] },
  ],

  // ── nobody is close to {target} ──
  'vp2.outsider': [
    { id: 'nvq.o1', turns: [
      { by: 'b', say: "So, tonight. Who are you thinking?" },
      { by: 'a', say: "Honestly? {target}." },
      { by: 'b', say: "Why {target}? {target} doesn't bother anybody." },
      { by: 'a', say: "That's the thing. {target} doesn't bother anybody, and nobody bothers with {target}. If {target} goes, nobody's angry, nobody's out for revenge." },
      { by: 'b', say: "That feels kind of cold." },
      { by: 'a', say: "It is kind of cold. But if we vote out somebody with friends, those friends come for us next week." },
      { by: 'b', say: "I'd still rather it was {alt}.", when: { alt: true } },
      { by: 'a', say: "And {alt} has friends who'd make our lives miserable. {target} doesn't.", when: { alt: true } },
      { by: 'b', say: "Okay, I get it. I just don't love it." },
      { by: 'a', say: "Nobody loves it. That's why it's the safe one." },
      { by: 'b', conf: "We're voting out {target} because nobody will miss {target}. I keep thinking about how I'd feel if somebody said that about me." },
    ] },
  ],

  // ── {target} cost them the challenge ──
  'vp2.sank': [
    { id: 'nvq.s1', turns: [
      { beat: "On the walk back from the challenge, {a} hangs back until {a} is level with {b}." },
      { by: 'a', say: "We can't keep losing like that." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "And we both know why we lost." },
      { by: 'b', say: "{target} had a really bad day.", v: { blunt: "{target} fell apart.", warm: "{target} tried, though. You could see {target} trying." } },
      { by: 'a', say: "{target} has had a really bad day at every challenge. At some point it's not a bad day, it's just who's on the team." },
      { by: 'b', say: "So it's {target} tonight." },
      { by: 'a', say: "It's {target}, unless you've got a better idea." },
      { by: 'b', say: "I thought about {alt}, but {alt} actually helped today.", when: { alt: true } },
      { by: 'a', say: "Then it's {target}. We'll tell everybody it's about the team, because it is." },
      { by: 'b', conf: "Nobody wants to be the one who says it out loud, but we're all thinking it, and {a} just happens to be the one who doesn't mind saying it." },
    ] },
  ],

  // ── {target} has an idol ──
  'vp2.idol': [
    { id: 'nvq.i1', when: { sparkSeen: true }, turns: [
      { by: 'a', say: "You saw {target} come back from the trees this morning, right? Twice." },
      { by: 'b', say: "I saw. I figured {target} had a stomach ache." },
      { by: 'a', say: "{target} was smiling. Nobody smiles like that after a stomach ache." },
      { by: 'b', say: "So you think {target} found something." },
      { by: 'a', say: "I think {target} found an idol, and I think if we wait, {target} plays it on the night one of us goes home." },
      { by: 'b', say: "Then we can't just write {target}. If it comes out, we waste everything." },
      { by: 'a', say: "So we split. Most of us on {target}, a couple of us on {cover}, just in case.", when: { cover: true } },
      { by: 'b', say: "And if there's no idol?" },
      { by: 'a', say: "Then {target} goes home tonight and we were just careful. I can live with careful." },
      { by: 'b', conf: "{a} has been watching {target} since sunrise. I didn't even notice {target} was gone. Remind me never to try to hide anything from {a}." },
    ] },
  ],

  // ── the only name with the numbers ──
  'vp2.numbers': [
    { id: 'nvq.n1', turns: [
      { by: 'b', say: "Okay, I've talked to literally everyone. Have you?" },
      { by: 'a', say: "Most of them. Everybody gives a different name, except one." },
      { by: 'b', say: "{target}." },
      { by: 'a', say: "{target}. It's the only name nobody argues with." },
      { by: 'b', say: "Is that a good reason to vote somebody out?" },
      { by: 'a', say: "It's the reason that doesn't start a war. Any other name, somebody walks away angry and comes for us next week." },
      { by: 'b', say: "I wanted {alt}, honestly.", when: { alt: true } },
      { by: 'a', say: "You'll get {alt}. Not tonight, but you'll get {alt}.", when: { alt: true } },
      { by: 'b', say: "Okay. It's {votes} on {target}, then?" },
      { by: 'a', say: "{votes}, if nobody gets cold feet." },
      { by: 'a', conf: "I don't have anything against {target}. That's the honest truth. {target} just happens to be the name that keeps everybody else calm." },
    ] },
  ],
};
