// js/social/packs/perfect-match-words.js
// What the villa's fandom says, and who says it.
//
// DATA ONLY. The reader and the topic list live in perfect-match.js; this is
// the half a contributor edits to add a line. Same shape as the other packs.
//
// THE PUBLIC DECIDES THIS SHOW. The islanders couple up, steal, stick or
// twist and dump each other at the fire pit; the country votes for its
// favourite couple and crowns the winners. So nobody here is nominated or
// voted out by a room — they are dumped from the island, left standing, or
// the public's favourites.
//
// Slots: {subject} {actor} {season} {episode} {receipt}. A template naming one
// is only drawn when the event can fill it, so at least half of every pool
// stands on its own.

export const PHRASINGS = {

  // ── the bombshell ─────────────────────────────────────────────────────────

  'bombshell-watch': {
    'live-reaction': {
      timeline: [
        'A BOMBSHELL. the whole villa just stood up at once',
        '{subject} walking down those steps and three couples forgetting their own names',
        'the way every single person turned round when the text came in',
        'this bombshell has already caused more chaos than the last two weeks combined',
        'not the new arrival going straight for the one couple i actually liked',
        'ok the bombshell is gorgeous and i am scared for everyone',
      ],
      chat: [
        'A good bombshell tests every couple in the villa at once, and this one walked in knowing it.',
        'The first ten minutes after somebody new arrives tell you which couples are solid.',
        '{subject} picked the dates carefully. That was not a random choice.',
        'I remember walking in as the new one. You have about a day before the villa decides who you are.',
        'Watch who pretends not to be interested. They are always the ones who are.',
        'A new arrival is only as strong as the couple they choose to go after.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is going to split up a couple by friday and i am not even sorry',
        'the bombshell is doing more grafting in one night than some of them have all series',
        'every couple saying they are closed off is about to be tested',
        'if the new arrival does not steal someone at the recoupling i want my money back',
        'this is exactly what the villa needed, it had gone way too comfortable',
        '{receipt} and suddenly nobody in there looks secure',
      ],
      chat: [
        'The villa had gone quiet. Producers send someone in when the couples stop being interesting.',
        '{subject} does not have to steal anybody to change things. Being there is enough.',
        'The couples that look worried tonight are the ones that were already on the rocks.',
        'A bombshell who goes for a strong couple either wins big or goes home first. There is nothing in between.',
        'The real test is the recoupling, not the date. Anybody can have a good date.',
        'I would watch the one who smiled the most at the entrance. That is never nothing.',
      ],
    },
  },

  // ── somebody comes back ───────────────────────────────────────────────────

  'return-talk': {
    'live-reaction': {
      timeline: [
        'NO. they brought {subject} BACK',
        'the look on the ex\'s face when {subject} walked in. i will be thinking about it for days',
        'somebody drop a glass because i just did',
        'a returning islander is the meanest thing this show has ever done and i love it',
        'the villa went completely silent. you could hear the pool',
        'they really said let us reopen every wound at once',
      ],
      chat: [
        '{subject} watched everything from the outside. That is a huge advantage, and everyone in there knows it.',
        'Coming back is harder than going in the first time. You know exactly what they said about you.',
        'The person who voted them out is the one to watch tonight, not the one walking in.',
        'A second chance changes how you play. You stop being careful.',
        'I would not want to be the ex in that moment. There is nowhere to look.',
        'The public brought them back, and the villa has to live with that.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is going to pick the one person nobody wants them to pick',
        'bringing people back is a cheat code for drama and i fully support it',
        '{subject} has seen the footage. {subject} knows EVERYTHING',
        'the ones who dumped {subject} should be very nervous right now',
        'a return this late means the producers think the villa is too settled',
        '{receipt} and every couple in there just got a little less safe',
      ],
      chat: [
        'Whoever comes back has watched the villa for weeks. They know who is faking it.',
        'A return is the public saying they were not finished with somebody.',
        'The couples who were quick to move on are going to have to explain themselves now.',
        '{subject} does not need to steal anybody. Just being there changes the conversations.',
        'I would expect some very honest chats in the next few days, whether anybody wants them or not.',
        'This will either be the best thing that happens to {subject} or a very public second goodbye.',
      ],
    },
  },

  // ── the steal ─────────────────────────────────────────────────────────────

  'steal-reaction': {
    'live-reaction': {
      timeline: [
        'THE STEAL. i actually screamed',
        '{subject} standing up at the fire pit and choosing someone else\'s partner. unwell',
        'the fire pit going completely silent. the face on {actor}. my god',
        'not a steal at the recoupling. not tonight. not them',
        'somebody check on {actor} immediately',
        'i did not see that coming and neither did the person who got stolen from',
      ],
      chat: [
        'A steal is the loudest thing you can do at a fire pit, and {subject} did it on purpose.',
        '{actor} will be thinking about that walk back to the daybeds for a long time.',
        'The only person who looked calm was the one who did it.',
        'I have been on the other end of one of those. You feel every eye in the villa on you.',
        'Steals are about confidence. You have to believe the other person says yes.',
        'The couple broke up in front of the whole villa, which is the part nobody ever recovers from.',
      ],
    },
    complaint: {
      timeline: [
        'that was so disrespectful to {actor} and everyone watching knows it',
        'there was no need for that. none. zero',
        '{subject} has been planning that all week and pretending to be everyone\'s friend',
        'steals are only fun when it is not the couple you like',
        'the way {subject} smiled afterwards. no. not having it',
        'somebody explain why that was necessary because i cannot',
      ],
      chat: [
        'I do not mind a steal. I mind one done like that, with no warning to anybody.',
        '{actor} had done nothing wrong, and that is the part that stings.',
        'There were other ways to get to know that person. That was a choice to hurt somebody.',
        'The villa will remember this at the next recoupling, and {subject} knows it.',
        'A steal after a week of saying you respect the couple looks very different on a replay.',
        'I think the public will take that badly. They usually do when somebody gets humiliated.',
      ],
    },
    defence: {
      timeline: [
        'it is a DATING show. {subject} went for who they wanted. that is the point',
        'if the couple was solid the steal would not have worked',
        'honestly {subject} was braver than half the people in that villa',
        'people defending the couple did not watch the last week of them',
        'i would rather someone go for what they want than sit there being polite',
        'no one gets stolen from a couple that was working',
      ],
      chat: [
        'The recoupling exists so people can choose. {subject} chose, that is all it was.',
        'That couple had been cracking for days. The steal just said it out loud.',
        'I respect anyone who makes a decision at that fire pit rather than playing it safe.',
        'If somebody says yes to a steal, the couple was already over.',
        'It will look harsh tonight and fair by the weekend.',
        'The villa loves a couple until the moment it has to choose them over itself.',
      ],
    },
  },

  // ── the dumping ───────────────────────────────────────────────────────────

  'dumping-reaction': {
    'live-reaction': {
      timeline: [
        '{subject} has been dumped from the island and i need a minute',
        'not {subject} leaving. not like this',
        'that dumping was brutal and the goodbye made it worse',
        'the villa is so much quieter without {subject} already',
        'i cannot believe they are really gone. they were the heart of that place',
        '{receipt} and i am in bits',
      ],
      chat: [
        'Being dumped is always fast. You are at the fire pit, and then you are gone.',
        '{subject} handled that with a lot of grace. I was not that calm when it happened to me.',
        'The goodbye tells you who the real friendships in there are.',
        'That exit is going to change who couples up with whom next week.',
        'I think {subject} will do very well out of this, whatever it feels like tonight.',
        'The villa will feel different tomorrow. It always does when someone like that leaves.',
      ],
    },
    sympathy: {
      timeline: [
        'protect {subject} at all costs, they did not deserve that',
        'sending love to {subject}, you were one of the good ones',
        'i hope {subject} knows how many of us were rooting for them',
        'the way {subject} hugged everyone before leaving. i am not okay',
        'nobody in there was more genuine than {subject}',
        'getting dumped for being single is the cruellest rule on television',
      ],
      chat: [
        '{subject} never got the right person in there, and that is not the same as doing anything wrong.',
        'It is hard to find somebody in a villa of strangers in a few weeks. Most people do not.',
        'The public can be harsh. It does not mean they did not like {subject}.',
        'I would take {subject} on a night out over half the people still in there.',
        'Whoever {subject} ends up with outside is lucky. I mean that.',
        'Being left single is not the same as being unwanted. The numbers just did not work.',
      ],
    },
    'hot-take': {
      timeline: [
        'the wrong person went home tonight and we all know it',
        '{subject} was always going to go the moment the couple broke up',
        'honestly that exit was a long time coming',
        'the villa just lost its best storyline',
        '{subject} leaving is going to cause chaos with whoever is left single',
        'the producers are going to regret that one when the next week is boring',
      ],
      chat: [
        'I think {subject} was dumped for being in a weak couple, not for being weak.',
        'That exit leaves a gap in the villa that somebody is going to try to fill very quickly.',
        'The couple that survived tonight did not deserve to over {subject}, in my opinion.',
        'It is the right result if you are counting who was grafting. It is the wrong one if you are counting who was liked.',
        'This is what happens when you get comfortable in there too early.',
        'Somebody is going to be single next, and they will be the target now.',
      ],
    },
  },

  // ── the public's bottom ───────────────────────────────────────────────────

  'public-vote-talk': {
    complaint: {
      timeline: [
        '{subject} in the bottom?? the public are WRONG',
        'how are they in the bottom when the other couple has done nothing all week',
        'i voted for {subject} three times and it was not enough',
        'the public are voting on the edit and not the couple',
        'every time i like a couple they end up in the bottom. every time',
        'that result makes no sense to anybody who watched this week',
      ],
      chat: [
        'I do not understand that bottom at all. {subject} has been one of the realest in there.',
        'The public vote for what they see, and they have not been shown much of that couple.',
        'A bottom placing says more about screen time than about the couple.',
        'I have been in the bottom and felt fine about my couple. It is a strange place to stand.',
        'The public are usually right about who they like. They are not always right about who is real.',
        'If they survive this, the next few days will bring them much closer together.',
      ],
    },
    'hot-take': {
      timeline: [
        'the bottom couples are exactly who they should be and nobody wants to admit it',
        '{subject} has been coasting and the public noticed',
        'being boring is the only thing the public never forgive',
        'the favourite couple has not been in danger all series and it shows',
        'this vote is about who the public trust, not who they like',
        '{receipt} and honestly it was deserved',
      ],
      chat: [
        'The public can smell a couple for survival. They always put them near the bottom.',
        '{subject} has not given people a reason to pick up the phone.',
        'Being liked is not enough. You have to be rooted for.',
        'The shares tell you the favourite is running away with it, whatever the villa thinks.',
        'This is the vote where couples find out what the country actually thinks of them.',
        'A bottom placing now can be the best thing for a couple. It gives them a story.',
      ],
    },
  },

  // ── Casa Amor ─────────────────────────────────────────────────────────────

  'casa-verdict': {
    'live-reaction': {
      timeline: [
        '{subject} WALKED IN WITH SOMEONE ELSE. i am on the floor',
        'the stick or twist is the best night of the year and it did not disappoint',
        'the face of the one who stuck. the face. i cannot',
        'every recoupling after casa is a crime scene',
        'not {subject} twisting after all those promises by the fire pit',
        'i need a whole day to process what just happened',
      ],
      chat: [
        'Stick or twist is the night the villa finds out who meant it.',
        '{subject} made that choice in a few days, after weeks with the same person. That tells you something.',
        'The one who stuck and was left alone gets the public for life. That is the only good thing about it.',
        'I stuck, and I walked in to see my partner with somebody else. You do not forget that.',
        'The couples that came through Casa tonight are the ones to back for the final.',
        'Everybody says they will stick. Casa is the week that shows who was only saying it.',
      ],
    },
    complaint: {
      timeline: [
        '{subject} twisted after one weekend. ONE weekend',
        'imagine sticking and walking in to that. i would have left the villa',
        'the way {subject} could not even look at them. disgraceful',
        'casa amor should come with a warning for everyone watching at home',
        'that was the most mugged off i have ever seen someone on this show',
        'no one who twists like that is coming back from it with the public',
      ],
      chat: [
        'I have no problem with twisting. I have a problem with twisting and pretending you did not plan it.',
        'The person left waiting did everything right and still got humiliated.',
        '{subject} will feel the public on this one for the rest of the series.',
        'A few days in another villa should not undo weeks, and it did.',
        'The worst part is the photos. They make the whole thing impossible to explain away.',
        'That couple is not going to recover, and I do not think {subject} wants it to.',
      ],
    },
    gushing: {
      timeline: [
        '{subject} STUCK. i am crying. loyalty is not dead',
        'walking back in alone and running straight into their arms. perfect television',
        'the couple that survived casa is my winner now, no discussion',
        'they both stuck and i have never been happier',
        '{subject} could have had anyone at casa and chose to go home to their person',
        'this is why i watch. this exact moment',
      ],
      chat: [
        'A couple that both stick through Casa is the real thing. I will say that every year.',
        '{subject} walked in alone, and you could see the relief across the whole villa.',
        'It is easy to stay loyal when nobody is testing you. That was a real test.',
        'The public love a couple that comes through Casa. Expect them near the top from here.',
        'Sticking is quieter than twisting, and it means much more.',
        'You could see how much that meant to both of them. That is not acting.',
      ],
    },
  },

  // ── the couples ───────────────────────────────────────────────────────────

  'couple-watch': {
    gushing: {
      timeline: [
        '{subject} and {actor} are the only couple i care about now',
        'they made it official and i am acting like it is my own wedding',
        'the way they look at each other. i need what they have',
        'my favourite couple are thriving and all is right with the world',
        'this is the couple i will be voting for until the final',
        'every scene with them is my favourite scene',
      ],
      chat: [
        '{subject} and {actor} have been steady from the start, and it shows in the little moments.',
        'Making it official in there is a big step. You are telling the whole villa you are closed off.',
        'I think they will last outside. The ones who talk that honestly usually do.',
        'The best couples are the ones who are friends first, and that is them.',
        'You can tell a real couple by how they are when nobody is watching, and we get to see that.',
        'They are the couple to beat now, and I do not think anybody in there knows it yet.',
      ],
    },
    'hot-take': {
      timeline: [
        'the favourite couple is not as solid as everyone thinks',
        'one of them is further ahead than the other and it is going to show',
        'i do not trust a couple that never argues',
        'they made it official way too fast',
        'the couples everyone is ignoring are the ones who will last',
        'someone in that couple has their head turned already, watch',
      ],
      chat: [
        'Official after a few weeks is fast, even for the villa.',
        'The couples that look perfect on screen are sometimes the ones putting on a show for it.',
        'One of them is all in and the other is still deciding. That gap always shows eventually.',
        'I would keep an eye on the next bombshell. That is the real test for them.',
        'The strongest couple in there is not the loudest one.',
        'Being settled this early can make you a target at the recoupling.',
      ],
    },
  },

  // ── the challenge ─────────────────────────────────────────────────────────

  'challenge-talk': {
    'live-reaction': {
      timeline: [
        'the challenge today was pure chaos and i loved every second',
        'nobody is ever ready for what a villa challenge brings out',
        'that challenge started three arguments and one new couple',
        'the things people said during that game. they will be hearing about it for days',
        'this is why challenge day is the best day',
        '{receipt} and it went exactly as badly as i hoped',
      ],
    },
    dunk: {
      timeline: [
        'whoever wrote those questions knew exactly what they were doing',
        'that challenge was a trap and every single one of them walked into it',
        'the scores got read out and a couple broke up. classic',
        'not the boards being turned round and friendships ending',
        'the villa said it was just a game. the villa was lying',
        'the way nobody could look at each other after that',
      ],
    },
  },

  // ── the envelope ──────────────────────────────────────────────────────────

  'envelope-talk': {
    'live-reaction': {
      timeline: [
        'THE ENVELOPE. i could not breathe',
        '{subject} opening that envelope and the whole studio holding its breath',
        'split or steal is the most stressful thing on television',
        'i knew {subject} would do the right thing. i KNEW it',
        'the pause before the answer was longer than the whole series',
        '{receipt} and that tells you everything about them',
      ],
      chat: [
        'The envelope is the last test, and it is the only one with money on it.',
        '{subject} did not even hesitate. That is the answer that matters.',
        'Nobody ever really thinks about stealing until the envelope is in their hand.',
        'I think that decision will say more about them than the whole series did.',
        'Splitting is expected. Being seen to split without a second thought is what the public love.',
        'That moment will follow them around for years, whichever way it went.',
      ],
    },
  },

  // ── the winners ───────────────────────────────────────────────────────────

  'winners-verdict': {
    'live-reaction': {
      timeline: [
        '{subject} and {actor} WON. i am sobbing',
        'the public got it right for once. the right couple won',
        'watching them hear their names read out. perfect ending',
        'the winners have been my favourites since week one and they did it',
        'this is the ending the whole series deserved',
        'the reaction when the host read out their names. i will never get over it',
      ],
      chat: [
        'The public chose the couple they believed in, and it showed in the result.',
        '{subject} and {actor} were the favourites for weeks. Tonight just made it official.',
        'Winning this is about the public trusting you, and they trusted them.',
        'I think that result was decided around Casa Amor. They came through it together.',
        'A winning couple has to be liked and believed. They were both.',
        'You could see the others were happy for them, which says a lot.',
      ],
    },
    'hot-take': {
      timeline: [
        'the right couple won but the runners-up had the better love story',
        'they won because the public liked them, not because they were the realest',
        'the result was decided weeks ago and the final was a formality',
        'i would have given it to the couple in second and i will die on that',
        'the winners have never once been in danger and it shows',
        'honestly the couple in third was robbed',
      ],
      chat: [
        'The public vote rewards the couple they want to see together, which is not always the strongest couple.',
        'The runners-up had the harder series. That counts for something, even if it did not count tonight.',
        'The winners never had a bad week, and in this show that is what wins it.',
        'I think a couple who came through a steal or Casa would have had a better story.',
        'It was the safe result, and the safe result is usually the one the public pick.',
        'Nobody can argue they did not deserve it. People will still try.',
      ],
    },
    complaint: {
      timeline: [
        'the wrong couple won and i will not be taking questions',
        'how did they win when they barely spoke for the first two weeks',
        'the public voted for the edit and it shows',
        'robbed. the second place couple were ROBBED',
        'i am so disappointed with the result i cannot even watch the reunion',
        'that was not the couple the series was about',
      ],
      chat: [
        'I do not think that result reflects what happened in the villa.',
        'The couple in second had the story. The winners had the screen time.',
        'The public often pick the comfortable couple over the real one.',
        'I will be honest, I thought this was a two-couple race and they were the other one.',
        'It is not a bad result. It is just not the one the series earned.',
        'The winners are lovely. That is not the same as being the best couple.',
      ],
    },
  },

  // ── the edit ──────────────────────────────────────────────────────────────

  'villa-edit': {
    'call-out': {
      timeline: [
        'why do we never see the quiet couples do anything',
        'the edit has decided who the villain is and it is not subtle',
        'half the villa got about four seconds of screen time tonight',
        'the producers are building the favourite couple up so hard',
        'we saw the argument but not what caused it. suspicious',
        'the edit is carrying some of these couples and i can see it',
      ],
      chat: [
        'The edit decides who the public vote for before the public know they are deciding.',
        'Some couples in there have barely been shown, and they will pay for it at the vote.',
        'What we see is maybe an hour out of a whole day. That is a lot of room to shape somebody.',
        'The villain edit is always one beach hut away.',
        'I would love to see what the quiet ones are actually like. We never get to.',
        'The producers know exactly which couple they want in the final.',
      ],
    },
    'hot-take': {
      timeline: [
        'the most interesting person in that villa gets the least screen time',
        'the edit is protecting someone and we all know who',
        'you can tell who is going home by how much they are shown this week',
        'the beach hut is where the real series happens',
        'every couple the edit ignores gets dumped. every time',
        'the edit made a normal day look like a war tonight',
      ],
      chat: [
        'When a couple suddenly gets a lot of screen time, something is coming for them.',
        'The beach hut is the most honest part of the show, and it is the part people forget.',
        'The edit loves a love triangle more than the villa does.',
        'I think the public are being steered towards a winner already.',
        'A quiet week on screen is not a quiet week in the villa.',
        'Watch who the narrator makes fun of. That is who the edit likes.',
      ],
    },
  },
};

// ── the alumni room, one take a kind (fn({ s, w, k })) ────────────────────
export const CHAT_TAKES = {
  'villa-challenge': [
    ({ k }) => `The ${k.toLowerCase()} is never really about the game.`,
    () => 'Challenge day always starts one argument. Today it started two.',
    () => 'I used to dread the challenges. Somebody always says something they cannot take back.',
    () => 'A game where the scores are read out is a game designed to cause trouble.',
    ({ s }) => `${s} will be talking about that challenge for the rest of the week.`,
    () => 'The couples who laughed it off are the strong ones.',
    () => 'Watch the faces while the answers are read out, not the answers.',
    () => 'Every challenge in that villa is a test of the couples, whatever it is called.',
  ],
  'made-official': [
    ({ s }) => `${s} making it official is a big moment. You are telling the whole villa you are taken.`,
    () => 'Official in there means something. It means you stop looking.',
    ({ s }) => `I think ${s} has been sure for a while. It just took time to say it.`,
    () => 'The couples who go official early either win or break up very publicly.',
    () => 'It is a lovely moment, and it paints a target on them for the next bombshell.',
    ({ s }) => `You could see how much it meant to ${s}.`,
    () => 'Going official is the villa version of meeting the parents.',
    () => 'The rest of the villa will treat them differently now. That always happens.',
  ],
  bombshell: [
    ({ s }) => `${s} walked in and every couple got a little quieter.`,
    () => 'A new arrival is a test for everybody, not just the couple they go for.',
    ({ s }) => `${s} has a day to make an impression before the villa decides.`,
    () => 'I remember being the new one. Everyone is friendly, and nobody trusts you.',
    () => 'The couples who looked away quickly are the ones to watch.',
    ({ s }) => `${s} chose the dates well. That was not an accident.`,
    () => 'A bombshell is how the producers remind the villa that nothing is settled.',
    () => 'The recoupling after an arrival is where the real damage happens.',
  ],
  returned: [
    ({ s }) => `${s} coming back is the last thing anybody in there expected.`,
    () => 'A returning islander knows exactly what everyone said. That is terrifying for the villa.',
    ({ s }) => `The ex is the one to watch now, not ${s}.`,
    () => 'Coming back takes a lot of nerve. You know what they think of you.',
    ({ s }) => `${s} has watched it all from outside. Nothing in there is a secret any more.`,
    () => 'The public brought them back, and the public usually have a reason.',
    () => 'A return always leads to at least one very uncomfortable conversation.',
    () => 'I would not want to be the person who dumped them. Not tonight.',
  ],
  'casa-stick': [
    ({ s }) => `${s} stuck, and it was the right choice.`,
    () => 'Walking back in alone is the bravest thing that happens all series.',
    ({ s }) => `${s} could have been tempted and was not. That means something.`,
    () => 'Sticking only works out if your partner stuck too. That is the terrifying part.',
    () => 'The couples who both stick are the ones I would back for the final.',
    ({ s }) => `The public will love ${s} for that. They always do.`,
    () => 'Loyalty is quiet. It does not make good television until the doors open.',
    () => 'I stuck, once. I have never been more nervous walking into a room.',
  ],
  'casa-twist': [
    ({ s }) => `${s} twisted, and the whole villa saw it at once.`,
    () => 'A twist after weeks together is a decision you have to live with in public.',
    ({ s }) => `I think ${s} knew within a day at Casa. The rest was just waiting.`,
    () => 'The person left standing alone did nothing wrong. That is what makes it hard to watch.',
    ({ s }) => `${s} will get a hard time from the public for that.`,
    () => 'Twisting is allowed. Doing it without telling anybody first is what hurts.',
    () => 'Nobody comes back from Casa the same. Some people just come back with somebody else.',
    () => 'The photos will make it worse. They always do.',
  ],
  steal: [
    ({ s }) => `${s} stood up at the fire pit and took somebody else's partner. That takes nerve.`,
    () => 'A steal is the loudest thing you can do in a recoupling.',
    ({ s }) => `I think ${s} had been planning that for days.`,
    () => 'The person who got stolen from will not forget that walk back to the daybeds.',
    () => 'If the other person says yes, the couple was already over.',
    ({ s }) => `The villa will remember what ${s} did at the next recoupling.`,
    () => 'I have been stolen from. You smile, and you want the ground to swallow you.',
    () => 'Steals make great television and terrible friendships.',
  ],
  'bottom-couples': [
    ({ s }) => `${s} in the bottom is a surprise to me, and to them.`,
    () => 'The public vote for what they see, and they have not seen enough of some couples.',
    () => 'Being in the bottom is the loneliest feeling at the fire pit.',
    ({ s }) => `I think ${s} will come through this closer to their partner.`,
    () => 'A bottom placing says more about screen time than about the couple.',
    () => 'The public can tell when a couple is only together to stay in the villa.',
    ({ s }) => `If ${s} survives this, it could be the making of them.`,
    () => 'Nobody enjoys hearing where they came. You find out what the country thinks of you.',
  ],
  dumped: [
    ({ s }) => `${s} has been dumped from the island, and the villa will feel it.`,
    () => 'It is fast. You are at the fire pit, and then your suitcase is by the door.',
    ({ s }) => `${s} handled it with a lot of grace.`,
    () => 'The goodbyes tell you who the real friends in there are.',
    ({ s }) => `I think ${s} will do very well on the outside.`,
    () => 'Every dumping changes who couples up with whom next week.',
    () => 'Being left single at the wrong moment is the cruellest part of that show.',
    ({ s }) => `The villa is quieter without ${s} already.`,
  ],
  walked: [
    ({ s }) => `${s} walked. That is a decision, not a defeat.`,
    () => 'Leaving on your own terms is harder than being dumped.',
    ({ s }) => `I think ${s} had been thinking about it for a few days.`,
    () => 'The villa is not for everybody, and it is brave to say so.',
    () => 'Whoever is left behind will need their friends tonight.',
    ({ s }) => `I hope ${s} is looked after on the outside. It is a lot to go through.`,
    () => 'A walk always shakes the villa more than a dumping does.',
    () => 'Nobody signs up expecting to leave early. It is never an easy call.',
  ],
  envelope: [
    ({ s }) => `${s} opened the envelope, and the whole studio went quiet.`,
    () => 'Split or steal is the last test, and the only one with money on it.',
    ({ s }) => `I think ${s} knew the answer before the envelope was handed over.`,
    () => 'Nobody thinks about stealing until the envelope is in their hand.',
    () => 'That decision will follow them around for years, whichever way it went.',
    ({ s }) => `${s} did not even hesitate, which is the answer that matters.`,
    () => 'The public love a couple who split without thinking twice.',
    () => 'The envelope is where you find out who was in it for the right reasons.',
  ],
};

// ── the villa's regulars ──────────────────────────────────────────────────
export const PERSONAS = [
  {
    handle: '@firepitminutes', name: 'dee', since: 4, archetype: 'analyst',
    voice: { caps: 0.1, emoji: 0.2, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2, feelings: {},
  },
  {
    handle: '@grafterwatch', name: 'lou', since: 2, archetype: 'hater',
    voice: { caps: 0.3, emoji: 0.3, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.55, feelings: {},
  },
  {
    handle: '@stuckforlife', name: 'rae', since: 3, archetype: 'stan',
    voice: { caps: 0.55, emoji: 0.75, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.85, feelings: {},
  },
  {
    handle: '@villalivefeed', name: 'sam', since: 5, archetype: 'livefeeder',
    voice: { caps: 0.2, emoji: 0.4, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.4, feelings: {},
  },
  {
    handle: '@casatwistcounter', name: 'jo', since: 1, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.6, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.9, feelings: {},
  },
  {
    handle: '@weeknightviewer', name: 'pat', since: 6, archetype: 'casual',
    voice: { caps: 0.05, emoji: 0.3, length: 'short', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.3, feelings: {},
  },
  {
    handle: '@closedoffcouples', name: 'mia', since: 2, archetype: 'shipper',
    voice: { caps: 0.35, emoji: 0.8, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.6, feelings: {},
  },
];
