// js/social/packs/the-challenge-words.js
// What the Challenge's fandom says, and who says it.
//
// DATA ONLY. The reader and the topic list live in the-challenge.js; this is
// the half a contributor edits to add a line. Same shape as the other packs.
//
// A DAILY, A HOUSE VOTE, THE ARENA, A FINAL. The players win dailies, the
// house votes people into the Arena, somebody calls out an opponent, the loser
// of the Arena goes home, and the season ends on a final with champions. TJ
// hosts. There is no jury and no tribe, and nobody is "voted out": they lose
// the Arena.
//
// Slots: {subject} {actor} {season} {episode} {receipt}. A template naming one
// is only drawn when the event can fill it, so at least half of every pool
// stands on its own.

export const PHRASINGS = {

  // ── the daily ─────────────────────────────────────────────────────────────

  'daily-talk': {
    'live-reaction': {
      timeline: [
        'WON THE DAILY. {subject} is untouchable this week',
        'the way {subject} sprinted to the finish like rent was due',
        'nobody saw that daily win coming and i love it',
        'that daily was terrifying and they made it look like a warm up',
        'safe AND in charge of the vote. the power trip starts now',
        '{receipt}. the house is about to get very friendly with them',
      ],
      chat: [
        'Winning the daily is safety and a target in the same breath.',
        '{subject} has been quietly good at every daily. Nobody is talking about it yet.',
        'The daily winners decide who goes in. Watch who suddenly wants to be their friend.',
        'A daily win this early buys a week, not a season.',
        'Some players win dailies to be safe. Some win them to get somebody out. Different energy.',
        'The vets know the dailies are the cheapest way through. The rookies learn it the hard way.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is winning this whole season and i will not be taking questions',
        'winning the daily and then throwing your friend in is the most Challenge thing possible',
        'the daily was rigged for the big players and everybody knows it',
        '{subject} wins one daily and suddenly has opinions about everybody',
        'calling it, the daily winner makes a mistake at the vote',
        'that daily separated the competitors from the people who came for a holiday',
      ],
      chat: [
        'Power on this show is about what you do with the vote, not the daily itself.',
        '{subject} is a better competitor than politician. The vote will show it.',
        'The house treats a daily winner like a landlord for a week.',
        'I would rather lose the daily and stay out of the conversation.',
        'A daily win is a megaphone. Some people use it to whisper.',
        'Dailies are where you earn respect. The Arena is where you keep it.',
      ],
    },
  },

  // ── the house vote ────────────────────────────────────────────────────────

  'arena-vote-talk': {
    'live-reaction': {
      timeline: [
        'THE HOUSE VOTED {subject} INTO THE ARENA. the betrayal',
        'the faces when the votes were read. every single one of them knew',
        '{receipt}. not one of them could look {subject} in the eye',
        'they really threw {subject} in after all those promises',
        'the deliberation was shouting and the vote was silence. iconic',
        'TJ reading the votes with that face. you knew it was over',
      ],
      chat: [
        'Every house vote is a test of who you told the truth to.',
        '{subject} going in was decided at the pool two days ago.',
        'The house always picks the person who would win an Arena least, unless they are scared of them.',
        'A house vote tells you who has friends and who has just been friendly.',
        'You can win every daily and still get thrown in. That is the politics.',
        'Watch who votes against their own alliance. That is next week.',
      ],
    },
    complaint: {
      timeline: [
        'throwing {subject} in was cowardly and the whole house knows it',
        'the house always goes after the rookies. so predictable',
        'you vote in the person you are scared of, not the person you can beat',
        'that vote had nothing to do with the game and everything to do with a grudge',
        'they promised {subject} safety at dinner and then this',
        'the house acting shocked when {subject} wins the Arena next week. watch',
      ],
      chat: [
        'That vote was personal and they will pretend it was strategy.',
        '{subject} did not deserve that. The house took the easy target.',
        'If you are going to throw someone in, at least say it to their face.',
        'The house picked the safest name, which is rarely the smartest one.',
        'That vote will come back on somebody. It always does on this show.',
        'You can tell a house vote is weak when nobody wants to explain it.',
      ],
    },
  },

  'flip-talk': {
    'live-reaction': {
      timeline: [
        '{subject} FLIPPED. in front of everybody',
        'the gasp when {subject} said the other name',
        '{receipt}. the alliance is finished',
        'not {subject} looking {actor} dead in the eye while flipping',
        'the flip nobody saw coming. i had to pause it',
        'that vote just ended at least two friendships',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} flipping is the smartest move of the season and everyone hates it',
        'the flip was planned at the pool, do not let them tell you otherwise',
        'you cannot flip on {actor} and expect to sleep easy in that house',
        'a flip this early means {subject} has a bigger plan',
        'flippers always end up in the Arena eventually. always',
        'loyalty on this show lasts exactly until the vote',
      ],
    },
  },

  'callout-talk': {
    'live-reaction': {
      timeline: [
        '{subject} CALLED OUT {actor}. the whole room went quiet',
        'the call-out with that much confidence. i am shaking',
        '{receipt}. that is a statement',
        'calling out the biggest threat in the house. absolute nerve',
        'the way {actor} just smiled when their name was called',
        'TJ looking at the two of them like he had waited all season for it',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} picked the wrong person and is about to find out',
        'calling out {actor} is either genius or a very short flight home',
        'the call-out was about a grudge and everybody knows it',
        'you call out the person you can beat, not the person you hate',
        '{subject} just made the season interesting',
        'that call-out was planned since the first party',
      ],
    },
  },

  // ── the Arena ─────────────────────────────────────────────────────────────

  'arena-result': {
    'live-reaction': {
      timeline: [
        '{subject} WON THE ARENA. elimination beast behaviour',
        'the scream when {subject} crossed the line',
        '{receipt}. walking back into that house like a villain in a film',
        'nobody wanted to see {subject} come back to the house tonight',
        'that Arena was brutal and they made it look easy',
        'the house is going to be very quiet when {subject} walks in',
      ],
      chat: [
        'Winning an Arena changes how the house talks about you overnight.',
        '{subject} came back from the Arena with a list. Everybody in that house knows it.',
        'The best Arena players are the ones who stay calm when it gets ugly.',
        'Every Arena win is a message to whoever voted you in.',
        'That was a real fight. Both of them left everything in there.',
        'Some players are built for the dailies. {subject} is built for the Arena.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is the elimination beast of the season and the house just made them stronger',
        'the house voted the wrong person in and now they have to live with them',
        'every Arena win is revenge served with sand on it',
        '{actor} never stood a chance and everyone knew it',
        'one more Arena win and {subject} runs that house',
        'the house created this monster',
      ],
      chat: [
        'Winning an Arena after being voted in is the best feeling on this show. And the most dangerous.',
        'The house will think twice before voting {subject} in again.',
        'It was closer than it looked. {actor} nearly had it at the end.',
        'Arena wins pile up. By the third, people stop voting you in.',
        'The house made a strategic mistake and an emotional one at the same time.',
        'Respect to both of them. That game was cruel.',
      ],
    },
  },

  'arena-exit': {
    'live-reaction': {
      timeline: [
        'NOT {subject}. not like this',
        'the walk away from the Arena when you know it is over. i cannot',
        '{receipt}. the house lost a real one tonight',
        'TJ doing the serious goodbye. you knew',
        'they gave everything in that Arena and it was not enough',
        'the hug at the end. both of them were destroyed',
      ],
      chat: [
        'Losing the Arena is the loneliest walk on this show.',
        '{subject} lost the Arena at the vote, not in the game.',
        'You can be the strongest person in the house and still draw the wrong game.',
        'The goodbye tells you who they were in that house.',
        'They will be back. Good competitors always come back.',
        'It is never one mistake. It is the vote, the game and a bad day together.',
      ],
    },
    sympathy: {
      timeline: [
        'protect {subject} at all costs. they deserved more episodes',
        'that elimination hurt and i do not even like them that much',
        'they never once gave up in that Arena',
        'somebody bring {subject} back on the next season immediately',
        'the season is worse without them and everybody knows it',
        'i hope {subject} knows the fans saw how hard they fought',
      ],
      chat: [
        'They played with heart. That does not always survive a house vote.',
        '{subject} took it with real class. That says everything.',
        'A loss in a bad game draw is not a loss of respect.',
        'I hope they get another season. They were made for this show.',
        'They went down fighting. Nobody can take that from them.',
        'I would take them on my team over half the house.',
      ],
    },
  },

  'walkout-talk': {
    'live-reaction': {
      timeline: [
        '{subject} LEFT. i genuinely did not see that coming',
        '{receipt}. the house is in shock',
        'walking out in the middle of a season. wow',
        'the empty bed the next morning. so sad',
        'TJ telling the house with that face. heavy',
        'everybody pretending they were not relieved',
      ],
    },
    sympathy: {
      timeline: [
        'whatever happened, i hope {subject} is okay',
        'nobody knows what that house is really like. be kind',
        'leaving takes more courage than people think',
        'their health matters more than any final',
        'i will miss {subject} in this season. they were fun',
        'sending {subject} love. this show takes a lot out of people',
      ],
    },
  },

  // ── the house ─────────────────────────────────────────────────────────────

  'house-fight-talk': {
    'live-reaction': {
      timeline: [
        '{subject} AND {actor} ARE FIGHTING fighting',
        'the screaming in the kitchen. the whole house came running',
        '{receipt}. i need a minute',
        'not the glasses flying again',
        'that fight had been building since the first party',
        'production running in to hold people back. classic Challenge',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is right and {actor} knows it',
        'that fight was strategic and i will not be convinced otherwise',
        'whoever loses that fight is the next one voted into the Arena',
        'the house always picks a side and the wrong side goes home',
        'honestly they needed to get that out before the vote',
        'it was never about the dishes',
      ],
    },
  },

  'hookup-talk': {
    gushing: {
      timeline: [
        '{subject} and {actor}. that is it, that is the post',
        'a Challenge showmance in this economy. i support it',
        'the way they look at each other across the dinner table',
        '{receipt}. the house is buzzing',
        'they would be unstoppable as a team in the final. imagine',
        'i would watch a whole spin-off of these two',
      ],
    },
    'hot-take': {
      timeline: [
        'a showmance is a voting bloc of two and the house knows it',
        '{subject} is going to lose an Arena over this and it will be worth it',
        'the second one of them goes in, the other one falls apart',
        'their exes are watching and they are not happy',
        'every Challenge showmance either wins the final or ends at the reunion',
        'everybody pretending they did not see that. we all saw that',
      ],
    },
  },

  'alliance-crack': {
    'live-reaction': {
      timeline: [
        '{subject} broke the deal. with {actor}. on camera',
        'the alliance lasted exactly one vote',
        '{receipt}. the trust is gone',
        'the look {actor} gave when they found out. chills',
        'every power alliance falls apart eventually and this one fell fast',
        'they shook hands on it two days ago',
      ],
    },
    'hot-take': {
      timeline: [
        'breaking that deal was the smartest thing {subject} has done all season',
        '{actor} will remember this at every vote from now on',
        'deals on this show are worth less than the paper they are not written on',
        'the power alliance is finished and the floaters are celebrating',
        'betray an alliance on this show and you have one Arena left',
        'loyalty is a strategy until it stops working',
      ],
    },
  },

  // ── the champions ─────────────────────────────────────────────────────────

  'champions-talk': {
    'live-reaction': {
      timeline: [
        '{subject} WON THE CHALLENGE',
        'that final was brutal and they never stopped',
        '{receipt}. champions',
        'TJ handing over the money and pretending he is not emotional',
        'i called {subject} from the first daily and nobody listened',
        'crossing that last line with nothing left. what a final',
      ],
      chat: [
        'A final on this show is days of punishment. Winning it says everything.',
        '{subject} earned that. No luck in that last stage.',
        'The champions are the ones who still had something left on the last day.',
        'I have watched a lot of finals. That was one of the hard ones.',
        'Every finalist deserves respect after that. The champions deserve the money.',
        'The house votes, the Arenas, the final. They survived all of it.',
      ],
    },
    'hot-take': {
      timeline: [
        'the right person won and i will fight anybody who says otherwise',
        'the runner up was robbed by one checkpoint',
        '{subject} was the best competitor since the first daily',
        'the final was too short and i will not be taking questions',
        'a champion who never went into the Arena is a different kind of champion',
        'everyone pretending they did not cry at that finish. i did',
      ],
      chat: [
        'The champions paced the final. Everybody else sprinted the first stage.',
        'If the final had one more stage, it could have gone the other way.',
        '{subject} kept their head when the others fell apart. That is the whole final.',
        'You win this show by being good at everything and great at the last day.',
        'The runners up should hold their heads up. That was close.',
        'I would like to see them defend it. They were made for this show.',
      ],
    },
  },

  // ── the episode itself ────────────────────────────────────────────────────

  'challenge-edit': {
    'hot-take': {
      timeline: [
        'too much partying, not enough challenge this week',
        'the editors gave one alliance the whole episode and the rest got a single shot at the pool',
        'TJ deadpanning at the Arena is the funniest part of this show and nobody talks about it',
        'the music when the Arena lights come on. somebody give the editor a raise',
        'whoever designed that daily has a grudge against everybody\'s knees',
        'this episode was all house drama and i am not complaining',
      ],
    },
  },
};

// The alumni room on each moment. `k` is the moment's label, `s` the person.
export const CHAT_TAKES = {
  'daily-won': [
    ({ s }) => `${s} won the daily. Watch who wants to be their friend tonight.`,
    () => 'A daily win buys a week, not a season.',
    () => 'Safety and a target in the same breath.',
    ({ s }) => `${s} is a better competitor than politician. The vote will show it.`,
    () => 'The house treats a daily winner like a landlord for a week.',
    () => 'Some people win dailies to be safe. Some win them to get somebody out.',
    () => 'Dailies are where you earn respect. The Arena is where you keep it.',
    () => 'The vets know the dailies are the cheapest way through.',
  ],
  'voted-in': [
    ({ s }) => `${s} going in was decided at the pool two days ago.`,
    () => 'Every house vote is a test of who you told the truth to.',
    () => 'A house vote tells you who has friends and who has just been friendly.',
    ({ s }) => `If ${s} wins this Arena, the house has a problem.`,
    () => 'The house picked the safest name, which is rarely the smartest one.',
    () => 'You can win every daily and still get thrown in. That is the politics.',
    () => 'Watch who votes against their own alliance. That is next week.',
    () => 'That vote will come back on somebody. It always does.',
  ],
  'house-flip': [
    ({ s }) => `${s} flipped. That is a decision you cannot take back.`,
    () => 'Loyalty on this show lasts exactly until the vote.',
    () => 'A flip that early means a bigger plan.',
    ({ s }) => `${s} will not sleep easy in that house tonight.`,
    () => 'Flippers always end up in the Arena eventually.',
    () => 'The flip was planned at the pool. They always are.',
    () => 'One vote just ended at least two friendships.',
    () => 'The person who got flipped on remembers it at every vote after.',
  ],
  'called-out': [
    ({ s }) => `${s} just made the season interesting.`,
    () => 'You call out the person you can beat, not the person you hate.',
    () => 'A call-out is a statement to the whole house.',
    ({ s }) => `If ${s} picked wrong, it is a very short flight home.`,
    () => 'The call-out was about a grudge. They usually are.',
    () => 'Calling out the biggest threat takes nerve. Or a very good plan.',
    () => 'TJ loves a call-out. You can see it on his face.',
    () => 'The person who gets called out and smiles is the dangerous one.',
  ],
  'arena-won': [
    ({ s }) => `${s} came back from the Arena with a list.`,
    () => 'Winning an Arena changes how the house talks about you overnight.',
    () => 'Every Arena win is a message to whoever voted you in.',
    ({ s }) => `The house will think twice before throwing ${s} in again.`,
    () => 'Arena wins pile up. By the third, people stop voting you in.',
    () => 'The best Arena players stay calm when it gets ugly.',
    () => 'The house made a mistake and now they have to live with it.',
    () => 'That game was cruel. Respect to both of them.',
  ],
  'arena-out': [
    ({ s }) => `${s} lost the Arena at the vote, not in the game.`,
    () => 'Losing the Arena is the loneliest walk on this show.',
    () => 'You can be the strongest in the house and still draw the wrong game.',
    ({ s }) => `I liked ${s}. Strong, kind, unlucky with the draw.`,
    () => 'The goodbye tells you who they were in that house.',
    () => 'Good competitors come back. They always come back.',
    () => 'It is never one mistake. It is the vote, the game and a bad day together.',
    () => 'They went down fighting. Nobody takes that away.',
  ],
  'left-game': [
    ({ s }) => `Whatever happened, I hope ${s} is okay.`,
    () => 'Nobody at home knows what that house is really like.',
    () => 'Leaving takes more courage than people think.',
    () => 'Health matters more than any final.',
    ({ s }) => `The house will be different without ${s}, for better or worse.`,
    () => 'Everybody pretends they were not relieved. Some of them were.',
    () => 'An empty bed in that house changes the vote math overnight.',
    () => 'This show takes a lot out of people. Be kind.',
  ],
  'house-fight': [
    ({ s }) => `${s} said the thing that had been building since the first party.`,
    () => 'It was never about the dishes.',
    () => 'Whoever loses that fight is the next one voted into the Arena.',
    () => 'The house always picks a side, and the wrong side goes home.',
    ({ s }) => `I would give ${s} a night's sleep before judging anything.`,
    () => 'Production running in to hold people back. A classic.',
    () => 'Tired, hungover people say true things.',
    () => 'A fight before a vote is always about the vote.',
  ],
  'house-hookup': [
    ({ s }) => `${s} found somebody in the house. That never makes the vote easier.`,
    () => 'A showmance is a voting bloc of two, and the house knows it.',
    () => 'It is sweet until one of them gets voted in.',
    ({ s }) => `I think ${s} knows exactly what this could cost.`,
    () => 'Their exes are watching. Somewhere, somebody is furious.',
    () => 'Every Challenge showmance either wins the final or ends at the reunion.',
    () => 'Everybody pretends not to notice, and everybody notices.',
    () => 'If it lasts past the final, I will be very impressed.',
  ],
  'alliance-broken': [
    ({ s }) => `${s} broke the deal. The whole house will hear about it by breakfast.`,
    () => 'Deals on this show are worth less than the paper they are not written on.',
    () => 'Every power alliance falls apart. This one fell fast.',
    () => 'Betray an alliance and you have one Arena left.',
    ({ s }) => `I would not want to be ${s} at the next vote.`,
    () => 'Loyalty is a strategy until it stops working.',
    () => 'The floaters are celebrating tonight.',
    () => 'They shook hands on it two days ago. Two.',
  ],
};

// The Challenge's regulars: the people who watch every daily and post about it.
export const PERSONAS = [
  {
    handle: '@arenaresults', name: 'cass', since: 3, archetype: 'analyst',
    voice: { caps: 0.1, emoji: 0.2, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2, feelings: {},
  },
  {
    handle: '@dailywinwatch', name: 'nico_b', since: 2, archetype: 'livefeeder',
    voice: { caps: 0.2, emoji: 0.4, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.4, feelings: {},
  },
  {
    handle: '@floaterspotter', name: 'vic', since: 4, archetype: 'hater',
    voice: { caps: 0.3, emoji: 0.3, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.55, feelings: {},
  },
  {
    handle: '@finalpartners', name: 'mae', since: 1, archetype: 'shipper',
    voice: { caps: 0.35, emoji: 0.8, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.6, feelings: {},
  },
  {
    handle: '@kitchenbrawls', name: 'jax', since: 2, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.6, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.9, feelings: {},
  },
  {
    handle: '@eliminationbeastfan', name: 'rio', since: 5, archetype: 'stan',
    voice: { caps: 0.5, emoji: 0.7, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.8, feelings: {},
  },
];
