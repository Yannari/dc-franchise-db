// ══════════════════════════════════════════════════════════════════════
// td/script/lines/mind.js — plotting, lying, overhearing, and what they tell the camera
// ══════════════════════════════════════════════════════════════════════
//
// talk.plan.<how>     — {a} talks strategy with {b} (tdStrategy). How {a} plays
//   it, read from who {a} is: 'use' ({a} is using {b}; the confessional says
//   so), 'map' (lays out the next votes), 'charm' (gets a commitment without
//   asking), 'quiet' (a short, low-key exchange), 'plain'.
// talk.lie.<about|vague> — {a} feeds {b} something untrue about {target}
//   ('vague': no one in particular). Only {a}'s confessional admits the lie.
// talk.overheard.<shows|files|poker> — {a} overhears {b} talking game, and
//   {b} isn't talking to {a}. 'shows': {a} lets {b} know; 'files': says
//   nothing; 'poker': not a flicker.
// talk.scramble.<desperate|busy> — {a} is scrambling and works on {b}.
// conf.mind.<snake|vent|people|quiet|honest> — {a} alone with the camera.
// conf.doubt.any — {a} privately unsure where {a.sub} stand(s).
// conf.bigmove.<planner|restless> — {a} wants to make a move.
// conf.cocky.any — {a} is far too relaxed about the vote.
// Ids: 'md.'.
const PLAN_USE = [
  { id: 'md.u1', turns: [
    { by: 'a', say: "You and me, we see this game the same way." },
    { by: 'b', say: "You think so?" },
    { by: 'a', say: "I know so. Stick with me and you'll be fine." },
    { by: 'b', say: "Okay. I'll stick with you." },
    { by: 'a', conf: "{b} is part of my plan. Just not the part {b} thinks." },
  ] },
  { id: 'md.u2', turns: [
    { by: 'b', say: "So what's the plan?" },
    { by: 'a', say: "The plan is you trust me, and I get us both to the end." },
    { by: 'b', say: "That's not really a plan." },
    { by: 'a', say: "It's the only one you need." },
    { by: 'a', conf: "{b} will be useful for a little while longer. Then {b} won't be." },
  ] },
  { id: 'md.u3', turns: [
    { by: 'a', say: "You're the only one here I'm really honest with, you know that?" },
    { by: 'b', say: "Really?" },
    { by: 'a', say: "Really. Which is why I need you to tell me everything you hear." },
    { by: 'b', say: "Okay. Sure. Of course." },
    { by: 'a', conf: "Honest with {b}? Please. But {b} is going to tell me everything now. That's what I wanted." },
  ] },
  { id: 'md.u4', when: { rival: true }, turns: [
    { by: 'a', say: "{rival} has it out for both of us. You see that, right?" },
    { by: 'b', say: "I guess. I hadn't really thought about it." },
    { by: 'a', say: "Think about it. And then think about who's on your side." },
    { by: 'b', say: "You are." },
    { by: 'a', conf: "{rival} doesn't care about {b} at all. But now {b} will vote however I need." },
  ] },
  { id: 'md.u5', turns: [
    { by: 'a', say: "I've been looking out for you. Quietly." },
    { by: 'b', say: "You have? Thanks." },
    { by: 'a', say: "Don't thank me. Just remember it at the vote." },
    { by: 'a', conf: "I haven't been looking out for anybody. But {b} believes me, and that's what counts." },
  ] },
  { id: 'md.u6', when: { lastBoot: true }, turns: [
    { by: 'a', say: "You know {lastBoot} was coming for you, right? I made sure that didn't happen." },
    { by: 'b', say: "Wait, seriously?" },
    { by: 'a', say: "Seriously. You owe me one." },
    { by: 'b', say: "I owe you a lot more than one." },
    { by: 'a', conf: "Did {lastBoot} have a plan for {b}? No idea. Does {b} owe me now? Absolutely." },
  ] },
];
const PLAN_MAP = [
  { id: 'md.m1', turns: [
    { beat: '{a} draws in the dirt with a stick while {b} watches.' },
    { by: 'a', say: "This is us. This is everyone else. Next vote, we go here. The one after, here." },
    { by: 'b', say: "You've planned three votes ahead?" },
    { by: 'a', say: "Four, actually. I just didn't want to overwhelm you." },
    { by: 'b', say: "Okay. That's terrifying. I'm in." },
  ] },
  { id: 'md.m2', turns: [
    { by: 'a', say: "Here's what's going to happen. Ready?" },
    { by: 'b', say: "Do I have a choice?" },
    { by: 'a', say: "Not really. We vote together, we split the others, and we pick them off one by one." },
    { by: 'b', say: "You make it sound easy." },
    { by: 'a', say: "It is easy. As long as nobody panics." },
  ] },
  { id: 'md.m3', when: { threat: true }, turns: [
    { by: 'a', say: "Next vote isn't {threat}. The one after that is." },
    { by: 'b', say: "Why wait?" },
    { by: 'a', say: "Because right now {threat} wins us challenges. The second that stops being useful, {threat} goes." },
    { by: 'b', say: "That's cold." },
    { by: 'a', say: "That's the game." },
  ] },
  { id: 'md.m4', turns: [
    { by: 'b', say: "Do you ever stop thinking about the game?" },
    { by: 'a', say: "No. And neither should you. Listen. Here's the order." },
    { beat: '{a} counts names off on {a.posAdj} fingers. {b} tries to keep up.' },
    { by: 'b', say: "Can you go back to the third one?" },
  ] },
  { id: 'md.m5', when: { weak: true, merged: false }, turns: [
    { by: 'a', say: "If we lose, it's {weak}. Easy." },
    { by: 'b', say: "And if we lose again after that?" },
    { by: 'a', say: "Then we go after the people who think they're safe." },
    { by: 'b', say: "You've really thought about this." },
    { by: 'a', say: "Somebody has to." },
  ] },
  { id: 'md.m6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, I'm done waiting around. We make a plan, and we make it NOW." },
    { by: 'b', say: "Fine! What's the plan?" },
    { by: 'a', say: "We stick together, and we take out whoever's coming for us first." },
    { by: 'b', say: "That's... actually a decent plan." },
  ] },
];
const PLAN_CHARM = [
  { id: 'md.c1', turns: [
    { by: 'a', say: "You're seriously the easiest person to talk to here." },
    { by: 'b', say: "You think?" },
    { by: 'a', say: "Totally. We should just vote together. It'd make life easier." },
    { by: 'b', say: "Yeah! Sure, why not." },
    { by: 'a', conf: "And just like that, {b}'s with me. I didn't even have to ask properly." },
  ] },
  { id: 'md.c2', turns: [
    { beat: '{a} and {b} are laughing about something that has nothing to do with the game.' },
    { by: 'a', say: "Oh, by the way. We're voting together, right?" },
    { by: 'b', say: "Obviously. Why would we not?" },
    { by: 'a', say: "Just checking." },
  ] },
  { id: 'md.c3', turns: [
    { by: 'a', say: "I feel like we're on the same page about everything." },
    { by: 'b', say: "We really are." },
    { by: 'a', say: "Including the vote?" },
    { by: 'b', say: "Including the vote. Wait, what are we voting?" },
    { by: 'a', say: "I'll tell you later." },
  ] },
  { id: 'md.c4', turns: [
    { by: 'b', say: "How do you always know what everyone's thinking?" },
    { by: 'a', say: "I listen. You should try it. Starting with me." },
    { by: 'b', say: "Okay. I'm listening." },
    { by: 'a', say: "Good. Then you're with me." },
  ] },
  { id: 'md.c5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just want us all to get along, you know?" },
    { by: 'b', say: "Me too." },
    { by: 'a', say: "So let's start with us. You and me, looking out for each other at the vote." },
    { by: 'b', say: "That's really sweet. Okay." },
  ] },
  { id: 'md.c6', turns: [
    { by: 'a', say: "Who are you thinking for the next vote?" },
    { by: 'b', say: "I don't know. Who are you thinking?" },
    { by: 'a', say: "I'm thinking whoever you're thinking." },
    { by: 'b', say: "Aww. Okay. Let's work it out together, then." },
    { by: 'a', conf: "{b} thinks we're deciding together. We're deciding whatever I decide." },
  ] },
];
const PLAN_QUIET = [
  { id: 'md.q1', turns: [
    { by: 'a', say: "Got a minute?" },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "Just checking where you're at. No pressure." },
    { by: 'b', say: "Same place as yesterday." },
    { by: 'a', say: "Good. That's all." },
  ] },
  { id: 'md.q2', turns: [
    { beat: '{a} sits down next to {b} and talks very quietly.' },
    { by: 'a', say: "Anything new?" },
    { by: 'b', say: "Couple of whispers. Nothing big." },
    { by: 'a', say: "Let me know if that changes." },
    { beat: '{a} leaves as quietly as {a.sub} came.' },
  ] },
  { id: 'md.q3', turns: [
    { by: 'a', say: "We good?" },
    { by: 'b', say: "We're good." },
    { by: 'a', say: "Then I won't keep you." },
  ] },
  { id: 'md.q4', turns: [
    { by: 'a', say: "Quick question. Who's been talking to who today?" },
    { by: 'b', say: "Everyone's been talking to everyone." },
    { by: 'a', say: "Then let's not. You and me just stay calm." },
    { by: 'b', say: "Fine by me." },
  ] },
  { id: 'md.q5', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um, are we still voting together?" },
    { by: 'b', say: "Yeah. Of course." },
    { by: 'a', say: "Okay. Good. That's all I wanted to know." },
  ] },
  { id: 'md.q6', turns: [
    { by: 'a', say: "I'm not going to make a speech. Are you with me?" },
    { by: 'b', say: "I'm with you." },
    { by: 'a', say: "Thanks." },
  ] },
];
const PLAN_PLAIN = [
  { id: 'md.p1', turns: [
    { by: 'a', say: "So. The vote." },
    { by: 'b', say: "Ugh. The vote." },
    { by: 'a', say: "We should probably have a plan." },
    { by: 'b', say: "We should probably have had a plan yesterday." },
    { by: 'a', say: "Then let's make one now." },
  ] },
  { id: 'md.p2', turns: [
    { beat: '{a} and {b} take a walk that goes on a lot longer than a walk needs to.' },
    { by: 'b', say: "Okay, so who are we thinking?" },
    { by: 'a', say: "I've got a name. You?" },
    { by: 'b', say: "I've got a name too. Same one?" },
    { by: 'a', say: "Let's find out. On three." },
  ] },
  { id: 'md.p3', turns: [
    { by: 'a', say: "Let's go through the numbers." },
    { by: 'b', say: "Again?" },
    { by: 'a', say: "Again. Until they stop scaring me." },
    { by: 'b', say: "Then we're going to be here all night." },
  ] },
  { id: 'md.p4', when: { threat: true }, turns: [
    { by: 'a', say: "Be honest. Do you think {threat} can be beaten?" },
    { by: 'b', say: "In a challenge? No. At a vote? Maybe." },
    { by: 'a', say: "That's what I was thinking." },
    { by: 'b', say: "Then let's keep thinking about it. Quietly." },
  ] },
  { id: 'md.p5', turns: [
    { by: 'b', say: "What's your read on everybody?" },
    { by: 'a', say: "Honestly? I don't trust any of them." },
    { by: 'b', say: "And me?" },
    { by: 'a', say: "I trust you. Mostly." },
  ] },
  { id: 'md.p6', when: { lastBoot: true }, turns: [
    { by: 'a', say: "{lastBoot} going home changes everything." },
    { by: 'b', say: "Does it?" },
    { by: 'a', say: "Somebody's lost a vote. Somebody's gained one. We need to figure out who." },
    { by: 'b', say: "Okay. Let's figure it out." },
  ] },
  { id: 'md.p7', turns: [
    { by: 'b', say: "You've got your thinking face on." },
    { by: 'a', say: "I'm always thinking." },
    { by: 'b', say: "About what?" },
    { by: 'a', say: "About who's going to flip first. Want to help me guess?" },
    { by: 'b', say: "Sure. I've got a few ideas." },
  ] },
  { id: 'md.p8', turns: [
    { beat: '{a} and {b} are sitting on a log, both pretending to fish with sticks.' },
    { by: 'a', say: "If you had to vote right now, who would it be?" },
    { by: 'b', say: "Right now? I honestly don't know." },
    { by: 'a', say: "Me neither. That's what scares me." },
  ] },
  { id: 'md.p9', turns: [
    { by: 'a', say: "Can I be paranoid at you for a minute?" },
    { by: 'b', say: "Go for it. Everyone else is." },
    { by: 'a', say: "Does it feel like something's going on that we're not part of?" },
    { by: 'b', say: "Every single day." },
    { by: 'a', say: "Then let's make sure we're part of the next thing." },
  ] },
  { id: 'md.p10', when: { merged: true }, turns: [
    { by: 'a', say: "There are so many of us now. I can't keep track." },
    { by: 'b', say: "Welcome to the merge. It's chaos." },
    { by: 'a', say: "Then let's be the two people who aren't chaotic." },
    { by: 'b', say: "Deal." },
  ] },
  { id: 'md.p11', when: { merged: false }, turns: [
    { by: 'a', say: "Do you think we'd win if we had to vote someone out tomorrow? Like, us two?" },
    { by: 'b', say: "Depends who." },
    { by: 'a', say: "Exactly. So let's decide who before somebody decides for us." },
    { by: 'b', say: "Okay. Let's talk." },
  ] },
];

const LIE_ABOUT = [
  { id: 'md.l1', turns: [
    { by: 'a', say: "I probably shouldn't tell you this. {target} has been saying your name." },
    { by: 'b', say: "What? {target}?" },
    { by: 'a', say: "I heard it myself. I just thought you should know." },
    { by: 'b', say: "Wow. Thanks." },
    { by: 'a', conf: "{target} never said that. But {b} doesn't need to know that." },
  ] },
  { id: 'md.l2', turns: [
    { by: 'a', say: "Has {target} said anything to you about the vote?" },
    { by: 'b', say: "No, why?" },
    { by: 'a', say: "Because {target} said a lot to me. About you." },
    { by: 'b', say: "Like what?" },
    { by: 'a', say: "Just... be careful around {target}." },
    { by: 'a', conf: "{target} hasn't said a word about {b}. But now {b} thinks {target} has. Job done." },
  ] },
  { id: 'md.l3', turns: [
    { by: 'b', say: "Why do you keep looking at {target} like that?" },
    { by: 'a', say: "Because {target} was asking me about you this morning. A lot." },
    { by: 'b', say: "Asking what?" },
    { by: 'a', say: "Who you're close to. Where your vote's going. Stuff like that." },
    { by: 'a', conf: "{target} didn't ask me anything. I just needed {b} to start worrying." },
  ] },
  { id: 'md.l4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I don't want to stir anything up, but {target} isn't who you think." },
    { by: 'b', say: "What do you mean?" },
    { by: 'a', say: "Let's just say {target} talks about people when they're not around. Including you." },
    { by: 'b', say: "Seriously?" },
    { by: 'a', conf: "I made that up. Completely. It took about four seconds." },
  ] },
  { id: 'md.l5', turns: [
    { by: 'a', say: "Do you know what {target} said about you last night?" },
    { by: 'b', say: "No. What?" },
    { by: 'a', say: "That you're the easiest vote in the game." },
    { by: 'b', say: "Excuse me?!" },
    { by: 'a', conf: "Okay, {target} didn't say that. But {b}'s face was worth it." },
  ] },
  { id: 'md.l6', turns: [
    { by: 'a', say: "Funny. {target} told me you were planning to flip." },
    { by: 'b', say: "I'm not! Why would {target} say that?" },
    { by: 'a', say: "Maybe to make you look bad." },
    { by: 'b', say: "Unbelievable." },
    { by: 'a', conf: "{target} said nothing. But {b} and {target} won't be sitting together at dinner." },
  ] },
  { id: 'md.l7', turns: [
    { by: 'a', say: "I'm not one to gossip, but {target} told me you're too comfortable." },
    { by: 'b', say: "Too comfortable? What does that even mean?" },
    { by: 'a', say: "I'm just repeating it." },
    { by: 'a', conf: "{target} never said that. I'm one to gossip, apparently." },
  ] },
  { id: 'md.l8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I feel awful saying this, but {target} isn't being very nice about you." },
    { by: 'b', say: "Really? I thought we were friends." },
    { by: 'a', say: "I'm sorry. I just thought you should know." },
    { by: 'a', conf: "That wasn't true. I hate that I did it. But I need {b} away from {target}." },
  ] },
];
const LIE_VAGUE = [
  { id: 'md.v1', turns: [
    { by: 'a', say: "People are talking about you. I'm just saying." },
    { by: 'b', say: "Who? What people?" },
    { by: 'a', say: "People. Be careful." },
    { by: 'a', conf: "Nobody's talking about {b}. But a nervous {b} is a {b} who listens to me." },
  ] },
  { id: 'md.v2', turns: [
    { by: 'a', say: "I heard a rumour about you." },
    { by: 'b', say: "What kind of rumour?" },
    { by: 'a', say: "The kind you'd want to know about. I'll tell you if I hear more." },
    { by: 'a', conf: "There's no rumour. But now {b} is going to come to me for everything." },
  ] },
  { id: 'md.v3', turns: [
    { by: 'a', say: "I'm only telling you because I like you. Somebody's after you." },
    { by: 'b', say: "Who?!" },
    { by: 'a', say: "I can't say yet. Just stick close to me." },
    { by: 'a', conf: "Nobody's after {b}. But {b} doesn't need to know that." },
  ] },
  { id: 'md.v4', turns: [
    { by: 'b', say: "Is something going on?" },
    { by: 'a', say: "Maybe. Things aren't looking great for you." },
    { by: 'b', say: "What things?" },
    { by: 'a', say: "Just things. Watch your back." },
    { by: 'a', conf: "Things are looking totally fine for {b}. I'm a terrible person. It's working, though." },
  ] },
  { id: 'md.v5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Can I tell you something? You're in more danger than you think." },
    { by: 'b', say: "How much danger?" },
    { by: 'a', say: "Enough that you should do whatever I tell you." },
    { by: 'a', conf: "{b} isn't in any danger. Except from me." },
  ] },
  { id: 'md.v6', turns: [
    { by: 'a', say: "Just between us, I wouldn't trust anyone right now." },
    { by: 'b', say: "Anyone?" },
    { by: 'a', say: "Anyone except me." },
    { by: 'a', conf: "I don't actually know anything. But {b} trusts me more now, and that's all I needed." },
  ] },
];

const HEARD_SHOWS = [
  { id: 'md.h1', turns: [
    { beat: '{b} is talking in a low voice with somebody, back turned. {a} hears every word.' },
    { by: 'b', say: "...{a}'s fine for now. We'll deal with {a} later." },
    { by: 'a', say: "Deal with me? Deal with me how?" },
    { beat: '{b} spins round, white as a sheet.' },
  ] },
  { id: 'md.h2', turns: [
    { by: 'b', say: "...so the plan is we keep {a} close until we don't need {a.obj}." },
    { by: 'a', say: "Hi. I'm right here." },
    { by: 'b', say: "Oh. How long have you been there?" },
    { by: 'a', say: "Long enough." },
  ] },
  { id: 'md.h3', turns: [
    { beat: "{a} is walking back to camp when {b}'s voice stops {a.obj} dead." },
    { by: 'b', say: "...and if {a} finds out, it's over." },
    { by: 'a', say: "If {a} finds out what?" },
    { by: 'b', say: "Nothing! Nothing. Hi!" },
  ] },
  { id: 'md.h4', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "...honestly, {a} is a liability." },
    { by: 'a', say: "A LIABILITY?" },
    { by: 'b', say: "Okay, I didn't mean—" },
    { by: 'a', say: "Oh, you meant it. Say it to my face next time!" },
  ] },
  { id: 'md.h5', turns: [
    { by: 'b', say: "...I don't trust {a}. I never have." },
    { beat: '{a} steps out from behind the tree.' },
    { by: 'a', say: "Good to know." },
    { by: 'b', say: "Wait—" },
  ] },
  { id: 'md.h6', turns: [
    { by: 'b', say: "...{a} has no idea. It's almost sad." },
    { by: 'a', say: "{a} has a pretty good idea now, actually." },
    { beat: '{b} closes {b.posAdj} eyes.' },
  ] },
];
const HEARD_FILES = [
  { id: 'md.f1', turns: [
    { beat: '{b} is whispering to somebody near the edge of camp. {a} stops walking.' },
    { by: 'b', say: "...{a} is useful for now. After that, I don't care." },
    { beat: '{a} backs away before anyone sees {a.obj}.' },
    { by: 'a', conf: "'Useful for now.' Okay, {b}. I'll remember that." },
  ] },
  { id: 'md.f2', turns: [
    { by: 'b', say: "...trust me, {a} will vote however we tell {a.obj} to." },
    { beat: "{a} hears it, turns around and walks back the way {a.sub} came." },
    { by: 'a', conf: "I'll vote however you tell me, huh? We'll see about that." },
  ] },
  { id: 'md.f3', turns: [
    { by: 'b', say: "...I'm not taking {a} to the end. No way." },
    { by: 'a', conf: "I wasn't supposed to hear that. I'm going to pretend I didn't. For now." },
  ] },
  { id: 'md.f4', turns: [
    { beat: '{a} is behind a tree, very still, while {b} talks to someone else.' },
    { by: 'b', say: "...so we split the votes, and {a} never sees it coming." },
    { by: 'a', conf: "Oh, I see it coming now." },
  ] },
  { id: 'md.f5', when: { register: 'sweet' }, turns: [
    { by: 'b', say: "...{a}'s nice, but nice doesn't win." },
    { by: 'a', conf: "I heard {b} talking about me. It really hurt. I'm not going to say anything. I just... know now." },
  ] },
  { id: 'md.f6', turns: [
    { by: 'b', say: "...if we need a number, {a} is the easy one." },
    { by: 'a', conf: "The easy one. That's what {b} thinks of me. Good. Let {b} keep thinking it." },
  ] },
];
const HEARD_POKER = [
  { id: 'md.k1', turns: [
    { by: 'b', say: "...{a} is next. After that, we'll see." },
    { beat: '{a} walks right past, smiling, as if {a.sub} heard nothing at all.' },
    { by: 'a', conf: "I heard every word. I just made sure {b} didn't know I heard it." },
  ] },
  { id: 'md.k2', turns: [
    { by: 'b', say: "...nobody's really with {a}. {a}'s on {a.posAdj} own." },
    { by: 'a', say: "Morning!" },
    { by: 'b', say: "Oh! Morning. Hi." },
    { by: 'a', conf: "On my own, am I? Interesting. Very interesting." },
  ] },
  { id: 'md.k3', turns: [
    { by: 'b', say: "...I'll tell {a} what {a} wants to hear. It always works." },
    { by: 'a', conf: "It won't work anymore. But {b} doesn't know that, and I'm not going to tell {b.obj}." },
  ] },
  { id: 'md.k4', when: { register: 'cool' }, turns: [
    { by: 'b', say: "...we keep {a} in the dark until the last second." },
    { by: 'a', conf: "I know exactly what they're planning now. They just don't know that I know." },
  ] },
  { id: 'md.k5', turns: [
    { by: 'b', say: "...trust me, {a}'s clueless." },
    { beat: '{a} keeps filling {a.posAdj} water bottle. {a.PosAdj} face gives away nothing.' },
    { by: 'a', conf: "Clueless. Sure. Let's go with that." },
  ] },
  { id: 'md.k6', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "...and then {a} goes home and never knows what hit {a.obj}." },
    { by: 'a', conf: "I love it when people tell me their plans by accident. It saves me so much time." },
  ] },
  { id: 'md.k7', turns: [
    { by: 'b', say: "...{a} will believe anything we say." },
    { beat: '{a} walks into the middle of the conversation with a big smile.' },
    { by: 'a', say: "What are we talking about?" },
    { by: 'b', say: "Nothing! The weather!" },
    { by: 'a', conf: "The weather. Sure. I'll remember the weather." },
  ] },
  { id: 'md.k8', turns: [
    { by: 'b', say: "...we just need {a} for one more vote." },
    { by: 'a', conf: "One more vote. Good to know how long I've got. Now I've got one vote to fix that." },
  ] },
];

const SCRAMBLE_DESPERATE = [
  { id: 'md.s1', turns: [
    { by: 'a', say: "Please. I need your vote. I'll do anything." },
    { by: 'b', say: "Whoa. Okay. Calm down." },
    { by: 'a', say: "I can't calm down! My name is everywhere!" },
    { by: 'b', say: "I'll think about it. I promise." },
  ] },
  { id: 'md.s2', turns: [
    { by: 'a', say: "Listen, I know how this looks, but hear me out." },
    { by: 'b', say: "It looks like you're panicking." },
    { by: 'a', say: "I am panicking! That doesn't mean I'm wrong!" },
    { by: 'b', say: "Okay. Talk. Slowly." },
  ] },
  { id: 'md.s3', when: { tribal: true }, turns: [
    { by: 'a', say: "Can I talk to you? Before tonight?" },
    { by: 'b', say: "You've talked to everyone before tonight." },
    { by: 'a', say: "Because I'm trying to stay! Is that so bad?" },
    { by: 'b', say: "No. It's just a lot." },
  ] },
  { id: 'md.s4', turns: [
    { beat: '{a} catches {b} on the way back to camp, out of breath.' },
    { by: 'a', say: "I've got a plan. A real one. Just hear it." },
    { by: 'b', say: "You've had three plans today." },
    { by: 'a', say: "This one's better!" },
  ] },
  { id: 'md.s5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm not going home! Do you hear me? I am NOT going home!" },
    { by: 'b', say: "Everyone can hear you." },
    { by: 'a', say: "Good! Then everyone knows!" },
  ] },
  { id: 'md.s6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I know I've been asking everybody. I'm sorry. I'm just really scared." },
    { by: 'b', say: "I know. It's okay." },
    { by: 'a', say: "Will you think about keeping me? Please?" },
    { by: 'b', say: "I'll think about it." },
  ] },
];
const SCRAMBLE_BUSY = [
  { id: 'md.b1', turns: [
    { by: 'a', say: "Hey! Got a sec?" },
    { by: 'b', say: "You've asked me that twice today." },
    { by: 'a', say: "And you've said yes twice. Third time's the charm." },
    { by: 'b', say: "Fine. What?" },
  ] },
  { id: 'md.b2', turns: [
    { by: 'a', say: "Just checking in. How are you feeling about everything?" },
    { by: 'b', say: "You're checking in a lot today." },
    { by: 'a', say: "I'm just being friendly." },
    { by: 'b', conf: "{a} is never this friendly. Something's up." },
  ] },
  { id: 'md.b3', turns: [
    { by: 'a', say: "So, I had an idea. Can I run it by you?" },
    { by: 'b', say: "Go on." },
    { by: 'a', say: "It's kind of complicated. Let me start from the beginning." },
    { by: 'b', conf: "Twenty minutes later, I still didn't know what the idea was." },
  ] },
  { id: 'md.b4', turns: [
    { beat: '{a} has talked to almost everyone in camp in the last hour. Now it is {b}\'s turn.' },
    { by: 'a', say: "Hi! What are you up to?" },
    { by: 'b', say: "Watching you talk to everyone." },
    { by: 'a', say: "Ha. Yeah. Anyway." },
  ] },
  { id: 'md.b5', turns: [
    { by: 'a', say: "Okay, honest question. Where are you at?" },
    { by: 'b', say: "Same place I was an hour ago when you asked." },
    { by: 'a', say: "Things change fast." },
    { by: 'b', say: "Not that fast." },
  ] },
  { id: 'md.b6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I've been thinking about your position. It's not great." },
    { by: 'b', say: "Thanks?" },
    { by: 'a', say: "But it could be. With a little help." },
    { by: 'b', say: "And I suppose you're the help." },
  ] },
];

const CONF_SNAKE = [
  { id: 'md.z1', turns: [
    { by: 'a', conf: "Everyone thinks I'm with them. I'm with me. I've always been with me." },
  ] },
  { id: 'md.z2', turns: [
    { by: 'a', conf: "They have no idea. None of them." },
    { by: 'a', conf: "And I'd like to keep it that way until the finale." },
  ] },
  { id: 'md.z3', turns: [
    { by: 'a', conf: "Want to know my plan? Too bad. I'm not even telling the camera." },
    { by: 'a', conf: "Okay, a hint. It doesn't end well for most of the people out there." },
  ] },
  { id: 'md.z4', when: { rival: true }, turns: [
    { by: 'a', conf: "{rival} thinks we're even. We are not even. I'm three moves ahead." },
  ] },
  { id: 'md.z5', turns: [
    { by: 'a', conf: "I've made promises to almost everyone out there." },
    { by: 'a', conf: "I'll keep some of them. I haven't decided which yet." },
  ] },
  { id: 'md.z6', when: { threat: true }, turns: [
    { by: 'a', conf: "Let {threat} win the challenges. I'm busy making sure the votes go my way." },
  ] },
];
const CONF_VENT = [
  { id: 'md.t1', turns: [
    { by: 'a', conf: "I cannot stand it here. I cannot stand half these people." },
    { by: 'a', conf: "And I'm going to win this game, and it's going to feel incredible." },
  ] },
  { id: 'md.t2', turns: [
    { by: 'a', conf: "Do you know how hard it is to be nice to people you can't stand? Every day?" },
    { by: 'a', conf: "It's exhausting. I deserve the money just for that." },
  ] },
  { id: 'md.t3', when: { rival: true }, turns: [
    { by: 'a', conf: "If {rival} says one more word to me today, I'm going to lose it." },
    { by: 'a', conf: "Okay. Breathe. Breathe. I'm fine." },
  ] },
  { id: 'md.t4', turns: [
    { by: 'a', conf: "Everybody here is so fake. FAKE. I hate it." },
    { by: 'a', conf: "I'm fake too, obviously. But at least I know I'm doing it." },
  ] },
  { id: 'md.t5', turns: [
    { by: 'a', conf: "I'm going to scream into a pillow. Do we have pillows? We don't have pillows." },
  ] },
  { id: 'md.t6', turns: [
    { by: 'a', conf: "I didn't come here to make friends. Which is good, because I haven't." },
  ] },
];
const CONF_PEOPLE = [
  { id: 'md.e1', turns: [
    { by: 'a', conf: "I just like people! I can't help it." },
    { by: 'a', conf: "Which is probably going to be a problem. Isn't it?" },
  ] },
  { id: 'md.e2', turns: [
    { by: 'a', conf: "I care about everyone here. Even the ones who'd vote me out tomorrow." },
    { by: 'a', conf: "Especially them, actually. They need it most." },
  ] },
  { id: 'md.e3', when: { friend: true }, turns: [
    { by: 'a', conf: "{friend} is my favourite person here. Don't tell the others." },
    { by: 'a', conf: "Actually, they probably already know." },
  ] },
  { id: 'md.e4', turns: [
    { by: 'a', conf: "Everyone keeps telling me I'm too nice for this game." },
    { by: 'a', conf: "Maybe. But nice people get votes at the end, right? Right?" },
  ] },
  { id: 'md.e5', turns: [
    { by: 'a', conf: "I talk to everybody. It's not a strategy. It's just who I am." },
    { by: 'a', conf: "Okay, it's a little bit of a strategy." },
  ] },
  { id: 'md.e6', turns: [
    { by: 'a', conf: "I love the people here. Even when they make it really, really hard." },
  ] },
];
const CONF_QUIET = [
  { id: 'md.o1', turns: [
    { by: 'a', conf: "I know exactly what's happening out there. I just can't figure out when to say it." },
  ] },
  { id: 'md.o2', turns: [
    { by: 'a', conf: "People think I don't notice things because I don't say much." },
    { by: 'a', conf: "I notice everything." },
  ] },
  { id: 'md.o3', turns: [
    { by: 'a', conf: "I haven't told anyone at camp this. But I've worked out who's with who." },
    { by: 'a', conf: "Now I just need the nerve to use it." },
  ] },
  { id: 'md.o4', when: { rival: true }, turns: [
    { by: 'a', conf: "{rival} thinks I'm a pushover. I'm not. I'm just quiet." },
  ] },
  { id: 'md.o5', turns: [
    { by: 'a', conf: "Being quiet is great. Nobody suspects you of anything." },
    { by: 'a', conf: "The problem is nobody remembers you're here either." },
  ] },
  { id: 'md.o6', turns: [
    { by: 'a', conf: "One day I'm going to make a move, and everyone's going to be so surprised." },
    { by: 'a', conf: "Not today, though. Maybe tomorrow." },
  ] },
];
const CONF_HONEST = [
  { id: 'md.n1', turns: [
    { by: 'a', conf: "I keep telling everyone I'm fine. I am not fine." },
    { by: 'a', conf: "But I'm going to keep saying it until it's true." },
  ] },
  { id: 'md.n2', turns: [
    { by: 'a', conf: "Okay. Here's what I actually think." },
    { by: 'a', conf: "Everyone out there is scared. Including me. Especially me." },
  ] },
  { id: 'md.n3', turns: [
    { by: 'a', conf: "I came here to play the game. I just didn't think it would feel like this." },
  ] },
  { id: 'md.n4', when: { lastBoot: true }, turns: [
    { by: 'a', conf: "I keep thinking about {lastBoot}. One vote, and you're gone. Just like that." },
    { by: 'a', conf: "It could be any of us next." },
  ] },
  { id: 'md.n5', turns: [
    { by: 'a', conf: "If you'd told me a week ago I'd still be here, I wouldn't have believed you." },
    { by: 'a', conf: "I'm not sure I believe it now." },
  ] },
  { id: 'md.n6', when: { friend: true }, turns: [
    { by: 'a', conf: "Honestly, the only reason I'm okay is {friend}." },
    { by: 'a', conf: "Without {friend}, I think I'd have cracked by now." },
  ] },
];
const DOUBT = [
  { id: 'md.d1', turns: [
    { by: 'a', conf: "I thought I knew where I stood. Today I'm not so sure." },
  ] },
  { id: 'md.d2', turns: [
    { by: 'a', conf: "I keep doing the maths in my head. It's not adding up in my favour." },
  ] },
  { id: 'md.d3', turns: [
    { by: 'a', conf: "Everybody's being nice to me. That's what worries me." },
  ] },
  { id: 'md.d4', turns: [
    { by: 'a', conf: "I keep replaying a conversation from earlier. The more I think about it, the worse it sounds." },
  ] },
  { id: 'md.d5', when: { lastBoot: true }, turns: [
    { by: 'a', conf: "{lastBoot} didn't see it coming either. What if I'm next and I just don't know it?" },
  ] },
  { id: 'md.d6', when: { rival: true }, turns: [
    { by: 'a', conf: "{rival} was really quiet around me today. That's never a good sign." },
  ] },
  { id: 'md.d7', turns: [
    { by: 'a', conf: "I've been quiet all day. Nobody's asked me why. Maybe they should." },
  ] },
];
const BIGMOVE_PLANNER = [
  { id: 'md.g1', turns: [
    { by: 'a', conf: "I've been patient. Too patient. Something has to change, and I'm the one who changes it." },
  ] },
  { id: 'md.g2', turns: [
    { by: 'a', conf: "I've been running the numbers on a move nobody else has thought of." },
    { by: 'a', conf: "I might actually do it." },
  ] },
  { id: 'md.g3', when: { merged: true }, turns: [
    { by: 'a', conf: "The jury's going to want to know what I did. I need something to point to." },
    { by: 'a', conf: "And I think I know what it is." },
  ] },
  { id: 'md.g4', when: { threat: true }, turns: [
    { by: 'a', conf: "Taking out {threat} would be the biggest move of the season." },
    { by: 'a', conf: "It'd also be the riskiest. Which is why it has to be me." },
  ] },
  { id: 'md.g5', turns: [
    { by: 'a', conf: "Everyone thinks the next vote is obvious. That's exactly why it shouldn't be." },
  ] },
  { id: 'md.g6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I didn't come here to play small. It's time to do something big." },
  ] },
  { id: 'md.g7', turns: [
    { by: 'a', conf: "Everyone's comfortable. Comfortable people don't see blindsides coming." },
    { by: 'a', conf: "I'm going to give them one." },
  ] },
  { id: 'md.g8', when: { lastBoot: true }, turns: [
    { by: 'a', conf: "{lastBoot} going home shook things up. The next vote is my chance to shake it up more." },
  ] },
];
const BIGMOVE_RESTLESS = [
  { id: 'md.r1', turns: [
    { by: 'a', conf: "I've been playing it safe for way too long. The game is moving on without me." },
  ] },
  { id: 'md.r2', turns: [
    { by: 'a', conf: "I need to do something. I need them to know I was here." },
  ] },
  { id: 'md.r3', turns: [
    { by: 'a', conf: "There's a move that could flip everything. I keep thinking about it." },
    { by: 'a', conf: "Then I chicken out. Then I think about it again." },
  ] },
  { id: 'md.r4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I'm done sitting around! Next vote, I'm doing something. I don't know what yet. But something!" },
  ] },
  { id: 'md.r5', turns: [
    { by: 'a', conf: "Nobody's talking about me as a threat. That's good. It's also kind of insulting." },
    { by: 'a', conf: "Maybe it's time I gave them a reason." },
  ] },
  { id: 'md.r6', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I've never made a big move in my life. Maybe it's time." },
    { by: 'a', conf: "...Maybe next week." },
  ] },
];
const COCKY = [
  { id: 'md.y1', turns: [
    { by: 'a', conf: "Am I worried? Nope. Not even a little." },
    { by: 'a', conf: "Everyone else can run around panicking. I'm going to have a nap." },
  ] },
  { id: 'md.y2', turns: [
    { by: 'a', conf: "The vote is obvious. I don't know why everyone's acting like it isn't." },
  ] },
  { id: 'md.y3', turns: [
    { by: 'a', conf: "I'm safe. I know I'm safe. I've never been this relaxed in my life." },
  ] },
  { id: 'md.y4', when: { rival: true }, turns: [
    { by: 'a', conf: "{rival} can scheme all {rival} wants. It won't touch me." },
  ] },
  { id: 'md.y5', turns: [
    { by: 'a', conf: "People keep asking me if I'm nervous. Why would I be nervous? I'm winning." },
  ] },
  { id: 'md.y6', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I'm not even going to strategise today. I don't need to. Watch." },
  ] },
  { id: 'md.y7', turns: [
    { by: 'a', conf: "Honestly, I'm bored. Nobody's coming after me. Somebody should at least try." },
  ] },
  { id: 'md.y8', when: { merged: true }, turns: [
    { by: 'a', conf: "Everybody likes me. I've checked. I'm going to the end, baby." },
  ] },
  { id: 'md.y9', turns: [
    { by: 'a', conf: "The others are running around whispering. I'm working on my tan." },
    { by: 'a', conf: "One of us is going to the end. And it's the tanned one." },
  ] },
];

export default {
  'talk.plan.use': PLAN_USE,
  'talk.plan.map': PLAN_MAP,
  'talk.plan.charm': PLAN_CHARM,
  'talk.plan.quiet': PLAN_QUIET,
  'talk.plan.plain': PLAN_PLAIN,
  'talk.lie.about': LIE_ABOUT,
  'talk.lie.vague': LIE_VAGUE,
  'talk.overheard.shows': HEARD_SHOWS,
  'talk.overheard.files': HEARD_FILES,
  'talk.overheard.poker': HEARD_POKER,
  'talk.scramble.desperate': SCRAMBLE_DESPERATE,
  'talk.scramble.busy': SCRAMBLE_BUSY,
  'conf.mind.snake': CONF_SNAKE,
  'conf.mind.vent': CONF_VENT,
  'conf.mind.people': CONF_PEOPLE,
  'conf.mind.quiet': CONF_QUIET,
  'conf.mind.honest': CONF_HONEST,
  'conf.doubt.any': DOUBT,
  'conf.bigmove.planner': BIGMOVE_PLANNER,
  'conf.bigmove.restless': BIGMOVE_RESTLESS,
  'conf.cocky.any': COCKY,
};
