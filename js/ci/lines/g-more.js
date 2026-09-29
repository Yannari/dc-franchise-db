// More lines for the game beats that happen up to eight times in one game
// (Plan 3a+): a namer's reason, a comment on a piece, a reaction to an
// answer, a fact owned up to. A game must never say the same line twice.
// Data only; merged into the family pools by lines/index.js.
const E = (key, start, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(start + i).padStart(2, '0')}`, ...x })) });
const s1 = (a, extra = {}) => ({ turns: [{ by: 'a', say: a }], ...extra });
const r1 = (a, extra = {}) => ({ turns: [{ by: 'a', react: a }], ...extra });
const ab = (a, b, extra = {}) => ({ turns: [{ by: 'a', react: a }, { by: 'b', react: b }], ...extra });

export const G_MORE = {
  ...E('game.name.namer', 9, [
    s1("{b}. I'm not even gonna explain that one."),
    s1("Everybody knows it's {b}. I'm just saying it first."),
    s1("I'm putting {b}. I hope {b} laughs."),
    s1("{b}. That's my gut, and my gut is right."),
    s1("It's between two people. I'm going {b}."),
    s1("Circle, put {b}. Next question."),
    s1("{b}, obviously. Have you met {b}?"),
    s1("I'll say {b}, and I'll stand by it."),
  ]),
  ...E('game.make.comment', 12, [
    r1("{b} made that? I didn't know {b} had it in {b.obj}."),
    r1("Okay, {b}'s is growing on me."),
    r1("I need to know what {b} was going for."),
    r1("That's so {b}. That's the most {b} thing I've ever seen."),
    r1("Circle, zoom in on {b}'s. Zoom in more."),
    r1("{b} did not follow the instructions. I respect it."),
    r1("I'm laughing so hard at {b}'s. I can't stop."),
    r1("If {b} wins with that, I'm quitting the Circle."),
  ]),
  ...E('game.ask.react', 10, [
    r1("That answer is going to be a whole conversation later."),
    r1("{b} kept it short. Short is smart. Or short is hiding something."),
    r1("I would not have answered that. {b} is brave."),
    r1("Ooh. That was honest."),
    r1("Everybody's reading that right now. Everybody."),
    r1("{b}, why would you say that out loud?"),
    r1("That's the most I've ever learned about {b}."),
    r1("Okay. I believe {b}. I think."),
  ]),
  ...E('game.ask.friendly', 9, [
    { turns: [{ by: 'a', send: "What's your comfort movie?" }, { by: 'b', send: "Anything animated. I cry every time lol" }] },
    { turns: [{ by: 'a', send: "What's the nicest thing a stranger ever did for you?" }, { by: 'b', react: "Oh, I have a story.", send: "Paid for my groceries when my card got declined. I think about it all the time" }] },
    { turns: [{ by: 'a', send: "Who do you call first when something good happens?" }, { by: 'b', send: "My best friend. Every single time {e:heart}" }] },
    { turns: [{ by: 'a', send: "What would you name a dog?" }, { by: 'b', react: "Finally, the important questions.", send: "Biscuit. Obviously" }] },
    { turns: [{ by: 'a', send: "What's a skill you wish you had?" }, { by: 'b', send: "Singing. I'm terrible and I don't care lol" }] },
  ]),
  ...E('game.ask.barbed', 7, [
    { turns: [{ by: 'a', send: "Why are you always the first one to agree with everybody?" }, { by: 'b', react: "Wow. Okay.", send: "Because I'm agreeable? Is that a crime now" }] },
    { turns: [{ by: 'a', send: "Is your personality in here the same as at home, or is this a character?" }, { by: 'b', send: "It's me. All of it. Sorry if that's too much for you" }] },
  ]),
  ...E('game.ask.catfish.pass', 5, [
    { turns: [{ by: 'a', send: "What's your go-to order at your favorite restaurant?" }, { by: 'b', send: "Spicy chicken sandwich, extra pickles, and a lemonade. Every time" }, { by: 'a', react: "Extra pickles. That's a real person." }] },
  ]),
  ...E('game.ask.catfish.dodge', 5, [
    { turns: [{ by: 'a', send: "What's the last thing you bought for yourself?" }, { by: 'b', send: "Lol I don't really shop much. Next question!" }, { by: 'a', react: "Everybody shops. Everybody." }] },
  ]),
  ...E('game.ask.catfish.fail', 6, [
    { turns: [{ by: 'a', send: "What's your favorite thing about your job?" }, { by: 'b', react: "Which job did I say I had?", send: "Um, the people? Definitely the people" }, { by: 'a', react: "That's the answer you give when you don't know your own job." }] },
  ]),

  ...E('game.guess.fact', 6, [
    r1("'{x}' That has to be a joke. That can't be real."),
    r1("'{x}' I love whoever wrote that."),
    r1("'{x}' That's either the most honest person in here or the biggest liar."),
    r1("'{x}' I have three guesses, and they're all wrong."),
    r1("'{x}' Who? Who is this?"),
    r1("'{x}' Oh, I know exactly who that is. I think."),
  ]),
  ...E('game.guess.guessed.right', 5, [
    s1("{b}. It sounds exactly like something {b} would say."),
    s1("I'm going with {b}. {b} told me something like that once."),
    s1("That's {b}. I'd bet my apartment on it."),
    s1("Circle, {b}. And I'm not changing it."),
    s1("It's {b}. Nobody else in here would write that."),
    s1("{b}. That's too specific to be anybody else."),
  ]),
  ...E('game.guess.guessed.wrong', 5, [
    s1("I'm stumped. I'll just pick a name."),
    s1("I'm guessing the person I think is most likely. I'm probably wrong."),
    s1("This is so hard. Everybody could have written that."),
    s1("I thought I knew everybody by now. I don't."),
    s1("Wrong. I'm wrong. I can feel myself being wrong."),
    s1("Circle, I'm guessing. Just guessing. No idea."),
  ]),
  ...E('game.guess.owner', 7, [
    r1("That's mine, and I regret nothing."),
    r1("Guilty. That was me."),
    r1("They finally know something real about me."),
    r1("Surprise! It was me all along."),
    r1("Yep. Me. Moving on."),
    r1("That's me, and I'm a little embarrassed now."),
  ]),

  ...E('game.team.banter', 8, [
    r1("How are they doing this? How?"),
    r1("That one was mine. That was my question!"),
    r1("They're cheating. They're not cheating. But they might be."),
    r1("Okay, I'm nervous now."),
    r1("We're still in this. We're still in this!"),
    r1("Somebody on my team knows this. Somebody. Please."),
  ]),
  ...E('game.team.question.right', 5, [
    { turns: [{ by: 'a', react: "'{q}' {x}. I knew that when I was eight." }, { by: 'b', react: "That's why you were picked! {n}!" }] },
    { turns: [{ by: 'a', react: "'{q}' Oh, oh! {x}!" }, { by: 'b', react: "Right! {n}! Keep going!" }] },
    { turns: [{ by: 'a', react: "'{q}' {x}, final answer." }, { by: 'b', react: "Correct! We're at {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' I got this. {x}." }], beat: '{a} spins around in the chair after it goes green.' },
    { turns: [{ by: 'a', react: "'{q}' Easy money. {x}." }, { by: 'b', react: "Easy money! {n}!" }] },
  ]),
  ...E('game.team.question.wrong', 5, [
    { turns: [{ by: 'a', react: "'{q}' Uh. {x}?" }, { by: 'b', react: "Close. Not close. {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' {x}. It's {x}. It has to be." }, { by: 'b', react: "It didn't have to be. {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' I panicked. {x}." }, { by: 'b', react: "It's fine. It's fine. {n}. It's fine." }] },
    { turns: [{ by: 'a', react: "'{q}' {x}!" }, { by: 'b', react: "Nooo. {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' Oh, I should know this. {x}?" }], beat: 'It is the wrong answer.' },
  ]),
  ...E('game.team.scout.want', 5, [
    s1("{b}'s profile says 'always learning.' I like always learning."),
    s1("{b}. Smart eyes. I want smart eyes."),
  ]),
  ...E('game.team.scout.pass', 5, [
    s1("{b} seems sweet. Sweet doesn't know trivia."),
    s1("{b}'s profile is all selfies. Pass. For now."),
  ]),

  ...E('game.make.kind', 5, [
    ab("I made it for {b}. With love.", "Somebody made me look good. I owe somebody."),
    ab("{b} deserves to see how everybody sees {b}.", "That's how people see me? Aw."),
    ab("Nothing but good things for {b}.", "Okay, I'm emotional now."),
    ab("I kept it kind. {b} has been kind to me.", "That was so nice. Whoever did this, thank you."),
  ]),
  ...E('game.make.jab', 5, [
    ab("I'm not gonna lie about how I see {b}.", "Oh. Oh, okay. So that's how it is."),
    ab("It's honest. Honest isn't always nice.", "Somebody in here really doesn't like me."),
  ]),
  ...E('game.make.item', 5, [
    ab("I call it: my best effort.", "Your best effort, {a}? Oh no."),
    ab("Don't laugh. You're laughing. Everybody's laughing.", "I'm not laughing. I'm crying laughing."),
    ab("It's rustic. It's a style.", "It's a style, {a}. Sure."),
    ab("I'm proud of it. Nobody else has to be.", "I'm a little proud of you, {a}."),
  ]),

  ...E('game.flirt.round', 5, [
    { turns: [{ by: 'a', say: "Go big.", send: "{b}, if you were a vegetable you'd be a cute-cumber {e:wink}" }, { by: 'b', react: "Oh no. Oh no, that's terrible." }] },
    { turns: [{ by: 'a', send: "{b}, do you have a map? I keep getting lost in your profile picture" }, { by: 'b', react: "A map. {a} said a map. Okay." }] },
    { turns: [{ by: 'a', send: "{b}, are you tired? You've been running through my messages all day {e:hearteyes}" }, { by: 'b', react: "Ha! Classic. Terrible. Classic." }] },
    { turns: [{ by: 'a', say: "Keep it simple. Keep it cute.", send: "{b}, you had me at 'Hey'" }, { by: 'b', react: "Aw. That's actually kind of sweet." }] },
    { turns: [{ by: 'a', send: "{b}, I'd swipe right on you in every app, and I don't even have my phone" }, { by: 'b', react: "Okay, {a}, that one's good." }] },
    { turns: [{ by: 'a', send: "{b}, are you the Circle? Because I can't stop talking about you" }, { by: 'b', react: "Did {a} just flirt with me using the Circle?" }] },
  ]),
  ...E('game.flirt.answer', 5, [
    { turns: [{ by: 'a', send: "Only if you're the answer {e:wink}" }] },
    { turns: [{ by: 'a', react: "Two can play that game.", send: "Are you a magician? Because every time I read your messages, everyone else disappears" }] },
    { turns: [{ by: 'a', send: "Took you long enough {e:kiss}" }] },
  ]),
  ...E('game.flirt.react', 4, [
    s1("{b} and {c} have chemistry. Even through a screen."),
    s1("That was cringe. That was cute. That was cringe-cute."),
    s1("I need {b} to stop. I need {b} to never stop."),
    { turns: [{ by: 'a', say: "{b} went for {c}? Interesting. Very interesting." }] },
    { turns: [{ by: 'a', say: "That line was so bad I had to read it twice." }] },
    { turns: [{ by: 'a', say: "{b} is shameless. I love it." }] },
    { turns: [{ by: 'a', say: "Poor {c}. Or lucky {c}. One of the two." }] },
    { turns: [{ by: 'a', say: "Wait, {b} likes {c}? Since when?" }] },
    { turns: [{ by: 'a', say: "I'm screaming. {b} really sent that to {c}." }] },
    { turns: [{ by: 'a', say: "If {c} says yes to that, I'm out of the Circle." }] },
    { turns: [{ by: 'a', say: "Okay, {b} has game. Terrible game, but game." }] },
    { turns: [{ by: 'a', say: "Everybody's flirting except me. Great." }] },
    { turns: [{ by: 'a', say: "{b} and {c}. I'm calling it now." }] },
    { turns: [{ by: 'a', say: "Where do people get these lines?" }] },
  ]),
  ...E('game.rival.round', 6, [
    { turns: [{ by: 'a', send: "My biggest rival is {b}. We want the same things in here. Only one of us gets them" }, { by: 'b', react: "Fair. Terrifying, but fair." }] },
    { turns: [{ by: 'a', send: "{b}. You're sweet, but you're a threat, and I see it" }, { by: 'b', react: "A threat? Me? I'll take that." }] },
    { turns: [{ by: 'a', say: "Say it with love.", send: "{b}, you're my rival because you're the best at this. I'm just better {e:side}" }, { by: 'b', react: "Oh, it's on, {a}." }] },
    { turns: [{ by: 'a', send: "It's {b}. I've been watching {b} play from day one" }, { by: 'b', react: "Watching me? Okay, that's creepy and flattering." }] },
  ]),
  ...E('game.rival.reply', 5, [
    s1("{b} thinks I'm a threat? Good. {b} should."),
    s1("{b} named me. I'm going to be extra nice to {b} now. Extra, extra nice."),
    s1("I knew {b} would say me. I just didn't think {b} would say it out loud."),
    s1("Okay, {b}. You want a rival? You've got one."),
    s1("It stings a little, coming from {b}. I thought we were good."),
  ]),
  ...E('game.gift.thanks', 4, [
    { turns: [{ by: 'a', react: "A gift from {b}! Oh, I love {b}.", send: "{b} you made my whole day {e:heart}" }] },
    { turns: [{ by: 'a', send: "Thank-you note for {b}: you're a real one {e:crown}" }] },
    { turns: [{ by: 'a', react: "{b} picked me. {b} actually picked me.", send: "Thank you {b}. I won't forget it" }] },
  ]),
  ...E('game.gift.round', 5, [
    { turns: [{ by: 'a', say: "This is for {b}. {b} knows why." }, { by: 'b', react: "From {a}? Oh, {a}!" }] },
    { turns: [{ by: 'a', say: "My pick is {b}. Let everybody see it." }, { by: 'b', react: "{a} picked me in front of everybody!" }] },
    { turns: [{ by: 'a', say: "{b}. No hesitation." }, { by: 'b', react: "Wait, me? Thank you, {a}!" }] },
    { turns: [{ by: 'a', say: "It's going to {b}. {b} has been there for me." }, { by: 'b', react: "Aw, {a}. That's so sweet." }] },
  ]),
  ...E('game.flirt.vote', 4, [
    s1("{b}'s line was the worst, and that's why it's the best."),
    s1("My vote goes to {b}. I laughed out loud."),
    s1("{b}. I'm not even embarrassed to say it."),
  ]),
};
