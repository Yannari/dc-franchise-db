// ══════════════════════════════════════════════════════════════════════
// ci/lines/alliances.js — group chats, alliance names, betrayal
// ══════════════════════════════════════════════════════════════════════
//
// alliances.js decides who is asked, who joins, the name and the target.
//   group.form.pitch     a opens a group chat with b and c and pitches it
//   group.form.name      a names it {game}; b and c (who joined) answer
//   group.form.declined  b (asked) says no, a takes it in
//   group.form.fizzle    a, when nobody joined
//   group.check.open     a, b, c, the alliance {game} checking in
//   group.check.share    a passes on what they heard to b
//   group.check.plan     a and b agree to rate c low
//   alliance.betrayed    a (in {game}) about b, who blocked c, one of their own
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

// The ways it comes apart:
//   group.kick              a (for the group) votes b out of {game}: the ratings looked like treason
//   group.confront.out/.stay a confronts b, caught in another alliance ({q}); out, or forgiven
//   group.leave             a walks out of {game}; b is who they tell
export const ALLIANCE_LINES = {
  // The ratings, when the alliance is the reason (ratings.js voterScore).
  ...E('rate.alliance.top', [
    { turns: [{ by: 'a', say: "{b} is in my alliance. Top of my list, no question." }] },
    { turns: [{ by: 'a', say: "Loyalty. {b} goes first. That's what an alliance is." }] },
    { turns: [{ by: 'a', say: "{b} would do the same for me. First place." }] },
    { turns: [{ by: 'a', say: "My group chat comes first. So {b} comes first." }] },
  ]),
  ...E('rate.alliance.bottom', [
    { turns: [{ by: 'a', say: "We agreed in the group chat. {b} goes last." }] },
    { turns: [{ by: 'a', say: "The plan was {b} at the bottom. I stick to the plan." }] },
    { turns: [{ by: 'a', say: "Nothing personal, {b}. My alliance made a decision." }] },
    { turns: [{ by: 'a', say: "Bottom: {b}. We all said it. Now we all do it." }] },
  ]),
  ...E('group.kick', [
    { turns: [
      { by: 'a', send: "We need to talk about last night's ratings, {b}" },
      { by: 'b', send: "What about them?" },
      { by: 'a', send: "Some of us ended up a lot lower than we should have. We know what that means" },
      { by: 'b', react: "They think it was me.", send: "It wasn't me! I swear" },
      { by: 'a', send: "Sorry. {game} doesn't work without trust. You're out" },
    ], beat: '{b} is removed from the group chat.' },
    { turns: [
      { by: 'a', say: "Somebody in {game} put me near the bottom. I know it.", send: "{b}, be honest. Where did you rate us?" },
      { by: 'b', send: "High! Why would I lie?" },
      { by: 'a', send: "The numbers don't add up. We're done" },
    ], beat: '{b} watches the chat close without them.' },
    { turns: [
      { by: 'a', send: "Real talk. The ratings told us everything. {b}, you're not one of us anymore" },
      { by: 'b', react: "Wow. Okay. Wow." },
    ] },
    { turns: [
      { by: 'a', send: "{game} took a vote, {b}. It wasn't close" },
      { by: 'b', react: "I just got kicked out of my own alliance. Unbelievable." },
    ] },
  ]),
  ...E('group.confront.out', [
    { turns: [
      { by: 'a', send: "{b}. Are you in another alliance? Something called {q}?" },
      { by: 'b', react: "How do they know about {q}?!", send: "It's not what it looks like" },
      { by: 'a', send: "It's exactly what it looks like. Bye" },
    ], beat: '{b} is gone from {game}.' },
    { turns: [
      { by: 'a', send: "Funny thing. I heard {b} has a whole other group chat" },
      { by: 'b', send: "I can explain" },
      { by: 'a', send: "You can explain it to {q}. {game} is done with you" },
    ] },
    { turns: [
      { by: 'a', say: "Two alliances. Two. And I was the second choice.", send: "You can't be in {game} and {q} at the same time, {b}" },
      { by: 'b', send: "Why not? I'm loyal to both" },
      { by: 'a', send: "Nobody's loyal to two teams. You're out" },
    ] },
  ]),
  ...E('group.confront.stay', [
    { turns: [
      { by: 'a', send: "{b}, I know about {q}" },
      { by: 'b', react: "Oh no.", send: "Okay. Yes. But {game} is where my heart is" },
      { by: 'a', send: "Fine. But if you ever have to choose, you choose us" },
    ], beat: '{a} keeps {b} in the chat. For now.' },
    { turns: [
      { by: 'a', send: "So you're in {q} too. Anything else we should know?" },
      { by: 'b', send: "That's it. I swear. I was going to tell you" },
      { by: 'a', react: "Going to. Sure.", send: "One more chance" },
    ] },
    { turns: [
      { by: 'a', send: "Everybody's in two alliances in here, apparently. {q}? Really?" },
      { by: 'b', send: "It's a backup. You're the real thing" },
      { by: 'a', send: "Prove it at the ratings" },
    ] },
  ]),
  ...E('group.leave', [
    { turns: [
      { by: 'a', say: "I don't feel safe in {game} anymore. Time to go.", send: "Hey guys. I'm stepping away from {game}. No hard feelings" },
      { by: 'b', send: "Wait, what? Why??" },
      { by: 'a', send: "It just doesn't feel like a team anymore. Take care of each other" },
    ], beat: '{a} leaves the group chat.' },
    { turns: [
      { by: 'a', send: "I think {game} has run its course. Good luck everyone" },
      { by: 'b', react: "Run its course? It's been three days." },
    ] },
    { turns: [
      { by: 'a', say: "They stopped talking to me. So I'll stop talking to them." },
      { by: 'b', react: "Did {a} just leave {game}?" },
    ] },
  ]),
  ...E('group.form.pitch', [
    { turns: [
      { by: 'a', say: "Circle, start a group chat. Just the three of us.", send: "Okay, I trust you two more than anyone in here. Hear me out" },
      { by: 'b', send: "I'm listening {e:eyes}" },
      { by: 'c', send: "Oh, this feels official" },
      { by: 'a', send: "What if we had each other's backs? All the way to the end" },
    ] },
    { turns: [
      { by: 'a', send: "Welcome to the most exclusive chat in The Circle {e:sparkle}" },
      { by: 'b', react: "A group chat? Oh, it's happening.", send: "Ooh. What's the occasion?" },
      { by: 'a', send: "You two are my people. I want to make it official" },
    ] },
    { turns: [
      { by: 'a', say: "This is a big move. Don't mess it up.", send: "I picked you both for a reason. I think we could run this place" },
      { by: 'c', send: "Run it how? {e:eyes}" },
      { by: 'a', send: "We protect each other in the ratings. Every time" },
    ] },
    { turns: [
      { by: 'a', send: "Group chat time! I've been thinking about this for a day" },
      { by: 'b', send: "Uh oh. Thinking is dangerous in here lol" },
      { by: 'a', send: "Alliance. Us. Final three. Who's in?" },
      { by: 'b', send: "Okay, now I'm curious {e:eyes}" },
    ] },
    { turns: [
      { by: 'a', send: "Real talk. Everybody in here is making alliances. We should too" },
      { by: 'b', send: "I was literally about to message you about this" },
      { by: 'c', react: "Me too. Is that weird?", send: "Great minds lol" },
    ] },
  ]),
  ...E('group.form.name', [
    { turns: [
      { by: 'a', send: "Every good alliance needs a name. I'm thinking {game}" },
      { by: 'b', send: "{game}. I love it {e:fire}" },
      { by: 'c', send: "{game} forever. Nobody else can know" },
    ] },
    { turns: [
      { by: 'a', send: "Okay so we're officially {game}" },
      { by: 'b', send: "{game} has a ring to it" },
      { by: 'c', react: "I'm in a named alliance. My first one.", send: "Done. In" },
    ], beat: '{a} sits back, very pleased.' },
    { turns: [
      { by: 'b', send: "Wait we need a name" },
      { by: 'a', send: "{game}?" },
      { by: 'c', send: "{game}. Perfect. Don't overthink it" },
    ] },
    { turns: [
      { by: 'a', send: "Deal. And from now on this chat is called {game}" },
      { by: 'b', send: "{game} {e:handshake}" },
      { by: 'c', send: "{game} {e:handshake}" },
    ] },
    { turns: [
      { by: 'a', say: "Name it something nobody would guess.", send: "Introducing: {game}" },
      { by: 'b', send: "Lol I love that. We're {game} now" },
    ] },
  ]),
  ...E('group.form.declined', [
    { turns: [
      { by: 'b', say: "I like them. I just don't want to be tied to anybody yet.", send: "I love you guys, but I want to keep my options open for now" },
      { by: 'a', react: "Options. Okay. Noted." },
    ] },
    { turns: [
      { by: 'b', send: "This feels like a lot, a little fast" },
      { by: 'a', send: "No pressure! The door's open" },
    ], beat: '{a} looks at the reply for a long time.' },
    { turns: [
      { by: 'b', say: "If I join and they get caught, I go down with them.", send: "I'm good on my own for now. But I've got love for you" },
      { by: 'a', react: "So that's a no." },
    ] },
    { turns: [
      { by: 'b', send: "Can I think about it?" },
      { by: 'a', react: "Thinking about it means no." },
    ] },
  ]),
  ...E('group.form.fizzle', [
    { turns: [{ by: 'a', react: "Nobody wants to be in my alliance. Cool. Cool cool cool." }], beat: '{a} closes the group chat.' },
    { turns: [{ by: 'a', say: "Okay. That did not go how it went in my head." }] },
    { turns: [{ by: 'a', say: "Fine. I'll be an alliance of one. The best kind." }] },
  ]),
  ...E('group.check.open', [
    { turns: [
      { by: 'a', send: "{game} check-in! How's everybody holding up?" },
      { by: 'b', send: "Surviving. Barely. Love you guys" },
    ] },
    { turns: [
      { by: 'a', say: "Circle, open {game}.", send: "Emergency {game} meeting {e:shock}" },
      { by: 'b', send: "Uh oh. What happened" },
      { by: 'c', send: "I'm here, I'm here" },
    ] },
    { turns: [
      { by: 'a', send: "Morning {game} {e:heart} Just checking we're all still good" },
      { by: 'b', send: "Solid as ever" },
    ] },
    { turns: [
      { by: 'b', send: "Okay {game}, I have tea" },
      { by: 'a', send: "Spill. Immediately" },
    ] },
  ]),
  ...E('group.check.share', [
    { turns: [
      { by: 'a', send: "Okay so I heard something in a private chat today. It's big" },
      { by: 'b', react: "This is why we have a group chat.", send: "Tell us everything" },
    ] },
    { turns: [
      { by: 'a', send: "Just so you know, people are talking about us" },
      { by: 'b', send: "Who? What are they saying?" },
      { by: 'a', send: "That we're too close. We have to be careful at the ratings" },
    ] },
    { turns: [
      { by: 'a', send: "I can't say where I heard it, but trust me on this one" },
      { by: 'b', send: "If you say so. That's why you're in here" },
    ] },
    { turns: [
      { by: 'a', send: "Somebody tried to get info out of me today. I gave them nothing" },
      { by: 'b', send: "That's my alliance member {e:clap}" },
    ] },
  ]),
  ...E('group.check.plan', [
    { turns: [
      { by: 'a', send: "Ratings strategy. I think {c} is coming for us" },
      { by: 'b', send: "Agreed. {c} goes low on all three of ours" },
    ] },
    { turns: [
      { by: 'a', send: "We need to stick together tonight. All of {game} rates {c} at the bottom" },
      { by: 'b', send: "Done. No hesitation" },
    ] },
    { turns: [
      { by: 'b', send: "Is it just me or is {c} a problem?" },
      { by: 'a', send: "Not just you. {c} is the plan" },
    ], beat: 'Nobody in the group argues.' },
    { turns: [
      { by: 'a', say: "Say it out loud. Make it a plan.", send: "If we all put {c} low, {c} doesn't make it to the end" },
      { by: 'b', send: "Then that's what we do" },
    ] },
    { turns: [
      { by: 'a', send: "Real question. Can we trust {c}?" },
      { by: 'b', send: "No. And that's my answer for the ratings too" },
    ] },
  ]),
  ...E('alliance.betrayed.self', [
    { turns: [{ by: 'a', react: "{b}?! {b} blocked me? We were in {game} together!" }], beat: '{a} stares at the screen, mouth open.' },
    { turns: [{ by: 'a', say: "{game}. A name. A group chat. And then {b} does this." }] },
    { turns: [{ by: 'a', react: "My own alliance. {b}, how could you?" }] },
    { turns: [{ by: 'a', say: "I'd have done anything for {game}. I guess {b} wouldn't." }] },
  ]),
  ...E('alliance.betrayed', [
    { turns: [{ by: 'a', react: "{b} blocked {c}? {b} was in {game} with us!" }], beat: '{a} stares at the screen, stunned.' },
    { turns: [{ by: 'a', say: "{game} is over. {b} just made sure of that." }] },
    { turns: [{ by: 'a', react: "So that's what {game} meant to {b}. Nothing." }] },
    { turns: [{ by: 'a', say: "{b} looked me in the eye in that group chat. And then did this." }] },
    { turns: [{ by: 'a', react: "{c} trusted {b}. We all did. Never again." }] },
  ]),
};
