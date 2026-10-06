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
// nothing away). Either way {b} promises nothing about the vote. Ids: 'gs.'.
const T = { result: 'trusted' }, G = { result: 'guarded' };

const NAME = [
  { id: 'gs.n1', turns: [
    { by: 'a', say: "Have you heard what people are saying?" },
    { by: 'b', say: "No. What?" },
    { by: 'a', say: "{target}. That's the name going round for the vote." },
    { by: 'b', say: "Huh. Okay." },
    { beat: '{b} nods slowly, and says nothing else.' },
  ] },
  { id: 'gs.n2', turns: [
    { beat: '{a} drops {a.posAdj} voice.' },
    { by: 'a', say: "Just so you know, a few people want {target} gone." },
    { by: 'b', say: "Who's a few people?" },
    { by: 'a', say: "Enough of them. I'm just telling you what I heard." },
    { by: 'b', say: "Thanks for telling me." },
  ] },
  { id: 'gs.n3', turns: [
    { by: 'b', say: "Is there a plan for the vote? Nobody's telling me anything." },
    { by: 'a', say: "I keep hearing {target}." },
    { by: 'b', say: "{target}? Really?" },
    { by: 'a', say: "Really. Don't say I told you." },
  ] },
  { id: 'gs.n4', turns: [
    { by: 'a', say: "Can I tell you something without it getting back to anyone?" },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "{target}'s name is out there. People are talking about it." },
    { by: 'b', say: "I didn't know that." },
    { by: 'a', say: "Well, now you do." },
  ] },
  { id: 'gs.n5', when: { result: 'trusted', tribal: true }, turns: [
    { by: 'a', say: "I think it's going to be {target} tonight." },
    { by: 'b', say: "Who's pushing it?" },
    { by: 'a', say: "I don't know for sure. I just keep hearing the name." },
    { by: 'b', say: "And how many votes is that?" },
    { by: 'a', say: "Maybe enough." },
    { by: 'b', say: "Okay. Let me think about it." },
  ] },
  { id: 'gs.n6', when: T, turns: [
    { by: 'a', say: "{target}. That's who people are talking about." },
    { by: 'b', say: "Are you voting that way?" },
    { by: 'a', say: "I haven't decided. What about you?" },
    { by: 'b', say: "I don't know yet. But thank you. Seriously." },
  ] },
  { id: 'gs.n7', when: G, turns: [
    { by: 'a', say: "People want {target} out. I thought you should know." },
    { by: 'b', say: "Okay." },
    { by: 'a', say: "That's it? Just okay?" },
    { by: 'b', say: "What do you want me to say?" },
    { beat: '{a} shrugs and leaves {b} alone.' },
  ] },
  { id: 'gs.n8', when: G, turns: [
    { by: 'a', say: "I heard it might be {target} next time we vote." },
    { by: 'b', say: "Where did you hear that?" },
    { by: 'a', say: "Around." },
    { by: 'b', say: "Right. Well, thanks." },
    { by: 'b', conf: "{a} is telling me this for a reason. I just don't know what the reason is yet." },
  ] },
  { id: 'gs.n9', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'm only telling you this because I like you." },
    { by: 'b', say: "Telling me what?" },
    { by: 'a', say: "{target} is the name. If you're smart, you'll be on the right side of it." },
    { by: 'b', say: "And which side is the right side?" },
    { by: 'a', say: "The one with the numbers." },
  ] },
  { id: 'gs.n10', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, did you know people are going after {target}?" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "Sorry. Sorry. But did you know?" },
    { by: 'b', say: "I do now." },
  ] },
  { id: 'gs.n11', when: { alliance: true }, turns: [
    { by: 'a', say: "Heads up. {target}'s name is out there." },
    { by: 'b', say: "Does the rest of the alliance know?" },
    { by: 'a', say: "Not yet. I wanted to tell you first." },
    { by: 'b', say: "Okay. Let's keep it between us for now." },
  ] },
  { id: 'gs.n12', turns: [
    { by: 'b', say: "You've been quiet all day. What's going on?" },
    { by: 'a', say: "I've been listening. And I keep hearing one name." },
    { by: 'b', say: "Whose?" },
    { by: 'a', say: "{target}'s." },
    { by: 'b', say: "Oh. Okay. Good to know." },
  ] },
  { id: 'gs.n13', turns: [
    { by: 'a', say: "Don't look now, but {target} has no idea." },
    { by: 'b', say: "No idea about what?" },
    { by: 'a', say: "That people want {target.obj} gone." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since today, as far as I can tell." },
  ] },
  { id: 'gs.n14', turns: [
    { by: 'a', say: "Quick question. Where are you at with {target}?" },
    { by: 'b', say: "Fine, I guess. Why?" },
    { by: 'a', say: "Because people are talking about voting {target.obj} out." },
    { by: 'b', say: "Seriously? I hadn't heard anything." },
    { by: 'a', say: "Now you have." },
  ] },
  { id: 'gs.n15', turns: [
    { by: 'a', say: "You didn't hear this from me." },
    { by: 'b', say: "Hear what?" },
    { by: 'a', say: "{target}. People are lining up against {target.obj}." },
    { by: 'b', say: "Okay. I didn't hear it from you." },
  ] },
  { id: 'gs.n16', turns: [
    { by: 'b', say: "So who's in trouble?" },
    { by: 'a', say: "If I had to guess? {target}." },
    { by: 'b', say: "Why {target}?" },
    { by: 'a', say: "I don't know why. I just know people keep saying it." },
    { beat: '{b} thinks about that for a second.' },
  ] },
  { id: 'gs.n17', when: { tribal: true }, turns: [
    { by: 'a', say: "Okay, so it's looking like {target} tonight." },
    { by: 'b', say: "Is that for sure?" },
    { by: 'a', say: "Nothing's for sure. But that's the name I keep hearing." },
    { by: 'b', say: "Thanks. I'll think about it." },
  ] },
  { id: 'gs.n18', when: { tribal: true }, turns: [
    { by: 'b', say: "We've got Tribal in a few hours and I still don't know anything." },
    { by: 'a', say: "Then let me help. People are going for {target}." },
    { by: 'b', say: "Everyone?" },
    { by: 'a', say: "Not everyone. Enough, maybe." },
    { by: 'b', say: "Okay. Okay." },
  ] },
  { id: 'gs.n19', when: { merged: true }, turns: [
    { by: 'a', say: "Now that we're all on one beach, things are moving fast." },
    { by: 'b', say: "Tell me about it." },
    { by: 'a', say: "{target}'s name is the one moving fastest." },
    { by: 'b', say: "Really? I thought {target} was safe." },
    { by: 'a', say: "Nobody's safe after a merge." },
  ] },
  { id: 'gs.n20', when: { merged: false }, turns: [
    { by: 'a', say: "If we lose the next one, I think it's {target}." },
    { by: 'b', say: "Who said that?" },
    { by: 'a', say: "A couple of people. I'm not saying who." },
    { by: 'b', say: "Fine. Thanks for telling me." },
  ] },
  { id: 'gs.n21', when: { band: 'friends' }, turns: [
    { by: 'a', say: "I tell you everything, right?" },
    { by: 'b', say: "Pretty much." },
    { by: 'a', say: "So here's the latest. People want {target} out." },
    { by: 'b', say: "Wow. Okay. Thank you." },
    { beat: "{a} squeezes {b}'s arm and heads back to the others." },
  ] },
  { id: 'gs.n22', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um. Can I tell you something I heard?" },
    { by: 'b', say: "Sure, what is it?" },
    { by: 'a', say: "I think people are going to vote for {target}. I'm not sure. That's just what I heard." },
    { by: 'b', say: "That's helpful. Really." },
    { beat: '{a} smiles a little.' },
  ] },
  { id: 'gs.n23', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Three conversations today. All of them ended up on {target}." },
    { by: 'b', say: "That's a lot of people saying the same name." },
    { by: 'a', say: "That's what I thought." },
    { by: 'b', say: "So what are you going to do?" },
    { by: 'a', say: "Listen some more." },
  ] },
  { id: 'gs.n24', when: { spot: 'cabins' }, turns: [
    { beat: '{a} closes the cabin door behind {a.obj}.' },
    { by: 'a', say: "Okay, nobody's out there. People are talking about {target}." },
    { by: 'b', say: "Voting {target.obj} out?" },
    { by: 'a', say: "That's what it sounds like." },
    { by: 'b', say: "Thanks. I owe you one." },
  ] },
  { id: 'gs.n25', when: { spot: 'forest-trail' }, turns: [
    { beat: '{a} and {b} walk a little way down the trail, out of earshot.' },
    { by: 'a', say: "This is far enough. {target}'s name is going round." },
    { by: 'b', say: "For the vote?" },
    { by: 'a', say: "For the vote." },
    { by: 'b', say: "Good to know. Let's head back before anyone notices." },
  ] },
];

const WARN = [
  { id: 'gs.w1', turns: [
    { by: 'a', say: "I need to tell you something, and you're not going to like it." },
    { by: 'b', say: "What?" },
    { by: 'a', say: "Your name's being thrown around. For the vote." },
    { by: 'b', say: "My name? By who?" },
    { by: 'a', say: "I don't know everyone. But I heard it more than once." },
  ] },
  { id: 'gs.w2', turns: [
    { beat: '{a} waits until nobody else is close enough to hear.' },
    { by: 'a', say: "Be careful. People are saying your name." },
    { by: 'b', say: "Seriously?" },
    { by: 'a', say: "Seriously. I'd start talking to people if I were you." },
  ] },
  { id: 'gs.w3', turns: [
    { by: 'b', say: "Why are you looking at me like that?" },
    { by: 'a', say: "Because I like you, and I don't want you to be blindsided." },
    { by: 'b', say: "Blindsided by what?" },
    { by: 'a', say: "Your name is out there. That's all I know." },
    { beat: '{b} sits down.' },
  ] },
  { id: 'gs.w4', when: T, turns: [
    { by: 'a', say: "Your name's come up. I'm telling you because you'd tell me." },
    { by: 'b', say: "I would. Okay. Who do I need to talk to?" },
    { by: 'a', say: "Anyone who isn't already set on it. Start with the quiet ones." },
    { by: 'b', say: "Thank you. I mean it." },
  ] },
  { id: 'gs.w5', when: T, turns: [
    { by: 'a', say: "They're talking about you. For the next vote." },
    { by: 'b', say: "How bad is it?" },
    { by: 'a', say: "I don't know. Bad enough that I came to find you." },
    { by: 'b', say: "Okay. Okay. I'll figure something out." },
  ] },
  { id: 'gs.w6', when: G, turns: [
    { by: 'a', say: "I'd watch your back. Your name's being said." },
    { by: 'b', say: "And why are you telling me?" },
    { by: 'a', say: "Because I thought you'd want to know." },
    { by: 'b', say: "Right." },
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
    { by: 'b', say: "Oh no." },
    { by: 'a', say: "I'm sorry. I just didn't want you to hear it at the vote." },
    { by: 'b', say: "No, I'm glad you told me. Thank you." },
    { beat: '{a} gives {b} a hug.' },
  ] },
  { id: 'gs.w9', turns: [
    { by: 'a', say: "Hey. Have you got a second?" },
    { by: 'b', say: "Yeah, what's up?" },
    { by: 'a', say: "I heard your name. For the vote. I'm sorry." },
    { by: 'b', say: "Wow. Okay. Thanks for telling me." },
  ] },
  { id: 'gs.w10', when: { tribal: true }, turns: [
    { by: 'a', say: "I don't want to scare you, but your name's out there for tonight." },
    { by: 'b', say: "Tonight? Are you serious?" },
    { by: 'a', say: "I wish I wasn't." },
    { by: 'b', say: "Okay. I need to go talk to some people." },
    { beat: '{b} hurries off.' },
  ] },
  { id: 'gs.w11', when: { band: 'friends' }, turns: [
    { by: 'a', say: "You'd want to know, wouldn't you? If it was you?" },
    { by: 'b', say: "If what was me?" },
    { by: 'a', say: "Your name's being said. I'm not going to let you walk into that blind." },
    { by: 'b', say: "Thank you. I mean it. Thank you." },
  ] },
];

const CONFIDE = [
  { id: 'gs.c1', turns: [
    { by: 'a', say: "I think I'm in trouble." },
    { by: 'b', say: "What do you mean?" },
    { by: 'a', say: "My name's out there. People are talking about voting me out." },
    { by: 'b', say: "Who told you that?" },
    { by: 'a', say: "Does it matter? I heard it." },
  ] },
  { id: 'gs.c2', turns: [
    { by: 'a', say: "Can I be honest with you? I'm scared about the next vote." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because people are saying my name, and I don't know how many." },
    { by: 'b', say: "That's rough." },
    { beat: '{a} stares at the ground.' },
  ] },
  { id: 'gs.c3', turns: [
    { by: 'a', say: "I'm going to ask you straight. Am I next?" },
    { by: 'b', say: "Why would you think that?" },
    { by: 'a', say: "Because I've heard my name. More than once." },
    { by: 'b', say: "I don't know what to tell you." },
  ] },
  { id: 'gs.c4', when: T, turns: [
    { by: 'a', say: "I need your help. My name's out there." },
    { by: 'b', say: "Okay. Who's saying it?" },
    { by: 'a', say: "I don't know exactly. I just need someone on my side at the vote." },
    { by: 'b', say: "Let me find out what's going on." },
    { by: 'a', say: "Thank you." },
  ] },
  { id: 'gs.c5', when: T, turns: [
    { by: 'a', say: "Be honest with me. Have you heard my name?" },
    { by: 'b', say: "...Maybe." },
    { by: 'a', say: "I knew it. I knew it." },
    { by: 'b', say: "Hey. Calm down. Let's talk about it properly." },
  ] },
  { id: 'gs.c6', when: G, turns: [
    { by: 'a', say: "I think they're coming for me next." },
    { by: 'b', say: "Maybe. I wouldn't know." },
    { by: 'a', say: "You'd tell me if you knew, right?" },
    { by: 'b', say: "Sure." },
    { by: 'b', conf: "I'm not getting dragged into {a}'s problem. I've got my own game to worry about." },
  ] },
  { id: 'gs.c7', when: G, turns: [
    { by: 'a', say: "My name's out there and I need votes." },
    { by: 'b', say: "I can't promise you anything." },
    { by: 'a', say: "I'm not asking for a promise. Just think about it." },
    { by: 'b', say: "I'll think about it." },
    { beat: '{a} watches {b} walk away.' },
  ] },
  { id: 'gs.c8', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "So apparently I'm next. Great." },
    { by: 'b', say: "Who told you?" },
    { by: 'a', say: "Doesn't matter. If they want me gone, they're going to have to work for it." },
    { by: 'b', say: "Just don't do anything stupid." },
    { by: 'a', say: "No promises." },
  ] },
];

export default {
  'flow.gossip.name': NAME,
  'flow.gossip.warn': WARN,
  'flow.gossip.confide': CONFIDE,
};
