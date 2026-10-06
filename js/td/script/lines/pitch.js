// ══════════════════════════════════════════════════════════════════════
// td/script/lines/pitch.js — a vote pitch going round camp (episode.js votePitches)
// ══════════════════════════════════════════════════════════════════════
//
// Written in parts, in this order:
//   pitch.react.<tone>   — {a} pitches {target} to {b} ("I've got {claimed}
//     votes"), and {b} answers the way the engine decided (voting.js
//     describePitchReaction): receptive, uncertain, numbers-focused (does it
//     help me?), guarded (back to the plan already in place), cold (defends
//     {target}), skeptical (doubts the numbers), distracted (busy with another
//     plan), unreceptive. Nobody promises a vote.
//   pitch.warn.<believed|doubted> — {a}, who heard the pitch, tells {b} — the
//     target — that {pitcher} is coming for {b}.
//   pitch.counter.<type> — {a}, the target, to the camera: watched-carefully,
//     confrontation, warned-allies, deceptive-counter, counter-coalition.
//   pitch.read.<landed|stalled> — {a}, the pitcher, to the camera.
// This camp votes tonight. Ids: 'pt.'.
const REACT_RECEPTIVE = [
  { id: 'pt.r1', turns: [
    { by: 'a', say: "I'll keep it quick. {target}. Tonight. I've got {claimed} votes already." },
    { by: 'b', say: "{target}? Okay. Who's in?" },
    { by: 'a', say: "Enough. And you'd make it a lock." },
    { by: 'b', say: "Let me think about it. But I'm not saying no." },
  ] },
  { id: 'pt.r2', turns: [
    { beat: '{a} finds {b} alone and doesn\'t waste any time.' },
    { by: 'a', say: "What do you think about {target} going tonight?" },
    { by: 'b', say: "Honestly? I've thought about it." },
    { by: 'a', say: "Then stop thinking and start voting. I've got {claimed} on board." },
    { by: 'b', say: "Okay. Tell me more." },
  ] },
  { id: 'pt.r3', turns: [
    { by: 'a', say: "Can I run something by you? {target}." },
    { by: 'b', say: "Go on. I'm listening." },
    { by: 'a', say: "It's {claimed} of us so far. You'd be the one who makes it happen." },
    { by: 'b', say: "Who else knows?" },
    { by: 'a', say: "Just the people who need to." },
  ] },
  { id: 'pt.r4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's the plan. {target} goes tonight, and nobody sees it coming." },
    { by: 'b', say: "I like plans where nobody sees it coming." },
    { by: 'a', say: "I knew you would. {claimed} votes and counting." },
    { by: 'b', say: "Keep counting. I'll let you know." },
  ] },
  { id: 'pt.r5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "{target}. Tonight. Are you in or what?" },
    { by: 'b', say: "Whoa. Slow down. Who's in already?" },
    { by: 'a', say: "{claimed} of us! Come on, it's perfect!" },
    { by: 'b', say: "Okay, okay. It's not a bad idea. Let me think." },
  ] },
  { id: 'pt.r6', when: { band: 'friends' }, turns: [
    { by: 'a', say: "You trust me, right?" },
    { by: 'b', say: "Mostly. Why?" },
    { by: 'a', say: "Because I want {target} gone tonight, and I want you with me." },
    { by: 'b', say: "If you've really got the numbers, I'm listening." },
    { by: 'a', say: "{claimed}, and growing." },
  ] },
];
const REACT_UNCERTAIN = [
  { id: 'pt.u1', turns: [
    { by: 'a', say: "I'm thinking {target} tonight. You with me?" },
    { by: 'b', say: "Maybe. I don't know. I need to hear what everyone else is saying." },
    { by: 'a', say: "I've got {claimed} already." },
    { by: 'b', say: "Okay. Maybe. Let's see." },
  ] },
  { id: 'pt.u2', turns: [
    { by: 'a', say: "{target}. What do you think?" },
    { by: 'b', say: "I think... it's an idea." },
    { by: 'a', say: "Is that a yes?" },
    { by: 'b', say: "It's an 'it's an idea'." },
    { beat: '{a} sighs and moves on.' },
  ] },
  { id: 'pt.u3', turns: [
    { by: 'a', say: "Can I count on you for {target} tonight?" },
    { by: 'b', say: "You can count on me to think about it." },
    { by: 'a', say: "That's not the same thing." },
    { by: 'b', say: "I know. That's on purpose." },
  ] },
  { id: 'pt.u4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Hey. We're thinking {target} tonight. {claimed} of us." },
    { by: 'b', say: "Oh. Um. Okay. I don't really know yet." },
    { by: 'a', say: "Just think about it, okay?" },
    { by: 'b', say: "I will. I promise I'll think about it." },
  ] },
  { id: 'pt.u5', turns: [
    { by: 'a', say: "{target} goes tonight. You in?" },
    { by: 'b', say: "I'm not out." },
    { by: 'a', say: "That's not the same as in." },
    { by: 'b', say: "Then I guess you'll find out when everyone else does." },
  ] },
  { id: 'pt.u6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "{target}. {claimed} votes. You'd make it certain." },
    { by: 'b', say: "I don't decide anything until I've talked to everyone." },
    { by: 'a', say: "And when will that be?" },
    { by: 'b', say: "Right before the vote." },
  ] },
];
const REACT_NUMBERS = [
  { id: 'pt.n1', turns: [
    { by: 'a', say: "{target} tonight. I've got {claimed} votes." },
    { by: 'b', say: "Okay, but what do I get out of it?" },
    { by: 'a', say: "One less threat." },
    { by: 'b', say: "One less threat to you. I'm asking about me." },
  ] },
  { id: 'pt.n2', turns: [
    { by: 'a', say: "Vote {target} with us tonight." },
    { by: 'b', say: "If {target} goes, where does that leave me? Top or bottom?" },
    { by: 'a', say: "Somewhere in the middle?" },
    { by: 'b', say: "The middle is where people get voted out. Let me think about it." },
  ] },
  { id: 'pt.n3', turns: [
    { by: 'a', say: "I'm putting together {claimed} votes for {target}." },
    { by: 'b', say: "And after {target}? Who's next?" },
    { by: 'a', say: "We'll figure that out later." },
    { by: 'b', say: "That's what I'm worried about. Later might be me." },
  ] },
  { id: 'pt.n4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{target}. Tonight. Are you in?" },
    { by: 'b', say: "Walk me through the maths. After tonight, who's got the majority?" },
    { by: 'a', say: "We do." },
    { by: 'b', say: "Who's 'we'? Because I'm not sure I'm in it. I'll think about it." },
  ] },
  { id: 'pt.n5', turns: [
    { by: 'a', say: "{claimed} of us are voting {target}. You should be the next one." },
    { by: 'b', say: "Why should I?" },
    { by: 'a', say: "Because it's the smart move." },
    { by: 'b', say: "For you. I haven't decided if it's smart for me." },
  ] },
  { id: 'pt.n6', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "{target} goes tonight, and we're all safer." },
    { by: 'b', say: "Am I safer? Or am I just the next strong one left?" },
    { by: 'a', say: "Nobody's coming after you." },
    { by: 'b', say: "That's what everyone says before they come after you." },
  ] },
  { id: 'pt.n7', turns: [
    { by: 'a', say: "Help me get {target} out tonight." },
    { by: 'b', say: "And if I do, what happens to me next week?" },
    { by: 'a', say: "You're safe with me." },
    { by: 'b', say: "Everyone's safe with everyone until they're not." },
  ] },
  { id: 'pt.n8', when: { threat: true }, turns: [
    { by: 'a', say: "{target} tonight. You in?" },
    { by: 'b', say: "Why {target} and not {threat}? {threat}'s the one winning everything." },
    { by: 'a', say: "One thing at a time." },
    { by: 'b', say: "That's what worries me." },
  ] },
];
const REACT_GUARDED = [
  { id: 'pt.g1', turns: [
    { by: 'a', say: "What if we went with {target} tonight instead?" },
    { by: 'b', say: "We already have a plan." },
    { by: 'a', say: "Plans change." },
    { by: 'b', say: "Not this one. Not for me." },
  ] },
  { id: 'pt.g2', turns: [
    { by: 'a', say: "Hear me out. {target}." },
    { by: 'b', say: "I've heard you out. I'm sticking with what we agreed." },
    { by: 'a', say: "Even if I've got {claimed} votes?" },
    { by: 'b', say: "Even then." },
  ] },
  { id: 'pt.g3', turns: [
    { by: 'a', say: "Are you sure about tonight? Because {target} is an option." },
    { by: 'b', say: "I'm sure. Changing the plan at the last minute is how people get burned." },
    { by: 'a', say: "Or how people win." },
    { by: 'b', say: "Not this time." },
  ] },
  { id: 'pt.g4', when: { alliance: true }, turns: [
    { by: 'a', say: "Change of plan. What about {target}?" },
    { by: 'b', say: "We agreed as a group. We don't change it without everyone." },
    { by: 'a', say: "I'm everyone. Well, part of everyone." },
    { by: 'b', say: "Then get the rest of everyone. Until then, the plan stays." },
  ] },
  { id: 'pt.g5', turns: [
    { by: 'a', say: "Just think about {target}. That's all I'm asking." },
    { by: 'b', say: "I've thought about it. No." },
    { by: 'a', say: "That was fast." },
    { by: 'b', say: "I already know who I'm voting for." },
  ] },
  { id: 'pt.g6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "{target}. Tonight. Think about it." },
    { by: 'b', say: "No! We have a plan! Stop trying to change it!" },
    { by: 'a', say: "Okay, okay. Calm down." },
    { by: 'b', say: "I AM calm!" },
  ] },
  { id: 'pt.g7', turns: [
    { by: 'a', say: "Just between us, what if it was {target} tonight?" },
    { by: 'b', say: "It isn't. We already decided." },
    { by: 'a', say: "Decisions can change." },
    { by: 'b', say: "Mine don't. Not this close to the vote." },
  ] },
  { id: 'pt.g8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Would you ever vote for {target}?" },
    { by: 'b', say: "I already promised people how I'm voting. I don't want to break a promise." },
    { by: 'a', say: "Even for a better plan?" },
    { by: 'b', say: "Even then. Sorry." },
  ] },
];
const REACT_COLD = [
  { id: 'pt.c1', turns: [
    { by: 'a', say: "I'm thinking {target} tonight." },
    { by: 'b', say: "{target}? No way. {target}'s my friend." },
    { by: 'a', say: "This isn't about friends. It's about the game." },
    { by: 'b', say: "Then the game can find somebody else." },
  ] },
  { id: 'pt.c2', turns: [
    { by: 'a', say: "We've got {claimed} for {target}. You in?" },
    { by: 'b', say: "Absolutely not. And you should leave {target} alone." },
    { by: 'a', say: "Why do you care so much?" },
    { by: 'b', say: "Because {target} would never do this to me." },
  ] },
  { id: 'pt.c3', turns: [
    { by: 'a', say: "What would you say to {target} going home?" },
    { by: 'b', say: "I'd say over my dead body." },
    { by: 'a', say: "That's dramatic." },
    { by: 'b', say: "I mean it. Pick somebody else." },
    { beat: '{b} walks off without waiting for an answer.' },
  ] },
  { id: 'pt.c4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Can we talk about {target}? For tonight?" },
    { by: 'b', say: "Oh, no, please don't. {target}'s the nicest person here." },
    { by: 'a', say: "Nice doesn't win the game." },
    { by: 'b', say: "Well, it's not losing my vote either." },
  ] },
  { id: 'pt.c5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "It's {target} tonight. {claimed} votes." },
    { by: 'b', say: "Over my dead body! Leave {target} out of this!" },
    { by: 'a', say: "Shh! Keep your voice down!" },
    { by: 'b', say: "No! Keep your plans to yourself!" },
  ] },
  { id: 'pt.c6', turns: [
    { by: 'a', say: "{target} has to go. You know that, right?" },
    { by: 'b', say: "I know you think that." },
    { by: 'a', say: "Everyone thinks that." },
    { by: 'b', say: "Not everyone. I don't." },
  ] },
];
const REACT_SKEPTICAL = [
  { id: 'pt.s1', turns: [
    { by: 'a', say: "{target} goes tonight. I've got {claimed} votes." },
    { by: 'b', say: "{claimed}? Name them." },
    { by: 'a', say: "I can't just name them." },
    { by: 'b', say: "Then you don't have {claimed}." },
  ] },
  { id: 'pt.s2', turns: [
    { by: 'a', say: "Trust me, the numbers are there for {target}." },
    { by: 'b', say: "Whose numbers? Because I've talked to people, and nobody said {target}." },
    { by: 'a', say: "They're not going to tell you." },
    { by: 'b', say: "Or they're not going to vote that way." },
  ] },
  { id: 'pt.s3', turns: [
    { by: 'a', say: "It's locked. {target}, {claimed} votes." },
    { by: 'b', say: "If it's locked, why do you need me?" },
    { by: 'a', say: "To make it extra locked." },
    { by: 'b', say: "Right. Sure. That's what that is." },
  ] },
  { id: 'pt.s4', when: { register: 'cool' }, turns: [
    { by: 'a', say: "{claimed} votes for {target}. You make it a sure thing." },
    { by: 'b', say: "I've counted, and I don't get {claimed}." },
    { by: 'a', say: "You're missing people." },
    { by: 'b', say: "Or you're adding people who aren't there." },
  ] },
  { id: 'pt.s5', turns: [
    { by: 'a', say: "Everyone's on board for {target}." },
    { by: 'b', say: "Everyone? Really? Because 'everyone' told me something different an hour ago." },
    { by: 'a', say: "Things change fast." },
    { by: 'b', say: "Apparently." },
  ] },
  { id: 'pt.s6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I've got {claimed} for {target}." },
    { by: 'b', say: "No you don't! Stop making stuff up!" },
    { by: 'a', say: "I'm not making anything up!" },
    { by: 'b', say: "Then show me!" },
  ] },
];
const REACT_DISTRACTED = [
  { id: 'pt.d1', turns: [
    { by: 'a', say: "Have you got a second? It's about {target}." },
    { by: 'b', say: "Not really. I'm kind of in the middle of something." },
    { by: 'a', say: "This is important." },
    { by: 'b', say: "So is my thing. Later, okay?" },
  ] },
  { id: 'pt.d2', turns: [
    { by: 'a', say: "{target}. Tonight. Thoughts?" },
    { by: 'b', say: "Sorry, what? I was listening to the other conversation." },
    { by: 'a', say: "What other conversation?" },
    { by: 'b', say: "Never mind. What did you say?" },
  ] },
  { id: 'pt.d3', turns: [
    { by: 'a', say: "Listen, I'm putting together votes for {target}." },
    { by: 'b', say: "Funny. Somebody else is putting together votes too. Just not for {target}." },
    { by: 'a', say: "Who?" },
    { by: 'b', say: "Can't say. Sorry." },
  ] },
  { id: 'pt.d4', turns: [
    { by: 'a', say: "Can I steal you for a minute?" },
    { by: 'b', say: "Everyone's stealing me today. Get in line." },
    { by: 'a', say: "It's about {target}." },
    { by: 'b', say: "Everything's about somebody today." },
  ] },
  { id: 'pt.d5', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Hey, about tonight. {target}?" },
    { by: 'b', say: "Oh, um. Somebody else already talked to me about tonight." },
    { by: 'a', say: "About {target}?" },
    { by: 'b', say: "Not exactly. I'm a bit confused, honestly." },
  ] },
  { id: 'pt.d6', turns: [
    { by: 'a', say: "{target} tonight. I've got {claimed}." },
    { by: 'b', say: "That's the third plan I've heard today." },
    { by: 'a', say: "Mine's the right one." },
    { by: 'b', say: "That's what the other two said too." },
  ] },
];
const REACT_UNRECEPTIVE = [
  { id: 'pt.x1', turns: [
    { by: 'a', say: "{target} tonight. You in?" },
    { by: 'b', say: "Mm." },
    { by: 'a', say: "Is that a yes 'mm' or a no 'mm'?" },
    { by: 'b', say: "It's just 'mm'." },
  ] },
  { id: 'pt.x2', turns: [
    { by: 'a', say: "I'm going after {target}. I've got {claimed}." },
    { by: 'b', say: "Cool." },
    { by: 'a', say: "Cool, you're in?" },
    { by: 'b', say: "Cool, I heard you." },
    { beat: '{a} gives up and walks away.' },
  ] },
  { id: 'pt.x3', turns: [
    { by: 'a', say: "Think about {target}. That's all." },
    { by: 'b', say: "Okay." },
    { by: 'a', conf: "I can't read {b} at all. I could've been talking to a tree." },
  ] },
  { id: 'pt.x4', turns: [
    { by: 'a', say: "We're doing {target}. You should join us." },
    { by: 'b', say: "I'll do what I do." },
    { by: 'a', say: "And what's that?" },
    { by: 'b', say: "You'll see." },
  ] },
  { id: 'pt.x5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "{target}. {claimed} votes." },
    { by: 'b', say: "Thanks for letting me know." },
    { by: 'a', say: "So you're in?" },
    { by: 'b', say: "I said thanks for letting me know." },
  ] },
  { id: 'pt.x6', turns: [
    { by: 'a', say: "Can I count on you for {target}?" },
    { by: 'b', say: "You can count on me to show up to the vote." },
    { by: 'a', say: "That's it?" },
    { by: 'b', say: "That's it." },
  ] },
  { id: 'pt.x7', turns: [
    { by: 'a', say: "So. {target}. What do you say?" },
    { beat: "{b} keeps sweeping and doesn't look up." },
    { by: 'a', say: "Hello? Did you hear me?" },
    { by: 'b', say: "I heard you." },
  ] },
  { id: 'pt.x8', turns: [
    { by: 'a', say: "I've got {claimed} votes for {target}. Want to be part of it?" },
    { by: 'b', say: "I want to be part of a nap, honestly." },
    { by: 'a', say: "I'm serious." },
    { by: 'b', say: "So am I. Talk to me later." },
  ] },
  { id: 'pt.x9', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{target}, tonight. I've done the work. You just have to write the name." },
    { by: 'b', say: "How generous of you." },
    { by: 'a', say: "Is that a yes?" },
    { by: 'b', say: "It's a 'how generous of you'." },
  ] },
  { id: 'pt.x10', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "{target}. Tonight. Yes or no?" },
    { by: 'b', say: "Don't rush me." },
    { by: 'a', say: "We vote in a few hours!" },
    { by: 'b', say: "Then I've got a few hours." },
  ] },
];

const WARN_BELIEVED = [
  { id: 'pt.w1', turns: [
    { by: 'a', say: "I need to tell you something. {pitcher} is going round asking people to vote you out." },
    { by: 'b', say: "{pitcher}? Seriously?" },
    { by: 'a', say: "{pitcher} asked me, like, an hour ago." },
    { by: 'b', say: "Okay. Thank you. I owe you." },
  ] },
  { id: 'pt.w2', turns: [
    { by: 'a', say: "Watch out for {pitcher}. Your name came up." },
    { by: 'b', say: "I knew something was off with {pitcher} today." },
    { by: 'a', say: "Now you know what." },
    { by: 'b', say: "Thanks. Really." },
  ] },
  { id: 'pt.w3', turns: [
    { beat: '{a} pulls {b} aside, out of sight.' },
    { by: 'a', say: "{pitcher} wants you gone. Tonight." },
    { by: 'b', say: "How do you know?" },
    { by: 'a', say: "Because I was one of the people {pitcher} asked." },
    { by: 'b', say: "Wow. Okay. Thank you for telling me." },
  ] },
  { id: 'pt.w4', when: { band: 'friends' }, turns: [
    { by: 'a', say: "I'm only telling you because you're my friend. {pitcher}'s pitching your name." },
    { by: 'b', say: "I believe you. You've never lied to me." },
    { by: 'a', say: "And I'm not starting now." },
  ] },
  { id: 'pt.w5', turns: [
    { by: 'a', say: "Heads up. {pitcher}'s been campaigning. Against you." },
    { by: 'b', say: "That little—okay. Okay. Thanks." },
    { beat: '{b} is already scanning the camp for {pitcher}.' },
  ] },
  { id: 'pt.w6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "{pitcher} is trying to get you voted out. Thought you'd want to know." },
    { by: 'b', say: "{pitcher}?! Oh, I'm going to—" },
    { by: 'a', say: "Don't do anything stupid!" },
    { by: 'b', say: "No promises!" },
  ] },
];
const WARN_DOUBTED = [
  { id: 'pt.v1', turns: [
    { by: 'a', say: "{pitcher} is going round asking people to vote for you." },
    { by: 'b', say: "{pitcher}? No. {pitcher} wouldn't do that." },
    { by: 'a', say: "I'm telling you what I heard." },
    { by: 'b', say: "And I'm telling you I don't believe it." },
  ] },
  { id: 'pt.v2', turns: [
    { by: 'a', say: "Your name's being pitched. By {pitcher}." },
    { by: 'b', say: "And why are you telling me this?" },
    { by: 'a', say: "Because I thought you'd want to know." },
    { by: 'b', say: "Or because you want me to go after {pitcher}." },
  ] },
  { id: 'pt.v3', turns: [
    { by: 'a', say: "Be careful tonight. {pitcher} isn't on your side." },
    { by: 'b', say: "That doesn't sound like {pitcher} at all." },
    { by: 'a', say: "Fine. Don't believe me. You'll see." },
  ] },
  { id: 'pt.v4', when: { register: 'cool' }, turns: [
    { by: 'a', say: "{pitcher} is pitching your name." },
    { by: 'b', say: "Maybe. Or maybe you're trying to start something." },
    { by: 'a', say: "Why would I do that?" },
    { by: 'b', say: "That's what I'm trying to figure out." },
  ] },
  { id: 'pt.v5', turns: [
    { by: 'a', say: "Just so you know, {pitcher} wants you gone." },
    { by: 'b', say: "Everyone wants everyone gone. That's the game." },
    { by: 'a', say: "Fine. Don't say I didn't warn you." },
  ] },
  { id: 'pt.v6', turns: [
    { by: 'a', say: "{pitcher} asked me to vote you out." },
    { by: 'b', say: "Did {pitcher}? Or is that just what you want me to think?" },
    { by: 'a', say: "Why would I lie about that?" },
    { by: 'b', say: "People lie about everything here." },
  ] },
];

const COUNTER_WATCHED = [
  { id: 'pt.k1', turns: [
    { by: 'a', conf: "So {pitcher} wants me gone. Okay." },
    { by: 'a', conf: "I'm not going to panic. I'm just going to watch {pitcher} very, very closely." },
  ] },
  { id: 'pt.k2', turns: [
    { by: 'a', conf: "I know what {pitcher} is up to. I'm not doing anything about it. Yet." },
  ] },
  { id: 'pt.k3', turns: [
    { by: 'a', conf: "If I start scrambling, everyone will know I'm worried. So I'm just going to sit here and smile." },
    { by: 'a', conf: "Smiling at {pitcher}. Especially at {pitcher}." },
  ] },
  { id: 'pt.k4', turns: [
    { by: 'a', conf: "{pitcher} is coming after me. Fine. Let's see if {pitcher} actually has the numbers." },
  ] },
  { id: 'pt.k5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Part of me wants to go over there and scream at {pitcher}." },
    { by: 'a', conf: "The smart part of me is telling me to sit still. I hate the smart part of me." },
  ] },
  { id: 'pt.k6', turns: [
    { by: 'a', conf: "I heard about {pitcher}'s little campaign. I'm keeping my head down and my eyes open." },
  ] },
];
const COUNTER_CONFRONT = [
  { id: 'pt.f1', turns: [
    { by: 'a', conf: "{pitcher} wants to vote me out? Fine. I'm going to ask {pitcher} about it. To {pitcher}'s face." },
  ] },
  { id: 'pt.f2', turns: [
    { by: 'a', conf: "I'm not going to sit around while {pitcher} talks about me behind my back." },
    { by: 'a', conf: "If {pitcher} wants me gone, {pitcher} can say it to me directly." },
  ] },
  { id: 'pt.f3', turns: [
    { by: 'a', conf: "I'm done tiptoeing around this. {pitcher} and I are going to have a conversation." },
  ] },
  { id: 'pt.f4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Oh, {pitcher} thinks {pitcher} can just campaign against me? Watch this." },
  ] },
  { id: 'pt.f5', turns: [
    { by: 'a', conf: "Everyone's whispering about it. So I'm going to say it out loud. That's the only way to stop it." },
  ] },
  { id: 'pt.f6', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I'll ask {pitcher} calmly. In front of people. Let's see how {pitcher} handles that." },
  ] },
];
const COUNTER_WARNED = [
  { id: 'pt.a1', turns: [
    { by: 'a', conf: "{pitcher} is coming after me, so I'm checking in with the people I trust." },
    { by: 'a', conf: "Some of them looked me in the eye. Some of them didn't. I'm remembering which." },
  ] },
  { id: 'pt.a2', turns: [
    { by: 'a', conf: "I went round to my people. Told them about {pitcher}. Now I find out who my people really are." },
  ] },
  { id: 'pt.a3', turns: [
    { by: 'a', conf: "I talked to everyone I'm close with. Half of them said they'd heard nothing." },
    { by: 'a', conf: "That means half of them are lying. I just don't know which half." },
  ] },
  { id: 'pt.a4', turns: [
    { by: 'a', conf: "If {pitcher} gets the numbers, I'm gone. So I'm making sure my friends know what's going on." },
  ] },
  { id: 'pt.a5', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I asked my friends if they're still with me. They all said yes." },
    { by: 'a', conf: "I really, really hope they meant it." },
  ] },
  { id: 'pt.a6', turns: [
    { by: 'a', conf: "I've done what I can. I've talked to everyone who might listen. Now it's up to them." },
  ] },
];
const COUNTER_DECEPTIVE = [
  { id: 'pt.e1', turns: [
    { by: 'a', conf: "{pitcher} thinks I don't know. Let {pitcher} think that." },
    { by: 'a', conf: "While {pitcher} is busy counting votes for me, I'm counting votes for {pitcher}." },
  ] },
  { id: 'pt.e2', turns: [
    { by: 'a', conf: "I've been smiling at {pitcher} all day. And quietly telling everyone else what {pitcher} is up to." },
  ] },
  { id: 'pt.e3', turns: [
    { by: 'a', conf: "{pitcher} came for me. Now I'm coming for {pitcher}. The difference is, {pitcher} won't see it coming." },
  ] },
  { id: 'pt.e4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Amateur. {pitcher} went round the whole camp with my name. Of course it got back to me." },
    { by: 'a', conf: "Now I'm going round the camp with {pitcher}'s name. Quietly." },
  ] },
  { id: 'pt.e5', turns: [
    { by: 'a', conf: "Everyone thinks I'm calm. I am calm. I'm also flipping the vote onto {pitcher}." },
  ] },
  { id: 'pt.e6', turns: [
    { by: 'a', conf: "{pitcher} wants a war? Fine. But I'm going to fight it quietly." },
  ] },
];
const COUNTER_COALITION = [
  { id: 'pt.o1', turns: [
    { by: 'a', conf: "{pitcher} wants me gone. So I'm building my own numbers. Against {pitcher}." },
  ] },
  { id: 'pt.o2', turns: [
    { by: 'a', conf: "I've been talking to people all afternoon. If {pitcher} wants a fight, {pitcher}'s got one." },
  ] },
  { id: 'pt.o3', turns: [
    { by: 'a', conf: "I asked around. People are willing to push back. Tonight might not go the way {pitcher} thinks." },
  ] },
  { id: 'pt.o4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Oh, it's on. {pitcher} picked the wrong person to mess with." },
  ] },
  { id: 'pt.o5', turns: [
    { by: 'a', conf: "{pitcher} went round the camp. So did I. Now we see whose round worked." },
  ] },
  { id: 'pt.o6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I don't like fighting. But I'm not going home without one. I've got people on my side now." },
  ] },
];

const READ_LANDED = [
  { id: 'pt.l1', turns: [
    { by: 'a', conf: "I think it's working. People are listening. {target} doesn't know what's coming." },
  ] },
  { id: 'pt.l2', turns: [
    { by: 'a', conf: "I went round everyone. Nobody said yes, exactly. But nobody said no either." },
    { by: 'a', conf: "I'll take that. It's better than a no." },
  ] },
  { id: 'pt.l3', turns: [
    { by: 'a', conf: "Tonight, {target} goes home. I'm almost sure of it. Almost." },
  ] },
  { id: 'pt.l4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I planted the seed. Now I let it grow and act surprised when it does." },
  ] },
  { id: 'pt.l5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "People are actually listening to me! Do you know how rare that is?" },
  ] },
  { id: 'pt.l6', turns: [
    { by: 'a', conf: "It's moving. I can feel it. As long as nobody blabs to {target}, we've got this." },
  ] },
];
const READ_STALLED = [
  { id: 'pt.m1', turns: [
    { by: 'a', conf: "Nobody's biting. I pitched {target} to everyone, and I got a lot of 'maybe'." },
    { by: 'a', conf: "I don't think it's happening tonight." },
  ] },
  { id: 'pt.m2', turns: [
    { by: 'a', conf: "That did not go how I wanted. I might have just painted a target on myself." },
  ] },
  { id: 'pt.m3', turns: [
    { by: 'a', conf: "I thought {target} would be an easy sell. It was not an easy sell." },
  ] },
  { id: 'pt.m4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Why won't anybody just DO something?! {target} is right there!" },
  ] },
  { id: 'pt.m5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Too many people have their own plans. Fine. I'll go with theirs and use mine another night." },
  ] },
  { id: 'pt.m6', turns: [
    { by: 'a', conf: "I tried. It didn't stick. Now I just hope nobody tells {target} it was my idea." },
  ] },
];

// The whole family is written in the camp that votes tonight (episode.js passes tribal: true).
export const GUARANTEED = Object.fromEntries(
  ['pitch.react', 'pitch.warn', 'pitch.counter', 'pitch.read'].flatMap(k => [
    'receptive', 'uncertain', 'numbers-focused', 'guarded', 'cold', 'skeptical', 'distracted', 'unreceptive',
    'believed', 'doubted', 'watched-carefully', 'confrontation', 'warned-allies', 'deceptive-counter', 'counter-coalition',
    'landed', 'stalled'].map(e => [`${k}.${e}`, ['tribal']])));

export default {
  'pitch.react.receptive': REACT_RECEPTIVE,
  'pitch.react.uncertain': REACT_UNCERTAIN,
  'pitch.react.numbers-focused': REACT_NUMBERS,
  'pitch.react.guarded': REACT_GUARDED,
  'pitch.react.cold': REACT_COLD,
  'pitch.react.skeptical': REACT_SKEPTICAL,
  'pitch.react.distracted': REACT_DISTRACTED,
  'pitch.react.unreceptive': REACT_UNRECEPTIVE,
  'pitch.warn.believed': WARN_BELIEVED,
  'pitch.warn.doubted': WARN_DOUBTED,
  'pitch.counter.watched-carefully': COUNTER_WATCHED,
  'pitch.counter.confrontation': COUNTER_CONFRONT,
  'pitch.counter.warned-allies': COUNTER_WARNED,
  'pitch.counter.deceptive-counter': COUNTER_DECEPTIVE,
  'pitch.counter.counter-coalition': COUNTER_COALITION,
  'pitch.read.landed': READ_LANDED,
  'pitch.read.stalled': READ_STALLED,
};
