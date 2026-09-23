// pm/lines/breakdown.js — when it gets too much (pm/breakdown.js), and the
// promise (a pull that ends in plans for the outside, pm/events.js). Data only.
//   breakdown  [a]     `of`: heartbreak · stress · lonely · guilt · jealousy · homesick
//   comfort    [a, b]  a comes and sits with b. `of`: friend · partner · unexpected
//   no-show    [a, b]  b tells partner a they never came
//   pull (promised) [a, b]  a pulls b and they talk about the outside
export const BREAKDOWN_LINES = {
  breakdown: [
    // heartbreak
    { id: 'bd.h.01', when: { of: 'heartbreak' }, stage: 'The bathroom, the door locked, the tap running so nobody hears.', turns: [['a', "I'm fine. I'm fine. I'm fine."]], beat: '{a} is not fine, and slides down the wall to the floor.' },
    { id: 'bd.h.02', when: { of: 'heartbreak' }, stage: 'The daybeds, late, {a} curled up under a blanket.', turns: [['a', "I really thought it was going somewhere. I really, really did."]], beat: 'The tears come all at once.' },
    { id: 'bd.h.03', when: { of: 'heartbreak' }, stage: 'The dressing room. {a} sits in front of the mirror, make-up running.', turns: [['a', "Look at me. I look like I've been hit by a bus."], ['a', "That's how it feels, to be fair."]] },
    { id: 'bd.h.04', when: { of: 'heartbreak' }, stage: '{a} walks away from the fire pit before anyone notices, and doesn\'t come back.', turns: [['a', "I just need five minutes. Please. Just five minutes."]] },
    // stress
    { id: 'bd.s.01', when: { of: 'stress' }, stage: 'The roof terrace, {a} on the floor with {a.posAdj} knees up.', turns: [['a', "I can't breathe. Every night there's something. I can't switch off."]] },
    { id: 'bd.s.02', when: { of: 'stress' }, stage: 'The bathroom. {a} is gripping the sink.', turns: [['a', "Everyone's watching everything. I can't do anything right."]], beat: '{a} sits on the edge of the bath and cries.' },
    { id: 'bd.s.03', when: { of: 'stress' }, stage: 'Behind the villa, where the cameras are fewer.', turns: [['a', "I don't know who to trust any more. I don't know who's safe."]] },
    // lonely
    { id: 'bd.l.01', when: { of: 'lonely' }, stage: 'The fire pit, empty, {a} on the bench alone.', turns: [['a', "Everyone's got someone. Everyone. And I'm just… here."]] },
    { id: 'bd.l.02', when: { of: 'lonely' }, stage: 'The bedroom, lights out, {a} wide awake.', turns: [['a', "I go to sleep on my own and I wake up on my own. What am I even doing here?"]] },
    { id: 'bd.l.03', when: { of: 'lonely' }, stage: '{a} sits on the edge of the pool, feet in the water.', turns: [['a', "Nobody's going to pick me. I know that. I just have to stop pretending I don't."]] },
    // guilt
    { id: 'bd.g.01', when: { of: 'guilt' }, stage: 'The bathroom. {a} stares at {a.posAdj} own reflection.', turns: [['a', "What have I done? What have I actually done?"]], beat: '{a} cannot look at {a.ref} for long.' },
    { id: 'bd.g.02', when: { of: 'guilt' }, stage: 'The daybeds, {a} with {a.posAdj} head in {a.posAdj} hands.', turns: [['a', "I'm a horrible person. I know I am. I didn't used to be."]] },
    { id: 'bd.g.03', when: { of: 'guilt' }, stage: 'The terrace, late.', turns: [['a', "I keep telling myself it wasn't that bad. It was that bad."]] },
    // jealousy
    { id: 'bd.j.01', when: { of: 'jealousy' }, stage: 'The dressing room, {a} sitting on the floor.', turns: [['a', "Every time they laugh together, I feel sick. I hate feeling like this."]] },
    { id: 'bd.j.02', when: { of: 'jealousy' }, stage: 'The bathroom, the tap running.', turns: [['a', "I'm not a jealous person. I'm not. I never used to be."]], beat: '{a} cries, quietly, so nobody on the other side of the door hears.' },
    // homesick
    { id: 'bd.m.01', when: { of: 'homesick' }, stage: 'The daybeds, {a} holding a photo of home.', turns: [['a', "I miss my {~mum}. I miss my bed. I miss being normal."]] },
    { id: 'bd.m.02', when: { of: 'homesick' }, stage: 'The terrace, looking out at nothing.', turns: [['a', "I just want to hear a voice from home. Just one."]], beat: 'It all comes out at once.' },
    { id: 'bd.m.03', when: { of: 'homesick' }, stage: 'The bedroom, {a} packing and unpacking the same bag.', turns: [['a', "I don't know if I can do another week of this."]] },
  ],
  comfort: [
    // a friend
    { id: 'cf.f.01', when: { of: 'friend' }, stage: '{a} knocks on the door, and does not wait for an answer.', turns: [
      ['a', "Hey. Hey. Come here."], ['b', "I don't want anyone to see me like this."], ['a', "It's only me. I've seen you worse. I've seen you do karaoke."],
      ['b', "…That's fair."]], beat: '{b} laughs, and then cries again, but with somebody holding on this time.' },
    { id: 'cf.f.02', when: { of: 'friend' }, turns: [
      ['a', "You don't have to say anything. I'll just sit here."], ['b', "Thank you."], ['a', "Whatever it is, you're not on your own with it."]],
      beat: '{a} stays until {b} has stopped shaking.' },
    { id: 'cf.f.03', when: { of: 'friend' }, stage: '{a} sits down on the floor next to {b}.', turns: [
      ['a', "Talk to me."], ['b', "I feel so stupid."], ['a', "You're not stupid. You're tired, and you've been through a lot."],
      ['b', "Can we just stay here for a bit?"], ['a', "As long as you want."]] },
    { id: 'cf.f.04', when: { of: 'friend' }, turns: [
      ['a', "Right. Tissues. Water. Me. In that order."], ['b', "When did you get so organised?"], ['a', "About ten seconds ago. I panicked."]],
      beat: 'It gets a smile. The first one tonight.' },
    { id: 'cf.f.05', when: { of: 'friend' }, turns: [
      ['a', "You'd do the same for me. You have done the same for me."], ['b', "I know. I just hate being the one who needs it."]] },
    // the partner
    { id: 'cf.p.01', when: { of: 'partner' }, stage: '{a} comes looking, and finds {b}.', turns: [
      ['a', "Why didn't you come and get me?"], ['b', "I didn't want to be a burden."], ['a', "You're never a burden. Not to me."]],
      beat: '{a} wraps {b} up and does not let go for a long time.' },
    { id: 'cf.p.02', when: { of: 'partner' }, turns: [
      ['a', "I'm here. I'm right here."], ['b', "Don't go anywhere."], ['a', "I'm not going anywhere."]] },
    { id: 'cf.p.03', when: { of: 'partner' }, stage: '{a} sits down beside {b} and takes {b.posAdj} hand.', turns: [
      ['a', "Whatever it is, we'll deal with it together."], ['b', "What if I'm too much?"], ['a', "Then I'll have too much. I don't mind."]] },
    // unexpected: from the other side of a feud
    { id: 'cf.u.01', when: { of: 'unexpected' }, stage: 'The last person anyone expected pushes the door open. It is {a}.', turns: [
      ['b', "What are you doing here?"], ['a', "I heard you. I know we're not exactly friends right now."],
      ['a', "But nobody should cry on their own in a bathroom."], ['b', "…Thank you."]], beat: 'The row feels a very long way away.' },
    { id: 'cf.u.02', when: { of: 'unexpected' }, turns: [
      ['a', "I know I'm probably the last person you want to see."], ['b', "You are, a bit."], ['a', "I'll go if you want."],
      ['b', "No. Stay. Please."]], beat: 'Whatever they fell out over, it does not come up once.' },
    { id: 'cf.u.03', when: { of: 'unexpected' }, turns: [
      ['a', "Look, forget everything that's happened. Are you okay?"], ['b', "No."], ['a', "Okay. Then that's what matters right now."]] },
  ],
  'no-show': [
    { id: 'ns.01', turns: [['b', "Where were you?"], ['a', "What do you mean?"], ['b', "When I was in pieces. Everyone came except you."]], beat: '{a} does not have an answer.' },
    { id: 'ns.02', turns: [['b', "I needed you, and you weren't there."], ['a', "I didn't know."], ['b', "The whole villa knew."]] },
    { id: 'ns.03', turns: [['b', "Can I ask you something? Why didn't you come and find me?"], ['a', "I thought you wanted space."], ['b', "I wanted you."]] },
    { id: 'ns.04', turns: [['b', "Half the villa sat with me tonight. My own partner didn't."], ['a', "I'm sorry. I should have been there."]] },
  ],
};

export const PROMISE_LINES = [
  { id: 'pp.01', when: { promised: true }, turns: [['a', "If we'd met on the outside, would you have given me a chance?"], ['b', "Honestly? Yeah."], ['a', "Then maybe we should, when this is over."]] },
  { id: 'pp.02', when: { promised: true }, turns: [['b', "What happens when we get out?"], ['a', "I'd take you for dinner. Somewhere with no cameras."], ['b', "You're in a couple."], ['a', "In here I am."]] },
  { id: 'pp.03', when: { promised: true }, stage: 'The terrace, voices low.', turns: [['a', "I've been thinking about you. On the outside, I mean."], ['b', "Don't say that."], ['a', "I'm only saying it to you."]] },
  { id: 'pp.04', when: { promised: true }, turns: [['a', "Give me your number when we're out."], ['b', "What about your partner?"], ['a', "Let me worry about that."]] },
  { id: 'pp.05', when: { promised: true }, turns: [['b', "Do you ever wish it was me you were coupled with?"], ['a', "Every day."], ['b', "Then why aren't you?"]], beat: '{a} does not answer, which is an answer.' },
  { id: 'pp.06', when: { promised: true }, stage: 'By the pool, well after midnight.', turns: [['a', "When this is over, I want to see where this goes."], ['b', "And until then?"], ['a', "Until then, nobody knows."]] },
];

const K = (kind, more = {}) => ({ kind, ...more });
export const BREAKDOWN_HUT = {
  honest: [
    { id: 'hut.bd.h1', when: K('breakdown', { role: 0 }), turns: [['a', "I didn't know I had that many tears in me."]] },
    { id: 'hut.bd.h2', when: K('comfort', { role: 0 }), turns: [['a', "You find out who your real friends are in moments like that."]] },
    { id: 'hut.bd.h3', when: K('comfort', { role: 1 }), turns: [['a', "I'll never forget who came. Never."]] },
    { id: 'hut.bd.h4', when: K('comfort', { of: 'unexpected', role: 1 }), turns: [['a', "Of all the people to walk through that door. I didn't see that coming."]] },
    { id: 'hut.bd.h5', when: K('no-show', { role: 1 }), turns: [['a', "Everyone came. Everyone except the one person who should have."]] },
  ],
  'two-faced': [
    { id: 'hut.bd.t1', when: K('comfort', { role: 0 }), turns: [['a', "I'll be there for them. It doesn't hurt to be seen being there for them, either."]] },
    { id: 'hut.bd.t2', when: K('pull', { promised: true, role: 0 }), turns: [['a', "What I say about the outside is between me and them. The villa doesn't need to know."]] },
  ],
};
