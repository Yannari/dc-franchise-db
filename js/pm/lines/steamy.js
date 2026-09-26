// pm/lines/steamy.js — the villa when it runs hot. Data only.
//
// User: "I need narration details for steamy things, almost freaky". The
// show plays it cheeky, not explicit: what the cameras catch, what the villa
// sees, and a narrator who cannot quite believe any of it. Suggestion, never
// description — the lights go down, the covers move, somebody coughs.
//
// STEAMY_NARRATOR: the voiceover over a steamy scene (script.js narratorFor
// gives these first call on the night's voiceover). {a} and {b} are the scene.
// STEAMY_SCENES: more staging for the steamy scenes themselves.
export const STEAMY_NARRATOR = {
  // Said plainly: what happened, and the detail that makes it hot. No
  // punchline, no "X's hands would like a word" (user: "this isn't good
  // writing, we talked about this").
  'game-kiss': [
    { id: 'nar.gk.c1', when: { of: 'crush' }, turns: [['narrator', "The challenge was a peck. {a} and {b} kissed for a good ten seconds."]] },
    { id: 'nar.gk.c2', when: { of: 'crush' }, turns: [['narrator', "{a} kept kissing {b} after the whistle went."]] },
    { id: 'nar.gk.c3', when: { of: 'crush', taken: true }, turns: [['narrator', "{a} walked past {pa} to get to {b}, and had both hands on {b} before the kiss even started."]] },
    { id: 'nar.gk.c4', when: { of: 'crush' }, turns: [['narrator', "When {a} pulled away, {b} was still leaning in."]] },
    { id: 'nar.gk.c5', when: { of: 'crush', bTaken: true }, turns: [['narrator', "{pb} watched the whole kiss, and didn't say a word."]] },
    { id: 'nar.gk.c6', when: { of: 'crush' }, turns: [['narrator', "{a} held {b} by the waist the whole time, and the villa went quiet."]] },
    { id: 'nar.gk.c7', when: { of: 'crush', taken: true }, turns: [['narrator', "That was the longest kiss of the challenge, and it wasn't with {pa}."]] },
    { id: 'nar.gk.s1', when: { of: 'stir', bTaken: true }, turns: [['narrator', "{a} kissed {b} slowly, and looked at {pb} the whole time."]] },
    { id: 'nar.gk.s2', when: { of: 'stir' }, turns: [['narrator', "{a} chose {b} on purpose, and wanted everyone to know it."]] },
    { id: 'nar.gk.s3', when: { of: 'stir', bTaken: true }, turns: [['narrator', "{a} isn't interested in {b}. {a} wanted {pb} to watch."]] },
    { id: 'nar.gk.p1', when: { of: 'partner' }, turns: [['narrator', "{a} went straight to {b}, and the kiss was the least shy one of the day."]] },
  ],
  pull: [
    { id: 'nar.pull.s1', when: { heat: 'steamy' }, turns: [['narrator', "{a} and {b} have been on the daybed for an hour, legs tangled, talking in whispers."]] },
    { id: 'nar.pull.s2', when: { heat: 'steamy' }, turns: [['narrator', "{b}'s hand hasn't left {a}'s knee since they sat down."]] },
    { id: 'nar.pull.s3', when: { heat: 'steamy' }, turns: [['narrator', "Their faces are about an inch apart, and neither of them has moved away."]] },
    { id: 'nar.pull.s4', when: { heat: 'steamy' }, turns: [['narrator', "Everyone else has left the terrace. {a} and {b} haven't noticed."]] },
    { id: 'nar.pull.s5', when: { heat: 'steamy' }, turns: [['narrator', "{a} is running a finger down {b}'s arm while they talk."]] },
    { id: 'nar.pull.s6', when: { heat: 'steamy' }, turns: [['narrator', "{b} has gone red, and is not looking away from {a}."]] },
    { id: 'nar.pull.s7', when: { heat: 'steamy' }, turns: [['narrator', "They were meant to be having a quick chat. They're still out there when the lights go on."]] },
    { id: 'nar.pull.s8', when: { heat: 'steamy' }, turns: [['narrator', "{a} leans in close to say something only {b} can hear. {b} laughs, and doesn't lean back."]] },
    { id: 'nar.pull.o1', when: { heat: 'one-sided' }, turns: [['narrator', "{a} is doing all the flirting. {b} keeps looking over at the others."]] },
    { id: 'nar.pull.l1', when: { heat: 'light' }, turns: [['narrator', "{a} and {b} talk about home for twenty minutes. Nothing more happens."]] },
  ],
  hideaway: [
    { id: 'nar.hw.1', turns: [['narrator', "The Hideaway door closes behind {a} and {b}. The lights go down, and the night-vision cameras come on."]] },
    { id: 'nar.hw.2', turns: [['narrator', "Back in the bedroom, nobody is asleep. Everyone is wondering what's happening in the Hideaway."]] },
    { id: 'nar.hw.3', turns: [['narrator', "{a} and {b} have the hot tub, the big bed and the whole night to themselves."]] },
    { id: 'nar.hw.4', turns: [['narrator', "The candles are still burning when the covers go over their heads."]] },
    { id: 'nar.hw.5', turns: [['narrator', "It's the first time {a} and {b} have been properly alone. They don't waste it."]] },
  ],
  'bed-share': [
    { id: 'nar.bs.1', when: { of: 'kiss' }, turns: [['narrator', "Casa Amor, three in the morning. The covers on {a}'s bed are moving."]] },
    { id: 'nar.bs.2', when: { of: 'kiss' }, turns: [['narrator', "{a} promised to stay on {a.posAdj} own side of the bed. By midnight, {a} wasn't on it."]] },
    { id: 'nar.bs.3', when: { of: 'kiss' }, turns: [['narrator', "An hour ago, {a} said there was someone back at the villa. Now {a} and {b} are kissing under the covers."]] },
    { id: 'nar.bs.4', when: { of: 'bed' }, turns: [['narrator', "{a} and {b} share a bed at Casa. The night-vision shows them whispering until it gets light."]] },
    { id: 'nar.bs.5', when: { of: 'bed' }, turns: [['narrator', "The bed is big enough for two people to keep their distance. {a} and {b} don't."]] },
  ],
  'snogger-kiss': [
    { id: 'nar.sk.1', turns: [['narrator', "{b} can't see who it is under the blindfold. {b} scores it a ten anyway."]] },
    { id: 'nar.sk.2', turns: [['narrator', "It's the longest kiss of the challenge, and {b} is grinning under the blindfold when it ends."]] },
  ],
  'blow-slip': [
    { id: 'nar.bls.1', turns: [['narrator', "The card dropped. {a} and {b} kept kissing."]] },
    { id: 'nar.bls.2', turns: [['narrator', "{a} and {b} are meant to be passing a card. Their lips have been together for a while now."]] },
  ],
  'tod-truth': [
    { id: 'nar.tt.1', when: { of: 'named-coupled' }, turns: [['narrator', "{a} said it with {c} sitting right there."]] },
    { id: 'nar.tt.2', when: { of: 'dodge' }, turns: [['narrator', "{a} didn't answer the question, and everyone noticed."]] },
  ],
  'hideaway-win': [
    { id: 'nar.hwin.1', turns: [['narrator', "{a} and {b} are spending tonight in the Hideaway. The rest of the villa will be sharing the bedroom."]] },
  ],
  'heart-rate': [
    { id: 'nar.hr.s1', when: { coupled: false, taken: true }, turns: [['narrator', "{a}'s highest reading was for {b}, not {pa}, and it's up on the screen for everyone."]] },
  ],
};

export const STEAMY_SCENES = {
  'game-kiss': [
    { id: 'gk.c8', when: { of: 'crush' }, stage: "{a} takes {b}'s face in both hands, and the kiss does not stop when it should.", turns: [['b', "…Okay. Wow."]], beat: 'Somebody on the lawn fans themselves with a cushion.' },
    { id: 'gk.c9', when: { of: 'crush' }, stage: '{a} pulls {b} in by the waist and kisses {b.obj} hard.', turns: [['a', "Was that what the challenge meant?"], ['b', "I don't care what it meant."]] },
    { id: 'gk.c10', when: { of: 'crush' }, stage: "{b} ends up pressed against the challenge wall, {a}'s hand in {b.posAdj} hair.", turns: [['b', "I think I lost."], ['a', "You definitely didn't."]], beat: 'The whole villa whoops, except the ones with partners watching.' },
    { id: 'gk.s6', when: { of: 'stir', bTaken: true }, stage: '{a} kisses {b} slowly, on purpose, eyes open, looking straight at {pb} the whole time.', turns: [['a', "Oops."]], beat: '{pb} gets up and walks off the lawn.' },
    { id: 'gk.s7', when: { of: 'stir' }, stage: "{a} sits in {b}'s lap for the kiss, and takes {a.posAdj} time getting up.", turns: [['a', "What? I'm just committed to the challenge."]] },
  ],
  pull: [
    { id: 'ht.s9', when: { heat: 'steamy' }, stage: "The daybed. {a}'s leg is over {b}'s, and neither of them has mentioned it.", turns: [
      ['b', "People are looking."], ['a', "Let them look."], ['b', "You're very sure of yourself."],
      ['a', "I'm very sure of you."], ['b', "That's not the same thing."], ['a', "Tonight it is."]],
      beat: 'Somebody turns the music up, loudly, on purpose.' },
    { id: 'ht.s10', when: { heat: 'steamy' }, stage: 'The pool at night. {a} and {b} are the only ones still in it, and they are very close.', turns: [
      ['a', "It's warmer over here."], ['b', "It's the same water."], ['a', "It's warmer over here."],
      ['b', "…It is, actually."]],
      beat: 'The lights on the terrace go off, and neither of them gets out.' },
    { id: 'ht.s11', when: { heat: 'steamy' }, stage: "{b} is putting sun cream on {a}'s back, slowly, and has been for some time.", turns: [
      ['a', "I think you've done that bit."], ['b', "Have I?"], ['a', "Three times."],
      ['b', "Better safe than sorry."], ['a', "Do the other side, then."]],
      beat: 'Two islanders on the next sunbed get up and leave.' },
  ],
  hideaway: [
    { id: 'hideaway.s1', stage: 'The Hideaway. The door shuts, the hot tub is steaming, and the lights are down low.', turns: [['a', "Finally."], ['b', "No one's going to walk in."], ['a', "No one's going to walk in."]], beat: 'The camera cuts away as they get into the hot tub.' },
    { id: 'hideaway.s2', stage: 'Rose petals on the bed, and somebody has left two glasses out.', turns: [['b', "They've really gone for it."], ['a', "So should we."]], beat: 'The lights go off. The night-vision comes on. The covers do a lot of moving.' },
  ],
  'bed-share': [
    { id: 'bed-share.s1', when: { of: 'kiss' }, stage: 'Casa Amor, lights out. The covers move, and then they move again.', turns: [['b', "We shouldn't."], ['a', "Then tell me to stop."]], beat: 'Neither of them stops.' },
    { id: 'bed-share.s2', when: { of: 'kiss' }, stage: 'The bedroom at Casa, the only light a phone charger. {a} and {b} are whispering under the covers.', turns: [['a', "Come here."], ['b', "I'm already here."]], beat: 'The whispering stops. The rest of the room pretends to be asleep.' },
  ],
};
