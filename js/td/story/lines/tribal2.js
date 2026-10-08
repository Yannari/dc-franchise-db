// ══════════════════════════════════════════════════════════════════════
// td/story/lines/tribal2.js — the reading and the exit, with more bite
// ══════════════════════════════════════════════════════════════════════
//
// Same parts as tribal.js. The user, 2026-10-08: "as dramatic and spicy as the real show".
// On Disventure Camp even an expected boot gets words thrown at the room.

export default {
  'reveal.expected': [
    { id: 'tr2.e1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Wow. Okay. Cowards. Every single one of you." },
      { by: 'b', say: "Nobody's a coward for voting." },
      { by: 'a', say: "Then say it to my face. Who wrote it? Go on." },
      { beat: "Nobody says anything." },
      { by: 'a', say: "That's what I thought." },
    ] },
    { id: 'tr2.e2', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'a', say: "Fine. But before I go, you should all know you just voted out the only person keeping this place honest." },
      { by: 'c', say: "Honest? You?" },
      { by: 'a', say: "Honest about what everyone else is doing. Ask {b} what {b} has been up to. I'll wait." },
      { by: 'b', say: "Don't drag me into this." },
      { by: 'a', say: "Too late." },
    ] },
    { id: 'tr2.e3', when: { register: ['competitor', 'plain'] }, turns: [
      { by: 'a', say: "Yeah. I knew it. You're voting out the person who wins you challenges." },
      { by: 'c', say: "We'll manage." },
      { by: 'a', say: "Sure you will. Tell me how that goes next time you lose." },
    ] },
    { id: 'tr2.e4', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "It's okay. I'm okay. I just... I really thought I'd last longer." },
      { by: 'b', say: "You did amazing." },
      { by: 'a', say: "Then why am I the one leaving?" },
      { beat: "{b} doesn't have an answer for that." },
    ] },
    { id: 'tr2.e5', turns: [
      { by: 'a', say: "Good game. I mean that. Mostly." },
      { by: 'c', say: "Mostly?" },
      { by: 'a', say: "Some of you played a good game. Some of you just followed the people who did." },
    ] },
  ],
  'reveal.blindside': [
    { id: 'tr2.b1', when: { count: true }, turns: [
      { by: 'a', say: "Hold on. Hold on. That's not right." },
      { by: 'a', say: "{b}, look at me. Look at me. Did you do this?" },
      { by: 'b', say: "It was a numbers thing." },
      { by: 'a', say: "A NUMBERS thing?" },
      { by: 'c', say: "Ohhh, this is bad." },
      { by: 'a', say: "I hope the numbers keep you warm at night." },
    ] },
    { id: 'tr2.b2', turns: [
      { by: 'a', say: "Unbelievable. You all sat there and smiled at me all day." },
      { by: 'b', say: "That's the game." },
      { by: 'a', say: "Then I hope the game is all you've got left when this is over." },
    ] },
  ],
  'exit.shot': [
    { id: 'tr2.s1', turns: [
      { by: 'a', say: "Oh, and {b}? Everybody knows it was you. Good luck getting anyone to trust you after this." },
      { by: 'b', say: "I'll manage." },
      { by: 'a', say: "We'll see." },
    ] },
    { id: 'tr2.s2', when: { register: ['fiery', 'competitor'] }, turns: [
      { by: 'a', say: "{b}! When you go home, and you will, I'm going to be sitting there laughing." },
      { by: 'b', say: "Bye, {a}." },
      { by: 'a', say: "Laughing really loud!" },
    ] },
  ],
  'exit.friend': [
    { id: 'tr2.f1', when: { bVoted: 'other' }, turns: [
      { by: 'b', say: "I didn't write your name. I need you to know that." },
      { by: 'a', say: "I know. I know you didn't." },
      { by: 'b', say: "I'm going to find out who did." },
      { by: 'a', say: "Don't waste your time on revenge. Just beat them." },
      { by: 'b', say: "Can't I do both?" },
      { by: 'a', say: "...Okay. Both." },
    ] },
    { id: 'tr2.f2', when: { bVoted: 'boot' }, turns: [
      { by: 'b', say: "{a}, wait. I'm sorry." },
      { by: 'a', say: "Sorry for what?" },
      { by: 'b', say: "For... all of it. For tonight." },
      { by: 'a', say: "...You voted for me." },
      { by: 'b', say: "I didn't have a choice." },
      { by: 'a', say: "Everybody has a choice. You made yours." },
      { beat: "{a} walks away. {b} doesn't follow." },
    ] },
  ],
};
