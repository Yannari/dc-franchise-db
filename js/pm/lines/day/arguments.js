// pm/lines/day/arguments.js — the villa's arguments, by what they are about. Data only.
//
//   argument   [a, b]   a starts it. `cause` (events.js argumentReasons) is
//                       what really happened; {about} is the third person the
//                       row is about, who is not in the scene.
//     jealous    b is a's partner, and was seen flirting with {about} today
//     mismatch   b is a's partner, and a is further in than b
//     stress     b is a's partner, and a is stressed and snaps
//     bicker     b is a's partner: the small stuff, in the moment
//     rival      b is after a's partner, {about}
//     envy       a fancies {about}, who is coupled with b
//     stole      b took {about} from a at a recoupling or on arrival
//     voted      b voted against a at the fire pit, and a stayed
//     told       b told {about} (a's partner) what a had been hiding
//     clash      two who don't get on, over something in front of them
//
// User: "these arguments seem dumb and make no sense, and the English is
// not fluent". The old pools had to invent the reason — "you laughed when I
// fell over", "what you said last night" — because nothing told them why.
// Every row here is about the thing that happened, or the thing happening in
// the scene, and nothing else. The ending (argument-close) follows.

const C = cause => ({ cause });

export const ARGUMENTS = [
  // ── jealous ──
  { id: 'arg.j.01', when: C('jealous'), stage: '{a} waits until {b} is on {b.posAdj} own.',
    turns: [['a', "What was that with {about}?"], ['b', "What was what? We were talking."], ['a', "You were all over each other, in front of everyone."], ['b', "I'm allowed to talk to people."]] },
  { id: 'arg.j.02', when: C('jealous'),
    turns: [['a', "Everyone saw you with {about}. Everyone."], ['b', "Saw what? Nothing happened."], ['a', "Then why did three people come and tell me about it?"]] },
  { id: 'arg.j.03', when: C('jealous'),
    turns: [['a', "Do you {~fancy} {about}? Just be honest with me."], ['b', "No. I'm with you."], ['a', "That's not a no. That's an answer to a different question."]] },
  { id: 'arg.j.04', when: C('jealous'), stage: "{b} comes back to the daybed, and {a} doesn't move up.",
    turns: [['b', "What's wrong?"], ['a', "Go and sit with {about}. You seemed happy enough there."], ['b', "Oh, come on. It was one chat."]] },
  { id: 'arg.j.05', when: C('jealous'),
    turns: [['a', "If I did that with someone, you'd go mad."], ['b', "Did what?"], ['a', "Spent the whole afternoon laughing with {about}."], ['b', "I wasn't doing anything wrong."]] },
  { id: 'arg.j.06', when: C('jealous'),
    turns: [['a', "I'm not stupid. I saw how {about} was looking at you."], ['b', "I can't control how people look at me."], ['a', "You can control whether you look back."]] },
  { id: 'arg.j.07', when: C('jealous'), stage: '{a} pulls {b} aside by the pool.',
    turns: [['a', "Is there something going on with you and {about}?"], ['b', "No! Why would you even think that?"], ['a', "Because of what I saw today."]] },

  // ── mismatch ──
  { id: 'arg.m.01', when: C('mismatch'),
    turns: [['a', "I feel like I'm the only one trying here."], ['b', "That's not fair. I'm here, aren't I?"], ['a', "Being here isn't the same as being in it."]] },
  { id: 'arg.m.02', when: C('mismatch'),
    turns: [['a', "I don't know what we are, and it's doing my head in."], ['b', "Why does it need a name?"], ['a', "Because I know what I feel, and I don't think you feel the same."]] },
  { id: 'arg.m.03', when: C('mismatch'),
    turns: [['a', "Do you actually see this going anywhere?"], ['b', "It's early. I'm taking it slow."], ['a', "You're taking it so slow it's going backwards."]] },
  { id: 'arg.m.04', when: C('mismatch'), stage: '{a} has clearly been thinking about this all day.',
    turns: [['a', "I've told you how I feel. You've told me nothing."], ['b', "I'm not going to say something I'm not sure of yet."], ['a', "So you're not sure."]] },
  { id: 'arg.m.05', when: C('mismatch'),
    turns: [['a', "Every time I get closer, you pull back."], ['b', "I don't mean to."], ['a', "But you do. Every time."]] },

  // ── stress ──
  { id: 'arg.s.01', when: C('stress'),
    turns: [['b', "You've bitten my head off three times since lunch."], ['a', "Because you keep asking me if I'm okay."], ['b', "Because you're clearly not."], ['a', "I'm tired, I'm hot, and there's nowhere in here to be on my own."]] },
  { id: 'arg.s.02', when: C('stress'),
    turns: [['a', "Can you just give me five minutes?"], ['b', "I only asked if you wanted a drink."], ['a', "And I said no. Twice."]] },
  { id: 'arg.s.03', when: C('stress'), stage: '{a} has been on edge all day, and {b} gets the worst of it.',
    turns: [['b', "Why are you snapping at me? I haven't done anything."], ['a', "I know you haven't. That's not the point."], ['b', "Then what is the point?"]] },
  { id: 'arg.s.04', when: C('stress'),
    turns: [['a', "Please stop asking me what's wrong."], ['b', "I'm worried about you."], ['a', "Then stop making me explain it."]] },
  { id: 'arg.s.05', when: C('stress'),
    turns: [['b', "What's going on with you today?"], ['a', "Nothing. Everything. I don't know."], ['b', "You can talk to me, you know."], ['a', "Not right now I can't."]] },

  // ── bicker ──
  { id: 'arg.b.01', when: C('bicker'),
    turns: [['a', "You didn't save me a seat."], ['b', "There are seats everywhere."], ['a', "That's not the point. You always save me a seat."]] },
  { id: 'arg.b.02', when: C('bicker'),
    turns: [['b', "Can you at least look at me when I'm talking to you?"], ['a', "I am looking at you."], ['b', "You're looking at the pool."]] },
  { id: 'arg.b.03', when: C('bicker'),
    turns: [['a', "You're not listening to a word I'm saying."], ['b', "I'm listening. I just don't agree."], ['a', "Then say you don't agree. Don't just nod."]] },
  { id: 'arg.b.04', when: C('bicker'), stage: 'It starts over whose turn it is to make the drinks.',
    turns: [['a', "I made them last time."], ['b', "And I made them the time before that."], ['a', "You made one. For yourself."]] },
  { id: 'arg.b.05', when: C('bicker'),
    turns: [['a', "Why do you always make a joke when I'm being serious?"], ['b', "I'm trying to cheer you up."], ['a', "It's not working."]] },
  { id: 'arg.b.06', when: C('bicker'),
    turns: [['b', "Why are you being so short with me?"], ['a', "I'm not being short."], ['b', "You've said about four words to me all morning."]] },

  // ── rival ──
  { id: 'arg.r.01', when: C('rival'),
    turns: [['a', "I've seen the way you look at {about}."], ['b', "I don't know what you mean."], ['a', "Yes, you do. {about} is with me. Back off."]] },
  { id: 'arg.r.02', when: C('rival'), stage: '{a} corners {b} in the kitchen.',
    turns: [['a', "Can I say something? Stay away from {about}."], ['b', "We're friends."], ['a', "You don't look at your friends like that."]] },
  { id: 'arg.r.03', when: C('rival'),
    turns: [['a', "Every time I turn round, you're next to {about}."], ['b', "It's a small villa."], ['a', "It's not that small."]] },
  { id: 'arg.r.04', when: C('rival'),
    turns: [['a', "If you've got a problem with me and {about}, say it."], ['b', "I haven't got a problem."], ['a', "Then stop trying to get in the middle of us."]] },
  { id: 'arg.r.05', when: C('rival'),
    turns: [['a', "Everyone can see you're going after {about}."], ['b', "I'm not going after anyone."], ['a', "Then what are you doing?"]] },

  // ── envy ──
  { id: 'arg.e.01', when: C('envy'),
    turns: [['a', "You don't even appreciate {about}."], ['b', "Excuse me? What's it got to do with you?"], ['a', "Nothing. I'm just saying what everyone can see."]] },
  { id: 'arg.e.02', when: C('envy'),
    turns: [['b', "Why have you got a problem with me?"], ['a', "I haven't."], ['b', "You've had one since I coupled up with {about}."]] },
  { id: 'arg.e.03', when: C('envy'), stage: "{a} can't help it, and it comes out sharper than meant.",
    turns: [['a', "You and {about} have got nothing in common."], ['b', "And you'd know, would you?"], ['a', "I've spent more time talking to {about} than you have."]] },
  { id: 'arg.e.04', when: C('envy'),
    turns: [['b', "Is this about {about}?"], ['a', "No."], ['b', "It is, isn't it?"]] },

  // ── stole ──
  { id: 'arg.st.01', when: C('stole'),
    turns: [['a', "You knew I was with {about}, and you did it anyway."], ['b', "I went with my heart. I'm not going to apologise for that."], ['a', "You could have spoken to me first."]] },
  { id: 'arg.st.02', when: C('stole'),
    turns: [['a', "Do you know how it felt, standing there on my own?"], ['b', "I'm sorry you got hurt. I'm not sorry I picked {about}."], ['a', "Wow. Okay."]] },
  { id: 'arg.st.03', when: C('stole'), stage: "{a} hasn't said a word to {b} since the fire pit, until now.",
    turns: [['a', "You smiled at me all day, and then you took {about}."], ['b', "It wasn't personal."], ['a', "It was very personal. To me."]] },
  { id: 'arg.st.04', when: C('stole'),
    turns: [['b', "Are we going to talk about it, or are you going to ignore me forever?"], ['a', "You took {about} off me. What is there to talk about?"], ['b', "I didn't take anyone. {about} chose too."]] },
  { id: 'arg.st.05', when: C('stole'),
    turns: [['a', "Every time I see you with {about}, it winds me up."], ['b', "Then don't look."], ['a', "That's easy for you to say."]] },

  // ── voted ──
  { id: 'arg.v.01', when: C('voted'),
    turns: [['a', "You voted for me to go home."], ['b', "It wasn't about you. It was a hard choice."], ['a', "You made it look very easy."]] },
  { id: 'arg.v.02', when: C('voted'), stage: '{a} brings it up the second they are alone.',
    turns: [['a', "I thought we were friends."], ['b', "We are."], ['a', "Friends don't stand up at the fire pit and say my name."]] },
  { id: 'arg.v.03', when: C('voted'),
    turns: [['b', "Are you still annoyed about the vote?"], ['a', "Would you be?"], ['b', "Probably. But I had to pick someone."]] },
  { id: 'arg.v.04', when: C('voted'),
    turns: [['a', "I'm still here, by the way. In case you were wondering."], ['b', "Don't make this weird."], ['a', "You made it weird when you voted me out."]] },

  // ── told ──
  { id: 'arg.t.01', when: C('told'),
    turns: [['a', "Why did you tell {about}?"], ['b', "Because {about} deserved to know."], ['a', "It wasn't yours to tell."]] },
  { id: 'arg.t.02', when: C('told'), stage: '{a} goes straight over to {b}.',
    turns: [['a', "You couldn't wait to go running to {about}, could you?"], ['b', "I'd want to know, if it was me."], ['a', "You could have come to me first."]] },
  { id: 'arg.t.03', when: C('told'),
    turns: [['a', "Do you have any idea what you've just done?"], ['b', "I told the truth."], ['a', "You've just blown up my whole couple."]] },
  { id: 'arg.t.04', when: C('told'),
    turns: [['b', "Don't look at me like that. You did it, not me."], ['a', "And you couldn't keep it to yourself for one day."], ['b', "Not when it's about {about}, no."]] },

  // ── clash: in front of them, now ──
  { id: 'arg.c.01', when: C('clash'), stage: 'It starts over who used the last of the hot water.',
    turns: [['a', "Five minutes. That's all anyone gets in there."], ['b', "I was ten minutes, tops."], ['a', "I've been standing here for twenty."]] },
  { id: 'arg.c.02', when: C('clash'),
    turns: [['a', "Can you let me finish a sentence?"], ['b', "I was joining in."], ['a', "It's not joining in if I haven't finished."]] },
  { id: 'arg.c.03', when: C('clash'), stage: 'The kitchen, after dinner. Nobody has done the washing-up.',
    turns: [['a', "I've done it the last two nights."], ['b', "And I did it before that."], ['a', "Once. You did it once."]] },
  { id: 'arg.c.04', when: C('clash'), stage: 'It starts over the last of the hair straighteners.',
    turns: [['a', "I put them down for ten seconds."], ['b', "You put them down and walked off."], ['a', "To get a drink! I was coming back!"]] },
  { id: 'arg.c.05', when: C('clash'),
    turns: [['a', "Do you have to be this loud about everything?"], ['b', "Do you have to be this miserable about everything?"]],
    beat: 'The kitchen goes very quiet.' },
  { id: 'arg.c.06', when: C('clash'),
    turns: [['a', "Stop telling me to calm down."], ['b', "Then calm down, and I'll stop."]],
    beat: '{a} slams the fridge door, and the whole kitchen jumps.' },
  { id: 'arg.c.07', when: C('clash'), stage: '{a} and {b} both reach for the last sunbed in the shade.',
    turns: [['a', "I was about to sit there."], ['b', "And I got here first."], ['a', "My towel's on it."]] },
  { id: 'arg.c.08', when: C('clash'),
    turns: [['a', "I don't think you like me very much."], ['b', "I don't really know you."], ['a', "You've made your mind up anyway."]] },
  { id: 'arg.c.09', when: C('clash'), stage: '{b} has just changed the music for the third time.',
    turns: [['a', "Can we listen to one song all the way through?"], ['b', "This one's better."], ['a', "You said that about the last one."]] },
  { id: 'arg.c.10', when: C('clash'),
    turns: [['a', "You always have to have the last word, don't you?"], ['b', "No."]],
    beat: '{a} throws both hands up and walks off.' },
];
