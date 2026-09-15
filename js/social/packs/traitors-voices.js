// The Traitors, in the alumni chat's twelve voices.
//
// Same people as TRAIT_TAKES in js/social/voices.js, reacting to a castle
// instead of a vote-show. A column read down should sound like one host; the
// same trait here should sound like the same host there.
//
// The hosts know who the Traitors are. The castle does not.
//
// Kinds and what `s` is:
//   murder             — the player murdered in the night
//   faithful-banished  — a Faithful the Round Table banished
//   traitor-caught     — a Traitor the Round Table banished and unmasked
//   recruited          — the player offered the cloak (outcome not yet known)
//   murder-blocked     — a Shield stopped the murder. NO subject: never use `s`.
//   mission-won        — the pot grew. NO subject: never use `s`.
//
// Rules these lines hold to: a murder is not a vote; a Shield blocks one murder
// and never a banishment; a mission adds money and never safety; nobody votes
// for a winner; no invented figures.

export const HOST_TAKES = {
  // Short. Stops talking.
  deadpan: {
    murder: [
      ({ s }) => `${s} didn't come down to breakfast. Nobody needed it explained.`,
      ({ s }) => `The Traitors murdered ${s}. The people who did it poured the coffee.`,
      ({ s }) => `${s} is gone. Everyone at breakfast suspects somebody who was also at breakfast. Correct, for once.`,
      ({ s }) => `A murder. ${s}. Somebody at that table cried convincingly.`,
      ({ s }) => `${s} is out, and ${s} didn't even get to argue about it.`,
      ({ s }) => `The Traitors chose ${s}. Nobody asked them why. Nobody can.`,
    ],
    'faithful-banished': [
      ({ s }) => `${s} was Faithful. They banished ${s} anyway. Now they know.`,
      ({ s }) => `The Round Table was wrong. ${s} paid for it.`,
      ({ s }) => `${s} said Faithful. The room went quiet. It should.`,
      ({ s }) => `They were very sure about ${s}. They were very wrong. Those often travel together.`,
      ({ s }) => `The Traitors voted with the room. They didn't need to do more.`,
      ({ s }) => `One fewer Faithful. The Traitors will sleep fine.`,
    ],
    'traitor-caught': [
      ({ s }) => `${s} was a Traitor. They got one right. Mark it down.`,
      ({ s }) => `${s} turned round and said Traitor. First correct answer in a while.`,
      ({ s }) => `The room finally got one. It won't make them smarter.`,
      ({ s }) => `If there are Traitors left, they voted for ${s} too. That's how it's done.`,
      ({ s }) => `${s} lied well for a while. Then less well. Then this.`,
      ({ s }) => `Caught. ${s} looked more annoyed than surprised.`,
    ],
    recruited: [
      ({ s }) => `${s} got the offer. Saying no is allowed. It isn't always healthy.`,
      ({ s }) => `${s} was asked to join the people ${s} is supposed to be finding.`,
      ({ s }) => `A note for ${s}. It isn't a thank-you note.`,
      ({ s }) => `The Traitors want a new member. They picked ${s}. Flattering, in a bad way.`,
      ({ s }) => `${s} has a decision to make and nobody to ask.`,
      ({ s }) => `Recruitment. ${s}. I'd have guessed somebody else.`,
    ],
    'murder-blocked': [
      () => `No murder. A Shield. The Traitors wasted a night.`,
      () => `Everyone came down to breakfast. That's the whole headline.`,
      () => `The Shield worked. Shields do that. Once.`,
      () => `The Traitors picked somebody and it didn't take. Awkward for them.`,
      () => `Nobody died. The paranoia is still there. It didn't need a body.`,
      () => `A full breakfast table. Nobody knows what to do with it.`,
    ],
    'mission-won': [
      () => `The pot went up. Nobody is any safer.`,
      () => `They earned money. The Traitors earned it too, and plan to keep it.`,
      () => `Good mission. It bought nothing except money.`,
      () => `More in the pot. More reason to lie about it.`,
      () => `Everyone cheered. The Traitors cheered hardest. Make of that what you like.`,
      () => `A mission went well. That's rare enough to mention. Barely.`,
    ],
  },

  // Long. Everything is an event.
  theatrical: {
    murder: [
      ({ s }) => `${s}! Murdered! In the NIGHT! And the people who did it walked into breakfast and asked where ${s} was. I can't.`,
      ({ s }) => `I want the moment everybody realised ${s} wasn't coming down. I want it slowed down and I want to watch it again.`,
      ({ s }) => `They took ${s}, quietly, and then sat down and ate eggs with the rest of them. Monstrous. Brilliant. I'm shaking.`,
      ({ s }) => `The Traitors went up to that turret, came down with ${s} as their choice, and not one of them looked like it cost them anything.`,
      ({ s }) => `Every breakfast is a roll call, and today ${s} missed it, and I watched a Traitor count heads along with everyone else.`,
      ({ s }) => `${s} deserved a proper exit and got a morning where nobody walked in. I'm furious on ${s}'s behalf.`,
    ],
    'faithful-banished': [
      ({ s }) => `${s} turned to that table and said FAITHFUL, and I watched every face in the room fall at once. Worth the whole episode.`,
      ({ s }) => `They banished ${s}! A Faithful! While the actual Traitors nodded along and voted with them! I need to lie down.`,
      ({ s }) => `The accusations, the tears, the certainty, and ${s} was innocent the entire time. I'm appalled. I'm riveted.`,
      ({ s }) => `Somebody fetch me a chair. ${s} said Faithful and a Traitor at that table put on a face of such grief I nearly applauded.`,
      ({ s }) => `I watched ${s} beg that table to listen, and nobody did, and then the reveal. Devastating. I hate it. Play it again.`,
      ({ s }) => `The Round Table got it WRONG, magnificently wrong, and the Traitors didn't even have to raise their voices.`,
    ],
    'traitor-caught': [
      ({ s }) => `${s}. Stood up. Said TRAITOR. And the whole table exhaled like they'd already split the pot. They haven't. But WHAT a moment.`,
      ({ s }) => `Finally! A Traitor at the end of a pointing finger! ${s} played the villain beautifully, and the ending was earned.`,
      ({ s }) => `${s} held that lie for so long and then had to say the word out loud in front of everyone. I have goosebumps and no shame about them.`,
      ({ s }) => `I want ${s}'s reveal framed. The pause. The turn. The word. All of it.`,
      ({ s }) => `They caught ${s}, and I'm thrilled, and I'm also in mourning, because ${s} was the best liar in that castle.`,
      ({ s }) => `The room was RIGHT! Mark the date! And ${s} took it with more grace than any of the people cheering.`,
    ],
    recruited: [
      ({ s }) => `The Traitors made their offer to ${s}, and now there's one night to decide who ${s} really is. That's the show. That's the WHOLE show.`,
      ({ s }) => `${s}, chosen! Invited in! Offered the cloak! Whatever happens next, ${s} will never sit at that table the same way again.`,
      ({ s }) => `I'm on my feet. ${s} gets the offer, and every friend made in that castle is suddenly somebody ${s} might have to lie to.`,
      ({ s }) => `Recruitment is the cruellest thing this game does, and they've done it to ${s}, and I can't look away.`,
      ({ s }) => `Imagine reading that offer with your own name on it. ${s} did. I'd have screamed, and then I'd have said yes.`,
      ({ s }) => `The Traitors want ${s}. Think about the nerve of that. Think about the NERVE.`,
    ],
    'murder-blocked': [
      () => `A Shield! The Traitors made their choice, it didn't land, and everybody walked into breakfast ALIVE.`,
      () => `Every single person came down those stairs this morning and I cheered like it was the last episode.`,
      () => `The Traitors went to all that trouble and got NOTHING. I've rarely enjoyed a wasted night more.`,
      () => `Nobody died, and somehow breakfast was tenser than if somebody had. Everyone counting heads. Everyone suspicious of the relief.`,
      () => `That Shield did its one job at exactly the right moment, and I want a round of applause for whoever won it.`,
      () => `Picture the Traitors at breakfast, watching their target walk in smiling. I can picture it. I've pictured it all morning.`,
    ],
    'mission-won': [
      () => `The pot GREW! And the Traitors cheered along with everyone else, which is the funniest thing I've seen all episode.`,
      () => `A triumph! A proper team effort! And some of that team plans to walk out with every penny of it.`,
      () => `I love a mission that works. Everyone filthy, everyone hugging, and the Traitors hugging hardest.`,
      () => `More money, and not an ounce more safety. They earned it and it protects nobody. Delicious.`,
      () => `That pot is getting heavy, and every Faithful in the castle should be terrified of who ends up carrying it out.`,
      () => `A win for the castle! A win for the pot! And a win, secretly, for the people lying about being on the castle's side!`,
    ],
  },

  // Says the thing.
  blunt: {
    murder: [
      ({ s }) => `${s} got murdered. The Traitors picked well. Somebody should say it.`,
      ({ s }) => `${s} was either a problem for them or no use to them. Either way ${s} is gone.`,
      ({ s }) => `Everyone at breakfast is sad about ${s}. The Traitors are also at breakfast, being sad. Stop falling for it.`,
      ({ s }) => `Stop trying to read a reason into ${s}. Start watching who acts too sorry.`,
      ({ s }) => `${s} didn't go out on bad luck. Somebody in that castle chose ${s}.`,
      ({ s }) => `A murder doesn't need a reason anybody can see. The castle's going to waste a whole day looking for one.`,
    ],
    'faithful-banished': [
      ({ s }) => `They banished a Faithful. ${s} did nothing to deserve it except be easy to point at.`,
      ({ s }) => `${s} was Faithful, and everyone who voted that way owes ${s} an apology they won't give.`,
      ({ s }) => `That table voted on a feeling. ${s} is gone and the Traitors are still sitting there.`,
      ({ s }) => `Being bad at defending yourself isn't the same as being a Traitor. That table can't tell the difference.`,
      ({ s }) => `The Traitors didn't need to lie tonight. The Faithfuls did the work for them.`,
      ({ s }) => `If you voted for ${s}, you helped a Traitor. Sit with that.`,
    ],
    'traitor-caught': [
      ({ s }) => `${s} was a Traitor and they caught ${s}. Good. Do it again.`,
      ({ s }) => `${s} got caught. Don't call it genius. Call it overdue.`,
      ({ s }) => `Nobody celebrate. Any Traitor still in there voted for ${s} as well, and they'll be the ones clapping loudest.`,
      ({ s }) => `${s} lied to everyone's face and lost. No sympathy. That's the job ${s} took.`,
      ({ s }) => `The room got it right once. Now they'll think they're good at this. They aren't.`,
      ({ s }) => `Took them long enough to land on ${s}. Say it.`,
    ],
    recruited: [
      ({ s }) => `The Traitors offered ${s} the cloak. Take it or don't, but decide fast.`,
      ({ s }) => `${s} got recruited. That tells you what the Traitors think of ${s}: useful, and easy to manage.`,
      ({ s }) => `If they're offering, they need somebody. ${s} should ask why it's ${s}.`,
      ({ s }) => `Saying yes means lying to everyone ${s} likes. Saying no could mean nothing, or a murder. Pick.`,
      ({ s }) => `${s} is being handed a dagger and told who to smile at.`,
      ({ s }) => `Everybody wants to be a Traitor until they have to look a friend in the eye. ${s} is about to find out.`,
    ],
    'murder-blocked': [
      () => `The Shield worked. The Traitors wasted their night. Good.`,
      () => `No murder tonight. That doesn't make anybody safer at the Round Table. Stop celebrating.`,
      () => `Somebody won that Shield and it paid off. Credit where it's due.`,
      () => `The Traitors chose a target and it didn't land. Now they choose again, and they'll choose better.`,
      () => `Everyone survived the night. Don't mistake that for anybody being clever.`,
      () => `The Traitors now know their target had the Shield. That's information, and they'll use it.`,
    ],
    'mission-won': [
      () => `They made money. Great. Money doesn't stop a murder.`,
      () => `The pot grew and the Traitors helped. Every Faithful clapping should think about that.`,
      () => `A good mission. It changes nothing at the Round Table.`,
      () => `More money for whoever's standing at the end. The Faithfuls should make sure that's them.`,
      () => `Everyone worked hard. The Traitors worked hard too. They aren't stupid.`,
      () => `A bigger pot is only good news if you finish the job at the Round Table.`,
    ],
  },

  // Builds the case. Uncontracted on purpose.
  formal: {
    murder: [
      ({ s }) => `A murder is a statement of priorities. Removing ${s} means the Traitors judged ${s} more dangerous at the Round Table than useful as cover.`,
      ({ s }) => `I would note that ${s} was murdered rather than left to the Round Table. The Traitors declined a banishment vote they could not control.`,
      ({ s }) => `The castle will now read the murder as a clue. It is only a clue if the Traitors were careless, and nothing so far suggests they were.`,
      ({ s }) => `${s} is removed without a hearing. That is the particular cruelty of a murder: there is no case to answer and no chance to answer it.`,
      ({ s }) => `The relevant question is not who wanted ${s} gone, but who benefits from the castle spending the day asking that question.`,
      ({ s }) => `Consider what the murder takes out of the Round Table: one vote, and whatever suspicions ${s} was carrying into it.`,
    ],
    'faithful-banished': [
      ({ s }) => `The Round Table banished ${s} on the strength of behaviour, not evidence. Those are frequently confused, and tonight the confusion cost a Faithful.`,
      ({ s }) => `${s} was Faithful. The more important finding is who led the case against ${s}, and whether they did so in good faith.`,
      ({ s }) => `Each wrongful banishment does two kinds of damage. It removes a Faithful, and it discredits whoever argued hardest for it.`,
      ({ s }) => `I would resist calling this a Traitor victory. The Faithfuls produced it themselves; the Traitors merely declined to stop it.`,
      ({ s }) => `The reveal gives the castle one verified fact. Used properly, it narrows the field. Used poorly, it produces the next mistake.`,
      ({ s }) => `Suspicion settled on ${s} because of visibility, not guilt. Visibility is a poor proxy.`,
    ],
    'traitor-caught': [
      ({ s }) => `The Round Table has, for once, reasoned correctly. The question now is whether the method can be repeated or whether it was fortunate.`,
      ({ s }) => `${s} was a Traitor. I would examine the votes cast against ${s} with some care; a Traitor voting against a partner is standard practice.`,
      ({ s }) => `A correct banishment is valuable less for its result than for what it confirms about the people who argued for it.`,
      ({ s }) => `Deceptions of this kind rarely fail on a single error. They fail on an accumulation, and ${s} had accumulated enough.`,
      ({ s }) => `The unmasking of ${s} changes the incentives of any remaining Traitor considerably. Expect more caution and more generosity.`,
      ({ s }) => `It would be premature to call the castle competent. One correct verdict is a data point, not a pattern.`,
    ],
    recruited: [
      ({ s }) => `The offer to ${s} is a vote of confidence and a risk assessment at once. The Traitors believe ${s} can say yes and not be caught.`,
      ({ s }) => `Recruitment exposes the Traitors to a person who may refuse. That they chose ${s} regardless suggests considerable confidence.`,
      ({ s }) => `${s} now holds information that cannot be shared without cost. How ${s} behaves at breakfast will be the clearest indication of the answer.`,
      ({ s }) => `I would distinguish between an invitation and an ultimatum. The first is a choice. The second is a threat with a choice attached.`,
      ({ s }) => `Accepting obliges ${s} to deceive every ally ${s} currently has. That cost is usually underestimated at the moment of the offer.`,
      ({ s }) => `The timing is significant. Traitors recruit when their numbers or their cover are under pressure.`,
    ],
    'murder-blocked': [
      () => `The Shield has done precisely what it is for. It protects no one at the Round Table, and I would caution the castle against behaving as if it did.`,
      () => `A failed murder is still informative. The Traitors now know where the Shield was; the Faithfuls know only that it was used.`,
      () => `No one was removed overnight, so the numbers going into the Round Table are unchanged. That favours no one in particular.`,
      () => `The Traitors must now decide whether to try the same target again. Persistence reveals intent, and intent can be read.`,
      () => `I would not describe this as a Faithful victory. It is a delay, purchased with a Shield that is now spent.`,
      () => `The significance lies in the wasted night. The Traitors have one fewer opportunity, and the castle one more morning to think.`,
    ],
    'mission-won': [
      () => `The pot has increased. This benefits a surviving Traitor more than any single Faithful, since a Traitor at the end takes all of it.`,
      () => `A successful mission produces money and nothing else. I would caution against reading cooperation during it as evidence of loyalty.`,
      () => `The Traitors contributed to that result, as they must. Obstructing a mission draws attention; performing well in one costs them nothing.`,
      () => `The larger the pot, the higher the price of every error at the Round Table. That is the real effect of today.`,
      () => `Missions reward coordination, and coordination is not trust. The castle would do well to keep those separate.`,
      () => `The money is shared only if the Faithfuls finish the work. Until then it belongs to no one.`,
    ],
  },

  // Kind first; the read arrives inside the kindness.
  warm: {
    murder: [
      ({ s }) => `I'm so sorry for ${s}. Going in the night means you don't even get to say goodbye properly.`,
      ({ s }) => `I hope the people who liked ${s} say so out loud today. ${s} can't hear it, and it still matters.`,
      ({ s }) => `It's awful watching everyone realise at breakfast. You could see them hoping ${s} was just running late.`,
      ({ s }) => `${s} didn't get a Round Table or a speech. That's the hardest way to leave that game.`,
      ({ s }) => `Somebody at that breakfast is grieving ${s} for real, and somebody is pretending. I'm thinking about the first one.`,
      ({ s }) => `The Traitors went for ${s} because they saw something there. I hope ${s} takes that as a compliment, eventually.`,
    ],
    'faithful-banished': [
      ({ s }) => `${s} was telling the truth the whole time. I hope ${s} knows that counts, even if the table couldn't see it.`,
      ({ s }) => `That reveal broke my heart. ${s} said Faithful and people at the table put their heads in their hands.`,
      ({ s }) => `Everyone who voted for ${s} is going to feel sick tonight. They should be gentle with each other, and they won't be.`,
      ({ s }) => `${s} did nothing wrong. ${s} was just the easiest name to say out loud, and that's a rotten reason to go.`,
      ({ s }) => `It's so hard to prove you're honest in there. ${s} tried, and I believed ${s}, for what that's worth.`,
      ({ s }) => `The Faithfuls are going to turn on each other now, and ${s} would've hated that more than leaving.`,
    ],
    'traitor-caught': [
      ({ s }) => `I know ${s} was a Traitor, and I still felt for ${s} in that moment. Saying it in front of friends is brutal.`,
      ({ s }) => `${s} played the part ${s} was given and played it hard. No shame in getting caught doing it.`,
      ({ s }) => `Look at the people who trusted ${s} most. They're relieved and hurt, and they're allowed to be both.`,
      ({ s }) => `Good for the Faithfuls. They needed that, and they needed to know they could trust their own eyes.`,
      ({ s }) => `${s} hugged a few people on the way out. I hope they hugged back. It's a game.`,
      ({ s }) => `I'm glad they got it right, and I hope nobody's cruel to ${s} about it later.`,
    ],
    recruited: [
      ({ s }) => `Oh, ${s}. That's a heavy thing to be handed at night with nobody to talk to about it.`,
      ({ s }) => `Whatever ${s} decides, I hope ${s} can live with it. That's the only right answer to that offer.`,
      ({ s }) => `The Traitors chose ${s} because people like ${s}. That's the painful part.`,
      ({ s }) => `${s} has friends in that castle, and every one of those friendships just got complicated.`,
      ({ s }) => `I'd be awake all night. I hope ${s} gets some sleep before breakfast.`,
      ({ s }) => `Being asked means the Traitors trust ${s} to keep a secret. I'd rather ${s} was trusted for something nicer.`,
    ],
    'murder-blocked': [
      () => `Everyone came down to breakfast. I actually teared up a bit.`,
      () => `Whoever won that Shield did something good for somebody tonight. That's a lovely thing to have earned.`,
      () => `A night where nobody gets hurt. They don't get many of those in there, so I hope they enjoy it.`,
      () => `You could see the relief at breakfast. Everybody counting heads and smiling when the count came out right.`,
      () => `The Traitors will be frustrated. The rest of them get one more day together, and they've earned it.`,
      () => `It doesn't make anyone safe at the Round Table, I know. It still made my morning.`,
    ],
    'mission-won': [
      () => `They worked together and it paid off. I love seeing them actually be a team for an afternoon.`,
      () => `The pot went up, and for a few minutes nobody was suspicious of anybody. They needed that.`,
      () => `Everyone was cheering for each other. Some of them are lying, sure, but the cheering was real.`,
      () => `I hope the Faithfuls get to share that money. They're working so hard for it.`,
      () => `It didn't buy anybody safety, and they still threw everything at it. That's lovely.`,
      () => `Good mission. You could see a couple of people who'd been having an awful time finally feel useful.`,
    ],
  },

  // Reads everything as a manoeuvre.
  manipulative: {
    murder: [
      ({ s }) => `Lovely choice. ${s} was well liked, so the grief at breakfast gives the Traitors plenty of cover to cry along.`,
      ({ s }) => `The best murders make the castle suspect whoever the Traitors want gone next. Watch who gets looked at over breakfast.`,
      ({ s }) => `The Traitors will now be the kindest people at the table. Kindness the morning after ${s} is doing a lot of work.`,
      ({ s }) => `Never murder your loudest accuser. Murder the person they trust, and let the accuser look unhinged. I suspect that's what ${s} was for.`,
      ({ s }) => `${s} was more useful to the Traitors gone than present. That's not personal, it's scheduling.`,
      ({ s }) => `Now a Traitor gets to say "I'll miss ${s}" to everyone who suspected them. It's the easiest line in the game.`,
    ],
    'faithful-banished': [
      ({ s }) => `The Traitors barely said a word and still got ${s} out. That's the craft: let the Faithfuls feel clever.`,
      ({ s }) => `Watch who comforts the people who led the case against ${s}. That comfort is an investment.`,
      ({ s }) => `${s} was banished by a table of honest people and at least one dishonest one who agreed very reasonably.`,
      ({ s }) => `The trick isn't getting a Faithful banished. It's making sure whoever argued hardest gets blamed for it tomorrow.`,
      ({ s }) => `${s} was Faithful, so the room will doubt itself now. A room that doubts itself is easy to steer.`,
      ({ s }) => `A Traitor voted for ${s} and then looked stricken at the reveal. Stricken is very convincing if you've practised.`,
    ],
    'traitor-caught': [
      ({ s }) => `The Traitors who last are the ones who let people find them slightly irritating. Being liked is exposure, and ${s} had plenty of it.`,
      ({ s }) => `If there's a Traitor still in there, voting against ${s} was the cheapest trust they'll ever buy.`,
      ({ s }) => `The defence is where most Traitors lose it. Too tidy, and the table hears a script.`,
      ({ s }) => `Whoever pointed at ${s} first has just earned a fortune in credibility. Watch how they spend it.`,
      ({ s }) => `${s} lost the moment people stopped asking for opinions and started asking about ${s}.`,
      ({ s }) => `Losing a partner is sad. Being seen to lose a partner, and grieving correctly, is useful.`,
    ],
    recruited: [
      ({ s }) => `Offering ${s} the cloak flatters and binds in the same move. I'd say yes graciously and remember who asked.`,
      ({ s }) => `The clever recruit says yes and becomes the most visibly loyal Faithful in the castle. ${s} should be louder than ever at the Round Table.`,
      ({ s }) => `Nobody recruits somebody they can't manage. ${s} should find that insulting and make use of it.`,
      ({ s }) => `An ultimatum is honest, at least. A note is flattery, and flattery is the one to worry about.`,
      ({ s }) => `${s} now knows who some of the Traitors are. That's leverage, for anybody patient enough to sit on it.`,
      ({ s }) => `If I were ${s} I'd take my time answering. The Traitors need the answer more than ${s} needs to give it.`,
    ],
    'murder-blocked': [
      () => `A blocked murder is a gift to the Traitors if they play it right. Everyone relaxes, and relaxed people talk.`,
      () => `Whoever won the Shield will get thanked all day. Being thanked is lovely. Being noticed isn't.`,
      () => `The Traitors should be the most relieved people at breakfast. Nobody suspects whoever is happiest that nobody died.`,
      () => `The Traitors know exactly where that Shield was now. It cost them a night and told them a lot.`,
      () => `No murder means no clue, and the castle loves a clue. Today they've nothing to study except each other.`,
      () => `A failed night looks like a setback. Handled well, it's the most innocent-looking morning the Traitors will get.`,
    ],
    'mission-won': [
      () => `A Traitor should always shine in a mission. Nobody banishes the person who just made them money.`,
      () => `Gratitude is the cheapest cover there is, and a good mission hands it to everyone.`,
      () => `A bigger pot makes the Faithfuls desperate to be right. Desperate people are easy to guide.`,
      () => `Notice who took the credit and who gave it away. Giving it away is the stronger move.`,
      () => `A Traitor who works hard on a mission is investing in a pot they intend to keep.`,
      () => `The pot grew and nobody is safer for it. Lovely. Now everyone's a little more frightened of losing it.`,
    ],
  },

  // Hedges, apologises, is usually right.
  nervous: {
    murder: [
      ({ s }) => `Oh no, not ${s}. I don't — sorry, I just liked ${s}. Is that allowed to be the whole take?`,
      ({ s }) => `I was terrified coming down to breakfast every morning, and the mornings somebody else was missing I still felt sick. Poor ${s}.`,
      ({ s }) => `Is it bad that I thought it'd be ${s}? I didn't say anything. I never say anything.`,
      ({ s }) => `Sorry — the Traitors sat there at breakfast looking worried about ${s}. How do they do that? I couldn't do that.`,
      ({ s }) => `Everyone's going to start guessing why ${s}, and I think — I think they'll guess wrong. Sorry.`,
      ({ s }) => `${s} didn't even get to say goodbye. That's the bit that gets me, honestly.`,
    ],
    'faithful-banished': [
      ({ s }) => `Oh, that's awful. ${s} was Faithful. I kept whispering it at the screen, which helped nobody.`,
      ({ s }) => `I feel sick. I'd probably have voted for ${s} too, which is worse.`,
      ({ s }) => `Sorry, can I say — looking nervous isn't the same as being guilty. I'd have been banished the first night.`,
      ({ s }) => `Everyone who pointed at ${s} is going to lie awake. I would. I'd lie awake for a month.`,
      ({ s }) => `And the Traitors just... voted with them. And looked sad. I can't. Sorry, I can't.`,
      ({ s }) => `Is it me, or had that table decided before ${s} even spoke? That's frightening, actually.`,
    ],
    'traitor-caught': [
      ({ s }) => `Oh, thank goodness. Sorry — well played ${s}, I suppose, but thank goodness.`,
      ({ s }) => `I didn't think they'd get ${s}. I thought ${s} was too good at it. I'm relieved and still a bit scared.`,
      ({ s }) => `The reveal made me jump. Out loud. I don't know why, I already knew.`,
      ({ s }) => `I'd have cracked so much sooner. I don't know how ${s} held it together right up to the reveal.`,
      ({ s }) => `Sorry — is it awful I felt bad for ${s}? A bit? It's a lot, saying that word in front of everyone.`,
      ({ s }) => `They got one right and now they'll trust their instincts, and I'm worried about that too.`,
    ],
    recruited: [
      ({ s }) => `Oh, I'd hate that. ${s} gets the offer and has to act normal tomorrow. I couldn't act normal.`,
      ({ s }) => `Sorry, I'm stressed on ${s}'s behalf. What do you even say? Yes? No? What if no is wrong?`,
      ({ s }) => `I'd say yes out of panic and regret it immediately. I hope ${s} is calmer than me. Anyone is.`,
      ({ s }) => `If it's an ultimatum, it isn't really a choice, is it. Sorry. I'm just saying.`,
      ({ s }) => `${s} has to look friends in the eye at breakfast and I think — I think that's the hardest part of the whole game.`,
      ({ s }) => `Is it flattering? It's a bit flattering. Mostly it's horrible. Poor ${s}.`,
    ],
    'murder-blocked': [
      () => `Everyone's alive! Sorry, I know it doesn't help anyone at the Round Table, I just got very relieved.`,
      () => `I was counting them at breakfast. Out loud. The number was right and I nearly cried.`,
      () => `The Shield worked and I don't trust it. Something worse is coming. Sorry, that's just how I am.`,
      () => `The Traitors will just try again tonight, won't they. Of course they will. Sorry.`,
      () => `I'd have been so scared coming down those stairs and then — nothing. Everyone's there. I wouldn't know what to do with that.`,
      () => `Good. Good! Okay. I'm still worried, but good.`,
    ],
    'mission-won': [
      () => `Oh good, they did it. Sorry, I get so tense watching missions. I was useless in mine.`,
      () => `More money is nice, isn't it. It doesn't stop anyone being banished, though, which is what I'd be thinking about.`,
      () => `I kept watching the Traitors being really helpful and it made me nervous. Is that paranoid? It's a bit paranoid.`,
      () => `Everyone was so happy and I just thought: somebody at that table is going to lose all of it. Sorry.`,
      () => `I'm pleased. I'm also working out who keeps it, which isn't a nice feeling.`,
      () => `They worked really well together. I hope that lasts. It won't. Sorry.`,
    ],
  },

  // Mid-thought, loud, punctuation optional.
  excitable: {
    murder: [
      ({ s }) => `NOT ${s}. not ${s}!! i had them going all the way, i had a whole plan`,
      ({ s }) => `the moment they realised ${s} wasn't coming down to breakfast i screamed and the dog left the room`,
      ({ s }) => `who did this. WHO. oh wait i know who. i know EXACTLY who and they're pouring juice`,
      ({ s }) => `the traitors walked in looking SO worried about ${s} and i'm yelling at my tv like it can hear me`,
      ({ s }) => `okay ${s} is gone and i'm not okay and the castle has NO idea and i need to talk about it`,
      ({ s }) => `murdered!! in the NIGHT!! ${s} deserved a whole round table fight and just never came down`,
    ],
    'faithful-banished': [
      ({ s }) => `FAITHFUL. ${s} WAS FAITHFUL. i am screaming into a cushion`,
      ({ s }) => `the faces when ${s} said it. the FACES. every single one of them. i've rewound it twice`,
      ({ s }) => `i KNEW ${s} was faithful and nobody in that castle listened to me, obviously, because i'm not there`,
      ({ s }) => `and the traitors voted with them and did the sad face?? the SAD FACE??`,
      ({ s }) => `this show is so cruel and i love it and i'm furious about ${s}, all at once, constantly`,
      ({ s }) => `okay who led that case against ${s}, because i need to be angry at them specifically`,
    ],
    'traitor-caught': [
      ({ s }) => `THEY GOT ONE. they actually got one!! ${s} said traitor and i fell off the sofa`,
      ({ s }) => `${s} was SO good though. so good. i'm sad and i'm thrilled, don't make me pick`,
      ({ s }) => `the pause before ${s} said it!! i stopped breathing!! i'm still not breathing!!`,
      ({ s }) => `finally the round table does something right, i've been waiting ALL SEASON for this`,
      ({ s }) => `okay but if there's another traitor in there they are PANICKING about ${s} and i need to see it`,
      ({ s }) => `everybody screenshot this, the castle finally caught up with what we've known about ${s} forever`,
    ],
    recruited: [
      ({ s }) => `they offered ${s} the cloak?? ${s}??? oh this is going to be SO good`,
      ({ s }) => `say yes ${s}. no, say no. no, SAY YES. i can't decide and it isn't even my choice`,
      ({ s }) => `${s} reading that offer, i need that on a loop, i need it forever`,
      ({ s }) => `okay if ${s} says yes then breakfast tomorrow is going to be the best breakfast in television history`,
      ({ s }) => `recruitment episode!! RECRUITMENT EPISODE!! and it's ${s}!! don't talk to me`,
      ({ s }) => `the traitors picking ${s} is either genius or a disaster and i'm excited either way`,
    ],
    'murder-blocked': [
      () => `NOBODY DIED. the shield WORKED. i am jumping up and down in my kitchen`,
      () => `everyone walked in!! all of them!! the traitors had to act happy about it and i loved every second`,
      () => `the shield!! the SHIELD!! best thing a mission has ever handed anybody`,
      () => `okay so the traitors wasted a whole night and now they're furious and hiding it and i can SEE it`,
      () => `i was so ready to be sad at breakfast and then nobody was missing?? what a morning`,
      () => `a full breakfast table!! the paranoia is going to be UNREAL tonight`,
    ],
    'mission-won': [
      () => `THE POT WENT UP. everybody screaming and hugging and i'm hugging my cushion`,
      () => `the traitors cheering for money they want to steal is my favourite thing on television`,
      () => `great mission but it doesn't make anyone safe so everyone calm down. i'm not calm. but everyone else`,
      () => `more money!! more stakes!! more reasons to lie!! i love this game`,
      () => `they actually worked together?? for a whole afternoon?? who are these people`,
      () => `every time the pot grows i get more stressed about who walks out with it and i LOVE it`,
    ],
  },

  // Every moment is about their own season. Uncontracted: performing.
  boastful: {
    murder: [
      ({ s }) => `When I played, the Traitors spent every night deciding not to come for me. ${s} did not have that problem.`,
      ({ s }) => `I could have told ${s} this was coming. I read those breakfasts better than anybody who has ever sat at them.`,
      ({ s }) => `${s} was murdered. I was never murdered. People forget that, and I would like them to stop forgetting it.`,
      ({ s }) => `I would have walked into that breakfast and named the Traitors by lunch. That is not a boast. That is my record.`,
      ({ s }) => `Sad for ${s}. I sat at that table while other people were taken, and I kept my nerve far better than this lot.`,
      ({ s }) => `${s} should have studied how I played. It is all on tape.`,
    ],
    'faithful-banished': [
      ({ s }) => `I was accused at that table and talked my way out of it. ${s} could not. That is a skill, and it is mine.`,
      ({ s }) => `A Faithful banished on nerves. I never once pointed at a Faithful. I would like that written down.`,
      ({ s }) => `The table got ${s} wrong. I would have got it right. I usually did.`,
      ({ s }) => `${s} made a poor defence. Mine are still studied.`,
      ({ s }) => `This is what happens when nobody in the room has instincts. I had instincts. I still do.`,
      ({ s }) => `I feel for ${s}. Not deeply, because I would never have been in that position, but I feel for ${s}.`,
    ],
    'traitor-caught': [
      ({ s }) => `Good. Caught. I would have caught ${s} much sooner, and I say that with complete accuracy.`,
      ({ s }) => `${s} was a decent Traitor. Not a great one. The great ones are not caught, and I would know.`,
      ({ s }) => `The reveal was well performed. Mine was better, and people still bring it up.`,
      ({ s }) => `The castle has finally done what I was doing from the very start of my season.`,
      ({ s }) => `I respect ${s} for lasting as long as ${s} did. It is not as long as I would have lasted.`,
      ({ s }) => `They caught one, and now they all think they are detectives. There is one detective in this chat.`,
    ],
    recruited: [
      ({ s }) => `They offered ${s} the cloak. They offered it to me as well, and I made them regret asking.`,
      ({ s }) => `Recruitment is a compliment. I received it, naturally. ${s} should enjoy the feeling while it lasts.`,
      ({ s }) => `Most people say yes. I did not, and I was still there at the end, and that is the story people tell.`,
      ({ s }) => `I would have taken the cloak and been running the Traitors inside a day. ${s} will be lucky to run a breakfast.`,
      ({ s }) => `The Traitors choose the people they fear or the people they need. They chose me for both reasons.`,
      ({ s }) => `${s} is being tested. I passed that test with a straight face and a full night of sleep.`,
    ],
    'murder-blocked': [
      () => `A Shield saved somebody. I never needed a Shield. I had a reputation.`,
      () => `I won a Shield once and did not even need it. That is a true story and I tell it often.`,
      () => `The Traitors wasted a night. In my castle they did not waste nights, because I was making their nights difficult.`,
      () => `A blocked murder. Very nice. It will not change much, and I say that as somebody who changed a great deal.`,
      () => `Everyone survived. I survived every night of my season without any help at all.`,
      () => `Somebody earned that Shield. Good. I earned more than one.`,
    ],
    'mission-won': [
      () => `A decent mission. I would have added more to that pot, and I did, every time.`,
      () => `The pot grew. When I played, it grew mostly because of me, and everyone at that table knew it.`,
      () => `Missions are easy. The Round Table is hard. I was excellent at both, which is rare.`,
      () => `They are all very pleased with themselves. They should see the footage of my missions.`,
      () => `A good result. Not the best result. The best result was mine.`,
      () => `Money does not keep anybody safe. I knew that, and I made the money anyway, and I made more of it.`,
    ],
  },

  // Praise delivered as an autopsy. Full forms are the joke.
  sarcastic: {
    murder: [
      ({ s }) => `The Traitors murdered ${s}, and breakfast is shocked, which is a brave reaction to the premise of the show.`,
      ({ s }) => `A stunning development: the people whose whole job is murdering Faithfuls have murdered a Faithful.`,
      ({ s }) => `And now the Traitors are the most upset people at the table. Devastated. You can tell by how well they are eating.`,
      ({ s }) => `${s} was a lovely person, and now ${s} is a lovely memory. Very moving. Next.`,
      ({ s }) => `Everybody will spend the day searching for meaning in the choice of ${s}. Good luck with that.`,
      ({ s }) => `Wonderful. A murder, a breakfast, and a castle full of detectives who have not detected anything.`,
    ],
    'faithful-banished': [
      ({ s }) => `A triumph of deduction. Everyone was very sure about ${s}, and everyone was wrong, which is at least efficient.`,
      ({ s }) => `${s} was Faithful. Who could possibly have predicted that the loudest accusation would be the wrong one.`,
      ({ s }) => `The Traitors must be exhausted from all the work the Faithfuls did for them tonight.`,
      ({ s }) => `Beautiful reasoning at that table. It led straight to the wrong person, but with such confidence.`,
      ({ s }) => `And now the apologies, which will do a great deal for ${s}, who is gone.`,
      ({ s }) => `A thrilling Round Table, if your idea of thrilling is watching a room hand the Traitors a free night.`,
    ],
    'traitor-caught': [
      ({ s }) => `They caught a Traitor. Everybody take a moment. It may not happen again for some time.`,
      ({ s }) => `${s} is unmasked, and the table is congratulating itself as though it has always been this good at it.`,
      ({ s }) => `A genuine Traitor at the end of a genuine accusation. I am almost moved.`,
      ({ s }) => `${s} played it perfectly, apart from the ending.`,
      ({ s }) => `The detectives have solved one case. I look forward to hearing about it at every meal for the rest of the season.`,
      ({ s }) => `Any Traitor still at that table voted against ${s} with deeply sincere disappointment, I am sure.`,
    ],
    recruited: [
      ({ s }) => `The Traitors have offered ${s} the cloak. What a flattering way to be asked to lie to everyone you know.`,
      ({ s }) => `${s} has been recruited, which is a great honour, in the sense that it is not one.`,
      ({ s }) => `If it is the ultimatum, ${s} has a completely free choice between yes and yes.`,
      ({ s }) => `Oh good, another person at breakfast pretending to be surprised by things. The castle was running low.`,
      ({ s }) => `If ${s} says yes, ${s} gets to keep hunting Traitors from a wonderful new vantage point.`,
      ({ s }) => `An invitation for ${s} to betray every friend in the building. Very thoughtful of them.`,
    ],
    'murder-blocked': [
      () => `Nobody was murdered. The Traitors went to all that effort and the Shield blocked it. Heartbreaking, for them.`,
      () => `A full breakfast table. The Traitors are thrilled. You can see it in their smiles, which are very convincing.`,
      () => `Everyone survived the night, so naturally the castle has decided this means something profound.`,
      () => `A Shield worked exactly as described. Mark the occasion.`,
      () => `A relaxing morning for everybody except the people who chose a target. My sympathies to them. None.`,
      () => `No murder, which means no new clues, which means they will invent some. Wonderful.`,
    ],
    'mission-won': [
      () => `The pot has grown, and everyone is delighted, especially the people planning to take all of it.`,
      () => `A superb mission. Nobody is any safer, but the money looks lovely.`,
      () => `Such teamwork. The Traitors in particular gave it their absolute all, as any loyal Faithful would.`,
      () => `Congratulations on raising funds for whoever is least trustworthy at the end.`,
      () => `A heartwarming display of cooperation between people who will be accusing each other by dinner.`,
      () => `More money. I am sure that will make the Round Table calmer.`,
    ],
  },

  // Short. Flat. No cushion.
  streetwise: {
    murder: [
      ({ s }) => `${s} got murdered. Happens. Breakfast goes on.`,
      ({ s }) => `They took ${s} in the night. No warning, no speech. That's the deal.`,
      ({ s }) => `${s} was in somebody's way. Now ${s} isn't.`,
      ({ s }) => `Whoever did ${s} is sat at breakfast. Watch hands, not faces.`,
      ({ s }) => `Don't get sad about ${s}. Get suspicious.`,
      ({ s }) => `${s} is out. Somebody at that table's lying about how they feel. Find them.`,
    ],
    'faithful-banished': [
      ({ s }) => `${s} was Faithful. Table got it wrong. Traitors didn't lift a hand.`,
      ({ s }) => `Wrong call. ${s} pays for it. That's how it works in there.`,
      ({ s }) => `Easy target. Wrong target. ${s} is gone either way.`,
      ({ s }) => `Somebody sold that table a story about ${s}. Remember who.`,
      ({ s }) => `Faithful. Out. Next.`,
      ({ s }) => `The Traitors sat back and let them do it. Smart.`,
    ],
    'traitor-caught': [
      ({ s }) => `${s} got caught. Took them long enough.`,
      ({ s }) => `Traitor. Out. Good.`,
      ({ s }) => `${s} played it hard and lost. No complaints. That's the job.`,
      ({ s }) => `Got ${s}. Don't party. Keep counting.`,
      ({ s }) => `${s} had a good run. It ends at a table for most of them.`,
      ({ s }) => `Got one right. Do it again before they get comfortable.`,
    ],
    recruited: [
      ({ s }) => `${s} got the offer. Yes or no. Nobody's coming to help.`,
      ({ s }) => `They want ${s} in. Means they need somebody. Ask why.`,
      ({ s }) => `Take the cloak, ${s} lies every day. Don't, and watch your back.`,
      ({ s }) => `${s} is on the clock. Decide and don't look back.`,
      ({ s }) => `An offer like that isn't friendship. It's business.`,
      ({ s }) => `If it's the ultimatum there's no choice. Just a face to keep straight.`,
    ],
    'murder-blocked': [
      () => `Shield worked. Nobody out. Traitors wasted the night.`,
      () => `Everybody's at breakfast. Don't relax. They go again tonight.`,
      () => `Good save. It's one night. That's all it buys.`,
      () => `Traitors swung and missed. Next swing's harder.`,
      () => `No murder. Still a Round Table. Nothing's different.`,
      () => `Somebody earned that Shield. Earned. Nobody handed it over.`,
    ],
    'mission-won': [
      () => `Pot's bigger. Nobody's safer. Move.`,
      () => `Good work. Money doesn't cover you at the table.`,
      () => `Traitors worked just as hard. Course they did. They think it's their money.`,
      () => `Nice. Now go find who's planning to take it.`,
      () => `They cheered. Fine. Cheering doesn't catch anyone.`,
      () => `More money, more reason to lie. Watch it.`,
    ],
  },

  // Oblique, unhurried, occasionally right.
  mystical: {
    murder: [
      ({ s }) => `Some people feel it coming before they could ever say why. I wonder if ${s} did.`,
      ({ s }) => `People came down the stairs slowly this morning. They knew something before anyone said ${s}.`,
      ({ s }) => `The Traitors chose ${s} for a reason they may not fully understand themselves.`,
      ({ s }) => `${s} is gone, and the people who grieve loudest are not always the ones who feel it.`,
      ({ s }) => `There's a stillness after a murder that isn't grief. It's everyone checking who they're sitting beside.`,
      ({ s }) => `${s} will be fine. The ones left have to keep sitting across from whoever did it.`,
    ],
    'faithful-banished': [
      ({ s }) => `${s} was telling the truth, and the room couldn't hear it. A room that has already decided never can.`,
      ({ s }) => `The table wanted an answer more than the right one. ${s} was the nearest answer.`,
      ({ s }) => `People had been drifting away from ${s} for days. Tonight they finished.`,
      ({ s }) => `The Traitors didn't need to push. A frightened room picks the nearest name.`,
      ({ s }) => `There's guilt in that castle tonight, and none of it belongs to the Traitors.`,
      ({ s }) => `${s} said Faithful very calmly. People telling the truth often do.`,
    ],
    'traitor-caught': [
      ({ s }) => `${s} looked almost relieved saying the word. Lying for that long costs something.`,
      ({ s }) => `The room was right about ${s}, and I don't think it knows why. That's usually how right happens in there.`,
      ({ s }) => `${s} was found out by people who felt it rather than proved it.`,
      ({ s }) => `There's a different quiet after a Traitor goes. Less fear. More doubt about each other.`,
      ({ s }) => `Whoever sat closest to ${s} will be looking at everyone differently now.`,
      ({ s }) => `${s} knew it was over before the last vote was said aloud. People always know.`,
    ],
    recruited: [
      ({ s }) => `${s} has been chosen, and being chosen changes a person whether they say yes or no.`,
      ({ s }) => `The Traitors saw something in ${s}. ${s} may not like finding out what.`,
      ({ s }) => `Tomorrow ${s} will sit at breakfast carrying something nobody else can see.`,
      ({ s }) => `Some people take the cloak and sleep soundly. Some take it and can't. ${s} will learn which.`,
      ({ s }) => `There's no right answer to that offer. There's only the one ${s} can live with.`,
      ({ s }) => `The people closest to ${s} will notice a change before they can name it.`,
    ],
    'murder-blocked': [
      () => `Nobody was taken. There was a strange lightness at breakfast, and nobody trusted it.`,
      () => `The Traitors chose, the Shield held, and the night passed without anyone leaving.`,
      () => `Relief like that makes people careless. Watch what gets said over lunch.`,
      () => `Everyone survived, and a few of them feel they were meant to. They weren't. It was a Shield.`,
      () => `A night without a murder unsettles people more than one with. They don't know where to put the fear.`,
      () => `The Traitors will carry that failure into the Round Table. It'll show, to anyone looking.`,
    ],
    'mission-won': [
      () => `For an afternoon they moved together. It won't last, and it was real while it did.`,
      () => `The pot grew. Everything said at the Round Table weighs more now.`,
      () => `Everyone was laughing, the Traitors included. Nobody in there can tell whose laughter is real.`,
      () => `Money doesn't protect anyone in that castle. I think the quiet ones already understand that.`,
      () => `Working together brings people closer for a little while. Then they have to vote.`,
      () => `The ones who worked hardest aren't always the ones who want the pot most.`,
    ],
  },
};
