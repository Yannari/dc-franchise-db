// Statement games and naming games, beat by beat (Plan 3a+). Data only.
// Family keys (`game.statement.*`, `game.name.*`) fit any game of the family;
// `g.<game>.<prompt>.<beat>` keys are what a real player would say to THAT
// prompt (1×01: "Who doesn't pee in the shower?"; 1×11: everyone says
// Shubham for President). {q} is the prompt, {ans} the answer word, {n} a count.
const e = (id, turns, extra = {}) => ({ id, turns, ...extra });
const say = (a, b) => [{ by: 'a', react: a }, ...(b ? [{ by: 'b', react: b }] : [])];

export const G_STATEMENT_NAME = {
  // ── any game: a second player reacts to the alert ──────────────────────
  'game.first': [
    e('game.first.01', [{ by: 'a', react: "A game? Oh, this could get messy." }]),
    e('game.first.02', [{ by: 'a', react: "Here we go. Everybody's about to show who they really are." }]),
    e('game.first.03', [{ by: 'a', react: "I love a game. I hate a game. I don't know yet." }], { beat: '{a} sits down cross-legged in front of the screen.' }),
    e('game.first.04', [{ by: 'a', say: "Okay. Play it smart. Don't say anything that sticks." }]),
    e('game.first.05', [{ by: 'a', react: "Finally! Something to do besides talk to my plants." }]),
    e('game.first.06', [{ by: 'a', react: "Oh no. The Circle is up to something." }], { beat: '{a} turns the music off to concentrate.' }),
    e('game.first.07', [{ by: 'a', react: "Let's go! Game face on." }]),
    e('game.first.08', [{ by: 'a', say: "Games are where people slip. I'm watching everybody." }]),
  ],

  // ── statement ──────────────────────────────────────────────────────────
  'game.statement.prompt': [
    e('game.statement.prompt.01', [{ by: 'a', react: "Next one. '{q}'" }]),
    e('game.statement.prompt.02', [{ by: 'a', react: "'{q}' Oh, this one's gonna split the room." }]),
    e('game.statement.prompt.03', [{ by: 'a', react: "'{q}' Okay, that's a real question." }]),
    e('game.statement.prompt.04', [{ by: 'a', react: "'{q}' Easy. Too easy. Suspiciously easy." }]),
    e('game.statement.prompt.05', [{ by: 'a', react: "Oh no. '{q}' Why would they ask that?" }]),
    e('game.statement.prompt.06', [{ by: 'a', react: "'{q}'" }, { by: 'a', say: "Everybody's gonna lie on this one. Everybody." }]),
    e('game.statement.prompt.07', [{ by: 'a', react: "'{q}' I have to think about this." }], { beat: '{a} stares at the ceiling for a full ten seconds.' }),
  ],
  'game.statement.results': [
    e('game.statement.results.01', [{ by: 'a', react: "Okay, let's see who said what." }]),
    e('game.statement.results.02', [{ by: 'a', react: "Circle, show me the answers. Come on, come on." }]),
    e('game.statement.results.03', [{ by: 'a', react: "The answers are in. Oh, this is good." }]),
    e('game.statement.results.04', [{ by: 'a', react: "Everybody said the same thing? Boring! I love you all, but boring." }], { when: { split: 'all' } }),
    e('game.statement.results.05', [{ by: 'a', react: "It's split right down the middle. Oh, this is gonna start something." }], { when: { split: 'split' } }),
    e('game.statement.results.06', [{ by: 'a', react: "Everybody agrees except one. Just one." }], { when: { split: 'lone' } }),
    e('game.statement.results.07', [{ by: 'a', react: "I'm shocked how many people answered like that." }], { when: { split: 'split' } }),
    e('game.statement.results.08', [{ by: 'a', react: "The whole Circle said the same thing. Okay, we're all normal." }], { when: { split: 'all' } }),
  ],
  // a messages b in the game chat about b's lone answer; b answers back.
  'game.statement.at': [
    e('game.statement.at.01', [
      { by: 'a', send: "@{b} you're the only one who said \"{ans}\" lol. Explain yourself {e:eyes}" },
      { by: 'b', react: "Of course somebody noticed.", send: "Somebody had to be honest in here {e:laugh}" },
    ]),
    e('game.statement.at.02', [
      { by: 'a', send: "@{b} I need to know more about that answer {e:detective}" },
      { by: 'b', send: "Nothing to know! I just said what I think" },
    ]),
    e('game.statement.at.03', [
      { by: 'a', send: "@{b} don't lie, you said \"{ans}\" and I respect it" },
      { by: 'b', react: "Thank God, somebody gets it.", send: "Finally somebody with sense {e:clap}" },
    ]),
    e('game.statement.at.04', [
      { by: 'a', send: "@{b} really?? {e:shock}" },
      { by: 'b', send: "Really. And I'd say it again lol" },
      { by: 'a', react: "Okay. {b} is a wild card." },
    ]),
    e('game.statement.at.05', [
      { by: 'a', say: "Poke the bear. Let's see what {b} does.", send: "@{b} just you, huh? {e:side}" },
      { by: 'b', react: "Oh, I see what you're doing.", send: "Just me. Somebody's gotta keep it interesting" },
    ]),
    e('game.statement.at.06', [
      { by: 'a', send: "@{b} I'm not judging. I'm judging a little" },
      { by: 'b', send: "Judge away. I'm not changing it {e:laugh}" },
    ]),
  ],
  // a is surprised by friend b's answer.
  'game.statement.surprise': [
    e('game.statement.surprise.01', say("{b} said \"{ans}\"? I thought I knew {b}.")),
    e('game.statement.surprise.02', say("Wait. {b} and I didn't answer the same? We always agree.")),
    e('game.statement.surprise.03', say("Hm. {b} surprised me with that one.")),
    e('game.statement.surprise.04', [{ by: 'a', react: "Not {b}! Come on, {b}." }], { beat: '{a} laughs and shakes {a.posAdj} head.' }),
    e('game.statement.surprise.05', [{ by: 'a', say: "Okay, {b} and I need to talk about this later." }]),
  ],
  // after the game: a draws a conclusion about b.
  'game.statement.conclusion': [
    e('game.statement.conclusion.01', [{ by: 'a', say: "I learned more about {b} in ten minutes than in two days." }]),
    e('game.statement.conclusion.02', [{ by: 'a', say: "That game was fun. And a little too honest." }]),
    e('game.statement.conclusion.03', [{ by: 'a', say: "{b}'s answers are all I can think about right now." }]),
    e('game.statement.conclusion.04', [{ by: 'a', say: "{b} was on their own again and again. That's raising some flags in my head." }], { when: { odd: true } }),
    e('game.statement.conclusion.05', [{ by: 'a', say: "Everybody's answers matched their profiles. Except {b}'s." }], { when: { odd: true, suspects: true } }),
    e('game.statement.conclusion.06', [{ by: 'a', say: "Honestly, {b} is my kind of person. Same answers, same energy." }], { when: { friends: true } }),
    e('game.statement.conclusion.07', [{ by: 'a', say: "Games like that are how you find out who's real. Noted, {b}." }]),
  ],

  // ── statement, per prompt (a answers aloud; b reacts) ───────────────────
  'g.ice-breaker.shower.agree': [
    e('g.ice-breaker.shower.agree.01', say("It is definitely okay to pee in the shower. Who doesn't pee in the shower?", "Oh, {a} is a shower peer.")),
    e('g.ice-breaker.shower.agree.02', say("Agree. It's a universal thing. You're gonna dry off to take a leak? Come on.", "I'm shocked. Honestly, I'm shocked.")),
  ],
  'g.ice-breaker.shower.disagree': [
    e('g.ice-breaker.shower.disagree.01', say("Absolutely not. Disagree. That's disgusting.", "{a} is lying. Everybody does it.")),
    e('g.ice-breaker.shower.disagree.02', say("In the shower, I wash with soap and then I rinse. That's it. Disagree.", "Sure, {a}. Sure.")),
  ],
  'g.ice-breaker.money.agree': [
    e('g.ice-breaker.money.agree.01', say("Money can buy me a lot of happiness, trust me. Agree.", "Honest. I like that.")),
    e('g.ice-breaker.money.agree.02', say("It can't buy true happiness, but it sure can buy temporary happiness. Agree.", "Ha. Temporary happiness. Fair.")),
  ],
  'g.ice-breaker.money.disagree': [
    e('g.ice-breaker.money.disagree.01', say("My family never had much, and we were happy. Disagree.", "Aw. That's sweet, {a}.")),
    e('g.ice-breaker.money.disagree.02', say("Disagree. Happiness is people, not stuff.", "Okay, {a}. Very wholesome.")),
  ],
  'g.ice-breaker.first-date.agree': [
    e('g.ice-breaker.first-date.agree.01', say("If the vibe is right, the vibe is right. Agree.", "Ooh, {a}.")),
    e('g.ice-breaker.first-date.agree.02', say("Life's short. Agree.", "{a} doesn't waste time. Noted.")),
  ],
  'g.ice-breaker.first-date.disagree': [
    e('g.ice-breaker.first-date.disagree.01', say("You gotta earn it. Disagree.", "Old school. I like it.")),
    e('g.ice-breaker.first-date.disagree.02', say("First date is for talking. Disagree.", "Old-fashioned. I respect it, {a}.")),
  ],
  'g.ice-breaker.truth.agree': [
    e('g.ice-breaker.truth.agree.01', say("Always. If you lie about the little things, you'll lie about the big things. Agree.", "In here? Bold answer, {a}.")),
    e('g.ice-breaker.truth.agree.02', say("Agree. Honesty is everything to me.", "Says a person in the Circle. Okay.")),
  ],
  'g.ice-breaker.truth.disagree': [
    e('g.ice-breaker.truth.disagree.01', say("Some things you keep to yourself. Disagree.", "Hm. {a} has secrets.")),
    e('g.ice-breaker.truth.disagree.02', say("If the truth hurts for no reason, keep it. Disagree.", "That's kind of fair, actually.")),
  ],
  'g.ice-breaker.ex.agree': [
    e('g.ice-breaker.ex.agree.01', say("If they're done with them, they're done. Agree.", "Oh, {a} is dangerous.")),
    e('g.ice-breaker.ex.agree.02', say("Love is love. Agree.", "I would never. {a} would.")),
  ],
  'g.ice-breaker.ex.disagree': [
    e('g.ice-breaker.ex.disagree.01', say("Girl code. Guy code. Any code. Disagree.", "Loyal. I like {a} more now.")),
    e('g.ice-breaker.ex.disagree.02', say("Never. Not in a million years. Disagree.", "That's a friend right there.")),
  ],
  'g.ice-breaker.phone.agree': [
    e('g.ice-breaker.phone.agree.01', say("If you have nothing to hide, what's the problem? Agree.", "Red flag. Red flag, {a}.")),
    e('g.ice-breaker.phone.agree.02', say("I'm not proud of it. Agree.", "At least {a} is honest about being nosy.")),
  ],
  'g.ice-breaker.phone.disagree': [
    e('g.ice-breaker.phone.disagree.01', say("Trust is trust. Disagree.", "Okay. {a} is a trusting person.")),
    e('g.ice-breaker.phone.disagree.02', say("If I have to look, it's already over. Disagree.", "Wise words from {a}.")),
  ],
  'g.ice-breaker.split.agree': [
    e('g.ice-breaker.split.agree.01', say("You asked me out, you pay. Agree.", "Ha. {a} has rules.")),
    e('g.ice-breaker.split.agree.02', say("That's just manners. Agree.", "Manners. Okay.")),
  ],
  'g.ice-breaker.split.disagree': [
    e('g.ice-breaker.split.disagree.01', say("Split it. Always split it. Disagree.", "Modern. I like it.")),
    e('g.ice-breaker.split.disagree.02', say("Whoever makes more money pays. Disagree.", "That's a strategy, {a}.")),
  ],

  'g.been-there.skinny-dip.agree': [
    e('g.been-there.skinny-dip.agree.01', say("Yes. And I'd do it again.", "{a}! Oh, I love this.")),
    e('g.been-there.skinny-dip.agree.02', say("Yes. It was cold. That's all I'll say.", "Cold. Ha.")),
  ],
  'g.been-there.skinny-dip.disagree': [
    e('g.been-there.skinny-dip.disagree.01', say("No. My mom would find out somehow.", "{a} is a good kid.")),
    e('g.been-there.skinny-dip.disagree.02', say("Never. Not even once.", "Boring, {a}. Boring.")),
  ],
  'g.been-there.ghosted.agree': [
    e('g.been-there.ghosted.agree.01', say("Yes. I'm not proud of it.", "Oh, so {a} is a ghoster.")),
    e('g.been-there.ghosted.agree.02', say("Yes. They had it coming.", "Remind me never to text {a} late.")),
  ],
  'g.been-there.ghosted.disagree': [
    e('g.been-there.ghosted.disagree.01', say("No. I always tell people where they stand.", "Honest. I like that.")),
    e('g.been-there.ghosted.disagree.02', say("Never. I've been ghosted. I'd never do that to anyone.", "Aw. That's real.")),
  ],
  'g.been-there.cried-movie.agree': [
    e('g.been-there.cried-movie.agree.01', say("Yes. Every single movie with a dog in it.", "Same, {a}. Same.")),
    e('g.been-there.cried-movie.agree.02', say("Yes, and I'm not ashamed.", "A softie. Noted.")),
  ],
  'g.been-there.cried-movie.disagree': [
    e('g.been-there.cried-movie.disagree.01', say("No. I'm made of stone.", "{a} is lying. Everybody cries at movies.")),
    e('g.been-there.cried-movie.disagree.02', say("No. I laugh at sad parts. I don't know why.", "That's concerning, {a}.")),
  ],
  'g.been-there.fake-name.agree': [
    e('g.been-there.fake-name.agree.01', say("Yes. At a bar. Several times.", "{a} gives fake names. Interesting. In here, very interesting.")),
    e('g.been-there.fake-name.agree.02', say("Yes. Is that bad? That's bad in here, isn't it?", "Oh, that's very bad in here.")),
  ],
  'g.been-there.fake-name.disagree': [
    e('g.been-there.fake-name.disagree.01', say("No. My name is my name.", "Good answer for a place full of catfish.")),
    e('g.been-there.fake-name.disagree.02', say("Never. What would even be the point?", "Okay, {a}.")),
  ],
  'g.been-there.bar-fight.agree': [
    e('g.been-there.bar-fight.agree.01', say("Yes. I didn't start it. I finished it.", "Do not mess with {a}. Got it.")),
    e('g.been-there.bar-fight.agree.02', say("Yes, and I'd rather not talk about it.", "Oh, now I need to know.")),
  ],
  'g.been-there.bar-fight.disagree': [
    e('g.been-there.bar-fight.disagree.01', say("No. I'm a lover, not a fighter.", "Of course {a} is.")),
    e('g.been-there.bar-fight.disagree.02', say("Never. I leave before it gets bad.", "Smart. Very smart.")),
  ],
  'g.been-there.marathon.agree': [
    e('g.been-there.marathon.agree.01', say("Yes. Twice. My knees remember.", "{a} is an athlete. Of course.")),
    e('g.been-there.marathon.agree.02', say("Yes. I walked some of it. It still counts.", "It counts, {a}.")),
  ],
  'g.been-there.marathon.disagree': [
    e('g.been-there.marathon.disagree.01', say("No. I run to the fridge. That's my marathon.", "Ha! Relatable.")),
    e('g.been-there.marathon.disagree.02', say("No, but I've watched one. From a bar.", "Same, {a}.")),
  ],

  'g.for-real.unfriend.agree': [
    e('g.for-real.unfriend.agree.01', say("Yes. I'm not going down with them.", "Cold. {a} is cold.")),
    e('g.for-real.unfriend.agree.02', say("Depends what they did. But yes.", "Fair enough.")),
  ],
  'g.for-real.unfriend.disagree': [
    e('g.for-real.unfriend.disagree.01', say("No. If you get canceled, so what? We can't take you anywhere, but you're still my friend.", "Ha! Loyal, {a}.")),
    e('g.for-real.unfriend.disagree.02', say("No. Friends are friends.", "That's my kind of answer.")),
  ],
  'g.for-real.secret.agree': [
    e('g.for-real.secret.agree.01', say("Yes. They trust me. We are not going to rat them out.", "Loyal to the end. Okay, {a}.")),
    e('g.for-real.secret.agree.02', say("Yes. It's not my relationship.", "Hm. I'd tell. I'd tell so fast.")),
  ],
  'g.for-real.secret.disagree': [
    e('g.for-real.secret.disagree.01', say("No. Cheating is cheating. I'm telling.", "{a} is a truth teller.")),
    e('g.for-real.secret.disagree.02', say("No. I'm not carrying that for somebody.", "Respect, {a}.")),
  ],
  'g.for-real.read-texts.agree': [
    e('g.for-real.read-texts.agree.01', say("Yes. I'm human.", "{a} said yes? Nosy!")),
    e('g.for-real.read-texts.agree.02', say("Yes, and I'd feel terrible after.", "At least you'd feel terrible.")),
  ],
  'g.for-real.read-texts.disagree': [
    e('g.for-real.read-texts.disagree.01', say("No. If you have to snoop, it's already over.", "Wise, {a}.")),
    e('g.for-real.read-texts.disagree.02', say("No. I'd just ask.", "Just ask. Look at {a}, all mature.")),
  ],
  'g.for-real.lie-age.agree': [
    e('g.for-real.lie-age.agree.01', say("Yes. A little. Two years, tops.", "{a} lies about age? Interesting. In here? Interesting.")),
    e('g.for-real.lie-age.agree.02', say("Yes. It's just a number.", "It's just a number, says the person lying about the number.")),
  ],
  'g.for-real.lie-age.disagree': [
    e('g.for-real.lie-age.disagree.01', say("No. Own your age.", "Own it, {a}!")),
    e('g.for-real.lie-age.disagree.02', say("Never. If they can't handle my age, bye.", "Confidence. I love it.")),
  ],
  'g.for-real.return-wallet.agree': [
    e('g.for-real.return-wallet.agree.01', say("Of course. That's somebody's rent.", "A good person. Or a good liar.")),
    e('g.for-real.return-wallet.agree.02', say("Yes. My grandma would haunt me otherwise.", "Ha. Grandma is watching.")),
  ],
  'g.for-real.return-wallet.disagree': [
    e('g.for-real.return-wallet.disagree.01', say("Finders keepers. I'm kidding. Mostly. No.", "{a} said no! Wow.")),
    e('g.for-real.return-wallet.disagree.02', say("No. I'd give it to the police and let them deal with it.", "That's technically a no. Technically.")),
  ],
  'g.for-real.regift.agree': [
    e('g.for-real.regift.agree.01', say("Yes. And I'd never get caught.", "{a} would never get caught. Noted.")),
    e('g.for-real.regift.agree.02', say("Yes. It's recycling.", "Recycling. Okay, {a}.")),
  ],
  'g.for-real.regift.disagree': [
    e('g.for-real.regift.disagree.01', say("No. A gift is a gift.", "Sweet. {a} is sweet.")),
    e('g.for-real.regift.disagree.02', say("No. I keep everything. Every card, every candle.", "A sentimental one.")),
  ],

  'g.risky-quizness.jump.agree': [
    e('g.risky-quizness.jump.agree.01', say("Yes. And I screamed the whole way down.", "{a} jumped out of a plane? Stop.")),
    e('g.risky-quizness.jump.agree.02', say("Yes. Best day of my life.", "{a} is fearless.")),
  ],
  'g.risky-quizness.jump.disagree': [
    e('g.risky-quizness.jump.disagree.01', say("Absolutely not. I like the ground.", "Same, {a}.")),
    e('g.risky-quizness.jump.disagree.02', say("No. I get scared on a ladder.", "Ha. A ladder.")),
  ],
  'g.risky-quizness.quit.agree': [
    e('g.risky-quizness.quit.agree.01', say("Yes. Walked out mid-shift. Never looked back.", "Legend. {a} is a legend.")),
    e('g.risky-quizness.quit.agree.02', say("Yes. My boss had it coming.", "Oh, {a} has a temper.")),
  ],
  'g.risky-quizness.quit.disagree': [
    e('g.risky-quizness.quit.disagree.01', say("No. I give two weeks. Always.", "Responsible {a}.")),
    e('g.risky-quizness.quit.disagree.02', say("No. I need the money too much.", "Real. Very real.")),
  ],
  'g.risky-quizness.tattoo.agree': [
    e('g.risky-quizness.tattoo.agree.01', say("Yes. It's a name. It's not the right name anymore.", "Oh no, {a}!")),
    e('g.risky-quizness.tattoo.agree.02', say("Yes. It was supposed to be a bird.", "What is it now?")),
  ],
  'g.risky-quizness.tattoo.disagree': [
    e('g.risky-quizness.tattoo.disagree.01', say("No regrets. Every tattoo has a story.", "I need to see these tattoos.")),
    e('g.risky-quizness.tattoo.disagree.02', say("No. I don't have any. Needles, no thank you.", "Scared of needles. Cute.")),
  ],
  'g.risky-quizness.sneak.agree': [
    e('g.risky-quizness.sneak.agree.01', say("Yes. Through the back, with the band's equipment.", "{a} is sneaky. Remember that.")),
    e('g.risky-quizness.sneak.agree.02', say("Yes. And I'd do it again.", "Oh, {a} is trouble.")),
  ],
  'g.risky-quizness.sneak.disagree': [
    e('g.risky-quizness.sneak.disagree.01', say("No. I'd get caught in two seconds.", "Honest about being bad at crime. Okay.")),
    e('g.risky-quizness.sneak.disagree.02', say("No. I pay for my tickets like a grown-up.", "Look at {a}.")),
  ],
  'g.risky-quizness.crush.agree': [
    e('g.risky-quizness.crush.agree.01', say("Yes. We dated. It was a disaster.", "Oh, I need this story.")),
    e('g.risky-quizness.crush.agree.02', say("Yes. It went fine. Kind of.", "Kind of. Ha.")),
  ],
  'g.risky-quizness.crush.disagree': [
    e('g.risky-quizness.crush.disagree.01', say("No. I'd rather die.", "{a} would rather die. Noted.")),
    e('g.risky-quizness.crush.disagree.02', say("No. I keep it inside forever. Healthy.", "Very healthy, {a}.")),
  ],
  'g.risky-quizness.dare.agree': [
    e('g.risky-quizness.dare.agree.01', say("Yes. Don't ask me which one.", "Now I have to ask.")),
    e('g.risky-quizness.dare.agree.02', say("Yes. It involved a fountain.", "A fountain, {a}? A fountain?")),
  ],
  'g.risky-quizness.dare.disagree': [
    e('g.risky-quizness.dare.disagree.01', say("No. I only do dares I'd do anyway.", "That's cheating, {a}.")),
    e('g.risky-quizness.dare.disagree.02', say("No regrets. Ever.", "{a} lives with no regrets.")),
  ],

  'g.pick-3.phone.agree': [
    e('g.pick-3.phone.agree.01', say("My phone. Obviously. Look where we are, and I miss it every second.", "Same, {a}. Same.")),
    e('g.pick-3.phone.agree.02', say("Yes. My whole life is in there.", "Relatable.")),
  ],
  'g.pick-3.phone.disagree': [
    e('g.pick-3.phone.disagree.01', say("No. Honestly, being without it in here has been kind of nice.", "{a} is enlightened.")),
    e('g.pick-3.phone.disagree.02', say("No. I could live without it. Probably.", "Probably. Ha.")),
  ],
  'g.pick-3.family.agree': [
    e('g.pick-3.family.agree.01', say("My family. Always my family.", "Aw, {a}.")),
    e('g.pick-3.family.agree.02', say("Yes. They're the reason I'm here.", "That's sweet.")),
  ],
  'g.pick-3.family.disagree': [
    e('g.pick-3.family.disagree.01', say("I love them. I'm picking snacks. They'd understand.", "Ha! {a} picked snacks over family.")),
    e('g.pick-3.family.disagree.02', say("They're a given. I'm using my picks on other things.", "Smart, {a}.")),
  ],
  'g.pick-3.gym.agree': [
    e('g.pick-3.gym.agree.01', say("The gym. It's my therapy.", "Of course {a} picked the gym.")),
    e('g.pick-3.gym.agree.02', say("Yes. I'd lose my mind without it.", "{a} is a gym person. Noted.")),
  ],
  'g.pick-3.gym.disagree': [
    e('g.pick-3.gym.disagree.01', say("The gym? Never heard of her.", "Ha!")),
    e('g.pick-3.gym.disagree.02', say("No. I work out by walking to the fridge.", "Honestly, same.")),
  ],
  'g.pick-3.coffee.agree': [
    e('g.pick-3.coffee.agree.01', say("Coffee. I'm not a person without it.", "Nobody is, {a}.")),
    e('g.pick-3.coffee.agree.02', say("Yes. Three cups before noon.", "Three? {a} is wired.")),
  ],
  'g.pick-3.coffee.disagree': [
    e('g.pick-3.coffee.disagree.01', say("I don't even drink coffee.", "Who doesn't drink coffee? {a}, apparently.")),
    e('g.pick-3.coffee.disagree.02', say("No. Tea people unite.", "A tea person. Suspicious.")),
  ],
  'g.pick-3.music.agree': [
    e('g.pick-3.music.agree.01', say("Music. It's how I get through everything.", "Yes, {a}!")),
    e('g.pick-3.music.agree.02', say("Yes. Silence scares me.", "Same.")),
  ],
  'g.pick-3.music.disagree': [
    e('g.pick-3.music.disagree.01', say("No. I'm a podcast person.", "Of course {a} is.")),
    e('g.pick-3.music.disagree.02', say("I could live without it. I'd hum.", "{a} would hum. Ha.")),
  ],
  'g.pick-3.faith.agree': [
    e('g.pick-3.faith.agree.01', say("My faith. It keeps me grounded, in here more than ever.", "That's beautiful, {a}.")),
    e('g.pick-3.faith.agree.02', say("Yes. Every morning, no matter what.", "Respect.")),
  ],
  'g.pick-3.faith.disagree': [
    e('g.pick-3.faith.disagree.01', say("Not for me, but I respect it.", "Fair.")),
    e('g.pick-3.faith.disagree.02', say("I'll keep that one private.", "Private. Okay, {a}.")),
  ],

  // ── name ───────────────────────────────────────────────────────────────
  'game.name.prompt': [
    e('game.name.prompt.01', [{ by: 'a', react: "'{q}' Oh no." }]),
    e('game.name.prompt.02', [{ by: 'a', react: "Next. '{q}' I know exactly who." }]),
    e('game.name.prompt.03', [{ by: 'a', react: "'{q}' Okay, this is gonna hurt somebody's feelings." }]),
    e('game.name.prompt.04', [{ by: 'a', react: "'{q}' Ha! I'm back in high school." }]),
    e('game.name.prompt.05', [{ by: 'a', react: "'{q}'" }, { by: 'a', say: "I have to be careful. Whoever I say is gonna see it." }]),
    e('game.name.prompt.06', [{ by: 'a', react: "'{q}' That's so easy it's not even fair." }]),
    e('game.name.prompt.07', [{ by: 'a', react: "'{q}' I was not ready for that." }], { when: { tone: 'good' } }),
  ],
  // a names b, and says why.
  'game.name.namer': [
    e('game.name.namer.01', [{ by: 'a', say: "I'm saying {b}. It has to be {b}." }]),
    e('game.name.namer.02', [{ by: 'a', say: "Circle, {b}. Sorry, not sorry." }]),
    e('game.name.namer.03', [{ by: 'a', say: "I'm thinking {b}. Yeah. {b}." }]),
    e('game.name.namer.04', [{ by: 'a', say: "{b}, because {b} would make everybody laugh doing it." }], { when: { tone: 'funny' } }),
    e('game.name.namer.05', [{ by: 'a', say: "{b}. I've seen how {b} plays. I'm just saying it out loud." }], { when: { tone: 'bad' } }),
    e('game.name.namer.06', [{ by: 'a', say: "{b}, and I mean that as the biggest compliment." }], { when: { tone: 'good' } }),
    e('game.name.namer.07', [{ by: 'a', say: "Honestly? {b}. Don't hate me, {b}." }], { when: { tone: 'bad' } }),
    e('game.name.namer.08', [{ by: 'a', say: "{b}. It's not even a question." }]),
  ],
  // the named player answers the room in the game chat.
  'game.name.reply.good': [
    e('game.name.reply.good.01', [{ by: 'a', react: "Everybody said me? Stop!", send: "Wow! Thank you so much, guys {e:heart}" }]),
    e('game.name.reply.good.02', [{ by: 'a', send: "You guys are making me blush over here {e:smile}" }]),
    e('game.name.reply.good.03', [{ by: 'a', react: "Okay, now I'm scared. Everybody likes me too much.", send: "Love you all. Really" }]),
    e('game.name.reply.good.04', [{ by: 'a', send: "I'll take it!! Thank you Circle {e:pray}" }]),
    e('game.name.reply.good.05', [{ by: 'a', react: "{n} people said me. {n}!", send: "I don't deserve you guys {e:cry}" }]),
  ],
  'game.name.reply.bad': [
    e('game.name.reply.bad.01', [{ by: 'a', react: "Me? Are you kidding me?", send: "Wow. Okay. I'll remember that {e:side}" }]),
    e('game.name.reply.bad.02', [{ by: 'a', send: "Lol I think you all have me confused with somebody else" }]),
    e('game.name.reply.bad.03', [{ by: 'a', react: "{n} people. {n} people think that about me.", send: "Noted. Very noted" }]),
    e('game.name.reply.bad.04', [{ by: 'a', react: "That hurts. That actually hurts." }], { beat: '{a} closes the game and does not say a word for a while.' }),
    e('game.name.reply.bad.05', [{ by: 'a', send: "Somebody has to be the villain. Might as well be the fun one {e:devil}" }]),
  ],
  'game.name.reply.funny': [
    e('game.name.reply.funny.01', [{ by: 'a', send: "I'm offended and also you're all right {e:laugh}" }]),
    e('game.name.reply.funny.02', [{ by: 'a', react: "Why is everybody saying me?", send: "Okay rude. Accurate but rude" }]),
    e('game.name.reply.funny.03', [{ by: 'a', send: "I can't even argue with this lol" }]),
    e('game.name.reply.funny.04', [{ by: 'a', react: "Ha! Okay, fine. That's me.", send: "Guilty {e:laugh}" }]),
  ],
  'game.name.hurt': [
    e('game.name.hurt.01', [{ by: 'a', say: "Everybody kept saying my name for the bad ones. That's a message." }]),
    e('game.name.hurt.02', [{ by: 'a', say: "So that's what they really think of me. Okay. Good to know." }], { beat: '{a} sits in silence for a while.' }),
    e('game.name.hurt.03', [{ by: 'a', say: "I laughed it off in the chat. I'm not laughing now." }]),
    e('game.name.hurt.04', [{ by: 'a', say: "{n} times. My name came up {n} times. I have work to do." }]),
  ],
  'game.name.proud': [
    e('game.name.proud.01', [{ by: 'a', say: "People actually see me in here. That feels good." }]),
    e('game.name.proud.02', [{ by: 'a', say: "My name kept coming up for the good stuff. I'll take it." }], { beat: '{a} does a little dance by the couch.' }),
    e('game.name.proud.03', [{ by: 'a', say: "That was fun. And it tells me who my people are." }]),
    e('game.name.proud.04', [{ by: 'a', say: "Being the favorite is great. Until the Ratings. Then it's a target." }]),
  ],

  // ── name, per prompt: the named player's reply ─────────────────────────
  'g.most-likely.zombie.reply.funny': [
    e('g.most-likely.zombie.reply.funny.01', [{ by: 'a', react: "Die in a zombie apocalypse? I would fight!", send: "I would at least throw a hair dryer at them" }]),
    e('g.most-likely.zombie.reply.funny.02', [{ by: 'a', send: "Okay I'd walk straight up to them and die. Fair {e:laugh}" }]),
  ],
  'g.most-likely.president.reply.good': [
    e('g.most-likely.president.reply.good.01', [{ by: 'a', react: "President? Me? Come on, guys.", send: "If I'm President, you're all in my cabinet {e:crown}" }]),
    e('g.most-likely.president.reply.good.02', [{ by: 'a', send: "Fun fact: I was class president. Twice. So you're not wrong" }]),
  ],
  'g.most-likely.friends.reply.good': [
    e('g.most-likely.friends.reply.good.01', [{ by: 'a', react: "Oh, that one got me.", send: "It's true. I hold on to friends for life. Love you guys {e:heart}" }]),
    e('g.most-likely.friends.reply.good.02', [{ by: 'a', send: "Group trip when we're out. I'm serious" }]),
  ],
  'g.most-likely.two-faced.reply.bad': [
    e('g.most-likely.two-faced.reply.bad.01', [{ by: 'a', react: "Two-faced? I have one face. It's right there on my profile.", send: "One face. Promise" }]),
    e('g.most-likely.two-faced.reply.bad.02', [{ by: 'a', send: "Okay whoever said that, come talk to me. Privately" }]),
  ],
  'g.most-likely.famous.reply.good': [
    e('g.most-likely.famous.reply.good.01', [{ by: 'a', send: "Remember this moment when I'm famous {e:sparkle}" }]),
    e('g.most-likely.famous.reply.good.02', [{ by: 'a', react: "Famous? I'm manifesting it.", send: "Speak it into existence lol" }]),
  ],
  'g.most-likely.reality.reply.funny': [
    e('g.most-likely.reality.reply.funny.01', [{ by: 'a', send: "Umm we're literally on one right now {e:laugh}" }]),
    e('g.most-likely.reality.reply.funny.02', [{ by: 'a', react: "Another one? I'm still recovering from this one." }]),
  ],
  'g.circle-scenarios.love.reply.good': [
    e('g.circle-scenarios.love.reply.good.01', [{ by: 'a', send: "Guilty. I fall in love with everybody {e:hearteyes}" }]),
    e('g.circle-scenarios.love.reply.good.02', [{ by: 'a', react: "They're not wrong.", send: "Hopeless romantic, reporting for duty" }]),
  ],
  'g.circle-scenarios.ghost.reply.bad': [
    e('g.circle-scenarios.ghost.reply.bad.01', [{ by: 'a', send: "I have never ghosted anybody in my life. Allegedly" }]),
    e('g.circle-scenarios.ghost.reply.bad.02', [{ by: 'a', react: "Me? I reply to everybody!" }]),
  ],
  'g.circle-scenarios.win.reply.good': [
    e('g.circle-scenarios.win.reply.good.01', [{ by: 'a', react: "Most likely to win? No. No, no. Don't put that on me.", send: "Please stop saying that lol" }]),
    e('g.circle-scenarios.win.reply.good.02', [{ by: 'a', say: "That's not a compliment. That's a target." }]),
  ],
  'g.circle-scenarios.lie.reply.bad': [
    e('g.circle-scenarios.lie.reply.bad.01', [{ by: 'a', send: "Lie to your face? I don't even lie about my age" }]),
    e('g.circle-scenarios.lie.reply.bad.02', [{ by: 'a', react: "Wow. They think I'm a liar." }], { beat: '{a} goes quiet and opens a private chat.' }),
  ],
  'g.circle-scenarios.late.reply.funny': [
    e('g.circle-scenarios.late.reply.funny.01', [{ by: 'a', send: "Late to my own wedding? I'd be late to my own birth if I could lol" }]),
    e('g.circle-scenarios.late.reply.funny.02', [{ by: 'a', react: "Okay, that's fair. That's very fair." }]),
  ],
  'g.circle-scenarios.secret.reply.good': [
    e('g.circle-scenarios.secret.reply.good.01', [{ by: 'a', send: "Your secrets are safe with me. Always {e:pray}" }]),
    e('g.circle-scenarios.secret.reply.good.02', [{ by: 'a', react: "They trust me. That means everything." }]),
  ],
  'g.yearbook.hottie.reply.good': [
    e('g.yearbook.hottie.reply.good.01', [{ by: 'a', send: "Class Hottie?? I'm printing this and framing it {e:fire}" }]),
    e('g.yearbook.hottie.reply.good.02', [{ by: 'a', react: "Class Hottie! Tell my high school self." }]),
  ],
  'g.yearbook.mvp.reply.good': [
    e('g.yearbook.mvp.reply.good.01', [{ by: 'a', send: "MVP! I'd like to thank everyone who put up with me {e:crown}" }]),
    e('g.yearbook.mvp.reply.good.02', [{ by: 'a', say: "MVP. Everybody sees me as the one to beat now. Great." }]),
  ],
  'g.yearbook.clown.reply.funny': [
    e('g.yearbook.clown.reply.funny.01', [{ by: 'a', send: "Class Clown is the most important job in the Circle and I accept {e:laugh}" }]),
    e('g.yearbook.clown.reply.funny.02', [{ by: 'a', react: "Class Clown. My mom would be so proud." }]),
  ],
  'g.yearbook.drama.reply.bad': [
    e('g.yearbook.drama.reply.bad.01', [{ by: 'a', send: "Most dramatic?? That's so dramatic of you all" }]),
    e('g.yearbook.drama.reply.bad.02', [{ by: 'a', react: "I am not dramatic! I'm passionate. There's a difference!" }]),
  ],
  'g.yearbook.flirt.reply.funny': [
    e('g.yearbook.flirt.reply.funny.01', [{ by: 'a', send: "Biggest Flirt? I'm just friendly {e:wink}" }]),
    e('g.yearbook.flirt.reply.funny.02', [{ by: 'a', react: "Can't argue. Won't argue." }]),
  ],
  'g.yearbook.snake.reply.bad': [
    e('g.yearbook.snake.reply.bad.01', [{ by: 'a', send: "Most likely to stab you in the back? I've never stabbed anybody in my life lol" }]),
    e('g.yearbook.snake.reply.bad.02', [{ by: 'a', react: "A snake? Me?" }], { beat: '{a} stares at the result for a long time.' }),
  ],
  'g.circle-awards.sexiest.reply.good': [
    e('g.circle-awards.sexiest.reply.good.01', [{ by: 'a', send: "I'd like to thank my mom, my dad and my good lighting {e:fire}" }]),
    e('g.circle-awards.sexiest.reply.good.02', [{ by: 'a', react: "Sexiest Player! Somebody hand me a microphone." }]),
  ],
  'g.circle-awards.funniest.reply.funny': [
    e('g.circle-awards.funniest.reply.funny.01', [{ by: 'a', send: "Funniest Player?? I'd like to thank my trauma {e:laugh}" }]),
    e('g.circle-awards.funniest.reply.funny.02', [{ by: 'a', react: "I'll take funniest. Funny people last." }]),
  ],
  'g.circle-awards.shady.reply.bad': [
    e('g.circle-awards.shady.reply.bad.01', [{ by: 'a', send: "Shadiest?? I'm not shady, I'm observant" }]),
    e('g.circle-awards.shady.reply.bad.02', [{ by: 'a', react: "Shadiest. Wow. Okay. I'm keeping the trophy." }]),
  ],
  'g.circle-awards.loyal.reply.good': [
    e('g.circle-awards.loyal.reply.good.01', [{ by: 'a', send: "Most Loyal means the most to me out of all of these. Thank you {e:heart}" }]),
    e('g.circle-awards.loyal.reply.good.02', [{ by: 'a', react: "Most Loyal. That's the one I wanted." }]),
  ],
  'g.circle-awards.messiest.reply.bad': [
    e('g.circle-awards.messiest.reply.bad.01', [{ by: 'a', send: "Messiest? I'm organized chaos {e:laugh}" }]),
    e('g.circle-awards.messiest.reply.bad.02', [{ by: 'a', react: "Messiest. They're not wrong about my kitchen." }]),
  ],
  'g.circle-awards.mvp.reply.good': [
    e('g.circle-awards.mvp.reply.good.01', [{ by: 'a', send: "Best game?? Stop. I'm just trying to survive in here" }]),
    e('g.circle-awards.mvp.reply.good.02', [{ by: 'a', say: "Best Game Player. That award is a target on my back." }]),
  ],
  'g.giving-awards.main.reply.funny': [
    e('g.giving-awards.main.reply.funny.01', [{ by: 'a', send: "Take over every conversation? That's not true, let me explain for twenty minutes" }]),
    e('g.giving-awards.main.reply.funny.02', [{ by: 'a', react: "Okay, that one's a little true." }]),
  ],
  'g.giving-awards.realest.reply.good': [
    e('g.giving-awards.realest.reply.good.01', [{ by: 'a', send: "Realest Player means everything to me. I've been me since day one {e:heart}" }]),
    e('g.giving-awards.realest.reply.good.02', [{ by: 'a', react: "The realest. In a place full of catfish. I'll take it." }]),
  ],
  'g.giving-awards.fake.reply.bad': [
    e('g.giving-awards.fake.reply.bad.01', [{ by: 'a', send: "Most fake? Come meet me and say that {e:side}" }]),
    e('g.giving-awards.fake.reply.bad.02', [{ by: 'a', react: "Fake? They think I'm fake?" }], { beat: '{a} gets up and walks a slow lap around the apartment.' }),
  ],
  'g.giving-awards.glow.reply.good': [
    e('g.giving-awards.glow.reply.good.01', [{ by: 'a', send: "Glow-up of the season! Thank you, thank you {e:sparkle}" }]),
    e('g.giving-awards.glow.reply.good.02', [{ by: 'a', react: "Biggest glow-up. I was glowing the whole time, but okay." }]),
  ],
  'g.giving-awards.villain.reply.bad': [
    e('g.giving-awards.villain.reply.bad.01', [{ by: 'a', send: "Villain? Every good story needs one {e:devil}" }]),
    e('g.giving-awards.villain.reply.bad.02', [{ by: 'a', react: "The villain. Me. I'm the nicest person in here!" }]),
  ],
  'g.make-out-marry.make-out.reply.good': [
    e('g.make-out-marry.make-out.reply.good.01', [{ by: 'a', send: "Who picked me to make out with?? Come forward {e:wink}" }]),
    e('g.make-out-marry.make-out.reply.good.02', [{ by: 'a', react: "Somebody wants to make out with me. The day is looking up." }]),
  ],
  'g.make-out-marry.marry.reply.good': [
    e('g.make-out-marry.marry.reply.good.01', [{ by: 'a', send: "Marry?? Okay, I'm wife material and husband material. Both {e:ring}".replace(' {e:ring}', ' {e:heart}') }]),
    e('g.make-out-marry.marry.reply.good.02', [{ by: 'a', react: "Somebody wants to marry me. I'm crying." }]),
  ],
  'g.make-out-marry.murder.reply.bad': [
    e('g.make-out-marry.murder.reply.bad.01', [{ by: 'a', send: "Who picked me for the last one?? I'm sleeping with one eye open" }]),
    e('g.make-out-marry.murder.reply.bad.02', [{ by: 'a', react: "Somebody picked me to go. I need names." }]),
  ],
  'g.make-out-marry.friend.reply.good': [
    e('g.make-out-marry.friend.reply.good.01', [{ by: 'a', send: "Friend forever? That's the best one honestly {e:hug}" }]),
    e('g.make-out-marry.friend.reply.good.02', [{ by: 'a', react: "A friend forever. That one actually got me." }]),
  ],
  'g.naughty-nice.naughtiest.reply.funny': [
    e('g.naughty-nice.naughtiest.reply.funny.01', [{ by: 'a', send: "The naughtiest? I'm an angel with a little bit of devil {e:devil}" }]),
    e('g.naughty-nice.naughtiest.reply.funny.02', [{ by: 'a', react: "Naughtiest! That photo did its job." }]),
  ],
  'g.naughty-nice.nicest.reply.good': [
    e('g.naughty-nice.nicest.reply.good.01', [{ by: 'a', send: "Nicest! My mom is so proud right now {e:halo}" }]),
    e('g.naughty-nice.nicest.reply.good.02', [{ by: 'a', react: "The nicest. Somebody tell the Ratings." }]),
  ],
  'g.naughty-nice.secret-naughty.reply.bad': [
    e('g.naughty-nice.secret-naughty.reply.bad.01', [{ by: 'a', send: "Secretly naughty?? There's no secret, I'm right here lol" }]),
    e('g.naughty-nice.secret-naughty.reply.bad.02', [{ by: 'a', react: "Secretly? What do they think I'm hiding?" }]),
  ],
  'g.naughty-nice.angel.reply.good': [
    e('g.naughty-nice.angel.reply.good.01', [{ by: 'a', send: "An angel?? You all need to meet me in real life lol" }]),
    e('g.naughty-nice.angel.reply.good.02', [{ by: 'a', react: "An angel. Okay. I'll try to live up to it." }]),
  ],
  'g.wild-cards.tea.reply.bad': [
    e('g.wild-cards.tea.reply.bad.01', [{ by: 'a', send: "Tea spiller? I just share information. Freely. Constantly" }]),
    e('g.wild-cards.tea.reply.bad.02', [{ by: 'a', react: "The tea spiller. Now nobody's gonna tell me anything." }]),
  ],
  'g.wild-cards.gentle-catfish.reply.bad': [
    e('g.wild-cards.gentle-catfish.reply.bad.01', [{ by: 'a', send: "Gentle catfish?? I'm not a catfish, gentle or otherwise" }]),
    e('g.wild-cards.gentle-catfish.reply.bad.02', [{ by: 'a', react: "They think I'm a catfish. A gentle one, but still." }], { beat: '{a} opens the profile page and looks at it for a long time.' }),
  ],
  'g.wild-cards.mom.reply.good': [
    e('g.wild-cards.mom.reply.good.01', [{ by: 'a', send: "Circle Mom! Everybody come get a hug {e:hug}" }]),
    e('g.wild-cards.mom.reply.good.02', [{ by: 'a', react: "The Circle Mom. I'll take that title with pride." }]),
  ],
  'g.wild-cards.hopeless.reply.funny': [
    e('g.wild-cards.hopeless.reply.funny.01', [{ by: 'a', send: "Hopeless romantic, guilty, next question {e:hearteyes}" }]),
    e('g.wild-cards.hopeless.reply.funny.02', [{ by: 'a', react: "They know me too well." }]),
  ],
  'g.wild-cards.mastermind.reply.bad': [
    e('g.wild-cards.mastermind.reply.bad.01', [{ by: 'a', send: "Mastermind? I can barely master my microwave" }]),
    e('g.wild-cards.mastermind.reply.bad.02', [{ by: 'a', say: "The Mastermind card. That's the card that gets you blocked." }]),
  ],
};
