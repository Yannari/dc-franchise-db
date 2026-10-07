// ══════════════════════════════════════════════════════════════════════
// td/script/lines/isle-more.js — more of the island moments that come up most
// ══════════════════════════════════════════════════════════════════════
//
// Same keys as lines/isle.js and lines/isle-group.js (index.js adds them up). These are
// the moments a resident lives through again and again over a season (replaying the
// vote, a rest day, leaning on somebody, a late talk), so their pools are measured
// against a whole season (tests/td-island-script.test.js: no line twice in one season).
// Variants read who is talking: register, archetype, age band ('teen', 'twenties',
// 'thirties', 'older'), age gap with the other person, and stat flags.
// Ids: 'im.'.

const VOTE = [
  { id: 'im.v1', turns: [
    { beat: '{a} is lying on {a.posAdj} back, staring at the sky, lips moving.' },
    { by: 'a', say: "I should've voted the other way. No. I should've talked to them first. No." },
    { by: 'a', conf: "There's a version of that vote where I'm still in. I can't stop looking for it." },
  ] },
  { id: 'im.v2', turns: [
    { beat: '{a} breaks a stick in half. Then in half again. Then again.' },
    { by: 'a', conf: "I had the numbers. I counted. I counted twice. Somebody lied to my face and I believed them." },
  ] },
  { id: 'im.v3', turns: [
    { beat: '{a} is walking in circles around the fire pit.' },
    { by: 'a', say: "They hugged me. That morning. They hugged me." },
    { by: 'a', conf: "It's the hug that gets me. You don't hug someone you're about to vote out. Apparently you do." },
  ] },
  { id: 'im.v4', when: { age: 'teen' }, turns: [
    { beat: '{a} sits hugging {a.posAdj} knees, scrolling through the vote in {a.posAdj} head.' },
    { by: 'a', conf: "Everybody kept calling me a kid. Then the kid got voted out. Guess they were scared of the kid." },
  ] },
  { id: 'im.v5', when: { age: 'older' }, turns: [
    { beat: '{a} sits on a log, shaking {a.posAdj} head slowly.' },
    { by: 'a', conf: "I've been lied to by bosses and landlords. Never saw it coming from someone half my age with a friendly smile." },
  ] },
  { id: 'im.v6', when: { arch: 'hero' }, turns: [
    { beat: '{a} stares at the fire, jaw tight.' },
    { by: 'a', conf: "I played it straight. I helped people. And they voted me out for it. I'd still do it the same way. I think." },
  ] },
  { id: 'im.v7', when: { arch: 'villain' }, turns: [
    { beat: '{a} smiles at nothing, which is worse than scowling.' },
    { by: 'a', conf: "They finally got me. Good for them. Enjoy it. It's the last thing they'll enjoy for a while." },
  ] },
  { id: 'im.v8', when: { arch: 'floater' }, turns: [
    { beat: '{a} is lying in the shade, fanning {a.ref} with a leaf.' },
    { by: 'a', conf: "I didn't upset anybody. I didn't threaten anybody. I didn't do anything. Maybe that was the problem." },
  ] },
  { id: 'im.v9', when: { arch: 'goat' }, turns: [
    { beat: '{a} pokes at the sand with a stick.' },
    { by: 'a', conf: "Everybody said they were taking me to the end. Then they didn't. I guess they found someone easier to beat. Rude." },
  ] },
  { id: 'im.v10', when: { sly: true }, turns: [
    { beat: '{a} writes the vote out in the sand, then rubs one name out and writes another.' },
    { by: 'a', say: "If I'd gone after that one first, the numbers flip." },
    { by: 'a', conf: "I made one wrong read. One. That's all it takes in this game." },
  ] },
  { id: 'im.v11', when: { register: 'competitor' }, turns: [
    { beat: '{a} punches the sand.' },
    { by: 'a', conf: "I won challenges for them. I carried them. And the second they didn't need me, I'm gone. Lesson learned." },
  ] },
  { id: 'im.v12', when: { register: 'cool' }, turns: [
    { beat: '{a} sits very still by the water.' },
    { by: 'a', conf: "I'm not upset. I'm curious. I want to know who made the call. I'll find out when I'm back." },
  ] },
  { id: 'im.v13', when: { arch: 'showmancer' }, turns: [
    { beat: '{a} keeps looking toward the main camp, like {a.sub} can see it from here.' },
    { by: 'a', conf: "I wasn't thinking about the vote. I was thinking about the person I left behind. Is that dumb? That's probably dumb." },
  ] },
  { id: 'im.v14', when: { register: 'shy' }, turns: [
    { beat: '{a} sits far from the fire, by {a.ref}.' },
    { by: 'a', conf: "Nobody even told me. I found out when they read my name. I wish someone had just told me." },
  ] },
];
const REST = [
  { id: 'im.r1', turns: [
    { beat: '{a} lies in the shelter all morning, listening to the rain on the roof.' },
    { by: 'a', conf: "No training today. My body said no and for once I listened." },
  ] },
  { id: 'im.r2', turns: [
    { beat: '{a} sleeps right through breakfast, lunch and most of the afternoon.' },
    { by: 'a', say: "What did I miss?" },
    { by: 'a', conf: "I needed that. The island takes everything out of you. Sleep is how you get it back." },
  ] },
  { id: 'im.r3', turns: [
    { beat: '{a} floats on {a.posAdj} back in the shallows, eyes closed.' },
    { by: 'a', conf: "Rest day. Doctor's orders. The doctor is me. I'm not a doctor." },
  ] },
  { id: 'im.r4', when: { age: 'older' }, turns: [
    { beat: '{a} stretches slowly in the shade, wincing at every joint.' },
    { by: 'a', conf: "The young ones bounce back overnight. Me, I need a day off between bad ideas." },
  ] },
  { id: 'im.r5', when: { age: 'teen' }, turns: [
    { beat: '{a} naps in the shade with {a.posAdj} shirt over {a.posAdj} face.' },
    { by: 'a', conf: "At home I'd be grounded for sleeping this much. Out here it's called recovery." },
  ] },
  { id: 'im.r6', when: { register: 'fiery' }, turns: [
    { beat: '{a} is lying down, glaring at the sky.' },
    { by: 'a', say: "This is so boring. Resting is SO boring." },
    { by: 'a', conf: "I'm only resting because my leg told me to. My leg is not the boss of me. Today it is." },
  ] },
  { id: 'im.r7', when: { tough: true }, turns: [
    { beat: '{a} takes the day off and clearly hates every minute of it.' },
    { by: 'a', conf: "I could train. I could totally train. I'm choosing not to. It's a strategy. A painful strategy." },
  ] },
  { id: 'im.r8', when: { arch: 'floater' }, turns: [
    { beat: '{a} has made a little bed out of palm leaves and is lying on it, very pleased.' },
    { by: 'a', say: "Five stars. Would sleep again." },
    { by: 'a', conf: "Everybody else is killing themselves training. I'm resting up. We'll see who's fresher at the end." },
  ] },
  { id: 'im.r9', turns: [
    { beat: '{a} sits in the shade with {a.posAdj} feet in a bucket of seawater.' },
    { by: 'a', conf: "Blisters on blisters. Today the feet win." },
  ] },
  { id: 'im.r10', when: { register: 'schemer' }, turns: [
    { beat: '{a} lies in the shade with one eye open, watching the others train.' },
    { by: 'a', conf: "Let them tire themselves out. I'm saving everything for the moment it counts." },
  ] },
  { id: 'im.r11', turns: [
    { beat: '{a} spends the day re-weaving the shelter roof from a lying-down position.' },
    { by: 'a', conf: "Technically I'm resting. Technically I'm also fixing the roof. Multitasking." },
  ] },
  { id: 'im.r12', turns: [
    { beat: '{a} sits in the shallows letting the cold water do its job on {a.posAdj} sore legs.' },
    { by: 'a', say: "Oh, that's cold. Oh, that's good." },
    { by: 'a', conf: "Rest is part of the plan. A big part. My legs agree." },
  ] },
  { id: 'im.r13', turns: [
    { beat: '{a} dozes in a hammock made of an old net, swinging slowly.' },
    { by: 'a', conf: "I'm not lazy. I'm charging. Like a phone. A very tired phone." },
  ] },
  { id: 'im.r14', when: { register: 'sweet' }, turns: [
    { beat: '{a} spends the day resting and humming, weaving bracelets out of grass for everyone.' },
    { by: 'a', conf: "Can't train today. But I can make sure everybody out here has a bracelet. That counts for something." },
  ] },
  { id: 'im.r15', when: { register: 'competitor' }, turns: [
    { beat: '{a} lies down and does nothing, very aggressively.' },
    { by: 'a', say: "I'm resting. I'm resting SO hard right now." },
    { by: 'a', conf: "If resting is training, I'm going to be the best rester on this island." },
  ] },
  { id: 'im.r16', when: { age: 'twenties' }, turns: [
    { beat: '{a} sleeps until noon and wakes up with sand stuck to {a.posAdj} face.' },
    { by: 'a', conf: "Out here I sleep like I did when I was a teenager. It's the only part of this I'd keep." },
  ] },
  { id: 'im.r17', when: { register: 'shy' }, turns: [
    { beat: '{a} spends the whole day in the shade, quietly drawing in the sand.' },
    { by: 'a', conf: "A day where nobody needs anything from me. I needed one of those." },
  ] },
  { id: 'im.r18', when: { hot: true }, turns: [
    { beat: '{a} is supposed to be resting. {a} keeps getting up, pacing, and lying back down.' },
    { by: 'a', say: "Fine! FINE! I'm lying down!" },
    { by: 'a', conf: "Doing nothing is the hardest thing I've done out here." },
  ] },
  { id: 'im.r19', when: { arch: 'mastermind' }, turns: [
    { beat: '{a} lies perfectly still in the shade, eyes closed. Not asleep.' },
    { by: 'a', conf: "My body's resting. My head never rests. Right now it's three votes ahead of everyone in the game." },
  ] },
  { id: 'im.r20', turns: [
    { beat: '{a} patches up a blister with a leaf and a strip of cloth and calls it a day.' },
    { by: 'a', conf: "Tomorrow I train. Today I let the island win one." },
  ] },
];
const LEAN = [
  { id: 'im.ln1', turns: [
    { by: 'a', say: "Do you ever feel like you're going crazy out here?" },
    { by: 'b', say: "Every single day." },
    { by: 'a', say: "Oh good. It's not just me." },
    { by: 'a', conf: "Knowing {b} feels it too makes it a lot easier to get through the day." },
  ] },
  { id: 'im.ln2', when: { gap: 'younger' }, turns: [
    { by: 'a', say: "How are you so calm about all this?" },
    { by: 'b', say: "I've had a lot more practice being disappointed than you have, kid." },
    { by: 'a', say: "That's depressing." },
    { by: 'b', say: "It's useful." },
    { by: 'a', conf: "{b} is kind of like the parent of this island. Weird to say. True though." },
  ] },
  { id: 'im.ln3', when: { gap: 'older' }, turns: [
    { by: 'a', say: "I'm too old for this. Sleeping on sand. Eating rice." },
    { by: 'b', say: "You're doing better than me." },
    { by: 'a', say: "Really?" },
    { by: 'b', say: "Really. You haven't cried once. I've cried twice today." },
    { by: 'a', conf: "{b} made me feel useful. That's a big deal out here." },
  ] },
  { id: 'im.ln4', when: { register: 'shy' }, turns: [
    { beat: '{a} sits down next to {b} and doesn\'t say anything for a long time.' },
    { by: 'b', say: "You okay?" },
    { by: 'a', say: "Not really. Can I just sit here?" },
    { by: 'b', say: "Sit as long as you want." },
    { by: 'a', conf: "I'm bad at asking for help. {b} didn't make me ask." },
  ] },
  { id: 'im.ln5', turns: [
    { by: 'a', say: "Tell me something good. Anything." },
    { by: 'b', say: "The fish was really good last night." },
    { by: 'a', say: "Something better." },
    { by: 'b', say: "You're one day closer to getting out of here." },
    { by: 'a', conf: "{b} always knows what to say. I don't know how. I want to learn." },
  ] },
  { id: 'im.ln6', when: { band: 'cold' }, turns: [
    { by: 'a', say: "I know we're not exactly friends." },
    { by: 'b', say: "No, we're not." },
    { by: 'a', say: "But you're the only one awake." },
    { by: 'b', say: "Fine. Sit down. What's wrong?" },
    { by: 'b', conf: "I don't like {a} much. I still wasn't going to leave {a.obj} sitting there like that." },
  ] },
  { id: 'im.ln7', turns: [
    { beat: '{a} has been quiet all day. {b} brings over two cups of water and sits down.' },
    { by: 'b', say: "Drink. Then talk. Or don't talk. Just drink." },
    { by: 'a', say: "Thanks." },
    { by: 'a', conf: "{b} noticed I wasn't okay before I did. That's a friend." },
  ] },
];
const LATE = [
  { id: 'im.l1', turns: [
    { beat: "It's the middle of the night. {a} and {b} are the only ones awake, sitting by the embers." },
    { by: 'b', say: "What's the first thing you're eating when you get home?" },
    { by: 'a', say: "Everything. All of it. In one sitting." },
    { by: 'b', say: "Pizza. A whole one. By myself." },
    { by: 'a', conf: "We talked about food for an hour. Best hour I've had out here." },
  ] },
  { id: 'im.l2', when: { gap: 'older' }, turns: [
    { by: 'b', say: "Can I ask you something? Is it weird being out here with a bunch of kids?" },
    { by: 'a', say: "You're not kids. You just act like kids. Sometimes." },
    { by: 'b', say: "Fair." },
    { by: 'b', conf: "{a} has lived a whole life I know nothing about. Out here at night, you actually hear about it." },
  ] },
  { id: 'im.l3', when: { home: true }, turns: [
    { by: 'b', say: "What's it like back home?" },
    { by: 'a', say: "{home}? Quiet. Too quiet. That's why I came here." },
    { by: 'b', say: "And now?" },
    { by: 'a', say: "Now I'd kill for some quiet." },
    { by: 'b', conf: "I never knew where {a} was from. You learn a lot about people at three in the morning." },
  ] },
  { id: 'im.l4', when: { job: true }, turns: [
    { by: 'b', say: "What do you even do, back in the real world?" },
    { by: 'a', say: "I'm {job}." },
    { by: 'b', say: "No way. I never would've guessed." },
    { by: 'a', say: "Everybody says that." },
    { by: 'b', conf: "We spent weeks in the game together and I never asked {a} one normal question. That's on me." },
  ] },
  { id: 'im.l5', turns: [
    { by: 'a', say: "If you could go back to day one, would you still come?" },
    { by: 'b', say: "Yeah. You?" },
    { by: 'a', say: "Yeah. But I'd trust about half as many people." },
    { by: 'b', conf: "{a} said what I was thinking. Out here at night, everybody says what they're thinking." },
  ] },
  { id: 'im.l6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Can I tell you a secret? I'm not actually that tough." },
    { by: 'b', say: "I know." },
    { by: 'a', say: "You KNOW?" },
    { by: 'b', say: "You cried at the sunset yesterday." },
    { by: 'a', conf: "{b} saw me cry at a sunset. I have to win now. It's the only way to recover." },
  ] },
  { id: 'im.l7', turns: [
    { beat: "Neither {a} nor {b} can sleep. The fire's almost out." },
    { by: 'a', say: "What did you want the money for? Really?" },
    { by: 'b', say: "Honestly? To not worry for a while." },
    { by: 'a', say: "Yeah. Me too." },
    { by: 'b', conf: "Everyone out here wants the money. At night you find out what it's actually for." },
  ] },
];
const STEADY = [
  { id: 'im.s1', turns: [
    { beat: '{a} sits on a rock, watching the waves come in and go out.' },
    { by: 'a', conf: "Out here you can't do anything about the game. Weirdly, that's the most relaxing thing about it." },
  ] },
  { id: 'im.s2', turns: [
    { beat: '{a} builds a little sandcastle, then lets the tide take it.' },
    { by: 'a', say: "Bye, castle." },
    { by: 'a', conf: "Today was a good day. I didn't think about the vote once. Okay, twice." },
  ] },
  { id: 'im.s3', when: { age: 'older' }, turns: [
    { beat: '{a} walks the beach slowly in the evening, picking up shells.' },
    { by: 'a', conf: "I've been knocked down before. Lost jobs. Lost people. You get up. A vote is nothing next to that." },
  ] },
  { id: 'im.s4', when: { age: 'teen' }, turns: [
    { beat: '{a} sits at the edge of the water, letting the waves hit {a.posAdj} feet.' },
    { by: 'a', conf: "This is the longest I've ever gone without my phone. And I'm, like, fine? Who knew." },
  ] },
  { id: 'im.s5', when: { arch: 'wildcard' }, turns: [
    { beat: '{a} is talking to a crab about the meaning of life.' },
    { by: 'a', say: "And that's why we can't let one vote define us. Right? Right." },
    { by: 'a', conf: "The crab gets it. The crab is very wise." },
  ] },
  { id: 'im.s6', when: { calm: true }, turns: [
    { beat: '{a} lies in the shade, completely at peace.' },
    { by: 'a', conf: "Getting angry won't get me back in. Getting ready will. So I'm calm. And getting ready." },
  ] },
  { id: 'im.s7', turns: [
    { beat: '{a} wakes up, stretches, and smiles at the sunrise for the first time in days.' },
    { by: 'a', conf: "Something changed today. I stopped being mad. I started being ready." },
  ] },
];
const GRIND = [
  { id: 'im.g1', turns: [
    { beat: '{a} has drawn a calendar in the sand and crosses off another day.' },
    { by: 'a', conf: "Every cross is a day I didn't quit. That's the only thing I'm counting." },
  ] },
  { id: 'im.g2', turns: [
    { beat: "{a} runs the beach in the dark before sunrise, so nobody sees the work." },
    { by: 'a', conf: "If the others don't know how ready I am, they won't see me coming." },
  ] },
  { id: 'im.g3', when: { age: 'older' }, turns: [
    { beat: '{a} is up before dawn, doing a slow, steady routine by the fire.' },
    { by: 'a', conf: "Same routine every day. Up, stretch, water, walk. Boring works. Ask anyone my age." },
  ] },
  { id: 'im.g4', when: { register: 'fiery' }, turns: [
    { beat: '{a} does push-ups, saying the name of someone in the game on each one.' },
    { by: 'a', conf: "Twenty push-ups. Twenty names. Some names got two." },
  ] },
  { id: 'im.g5', when: { arch: 'underdog' }, turns: [
    { beat: '{a} trains alone at the far end of the beach, again.' },
    { by: 'a', conf: "Nobody expects me to make it back. I've never once been the person people expected. I'm used to proving it." },
  ] },
  { id: 'im.g6', turns: [
    { beat: '{a} ties a stone to a vine and practises throwing it at a target on a tree. Again. And again.' },
    { by: 'a', say: "Hit! Finally!" },
    { by: 'a', conf: "Could be useless. Could be the thing that gets me back in. I'll take the chance." },
  ] },
];
const CLOSE = [
  { id: 'im.c1', when: { gap: 'older' }, turns: [
    { by: 'b', say: "You remind me of someone back home. They say the same things you do." },
    { by: 'a', say: "Is that good?" },
    { by: 'b', say: "They're my favourite person." },
    { by: 'a', conf: "Out here {b} is kind of like family. I didn't expect that." },
  ] },
  { id: 'im.c2', turns: [
    { beat: '{a} and {b} share the last dry blanket, back to back.' },
    { by: 'b', say: "Your feet are freezing." },
    { by: 'a', say: "Your elbows are sharp." },
    { by: 'b', say: "Goodnight." },
    { by: 'a', conf: "That's friendship on an island. Cold feet, sharp elbows, nobody leaves." },
  ] },
  { id: 'im.c3', when: { alliance: true }, turns: [
    { by: 'a', say: "We were a team in there. We're still a team out here." },
    { by: 'b', say: "Always." },
    { by: 'b', conf: "Getting voted out didn't break us. If anything we're closer." },
  ] },
  { id: 'im.c4', turns: [
    { by: 'a', say: "I saved you the biggest piece of fish." },
    { by: 'b', say: "You didn't have to do that." },
    { by: 'a', say: "I know. Eat it before I change my mind." },
    { by: 'b', conf: "{a} would give me the last piece of anything. I'd do the same. That's how we survive out here." },
  ] },
  { id: 'im.c5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Don't tell anyone, but you're my favourite person out here." },
    { by: 'b', say: "Is that a strategy?" },
    { by: 'a', say: "For once? No." },
    { by: 'a', conf: "I don't do friends. {b} snuck in anyway. Annoying." },
  ] },
];
const BROKEN = [
  { id: 'im.b1', turns: [
    { beat: '{a} is sitting in the rain, not bothering to go inside.' },
    { by: 'a', conf: "I don't care anymore. That's the scary part. I don't care if I'm wet. I don't care about anything." },
  ] },
  { id: 'im.b2', when: { age: 'teen' }, turns: [
    { beat: '{a} is curled up in the shelter, crying quietly.' },
    { by: 'a', conf: "I just want to go home. I want my own bed and I want somebody to make me dinner. I'm sorry. I know that sounds dumb." },
  ] },
  { id: 'im.b3', when: { age: 'older' }, turns: [
    { beat: '{a} sits alone at the water\'s edge, shoulders shaking.' },
    { by: 'a', conf: "I thought I was too old to cry over a game. Turns out you're never too old." },
  ] },
  { id: 'im.b4', when: { register: 'competitor' }, turns: [
    { beat: '{a} sits staring at the sand, not training, for the first time since arriving.' },
    { by: 'a', conf: "I've never felt this weak. Not my body. My head. I don't know how to train my head." },
  ] },
  { id: 'im.b5', when: { arch: 'hero' }, turns: [
    { beat: '{a} sits apart from the group with {a.posAdj} head down.' },
    { by: 'a', conf: "I'm supposed to be the one who keeps everyone going. I can't even keep me going." },
  ] },
];
const SPAR = [
  { id: 'im.sp1', when: { gap: 'older' }, turns: [
    { by: 'b', say: "Bet I can beat you at this." },
    { by: 'a', say: "Bet you can't. I've had a lot more years to get stubborn." },
    { beat: 'They spend the afternoon {drill}. {a} does not lose.' },
    { by: 'b', conf: "{a} might be older but {a} does not quit. I'm a little scared now." },
  ] },
  { id: 'im.sp2', turns: [
    { beat: '{a} and {b} spend the morning {drill}, keeping score in the sand.' },
    { by: 'b', say: "Seven to six. Me." },
    { by: 'a', say: "Best of twenty." },
    { by: 'a', conf: "We're going to keep going until I win. Which might be dinner. Might be tomorrow." },
  ] },
  { id: 'im.sp3', when: { band: 'cold' }, turns: [
    { beat: "{a} and {b} don't really like each other. They end up {drill} anyway, because nobody else will." },
    { by: 'a', say: "This doesn't mean we're friends." },
    { by: 'b', say: "Wouldn't dream of it." },
    { by: 'b', conf: "{a} pushed me harder than anyone. I'm never telling {a.obj} that." },
  ] },
  { id: 'im.sp4', turns: [
    { beat: '{a} and {b} are {drill}, both completely exhausted and both refusing to stop first.' },
    { by: 'a', say: "You can stop if you want." },
    { by: 'b', say: "You stop." },
    { by: 'a', conf: "Neither of us stopped. The sun went down. We were still going." },
  ] },
];
const COMEDY = [
  { id: 'im.co1', when: { gap: 'older' }, turns: [
    { by: 'b', say: "Wait, you don't know what a meme is?" },
    { by: 'a', say: "I know what a meme is. I just don't care." },
    { by: 'b', say: "That's worse." },
    { by: 'a', conf: "{b} spent an hour explaining the internet to me. With sticks. In the sand." },
  ] },
  { id: 'im.co2', turns: [
    { beat: '{a} is trying to catch a fish with {a.posAdj} bare hands. {b} narrates from the shore like a nature documentary.' },
    { by: 'b', say: "And here we see the wild {a}, in {a.posAdj} natural habitat. Failing." },
    { by: 'a', say: "I can hear you!" },
    { by: 'a', conf: "I didn't catch a fish. {b} didn't stop narrating for an hour." },
  ] },
  { id: 'im.co3', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Okay, rate my survival skills out of ten." },
    { by: 'b', say: "Two." },
    { by: 'a', say: "TWO?" },
    { by: 'b', say: "One for the fire. One for the attitude." },
    { by: 'a', conf: "Two out of ten. I'm framing it." },
  ] },
];
const T_CLOSE = [
  { id: 'im.tc1', turns: [
    { by: 'c', say: "You two are always together. It's like a little club." },
    { by: 'a', say: "It's an open club." },
    { by: 'b', say: "Membership is one coconut." },
    { by: 'c', say: "I'll get a coconut." },
    { by: 'c', conf: "Best coconut I ever spent." },
  ] },
  { id: 'im.tc2', when: { gap: 'older' }, turns: [
    { by: 'b', say: "{a} is basically the island mom." },
    { by: 'c', say: "Island dad." },
    { by: 'a', say: "Island person who makes sure you two eat. Sit down." },
    { by: 'b', conf: "{a} takes care of everybody. {c} and I would be lost without {a.obj}." },
  ] },
  { id: 'im.tc3', turns: [
    { beat: '{a}, {b} and {c} lie in a row on the warm sand, too tired to move.' },
    { by: 'c', say: "This is nice." },
    { by: 'b', say: "This is the nicest it's been." },
    { by: 'a', say: "Don't jinx it." },
    { beat: 'A wave soaks all three of them.' },
    { by: 'a', conf: "I told them not to jinx it." },
  ] },
  { id: 'im.tc4', turns: [
    { by: 'a', say: "Rate the island out of ten. Go." },
    { by: 'c', say: "Three. Minus one for {b}'s snoring." },
    { by: 'b', say: "I don't snore!" },
    { by: 'a', say: "Two, then." },
    { by: 'c', conf: "We're a weird little family. I wouldn't change it." },
  ] },
];
const T_LATE = [
  { id: 'im.tl1', when: { home: true }, turns: [
    { by: 'c', say: "Where's everybody from? I don't even know." },
    { by: 'a', say: "{home}." },
    { by: 'b', say: "Really? That's so far." },
    { by: 'a', say: "Feels further from here." },
    { by: 'c', conf: "We spent weeks in the same game and never asked each other where we're from. Out here we finally did." },
  ] },
  { id: 'im.tl2', turns: [
    { by: 'b', say: "Okay. Biggest regret in the game. Go." },
    { by: 'a', say: "Trusting the wrong person." },
    { by: 'c', say: "Not trusting the right one." },
    { by: 'b', say: "Talking too much at the vote." },
    { by: 'c', conf: "Three regrets. Three ways to get voted out. We know them all now." },
  ] },
  { id: 'im.tl3', when: { job: true }, turns: [
    { by: 'b', say: "So what do you all do back home?" },
    { by: 'a', say: "I'm {job}." },
    { by: 'c', say: "Seriously? You never said." },
    { by: 'a', say: "Nobody asked. We were busy plotting." },
    { by: 'b', conf: "You learn more about people in one night out here than in a whole game." },
  ] },
  { id: 'im.tl4', turns: [
    { beat: "It's late. {a}, {b} and {c} are still up, poking at the last of the fire." },
    { by: 'a', say: "Truth or dare. No dares. Just truth." },
    { by: 'b', say: "That's just truth." },
    { by: 'c', say: "Fine. Truth. Who here would you take to the end?" },
    { beat: 'Nobody answers. Then everybody laughs.' },
    { by: 'b', conf: "The one question nobody answers. Even out here." },
  ] },
  { id: 'im.tl5', turns: [
    { by: 'c', say: "What's the nicest thing anyone did for you in the game?" },
    { by: 'a', say: "Somebody gave me their blanket on the cold night. Never said a word about it." },
    { by: 'b', say: "Someone saved me some rice when I missed dinner." },
    { by: 'c', say: "Huh. People were nicer than I remember." },
    { by: 'a', conf: "We spend so much time on who stabbed us. Nice to remember the other stuff." },
  ] },
  { id: 'im.tl6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, who's the most annoying person still in the game? Go." },
    { by: 'b', say: "Easy." },
    { by: 'c', say: "Too easy." },
    { beat: 'They say the same name at the same time and fall over laughing.' },
    { by: 'c', conf: "Nothing brings people together like hating the same person." },
  ] },
];

export default {
  'isle.alone.vote': VOTE, 'isle.rest.any': REST, 'isle.pair.lean': LEAN, 'isle.pair.late': LATE,
  'isle.alone.steady': STEADY, 'isle.alone.grind': GRIND, 'isle.pair.close': CLOSE, 'isle.mind.broken': BROKEN,
  'isle.pair.spar': SPAR, 'isle.pair.comedy': COMEDY, 'isle.trio.close': T_CLOSE, 'isle.trio.late': T_LATE,
};
