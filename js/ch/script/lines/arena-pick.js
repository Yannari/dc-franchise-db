// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/arena-pick.js — knowing the game, and taking the shot
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-17: "can they pick someone weak in the Arena so they win easily? how do they choose their
// opponent? always bonds seems not realistic and boring". callout.js weighs an easy win, a grudge, a hard fight,
// a promise and now the shot; season.js sometimes has TJ say the game first.
//   arena-reveal.any     TJ tells a (voted in) tomorrow's game, {game}, before the call-out
//   callout.shot         a calls out b, the biggest threat to a's own game, knowing it may be the harder fight
//   callout.survive      (added) the easy pick, when the game is known: {game}
// These say only what the call-out decided: never who b's friends are or what b has won.
export default {
  'arena-reveal.any': [
    { id: 'arv.1', turns: [
      { by: 'tj', say: "{a}, before you pick anybody, I think you should know what you're walking into tomorrow." },
      { by: 'tj', say: "Tomorrow's game is {game}." },
      { by: 'a', say: "Okay. That changes things." },
      { by: 'tj', say: "I thought it might. Sleep on it." },
      { by: 'a', conf: "Knowing the game changes everything. Now I have to decide what matters more: beating somebody, or beating the right somebody." },
    ] },
    { id: 'arv.2', turns: [
      { by: 'tj', say: "I'm going to do something I don't usually do. {a}, tomorrow it's {game}." },
      { by: 'a', say: "Why are you telling me?" },
      { by: 'tj', say: "Because I want to see what you do with it." },
      { beat: 'Every head in the room turns to {a}, then to each other.' },
      { by: 'a', conf: "TJ just handed me the game. Whoever I pick tomorrow, everybody is going to know I picked them with {game} in mind." },
    ] },
  ],
  'callout.shot': [
    { id: 'cos.1', turns: [
      { by: 'a', say: "{b}." },
      { beat: 'The stand goes quiet.' },
      { by: 'a', say: "Everybody in that house is scared of you. Somebody has to do something about it, so I'm doing it." },
      { by: 'b', say: "Brave. Stupid, but brave." },
      { by: 'a', conf: "I might lose tonight. But if I beat {b}, I change the whole game, and that's worth the risk." },
    ] },
    { id: 'cos.2', turns: [
      { by: 'a', say: "I'm calling out {b}." },
      { by: 'b', say: "Me? You've seen what I can do." },
      { by: 'a', say: "That's exactly why. As long as you're in that house, the rest of us are playing for second." },
      { by: 'tj', say: "Oh, this is a statement! I love a statement!" },
      { by: 'a', conf: "An easy pick gets me one more week. Picking {b} gets me the rest of the season, if I win." },
    ] },
    { id: 'cos.3', turns: [
      { by: 'a', say: "I could pick somebody easy. Everybody expects me to." },
      { by: 'a', say: "{b}. Let's go." },
      { by: 'b', say: "You're making a mistake." },
      { by: 'a', say: "Then it's my mistake to make." },
      { by: 'b', conf: "{a} didn't pick me to win. {a} picked me to get me out of the game. I almost respect it." },
    ] },
  ],
  'callout.survive+': [
    { id: 'cog.1', turns: [
      { by: 'a', say: "It's {game}. I've thought about this all night." },
      { by: 'a', say: "{b}." },
      { by: 'b', say: "Seriously? Me?" },
      { by: 'a', say: "Nothing personal. I just like my chances." },
      { by: 'a', conf: "Is it the bravest pick? No. Does it get me back to the villa tonight? I think it does." },
    ] },
    { id: 'cog.2', turns: [
      { by: 'a', say: "The game is {game}, and I'm picking {b}." },
      { by: 'b', say: "Because you think I'll lose at it." },
      { by: 'a', say: "Because I know I won't." },
      { by: 'b', conf: "{a} picked me because of {game}. Fine. I'd like to see {a}'s face when that plan falls apart." },
    ] },
  ],
};
