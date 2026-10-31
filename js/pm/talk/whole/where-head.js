// pm/talk/whole/where-head.js — {a} asks {b}, {a}'s partner: where's your head at?
// One talk, start to finish (pm/script.js talkScript `whole`), in their own
// voices (whole/voice.js). The engine has decided {b}'s answer (pm/threads.js
// whereHead), from what {b} feels and how honest {b} is built to be:
//   reassure  {b} is staying with {a}, and says so
//   honest    {b} says the truth: {c} (graft), or {b} isn't feeling it (doubt, `why`)
//   deflect   {b} won't give a straight answer
//   lie       {b} kissed {c} and says nothing happened (only somebody who may scheme)
// story graft: {b} went off with {c} (chaser: {b} went over to {c}); doubt: {b} has
// gone quiet on {a}, and `why` is the real reason, which only {b} knows.
// kissed: {b} really did kiss {c}, and {a} doesn't know.
import { say } from './voice.js';

const NOT_KISSED = { kissed: false };

export const WHERE_HEAD_WHOLE = { moves: { whole: [
  // ── graft: {b} went off with {c} ──
  { when: { story: 'graft', of: 'reassure', ...NOT_KISSED }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    say('a', "I need to ask you something, and I need you to be honest. What's going on with you and {c}?", {
      lad: "I'm just going to ask. What's going on with you and {c}?",
      nervy: "Can I ask you something? I've been feeling sick about it all day. What's going on with you and {c}?",
      sharp: "What's going on with you and {c}? And don't say nothing.",
    }),
    ['b', "Nothing. We talked. That's all it was."],
    ['a', "It didn't look like nothing from where I was sitting."],
    say('b', "I know how it looked. But I'm with you. I want to be with you.", {
      romantic: "I know how it looked. But it's you. It's been you since the first day.",
      lad: "I know how it looked. But I'm with you. I'm not going anywhere.",
      quiet: "I'm with you. That's it.",
    }),
    ['a', "Do you promise?"],
    ['b', "I promise."],
  ], beat: "{a} lets out a breath {a.he} seems to have been holding all day, and {b} pulls {a.obj} in." },
  { when: { story: 'graft', of: 'reassure', chaser: false, ...NOT_KISSED }, stage: "{a} takes {b} up to the roof terrace, where it's quiet.", turns: [
    ['a', "What did {c} want earlier?"],
    say('b', "{c} likes me. {c.He} told me.", { lad: "{c} likes me. Came out and said it.", nervy: "I was going to tell you. {c} said {c.he} likes me." }),
    ['a', "And what did you say?"],
    say('b', "I said I'm with you. I'm happy with you.", { sharp: "I said no. What did you think I'd say?", soft: "I said I'm with you. I tried to be kind about it, but I said it." }),
    ['a', "Then why didn't you come and tell me straight away?"],
    ['b', "Because I didn't want it to be a thing. I'm sorry. I should have."],
    ['a', "Next time, tell me. I'd rather hear it from you."],
    ['b', "I will. I promise."],
  ], beat: "{a} takes {b}'s hand, and they sit there until the others call them for dinner." },
  { when: { story: 'graft', of: 'reassure', chaser: true, ...NOT_KISSED }, stage: "{a} and {b} sit down on the swing seat.", turns: [
    ['a', "Why did you go over to {c} earlier?"],
    ['b', "I just wanted to talk to {c.obj}. We hadn't talked properly."],
    ['a', "You went to {c.obj}. That's what's bothering me."],
    say('b', "I know. I'm sorry. It wasn't anything. I'm with you, and I want to be.", { lad: "I know. Bad move. It was nothing. I'm with you.", sharp: "It was a chat. I'm allowed to talk to people. But I'm with you." }),
    ['a', "Okay. I believe you."],
    ['b', "Good. Because I mean it."],
  ], beat: "{b} puts an arm round {a}, and {a} lets {b.obj}." },
  { when: { story: 'graft', of: 'reassure', kissed: true }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    ['a', "Is there anything going on with you and {c}? You can tell me."],
    say('b', "No. I'm with you.", { nervy: "No. Nothing. I'm with you. I'm with you." }),
    ['a', "You're sure?"],
    ['b', "I'm sure. It's you I want."],
    ['a', "Okay. Thank you. I needed to hear that."],
  ], beat: "{a} hugs {b}. Over {a.posAdj} shoulder, {b} closes {b.posAdj} eyes and doesn't look happy at all." },
  { when: { story: 'graft', of: 'honest', ...NOT_KISSED }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    ['a', "I need to know. Is there something with you and {c}?"],
    ['b', "Can I be honest with you?"],
    ['a', "Please."],
    say('b', "I like {c}. I didn't plan it. I don't know what it means yet.", {
      soft: "I'm so sorry. I think I've got feelings for {c}. I didn't want to, and I don't know what to do about it.",
      lad: "I like {c}. I'm not going to lie to you. I didn't plan it.",
      sharp: "Yes. I like {c}. I'd rather tell you than have you hear it somewhere else.",
    }),
    say('a', "How long?", { sharp: "How long have you been feeling like that?" }),
    ['b', "A few days. I'm sorry. You don't deserve this."],
    say('a', "No. I don't.", { romantic: "I thought it was us. I really thought it was us.", quiet: "Okay." }),
  ], beat: "{a} gets up and walks out. {b} doesn't follow." },
  { when: { story: 'graft', of: 'honest', chaser: true, ...NOT_KISSED }, stage: "{a} takes {b} up to the roof terrace, where it's quiet.", turns: [
    ['a', "You went over to {c}. I want to know why."],
    say('b', "Because I like {c.obj}. I'm sorry. I'm not going to lie to you.", { nervy: "Because I like {c.obj}. I'm sorry. I've been trying to work out how to tell you." }),
    ['a', "And us?"],
    ['b', "I don't know. I still care about you. I just can't pretend."],
    say('a', "Then don't. I'd rather know where I stand.", { romantic: "I'd rather know. Even if it breaks my heart, I'd rather know.", sharp: "Then I know where I stand." }),
  ], beat: "They sit in silence. Neither of them knows what to say next." },
  { when: { story: 'graft', of: 'honest', kissed: true }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    ['a', "Is there anything I need to know about you and {c}?"],
    ['b', "I kissed {c}."],
    ['a', "What?"],
    say('b', "I'm sorry. I'm so sorry. It just happened, and I've felt sick about it ever since.", { lad: "I'm sorry. I'm not going to make excuses. I kissed {c}.", sharp: "I kissed {c}. I'm not going to lie to you about it." }),
    say('a', "When?", { sharp: "When? When were you going to tell me?" }),
    ['b', "Earlier. I was going to tell you. I swear I was."],
    say('a', "I can't even look at you right now.", { soft: "I need to go. I can't be in here.", quiet: "I need to go." }),
  ], beat: "{a} walks out. {b} sits on the bed with {b.posAdj} head in {b.posAdj} hands." },
  { when: { story: 'graft', of: 'deflect', ...NOT_KISSED }, stage: "{a} and {b} sit down on the swing seat.", turns: [
    ['a', "What's going on with you and {c}?"],
    say('b', "Why are you asking me that?", { sharp: "Why does everyone keep asking me that?", lad: "Why are you asking? It's nothing, honestly." }),
    ['a', "Because I saw you. And I want to know where your head's at."],
    ['b', "I'm here, aren't I? I'm sitting here with you."],
    ['a', "That's not an answer."],
    say('b', "It's the only one I've got right now.", { nervy: "I don't know what you want me to say.", soft: "Can we not do this now? Please?" }),
    ['a', "Okay. When you've got a better one, come and find me."],
  ], beat: "{a} gets up and walks back to the villa. {b} stays on the swing seat." },
  { when: { story: 'graft', of: 'deflect', ...NOT_KISSED }, stage: "{a} takes {b} up to the roof terrace, where it's quiet.", turns: [
    ['a', "Can I ask you something? Are you still happy with us?"],
    ['b', "Where's this come from?"],
    ['a', "You and {c}. Earlier."],
    say('b', "We were just chatting. You're reading into it.", { lad: "We were just chatting. You're overthinking it.", sharp: "We were talking. Am I not allowed to talk to people now?" }),
    ['a', "Then just tell me you're happy with us."],
    ['b', "I'm not doing this. Not tonight."],
  ], beat: "{b} goes back downstairs. {a} stays up on the terrace on {a.posAdj} own." },
  { when: { story: 'graft', of: 'deflect', kissed: true }, stage: "{a} and {b} sit down on the end of the bed.", turns: [
    ['a', "Has anything happened with you and {c}?"],
    ['b', "Why would you ask me that?"],
    ['a', "Because you won't look at me."],
    ['b', "I'm looking at you now."],
    ['a', "Then answer the question."],
    ['b', "I'm tired. Can we talk tomorrow?"],
  ], beat: "{b} gets under the covers and turns to face the wall. {a} doesn't move." },
  { when: { story: 'graft', of: 'lie', kissed: true }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    ['a', "Has anything happened with you and {c}? I need you to be honest."],
    say('b', "No. Nothing. We just talked.", { player: "No. Nothing happened. I'd tell you if it had.", lad: "Nothing, I swear. We just chatted." }),
    ['a', "You promise?"],
    ['b', "I promise. Look at me. Nothing happened."],
    ['a', "Okay. I believe you."],
  ], beat: "{a} leans into {b}. {b} keeps {b.posAdj} face very still." },
  { when: { story: 'graft', of: 'lie', kissed: true }, stage: "{a} takes {b} up to the roof terrace, where it's quiet.", turns: [
    ['a', "I'm going to ask you once. Did anything happen with {c}?"],
    say('b', "No. Who's been saying that?", { player: "No. Who told you that? Because they're lying to you." }),
    ['a', "Nobody. I just need to hear it from you."],
    ['b', "Nothing happened. I'm with you."],
  ], beat: "{a} nods, and lets {b} hold {a.posAdj} hand. {b} doesn't look at {a.obj} once." },

  // ── doubt: {b} has gone quiet on {a} ──
  { when: { story: 'doubt', of: 'reassure', ...NOT_KISSED }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    say('a', "You've been different with me. I need to know if something's wrong.", {
      nervy: "I feel like something's changed with us, and it's making me so anxious. Is something wrong?",
      lad: "Be straight with me. Is something up with us?",
      sharp: "You've been off with me for two days. What's going on?",
    }),
    say('b', "No. I've just been in my head. It's not you.", { soft: "I'm sorry. I didn't realise I was doing it. It's not you, I promise.", quiet: "No. It's not you." }),
    ['a', "Are you sure? Because it feels like me."],
    say('b', "I'm sure. I'm still in this. I still want this.", { romantic: "I'm sure. I'm still falling for you. I'm just bad at showing it sometimes." }),
    ['a', "Then show me a bit more. Please."],
    ['b', "I will."],
  ], beat: "{b} pulls {a} close, and {a} lets {b.obj}." },
  { when: { story: 'doubt', of: 'reassure', ...NOT_KISSED }, stage: "{a} and {b} sit down on the swing seat.", turns: [
    ['a', "Can I ask you something? Are we okay?"],
    ['b', "Why? Do you think we're not?"],
    ['a', "You've been quiet with me. You don't come and find me any more."],
    say('b', "I'm sorry. I didn't know you felt like that. We're okay. I promise.", { lad: "Sorry. I didn't clock it. We're good. Honestly." }),
    ['a', "Okay."],
  ], beat: "{b} puts an arm round {a}, and the swing seat rocks." },
  { when: { story: 'doubt', of: 'honest', why: 'eyes' }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    ['a', "You've been different with me. Just tell me the truth."],
    ['b', "Okay. I've been thinking about {c}."],
    ['a', "{c}?"],
    say('b', "I didn't want to. I'm sorry. I've been trying not to.", { lad: "I know. I'm sorry. I couldn't help it.", sharp: "Yes. I'm sorry. You asked." }),
    say('a', "How long?", { romantic: "So all this time, when I thought we were okay?" }),
    ['b', "A few days. I didn't want to hurt you."],
    ['a', "Well, you have."],
  ], beat: "{a} gets up and leaves, and {b} doesn't try to stop {a.obj}." },
  { when: { story: 'doubt', of: 'honest', why: ['cooling', 'behind'] }, stage: "{a} and {b} sit down on the end of the bed.", turns: [
    ['a', "You've been different with me. I need you to be honest."],
    say('b', "I don't feel the same as I did. I'm sorry.", { soft: "I'm so sorry. I don't feel what I felt at the start. I've been trying to.", lad: "I'm not feeling it like I was. I'm sorry." }),
    ['a', "Since when?"],
    ['b', "A few days. I kept hoping it would come back."],
    say('a', "And it hasn't.", { romantic: "I'm still all in. I'm still where I was on the first day." }),
    ['b', "No. I'm sorry."],
  ], beat: "They sit side by side, not touching." },
  { when: { story: 'doubt', of: 'honest', why: ['ick', 'played', 'triangle'] }, stage: "{a} and {b} sit down on the end of the bed.", turns: [
    ['a', "Something's changed. Please just tell me what."],
    say('b', "I'm not sure about us any more. I'm sorry.", { sharp: "I'm not sure about us. I'm not going to pretend I am." }),
    ['a', "Is it something I did?"],
    ['b', "I don't know how to explain it. It just feels different."],
    ['a', "Okay. Thank you for telling me."],
  ], beat: "{a} gets up, and goes to find somewhere to be on {a.posAdj} own." },
  { when: { story: 'doubt', of: 'deflect' }, stage: "{a} and {b} sit down on the end of the bed in the empty bedroom.", turns: [
    ['a', "You've been off with me. Is it something I've done?"],
    say('b', "No. I'm just tired. It's a lot in here.", { lad: "Nah. I'm just {~knackered}. It's a lot in here.", sharp: "I'm not off with you. You're imagining it." }),
    ['a', "It's more than tired. You barely talk to me."],
    ['b', "I'm talking to you now."],
    ['a', "That's not the same."],
    say('b', "I don't know what you want me to say.", { soft: "I'm sorry. I just can't do this conversation right now." }),
  ], beat: "{b} lies down and closes {b.posAdj} eyes. {a} stares at the ceiling." },
  { when: { story: 'doubt', of: 'deflect' }, stage: "{a} and {b} sit down on the swing seat.", turns: [
    ['a', "Where's your head at with us? Honestly."],
    ['b', "Honestly? I don't know where it's at with anything."],
    ['a', "That's not really an answer."],
    ['b', "It's the only one I've got."],
  ], beat: "{a} nods, and doesn't ask again." },
  // ── after a row today: the same question, with the row still in the air ──
  { when: { story: 'graft', of: 'reassure', rowedToday: true, ...NOT_KISSED }, stage: "{a} and {b} sit down on the end of the bed. Neither of them has said much since earlier.", turns: [
    ['a', "I don't want another fight. I just need to ask you one thing."],
    ['b', "Go on."],
    ['a', "Is any of this about {c}?"],
    say('b', "No. It's not about {c}. We argued because we're both stressed. I'm with you.", { lad: "No. It's not about {c}. We're just both wound up. I'm with you.", sharp: "No. And I'm tired of {c} being brought up every time we argue." }),
    ['a', "Okay. I'm sorry about earlier."],
    ['b', "Me too."],
  ], beat: "{b} reaches for {a.posAdj} hand, and {a} lets {b.obj} take it." },
  { when: { story: 'graft', of: 'honest', rowedToday: true, ...NOT_KISSED }, stage: "{a} and {b} sit down on the end of the bed. Neither of them has said much since earlier.", turns: [
    ['a', "That row earlier. It wasn't really about what we said, was it?"],
    ['b', "No."],
    ['a', "Then what's it about? Is it {c}?"],
    say('b', "Yes. I like {c}. I'm sorry. I've been taking it out on you, and that's not fair.", { lad: "Yeah. It's {c}. I'm sorry. I've been taking it out on you.", soft: "I think so. I'm sorry. I've been horrible to you because I feel guilty." }),
    say('a', "So that's why you've been picking fights.", { romantic: "I've been lying awake thinking it was me." }),
    ['b', "I'm sorry."],
  ], beat: "{a} gets up and walks out of the bedroom without another word." },
  { when: { story: 'graft', of: ['deflect', 'lie'], rowedToday: true }, stage: "{a} and {b} sit down on the end of the bed. Neither of them has said much since earlier.", turns: [
    ['a', "Can we talk about earlier? About why we're fighting?"],
    ['b', "We're fighting because you keep going on about {c}."],
    ['a', "I keep going on about {c} because you won't tell me anything."],
    say('b', "There's nothing to tell.", { sharp: "There's nothing to tell. I'm not doing this again." }),
    ['a', "Then why does it feel like there is?"],
    ['b', "I don't know. I'm going to sleep."],
  ], beat: "{b} turns over. {a} stays sitting up in the dark." },
  { when: { story: 'doubt', of: 'reassure', rowedToday: true }, stage: "{a} and {b} sit down on the end of the bed. Neither of them has said much since earlier.", turns: [
    ['a', "I hate how today's been. Are we okay?"],
    say('b', "We're okay. I've been off, I know. It's not you.", { lad: "We're okay. I've been off, I know. That's on me." }),
    ['a', "It feels like we keep fighting about nothing."],
    ['b', "I know. I'm sorry. I'm going to try harder."],
    ['a', "Me too."],
  ], beat: "{b} lies back, and {a} lies down next to {b.obj}." },
  { when: { story: 'doubt', of: ['honest', 'deflect'], rowedToday: true }, stage: "{a} and {b} sit down on the end of the bed. Neither of them has said much since earlier.", turns: [
    ['a', "Earlier wasn't about nothing. Something's wrong with us, and I need you to tell me what."],
    say('b', "I don't know what to say. I don't feel the way I did.", { sharp: "Fine. I'm not sure about us. That's what's wrong." }),
    ['a', "Since when?"],
    ['b', "I don't know. A few days."],
    ['a', "And you were going to tell me when?"],
    ['b', "I'm telling you now."],
  ], beat: "They sit on opposite ends of the bed, and neither of them moves." },
] } };
