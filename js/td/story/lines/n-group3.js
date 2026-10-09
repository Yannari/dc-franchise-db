// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-group3.js — the team project and the safe night's downtime
// ══════════════════════════════════════════════════════════════════════
//
// camp-events.js _crowdScenes, from the real shows' most common group scenes (transcripts,
// 2026-10-08): a team job with a self-appointed leader and somebody pushing back ("Who died and
// made you leader?!"), and a team that is safe tonight talking about nothing much.
//   crowd.project  a takes charge, b pushes back (bond a-b drops), c and d pitch in
//   crowd.banter   a, b, c and d, safe tonight, unwind (everyone a little closer)
// Ids: 'nj.'.

export default {
  'long.crowd.project.any': [
    { id: 'nj.p1', place: 'work', turns: [
      { beat: "The {quarters} needs fixing. {a} has decided to be in charge of fixing it." },
      { by: 'a', say: "Okay, listen up, {c} and {d}, you get the branches, and {b}, you hold the frame." },
      { by: 'b', move: 'pushback.lead' },
      { by: 'a', say: "Look, somebody has to say something, or we're sleeping in the rain again." },
      { by: 'c', say: "I'm good with branches." },
      { by: 'd', say: "Me too. Branches are easy." },
      { by: 'b', say: "Fine. But I'm holding it my way." },
      { by: 'a', say: "Hold it any way you want. Just hold it." },
      { beat: "Two hours later, it's standing. Mostly." },
      { by: 'b', conf: "{a} bosses everybody around and it drives me crazy, and the worst part is it worked." },
      { by: 'a', conf: "I don't need {b} to like me. I need {b} to hold the wall up." },
    ] },
    { id: 'nj.p2', place: 'work', when: { voice: ['bossy', 'loud', 'competitive', 'tough'] }, turns: [
      { by: 'a', say: "Team meeting, right now, everybody!" },
      { by: 'd', say: "It's seven in the morning." },
      { by: 'a', say: "Exactly, the other team is still asleep, and that's how we beat them." },
      { by: 'b', say: "We're not beating anybody by fixing a fire pit." },
      { by: 'a', say: "We're beating them by being organised. You're on rocks, {b}." },
      { by: 'b', move: 'pushback.lead' },
      { by: 'c', say: "I'll do rocks. Can we just get it done?" },
      { by: 'a', say: "Thank you, {c}! See? That's teamwork." },
      { by: 'b', conf: "{a} thinks being loud is the same as being a leader. It isn't. I'm going to make sure everybody notices." },
      { by: 'c', conf: "Every morning it's {a} giving orders and {b} saying no. I just want breakfast." },
    ] },
    { id: 'nj.p3', place: 'work', when: { voice: ['warm', 'earnest', 'calm'] }, turns: [
      { by: 'a', say: "Hey, everybody. I was thinking, if we split up, we could get the camp sorted before the challenge." },
      { by: 'c', say: "Sounds good. What do you need?" },
      { by: 'a', say: "Maybe {c} and {d} on water? And {b}, would you help me with the fire?" },
      { by: 'b', say: "Why do you get to decide?" },
      { by: 'a', say: "I don't, I'm just suggesting, you can pick anything you want." },
      { by: 'b', say: "...Fine. Fire's fine." },
      { by: 'd', say: "Water it is." },
      { by: 'a', conf: "I wasn't trying to be the boss. I just wanted us to be ready. I think {b} heard it wrong." },
      { by: 'b', conf: "{a} is so nice about it, nobody notices {a} is running the whole camp. I notice." },
    ] },
    { id: 'nj.p4', place: 'work', turns: [
      { by: 'a', say: "Okay, nobody slept last night, so today we fix everything, the {quarters}, the fire, all of it." },
      { by: 'b', say: "Fixing the {quarters} isn't going to win a challenge." },
      { by: 'a', say: "Sleeping in a dry bed might." },
      { by: 'd', say: "That's actually fair." },
      { by: 'c', say: "I slept in a puddle last night. I'm in." },
      { by: 'b', say: "Fine. But if we lose today, it's not because of the roof." },
      { by: 'c', conf: "I feel like I'm stuck between two people pulling on the same rope, and I'm the rope.", v: {"goofy":"Watching {a} and {b} argue is like watching my parents fight about directions. I'm just in the back seat."} },
    ] },
    { id: 'nj.p5', place: 'work', when: { voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [
      { beat: "{a} is directing the work {here} without lifting anything." },
      { by: 'b', say: "Are you going to help, or just point?" },
      { by: 'a', say: "Pointing is helping. Somebody has to see the big picture." },
      { by: 'd', say: "The big picture is that log. It's heavy." },
      { by: 'a', say: "Then lift with your legs." },
      { by: 'c', say: "Just grab an end, {a}." },
      { beat: "{a} grabs an end. Barely." },
      { by: 'b', conf: "{a} wants to look like the leader without doing any of the work. Everybody saw. I made sure everybody saw." },
    ] },
  ],
  'long.crowd.banter.any': [
    { id: 'nj.b1', place: 'fire', turns: [
      { beat: "No vote tonight. {a}, {b}, {c} and {d} sit around the fire with nothing to plot." },
      { by: 'a', say: "Okay, what's the worst thing you've eaten since we got here? Go." },
      { by: 'b', say: "That thing on day two." },
      { by: 'c', say: "Day two moved." },
      { by: 'd', say: "Day two is still moving. Inside me." },
      { by: 'a', say: "That's disgusting." },
      { by: 'd', say: "You asked!" },
      { by: 'c', conf: "Nights like this, I forget it's a game. Then I remember. But for about an hour, I forgot." },
    ] },
    { id: 'nj.b2', place: 'fire', turns: [
      { by: 'b', say: "What's the first thing you're doing when you get home?" },
      { by: 'a', say: "Shower for an hour. Maybe two." },
      { by: 'd', say: "Sleep in an actual bed." },
      { by: 'c', say: "Eat something I can recognise." },
      { by: 'b', say: "I'm going to sit on a couch and not move for a week." },
      { by: 'a', say: "That sounds amazing." },
      { by: 'd', say: "That sounds like heaven." },
      { by: 'b', conf: "We're all so tired. And it's kind of nice being tired together." },
    ] },
    { id: 'nj.b3', place: 'public', turns: [
      { by: 'c', say: "Okay, real question. If {host} had to do one of our challenges, which one?" },
      { by: 'a', say: "The worst one. Obviously." },
      { by: 'd', say: "And we get to watch." },
      { by: 'b', say: "And we get to make fun of the hair." },
      { by: 'c', say: "Nobody touches the hair." },
      { by: 'a', say: "Somebody has to touch the hair eventually." },
      { beat: "Everybody laughs." },
      { by: 'd', conf: "We spent twenty minutes planning revenge on {host}. It's never going to happen. It was the best twenty minutes of my week." },
    ] },
    { id: 'nj.b4', place: 'fire', when: { voice: ['goofy', 'chaotic', 'theatrical', 'loud'] }, turns: [
      { by: 'a', say: "I've got a game. It's called Would You Rather, Camp Edition." },
      { by: 'b', say: "Oh no." },
      { by: 'a', say: "Would you rather eat the food here every day for a year, or sleep next to {c}'s feet for a month?" },
      { by: 'c', say: "Hey!" },
      { by: 'd', say: "...Can I think about it?" },
      { by: 'c', say: "You need to THINK about it?" },
      { by: 'b', conf: "{a} turns everything into a game, a really stupid game, and I love these idiots." },
    ] },
    { id: 'nj.b5', place: 'fire', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [
      { by: 'a', say: "Can I say something cheesy?" },
      { by: 'b', say: "No." },
      { by: 'a', say: "I'm really glad you guys are here, that's it, that's the cheesy thing." },
      { by: 'c', say: "Aw." },
      { by: 'd', say: "That was very cheesy." },
      { by: 'b', say: "...I'm glad you're here too. Don't tell anybody." },
      { by: 'a', conf: "One of us is going home eventually, I know that, but tonight I'm not thinking about it." },
    ] },
    { id: 'nj.b6', place: 'public', when: { merged: false }, turns: [
      { by: 'b', say: "Do you think the other team is having as much fun as us?" },
      { by: 'a', say: "They're voting someone out tonight. So, no." },
      { by: 'c', say: "Should we feel bad?" },
      { by: 'd', say: "A little. Not a lot." },
      { by: 'a', say: "Not at all. We won." },
      { by: 'c', conf: "Winning means a night with no plotting, no whispering, no vote. I want every night to be like this." },
    ] },
  ],
};
