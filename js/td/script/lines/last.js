// ══════════════════════════════════════════════════════════════════════
// td/script/lines/last.js — the too-comfortable, villains, fake idols, merge goats, tactical finds
// ══════════════════════════════════════════════════════════════════════
//
// blind.comfy.any — {a} notices {b} is far too relaxed about the vote. To the camera.
// blind.clock.any — {a} quietly checks in on {b}, or floats {b}'s name. {b} has no idea.
// villain.gloat.any — {a}, a villain, is delighted {fallen} went home. To the camera.
// villain.loyal.any — {a}, ruthless with everyone else, promises {b} protection.
// adv.fakecaught.any — {a} catches {b} making a fake idol, and tells everyone.
// goat.merge.<one|many> — at the merge, {a} sizes up the weakest challenge
//   records ({goats}; 'one': just {target}) as people to take to the end.
// adv.found.<tactical> — {a} finds a {label}: teamswap, voteblock, votesteal,
//   safetynopower, solevote. Ids: 'ls.'.
const C = (id, ...lines) => ({ id, turns: lines.map(l => ({ by: 'a', conf: l })) });
const Cw = (id, when, ...lines) => ({ id, when, turns: lines.map(l => ({ by: 'a', conf: l })) });

const COMFY = [
  C('ls.c1', "{b} is wandering around camp like there's nothing to worry about. There's plenty to worry about."),
  C('ls.c2', "{b} hasn't asked about the vote in days. Either {b} knows something, or {b} has no idea what's coming."),
  C('ls.c3', "{b} is way too relaxed. I'd be scared, if I were {b}."),
  Cw('ls.c4', { register: 'schemer' }, "Comfortable people are the easiest people to blindside. {b} is very, very comfortable."),
  C('ls.c5', "{b} took a nap during the scramble. A nap! I'm writing that down."),
  C('ls.c6', "I don't think {b} realises how much trouble {b} is in. I'm not going to be the one to tell {b.obj}."),
];
const CLOCK = [
  { id: 'ls.k1', turns: [
    { by: 'a', say: "Hey, how are you feeling about everything?" },
    { by: 'b', say: "Great, honestly. Never better." },
    { by: 'a', say: "Good. That's good." },
    { by: 'a', conf: "'Never better.' I'm going to mention {b}'s name to one person. Just to see what happens." },
  ] },
  { id: 'ls.k2', turns: [
    { by: 'a', say: "You seem really chill today." },
    { by: 'b', say: "Why wouldn't I be?" },
    { by: 'a', say: "No reason." },
    { by: 'a', conf: "There's a reason. {b} just doesn't know it yet." },
  ] },
  { id: 'ls.k3', turns: [
    { by: 'a', say: "Got any plans for the vote?" },
    { by: 'b', say: "Not really. I'm just going with the flow." },
    { by: 'a', say: "The flow. Right." },
    { by: 'a', conf: "The flow is heading straight for {b}. I might just give it a little push." },
  ] },
  { id: 'ls.k4', turns: [
    { by: 'a', conf: "I floated {b}'s name to one person today. Just once. Just to test it." },
    { by: 'a', conf: "Nobody said no." },
  ] },
  { id: 'ls.k5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Morning. Sleep well?" },
    { by: 'b', say: "Like a baby." },
    { by: 'a', conf: "{b} sleeps well because {b} isn't paying attention. I am." },
  ] },
  { id: 'ls.k6', turns: [
    { by: 'b', say: "What's up? You look like you're thinking hard." },
    { by: 'a', say: "Just about dinner." },
    { by: 'a', conf: "I wasn't thinking about dinner. I was thinking about {b}." },
  ] },
];
const GLOAT = [
  C('ls.g1', "{fallen} is gone, and I'm not going to pretend I'm sad about it."),
  C('ls.g2', "One down. I'm in an excellent mood today."),
  C('ls.g3', "Goodbye, {fallen}. Don't let the door hit you on the way out."),
  C('ls.g4', "Everyone's mourning {fallen}. I'm celebrating. Quietly. Mostly."),
  Cw('ls.g5', { register: 'schemer' }, "{fallen} never stood a chance against me. Nobody does."),
  C('ls.g6', "I couldn't stand {fallen}. And now I don't have to. What a lovely morning."),
];
const VLOYAL = [
  { id: 'ls.v1', turns: [
    { by: 'a', say: "Listen to me. Nobody touches you. Nobody." },
    { by: 'b', say: "Is that strategy?" },
    { by: 'a', say: "It's a promise." },
    { by: 'a', conf: "I'd vote out my own mother. But not {b}." },
  ] },
  { id: 'ls.v2', turns: [
    { by: 'b', say: "Why are you so nice to me? You're not nice to anybody." },
    { by: 'a', say: "I'm nice to the people who matter." },
    { by: 'b', say: "And I matter?" },
    { by: 'a', say: "You matter." },
  ] },
  { id: 'ls.v3', turns: [
    { by: 'a', say: "If anyone comes after you, they come after me." },
    { by: 'b', say: "That's... intense." },
    { by: 'a', say: "Get used to it." },
  ] },
  { id: 'ls.v4', turns: [
    { by: 'a', conf: "Everybody thinks I'm cold. I'm cold to them. {b} is different." },
    { by: 'a', conf: "{b} goes to the end with me. That's not up for debate." },
  ] },
  { id: 'ls.v5', turns: [
    { by: 'a', say: "Stick with me and you'll be fine." },
    { by: 'b', say: "And everybody else?" },
    { by: 'a', say: "Everybody else is somebody else's problem." },
  ] },
  { id: 'ls.v6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll be honest with you. And only you." },
    { by: 'b', say: "Okay..." },
    { by: 'a', say: "You're the one person I'm not playing." },
    { by: 'b', say: "I believe you." },
  ] },
];
const FAKECAUGHT = [
  { id: 'ls.f1', turns: [
    { by: 'a', say: "What are you making?" },
    { by: 'b', say: "Nothing!" },
    { by: 'a', say: "That's a fake idol. You're making a fake idol!" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "No way. Everybody's going to hear about this." },
  ] },
  { id: 'ls.f2', turns: [
    { beat: '{a} catches {b} painting something small and round, far from camp.' },
    { by: 'a', say: "Is that... a fake idol?" },
    { by: 'b', say: "It's art." },
    { by: 'a', say: "It's a fake idol." },
    { beat: 'By dinner, everyone knows.' },
  ] },
  { id: 'ls.f3', turns: [
    { by: 'a', say: "Hey everyone! {b} was making a fake idol!" },
    { by: 'b', say: "That's not true!" },
    { by: 'a', say: "I literally watched you bury it!" },
  ] },
  { id: 'ls.f4', turns: [
    { by: 'a', conf: "I followed {b} into the woods. {b} was burying something. I dug it up. It's a fake idol." },
    { by: 'a', conf: "{b} tried to play all of us. Not anymore." },
  ] },
  { id: 'ls.f5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "A FAKE IDOL? Are you serious?!" },
    { by: 'b', say: "Shh!" },
    { by: 'a', say: "Don't shush me! You were going to trick us all!" },
  ] },
  { id: 'ls.f6', turns: [
    { by: 'b', say: "Okay, before you say anything, I can explain." },
    { by: 'a', say: "Explain the fake idol? Go ahead. I'll wait." },
    { beat: "{b} can't explain the fake idol." },
  ] },
];
const GOAT_ONE = [
  C('ls.o1', "{target} has the worst challenge record here. Which makes {target} the perfect person to sit next to at the end."),
  C('ls.o2', "Nobody's going to beat me in a final vote against {target}. I just have to get us both there."),
  Cw('ls.o3', { register: 'schemer' }, "{target} is my ticket to the end. {target} just doesn't know it yet."),
  C('ls.o4', "I like {target}. I also like that {target} has never won anything."),
  C('ls.o5', "{target} is a vote I can count on, and a person I can beat. Perfect."),
  C('ls.o6', "Every winner needs someone to beat at the end. I think I've found mine. {target}."),
];
const GOAT_MANY = [
  C('ls.m1', "{goats}. Not the strongest in challenges. Very useful at the end, though."),
  C('ls.m2', "Looking around the merge, I see a few people I'd love to sit next to at the end. {goats}."),
  Cw('ls.m3', { register: 'schemer' }, "{goats}. Every one of them is someone I could beat in a final vote. I just have to pick."),
  C('ls.m4', "The strong players are going to knock each other out. Meanwhile, {goats} will still be here. I want to be with them."),
  C('ls.m5', "I'm not going after {goats}. I'm keeping them around. On purpose."),
  C('ls.m6', "Everybody's counting threats. I'm counting easy wins. {goats}."),
];
const TACTICAL = {
  teamswap: [
    C('ls.t1', "I found a {label}. I can move somebody to another tribe. Maybe me. Maybe someone I don't like."),
    C('ls.t2', "This changes everything. If things go wrong here, I've got a way out."),
    C('ls.t3', "A {label}. Nobody knows. That's how it's staying."),
    Cw('ls.t4', { register: 'schemer' }, "Move my enemy to another tribe? Don't mind if I do."),
    C('ls.t5', "I keep turning it over in my hands. This could save me or sink someone else."),
    C('ls.t6', "I've got an escape route. I just hope I never need it."),
  ],
  voteblock: [
    C('ls.b1', "A {label}. I can stop someone from voting. I already know who."),
    C('ls.b2', "One less vote against me at the next Tribal. I like those odds."),
    C('ls.b3', "Nobody saw me find it. Nobody's going to see it coming either."),
    Cw('ls.b4', { register: 'schemer' }, "Silencing someone at the vote? That's my favourite kind of advantage."),
    C('ls.b5', "I'm keeping this quiet until the exact right moment."),
    C('ls.b6', "Somebody is going to lose their vote. It isn't going to be me."),
  ],
  votesteal: [
    C('ls.s1', "A {label}. I take someone's vote and use it myself. That's two for me, one less for them."),
    C('ls.s2', "This is the kind of thing that wins a close vote. And they're all close."),
    C('ls.s3', "I read it twice to be sure. It's real. Nobody's going to know until it's too late."),
    Cw('ls.s4', { register: 'schemer' }, "Taking someone's vote right out of their hand? Beautiful."),
    C('ls.s5', "I've already got someone in mind. They're going to be so surprised."),
    C('ls.s6', "One vote can change everything. Now I've got an extra one."),
  ],
  safetynopower: [
    C('ls.n1', "A {label}. I can walk out of Tribal and be safe. But I lose my vote."),
    C('ls.n2', "An escape hatch. Do I have the nerve to use it, though? Walking out looks terrible."),
    C('ls.n3', "Safe, but silent. It's a weird trade. I'm keeping it anyway."),
    Cw('ls.n4', { register: 'fiery' }, "Walk out of Tribal? Me? Never. Unless I have to. Then absolutely."),
    C('ls.n5', "I hope I never need this. But if I do, I'll be very glad I've got it."),
    C('ls.n6', "Nobody knows I could just leave. That's a nice thing to know."),
  ],
  solevote: [
    C('ls.o7', "A {label}. If I play it, mine is the only vote that counts. Everyone else is silenced."),
    C('ls.o8', "I could decide who goes home. Me. Just me. That's terrifying."),
    C('ls.o9', "No discussion. No majority. Just my vote. I'm almost scared to hold it."),
    Cw('ls.o10', { register: 'schemer' }, "One vote. Mine. That's my kind of democracy."),
    C('ls.o11', "I have to be so careful with this. Play it wrong and everyone hates me."),
    C('ls.o12', "The most powerful thing in the game is in my pocket right now. Wow."),
  ],
};

export default {
  'blind.comfy.any': COMFY,
  'blind.clock.any': CLOCK,
  'villain.gloat.any': GLOAT,
  'villain.loyal.any': VLOYAL,
  'adv.fakecaught.any': FAKECAUGHT,
  'goat.merge.one': GOAT_ONE,
  'goat.merge.many': GOAT_MANY,
  ...Object.fromEntries(Object.entries(TACTICAL).map(([k, v]) => [`adv.found.${k}`, v])),
};

export const GUARANTEED = { 'villain.gloat.any': ['fallen'] };
