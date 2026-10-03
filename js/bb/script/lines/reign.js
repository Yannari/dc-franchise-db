// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/reign.js — how a Head of Household wears it (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/reign.js (all but the house meeting, which has its
// own screen).
//
//   reign.announce    a, the HOH, names b as the target too early; c heard it  scene
//   reign.test        a, the HOH, makes {alliance} prove it; b hesitates       scene (HOH room)
//   reign.decides     a, a nervous HOH, lets b pick the names                  scene (HOH room)
//   reign.apology     a, a nervous HOH, keeps apologising to b, a nominee       scene
//   reign.reckoning   a was HOH last week; b judges the reign                   bad | good
//   reign.carve       a and b, two HOHs, split the house                         agree ({target}) | split ({partner})
//   reign.both        a works both HOH rooms, b's and c's                        caught | clean

export default {
  'reign.announce.scene': [
    { id: 'rn.1', when: { third: true }, turns: [{ by: 'a', say: "I'm not going to pretend. {b} is going up." }, { by: 'c', say: "Does {b} know?" }, { by: 'a', say: "Not yet." }, { beat: 'Ten minutes later, {b} knows.' }] },
    { id: 'rn.2', turns: [{ by: 'b', say: "I hear I'm going up." }, { by: 'a', say: "Who told you that?" }, { by: 'b', say: "Does it matter?" }] },
    { id: 'rn.3', turns: [{ by: 'b', dr: "{a} told half the house I'm going up before telling me. That tells me everything about {a}." }] },
    { id: 'rn.4', turns: [{ by: 'a', dr: "I told a couple of people that {b} is my target. Maybe I shouldn't have." }] },
    { id: 'rn.5', when: { third: true }, turns: [{ by: 'a', say: "Keep this quiet. {b} is going up." }, { by: 'c', say: "Quiet. Sure." }, { by: 'c', dr: "I'm telling {b}. Obviously." }] },
    { id: 'rn.6', turns: [{ by: 'b', say: "Were you going to tell me yourself?" }, { by: 'a', say: "I was going to." }, { by: 'b', say: "When? After the ceremony?" }] },
    { id: 'rn.7', when: { third: true }, turns: [{ by: 'c', dr: "{a} just told me who's going up. In a whisper. With people walking past." }] },
  ],
  'reign.test.scene': [
    { id: 'rt.1', turns: [{ by: 'a', say: "I need to hear it from everyone. Are we still together?" }, { by: 'b', say: "...Yes." }, { by: 'a', say: "Why did you pause?" }] },
    { id: 'rt.2', turns: [{ by: 'b', say: "Did something happen?" }, { by: 'a', say: "No. I just need to know where everyone stands." }, { by: 'b', dr: "Nothing happened. And now I'm worried." }] },
    { id: 'rt.3', turns: [{ by: 'a', say: "Everyone in {alliance}. Hands up if you're still with me." }, { beat: 'Every hand goes up. {b}\'s goes up last.' }] },
    { id: 'rt.4', turns: [{ by: 'b', dr: "{a} made us all promise we're still loyal. We were loyal before {a} asked. Now I'm not so sure." }] },
    { id: 'rt.5', turns: [{ by: 'a', dr: "I watched every face when I asked. {b} took a second too long." }] },
    { id: 'rt.6', turns: [{ by: 'b', say: "Why are you testing us?" }, { by: 'a', say: "I'm not testing you." }, { by: 'b', say: "It feels like a test." }] },
  ],
  'reign.decides.scene': [
    { id: 'rd.1', turns: [{ by: 'a', say: "Who would you put up?" }, { by: 'b', say: "Honestly?" }, { by: 'a', say: "Honestly." }, { by: 'b', dr: "{a} asked me for names. I gave two. I think I just made the nominations." }] },
    { id: 'rd.2', turns: [{ by: 'a', say: "I don't want to make enemies." }, { by: 'b', say: "Then pick people nobody will fight for." }, { by: 'a', say: "Who's that?" }] },
    { id: 'rd.3', turns: [{ by: 'b', dr: "{a} has asked everyone for nomination names. Whatever names come up most, that's what {a} will do." }] },
    { id: 'rd.4', turns: [{ by: 'a', dr: "Every name I think of, someone in this house will be upset. I just want the least upset." }] },
    { id: 'rd.5', turns: [{ by: 'a', say: "What would you do if you were me?" }, { by: 'b', say: "I'd make my own decision." }, { by: 'a', say: "...Right. But what would you do?" }] },
    { id: 'rd.6', turns: [{ by: 'b', dr: "{a} won HOH and is letting the rest of us decide. That's useful to me. It's also a bit sad." }] },
  ],
  'reign.apology.scene': [
    { id: 'ry.1', turns: [{ by: 'a', say: "You know it's nothing personal, right?" }, { by: 'b', say: "Of course." }, { by: 'b', dr: "It's personal." }] },
    { id: 'ry.2', turns: [{ by: 'a', say: "I'm really sorry about the nominations." }, { by: 'b', say: "You said." }, { by: 'a', say: "I just want you to know..." }, { by: 'b', say: "I know. You said." }] },
    { id: 'ry.3', turns: [{ by: 'b', dr: "{a} keeps apologising to me. That means {a} feels guilty. I can use that." }] },
    { id: 'ry.4', turns: [{ by: 'a', say: "Are we okay?" }, { by: 'b', say: "We're fine." }, { by: 'a', say: "Really?" }, { by: 'b', say: "I'm on the block. Please stop asking me if we're okay." }] },
    { id: 'ry.5', turns: [{ by: 'a', dr: "I can't stop saying sorry to {b}. I know it looks weak. I just feel awful." }] },
    { id: 'ry.6', turns: [{ by: 'b', say: "If you're that sorry, use the veto on me if you win it." }, { by: 'a', say: "...I'll think about it." }] },
  ],
  'reign.reckoning.bad': [
    { id: 'rk.b1', turns: [{ by: 'b', dr: "Now that {a} isn't HOH, people are finally saying what they really think. It's not good." }] },
    { id: 'rk.b2', turns: [{ by: 'b', say: "Who got promised safety by {a} last week?" }, { beat: 'A few people put their hands up.' }, { by: 'b', say: "Yeah. Me too." }] },
    { id: 'rk.b3', turns: [{ by: 'a', dr: "Last week, everyone wanted to talk to me. Now nobody comes near me." }] },
    { id: 'rk.b4', turns: [{ by: 'b', say: "Enjoying being one of us again?" }, { by: 'a', say: "Very funny." }] },
    { id: 'rk.b5', turns: [{ beat: '{a} walks in. The conversation stops.' }, { by: 'a', dr: "I know exactly what they were talking about." }] },
    { id: 'rk.b6', turns: [{ by: 'b', dr: "{a} spent last week annoying almost everyone in this house. That's going to cost {a.obj}." }] },
  ],
  'reign.reckoning.good': [
    { id: 'rk.g1', turns: [{ by: 'b', dr: "I'll give {a} credit. {a} did exactly what {a.sub} said {a.sub} would do last week." }] },
    { id: 'rk.g2', turns: [{ by: 'b', say: "That was a good week as HOH." }, { by: 'a', say: "Thanks. It wasn't easy." }] },
    { id: 'rk.g3', turns: [{ by: 'a', dr: "I did what I said I'd do as HOH. People trust me more for it." }] },
    { id: 'rk.g4', turns: [{ by: 'b', dr: "{a}'s nominations made sense. The vote went to plan. I trust {a} more now." }] },
    { id: 'rk.g5', turns: [{ by: 'b', say: "No regrets about last week?" }, { by: 'a', say: "None." }, { by: 'b', say: "Fair enough. It worked." }] },
    { id: 'rk.g6', turns: [{ by: 'a', dr: "Nobody's angry about my week as HOH. In this house, that's a win." }] },
  ],
  'reign.carve.agree': [
    { id: 'rc.a1', turns: [{ by: 'a', say: "I want {target} up." }, { by: 'b', say: "Fine by me." }, { by: 'a', say: "That was easy." }, { by: 'b', say: "Too easy." }] },
    { id: 'rc.a2', turns: [{ by: 'b', say: "If your nominees win the Battle of the Block, you lose your HOH and I keep mine. You know that." }, { by: 'a', say: "I know." }, { by: 'b', say: "Still want to do this?" }, { by: 'a', say: "Still want to do this." }] },
    { id: 'rc.a3', turns: [{ by: 'a', dr: "{b} and I sat down and split the house between us. It took four minutes." }] },
    { id: 'rc.a4', turns: [{ by: 'b', dr: "Two HOHs, one plan. {a} and I agreed on everything. That never happens in here." }] },
    { id: 'rc.a5', turns: [{ by: 'b', say: "Who are you putting up?" }, { by: 'a', say: "{target}, for a start." }, { by: 'b', say: "Then I'll pick around that." }] },
    { id: 'rc.a6', turns: [{ by: 'a', say: "We're on the same side this week, right?" }, { by: 'b', say: "This week, yes." }] },
  ],
  'reign.carve.split': [
    { id: 'rc.s1', turns: [{ by: 'a', say: "Just put {partner} up." }, { by: 'b', say: "No." }, { by: 'a', say: "Why not?" }, { by: 'b', say: "Because I don't want to." }] },
    { id: 'rc.s2', turns: [{ by: 'a', dr: "{b} and I can't agree on a single name. We're two HOHs working against each other." }] },
    { id: 'rc.s3', turns: [{ by: 'b', say: "Fine." }, { by: 'a', say: "Fine." }, { by: 'b', dr: "It's not fine." }] },
    { id: 'rc.s4', turns: [{ by: 'a', say: "Want to split it?" }, { by: 'b', say: "I'll think about it." }, { by: 'a', dr: "That's a no." }] },
    { id: 'rc.s5', turns: [{ by: 'b', dr: "Only one of us keeps our HOH after the Battle of the Block. Neither of us is going to forget that." }] },
    { id: 'rc.s6', turns: [{ by: 'b', say: "Why do you get to decide?" }, { by: 'a', say: "I don't. Neither do you. That's the problem." }] },
  ],
  'reign.both.caught': [
    { id: 'rb.c1', turns: [{ by: 'b', say: "{a} told me you're the real problem this week." }, { by: 'c', say: "Funny. {a} told me the same about you." }] },
    { id: 'rb.c2', turns: [{ by: 'c', dr: "{a} went from {b}'s room to mine and said the opposite in each one. {b} and I compared notes." }] },
    { id: 'rb.c3', turns: [{ by: 'b', say: "Did {a} promise you a vote?" }, { by: 'c', say: "Yes." }, { by: 'b', say: "Me too." }, { by: 'c', say: "{a} only has one vote." }] },
    { id: 'rb.c4', turns: [{ by: 'a', dr: "I worked both HOH rooms today. I forgot {b} and {c} actually talk to each other." }] },
    { id: 'rb.c5', turns: [{ by: 'c', say: "{a}, you told {b} something different." }, { by: 'a', say: "I don't think so." }, { by: 'b', say: "You did. Word for word." }] },
    { id: 'rb.c6', turns: [{ by: 'b', dr: "{a} played both of us. Now {c} and I have something in common." }] },
  ],
  'reign.both.clean': [
    { id: 'rb.k1', turns: [{ by: 'a', dr: "I went to both HOH rooms today. I'm safe in both. Neither of them will compare notes." }] },
    { id: 'rb.k2', turns: [{ by: 'a', say: "I'm with you this week." }, { by: 'b', say: "Good." }, { beat: 'Twenty minutes later, in the other HOH room.' }, { by: 'a', say: "I'm with you this week." }, { by: 'c', say: "Good." }] },
    { id: 'rb.k3', turns: [{ by: 'a', dr: "{b} thinks I'm loyal. {c} thinks I'm loyal. I barely said a word in either room." }] },
    { id: 'rb.k4', turns: [{ by: 'b', dr: "{a} is with me this week. I'm sure of it." }] },
    { id: 'rb.k5', turns: [{ by: 'c', dr: "{a} came up and said all the right things. I believe {a}." }] },
    { id: 'rb.k6', turns: [{ by: 'a', dr: "Two HOHs means two chances. I took both." }] },
  ],
};
