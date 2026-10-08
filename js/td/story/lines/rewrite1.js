// ══════════════════════════════════════════════════════════════════════
// td/story/lines/rewrite1.js — the short moments, rewritten (batch 1)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "I'm OK with those aired moments, but they need to follow the logic
// rules and need a rewrite... they need to pass by the director". Long versions of the engine's
// most-aired short moments, same meanings as the td/script/lines headers:
//   threat.notice.*    {a}, a strategist, to the camera about {b}, the challenge threat
//   conf.bigmove.*     {a} wants to make a move ('planner' has one; 'restless' wants one)
//   sitout.heat.any    {a} sat out, {tribe} lost, and this camp votes tonight
//   blind.denial.any   {b} voted against {a}, {a}'s ally; {a} still treats {b} as an ally
//   life.surprise.any  {a}, who nobody rated, is good at something; {b} is stunned
//   adv.exposed.*      on the way to the vote, {a}, holding an idol, reads the room
//   test.caught.any    {a} sees through the loyalty test {b} just tried on {a}
//   conf.excluded.any  {a} is left out of the group, and knows it
//   conf.paranoia.*    {a} is getting into {a.posAdj} own head
//   friend.joke.any    {a} and {b} have a running bit
//   friend.sunrise.any {a} and {b}, up before everyone, talking
//   friend.thanks.any  {a} thanks {b} for something {b} did
//   cross.flirt.any    {a} (team {mine}) and {b} (team {theirs}) flirt across the line
//   adv.found.<extravote|votesteal>  {a} finds an advantage, alone with the camera
//   adv.share.close    {a} gives {b} an idol before the vote
// {count} is never used here (it is the number of players left, not anyone's record).

const C = (id, lines, when, place = 'confessional') => ({ id, place, ...(when ? { when } : {}), turns: lines.map(t => ({ by: 'a', conf: t })) });

export default {
  'long.threat.notice.any': [
    C('rw.t1', ["Everybody's clapping for {b} after every challenge. I clap too. I'm just also counting.", "One day the teams are gone, and {b} is still that good. That's the day {b} becomes everybody's problem. I'd like it to be mine first."]),
    C('rw.t2', ["{b} keeps finishing near the top. Quietly. Nobody's saying it out loud yet.", "That's exactly when you start planning. Not when everyone's saying it. Before."], { register: ['schemer', 'cool'] }),
    C('rw.t3', ["I'm not jealous of {b}. I'm not. I just think if we let {b} keep winning, {b} wins the whole thing."], { register: ['fiery', 'competitor'] }),
    C('rw.t4', ["{b} is really, really good at the challenges. Like, scary good.", "Which is great for the team. I just don't know if it's great for me."], { register: ['sweet', 'shy', 'plain'] }),
    C('rw.t5', ["Teams are gone. {b} is still winning. Do the maths.", "If {b} gets a necklace every time it matters, the rest of us are just fighting over second place."], { merged: true }),
    C('rw.t6', ["{b} doesn't even look like {b}'s trying. That's the worst part.", "You can beat somebody who's trying hard. Somebody who makes it look easy, you have to vote out."]),
  ],
  'long.conf.bigmove.any': [
    C('rw.b1', ["I've been playing it safe. Too safe. I keep voting with the numbers and the numbers keep deciding for me.", "Next vote, I want it to be my name on the plan. Not somebody else's."]),
    C('rw.b2', ["I've got an idea. It's a big one. If it works, everybody's going to be talking about it.", "If it doesn't, they'll be talking about me on the way out. Worth it."], { register: ['schemer', 'fiery', 'competitor'] }),
    C('rw.b3', ["Everybody thinks I'm just along for the ride. That's useful. Right up until it isn't.", "At some point you have to steer, or you end up wherever the car goes."], { register: ['cool', 'plain'] }),
    C('rw.b4', ["I'm scared of making a move. I'm more scared of getting to the end and having nothing to say about how I got there."], { register: ['sweet', 'shy'] }),
    C('rw.b5', ["This late, every vote is somebody's big move. I want one of them to be mine."], { late: true }),
  ],
  'long.sitout.heat.any': [
    C('rw.s1', ["I sat out today. I didn't ask to. They told me to.", "And now we lost, and everybody's looking at the person who wasn't even out there. That's me. Great."]),
    C('rw.s2', ["Sitting out and losing is the worst combination there is.", "You don't get to help, you don't get to mess up, and somehow you still get blamed."], { register: ['fiery', 'competitor'] }),
    C('rw.s3', ["They sat me out, which tells me something. They think I'm the weakest.", "Tonight I find out if they think I'm the weakest enough to vote out."], { register: ['cool', 'schemer', 'plain'] }),
    C('rw.s4', ["I sat on the bench all challenge and watched us lose. I wanted to scream. I clapped instead.", "Now I have to talk to every single person before tonight, because I don't have a challenge to point to."], { register: ['sweet', 'shy'] }),
  ],
  'long.blind.denial.any': [
    { id: 'rw.d1', place: 'aside', turns: [
      { beat: "{a} sits down next to {b} {here}, like always." },
      { by: 'a', say: "Can you believe somebody voted against me last time?" },
      { by: 'b', say: "Crazy." },
      { by: 'a', say: "At least I know it wasn't you." },
      { by: 'b', say: "...Yeah. Of course." },
      { by: 'a', say: "You're the one person out here I don't have to wonder about." },
      { by: 'b', conf: "I wrote {a}'s name. And {a} just told me I'm the one person {a} doesn't have to wonder about. I need a minute." },
    ] },
    { id: 'rw.d2', place: 'work', turns: [
      { by: 'a', say: "Want to work together today? On the chores, I mean. I trust you to actually do your half." },
      { by: 'b', say: "Sure." },
      { by: 'a', say: "See, this is why we're good. No games." },
      { by: 'b', say: "No games." },
      { by: 'b', conf: "{a} thinks we're solid. We're not. I'm just not going to be the one who says so." },
    ] },
  ],
  'long.life.surprise.any': [
    { id: 'rw.u1', place: 'work', turns: [
      { beat: "{a} has done something {here} that nobody expected {a} to be able to do." },
      { by: 'b', say: "Wait. Since when can you do that?" },
      { by: 'a', say: "Since always? Nobody asked." },
      { by: 'b', say: "You could have said something! We've been struggling for days!" },
      { by: 'a', say: "You never asked me anything for days." },
      { by: 'b', conf: "I had {a} down as dead weight. I'm going to have to rethink that. Everyone is." },
      { by: 'a', conf: "People underestimate me. I don't mind. It's free information about them." },
    ] },
    { id: 'rw.u2', place: 'public', turns: [
      { by: 'b', say: "Okay, who taught you that?" },
      { by: 'a', say: "Nobody. I just figured it out." },
      { by: 'b', say: "You just figured it out." },
      { by: 'a', say: "Is that so hard to believe?" },
      { by: 'b', say: "Honestly? Kind of." },
      { by: 'a', say: "Thanks a lot." },
      { by: 'a', conf: "Every time I'm good at something, people act shocked. One day they're going to stop being shocked and start being worried." },
    ] },
  ],
  'long.adv.exposed.any': [
    C('rw.x1', ["On the way to the vote, I've got my hand on the idol in my pocket the whole time.", "Does anybody know? Nobody's said anything. That's either good or very, very bad."]),
    C('rw.x2', ["Something's off tonight. People keep looking at me, then looking away.", "If somebody knows about my idol, tonight's the night they'll try to make me waste it. Or the night I need it."], { register: ['cool', 'schemer'] }),
    C('rw.x3', ["I've never been this nervous. I have an idol and I don't know if tonight's the night to use it.", "Play it too early, I'm a target. Play it too late, I'm gone."], { register: ['sweet', 'shy', 'plain'] }),
    C('rw.x4', ["I'm walking into that vote with an idol and a bad feeling. Somebody's going to be very surprised tonight. I just hope it's not me."], { register: ['fiery', 'competitor'] }),
  ],
  'long.test.caught.any': [
    { id: 'rw.c1', place: 'aside', turns: [
      { by: 'b', say: "So, between us, I heard your name's coming up tonight." },
      { by: 'a', say: "Did you?" },
      { by: 'b', say: "Yeah. Just thought you should know." },
      { by: 'a', say: "Who said it?" },
      { by: 'b', say: "I can't say." },
      { by: 'a', say: "Mm. Of course you can't." },
      { by: 'a', conf: "{b} just tried to see if I'd run around camp panicking and spreading it. I'm not spreading anything. That was a test, and I'm not that easy." },
    ] },
    { id: 'rw.c2', place: 'secret', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'b', say: "Can I trust you with something?" },
      { by: 'a', say: "Depends. Is it real?" },
      { by: 'b', say: "What do you mean, is it real?" },
      { by: 'a', say: "I mean you've been feeding people little secrets all week to see where they go. I've noticed." },
      { by: 'b', say: "...Okay. Wow." },
      { by: 'a', conf: "If you want to test me, test me better than that." },
    ] },
  ],
  'long.conf.excluded.any': [
    C('rw.e1', ["There was a meeting today. I found out about it afterwards. From someone who was in it.", "That's how you know where you stand. Outside the meeting."]),
    C('rw.e2', ["Everyone went quiet when I walked over. Every single person.", "I'm not stupid. I know what that means."], { register: ['fiery', 'competitor', 'plain'] }),
    C('rw.e3', ["I keep sitting down and people keep finding reasons to leave. I'm trying not to take it personally. I'm taking it personally."], { register: ['sweet', 'shy'] }),
    C('rw.e4', ["They think they're leaving me out. Fine. People don't watch what they say around somebody they've already written off."], { register: ['schemer', 'cool'] }),
  ],
  'long.conf.paranoia.any': [
    C('rw.p1', ["I keep watching everybody. Who talks to who. Who stops talking when I walk up.", "Maybe I'm being crazy. Out here, crazy keeps you alive."]),
    C('rw.p2', ["Two people were laughing across camp today and I was sure it was about me. It probably wasn't.", "It might have been."], { register: ['sweet', 'shy', 'plain'] }),
    C('rw.p3', ["Everyone's being nice to me today. Too nice. Nice is what people are right before they write your name down."], { register: ['cool', 'schemer', 'fiery'] }),
  ],
  'long.friend.joke.any': [
    { id: 'rw.j1', place: 'public', turns: [
      { by: 'a', say: "Morning, partner." },
      { by: 'b', say: "Morning. Have you seen it?" },
      { by: 'a', say: "Seen what?" },
      { by: 'b', say: "Exactly." },
      { beat: "They both lose it. Nobody else has any idea what that means." },
      { by: 'c', say: "Are you two okay?" },
      { by: 'a', say: "Never better." },
      { by: 'b', conf: "We've had the same stupid joke since the second day. It's not even funny anymore. That's what makes it funny." },
    ] },
    { id: 'rw.j2', place: 'aside', turns: [
      { by: 'b', say: "Same rock?" },
      { by: 'a', say: "Same rock." },
      { beat: "{a} and {b} sit down on the same rock {here}, the way they do every day." },
      { by: 'b', say: "This is our rock now. Officially." },
      { by: 'a', say: "Nobody else is allowed on the rock." },
      { by: 'b', conf: "It's a rock. We know it's a rock. But it's our rock, and out here you hold on to anything that's yours." },
    ] },
  ],
  'long.friend.sunrise.any': [
    { id: 'rw.r1', place: 'water', turns: [
      { beat: "Before everyone's up. {a} and {b} are {here}, watching the light come up." },
      { by: 'b', say: "This is the only part of the day I like." },
      { by: 'a', say: "Because nobody's awake yet?" },
      { by: 'b', say: "Because nobody's playing yet." },
      { by: 'a', say: "Give it an hour." },
      { by: 'b', say: "I know. I just want the hour." },
      { by: 'a', conf: "Every morning, me and {b}, before the game starts. It's the only time out here I don't feel like I'm being watched. Except by the cameras. But those don't vote." },
    ] },
  ],
  'long.friend.thanks.any': [
    { id: 'rw.h1', place: 'aside', turns: [
      { by: 'a', say: "Hey. I never said thanks. For before." },
      { by: 'b', say: "You don't have to." },
      { by: 'a', say: "I know I don't have to. I want to." },
      { by: 'b', say: "Then you're welcome." },
      { by: 'a', say: "I'm going to pay you back. I don't know how yet." },
      { by: 'b', conf: "{a} thanked me. Out here people don't do that. It's going to make it really hard to vote against {a} one day." },
    ] },
  ],
  'long.cross.flirt.any': [
    { id: 'rw.f1', place: 'public', turns: [
      { by: 'a', say: "You know we're supposed to be enemies, right?" },
      { by: 'b', say: "I've heard." },
      { by: 'a', say: "So why do you keep smiling at me?" },
      { by: 'b', say: "Why do you keep noticing?" },
      { beat: "Somebody from {theirs} clears their throat across camp." },
      { by: 'b', say: "I should go." },
      { by: 'a', say: "You should." },
      { beat: "{b} doesn't go for another minute." },
      { by: 'a', conf: "I'm not supposed to like anyone on {theirs}. Nobody told {b} that, apparently." },
    ] },
  ],
  'long.adv.found.extravote': [
    C('rw.v1', ["An Extra Vote. One vote nobody's counting on but me.", "At the right vote, one name can decide the whole thing. And I get to write it twice."], null, 'secret'),
  ],
  'long.adv.found.votesteal': [
    C('rw.v2', ["A Vote Steal. I can take somebody's vote and use it myself.", "Somebody out here is going to show up to vote thinking they matter. And they won't."], null, 'secret'),
  ],
  'long.adv.share.close': [
    { id: 'rw.a1', place: 'secret', turns: [
      { by: 'a', say: "Take this. Don't argue." },
      { by: 'b', say: "Is that... are you serious?" },
      { by: 'a', say: "Your name's coming up tonight. Mine isn't. If they try it, you play it." },
      { by: 'b', say: "I can't take your idol." },
      { by: 'a', say: "You're not taking it. I'm giving it to you. There's a difference." },
      { by: 'b', conf: "{a} just handed me the most valuable thing in this game. I don't know if I'll ever be able to pay that back." },
      { by: 'a', conf: "An idol in my pocket doesn't help me if my best ally goes home tonight. This is me protecting my game. And my friend." },
    ] },
  ],
  'long.crowd.chores.any': [
    { id: 'rw.ch1', place: 'work', turns: [
      { beat: "Chores {here}. Somebody has to start, and it's {a}." },
      { by: 'a', say: "Okay. If everybody does one thing, we're done in ten minutes." },
      { by: 'b', say: "And if nobody does anything?" },
      { by: 'a', say: "Then we live in filth and lose the next challenge because we're miserable." },
      { by: 'c', say: "Fine. I'll do one thing." },
      { by: 'a', say: "One thing is all I ask." },
      { by: 'b', conf: "{a} is the only reason this camp is still standing. I'd never tell {a} that. It would go straight to {a.posAdj} head." },
    ] },
    { id: 'rw.ch2', place: 'work', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "Does anyone want to help? It's okay if not." },
      { by: 'b', say: "I'll help." },
      { by: 'c', say: "Me too, I guess." },
      { by: 'a', say: "Really? Thanks, you guys." },
      { by: 'c', say: "Don't make it weird." },
      { by: 'a', conf: "Nobody ever volunteers until somebody asks nicely. I'm really good at asking nicely." },
    ] },
    { id: 'rw.ch3', place: 'work', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'a', say: "Funny how the same three people always do the work." },
      { by: 'b', say: "Is that a complaint?" },
      { by: 'a', say: "It's an observation. People remember who helped. And who didn't." },
      { by: 'c', say: "You're doing chores for votes." },
      { by: 'a', say: "I'm doing chores because they need doing. The votes are a bonus." },
      { by: 'c', conf: "{a} has a plan for everything. Even the dishes." },
    ] },
  ],
  'long.talk.plan.any': [
    { id: 'rw.pl1', place: 'aside', turns: [
      { by: 'a', say: "Okay, so where's your head at?" },
      { by: 'b', say: "Honestly? Everywhere. Yours?" },
      { by: 'a', say: "Same place. I just wanted to check I'm not the only one panicking." },
      { by: 'b', say: "You're definitely not." },
      { by: 'a', say: "Good. Then let's panic together. And quietly." },
      { by: 'b', conf: "{a} and I don't have a deal. We just talk. Weirdly, I trust that more than half the deals out here." },
    ] },
  ],
  'long.friend.bond.any': [
    { id: 'rw.fb1', place: 'fire', turns: [
      { beat: "{a} and {b} are the last two still up {here}." },
      { by: 'b', say: "You know what I like about you?" },
      { by: 'a', say: "My incredible strategic mind?" },
      { by: 'b', say: "You don't pretend. Everybody else is pretending all the time." },
      { by: 'a', say: "I'm pretending right now. I'm pretending I'm not tired." },
      { by: 'b', say: "Then go to bed." },
      { by: 'a', say: "Five more minutes." },
      { by: 'b', conf: "{a} is the closest thing I've got to a friend out here. I know that's dangerous. I don't care right now." },
    ] },
    { id: 'rw.fb2', place: 'water', turns: [
      { by: 'a', say: "Can I tell you something? You're the only person here I'd actually hang out with after." },
      { by: 'b', say: "After what?" },
      { by: 'a', say: "After all of it. The game. Outside." },
      { by: 'b', say: "...Yeah. Me too." },
      { by: 'a', say: "Don't tell anyone. They'll make it a strategy thing." },
      { by: 'a', conf: "It's not strategy. It's just nice to have one person out here who isn't strategy." },
    ] },
  ],
};
