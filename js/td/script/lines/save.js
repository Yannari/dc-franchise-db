// ══════════════════════════════════════════════════════════════════════
// td/script/lines/save.js — the morning after a save (camp-events.js, post-save aftermath)
// ══════════════════════════════════════════════════════════════════════
//
//   save.lucky.any     a survived on the Shot in the Dark. ending: voter (b wrote a's name) | friend
//   save.gamble.any    a and b, the morning after {target} rolled the Shot in the Dark and went home
//   save.miss.any      a rolled the Shot in the Dark, it missed, and somebody else went home;
//                      b is the person closest to a
//   save.kip.any       a took an idol off somebody at the vote. ending: stolen (b lost it) | other
//   save.super.any     a played the Super Idol after the votes were read. ending: ally (for b) |
//                      self (b wrote a's name)
//   save.ally.any      a played an idol for b
//   save.self.any      a played an idol and survived. ending: voter (b wrote a's name) | friend
//   save.scramble.any  a and b voted for {target}, and {target} is still here
//
// Ids: 'sv.'.

const LUCKY = [
  { id: 'sv.l1', when: { ending: 'voter' }, turns: [
    { by: 'a', say: "Morning, {b}. Surprised to see me?" },
    { by: 'b', say: "...A little." },
    { by: 'a', say: "Yeah. I bet." },
  ] },
  { id: 'sv.l2', when: { ending: 'voter' }, turns: [
    { by: 'b', say: "Look, about last night..." },
    { by: 'a', say: "You wrote my name. I know. One in six, {b}. One in six, and I'm still here." },
  ] },
  { id: 'sv.l3', when: { ending: 'voter' }, turns: [
    { beat: '{b} can\'t look {a} in the eye all morning.' },
    { by: 'a', conf: "{b} voted for me, and then the dice said no. I'll never get tired of that look on {b.posAdj} face." },
  ] },
  { id: 'sv.l4', when: { ending: 'friend' }, turns: [
    { by: 'b', say: "You absolute lunatic. You rolled the dice!" },
    { by: 'a', say: "And they rolled back!" },
    { by: 'b', say: "I think I aged ten years last night." },
  ] },
  { id: 'sv.l5', when: { ending: 'friend' }, turns: [
    { by: 'b', say: "How did that even work?" },
    { by: 'a', say: "I have no idea. Don't ask me to do it again." },
  ] },
  { id: 'sv.l6', when: { ending: 'friend' }, turns: [
    { by: 'a', say: "I'm still here. Are you seeing this? I'm still here!" },
    { by: 'b', say: "We're all seeing it. Please stop yelling." },
  ] },
  { id: 'sv.l7', turns: [
    { by: 'a', conf: "That was not supposed to work. One in six. Nobody wins that. I won that." },
    { by: 'b', say: "So what now?" },
    { by: 'a', say: "Now they have to come up with a new plan. And I know who wrote my name." },
  ] },
];

const GAMBLE = [
  { id: 'sv.g1', turns: [
    { by: 'a', say: "{target} actually rolled it." },
    { by: 'b', say: "And lost." },
    { by: 'a', say: "Still. Took guts." },
  ] },
  { id: 'sv.g2', turns: [
    { by: 'b', say: "I keep thinking that could've been any of us reaching for that paper." },
    { by: 'a', say: "{target} was desperate. We'd all be desperate." },
  ] },
  { id: 'sv.g3', turns: [
    { beat: 'Nobody talks much at breakfast.' },
    { by: 'a', say: "Weird that {target} is gone." },
    { by: 'b', say: "Weirder that {target} almost wasn't." },
  ] },
  { id: 'sv.g4', when: { band: 'friends' }, turns: [
    { by: 'a', say: "If they ever come for me like that, promise you'll talk me out of the dice." },
    { by: 'b', say: "I'll sit on you if I have to." },
  ] },
  { id: 'sv.g5', turns: [
    { by: 'b', conf: "{target} gave up a vote for a one-in-six chance. It didn't work. But now everybody knows how cornered {target} felt." },
    { by: 'a', say: "Hey. You okay?" },
    { by: 'b', say: "Yeah. Just thinking." },
  ] },
  { id: 'sv.g6', turns: [
    { by: 'a', say: "Do you think it ever works?" },
    { by: 'b', say: "The dice? Once in a while, sure." },
    { by: 'a', say: "Not for {target}." },
  ] },
];

const MISS = [
  { id: 'sv.m1', turns: [
    { by: 'b', say: "You rolled the dice for nothing." },
    { by: 'a', say: "I didn't know it was for nothing!" },
    { by: 'b', say: "Next time, ask me before you panic." },
  ] },
  { id: 'sv.m2', turns: [
    { by: 'a', conf: "I threw away my vote on a one-in-six chance and it didn't even matter. They weren't voting for me. I'm so embarrassed." },
    { by: 'b', say: "Hey. You're still here. That's what counts." },
  ] },
  { id: 'sv.m3', turns: [
    { by: 'b', say: "Everybody saw you reach for that paper." },
    { by: 'a', say: "I know." },
    { by: 'b', say: "Everybody now knows you were scared." },
    { by: 'a', say: "I KNOW." },
  ] },
  { id: 'sv.m4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Don't. Don't say anything about the dice." },
    { by: 'b', say: "I wasn't going to." },
    { by: 'a', say: "You were thinking it." },
  ] },
  { id: 'sv.m5', turns: [
    { by: 'a', say: "Well. At least I'm still here." },
    { by: 'b', say: "You'd have been here either way." },
    { by: 'a', conf: "Thanks, {b}. Really helpful." },
  ] },
  { id: 'sv.m6', when: { register: 'shy' }, turns: [
    { by: 'a', say: "I really thought it was me." },
    { by: 'b', say: "I know. It's okay." },
    { by: 'a', conf: "It wasn't me. I wasted my vote. And now everybody knows I panic." },
  ] },
];

const KIP = [
  { id: 'sv.k1', when: { ending: 'stolen' }, turns: [
    { by: 'b', say: "How did you know?" },
    { by: 'a', say: "I pay attention." },
    { by: 'b', say: "That was MY idol." },
    { by: 'a', say: "Was." },
  ] },
  { id: 'sv.k2', when: { ending: 'stolen' }, turns: [
    { beat: '{b} wakes up and checks {b.posAdj} bag out of habit. There\'s nothing to check anymore.' },
    { by: 'a', conf: "{b} hasn't said a word to me all morning. That's fair." },
  ] },
  { id: 'sv.k3', when: { ending: 'stolen' }, turns: [
    { by: 'b', say: "Who told you I had it?" },
    { by: 'a', say: "You did. Every time you checked your bag." },
  ] },
  { id: 'sv.k4', when: { ending: 'other' }, turns: [
    { by: 'b', say: "You just walked up and took somebody's idol." },
    { by: 'a', say: "I asked nicely." },
    { by: 'b', conf: "{a} has an idol that wasn't {a.posAdj} yesterday. Everybody's game just changed." },
  ] },
  { id: 'sv.k5', when: { ending: 'other' }, turns: [
    { by: 'a', say: "So. Who wants to be my friend today?" },
    { by: 'b', say: "Funny how everybody does now." },
  ] },
  { id: 'sv.k6', when: { ending: 'other' }, turns: [
    { by: 'b', say: "How long did you know?" },
    { by: 'a', say: "Long enough to plan it." },
  ] },
  { id: 'sv.k7', turns: [
    { by: 'a', conf: "Knowledge is power. Somebody wrote that on the advantage and they were right." },
    { by: 'b', say: "What are you smiling about?" },
    { by: 'a', say: "Nothing. Everything." },
  ] },
];

const SUPER = [
  { id: 'sv.s1', when: { ending: 'ally' }, turns: [
    { by: 'b', say: "You waited until every vote was read. Then you saved me." },
    { by: 'a', say: "I wanted to see who wrote your name first." },
    { by: 'b', say: "I owe you everything." },
  ] },
  { id: 'sv.s2', when: { ending: 'ally' }, turns: [
    { by: 'b', say: "I was GONE. I was already standing up to leave!" },
    { by: 'a', say: "And then you weren't." },
    { by: 'b', conf: "Nobody has ever done anything like that for me. In my life." },
  ] },
  { id: 'sv.s3', when: { ending: 'ally' }, turns: [
    { by: 'a', say: "Breathe, {b}." },
    { by: 'b', say: "I can't. I still can't believe you did that." },
  ] },
  { id: 'sv.s4', when: { ending: 'self' }, turns: [
    { by: 'b', say: "You let them read every single vote." },
    { by: 'a', say: "I wanted to hear my name. Every time." },
    { by: 'b', say: "That's psychotic." },
    { by: 'a', say: "It worked." },
  ] },
  { id: 'sv.s5', when: { ending: 'self' }, turns: [
    { beat: '{b} wrote {a}\'s name last night. {b} watched it get thrown out after the read.' },
    { by: 'a', say: "Good morning, {b}." },
    { by: 'b', say: "...Good morning." },
  ] },
  { id: 'sv.s6', when: { ending: 'self' }, turns: [
    { by: 'a', conf: "Every person who voted for me now knows they were outplayed. After the votes were read. Nobody's ever going to forget that." },
    { by: 'b', say: "You're never going to let us forget it either, are you?" },
    { by: 'a', say: "Nope." },
  ] },
];

const ALLY = [
  { id: 'sv.a1', turns: [
    { by: 'b', say: "You didn't have to do that." },
    { by: 'a', say: "Yeah, I did." },
    { by: 'b', say: "That was your idol. That was your safety." },
    { by: 'a', say: "You're my safety." },
  ] },
  { id: 'sv.a2', turns: [
    { by: 'b', say: "I don't know how to pay you back for that." },
    { by: 'a', say: "Stay loyal. That's it." },
    { by: 'b', say: "Done. For the whole game." },
  ] },
  { id: 'sv.a3', turns: [
    { by: 'b', conf: "{a} could have kept that idol. Could have used it to go further. Instead, I'm here. I'll never forget that." },
    { by: 'a', conf: "I don't have an idol now. I just have {b}. I hope that's enough." },
  ] },
  { id: 'sv.a4', when: { band: 'friends' }, turns: [
    { beat: '{b} hugs {a} as soon as they\'re alone.' },
    { by: 'b', say: "You're insane. I love you. You're insane." },
    { by: 'a', say: "Both can be true." },
  ] },
  { id: 'sv.a5', turns: [
    { by: 'b', say: "Everybody's looking at us." },
    { by: 'a', say: "Good. Now they know we're real." },
  ] },
  { id: 'sv.a6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "An idol saves you once. {b} owing me forever? That could save me a lot more than once." },
    { by: 'b', say: "Thank you, {a}. Really." },
    { by: 'a', say: "Anytime." },
  ] },
];

const SELF = [
  { id: 'sv.f1', when: { ending: 'voter' }, turns: [
    { by: 'a', say: "Sleep okay, {b}?" },
    { by: 'b', say: "Fine." },
    { by: 'a', say: "Funny. I slept great." },
  ] },
  { id: 'sv.f2', when: { ending: 'voter' }, turns: [
    { by: 'b', say: "It wasn't personal." },
    { by: 'a', say: "You wrote my name on a piece of paper. That's pretty personal." },
  ] },
  { id: 'sv.f3', when: { ending: 'voter' }, turns: [
    { beat: '{a} sits down right next to {b} at breakfast and smiles.' },
    { by: 'b', conf: "{a} knows I voted for {a.obj}. {a} is being really nice about it. That's much scarier." },
  ] },
  { id: 'sv.f4', when: { ending: 'friend' }, turns: [
    { by: 'b', say: "When were you going to tell me you had an idol?" },
    { by: 'a', say: "Last night. Right when I needed it." },
    { by: 'b', say: "Fair." },
  ] },
  { id: 'sv.f5', when: { ending: 'friend' }, turns: [
    { by: 'b', say: "That was amazing. Also, you're out of idols now." },
    { by: 'a', say: "Yeah. I noticed." },
    { by: 'b', say: "So we need a plan." },
  ] },
  { id: 'sv.f6', when: { ending: 'friend' }, turns: [
    { by: 'a', say: "Did you see their faces?" },
    { by: 'b', say: "I'll be seeing their faces for the rest of my life." },
  ] },
  { id: 'sv.f7', turns: [
    { by: 'a', conf: "They came for me with everything they had, and I walked out of there. The idol's gone. So is their plan." },
    { by: 'b', say: "What now?" },
    { by: 'a', say: "Now I find out who's going to try again." },
  ] },
];

const SCRAMBLE = [
  { id: 'sv.c1', turns: [
    { by: 'a', say: "So that went badly." },
    { by: 'b', say: "That went really badly." },
    { by: 'a', say: "{target} knows exactly who voted. Which is us." },
  ] },
  { id: 'sv.c2', turns: [
    { by: 'b', say: "We need a new plan." },
    { by: 'a', say: "We need a new plan AND we need {target} to not kill us." },
  ] },
  { id: 'sv.c3', turns: [
    { by: 'a', say: "We just go again. Same name. {target} can't save {target.ref} twice." },
    { by: 'b', say: "Unless {target} can." },
    { by: 'a', say: "Don't say that." },
  ] },
  { id: 'sv.c4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Okay. New rule. Nobody trusts a plan that leaves {target} alive with something in {target.posAdj} pocket." },
    { by: 'b', say: "We didn't know!" },
    { by: 'a', say: "That's the problem." },
  ] },
  { id: 'sv.c5', turns: [
    { by: 'b', conf: "We had the numbers. We did everything right. And {target} is sitting over there eating breakfast." },
    { by: 'a', say: "Stop staring at {target}." },
    { by: 'b', say: "I'm not staring." },
  ] },
  { id: 'sv.c6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I hate this. I HATE this." },
    { by: 'b', say: "Keep your voice down, {target} is RIGHT there." },
    { by: 'a', say: "I don't care!" },
  ] },
];

export default {
  'save.lucky.any': LUCKY, 'save.gamble.any': GAMBLE, 'save.miss.any': MISS, 'save.kip.any': KIP,
  'save.super.any': SUPER, 'save.ally.any': ALLY, 'save.self.any': SELF, 'save.scramble.any': SCRAMBLE,
};

/** Data these scenes always carry. */
export const GUARANTEED = { 'save.gamble.any': ['target'], 'save.scramble.any': ['target'] };
