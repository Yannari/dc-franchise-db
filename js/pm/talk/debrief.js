// ══════════════════════════════════════════════════════════════════════
// pm/talk/debrief.js — the night's debrief (pm/debrief.js)
// ══════════════════════════════════════════════════════════════════════
//
// After a ceremony, {a} talks it through with {b}, a friend on the same side:
// the boys on the terrace, the girls in the dressing room ({Where}). What it
// is about is the engine's (`of`), and {c} is who it is about:
//   robbed       {c} stole {a}'s partner tonight (`since`: before · tonight)
//   stole        {a} took {pa} from {c}
//   twisted-on   {c} came back from Casa with someone else
//   twisted      {a} came back with someone, leaving {c}
//   miss         {c} went home tonight
//   blame        {c} voted {a}'s person out
//   next         {a} is scared of being next
//   eyeing       {c} walked in tonight, and {a}'s partner couldn't stop looking
//   bomb-threat  {c} walked in, after {a}'s partner
//   bomb-fancy   {c} walked in, and {a} likes what {a} sees
//   picked       {a} got who {a} wanted ({pa}; `chose`: {a} did the picking)
//   meh          {a} isn't feeling who {a} ended up with ({pa})
//   open       the room
//   recount    {a} says it — the long turn
//   friend     what {b} says
//   push       one more round
//   close      how they leave it
import { build } from './build.js';

const GIRLS = { gender: 'f', bGender: 'f' };
const BOYS = { gender: 'm', bGender: 'm' };
// Night one's debrief (moments.js): just coupled, no ceremony yet, and no
// room ({Where} is a later night's). happy · unsure (about {pa}) · rather
// ({c} is who {a} would rather have) · rather-yours ({pb}: {b}'s own partner).
const NIGHT_ONE = ['happy', 'unsure', 'rather', 'rather-yours'];
const LATER = { of: ['robbed', 'stole', 'twisted-on', 'twisted', 'miss', 'blame', 'next', 'eyeing', 'bomb-threat', 'bomb-fancy', 'picked', 'meh'] };

export const DEBRIEF = build('debrief', {
  stages: [
    { when: LATER, stage: "{Where}, {a} and {b} talk the night over." },
    { when: LATER, stage: "{Where}, {b} sits down next to {a}." },
    { when: { of: NIGHT_ONE }, stage: "Night one, after the coupling. {a} grabs {b} by the pool." },
    { when: { of: NIGHT_ONE }, stage: "The first night, late. {a} and {b} sit on the end of a sunbed while everyone else gets ready for bed." },
  ],
  plans: {
    featured: [{ when: { of: NIGHT_ONE }, plan: ['night', 'recount', 'friend'] }, { plan: ['open', 'recount', 'friend', 'push?', 'close'] }],
    short: ['recount', 'friend'],
  },
  moves: {
    night: [
      { stage: "Night one, after the coupling. {a} grabs {b} by the pool before anyone else can.", turns: [['b', "Well? Go on. How do you feel?"]] },
      { stage: "The first night. {a} and {b} sit on the end of a sunbed, still in their outfits.", turns: [['b', "So. First night. First couple. Talk to me."]] },
    ],
    open: [
      { stage: "{Where}, {b} sits down next to {a}.", turns: [
        ['b', "Go on, then. Talk."],
        ['a', "Where do I even start?"],
      ] },
      { stage: "{Where}, the others are still worked up from the fire pit. {a} isn't.", turns: [
        ['b', "You've gone very quiet."],
        ['a', "I've got a lot going on up here."],
        ['b', "Let it out, then."],
      ] },
      { when: GIRLS, stage: "{Where}, {a} takes {a.posAdj} make-up off a bit too hard.", turns: [
        ['b', "You're going to take your face off, {~girl}. What's wrong?"],
        ['a', "Everything. Sit down."],
      ] },
      { when: BOYS, stage: "{Where}, {a} and {b} lean on the railing, looking down at the pool.", turns: [
        ['b', "Some night, {~bro}."],
        ['a', "Some night. I don't even know what just happened."],
      ] },
      { stage: "{Where}, {b} hands {a} a glass of water and sits down.", turns: [
        ['b', "Drink that. Then tell me everything."],
        ['a', "Everything? You were there."],
        ['b', "I was there. I want to hear it from you."],
      ] },
    ],

    recount: [
      { when: { of: 'happy', taken: true }, turns: [['a', "I got who I wanted. I actually got who I wanted. When {pa} stood next to me, I had to stop myself grinning like an idiot. I'm trying not to look too pleased with myself."]] },
      { when: { of: 'happy', taken: true }, turns: [['a', "Honestly? I couldn't have picked better if I'd written it down. {pa} is exactly my type. I keep looking over to check it's real."]] },
      { when: { of: 'unsure', taken: true }, turns: [['a', "It's not that I don't like {pa}. I do. I just need more than one night. Is that awful? We've said about ten words to each other."]] },
      { when: { of: 'unsure', taken: true }, turns: [['a', "{pa} is lovely. Really lovely. I just didn't feel the thing. You know the thing? I didn't feel it yet."]] },
      { when: { of: 'rather', taken: true, cast: 3 }, turns: [['a', "Can I tell you something, and you don't tell anyone? I'm with {pa}, and I keep looking at {c}. I've been looking at {c} all night."]] },
      { when: { of: 'rather', taken: true, cast: 3 }, turns: [['a', "{pa} is great. Genuinely. But if I'd had the choice, it would have been {c}. I'm only saying it to you."]] },
      { when: { of: 'rather-yours', taken: true, bTaken: true }, turns: [['a', "I'm going to be honest with you, because you're my friend. If I'd had the choice tonight, I'd have gone for {pb}."]] },
      { when: { of: 'rather-yours', taken: true, bTaken: true }, turns: [['a', "This is awkward, and I'm sorry, but I have to say it. The one I liked most when I walked in was {pb}."]] },
      { when: { of: 'robbed', since: 'before' }, turns: [
        ['a', "I didn't see it coming. I really didn't. {c} was nice to my face all week. Sat with me at breakfast, asked how it was going, the lot. And then tonight {c} stands up, says a name, and that's it. Everything I'd built, gone in about ten seconds."],
        ['b', "I know. That's what I can't get over."],
      ] },
      { when: { of: 'robbed', since: 'before' }, turns: [
        ['a', "Did you know? Be honest with me. Did anyone know {c} was going to do that?"],
        ['b', "No. I promise you. I'd have told you."],
        ['a', "Then how did {c} know it would work? You don't stand up like that unless you know it's going to work."],
      ] },
      { when: { of: 'robbed', since: 'tonight' }, turns: [
        ['a', "I was coupled up for about two minutes. Two minutes. I stood up, said a name, felt good about it, sat down. And then {c} stood up, and it was over before I'd even got comfortable."],
        ['b', "I saw your face."],
        ['a', "Everyone saw my face."],
      ] },
      { when: { of: 'stole', taken: true }, turns: [
        ['a', "I know how it looked. I know everyone's going to say I'm a snake. But I've liked {pa} since day one, and I wasn't going to sit there and watch another recoupling go by without doing something about it."],
        ['b', "How do you think {c} is feeling?"],
        ['a', "Awful, probably. And I feel bad about that. I just don't feel bad enough not to have done it."],
      ] },
      { when: { of: 'stole', taken: true }, turns: [
        ['a', "My hands were shaking. Did you see? When I stood up, I thought I was going to be sick. And then I said {pa}'s name, and I couldn't look at {c}. I just couldn't."],
        ['b', "You did it, though."],
        ['a', "I did it. Now I've got to live with it."],
      ] },
      { when: { of: 'twisted-on' }, turns: [
        ['a', "I waited. I sat here in this villa, and I turned everyone down, and I didn't so much as look at anyone. And {c} walks back in holding someone else's hand. Like I was nothing. Like I was a holiday."],
        ['b', "You were loyal. That's not nothing."],
        ['a', "It feels like nothing right now."],
      ] },
      { when: { of: 'twisted' }, turns: [
        ['a', "I feel awful. I know I did the right thing for me, but I saw {c}'s face when I walked in, and I just wanted the ground to swallow me up. {c} looked so hurt."],
        ['b', "You can't stay with someone because you feel guilty."],
        ['a', "I know. It doesn't make it any easier."],
      ] },
      { when: { of: 'miss' }, turns: [
        ['a', "I keep looking at the space where {c} used to sit. It's stupid. It's been an hour. But this villa just feels different without {c} in it. Quieter. Worse."],
        ['b', "It's not stupid. {c} was a big part of it."],
      ] },
      { when: { of: 'miss' }, turns: [
        ['a', "I didn't even get to say goodbye properly. It was all so quick. Names were read out, and then {c} was hugging everyone, and then {c} was walking up those steps, and that was it."],
        ['b', "You'll see {c} on the outside."],
        ['a', "It's not the same."],
      ] },
      { when: { of: 'blame' }, turns: [
        ['a', "{c} voted my best friend out of this villa. Stood there and put a name down, and now {c}'s going to sit at breakfast tomorrow like nothing happened. I'm not having it."],
        ['b', "What are you going to do?"],
        ['a', "I don't know yet. But I'm not going to pretend I'm fine with it."],
      ] },
      { when: { of: 'next' }, turns: [
        ['a', "Every time someone goes home, I count who's left, and I'm always near the bottom. I'm always the one people would pick to go. I can feel it. I'm next, aren't I?"],
        ['b', "You're not next."],
        ['a', "You don't know that."],
        ['b', "Nobody knows anything in here. That's sort of the point."],
      ] },
      { when: { of: 'eyeing', taken: true }, turns: [
        ['a', "Did you see {pa}'s face when {c} walked in? Did you see it? {pa} couldn't stop looking. I was sitting right there, and it was like I'd disappeared."],
        ['b', "Everyone looks at the new person."],
        ['a', "Not like that, they don't."],
      ] },
      { when: { of: 'bomb-threat', taken: true }, turns: [
        ['a', "{c} is going to go for {pa}. I know it. You can just tell. And I can't do anything about it, can I? I just have to sit here and watch it happen."],
        ['b', "You don't know that."],
        ['a', "I know {c} asked about {pa} within about ten minutes of walking in."],
      ] },
      { when: { of: 'bomb-fancy', taken: true }, turns: [
        ['a', "Okay, don't judge me. But {c}. When {c} walked in. I'm not saying anything's going to happen, I'm with {pa}, but I felt something, and I don't know what to do with it."],
        ['b', "Oh no."],
        ['a', "I know. Oh no."],
      ] },
      { when: { of: 'bomb-fancy', taken: false }, turns: [
        ['a', "Can we talk about {c}? Because I think I'm in trouble. I haven't felt like that about anyone since I walked in. It's like someone flicked a switch."],
        ['b', "Then go and talk to {c}!"],
        ['a', "I can't just go and talk to {c}."],
        ['b', "You literally can. That's what everyone does in here."],
      ] },
      { when: { of: 'picked', taken: true, chose: true }, turns: [
        ['a', "I said {pa}'s name, and I felt it. Like, in my chest. I've never been so sure about anything in here. Did you see how {pa} smiled?"],
        ['b', "Everyone saw. It was disgusting. In a good way."],
      ] },
      { when: { of: 'picked', taken: true, chose: false }, turns: [
        ['a', "When {pa} stood up, I didn't know who {pa} was going to say. My heart was going. And then {pa} said my name, and I nearly cried. I actually nearly cried."],
        ['b', "You did a bit."],
        ['a', "Only a bit."],
      ] },
      { when: { of: 'meh', taken: true }, turns: [
        ['a', "I'm with {pa} now, and I just... I don't know. {pa} is lovely. Everyone says {pa} is lovely. But I'm sitting here, and I'm not excited, and I feel like I should be."],
        ['b', "Give it a few days."],
        ['a', "And if it's still nothing in a few days?"],
      ] },
      { when: { of: 'meh', taken: true, chose: true }, turns: [
        ['a', "Can I be honest? I picked {pa}, and I meant what I said up there. But now I'm sitting here, and I don't feel what I thought I'd feel. Is that normal?"],
        ['b', "It's normal. Tonight's a lot. Nobody feels the right thing on cue."],
        ['a', "I hope you're right."],
      ] },
    ],

    friend: [
      { when: { of: 'happy' }, turns: [['b', "Look at your face. You're glowing. Don't jinx it."], ['a', "I'm not going to jinx it. I'm going to enjoy it."]] },
      { when: { of: 'happy' }, turns: [['b', "Night one, and you've already got the good one. That's not fair on the rest of us."]] },
      { when: { of: 'unsure' }, turns: [['b', "It's night one. Nobody feels the thing on night one. Give it a few days."], ['a', "And if I still don't?"], ['b', "Then you'll know."]] },
      { when: { of: 'unsure', taken: true }, turns: [['b', "Don't say that to {pa}, whatever you do. Not tonight."], ['a', "I'm not mad."]] },
      { when: { of: 'rather', cast: 3 }, turns: [['b', "It's one night. You don't owe anyone anything yet. Just don't make it obvious."], ['a', "Is it obvious?"], ['b', "A bit."]] },
      { when: { of: 'rather', cast: 3 }, turns: [['b', "Then get to know {c}. Quietly. Nicely. Without blowing anything up on day one."]] },
      { when: { of: 'rather-yours', bTaken: true }, turns: [['b', "Wow. Okay. That's my partner you're talking about."], ['a', "I know. I'm sorry. I'd rather you heard it from me."], ['b', "Would you?"]] },
      { when: { of: 'rather-yours', bTaken: true }, turns: [['b', "You've been here one night, and you're telling me you want {pb}?"], ['a', "I'm telling you I'm not going to lie to you."]] },
      { when: { of: ['robbed', 'twisted-on'] }, turns: [
        ['b', "Listen. Tonight is over. You're still here. And anyone who could do that to you, or walk away from you, isn't the person you thought. You'll see that tomorrow. Tonight, you're allowed to be sad."],
        ['a', "I feel so stupid."],
        ['b', "You're not stupid. You trusted someone. That's not the same thing."],
      ] },
      { when: { of: ['stole', 'twisted'] }, turns: [
        ['b', "Look, I'm not going to tell you that you did the wrong thing. You've got to do what's right for you in here. But you're going to have to face {c} in the morning, and I'd think about what you're going to say."],
        ['a', "I know. I'll talk to {c}."],
      ] },
      { when: { of: 'miss' }, turns: [
        ['b', "{c} would want you to carry on. Honestly. If you could hear what {c} would say about you sitting up here moping, you'd get up right now. Have one sad night, and then do it for {c.obj}."],
        ['a', "Do it for {c.obj}. Yeah."],
      ] },
      { when: { of: 'blame' }, turns: [
        ['b', "I get it. I'm angry too. But going after {c} tonight isn't going to bring anyone back. Sleep on it. Then decide."],
        ['a', "Fine. But I'm not saying good morning."],
      ] },
      { when: { of: 'next' }, turns: [
        ['b', "You can't spend every night counting. It'll drive you mad. Just be yourself, talk to people, and stop thinking about it."],
        ['a', "Easy for you to say."],
        ['b', "It's not easy for anyone to say. I'm saying it anyway."],
      ] },
      { when: { of: ['eyeing', 'bomb-threat'], taken: true }, turns: [
        ['b', "Okay, but {pa} chose you. {pa} has been with you this whole time. One person walking through the door doesn't change that, unless you let it."],
        ['a', "Unless I let it?"],
        ['b', "If you go to bed tonight and start an argument, you're doing {c}'s work for {c}."],
      ] },
      { when: { of: 'bomb-fancy' }, turns: [
        ['b', "Just be careful. That's all I'm saying. Everyone gets their head turned by the new person. Make sure it's real before you do anything you can't take back."],
        ['a', "Careful. Yeah. I can be careful."],
        ['b', "You can't, actually."],
      ] },
      { when: { of: 'picked' }, turns: [
        ['b', "I'm so happy for you. Honestly. After everything, you deserve someone who looks at you like that."],
        ['a', "Stop. I'm going to cry again."],
      ] },
      { when: { of: 'meh', taken: true }, turns: [
        ['b', "Don't do anything rash. You've got a few days. Spend them actually getting to know {pa}, and if you still feel nothing, you'll know. But give it a real go first."],
        ['a', "A real go. Okay."],
      ] },
    ],

    push: [
      { turns: [
        ['a', "Can I ask you something? Do you think I'm going to be okay in here?"],
        ['b', "I think you're going to be more than okay. I think you're going to be one of the last ones standing."],
        ['a', "You have to say that. You're my friend."],
        ['b', "I'd say it anyway."],
      ] },
      { turns: [
        ['b', "What are you going to do tomorrow?"],
        ['a', "Get up, put a smile on, and act like none of this bothers me."],
        ['b', "And does it?"],
        ['a', "Massively."],
      ] },
      { when: GIRLS, turns: [
        ['b', "Right. Tomorrow, you're wearing the red dress, and you're walking past them both like you own the place."],
        ['a', "I don't have a red dress."],
        ['b', "You can borrow mine. This is an emergency."],
      ] },
      { when: BOYS, turns: [
        ['b', "Tomorrow, gym. First thing. Clear your head."],
        ['a', "That's your answer to everything."],
        ['b', "Because it works every time."],
      ] },
    ],

    close: [
      { turns: [], beat: "{b} puts an arm round {a}, and they sit there until the lights go out." },
      { turns: [['a', "Thanks for listening."], ['b', "Always. Bed?"], ['a', "Bed."]] },
      { turns: [], beat: "{a} wipes {a.posAdj} eyes, takes a breath, and goes back downstairs." },
      { turns: [['b', "Come here."]], beat: "{b} hugs {a}, and doesn't let go for a long time." },
    ],
  },

  notes: [
    { stage: "{Where}, {a} talks the night over with {b}." },
  ],
});
