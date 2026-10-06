// ══════════════════════════════════════════════════════════════════════
// td/script/lines/tail.js — wildcards, defending the absent, being left out, blame, cracked trust
// ══════════════════════════════════════════════════════════════════════
//
// wild.pivot.<wild|odd> — {a} does something nobody saw coming, with {b}
//   (the engine moved their bond up or down; the scene doesn't say which way).
// wild.solo.<wild|odd>  — the same, {a} alone with the camera.
// loyal.defend.any — {a} defended {b} when {b} wasn't there; the camera hears it.
// conf.excluded.any — {a} is left out of the group, and knows it.
// blame.loss.any — {a} blames {b} for how the last challenge went.
// trust.crack.<ending> — {a} catches {b} out. 'vote': {b} was meant to write
//   {plan} with {group} and wrote {wrote}; 'double': {b} is in both {group}
//   and {group2}; 'vague': {b}'s story doesn't match. Ids: 'tl.'.
const C = (id, ...lines) => ({ id, turns: lines.map(l => ({ by: 'a', conf: l })) });
const Cw = (id, when, ...lines) => ({ id, when, turns: lines.map(l => ({ by: 'a', conf: l })) });

const PIVOT_WILD = [
  { id: 'tl.w1', turns: [
    { by: 'a', say: "Hey. Want to be friends? Like, best friends?" },
    { by: 'b', say: "We've barely spoken." },
    { by: 'a', say: "That's what makes it exciting!" },
    { beat: '{b} has no idea what to do with that.' },
  ] },
  { id: 'tl.w2', turns: [
    { by: 'a', say: "I've decided I don't like you anymore." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since about two minutes ago. Bye!" },
    { beat: '{a} skips off. {b} stares after {a.obj}.' },
  ] },
  { id: 'tl.w3', turns: [
    { by: 'a', say: "I had a dream about you last night. We were allies. It was great." },
    { by: 'b', say: "Okay...?" },
    { by: 'a', say: "So let's do it for real." },
    { by: 'b', conf: "I have no idea what just happened. I think I'm in an alliance with {a} now?" },
  ] },
  { id: 'tl.w4', turns: [
    { by: 'a', say: "Everyone thinks I'm with my group. I'm switching. To you." },
    { by: 'b', say: "Do I get a say in this?" },
    { by: 'a', say: "Not really." },
  ] },
  { id: 'tl.w5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You! You're interesting. I like interesting." },
    { by: 'b', say: "Thanks...? I think?" },
    { by: 'a', say: "It's definitely a compliment. Probably." },
  ] },
  { id: 'tl.w6', turns: [
    { by: 'b', say: "Why are you sitting with me? You never sit with me." },
    { by: 'a', say: "I felt like changing things up." },
    { by: 'b', say: "Everyone's staring at us." },
    { by: 'a', say: "Good." },
  ] },
];
const PIVOT_ODD = [
  { id: 'tl.o1', turns: [
    { by: 'a', say: "Can I hang out with you today?" },
    { by: 'b', say: "Sure. That's... new." },
    { by: 'a', say: "I'm trying new things." },
  ] },
  { id: 'tl.o2', turns: [
    { by: 'b', say: "Aren't you supposed to be with your usual crowd?" },
    { by: 'a', say: "I'm taking a day off from them." },
    { by: 'b', say: "Can you do that?" },
    { by: 'a', say: "Apparently." },
  ] },
  { id: 'tl.o3', turns: [
    { by: 'a', say: "Do you ever feel like doing the opposite of what everyone expects?" },
    { by: 'b', say: "Not really." },
    { by: 'a', say: "I do. Constantly. Today it's you." },
  ] },
  { id: 'tl.o4', turns: [
    { by: 'a', say: "I don't know why, but I trust you today." },
    { by: 'b', say: "Just today?" },
    { by: 'a', say: "Ask me again tomorrow." },
  ] },
  { id: 'tl.o5', turns: [
    { by: 'b', say: "What are you doing over here?" },
    { by: 'a', say: "Honestly? I have no idea. Can I stay?" },
    { by: 'b', say: "...Sure." },
  ] },
  { id: 'tl.o6', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um. I don't usually do this, but do you want to talk?" },
    { by: 'b', say: "Sure. About what?" },
    { by: 'a', say: "Anything. I'm trying to be braver." },
  ] },
];
const SOLO_WILD = [
  C('tl.s1', "I woke up today and decided to be a completely different person. So far, so good."),
  C('tl.s2', "Nobody can predict me. Not even me. That's my strategy."),
  C('tl.s3', "Everyone had me figured out. Had. Past tense."),
  Cw('tl.s4', { register: 'fiery' }, "I'm going to do something crazy today. I don't know what yet. That's the fun part!"),
  C('tl.s5', "The look on everyone's faces when I did that? Worth it. Completely worth it."),
  C('tl.s6', "Keep them guessing. That's all I'm doing. Keep them guessing."),
];
const SOLO_ODD = [
  C('tl.d1', "I'm not doing what everyone expects today. I'm just not."),
  C('tl.d2', "People keep asking what I'm up to. Honestly? I'm figuring it out as I go."),
  C('tl.d3', "I changed my mind about a few things today. Nobody knows that yet."),
  C('tl.d4', "I'm off script. It feels kind of good."),
  Cw('tl.d5', { register: 'shy' }, "I tried something different today. I think it worked? Maybe?"),
  C('tl.d6', "Nobody can tell what I'm doing today. That makes two of us."),
];
const DEFEND = [
  C('tl.f1', "People were talking about {b} behind {b.posAdj} back. I shut it down. {b} would do the same for me."),
  C('tl.f2', "Somebody said {b}'s name for the vote. I said 'Not {b}.' And that was the end of it."),
  C('tl.f3', "{b} will never know I stuck up for {b.obj} today. That's fine. I didn't do it for credit."),
  Cw('tl.f4', { register: 'fiery' }, "You want to come after {b}? You come through me first. I said that. Out loud. I meant it."),
  C('tl.f5', "Everyone was piling on {b}. I'm not going to just sit there and let that happen."),
  Cw('tl.f6', { register: 'sweet' }, "{b} wasn't there to defend {b.ref}, so I did. That's what friends do."),
];
const EXCLUDED = [
  C('tl.e1', "There was a strategy meeting today. I found out about it afterwards."),
  C('tl.e2', "I walked up to a group, and it went quiet. They said it was nothing. It wasn't nothing."),
  C('tl.e3', "Everyone laughed at something. I asked what was funny. 'You had to be there.' I was there."),
  C('tl.e4', "I ate alone today. Not because I wanted to."),
  Cw('tl.e5', { register: 'shy' }, "I keep waiting for someone to include me. It hasn't happened yet."),
  Cw('tl.e6', { register: 'fiery' }, "Fine! Leave me out! See if I care! ...I care a little."),
];
const BLAME = [
  { id: 'tl.b1', when: { merged: false }, turns: [
    { by: 'a', say: "We had that challenge. We literally had it." },
    { by: 'b', say: "I know. I'm sorry." },
    { by: 'a', say: "'Sorry' doesn't get us immunity." },
    { beat: '{b} stares at the ground.' },
  ] },
  { id: 'tl.b2', when: { merged: false }, turns: [
    { by: 'b', say: "Are you mad at me?" },
    { by: 'a', say: "Why would I be mad? Just because we lost because of you?" },
    { by: 'b', say: "That's not fair." },
    { by: 'a', say: "Neither was watching you out there." },
  ] },
  { id: 'tl.b3', turns: [
    { by: 'a', say: "Can I give you some advice? Practise. Like, a lot." },
    { by: 'b', say: "Wow. Thanks." },
    { by: 'a', say: "I'm being serious." },
    { by: 'b', say: "So am I. Thanks for nothing." },
  ] },
  { id: 'tl.b4', turns: [
    { by: 'b', say: "I know I wasn't great today." },
    { by: 'a', say: "It's fine." },
    { by: 'a', conf: "It is not fine. {b} was the worst one out there, and everyone saw it." },
  ] },
  { id: 'tl.b5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "What WAS that out there?!" },
    { by: 'b', say: "I tried my best!" },
    { by: 'a', say: "That was your best?!" },
  ] },
  { id: 'tl.b6', turns: [
    { by: 'a', say: "Let's just talk about the challenge for a second." },
    { by: 'b', say: "Here we go." },
    { by: 'a', say: "I'm just saying, some of us pulled our weight, and some of us didn't." },
    { by: 'b', say: "Just say my name. Everyone knows you mean me." },
  ] },
  { id: 'tl.b7', when: { merged: false }, turns: [
    { by: 'a', say: "Next time, maybe sit out and let someone else do it." },
    { by: 'b', say: "That's harsh." },
    { by: 'a', say: "Then do better next time." },
  ] },
];
const CRACK_VOTE = [
  { id: 'tl.v1', turns: [
    { by: 'a', say: "Can I ask you something? At the vote. Did you write {plan}?" },
    { by: 'b', say: "Of course I did." },
    { by: 'a', say: "Because {group} wrote {plan}. All of us. And somebody wrote {wrote}." },
    { by: 'b', say: "Well, it wasn't me." },
    { by: 'a', conf: "It was {b}. I'm sure of it. And {b} just lied to my face." },
  ] },
  { id: 'tl.v2', turns: [
    { by: 'a', conf: "{group} agreed on {plan}. {b} wrote {wrote}. I did the maths, and it only works one way." },
    { by: 'a', conf: "I haven't said anything. But I will." },
  ] },
  { id: 'tl.v3', turns: [
    { by: 'a', say: "Funny thing. Somebody in {group} didn't vote {plan}." },
    { by: 'b', say: "Weird. Who?" },
    { by: 'a', say: "I was hoping you'd tell me." },
    { beat: "{b} doesn't answer." },
  ] },
  { id: 'tl.v4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You wrote {wrote}! We said {plan}! I KNOW you wrote {wrote}!" },
    { by: 'b', say: "You don't know anything!" },
    { by: 'a', say: "I know how to count!" },
  ] },
  { id: 'tl.v5', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{b} told {group} {plan}. {b} wrote {wrote}. I'm not going to confront {b}. I'm going to adjust." },
  ] },
  { id: 'tl.v6', turns: [
    { by: 'b', say: "Why are you being so weird with me?" },
    { by: 'a', say: "{plan}. Remember? That was the plan." },
    { by: 'b', say: "...Yeah. So?" },
    { by: 'a', say: "So I know it wasn't your vote." },
  ] },
];
const CRACK_DOUBLE = [
  { id: 'tl.x1', turns: [
    { by: 'a', say: "Quick question. Are you with {group}, or with {group2}?" },
    { by: 'b', say: "What? {group}, obviously." },
    { by: 'a', say: "That's funny. {group2} thinks you're with them." },
    { beat: "{b} doesn't answer right away." },
  ] },
  { id: 'tl.x2', turns: [
    { by: 'a', conf: "{b} is in {group} AND {group2}. Those two can't both make it to the end." },
    { by: 'a', conf: "So {b} is lying to one of them. Maybe both." },
  ] },
  { id: 'tl.x3', turns: [
    { by: 'a', say: "How's {group2}? Oh wait, you're with us. Right?" },
    { by: 'b', say: "I don't know what you're talking about." },
    { by: 'a', say: "Sure you don't." },
  ] },
  { id: 'tl.x4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is playing {group} and {group2} at the same time. Brave. Also stupid." },
    { by: 'a', conf: "I'm going to make sure both groups find out. At exactly the wrong moment for {b}." },
  ] },
  { id: 'tl.x5', turns: [
    { by: 'b', say: "Hey! Coming to the {group} meeting?" },
    { by: 'a', say: "Are you? Or is it a {group2} day today?" },
    { by: 'b', say: "What's that supposed to mean?" },
    { by: 'a', say: "You know exactly what it means." },
  ] },
  { id: 'tl.x6', turns: [
    { by: 'a', conf: "I compared notes with someone from {group2}. {b}'s story there doesn't match the one {b} told us." },
  ] },
];
const CRACK_VAGUE = [
  { id: 'tl.q1', turns: [
    { by: 'a', conf: "{b}'s vote didn't match what {b} said {b} would do. I haven't mentioned it. I will." },
  ] },
  { id: 'tl.q2', turns: [
    { by: 'a', say: "You said one thing yesterday. You did another." },
    { by: 'b', say: "Things changed." },
    { by: 'a', say: "Yeah. They did." },
  ] },
  { id: 'tl.q3', turns: [
    { by: 'a', conf: "Something {b} told me doesn't add up anymore. I'm not saying anything. I'm adjusting." },
  ] },
  { id: 'tl.q4', turns: [
    { by: 'b', say: "We're good, right?" },
    { by: 'a', say: "Are we?" },
    { by: 'b', say: "...Aren't we?" },
    { by: 'a', say: "Tell me what really happened at the last vote, and then we'll see." },
  ] },
  { id: 'tl.q5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Don't lie to me! I know you didn't vote how you said!" },
    { by: 'b', say: "Prove it!" },
  ] },
  { id: 'tl.q6', turns: [
    { by: 'a', conf: "{b}'s story keeps changing. Every time I hear it, it's a little different." },
  ] },
];

export default {
  'wild.pivot.wild': PIVOT_WILD,
  'wild.pivot.odd': PIVOT_ODD,
  'wild.solo.wild': SOLO_WILD,
  'wild.solo.odd': SOLO_ODD,
  'loyal.defend.any': DEFEND,
  'conf.excluded.any': EXCLUDED,
  'blame.loss.any': BLAME,
  'trust.crack.vote': CRACK_VOTE,
  'trust.crack.double': CRACK_DOUBLE,
  'trust.crack.vague': CRACK_VAGUE,
};

export const GUARANTEED = {
  'trust.crack.vote': ['plan', 'wrote', 'group'],
  'trust.crack.double': ['group'],
};
