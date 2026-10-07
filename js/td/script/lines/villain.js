// ══════════════════════════════════════════════════════════════════════
// td/script/lines/villain.js — the villain at camp (camp-events.js checkHeroVillainEvents)
// ══════════════════════════════════════════════════════════════════════
//
//   villain.loom.any   a, a villain, lets b, a's worst enemy, know b is next
//   villain.power.any  a, a villain, says out loud who runs the camp, and b is there for it
//
// The gloat and the inner circle are in last.js.
// Ids: 'vl.'.

const LOOM = [
  { id: 'vl.l1', turns: [
    { beat: '{a} walks up to the fire, stops right behind {b}, and doesn\'t sit down.' },
    { by: 'b', say: "Can I help you?" },
    { by: 'a', say: "No. Just enjoying the view while it lasts." },
  ] },
  { id: 'vl.l2', turns: [
    { by: 'a', say: "You know it's coming, right?" },
    { by: 'b', say: "What's coming?" },
    { by: 'a', say: "Oh, you know." },
    { beat: '{a} walks away smiling. {b} watches {a.obj} go.' },
  ] },
  { id: 'vl.l3', turns: [
    { by: 'a', say: "Enjoy your dinner, {b}." },
    { by: 'b', say: "Why do you say it like that?" },
    { by: 'a', say: "Like what?" },
  ] },
  { id: 'vl.l4', when: { registerB: 'fiery' }, turns: [
    { by: 'a', say: "Pack light. Saves time later." },
    { by: 'b', say: "Say that again. I dare you." },
    { by: 'a', say: "Pack. Light." },
  ] },
  { id: 'vl.l5', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "Don't get too comfortable, {b}." },
    { beat: '{b} shrinks back from the fire.' },
    { by: 'b', conf: "I didn't even do anything. I never do anything. Why me?" },
  ] },
  { id: 'vl.l6', turns: [
    { beat: '{a} sits down between {b} and everybody else, on purpose.' },
    { by: 'a', say: "Oh, is this seat taken? Too bad." },
    { by: 'b', conf: "Every day {a} finds a new way to tell me I'm next." },
  ] },
  { id: 'vl.l7', when: { registerB: 'cool' }, turns: [
    { by: 'a', say: "I'd start saying your goodbyes if I were you." },
    { by: 'b', say: "If you had the votes, you wouldn't be telling me." },
    { by: 'a', conf: "...Okay, that one stung a little." },
  ] },
];

const POWER = [
  { id: 'vl.p1', turns: [
    { by: 'a', say: "I'm running this game, and everybody knows it." },
    { by: 'b', say: "Wow. Okay." },
    { by: 'a', say: "Am I wrong?" },
    { beat: 'Nobody says {a} is wrong. {b} hates that most of all.' },
  ] },
  { id: 'vl.p2', turns: [
    { by: 'a', say: "Here's what's going to happen. We vote who I say. Anybody who doesn't is next." },
    { by: 'b', say: "And if we don't want to?" },
    { by: 'a', say: "Then you're next." },
  ] },
  { id: 'vl.p3', turns: [
    { by: 'a', conf: "Whispering is for people who are scared. I'm not scared. I just tell people what's going to happen, and then it happens." },
    { by: 'b', conf: "The worst part is, {a} keeps being right." },
  ] },
  { id: 'vl.p4', when: { registerB: 'fiery' }, turns: [
    { by: 'a', say: "You all work for me now. Get used to it." },
    { by: 'b', say: "I don't work for ANYBODY!" },
    { by: 'a', say: "Cute." },
  ] },
  { id: 'vl.p5', when: { registerB: 'sweet' }, turns: [
    { by: 'a', say: "Let's be clear. I'm in charge. Nod if you understand." },
    { beat: '{b} nods before {b} can stop {b.ref}.' },
    { by: 'b', conf: "I didn't mean to nod. It just happened." },
  ] },
  { id: 'vl.p6', turns: [
    { by: 'b', say: "Who made you the boss?" },
    { by: 'a', say: "Everyone who's gone home since I got here." },
  ] },
  { id: 'vl.p7', when: { registerB: 'competitor' }, turns: [
    { by: 'a', say: "You win the challenges. I win the votes. Guess which one matters more." },
    { by: 'b', say: "Keep talking. See how long that lasts." },
  ] },
];

export default { 'villain.loom.any': LOOM, 'villain.power.any': POWER };
