// ══════════════════════════════════════════════════════════════════════
// pm/talk/tonight.js — the day before the night: tonight, on everybody's mind
// ══════════════════════════════════════════════════════════════════════
//
// pm/threads.js tonightBeats. Before a recoupling, a vote, or Casa's stick or
// twist, the villa talks about it. Nobody knows yet how tonight goes.
//
// pick-chat [a, b, c?]  {a} talks to {b} about the recoupling. {c} is the
//   other name in it: the one {a} would go for, or the one turning {a}'s head.
//   `of`: nobody (single, scared of being left standing) · torn (between {pa}
//   and {c}) · unsure (doubting {pa}, nobody else). `side`: which way {b}
//   pushes (partner · other). `final`: tonight every single goes home.
// vote-worry [a, b]  a couple, the night of a public vote: will the public
//   keep us? `of`: scared · calm.
// stick-twist [a, b, c]  Casa Amor: {a} is with {pa} in the other villa, and
//   {c} is new. `of`: tempted · torn. `side`: what {b} says (stick · twist).
import { build } from './build.js';

export const PICK_CHAT = build('pick-chat', {
  stages: [
    { stage: "{a} and {b} are getting ready in the dressing room. Nobody has said the word recoupling yet, but everyone is thinking it." },
    { stage: "{a} and {b} are lying on the sunbeds, both pretending to read." },
  ],
  plans: {
    featured: ['open', 'worry', 'answer', 'push', 'close'],
    short: ['worry', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} sits down next to {b} on the end of the bed.", turns: [
        ['a', "Can we talk about tonight? Because I can't think about anything else."],
        ['b', "I was wondering when you'd bring it up."],
      ] },
      { stage: "{a} finds {b} in the kitchen, making a coffee nobody asked for.", turns: [
        ['b', "You've got your recoupling face on."],
        ['a', "I haven't got a recoupling face."],
        ['b', "You've had it on since breakfast."],
      ] },
      { stage: "{a} and {b} are floating in the pool, the only two in it.", turns: [
        ['a', "Right. Nobody can hear us out here. I need to talk about tonight."],
        ['b', "Go on."],
      ] },
    ],
    worry: [
      { when: { of: 'nobody' }, turns: [
        ['a', "I'm single going into a recoupling. Do you know how that feels? Every couple in here is going to stand up and pick each other, and I'm going to be sitting on that bench hoping somebody says my name."],
        ['b', "Somebody will."],
        ['a', "Who, though? Honestly, who?"],
      ] },
      { when: { of: 'nobody', cast: 3 }, turns: [
        ['a', "The only person I'd want to pick me is {c}. And I've got no idea if {c} even thinks about me. We've had, what, one real conversation?"],
        ['b', "One good conversation is more than most people get in here."],
        ['a', "One conversation isn't going to keep me in this villa."],
      ] },
      { when: { of: 'nobody', final: true }, turns: [
        ['a', "It's the last one. If nobody picks me tonight, that's it. I'm gone. I've got a few hours left in here, maybe, and I can't do anything about it except sit and wait."],
        ['b', "Don't talk like that. You don't know that."],
        ['a', "I know the maths. Count the people. Somebody's going home."],
      ] },
      { when: { of: 'torn', cast: 3, taken: true }, turns: [
        ['a', "Okay, so. If it's my choice tonight, I don't know who I'm picking. I know what I should do. I should pick {pa}. Everyone expects me to pick {pa}. But I keep thinking about {c}, and I don't know if that's real or if I'm just scared of missing something."],
        ['b', "Wow. You're actually thinking about it."],
        ['a', "I'm thinking about nothing else."],
      ] },
      { when: { of: 'torn', cast: 3, taken: true }, turns: [
        ['a', "Can I tell you something and you don't judge me? I think {c} might pick me tonight. And I don't know what I'd do if that happened. I'd have to stand up in front of {pa} and everyone."],
        ['b', "What would you want to do?"],
        ['a', "That's the problem. I don't know."],
      ] },
      { when: { of: 'unsure', taken: true }, turns: [
        ['a', "Everyone thinks me and {pa} are fine. We're the couple nobody worries about. And I'm sitting here genuinely not knowing if I'd pick {pa} tonight. There's nobody else. It's not that. I just don't know if this is it."],
        ['b', "That's a big thing to be carrying into a fire pit."],
        ['a', "Tell me about it."],
      ] },
    ],
    answer: [
      { when: { of: 'nobody' }, turns: [
        ['b', "Listen to me. You've been yourself the whole time in here, and people see that. Go and talk to people today. Not desperate, just talk. Let them remember you before tonight."],
        ['a', "Go and graft, basically."],
        ['b', "Go and graft. Nicely."],
      ] },
      { when: { of: 'nobody', cast: 3 }, turns: [
        ['b', "Then go and talk to {c}. Today. Not tonight at the fire pit, today. If there's something there, give {c} a reason to say your name."],
        ['a', "And if there isn't?"],
        ['b', "Then at least you'll know you tried."],
      ] },
      { when: { of: ['torn', 'unsure'], side: 'partner', taken: true }, turns: [
        ['b', "I'll be honest with you, because that's what you're asking for. You've got something real with {pa}. I've watched it. Don't throw that away because someone new made you feel interesting for an afternoon."],
        ['a', "When you say it like that, it sounds stupid."],
        ['b', "It's not stupid. It's human. But it's not worth it."],
      ] },
      { when: { of: 'torn', side: 'other', cast: 3 }, turns: [
        ['b', "Can I say something you won't like? If you're even asking this question, you already know. People who are happy don't sit in the pool asking if they should pick someone else. Go with {c}. Or at least don't close the door."],
        ['a', "That's mad. That's actually mad."],
        ['b', "You asked."],
      ] },
      { when: { of: 'unsure', side: 'other', taken: true }, turns: [
        ['b', "Honestly? If you're not sure about {pa} now, you're not going to be sure in a week. Better to be honest tonight than drag it out."],
        ['a', "Honest at a recoupling. In front of everyone."],
        ['b', "When else is there?"],
      ] },
    ],
    push: [
      { turns: [
        ['a', "What would you do? If it was you?"],
        ['b', "I'd go with my gut. Not my head, not what people expect. My gut."],
        ['a', "My gut's not saying anything. My gut's just making noises."],
        ['b', "That's nerves. That's different."],
      ] },
      { turns: [
        ['a', "Whatever happens tonight, promise you'll still talk to me tomorrow."],
        ['b', "I'll talk to you tomorrow. I'll probably talk to you too much tomorrow."],
      ] },
      { when: { of: ['torn', 'unsure'], taken: true }, turns: [
        ['a', "If I don't pick {pa} tonight, everyone's going to hate me, aren't they?"],
        ['b', "Some people will. But you can't pick someone because you're scared of the villa. You'll be the one living with it."],
      ] },
    ],
    close: [
      { turns: [], beat: "They sit there in silence for a while. Across the villa, someone shouts that it's time to get ready." },
      { turns: [['b', "Go on. Go and get ready. Whatever happens, you'll look amazing doing it."], ['a', "That's not the comfort you think it is."]] },
      { turns: [['a', "Thanks for listening."], ['b', "Always. Now breathe."]] },
    ],
  },
  notes: [
    { stage: "{a} talks to {b} about tonight's recoupling, and doesn't come out of it any surer." },
  ],
});

export const VOTE_WORRY = build('vote-worry', {
  stages: [
    { stage: "{a} and {b} are lying on a daybed, holding hands, not saying much." },
  ],
  plans: {
    featured: ['open', 'fear', 'answer', 'close'],
    short: ['fear', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} are lying side by side on the daybed. The phone hasn't gone off yet, but everyone knows it's a vote night.", turns: [
        ['a', "Do you think it's tonight?"],
        ['b', "It's always tonight in here. Something's always tonight."],
      ] },
      { stage: "{a} sits down next to {b} on the swing seat and takes {b.posAdj} hand.", turns: [
        ['b', "You're cold."],
        ['a', "I'm nervous. It goes to my hands."],
      ] },
    ],
    fear: [
      { when: { of: 'scared' }, turns: [
        ['a', "What if the public don't know us? We're not the ones on the swing seats arguing. We're not the ones crying in the hut. We just get on. And getting on doesn't make good television, does it?"],
        ['b', "You can't think like that."],
        ['a', "I can't stop thinking like that. That's the problem."],
      ] },
      { when: { of: 'scared' }, turns: [
        ['a', "I'm not ready to leave. I'm not ready to leave you. We've only just got good, and now some people on their sofas decide if we get to keep going."],
        ['b', "Hey. Whatever they decide, this doesn't stop at the door."],
        ['a', "Do you mean that?"],
        ['b', "I wouldn't say it if I didn't."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['a', "I've decided I'm not going to worry about it. We can't control it. We can only be us. And if being us isn't enough for the public, then they're wrong."],
        ['b', "That's very calm of you."],
        ['a', "I'm screaming on the inside. But I'm calm on the outside."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['b', "Do you know what? If we go tonight, we go together. That's not the worst thing that could happen."],
        ['a', "It's not the best."],
        ['b', "No. But it's not the worst."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "Let's just enjoy today. If it's our last one in here, I want it to be a good one. With you."],
        ['a', "That's actually really sweet."],
        ['b', "I'm a really sweet person."],
        ['a', "You're alright."],
      ] },
      { turns: [
        ['b', "Whatever happens at that fire pit, I'm glad I came in here. I'm glad I met you. That's not going anywhere, whatever the phones say."],
        ['a', "Stop. You'll set me off before we've even got dressed."],
      ] },
    ],
    close: [
      { turns: [], beat: "{a} rests {a.posAdj} head on {b}'s shoulder, and neither of them moves for a long time." },
      { turns: [['a', "Come on. Let's go and look amazing."], ['b', "If we're going, we're going in style."]] },
    ],
  },
  notes: [
    { stage: "{a} and {b} wonder out loud whether the public will keep them." },
  ],
});

export const STICK_TWIST = build('stick-twist', {
  stages: [
    { stage: "{a} and {b} have found the one quiet corner of the villa, away from the new arrivals." },
  ],
  plans: {
    featured: ['open', 'torn', 'answer', 'close'],
    short: ['torn', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} are on the sun loungers, as far from the new arrivals as they can get.", turns: [
        ['b', "So. Tomorrow."],
        ['a', "Don't. I've been trying not to think about tomorrow all day."],
      ] },
      { stage: "{a} drags {b} to the end of the garden while {c} is busy at the bar.", turns: [
        ['a', "I need to talk to you before I do something stupid."],
        ['b', "Stupid how?"],
      ] },
    ],
    torn: [
      { when: { of: 'tempted', taken: true }, turns: [
        ['a', "I didn't think this would happen. I walked in here so sure. I was going to be the one who sat in the corner and missed {pa} the whole time. And then {c} walked in, and I haven't thought about {pa} once in two days."],
        ['b', "Two days."],
        ['a', "Is that awful? Tell me it's not awful."],
      ] },
      { when: { of: 'torn', taken: true }, turns: [
        ['a', "I miss {pa}. I do. But {c} is right here, and {pa} is in another villa, and I've got no idea what {pa}'s doing over there. What if {pa}'s doing exactly what I'm doing?"],
        ['b', "And what are you doing?"],
        ['a', "Getting on really, really well with someone I shouldn't be."],
      ] },
    ],
    answer: [
      { when: { side: 'stick', taken: true }, turns: [
        ['b', "Stick. Honestly, stick. You and {pa} are one of the strongest couples in that villa. {c} is a week. {pa} has been every day since you walked in."],
        ['a', "And if {pa} has twisted?"],
        ['b', "Then at least you'll know you were the one who stayed loyal. That's worth something."],
      ] },
      { when: { side: 'twist', taken: true }, turns: [
        ['b', "I'll say this once. If you were really sure about {pa}, you wouldn't be standing here with me having this conversation. You'd be counting the hours till you see {pa}. Are you counting the hours?"],
        ['a', "No."],
        ['b', "Then you've got your answer."],
      ] },
      { turns: [
        ['b', "Whatever you do tomorrow, do it for you. Not for {c}, not for the villa back there. You're the one who has to walk through that door with whoever you choose."],
        ['a', "When you put it like that, I want to be sick."],
      ] },
    ],
    close: [
      { turns: [], beat: "{a} looks over at the bar, where {c} is laughing at something, and doesn't say anything for a long time." },
      { turns: [['a', "I'll know tomorrow. I'll know when I'm standing there."], ['b', "You might. Or you might know right now and be scared of it."]] },
    ],
  },
  notes: [
    { stage: "{a} asks {b} whether to stick with {pa} or twist for {c}." },
  ],
});
