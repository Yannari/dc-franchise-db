// ══════════════════════════════════════════════════════════════════════
// td/script/lines/plot.js — schemes at camp, as scenes (social-manipulation.js)
// ══════════════════════════════════════════════════════════════════════
//
// The shared generators decide every scheme and apply its consequences; Big
// Brother words them in bb/script/lines/scheme.js. These are Total Drama's
// words for the same results, chosen in camp-events.js (_plotScene).
//
//   plot.note      a plants a note for b about {target}        believed | doubt
//                  b traces the note back to a                  exposed
//   plot.lie       a lies to b about {target}                   believed | rejected
//                  a, who was lied to, confronts b              confront ({target} told the lie)
//                  a warns b that {target} is using b's name    warned
//   plot.comfort   a looks after b, who a scheme just hit       any
//   plot.exposed   a exposes b's scheming to the whole camp     any
//   plot.whisper   a plants doubts about {target} with b        spread
//                  a, the target, traces the whispers to b      exposed
//   plot.rally     a turns b against {target}                   any
//   plot.majority  a sells b a fake vote on {target}            fooled | refused
//   plot.kiss      a moves on b while {other} keeps c away;     setup
//                  c walks back in
//                  b, the partner, sees through a               failed
//                  a, who saw it, confronts b                   heartbroken | over ({target} set it up)
//
// Ids: 'plt.'.

const NOTE_BELIEVED = [
  { id: 'plt.nb1', turns: [
    { beat: '{a} slips a folded piece of paper into {b}\'s bag and walks off whistling.' },
    { by: 'b', conf: "Somebody left me a note. It says {target} has been pushing my name. I don't know who wrote it. But it fits." },
  ] },
  { id: 'plt.nb2', turns: [
    { beat: '{b} reads the note twice, folds it up small and puts it away.' },
    { by: 'a', say: "You okay? You look like you saw a ghost." },
    { by: 'b', say: "I'm fine. Have you noticed anything weird about {target} lately?" },
    { by: 'a', say: "Now that you mention it..." },
  ] },
  { id: 'plt.nb3', turns: [
    { by: 'a', conf: "I wrote a note. I made it look like {target} wrote it. {b} found it right where I left it, and now {b} won't even sit near {target}." },
  ] },
  { id: 'plt.nb4', turns: [
    { by: 'b', say: "{a}, read this. Tell me I'm crazy." },
    { by: 'a', say: "Whoa. That's {target}'s writing?" },
    { by: 'b', say: "Who else would write it?" },
    { by: 'a', conf: "Me. I would." },
  ] },
  { id: 'plt.nb5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "A rumor you can argue with. A note in someone's own handwriting? That's evidence. Mine just happens to be fake." },
    { beat: '{b} is staring at {target} from across camp, the note still in hand.' },
  ] },
  { id: 'plt.nb6', when: { registerB: 'fiery' }, turns: [
    { by: 'b', say: "I KNEW it! I knew {target} was two-faced!" },
    { by: 'a', say: "Shh! Keep it down. You don't want {target} to know you know." },
    { by: 'b', conf: "{target} is going to regret ever writing that." },
  ] },
  { id: 'plt.nb7', when: { registerB: 'shy' }, turns: [
    { beat: '{b} hides the note in a sock and doesn\'t say a word about it all afternoon.' },
    { by: 'b', conf: "I thought {target} liked me. I guess I'm the last to find out about everything." },
    { by: 'a', conf: "Poor {b}. Anyway." },
  ] },
  { id: 'plt.nb8', turns: [
    { by: 'b', say: "Is this a note? For me? Aw." },
    { beat: '{b} reads on. The smile goes away.' },
    { by: 'a', conf: "I wasn't sure {b} would buy it. {b} bought it in about four seconds." },
  ] },
];

const NOTE_DOUBT = [
  { id: 'plt.nd1', turns: [
    { by: 'b', say: "{a}, does this look like {target}'s handwriting to you?" },
    { by: 'a', say: "I mean... I guess?" },
    { by: 'b', say: "Huh. I don't know." },
    { by: 'b', conf: "Either {target} wrote it or someone wants me to think so. I'm going to watch both." },
  ] },
  { id: 'plt.nd2', turns: [
    { beat: '{b} reads the note, turns it over, and reads it again.' },
    { by: 'b', conf: "It's a little too convenient. A note just shows up saying exactly what I was scared of? Still. I'm keeping it." },
    { by: 'a', conf: "{b} didn't freak out. That's fine. It's in there now." },
  ] },
  { id: 'plt.nd3', turns: [
    { by: 'b', say: "Funny thing. {target} spells my name right in this note." },
    { by: 'a', say: "So?" },
    { by: 'b', say: "{target} has never once spelled my name right." },
    { by: 'a', conf: "Okay, so maybe I overdid it." },
  ] },
  { id: 'plt.nd4', turns: [
    { by: 'a', say: "What's that?" },
    { by: 'b', say: "Nothing. Probably nothing." },
    { by: 'b', conf: "I'm not going to blow up {target}'s game over a piece of paper. But I'm not going to forget I read it, either." },
  ] },
  { id: 'plt.nd5', when: { registerB: 'cool' }, turns: [
    { by: 'b', conf: "I found a note about {target}. Here's my problem: real alliances don't write things down. So either {target} is an idiot, or somebody is playing me." },
    { beat: '{b} glances over at {a}, who is very busy with the fire.' },
  ] },
  { id: 'plt.nd6', when: { registerB: 'sweet' }, turns: [
    { by: 'b', say: "I don't want to believe {target} would say that about me." },
    { by: 'a', say: "Then don't. But maybe be careful." },
    { by: 'b', conf: "{a} is right. I'll be nice to {target}. Just... carefully nice." },
  ] },
];

const NOTE_EXPOSED = [
  { id: 'plt.ne1', turns: [
    { by: 'b', say: "{a}. This is your handwriting." },
    { by: 'a', say: "That's insane. Everyone writes like that." },
    { by: 'b', say: "Everyone does that little loop on the Y? Everyone?" },
    { beat: '{a} has nothing.' },
  ] },
  { id: 'plt.ne2', turns: [
    { beat: '{b} holds the note up in front of the whole group.' },
    { by: 'b', say: "Somebody wanted me to turn on {target}. I asked around. It took me an hour to find out it was {a}." },
    { by: 'a', say: "You can't prove that." },
    { by: 'b', say: "You were the only one with a pen." },
  ] },
  { id: 'plt.ne3', when: { registerB: 'fiery' }, turns: [
    { by: 'b', say: "You FORGED a NOTE? Who even does that?!" },
    { by: 'a', say: "Keep your voice down!" },
    { by: 'b', say: "No! Everybody should hear this!" },
  ] },
  { id: 'plt.ne4', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "Nice try with the note." },
    { by: 'a', say: "I have no idea what you're talking about." },
    { by: 'b', say: "Sure you don't." },
    { by: 'a', conf: "Okay. Note to self: no more notes." },
  ] },
  { id: 'plt.ne5', turns: [
    { by: 'b', conf: "The note was too perfect. Nobody writes down their whole plan. Then I remembered {a} asking me which bag was mine. Yesterday. For no reason." },
    { by: 'b', say: "Why'd you want to know which bag was mine, {a}?" },
    { by: 'a', say: "I... was going to borrow sunscreen?" },
  ] },
  { id: 'plt.ne6', when: { registerB: 'shy' }, turns: [
    { by: 'b', say: "{a}? Um. I know you wrote this." },
    { by: 'a', say: "What? No." },
    { by: 'b', say: "I watched you do it. I didn't say anything because I wanted to see what you'd do with it." },
    { by: 'a', conf: "The quiet ones. It's always the quiet ones." },
  ] },
];

const LIE_BELIEVED = [
  { id: 'plt.lb1', turns: [
    { by: 'a', say: "Look, I wasn't going to say anything..." },
    { by: 'b', say: "Say what?" },
    { by: 'a', say: "{target} has been throwing your name around. A lot." },
    { by: 'b', say: "Seriously? After everything?" },
  ] },
  { id: 'plt.lb2', turns: [
    { by: 'a', say: "You didn't hear this from me, but {target} was laughing about you earlier. Like, really laughing." },
    { by: 'b', say: "About what?" },
    { by: 'a', say: "I don't want to repeat it. It was mean." },
    { by: 'a', conf: "The less I say, the worse {b} imagines it. That's free work." },
  ] },
  { id: 'plt.lb3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I just think you deserve to know who your real friends are." },
    { by: 'b', say: "And {target} isn't one?" },
    { by: 'a', say: "I didn't say that. You did." },
    { by: 'a', conf: "I never actually said a single bad thing about {target}. I just let {b} finish my sentences." },
  ] },
  { id: 'plt.lb4', when: { registerB: 'sweet' }, turns: [
    { by: 'b', say: "{target} wouldn't say that. Would {target.sub}?" },
    { by: 'a', say: "I'm only telling you because I care about you." },
    { by: 'b', conf: "I really hope {a} is wrong. But why would {a} lie to me?" },
  ] },
  { id: 'plt.lb5', when: { registerB: 'fiery' }, turns: [
    { by: 'a', say: "{target} called you a liability. To my face." },
    { by: 'b', say: "A LIABILITY?" },
    { by: 'a', say: "I'm just the messenger!" },
    { by: 'a', conf: "And the author. But mostly the messenger." },
  ] },
  { id: 'plt.lb6', turns: [
    { beat: '{a} sits down next to {b} with a worried face.' },
    { by: 'a', say: "Has {target} been acting weird with you?" },
    { by: 'b', say: "No. Why?" },
    { by: 'a', say: "Just watch {target.obj} for a day. You'll see." },
    { by: 'b', conf: "And now I can't stop watching." },
  ] },
  { id: 'plt.lb7', when: { charm: true }, turns: [
    { by: 'a', say: "Hey. Walk with me a sec?" },
    { by: 'a', say: "I heard {target} saying you're the easiest vote in the game." },
    { by: 'b', say: "Wow. Okay. Thanks for telling me." },
    { by: 'a', say: "That's what friends are for." },
  ] },
];

const LIE_REJECTED = [
  { id: 'plt.lr1', turns: [
    { by: 'a', say: "{target} has been talking about you behind your back." },
    { by: 'b', say: "{target} told me what you said about me two days ago. So." },
    { by: 'a', say: "...So that's awkward." },
  ] },
  { id: 'plt.lr2', turns: [
    { by: 'a', say: "I'm just saying, I'd watch {target}." },
    { by: 'b', say: "Why are you so interested in who I trust?" },
    { by: 'a', say: "I'm not. Forget it." },
    { by: 'b', conf: "That story was rehearsed. You could hear it." },
  ] },
  { id: 'plt.lr3', when: { sharp: false }, turns: [
    { by: 'a', say: "{target} thinks you're a goat. Like, a farm animal goat." },
    { by: 'b', say: "{target} literally gave me half a fish yesterday." },
    { by: 'a', say: "To fatten you up! Like a goat!" },
    { by: 'b', say: "I don't think that's how goats work." },
  ] },
  { id: 'plt.lr4', when: { registerB: 'cool' }, turns: [
    { by: 'b', say: "Who told you that?" },
    { by: 'a', say: "Doesn't matter who." },
    { by: 'b', say: "It matters a lot, actually." },
    { by: 'b', conf: "When someone won't tell you where they heard something, they heard it from themselves." },
  ] },
  { id: 'plt.lr5', when: { registerB: 'fiery' }, turns: [
    { by: 'b', say: "Don't come at me with that. {target} is my friend." },
    { by: 'a', say: "I'm just trying to help!" },
    { by: 'b', say: "Help somebody else!" },
  ] },
  { id: 'plt.lr6', turns: [
    { by: 'a', say: "I heard {target} wants you out next." },
    { by: 'b', say: "Funny. I just asked {target} who {target.sub} wanted out next. It wasn't me." },
    { by: 'a', conf: "Who just goes and ASKS?" },
  ] },
];

const LIE_CONFRONT = [
  { id: 'plt.lc1', turns: [
    { by: 'a', say: "So I'm a liability now?" },
    { by: 'b', say: "What? Who said that?" },
    { by: 'a', say: "Don't play dumb. I know what you said about me." },
    { by: 'b', say: "I never said anything about you!" },
  ] },
  { id: 'plt.lc2', turns: [
    { beat: '{a} marches straight across camp to {b}.' },
    { by: 'a', say: "You want to say it to my face this time?" },
    { by: 'b', say: "Say WHAT?" },
    { beat: 'Everybody stops what they\'re doing. Off to the side, {target} watches and says nothing.' },
  ] },
  { id: 'plt.lc3', when: { hot: true }, turns: [
    { by: 'a', say: "I trusted you! I actually trusted you!" },
    { by: 'b', say: "Somebody is lying to you, and it isn't me!" },
    { by: 'a', say: "Oh, sure. Everybody's lying except you." },
  ] },
  { id: 'plt.lc4', when: { calm: true }, turns: [
    { by: 'a', say: "Can I ask you something? Did you say I'm the easiest vote in the game?" },
    { by: 'b', say: "No. Who told you that?" },
    { by: 'a', say: "It doesn't matter." },
    { by: 'b', say: "It does to me." },
  ] },
  { id: 'plt.lc5', turns: [
    { by: 'b', say: "Where is this even coming from?" },
    { by: 'a', say: "{target} told me everything." },
    { by: 'b', say: "{target}?! And you believed {target.obj}?" },
    { by: 'a', say: "Why would {target} make it up?" },
  ] },
  { id: 'plt.lc6', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "I know what you've been saying about me." },
    { by: 'b', say: "I don't... I don't really say anything about anybody." },
    { by: 'a', say: "That's what makes it so sneaky!" },
    { by: 'b', conf: "I don't even know what I did." },
  ] },
];

const LIE_WARNED = [
  { id: 'plt.lw1', turns: [
    { by: 'a', say: "Hey. Heads up. {target} came to me with a story about you." },
    { by: 'b', say: "What story?" },
    { by: 'a', say: "Doesn't matter. I didn't buy it. I just thought you should know {target} is using your name." },
  ] },
  { id: 'plt.lw2', turns: [
    { by: 'b', say: "{target} said WHAT about me?" },
    { by: 'a', say: "Relax. I didn't believe it." },
    { by: 'b', say: "That's not the part I'm worried about." },
  ] },
  { id: 'plt.lw3', when: { band: 'friends' }, turns: [
    { by: 'a', say: "You're my friend, so I'm telling you. {target} tried to turn me against you." },
    { by: 'b', say: "Thank you. Seriously." },
    { by: 'b', conf: "Now I know two things. Who's got my back, and who wants my head." },
  ] },
  { id: 'plt.lw4', turns: [
    { beat: '{a} waits until {target} is out of earshot, then sits down next to {b}.' },
    { by: 'a', say: "Be careful what you tell {target}." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because {target} tells people things about you that you never said." },
  ] },
  { id: 'plt.lw5', when: { registerB: 'fiery' }, turns: [
    { by: 'a', say: "{target} was talking trash about you." },
    { by: 'b', say: "Where is {target.sub}? I'm going to—" },
    { by: 'a', say: "Don't! Then {target} knows I told you." },
    { by: 'b', conf: "Fine. I'll wait. I'm very good at waiting." },
  ] },
  { id: 'plt.lw6', turns: [
    { by: 'a', say: "I'm not supposed to tell you this." },
    { by: 'b', say: "Which is why you're going to." },
    { by: 'a', say: "{target} is trying to turn people on you. Me included." },
    { by: 'b', say: "Okay. Good to know whose game I'm in." },
  ] },
];

const COMFORT = [
  { id: 'plt.c1', turns: [
    { beat: '{a} finds {b} sitting alone and sits down too, without saying anything.' },
    { by: 'b', say: "You don't have to stay." },
    { by: 'a', say: "I know." },
    { beat: '{a} stays.' },
  ] },
  { id: 'plt.c2', turns: [
    { by: 'a', say: "For what it's worth, I don't believe a word of it." },
    { by: 'b', say: "You might be the only one." },
    { by: 'a', say: "Then I'm the only one. That's still one." },
  ] },
  { id: 'plt.c3', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Hey. You want to talk about it, or you want to not talk about it?" },
    { by: 'b', say: "Not talk about it." },
    { by: 'a', say: "Okay. I brought snacks for not talking about it." },
  ] },
  { id: 'plt.c4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Want to go throw rocks at stuff? It helps." },
    { by: 'b', say: "Does it?" },
    { by: 'a', say: "No idea. Let's find out." },
  ] },
  { id: 'plt.c5', turns: [
    { by: 'b', say: "Why does everybody think the worst of me all of a sudden?" },
    { by: 'a', say: "Not everybody. People are scared, and scared people believe anything." },
    { by: 'b', conf: "{a} didn't have to come and find me. That's going to matter later." },
  ] },
  { id: 'plt.c6', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Look at me. You and me are fine. Whatever's going on out there, we're fine." },
    { by: 'b', say: "Promise?" },
    { by: 'a', say: "Promise." },
  ] },
  { id: 'plt.c7', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You want me to go yell at someone? I'll go yell at someone." },
    { by: 'b', say: "No! Please don't." },
    { by: 'a', say: "Offer stands." },
    { by: 'b', conf: "Weirdly, that made me feel better." },
  ] },
];

const EXPOSED = [
  { id: 'plt.x1', turns: [
    { by: 'a', say: "Everybody, come here. You need to hear this." },
    { by: 'a', say: "{b} has been feeding all of us stories about each other. Different ones. To each of us." },
    { by: 'b', say: "That is NOT what—" },
    { by: 'a', say: "Then explain it. Go on. We're all here." },
  ] },
  { id: 'plt.x2', turns: [
    { by: 'a', say: "{b}, tell them what you told me." },
    { beat: '{b} opens {b.posAdj} mouth, then shuts it.' },
    { by: 'a', say: "Yeah. I thought so." },
  ] },
  { id: 'plt.x3', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I've been keeping track. {b} told three of us three different things about the same vote. I can do the dates if you want." },
    { by: 'b', say: "You've been keeping notes on me?" },
    { by: 'a', say: "Somebody had to." },
  ] },
  { id: 'plt.x4', when: { registerB: 'schemer' }, turns: [
    { by: 'a', say: "It's {b}. It's been {b} the whole time." },
    { by: 'b', say: "Oh, please. Like any of you could prove that." },
    { by: 'a', say: "We just did. Look around." },
    { beat: 'Nobody is standing on {b}\'s side of the fire.' },
  ] },
  { id: 'plt.x5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I am SO done with {b} running around this camp lying to everybody!" },
    { by: 'b', say: "You're being dramatic." },
    { by: 'a', say: "I'm being RIGHT!" },
  ] },
  { id: 'plt.x6', turns: [
    { beat: 'By lunch, {a} has pulled every single person aside with the same story about {b}.' },
    { by: 'b', say: "Why is everyone looking at me like that?" },
    { by: 'a', say: "I think you know why." },
  ] },
];

const WHISPER_SPREAD = [
  { id: 'plt.w1', turns: [
    { by: 'a', say: "Don't you think {target} has been weirdly quiet lately?" },
    { by: 'b', say: "I hadn't noticed." },
    { by: 'a', say: "Huh. Maybe it's just me." },
    { by: 'a', conf: "It's not just me. By dinner it'll be everybody." },
  ] },
  { id: 'plt.w2', turns: [
    { by: 'a', say: "I'm not saying {target} is playing everybody. I'm just asking if you've wondered." },
    { by: 'b', say: "I have now." },
  ] },
  { id: 'plt.w3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "One big lie, people check. Ten tiny questions about {target}, nobody checks anything. They just start feeling a certain way." },
    { by: 'a', say: "{b}, has {target} ever told you who {target.sub} would vote for?" },
    { by: 'b', say: "Actually... no. Never." },
  ] },
  { id: 'plt.w4', turns: [
    { by: 'a', say: "Where does {target} keep disappearing to, anyway?" },
    { by: 'b', say: "The bathroom?" },
    { by: 'a', say: "For an hour?" },
    { by: 'b', say: "...Huh." },
  ] },
  { id: 'plt.w5', when: { charm: true }, turns: [
    { beat: '{a} drifts from person to person all afternoon, a friendly word with each one. {b} is the last stop.' },
    { by: 'a', say: "{target} is great, right? It's just... a little too good at this. You know?" },
    { by: 'b', say: "Yeah. I know what you mean." },
  ] },
  { id: 'plt.w6', when: { registerB: 'sweet' }, turns: [
    { by: 'a', say: "I love {target}, I do. I just worry {target} is using you." },
    { by: 'b', say: "Using me how?" },
    { by: 'a', say: "Forget I said anything." },
    { by: 'b', conf: "I can't forget it now." },
  ] },
];

const WHISPER_EXPOSED = [
  { id: 'plt.we1', turns: [
    { by: 'a', say: "Three people asked me the same weird question today. Same words. You want to guess where they heard it?" },
    { by: 'b', say: "No idea." },
    { by: 'a', say: "I asked. All three said you." },
  ] },
  { id: 'plt.we2', turns: [
    { by: 'a', say: "Funny thing. Everyone's suddenly wondering where I go all day." },
    { by: 'b', say: "People talk." },
    { by: 'a', say: "One person talks. To everybody. It's you, {b}." },
  ] },
  { id: 'plt.we3', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "Everybody went cold on me on the same day. That doesn't happen naturally. So I traced it back. Every road leads to {b}." },
    { by: 'a', say: "You've been busy, {b}." },
    { by: 'b', say: "I don't know what you mean." },
  ] },
  { id: 'plt.we4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If you've got something to say about me, say it to ME!" },
    { by: 'b', say: "I haven't said anything!" },
    { by: 'a', say: "Everybody else says you have!" },
  ] },
  { id: 'plt.we5', turns: [
    { by: 'a', say: "{b}. Walk with me." },
    { by: 'a', say: "I know what you've been saying. I'm not even mad. I just want you to know that I know." },
    { by: 'b', conf: "Okay. That was scarier than yelling." },
  ] },
  { id: 'plt.we6', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um, {b}? Could you maybe stop telling people I'm sneaky?" },
    { by: 'b', say: "I never said that!" },
    { by: 'a', say: "You did. To everybody. I was there for some of it." },
  ] },
];

const RALLY = [
  { id: 'plt.r1', turns: [
    { by: 'a', say: "After what {target} did, how is {target.sub} still here?" },
    { by: 'b', say: "I've been asking myself the same thing." },
    { by: 'a', say: "Then let's stop asking and do something." },
  ] },
  { id: 'plt.r2', turns: [
    { by: 'a', say: "I'm going around to everybody. {target} goes next. Are you in?" },
    { by: 'b', say: "Who else is in?" },
    { by: 'a', say: "You'd be the third." },
    { by: 'b', say: "Make it four. I know somebody." },
  ] },
  { id: 'plt.r3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I am NOT letting {target} get away with this!" },
    { by: 'b', say: "Okay, okay. What do you need?" },
    { by: 'a', say: "Your vote. That's all." },
  ] },
  { id: 'plt.r4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I don't like voting people out. I really don't. But {target} hurt somebody I care about." },
    { by: 'b', say: "I know. I saw." },
    { by: 'a', say: "So you'll help?" },
    { by: 'b', say: "Yeah. I'll help." },
  ] },
  { id: 'plt.r5', turns: [
    { by: 'b', say: "You're really going after {target}?" },
    { by: 'a', say: "Somebody has to. If {target} gets away with it once, {target.sub}'ll do it to you next." },
    { by: 'b', conf: "That last part is what got me." },
  ] },
  { id: 'plt.r6', when: { band: 'friends' }, turns: [
    { by: 'a', say: "I need you on this." },
    { by: 'b', say: "You've got me. You always had me." },
    { by: 'a', conf: "With {b}, I've got numbers. With numbers, {target} is done." },
  ] },
];

const MAJORITY_FOOLED = [
  { id: 'plt.mf1', turns: [
    { by: 'a', say: "Hey. It's {target} at the vote. Everybody's locked in." },
    { by: 'b', say: "Everybody? Nobody told me." },
    { by: 'a', say: "I'm telling you. I didn't want you blindsided." },
    { by: 'b', say: "Thanks. Seriously." },
  ] },
  { id: 'plt.mf2', turns: [
    { beat: '{a} draws the vote in the dirt with a stick. Every arrow points at {target}.' },
    { by: 'a', say: "See? It's simple math." },
    { by: 'b', say: "Wow. Okay. I'm in." },
    { by: 'a', conf: "It IS simple math. It's just not real math." },
  ] },
  { id: 'plt.mf3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "There is no plan. There's me, telling {b} there's a plan." },
    { by: 'a', say: "So we're all on {target}. Keep it quiet." },
    { by: 'b', say: "My lips are sealed." },
  ] },
  { id: 'plt.mf4', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "We're voting {target}. I wanted to make sure you were in the loop." },
    { by: 'b', say: "Really? Me? In the loop?" },
    { by: 'a', say: "Of course you." },
    { by: 'b', conf: "Nobody ever tells me the plan. This is a great day." },
  ] },
  { id: 'plt.mf5', turns: [
    { by: 'b', say: "Who else knows about {target}?" },
    { by: 'a', say: "Everyone. Don't bring it up with them, though. People get jumpy." },
    { by: 'b', say: "Got it. Not a word." },
  ] },
  { id: 'plt.mf6', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Would I ever lie to you?" },
    { by: 'b', say: "No." },
    { by: 'a', say: "Then trust me. It's {target}." },
  ] },
];

const MAJORITY_REFUSED = [
  { id: 'plt.mr1', turns: [
    { by: 'a', say: "It's {target} at the vote. Everybody's locked in." },
    { by: 'b', say: "Who told YOU that?" },
    { by: 'a', say: "...People." },
    { by: 'b', say: "Which people?" },
  ] },
  { id: 'plt.mr2', turns: [
    { by: 'a', say: "We're all voting {target}." },
    { by: 'b', say: "Funny. I just talked to two people who've never heard of that plan." },
    { by: 'a', say: "They're... out of the loop." },
    { by: 'b', say: "Or you are." },
  ] },
  { id: 'plt.mr3', when: { registerB: 'cool' }, turns: [
    { by: 'b', conf: "{a} gave me a vote, a number and a deadline. Real plans are messy. That one was way too tidy." },
    { by: 'b', say: "I'll think about it, {a}." },
    { by: 'a', say: "There's nothing to think about!" },
  ] },
  { id: 'plt.mr4', turns: [
    { by: 'a', say: "Unanimous. {target}. Done by sunset." },
    { by: 'b', say: "If it's unanimous, why do you need me?" },
    { by: 'a', say: "To... make it more unanimous?" },
  ] },
  { id: 'plt.mr5', when: { registerB: 'fiery' }, turns: [
    { by: 'b', say: "Don't try to play me, {a}. I'm not an idiot." },
    { by: 'a', say: "I never said you were!" },
    { by: 'b', say: "Then stop treating me like one!" },
  ] },
  { id: 'plt.mr6', turns: [
    { by: 'a', say: "Trust me. It's {target}." },
    { by: 'b', say: "I'll ask around." },
    { by: 'a', say: "You don't need to ask around." },
    { by: 'b', say: "Now I definitely do." },
  ] },
];

const KISS_SETUP = [
  { id: 'plt.k1', turns: [
    { beat: '{other} calls {c} away to help with something. It takes {c} a while to work out that there is nothing to help with.' },
    { beat: 'As soon as {c} is gone, {a} slides in next to {b}.' },
    { by: 'a', say: "Finally. I've wanted to get you alone all day." },
    { by: 'b', say: "Wait, what are you—" },
    { beat: '{a} kisses {b}, just as {c} walks back around the corner.' },
  ] },
  { id: 'plt.k2', turns: [
    { by: 'a', conf: "{other} keeps {c} busy. I take care of {b}. And {c} comes back at exactly the wrong time. That part I planned too." },
    { beat: '{c} comes back early, sees {a} leaning in to kiss {b}, and stops dead.' },
    { by: 'c', say: "Seriously?!" },
  ] },
  { id: 'plt.k3', turns: [
    { by: 'a', say: "You look cold. Here." },
    { by: 'b', say: "Uh, thanks?" },
    { beat: '{a} leans in. Fast. {b} freezes.' },
    { by: 'c', say: "{b}?!" },
    { by: 'b', say: "That's not— {c}, wait!" },
  ] },
  { id: 'plt.k4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Every showmance has a weak spot. Theirs is that {c} gets jealous about everything. So I just gave {c} something to be jealous of." },
    { beat: '{c} catches {a} with {b}. {other} is nowhere to be seen.' },
    { by: 'c', say: "I can't believe you, {b}." },
  ] },
  { id: 'plt.k5', turns: [
    { beat: '{other} drags {c} off to look at a snake that turns out not to exist.' },
    { beat: 'When {c} gets back, {a} has an arm around {b}, and {b}\'s face is a foot from {a}\'s.' },
    { by: 'c', say: "Oh. Wow. Okay." },
  ] },
  { id: 'plt.k6', when: { charm: true }, turns: [
    { by: 'a', say: "Can I tell you a secret? I think you're with the wrong person." },
    { by: 'b', say: "{a}, I'm with {c}." },
    { by: 'a', say: "Are you, though?" },
    { beat: '{a} kisses {b}. Over {b}\'s shoulder, {c} has seen all of it.' },
  ] },
];

const KISS_FAILED = [
  { id: 'plt.kf1', turns: [
    { by: 'a', say: "You and me should hang out more. Just us." },
    { by: 'b', say: "I see what you're doing. Not happening." },
    { by: 'a', say: "I'm not doing anything!" },
  ] },
  { id: 'plt.kf2', turns: [
    { beat: '{a} leans in close. {b} steps right back out.' },
    { by: 'b', say: "Nope. Nice try." },
    { by: 'a', conf: "That went... less well than planned." },
  ] },
  { id: 'plt.kf3', turns: [
    { by: 'b', say: "I'm with somebody, {a}. You know that." },
    { by: 'a', say: "Nobody would have to know." },
    { by: 'b', say: "I would know." },
  ] },
  { id: 'plt.kf4', when: { registerB: 'fiery' }, turns: [
    { by: 'b', say: "Are you trying to KISS me right now?" },
    { by: 'a', say: "Shh!" },
    { by: 'b', say: "No! Not shh! Everybody come look at this!" },
  ] },
  { id: 'plt.kf5', turns: [
    { by: 'b', say: "Funny how everybody keeps finding reasons to leave me alone with you today." },
    { by: 'a', say: "Total coincidence." },
    { by: 'b', say: "Uh-huh." },
    { beat: '{b} walks off to find {b.posAdj} partner.' },
  ] },
  { id: 'plt.kf6', turns: [
    { by: 'b', conf: "Somebody dragged my partner off for 'help', and the second they did, {a} showed up. I've seen this movie." },
    { by: 'b', say: "Bye, {a}." },
  ] },
];

const KISS_HEARTBROKEN = [
  { id: 'plt.kh1', when: { hot: true }, turns: [
    { by: 'a', say: "How COULD you?!" },
    { by: 'b', say: "I didn't kiss {target}! {target} kissed me!" },
    { by: 'a', say: "And you just stood there!" },
    { beat: 'The whole camp can hear it.' },
  ] },
  { id: 'plt.kh2', when: { hot: false }, turns: [
    { beat: '{a} doesn\'t say anything for a long time.' },
    { by: 'a', say: "Were you ever actually in this with me?" },
    { by: 'b', say: "Yes! I still am!" },
    { by: 'a', say: "It didn't look like it." },
  ] },
  { id: 'plt.kh3', turns: [
    { by: 'b', say: "Please just let me explain." },
    { by: 'a', say: "I saw what I saw." },
    { by: 'b', say: "You saw what {target} wanted you to see!" },
    { by: 'a', conf: "Maybe that's true. I don't care right now." },
  ] },
  { id: 'plt.kh4', when: { calm: true }, turns: [
    { by: 'a', say: "I'm not going to yell. I just need you to leave me alone for a while." },
    { by: 'b', say: "How long?" },
    { by: 'a', say: "I don't know." },
  ] },
  { id: 'plt.kh5', when: { hot: true }, turns: [
    { by: 'a', say: "Don't touch me! Don't even talk to me!" },
    { by: 'b', say: "It was a setup!" },
    { by: 'a', say: "Then why were you smiling?!" },
  ] },
  { id: 'plt.kh6', turns: [
    { by: 'a', conf: "I keep telling myself it wasn't what it looked like. And then I picture it again." },
    { by: 'b', say: "{a}? Can we talk?" },
    { by: 'a', say: "Not yet." },
  ] },
];

KISS_HEARTBROKEN.push({ id: 'plt.kh7', turns: [
  { by: 'b', say: "{a}, wait. Please." },
  { by: 'a', say: "For what? So you can tell me it meant nothing?" },
  { by: 'b', say: "It DID mean nothing!" },
  { by: 'a', say: "Then why did {target} look so happy about it?" },
] });

const KISS_OVER = [
  { id: 'plt.ko1', turns: [
    { by: 'a', say: "We're done, {b}." },
    { by: 'b', say: "Because of {target}? You're going to let {target} win?" },
    { by: 'a', say: "This isn't about {target}. It's about you." },
  ] },
  { id: 'plt.ko2', turns: [
    { beat: '{a} gives back the friendship bracelet {b} made. {b} doesn\'t take it, so {a} leaves it on the log between them.' },
    { by: 'b', conf: "{target} broke us up in one afternoon. One afternoon." },
  ] },
  { id: 'plt.ko3', turns: [
    { by: 'b', say: "Just tell me what I have to do to fix it." },
    { by: 'a', say: "You can't." },
    { by: 'b', say: "{a}, please." },
    { by: 'a', say: "I said you can't." },
  ] },
  { id: 'plt.ko4', when: { hot: true }, turns: [
    { by: 'a', say: "It's OVER! Did you hear me? OVER!" },
    { by: 'b', say: "Everybody heard you." },
    { by: 'b', conf: "And somewhere, {target} is very happy right now." },
  ] },
  { id: 'plt.ko5', turns: [
    { by: 'a', say: "I can't look at you without seeing it." },
    { by: 'b', say: "Then don't look. Just listen." },
    { by: 'a', say: "I'm done listening." },
  ] },
  { id: 'plt.ko6', when: { calm: true }, turns: [
    { by: 'a', say: "I think we should just be... in the game. Separately." },
    { by: 'b', say: "You mean broken up." },
    { by: 'a', say: "Yeah. I mean broken up." },
  ] },
];


// plot.accuse.sold — a tells b that {target} threw the last challenge, and b believes it.
const ACCUSE_SOLD = [
  { id: 'plt.as1', turns: [
    { by: 'a', say: "Be honest. Did {target} look like somebody trying out there?" },
    { by: 'b', say: "...Not really, now that you say it." },
    { by: 'a', say: "That's all I'm saying." },
  ] },
  { id: 'plt.as2', turns: [
    { by: 'a', say: "I'm not saying {target} threw the challenge." },
    { by: 'b', say: "But you're saying it." },
    { by: 'a', say: "I'm saying watch it again in your head." },
  ] },
  { id: 'plt.as3', turns: [
    { by: 'b', say: "We should have won that." },
    { by: 'a', say: "We would have, if {target} hadn't just stopped halfway." },
    { by: 'b', say: "Wait. You think {target} did it on purpose?" },
    { by: 'a', say: "I think {target} didn't want to win. Ask yourself why." },
  ] },
  { id: 'plt.as4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{target} had a bad day. Everybody has bad days. But a bad day and a thrown challenge look exactly the same from the outside." },
    { by: 'a', say: "{b}, you saw {target} out there, right?" },
    { by: 'b', say: "Yeah. I did." },
  ] },
  { id: 'plt.as5', when: { registerB: 'competitor' }, turns: [
    { by: 'a', say: "Some of us were giving everything. Some of us weren't." },
    { by: 'b', say: "{target}. I knew it. I KNEW it." },
    { by: 'b', conf: "I can lose. I can't stand losing because somebody didn't try." },
  ] },
  { id: 'plt.as6', turns: [
    { by: 'a', say: "Doesn't it bug you how calm {target} was after we lost?" },
    { by: 'b', say: "Yeah, actually. It does." },
  ] },
];

// plot.accuse.backfire — a accuses b of throwing the challenge, and nobody buys it.
const ACCUSE_BACKFIRE = [
  { id: 'plt.ab1', turns: [
    { by: 'a', say: "Let's talk about who really cost us that challenge. {b}?" },
    { by: 'b', say: "Me? I was the only one still going at the end!" },
    { beat: 'Everybody nods. Nobody is nodding at {a}.' },
  ] },
  { id: 'plt.ab2', turns: [
    { by: 'a', say: "Somebody threw it. And I think we all know who." },
    { by: 'b', say: "You want to see my hands? Because I've got blisters from that thing." },
    { by: 'a', conf: "Okay. Wrong person. Very wrong person." },
  ] },
  { id: 'plt.ab3', when: { registerB: 'fiery' }, turns: [
    { by: 'a', say: "{b} gave up out there. Admit it." },
    { by: 'b', say: "I gave up?! I was the one still pulling at the end!" },
    { by: 'b', say: "Where were YOU?" },
  ] },
  { id: 'plt.ab4', turns: [
    { by: 'a', say: "I just think {b} could have tried harder." },
    { by: 'b', say: "I did better than most of us. Who came last again?" },
    { beat: 'A few heads turn toward {a}.' },
  ] },
  { id: 'plt.ab5', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "{b}, you were kind of slow out there." },
    { by: 'b', say: "I... I really tried." },
    { beat: 'Two people step in to say {b} did. Then a third.' },
    { by: 'a', conf: "That backfired." },
  ] },
  { id: 'plt.ab6', turns: [
    { by: 'b', say: "Why do you want me blamed so bad, {a}?" },
    { by: 'a', say: "I don't. I'm just asking questions." },
    { by: 'b', say: "Ask better ones." },
  ] },
];

// plot.majority.traced — a, whose vote was wasted on {target}, works out b lied.
const MAJORITY_TRACED = [
  { id: 'plt.mt1', turns: [
    { by: 'a', say: "You told me it was {target}. Everybody was in. Remember?" },
    { by: 'b', say: "Plans change." },
    { by: 'a', say: "It never was the plan. I was the only one who voted {target}. You wasted my vote." },
  ] },
  { id: 'plt.mt2', turns: [
    { beat: '{a} goes person to person at breakfast with the same question. Nobody had heard of the {target} plan, except from {b}.' },
    { by: 'a', say: "Want to tell me why that is, {b}?" },
    { by: 'b', say: "I must have got it wrong." },
    { by: 'a', say: "You didn't get it wrong. You made it up." },
  ] },
  { id: 'plt.mt3', when: { hot: true }, turns: [
    { by: 'a', say: "You LIED to me!" },
    { by: 'b', say: "Whoa, whoa, calm down." },
    { by: 'a', say: "I voted {target} because of you! Me! Alone!" },
  ] },
  { id: 'plt.mt4', when: { calm: true }, turns: [
    { by: 'a', say: "I'm not angry. I just want to understand. Why tell me {target}?" },
    { by: 'b', say: "I thought it was the plan." },
    { by: 'a', say: "Whose plan?" },
    { beat: '{b} doesn\'t answer.' },
  ] },
  { id: 'plt.mt5', turns: [
    { by: 'a', conf: "One vote for {target}. Mine. Do you know how stupid I felt when they read it out?" },
    { by: 'a', say: "Never again, {b}." },
  ] },
  { id: 'plt.mt6', turns: [
    { by: 'b', say: "Look, I heard it from someone else." },
    { by: 'a', say: "Who?" },
    { by: 'b', say: "I don't remember." },
    { by: 'a', say: "Funny. I remember everything you said." },
  ] },
];

// plot.majority.confused — a voted alone on a fake plan and can't work out who lied. Alone.
const MAJORITY_CONFUSED = [
  { id: 'plt.mc1', turns: [
    { by: 'a', conf: "Everybody was supposedly voting together. One vote went that way. Mine. Somebody lied to me, and I don't even know who." },
  ] },
  { id: 'plt.mc2', turns: [
    { beat: '{a} sits apart at breakfast, watching everybody.' },
    { by: 'a', conf: "I asked two people about the plan. They both looked at me like I was crazy. So now I trust nobody." },
  ] },
  { id: 'plt.mc3', when: { hot: true }, turns: [
    { by: 'a', conf: "I got played! I got PLAYED! And whoever did it is sitting right over there eating breakfast like nothing happened!" },
  ] },
  { id: 'plt.mc4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "Lesson learned. If a plan only exists in one conversation, it's not a plan. I'm going to check everything twice from now on." },
  ] },
  { id: 'plt.mc5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I was so happy somebody told me the plan. I should've known. Nobody tells me the plan." },
  ] },
  { id: 'plt.mc6', turns: [
    { by: 'a', conf: "The numbers I was given were wrong. Somebody gave me those numbers. I'll work out who." },
  ] },
];

export default {
  'plot.note.believed': NOTE_BELIEVED, 'plot.note.doubt': NOTE_DOUBT, 'plot.note.exposed': NOTE_EXPOSED,
  'plot.lie.believed': LIE_BELIEVED, 'plot.lie.rejected': LIE_REJECTED, 'plot.lie.confront': LIE_CONFRONT, 'plot.lie.warned': LIE_WARNED,
  'plot.comfort.any': COMFORT, 'plot.exposed.any': EXPOSED,
  'plot.whisper.spread': WHISPER_SPREAD, 'plot.whisper.exposed': WHISPER_EXPOSED, 'plot.rally.any': RALLY,
  'plot.majority.fooled': MAJORITY_FOOLED, 'plot.majority.refused': MAJORITY_REFUSED,
  'plot.kiss.setup': KISS_SETUP, 'plot.kiss.failed': KISS_FAILED, 'plot.kiss.heartbroken': KISS_HEARTBROKEN, 'plot.kiss.over': KISS_OVER,
  'plot.accuse.sold': ACCUSE_SOLD, 'plot.accuse.backfire': ACCUSE_BACKFIRE,
  'plot.majority.traced': MAJORITY_TRACED, 'plot.majority.confused': MAJORITY_CONFUSED,
};

/** Data these scenes always carry. */
export const GUARANTEED = {
  'plot.note.believed': ['target'], 'plot.note.doubt': ['target'], 'plot.note.exposed': ['target'], 'plot.lie.believed': ['target'], 'plot.lie.rejected': ['target'],
  'plot.lie.confront': ['target'], 'plot.lie.warned': ['target'], 'plot.whisper.spread': ['target'], 'plot.rally.any': ['target'],
  'plot.majority.fooled': ['target'], 'plot.majority.refused': ['target'], 'plot.kiss.setup': ['other'],
  'plot.kiss.heartbroken': ['target'], 'plot.kiss.over': ['target'], 'plot.accuse.sold': ['target'], 'plot.majority.traced': ['target'],
};
