// A catfish flirting in character (ci/chat.js performedFlirt): the persona
// would be into b, the person behind it is not. The sends are the persona;
// what a says aloud or reacts is the real person doing a job (Seaburn as
// "Rebecca", US 1). b only ever sees the sends. Never assume anyone's gender
// in these lines: the pair can be any mix.
// `chat.flirt.act.<ending>`: a is the catfish, b the one being charmed.
export const FLIRT_ACT = {
  'chat.flirt.act.warm': [
    { id: 'chat.flirt.act.warm.01', turns: [
      { by: 'a', say: "Okay. I'm not into {b}. The profile is. Be the profile.", send: "Can I be honest? You're my favorite notification {e:smile}" },
      { by: 'b', react: "Oh, stop it.", send: "Stoppp. You're my favorite too {e:hearteyes}" },
      { by: 'a', react: "And that's a vote. I'll take it." },
    ], beat: '{a} fist-pumps, then immediately looks guilty about it.' },
    { id: 'chat.flirt.act.warm.02', turns: [
      { by: 'a', say: "This isn't flirting. This is strategy with emojis.", send: "So when this is all over, you're taking me to dinner right? {e:wink}" },
      { by: 'b', send: "Name the place. I'm there {e:fire}" },
      { by: 'a', react: "Oh no. They're really into it. Okay. Keep going." },
    ] },
    { id: 'chat.flirt.act.warm.03', turns: [
      { by: 'a', say: "Think like the profile. What would the profile say?", send: "I've been smiling at my screen all day and it's your fault {e:smile}" },
      { by: 'b', react: "Oh my God. Okay.", send: "Guilty. And not sorry {e:hearteyes}" },
      { by: 'a', say: "I feel like a fraud. A very successful fraud." },
    ], beat: '{a} stares at the ceiling for a long moment.' },
    { id: 'chat.flirt.act.warm.04', turns: [
      { by: 'a', send: "Real talk, you're the only person in here I'd actually wanna meet {e:eyes}" },
      { by: 'b', send: "Same. Like, genuinely same {e:heart}" },
      { by: 'a', react: "Genuinely same. Great. That's gonna be a fun conversation at the finale." },
    ] },
  ],
  'chat.flirt.act.neutral': [
    { id: 'chat.flirt.act.neutral.01', turns: [
      { by: 'a', say: "Flirt a little. Not too much. The profile would flirt a little.", send: "You up? Asking for me {e:wink}" },
      { by: 'b', send: "Lol always up. What's going on?" },
      { by: 'a', react: "Not a yes, not a no. I'll take not a no." },
    ] },
    { id: 'chat.flirt.act.neutral.02', turns: [
      { by: 'a', send: "Okay but your laugh in the group chat? Cute {e:smile}" },
      { by: 'b', react: "My laugh? It's a typed laugh.", send: "Haha thank you?" },
      { by: 'a', say: "Too much. Pull it back. The profile doesn't try that hard." },
    ] },
    { id: 'chat.flirt.act.neutral.03', turns: [
      { by: 'a', say: "Everybody's rating on vibes. Give the vibes.", send: "Just wanted to say hi. And that you've got good taste in people {e:wink}" },
      { by: 'b', send: "Ha, okay. Hi to you too {e:smile}" },
    ] },
  ],
  'chat.flirt.act.cold': [
    { id: 'chat.flirt.act.cold.01', turns: [
      { by: 'a', send: "So are we gonna keep pretending there's nothing here? {e:eyes}" },
      { by: 'b', react: "There's nothing here.", send: "I think we're better as friends lol" },
      { by: 'a', react: "Honestly? Relief. The profile's heartbroken, though." },
    ], beat: '{a} deletes a draft of a longer message.' },
    { id: 'chat.flirt.act.cold.02', turns: [
      { by: 'a', say: "Don't overthink it. Just send it.", send: "You're kind of my type, not gonna lie {e:fire}" },
      { by: 'b', react: "Something about that felt off.", send: "Lol that's... a lot for a Tuesday" },
      { by: 'a', react: "Off? Off how? Did I sound off?" },
    ] },
    { id: 'chat.flirt.act.cold.03', turns: [
      { by: 'a', send: "When this is over I'm finding you, just so you know {e:wink}" },
      { by: 'b', react: "That's either sweet or scary.", send: "Okay haha" },
      { by: 'a', say: "Okay haha. That's the sound of it not working." },
    ] },
  ],
};
