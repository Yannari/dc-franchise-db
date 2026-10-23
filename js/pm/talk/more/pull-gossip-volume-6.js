// pm/talk/more/pull-gossip-volume-6.js — round nine for the pull, gossip's
// telling, the argument's first words and the pile-in's landing (the user,
// 2026-10-22: "address the repeats by increasing the volume of the dialogue
// ALOT"). The pull's turn and close were drawn 214 times a season each;
// gossip's telling splits by what the secret was, so each kind of secret had
// five or six; every argument cause had three to five openers. Same gates as
// each kind's own file: a pull's turn and close are the engine's `end`; a
// telling names exactly its secret (`sec`), {x} only behind `hasWith`; a row
// names its cause, {about} only for jealous, envy, rival, stole and told.
const R = (...turns) => ({ turns });
const W = (when, ...turns) => ({ when, turns });
const S = (when, stage, ...turns) => ({ when, stage, turns });
const BW = (when, beat) => ({ when, turns: [], beat });
const BEAT = beat => ({ turns: [], beat });
const LANDS = ['flirt', 'kissed', 'promised'];

export const PULL_VOLUME_6 = {
  moves: {
    turn: [
      W({ end: 'flirt' }, ['b', "You're trouble, you know that?"], ['a', "The good kind, though."], ['b', "I haven't decided yet."]),
      W({ end: 'flirt' }, ['a', "Can we do this again tomorrow?"], ['b', "We can do this again in an hour, if you like."]),
      W({ end: 'flirt' }, ['b', "I've just realised I've been smiling this whole time."], ['a', "I noticed. I wasn't going to say."]),
      W({ end: 'flirt' }, ['a', "I didn't think you'd say yes to a chat."], ['b', "I didn't think you'd ask. We're both full of surprises."]),
      W({ end: 'flirt' }, ['b', "I'm going to be thinking about this all night."], ['a', "Good. That's the idea."]),
      W({ end: 'flirt' }, ['a', "Is it just me, or did that go really well?"], ['b', "It's not just you."]),
      W({ end: 'flirt' }, ['b', "You're easy to talk to. Dangerously easy."], ['a', "Dangerous is fine. I like dangerous."]),
      W({ end: 'flirt' }, ['a', "Can I steal you for dinner later?"], ['b', "You can try."]),
      W({ end: 'flirt' }, ['b', "We should probably go back before people start talking."], ['a', "They're already talking."], ['b', "Then let's give them something to talk about."]),
      W({ end: 'flirt' }, ['a', "I'm glad I came and found you."], ['b', "So am I. Don't let it go to your head."]),
      W({ end: 'flirt' }, ['b', "You've got a really nice laugh."], ['a', "You've heard it a lot today."], ['b', "I'm not complaining."]),
      W({ end: 'flirt' }, ['a', "On a scale of one to ten, how much did you enjoy that?"], ['b', "Seven."], ['a', "Seven?"], ['b', "Eight. Don't push it."]),
      W({ end: 'kissed' }, ['b', "Come here."], ['a', "Why?"], ['b', "You know why."]),
      W({ end: 'kissed' }, ['a', "I really want to kiss you right now."], ['b', "Then what are you waiting for?"]),
      { when: { end: 'kissed' }, turns: [['b', "Stop talking for a second."]], beat: "{b} leans in, and {a} stops talking." },
      { when: { end: 'kissed' }, turns: [], beat: "{a} reaches up, tucks {b}'s hair back, and kisses {b.obj}." },
      W({ end: 'promised', taken: true }, ['a', "I can't do anything about this yet. But I'm not going to forget this chat."], ['b', "Neither am I."]),
      W({ end: 'promised', taken: true }, ['b', "What happens now?"], ['a', "Now I have to work out what I'm going to do. Give me a few days."]),
      W({ end: 'turned-down' }, ['b', "I'm really flattered. I just don't feel it. I'm sorry."], ['a', "Don't be. At least I asked."]),
      W({ end: 'turned-down' }, ['b', "I think you're great. I don't think you're great for me."], ['a', "That's a very nice way of saying no."]),
      W({ end: 'turned-down' }, ['b', "I don't want to lead you on. So I'm going to be really clear. It's a no."], ['a', "Clear. Got it."]),
      W({ end: 'turned-down' }, ['b', "I'm sorry. My head's somewhere else."], ['a', "I thought it might be."]),
    ],
    close: [
      BW({ end: 'flirt' }, "{a} walks back to the daybeds with a grin {a} can't get rid of."),
      BW({ end: 'flirt' }, "{b} looks back over {b.posAdj} shoulder, twice."),
      W({ end: 'flirt' }, ['a', "Same time tomorrow?"], ['b', "Earlier. Same place."]),
      BW({ end: 'flirt' }, "Somebody on the lawn starts humming a wedding march. Both of them ignore it."),
      BW({ end: 'flirt' }, "They part at the pool, and both of them are smiling at nothing for the next hour."),
      W({ end: 'flirt' }, ['b', "You're going to get me in trouble."], ['a', "Only a little."]),
      BW({ end: 'flirt' }, "{a} winks. {b} rolls {b.posAdj} eyes, and then smiles anyway."),
      BW({ end: 'flirt' }, "They stand up at the same time, and nearly bump heads, and laugh."),
      W({ end: 'flirt' }, ['a', "I'll find you later."], ['b', "I'll make sure I'm easy to find."]),
      BW({ end: 'flirt' }, "{b} heads off to the kitchen, and {a} watches {b.obj} all the way there."),
      BW({ end: 'flirt' }, "The others are already talking about it before they're back."),
      BW({ end: 'flirt' }, "{a} sits down next to a friend, who just raises an eyebrow and says nothing."),
      BW({ end: 'kissed' }, "They come back holding hands, and somebody claps."),
      BW({ end: 'kissed' }, "Neither of them can stop smiling for the rest of the afternoon."),
      W({ end: 'kissed' }, ['b', "Well. That happened."], ['a', "It did. Want it to happen again?"]),
      BW({ end: 'promised' }, "They go back separately, with an agreement neither of them says out loud."),
      BW({ end: 'turned-down' }, "{a} walks back, picks up {a.posAdj} drink, and acts like nothing happened. It nearly works."),
      W({ end: 'turned-down' }, ['b', "Friends?"], ['a', "Friends. Give me ten minutes first."]),
      BW({ end: 'turned-down' }, "{a} goes for a swim, a long one."),
      BW({ end: 'turned-down' }, "{b} goes back to the group, and {a} goes the other way."),
    ],
  },
};

export const GOSSIP_TELL_VOLUME_2 = {
  moves: {
    tell: [
      W({ hasWith: false }, ['a', "{c} doesn't talk about you the way you talk about {c}. I've heard it. More than once."]),
      W({ hasWith: false }, ['a', "I think {c} is keeping options open. I'm not saying that to hurt you. I'm saying it because I've seen it."]),
      W({ hasWith: false }, ['a', "Something's going on with {c}. I don't know all of it. I know enough to tell you to ask."]),
      W({ sec: 'pull', hasWith: true }, ['a', "{c} took {x} off for a chat. A long one. And it didn't look like it was about the weather."]),
      W({ sec: 'pull', hasWith: true }, ['a', "I saw {c} with {x} earlier. Just the two of them. Heads together, for ages."]),
      W({ sec: 'pull', hasWith: true }, ['a', "{c} has been finding reasons to talk to {x} all day. I counted. It's a lot of reasons."]),
      W({ sec: 'pull', hasWith: true }, ['a', "{c} and {x} went off on their own, and when they came back, {c} wouldn't look at you."]),
      W({ sec: 'kiss', hasWith: true }, ['a', "{c} kissed {x}. I'm sorry. I saw it with my own eyes."]),
      W({ sec: 'kiss', hasWith: true }, ['a', "I didn't want to believe it either. But {c} and {x} kissed. I was there."]),
      W({ sec: 'kiss', hasWith: true, casa: false }, ['a', "It wasn't a peck. {c} kissed {x}, properly, and then came back and sat next to you."]),
      W({ sec: 'bed', hasWith: true }, ['a', "{c} shared a bed with {x}. They were whispering half the night. I heard them."]),
      W({ sec: 'bed', hasWith: true }, ['a', "When the lights went out, {c} didn't sleep on {c.posAdj} own. {c} was with {x}."]),
      W({ sec: 'promise', hasWith: true }, ['a', "I heard {c} tell {x} that it's {x} {c} really wants. Not you. I'm so sorry."]),
      W({ sec: 'promise', hasWith: true }, ['a', "{c} has been making promises to {x}. Big ones. About the outside."]),
      W({ sec: 'said' }, ['a', "{c} has been telling people you're too keen. That it's too much, too fast."]),
      W({ sec: 'said' }, ['a', "I heard {c} say {c} isn't sure about you. Not in a joking way. In a meaning-it way."]),
      W({ sec: 'said' }, ['a', "{c} said, in front of a few of us, that it's not going anywhere with you. I'm sorry."]),
      W({ casa: true, hasWith: true }, ['a', "While you were away, {c} and {x} got really close. Everyone saw it. Nobody wanted to be the one to say."]),
      W({ casa: true, hasWith: true }, ['a', "The other villa wasn't the only place things happened. Here, {c} spent every day with {x}."]),
    ],
  },
};

export const ARGUMENT_START_VOLUME = {
  moves: {
    start: [
      S({ cause: 'jealous' }, "{a} waits until {b} comes back from the pool, and doesn't wait any longer.", ['a', "You and {about}. Again. All afternoon. Do you know how that looks?"], ['b', "It looks like two people talking."]),
      S({ cause: 'jealous' }, "{a} has been watching from the daybeds, and gets up.", ['a', "Can you explain what that was with {about}? Because I can't."]),
      S({ cause: 'mismatch' }, "{a} sits down next to {b}, and doesn't look at {b.obj}.", ['a', "I need to know if we're on the same page. Because I don't think we are."], ['b', "What does that mean?"]),
      S({ cause: 'mismatch' }, "{a} catches {b} on the terrace.", ['a', "I keep telling you how I feel, and you keep changing the subject. Why?"]),
      S({ cause: 'stress' }, "{b} asks {a} something simple, and {a} snaps.", ['a', "Can you just give me five minutes? Five minutes where nobody needs anything from me?"], ['b', "I only asked if you wanted a drink."]),
      S({ cause: 'stress' }, "{a} has been on edge all day, and {b} gets the worst of it.", ['a', "Not now. Seriously. Not now."], ['b', "I haven't even said anything yet."]),
      S({ cause: 'bicker' }, "{a} and {b} are making the bed, and it goes wrong fast.", ['a', "That's not how you fold a sheet."], ['b', "There's no wrong way to fold a sheet."], ['a', "There is, and you've found it."]),
      S({ cause: 'bicker' }, "{a} and {b} are queueing for the bathroom, and it starts.", ['b', "You always take ages."], ['a', "I take a normal amount of time."], ['b', "You take ages."]),
      S({ cause: 'envy' }, "{a} sits down opposite {b} at lunch, and says it.", ['a', "I just don't get what you see in {about}. Or what {about} sees in you, honestly."]),
      S({ cause: 'envy' }, "{a} catches {b} alone by the pool.", ['a', "You're not even that into {about}. Everyone can see it. So why are you still there?"]),
      S({ cause: 'rival' }, "{a} steps in front of {b} on the way to the kitchen.", ['a', "Leave {about} alone. I mean it."], ['b', "I'm not doing anything."], ['a', "You're doing plenty."]),
      S({ cause: 'rival' }, "{a} has had enough of watching, and goes over.", ['a', "Every time I look up, you're sitting next to {about}. That stops now."]),
      S({ cause: 'stole' }, "{a} finds {b} on the daybeds, with {about} nowhere in sight.", ['a', "I've been waiting to say this. You took {about} from me, and you didn't even look sorry."]),
      S({ cause: 'stole' }, "{a} walks up to {b} at the first chance {a} gets.", ['a', "How's it going with {about}? Because it was going really well with me, until you."]),
      S({ cause: 'voted' }, "{a} doesn't let it go.", ['a', "Out of everyone, you put my name down. Me. Explain that."]),
      S({ cause: 'voted' }, "{a} finds {b} on the terrace.", ['a', "I've been thinking about the fire pit all day. About your vote. Why me?"]),
      S({ cause: 'told' }, "{a} walks straight over to {b}, face like thunder.", ['a', "{about} knows. Everything I told you. How does {about} know, I wonder?"]),
      S({ cause: 'told' }, "{a} sits down hard next to {b}.", ['a', "I trusted you with that. And you took it straight to {about}."]),
      S({ cause: 'clash' }, "It starts over the last cup of tea, and it doesn't stay about tea.", ['a', "Did you seriously just take the last one?"], ['b', "Did you seriously just count?"]),
      S({ cause: 'clash' }, "{a} and {b} are on the same sunbed, by accident, and neither will move.", ['a', "I was here first."], ['b', "You were not."], ['a', "I've been here all afternoon."]),
    ],
  },
};

export const PILE_IN_LAND_VOLUME = {
  moves: {
    land: [
      BEAT("{a} stays standing next to {b}, arms folded, and doesn't move until {c} has gone."),
      BEAT("Somebody says, right, that's enough, and for once, everyone listens."),
      BEAT("{c} storms inside, and the door bangs behind {c.obj}."),
      BEAT("The whole villa is suddenly on one side or the other, and nobody is talking about anything else."),
      BEAT("{b} mouths thank you to {a}, and {a} just nods."),
      BEAT("The row is over, but the sides aren't. They'll last all night."),
    ],
  },
};
