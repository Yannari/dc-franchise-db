// js/social/packs/perfect-match-villa-words.js
// What the villa's fandom says about the villa itself — the rows, the
// tellings, the first kisses, Movie Night — rather than the ceremonies.
//
// DATA ONLY, like perfect-match-words.js: the reader is perfect-match.js and
// the scenes come from js/pm/feed-scenes.js. Every topic here is TIMELINE
// only (Birdie); the alumni room gets its takes in VILLA_CHAT_TAKES.
//
// Slots: {subject} {actor} {receipt} {episode}. {subject} is the islander the
// moment is about (the one who started the row, the one who told, the one
// who was told and had it out, the one Movie Night caught); {actor} is the
// other one. A template naming a slot is only drawn when the event fills it,
// so at least half of every pool stands on its own.

export const VILLA_PHRASINGS = {

  // ── a row ────────────────────────────────────────────────────────────────

  'row-talk': {
    'live-reaction': {
      timeline: [
        'oh it is KICKING OFF on the terrace',
        'the whole villa pretending to make a cup of tea so they can listen',
        '{subject} and {actor} going at it and i have not blinked in four minutes',
        'not the fight starting over something so small and ending up about everything',
        'the second the music stopped you could hear every word of that',
        '{receipt} and i had to pause it',
        'someone get these two a referee',
        'the villa has been on edge all day and that was the spark',
        '{subject} going from zero to a hundred in one sentence',
        'the producers putting dramatic music under a fight about who used the last of the milk',
        'you could feel that one coming from the other side of the pool',
        'they were whispering, then they were not whispering',
        '{actor} rolling their eyes mid-sentence was the moment it turned',
        'the fight lasted two minutes and the beach hut lasted ten',
        'the way everyone on the daybeds went completely silent',
      ],
    },
    'hot-take': {
      timeline: [
        'that fight was coming for days, you could see it at breakfast',
        '{subject} was not wrong but the delivery was something else',
        'honestly {actor} had that coming',
        'nobody in that villa knows how to have a calm conversation and i love them for it',
        'a fight in the first week is a couple, a fight in the third week is a problem',
        'the make-up hug afterwards is the most suspicious part of the whole thing',
        '{receipt}. they will be on the swing by tonight, watch',
        'half that fight was about something that happened days ago',
        '{subject} needs to learn when to walk away from a conversation',
        'the problem was never what was said, it was who was listening',
        'this is what happens when nobody in there has had a proper night\'s sleep',
        'the apology is going to be worse than the fight, i can feel it',
        'fights like that are how you find out who actually cares',
        '{actor} won the fight and lost the room',
      ],
    },
    defence: {
      timeline: [
        'leave {subject} alone, anyone would have reacted like that',
        '{subject} said what half of us were shouting at the screen',
        'getting upset is not a crime, the villa needs to calm down',
        'i would have said worse and so would you',
        'everyone calling {subject} dramatic would last one day in there',
        'standing up for yourself is not starting drama',
        '{subject} was pushed and pushed and finally said something',
        'the edit making {subject} look like the problem is so unfair',
        'everyone conveniently forgetting what {actor} said first',
        'you are allowed to be annoyed in a villa, it is a villa',
        'being honest about how you feel is not being aggressive',
        'i have watched it back and {subject} stayed calmer than i would have',
      ],
    },
  },

  // ── jealousy ─────────────────────────────────────────────────────────────

  'jealousy-talk': {
    'live-reaction': {
      timeline: [
        'the jealousy is jealousing tonight',
        '{subject} watching {actor} from across the pool like a security camera',
        'not {subject} storming over the second they saw the chat',
        'you could see the jealousy coming from the other end of the garden',
        '{receipt} and the whole terrace just stopped',
        'somebody hide the daybeds before this gets worse',
      ],
    },
    'hot-take': {
      timeline: [
        'a little bit of jealousy is cute. that was not a little bit',
        '{subject} is allowed to be jealous, the pull was not subtle',
        'if you are not exclusive you do not get to be that upset',
        'the person doing the shouting is never the one who actually did something',
        '{actor} knew exactly what they were doing having that chat in full view',
        'the jealous ones always end up the most loyal. always',
      ],
    },
  },

  // ── the villa takes sides ────────────────────────────────────────────────

  'blowup-talk': {
    'live-reaction': {
      timeline: [
        'THE VILLA HAS SPLIT DOWN THE MIDDLE',
        'the girls on one side of the lawn, the boys on the other, nobody speaking',
        '{subject} and {actor} have turned the whole place into a battlefield',
        'that was the biggest row of the series and it is not even close',
        'not everyone picking sides in real time',
        '{receipt} and i am exhausted just watching',
        'the narrator going quiet for once says everything',
        'everyone talking at once and nobody listening',
        'the boys by the fire pit, the girls by the pool, a cold war',
        'that went from a chat to a war in about four minutes',
        '{subject} standing in the middle of the lawn with nobody on their side',
      ],
    },
    'hot-take': {
      timeline: [
        'the villa needed that, it had gone way too comfortable',
        'the people who joined in just to have a go are worse than the two who started it',
        '{subject} lost this one the second the whole villa had to choose',
        '{actor} came out of that looking better and does not even know it yet',
        'nobody wins a fight with twelve people watching',
        'they will all be hugging by the next recoupling and pretending it never happened',
        'the villa was always going to split over this, it was just a matter of when',
        '{subject} picked the worst possible time to have that out',
        'the ones who stayed out of it are the smartest people in there',
        'every villa has one night like this and that was it',
      ],
    },
    'call-out': {
      timeline: [
        'the pile-in was out of order. two people had a fight and the whole villa joined in',
        'shouting over someone is not winning an argument',
        'some of them were enjoying that far too much',
        'the ones who said nothing and then went straight to the beach hut, i see you',
        'nobody checking on {actor} afterwards was very telling',
        'that got nasty and the edit made it look like fun',
      ],
    },
  },

  // ── somebody tells ───────────────────────────────────────────────────────

  'stirring-talk': {
    'live-reaction': {
      timeline: [
        'oh {subject} is TELLING. sit down',
        'the way {subject} waited until they were alone to say it',
        'not {actor} finding out like that, on a sunbed, in front of everyone',
        'the face {actor} pulled when they heard. i felt that',
        '{receipt} and now nobody is safe',
        'the gossip in that villa travels faster than the texts',
        'the second someone says "i don\'t want to cause drama but" you know',
        '{subject} saying it all with a straight face',
        'the whispering on the daybeds was so loud',
        'the timing of that chat was not an accident',
        '{actor} has gone very quiet since',
        'the hand on the knee before the bad news. classic',
        'not {subject} choosing the exact moment {actor} was happiest',
        'the gossip tonight has gossip',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is not looking out for anyone, that is stirring',
        'if my friend saw something i would want to know. {subject} did the right thing',
        'telling is only kind if you would say it in front of the person',
        'nothing that villa does is a secret for more than a day',
        'the ones who tell are always the ones with something to hide',
        '{receipt}. that is not news, that is a hand grenade',
        'there are kind ways to tell someone and that was not one',
        '{subject} has been waiting to say that for days',
        'half of what was said was true and the other half was a guess',
        'you can tell who someone fancies by who they tell tales on',
        'the villa runs on gossip and tonight it is running fast',
        '{subject} knew exactly what that would do',
        'telling someone in a villa is the same as telling everyone',
      ],
    },
    defence: {
      timeline: [
        'shooting the messenger again. {subject} only said what everyone saw',
        'a real friend tells you. {subject} is a real friend',
        'everyone hating on {subject} would be furious if nobody told them',
        'you cannot be mad at the person who told you the truth',
        'telling {actor} was the loyal thing and everyone knows it',
        'the villa is so happy to blame the one who said it instead of the one who did it',
        '{subject} could have kept quiet and chose not to. respect',
        'if you do not want it told, do not do it in front of cameras',
        'the real snake is the one who did the thing',
        '{subject} was looking out for {actor} and everyone knows it',
        'i would want a friend like {subject} in there',
        'people only call it stirring when it is about someone they like',
      ],
    },
  },

  // ── having it out over what they heard ───────────────────────────────────

  'confront-talk': {
    'live-reaction': {
      timeline: [
        '{subject} has heard and is not keeping quiet about it',
        'the walk across the lawn to have that chat. terrifying',
        'not {actor} trying to explain that with a straight face',
        '"can i grab you for a chat" is the scariest sentence in that villa',
        '{receipt} and i was holding a cushion the whole time',
        'the pause before {actor} answered said everything',
        'the whole villa pretending not to watch from the kitchen',
        'the arms folded before the first question',
        '{subject} asking one question and waiting. so calm. so scary',
        'the way {actor} said "who told you that" before saying anything else',
        'nobody blinked for the whole chat',
        'the swing has seen some things tonight',
      ],
    },
    'hot-take': {
      timeline: [
        '{actor} owned it and that is the only reason they survived',
        'the denial was so bad. you could see it in the eyes',
        'fair play to {subject} for asking straight out',
        'if you have to ask, you already know',
        'that was not an explanation, that was a speech',
        '{receipt}. i would not have been as nice about it',
        'one conversation does not fix that and they both know it',
        '{subject} handled that better than i would have',
        'the eye contact from {subject} the whole time. unbreakable',
        'asking who told you is not the same as saying it did not happen',
        'they were never going to sort that out on a daybed',
        'the honest answer would have taken ten seconds',
      ],
    },
    complaint: {
      timeline: [
        'too soft. far too soft',
        '{subject} deserves so much better than a half apology',
        'the way {actor} made it sound like it was nothing. it was not nothing',
        'stop letting them talk you round, please',
        'every time they forgive it happens again. every time',
        'the bar is on the floor and {actor} is still limboing under it',
      ],
    },
  },

  // ── and it ends ──────────────────────────────────────────────────────────

  'called-off-talk': {
    'live-reaction': {
      timeline: [
        'THEY ARE DONE. IT IS ACTUALLY DONE',
        '"i\'m done" and then walking off. iconic, devastating',
        '{subject} ending it with {actor} in the middle of the villa',
        'the silence after that. you could hear the pool filter',
        '{receipt} and i am not okay',
        'nobody saw that coming this morning and now it is over',
      ],
    },
    sympathy: {
      timeline: [
        'protect {subject}, they did nothing wrong',
        'the way {subject} held it together until the beach hut. my heart',
        'you could see how much {subject} wanted it to work',
        'sending all the love to {subject} tonight',
        'walking away from someone you like is the bravest thing you can do in there',
        'i hope {subject} knows the whole country is behind them',
      ],
    },
    gloating: {
      timeline: [
        'good. {actor} had it coming',
        'the best decision anyone has made in that villa all series',
        'karma is quick in there',
        '{actor} acting shocked is the funniest thing i have seen this week',
        'the couple nobody believed in, ended by the truth. fitting',
        'let this be a lesson to every other one of them',
      ],
    },
  },

  // ── the first kiss ───────────────────────────────────────────────────────

  'first-kiss-talk': {
    gushing: {
      timeline: [
        'THEY KISSED. THEY FINALLY KISSED',
        'the first kiss on the terrace and the whole villa cheering',
        '{subject} and {actor} kissing and me screaming into a pillow',
        'the giggle afterwards is going to live in my head',
        'that was worth every single slow episode',
        '{receipt} and i am kicking my feet',
      ],
    },
    ship: {
      timeline: [
        '{subject} and {actor}. that is the post',
        'i have the couple name ready, i have had it ready for days',
        'they look at each other like nobody else is in the villa',
        'protect this couple from every bombshell, please',
        'my winners. calling it now',
        'the chemistry is ridiculous, they did not even need a challenge',
      ],
    },
    'hot-take': {
      timeline: [
        'a first kiss on a dare does not count, sorry',
        'i give it until the next bombshell',
        'that kiss was for the cameras and you cannot tell me otherwise',
        'the kiss was cute but the chat before it was the real moment',
        '{actor} looked a bit surprised, which says a lot',
        'the first kiss is easy. the recoupling is where we find out',
      ],
    },
  },

  // ── Movie Night ──────────────────────────────────────────────────────────

  'movie-night-talk': {
    'live-reaction': {
      timeline: [
        'MOVIE NIGHT. the popcorn is a weapon',
        'not the clip of {subject} coming up on the big screen',
        'the camera cutting straight to {actor}\'s face. brutal',
        'everyone in the villa going silent at once',
        '{receipt} and the room just froze',
        'the beanbags have seen things tonight',
        'nobody is touching the popcorn anymore',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} has nowhere to hide now, it was all on the screen',
        'the producers waited all series to play that clip',
        'you cannot argue with the tape',
        'that clip was edited, but it was not made up',
        '{actor} deserved to see that',
        'the real show starts the second the screen goes off',
      ],
    },
    'call-out': {
      timeline: [
        '{subject} denying what we all just watched is something else',
        'the excuses after that clip were worse than the clip',
        'it was on camera. on camera',
        'trying to blame the edit when it is your own face in the clip',
        'the ones laughing at someone else\'s clip should check what is coming next',
        'not one apology, just explaining',
      ],
    },
  },

  // ── "I love you" ─────────────────────────────────────────────────────────

  'love-talk': {
    gushing: {
      timeline: [
        'THEY SAID IT. THEY SAID THE L WORD',
        '{subject} saying i love you on the terrace and me sobbing',
        'the way {actor} said it back without even thinking',
        'this is why i watch this show',
        'that was the most genuine thing anyone has said in that villa',
        '{receipt} and i need to lie down',
      ],
    },
    'hot-take': {
      timeline: [
        'love after a few weeks in a villa is a very particular kind of love',
        'i believe {subject}, i am not sure about {actor}',
        'saying it first is brave. saying it back that fast is suspicious',
        'they will be the real deal outside or they will last a month. nothing in between',
        'say it with your chest or do not say it at all',
        'i love you before the finale is a strategy and i will not be taking questions',
      ],
    },
  },

  // ── tears ────────────────────────────────────────────────────────────────

  'tears-talk': {
    sympathy: {
      timeline: [
        'somebody give {subject} a hug immediately',
        'seeing {subject} like that in the beach hut broke me',
        'it is so easy to forget they are real people having a very hard time',
        'the villa is a lot and it is allowed to be a lot',
        'whoever sat with {subject} afterwards, thank you',
        'crying in there is not weakness, it is just honest',
        '{subject} has had a really hard few days and it shows',
        'the hug afterwards was everything',
        'that beach hut chat was so raw',
        'they are away from everyone they know, of course it gets too much',
        'whatever you think of {subject}, nobody should feel like that',
        'the friends who sat with {subject} on the steps, that is what this show is',
        'it is a lot to be filmed every second of a bad day',
        'be kind online tonight. {subject} will read this one day',
      ],
    },
    'live-reaction': {
      timeline: [
        'not me crying because {subject} is crying',
        'the tears tonight. everyone is fragile',
        '{receipt} and i had to look away',
        'that one hit hard',
        'the strongest person in there cracked and it was hard to watch',
        'i did not expect to feel this much about a villa',
        'the second the voice cracked i was gone',
        '{subject} trying to laugh it off and not managing it',
        'i had to stop eating my dinner for that',
        'the music under that scene was cruel',
        '{receipt}. that was hard to see',
        'the whole villa went quiet for {subject}',
        'not the beach hut tears tonight',
        'everyone has a moment in there eventually and tonight was {subject}\'s',
      ],
    },
  },

  // ── back together ────────────────────────────────────────────────────────

  'reunite-talk': {
    'live-reaction': {
      timeline: [
        'THEY ARE BACK TOGETHER',
        'not {subject} and {actor} giving it another go',
        'the hug at the end. the whole villa clapping',
        '{receipt} and i am pretending i did not cry',
        'after all that. after ALL that',
        'the comeback of the series and it is not close',
      ],
    },
    'hot-take': {
      timeline: [
        'going back to someone who did that to you is a choice',
        'i am happy for them and i do not trust it at all',
        '{subject} deserves better and went back anyway',
        'second chances in that villa are never as clean as they look',
        'if they make it to the final after this, they deserve to win',
        'they broke up loudly and got back together quietly. interesting',
      ],
    },
    gushing: {
      timeline: [
        'my couple is back and all is right with the world',
        'i knew they would find their way back',
        'some people are just meant to be in each other\'s way',
        '{subject} and {actor} forever, i do not make the rules',
        'the apology was perfect and so is this',
        'everyone who wrote them off, how are we feeling',
      ],
    },
  },

  // ── the storylines (js/pm/threads.js): a graft, a turned head, a shut-down,
  // the cracks. {subject} is the one it is about: the grafter, the one whose
  // head turned, the one who said no, the one who gave the answer that hurt.

  'graft-talk': {
    'live-reaction': {
      timeline: [
        'oh {subject} is GRAFTING grafting',
        '{subject} pulling {actor} for a chat in full view of the whole villa. bold',
        '{receipt} and the daybeds went silent',
        'not {subject} saying "just a chat" with that face',
        'the way {actor} said yes to that chat way too fast',
        'everyone on the terrace pretending they are not watching that chat. we are all watching that chat',
        'the graft has started and i am seated',
        '{subject} has been building up to this for two days and you could tell',
      ],
    },
    'hot-take': {
      timeline: [
        'it is a dating show. pulling someone for a chat is literally the point',
        'grafting on someone coupled up is fair game until they say no. then it is not',
        '{subject} did it to their face at least. respect the honesty, hate the timing',
        'if one chat can shake a couple, the couple was not that solid',
        '{actor} is the one who should be explaining, not {subject}',
        'the grafters always get the edit. always',
      ],
    },
    defence: {
      timeline: [
        'leave {subject} alone, they asked for a chat, not a wedding',
        'nobody in there is married. {subject} is allowed to want someone',
        'at least {subject} is not sneaking around about it',
        'the hate {subject} is getting for one chat is wild',
        'if {actor} was that happy, {actor} would have said no in five seconds',
        'grafting is the job description. {subject} is just good at their job',
      ],
    },
  },

  'head-turned-talk': {
    'live-reaction': {
      timeline: [
        'HIS HEAD HAS BEEN TURNED. or hers. whoever. i am screaming',
        '{receipt} and i actually gasped',
        'not "my head has been turned" with {actor} sitting RIGHT there',
        '{actor}\'s face when {subject} said it. i felt that in my chest',
        'the silence after that was the loudest thing this whole series',
        '{subject} finally said it out loud and the villa will never be the same',
        'you could see this coming for three episodes and it still hurt',
      ],
    },
    'hot-take': {
      timeline: [
        'better a turned head said out loud than a sneaky one at casa',
        '{subject} was honest. it was cruel, but it was honest',
        'if your head turns that easy it was never really facing the right way',
        'the fans of {subject} going very quiet tonight',
        '{actor} deserved to hear it before the whole villa did',
        'heads turn in there every week. it is what you do next that matters',
      ],
    },
    'call-out': {
      timeline: [
        '{subject} had every chance to say this privately and chose not to',
        'stringing {actor} along for days and then THIS. no',
        '{subject} wanted it both ways and now has neither',
        'whoever is defending {subject} tonight, i am not reading it',
        '{subject} let {actor} make plans for the outside. then this',
        'the nicest possible way of being the worst person in the villa',
      ],
    },
  },

  'shut-down-talk': {
    'live-reaction': {
      timeline: [
        '{subject} said NO and i stood up in my living room',
        '{receipt} and it was perfect',
        'the way {subject} did not even let the chat get started',
        '{actor} walking back to the daybeds after that. ouch',
        'shut down. politely. but SHUT DOWN',
        '{subject} closing that door so fast it made a noise',
      ],
    },
    gushing: {
      timeline: [
        '{subject} is the most loyal person in that villa and it is not close',
        'everyone deserves someone who shuts it down like {subject} just did',
        'protect {subject} at all costs',
        'that is what being closed off actually looks like',
        'my respect for {subject} just went through the roof',
        'loyal AND kind about it. {subject} is the moment',
      ],
    },
    'hot-take': {
      timeline: [
        '{actor} should have seen that coming from a mile off',
        'there is a nice way to say no and {subject} found it',
        'a shut-down that kind is somehow worse for {actor}',
        'saying no is easy. saying it like that takes a good person',
        'the grafters are going to stop trying with {subject} after that',
        'one no like that is worth ten loyal speeches at the fire pit',
      ],
    },
  },

  'cracks-talk': {
    'live-reaction': {
      timeline: [
        '{receipt} and i had to put my phone down',
        'not the "where is your head at" chat going completely wrong',
        '{actor}\'s face when {subject} answered. oh no',
        'the pause before {subject} answered said everything',
        'i do not think {actor} expected that answer. i do not think anyone did',
        'this couple has been cracking for days and tonight you could hear it',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} is not all in and has not been for a while',
        'honest answers in there are rare. this one cost a lot',
        'if you have to ask where their head is at, you already know',
        '{actor} deserves someone who does not need a minute to answer that',
        'this is the start of the end for them. calling it now',
        'at least {actor} knows now. knowing is better than guessing in there',
      ],
    },
    sympathy: {
      timeline: [
        'my heart is with {actor} tonight',
        'nobody wants to hear that answer from the person they wake up next to',
        '{actor} keeping it together after that was so strong',
        'sending {actor} the biggest hug through the screen',
        '{actor} has given that couple everything. this is so unfair',
        'whoever sits with {actor} tonight, thank you',
      ],
    },
  },
};

/** The alumni room's takes on the same moments. `s` is the subject's name. */
export const VILLA_CHAT_TAKES = {
  row: [
    () => 'Every couple has a fight in there. It is what happens after that tells you if they will last.',
    ({ s }) => `${s} has been holding that in for days. You could see it at breakfast.`,
    () => 'There is no privacy in that villa. A fight is always a fight in front of everyone.',
    () => 'Heat, no sleep, and nowhere to walk away to. Of course they argue.',
    ({ s }) => `I think ${s} will feel better for saying it, even if it came out wrong.`,
    () => 'The cameras love a fight on the terrace. The islanders hate them.',
    () => 'The make-up chat is where you see who actually means it.',
    () => 'Watch who walks off first. That is usually the one who knows they were wrong.',
  ],
  jealous: [
    () => 'Jealousy in there is a sign somebody cares. It is also a sign they are scared.',
    ({ s }) => `${s} has every right to ask. How they asked is a different conversation.`,
    () => 'You watch your person chat to someone new and your stomach drops. Everybody gets it.',
    () => 'If you are not exclusive, you do not get to be furious. You get to be honest.',
    () => 'The jealous ones are often the ones who have already decided.',
    () => 'The other person in the chat always says it was nothing. It is rarely nothing.',
    ({ s }) => `I think ${s} needs to hear where they stand, and soon.`,
    () => 'A little jealousy is romance. A lot of it is a red flag.',
  ],
  blowup: [
    () => 'When the whole villa takes sides, nobody comes out of it well.',
    ({ s }) => `${s} has lost the room tonight. Winning it back takes a lot longer.`,
    () => 'The people who joined in will regret it before the recoupling.',
    () => 'A villa splits in a minute and takes a week to put back together.',
    () => 'The quiet ones who stayed out of it are the smartest people in there tonight.',
    () => 'Everyone will be in the beach hut after that, saying they were on the right side.',
    ({ s }) => `I would not want to be ${s} at breakfast tomorrow.`,
    () => 'Nothing makes a villa louder than twelve people who have chosen a side.',
  ],
  gossip: [
    () => 'Nothing stays secret in there. The only question is who tells, and when.',
    ({ s }) => `${s} thinks that was helping. Not everyone in there will see it that way.`,
    () => 'Telling someone is either loyalty or stirring. The villa decides which.',
    () => 'The one who tells always becomes part of the story.',
    () => 'If you would not say it in front of the person, think hard before you say it.',
    () => 'Watch what happens next, not the telling. That is where the damage is.',
    ({ s }) => `I would have done exactly what ${s} did. I would have done it more quietly.`,
    () => 'Every villa has one person who hears everything. They are never bored.',
  ],
  'had-it-out': [
    () => 'Asking straight out is the bravest thing you can do in there.',
    ({ s }) => `${s} wanted the truth and got a version of it.`,
    () => 'Owning it is the only answer that saves you. Everything else makes it worse.',
    () => 'If you have to ask, you already know. The chat is just about how you find out.',
    () => 'The forgiving part is easy to say on the night. It is hard to keep doing.',
    ({ s }) => `I think ${s} handled that better than most of us would have.`,
    () => 'A last chance in that villa is a very short rope.',
    () => 'Denying it is a gamble. The whole country saw what happened.',
  ],
  'called-off': [
    () => 'Ending it in there is so hard. You still have to see them at breakfast.',
    ({ s }) => `${s} walking away took real strength.`,
    () => 'The villa will rally round. It always does after a break-up.',
    () => 'Once the trust goes in there, it does not come back easily.',
    () => 'The next recoupling just became very interesting.',
    ({ s }) => `I think ${s} will be stronger for this, whatever it feels like tonight.`,
    () => 'Some couples break up quietly. That one broke up in front of everyone.',
    () => 'Being single in there is dangerous. Being with the wrong person is worse.',
  ],
  'first-kiss': [
    () => 'A first kiss in there is never private, and that is half the fun.',
    ({ s }) => `${s} has been waiting for that for a while.`,
    () => 'The kiss is lovely. The chat afterwards is where you find out what it meant.',
    () => 'Everyone cheered, and at least two people were not happy about it.',
    () => 'The first kiss changes how the villa treats you. You are a couple now.',
    () => 'That was sweet. I do not think anybody expected it tonight.',
    ({ s }) => `I would be very happy if I were ${s} this morning.`,
    () => 'A kiss before the recoupling is a statement. Everybody saw it.',
  ],
  'movie-night': [
    () => 'Movie Night is the cruellest night of the series, and the most honest.',
    ({ s }) => `${s} knew that clip existed. Watching it with everyone is something else.`,
    () => 'You cannot argue with the tape. You can only decide how you react to it.',
    () => 'The clip is two minutes. The fallout lasts the rest of the series.',
    () => 'Everyone laughs at the first clip and then waits for theirs.',
    () => 'The producers save the best ones for when it will hurt most.',
    ({ s }) => `I think ${s} will be explaining that one for days.`,
    () => 'Owning it straight away is the only way out of a Movie Night clip.',
  ],
  'love-said': [
    () => 'Saying it in there is a huge thing. You cannot take it back.',
    ({ s }) => `${s} meant every word. You could see it.`,
    () => 'Love in a villa moves fast. It does not mean it is not real.',
    () => 'The public love a couple who says it first and means it.',
    () => 'Saying it back straight away is either very sure or very scared.',
    () => 'The rest of the villa will look at them differently now.',
    ({ s }) => `I hope ${s} hears it back on the outside too.`,
    () => 'That was the moment the series was building to for them.',
  ],
  tears: [
    () => 'It is a lot in there. Heat, no phone, no family, and everything filmed.',
    ({ s }) => `${s} has been holding it together for a long time.`,
    () => 'A cry in the beach hut is the most honest thing on the show.',
    () => 'The friends who sat with them afterwards are the real ones.',
    () => 'People forget how tiring it is to be on all day.',
    ({ s }) => `I hope ${s} has someone to lean on in there.`,
    () => 'It is not weakness. It is what happens to everybody in there eventually.',
    () => 'The public warm to someone who lets the mask slip.',
  ],
  'back-together': [
    () => 'Getting back together in there is a big risk. Everyone saw the first time.',
    ({ s }) => `${s} has decided it was worth another go.`,
    () => 'The apology mattered. Without it, that was never happening.',
    () => 'Second chances in that villa are never as simple as they look.',
    () => 'The villa will be watching them very closely now.',
    () => 'If they make it to the final after this, they will deserve it.',
    ({ s }) => `I hope ${s} gets what they need from it this time.`,
    () => 'They know each other properly now. That can only help.',
  ],
  grafting: [
    () => 'Pulling someone who is coupled up is the game. How you do it is the character.',
    ({ s }) => `${s} has decided to go for it. You cannot fault the confidence.`,
    () => 'One chat is nothing. Three chats in a day is a graft.',
    () => 'Watch the partner, not the grafter. The partner tells you how solid it was.',
    ({ s }) => `If ${s} gets a no, I hope they take it well. That is what people remember.`,
    () => 'Every villa needs someone who will not just sit and wait.',
    () => 'The chat itself is never the story. The partner finding out is.',
    ({ s }) => `${s} picked a very public place for a private question.`,
  ],
  'head-turned': [
    () => 'Saying your head has turned out loud is the hardest thing you do in there.',
    ({ s }) => `${s} was honest. The public will decide if it was the right kind of honest.`,
    () => 'A turned head is never the end of it. The next recoupling is.',
    () => 'Once it is said, the couple is never quite the same, even if they stay together.',
    ({ s }) => `I do not envy ${s} at breakfast tomorrow.`,
    () => 'The partner always finds out last, and always feels it most.',
    () => 'Better said now than walked in with at Casa.',
    ({ s }) => `${s} will be asked about that at every fire pit from now on.`,
  ],
  'shut-down': [
    () => 'A clean no is the kindest thing you can give someone in there.',
    ({ s }) => `${s} knows exactly what they want. That is rare in a villa.`,
    () => 'The public love a loyal islander. That just won a lot of people over.',
    () => 'The one who got turned down will be fine. It is the not knowing that hurts.',
    ({ s }) => `${s}'s partner should be very happy tonight.`,
    () => 'Closing a door that politely takes practice.',
    () => 'Some people come in to play. Some come in to find one person. That was the second kind.',
    ({ s }) => `Whoever pulls ${s} next will think twice.`,
  ],
  cracks: [
    () => 'When you have to ask where someone is at, the answer usually hurts.',
    ({ s }) => `${s} gave the honest answer. It was not the one anyone wanted.`,
    () => 'Couples crack in there all the time. Some of them set again.',
    () => 'The first hard conversation tells you everything about the next three weeks.',
    ({ s }) => `I think ${s} has known for a while and just said it tonight.`,
    () => 'That is the moment a couple starts to come apart, or starts to get real.',
    () => 'You can come back from an honest answer. You cannot come back from a lie.',
    ({ s }) => `The next recoupling will tell us if ${s} meant it.`,
  ],
};
