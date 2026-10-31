// pm/talk/whole/argument.js — {a} and {b} row. One talk, start to finish
// (pm/script.js talkScript `whole`), in their own voices (whole/voice.js).
// WHY is the engine's (pm/events.js argumentReasons), and every row says it in
// its first line; how it ends is the engine's too (`end`). The stitched row
// was "This is so typical." "Typical of what?" "Of you.": a fight with no
// subject. {about} is the third person a row is about.
//   partners  jealous ({b} flirted with {about}) · mismatch ({a} is further in)
//             · stress ({a} snaps) · bicker (the small stuff)
//   others    envy ({b} is with {about}, who {a} likes) · rival ({b} is after
//             {about}, {a}'s partner) · stole ({b} took {about} at a recoupling)
//             · voted ({b} voted against {a}) · told ({b} told {about} {a}'s
//             secret) · clash (two who don't get on, over something in front of them)
//   end       make-up · walk-off · simmer
import { say } from './voice.js';

// How it ends: written once per ending for each kind of row, and turned over
// so the same ending isn't heard twice running.
const TAILS = {
  partner: {
    'make-up': [
      { turns: [['a', "I'm sorry. I didn't mean all that."], ['b', "Me neither. Come here."]], beat: "{b} pulls {a} into a hug, and the others pretend they weren't watching." },
      { turns: [['b', "I don't want to fight with you."], ['a', "I don't want to fight with you either. I'm sorry."]], beat: "{a} leans into {b}, and it's over as fast as it started." },
      { turns: [['a', "Can we stop? I hate this."], ['b', "Yeah. Me too. I'm sorry."]], beat: "They sit back down together, closer than before." },
    ],
    'walk-off': [
      { turns: [['a', "Forget it. I'm done talking."]], beat: "{a} walks off into the villa, and the door bangs behind {a.obj}." },
      { turns: [['b', "I'm not doing this."]], beat: "{b} gets up and walks away, and {a} doesn't follow." },
      { turns: [['a', "Talk to me when you mean it."]], beat: "{a} storms off up to the roof terrace. {b} stays where {b.he} is." },
    ],
    simmer: [
      { turns: [], beat: "Neither of them says anything else. They sit side by side, not touching." },
      { turns: [['b', "Fine."], ['a', "Fine."]], beat: "They don't speak to each other for a long time." },
      { turns: [['a', "I don't want to talk about it any more."]], beat: "{b} doesn't push it, and neither of them moves." },
    ],
  },
  other: {
    'make-up': [
      { turns: [['a', "Look. I don't want to fall out with you."], ['b', "Me neither. Let's leave it."]], beat: "They don't hug, but the shouting stops." },
      { turns: [['b', "Okay. I hear you. I'm sorry."], ['a', "Thank you. That's all I wanted."]], beat: "{a} nods, and everyone by the pool lets out a breath." },
      { turns: [['a', "We're not going to agree, are we?"], ['b', "No. But we don't have to fight about it."]], beat: "They shake hands, a bit stiffly, and go their separate ways." },
    ],
    'walk-off': [
      { turns: [['a', "I'm done. Stay away from me."]], beat: "{a} walks off, and everyone by the pool goes quiet." },
      { turns: [['b', "I'm not wasting my time on this."]], beat: "{b} walks off, and {a} shouts something after {b.obj} that nobody quite hears." },
      { turns: [['a', "You're not worth it."]], beat: "{a} storms into the villa. {b} shakes {b.posAdj} head." },
    ],
    simmer: [
      { turns: [], beat: "Neither of them backs down, and neither of them leaves. They just glare at each other." },
      { turns: [['b', "Are we done?"], ['a', "For now."]], beat: "They end up at opposite ends of the garden." },
      { turns: [['a', "This isn't over."]], beat: "{b} doesn't answer, and the others start talking loudly about something else." },
    ],
  },
};
const ENDS = ['make-up', 'walk-off', 'simmer'];
let turn = 0;
/** One row, played to each of its three endings. */
function rows(cause, group, bodies) {
  return bodies.flatMap(({ stage, turns }) => ENDS.map(end => {
    // Never the same speaker twice running across the join: a row that ends on
    // {a}'s line goes to an ending {b} starts (or one with no words).
    const last = turns[turns.length - 1]?.by ?? turns[turns.length - 1]?.[0];
    const fits = TAILS[group][end].filter(x => !x.turns.length || x.turns[0][0] !== last);
    const t = fits[turn++ % fits.length];
    return { when: { cause, end }, stage, turns: [...turns, ...t.turns], beat: t.beat };
  }));
}

export const ARGUMENT_WHOLE = { moves: { whole: [
  // ── partners ──
  ...rows('jealous', 'partner', [
    { stage: "{a} pulls {b} aside by the pool.", turns: [
      ['a', "Are you going to tell me what that was with {about}?"],
      ['b', "What what was?"],
      say('a', "Don't. Everyone saw you. You were all over {about.obj}.", { lad: "Don't, {~mate}. Everyone saw it. You were all over {about.obj}.", sharp: "Don't play dumb. You were all over {about.obj}, in front of everyone." }),
      say('b', "I was talking. Am I not allowed to talk to people now?", { sharp: "I was talking. You don't own me." }),
      ['a', "Not like that. Not when you're with me."],
      ['b', "You're being paranoid."],
      ['a', "Then why did you go red when I walked over?"],
    ] },
    { stage: "{a} finds {b} in the kitchen.", turns: [
      ['a', "I saw you with {about} earlier."],
      ['b', "And?"],
      say('a', "And you were laughing at everything {about.he} said. You don't laugh like that with me any more.", { nervy: "And I watched you laugh at everything {about.he} said, and I felt sick." }),
      ['b', "That's not fair."],
      ['a', "It's how it looked. To me and to everyone else."],
      ['b', "Then everyone else needs to mind their own business."],
    ] },
  ]),
  ...rows('mismatch', 'partner', [
    { stage: "{a} and {b} are sitting on the daybed, and it starts quietly.", turns: [
      ['a', "Can I ask you something? Where do you see us?"],
      ['b', "What do you mean?"],
      say('a', "I mean I'm all in, and I don't know if you are.", { romantic: "I mean I'm falling for you, and I've got no idea if you feel anything close to that." }),
      ['b', "I'm here, aren't I?"],
      ['a', "That's what you always say. Being here isn't the same as being in it."],
      say('b', "I'm going at my own pace. I'm not going to be rushed.", { sharp: "Don't pressure me. It doesn't work on me." }),
      ['a', "I'm not rushing you. I'm asking you."],
    ] },
    { stage: "{a} follows {b} into the dressing room.", turns: [
      ['a', "Why am I always the one who says how I feel?"],
      ['b', "Where's this come from?"],
      ['a', "Every time I tell you something, you change the subject."],
      say('b', "I'm not good at that stuff. You know I'm not.", { lad: "I'm not good at all that, {~bro}. You know that." }),
      ['a', "Then try. Just once. Try."],
    ] },
  ]),
  ...rows('stress', 'partner', [
    { stage: "{a} has been on edge all day, and {b} gets the worst of it.", turns: [
      ['b', "Do you want a drink?"],
      say('a', "No. I don't want a drink. I want everyone to stop asking me things.", { lad: "No. I don't want anything. I just want five minutes." }),
      ['b', "I only asked if you wanted a drink."],
      ['a', "I know. I know you did."],
      ['b', "Then why are you biting my head off?"],
      ['a', "Because I'm stressed, and you're the one sitting next to me."],
    ] },
    { stage: "{b} sits down next to {a} on the swing seat.", turns: [
      ['b', "Are you okay? You've barely said a word today."],
      ['a', "I'm fine."],
      ['b', "You're clearly not fine."],
      ['a', "Can you just leave it? Please?"],
      ['b', "I'm trying to help."],
      say('a', "I don't need help. I need some space.", { sharp: "Well, you're not helping." }),
      ['b', "Don't take it out on me. I'm on your side."],
    ] },
    { stage: "{a} and {b} are sitting at the kitchen island, and {a} snaps.", turns: [
      ['a', "Can you stop doing that?"],
      ['b', "Doing what?"],
      ['a', "Tapping. You've been tapping the counter for ten minutes."],
      ['b', "Is this really about the counter?"],
      say('a', "No. I don't know. I'm just stressed.", { nervy: "No. I don't know. Everything's getting to me today." }),
      ['b', "Then say that. Don't go for me."],
    ] },
  ]),
  ...rows('bicker', 'partner', [
    { stage: "{a} and {b} are getting ready in the bedroom.", turns: [
      ['a', "You've left your stuff all over my side of the bed again."],
      ['b', "It's one top."],
      ['a', "It's never one top. It's every day."],
      ['b', "Is this really what we're arguing about?"],
      ['a', "Apparently."],
    ] },
    { stage: "{a} sits down next to {b} at the table, and doesn't look happy.", turns: [
      ['a', "You said you'd save me a seat."],
      ['b', "I forgot. It's a seat."],
      say('a', "It's not about the seat. It's that you forgot.", { sharp: "It's not about the seat, and you know it isn't." }),
      ['b', "Okay. I'm sorry I forgot. Is that better?"],
      ['a', "Not when you say it like that."],
    ] },
  ]),

  // ── two who aren't a couple ──
  ...rows('envy', 'other', [
    { stage: "{a} and {b} end up next to each other at the kitchen island.", turns: [
      ['a', "You don't even like {about}. Not really."],
      ['b', "Excuse me?"],
      ['a', "You're only with {about.obj} because it's safe."],
      say('b', "And what's it got to do with you?", { sharp: "Is this because you want {about} yourself?" }),
      ['a', "Nothing. I'm just saying what everyone's thinking."],
      ['b', "No. You're saying what you're thinking. And everyone can see why."],
    ] },
  ]),
  ...rows('rival', 'other', [
    { stage: "{a} catches {b} on the way out of the dressing room.", turns: [
      ['a', "I know what you're doing with {about}."],
      ['b', "I'm not doing anything."],
      ['a', "You're always there. Every time I turn round, you're next to {about.obj}."],
      say('b', "We're friends. I'm allowed to have friends.", { sharp: "Maybe {about} likes talking to me. Have you thought about that?" }),
      say('a', "{about} is with me. Back off.", { lad: "{about} is with me, {~mate}. Back off." }),
      ['b', "Or what?"],
    ] },
  ]),
  ...rows('stole', 'other', [
    { stage: "{a} walks straight up to {b} by the pool.", turns: [
      ['a', "You knew I was with {about}. You knew, and you picked {about.obj} anyway."],
      say('b', "I followed my heart. I'm not going to say sorry for that.", { soft: "I'm sorry it hurt you. I didn't do it to hurt you.", sharp: "It's a recoupling. That's the game." }),
      ['a', "You didn't even talk to me first."],
      ['b', "I didn't have to."],
      ['a', "No. But if you were a decent person, you would have."],
    ] },
  ]),
  ...rows('voted', 'other', [
    { stage: "{a} finds {b} on the terrace.", turns: [
      ['a', "You put my name down."],
      ['b', "It wasn't personal."],
      ['a', "It was my name. How is that not personal?"],
      say('b', "I had to pick someone. I picked the couple I thought was weakest.", { sharp: "I voted the way I wanted. I don't have to explain myself to you." }),
      say('a', "We were friends. Or I thought we were.", { romantic: "I trusted you. I actually trusted you." }),
    ] },
  ]),
  ...rows('told', 'other', [
    { stage: "{a} walks straight up to {b} in the garden.", turns: [
      ['a', "Why did you tell {about}?"],
      ['b', "Because {about} deserved to know."],
      ['a', "It wasn't yours to tell."],
      say('b', "I wasn't going to sit there and watch {about} get lied to.", { soft: "I didn't want to. I just couldn't keep it from {about.obj}." }),
      ['a', "So you went behind my back."],
      ['b', "You went behind {about.posAdj} back first."],
    ] },
  ]),
  ...rows('clash', 'other', [
    { stage: "A fight breaks out between {a} and {b} at the table.", turns: [
      ['a', "Can you not talk over me? Every time I open my mouth, you start talking."],
      ['b', "I wasn't talking over you."],
      ['a', "You just did it again."],
      say('b', "Maybe if you got to the point, nobody would need to.", { soft: "I didn't realise I was doing it. You don't have to shout." }),
      ['a', "See? That. That's what I mean."],
    ] },
    { stage: "{a} and {b} both head for the last sunbed in the shade.", turns: [
      ['a', "I was going there."],
      ['b', "I got here first."],
      ['a', "You saw me coming and walked faster."],
      ['b', "Are we really doing this over a sunbed?"],
      say('a', "It's not the sunbed. It's you. It's always you.", { lad: "It's not the sunbed, {~mate}. It's you." }),
      ['b', "What's that supposed to mean?"],
    ] },
    { stage: "{a} and {b} start sniping at each other by the pool.", turns: [
      ['a', "Why do you roll your eyes every time I say something?"],
      ['b', "I don't."],
      ['a', "You did it at breakfast. You're doing it now."],
      ['b', "Then stop saying things I want to roll my eyes at."],
      say('a', "Say it to my face, then. What's your problem with me?", { sharp: "Go on, then. Say it. What's your problem with me?" }),
      ['b', "I don't have a problem. You do."],
    ] },
    { stage: "In the kitchen, {a} turns round to find {b} eating the last of the food {a} made.", turns: [
      ['a', "That was mine."],
      ['b', "It was on the side."],
      ['a', "I made it. You watched me make it."],
      ['b', "It's food. Make some more."],
      say('a', "It's not the food. You do this all the time. You just take what you want.", { sharp: "You know what, that's you all over." }),
    ] },
  ]),
] } };
