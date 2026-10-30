// ══════════════════════════════════════════════════════════════════════
// pm/talk/dumping.js — after the verdict: the goodbyes (pm/moments.js dumpingScene)
// ══════════════════════════════════════════════════════════════════════
//
// dump-reaction  {a} watches {b}, {a.posAdj} partner, be dumped. Their goodbye.
// solidarity     {a} won't stay without {b}, and walks out too.
// dump-goodbye   {a} is leaving. With {b} (`withB`): a friend's goodbye. On
//                {a.posAdj} own: the last words, at the top of the steps.
// All always shown whole: a dumping is never a note.
import { build } from './build.js';

const GIRLS = { gender: 'f', bGender: 'f' };
const BOYS = { gender: 'm', bGender: 'm' };

export const DUMP_REACTION = build('dump-reaction', {
  tiered: false,
  plans: { featured: ['hold', 'words', 'last?'], short: ['hold', 'words'] },
  moves: {
    hold: [
      { when: { sour: null }, turns: [], beat: "{a} is on {a.posAdj} feet before the host has finished, and pulls {b} into a hug." },
      { when: { sour: null }, turns: [], beat: "{a} doesn't move for a second. Then {a} grabs {b}'s hand and doesn't let go." },
      { when: { sour: null }, turns: [['a', "No. No, no, no."]], beat: "{a} wraps {a.posAdj} arms round {b} and buries {a.posAdj} face in {b.posAdj} shoulder." },
      { when: { sour: null }, turns: [], beat: "{b} turns to {a}, and {a} is already crying." },
      // A day that went wrong between them (script.js sourOf): nobody runs into anybody's arms.
      { when: { sour: ['mine', 'theirs', 'row'] }, turns: [], beat: "{a} stands up slowly. After today, neither of them knows if a hug is still allowed." },
      { when: { sour: ['mine', 'theirs', 'row'] }, turns: [], beat: "{b} looks at {a} across the fire pit, and for a second nobody in the villa breathes." },
    ],
    words: [
      // a did the wrong today, and b is the one going
      { when: { sour: 'mine' }, turns: [
        ['a', "I'm sorry. About today. About all of it."],
        ['b', "Are you sorry, or are you sorry I found out?"],
        ['a', "That's not fair."],
        ['b', "Not much about today has been."],
      ] },
      { when: { sour: 'mine' }, turns: [
        ['a', "I didn't want it to end like this."],
        ['b', "Then you should have thought about that this afternoon."],
        ['a', "Can we at least talk on the outside?"],
        ['b', "Maybe. Ask me when it doesn't hurt."],
      ] },
      // b did the wrong, and b is the one going
      { when: { sour: 'theirs' }, turns: [
        ['b', "I know what you think of me right now. I'm sorry it ends like this."],
        ['a', "So am I. But you made it end like this. Not them."],
        ['b', "Yeah. I know."],
      ] },
      { when: { sour: 'theirs' }, turns: [
        ['b', "Say something. Anything."],
        ['a', "I don't know what you want me to say. This morning I'd have cried. Now I don't know what I feel."],
        ['b', "That's worse."],
        ['a', "I know it is."],
      ] },
      { when: { sour: 'row' }, turns: [
        ['a', "We never even sorted it out."],
        ['b', "We will. Outside. Without everyone watching."],
        ['a', "Promise you'll actually ring me."],
        ['b', "I'll ring you. Go on."],
      ] },
      { when: { feels: 'strong', sour: null }, turns: [
        ['a', "This isn't fair. This isn't fair. I've only just found you."],
        ['b', "Hey. Look at me. This isn't the end, okay? This is just the end of in here. I'll be waiting for you on the outside, I promise you that."],
        ['a', "You'd better be."],
        ['b', "I'll be the first one there when you walk out."],
      ] },
      { when: { feels: 'strong', sour: null }, turns: [
        ['b', "Don't cry. Please don't cry, or I'll start."],
        ['a', "I can't help it. I don't want to do this without you. I don't know how to do this without you."],
        ['b', "You do. You're the strongest person in this villa. You're going to be fine, and then you're going to come home to me."],
      ] },
      { when: { feels: 'some', sour: null }, turns: [
        ['a', "I'm so sorry. I'm so sorry it's you."],
        ['b', "Don't be sorry. It's not your fault. You've been amazing to me in here, and I'll never forget that."],
        ['a', "I wish we'd had longer."],
        ['b', "Me too. But we'll see what happens on the outside, yeah?"],
      ] },
      { when: { feels: 'little' }, turns: [
        ['a', "I'm really sorry. You didn't deserve that."],
        ['b', "It's okay. Honestly. I've had the best time. Look after yourself in here."],
        ['a', "I will. Take care of yourself, yeah?"],
      ] },
      { when: { sour: null }, turns: [
        ['b', "Promise me something. Don't let anyone in here mess you about once I'm gone."],
        ['a', "I promise."],
        ['b', "And keep my side of the bed warm."],
        ['a', "Nobody's getting your side of the bed."],
      ] },
      { when: { rung: ['closed-off', 'exclusive', 'official'], sour: null }, turns: [
        ['a', "We said we were closed off. We said we'd see this through together."],
        ['b', "And we still will. Just from different places for a bit. Nothing changes how I feel about you. Nothing. Do you hear me?"],
        ['a', "I hear you."],
      ] },
    ],
    last: [
      { when: { sour: null }, turns: [], beat: "The host gives them a moment. They take it." },
      // Love said only when it is there, and nothing today has dented it.
      { when: { feels: 'strong', sour: null }, turns: [['b', "I love you, you know."], ['a', "I know. Go on. Before I don't let you."]] },
      { when: { sour: null }, turns: [], beat: "{b} kisses {a} one last time and walks away. {a} watches until {b} is gone." },
      { when: { sour: ['mine', 'theirs', 'row'] }, turns: [], beat: "{b} picks up {b.posAdj} bag and walks to the steps without looking back. {a} watches every step." },
    ],
  },
  notes: [],
});

export const SOLIDARITY = build('solidarity', {
  tiered: false,
  plans: { featured: ['decide', 'say', 'react'], short: ['decide', 'say'] },
  moves: {
    decide: [
      { turns: [], beat: "{a} looks at {b}, then at the rest of the fire pit, and stands up." },
      { turns: [['a', "Can I say something?"]], beat: "The host nods. The whole fire pit turns to look at {a}." },
    ],
    say: [
      { turns: [
        ['a', "I came in here to find someone, and I found {b}. I'm not going to stay in this villa and pretend I'm okay, because I'm not, and I won't be. So if {b} is going, I'm going too."],
        ['b', "You don't have to do this."],
        ['a', "I know I don't. I want to."],
      ] },
      { turns: [
        ['a', "I've thought about it, and there's nothing in this villa for me without {b}. I'm not here for the summer. I'm here for {b}. So I'm leaving with {b}, tonight."],
        ['b', "Are you sure? Are you actually sure?"],
        ['a', "I've never been more sure about anything."],
      ] },
      { turns: [
        ['a', "Everyone's going to think I'm mad. And maybe I am. But I'd rather walk out of here with {b} than stay in here without {b}. That's it. That's my decision."],
      ] },
    ],
    react: [
      { turns: [], beat: "Half the fire pit is in tears. {b} grabs {a}'s hand, and they walk up the steps together." },
      { turns: [['b', "I can't believe you've done this."], ['a', "Believe it. Come on. Let's go home."]] },
    ],
  },
  notes: [],
});

export const DUMP_GOODBYE = build('dump-goodbye', {
  tiered: false,
  // `bitter`: voted out by people {a} doesn't like, and {a} isn't hiding it (moments.js).
  facts: (state, ev) => ({ bitter: !!ev.extra?.bitter }),
  plans: {
    featured: [
      { when: { withB: true }, plan: ['hug', 'words'] },
      { plan: ['steps', 'speech', 'leave'] },
    ],
    short: [
      { when: { withB: true }, plan: ['words'] },
      { plan: ['speech', 'leave'] },
    ],
  },
  moves: {
    hug: [
      { when: { withB: true }, turns: [], beat: "{b} reaches {a} and holds on tight." },
      { when: { withB: true }, turns: [], beat: "{b} hugs {a} for a long time, and neither of them wants to let go." },
      { when: { withB: true }, turns: [], beat: "{b} pulls {a} in, already crying." },
    ],
    words: [
      { when: { withB: true }, turns: [
        ['b', "I'm going to miss you so much. It's not going to be the same in here without you."],
        ['a', "Don't. You'll make me cry. Message me the second you're out, okay?"],
        ['b', "The second I'm out. I promise."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Go all the way. Promise me."],
        ['b', "I'll try. I'll do it for both of us."],
      ] },
      { when: { withB: true }, turns: [
        ['b', "Who am I going to talk to at night now? You're the one I tell everything."],
        ['a', "You'll be fine. You've got more people in here than you think."],
        ['b', "It won't be the same."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Look after everyone for me. You're the one who keeps it all together in here."],
        ['b', "I don't think I am."],
        ['a', "You are. You just don't see it."],
      ] },
      { when: { withB: true, known: true }, turns: [
        ['b', "You were the first friend I made in here. Do you remember? You came over and asked if I wanted a drink, and we talked for three hours."],
        ['a', "I remember. I'm so glad I did."],
      ] },
      { when: { withB: true, ...GIRLS }, turns: [
        ['b', "{~Girl}, I'm calling you the second I'm out."],
        ['a', "You'd better. I want to hear everything that happens after I've gone."],
        ['b', "Everything. I promise."],
      ] },
      { when: { withB: true, ...BOYS }, turns: [
        ['b', "Come here, {~bro}."],
        ['a', "You've been like a brother to me in here. I mean that."],
        ['b', "Stop it. I'm going to cry in front of everyone."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Please don't cry. If you cry, I'll cry."],
        ['b', "Too late."],
      ] },
      { when: { withB: true }, turns: [
        ['b', "I can't believe it's you. It should never have been you."],
        ['a', "It's okay. Somebody had to go. I'm just glad I met you."],
      ] },
    ],
    steps: [
      { when: { withB: false, bitter: false }, stage: "{a} picks up {a.posAdj} suitcase at the top of the steps and turns round one last time.", turns: [] },
      { when: { withB: false, bitter: false }, stage: "{a} walks to the steps with everyone following, and stops.", turns: [] },
      { when: { withB: false, bitter: false }, stage: "The whole villa walks {a} up to the gate.", turns: [] },
      { when: { withB: false, bitter: true }, stage: "{a} picks up {a.posAdj} suitcase and doesn't wait for anyone to follow.", turns: [] },
      { when: { withB: false, bitter: true }, stage: "At the top of the steps, {a} turns round, and doesn't smile.", turns: [] },
    ],
    speech: [
      { when: { withB: false, bitter: false, weeks: true }, turns: [
        ['a', "Thank you. All of you. These have been the best few weeks of my life. I came in here not knowing anyone, and I'm leaving with friends I'll keep forever."],
      ] },
      { when: { withB: false, bitter: false, early: false, weeks: false }, turns: [
        ['a', "It wasn't long, I know. But I loved it. Thank you for making me feel so welcome, every one of you."],
      ] },
      { when: { withB: false, bitter: false, early: true }, turns: [
        ['a', "I didn't even get to unpack. That's how quick it was. But you've all been lovely to me, and I'm going to miss you. Look after each other."],
      ] },
      { when: { withB: false, bitter: false }, turns: [
        ['a', "I love you all. I really do. I'm sad it's over, but I'm not sorry I came."],
      ] },
      { when: { withB: false, bitter: false, reg: 'big' }, turns: [
        ['a', "I said I wasn't going to cry, and I'm crying. I love every single one of you. Please look after each other."],
      ] },
      { when: { withB: false, bitter: false, reg: 'dry' }, turns: [
        ['a', "I'm not very good at goodbyes, so I'll keep it short. Thank you. I mean it."],
      ] },
      { when: { withB: false, bitter: false, reg: 'soft' }, turns: [
        ['a', "I just want to say thank you. You've all been so kind to me, even on the days I wasn't easy to be around. I'm leaving a better person than I came in."],
      ] },
      { when: { withB: false, bitter: false, reg: 'sharp' }, turns: [
        ['a', "I'm not going to make a big speech. The people I love know who they are, and I'll see them on the outside."],
      ] },
      { when: { withB: false, bitter: true }, turns: [
        ['a', "I'm not going to pretend I'm happy. Some of you voted for me because you wanted me gone, not because you had to. You know who you are."],
      ] },
      { when: { withB: false, bitter: true }, turns: [
        ['a', "Thank you to the people who were real with me. The rest of you, I hope it was worth it."],
      ] },
      { when: { withB: false, bitter: true }, turns: [
        ['a', "I came here to find love, and I tried. Some of you made it a lot harder than it needed to be, and I won't forget that."],
      ] },
      { when: { withB: false, bitter: true }, turns: [
        ['a', "I'm hurt. I'm not going to lie about it. I thought some of you were better than that."],
      ] },
    ],
    leave: [
      { when: { withB: false, bitter: false }, turns: [], beat: "The villa waves until {a} is out of sight." },
      { when: { withB: false, bitter: false }, turns: [], beat: "{a} blows a kiss over {a.posAdj} shoulder and walks out through the gate." },
      { when: { withB: false, bitter: false }, turns: [], beat: "Somebody shouts {a}'s name one more time, and {a} turns and waves before the gate closes." },
      { when: { withB: false, bitter: true }, turns: [], beat: "{a} walks out through the gate without looking back." },
      { when: { withB: false, bitter: true }, turns: [], beat: "Nobody says anything until the gate has closed behind {a}." },
    ],
  },
  notes: [],
});

// dump-unfair  [a, b, c, (d)]  The villa has just voted out {a} and {b}, a
//              strong couple, and kept {x} and {about}, a weaker one
//              (moments.js 2b). {a} says so. {c} voted them out; {d}, staying,
//              backs {a}. `of`: furious · cold. `partnerStays`: only {a} is
//              going, and {b} stays behind.
export const DUMP_UNFAIR = build('dump-unfair', {
  tiered: false,
  facts: (state, ev) => ({ friend: !!ev.extra?.friend, partnerStays: !!ev.extra?.partnerStays }),
  slots: (state, ev) => ({ x: ev.players[ev.extra?.friend ? 4 : 3], about: ev.players[ev.extra?.friend ? 5 : 4] }),
  plans: { featured: ['open', 'answer', 'friend?', 'close'], short: ['open', 'answer', 'close'] },
  moves: {
    open: [
      { when: { partnerStays: false, of: 'furious' }, stage: "{a} doesn't sit back down.", turns: [['a', "You've sent us home. Us. And you've kept {x} and {about}, who haven't had a real conversation all week."]] },
      { when: { of: 'furious' }, stage: "{a} is on {a.posAdj} feet, looking round the fire pit.", turns: [['a', "I can't believe this. Me and {b} are the strongest couple in this villa, and every one of you knows it."], ['a', "And you've kept {x} and {about} over us?"]] },
      { when: { of: 'furious' }, stage: "{a} turns to {c}.", turns: [['a', "Look at me, {c}. Do you really think {x} and {about} are more real than us? Because you don't. Nobody does."]] },
      { when: { partnerStays: false, of: 'furious' }, stage: "{a} stands up before the host has finished.", turns: [['a', "That's a joke. That's an actual joke. We're the ones who came here and found something, and we're the ones going home."]] },
      { when: { partnerStays: false, of: 'cold' }, stage: "{a} stands up slowly, holding {b}'s hand.", turns: [['a', "I'm not going to shout. I just want to say one thing before we go."], ['a', "We came in here to find someone, and we did. {x} and {about} are still sitting there, and we're the ones leaving. That says everything about this vote."]] },
      { when: { of: 'cold' }, stage: "{a} looks across the fire pit at {c}.", turns: [['a', "I'm not angry, {c}. I'm hurt. I thought you were my friend."]] },
      { when: { partnerStays: true, of: 'furious' }, stage: "{a} doesn't sit back down.", turns: [['a', "You've split us up. Me and {b} were the strongest couple in here, and you've kept {x} and {about} together instead."]] },
      { when: { partnerStays: true, of: 'furious' }, stage: "{a} looks round the fire pit, then at {b}.", turns: [['a', "{b} is the best thing that's happened to me in here, and you've taken me away from {b.obj}. For {x} and {about}? Really?"]] },
      { when: { partnerStays: true, of: 'cold' }, stage: "{a} stands up and holds {b}'s hand.", turns: [['a', "I'm not angry with you, {b}. I'm angry with whoever thought {x} and {about} deserved it more than us."]] },
      { when: { partnerStays: false, of: 'cold' }, stage: "{a} takes a breath before {a} speaks.", turns: [['a', "We were happy. That's all we've been in here. Happy. And that's what got us sent home."]] },
    ],
    answer: [
      { turns: [['c', "It wasn't personal. I had to pick someone."], ['a', "You did pick someone. You picked us."]] },
      { turns: [['c', "I voted for who I thought should go. I'm sorry it was you."], ['a', "No, you're not."]] },
      { turns: [['c', "I just didn't think you were as strong as you think you are."], ['a', "You've never once sat down and asked us how we are."]] },
      { turns: [['c', "I know you're upset. I'd be upset too."], ['a', "Don't do that. Don't be nice to me now."]] },
      { turns: [], beat: "{c} looks down at the fire and doesn't answer." },
      { turns: [['c', "Everyone had to vote. I'm not the only one."], ['a', "You're the one I thought had our backs."]] },
    ],
    friend: [
      { when: { friend: true }, turns: [['d', "No, {a}'s right. That was wrong, and everyone sitting here knows it."]] },
      { when: { friend: true }, turns: [['d', "I'm sorry, but I'm not going to pretend that was fair. It wasn't."], ['c', "Nobody asked you."], ['d', "I'm saying it anyway."]] },
      { when: { friend: true }, turns: [['d', "{a} and {b} are the best couple in here. I can't believe we're losing them."]] },
    ],
    close: [
      { when: { of: 'furious' }, turns: [], beat: "{b} pulls {a} away before {a} can say anything else." },
      { when: { partnerStays: false, of: 'furious' }, turns: [['b', "Come on. Leave it. It's not worth it."]], beat: "{a} lets {b} lead the way out, and doesn't look at {c} again." },
      { when: { partnerStays: false, of: 'cold' }, turns: [], beat: "{a} and {b} hug the people they want to hug, and walk straight past {c}." },
      { when: { partnerStays: true }, turns: [['b', "I'll be out there as soon as I can. I promise."], ['a', "You'd better be."]], beat: "{b} holds on to {a} until the very last second." },
      { when: { partnerStays: true, of: 'furious' }, turns: [], beat: "{b} has to hold {a} back, and walks {a} to the steps without letting go." },
      { when: { of: 'cold' }, turns: [['b', "We know what we had. That's what matters."], ['a', "I know. It still hurts."]] },
    ],
  },
});

// dump-betrayed  [a, b]  {a} is going home, and {b}, a close friend, voted
//                for it (moments.js 2c). `of`: furious · cold.
export const DUMP_BETRAYED = build('dump-betrayed', {
  tiered: false,
  plans: { featured: ['open', 'answer', 'close'], short: ['open', 'answer'] },
  moves: {
    open: [
      { when: { of: 'furious' }, stage: "On the way to the steps, {a} stops in front of {b}.", turns: [['a', "You voted for me. You. I've sat with you every single night in here."]] },
      { when: { of: 'furious' }, stage: "{a} turns round before the steps.", turns: [['a', "Out of everyone, {b}. I didn't think it would be you."]] },
      { when: { of: 'furious' }, stage: "{a} looks straight at {b}.", turns: [['a', "I told you everything in here. Everything. And you said my name."]] },
      { when: { of: 'cold' }, stage: "{a} hugs everyone at the fire pit, and stops at {b}.", turns: [['a', "I'm sorry. I can't hug you. Not tonight."]] },
      { when: { of: 'cold' }, stage: "{a} waits for {b} to look up.", turns: [['a', "I just want to know one thing. Were we ever really friends?"]] },
    ],
    answer: [
      { turns: [['b', "Of course we were. I had to vote for someone."], ['a', "And you picked me."]] },
      { turns: [['b', "I'm sorry. Honestly, it was the hardest thing I've done in here."], ['a', "It didn't look hard."]] },
      { turns: [['b', "Please don't leave like this."], ['a', "Then you shouldn't have voted for me."]] },
      { when: { taken: true }, turns: [['b', "I voted for the couple, not for you."], ['a', "I'm in the couple, {b}."]] },
      { turns: [], beat: "{b} opens {b.posAdj} mouth to say something, then doesn't." },
    ],
    close: [
      { turns: [], beat: "{a} walks up the steps without looking back." },
      { turns: [], beat: "{b} stares at the fire after {a} has gone, and nobody next to {b.obj} says a word." },
      { turns: [], beat: "{b} is the only one at the fire pit who doesn't wave." },
    ],
  },
});
