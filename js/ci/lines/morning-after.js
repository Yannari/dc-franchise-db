// ══════════════════════════════════════════════════════════════════════
// ci/lines/morning-after.js — talking over what just happened
// ══════════════════════════════════════════════════════════════════════
//
// chat.js debriefTopic / conversation.js defend + debrief. Nothing here
// knows more than the two of them saw: the goodbye video, the blocking,
// the ratings board.
//   chat.defend.*            a = the one a goodbye warned about, b = who saw it,
//                            c = who made the warning (gone). warnKind: catfish | distrusts
//   chat.debrief.warning.*   c = the one warned about. agree: a buys it; doubt: a doesn't.
//                            warm: b comes round; cold: b won't
//   chat.debrief.blocked.*   c = who was blocked this morning (gone)
//   chat.debrief.ratings.*   c = who came first last night
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const CF = { warnKind: 'catfish' };
const DT = { warnKind: 'distrusts' };

export const MORNING_AFTER = {
  // ── The accused sets it straight ──────────────────────────────────────
  ...E('chat.defend.warm', [
    { turns: [
      { by: 'a', send: "I know how that goodbye message sounded. Can I tell you my side?" },
      { by: 'b', send: "Of course. I'd rather hear it from you" },
      { by: 'a', send: "{c} was hurt and I was the closest target. That's really all it was" },
      { by: 'b', send: "That makes sense. We're good {e:heart}" },
    ] },
    { turns: [
      { by: 'a', say: "If {b} believes me, I'm okay. {b} is the one who matters.", send: "Are we good after this morning?" },
      { by: 'b', send: "We're good. A goodbye video doesn't know you like I do" },
      { by: 'a', react: "Okay. I can breathe again." },
    ] },
    { when: CF, turns: [
      { by: 'a', say: "I have to get ahead of this before it spreads.", send: "Okay I have to ask. You don't actually think I'm a catfish, right?" },
      { by: 'b', send: "Honestly? No. {c} was hurt and wanted to hit somebody on the way out" },
      { by: 'a', react: "Thank God.", send: "Thank you. I'm exactly who I said I am {e:pray}" },
    ], beat: '{a} lets out a breath that has been held since the video.' },
    { when: CF, turns: [
      { by: 'a', send: "So that goodbye message was a lot {e:sweat}" },
      { by: 'b', react: "Here we go.", send: "It was! Are you okay?" },
      { by: 'a', send: "I'm real. I promise you I'm real. Ask me anything" },
      { by: 'b', send: "I don't need to. I believe you {e:heart}" },
    ] },
    { when: DT, turns: [
      { by: 'a', say: "Not as nice as my messages? Okay, {c}.", send: "Can we talk about what {c} said about me?" },
      { by: 'b', send: "Of course. I didn't love it either" },
      { by: 'a', send: "I've been the same person with you since day one. That's all I want you to know" },
      { by: 'b', send: "I know you have. I'm not going anywhere {e:hug}" },
    ], beat: '{a} smiles at the screen and wipes one eye.' },
    { when: DT, turns: [
      { by: 'a', send: "Be honest. Did that video change how you see me?" },
      { by: 'b', react: "Okay, this is serious.", send: "No. {c} was upset. People say things when they leave" },
      { by: 'a', send: "That means a lot. I was scared you'd go quiet on me" },
    ] },
    { turns: [
      { by: 'a', say: "The video went out to everybody. The fix has to go one person at a time.", send: "I just want to clear the air after that goodbye message" },
      { by: 'b', send: "Consider it cleared. I make up my own mind" },
      { by: 'a', send: "That's why I came to you first {e:handshake}" },
    ] },
  ]),
  ...E('chat.defend.neutral', [
    { turns: [
      { by: 'a', send: "I didn't deserve that goodbye message. Just saying" },
      { by: 'b', send: "Maybe not. I'm not taking sides yet" },
      { by: 'a', react: "Yet. Everything in here is 'yet'." },
    ] },
    { when: CF, turns: [
      { by: 'a', send: "Just so you know, I'm real. Whatever {c} said" },
      { by: 'b', react: "That's what a catfish would say.", send: "Okay! Noted {e:smile}" },
    ], beat: '{a} stares at "Noted" for a long time.' },
    { turns: [
      { by: 'a', send: "Hey, about that goodbye video. I promise it's not what it sounded like" },
      { by: 'b', send: "I hear you. I'm gonna keep an open mind" },
      { by: 'a', react: "An open mind. That's not a yes." },
    ] },
    { when: DT, turns: [
      { by: 'a', send: "I hope you don't believe what {c} said about me" },
      { by: 'b', react: "I don't know what I believe.", send: "I'm still taking it all in honestly" },
      { by: 'a', send: "That's fair. Talk to me before you decide anything?" },
      { by: 'b', send: "I will" },
    ] },
    { turns: [
      { by: 'a', say: "Keep it light. Don't look desperate.", send: "So that goodbye was dramatic lol" },
      { by: 'b', send: "Very dramatic. We'll see I guess" },
    ], beat: '{a} reads "we\'ll see" three times out loud.' },
  ]),
  ...E('chat.defend.cold', [
    { turns: [
      { by: 'a', send: "I've been thinking about that goodbye all morning. It's just not true" },
      { by: 'b', send: "You've been thinking about it all morning? That's a lot of thinking" },
      { by: 'a', send: "Because it's my name on it!" },
      { by: 'b', react: "Defensive. Very defensive." },
    ] },
    { when: CF, turns: [
      { by: 'a', send: "I need you to know I'm NOT a catfish. {c} has no idea what's real in here" },
      { by: 'b', react: "Why is this the first thing you send me?", send: "That's a lot of capital letters for somebody with nothing to hide" },
      { by: 'a', react: "Oh no. Oh, that backfired.", send: "I'm just upset!" },
    ], beat: '{b} leans back and folds {b.posAdj} arms.' },
    { turns: [
      { by: 'a', send: "Please don't listen to that goodbye video" },
      { by: 'b', send: "Why are you so worried about it?" },
      { by: 'a', send: "Because it's not true!" },
      { by: 'b', react: "That's exactly what worried people say.", send: "Okay. We'll see" },
    ] },
    { when: DT, turns: [
      { by: 'a', send: "{c} was bitter. You know that, right?" },
      { by: 'b', react: "Or {c} saw something I didn't.", send: "Maybe. Or maybe {c} had a point" },
      { by: 'a', send: "Wow. Okay. Good to know where I stand" },
    ] },
    { turns: [
      { by: 'a', say: "Damage control. Go.", send: "Hey!! Just checking we're good after this morning {e:smile}" },
      { by: 'b', react: "Damage control. I see you.", send: "Why wouldn't we be?" },
      { by: 'a', react: "That was a trap. I walked right into it." },
    ] },
  ]),

  // ── Comparing notes on a goodbye warning ─────────────────────────────
  ...E('chat.debrief.warning.agree.warm', [
    { turns: [
      { by: 'a', say: "I need to know I'm not the only one.", send: "Okay, I'm just going to say it. I think {c} got called out for a reason" },
      { by: 'b', send: "I've been thinking the exact same thing" },
      { by: 'a', send: "Okay. Then we watch together {e:eyes}" },
    ] },
    { turns: [
      { by: 'a', send: "That goodbye made me rethink a few chats I've had with {c}" },
      { by: 'b', send: "Same here. Some of it reads different now" },
      { by: 'a', send: "Let's compare notes before the ratings" },
      { by: 'b', send: "Deal" },
    ] },
    { when: CF, turns: [
      { by: 'a', say: "{c} a catfish? Honestly, it would explain a lot.", send: "So. That goodbye message about {c}" },
      { by: 'b', send: "I KNOW. I've had a weird feeling for days" },
      { by: 'a', send: "Same!! Nobody's that perfect in every picture" },
      { by: 'b', send: "We keep this between us and we watch {c} {e:detective}" },
    ], beat: '{a} sits up straighter. Finally, somebody else sees it.' },
    { when: CF, turns: [
      { by: 'a', send: "Do you believe what {c} got called in that video?" },
      { by: 'b', send: "Kind of? The answers have always been a little off" },
      { by: 'a', send: "Thank you! I thought I was going crazy" },
    ] },
    { when: DT, turns: [
      { by: 'a', send: "Okay be honest. What did you think when {c} came up in that video?" },
      { by: 'b', send: "That I wasn't surprised. {c} talks sweet and plays hard" },
      { by: 'a', send: "Exactly. I'm watching every message now" },
      { by: 'b', send: "Me too. Let's tell each other if we see anything {e:eyes}" },
    ] },
    { when: DT, turns: [
      { by: 'a', say: "People don't use their last words on nothing.", send: "Goodbye messages don't lie. Somebody's last chance to warn us went to {c}" },
      { by: 'b', send: "That stuck with me too. Why that name of all the names?" },
      { by: 'a', send: "Exactly my question {e:think}" },
    ] },
    { turns: [
      { by: 'a', send: "That video was a wake-up call about {c}" },
      { by: 'b', send: "Honestly it confirmed a few things for me" },
      { by: 'a', send: "Okay good. I'm glad I'm not alone in this" },
    ] },
  ]),
  ...E('chat.debrief.warning.agree.cold', [
    { turns: [
      { by: 'a', send: "That goodbye made a lot of sense about {c}, didn't it?" },
      { by: 'b', send: "Did it? Seemed bitter to me" },
      { by: 'a', send: "Bitter people can still be right" },
      { by: 'b', send: "And they can still be bitter. I'm staying out of it" },
    ] },
    { when: CF, turns: [
      { by: 'a', send: "So we all agree {c} is a catfish now, right?" },
      { by: 'b', react: "Nope. Not doing this.", send: "No? One bitter goodbye doesn't make anybody a catfish" },
      { by: 'a', react: "Okay. Wrong person to ask.", send: "Fair. Just a thought" },
    ], beat: '{a} closes the chat a little too fast.' },
    { turns: [
      { by: 'a', send: "Kind of feels like that video exposed {c}" },
      { by: 'b', send: "Or it exposed somebody who was mad about getting blocked" },
      { by: 'a', react: "So {b} is team {c}. Noted." },
    ] },
    { when: DT, turns: [
      { by: 'a', send: "I'm keeping my distance from {c} after that message" },
      { by: 'b', send: "Honestly {c} has only been good to me. I'm not dropping anybody over a goodbye video" },
      { by: 'a', send: "Okay, your call" },
    ] },
    { turns: [
      { by: 'a', say: "Test the water.", send: "Did that goodbye change how you see {c}?" },
      { by: 'b', send: "Not even a little. Why, did it change it for you?" },
      { by: 'a', react: "And now I look like the one stirring things up." },
    ] },
  ]),
  ...E('chat.debrief.warning.doubt.warm', [
    { turns: [
      { by: 'a', send: "I really hope people don't freeze out {c} after that video" },
      { by: 'b', send: "I won't. Somebody who got blocked doesn't get to pick who we trust" },
      { by: 'a', send: "Exactly what I was thinking {e:heart}" },
    ] },
    { when: CF, turns: [
      { by: 'a', send: "Can we talk about how unfair that goodbye was to {c}?" },
      { by: 'b', send: "YES. Calling somebody a catfish on the way out is so easy" },
      { by: 'a', send: "{c} has been nothing but real with me" },
      { by: 'b', send: "Same. I'm not letting one video change that {e:heart}" },
    ], beat: '{b} nods at the screen like {a} can see it.' },
    { when: DT, turns: [
      { by: 'a', send: "Honestly that message about {c} felt like sour grapes" },
      { by: 'b', send: "Right? {c} was upset about getting blocked, that's all that was" },
      { by: 'a', send: "Glad we're on the same page {e:handshake}" },
    ] },
    { turns: [
      { by: 'a', say: "Somebody has to say it.", send: "I don't buy that goodbye message at all" },
      { by: 'b', send: "Me neither. It was a parting shot, not a warning" },
      { by: 'a', send: "Exactly. Let's not let a blocked player run the game from outside" },
    ] },
    { turns: [
      { by: 'a', send: "Is it just me or was that goodbye a little petty?" },
      { by: 'b', send: "Not just you lol. {c} didn't deserve that" },
      { by: 'a', send: "Okay good, I needed to hear that {e:laugh}" },
    ] },
    { when: CF, turns: [
      { by: 'a', send: "I've talked to {c} every day. That's not a catfish" },
      { by: 'b', send: "Agreed. Some people just look good in pictures {e:laugh}" },
      { by: 'a', send: "Lol exactly" },
    ] },
  ]),
  ...E('chat.debrief.warning.doubt.cold', [
    { turns: [
      { by: 'a', send: "I feel bad for {c} after that goodbye" },
      { by: 'b', send: "I don't. I think it was fair" },
      { by: 'a', send: "Fair? Based on what?" },
      { by: 'b', send: "Based on what I've seen. Let's just leave it there" },
    ] },
    { turns: [
      { by: 'a', send: "That goodbye about {c} was so unfair, right?" },
      { by: 'b', react: "Was it though?", send: "I don't know. Something made {c} say it" },
      { by: 'a', react: "Oh. So {b} believes it." },
    ], beat: 'Neither of them types anything for a while.' },
    { when: CF, turns: [
      { by: 'a', send: "I really don't think {c} is a catfish" },
      { by: 'b', send: "You might be the only one left who thinks that" },
      { by: 'a', send: "Okay. Good to know" },
    ] },
    { when: DT, turns: [
      { by: 'a', send: "Let's not turn on {c} because of one video" },
      { by: 'b', send: "It's not one video for me. It's a pattern" },
      { by: 'a', react: "A pattern? What pattern?" },
      { by: 'b', send: "I'll tell you when I'm sure" },
    ] },
    { turns: [
      { by: 'a', say: "Stand up for {c}. Somebody should.", send: "I'm defending {c} on this one" },
      { by: 'b', send: "That's your choice. I'm keeping my eyes open" },
    ] },
  ]),
  ...E('chat.debrief.warning.neutral', [
    { turns: [
      { by: 'a', send: "Thoughts on the {c} part of that goodbye?" },
      { by: 'b', send: "I honestly don't know what to think yet" },
      { by: 'a', send: "Same. Let's both just watch" },
    ] },
    { turns: [
      { by: 'a', send: "That video. {c}. Discuss {e:eyes}" },
      { by: 'b', send: "Lol I'm still processing" },
    ], beat: '{a} waits for a second message that does not come.' },
    { turns: [
      { by: 'a', say: "Everybody's going to be weird with {c} today.", send: "Are you gonna treat {c} any different after that?" },
      { by: 'b', send: "I'm gonna be careful. That's all" },
      { by: 'a', send: "Careful is smart" },
    ] },
    { turns: [
      { by: 'a', send: "Do you think there was anything to what was said about {c}?" },
      { by: 'b', send: "Maybe. Maybe not. Goodbyes are emotional" },
    ] },
  ]),

  // ── The one who was blocked this morning ─────────────────────────────
  ...E('chat.debrief.blocked.warm', [
    { turns: [
      { by: 'a', say: "The building's quieter without {c}. I don't like it.", send: "I can't believe {c} is gone" },
      { by: 'b', send: "Me neither. {c} was one of the good ones" },
      { by: 'a', send: "We have to look out for each other now. Whoever did that is coming for {c}'s people next" },
      { by: 'b', send: "Deal. You and me {e:handshake}" },
    ], beat: '{a} taps the table twice, like sealing something.' },
    { turns: [
      { by: 'a', send: "That blocking hurt. {c} didn't deserve that" },
      { by: 'b', send: "It really did. I keep looking at the empty spot in the chat" },
      { by: 'a', send: "Let's play for {c} now" },
      { by: 'b', send: "For {c} {e:heart}" },
    ] },
    { turns: [
      { by: 'a', send: "Okay real talk. Why do you think it was {c}?" },
      { by: 'b', send: "Because {c} was getting too close to too many people" },
      { by: 'a', send: "Which means people like us are next. We stay tight" },
      { by: 'b', send: "Agreed {e:muscle}" },
    ] },
    { turns: [
      { by: 'a', say: "Whoever had the power last night, I'm remembering it.", send: "We need to remember who had the power last night" },
      { by: 'b', send: "Oh I remember. Trust me" },
      { by: 'a', send: "Good. Because they'll have it again" },
    ] },
    { turns: [
      { by: 'a', send: "I miss {c} already. Is that crazy? We never even met" },
      { by: 'b', send: "Not crazy. I feel it too" },
      { by: 'a', send: "Okay. At least I've still got you {e:hug}" },
    ] },
  ]),
  ...E('chat.debrief.blocked.neutral', [
    { turns: [
      { by: 'a', send: "Crazy morning huh. {c}, gone" },
      { by: 'b', send: "Crazy. On to the next one I guess" },
    ] },
    { turns: [
      { by: 'a', send: "Did you see {c} getting blocked coming?" },
      { by: 'b', send: "Kind of? Kind of not. It's always somebody" },
      { by: 'a', send: "True. Today it was {c}" },
    ] },
    { turns: [
      { by: 'a', say: "One less person. Everybody's doing the math today.", send: "So who do you think is next after {c}?" },
      { by: 'b', send: "Honestly I'm just trying to make sure it's not me" },
    ] },
    { turns: [
      { by: 'a', send: "Weird energy in here without {c}" },
      { by: 'b', send: "It'll settle down. It always does" },
    ] },
  ]),
  ...E('chat.debrief.blocked.cold', [
    { turns: [
      { by: 'a', send: "Still can't believe they blocked {c}" },
      { by: 'b', react: "I can.", send: "Honestly? It made sense to me" },
      { by: 'a', react: "Made sense. Wow." },
    ], beat: '{a} logs off the chat and stares at the ceiling.' },
    { turns: [
      { by: 'a', send: "We lost a good one this morning" },
      { by: 'b', send: "Did we though? {c} and I never really clicked" },
      { by: 'a', send: "Okay. Well I miss {c}" },
    ] },
    { turns: [
      { by: 'a', say: "Find out if {b} is grieving or celebrating.", send: "How are you feeling about {c} going home?" },
      { by: 'b', send: "Fine honestly. It's a game" },
      { by: 'a', react: "Celebrating. Noted." },
    ] },
    { turns: [
      { by: 'a', send: "{c} was my friend in here, so this one hurts" },
      { by: 'b', send: "I'm sorry. I wasn't close with {c} so I can't really feel it" },
      { by: 'a', send: "Yeah. I get it" },
    ] },
  ]),

  // ── The ratings board: who came first ────────────────────────────────
  ...E('chat.debrief.ratings.warm', [
    { turns: [
      { by: 'a', say: "{c} at the top again. That's not luck anymore.", send: "Can we talk about {c} being first?" },
      { by: 'b', send: "I was literally about to message you about that" },
      { by: 'a', send: "Everybody loves {c}. That's exactly what makes {c} dangerous" },
      { by: 'b', send: "We have to think about that before the next ratings {e:think}" },
    ], beat: '{a} writes "{c}" on the notepad and circles it twice.' },
    { turns: [
      { by: 'a', send: "{c} came first last night. Did that surprise you?" },
      { by: 'b', send: "Not really. {c} talks to everybody" },
      { by: 'a', send: "If {c} keeps winning, the rest of us are fighting for second" },
      { by: 'b', send: "Not if we're smart about it {e:eyes}" },
    ] },
    { turns: [
      { by: 'a', say: "Number one is the most dangerous place in this building.", send: "Being first in this game is a target, right?" },
      { by: 'b', send: "Huge target. And {c} is wearing it" },
      { by: 'a', send: "So we just let everybody else notice {e:wink}" },
    ] },
    { turns: [
      { by: 'a', send: "Okay so how is {c} first? What am I missing?" },
      { by: 'b', send: "Lol I don't know either. But we should both keep an eye on it" },
      { by: 'a', send: "Eyes open. Always" },
    ] },
  ]),
  ...E('chat.debrief.ratings.neutral', [
    { turns: [
      { by: 'a', send: "{c} first, huh?" },
      { by: 'b', send: "Yep. Good for {c} I guess" },
    ] },
    { turns: [
      { by: 'a', send: "What did you think of the ratings last night?" },
      { by: 'b', send: "Not many surprises. {c} on top made sense" },
      { by: 'a', send: "Yeah. Made sense" },
    ], beat: '{a} does not sound like it made sense.' },
    { turns: [
      { by: 'a', say: "Find out if {b} is worried about {c}.", send: "Does {c} being first worry you at all?" },
      { by: 'b', send: "Not yet. Ask me again next week" },
    ] },
    { turns: [
      { by: 'a', send: "Where did you end up last night? I was in the middle" },
      { by: 'b', send: "Same, kind of. {c} ran away with it" },
    ] },
  ]),
  ...E('chat.debrief.ratings.cold', [
    { turns: [
      { by: 'a', send: "{c} first again. Kind of suspicious, no?" },
      { by: 'b', react: "{c} is my friend. Careful.", send: "Not suspicious. People just like {c}" },
      { by: 'a', react: "And I just told {c}'s friend I'm watching {c}. Great." },
    ], beat: '{a} drops {a.posAdj} face into {a.posAdj} hands.' },
    { turns: [
      { by: 'a', send: "Somebody needs to slow {c} down" },
      { by: 'b', send: "Why? {c} hasn't done anything to you" },
      { by: 'a', send: "Not yet" },
      { by: 'b', send: "That's a little paranoid honestly" },
    ] },
    { turns: [
      { by: 'a', say: "Let's see whose side {b} is on.", send: "Don't you think {c} has too many friends in here?" },
      { by: 'b', send: "I'm one of them. So no" },
      { by: 'a', react: "Wrong door. Wrong door." },
    ] },
    { turns: [
      { by: 'a', send: "Not to be shady but how is {c} number one?" },
      { by: 'b', send: "Because {c} is nice to people? Maybe try it {e:laugh}" },
      { by: 'a', react: "Okay, that one stung." },
    ] },
  ]),
};
