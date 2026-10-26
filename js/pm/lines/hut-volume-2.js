// pm/lines/hut-volume-2.js — more beach-hut lines (the user, 2026-10-22:
// "address the repeats by increasing the volume of the dialogue ALOT").
// Measured after round five: the catch-all two-faced lines, one per group of
// scene kinds, were heard 9 to 14 times a season, and a few honest pools held
// a single line (the debrief's listener, the advice's friend, the families).
// Same rules as hut.js.
import { HUT_GROUPS } from './hut.js';

const { CEREMONY, ARRIVALS, CHALLENGE, LOUD, COUPLE } = HUT_GROUPS;
const B = { withB: true };
const K = (kind, more = {}) => ({ kind, ...more });
const STORY = ['mugged-low', 'crush-watch', 'rival-won', 'camp-split', 'triangle-teams', 'betray-end', 'villa-divided', 'cold-shoulder',
  'clear-the-air', 'notes', 'casa-goodbye', 'casa-react', 'hideaway-morning', 'hideaway-win'];
const DATES = ['date', 'date-picked', 'date-back', 'date-text'];
const MOVIE = ['movie-clip', 'movie-react', 'movie-row', 'photo-row', 'photos'];
const EVERYDAY = ['friendship', 'chat', 'deep-chat', 'kiss', 'pull', 'loyalty', 'comedy', 'advice', 'vent', 'comfort'];

const lines = (prefix, when, texts) => texts.map((t, i) => ({ id: `${prefix}${i + 1}`, when, turns: [['a', t]] }));

export const HUT_VOLUME_2 = {
  honest: [
    ...lines('hutv2.debrief.h', K('debrief', { role: 1 }), [
      "Debriefs are where you find out what people really think. Tonight I found out a lot.",
      "I just sat there and listened. You learn more by listening in here than by talking.",
      "Everyone's honest at a debrief. It's the only time anyone in this villa says what they mean.",
      "I'm going to be thinking about what I just heard for the rest of the night.",
    ]),
    ...lines('hutv2.advice.r1.h', K('advice', { ...B, role: 1 }), [
      "I asked for {b}'s opinion, and I got it. I didn't like all of it. I needed all of it.",
      "{b} doesn't sugar-coat anything. That's why I asked. Now I've got a lot to think about.",
      "I trust {b} more than anyone in here. If {b} says something, it's worth listening to.",
    ]),
    ...lines('hutv2.advice.r0.h', K('advice', { ...B, role: 0 }), [
      "I told {b} the truth. That's what friends are for, even when the truth isn't nice.",
      "I hope {b} takes it the right way. I'd want someone to tell me.",
    ]),
    ...lines('hutv2.families.h', K('families', { ...B, role: 0 }), [
      "Having my family here, with {b}, was surreal. Two parts of my life in one place.",
      "I was so nervous about my family meeting {b}. I didn't sleep last night.",
      "Seeing my family's faces after all this time. I didn't realise how much I'd missed them until they were in front of me.",
    ]),
    ...lines('hutv2.comfort.h', K('comfort', { role: 0 }), [
      "Nobody should have to cry on their own in here. Not while I'm around.",
      "Sometimes you don't need to say anything. You just need to sit there.",
      "I've been there. On that bathroom floor. Someone sat with me. I'm just passing it on.",
    ]),
    ...lines('hutv2.pilein.h', K('pile-in', { role: 0 }), [
      "I wasn't going to sit there and say nothing. That's my friend.",
      "Maybe it wasn't my fight. It is now.",
      "I don't usually get involved. Today I had to.",
    ]),
    ...lines('hutv2.friend.h', K('friendship', B), [
      "{b} makes this place feel like home. A loud, sweaty, very small home.",
      "I don't know what I'd do in here without {b}. I don't want to find out.",
      "{b} gets me. Properly gets me. You don't find that very often, in here or out there.",
      "Me and {b} could spend a whole day doing nothing and it'd still be my favourite day.",
      "{b} always knows when I need a laugh. Today I needed a big one, and I got it.",
      "If {b} goes home before me, I'm going to be in bits. Absolute bits.",
      "Every time I'm having a wobble, {b} is there. Every single time.",
      "The best thing about this villa isn't the couples. It's people like {b}.",
    ]),
    ...lines('hutv2.pull.h', K('pull', { ...B, role: 0 }), [
      "I've been wanting to do that for days. My heart's still going.",
      "Whatever happens next, I'm glad I asked {b}. I'd have regretted it forever if I hadn't.",
      "I'm not sure where {b}'s head is at. I know where mine is.",
      "That chat with {b} went better than I imagined, and I imagined it a lot.",
    ]),
    ...lines('hutv2.pull.r1.h', K('pull', { ...B, role: 1, rebuffed: false }), [
      "I didn't see that coming from {b}. I'm not saying I mind.",
      "{b} has got me thinking. I wasn't expecting to be thinking today.",
      "That was a nice surprise. I'm still smiling. Don't tell anyone.",
    ]),
    ...lines('hutv2.chat.h', K('chat', B), [
      "Me and {b} just make sense. I don't know how else to put it.",
      "Every day with {b}, I find out something new, and every new thing makes me like {b} more.",
      "I didn't think I'd find someone like {b} in here. I'm so glad I was wrong.",
      "It's the little things with {b}. The way {b} saves me a seat. The way {b} remembers how I take my tea.",
      "When it's just me and {b}, I forget the cameras are even there.",
    ]),
    ...lines('hutv2.kiss.h', K('kiss', B), [
      "I'm not going to pretend that wasn't the best part of my day.",
      "Kissing {b} never gets old. I keep waiting for it to get old. It doesn't.",
      "Everyone was watching. I genuinely didn't care.",
    ]),
    ...lines('hutv2.loyalty.h', K('loyalty', { ...B, role: 0 }), [
      "I said no. I'd say no again. I know exactly who I want, and it isn't {b}.",
      "I felt bad saying no to {b}. I didn't feel unsure about it.",
      "That's the second time someone's tried today. I'm flattered. I'm also taken.",
    ]),
  ],
  'two-faced': [
    ...lines('hutv2.story.t', { kind: STORY }, [
      "I'm keeping my head down and my mouth shut. That's the plan for the rest of the week.",
      "Everyone thinks I'm worried about the same thing they're worried about. I'm worried about something else entirely.",
      "I've got a very calm face on today. You'd never know what's going on behind it.",
      "If anyone looks too closely at me this week, I'm in trouble. So I'm making sure they don't.",
      "Being quiet is my best friend in here right now. Being quiet and very, very helpful.",
      "Nobody's asked me anything awkward yet. Every day that goes past, I breathe a bit easier.",
      "I'm saying all the right things to all the right people. It's exhausting.",
      "I can feel it, like a weight. One question from the wrong person and it all comes out.",
    ]),
    ...lines('hutv2.chal.t', { kind: CHALLENGE }, [
      "Every time they read out a card, my stomach dropped. None of them were about me. This time.",
      "I laughed louder than anyone at that challenge. It's a good cover. Laughing.",
      "I was so busy making sure I didn't give anything away, I forgot to actually play.",
      "Games like that are dangerous for someone like me right now. I got through it. Just.",
      "One wrong question, and that challenge would have been the end of me.",
      "I kept a straight face the whole way through. I deserve an award.",
    ]),
    ...lines('hutv2.cer.t', { kind: CEREMONY }, [
      "Everyone's scared of the fire pit. I'm scared of what somebody might say at it.",
      "I'm holding hands and smiling, and inside I'm counting how many people know.",
      "If tonight's the night it all comes out, I'd rather it came out later. Much later.",
      "I'm not nervous about being dumped. I'm nervous about being found out first.",
      "Smile. Hold hands. Don't look at anyone you shouldn't. That's my whole plan for tonight.",
      "Fire pits make people honest. That's why I hate them right now.",
    ]),
    ...lines('hutv2.arrive.t', { kind: ARRIVALS }, [
      "A new face means new questions. I'm not in the mood for questions.",
      "Everyone's excited about the new arrival. I'm just hoping nobody new starts digging.",
      "I clapped. I smiled. I'm hoping nobody saw me looking at the door.",
      "New people notice things. The rest of the villa has stopped noticing. That's what scares me.",
    ]),
    ...lines('hutv2.loud.t', { kind: LOUD }, [
      "While everyone's shouting about that, nobody's looking at me. I'll take it.",
      "Other people's fights are the best thing that can happen to me this week.",
      "I joined in. Loudly. It's easier to be loud about someone else's mess.",
      "The more drama there is, the safer I feel. That's a terrible thing to say. It's true.",
    ]),
    ...lines('hutv2.date.t', { kind: DATES }, [
      "I'm smiling about the date. I'm smiling a bit too much. I'm aware.",
      "The date was nice. The date was also a very good distraction.",
      "Everyone's asking about the date. Good. Let them ask about that.",
    ]),
    ...lines('hutv2.movie.t', { kind: MOVIE }, [
      "Every clip they played, I was waiting for my face to come up. It didn't. This time.",
      "I watched that whole night with my heart in my mouth.",
      "I clapped for every clip that wasn't me. Loudly.",
    ]),
    ...lines('hutv2.couple.t', { kind: COUPLE, ...B }, [
      "{b} thinks everything is perfect. I'd like to keep it that way.",
      "I hold {b}'s hand, and I think, if you knew. And then I hold it tighter.",
      "We're the happy couple. That's what everyone says. That's what I keep saying.",
      "{b} is so sure about us. I want to be that sure.",
      "Sitting there with {b}, I kept rehearsing what I'd say if it all came out.",
    ]),
    ...lines('hutv2.every.t', { kind: EVERYDAY, ...B }, [
      "{b} had no idea. {b} just kept talking, and I just kept nodding.",
      "I was there, and I wasn't there. My head was somewhere else the whole time.",
      "{b} asked me if I was okay. I said yes. That's my answer to everything this week.",
      "I'm good at this. Too good. Smile, nod, change the subject.",
      "Every nice thing {b} said, I felt a bit worse.",
      "I've never been so nice to so many people. It's guilt, mostly.",
    ]),
  ],
};
