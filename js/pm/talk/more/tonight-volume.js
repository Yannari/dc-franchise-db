// pm/talk/more/tonight-volume.js — more of the day before the night (talk/tonight.js).
// Season read 2026-10-25: a public-vote night runs a vote-worry scene for two
// or three couples, and a pool of two per movement played "Stop. You'll set
// me off" ten times in three seasons. Same rules as tonight.js: {pa} only when
// taken, {c} only with cast 3 (pick-chat) — stick-twist always casts three.
export const VOTE_WORRY_VOLUME = {
  moves: {
    open: [
      { stage: "{a} and {b} are in the shallow end, the only two in the pool.", turns: [
        ['a', "Is it weird that I keep checking the phone even though it's not ringing?"],
        ['b', "Everyone's doing it. Look at them. A whole villa pretending not to stare at one phone."],
      ] },
      { stage: "{a} is doing {b}'s hair in the dressing room. Neither of them is really concentrating.", turns: [
        ['b', "You've done that bit three times."],
        ['a', "Have I? Sorry. My head's at the fire pit already."],
      ] },
      { stage: "{a} and {b} share a sun lounger, a plate of toast going cold between them.", turns: [
        ['a', "I can't eat."],
        ['b', "You've never not been able to eat."],
        ['a', "Exactly. That's how you know it's serious."],
      ] },
      { stage: "{a} finds {b} on the roof terrace, looking down at the villa.", turns: [
        ['a', "Hiding?"],
        ['b', "Thinking. It's quieter up here. Nobody's saying the word vote."],
      ] },
      { stage: "{a} and {b} sit on the edge of the bed, both dressed hours too early.", turns: [
        ['b', "Why are we ready? It's the middle of the afternoon."],
        ['a', "Because if I'm ready, I can't spend three hours panicking about what to wear."],
      ] },
    ],
    fear: [
      { when: { of: 'scared' }, turns: [
        ['a', "Every couple in here has a moment. A big kiss, a big row, a big something. What's ours?"],
        ['b', "Ours is that we didn't need one."],
        ['a', "That's lovely. That's also exactly what nobody votes for."],
      ] },
      { when: { of: 'scared' }, turns: [
        ['b', "Can I say something stupid? I'm scared it's me. That they like you and they don't like me, and I take you down with me."],
        ['a', "Don't say that."],
        ['b', "I've been thinking it all day."],
        ['a', "Then stop. We're a couple. If it's one of us, it's both of us."],
      ] },
      { when: { of: 'scared' }, turns: [
        ['a', "I keep going over everything I've said in here. Every joke. Every face I pulled. Wondering which one they didn't like."],
        ['b', "You can't edit yourself now. It's done."],
        ['a', "That's what scares me. It's done."],
      ] },
      { when: { of: 'scared' }, turns: [
        ['a', "In here, I know exactly what we are. Out there, I don't know anything. I'm not ready to find out tonight."],
        ['b', "Then we'll find out together, whenever it is."],
        ['a', "Promise?"],
        ['b', "I just did."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['b', "Whatever they decide, they decide. We've had a good run, and nobody can take back the good bits."],
        ['a', "When did you get so wise?"],
        ['b', "About ten minutes ago. It'll wear off."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['a', "I feel weirdly okay about it. Is that bad?"],
        ['b', "No. I think it means we're solid."],
        ['a', "Or it means I've given up."],
        ['b', "It means we're solid. I've decided."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['b', "Honestly? I think we're fine. We haven't done anything to make anyone hate us."],
        ['a', "We haven't done anything at all."],
        ['b', "Exactly. Nobody votes off the nice ones."],
        ['a', "They absolutely do."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "Can I say something? Whatever happens, I don't regret a second of this. Not one."],
        ['a', "Not one second? Not even the early mornings?"],
        ['b', "Especially the early mornings."],
      ] },
      { turns: [
        ['a', "Promise me something. If it's us, we walk out holding hands. No crying until the gate."],
        ['b', "I can't promise the crying."],
        ['a', "Promise the hands, then."],
        ['b', "The hands I can do."],
      ] },
      { turns: [
        ['b', "Do you know what I'd miss most, if it's us? Not the sun. Not the villa. Mornings with you, before everyone else wakes up."],
        ['a', "Don't. We're not going anywhere."],
        ['b', "I know. I'm just saying it while I can."],
      ] },
      { turns: [
        ['a', "Okay. New rule. No more talking about the vote until we're at the fire pit."],
        ['b', "Deal. What do we talk about instead?"],
        ['a', "Anything. Your worst haircut."],
        ['b', "That's a long story."],
        ['a', "Good. We've got time."],
      ] },
      { turns: [
        ['b', "Whatever happens, I want you to know I picked right. On day one, and every day after."],
        ['a', "You're going to make me cry, and I've only just got ready."],
      ] },
    ],
    close: [
      { turns: [], beat: "Somebody shouts that the phone has gone. {a} and {b} look at each other, and get up together." },
      { turns: [['a', "Right. Fire pit faces on."], ['b', "This is my fire pit face."], ['a', "That's your normal face."], ['b', "Then I'm ready."]] },
      { turns: [], beat: "{b} squeezes {a}'s hand twice, the way {b} does when nobody else is supposed to notice." },
      { turns: [['b', "Whatever happens, I'll see you on the bench."], ['a', "I'll be the one shaking."]] },
    ],
  },
};

export const PICK_CHAT_VOLUME = {
  moves: {
    open: [
      { stage: "{a} and {b} are on the gym bench, not lifting anything.", turns: [
        ['b', "You've been quiet since the text."],
        ['a', "Because the text said recoupling, and my brain hasn't said anything else since."],
      ] },
      { stage: "{a} sits down on the swing seat next to {b}, hard enough to set it rocking.", turns: [
        ['b', "Careful. Some of us are balancing a drink."],
        ['a', "I need to talk to you about tonight before I explode."],
      ] },
      { stage: "{a} and {b} are doing the washing-up nobody else will do.", turns: [
        ['a', "Can I ask you something? About tonight?"],
        ['b', "Only if you dry."],
      ] },
      { stage: "{a} and {b} are lying on the lawn, squinting at the sky.", turns: [
        ['a', "Do you ever think about how in a few hours, everything in here could be different?"],
        ['b', "Every single recoupling. Every one."],
      ] },
    ],
    worry: [
      { when: { of: 'nobody', choosing: false }, turns: [
        ['a', "Every recoupling I tell myself it's fine, someone will pick me. And then I watch everyone stand up and say someone else's name, and I count how many are left."],
        ['b', "And?"],
        ['a', "And tonight the number's very small."],
      ] },
      { when: { of: 'nobody', choosing: false }, turns: [
        ['a', "I've done everything right. I've talked to everyone. I've been nice. I've been myself. And I still don't know if a single person in here would stand up for me."],
        ['b', "You don't know that nobody would."],
        ['a', "I don't know that anybody would. That's worse."],
      ] },
      { when: { of: 'nobody', cast: 3, choosing: false }, turns: [
        ['a', "If {c} picks someone else tonight, I think I'll just laugh. Out loud, at the fire pit. Because what else do you do?"],
        ['b', "You really like {c}, don't you?"],
        ['a', "I like {c} enough to be scared of {c}. That's new for me."],
      ] },
      { when: { of: 'torn', cast: 3, taken: true }, turns: [
        ['a', "I wake up next to {pa}, and it's lovely. And then I go downstairs and {c} says one thing, and my whole morning goes. How do you pick between lovely and that?"],
        ['b', "What's 'that'?"],
        ['a', "I don't know. Butterflies. The thing I came in here for."],
      ] },
      { when: { of: 'torn', cast: 3, taken: true, choosing: true }, turns: [
        ['a', "If I pick {c} tonight, {pa} is going to look at me across that fire pit, and I'm going to have to keep standing there. I don't know if I can do that to {pa}."],
        ['b', "And if you pick {pa}?"],
        ['a', "Then I spend the next week wondering about {c}. Either way somebody gets hurt."],
      ] },
      { when: { of: 'unsure', taken: true }, turns: [
        ['a', "When the text came, everyone else looked at their partner. I looked at the floor. Did you see that?"],
        ['b', "I saw it."],
        ['a', "I don't think {pa} did. I hope {pa} didn't."],
      ] },
      { when: { of: 'unsure', taken: true }, turns: [
        ['a', "There's nothing wrong with {pa}. That's the problem. I keep looking for a reason, and there isn't one. It's just not getting any bigger."],
        ['b', "Maybe it doesn't have to get bigger. Maybe it just has to be real."],
        ['a', "Is that enough, though? In here?"],
      ] },
    ],
    answer: [
      { when: { of: 'nobody' }, turns: [
        ['b', "Stop counting. You're not a number on a bench. Go and have a laugh with people this afternoon, be yourself, and let whatever happens happen."],
        ['a', "That's easy to say from a couple."],
        ['b', "I know it is. I'm still right."],
      ] },
      { when: { of: 'nobody' }, turns: [
        ['b', "Can I tell you what I see? I see someone who's been the best friend in here to half the villa. Someone's going to want that."],
        ['a', "As a friend."],
        ['b', "Friendships turn into things in here every day."],
      ] },
      { when: { of: 'nobody', cast: 3, choosing: false }, turns: [
        ['b', "Have you actually told {c} any of this?"],
        ['a', "Obviously not."],
        ['b', "Then {c} doesn't know. You can't be picked for something you've kept to yourself."],
      ] },
      { when: { of: ['torn', 'unsure'], side: 'partner', taken: true }, turns: [
        ['b', "You came in here to find something real, and you found it with {pa}. Real is boring sometimes. That's how you know it's real."],
        ['a', "That's the least romantic thing anyone's ever said to me."],
        ['b', "And you know I'm right."],
      ] },
      { when: { of: 'torn', side: 'other', cast: 3, taken: true }, turns: [
        ['b', "You've talked about {c} for ten minutes and {pa} for about four seconds. I'm just saying what I heard."],
        ['a', "That's not fair."],
        ['b', "It's not about fair. It's about what you want."],
      ] },
      { when: { of: 'unsure', side: 'other', taken: true, choosing: true }, turns: [
        ['b', "If you stand up tonight and pick {pa} because it's easier, you're both stuck. Think about your own feelings for once."],
        ['a', "That sounds really selfish."],
        ['b', "It's a recoupling. It's meant to be selfish."],
      ] },
    ],
    push: [
      { turns: [
        ['a', "What if I get it wrong?"],
        ['b', "Then you get it wrong, and you fix it, and you survive. People get it wrong in here every week."],
        ['a', "Not in front of the whole country."],
        ['b', "The whole country gets it wrong all the time. They'll understand."],
      ] },
      { turns: [
        ['a', "Be honest. If you were me, what would you do?"],
        ['b', "If I were you, I'd stop asking everyone else and sit on my own for ten minutes."],
        ['a', "That sounds terrifying."],
        ['b', "That's because it'll work."],
      ] },
      { turns: [
        ['a', "Do you ever wish you could just skip to the end of the night? Find out, and get it over with?"],
        ['b', "Every time. And then the end of the night comes, and I wish I hadn't."],
      ] },
      { when: { choosing: true }, turns: [
        ['b', "Can I give you one bit of advice? Whatever you say at that fire pit, mean it. People can tell when you don't."],
        ['a', "Can they?"],
        ['b', "Everyone can tell. The cameras can tell."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} pulls {a} up off the bed. Nobody's ready, but it's time to get ready." },
      { turns: [['a', "I feel sick."], ['b', "Good sick or bad sick?"], ['a', "Recoupling sick."], ['b', "That's the worst kind."]] },
      { turns: [], beat: "{a} lies back and stares at the ceiling. {b} lies back next to {a}, and they stay there until somebody calls them." },
      { when: { choosing: true }, turns: [['b', "Whatever you decide, I'll be on the bench cheering."], ['a', "Cheer quietly. Please."]] },
      { when: { choosing: false }, turns: [['b', "Whoever says your name tonight is lucky. I mean it."], ['a', "Tell them that. Loudly. Before the fire pit."]] },
    ],
  },
};

export const STICK_TWIST_VOLUME = {
  moves: {
    open: [
      { stage: "{a} and {b} are on the sun loungers, sunglasses on, talking without looking at each other.", turns: [
        ['b', "You've gone quiet."],
        ['a', "Because tomorrow is real now, and today isn't."],
      ] },
      { stage: "{a} finds {b} in the kitchen, eating cereal out of the box.", turns: [
        ['a', "Can I talk to you about something I shouldn't be thinking about?"],
        ['b', "That's the only kind of thing anyone talks about in here."],
      ] },
      { stage: "It's late. {a} and {b} are on the terrace, the music still going downstairs.", turns: [
        ['a', "I need you to tell me I'm not a terrible person."],
        ['b', "I'll need more information first."],
      ] },
    ],
    torn: [
      { when: { of: 'tempted', taken: true }, turns: [
        ['a', "With {pa}, I always knew what was coming next. With {c}, I've got no idea. And I can't stop wanting to find out."],
        ['b', "That's the newness, though. Newness wears off."],
        ['a', "What if it doesn't?"],
      ] },
      { when: { of: 'tempted', taken: true }, turns: [
        ['a', "{c} asked me what I'd do tomorrow, and I didn't say {pa}'s name. I didn't say anything. I just changed the subject."],
        ['b', "Oh."],
        ['a', "Yeah. Oh."],
      ] },
      { when: { of: 'torn', taken: true }, turns: [
        ['a', "I keep picturing the moment I walk back in. {pa}'s face. And then I picture walking in with {c}, and I can't make myself feel the same about either picture."],
        ['b', "Which picture makes you feel sick?"],
        ['a', "Both of them. That's the problem."],
      ] },
      { when: { of: 'torn', taken: true }, turns: [
        ['a', "If I knew {pa} was sitting over there waiting for me, it'd be easy. But I don't know that. Nobody knows anything over here."],
        ['b', "So you're deciding on a guess."],
        ['a', "I'm deciding on a guess. With my whole summer."],
      ] },
    ],
    answer: [
      { when: { side: 'stick', taken: true }, turns: [
        ['b', "You've had a good few days with {c}. A few days. You and {pa} have had the whole summer. Don't swap the summer for a few days."],
        ['a', "When you say it like that it sounds obvious."],
        ['b', "It is obvious. It's just scary."],
      ] },
      { when: { side: 'twist', taken: true }, turns: [
        ['b', "Can I be honest? You haven't mentioned {pa} once today without me bringing it up first."],
        ['a', "That's not true."],
        ['b', "Name one time."],
        ['a', "Okay. Fine."],
      ] },
      { turns: [
        ['b', "You don't have to know right now. Sleep on it. Whatever you wake up thinking, that's your answer."],
        ['a', "What if I wake up thinking both?"],
        ['b', "Then you go back to sleep."],
      ] },
    ],
    close: [
      { turns: [], beat: "{a} lies back on the lounger and closes {a.posAdj} eyes. {b} doesn't push it." },
      { turns: [['a', "Tomorrow I walk through that door and find out what kind of person I am."], ['b', "You already know what kind of person you are."], ['a', "That's what I'm scared of."]] },
      { turns: [], beat: "Across the garden, {c} waves. {a} waves back, and then looks at the floor." },
    ],
  },
};
