// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist1.js — Halting Hex, side bets, Roadkill (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/eviction-powers.js, side-bet.js and roadkill.js.
//
//   hex.list       a was saved by a Hex after the votes were read; {group} voted a out; b is one   scene
//   hex.spent      a spent the Hex on b; c reads what that means        scene
//   bet.rail       a, a nominee, watches the house bet on a             laughs | freeze (b is who a blames)
//   bet.collected  a won a bet on {gone}'s eviction                      mourner (b minds) | barometer (b watches a)
//   road.theory    a is sure b turned the anonymous key; c hears it      scene
//   road.defend    a accuses b of the anonymous nomination               guilty | innocent
//   road.signature a, after the second anonymous key, suspects b        scene

export default {
  'hex.list.scene': [
    { id: 'tz.h1', turns: [{ by: 'a', dr: "Every vote was read out. Then nothing happened. So now I've got a list of everyone who wanted me gone. {group}." }] },
    { id: 'tz.h2', turns: [{ by: 'a', dr: "{group} voted to evict me. Out loud, in front of everyone. And I'm still here." }] },
    { id: 'tz.h3', turns: [{ by: 'b', say: "About the vote..." }, { by: 'a', say: "I heard it. We all heard it." }] },
    { id: 'tz.h4', turns: [{ by: 'a', dr: "The house just handed me a list of my enemies, and nothing happened to me. Thank you." }] },
    { id: 'tz.h5', turns: [{ by: 'b', dr: "My vote against {a} was read out loud, and {a} is still in the house. How do I explain that?" }] },
    { id: 'tz.h6', turns: [{ by: 'a', say: "Morning, {b}." }, { by: 'b', say: "...Morning." }, { by: 'a', dr: "{b} voted to get rid of me. I'll remember." }] },
  ],
  'hex.spent.scene': [
    { id: 'tz.s1', turns: [{ by: 'c', dr: "{a} had a secret power and used it on {b}, not on {a.ref}. Whatever their deal is, {b} was worth it." }] },
    { id: 'tz.s2', turns: [{ by: 'c', dr: "{a} isn't protected by anything any more. It took me about four minutes to work that out." }] },
    { id: 'tz.s3', turns: [{ by: 'c', say: "{a} told us two things today. There was a power. And who {a} was willing to lose it for." }] },
    { id: 'tz.s4', turns: [{ by: 'b', say: "You didn't have to do that." }, { by: 'a', say: "Yes, I did." }, { by: 'c', dr: "Well. Now everyone knows." }] },
    { id: 'tz.s5', turns: [{ by: 'c', dr: "{a} and {b} can't pretend they're casual any more. Not after that." }] },
    { id: 'tz.s6', turns: [{ by: 'a', dr: "I spent my power on {b}. Everyone saw. I'd do it again." }] },
  ],
  'bet.rail.laughs': [
    { id: 'tz.r1', turns: [{ by: 'a', say: "If you're betting on me, at least say something nice at the door on Thursday." }, { beat: 'The rail laughs. Nervously.' }] },
    { id: 'tz.r2', turns: [{ by: 'a', say: "Can nominees bet on themselves? Asking for me." }, { beat: 'Half the rail laughs. The other half suddenly has somewhere to be.' }] },
    { id: 'tz.r3', when: { intent: 'named' }, turns: [{ by: 'a', say: "Put ten on me. Easy money." }, { by: 'b', say: "...I'll think about it." }] },
    { id: 'tz.r4', turns: [{ by: 'a', dr: "Everyone's betting on whether I go home. I might as well laugh about it." }] },
    { id: 'tz.r5', turns: [{ by: 'a', say: "What are the odds on me tonight?" }, { beat: 'Nobody answers.' }] },
    { id: 'tz.r6', turns: [{ by: 'a', dr: "Watching people bet on my eviction is strange. I'm keeping my sense of humour. Just about." }] },
  ],
  'bet.rail.freeze': [
    { id: 'tz.f1', turns: [{ by: 'a', dr: "I watched everyone who went to that rail. I've stopped talking to one of them. {b}." }] },
    { id: 'tz.f2', turns: [{ by: 'b', dr: "{a} won't look at me since the betting. I don't know what {a} thinks I did." }] },
    { id: 'tz.f3', turns: [{ by: 'b', say: "Are we okay?" }, { by: 'a', say: "You tell me." }, { beat: '{a} walks off.' }] },
    { id: 'tz.f4', turns: [{ by: 'a', dr: "The betting is public. {b} couldn't get to that window fast enough." }] },
    { id: 'tz.f5', turns: [{ by: 'a', dr: "I'm on the block and saying nothing. That's an announcement too." }] },
    { id: 'tz.f6', turns: [{ by: 'b', say: "Why do you keep looking at me like that?" }, { by: 'a', say: "No reason." }] },
  ],
  'bet.collected.mourner': [
    { id: 'tz.m1', turns: [{ by: 'b', say: "You made money on my friend." }, { by: 'a', say: "It's just the game." }, { by: 'b', say: "I know it is." }, { by: 'b', dr: "I'm still moving {a} up my list." }] },
    { id: 'tz.m2', turns: [{ by: 'b', dr: "{a} collected on {gone}'s eviction before the door had even shut." }] },
    { id: 'tz.m3', turns: [{ by: 'a', dr: "I won the bet. {b} won't forgive me for it. It was a bet." }] },
    { id: 'tz.m4', turns: [{ by: 'b', dr: "{a} was so gracious about winning. Somehow that's worse." }] },
    { id: 'tz.m5', turns: [{ by: 'b', say: "Congratulations." }, { by: 'a', say: "Thanks." }, { by: 'b', dr: "I didn't mean it." }] },
    { id: 'tz.m6', turns: [{ by: 'b', dr: "{a} bet on {gone} going home, and won. I'll remember that." }] },
  ],
  'bet.collected.barometer': [
    { id: 'tz.b1', when: { intent: 'watched' }, turns: [{ by: 'b', dr: "{a} called that eviction exactly. That's not luck. {a} can read this house." }] },
    { id: 'tz.b2', when: { intent: 'watched' }, turns: [{ by: 'b', dr: "The house paid {a} out in front of everyone. The real prize is the reputation. {a} knew." }] },
    { id: 'tz.b3', when: { intent: 'watched' }, turns: [{ by: 'b', dr: "I'm going to sit nearer {a} at meals from now on. If someone can read the room, you keep them close." }] },
    { id: 'tz.b4', turns: [{ by: 'a', dr: "I called the eviction exactly. People are going to start asking me things." }] },
    { id: 'tz.b5', turns: [{ by: 'a', dr: "I just listen. That's how I knew." }] },
    { id: 'tz.b6', turns: [{ by: 'a', dr: "Winning the bet was nice. Everyone knowing I read the vote right is nicer." }] },
  ],
  'road.theory.scene': [
    { id: 'tz.t1', turns: [{ by: 'a', say: "We all know it was {b}." }, { by: 'c', say: "Do we?" }, { by: 'a', say: "We do." }, { beat: '{c} does not argue.' }] },
    { id: 'tz.t2', turns: [{ by: 'a', say: "{b} was acting strange the morning of the competition." }, { by: 'c', say: "Was {b}?" }, { by: 'a', say: "Definitely." }] },
    { id: 'tz.t3', turns: [{ by: 'a', dr: "Nobody can prove who turned that key. I don't need proof. It was {b}." }] },
    { id: 'tz.t4', turns: [{ by: 'c', dr: "{a} keeps saying it was {b}. I'm not sure. But I'm not saying that out loud." }] },
    { id: 'tz.t5', turns: [{ by: 'b', dr: "Everyone's decided I'm the secret nominator. I didn't win anything!" }] },
    { id: 'tz.t6', turns: [{ by: 'a', dr: "By Thursday, the whole house will think it was {b}. That's how it works in here." }] },
  ],
  'road.defend.guilty': [
    { id: 'tz.g1', turns: [{ by: 'a', say: "Was it you? The third nomination?" }, { by: 'b', say: "No. Why would you think that?" }, { by: 'a', dr: "Not one useful answer." }] },
    { id: 'tz.g2', turns: [{ by: 'b', say: "Why would I put you up and then sit here talking to you about it?" }, { by: 'a', say: "...Good question." }, { by: 'b', dr: "It's a good question. It's not an answer." }] },
    { id: 'tz.g3', turns: [{ by: 'b', dr: "{a} asked me straight out. I said no. One of us is lying, and it's me." }] },
    { id: 'tz.g4', turns: [{ by: 'a', dr: "{b} answered that very quickly. Too quickly." }] },
    { id: 'tz.g5', turns: [{ by: 'b', say: "It wasn't me." }, { by: 'a', say: "Are you sure?" }, { by: 'b', say: "Positive." }, { by: 'b', dr: "Lying is easier than I thought." }] },
    { id: 'tz.g6', turns: [{ by: 'a', dr: "I can't prove it was {b}. But {b} didn't even blink." }] },
  ],
  'road.defend.innocent': [
    { id: 'tz.i1', turns: [{ by: 'b', say: "How am I supposed to prove I didn't win a competition nobody saw?" }, { by: 'a', say: "You can't." }, { by: 'b', say: "Exactly." }] },
    { id: 'tz.i2', turns: [{ by: 'b', say: "I didn't nominate you. I couldn't have. I don't even know who won!" }, { by: 'a', dr: "{b} answered so fast. It sounded rehearsed." }] },
    { id: 'tz.i3', turns: [{ by: 'b', dr: "I'm defending myself against something I didn't do. The only defence I've got is saying so." }] },
    { id: 'tz.i4', turns: [{ by: 'b', say: "What would I even gain?" }, { beat: '{a} shrugs.' }] },
    { id: 'tz.i5', turns: [{ by: 'a', dr: "{b} keeps denying it. That's exactly what the guilty person would do." }] },
    { id: 'tz.i6', turns: [{ by: 'b', dr: "{a} has decided it was me. Nothing I say is going to change that." }] },
  ],
  'road.signature.scene': [
    { id: 'tz.n1', turns: [{ by: 'a', say: "Whoever turned the first key just turned the second one. And they're sitting in this room." }] },
    { id: 'tz.n2', turns: [{ by: 'a', dr: "Two anonymous nominations in one week. That's not a mystery any more. It's a signature." }] },
    { id: 'tz.n3', turns: [{ by: 'a', say: "That's not the HOH. That's the same person as last time." }, { beat: 'The room stops enjoying the confusion.' }] },
    { id: 'tz.n4', turns: [{ by: 'a', dr: "Somebody in here did it twice. I think it's {b}." }] },
    { id: 'tz.n5', turns: [{ by: 'b', dr: "{a} keeps looking at me since the second key. I don't like it." }] },
    { id: 'tz.n6', turns: [{ by: 'a', dr: "Same person, twice. I'm going to find out who." }] },
  ],
};
