// js/social/phrasings.js
// The words themselves.
//
// This file is DATA and nothing else. The composer lives in sampler.js and never
// needs to change when the library grows: a new template is one string in an
// existing array, a new shape is one key, a new topic is one entry here plus one
// entry in topics.js. That separation is the point — two contributors adding two
// different topics touch different lines of one data file instead of colliding
// inside the composer.
//
// tests/social-hostility.test.js walks every string in this file, so a
// contribution that attacks a protected characteristic fails immediately.
//
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
        'The mistake was made two weeks ago. What we watched tonight was just the bill arriving.',
        'Nobody in that house is playing the jury yet, and that is why one of them is going to lose a five to two vote in a month.',
        'You can take the shot early or you can take it clean. {actor} tried to do both and got neither.',
        'There were four ways to play episode {episode} and the house picked the third best one, which is somehow worse than picking the worst.',
        'What nobody is saying: {subject} was the only person keeping three separate people honest, and all three of them just got harder to read.',
        'Good move, bad week for it. Those are different criticisms and the room keeps merging them.',
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
        'Before anybody else weighs in, I want to put the timeline of this week down in order, because half the arguments in here are about what happened when.',
        'Long one, sorry. There is a version of episode {episode} where {subject} survives, and it is worth understanding why it did not happen.',
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
        'Every year somebody calls the loudest move the best move. They are almost never the same move.',
        'I would love to agree with the room on this one and I have watched it three times now and I cannot.',
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
        'The hug before the vote is the part that will stay with me. Somebody in that circle knew, and hugged them anyway.',
        'I have had that walk to the door. You do the maths on the way out and it never adds up until about three days later.',
        'Rewind to the twenty second mark. {subject} looks for {actor} first, and {actor} is already looking somewhere else. That is the shot.',
        'Nobody in that room could hold a face. You could read the entire vote off the people who were not voting.',
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
        'I like {subject} personally and that was one of the least aware games I have watched in fifteen seasons.',
        'Seven episodes of being told they were safe by people they never once checked on. That is not bad luck.',
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
        'I am going to need the room to walk me through the middle ten minutes, because I lost the thread somewhere and never found it.',
        'Fifteen seasons of this and I still got played by an edit. Genuinely delighted about it.',
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
        'Two numbers that matter this week: {subject} on the podium again, and the same {subject} named on three ballots. Comps do not buy you what people think they buy you.',
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
        'A dominant run is only fun to watch when somebody is swinging at it. Nobody has swung since episode four.',
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
        'I have stopped predicting and started confirming, which is not why any of us signed up for the prediction game.',
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
        'Every week somebody in here says the bottom is about to move. Show me the week where it moved.',
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
        'Locking in my bracket now while I still feel clever about it. {actor} first, {subject} on the jury, and me eating this post in three weeks.',
        'I have been wrong every week of season {season} so far, so take this as a reverse indicator: I think {actor} goes home next.',
        'Final three call, and I want it timestamped: {actor}, plus two people currently being edited as furniture.',
        'The winner of season {season} is somebody who has not had a confessional in three episodes. It usually is.',
      ],
    },
    'insider-read': {
      chat: [
        'Watch how {subject} stopped saying {actor} in the kitchen. That is the tell. You stop naming the person you are about to cut.',
        'Nobody sits like that in a room they feel safe in. I have sat like that. It means you already know.',
        'The thing you learn out there is that the house always tells you a day early, and nobody ever listens.',
        'When somebody starts pre-writing their jury speech in confessional, they are done. {subject} started three episodes ago.',
        'That was not a slip. That was a message aimed at somebody who was not in the room, and {actor} heard it.',
        'The washing-up is where the season gets decided. It is the only place two people can talk for ten minutes without it looking like a meeting.',
        'You can hear it in how {actor} says the name. Full name means distance, and distance means a vote.',
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
        'I have been asked about my own season for years and nobody ever asks about the strategy. They ask about the one night everything went wrong. This is that night for {subject}.',
        'Great seasons are made of two or three episodes like this one and a lot of Tuesdays. Season {season} just got one of the two or three.',
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
        'Recency does strange things to these lists. Ask me again in a year and I will either move {subject} up ten places or forget the season entirely.',
        'Bottom half of my seasons list, top five of my episodes list. Season {season} is going to be remembered for one night and not much else.',
        'I rank players on what they were up against, which is the only reason {subject} is anywhere near my top twenty.',
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
        'When I played, the twist was announced to everybody at once. Whatever this was, it was not that.',
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
        'Nobody is handing anybody a script. Somebody is absolutely deciding which conversation gets a camera on it, and that is enough.',
        'I have been in that control room dynamic from the other side. They do not tell you what to say. They tell you when to say it.',
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
        'Somebody in that house had the standing to stop it in one sentence and chose not to spend it. That is the part I cannot get past.',
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
        'I came into this week with no particular feeling about {subject}. I am leaving it wanting every other person in that house to lose.',
        'The house has just voted itself the villain of season {season} and none of them have worked it out yet.',
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
        'The edit has decided {subject} is difficult, and once it decides that it will find footage of you being difficult every single week.',
        'Ask anybody who has come off one of these seasons. The version of you that airs is the version they needed that Tuesday.',
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
        "I would trade two of this week's montages for thirty seconds of anybody outside the main four actually talking.",
        'There are people on this cast I could not describe to you in one sentence, and we are past the halfway point of season {season}.',
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
        'You are hungry, you have not slept, and you still go and sit with somebody who is having the worst night of their life. That is not nothing.',
      ],
    },
    'soft-take': {
      timeline: [
        'ok {subject} being decent for thirty seconds has rearranged my whole allegiance',
        'genuinely did not expect that from {subject} and i am adjusting',
        'a bit of kindness in episode {episode} and i am fully invested now',
        'i have spent six weeks being mean about {subject} and one scene has undone all of it',
      ],
      chat: [
        'I have been fairly harsh on {subject} and I want to be fair: that was a genuinely decent thing to do at a moment when it cost them.',
        'It does not change my read on the game. It does change how I feel about the person, and those are separate columns.',
        'Nobody is going to put that in a jury speech and everybody in that house will remember it. Those are different currencies.',
        'I want to log a correction on {subject}. I had them read as cold and I do not think that survives episode {episode}.',
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
        'strategy is fine but have you considered {subject}',
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
        'I am not calling it anything yet. I am saying I have watched {subject} check {actor} for permission before answering a question three times this week.',
      ],
    },
    'call-out': {
      timeline: [
        '{actor} does not let {subject} finish a single sentence and we are calling it love',
        'stop framing that as sweet. it is not sweet',
        'that is control with a soundtrack over it',
        'every single conversation {subject} has now happens with {actor} standing there. every one',
      ],
      chat: [
        'Naming it: {actor} has isolated {subject} from every other relationship in that house, and the show is scoring it with love music.',
        'I have seen this dynamic on a season I was on. It did not read well then either.',
        'The thing that worries me is not the affection. It is that {subject} has stopped making decisions in rooms {actor} is not in.',
        'I would rather be wrong and annoying about this than right and quiet about it.',
      ],
    },
  },

  'breakup-reaction': {
    'live-reaction': {
      timeline: [
        'IT IS OVER. it is over and it happened on camera',
        'they broke up at the water tank. on television. in front of everyone',
        'episode {episode} and the showmance is gone. season {season} delivers',
        'they are not speaking. they are actively not speaking and the cameras are RIGHT THERE',
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
        'no winners here. two tired people on a beach and a camera crew',
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
        'Everybody wants these two numbers to be the same number and they are simply not. I adore {subject} and I would not trust them with a vote.',
        'The affection is real and so is the frustration, and if you have never felt both about the same player you have not been watching very long.',
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
        'There is a kind of player who makes the season better and their own game worse, every week, on purpose. {subject} is one of them.',
        'If {subject} had been half as good at this as they are at being a person, we would be talking about a winner.',
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
        'Nobody in here has to like {actor} to see it. Best game in the season, worst company in the house, and those are unrelated facts.',
        'My respect for {actor} has gone up every single week and I would still walk past them in an airport. Both columns, independently.',
        "I have spent all season looking for a hole in {actor}'s game so I would have permission to keep disliking them. There is not one.",
        'The uncomfortable version: if {actor} were nicer, we would be calling this an all time great run instead of arguing about it.',
        'That is the move I would have been too polite to make, and being too polite is why I finished sixth.',
        'Clean, quiet, and aimed at the one person who could have stopped it. I have no notes and no goodwill.',
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
        'I will give {actor} this much and no more: the timing was perfect and I hate that it was.',
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
    chat: ['Honestly? ', 'Okay. ', 'Look. ', 'For what it is worth: ', 'Right. ', 'Two things. ',
      'Quick one. ', 'Late to this, but. ', 'Rewatching now. ', 'Hosting tonight, so briefly: '],
  },
  /** Trailing tics. */
  tails: {
    timeline: [' anyway', ' bye', ' i said what i said', ' no notes', ' im done', ' and that is the post'],
    chat: [' Thoughts?', ' Watch it back.', ' I could be wrong.', ' Anyway, that is my read.',
      ' Curious what the room thinks.', ' Happy to be argued with.', ' Tell me I am wrong.',
      ' That is all I have got tonight.', ' Someone check my maths on that.', ' Open to the other read.'],
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

export const SHAPE_STANCE = {
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
export const TOPIC_AIM = {
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
 *
 * KEYS ARE TOPIC IDS, not shapes. `topicWeight` looks these up by `topic.id`, so
 * a shape name in here (this map used to carry `'ratio-bait': 1.8` under chaos)
 * never matches anything and reads as coverage the composer does not have. A
 * chaos account's appetite for ratio bait is already carried by its `pile-on`
 * multiplier, which is the topic that owns that shape.
 */
export const ARCHETYPE_PULL = {
  stan: { 'harassment-defence': 2.4, 'favourite-declaration': 2.2, 'edit-critique': 1.8, 'love-them-hate-their-game': 1.6, 'pile-on': 0.4, 'fandom-infighting': 1.5 },
  hater: { 'pile-on': 2.4, 'personality-clash': 2.0, 'hate-them-rate-their-game': 1.8, 'showmance-hate': 1.6, 'harassment-defence': 0.3, 'favourite-declaration': 0.3 },
  analyst: { 'strategy-critique': 2.4, 'prediction': 2.2, 'comp-talk': 1.8, 'legacy-take': 1.6, 'thirst': 0.2, 'shipping': 0.3, 'pile-on': 0.5 },
  livefeeder: { 'blindside-reaction': 2.0, 'comp-talk': 1.6, 'edit-critique': 1.5, 'steamroll-fatigue': 1.4, 'legacy-take': 0.6 },
  casual: { 'blindside-reaction': 1.8, 'thirst': 1.6, 'favourite-declaration': 1.5, 'shipping': 1.4, 'strategy-critique': 0.4, 'comp-talk': 0.4 },
  chaos: { 'fandom-infighting': 2.4, 'production-critique': 2.0, 'pile-on': 1.8, 'kindness-noticed': 0.4 },
  shipper: { 'shipping': 2.6, 'breakup-reaction': 2.2, 'showmance-concern': 1.8, 'thirst': 1.6, 'showmance-hate': 0.4, 'strategy-critique': 0.3 },
};
