// ══════════════════════════════════════════════════════════════════════
// ci/lines/chat-depth.js — a private chat that builds
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "conversations aren't long enough for people to even get
// deep". An aired chat ran 3.3 messages; the show's run six to ten. A chat
// now opens (a hello), has its conversation, and closes the way it went —
// and two people already close may go deep (conversation.js: `deep`, which
// moves them closer).
//   chat.hello          light opener (a writes, b answers)
//   chat.hello.serious  "got a minute?" before a hard conversation
//   chat.hello.cool     a hello that gets a short answer (the chat goes cold)
//   chat.close.<ending> the sign-off: warm, neutral (a cold chat just ends)
//   chat.deep           a heart-to-heart (home, family, why they're here)
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const two = (a, b, extra = {}) => ({ turns: [{ by: 'a', send: a }, { by: 'b', send: b }], ...extra });

export const CHAT_DEPTH = {
  ...E('chat.hello', [
    two("Hey you! How's your day going?", "Better now lol {e:smile}"),
    two("Hiii {b}! Got a sec?", "For you? Always"),
    two("Okay I've been meaning to message you all day", "Finally! I was starting to think you forgot me"),
    two("{b}! What's up?", "Not much, just talking to my ceiling lol"),
    two("Hey stranger {e:wave}", "Hey yourself! Perfect timing"),
    two("Quick check in. How are you holding up in there?", "Honestly? Up and down. But this helps"),
    two("Hello hello {e:sparkle}", "Oh hey! I was literally about to message you"),
    two("Is this a bad time? Lol", "Never a bad time. Talk to me"),
    two("You've been on my mind. In a normal way lol", "Haha same. In a normal way"),
    two("Okay, I need a {b} chat today", "Say less. I'm here"),
    two("Good morning sunshine {e:sun}", "Morning! You're up early"),
    two("Okay, I've officially run out of things to do in here", "Same. So naturally you messaged me"),
    two("Guess who", "Oh it's you! Hi!"),
    two("Checking in on my favorite person", "Stop it. You're making me blush"),
    two("{b}!! I've missed you", "It's been like six hours lol. But same"),
    two("Hey friend {e:heart}", "Hey friend!"),
    two("Are you as bored as I am right now", "More. Way more. Talk to me"),
    two("Hi! Just wanted to say hi lol", "Hi back {e:smile}"),
    two("Hey, you busy?", "Never too busy for you"),
    two("Okay I need a distraction and you're it", "Happy to be your distraction lol"),
    two("Oh good, you're online", "Always online in here lol"),
    two("Reporting for our daily chat", "Right on time {e:clap}"),
    two("Okay hear me out. Snack break chat", "Already eating. Go"),
    two("Hey {b}, you got a sec for me?", "I've got all the secs. Go"),
  ]),
  ...E('chat.hello.serious', [
    two("Hey. Got a minute?", "Sure. I'm listening"),
    two("{b}, can we talk for a second?", "Uh oh. Yeah, of course"),
    two("I need to ask you something and I need you to be honest", "Okay. That sounds serious"),
    two("Hey. Something's been bugging me", "Okay. Talk to me"),
    two("I've been going back and forth on whether to message you", "Well, now you have. Go ahead"),
    two("Can I be real with you for a minute?", "Always. Go ahead"),
  ]),
  ...E('chat.close.warm', [
    two("Okay I have to go but this was the best chat of my day", "Mine too {e:heart}"),
    two("Talk later?", "Count on it"),
    two("I'm really glad we're friends in here", "Me too. Seriously"),
    two("Same time tomorrow? Lol", "It's a date {e:wink}"),
    two("You always make me feel better", "That's literally my job now"),
    two("Okay going before I tell you all my secrets", "Too late lol. Bye!"),
    two("Thank you for this. Really", "Anytime. I mean that"),
    two("Okay, back to the madness {e:laugh}", "Stay strong out there!"),
    two("This was exactly what I needed", "Me too. Message me anytime"),
    two("Okay, I'm smiling at my screen like an idiot", "Good. Keep smiling"),
    two("Let's do this again soon", "Tomorrow. That's a promise"),
    two("Okay I'm off. Love this chat", "Love this chat too {e:heart}"),
    two("Thanks for always being real with me", "Always. That's what I'm here for"),
    two("Okay, I'll leave you be", "Never leave me be lol. Later!"),
    two("Glad I messaged you", "Glad you did too"),
  ]),
  ...E('chat.close.neutral', [
    two("Okay, talk soon", "Sounds good"),
    two("Anyway, I'll let you go", "Okay, catch you later"),
    two("Alright, good chat", "Yep. Later!"),
    two("I'll let you get back to it", "Thanks for checking in"),
    two("Okay cool. Bye for now", "Bye!"),
    two("Anyway. Good talk", "Good talk"),
    two("Alright, I'll check in later", "Sounds like a plan"),
    two("Okay, gotta go do Circle things", "Same. Later"),
    two("That's all I had. See you around", "See you"),
    two("Okay, signing off", "Okay. Bye for now"),
    two("I should probably go", "Yeah, me too. Later"),
  ]),
  ...E('chat.hello.cool', [
    two("Hey {b}", "Hey."),
    two("Hi! You around?", "Sort of. What's up"),
    two("Hey you {e:smile}", "Hi"),
    two("Got a minute?", "A minute"),
    two("Hiii", "Hey"),
    two("Hey, how's it going?", "It's going"),
  ]),
  ...E('chat.deep', [
    { turns: [
      { by: 'a', send: "Can I ask you something real? Why are you here? Like actually" },
      { by: 'b', send: "Honestly? To prove to myself I can do something scary" },
      { by: 'a', send: "That's beautiful. And you're doing it" },
    ] },
    { turns: [
      { by: 'a', send: "What do you miss most from home?" },
      { by: 'b', send: "My people. The noise. Somebody to hug at the end of the day" },
      { by: 'a', react: "Oh, my heart.", send: "I miss mine too. This place is so quiet" },
    ] },
    { turns: [
      { by: 'b', send: "Can I tell you something I haven't told anyone in here?" },
      { by: 'a', send: "Of course. It stays with me" },
      { by: 'b', send: "I almost didn't come. I was so scared nobody would like me" },
      { by: 'a', send: "Well, I do. A lot" },
    ], beat: '{b} reads it and smiles at the screen.' },
    { turns: [
      { by: 'a', send: "What would you do with the money if you won?" },
      { by: 'b', send: "Take care of the people who took care of me. That's the whole list" },
      { by: 'a', react: "That's real.", send: "That's the best answer I've heard in here" },
    ] },
    { turns: [
      { by: 'a', send: "Who's waiting for you at home?" },
      { by: 'b', send: "The people who told me to go for it. I can't let them down" },
      { by: 'a', send: "They're gonna be so proud of you" },
    ] },
    { turns: [
      { by: 'b', send: "Is it weird that I feel closer to you than people I've known for years?" },
      { by: 'a', send: "Not weird. I feel it too" },
      { by: 'b', send: "This place is so strange" },
    ] },
    { turns: [
      { by: 'a', send: "What's the hardest part of this for you?" },
      { by: 'b', send: "Not knowing who's real. Except you. I trust you" },
      { by: 'a', react: "That means a lot.", send: "Same. You're my safe place in here" },
    ] },
    { turns: [
      { by: 'a', send: "When this is over we're getting coffee. Real coffee. In person" },
      { by: 'b', send: "First thing. I'm holding you to that" },
      { by: 'a', send: "It's a promise" },
    ] },
    { turns: [
      { by: 'b', send: "I had a rough night last night. Didn't sleep" },
      { by: 'a', send: "Talk to me. What's going on in that head?" },
      { by: 'b', send: "Just missing people. Feeling far away from everything" },
      { by: 'a', send: "You're not alone in here. You've got me" },
    ] },
    { turns: [
      { by: 'a', send: "Okay, deep question. What's something people always get wrong about you?" },
      { by: 'b', send: "That I'm tough. I cry at commercials lol" },
      { by: 'a', send: "Same. Dog food commercials destroy me" },
    ] },
  ]),
};
