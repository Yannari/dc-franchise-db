// ══════════════════════════════════════════════════════════════════════
// td/story/lines/crowd.js — three people at camp, and two across the team line
// ══════════════════════════════════════════════════════════════════════
//
// The quick cuts between the long scenes (director.js), at the shows' length: four to
// eight lines, the camp's day under them, everyone sounding like themselves. Meanings from
// js/td/script/lines/crowd.js and cross.js:
//   crowd.meal.any    breakfast: a (the most sociable), b and c (a's closest) over the food
//   crowd.chores.any  the morning's work: a leads it, b and c pitch in
//   crowd.dinner.any  the evening meal: a, b and c pick over the day
//   crowd.nerves.any  the team going to the vote tonight: a, b and c waiting
//   crowd.huddle.any  a, b and c, of {group}, close ranks before the vote
//   crowd.immune.any  after the merge: a just won immunity; b is glad, c is not
//   crowd.clash.any   a and b can't stand each other and go at it in front of everyone; c steps in
//   cross.rival.any   a (team {mine}) and b (team {theirs}) trade shots in public
//   cross.friend.any  a and b get along anyway
//   cross.spy.any     a fishes b for what b's side is planning ('leak': b lets something slip;
//                     'shut': b sees it coming)
// registerC is how c talks.

export default {
  'long.crowd.meal.any': [
    { id: 'cr.m1', place: 'eat', turns: [
      { beat: "Breakfast {here}. Today it's grey, and it's lumpy." },
      { by: 'b', say: "What is this?" },
      { by: 'a', say: "Breakfast. Don't ask questions you don't want answers to." },
      { by: 'c', say: "I think it moved." },
      { by: 'a', say: "It didn't move. You moved. Eat it." },
      { by: 'b', say: "You first." },
      { beat: "{a} takes a big spoonful, chews, and swallows with a straight face." },
      { by: 'a', say: "Delicious." },
      { by: 'c', say: "You're crying." },
      { by: 'a', say: "Tears of joy." },
    ] },
    { id: 'cr.m2', place: 'eat', when: { register: ['sweet', 'shy'] }, turns: [
      { beat: "{a} has saved seats for {b} and {c} {here}, the way {a} does every morning." },
      { by: 'a', say: "Okay, I have a question and you both have to answer honestly. What's the first thing you're eating when we get home?" },
      { by: 'b', say: "A burger. A huge one." },
      { by: 'c', say: "Anything that isn't this." },
      { by: 'a', say: "That's not an answer!" },
      { by: 'c', say: "Fine. Pancakes. A whole stack." },
      { by: 'a', say: "See? Now we're all hungry and sad. That's bonding." },
      { by: 'b', conf: "{a} makes this place feel a little less terrible. I'd never say that out loud." },
    ] },
    { id: 'cr.m3', place: 'eat', when: { register: ['schemer', 'cool'] }, turns: [
      { beat: "Breakfast {here}. {a} is watching everyone else while pretending to eat." },
      { by: 'b', say: "What are you looking at?" },
      { by: 'a', say: "Who's sitting with who. It changed overnight." },
      { by: 'c', say: "It's breakfast. People sit wherever." },
      { by: 'a', say: "Nobody sits wherever. Look over there. Those two weren't talking yesterday." },
      { by: 'b', say: "...Huh. You're right." },
      { by: 'c', say: "Can we just eat? Please?" },
      { by: 'a', conf: "Breakfast tells you everything. Who's whispering, who's tired, who didn't sleep because they were planning something." },
    ] },
    { id: 'cr.m4', place: 'eat', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Who took the last of the good stuff?" },
      { by: 'b', say: "There was good stuff?" },
      { by: 'a', say: "There was ONE good thing out here and somebody ate it." },
      { by: 'c', say: "It wasn't me." },
      { by: 'a', say: "You've got crumbs on your face." },
      { by: 'c', say: "Those are old crumbs." },
      { by: 'a', say: "Old crumbs?! What does that even mean?!" },
      { by: 'b', conf: "Every morning, {a} finds something to be mad about. Today it's crumbs. Yesterday it was the sun." },
    ] },
    { id: 'cr.m5', place: 'eat', when: { lastBoot: true }, turns: [
      { by: 'b', say: "It's weird having breakfast without {lastBoot}." },
      { by: 'a', say: "Yeah. More food, though." },
      { by: 'c', say: "{a}!" },
      { by: 'a', say: "What? I'm being honest. I miss {lastBoot}, and also there's more food." },
      { by: 'b', say: "You can't say both of those." },
      { by: 'a', say: "Watch me. I miss {lastBoot}. More food." },
      { by: 'c', conf: "{a} has no filter. Somehow that makes it easier to trust {a} than anyone else at this table." },
    ] },
    { id: 'cr.m6', place: 'eat', when: { register: ['competitor', 'plain'] }, turns: [
      { by: 'a', say: "Eat up. Big day today." },
      { by: 'b', say: "We don't even know what the challenge is yet." },
      { by: 'a', say: "Doesn't matter. Whatever it is, you'll want to have eaten." },
      { by: 'c', say: "Unless it's an eating challenge." },
      { by: 'a', say: "Then you'll want to have NOT eaten. Okay. Half a bowl." },
      { by: 'b', say: "This is the most stressful breakfast of my life." },
      { by: 'a', conf: "I'm not saying I'm the team captain. I'm just saying somebody has to think about these things." },
    ] },
  ],

  'long.crowd.chores.any': [
    { id: 'cr.c1', place: 'work', when: { venue: ['hosted-camp', 'survival-island', 'carnival'] }, turns: [
      { beat: "Chores {here}. {a} has, as usual, decided who does what." },
      { by: 'a', say: "Okay. {b}, you're on wood. {c}, water. I'll do the hard part." },
      { by: 'c', say: "What's the hard part?" },
      { by: 'a', say: "Supervising." },
      { by: 'b', say: "That's not a part. That's standing there." },
      { by: 'a', say: "Standing there and making sure it gets done. It's a skill." },
      { by: 'c', conf: "Every team has somebody who thinks pointing is a job. Ours is {a}." },
    ] },
    { id: 'cr.c2', place: 'work', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "I can do the dishes again, if nobody else wants to." },
      { by: 'b', say: "You did them yesterday." },
      { by: 'a', say: "I don't mind. Honestly. It's kind of relaxing." },
      { by: 'c', say: "Nobody finds dishes relaxing." },
      { by: 'a', say: "I do! It's the only time anyone leaves me alone out here." },
      { by: 'b', say: "...Okay, that's actually a really good point. I'll dry." },
      { by: 'b', conf: "{a} does everything for everyone. Somebody should be looking out for {a} for once." },
    ] },
    { id: 'cr.c3', place: 'work', when: { register: ['fiery', 'competitor'], venue: ['hosted-camp', 'film-lot', 'world-tour'] }, turns: [
      { by: 'a', say: "Faster. Come on. We're moving like we're underwater." },
      { by: 'b', say: "It's seven in the morning." },
      { by: 'a', say: "And the other team's been up since six. Let's go." },
      { by: 'c', say: "How do you know when they got up?" },
      { by: 'a', say: "I checked." },
      { by: 'b', say: "You CHECKED?" },
      { by: 'a', say: "Somebody has to know what we're up against!" },
      { by: 'c', conf: "{a} treats chores like a challenge. Which would be great if chores gave out immunity." },
    ] },
    { id: 'cr.c4', place: 'work', when: { register: ['schemer', 'cool'] }, turns: [
      { beat: "{a} has volunteered for the chore nobody wants, which means {a} wants something." },
      { by: 'b', say: "Since when do you volunteer?" },
      { by: 'a', say: "Since today. People remember who helped." },
      { by: 'c', say: "That's a very weird reason to scrub something." },
      { by: 'a', say: "It's the only reason anybody does anything out here." },
      { by: 'b', say: "I just do it because it needs doing." },
      { by: 'a', say: "And that's why people forget you did it." },
      { by: 'b', conf: "{a} turned chores into strategy. I don't know if I'm impressed or disgusted." },
    ] },
    { id: 'cr.c5', place: 'work', when: { merged: true }, turns: [
      { by: 'a', say: "Funny how nobody wanted to do chores with me before the merge." },
      { by: 'b', say: "We were on different teams." },
      { by: 'a', say: "And now we're all one big happy family." },
      { by: 'c', say: "Nobody here is happy." },
      { by: 'a', say: "Or a family. But we've all got buckets." },
      { by: 'b', conf: "The merge means doing chores with the people you were trying to beat a week ago. And trying to work out which of them you're going to beat next." },
    ] },
  ],

  'long.crowd.dinner.any': [
    { id: 'cr.d1', place: 'eat', turns: [
      { beat: "Dinner {here}. Everyone's worn out." },
      { by: 'b', say: "Long day." },
      { by: 'a', say: "Long day." },
      { by: 'c', say: "Is anybody else's whole body sore?" },
      { by: 'a', say: "Parts of me are sore that I didn't know were parts." },
      { by: 'b', say: "That's disgusting." },
      { by: 'a', say: "That's the truth." },
      { by: 'c', conf: "Moments like this are the only time out here that nobody's playing. You have to enjoy them, because they're over in about five minutes." },
    ] },
    { id: 'cr.d2', place: 'eat', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'a', say: "So. What did everybody think of today?" },
      { by: 'b', say: "That's a very innocent question for you." },
      { by: 'a', say: "I'm a very innocent person." },
      { by: 'c', say: "Since when?" },
      { by: 'a', say: "Since dinner. Come on. Tell me one thing that surprised you today." },
      { by: 'b', say: "Honestly? How quiet everybody got after the challenge." },
      { by: 'a', say: "Hm. Me too." },
      { by: 'a', conf: "One question at dinner and I learned everybody's nervous. That's worth more than the food." },
    ] },
    { id: 'cr.d3', place: 'eat', when: { register: ['sweet', 'shy', 'plain'] }, turns: [
      { by: 'a', say: "Okay, everybody say one good thing about today. Just one." },
      { by: 'b', say: "We didn't die." },
      { by: 'a', say: "A real one!" },
      { by: 'c', say: "Fine. I got the good sleeping spot." },
      { by: 'a', say: "See? That's nice. {b}?" },
      { by: 'b', say: "...You made me laugh this morning. When you fell in the bushes." },
      { by: 'a', say: "That wasn't on purpose!" },
      { by: 'b', say: "I know. That's why it was good." },
      { by: 'c', conf: "{a} is going to get eaten alive in this game. But I'm glad {a}'s here." },
    ] },
    { id: 'cr.d4', place: 'eat', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "I'm going to say what everyone's thinking. Today was garbage." },
      { by: 'b', say: "Not everyone's thinking that." },
      { by: 'a', say: "Then everyone SHOULD be thinking it." },
      { by: 'c', say: "Can we have one dinner without a speech?" },
      { by: 'a', say: "This isn't a speech. This is a review." },
      { by: 'b', say: "Zero stars." },
      { by: 'a', say: "Thank you!" },
      { by: 'c', conf: "{a} complains about everything. The weird part is, {a}'s usually right." },
    ] },
  ],

  'long.crowd.nerves.any': [
    { id: 'cr.n1', place: 'fire', turns: [
      { beat: "An hour before the vote. Nobody can sit still." },
      { by: 'c', say: "I hate this part." },
      { by: 'b', say: "Everybody hates this part." },
      { by: 'a', say: "I don't. This is when you find out who you really are." },
      { by: 'c', say: "Who you really are is somebody who wants to throw up." },
      { by: 'a', say: "Speak for yourself." },
      { by: 'b', say: "You've been sitting on your hands for ten minutes." },
      { by: 'a', say: "...They're cold." },
      { by: 'b', conf: "Everybody's acting calm. Nobody's calm. Somebody at this fire is going home tonight." },
    ] },
    { id: 'cr.n2', place: 'aside', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "Do you think it's me tonight?" },
      { by: 'b', say: "I don't think so." },
      { by: 'a', say: "You paused. You paused before you said that." },
      { by: 'c', say: "Everybody pauses. It's that kind of day." },
      { by: 'a', say: "If it's me, will you tell me? Before?" },
      { by: 'b', say: "...If I know, I'll tell you." },
      { by: 'a', conf: "\"If I know.\" Everybody knows. Everybody always knows except the person going home." },
    ] },
    { id: 'cr.n3', place: 'aside', when: { register: ['schemer', 'cool', 'competitor'] }, turns: [
      { by: 'a', say: "Relax. Tonight's handled." },
      { by: 'b', say: "How can you be so sure?" },
      { by: 'a', say: "Because I counted. Twice." },
      { by: 'c', say: "Counting doesn't stop people flipping." },
      { by: 'a', say: "No. But it tells you who would have to flip for it to go wrong. And I'm watching them." },
      { by: 'b', say: "That's either reassuring or terrifying." },
      { by: 'a', say: "Pick one and stop fidgeting." },
      { by: 'c', conf: "{a} is calm because {a} thinks {a} has the numbers. I just hope {a} isn't counting me as one of them." },
    ] },
    { id: 'cr.n4', place: 'fire', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "If anyone in this group writes my name tonight, I swear—" },
      { by: 'b', say: "Nobody's writing your name." },
      { by: 'a', say: "Then why's everybody being so quiet?" },
      { by: 'c', say: "Because we're nervous! Like normal people!" },
      { by: 'a', say: "Normal people don't whisper behind the {quarters}." },
      { by: 'b', say: "That was about the toilet paper, {a}." },
      { by: 'a', say: "...Oh." },
      { by: 'c', conf: "{a} thinks everything's about {a}. Tonight, honestly, it might be." },
    ] },
  ],

  'long.crowd.huddle.any': [
    { id: 'cr.h1', place: 'secret', turns: [
      { beat: "{group} meets one last time at {place} before the vote." },
      { by: 'a', say: "Okay. Last check. Everybody's good?" },
      { by: 'b', say: "Good." },
      { by: 'c', say: "Good." },
      { by: 'a', say: "Same name. Nobody freelances. Nobody gets cute." },
      { by: 'c', say: "Why are you looking at me?" },
      { by: 'a', say: "I'm looking at everybody." },
      { by: 'b', say: "You're looking at {c} a little more." },
      { by: 'a', say: "Then {c} should feel very looked at." },
      { by: 'c', conf: "{group} thinks I might flip. I wasn't going to. But now I'm thinking about it." },
    ] },
    { id: 'cr.h2', place: 'secret', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "Can we do a group hug? Is that weird before a vote?" },
      { by: 'b', say: "It's a little weird." },
      { by: 'c', say: "Fine. Quick." },
      { beat: "{group} hug, awkwardly, {here}." },
      { by: 'a', say: "Okay. I feel better. We've got this, right?" },
      { by: 'b', say: "We've got this." },
      { by: 'a', conf: "I know a hug doesn't stop people voting you out. But I wanted to see their faces when they said we're okay." },
    ] },
    { id: 'cr.h3', place: 'secret', when: { register: ['schemer', 'cool', 'competitor'] }, turns: [
      { by: 'a', say: "Here's how tonight goes. We all write the same name. If somebody plays an idol, we've got a back-up." },
      { by: 'b', say: "What's the back-up?" },
      { by: 'a', say: "I'll tell you at the fire. With my eyes." },
      { by: 'c', say: "With your eyes." },
      { by: 'a', say: "Watch me. You'll know." },
      { by: 'b', say: "This is insane." },
      { by: 'a', say: "This is {group}. Same thing." },
      { by: 'b', conf: "We're about to vote somebody out based on a plan that lives in {a}'s eyebrows. Great." },
    ] },
  ],

  'long.crowd.immune.any': [
    { id: 'cr.i1', place: 'public', turns: [
      { beat: "{a} walks back into camp wearing the immunity necklace." },
      { by: 'b', say: "Look at you!" },
      { by: 'a', say: "Look at me." },
      { by: 'c', say: "Don't get used to it." },
      { by: 'a', say: "I'm going to get extremely used to it." },
      { by: 'b', say: "Safe tonight. That must feel amazing." },
      { by: 'a', say: "It feels like the first good night's sleep I've had in a week." },
      { by: 'c', conf: "{a} won. Fine. That just means everybody else is going to have to work out which of the rest of us goes. Including me." },
    ] },
    { id: 'cr.i2', place: 'public', when: { register: ['fiery', 'competitor'] }, turns: [
      { by: 'a', say: "Say it. Say I'm the best." },
      { by: 'b', say: "You're the best." },
      { by: 'a', say: "{c}? Say it." },
      { by: 'c', say: "Absolutely not." },
      { by: 'a', say: "Say it or you're not touching the necklace." },
      { by: 'c', say: "I don't want to touch the necklace." },
      { by: 'a', say: "Everybody wants to touch the necklace." },
      { by: 'c', conf: "{a} keeps winning and keeps rubbing it in. At some point, those two things together get you voted out." },
    ] },
  ],

  'long.crowd.clash.any': [
    { id: 'cr.x1', place: 'public', turns: [
      { beat: "It starts as an argument {here}. Then everybody's watching." },
      { by: 'a', say: "Say it louder. Go on. Everybody wants to hear." },
      { by: 'b', say: "Fine! You're a bully, and everyone's too scared to tell you!" },
      { by: 'a', say: "I'm a bully? You've been talking about me all week!" },
      { by: 'c', say: "Okay! Okay! Stop. Both of you." },
      { by: 'b', say: "Stay out of it, {c}." },
      { by: 'c', say: "I'd love to, but you're doing it in the middle of camp!" },
      { by: 'c', conf: "I didn't sign up to be a referee. But if somebody doesn't step in, one of them's going to end up in the lake." },
    ] },
  ],

  'long.cross.rival.any': [
    { id: 'cr.r1', place: 'public', turns: [
      { by: 'b', say: "Oh look. {mine}." },
      { by: 'a', say: "Oh look. The team that keeps losing." },
      { by: 'b', say: "We won the last one." },
      { by: 'a', say: "And it was adorable." },
      { by: 'b', say: "Keep talking. It'll make beating you better." },
      { by: 'a', say: "You'll have to beat me first." },
      { by: 'b', conf: "Everybody on {mine} is annoying. {a} is the most annoying. I want to win the next one just to see {a.posAdj} face." },
    ] },
    { id: 'cr.r2', place: 'public', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'a', say: "How's {theirs} doing? I hear it's... tense over there." },
      { by: 'b', say: "Where'd you hear that?" },
      { by: 'a', say: "Around. People talk." },
      { by: 'b', say: "People on my team don't talk to you." },
      { by: 'a', say: "Are you sure?" },
      { beat: "{b} doesn't have an answer. {a} smiles and walks off." },
      { by: 'b', conf: "{a} just made me paranoid about my own team in about ten seconds. I hate how good {a} is at that." },
    ] },
    { id: 'cr.r3', place: 'public', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "What are you looking at?" },
      { by: 'b', say: "Not much, apparently." },
      { by: 'a', say: "Say that again." },
      { by: 'b', say: "I said, not much." },
      { by: 'a', say: "You're lucky we're not on the same team. You'd be gone already." },
      { by: 'b', say: "You're lucky we're not on the same team. I'd have to listen to you." },
      { by: 'a', conf: "I can't vote {b} out. I CAN beat {b} at every single challenge until the merge. That's going to have to do." },
    ] },
  ],
  'long.cross.friend.any': [
    { id: 'cr.f1', place: 'public', turns: [
      { by: 'a', say: "Hey. How's the other side?" },
      { by: 'b', say: "Loud. How's yours?" },
      { by: 'a', say: "Louder." },
      { by: 'b', say: "Wanna trade?" },
      { by: 'a', say: "Can't. They'd vote me out for talking to you." },
      { by: 'b', say: "Mine would too. So, see you at the merge?" },
      { by: 'a', say: "See you at the merge." },
      { by: 'a', conf: "I'm not supposed to like anyone on {theirs}. I like {b}. When the teams are gone, that's going to matter." },
    ] },
    { id: 'cr.f2', place: 'aside', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'b', say: "We're not supposed to be talking, you know." },
      { by: 'a', say: "I know. I don't care. You're nice." },
      { by: 'b', say: "That's it? I'm nice?" },
      { by: 'a', say: "Out here? Nice is a lot." },
      { by: 'b', say: "...Yeah. Fair. You're nice too." },
      { by: 'b', conf: "{a} is on the other team, and {a} is the first person out here who's been nice to me without wanting something. I'm keeping {a} in mind." },
    ] },
  ],
  'long.cross.spy.leak': [
    { id: 'cr.s1', place: 'public', turns: [
      { by: 'a', say: "So who's in trouble on your side tonight? You can tell me. I can't vote." },
      { by: 'b', say: "Ha. Nice try." },
      { by: 'a', say: "Come on. I'm just curious." },
      { by: 'b', say: "Fine. Let's just say some people on {theirs} aren't as close as they look." },
      { by: 'a', say: "Interesting." },
      { by: 'b', say: "Don't tell anyone I said that." },
      { by: 'a', say: "Who would I tell?" },
      { by: 'a', conf: "{b} just told me {theirs} is cracking. That's going to be really useful at the merge." },
    ] },
  ],
  'long.cross.spy.shut': [
    { id: 'cr.s2', place: 'public', turns: [
      { by: 'a', say: "So, how are things on your side? Everyone getting along?" },
      { by: 'b', say: "We're great. Best friends. Why do you ask?" },
      { by: 'a', say: "No reason." },
      { by: 'b', say: "Mm-hm. Tell {mine} I said nice try." },
      { by: 'a', say: "Tell them yourself." },
      { by: 'b', conf: "{a} came over here fishing. I'm not a fish." },
    ] },
  ],
};
