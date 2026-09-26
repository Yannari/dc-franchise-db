// pm/lines/lie-detector.js — the Lie Detector (pm/lie-detector.js). Data only.
// The questions are the real show's, from the wiki's tables (UK 1-4, AU 1),
// with the names made slots.
//   lie-write     [a, b, c]     a tells friend b what they'll ask partner c. `of`: the worry
//   lie-question  [a, b, c, d]  one scene from four parts, in order:
//     lie-ask     b reads c's question to a (`of`: the question; d is who it names)
//     lie-answer  a answers (`of`: yes · no · yes-slow · no-slow · yes-admit · no-admit)
//     lie-read    the light (`of`: green · red · blue)
//     lie-react   the room (`of`: relief · hurt · stung · laugh · confused)
//   lie-row       [a, c]        after a red light. `of`: own-it · deny · broken
export const LIE_LINES = {
  'lie-write': [
    { id: 'lw.f.01', when: { of: 'fancy-other' }, stage: 'The dressing room, {a} with a pen and a card.', turns: [
      ['a', "I'm asking if {c} still has feelings for someone else."], ['b', "Do you want to know the answer, though?"], ['a', "No. But I need to."]] },
    { id: 'lw.f.02', when: { of: 'fancy-other' }, turns: [
      ['b', "What are you putting?"], ['a', "Whether {c}'s still got eyes for anyone else in here."], ['b', "Babe."], ['a', "I know. I know."]] },
    { id: 'lw.b.01', when: { of: 'behind-back' }, stage: 'Sitting on the bed, the card on {a.posAdj} knee.', turns: [
      ['a', "I'm going to ask if {c}'s done anything behind my back."], ['b', "Why? Has someone said something?"], ['a', "No. It's just a feeling."]] },
    { id: 'lw.b.02', when: { of: 'behind-back' }, turns: [
      ['a', "If {c}'s been lying to me, I'd rather find out now than on the outside."], ['b', "And if it goes red?"], ['a', "Then it goes red."]] },
    { id: 'lw.t.01', when: { of: 'tempted' }, turns: [
      ['a', "I want to know if {c} would be tempted when we get out."], ['b', "Everyone says no to that one."], ['a', "That's why there's a machine."]] },
    { id: 'lw.t.02', when: { of: 'tempted' }, stage: 'By the mirrors, getting ready.', turns: [
      ['a', "In here it's easy. It's out there I'm worried about."], ['b', "So ask it."], ['a', "I'm going to."]] },
    { id: 'lw.l.01', when: { of: 'love' }, turns: [
      ['a', "I'm keeping it simple. Does {c} actually love me."], ['b', "That's not simple. That's the biggest one."], ['a', "Yeah. I know."]] },
    { id: 'lw.l.02', when: { of: 'love' }, stage: 'The dressing room. {a} has written one line and crossed it out twice.', turns: [
      ['a', "What if I ask and it's not what I want to hear?"], ['b', "Then at least you know."]] },
  ],

  'lie-ask': [
    { id: 'la.fu.01', when: { of: 'future' }, stage: '{a} is strapped in, the wires on {a.posAdj} fingers. {b} reads the card {c} wrote.', turns: [['b', "Do you see a future with {c} outside the villa?"]] },
    { id: 'la.fu.02', when: { of: 'future' }, stage: 'The whole villa is watching. {b} clears {b.posAdj} throat.', turns: [['b', "Okay. {c} wants to know: do you see a future with {c} on the outside?"]] },
    { id: 'la.fu.03', when: { of: 'future' }, turns: [['b', "Next one. When this is over, do you want to be with {c}?"]] },
    { id: 'la.lo.01', when: { of: 'love' }, stage: '{a} is in the chair. {b} has the card, and {c} can\'t look.', turns: [['b', "Are you really in love with {c}?"]] },
    { id: 'la.lo.02', when: { of: 'love' }, turns: [['b', "This one's a big one. Are your feelings for {c} real?"]] },
    { id: 'la.lo.03', when: { of: 'love' }, stage: 'Nobody in the villa is making a sound.', turns: [['b', "Do you love {c}?"]] },
    { id: 'la.fo.01', when: { of: 'fancy-other' }, turns: [['b', "Do you still {~fancy} {d}?"]], beat: '{d} goes very still.' },
    { id: 'la.fo.02', when: { of: 'fancy-other' }, turns: [['b', "Do you wish you were coupled up with {d}?"]], beat: 'Every head turns to {d}.' },
    { id: 'la.fo.03', when: { of: 'fancy-other' }, stage: '{b} reads it, looks up, and reads it again.', turns: [['b', "Do you have feelings for {d}?"]] },
    { id: 'la.bb.01', when: { of: 'behind-back' }, turns: [['b', "Have you done anything behind {c}'s back since you've been coupled up?"]] },
    { id: 'la.bb.02', when: { of: 'behind-back' }, stage: '{b} lowers the card for a second before reading it.', turns: [['b', "Have you kept anything from {c}?"]] },
    { id: 'la.bb.03', when: { of: 'behind-back' }, turns: [['b', "Is there anything you've done in here that {c} doesn't know about?"]] },
    { id: 'la.te.01', when: { of: 'tempted' }, turns: [['b', "Could you be tempted by someone else when you're out of the villa?"]] },
    { id: 'la.te.02', when: { of: 'tempted' }, turns: [['b', "Would you ever cheat on {c} when you're out?"]] },
    { id: 'la.te.03', when: { of: 'tempted' }, stage: 'A couple of people wince before {b} even finishes.', turns: [['b', "Are you excited about the attention you'll get when you leave?"]] },
    { id: 'la.ha.01', when: { of: 'happy' }, turns: [['b', "Are you happy in your couple with {c}?"]] },
    { id: 'la.ha.02', when: { of: 'happy' }, turns: [['b', "Is {c} the one you want to be with in here?"]] },
    { id: 'la.fa.01', when: { of: 'fame' }, turns: [['b', "Are you in the villa just for the fame?"]], beat: 'The villa groans.' },
    { id: 'la.fa.02', when: { of: 'fame' }, turns: [['b', "Did you come on the show for the followers?"]] },
    { id: 'la.ex.01', when: { of: 'ex' }, turns: [['b', "Do you still have feelings for your ex?"]] },
    { id: 'la.ex.02', when: { of: 'ex' }, turns: [['b', "Do you miss your ex from before the villa?"]] },
  ],

  'lie-answer': [
    { id: 'lan.y.01', when: { of: 'yes' }, turns: [['a', "Yes."]] },
    { id: 'lan.y.02', when: { of: 'yes' }, turns: [['a', "Yeah. Of course."]] },
    { id: 'lan.y.03', when: { of: 'yes' }, turns: [['a', "Yes. Hundred percent."]] },
    { id: 'lan.y.04', when: { of: 'yes' }, turns: [['a', "Yes, I do."]] },
    { id: 'lan.n.01', when: { of: 'no' }, turns: [['a', "No."]] },
    { id: 'lan.n.02', when: { of: 'no' }, turns: [['a', "No. Not at all."]] },
    { id: 'lan.n.03', when: { of: 'no' }, turns: [['a', "No. Never."]] },
    { id: 'lan.n.04', when: { of: 'no' }, turns: [['a', "Nope."]] },
    { id: 'lan.ys.01', when: { of: 'yes-slow' }, turns: [['a', "…Yes."]] },
    { id: 'lan.ys.02', when: { of: 'yes-slow' }, turns: [['a', "Um. Yeah. Yes."]] },
    { id: 'lan.ns.01', when: { of: 'no-slow' }, turns: [['a', "…No."]] },
    { id: 'lan.ns.02', when: { of: 'no-slow' }, turns: [['a', "No. No. Definitely not."]] },
    { id: 'lan.ya.01', when: { of: 'yes-admit' }, turns: [['a', "Honestly? Yes."]] },
    { id: 'lan.ya.02', when: { of: 'yes-admit' }, turns: [['a', "I'm not going to lie on a lie detector. Yes."]] },
    { id: 'lan.na.01', when: { of: 'no-admit' }, turns: [['a', "…No. Not yet. I'm sorry."]] },
    { id: 'lan.na.02', when: { of: 'no-admit' }, turns: [['a', "I don't know. No. Not right now."]] },
  ],

  'lie-read': [
    { id: 'lr.g.01', when: { of: 'green' }, turns: [['b', "It's green."]] },
    { id: 'lr.g.02', when: { of: 'green' }, turns: [['b', "Green. That's the truth."]] },
    { id: 'lr.g.03', when: { of: 'green' }, turns: [['b', "Green light."]] },
    { id: 'lr.r.01', when: { of: 'red' }, turns: [['b', "…It's red."]] },
    { id: 'lr.r.02', when: { of: 'red' }, turns: [['b', "Oh. That's red."]] },
    { id: 'lr.r.03', when: { of: 'red' }, turns: [['b', "Red. It says you're lying."]] },
    { id: 'lr.b.01', when: { of: 'blue' }, turns: [['b', "It's blue. What does blue mean?"]] },
    { id: 'lr.b.02', when: { of: 'blue' }, turns: [['b', "Blue. It can't tell."]] },
  ],

  'lie-react': [
    { id: 'lx.rl.01', when: { of: 'relief' }, turns: [['c', "Oh, thank God."]], beat: '{c} lets out a long breath.' },
    { id: 'lx.rl.02', when: { of: 'relief' }, turns: [['c', "See? I knew it."]], beat: 'The villa claps. {a} looks over and grins.' },
    { id: 'lx.rl.03', when: { of: 'relief' }, turns: [['a', "Told you."], ['c', "I believed you. I just wanted to hear it."]] },
    { id: 'lx.rl.04', when: { of: 'relief' }, beat: '{c} puts a hand on {c.posAdj} chest and smiles for the first time today.' },
    { id: 'lx.h.01', when: { of: 'hurt' }, turns: [['a', "That's not right. That machine's wrong."], ['c', "Is it?"]], beat: 'Nobody in the villa says a word.' },
    { id: 'lx.h.02', when: { of: 'hurt' }, turns: [['c', "Wow."]], beat: '{c} stares at the floor. Somebody reaches for {c.posAdj} hand.' },
    { id: 'lx.h.03', when: { of: 'hurt' }, turns: [['a', "I swear to you, that's not true."], ['c', "Don't. Not in front of everyone."]] },
    { id: 'lx.h.04', when: { of: 'hurt' }, turns: [['c', "Okay. Next question."]], beat: '{c} is trying very hard not to cry, and everyone can see it.' },
    { id: 'lx.s.01', when: { of: 'stung' }, turns: [['c', "At least you were honest."]], beat: "It's clearly not much comfort." },
    { id: 'lx.s.02', when: { of: 'stung' }, turns: [['a', "I'm sorry. I wasn't going to lie."], ['c', "No. I know. Thank you."]] },
    { id: 'lx.s.03', when: { of: 'stung' }, beat: "The light is green. {c} nods, but doesn't look happy." },
    { id: 'lx.l.01', when: { of: 'laugh' }, turns: [['c', "I knew it!"]], beat: 'The whole villa is laughing, {a} included.' },
    { id: 'lx.l.02', when: { of: 'laugh' }, turns: [['a', "Okay, maybe a bit."]], beat: 'Everyone cracks up.' },
    { id: 'lx.l.03', when: { of: 'laugh' }, turns: [['c', "Of course it did."]], beat: '{a} holds {a.posAdj} hands up, laughing.' },
    { id: 'lx.c.01', when: { of: 'confused' }, turns: [['a', "So I'm not lying, but I'm not telling the truth either?"], ['c', "That's worse."]] },
    { id: 'lx.c.02', when: { of: 'confused' }, turns: [['c', "Blue? What am I meant to do with blue?"]], beat: 'Nobody has an answer.' },
    { id: 'lx.c.03', when: { of: 'confused' }, beat: '{c} looks at {a}. {a} shrugs.' },
  ],

  'lie-row': [
    { id: 'lrw.o.01', when: { of: 'own-it' }, stage: 'The daybeds, straight after. {b} walks off and {a} follows.', turns: [
      ['b', "What was it? What have you done?"], ['a', "I kissed someone. It was stupid. It meant nothing."],
      ['b', "It meant nothing? Then why did you lie about it with wires on your hands?"]], beat: '{a} has no answer to that.' },
    { id: 'lrw.o.02', when: { of: 'own-it' }, turns: [
      ['a', "I'm not going to keep lying. The machine's right."], ['b', "How long were you going to let me not know?"], ['a', "I was scared."],
      ['b', "You should have been."]] },
    { id: 'lrw.o.03', when: { of: 'own-it' }, stage: 'By the pool. The villa pretends not to listen.', turns: [
      ['b', "Just tell me. Now. Everything."], ['a', "Okay. Okay. There was something, and I should have told you."]], beat: 'By the end of it, {b} is shaking.' },
    { id: 'lrw.d.01', when: { of: 'deny' }, stage: 'The terrace, after.', turns: [
      ['b', "Why did it go red?"], ['a', "Because I was nervous. Everyone was staring at me."], ['b', "You didn't look nervous."],
      ['a', "I'm telling you the truth."]], beat: "{b} wants to believe it, but doesn't look sure." },
    { id: 'lrw.d.02', when: { of: 'deny' }, turns: [
      ['a', "It's a machine. It's for TV. You can't trust it over me."], ['b', "I don't know what to trust any more."]] },
    { id: 'lrw.d.03', when: { of: 'deny' }, turns: [
      ['b', "Look me in the eye and tell me it was wrong."], ['a', "It was wrong."]], beat: '{a} takes a moment to say it.' },
    { id: 'lrw.b.01', when: { of: 'broken' }, stage: 'The daybeds. {a} is still pulling the tape off {a.posAdj} fingers.', turns: [
      ['a', "I was telling the truth. I swear on everything."], ['b', "Then why did it go red?"],
      ['a', "I don't know. Maybe because I've never wanted anything to go green so much."]] },
    { id: 'lrw.b.02', when: { of: 'broken' }, turns: [
      ['a', "That thing is broken. Everyone knows those machines get it wrong."], ['b', "I want to believe you."],
      ['a', "Then believe me."]] },
    { id: 'lrw.b.03', when: { of: 'broken' }, turns: [
      ['b', "Are we okay?"], ['a', "We're okay. I promise you, it was wrong."]], beat: '{b} leans into {a}, but still looks unsure.' },
  ],

  'challenge-text': [
    { id: 'challenge-text.lie-detector.1', when: { of: 'lie-detector' }, stage: 'A text arrives, and {a} reads it out.',
      turns: [['a', "Islanders, today some of you will be taking a lie detector test. Your partners will be writing the questions. #TheTruthIsOut"], ['a', "Oh my God. Oh my God."]] },
    { id: 'challenge-text.lie-detector.2', when: { of: 'lie-detector' }, stage: 'A text arrives, and {a} reads it out.',
      turns: [['a', "Islanders, today some of you will be taking a lie detector test. Your partners will be writing the questions. #TheTruthIsOut"], ['a', "Right. Who's nervous? Hands up."]] },
  ],
};

const K = (kind, more = {}) => ({ kind, ...more });
export const LIE_HUT = {
  honest: [
    { id: 'hut.ld.h1', when: K('lie-question', { of: 'false-red', role: 0 }), turns: [['a', "I was telling the truth. I know I was. And now everyone's looking at me like I'm a liar."]] },
    { id: 'hut.ld.h2', when: K('lie-question', { of: 'caught', role: 0 }), turns: [['a', "I knew it was going to go red. I just hoped it wouldn't."]] },
    { id: 'hut.ld.h3', when: K('lie-question', { of: 'clean', role: 2 }), turns: [['a', "Seeing that green light. I can't explain how much I needed that."]] },
    { id: 'hut.ld.h4', when: K('lie-question', { of: 'admit', role: 0 }), turns: [['a', "I'm not going to lie on a lie detector. That would be mad. But I've hurt them now."]] },
    { id: 'hut.ld.h5', when: K('lie-row', { of: 'own-it', role: 1 }), turns: [['a', "I asked the question because I had a feeling. I just didn't want to be right."]] },
    { id: 'hut.ld.h6', when: K('lie-row', { of: 'broken', role: 1 }), turns: [['a', "I want to believe it was the machine. I really do."]] },
  ],
  'two-faced': [
    { id: 'hut.ld.t1', when: K('lie-question', { of: 'got-away', role: 0 }), turns: [['a', "Green. Thank God for that. I'm not saying another word."]] },
    { id: 'hut.ld.t2', when: K('lie-row', { of: 'deny', role: 0 }), turns: [['a', "It's a machine on a TV show. Nobody's going home over a light."]] },
  ],
};
