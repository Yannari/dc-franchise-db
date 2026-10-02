// ══════════════════════════════════════════════════════════════════════
// ci/lines/twotiming.js — playing two people, and getting caught
// ══════════════════════════════════════════════════════════════════════
//
// twotiming.js. c is always the player who was romancing two people.
//   notes.find         a and b (both romanced by c) work it out in a chat
//   notes.find.copy    ...because c sent them the same message: {x}, word for word
//   notes.taken        c's profile says "in a relationship" (everyone could see it)
//   notes.plan         a and b decide to bring c into a group chat
//   busted.open        a starts the group chat with b and c
//   busted.accuse      a (one of the two) to b (the player); c is the other one.
//                      `taken`: the player's profile says they are in a relationship
//   busted.charm       a (the player) picks b over c
//   busted.end.charm   a (the one not picked) to b (the player); c was picked
//   busted.confess / .deny        a (the player) to b and c. `cheat`: a admits
//                                 being in a relationship behind a "Single" profile
//   busted.end.confess / .deny    a (one of the two), b (the player), c (the other)
//   party.twotime      a flirts with b and then c, at the party, in front of everyone
//   game.twotime       a watches b pick c in {game}, after b had been flirting with a
//   goodbye.warning.playing        a's goodbye video, about c
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const TWOTIMING_LINES = {
  ...E('notes.find', [
    { turns: [
      { by: 'a', send: "Random question. Has {c} been flirting with you?" },
      { by: 'b', react: "Oh no.", send: "...Maybe? Why?" },
      { by: 'a', send: "Because {c} has been flirting with ME" },
      { by: 'b', send: "Are you serious right now" },
    ], beat: '{b} stares at the screen with {b.posAdj} mouth open.' },
    { turns: [
      { by: 'b', send: "Okay I need to tell you something. I think {c} likes me {e:smile}" },
      { by: 'a', react: "Wait. What?", send: "That's funny. {c} told me the same thing. About me" },
      { by: 'b', send: "WHAT" },
    ] },
    { turns: [
      { by: 'a', say: "Something's not adding up.", send: "Is it just me or does {c} call everybody babe?" },
      { by: 'b', send: "Wait. {c} calls you babe too?" },
      { by: 'a', send: "Every single day" },
      { by: 'b', send: "Oh we need to talk" },
    ] },
    { turns: [
      { by: 'a', send: "So you and {c}. Is that a thing?" },
      { by: 'b', send: "I mean, we've been flirting a little. Why?" },
      { by: 'a', send: "Because I thought I was the only one {c} was flirting with" },
      { by: 'b', react: "No. No, no, no." },
    ] },
    { turns: [
      { by: 'b', send: "Did {c} ever tell you that you're the only one {c} talks to like this?" },
      { by: 'a', send: "Word for word. Yes" },
      { by: 'b', send: "Unbelievable" },
    ], beat: '{a} gets up and walks a lap around the apartment.' },
    { turns: [
      { by: 'a', react: "Hold on. Hold on.", send: "{c} told me I was {c.posAdj} favorite person in here" },
      { by: 'b', send: "Funny. {c} said that to me too" },
      { by: 'a', send: "So one of us is being lied to" },
      { by: 'b', send: "Both of us. Both of us are being lied to" },
    ] },
  ]),
  ...E('notes.find.copy', [
    { turns: [
      { by: 'a', send: "Okay this is weird. Did {c} ever send you this: \"{x}\"" },
      { by: 'b', react: "Oh my God.", send: "WORD FOR WORD. That's what {c} sent ME" },
      { by: 'a', send: "{c} copied and pasted us" },
    ], beat: '{b} reads it three times to be sure.' },
    { turns: [
      { by: 'b', send: "Read this and tell me if it sounds familiar: \"{x}\"" },
      { by: 'a', react: "Are you kidding me?", send: "That's my message. That's literally my message from {c}" },
      { by: 'b', send: "Recycled. We got recycled" },
    ] },
    { turns: [
      { by: 'a', say: "No. No way.", send: "Did {c} send you \"{x}\" by any chance" },
      { by: 'b', send: "How do you know that??" },
      { by: 'a', send: "Because {c} sent it to me first" },
    ] },
    { turns: [
      { by: 'b', send: "{c} sent me the sweetest message today" },
      { by: 'a', send: "Let me guess. \"{x}\"" },
      { by: 'b', react: "How did you know that?" },
      { by: 'a', send: "Because I got it too {e:grimace}" },
    ] },
  ]),
  ...E('notes.taken', [
    { turns: [
      { by: 'a', send: "And not for nothing, {c}'s profile says in a relationship" },
      { by: 'b', send: "I KNOW. I thought it was a joke" },
    ] },
    { turns: [
      { by: 'b', send: "Wait. Isn't {c}'s status literally in a relationship?" },
      { by: 'a', send: "It's right there on the profile" },
      { by: 'b', react: "Oh, that's so much worse." },
    ] },
    { turns: [
      { by: 'a', say: "Somebody at home is watching this.", send: "{c} has a whole partner at home. On the profile. In writing" },
      { by: 'b', send: "Somebody needs to tell that person" },
    ] },
  ]),
  ...E('notes.plan', [
    { turns: [
      { by: 'a', send: "So what do we do?" },
      { by: 'b', send: "We get {c} in a group chat. The three of us" },
      { by: 'a', send: "Oh I love that. Let's do it" },
    ] },
    { turns: [
      { by: 'b', send: "I'm not letting this go" },
      { by: 'a', send: "Neither am I. Group chat. Now" },
    ] },
    { turns: [
      { by: 'a', say: "{c} is about to have the worst conversation of {c.posAdj} life.", send: "Let's bring {c} in. Together" },
      { by: 'b', send: "Together {e:handshake}" },
    ] },
  ]),

  // ── The group chat ───────────────────────────────────────────────────
  ...E('busted.open', [
    { turns: [
      { by: 'a', say: "Circle, start a group chat with {b} and {c}.", send: "Hi {c}. {b} and I have been talking {e:eyes}" },
      { by: 'b', send: "A lot" },
      { by: 'c', react: "Oh no." },
    ] },
    { turns: [
      { by: 'a', send: "{c}. You're probably wondering why the three of us are in here" },
      { by: 'b', send: "Take a guess" },
      { by: 'c', react: "I know exactly why we're in here." },
    ] },
    { turns: [
      { by: 'a', say: "I've never been this calm and this mad at the same time.", send: "Hey {c}! Quick question for you. And {b} is here for it too {e:smile}" },
      { by: 'c', react: "That smile is not a nice smile." },
    ] },
  ]),
  ...E('busted.accuse', [
    { turns: [
      { by: 'a', send: "So you've been flirting with both of us. At the same time" },
      { by: 'b', send: "Okay, it's not what it looks like" },
      { by: 'a', send: "It's exactly what it looks like" },
    ] },
    { turns: [
      { by: 'a', send: "Favorite person in here, huh? Because {c} was your favorite person too" },
      { by: 'b', react: "Here we go." },
    ] },
    { turns: [
      { by: 'a', send: "We compared notes. All of them" },
      { by: 'b', react: "Oh no. Oh no, no, no." },
    ] },
  ]),
  ...E('busted.accuse.taken', [
    { turns: [
      { by: 'a', send: "And your profile says you're in a relationship! Does your partner know about any of this?" },
      { by: 'b', react: "I am so dead." },
    ] },
    { turns: [
      { by: 'a', send: "You're in a relationship. It's on your profile. What were you doing?" },
      { by: 'b', send: "It's complicated" },
      { by: 'a', send: "It's really not" },
    ] },
    { turns: [
      { by: 'a', send: "Two of us in here, and somebody waiting at home. That's three people you're lying to" },
      { by: 'b', react: "When you put it like that..." },
    ] },
  ]),
  ...E('busted.charm', [
    { turns: [
      { by: 'a', say: "Okay. Deep breath. Choose your words.", send: "I'll be honest. I was talking to both of you. But {b}, what we have was always different" },
      { by: 'b', react: "Ugh. That's... kind of sweet." },
      { by: 'c', send: "WOW" },
    ] },
    { turns: [
      { by: 'a', send: "{c}, you're amazing. But {b} is the one I actually think about" },
      { by: 'c', send: "Unbelievable" },
      { by: 'b', react: "Okay. I did not see that coming." },
    ] },
    { turns: [
      { by: 'a', send: "I panicked and tried to keep everybody happy. But it's {b}. It was always {b}" },
      { by: 'b', send: "You'd better mean that" },
      { by: 'c', react: "I'm going to scream." },
    ] },
  ]),
  ...E('busted.end.charm', [
    { turns: [
      { by: 'a', send: "Good luck, {c}. You're gonna need it" },
      { by: 'a', react: "I'm out. I am so out." },
    ], beat: '{a} leaves the group chat.' },
    { turns: [
      { by: 'a', send: "Enjoy each other. I'm leaving this chat" },
    ], beat: '{a} sits back with {a.posAdj} arms crossed.' },
    { turns: [
      { by: 'a', say: "That's fine. I'll remember this when the ratings come." },
      { by: 'a', send: "Okay. Noted. Bye {e:wave}" },
    ] },
  ]),
  ...E('busted.confess', [
    { turns: [
      { by: 'a', send: "You're right. I was talking to both of you. I'm sorry. I got carried away" },
      { by: 'b', send: "At least you admit it" },
      { by: 'c', send: "Barely" },
    ] },
    { turns: [
      { by: 'a', say: "Just tell the truth. Just tell the truth.", send: "I messed up. I liked you both and I didn't want to choose. That's on me" },
      { by: 'c', send: "Yeah. It is" },
    ] },
    { turns: [
      { by: 'a', send: "I'm not proud of it. I was trying to keep my options open" },
      { by: 'b', send: "We're not options" },
    ] },
  ]),
  ...E('busted.confess.cheat', [
    { turns: [
      { by: 'a', send: "You're right. And there's more. I'm not actually single. I have somebody at home" },
      { by: 'b', react: "Excuse me?!" },
      { by: 'c', send: "Oh, this keeps getting better" },
    ], beat: '{b} reads it out loud to the empty apartment.' },
    { turns: [
      { by: 'a', say: "If I'm doing this, I'm doing all of it.", send: "I'm sorry. To both of you. And I'm in a relationship. I should have said it on day one" },
      { by: 'b', send: "Yeah. You should have" },
      { by: 'c', send: "Wow" },
    ] },
    { turns: [
      { by: 'a', send: "I flirted with both of you, and I have a partner at home. I'm sorry. All of it was wrong" },
      { by: 'c', send: "Your profile said single" },
      { by: 'a', send: "I know. I changed it. I'm sorry" },
    ] },
  ]),
  ...E('busted.end.confess', [
    { turns: [
      { by: 'a', send: "Thank you for being honest. Even if it's late" },
      { by: 'c', send: "We're good. Kind of. Not really" },
    ] },
    { turns: [
      { by: 'a', send: "I respect the apology. I don't respect the flirting" },
    ], beat: '{a} closes the chat and lets out a long breath.' },
    { turns: [
      { by: 'a', react: "Well. That was a lot.", send: "Let's all just play the game from here" },
      { by: 'c', send: "Agreed" },
    ] },
  ]),
  ...E('busted.deny', [
    { turns: [
      { by: 'a', send: "I don't know what you two think you found, but you're reading way too much into it" },
      { by: 'b', send: "We're reading the messages YOU sent" },
    ] },
    { turns: [
      { by: 'a', send: "Flirting? I'm just friendly. I'm like this with everybody" },
      { by: 'c', send: "Yeah. That's the problem" },
    ] },
    { turns: [
      { by: 'a', say: "Deny. Deny. Deny.", send: "I never said anything like that" },
      { by: 'b', send: "Do you want me to read it back to you? Because I will" },
      { by: 'a', react: "Oh no, {b} saved it." },
    ] },
  ]),
  ...E('busted.end.deny', [
    { turns: [
      { by: 'a', send: "Okay. Enjoy the rest of your game. Alone" },
      { by: 'c', send: "Leaving this chat {e:wave}" },
    ] },
    { turns: [
      { by: 'a', react: "Unbelievable. Unbelievable.", send: "We're done here" },
    ], beat: '{a} closes the chat so hard {a.sub} almost drops the remote.' },
    { turns: [
      { by: 'a', send: "Just so you know, everybody's gonna hear about this" },
      { by: 'b', react: "Great. Perfect. Love that for me." },
    ] },
  ]),

  // ── Caught in public ─────────────────────────────────────────────────
  ...E('party.twotime', [
    { turns: [
      { by: 'a', send: "{b} you look amazing tonight {e:fire}" },
      { by: 'a', send: "{c} save me a dance {e:wink}" },
      { by: 'b', react: "Hold on. Did {a} just flirt with {c}? Right after me?" },
    ] },
    { turns: [
      { by: 'a', send: "Best dressed goes to {b} {e:hearteyes}" },
      { by: 'a', send: "And {c}, you're my date for the after-party {e:wink}" },
      { by: 'c', react: "Wait. Wasn't {a} just flirting with {b}?" },
      { by: 'b', react: "In front of everybody. Wow." },
    ] },
    { turns: [
      { by: 'a', send: "{c} you're trouble and I like it {e:fire}" },
      { by: 'b', react: "Excuse me? That's what {a} said to ME an hour ago." },
    ], beat: '{b} turns the music down to read the chat again.' },
  ]),
  ...E('game.twotime', [
    { turns: [
      { by: 'a', react: "Wait. {b} picked {c}?" },
      { by: 'a', say: "{b} has been flirting with me for days. Days!" },
    ] },
    { turns: [
      { by: 'a', say: "Oh, so that's how it is. {b} picked {c} in front of everybody." },
    ], beat: '{a} stares at the screen without blinking.' },
    { turns: [
      { by: 'a', react: "I'm sorry, WHAT?" },
      { by: 'a', say: "I thought {b} and I had something. Apparently {c} has something too." },
    ] },
  ]),
  // ── A couple sharing a profile (face / brain: ci/shared.js) ───────────
  // couple.flirt.game: a flirty message they agreed on, as a game move.
  // couple.flirt.jealous.<sent|stopped>.<face|brain>: the one named wants to
  // send it, the other objects; `sent`, it goes anyway; `stopped`, it goes
  // out tame. b is who the message is to. couple.reveal: a finds out the
  // profile flirting with them (b) was a couple the whole time.
  ...E('couple.flirt.game', [
    { turns: [{ by: 'face', say: "It's strategy. Nothing more." }, { by: 'brain', say: "Then make it convincing. {b} has to buy it." }] },
    { turns: [{ by: 'brain', say: "{b} likes us. We need {b}. Flirt a little." }, { by: 'face', say: "I'm doing this for the game. Remember that." }], beat: '{a.face} and {a.brain} shake on it.' },
    { turns: [{ by: 'face', say: "Is this weird? This is weird." }, { by: 'brain', say: "It's a game. Go. I'm right here." }] },
    { turns: [{ by: 'brain', say: "A little wink emoji. That's all. For the game." }, { by: 'face', say: "One wink. And you're not allowed to be mad later." }] },
  ]),
  ...E('couple.flirt.jealous.sent.face', [
    { turns: [{ by: 'brain', say: "Excuse me. Who are you flirting with?" }, { by: 'face', say: "It's harmless! Send." }], beat: '{a.brain} crosses both arms and does not say a word.' },
    { turns: [{ by: 'brain', say: "You're NOT sending that." }, { by: 'face', say: "Watch me." }, { by: 'brain', say: "We're talking about this later." }] },
    { turns: [{ by: 'brain', say: "Oh, so that's how you talk to {b}?" }, { by: 'face', say: "It's called being friendly." }, { by: 'brain', say: "It's called sleeping on the couch." }] },
  ]),
  ...E('couple.flirt.jealous.sent.brain', [
    { turns: [{ by: 'face', say: "Since when do YOU flirt?" }, { by: 'brain', say: "Since it gets us votes. Send." }], beat: '{a.face} stares at {a.brain} like a stranger.' },
    { turns: [{ by: 'face', say: "Absolutely not. Not with {b}." }, { by: 'brain', say: "It's a game. Message: send." }, { by: 'face', say: "Unbelievable." }] },
    { turns: [{ by: 'face', say: "I'm sitting right here, you know." }, { by: 'brain', say: "And I'm winning us this game. Send." }] },
  ]),
  ...E('couple.flirt.jealous.stopped.face', [
    { turns: [{ by: 'brain', say: "Delete that. Right now." }, { by: 'face', say: "...Fine. Something nice. Not flirty." }], beat: '{a.face} deletes the message one letter at a time.' },
    { turns: [{ by: 'brain', say: "You put a heart on that? Take the heart off." }, { by: 'face', say: "Okay, okay. No heart." }] },
    { turns: [{ by: 'brain', say: "Read that back to me." }, { by: 'face', say: "...Yeah, I'm changing it." }] },
  ]),
  ...E('couple.flirt.jealous.stopped.brain', [
    { turns: [{ by: 'face', say: "If you send that, I'm leaving this apartment." }, { by: 'brain', say: "Fine. Something friendly." }] },
    { turns: [{ by: 'face', say: "No flirting. We agreed. No flirting." }, { by: 'brain', say: "We did agree. Okay. Deleting." }] },
    { turns: [{ by: 'face', say: "Strategy my foot. Change it." }, { by: 'brain', say: "Changing it. Calm down." }], beat: '{a.face} watches every letter until it is gone.' },
  ]),
  ...E('couple.reveal', [
    { turns: [{ by: 'a', react: "Wait. You two are TOGETHER?" }, { by: 'a', say: "{b} was flirting with me! For days!" }] },
    { turns: [{ by: 'a', react: "Oh my God. A couple. The whole time." }, { by: 'a', say: "So who was sending me the winky faces? Which one of you?" }] },
    { turns: [{ by: 'a', say: "I had a crush on a couple. An actual couple." }], beat: '{a} sits down very slowly.' },
    { turns: [{ by: 'a', react: "Are you kidding me?" }, { by: 'a', say: "Every flirty message. And you were sitting next to each other." }] },
  ]),
  ...E('goodbye.warning.playing', [
    { turns: [{ by: 'a', video: "One more thing. {c} is a player. {c} was flirting with me and somebody else at the same time. Don't fall for it." }] },
    { turns: [{ by: 'a', video: "To whoever {c} is sweet-talking right now: you're not the only one. Trust me." }] },
    { turns: [{ by: 'a', video: "And {c}? Everybody knows now. Good luck with that." }] },
  ]),
};
