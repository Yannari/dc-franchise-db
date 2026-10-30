// ══════════════════════════════════════════════════════════════════════
// pm/talk/watching.js — {a} watches {c} go off with {d}, and {b} is beside them
// ══════════════════════════════════════════════════════════════════════
//
// A graft's second beat (pm/threads.js): {d} has pulled {c}, who is coupled
// with {a}. A pull is a walk across the villa in front of everyone, so the
// partner sees it (`of: 'sees'`), or a friend makes sure they know (`told`).
// What they can't see is what's said: nobody here knows how the chat went.
// `heat`: how the pull looked from across the garden (steamy reads as close).
//   spot    {a} clocks them going off together
//   talk    {b} and {a} on what it means
//   feel    {a} says how it really feels — the long turn
//   close   what {a} is going to do about it
import { build } from './build.js';

export const WATCHING = build('watching', {
  stages: [
    { stage: "{a} and {b} are on the daybeds, and both of them are looking the same way." },
    { stage: "{a} is in the kitchen with {b}, holding a drink {a} hasn't touched." },
  ],
  plans: {
    featured: ['spot', 'talk', 'feel', 'close'],
    short: ['spot', 'feel'],
  },
  moves: {
    spot: [
      { when: { of: 'sees', chaser: false }, stage: "{a} and {b} are on the daybeds when {d} walks over to {c} and says something. {c} gets up and follows {d} off down the garden.", turns: [
        ['a', "Did you see that?"],
        ['b', "See what?"],
        ['a', "Don't do that. You saw it. {d} just took {c} off for a chat."],
        ['b', "Okay, I saw it."],
      ] },
      { when: { of: 'sees' }, stage: "{a} is mid-sentence with {b}, then stops talking and stares at something over {b.posAdj} shoulder.", turns: [
        ['b', "What? What are you looking at?"],
        ['a', "{c}. With {d}. Over there. Look."],
        ['b', "They're just talking."],
        ['a', "They've been just talking for twenty minutes."],
      ] },
      { when: { of: 'sees', heat: 'steamy' }, stage: "From the kitchen, {a} and {b} have a clear view across the garden, where {c} and {d} are sitting very close together.", turns: [
        ['a', "Look at them."],
        ['b', "Don't look at them."],
        ['a', "How am I not supposed to look at them? {c}'s practically sitting on {d.posAdj} lap."],
        ['b', "That's not true. There's a gap."],
        ['a', "There's a gap you couldn't fit a piece of paper in."],
      ] },
      // {c} is {a}'s partner, and {c} went after {d} (threads.js: the chaser's partner).
      { when: { of: 'sees', chaser: true }, stage: "{a} and {b} are on the daybeds when {c} gets up, walks straight over to {d}, and takes {d.obj} off down the garden.", turns: [
        ['a', "Did you see that?"],
        ['b', "I saw it."],
        ['a', "{c} just went and got {d}. In front of me. In front of everyone."],
      ] },
      { when: { of: 'told', chaser: true }, stage: "{b} sits down next to {a} by the pool, and lowers {b.posAdj} voice.", turns: [
        ['b', "I don't know how to say this, so I'm just going to say it. {c} has pulled {d} for a chat. And everyone's talking about it."],
        ['a', "{c} pulled {d}? {c} did?"],
        ['b', "I'd want to know. If it was me, I'd want somebody to tell me."],
      ] },
      { when: { of: 'told', chaser: true }, stage: "{b} finds {a} in the dressing room, and shuts the door.", turns: [
        ['b', "Has anyone said anything to you? About {c}?"],
        ['a', "No. Why? What's that face?"],
        ['b', "{c} took {d} off for a chat earlier. It didn't look like a quick one, either. Everyone else in the villa saw it."],
        ['a', "Everyone else. And not me."],
      ] },
      { when: { of: 'told', chaser: false }, stage: "{b} sits down next to {a} by the pool, and lowers {b.posAdj} voice.", turns: [
        ['b', "I'm only telling you because I'd want to know. {d} has pulled {c}. They've gone off down the garden."],
        ['a', "Now?"],
        ['b', "Right now. They went off about ten minutes ago."],
        ['a', "And you're only telling me now?"],
        ['b', "I'm telling you now because I've only just seen it!"],
      ] },
      { when: { of: 'told', chaser: false }, stage: "{b} finds {a} in the dressing room.", turns: [
        ['b', "Have you seen where {c} is?"],
        ['a', "No. Why? What's that face?"],
        ['b', "{c}'s gone off with {d}. They've been gone a while."],
      ] },
    ],
    talk: [
      { when: { chaser: false }, turns: [
        ['b', "It's a chat. People have chats. You've had chats."],
        ['a', "Not with somebody who's been staring at my partner since the second they walked in."],
        ['b', "Okay, that's fair."],
        ['a', "I'm not being paranoid. Am I being paranoid?"],
        ['b', "A little bit paranoid. But not completely."],
      ] },
      { turns: [
        ['b', "Do you want me to go over there? I can go and get something from the fridge really slowly and listen."],
        ['a', "No. Don't. Then it looks like I care."],
        ['b', "You do care."],
        ['a', "Yeah, but they don't need to know that."],
      ] },
      { when: { chaser: true }, turns: [
        ['b', "Maybe it's nothing. Maybe {c} just wanted to get to know {d}."],
        ['a', "{c} doesn't need to get to know {d}. {c}'s got me. Or I thought {c} did."],
      ] },
      { when: { chaser: true }, turns: [
        ['b', "What are you going to say to {d}?"],
        ['a', "Nothing. This isn't on {d}. {d}'s not the one coupled up with me. That's on {c}."],
      ] },
      { when: { chaser: false }, turns: [
        ['b', "{c} wouldn't do anything. Not to you."],
        ['a', "I don't think {c} would do anything. I just don't trust {d}. {d} knew exactly how that would look, walking over there in front of everyone."],
        ['b', "That was a bit much, to be fair."],
        ['a', "A bit much? It was a statement."],
      ] },
      { when: { chaser: false }, turns: [
        ['b', "Just remember, {c} went because {d} asked. {c} didn't go looking for it."],
        ['a', "Nobody made {c} say yes, though."],
        ['b', "No. I suppose not."],
      ] },
    ],
    feel: [
      { turns: [
        ['a', "The thing is, I was just starting to feel really settled. Like, for the first time in here, I wasn't worrying about anyone else. And now I'm sitting here watching the garden like a security guard. I hate it. I hate that one chat can do this to me."],
        ['b', "It's because you like {c.obj}. If you didn't care, you wouldn't even have noticed them go."],
        ['a', "I'd have noticed. I notice everything in here. That's my problem."],
      ] },
      { when: { chaser: true }, turns: [
        ['a', "I'm not going to lie, my stomach has just dropped. If somebody had pulled {c}, fine, that happens. But {c} went looking. {c} got up and went looking, while I was sitting right here."],
        ['b', "I know. I'm sorry."],
      ] },
      { when: { chaser: false }, turns: [
        ['a', "I'm not going to lie, my stomach has just dropped. I know it's only a chat, I know that. But it's the way {c} got up straight away. No looking back at me, nothing. Just up and gone."],
        ['b', "Maybe {c} didn't want to make it awkward."],
        ['a', "It's already awkward. I'm sitting here talking about it."],
      ] },
      { turns: [
        ['a', "Honestly, I'm fine. I'm absolutely fine. I'm a very secure person."],
        ['b', "You've ripped that cushion."],
        ['a', "The cushion was already like that."],
        ['b', "It wasn't."],
        ['a', "Okay, I'm not fine. I'm not fine at all."],
      ] },
      { turns: [
        ['a', "Part of me wants to walk over there and ask what's going on. And part of me wants to act like I haven't even noticed, so {c} has to come and find me."],
        ['b', "Which part's winning?"],
        ['a', "The second one. For now. Ask me again in five minutes."],
      ] },
      { when: { myRung: ['closed-off', 'exclusive', 'official'], chaser: false }, turns: [
        ['a', "We're exclusive. We had that whole conversation. And {c} is over there right now, letting {d} have a chat like it's nothing. What was the point of saying it, if it doesn't mean anything?"],
        ['b', "It does mean something. Wait and hear what {c} says before you decide it doesn't."],
      ] },
    ],
    close: [
      { turns: [
        ['a', "I'm going to wait. And when {c} comes back, I'm going to ask, calmly, what that was about."],
        ['b', "Calmly."],
        ['a', "Calm-ish."],
      ] },
      { turns: [
        ['a', "I'm not saying anything tonight. If {c} wants me to know, I'm not hard to find."],
        ['b', "And if {c} doesn't?"],
        ['a', "Then that tells me something as well, doesn't it?"],
      ] },
      { turns: [], beat: "{a} lies back on the daybed and stares at the sky, and doesn't say another word until {c} comes back." },
      { turns: [['b', "Come on. Come and help me with dinner and take your mind off it."], ['a', "If I chop anything, I'm imagining it's {d}."], ['b', "That's fine. As long as you chop it."]] },
    ],
  },
  notes: [
    { stage: "{a} watches {c} go off with {d}, and {b} watches {a}." },
  ],
});
