// pm/lines/hut-volume-4.js — round eleven of the beach hut (the user,
// 2026-10-23: "also add the volume like u wanted to do to avoid
// repetitions"). Measured by stance and kind: the two-faced hut after a pull,
// a kiss, a loyalty test, a deep chat, a friendship, a row, advice and the
// game kiss; the honest one after a kiss, an ick, advice, a deep chat and a
// pull. The two-faced islander is hiding something; the honest one says what
// happened. Roles as hut.js: in loyalty role 0 turned the pitch down, role 1
// made it; in ick role 0 has the ick; in advice role 0 gave it.
const B = { withB: true };
const K = (kind, more = {}) => ({ kind, ...more });
const lines = (prefix, when, texts) => texts.map((t, i) => ({ id: `${prefix}${i + 1}`, when, turns: [['a', t]] }));

export const HUT_VOLUME_4 = {
  honest: [
    ...lines('hutv4.kiss.h', K('kiss', B), [
      "Every time I kiss {b}, I forget where I am for a second. Then someone shouts for sun cream.",
      "I'm not usually this soppy. {b} has turned me soppy. I'm not even fighting it.",
      "That kiss was the best bit of my day, and it's been a good day.",
      "I keep thinking it'll wear off, the way I feel when {b} kisses me. It hasn't yet.",
      "{b} kissed me in front of everyone, and I didn't even go red. Much.",
    ]),
    ...lines('hutv4.ick.r0.h', K('ick', { ...B, role: 0 }), [
      "I wanted it to work with {b}. I really did. And then it just went.",
      "I feel like the worst person in here. {b} hasn't done anything wrong. I just don't feel it.",
      "It was a tiny thing. I know it was a tiny thing. I can't stop seeing it.",
      "I'm going to have to be honest with {b}. I'm dreading it.",
    ]),
    ...lines('hutv4.ick.r1.h', K('ick', { ...B, role: 1 }), [
      "Something's changed with {b}, and nobody will tell me what.",
      "{b} won't look at me the same way. I don't know what I did, and that's the worst part.",
      "I'd rather someone told me straight than went cold. That's all I'm asking.",
    ]),
    ...lines('hutv4.advice.r0.h', K('advice', { ...B, role: 0 }), [
      "I told {b} the truth. Friends do that. Even when it's not what they want to hear.",
      "I hope {b} doesn't hate me for that. I said it because I care.",
      "Giving advice in here is dangerous. Everyone remembers what you said.",
      "I've watched {b} get hurt before. I'm not watching it again without saying something.",
    ]),
    ...lines('hutv4.advice.r1.h', K('advice', { ...B, role: 1 }), [
      "I asked {b} because I knew {b} would be honest. I just didn't expect it to sting.",
      "{b} said what I was too scared to say to myself.",
      "I needed to hear that. I didn't want to. I needed to.",
    ]),
    ...lines('hutv4.deep.h', K('deep-chat', B), [
      "I didn't expect to cry today. I didn't expect to cry with {b} either.",
      "There are some people you can be completely honest with. {b} is one of them.",
      "{b} asked the right questions. Nobody asks the right questions.",
      "I trust {b} with things I haven't told my oldest friends.",
    ]),
    ...lines('hutv4.vent.r1.h', K('vent', { ...B, role: 1 }), [
      "{b} needed to get that off {b.posAdj} chest. I'm glad it was me {b} told.",
      "I know a lot more about how {b} is feeling now. I'm going to keep it to myself.",
      "{b} isn't as happy as {b} looks. I'm going to keep an eye on that.",
      "I just listened. Sometimes that's all anyone needs in here.",
    ]),
    ...lines('hutv4.pull.h', K('pull', { ...B, role: 0 }), [
      "I've asked. That's the hard bit done. Now I just have to wait and see.",
      "My heart was going the whole time I was talking to {b}. I'm hoping it didn't show.",
      "I went for it. Win or lose, at least I went for it.",
      "I don't know what's going to happen with {b}. I know I want to find out.",
    ]),
  ],
  'two-faced': [
    ...lines('hutv4.pull.r0.t', K('pull', { ...B, role: 0 }), [
      "I went and had a chat with {b}. Just a chat. I'll keep telling myself that.",
      "If my partner asks, it was a friendly chat. It was a very friendly chat.",
      "I like {b}. That's a problem. That's a big problem, and I'm keeping it to myself.",
      "Nobody saw us. Well, somebody always sees. Hopefully not the wrong somebody.",
      "I'm playing a dangerous game, and I know it. I'm still playing it.",
      "I said all the right things to {b}. I've said all the right things to everyone this week.",
      "The less people know about that chat, the better.",
      "I'm going to walk back over there and act like I've been in the kitchen.",
    ]),
    ...lines('hutv4.pull.r1.t', K('pull', { ...B, role: 1 }), [
      "{b} came over for a chat. I was very careful what I said. Very careful.",
      "I let {b} think I'm an open book. I'm a very closed one at the moment.",
      "That chat was nice. It was also risky, for reasons {b} doesn't know.",
    ]),
    ...lines('hutv4.kiss.t', K('kiss', B), [
      "{b} thinks that kiss means everything's fine. I hope everything's fine.",
      "Kissing {b} in front of everyone is the best alibi I've got.",
      "I love kissing {b}. I also love that it makes people stop asking questions.",
      "Every kiss makes it harder to tell {b} the truth. So I keep kissing.",
      "I kissed {b}, and my head was in about four other places.",
      "When we kiss, nobody's looking at what I'm hiding. That's handy.",
    ]),
    ...lines('hutv4.loyalty.r0.t', K('loyalty', { ...B, role: 0 }), [
      "I turned {b} down in front of everyone. It's the best thing that could have happened for me this week.",
      "I said no to {b}. It makes me look loyal. I need to look loyal right now.",
      "I'll take every chance I get to say no in public. It's very good for business.",
      "If anyone's watching, and they always are, they'll remember I said no.",
    ]),
    ...lines('hutv4.loyalty.r1.t', K('loyalty', { ...B, role: 1 }), [
      "{b} said no. Fine. As long as it stays between us, nothing happened.",
      "That didn't go to plan. I just hope {b} keeps it to {b.ref}.",
      "I shouldn't have asked {b}. I know I shouldn't. I'm hoping nobody else knows I did.",
      "If that gets back to my partner, I'm finished. So it's not going to get back.",
    ]),
    ...lines('hutv4.deep.t', K('deep-chat', B), [
      "{b} opened up to me. I nodded a lot. I didn't open up back.",
      "I told {b} a lot of true things. Not the truest one.",
      "Deep chats are hard when there's something you can't say. I managed. Just.",
      "{b} thinks we're closer now. We are. Mostly.",
      "I got very good at changing the subject today. I didn't enjoy it.",
    ]),
    ...lines('hutv4.friend.t', K('friendship', B), [
      "{b} is a good friend. I'm being a slightly less good one at the moment.",
      "We laughed all afternoon. I laughed a bit louder than I meant to.",
      "{b} trusts me completely. That's lovely. And that's the problem.",
      "I almost told {b} everything today. Almost.",
      "I love spending time with {b}. It's the only time I stop worrying.",
      "{b} has no idea what's going on with me. I'd like to keep it that way. For now.",
      "Being a good friend while hiding something is the hardest thing I've done in here.",
      "{b} kept asking if I was okay. I kept saying I'm fine. I'm a bit less than fine.",
      "I'd tell {b} anything. Anything except the one thing.",
    ]),
    ...lines('hutv4.argument.t', K('argument', B), [
      "That fight wasn't really about what we were fighting about. Not for me, anyway.",
      "I shouted a lot. Shouting is easier than explaining.",
      "Everyone thinks I'm angry with {b}. I'm mostly angry with myself.",
      "I picked a fight so nobody would pick one with me. It worked, sort of.",
      "If I'm honest, I've got no right to be upset. I'm upset anyway.",
      "That fight was a nice distraction. A terrible one, but a nice one.",
    ]),
    ...lines('hutv4.advice.t', K('advice', { ...B, role: 0 }), [
      "I told {b} to be honest with everyone. I really should listen to my own advice.",
      "I gave {b} good advice. It just happened to suit me as well.",
      "It's funny, giving advice about trust. Very funny.",
    ]),
    ...lines('hutv4.gkiss.t', K('game-kiss', { role: 0 }), [
      "It's a game. That's what I'll say. That's what I'll keep saying.",
      "That kiss gave me cover and a bit of fun. Two birds.",
      "Nobody can be angry about a game kiss. Can they? They can. Oh no.",
      "I chose who I chose. In a game, nobody's allowed to ask why.",
    ]),
    ...lines('hutv4.gkiss.r1.t', K('game-kiss', { role: 1 }), [
      "It was a game. I'm going to keep calling it a game, very loudly.",
      "That kiss came at a very bad time for me. I smiled anyway.",
      "If anyone asks, I didn't enjoy it. I'm not sure that's true.",
      "I'm glad it was only a game. I'm going to keep telling myself it was only a game.",
    ]),
    ...lines('hutv4.gossip.t', K('gossip', { ...B, role: 0 }), [
      "I told {b} what I saw. I didn't mention what I did. That's a different conversation.",
      "Pointing at somebody else's mess is a very good way to hide your own.",
    ]),
    ...lines('hutv4.comfort.t', K('comfort', { role: 0 }), [
      "Looking after someone takes my mind off things. It also looks very good.",
      "I sat with {b} for an hour. It's the first hour today I haven't felt guilty.",
    ]),
  ],
};
