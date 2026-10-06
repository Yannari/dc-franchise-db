// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/moveinkin.js — move-in night for people who knew each other before
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "do we have special move-in night interactions when they know each
// other, or if they enter as a dynamic duo?" The cast's kinship (js/core.js) decides who knew
// whom; the season decides whether the house is about to be told:
//
//   OPEN    a Dynamic Duos season pairs the house by those relations and announces them on
//           night one, so the pair walks out together and the host asks. {rel} is what they
//           are, said by one of them ("We're married.").
//   SECRET  every other season, as the real show casts them: they enter in different groups,
//           act like strangers, and get one private minute before the house settles.
//
// Roles: {a} and {b} are the pair; {c} is somebody already inside. Endings are the kinship
// GROUP (together | family | friends | history). Nobody gets a job, a home town, a pet or a
// number of years the roster does not give them.

export default {
  // ── on the stage, after the host asks "do you two know each other?" ──
  'moveinact.kinstage.together': [
    { id: 'mkS.t1', turns: [{ by: 'a', say: "{rel}" }, { by: 'b', say: "And before anyone asks: no, we're not going to be weird about it in there." }, { by: 'a', say: "We're going to be a little bit weird about it." }] },
    { id: 'mkS.t2', turns: [{ by: 'b', say: "{rel}" }, { by: 'a', say: "We talked about pretending we'd never met. We lasted about a minute." }, { beat: '{b} takes {a}\'s hand. The crowd loves it.' }] },
  ],
  'moveinact.kinstage.family': [
    { id: 'mkS.f1', turns: [{ by: 'a', say: "{rel}" }, { by: 'b', say: "Which means I've had my whole life to practise beating {a} at things." }, { by: 'a', say: "And you've lost every single time." }] },
    { id: 'mkS.f2', turns: [{ by: 'b', say: "{rel}" }, { by: 'a', say: "I love {b}. I'll still vote {b} out if I have to." }, { by: 'b', say: "Same. With love." }] },
  ],
  'moveinact.kinstage.friends': [
    { id: 'mkS.r1', turns: [{ by: 'a', say: "{rel}" }, { by: 'b', say: "Which is either our biggest strength or the first thing the house uses against us." }] },
    { id: 'mkS.r2', turns: [{ by: 'b', say: "{rel}" }, { by: 'a', say: "I know every one of {b}'s tells. That's going to be very useful. Or very annoying." }] },
  ],
  'moveinact.kinstage.history': [
    { id: 'mkS.h1', turns: [{ by: 'a', say: "{rel}" }, { by: 'b', say: "That's one way of putting it." }, { beat: 'Neither of them looks at the other. The crowd goes "ooh".' }] },
    { id: 'mkS.h2', turns: [{ by: 'b', say: "{rel}" }, { by: 'a', say: "And out of every house in the world, they put us in the same one." }] },
  ],
  // a secret pair who ended up in the same group anyway (a small cast): nothing said
  'moveinact.kinstage.secret': [
    { id: 'mkS.s1', turns: [{ beat: '{a} and {b} stand at opposite ends of the line. Neither of them looks at the other once.' }, { by: 'a', dr: "Standing on that stage next to {b}, pretending we'd never met. The hardest thirty seconds of my life." }] },
    { id: 'mkS.s2', turns: [{ beat: '{a} laughs at something the host says. {b}, at the other end, very carefully does not.' }, { by: 'b', dr: "If {a} and I so much as look at each other on that stage, it's over before it starts." }] },
  ],

  // ── inside: an open pair walks in together, and somebody already in the house notices ──
  'moveinact.kinhouse.together': [
    { id: 'mkH.t1', turns: [{ beat: '{a} and {b} walk in holding hands. The room clocks it immediately.' }, { by: 'c', say: "Hang on. Are you two... together?" }, { by: 'a', say: "Since before the show." }, { by: 'c', say: "In this house? Oh, that's going to be a problem for somebody." }, { by: 'c', dr: "A couple on night one. That's two votes walking around as one, and everybody saw it." }] },
    { id: 'mkH.t2', turns: [{ beat: '{a} walks in, then turns round and waits for {b} at the door.' }, { by: 'c', say: "You two came in together?" }, { by: 'b', say: "We came in together." }, { by: 'c', say: "Like, together together?" }, { by: 'b', say: "Like, together together." }, { by: 'c', dr: "I've been in this house ten minutes and I already know two people I'm never putting in the same alliance." }] },
  ],
  'moveinact.kinhouse.family': [
    { id: 'mkH.f1', turns: [{ beat: '{a} and {b} walk in side by side, already arguing about who gets which bed.' }, { by: 'c', say: "Do you two know each other?" }, { by: 'b', say: "We're family." }, { by: 'c', say: "Family. In here. Okay." }, { by: 'c', dr: "Two people who will never vote for each other to go. That's the first number I wrote down in my head." }] },
    { id: 'mkH.f2', turns: [{ beat: '{a} and {b} walk in and finish each other\'s sentence on the way through the door.' }, { by: 'c', say: "That was creepy. How did you do that?" }, { by: 'a', say: "We're family. We've been doing it our whole lives." }, { by: 'c', dr: "Family in the house is a voting bloc you can't break. Somebody is going to have to split them up." }] },
  ],
  'moveinact.kinhouse.friends': [
    { id: 'mkH.r1', turns: [{ beat: '{a} and {b} walk in already laughing at a joke nobody else heard.' }, { by: 'c', say: "You two seem very comfortable already." }, { by: 'a', say: "We've been friends a long time." }, { by: 'c', dr: "Old friends, walking in together. Everybody else is starting from nothing. They aren't." }] },
  ],
  'moveinact.kinhouse.history': [
    { id: 'mkH.h1', turns: [{ beat: '{a} and {b} walk in a careful distance apart.' }, { by: 'c', say: "Do you two know each other?" }, { by: 'b', say: "Unfortunately." }, { by: 'a', say: "It's a long story." }, { by: 'c', dr: "Whatever is between those two, it's going to come out in here. I want a front-row seat." }] },
  ],

  // ── a secret pair's first private minute, once the house is full ──
  'moveinact.kinalone.together': [
    { id: 'mkA.t1', turns: [{ beat: 'Storage room, late. {a} slips in. A minute later, so does {b}.' }, { by: 'b', say: "Nobody saw me." }, { by: 'a', say: "Everybody sees everything in here. Be quick." }, { by: 'b', say: "I just needed one minute where I didn't have to pretend I don't know you." }, { by: 'a', say: "One minute. Then we're strangers again." }, { beat: 'They hold on to each other for exactly one minute.' }, { by: 'a', dr: "Hiding a relationship in a house full of cameras and nosy people. That's going to be the hardest part of this game." }] },
    { id: 'mkA.t2', turns: [{ beat: 'Storage room. {a} and {b} meet behind the shelves, both pretending to look for cereal.' }, { by: 'a', say: "You shook my hand. You shook my hand." }, { by: 'b', say: "That's what strangers do!" }, { by: 'a', say: "It was a very firm handshake." }, { by: 'b', say: "I'm committed to it." }, { by: 'b', dr: "If anybody finds out about us, we're the first two names on the block. So I shook my own partner's hand like we'd just met." }] },
  ],
  'moveinact.kinalone.family': [
    { id: 'mkA.f1', turns: [{ beat: 'Storage room. {a} and {b} have about a minute before somebody comes in for cereal.' }, { by: 'a', say: "Rule one. We don't sit together." }, { by: 'b', say: "Rule two. We don't vote the same way every single time." }, { by: 'a', say: "Rule three. If one of us goes up, the other one doesn't panic." }, { by: 'b', say: "I'm already panicking." }, { by: 'a', dr: "Family is the biggest advantage in this house, right up until somebody works it out. Then it's the biggest target." }] },
    { id: 'mkA.f2', turns: [{ beat: 'Storage room. {b} is restacking tins. {a} comes in and shuts the door.' }, { by: 'a', say: "Somebody asked me if we look alike." }, { by: 'b', say: "What did you say?" }, { by: 'a', say: "I said everyone looks alike after a long day." }, { by: 'b', say: "That's not even an answer." }, { by: 'a', say: "It worked." }, { by: 'b', dr: "One day in, and somebody is already looking at our faces. We need to be a lot more careful." }] },
  ],
  'moveinact.kinalone.friends': [
    { id: 'mkA.r1', turns: [{ beat: 'Storage room. {a} and {b}, whispering.' }, { by: 'a', say: "So we're strangers." }, { by: 'b', say: "Total strangers. Never met." }, { by: 'a', say: "You're doing that thing with your face." }, { by: 'b', say: "What thing?" }, { by: 'a', say: "The thing you do when you're lying. Stop it." }, { by: 'b', dr: "The problem with knowing somebody this well is that they know you this well. {a} can read me in a second. So can anybody else who's watching closely." }] },
  ],
  'moveinact.kinalone.history': [
    { id: 'mkA.h1', turns: [{ beat: 'Storage room. {a} walks in. {b} is already there. Neither of them leaves.' }, { by: 'b', say: "So. This is happening." }, { by: 'a', say: "Looks like it." }, { by: 'b', say: "Truce? Until we're not the only two people in here who know?" }, { by: 'a', say: "Truce. For now." }, { by: 'a', dr: "I don't trust {b}. I never have. But {b} is the only person in here who knows the real me, and right now that makes us useful to each other." }] },
  ],
};
