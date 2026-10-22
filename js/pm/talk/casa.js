// ══════════════════════════════════════════════════════════════════════
// pm/talk/casa.js — the villas split: missing someone, and sharing a bed
// ══════════════════════════════════════════════════════════════════════
//
// casa-miss: {a} misses {about}, in the other villa, and tells {b}, a friend
//   who stayed on the same side. How it comes out is the engine's (`of`:
//   aches · worries · tears).
// bed-share: {a}, coupled with {pa} in the other villa, shares a bed with {b},
//   one of the new arrivals. How far it goes is the engine's (`of`: bed · kiss).
import { build } from './build.js';

export const CASA_MISS = build('casa-miss', {
  stages: [
    { stage: "{a} and {b} sit on the daybeds while the new arrivals laugh by the pool." },
    { stage: "{a} and {b} are lying on the sunbeds." },
  ],
  plans: {
    featured: ['open', 'miss', 'friend', 'close'],
    short: ['miss', 'friend'],
  },
  moves: {
    open: [
      { stage: "{a} sits on the edge of the pool, staring at nothing.", turns: [
        ['b', "You've been quiet all day. What's up?"],
        ['a', "Nothing. Everything. I don't know."],
      ] },
      { stage: "{b} finds {a} in bed early, with the covers pulled up.", turns: [
        ['b', "You're in bed already? It's not even dark."],
        ['a', "I just wanted to be on my own for a bit."],
        ['b', "Well, tough. Budge up."],
      ] },
      { stage: "{a} and {b} sit on the daybeds while the new arrivals laugh by the pool.", turns: [
        ['b', "You're not even looking at them."],
        ['a', "I'm not interested in looking at them."],
      ] },
    ],
    miss: [
      { when: { of: 'aches' }, turns: [
        ['a', "I just miss {about}. Like, properly miss {about}. It's so weird. I didn't realise how much I'd got used to having {about} around until {about} wasn't there. I keep turning round to say something, and it's someone else."],
        ['b', "That's really sweet, actually."],
        ['a', "It's not sweet. It's annoying."],
      ] },
      { when: { of: 'aches' }, turns: [
        ['a', "Everyone in here's having the time of their lives with the new lot, and all I want is to sit on the swing seat with {about} and talk about nothing. Is that sad? It's sad, isn't it?"],
        ['b', "It's not sad. It means it's real."],
      ] },
      { when: { of: 'worries' }, turns: [
        ['a', "What if {about}'s not thinking about me at all? What if {about}'s over there in bed with someone new, having the best time, and I'm sitting here like an idiot, missing {about}? I can't stop thinking about it."],
        ['b', "You don't know that."],
        ['a', "I don't know anything. That's the problem."],
      ] },
      { when: { of: 'worries' }, turns: [
        ['a', "I trust {about}. I do. I trust {about}. But I don't trust that villa. Everyone knows what Casa does to people. People who swore they were solid come back with someone else on their arm."],
        ['b', "Not everyone."],
        ['a', "Enough people."],
      ] },
      { when: { of: 'tears' }, turns: [
        ['a', "I'm sorry. I'm sorry, I said I wasn't going to cry. I just really miss {about}. And I'm scared. I'm scared I'm going to stand there at that recoupling, and {about} is going to walk in holding someone else's hand."],
        ['b', "Come here. Come here."],
      ] },
      { when: { of: 'tears' }, turns: [
        ['a', "I didn't think it'd hit me like this. Day one, I was fine. I was like, I'm strong, I've got this. And now I can't even look at the empty bed without crying."],
        ['b', "That's okay. It's okay to miss {about}."],
      ] },
    ],
    friend: [
      { turns: [
        ['b', "Listen. You've stayed loyal. You've done everything right. Whatever happens on the other side, you'll be able to hold your head up. And if {about} comes back without you in mind, then {about} isn't the person you thought, and you're better off knowing."],
        ['a', "You're right. I know you're right."],
      ] },
      { turns: [
        ['b', "I've seen how {about} looks at you. I don't think a few days with strangers changes that. Honestly, I'd put money on {about} walking back in on {about.posAdj} own."],
        ['a', "Would you?"],
        ['b', "Every penny I've got."],
      ] },
      { when: { of: 'tears' }, turns: [
        ['b', "Cry it out. Honestly. Better in here with me than at the recoupling. Get it all out now, and then tomorrow you're going to put your best outfit on, and you're going to walk out there with your head up."],
        ['a', "My best outfit."],
        ['b', "Your best outfit. Non-negotiable."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} stays with {a} until {a} falls asleep." },
      { turns: [['a', "Thanks for putting up with me."], ['b', "Always. That's what I'm here for."]] },
      { turns: [], beat: "{a} goes back out to the others, but {a.posAdj} mind is clearly in the other villa." },
    ],
  },
  notes: [
    { stage: "{a} tells {b} how much {a} is missing {about}." },
    { when: { of: 'tears' }, stage: "{a} has a little cry about {about}, and {b} is there for {a.obj}." },
  ],
});

export const BED_SHARE = build('bed-share', {
  stages: [
    { stage: "The lights are off, and {a} and {b} are sharing a bed." },
  ],
  plans: {
    featured: ['night', 'talk', 'end'],
    short: ['talk', 'end'],
  },
  moves: {
    night: [
      { stage: "The lights go out. {a} and {b} end up in the same bed.", turns: [
        ['b', "Is it okay if I sleep here?"],
        ['a', "Yeah. I mean, there's nowhere else, is there?"],
        ['b', "There's the daybed."],
        ['a', "Don't be silly. Get in."],
      ] },
      { stage: "{b} climbs into the bed next to {a} as everyone settles down.", turns: [
        ['b', "Right. Don't steal the covers."],
        ['a', "I don't steal the covers."],
        ['b', "That's what everyone says."],
      ] },
      { stage: "{a} hesitates at the side of the bed, then gets in next to {b}.", turns: [
        ['a', "This is weird."],
        ['b', "Why is it weird?"],
        ['a', "Because the last person I shared this bed with is in another villa."],
      ] },
    ],
    talk: [
      { turns: [
        ['b', "Can I ask you something? Are you missing {pa}?"],
        ['a', "Honestly? Yeah. But I'm also... I don't know. I'm having fun. You're fun. Is that bad?"],
        ['b', "It's not bad. It's Casa."],
      ] },
      { turns: [
        ['b', "You've got goosebumps."],
        ['a', "It's cold."],
        ['b', "It's not cold."],
        ['a', "Then it's something else."],
      ] },
      { turns: [
        ['a', "I'm going to be honest with you. I'm in my head about this. I've got {pa} on the other side, and I said I'd be loyal, and I meant it. But I'm lying here next to you, and I'm not thinking about {pa}."],
        ['b', "What are you thinking about?"],
        ['a', "Don't make me say it."],
      ] },
      { turns: [
        ['b', "What would {pa} say if {pa} could see us right now?"],
        ['a', "Nothing good."],
        ['b', "We're just sleeping."],
        ['a', "We're just sleeping. Yeah."],
      ] },
    ],
    end: [
      { when: { of: 'bed' }, turns: [
        ['a', "Night, then."],
        ['b', "Night."],
      ], beat: "They lie there in the dark, closer than they need to be, until they fall asleep." },
      { when: { of: 'bed' }, turns: [], beat: "{a} turns over to face the wall, and stays there all night. Mostly." },
      { when: { of: 'kiss' }, turns: [
        ['b', "Can I kiss you?"],
        ['a', "You shouldn't."],
        ['b', "That's not a no."],
      ], beat: "It isn't a no. Under the covers, {a} kisses {b}." },
      { when: { of: 'kiss' }, turns: [], beat: "In the dark, {b} leans in, and {a} doesn't pull away. They kiss, and somewhere across the room, someone sees." },
    ],
  },
  notes: [
    { when: { of: 'bed' }, stage: "{a} shares a bed with {b}. Just sleeping. Mostly." },
    { when: { of: 'kiss' }, stage: "{a} and {b} share a bed, and a kiss, under the covers." },
  ],
});
