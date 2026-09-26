// pm/lines/votes.js — why they voted, and the day after (pm/villa-vote.js
// motives; pm/arcs.js voteFallout). Data only.
//
//   ballot-reveal [a, b]     a votes against b. `of` (added here): threat · grudge · cover
//                            (cover: a tactical vote, given a kinder reason)
//   vote-fallout  [a, b, c]  a, close to c (dumped), at voter b. `of`: threat · grudge · tactical
//   vote-callout  [a, b]     a survived b's vote. `of`: threat · grudge · tactical
export const VOTE_LINES = {
  'ballot-reveal': [
    // threat: they fancy my partner, or my partner fancies them
    { id: 'bv.t.01', when: { of: 'threat' }, turns: [['a', "I'm going to be honest. I'm voting to dump {b}, because I don't feel comfortable with how {b} is around my partner."]], beat: '{b} shakes {b.posAdj} head.' },
    { id: 'bv.t.02', when: { of: 'threat' }, turns: [['a', "I'm voting for {b}. I've seen the way {b} looks at my partner, and I'm protecting my couple."]], beat: 'There is a gasp from the benches.' },
    { id: 'bv.t.03', when: { of: 'threat' }, turns: [['a', "This one's for my relationship. I'm voting to dump {b}."]], beat: "{b} laughs once, and doesn't look at {a.obj}." },
    // grudge: personal
    { id: 'bv.g.01', when: { of: 'grudge' }, turns: [['a', "I'm voting for {b}. {b} hasn't been genuine with me, and I can't get past it."]], beat: '{b} stares straight at {a}.' },
    { id: 'bv.g.02', when: { of: 'grudge' }, turns: [['a', "I don't think {b} has been a good person in here. I'm voting to dump {b}."]], beat: 'Somebody on the benches whistles through their teeth.' },
    { id: 'bv.g.03', when: { of: 'grudge' }, turns: [['a', "{b} and I have had our problems. I'm not going to pretend otherwise. I'm voting for {b}."]], beat: '{b} mouths something back that nobody catches.' },
    // cover: a tactical vote, with a kinder reason
    { id: 'bv.c.01', when: { of: 'cover' }, turns: [['a', "This is so hard. I just haven't seen {b}'s connection grow the way the others have."]], beat: "{b} doesn't look convinced." },
    { id: 'bv.c.02', when: { of: 'cover' }, turns: [['a', "I've gone with my gut. I'm voting to dump {b}. Sorry."]] },
    { id: 'bv.c.03', when: { of: 'cover' }, turns: [['a', "I'm voting for {b}, because I think the others have more to lose."]], beat: 'A couple of the islanders exchange a look.' },
  ],

  'vote-fallout': [
    // threat
    { id: 'vf.t.01', when: { of: 'threat' }, stage: 'The morning after. {a} walks straight up to {b} in the kitchen.', turns: [
      ['a', "You got {c} dumped because you felt threatened."], ['b', "I was protecting my couple."],
      ['a', "{c} never did anything to you."], ['b', "I wasn't going to wait until {c} did."]] },
    { id: 'vf.t.02', when: { of: 'threat' }, stage: 'On the terrace, {a} sits down across from {b}.', turns: [
      ['a', "Is your couple really that weak that you had to get rid of {c}?"], ['b', "That's not fair."],
      ['a', "Neither was your vote."]], beat: '{b} gets up and goes inside.' },
    // grudge
    { id: 'vf.g.01', when: { of: 'grudge' }, stage: '{a} finds {b} by the pool.', turns: [
      ['a', "That wasn't a vote. That was personal."], ['b', "It was honest."],
      ['a', "You've had it in for {c} since day one."], ['b', "And {c} gave me every reason."]], beat: 'The whole pool has gone quiet.' },
    { id: 'vf.g.02', when: { of: 'grudge' }, stage: 'In the dressing room, {a} turns round to {b}.', turns: [
      ['a', "You couldn't wait, could you? First chance you got."], ['b', "I voted how I felt."],
      ['a', "You got someone I cared about dumped because you don't like them."], ['b', "Yeah. I did."]] },
    // tactical: seen through
    { id: 'vf.x.01', when: { of: 'tactical' }, stage: 'At breakfast, {a} puts {a.posAdj} cup down and looks at {b}.', turns: [
      ['a', "\"I haven't seen their connection grow.\" Come on. That was tactical, and everyone knows it."], ['b', "It wasn't."],
      ['a', "Then why {c}? The strongest couple in here?"], ['b', "…It was my honest opinion."]], beat: 'Nobody at the table believes it.' },
    { id: 'vf.x.02', when: { of: 'tactical' }, stage: 'By the fire pit, {a} catches {b} alone.', turns: [
      ['a', "You got rid of {c} because it helps you."], ['b', "That's a big thing to say."],
      ['a', "It's a big thing to do."]] },
  ],

  'vote-callout': [
    { id: 'vc.t.01', when: { of: 'threat' }, stage: '{a} finds {b} on the lawn the next day.', turns: [
      ['a', "You voted for me."], ['b', "It wasn't personal."],
      ['a', "You said it was about your partner. Do you really think I'd do that?"], ['b', "I don't know you well enough to know."]] },
    { id: 'vc.t.02', when: { of: 'threat' }, stage: 'In the kitchen, {a} stands next to {b}.', turns: [
      ['a', "I'm still here, by the way."], ['b', "I can see that."],
      ['a', "And I'm not after your partner."], ['b', "Good."]], beat: 'Neither of them moves.' },
    { id: 'vc.g.01', when: { of: 'grudge' }, stage: '{a} sits down right next to {b} on the daybed.', turns: [
      ['a', "You tried to get me dumped."], ['b', "I said what I thought."],
      ['a', "Well, the villa didn't agree with you."], ['b', "Not this time."]] },
    { id: 'vc.g.02', when: { of: 'grudge' }, stage: 'At the fire pit the next night, {a} stares at {b}.', turns: [
      ['a', "Surprised to see me?"], ['b', "Not really."],
      ['a', "I heard every word you said about me."], ['b', "Good. I meant them."]] },
    { id: 'vc.x.01', when: { of: 'tactical' }, stage: '{a} catches {b} by the pool.', turns: [
      ['a', "Your reason for voting for me was rubbish, and you know it."], ['b', "It was my reason."],
      ['a', "It was your cover story."]], beat: '{b} doesn\'t answer.' },
  ],

  // The grudge a vote leaves (pm/arcs.js voteGrudges). [a, b]: a lost
  // someone to b's vote, and stayed.
  'grudge-cold': [
    { id: 'gdc.01', stage: '{b} says good morning to {a} in the kitchen. {a} walks past without a word.', turns: [
      ['b', "Are we really doing this?"], ['a', "Doing what?"], ['b', "Ignoring me."], ['a', "I'm not ignoring you. I've just got nothing to say to you."]] },
    { id: 'gdc.02', stage: 'At dinner, {a} moves to the other end of the table when {b} sits down.', turns: [
      ['b', "Wow. Okay."], ['a', "I'd just rather sit here."]], beat: 'The whole table notices.' },
    { id: 'gdc.03', stage: 'On the daybeds, {b} tries to join the conversation.', turns: [
      ['b', "What are we talking about?"], ['a', "Nothing you'd care about."], ['b', "That's a bit much."], ['a', "So was your vote."]] },
  ],
  'grudge-clash': [
    { id: 'gdx.01', stage: 'It starts in the kitchen and spreads to the lawn.', turns: [
      ['a', "Every time I look at you, I think about that fire pit."], ['b', "Then stop looking at me."],
      ['a', "I would if you weren't everywhere."], ['b', "It's a villa! Where do you want me to go?"]], beat: 'Two of the others step in.' },
    { id: 'gdx.02', stage: 'By the pool, {a} snaps at {b}.', turns: [
      ['a', "You don't get to act like nothing happened."], ['b', "It was a vote. It's done."],
      ['a', "It's not done for me."]] },
    { id: 'gdx.03', stage: 'On the terrace, {a} and {b} end up face to face.', turns: [
      ['b', "How long are you going to hate me for?"], ['a', "I haven't decided."],
      ['b', "Well, let me know."], ['a', "You'll be the first."]], beat: 'Neither of them looks away first.' },
  ],
  'grudge-end': [
    { id: 'gde.t.01', when: { of: 'truce' }, stage: '{b} brings {a} a tea and sits down.', turns: [
      ['b', "I'm sorry it hurt you. It wasn't about you."], ['a', "I know. I just needed someone to be angry at."],
      ['b', "Truce?"], ['a', "Truce."]] },
    { id: 'gde.t.02', when: { of: 'truce' }, stage: '{a} finds {b} on the swing.', turns: [
      ['a', "I'm done being angry."], ['b', "Yeah?"], ['a', "Yeah. It's not what they'd want, anyway."]], beat: 'They shake hands, and then hug.' },
    { id: 'gde.s.01', when: { of: 'spark' }, stage: 'On the roof terrace, late, the row runs out of steam.', turns: [
      ['a', "I really want to hate you."], ['b', "And?"],
      ['a', "And it's getting harder."], ['b', "Me too."]], beat: 'Neither of them moves away.' },
    { id: 'gde.s.02', when: { of: 'spark' }, stage: 'By the fire pit, {a} and {b} are the last two up.', turns: [
      ['b', "Can I say something mad?"], ['a', "You always do."],
      ['b', "I think I like you."], ['a', "…That is mad."], ['b', "I know."]] },
    { id: 'gde.n.01', when: { of: 'never' }, stage: '{b} tries one last time by the pool.', turns: [
      ['b', "Can we just move on?"], ['a', "You can. I'm not going to."]], beat: '{a} gets up and leaves.' },
    { id: 'gde.n.02', when: { of: 'never' }, stage: 'In the kitchen, {b} holds out a hand.', turns: [
      ['b', "Friends?"], ['a', "No."]], beat: '{b} lowers the hand.' },
  ],

  // The ex, back for one night (pm/arcs.js exVisit). a: dumped, back;
  // b: stayed, and moved on; c: who b moved on with.
  'visit-arrive': [
    { id: 'va.01', stage: 'The villa doors open, and {a} walks back in. {b} is sitting with {c}.', turns: [
      ['a', "Surprise."], ['b', "{a}? What are you doing here?"],
      ['a', "I heard you were doing fine without me."]], beat: '{c} lets go of {b}\'s hand.' },
    { id: 'va.02', stage: 'Heads turn on the lawn. {a} is back, just for tonight, and walks straight past everyone to {b}.', turns: [
      ['a', "Didn't take you long."], ['b', "It's not what it looks like."],
      ['a', "It looks exactly like what it is."]] },
    { id: 'va.03', stage: 'At the fire pit, the host announces a visitor. It\'s {a}.', turns: [
      ['a', "Hello, everyone. Hello, {b}."], ['b', "Hi."], ['c', "Oh no."]] },
  ],
  'visit-confront': [
    { id: 'vcf.h.01', when: { of: 'hurt' }, stage: '{a} and {b}, alone on the terrace.', turns: [
      ['a', "You told me you'd wait for me."], ['b', "I know. I'm sorry."],
      ['a', "It's been days."], ['b', "I didn't plan any of it."], ['a', "That's what makes it worse."]] },
    { id: 'vcf.h.02', when: { of: 'hurt' }, stage: 'On the swing, {a} can\'t look at {b}.', turns: [
      ['a', "I watched it all from outside."], ['b', "I didn't think you'd see it like that."],
      ['a', "How else was I going to see it?"]] },
    { id: 'vcf.f.01', when: { of: 'furious' }, stage: 'In front of the whole villa, {a} lets {b} have it.', turns: [
      ['a', "You couldn't even wait a week!"], ['b', "Can we talk about this privately?"],
      ['a', "No. You didn't do it privately."]], beat: 'Nobody in the villa moves.' },
    { id: 'vcf.f.02', when: { of: 'furious' }, stage: 'By the pool, {a} is shaking.', turns: [
      ['a', "Everything you said to me, you meant it for about five minutes."], ['b', "That's not true."],
      ['a', "Then prove it. Oh, wait. You can't."]] },
  ],
  'visit-leave': [
    { id: 'vl.01', stage: 'The villa doors. {a} picks up {a.posAdj} bag again.', turns: [
      ['a', "Enjoy it, {b}."], ['b', "{a}, wait."], ['a', "No. I've said what I came to say."]],
      beat: '{a} walks out. {c} watches {b} watch {a} go.' },
    { id: 'vl.02', stage: '{a} stops at the steps and turns back.', turns: [
      ['a', "Good luck, {c}. You'll need it."], ['c', "Wow."]], beat: '{a} is gone. {b} sits down on the steps.' },
    { id: 'vl.03', stage: '{a} hugs a few of the others on the way out, and not {b}.', turns: [
      ['b', "Are you not even going to say goodbye?"], ['a', "I just did. To the people who deserved it."]] },
  ],
};
