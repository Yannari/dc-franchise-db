// ══════════════════════════════════════════════════════════════════════
// ci/lines/romance.js — the jealous message (chat intent `jealous`)
// ══════════════════════════════════════════════════════════════════════
//
// The morning after the party, `a` watched `b` (their crush) flirt with `c`
// in Circle Chat (party.js jealous), and messages `b` about it. Warm: b is
// touched that a cared. Neutral: b brushes it off. Cold: "you don't own me".
// The chat says only what the party showed: that b and c flirted.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const ROMANCE_LINES = {
  ...E('chat.jealous.warm', [
    { turns: [
      { by: 'a', say: "Be cool. Be so cool.", send: "So. You and {c} last night {e:eyes}" },
      { by: 'b', send: "Lol it was a party! You know who I actually talk to every day though" },
      { by: 'a', send: "Do I?" },
      { by: 'b', send: "You do {e:wink}" },
    ], beat: '{a} reads it twice and grins at the ceiling.' },
    { turns: [
      { by: 'a', send: "Not gonna lie, the flirting with {c} stung a little" },
      { by: 'b', react: "Oh. Oh, that's cute.", send: "Wait, you were jealous? That's kind of adorable" },
      { by: 'a', send: "I'm not saying I was. I'm not saying I wasn't" },
      { by: 'b', send: "For the record, {c} is not who I'm thinking about" },
    ] },
    { turns: [
      { by: 'a', say: "Just ask. Worst case, I know.", send: "Quick question. Is there something with you and {c}?" },
      { by: 'b', send: "Honestly no. Party energy. You're the one I'd want to meet" },
      { by: 'a', send: "Okay good. I mean. Cool. Good" },
    ], beat: '{a} falls back on the bed, laughing.' },
    { turns: [
      { by: 'a', send: "Saw the party chat. You and {c} looked cozy" },
      { by: 'b', send: "I was being silly. Messaging you this morning is the real me {e:smile}" },
    ] },
  ]),
  ...E('chat.jealous.neutral', [
    { turns: [
      { by: 'a', send: "So you and {c}, huh" },
      { by: 'b', send: "What about it lol" },
      { by: 'a', send: "Nothing. Forget I said it" },
    ], beat: '{a} closes the chat and opens it again.' },
    { turns: [
      { by: 'a', send: "Fun party last night. Especially for you and {c}" },
      { by: 'b', send: "It was just a party, I flirt with everybody" },
      { by: 'a', say: "Everybody. Great. So I'm everybody." },
    ] },
    { turns: [
      { by: 'a', send: "Are you and {c} a thing now?" },
      { by: 'b', send: "We're all just having fun in here" },
      { by: 'a', send: "Sure. Fun" },
    ], beat: '{a} does not believe a word of it.' },
    { turns: [
      { by: 'a', say: "Don't sound jealous. Don't sound jealous.", send: "Saw you and {c} hitting it off" },
      { by: 'b', send: "Haha maybe. Who knows in here" },
    ] },
  ]),
  ...E('chat.jealous.cold', [
    { turns: [
      { by: 'a', send: "So {c} gets the flirting now?" },
      { by: 'b', react: "Excuse me?", send: "I didn't know I had to check in with you" },
      { by: 'a', send: "You don't. Forget it" },
    ], beat: '{a} stares at the screen, cheeks burning.' },
    { turns: [
      { by: 'a', send: "Kind of hurt watching you and {c} last night" },
      { by: 'b', send: "We've never even met. You don't get to be hurt" },
    ], beat: 'Neither of them types anything else.' },
    { turns: [
      { by: 'a', send: "Didn't take you long to move on to {c}" },
      { by: 'b', send: "Move on? We were never a thing" },
      { by: 'a', say: "Ouch. Okay. Noted." },
    ] },
    { turns: [
      { by: 'a', send: "Just tell me straight. Is it {c}?" },
      { by: 'b', react: "This is a lot for a Tuesday.", send: "I'm not doing this. I'm here to play a game" },
    ], beat: '{a} logs off for the rest of the morning.' },
  ]),
};
