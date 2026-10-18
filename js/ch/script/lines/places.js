// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/places.js — the house in its own places (events.js: gym-training,
// pool-games, house-dinner, beach-run, sunset-talk, bunk-whisper)
// ══════════════════════════════════════════════════════════════════════
//
// Each happens in one place and says so (the user, 2026-10-15: "create also events
// in specific locations"). Written long from the start (the long cut). Plain spoken
// English; every reply follows the line before; no past the scene does not have.
export default {
  // ── the gym: two friends train for an Arena one of them is afraid of ──
  'gym-training.any': [
    { id: 'gt.1', turns: [
      { beat: '{a} and {b} have the gym to themselves. {b} is holding a pad, and {a} is hitting it.' },
      { by: 'b', say: "Harder. If you get pulled into the Arena, nobody's going to go easy on you." },
      { by: 'a', say: "I'm going as hard as I can." },
      { by: 'b', say: "No, you're not. You're thinking about it. Stop thinking." },
      { beat: '{a} hits the pad again, much harder.' },
      { by: 'b', say: "That. Do that." },
      { by: 'a', say: "Why are you helping me with this? You could be resting." },
      { by: 'b', say: "Because if you go in there, I want you coming back." },
      { by: 'a', conf: "I'm scared of the Arena. I'm not going to pretend I'm not. But {b} spent an hour making sure I'm less scared, and that's a friend." },
    ] },
    { id: 'gt.2', turns: [
      { by: 'a', say: "Can you show me how you hold a rope? In a tug, I mean." },
      { by: 'b', say: "Low. Lower than you think. And you lean back with your whole body, not your arms." },
      { by: 'a', say: "Like this?" },
      { by: 'b', say: "Lower. There. Now don't let go, whatever happens." },
      { by: 'a', say: "What if they're stronger than me?" },
      { by: 'b', say: "Then you hang on longer than they want to. Most people quit before they lose." },
      { by: 'a', say: "Okay. Again." },
      { by: 'b', conf: "{a} doesn't need to be the strongest person in there. {a} just needs to stop being afraid of it, and that I can help with." },
    ] },
    { id: 'gt.3', turns: [
      { beat: '{a} is on the floor after another set. {b} drops down next to {a.obj}.' },
      { by: 'b', say: "You're doing more than you did yesterday." },
      { by: 'a', say: "I don't feel like it." },
      { by: 'b', say: "You never feel it while it's happening. You just look back one day and notice." },
      { by: 'a', say: "If my name comes out this week, I want to be ready." },
      { by: 'b', say: "Then we come back tomorrow. Same time." },
      { by: 'a', say: "Same time." },
      { by: 'a', conf: "Nobody saw us in here. Good. Let them think I've been sitting by the pool all week." },
    ] },
  ],

  // ── the pool: a chicken fight; a and b win, c and d don't ──
  'pool-games.fun': [
    { id: 'pgm.f1', turns: [
      { beat: '{a} is on {b}\'s shoulders in the pool. {c} is on {d}\'s. Everybody else is watching from the edge.' },
      { by: 'c', say: "You're going down, {a}!" },
      { by: 'a', say: "Say that again when you're in the water!" },
      { beat: 'They grab each other\'s arms and wrestle. {c} wobbles, {d} slips, and they both go under.' },
      { by: 'b', say: "YES! Undefeated!" },
      { by: 'd', say: "That doesn't count. My foot slipped." },
      { by: 'a', say: "Your foot slipped because we pushed you." },
      { by: 'c', say: "Rematch. Right now." },
      { by: 'c', conf: "We lost a chicken fight. It's the dumbest thing to care about. I really, really care about it." },
    ] },
    { id: 'pgm.f2', turns: [
      { by: 'd', say: "Okay, best of three. Whoever loses makes dinner." },
      { by: 'b', say: "Deal. Get up there, {a}." },
      { beat: 'The first round is over in seconds. {c} lands in the water laughing.' },
      { by: 'c', say: "That was a warm-up!" },
      { beat: 'The second round goes the same way.' },
      { by: 'a', say: "Best of three. That's two. You're cooking." },
      { by: 'd', say: "I want it on record that I was carrying all the weight." },
      { by: 'b', conf: "For ten minutes nobody was talking about the vote. Then we got out of the pool, and everybody was back to whispering." },
    ] },
  ],
  'pool-games.sore': [
    { id: 'pgm.s1', turns: [
      { beat: '{a} and {b} knock {c} and {d} into the water for the third time.' },
      { by: 'a', say: "That's three! Anybody else?" },
      { by: 'c', say: "You pulled my hair. That's not allowed." },
      { by: 'a', say: "There's no rules. It's a chicken fight." },
      { by: 'c', say: "There's always rules." },
      { by: 'd', say: "Let it go. It's a game." },
      { by: 'c', say: "It's not about the game." },
      { beat: '{c} gets out of the pool and walks off without a towel.' },
      { by: 'b', conf: "We were just playing. Apparently {c} wasn't." },
    ] },
    { id: 'pgm.s2', turns: [
      { by: 'b', say: "Again? You sure?" },
      { by: 'c', say: "I'm sure." },
      { beat: 'It lasts about five seconds. {c} goes under hard.' },
      { by: 'c', say: "You didn't have to throw me." },
      { by: 'a', say: "That's how you win a chicken fight." },
      { by: 'c', say: "I'll remember that when we're in a daily." },
      { by: 'd', say: "Okay. I think we're done for today." },
      { by: 'a', conf: "{c} took a pool game personally. Good to know. If {c} gets that heated over this, imagine the Arena." },
    ] },
  ],

  // ── the kitchen: a cooks for the whole house, b helps ──
  'house-dinner.good': [
    { id: 'hd.g1', turns: [
      { beat: '{a} has every pan in the kitchen going. {b} is chopping onions and crying about it.' },
      { by: 'b', say: "Why are there so many onions?" },
      { by: 'a', say: "Because there's a lot of people, and they all deserve onions." },
      { by: 'x', opt: 1, say: "What is that smell? That's amazing." },
      { by: 'a', say: "Dinner. For everybody. Get plates." },
      { beat: 'The table fills up. For a while everybody is eating, and nobody is talking about the vote.' },
      { by: 'y', opt: 1, say: "This is the best thing I've eaten since I got here." },
      { by: 'b', say: "I did the onions. Just so everybody knows." },
      { by: 'a', conf: "You can't win this game by cooking. But you can make it a lot harder for people to put your name down after you've fed them." },
    ] },
    { id: 'hd.g2', turns: [
      { by: 'a', say: "I'm making dinner for the house. Are you in?" },
      { by: 'b', say: "I can't cook." },
      { by: 'a', say: "You can stir. Stirring is cooking." },
      { by: 'b', say: "Okay. I can stir." },
      { beat: 'An hour later the whole house is crowded around the table.' },
      { by: 'x', opt: 1, say: "Who made this?" },
      { by: 'b', say: "{a} did. I stirred." },
      { by: 'a', say: "{b} stirred very well." },
      { by: 'b', conf: "{a} is smart. Everybody in this house just ate {a}'s food and said thank you. That's worth more than a daily." },
    ] },
  ],
  'house-dinner.burnt': [
    { id: 'hd.b1', turns: [
      { beat: 'Smoke comes out of the oven. {a} pulls the tray out with a towel.' },
      { by: 'b', say: "Is it supposed to be black?" },
      { by: 'a', say: "Some of it." },
      { by: 'b', say: "Most of it." },
      { by: 'x', opt: 1, say: "I can smell that from the other room. Is everyone okay?" },
      { by: 'a', say: "Everyone's fine. Dinner is a little crispy." },
      { beat: 'They scrape off the worst of it and serve it anyway. Nobody complains out loud.' },
      { by: 'a', conf: "It was burnt. Everybody ate it. That's this house. Nobody wants to be the one who says no to anything." },
    ] },
    { id: 'hd.b2', turns: [
      { by: 'b', say: "I think the rice is stuck to the pan." },
      { by: 'a', say: "The rice is part of the pan now. That's fine." },
      { by: 'b', say: "That's not fine." },
      { by: 'a', say: "We'll make sandwiches. Nobody has to know." },
      { by: 'y', opt: 1, say: "Everybody already knows. We could hear the smoke alarm." },
      { by: 'b', say: "Sandwiches it is." },
      { by: 'b', conf: "{a} tried to feed twenty people and set the kitchen on fire. I still like {a} more than I did this morning." },
    ] },
  ],

  // ── the beach: a morning run turns into a race ──
  'beach-run.friendly': [
    { id: 'br.f1', turns: [
      { beat: 'Early morning. {a} and {b} are running along the waterline.' },
      { by: 'b', say: "Last one to the rocks makes breakfast." },
      { by: 'a', say: "You're on." },
      { beat: 'They sprint. {a} gets there first and collapses in the sand.' },
      { by: 'b', say: "You cheated. You started before I said go." },
      { by: 'a', say: "You never said go." },
      { by: 'b', say: "Exactly." },
      { by: 'b', conf: "{a} is fast. Really fast. I'm glad we're friends, because I would not want to see {a} across from me in the Arena." },
    ] },
    { id: 'br.f2', turns: [
      { by: 'a', say: "One more lap?" },
      { by: 'b', say: "My legs are gone." },
      { by: 'a', say: "One more. Then you can lie down." },
      { beat: 'They run it. {a} finishes a few steps ahead and waits for {b}.' },
      { by: 'b', say: "Why are you even running this hard? There's no daily today." },
      { by: 'a', say: "Because there's a daily tomorrow." },
      { by: 'b', conf: "Everybody else is asleep, and {a} is out here running laps. That tells you everything about how {a} plays." },
    ] },
  ],
  'beach-run.rivals': [
    { id: 'br.r1', turns: [
      { beat: '{a} and {b} end up running the same stretch of sand. Neither of them slows down.' },
      { by: 'b', say: "Are you following me?" },
      { by: 'a', say: "I was here first." },
      { beat: 'It turns into a race without anybody saying so. {a} finishes ahead.' },
      { by: 'a', say: "Good run." },
      { by: 'b', say: "It wasn't a race." },
      { by: 'a', say: "Then why are you so out of breath?" },
      { by: 'b', conf: "{a} turned a morning run into a competition. Fine. Next time it's a daily, and I'm not losing that one." },
    ] },
    { id: 'br.r2', turns: [
      { by: 'b', say: "Do you want the beach to yourself? You can just say so." },
      { by: 'a', say: "There's a lot of beach. Run on your half." },
      { beat: 'They run anyway, side by side, each trying to pull ahead. {a} wins by a few steps.' },
      { by: 'a', say: "My half was faster." },
      { by: 'b', say: "Enjoy it. It's the only thing you'll win this week." },
      { by: 'a', conf: "{b} hates losing to me. Good. I want {b} thinking about me when the votes come around." },
    ] },
  ],

  // ── the lookout: two friends at sunset ──
  'sunset-talk.home': [
    { id: 'su.h1', turns: [
      { beat: '{a} and {b} sit at the lookout while the sun goes down.' },
      { by: 'a', say: "What's the first thing you're doing when you get home?" },
      { by: 'b', say: "Sleeping in my own bed. For a week." },
      { by: 'a', say: "That's it?" },
      { by: 'b', say: "And seeing my family. Obviously. What about you?" },
      { by: 'a', say: "I want to sit somewhere quiet where nobody's planning anything." },
      { by: 'b', say: "This is pretty quiet." },
      { by: 'a', say: "Yeah. This is the only place in here that is." },
      { by: 'b', conf: "Most of this game is about who's with who and who's going in. With {a}, for an hour, it was just about two people." },
    ] },
    { id: 'su.h2', turns: [
      { by: 'b', say: "Can I tell you something I haven't told anybody in here?" },
      { by: 'a', say: "Of course." },
      { by: 'b', say: "I almost didn't come. I nearly said no." },
      { by: 'a', say: "Why?" },
      { by: 'b', say: "I didn't think I'd last. I thought I'd be the first one gone." },
      { by: 'a', say: "And now look at you." },
      { by: 'b', say: "Now look at me." },
      { by: 'a', conf: "{b} told me something real tonight. In this house, that's the most dangerous thing you can give somebody, and I'm going to look after it." },
    ] },
  ],
  'sunset-talk.endgame': [
    { id: 'su.e1', turns: [
      { beat: 'The sun is almost gone. {a} and {b} haven\'t said anything for a while.' },
      { by: 'a', say: "Do you think about the final?" },
      { by: 'b', say: "Every day." },
      { by: 'a', say: "I want us both there. I mean that." },
      { by: 'b', say: "Then we look out for each other. Every vote." },
      { by: 'a', say: "Every vote. And if one of us goes in, the other one is the loudest person in that stand." },
      { by: 'b', say: "Deal." },
      { by: 'b', conf: "People make promises in here all the time. This one felt different. I think {a} really means it." },
    ] },
    { id: 'su.e2', turns: [
      { by: 'b', say: "Who do you think gets to the end?" },
      { by: 'a', say: "Honestly? Not the people everybody thinks." },
      { by: 'b', say: "Who, then?" },
      { by: 'a', say: "The ones nobody's bothered to vote for yet. Like us." },
      { by: 'b', say: "So we keep it that way." },
      { by: 'a', say: "We keep it that way. Quiet, until it's too late for anybody to stop us." },
      { by: 'a', conf: "{b} and I have a plan now. Nobody else knows about it, and I'd like to keep it that way for as long as I can." },
    ] },
  ],

  // ── the bedroom, lights out: two allies whisper about the vote ──
  'bunk-whisper.safe': [
    { id: 'bw2.s1', turns: [
      { beat: 'Lights out. {a} leans down from the top bunk.' },
      { by: 'a', say: "Are you awake?" },
      { by: 'b', say: "I am now." },
      { by: 'a', say: "I've been thinking about the vote. I don't think we should wait." },
      { by: 'b', say: "Shh. Keep your voice down. Who?" },
      { beat: '{a} leans closer and whispers a name. {b} nods in the dark.' },
      { by: 'b', say: "Okay. Tomorrow. Now go to sleep." },
      { by: 'a', conf: "The best plans in this house get made at two in the morning, when everybody else is asleep." },
    ] },
    { id: 'bw2.s2', turns: [
      { by: 'b', say: "Psst. Did you see who they were all talking to after dinner?" },
      { by: 'a', say: "I saw." },
      { by: 'b', say: "We need to talk to them first. Tomorrow, before anybody else does." },
      { by: 'a', say: "Agreed. Early." },
      { by: 'b', say: "Early. Goodnight." },
      { by: 'b', conf: "Nobody can hear you in here if you whisper. At least, that's what I tell myself." },
    ] },
  ],
  'bunk-whisper.heard': [
    { id: 'bw2.h1', turns: [
      { beat: 'Lights out. {a} and {b} whisper across the gap between their bunks.' },
      { by: 'a', say: "I think it has to be this week. Before they see it coming." },
      { by: 'b', say: "And our group's with us?" },
      { by: 'a', say: "Everybody. I talked to them today." },
      { beat: 'In the next bunk, {c} has not moved, and is not asleep.' },
      { by: 'b', say: "Okay. Then tomorrow. Goodnight." },
      { by: 'c', conf: "They thought I was asleep. I wasn't. Now I know what {a}'s group is planning, and they don't know I know." },
    ] },
    { id: 'bw2.h2', turns: [
      { by: 'b', say: "Are you sure everybody's asleep?" },
      { by: 'a', say: "Everybody's asleep. Listen. Tomorrow we tell the others it's on." },
      { by: 'b', say: "Okay." },
      { beat: '{c} opens one eye, then closes it again.' },
      { by: 'c', conf: "{a} should really check who's in the room before saying things like that. I heard every word." },
      { by: 'c', conf: "I'm not going to say anything tomorrow. I'm going to wait, and watch them do exactly what they said." },
    ] },
  ],
};
