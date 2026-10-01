// ══════════════════════════════════════════════════════════════════════
// ci/lines/arrivals-room.js — the room takes in a new Player, and the race
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "they're barely reacting to the new player arrival".
//   arrival.alert              the alert, read out in an apartment (a)
//   arrival.react.<kind>       a (in the room) about b (the newcomer)
//   welcome.<ending>           a messages b first (or second); b answers
// arrivals.js roomReacts picks who feels what; each kind has a consequence.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const react = (t, extra = {}) => ({ turns: [{ by: 'a', react: t }], ...extra });
const say = (t, extra = {}) => ({ turns: [{ by: 'a', say: t }], ...extra });

export const ARRIVAL_ROOM = {
  ...E('arrival.alert', [
    { turns: [{ by: 'a', react: "'Alert!' What now? 'A new Player has entered The Circle.' Oh, come on!" }], beat: 'In every apartment, heads snap toward the screens.' },
    { turns: [{ by: 'a', react: "'A new Player has entered The Circle.' Shut up. Shut UP." }], beat: 'Somewhere down the hall, somebody screams.' },
    { turns: [{ by: 'a', react: "New Player?! I just learned everybody's names!" }], beat: 'Every screen in the building lights up with the same alert.' },
    { turns: [{ by: 'a', react: "'Alert!' Oh no. Oh yes. Oh no. A NEW PLAYER?" }] },
  ]),
  ...E('arrival.react.crush', [
    react("Oh. Oh, hello. Who are YOU?", { beat: '{a} leans in close to the screen.' }),
    say("Okay, {b} is cute. Like, actually cute. This changes things."),
    react("{b}? I'm sorry, {b} can stay as long as {b.sub} wants."),
    say("I came here to play a game. I did not come here to get a crush on {b}. And yet."),
    react("Somebody fan me. {b} just walked in."),
  ]),
  ...E('arrival.react.threat', [
    say("{b} walks in fresh, with no enemies and no history. That's dangerous."),
    say("Everybody's going to love {b} for a week. I need to make sure it's only a week."),
    react("Great. Another player. Another person who could rate me last."),
    say("{b} is safe at the next blocking. That makes {b.obj} the most powerful person in here right now."),
    say("I'll be nice to {b}. Very nice. Nice is how you keep a threat close."),
  ]),
  ...E('arrival.react.suspicious', [
    say("Hm. {b}. Something about that profile is too perfect."),
    react("Wait. Zoom in on that picture. Is that even real?"),
    say("New people always come in with a story. I want to know what {b}'s really is."),
    say("I'm not saying {b} is a catfish. I'm just not saying {b.sub} isn't."),
    react("That bio was written by a team. Nobody talks like that."),
  ]),
  ...E('arrival.react.ally', [
    say("A new face! Somebody who hasn't picked a side yet. I'm getting there first."),
    react("Yes! Fresh energy! I love it. I'm messaging {b} immediately."),
    say("{b} doesn't know anybody. Which means {b} needs a friend. Hi. It's me."),
    say("This is a chance. Get to {b} before the others get in {b.posAdj} ear."),
    react("{b} looks so nice. I hope we click."),
  ]),
  ...E('arrival.react.worried', [
    say("Great. The new person is safe and I'm still at the bottom. Love that for me."),
    react("Another person to rate me. Just what I needed."),
    say("Every new player is one more vote I don't have."),
    say("If {b} likes everybody else more than me, I'm done."),
    react("Can the new person please just be nice to me? Please?"),
  ]),

  ...E('welcome.warm', [
    { turns: [
      { by: 'a', say: "First one in. That counts for something.", send: "Hi {b}!! Welcome to The Circle {e:party} I had to be the first to say hi" },
      { by: 'b', react: "Oh my God, people are actually nice in here.", send: "Stop, that's so sweet! Thank you!!" },
      { by: 'a', send: "Anything you want to know, ask me. I've got you" },
      { by: 'b', send: "I'm holding you to that {e:smile}" },
    ] },
    { turns: [
      { by: 'a', send: "Welcome {b}! It's a lot in here at first, but you're gonna be great" },
      { by: 'b', send: "Honestly I'm so nervous. This helps a lot" },
      { by: 'a', send: "Everybody was nervous. You're in good hands" },
    ], beat: '{b} reads it twice and smiles.' },
    { turns: [
      { by: 'a', send: "Okay, the new person is here and they have a GREAT profile" },
      { by: 'b', react: "A compliment in my first five minutes. I'll take it.", send: "Haha thank you! You're the first person to message me" },
      { by: 'a', send: "Good. I wanted to be {e:wink}" },
    ] },
    { turns: [
      { by: 'a', send: "Hey {b}! Just wanted you to know you've got a friend in here already" },
      { by: 'b', send: "That means more than you know. Seriously" },
      { by: 'a', send: "Ask me anything. And don't trust everyone lol" },
      { by: 'b', react: "Don't trust everyone. Got it. Including you?" },
    ] },
    { turns: [
      { by: 'a', send: "WELCOME {b}! What's your story? I need to know everything" },
      { by: 'b', send: "Ha! Where do I start {e:laugh}" },
      { by: 'a', send: "From the beginning. I've got all day" },
    ] },
  ]),
  ...E('welcome.neutral', [
    { turns: [
      { by: 'a', send: "Hey {b}, welcome!" },
      { by: 'b', send: "Thanks! Nice to meet you" },
      { by: 'a', react: "Short. Okay. Noted." },
    ] },
    { turns: [
      { by: 'a', send: "Welcome to the madness {b} lol" },
      { by: 'b', send: "Haha thanks. Still figuring everyone out" },
    ], beat: '{b} keeps the chat open but doesn\'t type anything else.' },
    { turns: [
      { by: 'a', send: "Hi {b}! If you need anything, I'm here" },
      { by: 'b', react: "Everybody's saying that. Everybody.", send: "Appreciate it!" },
    ] },
    { turns: [
      { by: 'a', send: "Hey new friend! How are you settling in?" },
      { by: 'b', send: "Okay so far. A lot of messages lol" },
    ] },
  ]),
  ...E('welcome.cold', [
    { turns: [
      { by: 'a', send: "Hey {b}! Welcome! Who have you talked to so far??" },
      { by: 'b', react: "Two minutes in and already digging. Hm.", send: "Just got here lol. Give me a second" },
    ], beat: '{a} stares at the reply, not sure what went wrong.' },
    { turns: [
      { by: 'a', send: "Welcome {b}! Just so you know, I'm the person to trust in here" },
      { by: 'b', react: "That's exactly what someone untrustworthy would say.", send: "Good to know haha" },
    ] },
    { turns: [
      { by: 'a', send: "Hi {b}! We should definitely work together" },
      { by: 'b', react: "Work together? I've been here five minutes.", send: "Let me get my bearings first lol" },
    ] },
    { turns: [
      { by: 'a', send: "Welcome! Honestly I'd watch out for a few people in here" },
      { by: 'b', react: "Gossip already. Not a great look.", send: "Oh? Okay. Thanks I guess" },
    ] },
  ]),
};
