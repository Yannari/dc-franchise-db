// ══════════════════════════════════════════════════════════════════════
// ci/lines/groupchats.js — the group chats that are not alliances
// ══════════════════════════════════════════════════════════════════════
//
// groupchats.js. {game} is the squad's name, as its founder typed it.
//   group.squad.open     a starts it and names it; b and c join
//   group.squad.banter   a and b in it; c started it
//   group.squad.share    a passes on what they heard about c; b reacts
//   group.peace.open     a brings b and c (who resent each other) into one chat
//   group.peace.*        a and b talk it out; c is the peacemaker
//   group.plan.pitch     a gathers b (and one more) and names c for the bottom
//   group.plan.agree / .decline   a (asked) answers b (who asked) about c
//   group.plan.seal      a (who asked) and b (who agreed) lock it in
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const GROUPCHAT_LINES = {
  // ── A friend group ───────────────────────────────────────────────────
  ...E('group.squad.open', [
    { turns: [
      { by: 'a', say: "Circle, start a group chat with {b} and {c}. Call it {game}.", send: "Welcome to {game} {e:sparkle} No strategy allowed. Just vibes" },
      { by: 'b', react: "Oh, I love this already.", send: "FINALLY. I needed this today" },
      { by: 'c', send: "Okay I'm obsessed with the name {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', say: "Every building needs a group chat that's just for fun.", send: "Hi besties! This is {game}. Rule number one: we laugh at everything" },
      { by: 'c', send: "Rule number two: we don't talk about the ratings in here {e:laugh}" },
      { by: 'b', send: "I accept these rules" },
    ] },
    { turns: [
      { by: 'a', send: "Okay I made us a chat. {game}. Because we are the funniest people in here and it's not close" },
      { by: 'b', send: "Not even close lol" },
      { by: 'c', react: "I've been invited somewhere fun. Finally.", send: "Honored to be here {e:crown}" },
    ], beat: '{b} does a little dance in the apartment.' },
    { turns: [
      { by: 'a', say: "{game}. That's the name. Don't argue with me, Circle.", send: "Welcome to {game}!! I needed my people in one place" },
      { by: 'b', send: "Your people? I'm crying {e:cry}" },
      { by: 'c', send: "We're your people. Done. Official" },
    ] },
    { turns: [
      { by: 'a', send: "New chat! {game}. Good energy only" },
      { by: 'c', send: "Only good energy. I'm in" },
      { by: 'b', send: "This is the best invite I've gotten in here {e:heart}" },
    ] },
    { turns: [
      { by: 'a', say: "I just want a place to talk without anybody playing the game for five minutes.", send: "Hey you two. I made {game} so we have one chat with zero pressure" },
      { by: 'b', send: "Zero pressure sounds amazing right now" },
      { by: 'c', send: "Can we stay in here forever?" },
      { by: 'a', send: "That's the plan {e:hug}" },
    ] },
  ]),
  ...E('group.squad.banter', [
    { turns: [
      { by: 'a', send: "Okay who else talks to the TV in here, because I do it all day" },
      { by: 'b', send: "All day. I said good morning to it today" },
      { by: 'c', send: "The Circle is my roommate now lol" },
    ] },
    { turns: [
      { by: 'a', send: "Rate your day from one to ten. I'm a six. I burned toast" },
      { by: 'b', send: "Seven. Nobody's mad at me yet {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', send: "What's everybody wearing right now? Be honest" },
      { by: 'b', send: "Pajamas since this morning. No regrets" },
      { by: 'c', send: "Same. We're a pajama chat now" },
    ] },
    { turns: [
      { by: 'a', send: "Real question. If you could have one snack delivered right now what would it be?" },
      { by: 'b', send: "Tacos. No hesitation" },
      { by: 'a', send: "Tacos is the correct answer" },
    ] },
    { turns: [
      { by: 'a', send: "I love this chat. This is the only place I can breathe in here" },
      { by: 'b', send: "Same. Everywhere else feels like a test" },
      { by: 'c', send: "Okay group hug through the screen {e:hug}" },
    ], beat: '{a} hugs a pillow, for the group.' },
    { turns: [
      { by: 'a', say: "Small talk. Beautiful, harmless small talk.", send: "Okay what's everybody's go-to karaoke song?" },
      { by: 'b', send: "Anything with a key change. I need drama" },
    ] },
  ]),
  ...E('group.squad.share', [
    { turns: [
      { by: 'a', say: "This chat is safe. I can say it here.", send: "Okay I'm only telling you guys this. I heard something about {c}" },
      { by: 'b', send: "Wait what?? Tell us" },
      { by: 'a', send: "I'll message you the details. But just keep an eye out" },
    ] },
    { turns: [
      { by: 'a', send: "Quick tea before we go back to being cute. Watch {c}" },
      { by: 'b', react: "Well, that changes the mood.", send: "Noted. Thank you for telling us" },
    ] },
    { turns: [
      { by: 'a', send: "I trust you guys so I'll just say it. {c} came up in a conversation I had and it wasn't great" },
      { by: 'b', send: "Okay that's good to know. We look out for each other in here" },
    ] },
    { turns: [
      { by: 'a', send: "Can I say one game thing? Just one?" },
      { by: 'b', send: "One. Go" },
      { by: 'a', send: "Be careful what you tell {c}" },
      { by: 'b', send: "Oh. Okay. Got it {e:eyes}" },
    ] },
  ]),

  // ── Clearing the air ─────────────────────────────────────────────────
  ...E('group.peace.open', [
    { turns: [
      { by: 'a', say: "Circle, start a group chat with {b} and {c}. This is sticky.", send: "Hi you two. I care about both of you, and I hate that you're fighting" },
      { by: 'b', react: "Oh no. Not this.", send: "Okay... hi" },
      { by: 'c', react: "A group chat with {b}? Great.", send: "Hey" },
    ] },
    { turns: [
      { by: 'a', send: "I brought you both here because I think this is a misunderstanding" },
      { by: 'c', send: "Is it though" },
      { by: 'a', send: "Let's find out. Five minutes. Please {e:pray}" },
    ] },
    { turns: [
      { by: 'a', say: "Either this fixes it or I'm about to make two enemies.", send: "Okay. I love you both. You two need to talk" },
      { by: 'b', send: "I'm willing if {c} is" },
      { by: 'c', send: "Fine. I'm here" },
    ] },
    { turns: [
      { by: 'a', send: "No ratings talk, no game talk. Just the three of us clearing the air" },
      { by: 'b', send: "Okay. I can do that" },
    ], beat: '{c} reads the invite twice before opening it.' },
    { turns: [
      { by: 'a', send: "I'm not picking sides. I just think you'd get along if you actually talked" },
      { by: 'c', react: "Get along with {b}. Sure.", send: "We'll see" },
    ] },
  ]),
  ...E('group.peace.warm', [
    { turns: [
      { by: 'a', send: "Honestly? I think I came at you wrong. I'm sorry" },
      { by: 'b', react: "Oh. Okay. I didn't expect that.", send: "I'm sorry too. I think we both got in our heads" },
      { by: 'c', send: "Look at you two {e:cry} Proud of you" },
    ], beat: '{c} throws both arms in the air, alone in the apartment.' },
    { turns: [
      { by: 'a', send: "Clean slate?" },
      { by: 'b', send: "Clean slate. For real this time" },
      { by: 'c', send: "This is the best thing that's happened in here all week" },
    ] },
    { turns: [
      { by: 'a', send: "I think I judged you before I knew you" },
      { by: 'b', send: "Same. Can we start over?" },
      { by: 'a', send: "Yeah. I'd like that {e:handshake}" },
    ] },
    { turns: [
      { by: 'a', say: "Swallow the pride. Just do it.", send: "Okay. I was wrong about you. There, I said it" },
      { by: 'b', send: "That took guts. Thank you. I was a little wrong too" },
      { by: 'c', send: "Peace in The Circle {e:handshake}" },
    ] },
  ]),
  ...E('group.peace.neutral', [
    { turns: [
      { by: 'a', send: "Okay. I'll try to see it from your side" },
      { by: 'b', send: "Same. No promises though" },
      { by: 'c', send: "Hey, that's progress" },
    ] },
    { turns: [
      { by: 'a', send: "We don't have to be best friends. Just not enemies" },
      { by: 'b', send: "I can live with that" },
    ], beat: 'Nobody types for a long moment.' },
    { turns: [
      { by: 'a', send: "Thanks for trying, {c}. Really" },
      { by: 'b', send: "Yeah. It's a start" },
      { by: 'c', send: "A start is all I wanted" },
    ] },
    { turns: [
      { by: 'a', say: "Civil. I can be civil.", send: "I'm willing to drop it if you are" },
      { by: 'b', send: "Dropped. Mostly" },
    ] },
  ]),
  ...E('group.peace.cold', [
    { turns: [
      { by: 'a', send: "Honestly I don't think I owe anybody an apology" },
      { by: 'b', send: "Wow. Then why are we even here" },
      { by: 'c', react: "This is going so badly.", send: "Guys. Please" },
    ], beat: '{c} puts both hands over {c.posAdj} face.' },
    { turns: [
      { by: 'a', send: "With respect, {c}, this is between me and {b}" },
      { by: 'b', send: "Agreed. And I'm done talking about it" },
      { by: 'c', react: "So now they're both mad at me. Amazing." },
    ] },
    { turns: [
      { by: 'a', send: "I came in here with an open mind and that lasted one message" },
      { by: 'b', send: "Same. Some people don't change" },
    ] },
    { turns: [
      { by: 'a', say: "Nope. I'm not faking a truce.", send: "I'm not going to pretend we're fine" },
      { by: 'b', send: "Good. Neither am I" },
      { by: 'c', send: "Okay. Well. I tried" },
    ] },
    { turns: [
      { by: 'a', send: "So {c} set this up so you could ambush me? Cool" },
      { by: 'c', send: "That's not what this is!" },
      { by: 'b', send: "It kind of feels like it now" },
    ] },
  ]),

  // ── A plan for the ratings ───────────────────────────────────────────
  ...E('group.plan.pitch', [
    { turns: [
      { by: 'a', say: "It's game time. I need numbers.", send: "Okay you two. Ratings are tonight. Can we talk about {c}?" },
      { by: 'b', send: "I'm listening" },
      { by: 'a', send: "If the three of us put {c} at the bottom, {c} is in trouble" },
    ] },
    { turns: [
      { by: 'a', send: "Real talk, no feelings. Who's the biggest threat in here?" },
      { by: 'b', react: "Straight to business.", send: "You first" },
      { by: 'a', send: "{c}. Everybody likes {c}, and that's exactly the problem. I want {c} low tonight" },
    ] },
    { turns: [
      { by: 'a', say: "I'm only bringing in people I trust.", send: "I made this chat because I trust you both. I think {c} is playing everyone" },
      { by: 'b', send: "Okay. Why {c}?" },
      { by: 'a', send: "Too many friends, and every one of them thinks they're number one" },
    ] },
    { turns: [
      { by: 'a', send: "Before tonight. I want {c} at the bottom of all three of our lists" },
      { by: 'b', send: "That's bold. Say more" },
      { by: 'a', send: "Three low ratings in one night and {c} is gone from the top. That's it" },
    ] },
    { turns: [
      { by: 'a', send: "Quick question before tonight. Do we want {c} as an Influencer?" },
      { by: 'b', react: "Where is this going?", send: "Go on" },
      { by: 'a', send: "Because I don't. And if we all rate {c} low, it doesn't happen" },
    ] },
  ]),
  ...E('group.plan.agree', [
    { turns: [
      { by: 'a', send: "I'm in. {c} at the bottom" },
      { by: 'b', send: "Love that {e:handshake}" },
    ] },
    { turns: [
      { by: 'a', say: "Honestly, I was thinking the same thing.", send: "Done. I've had a feeling about {c} for days" },
    ] },
    { turns: [
      { by: 'a', send: "Okay. I don't love it but it makes sense. I'm in" },
      { by: 'b', send: "That's all I need" },
    ] },
    { turns: [
      { by: 'a', send: "Say less. {c} goes low" },
    ], beat: '{a} cracks {a.posAdj} knuckles at the screen.' },
    { turns: [
      { by: 'a', send: "Count me in. And nobody hears about this chat" },
      { by: 'b', send: "Nobody. Ever {e:detective}" },
    ] },
  ]),
  ...E('group.plan.decline', [
    { turns: [
      { by: 'a', react: "Oh, I don't want to be part of this.", send: "I'm gonna rate how I rate. Sorry" },
      { by: 'b', react: "Okay. That was a risk.", send: "Totally fine. Forget I said anything" },
    ], beat: '{a} sits back, holding something now that {a.sub} didn\'t want.' },
    { turns: [
      { by: 'a', send: "{c} has been good to me. I can't do that" },
      { by: 'b', send: "Okay. No hard feelings" },
      { by: 'a', react: "There are definitely hard feelings." },
    ] },
    { turns: [
      { by: 'a', send: "I'm not comfortable ganging up on anybody" },
      { by: 'b', send: "It's not ganging up, it's strategy" },
      { by: 'a', send: "Same thing from where I'm sitting" },
    ] },
    { turns: [
      { by: 'a', say: "Now I know there's a plan. That's worth something.", send: "I'll think about it" },
      { by: 'b', react: "That's a no.", send: "Sure. Think about it" },
    ] },
    { turns: [
      { by: 'a', send: "Not for me, sorry. I like to keep my ratings my own" },
      { by: 'b', send: "Respect. Just keep it in this chat, okay?" },
      { by: 'a', send: "Of course" },
    ] },
  ]),
  ...E('group.plan.seal', [
    { turns: [
      { by: 'a', send: "Okay. Tonight, {c} goes low. Nobody breaks" },
      { by: 'b', send: "Nobody breaks {e:muscle}" },
    ], beat: '{a} leans back and smiles at the ceiling.' },
    { turns: [
      { by: 'a', say: "That's how you play this game.", send: "Love doing business with you" },
      { by: 'b', send: "Same time next ratings? {e:wink}" },
      { by: 'a', send: "Same time next ratings" },
    ] },
    { turns: [
      { by: 'a', send: "Deleting this from my memory now. See you at the ratings" },
      { by: 'b', send: "What chat? Lol" },
    ] },
    { turns: [
      { by: 'a', send: "Okay. We stick to this. Good luck tonight" },
      { by: 'b', send: "Good luck. We've got this" },
    ] },
  ]),
};
