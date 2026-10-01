// What a player says to their empty apartment after a chat, in the head of
// their archetype (the REAL person, never the persona). Data only. One line,
// by `aside.<group>.<ending>`: how the chat went, and who they are.
// Franchise rule: only the scheming archetypes scheme out loud; the nice ones
// never do; the neutral ones read people and react, but do not plot.
//   schemer  villain, mastermind, schemer
//   sweet    hero, loyal-soldier, social-butterfly, underdog, goat
//   romantic showmancer
//   wild     hothead, chaos-agent, wildcard, challenge-beast
//   watcher  floater, perceptive-player
const A = (key, lines) => ({ [key]: lines.map((say, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, turns: [{ by: 'a', say }] })) });

export const ASIDES = {
  ...A('aside.schemer.warm', [
    "{b} thinks we're close now. Good. Close is useful.",
    "That went perfectly. {b} has no idea how much {b.sub} just told me.",
    "One more friend in my pocket. The pocket is getting full.",
    "Nice is a tool. I just used it.",
  ]),
  ...A('aside.schemer.neutral', [
    "Not a win, not a loss. I'll circle back to {b} when I need {b.obj}.",
    "{b} is careful. I respect careful. I don't trust it.",
    "Filed away. Everything gets filed away.",
    "Some people you win in one chat. {b} is a two-chat person.",
  ]),
  ...A('aside.schemer.cold', [
    "Fine. {b} just moved to the top of a very short list.",
    "{b} doesn't like me? Noted. {b.Sub} will like being blocked even less.",
    "That was a mistake. Not mine.",
    "Cold shoulder. I can work with a cold shoulder. It's easier to aim at.",
  ]),
  ...A('aside.sweet.warm', [
    "I really like {b}. Like, genuinely. That was nice.",
    "That's the kind of chat that makes this whole thing worth it.",
    "{b} is good people. I can feel it through the screen.",
    "I'm smiling like an idiot at a TV. I don't care.",
  ]),
  ...A('aside.sweet.neutral', [
    "{b} is a little guarded. That's okay. I'll keep being kind.",
    "Not every chat has to be magic. It was nice to say hi.",
    "I hope {b} is okay. {b.Sub} seemed tired.",
    "Small steps. Friendships take time, even in here.",
  ]),
  ...A('aside.sweet.cold', [
    "Did I do something wrong? I really hope I didn't.",
    "That stung a little. I'm not going to let it make me mean.",
    "Maybe {b} is just having a bad day. Everybody has those.",
    "I'll try again tomorrow. I'm not giving up on people.",
  ]),
  ...A('aside.romantic.warm', [
    "Okay. Okay. My heart is doing a thing.",
    "Is it crazy to have a crush on someone you've never seen move? Don't answer that.",
    "{b} and me. I'm just saying it out loud to see how it sounds. It sounds good.",
    "I came here to play a game and now I'm writing our wedding vows in my head.",
  ]),
  ...A('aside.romantic.neutral', [
    "No sparks yet. Sparks take time. Right? Right.",
    "{b} is cute but I need more than cute. I need chemistry.",
    "The flirting was fine. Fine is not what I'm here for.",
    "Maybe {b} is shy. I can work with shy.",
  ]),
  ...A('aside.romantic.cold', [
    "Well. That's one door closed. The building has more doors.",
    "{b} left me on read emotionally. Rude.",
    "I put my heart out there and {b} typed 'lol'. Great.",
    "Okay, not my person. Next.",
  ]),
  ...A('aside.wild.warm', [
    "YES. That's what I'm talking about. {b} gets it!",
    "I'm gonna run a lap around this apartment. That's how good that went.",
    "I didn't plan any of that and it was perfect. That's my whole strategy.",
    "{b} is officially cool. It's decided. I decided.",
  ]),
  ...A('aside.wild.neutral', [
    "Eh. Could've been worse. Could've been way better. Moving on!",
    "I'm bored. Somebody in this building do something.",
    "That chat needed more chaos. I'll bring the chaos next time.",
    "Whatever. I'm gonna go eat something loud.",
  ]),
  ...A('aside.wild.cold', [
    "Oh, {b} wants attitude? I have attitude. I have so much attitude.",
    "I'm not mad. I'm just gonna do push-ups until I'm not mad.",
    "That was weird and I hated it. Next!",
    "Okay, {b} is officially on my nerves. Officially.",
  ]),
  ...A('aside.watcher.warm', [
    "{b} opened up more than {b.sub} meant to. People do, when they feel safe.",
    "Good chat. And I learned three things {b} didn't know {b.sub} said.",
    "I like {b}. I also noticed {b.sub} dodged one question. Both things are true.",
    "Easy chat. Easy is how you learn the most.",
  ]),
  ...A('aside.watcher.neutral', [
    "{b} said all the right things. That's what bothers me.",
    "Nothing wrong with that chat. That's the interesting part.",
    "I'll let {b} talk more next time. People always say more when you let them.",
    "Stay quiet, stay likable, keep listening. It's working.",
  ]),
  ...A('aside.watcher.cold', [
    "Short answers. {b} is hiding something, or {b} doesn't like me. Maybe both.",
    "That was a wall. Walls tell you things too.",
    "{b} was cold with me. Warm with everybody in Circle Chat. Interesting.",
    "I don't need {b} to like me. I just need to understand {b.obj}.",
  ]),
};
