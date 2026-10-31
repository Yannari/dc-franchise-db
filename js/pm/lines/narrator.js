// pm/lines/narrator.js — the voiceover. Data only. Rewritten 2026-10-22 with
// the dialogue rebuild, and again 2026-10-30 (season read, the user: "less
// trying too much to be clever"). It was a comedy voiceover, one fact and then
// a joke on it ("{a} has decided the villa needs entertaining. The villa has
// not been asked."). Now it says what the scene meant and what is at stake, in
// a sentence or two, and stops. He knows what the public saw and nothing else,
// and is on nobody's side. {a} and {b} are the scene he is talking over, {c}
// only in the kinds that cast three. {day} is the villa day.
export const NARRATOR = {
  torch: [
    { id: 'nar.torch.x1', turns: [['narrator', "{b} has gone to the Hideaway with someone else. {a} says it doesn't matter, but {a} still has feelings for {b}."]] },
    { id: 'nar.torch.x2', turns: [['narrator', "{a} keeps telling everyone {a.he}'s over {b}. {a} isn't."]] },
  ],
  overthinking: [
    { id: 'nar.overthinking.x1', turns: [['narrator', "Nothing has actually happened yet. But {a} is worried, and can't stop thinking about it."]] },
    { id: 'nar.overthinking.x2', turns: [['narrator', "{a} has been going over it in {a.posAdj} head for hours, and it's only getting worse."]] },
  ],
  advice: [
    { id: 'nar.advice.x1', turns: [['narrator', "{a} has told {b} what {a.he} thinks about {c}. Now {b} has to decide what to do with it."]] },
    { id: 'nar.advice.x2', turns: [['narrator', "{b} asked {a} for advice. Whether {b} takes it is another matter."]] },
  ],
  confession: [
    { id: 'nar.confession.x1', turns: [['narrator', "{a} has told {b} the truth. It was the right thing to do, and it still hurt."]] },
    { id: 'nar.confession.x2', turns: [['narrator', "{a} could have kept quiet. {a} chose to be honest instead."]] },
  ],
  reassurance: [
    { id: 'nar.reassurance.x1', turns: [['narrator', "{a} needed to hear it, and {b} said it. For now, {a} feels better."]] },
    { id: 'nar.reassurance.x2', turns: [['narrator', "{b} says everything is fine. {a} wants to believe it."]] },
  ],
  'jealous-sulk': [
    { id: 'nar.jealous-sulk.x1', turns: [['narrator', "{a} is sitting on {a.posAdj} own at the end of the garden. Something's wrong, and {a} wants someone to notice."]] },
    { id: 'nar.jealous-sulk.x2', turns: [['narrator', "{a} says {a.he}'s fine. {a} isn't fine."]] },
  ],
  'deep-chat': [
    { id: 'nar.deep-chat.x1', turns: [['narrator', "{a} wants to know {b} better, and asks {b.obj} something real."]] },
    { id: 'nar.deep-chat.x2', turns: [['narrator', "{a} and {b} find somewhere quiet to talk, away from everyone."]] },
    { id: 'nar.deep-chat.x3', turns: [['narrator', "{a} asks {b} the kind of question you only ask someone you are starting to care about."]] },
  ],
  chat: [
    { id: 'nar.chat.x1', turns: [['narrator', "{a} and {b} are spending the whole afternoon together, and they're happy."]] },
    { id: 'nar.chat.x2', turns: [['narrator', "While the rest of the villa rushes about, {a} and {b} just want to be together."]] },
    { id: 'nar.chat.x3', turns: [['narrator', "{a} and {b} are getting closer every day."]] },
    { id: 'nar.chat.1', turns: [['narrator', "{a} and {b} have been talking all afternoon, and they're starting to talk about the future."]] },
    { id: 'nar.chat.2', turns: [['narrator', "Day {day}, and {a} and {b} still haven't run out of things to say to each other."]] },
    { id: 'nar.chat.3', when: { phase: 'morning' }, turns: [['narrator', "It's early, and {a} and {b} are already together."]] },
    { id: 'nar.chat.4', when: { gap: true }, turns: [['narrator', "{a} and {b} look happy. But one of them is more into this than the other."]] },
  ],
  kiss: [
    { id: 'nar.kiss.x1', turns: [['narrator', "{a} and {b} kiss again, in front of everyone."]] },
    { id: 'nar.kiss.x2', turns: [['narrator', "Day {day}, and {a} and {b} still can't keep their hands off each other."]] },
    { id: 'nar.kiss.1', turns: [['narrator', "{a} and {b} kiss, and the whole villa sees it."]] },
    { id: 'nar.kiss.2', when: { phase: 'evening' }, turns: [['narrator', "The night is nearly over, and {a} and {b} don't want it to end."]] },
    { id: 'nar.kiss.3', when: { end: 'first' }, turns: [['narrator', "That's the first kiss for {a} and {b}."]] },
  ],
  pull: [
    // A pull the other one turned down is not a chat they went off for
    // (season 33: "Tasha has taken Marcus for a chat" after Marcus said no).
    { id: 'nar.pull.x1', when: { rebuffed: false }, turns: [['narrator', "{a} has taken {b} for a chat, and the rest of the villa is watching."]] },
    { id: 'nar.pull.x2', when: { rebuffed: false }, turns: [['narrator', "{a} and {b} go off on their own, and everyone notices."]] },
    { id: 'nar.pull.1', turns: [['narrator', "{a} has asked {b} for a chat."]] },
    // Whether the partner saw is the engine's (a secret, or known): the voiceover never says.
    { id: 'nar.pull.2', when: { taken: true }, turns: [['narrator', "{a} is coupled up, and has just asked someone else for a chat."]] },
    { id: 'nar.pull.r1', when: { rebuffed: true }, turns: [['narrator', "{a} asked, and {b} said no, in front of half the villa."]] },
    { id: 'nar.pull.3', when: { bTaken: true }, turns: [['narrator', "{b} is coupled up, and {a} knows it. {a} has asked {b.obj} for a chat anyway."]] },
    { id: 'nar.pull.4', when: { bombshell: true, early: true }, turns: [['narrator', "{a} has been here less than a day, and already knows who {a.he} wants."]] },
    { id: 'nar.pull.5', when: { rebuffed: false }, turns: [['narrator', "{a} said it would be five minutes. It's been forty."]] },
  ],
  loyalty: [
    { id: 'nar.loyalty.1', turns: [['narrator', "{a} has just turned {b} down, and meant it."]] },
    { id: 'nar.loyalty.2', turns: [['narrator', "{b} tried, and {a} said no. {a} isn't going anywhere."]] },
    { id: 'nar.loyalty.3', turns: [['narrator', "Day {day}, and {a} has been tested, and stayed loyal."]] },
  ],
  argument: [
    { id: 'nar.argument.x1', turns: [['narrator', "{a} and {b} are arguing, and the whole villa can hear it."]] },
    { id: 'nar.argument.x2', turns: [['narrator', "It's {a} and {b} again, and this time it's worse."]] },
    { id: 'nar.argument.x3', turns: [['narrator', "{a} is shouting now, and {b} isn't backing down."]] },
    { id: 'nar.argument.1', turns: [['narrator', "For the rest of the afternoon, nobody goes near {a}."]] },
    { id: 'nar.argument.2', turns: [['narrator', "Nobody's sure how that one started. Both of them think the other one did."]] },
    { id: 'nar.argument.3', when: { coupled: true }, turns: [['narrator', "{a} and {b} are a couple, they share a bed, and right now they're not speaking."]] },
    { id: 'nar.argument.4', when: { coupled: false }, turns: [['narrator', "{a} and {b} have never really got on, and today it all came out."]] },
  ],
  friendship: [
    { id: 'nar.friendship.x1', turns: [['narrator', "It's not all about the couples. {a} and {b} have become real friends."]] },
    { id: 'nar.friendship.x2', turns: [['narrator', "{a} and {b} have become each other's person in here."]] },
    { id: 'nar.friend.1', turns: [['narrator', "Whatever happens in the villa, {a} and {b} look after each other."]] },
    { id: 'nar.friend.2', when: { phase: 'morning' }, turns: [['narrator', "Day {day}. {a} and {b} are the first ones up."]] },
    { id: 'nar.friend.3', turns: [['narrator', "{a} and {b} have been friends since the first day."]] },
    { id: 'nar.friend.4', when: { friction: true }, turns: [['narrator', "{a} and {b} are usually close. Today, something has come between them."]] },
  ],
  gossip: [
    { id: 'nar.gossip.1', turns: [['narrator', "{a} has seen something, and is about to tell {b} everything."]] },
    { id: 'nar.gossip.2', turns: [['narrator', "{c} has no idea what's just been said."]] },
    { id: 'nar.gossip.3', turns: [['narrator', "In the villa, nothing stays secret for long."]] },
  ],
  comedy: [
    { id: 'nar.comedy.x1', turns: [['narrator', "{a} is keeping everyone's spirits up today."]] },
    { id: 'nar.comedy.1', turns: [['narrator', "It's day {day}, and {a} has the whole villa laughing."]] },
    { id: 'nar.comedy.2', turns: [['narrator', "For a few minutes, nobody in the villa is worrying about anything."]] },
  ],
  ick: [
    { id: 'nar.ick.1', turns: [['narrator', "{b} doesn't know it yet, but {a} has just gone off {b.obj}, over something very small."]] },
    { id: 'nar.ick.2', turns: [['narrator', "This morning, {a} couldn't stop smiling at {b}. Now {a} isn't sure about {b} at all."]] },
  ],
  'challenge-kiss': [
    { id: 'nar.challenge-kiss.x1', turns: [['narrator', "It's only a challenge, but that kiss is going to cause problems."]] },
    { id: 'nar.ckiss.1', turns: [['narrator', "{a} says it was only a game. Not everyone believes {a.obj}."]] },
    { id: 'nar.ckiss.2', when: { taken: true }, turns: [['narrator', "{a} has just kissed {b}, and {a.posAdj} partner was watching."]] },
  ],
  'challenge-win': [
    { id: 'nar.cwin.1', turns: [['narrator', "{a} and {b} have won, and they're over the moon."]] },
    { id: 'nar.cwin.2', turns: [['narrator', "A win for {a} and {b}, and a night to celebrate."]] },
  ],
  'close-off': [
    { id: 'nar.close-off.x1', turns: [['narrator', "{a} has closed off for {b}. {b} is over the moon."]] },
    { id: 'nar.close.1', turns: [['narrator', "{a} has closed off. From now on, {a} only wants {b}."]] },
  ],
  'keeping-open': [
    { id: 'nar.open.1', turns: [['narrator', "{a} is keeping {a.posAdj} options open, and {b} heard every word."]] },
  ],
  'open-back-up': [
    { id: 'nar.reopen.1', turns: [['narrator', "Not long ago, {a} was closed off for {b}. Now {a} has opened back up."]] },
  ],
  'exclusive-ask': [
    { id: 'nar.ask.1', turns: [['narrator', "{a} and {b} are exclusive now. Neither of them is looking at anyone else."]] },
  ],
  'official-ask': [
    { id: 'nar.official.1', turns: [['narrator', "{a} asked, {b} said yes, and the whole villa came running out. {a} and {b} are official."]] },
  ],
  'ask-declined': [
    { id: 'nar.declined.1', turns: [['narrator', "{a} asked, and {b} said not yet. {a} is hurt, and trying not to show it."]] },
  ],
  'love-said': [
    { id: 'nar.love-said.x1', turns: [['narrator', "{a} and {b} have fallen in love."]] },
    { id: 'nar.love.1', turns: [['narrator', "{a} said it, and {b} said it back. Day {day}, and they're in love."]] },
  ],
  'love-hanging': [
    { id: 'nar.hang.1', turns: [['narrator', "{a} has told {b} how {a.he} feels, and {b} didn't say it back."]] },
  ],
  'jealous-confront': [
    { id: 'nar.confront.1', turns: [['narrator', "{a} has been watching {b} with {c} for two days, and has finally said something."]] },
  ],
  'told-confront': [
    { id: 'nar.told.1', turns: [['narrator', "{a} has asked {b} one simple question, and {b} doesn't have a simple answer."]] },
    { id: 'nar.told.2', turns: [['narrator', "{c} knows this conversation is happening, and is keeping well out of it."]] },
    { id: 'nar.told.3', when: { verdict: 'done' }, turns: [['narrator', "{a} has walked off, and that might be the end of {a} and {b}."]] },
    { id: 'nar.told.4', when: { verdict: 'forgive', believed: false }, turns: [['narrator', "{a} has forgiven {b}. For now."]] },
    { id: 'nar.told.5', when: { believed: true }, turns: [['narrator', "{a} believes {b}. Now {a} wants to know why {c} said it."]] },
    { id: 'nar.told.6', when: { of: 'denies', believed: false }, turns: [['narrator', "{b} says it never happened. {a} isn't sure what to believe."]] },
    { id: 'nar.told.7', when: { verdict: 'warning' }, turns: [['narrator', "{b} is still coupled up with {a}, but only just."]] },
  ],
  'stirrer-confront': [
    { id: 'nar.stir.1', turns: [['narrator', "{a} wants to know who's been talking, and has come straight to {b}."]] },
    { id: 'nar.stir.2', when: { end: 'feud' }, turns: [['narrator', "{a} and {b} have agreed on one thing: they never want to speak to each other again."]] },
    { id: 'nar.stir.3', when: { end: 'cleared' }, turns: [['narrator', "{b} has said sorry, and {a} has accepted it."]] },
    { id: 'nar.stir.4', when: { of: 'denies' }, turns: [['narrator', "{b} says {b.he} hasn't said a word to anyone. {a} doesn't believe {b.obj}."]] },
    { id: 'nar.stir.5', when: { side: 'partner' }, turns: [['narrator', "{a} has decided to believe {c} over {b}."]] },
  ],
  'jealous-retaliate': [
    { id: 'nar.retaliate.1', turns: [['narrator', "{a} is flirting with {b}, and making sure {c} can see it."]] },
  ],
  entrance: [
    { id: 'nar.entrance.x1', turns: [['narrator', "Here comes {a}, and the couples are holding hands a little tighter."]] },
    { id: 'nar.entrance.x2', turns: [['narrator', "{a} has walked in, and every conversation in the villa has stopped."]] },
    { id: 'nar.entrance.1', turns: [['narrator', "Someone new is here. The singles are excited. The couples are nervous."]] },
    { id: 'nar.entrance.2', when: { split: true }, turns: [['narrator', "Welcome to Casa Amor. New faces, and every couple about to be tested."]] },
  ],
  steal: [
    { id: 'nar.steal.1', turns: [['narrator', "{a} came in and took {b}, and {c} is left sitting on the bench on {c.posAdj} own."]] },
  ],
  'recouple-pick': [
    { id: 'nar.recouple-pick.x1', turns: [['narrator', "{a} has picked {b}, and {b} looks relieved."]] },
    { id: 'nar.pick.1', when: { stoleFrom: true }, turns: [['narrator', "A minute ago, {b} was with {c}. Now {b} is with {a}, and {c} is on the bench."]] },
    { id: 'nar.pick.2', when: { reason: 'loyalty' }, turns: [['narrator', "{a} picked {b}, just like everyone expected."]] },
  ],
  'dump-verdict': [
    { id: 'nar.dump-verdict.x1', turns: [['narrator', "It's over for {a}."]] },
    { id: 'nar.dump.1', turns: [['narrator', "And just like that, {a}'s time in the villa is over."]] },
  ],
  'casa-return': [
    { id: 'nar.casa.1', when: { choice: 'twist', taken: true }, turns: [['narrator', "{a} has come back from Casa with {b}, and {pa} has been waiting on that bench."]] },
    { id: 'nar.casa.2', when: { choice: 'stick', withB: true }, turns: [['narrator', "{a} came back alone, and {b} can't hold back the tears."]] },
  ],
  photos: [
    { id: 'nar.photos.x1', turns: [['narrator', "The photos are out, and some islanders have a lot of explaining to do."]] },
    { id: 'nar.photos.1', turns: [['narrator', "Some islanders said nothing happened at Casa. The photos say otherwise."]] },
  ],
  'heart-rate': [
    { id: 'nar.heart.1', when: { coupled: false, taken: true }, turns: [['narrator', "The heart monitor has just shown everyone something {a} wanted to keep to {a.ref}."]] },
  ],
  'movie-night': [
    { id: 'nar.movie.1', turns: [['narrator', "It's Movie Night, and everyone is about to see what they missed."]] },
  ],
  // ── kinds that air a lot and had no voiceover ──
  comfort: [
    { id: 'nar.comfort.1', turns: [['narrator', "{a} has found {b}, and sat down without a word."]] },
    { id: 'nar.comfort.2', turns: [['narrator', "{b} is having a hard time, and {a} isn't going to leave {b.obj} on {b.posAdj} own."]] },
  ],
  vent: [
    { id: 'nar.vent.1', turns: [['narrator', "{a} needed to get it off {a.posAdj} chest, and {b} is the one listening."]] },
  ],
  debrief: [
    { id: 'nar.debrief.1', turns: [['narrator', "The recoupling is over, and now everyone wants to talk about it."]] },
    { id: 'nar.debrief.2', turns: [['narrator', "After the fire pit, {a} has something to say."]] },
  ],
  breakdown: [
    { id: 'nar.breakdown.1', turns: [['narrator', "It's been building for days, and today it's all come out. {a} isn't okay, and isn't pretending any more."]] },
  ],
  blowup: [
    { id: 'nar.blowup.1', turns: [['narrator', "That's the biggest row the villa has seen, and it isn't over."]] },
    { id: 'nar.blowup.2', turns: [['narrator', "Everyone in the villa now knows exactly what {a} thinks of {b}."]] },
  ],
  'pile-in': [
    { id: 'nar.pile.1', turns: [['narrator', "It was between two people. Now the rest of the villa is taking sides."]] },
  ],
  'clear-the-air': [
    { id: 'nar.clear.1', when: { of: 'peace' }, turns: [['narrator', "{a} and {b} have made up, and the villa can breathe again."]] },
    { id: 'nar.clear.2', when: { of: 'still-angry' }, turns: [['narrator', "{a} and {b} have talked, but nothing is fixed."]] },
  ],
  'bombshell-react': [
    { id: 'nar.bombreact.1', turns: [['narrator', "Everyone says they're not bothered about the new arrival. Not everyone means it."]] },
  ],
  'casa-miss': [
    { id: 'nar.casamiss.1', when: { taken: true }, turns: [['narrator', "Across the villa, the party is in full swing. {a} is on a sunbed, missing {pa}."]] },
  ],
  date: [
    { id: 'nar.date.1', turns: [['narrator', "{a} and {b} are on a date. Back at the villa, someone is waiting for them to come home."]] },
  ],
  hideaway: [
    { id: 'nar.hide.1', turns: [['narrator', "{a} and {b} are spending the night in the Hideaway, just the two of them."]] },
  ],
  'recouple-nerves': [
    { id: 'nar.recnerves.1', turns: [['narrator', "It's recoupling night. Everyone's getting ready, and nobody knows who they'll be sleeping next to tonight."]] },
  ],
  'dump-nerves': [
    { id: 'nar.dumpnerves.1', turns: [['narrator', "There's a dumping tonight, and everyone is scared it'll be them."]] },
  ],
  'snog-marry-pie': [
    { id: 'nar.smp.1', turns: [['narrator', "Snog, marry, pie. Everyone has to say out loud what they think of each other."]] },
  ],
};
