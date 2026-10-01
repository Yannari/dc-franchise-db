// ══════════════════════════════════════════════════════════════════════
// ci/lines/blocking-build.js — the suspense before the name
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "the blocking should be more suspenseful than that, like
// the message before the blocking should be longer". The show drags it out:
// the Hangout ends with the two of them agreed and the name kept back, and in
// Circle Chat the Influencers type it out a piece at a time, a clue first,
// while every apartment decides it's about them.
//
//   hangout.sealed / .solo.sealed  the Hangout's last word, no name
//   block.build.open(.solo)         the opener in Circle Chat (a: announcer)
//   block.build.clue.<reason>       a clue true to the real reason, no name
//   block.fear.<reason>             a player the clue could fit (a), aloud
//   block.fear.dots                 the one about to be named (a), on the dots
//
// No line here may name anyone: the name lands in block.announce.*.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const send = (t, extra = {}) => ({ turns: [{ by: 'a', send: t }], ...extra });
const say = (t, extra = {}) => ({ turns: [{ by: 'a', say: t }], ...extra });
const react = (t, extra = {}) => ({ turns: [{ by: 'a', react: t }], ...extra });

export const BLOCKING_BUILD = {
  ...E('hangout.sealed', [
    { turns: [{ by: 'a', send: "Okay. So we're agreed?" }, { by: 'b', send: "We're agreed. I hate it, but we're agreed" }], beat: 'Neither of them moves to leave.' },
    { turns: [{ by: 'a', say: "That's it. That's the name." }, { by: 'b', send: "Let's go tell everybody before I change my mind" }] },
    { turns: [{ by: 'a', send: "No going back now" }, { by: 'b', send: "No going back" }], beat: 'They sit with it for a long moment.' },
    { turns: [{ by: 'a', send: "Are we sure?" }, { by: 'b', send: "We're sure. We have to be" }] },
    { turns: [{ by: 'a', react: "Okay. Okay. We did it." }, { by: 'b', react: "I feel sick." }], beat: 'The Hangout goes quiet.' },
    { turns: [{ by: 'a', send: "Same page?" }, { by: 'b', send: "Same page. Let's just get it over with" }] },
  ]),
  ...E('hangout.solo.sealed', [
    say("Okay. I know what I have to do.", { beat: '{a} sits alone with the decision.' }),
    say("That's the name. I'm not going to like typing it."),
    say("Decision made. Now I have to tell everybody."),
    say("I made my choice. Let's hope I can live with it."),
  ]),

  ...E('block.build.open', [
    send("Hey everyone. This was honestly the hardest conversation we've had in here"),
    send("Before we say anything: this was not easy, and it's not personal"),
    send("We talked about every single one of you. For a long time"),
    send("First of all, we love this group. That's what made this so hard"),
    send("Hi Circle. We're not going to drag this out. Okay, maybe a little"),
    send("We went back and forth so many times. But we've made a decision"),
  ]),
  ...E('block.build.open.solo', [
    send("Hey everyone. I'm not going to lie, this was the hardest thing I've done in here"),
    send("I want everybody to know I thought about every single one of you"),
    send("This was all on me, and I took it seriously. I promise"),
    send("Hi Circle. I made a decision, and I'm going to own it"),
    send("I went back and forth all night. But I've decided"),
  ]),

  ...E('block.build.clue.fake', [
    send("The person being blocked is someone who never felt completely real to us"),
    send("This person might be lovely. But something about their profile never added up"),
    send("It's someone whose answers kept changing every time we asked"),
    send("It's someone who, honestly, might not be who they say they are"),
  ]),
  ...E('block.build.clue.threat', [
    send("The person being blocked is playing this game better than any of us"),
    send("This person is loved by everyone in here, and that's exactly the problem"),
    send("It's someone who would be very hard to beat at the end"),
    send("It's someone with more friends in here than anybody"),
  ]),
  ...E('block.build.clue.grudge', [
    send("This one is personal, and we're not going to pretend it isn't"),
    send("The person being blocked knows exactly what they did"),
    send("It's someone who came after one of us. And it didn't go unnoticed"),
    send("It's someone we never got past a bad first impression with"),
  ]),
  ...E('block.build.clue.noBond', [
    send("The person being blocked is someone we just never really got to know"),
    send("It's someone we never really connected with, and that's on both sides"),
    send("It's someone who stayed quiet in here. Maybe too quiet"),
    send("It's someone whose chats with us never went much past hello"),
  ]),
  ...E('block.build.clue.offer', [
    send("This one came down to an offer somebody made"),
    send("It's someone whose fate was decided by a deal"),
    send("Somebody made an offer. It was taken"),
  ]),

  ...E('block.fear.fake', [
    say("Never felt real? Is that me? I've been nothing but real!"),
    say("Oh no. They think I'm a catfish. They think I'm a catfish."),
    react("My answers changed ONE time. One!"),
    say("If they say my name, I'm swearing on my mom that I'm real."),
  ]),
  ...E('block.fear.threat', [
    say("Playing too well? That could be me. That could absolutely be me."),
    react("Everybody likes me. Oh no. Everybody likes me."),
    say("So being liked is a crime now? Great. Love that."),
    say("Hard to beat at the end? That's flattering and terrifying at the same time."),
  ]),
  ...E('block.fear.grudge', [
    say("Personal? Who did I come after? Okay. Maybe one person."),
    react("I said one thing! One thing!"),
    say("If this is about that chat, I take it back. I take it all back."),
    say("Somebody is mad at me. I can feel it through the screen."),
  ]),
  ...E('block.fear.noBond', [
    say("Never got to know them? I've barely talked to the Influencers. That's me."),
    react("Quiet? I'm quiet! I'm so quiet!"),
    say("I should have messaged them. Why didn't I message them?"),
    say("This is about me. This is about me, isn't it."),
  ]),
  ...E('block.fear.offer', [
    say("A deal? What deal? Who made a deal?"),
    react("Somebody sold somebody out. Please don't let it be me."),
    say("I didn't offer anything. Did somebody offer me?"),
  ]),
  ...E('block.fear.dots', [
    react("Just say it. Just say the name."),
    react("Come on. Type it. Type it!", { beat: '{a} grips a pillow with both hands.' }),
    say("Why are the dots taking so long? I can't breathe."),
    react("Please don't be me. Please don't be me."),
    say("Whoever it is, I'm sorry. Unless it's me."),
    react("Hit send. I can take it. I think."),
  ]),
};
