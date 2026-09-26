// pm/lines/narrator.js — the voiceover (Plan 3, Task 6). Data only.
//
// A dry British voice over the villa, about six times an episode, straight
// after a scene that AIRED — he knows what the public saw and nothing else.
// He is funny the way a person telling you about their day is funny: from
// the situation, said plainly (spec §16.5). Never a meme, never a sting.
// {a} and {b} are the scene he is talking over. {day} is the villa day.
export const NARRATOR = {
  torch: [
    { id: 'nar.torch.x1', turns: [['narrator', "{b} is off to the Hideaway with someone else. {a} says it's fine, but hasn't stopped watching the stairs."]] },
  ],
  overthinking: [
    { id: 'nar.overthinking.x1', turns: [['narrator', "{a} has been worrying about this for two hours, and nothing has actually happened yet."]] },
  ],
  advice: [
    { id: 'nar.advice.x1', turns: [['narrator', "{a} has given {b} some advice about {c}. Now we see if {b} listens."]] },
  ],
  confession: [
    { id: 'nar.confession.x1', turns: [['narrator', "{a} has told {b} the truth. It was the right thing to do, but {b} isn't taking it well."]] },
  ],
  reassurance: [
    { id: 'nar.reassurance.x1', turns: [['narrator', "{a} needed to hear that, and {b} said it. Everyone can relax for now."]] },
  ],
  'jealous-sulk': [
    { id: 'nar.jealous-sulk.x1', turns: [['narrator', "{a} is sitting on {a.posAdj} own at the end of the garden. Something's wrong."]] },
  ],
  'deep-chat': [
    { id: 'nar.deep-chat.x1', turns: [['narrator', "{a} is opening up to {b}. For once, nobody is interrupting."]] },
    { id: 'nar.deep-chat.x2', turns: [['narrator', "Things have got serious on the daybed. {a} and {b} have stopped joking around."]] },
  ],
  chat: [
    { id: 'nar.chat.x1', turns: [['narrator', "{a} and {b} are on the daybed again, doing nothing, and loving it."]] },
    { id: 'nar.chat.x2', turns: [['narrator', "While the rest of the villa rushes about, {a} and {b} are having a lovely time."]] },
    { id: 'nar.chat.x3', turns: [['narrator', "{a} is telling {b} a story, and {b} is laughing at all the right bits."]] },
    { id: 'nar.chat.1', turns: [['narrator', "Meanwhile, {a} and {b} have been on that daybed all afternoon."]] },
    { id: 'nar.chat.2', turns: [['narrator', "Day {day} in the villa, and {a} and {b} still haven't run out of things to say."]] },
    { id: 'nar.chat.3', when: { phase: 'morning' }, turns: [['narrator', "It's early, it's hot, and {a} is already talking. {b} is still waking up."]] },
  ],
  kiss: [
    { id: 'nar.kiss.x1', turns: [['narrator', "{a} and {b} are kissing again, and the rest of the villa can't help looking."]] },
    { id: 'nar.kiss.x2', turns: [['narrator', "Day {day}, and {a} and {b} still can't keep their hands off each other."]] },
    { id: 'nar.kiss.1', turns: [['narrator', "And there it is. {a} and {b}, kissing in front of everyone."]] },
    { id: 'nar.kiss.2', when: { phase: 'evening' }, turns: [['narrator', "The lights are going off, and {a} and {b} are making the most of the last few minutes."]] },
  ],
  pull: [
    { id: 'nar.pull.x1', turns: [['narrator', "{a} has taken {b} for a chat, and everyone else has gone quiet so they can listen."]] },
    { id: 'nar.pull.x2', turns: [['narrator', "And off {a} goes, to find {b}. The rest of the villa watches them go."]] },
    { id: 'nar.pull.1', turns: [['narrator', "{a} has asked {b} for a chat. In this villa, a chat usually means something."]] },
    { id: 'nar.pull.2', when: { taken: true }, turns: [['narrator', "{a} is coupled up, and has just pulled someone else for a chat. {a.PosAdj} partner has noticed."]] },
    { id: 'nar.pull.3', when: { bTaken: true }, turns: [['narrator', "{b} is spoken for. {a} knows that. {a} has pulled {b.obj} for a chat anyway."]] },
    { id: 'nar.pull.4', when: { bombshell: true, early: true }, turns: [['narrator', "{a} has been here less than a day, and already knows who {a} wants."]] },
  ],
  loyalty: [
    { id: 'nar.loyalty.1', turns: [['narrator', "{a} has just turned down {b}. Politely, firmly, and in front of the pool."]] },
    { id: 'nar.loyalty.2', turns: [['narrator', "{b} tried, and {a} said no. {b} walks off, embarrassed."]] },
  ],
  argument: [
    { id: 'nar.argument.x1', turns: [['narrator', "{a} and {b} are arguing, and everyone else has gone quiet."]] },
    { id: 'nar.argument.x2', turns: [['narrator', "The villa has gone quiet. That means {a} and {b} are at it again."]] },
    { id: 'nar.argument.x3', turns: [['narrator', "{a} is shouting now, and {b} isn't backing down."]] },
    { id: 'nar.argument.1', turns: [['narrator', "For the next hour, nobody goes anywhere near {a}."]] },
    { id: 'nar.argument.2', turns: [['narrator', "Nobody's quite sure how that one started, and it's still going."]] },
    { id: 'nar.argument.3', when: { coupled: true }, turns: [['narrator', "{a} and {b}. Coupled up, and currently not speaking."]] },
    { id: 'nar.argument.4', when: { coupled: false }, turns: [['narrator', "{a} and {b} have never really got on. Today, the whole villa found out."]] },
  ],
  friendship: [
    { id: 'nar.friendship.x1', turns: [['narrator', "It's not all about the couples. {a} and {b} have become real friends."]] },
    { id: 'nar.friendship.x2', turns: [['narrator', "{a} and {b}, sorting out the whole villa's problems from one sunbed."]] },
    { id: 'nar.friend.1', turns: [['narrator', "Say what you like about this villa, {a} and {b} look after each other."]] },
    { id: 'nar.friend.2', when: { phase: 'morning' }, turns: [['narrator', "Day {day}. {a} and {b} are the first ones up, and the kettle's already on."]] },
  ],
  gossip: [
    { id: 'nar.gossip.1', turns: [['narrator', "{a} has seen something, and {b} is about to hear all of it."]] },
    { id: 'nar.gossip.2', turns: [['narrator', "Somewhere in the garden, {c} is laughing, with no idea what's just been said."]] },
  ],
  comedy: [
    { id: 'nar.comedy.x1', turns: [['narrator', "Every villa needs someone like {a}, keeping everyone laughing."]] },
    { id: 'nar.comedy.1', turns: [['narrator', "It's day {day}, and {a} has decided to keep everyone entertained. The whole kitchen is laughing."]] },
    { id: 'nar.comedy.2', turns: [['narrator', "{a} has the whole villa laughing again."]] },
  ],
  ick: [
    { id: 'nar.ick.1', turns: [['narrator', "{b} doesn't know it yet, but {a} has just gone right off {b.obj}."]] },
  ],
  'challenge-kiss': [
    { id: 'nar.challenge-kiss.x1', turns: [['narrator', "It's challenge day, and {a} has just made it a lot more interesting."]] },
    { id: 'nar.ckiss.1', turns: [['narrator', "It was only a game, {a} says. {a} will be saying that all night."]] },
    { id: 'nar.ckiss.2', when: { taken: true }, turns: [['narrator', "{a} has just kissed {b}, and {a.posAdj} partner is standing right there."]] },
  ],
  'challenge-win': [
    { id: 'nar.cwin.1', turns: [['narrator', "{a} and {b} have won, and they'll be talking about it all night."]] },
  ],
  'close-off': [
    { id: 'nar.close-off.x1', turns: [['narrator', "{a} has closed off for {b}, and {b} is over the moon."]] },
    { id: 'nar.close.1', turns: [['narrator', "{a} has closed off, which means {a} is only interested in {b}."]] },
  ],
  'keeping-open': [
    { id: 'nar.open.1', turns: [['narrator', "{a} is keeping {a.posAdj} options open, and {b} heard every word."]] },
  ],
  'open-back-up': [
    { id: 'nar.reopen.1', turns: [['narrator', "Not long ago, {a} was closed off for {b}. Things change quickly in here."]] },
  ],
  'exclusive-ask': [
    { id: 'nar.ask.1', turns: [['narrator', "{a} and {b} are exclusive, so nobody else is getting a look in."]] },
  ],
  'official-ask': [
    { id: 'nar.official.1', turns: [['narrator', "{a} asked, {b} said yes, and the whole villa came running. {a} and {b} are official."]] },
  ],
  'ask-declined': [
    { id: 'nar.declined.1', turns: [['narrator', "{a} asked, and {b} said not yet. That's going to hurt."]] },
  ],
  'love-said': [
    { id: 'nar.love-said.x1', turns: [['narrator', "Somewhere between the pool and the fire pit, {a} and {b} have fallen in love."]] },
    { id: 'nar.love.1', turns: [['narrator', "{a} said it, and {b} said it back. Day {day}, and they're in love."]] },
  ],
  'love-hanging': [
    { id: 'nar.hang.1', turns: [['narrator', "{a} has just told {b} how {a} feels, and {b} changed the subject."]] },
  ],
  'jealous-confront': [
    { id: 'nar.confront.1', turns: [['narrator', "{a} has been watching {b} with {c}, and has finally said something."]] },
  ],
  'jealous-retaliate': [
    { id: 'nar.retaliate.1', turns: [['narrator', "{a} is sitting very close to {b}, and {c} is watching."]] },
  ],
  entrance: [
    { id: 'nar.entrance.x1', turns: [['narrator', "Here comes {a}, and the couples are holding hands a bit tighter."]] },
    { id: 'nar.entrance.x2', turns: [['narrator', "{a} has walked in, and every conversation in the villa has stopped."]] },
    { id: 'nar.entrance.1', turns: [['narrator', "Someone new is here. The singles are excited, and the couples are nervous."]] },
    { id: 'nar.entrance.2', when: { split: true }, turns: [['narrator', "Welcome to Casa Amor. New faces, and every couple is about to be tested."]] },
  ],
  steal: [
    { id: 'nar.steal.1', turns: [['narrator', "{a} came in and took {b}. {c} is still on the bench, in shock."]] },
  ],
  'recouple-pick': [
    { id: 'nar.recouple-pick.x1', turns: [['narrator', "{a} has picked {b}, and {b} looks very happy about it."]] },
    { id: 'nar.pick.1', when: { stoleFrom: true }, turns: [['narrator', "A minute ago, {b} was with {c}. Now {b} is with {a}, and {c} is on the bench on {c.posAdj} own."]] },
    { id: 'nar.pick.2', when: { reason: 'loyalty' }, turns: [['narrator', "{a} picked {b}. Nobody is surprised."]] },
  ],
  'dump-verdict': [
    { id: 'nar.dump-verdict.x1', turns: [['narrator', "It's over for {a}, and the villa already feels quieter."]] },
    { id: 'nar.dump.1', turns: [['narrator', "And just like that, {a}'s time in the villa is over."]] },
  ],
  'casa-return': [
    { id: 'nar.casa.1', when: { choice: 'twist', taken: true }, turns: [['narrator', "{a} has come back from Casa with {b}. {pa} had been waiting."]] },
    { id: 'nar.casa.2', when: { choice: 'stick', withB: true }, turns: [['narrator', "{a} came back alone, and {b} is so relieved."]] },
  ],
  photos: [
    { id: 'nar.photos.x1', turns: [['narrator', "The photos are out, and some islanders have gone very quiet."]] },
    { id: 'nar.photos.1', turns: [['narrator', "Some islanders said nothing happened at Casa. The photos show otherwise."]] },
  ],
  'heart-rate': [
    { id: 'nar.heart.1', when: { coupled: false, taken: true }, turns: [['narrator', "The heart monitor has just shown something {a} wanted to keep quiet."]] },
  ],
  'movie-night': [
    { id: 'nar.movie.1', turns: [['narrator', "It's Movie Night, and everyone is about to see what they missed."]] },
  ],
};
