// Small talk between teams, gloating, planning the leg and reading a tip. small-talk (a and b, c and d): `click` (they
// like each other), `awkward` (it dies), `overshare` (c tells far too much). gloat (a and b at c and d): `rubbed-in`,
// `backfires` (they lingered to gloat and lost time). plan-the-leg (a leads): `strategy`, `drift` (it turns into
// something else, and that's nice), `ignored` (the plan goes nowhere). tip-read (a reads): `clear`, `puzzled`,
// `misread` (a quick hit, 3 to 5 lines). Written again 2026-11-03 (the user read "I wore a giant foam hot dog outside a
// car wash" / "Nobody ever found out. Not even the hot dog." and said they talk like a bad translation): what two tired
// teams actually say to each other, about the day, home, each other, with nothing built to end on a joke.
const CK = 'small-talk.click', AW = 'small-talk.awkward', OS = 'small-talk.overshare';
const RB = 'gloat.rubbed-in', GB = 'gloat.backfires';
const ST = 'plan-the-leg.strategy', DR = 'plan-the-leg.drift', IG = 'plan-the-leg.ignored';
const CL = 'tip-read.clear', PZ = 'tip-read.puzzled', MR = 'tip-read.misread';

export default {
  retire: [CK, AW, OS, 'small-talk.any', RB, GB, 'gloat.any', ST, DR, IG, 'plan-the-leg.any', CL, PZ, MR, 'tip-read.any'],
  pools: {
    [CK]: [
      { id: 'tk.c-air1', when: { at: 'airport' }, turns: [
        { beat: 'Four people, one bench, and a long wait at the gate.' },
        { by: 'c', say: "You sit. You look like you're about to fall over." },
        { by: 'a', say: "Are you sure? Thank you. That's really nice." },
        { by: 'b', say: "Honestly, nobody's been that nice to us all day." },
        { by: 'd', say: "It's been a long day for everybody." },
        { by: 'a', say: "It really has. How are you guys holding up?" },
        { by: 'c', say: "Tired. So tired. But we're still here." },
      ] },
      { id: 'tk.c-air2', when: { at: 'airport' }, turns: [
        { by: 'd', say: "What's the first thing you're going to do when this is all over?" },
        { by: 'a', say: "Sleep. In my own bed. For about two days." },
        { by: 'c', say: "I'm going to eat a whole pizza by myself." },
        { by: 'b', say: "That sounds amazing right now." },
        { by: 'd', say: "I just want a shower that lasts more than three minutes." },
        { by: 'a', say: "Oh my God, yes. A real shower." },
      ] },
      { id: 'tk.c-task1', when: { at: 'task' }, turns: [
        { beat: 'Both teams are waiting for their turn, side by side.' },
        { by: 'c', say: "Can I tell you something? We have no idea what we're doing." },
        { by: 'a', say: "Oh, thank God. Neither do we. I thought it was just us." },
        { by: 'd', say: "Everybody looks like they know what they're doing, though." },
        { by: 'b', say: "I bet everybody's thinking the same thing about us." },
        { by: 'c', say: "Okay. That actually makes me feel a lot better." },
      ] },
      { id: 'tk.c-any1', turns: [
        { by: 'a', say: "So what do you guys do back home?" },
        { by: 'c', say: "I work in an office. It's really boring. That's why I'm here." },
        { by: 'b', say: "Same. I needed something to happen in my life." },
        { by: 'd', say: "Well, something's definitely happening now." },
        { by: 'a', say: "Is it what you thought it would be?" },
        { by: 'c', say: "It's so much harder. But I'm really glad I came." },
      ] },
      // (the ones asked grew up together: "since we were six" from two sorority sisters, read 2026-11-03)
      { id: 'tk.c-any2', when: { relFamB: 'family' }, turns: [
        { by: 'b', say: "How do you two get along so well? Don't you ever fight?" },
        { by: 'c', say: "Oh, we fight all the time." },
        { by: 'd', say: "All the time. We've been fighting for years." },
        { by: 'c', say: "But at the end of the day, we've always got each other's backs." },
        { by: 'a', say: "That's really nice." },
        { by: 'd', say: "Don't tell {c.obj} I said this, but I couldn't do this with anybody else." },
      ] },
      { id: 'tk.c-any3', when: { relFamB: 'family' }, turns: [
        { by: 'a', say: "Is it hard, racing with family?" },
        { by: 'c', say: "It's the best and the worst. Mostly at the same time." },
        { by: 'd', say: "Earlier we didn't talk for an hour, and then we were fine again." },
        { by: 'c', say: "That's just how it is with us. We get over it." },
        { by: 'b', say: "That's so family." },
        { by: 'a', say: "I'd last about a day with my brother." },
      ] },
      { id: 'tk.c-road1', when: { at: 'road' }, turns: [
        { beat: 'Two teams end up going the same way, at the same pace, for a long time.' },
        { by: 'd', say: "So. Should we talk, or just walk?" },
        { by: 'a', say: "Talk. Please. I need something to take my mind off my feet." },
        { by: 'c', say: "Where are you guys from?" },
        { by: 'b', say: "A small town. You've never heard of it. You?" },
        { by: 'c', say: "Same. Small town. Nothing ever happens there." },
        { by: 'a', say: "Well, look at us now." },
      ] },
      { id: 'tk.c-any4', turns: [
        { by: 'c', say: "Hey, you guys did really well back there." },
        { by: 'a', say: "Thanks! So did you. That part was so hard." },
        { by: 'd', say: "I thought I was going to cry." },
        { by: 'b', say: "I did cry. A little bit." },
        { by: 'c', say: "Honestly, same." },
        { by: 'a', say: "Okay, good luck out there. Seriously." },
      ] },
      { id: 'tk.c-any5', when: { relB: ['siblings', 'cousins', 'bffs'] }, turns: [
        { by: 'a', say: "How long have you two known each other?" },
        { by: 'c', say: "Forever. Since we were really little." },
        { by: 'd', say: "Too long, honestly." },
        { by: 'c', say: "Hey!" },
        { by: 'd', say: "I'm kidding. I'm kidding." },
        { by: 'b', say: "You can tell. You two are like an old married couple." },
      ] },
    ],
    [AW]: [
      { id: 'tk.a-any1', turns: [
        { by: 'a', say: "So, um. Hot today, isn't it?" },
        { by: 'c', say: "Yeah." },
        { by: 'a', say: "Yeah." },
        { beat: 'Nobody says anything for a long moment.' },
        { by: 'b', say: "Okay, we're going to go and stand over there." },
        { by: 'd', say: "Yeah. Okay. Good luck." },
      ] },
      { id: 'tk.a-any2', turns: [
        { by: 'a', say: "I like your shirt. Is that a band?" },
        { by: 'c', say: "It's my dad's company. He sells pipes." },
        { by: 'a', say: "Oh. Cool. Pipes. That's cool." },
        { by: 'b', say: "You don't care about pipes." },
        { by: 'a', say: "I'm being polite!" },
        { beat: 'Nobody says anything else for the rest of the wait.' },
      ] },
      { id: 'tk.a-air1', when: { at: 'airport' }, turns: [
        { beat: 'Two teams end up sitting face to face at the gate, much too close.' },
        { by: 'c', say: "So. Where are you two from?" },
        { by: 'b', say: "Oh, just a small town. Nowhere you'd know." },
        { by: 'c', say: "Try me." },
        { by: 'b', say: "Honestly, it's tiny. It doesn't even have a stoplight." },
        { beat: 'They nod at each other, and then both get very interested in their shoes.' },
      ] },
      { id: 'tk.a-any3', turns: [
        { by: 'c', say: "Good job back there." },
        { by: 'a', say: "Oh. Thanks. You too." },
        { by: 'c', say: "Thanks." },
        { beat: 'They stand there.' },
        { by: 'd', say: "Okay. Well. See you around." },
        { by: 'b', say: "Yeah. See you." },
      ] },
    ],
    [OS]: [
      { id: 'tk.o-any1', turns: [
        { by: 'a', say: "So what made you two sign up for this?" },
        { by: 'c', say: "Honestly? I just got divorced, and I needed to get out of the house." },
        { by: 'd', say: "We said we weren't going to tell people that." },
        { by: 'c', say: "They asked! And it's true!" },
        { by: 'b', say: "Oh. I'm so sorry." },
        { by: 'c', say: "Don't be. This is the most fun I've had in years." },
      ] },
      { id: 'tk.o-any2', turns: [
        { by: 'b', say: "Are you okay? You look a bit stressed." },
        { by: 'c', say: "I haven't slept properly in days. I cried in a bathroom this morning. And I really miss my mom." },
        { by: 'a', say: "Oh. Okay. That's... a lot." },
        { by: 'd', say: "Sorry. {c.Sub} does this when {c.sub}'s tired." },
        { by: 'c', say: "You asked!" },
        { by: 'b', say: "We did. We did ask. I hope you get some sleep." },
      ] },
      { id: 'tk.o-any3', when: { relB: 'siblings' }, turns: [
        { by: 'a', say: "You two seem really close. Have you always been close?" },
        { by: 'c', say: "Oh, no. We didn't talk for four years. Not one word." },
        { by: 'd', say: "This race is kind of us trying again." },
        { by: 'c', say: "Our mom made us sign up together. She said it was this or therapy." },
        { by: 'b', say: "Wow. Okay. That's... really brave of you." },
        { by: 'd', say: "So far it's working. Mostly." },
      ] },
    ],

    [RB]: [
      { id: 'gl.r-mat1', when: { at: 'mat' }, turns: [
        { beat: 'From the Chill Zone, {a} and {b} watch {c} and {d} finally come in.' },
        { by: 'a', say: "Oh, there you are! We were starting to wonder." },
        { by: 'c', say: "Have you been sitting there long?" },
        { by: 'b', say: "Long enough to have a snack. And a nap." },
        { beat: '{d} sits down very heavily and doesn\'t say anything.' },
        { by: 'a', say: "Do you want a snack? We have extra." },
        { by: 'c', say: "No. We want you to stop talking." },
      ] },
      { id: 'gl.r-any1', turns: [
        { by: 'a', say: "Oh no, are you still on this part? We finished this ages ago." },
        { by: 'd', say: "Wow. Thanks. Really helpful." },
        { by: 'b', say: "We're not trying to be mean." },
        { by: 'a', say: "Good luck, guys! See you at the mat!" },
        { beat: '{a} and {b} jog off, waving.' },
        { by: 'c', say: "I can't stand them. I really can't stand them." },
      ] },
      { id: 'gl.r-any2', turns: [
        { by: 'a', say: "Hey, how's it going? Because it's going great for us." },
        { by: 'c', say: "Fine. It's going fine." },
        { by: 'b', say: "Oh, fine is good. Good for you." },
        { by: 'd', say: "What's that supposed to mean?" },
        { by: 'a', say: "Nothing! Bye!" },
        { by: 'c', say: "Just ignore them. Keep going." },
      ] },
      { id: 'gl.r-any3', turns: [
        { by: 'a', say: "See you at the mat, guys! Well, see you later, anyway." },
        { by: 'c', say: "Was that supposed to be funny?" },
        { by: 'b', say: "Come on, don't. Let's just go." },
        { by: 'a', say: "I'm just having fun!" },
        { by: 'd', say: "Have fun somewhere else." },
        { beat: '{a} and {b} run off. {c} and {d} watch them go.' },
      ] },
    ],
    [GB]: [
      { id: 'gl.b-any1', turns: [
        { by: 'a', say: "Wait. Let's just watch them struggle for a second." },
        { by: 'b', say: "We're standing still. We're in a race, and we're standing still." },
        { by: 'a', say: "One more second." },
        { beat: 'One more second turns into five minutes. {c} and {d} finish, and jog past them.' },
        { by: 'c', say: "Thanks for waiting!" },
        { by: 'b', say: "Five minutes. We stood there for five minutes." },
      ] },
      { id: 'gl.b-any2', turns: [
        { by: 'a', say: "Need some help? Oh wait, you're not allowed any. Shame." },
        { by: 'd', say: "Don't you have somewhere to be?" },
        { by: 'b', say: "We do. We really do. Come on." },
        { by: 'a', say: "In a minute. I'm enjoying this." },
        { beat: 'While {a} is enjoying it, a team they\'d been ahead of runs straight past them both.' },
        { by: 'b', say: "And that's the team we were beating. Great. Really great." },
      ] },
    ],

    [ST]: [
      { id: 'pl.s-air1', when: { at: 'airport' }, turns: [
        { beat: '{a} has a napkin out on the tray table and is writing on it.' },
        { by: 'a', say: "Okay. When we land, we run straight to the taxis. We don't wait for anybody." },
        { by: 'b', say: "What if there's a line?" },
        { by: 'a', say: "Then we ask somebody where the next taxis are." },
        { by: 'b', say: "Okay. And if the tip says something else?" },
        { by: 'a', say: "Then we read it on the way. But we run first." },
      ] },
      { id: 'pl.s-any1', turns: [
        { by: 'a', say: "New rule. Whoever reads the tip reads the whole thing before we move." },
        { by: 'b', say: "Is this about earlier?" },
        { by: 'a', say: "It's about earlier." },
        { by: 'b', say: "I said I was sorry." },
        { by: 'a', say: "I know. I just don't want it to happen again." },
        { by: 'b', say: "Fine. The whole thing. Every time." },
      ] },
      { id: 'pl.s-any2', turns: [
        { by: 'a', say: "If we have to split it up, I'll do anything high up, and you do anything with food." },
        { by: 'b', say: "What if it's both?" },
        { by: 'a', say: "Then we figure it out when we get there." },
        { by: 'b', say: "That's not much of a plan." },
        { by: 'a', say: "It's better than no plan." },
        { by: 'b', say: "Okay. Heights are yours. Food is mine." },
      ] },
      { id: 'pl.s-any3', turns: [
        { by: 'b', say: "Okay, we need to be smarter about the money." },
        { by: 'a', say: "What do you mean?" },
        { by: 'b', say: "We keep paying for cabs when we could walk. We're going to run out." },
        { by: 'a', say: "Okay. If it's close, we walk. If it's far, we take a cab." },
        { by: 'b', say: "And we ask how far before we get in." },
        { by: 'a', say: "Deal." },
      ] },
    ],
    [DR]: [
      { id: 'pl.d-air1', when: { at: 'airport' }, turns: [
        { by: 'a', say: "Okay. Next leg. What do we think it's going to be?" },
        { by: 'b', say: "I don't know. I just hope it's somewhere warm." },
        { by: 'a', say: "That's not a strategy." },
        { by: 'b', say: "It's a hope. I'm allowed to hope." },
        { by: 'a', say: "Okay. I hope it's warm too." },
        { beat: 'They spend the rest of the wait talking about where they\'d go on holiday instead.' },
      ] },
      { id: 'pl.d-any1', turns: [
        { by: 'a', say: "We need a plan for the next part." },
        { by: 'b', say: "Do you remember the last time we made a plan? That road trip?" },
        { by: 'a', say: "Oh my God. We ended up sitting in a parking lot for six hours." },
        { by: 'b', say: "Eating crisps and laughing the whole time." },
        { by: 'a', say: "That was such a good day." },
        { beat: 'They don\'t make a plan, but they both feel a lot better.' },
      ] },
      { id: 'pl.d-any2', turns: [
        { by: 'a', say: "Okay. Honestly. What's our biggest weakness?" },
        { by: 'b', say: "Honestly? Your sense of direction." },
        { by: 'a', say: "And yours is that you eat all the snacks in the first hour." },
        { by: 'b', say: "That's fair. That's very fair." },
        { beat: 'The planning turns into an argument about snacks, and both of them are laughing by the end.' },
        { by: 'a', say: "We still don't have a plan." },
      ] },
    ],
    [IG]: [
      { id: 'pl.i-any1', turns: [
        { by: 'a', say: "Okay, so here's the plan. First, we read the tip properly. Then..." },
        { beat: '{b} has fallen asleep sitting up.' },
        { by: 'a', say: "Are you even listening?" },
        { by: 'b', say: "Mm. Yeah. Good plan." },
        { by: 'a', say: "I haven't told you the plan yet." },
        { by: 'b', say: "...Tell me when we get there." },
      ] },
      { id: 'pl.i-any2', turns: [
        { by: 'a', say: "Listen. When we get there, we split up. We'll find it twice as fast." },
        { by: 'b', say: "We're not allowed to split up." },
        { by: 'a', say: "Says who?" },
        { by: 'b', say: "Says every single tip we've had. It's right there at the top." },
        { by: 'a', say: "Okay. Then we stay together and just go really fast." },
        { by: 'b', say: "That's what we always do." },
      ] },
    ],

    // reading a tip: a quick hit
    [CL]: [
      { id: 'tr.c-any1', turns: [
        { by: 'a', say: "Got it. I know exactly where we're going. Come on." },
        { by: 'b', say: "Wait, you didn't read the bottom bit." },
        { by: 'a', say: "Fine. Okay. Read it while we walk." },
      ] },
      { id: 'tr.c-any2', turns: [
        { beat: '{a} reads the tip out loud.' },
        { by: 'b', say: "Okay. That's clear. That's actually really clear." },
        { by: 'a', say: "Good. Then let's go." },
      ] },
    ],
    [PZ]: [
      { id: 'tr.p-any1', turns: [
        { by: 'a', say: "Okay. Okay, okay. I think I get it." },
        { by: 'b', say: "You think, or you know?" },
        { by: 'a', say: "I think. Read it again with me." },
        { beat: '{b} takes the tip and reads it twice.' },
      ] },
      { id: 'tr.p-any2', turns: [
        { by: 'b', say: "What does that even mean? Read it again, slower." },
        { by: 'a', say: "I've read it three times. It's not getting any clearer." },
        { by: 'b', say: "Okay. Let's just ask somebody." },
      ] },
    ],
    [MR]: [
      { id: 'tr.m-any1', turns: [
        { by: 'a', say: "It says straight on and then right. Come on, hurry!" },
        { by: 'b', say: "Right at the end, or the first right?" },
        { by: 'a', say: "The first right. I think." },
        { beat: 'Twenty minutes later, it turns out it was the end.' },
      ] },
      { id: 'tr.m-any2', turns: [
        { by: 'a', say: "It says go north." },
        { by: 'b', say: "Which way is north?" },
        { by: 'a', say: "That way. I'm pretty sure." },
        { beat: 'It isn\'t north. It takes them ten minutes to work that out.' },
      ] },
    ],
  },
};
