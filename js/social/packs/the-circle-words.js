// js/social/packs/the-circle-words.js
// What the Circle's fandom says, and who says it.
//
// DATA ONLY. The reader and the topic list live in the-circle.js; this is the
// half a contributor edits to add a line. Same shape as the other packs.
//
// THERE IS NO VOTE AND NO HOUSE. The players live alone and talk through the
// Circle: they rate each other, the top-rated become Influencers, the
// Influencers block somebody. Some players are catfish, and the audience knows.
// The words are ratings, Influencers, blocking, profiles, catfish, the circle
// chat, private chats, group chats, apartments, messages.
//
// Slots: {subject} {actor} {season} {episode} {receipt}. A template naming one
// is only drawn when the event can fill it, so at least half of every pool
// stands on its own.

export const PHRASINGS = {

  // ── the ratings ───────────────────────────────────────────────────────────

  'ratings-reaction': {
    'live-reaction': {
      timeline: [
        'FIRST IN THE RATINGS. {subject} really said thank you very much',
        'the face {subject} made when the number one came up. priceless',
        'nobody saw {subject} topping the ratings and i love that for them',
        'the ratings reveal music still gives me chest pains',
        'first place and you KNOW the screenshots are already going round',
        '{receipt}. the Circle has spoken',
      ],
      chat: [
        'Topping the ratings is lovely for one night and a target for the rest of the season.',
        '{subject} has been charming every private chat for a week. That number did not come from nowhere.',
        'The ratings are a popularity contest that people pretend is a strategy. Both, honestly.',
        'First place usually means you never said a single unkind thing in the circle chat. It works until it does not.',
        'I always look at who rated them first. That tells you where the friendships really are.',
        'Number one is a crown made of glass on this show.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is winning this whole thing and i will not be taking questions',
        'the ratings are rigged by vibes and i respect it',
        'first in the ratings means everyone wants you gone by next week. sorry {subject}',
        'how is {subject} that well liked when half their messages are just emojis',
        'these ratings make no sense and that is why i watch',
        'the person who comes first never wins. check every season',
      ],
      chat: [
        'A first place this early is a warning, not a win. Everybody starts doing the maths.',
        '{subject} is playing the long friendship game. It shows in the ratings.',
        'The people who top the ratings and stay humble go far. The ones who gloat in the circle chat do not.',
        'Ratings tell you who people are scared to lose, not who they like.',
        'I would rather be third every week than first once.',
        'Watch the bottom half of that list. That is where the next alliance comes from.',
      ],
    },
  },

  'influencer-power': {
    'hot-take': {
      timeline: [
        '{subject} as an Influencer is going to be MESSY and i am ready',
        'giving {subject} blocking power was a mistake and everyone will find out',
        'the Influencers already know who they are blocking. they knew before the ratings',
        '{receipt}. somebody is about to have a very bad night',
        'the hangout is going to be the most awkward conversation of the season',
        'Influencer {subject} has a list and it is not a short one',
      ],
      chat: [
        'An Influencer who blocks a friend loses the room. One who blocks a threat loses a friend. There is no clean option.',
        '{subject} has been fair so far. Power changes people on this show.',
        'The hangout is where the real game happens. Everything before it is a rehearsal.',
        'Two Influencers who disagree is the best television this show makes.',
        'I would block the person everybody likes and blame the other Influencer. Not that anybody asked.',
        'Being an Influencer is the moment your whole game becomes visible. Nowhere left to hide.',
      ],
    },
  },

  'bottom-ratings': {
    'live-reaction': {
      timeline: [
        'last in the ratings. {subject} did NOT deserve that',
        'the way {subject} stared at the screen when their profile came up last',
        'bottom of the ratings means the Influencers are already looking',
        'i would have thrown the remote at the wall',
        'how do you come last when you have been nothing but nice to everyone',
        '{receipt}. that one stung',
      ],
    },
    sympathy: {
      timeline: [
        'protect {subject} at all costs. they are the realest one in there',
        'last place does not mean anything, the ratings are just a mood',
        'somebody send {subject} a message that is not about strategy. just a nice one',
        'the loneliness of sitting in that apartment after coming last. no',
        'they will bounce back, the bottom always gets underestimated',
        'i hope {subject} knows the audience loves them even if the Circle does not',
      ],
    },
  },

  // ── blocked ───────────────────────────────────────────────────────────────

  'block-reaction': {
    'live-reaction': {
      timeline: [
        'NOT {subject}. BLOCKED. i cannot',
        'the silence when the screen said blocked. i felt it in my chest',
        '{receipt}. the Circle is colder already',
        'they really blocked {subject} after all those private chats',
        'i was screaming at the screen when the name came up',
        'the goodbye message made me cry and i am not even a crier',
      ],
      chat: [
        'Blocking {subject} was the safe call and the sad call.',
        'You could see that block coming from the ratings. The Influencers barely hesitated.',
        'The ones who get blocked early are usually the ones who said too much in the circle chat.',
        'Every block on this show is someone saying "it is not personal" about something very personal.',
        'I liked {subject}. Being liked is not the same as being needed in there.',
        'Watch who {subject} visits on the way out. That is the real goodbye.',
      ],
    },
    sympathy: {
      timeline: [
        '{subject} deserved so much better than that block',
        'i would watch a whole show of {subject} just living in that apartment',
        'they played honestly and got blocked for it. typical',
        'sending {subject} every good thought. you were the best part of this',
        'the Circle is worse without them and everybody knows it',
        'they were so kind in every chat. that is the saddest part',
      ],
      chat: [
        'Honest players get blocked first on this show. It is not a fair game, it is a social one.',
        '{subject} never once lied in a private chat. That is rare in there.',
        'The goodbye was gracious. That says more than the ratings ever did.',
        'I hope the friendships last after the show. Some of them looked real.',
        'Getting blocked is not losing. It is just the end of the messages.',
        'They would have been a great finalist. Wrong week, wrong Influencers.',
      ],
    },
  },

  // ── catfish ───────────────────────────────────────────────────────────────

  'catfish-reveal': {
    'live-reaction': {
      timeline: [
        'THE CATFISH IS OUT. {receipt}',
        'the gasps when {subject} walked into the room. a different person entirely',
        'i KNEW it. i knew that profile was not real. i said it in week one',
        'catfished for the whole season and nobody had a clue',
        'the photos versus the person. the Circle is shaking',
        'the way the whole circle chat went silent after that reveal',
      ],
      chat: [
        'A catfish who gets this far is the best player in there, whether people like it or not.',
        '{subject} kept that profile going through every private chat. That takes a memory.',
        'The reveal always lands harder on the people who flirted with the profile.',
        'Everybody suspected somebody. Almost nobody suspected the right one.',
        'Catfishing is a strategy, not a crime. On this show, anyway.',
        'I want to know what the real {subject} thought every time they typed as somebody else.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} played a better catfish than half the cast played themselves',
        'catfish should get bonus points for surviving this long. that is skill',
        'the person who flirted with that profile is going to need a minute',
        'honestly the profile was more fun than most of the real ones',
        'every season one catfish is the best player in the building and this is it',
        'it is always the profile with the perfect photos',
      ],
      chat: [
        'The catfish who wins is the one whose fake life has the fewest details. {subject} kept it vague and it worked.',
        'You cannot hate a catfish on this show. The format invites it.',
        'People forgive the lie faster than they forgive being fooled by it.',
        'The reveal changes the ratings for everybody who believed it. Watch next week.',
        'A good catfish is a good listener. They let everybody else talk.',
        'Some catfish play for the money. The good ones play for the story.',
      ],
    },
  },

  'catfish-suspicion': {
    'live-reaction': {
      timeline: [
        'not {actor} calling out {subject} as a catfish in front of everyone',
        'the circle chat when someone says "is anyone else suspicious of" 👀',
        '{receipt}. the paranoia is in full swing',
        'everybody typing and deleting at the same time after that accusation',
        'calling someone a catfish with zero proof is the most Circle thing ever',
        'the way {subject} answered with a selfie. iconic defence',
      ],
    },
    'hot-take': {
      timeline: [
        '{actor} is wrong about {subject} and it is going to cost them',
        'the people shouting catfish loudest are usually the catfish',
        'suspicion is how the ratings move on this show. it has nothing to do with proof',
        'if {subject} is a catfish i will eat my phone',
        'the real catfish is sitting quietly loving every second of this',
        'nobody on this show can tell real from fake and that is the whole point',
      ],
    },
  },

  // ── messages ──────────────────────────────────────────────────────────────

  'circle-flirt-talk': {
    gushing: {
      timeline: [
        '{subject} and {actor} flirting over text is my favourite genre',
        'the winky face. the WINKY FACE. i am deceased',
        'they have never seen each other and they are already in love',
        'the way {subject} read that message out loud with a grin. no notes',
        'two people falling for each other through a screen. cinema',
        '{receipt}. the Circle has a couple',
      ],
    },
    'hot-take': {
      timeline: [
        'flirting with a profile you have never met is the biggest risk on this show',
        '{actor} could be anybody. {subject} is going to get catfished and i will be sad',
        'the flirting is strategy and i will not be convinced otherwise',
        'nobody flirts that hard in week two without a plan',
        'if {subject} and {actor} both make the final the reunion is going to be something',
        'every flirty message is one more rating in the bank',
      ],
    },
  },

  'group-chat-talk': {
    'hot-take': {
      timeline: [
        '{subject} starting a group chat is the first real move of the season',
        'the group chat name alone tells you everything',
        '{receipt}. alliances on this show last exactly one ratings',
        'a group chat with three people and one of them is already lying',
        'the person not invited to that group chat is about to have a bad week',
        'group chats on this show are just private chats with witnesses',
      ],
    },
  },

  'visit-talk': {
    'live-reaction': {
      timeline: [
        '{subject} WALKING INTO {actor} APARTMENT. the screaming',
        'the knock on the door. i stopped breathing',
        '{receipt}. the hug. i am not okay',
        'the face when a blocked player walks in and it is somebody you trusted',
        'the visit is the best part of every episode and nobody can tell me otherwise',
        'meeting in person after weeks of messages. that is the whole show',
      ],
    },
  },

  'new-player-talk': {
    'live-reaction': {
      timeline: [
        'a NEW PLAYER. the Circle just got messier',
        '{subject} walked in with a whole plan you can see it',
        '{receipt}. everybody in there is panicking',
        'the profile photo alone is going to cause problems',
        'new players always get the top ratings for one week. watch',
        'the welcome messages are so fake and i love it',
      ],
    },
    'hot-take': {
      timeline: [
        'a new player this late is either a catfish or a threat. maybe both',
        '{subject} is going to flip the ratings upside down',
        'the newbies always get blocked first. sorry {subject}',
        'the best players are the ones who arrive late and say nothing',
        'everyone being nice to the new player is just everyone checking if they are real',
        'i give {subject} two ratings before they run the place',
      ],
    },
  },

  // ── the winner ────────────────────────────────────────────────────────────

  'circle-winner': {
    'live-reaction': {
      timeline: [
        '{subject} WON THE CIRCLE',
        'the final ratings coming up one by one. my heart',
        'they finally met everybody in person and won the whole thing',
        'i called {subject} from the first profile and nobody believed me',
        '{receipt}. what a season',
        'the hugs at the finale. everybody meeting for the first time. crying',
      ],
      chat: [
        '{subject} won by being the person everybody wanted to keep. That is the whole game.',
        'The final ratings are the most honest moment of the season. Nobody can hide behind a profile anymore.',
        'Winning this show means every finalist rated you near the top. That is a lot of people trusting you.',
        'I would have bet on somebody else in week one. {subject} grew into it.',
        'The finale walk is the best thing this show does. Everybody finally in one room.',
        'A deserved winner. Never the loudest message in the circle chat, always the kindest.',
      ],
    },
    'hot-take': {
      timeline: [
        'the right person won and i will fight anybody who says otherwise',
        'the runner up played better and everyone knows it',
        '{subject} won a popularity contest and that is exactly what this show is',
        'the catfish should have won. i will not be taking questions',
        'the final ratings were too close to call and that is why i loved it',
        'a whole season of messages and it came down to who people liked most. perfect',
      ],
      chat: [
        'The winner of this show is whoever made the other finalists feel safe. {subject} did that.',
        'A popularity game rewards consistency. The winner was the most consistent person in there.',
        'If the final ratings had come a week later, I think it goes differently.',
        'The people who won this show before all had one thing in common: they listened more than they typed.',
        'Second place should hold their head up. Those ratings were close.',
        'I would like to see {subject} play again with a catfish profile. Just to see.',
      ],
    },
  },

  // ── the episode itself ────────────────────────────────────────────────────

  'circle-edit': {
    'hot-take': {
      timeline: [
        'the editors gave one apartment the whole episode and the rest got a single message',
        'more circle chat and less workout montage please',
        'the narrator reading the messages out loud is the funniest part of this show',
        'the music when somebody gets an alert. it gets me every time',
        'whoever picks which private chats air has a favourite and it is obvious',
        'this episode was all ratings and no flirting and i want a refund',
      ],
    },
  },
};

// The alumni room on each moment. `k` is the moment's label, `s` the person.
export const CHAT_TAKES = {
  'top-rated': [
    ({ s }) => `${s} topped the ratings. Enjoy it, because next week everybody wants you gone.`,
    () => 'First place on this show is a crown made of glass.',
    () => 'The ratings tell you who people are scared to lose, not who they like.',
    ({ s }) => `I would keep an eye on ${s}. That many friends is a strategy.`,
    () => 'Topping the ratings without saying one unkind thing in the circle chat is a real skill.',
    () => 'Look at who rated them first. That is where the friendships really are.',
    () => 'The person who comes first early rarely wins. It is a warning.',
    () => 'A good night for one apartment and a long night for the others.',
  ],
  'bottom-rated': [
    ({ s }) => `${s} came last. The Influencers have already noticed.`,
    () => 'Last in the ratings is a lonely place on this show.',
    () => 'The bottom of the ratings is where the best comebacks start.',
    ({ s }) => `If ${s} survives this week, they will play differently.`,
    () => 'Coming last usually means you said one honest thing too many.',
    () => 'The ratings are a mood. Moods change.',
    () => 'One kind private chat can fix a bad rating. They need it tonight.',
    () => 'Nobody comes last because of strategy. They come last because of a feeling.',
  ],
  'made-influencer': [
    ({ s }) => `${s} has blocking power now. That changes how every message reads.`,
    () => 'The hangout is where the real game happens.',
    () => 'An Influencer who blocks a friend loses the room. There is no clean option.',
    () => 'Two Influencers who disagree is the best thing this show makes.',
    ({ s }) => `${s} has been fair so far. Power tests that.`,
    () => 'Being an Influencer makes your whole game visible. Nowhere left to hide.',
    () => 'Everybody types nicer messages to the Influencers. Watch.',
    () => 'The Influencers knew who they would block before the ratings came in.',
  ],
  'blocked': [
    ({ s }) => `${s} got blocked. Being liked is not the same as being needed in there.`,
    () => 'Every block is somebody saying "it is not personal" about something very personal.',
    () => 'The ones who get blocked early usually said too much in the circle chat.',
    ({ s }) => `Watch who ${s} visits on the way out. That is the real goodbye.`,
    () => 'You could see that block coming from the ratings.',
    () => 'The goodbye message tells you who they really were.',
    () => 'Honest players get blocked first on this show. It is a social game.',
    () => 'The apartment goes very quiet after a block. You can feel it through the screen.',
  ],
  'catfish-caught': [
    ({ s }) => `${s} kept that profile alive through every private chat. That takes a memory.`,
    () => 'A catfish who gets this far is one of the best players in there.',
    () => 'The reveal lands hardest on whoever flirted with the profile.',
    () => 'Everybody suspected somebody. Almost nobody suspected the right one.',
    () => 'Catfishing is a strategy on this show, not a crime.',
    ({ s }) => `I want to know what ${s} thought every time they typed as somebody else.`,
    () => 'People forgive the lie faster than they forgive being fooled by it.',
    () => 'The good catfish keep their fake life vague. Fewer details, fewer slips.',
  ],
  'fake-suspected': [
    ({ s }) => `Calling ${s} a catfish with no proof is a big swing.`,
    () => 'The people shouting catfish loudest are usually the catfish.',
    () => 'Suspicion moves the ratings more than any fact on this show.',
    () => 'Nobody in there can tell real from fake. That is the whole format.',
    ({ s }) => `If ${s} is real, that accusation is going to cost somebody.`,
    () => 'The real catfish is sitting quietly enjoying every second of this.',
    () => 'A selfie is the only defence anybody has in there.',
    () => 'Paranoia is contagious in a circle chat.',
  ],
  'circle-flirt': [
    ({ s }) => `${s} is flirting with a profile they have never met. That is a risk.`,
    () => 'Flirting over text is the most human thing that happens in there.',
    () => 'Every flirty message is a rating in the bank.',
    ({ s }) => `I think ${s} knows exactly what this could cost if the profile is fake.`,
    () => 'Two people falling for each other through a screen. Lovely, and terrifying.',
    () => 'If it lasts past the finale, I will be very impressed.',
    () => 'Nobody flirts that hard without at least a small plan.',
    () => 'The winky face is doing a lot of work on this show.',
  ],
  'group-chat-formed': [
    ({ s }) => `${s} starting a group chat is the first real move of the season.`,
    () => 'Alliances on this show last exactly one ratings.',
    () => 'A group chat is a private chat with witnesses.',
    () => 'The person not invited is about to have a very bad week.',
    ({ s }) => `I would not trust everybody in ${s}'s group chat.`,
    () => 'Group chats leak. They always leak.',
    () => 'The name of the group chat tells you how serious it is.',
    () => 'Three people in a group chat and one of them is already lying.',
  ],
  'blocked-visit': [
    ({ s }) => `${s} walking into that apartment is the moment the season was building to.`,
    () => 'The knock on the door is the best thing this show does.',
    () => 'Meeting in person after weeks of messages changes everything.',
    () => 'The visit always goes to whoever they trusted most, or whoever they need to warn.',
    ({ s }) => `What ${s} says in that apartment will move the ratings.`,
    () => 'A blocked player gets one message they can deliver face to face. It matters.',
    () => 'You can tell everything from the hug, or the lack of one.',
    () => 'The person who gets visited always looks guilty, even when they are not.',
  ],
  'new-arrival': [
    ({ s }) => `${s} arriving now shakes up every alliance in there.`,
    () => 'A new player this late is either a catfish or a threat. Maybe both.',
    () => 'New players always get the top ratings for one week.',
    () => 'The welcome messages are everybody checking if the newcomer is real.',
    ({ s }) => `I give ${s} two ratings before they run the place.`,
    () => 'The best late arrivals say nothing for a week and listen.',
    () => 'Everybody being nice to the new player is everybody being nervous.',
    () => 'A newcomer has no history. On this show, that is an advantage.',
  ],
};

// The Circle's regulars: the people who watch every rating and post about it.
export const PERSONAS = [
  {
    handle: '@ratingsrecap', name: 'jo', since: 3, archetype: 'analyst',
    voice: { caps: 0.1, emoji: 0.2, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2, feelings: {},
  },
  {
    handle: '@circlemessagesend', name: 'pip', since: 2, archetype: 'livefeeder',
    voice: { caps: 0.2, emoji: 0.5, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.4, feelings: {},
  },
  {
    handle: '@catfishhunter', name: 'rae', since: 4, archetype: 'hater',
    voice: { caps: 0.3, emoji: 0.3, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.55, feelings: {},
  },
  {
    handle: '@winkyfacegang', name: 'lou', since: 1, archetype: 'shipper',
    voice: { caps: 0.35, emoji: 0.8, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.6, feelings: {},
  },
  {
    handle: '@blockedbyvibes', name: 'tam', since: 2, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.6, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.9, feelings: {},
  },
  {
    handle: '@apartmentfour', name: 'dee', since: 5, archetype: 'stan',
    voice: { caps: 0.5, emoji: 0.7, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.8, feelings: {},
  },
];
