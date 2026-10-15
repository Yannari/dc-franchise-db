// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/witness.js — the people watching a row (js/bb/witness.js decides who and where)
// ══════════════════════════════════════════════════════════════════════
//
// Written against docs/bb-dialogue-style.md. Said in the middle of somebody else's row (the dishes,
// a remark, a blow-up in the kitchen), so nothing here names what it is about.
//
// Roles, in the row itself:
//   witness.side     c backs a against b
//   witness.turned   c backs a against b, and b is c's friend: it costs c to say it
//   witness.out      a and b are going at it; c is close to both and will not choose
// And later, when the one let down brings it up (a is let down, b is the witness, {x} the other one):
//   witness.after.<side|turned|out>.<sorry|stand>   b apologises, or b stands by it
// Ids 'wt.'.

export default {
  'witness.side': [
    { id: 'wt.s1', turns: [
      { by: 'c', say: "{b}. Stop. {a} didn't do anything." },
      { by: 'b', say: "Nobody asked you, {c}." },
      { by: 'c', say: "I know. I'm saying it anyway." },
    ] },
    { id: 'wt.s2', turns: [
      { beat: '{c} gets up and goes to stand next to {a}.' },
      { by: 'c', say: "I'm with {a}. Sorry. I am." },
      { by: 'b', say: "Of course you are." },
    ] },
    { id: 'wt.s3', turns: [
      { by: 'c', say: "I was right here, {b}. I saw the whole thing." },
      { by: 'b', say: "Then you saw it wrong." },
      { by: 'c', say: "I didn't see it wrong." },
    ] },
    { id: 'wt.s4', turns: [
      { by: 'a', say: "Am I crazy? {c}, am I crazy?" },
      { by: 'c', say: "You're not crazy." },
      { by: 'b', say: "Wow. Okay. Good to know." },
    ] },
    { id: 'wt.s5', turns: [
      { by: 'c', say: "If you've got a problem with {a}, you've got a problem with me." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'c', say: "It's a fact. Do what you want with it." },
    ] },
    { id: 'wt.s6', turns: [
      { by: 'c', say: "Come on, {a}. It's not worth it." },
      { by: 'b', say: "Oh, so I'm 'not worth it'." },
      { by: 'c', say: "Right now? No." },
      { beat: '{c} walks out with {a}. {b} is left standing there.' },
    ] },
    { id: 'wt.s7', turns: [
      { by: 'b', say: "{c}, back me up here." },
      { by: 'c', say: "I can't. {a}'s right." },
      { by: 'b', say: "Unbelievable." },
    ] },
    { id: 'wt.s10', turns: [
      { by: 'c', say: "Honestly, {b}? This isn't about what you say it's about, and everybody knows it." },
      { by: 'b', say: "Then what's it about, {c}?" },
      { by: 'c', say: "You tell us." },
    ] },
  ],

  'witness.turned': [
    { id: 'wt.t1', turns: [
      { by: 'b', say: "{c}. Tell them." },
      { by: 'c', say: "...I can't, {b}. I'm sorry. You're wrong on this one." },
      { by: 'b', say: "You're joking." },
      { by: 'c', say: "I wish I was." },
    ] },
    { id: 'wt.t2', turns: [
      { by: 'c', say: "I love you, {b}. But {a}'s right." },
      { beat: '{b} stares at {c} for a long second.' },
      { by: 'b', say: "Okay. Noted." },
    ] },
    { id: 'wt.t3', turns: [
      { by: 'c', say: "{b}, I'm on your side about everything in this house. Not this." },
      { by: 'b', say: "Everything except the one thing that matters right now." },
      { by: 'c', say: "Yeah. Except this." },
    ] },
    { id: 'wt.t4', turns: [
      { beat: '{b} looks to {c}. {c} looks at the floor.' },
      { by: 'c', say: "Don't look at me like that. You know what you said." },
      { by: 'b', say: "Wow. You too." },
    ] },
    { id: 'wt.t5', turns: [
      { by: 'c', say: "Just say sorry, {b}." },
      { by: 'b', say: "Are you serious right now? You're supposed to be my friend." },
      { by: 'c', say: "I am your friend. That's why I'm telling you." },
    ] },
    { id: 'wt.t6', turns: [
      { by: 'b', say: "You're really doing this. In front of everyone." },
      { by: 'c', say: "You did it in front of everyone first." },
      { beat: 'Nobody in the room breathes.' },
    ] },
    { id: 'wt.t7', turns: [
      { by: 'c', say: "Okay, I have to say it. {b}, that was out of line." },
      { by: 'b', say: "Out of line. From you." },
      { by: 'c', say: "From me. Yeah." },
    ] },
  ],

  // ── a shouting match only ─────────────────────────────────────────────
  'witness.side.loud': [
    { id: 'wt.s8', turns: [
      { by: 'c', say: "Can everybody just look at who's shouting right now? It's not {a}." },
      { by: 'b', say: "I'm not shouting!" },
      { by: 'c', say: "You're shouting." },
    ] },
    { id: 'wt.s9', turns: [
      { by: 'c', say: "Hey. {b}. Lower your voice." },
      { by: 'b', say: "Or what?" },
      { by: 'c', say: "Or everybody in this house watches you do this. They're already watching." },
    ] },
    { id: 'wt.sl3', turns: [
      { by: 'c', say: "Okay! Okay. Everybody can hear you, {b}. The whole house can hear you." },
      { by: 'b', say: "Good! Let them!" },
      { by: 'c', say: "They are. And they're all looking at you, not {a}." },
    ] },
    { id: 'wt.sl4', turns: [
      { by: 'c', say: "Don't scream at {a}. You don't get to scream at {a}." },
      { by: 'b', say: "I'm not screaming." },
      { by: 'c', say: "You're screaming, {b}." },
    ] },
  ],
  'witness.turned.loud': [
    { id: 'wt.tl3', turns: [
      { by: 'b', say: "{c}! Are you hearing this?" },
      { by: 'c', say: "Everybody's hearing this, {b}. That's the problem." },
      { by: 'b', say: "So you're with {a} now." },
      { by: 'c', say: "I'm with whoever isn't yelling." },
    ] },
    { id: 'wt.t8', turns: [
      { by: 'b', say: "Tell them I'm right, {c}." },
      { by: 'c', say: "You're not right. You're loud. It's different." },
      { by: 'b', say: "...Thanks. Really." },
    ] },
    { id: 'wt.tl2', turns: [
      { by: 'c', say: "{b}, I've got your back on everything. Stop yelling at {a}." },
      { by: 'b', say: "Whose side are you on?" },
      { by: 'c', say: "Right now? The side that isn't yelling." },
    ] },
  ],

  // ── somebody doing it to somebody: a jab, a joke at their expense ─────────
  // defend: a is on the receiving end, b is doing it, c stands up for a
  // join:   a is doing it, b is on the receiving end, c goes along with a
  'witness.defend': [
    { id: 'wt.d1', turns: [
      { by: 'c', say: "Leave it, {b}. It's not funny." },
      { by: 'b', say: "It's a little funny." },
      { by: 'c', say: "It's not." },
    ] },
    { id: 'wt.d2', turns: [
      { by: 'c', say: "Why are you always on {a}? Every day. Pick somebody else." },
      { by: 'b', say: "Relax. It's banter." },
      { by: 'c', say: "Banter's when both people are laughing." },
    ] },
    { id: 'wt.d3', turns: [
      { beat: '{c} sits down next to {a}.' },
      { by: 'c', say: "Ignore {b}. {b} does that when {b.sub} gets bored." },
      { by: 'a', say: "I'm fine." },
      { by: 'c', say: "You're not, but you will be." },
    ] },
    { id: 'wt.d4', turns: [
      { by: 'c', say: "Say it again, {b}. I dare you. Say it to {a} again, with me standing here." },
      { beat: '{b} does not say it again.' },
    ] },
    { id: 'wt.d5', turns: [
      { by: 'b', say: "Come on, {c}, back me up, that was funny." },
      { by: 'c', say: "It was mean. It was a little bit funny and a lot mean." },
    ] },
    { id: 'wt.d6', turns: [
      { by: 'c', say: "{a}, come sit with me." },
      { beat: '{a} goes and sits with {c}. Neither of them looks at {b}.' },
      { by: 'b', say: "...Okay, so we're doing that." },
    ] },
  ],
  'witness.join': [
    { id: 'wt.j1', turns: [
      { by: 'c', say: "No, but {a}'s right, though." },
      { by: 'b', say: "Thanks, {c}. Really helpful." },
      { beat: '{c} and {a} share a look. {b} sees it.' },
    ] },
    { id: 'wt.j2', turns: [
      { beat: '{c} laughs. Then tries to stop laughing. Then laughs harder.' },
      { by: 'b', say: "Great. Now there's two of you." },
    ] },
    { id: 'wt.j3', turns: [
      { by: 'c', say: "In fairness, {b}, you did walk into that one." },
      { by: 'b', say: "I didn't walk into anything!" },
      { by: 'a', say: "You walked right into it." },
    ] },
    { id: 'wt.j4', turns: [
      { by: 'c', say: "Okay, that one was good." },
      { by: 'a', say: "Thank you." },
      { by: 'b', say: "Don't encourage {a.obj}." },
    ] },
    { id: 'wt.j5', turns: [
      { by: 'b', say: "{c}, are you seriously laughing?" },
      { by: 'c', say: "I'm not laughing at you. I'm laughing near you." },
    ] },
  ],

  'witness.out': [
    { id: 'wt.o1', turns: [
      { by: 'a', say: "{c}, say something." },
      { by: 'c', say: "Nope. I'm not getting in the middle of this." },
      { by: 'a', say: "You're already in the middle of it." },
      { by: 'c', say: "Then I'm getting out of the middle of it." },
      { beat: '{c} leaves the room.' },
    ] },
    { id: 'wt.o2', turns: [
      { by: 'c', say: "I like you both. That's all I'm saying. I like you both." },
      { by: 'a', say: "That's not an answer." },
      { by: 'c', say: "It's the only one I've got." },
    ] },
    { id: 'wt.o3', turns: [
      { by: 'a', say: "{c}? Anything?" },
      { by: 'c', say: "Do not put me in this. Do not." },
    ] },
    { id: 'wt.o4', turns: [
      { by: 'c', say: "Okay, can we all just — no? Can we not?" },
      { by: 'b', say: "Stay out of it, {c}." },
      { by: 'c', say: "Happily. I'm staying out of it. Watch me stay out of it." },
    ] },
    { id: 'wt.o5', turns: [
      { beat: '{a} looks at {c}, waiting. {c} becomes very interested in the ceiling.' },
      { by: 'a', say: "Great. Thanks, {c}." },
      { by: 'c', say: "What? It's a nice ceiling." },
    ] },
    { id: 'wt.o6', turns: [
      { by: 'c', say: "I'm Switzerland. I'm literally Switzerland right now." },
      { by: 'a', say: "Switzerland. Okay." },
      { by: 'b', say: "Good for Switzerland." },
    ] },
    { id: 'wt.o7', turns: [
      { by: 'a', say: "You're really not going to say anything?" },
      { by: 'c', say: "Whatever I say, one of you hates me. So no." },
    ] },
  ],

  // ── later: the one let down brings it up ────────────────────────────────
  'witness.after.side.sorry': [
    { id: 'wa.ss1', turns: [
      { by: 'a', say: "Can I talk to you?" },
      { by: 'b', say: "Yeah. About the thing with {x}?" },
      { by: 'a', say: "You took {x}'s side. In front of everybody." },
      { by: 'b', say: "I know. I should have pulled you aside after. I'm sorry." },
      { by: 'a', say: "You should have." },
      { by: 'b', say: "I know. I'm sorry." },
      { by: 'a', dr: "{b} said sorry twice. Once I can ignore. Twice, I think {b} means it." },
    ] },
    { id: 'wa.ss2', turns: [
      { by: 'b', say: "Hey. About earlier." },
      { by: 'a', say: "Mm." },
      { by: 'b', say: "I wasn't trying to pile on. I just said what I saw. I could have said it nicer." },
      { by: 'a', say: "You could have said it never." },
      { by: 'b', say: "Fair. That's fair." },
      { by: 'a', say: "...We're fine. Just don't do it again." },
      { by: 'b', dr: "I'm not sorry I said it. I'm sorry I said it with the whole house watching. In here, that's two different things." },
    ] },
    { id: 'wa.ss3', turns: [
      { by: 'a', say: "So. You and {x}. Team now?" },
      { by: 'b', say: "It's not a team. I just thought you were wrong." },
      { by: 'a', say: "Out loud." },
      { by: 'b', say: "Yeah. Out loud. That part was a mistake. I'm sorry." },
      { by: 'a', say: "...Okay. Thanks for saying it." },
      { by: 'a', dr: "Apology accepted. Memory not erased." },
    ] },
    { id: 'wa.ss4', turns: [
      { by: 'b', say: "I've been feeling weird all day. About the {x} thing." },
      { by: 'a', say: "Good." },
      { by: 'b', say: "Wow. Okay. I deserve that." },
      { by: 'a', say: "You do. ...I'm not mad. I was. I'm not now." },
      { by: 'b', say: "Hug?" },
      { by: 'a', say: "Don't push it." },
      { by: 'b', dr: "{a} let me off. I don't think {a} has forgotten it, though. Nobody in here forgets anything." },
    ] },
  ],
  'witness.after.side.stand': [
    { id: 'wa.sd1', turns: [
      { by: 'a', say: "You took {x}'s side." },
      { by: 'b', say: "I took the side I agreed with." },
      { by: 'a', say: "In front of everyone." },
      { by: 'b', say: "That's where it happened. I'm not going to whisper it." },
      { by: 'b', say: "If that's a problem, it's a problem." },
      { by: 'a', dr: "Okay. Now I know where {b} stands. That's actually useful." },
    ] },
    { id: 'wa.sd2', turns: [
      { by: 'a', say: "Are we good?" },
      { by: 'b', say: "We're good. I'd say it again, though." },
      { by: 'a', say: "...Okay." },
      { by: 'b', say: "Okay." },
      { by: 'b', say: "Good talk." },
      { by: 'a', dr: "'I'd say it again.' Great. Lovely. I'll remember that one on Thursday." },
    ] },
    { id: 'wa.sd3', turns: [
      { by: 'a', say: "Why did you jump in like that?" },
      { by: 'b', say: "Because you were being unfair to {x}." },
      { by: 'a', say: "So you're not even sorry." },
      { by: 'b', say: "No. I'm not sorry. I'm sorry you're upset." },
      { by: 'a', say: "That's not the same thing." },
      { by: 'b', say: "I know it's not." },
      { by: 'b', dr: "I'm not apologising for being honest. If that costs me a vote, it costs me a vote." },
    ] },
    { id: 'wa.sd4', turns: [
      { by: 'a', say: "I thought we were close." },
      { by: 'b', say: "We are close. Close doesn't mean I agree with everything." },
      { by: 'a', say: "It means you don't say it in the kitchen." },
      { by: 'b', say: "Then maybe don't do it in the kitchen." },
      { by: 'b', say: "I'm just saying." },
      { by: 'a', dr: "{b} is right, which is the most annoying part." },
    ] },
  ],
  'witness.after.turned.sorry': [
    { id: 'wa.ts1', turns: [
      { by: 'a', say: "Out of everybody in this house. You." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "I'd have expected it from anyone else. Not you." },
      { by: 'b', say: "I know. I'm sorry. I should have told you after, alone, not in front of {x}." },
      { by: 'a', say: "...Yeah. You should have." },
      { by: 'a', dr: "It's not that {b} disagreed with me. It's that {b} did it out loud, next to {x}. That's the part I can't get past yet." },
    ] },
    { id: 'wa.ts2', turns: [
      { by: 'b', say: "You haven't looked at me all day." },
      { by: 'a', say: "I've been busy." },
      { by: 'b', say: "You've been mad. I'd be mad too. I'm sorry. I picked the worst possible moment." },
      { by: 'a', say: "You did pick the worst possible moment." },
      { by: 'b', say: "Friends?" },
      { by: 'a', say: "...Friends. Probation friends." },
      { by: 'b', dr: "Probation friends. I'll take probation friends." },
    ] },
    { id: 'wa.ts3', turns: [
      { by: 'b', say: "Can we talk about the {x} thing?" },
      { by: 'a', say: "You mean the thing where you sided with {x} over me?" },
      { by: 'b', say: "Yeah. That thing. I was wrong to do it like that." },
      { by: 'a', say: "Like that, or at all?" },
      { by: 'b', say: "Like that." },
      { by: 'a', dr: "'Like that.' So {b} still thinks I was wrong. Good to know." },
    ] },
  ],
  'witness.after.turned.stand': [
    { id: 'wa.td1', turns: [
      { by: 'a', say: "You sided with {x}. Over me." },
      { by: 'b', say: "I sided with what was right." },
      { by: 'a', say: "Don't. Don't give me a speech." },
      { by: 'b', say: "Then I won't. But I'm not taking it back." },
      { by: 'a', say: "Fine. Then we're done talking about it." },
      { by: 'a', dr: "I thought {b} was my person in here. Turns out {b} is the house's person." },
    ] },
    { id: 'wa.td2', turns: [
      { by: 'a', say: "Are you mad at me or something?" },
      { by: 'b', say: "I'm not mad. I just think you were wrong, and I said so." },
      { by: 'a', say: "With {x} standing right there." },
      { by: 'b', say: "{x} being there doesn't change whether you were wrong." },
      { by: 'b', say: "It doesn't change anything." },
      { by: 'a', dr: "It changes everything, actually. It changes who {x} thinks {b} belongs to." },
    ] },
    { id: 'wa.td3', turns: [
      { by: 'a', say: "Just tell me if you're with {x} now." },
      { by: 'b', say: "I'm not with anybody. I disagreed with you once." },
      { by: 'a', say: "Once is all it takes in here." },
      { by: 'b', say: "Then I guess it took once." },
      { by: 'a', say: "Wow." },
      { by: 'b', dr: "If one honest sentence is enough to lose {a}, I didn't have {a} in the first place." },
    ] },
  ],
  'witness.after.out.sorry': [
    { id: 'wa.os1', turns: [
      { by: 'a', say: "{x} was going off at me, and you just stood there and said nothing." },
      { by: 'b', say: "I know. I panicked. I'm sorry.", v: { hard: "I know. I didn't want to get dragged into it." } },
      { by: 'a', say: "I'd have stood up for you." },
      { by: 'b', say: "I know you would. Next time I'll say something. I promise." },
      { by: 'a', dr: "'Next time.' There had better not be a next time." },
    ] },
    { id: 'wa.os2', turns: [
      { by: 'b', say: "I should have backed you up." },
      { by: 'a', say: "Yeah. You should have." },
      { by: 'b', say: "I didn't want to make it worse." },
      { by: 'a', say: "It couldn't really get worse." },
      { by: 'b', say: "...Fair. I'm sorry." },
      { by: 'b', dr: "I thought staying out of it was the safe move. Turns out there's no safe move. Somebody always notices." },
    ] },
    { id: 'wa.os3', turns: [
      { by: 'a', say: "Neutral." },
      { by: 'b', say: "Don't." },
      { by: 'a', say: "In a fight about me, you were neutral." },
      { by: 'b', say: "I know. It was a bad look. I'm sorry." },
      { by: 'a', say: "It was a terrible look." },
      { by: 'a', dr: "At least {b} knows it. That's something." },
    ] },
  ],
  'witness.after.out.stand': [
    { id: 'wa.od1', turns: [
      { by: 'a', say: "You didn't say a word." },
      { by: 'b', say: "It wasn't my fight." },
      { by: 'a', say: "I thought we were friends." },
      { by: 'b', say: "We are. That's exactly why I stayed out of it. I'm friends with {x} too." },
      { by: 'a', say: "That's not how this works, {b}." },
      { by: 'a', dr: "{b} wants to be friends with everybody. You can't be friends with everybody in this house. Not for long." },
    ] },
    { id: 'wa.od2', turns: [
      { by: 'a', say: "So you're just going to sit on the fence forever?" },
      { by: 'b', say: "If the fence keeps me in the house, yeah." },
      { by: 'a', say: "Wow." },
      { by: 'b', say: "It's not personal. It's Big Brother." },
      { by: 'a', say: "Don't 'it's Big Brother' me." },
      { by: 'b', dr: "Everybody wants you to pick a side until it's their name on the block. Then they love the fence." },
    ] },
    { id: 'wa.od3', turns: [
      { by: 'a', say: "Can I ask you something?" },
      { by: 'b', say: "Sure." },
      { by: 'a', say: "Why didn't you back me up?" },
      { by: 'b', say: "Because the second I do, {x} has a reason to come after me. I'm not giving anybody a reason." },
      { by: 'a', say: "So I'm on my own." },
      { by: 'b', say: "You're not on your own. I'll back you up. Just not in front of everybody." },
      { by: 'a', dr: "That is the most {b} sentence anybody has ever said." },
    ] },
  ],
};
