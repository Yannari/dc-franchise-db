// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/house.js — life in the villa: comedy, drama, romance
// ══════════════════════════════════════════════════════════════════════
//
// The house events (js/ch/events.js) as scripts. Each event decided its
// ending before a word was picked; roles.js says who is a, b, c. The lines
// say what the event did: a prank that was laughed off reads differently from
// one that started a war, and the war is what the next prank answers.
//
// Voices: the key turns carry variants by family (sharp, dry, loud, soft, odd)
// and by the leading tags, as lists; the voice overlay adds more by batch.
// No invented past: a grudge line names the thing the scene has, or says
// something always true ("you always do this" never airs on day one: early).

export default {
  // ── COMEDY ──────────────────────────────────────────────────────────
  'prank.laughs': [
    { id: 'pr.l1', turns: [
      { beat: '{b} opens a drawer and finds every one of {b.posAdj} socks tied together in one long rope.' },
      { by: 'b', say: '{a}!', v: { loud: ['{a}! I know this was you!'], dry: ['{a}. Really. A sock rope. Very mature.'], soft: ['Oh my gosh, {a}, how long did this take you?'] } },
      { by: 'a', say: "I have no idea what you're talking about.", v: { odd: ['Socks? What socks? I\'ve never seen a sock in my life.'], sharp: ['Prove it.'] } },
      { by: 'b', say: "You're dead. You know that? You're so dead.", v: { soft: ['Okay, it\'s a little funny. Only a little.'] } },
      { by: 'a', conf: "{b} laughed. Good. If you can't take a joke in this house, you're not going to make it.", v: { odd: ['Best twenty minutes I\'ve spent in this villa. Worth every knot.'], soft: ['I wanted {b} to laugh. Everybody here needs to laugh more.'] } },
    ] },
    { id: 'pr.l2', turns: [
      { beat: "{b} sits down on the couch and it lets out a long, loud whoopee cushion noise. The whole room loses it." },
      { by: 'b', say: 'Oh, real classy. Who did this?', v: { loud: ['WHO DID THIS?!'], dry: ['Wow. Peak comedy. Who\'s responsible?'] } },
      { by: 'a', say: "I'm sorry, I'm sorry, I had to.", v: { odd: ['I bought it at the airport. I\'ve been waiting three days.'] } },
      { by: 'b', say: "Okay, that was actually funny. I'm getting you back.", v: { sharp: ['Fine. It was funny. Sleep with one eye open.'] } },
    ] },
    { id: 'pr.l3', turns: [
      { beat: "{b} comes out of the bathroom with toothpaste where the face cream should have been." },
      { by: 'a', say: "Hey, your skin looks really minty today.", v: { odd: ['Wow, you smell like a breath mint. A big one.'], sharp: ['New skincare routine? Bold.'] } },
      { by: 'b', say: "You switched them? Oh my God, you switched them!", v: { loud: ['YOU SWITCHED THEM!'] } },
      { by: 'b', conf: "{a} got me good. It's fine. It's the kind of thing that makes this place feel less like a prison.", v: { soft: ['Honestly I needed the laugh. This house gets so heavy.'] } },
    ] },
  ],
  'prank.war': [
    { id: 'pr.w1', turns: [
      { beat: '{b} finds {b.posAdj} mattress dragged out onto the pool deck.' },
      { by: 'b', say: "Who thought this was funny?", v: { loud: ['Who did this?! I swear to God!'], sharp: ['Somebody in this house is very bored and about to be very sorry.'] } },
      { by: 'a', say: "Relax, it's a joke.", v: { odd: ['It\'s an outdoor bed now. It\'s a vibe.'] } },
      { by: 'b', say: "It's not a joke when I have to sleep on it.", v: { soft: ['I\'m so tired, {a}. I really didn\'t need this today.'] } },
      { by: 'b', conf: "I'm done laughing. If {a} wants a war, I'll give {a.obj} one.", v: { sharp: ['{a} picked the wrong person to play with.'], loud: ['Oh, it\'s on now. It\'s so on.'] } },
    ] },
    { id: 'pr.w2', turns: [
      { beat: 'Every one of {b}\'s shoes is sitting at the bottom of the pool.' },
      { by: 'b', say: "Are you kidding me right now?", v: { loud: ['ARE YOU KIDDING ME?!'] } },
      { by: 'a', say: "They looked thirsty.", v: { sharp: ['You should keep a closer eye on your things.'] } },
      { by: 'b', say: "Keep laughing, {a}. I'll remember this.", v: { soft: ['That was my only pair of good sneakers, {a}.'] } },
    ] },
    { id: 'pr.w3', turns: [
      { beat: '{b} gets back from the shower to find the bed short-sheeted and covered in salt.' },
      { by: 'b', say: "This is the second time. The second time!", when: { early: false }, v: { loud: ['That\'s TWICE now! Twice!'] } },
      { by: 'b', say: "Seriously? Salt? In my bed?", when: { early: true } },
      { by: 'a', say: "You started it.", v: { odd: ['I have no idea what you\'re talking about.'] } },
      { by: 'b', conf: "I don't do pranks. I do revenge. There's a difference.", v: { soft: ['I just wanted to go to sleep. Now I want revenge.'] } },
    ] },
  ],
  'kitchen-disaster.saved': [
    { id: 'kd.s1', turns: [
      { beat: 'Smoke pours out of the kitchen. {a} is waving a dish towel at the oven.' },
      { by: 'a', say: "It's fine! Everything's fine! It's supposed to look like that!", v: { odd: ['It\'s called blackened. It\'s a whole style.'], soft: ['Oh no, oh no, I ruined dinner.'] } },
      { by: 'b', say: "Move. Give me the pan.", v: { soft: ['Hey, it\'s okay. Let me help.'] } },
      { by: 'a', conf: "{b} saved dinner and probably my reputation. I owe {b.obj} one.", v: { odd: ['I\'m officially banned from cooking. I accept it.'] } },
    ] },
    { id: 'kd.s2', turns: [
      { by: 'a', say: "Does pasta normally stick together into one big brick?", v: { odd: ['Is it supposed to be one pasta? Like, one big pasta?'] } },
      { by: 'b', say: "No. Oh my God. How much water did you use?", v: { soft: ['Oh, sweetie. Okay. Let me show you.'] } },
      { by: 'a', say: "Water? Was I supposed to use water?" },
      { by: 'b', conf: "Somebody had to step in or we were all eating pasta bricks tonight.", v: { soft: ['{a} was trying so hard. I couldn\'t just watch.'] } },
    ] },
    { id: 'kd.s3', turns: [
      { beat: '{a} drops a whole tray of eggs on the floor.' },
      { by: 'a', say: "Nobody saw that.", v: { loud: ['NOBODY SAW THAT!'] } },
      { by: 'b', say: "Okay, that happened. Grab a towel, I'll start over.", v: { sharp: ['Great. Move, I\'ll do it.'] } },
    ] },
  ],
  'kitchen-disaster.alone': [
    { id: 'kd.a1', turns: [
      { beat: 'The smoke alarm goes off. {a} is standing over a frying pan full of something black.' },
      { by: 'a', say: "Okay! Who wants extra crispy?", v: { soft: ['I tried, okay? I really tried.'], odd: ['Extra crispy! It\'s a delicacy where I\'m from!'] } },
      { by: 'a', conf: "I wanted to do something nice for the house. Instead I almost burned it down.", v: { odd: ['Some people win dailies. I set off fire alarms. We all have our gifts.'] } },
    ] },
    { id: 'kd.a2', turns: [
      { beat: '{a} proudly sets a plate of very pale, very wet pancakes on the table. Nobody moves.' },
      { by: 'a', say: "Breakfast is served!", v: { loud: ['BREAKFAST, EVERYBODY!'] } },
      { by: 'a', conf: "Not one person ate my pancakes. Fine. More for me. I'm not eating them either.", v: { soft: ['Nobody ate them. That kind of hurt my feelings.'] } },
    ] },
    { id: 'kd.a3', turns: [
      { by: 'a', say: "Why is the rice crunchy? Is rice crunchy?", v: { odd: ['Is rice supposed to crunch? I feel like rice should not crunch.'] } },
      { by: 'a', conf: "I'm here for the challenges. Nobody said anything about cooking.", v: { sharp: ['I can\'t cook. I\'ve never been able to cook.'] } },
    ] },
  ],
  'gym-flex.any': [
    { id: 'gf.1', turns: [
      { beat: '{a} and {b} end up on the pull-up bar at the same time. Neither wants to get off first.' },
      { by: 'b', say: "How many is that?", v: { loud: ['How many are you at?! I\'m not stopping!'] } },
      { by: 'a', say: "More than you.", v: { sharp: ['Enough to embarrass you.'], dry: ['Does it matter? I\'m winning.'] } },
      { by: 'b', say: "Okay, okay. You win. This time.", v: { sharp: ['Enjoy it. It won\'t happen in the Arena.'] } },
      { by: 'a', conf: "It's a pull-up contest. It's also a message. Everybody in that gym saw who dropped first.", v: { odd: ['My arms are jelly. Worth it. Totally worth it.'] } },
    ] },
    { id: 'gf.2', turns: [
      { by: 'b', say: "You're doing it wrong, by the way. Your form's terrible.", keep: ['form'] },
      { by: 'a', say: "My form beat you in the last daily.", keep: ['beat'], v: { soft: ['Well, my form beat you in the last daily, so.'] } },
      { by: 'b', say: "Plank. Right now. Let's see who quits first.", v: { loud: ['Plank! Right now! Loser does dishes!'] } },
      { by: 'a', conf: "I didn't come to the gym to compete. But I'm not losing to {b} on the floor in front of everybody.", v: { sharp: ['{b} picked a fight with the wrong person.'] } },
    ] },
    { id: 'gf.3', turns: [
      { beat: '{a} adds another plate to the bar, looks at {b}, and adds one more.' },
      { by: 'b', say: "That's just showing off.", v: { dry: ['Subtle. Very subtle.'] } },
      { by: 'a', say: "If you've got it, show it.", v: { soft: ['Sorry, I just wanted to see if I could do it.'] } },
    ] },
  ],
  'hot-tub-truths.alliance': [
    { id: 'ht.a1', turns: [
      { beat: 'Late night in the hot tub. {a} and {b} have had a couple of drinks. {c} is floating at the other end with eyes closed.' },
      { by: 'b', say: "Can I ask you something? Who do you actually trust in here?", v: { soft: ['Can I ask you something real? Who do you trust in here?'] } },
      { by: 'a', say: "Honestly? My people. The ones I'm working with.", v: { loud: ['My crew! Obviously my crew!'], sharp: ['The people I\'ve got a deal with. Nobody else.'] } },
      { by: 'c', conf: "They thought I was asleep. I wasn't. Now I know {a} has a group, and I know who's in it.", v: { sharp: ['Rule one of this house. Never talk in the hot tub.'], loud: ['They really thought I was asleep! I heard EVERYTHING!'] } },
    ] },
    { id: 'ht.a2', turns: [
      { by: 'a', say: "Okay, truth or dare. I pick truth." },
      { by: 'b', say: "Who's in your alliance?", v: { odd: ['Ooh. Who\'s in your secret club?'] } },
      { by: 'a', say: "Pass. Okay, fine. You can probably guess.", v: { sharp: ['Nice try.'] } },
      { by: 'c', conf: "{a} didn't name names, but I could tell who it was about.", v: { odd: ['Truth or dare is a terrible game to play in this house. For them. Great for me.'] } },
    ] },
    { id: 'ht.a3', turns: [
      { beat: 'Steam rises off the hot tub. {a} is talking too loudly.' },
      { by: 'a', say: "We've got the numbers this week. Nobody can touch us.", v: { soft: ['I just feel safe with my group, you know?'] } },
      { by: 'b', say: "Maybe say that a little quieter.", v: { sharp: ['Lower your voice.'] } },
      { by: 'c', conf: "{a} was bragging, and I was right there. Thanks, {a}.", v: { sharp: ['I didn\'t even have to ask. {a} just told me.'] } },
    ] },
  ],
  'hot-tub-truths.crush': [
    { id: 'ht.c1', turns: [
      { by: 'b', say: "Okay, you have to tell me. Who do you like in here?", v: { odd: ['Come on. Who do you like in here? I won\'t tell anybody.'] } },
      { by: 'a', say: "Fine. I kind of have a thing for {target}.", v: { soft: ['Okay... I think I really like {target}. Don\'t laugh.'], sharp: ['{target} isn\'t terrible to look at. That\'s all I\'m saying.'] } },
      { by: 'b', say: "I KNEW it.", v: { loud: ['I KNEW IT! I KNEW IT!'] } },
      { by: 'a', conf: "I said it out loud in a hot tub with people around. That's never staying a secret.", v: { soft: ['My face was so red. I don\'t know if I want {target} to find out or not.'] } },
    ] },
    { id: 'ht.c2', turns: [
      { by: 'b', say: "You've been looking at {target} all night.", v: { sharp: ['You\'re staring at {target}. It\'s embarrassing.'] } },
      { by: 'a', say: "Have not.", v: { odd: ['I\'ve been looking at the stars. {target} is in front of the stars.'] } },
      { by: 'b', say: "Have too.", v: { loud: ['HAVE TOO!'] } },
      { by: 'a', say: "Okay, maybe a little." },
    ] },
    { id: 'ht.c3', turns: [
      { by: 'a', say: "Can I tell you something embarrassing? I think I like {target}.", v: { loud: ['Okay, I\'m just going to say it! I like {target}!'] } },
      { by: 'b', say: "Embarrassing? It's sweet.", v: { sharp: ['That\'s a terrible idea, and you know it.'] } },
      { by: 'c', conf: "Everybody in that hot tub heard {a} say {target}'s name. By breakfast the whole villa will know.", v: { odd: ['The whole villa\'s going to know by tomorrow.'] } },
    ] },
  ],
  'hot-tub-truths.none': [
    { id: 'ht.n1', turns: [
      { beat: '{a} and {b} sit in the hot tub watching the lights of the bay.' },
      { by: 'a', say: "Sometimes I forget we're on a show.", v: { soft: ['It\'s so pretty out here. I wish my family could see this.'], sharp: ['Don\'t get used to it. Somebody\'s going home this week.'] } },
      { by: 'b', say: "They'd love it here. Mine would too.", v: { odd: ['And then TJ shows up yelling and you remember.'] } },
      { by: 'a', conf: "Those quiet minutes with {b} are the only time in this game I don't feel like I'm being watched.", v: { sharp: ['{b} is easy to talk to. That\'s exactly why I have to be careful.'] } },
    ] },
    { id: 'ht.n2', turns: [
      { by: 'b', say: "What are you going to do with the money if you win?" },
      { by: 'a', say: "Pay off my mom's house. That's it. That's the whole dream.", v: { loud: ['Buy a boat! A big, stupid boat!'], sharp: ['Prove everybody back home wrong. The money\'s a bonus.'] } },
      { by: 'b', say: "That's a good reason.", v: { odd: ['Can I come on the boat?'] } },
    ] },
    { id: 'ht.n3', turns: [
      { beat: '{a} and {b} float in silence for a while.' },
      { by: 'a', say: "Is it weird that I'm having fun?", v: { soft: ['I didn\'t think I\'d actually like it here.'] } },
      { by: 'b', say: "No. I'm having fun too, and I didn't expect to.", v: { dry: ['Yes. Deeply weird.'] } },
    ] },
  ],
  'tj-at-breakfast.any': [
    { id: 'tb.1', turns: [
      { beat: 'TJ bursts into the kitchen in sunglasses at seven in the morning holding a box of doughnuts.' },
      { by: 'tj', say: "Rise and grind, my beautiful insomniacs! Breakfast trivia! Winner gets a phone call home!" },
      { by: 'a', say: "Wait, seriously? Call home?", v: { soft: ['Oh my gosh. Oh my gosh, I have to win this.'], loud: ['I\'M WINNING THIS!'] } },
      { by: 'tj', say: "{a}, that's three right answers! Somebody get this genius a phone!" },
      { by: 'a', conf: "Hearing my family's voice was everything. I didn't know how much I needed it.", v: { sharp: ['Winning trivia at breakfast. Not my proudest win. My favorite one, though.'] } },
    ] },
    { id: 'tb.2', turns: [
      { by: 'tj', say: "Pop quiz, people! I've got questions, you've got pajamas, and the winner calls home! Let's get WEIRD!" },
      { by: 'b', say: "It's not even eight.", v: { sharp: ['Does he ever sleep?'] } },
      { by: 'tj', say: "{a} takes it! Look at that brain! Look at it!" },
      { by: 'a', say: "I love you, TJ!", v: { sharp: ['Finally, a challenge for people with a brain.'] } },
    ] },
    { id: 'tb.3', turns: [
      { beat: 'TJ walks in banging two pans together.' },
      { by: 'tj', say: "GOOD MORNING! Trivia! Now! Winner gets ten minutes on the phone with somebody who loves them!" },
      { by: 'a', conf: "I won breakfast trivia in my pajamas, and it was better than any daily I've won.", v: { soft: ['I cried the whole phone call. I don\'t care who saw.'] } },
    ] },
  ],
  'bunk-war.moved': [
    { id: 'bw.m1', turns: [
      { beat: 'Two in the morning. {b} is snoring loud enough to shake the bunk.' },
      { by: 'a', say: "{b}. {b}! Roll over!", v: { loud: ['{b}! YOU SOUND LIKE A LAWNMOWER!'], soft: ['Hey... {b}... could you maybe turn over? Please?'] } },
      { by: 'b', say: "Huh? What? I'm not even asleep.", v: { odd: ['I wasn\'t snoring, I was breathing creatively.'] } },
      { by: 'a', conf: "I dragged my mattress into the living room. I'm not losing a daily because of {b}'s snoring.", v: { soft: ['I moved beds. It\'s not worth fighting over.'] } },
    ] },
    { id: 'bw.m2', turns: [
      { by: 'a', say: "Can you please stop leaving the light on?" },
      { by: 'b', say: "I'm reading.", v: { sharp: ['It\'s my bunk. I\'ll do what I want.'] } },
      { by: 'a', say: "Fine. I'm moving.", v: { loud: ['FINE! I\'M MOVING!'] } },
    ] },
    { id: 'bw.m3', turns: [
      { beat: '{a} wakes up with {b}\'s wet towel on {a.posAdj} face for the third night running.' },
      { by: 'a', say: "Okay, I'm switching rooms.", v: { sharp: ['I\'m done sharing anything with you.'] } },
      { by: 'b', say: "It's a towel. Calm down.", v: { soft: ['Oh no, I\'m so sorry! I didn\'t know!'] } },
    ] },
  ],
  'bunk-war.stuck': [
    { id: 'bw.s1', turns: [
      { beat: 'It\'s one in the morning. {b} has the lamp on and is talking strategy out loud to anybody who\'s awake.' },
      { by: 'a', say: "Some of us have a daily tomorrow.", v: { loud: ['SOME OF US ARE TRYING TO SLEEP!'], dry: ['Can you please stop talking? Some of us want to sleep.'] } },
      { by: 'b', say: "Then sleep.", v: { sharp: ['Not my problem.'] } },
      { by: 'a', conf: "I'm stuck in a room with {b} for who knows how long. One of us isn't making it out of this alive.", v: { soft: ['I\'m so tired. I just want one night of sleep.'] } },
    ] },
    { id: 'bw.s2', turns: [
      { by: 'a', say: "Whose clothes are these all over my bed?" },
      { by: 'b', say: "Mine. There's no room on my side.", v: { odd: ['They\'re resting.'] } },
      { by: 'a', say: "Then make room.", v: { soft: ['Could you please just move them? Please?'] } },
      { by: 'b', say: "Later.", v: { sharp: ['Make me.'] } },
    ] },
    { id: 'bw.s3', turns: [
      { beat: '{b}\'s alarm goes off at five, and {b} sleeps right through it.' },
      { by: 'a', say: "TURN IT OFF.", v: { soft: ['Please... please turn it off.'] } },
      { by: 'a', conf: "Every morning. Every single morning. I'm going to lose my mind before I lose a daily.", v: { dry: ['Five in the morning. Every day. I\'ve made my peace with dying here.'] } },
    ] },
  ],
  'show-banter.ok': [
    { id: 'sb.o1', turns: [
      { by: 'a', say: "On {show_a}, this would be nothing. We had way worse than this.", v: { loud: ['On {show_a} we\'d eat this place for breakfast!'] } },
      { by: 'b', say: "Please. {show_b} was harder and you know it.", v: { sharp: ['{show_b} would have ended you in a week.'] } },
      { by: 'a', say: "Prove it, then.", v: { odd: ['Okay, arm wrestle for it. Loser admits their show is easier.'] } },
      { by: 'b', conf: "{a} and I argue about our old shows all day. It's the most fun I have in here.", v: { sharp: ['{a} is wrong about everything, but I like arguing with {a.obj}.'] } },
    ] },
    { id: 'sb.o2', turns: [
      { by: 'b', say: "So what was {show_a} actually like? Like, really?", v: { soft: ['I always wanted to ask somebody from {show_a}. What was it like?'] } },
      { by: 'a', say: "Honestly? It's a mess in there. You'd love it.", v: { sharp: ['Harder than anything you\'ve done.'] } },
      { by: 'b', say: "Sounds a lot like {show_b}, honestly.", v: { odd: ['So like {show_b}, but with worse food.'] } },
    ] },
    { id: 'sb.o3', turns: [
      { by: 'a', say: "Okay, {show_b} people, real question. How did you guys survive that?" },
      { by: 'b', say: "Same way you survived {show_a}. Spite and snacks.", v: { soft: ['Honestly? The friendships. Same as you, I bet.'] } },
      { by: 'a', conf: "Turns out somebody from {show_b} gets it. We've both been through it.", v: { sharp: ['{b} gets it. That makes {b} useful.'] } },
    ] },
  ],
  'show-banter.sour': [
    { id: 'sb.s1', turns: [
      { by: 'a', say: "No offence, but {show_b} isn't exactly a real competition.", v: { loud: ['{show_b}? You call that a show? It\'s a vacation!'] } },
      { by: 'b', say: "Excuse me? Say that again.", v: { sharp: ['Careful.'] } },
      { by: 'a', say: "I'm just saying, {show_a} was harder." },
      { by: 'b', conf: "{a} thinks being from {show_a} makes {a.obj} better than me. I'll be happy to show {a.obj} how wrong that is.", v: { soft: ['That really stung, honestly. I worked hard on {show_b}.'] } },
    ] },
    { id: 'sb.s2', turns: [
      { by: 'b', say: "Is every sentence going to start with 'on {show_a}'?", v: { dry: ['We\'re not on {show_a} anymore, and I miss it every day.'] } },
      { by: 'a', say: "Is every sentence going to be you complaining?", v: { sharp: ['Is every sentence going to be you being jealous?'] } },
      { by: 'b', say: "Wow. Okay." },
    ] },
    { id: 'sb.s3', turns: [
      { by: 'a', say: "People from {show_b} always think they're tougher than they are." },
      { by: 'b', say: "And people from {show_a} never shut up about {show_a}.", v: { loud: ['And {show_a} people NEVER SHUT UP!'] } },
      { by: 'a', conf: "I didn't mean for it to turn into a fight. Okay, I kind of did.", v: { soft: ['I took it too far. I know I did.'] } },
    ] },
  ],
  'rookie-hazing.plays': [
    { id: 'rh.p1', turns: [
      { by: 'a', say: "Rookie! Rookie rules. You're on dishes tonight.", v: { loud: ['ROOKIE! Dishes! Now!'], soft: ['Okay, rookie tradition, you get dishes. Sorry, it\'s the rules.'] } },
      { by: 'b', say: "Sure. Is there a rookie uniform too?", v: { odd: ['Seriously? Fine.'] } },
      { by: 'a', say: "Ha! Okay, I like you.", v: { sharp: ['Good. You\'ll learn.'] } },
      { by: 'b', conf: "I could have fought it. But playing along makes the vets like me, and right now I need them to like me.", v: { sharp: ['I\'ll do their dishes now. They\'ll be doing mine in a few weeks.'] } },
    ] },
    { id: 'rh.p2', turns: [
      { by: 'a', say: "First-timer, huh? Welcome. You're making breakfast tomorrow." },
      { by: 'b', say: "Pancakes or eggs?", v: { soft: ['Happy to! Any requests?'] } },
      { by: 'a', conf: "{b} didn't complain once. That's how you survive as a rookie in here.", v: { sharp: ['{b} is playing nice. I don\'t trust it.'] } },
    ] },
    { id: 'rh.p3', turns: [
      { by: 'a', say: "Rookie, sing us a song. It's tradition." },
      { by: 'b', say: "It is not a tradition." },
      { by: 'a', say: "It is now." },
      { beat: '{b} sings, badly and loudly, and the whole room claps.' },
    ] },
  ],
  'rookie-hazing.refuses': [
    { id: 'rh.r1', turns: [
      { by: 'a', say: "Rookie! Dishes!", v: { sharp: ['Rookie. Dishes. Now.'] } },
      { by: 'b', say: "I'm not your rookie, and I'm not doing your dishes.", v: { loud: ['I\'m not doing your dishes! Do your own dishes!'], soft: ['I\'ll do my own dishes. I\'m not doing yours.'] } },
      { by: 'a', say: "Wow. Okay. Noted." },
      { by: 'b', conf: "If I let {a} walk all over me now, I'll be a doormat all season. Not happening.", v: { soft: ['My heart was pounding, but I had to say no.'] } },
    ] },
    { id: 'rh.r2', turns: [
      { by: 'a', say: "First-timers clean the bathroom. Everybody knows that." },
      { by: 'b', say: "Funny, I've never heard that rule before.", v: { sharp: ['Show me where that\'s written down.'] } },
      { by: 'a', conf: "{b} has a mouth on {b.obj}. Rookies with a mouth don't last long.", v: { soft: ['I was just messing around. {b} took it really seriously.'] } },
    ] },
    { id: 'rh.r3', turns: [
      { by: 'a', say: "Rookie, grab me a drink.", v: { loud: ['ROOKIE! DRINK!'] } },
      { by: 'b', say: "Grab it yourself.", v: { soft: ['Um, I think you can get it yourself.'] } },
      { beat: 'A couple of people on the couch go "oooh".' },
    ] },
  ],

  // ── DRAMA ───────────────────────────────────────────────────────────
  'kitchen-blowup.any': [
    { id: 'kb.1', turns: [
      { by: 'a', say: "Who ate the last of the eggs?", v: { loud: ['WHO ATE ALL THE EGGS?!'], sharp: ['I\'d love to know who thinks they can eat everybody\'s eggs.'] } },
      { by: 'b', say: "I did. I was hungry.", v: { sharp: ['Me. Problem?'] } },
      { by: 'a', say: "We're all hungry! That's the whole point of sharing!", v: { soft: ['That was for everybody, {b}. That really isn\'t fair.'] } },
      { by: 'b', say: "It's eggs, {a}. Calm down." },
      { by: 'a', conf: "Forget the eggs. {b} thinks this whole house exists for {b.obj}.", v: { soft: ['I know it\'s just eggs. I\'m just so tired of being the only one who cares.'] } },
    ] },
    { id: 'kb.2', turns: [
      { beat: '{a} slams a cupboard shut.' },
      { by: 'a', say: "Do you ever clean up after yourself? Ever?", when: { early: false }, v: { loud: ['DO YOU EVER CLEAN ANYTHING?!'] } },
      { by: 'a', say: "Seriously, can you clean up after yourself?", when: { early: true } },
      { by: 'b', say: "Do you ever mind your own business?", v: { soft: ['Sorry, but is my mess really your business?'] } },
      { by: 'a', say: "This is my business. I live here too!", v: { sharp: ['It is my business when I\'m the one tripping over your mess.'] } },
      { beat: 'The kitchen goes quiet. Somebody turns the music up.' },
    ] },
    { id: 'kb.3', turns: [
      { by: 'a', say: "You used my cup. You used my cup again.", v: { sharp: ['That\'s my cup. That cup has my name on it.'] } },
      { by: 'b', say: "There are like forty cups.", keep: ['forty'], v: { odd: ['There are forty cups. Cups don\'t have owners, they\'re free spirits.'] } },
      { by: 'a', say: "Then use one of the other thirty-nine!", v: { loud: ['THEN USE ONE OF THE OTHER THIRTY-NINE!'] } },
      { by: 'b', conf: "{a} needs to relax. It's a cup. It's not that deep.", v: { soft: ['I didn\'t know it mattered that much. I feel bad now.'] } },
    ] },
  ],
  'receipts.owns': [
    { id: 'rq.o1', turns: [
      { by: 'a', say: "Can we talk about you voting me in?", v: { loud: ['So you voted me in! You really voted me in!'], soft: ['I need to ask you something. Why did you vote for me?'] } },
      { by: 'b', say: "Yeah, I did. And I'd do it again.", v: { sharp: ['I did. And?'] } },
      { by: 'a', say: "At least you're honest about it." },
      { by: 'a', conf: "I respect {b} saying it to my face. I'm still coming for {b}.", v: { soft: ['It hurt. But I\'d rather know.'] } },
    ] },
    { id: 'rq.o2', turns: [
      { by: 'a', say: "You said my name out loud. In front of everybody." },
      { by: 'b', say: "It's a game, {a}. I'm playing it.", v: { sharp: ['Did you want me to whisper it?'] } },
      { by: 'a', say: "Then you won't mind when I play it back.", v: { loud: ['Then get ready, because I\'m playing it too!'] } },
    ] },
    { id: 'rq.o3', turns: [
      { by: 'a', say: "I just want to know why. Why me?" },
      { by: 'b', say: "Because it was you or one of my friends. Nothing personal.", v: { soft: ["Because you weren't one of my people. I'm sorry."] } },
      { by: 'a', conf: "{b} said it was me or a friend. Now I know exactly where I stand with {b}.", v: { soft: ["Nothing personal. Sure. It didn't feel like nothing."] } },
    ] },
  ],
  'receipts.apology': [
    { id: 'rq.a1', turns: [
      { by: 'a', say: "Why'd you vote for me?" },
      { by: 'b', say: "Honestly? I panicked. I'm sorry.", v: { sharp: ['It was strategy. But I\'m sorry it was you.'] } },
      { by: 'a', say: "Okay. Thanks for saying it.", v: { sharp: ['Fine. Don\'t do it again.'] } },
      { by: 'a', conf: "Saying sorry doesn't change how {b} voted. But it's more than most people in here would give me.", v: { soft: ['I believe {b} meant it. I think.'] } },
    ] },
    { id: 'rq.a2', turns: [
      { by: 'b', say: "Before you say anything, I know. I'm sorry about the vote.", v: { loud: ['I\'m sorry! I know! I\'m sorry!'] } },
      { by: 'a', say: "Are you actually sorry, or just scared?", v: { soft: ['Do you mean that?'] } },
      { by: 'b', say: "Both. Is that okay?", v: { sharp: ['Does it matter? I\'m saying it.'] } },
    ] },
    { id: 'rq.a3', turns: [
      { by: 'a', say: "So, the vote." },
      { by: 'b', say: "I know. It was a bad call. I'd take it back if I could.", v: { soft: ['I felt sick the whole time. I\'m really sorry.'] } },
      { by: 'a', conf: "{b} said sorry. I'll take it. I won't forget it, but I'll take it.", v: { sharp: ['Sorry is cheap. Let\'s see what {b} does next week.'] } },
    ] },
  ],
  'receipts.denies': [
    { id: 'rq.d1', turns: [
      { by: 'a', say: "Why'd you vote for me?" },
      { by: 'b', say: "It wasn't personal. Everybody was voting the same way.", v: { sharp: ['Don\'t make this about me. Everybody voted for you.'] } },
      { by: 'a', say: "So you just did what everybody else did?", v: { loud: ['So you\'re a sheep! Great! Good to know!'] } },
      { by: 'a', conf: "{b} won't even own it. I'd have more respect if {b} just said it.", v: { soft: ['I wanted a real answer. I didn\'t get one.'] } },
    ] },
    { id: 'rq.d2', turns: [
      { by: 'a', say: "I heard you say my name." },
      { by: 'b', say: "Can we not do this right now?", v: { sharp: ['I\'m not doing this with you.'] } },
      { by: 'a', say: "When, then?" },
      { beat: '{b} walks out of the kitchen.' },
    ] },
    { id: 'rq.d3', turns: [
      { by: 'a', say: "Nothing to say about the vote?" },
      { by: 'b', say: "I said a name. Somebody had to.", v: { soft: ['I don\'t know what you want me to say.'] } },
      { by: 'a', conf: "That's it. That's all {b} had for me. Noted.", v: { loud: ['Not even a sorry?! Oh, I\'ll remember that one!'] } },
    ] },
  ],
  'old-show-grudge.settled': [
    { id: 'og.s1', turns: [
      { by: 'a', say: "Hey. Can we talk about {show_a}? About how things ended?", v: { sharp: ['We need to clear the air about {show_a}.'] } },
      { by: 'b', say: "I was wondering when you'd bring it up.", v: { soft: ['I was hoping you would. I\'ve felt bad about it.'] } },
      { by: 'a', say: "I'm not saying I'm over it. But this is a new game.", v: { loud: ['I\'m done carrying it around! New game!'] } },
      { by: 'b', say: "New game. Okay. I can work with that." },
      { by: 'a', conf: "What happened on {show_a} still stings. But holding onto it in here only helps everybody else.", v: { soft: ['It felt so good to finally talk about it.'] } },
    ] },
    { id: 'og.s2', turns: [
      { by: 'b', say: "I know you probably hate me after {show_a}." },
      { by: 'a', say: "I don't hate you. I just don't trust you.", v: { soft: ['I don\'t hate you. I really don\'t.'] } },
      { by: 'b', say: "That's fair. Let me earn it back.", v: { sharp: ['Then watch me.'] } },
    ] },
    { id: 'og.s3', turns: [
      { by: 'a', say: "{show_a} was a long time ago. Truce?" },
      { by: 'b', say: "Truce.", v: { odd: ['Truce! Wait, do we shake? We should shake.'] } },
      { by: 'a', conf: "Making peace with {b} was the hardest thing I've done in this villa, and I've done the dailies.", v: { sharp: ['A truce is useful. That doesn\'t mean I forget.'] } },
    ] },
  ],
  'old-show-grudge.reopened': [
    { id: 'og.r1', turns: [
      { by: 'a', say: "Don't act like {show_a} didn't happen.", v: { loud: ['Don\'t you dare act like {show_a} never happened!'] } },
      { by: 'b', say: "Are you seriously still on that?", v: { sharp: ['Get over it.'] } },
      { by: 'a', say: "Yeah. I am. You don't just get to walk in here and pretend.", v: { soft: ['It still hurts, okay? You don\'t get to pretend it doesn\'t.'] } },
      { by: 'a', conf: "{b} thinks a new show wipes the slate clean. It doesn't. Not with me.", v: { sharp: ['I don\'t forgive. I don\'t forget. {b} should know that by now.'] } },
    ] },
    { id: 'og.r2', turns: [
      { by: 'b', say: "We should probably talk about {show_a}." },
      { by: 'a', say: "There's nothing to talk about. I remember exactly what you did.", v: { loud: ['Nothing to talk about! I REMEMBER!'] } },
      { beat: '{a} walks off. {b} stays where {b.sub} was, alone.' },
    ] },
    { id: 'og.r3', turns: [
      { by: 'a', say: "Funny, last time we were on a show together, you stabbed me in the back.", v: { sharp: ['Last time I trusted you on {show_a}, it cost me everything.'] } },
      { by: 'b', say: "That was a game. This is a game.", v: { soft: ['I\'m not that person anymore. I promise.'] } },
      { by: 'a', conf: "Every time I look at {b}, I'm back on {show_a}. I can't help it.", v: { soft: ['I want to move on. I don\'t know how.'] } },
    ] },
  ],
  'trash-talk.bites': [
    { id: 'tt.b1', turns: [
      { by: 'a', say: "If we ever meet in that Arena, I hope you've said your goodbyes.", v: { loud: ['You and me in the Arena! You\'d get destroyed!'], sharp: ['I\'d enjoy beating you. I really would.'] } },
      { by: 'b', say: "Okay, chill.", v: { soft: ['Why would you even say that to me?'] } },
      { by: 'a', say: "I'm just being honest.", v: { odd: ['I\'m saying what everybody else is thinking.'] } },
      { by: 'b', conf: "{a} got in my head, and I hate it. I keep thinking about it.", v: { sharp: ['{a} wants me rattled. It\'s working. I hate that it\'s working.'] } },
    ] },
    { id: 'tt.b2', turns: [
      { by: 'a', say: "You looked slow out there today. Really slow.", v: { sharp: ['You looked tired. Getting old?'] } },
      { by: 'b', say: "Mind your business.", v: { loud: ['MIND YOUR BUSINESS!'] } },
      { by: 'a', conf: "I said one thing and {b} got loud. That's all I needed to know.", v: { soft: ['I didn\'t mean to upset {b} that much.'] } },
    ] },
    { id: 'tt.b3', turns: [
      { by: 'a', say: "I'd call you out in a heartbeat. You know that, right?" },
      { by: 'b', say: "Then do it.", v: { soft: ['Then do it. Why are you always like this with me?'] } },
      { by: 'a', say: "Maybe I will." },
    ] },
  ],
  'trash-talk.shrugs': [
    { id: 'tt.s1', turns: [
      { by: 'a', say: "You're lucky you haven't been in the Arena yet.", v: { loud: ['Lucky! You\'re just lucky!'] } },
      { by: 'b', say: "And you're loud. We've all got our gifts.", v: { dry: ['Thanks for the update.'], soft: ['Okay. Have a good day.'] } },
      { by: 'b', conf: "{a} talks a lot. I'll start listening when {a} starts winning.", v: { soft: ['I don\'t let that stuff get to me. It\'s just noise.'] } },
    ] },
    { id: 'tt.s2', turns: [
      { by: 'a', say: "I'm coming for you. Just so you know.", v: { sharp: ['I\'m coming for you. Enjoy it while it lasts.'] } },
      { by: 'b', say: "Cool. Can you pass the salt?", v: { dry: ['Noted. Salt, please.'] } },
      { by: 'a', conf: "{b} didn't even flinch. That's annoying.", v: { loud: ['{b} ignored me! Nobody ignores me!'] } },
    ] },
    { id: 'tt.s3', turns: [
      { by: 'a', say: "You couldn't beat me at anything." },
      { by: 'b', say: "Okay." },
      { beat: '{b} goes back to reading. {a} just stands there.' },
    ] },
  ],
  'floater-callout.firesback': [
    { id: 'fc.f1', turns: [
      { by: 'a', say: "Some people in this house haven't been in the Arena once.", v: { loud: ['Some people are getting a free ride! I\'m looking at you, {b}!'] } },
      { by: 'b', say: "Then put me in. I'm not scared of you.", v: { sharp: ['That\'s funny, coming from you. You barely survived yours.'] } },
      { by: 'a', say: "Maybe I will.", v: { sharp: ['Careful what you wish for.'] } },
      { by: 'b', conf: "{a} wants to make me a target. Fine. Then {a} gets to be one too.", v: { soft: ['That was so embarrassing. Why does everyone have to do this in public?'] } },
    ] },
    { id: 'fc.f2', turns: [
      { by: 'a', say: "{b}, when are you actually going to play this game?" },
      { by: 'b', say: "When are you going to stop talking about me?", v: { loud: ['When are you going to SHUT UP about me?!'] } },
      { beat: 'Everyone on the couch looks down at their drinks.' },
    ] },
    { id: 'fc.f3', turns: [
      { by: 'a', say: "You've been coasting. Everybody sees it.", keep: ['coast'] },
      { by: 'b', say: "Coasting? I'm still here, aren't I?", v: { soft: ['I\'m doing my best, okay?'] } },
      { by: 'b', conf: "Being a floater is a strategy. Ask the people who aren't here anymore.", v: { soft: ['I\'m not floating. I\'m just quieter than {a}.'] } },
    ] },
  ],
  'floater-callout.takes': [
    { id: 'fc.t1', turns: [
      { by: 'a', say: "Some people in this house haven't done a single thing yet.", v: { loud: ['Free ride! Free ride, {b}!'] } },
      { beat: '{b} looks at the floor and says nothing.' },
      { by: 'b', conf: "Everybody looked at me. Now I've got a target on my back, and I didn't do anything to earn it.", v: { soft: ['I wanted to disappear into the couch.'] } },
    ] },
    { id: 'fc.t2', turns: [
      { by: 'a', say: "{b}, no offence, but what's your game? What have you actually done?" },
      { by: 'b', say: "I... I'm working on it.", v: { sharp: ['I\'m playing my game. You\'ll see.'] } },
      { by: 'a', conf: "{b} didn't have an answer. That's going to come up at the vote.", v: { soft: ['I didn\'t want to embarrass {b}. Somebody had to say it, though.'] } },
    ] },
    { id: 'fc.t3', turns: [
      { by: 'a', say: "It must be nice, never being in danger." },
      { by: 'b', say: "I guess.", v: { soft: ['That\'s not fair.'] } },
      { by: 'b', conf: "I knew this was coming eventually. Now it's out there.", v: { sharp: ['Fine. Let them come.'] } },
    ] },
  ],
  'gossip-backfire.told': [
    { id: 'gb.t1', turns: [
      { by: 'a', say: "Honestly, {b} is so fake. Everybody can see it.", v: { sharp: ['{b} is a snake. Everybody knows it.'] } },
      { beat: 'Later, by the pool.' },
      { by: 'c', say: "{b}, you should know what {a} is saying about you.", v: { soft: ['{b}, I don\'t want to start drama, but you should know what {a} is saying about you.'] } },
      { by: 'b', say: "{a} said that? About me?", v: { loud: ['Oh, is THAT what {a} is saying?!'] } },
      { by: 'b', conf: "{a} talked about me behind my back to one of my friends. Real smart.", v: { soft: ['I thought {a} liked me. I really did.'] } },
    ] },
    { id: 'gb.t2', turns: [
      { by: 'a', say: "Between us? I don't trust {b} at all.", v: { sharp: ['{b} is going to stab somebody. Mark my words.'] } },
      { by: 'c', conf: "{a} has no idea that {b} is one of my closest people in here. I'm telling {b} everything.", v: { sharp: ['{a} told the wrong person. Big mistake.'] } },
      { by: 'b', say: "So I hear you've got opinions about me.", v: { loud: ['Got something to say to my FACE, {a}?'] } },
      { by: 'a', say: "Who told you that?", v: { soft: ['Oh no. I didn\'t mean it like that.'] } },
    ] },
    { id: 'gb.t3', turns: [
      { by: 'c', say: "Just so you know, {a} has been trash-talking you all day." },
      { by: 'b', say: "Thank you. Really. Thank you for telling me.", v: { sharp: ['Good to know. Very good to know.'] } },
      { by: 'b', conf: "Now I know exactly who my friends are in here, and who they aren't.", v: { loud: ['{a} is DONE!'] } },
    ] },
  ],
  'gossip-backfire.kept': [
    { id: 'gb.k1', turns: [
      { by: 'a', say: "Can I tell you what I really think of {b}?", v: { sharp: ['Can I be honest about {b}?'] } },
      { by: 'c', say: "Go for it. It stays between us.", v: { soft: ['Of course. I won\'t say anything.'] } },
      { by: 'c', conf: "{a} told me everything about {b}. I'm keeping it to myself. For now.", v: { sharp: ['I\'m not telling {b}. I\'m saving it.'] } },
    ] },
    { id: 'gb.k2', turns: [
      { by: 'a', say: "{b} gets on my nerves." },
      { by: 'c', say: "Yeah, I can see that.", v: { soft: ['Aw, {b} is not that bad.'] } },
      { by: 'a', conf: "{c} gets it. Finally, somebody else in here sees what {b} is really like.", v: { soft: ['It felt good to vent to somebody.'] } },
    ] },
    { id: 'gb.k3', turns: [
      { by: 'a', say: "Don't tell {b} I said that." },
      { by: 'c', say: "My lips are sealed.", v: { odd: ['Zipped. Locked. Thrown into the ocean.'] } },
    ] },
  ],
  'homesick.comforted': [
    { id: 'hs.c1', turns: [
      { beat: '{a} is sitting on the beach alone with {a.posAdj} knees pulled up. {b} sits down next to {a.obj}.' },
      { by: 'b', say: "Hey. You okay?", v: { soft: ['Hey, hey. Come here. What\'s going on?'], sharp: ['You\'ve been out here an hour. Talk.'] } },
      { by: 'a', say: "I just really miss home. I miss my family.", v: { loud: ['I miss everybody! I miss my dog! I miss my bed!'], sharp: ['I\'m fine. I just... I miss home. That\'s all.'] } },
      { by: 'b', say: "They'd want you to keep going. You know that, right?", v: { odd: ['Your family\'s watching. Wave! Okay, now be brave.'] } },
      { by: 'a', conf: "{b} sat with me for an hour and didn't say much. That was exactly what I needed.", v: { soft: ['I don\'t know what I\'d do in here without {b}.'] } },
    ] },
    { id: 'hs.c2', turns: [
      { by: 'a', say: "Sorry. I'm being stupid.", keep: ['stupid'] },
      { by: 'b', say: "You're not being stupid. Everybody cries in here.", v: { sharp: ['Crying\'s allowed. Quitting isn\'t.'] } },
      { by: 'a', say: "I just want to hear my mom's voice.", v: { soft: ['I just want one hug from my mom.'] } },
      { by: 'b', conf: "{a} is struggling, and if I don't look after {a.obj}, nobody in this house will.", v: { sharp: ['Somebody has to keep {a} from quitting. Might as well be me.'] } },
    ] },
    { id: 'hs.c3', turns: [
      { by: 'b', say: "Want to go for a walk? Just to get out of the villa for a bit?" },
      { by: 'a', say: "Yeah. Yeah, I'd like that.", v: { soft: ['Please. Yes. Thank you.'] } },
      { by: 'a', conf: "I was this close to asking to go home. Then {b} came and found me.", v: { sharp: ['I was close to calling it. I\'m glad I didn\'t.'] } },
    ] },
    { id: 'hs.c4', turns: [
      { by: 'b', say: "You've been really quiet today. What's going on?" },
      { by: 'a', say: "Nothing. I'm fine." },
      { by: 'b', say: "You're not fine. You can tell me." },
      { by: 'a', say: "I keep thinking about everybody back home. My little brother had a birthday and I wasn't there." },
      { by: 'b', say: "That's hard. I'm sorry." },
      { by: 'a', say: "He's going to watch this one day. I want him to see me do well." },
      { by: 'b', say: "Then let's make sure he does." },
      { by: 'a', conf: "I didn't want to talk about it. I'm glad {b} made me." },
    ] },
    { id: 'hs.c5', turns: [
      { by: 'a', say: "Can I ask you something? Do you ever just want to go home?" },
      { by: 'b', say: "Every single day. Why, do you?" },
      { by: 'a', say: "Today, yeah. Really badly." },
      { by: 'b', say: "Then stay until tomorrow. Just tomorrow. Then see how you feel." },
      { by: 'a', say: "That I can probably do." },
      { by: 'b', conf: "I could see {a} was close to giving up. Sometimes you just need somebody to make it smaller for you." },
    ] },
    { id: 'hs.c6', turns: [
      { by: 'a', say: "I'd give anything for one phone call right now." },
      { by: 'b', say: "Who would you call?" },
      { by: 'a', say: "My mom. Just to hear her say she's proud of me." },
      { by: 'b', say: "She is. You know that." },
      { by: 'a', say: "I know. I just want to hear it." },
      { by: 'a', conf: "Missing home in here is like a weight you carry everywhere. Talking to {b} made it a little lighter." },
    ] },
  ],
  'homesick.alone': [
    { id: 'hs.a1', turns: [
      { by: 'a', conf: "I miss home so much it hurts. Some nights I lie in that bunk and just think about leaving.", v: { loud: ['I\'m losing it in here! I miss everything about home!'], sharp: ['I never get homesick, but I really miss home right now.'], soft: ['I cried in the shower again today. I just miss my family so much.'] } },
    ] },
    { id: 'hs.a2', turns: [
      { beat: '{a} stares at a photo from home taped to the bunk.' },
      { by: 'a', conf: "Nobody in here really knows me. That's the hardest part. I feel invisible.", v: { soft: ['I just want somebody to ask how I\'m doing.'] } },
    ] },
    { id: 'hs.a3', turns: [
      { by: 'a', conf: "Every day I wake up and ask myself if it's worth it. So far the answer is yes. Barely.", v: { odd: ['I\'ve started talking to the palm tree outside. It\'s a good listener.'] } },
    ] },
  ],
  'jealousy.blowup': [
    { id: 'jl.b1', turns: [
      { by: 'a', say: "Why are you always all over {c}?", v: { loud: ['Why are you ALWAYS all over {c}?!'], soft: ['Can you please just give us some space?'] } },
      { by: 'b', say: "Excuse me? We were just talking.", v: { sharp: ['I\'ll talk to whoever I want.'] } },
      { by: 'a', say: "Talking. Sure. Very close talking.", v: { sharp: ['Talking. Is that what we\'re calling it?'] } },
      { by: 'c', say: "Can everybody just calm down?", v: { soft: ['Please don\'t fight. Please.'] } },
      { by: 'a', conf: "I'm not crazy. I saw how {b} looks at {c}.", v: { soft: ['Maybe I overreacted. I just got so scared.'] } },
    ] },
    { id: 'jl.b2', turns: [
      { by: 'a', say: "Stay away from {c}.", v: { loud: ['STAY AWAY FROM {c}!'] } },
      { by: 'b', say: "Or what?", v: { soft: ['I didn\'t mean anything by it, I swear.'] } },
      { beat: 'The whole party stops to watch.' },
      { by: 'c', conf: "I'm stuck in the middle, and I didn't ask to be.", v: { sharp: ['This is so embarrassing. Both of them need to grow up.'] } },
    ] },
    { id: 'jl.b3', turns: [
      { by: 'a', say: "Seriously, {c}? In front of me?", v: { soft: ['That really hurt, {c}.'] } },
      { by: 'c', say: "It's not what you think!", v: { odd: ['It\'s not what it looks like! I swear!'] } },
      { by: 'b', say: "Relax. It was nothing.", v: { sharp: ['Somebody\'s insecure.'] } },
      { by: 'a', conf: "If it was nothing, why did it look like something?", v: { loud: ['Nothing?! It didn\'t look like nothing!'] } },
    ] },
  ],
  'jealousy.quiet': [
    { id: 'jl.q1', turns: [
      { beat: '{a} watches {b} and {c} laughing together by the pool.' },
      { by: 'a', conf: "I'm not jealous. I'm just paying attention.", v: { sharp: ['{b} should be very careful.'], soft: ['I know it\'s nothing. It still makes my stomach hurt.'] } },
    ] },
    { id: 'jl.q2', turns: [
      { by: 'a', say: "You and {b} seem close." },
      { by: 'c', say: "We're just friends.", v: { soft: ['Hey, it\'s you I like. You know that.'] } },
      { by: 'a', conf: "{c} says friends. I'll believe it when I stop seeing them together.", v: { soft: ['I want to believe {c}. I really do.'] } },
    ] },
    { id: 'jl.q3', turns: [
      { by: 'a', conf: "{b} keeps hanging around {c}. I'm not going to make a scene. I'm just going to remember it.", v: { loud: ['If {b} touches {c} one more time, I swear!'] } },
    ] },
  ],

  // ── ROMANCE ─────────────────────────────────────────────────────────
  'flirt.back': [
    { id: 'fl.b1', turns: [
      { by: 'a', say: "Has anybody told you you look really good today?", v: { odd: ['Is it hot out here, or is it just you? It\'s both. It\'s really hot out here.'], sharp: ['You clean up nice. Don\'t let it go to your head.'] } },
      { by: 'b', say: "Maybe. It's nicer coming from you, though.", v: { soft: ['Stop it. You\'re going to make me blush.'] } },
      { by: 'a', conf: "{b} smiled. {b} actually smiled. I'm going to be thinking about that all night.", v: { sharp: ['{b} is interested. Good. Very good.'] } },
    ] },
    { id: 'fl.b2', turns: [
      { by: 'a', say: "Save me a seat at dinner?", v: { loud: ['Hey! You! Sit with me at dinner!'] } },
      { by: 'b', say: "Already saved it.", v: { odd: ['I saved you two. In case you\'re hungry.'] } },
      { by: 'b', conf: "Okay, I'm not going to pretend. I like {a}. A lot.", v: { sharp: ['{a} is fun. That\'s all I\'m admitting.'] } },
    ] },
    { id: 'fl.b3', turns: [
      { beat: '{a} and {b} end up on the same lounger, closer than they need to be.' },
      { by: 'b', say: "This is a really small chair.", v: { odd: ['Did this chair get smaller? I think it shrank.'] } },
      { by: 'a', say: "I'm not complaining.", v: { soft: ['I don\'t mind. Do you mind?'] } },
    ] },
  ],
  'flirt.rebuffed': [
    { id: 'fl.r1', turns: [
      { by: 'a', say: "So... want to go for a swim later? Just us?", v: { loud: ['Swim with me! Right now! Let\'s go!'] } },
      { by: 'b', say: "I think I'm going to hang with the group, actually.", v: { sharp: ['I\'m good, thanks.'] } },
      { by: 'a', conf: "That was a no. That was definitely a no. I'm going to go stare at the ocean now.", v: { sharp: ['Fine. That\'s {b}\'s loss.'] } },
    ] },
    { id: 'fl.r2', turns: [
      { by: 'a', say: "You've got a really great laugh, you know that?" },
      { by: 'b', say: "Thanks. Anyway, I should go.", v: { soft: ['Aw, that\'s sweet. I\'ve got to go help with dinner, though.'] } },
      { by: 'a', conf: "I just got shot down on camera, right in front of the pool. Great.", v: { soft: ['Okay. That hurt a little.'] } },
    ] },
    { id: 'fl.r3', turns: [
      { by: 'a', say: "Want to share my blanket? It's cold out here." },
      { by: 'b', say: "I'm actually pretty warm.", v: { sharp: ['Smooth. No.'] } },
      { beat: '{a} sits alone with the blanket for a long, awkward minute.' },
    ] },
  ],
  'beach-date.any': [
    { id: 'bd.1', turns: [
      { beat: '{a} and {b} walk along the beach, away from everybody.' },
      { by: 'a', say: "Do you ever think about what happens when we get out of here?", v: { sharp: ['Can I tell you something I won\'t say in the villa?'] } },
      { by: 'b', say: "All the time. Mostly about you.", v: { odd: ['Mostly about pizza. And you. Pizza and you.'] } },
      { by: 'a', conf: "{b} is the only person in here I really trust. That's scary, and I don't care.", v: { sharp: ['Everybody in that house wants to split us up. Let them try.'] } },
    ] },
    { id: 'bd.2', turns: [
      { by: 'b', say: "We should be careful. People are starting to see us as a pair.", v: { soft: ['I don\'t want them to come after you because of me.'] } },
      { by: 'a', say: "Let them. I'm not hiding it.", v: { soft: ['I don\'t care if they do.'] } },
      { by: 'b', conf: "Being a couple in here puts a target on both of us. I'd still rather have {a} than not.", v: { sharp: ['Being a couple means two votes, which is power, but it also makes us a target.'] } },
    ] },
    { id: 'bd.3', turns: [
      { beat: '{a} and {b} sit on the sand watching the sun go down.' },
      { by: 'a', say: "This is the first time all day I've been able to relax.", v: { odd: ['If TJ shows up right now, I\'m throwing a coconut at him.'] } },
      { by: 'b', say: "Me too." },
    ] },
  ],
  'pda.any': [
    { id: 'pd.1', turns: [
      { beat: '{b} and {c} are wrapped around each other on the couch. {a} is trying to watch TV.' },
      { by: 'a', say: "Can you two get a room? Any room? Please?", v: { loud: ['GET A ROOM!'], soft: ['Guys, maybe just a little less? For the rest of us?'] } },
      { by: 'b', say: "Jealous?", v: { soft: ['Sorry, sorry.'] } },
      { by: 'a', conf: "It's not just annoying. A couple in this house is two votes, and that makes them dangerous.", v: { odd: ['I have seen things on that couch that I cannot unsee.'] } },
    ] },
    { id: 'pd.2', turns: [
      { by: 'a', say: "Breakfast, not a make-out session.", v: { dry: ['I\'m trying to eat. This is really not helping.'] } },
      { by: 'c', say: "Mind your own business.", v: { soft: ['Okay, okay, we\'ll stop.'] } },
      { by: 'a', conf: "{b} and {c} need to be split up. For the game, and for my appetite.", v: { soft: ['They\'re cute. They\'re also a voting bloc.'] } },
    ] },
    { id: 'pd.3', turns: [
      { by: 'a', say: "Every time I turn around, you two are kissing.", v: { loud: ['EVERY TIME I TURN AROUND!'] } },
      { by: 'b', say: "Then stop turning around.", v: { odd: ['Then don\'t turn around! Easy fix!'] } },
    ] },
  ],
  'ex-in-the-house.rekindle': [
    { id: 'ex.r1', turns: [
      { by: 'a', say: "So. This is weird.", v: { loud: ['Okay, this is SO weird!'] } },
      { by: 'b', say: "It doesn't have to be.", v: { soft: ['I\'ve missed you, you know.'] } },
      { by: 'a', conf: "{b} and I didn't end things well. But seeing {b} again... I don't know. Something's still there.", v: { sharp: ['I swore I was done with {b}. I wasn\'t.'] } },
    ] },
    { id: 'ex.r2', turns: [
      { by: 'b', say: "I didn't think I'd ever see you again." },
      { by: 'a', say: "Well, here we are.", v: { soft: ['I thought about you a lot, after.'] } },
      { by: 'b', conf: "Everybody's going to think we're a couple again. Maybe they're right.", v: { sharp: ['Having history with {a} could hurt my game. I don\'t care.'] } },
    ] },
    { id: 'ex.r3', turns: [
      { beat: '{a} and {b} talk late into the night by the pool.' },
      { by: 'a', conf: "I came here to win. I did not come here to fall for {b} all over again.", v: { odd: ['Okay, my ex is still really cute. I forgot about that.'] } },
    ] },
  ],
  'ex-in-the-house.cold': [
    { id: 'ex.c1', turns: [
      { by: 'a', say: "Of all the people. You.", v: { loud: ['YOU?! Of course it\'s you!'] } },
      { by: 'b', say: "Nice to see you too.", v: { soft: ['Hi. I hoped we could be okay.'] } },
      { by: 'a', conf: "My ex is in this house. I'm going to have to see {b} every single day.", v: { soft: ['I thought I was over it. Seeing {b} again, I\'m not so sure.'] } },
    ] },
    { id: 'ex.c2', turns: [
      { by: 'b', say: "Can we at least be civil?" },
      { by: 'a', say: "Civil. Sure. From over there.", v: { sharp: ['Stay on your side of the villa.'] } },
      { by: 'b', conf: "{a} won't even look at me. I guess that answers that.", v: { sharp: ['Fine. If {a} wants a cold war, that\'s what we\'ll have.'] } },
    ] },
    { id: 'ex.c3', turns: [
      { by: 'a', conf: "There's a reason {b} and I broke up. I don't need a reminder every morning at breakfast.", v: { odd: ['My ex is here. My EX. Who books this show?'] } },
    ] },
  ],

  // ── THE GAME ────────────────────────────────────────────────────────
  'overheard.any': [
    { id: 'ov.1', turns: [
      { beat: '{a} comes up the stairs and stops outside a half-open door. {b} is talking inside.' },
      { by: 'b', say: "...it has to be {a} this week. {a} is too dangerous." },
      { by: 'a', conf: "I heard my name come out of {b}'s mouth. Now I know exactly where I stand.", v: { loud: ['I HEARD THAT! I heard every word!'], soft: ['My heart dropped. I thought {b} liked me.'], sharp: ['Good. At least now I know.'] } },
    ] },
    { id: 'ov.2', turns: [
      { beat: '{a} is lying on a bunk with headphones in, pretending to listen to music.' },
      { by: 'b', say: "We just have to get {a} in before anybody tips {a.obj} off." },
      { by: 'a', conf: "Too late, {b}. I already figured it out.", v: { odd: ['Fake headphones. Oldest trick in the book. They fell for it.'], soft: ['I lay there pretending to sleep, and I wanted to cry.'] } },
    ] },
    { id: 'ov.3', turns: [
      { by: 'a', conf: "I overheard {b} planning to send me in. So now I'm planning too.", v: { loud: ['{b} wants a fight? {b} has one!'], sharp: ['{b} should have checked who was in the hallway.'] } },
    ] },
  ],
  'ride-to-the-final.any': [
    { id: 'rf.1', turns: [
      { by: 'a', say: "Hear me out. You and me aren't competing against each other. Different divisions.", v: { loud: ['You and me! Final! Together! Let\'s do it!'] } },
      { by: 'b', say: "So you're saying we take each other all the way.", v: { sharp: ['So we\'re useful to each other. I like it.'] } },
      { by: 'a', say: "All the way to the final. I've got your back, you've got mine." },
      { by: 'b', conf: "We're never in the same elimination, so we never have to choose between ourselves and each other. That's the safest deal anybody can make in here.", v: { sharp: ['{a} can\'t take my spot, and can protect me. That\'s an easy deal to make.'], soft: ['It feels good to have somebody I don\'t have to worry about.'] } },
    ] },
    { id: 'rf.2', turns: [
      { by: 'b', say: "Final? You and me?", v: { soft: ['Promise me we\'ll get to the end together.'] } },
      { by: 'a', say: "Final. Shake on it.", v: { sharp: ['Final. Break it and I\'ll know.'] } },
      { by: 'a', conf: "I trust {b} more than anybody in here. And {b} can't take my spot in the final. Perfect partner.", v: { sharp: ['{b} is useful, and can\'t hurt me. That\'s the partner I want.'] } },
    ] },
    { id: 'rf.3', turns: [
      { by: 'a', say: "We should look out for each other. Like, all the way." },
      { by: 'b', say: "I was thinking the same thing.", v: { odd: ['I was going to say the same thing!'] } },
    ] },
  ],
  'loyalty-test.leaks': [
    { id: 'lt.l1', turns: [
      // keep: the long cut answers it with "Who?" (the sharp take said only "This stays between us. I mean it.", read 2026-10-18)
      { by: 'a', keep: ['somebody'], say: "Keep this to yourself, but I'm thinking about going after somebody unexpected this week.", v: { sharp: ["This stays between us. I'm going after somebody nobody expects this week."] } },
      { by: 'b', say: "My lips are sealed." },
      { by: 'a', conf: "I made it up. Every word. And it came back to me by dinner from somebody else. Now I know {b} talks.", v: { loud: ['IT CAME BACK TO ME! In one day! {b}!'] } },
    ] },
    { id: 'lt.l2', turns: [
      { by: 'a', conf: "I told {b} one fake name. Just one. If I hear it again, I'll know exactly where it came from. I heard it again.", v: { soft: ['I really wanted {b} to pass. {b} didn\'t.'] } },
    ] },
    { id: 'lt.l3', turns: [
      { by: 'a', say: "Interesting. Somebody just repeated something I only told you." },
      { by: 'b', say: "What? No. I didn't say anything.", v: { soft: ['I swear, I didn\'t mean to!'] } },
      { by: 'a', conf: "{b} failed the test. {b} doesn't even know there was one.", v: { soft: ['That hurt more than I thought it would.'] } },
    ] },
  ],
  'loyalty-test.holds': [
    { id: 'lt.h1', turns: [
      { by: 'a', conf: "I told {b} something fake to see if it would get around. It didn't. {b} kept it to {b.ref}. That's somebody I can work with.", v: { soft: ['{b} passed. I\'m so relieved.'] } },
    ] },
    { id: 'lt.h2', turns: [
      { by: 'a', say: "Did you tell anybody what I told you?" },
      { by: 'b', say: "No. Why would I?", v: { sharp: ['Of course not. I don\'t gossip.'] } },
      { by: 'a', conf: "{b} didn't say a word to anyone. Good. {b} just moved up my list.", v: { sharp: ['{b} passed. I trust {b}, for now.'] } },
    ] },
    { id: 'lt.h3', turns: [
      { by: 'a', conf: "Every alliance has a leak. Turns out it isn't {b}.", v: { odd: ['{b} is a vault. A very quiet vault.'] } },
    ] },
  ],
  'vet-mentors-rookie.any': [
    { id: 'vm.1', turns: [
      { beat: '{a} is showing {b} how to brace for a pole wrestle in the gym.' },
      { by: 'a', say: "Lower. Your power's in your legs, not your arms.", v: { loud: ['LOWER! Legs! Use your legs!'], soft: ['Okay, try getting a little lower. There you go. That\'s it.'] } },
      { by: 'b', say: "Like this?", v: { sharp: ['Like this. Got it.'] } },
      { by: 'b', conf: "{a} didn't have to help me. {a} did anyway. I won't forget that.", v: { sharp: ['{a} helping me is either kindness or strategy. I\'ll take it either way.'] } },
    ] },
    { id: 'vm.2', turns: [
      { by: 'a', say: "First Arena is the worst. After that it's just a game.", v: { sharp: ['Don\'t think. Just win.'] } },
      { by: 'b', say: "How do you not panic?", v: { soft: ['I\'m so scared of going in there.'] } },
      { by: 'a', say: "You do panic. You just keep moving while you panic.", v: { odd: ['Everybody\'s scared. You just keep moving.'] } },
    ] },
    { id: 'vm.3', turns: [
      { by: 'a', conf: "{b} reminds me of me my first season. Somebody helped me, so I'm helping {b}.", v: { sharp: ['A rookie who owes me a favor is a good thing to have.'] } },
    ] },
  ],
  'scheme-lie.believed': [
    { id: 'sl.b1', turns: [
      { by: 'a', say: "I shouldn't tell you this, but I heard {c} say your name this morning.", keep: ['{c}'], v: { soft: ['I just think you should know. I heard {c} say your name this morning.'] } },
      { by: 'b', say: "{c}? Are you serious?", v: { loud: ['{c}?! Are you SERIOUS?!'] } },
      { by: 'a', say: "I'm just looking out for you." },
      { by: 'a', conf: "{c} never said anything about {b}. But now {b} thinks {c} did, and that's what matters.", v: { loud: ['That worked better than I thought it would.'] } },
    ] },
    { id: 'sl.b2', turns: [
      { by: 'a', say: "Watch out for {c}. I mean it.", v: { sharp: ['{c} is coming for you. I\'d move first.'] } },
      { by: 'b', say: "Thanks for telling me. I owe you.", v: { soft: ['I had no idea. Thank you.'] } },
      { by: 'a', conf: "Now {b} doesn't trust {c}. That's all I wanted.", v: { odd: ['I\'m kind of evil, and I\'m okay with that.'] } },
    ] },
    { id: 'sl.b3', turns: [
      { by: 'a', say: "Don't say I told you, but {c} has been talking about you." },
      { by: 'b', conf: "I didn't want to believe it. But why would {a} lie to me?", v: { sharp: ['{c} is on my list now.'] } },
    ] },
  ],
  'scheme-lie.seen': [
    { id: 'sl.s1', turns: [
      { by: 'a', say: "I think {c} is coming for you. Just a heads-up.", v: { sharp: ['{c} wants you gone. Thought you should know.'] } },
      { by: 'b', say: "Really? Because {c} told me the exact same thing about you.", v: { dry: ['Funny. You\'re the third person to warn me about someone today.'] } },
      { by: 'b', conf: "{a} thinks I'm stupid. I'm not. I know a setup when I hear one.", v: { soft: ['I really wanted to trust {a}. I can\'t now.'] } },
    ] },
    { id: 'sl.s2', turns: [
      { by: 'a', say: "{c} has been saying some stuff about you." },
      { by: 'b', say: "Like what? Be specific.", v: { loud: ['LIKE WHAT, {a}?'] } },
      { by: 'a', say: "Just... stuff." },
      { by: 'b', conf: "Just stuff. Okay. {a} is lying to me, and not even well.", v: { soft: ['{a} wouldn\'t look me in the eye.'] } },
    ] },
    { id: 'sl.s3', turns: [
      { by: 'b', conf: "{a} tried to turn me against {c}. Nice try. Now I trust {a} even less.", v: { loud: ['Did {a} really think that would work on ME?!'] } },
    ] },
  ],
};
