// pm/lines/triangle.js — the love triangle (pm/triangle.js). Data only.
//   triangle-torn       [a, b]     a (in the middle) tells friend b about both
//   triangle-rivals     [a, b, c]  a and b, both after c. `of`: clash · size-up
//   triangle-case       [a, b, c]  a makes their case to b; c is the other one
//   triangle-ultimatum  [a, b, c]  a tells b to choose. `of`: chose-x (b chose a) ·
//                                  chose-y (b chose c) · not-yet
//   triangle-teams      [a, b, c]  the villa splits over a: Team b, Team c
//   triangle-choice     [a, b, c]  a ended up with b, not c. `of`: pick · default
export const TRIANGLE_LINES = {
  'triangle-torn': [
    { id: 'tt.01', turns: [['a', "Can I tell you something mad?"], ['b', "Always."], ['a', "I like two people. Properly like them. Both."], ['b', "Oh no."], ['a', "Oh yes."]] },
    { id: 'tt.02', turns: [['b', "You've got that look."], ['a', "What look?"], ['b', "The look of someone who can't make their mind up."], ['a', "…I really can't."]] },
    { id: 'tt.03', stage: 'The dressing room, late.', turns: [['a', "Every time I'm with one of them, I'm thinking about the other one."], ['b', "That's not a good sign."], ['a', "Or it just means I really like them both."]] },
    { id: 'tt.04', turns: [['a', "How do you choose between two people who both make you laugh?"], ['b', "You don't. One of them chooses for you, usually."]], beat: "{a} doesn't like that answer." },
    { id: 'tt.05', turns: [['a', "I feel awful. I've got two people after me and I'm leading them both on."], ['b', "Are you?"], ['a', "I don't mean to be."]] },
    { id: 'tt.06', stage: 'On the daybeds, whispering.', turns: [['b', "So who is it? Really?"], ['a', "That's the problem. It's both of them. It changes every hour."]] },
  ],
  'triangle-rivals': [
    { id: 'tr.c.01', when: { of: 'clash' }, turns: [['a', "Stay away from {c}."], ['b', "Or what?"], ['a', "Or you'll find out."]], beat: 'Somebody steps between them before it gets any further.' },
    { id: 'tr.c.02', when: { of: 'clash' }, stage: 'By the pool, loud enough for everyone.', turns: [['b', "You've been all over {c} since I walked in."], ['a', "Because I was there first."], ['b', "It's not a queue."], ['a', "It is, and you're at the back of it."]] },
    { id: 'tr.c.03', when: { of: 'clash' }, turns: [['a', "Every time I talk to {c}, you appear."], ['b', "Funny. I was going to say the same about you."]], beat: 'Neither of them blinks.' },
    { id: 'tr.c.04', when: { of: 'clash' }, turns: [['b', "Just so you know, I'm not going anywhere."], ['a', "Neither am I."], ['b', "Then this is going to get messy."]] },
    { id: 'tr.s.01', when: { of: 'size-up' }, turns: [['a', "So. You like {c}."], ['b', "I do. Is that a problem?"], ['a', "No. May the best one win."]], beat: 'They shake hands. Neither of them lets go first.' },
    { id: 'tr.s.02', when: { of: 'size-up' }, stage: 'In the kitchen, a very polite conversation.', turns: [['b', "No hard feelings, whatever happens with {c}."], ['a', "No hard feelings."]], beat: 'Neither of them means it.' },
    { id: 'tr.s.03', when: { of: 'size-up' }, turns: [['a', "I'm not going to fight you over {c}."], ['b', "Good."], ['a', "I'm just going to be better at it."]] },
    { id: 'tr.s.04', when: { of: 'size-up' }, turns: [['b', "It's going to be awkward, isn't it?"], ['a', "Only if we make it awkward."], ['b', "We're definitely going to make it awkward."]] },
  ],
  'triangle-case': [
    { id: 'tc.01', stage: '{a} takes {b} up to the terrace.', turns: [['a', "I know you're getting to know {c} too. I'm not going to pretend I don't mind."], ['b', "Okay."], ['a', "I just want you to know I'm serious about this. About you."]] },
    { id: 'tc.02', turns: [['a', "What does {c} have that I don't?"], ['b', "It's not like that."], ['a', "Then what's it like?"], ['b', "Confusing."]] },
    { id: 'tc.03', turns: [['a', "I'm not going to play games. I like you, and I want you to pick me."], ['b', "You're very direct."], ['a', "I've watched {c} be sweet all week. I'd rather be honest."]] },
    { id: 'tc.04', stage: 'The daybeds, away from everyone.', turns: [['a', "Can I just say one thing, and then I'll leave you alone?"], ['b', "Go on."], ['a', "When you're with me, you laugh. I've seen you with {c}. You smile. It's not the same."]] },
    { id: 'tc.05', turns: [['a', "I'm not asking you to choose tonight."], ['b', "Then what are you asking?"], ['a', "Just think about how you feel when I walk in. Not when {c} does."]] },
    { id: 'tc.06', turns: [['a', "I can wait. I just need to know I'm not waiting for nothing."], ['b', "You're not waiting for nothing."]], beat: '{a} walks away grinning, and {c} sees it.' },
  ],
  'triangle-ultimatum': [
    { id: 'tu.x.01', when: { of: 'chose-x' }, turns: [['a', "I need to know. Me or {c}."], ['b', "…You. It's you."], ['a', "Are you sure?"], ['b', "I've been sure for a while. I was just scared of saying it."]], beat: 'Across the garden, {c} sees them and understands.' },
    { id: 'tu.x.02', when: { of: 'chose-x' }, stage: 'The fire pit, late.', turns: [['a', "I can't keep doing this. You have to choose."], ['b', "I choose you."], ['a', "Say that again."], ['b', "I choose you."]] },
    { id: 'tu.y.01', when: { of: 'chose-y' }, turns: [['a', "Just tell me. Me, or {c}?"], ['b', "I'm sorry. It's {c}."], ['a', "Right. Okay. Thanks for being honest."]], beat: '{a} walks off before anyone can see {a.posAdj} face.' },
    { id: 'tu.y.02', when: { of: 'chose-y' }, turns: [['a', "I need an answer."], ['b', "I think you already know it."], ['a', "Say it anyway."], ['b', "It's {c}. I'm sorry."]] },
    { id: 'tu.n.01', when: { of: 'not-yet' }, turns: [['a', "Me or {c}? I need to know tonight."], ['b', "I can't do that. Not tonight."], ['a', "Then when?"], ['b', "I don't know."]], beat: "{a} laughs, but it isn't a happy laugh." },
    { id: 'tu.n.02', when: { of: 'not-yet' }, turns: [['a', "I'm done waiting. Choose."], ['b', "Don't put me on the spot like this."], ['a', "You've put me on the spot for a week."]] },
  ],
  'triangle-teams': [
    { id: 'tm.01', turns: [['narrator', "The villa has split down the middle. Team {b} on one side of the kitchen, Team {c} on the other. {a} is stuck at the island in between."]] },
    { id: 'tm.02', stage: 'Everyone in the villa has an opinion about {a}, and most of them are sharing it.', turns: [['narrator', "Nobody asked the villa who {a} should pick. The villa has decided anyway."]] },
    { id: 'tm.03', turns: [['narrator', "It is officially a love triangle. The villa has picked its teams. {a} has not picked anything."]] },
    { id: 'tm.04', stage: 'Two huddles in the garden, both glancing at {a}.', turns: [['narrator', "Team {b}. Team {c}. And {a}, who would like everyone to stop looking at them, please."]] },
  ],
  'triangle-choice': [
    { id: 'tx.p.01', when: { of: 'pick' }, turns: [['a', "I had to choose, and I chose {b}."], ['b', "I'm not going to pretend I'm not happy about it."]], beat: '{c} gets up and walks straight inside.' },
    { id: 'tx.p.02', when: { of: 'pick' }, turns: [['c', "So that's it, then."], ['a', "I'm sorry. It was always going to hurt someone."]], beat: "{b} squeezes {a.posAdj} hand. {c} doesn't look back." },
    { id: 'tx.p.03', when: { of: 'pick' }, stage: 'Straight after the recoupling.', turns: [['c', "I thought it was me."], ['a', "So did I, for a while."]], beat: "It's the worst thing {a} could have said, and {a} knows it." },
    { id: 'tx.p.04', when: { of: 'pick' }, turns: [['a', "I hope one day we can be friends."], ['c', "One day. Not today."]] },
    { id: 'tx.d.01', when: { of: 'default' }, turns: [['narrator', "No decision needed. The villa made it for {a}. {c} has gone, and {b} is still here."]] },
    { id: 'tx.d.02', when: { of: 'default' }, stage: 'The morning after {c} leaves.', turns: [['b', "It's just us now."], ['a', "It was always going to be, I think."]] },
    { id: 'tx.d.03', when: { of: 'default' }, turns: [['a', "I never got to choose."], ['b', "Would you have chosen me?"], ['a', "…Ask me another time."]] },
  ],
};

const K = (kind, more = {}) => ({ kind, ...more });
export const TRIANGLE_HUT = {
  honest: [
    { id: 'hut.tr.h1', when: K('triangle-torn', { role: 0 }), turns: [['a', "I've never been in this situation. Two people. I feel like the villain and I haven't even done anything yet."]] },
    { id: 'hut.tr.h2', when: K('triangle-rivals', { role: 0 }), turns: [['a', "May the best one win. I'm the best one, by the way."]] },
    { id: 'hut.tr.h3', when: K('triangle-case', { role: 0 }), turns: [['a', "I put everything on the table. The rest is up to them."]] },
    { id: 'hut.tr.h4', when: K('triangle-ultimatum', { of: 'chose-y', role: 0 }), turns: [['a', "I asked. I got my answer. I just didn't want it to be that one."]] },
    { id: 'hut.tr.h5', when: K('triangle-choice', { of: 'pick', role: 2 }), turns: [['a', "I was so close. That's what hurts. I was so close."]] },
    { id: 'hut.tr.h6', when: K('triangle-choice', { of: 'pick', role: 0 }), turns: [['a', "Someone was always going to get hurt. I just hate that it was me who did it."]] },
  ],
  'two-faced': [
    { id: 'hut.tr.t1', when: K('triangle-torn', { role: 0 }), turns: [['a', "Two people fighting over me? I'm not going to lie, I'm enjoying it a bit."]] },
    { id: 'hut.tr.t2', when: K('triangle-rivals', { of: 'size-up', role: 0 }), turns: [['a', "I shook their hand. I'm still going to win."]] },
  ],
};
