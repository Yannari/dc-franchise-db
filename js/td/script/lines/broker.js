// ══════════════════════════════════════════════════════════════════════
// td/script/lines/broker.js — the information broker (camp-events.js checkInformationBroker)
// ══════════════════════════════════════════════════════════════════════
//
// {a} sits in two alliances at once, {group} and {other}, and carries each one's plans
// to the other.
//
//   broker.start.any       a, alone: the double game begins
//   broker.confidence.any  a, alone: it's still working
//   broker.whisper.any     a feeds b, an ally, a name to worry about
//   broker.steer.any       a points b at {target}, so nobody looks at a
//   broker.close.any       a asks b a question b can't answer: where b's information comes from
//   broker.exposed.any     a exposes b's double game. reason: bold (to everyone) | quiet
//   broker.fallout.any     a, the exposed broker, faces both alliances at once
//   broker.defense.any     a, caught, answers b. reason: bold | broken | spin
//
// Ids: 'bk.'.

const START = [
  { id: 'bk.s1', turns: [
    { by: 'a', conf: "{group} thinks I'm with them. {other} thinks I'm with them. Technically, they're both right." },
  ] },
  { id: 'bk.s2', turns: [
    { beat: '{a} leaves one huddle and walks straight into another.' },
    { by: 'a', conf: "I know what {group} is planning. I know what {other} is planning. Neither of them knows I know both. That's the game I'm playing." },
  ] },
  { id: 'bk.s3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Everybody wants information. I'm the only one who has all of it. That makes me the most important person here, and nobody's even noticed." },
  ] },
  { id: 'bk.s4', turns: [
    { by: 'a', conf: "There's a version of this where I get caught. But right now I know more than anyone else in this game." },
  ] },
  { id: 'bk.s5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I didn't plan this. {group} asked me to join, and then {other} asked me to join, and I said yes both times. Now I'm kind of a spy?" },
  ] },
  { id: 'bk.s6', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Two alliances. One me. I'm going to need a lot of luck and a really good memory." },
  ] },
  { id: 'bk.s7', turns: [
    { by: 'a', conf: "I have to remember who I told what. {group} gets one story, {other} gets another. If I mix them up even once, I'm done." },
  ] },
];

const CONFIDENCE = [
  { id: 'bk.c1', turns: [
    { by: 'a', conf: "Still working. I know what both sides are planning before they plan it. The question isn't whether it works. It's how long." },
  ] },
  { id: 'bk.c2', turns: [
    { by: 'a', conf: "Two alliances. Two sets of plans. And neither one knows about the other. This is the best seat in the game." },
  ] },
  { id: 'bk.c3', when: { register: 'schemer' }, turns: [
    { beat: '{a} is humming to {a.ref} by the fire.' },
    { by: 'a', conf: "{group} told me their plan this morning. I told {other} about it by lunch. I'm having a wonderful day." },
  ] },
  { id: 'bk.c4', turns: [
    { by: 'a', conf: "I had a nightmare that {group} and {other} were sitting together comparing notes. Woke up sweating. Then I remembered they hate each other." },
  ] },
  { id: 'bk.c5', turns: [
    { by: 'a', conf: "Every vote this week, I'll know where it's going before anybody casts it. I've never been this calm in my life." },
  ] },
  { id: 'bk.c6', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I keep waiting to get caught, and it keeps not happening. I think I might actually be good at this?" },
  ] },
];

const WHISPER = [
  { id: 'bk.w1', turns: [
    { by: 'a', say: "Watch out for that one. I've been hearing things." },
    { by: 'b', say: "From who?" },
    { by: 'a', say: "Around." },
    { by: 'a', conf: "{b} didn't ask twice. Nobody ever asks twice." },
  ] },
  { id: 'bk.w2', turns: [
    { by: 'a', say: "I'm only telling you because you're my person. They're coming for your closest ally next." },
    { by: 'b', say: "How do you even know that?" },
    { by: 'a', say: "Because I listen." },
  ] },
  { id: 'bk.w3', turns: [
    { by: 'a', conf: "What I told {b} was true. That's the trick. Mix enough truth in and nobody checks the rest." },
    { by: 'b', say: "Thanks for the heads-up, {a}." },
  ] },
  { id: 'bk.w4', turns: [
    { by: 'b', say: "You always know stuff before anybody else." },
    { by: 'a', say: "I'm a good listener." },
    { by: 'b', say: "Remind me to never tell you a secret." },
    { by: 'a', say: "Ha. Yeah." },
  ] },
  { id: 'bk.w5', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Promise you won't repeat this?" },
    { by: 'b', say: "Who would I even tell?" },
    { by: 'a', say: "The other side is splitting votes. You're one of the names." },
    { by: 'b', say: "I owe you one." },
  ] },
  { id: 'bk.w6', turns: [
    { by: 'a', say: "Don't look now. Two people over there were just talking about you." },
    { by: 'b', say: "What did they say?" },
    { by: 'a', say: "Enough. Just be careful." },
  ] },
];

const STEER = [
  { id: 'bk.m1', turns: [
    { by: 'b', say: "So who's actually running things around here?" },
    { beat: '{a} says nothing. {a} just looks across camp at {target}.' },
    { by: 'b', say: "...Huh. Yeah. That makes sense." },
  ] },
  { id: 'bk.m2', turns: [
    { by: 'a', say: "Have you noticed {target} talks to everybody?" },
    { by: 'b', say: "Now that you mention it." },
    { by: 'a', conf: "I talk to everybody more than {target} does. But {b} isn't looking at me right now." },
  ] },
  { id: 'bk.m3', turns: [
    { by: 'a', say: "I'm not saying {target} is playing both sides. I'm just saying somebody is." },
    { by: 'b', say: "And you think it's {target}?" },
    { by: 'a', say: "I didn't say that." },
  ] },
  { id: 'bk.m4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "When everybody is hunting for a double agent, you hand them a better suspect. {target} is my better suspect." },
    { by: 'a', say: "{b}, keep an eye on {target}. Just trust me." },
  ] },
  { id: 'bk.m5', turns: [
    { by: 'a', say: "{target} was asking me who you trust. Kind of weird, right?" },
    { by: 'b', say: "Very weird." },
  ] },
  { id: 'bk.m6', turns: [
    { by: 'b', say: "Somebody's leaking our plans." },
    { by: 'a', say: "I've been thinking that too. And I've been thinking about who's always nearby when we talk." },
    { by: 'b', say: "{target}?" },
    { by: 'a', say: "You said it, not me." },
  ] },
];

const CLOSE = [
  { id: 'bk.k1', turns: [
    { by: 'a', say: "Who told you that?" },
    { by: 'b', say: "Just heard it around." },
    { by: 'a', say: "Around where? I was there the whole time." },
    { by: 'b', say: "I don't remember. Does it matter?" },
    { by: 'a', conf: "It matters. I'm going to remember it." },
  ] },
  { id: 'bk.k2', turns: [
    { beat: '{b} tells a story about the vote, and one detail is wrong. {a} notices.' },
    { by: 'a', say: "Funny. That's not what you told me yesterday." },
    { by: 'b', say: "Did I say something different?" },
    { by: 'a', say: "Yeah. You did." },
  ] },
  { id: 'bk.k3', turns: [
    { by: 'a', say: "How do you always know what the other side is doing?" },
    { by: 'b', say: "I'm observant." },
    { by: 'a', conf: "Nobody is that observant." },
  ] },
  { id: 'bk.k4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{b} knew about a plan that was only talked about once, in a group {b} isn't part of. There's only one way that happens." },
    { by: 'a', say: "Hey, {b}. Got a minute later?" },
    { by: 'b', say: "Sure. Why?" },
  ] },
  { id: 'bk.k5', turns: [
    { by: 'a', say: "Where do you go every afternoon?" },
    { by: 'b', say: "For walks." },
    { by: 'a', say: "Funny. The other alliance takes walks too. Same time." },
  ] },
  { id: 'bk.k6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If I find out somebody's running back to the other side with our plans..." },
    { by: 'b', say: "You'd what?" },
    { by: 'a', say: "Why are you so interested in what I'd do?" },
  ] },
];

const EXPOSED = [
  { id: 'bk.e1', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "Everyone, stop. {b} has been playing both sides. {group} AND {other}. Ask {b.obj}." },
    { beat: 'Nobody says anything. Everyone is looking at {b}.' },
    { by: 'b', say: "That's... not exactly how it..." },
  ] },
  { id: 'bk.e2', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "You've been feeding {other} our plans and feeding us theirs. It's done, {b}." },
    { by: 'b', say: "I don't know what you're talking about." },
    { by: 'a', say: "Then you won't mind if we all compare notes." },
  ] },
  { id: 'bk.e3', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "Raise your hand if {b} told you a secret about the other alliance this week." },
    { beat: 'Hands go up. On both sides.' },
    { by: 'b', conf: "Oh no." },
  ] },
  { id: 'bk.e4', when: { reason: 'quiet' }, turns: [
    { beat: '{a} pulls three people aside before {b} is even awake. By breakfast, everyone knows.' },
    { by: 'b', say: "Morning, everybody." },
    { beat: 'Nobody answers.' },
  ] },
  { id: 'bk.e5', when: { reason: 'quiet' }, turns: [
    { by: 'a', say: "Hey, {group}. Quick question. What did {b} tell you about our plan?" },
    { beat: 'The answer does not match what {b} told {a}. Not even close.' },
    { by: 'a', conf: "One question. That's all it took." },
  ] },
  { id: 'bk.e6', when: { reason: 'quiet' }, turns: [
    { by: 'a', conf: "I didn't yell. I just asked both alliances the same question and wrote down the answers. {b}'s name was in all of them." },
    { by: 'b', say: "Why is everybody being weird?" },
  ] },
  { id: 'bk.e7', turns: [
    { by: 'a', say: "Both alliances, one person in the middle. Did you think nobody would ever talk to each other?" },
    { by: 'b', say: "I was keeping everybody safe!" },
    { by: 'a', say: "You were keeping you safe." },
  ] },
  { id: 'bk.e8', turns: [
    { by: 'a', say: "Your stories don't match, {b}. {group} heard one thing. {other} heard another. We talked." },
    { by: 'b', conf: "They talked. They were never supposed to talk." },
  ] },
  { id: 'bk.e9', turns: [
    { by: 'a', say: "So which side are you actually on?" },
    { by: 'b', say: "Yours. Obviously." },
    { by: 'a', say: "That's what you told them too." },
  ] },
];

const FALLOUT = [
  { id: 'bk.f1', turns: [
    { beat: 'Members of {group} and {other} sit together for the first time all game, comparing everything {a} ever told them.' },
    { by: 'a', conf: "I'm watching two alliances that hated each other this morning become best friends. Over me." },
  ] },
  { id: 'bk.f2', turns: [
    { by: 'a', say: "Can I sit here?" },
    { beat: 'Everyone shifts so there\'s no room.' },
    { by: 'a', conf: "Guess not." },
  ] },
  { id: 'bk.f3', turns: [
    { by: 'a', conf: "Nobody's yelling at me. I'd honestly prefer the yelling. This is just quiet, and it's everywhere." },
  ] },
  { id: 'bk.f4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "It worked for weeks. Weeks. People will hate me for it, sure. They'll also remember it." },
  ] },
  { id: 'bk.f5', turns: [
    { beat: 'Everyone eats dinner together. {a} eats alone.' },
    { by: 'a', conf: "I knew everything about everybody. Now I don't even know who to sit with." },
  ] },
  { id: 'bk.f6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I never meant to hurt anybody. I just didn't want to choose. And now everyone chose for me." },
  ] },
];

const DEFENSE = [
  { id: 'bk.d1', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "I played the game. Both of you were using me too. You just didn't know I was using you back." },
    { by: 'b', say: "Wow." },
    { by: 'a', say: "You can be mad. But you can't say I wasn't good at it." },
  ] },
  { id: 'bk.d2', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "I had more information than anyone in this game for weeks. That's not betrayal. That's strategy." },
    { by: 'b', say: "Tell that to the jury." },
    { by: 'a', say: "I plan to." },
  ] },
  { id: 'bk.d3', when: { reason: 'bold' }, turns: [
    { by: 'b', say: "Aren't you even going to say sorry?" },
    { by: 'a', say: "For what? Playing?" },
  ] },
  { id: 'bk.d4', when: { reason: 'broken' }, turns: [
    { by: 'a', say: "I can explain. I— it's— okay, I can't explain." },
    { by: 'b', say: "Then don't." },
    { beat: '{a} ends up sitting alone by the fire.' },
  ] },
  { id: 'bk.d5', when: { reason: 'broken' }, turns: [
    { by: 'a', say: "I'm sorry. I'm really sorry." },
    { by: 'b', say: "Sorry isn't going to cut it this time." },
    { by: 'a', conf: "I didn't have a speech ready for this. I never thought I'd need one." },
  ] },
  { id: 'bk.d6', when: { reason: 'broken' }, turns: [
    { by: 'a', say: "Everybody hates me now, don't they?" },
    { by: 'b', say: "Pretty much." },
    { by: 'a', say: "...Yeah. I'd hate me too." },
  ] },
  { id: 'bk.d7', when: { reason: 'spin' }, turns: [
    { by: 'a', say: "I was keeping options open. For all of us." },
    { by: 'b', say: "Nobody believes that, {a}." },
    { by: 'a', conf: "I knew it was over the moment {b} opened {b.posAdj} mouth." },
  ] },
  { id: 'bk.d8', when: { reason: 'spin' }, turns: [
    { by: 'a', say: "I was trying to stop a war between the two sides!" },
    { by: 'b', say: "By telling each side the other one was coming?" },
    { by: 'a', say: "...It sounds worse when you say it." },
  ] },
  { id: 'bk.d9', when: { reason: 'spin' }, turns: [
    { by: 'a', say: "Okay, sure. But think about who that information actually helped." },
    { by: 'b', say: "You." },
    { by: 'a', say: "Well. Also me." },
  ] },
];

export default {
  'broker.start.any': START, 'broker.confidence.any': CONFIDENCE, 'broker.whisper.any': WHISPER,
  'broker.steer.any': STEER, 'broker.close.any': CLOSE, 'broker.exposed.any': EXPOSED,
  'broker.fallout.any': FALLOUT, 'broker.defense.any': DEFENSE,
};

/** Data these scenes always carry. */
export const GUARANTEED = {
  'broker.start.any': ['group', 'other'], 'broker.confidence.any': ['group', 'other'], 'broker.exposed.any': ['group', 'other'],
  'broker.fallout.any': ['group', 'other'], 'broker.steer.any': ['target'],
};
