// ══════════════════════════════════════════════════════════════════════
// td/script/lines/goat.js — the "easy to beat" finalist who might not be
// (camp-events.js checkGoatTargeting, the FTC threat read)
// ══════════════════════════════════════════════════════════════════════
//
//   goat.read.any   a tells b that {target}, who everybody treats as an easy final-two
//                   seat, could actually win the jury
//   goat.probe.any  a sounds out b, that player, to see how b would pitch the jury
//
// Ids: 'gt.'.

const READ = [
  { id: 'gt.r1', turns: [
    { by: 'a', say: "Everybody keeps saying {target} is the person to bring to the end." },
    { by: 'b', say: "Because {target} hasn't won anything." },
    { by: 'a', say: "{target} doesn't need to. The jury likes {target.obj}. All of them." },
  ] },
  { id: 'gt.r2', turns: [
    { by: 'a', say: "Can I say something crazy? I think {target} could win this." },
    { by: 'b', say: "{target}? Come on." },
    { by: 'a', say: "Name one person on that jury who's mad at {target.obj}." },
    { beat: '{b} thinks about it. And keeps thinking.' },
  ] },
  { id: 'gt.r3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Nobody's scared of {target}. That's exactly what scares me." },
    { by: 'a', say: "{b}, we can't sit next to {target} at the end." },
    { by: 'b', say: "Then we'd better do something about it." },
  ] },
  { id: 'gt.r4', turns: [
    { by: 'b', say: "We're bringing {target} to the end, right? Easy win." },
    { by: 'a', say: "I used to think so." },
    { by: 'b', say: "And now?" },
    { by: 'a', say: "Now I've been watching who {target} talks to every night." },
  ] },
  { id: 'gt.r5', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I did the jury math again last night. Every way I count it, {target} gets more votes than I'd like. And nobody else is even counting." },
    { by: 'a', say: "{b}, have you counted the jury lately?" },
    { by: 'b', say: "No. Should I?" },
  ] },
  { id: 'gt.r6', turns: [
    { by: 'a', say: "Think about what {target} says at the final vote. Something like, 'I kept my head down and made friends with everyone.'" },
    { by: 'b', say: "...That would work, wouldn't it." },
    { by: 'a', say: "Yeah. It would." },
  ] },
  { id: 'gt.r7', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm not losing a million dollars to {target}. I refuse." },
    { by: 'b', say: "Nobody's losing to {target}." },
    { by: 'a', say: "That's what everybody says right before they lose to {target}!" },
  ] },
];

const PROBE = [
  { id: 'gt.p1', turns: [
    { by: 'a', say: "So if you made it to the end, what would you tell the jury?" },
    { by: 'b', say: "I don't know. That I was nice to people? That I was a good friend?" },
    { by: 'a', conf: "That's the answer that wins. I was hoping {b} would say something dumb." },
  ] },
  { id: 'gt.p2', turns: [
    { by: 'a', say: "You've been talking to the jury people a lot, huh?" },
    { by: 'b', say: "They're my friends. I miss them." },
    { by: 'a', conf: "{b} misses them. And they miss {b}. That's a problem." },
  ] },
  { id: 'gt.p3', turns: [
    { by: 'a', say: "Who do you think the jury likes most?" },
    { by: 'b', say: "Not me, probably. I haven't done anything." },
    { by: 'a', conf: "Either {b} really believes that, or {b} is way better at this than anybody thinks." },
  ] },
  { id: 'gt.p4', when: { registerB: 'sweet' }, turns: [
    { by: 'b', say: "I'm just happy to still be here, honestly." },
    { by: 'a', say: "Yeah. Me too." },
    { by: 'a', conf: "Everybody on that jury will hear 'I'm just happy to be here' and hand {b} the money." },
  ] },
  { id: 'gt.p5', turns: [
    { by: 'a', say: "Hypothetically. Final two, you and me. Who wins?" },
    { by: 'b', say: "You, obviously." },
    { by: 'a', say: "Obviously." },
    { by: 'a', conf: "{b} said that way too fast." },
  ] },
  { id: 'gt.p6', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "Do you think you could win this?" },
    { by: 'b', say: "Me? No way." },
    { by: 'a', say: "Why not?" },
    { by: 'b', say: "I don't know. Nobody ever votes for me for anything." },
    { by: 'a', conf: "Nobody's ever voted against {b}, either." },
  ] },
];

export default { 'goat.read.any': READ, 'goat.probe.any': PROBE };

/** Data these scenes always carry. */
export const GUARANTEED = { 'goat.read.any': ['target'] };
