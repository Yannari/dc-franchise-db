// ══════════════════════════════════════════════════════════════════════
// td/script/lines/twist.js — the people a twist just happened to, reacting
// ══════════════════════════════════════════════════════════════════════
//
// The twist itself is the engine's (twists.js decides it; generateTwistScenes says what
// happened). These are the two people it hit hardest, talking right after: {a} and {b}.
// Written by the stepped viewer (vp-td-ep/twists.js) with a pick keyed on the episode,
// the twist and the two names, so a replay says the same words. They may only ask for
// facts that do not change during a season (register, archetype, age, stats).
//
// twist.react.shuffle    a swap, a dissolve, a mutiny, a kidnapping, a schoolyard pick:
//                        {a} and {b} have just been moved or split up.
// twist.react.merge      one tribe now; {a} and {b} have been working together.
// twist.react.bottom     the merge, from the bottom: {a} and {b} have nobody.
// twist.react.safety     an immunity twist: {a} is safe and {b} isn't (or both are).
// twist.react.danger     an elimination twist: two go, or nobody is safe.
// twist.react.return     somebody is back in the game.
// twist.react.advantage  a journey, an auction, a summit: something worth having is out there.
// twist.react.feast      a feast, a visit from home.
// twist.react.other      anything else.
// Ids: 'tw.'.

const SHUFFLE = [
  { id: 'tw.s1', turns: [
    { by: 'a', say: "Did that just happen?" },
    { by: 'b', say: "That just happened." },
    { by: 'a', say: "Everything we planned. Gone. In one sentence." },
    { by: 'b', conf: "New people, new camp, new everything. I'm starting from zero. Again." },
  ] },
  { id: 'tw.s2', turns: [
    { by: 'b', say: "Hey. Whatever happens over there, we're still us." },
    { by: 'a', say: "Promise?" },
    { by: 'b', say: "Promise. Find me at the merge." },
    { by: 'a', conf: "I don't know who to trust on this side. All I've got is a promise from somebody I can't even see anymore." },
  ] },
  { id: 'tw.s3', turns: [
    { by: 'a', say: "Okay. New tribe. Smile at everyone. Learn their names." },
    { by: 'b', say: "We know their names." },
    { by: 'a', say: "Learn them again. Nicer." },
  ] },
  { id: 'tw.s4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "A shuffle is the best thing that can happen to me. Everyone's lost. I already have a plan for the new people." },
    { by: 'b', say: "You look happy." },
    { by: 'a', say: "I look adaptable." },
  ] },
  { id: 'tw.s5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "This is RIDICULOUS. We were winning!" },
    { by: 'b', say: "Keep your voice down. They're our tribe now." },
    { by: 'a', say: "Not by choice!" },
  ] },
  { id: 'tw.s6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I didn't even get to say goodbye to everyone." },
    { by: 'b', say: "We'll see them at the challenge." },
    { by: 'a', conf: "I know it's a game. I still miss my old camp already." },
  ] },
  { id: 'tw.s7', turns: [
    { by: 'b', say: "Who's the swing on our new side?" },
    { by: 'a', say: "Give me a day." },
    { by: 'b', say: "We might not have a day." },
    { by: 'a', conf: "Every swap there's one person who decides everything. I need to find them before they find me." },
  ] },
  { id: 'tw.s8', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "At least we're on the stronger side now." },
    { by: 'b', say: "Are we?" },
    { by: 'a', say: "We are if I'm on it." },
  ] },
  { id: 'tw.s9', when: { register: 'shy' }, turns: [
    { by: 'a', say: "I don't know anyone over here." },
    { by: 'b', say: "You know me." },
    { by: 'a', conf: "One person. That's all I have on this side. One is better than zero." },
  ] },
];
const MERGE = [
  { id: 'tw.m1', turns: [
    { by: 'a', say: "We made it. We actually made the merge." },
    { by: 'b', say: "Don't celebrate yet. Now everybody's coming for everybody." },
    { by: 'a', conf: "One tribe. Every old alliance is either a shield or a target now. I need to know which mine is." },
  ] },
  { id: 'tw.m2', turns: [
    { by: 'b', say: "Count the numbers. Ours versus theirs." },
    { by: 'a', say: "Even." },
    { by: 'b', say: "Then somebody's going to flip. Let's make sure it's to us." },
  ] },
  { id: 'tw.m3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Smile at everybody. Promise nothing." },
    { by: 'b', say: "That's your whole merge strategy?" },
    { by: 'a', say: "That's everyone's merge strategy. I'm just honest about it." },
  ] },
  { id: 'tw.m4', turns: [
    { by: 'a', say: "Remember, it's still us first." },
    { by: 'b', say: "Us first. Always." },
    { by: 'b', conf: "We said it. We both meant it. The merge is where people stop meaning it." },
  ] },
  { id: 'tw.m5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Individual immunity. Finally. Nobody can drag me down now." },
    { by: 'b', say: "Nobody can carry you either." },
    { by: 'a', say: "I don't need carrying." },
  ] },
  { id: 'tw.m6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm not going to sit there and be nice to people who've been trying to vote me out for weeks." },
    { by: 'b', say: "For one day. Please." },
    { by: 'a', say: "One day. Fine. ONE." },
  ] },
  { id: 'tw.m7', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "It's kind of nice, everybody together." },
    { by: 'b', say: "It's nice until the vote." },
    { by: 'a', conf: "I know it's a game. I'm going to enjoy one nice meal before it gets ugly." },
  ] },
  { id: 'tw.m8', turns: [
    { by: 'b', say: "Who do they think the threat is? Us?" },
    { by: 'a', say: "Probably." },
    { by: 'b', say: "Then let's give them somebody else to look at." },
  ] },
];
const BOTTOM = [
  { id: 'tw.b1', turns: [
    { by: 'a', say: "Everyone's already paired off. Did you notice?" },
    { by: 'b', say: "I noticed. We're the leftovers." },
    { by: 'a', say: "Leftovers can still vote." },
    { by: 'b', conf: "Two people nobody wants. That's either the end of my game or the start of it." },
  ] },
  { id: 'tw.b2', turns: [
    { by: 'b', say: "Nobody's talked to me all day." },
    { by: 'a', say: "Me neither. Want to fix that together?" },
    { by: 'b', say: "Are you asking me to an alliance?" },
    { by: 'a', say: "I'm asking you not to be alone." },
  ] },
  { id: 'tw.b3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "The bottom is a great place to be. Nobody watches the bottom. Until it's too late." },
    { by: 'b', say: "Why are you smiling?" },
    { by: 'a', say: "No reason." },
  ] },
  { id: 'tw.b4', turns: [
    { by: 'a', say: "They think we're easy votes." },
    { by: 'b', say: "Are we?" },
    { by: 'a', say: "Only if we stay separate." },
  ] },
  { id: 'tw.b5', when: { register: 'shy' }, turns: [
    { by: 'b', say: "Hey. Want to sit with me?" },
    { by: 'a', say: "Really?" },
    { by: 'b', say: "Really. I could use the company." },
  ] },
  { id: 'tw.b6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "They're all looking at us like we're the next two out." },
    { by: 'b', say: "We kind of are." },
    { by: 'a', say: "Not without a fight." },
  ] },
];
const SAFETY = [
  { id: 'tw.sa1', turns: [
    { by: 'a', say: "Safe. I'm actually safe." },
    { by: 'b', say: "Lucky you." },
    { by: 'a', say: "You okay?" },
    { by: 'b', conf: "Everybody's safe except the people who aren't. Guess which one I am." },
  ] },
  { id: 'tw.sa2', turns: [
    { by: 'b', say: "Use it well." },
    { by: 'a', say: "What do you mean?" },
    { by: 'b', say: "You can't go home. Which means you can help someone else not go home." },
  ] },
  { id: 'tw.sa3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Safety means I can't be the target. It also means I can say whatever I want. That's the dangerous part." },
  ] },
  { id: 'tw.sa4', turns: [
    { by: 'a', say: "One less person to worry about." },
    { by: 'b', say: "One more person for everyone else to worry about." },
  ] },
  { id: 'tw.sa5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I wish you'd got it instead of me." },
    { by: 'b', say: "Don't say that. Just look after me." },
  ] },
  { id: 'tw.sa6', turns: [
    { by: 'b', say: "So who goes?" },
    { by: 'a', say: "Not me, apparently." },
    { by: 'b', say: "Must be nice." },
    { by: 'a', conf: "{b} is jealous. {b} is also right. It is nice." },
  ] },
];
const DANGER = [
  { id: 'tw.d1', turns: [
    { by: 'a', say: "Two people? Two people go?" },
    { by: 'b', say: "That's what the host said." },
    { by: 'a', say: "I need to talk to everybody. Right now." },
    { by: 'b', conf: "Everyone just started scrambling at the same time. Twice the votes, twice the lies." },
  ] },
  { id: 'tw.d2', turns: [
    { by: 'b', say: "Nobody's safe." },
    { by: 'a', say: "Nobody was ever safe. Now it's just honest about it." },
  ] },
  { id: 'tw.d3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "This is insane. Who comes up with this?!" },
    { by: 'b', say: "The host. Every time." },
    { by: 'a', say: "Then vote the HOST off!" },
  ] },
  { id: 'tw.d4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Chaos is good for me. Everybody panics. Panicking people make deals they shouldn't. I'm taking all of them." },
  ] },
  { id: 'tw.d5', turns: [
    { by: 'a', say: "Are we okay? Tell me we're okay." },
    { by: 'b', say: "We're okay." },
    { by: 'a', say: "Say it like you mean it." },
    { by: 'b', say: "We're okay. I promise." },
  ] },
  { id: 'tw.d6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Breathe. Count. Then talk." },
    { by: 'b', say: "How are you so calm?" },
    { by: 'a', say: "Because everybody else isn't." },
  ] },
];
const RETURN = [
  { id: 'tw.r1', turns: [
    { by: 'a', say: "Hi. Miss me?" },
    { by: 'b', say: "You're back?!" },
    { by: 'a', say: "I'm back." },
    { by: 'b', conf: "Somebody who knows exactly who voted them out just walked back into camp. Everybody's sweating." },
  ] },
  { id: 'tw.r2', turns: [
    { by: 'b', say: "Welcome back. Seriously." },
    { by: 'a', say: "Seriously? Or game seriously?" },
    { by: 'b', say: "Both." },
  ] },
  { id: 'tw.r3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I remember every single name that sent me out. Every. Single. One." },
    { by: 'b', say: "Mine wasn't one of them." },
    { by: 'a', say: "I know. That's why I'm talking to you first." },
  ] },
  { id: 'tw.r4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Being out of the game was the best thing that happened to me. I watched. I learned. Now I'm back." },
  ] },
  { id: 'tw.r5', turns: [
    { by: 'b', say: "What was it like out there?" },
    { by: 'a', say: "Quiet. Too quiet. I had a lot of time to think." },
    { by: 'b', say: "About what?" },
    { by: 'a', say: "About you. All of you. Very carefully." },
  ] },
  { id: 'tw.r6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm so happy to see everyone!" },
    { by: 'b', say: "Even the people who voted for you?" },
    { by: 'a', say: "Even them. Mostly." },
  ] },
];
const ADVANTAGE = [
  { id: 'tw.a1', turns: [
    { by: 'a', say: "What do you think's out there?" },
    { by: 'b', say: "Something worth fighting for. Or something that ruins somebody's game." },
    { by: 'a', say: "Same thing, usually." },
  ] },
  { id: 'tw.a2', turns: [
    { by: 'b', say: "If you get it, tell me." },
    { by: 'a', say: "If I get it, nobody will know." },
    { by: 'b', say: "Including me?" },
    { by: 'a', say: "Especially you. For your own protection." },
  ] },
  { id: 'tw.a3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "An advantage is only as good as the secret around it. I'm already working on the secret." },
  ] },
  { id: 'tw.a4', turns: [
    { by: 'a', say: "Everybody's going to be watching whoever comes back from this." },
    { by: 'b', say: "So don't come back looking happy." },
    { by: 'a', say: "Noted. Sad face. Very sad." },
  ] },
  { id: 'tw.a5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I want it. Whatever it is, I want it." },
    { by: 'b', say: "You don't even know what it is." },
    { by: 'a', say: "I want it more not knowing." },
  ] },
  { id: 'tw.a6', turns: [
    { by: 'b', say: "This changes everything." },
    { by: 'a', say: "Only for one person." },
    { by: 'b', conf: "One person is about to get a lot more dangerous. I want to be that person. Or standing next to them." },
  ] },
];
const FEAST = [
  { id: 'tw.f1', turns: [
    { by: 'a', say: "Real food. Real, actual food." },
    { by: 'b', say: "Don't cry." },
    { by: 'a', say: "I'm not crying. The bread is crying." },
  ] },
  { id: 'tw.f2', turns: [
    { by: 'b', say: "Pass the… everything. Just pass everything." },
    { by: 'a', say: "Slow down. You'll make yourself sick." },
    { by: 'b', say: "Worth it." },
    { by: 'a', conf: "Full stomachs. Loose mouths. I'm listening to everything said at this table." },
  ] },
  { id: 'tw.f3', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I haven't smiled like this in weeks." },
    { by: 'b', say: "Me neither." },
    { by: 'a', conf: "For one meal, nobody was playing. It was just people. Eating. Being happy." },
  ] },
  { id: 'tw.f4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Have some more. You've earned it." },
    { by: 'b', say: "Why are you being so nice?" },
    { by: 'a', say: "It's a feast. Everyone's nice at a feast." },
    { by: 'a', conf: "Nice today, useful tomorrow. That's the menu." },
  ] },
  { id: 'tw.f5', turns: [
    { by: 'a', say: "I'm never eating rice again. Ever." },
    { by: 'b', say: "You'll be eating rice again tomorrow." },
    { by: 'a', say: "Let me have this." },
  ] },
  { id: 'tw.f6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Who took the last chicken leg?" },
    { by: 'b', say: "There were six!" },
    { by: 'a', say: "And now there are NONE!" },
  ] },
];
const OTHER = [
  { id: 'tw.o1', turns: [
    { by: 'a', say: "Did anyone see that coming?" },
    { by: 'b', say: "No. That's why nobody warns us first." },
  ] },
  { id: 'tw.o2', turns: [
    { by: 'b', say: "What does this mean for us?" },
    { by: 'a', say: "It means we stop planning for yesterday's game." },
  ] },
  { id: 'tw.o3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Every twist is a chance for somebody. I plan on being the somebody." },
  ] },
  { id: 'tw.o4', turns: [
    { by: 'a', say: "Okay. Okay. Think." },
    { by: 'b', say: "You're panicking." },
    { by: 'a', say: "I'm thinking quickly. It looks the same." },
  ] },
  { id: 'tw.o5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I hate surprises!" },
    { by: 'b', say: "You picked the wrong show." },
  ] },
  { id: 'tw.o6', turns: [
    { by: 'b', say: "Nothing in this game stays the same for more than a day." },
    { by: 'a', say: "Except the rice." },
    { by: 'b', conf: "{a} made a joke. I needed that more than I'd admit." },
  ] },
];

export default {
  'twist.react.shuffle': SHUFFLE, 'twist.react.merge': MERGE, 'twist.react.bottom': BOTTOM, 'twist.react.safety': SAFETY,
  'twist.react.danger': DANGER, 'twist.react.return': RETURN, 'twist.react.advantage': ADVANTAGE, 'twist.react.feast': FEAST,
  'twist.react.other': OTHER,
};
