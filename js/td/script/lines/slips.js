// ══════════════════════════════════════════════════════════════════════
// td/script/lines/slips.js — the small things people give away
// (camp-events.js checkTacticalAdvantageSnoop and the miscommunication fallout,
//  episode.js challenge-throw detection)
// ══════════════════════════════════════════════════════════════════════
//
//   spot.power.any     a, alone, is nearly sure {target} is holding a {power}
//   throw.caught.bold  a tells b, to b's face, that b threw the challenge
//   throw.caught.quiet a, alone, is sure {target} threw the challenge
//   misvote.fall.any   a wrote {boot} by mistake at the last vote; b is in a's alliance or close
//                      to a. ending: cost ({boot}, an ally, went home on it; a meant {plan}) |
//                      ally ({boot} was an ally, and went home anyway) | stray (a's stray vote
//                      sent {boot} home)
//
// Ids: 'sl.'.

const SPOT = [
  { id: 'sl.p1', turns: [
    { by: 'a', conf: "{target} has checked that bag four times today. Nobody checks a bag four times. There's a {power} in there. I'd bet on it." },
  ] },
  { id: 'sl.p2', turns: [
    { beat: '{a} watches {target} slip something back into a pocket.' },
    { by: 'a', conf: "I only saw it for a second. But I'm pretty sure that was a {power}. I'm keeping that to myself. For now." },
  ] },
  { id: 'sl.p3', turns: [
    { by: 'a', conf: "{target} has been walking around different for a few days. Like someone with a secret. My guess is a {power}." },
  ] },
  { id: 'sl.p4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "People with nothing don't sleep with their bag. {target} sleeps with {target.posAdj} bag. That's a {power}, or I'm losing my mind." },
  ] },
  { id: 'sl.p5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{target} thinks nobody knows about the {power}. I know. And knowing is half of using it against {target.obj}." },
  ] },
  { id: 'sl.p6', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "Nobody pays attention to me, so I pay attention to everybody. {target} has a {power}. I'm almost sure." },
  ] },
];

const THROW_BOLD = [
  { id: 'sl.t1', turns: [
    { by: 'a', say: "You threw that." },
    { by: 'b', say: "What? No, I—" },
    { by: 'a', say: "Don't. I watched you. You're better than that and we both know it." },
  ] },
  { id: 'sl.t2', turns: [
    { by: 'a', say: "Interesting performance out there, {b}." },
    { by: 'b', say: "I had a bad day." },
    { by: 'a', say: "Funny. You never have bad days." },
  ] },
  { id: 'sl.t3', turns: [
    { by: 'a', conf: "That was not {b}'s best. That was {b}'s worst, on purpose. {b} thinks nobody noticed. I noticed." },
    { by: 'a', say: "Rough challenge, huh, {b}?" },
    { by: 'b', say: "...Yeah. Rough." },
  ] },
  { id: 'sl.t4', when: { hot: true }, turns: [
    { by: 'a', say: "Did you just lose on PURPOSE?!" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "So that's a yes!" },
  ] },
  { id: 'sl.t5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I don't care about your strategy. You don't throw challenges. Not on my watch." },
    { by: 'b', say: "I didn't throw anything." },
    { by: 'a', say: "Then show me tomorrow." },
  ] },
  { id: 'sl.t6', turns: [
    { by: 'b', say: "Why are you looking at me like that?" },
    { by: 'a', say: "You slowed down. Right at the end. I saw it." },
    { by: 'b', say: "I was tired!" },
    { by: 'a', say: "Sure you were." },
  ] },
];

const THROW_QUIET = [
  { id: 'sl.q1', turns: [
    { by: 'a', conf: "I think {target} threw that challenge. I can't prove it. But my gut says {target} didn't want to win today, and that means {target} is playing a different game than the rest of us." },
  ] },
  { id: 'sl.q2', turns: [
    { by: 'a', conf: "{target} was strong and focused yesterday. Today {target} fell apart? Something doesn't add up." },
  ] },
  { id: 'sl.q3', turns: [
    { beat: '{a} watches {target} across camp after the challenge.' },
    { by: 'a', conf: "Did that look off to anybody else? Just me? Okay. Just me. For now." },
  ] },
  { id: 'sl.q4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "People who are trying don't look over their shoulder. {target} looked over {target.posAdj} shoulder twice." },
  ] },
  { id: 'sl.q5', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I don't want to think {target} would lose on purpose. But I saw what I saw." },
  ] },
  { id: 'sl.q6', turns: [
    { by: 'a', conf: "I'm not saying anything yet. But I'm watching {target} at the next challenge. Really closely." },
  ] },
];

const MISVOTE = [
  { id: 'sl.m1', when: { ending: 'cost' }, turns: [
    { by: 'b', say: "We said {plan}. Everybody said {plan}." },
    { by: 'a', say: "I KNOW. I know. I don't know what happened." },
    { by: 'b', say: "What happened is {boot} went home." },
  ] },
  { id: 'sl.m2', when: { ending: 'cost' }, turns: [
    { beat: '{a} hasn\'t said a word since the vote.' },
    { by: 'b', say: "Are you going to talk about it?" },
    { by: 'a', say: "I wrote the wrong name, {b}. {boot} is gone because of me. What is there to talk about?" },
  ] },
  { id: 'sl.m3', when: { ending: 'cost' }, turns: [
    { by: 'a', conf: "I was supposed to write {plan}. My hand wrote {boot}. And {boot} was my ally. I'll be thinking about that for the rest of my life." },
    { by: 'b', say: "{a}? We need to talk." },
  ] },
  { id: 'sl.m4', when: { ending: 'ally' }, turns: [
    { by: 'b', say: "You voted {boot}? {boot} was with us." },
    { by: 'a', say: "It didn't change anything!" },
    { by: 'b', say: "That's not the point, {a}." },
  ] },
  { id: 'sl.m5', when: { ending: 'ally' }, turns: [
    { by: 'a', say: "I got confused. It happens." },
    { by: 'b', say: "Not with our people. It doesn't happen with our people." },
  ] },
  { id: 'sl.m6', when: { ending: 'ally' }, turns: [
    { by: 'b', conf: "{boot} was going home either way. But {a} wrote our own ally's name. I need to know {a} is paying attention." },
    { by: 'a', say: "I'm sorry, okay? It won't happen again." },
  ] },
  { id: 'sl.m7', when: { ending: 'stray' }, turns: [
    { by: 'b', say: "Do you realize your vote is the one that sent {boot} home?" },
    { by: 'a', say: "That wasn't the plan!" },
    { by: 'b', say: "Well. It's the result." },
  ] },
  { id: 'sl.m8', when: { ending: 'stray' }, turns: [
    { by: 'a', conf: "One vote. My one stray vote. And {boot} is gone. I didn't even mean it." },
    { by: 'b', say: "You okay?" },
    { by: 'a', say: "No." },
  ] },
  { id: 'sl.m9', when: { ending: 'stray' }, turns: [
    { by: 'b', say: "So who were you actually trying to vote for?" },
    { by: 'a', say: "Can we not do this right now?" },
    { by: 'b', say: "{boot} doesn't get to do anything right now. So, yes." },
  ] },
];

export default {
  'spot.power.any': SPOT, 'throw.caught.bold': THROW_BOLD, 'throw.caught.quiet': THROW_QUIET, 'misvote.fall.any': MISVOTE,
};

/** Data these scenes always carry. */
export const GUARANTEED = {
  'spot.power.any': ['target'], 'throw.caught.quiet': ['target'], 'misvote.fall.any': ['boot', 'plan'],
};
