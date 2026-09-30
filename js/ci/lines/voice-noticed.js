// A voice noticed (Plan 3a+ Task 14, layer 3). Data only.
// slip.leak.noticed / .missed — a sends one of the author's leaks ({x}); b is
//   the one chatting with a (noticed: b caught it).
// style.<trait>.<tone> — a, in the apartment, reacts to how b types. Traits:
//   caps, ellipses, stage, greeting ({x}), nicknames, catchphrase ({x}),
//   formal, hype, dry; tones charmed / annoyed. style.mismatch.suspicious —
//   b is a catfish whose voice does not fit the face.
// {x} sits after a quote mark or a full stop so it keeps the author's case.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${key.startsWith('slip.voice') ? 'c' : ''}${String(i + 1).padStart(2, '0')}`, ...x })) });
const r1 = (a, extra = {}) => ({ turns: [{ by: 'a', react: a }], ...extra });

export const VOICE_NOTICED = {
  ...E('slip.leak.noticed', [
    { turns: [{ by: 'a', send: 'Okay, I have to go make dinner. {x}' }, { by: 'b', react: "Hold on. '{x}'?" },
      { by: 'b', say: "That is not how {a} usually sounds." }], beat: '{b} reads the message three times.' },
    { turns: [{ by: 'a', send: 'Good night. {x}' }, { by: 'b', react: "'{x}'. Okay. That's weird." }] },
    { turns: [{ by: 'a', send: 'Thanks for talking to me. {x}' }, { by: 'b', say: "'{x}'? I'm writing that down." }],
      beat: '{b} grabs a pen.' },
    { turns: [{ by: 'a', send: 'Talk tomorrow. {x}' }, { by: 'b', react: "Wait, what? '{x}'?" },
      { by: 'b', say: 'Who talks like that? Not {a}. At least, not the {a} in those pictures.' }] },
  ]),
  ...E('slip.leak.missed', [
    { turns: [{ by: 'a', send: 'Anyway. {x}' }, { by: 'a', react: 'Oh no. Did I just type that?' }],
      beat: '{a} stares at the screen, frozen.' },
    { turns: [{ by: 'a', send: 'Talk tomorrow. {x}' }, { by: 'a', say: 'Nobody noticed. Nobody noticed. Okay.' }] },
    { turns: [{ by: 'a', send: 'Night night. {x}' }, { by: 'a', react: "Why did I type '{x}'? Circle, can I unsend? I can't unsend." }] },
  ]),

  // A cover cracking, by the way it cracks (ci/cover.js crackOf). a is the
  // catfish (or a pair, 'off'), b the one chatting with them.
  ...E('slip.voice.noticed', [
    { when: { crack: 'stiff' }, turns: [{ by: 'a', send: 'I appreciate you reaching out. That was very considerate.' },
      { by: 'b', react: 'Very considerate? Since when does {a} talk like a thank-you card?' }] },
    { when: { crack: 'stiff' }, turns: [{ by: 'a', send: 'Please let me know if you have any further questions.' },
      { by: 'b', react: "'Further questions.' Is {a} okay?" }], beat: '{b} squints at the screen.' },
    { when: { crack: 'sloppy' }, turns: [{ by: 'a', send: 'lol ya idk tbh' },
      { by: 'b', react: 'Huh. {a} usually writes whole sentences.' }] },
    { when: { crack: 'sloppy' }, turns: [{ by: 'a', send: 'wait wat' }, { by: 'b', react: "'Wat'? From {a}? Okay." }],
      beat: '{b} reads it twice.' },
    { when: { crack: 'loud' }, turns: [{ by: 'a', send: "OMG YES!!! LET'S GOOO" },
      { by: 'b', react: "Whoa. {a} is not usually like this." }, { by: 'b', say: "Who got into {a}'s coffee?" }] },
    { when: { crack: 'loud' }, turns: [{ by: 'a', send: 'AHHHH I LOVE THAT' },
      { by: 'b', react: "That's a lot of capital letters for {a}." }] },
    { when: { crack: 'flat' }, turns: [{ by: 'a', send: 'cool.' },
      { by: 'b', react: "Just 'cool'? {a} is usually way more excited than that." }] },
    { when: { crack: 'flat' }, turns: [{ by: 'a', send: 'sure. sounds fine.' },
      { by: 'b', react: "That doesn't sound like {a} at all." }], beat: '{b} scrolls back up to compare.' },
    { when: { crack: 'dated' }, turns: [{ by: 'a', send: "Now that's the bee's knees" },
      { by: 'b', react: "The bee's knees? Who says that?" }], beat: '{b} laughs, then frowns.' },
    { when: { crack: 'young' }, turns: [{ by: 'a', send: "no cap that's crazy" },
      { by: 'b', react: "'No cap'? {a} is how old again?" }] },
    { when: { crack: 'young' }, turns: [{ by: 'a', send: 'lowkey obsessed with this' },
      { by: 'b', react: "'Lowkey'? From {a}?" }], beat: "{b} checks {a}'s profile again." },
    // Plain: any crack, and a pair whose two voices don't match.
    { turns: [{ by: 'a', send: "Okay but seriously. That's a big deal" },
      { by: 'b', react: '{a} sounds like a different person today.' }] },
    { turns: [{ by: 'a', send: 'Understood. Talk later' },
      { by: 'b', react: "That doesn't sound like {a}. At all." }], beat: '{b} scrolls back through their old messages.' },
    { turns: [{ by: 'a', send: 'Anyway. How are you' },
      { by: 'b', react: 'Something about the way {a} types today is different.' }], beat: '{b} tilts {b.posAdj} head at the screen.' },
  ]),
  ...E('slip.voice.missed', [
    { when: { crack: 'stiff' }, turns: [{ by: 'a', send: 'That is wonderful. I am very happy for you.' },
      { by: 'a', react: 'Too stiff. Loosen up. Loosen up!' }] },
    { when: { crack: 'sloppy' }, turns: [{ by: 'a', send: 'k cool' }, { by: 'a', react: '{a} writes full sentences. Come on.' }],
      beat: '{a} smacks {a.posAdj} own forehead.' },
    { when: { crack: 'loud' }, turns: [{ by: 'a', send: 'YESSS!!' }, { by: 'a', react: "Too much. {a} doesn't do too much. Calm down." }] },
    { when: { crack: 'flat' }, turns: [{ by: 'a', send: 'nice' },
      { by: 'a', react: '{a} has way more energy than this. Exclamation points!' }] },
    { when: { crack: 'young' }, turns: [{ by: 'a', send: 'slay' }, { by: 'a', react: '{a} would not say slay. {a} would not say slay.' }],
      beat: '{a} buries {a.posAdj} face in a pillow.' },
    { turns: [{ by: 'a', send: 'Got it. Thanks' },
      { by: 'a', react: "That didn't sound like {a}. Did that sound like {a}?" }] },
    { turns: [{ by: 'a', send: 'Okay talk soon' }, { by: 'a', react: 'Stay in character. Stay in character.' }],
      beat: '{a} shakes out {a.posAdj} hands like a boxer.' },
    { turns: [{ by: 'a', send: 'For sure. Sounds good' }, { by: 'a', react: "Close enough. I hope that's close enough." }] },
  ]),

  ...E('style.caps.charmed', [
    r1('{b} types everything in capitals and I love it. It\'s like getting hugged by a megaphone.'),
    r1('Every message from {b} is a party. All caps. Never change.'),
    r1('I can hear {b} yelling from here. In the best way.'),
  ]),
  ...E('style.caps.annoyed', [
    r1('Why is {b} yelling? {b} is always yelling.'),
    r1('{b}, the caps lock key. Find it. Turn it off.'),
    r1('My ears hurt, and it\'s a text chat. Thanks, {b}.'),
  ]),
  ...E('style.ellipses.charmed', [
    r1('{b} ends everything with dot dot dot. It\'s so mysterious.'),
    r1('I love {b}\'s little dots. Very dramatic.'),
    r1('Every message from {b} reads like a movie trailer.'),
  ]),
  ...E('style.ellipses.annoyed', [
    r1('Dot dot dot. Finish your sentences, {b}.'),
    r1('{b} trails off like there\'s a secret. There\'s no secret.'),
    r1('What do the dots mean, {b}? What do the dots mean?'),
  ]),
  ...E('style.stage.charmed', [
    r1('{b} writes stage directions in the group chat. Iconic.'),
    r1('Brackets? {b} is performing for the whole building. I\'m here for it.'),
    r1('{b} just took a bow in a group chat. Legend.'),
  ]),
  ...E('style.stage.annoyed', [
    r1('{b} is doing a whole show in there. Nobody bought a ticket.'),
    r1('Every message from {b} is a performance.'),
    r1('The brackets, {b}. The brackets have to stop.'),
  ]),
  ...E('style.greeting.charmed', [
    r1("'{x}' Every single time. {b} makes everybody feel welcome."),
    r1("I wait for {b}'s '{x}' now. It's part of my day."),
    r1("'{x}' I didn't know I needed that today. Thank you, {b}."),
  ]),
  ...E('style.greeting.annoyed', [
    r1("'{x}' Again. We get it, {b}."),
    r1("{b} says '{x}' like we're {b.posAdj} fan club."),
    r1("If I hear '{x}' one more time."),
  ]),
  ...E('style.nicknames.charmed', [
    r1('{b} gave me a nickname. I have a nickname! I\'m keeping it.'),
    r1('Everybody has a {b} nickname now. It\'s kind of sweet.'),
    r1('{b} nicknames people in minutes. That\'s a people person.'),
  ]),
  ...E('style.nicknames.annoyed', [
    r1('{b} calls me a nickname I never agreed to.'),
    r1('Stop nicknaming me, {b}. You don\'t even know me yet.'),
    r1('Everybody\'s a nickname to {b}. That\'s not friendship. That\'s branding.'),
  ]),
  ...E('style.catchphrase.charmed', [
    r1("'{x}' {b} says it every time. It's growing on me."),
    r1("If {b} doesn't say '{x}' today, I'll think something's wrong."),
    r1('{b} has a catchphrase. Of course {b} does. I love it.'),
  ]),
  ...E('style.catchphrase.annoyed', [
    r1("If {b} says '{x}' one more time."),
    r1("'{x}' Again. {b}, please."),
    r1('{b} talks like a sign in a waiting room.'),
  ]),
  ...E('style.formal.charmed', [
    r1('{b} writes in full sentences. With punctuation. Respect.'),
    r1('{b} texts like a grown-up. It\'s refreshing.'),
    r1('Proper commas from {b}. I feel like I\'m reading a letter.'),
  ]),
  ...E('style.formal.annoyed', [
    r1('{b} texts like a lawyer.'),
    r1('Why does {b} sound like an email from work?'),
    r1('{b} writes every message like it\'s a cover letter.'),
  ]),
  ...E('style.hype.charmed', [
    r1('{b}\'s energy in the chat is unmatched.'),
    r1('{b} texts like a pep rally. I\'m in.'),
    r1('I needed {b}\'s energy today.'),
  ]),
  ...E('style.hype.annoyed', [
    r1('{b} is a lot. {b} is a lot at eight in the morning.'),
    r1('Every message from {b} has three exclamation points.'),
    r1('Calm down, {b}. It\'s a group chat.'),
  ]),
  ...E('style.dry.charmed', [
    r1('{b} is so dry. I\'m obsessed.'),
    r1('Two words from {b} and I\'m on the floor.'),
    r1('{b} doesn\'t use capital letters, and somehow it works.'),
  ]),
  ...E('style.dry.annoyed', [
    r1('{b} answers everything like {b.sub}\'s bored of us.'),
    r1('Would it kill {b} to use an exclamation point?'),
    r1('Lowercase, no punctuation. Does {b} even like us?'),
  ]),
  ...E('style.mismatch.suspicious', [
    r1("That's not how somebody {b.posAdj} age texts. Something's off.", { beat: '{a} scrolls back through everything {b} ever posted.' }),
    r1('The pictures say one thing. The way {b} types says something else.'),
    r1("I don't think {b} writes like {b} looks.", { beat: '{a} holds the tablet up next to {b}\'s profile picture.' }),
    r1('Something about how {b} types just does not match that face.'),
    r1("I'm starting to think {b} isn't who {b.sub} says {b.sub} is. It's the way {b.sub} writes.", { beat: '{a} scrolls back and rereads.' }),
    r1("That message did not sound like the {b} in those pictures."),
  ]),
};
