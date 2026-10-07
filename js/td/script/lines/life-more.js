// ══════════════════════════════════════════════════════════════════════
// td/script/lines/life-more.js — more of the friendship moments a season repeats most
// ══════════════════════════════════════════════════════════════════════
//
// Same keys as lines/friend.js and lines/life.js (index.js adds them up). A ride-or-die
// pair airs nearly every episode once their bond is that high (measured: ~20 a season),
// so its pool is sized to a season. Ids: 'lm.'.

const RIDE_OR_DIE = [
  { id: 'lm.rd1', turns: [
    { by: 'a', say: "Morning, partner." },
    { by: 'b', say: "Morning. Same plan?" },
    { by: 'a', say: "Same plan. Always the same plan." },
  ] },
  { id: 'lm.rd2', turns: [
    { beat: '{a} and {b} sit back to back by the fire, keeping watch on everybody else.' },
    { by: 'b', conf: "Nobody gets close to {a} without going through me first. {a} would say the same." },
  ] },
  { id: 'lm.rd3', turns: [
    { by: 'b', say: "Somebody tried to get me to flip on you today." },
    { by: 'a', say: "Who?" },
    { by: 'b', say: "Doesn't matter. I said no before they finished the sentence." },
  ] },
  { id: 'lm.rd4', turns: [
    { by: 'a', say: "If I go home next, promise me you'll win it." },
    { by: 'b', say: "You're not going home." },
    { by: 'a', say: "Promise anyway." },
    { by: 'b', say: "I promise. You're still not going home." },
  ] },
  { id: 'lm.rd5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "They're whispering about you again." },
    { by: 'b', say: "Let them." },
    { by: 'a', say: "I'm going to go stand very close to them and not say anything." },
    { by: 'b', conf: "That's {a}'s version of a love letter." },
  ] },
  { id: 'lm.rd6', turns: [
    { by: 'a', say: "Do you ever think about how lucky we got? Finding each other out here?" },
    { by: 'b', say: "Every day." },
  ] },
  { id: 'lm.rd7', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's the plan. Your part, my part." },
    { by: 'b', say: "Same as always?" },
    { by: 'a', say: "Same as always. It keeps working." },
    { by: 'a', conf: "{b} never asks why. {b} trusts me. That's terrifying and wonderful." },
  ] },
  { id: 'lm.rd8', turns: [
    { beat: '{a} gives {b} the last bite of fish without even asking if {b} wants it.' },
    { by: 'b', say: "You need to eat too." },
    { by: 'a', say: "You need it more. You've got the challenge face on." },
  ] },
  { id: 'lm.rd9', turns: [
    { by: 'b', say: "What's the first thing we do after this?" },
    { by: 'a', say: "Real food. Together. My treat." },
    { by: 'b', say: "Even if I win?" },
    { by: 'a', say: "Especially if you win. Then it's your treat." },
  ] },
  { id: 'lm.rd10', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I wrote your name on my hand so I'd remember to check on you today." },
    { by: 'b', say: "That's the sweetest and weirdest thing anyone's ever done for me." },
  ] },
  { id: 'lm.rd11', turns: [
    { by: 'b', conf: "People keep asking if {a} and I are a showmance. We're not. It's worse. We're loyal." },
  ] },
  { id: 'lm.rd12', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Final two. You and me. In a challenge, at the end. Winner takes it." },
    { by: 'b', say: "And loser?" },
    { by: 'a', say: "Loser buys dinner for life." },
  ] },
  { id: 'lm.rd13', turns: [
    { by: 'a', say: "Say the word and I'll go after whoever's coming for you." },
    { by: 'b', say: "Nobody's coming for me." },
    { by: 'a', say: "Not yet. I'm ready either way." },
  ] },
  { id: 'lm.rd14', turns: [
    { beat: '{a} and {b} finish each other\'s sentences while planning the vote. The others exchange a look.' },
    { by: 'a', conf: "Everybody thinks we're a problem. They're right. We're a very good problem." },
  ] },
  { id: 'lm.rd15', when: { age: 'older' }, turns: [
    { by: 'a', say: "I've got a lot more years than you, but I've never had a friend like this this fast." },
    { by: 'b', say: "Me neither." },
    { by: 'a', say: "Don't ruin it by getting sentimental." },
    { by: 'b', say: "You started it." },
  ] },
  { id: 'lm.rd16', turns: [
    { by: 'b', say: "Do you think they'll split us up?" },
    { by: 'a', say: "They can try. They've been trying." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And we're still sitting here." },
  ] },
  { id: 'lm.rd17', when: { register: 'shy' }, turns: [
    { by: 'a', say: "I don't say this stuff out loud. But you're my best friend here." },
    { by: 'b', say: "I know. You're mine too." },
    { by: 'a', conf: "I said it. Out loud. I need to lie down." },
  ] },
  { id: 'lm.rd18', turns: [
    { beat: 'Somebody makes a joke about {b}. {a} doesn\'t laugh. The person stops laughing too.' },
    { by: 'b', conf: "{a} didn't say a word. Didn't need to. Everybody got the message." },
  ] },
  { id: 'lm.rd19', turns: [
    { by: 'a', say: "Whatever happens at the vote, look at me when they read the names." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "So you know I'm still with you. Every single vote." },
  ] },
  { id: 'lm.rd20', when: { loyal: true }, turns: [
    { by: 'a', conf: "Everybody out here has a price. I don't. Not when it comes to {b}." },
    { by: 'b', say: "What are you smiling about?" },
    { by: 'a', say: "Nothing. Just glad you're here." },
  ] },
];
const LAUGH = [
  { id: 'lm.l1', turns: [
    { by: 'a', say: "Okay, everybody, I'm doing my impression of each of you. Starting with {b}." },
    { by: 'b', say: "Oh no." },
    { by: 'c', say: "Oh YES." },
    { beat: 'It is devastatingly accurate. Nobody can breathe.' },
  ] },
  { id: 'lm.l2', turns: [
    { by: 'a', say: "I just realised I've been wearing this shirt inside out for three days." },
    { by: 'b', say: "We know." },
    { by: 'c', say: "We've been waiting for you to notice." },
  ] },
  { id: 'lm.l3', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I can catch a fish with my bare hands. Watch." },
    { beat: '{a} dives. {a} comes up with seaweed. Proudly.' },
    { by: 'b', say: "That's a plant." },
    { by: 'c', say: "Let them have this." },
  ] },
  { id: 'lm.l4', turns: [
    { by: 'b', say: "Tell the story about the bus again." },
    { by: 'a', say: "You've heard it four times." },
    { by: 'c', say: "Five's the charm." },
    { beat: '{a} tells it again. It is even funnier the fifth time.' },
  ] },
];
const OPEN = [
  { id: 'lm.o1', turns: [
    { by: 'a', say: "Can I be honest? I don't think I'm very good at this game." },
    { by: 'b', say: "You're still here." },
    { by: 'a', say: "That's luck." },
    { by: 'b', say: "Luck runs out. You haven't." },
  ] },
  { id: 'lm.o2', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Everyone thinks I only care about winning." },
    { by: 'b', say: "Don't you?" },
    { by: 'a', say: "I care about not letting people down. Winning is just how I do it." },
  ] },
  { id: 'lm.o3', turns: [
    { by: 'a', say: "Sometimes I lie awake and wonder if anyone here actually likes me." },
    { by: 'b', say: "I do." },
    { by: 'a', say: "You have to say that." },
    { by: 'b', say: "I really don't." },
  ] },
  { id: 'lm.o4', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I act like nothing gets to me. Things get to me." },
    { by: 'b', say: "What got to you today?" },
    { by: 'a', say: "Being the person everyone thinks nothing gets to." },
  ] },
];
const SECRET = [
  { id: 'lm.s1', turns: [
    { by: 'a', say: "Nobody back home knows I applied for this. I just disappeared." },
    { by: 'b', say: "They're going to see it on TV." },
    { by: 'a', say: "I know. I'm trying not to think about it." },
  ] },
  { id: 'lm.s2', turns: [
    { by: 'a', say: "I can't swim. Not really." },
    { by: 'b', say: "We've done three water challenges!" },
    { by: 'a', say: "I've done three very panicked water challenges." },
    { by: 'b', conf: "{a} trusted me with that. Next water challenge, I'm staying close." },
  ] },
  { id: 'lm.s3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Want to know a secret? I've never actually lied in this game." },
    { by: 'b', say: "That's a lie." },
    { by: 'a', say: "...Okay, that one was." },
  ] },
];
const GOOF = [
  { id: 'lm.g1', turns: [
    { by: 'a', say: "Let's start a band. Instruments: coconuts and sticks." },
    { by: 'b', say: "What's our first song?" },
    { by: 'a', say: "It's called \"Rice Again\"." },
    { beat: 'It is, somehow, a hit around the fire.' },
  ] },
  { id: 'lm.g2', turns: [
    { by: 'b', say: "Why are you walking backwards?" },
    { by: 'a', say: "Training for a challenge that hasn't happened yet." },
    { by: 'b', say: "Can I train too?" },
    { beat: 'They walk backwards around camp all afternoon.' },
  ] },
  { id: 'lm.g3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I bet I can throw this coconut further than you." },
    { by: 'b', say: "I bet you hit yourself." },
    { beat: '{a} throws it. It hits a tree, bounces back, and hits {a}. {b} has to sit down.' },
  ] },
  { id: 'lm.g4', turns: [
    { by: 'a', say: "Okay, this crab is our new mascot." },
    { by: 'b', say: "It's pinching you." },
    { by: 'a', say: "It's a very loyal mascot." },
  ] },
];
const UNSEEN = [
  { id: 'lm.u1', turns: [
    { by: 'b', say: "You were there for that whole conversation?" },
    { by: 'a', say: "The whole thing." },
    { by: 'b', conf: "{a} hears everything because nobody remembers {a} is there. I'm going to remember from now on." },
  ] },
  { id: 'lm.u2', turns: [
    { beat: '{a} quietly fixes the fire nobody else noticed was going out.' },
    { by: 'b', say: "When did you do that?" },
    { by: 'a', say: "A while ago." },
  ] },
  { id: 'lm.u3', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm used to people not noticing me. It's okay." },
    { by: 'b', say: "It's not okay. I'm noticing you now." },
  ] },
];

export default {
  'friend.rideordie.any': RIDE_OR_DIE, 'friend.laugh.any': LAUGH, 'friend.open.any': OPEN, 'friend.secret.any': SECRET,
  'friend.goof.any': GOOF, 'life.underdog.unseen': UNSEEN,
};
