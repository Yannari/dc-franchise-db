// js/social/packs/traitors-words.js
// The Traitors' own game topics for the feed.
//
// DATA ONLY. The shared library in js/social/phrasings.js was written for shows
// that vote people out of a camp or a house; this pack is what the castle talks
// about instead. Same shape: PHRASINGS[topicId][shape][stream] -> string[].
//
// THE AUDIENCE KNOWS WHO THE TRAITORS ARE. The castle does not. Almost every
// line here lives in that gap.
//
// Slots: {subject} {actor} {season} {episode} {receipt}. A template naming a
// slot is only drawn when the event carries it, so every slotless line has to
// be true for every trigger of its topic.
//
// Correctness rules the lines keep: nobody votes for a winner; a murder is not
// a vote; missions never buy safety; a Shield stops one murder and never a
// banishment; no pot figure or vote count is claimed outside {receipt}.

export const PHRASINGS = {

  // ── the night ───────────────────────────────────────────────────────────
  //
  // subject = the murdered player. No actor: the turret has no face.
  'murder-reaction': {
    'live-reaction': {
      timeline: [
        'NOT {subject} 😭',
        'they killed off {subject} and i have to go to work tomorrow',
        'the traitors looked at everyone left and picked {subject}. heartless',
        'another faithful gone and the castle is none the wiser',
        'i hate this part every single time',
        'murdered. just like that',
        'one less faithful at the table and the traitors get to act sad about it',
        'watching the traitors pretend to be shocked is the worst part of the whole show',
      ],
      chat: [
        'I did not want that one. {subject} was one of the few people in there worth rooting for.',
        'Every murder does the same thing to me. You count the faces the next morning and feel it in your stomach.',
        'The worst part is watching the Traitors grieve on camera. They are very good at it.',
        'A murder is the one exit in this game you cannot talk your way out of, and that is exactly why it stings.',
        'Nobody in that castle did anything to lose {subject}. That is what makes it cruel.',
        'I have left a game without getting a word in. It is worse than losing a vote, and I say that having done both.',
        'The castle is going to spend tomorrow guessing why, and not one of them will guess right.',
        'Another Faithful gone, and the people who did it will be the first to offer a hug in the morning.',
      ],
    },
    'hot-take': {
      timeline: [
        'taking {subject} was the right call for the traitors and i hate that it was',
        'the traitors got rid of {subject} before {subject} got loud. smart and evil',
        'a murder is the only move the traitors make where nobody sees their face',
        'kill the threats early, keep the easy faithfuls for the table. textbook',
        'murder the ones the table trusts, keep the paranoid ones. that is the whole traitor playbook',
        'if i was in that turret {subject} goes first too. sorry',
        'every murder is also a message and the castle never reads it',
        'the traitors do not murder the smartest faithful. they murder the one who would be hardest to banish',
      ],
      chat: [
        'From the Traitors\' side that was correct. {subject} was never going to be banished, so the only way out was a murder.',
        'The smart murder is never the obvious threat. It is the person the table would never have sent home.',
        'Every murder tells you what the Traitors are scared of. Look at who has gone overnight and the picture is clear.',
        'I would have kept {subject} alive and let the table do the work. A murder points at nobody, and pointing at somebody is useful.',
        'The castle treats a murder as bad luck. It is the most deliberate thing that happens in there all week.',
        'People underrate how much a murder shapes the next table. The Faithfuls spend the day guessing why, and guessing is how they turn on each other.',
        'If you are a Traitor you want the survivors to feel safe. Taking {subject} does the opposite, and I am not sure that was thought through.',
        'A murder is not a vote. Nobody had to explain themselves, and that is exactly the advantage.',
      ],
    },
    sympathy: {
      timeline: [
        '{subject} deserved so much more than this',
        'justice for {subject} who never even got a say',
        'rest easy {subject} 💔',
        'the faithfuls never get a goodbye and it breaks me every time',
        'no table no speech no fight. just gone',
        'the ones who get murdered never get to fight for it and that is so unfair',
        'honest faithful gone. this game is cruel',
        'i just want one faithful to make it to the end without the traitors coming for them',
      ],
      chat: [
        'I feel for {subject}. You come in hoping to be the one who spots them, and you leave without ever being given the chance.',
        'There is no fair way to lose this game, but a murder is the least fair. You do not get a table and you do not get a word in.',
        'I hope {subject} knows how many people at home were shouting the Traitors\' names at the screen for them.',
        'Being murdered is a compliment in this game, and it is still a rotten way to go.',
        'Nobody who gets murdered did anything wrong. That is the hardest part to explain to people who have not played.',
        'The Faithfuls who go this way are the ones I think about after a season ends.',
        'Every murdered Faithful leaves without knowing who did it. We knew, and that is hard to sit with.',
      ],
    },
  },

  // ── the wrong read ──────────────────────────────────────────────────────
  //
  // subject = the banished Faithful. actor = a Traitor who voted for them.
  'wrong-read': {
    'live-reaction': {
      timeline: [
        'THEY BANISHED {subject}. A FAITHFUL. again',
        'no no no {subject} was faithful and the traitor voted with the crowd',
        '{actor} voting for {subject} with a straight face. i am sick',
        'faithful. of course faithful. the traitor is sitting RIGHT THERE',
        'the reveal said faithful and the room went silent. deserved',
        'another faithful banished on nothing',
        'i am yelling at my tv and the castle cannot hear me',
        'the traitors did not have to lift a finger tonight',
      ],
      chat: [
        'That is a Faithful banished on vibes, and the Traitors got to vote with the room without saying a word.',
        'Watching {subject} say Faithful to a table that had just done that was hard to sit through.',
        '{actor} put a vote on {subject} and then looked devastated at the reveal. It was a great performance and I hated it.',
        'The castle did the Traitors\' work for them tonight.',
        'Every time the room banishes a Faithful, the Traitors get a free night. That is the maths nobody at that table is doing.',
        'I have been the person a room turned on for no reason, and the look at that reveal is exactly how it feels.',
        'That table had one job and did the opposite, loudly and with total confidence.',
        'The reveal is the worst moment of the night for everyone except the Traitors.',
      ],
    },
    'hot-take': {
      timeline: [
        'banishing {subject} is the worst read this castle has made all season',
        'the case against {subject} was they seemed nervous. EVERYONE is nervous',
        'the faithfuls keep banishing their own and blaming the traitors for being good',
        'this castle cannot spot a traitor to save its life',
        'if you banish on vibes you deserve the reveal you get',
        '{actor} did not even have to push. the faithfuls handed it over',
        'quiet does not mean traitor. how many faithfuls have to go before they learn',
        'every faithful banished is a night off for the turret',
      ],
      chat: [
        'The Faithfuls are treating nerves as evidence, and {subject} paid for it.',
        'I understand the read on {subject}. I do not understand nobody asking a second question before they voted.',
        'Banishing a Faithful is not just a wasted night. It shows the Traitors exactly how easily the table can be moved.',
        'The table keeps looking for someone acting strange. The Traitors are the ones acting completely normal.',
        'This is what happens when the loudest accusation wins the room. It is almost never the right one.',
        '{actor} voting with the majority on {subject} was the safest thing a Traitor could do, and the table will not look at it twice.',
        'I would rather see a table split and wrong than unanimous and wrong. Unanimous and wrong means nobody is thinking.',
        'Wrong reads are part of the game. Wrong reads with total certainty are the part that loses it.',
      ],
    },
    'thread-opener': {
      timeline: [
        'thread on how the castle talked itself into banishing {subject}',
        'ok walking through every wrong read that got a faithful banished tonight',
        'a short list of the people who should be embarrassed about that table',
        'let me show you where the table went wrong because the castle will not',
        'thread: every clue that pointed at the actual traitors while they banished a faithful',
        'breaking down {actor} at that table because nobody in the castle noticed a thing',
        'saying this once. the traitors did not win that table. the faithfuls lost it',
      ],
      chat: [
        'I want to go through that table properly, because the case against {subject} fell apart the moment you looked at it.',
        'Let me lay out how that table got there, because it did not happen at the table. It was built over the whole day.',
        'Long one. There were moments before that vote where one Faithful could have turned the room, and nobody took them.',
        'Before anyone defends that read, let us go through who started it and who just followed.',
        'I want to talk about {actor}\'s vote on {subject}, because it was the quietest and smartest thing anyone did at that table.',
        'Pull up a chair. The Traitors barely had to speak tonight, and that is the story.',
        'I want to separate the reasoning from the result. The result was a Faithful gone, and the reasoning was worse.',
      ],
    },
  },

  // ── hiding in plain sight ───────────────────────────────────────────────
  //
  // actor = a Traitor involved. subject = the accused or banished player, who
  // may be either role, so no line says what the subject is.
  'traitor-hiding': {
    'call-out': {
      timeline: [
        'the traitor is RIGHT THERE 😭',
        '{actor} is lying to your face and you are thanking them for it',
        'everyone is staring at {subject} and nobody is looking at {actor}',
        'how is nobody asking {actor} a single question',
        'the castle keeps looking everywhere except at the traitors',
        'i cannot believe the traitors are getting away with this in broad daylight',
        'the traitors are not even hiding well. the castle is just not looking',
        'somebody at that table please just ask the obvious question',
      ],
      chat: [
        'I will say it plainly: {actor} is the best liar in that castle and nobody is close to catching it.',
        'The table spent the whole night on {subject} and not one minute on {actor}. That is the problem.',
        'The Traitors are not doing anything clever right now. The Faithfuls are just looking in the wrong direction.',
        'Every time someone says they have a gut feeling, a Traitor relaxes.',
        'I would love one Faithful to ask {actor} a follow-up question. Just one.',
        'The Traitors are hiding behind the loudest accusations in the room, and the room keeps making them louder.',
        'Watching them sit there nodding along is the hardest part of this show.',
        'Nobody at that table is tracking who votes with the crowd every single time. That is where they are.',
      ],
    },
    'live-reaction': {
      timeline: [
        '{actor} nodding along like they are not the problem. I CANNOT',
        'the traitors sitting there calm while the castle eats itself',
        'the way {actor} just agreed with everyone. chilling',
        'screaming at the tv again. it is THEM',
        'all eyes on {subject} and {actor} did not even flinch',
        'the faithfuls have no idea and it is killing me',
        'nobody in that castle has a clue and i have to sit here and watch',
        'every time they look away from the traitors i lose a year of my life',
      ],
      chat: [
        '{actor} barely said a word through all of that and came out of it with nobody looking their way.',
        'I keep waiting for somebody to notice. Nobody is going to notice.',
        'The Traitors are sitting through this completely untouched, and acting worried about it.',
        'That calm is the tell, and the castle is reading it as innocence.',
        'Every conversation in that room went straight past the Traitors, and nobody stopped to wonder why.',
        'Watch {actor} while everyone is talking about {subject}. Not a flicker.',
        'This is the part of the show I find hardest. We can see it and they cannot.',
      ],
    },
  },

  // ── caught ──────────────────────────────────────────────────────────────
  //
  // subject = the Traitor just banished and revealed.
  unmasked: {
    'live-reaction': {
      timeline: [
        'TRAITOR. FINALLY',
        'THEY GOT {subject}. i am on my feet',
        '{subject} saying traitor out loud and the whole table gasping. perfect tv',
        'caught. CAUGHT. the faithfuls actually did it',
        'the reveal i have been waiting for',
        'the faces at that table when it said traitor',
        'ok the castle finally got one right',
        'not {subject} trying to stay calm through that reveal 😭',
      ],
      chat: [
        'That is the table getting one right, and you could hear the relief.',
        '{subject} held it together until the word came out, and then you saw the whole game drop off their face.',
        'The best part is everybody at that table replaying every conversation they had, all at once.',
        'Finally. The Faithfuls needed that more than they needed the money.',
        'Watch the people who sat next to {subject} all week. They are replaying every word.',
        'A caught Traitor changes the whole castle overnight. Everybody feels clever, which is its own problem.',
        'I have never seen a table so relieved to be right.',
        'That reveal is the reason people watch this show.',
      ],
    },
    gloating: {
      timeline: [
        'bye {subject} 👋',
        'enjoy the walk out {subject}',
        'all that acting and it was you the whole time',
        'caught lying. no notes',
        'the traitor act is over and i am thriving',
        '{subject} really thought they had that table. lmao',
        'one down. keep going faithfuls',
        'the audience knew from episode one and we are LOUD about it',
      ],
      chat: [
        'I will be gracious about {subject} tomorrow. Tonight I am enjoying it.',
        'Every lie comes due eventually, and that one came due in front of the whole table.',
        'I watched {subject} tell people to their faces that they were Faithful. The reveal was earned.',
        'Nothing in this show beats a Traitor being caught by the people they lied to.',
        'A little smug of me, but the audience has been shouting about this since the first episode.',
        'The lying was good. The table caught it anyway, and that is the only review that counts.',
        'I am choosing to enjoy this one without any nuance at all.',
      ],
    },
    respect: {
      timeline: [
        '{subject} lied to that castle beautifully and i will miss it',
        'hate the traitor, respect the lying',
        'honestly {subject} was the best part of this season',
        'that traitor game was elite right up until tonight',
        'you have to admire how long that held',
        'caught but not embarrassed. that was a real game',
        'the castle needed every trick it had to catch that one',
      ],
      chat: [
        'Credit to {subject}. Lying to people you eat with every day is harder than it looks, and very few could have kept it up that calmly.',
        'That was a proper Traitor game. It got caught, which happens to almost all of them.',
        'I do not like being lied to for entertainment, and I still enjoyed watching that.',
        'The Faithfuls earned that catch, and it took real work to get there.',
        '{subject} never cracked in any conversation we saw. It took the whole table to get there.',
        'Being caught is how most Traitor games end. How much damage got done first is worth judging on its own.',
        'I have played against people who could hold a lie like that. You do not forget them.',
      ],
    },
  },

  // ── one of their own ────────────────────────────────────────────────────
  //
  // subject = the banished Traitor. actor = a fellow Traitor who voted for them.
  'cold-blooded': {
    'hot-take': {
      timeline: [
        'a traitor banishing a traitor is the coldest move in this game and i love it',
        '{actor} threw {subject} under the bus without blinking',
        'cutting your own partner to look faithful. filthy. brilliant',
        'the traitors eat their own and the castle thinks it did the catching',
        '{actor} just bought the table\'s trust by banishing {subject}',
        'if you are a traitor and your partner is sinking you vote with the room. that is the rule',
        'loyalty in the turret lasts exactly until the table turns',
        'the faithfuls are going to thank {actor} for this. unbelievable',
      ],
      chat: [
        'That is the correct Traitor move. {subject} was going anyway, and {actor} made sure to be seen pushing.',
        'Voting against your own partner is the single best way to buy trust at that table, and everyone watching knows it.',
        'People will call it betrayal. In that turret it is just survival.',
        'The Faithfuls just handed {actor} a clean record for the rest of the game.',
        'I would have done it too, and I would not have enjoyed it. You cannot save a sinking partner at a table.',
        'The coldest votes in this game come from inside the turret.',
        'A Traitor who banishes a Traitor has told the whole table a lie that looks exactly like the truth.',
      ],
    },
    'live-reaction': {
      timeline: [
        '{actor} VOTED FOR {subject}. their own partner',
        'NOT the traitor voting for the traitor 😭',
        'the look {subject} gave {actor}. oh my god',
        'cold. absolutely cold',
        'turret partners until the table. wow',
        'i gasped out loud. their OWN',
        'the faithfuls cheering and a traitor cheering right along with them. i need to lie down',
      ],
      chat: [
        '{actor} put a vote on {subject} and did not look across the table once. That is cold.',
        'I actually gasped. They sat together in the turret and one of them just helped banish the other.',
        'The look on {subject}\'s face at that vote said everything.',
        'The table thinks it just scored a win. Part of that win belongs to a Traitor.',
        'That is the most ruthless thing I have seen at a table in a while.',
        'Nobody at that table understood what they had just watched. We did.',
        'Every Traitor knows this might happen to them. Watching it actually happen is something else.',
      ],
    },
    'grudging-respect': {
      timeline: [
        'i hate {actor} and that was a masterclass',
        'selling out your partner to survive. evil but correct',
        'ok that is how you play a traitor. i do not have to like it',
        '{actor} is the most dangerous person in that castle now and nobody knows it',
        'filthy move. perfect timing',
        'the traitor who cuts their own is the traitor who lasts. i hate that it is true',
        'cold enough to banish a partner. the faithfuls should be terrified',
      ],
      chat: [
        'I do not like {actor} for it, but I would be lying if I said it was not the right vote.',
        'That took nerve. Voting against someone you sat in the turret with is something most people cannot do.',
        'I have had to cut someone I liked to stay alive. It is the right call and it feels awful, and doing it at a table with everyone watching is harder.',
        'That is a very good Traitor game now, whether we enjoy it or not.',
        '{actor} made the castle trust them with one vote. That is hard to argue with.',
        'Ruthless, correct and very well hidden. I will give it that.',
        'I think less of the person and more of the game after that one.',
      ],
    },
  },

  // ── the offer ───────────────────────────────────────────────────────────
  //
  // subject = the player offered. actor = the recruiting Traitor. {receipt}
  // says note or ultimatum, accepted or refused; nothing else here assumes
  // the answer, and nothing assumes the subject is still alive afterwards.
  'recruitment-talk': {
    'live-reaction': {
      timeline: [
        'NOT {subject} getting the offer 😭',
        'the recruitment scene is my favourite scene in this whole show',
        '{actor} really picked {subject}. interesting',
        'recruitment night. nothing is the same after this whatever the answer was',
        'the traitors are recruiting and the castle has no idea',
        'i watched that whole offer through my fingers',
        'the traitors wanted more numbers and went shopping',
        '{subject} had to make that call alone. i could never',
      ],
      chat: [
        'Recruitment is the scene I would watch on its own. One person, one offer, nobody to ask.',
        'I would not want to be {subject} tonight. There is no answer to that offer that keeps things simple.',
        '{actor} chose {subject}, and that tells you who the Traitors think the table trusts.',
        'Recruitment always tells you how the Traitors think the game is going.',
        'Every recruitment is the Traitors admitting they need help. That is worth noting.',
        'I have been offered a deal I did not want in a game. Saying no costs you, saying yes costs you, and you get about a minute to pick.',
        'The castle will keep talking about loyalty tomorrow without knowing what happened tonight.',
      ],
    },
    'hot-take': {
      timeline: [
        '{actor} going for {subject} is a bold pick',
        'the traitors only recruit when they are losing numbers. that is the tell',
        'offering it to {subject} tells you who the traitors think the table trusts',
        'recruitment is where traitor games get won or lost',
        'whoever says yes to an offer like that is playing on hard mode from here',
        'recruiting is a risk every time. one wrong pick and the whole turret is exposed',
        'the traitors need a recruit who can lie on day one. that is a short list',
      ],
      chat: [
        'Picking {subject} was the right idea. Whether it was the right time is a different question.',
        'Recruitment is the Traitors telling you they are worried about the numbers.',
        'The best recruit is someone the table already trusts, and {actor} clearly thinks {subject} is that person.',
        'A recruit who says yes has the hardest job in the castle: learn to lie by the next morning.',
        'I think recruiting is overrated. You double the number of people who can slip, and you get one extra vote for it.',
        'Every offer is a risk for the Traitors, because the person who hears it now has a decision to make about them.',
        'The strength of an offer is who you pick, and the Traitors do not always pick well.',
      ],
    },
    prediction: {
      timeline: [
        'calling it: {actor} regrets this offer by the end',
        'the next table is going to be chaos after this. mark it',
        'watch the traitors change how they play from here',
        'recruitment means the traitors are already planning for the end',
        'prediction: the castle finds out about this at the worst possible moment',
        'i give it two episodes before this offer comes back to bite someone',
        '{receipt}. the next few tables just got a lot harder to call',
      ],
      chat: [
        'My prediction: this offer ends up mattering more than the next two tables put together.',
        'Watch {actor} over the next few days. Recruiting changes how you behave, even when you think you are hiding it.',
        'I expect the Traitors to play differently after tonight, and the sharper Faithfuls will notice.',
        'I think we will look back at this recruitment as the point the endgame started.',
        'Given that {receipt}, I would bet the next murder is already being planned around it.',
        'Mark this one down. Somebody at the next table is going to say something that is really about tonight, without knowing it.',
        'I do not think the castle ever works out this offer happened, and I think that decides where the pot goes.',
      ],
    },
  },

  // ── the Shield ──────────────────────────────────────────────────────────
  //
  // Triggers on a Shield being won AND on a murder it blocked, so slotless
  // lines say only what is true of a Shield either way.
  'shield-talk': {
    'live-reaction': {
      timeline: [
        'THE SHIELD 😭 {subject} you lucky thing',
        'a shield at the right moment is everything in this game',
        '{subject} and that shield. the traitors are fuming somewhere',
        'shields make the turret nervous and i love it',
        'a shield only lasts one night and it still changes the whole game',
        'SCREAMING about the shield',
        'the shield is the only thing in that castle a traitor cannot lie their way past',
        'not {subject} holding the one thing that stops a murder',
      ],
      chat: [
        '{subject} and a Shield is the most interesting thing about tonight.',
        'A Shield is the only protection that exists in that castle, and it covers one night.',
        'The Traitors have to plan every murder around who might be holding a Shield. It is one of the few things they cannot control.',
        'I love how much a Shield rattles the turret. They cannot talk their way round it.',
        'Shield or not, {subject} still has to survive the Round Table like everyone else.',
        'A Shield buys you a night. It buys you nothing when the table turns.',
        'Every Shield is a small defeat for the Traitors, even when nobody at the table ever finds out.',
      ],
    },
    'hot-take': {
      timeline: [
        'shields are overrated. the table is what gets you',
        'winning a shield makes you look like you have something to fear. think about it',
        '{subject} with a shield is still one bad table away from banishment',
        'the shield is the best thing in the castle and it cannot stop a single vote',
        'if the traitors aim at a shield holder they deserve to waste the night',
        'shield or no shield, the round table does not care',
        'people who keep their shield quiet are playing it right',
      ],
      chat: [
        'Shields matter less than people think. They stop one murder, and the table is where most Faithfuls leave.',
        'The real value of a Shield is what the Traitors think you might be holding.',
        '{subject} is safe from the Traitors for a night and completely exposed to the table.',
        'I would keep a Shield to myself. Telling people just makes you look worth a vote.',
        'A Shield does not protect you from suspicion. If anything it adds some.',
        'A Shield will never win anybody this game. At best it keeps them around one more day to try.',
        'The Traitors should never waste a night on a Shield holder. If they aim at one, that is on them.',
      ],
    },
  },

  // ── the Dagger ──────────────────────────────────────────────────────────
  //
  // Timeline only. subject = the holder; {receipt} may name the target.
  'dagger-talk': {
    'live-reaction': {
      timeline: [
        '{subject} with the DAGGER. oh this table is going to be ugly',
        'the dagger is out. somebody is in trouble',
        'double vote. DOUBLE VOTE',
        'the dagger at the round table is my favourite kind of chaos',
        '{receipt} and that dagger vote counted twice',
        'not the dagger coming out tonight 😭',
        'whoever {subject} points that dagger at is in real trouble',
        'two votes from one person. this game is unfair and i love it',
      ],
    },
    'hot-take': {
      timeline: [
        'the dagger in the wrong hands is how faithfuls banish faithfuls',
        '{subject} pulling the dagger tells the whole table exactly what they want',
        'the dagger is worth more than the shield and it is not close',
        'if a traitor holds that dagger the castle is in real trouble',
        'drawing the dagger makes you the loudest vote at the table. brave or stupid',
        'double votes should make the table nervous and somehow they never do',
        '{receipt}. that is a lot of weight for one person to throw around',
      ],
    },
  },

  // ── the pot ─────────────────────────────────────────────────────────────
  //
  // No subject, no actor. {receipt} names the winning team or money.
  'mission-pot': {
    'hot-take': {
      timeline: [
        'the pot went up and every traitor at that table smiled',
        'the faithfuls are building a pot for the traitors to steal. love that for them',
        'missions win money and nothing else. stop treating them like safety',
        'the traitors working hard on a mission is the funniest thing on tv',
        'the more money in that pot the more the endgame hurts',
        '{receipt} and it keeps nobody safe at the table',
        'the mission was fun. the money is the only thing it changed',
        'every bit of money the faithfuls win is money a traitor might walk off with',
      ],
      chat: [
        'Every mission the Faithfuls win is money they might be handing to a Traitor. Nobody in there seems bothered.',
        'Missions tell you who works hard. They tell you nothing about who is lying.',
        'The pot is the only reason the endgame matters, so I will never call a mission filler.',
        'I watch missions for who stays close to whom. The money is almost beside the point.',
        'A Traitor who helps fill the pot is doing the smartest thing possible. It looks exactly like loyalty.',
        'Given that {receipt}, the stakes at the end just went up for everybody.',
        'Missions do not buy anyone safety, and the people treating a good day as protection will find that out at the table.',
      ],
    },
    'stat-drop': {
      timeline: [
        '{receipt}. the pot keeps climbing',
        'the pot is bigger than it has been all season',
        'another mission, more money, still no safety for anybody',
        'reminder that nobody at the table can spend a penny of it until the end',
        'not one mission this season has kept anybody safe. that is the rule',
        '{receipt}. now do the maths on what a traitor walks away with',
        'the pot got bigger tonight',
        'mission won. pot up. castle still full of liars',
      ],
      chat: [
        'For the record, {receipt}. That is real money now.',
        'The pot went up again tonight. Nobody got any safety for it, because nobody ever does.',
        'Worth tracking: the pot grows with every mission won, and it only goes to whoever is left at the end.',
        'The pot is the one number in this game that only moves in one direction.',
        'Given that {receipt}, I would like one Faithful to say out loud who they think takes it home.',
        'Money won, no safety granted, and the table still to come. That is every mission in this format.',
        'The pot is getting big enough that the end of this game is going to hurt someone badly.',
      ],
    },
    complaint: {
      timeline: [
        'why are the faithfuls breaking their backs for money a traitor might take',
        'i do not care about the pot. show me the round table',
        'another mission that changed nothing about who gets banished',
        'they are working so hard for a pot the traitors might walk off with. i cannot watch',
        '{receipt} and nobody even gets safety for it. what is the point',
        'less mission more table please',
        'the traitors pretending to care about the pot is the most annoying part of every mission',
      ],
      chat: [
        'I will be honest, the missions are the part I skim. The money only matters on the last night.',
        'It frustrates me watching Faithfuls pour everything into a mission when they have not spent five minutes on who is lying to them.',
        'The Traitors get to win money for the pot and look loyal doing it. A mission gives them cover every time.',
        'I would trade a mission for one more honest conversation at the table.',
        'Given that {receipt}, you would think somebody would ask who they are winning it for.',
        'Missions give nobody safety, so every minute spent on one is a minute not spent working out the table.',
        'The pot keeps growing and nobody in that castle is any closer to protecting it.',
      ],
    },
  },

  // ── rating the liars ────────────────────────────────────────────────────
  //
  // actor = a Traitor whose play is being rated. Subject varies, so no line
  // leans on it.
  'traitor-rating': {
    'hot-take': {
      timeline: [
        '{actor} is the best liar this show has had',
        'the traitors this season are lying circles around the castle',
        'rating the traitors: {actor} a solid 9, everyone else needs work',
        'honestly the traitors are not even good. the faithfuls are just bad',
        'the best traitor is the one nobody at the table ever mentions',
        '{actor} is too loud. that is going to catch up with them',
        'a good traitor looks bored at the round table. watch for it',
        'the traitors are winning this and it is not close',
      ],
      chat: [
        'The Traitors are winning on the Faithfuls\' mistakes more than their own skill, and those are not the same thing.',
        '{actor} is doing the hardest thing in this game well, which is saying nothing wrong for a whole day.',
        'The best Traitor performances are boring to watch. Nobody lies loudly and lasts.',
        'I would put {actor} in the top tier of Traitors I have watched, and I have watched a lot.',
        'The real skill is staying out of the conversation until it is safe to join it.',
        'The Traitors are playing well enough, but they are getting a lot of help from the table.',
        '{actor} overacts at the table. It is working for now, and it will not work forever.',
        'Every Traitor gets found out by the same thing in the end, which is agreeing with the room too often.',
      ],
    },
    'grudging-respect': {
      timeline: [
        'i hate {actor} and they are playing this perfectly',
        'the traitors are evil and they are good at it. both true',
        'ok {actor} lying straight to that face was elite',
        'i do not want the traitors to win and i cannot stop watching them',
        'the turret keeps making the right calls and it makes me sick',
        'respect to the traitors. i said what i said',
        '{actor} has not made a single mistake the castle has noticed',
        'rooting for the faithfuls and rating the traitors. it is complicated',
      ],
      chat: [
        'I do not enjoy {actor}, and I cannot find a mistake in how they have played it.',
        'The Traitors are doing a very difficult job very well, and I am allowed to say that while wanting them caught.',
        'I have lied to people in a game for a lot less than this, and I was nowhere near as calm about it.',
        '{actor} has kept a straight face through things that would have broken me.',
        'Say what you like about the Traitors, they have not given the table anything to work with.',
        'I want the Faithfuls to win. I also think the Traitors are the best players in that castle.',
        'That is a disciplined Traitor game. It is not fun to root against, but it is fun to watch.',
      ],
    },
    dunk: {
      timeline: [
        '{actor} lying with their whole chest and still sweating. amateur',
        'worst traitors this show has ever had. the castle is just worse',
        'the traitors are getting away with it because the faithfuls are asleep',
        '{actor} is one follow-up question away from being caught',
        'if the castle had one brain between them the traitors would be gone',
        'these traitors would last one episode in front of a sharper table',
        '{actor} calling everyone else suspicious. babe',
        'the traitors are not masterminds. they are just getting lucky at every table',
      ],
      chat: [
        '{actor} is not a good Traitor. {actor} is a Traitor surrounded by people who do not ask questions.',
        'The Traitors are coasting. Any table with a bit of patience would have them by now.',
        'I would like to see this set of Traitors try it in front of a sharper castle.',
        '{actor} keeps over-explaining. That is the first thing you learn not to do.',
        'Nobody should mistake the Faithfuls being bad for the Traitors being good.',
        'The Traitors have made mistakes every day. The castle just has not been looking.',
        'I have seen better lying at a dinner party.',
      ],
    },
  },

  // ── the end ─────────────────────────────────────────────────────────────
  //
  // subject = the sole winner, ABSENT on a split. {receipt} = how it ended.
  // Nobody votes for a winner and nobody's role is revealed at the end.
  'endgame-verdict': {
    'live-reaction': {
      timeline: [
        '{subject} WALKS OUT WITH THE WHOLE POT. i am screaming',
        'it is OVER. i need a minute',
        'that ending. i am shaking',
        '{receipt}. i have no words',
        'the final table had to decide when to stop and i did not breathe the whole time',
        'not {subject} taking all of it 😭',
        'the whole season came down to that and i am not okay',
        'what an ending. what an ENDING',
      ],
      chat: [
        'What a way to finish. That final table was as tense as anything I have watched.',
        '{subject} leaves with all of it. I did not see that coming at the start of the season.',
        'Given that {receipt}, I am still processing how that last table played out.',
        'I have sat at a last table like that. You do not trust the person next to you and you decide anyway.',
        'That ending is going to be argued about for a long time, and I think that is right.',
        'Nobody at that final table knew for certain who they were sitting with. We did. That is the whole show.',
        'The last decision is the one they will all replay: keep going, or stop and trust it.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} earned every penny of that',
        'the endgame vote is the cruellest thing this show does and i love it',
        'ending it there was either the smartest or dumbest call of the season',
        'the last table is the only table that matters and they all knew it',
        '{subject} winning it all is the right result',
        'nobody at that final table trusted anybody and they were right not to',
        '{receipt}. perfect ending and i will hear no arguments',
        'the endgame is where you find out who was actually paying attention',
      ],
      chat: [
        '{subject} played the end better than anyone left standing, and the pot reflects it.',
        'The endgame in this format rewards nerve more than reads. You have to decide to stop, and most people cannot.',
        'Given that {receipt}, I would love to hear each of them explain that last vote.',
        'No reveal at the end is the best rule this show has. You walk out still not knowing.',
        'The last table comes down to one question: who at it are you willing to be wrong about.',
        '{subject} taking the whole pot is going to make a lot of people very angry, and I think that is fine.',
        'Every season comes down to whether the Faithfuls stop at the right moment. That is a lot of pressure on one vote.',
        'Endings like that are why nobody should call this a luck game.',
      ],
    },
    complaint: {
      timeline: [
        'i did not sit through a whole season for that ending',
        '{subject} taking all of it is the worst possible ending',
        'the final table got scared and it showed',
        '{receipt} and i am supposed to be happy about it??',
        'the endgame rules are cruel and the show knows it',
        'the faithfuls deserved a better final table than that',
        'that last vote was a guess and everyone at the table knew it',
      ],
      chat: [
        'I have mixed feelings about that ending, and I think the final table let themselves down.',
        '{subject} winning everything does not sit right with me, even if the rules allow it.',
        'Given that {receipt}, I cannot pretend that was the ending the season earned.',
        'The last table rushed it. One more real conversation and it could have gone another way.',
        'I do not love that the endgame comes down to who blinks first.',
        'That last vote was decided by nerves, and I think everyone sitting there would admit it now.',
        'A season this good deserved a final table that took its time.',
      ],
    },
  },

  // ── survived the table ──────────────────────────────────────────────────
  //
  // subject = a player who took banishment votes and stayed. Either role, so
  // no line says which.
  'accusation-defence': {
    defence: {
      timeline: [
        'leave {subject} alone. the case was nothing',
        '{subject} got called out on vibes and still walked away. good',
        'the accusations against {subject} were three hunches and a bad mood',
        'surviving that table is harder than winning a mission',
        'being quiet is not evidence. i will keep saying it',
        'protect {subject} from that table at all costs',
        'getting accused at the round table and still standing. respect',
        'whoever started those accusations needs to explain themselves',
        'nobody at that table had a real reason and it showed',
      ],
      chat: [
        'I thought {subject} handled that table well. Calm, direct, and nobody had a real answer back.',
        'The case against {subject} was thin, and the table knew it by the end.',
        'Surviving an accusation at that table takes more than luck. You have to stay calm while people you like say it to your face.',
        'Accusations without evidence are how this game goes wrong. I am glad the table slowed down for once.',
        'The people pointing fingers tonight should be asked where their certainty came from.',
        'I have been accused on nothing before. Keeping your voice level is the hardest part, and it matters most.',
        'Nobody at that table brought anything more than a feeling.',
      ],
    },
    'call-out': {
      timeline: [
        'the people who went after {subject} had nothing and everyone saw it',
        'accusing {subject} was a way to look busy. that is all it was',
        'name the people who started that pile on. i will wait',
        'accusations at the round table with zero evidence. again',
        'the loudest accuser at that table is the one i would be watching',
        'you do not get to throw a name at the table and walk off like it was nothing',
        'somebody pushed hard for a banishment tonight and it did not stick. why did they want it so badly',
      ],
      chat: [
        'The accusations against {subject} came from people who needed a name, not people who had a reason.',
        'Whoever led that push should be asked what they would have done if it had worked.',
        'I am more interested in who started the accusations than in who survived them.',
        'Every accusation at that table tells you about the accuser. Tonight\'s told you plenty.',
        'That push on {subject} looked organised to me, and nobody at the table asked who organised it.',
        'The table let a weak accusation run for far too long.',
        'Somebody wanted a banishment tonight and did not get one. That person is the story.',
      ],
    },
  },
};

// ── the hosts ─────────────────────────────────────────────────────────────
//
// Alumni in the hosted room, when they have no personal voice line. `s` is the
// subject's display name (empty when the event has none), `w` the show words,
// `k` the event label. murder-blocked, mission-won, finale and episode-aired
// never read `s`.
export const CHAT_TAKES = {
  murder: [
    ({ s }) => `${s} didn't do anything wrong. That's the thing about a murder: you don't get a table, you just don't come down in the morning.`,
    ({ s }) => `The Traitors picked ${s} for a reason, and the castle will spend all day guessing it wrong.`,
    ({ s }) => `I'd have taken ${s} too, and I hate saying it. People the table listens to are a problem for a Traitor.`,
    () => `A murder isn't a vote. Nobody has to defend it, and that's exactly why the Traitors love them.`,
    ({ s }) => `Watch the Traitors react to losing ${s}. It's the best acting of the night.`,
    ({ s }) => `${s} leaves without ever getting a chance to argue. I've lost games plenty of ways and that one would sting the most.`,
    ({ s }) => `Losing ${s} says a lot about who the Traitors think the table listens to.`,
    ({ w }) => `The ${w.home} lost a Faithful overnight, and the people who did it will be the first to say how sad they are.`,
    () => `I've seen people cry over a murder the next morning and be the one who did it. It never stops being unsettling.`,
  ],
  'murder-blocked': [
    () => `The Shield did its job. Somebody in that turret just wasted a night, and they'll be furious about it.`,
    () => `A blocked murder is a free night for the Faithfuls and a wasted one for the Traitors.`,
    () => `The Traitors aimed at someone holding a Shield. That's either bad luck or bad information, and I'd want to know which.`,
    () => `Nobody was murdered, and the castle's going to spend the whole day wondering why.`,
    ({ w }) => `That's the one thing a Shield is for. It won't help anybody at ${w.ceremony}.`,
    () => `I love a blocked murder. The Traitors have to sit through the morning pretending they're as surprised as everyone else.`,
    () => `Whoever held that Shield just found out how much the Traitors wanted them gone.`,
    () => `A night with no murder changes the maths. There's one more Faithful at the table than the Traitors planned for.`,
  ],
  accused: [
    ({ s }) => `${s} took real heat tonight and got through it. That's not the same as being in the clear.`,
    () => `I've been the name everyone said out loud. You go to bed knowing it's coming again.`,
    ({ s }) => `The case against ${s} was mostly a feeling. Feelings banish people in this game, so ${s} got lucky.`,
    ({ s }) => `${s} kept calm. Whether that's innocence or practice is the question the table should be asking.`,
    ({ w }) => `Getting accused at ${w.ceremony} and surviving it makes you a target for the next one.`,
    ({ s }) => `Watch who pushed ${s}'s name hardest. That person had a reason, and it might not be the one they gave.`,
    ({ s }) => `${s} survived the votes tonight. The conversations about ${s} tomorrow are the harder part.`,
    ({ s }) => `A name that takes votes once usually takes them again. ${s} has a day to change that.`,
  ],
  'faithful-banished': [
    ({ s }) => `${s} was Faithful, and the table sent them home on a hunch. The Traitors didn't have to lift a finger.`,
    () => `The reveal said Faithful, and you could see everyone at that table do the maths too late.`,
    ({ s }) => `Every Faithful banished is a free night for the Traitors. ${s} is tonight's gift to them.`,
    ({ s }) => `I've been the person a room decided about for no good reason. ${s} handled that walk out better than I did.`,
    ({ s }) => `The table wanted someone to blame and ${s} was the easiest name. That's not a read, it's a shortcut.`,
    ({ s }) => `A Traitor put a vote on ${s} right along with the room, and nobody will think twice about it. That's how they survive.`,
    ({ s, w }) => `${s} said Faithful and ${w.ceremony} went quiet. That quiet is guilt, and it wears off by morning.`,
    ({ s }) => `Losing ${s} will make the table careful for about a day. Then they'll do it again.`,
  ],
  'traitor-caught': [
    ({ s }) => `${s} was a Traitor, and the table finally got one right. You could hear the relief.`,
    ({ s }) => `I'll give ${s} this: the lying held up well. It just didn't hold up tonight.`,
    ({ s }) => `Anyone who defended ${s} is going to be very quiet tomorrow.`,
    () => `Catching a Traitor is the best night a Faithful gets. Don't expect it to make them any better at catching the next one.`,
    ({ s }) => `${s} went down calm, and that tells you how good ${s} was at the job.`,
    () => `The table will feel clever tonight. Clever tables get sloppy.`,
    ({ s }) => `${s} saying Traitor out loud, in front of everyone they lied to. That's why people watch this show.`,
    ({ w }) => `One Traitor gone doesn't mean the ${w.home} is safe, and I hope somebody in there remembers that.`,
  ],
  'traitor-sacrificed': [
    ({ s }) => `${s} was banished with a Traitor's vote in the pile. That's as cold as this game gets.`,
    ({ s }) => `Voting against your own partner is the best cover a Traitor can buy, and someone just bought it with ${s}.`,
    ({ s }) => `${s} will watch this back and see exactly who didn't hesitate.`,
    ({ s }) => `The table thinks it caught ${s}. It had help from inside the turret.`,
    ({ w }) => `I've cut people I liked to stay in a game. Doing it at ${w.ceremony} while they watch you is a different level.`,
    ({ s }) => `Nobody saves a sinking partner in this game. ${s} would probably have done the same.`,
    ({ s }) => `The Traitor who voted for ${s} just earned a clean record with every Faithful at that table.`,
    () => `That's the moment the Traitors stopped being a team. It's every one of them for themselves now.`,
  ],
  recruited: [
    ({ s, w }) => `An offer like that is the loneliest decision in the ${w.home}. ${s} had to make it without asking anybody.`,
    ({ s }) => `The Traitors picked ${s} because they think the table trusts ${s}. That's a compliment, of a kind.`,
    () => `Recruitment tells you the Traitors are worried about their numbers.`,
    () => `I've been offered deals I didn't want in a game. Every answer costs you something.`,
    ({ s }) => `Whatever ${s} said, the Traitors took a real risk making that offer.`,
    () => `The castle has no idea this happened, and that's the part I love.`,
    ({ s }) => `Picking ${s} tells you exactly how the Traitors see the table right now.`,
    () => `A recruitment is the Traitors admitting they can't finish this alone.`,
    ({ s }) => `I don't envy ${s}. Nobody walks away from that offer with an easy night.`,
  ],
  'shield-won': [
    ({ s, w }) => `${s} has a Shield. It stops one murder and does nothing at ${w.ceremony}, and ${s} needs to remember the second part.`,
    () => `I'd keep that Shield quiet. Tell people and you look like someone with something to protect.`,
    ({ s }) => `The Traitors will have to plan around ${s} now, and that's worth more than the Shield itself.`,
    () => `A Shield is a night off from the turret. It's never a night off from suspicion.`,
    ({ s }) => `${s} earned that. Whether it matters depends on whether the Traitors were ever aiming there.`,
    ({ s }) => `The table can still banish ${s} tomorrow, Shield or not.`,
    () => `Shields make the Traitors nervous because they can't lie their way around one.`,
    () => `I've held protection in a game before. The week you have it is the week people start asking why you wanted it.`,
  ],
  'dagger-drawn': [
    ({ s, w }) => `${s} with a double vote is the most dangerous person at ${w.ceremony} tonight.`,
    ({ s }) => `Drawing the Dagger tells the whole table what you want. ${s} had better be right.`,
    () => `A Dagger in a Traitor's hand is a disaster for the Faithfuls, and nobody at that table can tell whose hand it's in.`,
    () => `Two votes from one person changes the maths. Everybody who counted before the Dagger came out has to count again.`,
    () => `I'd never pull a Dagger early. It makes you the loudest voice at the table, and loud voices get looked at.`,
    ({ s }) => `${s} used it. Now ${s} owns that vote twice over, whatever it led to.`,
    () => `The Dagger is the only thing in this game that makes one opinion count for more. That should frighten people.`,
    ({ s }) => `Whoever ${s} aimed at will remember it long after the table has moved on.`,
  ],
  'mission-won': [
    () => `The pot went up. Nobody got safer, and I wish the Faithfuls took that as seriously as the money.`,
    ({ w }) => `Every penny won on a ${w.challenge} might end up with a Traitor. Nobody in that ${w.home} seems bothered.`,
    () => `I watch missions for who stands next to whom. The money is almost the least interesting part.`,
    ({ w }) => `A Traitor who works hard on a ${w.challenge} looks exactly like a Faithful who does. That's the whole trick.`,
    () => `Missions are the only time the whole castle pulls in one direction, and the Traitors are pulling hardest.`,
    () => `Good money today. It doesn't change a single vote at the table.`,
    () => `The bigger that pot gets, the worse the end is going to feel for whoever doesn't get it.`,
    ({ w }) => `A strong ${w.challenge} buys nobody protection, and the people treating it like it did are about to learn that.`,
  ],
  finale: [
    () => `That's the end, and nobody at that final table knew for certain who they were sitting with. We did.`,
    () => `The last decision in this game is whether to stop. It's harder than any banishment vote they cast all season.`,
    () => `No reveals at the end is the cruellest rule in the format, and I wouldn't change it.`,
    () => `I've watched a lot of finales. Very few end with the people deciding it unsure of everyone beside them.`,
    () => `However you feel about where the pot went, that final table earned the argument.`,
    () => `Nobody voted for a winner. The people still sitting there decided when to stop, and I think that's fair.`,
    () => `The whole season was built for that last table, and it delivered.`,
    () => `I'd want to hear every one of them explain why they stopped when they did.`,
  ],
  'episode-aired': [
    () => `Watching the Traitors tonight, I'd say the castle still isn't looking in the right place.`,
    () => `The castle keeps looking for someone acting strange. The Traitors are acting completely normal.`,
    () => `Every episode I think the table's about to crack it, and every episode they talk themselves out of it.`,
    () => `I'd love one Faithful to start tracking who votes with the room every single time.`,
    () => `The episode looked quiet. It never is when nobody's talking about the Traitors.`,
    () => `We know who they are, they don't, and I still can't look away.`,
    () => `The best part of this show is sitting at home knowing exactly who's lying.`,
    () => `The Faithfuls are getting closer. Slowly, and not in a straight line.`,
  ],
};

// ── the regulars ──────────────────────────────────────────────────────────
//
// Six fans native to the castle. Same shape as js/social/personas.js.
export const PERSONAS = [
  {
    handle: '@roundtabletruther', name: 'lou', since: 3, archetype: 'hater',
    voice: { caps: 0.5, emoji: 0.2, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.7,
    feelings: {},
  },
  {
    handle: '@turretwatch', name: 'hana', since: 1, archetype: 'analyst',
    voice: { caps: 0.03, emoji: 0.05, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2,
    feelings: {},
  },
  {
    handle: '@faithfulforever', name: 'benji', since: 6, archetype: 'stan',
    voice: { caps: 0.4, emoji: 0.6, length: 'medium', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.8,
    feelings: {},
  },
  {
    handle: '@breakfastbodycount', name: 'nell', since: 9, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.45, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.95,
    feelings: {},
  },
  {
    handle: '@twofaithfulsinlove', name: 'rory', since: 11, archetype: 'shipper',
    voice: { caps: 0.3, emoji: 0.85, length: 'short', punctuation: 'none' },
    platforms: ['timeline', 'chat'], volatility: 0.55,
    feelings: {},
  },
  {
    handle: '@potsplitter', name: 'ines', since: 14, archetype: 'casual',
    voice: { caps: 0.15, emoji: 0.5, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.85,
    feelings: {},
  },
];
