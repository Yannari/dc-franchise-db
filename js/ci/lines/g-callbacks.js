// Games come back (Plan 3a+ Task 10). Data only. A chat between a and b on a
// later day opens with what happened between them in a game ({game}).
// `.mine`: a did it to b. `.theirs`: b did it to a. `rate.callback.*`: a
// ballot cites it (b is the one being rated).
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const ex = (aSay, aSend, bSend, extra = {}) => ({ turns: [
  { by: 'a', ...(aSay ? { say: aSay } : {}), send: aSend }, { by: 'b', send: bSend }], ...extra });

export const G_CALLBACKS = {
  ...E('callback.named-bad.theirs', [
    ex("I'm bringing it up. I have to.", "So... about {game}. You really think that about me?", "Lol it was just a game! Don't read into it"),
    ex(null, "Still thinking about your answer in {game} ngl {e:side}", "Omg I was joking!! You know I love you"),
    ex("Let's see if {b} owns it.", "Can I ask why you said my name in {game}?", "Honestly? Gut feeling. Nothing personal"),
    ex(null, "{game} was rough for me. You said me for the worst one", "I know. I felt bad right after I sent it {e:grimace}"),
  ]),
  ...E('callback.named-bad.mine', [
    ex("I owe {b} an explanation.", "Hey, about {game}. I hope that didn't come off wrong", "It kind of did lol. But thanks for saying something"),
    ex(null, "I felt bad after {game}. It was a joke, I promise", "I figured. We're good {e:handshake}"),
    ex("Clean it up before it becomes a thing.", "You know I only said you in {game} because you can take it, right?", "Lol I can take it. Barely"),
  ]),
  ...E('callback.named-good.theirs', [
    ex(null, "Still smiling about what you said in {game} {e:heart}", "I meant every word!"),
    ex("{b} said something nice about me. I should say thank you.", "Thank you for what you said in {game}. That meant a lot", "Of course. You deserve it"),
    ex(null, "You picked me in {game} and I haven't stopped thinking about it lol", "Because it's true!! {e:hug}"),
  ]),
  ...E('callback.named-good.mine', [
    ex(null, "Did you see I picked you in {game}? {e:smile}", "I saw!! I screamed"),
    ex("Remind {b} who has {b.posAdj} back.", "Just so you know, I meant what I said in {game}", "That means a lot coming from you"),
    ex(null, "You were my easy answer in {game} lol", "Aw. You were mine too"),
  ]),
  ...E('callback.rival.theirs', [
    ex("I'm going to be the bigger person.", "So I'm your biggest rival, huh? {e:eyes}", "Lol it's a compliment! You're good at this"),
    ex(null, "Didn't love being called your rival in {game} not gonna lie", "I get it. It's a game. You'd have said me too"),
    { turns: [{ by: 'a', say: "Let's clear the air.", send: "After {game} I feel like we should talk" }, { by: 'b', send: "Agreed. No hard feelings?" }, { by: 'a', send: "None. Promise {e:handshake}" }] },
    ex(null, "Rival. Me. In front of everybody {e:sweat}", "It's because I respect you!"),
  ]),
  ...E('callback.rival.mine', [
    ex("I named {b}. Now I have to manage it.", "About {game}... you know it's respect, right?", "I know. I'd have said you too honestly"),
    ex(null, "No hard feelings about {game}?", "None. May the best one win {e:handshake}"),
    ex("Keep {b} close.", "Rivals can still be friends right? {e:smile}", "Rivals who talk every day? Sure lol"),
  ]),
  ...E('callback.gift.theirs', [
    ex(null, "Still can't believe you picked me in {game} {e:heart}", "Obviously you. It wasn't even close"),
    ex("{b} picked me. I haven't said thank you properly.", "Thank you again for {game}. You didn't have to", "I wanted to! You're my person in here"),
    ex(null, "Okay I owe you for {game}. Big time", "You don't owe me anything. But I'll take it lol"),
  ]),
  ...E('callback.gift.mine', [
    ex(null, "Did you like what I sent you in {game}? {e:smile}", "Like it?? I loved it"),
    ex("Make sure {b} remembers.", "Everybody saw I picked you in {game}. Just saying {e:wink}", "Everybody saw. And I noticed"),
    ex(null, "I hope {game} made your day", "It made my whole week"),
  ]),
  ...E('callback.picked-last.theirs', [
    ex("Bring it up. Casually.", "So... last pick in {game}. We should talk about that lol", "Omg don't! It was so random I promise"),
    ex(null, "Still recovering from being picked last {e:sweat}", "It wasn't personal! Somebody had to be last"),
    ex(null, "You picked me last in {game}. I'm fine. I'm totally fine", "Lol I'm sorry!! Next time you're first"),
  ]),
  ...E('callback.picked-last.mine', [
    ex("{b} might be mad about {game}.", "Hey, sorry about picking you last. It was a strategy thing", "A strategy that hurt lol. It's okay"),
    ex(null, "You know last pick was nothing personal right?", "I know. I'll get over it. Eventually"),
    ex(null, "I owe you after {game}. I know", "Yeah you do {e:side}"),
  ]),
  ...E('callback.jab.theirs', [
    ex("I figured out who made it. Time to say something.", "I know that was you in {game}. Why?", "It was a joke! Kind of. Mostly"),
    ex(null, "Loved your work in {game}. Really flattering {e:side}", "Lol okay that one was a little mean. My bad"),
    ex("Don't let {b} off the hook.", "So that's how you see me? After {game} I have to ask", "Not really. I was just trying to be funny"),
  ]),
  ...E('callback.jab.mine', [
    ex("I went too far in {game}. I should fix it.", "Hey. About {game}. That was too much, I'm sorry", "Thanks for saying that. It did sting a little"),
    ex(null, "You're not mad about {game} are you? {e:grimace}", "Mad? No. Watching you? Yes"),
    ex(null, "It was just a bit, in {game}. You know that", "Sure. A bit"),
  ]),
  ...E('callback.portrait-kind.theirs', [
    ex(null, "Still looking at what you made of me in {game} {e:heart}", "It was nothing! You made it easy"),
    ex("{b} made me look amazing. I have to say it.", "Thank you for {game}. Nobody's ever done that for me", "You deserved it!"),
    ex(null, "I'm keeping what you made me in {game} forever", "Ha! It's all yours"),
  ]),
  ...E('callback.portrait-kind.mine', [
    ex(null, "Did you like it? From {game}? {e:smile}", "Like it? I loved it!"),
    ex("Make sure {b} knew it was me.", "That was me in {game} by the way {e:wink}", "I knew it! Nobody else is that sweet"),
    ex(null, "I worked hard on yours in {game} lol", "It shows. Thank you"),
  ]),
  ...E('callback.flirted.theirs', [
    ex(null, "So... that pickup line in {game} {e:hearteyes}", "Did it work? Be honest"),
    ex("{b} flirted with me in front of everybody. Now what?", "I can't stop thinking about {game} lol", "Good. That was the plan {e:wink}"),
    ex(null, "Your line in {game} was so bad. I loved it", "Bad and effective. My specialty"),
  ]),
  ...E('callback.flirted.mine', [
    ex(null, "Too much in {game}? {e:sweat}", "Just enough {e:wink}"),
    { turns: [{ by: 'a', say: "Follow up. Don't let it go cold.", send: "I meant every word in {game} by the way" }, { by: 'b', send: "Every word? Even the terrible pun?" }, { by: 'a', send: "Especially the pun {e:laugh}" }] },
    ex(null, "Okay, I owe you a better line than {game}", "I'm waiting {e:eyes}"),
  ]),
  ...E('callback.asked-barbed.theirs', [
    ex("I know it was {b}. Let's see if {b} admits it.", "I know that was you in {game}", "Was it? I'm not saying anything lol"),
    ex(null, "Your question in {game}. Was that necessary?", "It was a real question. I wanted a real answer"),
    ex(null, "You came for me in {game} {e:side}", "I came for everybody lol"),
  ]),
  ...E('callback.asked-barbed.mine', [
    ex("{b} knows it was me. Handle it.", "Okay yes, that was me in {game}. No hard feelings?", "A few hard feelings. But okay"),
    ex(null, "Too far in {game}?", "A little. But I respect the honesty"),
    ex(null, "I asked because I wanted to know. That's all", "Then you know now"),
  ]),
  ...E('callback.asked-catfish.theirs', [
    ex("{b} thinks I'm fake. Let's talk.", "So you asked me that in {game}. Do you think I'm a catfish?", "I just wanted to be sure. You passed lol"),
    ex(null, "Your question in {game} felt like a test {e:detective}", "It was a test. Everybody's getting tested"),
    ex(null, "Did I pass your little quiz in {game}?", "For now {e:eyes}"),
  ]),
  ...E('callback.asked-catfish.mine', [
    ex("Explain it before {b} makes it a thing.", "My question in {game} wasn't an accusation, I promise", "It kind of felt like one lol"),
    ex(null, "You answered so fast in {game}. I believe you now", "Good. Because it's all real"),
    ex(null, "I had to ask. You get it, right?", "I get it. I'd ask me too"),
  ]),

  ...E('rate.callback.bad', [
    { turns: [{ by: 'a', say: "And after what {b} did in {game}? Last place is generous." }] },
    { turns: [{ by: 'a', say: "I haven't forgotten {game}, {b}." }] },
    { turns: [{ by: 'a', say: "{b} came for me in {game}. This is me coming back." }] },
    { turns: [{ by: 'a', say: "You said it in {game}, {b}. Now I'm saying it here." }] },
  ]),
  ...E('rate.callback.good', [
    { turns: [{ by: 'a', say: "And {b} had my back in {game}. That's not nothing." }] },
    { turns: [{ by: 'a', say: "After {game}, it was always going to be {b}." }] },
    { turns: [{ by: 'a', say: "{b} picked me in {game}. I pick {b} now." }] },
  ]),
};
