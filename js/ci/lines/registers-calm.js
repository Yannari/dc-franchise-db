// The calm voice (the user, 2026-10-20: "we need a differentiation between calm
// and chill, cause all calm people don't say dude every sentence"). Every
// voice the roster calls calm used to type as chill, the surfer bros' voice,
// so a composed mentor and a half-asleep rocker said the same "dude".
//
//   calm    composed, unhurried, kind; full sentences, no slang, hardly ever an
//           exclamation mark. Steady where formal is correct, warm without
//           "sweetheart", and it talks, where stoic barely does (Kai, Lake,
//           Aaron, Nico, Ernesto, Priya, Alessio)
//
// Data only, the same shapes as registers.js and chat-voices.js, merged into
// their pools by key; the style lines join voice-noticed.js.
const R = (key, lines, kind = 'say') => ({
  [key]: lines.map((text, i) => ({ id: `${key}.calm${i + 1}`, when: { register: 'calm' }, turns: [{ by: 'a', [kind]: text }] })),
});
const V = (key, list) => ({
  [key]: list.map((turns, i) => ({ id: `${key}.v.calm${i + 1}`, when: { register: 'calm' },
    turns: turns.map(([by, text]) => ({ by, send: text })) })),
});
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, turns: [{ by: 'a', react: x }] })) });

export const REGISTER_CALM = {
  // ── the ratings, said aloud ───────────────────────────────────────────
  ...R('rate.middle', [
    "{b}, I'm putting you in the middle. There's time. I'd like to know you better.",
    "Middle for {b}. Nothing against {b.obj}. I just haven't seen enough yet.",
  ]),
  ...R('rate.affection.top', [
    "{b} goes first. {b} has been steady with me since day one, and I don't take that lightly.",
    "First place is {b}. When this place gets loud, {b} is the one who makes it quiet again.",
  ]),
  ...R('rate.affection.bottom', [
    "{b}, I'm sorry. Last. We never really found each other in here, and that's alright.",
    "I'll put {b} last, and I'll still wish {b.obj} well. Both of those can be true.",
  ]),
  ...R('rate.threat.top', [
    "{b} goes first. {b} is strong, and I'd rather walk beside {b.obj} than stand in the way.",
    "First is {b}. I can see where this game is going, and I'd like to be on {b}'s side when it gets there.",
  ]),
  ...R('rate.threat.bottom', [
    "{b}, last. Not out of anger. {b} is simply playing too well to leave alone.",
    "I respect {b}. That's exactly why {b} is last tonight.",
  ]),
  ...R('rate.suspicion.bottom', [
    "Something in {b}'s story doesn't sit right with me. I'll trust that feeling. Last.",
    "{b}, last. I could be wrong about you. I'd still rather be careful.",
  ]),
  ...R('result.middle', [
    "The middle. That's alright. Steady is good.",
    "Middle of the pack. I can work with that.",
  ], 'react'),
  ...R('result.bottom', [
    "The bottom. Okay. Let me sit with that for a minute.",
    "That stings a little. It's one night. I'll be alright.",
  ], 'react'),
  ...R('ratings.done', [
    "Done. I said what I meant. That's all I can do.",
    "Sent. Now I let it go.",
  ]),
  // ── the blocking ──────────────────────────────────────────────────────
  ...R('block.wait', [
    "Whatever happens, I'll be alright. I just want it to be over.",
    "Breathe. It's out of my hands now.",
  ], 'react'),
  ...R('block.react.relief', [
    "It wasn't me. I'm relieved, and I'm sad for {b}. Both.",
    "Oh, {b}. I'm sorry. You deserved a longer stay.",
  ], 'react'),
  ...R('block.after', [
    "That one is going to stay with me for a while.",
    "I need a minute alone with that. Then I'll be fine.",
  ]),
  ...R('block.react.self', [
    "It's me. Alright. I'm at peace with that. Mostly.",
    "Me. Okay. I gave it everything I had, and that's enough.",
  ], 'react'),
  ...R('visit.wait', [
    "If {b} comes to my door, I'll be honest. That's all I can offer.",
    "I'll put the kettle on, just in case it's {b}.",
  ], 'react'),
  ...R('goodbye.guess', [
    "Alright, {b}. Say what you need to say.",
    "I hope {b} is kind. I'd understand if not.",
  ], 'react'),
  ...R('goodbye.react.surprised', [
    "That was gracious of {b}. I'll remember it.",
    "{b} left with dignity. Not everybody manages that.",
  ], 'react'),
  // ── Circle Chat and the Newsfeed ──────────────────────────────────────
  ...R('circle.react', [
    "That's a kind thing to say. {b} means it, I think.",
    "{b} has a way of settling the whole chat down. I notice that.",
  ], 'react'),
  ...R('status.react', [
    "That's an honest post, {b}. I appreciate honest.",
    "{b} seems at peace today. Good.",
  ], 'react'),
};

export const CHAT_CALM = {
  ...V('chat.bond.warm', [
    [['a', "I wanted to tell you something. You're one of the people who makes this place feel steady"], ['b', "That means a lot coming from you"], ['a', "I mean it. Take care of yourself today {e:heart}"]],
    [['a', "How are you really doing? Not the Circle answer. The real one"], ['b', "Honestly? A little tired. But okay"], ['a', "That's allowed. I'm here if you want to talk it through"]],
  ]),
  ...V('chat.bond.neutral', [
    [['a', "Hi. No agenda, I just wanted to say hello"], ['b', "Hi! That's nice actually"], ['a', "Hope your day's going easy on you"]],
    [['a', "Good morning. Did you sleep alright?"], ['b', "Not bad! You?"], ['a', "Well enough. The coffee is doing the rest"]],
  ]),
  ...V('chat.bond.cold', [
    [['a', "I get the feeling we got off on the wrong foot. I'd like to fix that, if you're open to it"], ['b', "Maybe. We'll see"], ['a', "That's fair. The offer stands"]],
    [['a', "I don't think we've really talked yet. No pressure. I just wanted to reach out"], ['b', "Okay"], ['a', "Alright. I'm around if that changes"]],
  ]),
  ...V('chat.checkin.warm', [
    [['a', "I saw the ratings. One night doesn't say who you are in here"], ['b', "Thank you. I needed to hear that"], ['a', "Get some rest. Tomorrow is a new day"]],
    [['a', "How are you holding up after last night? Take your time"], ['b', "Better now that somebody asked"], ['a', "Good. I'm not going anywhere"]],
  ]),
  ...V('chat.ally.warm', [
    [['a', "I've been thinking. I trust you, and I'd like us to look out for each other. Quietly"], ['b', "I'd like that too"], ['a', "Then it's settled. No noise, just loyalty {e:handshake}"]],
    [['a', "I'm not one for big speeches. I'd just like to know we have each other's back"], ['b', "We do"], ['a', "Good. That's all I needed"]],
  ]),
  ...V('chat.flirt.warm', [
    [['a', "I'll be honest. Talking to you is the part of the day I look forward to"], ['b', "Okay that's really sweet"], ['a', "It's just true. I don't say things I don't mean {e:smile}"]],
    [['a', "There's something very easy about talking to you. I could do this for hours"], ['b', "Lol same honestly"], ['a', "Then let's not rush it"]],
  ]),
  ...V('chat.flirt.neutral', [
    [['a', "Your smile in that picture is lovely. I just wanted to say so"], ['b', "Haha thank you"], ['a', "You're welcome. Have a good day"]],
    [['a', "I like the way you write. You take your time with things"], ['b', "Thanks! I try"], ['a', "It shows {e:smile}"]],
  ]),
  ...V('chat.pitch.warm', [
    [['a', "Ratings are tonight. I'd be grateful if you kept me in mind. I'll be doing the same for you"], ['b', "I got you"], ['a', "Thank you. That means more than you know"]],
    [['a', "I don't usually ask, but I'd appreciate your support tonight. You'll have mine"], ['b', "Of course"], ['a', "Thank you. Truly"]],
  ]),
};

export const NOTICED_CALM = {
  ...E('style.calm.charmed', [
    "{b} never rushes a message. Talking to {b} feels like taking a deep breath.",
    "Everybody in here is panicking except {b}. I want to stay near {b} all season.",
    "{b} could tell me the building was on fire and I'd stay calm.",
  ]),
  ...E('style.calm.annoyed', [
    "{b} is so calm it's almost creepy. Feel something!",
    "How is {b} this relaxed? We're in the Circle. Panic a little.",
    "I sent {b} an emergency and got 'let's take a breath.' I don't want a breath.",
  ]),
};
