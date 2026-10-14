// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/story.js — the arcs across episodes, and the running gags
// ══════════════════════════════════════════════════════════════════════
//
// The scenes the director adds from the record (js/ch/story/arcs.js). Every
// one is TRUE when it airs: a payback scene only airs when the one being
// called out really did vote the caller in, in an earlier episode; the beast
// has really won two (or three) eliminations; the underdog really was picked
// last, came last, or choked before winning.
//
// The running gags have three stages: set up once, called back, paid off
// when the house is small. Each is a whole little story about one person.

export default {
  // ── payback: the call-out answers an old vote ───────────────────────
  'arc-payback.any': [
    { id: 'apb.1', turns: [
      { by: 'a', conf: "A few episodes ago, {b} stood up in front of everybody and said my name. I said I'd remember. I remember.", v: { loud: ['{b} voted me in before! You think I FORGOT?!'], soft: ['I tried to let it go. I couldn\'t. {b} voted for me, and it still hurts.'], sharp: ['{b} put me in that Arena once. Tonight {b} finds out what that costs.'], dry: ['{b} voted for me once. I keep very good records.'] } },
    ] },
    { id: 'apb.2', turns: [
      { by: 'a', say: "You remember the last vote you sent me into, {b}?", v: { sharp: ['Remember the last time you said my name, {b}?'] } },
      { by: 'b', say: "That was the game.", v: { soft: ['I know. I\'m sorry.'], sharp: ['So?'] } },
      { by: 'a', say: "Yeah. So is this.", v: { loud: ['Well, THIS is the game too!'] } },
    ] },
    { id: 'apb.3', turns: [
      { by: 'a', conf: "I came back from that Arena knowing exactly who put me there. {b} was one of them. I've been waiting for this.", v: { soft: ['I never wanted revenge. But {b} made it so easy.'], odd: ['I keep a list. {b} is on the list. Today we cross things off the list.'] } },
    ] },
  ],

  // ── the showdown: a feud the viewer followed, ending in a call-out ──
  'arc-showdown.any': [
    { id: 'asd.1', turns: [
      { by: 'a', conf: "{b} and I have been at each other every chance we get. Tonight it stops being talk.", v: { loud: ['This has been building and building! Tonight it ENDS!'], soft: ['I never wanted it to come to this. But it was always going to.'], sharp: ['Every argument with {b} was leading here.'], dry: ['We\'ve skipped the polite part of this relationship entirely.'] } },
      { by: 'b', conf: "Of course it's me. It was always going to be me and {a}.", v: { loud: ['FINALLY! Me and {a}! Let\'s GO!'], soft: ['I knew this was coming. I still feel sick.'], sharp: ['Good. I want {a} across from me.'] } },
    ] },
    { id: 'asd.2', turns: [
      { by: 'a', conf: "Everybody in this house knew {b} and I would end up here. Now we get to settle it.", v: { odd: ['Our feud has a sequel now. It\'s called the Arena.'], sharp: ['No more kitchen arguments. Just the sand.'] } },
      { by: 'b', say: "About time.", v: { loud: ['ABOUT TIME!'], soft: ['I guess this is it.'] } },
    ] },
    { id: 'asd.3', turns: [
      { by: 'b', conf: "All the fights, all the comments, all of it comes down to one game in the Arena. I'm ready.", v: { soft: ['I hope whoever wins, it ends here. I\'m tired.'], loud: ['I\'ve been READY!'] } },
    ] },
  ],

  // ── the beast ───────────────────────────────────────────────────────
  'arc-beast.any': [
    { id: 'abs.1', turns: [
      { by: 'a', say: "{target} is two for two in that Arena now.", v: { loud: ['Two for two! {target} is TWO for TWO!'], dry: ['So {target} has won twice. Great. Very relaxing for the rest of us.'], soft: ['Two wins. I\'m kind of scared of {target} now.'] } },
      { by: 'b', say: "So we stop sending {target} in.", v: { sharp: ['Then we stop feeding {target} people.'], soft: ['Maybe we just leave {target} alone for a while.'] } },
      { by: 'a', say: "Every time we do, somebody else goes home instead.", v: { odd: ['It\'s like throwing people into a blender.'] } },
      { by: 'b', conf: "Everybody keeps voting {target} in and {target} keeps coming back. At some point you have to ask who's really losing.", v: { sharp: ['{target} is the most dangerous person in this game, and the house keeps handing over the weapon.'] } },
    ] },
    { id: 'abs.2', turns: [
      { by: 'a', say: "Did you see {target} in there? That wasn't even close.", v: { loud: ['{target} DESTROYED that person!'] } },
      { by: 'b', say: "I saw. I'm not calling {target} out. Ever.", v: { soft: ['I\'d go home crying.'], sharp: ['Nobody sane calls {target} out now.'] } },
      { by: 'a', conf: "Two eliminations, two wins. {target} isn't a player anymore. {target} is a problem.", v: { odd: ['I\'m going to start being very nice to {target}. Very, very nice.'] } },
    ] },
    { id: 'abs.3', turns: [
      { by: 'b', conf: "{target} has won twice in the Arena. The house is scared, and I don't blame them.", v: { loud: ['TWICE! {target} has won TWICE!'] } },
    ] },
  ],
  'arc-beast-feared.any': [
    { id: 'abf.1', turns: [
      { by: 'a', conf: "Three wins in the Arena. If the house puts {target} in, I'm the kind of person {target} calls out. I'm not voting {target} in. Nobody in my division is.", v: { soft: ['I\'m genuinely scared of {target}. That\'s the truth.'], sharp: ['{target} is untouchable now. Smart people stop trying.'], loud: ['THREE WINS! I\'m not going anywhere near {target}!'] } },
    ] },
    { id: 'abf.2', turns: [
      { by: 'a', conf: "{target} is three for three. At this point voting {target} in is just picking who goes home with extra steps.", v: { odd: ['I\'ve started saying good morning to {target} very respectfully.'] } },
    ] },
    { id: 'abf.3', turns: [
      { by: 'a', conf: "The only way {target} leaves this game is if {target} loses an elimination, and nobody in this house can make that happen.", v: { sharp: ['Somebody has to stop {target}. It won\'t be in the Arena.'] } },
    ] },
  ],
  'arc-giant-falls.any': [
    { id: 'agf.1', turns: [
      { by: 'a', say: "Wait. {gone} lost? {gone} actually lost?", v: { loud: ['{gone} LOST?! Are you KIDDING me?!'], dry: ['Well. I did not have that on my bingo card.'], soft: ['Oh my gosh. I didn\'t think anyone could beat {gone}.'] } },
      { by: 'a', conf: "{b} just beat {gone} in the Arena. The house is never going to look at {b} the same way.", v: { sharp: ['{gone} was the wall. {b} just knocked it down. Now {b} is the wall.'] } },
    ] },
    { id: 'agf.2', turns: [
      { by: 'b', say: "I did it. I beat {gone}.", v: { loud: ['I BEAT {gone}! Me!'], soft: ['I can\'t believe it. I really did it.'] } },
      { by: 'a', conf: "Everybody thought {gone} was going to win this whole thing. {b} sent {gone} home. Everything just changed.", v: { odd: ['The king is dead! Long live... {b}? I need to rethink everything.'] } },
    ] },
    { id: 'agf.3', turns: [
      { by: 'a', conf: "{gone} had won that Arena over and over. One bad night, and {gone} is gone. That's this game.", v: { soft: ['I feel bad for {gone}. Nobody is safe in here. Nobody.'] } },
    ] },
  ],

  // ── the underdog ────────────────────────────────────────────────────
  'arc-underdog.arena': [
    { id: 'aud.a1', turns: [
      { by: 'a', conf: "Not long ago I was the one everybody thought was dead weight. Now I've won an elimination nobody gave me a chance in.", v: { loud: ['Who\'s dead weight NOW?!'], soft: ['I\'m proving it to myself more than anybody.'], sharp: ['Remember when they laughed at me? I do.'] } },
    ] },
    { id: 'aud.a2', turns: [
      { by: 'a', conf: "I've been picked last, I've come last, and I've choked in front of everybody. Tonight none of that mattered.", v: { odd: ['Underdog? More like... a dog that won. I\'m working on it.'] } },
    ] },
    { id: 'aud.a3', turns: [
      { by: 'a', conf: "Everybody had me written off. I kept a list of every person who did. Every single one of them just watched me win.", v: { soft: ['I just wanted one moment where I felt like I belonged here. That was it.'] } },
    ] },
  ],
  'arc-underdog.daily': [
    { id: 'aud.d1', turns: [
      { by: 'a', conf: "I've been at the bottom of these dailies. Today I won one. Nobody saw it coming, including me.", v: { loud: ['I WON A DAILY! ME!'], soft: ['I\'m so proud of myself right now.'], sharp: ['They stopped counting me. Big mistake.'] } },
    ] },
    { id: 'aud.d2', turns: [
      { by: 'a', conf: "Last place, then first place. That's the kind of turnaround that makes people nervous.", v: { odd: ['Last to first! I\'m a comeback story! I\'m going to need a montage.'] } },
    ] },
    { id: 'aud.d3', turns: [
      { by: 'a', conf: "I needed that win more than anybody in this house. Now I'm safe, and everybody who wrote me off has to deal with me.", v: { soft: ['I almost cried when TJ said my name.'] } },
    ] },
  ],

  // ── running gags ────────────────────────────────────────────────────
  // TJ never gets their name right
  'run-name.setup': [
    { id: 'rn.s1', turns: [
      { by: 'tj', say: "Nice work out there, uh... Jordan!" },
      { by: 'a', say: "It's {a}.", v: { loud: ['It\'s {a}, TJ! {a}!'], soft: ['Um, it\'s {a}, actually. That\'s okay!'], dry: ['Close. Different name, but close.'] } },
      { by: 'tj', say: "That's what I said!" },
      { by: 'b', conf: "TJ just called {a} the wrong name to {a}'s face. I'm going to bring this up every day." },
    ] },
    { id: 'rn.s2', turns: [
      { by: 'tj', say: "Taylor! Love the hustle, Taylor!" },
      { by: 'a', conf: "My name is {a}. I've told him. He waved at me. I don't think he heard.", v: { odd: ['Is my name Taylor now? Maybe it is. I\'ll think about it.'] } },
    ] },
  ],
  'run-name.call': [
    { id: 'rn.c1', turns: [
      { by: 'tj', say: "Casey! Big moment, Casey!" },
      { by: 'b', say: "It's {a}, TJ.", v: { odd: ['TJ, it\'s {a}. It\'s been {a} the whole time.'] } },
      { by: 'tj', say: "I know who I'm talking to!" },
      { by: 'a', conf: "He has never once called me the same wrong name twice. I'm starting to answer to all of them.", v: { loud: ['ANOTHER name! He gave me ANOTHER name!'] } },
    ] },
    { id: 'rn.c2', turns: [
      { by: 'tj', say: "Sam! No, wait. Don't tell me. Riley!" },
      { by: 'a', say: "Close enough.", v: { soft: ['That\'s okay, TJ. You\'re doing great.'], sharp: ['Not even close, TJ.'] } },
      { by: 'b', conf: "The best thing in this whole game is TJ never once getting {a}'s name right." },
    ] },
  ],
  'run-name.payoff': [
    { id: 'rn.p1', turns: [
      { by: 'tj', say: "And you, {a}. Wait. That's right, isn't it? {a}! I got it!" },
      { by: 'a', say: "You got it! After all this time!", v: { loud: ['HE GOT IT! EVERYBODY, HE GOT IT!'], soft: ['Oh my gosh. Thank you, TJ. Really.'] } },
      { by: 'b', say: "This is the best day of the whole season.", v: { odd: ['I need a minute. I\'m emotional.'] } },
    ] },
    { id: 'rn.p2', turns: [
      { by: 'tj', say: "Jordan! I mean... {a}! I mean... you know what, you know who you are!" },
      { by: 'a', conf: "He almost got it. Honestly, I'm going to miss being Jordan.", v: { sharp: ['Fine. I\'ll win this as Jordan.'] } },
    ] },
  ],
  // the secret snack stash
  'run-snacks.setup': [
    { id: 'rs.s1', turns: [
      { beat: '{b} opens a drawer in the bunk room and finds it packed with crackers, chocolate and a whole jar of peanut butter.' },
      { by: 'b', say: "{a}. What is this?", v: { loud: ['{a}! WHAT IS THIS?!'] } },
      { by: 'a', say: "Emergency supplies.", v: { odd: ['That\'s my retirement plan.'], soft: ['Please don\'t tell anyone. Please.'] } },
      { by: 'a', conf: "Everybody stresses differently. I stress with snacks." },
    ] },
    { id: 'rs.s2', turns: [
      { by: 'a', conf: "I've got a stash. Nobody knows about it. If I go into the Arena, I'm going in with a full stomach.", v: { loud: ['MY STASH. Nobody touches the stash!'] } },
    ] },
  ],
  'run-snacks.call': [
    { id: 'rs.c1', turns: [
      { by: 'b', say: "Why is there a box of granola bars inside your pillowcase?", v: { dry: ['Your pillow crunches. Explain.'] } },
      { by: 'a', say: "The stash had to move. People were getting close.", v: { odd: ['The stash relocates. It\'s a nomadic stash.'] } },
      { by: 'b', conf: "{a} has more food hidden in this villa than the kitchen does." },
    ] },
    { id: 'rs.c2', turns: [
      { by: 'a', conf: "Somebody found my second stash. They didn't find the third one. There's always a third one.", v: { soft: ['I just like knowing there\'s something there, you know?'] } },
    ] },
  ],
  'run-snacks.payoff': [
    { id: 'rs.p1', turns: [
      { beat: '{a} pulls a bag out from under the mattress and dumps it on the table: chips, candy, crackers, the lot.' },
      { by: 'a', say: "Okay. It's time. The stash belongs to everybody now.", v: { loud: ['THE STASH IS OPEN! EAT, MY FRIENDS!'], soft: ['I want to share it with you guys. You\'re my people.'] } },
      { by: 'b', say: "You've had this the WHOLE time?!", v: { odd: ['Is this a dream? Am I dreaming?'] } },
    ] },
    { id: 'rs.p2', turns: [
      { by: 'a', conf: "I carried that stash through this whole season. Opening it for everybody felt bigger than any daily I won.", v: { odd: ['Best investment I ever made. Peanut butter never lets you down.'] } },
    ] },
  ],
  // the protein shakes
  'run-protein.setup': [
    { id: 'rp.s1', turns: [
      { beat: 'Five in the morning. The blender roars in the kitchen. Half the villa groans.' },
      { by: 'b', say: "It's FIVE A.M., {a}!", v: { soft: ['Please... it\'s so early...'] } },
      { by: 'a', say: "Gains don't sleep.", v: { loud: ['GAINS DON\'T SLEEP!'], dry: ['Muscles have no alarm clock.'] } },
    ] },
    { id: 'rp.s2', turns: [
      { by: 'a', conf: "Two shakes in the morning, one after the daily, one before bed. That's how you win an Arena.", v: { odd: ['I\'m maybe forty percent protein powder at this point.'] } },
    ] },
  ],
  'run-protein.call': [
    { id: 'rp.c1', turns: [
      { by: 'b', say: "There's protein powder in the coffee. Why is there protein powder in the coffee?", v: { loud: ['WHY IS THE COFFEE CHUNKY?!'] } },
      { by: 'a', say: "Efficiency.", v: { soft: ['I thought you\'d like it?'] } },
      { by: 'b', conf: "{a} has turned this entire villa into a gym. I'm scared to open the fridge." },
    ] },
    { id: 'rp.c2', turns: [
      { by: 'a', conf: "They make fun of the shakes. They don't make fun of the shakes when they're across from me in the Arena.", v: { sharp: ['Laugh all you want. Shake-powered muscles hurt the same.'] } },
    ] },
  ],
  'run-protein.payoff': [
    { id: 'rp.p1', turns: [
      { beat: '{a} lines up a row of shakes on the counter, one for everybody left.' },
      { by: 'a', say: "To the final. Drink up.", v: { loud: ['TO THE FINAL! DRINK!'], soft: ['I made one for everybody. You all earned it.'] } },
      { by: 'b', say: "This is disgusting. I love you.", v: { odd: ['It tastes like chalk and friendship.'] } },
    ] },
    { id: 'rp.p2', turns: [
      { by: 'a', conf: "Everybody laughed at the shakes. Now everybody's drinking them before the final. I win.", v: { sharp: ['Told you. Shakes win games.'] } },
    ] },
  ],
  // motivational speeches nobody asked for
  'run-speech.setup': [
    { id: 'rv.s1', turns: [
      { by: 'a', say: "Everybody, gather round! Today, we are warriors!", v: { soft: ['Hey, everyone? I just want to say... you\'re all amazing, and we can do this.'], dry: ['Quick motivational speech. Brace yourselves.'] } },
      { by: 'b', say: "It's breakfast, {a}.", v: { loud: ['IT\'S BREAKFAST, {a}!'] } },
      { by: 'a', say: "Warriors eat breakfast too!" },
    ] },
    { id: 'rv.s2', turns: [
      { by: 'b', conf: "{a} gave a speech this morning. About toast. It was weirdly inspiring." },
    ] },
  ],
  'run-speech.call': [
    { id: 'rv.c1', turns: [
      { by: 'a', say: "Before we go, I just want to say something—", v: { loud: ['BEFORE WE GO—'] } },
      { by: 'b', say: "No speech!", v: { soft: ['Maybe a short one? A really short one?'] } },
      { by: 'a', say: "...Believe in yourselves. That's it. That's the speech." },
    ] },
    { id: 'rv.c2', turns: [
      { by: 'a', conf: "They pretend to hate the speeches. Half of them were nodding today. I saw it.", v: { odd: ['I have forty more speeches written. I\'m pacing myself.'] } },
    ] },
  ],
  'run-speech.payoff': [
    { id: 'rv.p1', turns: [
      { by: 'b', say: "Hey, {a}. Give us one more. For the final.", v: { odd: ['Okay. Fine. Do the speech. Just one.'] } },
      { by: 'a', say: "I thought you'd never ask. Everybody up!", v: { loud: ['FINALLY! EVERYBODY UP!'], soft: ['Really? Okay. Okay, I\'ve got one.'] } },
      { beat: '{a} gives the speech. For once, the whole room claps.' },
    ] },
    { id: 'rv.p2', turns: [
      { by: 'a', conf: "They asked for a speech. They ASKED. I've been waiting all season for that.", v: { soft: ['I got a little emotional. Okay, a lot emotional.'] } },
    ] },
  ],
  // can't walk past a mirror
  'run-mirror.setup': [
    { id: 'rm.s1', turns: [
      { beat: '{a} stops at the hallway mirror for the fifth time in an hour.' },
      { by: 'b', say: "You look the same as you did ten minutes ago.", v: { loud: ['YOU LOOK THE SAME!'] } },
      { by: 'a', say: "Exactly. Great. Just checking.", v: { sharp: ['Some of us have standards.'], odd: ['I\'m saying hi to my best friend.'] } },
    ] },
    { id: 'rm.s2', turns: [
      { by: 'a', conf: "I like to look good on camera. Is that a crime? It's not a crime.", v: { sharp: ['If I\'m going home, I\'m going home looking incredible.'] } },
    ] },
  ],
  'run-mirror.call': [
    { id: 'rm.c1', turns: [
      { by: 'b', say: "Did you just check your hair in the pool?", v: { dry: ['Did you just fix your hair in the reflection of a frying pan?'] } },
      { by: 'a', say: "It's a very reflective pool.", v: { sharp: ['Mind your business.'] } },
      { by: 'b', conf: "{a} can find a mirror anywhere. A spoon. A window. My sunglasses." },
    ] },
    { id: 'rm.c2', turns: [
      { by: 'a', conf: "They tease me about the mirrors. They also ask me how they look before every daily. Interesting.", v: { odd: ['I\'ve named the hallway mirror. It\'s called Gerald.'] } },
    ] },
  ],
  'run-mirror.payoff': [
    { id: 'rm.p1', turns: [
      { by: 'b', say: "Okay, before the final. How do we look?", v: { soft: ['Can you check my hair? You\'re the expert.'] } },
      { by: 'a', say: "Finally, somebody respects the craft.", v: { loud: ['FINALLY! A client!'] } },
      { beat: '{a} fixes everybody\'s hair in the hallway mirror before the final.' },
    ] },
    { id: 'rm.p2', turns: [
      { by: 'a', conf: "All season they made fun of me. Final day, they lined up at the mirror. Who's laughing now?", v: { odd: ['Gerald the mirror is very proud of us all.'] } },
    ] },
  ],
};
