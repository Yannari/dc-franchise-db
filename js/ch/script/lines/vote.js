// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/vote.js — the vote, said out loud
// ══════════════════════════════════════════════════════════════════════
//
// TJ opens it, asks every player in turn, and reads the result. A ballot is
// a = the voter, b = the name, and its ending is the engine's reason
// (ceremony.js): plan (the alliance's name), word (kept a promise to a
// recruiter), own (their own read), falseyes (said yes to a plan, votes
// otherwise), broke (broke from the plan in front of it), changed (told the
// house one name, said another).
//
// A ceremony is twenty ballots in one day, and the picker never lets a line
// be heard twice in a day, so these pools are deep: every reason pool merges
// with ballot.any. Ballots are short — on the real show most people say the
// name and one sentence — and the long ones are the moments: a friend voting
// a friend, a flip, a betrayal said to someone's face.

export default {
  'cer-open.m': [
    { id: 'co.m1', turns: [{ by: 'tj', say: "Guys' week, people! One of you fellas is going into the Arena, and the house decides who. Let's hear it." }] },
    { id: 'co.m2', turns: [{ by: 'tj', say: "Alright, it's a men's vote. Everybody's going to say a name, out loud, to my face. No take-backs, no whispering. Let's go." }] },
    { id: 'co.m3', turns: [{ by: 'tj', say: "Fellas, look around. One of you is about to have a very bad week. Ladies, you're voting too, so don't get comfortable." }] },
  ],
  'cer-open.f': [
    { id: 'co.f1', turns: [{ by: 'tj', say: "Ladies' week! One of you queens is going into the Arena, and the whole house gets a say. Who's it gonna be?" }] },
    { id: 'co.f2', turns: [{ by: 'tj', say: "It's a women's vote, people. One name each, said nice and loud. I love this part. I'm not supposed to love this part, but I love this part." }] },
    { id: 'co.f3', turns: [{ by: 'tj', say: "Ladies, one of you is going into the Arena. Fellas, you're voting, so think hard. Let's go around the room." }] },
  ],
  'cer-open.all': [
    { id: 'co.a1', turns: [{ by: 'tj', say: "Here we go, people. One name each, out loud. Whoever gets the most is going into the Arena." }] },
    { id: 'co.a2', turns: [{ by: 'tj', say: "Deliberation's over. Time to put your money where your mouth is. Who's going in?" }] },
    { id: 'co.a3', turns: [{ by: 'tj', say: "I want names, and I want reasons, and I want drama. Mostly the drama. Let's do it." }] },
  ],

  // ── any ballot ──────────────────────────────────────────────────────
  'ballot.any': [
    { id: 'bl.1', turns: [{ by: 'a', say: '{b}.' }] },
    { id: 'bl.2', turns: [{ by: 'a', say: "I'm voting for {b}." }] },
    { id: 'bl.3', turns: [{ by: 'a', say: "{b}. Nothing personal." }] },
    { id: 'bl.4', turns: [{ by: 'a', say: "I'm going to say {b}." }] },
    { id: 'bl.5', turns: [{ by: 'a', say: "{b}, because I think it's time." }] },
    { id: 'bl.6', turns: [{ by: 'a', say: "My vote is {b}." }] },
    { id: 'bl.7', turns: [{ by: 'a', say: "It's {b} for me." }] },
    { id: 'bl.8', turns: [{ by: 'a', say: "{b}. I think everybody saw this coming." }] },
    { id: 'bl.9', turns: [{ by: 'a', say: "I'm going {b}. Let's see what {b.sub} can do in there." }] },
    { id: 'bl.10', turns: [{ by: 'tj', say: '{a}?' }, { by: 'a', say: '{b}.' }] },
    { id: 'bl.11', turns: [{ by: 'tj', say: "{a}, my friend, who you got?" }, { by: 'a', say: "{b}, TJ." }] },
    { id: 'bl.12', turns: [{ by: 'tj', say: "{a}, your turn." }, { by: 'a', say: "I'm voting {b}." }] },
    { id: 'bl.13', turns: [{ by: 'a', say: "{b}. Sorry." }] },
    { id: 'bl.14', turns: [{ by: 'a', say: "I'll say {b}." }] },
    { id: 'bl.15', turns: [{ by: 'a', say: "{b}, and I'll stand by it." }] },
    { id: 'bl.16', turns: [{ by: 'tj', say: "Who's it gonna be, {a}?" }, { by: 'a', say: "{b}." }] },
    { id: 'bl.17', turns: [{ by: 'a', say: "Honestly? {b}." }] },
    { id: 'bl.18', turns: [{ by: 'a', say: "{b}. Good luck in there." }] },
    { id: 'bl.19', when: { band: 'friends' }, turns: [{ by: 'a', say: "This one hurts, but... {b}." }] },
    { id: 'bl.20', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}. I'm sorry. I'll explain later." }, { by: 'b', say: 'Wow.' }] },
    { id: 'bl.21', when: { band: 'enemies', early: false }, turns: [{ by: 'a', say: "{b}. Obviously." }] },
    { id: 'bl.22', when: { band: 'enemies', early: false }, turns: [{ by: 'a', say: "{b}. And I'd do it every week if they let me." }] },
    { id: 'bl.23', when: { band: 'cold', early: false }, turns: [{ by: 'a', say: "{b}. We both know why." }] },
    { id: 'bl.24', when: { register: 'fiery' }, turns: [{ by: 'a', say: "{b}! Next question." }] },
    { id: 'bl.25', when: { register: 'shy' }, turns: [{ by: 'a', say: "Um... {b}." }] },
    { id: 'bl.26', when: { register: 'sweet' }, turns: [{ by: 'a', say: "I really like you, {b}, but I'm voting for you. I'm sorry." }] },
    { id: 'bl.27', when: { register: 'cool' }, turns: [{ by: 'a', say: "{b}. It's the right move." }] },
    { id: 'bl.28', when: { register: 'competitor' }, turns: [{ by: 'a', say: "{b}. If you want to stay, go win." }] },
    { id: 'bl.29', when: { register: 'schemer' }, turns: [{ by: 'a', say: "{b}. And I'm sure you understand." }] },
  ],
  'ballot.plan': [
    { id: 'bp.1', turns: [{ by: 'a', say: "{b}. I'm sticking with my people." }] },
    { id: 'bp.2', turns: [{ by: 'a', say: "{b}. I think we all know how this one's going." }] },
    { id: 'bp.3', turns: [{ by: 'a', say: "I'm voting {b}, because I think it's best for the people I'm working with." }] },
    { id: 'bp.4', turns: [{ by: 'a', say: "{b}. That's where I'm at." }, { by: 'a', conf: "I didn't pick {b}. My alliance did. I just said it out loud." }] },
    { id: 'bp.5', turns: [{ by: 'a', say: "{b}. I'm not going rogue this week." }] },
    { id: 'bp.6', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}... I'm sorry. My hands are kind of tied." }, { by: 'a', conf: "Voting for {b} was the worst thing I've done in here. I did it for the group." }] },
  ],
  'ballot.word': [
    { id: 'bw.1', turns: [{ by: 'a', say: "{b}. I gave my word to somebody, and I keep my word." }] },
    { id: 'bw.2', turns: [{ by: 'a', say: "{b}. I said I would, so I am." }] },
    { id: 'bw.3', turns: [{ by: 'a', say: "{b}. A promise is a promise." }] },
  ],
  'ballot.own': [
    { id: 'bo.1', turns: [{ by: 'a', say: "{b}. Nobody told me to. This one's all me." }] },
    { id: 'bo.2', turns: [{ by: 'a', say: "{b}. I'm voting with my gut." }] },
    { id: 'bo.3', turns: [{ by: 'a', say: "{b}, because I think {b} is the biggest threat to me personally." }] },
    { id: 'bo.4', turns: [{ by: 'a', say: "I'm not in anybody's group, so I'll just say it. {b}." }] },
    { id: 'bo.5', turns: [{ by: 'a', say: "{b}. I make my own decisions." }] },
  ],
  'ballot.falseyes': [
    { id: 'bf.1', turns: [
      { by: 'a', say: '{b}.' },
      { beat: "A couple of heads snap around. That wasn't the name {a} promised." },
      { by: 'a', conf: "Yes, I said I'd vote with them. I lied. Welcome to The Challenge." },
    ] },
    { id: 'bf.2', turns: [
      { by: 'a', say: "{b}." },
      { by: 'tj', say: "Ooh! Was that a surprise? I feel like that was a surprise. Somebody's face just did a thing." },
      { by: 'a', conf: "They'll be mad. They'll get over it, or they won't. Either way, I did what I needed to." },
    ] },
    { id: 'bf.3', turns: [
      { by: 'a', say: "I'm voting {b}." },
      { beat: 'Somebody across the room mouths "what?"' },
      { by: 'a', conf: "I had to look them in the eye this morning and agree with them. Tonight I didn't have to pretend anymore." },
    ] },
  ],
  'ballot.broke': [
    { id: 'bb.1', turns: [
      { by: 'a', say: "{b}. I know that's not what we said. I'm sorry." },
      { by: 'a', conf: "I went back and forth all day. In the end I couldn't do what they wanted, so I did what I wanted." },
    ] },
    { id: 'bb.2', turns: [
      { by: 'a', say: "I'm going {b}, and I know some of you are going to be mad at me." },
      { beat: "Somebody in {a}'s alliance shakes their head slowly." },
    ] },
    { id: 'bb.3', turns: [
      { by: 'a', say: "{b}. I had to break from the group this week." },
      { by: 'a', conf: "Following the plan would have been easier. It also would have put me next in line." },
    ] },
  ],
  'ballot.changed': [
    { id: 'bc.1', turns: [
      { by: 'a', say: "I... {b}. I'm going {b}." },
      { by: 'a', conf: "I came in planning to vote for somebody else. Then I heard where everybody was going, and I changed my mind." },
    ] },
    { id: 'bc.2', turns: [
      { by: 'a', say: "{b}." },
      { by: 'tj', say: "Ooh, I did not see that one coming. Keep going." },
    ] },
    { id: 'bc.3', turns: [
      { by: 'a', say: "I changed my mind. {b}." },
      { by: 'a', conf: "When I saw where the votes were going, I wasn't going to be the one person on the wrong side of it." },
    ] },
  ],

  // ── the result ──────────────────────────────────────────────────────
  'cer-result.clear': [
    { id: 'cr.c1', turns: [
      { by: 'tj', say: "With {count} votes, {a}, you're going into the Arena tomorrow night. And when you get there, you pick who goes in with you." },
      { by: 'a', conf: "I knew it was coming. Hearing it said out loud is still a punch in the stomach." },
    ] },
    { id: 'cr.c2', turns: [
      { by: 'tj', say: "The house has spoken, with {count} votes. {a}, buddy, it's you." },
      { by: 'a', say: "Yeah. I figured." },
    ] },
    { id: 'cr.c3', turns: [
      { by: 'tj', say: "And that's {count} for {a}! You're going in, my friend. Tomorrow night, at the Arena, you choose your fighter." },
      { by: 'a', conf: "I'm not going to cry about it. I'm going to go in there and win." },
    ] },
  ],
  'cer-result.tie': [
    { id: 'ct.1', turns: [
      { by: 'tj', say: "Oh, we've got a TIE! And you know what that means. Today's winners break it. Winners, who's it gonna be?" },
      { beat: 'The daily winners look at each other. It takes them a long time.' },
      { by: 'tj', say: "The tiebreakers have decided. {a}, you're going in." },
      { by: 'a', conf: "It came down to two people choosing between me and somebody else, and they chose me. I'm going to remember that." },
    ] },
    { id: 'ct.2', turns: [
      { by: 'tj', say: "A tie! My favorite! Winners, the decision is all yours. No pressure. Actually, a lot of pressure." },
      { by: 'tj', say: "And it's {a}! You're going into the Arena." },
    ] },
    { id: 'ct.3', turns: [
      { by: 'tj', say: "Dead even, people. Our daily winners have to settle it." },
      { beat: 'A long pause. Somebody coughs.' },
      { by: 'tj', say: "{a}. The tiebreakers picked you. Sorry, buddy." },
    ] },
  ],
};
