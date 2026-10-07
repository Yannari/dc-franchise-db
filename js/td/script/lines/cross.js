// ══════════════════════════════════════════════════════════════════════
// td/script/lines/cross.js — two people from different teams, at a camp the teams share
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: at Total Drama's camps the teams can mix (Wawanakwa, the film lot, the
// jet), even though at a separate-camp venue they never meet. camp-events.js _crossScenes casts
// these from the record, in a public place, before the merge. a is always from team {mine},
// b from team {theirs}.
//
//   cross.rival.any    a and b, on bad terms, trade shots in front of everyone
//   cross.friend.any   a and b get along anyway, and don't care who sees
//   cross.flirt.any    a and b flirt across the line
//   cross.spy.any      a fishes b for what b's side is planning; ending 'leak' (b lets something
//                      slip) or 'shut' (b sees it coming)
//
// Ids: 'cx.'.

const RIVAL = [
  { id: 'cx.r1', turns: [
    { by: 'a', say: "Enjoy the last challenge you'll ever win, {b}." },
    { by: 'b', say: "You said that last time." },
    { by: 'a', say: "And I meant it last time too." },
  ] },
  { id: 'cx.r2', turns: [
    { beat: '{a} walks right through the middle of the {theirs} breakfast.' },
    { by: 'b', say: "Do you mind?" },
    { by: 'a', say: "Not at all. Thanks for asking." },
  ] },
  { id: 'cx.r3', turns: [
    { by: 'b', say: "Shouldn't you be over with the {mine}?" },
    { by: 'a', say: "Just checking out the competition. Didn't take long." },
    { by: 'b', conf: "{a} came all the way over here just to insult us. You don't do that unless you're scared." },
  ] },
  { id: 'cx.r4', turns: [
    { by: 'a', say: "Nice job yesterday, {b}. Really. You were a huge help." },
    { by: 'b', say: "To my side?" },
    { by: 'a', say: "To mine." },
  ] },
  { id: 'cx.r5', turns: [
    { by: 'b', say: "Is there something on my face, or are you just staring?" },
    { by: 'a', say: "Just picturing you losing." },
    { by: 'b', say: "Picture harder. It's not happening." },
  ] },
  { id: 'cx.r6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Hey, {theirs}! Your fearless leader is over here!" },
    { by: 'b', say: "Keep yelling. It really helps you think." },
    { by: 'a', conf: "{b} has been asking for this since day one. Today {b.sub} got it." },
  ] },
  { id: 'cx.r7', turns: [
    { by: 'b', say: "We're winning the next one. Just so you know." },
    { by: 'a', say: "Great. I'll save you a seat for the walk home." },
  ] },
  { id: 'cx.r8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You know your own side is talking about you, right?" },
    { by: 'b', say: "Nice try." },
    { by: 'a', conf: "Was it true? Doesn't matter. Now {b} is going to wonder all day." },
  ] },
];

const FRIEND = [
  { id: 'cx.f1', turns: [
    { by: 'a', say: "Don't tell the {mine} I'm sitting with you." },
    { by: 'b', say: "Don't tell the {theirs} I let you." },
    { by: 'a', say: "Deal." },
  ] },
  { id: 'cx.f2', turns: [
    { by: 'b', say: "So how bad is it over on your side?" },
    { by: 'a', say: "Somebody cried over a sandwich last night." },
    { by: 'b', say: "That's nothing. One of ours sleeps with a flashlight under the pillow." },
  ] },
  { id: 'cx.f3', turns: [
    { by: 'a', say: "Whatever happens in the challenge, no hard feelings, okay?" },
    { by: 'b', say: "No hard feelings. I'm still going to beat you." },
    { by: 'a', say: "Obviously." },
  ] },
  { id: 'cx.f4', turns: [
    { beat: '{a} and {b} split a candy bar nobody is supposed to have.' },
    { by: 'b', say: "If anyone asks, this never happened." },
    { by: 'a', say: "What candy bar?" },
  ] },
  { id: 'cx.f5', turns: [
    { by: 'a', say: "You're the only one over there I can stand." },
    { by: 'b', say: "Same. Don't let it go to your head." },
    { by: 'a', conf: "{b} is on the wrong side. That's not {b.posAdj} fault." },
  ] },
  { id: 'cx.f6', when: { register: 'sweet' }, turns: [
    { by: 'b', say: "You looked like you needed company." },
    { by: 'a', say: "I kind of did. Thanks." },
    { by: 'b', say: "Just don't get used to it. Next week we're enemies again." },
  ] },
  { id: 'cx.f7', turns: [
    { by: 'a', say: "When this is all over, we're hanging out. For real." },
    { by: 'b', say: "If we still like each other after the merge." },
    { by: 'a', say: "Fair point." },
  ] },
];

const FLIRT = [
  { id: 'cx.l1', turns: [
    { by: 'a', say: "Is it against the rules to talk to the cute one on the other side?" },
    { by: 'b', say: "Probably. Keep going." },
  ] },
  { id: 'cx.l2', turns: [
    { by: 'b', say: "Your side keeps staring over here." },
    { by: 'a', say: "Not my side. Just me." },
    { by: 'b', conf: "Okay. That was smooth. I hate that it worked." },
  ] },
  { id: 'cx.l3', turns: [
    { beat: '{a} saves {b} the last spot on the log.' },
    { by: 'b', say: "Won't the {mine} be mad?" },
    { by: 'a', say: "Let them." },
  ] },
  { id: 'cx.l4', turns: [
    { by: 'a', say: "If I win today, will you be sad?" },
    { by: 'b', say: "I'll be sad for about a minute. Then I'll come congratulate you." },
    { by: 'a', say: "I'll take the minute." },
  ] },
  { id: 'cx.l5', turns: [
    { by: 'b', say: "You know we're supposed to be enemies." },
    { by: 'a', say: "I'm not great at following instructions." },
  ] },
  { id: 'cx.l6', when: { registerB: 'shy' }, turns: [
    { by: 'a', say: "You always look away when I catch you looking." },
    { by: 'b', say: "I wasn't looking." },
    { by: 'a', say: "You're looking right now." },
  ] },
  { id: 'cx.l7', turns: [
    { by: 'a', conf: "{b} is on the {theirs}. I know. I've thought about it. I've decided I don't care." },
    { by: 'a', say: "Walk with me?" },
    { by: 'b', say: "For five minutes. Then I'm going back." },
  ] },
];

const SPY = [
  // the spy question, then b gives something away
  { id: 'cx.s1', when: { ending: 'leak' }, turns: [
    { by: 'a', say: "So who's running things over there? Honestly." },
    { by: 'b', say: "Nobody. Everyone's mad at everybody." },
    { by: 'a', conf: "Everyone's mad at everybody. That's the most useful thing I've heard all week." },
  ] },
  { id: 'cx.s2', when: { ending: 'leak' }, turns: [
    { by: 'a', say: "Rough night on your side? I heard yelling." },
    { by: 'b', say: "Two of ours aren't speaking. It's a whole thing." },
    { by: 'a', say: "That's terrible. Which two?" },
  ] },
  { id: 'cx.s3', when: { ending: 'leak' }, turns: [
    { by: 'a', say: "Who's your weakest link? Just between us." },
    { by: 'b', say: "I mean, everybody over there already knows who's next." },
    { by: 'a', conf: "{b} didn't say a name. {b.Sub} didn't have to." },
  ] },
  { id: 'cx.s4', when: { ending: 'leak', register: 'schemer' }, turns: [
    { by: 'a', say: "You seem like the only smart one over there." },
    { by: 'b', say: "Thank you! Nobody listens to me." },
    { by: 'a', say: "Tell me everything." },
  ] },
  // ...or b sees it coming
  { id: 'cx.s5', when: { ending: 'shut' }, turns: [
    { by: 'a', say: "So who's running things over there? Honestly." },
    { by: 'b', say: "Nice try. Go fish somewhere else." },
  ] },
  { id: 'cx.s6', when: { ending: 'shut' }, turns: [
    { by: 'a', say: "Rough night on your side? I heard yelling." },
    { by: 'b', say: "You heard wrong. We're great. Best of friends." },
    { by: 'b', conf: "{a} thinks I'm going to hand over our secrets for a smile. Cute." },
  ] },
  { id: 'cx.s7', when: { ending: 'shut' }, turns: [
    { by: 'a', say: "Who's your weakest link? Just between us." },
    { by: 'b', say: "Between us? You. You're our weakest link. You keep coming over here." },
  ] },
  { id: 'cx.s8', when: { ending: 'shut', register: 'schemer' }, turns: [
    { by: 'a', say: "You seem like the only smart one over there." },
    { by: 'b', say: "Smart enough to know what you're doing." },
    { by: 'a', conf: "Okay. {b} is going to be a problem later." },
  ] },
];

export default {
  'cross.rival.any': RIVAL, 'cross.friend.any': FRIEND, 'cross.flirt.any': FLIRT, 'cross.spy.any': SPY,
};

/** Data these scenes always carry: the two sides. */
export const GUARANTEED = {
  'cross.rival.any': ['mine', 'theirs'], 'cross.friend.any': ['mine', 'theirs'],
  'cross.flirt.any': ['mine', 'theirs'], 'cross.spy.any': ['mine', 'theirs'],
};
