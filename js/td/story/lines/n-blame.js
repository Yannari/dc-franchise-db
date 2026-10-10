// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-blame.js — back from a loss, every way it can go
// ══════════════════════════════════════════════════════════════════════
// The user: "the blame game always appears and is super repetitive". Same roles as n-chal.js:
//   story.chal.lost     a goes after b ({sank}, the lowest score); c is b's closest teammate
//   story.chal.regroup  (director.js: this team blamed somebody at a recent loss) the team picks
//                       itself up instead: a (who'd usually start it) doesn't, b still feels it, c helps
//   long.crowd.lost.any back from a loss: a blames b, who scored the least; c tries to calm it down
//   long.blame.loss.any a blames b for how the last challenge went
// {streak}: losses in a row (fact streak: one / two / many). Ids: 'nbl.'.

export default {
  'story.chal.lost': [
    { id: 'nbl.l1', place: 'public', turns: [
      { beat: "The team trudges back into camp. Nobody says anything until {a} throws a bag down." },
      { by: 'a', say: "Okay, I'm just going to ask. {b}, what happened out there?", v: { calm: "Can we talk about what happened? Calmly?", cruel: "So, {b}. Want to explain that?", teen: "Okay, so, {b}, like, what was that?" } },
      { by: 'b', say: "I know. I messed up. You don't have to rub it in.", v: { tough: "Don't start. I had a bad day. It happens.", anxious: "I'm sorry, I'm so sorry, I don't know what happened." } },
      { by: 'a', say: "I'm not rubbing it in, I'm asking so it doesn't happen again." },
      { by: 'c', say: "It's not going to happen again. Right, {b}?" },
      { by: 'b', say: "Right." },
      { by: 'a', conf: "I'm not trying to be the bad guy. But somebody has to say it, and everybody else just stares at their feet." },
    ] },
    { id: 'nbl.l2', place: 'public', when: { streak: ['two', 'many'] }, turns: [
      { by: 'a', say: "That's {streak} in a row. {streak}! Does anybody else care about that?" },
      { by: 'c', say: "Of course we care. Yelling isn't going to fix it." },
      { by: 'a', say: "Then what is? Because every time we lose, we lose the same way." },
      { by: 'b', say: "If you mean me, just say it." },
      { by: 'a', say: "Fine. I mean you. Not just you, but mostly you." },
      { by: 'b', conf: "Every time we lose, {a} needs somebody to point at, and every time it's me. Maybe {a} is right. That's the part that keeps me up." },
    ] },
    { id: 'nbl.l3', place: 'public', when: { voice: ['dry', 'schemer', 'calm'] }, turns: [
      { by: 'a', say: "Well. That went great." },
      { by: 'b', say: "Here we go." },
      { by: 'a', say: "I'm not saying anything. I'm just noting, for the record, that we were winning until we weren't." },
      { by: 'c', say: "And you're 'noting' it while looking straight at {b}." },
      { by: 'a', say: "Am I? Huh." },
      { by: 'a', conf: "I don't need to shout. I just need everybody to remember tonight who we were winning with, and who we weren't." },
    ] },
    { id: 'nbl.l4', place: 'public', when: { voice: ['loud', 'tough', 'competitive'] }, turns: [
      { by: 'a', say: "I'm not doing this again. I am NOT losing another one of these." },
      { by: 'c', say: "Nobody wants to lose." },
      { by: 'a', say: "Then somebody should try winning! {b} was barely moving out there!" },
      { by: 'b', say: "I was doing my best!" },
      { by: 'a', say: "Then your best needs to get a lot better by tomorrow." },
      { by: 'c', conf: "{a} has a point, I guess, but the way {a} says things, nobody's ever going to listen to the point." },
    ] },
    { id: 'nbl.l5', place: 'public', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [
      { by: 'a', say: "Hey, {b}. Can I talk to you for a second? Not in a bad way." },
      { by: 'b', say: "It's always in a bad way when somebody says that." },
      { by: 'a', say: "I just think maybe next time you should be on the easier part. Not because you're bad. Because you're tired." },
      { by: 'b', say: "That's the nicest way anybody has ever told me I'm the problem." },
      { by: 'a', conf: "I didn't want to make {b} feel worse. I also don't want to lose again. Turns out you can't really do both." },
    ] },
  ],
  'story.chal.regroup': [
    { id: 'nbl.r1', place: 'public', turns: [
      { beat: "The team sits around the fire after another loss. {b} is waiting for it." },
      { by: 'b', say: "Go on. Say it. I know you want to." },
      { by: 'a', say: "Not this time.", v: { tough: "Nah. Yelling didn't work last time." } },
      { by: 'b', say: "Really?" },
      { by: 'a', say: "Last time we blamed somebody, we lost again anyway. So maybe it's not one person. Maybe it's all of us." },
      { by: 'c', say: "Did {a} just say something reasonable?" },
      { by: 'a', say: "Don't get used to it." },
      { by: 'c', conf: "Losing two in a row was awful, but watching {a} not blow up was kind of amazing. Maybe we're learning." },
    ] },
    { id: 'nbl.r2', place: 'public', turns: [
      { by: 'b', say: "I'm sorry. I know I was the slowest again." },
      { by: 'a', say: "Stop. We're not doing that tonight." },
      { by: 'b', say: "Doing what?" },
      { by: 'a', say: "The thing where we all sit here and pick who's the worst. We did that last time, and it didn't help anybody." },
      { by: 'c', say: "So what do we do instead?" },
      { by: 'a', say: "We figure out the next one. Who's good at what. We plan it properly for once." },
      { by: 'b', conf: "I came back ready to get yelled at, and instead we made a plan. I don't know who these people are, but I like them." },
    ] },
    { id: 'nbl.r3', place: 'public', when: { voice: ['goofy', 'dry', 'chaotic'] }, turns: [
      { by: 'a', say: "Okay, team meeting. On a scale of one to ten, how bad was that?" },
      { by: 'c', say: "Eleven." },
      { by: 'b', say: "Twelve. Mostly because of me." },
      { by: 'a', say: "See, we agree on something. That's progress. That's basically teamwork." },
      { beat: "Even {b} cracks a smile." },
      { by: 'a', conf: "We're terrible. We're really, really terrible. But at least tonight we're terrible together, instead of terrible at each other." },
    ] },
    { id: 'nbl.r4', place: 'public', when: { streak: 'many' }, turns: [
      { by: 'c', say: "{streak} losses. We're cursed." },
      { by: 'a', say: "We're not cursed. We're just bad at this particular kind of thing, and the next one might be different." },
      { by: 'b', say: "And if it isn't?" },
      { by: 'a', say: "Then at least we're the team with the best attitude about being terrible." },
      { by: 'b', conf: "I keep waiting for somebody to turn on me. Nobody has. Either they're being kind, or they've already decided, and they're being kind because they've already decided." },
    ] },
  ],
  'long.crowd.lost.any': [
    { id: 'nbl.c1', turns: [
      { beat: "Back at camp, the team stands around the empty fire pit. Nobody wants to be the first to talk." },
      { by: 'a', say: "So we're all just going to pretend that didn't happen?", v: { anxious: "Okay, I'll say it, because somebody has to. That was bad." } },
      { by: 'b', say: "Nobody's pretending anything." },
      { by: 'a', say: "Then let's talk about it. You froze, {b}." },
      { by: 'c', say: "Hey. We all made mistakes out there, not just {b}." },
      { by: 'a', say: "Some of us made more of them." },
      { by: 'c', conf: "{a} needed someone to blame, and {b} was right there. I'd rather lose a challenge than lose the team over it." },
    ] },
    { id: 'nbl.c2', when: { voice: ['cruel', 'proud'] }, turns: [
      { by: 'a', say: "I'd like to thank {b} for that amazing performance today. Really. Inspirational." },
      { by: 'b', say: "Can you not?" },
      { by: 'a', say: "I'm being supportive. This is what supportive looks like." },
      { by: 'c', say: "That's not what supportive looks like, {a}." },
      { by: 'a', conf: "Was that mean? Maybe a little. But sarcasm is just honesty with better timing." },
    ] },
    { id: 'nbl.c3', when: { voice: ['warm', 'earnest', 'anxious'] }, turns: [
      { by: 'a', say: "I don't want to make this a whole thing, but... {b}, are you okay? You seemed really off today." },
      { by: 'b', say: "I'm fine. I just couldn't get it." },
      { by: 'a', say: "Okay. Because we kind of needed you to get it." },
      { by: 'c', say: "{a}." },
      { by: 'a', say: "I'm not being mean! I'm being honest. Honestly worried." },
      { by: 'b', conf: "{a} said it in the nicest possible way, and it still felt like getting punched." },
    ] },
    { id: 'nbl.c4', turns: [
      { by: 'b', say: "Before anybody says anything, yes, it was me. I know." },
      { by: 'a', say: "I wasn't going to say anything." },
      { by: 'b', say: "You were. You had the face." },
      { by: 'a', say: "...I had the face." },
      { by: 'c', say: "Okay, so we all know. Can we eat now?" },
      { by: 'b', conf: "I figured if I said it first, it would hurt less. It hurt exactly the same, but at least nobody got to do the big speech." },
    ] },
    { id: 'nbl.c5', when: { voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [
      { by: 'a', say: "Everybody sit down. We need to talk about what just happened." },
      { by: 'c', say: "Do we, though?" },
      { by: 'a', say: "Yes! Because tonight one of us goes home, and it should be whoever lost us that challenge." },
      { by: 'b', say: "Wow. Just say my name." },
      { by: 'a', say: "I don't have to. Everybody knows." },
      { by: 'c', conf: "{a} just turned a challenge loss into a campaign speech, in about thirty seconds. That's actually kind of impressive." },
    ] },
    { id: 'nbl.c6', when: { voice: ['dry', 'schemer', 'calm'] }, turns: [
      { by: 'a', say: "Interesting challenge today." },
      { by: 'b', say: "Don't." },
      { by: 'a', say: "I didn't say anything." },
      { by: 'b', say: "You said 'interesting'." },
      { by: 'a', say: "And it was. Very interesting. Especially the part in the middle." },
      { by: 'c', say: "Okay, that's enough." },
      { by: 'a', conf: "I never have to say {b}'s name. I just have to make sure everybody's thinking it when they go to vote." },
    ] },
    { id: 'nbl.c7', when: { age: 'teen' }, turns: [
      { by: 'a', say: "Okay, that was literally the worst thing I've ever seen." },
      { by: 'b', say: "Thanks. Great. Super helpful." },
      { by: 'a', say: "I'm not saying it was your fault. I'm just saying you were there when it happened." },
      { by: 'c', say: "That's the same thing." },
      { by: 'a', say: "It's, like, slightly different." },
      { by: 'b', conf: "{a} told me it wasn't my fault in a way that made it completely sound like my fault. That's honestly a skill." },
    ] },
    { id: 'nbl.c8', when: { age: ['thirties', 'older'] }, turns: [
      { by: 'a', say: "Right. Let's be adults about this. What went wrong?" },
      { by: 'b', say: "I went wrong. I know." },
      { by: 'a', say: "I'm not here to tell you off. I'm here so we don't do it again." },
      { by: 'c', say: "That sounds like telling off with extra steps." },
      { by: 'a', say: "Maybe. But it's telling off with a plan." },
      { by: 'b', conf: "{a} talks to me like a manager on a bad quarter. Weirdly, it's easier to take than the yelling." },
    ] },
  ],
  'long.blame.loss.any': [
    { id: 'nbl.b1', turns: [
      { by: 'a', say: "Can I be honest about today?" },
      { by: 'b', say: "You're going to be anyway." },
      { by: 'a', say: "You didn't pull your weight. I know you know it." },
      { by: 'b', say: "I know. I didn't need you to say it." },
      { by: 'a', conf: "I said it to {b}'s face so nobody can say I went behind {b}'s back later. That's the most honest thing I can do out here." },
    ] },
    { id: 'nbl.b2', when: { voice: ['schemer', 'cruel'] }, turns: [
      { by: 'a', conf: "Everybody saw {b} struggle today. I don't even have to start anything. I just have to stop people from forgiving {b} too fast." },
    ] },
    { id: 'nbl.b3', when: { voice: ['warm', 'emotional'] }, turns: [
      { by: 'a', say: "I'm not mad at you, about today." },
      { by: 'b', say: "But?" },
      { by: 'a', say: "But other people are, and I don't know how long I can keep telling them to calm down." },
      { by: 'b', say: "Who? Who's been talking?" },
      { by: 'a', say: "It doesn't matter who. It matters that it's more than one, and they're not getting quieter." },
      { by: 'b', say: "So what do I do? Apologise to everybody one at a time?" },
      { by: 'a', say: "Start by being useful. Fire, water, anything people can see. Give me something to point at." },
      { by: 'b', conf: "{a} is the only person defending me, and even {a} sounds tired of it." },
    ] },
  ],
};
