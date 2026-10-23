// pm/lines/steamy.js — the villa when it runs hot. Data only.
//
// User: "I need narration details for steamy things, almost freaky" — and
// then: "just say whispering … write normally". Short, plain sentences, in
// the present: where they are and what they are doing. The heat is in the
// detail (a hand on a knee, the covers moving), never in a clever line about
// it. Suggestive, not explicit, the way the show plays it.
//
// STEAMY_NARRATOR: the voiceover over a steamy scene (script.js narratorFor
// gives these first call). The scenes themselves are pm/talk/.
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
