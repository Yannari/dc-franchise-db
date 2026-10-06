// ══════════════════════════════════════════════════════════════════════
// td/script/lines/tests.js — loyalty tests, and the double dealer found out
// ══════════════════════════════════════════════════════════════════════
//
// test.plant.<named|vague> — {a} tells {b} a lie to see if it travels: the vote
//   is {target} ('vague': no name). Only {a}'s confessional says it's a test.
// test.caught.any  — {a} sees through the test {b} just tried on {a}.
// test.failed.any  — the lie came back to {a}; {b} talked. To the camera.
// test.passed.any  — days later, nothing came back; {b} kept quiet. To the camera.
// deal.double.<confront|alone> — {a} finds out {b} promised the same final two
//   to somebody else ({other}, when known). 'alone': they're on different
//   tribes, so {a} tells the camera. Ids: 'ts.'.
const C = (id, ...lines) => ({ id, turns: lines.map(l => ({ by: 'a', conf: l })) });
const Cw = (id, when, ...lines) => ({ id, when, turns: lines.map(l => ({ by: 'a', conf: l })) });

const PLANT_NAMED = [
  { id: 'ts.p1', turns: [
    { by: 'a', say: "Can you keep a secret? We're voting {target} next." },
    { by: 'b', say: "Really? {target}?" },
    { by: 'a', say: "Really. Just between us." },
    { by: 'a', conf: "We're not voting {target}. I just want to see if that comes back to me. If it does, I'll know {b} talked." },
  ] },
  { id: 'ts.p2', turns: [
    { by: 'a', say: "I'm only telling you this. {target} is going next." },
    { by: 'b', say: "My lips are sealed." },
    { by: 'a', conf: "I didn't tell anyone else about {target}. So if somebody else mentions it, it came from {b}." },
  ] },
  { id: 'ts.p3', turns: [
    { by: 'a', say: "Heads up, the plan is {target}." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since this morning. Don't tell anyone." },
    { by: 'a', conf: "There's no plan to vote {target}. This is a test. Let's see if {b} passes." },
  ] },
  { id: 'ts.p4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Between us, {target} is done next vote." },
    { by: 'b', say: "Wow. Okay." },
    { by: 'a', conf: "I give everyone a different name. Whichever name comes back tells me who the leak is." },
  ] },
  { id: 'ts.p5', turns: [
    { by: 'a', say: "I trust you, so I'm telling you first. It's {target}." },
    { by: 'b', say: "Thanks for trusting me." },
    { by: 'a', conf: "Do I trust {b}? That's exactly what I'm trying to find out." },
  ] },
  { id: 'ts.p6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Just so you know, {target} is the name for next time." },
    { by: 'b', say: "Got it." },
    { by: 'a', conf: "It's not. It's a test. Now I wait." },
  ] },
];
const PLANT_VAGUE = [
  { id: 'ts.v1', turns: [
    { by: 'a', say: "I heard something about the vote. You can't tell anyone." },
    { by: 'b', say: "I won't. What is it?" },
    { by: 'a', say: "There's a plan. A big one. That's all I can say." },
    { by: 'a', conf: "There's no plan. I just want to see if {b} starts asking around about it." },
  ] },
  { id: 'ts.v2', turns: [
    { by: 'a', say: "Something's about to happen. Keep it quiet, okay?" },
    { by: 'b', say: "Okay..." },
    { by: 'a', conf: "If I hear people whispering about 'something happening', I'll know where it came from." },
  ] },
  { id: 'ts.v3', turns: [
    { by: 'a', say: "Promise me this stays between us." },
    { by: 'b', say: "I promise." },
    { by: 'a', say: "People are making a move. Soon. That's it." },
    { by: 'a', conf: "Nobody's making a move. Let's see how long {b} can keep a promise." },
  ] },
  { id: 'ts.v4', turns: [
    { by: 'a', say: "Can I trust you with something?" },
    { by: 'b', say: "Always." },
    { by: 'a', conf: "Always, {b} says. We'll see." },
  ] },
  { id: 'ts.v5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'm about to tell you something nobody else knows." },
    { by: 'b', say: "Okay." },
    { by: 'a', conf: "What I told {b} isn't true. I want to see where it goes." },
  ] },
  { id: 'ts.v6', turns: [
    { by: 'a', say: "Don't repeat this. The vote might not be who people think." },
    { by: 'b', say: "Oh, interesting." },
    { by: 'a', conf: "I made that up. If {b} spreads it, I'll hear about it by dinner." },
  ] },
];
const CAUGHT = [
  { id: 'ts.c1', turns: [
    { by: 'b', say: "Can you keep a secret? It's about the vote." },
    { by: 'a', say: "Sure. What is it?" },
    { by: 'b', say: "I'll tell you later." },
    { by: 'a', conf: "That was a test. Way too convenient. {b} wanted to see if I'd blab. Nice try." },
  ] },
  { id: 'ts.c2', turns: [
    { by: 'a', conf: "{b} told me something very specific today. Too specific. It's a test." },
    { by: 'a', conf: "I'm not saying anything to anyone. And I'm not trusting {b} anymore either." },
  ] },
  { id: 'ts.c3', turns: [
    { by: 'b', say: "So, did you tell anyone what I told you?" },
    { by: 'a', say: "Nope. Why would I?" },
    { by: 'a', conf: "{b} tried to test me. I passed. But I won't forget that {b} felt the need to test me." },
  ] },
  { id: 'ts.c4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Were you TESTING me?" },
    { by: 'b', say: "What? No!" },
    { by: 'a', say: "You totally were! Unbelievable!" },
  ] },
  { id: 'ts.c5', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{b} planted a fake secret with me. Classic test. I saw it coming a mile away." },
  ] },
  { id: 'ts.c6', turns: [
    { by: 'a', conf: "I know a test when I see one. {b} just showed me that {b} doesn't trust me." },
    { by: 'a', conf: "Fine. Now I don't trust {b} either." },
  ] },
];
const FAILED = [
  C('ts.f1', "I told {b} one thing. Just {b}. Today I heard it from somebody else.", "So now I know exactly who can't keep a secret."),
  C('ts.f2', "My little test worked. {b} talked. Trust revoked."),
  C('ts.f3', "I wanted to be wrong about {b}. I wasn't."),
  Cw('ts.f4', { register: 'fiery' }, "{b} blabbed! I KNEW {b} would blab!"),
  Cw('ts.f5', { register: 'schemer' }, "{b} spread my fake secret all over camp. Useful to know. {b} is officially a leak."),
  C('ts.f6', "The lie came back to me in less than a day. That's {b} done in my book."),
];
const PASSED = [
  C('ts.s1', "I told {b} something nobody else knows. Days later, not a word. {b} passed."),
  C('ts.s2', "{b} kept quiet. That means something out here. That means a lot, actually."),
  C('ts.s3', "I tested {b}. {b} doesn't even know. And {b} passed with flying colours."),
  Cw('ts.s4', { register: 'sweet' }, "I feel a bit bad for testing {b}. But {b} passed, and now I trust {b} completely."),
  Cw('ts.s5', { register: 'schemer' }, "{b} can keep a secret. That makes {b} the most useful person in my game right now."),
  C('ts.s6', "Not a single person mentioned what I told {b}. {b} is the real deal."),
];
const DOUBLE_CONFRONT = [
  { id: 'ts.d1', turns: [
    { by: 'a', say: "How many final twos do you have?" },
    { by: 'b', say: "What? Just you." },
    { by: 'a', say: "Funny. That's not what I heard." },
    { beat: "{b} doesn't answer." },
  ] },
  { id: 'ts.d2', when: { other: true }, turns: [
    { by: 'a', say: "You promised me the end. You promised {other} the end too." },
    { by: 'b', say: "Okay, I can explain—" },
    { by: 'a', say: "Can you? Because there's only room for two." },
    { by: 'b', say: "It's not what it looks like." },
    { by: 'a', say: "It's exactly what it looks like." },
  ] },
  { id: 'ts.d3', turns: [
    { by: 'a', say: "So I'm not the only one, am I?" },
    { by: 'b', say: "The only one what?" },
    { by: 'a', say: "The only one you made a final two with." },
    { by: 'b', say: "...No. You're not." },
    { by: 'a', say: "Then we don't have one anymore." },
  ] },
  { id: 'ts.d4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You made the same deal with someone else?! Are you kidding me?!" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "No! Everybody should know what you're doing!" },
  ] },
  { id: 'ts.d5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I know about your other deal." },
    { by: 'b', say: "What other deal?" },
    { by: 'a', say: "Don't. It's done. Ours is over." },
  ] },
  { id: 'ts.d6', turns: [
    { by: 'b', say: "Hey, partner!" },
    { by: 'a', say: "Don't call me that." },
    { by: 'b', say: "Why not?" },
    { by: 'a', say: "Because I'm not your only one, am I?" },
  ] },
];
const DOUBLE_ALONE = [
  C('ts.a1', "I found out {b} promised final two to someone else too. Our deal is over."),
  Cw('ts.a2', { other: true }, "{b} made the same promise to {other}. The same one. I'm done."),
  C('ts.a3', "So {b} has more than one final two. Great. I'm out."),
  Cw('ts.a4', { register: 'fiery' }, "{b} double-dealt me! I'm so angry I can't think straight!"),
  C('ts.a5', "I trusted {b}. {b} was making the same deal with someone else the whole time."),
  C('ts.a6', "Our final two was never real. {b} had a backup. I just didn't know I was the backup."),
];

export default {
  'test.plant.named': PLANT_NAMED,
  'test.plant.vague': PLANT_VAGUE,
  'test.caught.any': CAUGHT,
  'test.failed.any': FAILED,
  'test.passed.any': PASSED,
  'deal.double.confront': DOUBLE_CONFRONT,
  'deal.double.alone': DOUBLE_ALONE,
};
