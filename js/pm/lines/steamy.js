// pm/lines/steamy.js — the villa when it runs hot. Data only.
//
// User: "I need narration details for steamy things, almost freaky" — and
// then: "just say whispering … write normally". Short, plain sentences, in
// the present: where they are and what they are doing. The heat is in the
// detail (a hand on a knee, the covers moving), never in a clever line about
// it. Suggestive, not explicit, the way the show plays it.
//
// STEAMY_NARRATOR: the voiceover over a steamy scene (script.js narratorFor
// gives these first call). STEAMY_SCENES: more staging for the scenes.
export const STEAMY_NARRATOR = {
  'game-kiss': [
    { id: 'nar.gk.c1', when: { of: 'crush' }, turns: [['narrator', "{a} and {b} kiss for ten seconds. It was meant to be a peck."]] },
    { id: 'nar.gk.c2', when: { of: 'crush' }, turns: [['narrator', "{a} keeps kissing {b} after the whistle."]] },
    { id: 'nar.gk.c3', when: { of: 'crush', taken: true }, turns: [['narrator', "{a} walks past {pa} and grabs {b}."]] },
    { id: 'nar.gk.c4', when: { of: 'crush' }, turns: [['narrator', "{a} pulls away. {b} is still leaning in."]] },
    { id: 'nar.gk.c5', when: { of: 'crush', bTaken: true }, turns: [['narrator', "{pb} watches the whole kiss."]] },
    { id: 'nar.gk.c6', when: { of: 'crush' }, turns: [['narrator', "{a} holds {b} by the waist. The villa goes quiet."]] },
    { id: 'nar.gk.c7', when: { of: 'crush', taken: true }, turns: [['narrator', "It's the longest kiss of the challenge, and it isn't with {pa}."]] },
    { id: 'nar.gk.s1', when: { of: 'stir', bTaken: true }, turns: [['narrator', "{a} kisses {b} slowly and looks at {pb}."]] },
    { id: 'nar.gk.s2', when: { of: 'stir' }, turns: [['narrator', "{a} picks {b} on purpose."]] },
    { id: 'nar.gk.s3', when: { of: 'stir', bTaken: true }, turns: [['narrator', "{a} doesn't want {b}. {a} wants {pb} to see it."]] },
    { id: 'nar.gk.p1', when: { of: 'partner' }, turns: [['narrator', "{a} goes straight to {b}."]] },
  ],
  pull: [
    { id: 'nar.pull.s1', when: { heat: 'steamy' }, turns: [['narrator', "{a} and {b} are on the daybed, legs tangled, whispering."]] },
    { id: 'nar.pull.s2', when: { heat: 'steamy' }, turns: [['narrator', "{b}'s hand is on {a}'s knee."]] },
    { id: 'nar.pull.s3', when: { heat: 'steamy' }, turns: [['narrator', "Their faces are an inch apart."]] },
    { id: 'nar.pull.s4', when: { heat: 'steamy' }, turns: [['narrator', "Everyone else has left the terrace. {a} and {b} haven't noticed."]] },
    { id: 'nar.pull.s5', when: { heat: 'steamy' }, turns: [['narrator', "{a} strokes {b}'s arm."]] },
    { id: 'nar.pull.s6', when: { heat: 'steamy' }, turns: [['narrator', "{b} is blushing."]] },
    { id: 'nar.pull.s7', when: { heat: 'steamy' }, turns: [['narrator', "It was meant to be a quick chat. They're still there an hour later."]] },
    { id: 'nar.pull.s8', when: { heat: 'steamy' }, turns: [['narrator', "{a} whispers something to {b}. {b} laughs and moves closer."]] },
    { id: 'nar.pull.o1', when: { heat: 'one-sided' }, turns: [['narrator', "{a} is flirting. {b} keeps looking at the others."]] },
    { id: 'nar.pull.l1', when: { heat: 'light' }, turns: [['narrator', "{a} and {b} talk about home. That's all."]] },
  ],
  hideaway: [
    { id: 'nar.hw.1', turns: [['narrator', "The Hideaway door shuts. The lights go down."]] },
    { id: 'nar.hw.2', turns: [['narrator', "In the bedroom, nobody is asleep."]] },
    { id: 'nar.hw.3', turns: [['narrator', "{a} and {b} have the hot tub and the bed to themselves."]] },
    { id: 'nar.hw.4', turns: [['narrator', "The covers go over their heads."]] },
    { id: 'nar.hw.5', turns: [['narrator', "{a} and {b} are finally alone."]] },
  ],
  'bed-share': [
    { id: 'nar.bs.1', when: { of: 'kiss' }, turns: [['narrator', "Casa Amor, three in the morning. The covers on {a}'s bed are moving."]] },
    { id: 'nar.bs.2', when: { of: 'kiss' }, turns: [['narrator', "{a} promised to stay on {a.posAdj} own side of the bed. By midnight, {a} wasn't."]] },
    { id: 'nar.bs.3', when: { of: 'kiss' }, turns: [['narrator', "An hour ago, {a} said there was someone back at the villa. Now {a} is kissing {b}."]] },
    { id: 'nar.bs.4', when: { of: 'bed' }, turns: [['narrator', "{a} and {b} whisper until it gets light."]] },
    { id: 'nar.bs.5', when: { of: 'bed' }, turns: [['narrator', "There's room in the bed. {a} and {b} don't use it."]] },
  ],
  'snogger-kiss': [
    { id: 'nar.sk.1', turns: [['narrator', "{b} can't see who it is. {b} gives it a ten."]] },
    { id: 'nar.sk.2', turns: [['narrator', "{b} is grinning under the blindfold."]] },
  ],
  'blow-slip': [
    { id: 'nar.bls.1', turns: [['narrator', "The card drops. {a} and {b} keep kissing."]] },
    { id: 'nar.bls.2', turns: [['narrator', "{a} and {b} are kissing. The card is on the floor."]] },
  ],
  'tod-truth': [
    { id: 'nar.tt.1', when: { of: 'named-coupled' }, turns: [['narrator', "{a} says it with {c} right there."]] },
    { id: 'nar.tt.2', when: { of: 'dodge' }, turns: [['narrator', "{a} doesn't answer. Everyone notices."]] },
  ],
  'hideaway-win': [
    { id: 'nar.hwin.1', turns: [['narrator', "{a} and {b} get the Hideaway tonight."]] },
  ],
  'heart-rate': [
    { id: 'nar.hr.s1', when: { coupled: false, taken: true }, turns: [['narrator', "{a}'s highest reading is for {b}, not {pa}. It's on the screen."]] },
  ],
};

export const STEAMY_SCENES = {
  'game-kiss': [
    { id: 'gk.c8', when: { of: 'crush' }, stage: "{a} takes {b}'s face in both hands and kisses {b.obj}.", turns: [['b', "Wow."]], beat: 'Someone on the lawn fans themselves.' },
    { id: 'gk.c9', when: { of: 'crush' }, stage: '{a} pulls {b} in by the waist and kisses {b.obj} hard.', turns: [['a', "Was that the challenge?"], ['b', "I don't care."]] },
    { id: 'gk.c10', when: { of: 'crush' }, stage: "{a} pushes {b} against the wall and kisses {b.obj}, one hand in {b.posAdj} hair.", turns: [['b', "Okay."], ['a', "Okay?"], ['b', "Do it again."]], beat: 'The villa cheers. The ones with partners watching do not.' },
    { id: 'gk.s6', when: { of: 'stir', bTaken: true }, stage: '{a} kisses {b} slowly, eyes on {pb}.', turns: [['a', "Oops."]], beat: '{pb} gets up and walks off.' },
    { id: 'gk.s7', when: { of: 'stir' }, stage: "{a} sits on {b}'s lap for the kiss and stays there.", turns: [['a', "What? It's the challenge."]] },
  ],
  pull: [
    { id: 'ht.s9', when: { heat: 'steamy' }, stage: "The daybed. {a}'s leg is over {b}'s.", turns: [
      ['b', "People are looking."], ['a', "Let them."], ['b', "You don't care?"],
      ['a', "Not right now."], ['b', "Me neither."]],
      beat: 'Someone turns the music up.' },
    { id: 'ht.s10', when: { heat: 'steamy' }, stage: 'The pool at night. {a} and {b} are the only ones in it.', turns: [
      ['a', "Come here."], ['b', "I'm here."], ['a', "Closer."]],
      beat: 'The terrace lights go off. They stay in the pool.' },
    { id: 'ht.s11', when: { heat: 'steamy' }, stage: "{b} is putting sun cream on {a}'s back. Slowly.", turns: [
      ['a', "I think you've done that bit."], ['b', "I know."], ['a', "You're still doing it."],
      ['b', "I know."]],
      beat: 'The people on the next sunbed leave.' },
  ],
  hideaway: [
    { id: 'hideaway.s1', stage: 'The Hideaway. The hot tub is on and the lights are low.', turns: [['a', "Finally."], ['b', "Nobody's going to walk in."]], beat: 'The camera cuts away as they get in.' },
    { id: 'hideaway.s2', stage: 'There are rose petals on the bed and two glasses out.', turns: [['b', "They've gone all out."], ['a', "So should we."]], beat: 'The lights go off. The covers move.' },
  ],
  'bed-share': [
    { id: 'bed-share.s1', when: { of: 'kiss' }, stage: 'Casa Amor, lights out. The covers move.', turns: [['b', "We shouldn't."], ['a', "Then tell me to stop."]], beat: "Neither of them stops." },
    { id: 'bed-share.s2', when: { of: 'kiss' }, stage: 'The Casa bedroom, dark. {a} and {b} are whispering under the covers.', turns: [['a', "Come here."], ['b', "I'm already here."]], beat: 'The whispering stops. Everyone else pretends to be asleep.' },
  ],
};
