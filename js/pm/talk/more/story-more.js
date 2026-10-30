// pm/talk/more/story-more.js — more of the storylines' conversations.
// Each movement here is a whole exchange that opens and closes its own subject.
//   watching.advice   {b}'s own take: what {a} should actually do
//   feels-off.worry   {a} lays out what {a} has noticed, one thing at a time
//   bed-chat.moment   the best (or worst) moment of the day, in the dark
export const WATCHING_PLANS = {
  featured: ['spot', 'talk', 'feel', 'advice', 'close'],
  short: ['spot', 'feel'],
};
export const FEELS_OFF_PLANS = {
  featured: ['open', 'ask', 'worry', 'answer', 'close'],
  short: ['ask', 'answer'],
};
export const BED_CHAT_PLANS = {
  featured: ['open', 'talk', 'moment?', 'close'],
  short: ['talk', 'close'],
};

export const STORY_MORE = {
  watching: { moves: { advice: [
    { turns: [
      ['b', "Can I tell you what I'd do? Don't go over there. Don't storm in. Wait for {c} to come back, and see who comes to who first. That tells you everything you need to know."],
      ['a', "And if {c} doesn't?"],
      ['b', "Then you know. And you can be angry then. Not before."],
    ] },
    { turns: [
      ['b', "Honestly? I think you need to say something tonight. Not a fight. Just, look, I saw it, and I didn't like it. If you sit on it, it'll turn into something much bigger in your head."],
      ['a', "It's already pretty big in my head."],
      ['b', "Exactly. So get it out of there."],
    ] },
    { when: { chaser: false }, turns: [
      ['b', "Look at it this way. If {c} wanted {d}, there have been a hundred chances by now. {c} keeps coming back to you. That has to count for something."],
      ['a', "It does. I know it does."],
      ['b', "So hold on to that, not to whatever's happening over there."],
    ] },
    { when: { chaser: false }, turns: [
      ['b', "Whatever you do, don't let {d} see that it's got to you. That's exactly what {d} wants."],
      ['a', "You think {d} is doing it on purpose?"],
      ['b', "I think {d} knows exactly where you're sitting."],
    ] },
  ] } },
  'feels-off': { moves: { worry: [
    { turns: [
      ['a', "It's little things. {c} used to come and find me in the morning. Now I wake up and {c}'s already up and gone. {c} used to sit next to me at dinner. Last night {c} sat at the other end. And when I went in for a kiss in bed, I got a cheek. Not a kiss. A cheek."],
      ['b', "A cheek."],
      ['a', "Like I'm someone {c} shares a kitchen with."],
    ] },
    { turns: [
      ['a', "I'm not imagining it. I know when someone's pulling away. I've had it happen before, and it feels exactly like this. Everything's polite. Everything's fine. And none of it is."],
      ['b', "That's horrible."],
      ['a', "It's worse than a fight. At least with a fight you know where you are."],
    ] },
    { turns: [
      ['a', "I made a joke earlier, a stupid one, and before, {c} would have laughed just because it was me. Today {c} didn't even look up. And I know that's tiny. I know it is. But tiny things are all you've got in here."],
      ['b', "It's not tiny if it's keeping you up at night."],
    ] },
  ] } },
  'bed-chat': { moves: { moment: [
    { when: { of: 'warm' }, turns: [
      ['a', "Do you know what my favourite bit of today was?"],
      ['b', "Go on."],
      ['a', "When everyone was arguing about the washing-up, and you caught my eye across the kitchen and pulled a face. Nobody else saw it. It was just ours."],
      ['b', "I didn't think you saw that."],
      ['a', "I see everything you do. That's my problem."],
    ] },
    { when: { of: 'warm' }, turns: [
      ['b', "Can I say something soppy?"],
      ['a', "You're going to anyway."],
      ['b', "I'm really glad it's you I'm lying next to. Out of everyone. I know it's early. I don't care."],
      ['a', "That's not soppy. That's just nice."],
    ] },
    { when: { of: ['after-row', 'distant'] }, turns: [
      ['a', "I keep replaying it. Everything we said. I'd say it all differently if I could."],
      ['b', "Which bits?"],
      ['a', "Most of it. Not the asking. I'd still ask. Just not like that."],
      ['b', "I'd answer differently too, probably."],
    ] },
  ] } },
};
