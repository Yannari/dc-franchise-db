// ══════════════════════════════════════════════════════════════════════
// td/story/lines/alliance2.js — big groups, endings, flips and side deals
// ══════════════════════════════════════════════════════════════════════
//
// Same contract as alliance.js. Meanings (from the engine's own pool headers):
//   alliance.form.pitch with members 'many': {a} recruits {b} and {c}; anyone
//     past them is {more} (a name or "X and Y"; may be absent).
//   alliance.end.<betrayal|collapsed|both>: two members of {group} admit it's
//     over ('betrayal': someone broke rank, {betrayer} when known).
//   alliance.expel.<voted|repeated>: {a} tells {b} {b}'s out of {group}
//     ('voted': {b} voted against one of them; 'repeated': kept breaking rank).
//   fallout.flip.<ally|swap|plain>: {a} flipped last night and nobody knows.
//     'ally': {a} voted against {b}, an ally still here, who is friendly to {a}
//     (the viewer knows, {b} does not). 'swap': {a} wrote {wrote} instead of
//     {plan}. 'plain': {wrote} optional.
//   deal.side.<genuine|hollow>: {a} offers {b} a final {size} ('two' or
//     'three'); 'hollow': {a} doesn't mean it, and only {a}'s confessional says so.

export default {
  'long.alliance.form.pitch': [
    { id: 'lb.m1', place: 'secret', when: { third: true, members: 'many', more: true }, turns: [
      { beat: "One by one, {a} gets {b}, {c} and {more} to slip away to {place}." },
      { by: 'c', say: "Okay, this is a lot of people for a secret." },
      { by: 'a', say: "It's exactly enough people for a secret that wins votes." },
      { by: 'b', say: "Say what this is before somebody comes looking for us." },
      { by: 'a', say: "This is a majority. Count us." },
      { beat: "{c} counts. Then counts again." },
      { by: 'c', say: "...Oh." },
      { by: 'a', say: "Yeah. Oh. As long as we stick together, nobody in this group goes home until everyone outside it has." },
      { by: 'b', say: "And then?" },
      { by: 'a', say: "And then we deal with it then. I'm not going to pretend I know who wins a fight that far away." },
      { by: 'c', say: "At least you're honest about it." },
      { by: 'a', say: "{group}. That's us. Nobody says it out loud outside this circle." },
      { by: 'b', conf: "Big alliances are great right up until they're not. I give it three votes before somebody looks at the person next to them." },
      { by: 'c', conf: "In a group this big, you want to be the one everyone thinks is loyal. I'm going to be very, very loyal." },
    ] },
    { id: 'lb.m2', place: 'secret', when: { third: true, members: 'many' }, turns: [
      { beat: "{a} has called a meeting at {place}. {b} and {c} are the last to arrive." },
      { by: 'b', say: "Is everybody here?" },
      { by: 'a', say: "Everybody who matters." },
      { by: 'c', say: "That's a creepy thing to say." },
      { by: 'a', say: "It's a true thing to say. Look around. Everyone here has been on the edge of a vote at some point. That stops tonight." },
      { by: 'b', say: "You're saying we vote as a block. All of us." },
      { by: 'a', say: "All of us. One name. And whoever's name it is, they find out when it's read." },
      { by: 'c', say: "And who picks the name?" },
      { by: 'a', say: "We talk. We agree. If we can't agree, we go with whoever's most dangerous to the group." },
      { by: 'c', say: "And who decides who's dangerous?" },
      { by: 'a', say: "...We'll get to that." },
      { by: 'b', say: "We should probably get to that." },
      { by: 'a', say: "{group}. Agreed?" },
      { by: 'c', say: "Agreed. For now." },
      { by: 'c', conf: "{a} didn't answer my question. That's fine. I know who's going to decide who's dangerous. It's {a}." },
    ] },
  ],

  'long.alliance.end.any': [
    { id: 'lb.e1', place: 'aside', turns: [
      { by: 'a', say: "So that's it, then." },
      { by: 'b', say: "What's it?" },
      { by: 'a', say: "{group}. It's done. We both know it." },
      { by: 'b', say: "Is it? Nobody's said anything." },
      { by: 'a', say: "Nobody has to. We haven't had a real conversation in days. When was the last time we actually planned something together?" },
      { by: 'b', say: "...Yeah. Okay. I don't remember." },
      { by: 'a', say: "Me neither." },
      { by: 'b', say: "So what now? We just pretend we were never in it?" },
      { by: 'a', say: "Now we're two people who used to be in an alliance. Which means we know exactly how the other one plays." },
      { by: 'b', say: "That's not scary at all." },
      { by: 'b', conf: "Alliances out here don't end with a fight. They just stop. And one day you look up and realise you're on your own." },
    ] },
  ],
  'long.alliance.end.betrayal': [
    { id: 'lb.e2', place: 'aside', when: { betrayer: true }, turns: [
      { by: 'b', say: "You heard about {betrayer}?" },
      { by: 'a', say: "Everyone's heard about {betrayer}." },
      { by: 'b', say: "{group} was supposed to mean something." },
      { by: 'a', say: "It did. Until {betrayer} decided {betrayer.posAdj} vote meant more." },
      { by: 'b', say: "So is it over? Or do we just carry on without {betrayer.obj}?" },
      { by: 'a', say: "Carry on with what? Two people and a name? That's not an alliance, that's a memory." },
      { by: 'b', say: "That's really depressing." },
      { by: 'a', say: "It's really true." },
      { by: 'a', conf: "The second somebody breaks rank, everybody else starts wondering who's next. {group} was over the moment {betrayer} did it." },
    ] },
    { id: 'lb.e3', place: 'aside', turns: [
      { by: 'a', say: "Somebody in {group} didn't vote with us. You know that, right?" },
      { by: 'b', say: "I know." },
      { by: 'a', say: "So either it was you, or it was somebody else, and either way we can't trust the group anymore." },
      { by: 'b', say: "It wasn't me." },
      { by: 'a', say: "That's what whoever did it would say." },
      { by: 'b', say: "That's what you'd say too." },
      { by: 'a', say: "...Fair." },
      { by: 'b', say: "So we're done." },
      { by: 'a', say: "We're done." },
      { by: 'b', conf: "I didn't flip. But I can't prove it, and in this game, if you can't prove it, you did it." },
    ] },
  ],
  'long.alliance.end.collapsed': [
    { id: 'lb.e4', place: 'aside', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "I'm gonna say what everyone's thinking. {group} is dead." },
      { by: 'b', say: "Wow. Okay. Good morning to you too." },
      { by: 'a', say: "We can't be in the same room without fighting. That's not an alliance. That's a hostage situation." },
      { by: 'b', say: "We could try to fix it." },
      { by: 'a', say: "With what? Group hugs? I'm done." },
      { by: 'b', say: "Fine. Then don't come crying to me when you need a vote." },
      { by: 'a', say: "I won't." },
      { by: 'b', conf: "{a} just blew up the only group that was keeping {a.obj} safe. I'm not going to stop {a.obj}." },
    ] },
  ],

  'long.alliance.expel.voted': [
    { id: 'lb.x1', place: 'secret', turns: [
      { beat: "{a} waits for {b} to come back alone from {place}." },
      { by: 'a', say: "We need to talk." },
      { by: 'b', say: "If this is about the vote—" },
      { by: 'a', say: "It's about the vote." },
      { by: 'b', say: "I had my reasons." },
      { by: 'a', say: "I'm sure you did. They just weren't {group}'s reasons." },
      { by: 'b', say: "So that's it? One vote and I'm out?" },
      { by: 'a', say: "One vote against one of us. Yeah. That's it." },
      { by: 'b', say: "You'd have done the same thing if it was your neck." },
      { by: 'a', say: "Maybe. But I'd have told you first." },
      { beat: "{a} walks away. {b} doesn't follow." },
      { by: 'b', conf: "Fine. I'm not in {group} anymore. That means I don't owe them anything either. Let's see how they like that." },
    ] },
    { id: 'lb.x2', place: 'aside', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "I'm really sorry. I wanted to be the one to tell you, so you didn't hear it from someone else." },
      { by: 'b', say: "Tell me what?" },
      { by: 'a', say: "{group} talked. After how you voted. They don't want you in it anymore." },
      { by: 'b', say: "They? Or you?" },
      { by: 'a', say: "...All of us. I'm sorry. I didn't fight it." },
      { by: 'b', say: "Wow. At least you're honest." },
      { by: 'a', say: "I'm trying to be." },
      { by: 'a', conf: "I hate this part of the game. I hate it so much." },
      { by: 'b', conf: "{a} looked about ready to cry. {a} still did it, though." },
    ] },
  ],
  'long.alliance.expel.repeated': [
    { id: 'lb.x3', place: 'aside', turns: [
      { by: 'a', say: "How many times is that now?" },
      { by: 'b', say: "How many times is what?" },
      { by: 'a', say: "That you've gone your own way when {group} had a plan." },
      { by: 'b', say: "I vote how I think is best. That's allowed." },
      { by: 'a', say: "It is. On your own. Which is what you are now." },
      { by: 'b', say: "You're kicking me out?" },
      { by: 'a', say: "You kicked yourself out. I'm just the one saying it out loud." },
      { by: 'b', conf: "{group} wanted a sheep. I'm not a sheep. Their loss." },
    ] },
  ],

  'long.fallout.flip.ally': [
    { id: 'lb.f1', place: 'aside', when: { count: true }, turns: [
      { beat: "Morning. {b} brings {a} a cup of water and sits down next to {a.obj}." },
      { by: 'b', say: "Here. You look like you didn't sleep." },
      { by: 'a', say: "Thanks. I didn't, really." },
      { by: 'b', say: "Last night was crazy. I still can't believe somebody wrote my name." },
      { by: 'a', say: "Yeah. Crazy." },
      { by: 'b', say: "Whoever wrote my name down, I'm going to find out. You'd tell me if you heard anything, right?" },
      { by: 'a', say: "Of course." },
      { by: 'b', say: "That's why I trust you. You're the only one out here who doesn't play games with me." },
      { beat: "{a} drinks the water. It takes a long time." },
      { by: 'a', conf: "I wrote {b}'s name. And {b} just brought me water and told me I'm the only person {b} trusts. I need to be a much better liar, or a much worse person." },
    ] },
    { id: 'lb.f2', place: 'aside', when: { register: ['schemer', 'cool'], count: true }, turns: [
      { by: 'b', say: "Can you believe somebody voted for me?" },
      { by: 'a', say: "I can believe a lot of things out here." },
      { by: 'b', say: "I've got a list of suspects. Want to hear it?" },
      { by: 'a', say: "Sure. Hit me." },
      { by: 'b', say: "Okay, so first..." },
      { beat: "{a} nods along. {a.posAdj} own name is not on the list." },
      { by: 'a', say: "Those are all good guesses." },
      { by: 'b', say: "Right? I knew you'd see it." },
      { by: 'a', conf: "{b} was a vote I could afford to lose. Now {b} is a vote I get to keep. Best of both worlds." },
    ] },
    { id: 'lb.f6', place: 'aside', when: { count: false }, turns: [
      { beat: "Morning. {b} sits down next to {a} with two cups of water and hands {a.obj} one." },
      { by: 'b', say: "Did you sleep? I didn't sleep." },
      { by: 'a', say: "Not really." },
      { by: 'b', say: "Every time it comes down to the last {item}, I think it's going to be me. Every single time." },
      { by: 'a', say: "It wasn't you, though." },
      { by: 'b', say: "Because I've got people. I've got you." },
      { by: 'a', say: "...Yeah. You've got me." },
      { by: 'a', conf: "{b} has no idea I wrote {b.posAdj} name last night. And the way {b} just looked at me, I'm going to have to live with that for a while." },
    ] },
  ],
  'long.fallout.flip.swap': [
    { id: 'lb.f3', place: 'confessional', turns: [
      { by: 'a', conf: "The plan last night was {plan}. Everybody knew the plan. I wrote {wrote}." },
      { by: 'a', conf: "Why? Because if everybody follows the plan, then whoever made the plan is running this game. And it's not me. Not yet." },
      { by: 'a', conf: "Nobody knows it was me. Let's keep it that way." },
    ] },
    { id: 'lb.f4', place: 'confessional', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', conf: "I was supposed to vote {plan}. I didn't. I wrote {wrote}." },
      { by: 'a', conf: "I know. I KNOW. But my hand just... I couldn't write {plan}'s name. And now everybody's walking around trying to work out who flipped and I'm helping them look." },
      { by: 'a', conf: "I'm a terrible person. A terrible person who's still in the game." },
    ] },
  ],
  'long.fallout.flip.plain': [
    { id: 'lb.f5', place: 'confessional', turns: [
      { by: 'a', conf: "Everybody thinks they know how last night's vote went. They don't. I didn't vote with the group." },
      { by: 'a', conf: "It didn't change who went home. It did change something, though. Now I know I can do it. And so does nobody else." },
    ] },
  ],

  'long.deal.side.genuine': [
    { id: 'lb.d1', place: 'secret', turns: [
      { beat: "{a} and {b} are {here}, keeping their voices low." },
      { by: 'a', say: "Can I ask you something and you give me a real answer? Not a game answer?" },
      { by: 'b', say: "I'll try." },
      { by: 'a', say: "If you had to pick the people you'd sit next to at the very end. Final {size}. Who are they?" },
      { by: 'b', say: "That's a big question." },
      { by: 'a', say: "I'll go first. You're on mine." },
      { by: 'b', say: "...Seriously?" },
      { by: 'a', say: "Seriously. I'm not saying it to get something. I'm saying it because it's true, and I want it to be true for you too." },
      { by: 'b', say: "Okay. Yeah. You're on mine too." },
      { by: 'a', say: "So it's a deal. Final {size}. Whatever happens with everybody else." },
      { by: 'b', say: "Whatever happens with everybody else." },
      { by: 'b', conf: "People make final {size} deals out here all the time. Most of them are lies. This one didn't feel like one." },
    ] },
    { id: 'lb.d2', place: 'aside', when: { size: 'two' }, turns: [
      { by: 'b', say: "Why are you being so weird today?" },
      { by: 'a', say: "Because I'm about to say something cheesy, and I'm working up to it." },
      { by: 'b', say: "Oh no." },
      { by: 'a', say: "Final two. You and me. I mean it." },
      { by: 'b', say: "That's not cheesy. That's huge." },
      { by: 'a', say: "Is that a yes?" },
      { by: 'b', say: "It's a yes. But if you're lying, I'll know." },
      { by: 'a', say: "If I'm lying, you can push me in the lake." },
      { by: 'b', say: "Deal. I'm holding you to that part too." },
      { by: 'a', conf: "I've made a lot of promises out here. This is the first one I actually plan on keeping." },
    ] },
  ],
  'long.deal.side.hollow': [
    { id: 'lb.d3', place: 'secret', turns: [
      { beat: "{a} has picked {place} on purpose. Nobody comes here." },
      { by: 'a', say: "I've been thinking about the end. Like, the real end." },
      { by: 'b', say: "Already?" },
      { by: 'a', say: "Somebody has to. And when I think about it, I think about you. Final {size}." },
      { by: 'b', say: "Wow. Okay. Where's this coming from?" },
      { by: 'a', say: "You're loyal. You don't flip. That's who I want next to me when it gets ugly." },
      { by: 'b', say: "I... yeah. Okay. Me too. Final {size}." },
      { by: 'a', say: "Final {size}." },
      { beat: "They shake on it. {a} holds on a second longer than {b} does." },
      { by: 'a', conf: "Do I mean it? Right now? Sure. Will I mean it in a week? We'll see. A deal costs nothing to make." },
      { by: 'b', conf: "I feel safe for the first time out here." },
    ] },
    { id: 'lb.d4', place: 'aside', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Can I tell you something I haven't told anyone?" },
      { by: 'b', say: "That depends. Is it going to get me voted out?" },
      { by: 'a', say: "It's going to get you to the end. You and me. Final {size}. I've already decided." },
      { by: 'b', say: "You've decided? Just like that?" },
      { by: 'a', say: "Just like that. I trust my gut, and my gut says you." },
      { by: 'b', say: "Your gut says me." },
      { by: 'a', say: "My gut says you." },
      { by: 'b', say: "...Okay. Then mine says you too." },
      { by: 'a', conf: "My gut says a lot of things to a lot of people. That's the beauty of a gut. Nobody can check it." },
    ] },
  ],
};
