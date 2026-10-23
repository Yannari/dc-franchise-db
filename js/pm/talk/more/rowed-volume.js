// pm/talk/more/rowed-volume.js — the making-up scenes (the user, 2026-10-22:
// "address the repeats by increasing the volume of the dialogue ALOT").
// `rowedToday` LEADS in the chat, the kiss, the deep chat and the challenge
// win: on a day a couple argued, only a movement written for it plays. Each
// held ONE entry per movement and one note, so every making-up afternoon of a
// season opened with the same words (the kiss's note: eleven times). What the
// row was about is not known here: never name it, never say when beyond
// "earlier".
const RT = { rowedToday: true };
const S = (stage, ...turns) => ({ when: RT, stage, turns });
const R = (...turns) => ({ when: RT, turns });
const N = (...stages) => stages.map(stage => ({ when: RT, stage }));

export const ROWED_VOLUME = {
  chat: {
    moves: {
      open: [
        S("{a} hovers by the sunbed until {b} looks up.", ['a', "Can I sit?"], ['b', "It's a free sunbed."], ['a', "That's not a yes."], ['b', "Sit down."]),
        S("{a} brings {b} a drink, and holds it out like a white flag.", ['b', "What's this?"], ['a', "An apology. It's got ice in it."]),
        S("{b} is lying by the pool. {a} lies down on the next sunbed and says nothing for a minute.", ['b', "Are you going to say something?"], ['a', "I'm working up to it."]),
        S("{a} finds {b} on the swing seat, and sits on the very end of it.", ['a', "Are we still not talking?"], ['b', "We're talking now."]),
        S("{a} catches {b}'s eye across the kitchen and nods at the garden.", ['b', "Is that a chat nod?"], ['a', "That's a chat nod."]),
        S("{a} sits down next to {b}, closer than {a} has all day.", ['a', "This is me being the bigger person."], ['b', "You're sitting on my towel."]),
        S("{b} finds {a} on the stairs, and sits one step below.", ['b', "I didn't like earlier."], ['a', "Neither did I."]),
        S("{a} and {b} end up at the fridge at the same time.", ['a', "After you."], ['b', "No, after you."], ['a', "Can we stop being polite and just talk?"]),
      ],
      catch: [
        R(['a', "I said some things earlier I didn't mean."], ['b', "You meant some of them."], ['a', "Fine. I meant some of them. I didn't mean them like that."]),
        R(['b', "I'm sorry I walked off."], ['a', "I'm sorry I made you want to."], ['b', "Can we start again?"], ['a', "From where?"], ['b', "From hello."]),
        R(['a', "I hate it when we're not talking. The whole day feels wrong."], ['b', "I know. I kept looking over at you."], ['a', "I saw."]),
        R(['b', "Who's going first?"], ['a', "Me. I'm sorry. I was being an idiot."], ['b', "You were. So was I."]),
        R(['a', "I don't want to go to bed on a row."], ['b', "Then let's not."]),
        R(['b', "I've been thinking about it all afternoon. I overreacted."], ['a', "We both did. I'm sorry too."]),
        R(['a', "Truce?"], ['b', "Truce. But you're making the teas for a week."], ['a', "Deal."]),
        R(['b', "I didn't like who I was earlier."], ['a', "I didn't like who I was either. Shall we both stop being them?"]),
      ],
    },
    notes: N(
      "{a} and {b} make up on the swing seat, slowly, and then all at once.",
      "{a} says sorry first. {b} says it straight back.",
      "{a} and {b} sit down after their row and talk until it doesn't matter any more.",
      "{a} brings {b} a drink as a peace offering, and it works.",
      "{a} and {b} sort out their row by the pool, and come back holding hands.",
      "{a} and {b} have an awkward half hour, and then a much better one.",
      "{a} and {b} make up over a cup of tea, and agree it was about nothing.",
      "{a} and {b} talk it through, and end up laughing about how silly it got."),
  },
  kiss: {
    moves: {
      open: [
        S("{a} finds {b} in the dressing room, on {b.posAdj} own.", ['a', "Can I come in?"], ['b', "You're already in."], ['a', "Can I stay in?"]),
        S("{b} is on the daybed, pretending to sleep. {a} sits down next to {b.obj}.", ['a', "I know you're awake."], ['b', "I'm not."], ['a', "Then I'll say sorry to you while you're asleep."]),
        S("{a} walks over to {b} by the pool and holds out a hand.", ['a', "Come with me."], ['b', "Where?"], ['a', "Somewhere we can make up properly."]),
        S("{a} and {b} meet at the top of the stairs, both on their way to find the other.", ['b', "I was coming to find you."], ['a', "I was coming to find you."]),
        S("{a} sits next to {b} on the swing seat and bumps {b.posAdj} shoulder.", ['b', "What?"], ['a', "I miss you. You've been ten feet away all day, and I miss you."]),
        S("{b} catches {a} coming out of the shower.", ['b', "Have you got a minute?"], ['a', "For you? I've got the rest of the day."]),
      ],
      lead: [
        R(['a', "I'm sorry. I'm really sorry."], ['b', "I'm sorry too. Come here."]),
        R(['b', "Are we okay?"], ['a', "We're okay. We're more than okay. I was just being stubborn."]),
        R(['a', "I hate being cross with you. It doesn't suit me."], ['b', "It doesn't. Your face goes all funny."]),
        R(['b', "Let's never do that again."], ['a', "We'll definitely do that again."], ['b', "Let's not do it again this week, then."]),
        R(['a', "I've been wanting to do this since about five minutes after we started arguing."], ['b', "Do what?"]),
        R(['b', "Say it, then."], ['a', "Say what?"], ['b', "That you missed me."], ['a', "I missed you. Every minute."]),
      ],
    },
    notes: N(
      "{a} and {b} make up with a long kiss on the swing seat.",
      "After their row, {a} finds {b}, and they kiss like they mean it.",
      "{a} and {b} kiss and make up in the dressing room, and come out smiling.",
      "{a} says sorry, {b} says sorry, and the rest is a kiss.",
      "{a} and {b} kiss by the pool, the row already forgotten.",
      "{a} and {b} make up, and the villa breathes a sigh of relief."),
  },
  'deep-chat': {
    moves: {
      open: [
        S("{a} and {b} sit on the roof terrace, a little apart, after their row.", ['a', "Can we talk about it properly? Not just say sorry and move on?"], ['b', "I'd like that."]),
        S("{a} sits down opposite {b} on the daybeds, knees up.", ['a', "I don't want to just make up. I want to understand."], ['b', "Understand what?"], ['a', "Why it keeps happening."]),
        S("{b} asks {a} to walk round the garden with {b.obj}.", ['b', "I've been thinking about earlier. Not what we said. Why we said it."]),
        S("{a} and {b} sit on the stairs, both still a bit raw.", ['a', "Can I be honest with you?"], ['b', "That's what got us into this."], ['a', "That's what'll get us out of it."]),
        S("{a} and {b} lie on the lawn, looking up, not quite touching.", ['b', "I don't want this to be a thing we do."], ['a', "Then let's work out why we do it."]),
      ],
      question: [
        R(['a', "What was it really about? Not the thing we argued about. The real thing."], ['b', "I think I'm scared of how much I like you."], ['a', "That's a strange thing to shout about."]),
        R(['b', "Why did that get to you so much?"], ['a', "Because it's happened before. Not with you. And I promised myself it wouldn't again."]),
        R(['a', "Do you think we're too alike?"], ['b', "I think we're both stubborn. And we both hate being wrong."], ['a', "That's just being alike."]),
        R(['b', "What do you need from me, when you're upset?"], ['a', "I don't know. Nobody's ever asked me that."], ['b', "I'm asking."]),
        R(['a', "Can I ask you something? When you went quiet earlier, what were you thinking?"], ['b', "That I didn't want to lose this. And I didn't know how to say it."]),
      ],
    },
    notes: N(
      "{a} and {b} talk about why they fought, and find the real reason underneath.",
      "{a} and {b} sit up on the terrace after their row, and talk honestly for the first time in days.",
      "After their row, {a} tells {b} what was really bothering {a.obj}.",
      "{a} and {b} talk it through, and come away knowing each other better.",
      "{a} and {b} have a long, careful talk about how they argue, and agree to do it differently."),
  },
  'challenge-win': {
    moves: {
      win: [
        S("{a} and {b} win, and the row from earlier is suddenly hard to remember.", ['b', "Well, that's awkward. We're good at this."], ['a', "We're good at a lot of things. When we're talking."]),
        S("{a} and {b} come out on top, and {a} grabs {b} without thinking.", ['a', "Sorry. Habit."], ['b', "Don't be sorry. Do it again."]),
        S("{a} and {b} win the challenge, and stand there grinning, not sure if they're allowed to.", ['a', "Are we still annoyed with each other?"], ['b', "I can't remember. I'm too happy."]),
        S("The win goes to {a} and {b}, and the others groan.", ['b', "Imagine how good we'd be if we were talking."], ['a', "We're talking now."]),
      ],
    },
    notes: N(
      "{a} and {b} win the challenge, and the row is forgotten on the way back.",
      "{a} and {b} take the win, and a hug, and call it quits on earlier."),
  },
};
