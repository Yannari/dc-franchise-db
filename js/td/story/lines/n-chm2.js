// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-chm2.js — more of the scenes a season ran out of
// ══════════════════════════════════════════════════════════════════════
// The repeat count over three played seasons (chm.clash 20, chm.saved 14, tqa.open 13, chm.pact
// 12, vt2.decoy 9, psy.belong 12). Same keys, roles and facts as n-chm.js, n-tqa3.js, n-vt2.js
// and n-psy.js (headers there). Ids: 'ncx.'.

export default {
  // a saved / carried / stood up for b (two), or a carried the team and b saw it
  'chm.saved.any': [
    { id: 'ncx.s1', when: { two: true }, turns: [
      { beat: "{b} brings {a} a cup of water from the pump without being asked." },
      { by: 'a', say: "What's this for?" },
      { by: 'b', say: "For {chal}. For not leaving me behind when everybody else was yelling at you to go." },
      { by: 'a', say: "They were yelling at me to go?" },
      { by: 'b', say: "Loudly. You didn't even hear them, did you?" },
      { by: 'a', say: "I was a little busy hauling you along." },
      { by: 'b', conf: "{a} picked me over winning today. I don't know if I'd have done the same, and that's something I need to think about." },
    ] },
    { id: 'ncx.s2', when: { two: true, voice: ['tough', 'proud', 'competitive'] }, turns: [
      { by: 'b', say: "I didn't need your help out there, you know." },
      { by: 'a', say: "You were upside down." },
      { by: 'b', say: "I was getting there." },
      { by: 'a', say: "You were getting there upside down." },
      { by: 'b', say: "...Fine. Thanks." },
      { by: 'b', conf: "I hate needing help. I hate it even more when it's {a} doing the helping, and I'm going to owe {a.obj} for a while." },
    ] },
    { id: 'ncx.s3', when: { two: true, bLikesA: true }, turns: [
      { by: 'b', say: "You know I'd have been done at {chal} if it wasn't for you." },
      { by: 'a', say: "You'd have figured it out." },
      { by: 'b', say: "I really wouldn't have. I'm just saying, I know, and I'm not going to forget it." },
      { by: 'a', say: "Then don't. I'm keeping a list too." },
      { by: 'a', conf: "I didn't help {b} so {b} would owe me. But if it comes to that one day, I'm not going to pretend I don't know it." },
    ] },
    { id: 'ncx.s4', when: { two: false, merged: false }, turns: [
      { beat: "The whole team is crowded around {a} by the fire, replaying {chal} move by move." },
      { by: 'b', say: "And then you just went back for the last one like it was nothing!" },
      { by: 'a', say: "It wasn't nothing. My legs are still shaking." },
      { by: 'b', say: "Nobody could tell! You looked like a movie." },
      { by: 'a', say: "A movie where the hero throws up afterwards, maybe." },
      { by: 'b', say: "Every good movie has that scene." },
      { by: 'a', say: "Okay, okay. One more time, from the bit where I slipped." },
      { by: 'a', conf: "It's nice being the hero for one day. I know it doesn't last. Tomorrow I'm just going to be the person they're scared of." },
    ] },
    { id: 'ncx.s5', when: { two: false, merged: true }, turns: [
      { by: 'b', say: "That was the best I've seen anybody do at one of these." },
      { by: 'a', say: "Thanks. I think." },
      { by: 'b', say: "You think?" },
      { by: 'a', say: "Every time somebody tells me I did great, I hear 'you're next'." },
      { by: 'b', say: "That's very dark." },
      { by: 'a', say: "That's very this game." },
    ] },
    { id: 'ncx.s6', when: { two: true, age: 'teen' }, turns: [
      { by: 'b', say: "Okay, I have to say it. You were actually amazing today." },
      { by: 'a', say: "Stop, you're going to make it weird." },
      { by: 'b', say: "It's already weird. You literally caught me." },
      { by: 'a', say: "It was a reflex. Don't read into it." },
      { by: 'b', conf: "{a} keeps saying it was nothing. It was not nothing. I'd have gone straight into the water at {chal}." },
    ] },
  ],
  // a and b argued (two), or a was hard on everybody and b saw
  'chm.clash.any': [
    { id: 'ncx.c1', when: { two: true }, turns: [
      { beat: "{a} throws a wet towel onto the line, and it misses. {b} doesn't pick it up." },
      { by: 'a', say: "You could help." },
      { by: 'b', say: "I could. I helped all day at {chal}, and I got yelled at for it." },
      { by: 'a', say: "I didn't yell at you." },
      { by: 'b', say: "You yelled at me four times. I counted." },
      { by: 'a', conf: "Maybe I yelled. It was a challenge, people yell. {b} is acting like I kicked a puppy." },
    ] },
    { id: 'ncx.c2', when: { two: true, voice: ['calm', 'dry', 'schemer'] }, turns: [
      { by: 'b', say: "I'd like to talk about the part of {chal} where you told me to stop thinking." },
      { by: 'a', say: "You were thinking very slowly." },
      { by: 'b', say: "I was thinking correctly." },
      { by: 'a', say: "Slowly and correctly is still slowly." },
      { by: 'b', conf: "{a} doesn't shout. {a} just says something polite that makes you want to throw a coconut at {a.posAdj} head." },
    ] },
    { id: 'ncx.c3', when: { two: true, voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [
      { by: 'a', say: "Next time, when I say left, you go left." },
      { by: 'b', say: "You said left when you meant right!" },
      { by: 'a', say: "I meant MY left!" },
      { by: 'b', say: "How am I supposed to know whose left you mean?" },
      { by: 'c', opt: true, say: "Can you two please do this somewhere the rest of us can't hear?" },
      { by: 'b', conf: "{a} and I lost {chal} over which way left is. If that's not a sign we shouldn't be working together, I don't know what is." },
    ] },
    { id: 'ncx.c4', when: { two: true, bHatesA: true }, turns: [
      { by: 'b', say: "You did that on purpose today." },
      { by: 'a', say: "Did what?" },
      { by: 'b', say: "Got in my way. Every single time." },
      { by: 'a', say: "Maybe you were in MY way." },
      { by: 'b', say: "There was a whole course! We didn't need to be in the same spot!" },
      { by: 'a', conf: "{b} and I can't even do a challenge without getting into it. Honestly, I'm starting to think {b} is going to be a problem for me." },
    ] },
    { id: 'ncx.c5', when: { two: true, bLikesA: true }, turns: [
      { beat: "{a} and {b} sit at opposite ends of the log, neither looking at the other." },
      { by: 'a', say: "Are we going to talk about it?" },
      { by: 'b', say: "About you calling me useless in front of everybody?" },
      { by: 'a', say: "I didn't say useless. I said 'not useful right now'." },
      { by: 'b', say: "That is so much worse." },
      { by: 'a', say: "...Yeah. I heard it as I said it. I'm sorry." },
      { by: 'b', conf: "{a} said sorry, and I'll take it. But I'm not going to forget how fast {a} turned on me when things got hard at {chal}." },
    ] },
    { id: 'ncx.c6', when: { two: false, merged: false }, turns: [
      { by: 'b', say: "You know half the team is scared of you after today, right?" },
      { by: 'a', say: "Good. Maybe they'll move faster." },
      { by: 'b', say: "Or maybe they'll stop wanting you on the team." },
      { by: 'a', say: "They'll want me on the team when we start winning." },
      { by: 'b', conf: "{a} ran {chal} like a drill sergeant. It nearly worked. Nearly is the part people are going to remember." },
    ] },
    { id: 'ncx.c7', when: { two: false, merged: true }, turns: [
      { by: 'b', say: "You got pretty heated out there today." },
      { by: 'a', say: "I wanted to win." },
      { by: 'b', say: "Everybody wanted to win. You're the only one who shouted about it." },
      { by: 'a', say: "Somebody had to say something. Half of them were standing around." },
      { by: 'b', say: "Maybe. But now the half that was standing around remembers who yelled." },
      { by: 'a', say: "Let them remember. I'd rather be loud and here than quiet and gone." },
      { by: 'a', conf: "Maybe I lost my temper a little at {chal}. Everybody here is going to act like they've never lost theirs, and that's fine. I know better." },
    ] },
  ],
  // a and b made a pact during the challenge
  'chm.pact.any': [
    { id: 'ncx.k1', when: { two: true }, turns: [
      { beat: "{a} and {b} are the last two still up, sitting on the dock." },
      { by: 'b', say: "So that thing we said out there." },
      { by: 'a', say: "About going to the end together." },
      { by: 'b', say: "People say that kind of thing when they're scared." },
      { by: 'a', say: "I was scared. I also meant it." },
      { by: 'b', say: "Okay. Then I meant it too." },
      { by: 'b', conf: "We made a deal halfway through {chal}, hanging on for dear life. It's the most honest deal I've made in this whole game." },
    ] },
    { id: 'ncx.k2', when: { two: true, voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', say: "Let's be clear about what we agreed today." },
      { by: 'b', say: "That we look out for each other." },
      { by: 'a', say: "That we tell each other first. Before anybody else. If a name comes up, you hear it from me, and I hear it from you." },
      { by: 'b', say: "That's very specific." },
      { by: 'a', say: "The vague deals are the ones that fall apart." },
      { by: 'a', conf: "Out at {chal}, {b} and I promised to have each other's backs. Back at camp, I made sure we both know exactly what that means." },
    ] },
    { id: 'ncx.k3', when: { two: true, voice: ['warm', 'earnest', 'goofy'] }, turns: [
      { by: 'a', say: "We need a handshake." },
      { by: 'b', say: "A what?" },
      { by: 'a', say: "A secret handshake. For the deal. Every real alliance has one." },
      { by: 'b', say: "This is the dumbest thing I've ever done." },
      { beat: "They do the handshake anyway. It takes three tries." },
      { by: 'b', conf: "{a} and I agreed to stick together at {chal}. Now we have a handshake. I'm in way too deep." },
    ] },
    { id: 'ncx.k4', when: { two: true, merged: true }, turns: [
      { by: 'b', say: "I've been thinking about what we said at {chal}." },
      { by: 'a', say: "Second thoughts?" },
      { by: 'b', say: "No. Third thoughts. I think it's a good idea, and I think everybody's going to hate it once they figure it out." },
      { by: 'a', say: "Then they'd better not figure it out." },
      { by: 'a', conf: "A deal you make in the middle of a challenge is either the best deal you'll ever make or the worst. I really hope {b} is the first kind." },
    ] },
  ],
  // the host opens the vote: a team that just lost
  'tqa.open.lost.any': [
    { id: 'ncx.o1', turns: [
      { by: 'h', say: "{a}, when you got back to camp after losing today, what was the first thing anybody said?" },
      { by: 'a', say: "Nothing. For a really long time, nothing." },
      { by: 'h', say: "And then?" },
      { by: 'a', say: "And then somebody asked what's for dinner, and everybody got mad at them for asking." },
      { by: 'b', say: "It was me. I was hungry." },
    ] },
    { id: 'ncx.o2', when: { sank: true }, turns: [
      { by: 'h', say: "Losing is never fun. {b}, do you think everybody did their part today?" },
      { by: 'b', say: "I think everybody tried.", v: { blunt: "No. And I think everybody here knows that.", warm: "I think everybody tried. Some days trying just isn't enough." } },
      { by: 'h', say: "That's a very careful answer." },
      { by: 'b', say: "It's a very careful night." },
      { beat: "{sank} shifts on the log." },
    ] },
    { id: 'ncx.o3', turns: [
      { by: 'h', say: "{a}, you've been staring at that fire since you sat down. What are you thinking about?" },
      { by: 'a', say: "Honestly? Every conversation I had today, and whether I said the wrong thing in one of them." },
      { by: 'h', say: "Did you?" },
      { by: 'a', say: "I'll know in about twenty minutes." },
    ] },
    { id: 'ncx.o4', turns: [
      { by: 'h', say: "Here's what I want to know. {b}, after a loss, does camp pull together or come apart?" },
      { by: 'b', say: "Both. It pulls together into little groups, and then the little groups come apart from each other." },
      { by: 'h', say: "{a}, which little group are you in?" },
      { by: 'a', say: "The one that's going to be here tomorrow, I hope." },
    ] },
  ],
  // the host opens the vote: the merged tribe
  'tqa.open.merged.any': [
    { id: 'ncx.m1', turns: [
      { by: 'h', say: "{a}, now that it's every person for themselves, who do you actually trust?" },
      { by: 'a', say: "Today? Maybe two people. Tomorrow, I'll let you know." },
      { by: 'h', say: "{b}, are you one of the two?" },
      { by: 'b', say: "I'd better be.", v: { dry: "I'm choosing not to ask." } },
    ] },
    { id: 'ncx.m2', turns: [
      { by: 'h', say: "{b}, you all used to be on teams. What changed when the teams went away?" },
      { by: 'b', say: "Before, you knew who was on your side. Now you just know who's on your side today." },
      { by: 'h', say: "{a}, does that sound right?" },
      { by: 'a', say: "It sounds right, and I hate it." },
    ] },
    { id: 'ncx.m3', turns: [
      { by: 'h', say: "{a}, was today a good day or a bad day?" },
      { by: 'a', say: "Ask me after the vote." },
      { by: 'h', say: "That bad?" },
      { by: 'a', say: "That close. I genuinely don't know which way it goes." },
    ] },
  ],
  // a, who survives the night, is sure it's a tonight and pushes {wrote}; b is a's friend
  'vt2.decoy': [
    { id: 'ncx.d1', turns: [
      { beat: "{a} grabs {b} by the sleeve on the way back from the water pump." },
      { by: 'a', say: "I think it's me. I really think it's me tonight." },
      { by: 'b', say: "Who told you that?" },
      { by: 'a', say: "Nobody told me anything. That's the problem. Everybody stopped telling me things around lunchtime." },
      { by: 'b', say: "So what do you want to do?" },
      { by: 'a', say: "{wrote}. If I can get enough people onto {wrote}, I'm fine." },
      { by: 'a', conf: "When people go quiet around you, it's never a good sign. I'm not waiting around to find out what the quiet means." },
    ] },
    { id: 'ncx.d2', when: { told: true }, turns: [
      { by: 'a', say: "{teller} just pulled me aside and said I should be worried." },
      { by: 'b', say: "Worried how?" },
      { by: 'a', say: "Worried like 'pack your bag' worried." },
      { by: 'b', say: "Do you believe {teller}?" },
      { by: 'a', say: "I can't afford not to. I'm going to push {wrote} as hard as I can." },
      { by: 'a', conf: "Maybe {teller} is wrong. Maybe {teller} is messing with me. Either way, I'd rather look paranoid tonight than look stupid tomorrow." },
    ] },
    { id: 'ncx.d3', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [
      { by: 'a', say: "Walk with me. Not too fast, not too slow, like we're just going for wood." },
      { by: 'b', say: "We are going for wood." },
      { by: 'a', say: "Good. Then nobody will wonder why. I think the numbers are on me, and I think {wrote} is the only way out." },
      { by: 'b', say: "That's a big swing." },
      { by: 'a', say: "It's the only swing I've got." },
    ] },
    { id: 'ncx.d4', when: { voice: ['anxious', 'emotional', 'warm'] }, turns: [
      { by: 'a', say: "I can't stop shaking. Can you see me shaking?" },
      { by: 'b', say: "A little. Breathe." },
      { by: 'a', say: "I can't breathe, I'm busy trying to count to a majority. I need {wrote} to go tonight, or it's me." },
      { by: 'b', say: "Then we'll try. Together." },
      { by: 'a', conf: "I've thrown up once already today, and it's not even dark yet. If I make it through tonight, I'm sleeping for a week." },
    ] },
    { id: 'ncx.d5', when: { voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [
      { by: 'a', say: "Okay, here's what's going to happen. They're coming for me, so we're going after {wrote}." },
      { by: 'b', say: "Do we know they're coming for you?" },
      { by: 'a', say: "I know. I can feel it." },
      { by: 'b', say: "That's not knowing." },
      { by: 'a', say: "It's knowing enough!" },
      { by: 'b', conf: "{a} is convinced it's {a} tonight, based on a feeling. I've learned not to argue with {a}'s feelings. They're very loud." },
    ] },
    { id: 'ncx.d6', when: { age: 'teen' }, turns: [
      { by: 'a', say: "Okay, don't freak out, but I think I'm going home." },
      { by: 'b', say: "You're the one freaking out." },
      { by: 'a', say: "Yes! Because I'm going home! Unless we get {wrote} out first." },
      { by: 'b', say: "How many people do we have?" },
      { by: 'a', say: "Counting you? Including you? ...You're counting, right?" },
    ] },
  ],
  // ── belong: wants to be liked, to have people; scared of being left out (n-psy.js header) ──
  'psy.belong': [
    { id: 'ncx.b1', when: { moment: 'lost', lastBoot: true }, turns: [
      { beat: "{a} folds a shirt that isn't {a.posAdj} and puts it on {lastBoot}'s empty bunk." },
      { by: 'a', conf: "{lastBoot} left this, and I can't bring myself to throw it out. It's just a shirt. It's not just a shirt." },
      { by: 'a', conf: "Everybody else woke up today and got on with it. I woke up and I didn't have anybody to get on with." },
    ] },
    { id: 'ncx.b2', when: { moment: 'lost', lastBoot: true, pair: true }, turns: [
      { by: 'a', say: "Can I sit with you at breakfast? I used to sit with {lastBoot}." },
      { by: 'b', say: "You don't have to ask." },
      { by: 'a', say: "I know. I'm asking anyway. It makes me feel less like I'm just showing up." },
      { by: 'b', say: "You miss {lastBoot}, don't you?" },
      { by: 'a', say: "More than I thought I would. We talked about nothing every morning, and now the mornings are really quiet." },
      { by: 'b', say: "Then talk about nothing with me. I'm pretty good at nothing." },
      { by: 'b', conf: "{a} has been a little lost since {lastBoot} left. I don't mind being the person {a} sits with. I just hope {a} knows it isn't a favour." },
    ] },
    { id: 'ncx.b3', when: { moment: 'votes' }, turns: [
      { by: 'a', conf: "My name came up last night. I keep running through every conversation I've had, trying to find the one where I made somebody hate me." },
      { by: 'a', conf: "I didn't find one. Which is worse, because it means I can't fix it.", v: { tough: "I didn't find one. So either somebody's lying to me, or somebody just doesn't like my face." } },
    ] },
    { id: 'ncx.b4', when: { moment: 'votes', pair: true }, turns: [
      { beat: "{a} and {b} are on water duty together, walking slower than they need to." },
      { by: 'a', say: "Be honest with me. When my name came up, were you surprised?" },
      { by: 'b', say: "Yes. Really." },
      { by: 'a', say: "Okay. Good. I needed one person to be surprised." },
      { by: 'b', say: "Did you think everybody knew?" },
      { by: 'a', say: "I thought maybe everybody had been waiting for it, and I was the last to find out." },
      { by: 'b', say: "Not me. I'd have told you, if I'd known. You know that." },
      { by: 'a', conf: "Getting votes didn't hurt as much as not knowing who'd be sad if I left. Now I know there's at least one." },
    ] },
    { id: 'ncx.b5', when: { moment: 'quiet' }, turns: [
      { by: 'a', conf: "Everybody here has a person. I have, like, six people I'm friendly with. That's not the same thing, is it." },
    ] },
  ],
};
