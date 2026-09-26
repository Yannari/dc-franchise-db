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
  'game-kiss': [
    { id: 'nar.gk.c1', when: { of: 'crush' }, turns: [['narrator', "That is not a challenge kiss. That is a kiss that has been waiting all week for an excuse."]] },
    { id: 'nar.gk.c2', when: { of: 'crush' }, turns: [['narrator', "Somebody tell {a} the challenge finished about thirty seconds ago."]] },
    { id: 'nar.gk.c3', when: { of: 'crush', taken: true }, turns: [['narrator', "{a} said it was only a game. {a}'s hands would like a word."]] },
    { id: 'nar.gk.c4', when: { of: 'crush' }, turns: [['narrator', "The villa has gone silent. The only sound is {b} forgetting how to breathe."]] },
    { id: 'nar.gk.c5', when: { of: 'crush', bTaken: true }, turns: [['narrator', "{pb} has seen enough. {pb} is still watching, though."]] },
    { id: 'nar.gk.c6', when: { of: 'crush' }, turns: [['narrator', "In fairness to {a}, the rules didn't say how long the kiss had to be. {a} has taken full advantage."]] },
    { id: 'nar.gk.c7', when: { of: 'crush' }, turns: [['narrator', "That kiss had tongues, feelings, and at least one partner on the benches."]] },
    { id: 'nar.gk.c8', when: { of: 'crush' }, turns: [['narrator', "{a} kissed {b} like the cameras were off. The cameras were very much on."]] },
    { id: 'nar.gk.c9', when: { of: 'crush' }, turns: [['narrator', "There's a challenge kiss, and then there's whatever that was."]] },
    { id: 'nar.gk.s3', when: { of: 'stir' }, turns: [['narrator', "{a} didn't come to play. {a} came to cause problems, and it's going brilliantly."]] },
    { id: 'nar.gk.s1', when: { of: 'stir' }, turns: [['narrator', "{a} has kissed {b}, and made very sure the right person saw it."]] },
    { id: 'nar.gk.s2', when: { of: 'stir' }, turns: [['narrator', "Some people play games to win. {a} plays them to watch the fallout."]] },
    { id: 'nar.gk.p1', when: { of: 'partner' }, turns: [['narrator', "{a} and {b}. The safe choice. Although nothing about that looked safe."]] },
    { id: 'nar.gk.f1', when: { of: 'fun' }, turns: [['narrator', "Nobody in the history of this villa has been less turned on than {b} is right now."]] },
  ],
  pull: [
    { id: 'nar.pull.s1', when: { heat: 'steamy' }, turns: [['narrator', "{a} said it was just a chat. Chats don't usually involve that much leg."]] },
    { id: 'nar.pull.s2', when: { heat: 'steamy' }, turns: [['narrator', "It's thirty degrees in the villa. On that daybed, it's a lot more."]] },
    { id: 'nar.pull.s3', when: { heat: 'steamy' }, turns: [['narrator', "{a} and {b} are having what they would describe as a conversation. The cameras would describe it differently."]] },
    { id: 'nar.pull.s4', when: { heat: 'steamy' }, turns: [['narrator', "At this point, the only thing between {a} and {b} is about an inch of air and a lot of producers."]] },
    { id: 'nar.pull.s5', when: { heat: 'steamy' }, turns: [['narrator', "{a} and {b} have been tangled up on that daybed for an hour. Nobody else has dared to sit down."]] },
    { id: 'nar.pull.s6', when: { heat: 'steamy' }, turns: [['narrator', "Somebody should really check on {b}. {b} has gone a very worrying shade of red."]] },
    { id: 'nar.pull.s7', when: { heat: 'steamy' }, turns: [['narrator', "Nothing's happened yet. {a} and {b} would like everyone to know the word 'yet' is doing a lot of work."]] },
    { id: 'nar.pull.s8', when: { heat: 'steamy' }, turns: [['narrator', "The villa's sun cream bill has doubled since {a} and {b} started talking."]] },
    { id: 'nar.pull.s9', when: { heat: 'steamy' }, turns: [['narrator', "This was meant to be a quick chat. It has turned into the hottest thing on the terrace, and everyone on the terrace knows it."]] },
    { id: 'nar.pull.s10', when: { heat: 'steamy' }, turns: [['narrator', "{b} came over for a quick chat. {b} has now forgotten what a chat is."]] },
    { id: 'nar.pull.o1', when: { heat: 'one-sided' }, turns: [['narrator', "{a} is giving this everything. {b} is giving it about four percent."]] },
    { id: 'nar.pull.l1', when: { heat: 'light' }, turns: [['narrator', "{a} and {b}: the least steamy chat in villa history. Lovely, though."]] },
  ],
  hideaway: [
    { id: 'nar.hw.1', turns: [['narrator', "The Hideaway door closes. What happens next is between {a}, {b}, and the night-vision cameras."]] },
    { id: 'nar.hw.2', turns: [['narrator', "The rest of the villa is trying to sleep. The rest of the villa is not sleeping. The rest of the villa is listening."]] },
    { id: 'nar.hw.3', turns: [['narrator', "Lights off, hot tub on, and absolutely nobody on the other side of the wall to tell them to keep it down."]] },
    { id: 'nar.hw.5', turns: [['narrator', "The Hideaway: a hot tub, a big bed, and absolutely no one reading the villa's texts tonight."]] },
    { id: 'nar.hw.6', turns: [['narrator', "Somewhere in the Hideaway, a candle is burning down. So is any pretence that {a} and {b} are taking it slow."]] },
    { id: 'nar.hw.4', turns: [['narrator', "Behind that door, {a} and {b} are getting to know each other. Very well. Extremely well."]] },
  ],
  'bed-share': [
    { id: 'nar.bs.5', when: { of: 'kiss' }, turns: [['narrator', "Casa Amor, lights out. 'I've got someone back at the villa' was said about ten minutes ago. It has already been forgotten."]] },
    { id: 'nar.bs.6', when: { of: 'bed' }, turns: [['narrator', "The bed's big enough for two people to keep their distance. {a} and {b} have chosen not to test it."]] },
    { id: 'nar.bs.1', when: { of: 'kiss' }, turns: [['narrator', "Casa Amor, three in the morning. Something under {a}'s covers has definitely moved."]] },
    { id: 'nar.bs.2', when: { of: 'kiss' }, turns: [['narrator', "{a} promised to stay on {a.posAdj} side of the bed. It turns out the bed doesn't have sides."]] },
    { id: 'nar.bs.3', when: { of: 'bed' }, turns: [['narrator', "Nothing happened, says {a}. The night-vision camera has some questions."]] },
    { id: 'nar.bs.4', when: { of: 'bed' }, turns: [['narrator', "Just sleeping. With the covers pulled all the way up, and a lot of whispering."]] },
  ],
  'snogger-kiss': [
    { id: 'nar.sk.1', turns: [['narrator', "{b} can't see a thing under that blindfold. {b} can definitely feel it, though."]] },
    { id: 'nar.sk.2', turns: [['narrator', "Ten out of ten, said {b}. The villa would like it on record that they could hear it from the pool."]] },
  ],
  'blow-slip': [
    { id: 'nar.bls.1', turns: [['narrator', "The card fell. The lips did not stop."]] },
    { id: 'nar.bls.2', turns: [['narrator', "Suck and Blow: a game about passing a card. {a} and {b} have forgotten there was ever a card."]] },
  ],
  'tod-truth': [
    { id: 'nar.tt.1', when: { of: 'named-coupled' }, turns: [['narrator', "It's called Truth or Dare. {a} picked truth. {a} is now regretting both."]] },
    { id: 'nar.tt.2', when: { of: 'dodge' }, turns: [['narrator', "That was not an answer. Everybody heard it not being an answer."]] },
  ],
  'hideaway-win': [
    { id: 'nar.hwin.1', turns: [['narrator', "{a} and {b} have won a night in the Hideaway. The villa has won a night of imagining it."]] },
  ],
  'heart-rate': [
    { id: 'nar.hr.s1', when: { coupled: false, taken: true }, turns: [['narrator', "A machine has just told the whole villa what {a} has been trying very hard not to say."]] },
  ],
};

export const STEAMY_SCENES = {
  'game-kiss': [
    { id: 'gk.c8', when: { of: 'crush' }, stage: "{a} takes {b}'s face in both hands, and the kiss does not stop when it should.", turns: [['b', "…Okay. Wow."]], beat: 'Somebody on the lawn fans themselves with a cushion.' },
    { id: 'gk.c9', when: { of: 'crush' }, stage: '{a} pulls {b} in by the waist. Whatever the game was, nobody is playing it any more.', turns: [['a', "Was that what the challenge meant?"], ['b', "I don't care what it meant."]] },
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
    { id: 'hideaway.s1', stage: 'The Hideaway. The door shuts, the hot tub is steaming, and the lights are down low.', turns: [['a', "Finally."], ['b', "No one's going to walk in."], ['a', "No one's going to walk in."]], beat: 'The camera cuts away. It does not need to show the rest.' },
    { id: 'hideaway.s2', stage: 'Rose petals on the bed, and somebody has left two glasses out.', turns: [['b', "They've really gone for it."], ['a', "So should we."]], beat: 'The lights go off. The night-vision comes on. The covers do a lot of moving.' },
  ],
  'bed-share': [
    { id: 'bed-share.s1', when: { of: 'kiss' }, stage: 'Casa Amor, lights out. The covers move, and then they move again.', turns: [['b', "We shouldn't."], ['a', "Then tell me to stop."]], beat: 'Nobody tells anybody to stop.' },
    { id: 'bed-share.s2', when: { of: 'kiss' }, stage: 'The bedroom at Casa, the only light a phone charger. {a} and {b} are whispering under the covers.', turns: [['a', "Come here."], ['b', "I'm already here."]], beat: 'The whispering stops. The rest of the room pretends to be asleep.' },
  ],
};
