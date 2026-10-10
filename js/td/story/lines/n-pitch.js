// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-pitch.js — pitches away from the vote, as full scenes
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: "pitch not only being before the votes, like pitch to switch people from one alliance
// to another, or convince to vote a friend". The engine decides them (camp-events.js checkTurnFriendPitches,
// and recruitment's poach); these are the long versions the director airs (`long.<scene kind>`).
//   long.pitch.turn.<took|refused|warned>  a works on b to turn on b's friend {friend}; warned: b goes and
//                                          tells {c} (the friend, on stage only then)
//   long.recruit.join.poach                a pulls b out of {from} into {group}; somebody from {from} notices
// Ids: 'npi.'.

// the vote, when the pitch worked: b writes the friend's name, and says who talked them into it
//   booth.turned   {target} is the friend, {pitcher} the one who worked on b (tribal.js)
const B = (id, conf, v) => ({ id, turns: [{ by: 'a', conf, ...(v ? { v } : {}) }] });

export default {
  'booth.turned': [
    B('npi.b1', "{target}. A few days ago I'd never have written this. Then {pitcher} asked me one question, and I couldn't stop thinking about it.", { soft: "{target}, I'm so sorry, but {pitcher} made me see some things, and I can't unsee them.", loud: "{target}! I didn't want to believe {pitcher}, but here we are!" }),
    B('npi.b2', "{target}. You'd have beaten me at the end. {pitcher} was right about that, and I hate that {pitcher} was right.", { sharp: "{target}, you'd have won and I'd have clapped, and {pitcher} reminded me I didn't come here to clap." }),
    B('npi.b3', "I love you, {target}. I just love winning a little more.", { dry: "{target}, it's nothing personal, or maybe it's a little personal, so ask {pitcher} about it." }),
    B('npi.b4', "{target}, I watched you like {pitcher} told me to, and I didn't like what I saw.", { anxious: "{target}, I watched you the way {pitcher} said, and I really hope I'm wrong about this." }),
    B('npi.b5', "{pitcher} told me to be ready, and I'm ready now, so I'm sorry, {target}."),
    B('npi.b6', "{target}, you were my best friend out here. That's exactly why it has to be now.", { loud: "{target}, you were my best friend, and that's why it's NOW!" }),
  ],
  'long.pitch.turn.took': [
    { id: 'npi.t1', place: 'aside', turns: [
      { beat: "{a} waits until {friend} is busy with something else, then sits down next to {b}." },
      { by: 'a', say: "Can I ask you something, and you promise you won't get mad?", v: { sharp: "Can I tell you something you won't want to hear?", loud: "Okay, I have to say something, and you're going to hate it.", soft: "Can I ask you something? And please don't be mad at me." } },
      { by: 'b', say: "That depends on what it is." },
      { by: 'a', say: "Has {friend} ever told you who {friend} would take to the end?" },
      { by: 'b', say: "We haven't really talked about it." },
      { by: 'a', say: "Funny, because {friend} has talked about it with me. And it wasn't you." },
      { by: 'b', say: "...What did {friend} say?" },
      { by: 'a', say: "I'd rather not repeat it. I just think you should know where you stand." },
      { by: 'b', say: "{friend} wouldn't do that to me.", v: { dry: "That doesn't sound like {friend}. But then, I guess I'd be the last to know.", loud: "No way. {friend} would NOT say that!", anxious: "No, {friend} wouldn't do that to me... would {friend}?" } },
      { by: 'a', say: "Maybe not, but just watch, because that's all I'm asking." },
      { beat: "{b} looks across camp at {friend} for a long time." },
      { by: 'b', conf: "I've trusted {friend} since day one. Now every time {friend} laughs with somebody else, I wonder what they're laughing about." },
      { by: 'a', conf: "I never said {friend} was bad, I just said {friend} wasn't thinking about {b}, and that's usually enough." },
    ] },
    { id: 'npi.t2', place: 'aside', turns: [
      { by: 'a', say: "Do you want to know what I think? I think everybody here would vote for {friend} at the end." },
      { by: 'b', say: "Okay, so? {friend}'s my friend." },
      { by: 'a', say: "So if you sit next to {friend} at the end, you lose. Every single vote goes to {friend}." },
      { by: 'b', say: "I hadn't really thought about the end yet." },
      { by: 'a', say: "{friend} has. Trust me." },
      { by: 'b', say: "So what are you saying? I should vote out my best friend?" },
      { by: 'a', say: "I'm saying you should be ready to. Before {friend} is ready to do it to you.", v: { sharp: "I'm saying the smart players cut their biggest threat early, and yours sleeps right next to you.", soft: "I'm saying I don't want to see you get hurt. That's all." } },
      { by: 'b', say: "...I need to think about this." },
      { by: 'a', say: "Take your time. Just not too much time." },
      { by: 'b', conf: "I came out here to win, and my best friend is the one person I can't beat. I hate that I'm even thinking this." },
    ] },
  ],
  'long.pitch.turn.refused': [
    { id: 'npi.r1', place: 'aside', turns: [
      { by: 'a', say: "You and {friend} are really close, huh?" },
      { by: 'b', say: "Yeah. Why?" },
      { by: 'a', say: "Just be careful. {friend} is a lot better at this game than people think." },
      { by: 'b', say: "Meaning what?" },
      { by: 'a', say: "Meaning if {friend} had to pick between you and a million dollars, I don't think {friend} picks you." },
      { by: 'b', say: "And you would?", v: { sharp: "And you'd pick me? Please.", dry: "Interesting. And you're the trustworthy one in this conversation?", loud: "Oh, and YOU'D pick me? Come on!" } },
      { by: 'a', say: "I'm just looking out for you." },
      { by: 'b', say: "No, you're looking out for you, and you want me to do the dirty work. Not happening." },
      { by: 'a', say: "Okay. Don't say I didn't try." },
      { by: 'b', conf: "{a} wants me to turn on {friend}. All that did was tell me who to keep an eye on, and it isn't {friend}." },
      { by: 'a', conf: "{b} is loyal, which is sweet, and it's also exactly why {b} won't see it coming." },
    ] },
    { id: 'npi.r2', place: 'aside', turns: [
      { beat: "{a} catches {b} alone and gets straight to it." },
      { by: 'a', say: "Here's an offer. Help me get rid of {friend}, and I'll take you all the way." },
      { by: 'b', say: "Wow. You don't waste time." },
      { by: 'a', say: "There isn't any to waste." },
      { by: 'b', say: "And next week, when somebody makes you a better offer, you'll be telling them the same thing about me." },
      { by: 'a', say: "Maybe. But today I'm telling you." },
      { by: 'b', say: "No. {friend} has had my back since day one. I'm not trading that for a promise from you." },
      { by: 'a', say: "Your call." },
      { by: 'b', conf: "I've never been offered the end of the game before. I said no in about five seconds. I'm a little proud of that." },
    ] },
  ],
  'long.pitch.turn.warned': [
    { id: 'npi.w1', place: 'aside', turns: [
      { by: 'a', say: "I'll be honest with you, because somebody should be. {friend} is going to cost you this game." },
      { by: 'b', say: "Is that right?" },
      { by: 'a', say: "Everybody loves {friend}, and you'll never beat {friend} at the end, so think about it." },
      { by: 'b', say: "Oh, I'm thinking about it.", v: { sharp: "Oh, I'm thinking. Just not about {friend}.", loud: "Oh, I'm thinking about it, all right!" } },
      { beat: "{b} walks straight across camp to {c}." },
      { by: 'b', say: "We need to talk. {a} just tried to get me to turn on you." },
      { by: 'c', say: "What? What did {a} say?" },
      { by: 'b', say: "That everybody loves you, and I'd never beat you at the end. So I should get rid of you while I can." },
      { by: 'c', say: "And what did you say?" },
      { by: 'b', say: "I didn't say anything. I came straight here." },
      { by: 'c', conf: "{a} went after me through my best friend. That's a mistake {a} is going to pay for." },
    ] },
    { id: 'npi.w2', place: 'aside', turns: [
      { by: 'a', say: "Has {friend} said anything to you about me?" },
      { by: 'b', say: "No. Why would {friend}?" },
      { by: 'a', say: "Because {friend} has been saying plenty about you." },
      { by: 'b', say: "Funny. Let's ask {friend}." },
      { by: 'a', say: "Wait, you don't have to do that..." },
      { beat: "{b} waves {c} over before {a} can stop it." },
      { by: 'b', say: "{a} says you've been talking about me." },
      { by: 'c', say: "I haven't said one word about you. {a}, what is this?", v: { loud: "WHAT? I haven't said a single word about you, so {a}, what are you doing?", soft: "I would never. {b}, you know I would never." } },
      { by: 'a', say: "I must have heard it wrong." },
      { by: 'c', say: "Yeah. You must have." },
      { by: 'c', conf: "{a} just got caught lying, to both of us, at the same time. I almost want to say thank you." },
    ] },
  ],
  'long.recruit.join.poach': [
    { id: 'npi.p1', place: 'aside', turns: [
      { by: 'a', say: "Can I ask you something? Honestly, how are things in {from}?" },
      { by: 'b', say: "Fine, I guess. Why do you ask?" },
      { by: 'a', say: "Because when they talk about the next vote, they go quiet when you walk up. I've seen it." },
      { by: 'b', say: "...You've seen that?" },
      { by: 'a', say: "Everybody's seen it except you, so come to {group}, because we actually want you." },
      { by: 'b', say: "If I leave {from}, they'll come after me." },
      { by: 'a', say: "They're already going to. At least with us, you'll have people when they do." },
      { by: 'b', say: "...Okay. Okay, I'm in." },
      { by: 'a', say: "Welcome to {group}, and don't tell {from} yet, okay?" },
      { by: 'b', conf: "I just switched sides. My heart is pounding. I don't know if I've saved my game or ended it." },
      { by: 'a', conf: "{from} just lost a vote, and they don't even know it yet." },
    ] },
    { id: 'npi.p2', place: 'aside', turns: [
      { by: 'b', say: "Why do you keep being so nice to me? I'm in {from}." },
      { by: 'a', say: "For now." },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', say: "It means {group} has room for one more, and I want it to be you." },
      { by: 'b', say: "And what happens to me in {from} when they find out?" },
      { by: 'a', say: "By the time they find out, it won't matter. We'll have the numbers." },
      { by: 'b', say: "That's a big promise." },
      { by: 'a', say: "Then hold me to it." },
      { by: 'b', say: "...Fine, I'm in, but if this goes wrong, I'm blaming you." },
      { by: 'b', conf: "{from} never once asked me what I wanted. {a} asked in five minutes. That's why I said yes." },
    ] },
  ],
};
