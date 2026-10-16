// The scenes that still aired thin after the long cut (three seasons measured, 2026-10-16: a staging line and one
// confessional, or two lines): the return of a winner nobody voted in, overheard, the morning after, the kitchen,
// TJ's house meeting, the night before the Arena, a fight that turns physical. Each keeps its own turns (by index)
// and gains the conversation around them; a reply to an optional part names the part it needs.
export default {
  // ── back from the Arena, called out: the friends are there now (house.js returnToHouse) ──
  // ── overheard ──
  // ── the morning after ──
  // ── the kitchen ──
  'kd.a1': [0, 1,
    { by: 'x', opt: 1, say: "Open a window! Open every window!" },
    { by: 'a', opt: 'x', say: "It's fine! It's a little bit on fire, but it's fine!" },
    2],
  'kd.a2': [0, 1,
    { by: 'x', opt: 1, say: "Are they supposed to be that color?" },
    { by: 'a', opt: 'x', say: "That's the color of love." },
    { by: 'x', opt: 1, say: "Love looks undercooked." },
    2],
  'kd.a3': [
    { beat: '{a} is standing over a pot with a wooden spoon and a worried face.' },
    0,
    { by: 'x', opt: 1, say: "Did you wash it first?" },
    { by: 'a', opt: 'x', say: "You're supposed to wash rice?" },
    1],
  // ── jealousy, kept quiet ──
  // ── a loyalty test that held ──
  // ── an alliance picked off ──
  // ── the night before the Arena, alone ──
  'ea.2': [0,
    { beat: 'Somewhere in the villa a door closes. {a} doesn\'t move.' },
    1],
  // ── a fight that turns physical ──
  'fp.2': [0,
    { by: 'b', say: "Get your hands off me!" },
    { by: 'x', opt: 1, say: "Whoa, whoa, whoa! Stop!" },
    { beat: 'Three people drag {a} back across the bar.' },
    1],
  // ── the instant elimination ──
  'ie.2': [0,
    { by: 'b', say: "Right now? We just finished a checkpoint." },
    { by: 'tj', say: "Right now! That's why it's called instant!" },
    1],
  // ── the overnight ──
  'on.2': [0,
    { by: 'x', opt: 1, say: "Anybody awake?" },
    { by: 'a', opt: 'x', say: "Nobody's asleep. Nobody can sleep." },
    1],
  // ── a giant falls ──
  'agf.1': [0,
    { by: 'x', opt: 1, say: "I know. I didn't think it was possible either." },
    { by: 'a', opt: 'x', say: "Everybody was scared of {gone}. Everybody." },
    1],
  'agf.2': [0,
    { by: 'a', say: "You actually did it." },
    { by: 'b', say: "I actually did it." },
    1],
  // ── TJ comes to the villa ──
  'tm.1': [0,
    { by: 'x', opt: 1, say: "Is he serious?" },
    { by: 'a', opt: 'x', say: "Look at his face. He's serious." },
    1],
  'tm.2': [0,
    { by: 'x', opt: 1, say: "That's it? Just like that?" },
    { by: 'tj', say: "Just like that. Rules are rules." },
    1],
  'tm.3': [0,
    { beat: 'Nobody in the room says a word.' },
    { by: 'x', opt: 1, say: "Understood, TJ." },
    1],
};
