// js/social/sampler.js
// The library, out loud.
//
// personas.js says who is watching, topics.js says what they talk about and
// platforms.js says how the two rooms differ. None of that is legible until
// somebody reads fifty posts, so this file turns an event into posts you can
// actually judge.
//
// TWO RULES SHAPE EVERYTHING BELOW.
//
// 1. The two rooms are not one feed with two labels. The TIMELINE is a stadium:
//    lowercase, fragments, no full stops, people shouting past each other. The
//    GROUP CHAT is a hosted room where the hosts PLAYED this game: full
//    sentences, insider vocabulary, warmer on the surface and usually shadier
//    underneath. That difference lives in the phrasings, not in a length knob —
//    a long timeline post would still sound like a timeline post.
//
// 2. Engagement is derived, never rolled. `gs.popularity` has been written every
//    episode since the simulator shipped and shown to nobody. Likes and tomatoes
//    come from how the crowd feels about the person a post is aimed at, so
//    defending somebody the audience has turned on gets you ratioed and dunking
//    on a villain collects likes. That is the entire reason this feature exists.
//
// PLAYERS ARE REFERENCED BY SLUG (`anne-maria`) and rendered capitalised for
// display. Never read voice-profiles.json here — it keys on display name, this
// module works in slugs, and joining them is project 2's problem.
//
// ADDING TO THIS FILE: phrasings are data. A new template is one string in an
// existing array; a new shape is one key. The composer below never needs to
// change. tests/social-hostility.test.js walks PHRASINGS and DECORATIONS, so a
// contribution that crosses the line fails immediately.

import { PERSONAS, feelingsToward } from './personas.js';
import { topicsFor } from './topics.js';
import { platformOf } from './platforms.js';

// ─── the phrasings ─────────────────────────────────────────────────────────
//
// PHRASINGS[topicId][shape][stream] -> string[]
//
// Slots: {subject} {actor} {season} {episode}. A template naming {actor} is
// skipped when the event has no actor, so no post ever renders a hole.
//
// Structure and register are studied from real reality-TV fandom and from
// ChatBCC's hosted-alumni format; no real person's post is reproduced. What is
// borrowed is shape — how long a dunk runs, where the caps land, how a defence
// opens, how a host hedges a prediction — and the strings are written fresh.

export const PHRASINGS = {

  // ── gameplay ──────────────────────────────────────────────────────────────

  'strategy-critique': {
    'hot-take': {
      timeline: [
        'that vote made no sense and every single person in that house knows it',
        'keeping {subject} past this week is how you lose a season',
        'there is no version of this where dragging {subject} to the end is smart',
        '{actor} played the wrong number and nobody in that house told them',
        "explain the strategy. i'll wait. there isn't one",
        "you don't cut {subject} on episode {episode} unless you want to lose",
        'the whole house is playing not to lose and it shows',
        '{subject} was the shield. you do not burn the shield in week {episode}',
      ],
      chat: [
        'The vote is defensible on paper and indefensible in the room. {actor} needed {subject} alive one more week and cut them anyway.',
        'I have played this exact spot. You do not take the shot until you know who inherits the target, and nobody in that house knows.',
        'Strategically this is the week the season turned, and I do not think {actor} understands that yet.',
        'If you are cutting {subject} on episode {episode} you had better already have the next three votes counted. They did not.',
        'Everyone is scoring this on whether it worked. Score it on whether it was the best available option, because it was not close.',
      ],
    },
    'thread-opener': {
      timeline: [
        'thread on why this vote was the single worst decision of season {season}',
        'let me walk you through how {actor} talked themselves into this',
        'quick thread. this house has been playing scared for three weeks straight',
        'ok breaking down the numbers on this one because nobody else is going to',
        'a short list of everybody who should have seen this coming',
        'saying this once and then logging off: the math was right there',
      ],
      chat: [
        'Let me lay the numbers out, because the edit did not. Season {season}, episode {episode}, and there were four ways to play this week.',
        'Going to walk through this vote properly. Start with who was actually at risk, not who the episode told you was at risk.',
        'Watch party notes. Three things happened before that vote that nobody is talking about this morning.',
        'I want to make the unpopular case here, so bear with me for a minute.',
      ],
    },
    'quote-dunk': {
      timeline: [
        '"big move." it was a coin flip with a name on it',
        'calling this strategy is generous. it was panic with a whiteboard',
        'imagine typing this after the vote we all just watched',
        '"i control this house" you controlled one vote and lost the room',
        'the confidence in this post versus the actual tape. astounding',
        'bookmarking this so i can quote it back at the finale',
      ],
      chat: [
        'Respectfully, no. Calling that a big move flattens what actually happened in that room.',
        'People keep saying {actor} controlled this. {actor} was handed this, and there is a difference worth naming.',
        'I have seen this take everywhere today and it does not survive a rewatch.',
        'That read works if you ignore the veto, which is a lot to ignore.',
      ],
    },
  },

  'blindside-reaction': {
    'live-reaction': {
      timeline: [
        'SCREAMING. {subject} had absolutely no idea',
        "{subject}'s face. i am going to be thinking about that for a year",
        'no idea. four weeks of "i run this house" and then that',
        'i genuinely stood up. i am still standing',
        '{subject} walked out mid sentence and i cannot recover',
        'not {subject} thanking the house on the way out. babe they did this to you',
        'we just watched a murder on basic cable',
        'the silence after that vote was read. nobody breathed',
        '{subject} looked at {actor} and you could see it land in real time',
      ],
      chat: [
        'That is the best blindside this format has produced in years, and I say that as somebody who has been on the wrong end of one.',
        'Watch {subject} at the vote read. The exact frame where it lands is the whole episode.',
        'I was at the watch party for this and the room went silent. Nobody expected {actor} to have the numbers.',
        'Genuinely one of the cleanest I have seen. No leaks, no tell, and {subject} never got a whisper.',
        'The room noise on that vote reveal told you more than the confessionals did.',
      ],
    },
    'dunk': {
      timeline: [
        "four weeks of talking and {subject} couldn't count to five",
        'the arrogance not to play it. enjoy the jury house',
        '{subject} really thought they were the main character of this season',
        'outplayed by somebody they kept calling a number. embarrassing',
        'this is what happens when you stop listening to the people you stepped on',
        '{subject} was so busy monologuing they missed the entire vote',
        'hardest fall in franchise history and it is not close',
        'all that noise for a seventh place finish. incredible',
      ],
      chat: [
        'I will be kind about the person and unkind about the game: {subject} stopped playing three weeks ago and got exactly what that earns.',
        'There is no gentle way to say this. {subject} had every piece of information they needed and did nothing with any of it.',
        'You cannot talk that much and hear that little. That is the whole post-mortem.',
        'The arrogance is the story. {subject} believed the house because the house told them what they wanted.',
      ],
    },
    'disbelief': {
      timeline: [
        'i need somebody to explain to me what i just watched',
        'no because HOW. how',
        'rewatching it now and i still do not believe it',
        'i had to pause. season {season} episode {episode} and i had to pause',
        'who wrote this. genuinely, who wrote this',
        'there is no way. there is no WAY',
        'my hands are shaking. it is a game show. my hands are shaking',
      ],
      chat: [
        'I have watched every season of this and I did not see that coming. Not one beat of it.',
        'Somebody talk me through it, because I had {subject} safe until the third vote was read.',
        'I called this wrong in the prediction thread and I want it on the record that I called it wrong.',
        'That is the first time in a long time this show has genuinely surprised me.',
      ],
    },
  },

  'comp-talk': {
    'hot-take': {
      timeline: [
        '{subject} is carrying that entire tribe and getting nothing for it',
        'that comp was built for exactly one person and we all know who',
        '{subject} has been coasting on one good challenge for five weeks',
        'winning when it does not matter is a personality trait at this point',
        'you cannot keep losing comps and calling yourself a threat',
      ],
      chat: [
        '{subject} is the best physical player left and it is not close, but physical does not win this format on its own.',
        'That comp rewarded balance over power, which is why the result surprised people who only watch the highlights.',
        'The interesting number is not who won. It is who finished second three weeks running and nobody noticed.',
        'I ran this style of comp in my season. The trick is pacing, and {subject} paced it perfectly.',
      ],
    },
    'stat-drop': {
      timeline: [
        'that is {subject} on the podium in four of the last six. nobody is talking about it',
        'season {season} and {subject} has more comp points than the rest of the tribe combined',
        'zero wins. episode {episode}. zero',
        '{subject} has finished bottom three every single time and is somehow still here',
        'the numbers on {subject} this season are genuinely absurd',
      ],
      chat: [
        'For the record: {subject} is now four for six on the podium in season {season}, and none of it has bought them a single vote of safety.',
        'Pulled the numbers this morning. {subject} leads the season in comp scoring and sits bottom three in bond strength. That combination gets you fifth.',
        'Episode {episode} and the challenge record says the tribe carrying itself is the one everybody keeps calling weak.',
      ],
    },
  },

  'steamroll-fatigue': {
    'complaint': {
      timeline: [
        'this stopped being a competition around episode four',
        'one side has every vote and we are supposed to watch six more weeks of it',
        'boring. genuinely, actually boring',
        '{actor} could pick names out of a hat at this point',
        'wake me up when somebody on the bottom does literally anything',
        'i am not watching a season where the outcome was decided in week two',
      ],
      chat: [
        'I do not enjoy saying it, but this season stopped being competitive around episode four and the edit is working very hard to hide that.',
        'A steamroll is only boring when nobody on the bottom tries. That is what is happening here.',
        'The problem is not that {actor} is good. The problem is that six people have collectively decided not to play.',
        'We are in the stretch where the season lives or dies on somebody on the bottom finding a spine. I am not optimistic.',
      ],
    },
    'resigned': {
      timeline: [
        'i already know how this ends and so do you',
        'season {season} was over in week two, we are just doing the paperwork',
        'nothing is going to happen. nothing has happened in a month',
        'still watching. do not know why. still watching',
        'at this point i am just here for the confessionals',
      ],
      chat: [
        'I will keep watching because I always keep watching, but I stopped being surprised somewhere around episode {episode}.',
        'The rest of this is a formality unless the format intervenes, and I would rather it did not.',
        'It is a well played season and a badly watched one. Both things are true.',
      ],
    },
    'quote-dunk': {
      timeline: [
        '"anybody can win" name one. i will wait',
        'calling this a season is doing a lot of heavy lifting',
        'every week somebody posts that it is about to turn. it is not about to turn',
        '"great season" for who exactly',
      ],
      chat: [
        'People keep insisting this is still open. Count the votes and tell me which one is available.',
        'I understand the optimism and I do not share it. The numbers have not moved in five weeks.',
        'Calling this competitive is a kindness the tape does not support.',
      ],
    },
  },

  'prediction': {
    'prediction': {
      chat: [
        'Writing it down now so you can all quote it at me later: {actor} takes this whole thing, and it will not be close.',
        'My read for the rest of season {season} is that {actor} makes the end and loses the jury, which is the worst outcome for them and the best one for us.',
        'I will hedge slightly, but I have {actor} in the final three and {subject} on the jury being very loud about it.',
        'Episode {episode} is where I would put my marker down. If {actor} survives the next vote, they win.',
        'Prediction game, my entry: the person who wins this is somebody nobody in this chat has mentioned today.',
      ],
    },
    'insider-read': {
      chat: [
        'Watch how {subject} stopped saying {actor} in the kitchen. That is the tell. You stop naming the person you are about to cut.',
        'Nobody sits like that in a room they feel safe in. I have sat like that. It means you already know.',
        'The thing you learn out there is that the house always tells you a day early, and nobody ever listens.',
        'When somebody starts pre-writing their jury speech in confessional, they are done. {subject} started three episodes ago.',
        'That was not a slip. That was a message aimed at somebody who was not in the room, and {actor} heard it.',
      ],
    },
  },

  'legacy-take': {
    'hot-take': {
      timeline: [
        'best blindside in franchise history and i am not taking questions',
        '{subject} is the worst winner this franchise has ever produced. easily',
        'season {season} is going to be the one people rewatch and nothing else comes close',
        'we are going to be talking about episode {episode} for ten years',
        '{subject} did more in seven episodes than most people do in a whole season',
      ],
      chat: [
        'Top five moment in franchise history, and I have been watching since season one so I have earned the right to say that.',
        'People will overrate this in a month, the way they overrate everything recent, but it does belong in the conversation.',
        'The franchise has produced better games and it has not produced a better single episode.',
        'Ten years from now this is the clip they open the retrospective with.',
      ],
    },
    'ranking': {
      timeline: [
        'all time top five and {subject} is not on it. sorry',
        'ranking every blindside later but this one is top three, minimum',
        'season {season} over season 9 and it is not remotely close',
        'putting {subject} above half the winners and i will die on this hill',
      ],
      chat: [
        'If I am ranking the format honestly, season {season} is upper middle. Great moments, thin bottom half.',
        'I would put {subject} in my top fifteen players and nowhere near my top five games. Those lists are allowed to disagree.',
        'The all time list is going to have to make room for this one and something is going to have to come off it.',
      ],
    },
  },

  'production-critique': {
    'complaint': {
      timeline: [
        'that twist was invented specifically to save one person and everybody saw it',
        'stop bailing out the people you like. let them lose',
        'the format changes every time the wrong person is in trouble. every time',
        'you cannot drop a twist that big in episode {episode} and call it a game',
        'nobody asked for this. nobody has ever asked for this',
      ],
      chat: [
        'I have no problem with twists. I have a problem with twists that arrive the exact week the story needs them.',
        'The format should create pressure, not relieve it, and this one relieved it for precisely one person.',
        'Season {season} has intervened three times now and every intervention has pointed the same direction.',
      ],
    },
    'conspiracy': {
      timeline: [
        'they knew. they absolutely knew and they built the episode around it',
        'this is scripted and i have said it since season {season}',
        'the edit gave it away twenty minutes early. that was on purpose',
        'you do not get that camera angle by accident',
        'somebody in that control room has a favourite and it is obvious',
      ],
      chat: [
        'I do not think it is scripted. I do think the schedule and the twist timing are doing an enormous amount of work.',
        'Production does not need to script anything when it can choose when the twist lands.',
      ],
    },
  },

  // ── social ────────────────────────────────────────────────────────────────

  'harassment-defence': {
    'defence': {
      timeline: [
        'leave {subject} alone. six people against one is not gameplay',
        'whatever you think of {subject}, that was six on one and it was ugly',
        '{subject} has done nothing to deserve what that house is doing',
        'defending {subject} forever and i do not care who it annoys',
        'they picked the one person with nobody to back them up. cowards',
        'you can vote somebody out without doing that to them first',
      ],
      chat: [
        'I want to be careful here, because I have been the one in that room. What that house did to {subject} was not strategy, it was a pile-on with a vote attached.',
        'You can take somebody out of this game without taking them apart first. That house chose the second one.',
        'There is a version of this vote that happens quietly and respectfully. They did not choose it.',
        'Say what you like about {subject} as a player. Nobody deserves a week like that.',
      ],
    },
    'call-out': {
      timeline: [
        'the whole house needs to sit down and think about what that looked like',
        'name the people who joined in. all of them. i will start',
        'that was not a vote, that was a group deciding to be cruel',
        '{actor} started it and let everybody else carry it. classic',
        'every person who laughed is on the list',
      ],
      chat: [
        'I am naming it plainly: that was bullying, and the fact that it happened inside a game does not change what it was.',
        'The people who stayed quiet in that room are as responsible as the ones who spoke, and they know it.',
        '{actor} set the tone and then stood back and let the room do the work. I have seen that play before.',
      ],
    },
    'pile-on-against-the-house': {
      timeline: [
        'the entire house is going on my list tonight. every last one',
        'i have never rooted this hard against seven people at once',
        'whoever is left, i hope they lose. all of them',
        'the house made me a {subject} fan and they did it in one episode',
        'genuinely rooting for a medical evacuation for the lot of them',
      ],
      chat: [
        'That house has just handed {subject} the entire audience, and if any of them make the end they are going to find out what that costs.',
        'Watch what happens to the vote when this airs. They have made a hero out of the person they were trying to bury.',
      ],
    },
  },

  'edit-critique': {
    'call-out': {
      timeline: [
        'the edit is doing {subject} dirty and it has been doing it all season',
        'you cut three seconds of that argument and turned {subject} into the villain',
        'we did not see half of what {subject} actually said and they know it',
        'give {subject} one confessional that is not about somebody else. one',
        'the framing on {subject} this season has been genuinely unfair',
      ],
      chat: [
        'I have been on the wrong side of an edit. What is happening to {subject} is recognisable and it is not accidental.',
        'They have shown you {subject} reacting eleven times and initiating twice. That ratio is a choice.',
      ],
    },
    'complaint': {
      timeline: [
        'forty minutes and {subject} got one line. do better',
        'we are eight episodes in and i still do not know who {subject} is',
        'stop giving the same four people the whole episode',
        'the invisible edit on {subject} is criminal at this point',
      ],
      chat: [
        'Episode {episode} and {subject} has had less screen time than the theme song. That is a story choice, not a coincidence.',
        'The edit has decided which four people this season is about and it decided in week one.',
      ],
    },
  },

  'kindness-noticed': {
    'appreciation': {
      timeline: [
        'not {subject} sitting with them all night. protect that person',
        '{subject} did not have to do that and did it anyway',
        'the way {subject} noticed before anybody else. that is the whole show',
        'people forget you can just be nice out there. {subject} did not',
        'small moment, best moment of season {season}',
      ],
      chat: [
        'The small stuff is what you remember afterwards, not the votes. What {subject} did there is the kind of thing people thank you for years later.',
        'Nobody wins a game with that and everybody remembers it. Both of those are true and only one of them matters to me.',
        'That is the version of this show I actually like watching.',
      ],
    },
    'soft-take': {
      timeline: [
        'ok {subject} being decent for thirty seconds has rearranged my whole allegiance',
        'genuinely did not expect that from {subject} and i am adjusting',
        'a bit of kindness in episode {episode} and i am fully invested now',
      ],
      chat: [
        'I have been fairly harsh on {subject} and I want to be fair: that was a genuinely decent thing to do at a moment when it cost them.',
        'It does not change my read on the game. It does change how I feel about the person, and those are separate columns.',
      ],
    },
  },

  'personality-clash': {
    'hot-take': {
      timeline: [
        '{subject} and {actor} were never going to work and everybody knew it',
        'putting those two in one camp was always going to end like this',
        'this is not strategy, these two just genuinely cannot stand each other',
        'two people who need to be right about everything. of course it exploded',
      ],
    },
    'dunk': {
      timeline: [
        '{subject} is exhausting and the whole house looks tired of it',
        'insufferable. fake. cannot watch another second of {subject}',
        'the way {subject} talks to people is going to cost them the whole game',
        'nobody has ever needed the last word more than {subject}',
        '{subject} argues like somebody who has never once been told no',
      ],
    },
  },

  // ── romantic ──────────────────────────────────────────────────────────────

  'shipping': {
    'ship': {
      timeline: [
        '{subject} and {actor} or i riot',
        'put them in the same challenge again, cowards',
        'they have looked at each other twice and i have already picked a name for it',
        'i am not saying anything, i am just saying watch the two of them at the fire',
        '{subject} and {actor} have more chemistry in one glance than the actual showmance',
      ],
    },
    'gushing': {
      timeline: [
        'the way {subject} laughed at that. i am unwell',
        'they are so stupid about each other and i love it here',
        'season {season} gave me exactly one thing and this is it',
        'rewatching that scene for the fourth time, no notes',
      ],
    },
  },

  'thirst': {
    'thirst': {
      timeline: [
        '{subject} in that challenge. that is the post',
        'not to be a person about it but {subject}. yeah',
        '{subject} has ruined my week and does not know i exist',
        'the shot of {subject} at the water well was a personal attack',
      ],
    },
    'gushing': {
      timeline: [
        '{subject} could lose every comp and i would still be here weekly',
        'obsessed with {subject} in a way i am not going to examine',
        '{subject} smiled once in episode {episode} and i have not recovered',
      ],
    },
  },

  'showmance-hate': {
    'complaint': {
      timeline: [
        'get a room. there is a game happening around you',
        'this showmance is costing both of them the season and neither one cares',
        'i did not tune in for this. play the game',
        'two people forgetting they are on television, weekly',
      ],
    },
    'dunk': {
      timeline: [
        '{subject} is carrying that entire relationship and getting nothing back',
        'sixteen days. they have known each other sixteen days',
        'watching somebody throw a season away for a person they met on a beach',
        '{actor} is playing {subject} and the whole audience can see it except {subject}',
      ],
    },
  },

  'showmance-concern': {
    'concern': {
      timeline: [
        'that did not look romantic, that looked like pressure',
        'somebody check on {subject}. genuinely',
        'the way {actor} keeps answering for {subject} is not cute, it is a pattern',
        'i wanted to enjoy this and i cannot. something is off',
      ],
      chat: [
        'I want to say this carefully. What we are watching is not a showmance, it is one person managing another, and the edit is selling it as romance.',
        'Out there you are exhausted and isolated and somebody paying attention to you feels enormous. That is exactly why this reads badly to me.',
        'I would like production to be watching this more closely than the audience is.',
      ],
    },
    'call-out': {
      timeline: [
        '{actor} does not let {subject} finish a single sentence and we are calling it love',
        'stop framing that as sweet. it is not sweet',
        'that is control with a soundtrack over it',
      ],
      chat: [
        'Naming it: {actor} has isolated {subject} from every other relationship in that house, and the show is scoring it with love music.',
        'I have seen this dynamic on a season I was on. It did not read well then either.',
      ],
    },
  },

  'breakup-reaction': {
    'live-reaction': {
      timeline: [
        'IT IS OVER. it is over and it happened on camera',
        'they broke up at the water tank. on television. in front of everyone',
        'episode {episode} and the showmance is gone. season {season} delivers',
      ],
    },
    'gloating': {
      timeline: [
        'said it in week two. said it in week two',
        'the strategy is coming back online and i could not be happier',
        'that lasted exactly as long as i said it would',
        'best thing that has happened to {subject} game all season',
      ],
    },
    'sympathy': {
      timeline: [
        'that was rough to watch. leave them both alone',
        '{subject} did not deserve to find out that way, in front of a camera',
        'crying at a reality show breakup. this is my life now',
      ],
    },
  },

  // ── character ─────────────────────────────────────────────────────────────

  'love-them-hate-their-game': {
    'conflicted': {
      timeline: [
        'i adore {subject} and they are playing the worst game i have ever seen',
        'love her. hate every single decision she makes. both things',
        'my favourite player and my least favourite gameplay, in one person',
        'i would die for {subject} and i would also never take a deal from them',
        '{subject} is the best person out there and it has not won them one vote',
        'genuinely the reason i watch. genuinely cannot defend a thing they do strategically',
        'wonderful human being. catastrophic player. i am at peace with it',
      ],
      chat: [
        'I love {subject} and I cannot defend a single move they have made since episode three. Those are two separate columns and mine disagree completely.',
        'This is the hardest kind of player to watch. Lovely person, and every week they hand somebody else the game.',
        'My affection for {subject} has gone up all season and my respect for their game has gone straight down. That is allowed.',
        'I would take {subject} to dinner and I would not take them to the end, and I mean both of those as compliments to the person.',
      ],
    },
    'soft-take': {
      timeline: [
        '{subject} deserved better than a game they were never going to be good at',
        'not everybody is built for this and that is not a character flaw',
        'the nicest person on that beach and it was always going to cost them',
        'i am fine. {subject} is bad at this and i am fine',
      ],
      chat: [
        'Some people are made for the social side and not the strategic one. {subject} is the clearest example this format has produced in years.',
        'I am not going to pretend they played well. I am also not going to pretend I did not enjoy every second they were on my screen.',
      ],
    },
  },

  'hate-them-rate-their-game': {
    'conflicted': {
      timeline: [
        'cannot stand {actor} and they are playing a blinder. it is infuriating',
        'i hate this man and he is going to win this whole thing',
        'insufferable, smug, and about four moves ahead of everybody. sickening',
        'rooting against {actor} weekly and betting on them anyway',
        'the worst person out there is also the best player out there. wonderful',
        'i want {actor} gone and i respect the hell out of how hard that will be',
      ],
      chat: [
        'I do not like {actor} and I am not going to pretend that is a game read. They are playing the best game out there by a distance.',
        'Two columns again: personality, bottom of the season. Gameplay, top of the season. That combination is exactly how a dominant winner becomes a hated one.',
        'It is a lot easier to enjoy this if you separate the player from the person, and this week I could not manage it.',
        'I have been beaten by somebody like {actor}. You spend the jury weeks furious and then you vote for them anyway.',
      ],
    },
    'grudging-respect': {
      timeline: [
        'i hate to say it but that was clean. really clean',
        'not one leak. not one. {actor} ran that perfectly and i am sick about it',
        'give the devil their due, that was a masterclass',
        'the audacity and the execution. i am unwell but i am impressed',
      ],
      chat: [
        'Credit where it is owed. {actor} controlled the information all week, and information is the whole game.',
        'I do not enjoy watching it and I cannot fault it. That was the correct move played at the correct time.',
        'The tell is that nobody saw it. You do not get that without doing the quiet work for three weeks first.',
      ],
    },
  },

  'favourite-declaration': {
    'gushing': {
      timeline: [
        '{subject} is my whole season and nothing else is close',
        'if {subject} goes home i am done. genuinely done',
        'the only person on that beach worth the edit',
        'week eight and i am still fully, embarrassingly in on {subject}',
      ],
    },
    'stan-post': {
      timeline: [
        'been on {subject} since season {season} and i will be here at the finale',
        'defending {subject} in every reply for as long as it takes',
        'you can say what you like, {subject} is the reason this season is watchable',
        'four seasons of this account and one favourite. still {subject}',
      ],
    },
  },

  // ── meta ──────────────────────────────────────────────────────────────────

  'pile-on': {
    'dunk': {
      timeline: [
        'the whole timeline is on {subject} tonight and honestly, earned',
        'adding my brick to the pile. {subject} was insufferable and now {subject} is gone',
        '{subject} spent seven episodes making enemies and got exactly what that buys',
        'not one person is defending {subject} right now and that says everything',
        'good. next',
      ],
    },
    'ratio-bait': {
      timeline: [
        'like this if {subject} was the worst part of season {season}',
        'unpopular opinion: it is not unpopular, everyone thinks it',
        'quote this with a worse {subject} take. you cannot',
        'ratio me. i will still be right about {subject} in a year',
      ],
    },
    'pile-on-reply': {
      timeline: [
        'and another thing about {subject}',
        'thank you. finally somebody said it',
        'adding to this: {subject} did the same thing in episode {episode}',
        'the replies on this are carrying me through the night',
      ],
    },
  },

  'fandom-infighting': {
    'quote-dunk': {
      timeline: [
        'this account has had one correct opinion in three seasons and this is not it',
        'the stans are out in force tonight and none of them have watched the episode',
        'blocking everybody who posts this take. see you at the finale',
        'imagine watching the same episode as me and coming away with this',
      ],
    },
    'subtweet': {
      timeline: [
        'some of you only watch the edit and it shows',
        'certain accounts have been very quiet since the vote read',
        'not naming names but a few of you owe somebody an apology tonight',
        'the people who were loudest in week two have gone remarkably silent',
      ],
    },
  },
};

// ─── decoration ────────────────────────────────────────────────────────────
//
// Real accounts have tics. These are applied proportionally — never as a
// threshold — and they are what stops fifty posts from a dozen accounts reading
// like fifty draws from one bag.

export const DECORATIONS = {
  /** Timeline openers. Fragments, lowercase, mid-thought. */
  openers: {
    timeline: ['ok but ', 'nah ', 'lmao ', "i'm sorry but ", 'genuinely ', 'listen ', 'hold on. ', 'no because '],
    // Chat openers terminate themselves, so the sentence after them keeps its
    // capital. "For what it is worth, i would put..." is the tell of a template.
    chat: ['Honestly? ', 'Okay. ', 'Look. ', 'For what it is worth: ', 'Right. ', 'Two things. '],
  },
  /** Trailing tics. */
  tails: {
    timeline: [' anyway', ' bye', ' i said what i said', ' no notes', ' im done', ' and that is the post'],
    chat: [' Thoughts?', ' Watch it back.', ' I could be wrong.', ' Anyway, that is my read.', ' Curious what the room thinks.'],
  },
  /** Emoji by posture, so a dunk never lands with a heart on it. */
  emoji: {
    hostile: ['💀', '😭', '🍅', '🤡', '😂', '☠️'],
    supportive: ['😭', '💛', '🫶', '🥺', '👑', '🤍'],
    neutral: ['👀', '🤔', '😳', '‼️', '🧠'],
  },
};

// ─── posture ───────────────────────────────────────────────────────────────
//
// How hostile a post shape is, -1..1. This drives engagement: a supportive post
// about somebody the crowd dislikes gets ratioed, a hostile one about the same
// person collects likes. Proportional throughout — a stance of -0.3 is a third
// as cutting as -0.9, not "below the hostile threshold".

const SHAPE_STANCE = {
  'defence': 1.0, 'appreciation': 1.0, 'gushing': 1.0, 'stan-post': 1.0,
  'ship': 0.8, 'thirst': 0.8, 'sympathy': 0.8, 'pile-on-against-the-house': 0.8,
  'soft-take': 0.5, 'concern': 0.3, 'conflicted': 0.2, 'grudging-respect': 0.1,
  'stat-drop': 0.1, 'prediction': 0, 'insider-read': 0, 'ranking': 0,
  'live-reaction': 0, 'disbelief': 0, 'thread-opener': -0.1, 'resigned': -0.2,
  'conspiracy': -0.3, 'hot-take': -0.3, 'complaint': -0.5, 'subtweet': -0.6,
  'call-out': -0.7, 'gloating': -0.8, 'quote-dunk': -0.9,
  'dunk': -1.0, 'ratio-bait': -1.0, 'pile-on-reply': -1.0,
};

/**
 * Who each topic is aimed at, and the topic's average posture toward them.
 * 'none' means the post is aimed at production or at other fans, not a player —
 * those cannot be ratioed on a player's popularity.
 */
const TOPIC_AIM = {
  'strategy-critique': { target: 'subject', stance: -0.4 },
  'blindside-reaction': { target: 'subject', stance: -0.3 },
  'comp-talk': { target: 'subject', stance: 0.1 },
  'steamroll-fatigue': { target: 'actor', stance: -0.4 },
  'prediction': { target: 'actor', stance: 0 },
  'legacy-take': { target: 'subject', stance: 0 },
  'production-critique': { target: 'none', stance: -0.4 },
  'harassment-defence': { target: 'subject', stance: 0.9 },
  'edit-critique': { target: 'subject', stance: 0.7 },
  'kindness-noticed': { target: 'subject', stance: 0.9 },
  'personality-clash': { target: 'subject', stance: -0.7 },
  'shipping': { target: 'subject', stance: 0.8 },
  'thirst': { target: 'subject', stance: 0.8 },
  'showmance-hate': { target: 'subject', stance: -0.6 },
  'showmance-concern': { target: 'subject', stance: 0.4 },
  'breakup-reaction': { target: 'subject', stance: 0 },
  'love-them-hate-their-game': { target: 'subject', stance: 0.35 },
  'hate-them-rate-their-game': { target: 'actor', stance: 0.05 },
  'favourite-declaration': { target: 'subject', stance: 1.0 },
  'pile-on': { target: 'subject', stance: -1.0 },
  'fandom-infighting': { target: 'none', stance: -0.6 },
};

/**
 * What each kind of fan gravitates toward. Multipliers on topic weight, so a
 * shipper still occasionally posts about strategy — they just do it less.
 */
const ARCHETYPE_PULL = {
  stan: { 'harassment-defence': 2.4, 'favourite-declaration': 2.2, 'edit-critique': 1.8, 'love-them-hate-their-game': 1.6, 'pile-on': 0.4, 'fandom-infighting': 1.5 },
  hater: { 'pile-on': 2.4, 'personality-clash': 2.0, 'hate-them-rate-their-game': 1.8, 'showmance-hate': 1.6, 'harassment-defence': 0.3, 'favourite-declaration': 0.3 },
  analyst: { 'strategy-critique': 2.4, 'prediction': 2.2, 'comp-talk': 1.8, 'legacy-take': 1.6, 'thirst': 0.2, 'shipping': 0.3, 'pile-on': 0.5 },
  livefeeder: { 'blindside-reaction': 2.0, 'comp-talk': 1.6, 'edit-critique': 1.5, 'steamroll-fatigue': 1.4, 'legacy-take': 0.6 },
  casual: { 'blindside-reaction': 1.8, 'thirst': 1.6, 'favourite-declaration': 1.5, 'shipping': 1.4, 'strategy-critique': 0.4, 'comp-talk': 0.4 },
  chaos: { 'fandom-infighting': 2.4, 'production-critique': 2.0, 'pile-on': 1.8, 'ratio-bait': 1.8, 'kindness-noticed': 0.4 },
  shipper: { 'shipping': 2.6, 'breakup-reaction': 2.2, 'showmance-concern': 1.8, 'thirst': 1.6, 'showmance-hate': 0.4, 'strategy-critique': 0.3 },
};

/**
 * A blindside is also an eviction, and any of it is also an episode that aired.
 * Without this, a blindside could only ever produce blindside topics, and a
 * feed that discusses exactly one thing is not a feed.
 */
const IMPLIED_KINDS = {
  blindside: ['eviction'],
  finale: ['eviction'],
  'ganging-up': ['argument'],
  'showmance-broken': ['argument'],
  betrayal: ['eviction'],
};

/** Roughly how long this fan's posts run, per room. */
const LENGTH_TARGET = {
  timeline: { short: 70, medium: 120, long: 190 },
  chat: { short: 150, medium: 250, long: 380 },
};

// ─── helpers ───────────────────────────────────────────────────────────────

const _pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];
const _pos = n => Math.max(0, Math.min(1, n));

/** `anne-maria` -> `Anne Maria`. Slugs in, display names out. */
export function displayName(slug) {
  return String(slug || '').split('-').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** The event kinds a topic may match for this event. */
function kindsFor(event) {
  const set = new Set([event.kind, ...(IMPLIED_KINDS[event.kind] || []), 'episode-aired']);
  return [...set].filter(Boolean);
}

/** Fill {subject} {actor} {season} {episode}. Nothing may survive unfilled. */
function fillSlots(template, event) {
  const slots = {
    subject: displayName(event.subject),
    actor: displayName(event.actor),
    season: String(event.season ?? ''),
    episode: String(event.episode ?? ''),
  };
  return template
    .replace(/\{(\w+)\}/g, (_, key) => (slots[key] != null ? slots[key] : ''))
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Uppercase a run of words. Frequency scales with `rate`; never a threshold. */
function shout(text, rate, rng) {
  if (rate <= 0 || rng() >= rate) return text;
  const words = text.split(' ');
  if (words.length < 4) return text.toUpperCase();
  const runLen = 1 + Math.floor(rng() * 3);
  const start = Math.floor(rng() * (words.length - runLen));
  for (let i = start; i < start + runLen; i++) words[i] = words[i].toUpperCase();
  return words.join(' ');
}

function punctuate(text, style, rng) {
  let t = text.trim();
  if (style === 'none') return t.replace(/\.+$/, '');
  if (style === 'heavy') return t.replace(/[.!?]+$/, '') + _pick(rng, ['!!', '!!!', '?!', '...', '!?']);
  return /[.!?…]$/.test(t) ? t : t + '.';
}

function fit(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim();
}

/** How the room as a whole feels about this player. Feelings, not a roll. */
function crowdAffection(slug) {
  if (!slug) return 0;
  const vals = PERSONAS
    .map(p => (p.feelings || {})[slug])
    .filter(Boolean)
    .map(f => Number(f.affection) || 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

/** The slug a topic is aimed at, or null when it is aimed at production. */
function targetOf(topic, event) {
  const aim = TOPIC_AIM[topic.id] || { target: 'subject' };
  if (aim.target === 'none') return null;
  if (aim.target === 'actor') return event.actor || event.subject || null;
  return event.subject || event.actor || null;
}

/**
 * How likely this fan is to reach for this topic.
 *
 * Weight starts at the topic's own, then bends around how the persona feels
 * about the person the topic is aimed at: affection pushes you toward
 * supportive topics and away from hostile ones. The two-axis topics need the
 * axes to actually disagree — that is the only reason they exist.
 */
function topicWeight(persona, topic, event, platform) {
  const slug = targetOf(topic, event);
  const f = slug ? feelingsToward(persona, slug) : { affection: 0, gameRespect: 0 };
  const aim = TOPIC_AIM[topic.id] || { stance: 0 };
  let w = topic.weight;

  w *= Math.max(0.05, 1 + aim.stance * f.affection * 1.5);
  w *= (ARCHETYPE_PULL[persona.archetype] || {})[topic.id] ?? 1;

  if (topic.id === 'love-them-hate-their-game') {
    w *= 0.4 + 4 * _pos(f.affection) * _pos(-f.gameRespect);
  }
  if (topic.id === 'hate-them-rate-their-game') {
    w *= 0.4 + 4 * _pos(-f.affection) * _pos(f.gameRespect);
  }
  // The hostility dial throttles aggression on the way into the hosted room.
  if (aim.stance < 0) w *= 0.35 + 0.65 * platform.hostility;

  return Math.max(0.02, w);
}

function weightedPick(rng, items, weightOf) {
  const ws = items.map(weightOf);
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

/** Templates this topic/shape has for this room, minus any that need a missing person. */
function poolFor(topicId, shape, stream, event) {
  const byShape = PHRASINGS[topicId] || {};
  const byStream = byShape[shape] || {};
  const pool = byStream[stream] || byStream.timeline || [];
  return pool.filter(t => (event.actor ? true : !t.includes('{actor}')));
}

/** Every shape this topic can actually speak in this room. */
function shapesFor(topic, stream, event) {
  return (topic.shapes || []).filter(s => poolFor(topic.id, s, stream, event).length > 0);
}

// ─── the composer ──────────────────────────────────────────────────────────

/**
 * One post.
 *
 * @param {object}   o.persona   from PERSONAS
 * @param {object}   o.topic     from TOPICS
 * @param {object}   o.platform  from PLATFORMS
 * @param {object}   o.event     { kind, subject, actor, season, episode, format }
 * @param {function} o.rng       injected so a failure is reproducible
 * @returns {{handle:string,name:string,stream:string,topic:string,text:string,likes:number,tomatoes:number}}
 */
export function composePost({ persona, topic, platform, event, rng = Math.random }) {
  const stream = platform.id;
  const shapes = shapesFor(topic, stream, event);
  const shape = shapes.length ? _pick(rng, shapes) : (topic.shapes || ['hot-take'])[0];
  const pool = poolFor(topic.id, shape, stream, event);

  // Length is a preference, not a filter: draw twice and usually keep whichever
  // sits closer to how long this fan writes. Proportional, and it keeps the
  // whole pool reachable.
  const target = (LENGTH_TARGET[stream] || LENGTH_TARGET.timeline)[persona.voice.length] || 120;
  let template = pool.length ? _pick(rng, pool) : '';
  if (pool.length > 1) {
    const other = _pick(rng, pool);
    if (rng() < 0.7 && Math.abs(other.length - target) < Math.abs(template.length - target)) {
      template = other;
    }
  }

  let text = fillSlots(template, event);

  // Tics. The chat shouts less and decorates less — it is a room, not a stand.
  const roomVoice = stream === 'chat' ? 0.35 : 1;
  const openers = DECORATIONS.openers[stream] || DECORATIONS.openers.timeline;
  const tails = DECORATIONS.tails[stream] || DECORATIONS.tails.timeline;
  if (rng() < 0.3 * roomVoice + (stream === 'chat' ? 0.12 : 0)) {
    text = _pick(rng, openers) + text;
  }
  if (rng() < (stream === 'chat' ? 0.3 : 0.25)) text = punctuate(text, 'normal', rng) + _pick(rng, tails);

  text = shout(text, (persona.voice.caps || 0) * roomVoice, rng);
  // The hosted room sands the tics off. Somebody who types "!!!" on the timeline
  // mostly does not in a chat they are hosting — proportionally, not always.
  let punct = persona.voice.punctuation || 'normal';
  if (stream === 'chat' && punct !== 'normal' && rng() > roomVoice) punct = 'normal';
  text = punctuate(text, punct, rng);

  const stance = (SHAPE_STANCE[shape] ?? 0);
  if (rng() < (persona.voice.emoji || 0) * roomVoice) {
    const bag = stance > 0.25 ? DECORATIONS.emoji.supportive
      : stance < -0.25 ? DECORATIONS.emoji.hostile
        : DECORATIONS.emoji.neutral;
    text = `${text} ${_pick(rng, bag)}`;
  }

  text = fit(text, platform.maxLength);

  // ── engagement, derived from feelings ──
  // agreement > 0: the post agrees with how the room feels, and collects likes.
  // agreement < 0: it does not, and the tomatoes come out.
  const effStance = stance < 0 ? stance * platform.hostility : stance;
  const crowd = crowdAffection(targetOf(topic, event));
  const agreement = Math.max(-1, Math.min(1, effStance * crowd));
  const spread = 1 + (text.length % 41) / 40;

  const likes = Math.round(90 * (1 + topic.weight) * (1 + 1.6 * _pos(agreement))
    * (1 + (persona.volatility || 0) * 0.4) * spread);
  const tomatoes = platform.ratios
    ? Math.round(240 * (1 + topic.weight) * _pos(-agreement) * spread)
    : 0;

  return {
    handle: persona.handle,
    name: persona.name,
    stream,
    topic: topic.id,
    text,
    likes,
    tomatoes,
  };
}

/**
 * A crowd reacting to one event.
 *
 * @param {object} event  { kind, subject, actor, season, episode, format }
 * @param {object} o      { count, stream, rng }
 * @returns {object[]} posts
 */
export function samplePosts(event, { count = 20, stream = 'timeline', rng = Math.random } = {}) {
  const platform = platformOf(stream);
  const kinds = kindsFor(event);

  const candidates = [];
  const seen = new Set();
  for (const kind of kinds) {
    for (const t of topicsFor(kind, platform.id)) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      if (shapesFor(t, platform.id, event).length) candidates.push(t);
    }
  }
  if (!candidates.length) return [];

  const voices = PERSONAS.filter(p => (p.platforms || []).includes(platform.id));
  if (!voices.length) return [];

  const posts = [];
  for (let i = 0; i < count; i++) {
    const persona = voices[Math.floor(rng() * voices.length) % voices.length];
    const topic = weightedPick(rng, candidates, t => topicWeight(persona, t, event, platform));
    posts.push(composePost({ persona, topic, platform, event, rng }));
  }
  return posts;
}

/** Posts as something a person can sit and read. The whole point of the file. */
export function renderSample(posts) {
  return (posts || []).map(p => {
    const meter = p.tomatoes > 0
      ? `  ♥ ${p.likes}   \u{1F345} ${p.tomatoes}`
      : `  ♥ ${p.likes}`;
    return `${p.handle} (${p.name}) · ${p.topic}\n  ${p.text}\n${meter}`;
  }).join('\n\n');
}
