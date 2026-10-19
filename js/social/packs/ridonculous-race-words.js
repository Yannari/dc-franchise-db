// js/social/packs/ridonculous-race-words.js
// What the race's fandom says, and who says it.
//
// DATA ONLY. The reader and the topic list live in ridonculous-race.js; this is
// the half a contributor edits to add a line. Same shape as the other packs.
//
// THERE IS NO VOTE. Teams of two race leg by leg around the world; the last
// team to the Chill Zone may be eliminated, and a non-elimination leg lets the
// last team stay. Nobody is nominated or voted out, there is no house and no
// jury, and the people racing are racers or teams.
//
// Slots: {subject} {actor} {season} {episode} {receipt}. {subject} and {actor}
// are the two people of a team (or the two people of a moment). A template
// naming one is only drawn when the event can fill it, so at least half of
// every pool stands on its own.

export const PHRASINGS = {

  // ── first to the mat ──────────────────────────────────────────────────────

  'leg-win-talk': {
    'live-reaction': {
      timeline: [
        'FIRST TO THE MAT. {subject} and {actor} did not even look tired',
        'the way {subject} jumped on that mat like it owed them money',
        'first place and they still had time to argue about the cab fare',
        'nobody saw that leg win coming and i love it',
        'ok that was a proper run. no luck in it at all',
        '{receipt}. the rest of the teams were not even close',
      ],
      chat: [
        'Winning a leg is mostly about not losing time anywhere. They never had a bad hour.',
        '{subject} and {actor} read every tip properly. That is half the race, honestly.',
        'The teams that win legs are the ones who stop arguing first.',
        'I remember winning one. You feel invincible for about a day.',
        'First place buys you a head start and a target on your back.',
        'They got lucky with the flight, but they used it. Plenty of teams waste the luck.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} and {actor} are winning this whole thing and i will not be taking questions',
        'the team that wins the leg always gets cocky and the next one humbles them',
        'first place on a leg means nothing if you cannot read a map. we shall see',
        'everybody acting surprised like they have not been fast since the start',
        'calling it now, a leg win is the best thing and the worst thing that happened to them',
        '{receipt} and suddenly every other team is watching them at the airport',
      ],
      chat: [
        'A leg win is a good day, not a good season. Ask any team that won one and went out the next week.',
        '{subject} has the calm the others do not. That carries further than speed.',
        'I would not want to be them at the next airport. Everybody will follow them.',
        'The prize matters less than the start. They leave first, and leaving first is a lot.',
        'If they keep this up, they will need friends. Fast teams make enemies without trying.',
        'Winning early is fine. Winning late is what counts.',
      ],
    },
  },

  // ── the last team ─────────────────────────────────────────────────────────

  'race-elimination': {
    'live-reaction': {
      timeline: [
        'NOT {subject} AND {actor}. not like this',
        'the walk onto the mat when you already know. i cannot',
        'Don doing the serious face. you knew it was over',
        'they were so close. a cab. it came down to one cab',
        'i genuinely thought they would make the next flight',
        '{receipt}. the race lost a good team tonight',
      ],
      chat: [
        'Last to the mat is the worst walk in the show. Everybody is already sitting down.',
        '{subject} and {actor} lost it at the airport, not at the mat.',
        'You can do every challenge right and still go home because of a taxi. That is the race.',
        'I always watch the hug. The teams that hug at the end were a real team.',
        'They will be fine. Going out as a team is easier than going out alone.',
        'It is never one mistake. It is three small ones on the same day.',
      ],
    },
    sympathy: {
      timeline: [
        'protect {subject} and {actor} at all costs. they deserved more legs',
        'i hope they get to see the places they missed one day',
        'that goodbye made me sad and i do not even like them that much',
        'they never once gave up even when the tip made no sense',
        'somebody give them a holiday. a slow one',
        'the race is worse without them and everybody knows it',
      ],
      chat: [
        'They were kind to every team. That does not win legs, but people remember it.',
        '{subject} kept smiling right up to the mat. That takes something.',
        'It is hard to go home when you got along. The fighting teams take it easier.',
        'I hope they keep in touch with the friends they made out there. That is the real prize.',
        'A team like that comes back stronger if they get another go.',
        'I would have taken them over half the teams still in it.',
      ],
    },
  },

  // ── last, and still in ────────────────────────────────────────────────────

  'last-but-safe': {
    'live-reaction': {
      timeline: [
        'NON-ELIMINATION LEG. {subject} and {actor} live to race another day',
        'the relief on their faces when Don said it. i screamed',
        'came in dead last and still standing. the luck on this team',
        'they really got the one leg where nobody goes home',
        'Don dragging out the pause just to be cruel',
        '{receipt}. the universe likes them',
      ],
    },
    'hot-take': {
      timeline: [
        'a non-elimination leg is a warning, not a reward. they need to wake up',
        'the penalty next leg is going to hurt and they know it',
        '{subject} and {actor} have used up every bit of luck they had',
        'last place twice in a row and still here. respect the stubbornness',
        'if they are last again they cannot complain. they got their second chance',
        'the other teams are furious they are still here and honestly fair',
      ],
    },
  },

  // ── a team falls apart ────────────────────────────────────────────────────

  'meltdown-watch': {
    'live-reaction': {
      timeline: [
        'oh no {subject} and {actor} are FIGHTING fighting',
        'the silence after that argument was louder than the argument',
        'you could see it coming from the airport',
        'not them shouting in the middle of a crowded square',
        'that is the most honest thing anybody has said on this show',
        '{receipt}. i need a minute',
      ],
      chat: [
        'Every team has one of those days. The question is whether they talk on the plane.',
        '{subject} said the thing that had been building since the first leg.',
        'Tired people say true things. That is what makes it hard to watch.',
        'The best teams fight and then fix it within the hour. Watch the next challenge.',
        'You can hear when it is about the race and when it is about years of something else.',
        'I have been that tired. You say things you would never say at home.',
      ],
    },
    'hot-take': {
      timeline: [
        'they are not making it past two more legs like this',
        '{subject} is right and {actor} knows it',
        'honestly they needed that fight. they will race better now',
        'the race does not break teams. it shows you what was already broken',
        'if they can survive that they can survive anything',
        'i would have walked off at the second sentence',
      ],
      chat: [
        'Teams that never argue are hiding something. At least they said it out loud.',
        '{subject} wants to win more than {actor} does, and that is the whole fight.',
        'The fight was about the map. The map was never the problem.',
        'If they make up properly, they will be one of the strong teams again.',
        'Watch how they check in. You can tell everything from where they stand on the mat.',
        'Long legs turn small things into big things. Give them a night.',
      ],
    },
  },

  // ── one team goes after another ───────────────────────────────────────────

  'sabotage-reaction': {
    'live-reaction': {
      timeline: [
        'SABOTAGE. {subject} really did that on camera',
        'the cheek of it. in front of everybody',
        'Don is going to see that and i cannot wait',
        'they turned the sign. they actually turned the sign',
        'the other team has no idea yet and that is the worst part',
        '{receipt}. absolutely unhinged behaviour',
      ],
      chat: [
        'There are cameras on every corner of that course. Somebody always forgets.',
        '{subject} decided winning was worth being disliked. That is a choice you cannot take back.',
        'Sabotage works once. After that every team watches you.',
        'The team that got hit will remember it at every airport from now on.',
        'You can race hard without doing that. Plenty of teams do.',
        'I would expect a penalty, or at least a very long stare from Don.',
      ],
    },
    complaint: {
      timeline: [
        'that was so unnecessary. they were already ahead',
        '{subject} has been fake nice since the start line and this proves it',
        'i hope Don hands them the biggest penalty in history',
        'there is racing and there is whatever that was',
        'the way they laughed about it afterwards. no',
        'every team should be helping each other avoid them now',
      ],
      chat: [
        'I do not mind a team that plays hard. I mind one that laughs at the other team losing time.',
        '{actor} did nothing to deserve that.',
        'There is no prize for being the most hated team in the Chill Zone.',
        'If it comes down to a footrace, nobody is going to hold a door for them.',
        'It looks clever for one leg and terrible for the rest of the season.',
        'Somebody should tell them the cameras are always on.',
      ],
    },
  },

  // ── two teams, one crush ──────────────────────────────────────────────────

  'race-romance-talk': {
    gushing: {
      timeline: [
        '{subject} and {actor}. that is it, that is the post',
        'the way they keep ending up at the same airport. fate',
        'romance in the middle of a race around the world is my favourite genre',
        "one of them carried the other one's bag up the stairs while their own team went the other way",
        'i would watch a whole spin off of these two',
        'falling for somebody from another team is the most chaotic thing you can do and i support it',
      ],
    },
    'hot-take': {
      timeline: [
        'their partners are not happy about this and they are right',
        '{subject} is going to lose a leg over a crush and it will be worth it',
        'two teams, one crush, a lot of wasted time at the airport',
        'this is either the cutest thing on the show or a disaster in waiting',
        'the second one of them gets eliminated the other one is going to fall apart',
        'everybody pretending they did not see that. we all saw that',
      ],
    },
  },

  // ── somebody faces a fear ─────────────────────────────────────────────────

  'fear-talk': {
    'live-reaction': {
      timeline: [
        '{subject} DID IT. i am actually crying',
        'the shaking hands and they still went. that is courage',
        'the partner talking them through it was the best part of the episode',
        'i would not have done that for a million dollars. actually i would. but i would cry',
        'nobody could hear the instructions over the screaming and it worked anyway',
        '{receipt}. proud of a stranger',
      ],
    },
    gushing: {
      timeline: [
        'the race is a lot of fun until somebody faces a fear and then it is beautiful',
        '{subject} is my favourite racer now, no notes',
        'you could see what it meant to them when they got to the bottom',
        'the hug afterwards. the HUG',
        'this is why i watch. not the money. this',
        'their partner never once made them feel silly about it',
      ],
    },
  },

  // ── the winners ───────────────────────────────────────────────────────────

  'race-winners': {
    'live-reaction': {
      timeline: [
        '{subject} AND {actor} WON THE RIDONCULOUS RACE',
        'that last footrace. my heart is still going',
        'Don handing over the million and pretending he is not emotional',
        'every team in the stands on their feet. what a finish',
        'i called this team from the first leg and nobody listened',
        '{receipt}. what a race',
      ],
      chat: [
        'They were never the fastest team. They were the team that never lost an hour.',
        '{subject} and {actor} earned that. No luck on the final leg.',
        'The final always comes down to one challenge and one cab. They got both right.',
        'I have watched a lot of finishes. That was one of the good ones.',
        'Every team they raced against was clapping. That tells you something.',
        'A million dollars, and the first thing they did was hug each other. Right winners.',
      ],
    },
    'hot-take': {
      timeline: [
        'the right team won and i will fight anybody who says otherwise',
        'the runners up deserved it more and they know it',
        'a whole season decided by one lake of buoys is so this show',
        '{subject} and {actor} were the best team since the start line',
        'the final leg was too short and i will not be taking questions',
        'everyone pretending they did not cry at that finish. i did',
      ],
      chat: [
        'The winners stayed calm when the others panicked. That was the whole race in one leg.',
        'If the final had one more challenge, it could have gone the other way.',
        '{subject} kept that team together on the worst days. That is why they won.',
        'You win this show at airports, not at challenges.',
        'The runners up should hold their heads up. That was close.',
        'I would like to see them race again. They were made for this.',
      ],
    },
  },

  // ── the episode itself ────────────────────────────────────────────────────

  'race-edit': {
    'hot-take': {
      timeline: [
        'this leg was the best looking episode they have done. the scenery alone',
        'the editors gave one team the whole episode and the rest got a single check-in',
        'Don narrating the bridges is the funniest part of this show and nobody talks about it',
        'too much airport, not enough challenge this week',
        'the music when the last team ran onto the mat. somebody give the editor a raise',
        'whoever planned this route has a grudge against everybody\'s knees',
      ],
    },
  },
};

// The alumni room on each moment. `k` is the moment's label, `s` the person.
export const CHAT_TAKES = {
  'leg-won': [
    ({ s }) => `${s} ran that leg like they had done it before.`,
    () => 'Winning a leg is mostly not wasting time. They never wasted any.',
    () => 'The prize is nice. The head start is what matters.',
    ({ s }) => `I would keep an eye on ${s}. That team is getting dangerous.`,
    () => 'A good cab and a good tip read. That is half of every leg win.',
    () => 'First to the mat means first to the next airport, and everybody follows you.',
    () => 'The teams that win legs early either learn humility or learn it the hard way.',
    () => 'You could see them stop arguing halfway through. That is when they started winning.',
  ],
  'race-out': [
    ({ s }) => `${s} lost that leg at the airport, not at the mat.`,
    () => 'Last to the mat is the longest walk on the show.',
    () => 'It is never one mistake. It is three small ones in the same day.',
    ({ s }) => `I liked ${s}. Kind to everybody. That does not win legs.`,
    () => 'You can do every challenge right and still go home because of a taxi.',
    () => 'The hug at the end told you they were a real team.',
    () => 'Going home as a pair is easier than going home alone. A little.',
    () => 'That team will be watching the rest of this at home, shouting at the screen.',
  ],
  'safe-last': [
    ({ s }) => `${s} came in last and stayed in. That is a warning, not a gift.`,
    () => 'A non-elimination leg buys you a day and a penalty.',
    () => 'The penalty next leg is the part they are not thinking about yet.',
    () => 'Every team that gets a second chance races differently after it.',
    ({ s }) => `If ${s} is last again, there is no Don pause to save them.`,
    () => 'Luck runs out on this show. Usually at an airport.',
    () => 'The other teams will be furious, and they will not say it on camera.',
    () => 'Coming in last and smiling is a skill. They have it.',
  ],
  'team-meltdown': [
    ({ s }) => `${s} said the thing that had been building since the first leg.`,
    () => 'Tired people say true things. That is what makes it hard to watch.',
    () => 'The best teams fight and fix it before the next challenge.',
    () => 'You can always tell when a fight is about the race and when it is about something older.',
    ({ s }) => `I would give ${s} a night's sleep before judging anything.`,
    () => 'The race does not break teams. It shows you what was already cracked.',
    () => 'Watch where they stand on the mat. You can read everything from that.',
    () => 'Long legs turn small things into very big things.',
  ],
  'race-sabotage': [
    ({ s }) => `${s} decided winning was worth being disliked.`,
    () => 'There are cameras on every corner of that course. Somebody always forgets.',
    () => 'Sabotage works once. After that every team watches you.',
    () => 'The team that got hit will remember it at every airport from now on.',
    ({ s }) => `If it comes to a footrace, nobody holds a door for ${s}.`,
    () => 'You can race hard without that. Most teams do.',
    () => 'I would expect a penalty, or a very long stare from Don.',
    () => 'It looks clever for one leg and terrible for the rest of the season.',
  ],
  'race-romance': [
    ({ s }) => `${s} found somebody on another team. That never makes a race easier.`,
    () => 'Two teams and one crush is a lot of time lost at airports.',
    () => 'Their partners are the ones to watch. They are the ones paying for it.',
    () => 'It is sweet until one of them goes home first.',
    ({ s }) => `I think ${s} knows exactly what this could cost.`,
    () => 'Falling for somebody mid-race is the most human thing that can happen out there.',
    () => 'Everybody pretends not to notice, and everybody notices.',
    () => 'If it lasts past the finish line, I will be very impressed.',
  ],
  'fear-faced': [
    ({ s }) => `What ${s} did today was harder than anything on that leg.`,
    () => 'You could see the shaking, and they went anyway. That is courage.',
    () => 'A partner who talks you through it is worth more than speed.',
    ({ s }) => `${s} will remember that moment long after the race.`,
    () => 'The race is fun until somebody faces something real. Then it matters.',
    () => 'Nobody at home will remember the time. They will remember that jump.',
    () => 'The hug at the bottom said everything.',
    () => 'Some teams lose time on fear and gain something better.',
  ],
};

// The race's regulars: the people who watch every leg and post about it.
export const PERSONAS = [
  {
    handle: '@chillzoneclock', name: 'nell', since: 3, archetype: 'analyst',
    voice: { caps: 0.1, emoji: 0.2, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2, feelings: {},
  },
  {
    handle: '@donboxdaily', name: 'kit', since: 2, archetype: 'livefeeder',
    voice: { caps: 0.2, emoji: 0.4, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.4, feelings: {},
  },
  {
    handle: '@lastcabwins', name: 'ozzy', since: 4, archetype: 'hater',
    voice: { caps: 0.3, emoji: 0.3, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.55, feelings: {},
  },
  {
    handle: '@teamtwohearts', name: 'bea', since: 1, archetype: 'shipper',
    voice: { caps: 0.35, emoji: 0.8, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.6, feelings: {},
  },
  {
    handle: '@airportmeltdowns', name: 'zed', since: 2, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.6, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.9, feelings: {},
  },
  {
    handle: '@legbyleg', name: 'amir', since: 5, archetype: 'stan',
    voice: { caps: 0.5, emoji: 0.7, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.8, feelings: {},
  },
];
