// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/past.js — what happened before this season (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/franchise-history.js: returnees with history from an
// aired season ({when}: "Season 3", "Big Brother 2"). Only what the ledger
// records is said — who betrayed whom, who blindsided whom, a rivalry, an
// alliance, a showmance — never a detail it does not hold.
//
//   past.surfaces    a and b's history comes out; c is in the room
//       betrayed   b betrayed a in {when}          blindsided  b blindsided a in {when}
//       rivals     old rivals                       broken      a showmance that ended badly
//       allies     rode together to the end         together    a showmance that lasted
//   past.nominated   b, the HOH, nominates a
//       again      b wronged a before, and has done it again
//       revenge    a wronged b before; b gets even
//       rivals     old rivals or exes               good        old allies
//   past.settled     a votes to evict b
//       wronged    b wronged a before               rivals      old rivals or exes
//   past.known       the house knows a's reputation; b says it    scene

export default {
  'past.surfaces.betrayed': [
    { id: 'ph.b1', turns: [{ by: 'a', dr: "{b} betrayed me in {when}. I didn't come back to let that go." }] },
    { id: 'ph.b2', turns: [{ by: 'a', say: "You want to talk about {when}?" }, { by: 'b', say: "Not really." }, { by: 'a', say: "No. I bet you don't." }] },
    { id: 'ph.b3', when: { third: true }, turns: [{ by: 'c', say: "What's the deal with you two?" }, { by: 'a', say: "{b} betrayed me last time." }, { beat: 'The room goes quiet.' }] },
    { id: 'ph.b4', turns: [{ by: 'b', dr: "{a} hasn't forgotten {when}. I didn't expect {a} to." }] },
    { id: 'ph.b5', turns: [{ by: 'a', say: "We've been very polite for six days." }, { by: 'b', say: "We have." }, { by: 'a', say: "I'm done being polite." }] },
    { id: 'ph.b6', turns: [{ by: 'a', dr: "Last time I trusted {b}, it cost me. Not this time." }] },
  ],
  'past.surfaces.blindsided': [
    { id: 'ph.s1', turns: [{ by: 'a', dr: "{b} blindsided me in {when}. I walked out of that house without seeing it coming. I'm watching now." }] },
    { id: 'ph.s2', turns: [{ by: 'a', say: "Remember {when}?" }, { by: 'b', say: "It was a game." }, { by: 'a', say: "It was my game." }] },
    { id: 'ph.s3', when: { third: true }, turns: [{ by: 'c', dr: "{a} and {b} have history. {b} blindsided {a} last time. Everyone can feel it." }] },
    { id: 'ph.s4', turns: [{ by: 'b', dr: "I blindsided {a} last time. {a} is never going to let me near a vote again." }] },
    { id: 'ph.s5', turns: [{ by: 'a', say: "Is there anything you want to tell me before Thursday?" }, { by: 'b', say: "No." }, { by: 'a', say: "That's what you said last time." }] },
    { id: 'ph.s6', turns: [{ by: 'a', dr: "I didn't see it coming in {when}. I'll see it coming this time." }] },
  ],
  'past.surfaces.rivals': [
    { id: 'ph.r1', turns: [{ by: 'a', dr: "{b} and I didn't get on in {when}. Nothing has changed." }] },
    { id: 'ph.r2', turns: [{ by: 'a', say: "Still the same, I see." }, { by: 'b', say: "So are you." }] },
    { id: 'ph.r3', when: { third: true }, turns: [{ by: 'c', say: "Have you two met?" }, { by: 'b', say: "Unfortunately." }] },
    { id: 'ph.r4', turns: [{ by: 'b', dr: "{a} was my rival in {when}. I'd be lying if I said I'd missed {a.obj}." }] },
    { id: 'ph.r5', turns: [{ by: 'a', say: "Round two, then." }, { by: 'b', say: "Round two." }] },
    { id: 'ph.r6', turns: [{ by: 'a', dr: "Everyone thinks {b} and I will clash. They're right." }] },
  ],
  'past.surfaces.broken': [
    { id: 'ph.k1', turns: [{ by: 'a', dr: "{b} and I had a showmance in {when}. It ended badly. Now we share a kitchen." }] },
    { id: 'ph.k2', turns: [{ by: 'a', say: "Being in a house with you again is weird, right?" }, { by: 'b', say: "Very weird." }] },
    { id: 'ph.k3', when: { third: true }, turns: [{ by: 'c', say: "Didn't you two used to be together?" }, { by: 'a', say: "Briefly." }, { by: 'b', say: "Very briefly." }] },
    { id: 'ph.k4', turns: [{ by: 'b', dr: "Everyone in here watched {a} and me fall apart on television. They're all waiting for round two." }] },
    { id: 'ph.k5', turns: [{ by: 'a', say: "Can we be normal about this?" }, { by: 'b', say: "We can try." }] },
    { id: 'ph.k6', turns: [{ by: 'a', dr: "I'm here to play, not to go back over what happened with {b}." }] },
  ],
  'past.surfaces.allies': [
    { id: 'ph.a1', turns: [{ by: 'a', dr: "{b} and I made it to the end together in {when}. Everyone in here knows it. That's a problem." }] },
    { id: 'ph.a2', turns: [{ by: 'a', say: "Same as last time?" }, { by: 'b', say: "Not so loud." }] },
    { id: 'ph.a3', when: { third: true }, turns: [{ by: 'c', say: "{a} and {b} already did this once, you know." }, { beat: '{c} says it like an accusation.' }] },
    { id: 'ph.a4', turns: [{ by: 'b', dr: "{a} and I don't need to talk. We just know. People can see that from across the kitchen." }] },
    { id: 'ph.a5', turns: [{ beat: '{a} catches {b}\'s eye over something nobody else finds funny.' }, { by: 'b', dr: "Two of us aren't starting from zero. Everyone else is." }] },
    { id: 'ph.a6', turns: [{ by: 'a', dr: "Nobody believes {b} and I aren't working together. Maybe they're right." }] },
  ],
  'past.surfaces.together': [
    { id: 'ph.t1', turns: [{ by: 'a', dr: "{b} and I met in {when}. We're still together. In here, that makes us a target." }] },
    { id: 'ph.t2', turns: [{ by: 'a', say: "Should we pretend we don't know each other?" }, { by: 'b', say: "Bit late for that." }] },
    { id: 'ph.t3', when: { third: true }, turns: [{ by: 'c', dr: "{a} and {b} are a couple. They came in as a couple. They'll vote as a couple." }] },
    { id: 'ph.t4', turns: [{ by: 'b', dr: "Everyone saw {a} and me fall for each other last time. They all think we're one vote." }] },
    { id: 'ph.t5', turns: [{ by: 'a', say: "We need to split up in here." }, { by: 'b', say: "Only in here." }] },
    { id: 'ph.t6', turns: [{ by: 'a', dr: "I'd do anything for {b}. Everyone in this house knows that. That's dangerous." }] },
  ],
  'past.nominated.again': [
    { id: 'ph.n1', turns: [{ by: 'a', dr: "{b} came after me in {when}. Now {b} has done it again. I'm not even surprised." }] },
    { id: 'ph.n2', turns: [{ by: 'a', dr: "So we're running it back. Fine. I know how this one ends, and so does {b}." }] },
    { id: 'ph.n3', turns: [{ by: 'b', say: "It's not personal." }, { by: 'a', say: "It was personal last time too." }] },
    { id: 'ph.n4', turns: [{ by: 'a', dr: "That's the second time {b} has put me in this chair. There won't be a third." }] },
    { id: 'ph.n5', turns: [{ by: 'b', dr: "I've done this to {a} before. I'm doing it again. I can live with that." }] },
    { id: 'ph.n6', turns: [{ by: 'a', say: "Again?" }, { by: 'b', say: "Again." }] },
  ],
  'past.nominated.revenge': [
    { id: 'ph.v1', turns: [{ by: 'b', dr: "{a} did this to me in {when}. I've had a long time to think about doing it back." }] },
    { id: 'ph.v2', turns: [{ by: 'a', dr: "I knew this was coming. Last time I went after {b}. This time {b} has the key." }] },
    { id: 'ph.v3', turns: [{ by: 'b', say: "How does it feel?" }, { by: 'a', say: "I deserved that." }] },
    { id: 'ph.v4', turns: [{ by: 'b', dr: "It's not personal. Okay, it's a bit personal." }] },
    { id: 'ph.v5', turns: [{ by: 'a', say: "Is this about {when}?" }, { by: 'b', say: "What do you think?" }] },
    { id: 'ph.v6', turns: [{ by: 'a', dr: "What goes around comes around. I just hoped it would take longer." }] },
  ],
  'past.nominated.rivals': [
    { id: 'ph.w1', turns: [{ by: 'a', dr: "{b} and I go back to {when}. Of course {b} put me up." }] },
    { id: 'ph.w2', turns: [{ by: 'b', say: "Nothing personal." }, { by: 'a', say: "With us, it's always personal." }] },
    { id: 'ph.w3', turns: [{ by: 'b', dr: "{a} was always going to end up on my block. Everyone knew it." }] },
    { id: 'ph.w4', turns: [{ by: 'a', dr: "I came back hoping {b} and I could leave the past alone. {b} couldn't." }] },
    { id: 'ph.w5', turns: [{ by: 'a', say: "Took you long enough." }, { by: 'b', say: "I was being patient." }] },
    { id: 'ph.w6', turns: [{ by: 'a', dr: "{b} put me up. Nobody in this house is surprised. Least of all me." }] },
  ],
  'past.nominated.good': [
    { id: 'ph.g1', turns: [{ by: 'b', dr: "{a} and I had each other's backs in {when}. I just put {a} on the block. I owed {a} better." }] },
    { id: 'ph.g2', turns: [{ by: 'a', dr: "{b} couldn't even look at me while doing it. After everything we did last time." }] },
    { id: 'ph.g3', turns: [{ by: 'b', say: "I'm sorry." }, { by: 'a', say: "Don't." }] },
    { id: 'ph.g4', turns: [{ by: 'a', dr: "{b} was the one person in here I thought I could count on. Old loyalties, I suppose." }] },
    { id: 'ph.g5', turns: [{ by: 'b', dr: "Some debts are older than this house. I've just broken one." }] },
    { id: 'ph.g6', turns: [{ by: 'a', say: "Last time you'd never have done this." }, { by: 'b', say: "Last time was different." }] },
  ],
  'past.settled.wronged': [
    { id: 'ph.x1', turns: [{ by: 'a', dr: "{b} did me over in {when}. People keep telling me this is just a game. It was a game last time too." }] },
    { id: 'ph.x2', turns: [{ by: 'a', dr: "Everyone in here will tell you their vote is strategic. Mine isn't. Mine is for {when}." }] },
    { id: 'ph.x3', turns: [{ by: 'a', dr: "I've waited a long time to hold a vote on the night {b} needed one." }] },
    { id: 'ph.x4', turns: [{ by: 'a', dr: "Some debts follow you from one season to the next. Tonight I'm collecting." }] },
    { id: 'ph.x5', turns: [{ by: 'a', dr: "I voted to evict {b}. I didn't even have to think about it." }] },
    { id: 'ph.x6', turns: [{ by: 'a', dr: "{b} cost me last time. Tonight it's my turn." }] },
  ],
  'past.settled.rivals': [
    { id: 'ph.y1', turns: [{ by: 'a', dr: "{b} and I have been at this since {when}. Tonight I get to end it." }] },
    { id: 'ph.y2', turns: [{ by: 'a', dr: "My vote's for {b}. Old habits." }] },
    { id: 'ph.y3', turns: [{ by: 'a', dr: "Everyone knows where my vote is going. They've known since {when}." }] },
    { id: 'ph.y4', turns: [{ by: 'a', dr: "It's strategic. It's also personal. It can be both." }] },
    { id: 'ph.y5', turns: [{ by: 'a', dr: "I came back to finish what started in {when}." }] },
    { id: 'ph.y6', turns: [{ by: 'a', dr: "I've waited a long time to write {b}'s name down." }] },
  ],
  'past.known.scene': [
    { id: 'ph.r7', turns: [{ by: 'b', say: "We all saw the season. We know exactly what you do." }, { by: 'a', say: "I'm not denying it." }] },
    { id: 'ph.r8', turns: [{ by: 'a', dr: "Everyone in here has seen me play. My reputation walks into every room before I do." }] },
    { id: 'ph.r9', turns: [{ by: 'b', dr: "{a} is agreeing with everyone today. None of us are going to work with {a}." }] },
    { id: 'ph.r10', turns: [{ by: 'a', dr: "The problem with a reputation is people believe it. Mine says I scheme. It isn't wrong." }] },
    { id: 'ph.r11', turns: [{ by: 'b', say: "What are you planning?" }, { by: 'a', say: "Breakfast." }, { by: 'b', say: "Sure." }] },
    { id: 'ph.r12', turns: [{ by: 'b', dr: "We all watched {a} play last time. I'm not falling for it." }] },
  ],
};
