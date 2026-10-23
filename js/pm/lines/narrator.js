// pm/lines/narrator.js — the voiceover. Data only. Rewritten 2026-10-22 with
// the dialogue rebuild: the old lines described the scene the viewer had just
// watched ("{a} has the whole villa laughing again"), which tells them nothing.
//
// A dry British voice over the villa, about six times an episode, straight
// after a scene that AIRED: he knows what the public saw and nothing else. He
// is funny the way a friend on the sofa is funny: from the situation, said
// deadpan, usually one fact and then the turn on it. He is on nobody's side,
// never cruel, never a meme. {a} and {b} are the scene he is talking over, {c}
// only in the kinds that cast three. {day} is the villa day.
export const NARRATOR = {
  torch: [
    { id: 'nar.torch.x1', turns: [['narrator', "{b} is off to the Hideaway with someone else. {a} says it's fine, and has been staring at the same stair for twenty minutes."]] },
    { id: 'nar.torch.x2', turns: [['narrator', "{a} is completely over {b}. {a} has said so four times this evening, each time a little louder."]] },
  ],
  overthinking: [
    { id: 'nar.overthinking.x1', turns: [['narrator', "{a} has been worrying about this for two hours. For the record, nothing has actually happened."]] },
    { id: 'nar.overthinking.x2', turns: [['narrator', "Inside {a}'s head, there's been a row, a break-up and a tearful reunion. Outside, it's a perfectly normal afternoon."]] },
  ],
  advice: [
    { id: 'nar.advice.x1', turns: [['narrator', "{a} has given {b} some advice about {c}. {b} has nodded at all of it, which is usually a bad sign."]] },
    { id: 'nar.advice.x2', turns: [['narrator', "Free advice from {a}, there for the taking. Like most free things in the villa, it comes with strings."]] },
  ],
  confession: [
    { id: 'nar.confession.x1', turns: [['narrator', "{a} has told {b} the truth. It was the right thing to do. Nobody has told {b} that yet."]] },
    { id: 'nar.confession.x2', turns: [['narrator', "Honesty is the best policy, they say. {a} has just tried it, and is now waiting to find out who 'they' are."]] },
  ],
  reassurance: [
    { id: 'nar.reassurance.x1', turns: [['narrator', "{a} needed to hear it, and {b} said it. The villa's emotional weather is back to sunny, for about an hour."]] },
    { id: 'nar.reassurance.x2', turns: [['narrator', "That's the third time {b} has explained they're fine. {a} is listening very carefully, in case there's a fourth."]] },
  ],
  'jealous-sulk': [
    { id: 'nar.jealous-sulk.x1', turns: [['narrator', "{a} is sitting on {a.posAdj} own at the end of the garden, in the one spot everyone can see. Something's wrong, and we're all meant to ask."]] },
    { id: 'nar.jealous-sulk.x2', turns: [['narrator', "{a} is fine. {a} has said so with arms folded, which is how you can tell."]] },
  ],
  'deep-chat': [
    { id: 'nar.deep-chat.x1', turns: [['narrator', "{a} is opening up to {b}. For once, nobody is interrupting. Somebody check on the villa."]] },
    { id: 'nar.deep-chat.x2', turns: [['narrator', "Things have got serious on the daybed. {a} and {b} have stopped joking, and the sunbed next to them has quietly emptied."]] },
    { id: 'nar.deep-chat.x3', turns: [['narrator', "{a} has told {b} something nobody else in the villa knows. Which, in this villa, is a very short list."]] },
  ],
  chat: [
    { id: 'nar.chat.x1', turns: [['narrator', "{a} and {b} are on the daybed again, doing absolutely nothing, and both of them think it's the best day of the summer."]] },
    { id: 'nar.chat.x2', turns: [['narrator', "While the rest of the villa rushes about, {a} and {b} have found the one patch of shade and are refusing to leave it."]] },
    { id: 'nar.chat.x3', turns: [['narrator', "{a} is telling {b} a story. It's a long story. {b} is laughing at all the right bits, which is either love or very good manners."]] },
    { id: 'nar.chat.1', turns: [['narrator', "Meanwhile, {a} and {b} have been on that daybed all afternoon. They've covered favourite foods, star signs, and now, worryingly, names for a dog."]] },
    { id: 'nar.chat.2', turns: [['narrator', "Day {day} in the villa, and {a} and {b} still haven't run out of things to say. Mostly because half of it is about each other."]] },
    { id: 'nar.chat.3', when: { phase: 'morning' }, turns: [['narrator', "It's early, it's already hot, and {a} is already talking. {b} hasn't opened both eyes yet."]] },
    { id: 'nar.chat.4', when: { gap: true }, turns: [['narrator', "{a} and {b} are having a lovely chat. One of them is having a slightly lovelier one than the other."]] },
  ],
  kiss: [
    { id: 'nar.kiss.x1', turns: [['narrator', "{a} and {b} are kissing again, and the rest of the villa is pretending very hard to look at the pool."]] },
    { id: 'nar.kiss.x2', turns: [['narrator', "Day {day}, and {a} and {b} still can't keep their hands off each other. Somebody has put a towel over the sunbed next to them."]] },
    { id: 'nar.kiss.1', turns: [['narrator', "And there it is. {a} and {b}, kissing in front of everyone. The kitchen has gone very quiet, apart from the kettle."]] },
    { id: 'nar.kiss.2', when: { phase: 'evening' }, turns: [['narrator', "The lights are about to go off, and {a} and {b} are making the most of every last minute of them."]] },
    { id: 'nar.kiss.3', when: { end: 'first' }, turns: [['narrator', "That's the first kiss for {a} and {b}. Somebody by the pool actually clapped."]] },
  ],
  pull: [
    // A pull the other one turned down is not a chat they went off for
    // (season 33: "Tasha has taken Marcus for a chat" after Marcus said no).
    { id: 'nar.pull.x1', when: { rebuffed: false }, turns: [['narrator', "{a} has taken {b} for a chat, and the rest of the villa has gone quiet so it can hear every word."]] },
    { id: 'nar.pull.x2', when: { rebuffed: false }, turns: [['narrator', "And off {a} goes, with {b}. Nobody says anything, and every head turns at exactly the same time."]] },
    { id: 'nar.pull.1', turns: [['narrator', "{a} has asked {b} for a chat. In this villa, a chat is never just a chat. It's a chat with consequences."]] },
    // Whether the partner saw is the engine's (a secret, or known): the voiceover never says.
    { id: 'nar.pull.2', when: { taken: true }, turns: [['narrator', "{a} is coupled up, and has just asked someone else for a chat. A completely normal chat, {a} would like everyone to know."]] },
    { id: 'nar.pull.r1', when: { rebuffed: true }, turns: [['narrator', "{a} asked. {b} said no. And half the villa was standing close enough to hear it, which is the worst half."]] },
    { id: 'nar.pull.3', when: { bTaken: true }, turns: [['narrator', "{b} is spoken for. {a} knows that. {a} has pulled {b.obj} for a chat anyway, and is calling it getting to know people."]] },
    { id: 'nar.pull.4', when: { bombshell: true, early: true }, turns: [['narrator', "{a} has been here less than a day, and already knows exactly who {a} wants. Some people just come prepared."]] },
    { id: 'nar.pull.5', when: { rebuffed: false }, turns: [['narrator', "{a} said it would be five minutes. That was forty minutes ago. Nobody is counting, apart from everyone."]] },
  ],
  loyalty: [
    { id: 'nar.loyalty.1', turns: [['narrator', "{a} has just turned down {b}. Politely, firmly, and right next to the pool, where acoustics are excellent."]] },
    { id: 'nar.loyalty.2', turns: [['narrator', "{b} tried, and {a} said no. {b} is now walking back to the kitchen as if that was always the plan."]] },
    { id: 'nar.loyalty.3', turns: [['narrator', "Loyalty, on day {day}. Somewhere, a partner is going to hear about this and be very smug."]] },
  ],
  argument: [
    { id: 'nar.argument.x1', turns: [['narrator', "{a} and {b} are arguing, and everyone else has suddenly found something very interesting to do near enough to hear it."]] },
    { id: 'nar.argument.x2', turns: [['narrator', "The villa has gone quiet. In this villa, quiet means {a} and {b} are at it again."]] },
    { id: 'nar.argument.x3', turns: [['narrator', "{a} is shouting now. {b} isn't backing down. The pool is still very blue, if anyone wants to look at that instead."]] },
    { id: 'nar.argument.1', turns: [['narrator', "For the next hour, nobody goes anywhere near {a}. Even the kettle seems nervous."]] },
    { id: 'nar.argument.2', turns: [['narrator', "Nobody's quite sure how that one started. Both of them are very sure who started it."]] },
    { id: 'nar.argument.3', when: { coupled: true }, turns: [['narrator', "{a} and {b}. Coupled up, sharing a bed, and currently not speaking. It's going to be a long night on that mattress."]] },
    { id: 'nar.argument.4', when: { coupled: false }, turns: [['narrator', "{a} and {b} have never really got on. Today, the rest of the villa got the full explanation."]] },
  ],
  friendship: [
    { id: 'nar.friendship.x1', turns: [['narrator', "It's not all about the couples. {a} and {b} have become real friends, which in this villa is somehow rarer."]] },
    { id: 'nar.friendship.x2', turns: [['narrator', "{a} and {b}, sorting out the whole villa's love lives from one sunbed. Neither of them has sorted out their own."]] },
    { id: 'nar.friend.1', turns: [['narrator', "Say what you like about this villa, {a} and {b} look after each other. Mostly by stealing each other's sun cream."]] },
    { id: 'nar.friend.2', when: { phase: 'morning' }, turns: [['narrator', "Day {day}. {a} and {b} are the first ones up, and the kettle's already on. Two teas, no sugar, all the gossip."]] },
    { id: 'nar.friend.3', turns: [['narrator', "{a} and {b} have been laughing at something for ten minutes. Nobody knows what. They don't seem to know either."]] },
    { id: 'nar.friend.4', when: { friction: true }, turns: [['narrator', "{a} and {b} usually get on brilliantly. Today, they're getting on fine, which is worse."]] },
  ],
  gossip: [
    { id: 'nar.gossip.1', turns: [['narrator', "{a} has seen something, and {b} is about to hear all of it, with hand gestures."]] },
    { id: 'nar.gossip.2', turns: [['narrator', "Somewhere in the garden, {c} is laughing, with absolutely no idea what's just been said."]] },
    { id: 'nar.gossip.3', turns: [['narrator', "In the villa, news travels faster than the wi-fi. Which, to be fair, isn't hard. There isn't any."]] },
  ],
  comedy: [
    { id: 'nar.comedy.x1', turns: [['narrator', "Every villa needs someone like {a}. Every villa also needs someone to tell {a} when to stop."]] },
    { id: 'nar.comedy.1', turns: [['narrator', "It's day {day}, and {a} has decided the villa needs entertaining. The villa has not been asked."]] },
    { id: 'nar.comedy.2', turns: [['narrator', "{a} has the whole kitchen laughing again. Somewhere, a pan of pasta is boiling over, and nobody cares."]] },
  ],
  ick: [
    { id: 'nar.ick.1', turns: [['narrator', "{b} doesn't know it yet, but {a} has just gone right off {b.obj}. Over something very small. It's always something very small."]] },
    { id: 'nar.ick.2', turns: [['narrator', "Twenty minutes ago, {a} couldn't stop smiling at {b}. Now {a} can't stop looking at {b.posAdj} feet. Love is fragile."]] },
  ],
  'challenge-kiss': [
    { id: 'nar.challenge-kiss.x1', turns: [['narrator', "It's challenge day, and {a} has just made it a lot more interesting than the producers' clipboard said it would be."]] },
    { id: 'nar.ckiss.1', turns: [['narrator', "It was only a game, {a} says. {a} will be saying that all night, to anyone who'll listen."]] },
    { id: 'nar.ckiss.2', when: { taken: true }, turns: [['narrator', "{a} has just kissed {b}, and {a.posAdj} partner is standing right there, holding a points card."]] },
  ],
  'challenge-win': [
    { id: 'nar.cwin.1', turns: [['narrator', "{a} and {b} have won, and they'll be talking about it all night. And tomorrow. And probably at the final."]] },
    { id: 'nar.cwin.2', turns: [['narrator', "A win for {a} and {b}. The prize is a party. The real prize is being insufferable at dinner."]] },
  ],
  'close-off': [
    { id: 'nar.close-off.x1', turns: [['narrator', "{a} has closed off for {b}. {b} is over the moon. The singles are quietly crossing a name off a list."]] },
    { id: 'nar.close.1', turns: [['narrator', "{a} has closed off, which means {a} is only interested in {b}. Officially. Until the next text."]] },
  ],
  'keeping-open': [
    { id: 'nar.open.1', turns: [['narrator', "{a} is keeping {a.posAdj} options open. {b} heard every word, and is now an option, which nobody wants to be."]] },
  ],
  'open-back-up': [
    { id: 'nar.reopen.1', turns: [['narrator', "Not long ago, {a} was closed off for {b}. Things change quickly in here. Doors, especially."]] },
  ],
  'exclusive-ask': [
    { id: 'nar.ask.1', turns: [['narrator', "{a} and {b} are exclusive. Nobody else is getting a look in, and a couple of people are already looking out."]] },
  ],
  'official-ask': [
    { id: 'nar.official.1', turns: [['narrator', "{a} asked, {b} said yes, and the whole villa came running out in towels. {a} and {b} are official."]] },
  ],
  'ask-declined': [
    { id: 'nar.declined.1', turns: [['narrator', "{a} asked, and {b} said not yet. Two of the most painful words in the villa, and {a} heard both of them."]] },
  ],
  'love-said': [
    { id: 'nar.love-said.x1', turns: [['narrator', "Somewhere between the pool and the fire pit, {a} and {b} have fallen in love. Nobody saw exactly when. They didn't either."]] },
    { id: 'nar.love.1', turns: [['narrator', "{a} said it, and {b} said it back. Day {day}, and they're in love. Somebody get the girls, the boys, and a tissue."]] },
  ],
  'love-hanging': [
    { id: 'nar.hang.1', turns: [['narrator', "{a} has just told {b} how {a} feels. {b} has said, that's really nice. That is not the same thing."]] },
  ],
  'jealous-confront': [
    { id: 'nar.confront.1', turns: [['narrator', "{a} has been watching {b} with {c} for two days, and has finally said something. All of it, in one go."]] },
  ],
  'told-confront': [
    { id: 'nar.told.1', turns: [['narrator', "{a} has asked {b} one simple question. {b} has given quite a long answer. In the villa, that is rarely a good sign."]] },
    { id: 'nar.told.2', turns: [['narrator', "Somewhere in the villa, {c} is suddenly very interested in a magazine."]] },
    { id: 'nar.told.3', when: { verdict: 'done' }, turns: [['narrator', "And that, it seems, is that. {a} has walked off, and {b} has run out of things to say."]] },
    { id: 'nar.told.4', when: { verdict: 'forgive', believed: false }, turns: [['narrator', "{a} has forgiven {b}. The villa breathes out. {c} breathes out slightly less."]] },
    { id: 'nar.told.5', when: { believed: true }, turns: [['narrator', "{a} believes {b}. Which means that, as far as {a} is concerned, {c} has some explaining to do."]] },
    { id: 'nar.told.6', when: { of: 'denies', believed: false }, turns: [['narrator', "{b} says it never happened, very firmly, several times. {a} is still deciding which of those times to believe."]] },
    { id: 'nar.told.7', when: { verdict: 'warning' }, turns: [['narrator', "{b} is still coupled up with {a}. Just. On probation, with no time off for good behaviour."]] },
  ],
  'jealous-retaliate': [
    { id: 'nar.retaliate.1', turns: [['narrator', "{a} is sitting very close to {b}, laughing slightly louder than the jokes deserve, and {c} is watching. That's the point."]] },
  ],
  entrance: [
    { id: 'nar.entrance.x1', turns: [['narrator', "Here comes {a}, and the couples are holding hands a little bit tighter."]] },
    { id: 'nar.entrance.x2', turns: [['narrator', "{a} has walked in, and every conversation in the villa has stopped mid-sentence. Including one about sun cream that was going really well."]] },
    { id: 'nar.entrance.1', turns: [['narrator', "Someone new is here. The singles are delighted. The couples are smiling with their mouths."]] },
    { id: 'nar.entrance.2', when: { split: true }, turns: [['narrator', "Welcome to Casa Amor. New faces, new beds, and every couple about to find out how much they meant it."]] },
  ],
  steal: [
    { id: 'nar.steal.1', turns: [['narrator', "{a} came in and took {b}. {c} is still on the bench, holding a drink nobody has the heart to take off {c.obj}."]] },
  ],
  'recouple-pick': [
    { id: 'nar.recouple-pick.x1', turns: [['narrator', "{a} has picked {b}, and {b} is doing a very bad job of looking surprised."]] },
    { id: 'nar.pick.1', when: { stoleFrom: true }, turns: [['narrator', "A minute ago, {b} was with {c}. Now {b} is with {a}, and {c} is on the bench, finding the floor very interesting."]] },
    { id: 'nar.pick.2', when: { reason: 'loyalty' }, turns: [['narrator', "{a} picked {b}. Nobody is surprised. The fire pit lets out a breath it was barely holding."]] },
  ],
  'dump-verdict': [
    { id: 'nar.dump-verdict.x1', turns: [['narrator', "It's over for {a}, and the villa already feels quieter. And slightly tidier."]] },
    { id: 'nar.dump.1', turns: [['narrator', "And just like that, {a}'s time in the villa is over. The suitcase is packed. It was never fully unpacked."]] },
  ],
  'casa-return': [
    { id: 'nar.casa.1', when: { choice: 'twist', taken: true }, turns: [['narrator', "{a} has come back from Casa with {b}. {pa} had been waiting on that bench in {pa.posAdj} best outfit."]] },
    { id: 'nar.casa.2', when: { choice: 'stick', withB: true }, turns: [['narrator', "{a} came back alone, and {b} has stopped pretending not to cry."]] },
  ],
  photos: [
    { id: 'nar.photos.x1', turns: [['narrator', "The photos are out, and some islanders have suddenly gone very quiet and very interested in their drinks."]] },
    { id: 'nar.photos.1', turns: [['narrator', "Some islanders said nothing happened at Casa. The photos have a slightly different version of events."]] },
  ],
  'heart-rate': [
    { id: 'nar.heart.1', when: { coupled: false, taken: true }, turns: [['narrator', "The heart monitor has just told everyone something {a} was planning to keep to {a.ref}. Technology."]] },
  ],
  'movie-night': [
    { id: 'nar.movie.1', turns: [['narrator', "It's Movie Night. Popcorn, blankets, and everyone about to see exactly what they missed."]] },
  ],
  // ── kinds that air a lot and had no voiceover ──
  comfort: [
    { id: 'nar.comfort.1', turns: [['narrator', "{a} has found {b} and sat down without a word. Sometimes that's the whole conversation."]] },
    { id: 'nar.comfort.2', turns: [['narrator', "In every villa there's a bathroom floor, and on every bathroom floor there's someone being looked after. Today it's {b}."]] },
  ],
  vent: [
    { id: 'nar.vent.1', turns: [['narrator', "{a} needed to get it off {a.posAdj} chest. {b} is now carrying it, and didn't ask to."]] },
  ],
  debrief: [
    { id: 'nar.debrief.1', turns: [['narrator', "The recoupling is over. The debrief is just getting started, and it will go on longer than the recoupling did."]] },
    { id: 'nar.debrief.2', turns: [['narrator', "Somebody always says 'can I just say something' at a debrief. Tonight it's {a}, and everybody braces."]] },
  ],
  breakdown: [
    { id: 'nar.breakdown.1', turns: [['narrator', "It's been building for days, and today it's come out all at once. {a} isn't okay, and for once, isn't pretending to be."]] },
  ],
  blowup: [
    { id: 'nar.blowup.1', turns: [['narrator', "That wasn't a row. That was an event. People will be talking about it for the rest of the summer."]] },
    { id: 'nar.blowup.2', turns: [['narrator', "Everyone in the villa now knows exactly what {a} thinks of {b}. And exactly how loudly {a} can say it."]] },
  ],
  'pile-in': [
    { id: 'nar.pile.1', turns: [['narrator', "It was between two people. It's now between three, and the third one wasn't asked."]] },
  ],
  'clear-the-air': [
    { id: 'nar.clear.1', when: { of: 'peace' }, turns: [['narrator', "{a} and {b} have cleared the air. The villa is breathing again. Somebody has even put music on."]] },
    { id: 'nar.clear.2', when: { of: 'still-angry' }, turns: [['narrator', "{a} and {b} have cleared the air. In the sense that they've both said a lot of words. The air is not clear."]] },
  ],
  'bombshell-react': [
    { id: 'nar.bombreact.1', turns: [['narrator', "Everyone says they're not bothered about the new arrival. Everyone has also redone their hair."]] },
  ],
  'casa-miss': [
    { id: 'nar.casamiss.1', when: { taken: true }, turns: [['narrator', "Across the villa, the party is in full swing. {a} is on a sunbed, thinking about {pa}, and not dancing."]] },
  ],
  date: [
    { id: 'nar.date.1', turns: [['narrator', "{a} and {b} are on a date. A table, two glasses, and a view. Back at the villa, someone is checking the gate every five minutes."]] },
  ],
  hideaway: [
    { id: 'nar.hide.1', turns: [['narrator', "{a} and {b} are off to the Hideaway. The rest of the villa is very busy pretending it doesn't know what that means."]] },
  ],
  'recouple-nerves': [
    { id: 'nar.recnerves.1', turns: [['narrator', "Recoupling night. Everyone's getting ready, and nobody's saying what they're all thinking."]] },
  ],
  'dump-nerves': [
    { id: 'nar.dumpnerves.1', turns: [['narrator', "There's a dumping tonight. The villa has never been so polite, so helpful, or so desperate to be liked."]] },
  ],
  'snog-marry-pie': [
    { id: 'nar.smp.1', turns: [['narrator', "Snog, marry, pie. A game that has ended more friendships than any argument."]] },
  ],
};
