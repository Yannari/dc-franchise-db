// ══════════════════════════════════════════════════════════════════════
// td/script/lines/ends.js — info trades, alliances ending, expulsions, reputations
// ══════════════════════════════════════════════════════════════════════
//
// trade.info.<idol|plans|general> — {a} trades {b} information for trust.
//   'idol': {holder} has an advantage; 'plans': what {a}'s own alliance, {group},
//   is planning; 'general': a read on the camp. result 'false': the tip is a
//   lie, and only {a}'s confessional admits it.
// alliance.end.<betrayal|collapsed|both> — two members of {group} admit it's
//   over. 'betrayal': someone broke rank ({betrayer}, when known); 'collapsed':
//   nobody likes each other any more; 'both'.
// alliance.endsolo.<last|betrayal|collapsed|both> — {a} alone with the camera
//   ('last': everyone else from {group} has gone home).
// alliance.expel.<voted|repeated> — {a} tells {b} {b.sub}'s out of {group}.
//   'voted': {b} voted against one of them; 'repeated': {b} kept breaking rank.
// alliance.expelsolo.<voted|repeated> — nobody from {group} is here to say it;
//   {a}, the one cut, tells the camera.
// rep.label.<label> — {a} tells the camera what {a.sub}'s noticed about {b}:
//   dependable, unreliable, persuasive, leaky, discreet, controlling, deceptive.
// Ids: 'en.'.
const T = { result: 'true' }, F = { result: 'false' };

const TRADE_IDOL = [
  { id: 'en.i1', when: T, turns: [
    { by: 'a', say: "I'm going to tell you something, and then you're going to owe me." },
    { by: 'b', say: "That's how it works, is it?" },
    { by: 'a', say: "That's how it works. {holder} has an idol." },
    { by: 'b', say: "Seriously? How do you know?" },
    { by: 'a', say: "I just do. Now you do too." },
  ] },
  { id: 'en.i2', when: T, turns: [
    { by: 'a', say: "Want to know something nobody else knows?" },
    { by: 'b', say: "Always." },
    { by: 'a', say: "Watch {holder}. {holder} found something." },
    { by: 'b', say: "An idol?" },
    { by: 'a', say: "I didn't say that. But yes." },
  ] },
  { id: 'en.i3', when: T, turns: [
    { beat: '{a} waits until {b} is alone, then leans in close.' },
    { by: 'a', say: "{holder}'s got an idol. I saw it." },
    { by: 'b', say: "Why are you telling me?" },
    { by: 'a', say: "Because I trust you. And because I'd like you to trust me back." },
  ] },
  { id: 'en.i4', when: F, turns: [
    { by: 'a', say: "Promise not to tell anyone? {holder} has an idol." },
    { by: 'b', say: "No way. {holder}?" },
    { by: 'a', say: "Yep. Keep an eye on {holder}." },
    { by: 'a', conf: "{holder} doesn't have anything. But now {b} is going to waste a lot of time watching the wrong person." },
  ] },
  { id: 'en.i5', when: F, turns: [
    { by: 'a', say: "Between us? {holder} found an idol." },
    { by: 'b', say: "That changes everything." },
    { by: 'a', say: "I know. That's why I'm telling you." },
    { by: 'a', conf: "It changes everything, all right. Just not the way {b} thinks. {holder} has nothing." },
  ] },
  { id: 'en.i6', when: F, turns: [
    { by: 'a', say: "I saw {holder} digging near camp. Came back with something in {holder.posAdj} pocket." },
    { by: 'b', say: "An idol?" },
    { by: 'a', say: "What else would it be?" },
    { by: 'a', conf: "I didn't see anything. But {b} won't be looking at me for a while." },
  ] },
];
const TRADE_PLANS = [
  { id: 'en.p1', when: T, turns: [
    { by: 'a', say: "I shouldn't be telling you this. But {group} is planning something." },
    { by: 'b', say: "Planning what?" },
    { by: 'a', say: "Let's just say you don't want to be on the wrong side of it." },
    { by: 'b', say: "Why are you telling me?" },
    { by: 'a', say: "Because I'd rather have you owing me than hating me." },
  ] },
  { id: 'en.p2', when: T, turns: [
    { by: 'a', say: "You want to know what {group} talks about when you're not around?" },
    { by: 'b', say: "Obviously." },
    { by: 'a', say: "Numbers. Who's in, who's out. You're not out. Yet." },
    { by: 'b', say: "Thanks for the heads-up. I mean it." },
  ] },
  { id: 'en.p3', when: T, turns: [
    { beat: '{a} pulls {b} away from the others.' },
    { by: 'a', say: "This stays between us. {group} has a list." },
    { by: 'b', say: "Am I on it?" },
    { by: 'a', say: "Not near the top. Keep it that way, and keep being nice to me." },
  ] },
  { id: 'en.p4', when: F, turns: [
    { by: 'a', say: "Okay, inside information. {group} is coming for you next." },
    { by: 'b', say: "What? Why?" },
    { by: 'a', say: "I don't know. But I thought you should know." },
    { by: 'a', conf: "{group} hasn't said a word about {b}. But a scared {b} is a {b} who votes my way." },
  ] },
  { id: 'en.p5', when: F, turns: [
    { by: 'a', say: "Don't tell anyone I said this, but {group} is splitting up." },
    { by: 'b', say: "Seriously?" },
    { by: 'a', say: "Seriously. You might want to think about where you'll land." },
    { by: 'a', conf: "{group} is fine. I just need {b} to think there's a gap I can pull {b} into." },
  ] },
  { id: 'en.p6', when: F, turns: [
    { by: 'a', say: "{group} thinks you're the easiest vote in the game." },
    { by: 'b', say: "That's harsh." },
    { by: 'a', say: "I don't agree with them. That's why I'm telling you." },
    { by: 'a', conf: "Nobody in {group} said that. But {b} likes me a lot more now." },
  ] },
];
const TRADE_GENERAL = [
  { id: 'en.g1', when: T, turns: [
    { by: 'a', say: "Can I give you some free advice?" },
    { by: 'b', say: "Nothing's free out here." },
    { by: 'a', say: "Fair. Then it's cheap advice. Watch who sits together at dinner. That's the real vote." },
    { by: 'b', say: "Huh. Okay. Thanks." },
  ] },
  { id: 'en.g2', when: T, turns: [
    { by: 'a', say: "I'll tell you what I know if you tell me what you know." },
    { by: 'b', say: "You first." },
    { by: 'a', say: "Fine. People are more nervous than they look. A lot more." },
    { by: 'b', say: "That's it?" },
    { by: 'a', say: "Your turn." },
  ] },
  { id: 'en.g3', when: T, turns: [
    { by: 'a', say: "Want my honest read on the camp?" },
    { by: 'b', say: "Go on." },
    { by: 'a', say: "Everybody thinks they're in the majority. Most of them are wrong." },
    { by: 'b', say: "Are we wrong?" },
    { by: 'a', say: "Not if we stick together." },
  ] },
  { id: 'en.g4', when: F, turns: [
    { by: 'a', say: "Heads up. The vote's already decided, and it isn't you." },
    { by: 'b', say: "Really? That's a relief." },
    { by: 'a', say: "Just keep quiet and you'll be fine." },
    { by: 'a', conf: "Nothing's decided. But a relaxed {b} isn't out there making deals with anyone else." },
  ] },
  { id: 'en.g5', when: F, turns: [
    { by: 'a', say: "I heard everyone's really happy with you right now." },
    { by: 'b', say: "Wait, really?" },
    { by: 'a', say: "Totally. You're safe. Relax." },
    { by: 'a', conf: "I have no idea what everyone thinks of {b}. But it keeps {b} from asking around." },
  ] },
  { id: 'en.g6', when: F, turns: [
    { by: 'a', say: "Don't trust the quiet ones. They're the ones running everything." },
    { by: 'b', say: "Which quiet ones?" },
    { by: 'a', say: "All of them." },
    { by: 'a', conf: "I'm one of the quiet ones. Now {b} is looking at everyone except me." },
  ] },
];

const END_BETRAYAL = [
  { id: 'en.b1', turns: [
    { by: 'a', say: "So that's it, then. {group} is done." },
    { by: 'b', say: "It was done the second somebody broke rank." },
    { by: 'a', say: "I really thought we had something." },
    { by: 'b', say: "So did I." },
  ] },
  { id: 'en.b2', when: { betrayer: true }, turns: [
    { by: 'a', say: "{betrayer}. I still can't believe it." },
    { by: 'b', say: "I can. Should've seen it coming." },
    { by: 'a', say: "Well, {group} is finished. Thanks to {betrayer}." },
    { by: 'b', say: "It's everyone for themselves now." },
  ] },
  { id: 'en.b3', turns: [
    { by: 'b', say: "Do we even bother pretending anymore?" },
    { by: 'a', say: "No. {group} is over. One vote killed it." },
    { by: 'b', say: "We were good for a while." },
    { by: 'a', say: "For a while." },
  ] },
  { id: 'en.b4', when: { betrayer: true }, turns: [
    { by: 'a', say: "If {betrayer} hadn't flipped, we'd still be together." },
    { by: 'b', say: "Doesn't matter now. {group}'s gone." },
    { by: 'a', say: "It matters to me." },
  ] },
  { id: 'en.b5', turns: [
    { by: 'a', say: "Are we still {group}?" },
    { by: 'b', say: "After last night? There's no {group}." },
    { by: 'a', say: "Yeah. I figured." },
    { beat: 'Neither of them knows what to say after that.' },
  ] },
  { id: 'en.b6', turns: [
    { by: 'a', conf: "{group} didn't survive the vote. Somebody broke it, and now it's every person for themselves." },
    { by: 'b', say: "You okay?" },
    { by: 'a', say: "I will be." },
  ] },
];
const END_COLLAPSED = [
  { id: 'en.c1', turns: [
    { by: 'a', say: "Let's be honest. We can't stand each other anymore." },
    { by: 'b', say: "Speak for yourself." },
    { by: 'a', say: "Fine. You can't stand me, and I can't stand you." },
    { by: 'b', say: "...Yeah, okay. {group}'s done." },
  ] },
  { id: 'en.c2', turns: [
    { by: 'b', say: "When did {group} stop being a thing?" },
    { by: 'a', say: "Probably around the time we stopped talking to each other." },
    { by: 'b', say: "That was days ago." },
    { by: 'a', say: "Exactly." },
  ] },
  { id: 'en.c3', turns: [
    { by: 'a', say: "Should we call it? {group}, I mean." },
    { by: 'b', say: "We should've called it a week ago." },
    { by: 'a', say: "Okay. It's called." },
  ] },
  { id: 'en.c4', turns: [
    { by: 'a', say: "Remember when we all actually liked each other?" },
    { by: 'b', say: "Barely." },
    { by: 'a', say: "Yeah. {group} doesn't really mean anything now, does it?" },
    { by: 'b', say: "Not really." },
  ] },
  { id: 'en.c5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm done pretending we're a team!" },
    { by: 'b', say: "Good! Me too!" },
    { by: 'a', say: "Great! {group} is officially over!" },
  ] },
  { id: 'en.c6', turns: [
    { by: 'a', conf: "{group} isn't an alliance anymore. It's just a name for people who used to get along." },
    { by: 'b', say: "Are you talking about us?" },
    { by: 'a', say: "Who else?" },
  ] },
];
const END_BOTH = [
  { id: 'en.o1', turns: [
    { by: 'a', say: "Too many betrayals. Not enough trust. {group} is done." },
    { by: 'b', say: "You don't have to tell me twice." },
  ] },
  { id: 'en.o2', turns: [
    { by: 'b', say: "How many times has somebody flipped on us now?" },
    { by: 'a', say: "I stopped counting." },
    { by: 'b', say: "Then I think {group} is finished." },
    { by: 'a', say: "I think it finished a while ago." },
  ] },
  { id: 'en.o3', turns: [
    { by: 'a', say: "Every vote, somebody breaks rank. Every day, we like each other less." },
    { by: 'b', say: "So what are you saying?" },
    { by: 'a', say: "I'm saying there's no {group} anymore." },
  ] },
  { id: 'en.o4', when: { betrayer: true }, turns: [
    { by: 'a', say: "{betrayer} flipped. Again. I'm done." },
    { by: 'b', say: "Done with {betrayer}?" },
    { by: 'a', say: "Done with {group}. All of it." },
  ] },
  { id: 'en.o5', turns: [
    { by: 'a', say: "{group} isn't working." },
    { by: 'b', say: "It hasn't worked for a while." },
    { by: 'a', say: "Then let's stop pretending it does." },
    { by: 'b', say: "Fine by me." },
  ] },
  { id: 'en.o6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I really wanted {group} to work." },
    { by: 'b', say: "Me too. But too much happened." },
    { by: 'a', say: "Yeah. I know." },
  ] },
];
const SOLO_LAST = [
  { id: 'en.l1', turns: [
    { by: 'a', conf: "Everyone else from {group} is gone. It's just me now." },
    { by: 'a', conf: "An alliance of one isn't really an alliance, is it?" },
  ] },
  { id: 'en.l2', turns: [
    { by: 'a', conf: "I'm the last one left from {group}. I keep thinking about the others." },
  ] },
  { id: 'en.l3', turns: [
    { by: 'a', conf: "{group} got picked off one by one. And I'm still here. I don't know if that makes me lucky or next." },
  ] },
  { id: 'en.l4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "They took out everyone from {group}. Everyone except me. Big mistake." },
  ] },
  { id: 'en.l5', turns: [
    { by: 'a', conf: "I used to have {group}. Now I just have me. Time to make some new friends." },
  ] },
  { id: 'en.l6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I miss {group}. I miss all of them. I'm going to do this for them." },
  ] },
];
const SOLO_BETRAYAL = [
  { id: 'en.sb1', turns: [
    { by: 'a', conf: "{group} is dead. Somebody broke it, and it isn't coming back." },
  ] },
  { id: 'en.sb2', when: { betrayer: true }, turns: [
    { by: 'a', conf: "{betrayer} ended {group}. I hope {betrayer} thinks it was worth it." },
  ] },
  { id: 'en.sb3', turns: [
    { by: 'a', conf: "One vote, and {group} is over. Just like that." },
  ] },
  { id: 'en.sb4', turns: [
    { by: 'a', conf: "I trusted {group}. Somebody in it didn't trust me back. Lesson learned." },
  ] },
  { id: 'en.sb5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Somebody blew up {group}, and I am going to find out who." },
  ] },
  { id: 'en.sb6', turns: [
    { by: 'a', conf: "No more {group}. I'm on my own now. I don't love it." },
  ] },
];
const SOLO_COLLAPSED = [
  { id: 'en.sc1', turns: [
    { by: 'a', conf: "{group} just sort of... stopped. Nobody talks anymore." },
  ] },
  { id: 'en.sc2', turns: [
    { by: 'a', conf: "We were {group}. Now we're just people who used to sit together." },
  ] },
  { id: 'en.sc3', turns: [
    { by: 'a', conf: "I can't even remember the last time {group} actually agreed on something." },
  ] },
  { id: 'en.sc4', turns: [
    { by: 'a', conf: "{group} fell apart without anybody even trying to break it. That's kind of sad." },
  ] },
  { id: 'en.sc5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Honestly? Good riddance to {group}. Nobody liked anybody anyway." },
  ] },
  { id: 'en.sc6', turns: [
    { by: 'a', conf: "{group} is over. Nobody said it out loud. We all just know." },
  ] },
];
const SOLO_BOTH = [
  { id: 'en.so1', turns: [
    { by: 'a', conf: "Betrayal after betrayal. {group} never stood a chance." },
  ] },
  { id: 'en.so2', turns: [
    { by: 'a', conf: "{group} is gone. Too many flips, not enough trust." },
  ] },
  { id: 'en.so3', when: { betrayer: true }, turns: [
    { by: 'a', conf: "{betrayer} flipped, and the rest of us couldn't stand each other anyway. {group} is done." },
  ] },
  { id: 'en.so4', turns: [
    { by: 'a', conf: "I don't even know when {group} died. I just know it's dead." },
  ] },
  { id: 'en.so5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{group} was useful for a while. Now it isn't. Moving on." },
  ] },
  { id: 'en.so6', turns: [
    { by: 'a', conf: "So much for {group}. On to the next thing." },
  ] },
];

const EXPEL_VOTED = [
  { id: 'en.x1', turns: [
    { by: 'a', say: "We need to talk. Actually, I need to talk. You need to listen." },
    { by: 'b', say: "Okay..." },
    { by: 'a', say: "You voted against one of us. You're out of {group}." },
    { by: 'b', say: "You can't just—" },
    { by: 'a', say: "We already did." },
  ] },
  { id: 'en.x2', turns: [
    { by: 'b', say: "Why is everyone looking at me like that?" },
    { by: 'a', say: "Because of your vote. {group} talked this morning." },
    { by: 'b', say: "Without me?" },
    { by: 'a', say: "About you. You're out." },
  ] },
  { id: 'en.x3', turns: [
    { by: 'a', say: "Don't bother coming to the next {group} meeting." },
    { by: 'b', say: "What? Why?" },
    { by: 'a', say: "You know why. You wrote one of our names." },
    { beat: "{b} opens {b.posAdj} mouth, then shuts it." },
  ] },
  { id: 'en.x4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You voted against us! You're OUT!" },
    { by: 'b', say: "It was one vote!" },
    { by: 'a', say: "One vote too many! Bye!" },
  ] },
  { id: 'en.x5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I'll keep this short. {group} doesn't work with people who vote against us." },
    { by: 'b', say: "So I'm out." },
    { by: 'a', say: "You're out." },
  ] },
  { id: 'en.x6', turns: [
    { by: 'a', say: "Can I be honest? Nobody in {group} trusts you anymore." },
    { by: 'b', say: "Because of one vote?" },
    { by: 'a', say: "Because of that vote. You're on your own now." },
  ] },
  { id: 'en.x7', turns: [
    { beat: '{a} finds {b} at breakfast and does not sit down.' },
    { by: 'a', say: "Enjoy your breakfast. Alone. You're not in {group} anymore." },
    { by: 'b', say: "Seriously? Over last night?" },
    { by: 'a', say: "Over last night." },
  ] },
  { id: 'en.x8', turns: [
    { by: 'b', say: "Hey! Did I miss the {group} meeting?" },
    { by: 'a', say: "You didn't miss it. You weren't invited." },
    { by: 'b', say: "What? Why not?" },
    { by: 'a', say: "Check your last ballot." },
  ] },
  { id: 'en.x9', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll be honest, because you weren't. You're out of {group}." },
    { by: 'b', say: "That's not—" },
    { by: 'a', say: "You voted against one of us. We don't keep people who do that." },
  ] },
  { id: 'en.x10', turns: [
    { by: 'a', say: "Sit down. This won't take long." },
    { by: 'b', say: "That's never a good start." },
    { by: 'a', say: "You wrote one of our names. {group} is done with you." },
    { by: 'b', say: "Wow. Okay." },
  ] },
  { id: 'en.x11', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm so sorry. The others decided. You're not in {group} anymore." },
    { by: 'b', say: "Because of the vote?" },
    { by: 'a', say: "Because of the vote. I tried. I really did." },
  ] },
];
const EXPEL_REPEATED = [
  { id: 'en.r1', turns: [
    { by: 'a', say: "This isn't the first time. And we're making sure it's the last." },
    { by: 'b', say: "What are you talking about?" },
    { by: 'a', say: "You're out of {group}. You've broken rank too many times." },
  ] },
  { id: 'en.r2', turns: [
    { by: 'b', say: "Is there a {group} meeting? Nobody told me." },
    { by: 'a', say: "Nobody told you because you're not in it anymore." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since the last time you went off on your own. And the time before that." },
  ] },
  { id: 'en.r3', turns: [
    { by: 'a', say: "We gave you chances. Plural." },
    { by: 'b', say: "I know, I know—" },
    { by: 'a', say: "No more chances. You're done with {group}." },
  ] },
  { id: 'en.r4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "How many times did you think we'd let you get away with it?!" },
    { by: 'b', say: "I can explain!" },
    { by: 'a', say: "You've explained! Three times! Get out of {group}!" },
  ] },
  { id: 'en.r5', turns: [
    { by: 'a', say: "{group} took a vote. Well, a conversation. You're out." },
    { by: 'b', say: "That's not fair." },
    { by: 'a', say: "You stopped playing fair a long time ago." },
  ] },
  { id: 'en.r6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I hate doing this. But {group} can't keep you anymore." },
    { by: 'b', say: "Not even you?" },
    { by: 'a', say: "I'm sorry. Not even me." },
  ] },
];
const EXPELSOLO_VOTED = [
  { id: 'en.y1', turns: [
    { by: 'a', conf: "Apparently, I'm out of {group}. Because of one vote." },
    { by: 'a', conf: "Fine. I didn't need them anyway. I think." },
  ] },
  { id: 'en.y2', turns: [
    { by: 'a', conf: "{group} kicked me out. Nobody even said it to my face." },
  ] },
  { id: 'en.y3', turns: [
    { by: 'a', conf: "I voted the way I thought was right. Now I don't have an alliance. Worth it? Ask me next week." },
  ] },
  { id: 'en.y4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "They threw me out of {group}? Over ONE vote? Wow. Okay. Noted." },
  ] },
  { id: 'en.y5', turns: [
    { by: 'a', conf: "I'm not in {group} anymore. It's weird. I didn't think it'd bother me this much." },
  ] },
  { id: 'en.y6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Out of {group}. Fine. Now I don't owe any of them anything." },
  ] },
];
const EXPELSOLO_REPEATED = [
  { id: 'en.z1', turns: [
    { by: 'a', conf: "{group} cut me loose. I guess I pushed it one too many times." },
  ] },
  { id: 'en.z2', turns: [
    { by: 'a', conf: "I'm out of {group}. I'm not going to pretend I didn't see it coming." },
  ] },
  { id: 'en.z3', turns: [
    { by: 'a', conf: "I kept doing my own thing. {group} got sick of it. Fair enough." },
  ] },
  { id: 'en.z4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "So {group} doesn't want me? Their loss. Seriously, their loss." },
  ] },
  { id: 'en.z5', turns: [
    { by: 'a', conf: "No more {group}. I'm a free agent now. Which is a nice way of saying I'm alone." },
  ] },
  { id: 'en.z6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I really let {group} down. I don't blame them for kicking me out." },
  ] },
];

const REP_DEPENDABLE = [
  { id: 'en.d1', turns: [{ by: 'a', conf: "If {b} says {b.sub}'ll do something, {b} does it. Every time. That's rare out here." }] },
  { id: 'en.d2', turns: [{ by: 'a', conf: "{b} has never lied to me. Not once. I'd trust {b} with anything." }] },
  { id: 'en.d3', turns: [{ by: 'a', conf: "Everyone flips eventually. Except {b}. {b} is a rock." }] },
  { id: 'en.d4', turns: [{ by: 'a', conf: "{b} keeps every promise. Which makes {b} the best ally here, and maybe the most dangerous at the end." }] },
  { id: 'en.d5', turns: [{ by: 'a', conf: "If I had to pick one person to have my back, it'd be {b}. No question." }] },
  { id: 'en.d6', turns: [{ by: 'a', conf: "{b} votes how {b} says {b} will vote. I didn't know people still did that." }] },
];
const REP_UNRELIABLE = [
  { id: 'en.u1', turns: [{ by: 'a', conf: "{b} says one thing and does another. Every single time." }] },
  { id: 'en.u2', turns: [{ by: 'a', conf: "I wouldn't trust {b} to hold my water bottle, let alone my vote." }] },
  { id: 'en.u3', turns: [{ by: 'a', conf: "{b} has flipped so many times I've stopped keeping track." }] },
  { id: 'en.u4', turns: [{ by: 'a', conf: "Whatever {b} promises you, assume the opposite. That's my advice." }] },
  { id: 'en.u5', turns: [{ by: 'a', conf: "{b} is a vote you can never count on. And everybody knows it now." }] },
  { id: 'en.u6', turns: [{ by: 'a', conf: "Making a deal with {b} is pointless. {b} will change {b.posAdj} mind by lunch." }] },
];
const REP_PERSUASIVE = [
  { id: 'en.s1', turns: [{ by: 'a', conf: "When {b} pitches something, people listen. That scares me a bit." }] },
  { id: 'en.s2', turns: [{ by: 'a', conf: "{b} could talk anybody into anything. I've watched it happen twice now." }] },
  { id: 'en.s3', turns: [{ by: 'a', conf: "Every plan {b} has put forward has happened. That's not luck." }] },
  { id: 'en.s4', turns: [{ by: 'a', conf: "{b} talks, and the whole camp moves. I need {b} on my side, or gone." }] },
  { id: 'en.s5', turns: [{ by: 'a', conf: "I don't know how {b} does it, but when {b} wants a name, {b} gets the votes." }] },
  { id: 'en.s6', turns: [{ by: 'a', conf: "{b} is very, very good at getting people to agree. Too good." }] },
];
const REP_LEAKY = [
  { id: 'en.k1', turns: [{ by: 'a', conf: "Tell {b} a secret, and the whole camp knows by dinner." }] },
  { id: 'en.k2', turns: [{ by: 'a', conf: "{b} can't keep anything to {b.ref}. I'm not telling {b} anything ever again." }] },
  { id: 'en.k3', turns: [{ by: 'a', conf: "Every plan we've made with {b} in the room has leaked. Every one." }] },
  { id: 'en.k4', turns: [{ by: 'a', conf: "{b} is lovely. {b} also has a really big mouth." }] },
  { id: 'en.k5', turns: [{ by: 'a', conf: "If you want something kept quiet, don't tell {b}. That's rule number one out here." }] },
  { id: 'en.k6', turns: [{ by: 'a', conf: "I told {b} one thing yesterday. Three people asked me about it this morning." }] },
];
const REP_DISCREET = [
  { id: 'en.q1', turns: [{ by: 'a', conf: "You can tell {b} anything. It goes in and it never comes out." }] },
  { id: 'en.q2', turns: [{ by: 'a', conf: "{b} knows more than anyone here, and nobody even realises it." }] },
  { id: 'en.q3', turns: [{ by: 'a', conf: "{b} has never leaked a single thing. That's why everybody tells {b} everything." }] },
  { id: 'en.q4', turns: [{ by: 'a', conf: "Want a secret kept? Tell {b}. It won't go anywhere." }] },
  { id: 'en.q5', turns: [{ by: 'a', conf: "{b} keeps everything close. I respect that. I'm also a little scared of it." }] },
  { id: 'en.q6', turns: [{ by: 'a', conf: "I trust {b} with my plans. {b} has earned that." }] },
];
const REP_CONTROLLING = [
  { id: 'en.c7', turns: [{ by: 'a', conf: "Every plan around here seems to be {b}'s plan. When did that happen?" }] },
  { id: 'en.c8', turns: [{ by: 'a', conf: "{b} is running things. Nobody voted for that. It just happened." }] },
  { id: 'en.c9', turns: [{ by: 'a', conf: "If {b} decides who's going, that's who's going. I'm getting tired of it." }] },
  { id: 'en.c10', turns: [{ by: 'a', conf: "{b} acts like the boss. Somebody needs to remind {b} that nobody voted for that." }] },
  { id: 'en.c11', turns: [{ by: 'a', conf: "Two votes in a row went exactly how {b} wanted. That's a pattern." }] },
  { id: 'en.c12', turns: [{ by: 'a', conf: "{b} has this place wrapped around {b.posAdj} finger. And it's working." }] },
];
const REP_DECEPTIVE = [
  { id: 'en.v1', turns: [{ by: 'a', conf: "{b} lies. Smoothly. Constantly. I've caught {b.obj} twice now." }] },
  { id: 'en.v2', turns: [{ by: 'a', conf: "Nothing {b} says is the whole truth. I've stopped believing any of it." }] },
  { id: 'en.v3', turns: [{ by: 'a', conf: "{b} told me one thing and told someone else the exact opposite. Same day." }] },
  { id: 'en.v4', turns: [{ by: 'a', conf: "{b} is a snake. A very charming snake. But a snake." }] },
  { id: 'en.v5', turns: [{ by: 'a', conf: "Everyone's starting to figure out {b}. Took them long enough." }] },
  { id: 'en.v6', turns: [{ by: 'a', conf: "If {b} is smiling at you, watch your back." }] },
];

export default {
  'trade.info.idol': TRADE_IDOL,
  'trade.info.plans': TRADE_PLANS,
  'trade.info.general': TRADE_GENERAL,
  'alliance.end.betrayal': END_BETRAYAL,
  'alliance.end.collapsed': END_COLLAPSED,
  'alliance.end.both': END_BOTH,
  'alliance.endsolo.last': SOLO_LAST,
  'alliance.endsolo.betrayal': SOLO_BETRAYAL,
  'alliance.endsolo.collapsed': SOLO_COLLAPSED,
  'alliance.endsolo.both': SOLO_BOTH,
  'alliance.expel.voted': EXPEL_VOTED,
  'alliance.expel.repeated': EXPEL_REPEATED,
  'alliance.expelsolo.voted': EXPELSOLO_VOTED,
  'alliance.expelsolo.repeated': EXPELSOLO_REPEATED,
  'rep.label.dependable': REP_DEPENDABLE,
  'rep.label.unreliable': REP_UNRELIABLE,
  'rep.label.persuasive': REP_PERSUASIVE,
  'rep.label.leaky': REP_LEAKY,
  'rep.label.discreet': REP_DISCREET,
  'rep.label.controlling': REP_CONTROLLING,
  'rep.label.deceptive': REP_DECEPTIVE,
};

export const GUARANTEED = {
  'trade.info.idol': ['holder'],
  'trade.info.plans': ['group'],
  ...Object.fromEntries(['alliance.end.betrayal', 'alliance.end.collapsed', 'alliance.end.both', 'alliance.endsolo.last',
    'alliance.endsolo.betrayal', 'alliance.endsolo.collapsed', 'alliance.endsolo.both', 'alliance.expel.voted',
    'alliance.expel.repeated', 'alliance.expelsolo.voted', 'alliance.expelsolo.repeated'].map(k => [k, ['group']])),
};
