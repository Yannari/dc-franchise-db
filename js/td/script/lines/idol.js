// ══════════════════════════════════════════════════════════════════════
// td/script/lines/idol.js — idol secrets at camp, and the merge's first hours
// (camp-events.js checkIdolConfessions, idol snooping, tip-offs, swap intel, the merge)
// ══════════════════════════════════════════════════════════════════════
//
//   idol.confide.any   a, who holds an idol, tells b about it
//   idol.leak.any      a, alone, decides not to keep {target}'s idol secret
//   idol.snoop.caught  a goes through b's bag, finds b's idol, and b walks in on it
//   idol.snoop.clean   a, alone, has just found {target}'s idol in {target}'s bag
//   idol.tip.any       a tells b that {target} has an idol
//   idol.intel.any     a, just swapped in, is asked by b, a new tribemate, about a's old camp
//   merge.news.any     a and b, the day the tribes become one
//   merge.scramble.any a pulls b aside in the first hours of the merge
//   merge.plan.any     a, alone, at the merge
//
// Ids: 'id.'.

const CONFIDE = [
  { id: 'id.c1', turns: [
    { beat: '{a} waits until everyone else is asleep, then nudges {b} awake.' },
    { by: 'a', say: "Don't freak out. I found an idol." },
    { by: 'b', say: "You WHAT?" },
    { by: 'a', say: "Shh! You're the only person I've told." },
  ] },
  { id: 'id.c2', turns: [
    { by: 'a', say: "I need to tell somebody or I'm going to explode." },
    { by: 'b', say: "Okay. Tell me." },
    { by: 'a', say: "There's an idol in my bag. Right now. In my bag." },
  ] },
  { id: 'id.c3', turns: [
    { by: 'a', say: "If they come for you, I've got you. I mean that. I have the idol." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since the other day. Nobody knows. Keep it that way." },
    { by: 'b', say: "I swear." },
  ] },
  { id: 'id.c4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I don't like keeping secrets from you, so..." },
    { beat: '{a} opens {a.posAdj} bag just wide enough for {b} to see.' },
    { by: 'b', say: "No way." },
  ] },
  { id: 'id.c5', when: { band: 'friends' }, turns: [
    { by: 'a', say: "You're the one person out here I trust completely. So you should know. I have the idol." },
    { by: 'b', say: "{a}... thank you for telling me." },
    { by: 'a', conf: "It felt like the right call. I hope it was." },
  ] },
  { id: 'id.c6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I've got the idol. If anybody even looks at me funny, they're getting blindsided." },
    { by: 'b', say: "Maybe don't say that so loud?" },
    { by: 'a', say: "Right. Right. Quietly getting blindsided." },
  ] },
];

const LEAK = [
  { id: 'id.l1', turns: [
    { by: 'a', conf: "{target} trusted me with something big. I've been lying awake all night thinking about what to do with it. I think I know." },
  ] },
  { id: 'id.l2', turns: [
    { by: 'a', conf: "I like {target}. I do. But {target} with an idol is a problem for me, and I didn't come here to make friends." },
  ] },
  { id: 'id.l3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{target} told me about the idol. That's the nicest thing {target} has ever done for me. Now let me use it." },
  ] },
  { id: 'id.l4', turns: [
    { beat: 'The sun comes up. {a} hasn\'t slept.' },
    { by: 'a', conf: "A secret like that doesn't stay a secret just because someone asked you to keep it." },
  ] },
  { id: 'id.l5', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I feel sick about it. But if {target} plays that idol, somebody I care about goes home. I have to tell someone." },
  ] },
  { id: 'id.l6', turns: [
    { by: 'a', conf: "{target} has an idol and I'm the only one who knows. For about another hour." },
  ] },
];

const SNOOP_CAUGHT = [
  { id: 'id.s1', turns: [
    { beat: '{a} is elbow-deep in {b}\'s bag when {b} walks back early.' },
    { by: 'b', say: "What are you doing in my stuff?!" },
    { by: 'a', say: "I thought it was my bag!" },
    { by: 'b', say: "Your bag is RED." },
  ] },
  { id: 'id.s2', turns: [
    { by: 'b', say: "Put it back." },
    { by: 'a', say: "Put what back?" },
    { by: 'b', say: "The thing in your hand, {a}. Put it back." },
  ] },
  { id: 'id.s3', turns: [
    { by: 'b', say: "Seriously? You went through my things?" },
    { by: 'a', say: "I was looking for sunscreen!" },
    { by: 'b', say: "In the bottom of my bag. Under my socks." },
    { beat: 'Everybody at camp heard it.' },
  ] },
  { id: 'id.s4', when: { registerB: 'fiery' }, turns: [
    { by: 'b', say: "GET OUT OF MY BAG!" },
    { by: 'a', say: "Okay! Okay! I'm out!" },
    { by: 'b', say: "Everybody, {a} is a THIEF!" },
  ] },
  { id: 'id.s5', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "Find anything interesting?" },
    { by: 'a', say: "Actually, yes." },
    { by: 'b', say: "You're not even going to pretend?" },
    { by: 'a', say: "What would be the point?" },
  ] },
  { id: 'id.s6', turns: [
    { by: 'b', say: "I trusted you enough to leave my stuff around you." },
    { by: 'a', say: "It's not what it looks like." },
    { by: 'b', say: "It's exactly what it looks like." },
  ] },
];

const SNOOP_CLEAN = [
  { id: 'id.n1', turns: [
    { beat: '{a} checks that nobody is around, then unzips {target}\'s bag.' },
    { by: 'a', conf: "And there it is. {target} has an idol. I put everything back exactly how I found it." },
  ] },
  { id: 'id.n2', turns: [
    { by: 'a', conf: "I didn't take it. I just needed to know it was there. Now I know." },
  ] },
  { id: 'id.n3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Bags are for people who want their secrets found. {target}'s idol was in the side pocket. The SIDE pocket." },
  ] },
  { id: 'id.n4', turns: [
    { beat: '{a} zips up {target}\'s bag and walks off whistling.' },
    { by: 'a', conf: "Nobody knows I know. That's my favorite kind of knowing." },
  ] },
  { id: 'id.n5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I KNEW {target} had something! I knew it! Okay. Calm. Calm. Nobody can know I know." },
  ] },
  { id: 'id.n6', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I've never done anything like that before. My heart is going a hundred miles an hour. But {target} has an idol." },
  ] },
];

const TIP = [
  { id: 'id.t1', turns: [
    { by: 'a', say: "{target} has an idol." },
    { by: 'b', say: "Are you sure?" },
    { by: 'a', say: "Positive." },
    { by: 'b', conf: "That changes everything." },
  ] },
  { id: 'id.t2', turns: [
    { beat: '{a} leads {b} away from camp, then checks twice that they\'re alone.' },
    { by: 'a', say: "{target} is holding something." },
    { by: 'b', say: "Holding what?" },
    { beat: '{a} just looks at {b}.' },
    { by: 'b', say: "...Oh." },
  ] },
  { id: 'id.t3', when: { band: 'friends' }, turns: [
    { by: 'a', say: "I'm telling you because you're my person. {target} has the idol." },
    { by: 'b', say: "Then we don't waste our votes on {target}." },
    { by: 'a', say: "Exactly." },
  ] },
  { id: 'id.t4', turns: [
    { by: 'a', say: "If you're thinking about {target}, don't." },
    { by: 'b', say: "Why not?" },
    { by: 'a', say: "Because {target} has a way to stay, and you'd be the one going home." },
  ] },
  { id: 'id.t5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I know something about {target}. Want to know what it is?" },
    { by: 'b', say: "What do you want for it?" },
    { by: 'a', say: "Just your vote, when I need it." },
    { by: 'b', say: "...Deal." },
  ] },
  { id: 'id.t6', turns: [
    { by: 'b', say: "How do you know {target} has an idol?" },
    { by: 'a', say: "I just do. Trust me." },
    { by: 'b', conf: "I trust {a}. I'm going to keep an eye on {target} anyway." },
  ] },
];

const INTEL = [
  { id: 'id.i1', turns: [
    { by: 'b', say: "So what was it like over there? Who's running things?" },
    { by: 'a', say: "I'll tell you some of it." },
    { by: 'b', say: "Some of it?" },
    { by: 'a', conf: "Enough to seem useful. Not enough to seem dangerous." },
  ] },
  { id: 'id.i2', turns: [
    { by: 'a', say: "Fair warning, the other tribe has an idol somewhere." },
    { by: 'b', say: "Who?" },
    { by: 'a', say: "I've got a guess. Let's talk later." },
  ] },
  { id: 'id.i3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I know who's on the bottom over there, who's lying, and who has what. Here, that's worth more than food." },
    { by: 'b', say: "Anything we should know about them?" },
    { by: 'a', say: "Plenty. One thing at a time." },
  ] },
  { id: 'id.i4', turns: [
    { by: 'b', say: "Why should we trust anything you tell us?" },
    { by: 'a', say: "Because I'm here now. My old tribe isn't." },
    { by: 'b', conf: "Fair point." },
  ] },
  { id: 'id.i5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Honestly, I liked everyone over there." },
    { by: 'b', say: "Everyone?" },
    { by: 'a', say: "Okay, not everyone. Want to know who I didn't like?" },
  ] },
  { id: 'id.i6', turns: [
    { beat: '{a} drops one piece of news from the old camp at dinner, casually, like it doesn\'t matter.' },
    { by: 'b', say: "Wait. Say that again." },
    { by: 'a', conf: "It matters. That's why I said it." },
  ] },
];

const MERGE_NEWS = [
  { id: 'id.m1', turns: [
    { by: 'a', say: "One tribe. Can you believe it?" },
    { by: 'b', say: "Everybody's acting like they're fine." },
    { by: 'a', say: "Nobody is fine." },
  ] },
  { id: 'id.m2', turns: [
    { by: 'b', say: "So I guess we're all friends now." },
    { by: 'a', say: "Sure. Friends who are going to vote each other out." },
  ] },
  { id: 'id.m3', turns: [
    { beat: 'The buffs come off. {a} and {b} watch everyone pretend to start fresh.' },
    { by: 'a', say: "Nobody's actually starting fresh, right?" },
    { by: 'b', say: "Not a single person." },
  ] },
  { id: 'id.m4', turns: [
    { by: 'a', say: "{count} of us. One fire." },
    { by: 'b', say: "And one winner." },
    { by: 'a', say: "Yeah. That part." },
  ] },
  { id: 'id.m5', when: { band: 'friends' }, turns: [
    { by: 'a', say: "We finally get to hang out every day!" },
    { by: 'b', say: "And vote together." },
    { by: 'a', say: "And vote together. Best day ever." },
  ] },
  { id: 'id.m6', when: { band: 'enemies' }, turns: [
    { by: 'a', say: "Oh good. You're here." },
    { by: 'b', say: "Where else would I be? We live together now." },
    { by: 'a', conf: "Great. Love that." },
  ] },
];

const MERGE_SCRAMBLE = [
  { id: 'id.r1', turns: [
    { by: 'a', say: "Walk with me." },
    { by: 'b', say: "Where?" },
    { by: 'a', say: "Anywhere nobody else is." },
  ] },
  { id: 'id.r2', turns: [
    { by: 'a', say: "Okay, real talk. Where do you stand?" },
    { by: 'b', say: "Where do YOU stand?" },
    { by: 'a', say: "I asked first." },
    { by: 'b', conf: "Everybody's asking. Nobody's answering." },
  ] },
  { id: 'id.r3', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Old alliance or not, it's you and me. Agreed?" },
    { by: 'b', say: "Agreed. Who else?" },
    { by: 'a', say: "That's the question for today." },
  ] },
  { id: 'id.r4', turns: [
    { by: 'b', say: "You've talked to like six people already." },
    { by: 'a', say: "Seven. You're seven." },
  ] },
  { id: 'id.r5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Everybody's pulling people aside. Let's be the people they pull aside." },
    { by: 'b', say: "What does that even mean?" },
    { by: 'a', say: "It means we listen, and we don't promise anything." },
  ] },
  { id: 'id.r6', when: { band: 'neutral' }, turns: [
    { by: 'a', say: "We never really got to talk before." },
    { by: 'b', say: "We were on different tribes." },
    { by: 'a', say: "Not anymore. So. Let's talk." },
  ] },
];

const MERGE_PLAN = [
  { id: 'id.p1', turns: [
    { by: 'a', conf: "I've been waiting for this since day one. Watch who groups up with who. That's all you need to know." },
  ] },
  { id: 'id.p2', turns: [
    { by: 'a', conf: "I already know who needs to go next. The merge is just when the plan starts." },
  ] },
  { id: 'id.p3', turns: [
    { beat: '{a} walks into merge camp and starts counting heads.' },
    { by: 'a', conf: "Everybody's celebrating. I'm counting." },
  ] },
  { id: 'id.p4', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "New camp, new people. Nobody knows anything about me. That might be the best thing that's happened to me all game." },
  ] },
  { id: 'id.p5', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "Individual immunity. Finally. No more carrying anybody. It's just me now." },
  ] },
  { id: 'id.p6', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Half these people I've never even talked to. Half of the other half I don't like. This is going to be great." },
  ] },
  { id: 'id.p7', turns: [
    { by: 'a', conf: "This is where the game actually starts. Everything before was practice." },
  ] },
];

export default {
  'idol.confide.any': CONFIDE, 'idol.leak.any': LEAK, 'idol.snoop.caught': SNOOP_CAUGHT, 'idol.snoop.clean': SNOOP_CLEAN,
  'idol.tip.any': TIP, 'idol.intel.any': INTEL,
  'merge.news.any': MERGE_NEWS, 'merge.scramble.any': MERGE_SCRAMBLE, 'merge.plan.any': MERGE_PLAN,
};

/** Data these scenes always carry. */
export const GUARANTEED = { 'idol.leak.any': ['target'], 'idol.snoop.clean': ['target'], 'idol.tip.any': ['target'] };
