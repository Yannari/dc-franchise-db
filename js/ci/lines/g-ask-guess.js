// Question games and guess-whose games, beat by beat (Plan 3a+). Data only.
// ask: `choose` — a decides to ask b (qkind: catfish, barbed, friendly;
// anon); `react` — a watches b's answer land; `guess` — a (who was asked)
// works out that b asked; `conclusion` — a sums up what the game said about b.
// guess: `submit` — a sends a fact ({x}) for the prompt ({q}); `prompt` — a
// reads the prompt; `fact` — a reads a fact aloud ({x}), not knowing whose;
// `guessed.*` — a guesses (right: it's b); `owner` — a owns up ({x});
// `conclusion` — a on b.
const e = (id, turns, extra = {}) => ({ id, turns, ...extra });

export const G_ASK_GUESS = {
  'game.ask.choose': [
    e('game.ask.choose.01', [{ by: 'a', say: "Okay. Who do I ask? {b}. It's gotta be {b}." }]),
    e('game.ask.choose.02', [{ by: 'a', say: "I have one question and I know exactly who it's for." }], { beat: '{a} starts typing before the Circle finishes the rules.' }),
    e('game.ask.choose.03', [{ by: 'a', say: "{b} is a mystery to me. Let's fix that." }]),
    e('game.ask.choose.04', [{ by: 'a', say: "Nobody knows it's me. Nobody. Okay. {b}." }], { when: { anon: true } }),
    e('game.ask.choose.05', [{ by: 'a', say: "Something about {b} doesn't add up. This is my chance." }], { when: { qkind: 'catfish' } }),
    e('game.ask.choose.06', [{ by: 'a', say: "{b} has been fake nice for days. I'm going for it." }], { when: { qkind: 'barbed' } }),
    e('game.ask.choose.07', [{ by: 'a', say: "Keep it nice. {b} deserves a nice one." }], { when: { qkind: 'friendly' } }),
    e('game.ask.choose.08', [{ by: 'a', say: "If {b} is who {b.sub} says, this won't be a problem." }], { when: { qkind: 'catfish' } }),
  ],
  'game.ask.react': [
    e('game.ask.react.01', [{ by: 'a', react: "Okay, {b} answered that fast." }]),
    e('game.ask.react.02', [{ by: 'a', react: "Hm. Interesting answer, {b}." }]),
    e('game.ask.react.03', [{ by: 'a', react: "I'd love to know who asked {b} that." }], { when: { anon: true } }),
    e('game.ask.react.04', [{ by: 'a', react: "That answer took way too long. Way too long." }], { when: { result: 'fail' } }),
    e('game.ask.react.05', [{ by: 'a', react: "Okay, that sounded real. That was a real answer." }], { when: { result: 'pass' } }),
    e('game.ask.react.06', [{ by: 'a', react: "{b} dodged that. Did everybody see {b} dodge that?" }], { when: { result: 'dodge' } }),
    e('game.ask.react.07', [{ by: 'a', react: "Whoever asked that was coming for {b}. Oof." }], { when: { qkind: 'barbed' } }),
    e('game.ask.react.08', [{ by: 'a', react: "Aw. That was sweet." }], { when: { qkind: 'friendly' } }),
    e('game.ask.react.09', [{ by: 'a', react: "The whole Circle just read that." }], { beat: '{a} leans back and folds {a.posAdj} arms.' }),
  ],
  // a was asked; a works out that b asked it.
  'game.ask.guess': [
    e('game.ask.guess.01', [{ by: 'a', react: "I know that was {b}. That's so {b}." }]),
    e('game.ask.guess.02', [{ by: 'a', say: "Anonymous, sure. That was {b}. Nobody else talks like that." }]),
    e('game.ask.guess.03', [{ by: 'a', react: "{b}. It's {b}. I'd bet my life on it." }], { beat: '{a} writes a name on the notepad and underlines it.' }),
    e('game.ask.guess.04', [{ by: 'a', say: "{b} thinks I don't know. I know." }]),
  ],
  'game.ask.conclusion': [
    e('game.ask.conclusion.01', [{ by: 'a', say: "That game told me a lot. Mostly about {b}." }]),
    e('game.ask.conclusion.02', [{ by: 'a', say: "Everybody's answers were so careful. Except {b}'s." }]),
    e('game.ask.conclusion.03', [{ by: 'a', say: "I'm gonna be thinking about {b}'s answer all night." }]),
    e('game.ask.conclusion.04', [{ by: 'a', say: "{b} fumbled a question a real person would know. I'm just saying." }], { when: { failed: true } }),
    e('game.ask.conclusion.05', [{ by: 'a', say: "Somebody in here does not like {b}. That question was personal." }], { when: { barbed: true } }),
    e('game.ask.conclusion.06', [{ by: 'a', say: "Anonymous games bring out who people really are." }], { when: { anon: true } }),
  ],

  // ── guess ─────────────────────────────────────────────────────────────
  'game.guess.submit': [
    e('game.guess.submit.01', [{ by: 'a', say: "'{q}' Okay. Mine is: '{x}' Nobody's guessing that." }]),
    e('game.guess.submit.02', [{ by: 'a', say: "'{q}' Do I tell the truth? I tell the truth. '{x}'" }]),
    e('game.guess.submit.03', [{ by: 'a', say: "'{x}' Send. They're never gonna know it's me." }]),
    e('game.guess.submit.04', [{ by: 'a', say: "Careful. What would my profile say? '{x}' That works." }], { when: { catfish: true } }),
    e('game.guess.submit.05', [{ by: 'a', say: "'{q}' This is so embarrassing. '{x}'" }], { beat: '{a} hides {a.posAdj} face while it sends.' }),
  ],
  'game.guess.prompt': [
    e('game.guess.prompt.01', [{ by: 'a', react: "Next category. '{q}'" }]),
    e('game.guess.prompt.02', [{ by: 'a', react: "'{q}' Oh, these are gonna be good." }]),
    e('game.guess.prompt.03', [{ by: 'a', react: "'{q}' I need to see everybody's answers right now." }]),
    e('game.guess.prompt.04', [{ by: 'a', react: "'{q}' This is where somebody slips up." }]),
  ],
  'game.guess.fact': [
    e('game.guess.fact.01', [{ by: 'a', react: "'{x}' Okay, who wrote that?" }]),
    e('game.guess.fact.02', [{ by: 'a', react: "'{x}' That's wild. That's so wild." }]),
    e('game.guess.fact.03', [{ by: 'a', react: "'{x}' I have a feeling. I have a strong feeling." }]),
    e('game.guess.fact.04', [{ by: 'a', react: "'{x}' Somebody in here is full of surprises." }]),
    e('game.guess.fact.05', [{ by: 'a', react: "'{x}' Ha! I love that." }]),
  ],
  'game.guess.guessed.right': [
    e('game.guess.guessed.right.01', [{ by: 'a', say: "That's {b}. I know it's {b}." }]),
    e('game.guess.guessed.right.02', [{ by: 'a', say: "Circle, I'm guessing {b}. Final answer." }]),
    e('game.guess.guessed.right.03', [{ by: 'a', say: "That sounds exactly like {b}." }]),
    e('game.guess.guessed.right.04', [{ by: 'a', say: "Easy. {b}. We talk every day." }], { when: { friends: true } }),
  ],
  'game.guess.guessed.wrong': [
    e('game.guess.guessed.wrong.01', [{ by: 'a', say: "I have no idea. I'm guessing somebody else." }]),
    e('game.guess.guessed.wrong.02', [{ by: 'a', say: "That's not anybody I know in here. I'll take a wild guess." }]),
    e('game.guess.guessed.wrong.03', [{ by: 'a', say: "I was so sure. I was so sure, and I was so wrong." }]),
    e('game.guess.guessed.wrong.04', [{ by: 'a', say: "Circle, I'm going with my gut. My gut is usually right." }], { beat: 'It is not right this time.' }),
  ],
  // a owns the fact ({x}); n people placed it.
  'game.guess.owner': [
    e('game.guess.owner.01', [{ by: 'a', react: "That was me! Nobody guessed it was me!" }]),
    e('game.guess.owner.02', [{ by: 'a', react: "Yes, that was mine. Don't judge me." }]),
    e('game.guess.owner.03', [{ by: 'a', react: "'{x}' That's me. I stand by it." }]),
    e('game.guess.owner.04', [{ by: 'a', react: "They got me. How did they get me?" }]),
    e('game.guess.owner.05', [{ by: 'a', say: "Was that too much? Was that too real for my profile?" }], { when: { off: true } }),
    e('game.guess.owner.06', [{ by: 'a', say: "Oh no. That doesn't sound like somebody my age. Does it?" }], { when: { off: true } }),
  ],
  'game.guess.conclusion': [
    e('game.guess.conclusion.01', [{ by: 'a', say: "{b} surprised me in that game. More than once." }]),
    e('game.guess.conclusion.02', [{ by: 'a', say: "I feel like I know everybody a little better now. Especially {b}." }]),
    e('game.guess.conclusion.03', [{ by: 'a', say: "Nobody could place {b}'s answers. Nobody. That's interesting." }]),
    e('game.guess.conclusion.04', [{ by: 'a', say: "{b}'s answer does not match that profile. At all." }], { when: { slipped: true } }),
    e('game.guess.conclusion.05', [{ by: 'a', say: "Who is {b}, really? That answer made me wonder." }], { when: { slipped: true } }),
  ],
};
