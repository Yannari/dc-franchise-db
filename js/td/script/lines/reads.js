// ══════════════════════════════════════════════════════════════════════
// td/script/lines/reads.js — watching, reading and playing people
// ══════════════════════════════════════════════════════════════════════
//
// read.watched.<sharp|uneasy> — {a} notices {b} keeping tabs on {a}. 'sharp':
//   {a} turns it around; 'uneasy': it gets under {a}'s skin.
// read.played.<deep|plain> — {a} works on {b}, who comes away trusting {a}
//   more. Only {a}'s confessional says it was a play.
// read.orchestrate.<unseen|setup> — {a} moves a piece through {b} without {b}
//   knowing what it's for.
// read.sharp.<expert|sure|gut> — {a} reads that something's off with {b}. {a}
//   doesn't call it out; the camera hears it.
// conf.lonewolf.any — {a} keeps to {a.ref}, on purpose.
// Ids: 'rd.'.
const WATCHED_SHARP = [
  { id: 'rd.w1', turns: [
    { by: 'a', say: "You've been staring at me for ten minutes. Take a picture, it'll last longer." },
    { by: 'b', say: "I wasn't staring." },
    { by: 'a', say: "Sure. You were admiring the tree behind me." },
    { beat: '{b} looks away first.' },
  ] },
  { id: 'rd.w2', turns: [
    { by: 'a', conf: "{b} has been watching every move I make. Who I talk to. Where I go." },
    { by: 'a', conf: "So I'm going to give {b} something to watch. Just not the real thing." },
  ] },
  { id: 'rd.w3', turns: [
    { by: 'b', say: "Where are you off to?" },
    { by: 'a', say: "Funny. You always want to know where I'm off to." },
    { by: 'b', say: "Just making conversation." },
    { by: 'a', say: "Sure you are." },
  ] },
  { id: 'rd.w4', turns: [
    { beat: '{a} catches {b} watching {a.obj} from across camp, and stares straight back until {b} turns away.' },
    { by: 'a', conf: "If {b} wants to keep tabs on me, fine. Two can play that game." },
  ] },
  { id: 'rd.w5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is watching me. Good. I'll make sure {b} sees exactly what I want {b} to see." },
  ] },
  { id: 'rd.w6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Is there a problem?" },
    { by: 'b', say: "What? No." },
    { by: 'a', say: "Then stop following me around like a lost puppy!" },
    { by: 'b', say: "I'm not following you!" },
  ] },
];
const WATCHED_UNEASY = [
  { id: 'rd.u1', turns: [
    { by: 'a', conf: "Every time I turn around, {b} is there. Watching." },
    { by: 'a', conf: "It's not paranoia if it's actually happening, right?" },
  ] },
  { id: 'rd.u2', turns: [
    { by: 'a', say: "Why do you keep looking at me like that?" },
    { by: 'b', say: "Like what?" },
    { by: 'a', say: "Like you're taking notes." },
    { by: 'b', say: "You're imagining things." },
    { by: 'a', conf: "I'm not imagining things." },
  ] },
  { id: 'rd.u3', turns: [
    { by: 'a', conf: "I went to get water, and {b} went to get water. I went for a walk, and {b} went for a walk." },
    { by: 'a', conf: "I'm starting to feel like I'm being followed. Because I am." },
  ] },
  { id: 'rd.u4', turns: [
    { by: 'a', conf: "I can feel {b}'s eyes on me in every conversation. It's making me really careful." },
  ] },
  { id: 'rd.u5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "{b} keeps watching me. I don't know what I did. It's kind of scary, honestly." },
  ] },
  { id: 'rd.u6', turns: [
    { by: 'b', say: "Who were you talking to just now?" },
    { by: 'a', say: "Why do you need to know?" },
    { by: 'b', say: "Just curious." },
    { by: 'a', conf: "That's the third time today {b}'s been 'just curious'." },
  ] },
];

const PLAYED_DEEP = [
  { id: 'rd.p1', turns: [
    { by: 'a', say: "What do you think we should do about the vote?" },
    { by: 'b', say: "Honestly? I think we should go after the strong players." },
    { by: 'a', say: "That's brilliant. I wouldn't have thought of that." },
    { by: 'b', say: "Really? Thanks!" },
    { by: 'a', conf: "I planted that idea in {b}'s head two days ago. Now {b} thinks it's {b.posAdj} own." },
  ] },
  { id: 'rd.p2', turns: [
    { by: 'a', say: "I've never told anyone this, but you're the only person here I trust." },
    { by: 'b', say: "Wow. That means a lot." },
    { by: 'a', say: "I mean it." },
    { by: 'a', conf: "I've said that to more than one person here. It means a lot to all of them." },
  ] },
  { id: 'rd.p3', turns: [
    { by: 'b', say: "You always know the right thing to say." },
    { by: 'a', say: "I just say what I feel." },
    { by: 'a', conf: "I say what works. There's a difference, and {b} will never know it." },
  ] },
  { id: 'rd.p4', when: { rival: true }, turns: [
    { by: 'a', say: "Can I be honest? I'm worried about you. {rival} has been saying things." },
    { by: 'b', say: "What kind of things?" },
    { by: 'a', say: "Don't worry about it. I've got your back." },
    { by: 'b', say: "Thank you. Seriously." },
    { by: 'a', conf: "Now {b} needs me. Which is exactly where I want {b}." },
  ] },
  { id: 'rd.p5', turns: [
    { by: 'a', say: "You're smarter than people give you credit for." },
    { by: 'b', say: "You think so?" },
    { by: 'a', say: "I know so. Stick with me and they'll all see it." },
    { by: 'a', conf: "A little flattery, and {b} will vote however I want." },
  ] },
  { id: 'rd.p6', turns: [
    { by: 'b', say: "I feel like we're a real team." },
    { by: 'a', say: "We are." },
    { by: 'a', conf: "A team. Sure. A team where I make every decision." },
  ] },
];
const PLAYED_PLAIN = [
  { id: 'rd.q1', turns: [
    { by: 'a', say: "Can I tell you something useful? Something nobody else knows?" },
    { by: 'b', say: "Please." },
    { by: 'a', say: "The vote isn't as settled as people think. Stick with me and you'll be fine." },
    { by: 'b', say: "Thanks. I owe you." },
    { by: 'a', conf: "Half of what I told {b} was true. The other half helps me. {b} doesn't need to know which half is which." },
  ] },
  { id: 'rd.q2', turns: [
    { by: 'a', say: "We're equal partners in this, you and me." },
    { by: 'b', say: "Totally equal." },
    { by: 'a', conf: "Equal partners. Sure. I make the plans, {b} votes for them. Equal." },
  ] },
  { id: 'rd.q3', turns: [
    { by: 'a', say: "Just so you know, I've been looking out for you." },
    { by: 'b', say: "You have?" },
    { by: 'a', say: "Quietly. You don't have to thank me." },
    { by: 'b', say: "Thank you anyway!" },
    { by: 'a', conf: "I haven't done anything. But {b} owes me now, and that's what I needed." },
  ] },
  { id: 'rd.q4', turns: [
    { beat: '{a} and {b} talk for a long time. By the end, {b} is nodding at everything.' },
    { by: 'b', say: "Okay. I'm with you. Whatever you need." },
    { by: 'a', conf: "I didn't even have to ask. {b} offered." },
  ] },
  { id: 'rd.q5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll keep you posted on everything I hear." },
    { by: 'b', say: "Really? That'd be amazing." },
    { by: 'a', conf: "I'll keep {b} posted on everything I want {b} to hear." },
  ] },
  { id: 'rd.q6', turns: [
    { by: 'a', say: "What would you do without me?" },
    { by: 'b', say: "Honestly? Probably be gone already." },
    { by: 'a', say: "Then let's keep it that way." },
    { by: 'a', conf: "The more {b} thinks {b} needs me, the more useful {b} is." },
  ] },
];
const ORCH_UNSEEN = [
  { id: 'rd.o1', turns: [
    { by: 'a', say: "Can you do me a favour? If anyone asks, just say I'm not interested in the vote." },
    { by: 'b', say: "Are you? Not interested?" },
    { by: 'a', say: "Of course not. Just say it." },
    { by: 'a', conf: "By tonight, three people will hear that from {b}. And all three will relax. Perfect." },
  ] },
  { id: 'rd.o2', turns: [
    { by: 'a', say: "If you happen to see the others, mention that you heard the vote's split." },
    { by: 'b', say: "Is it split?" },
    { by: 'a', say: "It will be once you mention it." },
    { by: 'a', conf: "I don't need to talk to everyone. I just need to talk to {b}, and let {b} do the rest." },
  ] },
  { id: 'rd.o3', turns: [
    { by: 'a', conf: "Nobody saw me do anything today. That's how I like it." },
    { by: 'a', conf: "Everything that happens tonight, I set up this morning, through {b}." },
  ] },
  { id: 'rd.o4', turns: [
    { by: 'b', say: "Why do you want me to talk to them? You could just do it." },
    { by: 'a', say: "They trust you more than they trust me." },
    { by: 'b', say: "That's true." },
    { by: 'a', conf: "That's exactly why it has to be {b}. My fingerprints are nowhere on it." },
  ] },
  { id: 'rd.o5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Nobody is ever going to know this was me." },
    { by: 'a', conf: "{b} thinks {b} is just passing on a message. {b} is passing on my whole plan." },
  ] },
  { id: 'rd.o6', turns: [
    { by: 'a', say: "I'm going to take a nap. If anyone asks, I've been asleep all afternoon." },
    { by: 'b', say: "Have you?" },
    { by: 'a', say: "I will be in five minutes." },
    { by: 'a', conf: "Alibi, done. {b} doesn't even know {b} just gave me one." },
  ] },
];
const ORCH_SETUP = [
  { id: 'rd.s1', turns: [
    { by: 'a', say: "Hypothetically, if something happened next week, would you be on board?" },
    { by: 'b', say: "What kind of something?" },
    { by: 'a', say: "I'll tell you next week." },
    { by: 'a', conf: "{b} doesn't know it yet, but {b} is the most important part of my next move." },
  ] },
  { id: 'rd.s2', turns: [
    { by: 'a', say: "Stay close to me over the next few days, okay?" },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Just trust me." },
    { by: 'a', conf: "I'm moving {b} into position. {b} will thank me later. Probably." },
  ] },
  { id: 'rd.s3', turns: [
    { by: 'a', conf: "{b} and I had a chat about nothing today. Except it wasn't nothing." },
    { by: 'a', conf: "Every word was setting up something I'm doing next week." },
  ] },
  { id: 'rd.s4', turns: [
    { by: 'a', say: "Who do you think is running things around here?" },
    { by: 'b', say: "I don't really think about it." },
    { by: 'a', say: "You should start." },
    { by: 'a', conf: "Next week, {b} will be thinking about it a lot. I made sure of that." },
  ] },
  { id: 'rd.s5', when: { threat: true }, turns: [
    { by: 'a', say: "Do you ever think about {threat}? How strong {threat} is?" },
    { by: 'b', say: "Now I do." },
    { by: 'a', conf: "That's the seed. Give it a week." },
  ] },
  { id: 'rd.s6', turns: [
    { by: 'a', say: "You and I should talk more. Not now. Just... more." },
    { by: 'b', say: "Okay. Sure." },
    { by: 'a', conf: "I'm in no rush. {b} will be ready when I need {b.obj}." },
  ] },
];
const SHARP_EXPERT = [
  { id: 'rd.e1', turns: [
    { by: 'b', say: "I was at the water all morning. Didn't see anyone." },
    { by: 'a', say: "Oh yeah? Huh." },
    { by: 'a', conf: "{b}'s hair is dry and {b}'s shoes are covered in mud from the trail. {b} was not at the water." },
  ] },
  { id: 'rd.e2', turns: [
    { by: 'a', conf: "{b} thinks {b} is being subtle. {b} is not being subtle." },
    { by: 'a', conf: "I've known for two days. I'm just waiting to see what {b} does next." },
  ] },
  { id: 'rd.e3', turns: [
    { by: 'b', say: "I'm totally with you guys. One hundred percent." },
    { by: 'a', say: "Good to hear." },
    { by: 'a', conf: "{b} said that way too quickly. I don't buy it." },
  ] },
  { id: 'rd.e4', turns: [
    { by: 'a', say: "How was your chat with the others?" },
    { by: 'b', say: "What chat?" },
    { by: 'a', say: "Never mind." },
    { by: 'a', conf: "{b} hesitated for half a second. That half-second told me everything." },
  ] },
  { id: 'rd.e5', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I watched {b} talk to the group. Everybody heard one thing. I heard what {b} wasn't saying." },
  ] },
  { id: 'rd.e6', turns: [
    { by: 'b', say: "Why are you smiling at me like that?" },
    { by: 'a', say: "No reason." },
    { by: 'a', conf: "{b} just lied to me about where {b} was. I'm smiling because now I know." },
  ] },
];
const SHARP_SURE = [
  { id: 'rd.r1', turns: [
    { by: 'a', conf: "I can't prove anything about {b}. But I don't need proof. I've seen enough." },
  ] },
  { id: 'rd.r2', turns: [
    { by: 'b', say: "Everything okay?" },
    { by: 'a', say: "Yep. All good." },
    { by: 'a', conf: "Something {b} said earlier just confirmed what I've been thinking. Nobody else caught it." },
  ] },
  { id: 'rd.r3', turns: [
    { by: 'a', conf: "{b} slipped today. Tiny slip. Nobody noticed. I noticed." },
  ] },
  { id: 'rd.r4', turns: [
    { by: 'a', say: "Where'd you go after the challenge?" },
    { by: 'b', say: "Nowhere. Just around." },
    { by: 'a', conf: "'Just around.' Right. I'm keeping my eye on {b}." },
  ] },
  { id: 'rd.r5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I KNEW {b} was up to something! I knew it! I'm not saying anything. Yet." },
  ] },
  { id: 'rd.r6', turns: [
    { by: 'a', conf: "I've been watching {b} all week. Today {b} gave something away. Now I know where {b} really stands." },
  ] },
];
const SHARP_GUT = [
  { id: 'rd.g1', turns: [
    { by: 'a', conf: "Something's off with {b}. I can't explain it. I just know it." },
  ] },
  { id: 'rd.g2', turns: [
    { by: 'a', say: "Hey, you good?" },
    { by: 'b', say: "Yeah, totally. Why?" },
    { by: 'a', say: "No reason." },
    { by: 'a', conf: "{b} answered way too fast. I don't know what it means, but I don't like it." },
  ] },
  { id: 'rd.g3', turns: [
    { by: 'a', conf: "My gut is telling me not to trust {b}. My gut is usually right." },
  ] },
  { id: 'rd.g4', turns: [
    { by: 'b', say: "Morning!" },
    { by: 'a', say: "Morning." },
    { by: 'a', conf: "{b} was way too cheerful. Nobody is that cheerful on this little sleep unless they're hiding something." },
  ] },
  { id: 'rd.g5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I don't want to accuse anyone. But {b} is acting really strange today." },
  ] },
  { id: 'rd.g6', turns: [
    { by: 'a', conf: "I can't put my finger on it. But something about {b} today just feels wrong." },
  ] },
];
const LONEWOLF = [
  { id: 'rd.l1', turns: [
    { by: 'a', conf: "Everyone's in an alliance. I'm not. And honestly? I like it that way." },
  ] },
  { id: 'rd.l2', turns: [
    { by: 'a', conf: "People keep asking me to join their group. I keep saying no." },
    { by: 'a', conf: "The second you join, you're somebody's spare vote. I don't want to be anybody's spare vote." },
  ] },
  { id: 'rd.l3', turns: [
    { by: 'a', conf: "I ate alone today. Not because I'm sad. Because I wanted to think." },
  ] },
  { id: 'rd.l4', turns: [
    { by: 'a', conf: "They think I'm checked out. I'm not checked out. I'm watching." },
  ] },
  { id: 'rd.l5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I don't need an alliance. Alliances need me. They just haven't realised it yet." },
  ] },
  { id: 'rd.l6', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "The less people know about my game, the better. So I'm keeping to myself for a while." },
  ] },
];

export default {
  'read.watched.sharp': WATCHED_SHARP,
  'read.watched.uneasy': WATCHED_UNEASY,
  'read.played.deep': PLAYED_DEEP,
  'read.played.plain': PLAYED_PLAIN,
  'read.orchestrate.unseen': ORCH_UNSEEN,
  'read.orchestrate.setup': ORCH_SETUP,
  'read.sharp.expert': SHARP_EXPERT,
  'read.sharp.sure': SHARP_SURE,
  'read.sharp.gut': SHARP_GUT,
  'conf.lonewolf.any': LONEWOLF,
};
