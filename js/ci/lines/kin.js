// ══════════════════════════════════════════════════════════════════════
// ci/lines/kin.js — family, partners and old friends in the same season
// ══════════════════════════════════════════════════════════════════════
//
// ci/kin.js. {q} is what a calls b ("sister", "wife", "best friend", "ex");
// {x} is what b calls a. warm: family, partners, friends; tense: exes,
// estranged family, ex-best-friends.
//   recognise.kin.<tone>.open     a sees b's profile and knows them; b has no idea a is here
//   recognise.kin.<tone>.mutual   both their own faces: they see each other at once
//   recognise.kin.<tone>.hidden   b is behind someone else's face; a clocks them anyway
//   kin.pact.secret / .tell       a and b, in a chat: keep it quiet, or tell people they trust
//   kin.test.admit / .dodge.<tone>  a tests b (clocked behind a catfish) with something
//                                 only they would know; b owns up, or plays dumb
//   visit.kin.door.<tone>         a (who didn't know) opens or knocks, and it is b
//   visit.choose/talk/talk2.crush a goes to see b, a crush
//   visit.choose/talk/talk2.family a goes to see b, family or an old friend.
//                                 visit.choose never says who, like every visit.choose
//   goodbye.kin.open / .hidden    a's goodbye video, to b; .hidden keeps b's secret
//   goodbye.kin.react             a (still in) hears the video of b, who just left
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const KIN_LINES = {
  ...E('recognise.kin.warm.open', [
    { turns: [{ by: 'a', react: "Wait. Wait, wait, wait. That's my {q}!" }, { by: 'a', say: "And {b} has no idea I'm in here." }], beat: '{a} jumps up from the couch.' },
    { turns: [{ by: 'a', react: "No way. That's my {q}. In the Circle." }, { by: 'a', say: "Okay. I can't say anything. I can't say ANYTHING." }] },
    { turns: [{ by: 'a', react: "Oh my God. {b}?" }, { by: 'a', say: "My {q} is in here. This changes everything." }], beat: '{a} presses both hands against the screen.' },
  ]),
  ...E('recognise.kin.warm.mutual', [
    { turns: [{ by: 'a', react: "Is that... that's my {q}!" }, { by: 'b', react: "No way. NO WAY. That's my {x}!" }], beat: 'In two apartments, two people scream at the same time.' },
    { turns: [{ by: 'b', react: "Hold on. Is that {a}?" }, { by: 'a', react: "My {q} is here. They put my {q} in here!" }] },
    { turns: [{ by: 'a', say: "I'd know that face anywhere. That's my {q}." }, { by: 'b', say: "Okay, play it cool. Nobody can know. Play it cool." }] },
  ]),
  ...E('recognise.kin.warm.hidden', [
    { turns: [{ by: 'a', say: "That profile says {b}. But that's how my {q} talks. Exactly how." }], beat: '{a} reads the message again, very slowly.' },
    { turns: [{ by: 'a', react: "Hold on." }, { by: 'a', say: "Nobody says that except my {q}. Nobody." }] },
    { turns: [{ by: 'a', say: "The jokes, the spelling, the emojis. {b} is my {q}. I'd bet my life on it." }] },
  ]),
  ...E('recognise.kin.tense.open', [
    { turns: [{ by: 'a', react: "Oh no. Oh no, no, no. That's my {q}." }, { by: 'a', say: "Of all the people in the world." }] },
    { turns: [{ by: 'a', react: "You have got to be kidding me." }, { by: 'a', say: "My {q} is in here. Great. Perfect." }], beat: '{a} falls back onto the couch.' },
    { turns: [{ by: 'a', say: "{b}. My {q}. In the Circle. This is going to be a long game." }] },
  ]),
  ...E('recognise.kin.tense.mutual', [
    { turns: [{ by: 'a', react: "Oh, absolutely not. That's my {q}." }, { by: 'b', react: "Are you serious? My {x} is here?" }] },
    { turns: [{ by: 'b', say: "Of course. Of course my {x} is in here." }, { by: 'a', say: "Well. Game on, I guess." }] },
    { turns: [{ by: 'a', react: "Nope. Nope. Not doing this." }, { by: 'b', react: "Oh, this is going to be fun." }] },
  ]),
  ...E('recognise.kin.tense.hidden', [
    { turns: [{ by: 'a', say: "{b} talks exactly like my {q}. I'd know that attitude anywhere." }] },
    { turns: [{ by: 'a', react: "Oh, that's not {b}." }, { by: 'a', say: "That's my {q}. Hiding behind somebody else's face. Of course." }] },
    { turns: [{ by: 'a', say: "Same jokes. Same excuses. That's my {q}, I'm sure of it." }], beat: '{a} narrows {a.posAdj} eyes at the screen.' },
  ]),

  ...E('kin.pact.secret', [
    { turns: [{ by: 'a', send: "Okay. Nobody can know. Not one person" }, { by: 'b', send: "Nobody. We're strangers in here {e:wink}" }, { by: 'a', send: "Strangers who have each other's backs" }] },
    { turns: [{ by: 'a', say: "This is a secret alliance. The best kind.", send: "If anybody finds out, they'll target us both" }, { by: 'b', send: "Then nobody finds out. I've got you" }] },
    { turns: [{ by: 'b', send: "I can't believe you're here {e:hug}" }, { by: 'a', send: "Me neither. But we keep it quiet. Deal?" }, { by: 'b', send: "Deal {e:handshake}" }] },
  ]),
  ...E('kin.pact.tell', [
    { turns: [{ by: 'a', send: "I'm not hiding you. I'm proud of you" }, { by: 'b', send: "Okay. But only the people we trust" }] },
    { turns: [{ by: 'b', send: "Honestly, people would figure it out anyway" }, { by: 'a', send: "Then let's tell them first. On our terms" }] },
    { turns: [{ by: 'a', say: "I can't lie about this. I just can't.", send: "I'm telling my people. You tell yours" }, { by: 'b', send: "Okay. Team us {e:heart}" }] },
  ]),
  // a tells b, a friend they trust, that c is their {q}.
  ...E('kin.told', [
    { turns: [{ by: 'a', send: "Can I tell you something? You can't tell anyone" }, { by: 'b', send: "Of course. What's up?" }, { by: 'a', send: "{c} is my {q} {e:smile}" }, { by: 'b', react: "Shut UP." }] },
    { turns: [{ by: 'a', send: "Okay, I trust you, so here it is. {c} is my {q}" }, { by: 'b', send: "WAIT. Like, your actual {q}??" }, { by: 'a', send: "My actual {q} {e:laugh}" }] },
    { turns: [{ by: 'a', say: "I'm only telling one person.", send: "You're the only one I'm telling this to. {c} and I go way back. {c} is my {q}" }, { by: 'b', send: "Your secret's safe with me {e:handshake}" }] },
  ]),
  // a asks something only family (or an old friend) would know; b is behind the catfish.
  ...E('kin.test.admit', [
    { turns: [{ by: 'a', say: "Let's see if I'm right.", send: "Random question. What's my middle name?" },
      { by: 'b', react: "Oh no. Caught.", send: "Okay. It's me. Please don't tell ANYONE" }, { by: 'a', react: "I KNEW IT!" }] },
    { turns: [{ by: 'a', send: "Okay, weird one. Where did we spend last Thanksgiving?" },
      { by: 'b', send: "...How did you know?" }, { by: 'a', send: "Because I know you {e:laugh}" }, { by: 'b', send: "Okay. It's me. Secret alliance" }] },
    { turns: [{ by: 'a', say: "Only one person on earth knows this.", send: "Quick question. What was the name of my first pet?" },
      { by: 'b', say: "I can't lie to my {x}.", send: "Fine. It's me. Hi {e:smile}" }, { by: 'a', react: "Oh my God. Oh my God!" }] },
  ]),
  ...E('kin.test.dodge.warm', [
    { turns: [{ by: 'a', send: "Random question. What's my middle name?" },
      { by: 'b', send: "I have no idea what you're talking about lol" }, { by: 'b', say: "Abort. Abort." }, { by: 'a', react: "Oh, it's definitely you." }] },
    { turns: [{ by: 'a', send: "Okay, weird one. Where did we spend last Thanksgiving?" },
      { by: 'b', say: "Don't panic. Don't panic.", send: "That's a weird question {e:laugh}" }, { by: 'a', say: "Nice try. That's exactly what you'd say." }] },
    { turns: [{ by: 'a', send: "I know it's you. You can tell me" },
      { by: 'b', send: "Lol I think you've got me mixed up with someone" }, { by: 'a', say: "I know exactly who you are." }] },
  ]),
  ...E('kin.test.dodge.tense', [
    { turns: [{ by: 'a', send: "I know it's you. Don't even try" },
      { by: 'b', send: "Lol okay. Have a nice day {e:smile}" }, { by: 'a', say: "Same old. Never admits anything." }] },
    { turns: [{ by: 'a', say: "Let's see you squirm.", send: "So. Still never returning people's stuff" },
      { by: 'b', react: "Oh no. Oh no.", send: "Sorry, I think you have the wrong person" }, { by: 'a', react: "Right person. Definitely the right person." }] },
    { turns: [{ by: 'a', send: "You can hide behind that picture all you want. I know exactly who you are" },
      { by: 'b', send: "Cool story" }, { by: 'a', say: "Cool story. That's what my {q} always says." }] },
  ]),

  ...E('visit.kin.door.warm', [
    { turns: [{ by: 'a', react: "No. NO. It's YOU?" }, { by: 'b', react: "Surprise." }, { by: 'a', say: "My own {q}. The whole time." }], beat: '{a} and {b} grab each other and do not let go.' },
    { turns: [{ by: 'a', react: "Oh my God. Oh my God!" }, { by: 'a', say: "You were in here this whole time? My {q}?" }] },
    { turns: [{ by: 'b', say: "Hi. It's me." }, { by: 'a', react: "I'm going to cry. I'm actually crying." }] },
  ]),
  ...E('visit.kin.door.tense', [
    { turns: [{ by: 'a', react: "Oh, you have GOT to be kidding me." }, { by: 'a', say: "My {q}. Of all the doors." }] },
    { turns: [{ by: 'b', say: "Hi. Long time." }, { by: 'a', react: "Not long enough." }] },
    { turns: [{ by: 'a', react: "You. It was you." }, { by: 'b', say: "Yeah. Surprise." }], beat: 'Neither of them moves for a long moment.' },
  ]),

  ...E('visit.choose.crush', [
    { turns: [{ by: 'a', say: "There's one person I'd regret never meeting. I want to see if the spark is real." }] },
    { turns: [{ by: 'a', react: "If I'm leaving, I'm leaving with one real moment." }, { by: 'a', say: "I'm going to meet my crush. Obviously." }], beat: '{a} checks {a.posAdj} hair in the mirror twice.' },
    { turns: [{ by: 'a', say: "Forget the game. I'm going where my heart is." }] },
  ]),
  ...E('visit.talk.crush', [
    { turns: [{ by: 'a', say: "So. You're even better in person." }, { by: 'b', say: "Stop. I'm blushing. I'm literally blushing." }] },
    { turns: [{ by: 'b', say: "I can't believe you came to see me." }, { by: 'a', say: "Who else would I come to see?" }], beat: '{a} and {b} sit a little too close on the couch.' },
    { turns: [{ by: 'a', say: "I had to know if it was real." }, { by: 'b', say: "And?" }, { by: 'a', say: "It's real." }] },
  ]),
  ...E('visit.talk2.crush', [
    { turns: [{ by: 'a', say: "When this is over, I'm taking you on a real date." }, { by: 'b', say: "You'd better. I'm holding you to it." }] },
    { turns: [{ by: 'b', say: "It's going to be so weird in here without you." }, { by: 'a', say: "Then win, and come find me." }] },
    { turns: [{ by: 'a', say: "Don't forget about me in here." }, { by: 'b', say: "Forget you? You're all I'm going to think about." }] },
  ]),
  ...E('visit.choose.family', [
    { turns: [{ by: 'a', say: "There's somebody in there I'd walk through fire for. That's where I'm going." }] },
    { turns: [{ by: 'a', react: "Oh, I know exactly where I'm going." }, { by: 'a', say: "Some people you just have to hug before you go." }] },
    { turns: [{ by: 'a', say: "No strategy. No answers. I'm going to see my person." }], beat: '{a} is out the door in seconds.' },
  ]),
  ...E('visit.talk.family', [
    { turns: [{ by: 'a', say: "Whatever happens now, I'm so proud of you." }, { by: 'b', say: "Don't. You're going to make me cry." }] },
    { turns: [{ by: 'b', say: "I'm so sorry they got you." }, { by: 'a', say: "Don't be sorry. Be smart. You're still in." }] },
    { turns: [{ by: 'a', say: "You know you're the reason I lasted this long." }, { by: 'b', say: "We did it together. We always do." }] },
  ]),
  ...E('visit.talk2.family', [
    { turns: [{ by: 'a', say: "Watch out for everybody in there. Even the nice ones." }, { by: 'b', say: "I will. I've got you." }] },
    { turns: [{ by: 'b', say: "What do I tell everybody back home?" }, { by: 'a', say: "Tell them you're about to win." }] },
    { turns: [{ by: 'a', say: "Now you're playing for both of us." }, { by: 'b', say: "Then I'm not losing." }] },
  ]),

  // A kiss at the door (twotiming.js kissFallout). c kissed a on the way out.
  //   kiss.told           a tells b, a friend
  //   kiss.told.partner   a tells b — who is c's partner ({q}: what b calls c)
  //   kin.cheated.react   a (c's partner, {q}) finds out c kissed b
  ...E('kiss.told', [
    { turns: [{ by: 'a', send: "Okay I have to tell somebody. {c} kissed me at the door {e:hearteyes}" }, { by: 'b', send: "STOP. Kissed you??" }, { by: 'a', send: "On the way out. I'm still shaking" }] },
    { turns: [{ by: 'a', say: "I can't keep this in.", send: "Promise you won't tell anyone. {c} kissed me before leaving" }, { by: 'b', send: "Your secret's safe with me. Kind of {e:laugh}" }] },
    { turns: [{ by: 'a', send: "So {c}'s visit was... a lot" }, { by: 'b', send: "A lot how?" }, { by: 'a', send: "A kiss lot {e:fire}" }] },
  ]),
  ...E('kiss.told.partner', [
    { turns: [{ by: 'a', send: "I have to tell somebody. {c} kissed me at the door" }, { by: 'b', react: "Excuse me?" }, { by: 'b', say: "My {q}. My {q} kissed somebody on the way out." }], beat: '{b} puts the remote down very slowly.' },
    { turns: [{ by: 'a', send: "Okay this is crazy. {c} kissed me before leaving {e:hearteyes}" }, { by: 'b', react: "No. No, no, no." }, { by: 'b', send: "Can we talk later. I need a minute" }] },
    { turns: [{ by: 'a', send: "Guess who kissed me on the way out. {c}!" }, { by: 'b', react: "Oh my God." }, { by: 'b', say: "That's my {q}. That's my {q} they're talking about." }] },
  ]),
  // kiss.warn: a tells b that b's partner ({q}) kissed c at the door.
  ...E('kiss.warn', [
    { turns: [{ by: 'a', send: "I don't know how to say this. I'd want to know if it was me" }, { by: 'b', send: "Just say it" }, { by: 'a', send: "Your {q} kissed {c} at the door. I'm so sorry" }, { by: 'b', react: "No." }], beat: '{b} reads it twice, then a third time.' },
    { turns: [{ by: 'a', say: "This is going to hurt, but it's the right thing.", send: "You deserve to hear this from a friend. Your {q} and {c} kissed when your {q} left" }, { by: 'b', send: "Are you sure?" }, { by: 'a', send: "{c} told me. I'm sorry" }] },
    { turns: [{ by: 'a', send: "Can I tell you something you won't like?" }, { by: 'b', send: "...okay" }, { by: 'a', send: "{c} says your {q} kissed {c} at the door" }, { by: 'b', react: "Of course. Of course that happened." }] },
  ]),
  ...E('kin.cheated.react', [
    { turns: [{ by: 'a', react: "Hold on. {b} kissed {c}?" }, { by: 'a', say: "My {q}. On the way out. In front of the cameras." }], beat: '{a} sits down on the floor of the apartment.' },
    { turns: [{ by: 'a', say: "I heard what happened at {c}'s door." }, { by: 'a', say: "We're going to have a very long talk when I get out of here." }] },
    { turns: [{ by: 'a', react: "Wow. Okay." }, { by: 'a', say: "My {q} kissed somebody else, and I had to hear it from the Circle." }], beat: '{a} turns off the screen and stares at the wall.' },
  ]),
  ...E('goodbye.kin.open', [
    { turns: [{ by: 'a', video: "And {b}? My {q}. I love you. Go win this." }] },
    { turns: [{ by: 'a', video: "One last thing. {b} is my {q}. So whoever blocked me, good luck with that." }] },
    { turns: [{ by: 'a', video: "{b}, you know what you mean to me. Finish what we started." }] },
  ]),
  ...E('goodbye.kin.hidden', [
    { turns: [{ by: 'a', video: "And to someone in there who knows exactly who they are: I'm so proud of you. Keep going." }] },
    { turns: [{ by: 'a', video: "There's a person in there I'd do anything for. You know who you are. Win it." }] },
    { turns: [{ by: 'a', video: "To my secret in there: keep your head down. I love you." }] },
  ]),
  ...E('goodbye.kin.react', [
    { turns: [{ by: 'a', react: "That's my {q}. That's my {q}!" }, { by: 'a', say: "I'm doing this for both of us now." }], beat: '{a} wipes {a.posAdj} eyes with a sleeve.' },
    { turns: [{ by: 'a', say: "They took my {q} out. Okay. Now it's personal." }] },
    { turns: [{ by: 'a', react: "Oh, I'm not okay." }, { by: 'a', say: "I'm going to win this. For my {q}." }] },
  ]),
};
