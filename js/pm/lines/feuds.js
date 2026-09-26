// pm/lines/feuds.js — exes at war (pm/rivalry.js stepFeud). Data only.
//
//   feud-confront  [a, b, c]  a was left; b left a for c. `of`: hurt · furious
//   feud-interrupt [a, b, c]  a walks in on b and c
//   feud-shade     [a, b, c]  a on b, the new one; c is a's ex. `of`: catty · civil
//   feud-ick       [a, b, c]  a tells friend b about ex c: the ick, moving on
//   feud-closure   [a, b]     a and ex b talk it out. `of`: peace · refused
//
// From Rob and Leah (US 6): "you told me I had nothing to worry about", the
// interruption, the ick. What they were to each other is only what the
// engine recorded: a couple, and then not.
export const FEUD_LINES = {
  'feud-confront': [
    // hurt
    { id: 'fc2.h.01', when: { of: 'hurt' }, stage: '{a} finds {b} alone on the terrace.', turns: [
      ['a', "You told me I had nothing to worry about."], ['b', "I didn't know then."],
      ['a', "You must have known something."], ['b', "I'm sorry. I really am."], ['a', "Sorry doesn't really help me right now."]],
      beat: '{a} walks off before {b} can say anything else.' },
    { id: 'fc2.h.02', when: { of: 'hurt' }, stage: '{a} sits down next to {b} on the swing, very quiet.', turns: [
      ['a', "Why didn't you just tell me?"], ['b', "I didn't want to hurt you."],
      ['a', "Well, you did. In front of everyone."], ['b', "I know."]], beat: "Neither of them looks at the other." },
    { id: 'fc2.h.03', when: { of: 'hurt' }, stage: 'In the dressing room, {a} catches {b} on the way out.', turns: [
      ['a', "Was any of it real?"], ['b', "All of it was real."],
      ['a', "Then how could you do that?"], ['b', "Because I felt something with {c} I couldn't ignore."], ['a', "Right. Okay."]] },
    { id: 'fc2.h.04', when: { of: 'hurt' }, stage: 'By the pool, {a} asks {b} for five minutes.', turns: [
      ['a', "I just need to understand."], ['b', "There's nothing to understand. It just happened."],
      ['a', "Nothing just happens."], ['b', "I'm sorry I didn't say something sooner."]] },
    // furious
    { id: 'fc2.f.01', when: { of: 'furious' }, stage: '{a} walks straight across the garden to {b}.', turns: [
      ['a', "You lied to my face."], ['b', "I didn't lie."],
      ['a', "You told me there was nothing to worry about, and then you did that."], ['b', "It wasn't planned!"], ['a', "I don't care if it was planned!"]],
      beat: 'The whole garden has stopped.' },
    { id: 'fc2.f.02', when: { of: 'furious' }, stage: '{a} stands up at the fire pit, looking straight at {b}.', turns: [
      ['a', "Not long ago you were telling me you liked me."], ['b', "I did like you."],
      ['a', "Liked. Past tense. Very quick."], ['b', "Can we not do this here?"], ['a', "Why not? You did it here."]] },
    { id: 'fc2.f.03', when: { of: 'furious' }, stage: 'In the kitchen, {a} slams a cupboard shut behind {b}.', turns: [
      ['a', "You couldn't even look at me when you did it."], ['b', "I said sorry."],
      ['a', "You barely said sorry. That's not sorry."], ['b', "What do you want me to say?"], ['a', "The truth, for once."]] },
    { id: 'fc2.f.04', when: { of: 'furious' }, stage: '{a} follows {b} out onto the lawn.', turns: [
      ['a', "Everyone saw what you did."], ['b', "I didn't do anything wrong. I followed my heart."],
      ['a', "Your heart's got a funny way of doing things."], ['b', "I'm not going to stand here and be shouted at."]], beat: '{b} walks off. {a} shouts after {b.obj}.' },
  ],

  'feud-interrupt': [
    { id: 'fi.01', stage: '{b} and {c} are on the daybed. {a} walks straight up to them.', turns: [
      ['a', "Sorry, am I interrupting?"], ['c', "Yeah, a bit."],
      ['a', "Good."], ['b', "What do you want?"], ['a', "Nothing. Carry on."]], beat: '{a} walks off, and neither of them can carry on.' },
    { id: 'fi.02', stage: '{a} sits down at the other end of the swing from {b} and {c}.', turns: [
      ['b', "Can we have a minute?"], ['a', "It's a swing. It's for everyone."],
      ['c', "Seriously?"], ['a', "Seriously."]] },
    { id: 'fi.03', stage: '{b} and {c} are kissing by the pool when {a} walks past.', turns: [
      ['a', "Wow. You didn't waste any time."], ['b', "Don't."],
      ['a', "Don't what? I'm just walking to the kitchen."]], beat: '{c} looks at {b}. {b} looks at the floor.' },
    { id: 'fi.04', stage: '{a} stops by {b} and {c} on the terrace.', turns: [
      ['a', "I just wanted to say, that's mean. Doing that where I can see."], ['c', "We're not doing anything."],
      ['a', "I'm not talking to you."], ['b', "{a}, please."]] },
  ],

  'feud-shade': [
    // catty: at the new one
    { id: 'fsh.c.01', when: { of: 'catty' }, stage: 'In the kitchen, {a} ends up next to {b}.', turns: [
      ['a', "Enjoy it."], ['b', "Sorry?"],
      ['a', "Enjoy it while it lasts. {c} did the same to me."], ['b', "That's not fair."], ['a', "No. It wasn't."]] },
    { id: 'fsh.c.02', when: { of: 'catty' }, stage: '{a} watches {b} walk past with {c}.', turns: [
      ['a', "Good luck with that one."], ['b', "What's that meant to mean?"],
      ['a', "You'll find out."]], beat: '{b} goes straight to tell {c}.' },
    { id: 'fsh.c.03', when: { of: 'catty' }, stage: 'By the pool, {a} says it loud enough for {b} to hear.', turns: [
      ['a', "Some people just move in on anyone, don't they?"], ['b', "I didn't move in on anyone."],
      ['a', "You didn't wait long, though."], ['b', "{c} made the choice. Not me."]] },
    { id: 'fsh.c.04', when: { of: 'catty' }, stage: 'In the dressing room, {a} catches {b}\'s eye in the mirror.', turns: [
      ['a', "Nice top. I think {c} liked it on me, too."], ['b', "Wow."], ['a', "Just saying."]] },
    // civil: no digs at the new one
    { id: 'fsh.v.01', when: { of: 'civil' }, stage: '{a} finds {b} alone in the kitchen.', turns: [
      ['a', "I just want you to know, it's not your fault."], ['b', "I felt awful about it."],
      ['a', "Don't. It's {c} I've got a problem with. Not you."], ['b', "Thank you. Honestly."]] },
    { id: 'fsh.v.02', when: { of: 'civil' }, stage: 'On the terrace, {a} sits down next to {b}.', turns: [
      ['b', "Is this going to be awkward?"], ['a', "Only if we make it awkward."],
      ['b', "Okay. Let's not."], ['a', "Deal."]] },
    { id: 'fsh.v.03', when: { of: 'civil' }, stage: '{a} and {b} end up making breakfast at the same time.', turns: [
      ['a', "You want some?"], ['b', "Are you sure?"],
      ['a', "It's eggs. I'm not going to hold a grudge over eggs."]], beat: 'They both laugh, a bit nervously.' },
  ],

  'feud-ick': [
    { id: 'fk.01', stage: '{a} and {b} are on the sunbeds.', turns: [
      ['a', "I think I've got the ick."], ['b', "With {c}?"],
      ['a', "Honestly? Looking at {c} now, I've got the ick."], ['b', "Good. Hold on to that."]] },
    { id: 'fk.02', stage: 'In the dressing room, {a} does {a.posAdj} make-up next to {b}.', turns: [
      ['a', "I'm done being upset about {c}."], ['b', "Yeah?"],
      ['a', "Yeah. I'm going to get ready and have a good night."], ['b', "That's what I like to hear."]] },
    { id: 'fk.03', stage: '{b} brings {a} a drink by the pool.', turns: [
      ['b', "How are you feeling about {c}?"], ['a', "Honestly? I look at {c} now and I feel nothing."],
      ['b', "Nothing?"], ['a', "A little bit of the ick. Mostly nothing."]] },
    { id: 'fk.04', stage: 'On the terrace, {a} is laughing with {b}.', turns: [
      ['b', "You seem better."], ['a', "I am. {c} did me a favour, really."],
      ['b', "How?"], ['a', "Now I know exactly what I don't want."]] },
  ],

  'feud-closure': [
    // peace: talked out, with some kind of end
    { id: 'fcl.p.01', when: { of: 'peace' }, stage: '{b} asks {a} for a chat on the swing.', turns: [
      ['b', "I owe you a real apology. Not a quick sorry."], ['a', "Go on, then."],
      ['b', "I handled it badly. You deserved better."], ['a', "…Thank you. I needed to hear that."]], beat: 'They hug. It takes a while for either of them to let go.' },
    { id: 'fcl.p.02', when: { of: 'peace' }, stage: '{a} sits down next to {b} by the fire pit.', turns: [
      ['a', "I don't want to spend the rest of my time in here hating you."], ['b', "I don't want that either."],
      ['a', "Friends?"], ['b', "I'd like that."]] },
    { id: 'fcl.p.03', when: { of: 'peace' }, stage: 'In the kitchen, {b} makes {a} a tea.', turns: [
      ['b', "Peace offering."], ['a', "It'll take more than a tea."],
      ['b', "I know. It's a start."], ['a', "It's a start."]], beat: '{a} takes the tea.' },
    { id: 'fcl.p.04', when: { of: 'peace' }, stage: 'On the terrace, the two of them finally talk properly.', turns: [
      ['a', "I think we were better as friends anyway."], ['b', "Do you really think that?"],
      ['a', "I think I have to. And I think it's true."], ['b', "Me too."]] },
    // refused: not ready
    { id: 'fcl.r.01', when: { of: 'refused' }, stage: '{b} tries to talk to {a} by the pool.', turns: [
      ['b', "Can we talk?"], ['a', "Not yet."],
      ['b', "I just want to say sorry."], ['a', "And I'm not ready to hear it."]], beat: '{a} gets up and goes inside.' },
    { id: 'fcl.r.02', when: { of: 'refused' }, stage: '{b} sits down next to {a} on the swing.', turns: [
      ['b', "I hate that we're like this."], ['a', "You should have thought of that."],
      ['b', "I did think of it. I just got it wrong."], ['a', "Yeah. You did."]] },
    { id: 'fcl.r.03', when: { of: 'refused' }, stage: 'At breakfast, {b} passes {a} the coffee.', turns: [
      ['b', "Are we ever going to be okay?"], ['a', "Maybe one day. Not today."]] },
    { id: 'fcl.r.04', when: { of: 'refused' }, stage: '{a} finds {b} waiting in the dressing room.', turns: [
      ['b', "Please. Two minutes."], ['a', "You had all that time to talk to me. Now you want two minutes?"],
      ['b', "I know how it looks."], ['a', "You don't, though."]] },
  ],
};
