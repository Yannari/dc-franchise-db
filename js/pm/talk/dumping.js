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
      { turns: [], beat: "{a} is on {a.posAdj} feet before the host has finished, and pulls {b} into a hug." },
      { turns: [], beat: "{a} doesn't move for a second. Then {a} grabs {b}'s hand and doesn't let go." },
      { turns: [['a', "No. No, no, no."]], beat: "{a} wraps {a.posAdj} arms round {b} and buries {a.posAdj} face in {b.posAdj} shoulder." },
      { turns: [], beat: "{b} turns to {a}, and {a} is already crying." },
    ],
    words: [
      { when: { feels: 'strong' }, turns: [
        ['a', "This isn't fair. This isn't fair. I've only just found you."],
        ['b', "Hey. Look at me. This isn't the end, okay? This is just the end of in here. I'll be waiting for you on the outside, I promise you that."],
        ['a', "You'd better be."],
        ['b', "I'll be the first one there when you walk out."],
      ] },
      { when: { feels: 'strong' }, turns: [
        ['b', "Don't cry. Please don't cry, or I'll start."],
        ['a', "I can't help it. I don't want to do this without you. I don't know how to do this without you."],
        ['b', "You do. You're the strongest person in this villa. You're going to be fine, and then you're going to come home to me."],
      ] },
      { when: { feels: 'some' }, turns: [
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
      { turns: [
        ['b', "Promise me something. Don't let anyone in here mess you about once I'm gone."],
        ['a', "I promise."],
        ['b', "And keep my side of the bed warm."],
        ['a', "Nobody's getting your side of the bed."],
      ] },
      { when: { rung: ['closed-off', 'exclusive', 'official'] }, turns: [
        ['a', "We said we were closed off. We said we'd see this through together."],
        ['b', "And we still will. Just from different places for a bit. Nothing changes how I feel about you. Nothing. Do you hear me?"],
        ['a', "I hear you."],
      ] },
    ],
    last: [
      { turns: [], beat: "The host gives them a moment. They take it." },
      { turns: [['b', "I love you, you know."], ['a', "I know. Go on. Before I don't let you."]] },
      { turns: [], beat: "{b} kisses {a} one last time and walks away. {a} watches until {b} is gone." },
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
      { when: { withB: true }, turns: [], beat: "{b} reaches {a} first and squeezes {a.obj} tight." },
      { when: { withB: true }, turns: [], beat: "{b} hugs {a} for a long time, and neither of them wants to let go." },
      { when: { withB: true }, turns: [], beat: "{b} pulls {a} in, already crying." },
    ],
    words: [
      { when: { withB: true }, turns: [
        ['b', "I'm going to miss you so much. Honestly, this place isn't going to be the same without you."],
        ['a', "Stop it. You'll set me off. Stay in touch, yeah? I mean it."],
        ['b', "The second I'm out, I'm calling you."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Win this for me. Promise me you'll go all the way."],
        ['b', "I'll do my best. For both of us."],
        ['a', "And don't let anyone take my spot on the daybed."],
      ] },
      { when: { withB: true }, turns: [
        ['b', "Who am I going to talk to at three in the morning now?"],
        ['a', "You'll find someone. Just don't find someone better than me."],
        ['b', "Impossible. You're irreplaceable."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Look after everyone for me. You're the one who keeps it all together in here, you know that? You're the glue."],
        ['b', "I'm not the glue. You were the glue."],
        ['a', "Well, now you've got to be."],
      ] },
      { when: { withB: true, known: true }, turns: [
        ['b', "You were the first friend I made in here. Do you remember? You came over and asked if I wanted a drink, and we didn't stop talking for three hours."],
        ['a', "I remember. Best decision I made in here."],
      ] },
      { when: { withB: true, ...GIRLS }, turns: [
        ['b', "{~Girl}, I'm going to call you the second I'm out. We've got so much to talk about."],
        ['a', "You'd better. And I want every detail of what happens after I've gone."],
        ['b', "Every detail. I promise."],
      ] },
      { when: { withB: true, ...BOYS }, turns: [
        ['b', "Come here, {~bro}. {~Proper} hug."],
        ['a', "You've been a brother to me in here, you know that?"],
        ['b', "Stop it. Don't make me cry in front of everyone."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Don't cry. If you cry, I cry, and then we're both a mess on {~telly}."],
        ['b', "Too late. I'm crying."],
        ['a', "Oh, come here."],
      ] },
      { when: { withB: true }, turns: [
        ['b', "I can't believe it's you. Of all the people in here, it should never have been you."],
        ['a', "It's okay. It's a game. Somebody had to go, and it was me. I'm just glad I met you."],
      ] },
    ],
    steps: [
      { when: { withB: false }, stage: "{a} picks up {a.posAdj} suitcase at the top of the steps and turns round one last time.", turns: [] },
      { when: { withB: false }, stage: "{a} walks to the steps with everyone following, and stops.", turns: [] },
      { when: { withB: false }, stage: "The whole villa walks {a} up to the gate.", turns: [] },
    ],
    speech: [
      { when: { withB: false, weeks: true }, turns: [
        ['a', "Thank you. All of you. Honestly, this has been the best few weeks of my life. I came in here not knowing anyone, and I'm leaving with friends I'll have forever. Don't you dare forget about me."],
      ] },
      { when: { withB: false, early: false, weeks: false }, turns: [
        ['a', "It wasn't long, I know. But it was the best time. Thank you for making me feel so welcome, every single one of you. I'll be watching, so behave yourselves."],
      ] },
      { when: { withB: false, early: true }, turns: [
        ['a', "I didn't even get to unpack properly. That's how quick that was. But you lot are amazing, and I'm going to miss you. Look after each other."],
      ] },
      { when: { withB: false }, turns: [
        ['a', "Love you all. Honestly, I do. Don't do anything I wouldn't do, which isn't much, so do whatever you want, actually."],
      ] },
      { when: { withB: false, reg: 'big' }, turns: [
        ['a', "Right! I'm not crying! I'm not! Okay, I'm crying a bit. I love every single one of you, and if any of you mess this up, I'll know, because I'll be watching every episode. Every single one."],
      ] },
      { when: { withB: false, reg: 'dry' }, turns: [
        ['a', "Well. That's me. Someone finish my cereal, it's in the cupboard. And look after the swing seat. It's been good to me."],
      ] },
      { when: { withB: false, reg: 'soft' }, turns: [
        ['a', "I just want to say thank you. You've all been so kind to me, even on the days I wasn't easy to be around. I'm leaving here a better person than I came in, and that's because of you lot."],
      ] },
      { when: { withB: false, reg: 'sharp' }, turns: [
        ['a', "I'm not going to stand here and make a big speech. You know how I feel about most of you. The ones I love, I'll see on the outside. The rest of you, good luck."],
      ] },
    ],
    leave: [
      { when: { withB: false }, turns: [], beat: "The villa waves until {a} is out of sight." },
      { when: { withB: false }, turns: [], beat: "{a} blows a kiss over {a.posAdj} shoulder and walks out through the gate." },
      { when: { withB: false }, turns: [], beat: "Somebody shouts {a}'s name one more time, and {a} turns and waves before the gate closes." },
    ],
  },
  notes: [],
});
