// pm/lines/hut.js — beach-hut cutaways (Plan 3, Task 5). Data only.
// One speaker, straight to camera, keyed by stance. `when` may test the
// event's family (flirting, couple, jealousy, friendship, gossip, dumping,
// casa) and the speaker's facts. The honest faker line is the giveaway the
// spec promised (§6.5): it only fires for somebody who is faking.
export const HUT = {
  honest: [
    { id: 'hut.h1', turns: [['a', 'I know what I want. I just want to be sure it wants me back.']] },
    { id: 'hut.h2', turns: [['a', "I'm actually really happy. I didn't think I'd say that this early."]] },
    { id: 'hut.h3', when: { family: 'couple' },
      turns: [['a', "I didn't expect to like {b.obj} this much. It's annoying, actually. I had a whole plan."]] },
  ],
  'two-faced': [
    { id: 'hut.t1', turns: [['a', "I'm keeping my options open. That's not a crime."]] },
    { id: 'hut.t2', when: { family: 'couple' },
      turns: [['a', "Everyone keeps saying we're solid. And yeah, on paper. But paper's not a person, is it. I'll see how this week goes and then I'll decide."]] },
    { id: 'hut.t3', when: { faking: true },
      turns: [['a', "Do I fancy {b.obj}? Not really. But everyone out there likes {b.obj}, and I'm not going home in week two."]] },
  ],
};
