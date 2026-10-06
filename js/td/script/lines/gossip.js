// ══════════════════════════════════════════════════════════════════════
// td/script/lines/gossip.js — word of the vote travelling (informationFlow)
// ══════════════════════════════════════════════════════════════════════
//
// knowledge-integration.js knowledgeCampCards: {a} passes on whose name is
// being floated for the vote.
//   flow.gossip.name    — the name is {target}, somebody not in the scene
//   flow.gossip.warn    — the name is {b}'s own: {a} gives {b} a heads-up
//   flow.gossip.confide — the name is {a}'s own: {a} tells {b} they are in trouble
// result: 'trusted' ({b} trusts {a} and asks questions) | 'guarded' ({b} gives
// nothing away). Either way {b} commits to nothing. The speaker does not know
// WHY the name is out there — the engine did not say — so nobody claims to.
// "Tonight" only where `tribal: true`. How the vote is staged is the season's
// setting (spec §7), so no line describes the ceremony. Ids: 'gs.'.
//
// The voice (spec §5.1): something going on under the scene, pushback,
// attitude in the speaker's own plain words, real idioms.
const T = { result: 'trusted' }, G = { result: 'guarded' };

const NAME = [
  { id: 'gs.n1', turns: [
    { beat: '{a} sits down next to {b} and lowers {a.posAdj} voice.' },
    { by: 'a', say: "Okay, you didn't hear this from me." },
    { by: 'b', say: "I never hear anything from you. Go on." },
    { by: 'a', say: "{target}. That's the name going round." },
    { by: 'b', say: "{target}? Huh. I didn't see that coming." },
    { by: 'a', say: "Nobody did. That's kind of the point." },
  ] },
  { id: 'gs.n2', turns: [
    { by: 'b', say: "Why are you smiling like that?" },
    { by: 'a', say: "Because I know something you don't." },
    { by: 'b', say: "Ugh. Just tell me." },
    { by: 'a', say: "People want {target} gone." },
    { by: 'b', say: "Which people?" },
    { by: 'a', say: "Enough people. That's all I'm saying." },
  ] },
  { id: 'gs.n3', turns: [
    { by: 'b', say: "Is there a plan for the vote? Nobody ever tells me anything." },
    { by: 'a', say: "That's because you can't keep a secret." },
    { by: 'b', say: "I can totally keep a secret!" },
    { by: 'a', say: "Fine. It's {target}. Now prove it." },
    { by: 'b', say: "My lips are sealed." },
  ] },
  { id: 'gs.n4', turns: [
    { beat: '{a} and {b} are hanging laundry on a line, and {a} keeps looking over {a.posAdj} shoulder.' },
    { by: 'a', say: "So. {target}." },
    { by: 'b', say: "What about {target}?" },
    { by: 'a', say: "{target}'s name keeps coming up. For the vote." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since today. Pass me a peg." },
  ] },
  { id: 'gs.n5', when: { result: 'trusted', tribal: true }, turns: [
    { by: 'a', say: "Heads up. It's looking like {target} tonight." },
    { by: 'b', say: "Who's pushing it?" },
    { by: 'a', say: "I don't know for sure. I just keep hearing it." },
    { by: 'b', say: "And how many votes is that?" },
    { by: 'a', say: "Maybe enough. Maybe not." },
    { by: 'b', say: "Okay. Let me think about it before I do anything stupid." },
  ] },
  { id: 'gs.n6', when: T, turns: [
    { by: 'a', say: "You know {target}'s in trouble, right?" },
    { by: 'b', say: "Wait, what? Since when?" },
    { by: 'a', say: "Since people started saying the name. Which is now." },
    { by: 'b', say: "Are you voting that way?" },
    { by: 'a', say: "Haven't decided. You?" },
    { by: 'b', say: "I don't know yet. But thanks for telling me. Seriously." },
  ] },
  { id: 'gs.n7', when: G, turns: [
    { by: 'a', say: "People want {target} out. Just thought you should know." },
    { by: 'b', say: "Okay." },
    { by: 'a', say: "That's it? Just 'okay'?" },
    { by: 'b', say: "What do you want, a parade?" },
    { beat: '{a} rolls {a.posAdj} eyes and leaves {b} alone.' },
  ] },
  { id: 'gs.n8', when: G, turns: [
    { by: 'a', say: "I heard it might be {target} next time we vote." },
    { by: 'b', say: "Where did you hear that?" },
    { by: 'a', say: "Around." },
    { by: 'b', say: "'Around.' Very helpful." },
    { by: 'b', conf: "{a} doesn't tell anybody anything for free. So what does {a} want from me?" },
  ] },
  { id: 'gs.n9', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'm only telling you this because I like you." },
    { by: 'b', say: "You don't like anybody." },
    { by: 'a', say: "I like you a little. {target} is the name. If you're smart, you'll be on the right side of it." },
    { by: 'b', say: "And which side is that?" },
    { by: 'a', say: "Mine. Obviously." },
  ] },
  { id: 'gs.n10', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, did you know people are going after {target}?!" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "Sorry! Sorry. But did you know?" },
    { by: 'b', say: "I know now. So does half the camp, probably." },
  ] },
  { id: 'gs.n11', when: { alliance: true }, turns: [
    { by: 'a', say: "Alliance business. {target}'s name is out there." },
    { by: 'b', say: "Does the rest of the group know?" },
    { by: 'a', say: "Not yet. I came to you first." },
    { by: 'b', say: "Good. Let's keep it that way until we know more." },
  ] },
  { id: 'gs.n12', turns: [
    { by: 'b', say: "You've been quiet all day. It's freaking me out." },
    { by: 'a', say: "I've been listening. You'd be amazed what people say when they think you're not paying attention." },
    { by: 'b', say: "Like what?" },
    { by: 'a', say: "Like {target}'s name. Over and over." },
    { by: 'b', say: "Wow. Okay." },
  ] },
  { id: 'gs.n13', turns: [
    { by: 'a', say: "Don't look now, but {target} has no idea." },
    { by: 'b', say: "No idea about what?" },
    { by: 'a', say: "That people want {target.obj} gone." },
    { by: 'b', say: "Seriously?" },
    { by: 'a', say: "I said don't look! Act normal." },
    { by: 'b', say: "I AM acting normal!" },
  ] },
  { id: 'gs.n14', turns: [
    { by: 'a', say: "Quick question. Where are you at with {target}?" },
    { by: 'b', say: "Fine, I guess. Why?" },
    { by: 'a', say: "No reason. People are just talking about voting {target.obj} out." },
    { by: 'b', say: "That's a pretty big 'no reason'." },
    { by: 'a', say: "Well, now you know." },
  ] },
  { id: 'gs.n15', when: { spot: 'campfire' }, turns: [
    { beat: '{b} is trying to get the fire going. {a} crouches down next to {b.obj}.' },
    { by: 'a', say: "Want a hand?" },
    { by: 'b', say: "You've never offered to help with anything." },
    { by: 'a', say: "Fine. I want to tell you something. {target}'s name is out there." },
    { by: 'b', say: "Out there for the vote?" },
    { by: 'a', say: "Out there for the vote. And blow on that, it's going out." },
  ] },
  { id: 'gs.n16', turns: [
    { by: 'b', say: "So who's in trouble?" },
    { by: 'a', say: "If I had to put money on it? {target}." },
    { by: 'b', say: "Why {target}?" },
    { by: 'a', say: "No idea why. I just know people keep saying it." },
    { beat: '{b} thinks about that for a moment.' },
  ] },
  { id: 'gs.n17', when: { tribal: true }, turns: [
    { by: 'a', say: "Okay, so it's looking like {target} tonight." },
    { by: 'b', say: "Is that for sure?" },
    { by: 'a', say: "Nothing's for sure until the votes are in. But that's what I'm hearing." },
    { by: 'b', say: "Thanks. I'll think about it." },
  ] },
  { id: 'gs.n18', when: { tribal: true }, turns: [
    { by: 'b', say: "We vote in a few hours and I still have no clue what's happening." },
    { by: 'a', say: "Lucky for you, I do. People are going for {target}." },
    { by: 'b', say: "Everyone?" },
    { by: 'a', say: "Not everyone. Enough, maybe." },
    { by: 'b', say: "Okay. Okay. Thanks." },
  ] },
  { id: 'gs.n19', when: { merged: true }, turns: [
    { by: 'a', say: "Now that we're all living together, things are moving fast." },
    { by: 'b', say: "Tell me about it. I can't keep track of who hates who." },
    { by: 'a', say: "Well, keep track of this. {target}'s name is moving fastest." },
    { by: 'b', say: "Really? I thought {target} was safe." },
    { by: 'a', say: "Nobody's safe after a merge." },
  ] },
  { id: 'gs.n20', when: { merged: false }, turns: [
    { by: 'a', say: "If we lose the next challenge, I think it's {target}." },
    { by: 'b', say: "Who said that?" },
    { by: 'a', say: "A couple of people. I'm not saying who." },
    { by: 'b', say: "Come on!" },
    { by: 'a', say: "Nope. I promised." },
  ] },
  { id: 'gs.n21', when: { band: 'friends' }, turns: [
    { by: 'a', say: "I tell you everything, right?" },
    { by: 'b', say: "You tell me way too much, actually." },
    { by: 'a', say: "Then here's one more thing. People want {target} out." },
    { by: 'b', say: "Okay, that one I actually needed. Thank you." },
    { beat: "{a} squeezes {b}'s arm and heads back to the others." },
  ] },
  { id: 'gs.n22', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um. Can I tell you something I heard? You can ignore it." },
    { by: 'b', say: "I'm not going to ignore it. What is it?" },
    { by: 'a', say: "I think people are going to vote for {target}. I'm not sure. That's just what it sounded like." },
    { by: 'b', say: "That's really useful. Thanks." },
    { beat: '{a} goes a bit red.' },
  ] },
  { id: 'gs.n23', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Three conversations today. Every one of them ended up on {target}." },
    { by: 'b', say: "That's a lot of people saying the same name." },
    { by: 'a', say: "That's what I thought." },
    { by: 'b', say: "So what are you going to do?" },
    { by: 'a', say: "Keep listening. You should too." },
  ] },
  { id: 'gs.n24', when: { spot: 'cabins' }, turns: [
    { beat: '{a} shuts the cabin door behind {a.obj} and checks under the bunks.' },
    { by: 'b', say: "What are you doing?" },
    { by: 'a', say: "Making sure nobody's under there. People want {target} out." },
    { by: 'b', say: "And you checked under the bed for that?" },
    { by: 'a', say: "You can never be too careful in this place." },
  ] },
  { id: 'gs.n25', when: { spot: 'forest-trail' }, turns: [
    { beat: '{a} and {b} walk a little way down the trail, out of earshot.' },
    { by: 'b', say: "If you've dragged me out here to look at a bird, I'm going back." },
    { by: 'a', say: "No bird. {target}'s name is going round." },
    { by: 'b', say: "For the vote?" },
    { by: 'a', say: "For the vote. Now let's go back before anyone notices we're gone." },
  ] },
  { id: 'gs.n26', when: { lastBoot: true }, turns: [
    { by: 'b', say: "I'm still not over {lastBoot}. Nobody told me anything." },
    { by: 'a', say: "Then let me tell you something this time. It's {target} next." },
    { by: 'b', say: "Already?" },
    { by: 'a', say: "Already. This place doesn't wait around." },
    { by: 'b', say: "Okay. Thanks for not letting me find out at the vote again." },
  ] },
  { id: 'gs.n27', when: { spot: 'mess-hall' }, turns: [
    { beat: '{a} pokes at something grey on {a.posAdj} tray.' },
    { by: 'a', say: "Is this meat or a sponge?" },
    { by: 'b', say: "Don't ask. Just eat it." },
    { by: 'a', say: "Fine. Speaking of things nobody wants around: people want {target} gone." },
    { by: 'b', say: "Harsh." },
    { by: 'a', say: "Hey, I'm just the messenger." },
  ] },
];

const WARN = [
  { id: 'gs.w1', turns: [
    { by: 'a', say: "I need to tell you something, and you're not going to like it." },
    { by: 'b', say: "You're breaking up with me?" },
    { by: 'a', say: "Funny. No. Your name's going round for the vote." },
    { by: 'b', say: "My name? Who's saying it?" },
    { by: 'a', say: "I don't know everyone. But I've heard it more than once." },
  ] },
  { id: 'gs.w2', turns: [
    { beat: '{a} waits until nobody else is close enough to hear.' },
    { by: 'a', say: "Be careful. People are saying your name." },
    { by: 'b', say: "Seriously? What did I do?" },
    { by: 'a', say: "I don't know. But if I were you, I'd start talking to people. Like, now." },
    { by: 'b', say: "Great. Fantastic. Just what I needed." },
  ] },
  { id: 'gs.w3', turns: [
    { by: 'b', say: "Why are you looking at me like that?" },
    { by: 'a', say: "Because I don't want you to be blindsided." },
    { by: 'b', say: "Blindsided by what?" },
    { by: 'a', say: "Your name is out there. That's all I know." },
    { beat: '{b} sits down very slowly.' },
  ] },
  { id: 'gs.w4', when: T, turns: [
    { by: 'a', say: "Your name's come up. I'm telling you because you'd do the same for me." },
    { by: 'b', say: "I would. Okay. Who do I need to talk to?" },
    { by: 'a', say: "Anyone who isn't already set on it. Start with the quiet ones." },
    { by: 'b', say: "I owe you one." },
    { by: 'a', say: "You owe me about five. But who's counting?" },
  ] },
  { id: 'gs.w5', when: T, turns: [
    { by: 'a', say: "They're talking about you. For the next vote." },
    { by: 'b', say: "How bad is it?" },
    { by: 'a', say: "Bad enough that I came to find you." },
    { by: 'b', say: "Okay. Okay. Don't panic. I'm not panicking. Are you panicking?" },
    { by: 'a', say: "You're panicking." },
  ] },
  { id: 'gs.w6', when: G, turns: [
    { by: 'a', say: "I'd watch your back. Your name's being said." },
    { by: 'b', say: "And why are you telling me?" },
    { by: 'a', say: "Because I'm nice?" },
    { by: 'b', say: "Nobody's that nice out here." },
    { by: 'b', conf: "Either {a} is trying to help me, or {a} wants to see how I react. I'm not giving {a.obj} anything." },
  ] },
  { id: 'gs.w7', when: G, turns: [
    { by: 'a', say: "People are coming after you." },
    { by: 'b', say: "People are always coming after someone." },
    { by: 'a', say: "This time it's you." },
    { by: 'b', say: "Noted." },
    { beat: '{b} walks off without another word.' },
  ] },
  { id: 'gs.w8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I hate telling you this. Your name's going round." },
    { by: 'b', say: "Oh no. Oh no, no, no." },
    { by: 'a', say: "I'm so sorry. I just didn't want you to find out at the vote." },
    { by: 'b', say: "No, I'm glad you told me. I think." },
    { beat: '{a} gives {b} a hug.' },
  ] },
  { id: 'gs.w9', turns: [
    { by: 'a', say: "Hey. Got a second?" },
    { by: 'b', say: "Sure. What's up?" },
    { by: 'a', say: "I heard your name. For the vote. Sorry." },
    { by: 'b', say: "Wow. Well, there goes my good mood." },
  ] },
  { id: 'gs.w10', when: { tribal: true }, turns: [
    { by: 'a', say: "I don't want to scare you, but your name's out there for tonight." },
    { by: 'b', say: "Tonight? Are you serious?" },
    { by: 'a', say: "I wish I wasn't." },
    { by: 'b', say: "Okay. I need to go talk to some people. Like, all of them." },
    { beat: '{b} hurries off.' },
  ] },
  { id: 'gs.w11', when: { band: 'friends' }, turns: [
    { by: 'a', say: "You'd want to know, wouldn't you? If it was you?" },
    { by: 'b', say: "If what was me?" },
    { by: 'a', say: "Your name's being said. I'm not letting you walk into that blind." },
    { by: 'b', say: "This is why you're my favourite person here." },
  ] },
  { id: 'gs.w12', when: { rival: true }, turns: [
    { by: 'a', say: "Your name's out there. And I'd bet anything {rival} is behind it." },
    { by: 'b', say: "{rival}? I wouldn't be surprised." },
    { by: 'a', say: "Me neither. Just be careful." },
    { by: 'b', say: "Careful is my middle name." },
    { by: 'a', say: "Since when?" },
  ] },
];

const CONFIDE = [
  { id: 'gs.c1', turns: [
    { by: 'a', say: "I think I'm in trouble." },
    { by: 'b', say: "What did you do?" },
    { by: 'a', say: "Nothing! That's the problem! My name's out there anyway." },
    { by: 'b', say: "Who told you that?" },
    { by: 'a', say: "Does it matter? I heard it." },
  ] },
  { id: 'gs.c2', turns: [
    { by: 'a', say: "Can I be honest with you? I'm scared about the next vote." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because people are saying my name, and I don't know how many of them." },
    { by: 'b', say: "That's rough." },
    { by: 'a', say: "That's it? 'That's rough'?" },
    { by: 'b', say: "What do you want me to say? It IS rough." },
  ] },
  { id: 'gs.c3', turns: [
    { by: 'a', say: "I'm going to ask you straight. Am I next?" },
    { by: 'b', say: "Why would you think that?" },
    { by: 'a', say: "Because I've heard my name. More than once." },
    { by: 'b', say: "I don't know what to tell you." },
    { by: 'a', say: "You could start with 'no'." },
  ] },
  { id: 'gs.c4', when: T, turns: [
    { by: 'a', say: "I need your help. My name's out there." },
    { by: 'b', say: "Okay. Breathe. Who's saying it?" },
    { by: 'a', say: "I don't know exactly. I just need someone in my corner at the vote." },
    { by: 'b', say: "Let me find out what's going on." },
    { by: 'a', say: "Thank you. Seriously." },
  ] },
  { id: 'gs.c5', when: T, turns: [
    { by: 'a', say: "Be honest with me. Have you heard my name?" },
    { by: 'b', say: "...Maybe." },
    { by: 'a', say: "I knew it! I knew it!" },
    { by: 'b', say: "Hey. Calm down. Let's talk about it properly." },
  ] },
  { id: 'gs.c6', when: G, turns: [
    { by: 'a', say: "I think they're coming for me next." },
    { by: 'b', say: "Maybe. I wouldn't know." },
    { by: 'a', say: "You'd tell me if you knew, right?" },
    { by: 'b', say: "Sure." },
    { by: 'b', conf: "I'm not getting dragged into {a}'s problem. I've got enough of my own." },
  ] },
  { id: 'gs.c7', when: G, turns: [
    { by: 'a', say: "My name's out there and I need votes." },
    { by: 'b', say: "I can't promise you anything." },
    { by: 'a', say: "I'm not asking for a promise. Just think about it." },
    { by: 'b', say: "I'll think about it." },
    { beat: '{a} watches {b} walk away.' },
  ] },
  { id: 'gs.c8', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "So apparently I'm next. Great. Just great." },
    { by: 'b', say: "Who told you?" },
    { by: 'a', say: "Doesn't matter. If they want me gone, they're going to have to work for it." },
    { by: 'b', say: "Just don't do anything stupid." },
    { by: 'a', say: "No promises." },
  ] },
  { id: 'gs.c9', when: { rival: true }, turns: [
    { by: 'a', say: "My name's going round. Want to guess who started it?" },
    { by: 'b', say: "{rival}?" },
    { by: 'a', say: "{rival}. It's always {rival}." },
    { by: 'b', say: "You don't know that for sure." },
    { by: 'a', say: "I know {rival}. That's sure enough for me." },
  ] },
];

export default {
  'flow.gossip.name': NAME,
  'flow.gossip.warn': WARN,
  'flow.gossip.confide': CONFIDE,
};
