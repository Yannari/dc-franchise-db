// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/together.js — a showmance that is already a couple, being one
// ══════════════════════════════════════════════════════════════════════
//
// Read 2026-10-15: Chase and Ripper had the "what are we?" talk twice. A couple just being a couple (breakfast
// together, asleep on a shoulder: kind life.couple) was filed as a declare step, and with no pool of its own it
// fell back to declare.any, which is the talk about becoming one. The couple pools in more-couple.js are for a
// pair who walked in together and are hiding it. These are for a showmance the viewer has watched happen: they
// already said what they are, and the house knows.
export default {
  'story.showmance.together.any': [
    { id: 'smt.1', room: 'kitchen', turns: [
      { beat: 'Kitchen, morning. {a} has made {b} breakfast without being asked.' },
      { by: 'b', say: "You didn't have to do this." },
      { by: 'a', say: "I know. I wanted to.", v: { hard: "I was making mine anyway. Don't make it a thing." } },
      { by: 'b', say: "Did you put hot sauce on the eggs?" },
      { by: 'a', say: "Of course I did. I know how you eat them." },
      { by: 'b', dr: "Everybody in here thinks a showmance is a weakness. Then {a} remembers how I like my eggs, and I don't care what anybody thinks.",
        v: { anxious: "I keep waiting for this to go wrong. Then {a} makes me breakfast, and I forget to worry for a minute." } },
    ] },
    { id: 'smt.2', room: 'living-room', turns: [
      { beat: "Living room. {b} has fallen asleep with {b.posAdj} head on {a}'s shoulder." },
      { by: 'a', dr: "I've been sitting like this for forty minutes. My arm is completely dead. I'm not moving." },
      { beat: '{b} wakes up slowly.' },
      { by: 'b', say: "How long was I asleep?" },
      { by: 'a', say: "Not long." },
      { by: 'b', say: "Your arm's gone numb, hasn't it?" },
      { by: 'a', say: "Completely. It's fine. I'll get a new one." },
    ] },
    { id: 'smt.3', presumes: ['hoh'], turns: [
      { by: 'a', say: "If one of us goes up this week, we need a plan for it." },
      { by: 'b', say: "I don't want to talk about that." },
      { by: 'a', say: "I know. I'm serious, though.", v: { anxious: "I know. I can't stop thinking about it, though." } },
      { by: 'b', say: "Okay. If it's me, you don't fight for me so hard that you go up next." },
      { by: 'a', say: "That's a terrible plan." },
      { by: 'b', say: "It's the only one where one of us is still here." },
      { by: 'a', dr: "We keep saying the game comes first. Neither of us believes it." },
    ] },
    { id: 'smt.4', room: 'backyard', turns: [
      { beat: 'Backyard, after dark. {a} has pushed two loungers together and taken a blanket from the bedroom.' },
      { by: 'b', say: "Is this a date?" },
      { by: 'a', say: "It's the best date this house can do.", v: { hard: "Don't call it that. Just sit down." } },
      { by: 'b', say: "There are cameras in the bushes." },
      { by: 'a', say: "Then they can watch a date." },
      { by: 'b', dr: "We haven't known each other long, and I already can't picture this house without {a} in it." },
    ] },
    { id: 'smt.5', turns: [
      { by: 'a', say: "People are calling us a power couple." },
      { by: 'b', say: "Is that good or bad?" },
      { by: 'a', say: "In here? Bad. It means we're a target." },
      { by: 'b', say: "Then maybe we stop sitting together at dinner." },
      { by: 'a', say: "I'm not doing that.", v: { hard: "Fine. For one week. Then I'm sitting next to you again." } },
      { by: 'b', dr: "Everybody can see us. That's the problem with being happy in this house." },
    ] },
    { id: 'smt.6', room: 'kitchen', turns: [
      { beat: '{a} and {b} are cooking dinner for the house together, bumping into each other on purpose.' },
      { by: 'a', say: "You're in my way." },
      { by: 'b', say: "I'm exactly where I want to be." },
      { by: 'a', say: "Then pass me the salt." },
      { beat: '{b} passes it, very slowly.' },
      { by: 'a', dr: "We're the house couple now. Everybody rolls their eyes at us. I don't mind at all." },
    ] },
    { id: 'smt.7', turns: [
      { by: 'a', say: "What do you think people at home think of us?" },
      { by: 'b', say: "Honestly? They either love us, or they're shouting at the TV." },
      { by: 'a', say: "Which one, though?" },
      { by: 'b', say: "Probably both, at the same time." },
      { by: 'a', say: "I can live with that.", v: { anxious: "That's terrifying. I'm going to think about that all night." } },
      { by: 'a', dr: "One day we're going to watch all of this back. I hope it looks as happy as it feels." },
    ] },
    { id: 'smt.8', room: 'bedroom', turns: [
      { beat: "Lights out. {a} and {b} have pushed their beds a little closer together than anyone else's." },
      { by: 'b', say: "Goodnight." },
      { by: 'a', say: "Night. Big day tomorrow." },
      { by: 'b', say: "Every day's a big day in here." },
      { by: 'a', say: "Then get some sleep, and win something tomorrow." },
      { by: 'b', dr: "In this house, {a} is the one thing that feels real." },
    ] },
  ],
};
