// pm/lines/narrator.js — the voiceover (Plan 3, Task 6). Data only.
//
// A dry British voice over the villa, about six times an episode, straight
// after a scene that AIRED — he knows what the public saw and nothing else.
// He is funny the way a person telling you about their day is funny: from
// the situation, said plainly (spec §16.5). Never a meme, never a sting.
// {a} and {b} are the scene he is talking over. {day} is the villa day.
export const NARRATOR = {
  torch: [
    { id: 'nar.torch.x1', turns: [['narrator', "{b} is off to the hideaway. {a} is pretending not to mind. {a} minds."]] },
  ],
  overthinking: [
    { id: 'nar.overthinking.x1', turns: [['narrator', "{a} has been thinking about this for about two hours. Nothing has actually happened."]] },
  ],
  advice: [
    { id: 'nar.advice.x1', turns: [['narrator', "{a} has given {b} some advice about {c}. Whether {b} takes it is another matter."]] },
  ],
  confession: [
    { id: 'nar.confession.x1', turns: [['narrator', "{a} has told {b} the truth. It's the right thing to do. It does not look like it's going well."]] },
  ],
  reassurance: [
    { id: 'nar.reassurance.x1', turns: [['narrator', "{a} needed to hear it. {b} has said it. Everyone can relax, for now."]] },
  ],
  'jealous-sulk': [
    { id: 'nar.jealous-sulk.x1', turns: [['narrator', "{a} is sitting on {a.posAdj} own at the end of the garden. That's never a good sign."]] },
  ],
  'deep-chat': [
    { id: 'nar.deep-chat.x1', turns: [['narrator', "{a} is opening up to {b}. For once, nobody is interrupting."]] },
    { id: 'nar.deep-chat.x2', turns: [['narrator', "Things have got serious on the daybed. {a} and {b} have stopped joking around."]] },
  ],
  chat: [
    { id: 'nar.chat.x1', turns: [['narrator', "{a} and {b}, on the daybed, doing absolutely nothing. It's their favourite thing."]] },
    { id: 'nar.chat.x2', turns: [['narrator', "While the rest of the villa argues about the washing up, {a} and {b} are having a lovely time."]] },
    { id: 'nar.chat.x3', turns: [['narrator', "{a} is telling {b} a story. {b} has heard it before, and is laughing anyway."]] },
    { id: 'nar.chat.1', turns: [['narrator', "Meanwhile, {a} and {b} have been on that daybed so long they've left a dent in it."]] },
    { id: 'nar.chat.2', turns: [['narrator', "Day {day} in the villa, and {a} and {b} still haven't run out of things to say."]] },
    { id: 'nar.chat.3', when: { phase: 'morning' }, turns: [['narrator', "It's early, it's hot, and {a} is already talking. {b} hasn't had a tea yet, but is nodding anyway."]] },
  ],
  kiss: [
    { id: 'nar.kiss.x1', turns: [['narrator', "{a} and {b} are kissing again. Somebody pass the rest of the villa a bucket."]] },
    { id: 'nar.kiss.x2', turns: [['narrator', "Day {day}, and {a} and {b} still can't keep their hands off each other."]] },
    { id: 'nar.kiss.1', turns: [['narrator', "And there it is. {a} and {b}, in front of everyone, with absolutely no shame at all."]] },
    { id: 'nar.kiss.2', when: { phase: 'evening' }, turns: [['narrator', "The lights are going off, and {a} and {b} are making the most of the last few minutes."]] },
  ],
  pull: [
    { id: 'nar.pull.x1', turns: [['narrator', "{a} has gone for a chat with {b}. Everyone else has gone very quiet so they can listen."]] },
    { id: 'nar.pull.x2', turns: [['narrator', "And off {a} goes, to find {b}. The rest of the villa watches them go."]] },
    { id: 'nar.pull.1', turns: [['narrator', "{a} has asked {b} for a chat. In this villa, that's never just a chat."]] },
    { id: 'nar.pull.2', when: { taken: true }, turns: [['narrator', "{a} is coupled up, and has just asked someone else for a chat. Somebody should probably tell {a.obj} how that looks."]] },
    { id: 'nar.pull.3', when: { bTaken: true }, turns: [['narrator', "{b} is spoken for. {a} knows that. {a} has pulled {b.obj} for a chat anyway."]] },
    { id: 'nar.pull.4', when: { bombshell: true, early: true }, turns: [['narrator', "{a} has been here less than a day, and has already worked out exactly who to talk to."]] },
  ],
  loyalty: [
    { id: 'nar.loyalty.1', turns: [['narrator', "{a} has just turned down {b}. Politely, firmly, and in front of the pool."]] },
    { id: 'nar.loyalty.2', turns: [['narrator', "{b} tried. {a} said no. {b} is now pretending to look for sun cream."]] },
  ],
  argument: [
    { id: 'nar.argument.x1', turns: [['narrator', "{a} and {b} are having words. Everyone else is suddenly very busy with their drinks."]] },
    { id: 'nar.argument.x2', turns: [['narrator', "The villa has gone quiet. That means {a} and {b} are at it again."]] },
    { id: 'nar.argument.x3', turns: [['narrator', "{a} has raised {a.posAdj} voice. {b} has raised {b.posAdj} eyebrows. It's going well."]] },
    { id: 'nar.argument.1', turns: [['narrator', "Meanwhile, {a}'s in the kitchen making a cup of tea, and nobody's brave enough to go in there."]] },
    { id: 'nar.argument.2', turns: [['narrator', "That started over nothing, and it's still going."]] },
    { id: 'nar.argument.3', when: { coupled: true }, turns: [['narrator', "{a} and {b}. Coupled up, and currently not speaking."]] },
    { id: 'nar.argument.4', when: { coupled: false }, turns: [['narrator', "{a} and {b} have never really got on. Today, the whole villa found out."]] },
  ],
  friendship: [
    { id: 'nar.friendship.x1', turns: [['narrator', "Not everything in here is about the couples. {a} and {b} are proof of that."]] },
    { id: 'nar.friendship.x2', turns: [['narrator', "{a} and {b}, sorting out the whole villa's problems from one sunbed."]] },
    { id: 'nar.friend.1', turns: [['narrator', "Say what you like about this villa, {a} and {b} look after each other."]] },
    { id: 'nar.friend.2', when: { phase: 'morning' }, turns: [['narrator', "Day {day}. {a} and {b} are the first ones up, and the kettle's already on."]] },
  ],
  gossip: [
    { id: 'nar.gossip.1', turns: [['narrator', "{a} has seen something, and {b} is about to hear all of it."]] },
    { id: 'nar.gossip.2', turns: [['narrator', "Somewhere in the garden, {c} is laughing, with no idea what's just been said."]] },
  ],
  comedy: [
    { id: 'nar.comedy.x1', turns: [['narrator', "Every villa needs someone like {a}. This villa has {a}, and nobody else is even close."]] },
    { id: 'nar.comedy.1', turns: [['narrator', "It's day {day}, and {a} has decided to keep everyone entertained. The whole kitchen is laughing."]] },
    { id: 'nar.comedy.2', turns: [['narrator', "{a}, everybody. The reason the villa still has a sense of humour."]] },
  ],
  ick: [
    { id: 'nar.ick.1', turns: [['narrator', "{b} doesn't know it yet, but {a} has just gone right off {b.obj}."]] },
  ],
  'challenge-kiss': [
    { id: 'nar.challenge-kiss.x1', turns: [['narrator', "It's challenge day, and {a} has just made it a lot more interesting."]] },
    { id: 'nar.ckiss.1', turns: [['narrator', "It's a challenge. It's just a game. That's what {a} will be saying for the rest of the night."]] },
    { id: 'nar.ckiss.2', when: { taken: true }, turns: [['narrator', "{a} has just kissed {b}. {a.PosAdj} partner is standing about four feet away."]] },
  ],
  'challenge-win': [
    { id: 'nar.cwin.1', turns: [['narrator', "{a} and {b} have won. They'll be mentioning it at dinner, and at breakfast, and probably at the final."]] },
  ],
  'close-off': [
    { id: 'nar.close-off.x1', turns: [['narrator', "{a} has closed off. For {b}, that's the best thing anyone has said all week."]] },
    { id: 'nar.close.1', turns: [['narrator', "{a} has closed off. That's the villa's way of saying {a} is only looking at {b}. For now."]] },
  ],
  'keeping-open': [
    { id: 'nar.open.1', turns: [['narrator', "{a} is keeping options open. {b} heard that, and is thinking about it very hard."]] },
  ],
  'open-back-up': [
    { id: 'nar.reopen.1', turns: [['narrator', "Not long ago, {a} was closed off for {b}. Things change quickly in here."]] },
  ],
  'exclusive-ask': [
    { id: 'nar.ask.1', turns: [['narrator', "{a} and {b} are exclusive. Which means, for the next few days at least, nobody else is getting a look in."]] },
  ],
  'official-ask': [
    { id: 'nar.official.1', turns: [['narrator', "Candles, petals, and half the villa hiding behind the kitchen door. {a} and {b} are official."]] },
  ],
  'ask-declined': [
    { id: 'nar.declined.1', turns: [['narrator', "{a} asked. {b} said not yet. Somebody quietly blows out the candles."]] },
  ],
  'love-said': [
    { id: 'nar.love-said.x1', turns: [['narrator', "Somewhere between the pool and the fire pit, {a} and {b} have fallen in love."]] },
    { id: 'nar.love.1', turns: [['narrator', "{a} said it, and {b} said it back. Day {day}, and they're in love."]] },
  ],
  'love-hanging': [
    { id: 'nar.hang.1', turns: [['narrator', "{a} has just told {b} exactly how {a} feels. {b} has changed the subject."]] },
  ],
  'jealous-confront': [
    { id: 'nar.confront.1', turns: [['narrator', "{a} has been watching {b} with {c} all afternoon. {a} has finally said something."]] },
  ],
  'jealous-retaliate': [
    { id: 'nar.retaliate.1', turns: [['narrator', "{a} is sitting very close to {b}. And {c} is watching every second of it."]] },
  ],
  entrance: [
    { id: 'nar.entrance.x1', turns: [['narrator', "Here comes {a}. Hide your partners."]] },
    { id: 'nar.entrance.x2', turns: [['narrator', "{a} has walked in, and every single conversation in the villa has stopped."]] },
    { id: 'nar.entrance.1', turns: [['narrator', "A new arrival. Half the villa is excited. The other half is holding on to their partner a little tighter."]] },
    { id: 'nar.entrance.2', when: { split: true }, turns: [['narrator', "Casa Amor. New faces, the same old question: how strong is your couple, really?"]] },
  ],
  steal: [
    { id: 'nar.steal.1', turns: [['narrator', "{a} came in, looked around, and took {b}. {c} is still sitting on the bench, trying to work out what just happened."]] },
  ],
  'recouple-pick': [
    { id: 'nar.recouple-pick.x1', turns: [['narrator', "{a} has made a choice. It's {b}, and {b} looks very pleased about it."]] },
    { id: 'nar.pick.1', when: { stoleFrom: true }, turns: [['narrator', "A minute ago, {b} was with {c}. Now {b} is with {a}, and {c} is on the bench on {c.posAdj} own."]] },
    { id: 'nar.pick.2', when: { reason: 'loyalty' }, turns: [['narrator', "{a} picked {b}. Nobody in the villa is surprised, least of all {b}."]] },
  ],
  'dump-verdict': [
    { id: 'nar.dump-verdict.x1', turns: [['narrator', "It's over for {a}. The villa is a little bit quieter already."]] },
    { id: 'nar.dump.1', turns: [['narrator', "And just like that, {a}'s time in the villa is over."]] },
  ],
  'casa-return': [
    { id: 'nar.casa.1', when: { choice: 'twist', taken: true }, turns: [['narrator', "{a} has come back from Casa with {b}. {pa} had been waiting."]] },
    { id: 'nar.casa.2', when: { choice: 'stick', withB: true }, turns: [['narrator', "{a} came back alone. {b} can breathe again."]] },
  ],
  photos: [
    { id: 'nar.photos.x1', turns: [['narrator', "The photos are out. Some islanders are very, very quiet."]] },
    { id: 'nar.photos.1', turns: [['narrator', "Nothing happened at Casa, apparently. There's a photo that says otherwise."]] },
  ],
  'heart-rate': [
    { id: 'nar.heart.1', when: { coupled: false, taken: true }, turns: [['narrator', "The heart monitor has just said something {a} was hoping to keep quiet."]] },
  ],
  'movie-night': [
    { id: 'nar.movie.1', turns: [['narrator', "Movie Night. Everyone is about to find out what they missed."]] },
  ],
};
